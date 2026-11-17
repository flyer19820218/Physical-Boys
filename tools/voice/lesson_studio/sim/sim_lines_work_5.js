// work_5 逐句模擬：假音訊（每句 1.6 秒），整課播一遍，每句結束時比對頁面「分頁／子頁／動畫步驟」與 stage.json（cuts／at／acts）推算的期望。
// 用法：repo 根目錄 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_work_5.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const manifest = JSON.parse(fs.readFileSync(REPO + '/audio/work_5/manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(REPO + '/audio/work_5/stage.json', 'utf8'));
const lines = []; let cur = null;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, sub: c.sub, step: 1 }; }
    continue;
  }
  const a = stage.at[it.id]; if (a) cur = { tab: a.tab, sub: a.sub, step: a.step || 1 };
  const seq = [cur];
  for (const x of (stage.acts && stage.acts[it.id]) || []) { cur = { tab: x[1], sub: x[2], step: x[3] || 1 }; seq.push(cur); }
  lines.push({ id: it.id, text: it.text, want: cur });
}
const STATIC = new Set(['compare', 'future', 'tradeoff']);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.addInitScript(() => {
    window.Audio = function () {
      const a = { src: '', currentTime: 0, duration: 1.6, paused: true, dataset: {}, preload: '', onended: null, onerror: null, _t: 0 };
      a.play = () => { a.paused = false; clearInterval(a._t); const t0 = performance.now() - a.currentTime * 1000;
        a._t = setInterval(() => { a.currentTime = (performance.now() - t0) / 1000; if (a.currentTime >= 1.6) { clearInterval(a._t); a.paused = true; a.onended && a.onended(); } }, 40); return Promise.resolve(); };
      a.pause = () => { a.paused = true; clearInterval(a._t); };
      a.load = () => {}; a.addEventListener = () => {}; a.removeEventListener = () => {};
      return a;
    };
  });
  await page.goto('http://localhost:8803/work_5.html');
  await page.waitForTimeout(800);
  await page.evaluate(() => dismissIntro()); await page.waitForTimeout(1200); await page.click('.vx-open'); await page.waitForTimeout(300);
  const startSel = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.vx-ic')); return b.length; });
  await page.click('button.vx-ic[title="開始／繼續"]');
  const bad = []; let seen = 0, teacherSeen = 0, prevText = '';
  for (let i = 0; i < lines.length; i++) {
    // 等到該句字幕出現，再等到它快結束（1.3 秒後）取樣
    const L = lines[i];
    await page.waitForFunction(prev => { const t = document.querySelector('.vx-txt'); return t && t.textContent !== prev && t.textContent.length > 0; }, prevText, { timeout: 8000 }).catch(() => {});
    prevText = await page.evaluate(() => document.querySelector('.vx-txt').textContent);
    await page.waitForTimeout(1350);
    const st = await page.evaluate(() => {
      const tab = (document.querySelector('.tab-btn.active') || {}).dataset?.tab;
      const sub = (typeof CUR_SUB !== 'undefined') ? CUR_SUB[tab] : null;
      let step = null; const row = document.querySelector('#sv-' + sub + ' .step-row'); if (row) { const b = row.querySelector('.step-btn.active'); step = b ? Array.from(row.querySelectorAll('.step-btn')).indexOf(b) + 1 : null; }
      return { tab, sub, step, teacher: document.body.classList.contains('mode-teacher'), mode: window.W5 && W5.mode };
    });
    if (st.teacher) teacherSeen++;
    const w = L.want, ok = st.tab === w.tab && st.sub === w.sub && (STATIC.has(w.sub) || st.step === w.step);
    if (!ok) bad.push({ id: L.id, want: w.tab + '/' + w.sub + '#' + w.step, got: st.tab + '/' + st.sub + '#' + st.step });
    seen++; if (process.env.V) console.log(L.id, w.tab+'/'+w.sub+'#'+w.step, '->', st.tab+'/'+st.sub+'#'+st.step, ok?'':'XX');
  }
  console.log('lines checked:', seen, '/', lines.length);
  console.log('mode-teacher 出現次數：', teacherSeen);
  console.log('mismatches:', bad.length); bad.slice(0, 40).forEach(b => console.log(' ', JSON.stringify(b)));
  console.log('js errors:', errors.length ? errors : 'none');
  await browser.close();
})();
