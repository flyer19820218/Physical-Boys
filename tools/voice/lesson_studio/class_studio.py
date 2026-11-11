#!/usr/bin/env python3
"""彥君和曉臻錄音工作室（貼稿錄課版）

貼上整份對話稿 → 自動判斷每句是彥君老師（男聲）、曉臻助教（女聲）還是合聲 → 一句一句錄成 mp3。

稿子寫法（每行一句）：
    彥君： 同學們，今天我們來認識磁鐵。
    曉臻： 老師，磁鐵我們都很熟！
    合聲： 我們一起來看看吧！          （彥君＆曉臻：、彥君、曉臻： 也可以）
    ＊切頁：斷成兩半會怎樣？            （＊開頭的行是標記，不錄音，會原樣寫進 manifest.json）
行首的編號可寫可不寫（01 彥君：…），編號由程式自動排。
"""
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

try:
    import edge_tts
except ImportError:
    sys.exit("找不到 edge-tts，請先執行：pip3 install -U edge-tts")

FILE_NAME = {"彥君": "yanjun", "曉臻": "xiaozhen", "合聲": "hesheng"}  # 輸出音檔用英文檔名
VOICE = {"彥君": "zh-TW-YunJheNeural", "曉臻": "zh-TW-HsiaoChenNeural"}
LABEL = {"彥君": "彥君老師・男聲", "曉臻": "曉臻助教・女聲", "合聲": "合聲・兩人一起"}
ALIAS = {
    "彥君": "彥君", "彥君老師": "彥君", "老師": "彥君", "雲哲": "彥君", "雲哲老師": "彥君",
    "曉臻": "曉臻", "曉臻助教": "曉臻", "助教": "曉臻",
}
CHORUS = {"合", "合聲", "齊聲", "同聲", "兩人", "一起", "全體"}
RATE_RE = re.compile(r"^[+-]\d{1,3}%$")
PITCH_RE = re.compile(r"^[+-]\d{1,3}Hz$")
LINE_RE = re.compile(r"^(?:\d+[\s.、．)]*)?([^：:]{1,16}?)\s*[：:]\s*(.+)$")
ROOT = Path.home() / "Desktop" / "課程錄音"
DEFAULTS = {"彥君": ("-10%", "+0Hz"), "曉臻": ("+10%", "+5Hz")}  # 曉臻是 AGENTS 14.3 驗證過的組合


# ───────────────────────── 解析稿子 ─────────────────────────
def resolve_who(who):
    w = re.sub(r"\s+", "", who)
    if w in CHORUS:
        return "合聲"
    names = set()
    for p in [p for p in re.split(r"[＆&+＋、,，和與/]", w) if p]:
        if p not in ALIAS:
            return None
        names.add(ALIAS[p])
    if len(names) == 2:
        return "合聲"
    return names.pop() if len(names) == 1 else None


# 讀音字典：左邊是稿子裡寫的字，右邊是語音要念的字。
# 之後發現哪個字念不準，就加一行在這裡；改完按「開始錄音」，只有受影響的句子會重錄。
PRON = [
    ("艾斯", "誒死"),   # 老師確認：讀音「ㄟ死」，以「誒」字寫出
    # 老師指示（2026-11-11）：所有的「差」都讀一聲（叉），寫成同音的「插」。
    # 注意：這是全站字典，之後新錄的單元都會生效；已錄好的舊音檔不會自動重錄。
    ("差", "插"),
    # 老師指示（2026-11-11）：動詞「量」（測量）唸二聲，語音常誤唸四聲；寫成同音的「良」（ㄌㄧㄤˊ）。
    # 名詞或量程（力量、電量、能量、量程）維持四聲，不改。
    ("量電流", "良電流"),
    ("量電壓", "良電壓"),
    ("量兩點", "良兩點"),
    ("要量的", "要良的"),
    ("量到", "良到"),
    # 老師指示（2026-11-11）：數學用語「倒數」的「數」要唸三聲（shǔ），寫成同音的「署」。
    # 「次數」「指數」等「數」本來就是四聲，不改。
    ("倒數", "倒署"),
]


def tts_text(t):
    """讀音稿：N極→恩極、S極→誒死（老師確認：讀音ㄟ死），再套用讀音字典。"""
    t = re.sub(r"[NＮ](?=\s*極)", "恩", t)
    t = re.sub(r"[SＳ](?=\s*極)", "誒死", t)
    for src, dst in PRON:
        t = t.replace(src, dst)
    return t


