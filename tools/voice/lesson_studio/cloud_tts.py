"""用法：python3 tools/voice/lesson_studio/cloud_tts.py <課名>   （例：electronics_2）
雲端工作階段錄音，取代 Mac 錄音工作室；失敗（No audio was received）就重跑，只補缺的檔。
Synthesize lesson audio in the cloud using the same functions as class_studio.py.

Run from anywhere; reads audio/electronics_2/manifest.json in the repo and writes
audio/electronics_2/mp3/NNN_<speaker>.mp3 (+ chorus mixes), using the proxy CA bundle.
"""
import json
import sys
import time
from pathlib import Path

LESSON = sys.argv[1] if len(sys.argv) > 1 else "electronics_2"

import certifi

# Point edge-tts at the sandbox proxy CA bundle (TLS verification stays ON).
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"

REPO = Path(__file__).resolve().parents[3]  # repo 根目錄
sys.path.insert(0, str(REPO / "tools/voice/lesson_studio"))
import asyncio  # noqa: E402
import class_studio as cs  # noqa: E402

_orig_save = cs._save


async def _save_with_timeout(text, voice, rate, pitch, path):
    # Some Microsoft websocket calls hang with no error; cap each attempt.
    await asyncio.wait_for(_orig_save(text, voice, rate, pitch, path), timeout=40)


cs._save = _save_with_timeout

OUT = REPO / "audio" / LESSON
MP3 = OUT / "mp3"
TRACKS = OUT / "_tracks"
MP3.mkdir(parents=True, exist_ok=True)
TRACKS.mkdir(parents=True, exist_ok=True)

ff = cs.find_ffmpeg()
assert ff, "ffmpeg not found"

manifest = json.loads((OUT / "manifest.json").read_text("utf-8"))
lines = [i for i in manifest["items"] if i["kind"] == "line"]
print("lines:", len(lines), flush=True)

done, failed = 0, []
t0 = time.time()
for it in lines:
    spk = it["speaker"]
    text = cs.tts_text(it["text"])  # 讀音字典（與錄音工作室相同）
    fid = it["file"].split("_")[0]  # NNN
    target = MP3 / it["file"]
    if target.exists() and target.stat().st_size > 1000:
        done += 1
        continue
    try:
        if spk == "合聲":
            parts = []
            for who in ("彥君", "曉臻"):
                rate, pitch = cs.DEFAULTS[who]
                p = TRACKS / ("%s_%s.mp3" % (fid, cs.FILE_NAME[who] if hasattr(cs, "FILE_NAME") else who))
                cs.synth(text, cs.VOICE[who], rate, pitch, p)
                parts.append(p)
            cs.mix(parts[0], parts[1], MP3 / it["file"], ff)
        else:
            rate, pitch = cs.DEFAULTS[spk]
            cs.synth(text, cs.VOICE[spk], rate, pitch, MP3 / it["file"])
        done += 1
        if done % 10 == 0:
            print("done %d/%d  (%.0fs)" % (done, len(lines), time.time() - t0), flush=True)
    except Exception as e:  # noqa: BLE001
        failed.append((it["id"], spk, str(e)[:200]))
        print("FAILED", it["id"], spk, str(e)[:200], flush=True)

print("FINISHED ok=%d failed=%d time=%.0fs" % (done, len(failed), time.time() - t0), flush=True)
for f in failed:
    print("  fail:", f, flush=True)
