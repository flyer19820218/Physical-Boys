// earth_landforms_2 逐句模擬（參考版字幕播放器）：
//   開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁、實驗台／拉鋸模型狀態、畫布是否整張在字幕框上方、是否還在老師講解模式。
//   期望值來自 lessons/earth_landforms_2.json 的 at／acts。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_landforms_2.js [輸出 json]   （SMOKE=秒數 只跑前幾秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/earth_landforms_2.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_landforms_2/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_landforms_result.json');
const SMOKE = Number(process.env.SMOKE || 0);
function findChrome() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { for (const d of fs.readdirSync('/opt/pw-browsers').sort().reverse()) { const p = path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome'); if (d.startsWith('chromium') && fs.existsSync(p)) return p; } } catch (e) {}
  return undefined;
}


// 狀態對照（與播放器 ACTS 同表）：upfresh＝拉鋸模型回到開始；up m＝情境 m 在播或播完；fresh＝第 0 步；go k＝第 k 步（跑中）或 k+1（跑完）；show k＝停在第 k 步（猜猜看題目）；pick k＝k+1；view＝不檢查狀態
const ACTS = [
  [['view', 't0cards'], ['view', 't0chain'], ['view', 't0trap'], ['upfresh'], ['up', 'up'], ['up', 'eq'], ['up', 'down'], ['view', 't0n2'], ['view', 't0n3']],
  [['view', 't1cause'], ['view', 't1type'], ['fresh', 'fw'], ['go', 'fw', 0], ['show', 'fw', 1], ['pick', 'fw', 1], ['go', 'fw', 2], ['go', 'fw', 3], ['go', 'fw', 4], ['go', 'fw', 5], ['view', 't1n1'], ['view', 't1n2']],
  [['view', 't2river'], ['view', 't2warn'], ['fresh', 'st'], ['show', 'st', 0], ['pick', 'st', 0], ['go', 'st', 1], ['go', 'st', 2], ['go', 'st', 3], ['fresh', 'sg'], ['show', 'sg', 0], ['pick', 'sg', 0], ['go', 'sg', 1], ['go', 'sg', 2], ['go', 'sg', 3], ['view', 't2n3'], ['view', 't2n1'], ['view', 't2n2']],
  [['view', 't3cards'], ['fresh', 'gl'], ['show', 'gl', 0], ['pick', 'gl', 0], ['go', 'gl', 1], ['go', 'gl', 2], ['go', 'gl', 3], ['go', 'gl', 4], ['view', 't3table'], ['view', 't3n1'], ['view', 't3n2'], ['view', 't3n3']]
];
// view 的選擇器（與播放器 VIEWS 相同）：[分頁, 起點, 終點]
const nc = (t, k) => [t, '.v5-notes .note-card:nth-child(' + k + ')', '.v5-notes .note-card:nth-child(' + k + ')'];
const VIEWS = { t0cards: [0, '.hook-box', '.grid-2c'], t0chain: [0, '.chain', '.chain'], t0trap: [0, '.note-box.trap', '.note-box.trap'], t0n2: nc(0, 2), t0n3: nc(0, 3),
  t1cause: [1, '.hook-box', '.grid-4c'], t1type: [1, '.grid-2c', '.grid-2c'], t1n1: nc(1, 1), t1n2: nc(1, 2),
  t2river: [2, '.hook-box', '.grid-3c'], t2warn: [2, '.note-box.trap', '.note-box.trap'], t2n1: nc(2, 1), t2n2: nc(2, 2), t2n3: nc(2, 3),
  t3cards: [3, '.hook-box', '.grid-3c'], t3table: [3, '.chalk-table', '.chalk-table'], t3n1: nc(3, 1), t3n2: nc(3, 2), t3n3: nc(3, 3) };
function stateOk(e, st) {
  const ti = Number(e.tab.replace('btn-tab-', ''));
  const a = ACTS[ti][e.step - 1];
  if (!a) return false;
  if (a[0] === 'view') return true;
  if (a[0] === 'upfresh') return st.up.mode === 'up' && !st.up.play && !st.up.fin && st.up.t === 0;
  if (a[0] === 'up') return st.up.mode === a[1] && (st.up.play || st.up.fin);
  const s = st.labs[a[1]]; if (!s) return false;
  if (a[0] === 'fresh') return s.i === 0 && !s.busy;
  if (a[0] === 'go') return s.i === a[2] || s.i === a[2] + 1;
  if (a[0] === 'show') return s.i === a[2] && !s.busy;
  if (a[0] === 'pick') return s.i === a[2] + 1;
  return false;
}

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
// 字幕顯示用 stage.json 的 subs（例如「第 1 種」「30 分鐘」），沒有覆寫才用台詞原文
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_landforms_2/stage.json'), 'utf8'));
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
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/earth_landforms_2.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  await page.click('.vx-ctl button[title="開始／繼續"]');

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 24 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(([ACTS, VIEWS]) => {
      const act = sel => { const els = [...document.querySelectorAll(sel)]; return els.findIndex(e => e.classList.contains('active')); };
      const tabI = act('.tabs .tab-btn');
      const bub = document.querySelector('.vx-bub');
      const labs = {}; ['fw', 'st', 'sg', 'gl'].forEach(id => { const L = LABS[id]; labs[id] = { i: L.i, busy: !!L.cur, guess: L.guess }; });
      const up = { mode: UPS.mode, play: !!UPS.play, fin: !!UPS.fin, t: UPS.t };
      let canvasOk = null;
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabI >= 0 ? 'btn-tab-' + tabI : null, tabI,
        labs, up,
        teacher: document.body.classList.contains('mode-teacher'),
        bubTop: bub ? bub.getBoundingClientRect().top : null,
        pinTop: (document.querySelector('.vx-pin.show') || { getBoundingClientRect: () => null }).getBoundingClientRect && (document.querySelector('.vx-pin.show') ? document.querySelector('.vx-pin.show').getBoundingClientRect().top : null),
        vr: Object.keys(VIEWS).reduce((o, k) => { const v = VIEWS[k], p = document.querySelectorAll('.panel')[v[0]]; const a = p && p.querySelector(v[1]), b = p && p.querySelector(v[2]); if (a && b) o[k] = [a.getBoundingClientRect().top, b.getBoundingClientRect().bottom]; return o; }, {}),
        cv: ['up', 'fw', 'st', 'sg', 'gl'].reduce((o, id) => { const e = document.getElementById(id + 'Canvas'); if (e) { const r = e.getBoundingClientRect(); o[id] = [r.top, r.bottom]; } return o; }, {})
      };
    }, [ACTS, VIEWS]);
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      // 目前動作用到的畫布：整張要在字幕框（或釘選黃條）上方
      const ti = st.tabI, e0 = expectEnd(idx + 1) || expect(idx + 1), ac = e0 && ACTS[ti] && ACTS[ti][e0.step - 1];
      let id = null;
      if (ac && ac[0] !== 'view') id = ac[0] === 'up' || ac[0] === 'upfresh' ? 'up' : ac[1];
      const r = (ac && ac[0] === 'view') ? st.vr[ac[1]] : (id && st.cv[id]), lim = st.pinTop != null ? Math.min(st.bubTop, st.pinTop) : st.bubTop;
      st.canvasOk = r ? (r[1] <= lim + 2 && r[0] >= -2) : null;   // view 區塊整個在字幕框／黃條上方（hook＋卡片這類比一屏高的，只要求「結尾」在上方）
    }
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
    if (!seen.probe && Date.now() - started > 3000) { seen.probe = true; await page.click('#mode-teacher').catch(() => {}); }
  }

  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const e2 = expectEnd(n), sl = s.last || s.st0;
    const ok = (e && s.tab === e.tab && stateOk(e, sl)) || (e2 && s.tab === e2.tab && stateOk(e2, sl));
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, labs: (s.last || s.st0).labs, up: (s.last || s.st0).up } }); }
  }
  const hlLines = Object.keys(seen).filter(k => k !== 'probe' && seen[k].hl > 0).map(Number);
  const canvasBad = Object.keys(seen).filter(k => k !== 'probe').filter(k => seen[k].canvasOk === false).map(Number);
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, hlLines, errors: errs.filter(x => !/ERR_TUNNEL/.test(x)), report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, hlLines, errors: errs.filter(x => !/ERR_TUNNEL/.test(x)).length }));
  if (report.length) console.log(report.slice(0, 10));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
