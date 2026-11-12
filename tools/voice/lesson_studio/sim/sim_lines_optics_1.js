// optics_1 逐句模擬：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（互動單元、各滑桿參數、孔洞數、題目公布），與 stage.json 推算的期望比對
//  ・全程不得出現 body.mode-teacher；每句結束時該畫面要在字幕框上方露出（開場框／畫布／解析／題目）
//  ・螢光筆：段數、是否畫出、是否在字幕框上方的可視範圍內；標記線唸完後會留一段時間，所以沒有新標記的句子要「沿用上一個還在同畫面的標記」
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_optics_1.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/optics_1/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/optics_1.json'), 'utf8'));
const HLN = {}; Object.keys(cfg.hl || {}).forEach(k => HLN[k] = cfg.hl[k].length);
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_o1_result.json');

// ── 期望狀態（與 optics_1_voice_v1.js 的 SCENES 對照）──
const SHP = [[14, 60], [2, 60], [14, 60], [30, 60], [14, 90], [14, 60]];
const PHP = [[0, '1'], [0, '1'], [0, '1'], [-50, '1'], [50, '1'], [0, '2'], [0, '3'], [0, 'large']];
const QZP = [-50, -50, -50, -50, -50, 0, -60, -60];
function want(tab, sub, step) {
  step = step || 1;
  const w = { tab };
  if (tab === 'shadow') { const s = SHP[step - 1]; w.light = s[0]; w.oh = s[1]; w.cvs = step === 1 ? 'hook' : (step === 6 ? 'explain' : 'card'); }
  else if (tab === 'pinhole') { const s = PHP[step - 1]; w.objX = -100; w.screenX = 100; w.holeX = s[0]; w.holes = s[1]; w.cvs = step === 1 ? 'hook' : (step === 3 ? 'explain' : 'card'); }
  else {
    w.qhole = QZP[step - 1]; w.q1 = step >= 3; w.q2 = step >= 7;
    w.cvs = step === 1 ? 'hook' : (step === 2 || step === 3 ? 'q0' : (step === 5 ? 'q1' : (step === 4 || step === 8 ? 'explain' : 'card')));
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
      const mb = document.querySelector('.mode-switch button.active');
      const O = window.__optics1;
      const rv = i => { const q = document.querySelectorAll('#mcq-optics1 .quiz-q')[i]; return !!(q && q.querySelector('.quiz-feedback.right, .quiz-options button.right')); };
      return {
        tab: mb ? mb.dataset.tab : null,
        light: g(() => O.params.shadow.lightSize), oh: g(() => O.params.shadow.objHeight),
        objX: g(() => O.params.pinhole.objX), screenX: g(() => O.params.pinhole.screenX), holeX: g(() => O.params.pinhole.holeX), holes: g(() => O.params.pinhole.holes),
        qhole: g(() => O.params.quiz.holeX), q1: rv(0), q2: rv(1),
        teacher: document.body.classList.contains('mode-teacher')
      };
    };
    const elOf = id => ({ hook: document.getElementById('hookBox'), card: document.querySelector('.visual-card'), explain: document.getElementById('explainBox'),
      q0: document.querySelectorAll('#mcq-optics1 .quiz-q')[0], q1: document.querySelectorAll('#mcq-optics1 .quiz-q')[1] })[id] || null;
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
          rec.hl = Array.from(document.querySelectorAll('.vx-hl')).map(e => { const r = e.getBoundingClientRect(); return { seg: e.dataset.seg, disp: e.style.display, w: r.width, h: r.height, top: r.top, bottom: r.bottom }; });
          rec.panelTop = (document.querySelector('.vx-bub') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
          rec.end = window.__snap(); rec.view = {};
          ['hook', 'card', 'explain', 'q0', 'q1'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/optics_1.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '07': 1.2, '12': 1.2, '19': 1.2, '26': 1.2, '27': 1.6, '33': 1.2, '38': 1.5, '40': 1.4, '41': 1.4, '45': 1.4, '49': 1.2, '66': 1.0, '70': 1.2, '73': 1.2, '74': 1.6, '75': 1.4, '77': 1.0, '79': 1.2, '83': 1.4, '84': 1.6, '85': 1.4 };
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

  const NOSTATE = ['cvs'];
  const match = (w, s) => !!s && Object.keys(w).filter(k => !NOSTATE.includes(k)).every(k => s[k] === w[k]);
  const diff = (w, s) => Object.keys(w).filter(k => !NOSTATE.includes(k) && (!s || s[k] !== w[k])).map(k => `${k}=${s ? JSON.stringify(s[k]) : '∅'}≠${JSON.stringify(w[k])}`);
  let bad = 0; const rows = [];
  let carry = 0, carryScene = null;   // 標記線唸完會留著：沒有新標記的句子，若畫面沒換，就應該還看得到上一句的標記
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
    if (last.cvs && !(vis >= 90)) probs.push(`畫面 ${last.cvs} 只露出 ${vis}%`);
    const fin = e.seq[e.seq.length - 1], sceneKey = fin.tab + '#' + fin.step, startKey = e.seq[0].tab + '#' + e.seq[0].step;
    let hn;
    if (HLN[e.id]) { hn = HLN[e.id]; carry = hn; carryScene = sceneKey; }
    else hn = (carry && carryScene === startKey && sceneKey === startKey) ? carry : 0;
    if (!HLN[e.id] && sceneKey !== carryScene) { carry = 0; carryScene = null; }
    { const m = {}; (r.hl || []).forEach(x => { const q = m[x.seg] || (m[x.seg] = { seg: x.seg, disp: 'none', w: 0, h: 0, top: 1e9, bottom: -1e9 }); if (x.disp === 'block') { q.disp = 'block'; q.w = Math.max(q.w, x.w); q.top = Math.min(q.top, x.top); q.bottom = Math.max(q.bottom, x.bottom); q.h += x.h; } }); r.hl = Object.keys(m).map(k => m[k]); }
    if ((r.hl || []).length !== hn) probs.push('螢光筆段數 ' + (r.hl || []).length + '≠' + hn);
    (r.hl || []).forEach((g, gi) => { if (g.disp !== 'block' || g.w < 10) probs.push('螢光筆第' + (gi + 1) + '段沒畫出 ' + g.disp + ' w=' + Math.round(g.w)); else if (g.top < 40 || g.bottom > r.panelTop + 2) probs.push('螢光筆第' + (gi + 1) + '段不在可視範圍 top=' + Math.round(g.top) + ' bottom=' + Math.round(g.bottom) + ' panelTop=' + Math.round(r.panelTop)); });
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 14), expect: e.seq.map(fmt).join(' → '), view: vis, hl: (r.hl || []).length, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
