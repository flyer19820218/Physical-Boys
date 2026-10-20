// 檢查工具共用設定：找 Playwright 與 Chromium、網址、輸出位置。
//   PLAYWRIGHT_MODULE  playwright 套件路徑（預設先試 require('playwright')，再試雲端對話環境的路徑）
//   CHROMIUM_PATH      Chromium 執行檔（預設自動找 /opt/pw-browsers/chromium-*，找不到就用 Playwright 內建的）
//   BASE_URL           教材網址，預設 http://127.0.0.1:8765/（用 tools/qa/serve.sh 啟動）
//   OUT_DIR            截圖與 JSON 輸出資料夾，預設 <系統暫存>/qa-out（不會寫進 repo）
const fs = require('fs'), path = require('path'), os = require('os');
function loadPlaywright() {
  for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright'].filter(Boolean)) {
    try { return require(m); } catch (e) { /* try next */ }
  }
  throw new Error('找不到 playwright：請先 npm i playwright，或用 PLAYWRIGHT_MODULE 指定路徑');
}
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  try {
    for (const d of fs.readdirSync(base).sort().reverse()) {
      const p = path.join(base, d, 'chrome-linux', 'chrome');
      if (d.startsWith('chromium') && fs.existsSync(p)) return p;
    }
  } catch (e) { /* no preinstalled browser */ }
  return undefined;
}
async function launch() {
  const { chromium } = loadPlaywright(), exe = chromiumPath();
  return chromium.launch(exe ? { executablePath: exe } : {});
}
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8765/').replace(/\/?$/, '/');
const OUT = process.env.OUT_DIR || path.join(os.tmpdir(), 'qa-out');
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
module.exports = { launch, BASE, OUT, shot: n => path.join(OUT, 'shots', n), out: n => path.join(OUT, n) };
