// optics_2 逐句模擬：假音訊（每句 1.5～3 秒真實時間），每句開始、句中、結束讀 OPT2.state() 與畫面，與 stage.json（cuts／at／acts）推算的期望比對。
// 同時檢查：不得出現 body.mode-teacher；每句結束時魔鏡畫布與數據列要完整在字幕框上方；有螢光筆（HL）的句子要真的畫出線。
// 用法：repo 根目錄開 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_optics_2.js
const { chromium } = require('playwright');
const fs = require('fs');
const REPO = (process.env.REPO || '/home/claude/physical-boys') + '/audio/optics_2/';
const manifest = JSON.parse(fs.readFileSync(REPO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(REPO + 'stage.json', 'utf8'));
const HLN = process.env.HLN ? JSON.parse(process.env.HLN) : null; // 有螢光筆的句號（沒給就從播放器自己偵測）

const HLOUT = new Set((process.env.HLOUT || '18,19,20').split(','));  // 螢光線的目標在說明框（離開畫布）的句號
const lines = []; let cur = null;
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
  lines.push({ id: it.id, file: it.file, text: it.text, seq });
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => { const s = OPT2.state(); return { mode: s.mode, p: s.params, teacher: document.body.classList.contains('mode-teacher') }; };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        this.duration = Math.min(3, Math.max(1.8, txt.length * 0.07));
        this.paused = false; this._t0 = performance.now();
        const rec = { src, start: window.__snap(), polls: [], hl: 0 };
        window.__log.push(rec); clearInterval(this._poll); if (window.__shot) setTimeout(() => window.__shot(rec.src), (this.duration - 0.25) * 1000);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s);
          const w = [...document.querySelectorAll('#vx-hl-layer .vx-hl')].map(e => e.getBoundingClientRect().width); if (w.length) rec.hl = Math.max(rec.hl, ...w); }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); rec.stats = [...document.querySelectorAll('#statsGrid .stat')].map(e => e.textContent.replace(/\s+/g, ' ').trim()); rec.pin = (document.querySelector('.vx-pin') || {}).textContent || '';
          const card = document.getElementById('visualSvg').parentElement.getBoundingClientRect(), st = document.getElementById('statsGrid').getBoundingClientRect();
          const bub = document.querySelector('.vx-panel'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
          const hw=[...document.querySelectorAll('#vx-hl-layer .vx-hl')].filter(e=>e.style.display!=='none').map(e=>e.getBoundingClientRect()); rec.hlView = hw.length ? hw.every(r=>r.top>=0&&r.bottom<=top) : null;
          rec.view = { cardTop: Math.round(card.top), cardBot: Math.round(card.bottom), statBot: Math.round(st.bottom), panelTop: Math.round(top) };
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  const SHOTS = process.env.SHOTS || '';
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.exposeFunction('__shot', async (src) => { const m = /(\d{3})_/.exec(src); if (m) await page.screenshot({ path: SHOTS + '/line_' + m[1] + '.jpg', type: 'jpeg', quality: 55 }); }); }
  await page.goto('http://127.0.0.1:8803/optics_2.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(600);
  const scenes = await page.evaluate(() => JSON.parse(JSON.stringify(OPT2.scenes)));
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const t0 = Date.now();
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束') || ((document.querySelector('.vx-txt') || {}).textContent || '').includes('按 ▶') && window.__log.length > 5 }));
    if (st.done || Date.now() - t0 > 560000) break;
    await page.waitForTimeout(250);
  }
  const log = await page.evaluate(() => window.__log), teacherSeen = await page.evaluate(() => window.__teacherSeen);
  await page.screenshot({ path: '/tmp/o2_sim_end.png' });
  await browser.close();

  const TAB = { playground: 'playground', reflection: 'plane_and_reflection', plane_mirror: 'plane_and_reflection', curved_mirror: 'curved_mirror', full_body: 'applications', three_mirrors: 'applications' };
  const want = s => scenes[s.sub].steps[s.step - 1].set;
  const probs = (w, s, sub) => { const o = []; if (!s) return ['no snapshot'];
    if (s.mode !== TAB[sub]) o.push('mode ' + s.mode + '≠' + TAB[sub]);
    const p = s.p[sub] || {}; for (const k of Object.keys(w)) { const ok = typeof w[k] === 'number' ? Math.abs(p[k] - w[k]) < 1.5 : p[k] === w[k]; if (!ok) o.push(`${k}=${p[k]}≠${w[k]}`); }
    if (sub === 'reflection' && s.p.plane_and_reflection.subMode !== 'reflection') o.push('subMode≠reflection');
    if (sub === 'plane_mirror' && s.p.plane_and_reflection.subMode !== 'plane_mirror') o.push('subMode≠plane_mirror');
    if (sub === 'full_body' && s.p.applications.subMode !== 'full_body') o.push('subMode≠full_body');
    if (sub === 'three_mirrors' && s.p.applications.subMode !== 'three_mirrors') o.push('subMode≠three_mirrors');
    return o; };
  let bad = 0, hlLines = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], pr = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) pr.push('file ' + r.src);
    const first = e.seq[0], last = e.seq[e.seq.length - 1];
    // 開始時：起點狀態可能還在平滑移動中，所以只檢查「場景對」，數值在句中／結束再檢查
    const sc = probs({}, r.start, first.sub); if (sc.length) pr.push('開始：' + sc.join(','));
    let k = 0; const W = e.seq.map(s => [want(s), s.sub]);
    for (const s of [r.start, ...r.polls, r.end]) { if (k < W.length && probs(W[k][0], s, W[k][1]).length === 0) k++; }
    if (k < W.length) pr.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + JSON.stringify(e.seq[k]));
    const ep = probs(W[W.length - 1][0], r.end, last.sub); if (ep.length) pr.push('結束：' + ep.join(','));
    if (r.end.teacher) pr.push('出現 mode-teacher');
    const v = r.view; const cardOk = v && v.cardTop >= -40 && v.cardBot <= v.panelTop - 4;
    if (r.hl > 0) { if (r.hlView === false) pr.push('螢光線不在字幕框上方的可視範圍'); if (!cardOk && !(r.hlView === true && HLOUT.has(e.id))) pr.push(`畫布不在字幕框上方 card ${v.cardTop}～${v.cardBot} panel ${v.panelTop}`); }
    else if (!cardOk) pr.push(`畫布不在字幕框上方 card ${v.cardTop}～${v.cardBot} panel ${v.panelTop}`);
    if (r.hl > 0 && v && v.statBot > v.panelTop && !HLOUT.has(e.id)) pr.push('數據列被字幕框擋住 statBot ' + v.statBot + ' panel ' + v.panelTop);
    if (r.hl > 0) hlLines.push(e.id + ':' + Math.round(r.hl));
    if (pr.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 14)} [${e.seq.map(s => s.sub + '#' + s.step).join('→')}] → ${pr.join('; ')}`); }
  }
  if (process.env.TABLE) fs.writeFileSync(process.env.TABLE, JSON.stringify(lines.map((e, i) => ({ line: i + 1, id: e.id, text: e.text, expect: e.seq.map(s => s.sub + '#' + s.step).join('→'), params: log[i] && log[i].end && log[i].end.p, stats: log[i] && log[i].stats, pin: log[i] && log[i].pin, hl: log[i] && Math.round(log[i].hl) })), null, 1));
  console.log('有螢光線的句號（最大寬度 px）：', hlLines.join(' '));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
