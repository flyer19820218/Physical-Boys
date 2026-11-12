"""把字幕數字轉換套用到「已經建置過」的課：只更新 audio/<課>/stage.json 的 subs／pins，
其餘（cuts、at、acts、avatars）與 manifest、mp3 一律不動。可重複執行（冪等）。
用法：python3 tools/voice/lesson_studio/apply_sub_digits.py <課名> [<課名> …]（不給課名＝audio/ 底下全部）
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from subtitle_digits import to_arabic  # noqa: E402

SUB_MAP = [("恩極", "N 極"), ("艾斯極", "S 極")]
ROOT = HERE.parents[2]


def sub_of(text, existing=None):
    t = existing if existing else text
    if not existing:
        for src, dst in SUB_MAP:
            t = t.replace(src, dst)
        t = re.sub(r"(?<=[一-鿿])(?=[NS] 極)", " ", t)
    return to_arabic(t)


def apply(name):
    d = ROOT / "audio" / name
    man = json.loads((d / "manifest.json").read_text(encoding="utf-8"))
    sp = d / "stage.json"
    st = json.loads(sp.read_text(encoding="utf-8"))
    subs, pins, n = dict(st.get("subs") or {}), {}, 0
    for it in man["items"]:
        if it["kind"] == "line":
            n += 1
            key = it["id"]
            new = sub_of(it["text"], subs.get(key))
            if new != it["text"]:
                subs[key] = new
            else:
                subs.pop(key, None)
        else:
            m = re.match(r"^[＊*]\s*釘選\s*[：:]\s*(.+)$", it.get("text", ""))
            if m:
                arg = m.group(1).strip()
                new = to_arabic(arg)
                if new != arg:
                    pins[arg] = new
    st["subs"] = subs
    if pins:
        st["pins"] = pins
    else:
        st.pop("pins", None)
    sp.write_text(json.dumps(st, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("%s：subs %d 句、pins %d 條" % (name, len(subs), len(pins)))


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(p.name for p in (ROOT / "audio").iterdir() if (p / "stage.json").exists())
    for nm in names:
        apply(nm)
