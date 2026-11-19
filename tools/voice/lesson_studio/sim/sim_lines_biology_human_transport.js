// biology_human_transport 逐句模擬（改寫自 sim_lines_biology_plant_transport.js；假音訊同 sim_lines_electronics_2.js）
//  ・以假音訊（真實時間流動，每句 1.5～3 秒）播放整課；每句開始、句中（每 40ms）、結束時讀頁面狀態：
//    分頁（LivingBook.getTab().id）、亮框步驟（.pt-step.on）、以及該步驟／段的 ops 寫進引擎 state 的值（＝段有沒有對上）
//  ・期望值由 stage.json 的 cuts／at／acts 依序推算；段的「應有 state」是先在頁面上呼叫 HTLesson.show(分頁, 步, 段) 量出來的
//  ・全程不得出現 body.mode-teacher（學生模式權限不被打斷）；另列出每個分頁每一步有沒有被某一句對到
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_biology_human_transport.js [student|teacher] [輸出 json]
//   student＝照常開頁按有聲講解（播放中硬點一次老師講解，應被擋回）；teacher＝先切到老師講解模式再按有聲講解
//   音檔資料夾預設 audio/biology_human_transport/；尚未 build 時可用環境變數 HT_AUDIO_DIR 指到別的 manifest／stage 所在資料夾
//   頁面若還沒掛播放器 <script>，模擬會自己注入 biology_human_transport_voice_v1.js（並提醒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const LESSON = 'biology_human_transport';
const MODE = process.argv[2] === 'teacher' ? 'teacher' : 'student';
const OUT = process.argv[3] || path.join(process.env.TMPDIR || '/tmp', 'sim_ht_result_' + MODE + '.json');
const ADIR = process.env.HT_AUDIO_DIR || path.join(REPO, 'audio', LESSON);
const manifestTxt = fs.readFileSync(path.join(ADIR, 'manifest.json'), 'utf8');
const stageTxt = fs.readFileSync(path.join(ADIR, 'stage.json'), 'utf8');
const manifest = JSON.parse(manifestTxt), stage = JSON.parse(stageTxt);
const html = fs.readFileSync(path.join(REPO, stage.page), 'utf8');
const PLAYER = LESSON + '_voice_v1.js';
const hasPlayerTag = html.indexOf(PLAYER) >= 0;

// ── 步驟表（直接從教學檔讀 TABS，與頁面同步）──
const teachSrc = fs.readFileSync(path.join(REPO, 'assets/biology/human_transport_teach_0118_v1.js'), 'utf8');
const TABS = (() => { const m = /var TABS = (\{[\s\S]*?\n {2}\});/.exec(teachSrc); return new Function('SEG', 'return ' + m[1])(10); })();
const STEPS = Object.fromEntries(Object.entries(TABS).map(([k, v]) => [k, v.length]));

