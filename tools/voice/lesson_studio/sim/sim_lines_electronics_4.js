// electronics_4 逐句模擬：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（材質、滑桿、揭曉、題號、分頁／子頁），與 stage.json 推算的期望比對
//  ・全程不得出現 body.mode-teacher；每句結束時該句的畫布要在畫面內（扣掉字幕框，至少露出 50%），
//    要講的那一塊（串並聯推導、V-I 圖、題目、破題引導、解析）要完整露出（see，至少 90%）
//  ・第 4 分頁的電壓掃描：頁面不能定格，只能從頭開始；逐句核對「從頭開始」（initTab4 被呼叫）的次數與時機
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_electronics_4.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/electronics_4/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_e4_result.json');
const SHOTDIR = path.dirname(OUT);

// ── 期望狀態：只比對該場景相關欄位 ──
// tab1：[材質, 截面積, 長度, 溫度]，一次只改一個變數（與 electronics_4_voice_v1.js 的 T1 相同）
const T1 = [null, ['ag', 2, 2, 20], ['cu', 2, 2, 20], ['fe', 2, 2, 20], ['ag', 2, 1, 20], ['ag', 2, 3, 20],
            ['ag', 1, 2, 20], ['ag', 3, 2, 20], ['ag', 2, 2, 60], ['ag', 2, 2, 100], ['ag', 1, 3, 20]];
const T2 = [null, [6, 3], [9, 3], [6, 6]];
function want(tab, sub, step) {
  step = step || 1;
  const w = { tab };
  if (tab === 'tab1') { const s = T1[step]; Object.assign(w, { mat: s[0], area: s[1], len: s[2], temp: s[3] }); w.cvs = 'cvs-tab1'; }
  else if (tab === 'tab2') { const s = T2[step]; Object.assign(w, { v: s[0], r: s[1] }); w.cvs = 'cvs-tab2'; }
  else if (tab === 'tab3') {
    const par = step === 2 || step === 4;
    w.cvs = par ? 'cvs-tab3-parallel' : 'cvs-tab3-series';
    if (step >= 3) w.see = [par ? 'deriv-parallel' : 'deriv-series'];   // 講推導的句子：推導文字要完整露出
  }
  else if (tab === 'tab4') { w.cvs = step >= 2 ? 'cvs-tab4-graph' : 'cvs-tab4-circuit'; if (step >= 2) w.see = ['cvs-tab4-graph']; }
  else if (tab === 'tab5' && sub === 'measure') { Object.assign(w, { sub: 'measure', solved: step === 2 || step === 4 }); w.cvs = 'cvs-tab5-measure'; }
  else if (tab === 'tab5' && sub === 'quiz') {
    if (step <= 5) { Object.assign(w, { sub: 'quiz', qidx: step - 1, answered: false, hint: false }); w.see = ['q-desc']; }
    else if (step <= 10) { Object.assign(w, { sub: 'quiz', qidx: step - 6, answered: true }); w.see = ['q-options', 'q-explain-block']; }
    else { Object.assign(w, { sub: 'quiz', qidx: step - 11, answered: false, hint: true }); w.see = ['q-desc', 'q-hint-block']; }
    // 載入題目時看電路圖＋題目＋選項；破題引導、揭曉時改看引導與解析（畫面放不下整張電路圖，電路圖只露出下緣，不檢查）
    w.cvs = step <= 5 ? 'cvs-t5-quiz' : null;
  }
  return w;
}
const fmt = s => s.tab + (s.sub ? '/' + s.sub : '') + '#' + (s.step || 1);