def parse_script(text):
    rows = []
    for no, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line[0] in "＊*":
            rows.append({"kind": "marker", "src": no, "text": line})
            continue
        m = LINE_RE.match(line)
        if not m:
            rows.append({"kind": "error", "src": no, "text": line,
                         "msg": "找不到「說話者：內容」，行首請寫「彥君：」「曉臻：」或「合聲：」"})
            continue
        speaker = resolve_who(m.group(1))
        if speaker is None:
            rows.append({"kind": "error", "src": no, "text": line,
                         "msg": "不認得說話者「%s」，可用：彥君、曉臻、合聲" % m.group(1).strip()})
            continue
        body = m.group(2).strip()
        tts = tts_text(body)
        warn = []
        if re.search(r"[A-Za-z]", body):
            warn.append("含英文字母，語音可能念不準，請改成中文讀法")
        if re.search(r"\d", tts):
            warn.append("含阿拉伯數字，請改成中文數字")
        rows.append({"kind": "line", "src": no, "speaker": speaker, "text": body, "tts": tts, "warn": warn})
    n = sum(1 for r in rows if r["kind"] == "line")
    width = max(2, len(str(n)))
    k = 0
    for r in rows:
        if r["kind"] == "line":
            k += 1
            r["id"] = str(k).zfill(width)
    return rows


# ───────────────────────── 錄音 ─────────────────────────
def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    for c in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"):
        if Path(c).exists():
            return c
    return None


async def _save(text, voice, rate, pitch, path):
    kw = {}
    if rate:
        kw["rate"] = rate
    if pitch:
        kw["pitch"] = pitch
    await edge_tts.Communicate(text, voice, **kw).save(str(path))
    if Path(path).stat().st_size < 1000:
        raise RuntimeError("檔案太小，可能是空的")


def synth(text, voice, rate, pitch, path):
    """先用完整參數；沒聲音就退一步只用語速，再不行就用預設值。"""
    rate = None if rate in (None, "+0%") else rate
    pitch = None if pitch in (None, "+0Hz") else pitch
    chain = []
    for c in ((rate, pitch), (rate, None), (None, None)):
        if c not in chain:
            chain.append(c)
    last = None
    for ci, (r, p) in enumerate(chain):
        for _ in range(2):
            try:
                asyncio.run(_save(text, voice, r, p, path))
                return {"rate": r, "pitch": p, "fellback": ci > 0}
            except Exception as e:  # noqa: BLE001  網路抖動、被限流、No audio
                last = e
                Path(path).unlink(missing_ok=True)
                time.sleep(1.5)
    raise RuntimeError(str(last))


