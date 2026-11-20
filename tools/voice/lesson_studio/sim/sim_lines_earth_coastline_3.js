// earth_coastline_3 逐句模擬（參考版字幕播放器）：
//   開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與步驟、螢光筆數量、是否還在老師講解模式。
//   期望值來自 lessons/earth_coastline_3.json 的 at。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_coastline_3.js [輸出 json] [SMOKE=秒數]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/earth_coastline_3.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_coastline_3/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_coast_result.json');
const SMOKE = Number(process.env.SMOKE || 0);


// 實驗台狀態對照：fresh＝第 0 步、go k＝第 k 步（跑中）或 k+1（跑完）、show k＝停在第 k 步（猜猜看題目）、pick k＝k+1、sc＝全部做完且情境已選
const ACTS = {
  sb: [['fresh'], ['sbp', 3, 1], ['sbp', 2, 2], ['sbp', 1, 3]],
  ra: [['fresh'], ['pick', 0], ['go', 1], ['go', 2], ['go', 3]],
  rd: [['fresh'], ['go', 0], ['show', 1], ['pick', 1], ['go', 2], ['go', 3]],
  jt: [['fresh'], ['go', 0], ['show', 1], ['pick', 1], ['go', 2], ['go', 3]]
};
const IDS = ['sb', 'ra', 'rd', 'jt'];
function stateOk(e, st) {
  const id = IDS[Number(e.tab.replace('btn-tab-', ''))];
  const a = ACTS[id][e.step - 1];
  if (!a) return false;
  if (id === 'sb') {
    if (a[0] === 'fresh') return st.S === 2 && st.R === 2 && st.D === 0 && !st.play;
    return st.S === a[1] && st.R === a[2];   // 快轉中或已快轉完都算
  }
  if (a[0] === 'fresh') return st.i === 0 && !st.busy;
  if (a[0] === 'go') return st.i === a[1] || st.i === a[1] + 1;
  if (a[0] === 'show') return st.i === a[1] && !st.busy;
  if (a[0] === 'pick') return st.i === a[1] + 1;
  return false;
}

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
// 字幕顯示用 stage.json 的 subs（例如「第 1 種」「30 分鐘」），沒有覆寫才用台詞原文
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_coastline_3/stage.json'), 'utf8'));
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
const at = Object.keys(cfg.at).map(Number).sort((a, b) => a - b);
// 句中換畫面（acts）：這一句結束時的畫面＝最後一個 act；之前句子的 act 都已經換過
const acts = cfg.acts || {};
function expect(n) {
  let cur = null;
  for (let k = 1; k <= n; k++) {
    if (cfg.at[String(k)]) cur = cfg.at[String(k)];
    const ac = acts[String(k)];
    if (ac && ac.length && k < n) { const z = ac[ac.length - 1]; cur = [z[1], z[2], z[3]]; }
  }
  return cur ? { tab: cur[0], step: cur[2] } : null;
}
function expectEnd(n) { const ac = acts[String(n)]; if (!ac || !ac.length) return null; const z = ac[ac.length - 1]; return { tab: z[1], step: z[3] }; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/earth_coastline_3.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  await page.click('.vx-ctl button[title="開始／繼續"]');

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 16 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const act = sel => { const els = [...document.querySelectorAll(sel)]; return els.findIndex(e => e.classList.contains('active')); };
      const tabI = act('.tabs .tab-btn');
      const id = ['sb', 'ra', 'rd', 'jt'][tabI];
      const L = id && id !== 'sb' && LABS[id];
      const cv = id && document.getElementById(id + 'Canvas'), bub = document.querySelector('.vx-bub');
      const rectOk = eid => { const e = document.getElementById(eid); if (!e || !bub) return null; const r = e.getBoundingClientRect(), b = bub.getBoundingClientRect(), pin = document.querySelector('.vx-pin.show'); const top = pin ? Math.min(b.top, pin.getBoundingClientRect().top) : b.top; return r.top >= 0 && r.bottom <= top + 2; };
      let canvasOk = null;
      if (cv && bub) { const r = cv.getBoundingClientRect(), b = bub.getBoundingClientRect(), pin = document.querySelector('.vx-pin.show'); const top = pin ? Math.min(b.top, pin.getBoundingClientRect().top) : b.top; canvasOk = r.top >= 0 && r.bottom <= top + 2; }
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabI >= 0 ? 'btn-tab-' + tabI : null,
        i: L ? L.i : -1, busy: !!(L && L.cur), guess: L ? L.guess : null,
        S: SBS.S, R: SBS.R, D: SBS.D, play: SBS.play,
        canvasOk,
        
        teacher: document.body.classList.contains('mode-teacher'),
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) seen[n] = { tab: st.tab, st0: st, teacher: st.teacher, hl: 0, canvasOk: st.canvasOk };
      seen[n].last = st; seen[n].canvasOk = st.canvasOk; 
      if (n !== last) last = n;
    }
    if (st.teacher) teacherDuringPlay = true;
    if (last >= lines.length) { await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(120);
    // 播放 3 秒後，故意硬點「老師講解」，驗證防護會切回學生模式
    // 本頁沒有「老師講解」模式鈕，不做硬點測試
  }

  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const e2 = expectEnd(n), sl = s.last || s.st0;
    const ok = (e && s.tab === e.tab && stateOk(e, sl)) || (e2 && s.tab === e2.tab && stateOk(e2, sl));
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, i: (s.last || s.st0).i, busy: (s.last || s.st0).busy, S: (s.last || s.st0).S, R: (s.last || s.st0).R } }); }
  }
  const hlLines = Object.keys(seen).filter(k => k !== 'probe' && seen[k].hl > 0).map(Number);
  const canvasBad = Object.keys(seen).filter(k => k !== 'probe').filter(k => seen[k].canvasOk === false).map(Number);
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, hlLines, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, hlLines, errors: errs.length }));
  if (report.length) console.log(report.slice(0, 10));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
