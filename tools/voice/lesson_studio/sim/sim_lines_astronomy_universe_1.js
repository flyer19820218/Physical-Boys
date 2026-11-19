// astronomy_universe_1 逐句模擬：以假音訊（真實時間流動，每句約 2.4～3.5 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（分頁、宇宙縮放層級 z、星光旅行選哪顆／有沒有走完、銀河系視角、太陽系篩選與轉動、成員選取、比例模式、適居行星卡），
//    與 stage.json 推算的期望逐句比對；「late」欄位（宇宙縮放鏡頭飛行 2 秒）只在句尾比對
//  ・該轉動的（太陽系）句尾那一段時間值要在變
//  ・全程不得出現 body.mode-teacher；每句結束時該句的主畫面要在畫面內（扣掉字幕框，至少露出 50%）
//  ・有螢光筆標記的句子：句尾要畫出至少 segs 條線，而且都在字幕框上方的畫面內
//  ・整課播完後各狀態還原；再測「進度條跳句 → 暫停凍住 → 繼續 → 停止還原」
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_astronomy_universe_1.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/astronomy_universe_1/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_au1_result.json');
const SHOTDIR = path.dirname(OUT);
const playerSrc = fs.readFileSync(path.join(REPO, 'astronomy_universe_1_voice_v1.js'), 'utf8');
const HLSEG = {};   // 句號 → 標記段數
{ const m = playerSrc.match(/var HLSPEC = \{([\s\S]*?)\n  \};/); const re = /"(\d+)": \[((?:.|\n)*?)\](?:,\n|\n)/g; let x;
  const body = m ? m[1] : ''; body.split('\n').forEach(l => { const k = /^\s*"(\d+)": \[/.exec(l); if (k) HLSEG[k[1]] = (l.match(/\{ s:/g) || []).length; }); }

const MBK = { 7: null, 8: 'planet', 9: 'dwarf', 10: 'small', 11: 'moon' };
const HABS = { 5: 0, 6: 1, 7: 3, 8: 2 };
function want(tab, step) {
  step = step || 1;
  const w = { tab, late: {} };
  if (tab === 'tab1') w.late.zmZ = step <= 5 ? step - 1 : 4;
  else if (tab === 'tab2') {
    if (step === 1) Object.assign(w, { lyIdx: 2, lyRun: false });
    else if (step === 2) Object.assign(w, { lyIdx: 0, lyRun: false });
    else if (step <= 5) w.lyIdx = step - 3;
    else Object.assign(w, { lyIdx: 2, lyRun: false, lyP: 1 });
  }
  else if (tab === 'tab3') w.gx = step === 3 ? 'side' : 'top';
  else if (tab === 'tab4') {
    const f = step === 3 ? 'terrestrial' : step === 4 ? 'giant' : 'all';
    Object.assign(w, { soF: step <= 11 || true ? f : null, soRun: true });
    if (step <= 6) w.mb = null; else if (step <= 11) w.mb = MBK[step];
    if (step >= 12) delete w.mb;
    if (step <= 5 || step === 6) w.run = 'soT';
  }
  else if (tab === 'tab5') {
    w.rs = step <= 2 ? 'distance' : 'size';
    w.habit = step >= 5 && step <= 8 ? HABS[step] : 2;
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
    window.__log = []; window.__teacherSeen = 0; window.__FAST = !!(window.__FASTENV);
    window.__snap = () => {
      const q = s => document.querySelector(s);
      const g = f => { try { return f(); } catch (e) { return null; } };
      const tb = q('.tab-btn.active');
      const r1 = x => Math.round(x * 10) / 10;
      return {
        tab: tb ? tb.dataset.tab : null,
        zmZ: g(() => r1(zoomState.z)), lyIdx: g(() => lightState.idx), lyRun: g(() => lightState.running), lyP: g(() => r1(lightState.p)),
        gx: g(() => GX.view), soF: g(() => solarState.filter), soRun: g(() => solarState.running), soT: g(() => r1(solarState.t)),
        mb: g(() => MB.sel), rs: g(() => RS.mode), habit: g(() => { const c = q('.planet-card.active'); return c ? +c.dataset.habit : null; }),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    window.__viewEl = (tab, step) => {
      const P = i => document.querySelectorAll('.panel')[i], $ = id => document.getElementById(id);
      const H2 = i => P(i).querySelectorAll(':scope > h2'), N = i => P(i).querySelector('.v5-notes'), TW = i => P(i).querySelectorAll(':scope > .table-wrap');
      if (tab === 'tab1') return step <= 5 ? $('zm-stage') : step === 6 ? P(0).querySelector('.levels') : step === 7 ? P(0).querySelector('.grid-2c') : N(0);
      if (tab === 'tab2') return step === 1 ? H2(1)[0] : step <= 6 ? $('ly-stage') : step === 7 ? P(1).querySelector('.grid-2c') : N(1);
      if (tab === 'tab3') return step === 1 ? H2(2)[0] : step <= 4 ? $('gx-stage') : step === 5 ? $('gt-stage') : N(2);
      if (tab === 'tab4') return step <= 5 ? $('so-stage') : step === 6 ? TW(3)[0] : step <= 11 ? $('mb-stage') : step === 12 ? TW(3)[TW(3).length - 1] : N(3);
      if (tab === 'tab5') return step === 1 ? H2(4)[0] : step <= 3 ? $('rs-stage') : step === 4 ? (P(4).querySelector(':scope > .grid-2c') || TW(4)[0]) : step <= 8 ? $('habit-status') : N(4);
      return null;
    };
    window.__inView = (tab, step) => {
      let c = window.__viewEl(tab, step); if (!c) return null; if (/-stage$/.test(c.id)) c = c.querySelector('.v5-cv') || c; const r = c.getBoundingClientRect(); if (!r.height) return 0;
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top - 56)) * 100); };
    window.__cvFull = (tab, step) => { const e = window.__viewEl(tab, step); if (!e || !/-stage$/.test(e.id)) return null; const c = e.querySelector('canvas'); if (!c) return null;
      const r = c.getBoundingClientRect(), bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      let top = bub ? bub.getBoundingClientRect().top : innerHeight; if (pin) top = Math.min(top, pin.getBoundingClientRect().top);
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / r.height * 100); };
    window.__hl = () => { const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      let top = bub ? bub.getBoundingClientRect().top : innerHeight; if (pin) top = Math.min(top, pin.getBoundingClientRect().top);
      const els = Array.from(document.querySelectorAll('.vx-hl')).filter(e => e.style.display === 'block');
      return { shown: els.length, inView: els.filter(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= top + 2; }).length }; };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; this._acc = 0; this._end = 0; }
      set src(v) { this._src = v; this._acc = 0; } get src() { return this._src; }
      get currentTime() { return this._acc + (this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000); }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        if (!this._acc) this.duration = (window.__FAST ? 1.3 : Math.min(3.5, Math.max(2.4, txt.length * 0.08)));
        this.paused = false; this._t0 = performance.now();
        let rec = window.__log.length && window.__log[window.__log.length - 1].src === src && !window.__log[window.__log.length - 1].end ? window.__log[window.__log.length - 1] : null;
        if (!rec) { rec = { src, start: window.__snap(), polls: [] }; window.__log.push(rec); }
        clearInterval(this._poll); clearTimeout(this._end);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s); }, 40);
        this._end = setTimeout(() => {
          if (self._src !== src || self.paused) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); rec.hl = window.__hl(); rec.away = document.body.dataset.vxAway === '1'; rec.stageView = (() => { const tb0 = document.querySelector('.tab-btn.active'); return false; })();
          rec.vis = {}; const tb = document.querySelector('.tab-btn.active'); const tab = tb && tb.dataset.tab;
          rec.cv = {}; for (let st = 1; st <= 13; st++) { rec.vis[st] = window.__inView(tab, st); rec.cv[st] = window.__cvFull(tab, st); }
          self.paused = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) { this._acc += (performance.now() - this._t0) / 1000; } this.paused = true; clearInterval(this._poll); clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/astronomy_universe_1.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  const flags0 = await page.evaluate(() => { const s = window.__snap(); return { zmZ: s.zmZ, lyIdx: s.lyIdx, soF: s.soF, mb: s.mb, rs: s.rs, habit: s.habit }; });
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '07': 1.2, '15': 2.6, '20': 1.4, '22': 1.8, '26': 2.2, '35': 1.8, '44': 2.4, '49': 2.2, '59': 2.4, '62': 2.4, '71': 2.2, '79': 2.4, '82': 2.2, '92': 2.2, '101': 2.2, '109': 2.2, '113': 2.4, '118': 2.2, '122': 2.4, '124': 2.2 };
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
      await page.screenshot({ path: path.join(SHOTDIR, 'au1_shot_' + k + '.png') });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const flags1 = await page.evaluate(() => { const s = window.__snap(); return { zmZ: s.zmZ, lyIdx: s.lyIdx, soF: s.soF, mb: s.mb, rs: s.rs, habit: s.habit }; });

  // ── 額外：跳到第 91 句（成員圖）→ 暫停（太陽系時間凍住）→ 繼續 → 跳到第 110 句 → 停止（狀態還原）──
  const extra = [];
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(400);
  let bb = await (await page.$('.vx-line')).boundingBox();
  await page.mouse.click(bb.x + bb.width * (83.5 / lines.length), bb.y + bb.height / 2);   // 第 84 句：類木行星
  await page.waitForTimeout(900);
  const j1 = await page.evaluate(() => window.__snap());
  if (!(j1.tab === 'tab4' && j1.soF === 'giant')) extra.push('跳到第 84 句後畫面不對：' + JSON.stringify(j1));
  await page.click('button[aria-label="暫停"]');
  const p1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(600); const p2 = await page.evaluate(() => window.__snap());
  if (p1.soT !== p2.soT) extra.push(`暫停時太陽系時間仍在走 ${p1.soT}→${p2.soT}`);
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(600); const p3 = await page.evaluate(() => window.__snap());
  if (p3.soT === p2.soT) extra.push('繼續後太陽系時間沒有再走');
  bb = await (await page.$('.vx-line')).boundingBox();
  await page.mouse.click(bb.x + bb.width * (122.5 / lines.length), bb.y + bb.height / 2);   // 第 123 句：火星
  await page.waitForTimeout(900);
  const k1 = await page.evaluate(() => window.__snap());
  if (!(k1.tab === 'tab5' && k1.habit === 3 && k1.rs === 'size')) extra.push('跳到第 123 句後畫面不對：' + JSON.stringify(k1));
  bb = await (await page.$('.vx-line')).boundingBox();
  await page.mouse.click(bb.x + bb.width * (19.5 / lines.length), bb.y + bb.height / 2);   // 第 20 句：月球（z=4）
  await page.waitForTimeout(2800);
  const k2 = await page.evaluate(() => window.__snap());
  if (!(k2.tab === 'tab1' && k2.zmZ === 4)) extra.push('跳到第 20 句後畫面不對：' + JSON.stringify(k2));
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(600);
  const flags2 = await page.evaluate(() => { const s = window.__snap(); return { zmZ: s.zmZ, lyIdx: s.lyIdx, soF: s.soF, mb: s.mb, rs: s.rs, habit: s.habit }; });
  const hlLeft = await page.evaluate(() => document.querySelectorAll('.vx-hl').length);
  if (hlLeft) extra.push('停止後螢光筆還留在畫面上 ' + hlLeft);
  await page.screenshot({ path: path.join(SHOTDIR, 'au1_shot_stop.png') });
  await browser.close();

  const IGN = ['late', 'run'];
  const flat = w => Object.assign({}, w, w.late);
  const match = (w, s, withLate) => { const f = withLate ? flat(w) : w; return !!s && Object.keys(f).filter(k => !IGN.includes(k) || (k === 'late' && false)).filter(k => k !== 'late' && k !== 'run').every(k => s[k] === f[k]); };
  const diff = (w, s) => { const f = flat(w); return Object.keys(f).filter(k => k !== 'late' && k !== 'run' && (!s || s[k] !== f[k])).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(f[k])}`); };
  let bad = 0; const rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(s => want(s.tab, s.step));
    if (!match(W[0], r.start, false)) probs.push('開始：' + diff(W[0], r.start).join(','));
    const all = [r.start, ...r.polls, r.end];
    let k = 0, from = 0;
    for (let j = 0; j < all.length; j++) { if (k < W.length && match(W[k], all[j], false)) { k++; from = j; } }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    const last = W[W.length - 1], lastS = e.seq[e.seq.length - 1];
    if (!match(last, r.end, true)) probs.push('結束：' + diff(last, r.end).join(','));
    const tail = all.slice(Math.min(all.length - 1, from + 10));
    if (last.run) { const vals = new Set(tail.map(s => s && s[last.run])); if (vals.size < 2) probs.push(`${last.run} 沒有在動`); }
    const vis = r.vis ? r.vis[lastS.step || 1] : null;
    if (!(vis >= 50) && !r.away) probs.push(`主畫面（${fmt(lastS)}）只露出 ${vis}%`);
    const cvf = r.cv ? r.cv[lastS.step || 1] : null;
    if (cvf !== null && cvf < 98 && !r.away) probs.push(`動畫畫布沒有整個在主屏內（只露出 ${cvf}%）`);
    const need = HLSEG[e.id];
    if (need) { if (!r.hl || r.hl.shown < need) probs.push(`螢光筆只畫了 ${r.hl && r.hl.shown} 條，應至少 ${need}`); else if (!r.away && cvf === null && r.hl.inView < r.hl.shown) probs.push(`螢光筆有 ${r.hl.shown - r.hl.inView} 條不在字幕框上方的畫面內`); }
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 16), expect: e.seq.map(fmt).join(' → '), start: r.start, end: r.end, vis, hl: r.hl, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(flags0, flags1)) { bad++; console.log('✗ 播完後狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags1)); }
  if (!same(flags0, flags2)) { bad++; console.log('✗ 停止後狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags2)); }
  extra.forEach(x => { bad++; console.log('✗ ' + x); });
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors, flags0, flags1, flags2, extra }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