// ── 依序套用 cut / at / acts，得到每句的期望序列 ──
const lines = [];
let cur = null, afterCut = false;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, step: 1, seg: 0 }; afterCut = true; }
    continue;
  }
  const a = stage.at[it.id];
  if (a) cur = { tab: a.tab, step: a.step || 1, seg: a.seg || 0 };
  const seq = [cur];
  for (const x of (stage.acts && stage.acts[it.id]) || []) { cur = { tab: x[1], step: x[3], seg: x[4] || 0 }; seq.push(cur); }
  lines.push({ id: it.id, file: it.file, speaker: it.speaker, text: it.text, seq, afterCut });
  afterCut = false;
}
const fmt = s => s ? `${s.tab}#${s.step}.${s.seg}` : '∅';
// 每個分頁每一步：有哪些句子對到
const cover = {};
for (const t of Object.keys(TABS)) for (let k = 1; k <= TABS[t].length; k++) cover[t + '#' + k] = [];
for (const l of lines) for (const s of l.seq) if (s && cover[s.tab + '#' + s.step] && !cover[s.tab + '#' + s.step].includes(+l.id)) cover[s.tab + '#' + s.step].push(+l.id);
// 引擎 state 的哪些欄位代表「這一段」（op key → state key；action 由各分頁 act 轉成別的欄位）
const KEYMAP = { phase: ['beat', 'auto'], action: ['task', 'targetSeparation', 'auto', 'component'] };
// 播放器另外固定的欄位（biology_human_transport_voice_v1.js 的 FIX：淋巴旅程固定在該步對應的那一段）
const EXTRA = { lymph: { lymphStep: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 } } };
function sigKeys(tab, step, seg) {
  const keys = new Set();
  TABS[tab][step - 1].segs.slice(0, seg + 1).forEach(sg => sg.ops.forEach(o => (KEYMAP[o[0]] || [o[0]]).forEach(k => keys.add(k))));
  return [...keys];
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.route('**/audio/' + LESSON + '/manifest.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: manifestTxt }));
  await page.route('**/audio/' + LESSON + '/stage.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: stageTxt }));
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    window.__snap = () => {
      const LB = window.LivingBook, on = document.querySelector('#ptSteps .pt-step.on');
      const s = LB && LB.getState ? LB.getState() : {};
      const st = {}; Object.keys(s || {}).forEach(k => { const v = s[k]; if (v === null || typeof v !== 'object') st[k] = v; });
      return { tab: LB && LB.getTab ? LB.getTab().id : null, step: on ? +on.dataset.k + 1 : 0, st, teacher: document.body.classList.contains('mode-teacher'),
        count: ((document.querySelector('#vxPanel .vx-count') || {}).textContent || '') };
    };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.ended = false; this.onended = null; this.onerror = null; this.preload = 'auto'; this._src = ''; this._poll = 0; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('#vxPanel .vx-sub') || {}).textContent || '';
        this.duration = Math.min(3, Math.max(1.5, txt.length * 0.07));
        this.paused = false; this.ended = false; this._t0 = performance.now();
        const rec = { src, start: window.__snap(), polls: [] };
        window.__log.push(rec);
        clearInterval(this._poll);
        this._poll = setInterval(() => { const s = window.__snap(); if (s.teacher) window.__teacherSeen++; rec.polls.push(s); }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(self._poll);
          rec.end = window.__snap(); if (rec.end.teacher) window.__teacherSeen++;
          self.paused = true; self.ended = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
  });
  await page.goto('http://127.0.0.1:8803/' + stage.page + '?v=sim' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(1500);
  if (!hasPlayerTag) await page.addScriptTag({ url: PLAYER + '?v=sim' + Date.now() });
  await page.waitForSelector('#vxOpen', { timeout: 15000 });

  // ── 量每一段的「應有 state」：HTLesson.show(分頁, 步, 段) 之後讀 op 對應欄位；0.6 秒後再讀一次確認不會自己變 ──
  const probeIn = [];
  for (const t of Object.keys(TABS)) TABS[t].forEach((stp, i) => stp.segs.forEach((_, j) => probeIn.push({ t, k: i + 1, j, keys: sigKeys(t, i + 1, j) })));
  const SIG = await page.evaluate(async (list) => {
    const out = {};
    for (const p of list) {
      HTLesson.show(p.t, p.k, p.j);
      const s = LivingBook.getState(), a = {}; p.keys.forEach(k => a[k] = s[k]);
      await new Promise(r => setTimeout(r, 600));
      const s2 = LivingBook.getState(), b = {}; p.keys.forEach(k => b[k] = s2[k]);
      out[p.t + '#' + p.k + '.' + p.j] = { a, unstable: p.keys.filter(k => a[k] !== b[k]) };
    }
    HTLesson.takeover(false); LivingBook.setTab(0);
    return out;
  }, probeIn);
  const unstable = Object.entries(SIG).filter(([, v]) => v.unstable.length).map(([k, v]) => k + ':' + v.unstable.join('/'));
  for (const v of Object.values(SIG)) for (const k of v.unstable) delete v.a[k];
  // 段與段之間沒有差別的欄位就不能拿來分辨段，照樣比對（同一步不同段至少要有一個欄位不同，下面會列出分不出來的）
  const indist = [];
  for (const t of Object.keys(TABS)) TABS[t].forEach((stp, i) => { for (let j = 1; j < stp.segs.length; j++) {
    const A = SIG[`${t}#${i + 1}.${j - 1}`].a, B = SIG[`${t}#${i + 1}.${j}`].a;
    if (Object.keys(B).every(k => A[k] === B[k])) indist.push(`${t}#${i + 1}.${j}`); } });

  await page.waitForTimeout(800);
  if (MODE === 'teacher') { await page.click('#mode-teacher'); await page.waitForTimeout(1200); }
  const teacherBefore = await page.evaluate(() => document.body.classList.contains('mode-teacher'));
  await page.click('#vxOpen');
  await page.click('#vxPanel .vx-ic[title="開始／繼續"]');
  const t0 = Date.now();
  let pokedTeacher = false;
  while (true) {
    const st = await page.evaluate(() => ({ n: window.__log.length, ended: !!(window.__log[window.__log.length - 1] || {}).end }));
    if (!pokedTeacher && st.n >= 5) { pokedTeacher = true; await page.click('#mode-teacher').catch(() => {}); } // 播放中硬點老師講解，應被擋回學生模式
    if (st.n >= lines.length && st.ended) break;
    if (Date.now() - t0 > 540000) { console.log('TIMEOUT'); break; }
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  const after = await page.evaluate(() => ({ teacher: document.body.classList.contains('mode-teacher'), vxOn: !!document.querySelector('#vxPanel.show') }));
  await browser.close();

  const want = s => {
    const sig = Object.assign({}, SIG[fmt(s)].a);
    for (const [k, by] of Object.entries(EXTRA[s.tab] || {})) sig[k] = by[s.step];
    return { tab: s.tab, step: s.step, sig };
  };
  const match = (w, s) => !!s && s.tab === w.tab && s.step === w.step && Object.keys(w.sig).every(k => s.st[k] === w.sig[k]);
  const diff = (w, s) => !s ? ['∅'] : [
    ...(s.tab !== w.tab ? [`tab=${s.tab}≠${w.tab}`] : []), ...(s.step !== w.step ? [`step=${s.step}≠${w.step}`] : []),
    ...Object.keys(w.sig).filter(k => s.st[k] !== w.sig[k]).map(k => `${k}=${JSON.stringify(s.st[k])}≠${JSON.stringify(w.sig[k])}`)];
  let bad = 0; const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const e = lines[i], r = log[i], probs = [];
    if (!r) { bad++; console.log('MISSING', e.id); continue; }
    if (r.src.indexOf(e.file) < 0) probs.push('file ' + r.src);
    const W = e.seq.map(want);
    if (!match(W[0], r.start)) probs.push('開始：' + diff(W[0], r.start).join(','));
    let k = 0;
    for (const s of [r.start, ...r.polls, r.end]) { if (k < W.length && match(W[k], s)) k++; }
    if (k < W.length) probs.push('句中未出現第 ' + (k + 1) + ' 個狀態 ' + fmt(e.seq[k]));
    if (!match(W[W.length - 1], r.end)) probs.push('結束：' + diff(W[W.length - 1], r.end).join(','));
    rows.push({ id: e.id, who: e.speaker, text: e.text.slice(0, 16), expect: e.seq.map(fmt).join(' → '), cut: e.afterCut, ok: !probs.length, probs });
    if (probs.length) { bad++; console.log(`✗ #${e.id} ${e.text.slice(0, 16)} [${e.seq.map(fmt).join('→')}] → ${probs.join('; ')}`); }
  }
  const missingSteps = Object.keys(cover).filter(k => !cover[k].length);
  fs.writeFileSync(OUT, JSON.stringify({ mode: MODE, rows, cover, missingSteps, teacherSeen, teacherBefore, after, unstable, indist, SIG, errors }, null, 1));
  console.log('模式：', MODE, '（開始播放前 body.mode-teacher＝' + teacherBefore + '）', hasPlayerTag ? '' : '［頁面尚未掛播放器 script，本次由模擬注入］');
  console.log('played:', log.length, 'expected:', lines.length, ' 真實時間：', Math.round((Date.now() - t0) / 1000) + 's');
  console.log('每步對到的句號：'); Object.keys(cover).forEach(k => console.log('  ' + k.padEnd(14) + (cover[k].join(',') || '（沒有）')));
  console.log('沒被對到的步驟：', missingSteps.length ? missingSteps : 'none');
  if (unstable.length) console.log('（量 state 時會自己變的欄位，已排除不比）', unstable.join(' '));
  if (indist.length) console.log('（同一步內與前一段 state 一樣、分不出段的）', indist.join(' '));
  console.log('切頁後首句：', rows.filter(x => x.cut).map(x => `#${x.id} ${x.expect} ${x.ok ? 'OK' : 'NG'}`).join(' ｜ '));
  console.log('mode-teacher 出現次數：', teacherSeen, ' 播完後 mode-teacher：', after.teacher);
  console.log('mismatches:', bad);
  console.log('js errors:', errors.length ? errors : 'none');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
