// galvanic_batteries_4 逐句模擬：開啟「有聲講解」→ 按 ▶ → 依字幕文字對回第幾句 → 讀每句「最後一次觀察」（含後面的＊停）時的分頁、動畫步驟、實驗台狀態，和 lessons/galvanic_batteries_4.json 的 at／acts 期望值比。
// 用法：repo 根目錄 python3 -m http.server 8803 已在執行，再：
//   NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_galvanic_batteries_4.js [輸出 json]
//   環境變數：SMOKE=秒數 只跑前幾秒；SHOTS=目錄 把每個「新到達的動手做畫面」存成截圖。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'tools/voice/lesson_studio/lessons/galvanic_batteries_4.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/galvanic_batteries_4/manifest.json'), 'utf8'));
const stage = JSON.parse(fs.readFileSync(path.join(REPO, 'audio/galvanic_batteries_4/stage.json'), 'utf8'));
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_galv_result.json');
const SMOKE = Number(process.env.SMOKE || 0), SHOTS = process.env.SHOTS || '';
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const lines = manifest.items.filter(i => i.kind === 'line');
const norm = s => String(s || '').replace(/[\s，。、；：？！「」（）,.?!:;"'“”…—\-]/g, '');
const lineNorm = lines.map(l => norm((stage.subs && stage.subs[l.id]) || l.text));
const acts = cfg.acts || {};
function expect(n) {   // 第 n 句「結束時」應有的畫面（句中換畫面都已發生）
  let cur = null;
  for (let k = 1; k <= n; k++) {
    if (cfg.at[String(k)]) cur = { tab: cfg.at[String(k)][0], step: cfg.at[String(k)][2] };
    const ac = acts[String(k)];
    if (ac && ac.length) { const z = ac[ac.length - 1]; cur = { tab: z[1], step: z[3] }; }
  }
  // ＊切頁：該句之前最近的切頁重設為步驟 0（at 之後才有的步驟不會被保留）
  return cur;
}
// 要把「＊切頁」也算進期望值：掃 manifest 的順序
const order = []; let curCut = null, lineNo = 0;
manifest.items.forEach(it => {
  if (it.kind === 'marker') { const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || ''); if (m && cfg.cuts[m[1].trim()]) curCut = { tab: cfg.cuts[m[1].trim()][0], step: 0 }; }
  else if (it.kind === 'line') { lineNo++; if (cfg.at[String(lineNo)]) curCut = { tab: cfg.at[String(lineNo)][0], step: cfg.at[String(lineNo)][2] }; const ac = acts[String(lineNo)]; if (ac && ac.length) { const z = ac[ac.length - 1]; curCut = { tab: z[1], step: z[3] }; } order[lineNo] = curCut; }
});
const ANIM_MAX = { 'tab-history': 10, 'tab-origin': 5, 'tab-redox': 5, 'tab-cell': 5, 'tab-types': 5 };
const KEY = { 'tab-history': 'galvani', 'tab-origin': 'origin', 'tab-redox': 'redox', 'tab-cell': 'cell', 'tab-types': 'types' };

function check(e, s) {   // e＝{tab,step}；s＝頁面快照
  if (!e) return true;
  if (s.tab !== e.tab) return false;
  const n = e.step, t = e.tab;
  if (n === 0) return true;
  if (n <= ANIM_MAX[t]) {
    if (t === 'tab-history') return n <= 5 ? (s.sub === 'galvani' && s.galvani && s.galvani.step === n - 1) : (s.sub === 'volta' && s.volta && s.volta.step === n - 6);
    return s.anim && s.anim.step === n - 1;
  }
  const L = s.lab; if (!L) return false;
  if (t === 'tab-history') {
    if (n === 11) return s.sub === 'galvani' && L.mode === 'galvani' && !L.galvani.tip && L.galvani.plate === 'fe' && L.galvani.knife === 'cu';
    if (n === 12) return L.mode === 'galvani' && L.galvani.tip && L.galvani.link && L.galvani.knife === 'cu' && L.galvani.plate === 'fe';
    if (n === 13) return L.mode === 'galvani' && L.galvani.plate === 'cu' && L.galvani.knife === 'cu' && L.galvani.tip && !L.galvani.twitch;
    if (n === 14) return s.sub === 'volta' && L.mode === 'volta' && L.volta.sets === 1;
    if (n === 15) return s.sub === 'volta' && L.mode === 'volta' && L.volta.sets === 2;
    if (n === 16) return s.sub === 'volta' && L.mode === 'volta' && L.volta.sets === 3;
    if (n === 17) return s.sub === 'volta' && L.mode === 'volta' && L.volta.sets === 3 && L.volta.zoom;
  }
  if (t === 'tab-origin') return { 6: L.right === 'zn' && L.wire && L.bridge, 7: L.right === 'cu' && L.wire && L.bridge, 8: L.right === 'cu' && !L.bridge && L.wire, 9: L.right === 'cu' && L.bridge && L.wire, 10: L.right === 'cu' && L.bridge && !L.wire }[n];
  if (t === 'tab-redox') return { 6: L.sent === 0 && L.recv === 0, 7: L.sent === 1 && L.recv === 0, 8: L.sent === 1 && L.recv === 1, 9: L.sent === 2 && L.recv === 1, 10: L.sent === 2 && L.recv === 2 }[n];
  if (t === 'tab-cell') {
    const P = L.parts || {};
    return { 6: !P.cupL && !P.cupR, 7: P.cupL && P.solL && P.elL && !P.cupR, 8: P.cupR && P.solR && P.elR && !P.meter, 9: P.meter && P.wireL && P.wireR && !P.bridge, 10: P.bridge && !P.wirePulled, 11: P.bridge && (L.zincW < 38 || L.observing || (L.wear && L.wear[0] > 0.5)), 12: P.cupL && !P.bridge && L.stage >= 4, 13: P.bridge && !P.wirePulled, 14: P.bridge && P.wirePulled }[n];
  }
  if (t === 'tab-types') return { 6: L.battery === 'carbon' && L.mode === 'idle', 7: L.battery === 'carbon' && L.mode === 'dis', 8: L.battery === 'carbon' && L.denyCount >= 1, 9: L.battery === 'carbon' && L.mode === 'force', 10: L.battery === 'lithium', 11: L.battery === 'lithium' && L.mode === 'dis', 12: L.battery === 'lithium' && L.mode === 'chg' }[n];
  return false;
}
const SNAP = () => {
  const act = document.querySelector('.tab-content.active'), tab = act && act.id;
  const key = { 'tab-history': 'galvani', 'tab-origin': 'origin', 'tab-redox': 'redox', 'tab-cell': 'cell', 'tab-types': 'types' }[tab];
  const lk = { 'tab-history': 'history', 'tab-origin': 'origin', 'tab-redox': 'redox', 'tab-cell': 'cell', 'tab-types': 'types' }[tab];
  const sa = document.querySelector('[data-gb-sub].active');
  const out = { tab, sub: sa ? sa.getAttribute('data-gb-sub') : null };
  try { out.galvani = window.GbAnim.galvani._state(); out.volta = window.GbAnim.volta._state(); if (key !== 'galvani') out.anim = window.GbAnim[key]._state(); else out.anim = out.galvani; } catch (e) {}
  try { const l = window.GbLab[lk]._state(); delete l.targets; out.lab = l; } catch (e) {}
  const bub = document.querySelector('.vx-bub'), pin = document.querySelector('.vx-pin.show');
  out.top = bub ? (pin ? Math.min(bub.getBoundingClientRect().top, pin.getBoundingClientRect().top) : bub.getBoundingClientRect().top) : 0;
  out.teacher = document.body.classList.contains('mode-teacher');
  out.sub0 = (document.querySelector('.vx-txt') || {}).textContent || '';
  return out;
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_TUNNEL/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('http://127.0.0.1:8803/galvanic_batteries_4.html?r=' + Date.now(), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.click('.vx-open');
  await page.waitForTimeout(800);
  const started = Date.now(), limit = SMOKE ? SMOKE * 1000 : 30 * 60 * 1000;
  const last = {}, firstOk = {}, shot = {};
  let cur = -1, teacher = false, idleSince = 0;
  await page.click('.vx-ctl button[title="開始／繼續"]').catch(() => {});
  while (Date.now() - started < limit) {
    const s = await page.evaluate(SNAP);
    const n = lineNorm.findIndex(x => x && norm(s.sub0) === x);
    if (s.teacher) teacher = true;
    if (n >= 0) {
      cur = n + 1; last[cur] = s;
      const e = order[cur];
      if (e && !firstOk[cur] && check(e, s)) {
        firstOk[cur] = 1;
        const key = e.tab + ':' + e.step;
        if (SHOTS && e.step >= 6 && !shot[key]) { shot[key] = 1; await page.screenshot({ path: path.join(SHOTS, `${e.tab}_${String(e.step).padStart(2, '0')}_line${cur}.png`) }).catch(() => {}); }
      }
    }
    if (/講解結束/.test(s.sub0)) break;
    await page.waitForTimeout(200);
  }
  const bad = [], res = [];
  for (let k = 1; k <= lines.length; k++) {
    const e = order[k], s = last[k];
    if (!s) { res.push({ n: k, seen: false }); continue; }
    const ok = check(e, s);
    res.push({ n: k, ok, exp: e, tab: s.tab, sub: s.sub });
    if (!ok) bad.push({ n: k, exp: e, tab: s.tab, sub: s.sub, anim: s.anim && s.anim.step, lab: s.lab && JSON.stringify(s.lab).slice(0, 260) });
  }
  const unseen = res.filter(r => r.seen === false).map(r => r.n);
  console.log('lines', lines.length, 'seen', lines.length - unseen.length, 'unseen', unseen.join(','));
  console.log('mismatches', bad.length); bad.forEach(b => console.log('  line', b.n, 'want', JSON.stringify(b.exp), 'got tab', b.tab, 'sub', b.sub, 'animStep', b.anim, b.lab));
  console.log('js errors', errs.length ? errs.join('\n') : 'none');
  console.log('mode-teacher during play', teacher ? 'YES' : 0);
  fs.writeFileSync(OUT, JSON.stringify({ bad, unseen, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
