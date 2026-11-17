// optics_5 逐句模擬：假音訊（真實時間流動，每句約 2～4 秒），每句開始、句中（每 40ms）、結束讀 OPT5.state() 與畫面，
// 和 stage.json（cuts／at／acts）推算的期望比對。同時檢查：
//  ・不得出現 body.mode-teacher
//  ・每句結束時，該場景的畫布與數據列要完整在字幕框上方
//  ・播放器 HL 表裡有螢光筆的句子，要真的畫出線（寬度大於零），而且整段在字幕框上方的可視範圍內
// 用法：repo 根目錄開 python3 -m http.server 8803，再
//   NODE_PATH=$(npm root -g) SHOTS=/tmp/o5shots node tools/voice/lesson_studio/sim/sim_lines_optics_5.js
const { chromium } = require('playwright');
const fs = require('fs');
const ROOT = process.env.REPO || '/home/claude/physical-boys';
const manifest = JSON.parse(fs.readFileSync(ROOT + '/audio/optics_5/manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(ROOT + '/audio/optics_5/stage.json', 'utf8'));
const playerSrc = fs.readFileSync(ROOT + '/optics_5_voice_v1.js', 'utf8');
const HLN = new Set([...playerSrc.matchAll(/^\s{4}(\d+): \[\{ a:/gm)].map(m => m[1]));
// 每句螢光筆的段數（每一段的目標都要在該句畫面解得出矩形，才算畫出）
const HLSEG = Object.fromEntries([...playerSrc.matchAll(/^\s{4}(\d+): (\[\{ a:.*)$/gm)].map(m => [m[1], (m[2].match(/\{ a:/g) || []).length]));
const durations = fs.existsSync('/tmp/t5/durations.json') ? JSON.parse(fs.readFileSync('/tmp/t5/durations.json', 'utf8')) : {};
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
  const ORDER = lines.map(l => l.id);
  await page.addInitScript(([dur, scale, order]) => {
    window.__log = []; window.__teacherSeen = 0;
    // 模擬把每句音檔縮短（fake＝真實長度×SCALE，夾在 2.2～5 秒），畫面平滑毫秒也要依同一比例縮短，才和真實播放的相對時間一致
    const fakeDur = id => Math.min(5, Math.max(2.2, (dur[id] || 3) * scale));
    const ratio = id => fakeDur(id) / (dur[id] || fakeDur(id) / scale);
    window.__ratio = ratio(order[0]);
    const wrapGo = () => { if (!window.OPT5 || window.OPT5.__wrapped) return; const og = window.OPT5.go; window.OPT5.go = (s, st, ms) => og(s, st, ms ? ms * window.__ratio : ms); window.OPT5.__wrapped = 1; };
    document.addEventListener('DOMContentLoaded', () => setTimeout(wrapGo, 0)); window.addEventListener('load', wrapGo);
    window.__snap = () => { const s = OPT5.state(); return { mode: s.mode, p: s.params, teacher: document.body.classList.contains('mode-teacher') }; };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src; const m = /(\d{3})_/.exec(src); const id = m ? String(+m[1]).padStart(2, '0') : '';
        this.duration = fakeDur(id); window.__ratio = ratio(id); const nextId = order[order.indexOf(id) + 1];
        this.paused = false; this._t0 = performance.now();
        const rec = { src, id, start: window.__snap(), polls: [], hl: 0, hlView: true, hlSeg: 0 };
        window.__log.push(rec); clearInterval(this._poll);
        if (window.__shot) setTimeout(() => window.__shot(rec.src), (this.duration - 0.3) * 1000);
        this._poll = setInterval(() => {
          const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s);
          const top = (document.querySelector('.vx-panel') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
          const mine = [...document.querySelectorAll('#vx-hl-layer .vx-hl')].filter(e => e.style.display !== 'none' && e.getAttribute('data-line') === id);
          mine.forEach(e => { const r = e.getBoundingClientRect(); rec.hl = Math.max(rec.hl, r.width); });
          rec.hlSeg = Math.max(rec.hlSeg, mine.filter(e => e.getBoundingClientRect().width > 4).length);
        }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(self._poll);
          rec.end = window.__snap();
          { const tp = (document.querySelector('.vx-panel') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
            // 只看這一句自己的螢光線（上一句留著淡出的線若已捲出畫面，學生看不到，不算超出）
            [...document.querySelectorAll('#vx-hl-layer .vx-hl')].filter(e => e.style.display !== 'none' && e.getAttribute('data-line') === id).forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 20 && (r.top < 0 || r.bottom > tp)) rec.hlView = false; }); }
          const bub = document.querySelector('.vx-panel'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
          const R = e => { if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
          const RBP = { rainbow_trace: 0, rainbow_radar: 1, rainbow_identity: 2, rainbow_circle: 3 };
          const panels = [...document.querySelectorAll('#visualContainer .rainbow-panel')].map(e => R(e));
          rec.view = { panelTop: Math.round(top), card: R(document.getElementById('visualContainer')), stats: R(document.getElementById('statsGrid')), panels };
          rec.stat = [...document.querySelectorAll('#statsGrid .stat .v')].map(e => e.textContent.replace(/\s+/g, ' ').trim());
          rec.pin = (document.querySelector('.vx-pin') || {}).textContent || '';
          self.paused = true; if (nextId) window.__ratio = ratio(nextId); if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  }, [durations, SCALE, ORDER]);
  const SHOTS = process.env.SHOTS || '';
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.exposeFunction('__shot', async (src) => { const m = /(\d{3})_/.exec(src); if (m) await page.screenshot({ path: SHOTS + '/line_' + m[1] + '.jpg', type: 'jpeg', quality: 60 }); }); }
  await page.goto((process.env.BASE || 'http://127.0.0.1:8803') + '/optics_5.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(800);
  const scenes = await page.evaluate(() => JSON.parse(JSON.stringify(OPT5.scenes)));
  const await0 = await page.evaluate(() => JSON.parse(JSON.stringify(OPT5.tab)));
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

  const TABOF = JSON.parse(JSON.stringify(await0));
  const want = s => scenes[s.sub].steps[s.step - 1].set;
  function probs(w, s, sub) {
    if (!s) return ['no snapshot'];
    const o = [];
    const tab = TABOF[sub];
    if (s.mode !== tab) o.push('mode ' + s.mode + '≠' + tab);
    const p = (s.p || {})[tab] || {};
    for (const k of Object.keys(w)) {
      const ok = typeof w[k] === 'number' ? Math.abs(p[k] - w[k]) <= 0.51 : p[k] === w[k];
      if (!ok) o.push(`${k}=${p[k]}≠${w[k]}`);
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
    const v = r.view;
    const sub = e.seq[e.seq.length - 1].sub;
    const RBP = { rainbow_trace: 0, rainbow_radar: 1, rainbow_identity: 2, rainbow_circle: 3 };
    const HLOUT = new Set((process.env.HLOUT || '12,16,21,27,29,31,35,41,60,93').split(','));   // 螢光線目標離開畫布（原理框、說明框）的句號
    if (!HLOUT.has(String(+e.id))) {
      if (RBP.hasOwnProperty(sub)) {
        const pn = v.panels[RBP[sub]];
        if (!pn || pn.t < -40 || pn.b > v.panelTop - 4) pr.push(`面板不在字幕框上方 ${pn && pn.t}～${pn && pn.b} panel ${v.panelTop}`);
      } else {
        const bot = Math.max(v.card ? v.card.b : 0, v.stats ? v.stats.b : 0);
        if (!v.card || v.card.t < -40 || bot > v.panelTop - 4) pr.push(`畫面不在字幕框上方 card ${v.card && v.card.t}～${bot} panel ${v.panelTop}`);
      }
    }
    if (HLN.has(String(+e.id))) {
      if (!(r.hl > 20)) pr.push('應有螢光線但沒畫出（最大寬度 ' + Math.round(r.hl) + '）');
      else hlLines.push(e.id + ':' + Math.round(r.hl));
      if (r.hl > 20 && !r.hlView) pr.push('螢光線超出字幕框上方的可視範圍');
      if (r.hlSeg < (HLSEG[String(+e.id)] || 0)) pr.push('螢光筆只畫出 ' + r.hlSeg + '／' + HLSEG[String(+e.id)] + ' 段（有目標解不出矩形）');
    }
    rows.push({ id: e.id, text: e.text.slice(0, 18), expect: e.seq.map(s => s.sub + '#' + s.step).join('→'), stat: r.stat, pin: r.pin, view: v, hl: Math.round(r.hl), ok: !pr.length, pr });
    if (pr.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 14)} [${e.seq.map(s => s.sub + '#' + s.step).join('→')}] → ${pr.join('; ')}`); }
  }
  fs.writeFileSync('/tmp/t5/sim_table.json', JSON.stringify(rows, null, 1));
  console.log('有螢光線的句號（最大寬度 px）：', hlLines.join(' '));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
