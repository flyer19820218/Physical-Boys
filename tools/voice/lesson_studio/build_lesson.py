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
SETTINGS = {"彥君": ["+10%", "+0Hz"], "曉臻": ["+10%", "+5Hz"]}  # 同 class_studio.py 的 DEFAULTS
LINE_RE = re.compile(r"^([^：:]{1,16}?)\s*[：:]\s*(.+)$")

# 切頁：＊切頁 標題 → 要切到的分頁／子頁
CUTS = {
    "斷成兩半會怎樣？": ("tab-pole", "pole-suspend"),
    "鐵釘怎麼變磁鐵？": ("tab-mag", "mag-process"),
    "看不見的線？": ("tab-line", "line-bar"),
    "指針為何轉向？": ("tab-compass", "compass-tangent"),
    "地球是大磁鐵？": ("tab-earth", "earth-surface"),
}
# 播到第 N 句（說話行編號）時切子頁
AT = {
    15: ("tab-pole", "pole-interact"),
    21: ("tab-pole", "pole-break"),
    55: ("tab-mag", "mag-store"),
    71: ("tab-line", "line-u"),
    84: ("tab-compass", "compass-space"),
    99: ("tab-earth", "earth-core"),
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


def validate(items, errors):
    lines = [i for i in items if i["kind"] == "line"]
    # 1. 讀音稿：說話行、切頁、釘選都不得有英文字母；說話行與切頁、釘選不得有阿拉伯數字
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
            errors.append("第 %d 行（%s）含英文字母：%s" % (i["src"], label, body))
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
    # 5. tab/sub 必須存在於 html
    html = REPO / PAGE
    if not html.exists():
        errors.append("找不到 %s" % html)
    else:
        pairs = list(CUTS.values()) + list(AT.values())
        for tab in sorted({t for t, _ in pairs}):
            if not grep_has(html, "data-tab", tab):
                errors.append('%s 找不到 data-tab="%s"' % (PAGE, tab))
        for sub in sorted({s for _, s in pairs}):
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


def build_stage(items):
    subs = {}
    for i in items:
        if i["kind"] == "line" and any(src in i["text"] for src, _ in SUB_MAP):
            subs["%02d" % i["n"]] = to_subtitle(i["text"])
    return {
        "page": PAGE,
        "cuts": {t: {"tab": a, "sub": b} for t, (a, b) in CUTS.items()},
        "at": {"%02d" % n: {"tab": a, "sub": b} for n, (a, b) in AT.items()},
        "subs": subs,
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


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--script", default=str(DEFAULT_SCRIPT))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    a = ap.parse_args()
    items, errors = parse(Path(a.script).read_text("utf-8"))
    errors = validate(items, errors)
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
