// astronomy_sunpath_3 逐句模擬：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（分頁、季節、天球子頁與鏡頭、緯度滑桿與按鈕、資優頁視角／太陽／軌跡／日期、各動畫是否運轉），
//    與 stage.json 推算的期望逐句比對；「late」欄位（鏡頭轉動、地球沿軌道走）只在句尾比對
//  ・該運轉的（晝夜觀察者、三視角時間、公轉、天球時間、歲差）句尾那一段數值要在變；該定格的（正午）要不變
//  ・全程不得出現 body.mode-teacher；每句結束時該句的畫布要在畫面內（扣掉字幕框，至少露出 50%），表格要完整露出（≥90%）
//  ・整課播完後：各動畫的播放狀態要還原成開始前；再測「進度條跳句 → 暫停凍住 → 繼續 → 停止還原」
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_astronomy_sunpath_3.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/astronomy_sunpath_3/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_as3_result.json');
const SHOTDIR = path.dirname(OUT);

// ── 期望狀態（與 astronomy_sunpath_3_voice_v1.js 的步驟表相同）──
const SEAS = [null, 'summer', 'equinox', 'winter'];
const T3 = [null, [23.5, 'summer', 1], [0, 'summer', 1], [90, 'summer', 1], [23.5, 'equinox', 1], [23.5, 'winter', 1],
            [23.5, 'summer', 0], [23.5, 'winter', 0], [90, 'winter', 1]];
function want(tab, sub, step) {
  step = step || 1;
  const w = { tab, late: {} };
  const key = sub || tab;
  if (key === 'tab1') Object.assign(w, { season1: SEAS[step], dlRun: true, cvs: 'dayLenCanvas', run: 'dlT' });
  else if (key === 'sub1') { Object.assign(w, { csSub: 'sub1', csUI: 'sub1', cvs: 'skyCanvas' }); w.late.cam = step === 2 ? 'top' : 'side'; }
  else if (key === 'sub2') Object.assign(w, { csSub: 'sub2', csUI: 'sub2', cam: 'side', cvs: 'skyCanvas' });
  else if (key === 'tab3') {
    const s = T3[step];
    Object.assign(w, { lat: s[0], latUI: s[0], latBtn: s[0], season3: s[1], seaUI: s[1], syRun: !!s[2], cvs: 'syncCanvas' });
    if (s[2]) w.run = 'syT'; else { w.frozen = 'syT'; w.syT = 12; }
  }
  else if (key === 'tab4') { if (step <= 3) Object.assign(w, { coS: SEAS[step], coUI: SEAS[step], cvs: 'consoleCanvas' }); else w.see = ['co-table']; }
  else if (key === 'helio') {
    Object.assign(w, { view: 'helio', viewUI: 'helio', sun: false, pks: '', zdRun: step === 2, pcRun: false, cvs: 'zodiacCanvas' });
    if (step === 1 || step === 3 || step === 6) Object.assign(w, { dayOff: 0, anim: false, frozen: 'zdD' });
    else if (step === 2) w.run = 'zdD';
    else { w.late.sign = step === 4 ? 10 : 7; w.late.anim = false; }      // 10＝水瓶座、7＝天蠍座
    if (step === 6) { w.cvs = null; w.seeTop = 'zd-notes'; }                 // 總結：捲到重點筆記（比畫面高，只要求開頭露出）
  }
  else if (key === 'tw') {
    Object.assign(w, { view: 'tw', viewUI: 'tw', sun: step >= 2, sunUI: step >= 2, pks: step >= 3 ? [2, 5, 8].slice(0, step - 2).join(',') : '',
      zdRun: false, pcRun: false, dayOff: 0, cvs: 'zodiacCanvas', run: 'zdT' });
  }
  else if (key === 'disc') {
    Object.assign(w, { view: 'disc', viewUI: 'disc', sun: true, pks: '', zdRun: false, pcRun: false, zdT: 0, cvs: 'zodiacCanvas' });
    if (step === 1) Object.assign(w, { dayOff: 0, anim: false }); else { w.late.dayOff = step === 3 ? 213 : 183; w.late.anim = false; }   // 3＝六加一個月
  }
  else if (key === 'pc') Object.assign(w, { pcRun: true, zdRun: false, cvs: 'precCanvas', run: 'pcY' });
  if (sub && ['helio', 'tw', 'disc', 'pc'].includes(sub)) w.tab = 'tab5';
  if (sub && ['sub1', 'sub2'].includes(sub)) w.tab = 'tab2';
  return w;
}
const fmt = s => s.tab + (s.sub ? '/' + s.sub : '') + '#' + (s.step || 1);

