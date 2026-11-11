#!/usr/bin/env python3
"""從稿子一鍵產生 manifest.json、stage.json、stage_spec.md（magnetism_1）。

用法（在 repo 根目錄）：
    python3 tools/voice/lesson_studio/build_lesson.py
    python3 tools/voice/lesson_studio/build_lesson.py --script 稿子.txt --out audio/magnetism_1

驗證全部通過才會寫檔；任何一項失敗就列出原因、不寫任何檔案。
稿子規則見 AGENTS_VOICE.md 第 4、5 節。
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
LESSON = "magnetism_1"
PAGE = "magnetism_1.html"
DEFAULT_SCRIPT = REPO / "tools/voice/lesson_studio/scripts/magnetism_1_script.txt"
DEFAULT_OUT = REPO / "audio" / LESSON

EXPECT_LINES = 106
EXPECT_CHORUS = [27, 75, 90]

FILE_NAME = {"彥君": "yanjun", "曉臻": "xiaozhen", "合聲": "hesheng"}
SETTINGS = {"彥君": ["-10%", "+0Hz"], "曉臻": ["+10%", "+5Hz"]}  # 同 class_studio.py 的 DEFAULTS
LINE_RE = re.compile(r"^([^：:]{1,16}?)\s*[：:]\s*(.+)$")

# 切頁：＊切頁 標題 → 要切到的分頁／子頁
CUTS = {
    "斷成兩半會怎樣？": ("tab-pole", "pole-suspend"),
    "鐵釘怎麼變磁鐵？": ("tab-mag", "mag-process"),
    "看不見的線？": ("tab-line", "line-bar"),
    "指針為何轉向？": ("tab-compass", "compass-tangent"),
    "地球是大磁鐵？": ("tab-earth", "earth-surface"),
}
# 該子頁動畫有幾個步驟按鈕（用來檢查 at 的步驟編號沒有超出）
STEPS = {
    "pole-suspend": 4, "pole-interact": 5, "pole-break": 5,
    "mag-process": 5, "mag-store": 5,
    "line-bar": 5, "line-u": 4,
    "compass-tangent": 4, "compass-space": 4,
    "earth-surface": 4, "earth-core": 4,
}
# 播到第 N 句（說話行編號）時：切到哪個子頁、播到動畫的第幾步。
# 原則：講到什麼，畫面就要自動切到有那個動畫的頁面，學生才不用自己找。
ACTS = {}   # 句中換畫面（預設沒有；由 lessons/<課>.json 的 acts 提供）
AT = {
    # ── 磁鐵與磁極 ──
    9:   ("tab-pole", "pole-suspend", 1),     # 用細線吊起來、自由旋轉
    13:  ("tab-pole", "pole-suspend", 2),     # 撥轉幾次都擺回南北
    14:  ("tab-pole", "pole-suspend", 4),     # 指南針的原理（地球磁場）
    15:  ("tab-pole", "pole-interact", 1),    # 磁極如何互動（異名相吸）
    16:  ("tab-pole", "pole-interact", 2),    # 同名排斥
    18:  ("tab-pole", "pole-interact", 1),    # 誰吸誰：恩極與艾斯極互相吸
    19:  ("tab-pole", "pole-interact", 2),    # 同名極：恩極碰恩極
    20:  ("tab-pole", "pole-interact", 5),    # 結論：成對出現
    21:  ("tab-pole", "pole-break", 1),       # 折斷磁鐵
    22:  ("tab-pole", "pole-break", 2),       # 斷口出現新磁極
    24:  ("tab-pole", "pole-break", 5),       # 單極磁鐵不存在
    26:  ("tab-mag", "mag-process", 1),       # 「到下一頁看磁疇」：同時切過去
    # ── 磁化與保存 ──
    29:  ("tab-mag", "mag-process", 1),       # 磁疇＝小磁鐵
    31:  ("tab-mag", "mag-process", 2),       # 磁疇排成同一方向
    36:  ("tab-mag", "mag-process", 1),       # 普通鐵釘吸不起迴紋針
    38:  ("tab-mag", "mag-process", 2),       # 外加磁場讓磁疇轉向
    42:  ("tab-mag", "mag-process", 3),       # 鐵鎚敲
    44:  ("tab-mag", "mag-process", 4),       # 加熱
    46:  ("tab-mag", "mag-process", 5),       # 磁性物質：鐵、鈷、鎳
    47:  ("tab-mag", "mag-store", 1),         # 軟鐵與鋼誰比較快磁化
    52:  ("tab-mag", "mag-store", 2),         # 鋼的磁性能長久保存
    53:  ("tab-mag", "mag-store", 3),         # 軟鐵做鐵心、鋼做永久磁鐵
    56:  ("tab-mag", "mag-store", 4),         # 長條形磁鐵的保存
    58:  ("tab-mag", "mag-store", 5),         # U 形磁鐵的保存
    # ── 磁力線 ──
    60:  ("tab-line", "line-bar", 1),         # 撒鐵粉
    62:  ("tab-line", "line-bar", 2),         # 輕敲，鐵粉排成曲線
    64:  ("tab-line", "line-bar", 3),         # 畫出磁力線
    68:  ("tab-line", "line-bar", 4),         # 異名極相對
    70:  ("tab-line", "line-bar", 5),         # 同名極相對
    71:  ("tab-line", "line-u", 1),           # 馬蹄形磁鐵
    72:  ("tab-line", "line-u", 3),           # 兩極之間磁力線平行
    74:  ("tab-line", "line-u", 4),           # 均勻的強磁場
    # ── 磁場方向與指南針 ──
    76:  ("tab-compass", "compass-tangent", 1),  # 指南針放進磁場
    78:  ("tab-compass", "compass-tangent", 2),  # 沿著磁力線移動
    80:  ("tab-compass", "compass-tangent", 3),  # 什麼是切線
    82:  ("tab-compass", "compass-space", 1),    # 磁針被誰吸引（異名相吸）
    84:  ("tab-compass", "compass-space", 2),    # 磁鐵四周擺很多磁針
    85:  ("tab-compass", "compass-space", 3),    # 順著箭頭的切線方向
    86:  ("tab-compass", "compass-space", 4),    # 考試技巧
    88:  ("tab-compass", "compass-tangent", 4),  # 最重要：N 極所指＝磁場方向
    # ── 地球大磁鐵 ──
    91:  ("tab-earth", "earth-surface", 1),   # 指南針為什麼指北
    93:  ("tab-earth", "earth-surface", 3),   # 地球是一塊大磁鐵
    95:  ("tab-earth", "earth-surface", 2),   # 地球周圍的磁場線
    96:  ("tab-earth", "earth-surface", 4),   # 地磁場像盾牌
    99:  ("tab-earth", "earth-core", 1),      # 北方是誰在吸引 N 極
    100: ("tab-earth", "earth-core", 3),      # 異名相吸的推理
    101: ("tab-earth", "earth-core", 2),      # 透視地球內部
    102: ("tab-earth", "earth-core", 4),      # 地磁南北極與夾角十一度
}
# 字幕：念的字 → 畫面字（其餘字不變）
SUB_MAP = [("恩極", "N 極"), ("艾斯極", "S 極")]


def parse(text):
    """回傳 (items, errors)。items 的 line 帶 n（1 起算的說話行編號）與 src（原始行號）。"""
    items, errors, n = [], [], 0
    for no, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line[0] in "＊*":
            m = re.match(r"^[＊*]\s*(切頁|停|釘選)\s*[：:]\s*(.+)$", line)
            if not m:
                errors.append("第 %d 行：看不懂的標記行「%s」" % (no, line))
                continue
            items.append({"kind": "marker", "text": line, "mtype": m.group(1), "arg": m.group(2).strip(), "src": no})
            continue
        m = LINE_RE.match(line)
        who = m.group(1).strip() if m else ""
        if not m or who not in FILE_NAME:
            errors.append("第 %d 行：說話者不是彥君／曉臻／合聲：「%s」" % (no, line))
            continue
        n += 1
        items.append({"kind": "line", "n": n, "src": no, "speaker": who, "text": m.group(2).strip()})
    return items, errors


def grep_has(html, attr, value):
    """用 grep 檢查 html 裡有沒有 attr="value"（不整份讀進來）。"""
    r = subprocess.run(["grep", "-qF", '%s="%s"' % (attr, value), str(html)])
    return r.returncode == 0


def validate(items, errors, warnings):
    lines = [i for i in items if i["kind"] == "line"]
    # 1. 讀音稿：儘量不用英文字母（化學等單元必要時允許，只提醒）；說話行與切頁、釘選不得有阿拉伯數字
    for i in items:
        if i["kind"] == "line":
            body, label = i["text"], "說話行"
        elif i["mtype"] in ("切頁", "釘選"):
            body, label = i["arg"], "＊" + i["mtype"]
        else:
            if not re.fullmatch(r"\d+(\.\d+)?", i["arg"]):
                errors.append("第 %d 行：＊停 後面要是秒數：「%s」" % (i["src"], i["text"]))
            continue
        if re.search(r"[A-Za-zＡ-Ｚａ-ｚ]", body):
            warnings.append("第 %d 行（%s）含英文字母（允許，請確認讀音）：%s" % (i["src"], label, body))
        if re.search(r"[0-9０-９]", body):
            errors.append("第 %d 行（%s）含阿拉伯數字：%s" % (i["src"], label, body))
    # 2. 說話行數、合聲位置
    if len(lines) != EXPECT_LINES:
        errors.append("說話行數是 %d，應為 %d" % (len(lines), EXPECT_LINES))
    chorus = [i["n"] for i in lines if i["speaker"] == "合聲"]
    if chorus != EXPECT_CHORUS:
        errors.append("合聲在第 %s 句，應為 %s" % (chorus, EXPECT_CHORUS))
    # 3. cuts 標題必須與 ＊切頁 完全一致（順序也要一樣）
    titles = [i["arg"] for i in items if i["kind"] == "marker" and i["mtype"] == "切頁"]
    if titles != list(CUTS):
        errors.append("cuts 標題與稿子的＊切頁不一致：稿子=%s；cuts=%s" % (titles, list(CUTS)))
    # 4. at 的句號必須是說話行
    for n in AT:
        if not 1 <= n <= len(lines):
            errors.append("at 的句號 %d 不是說話行（共 %d 句）" % (n, len(lines)))
    for n, (_t, sb, st) in AT.items():
        key = sb or _t  # 沒有子頁的分頁，步驟數登記在分頁名稱下
        if st is not None and not 1 <= st <= STEPS.get(key, 0):
            errors.append("at 第 %d 句：%s 沒有第 %s 步（共 %s 步）" % (n, key, st, STEPS.get(key)))
    # 4b. acts（句中換畫面）：句號要是說話行、位置 0～1、步驟不超過上限
    for n, lst in ACTS.items():
        if not 1 <= n <= len(lines):
            errors.append("acts 的句號 %d 不是說話行（共 %d 句）" % (n, len(lines)))
        for f, _t, sb, st in lst:
            if not 0 <= f <= 1:
                errors.append("acts 第 %d 句：位置 %s 不在 0～1" % (n, f))
            key = sb or _t  # 與 at 相同：沒有子頁的分頁，步驟數登記在分頁名稱下
            if not 1 <= st <= STEPS.get(key, 0):
                errors.append("acts 第 %d 句：%s 沒有第 %s 步（共 %s 步）" % (n, key, st, STEPS.get(key)))
    # 5. tab/sub 必須存在於 html
    html = REPO / PAGE
    if not html.exists():
        errors.append("找不到 %s" % html)
    else:
        pairs = list(CUTS.values()) + [(t, sb) for t, sb, _ in AT.values()] + [(x[1], x[2]) for v in ACTS.values() for x in v]
        for tab in sorted({t for t, _ in pairs}):
            if not grep_has(html, "data-tab", tab):
                errors.append('%s 找不到 data-tab="%s"' % (PAGE, tab))
        for sub in sorted({s for _, s in pairs if s}):
            if not grep_has(html, "data-sub", sub):
                errors.append('%s 找不到 data-sub="%s"' % (PAGE, sub))
    return errors


def build_manifest(items):
    out = []
    for i in items:
        if i["kind"] == "marker":
            out.append({"kind": "marker", "text": i["text"]})
            continue
        rid = "%02d" % i["n"]
        spk = i["speaker"]
        fid = "%03d" % i["n"]
        chorus = spk == "合聲"
        voices = ["彥君", "曉臻"] if chorus else [spk]
        tts = i["text"]  # 讀音稿本身就是要念的字，本稿不需要另外改
        key = hashlib.sha1(json.dumps([tts, [(v, SETTINGS[v]) for v in voices]], ensure_ascii=False)
                           .encode()).hexdigest()[:12]
        out.append({
            "kind": "line", "id": rid, "speaker": spk, "text": i["text"], "tts": tts, "key": key,
            "file": "%s_%s.mp3" % (fid, FILE_NAME[spk]),
            "tracks": {v: "_tracks/%s_%s.mp3" % (fid, FILE_NAME[v]) for v in voices} if chorus else None,
            "params": {},
        })
    return {"lesson": LESSON, "settings": SETTINGS, "items": out}


def to_subtitle(text):
    for src, dst in SUB_MAP:
        text = text.replace(src, dst)
    # N／S 前面若緊接中文字，補一個空格（例：被S 極 → 被 S 極）
    return re.sub(r"(?<=[\u4e00-\u9fff])(?=[NS] 極)", " ", text)


# 頭像圖庫（AGENTS_VOICE 2-1）：依說話內容選姿勢（不隨機）；同一位老師連續說話不重複；另一位保留上一張
AVATAR_DIR = {"彥君": "assets/characters/yanjun", "曉臻": "assets/characters/xiaozhen"}
AVATAR_OVERRIDE = {}  # lessons/<課>.json 的 avatars：{句號: {"彥君": 檔名, "曉臻": 檔名}}，老師手動指定時用
# 彥君：依內容的規則（先命中先用），後面接預設輪流，避免一直同一張
YANJUN_RULES = [
    (r"同學們好|下課|再見|歡迎|今天我們來|收尾|今天的重點|三句話", ["open_hands"]),
    (r"實驗|燒瓶|試試|電表|接線|按|量", ["flask_pointer"]),
    (r"記住|重點|原則|絕對|一定|千萬", ["laser_pen", "long_pointer"]),
    (r"很好|答對|正確|沒錯|好問題|完全正確", ["book_thumbs"]),
    (r"課本|定義|稱為|叫做|意思|是指", ["book_thumbs"]),
    (r"計算|伏特|安培|等於|倍|乘", ["clipboard_write"]),
    (r"水|渦輪|幫浦|地球|模型|想像|比喻|就像", ["globe_pointer"]),
]
YANJUN_DEFAULT = ["pointer_board", "long_pointer", "globe_pointer", "open_hands"]
# 曉臻：依內容的規則；預設輪流
XIAOZHEN_RULES = [
    (r"[？?]", ["thinking"]),
    (r"危險|小心|燒|短路|安全|絕對不行|不能|燙|冒煙", ["safety"]),
    (r"很好|答對|正確|好問題|懂了|原來|厲害|沒錯", ["praising"]),
    (r"發現|居然|竟然|怎麼會|不一樣|奇怪|嚇", ["surprised"]),
    (r"試試看|我來|按|接|實驗|拿|量", ["experimenting"]),
    (r"考考|練習|你來|算算|來算|挑戰", ["encouraging"]),
    (r"收穫|學到", ["celebrating"]),
    (r"課本|定義|意思|稱為", ["reading"]),
    (r"算|伏特|數字|點五|倍", ["recording"]),
]
XIAOZHEN_DEFAULT = ["normal", "pointing", "teaching", "reading", "recording"]


def pick_avatar(who, text, recent):
    """依內容挑一張；避開該老師最近用過的三張（recent＝最近幾張，新的在後），讓姿勢分散、不疲勞。"""
    rules = YANJUN_RULES if who == "彥君" else XIAOZHEN_RULES
    default = YANJUN_DEFAULT if who == "彥君" else XIAOZHEN_DEFAULT
    cands = []
    for pat, names in rules:
        if re.search(pat, text):
            cands = names
            break
    last = recent[-1] if recent else None
    avoid = set(recent[-3:])
    for name in cands + default:          # 先找沒最近用過的
        if name not in avoid:
            return name
    for name in cands + default:          # 找不到就至少不跟上一張一樣
        if name != last:
            return name
    return default[0]


def build_avatars(items):
    """回傳 {句號: {彥君: 路徑, 曉臻: 路徑}}：該句兩位老師各顯示哪一張（依內容，避開最近用過的）。"""
    hist, state, out = {"彥君": [], "曉臻": []}, {}, {}
    for i in items:
        if i["kind"] != "line":
            continue
        key = "%02d" % i["n"]
        speakers = {"彥君", "曉臻"} if i["speaker"] == "合聲" else {i["speaker"]}
        for who in ("彥君", "曉臻"):
            if who in speakers or who not in state:
                state[who] = pick_avatar(who, i["text"], hist[who])
                hist[who].append(state[who])
        ov = AVATAR_OVERRIDE.get(key, {})
        for who in ("彥君", "曉臻"):
            if who in ov:
                state[who] = ov[who]
        out[key] = {who: "%s/%s.png" % (AVATAR_DIR[who], state[who]) for who in ("彥君", "曉臻")}
    return out


def build_stage(items):
    subs = {}
    for i in items:
        if i["kind"] == "line" and any(src in i["text"] for src, _ in SUB_MAP):
            subs["%02d" % i["n"]] = to_subtitle(i["text"])
    return {
        "page": PAGE,
        "cuts": {t: {"tab": a, "sub": b} for t, (a, b) in CUTS.items()},
        "at": {"%02d" % n: ({"tab": a, "sub": b, "step": c} if c else {"tab": a, "sub": b}) for n, (a, b, c) in sorted(AT.items())},
        "subs": subs,
        "avatars": build_avatars(items),
        **({"acts": {"%02d" % n: [list(x) for x in v] for n, v in sorted(ACTS.items())}} if ACTS else {}),
    }


SPEC_MD = """# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 %(cuts)d 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 %(at)d 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 %(subs)d 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

