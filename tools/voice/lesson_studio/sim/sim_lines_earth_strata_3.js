// earth_strata_3 逐句模擬（參考版字幕播放器）：
//   開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與步驟、螢光筆數量、是否還在老師講解模式。
//   期望值來自 lessons/earth_strata_3.json 的 at。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_strata_3.js [輸出 json] [SMOKE=秒數]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/earth_strata_3.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_strata_3/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_strata_result.json');
const SMOKE = Number(process.env.SMOKE || 0);

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
// 字幕顯示用 stage.json 的 subs（例如「第 1 種」「30 分鐘」），沒有覆寫才用台詞原文
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_strata_3/stage.json'), 'utf8'));
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
// 期望：依稿子順序走一遍——切頁＝該分頁的初始（步驟 0），at＝指定步驟
const EXP = {};
(function () {
  let cur = { tab: 'btn-tab-0', step: 0 }, n = 0;
  for (const it of manifest.items) {
    if (it.kind === 'marker') {
      const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
      if (m && cfg.cuts[m[1].trim()]) cur = { tab: cfg.cuts[m[1].trim()][0], step: 0 };
    } else if (it.kind === 'line') {
      n++;
      const a = cfg.at[String(n)]; if (a) cur = { tab: a[0], step: a[2] };
      EXP[n] = { tab: cur.tab, step: cur.step };
      const ac = cfg.acts && cfg.acts[String(n)]; if (ac && ac.length) { const z = ac[ac.length - 1]; cur = { tab: z[1], step: z[3] }; }   // 句中換畫面：這句播完後的狀態
    }
  }
})();
function expect(n) { return EXP[n] || null; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/earth_strata_3.html?r=' + Date.now(), { waitUntil: 'load' });
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
    const st = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('.tabs .tab-btn')];
      const tabI = tabs.findIndex(e => e.classList.contains('active'));
      const labStep = id => { const L = LABS[id]; if (!L) return 0; const s = L.cfg.flow[L.i]; return L.cur ? L.i + 1 : (s && s.guess ? L.i + 1 : L.i); };
      let step = 0;
      if (tabI === 0) step = labStep('fd');
      else if (tabI === 1) step = labStep('ft');
      else if (tabI === 2) step = labStep('ev');
      else if (tabI === 3) step = PE.tx === 250 ? 2 : PE.tx === 455 ? 3 : PE.tx === 560 ? 4 : PE.tx === 880 ? 5 : 0;
      else if (tabI === 4) step = CR.sel ? { tri: 7, fern: 8, shell: 9, all: 10 }[CR.sel] : labStep('fs');
      const rect = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      let panelTop = null; if (bub) { const b = bub.getBoundingClientRect(); panelTop = pin ? Math.min(b.top, pin.getBoundingClientRect().top) : b.top; }
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabI >= 0 ? 'btn-tab-' + tabI : null,
        stepOn: step,
        hl: document.querySelectorAll('.vx-hl').length,
        cvs: { fd: rect('fdCanvas'), ft: rect('ftCanvas'), ev: rect('evCanvas'), pe: rect('peCanvas'), fs: rect('fsCanvas'), cr: rect('crCanvas') },
        panelTop,
        teacher: document.body.classList.contains('mode-teacher'),
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      const ex = expect(n), key = !ex ? null : ex.tab === 'btn-tab-0' ? 'fd' : ex.tab === 'btn-tab-1' ? 'ft' : ex.tab === 'btn-tab-2' ? 'ev' : ex.tab === 'btn-tab-3' ? 'pe' : (ex.step >= 6 ? 'cr' : 'fs');
      const r = key && st.cvs[key], canvasOk = r && st.panelTop != null ? (r.top >= 0 && r.bottom <= st.panelTop + 2) : null;
      if (!seen[n]) seen[n] = { tab: st.tab, stepOn: st.stepOn, teacher: st.teacher, hl: 0, canvasOk };
      seen[n].hl = Math.max(seen[n].hl, st.hl); seen[n].canvasOk = canvasOk;
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
    const GUESS_AFTER = new Set(['btn-tab-0:2', 'btn-tab-1:1', 'btn-tab-2:1', 'btn-tab-4:2']);   // 做完這一步，頁面會自動出現下一步的「先猜猜看」（引擎本來的行為）
    const ok = e && s.tab === e.tab && (s.stepOn === e.step || (GUESS_AFTER.has(e.tab + ':' + e.step) && s.stepOn === e.step + 1) || (e.tab === 'btn-tab-3' && e.step === 0 && s.stepOn === 3) || (e.tab === 'btn-tab-3' && e.step === 1 && s.stepOn === 3) || (e.tab === 'btn-tab-4' && e.step === 6 && s.stepOn === 5));
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, step: s.stepOn } }); }
  }
  const hlLines = Object.keys(seen).filter(k => k !== 'probe' && seen[k].hl > 0).map(Number);
  const canvasBad = Object.keys(seen).filter(k => k !== 'probe' && seen[k].canvasOk === false).map(Number);
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, hlLines, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, hlLines, errors: errs.length }));
  if (report.length) console.log(report.slice(0, 10));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
