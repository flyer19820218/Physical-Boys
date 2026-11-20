// earth_rocks_4 逐句模擬：開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀當時的分頁與舞台狀態、畫布是否在字幕框上方、是否還在老師講解模式。
// 期望值來自 lessons/earth_rocks_4.json 的 at／acts。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_earth_rocks_4.js [輸出 json]   （環境變數 SMOKE=秒數 只跑前幾秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/earth_rocks_4.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_rocks_4/manifest.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_rocks_result.json');
const SMOKE = Number(process.env.SMOKE || 0);

// 與播放器 ACTS 相同的動作表（[舞台, 動作, 參數]）
const ACTS = [
  [['mn', 'fresh'], ['mn', 'go', 0], ['mn', 'show', 1], ['mn', 'pick', 1], ['mn', 'go', 2], ['mn', 'go', 3]],
  [['cr', 'fresh'], ['cr', 'go', 0], ['cr', 'show', 1], ['cr', 'pick', 1], ['cr', 'go', 2], ['cr', 'go', 3]],
  [['sd', 'show', 0], ['sd', 'pick', 0], ['sd', 'go', 1], ['sd', 'go', 2], ['sd', 'go', 3], ['sd', 'go', 4], ['mt', 'fresh'], ['mt', 'go', 0], ['mt', 'show', 1], ['mt', 'pick', 1], ['mt', 'go', 2], ['mt', 'go', 3]],
  [['cy', 'fresh'], ['cy', 'do'], ['cy', 'try'], ['cy', 'do'], ['cy', 'do'], ['cy', 'do'], ['cy', 'do'], ['cy', 'do']]
];
const CY_NODE = ['MAG', 'IGN', 'IGN', 'SED', 'SRK', 'MET', 'MET', 'MAG'], CY_LEN = [1, 2, 2, 3, 4, 5, 6, 7];
function actOf(e) { return ACTS[Number(e.tab.replace('btn-tab-', ''))][e.step - 1]; }
function stateOk(e, st) {
  const a = actOf(e); if (!a) return false;
  if (a[0] === 'cy') {
    const k = e.step - 1, L = CY_LEN[k];
    if (!(st.cyCur === CY_NODE[k] && st.cyLen === L) && !(st.cyMv && st.cyLen === L - 1)) return false;
    if (a[1] === 'try') return !!st.cyMsg;
    return true;
  }
  const S = st.labs[a[0]];
  if (e.tab === 'btn-tab-2' && e.step >= 7 && !(st.labs.sd.i >= 5 && !st.labs.sd.busy)) return false;
  if (a[1] === 'fresh') return S.i === 0 && !S.busy;
  if (a[1] === 'go') return S.i === a[2] || S.i === a[2] + 1;
  if (a[1] === 'show') return S.i === a[2] && !S.busy;
  if (a[1] === 'pick') return S.i === a[2] + 1;
  return false;
}
const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/earth_rocks_4/stage.json'), 'utf8'));
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
const acts = cfg.acts || {};
function expect(n) {
  let cur = null;
  for (let k = 1; k <= n; k++) {
    if (cfg.at[String(k)]) cur = cfg.at[String(k)];
    const ac = acts[String(k)];
    if (ac && ac.length && k < n) { const z = ac[ac.length - 1]; cur = [z[1], z[2], z[3]]; }
  }
  return cur ? { tab: cur[0], step: cur[2] } : null;
}
function expectEnd(n) { const ac = acts[String(n)]; if (!ac || !ac.length) return null; const z = ac[ac.length - 1]; return { tab: z[1], step: z[3] }; }

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/earth_rocks_4.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  await page.click('.vx-ctl button[title="開始／繼續"]');

  const seen = {};
  const started = Date.now();
  const limit = SMOKE ? SMOKE * 1000 : 20 * 60 * 1000;
  let last = 0, teacherDuringPlay = false;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const act = sel => [...document.querySelectorAll(sel)].findIndex(e => e.classList.contains('active'));
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 0;
      const cvOk = {};
      ['mn', 'cr', 'sd', 'mt', 'cy'].forEach(id => { const c = document.getElementById(id + 'Canvas'); if (c) { const r = c.getBoundingClientRect(); cvOk[id] = r.top >= 0 && r.bottom <= top + 2; } });
      const labs = {};
      ['mn', 'cr', 'sd', 'mt'].forEach(id => { labs[id] = { i: LABS[id].i, busy: !!LABS[id].cur }; });
      const tabI = act('.tabs .tab-btn');
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '',
        tab: tabI >= 0 ? 'btn-tab-' + tabI : null, labs, cvOk,
        cyCur: CYS.cur, cyLen: CYS.path.length, cyMv: !!CYS.mv, cyMsg: !!CYS.msg,
        teacher: document.body.classList.contains('mode-teacher'),
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) seen[n] = { tab: st.tab, st0: st };
      seen[n].last = st; seen[n].cvOk = st.cvOk;
      last = n;
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
    const e2 = expectEnd(n), sl = s.last || s.st0;
    const ok = (e && s.tab === e.tab && stateOk(e, sl)) || (e2 && s.tab === e2.tab && stateOk(e2, sl));
    if (!ok) { mismatches++; report.push({ n, expect: e, got: { tab: s.tab, labs: sl.labs, cy: [sl.cyCur, sl.cyLen, sl.cyMv, sl.cyMsg] } }); }
  }
  // 畫布要整張在字幕框上方：用該句「最後的期望」判斷是哪一張
  const canvasBad = [];
  Object.keys(seen).filter(k => k !== 'probe').forEach(k => {
    const n = Number(k), v = seen[k], e = expectEnd(n) || expect(n); if (!e || !v.cvOk) return;
    const a = actOf(e); if (a && v.cvOk[a[0]] === false) canvasBad.push(n);
  });
  const result = { canvasBad, observed: Object.keys(seen).filter(k => k !== 'probe').length, lines: lines.length, mismatches, teacherDuringPlay, errors: errs, report };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('canvas 沒完整在字幕框上方的句子：', JSON.stringify(canvasBad));
  console.log(JSON.stringify({ observed: result.observed, lines: result.lines, mismatches, teacherDuringPlay, errors: errs.length }));
  if (report.length) console.log(JSON.stringify(report.slice(0, 12)));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
