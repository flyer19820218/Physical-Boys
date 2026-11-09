#!/usr/bin/env python3
"""從稿子一鍵產生 manifest.json、stage.json、stage_spec.md（每課一份設定）。

用法（在 repo 根目錄）：
    python3 tools/voice/lesson_studio/build_lesson.py --lesson magnetism_1
    python3 tools/voice/lesson_studio/build_lesson.py --lesson electromagnetism_2 --script 稿子.txt

每課的設定放在 tools/voice/lesson_studio/lessons/<課名>.json：
    lesson、page、script、expect_lines、expect_chorus、cuts、steps、at
（做法見 專案文件「網課有聲講解_量產作業手冊」）

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
LESSON_DIR = Path(__file__).resolve().parent / "lessons"

FILE_NAME = {"彥君": "yanjun", "曉臻": "xiaozhen", "合聲": "hesheng"}
SETTINGS = {"彥君": ["+10%", "+0Hz"], "曉臻": ["+10%", "+5Hz"]}  # 同 class_studio.py 的 DEFAULTS
LINE_RE = re.compile(r"^([^：:]{1,16}?)\s*[：:]\s*(.+)$")

# 字幕：念的字 → 畫面字（其餘字不變）
SUB_MAP = [("恩極", "N 極"), ("艾斯極", "S 極")]


def load_config(name):
    """讀 lessons/<課名>.json。sub 可以是 null（例如手機分頁沒有子頁）。"""
    path = LESSON_DIR / (name + ".json")
    if not path.exists():
        have = sorted(p.stem for p in LESSON_DIR.glob("*.json"))
        raise SystemExit("找不到課程設定 %s；現有的課：%s" % (path, have))
    cfg = json.loads(path.read_text("utf-8"))
    cfg["at"] = {int(k): v for k, v in cfg["at"].items()}
    cfg.setdefault("expect_chorus", [])
    cfg.setdefault("steps", {})
    return cfg


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


def validate(items, errors, cfg):
    lines = [i for i in items if i["kind"] == "line"]
    cuts, steps, at = cfg["cuts"], cfg["steps"], cfg["at"]
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
    if len(lines) != cfg["expect_lines"]:
        errors.append("說話行數是 %d，設定檔要求 %d" % (len(lines), cfg["expect_lines"]))
    chorus = [i["n"] for i in lines if i["speaker"] == "合聲"]
    if chorus != cfg["expect_chorus"]:
        errors.append("合聲在第 %s 句，設定檔要求 %s" % (chorus, cfg["expect_chorus"]))
    # 3. cuts 標題必須與 ＊切頁 完全一致（順序也要一樣）
    titles = [i["arg"] for i in items if i["kind"] == "marker" and i["mtype"] == "切頁"]
    if titles != list(cuts):
        errors.append("cuts 標題與稿子的＊切頁不一致：稿子=%s；設定檔=%s" % (titles, list(cuts)))
    # 4. at 的句號必須是說話行；步驟編號要在該子頁的步驟數之內
    for n, v in at.items():
        if not 1 <= n <= len(lines):
            errors.append("at 的句號 %d 不是說話行（共 %d 句）" % (n, len(lines)))
        step = v.get("step")
        if step is None:
            continue
        key = v.get("sub") or v["tab"]  # 沒有子頁的分頁（例如手機），步驟數登記在分頁名稱下
        if key not in steps:
            errors.append("at 第 %d 句：%s 沒有在 steps 登記步驟數" % (n, key))
        elif not 1 <= step <= steps[key]:
            errors.append("at 第 %d 句：%s 沒有第 %s 步（共 %s 步）" % (n, key, step, steps[key]))
    # 5. tab/sub 必須存在於 html（sub 為 null 的不檢查）
    html = REPO / cfg["page"]
    if not html.exists():
        errors.append("找不到 %s" % html)
    else:
        pairs = [(v["tab"], v.get("sub")) for v in cuts.values()] + [(v["tab"], v.get("sub")) for v in at.values()]
        for tab in sorted({t for t, _ in pairs}):
            if not grep_has(html, "data-tab", tab):
                errors.append('%s 找不到 data-tab="%s"' % (cfg["page"], tab))
        for sub in sorted({s for _, s in pairs if s}):
            if not grep_has(html, "data-sub", sub):
                errors.append('%s 找不到 data-sub="%s"' % (cfg["page"], sub))
    return errors


def build_manifest(items, cfg):
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
    return {"lesson": cfg["lesson"], "settings": SETTINGS, "items": out}


def to_subtitle(text):
    for src, dst in SUB_MAP:
        text = text.replace(src, dst)
    # N／S 前面若緊接中文字，補一個空格（例：被S 極 → 被 S 極）
    return re.sub(r"(?<=[一-鿿])(?=[NS] 極)", " ", text)


def build_stage(items, cfg):
    subs = {}
    for i in items:
        if i["kind"] == "line" and any(src in i["text"] for src, _ in SUB_MAP):
            subs["%02d" % i["n"]] = to_subtitle(i["text"])
    at = {}
    for n, v in sorted(cfg["at"].items()):
        e = {"tab": v["tab"], "sub": v.get("sub")}
        if v.get("step") is not None:
            e["step"] = v["step"]
        at["%02d" % n] = e
    return {
        "page": cfg["page"],
        "cuts": {t: {"tab": v["tab"], "sub": v.get("sub")} for t, v in cfg["cuts"].items()},
        "at": at,
        "subs": subs,
    }


SPEC_MD = """# %(lesson)s stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或設定檔，不要手改 `stage.json`。

