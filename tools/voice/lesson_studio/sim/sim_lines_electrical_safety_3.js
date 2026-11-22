// electrical_safety_3 逐句模擬：開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與舞台狀態、畫布是否在字幕框上方、是否還在老師講解模式。
// 期望值來自 lessons/electrical_safety_3.json 的 at／acts。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_electrical_safety_3.js [輸出 json]   （環境變數 SMOKE=秒數 只跑前幾秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/electrical_safety_3.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/electrical_safety_3/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_es3_result.json');
const SMOKE = Number(process.env.SMOKE || 0);

// 與播放器 ACTS 相同的動作表
const MODS = { 'tab-short': 'short', 'tab-overload': 'overload', 'tab-heat': 'heat', 'tab-protect': 'protect', 'tab-shock': 'shock' };
const A5 = [['a', 1], ['a', 2], ['a', 3], ['a', 4], ['a', 5]];
const ACTS = {
  'tab-short': A5.concat([['lab', { short: 'normal' }], ['lab', { short: 'short' }]]),
  'tab-overload': A5.concat([['lab', { ap: [] }], ['lab', { ap: ['lamp'] }], ['lab', { ap: ['lamp', 'dryer'] }], ['lab', { ap: ['lamp', 'dryer', 'cooker'] }], ['lab', { ap: ['dryer', 'heater'] }]]),
  'tab-heat': A5.concat([['lab', { cur: 6, wire: 'normal' }], ['lab', { cur: 12, wire: 'normal' }], ['lab', { cur: 12, wire: 'thin' }], ['lab', { cur: 12, wire: 'thick' }], ['view'], ['view']]),
  'tab-protect': A5.concat([['lab', { pr: 'breaker', trip: 0 }], ['lab', { pr: 'breaker', trip: 1 }], ['lab', { pr: 'breaker', trip: 0 }], ['lab', { pr: 'fuse', trip: 0 }], ['lab', { pr: 'fuse', trip: 1 }], ['lab', { pr: 'fuse', trip: 0 }]]),
  'tab-shock': A5.concat([['lab', { sh: 'normal' }], ['lab', { sh: 'wet' }], ['lab', { sh: 'water' }], ['lab', { sh: 'ground' }]])
};
function actOf(e) { return (ACTS[e.tab] || [])[e.step - 1]; }
function stateOk(e, st) {
  const a = actOf(e); if (!a) return false;
  if (a[0] === 'a') return st.anim && (st.anim.step === a[1] - 1 || st.anim.step === a[1]) && st.anim.on;
  if (a[0] === 'view') return true;
  const sp = a[1], L = st.lab;
  if (sp.short && L.short !== sp.short) return false;
  if (sp.ap && JSON.stringify(sp.ap.slice().sort()) !== JSON.stringify(L.ap.slice().sort())) return false;
  if (sp.cur != null && L.cur !== sp.cur) return false;
  if (sp.wire && L.wire !== sp.wire) return false;
  if (sp.pr && (L.pr !== sp.pr || (!!sp.trip) !== !!L.trip)) return false;
  if (sp.sh && L.sh !== sp.sh) return false;
  return true;
}
const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/electrical_safety_3/stage.json'), 'utf8'));
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
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/electrical_safety_3.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  // 打開面板就會自動開始播（2026-11-21），開始鈕此時是停用的；只有還沒開始時才按
  await page.click('.vx-ctl button[title="開始／繼續"]', { timeout: 1500 }).catch(() => {});

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 20 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const act = sel => [...document.querySelectorAll(sel)].findIndex(e => e.classList.contains('active'));
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 0;
      const tabEl = document.querySelector('.tab-btn.active'), tab = tabEl ? tabEl.dataset.tab : null;
      const key = { 'tab-short': 'short', 'tab-overload': 'overload', 'tab-heat': 'heat', 'tab-protect': 'protect', 'tab-shock': 'shock' }[tab];
      let anim = null, cvOk = null;
      if (key && window.EsAnim[key]) { const s = window.EsAnim[key]._state(); anim = { step: s.step, on: !!s.scene, t: s.t }; }
      if (key) { const c = document.getElementById(key + 'AnimCanvas'); if (c) { const r = c.getBoundingClientRect(); cvOk = r.top >= 0 && r.bottom <= top + 2; } }
      const al = sel => { const e = document.querySelector(sel); return e ? e.dataset[sel.match(/data-(\w+)/)[1]] : null; };
      const ap = [...document.querySelectorAll('[data-appliance].active')].map(e => e.dataset.appliance);
      const lab = { short: al('[data-short].active'), ap, cur: Number(document.getElementById('currentRange').value), wire: al('[data-wire].active'),
        pr: al('[data-protector].active'), trip: state.tripped ? 1 : 0, sh: al('[data-shock].active') };
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '', tab, anim, lab, cvOk,
        teacher: document.body.classList.contains('mode-teacher'),
      };
    });
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
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, anim: sl.anim, lab: sl.lab } }); }
  }
  const canvasBad = [];
  Object.keys(seen).filter(k => k !== 'probe').forEach(k => {
    const n = Number(k), v = seen[k], e = expectEnd(n) || expect(n); if (!e) return;
    const a = actOf(e); if (a && a[0] === 'a' && v.cvOk === false) canvasBad.push(n);
  });
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, errors: errs.length }));
  if (report.length) console.log(JSON.stringify(report.slice(0, 12)));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
