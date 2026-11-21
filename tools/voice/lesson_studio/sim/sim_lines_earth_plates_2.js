// earth_plates_2 逐句模擬：假音訊（長度＝audio/earth_plates_2/mp3 的真實長度，用 ffprobe 讀）逐句播放整課，
//  ・分頁一（地球儀）：每句記錄 GLS.lon／lat，句末要在鏡頭腳本目標 ±6 度內；記錄飛行開始／到位時間，與地名唸到的時間比對
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
const { execFileSync } = require('child_process');
const DUR = {};   // 真實音檔長度（秒）
for (const it of manifest.items) if (it.kind === 'line') DUR[it.file] = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', AUDIO + 'mp3/' + it.file]).toString());
// 分頁一的鏡頭腳本（與播放器 GL1 表相同）：步驟 → 圖層、是否找臺灣、畫面中央經緯度
const GL1 = [['coast', 0, [60, 12]], ['coast', 0, [-157, 18]], ['coast', 0, [-28, 10]], ['plates', 0, [-28, 10]], ['plates', 0, [82, 28]], ['act', 0, [82, 28]], ['act', 0, [-160, 10]], ['act', 1, [121, 23.7]]];
const NAME = { '04': '夏威夷', '07': '夏威夷', '08': '夏威夷', '14': '大西洋', '16': '喜馬拉雅', '20': '太平洋', '21': '夏威夷', '22': '夏威夷', '26': '臺灣' };
const CVS = { tab1: 'glCanvas', tab2: 'dvCanvas', tab3: 'sbCanvas', tab4: 'clCanvas', tab5: 'evCanvas' };
function want(tab, step) {
  const w = { tab };
  if (tab === 'tab1') { const g = GL1[step - 1]; w.glMode = g[0]; w.glTw = !!g[1]; w.glTo = g[2]; }
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
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; if (!cur || cur.tab !== c.tab) cur = { tab: c.tab, step: 1 }; }   // 同分頁的切頁不動畫面（同播放器）
    continue;
  }
  const a = stage.at[it.id]; if (a) cur = { tab: a.tab, step: a.step || 1 };
  const startStep = cur.step;
  const ac = stage.acts && stage.acts[it.id]; if (ac && ac.length) { const z = ac[ac.length - 1]; cur = { tab: z[1], step: z[3] }; }
  lines.push({ id: it.id, file: it.file, text: it.text, w: want(cur.tab, cur.step), tab: cur.tab, step: cur.step, startStep, acts: ac || null, dur: DUR[it.file] });
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'warning' && /有聲講解/.test(m.text())) errors.push('warn: ' + m.text()); });
  await page.addInitScript(D => {
    window.__DUR = D;
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const g = f => { try { return f(); } catch (e) { return null; } };
      const r1 = x => Math.round(x * 10) / 10;
      const tb = document.querySelector('.tab-btn.active');
      return { tab: tb ? tb.dataset.tab : null, glMode: g(() => GLS.mode), glTw: g(() => !!GLS.tw), dvMode: g(() => DVS.mode), amt: g(() => r1(DVS.amt)),
        sbStep: g(() => SBS.step), sbAge: g(() => r1(SBS.age)), clGhost: g(() => !!CLS.ghost), s: g(() => r1(CLS.s)), evMode: g(() => EVS.mode), teacher: document.body.classList.contains('mode-teacher'),
        lon: g(() => r1(GLS.lon)), lat: g(() => r1(GLS.lat)), fly: g(() => !!GLS.fly), y: Math.round(window.pageYOffset) };
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
        const fn = decodeURIComponent((src.split('/').pop() || '').split('?')[0]);
        if (!this._acc) this.duration = window.__DUR[fn] || Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this._t0 = performance.now();
        const last = window.__log[window.__log.length - 1];
        if (!(last && last.src === src && !last.end)) window.__log.push({ src, start: window.__snap() });
        const rec = window.__log[window.__log.length - 1];
        rec.dur = this.duration; rec.gl = rec.gl || [];
        clearInterval(this._smp);
        this._smp = setInterval(() => { if (self._src !== src || self.paused) return; try { rec.gl.push([Math.round(self.currentTime * 100) / 100, Math.round(GLS.lon * 10) / 10, Math.round(GLS.lat * 10) / 10]); } catch (e) {} }, 100);
        clearTimeout(this._end);
        this._end = setTimeout(() => {
          if (self._src !== src || self.paused) return;
          const s = window.__snap(); if (s.teacher) window.__teacherSeen++;
          clearInterval(self._smp);
          const cv = document.getElementById('glCanvas'), bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
          const ac = document.querySelector('.tab-content.active canvas, .panel.active canvas');
          if (ac && bub) { const r = ac.getBoundingClientRect(); rec.cvBox = { top: Math.round(r.top), bot: Math.round(r.bottom), bub: Math.round(bub.getBoundingClientRect().top), pin: pin ? Math.round(pin.getBoundingClientRect().top) : null }; }
          rec.end = s; rec.view = {}; Object.values({ a: 'glCanvas', b: 'dvCanvas', c: 'sbCanvas', d: 'clCanvas', e: 'evCanvas' }).forEach(id => rec.view[id] = window.__inView(id));
          self.paused = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) this._acc += (performance.now() - this._t0) / 1000; this.paused = true; clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  }, DUR);
  await page.goto('http://127.0.0.1:8803/earth_plates_2.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const t0 = Date.now();
  // 截圖：句號 → 該句的第幾成（0～1）時拍
  const shots = { '04': 0.75, '10': 0.9, '14': 0.6, '16': 0.5, '20': 0.45, '21': 0.4, '24': 0.9, '26': 0.6, '29': 0.9, '33': 0.8, '42': 0.9, '50': 0.8, '62': 0.8, '69': 0.8, '76': 0.8, '93': 0.8, '97': 0.8, '111': 0.8, '116': 0.8 };
  const shotDone = {};
  const durOf = {}; lines.forEach(l => durOf[l.id] = l.dur);
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'), src: (window.__log[window.__log.length - 1] || {}).src }));
    if (st.done) break;
    if (Date.now() - t0 > 1500000) { console.log('TIMEOUT'); break; }
    const m = st.src && st.src.match(/(\d{3})_/); const k = m ? String(+m[1]) : null;
    const kk = k && (k.length < 2 ? '0' + k : k);
    if (kk && shots[kk] !== undefined && !shotDone[kk]) { shotDone[kk] = 1; await page.waitForTimeout(Math.max(0, shots[kk] * durOf[kk] * 1000 - 150)); await page.screenshot({ path: path.join(OUTDIR, 'ep2_shot_' + kk + '.png') }); }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const end1 = await page.evaluate(() => window.__snap());
  const extra = [];
  async function jump(n) { const bb = await (await page.$('.vx-line')).boundingBox(); await page.mouse.click(bb.x + bb.width * ((n - 0.5) / lines.length), bb.y + bb.height / 2); await page.waitForTimeout(700); }
  const near = (s, to, tol) => Math.abs(((s.lon - to[0] + 540) % 360) - 180) <= tol && Math.abs(s.lat - to[1]) <= tol;
  // 分頁一：跳到中間的句子，地球儀要直接在那句的角度（不是從開場角度飛過去）
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(400);
  await jump(22); await page.waitForTimeout(100);
  const g22 = await page.evaluate(() => window.__snap());
  if (!(g22.tab === 'tab1' && g22.glMode === 'act' && !g22.glTw && near(g22, GL1[6][2], 6))) extra.push('跳到第 22 句地球儀不對：' + JSON.stringify(g22));
  // 暫停時地球儀的飛行要停住；繼續後要飛到臺灣
  await jump(25); await page.waitForTimeout(lines[24].dur * 360 + 700);
  await page.click('button[aria-label="暫停"]');
  const q1 = await page.evaluate(() => window.__snap()); await page.waitForTimeout(800); const q2 = await page.evaluate(() => window.__snap());
  if (q1.lon !== q2.lon || q1.lat !== q2.lat) extra.push(`暫停時地球儀仍在轉 ${q1.lon},${q1.lat}→${q2.lon},${q2.lat}`);
  if (near(q1, GL1[7][2], 3)) extra.push('暫停測試沒有落在飛行中（已到臺灣）：' + JSON.stringify(q1));
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(2600);
  const q3 = await page.evaluate(() => window.__snap());
  if (!(q3.glTw && near(q3, GL1[7][2], 6))) extra.push('暫停後繼續沒有飛到臺灣：' + JSON.stringify(q3));
  // 倒回海陸：從臺灣跳回第 11 句（海陸・大西洋）
  await jump(11);
  const g11 = await page.evaluate(() => window.__snap());
  if (!(g11.glMode === 'coast' && !g11.glTw && near(g11, GL1[2][2], 6))) extra.push('倒回第 11 句地球儀不對：' + JSON.stringify(g11));
  await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUTDIR, 'ep2_shot_back11.png') });
  // 跳到第 5 句（還沒飛去夏威夷）→ 要在開場角度
  await jump(5);
  const g5 = await page.evaluate(() => window.__snap());
  if (!(g5.glMode === 'coast' && near(g5, GL1[1][2], 6))) extra.push('跳到第 5 句地球儀不對（第 3 句尾已飛到夏威夷）：' + JSON.stringify(g5));
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(600);
  // 跳句：第 44 句（隱沒帶 步驟 2 附近）→ 暫停凍住 → 繼續
  const nSb = lines.findIndex(l => l.tab === 'tab3' && l.step === 2) + 1;
  await page.click('button[aria-label="開始／繼續"]'); await page.waitForTimeout(400);
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

  let bad = 0; const cvsOf = t => CVS[t]; const glTbl = [], cvOut = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  const segLast = {};   // 每一站（分頁#步驟）最後一句
  lines.forEach((l, i) => { segLast[l.tab + '#' + l.step] = i; });
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r || !r.end) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const w = e.w, s = r.end;
    for (const k of Object.keys(w)) { if (k === 'amtTo' || k === 'sTo' || k === 'glTo') continue; if (s[k] !== w[k]) probs.push(`${k}=${JSON.stringify(s[k])}≠${JSON.stringify(w[k])}`); }
    if (segLast[e.tab + '#' + e.step] === i) {
      if (w.amtTo !== undefined && Math.abs(s.amt - w.amtTo) > 3) probs.push(`分離程度 ${s.amt}≠${w.amtTo}`);
      if (w.sTo !== undefined && Math.abs(s.s - w.sTo) > 3) probs.push(`擠壓程度 ${s.s}≠${w.sTo}`);
    }
    const v = r.view && r.view[cvsOf(e.tab)]; if (v !== null && v < 50) probs.push('畫布露出 ' + v + '%');
    if (r.cvBox) { const lim = Math.min(r.cvBox.bub, r.cvBox.pin === null ? 1e9 : r.cvBox.pin); if (r.cvBox.top < 0 || r.cvBox.bot > lim) cvOut.push(e.id + '(' + r.cvBox.top + '～' + r.cvBox.bot + '／框' + lim + ')'); }
    if (e.tab === 'tab1') {
      const to = w.glTo, gl = r.gl || [];
      const dl = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
      if (!(dl(s.lon, to[0]) <= 6 && Math.abs(s.lat - to[1]) <= 6)) probs.push(`地球儀 ${s.lon},${s.lat}≠${to}`);
      let mv = null, arr = null; const p0 = gl[0];
      for (const q of gl) { if (mv === null && p0 && (dl(q[1], p0[1]) > 0.5 || Math.abs(q[2] - p0[2]) > 0.5)) mv = q[0]; if (arr === null && dl(q[1], to[0]) <= 6 && Math.abs(q[2] - to[1]) <= 6) arr = q[0]; }
      const ni = NAME[e.id] ? e.text.indexOf(NAME[e.id]) : -1, nt = ni >= 0 ? Math.round(ni / e.text.length * e.dur * 10) / 10 : null;
      glTbl.push(`${e.id} 步${e.startStep}→${e.step} 長${e.dur.toFixed(1)}s 句首${p0 ? p0[1] + ',' + p0[2] : '-'} 句末${s.lon},${s.lat} 目標${to} 開始動${mv === null ? '-' : mv + 's'} 到位${arr === null ? '未到' : arr + 's'}${nt !== null ? ' 地名「' + NAME[e.id] + '」約' + nt + 's' + (arr !== null && arr > nt + 0.2 ? ' ←晚到' : '') : ''}`);
    }
    if (probs.length) { bad++; console.log('第', e.id, '句', e.tab + '#' + e.step, probs.join(' | '), '「' + e.text.slice(0, 18) + '」'); }
  }
  console.log('── 分頁一地球儀逐句 ──\n' + glTbl.join('\n'));
  console.log('畫布不在字幕框上方的句子：', cvOut.length ? cvOut.join(' ') : 'none');
  const resetOK = after.glMode === 'coast' && after.dvMode === 'ocean' && after.amt === 45 && after.lon === 60 && after.lat === 12 && after.glTw === false && after.sbStep === 0 && after.clGhost === false && after.evMode === 'all';
  console.log('mismatches', bad, '| js errors', errors.length ? errors.join(' ; ') : 'none', '| mode-teacher', teacherSeen, '| extra', extra.length ? extra.join(' ; ') : 'ok', '| 停止後還原', resetOK ? 'ok' : JSON.stringify(after));
})();
