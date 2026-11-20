// astronomy_earth_motion_2 逐句模擬：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（分頁、各動畫的角度／時間／選項／季節／運轉狀態、上方 ①～⑤ 亮格），
//    與 stage.json 推算的期望逐句比對；該運轉的句尾那一段數值要在變，該定格的要不變
//  ・全程不得出現 body.mode-teacher；每句結束時該句的畫布要在畫面內（扣掉字幕框，至少露出 50%），表格要完整露出（≥90%）
//  ・整課播完後：各動畫狀態要還原成「剛進頁面」；再測「進度條跳句 → 暫停凍住 → 繼續 → 停止還原」
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_astronomy_earth_motion_2.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/astronomy_earth_motion_2/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_em2_result.json');
const SHOTDIR = path.dirname(OUT);

// ── 期望狀態（與 astronomy_earth_motion_2_voice_v1.js 的 SCENES 相同）──
const MARK = { tab1: [0, 1, 2, 3, 4], tab2: [0, 1, 1, 2, 2, 3, 3, 3, 3, 4], tab3: [0, 1, 1, 3, 4], tab4: [0, 2, 4, 4, 4, 3], tab5: [0, 1, 2, 3, 4, 4, 4, 4] };
const CVS = { tab1: 'dayCanvas', tab2: 'clockCanvas', tab3: 'sunCanvas', tab4: 'orbitCanvas', tab5: 'seasonCanvas' };
function want(tab, step) {
  step = step || 1;
  const w = { tab, mark: MARK[tab][step - 1], cvs: CVS[tab] };
  if (tab === 'tab1') {
    const S = [[25, .035, true], [25, .018, true], [0, .035, false], [250, .018, true], [25, .075, true]][step - 1];
    Object.assign(w, { dnRun: S[2], dnSpeed: S[1] });
    if (S[2]) w.run = 'dnA'; else { w.dnA = S[0]; w.frozen = 'dnA'; }
  } else if (tab === 'tab2') {
    const S = [[12, null, false], [12, 'A', false], [12, 'A', true], [0, 'C', false], [0, 'C', true], [18, 'B', false], [18, 'B', true], [6, 'D', false], [6, 'D', true], [6, null, true]][step - 1];
    Object.assign(w, { ckSel: S[1], ckRev: S[2] });
    if (step === 10) w.run = 'ckT'; else { w.ckT = S[0]; w.frozen = 'ckT'; }
  } else if (tab === 'tab3') {
    const S = [[9, true], [6, false], [12, false], [18, false], [6, true]][step - 1];
    w.svRun = S[1];
    if (S[1]) w.run = 'svT'; else { w.svT = S[0]; w.frozen = 'svT'; }
  } else if (tab === 'tab4') {
    const S = [[270, true], [270, false], [0, false], [90, false], [180, false], [180, true]][step - 1];
    Object.assign(w, { obRun: S[1], zero: false });
    if (S[1]) w.run = 'obD'; else { w.obD = S[0]; w.frozen = 'obD'; }
  } else if (tab === 'tab5') {
    w.zero5 = step === 7;
    if (step <= 3) { Object.assign(w, { ssStage: 'A', g3dPlay: false }); if (step === 2) w.late = { slow: [60, 90] }; else { w.ssAng = step === 1 ? 90 : 45; w.frozen = 'ssAng'; } }
    else if (step === 4) Object.assign(w, { ssStage: 'B', g3dPlay: true, ssSeason: 'spring', run: 'g3dO' });
    else Object.assign(w, { ssStage: 'B', g3dPlay: false, ssSeason: step === 6 ? 'winter' : 'summer', g3dO: step === 6 ? 180 : 0, frozen: 'g3dO' });
    if (step === 8) { w.cvs = null; w.see = ['tab5-table']; }
  }
  return w;
}
const fmt = s => s.tab + '#' + (s.step || 1);

