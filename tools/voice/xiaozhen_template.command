#!/bin/bash
# 雙擊就會用「曉臻」(微軟 edge-tts：zh-TW-HsiaoChenNeural) 錄音。
# 錄好的檔案放在桌面「__OUTNAME__」資料夾，錄完會自動打開；把 01、02…mp3 拖給 Claude 就好。
OUT="$HOME/Desktop/__OUTNAME__"
mkdir -p "$OUT"
echo "🎙️ 準備曉臻的錄音工具…"
if ! python3 -c "import edge_tts" 2>/dev/null; then
  python3 -m pip install --user --quiet edge-tts 2>/dev/null || python3 -m pip install --user --quiet --break-system-packages edge-tts
fi
python3 - "$OUT" <<'PY'
import asyncio, sys, os, json, edge_tts
out = sys.argv[1]
LINES = json.loads('''__LINES__''')
async def main():
    for i, t in LINES:
        await edge_tts.Communicate(t, "zh-TW-HsiaoChenNeural", rate="__RATE__", pitch="__PITCH__").save(os.path.join(out, i + ".mp3"))
        print("✅", i, t)
asyncio.run(main())
PY
if [ $? -eq 0 ]; then
  echo ""; echo "🎉 全部錄好了！把資料夾裡的 mp3 拖給 Claude。"
  open "$OUT"
  afplay "$OUT/01.mp3" 2>/dev/null
else
  echo ""; echo "❌ 沒錄成功，請把這個視窗截圖給 Claude。"
fi
read -n 1 -s -r -p "按任意鍵關閉視窗…"
