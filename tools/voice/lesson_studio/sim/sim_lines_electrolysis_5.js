// electrolysis_5 逐句模擬：開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁、動畫步驟鈕、五個實驗台的狀態、
// 畫布是否完整在字幕框上方、是否還在老師講解模式；期望值來自 lessons/electrolysis_5.json 的 at／acts。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_electrolysis_5.js [輸出 json]   （SMOKE=秒數 只跑前幾秒；SPEED=倍數 加速音檔與計時）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/electrolysis_5.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/electrolysis_5/manifest.json'), 'utf8'));
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/electrolysis_5/stage.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_electrolysis_5_result.json');
const SMOKE = Number(process.env.SMOKE || 0);
const SHOT = process.env.SHOT || '';   // 例：SHOT=/tmp/shots 每句句中截一張圖（給 Opus 逐句看畫面）

const LAB = { 'tab-intro': 'intro', 'tab-water': 'water', 'tab-cuso4-c': 'cuc', 'tab-cuso4-cu': 'cucu', 'tab-plating': 'plating' };
const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
const acts = cfg.acts || {};
// 依稿子順序（＊切頁 → 該分頁第 0 步；at／acts 之後 → 指定步驟）算出每句「開始時」該有的畫面；開場白（第一個切頁之前）不檢查
const EXP = {};
(function () {
  let cur = null, n = 0;
  for (const it of manifest.items) {
    if (it.kind === 'marker') { const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || ''); if (m && cfg.cuts[m[1].trim()]) cur = { tab: cfg.cuts[m[1].trim()][0], step: 0 }; continue; }
    n++;
    const a = cfg.at[String(n)]; if (a) cur = { tab: a[0], step: a[2] };
    EXP[n] = cur ? { tab: cur.tab, step: cur.step } : null;
    const ac = acts[String(n)]; if (ac && ac.length) { const z = ac[ac.length - 1]; cur = { tab: z[1], step: z[3] }; }
  }
})();
function expect(n) { return EXP[n]; }
function expectEnd(n) { const ac = acts[String(n)]; if (!ac || !ac.length) return null; const z = ac[ac.length - 1]; return { tab: z[1], step: z[3] }; }