const lines = [];
let cur = null;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, sub: c.sub, step: 1 }; }
    continue;
  }
  const a = stage.at[it.id];
  if (a) cur = { tab: a.tab, sub: a.sub, step: a.step || 1 };
  const seq = [cur];
  for (const x of (stage.acts && stage.acts[it.id]) || []) { cur = { tab: x[1], sub: x[2], step: x[3] }; seq.push(cur); }
  lines.push({ id: it.id, file: it.file, speaker: it.speaker, text: it.text, seq });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'warning' && /有聲講解/.test(m.text())) errors.push('warn: ' + m.text()); });
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const q = s => document.querySelector(s);
      const g = f => { try { return f(); } catch (e) { return null; } };
      const r1 = x => Math.round(x * 10) / 10;
      const tb = q('.tab-btn.active');
      const panel = q('.panel.active');
      return {
        tab: tb ? tb.dataset.tab : null,
        mark: g(() => Array.prototype.findIndex.call(panel.querySelectorAll('.mission-step'), s => s.classList.contains('scale-active'))),
        dnRun: g(() => dn.running), dnSpeed: g(() => dn.speed), dnA: g(() => r1(dn.angle)),
        ckSel: g(() => ck.selected), ckRev: g(() => !!ck.reveal), ckT: g(() => r1(ck.time)),
        svRun: g(() => sv.running), svT: g(() => r1(sv.time)),
        obRun: g(() => ob.running), obD: g(() => r1(ob.deg)), zero: g(() => ob.zeroTilt),
        ssStage: g(() => ss.stage), ssAng: g(() => ss.angle), ssSeason: g(() => ss.season), zero5: g(() => !!ss.tilt0), g3dPlay: g(() => g3d.isPlaying), g3dO: g(() => r1(g3d.orbitDeg)),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    window.__inView = id => {
      const c = id === 'tab5-table' ? document.querySelectorAll('.panel')[4].querySelector('.table-wrap') : document.getElementById(id);
      if (!c) return null; const r = c.getBoundingClientRect(); if (!r.height) return 0;
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top)) * 100); };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; this._acc = 0; this._end = 0; }
      set src(v) { this._src = v; this._acc = 0; } get src() { return this._src; }
      get currentTime() { return this._acc + (this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000); }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        if (!this._acc) this.duration = Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this._t0 = performance.now();
        let rec = window.__log.length && window.__log[window.__log.length - 1].src === src && !window.__log[window.__log.length - 1].end ? window.__log[window.__log.length - 1] : null;
        if (!rec) { rec = { src, start: window.__snap(), polls: [] }; window.__log.push(rec); }
        clearInterval(this._poll); clearTimeout(this._end);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s); }, 40);
        this._end = setTimeout(() => {
          if (self._src !== src || self.paused) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); rec.view = {};
          ['dayCanvas', 'clockCanvas', 'sunCanvas', 'orbitCanvas', 'seasonCanvas', 'tab5-table'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) { this._acc += (performance.now() - this._t0) / 1000; } this.paused = true; clearInterval(this._poll); clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/astronomy_earth_motion_2.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  const init = await page.evaluate(() => { const s = window.__snap(); return { dnRun: s.dnRun, dnA: s.dnA, ckT: s.ckT, ckSel: s.ckSel, svRun: s.svRun, svT: s.svT, obRun: s.obRun, obD: s.obD, ssStage: s.ssStage, ssAng: s.ssAng, ssSeason: s.ssSeason, g3dPlay: s.g3dPlay, zero5: s.zero5, mark: s.mark }; });
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = {};
  [7, 13, 17, 22, 26, 31, 36, 40, 41, 45, 53, 58, 63, 74, 77, 80, 85, 92, 95, 100, 103, 107, 109, 117].forEach(n => shots[String(n).padStart(2, '0')] = n === 95 ? 2.4 : 1.2);
  const t0 = Date.now();
  const shotDone = {};
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'), src: (window.__log[window.__log.length - 1] || {}).src }));
    if (st.done) break;
    if (Date.now() - t0 > 900000) { console.log('TIMEOUT'); break; }
    const m = st.src && st.src.match(/(\d{3})_/);
    const k = m ? String(+m[1]).padStart(2, '0') : null;
    if (k && shots[k] !== undefined && !shotDone[k]) {
      shotDone[k] = 1;
      await page.waitForTimeout(Math.round(shots[k] * 1000));
      await page.screenshot({ path: path.join(SHOTDIR, 'em2_shot_' + k + '.png') });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const pick = s => ({ dnRun: s.dnRun, dnA: s.dnA, ckT: s.ckT, ckSel: s.ckSel, svRun: s.svRun, svT: s.svT, obRun: s.obRun, obD: s.obD, ssStage: s.ssStage, ssAng: s.ssAng, ssSeason: s.ssSeason, g3dPlay: s.g3dPlay, zero5: s.zero5, mark: s.mark });
  const end1 = await page.evaluate(() => window.__snap());

  // ── 額外：進度條跳到第 64 句（太陽運轉）→ 暫停凍住 → 繼續再走 → 跳第 100 句（公轉運轉）同樣測 → 停止還原 ──
  const extra = [];
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(400);
  async function jump(n) { const bb = await (await page.$('.vx-line')).boundingBox(); await page.mouse.click(bb.x + bb.width * ((n - 0.5) / lines.length), bb.y + bb.height / 2); await page.waitForTimeout(800); }
  await jump(64);
  const j1 = await page.evaluate(() => window.__snap());
  if (!(j1.tab === 'tab3' && j1.svRun === true)) extra.push('跳到第 64 句後畫面不對：' + JSON.stringify({ tab: j1.tab, svRun: j1.svRun }));
  await page.click('button[aria-label="暫停"]');
  const p1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(600); const p2 = await page.evaluate(() => window.__snap());
  if (p1.svT !== p2.svT) extra.push(`暫停時太陽時間仍在走 ${p1.svT}→${p2.svT}`);
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(600); const p3 = await page.evaluate(() => window.__snap());
  if (p3.svT === p2.svT) extra.push('繼續後太陽時間沒有再走');
  await jump(100);
  const k1 = await page.evaluate(() => window.__snap());
  if (!(k1.tab === 'tab5' && k1.ssStage === 'B' && k1.g3dPlay === true)) extra.push('跳到第 100 句後畫面不對：' + JSON.stringify({ tab: k1.tab, st: k1.ssStage, play: k1.g3dPlay }));
  await page.click('button[aria-label="暫停"]');
  const q1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(600); const q2 = await page.evaluate(() => window.__snap());
  if (q1.g3dO !== q2.g3dO) extra.push(`暫停時公轉仍在走 ${q1.g3dO}→${q2.g3dO}`);
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(600); const q3 = await page.evaluate(() => window.__snap());
  if (q3.g3dO === q2.g3dO) extra.push('繼續後公轉沒有再走');
  await jump(45);   // 第二分頁：觀測點轉一圈
  const c1 = await page.evaluate(() => window.__snap());
  await page.click('button[aria-label="暫停"]');
  const c2 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(600); const c3 = await page.evaluate(() => window.__snap());
  if (c2.ckT !== c3.ckT) extra.push(`暫停時時鐘仍在走 ${c2.ckT}→${c3.ckT}`);
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.__snap());
  await page.screenshot({ path: path.join(SHOTDIR, 'em2_shot_stop.png') });
  await browser.close();

  const KEYS = ['tab', 'mark', 'dnRun', 'dnSpeed', 'ckSel', 'ckRev', 'svRun', 'obRun', 'zero', 'ssStage', 'g3dPlay', 'ssSeason', 'zero5'];
  const SKIP = ['cvs', 'see', 'run', 'frozen', 'late'];
  const FIXED = ['dnA', 'ckT', 'svT', 'obD', 'ssAng', 'g3dO'];
  const match = (w, s) => !!s && Object.keys(w).filter(k => !SKIP.includes(k)).every(k => s[k] === w[k]);
  const diff = (w, s) => Object.keys(w).filter(k => !SKIP.includes(k) && (!s || s[k] !== w[k])).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(w[k])}`);
  let bad = 0; const rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(s => want(s.tab, s.step));
    if (!match(W[0], r.start)) probs.push('開始：' + diff(W[0], r.start).join(','));
    const all = [r.start, ...r.polls, r.end];
    let k = 0, from = 0;
    for (let j = 0; j < all.length; j++) { if (k < W.length && match(W[k], all[j])) { k++; from = j; } }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    const last = W[W.length - 1];
    if (!match(last, r.end)) probs.push('結束：' + diff(last, r.end).join(','));
    const tail = all.slice(Math.min(all.length - 1, from + 10));
    if (last.run) { const vals = new Set(tail.map(s => s && s[last.run])); if (vals.size < 2) probs.push(`${last.run} 沒有在動`); }
    if (last.frozen) { const vals = new Set(tail.map(s => s && s[last.frozen])); if (vals.size > 1) probs.push(`${last.frozen} 應定格卻在變`); }
    for (const f of FIXED) if (f in last && f !== last.run && !SKIP.includes(f)) { if (r.end[f] !== last[f]) probs.push(`${f}=${r.end[f]}≠${last[f]}`); }
    if (last.late && last.late.slow) { const a = r.end.ssAng; if (!(a >= last.late.slow[0] && a <= last.late.slow[1])) probs.push(`入射角 ${a} 不在 ${last.late.slow}`); const vals = new Set(all.map(s => s && s.ssAng)); if (vals.size < 2 && !(r.start.ssAng <= 60)) probs.push('入射角沒有在放斜'); }
    const vis = last.cvs ? r.view && r.view[last.cvs] : null;
    if (last.cvs && !(vis >= 50)) probs.push(`畫布 ${last.cvs} 只露出 ${vis}%`);
    for (const id of last.see || []) { const v = r.view && r.view[id]; if (!(v >= 90)) probs.push(`${id} 只露出 ${v}%`); }
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 16), expect: e.seq.map(fmt).join(' → '), view: vis, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(init, pick(end1))) { bad++; console.log('✗ 播完後各動畫沒有還原', JSON.stringify(init), '→', JSON.stringify(pick(end1))); }
  if (!same(init, pick(after))) { bad++; console.log('✗ 停止後各動畫沒有還原', JSON.stringify(init), '→', JSON.stringify(pick(after))); }
  extra.forEach(x => { bad++; console.log('✗ ' + x); });
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors, init, extra }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
