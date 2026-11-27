// mechanics_5 逐句模擬：假音訊（每句用真實 mp3 長度，ffprobe 量；量不到就 1.6 秒；FAST=1 時一律 1.6 秒），開啟「有聲講解」整課播一遍，依字幕文字對回第幾句，
// 每句結束前取最後一次的畫面（分頁／子頁／動畫步驟／動手做實驗台狀態）與 lessons/mechanics_5.json 的 cuts／at／acts 推算的期望比對。
// 另外量：畫布（或動手做的畫布）是否整個在字幕框上方、是否出現 body.mode-teacher、js 錯誤；
// 播放 3 秒後故意硬點「老師講解」，驗證播放器會立刻切回學生模式。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_mechanics_5.js [輸出 json]
//   環境變數：SMOKE=秒數（只跑前幾秒，不報「沒觀察到」）、V=1（每句印一行）、SHOTS=資料夾（每句句首截圖）、VW／VH＝視窗寬高（預設 1280×900；iPad 橫式可用 1180×820）
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(REPO + '/tools/voice/lesson_studio/lessons/mechanics_5.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync(REPO + '/audio/mechanics_5/manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(REPO + '/audio/mechanics_5/stage.json', 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_mechanics_5_result.json');
const SMOKE = Number(process.env.SMOKE || 0);
// 每句音檔的真實長度：讓動畫步驟（W5 每步 7～10 秒）與旁白的時間關係和實際播放一樣
const DUR = {};
if (!process.env.FAST) {
  const { execFileSync } = require('child_process');
  for (const it of manifest.items) if (it.kind === 'line') {
    try { DUR[it.file] = Number(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', REPO + '/audio/mechanics_5/mp3/' + it.file]).toString().trim()) || 1.6; }
    catch (e) { DUR[it.file] = 1.6; }
  }
}
// 每支動畫每一步「最後一段字出現」的秒數（W5.debug 的 boxes 量的；mechanics_5_*_1126_v1.js 的 DUR 不變就不用重量；2026-11-27 以 W5.seek＋W5.debug 每 0.05 秒取樣量得，
// 只會跳動的數字（例：水位 12.3 cm）不算新字：比對前把數字換成 #）。seal#4「大氣壓 1033」是 9.35 秒通氣孔打開後才換上的標籤，算進去。
// 換到別的畫面之前，這一步要播到「最後一段字出現後 0.8 秒」，否則算「動畫被截斷」。
const LASTTXT = fs.existsSync(__dirname + '/lasttxt_mechanics_5.json') ? JSON.parse(fs.readFileSync(__dirname + '/lasttxt_mechanics_5.json', 'utf8')) : {};

// 期望畫面：每句「結束時」的狀態（cut → 步驟 1；at；acts 取最後一筆）
const lines = []; let cur = null;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m && stage.cuts[m[1].trim()]) { const c = stage.cuts[m[1].trim()]; cur = { tab: c.tab, sub: c.sub, step: 1 }; }
    continue;
  }
  const a = stage.at[it.id]; if (a) cur = { tab: a.tab, sub: a.sub, step: a.step || 1 };
  for (const x of (stage.acts && stage.acts[it.id]) || []) cur = { tab: x[1], sub: x[2], step: x[3] || 1 };
  lines.push({ id: it.id, text: stage.subs && stage.subs[it.id] || it.text, want: cur });
}
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const lineNorm = lines.map(l => norm(l.text));

// 動手做實驗台的期望狀態（與播放器 LABS 表、設定檔 _note 對照）
const LABKEY = { magde: 'magde', tilt: 'torr', archi: 'archi', cao: 'cao', sinkfloat: 'float', ice: 'ice' };   // 掛載子頁 → 實驗台 key
const LABEXP = {
  magde: { 5: { pct: 100, n: 4 }, 6: { pct: 50, n: 4 }, 7: { pct: 50, n: 4 }, 8: { pct: 0, n: 8 } },
  tilt: { 5: { th: 0, alt: 0 }, 6: { th: 37, alt: 0 }, 7: { th: 37, alt: 3000 } },
  archi: { 5: { liq: 'w', f: 0 }, 6: { liq: 'w', f: 1 }, 7: { liq: 'b', f: 1 } },
  cao: { 5: { n: 0, mark: null, want: false }, 6: { want: true, mark: null }, 7: { want: true, mark: 0.5 }, 8: { want: false, n: 0, mark: 0.5 }, 9: { n: 12, want: false }, 10: { n: 6, want: false } },
  sinkfloat: { 5: { Do: 0.6 }, 6: { Do: 1 }, 7: { Do: 1.4 } },
  ice: { 5: { f: 0, D: 1 }, 6: { f: 1, D: 1 }, 7: { f: 1, D: 1.3 } }
};
const STATIC = new Set([]);
const isLab = w => w && w.step >= 5 && LABEXP[w.sub] && LABEXP[w.sub][w.step];
function okState(w, g) {
  if (!w) return true;
  if (g.tab !== w.tab || g.sub !== w.sub) return false;
  if (isLab(w)) { const ex = LABEXP[w.sub][w.step]; return Object.keys(ex).every(k => g.lab && (typeof ex[k] === 'number' ? Math.abs(g.lab[k] - ex[k]) < 0.06 : g.lab[k] === ex[k])); }
  return STATIC.has(w.sub) || g.step === w.step;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: Number(process.env.VW || 1280), height: Number(process.env.VH || 900) } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL|Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.addInitScript(DUR => {
    const durOf = src => { const m = /([^/?]+\.mp3)/.exec(decodeURIComponent(src || '')); return (m && DUR[m[1]]) || 1.6; };
    window.Audio = function () {
      const a = { src: '', currentTime: 0, paused: true, dataset: {}, preload: '', onended: null, onerror: null, _t: 0 };
      Object.defineProperty(a, 'duration', { get: () => durOf(a.src) });
      a.play = () => { a.paused = false; clearInterval(a._t); const t0 = performance.now() - a.currentTime * 1000, d = a.duration;
        a._t = setInterval(() => { a.currentTime = (performance.now() - t0) / 1000; if (a.currentTime >= d) { clearInterval(a._t); a.paused = true; a.onended && a.onended(); } }, 40); return Promise.resolve(); };
      a.pause = () => { a.paused = true; clearInterval(a._t); };
      a.load = () => {}; a.addEventListener = () => {}; a.removeEventListener = () => {};
      return a;
    };
  }, DUR);
  await page.goto('http://127.0.0.1:8803/mechanics_5.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.click('#introScreen', { force: true }).catch(() => {});   // 先點封面（本頁沒有 introScreen 之外的遮罩）
  await page.waitForTimeout(1500);
  await page.click('.vx-open');                                           // 打開面板就自動開始播
  await page.waitForTimeout(300);
  await page.click('button.vx-ic[title="開始／繼續"]', { timeout: 1000 }).catch(() => {});

  const seen = {}, started = Date.now(), limit = SMOKE ? SMOKE * 1000 : 25 * 60 * 1000;
  let last = 0, teacherSeen = 0, probed = false, probeReverted = null, pastEnd = 0;
  while (Date.now() - started < limit) {
    const st = await page.evaluate(() => {
      const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
      const top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 0;
      const tabEl = document.querySelector('.tab-btn.active'), tab = tabEl ? tabEl.dataset.tab : null;
      const sub = (typeof CUR_SUB !== 'undefined' && tab) ? CUR_SUB[tab] : null;
      let step = null; const row = document.querySelector('#sv-' + sub + ' .step-row');
      if (row) { const b = row.querySelector('.step-btn.active'); step = b ? Array.from(row.querySelectorAll('.step-btn')).indexOf(b) + 1 : null; }
      const keys = { magde: 'magde', tilt: 'torr', archi: 'archi', cao: 'cao', sinkfloat: 'float', ice: 'ice' }; let lab = null;
      const lk = keys[sub];
      if (window.W5Lab && lk && W5Lab[lk]) { const s = W5Lab[lk]._state(); lab = Object.assign({}, s); }
      const rect = el => el ? el.getBoundingClientRect() : null;
      const cv = document.getElementById('cvs-' + sub), sc = cv && cv.parentElement;
      const labEl = lk && document.getElementById('lab-' + lk);
      const lcv = labEl && (labEl.querySelector('.canvas-wrap')), lres = labEl && labEl.querySelector('.result-box');
      const r1 = rect(sc), r2 = rect(lcv), r3 = rect(lres);
      let u = null;   // 目前這一步已經播了幾秒（W5 學生模式播完會停在該步結尾）
      if (window.W5 && sub && W5.info(sub) && step) { const inf = W5.info(sub); u = W5.progress(sub) * inf.total - inf.bounds[step - 1]; }
      return {
        txt: (document.querySelector('.vx-txt') || {}).textContent || '', tab, sub, step, lab, bubTop: top,
        animTop: r1 ? r1.top : null, animBot: r1 ? r1.bottom : null,
        labTop: r2 ? r2.top : null, labBot: r2 ? r2.bottom : null, resBot: r3 ? r3.bottom : null,
        teacher: document.body.classList.contains('mode-teacher'), mode: window.W5 && W5.mode, u
      };
    });
    const idx = lineNorm.indexOf(norm(st.txt));
    if (idx >= 0) {
      const n = idx + 1;
      if (!seen[n]) {
        seen[n] = { st0: st }; if (n > 1 && SMOKE === 0 && process.env.V) console.log('line', n);
        // SHOTS=資料夾：每句剛開始、與上一句結束前的畫面各存一張（shot_<句號>a.png＝句首；上一句的 b＝下一句出現前最後一刻）
        if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'shot_' + String(n).padStart(3, '0') + 'a.png') }).catch(() => {});
      }
      seen[n].last = st; last = Math.max(last, n);
      if (st.teacher) teacherSeen++;
    } else if (/講解結束/.test(st.txt)) { pastEnd++; }
    if (last >= lines.length && (seen[lines.length] && Date.now() - started > 0) && /講解結束/.test(st.txt)) break;
    if (!probed && last >= 3) {   // 故意硬點「老師講解」：播放器要立刻切回學生操作
      probed = true;
      await page.evaluate(() => document.getElementById('mode-teacher').click());   // 不用 page.click：它會先把頁面捲到按鈕，干擾畫面位置的量測
      await page.waitForTimeout(400);
      probeReverted = await page.evaluate(() => !document.body.classList.contains('mode-teacher'));
    }
    await page.waitForTimeout(100);
  }

  const report = [], viewBad = [], viewPart = [];
  let mismatches = 0;
  for (let n = 1; n <= lines.length; n++) {
    const s = seen[n]; if (!s) { if (!SMOKE) { mismatches++; report.push({ n, problem: '沒有觀察到這一句' }); } continue; }
    const w = lines[n - 1].want, g = s.last;
    if (!okState(w, g)) {
      mismatches++;
      report.push({ n, want: w ? w.tab + '/' + w.sub + '#' + w.step : null, got: g.tab + '/' + g.sub + '#' + g.step + (g.lab ? ' lab=' + JSON.stringify(g.lab) : ''), text: lines[n - 1].text.slice(0, 24) });
    }
    // 畫面在字幕框上方露出多少（動手做看畫布頂～結果框底，其餘看動畫畫布）：少於 50% 算不合格；沒完整露出的另列參考
    if (w && okState(w, g)) {
      const t0 = isLab(w) ? g.labTop : g.animTop, t1 = isLab(w) ? g.labBot : g.animBot;   // 老師 2026-11-26：只看畫布，結果框、按鈕不算
      if (t0 != null && t1 > t0) {
        const shown = Math.max(0, Math.min(t1, g.bubTop) - Math.max(t0, 0)) / (t1 - t0);
        const rec = { n, what: isLab(w) ? 'lab' : w.sub, top: Math.round(t0), bot: Math.round(t1), bubTop: Math.round(g.bubTop), shown: +shown.toFixed(2) };
        if (shown < 0.99) viewBad.push(rec); else if (rec.top < 8) viewPart.push(rec);   // 畫布必須 100% 在字幕框上方（<0.99 就算不合格）
      }
    }
  }
  // 動畫被截斷：這一句之後畫面換到別的分頁／子頁／步驟時，這一步要已經播到最後一段字出現後 0.8 秒
  const cutEarly = [];
  for (let n = 1; n < lines.length; n++) {
    const w = lines[n - 1].want, nx = lines[n].want, s = seen[n];
    if (!w || !s || isLab(w) || STATIC.has(w.sub) || !LASTTXT[w.sub]) continue;
    if (nx && nx.tab === w.tab && nx.sub === w.sub && nx.step === w.step) continue;   // 下一句同一畫面（含「重播同一步」）
    // 下一句若沒有 at、只用 acts 在句中換畫面，這一步還會再播「比例 × 下一句長度」秒
    const nid = lines[n].id, nf = file => DUR[file] || 1.6;
    let extra = 0;
    if (!stage.at[nid] && stage.acts && stage.acts[nid] && stage.acts[nid].length) {
      const it = manifest.items.find(x => x.kind === 'line' && x.id === nid); extra = stage.acts[nid][0][0] * nf(it && it.file);
    }
    const need = LASTTXT[w.sub][w.step - 1] + 0.8, u = s.last.u == null ? null : s.last.u + extra;
    if (u != null && u < need) cutEarly.push({ n, scene: w.sub + '#' + w.step, played: +u.toFixed(1), need });
  }
  const result = { observed: Object.keys(seen).length, lines: lines.length, mismatches, teacherSeen, probeReverted, errors, report, viewBad, viewPart, cutEarly };
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('lines observed:', result.observed, '/', lines.length);
  console.log('mismatches:', mismatches);
  report.slice(0, 60).forEach(r => console.log('  ', JSON.stringify(r)));
  console.log('js errors:', errors.length ? errors : 'none');
  console.log('mode-teacher 出現次數：', teacherSeen, '（硬點老師講解後立刻切回學生：', probeReverted, '）');
  console.log('畫面在字幕框上方畫布沒有 100% 露出的句子數：', viewBad.length, viewBad.map(v => v.n).join(','));
  viewBad.slice(0, 40).forEach(v => console.log('   ', JSON.stringify(v)));
  console.log('（參考）露出 50% 以上但沒有完整露出的句子數：', viewPart.length, viewPart.map(v => v.n + '(' + v.shown + ')').join(','));
  console.log('動畫被截斷（換畫面時最後一段字還沒出現或剛出現）：', cutEarly.length, cutEarly.map(c => c.n + ' ' + c.scene + ' ' + c.played + '/' + c.need).join('；'));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
