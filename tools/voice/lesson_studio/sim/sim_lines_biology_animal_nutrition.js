// biology_animal_nutrition 逐句模擬（由 sim_lines_biology_animal_nutrition.js 改寫）：以假音訊（真實時間流動，每句 1.5～3 秒）逐句播放整課，
//  ・每句開始、句中（每 40ms 輪詢）、結束時讀頁面狀態（互動單元、各滑桿參數、孔洞數、題目公布），與 stage.json 推算的期望比對
//  ・全程不得出現 body.mode-teacher；每句結束時該畫面要在字幕框上方露出（開場框／畫布／解析／題目）
//  ・螢光筆：段數、是否畫出、是否在字幕框上方的可視範圍內；標記線唸完後會留一段時間，所以沒有新標記的句子要「沿用上一個還在同畫面的標記」
// 用法：先在 repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_biology_animal_nutrition.js [輸出 json 路徑]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/biology_animal_nutrition/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/biology_animal_nutrition.json'), 'utf8'));
const HLN = {};
{ // 螢光筆表在播放器裡（HLSPEC）：直接從 js 取出物件字面值
  const src = fs.readFileSync(path.join(REPO, 'biology_animal_nutrition_voice_v1.js'), 'utf8');
  const m = /var HLSPEC = (\{[\s\S]*?\n  \});/.exec(src);
  const spec = eval('(' + m[1] + ')'); Object.keys(spec).forEach(k => HLN[k] = spec[k].length);
}
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_o1_result.json');

// ── 期望狀態（與 biology_animal_nutrition_voice_v1.js 的 SCENES 對照）──
const USE_K = 25;
function want(tab, sub, step) {
  step = step || 1;
  const page = tab === 'page-1' ? 1 : 0, k = Math.floor(step + 1e-6) - 1, frac = Math.round((step - Math.floor(step + 1e-6)) * 100) / 100;
  const w = { page, k, cvs: 'stage' };
  w.phase = (page === 1 && k === USE_K) ? Math.min(2, Math.floor(frac * 3 + 1e-6)) + 1 : 0;
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
      const A = window.AnimalStory, M = window.AnimalModes; if (!A || !M) return { teacher: false };
      const S = A.state, it = A.SEQ[S.page][S.k], hs = M.C.holdSec;
      return { page: S.page, k: S.k, phase: (S.page === 1 && S.k === 25 && hs != null && it) ? Math.round((hs + 0.04) / it.sec * 3) : 0,
        teacher: document.body.classList.contains('mode-teacher') };
    };
    const elOf = id => ({ stage: null })[id];
    window.__inView = id => { const c = document.querySelector('#story-lab .an-controls') || document.getElementById('storyScene'), d = document.getElementById('storyCaption') || c;
      if (!c) return null; const r1 = c.getBoundingClientRect(), r2 = d.getBoundingClientRect();
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      const t0 = r1.top, b0 = r2.bottom; return Math.round(Math.max(0, Math.min(b0, top) - Math.max(t0, 0)) / Math.max(1, Math.min(b0 - t0, top - Math.max(0, 40))) * 100); };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; this.ended = false; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        this.duration = Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this.ended = false; this._t0 = performance.now();
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
          ['stage'].forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; self.ended = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
    // 螢光筆時間軸：每 40 ms 記下每一條線的寬度與當下是第幾句（抓「下一句時舊線重畫」這種錯）
    window.__hl = {}; let hlN = 0;
    setInterval(() => {
      const line = window.__log.length, src = (window.__log[line - 1] || {}).src || '';
      document.querySelectorAll('.vx-hl').forEach(e => {
        if (!e.dataset.hid) e.dataset.hid = String(++hlN);
        const w = e.style.display === 'none' ? 0 : Math.round(parseFloat(e.style.width) || 0);
        const rec = window.__hl[e.dataset.hid] || (window.__hl[e.dataset.hid] = { src, ws: [] });
        const last = rec.ws[rec.ws.length - 1];
        if (!last || last[1] !== w) rec.ws.push([line, w, (window.__log[line - 1] || {}).src || '']);
      });
    }, 40);
  });
  await page.goto('http://127.0.0.1:8803/biology_animal_nutrition.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '01': 1.0, '21': 1.6, '24': 1.6, '71': 1.8, '78': 1.8, '93': 1.8, '102': 1.8 };
  if (process.env.SHOTS) { Object.keys(shots).forEach(k => delete shots[k]); process.env.SHOTS.split(',').forEach(k => shots[k] = 2.6); }
  if (process.env.SHOTS_ALL) { // 每一句都拍（給逐句審稿用）；有句中換畫面的句子多拍一張
    for (let i = 1; i <= 105; i++) shots[String(i).padStart(2, '0')] = 1.6;
    [].forEach(k => shots[k] = [1.0, 3.4]);
    Object.keys(HLN).forEach(k => shots[String(+k).padStart(2, '0')] = [1.0, 2.6]);   // 螢光筆句：開頭一張、畫完一張
  }
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
      const ts = [].concat(shots[k]); let prevT = 0;
      for (let n = 0; n < ts.length; n++) {
        await page.waitForTimeout(Math.round((ts[n] - prevT) * 1000)); prevT = ts[n];
        await page.screenshot({ path: path.join(path.dirname(OUT), 'shot_' + k + (ts.length > 1 ? String.fromCharCode(97 + n) : '') + '.png') });
      }
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const hlTrack = await page.evaluate(() => window.__hl);
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
    // 有螢光筆的句子：畫面會捲到被標記的文字（另由螢光筆可視範圍檢查）；上一句的螢光筆還留著時同理
    const hlLine = HLN[e.id] || ((r.hl || []).some(x => x.disp === 'block'));
    const need = 90;
    if (last.cvs && !hlLine && !(vis >= need)) probs.push(`畫面 ${last.cvs} 只露出 ${vis}%`);
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
  // 螢光筆時間軸檢查：每條線只能在「自己那一句」裡從 0 畫到滿；之後寬度不可以再縮小又變大（＝被下一句重畫）
  let hlBad = 0;
  const idOf = src => { const m = (src || '').match(/(\d{3})_/); return m ? String(+m[1]).padStart(2, '0') : '?'; };
  Object.keys(hlTrack).forEach(k => {
    const ws = hlTrack[k].ws.filter(x => x[1] > 0);
    if (!ws.length) return;
    const own = ws[0][2], max = Math.max(...ws.map(x => x[1]));
    const fullAt = ws.find(x => x[1] >= max - 1);
    let regrow = false, prev = 0, peaked = false;
    hlTrack[k].ws.forEach(x => { if (peaked && x[1] > prev + 1 && prev < max - 1) regrow = true; if (x[1] >= max - 1) peaked = true; prev = x[1]; });
    // 畫到句尾的線，最後一格可能剛好落在下一句開頭（句子一結束就補滿）：只有下一句還在「慢慢畫」才算太晚
    const after = ws.filter(x => x[2] !== own);
    const late = after.length > 1;
    if (regrow || late) { hlBad++; console.log(`✗ 螢光筆 #${k}（第 ${idOf(own)} 句開始畫）` + (late ? ` 到第 ${idOf(fullAt[2])} 句才畫滿` : '') + (regrow ? ' 畫滿後又被重畫' : '')); }
  });
  if (process.env.HLDUMP) console.log(JSON.stringify(Object.values(hlTrack).slice(0, 4).map(r => r.ws.map(x => [x[0], x[1], (x[2].match(/(\d{3})_/) || [])[1]]))));
  console.log('螢光筆條數：', Object.keys(hlTrack).length, '有問題：', hlBad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
