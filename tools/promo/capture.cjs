// 宣傳短片逐格拍攝：用「手動時鐘」一格一格推進網頁，再截圖。
// 這個環境沒有顯示卡（軟體繪圖，每格要 1～3 秒），所以不能即時錄影；逐格輸出再合成就不會卡。
//
// 用法（在 repo 根目錄）：
//   node tools/promo/capture.cjs <h|v> <輸出資料夾> [fps=24] [--only=<段落名>]
// 需要 timeline.json（旁白長度，由 build_promo.py 產生）。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const aspect = process.argv[2] || 'h';
const outDir = process.argv[3] || '/tmp/promo_frames_' + aspect;
const FPS = +(process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : 24);
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1] : null;
const tailArg = process.argv.find(a => a.startsWith('--tail='));
const TAIL = tailArg ? +tailArg.split('=')[1] : null; // 只重拍「總結＋結尾」，從第幾格開始
const BASE = process.env.PROMO_BASE || 'http://localhost:8765/';
const VIEW = aspect === 'v' ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
const timeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const DT = 1000 / FPS;
let frameNo = TAIL || 0;
const marks = {};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.clock.install({ time: 0 });
  // 讓 requestAnimationFrame 只在我呼叫 __tick() 時才跑一次（一格只畫一次）
  await page.addInitScript(() => {
    let n = 0, q = [];
    window.requestAnimationFrame = cb => { q.push([++n, cb]); return n; };
    window.cancelAnimationFrame = id => { q = q.filter(x => x[0] !== id); };
    window.__tick = () => { const l = q; q = []; const t = performance.now(); for (const [, cb] of l) { try { cb(t); } catch (e) { console.error(e); } } return l.length; };
  });
  // 時鐘預設會跟著真實時間跑，所以載入一開始就先把它停住，之後只由 runFor 推進
  const tI = Date.now();
  await page.goto(BASE + 'index.html?intro=' + (TAIL ? 0 : 1) + '&voice=0&promo=1', { waitUntil: 'commit' });
  await page.clock.pauseAt(Date.now() - tI + 400);
  await page.waitForFunction(() => document.readyState !== 'loading' && !!document.getElementById('launch'), null, { polling: 200 });

  // 錄影用的疊層：字幕、計數、點擊圈、轉場白閃
  await page.evaluate(() => {
    const css = document.createElement('style');
    css.textContent = `
      #langSwitch, #linkClassic, #hint, #launchSkip, #btnSearch, #narration { display: none !important; }
      #pm { position: fixed; inset: 0; z-index: 99999; pointer-events: none; font-family: "Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif; }
      #pm .cap { position: absolute; left: 50%; bottom: 7%; transform: translateX(-50%); max-width: 88%; text-align: center; color: #fff; font-weight: 800;
        font-size: var(--capfs); line-height: 1.35; padding: .35em .9em; border-radius: 999px; background: rgba(8,24,22,.62); text-shadow: 0 2px 6px rgba(0,0,0,.45); opacity: 0; white-space: nowrap; }
      #pm .tap { position: absolute; width: 90px; height: 90px; margin: -45px 0 0 -45px; border-radius: 50%; border: 6px solid #ffe066; background: rgba(255,224,102,.35); opacity: 0; box-shadow: 0 0 24px rgba(255,224,102,.8); }
      #pm .fx { position: absolute; inset: 0; background: #fff; opacity: 0; }
      #pm .stats { position: absolute; left: 50%; top: 44%; transform: translate(-50%,-50%); display: flex; gap: var(--gap); opacity: 0; }
      #pm .stat { background: rgba(8,24,22,.66); border: 3px solid rgba(255,224,102,.9); border-radius: 22px; padding: .5em .9em; text-align: center; color: #fff; min-width: 4.2em; }
      #pm .stat b { display: block; font-size: var(--bigfs); line-height: 1; color: #ffe066; font-weight: 900; }
      #pm .stat span { font-size: var(--smfs); font-weight: 700; }
      #pm .end { position: absolute; left: 50%; top: 46%; transform: translate(-50%,-50%); text-align: center; color: #fff; opacity: 0; width: max-content; max-width: 92%; padding: .5em 1.1em .6em; border-radius: 28px; background: rgba(8,24,22,.78); border: 3px solid rgba(255,224,102,.9); }
      #pm .end h1 { margin: 0; font-size: var(--titfs); color: #ffe066; text-shadow: 0 4px 16px rgba(0,0,0,.55); letter-spacing: .08em; }
      #pm .end p { margin: .4em 0 0; font-size: var(--urlfs); font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,.6); }
      #pm .tag { position: absolute; left: 50%; top: 16%; transform: translateX(-50%); opacity: 0; text-align: center; color: #fff; font-weight: 800; white-space: nowrap;
        background: rgba(8,24,22,.62); border: 3px solid var(--tagc, #ffe066); border-radius: 22px; padding: .35em .9em; font-size: var(--tagfs); }
      #pm .tag small { display: block; font-size: .62em; font-weight: 600; opacity: .9; }
    `;
    document.head.appendChild(css);
    const v = innerHeight > innerWidth;
    const root = document.createElement('div');
    root.id = 'pm';
    root.style.cssText = v
      ? '--capfs:34px;--bigfs:84px;--smfs:30px;--gap:14px;--titfs:78px;--urlfs:28px;--tagfs:40px'
      : '--capfs:30px;--bigfs:78px;--smfs:26px;--gap:22px;--titfs:84px;--urlfs:28px;--tagfs:34px';
    root.innerHTML = '<div class="tag"></div><div class="stats"></div><div class="end"></div><div class="tap"></div><div class="cap"></div><div class="fx"></div>';
    document.body.appendChild(root);
    window.__pm = {
      cap(t, o = 1) { const e = root.querySelector('.cap'); if (t != null) e.textContent = t; e.style.opacity = o; },
      tag(html, color, o = 1) { const e = root.querySelector('.tag'); if (html != null) e.innerHTML = html; e.style.setProperty('--tagc', color || '#ffe066'); e.style.opacity = o; },
      tap(x, y, p) { // p 0→1：圈圈縮小並按下去
        const e = root.querySelector('.tap');
        e.style.left = x + 'px'; e.style.top = y + 'px';
        e.style.opacity = p <= 0 ? 0 : Math.min(1, p * 4) * (p > 0.85 ? Math.max(0, (1 - p) / 0.15) : 1);
        e.style.transform = `scale(${1.5 - 0.7 * Math.min(1, p / 0.7)})`;
      },
      fx(o) { root.querySelector('.fx').style.opacity = o; },
      stats(items, o) { const e = root.querySelector('.stats'); if (items) e.innerHTML = items.map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join(''); e.style.opacity = o; },
      end(html, o) { const e = root.querySelector('.end'); if (html != null) e.innerHTML = html; e.style.opacity = o; },
    };
  });

  async function step() { // 時鐘前進一格 → 畫一次 → 截圖
    await page.clock.runFor(DT);
    await page.evaluate(() => window.__tick());
    await page.waitForTimeout(30);
    const f = path.join(outDir, String(frameNo).padStart(5, '0') + '.jpg');
    await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
    frameNo++;
    if (frameNo % 24 === 0) console.log('frames', frameNo, 'video sec', (frameNo / FPS).toFixed(1));
  }
  // 不輸出畫面、只讓時間前進（用在載入）
  async function advance(ms) { await page.clock.runFor(ms); await page.evaluate(() => window.__tick()); }
  const frames = sec => Math.round(sec * FPS);
  async function run(sec, fn) { // 跑 sec 秒；fn(u, t) u＝0..1
    const n = frames(sec);
    for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 1, t = i / FPS; if (fn) await fn(u, t); await step(); }
  }
  const E = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const E2 = t => 1 - Math.pow(1 - t, 2.2);
  const ev = (fn, arg) => page.evaluate(fn, arg);

  let introEnd = 0;
  if (!TAIL) {
  // ---------- 段落 0：開場動畫（煙霧、歡迎詞、太空梭飛進星球） ----------
  // 歡迎詞淡入約 1.9 秒；之後 3D 場景才開始建（建的時候時鐘暫停，影片不會卡住）
  await ev(() => window.__pm.cap('歡迎來到伽利略星球！', 1));
  await run(2.0, null);
  const t0 = Date.now();
  while (!(await ev(() => !!(window.__galileo && window.__galileo.scene)))) {
    if (Date.now() - t0 > 180000) throw new Error('scene never ready');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__tick());
  }
  console.log('scene ready after', Date.now() - t0, 'ms');
  // 繼續跑到開場結束
  const tStart = timeline.intro.captionAt;
  let guard = 0;
  while (guard++ < frames(20)) {
    const st = await ev(() => { const s = window.__galileo.scene.debugState(); return { intro: s.intro, launch: !document.getElementById('launch').hidden }; });
    const sec = frameNo / FPS;
    for (const c of timeline.intro.caps) if (sec >= c.t) await ev(t => window.__pm.cap(t, 1), c.text);
    if (!st.intro && !st.launch && sec > 4) break;
    await step();
  }
  console.log('intro done at', (frameNo / FPS).toFixed(1));
  await ev(() => { window.__pm.cap(null, 1); });
  await run(0.9, null);

  // ---------- 段落 1～4：四座館 ----------
  }
  async function hallShot(h) {
    const id = h.id, cs = h.color;
    const segStart = frameNo / FPS;
    marks[id] = segStart;
    const capOn = () => ev(([t, c]) => { window.__pm.cap(t, 1); }, [h.caption]);
    await ev(([h, id]) => { window.__galileo.scene.debugSigns(true); window.__galileo.scene.faceHall(id); window.__pm.tag(`${h.name}<small>${h.sub}</small>`, h.color, 0); }, [h, id]);
    // 1) 星球轉到這一館 0.9s
    await run(0.9, async u => { await ev(([c, t]) => { window.__pm.cap(t, 1); }, [0, h.caption]); });
    // 2) 手指點下去 0.5s
    const pos = await ev(id => window.__galileo.scene.debugScreen('statue', id), id);
    await run(0.5, async u => { await ev(([x, y, p]) => window.__pm.tap(x, y, p), [pos.x, pos.y - 20, u]); });
    await ev(() => window.__pm.tap(0, 0, 0));
    // 3) 飛進館、展開成地圖 1.0s，再停 1.1s
    await ev(([h, id]) => { window.__galileo.scene.flyToHall(id); window.__pm.tag(`${h.name}<small>${h.sub}</small>`, h.color, 1); }, [h, id]);
    await run(2.1, null);
    // 4) 白閃轉場 → 走路視角 2.4s：朝雕像走過去
    await run(0.2, async u => { await ev(o => window.__pm.fx(o), u); });
    await ev(([id, a, html, col]) => { const s = window.__galileo.scene; s.debugSigns(false); s.debugWalk(id, a, 0); window.__pm.tag(html, col, 1); }, [id, h.a0, `${h.name}<small>走到科學家雕像前</small>`, h.color]);
    await run(0.2, async u => { await ev(o => window.__pm.fx(o), 1 - u); });
    await run(2.2, async u => { await ev(([id, a]) => window.__galileo.scene.debugWalk(id, a, 0), [id, h.a0 + (h.a1 - h.a0) * E(u)]); });
    // 5) 科學家卡片
    await ev(id => window.__galileo.ui.showScientist(id), id);
    await page.waitForTimeout(700);
    await run(1.4, null);
    await ev(() => { document.getElementById('sciClose').click(); });
    await ev(() => window.__pm.tag(null, null, 0));
    await run(0.2, null);
    console.log('hall', id, 'seg sec', (frameNo / FPS - segStart).toFixed(1), 'ends at', (frameNo / FPS).toFixed(1));
  }
  if (!TAIL) for (const h of timeline.halls) await hallShot(h);

  if (TAIL) { while (!(await ev(() => !!(window.__galileo && window.__galileo.scene)))) { await page.waitForTimeout(500); await page.evaluate(() => window.__tick()); } await advance(3000); }
  // ---------- 段落 5：34 個單元 ----------
  await ev(() => { const s = window.__galileo.scene; s.debugSigns(true); window.__pm.tag(null, null, 0); window.__pm.cap('四座科學館，三十四個單元，一百三十九堂課。', 1); });
  marks.counts = frameNo / FPS;
  await run(0.6, async u => { await ev(([f]) => window.__galileo.scene.debugPose(0.38, 2.4 + f, 0, 1), [u * 0.3]); await ev(o => window.__pm.fx(o), 1 - u); });
  await run(timeline.counts.sec, async (u, t) => {
    await ev(([f]) => window.__galileo.scene.debugPose(0.38, 2.7 + f, 0, 1), [u * 2.2]);
    const k = Math.min(1, u / 0.7);
    await ev(([a, b, c, o]) => window.__pm.stats([[a, '座科學館'], [b, '個單元'], [c, '堂課']], o), [Math.round(4 * E2(k)), Math.round(34 * E2(k)), Math.round(139 * E2(k)), Math.min(1, u * 6)]);
  });
  // ---------- 段落 6：結尾 ----------
  marks.outro = frameNo / FPS;
  await ev(() => { window.__pm.stats(null, 0); window.__pm.cap('轉動星球，走進展館，用玩的學科學！', 1); });
  await run(timeline.outro.sec, async (u, t) => {
    await ev(([f]) => window.__galileo.scene.debugPose(0.38, 4.9 + f, 0, 1), [u * 1.5]);
    await ev(o => window.__pm.end('<h1>伽利略星球</h1><p>Galileo Planet · 國中自然 34 單元</p><p>flyer19820218.github.io/Physical-Boys</p>', o), Math.min(1, u * 3));
  });
  await run(0.7, async u => { await ev(o => window.__pm.fx(o), u); });
  if (!TAIL) fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ fps: FPS, frames: frameNo, introEnd, aspect, marks }));
  console.log('DONE frames', frameNo);
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
