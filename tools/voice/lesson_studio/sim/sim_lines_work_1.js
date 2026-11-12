// work_1 逐句模擬：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（分頁、角度、推車／煞車、書包情境、路線、兩人時間、題目公布），與 stage.json 推算的期望比對
//  ・全程不得出現 body.mode-teacher；每句結束時該畫面要在字幕框上方露出（至少 50%），公布答案的句子要完整露出解析（至少 90%）
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_work_1.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/work_1/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_w1_result.json');

// ── 期望狀態：只比對該場景相關欄位（與 work_1_voice_v1.js 的 SCENES 對照）──
const BGM = ['flat', 'stair', 'ice', 'wall'], RT = ['lift', 'steep', 'gentle'];
function want(tab, sub, step) {
  step = step || 1;
  const w = { tab };
  if (tab === 'tab1') { Object.assign(w, { jmA: [0, 0, 0, 45, 90][step], jmRan: step >= 2 }); w.cvs = 'jmCanvas'; }
  else if (tab === 'tab2') { Object.assign(w, { wkType: step <= 2 ? 'pos' : 'neg', wkRan: step === 2 || step === 4 }); w.cvs = 'workCanvas'; }
  else if (tab === 'tab3') {
    if (step <= 2) { w.bagType = step === 1 ? 'flat' : 'up'; w.cvs = 'bagCanvas'; }
    else { Object.assign(w, { bgMode: BGM[(step - 3) % 4], bgRan: step >= 7 }); w.cvs = 'bagLabCanvas'; }
  }
  else if (tab === 'tab4') { Object.assign(w, { rpRoute: step >= 2 ? RT[step - 2] : undefined, rpRan: step >= 2 }); if (step < 2) delete w.rpRoute; w.cvs = 'rpCanvas'; }
  else if (tab === 'tab5') { w.prCur = step <= 1 ? 0 : step - 1; w.cvs = step <= 1 ? null : 'pr' + (step - 1); }
  else if (tab === 'tab6') {
    if (step < 4) { Object.assign(w, { pwT1: step === 3 ? 30 : 10, pwRan: step >= 2 }); w.cvs = 'pwCanvas'; }
    else w.cvs = 'crane';
  }
  else if (tab === 'tab7') {
    const n = step > 5 ? step - 5 : step, cnt = step > 5 ? n : n - 1;
    w.rev = [1, 2, 3, 4, 5].map(k => (k !== 4 && k <= cnt) ? '1' : '0').join('');   // 第四題含斜面，講解跳過不公布
    w.cvs = 'q' + n; if (step > 5) w.see = ['fb' + n];
  }
  return w;
}
const fmt = s => s.tab + (s.sub ? '/' + s.sub : '') + '#' + (s.step || 1);

// ── 依序套用 cut / at / acts，得到每句的期望狀態 ──
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
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const g = f => { try { return f(); } catch (e) { return null; } };
      const tb = document.querySelector('.tab-btn.active');
      const cards = Array.from(document.querySelectorAll('.panel')[4].querySelectorAll('.wide-solve > .card'));
      return {
        tab: tb ? tb.dataset.tab : null,
        jmA: g(() => +document.getElementById('jm-a').value), jmRan: g(() => JM.running || JM.p > 0),
        wkType: g(() => currentWorkType), wkRan: g(() => WK.running || WK.off > 0),
        bagType: g(() => currentBagType), bgMode: g(() => BG.mode), bgRan: g(() => !!(BG.running || BG.scroll > 0 || BG.push > 0)),
        rpRoute: g(() => RP.route), rpRan: g(() => RP.running || RP.p > 0),
        prCur: cards.findIndex(c => c.classList.contains('tl-cur')) + 1,
        pwT1: g(() => +document.getElementById('pw-t1').value), pwRan: g(() => PW.running || PW.tSim > 0),
        rev: g(() => [1, 2, 3, 4, 5].map(n => QREV[n] ? '1' : '0').join('')),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    // 畫面露出比例（扣掉底部字幕框）
    const elOf = id => {
      if (id === 'crane') { const cs = Array.from(document.querySelectorAll('.panel')[5].querySelectorAll('.card')); return cs.find(c => c.textContent.indexOf('起重機') >= 0); }
      let m = /^pr(\d)$/.exec(id); if (m) return Array.from(document.querySelectorAll('.panel')[4].querySelectorAll('.wide-solve > .card'))[+m[1] - 1];
      m = /^q(\d)$/.exec(id); if (m) return document.getElementById('qc' + m[1]).closest('.quiz-item');
      return document.getElementById(id);
    };
    window.__inView = id => { const c = elOf(id);
      if (!c) return null; const r = c.getBoundingClientRect();
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
          ['jmCanvas', 'workCanvas', 'bagCanvas', 'bagLabCanvas', 'rpCanvas', 'pr1', 'pr2', 'pwCanvas', 'crane', 'q1', 'q2', 'q3', 'q4', 'q5', 'fb1', 'fb2', 'fb3', 'fb4', 'fb5'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/work_1.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = {};
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
      await page.screenshot({ path: path.join(path.dirname(OUT), 'shot_' + k + '.png') });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  await browser.close();

  const NOSTATE = ['cvs', 'see'];   // 這兩個是「要露出哪裡」，不是頁面狀態
  const match = (w, s) => !!s && Object.keys(w).filter(k => !NOSTATE.includes(k)).every(k => s[k] === w[k]);
  const diff = (w, s) => Object.keys(w).filter(k => !NOSTATE.includes(k) && (!s || s[k] !== w[k])).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(w[k])}`);
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
    const vis = last.cvs ? r.view && r.view[last.cvs] : null;
    if (last.cvs && !(vis >= 50)) probs.push(`畫布 ${last.cvs} 只露出 ${vis}%`);
    for (const id of last.see || []) { const v = r.view && r.view[id]; if (!(v >= 90)) probs.push(`${id} 只露出 ${v}%`); }
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 14), expect: e.seq.map(fmt).join(' → '), view: vis, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
