// biology_plant_transport 逐句模擬：用真實音檔實際播放整課，每句開始時讀頁面狀態，
//   與 lessons/biology_plant_transport.json 的 at 推算的期望（分頁＋步驟）比對。
//   另記錄「亮框」（目前步驟按鈕）與字幕序號是否同步。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_biology_plant_transport.js [輸出 json]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/biology_plant_transport.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/biology_plant_transport/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_pt_result.json');

// 期望：第 n 句（說話行序號）時的分頁與步驟
const lines = manifest.items.filter(i => i.kind === 'line');
const at = Object.keys(cfg.at).map(Number).sort((a, b) => a - b);
function expect(n) {
  let cur = null;
  for (const k of at) { if (k <= n) cur = cfg.at[String(k)]; }
  return cur ? { tab: cur[0], step: cur[2] } : null;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/biology_plant_transport.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('#vxOpen');
  await page.waitForTimeout(3000);
  await page.click('#mode-teacher').catch(()=>{}); // 播放中硬點老師講解，應被防護切回學生模式

  const seen = {};          // 句號 → 第一次出現時的狀態
  const started = Date.now();
  let last = -1;
  while (Date.now() - started < 16 * 60 * 1000) {
    const st = await page.evaluate(() => {
      const c = document.querySelector('#vxPanel .vx-count');
      const sub = document.querySelector('#vxPanel .vx-sub');
      const on = document.querySelector('.pt-step.on');
      const tab = (window.LivingBook && LivingBook.getTab) ? LivingBook.getTab().id : null;
      const steps = [...document.querySelectorAll('.pt-step')];
      return {
        count: c ? c.textContent : '', sub: sub ? sub.textContent : '', tab,
        stepOn: on ? steps.indexOf(on) + 1 : 0, hl: document.querySelectorAll('.vx-hl').length, bodyTeacher: document.body.classList.contains('mode-teacher'),
      };
    });
    const n = parseInt(st.count, 10) || 0;
    if (n && n !== last && !seen[n]) {
      seen[n] = { tab: st.tab, stepOn: st.stepOn, sub: st.sub, teacher: st.bodyTeacher, hl: st.hl, t: Date.now() - started };
      last = n;
    }
    if (n && seen[n] && st.hl > (seen[n].hl || 0)) seen[n].hl = st.hl;
    if (n >= lines.length) { await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(120);
  }

  // 比對
  const report = [];
  let mismatches = 0, teacherSeen = false;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; continue; }
    if (s.teacher) teacherSeen = true;
    const ok = e && s.tab === e.tab && s.stepOn === e.step;
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, step: s.stepOn }, sub: s.sub.slice(0, 30) }); }
  }
  const hlLines = Object.keys(seen).filter(n => seen[n].hl > 0).map(Number);
  const result = { hlLines, lines: lines.length, observed: Object.keys(seen).length, mismatches, teacherSeen, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ lines: result.lines, observed: result.observed, mismatches, teacherSeen, errors: errs.length }));
  if (report.length) console.log(report.slice(0, 20));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