- `page`：課程頁 `%(page)s`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`（sub 為 null 就只切分頁）。標題必須與稿子完全一致（共 %(cuts)d 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 %(at)d 個）。有 `step` 的，會再點該子頁的第 step 個步驟按鈕。
- `subs`：該句的字幕顯示字。只放含「恩極／艾斯極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 %(subs)d 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–%(n2)s）；音檔檔名是三位數（`001_yanjun.mp3`…），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

%(cuts_tbl)s

## at

%(at_tbl)s
"""


def build_spec(stage, cfg):
    cuts_tbl = "\n".join("- %s → `%s` / `%s`" % (t, v["tab"], v["sub"] or "null") for t, v in stage["cuts"].items())
    at_tbl = "\n".join("- 第 %s 句 → `%s` / `%s`%s" % (
        k, v["tab"], v["sub"] or "null", (" / 第 %d 步" % v["step"]) if "step" in v else "")
        for k, v in stage["at"].items())
    return SPEC_MD % {"lesson": cfg["lesson"], "page": cfg["page"], "n2": "%02d" % cfg["expect_lines"],
                      "cuts": len(stage["cuts"]), "at": len(stage["at"]), "subs": len(stage["subs"]),
                      "cuts_tbl": cuts_tbl, "at_tbl": at_tbl}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lesson", required=True, help="課名，對應 lessons/<課名>.json，例如 magnetism_1")
    ap.add_argument("--script", help="稿子路徑（預設用設定檔裡的 script）")
    ap.add_argument("--out", help="輸出資料夾（預設 audio/<課名>）")
    a = ap.parse_args()
    cfg = load_config(a.lesson)
    script = Path(a.script) if a.script else REPO / cfg["script"]
    out = Path(a.out) if a.out else REPO / "audio" / cfg["lesson"]
    items, errors = parse(script.read_text("utf-8"))
    errors = validate(items, errors, cfg)
    if errors:
        print("驗證失敗，沒有寫任何檔案：")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    manifest, stage = build_manifest(items, cfg), build_stage(items, cfg)
    out.mkdir(parents=True, exist_ok=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, indent=2) + "\n"  # noqa: E731
    (out / "manifest.json").write_text(dump(manifest), "utf-8")
    (out / "stage.json").write_text(dump(stage), "utf-8")
    (out / "stage_spec.md").write_text(build_spec(stage, cfg), "utf-8")
    n_line = sum(1 for i in manifest["items"] if i["kind"] == "line")
    print("OK：說話行 %d、合聲 %s、cuts %d、at %d、subs %d → %s" % (
        n_line, cfg["expect_chorus"], len(stage["cuts"]), len(stage["at"]), len(stage["subs"]), out))


if __name__ == "__main__":
    main()
