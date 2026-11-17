// optics_4 逐句模擬：假音訊（真實時間流動，每句約 2～4 秒），每句開始、句中（每 40ms）、結束讀 OPT4.state() 與畫面，
// 和 stage.json（cuts／at／acts）推算的期望比對。同時檢查：
//  ・不得出現 body.mode-teacher
//  ・每句結束時，該場景的畫布與數據列要完整在字幕框上方
//  ・播放器 HL 表裡有螢光筆的句子，要真的畫出線（寬度大於零），而且整段在字幕框上方的可視範圍內
// 用法：repo 根目錄開 python3 -m http.server 8803，再
//   NODE_PATH=$(npm root -g) SHOTS=/tmp/o4shots node tools/voice/lesson_studio/sim/sim_lines_optics_4.js
const { chromium } = require('playwright');
const fs = require('fs');
const ROOT = process.env.REPO || '/home/claude/physical-boys';
const manifest = JSON.parse(fs.readFileSync(ROOT + '/audio/optics_4/manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(ROOT + '/audio/optics_4/stage.json', 'utf8'));
const playerSrc = fs.readFileSync(ROOT + '/optics_4_voice_v1.js', 'utf8');
const HLN = new Set([...playerSrc.matchAll(/^\s{4}(\d+): \[\{ a:/gm)].map(m => m[1]));
const durations = fs.existsSync('/tmp/t4/durations.json') ? JSON.parse(fs.readFileSync('/tmp/t4/durations.json', 'utf8')) : {};
const SCALE = +(process.env.SCALE || 0.5);

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
  await page.addInitScript(([dur, scale]) => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => { const s = OPT4.state(); return { mode: s.mode, p: s.params, lab: s.lab, teacher: document.body.classList.contains('mode-teacher') }; };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src; const m = /(\d{3})_/.exec(src); const id = m ? String(+m[1]).padStart(2, '0') : '';
        this.duration = Math.min(5, Math.max(2.2, (dur[id] || 3) * scale));
        this.paused = false; this._t0 = performance.now();
        const rec = { src, start: window.__snap(), polls: [], hl: 0, hlView: true };
        window.__log.push(rec); clearInterval(this._poll);
        if (window.__shot) setTimeout(() => window.__shot(rec.src), (this.duration - 0.3) * 1000);
        this._poll = setInterval(() => {
          const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s);
          const top = (document.querySelector('.vx-panel') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
          [...document.querySelectorAll('#vx-hl-layer .vx-hl')].filter(e => e.style.display !== 'none').forEach(e => {
            const r = e.getBoundingClientRect(); rec.hl = Math.max(rec.hl, r.width);
          });
        }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(self._poll);
          rec.end = window.__snap();
          { const tp = (document.querySelector('.vx-panel') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
            [...document.querySelectorAll('#vx-hl-layer .vx-hl')].filter(e => e.style.display !== 'none').forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 20 && (r.top < 0 || r.bottom > tp)) rec.hlView = false; }); }
          const bub = document.querySelector('.vx-panel'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
          const R = e => { if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
          const lab = !document.getElementById('lab3dStage').hidden;
          rec.view = { panelTop: Math.round(top), lab, pre: lab ? null : R(document.getElementById('presetsBox')),
            card: lab ? R(document.querySelector('.lab-canvas-wrap')) : R(document.getElementById('visualSvg').parentElement),
            stats: lab ? R(document.querySelector('.lab-stats')) : R(document.getElementById('statsGrid')) };
          rec.stat = lab ? [...document.querySelectorAll('.lab-stat .v')].map(e => e.textContent.trim()) : [...document.querySelectorAll('#statsGrid .stat .v')].map(e => e.textContent.replace(/\s+/g, ' ').trim());
          rec.pin = (document.querySelector('.vx-pin') || {}).textContent || '';
          self.paused = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  }, [durations, SCALE]);
  const SHOTS = process.env.SHOTS || '';
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.exposeFunction('__shot', async (src) => { const m = /(\d{3})_/.exec(src); if (m) await page.screenshot({ path: SHOTS + '/line_' + m[1] + '.jpg', type: 'jpeg', quality: 60 }); }); }
  await page.goto('http://127.0.0.1:8803/optics_4.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(800);
  const scenes = await page.evaluate(() => JSON.parse(JSON.stringify(OPT4.scenes)));
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const t0 = Date.now();
  while (true) {
    const done = await page.evaluate(() => ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'));
    if (done || Date.now() - t0 > 590000) break;
    await page.waitForTimeout(250);
  }
  const log = await page.evaluate(() => window.__log), teacherSeen = await page.evaluate(() => window.__teacherSeen);
  await browser.close();

  const want = s => scenes[s.sub].steps[s.step - 1].set;
  function probs(w, s, sub) {
    if (!s) return ['no snapshot'];
    const o = [];
    if (s.mode !== sub) o.push('mode ' + s.mode + '≠' + sub);
    const p = s.p[sub] || {};
    for (const k of Object.keys(w)) {
      if (sub === 'lab3d') {
        const v = s.lab[k]; const tol = k === 'u' ? 3 : (k === 'tool' || k === 'text') ? 0 : 0.05;
        if (k === 'text') continue;
        const ok = typeof w[k] === 'number' ? Math.abs(v - w[k]) <= tol : v === w[k];
        if (!ok) o.push(`${k}=${v}≠${w[k]}`);
      } else {
        const ok = Math.abs(p[k] - w[k]) <= (k === 'power' ? 1 : 0.03);
        if (!ok) o.push(`${k}=${p[k]}≠${w[k]}`);
      }
    }
    return o;
  }
  let bad = 0; const hlLines = [], rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], pr = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) pr.push('file ' + r.src);
    const W = e.seq.map(s => [want(s), s.sub]);
    let k = 0;
    for (const s of [r.start, ...r.polls, r.end]) { if (k < W.length && probs(W[k][0], s, W[k][1]).length === 0) k++; }
    if (k < W.length) pr.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + JSON.stringify(e.seq[k]));
    const ep = probs(W[W.length - 1][0], r.end, e.seq[e.seq.length - 1].sub); if (ep.length) pr.push('結束：' + ep.join(','));
    if (r.end.teacher) pr.push('出現 mode-teacher');
    const v = r.view, bottom = Math.max(v.card ? v.card.b : 0, v.stats ? v.stats.b : 0);
    const sub = e.seq[e.seq.length - 1].sub;
    const needStats = sub !== 'intro';
    const bot = needStats ? Math.max(v.card.b, v.stats.b) : v.card.b;
    const HLOUT = new Set((process.env.HLOUT || '18,43').split(','));   // 螢光線目標在說明框（離開畫布）的句號
    if (!HLOUT.has(String(+e.id)) && v.pre && v.pre.t < 0) pr.push(`快速跳轉列被切到上方 ${v.pre.t}`);
    if (!HLOUT.has(String(+e.id)) && (!v.card || v.card.t < -40 || bot > v.panelTop - 4)) pr.push(`畫面不在字幕框上方 card ${v.card && v.card.t}～${bot} panel ${v.panelTop}`);
    if (HLN.has(String(+e.id))) {
      if (!(r.hl > 20)) pr.push('應有螢光線但沒畫出（最大寬度 ' + Math.round(r.hl) + '）');
      else hlLines.push(e.id + ':' + Math.round(r.hl));
      if (r.hl > 20 && !r.hlView) pr.push('螢光線超出字幕框上方的可視範圍');
    }
    rows.push({ id: e.id, text: e.text.slice(0, 18), expect: e.seq.map(s => s.sub + '#' + s.step).join('→'), stat: r.stat, pin: r.pin, view: v, hl: Math.round(r.hl), ok: !pr.length, pr });
    if (pr.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 14)} [${e.seq.map(s => s.sub + '#' + s.step).join('→')}] → ${pr.join('; ')}`); }
  }
  fs.writeFileSync('/tmp/t4/sim_table.json', JSON.stringify(rows, null, 1));
  console.log('有螢光線的句號（最大寬度 px）：', hlLines.join(' '));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
