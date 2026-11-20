// earth_interior_1 逐句模擬：用「真實音檔長度」（ffprobe）的假音訊逐句播放整課，
//  ・每句開始、句中（每 40ms）、結束時讀頁面狀態（分頁、EI 目前第幾站），與 stage.json 推算的期望逐句比對
//  ・每句結束時主畫面（動畫畫布）要整個在字幕框上方；有螢光筆的句子要畫出至少 segs 條線
//  ・動畫被下一站「切斷」（上一站動畫還沒演完就換站）會列在「⚠ 動畫被切斷」；不算不一致，但要檢查稿子節奏
//  ・全程不得出現 body.mode-teacher；播完／停止後狀態還原
//  ・額外：跳句 → 暫停（時鐘凍住、動畫不動）→ 繼續（動畫再動）→ 停止還原
// 用法：repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_interior_1.js [結果.json]
//       FAST=1 時每句固定 1.3 秒（只驗切換，不驗動畫有沒有被切斷）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '../../../..');
const AUDIO = path.join(REPO, 'audio/earth_interior_1/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_ei1_result.json');
const SHOTDIR = path.dirname(OUT);
const FAST = !!process.env.FAST;
const playerSrc = fs.readFileSync(path.join(REPO, 'earth_interior_1_voice_v1.js'), 'utf8');
const HLSEG = {};
{ const m = playerSrc.match(/var HLSPEC = \{([\s\S]*?)\n  \};/); (m ? m[1] : '').split('\n').forEach(l => { const k = /^\s*"(\d+)": \[/.exec(l); if (k) HLSEG[k[1]] = (l.match(/\{ s:/g) || []).length; }); }

// 真實音檔長度（秒）
const DUR = {};
for (const it of manifest.items) {
  if (it.kind === 'marker' || !it.file) continue;
  const f = AUDIO + 'mp3/' + it.file;
  try { DUR[it.file] = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()); } catch (e) { DUR[it.file] = 3; }
}

// 與播放器 ST 相同：每一步對應 EI 第幾站（-1＝剛進來）；done＝補充文字（站已做完）
const ST = {
  tab1: [-1, -1, 0, 1, 2, 3, 3], tab2: [-1, -1, 0, 1, 2, 3, 4, 5, 5], tab3: [-1, 0, 1, 2, 3, 3],
  tab4: [-1, 0, 1, 2, 3, 4, 5, 6, 7], tab5: [-1, 0, 1, 1, 2, 3, 3]
};
const want = (tab, step) => ({ tab, cur: ST[tab][(step || 1) - 1] });
const fmt = s => s.tab + '#' + (s.step || 1);

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
  await page.addInitScript(([DURS, FASTF]) => {
    window.__log = []; window.__teacherSeen = 0; window.__DUR = DURS; window.__FAST = FASTF;
    const VIEW = { // 與播放器 viewOf 相同：每個分頁、每一步要露出的元素
      tab1: ['hook', 'sw', 'sw', 'sw', 'sw', 'sw', 'notes'], tab2: ['hook', 'dc', 'dc', 'dc', 'dc', 'dc', 'dc', 'dc', 'notes'], tab3: ['hook', 'rd', 'rd', 'rd', 'rd', 'notes'],
      tab4: ['hook', 'ly', 'ly', 'ly', 'pf', 'pf', 'pf', 'pf', 'pf'], tab5: ['hook', 'cv', 'cv', 'story', 'pg', 'pg', 'notes']
    };
    window.__snap = () => {
      const tb = document.querySelector('.tab-btn.active');
      const tab = tb ? tb.dataset.tab : null, ti = tab ? parseInt(tab.slice(3), 10) - 1 : 0;
      let cur = null, busy = null, pd = null;
      try { cur = EI.cur(ti); busy = !EI.idle(ti); pd = [LABS.sw.i, LABS.dc.i, LABS.rd.i, LABS.pf.i, CVS.run ? 1 : 0, +PGS.k.toFixed(2), +CVS.t.toFixed(1)]; } catch (e) {}
      return { tab, cur, busy, pd, teacher: document.body.classList.contains('mode-teacher') };
    };
    window.__viewEl = (tab, step) => {
      const v = (VIEW[tab] || [])[step - 1]; const ti = parseInt(tab.slice(3), 10) - 1, p = document.querySelectorAll('.panel')[ti];
      if (v === 'hook') return p.querySelector('.hook-box');
      if (v === 'notes') { const n = p.querySelectorAll('.v5-notes'); return n[n.length - 1]; }
      if (v === 'story') return p.querySelector('.story');
      return document.getElementById(v + '-stage');
    };
    window.__inView = (tab, step) => {
      let c = window.__viewEl(tab, step); if (!c) return null; if (/-stage$/.test(c.id)) c = c.querySelector('.v5-cv') || c; const r = c.getBoundingClientRect(); if (!r.height) return 0;
      const bub = document.querySelector('.vx-bub'); const top = bub ? bub.getBoundingClientRect().top : innerHeight;
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, top - 56)) * 100); };
    window.__cvFull = (tab, step) => { const e = window.__viewEl(tab, step); if (!e || !/-stage$/.test(e.id)) return null; const c = e.querySelector('canvas'); if (!c) return null;
      const r = c.getBoundingClientRect(), bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      let top = bub ? bub.getBoundingClientRect().top : innerHeight; if (pin) top = Math.min(top, pin.getBoundingClientRect().top);
      return Math.round(Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0)) / r.height * 100); };
    window.__hl = () => { const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      let top = bub ? bub.getBoundingClientRect().top : innerHeight; if (pin) top = Math.min(top, pin.getBoundingClientRect().top);
      const els = Array.from(document.querySelectorAll('.vx-hl')).filter(e => e.style.display === 'block');
      return { shown: els.length, inView: els.filter(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= top + 2; }).length }; };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this._poll = 0; this._acc = 0; this._end = 0; this.volume = 1; this.playbackRate = 1; this.muted = false; this.ended = false; }
      set src(v) { this._src = v; this._acc = 0; this.ended = false; } get src() { return this._src; }
      get currentTime() { return this._acc + (this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000); }
      set currentTime(v) {}
      load() {} addEventListener() {} removeEventListener() {}
      play() {
        const self = this, src = this._src;
        const base = (src.match(/[^/]+\.mp3/) || [''])[0];
        if (!this._acc) this.duration = window.__FAST ? 1.3 : (window.__DUR[base] || 3);
        this.paused = false; this._t0 = performance.now();
        let rec = window.__log.length && window.__log[window.__log.length - 1].src === src && !window.__log[window.__log.length - 1].end ? window.__log[window.__log.length - 1] : null;
        if (!rec) { rec = { src, start: window.__snap(), polls: [] }; window.__log.push(rec); }
        clearInterval(this._poll); clearTimeout(this._end);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s); }, 40);
        this._end = setTimeout(() => {
          if (self._src !== src || self.paused) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); rec.hl = window.__hl(); rec.away = document.body.dataset.vxAway === '1';
          rec.vis = {}; rec.cv = {}; const tb = document.querySelector('.tab-btn.active'); const tab = tb && tb.dataset.tab;
          for (let st = 1; st <= 9; st++) { rec.vis[st] = window.__inView(tab, st); rec.cv[st] = window.__cvFull(tab, st); }
          self.paused = true; self.ended = true; if (self.onended) self.onended();
        }, (this.duration - this._acc) * 1000);
        return Promise.resolve();
      }
      pause() { if (!this.paused) { this._acc += (performance.now() - this._t0) / 1000; } this.paused = true; clearInterval(this._poll); clearTimeout(this._end); }
    }
    window.Audio = FakeAudio;
  }, [DUR, FAST]);
  await page.goto('http://127.0.0.1:8803/earth_interior_1.html?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(900);
  const flags0 = await page.evaluate(() => { const s = window.__snap(); return { tab: s.tab, pd: s.pd, cur: [0, 1, 2, 3, 4].map(i => EI.cur(i)) }; });
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const shots = { '07': 1.2, '16': 2.0, '23': 1.5, '26': 2.0, '29': 2.0, '47': 1.5, '53': 2.0, '57': 2.0, '60': 2.0, '75': 2.0, '82': 2.0, '84': 2.0, '98': 2.0, '101': 2.2, '104': 2.0, '112': 2.0, '124': 2.0, '131': 2.0, '138': 2.0 };
  const t0 = Date.now();
  const shotDone = {};
  while (true) {
    const st = await page.evaluate(() => ({ done: ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束'), src: (window.__log[window.__log.length - 1] || {}).src }));
    if (st.done) break;
    if (Date.now() - t0 > 1500000) { console.log('TIMEOUT'); break; }
    const m = st.src && st.src.match(/(\d{3})_/);
    const k = m ? String(+m[1]).padStart(2, '0') : null;
    if (k && shots[k] !== undefined && !shotDone[k]) {
      shotDone[k] = 1;
      await page.waitForTimeout(Math.round(shots[k] * 1000));
      await page.screenshot({ path: path.join(SHOTDIR, 'ei1_shot_' + k + '.png') });
    }
    await page.waitForTimeout(100);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const flags1 = await page.evaluate(() => { const s = window.__snap(); return { tab: s.tab, pd: s.pd, cur: [0, 1, 2, 3, 4].map(i => EI.cur(i)) }; });

  // ── 額外：跳到第 111 句（瀝青快轉）→ 暫停（時鐘凍住）→ 繼續 → 跳到第 25 句 → 停止（狀態還原）──
  const extra = [];
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(400);
  let bb = await (await page.$('.vx-line')).boundingBox();
  await page.mouse.click(bb.x + bb.width * (110.5 / lines.length), bb.y + bb.height / 2);   // 第 111 句（快轉那一站）
  await page.waitForTimeout(1200);
  const j1 = await page.evaluate(() => window.__snap());
  if (!(j1.tab === 'tab4' && j1.cur === 6)) extra.push('跳到第 111 句後畫面不對：' + JSON.stringify(j1));
  await page.click('button[aria-label="暫停"]');
  const p1 = await page.evaluate(() => [kNow(), LABS.pf.fast, LABS.pf.drops]); await page.waitForTimeout(700); const p2 = await page.evaluate(() => [kNow(), LABS.pf.fast, LABS.pf.drops]);
  if (p1[0] !== p2[0]) extra.push(`暫停時時鐘仍在走 ${p1[0]}→${p2[0]}`);
  await page.click('button[aria-label="開始／繼續"]');
  await page.waitForTimeout(700); const p3 = await page.evaluate(() => kNow());
  if (p3 === p2[0]) extra.push('繼續後時鐘沒有再走');
  bb = await (await page.$('.vx-line')).boundingBox();
  await page.mouse.click(bb.x + bb.width * (24.5 / lines.length), bb.y + bb.height / 2);   // 第 25 句（艾斯波那一站）
  await page.waitForTimeout(1200);
  const k1 = await page.evaluate(() => window.__snap());
  if (!(k1.tab === 'tab1' && k1.cur === 2)) extra.push('跳到第 25 句後畫面不對：' + JSON.stringify(k1));
  await page.click('button[aria-label="停止"]'); await page.waitForTimeout(600);
  const flags2 = await page.evaluate(() => { const s = window.__snap(); return { tab: s.tab, pd: s.pd, cur: [0, 1, 2, 3, 4].map(i => EI.cur(i)) }; });
  const hlLeft = await page.evaluate(() => document.querySelectorAll('.vx-hl').length);
  if (hlLeft) extra.push('停止後螢光筆還留在畫面上 ' + hlLeft);
  await page.screenshot({ path: path.join(SHOTDIR, 'ei1_shot_stop.png') });
  await browser.close();

  const match = (w, s) => !!s && s.tab === w.tab && s.cur === w.cur;
  const diff = (w, s) => `tab=${s && s.tab}≠${w.tab} cur=${s && s.cut ? '' : (s && s.cur)}≠${w.cur}`;
  let bad = 0, cut = 0; const rows = [];
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's', FAST ? '(FAST)' : '');
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(s => want(s.tab, s.step));
    if (!match(W[0], r.start)) probs.push('開始：' + diff(W[0], r.start));
    const all = [r.start, ...r.polls, r.end];
    let k = 0;
    for (let j = 0; j < all.length; j++) { if (k < W.length && match(W[k], all[j])) k++; }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    const last = W[W.length - 1], lastS = e.seq[e.seq.length - 1];
    if (!match(last, r.end)) probs.push('結束：' + diff(last, r.end));
    const vis = r.vis ? r.vis[lastS.step || 1] : null;
    if (!(vis >= 50) && !r.away) probs.push(`主畫面（${fmt(lastS)}）只露出 ${vis}%`);
    const cvf = r.cv ? r.cv[lastS.step || 1] : null;
    if (cvf !== null && cvf < 98 && !r.away) probs.push(`動畫畫布沒有整個在主屏內（只露出 ${cvf}%）`);
    const need = HLSEG[e.id];
    if (need) { if (!r.hl || r.hl.shown < need) probs.push(`螢光筆只畫了 ${r.hl && r.hl.shown} 條，應至少 ${need}`); else if (!r.away && r.hl.inView < r.hl.shown) probs.push(`螢光筆有 ${r.hl.shown - r.hl.inView} 條在字幕框下面`); }
    // 動畫被切斷：下一句換了站，這一句結束時動畫（實驗台／倒轉）還在跑
    const nx = lines[i + 1];
    if (!FAST && nx && r.end && r.end.busy && fmt(nx.seq[0]) !== fmt(lastS) && nx.seq[0].tab === lastS.tab && want(nx.seq[0].tab, nx.seq[0].step).cur !== want(lastS.tab, lastS.step).cur) {
      cut++; console.log(`⚠ 動畫被切斷：#${e.id} 結束時第 ${fmt(lastS)} 站的動畫還沒演完，下一句 #${nx.id} 就換站了`);
    }
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 16), expect: e.seq.map(fmt).join(' → '), dur: +(DUR[e.file] || 0).toFixed(1), start: r.start, end: r.end, vis, hl: r.hl, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(flags0.cur, flags1.cur) || !same(flags0.pd, flags1.pd)) { bad++; console.log('✗ 播完後狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags1)); }
  if (!same(flags0.cur, flags2.cur) || !same(flags0.pd, flags2.pd)) { bad++; console.log('✗ 停止後狀態沒有還原', JSON.stringify(flags0), '→', JSON.stringify(flags2)); }
  extra.forEach(x => { bad++; console.log('✗ ' + x); });
  fs.writeFileSync(OUT, JSON.stringify({ rows, teacherSeen, errors, flags0, flags1, flags2, extra, cut }, null, 1));
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('動畫被切斷：', cut);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