// ── 依序套用 cut / at，得到每句的期望狀態（acts 本課未使用，但仍支援）──
// 第 4 分頁掃描「從頭開始」的期望次數：切進第 4 分頁一次；at 是 tab4 第 3 步（句首）一次；acts 是 tab4 第 3 步（句中）各一次
const lines = [];
let cur = null, enter = 0;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; if (c.tab === 'tab4' && (!cur || cur.tab !== 'tab4')) enter++; cur = { tab: c.tab, sub: c.sub, step: 1 }; }
    continue;
  }
  const a = stage.at[it.id];
  let t4start = enter; enter = 0;
  if (a) { if (a.tab === 'tab4' && cur && cur.tab !== 'tab4') t4start++; else if (a.tab === 'tab4' && a.step === 3) t4start++; cur = { tab: a.tab, sub: a.sub, step: a.step || 1 }; }
  const seq = [cur];
  let t4mid = 0;
  for (const x of (stage.acts && stage.acts[it.id]) || []) { if (x[1] === 'tab4' && x[3] === 3) t4mid++; cur = { tab: x[1], sub: x[2], step: x[3] }; seq.push(cur); }
  lines.push({ id: it.id, file: it.file, speaker: it.speaker, text: it.text, seq, t4start, t4mid });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const q = s => document.querySelector(s);
      const g = f => { try { return f(); } catch (e) { return null; } };
      const tb = q('.tab-btn.active');
      const mat = ['ag', 'cu', 'fe'].find(m => { const b = document.getElementById('btn-mat-' + m); return b && b.classList.contains('active'); }) || null;
      const quizOn = g(() => document.getElementById('btn-t5-quiz').classList.contains('active'));
      return {
        t4n: window.__t4n || 0,
        hint: g(() => document.getElementById('q-hint-block').style.display === 'block'),
        tab: tb ? tb.dataset.tab : null,
        mat, area: g(() => +document.getElementById('t1-area').value), len: g(() => +document.getElementById('t1-length').value),
        temp: g(() => +document.getElementById('t1-temp').value),
        v: g(() => +document.getElementById('t2-v').value), r: g(() => +document.getElementById('t2-r').value),
        sub: quizOn ? 'quiz' : 'measure',
        solved: g(() => t5_solved), qidx: g(() => t5_quiz_idx), answered: g(() => t5_quiz_answered),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    // 畫布露出比例（扣掉底部字幕框）
    const SPECIAL = { 'deriv-series': 'cvs-tab3-series', 'deriv-parallel': 'cvs-tab3-parallel' };   // 串並聯推導文字＝畫布所在框的最後一塊
    window.__inView = id => { const c = SPECIAL[id] ? (document.getElementById(SPECIAL[id]) || {}).closest('.content-box').lastElementChild : document.getElementById(id);
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
          ['cvs-tab1', 'cvs-tab2', 'cvs-tab3-series', 'cvs-tab3-parallel', 'cvs-tab4-circuit', 'cvs-tab4-graph', 'cvs-tab5-measure', 'cvs-t5-quiz',
           'deriv-series', 'deriv-parallel', 'q-desc', 'q-options', 'q-hint-block', 'q-explain-block'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/electronics_4.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  // 數第 4 分頁的掃描被「從頭開始」幾次（頁面原本的 initTab4；switchTab 以全域名稱呼叫，所以包一層就數得到）
  await page.evaluate(() => { const o = window.initTab4; window.__t4n = 0; window.initTab4 = function () { window.__t4n++; return o.apply(this, arguments); }; });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '09': 1.0, '18': 2.0, '36': 1.0, '45': 1.2, '52': 1.2, '56': 1.2, '62': 1.0, '73': 1.2, '79': 1.2, '84': 1.2, '85': 1.2, '91': 1.2 };
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
      await page.screenshot({ path: path.join(SHOTDIR, 'shot_' + k + '.png') });
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
    // 第 4 分頁掃描：句首、句中「從頭開始」的次數
    const prevEnd = i > 0 && log[i - 1] && log[i - 1].end ? log[i - 1].end.t4n : 0;
    const gotStart = r.start.t4n - prevEnd, gotAll = r.end.t4n - prevEnd;
    if (gotStart !== e.t4start) probs.push(`掃描句首從頭 ${gotStart} 次≠${e.t4start}`);
    if (gotAll !== e.t4start + e.t4mid) probs.push(`掃描整句從頭 ${gotAll} 次≠${e.t4start + e.t4mid}`);
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 14), expect: e.seq.map(fmt).join(' → '), view: vis, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
