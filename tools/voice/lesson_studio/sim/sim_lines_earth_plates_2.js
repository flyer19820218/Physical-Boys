// earth_plates_2 逐句模擬：假音訊（真實時間，每句 1.5～3 秒）逐句播放整課，
//  ・每句結束時讀頁面狀態（分頁、GLS／DVS／SBS／CLS／EVS），與 stage.json 推算的期望逐句比對
//  ・隱沒帶不得自己換步驟（SBS.step 必須停在該句的步驟）；分離／擠壓程度在每一站最後一句結束時要到目標
//  ・全程不得出現 body.mode-teacher；每句結束時該站的畫布要在字幕框上方露出至少 50%
//  ・整課播完後各動畫還原成剛進頁面的樣子；另測「跳句 → 暫停凍住 → 繼續 → 停止還原」
// 用法：repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_plates_2.js [輸出資料夾]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/earth_plates_2/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUTDIR = process.argv[2] || '/tmp';
const CVS = { tab1: 'glCanvas', tab2: 'dvCanvas', tab3: 'sbCanvas', tab4: 'clCanvas', tab5: 'evCanvas' };
function want(tab, step) {
  const w = { tab };
  if (tab === 'tab1') { w.glMode = ['coast', 'plates', 'act', 'act'][step - 1]; w.glTw = step === 4; }
  if (tab === 'tab2') { w.dvMode = step === 4 ? 'ice' : 'ocean'; if (step < 4) w.amtTo = [0, 50, 100][step - 1]; }
  if (tab === 'tab3') w.sbStep = step - 1;
  if (tab === 'tab4') { w.clGhost = step === 4; w.sTo = [0, 35, 100, 100][step - 1]; }
  if (tab === 'tab5') w.evMode = ['all', 'quake', 'volc', 'bound'][step - 1];
  return w;
}
const lines = []; let cur = null;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, step: 1 }; }
    continue;
  }
  const a = stage.at[it.id]; if (a) cur = { tab: a.tab, step: a.step || 1 };
  lines.push({ id: it.id, file: it.file, text: it.text, w: want(cur.tab, cur.step), tab: cur.tab, step: cur.step });
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
      const g = f => { try { return f(); } catch (e) { return null; } };
      const r1 = x => Math.round(x * 10) / 10;
      const tb = document.querySelector('.tab-btn.active');
      return { tab: tb ? tb.dataset.tab : null, glMode: g(() => GLS.mode), glTw: g(() => !!GLS.tw), dvMode: g(() => DVS.mode), amt: g(() => r1(DVS.amt)),
        sbStep: g(() => SBS.step), sbAge: g(() => r1(SBS.age)), clGhost: g(() => !!CLS.ghost), s: g(() => r1(CLS.s)), evMode: g(() => EVS.mode), teacher: document.body.classList.contains('mode-teacher') };
    };
    window.__inView = id => { const c = document.getElementById(id); if (!c) return null; const r = c.getBoundingClientRect(); if (!r.height) return 0;
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top)) * 100); };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._acc = 0; this._end = 0; }
      set src(v) { this._src = v; this._acc = 0; } get src() { return this._src; }
      get currentTime() { return this._acc + (this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000); }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        if (!this._acc) this.duration = Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this._t0 = performance.now();
        const last = window.__log[window.__log.length - 1];
        if (!(last && last.src === src && !last.end)) window.__log.push({ src, start: window.__snap() });
        const rec = window.__log[window.__log.length - 1];
        clearTimeout(this._end);
        this._end = setTimeout(() => {
          if (self._src !== src || self.paused) return;
          const s = window.__snap(); if (s.teacher) window.__teacherSeen++;
          rec.end = s; rec.view = {}; Object.values({ a: 'glCanvas', b: 'dvCanvas', c: 'sbCanvas', d: 'clCanvas', e: 'evCanvas' }).forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) this._acc += (performance.now() - this._t0) / 1000; this.paused = true; clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/earth_plates_2.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const t0 = Date.now(); const shots = { '08': 1, '20': 1, '33': 2, '52': 2, '62': 2, '68': 2, '74': 2, '80': 2, '95': 2, '103': 2, '112': 2, '120': 2 }; const shotDone = {};
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'), src: (window.__log[window.__log.length - 1] || {}).src }));
    if (st.done) break;
    if (Date.now() - t0 > 900000) { console.log('TIMEOUT'); break; }
    const m = st.src && st.src.match(/(\d{3})_/); const k = m ? String(+m[1]) : null;
    const kk = k && (k.length < 2 ? '0' + k : k);
    if (kk && shots[kk] !== undefined && !shotDone[kk]) { shotDone[kk] = 1; await page.waitForTimeout(shots[kk] * 1000 * 0.9); await page.screenshot({ path: path.join(OUTDIR, 'ep2_shot_' + kk + '.png') }); }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const end1 = await page.evaluate(() => window.__snap());
  const extra = [];
  // 跳句：第 44 句（隱沒帶 步驟 2 附近）→ 暫停凍住 → 繼續
  const nSb = lines.findIndex(l => l.tab === 'tab3' && l.step === 2) + 1;
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(400);
  async function jump(n) { const bb = await (await page.$('.vx-line')).boundingBox(); await page.mouse.click(bb.x + bb.width * ((n - 0.5) / lines.length), bb.y + bb.height / 2); await page.waitForTimeout(700); }
  await jump(nSb + 1);
  const j1 = await page.evaluate(() => window.__snap());
  if (!(j1.tab === 'tab3' && j1.sbStep === 1)) extra.push('跳到隱沒帶步驟 2 後畫面不對：' + JSON.stringify(j1));
  await page.click('button[aria-label="暫停"]');
  const p1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(800); const p2 = await page.evaluate(() => window.__snap());
  if (p1.sbAge !== p2.sbAge || p1.sbStep !== p2.sbStep) extra.push(`暫停時隱沒帶仍在走 ${p1.sbAge}→${p2.sbAge}`);
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(500);
  const nCl = lines.findIndex(l => l.tab === 'tab4' && l.step === 3) + 1;
  await jump(nCl);
  await page.waitForTimeout(1500);
  const c1 = await page.evaluate(() => window.__snap()); await page.click('button[aria-label="暫停"]'); const c2 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(800); const c3 = await page.evaluate(() => window.__snap());
  if (c2.s !== c3.s) extra.push(`暫停時擠壓程度仍在變 ${c2.s}→${c3.s}`);
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(600);
  const after = await page.evaluate(() => window.__snap());
  await browser.close();

  let bad = 0; const cvsOf = t => CVS[t];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  const segLast = {};   // 每一站（分頁#步驟）最後一句
  lines.forEach((l, i) => { segLast[l.tab + '#' + l.step] = i; });
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r || !r.end) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const w = e.w, s = r.end;
    for (const k of Object.keys(w)) { if (k === 'amtTo' || k === 'sTo') continue; if (s[k] !== w[k]) probs.push(`${k}=${JSON.stringify(s[k])}≠${JSON.stringify(w[k])}`); }
    if (segLast[e.tab + '#' + e.step] === i) {
      if (w.amtTo !== undefined && Math.abs(s.amt - w.amtTo) > 3) probs.push(`分離程度 ${s.amt}≠${w.amtTo}`);
      if (w.sTo !== undefined && Math.abs(s.s - w.sTo) > 3) probs.push(`擠壓程度 ${s.s}≠${w.sTo}`);
    }
    const v = r.view && r.view[cvsOf(e.tab)]; if (v !== null && v < 50) probs.push('畫布露出 ' + v + '%');
    if (probs.length) { bad++; console.log('第', e.id, '句', e.tab + '#' + e.step, probs.join(' | '), '「' + e.text.slice(0, 18) + '」'); }
  }
  const resetOK = after.glMode === 'coast' && after.dvMode === 'ocean' && after.amt === 45 && after.sbStep === 0 && after.clGhost === false && after.evMode === 'all';
  console.log('mismatches', bad, '| js errors', errors.length ? errors.join(' ; ') : 'none', '| mode-teacher', teacherSeen, '| extra', extra.length ? extra.join(' ; ') : 'ok', '| 停止後還原', resetOK ? 'ok' : JSON.stringify(after));
})();
