// electric_power_transmission_2 逐句模擬：開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁／子頁、動畫步驟、動手做面板設定、
// 畫布（或操作的控制項）是否在字幕框上方、是否還在老師講解模式。期望值來自 lessons/electric_power_transmission_2.json 的 at。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_electric_power_transmission_2.js [輸出 json]   （環境變數 SMOKE=秒數 只跑前幾秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const L = 'electric_power_transmission_2';
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/' + L + '.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/' + L + '/manifest.json'), 'utf8'));
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/' + L + '/stage.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_' + L + '.json');
const SMOKE = Number(process.env.SMOKE || 0);
const SUB_MOD = { 'wiring-basic': 'wiring', 'wiring-advanced': 'phase', 'wiring-sockets': 'socket' };
const TAB_MOD = { 'tab-current': 'current', 'tab-grid': 'grid', 'tab-loss': 'loss', 'tab-cost': 'cost' };
const keyOf = e => e.tab === 'tab-wiring' ? SUB_MOD[e.sub] : TAB_MOD[e.tab];
const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
function expect(n) {
  let cur = null;
  for (let k = 1; k <= n; k++) { const a = cfg.at[String(k)]; if (a) cur = { tab: a[0], sub: a[1], step: a[2] }; }
  return cur;
}
// 動手做的期望設定（與播放器 HANDS 相同）
const HAND_WANT = {
  current: [{ cur: 'dc' }, { cur: 'ac' }],
  grid: [{ flow: 'high' }, { flow: 'down' }, { flow: 'home' }, { flow: 'all', speed: '1.8' }],
  loss: [{ volt: '10' }, { volt: '100' }],
  cost: [{ p: '1000', h: '1', r: '4' }, { p: '2000', h: '40', r: '4' }, { p: '2000', h: '40', r: '8' }],
  wiring: [{ wir: 'ac' }, { wir: 'bc' }, { wir: 'ab' }],
  phase: [{}],
  socket: [{ sock: 'grounded', mode: 'normal' }, { sock: 'grounded', mode: 'fault' }, { sock: 'two-hole', mode: 'fault' }, { sock: 'dedicated', mode: 'normal' }]
};
function stateOk(e, st) {
  if (!e) return true;
  if (st.tab !== e.tab) return false;
  if (e.sub && st.sub !== e.sub) return false;
  const key = keyOf(e);
  if (e.step <= 5) return st.step === e.step - 1;
  const w = (HAND_WANT[key] || [])[e.step - 6]; if (!w) return false;
  return Object.keys(w).every(k => String(st.hand[k]) === w[k]);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL|fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/' + L + '.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 25 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const val = id => { const e = document.getElementById(id); return e ? e.value : null; };
      const act = a => { const b = document.querySelector('[' + a + '].active'); return b ? b.getAttribute(a) : null; };
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 0;
      const tabEl = document.querySelector('.tab-content.active');
      const sp = document.querySelector('.wiring-subpage.active');
      const key = (window.EpAnim && EpAnim.currentKey) ? EpAnim.currentKey() : null;
      const row = key && document.getElementById('steps-' + key);
      const btns = row ? [...row.querySelectorAll('.step-btn')] : [];
      const inView = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= top + 2; };
      const ac = key && document.getElementById(key + 'AnimCanvas');
      const hc = key && document.getElementById(key + 'Canvas');
      let ctrl = null; if (hc) { const p = hc.closest('.lab-panel'); ctrl = p && p.querySelector('.choice-row, .slider-block'); }
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabEl ? tabEl.id : null, sub: tabEl && tabEl.id === 'tab-wiring' && sp ? sp.id : null,
        step: btns.findIndex(b => b.classList.contains('active')),
        hand: { cur: act('data-current'), flow: act('data-flow'), speed: val('flowSpeed'), volt: val('transmissionVoltage'), p: val('costPower'), h: val('costHours'), r: val('costRate'), wir: act('data-wiring'), sock: act('data-socket'), mode: act('data-socket-mode') },
        animIn: inView(ac), handIn: inView(ctrl), canvasIn: inView(hc),
        paused: !!(window.EpAnim && EpAnim.ctl && EpAnim.ctl.paused),
        teacher: document.body.classList.contains('mode-teacher'),
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) { const n = idx + 1; if (!seen[n]) seen[n] = { st0: st }; seen[n].last = st; last = n; }
    if (st.teacher) teacherDuringPlay = true;
    if (last >= lines.length) { await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(150);
    if (!seen.started) { seen.started = true; }
    if (!seen.probe && Date.now() - started > 3000) { seen.probe = true; await page.click('#mode-teacher').catch(() => {}); }
  }
  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const sl = s.last || s.st0;
    if (!stateOk(e, sl)) { mismatches++; report.push({ n, expect: e, got: { tab: sl.tab, sub: sl.sub, step: sl.step, hand: sl.hand } }); }
  }
  // 畫面要在字幕框上方：動畫步驟看動畫畫布；動手做看操作的控制項
  const viewBad = [];
  Object.keys(seen).filter(k => /^\d+$/.test(k)).forEach(k => {
    const n = Number(k), e = expect(n), v = seen[k].last; if (!e || !v) return;
    if (e.step <= 5) { if (v.animIn === false) viewBad.push(n + '(動畫)'); }
    else if (v.handIn === false) viewBad.push(n + '(控制項)');
  });
  const result = { viewBad, observed: Object.keys(seen).filter(k => /^\d+$/.test(k)).length, lines: lines.length, mismatches, teacherDuringPlay, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('畫面沒在字幕框上方的句子：', JSON.stringify(viewBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, errors: errs.length }));
  if (report.length) console.log(JSON.stringify(report.slice(0, 12)));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
