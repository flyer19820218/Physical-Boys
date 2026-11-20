// earth_water_1 逐句模擬（參考版字幕播放器）：
//   開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與每個動畫的狀態、畫布是否完整在字幕框上方、是否還在老師講解模式。
//   期望值來自 lessons/earth_water_1.json 的 at／acts；動作表與播放器的 ACTS 相同。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_water_1.js [輸出 json]   （SMOKE=秒數 只跑前幾秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/earth_water_1.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_water_1/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_water_result.json');
const SMOKE = Number(process.env.SMOKE || 0);

const ACTS = [
  [['view'], ['view'], ['fresh', 'wr'], ['pick', 'wr', 0], ['go', 'wr', 1], ['go', 'wr', 2], ['go', 'wr', 3], ['go', 'wr', 4], ['view']],
  [['view'], ['fresh', 'tw'], ['pick', 'tw', 0], ['go', 'tw', 1], ['go', 'tw', 2], ['rsfresh'], ['rsplay', 'n'], ['rsplay', 'c'], ['rsplay', 's'], ['view']],
  [['view'], ['fresh', 'li'], ['go', 'li', 0], ['go', 'li', 1], ['show', 'li', 2], ['pick', 'li', 2], ['go', 'li', 3], ['go', 'li', 4], ['view']],
  [['view'], ['fresh', 'gw'], ['go', 'gw', 0], ['go', 'gw', 1], ['show', 'gw', 2], ['pick', 'gw', 2], ['go', 'gw', 3], ['go', 'gw', 4],
   ['ssfresh'], ['sspump', 1], ['sspump', 2], ['sspump', 3], ['sspump', 4], ['ssrest'],
   ['fresh', 'aw'], ['go', 'aw', 0], ['go', 'aw', 1], ['show', 'aw', 2], ['pick', 'aw', 2], ['go', 'aw', 3], ['go', 'aw', 4], ['go', 'aw', 5], ['view']]
];
// 這一步的畫布 id（view 步驟沒有畫布）
function canvasOf(a) { if (!a || a[0] === 'view') return null; return (a[0].indexOf('rs') === 0 ? 'rs' : a[0].indexOf('ss') === 0 ? 'ss' : a[1]) + 'Canvas'; }
function stateOk(e, st) {
  const a = ACTS[Number(e.tab.replace('btn-tab-', ''))][e.step - 1];
  if (!a) return false;
  const k = a[0], L = st.labs[a[1]];
  if (k === 'view') return true;
  if (k === 'fresh') return L.i === 0 && !L.busy;
  if (k === 'go') return L.i === a[2] || L.i === a[2] + 1;
  if (k === 'show') return L.i === a[2] && !L.busy;
  if (k === 'pick') return L.i === a[2] + 1;
  if (k === 'rsfresh') return st.rs.m === 0 && !st.rs.play && st.rs.reg === 'c';
  if (k === 'rsplay') return st.rs.reg === a[1] && (st.rs.play || st.rs.done || st.rs.m > 0);
  if (k === 'ssfresh') return st.ss.years === 0;
  if (k === 'sspump') return st.ss.years === 5 * a[1];
  if (k === 'ssrest') return st.ss.rest > 0 && st.ss.years === 20;
  return false;
}

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_water_1/stage.json'), 'utf8'));
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
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
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/earth_water_1.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  await page.click('.vx-ctl button[title="開始／繼續"]');

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 30 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate((cvIds) => {
      const tabI = [...document.querySelectorAll('.tabs .tab-btn')].findIndex(e => e.classList.contains('active'));
      const labs = {};
      ['wr', 'tw', 'li', 'gw', 'aw'].forEach(id => { const L = LABS[id]; labs[id] = { i: L.i, busy: !!L.cur, guess: L.guess }; });
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 9999;
      const cvOk = {};
      cvIds.forEach(id => { const c = document.getElementById(id); if (c) { const r = c.getBoundingClientRect(); cvOk[id] = r.top >= 0 && r.bottom <= top + 2; } });
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabI >= 0 ? 'btn-tab-' + tabI : null,
        labs, rs: { m: RSS.m, play: RSS.play, done: RSS.done, reg: RSS.reg }, ss: { years: SSS.years, rest: SSS.rest, D: SSS.D },
        cvOk, teacher: document.body.classList.contains('mode-teacher'),
      };
    }, ['wrCanvas', 'twCanvas', 'rsCanvas', 'liCanvas', 'gwCanvas', 'ssCanvas', 'awCanvas']);
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) seen[n] = { tab: st.tab, st0: st };
      seen[n].last = st; seen[n].cvOk = st.cvOk;
      last = n;
    }
    if (st.teacher) teacherDuringPlay = true;
    if (last >= lines.length) { await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(120);
    if (!seen.probe && Date.now() - started > 3000) { seen.probe = true; await page.click('#mode-teacher').catch(() => {}); }
  }

  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const e2 = expectEnd(n), sl = s.last || s.st0;
    const ok = (e && s.tab === e.tab && stateOk(e, sl)) || (e2 && s.tab === e2.tab && stateOk(e2, sl));
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, labs: sl.labs, rs: sl.rs, ss: sl.ss } }); }
  }
  const canvasBad = [];
  Object.keys(seen).filter(k => k !== 'probe').forEach(k => {
    const n = Number(k), v = seen[k], e = expectEnd(n) || expect(n); if (!e) return;
    const id = canvasOf(ACTS[Number(e.tab.replace('btn-tab-', ''))][e.step - 1]);
    if (id && v.cvOk && v.cvOk[id] === false) canvasBad.push(n);
  });
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, errors: errs.length }));
  if (report.length) console.log(JSON.stringify(report.slice(0, 12)));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