def mix(a, b, out, ff):
    cmd = [ff, "-y", "-loglevel", "error", "-i", str(a), "-i", str(b), "-filter_complex",
           "amix=inputs=2:duration=longest:dropout_transition=0,volume=2,alimiter=limit=0.95",
           "-ac", "1", "-ar", "24000", "-b:a", "64k", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not Path(out).exists() or Path(out).stat().st_size < 1000:
        raise RuntimeError("合聲混音失敗：" + (r.stderr or "").strip()[-200:])


STATE = {"running": False, "finished": False, "rows": {}, "folder": "", "lesson": "", "ffmpeg": True, "message": ""}
LOCK = threading.Lock()


def _set(rid, **kw):
    with LOCK:
        STATE["rows"].setdefault(rid, {}).update(kw)


def run_job(rows, lesson, S, force, only, final=True):
    outdir = ROOT / lesson
    (outdir / "_tracks").mkdir(parents=True, exist_ok=True)
    old = {}
    try:
        for e in json.loads((outdir / "manifest.json").read_text("utf-8")).get("items", []):
            if e.get("kind") == "line":
                old[e["id"]] = e
    except Exception:  # noqa: BLE001
        pass
    ff = find_ffmpeg()
    with LOCK:
        STATE.update(running=True, finished=False, folder=str(outdir), lesson=lesson, ffmpeg=bool(ff), message="",
                     rows={r["id"]: {"state": "wait", "msg": ""} for r in rows if r["kind"] == "line"})
    items = []
    try:
        for row in rows:
            if row["kind"] == "marker":
                items.append({"kind": "marker", "text": row["text"]})
                continue
            if row["kind"] != "line":
                continue
            rid, spk = row["id"], row["speaker"]
            chorus = spk == "合聲"
            voices = ["彥君", "曉臻"] if chorus else [spk]
            key = hashlib.sha1(json.dumps([row["tts"], [(v, S[v]) for v in voices]], ensure_ascii=False)
                               .encode()).hexdigest()[:12]
            fid = rid.zfill(3)  # 檔名一律三位數句號，例如 001、027
            tracks = {v: ("_tracks/%s_%s.mp3" % (fid, FILE_NAME[v])) if chorus else "%s_%s.mp3" % (fid, FILE_NAME[v])
                      for v in voices}
            final = "%s_%s.mp3" % (fid, FILE_NAME["合聲"]) if chorus else tracks[spk]
            # 舊版中文檔名（NN_彥君.mp3 等）：找不到英文檔名時沿用，不強迫重錄
            legacy = {}
            for new in list(tracks.values()) + [final]:
                sub, _, base = new.rpartition("/")
                m = re.match(r"^\d+_(\w+)\.mp3$", base)
                zh = next((k for k, v in FILE_NAME.items() if m and v == m.group(1)), None)
                legacy[new] = (sub + "/" if sub else "") + "%s_%s.mp3" % (rid, zh) if zh else new

            def ok(p):
                f = outdir / p
                return f.exists() and f.stat().st_size > 1000

            def use(p):  # 英文檔名存在就用英文，否則若舊中文檔名存在就沿用它
                return p if ok(p) or not ok(legacy.get(p, p)) else legacy[p]

            have = ok(use(final)) if (not chorus or ff) else all(ok(use(p)) for p in tracks.values())
            cached = old.get(rid, {}).get("key") == key and have
            target = only is None or rid in only
            entry = {"kind": "line", "id": rid, "speaker": spk, "text": row["text"], "tts": row["tts"], "key": key,
                     "file": use(final) if ok(use(final)) else None, "tracks": tracks if chorus else None, "params": {}}
            if cached and not (force and target):
                _set(rid, state="skip", msg="已有，沿用", file=use(final) if ok(use(final)) else None)
            elif not target:
                _set(rid, state="wait", msg="這次沒錄")
            else:
                _set(rid, state="doing", msg="錄音中…")
                try:
                    notes = []
                    for v in voices:
                        info = synth(row["tts"], VOICE[v], S[v][0], S[v][1], outdir / tracks[v])
                        entry["params"][v] = info
                        if info["fellback"]:
                            notes.append("%s 改用較保守的參數" % v)
                    if chorus:
                        if ff:
                            mix(outdir / tracks["彥君"], outdir / tracks["曉臻"], outdir / final, ff)
                            entry["file"] = final
                        else:
                            notes.append("電腦沒有 ffmpeg，兩人的聲音先分開存（_tracks 資料夾）")
                    else:
                        entry["file"] = final
                    _set(rid, state="ok", msg="；".join(notes), file=entry["file"] or tracks["彥君"])
                except Exception as e:  # noqa: BLE001
                    entry["file"] = None
                    _set(rid, state="err", msg=str(e))
            items.append(entry)
        (outdir / "manifest.json").write_text(
            json.dumps({"lesson": lesson, "settings": S, "items": items}, ensure_ascii=False, indent=2), "utf-8")
    except Exception as e:  # noqa: BLE001
        with LOCK:
            STATE["message"] = "中途出錯：%s" % e
    finally:
        if final:
            with LOCK:
                STATE.update(running=False, finished=True)


def run_auto(rows, lesson, S, force, only):
    """整份錄完後，自動把失敗的句子再錄最多兩輪。"""
    run_job(rows, lesson, S, force, only, final=False)
    for rnd in range(1, 3):
        with LOCK:
            bad = {k for k, v in STATE["rows"].items() if v.get("state") == "err"}
            if not bad or STATE["message"].startswith("中途"):
                break
            STATE["message"] = "第 %d 次自動重錄 %d 句…" % (rnd, len(bad))
        time.sleep(8 * rnd)
        run_job(rows, lesson, S, True, bad, final=False)
    with LOCK:
        bad = sorted(k for k, v in STATE["rows"].items() if v.get("state") == "err")
        if bad and not STATE["message"].startswith("中途"):
            STATE["message"] = "仍有 %d 句失敗（%s），可以按該句的「重錄」再試。" % (len(bad), "、".join(bad))
        STATE.update(running=False, finished=True)


def pick_lesson(data):
    """重錄時一定沿用上一次的課程資料夾，避免存到「未命名」。"""
    with LOCK:
        last = STATE.get("lesson") or ""
    if (data.get("only") or not str(data.get("lesson", "")).strip()) and last:
        return last
    return clean_lesson(data.get("lesson"))


def clean_lesson(name):
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "", (name or "")).strip().strip(".")
    return name[:60] or "未命名_" + datetime.now().strftime("%Y%m%d-%H%M")


