// biology_plant_transport 逐句模擬（參考版字幕播放器）：
//   開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與步驟、螢光筆數量、是否還在老師講解模式。
//   期望值來自 lessons/biology_plant_transport.json 的 at。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_biology_plant_transport.js [輸出 json] [SMOKE=秒數]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/biology_plant_transport.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/biology_plant_transport/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_pt_result.json');
const SMOKE = Number(process.env.SMOKE || 0);

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
// 字幕顯示用 stage.json 的 subs（例如「第 1 種」「30 分鐘」），沒有覆寫才用台詞原文
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/biology_plant_transport/stage.json'), 'utf8'));
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
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
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/biology_plant_transport.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  await page.click('.vx-ctl button[title="開始／繼續"]');

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 16 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => ({
      txt: (document.querySelector('.vx-txt') || {}).textContent || '',
      tab: window.LivingBook && LivingBook.getTab ? LivingBook.getTab().id : null,
      stepOn: (() => { const on = document.querySelector('.pt-step.on'); return on ? [...document.querySelectorAll('.pt-step')].indexOf(on) + 1 : 0; })(),
      hl: document.querySelectorAll('.vx-hl').length,
      teacher: document.body.classList.contains('mode-teacher'),
    }));
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) seen[n] = { tab: st.tab, stepOn: st.stepOn, teacher: st.teacher, hl: 0 };
      seen[n].hl = Math.max(seen[n].hl, st.hl);
      if (n !== last) last = n;
    }
    if (st.teacher) teacherDuringPlay = true;
    if (last >= lines.length) { await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(120);
    // 播放 3 秒後，故意硬點「老師講解」，驗證防護會切回學生模式
    if (!seen.probe && Date.now() - started > 3000) { seen.probe = true; await page.click('#mode-teacher').catch(() => {}); }
  }

  const report = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const e = expect(n), s = seen[n];
    if (!s) { if (!SMOKE) { report.push({ n, problem: '沒有觀察到這一句' }); mismatches++; } continue; }
    const ok = e && s.tab === e.tab && s.stepOn === e.step;
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, step: s.stepOn } }); }
  }
  const hlLines = Object.keys(seen).filter(k => k !== 'probe' && seen[k].hl > 0).map(Number);
  const result = { observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, hlLines, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, hlLines, errors: errs.length }));
  if (report.length) console.log(report.slice(0, 10));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