// ── 依序套用 cut / at / acts，得到每句的期望狀態序列 ──
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
      const tb = q('.tab-btn.active');
      const r1 = x => Math.round(x * 10) / 10;
      return {
        tab: tb ? tb.dataset.tab : null,
        season1: g(() => dl.season), dlRun: g(() => dl.playing), dlT: g(() => r1(dl.time)),
        csSub: g(() => cs.sub), csUI: g(() => q('#btn-t3-sub1').classList.contains('active') ? 'sub1' : q('#btn-t3-sub2').classList.contains('active') ? 'sub2' : null),
        cam: g(() => cs.phi < -1.25 ? 'top' : cs.phi > -0.6 && Math.abs(cs.theta) < 0.01 ? 'side' : 'mid'),
        lat: g(() => sy.lat), latUI: g(() => +q('#lat-range').value), latBtn: g(() => { const b = q('.sy-lat.active'); return b ? +b.dataset.lat : null; }),
        season3: g(() => sy.season), seaUI: g(() => { const b = q('.sy-season.active'); return b ? b.dataset.season : null; }),
        syRun: g(() => sy.playing), syT: g(() => r1(sy.time)),
        coS: g(() => co.season), coUI: g(() => { const b = q('.co-season.active'); return b ? b.dataset.season : null; }),
        view: g(() => zd.view), viewUI: g(() => { const b = q('.zd-view.active'); return b ? b.dataset.v : null; }),
        sun: g(() => zd.sun), sunUI: g(() => q('#zdSunBtn').classList.contains('active')),
        pks: g(() => zd.pathOn ? zd.pks.join(',') : ''), sign: g(() => zdSign(zdLam(zd.d))),
        dayOff: g(() => Math.round(zdWrap(zd.d - ZD_TODAY, 365))), zdD: g(() => r1(zd.d)), zdT: g(() => r1(zd.t)), zdRun: g(() => zd.playing), anim: g(() => !!zd.anim),
        pcRun: g(() => pc.playing), pcY: g(() => Math.round(pc.y)),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    // 範圍露出比例（扣掉底部字幕框）
    window.__inView = id => {
      const c = id === 'co-table' ? (document.querySelectorAll('.panel')[3] || document).querySelector('.table-wrap') : document.getElementById(id);
      if (!c) return null; const r = c.getBoundingClientRect(); if (!r.height) return 0;
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top)) * 100); };
    // 元素開頭是否露在畫面上（上緣在 0～字幕框上方 120px 之間）
    window.__topIn = id => { const c = document.getElementById(id); if (!c) return null; const r = c.getBoundingClientRect();
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight; return r.top >= 0 && r.top <= top - 120; };
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
          ['dayLenCanvas', 'skyCanvas', 'syncCanvas', 'consoleCanvas', 'zodiacCanvas', 'precCanvas', 'co-table'].forEach(id => rec.view[id] = window.__inView(id));
          rec.top = { 'zd-notes': window.__topIn('zd-notes') };
          self.paused = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) { this._acc += (performance.now() - this._t0) / 1000; } this.paused = true; clearInterval(this._poll); clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/astronomy_sunpath_3.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  const flags0 = await page.evaluate(() => ({ dl: dl.playing, sy: sy.playing, zd: zd.playing, pc: pc.playing }));
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '07': 1.0, '27': 1.4, '29': 1.4, '34': 1.0, '53': 1.2, '58': 1.2, '62': 1.0, '64': 1.0, '68': 2.6, '82': 1.2, '89': 1.0, '97': 2.0, '98': 2.0, '101': 1.2, '103': 2.6, '106': 1.0, '107': 2.0, '108': 2.0, '112': 1.2, '115': 2.0, '96': 2.0 };
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
      await page.screenshot({ path: path.join(SHOTDIR, 'as3_shot_' + k + '.png') });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const flags1 = await page.evaluate(() => ({ dl: dl.playing, sy: sy.playing, zd: zd.playing, pc: pc.playing }));

  // ── 額外：進度條跳到第 101 句 → 暫停（時間凍住）→ 繼續（時間再走）→ 停止（播放狀態還原）──
  const extra = [];
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(400);
  const bar = await page.$('.vx-line'); const bb = await bar.boundingBox();
  await page.mouse.click(bb.x + bb.width * (100.5 / lines.length), bb.y + bb.height / 2);
  await page.waitForTimeout(800);
  const j1 = await page.evaluate(() => window.__snap());
  if (!(j1.tab === 'tab5' && j1.view === 'tw' && j1.sun === true)) extra.push('跳到第 101 句後畫面不對：' + JSON.stringify({ tab: j1.tab, view: j1.view, sun: j1.sun }));
  await page.click('button[aria-label="暫停"]');
  const p1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(600); const p2 = await page.evaluate(() => window.__snap());
  if (p1.zdT !== p2.zdT) extra.push(`暫停時天球時間仍在走 ${p1.zdT}→${p2.zdT}`);
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(500); const p3 = await page.evaluate(() => window.__snap());
  if (p3.zdT === p2.zdT) extra.push('繼續後天球時間沒有再走');
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(200);
  const flags2 = await page.evaluate(() => ({ dl: dl.playing, sy: sy.playing, zd: zd.playing, pc: pc.playing }));
  await page.screenshot({ path: path.join(SHOTDIR, 'as3_shot_stop.png') });
  await browser.close();

  const skip = (w, k, withLate) => ['cvs', 'see', 'seeTop', 'run', 'frozen', 'late'].includes(k) || (!withLate && k in w.late);
  const flat = w => Object.assign({}, w, w.late);
  const match = (w, s, withLate) => { const f = withLate ? flat(w) : w; return !!s && Object.keys(f).filter(k => !['cvs', 'see', 'seeTop', 'run', 'frozen', 'late'].includes(k)).every(k => s[k] === f[k]); };
  const diff = (w, s) => { const f = flat(w); return Object.keys(f).filter(k => !['cvs', 'see', 'seeTop', 'run', 'frozen', 'late'].includes(k) && (!s || s[k] !== f[k])).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(f[k])}`); };
  let bad = 0; const rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(s => want(s.tab, s.sub, s.step));
    if (!match(W[0], r.start, false)) probs.push('開始：' + diff(W[0], r.start).join(','));
    const all = [r.start, ...r.polls, r.end];
    let k = 0, from = 0;
    for (let j = 0; j < all.length; j++) { if (k < W.length && match(W[k], all[j], false)) { k++; from = j; } }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    const last = W[W.length - 1];
    if (!match(last, r.end, true)) probs.push('結束：' + diff(last, r.end).join(','));
    // 句尾那一段：該運轉的要在變、該定格的不能變（從最後一個狀態出現後 0.4 秒起算，避開轉場）
    const tail = all.slice(Math.min(all.length - 1, from + 10));
    if (last.run) { const vals = new Set(tail.map(s => s && s[last.run])); if (vals.size < 2) probs.push(`${last.run} 沒有在動`); }
    if (last.frozen) { const vals = new Set(tail.map(s => s && s[last.frozen])); if (vals.size > 1) probs.push(`${last.frozen} 應定格卻在變`); }
    const vis = last.cvs ? r.view && r.view[last.cvs] : null;
    if (last.cvs && !(vis >= 50)) probs.push(`畫布 ${last.cvs} 只露出 ${vis}%`);
    if (last.seeTop && !(r.top && r.top[last.seeTop])) probs.push(`${last.seeTop} 開頭沒有露出`);
    for (const id of last.see || []) { const v = r.view && r.view[id]; if (!(v >= 90)) probs.push(`${id} 只露出 ${v}%`); }
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 16), expect: e.seq.map(fmt).join(' → '), start: r.start, end: r.end, view: vis, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(flags0, flags1)) { bad++; console.log('✗ 播完後動畫播放狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags1)); }
  if (!same(flags0, flags2)) { bad++; console.log('✗ 停止後動畫播放狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags2)); }
  extra.forEach(x => { bad++; console.log('✗ ' + x); });
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors, flags0, flags1, flags2, extra }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