// 實驗台期望狀態（只比對相關欄位）
function labOk(tab, n, L) {
  if (!L) return false;
  switch (tab) {
    case 'tab-intro': { const s = { 6: ['c', 'water', false], 7: ['c', 'water', true], 8: ['c', 'sugar', true], 9: ['c', 'naoh', true], 10: ['cu', 'naoh', true] }[n]; return L.electrode === s[0] && L.liquid === s[1] && !!L.power === s[2]; }
    case 'tab-water': return L.level === n;
    case 'tab-cuso4-c': { const g = n >= 7 ? 'fade' : null; return L.guess === g && !!L.power === (n >= 8) && !!L.fast === (n >= 9); }
    case 'tab-cuso4-cu': { const s = { 6: null, 7: ['c', 'c'], 8: ['cu', 'cu'], 9: ['c', 'cu'] }[n]; if (!s) return !L.power && !L.fast; return L.neg === s[0] && L.pos === s[1] && L.power && L.fast; }
    case 'tab-plating': {
      if (n === 6) return L.spoon === 'pos' && L.other === 'cu' && L.liquid === 'water' && !L.power;
      if (n === 7) return L.spoon === 'pos' && L.liquid === 'water' && L.power;
      if (n === 8) return L.spoon === 'pos' && L.liquid === 'cuso4' && L.power;
      if (n === 9) return L.spoon === 'neg' && L.liquid === 'cuso4' && L.power;
      return L.spoon === 'neg' && L.liquid === 'cuso4' && (L.rinsing || L.rinsed);
    }
  }
  return false;
}
function stateOk(e, st) {
  if (!e) return false;
  if (st.tabId !== e.tab) return false;
  if (e.step === 0) return true;
  if (e.step <= 5) return st.animStep === e.step;
  return labOk(e.tab, e.step, st.lab);
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  const SPEED = Number(process.env.SPEED || 1);
  if (SPEED > 1) await page.addInitScript((sp) => {
    const op = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { this.playbackRate = sp; return op.call(this); };
    const st = window.setTimeout; window.setTimeout = function (f, ms, ...a) { return st(f, (ms > 300 ? ms / sp : ms), ...a); };
  }, SPEED);
  await page.goto('http://127.0.0.1:8803/electrolysis_5.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  const hlHits = {};
  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 40 * 60 * 1000;
  let last = 0, teacherDuringPlay = false, shotN = 0, probed = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const act = document.querySelector('.tab-content.active');
      const tabId = act ? act.id : null;
      const key = { 'tab-intro': 'intro', 'tab-water': 'water', 'tab-cuso4-c': 'cuc', 'tab-cuso4-cu': 'cucu', 'tab-plating': 'plating' }[tabId];
      const btns = act ? [...act.querySelectorAll('.step-row .step-btn')] : [];
      const ai = btns.findIndex(b => b.classList.contains('active'));
      let lab = null;
      try {
        const s = window.ElLab[key]._state();
        lab = Object.assign({}, s);
        if (key === 'intro') lab = { electrode: s.electrode, liquid: s.liquid, power: s.power };
        if (key === 'cuc') lab = { guess: s.guess, power: s.power, fast: s.fast };
        if (key === 'cucu') lab = { neg: s.neg, pos: s.pos, power: s.power, fast: s.fast };
        if (key === 'plating') lab = { spoon: s.spoon, other: s.other, liquid: s.liquid, power: s.power, rinsing: s.rinsing, rinsed: s.rinsed };
        if (key === 'water') {
          const a = s.asm; let L;
          if (!a.done) { if (a.step <= 0) L = 6; else if (a.step === 1) L = 7; else if (a.step === 2) L = 8; else if (a.step === 3) L = a.mounted ? 10 : 9; else if (a.step === 4) L = 10; else L = 10.5; }
          else if (s.lastTest || s.testing) L = s.tube === 'pos' ? 14 : 13; else if (s.power || s.tc > 0) L = 12; else L = 11;
          lab = { level: L, full: s.full, h2: s.h2 };
        }
      } catch (e) {}
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 9999;
      const cvs = {};
      ['intro', 'water', 'cuc', 'cucu', 'plating'].forEach(k => ['Anim', 'Lab'].forEach(t => { const c = document.getElementById(k + t + 'Canvas'); if (c) { const r = c.getBoundingClientRect(); cvs[k + t] = { top: r.top, bottom: r.bottom, ok: r.top >= 0 && r.bottom <= top + 2, vis: Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / r.height }; } }));
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '', tabId, key, animStep: ai + 1, lab, cvs,
        hl: [...document.querySelectorAll('.vx-hl')].filter(e => e.style.display !== 'none').map(e => Math.round(parseFloat(e.style.width))),
        teacher: document.body.classList.contains('mode-teacher'), pin: pin ? pin.textContent : ''
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) { seen[n] = { st0: st, t0: Date.now() }; }
      seen[n].last = st;
      if (st.hl.length) hlHits[n] = Math.max(hlHits[n] || 0, st.hl.length);
      last = n;
      if (SHOT && !seen[n].shot && Date.now() - seen[n].t0 > 1800) { seen[n].shot = 1; fs.mkdirSync(SHOT, { recursive: true }); await page.screenshot({ path: path.join(SHOT, 'L' + String(n).padStart(3, '0') + '.png') }).catch(() => {}); shotN++; }
    }
    if (st.teacher) teacherDuringPlay = true;
    if (last >= lines.length) { await page.waitForTimeout(3000); break; }
    if (!probed && Date.now() - started > 3000) { probed = true; await page.click('#mode-teacher').catch(() => {}); }
    await page.waitForTimeout(120);
  }

  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!e) continue;   // 開場白
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const e2 = expectEnd(n), sl = s.last || s.st0;
    const ok = (stateOk(e, sl)) || (e2 && stateOk(e2, sl)) || (stateOk(e, s.st0));
    if (!ok) { mismatches++; report.push({ n, expect: e, expectEnd: e2, got: { tab: sl.tabId, step: sl.animStep, lab: sl.lab } }); }
  }
  // 畫布要完整在字幕框上方（以該句期望的畫面為準；實驗台至少露出 85%）
  const canvasBad = [];
  Object.keys(seen).forEach(k => {
    const n = Number(k), v = seen[k], e = expectEnd(n) || expect(n); if (!e || e.step === 0) return;
    const key = LAB[e.tab], id = key + (e.step <= 5 ? 'Anim' : 'Lab'), c = (v.last || v.st0).cvs[id];
    if (c && (e.step <= 5 ? !c.ok : c.vis < 0.85)) canvasBad.push({ n, vis: +c.vis.toFixed(2) });
  });
  const result = { canvasBad, observed: Object.keys(seen).length, lines: lines.length, mismatches, teacherDuringPlay, hlHits, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('畫布沒在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log('螢光筆有畫出的句子（句號→段數）：', JSON.stringify(hlHits));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, errors: errs.length }));
  if (report.length) console.log(JSON.stringify(report.slice(0, 14)));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
