// 以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課：
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面每一顆按鈕的 active／on 狀態，與 stage.json（cuts／at／acts）推算的期望比對
//  ・全程檢查不得出現 body.mode-teacher；每句結束時該場景的畫布要在畫面內（＊切頁後也要捲到畫布）
//  ・旁白講到 串聯／並聯／電流／電子 的句子，列出當下被點亮的按鈕文字（DOM 證明）
// 用法：NODE_PATH=$(npm root -g) node sim_lines.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const REPO = require('path').resolve(__dirname, '../../../../audio/electronics_2') + '/';  // 新課：改課名與下面的 want()／CVS／選擇器
const manifest = JSON.parse(fs.readFileSync(REPO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(REPO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || '/tmp/claude-0/sim/sim_result.json';

// ── 場景 → 期望的按鈕狀態（只比對該場景相關欄位）──
const BULB = [null, 'series', 'parallel', 'complex', 'series', 'parallel'];
function want(tab, sub, step) {
  step = step || 1;
  const w = { tab };
  switch (sub) {
    case 'sym': case 'sp': w.t1sub = sub; break;
    case 'water': w.t2sub = 'water'; w.t2cells = step <= 2 ? 1 : 2; w.t2view = step % 2 ? 'macro' : 'micro'; break;
    case 'par': w.t2sub = 'par'; w.t2view = step === 1 ? 'macro' : 'micro'; break;
    case 'def': case 'pot': w.t2sub = sub; break;
    case 'closed': case 'open': case 'short': w.t3 = sub; break;
    case 'battery': w.t4sub = 'battery'; w.bat = step; break;
    case 'bulb': w.t4sub = 'bulb'; w.bulb = BULB[step]; w.cut = step >= 4; break;
    case 'quiz': w.t4sub = 'quiz'; w.ans = step === 2; break;
    case 'normal': w.t5mode = 'normal'; w.t5task = 0; break;
    case 'ammeter_error': w.t5mode = 'ammeter_error'; w.t5task = 1; break;
    case 'voltmeter': w.t5mode = 'voltmeter'; w.t5task = 2; break;
    case 'meter_a': w.mha = step - 1; break;
    case 'meter_v': w.mhv = step - 1; break;
    case 'wire': {
      let lv = 0, n = 0, sel = false, on = false, pass = false;
      if (step >= 9) lv = 2;
      if (step >= 2 && step <= 7) { const m = step - 2; n = (m >> 1) + (m & 1); sel = !(m & 1); }
      else if (step === 8) { n = 3; on = true; pass = true; }
      else if (step >= 10 && step <= 21) { const m = step - 10; n = (m >> 1) + (m & 1); sel = !(m & 1); }
      else if (step === 22) { n = 6; on = true; }
      else if (step === 23) { n = 6; on = true; pass = true; }
      Object.assign(w, { wlv: lv, wn: n, wsel: sel, won: on, wpass: pass }); break; }
    case 'ladder': w.t6view = 'ladder'; break;
    case 'ref': w.t6view = 'ref'; break;
  }
  return w;
}
const CVS = { sym: 'cvs-tab1', sp: 'cvs-tab1', water: 'cvs-tab2', par: 'cvs-tab2', def: 'cvs-tab2', pot: 'cvs-tab2',
  closed: 'cvs-tab3', open: 'cvs-tab3', short: 'cvs-tab3', battery: 'cvs-tab4', bulb: 'cvs-tab4', quiz: 'cvs-tab4',
  normal: 'cvs-tab5', ammeter_error: 'cvs-tab5', voltmeter: 'cvs-tab5', meter_a: 'cvs-mh-a', meter_v: 'cvs-mh-v',
  wire: 'cvs-wire', ladder: 'cvs-t6', ref: 'cvs-t6' };
const STEPPED = ['water', 'par', 'battery', 'bulb', 'quiz', 'meter_a', 'meter_v', 'wire', 'ladder'];

// ── 依序套用 cut / at / acts，得到每句的期望序列 ──
const lines = [];
let cur = null, afterCut = false;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, sub: c.sub, step: 1 }; afterCut = true; }
    continue;
  }
  const a = stage.at[it.id];
  if (a) cur = { tab: a.tab, sub: a.sub, step: a.step || 1 };
  const seq = [cur];
  for (const x of (stage.acts && stage.acts[it.id]) || []) { cur = { tab: x[1], sub: x[2], step: x[3] }; seq.push(cur); }
  lines.push({ id: it.id, file: it.file, speaker: it.speaker, text: it.text, seq, afterCut });
  afterCut = false;
}
// 外電阻：每段「同一個 ladder 步驟」的最後一句結束時，滑桿要到位（1→20、2→1、3→100）
for (let i = 0; i < lines.length; i++) {
  const e = lines[i].seq[lines[i].seq.length - 1], n = lines[i + 1] && lines[i + 1].seq[0];
  if (e.sub === 'ladder' && !(n && n.sub === 'ladder' && n.step === e.step)) lines[i].wantR = [20, 1, 100][e.step - 1];
}
const fmt = s => s.tab + '/' + s.sub + (STEPPED.includes(s.sub) ? '#' + (s.step || 1) : '');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const q = s => document.querySelector(s), on = s => { const e = q(s); return !!e && (e.classList.contains('active') || e.classList.contains('on')); };
      const sub = t => { const e = q('#' + t + ' .sub-tab-btn.active'); return e ? e.dataset.sub : null; };
      const idxOn = s => [...document.querySelectorAll(s)].findIndex(b => b.classList.contains('on'));
      const g = f => { try { return f(); } catch (e) { return undefined; } };
      const tb = q('.tab-btn.active');
      const lit = [];   // 目前分頁裡被點亮、看得到的按鈕文字（DOM 證明）
      const panel = tb && q('#' + tb.dataset.tab);
      if (panel) panel.querySelectorAll('.sub-tab-btn.active, .action-btn.active, .mh-chip.on, #wl-lv .wl-btn.on').forEach(b => { if (b.offsetParent !== null) lit.push(b.textContent.trim().replace(/\s+/g, '')); });
      return {
        tab: tb ? tb.dataset.tab : null,
        t1sub: sub('tab1'), t2sub: sub('tab2'),
        t2cells: on('#btn-t2-c1') ? 1 : on('#btn-t2-c2') ? 2 : null,
        t2view: on('#btn-t2-view-macro') ? 'macro' : on('#btn-t2-view-micro') ? 'micro' : null,
        t3: on('#btn-t3-close') ? 'closed' : on('#btn-t3-open') ? 'open' : on('#btn-t3-short') ? 'short' : null,
        t4sub: sub('tab4'),
        bat: on('#btn-t4-bat-1') ? 1 : on('#btn-t4-bat-s') ? 2 : on('#btn-t4-bat-p') ? 3 : null,
        bulb: on('#btn-t4-bulb-s') ? 'series' : on('#btn-t4-bulb-p') ? 'parallel' : on('#btn-t4-bulb-c') ? 'complex' : null,
        cut: on('#btn-t4-cut'), ans: g(() => t4_quiz_ans),
        t5mode: on('#btn-t5-normal') ? 'normal' : on('#btn-t5-ammeter') ? 'ammeter_error' : on('#btn-t5-voltmeter') ? 'voltmeter' : null,
        t5task: g(() => t5_idx),
        mha: idxOn('#mh-steps-a .mh-chip'), mhv: idxOn('#mh-steps-v .mh-chip'), wlv: g(() => WIRING.state.lv), wn: g(() => WIRING.state.wires.length), wsel: g(() => !!WIRING.state.sel), won: g(() => !!WIRING.state.on), wpass: g(() => !!WIRING.state.passed),
        t6view: on('#btn-t6-ladder') ? 'ladder' : on('#btn-t6-ref') ? 'ref' : null,
        R: g(() => t6_R), teacher: document.body.classList.contains('mode-teacher'), lit
      };
    };
    // 畫布露出比例（扣掉底部字幕框）：以「畫布高度與可視高度較小者」為分母
    window.__inView = id => { const c = document.getElementById(id); if (!c) return null; const r = c.getBoundingClientRect();
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top)) * 100); };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        this.duration = Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this._t0 = performance.now();
        const rec = { src, start: window.__snap(), polls: [] };
        window.__log.push(rec);
        clearInterval(this._poll);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s); }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); rec.view = {};
          ['cvs-tab1', 'cvs-tab2', 'cvs-tab3', 'cvs-tab4', 'cvs-tab5', 'cvs-mh-a', 'cvs-mh-v', 'cvs-wire', 'cvs-t6'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/electronics_2.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '46': 1.0, '100': 1.0, '101': 1.1, '104': 0.8, '107': 1.2, '108': 1.2, '110': 0.6, '111': 1.5, '112': 0.6, '124': 1.2 };
  const t0 = Date.now();
  const shotDone = {};
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'), src: (window.__log[window.__log.length - 1] || {}).src }));
    if (st.done) break;
    if (Date.now() - t0 > 560000) { console.log('TIMEOUT'); break; }
    const m = st.src && st.src.match(/(\d{3})_/);
    const k = m ? String(+m[1]).padStart(2, '0') : null;
    if (k && shots[k] !== undefined && !shotDone[k]) {
      shotDone[k] = 1;
      await page.waitForTimeout(Math.round(shots[k] * 1500));
      await page.screenshot({ path: '/tmp/claude-0/sim/shot_' + k + '.png' });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  await browser.close();

  const match = (w, s) => !!s && Object.keys(w).every(k => s[k] === w[k]);
  const diff = (w, s) => Object.keys(w).filter(k => !s || s[k] !== w[k]).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(w[k])}`);
  let bad = 0; const rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(s => want(s.tab, s.sub, s.step));
    if (!match(W[0], r.start)) probs.push('開始：' + diff(W[0], r.start).join(','));
    let k = 0;
    for (const s of [r.start, ...r.polls, r.end]) { if (k < W.length && match(W[k], s)) k++; }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    const last = W[W.length - 1];
    if (!match(last, r.end)) probs.push('結束：' + diff(last, r.end).join(','));
    if (e.wantR !== undefined && r.end && r.end.R !== e.wantR) probs.push(`外電阻 ${r.end.R}≠${e.wantR}`);
    const fin = e.seq[e.seq.length - 1], vis = r.view && r.view[CVS[fin.sub]];
    if (!(vis >= 50)) probs.push(`畫布 ${CVS[fin.sub]} 只露出 ${vis}%`);
    const kw = e.text.match(/串聯|並聯|電流|電子/g) || [];
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 12), expect: e.seq.map(fmt).join(' → '), cut: e.afterCut,
      R: r.end && r.end.R, view: vis, kw: [...new Set(kw)].join('、'),
      lit: kw.length ? [...new Set([r.start, ...r.polls, r.end].filter(Boolean).map(s => s.lit.join('｜')))] : undefined,
      ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors }, null, 1));
  console.log('切頁後首句：', rows.filter(x => x.cut).map(x => `#${x.id} ${x.expect} 畫布${x.view}% ${x.ok ? 'OK' : 'NG'}`).join(' ｜ '));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