def get_settings(d):
    def pick(v, rx, default):
        return v if isinstance(v, str) and rx.match(v) else default
    return {
        "彥君": (pick(d.get("rate_y"), RATE_RE, DEFAULTS["彥君"][0]), pick(d.get("pitch_y"), PITCH_RE, DEFAULTS["彥君"][1])),
        "曉臻": (pick(d.get("rate_x"), RATE_RE, DEFAULTS["曉臻"][0]), pick(d.get("pitch_x"), PITCH_RE, DEFAULTS["曉臻"][1])),
    }


# ───────────────────────── 網頁 ─────────────────────────
PAGE = r"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>彥君和曉臻錄音工作室</title>
<style>
  :root {
    --bg:#eef2f6; --panel:#fff; --ink:#14212e; --muted:#5b6b7b; --line:#d5dde6;
    --accent:#0f6fb5; --accent-ink:#fff; --accent-soft:#e2f0fa; --ok:#12795a; --warn:#8a5a00; --warn-soft:#fff3d6;
    --err:#b3261e; --err-soft:#fbe9e7; --m:#1d5fa8; --f:#b0356b; --c:#6a3fb5;
    --display:"Noto Serif TC","Songti TC","PingFang TC","Microsoft JhengHei",serif;
    --body:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#0d141b; --panel:#151f29; --ink:#e6edf4; --muted:#93a4b5; --line:#263543;
      --accent:#4aa8e8; --accent-ink:#06141f; --accent-soft:#142c3f; --ok:#4cc9a0; --warn:#f0c060; --warn-soft:#3a2f12;
      --err:#ff8a80; --err-soft:#3a1c1a; --m:#7db8f0; --f:#f08ab8; --c:#b99cf0; color-scheme: dark;
    }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.65 var(--body); padding:28px 16px 64px; }
  .wrap { max-width:1080px; margin:0 auto; display:grid; gap:18px; }
  h1 { font:700 27px/1.25 var(--display); margin:0 0 4px; }
  header p { margin:0; color:var(--muted); }
  .grid { display:grid; gap:18px; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); align-items:start; }
  @media (max-width:860px) { .grid { grid-template-columns:minmax(0,1fr); } }
  .panel { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:18px; display:grid; gap:14px; min-width:0; }
  h2 { font:700 13px/1 var(--body); letter-spacing:.12em; color:var(--muted); margin:0; }
  label { display:grid; gap:5px; font-weight:500; font-size:14px; min-width:0; }
  .hint { font-weight:400; color:var(--muted); font-size:13px; }
  input[type=text], textarea { font:15px/1.5 var(--body); color:var(--ink); background:var(--bg); border:1px solid var(--line);
    border-radius:8px; padding:10px 12px; width:100%; min-width:0; }
  textarea { min-height:300px; resize:vertical; line-height:1.8; }
  :focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  input[type=range] { width:100%; accent-color:var(--accent); }
  .two { display:grid; gap:12px; grid-template-columns:repeat(2,minmax(0,1fr)); }
  .vbox { border:1px solid var(--line); border-radius:8px; padding:10px 12px; display:grid; gap:8px; }
  .vbox b { font-size:14px; }
  .check { display:flex; gap:8px; align-items:center; font-weight:400; color:var(--muted); font-size:13px; }
  .go { font:700 16px var(--body); border:0; border-radius:8px; background:var(--accent); color:var(--accent-ink); padding:14px 18px; cursor:pointer; }
  .go:disabled { opacity:.5; cursor:not-allowed; }
  .ghost { font:500 13px var(--body); border:1px solid var(--line); background:transparent; color:var(--ink); padding:6px 11px; border-radius:7px; cursor:pointer; }
  .ghost:hover { border-color:var(--accent); }
  .bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .sum { color:var(--muted); font-size:13px; }
  .note { border-radius:8px; padding:9px 12px; font-size:13.5px; background:var(--accent-soft); }
  .note.err { background:var(--err-soft); color:var(--err); }
  .note.warn { background:var(--warn-soft); color:var(--warn); }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  td { border-top:1px solid var(--line); padding:8px 6px; vertical-align:top; }
  td.n { width:34px; color:var(--muted); font-variant-numeric:tabular-nums; }
  td.who { width:92px; white-space:nowrap; }
  td.st { width:190px; font-size:13px; color:var(--muted); }
  td.act { width:128px; text-align:right; white-space:nowrap; }
  .tag { display:inline-block; font-size:12px; padding:1px 8px; border-radius:99px; border:1px solid currentColor; }
  .tag.m { color:var(--m); } .tag.f { color:var(--f); } .tag.c { color:var(--c); }
  tr.mk td { color:var(--muted); font-size:13px; background:var(--bg); }
  tr.er td { color:var(--err); background:var(--err-soft); }
  .rd { color:var(--muted); font-size:12.5px; }
  .w { color:var(--warn); font-size:12.5px; }
  .s-ok { color:var(--ok); } .s-err { color:var(--err); } .s-doing { color:var(--accent); }
  .empty { color:var(--muted); border:1px dashed var(--line); border-radius:8px; padding:22px 14px; text-align:center; }
  @media (max-width:640px) { td.st, td.act { width:auto; } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>彥君和曉臻錄音工作室</h1>
    <p>把對話稿整份貼進來，程式會自己分男聲、女聲、合聲，一句一句錄好。</p>
  </header>
  <div class="grid">
    <section class="panel">
      <h2>1　貼上對話稿</h2>
      <textarea id="script" spellcheck="false" placeholder="彥君： 同學們，今天我們來認識磁鐵。
曉臻： 老師，磁鐵我們都很熟！
合聲： 我們一起來看看吧！
＊切頁：斷成兩半會怎樣？
彥君： 把一塊磁鐵用細線吊起來。"></textarea>
      <div class="hint">每行一句，行首寫「彥君：」「曉臻：」「合聲：」。「彥君＆曉臻：」也算合聲。＊ 開頭的行是標記，不錄音。</div>
    </section>
    <section class="panel">
      <h2>2　設定與開始</h2>
      <label>課程名稱（錄好的檔案會放在 桌面／課程錄音／這個名字）
        <input type="text" id="lesson" placeholder="例如：磁力與磁場">
      </label>
      <div class="vbox"><b>彥君老師・男聲（雲哲）</b>
        <label>語速 <span id="ryv"></span><input type="range" id="ry" min="-30" max="40" value="10"></label>
        <label>音調 <span id="pyv"></span><input type="range" id="py" min="-30" max="30" value="0"></label>
      </div>
      <div class="vbox"><b>曉臻助教・女聲</b>
        <label>語速 <span id="rxv"></span><input type="range" id="rx" min="-30" max="40" value="10"></label>
        <label>音調 <span id="pxv"></span><input type="range" id="px" min="-30" max="30" value="5"></label>
      </div>
      <label class="check"><input type="checkbox" id="force"> 全部重錄（不勾的話，沒改過的句子會直接沿用）</label>
      <button class="go" id="go" disabled>開始錄音</button>
      <div class="bar"><button class="ghost" id="openf" hidden>開啟資料夾</button></div>
      <div id="msg"></div>
    </section>
  </div>
  <section class="panel">
    <h2>3　逐句檢查與試聽</h2>
    <div class="sum" id="sum"></div>
    <div id="tbl"><div class="empty">貼上稿子後，這裡會列出每一句由誰來念。</div></div>
  </section>
</div>
<audio id="aud"></audio>
<script>
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var rows = [], job = {rows: {}}, lessonDir = "", timer = null, parseT = null, hasErr = false;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function sg(v, u) { v = parseInt(v, 10); return (v >= 0 ? "+" : "") + v + u; }
  function labels() { $("ryv").textContent = sg($("ry").value, "%"); $("pyv").textContent = sg($("py").value, "Hz");
    $("rxv").textContent = sg($("rx").value, "%"); $("pxv").textContent = sg($("px").value, "Hz"); }
  function settings() { return {rate_y: sg($("ry").value, "%"), pitch_y: sg($("py").value, "Hz"),
    rate_x: sg($("rx").value, "%"), pitch_x: sg($("px").value, "Hz")}; }
  function save() { try { localStorage.setItem("cs_script", $("script").value); localStorage.setItem("cs_lesson", $("lesson").value); } catch (e) {} }
  function note(t, c) { $("msg").innerHTML = t ? '<div class="note ' + (c || "") + '">' + esc(t) + "</div>" : ""; }
  function tag(s) { return '<span class="tag ' + (s === "彥君" ? "m" : s === "曉臻" ? "f" : "c") + '">' + esc(s) + "</span>"; }

  function render() {
    var n = 0, c = {"彥君": 0, "曉臻": 0, "合聲": 0}, html = "";
    hasErr = false;
    rows.forEach(function (r) {
      if (r.kind === "marker") { html += '<tr class="mk"><td colspan="5">' + esc(r.text) + "</td></tr>"; return; }
      if (r.kind === "error") { hasErr = true;
        html += '<tr class="er"><td class="n">行' + r.src + '</td><td colspan="3">' + esc(r.msg) + "<br>" + esc(r.text) + "</td></tr>"; return; }
      n++; c[r.speaker]++;
      var j = job.rows[r.id] || {}, st = "", cls = "";
      if (j.state === "ok") { st = "✅ 完成"; cls = "s-ok"; } else if (j.state === "skip") { st = "✅ 已有"; cls = "s-ok"; }
      else if (j.state === "doing") { st = "⏳ 錄音中…"; cls = "s-doing"; } else if (j.state === "err") { st = "❌ 失敗"; cls = "s-err"; }
      if (j.msg && j.state !== "doing") st += "<br>" + esc(j.msg);
      var act = "";
      if (j.file) act += '<button class="ghost" data-a="play" data-i="' + r.id + '">▶ 播放</button> ';
      if (!job.running) act += '<button class="ghost" data-a="redo" data-i="' + r.id + '">重錄</button>';
      html += "<tr><td class=\"n\">" + r.id + "</td><td class=\"who\">" + tag(r.speaker) + "</td><td>" + esc(r.text) +
        (r.tts !== r.text ? '<div class="rd">讀作：' + esc(r.tts) + "</div>" : "") +
        (r.warn || []).map(function (w) { return '<div class="w">⚠ ' + esc(w) + "</div>"; }).join("") +
        '</td><td class="st ' + cls + '">' + st + '</td><td class="act">' + act + "</td></tr>";
    });
    $("tbl").innerHTML = n || html ? "<table>" + html + "</table>" : '<div class="empty">貼上稿子後，這裡會列出每一句由誰來念。</div>';
    $("sum").textContent = n ? "共 " + n + " 句：彥君 " + c["彥君"] + "・曉臻 " + c["曉臻"] + "・合聲 " + c["合聲"] : "";
    $("go").disabled = !n || hasErr || !!job.running;
    if (hasErr) note("有幾行看不懂（紅色），修好才能錄。", "err"); else if (!job.running && !job.finished) note("");
  }

  function parse() {
    fetch("/parse", {method: "POST", body: JSON.stringify({script: $("script").value})})
      .then(function (r) { return r.json(); }).then(function (d) { rows = d.rows || []; render(); });
  }
  function poll() {
    fetch("/status").then(function (r) { return r.json(); }).then(function (s) {
      job = s; lessonDir = s.lesson || lessonDir; $("openf").hidden = !s.folder;
      var done = 0, tot = 0, bad = 0;
      Object.keys(s.rows).forEach(function (k) { tot++; var t = s.rows[k].state;
        if (t === "ok" || t === "skip") done++; if (t === "err") bad++; });
      if (s.running) { note("錄音中… " + done + " / " + tot); timer = setTimeout(poll, 700); }
      else if (s.finished) {
        var m = "錄完了：" + done + " / " + tot + " 句成功" + (bad ? "，" + bad + " 句失敗（可按該句的「重錄」）" : "") + "。";
        if (!s.ffmpeg) m += " 這台電腦沒有 ffmpeg，合聲句先存成兩軌；在終端機執行 brew install ffmpeg 後再按一次開始錄音就會合成。";
        if (s.message) m += " " + s.message;
        note(m, bad || !s.ffmpeg ? "warn" : "");
      }
      render();
    });
  }
  function start(only) {
    note("準備中…");
    fetch("/record", {method: "POST", body: JSON.stringify({script: $("script").value, lesson: $("lesson").value,
      settings: settings(), force: $("force").checked || !!only, only: only || null})})
      .then(function (r) { return r.json(); }).then(function (d) {
        if (d.error) { note(d.error, "err"); return; }
        job = {running: true, rows: {}}; poll(); });
  }
  $("tbl").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var id = b.getAttribute("data-i");
    if (b.getAttribute("data-a") === "redo") start([id]);
    else if (b.getAttribute("data-a") === "play") {
      var f = job.rows[id] && job.rows[id].file; if (!f) return;
      $("aud").src = "/audio?d=" + encodeURIComponent(lessonDir) + "&f=" + encodeURIComponent(f) + "&t=" + Date.now();
      $("aud").play().catch(function () {});
    }
  });
  $("go").onclick = function () { start(null); };
  $("openf").onclick = function () { fetch("/open", {method: "POST"}); };
  $("script").addEventListener("input", function () { save(); clearTimeout(parseT); parseT = setTimeout(parse, 250); });
  $("lesson").addEventListener("input", save);
  ["ry", "py", "rx", "px"].forEach(function (i) { $(i).addEventListener("input", labels); });
  try { $("script").value = localStorage.getItem("cs_script") || ""; $("lesson").value = localStorage.getItem("cs_lesson") || ""; } catch (e) {}
  labels(); parse(); poll();
})();
</script>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype, extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj, code=200):
        self._send(code, json.dumps(obj, ensure_ascii=False).encode(), "application/json; charset=utf-8")

    def _local(self):
        host = self.headers.get("Host", "")
        if not (host.startswith("127.0.0.1") or host.startswith("localhost")):
            self._json({"error": "只允許本機連線"}, 403)
            return False
        return True

    def do_GET(self):
        if not self._local():
            return
        u = urlparse(self.path)
        if u.path in ("/", "/index.html"):
            self._send(200, PAGE.encode("utf-8"), "text/html; charset=utf-8")
        elif u.path == "/status":
            with LOCK:
                self._json(json.loads(json.dumps(STATE)))
        elif u.path == "/audio":
            q = parse_qs(u.query)
            try:
                p = (ROOT / q["d"][0] / q["f"][0]).resolve()
                if ROOT.resolve() not in p.parents or p.suffix != ".mp3" or not p.exists():
                    raise ValueError
            except Exception:  # noqa: BLE001
                return self._json({"error": "找不到檔案"}, 404)
            self._send(200, p.read_bytes(), "audio/mpeg")
        else:
            self._json({"error": "找不到頁面"}, 404)

    def do_POST(self):
        if not self._local():
            return
        try:
            n = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(n) or b"{}")
        except Exception:  # noqa: BLE001
            return self._json({"error": "資料格式錯誤"}, 400)
        if self.path == "/parse":
            return self._json({"rows": parse_script(str(data.get("script", "")))})
        if self.path == "/open":
            with LOCK:
                folder = STATE.get("folder")
            if folder and Path(folder).exists():
                subprocess.Popen(["open", folder])
            return self._json({"ok": True})
        if self.path == "/record":
            rows = parse_script(str(data.get("script", "")))
            if any(r["kind"] == "error" for r in rows):
                return self._json({"error": "稿子裡還有看不懂的行，請先修好。"}, 400)
            if not any(r["kind"] == "line" for r in rows):
                return self._json({"error": "稿子是空的。"}, 400)
            only = data.get("only")
            only = set(str(x) for x in only) if isinstance(only, list) else None
            with LOCK:
                if STATE["running"]:
                    return self._json({"error": "上一輪還在錄，請等它結束。"}, 409)
                STATE.update(running=True, finished=False)
            threading.Thread(target=run_auto, daemon=True, args=(
                rows, pick_lesson(data), get_settings(data.get("settings") or {}),
                bool(data.get("force")), only)).start()
            return self._json({"ok": True})
        self._json({"error": "找不到頁面"}, 404)


def main():
    server = None
    for port in range(8765, 8776):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if server is None:
        sys.exit("8765–8775 的連接埠都被佔用了，請先關掉其他程式再試。")
    url = "http://127.0.0.1:%d/" % server.server_address[1]
    print("彥君和曉臻錄音工作室已啟動：%s\n關閉請在這個視窗按 Ctrl+C" % url)
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已關閉。")


if __name__ == "__main__":
    main()