%(cuts_tbl)s

## at

%(at_tbl)s
"""


def build_spec(stage):
    cuts_tbl = "\n".join("- %s → `%s` / `%s`" % (t, v["tab"], v["sub"]) for t, v in stage["cuts"].items())
    at_tbl = "\n".join("- 第 %s 句 → `%s` / `%s`" % (k, v["tab"], v["sub"]) for k, v in stage["at"].items())
    return SPEC_MD % {"cuts": len(stage["cuts"]), "at": len(stage["at"]), "subs": len(stage["subs"]),
                      "cuts_tbl": cuts_tbl, "at_tbl": at_tbl}


def load_lesson(name):
    """讀 lessons/<name>.json，覆寫本模組的課程常數（CUTS、AT、STEPS…）。"""
    global LESSON, PAGE, DEFAULT_SCRIPT, DEFAULT_OUT, EXPECT_LINES, EXPECT_CHORUS, CUTS, STEPS, AT, ACTS, AVATAR_OVERRIDE
    import json as _json
    cfg = _json.loads((REPO / "tools/voice/lesson_studio/lessons" / (name + ".json")).read_text("utf-8"))
    LESSON = cfg["lesson"]
    PAGE = cfg["page"]
    DEFAULT_SCRIPT = REPO / cfg["script"]
    DEFAULT_OUT = REPO / "audio" / LESSON
    EXPECT_LINES = cfg["expect_lines"]
    EXPECT_CHORUS = cfg["expect_chorus"]
    CUTS = {t: (v[0], v[1]) for t, v in cfg["cuts"].items()}
    STEPS = dict(cfg["steps"])
    AT = {int(k): (v[0], v[1], v[2]) for k, v in cfg["at"].items()}
    # 句中換畫面（選用）：{句號: [[句中位置 0～1, 分頁, 子頁, 第幾步], ...]}；沒有這個欄位的課照舊
    ACTS = {int(k): [tuple(x) for x in v] for k, v in cfg.get("acts", {}).items()}
    AVATAR_OVERRIDE = cfg.get("avatars", {})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lesson", default=None, help="課名，讀 lessons/<課名>.json（不給就用 magnetism_1 的內建設定）")
    ap.add_argument("--script", default=None)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    if a.lesson:
        load_lesson(a.lesson)
    if a.script is None:
        a.script = str(DEFAULT_SCRIPT)
    if a.out is None:
        a.out = str(DEFAULT_OUT)
    items, errors = parse(Path(a.script).read_text("utf-8"))
    warnings = []
    errors = validate(items, errors, warnings)
    for w in warnings:
        print("  ! 提醒：" + w)
    if errors:
        print("驗證失敗，沒有寫任何檔案：")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    manifest, stage = build_manifest(items), build_stage(items)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, indent=2) + "\n"  # noqa: E731
    (out / "manifest.json").write_text(dump(manifest), "utf-8")
    (out / "stage.json").write_text(dump(stage), "utf-8")
    (out / "stage_spec.md").write_text(build_spec(stage), "utf-8")
    n_line = sum(1 for i in manifest["items"] if i["kind"] == "line")
    print("OK：說話行 %d、合聲 %s、cuts %d、at %d、subs %d → %s" % (
        n_line, EXPECT_CHORUS, len(stage["cuts"]), len(stage["at"]), len(stage["subs"]), out))


if __name__ == "__main__":
    main()
