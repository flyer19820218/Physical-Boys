#!/bin/bash
# 在專案根目錄啟動本機伺服器（已在跑就不重複啟動）。用法：tools/qa/serve.sh
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
curl -s -o /dev/null http://127.0.0.1:8765/index.html && { echo "server already running"; exit 0; }
cd "$ROOT" && (setsid nohup python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &)
for i in 1 2 3 4 5 6 7 8 9 10; do sleep 0.3; curl -s -o /dev/null http://127.0.0.1:8765/index.html && { echo "server started: http://127.0.0.1:8765/"; exit 0; }; done
echo "server failed to start" >&2; exit 1
