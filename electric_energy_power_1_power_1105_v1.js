/* electric_energy_power_1_power_1105_v1.js — 「電功率」分頁動畫（#powerAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.power = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'power'。畫布不綁任何事件；唯一控制是 #steps-power 裡的 5 個步驟鈕；結果框 #powerAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 教學符號 ────────────────────────────────────────────────────────
 *   能量＝黃色小方塊，全程固定「1 格＝40 J」（圖例寫明）：40 W 燈泡每秒 1 格、800 W 吹風機每秒 20 格（剛好一列）；
 *   10 s → 10 格（400 J）對 200 格（8000 J）；燈泡 200 s → 200 格（8000 J）。計數器每列 20 格＝800 J。
 *   藍球＝電子，從電源負極出發；方塊沿著同一方向（負極 → 下導線 → 元件）走進元件，在元件中心被轉換，
 *   再飛進下方「已使用電能」計數格。吹風機的電子比燈泡密、跑得快（電流較大，只做定性）。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   第 1～4 步：左右兩個面板（x 25～475／525～975，y 82～522）：上方標題、左上小迴路（電源＋元件在右側導線正中央）、
 *   右上讀數（t、已使用電能 E）、下方 20 欄計數格（由下往上堆）、最底一行小結。
 *   第 5 步：左邊放大的吹風機迴路（標 110 V、I = 7.27 A）＋計數格，右邊 P = E／t → IV 的推論。
 *   每個裝置有自己的「模擬時鐘」c(tl)＝clamp((tl−T0)·speed, 0, Cend)；第 i 格在 c＝(i+1)/每秒格數 時進入元件被轉換。
 *   電子只在「通電」期間 [T0−FA, 時鐘停] 移動；之後斷電、元件熄。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 每秒多少  8 s  慢動作 ×0.25，兩台各跑 1 s：燈泡 1 格（40 J）、吹風機 20 格（800 J）
 *   2 同樣 10 秒 9 s  兩台都跑 10 s（快轉）：400 J 對 8000 J
 *   3 功率大    8 s  停在 10 s 的結果，逐秒標亮「1 格 vs 1 列 20 格」→「×20」「800 ÷ 40 = 20」
 *   4 時間不同  9 s  燈泡 200 s、吹風機 10 s（都快轉）同時填滿 200 格＝8000 J，中間「=」
 *   5 P = IV    9 s  吹風機接 110 V、I = 7.27 A，跑 6 s 每秒一列 800 J；P = E／t、每 1 C 帶 110 J、每秒 7.27 C、P = IV ≈ 800 W
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–40px，Noto Sans TC 900；寫字前一律 measureText（fitText 最小 22）。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', current: '#ff4d4d', energy: '#fde047', panel: '#123029'
  };
  const TAU = Math.PI * 2;
  const J_PER = 40;            // 1 格＝40 J
  const FA = 0.9, FB = 0.5;    // 方塊：沿導線走進元件的時間、從元件飛到計數格的時間（畫面秒）

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const mod = (a, n) => ((a % n) + n) % n;
  const appear = (tl, t0) => clamp((tl - t0) / 0.4, 0, 1);

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = u; } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function fitSize(ctx, s, maxW, want) {
    for (let z = want; z >= 22; z -= 2) if (textW(ctx, s, z) <= maxW) return z;
    return 22;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function fitText(ctx, s, x, y, color, want, maxW, align, alpha) {
    if (alpha !== undefined && alpha <= 0) return;
    text(ctx, s, x, y, color, fitSize(ctx, s, maxW, want), align, alpha);
  }

  // ───────── 迴路幾何 ─────────
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function atPoly(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y };
  }
  // 一個小迴路：電源在左側直立導線（+ 上、− 下），元件在右側直立導線正中央。
  function makeRig(o) {
    const r = Object.assign({}, o);
    r.MID = (r.TOP + r.BOT) / 2;
    r.pinT = r.MID - r.batH / 2; r.pinB = r.MID + r.batH / 2;
    r.devT = r.MID - r.R - 8 * r.sc; r.devB = r.MID + r.R + 8 * r.sc;
    // 電子路徑：從負極接腳出發 → 下 → 右 → 上（穿過元件）→ 左 → 回正極接腳；再穿過電源內部回到負極
    r.P = [{ x: r.LX, y: r.pinB }, { x: r.LX, y: r.BOT }, { x: r.RX, y: r.BOT }, { x: r.RX, y: r.devB },
      { x: r.RX, y: r.devT }, { x: r.RX, y: r.TOP }, { x: r.LX, y: r.TOP }, { x: r.LX, y: r.pinT }];
    r.Lpath = polyLen(r.P); r.Lc = r.Lpath + r.batH;
    r.sDevC = (r.BOT - r.pinB) + (r.RX - r.LX) + (r.BOT - r.MID);     // 元件中心在路徑上的位置
    return r;
  }
  function posAt(r, s) {
    const sm = mod(s, r.Lc);
    if (sm <= r.Lpath) return Object.assign(atPoly(r.P, sm), { sm, inBat: false });
    return { x: r.LX, y: r.pinT + (sm - r.Lpath), sm, inBat: true };
  }
  function normalAt(r, s) {   // 迴路內側法線（前後各取 18px 平滑）
    const a = atPoly(r.P, clamp(s - 18, 0, r.Lpath)), b = atPoly(r.P, clamp(s + 18, 0, r.Lpath));
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    return { x: dy, y: -dx };
  }

  const PANEL = [
    { cx: 250, kind: 'bulb', P: 40, name: ['40 W 燈泡', '40 W bulb'], eGap: 36, eV: 30 },
    { cx: 750, kind: 'dryer', P: 800, name: ['800 W 吹風機', '800 W hair dryer'], eGap: 22, eV: 90 }
  ];
  PANEL.forEach(p => {
    p.rig = makeRig({ LX: p.cx - 195, RX: p.cx - 75, TOP: 145, BOT: 300, batW: 36, batH: 80, R: 26, sc: 1 });
    p.grid = { x0: p.cx - 140 + 7, y0: 471, pitch: 14, size: 11, cols: 20 };
    p.rx = p.cx + 120;           // 讀數欄中線
  });
  const RIG5 = makeRig({ LX: 120, RX: 320, TOP: 130, BOT: 330, batW: 44, batH: 100, R: 34, sc: 1.3 });
  const GRID5 = { x0: 220 - 140 + 7, y0: 470, pitch: 14, size: 11, cols: 20 };
  const DRYER5 = { kind: 'dryer', P: 800, eGap: 22, eV: 90, rig: RIG5, grid: GRID5 };

  // ───────── 步驟 ─────────
  // run：每個裝置的時鐘 { T0, speed, Cend }；c(tl)＝clamp((tl−T0)·speed, 0, Cend)
  const STEPS = [
    { key: 'sec', dur: 8, b: ['每秒多少', 'Per second'], tag: ['慢動作', 'Slow motion'],
      run: [{ T0: 1.3, speed: 0.25, Cend: 1 }, { T0: 1.3, speed: 0.25, Cend: 1 }],
      foot: [['40 W＝每秒 40 J', '40 W = 40 J each second'], ['800 W＝每秒 800 J', '800 W = 800 J each second']], footT: 5.9,
      cap: ['功率＝每秒轉換多少能量', 'Power = energy transformed each second'],
      res: ['功率是每秒轉換多少能量：40 W＝每秒 40 J；800 W＝每秒 800 J。',
        'Power is energy transformed per second: 40 W = 40 J each second; 800 W = 800 J each second.'] },
    { key: 'ten', dur: 9, b: ['同樣 10 秒', 'Same 10 s'], tag: ['快轉', 'Fast-forward'],
      run: [{ T0: 1.0, speed: 10 / 6.4, Cend: 10 }, { T0: 1.0, speed: 10 / 6.4, Cend: 10 }],
      foot: [['10 秒共 400 J', '400 J in 10 s'], ['10 秒共 8000 J', '8000 J in 10 s']], footT: 7.9,
      cap: ['同樣 10 秒：400 J 對 8000 J', 'Same 10 s: 400 J vs 8000 J'],
      res: ['相同 10 秒：40 W 燈泡使用 400 J；800 W 吹風機使用 8000 J。',
        'In the same 10 s: the 40 W bulb uses 400 J; the 800 W dryer uses 8000 J.'] },
    { key: 'x20', dur: 8, b: ['功率大', 'High power'], tag: null,
      run: [{ T0: -100, speed: 1, Cend: 10 }, { T0: -100, speed: 1, Cend: 10 }],
      foot: [['每秒 40 J', '40 J each second'], ['每秒 800 J', '800 J each second']], footT: 6.0,
      cap: ['吹風機每秒用的能量是燈泡的 20 倍', 'Each second the dryer uses 20× as much energy as the bulb'],
      res: ['功率大，代表每秒使用的電能多（這裡是 20 倍）。', 'High power means more energy used per second (20 times here).'] },
    { key: 'time', dur: 9, b: ['時間不同', 'Different time'], tag: ['快轉', 'Fast-forward'],
      run: [{ T0: 1.0, speed: 200 / 6.6, Cend: 200 }, { T0: 1.0, speed: 10 / 6.6, Cend: 10 }],
      foot: [['開 200 秒：8000 J', '200 s: 8000 J'], ['開 10 秒：8000 J', '10 s: 8000 J']], footT: 7.9,
      cap: ['燈泡 200 秒和吹風機 10 秒用電一樣多', 'Bulb 200 s and dryer 10 s use the same energy'],
      res: ['燈泡開 200 秒用的總電能，和吹風機開 10 秒一樣多；比較總電能必須考慮時間。',
        'The bulb running 200 s uses as much total energy as the dryer running 10 s; time must be considered when comparing total energy.'] },
    { key: 'piv', dur: 9, b: ['P = IV', 'P = IV'], tag: null,
      run: [{ T0: 1.0, speed: 1, Cend: 6 }],
      cap: ['P = E／t = IV', 'P = E/t = IV'],
      res: ['P = E／t = IV：每秒轉換的能量，也等於電壓乘電流。', 'P = E/t = IV: the energy transformed per second also equals voltage times current.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 時鐘與能量方塊（全是 tl 的解析式） ─────────
  const clockOf = (run, tl) => clamp((tl - run.T0) * run.speed, 0, run.Cend);
  const rateOf = dev => dev.P / J_PER;                         // 每「模擬秒」幾格
  const nTotal = (dev, run) => Math.round(rateOf(dev) * run.Cend);
  const tauOf = (dev, run, i) => run.T0 + (i + 1) / rateOf(dev) / run.speed;   // 第 i 格進入元件中心的畫面時刻
  const tOff = run => run.T0 + run.Cend / run.speed;          // 時鐘停（斷電）
  const tOn = run => run.T0 - FA;                             // 通電（第一格從負極出發）
  function converted(dev, run, tl) {
    if (tl < run.T0) return 0;
    return clamp(Math.floor(rateOf(dev) * clockOf(run, tl) + 1e-6), 0, nTotal(dev, run));
  }
  function slotXY(g, i) { return { x: g.x0 + (i % g.cols) * g.pitch, y: g.y0 - Math.floor(i / g.cols) * g.pitch }; }

  // ───────── 繪圖小件 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function wirePath(ctx, pts, w) {
    ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function square(ctx, x, y, alpha, size) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 8; ctx.fillStyle = K.energy;
    rrect(ctx, x - size / 2, y - size / 2, size, size, 2); ctx.fill(); ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function drawWires(ctx, r) {
    const w = 4 * Math.min(r.sc, 1.2);
    wirePath(ctx, [{ x: r.LX, y: r.pinB }, { x: r.LX, y: r.BOT }, { x: r.RX, y: r.BOT }, { x: r.RX, y: r.devB }], w);
    wirePath(ctx, [{ x: r.RX, y: r.devT }, { x: r.RX, y: r.TOP }, { x: r.LX, y: r.TOP }, { x: r.LX, y: r.pinT }], w);
  }
  function drawSource(ctx, r, glow) {
    const x = r.LX - r.batW / 2, y = r.pinT;
    if (glow > 0) {
      ctx.save(); ctx.globalAlpha = 0.5 * glow; ctx.shadowColor = K.energy; ctx.shadowBlur = 18;
      ctx.strokeStyle = K.energy; ctx.lineWidth = 3; rrect(ctx, x - 4, y - 4, r.batW + 8, r.batH + 8, 10); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = '#17392f'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x, y, r.batW, r.batH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K.pos; ctx.fillRect(x + 7, y + 7, r.batW - 14, 6);
    ctx.fillStyle = K.electron; ctx.fillRect(x + 7, y + r.batH - 13, r.batW - 14, 6);
    ctx.fillStyle = K.wire; [r.pinT, r.pinB].forEach(py => { ctx.beginPath(); ctx.arc(r.LX, py, 4.5, 0, TAU); ctx.fill(); });
    ctx.restore();
    text(ctx, '+', r.LX, y + r.batH * 0.32, K.pos, 24);
    text(ctx, '−', r.LX, y + r.batH * 0.68, K.electron, 24);
  }
  function leads(ctx, r) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r.RX, r.devB); ctx.lineTo(r.RX, r.MID + r.R); ctx.moveTo(r.RX, r.devT); ctx.lineTo(r.RX, r.MID - r.R); ctx.stroke();
    ctx.fillStyle = K.wire; [r.devT, r.devB].forEach(py => { ctx.beginPath(); ctx.arc(r.RX, py, 4.5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function drawBulb(ctx, r, g) {
    const cx = r.RX, cy = r.MID, R = r.R;
    if (g > 0.01) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.3);
      gr.addColorStop(0, `rgba(255,244,190,${0.55 * g})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 2.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,170,${0.85 * g})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + Math.PI / 8, r0 = R + 8, r1 = R + 8 + 11 * g;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    leads(ctx, r);
    ctx.save();
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.fillStyle = g > 0.01 ? `rgb(${Math.round(lerp(22, 92, g))},${Math.round(lerp(58, 84, g))},${Math.round(lerp(49, 40, g))})` : '#163a31';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9d3cf'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + R); ctx.lineTo(cx, cy + R * 0.45); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy - R * 0.45); ctx.stroke();
    ctx.strokeStyle = g > 0.01 ? `rgb(${Math.round(lerp(150, 255, g))},${Math.round(lerp(96, 246, g))},${Math.round(lerp(60, 200, g))})` : '#8a5a36';
    ctx.lineWidth = 3; if (g > 0.01) { ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 16 * g; }
    ctx.beginPath();
    const n = 8, y0 = cy + R * 0.45, y1 = cy - R * 0.45;
    for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), x = cx + (i === 0 || i === n ? 0 : (i % 2 ? -1 : 1) * R * 0.28); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  // 吹風機：圓形機身（內有電熱絲）＋右側出風口＋熱風波紋（橘／粉紅，不用藍色）
  function drawDryer(ctx, r, g, tl) {
    const cx = r.RX, cy = r.MID, R = r.R, s = r.sc;
    if (g > 0.01) {   // 熱風
      ctx.save(); ctx.lineWidth = 3; ctx.lineCap = 'round';
      [-11, 0, 11].forEach((dy, k) => {
        const x0 = cx + R + 30 * s, len = 26 * s, ph = tl * 9 + k * 1.3;
        ctx.strokeStyle = k === 1 ? `rgba(244,114,182,${0.9 * g})` : `rgba(251,146,60,${0.9 * g})`;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) { const x = x0 + len * i / 12, y = cy + dy * s + Math.sin(ph - i * 0.9) * 3.2 * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
      ctx.restore();
    }
    leads(ctx, r);
    ctx.save();
    // 出風口
    ctx.fillStyle = '#1d4339'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx + R - 6 * s, cy - 12 * s, 32 * s, 24 * s, 4); ctx.fill(); ctx.stroke();
    // 機身
    ctx.fillStyle = g > 0.01 ? `rgb(${Math.round(lerp(22, 70, g))},${Math.round(lerp(58, 52, g))},${Math.round(lerp(49, 40, g))})` : '#163a31';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    // 電熱絲
    ctx.strokeStyle = g > 0.01 ? `rgb(${Math.round(lerp(150, 255, g))},${Math.round(lerp(96, 140, g))},${Math.round(lerp(60, 60, g))})` : '#8a5a36';
    ctx.lineWidth = 3; if (g > 0.01) { ctx.shadowColor = K.orange; ctx.shadowBlur = 16 * g; }
    ctx.beginPath();
    const n = 8, y0 = cy + R * 0.55, y1 = cy - R * 0.55;
    ctx.moveTo(cx, cy + R);
    for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), x = cx + (i === 0 || i === n ? 0 : (i % 2 ? -1 : 1) * R * 0.34); ctx.lineTo(x, y); }
    ctx.lineTo(cx, cy - R);
    ctx.stroke(); ctx.restore();
  }

  // 一個裝置的整套：導線、電子、方塊、元件、計數格。layer 依序呼叫：'under'（導線＋電子＋線上方塊）→ 'comp'（元件）→ 'over'（飛出的方塊＋計數格）
  function devG(dev, run, tl) {
    if (tl < run.T0 || tl > tOff(run) + 0.05) return 0;
    const n = converted(dev, run, tl), k = clamp((tl - tauOf(dev, run, 0) + 0.25) / 0.5, 0, 1);
    return n > 0 || k > 0 ? 0.85 * Math.max(k, n > 0 ? 1 : 0) : 0;
  }
  function drawDevice(ctx, dev, run, tl, layer, opt) {
    const r = dev.rig, g = dev.grid, N = nTotal(dev, run);
    const on0 = tOn(run), off = tOff(run);
    if (layer === 'under') {
      drawWires(ctx, r);
      // 電子：通電期間沿迴路移動（負極出發 → 經元件 → 回正極）
      const ph = dev.eV * (clamp(tl, on0, off) - on0);
      const n = Math.floor(r.Lc / dev.eGap), gap = r.Lc / n;
      for (let k = 0; k < n; k++) {
        const p = posAt(r, ph + k * gap + 8);
        if (p.inBat) continue;
        if (Math.abs(p.x - r.RX) < 1 && p.y > r.MID - r.R - 4 && p.y < r.MID + r.R + 4) continue;
        ball(ctx, p.x, p.y, 5.5 * Math.min(r.sc, 1.15), 1);
      }
      // 線上的能量方塊（與電子同方向：負極 → 下導線 → 元件中心）
      for (let i = 0; i < N; i++) {
        const tau = tauOf(dev, run, i);
        if (tl < tau - FA || tl >= tau) continue;
        const k = (tl - tau + FA) / FA, s = k * r.sDevC, p = atPoly(r.P, s), nn = normalAt(r, s);
        const off2 = 13 * r.sc * clamp((r.sDevC - s) / 40, 0, 1);
        square(ctx, p.x + nn.x * off2, p.y + nn.y * off2, clamp(k * 5, 0, 1), 9 * r.sc);
      }
    } else if (layer === 'comp') {
      const gl = opt && opt.dark ? 0 : devG(dev, run, tl);
      drawSource(ctx, r, gl > 0 ? 0.6 : 0);
      if (dev.kind === 'bulb') drawBulb(ctx, r, gl); else drawDryer(ctx, r, gl, tl);
    } else {
      // 地板線
      const gw = g.cols * g.pitch;
      ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(g.x0 - g.pitch / 2 - 4, g.y0 + g.pitch / 2 + 3); ctx.lineTo(g.x0 - g.pitch / 2 + gw + 4, g.y0 + g.pitch / 2 + 3); ctx.stroke(); ctx.restore();
      const dim = opt && opt.dim ? opt.dim : null;
      for (let i = 0; i < N; i++) {
        const tau = tauOf(dev, run, i);
        if (tl < tau) break;
        const q = slotXY(g, i), k = ease((tl - tau) / FB);
        const x = lerp(r.RX, q.x, k), y = lerp(r.MID, q.y, k);
        const a = dim ? dim(i) : 1;
        square(ctx, x, y, clamp(k * 4, 0, 1) * a, g.size * lerp(0.7, 1, k));
      }
    }
  }

  // 面板外框、標題、讀數
  function panelFrame(ctx, p, tl) {
    ctx.save(); ctx.fillStyle = 'rgba(18,48,41,0.55)'; ctx.strokeStyle = 'rgba(242,236,217,0.28)'; ctx.lineWidth = 2;
    rrect(ctx, p.cx - 225, 82, 450, 440, 16); ctx.fill(); ctx.stroke(); ctx.restore();
    fitText(ctx, tr(p.name[0], p.name[1]), p.cx, 112, K.white, 28, 420, 'center');
  }
  function fmtClock(run, c) { return run.Cend > 20 ? String(Math.floor(c + 1e-6)) : (Math.floor(c * 10 + 1e-6) / 10).toFixed(1); }
  function readouts(ctx, p, run, st, tl) {
    const c = clockOf(run, tl), on = tl >= run.T0;
    fitText(ctx, `t = ${fmtClock(run, c)} s`, p.rx, 152, on ? K.white : K.muted, 30, 200, 'center');
    if (st.tag) {
      const a = tl >= tOn(run) && tl <= tOff(run) + 0.3 ? 1 : 0.45;
      fitText(ctx, tr(st.tag[0], st.tag[1]), p.rx, 188, K.cyan, 22, 200, 'center', a);
    }
    fitText(ctx, tr('已使用電能', 'Energy used'), p.rx, 222, K.muted, 22, 200, 'center');
    const e = converted(p, run, tl) * J_PER;
    fitText(ctx, `E = ${e} J`, p.rx, 258, K.yellow, 32, 200, 'center');
  }

  // ───────── 各步繪製 ─────────
  function drawPair(ctx, st, tl) {
    PANEL.forEach((p, k) => panelFrame(ctx, p, tl));
    const dark = st.key === 'x20';
    PANEL.forEach((p, k) => drawDevice(ctx, p, st.run[k], tl, 'under'));
    PANEL.forEach((p, k) => drawDevice(ctx, p, st.run[k], tl, 'comp', { dark }));
    let dims = [null, null];
    if (st.key === 'x20') {
      const hk = highlightSec(tl);
      if (hk >= 0) dims = [i => i === hk ? 1 : 0.3, i => Math.floor(i / 20) === hk ? 1 : 0.3];
    }
    PANEL.forEach((p, k) => drawDevice(ctx, p, st.run[k], tl, 'over', { dim: dims[k] }));
    PANEL.forEach((p, k) => readouts(ctx, p, st.run[k], st, tl));
    if (st.key === 'x20') drawX20(ctx, tl);
    if (st.key === 'sec') drawSecMark(ctx, 0, appear(tl, 5.6));
    if (st.key === 'time') drawEqual(ctx, tl);
    if (st.foot) PANEL.forEach((p, k) => fitText(ctx, tr(st.foot[k][0], st.foot[k][1]), p.cx, 504, k ? K.orange : K.yellow, 24, 420, 'center', appear(tl, st.footT)));
  }
  // 第 3 步：逐秒標亮（1.0～5.5 s 掃過第 1～10 秒），之後停在第 1 秒
  function highlightSec(tl) {
    if (tl < 1.0) return -1;
    if (tl < 5.5) return clamp(Math.floor((tl - 1.0) / 0.45), 0, 9);
    return 0;
  }
  function glowBox(ctx, x, y, w, h, color, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = 12;
    rrect(ctx, x, y, w, h, 4); ctx.stroke(); ctx.restore();
  }
  function pill(ctx, x, y, w, h, color, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K.bg; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawX20(ctx, tl) {
    const hk = highlightSec(tl);
    if (hk >= 0) drawSecMark(ctx, hk, appear(tl, 1.0));
    const a2 = appear(tl, 5.6);
    if (a2 > 0) {
      const s = '×20', w = textW(ctx, s, 40) + 30;
      pill(ctx, 500, 392, w, 54, K.pink, a2);
      text(ctx, s, 500, 392, K.pink, 40, 'center', a2);
    }
    const a3 = appear(tl, 6.2);
    if (a3 > 0) {
      const s = '800 ÷ 40 = 20', z = fitSize(ctx, s, 200, 24), w = textW(ctx, s, z) + 24;
      pill(ctx, 500, 446, w, 38, K.pink, a3);
      text(ctx, s, 500, 446, K.white, z, 'center', a3);
    }
  }
  // 標出「第 hk+1 秒」：燈泡的 1 格、吹風機的 1 列（20 格）
  function drawSecMark(ctx, hk, a) {
    if (a <= 0) return;
    {
      const gb = PANEL[0].grid, gd = PANEL[1].grid;
      const qb = slotXY(gb, hk), half = gb.pitch / 2 + 1;
      glowBox(ctx, qb.x - half, qb.y - half, 2 * half, 2 * half, K.pink, a);
      const yd = gd.y0 - hk * gd.pitch;
      glowBox(ctx, gd.x0 - half, yd - half, gd.cols * gd.pitch + 2, 2 * half, K.pink, a);
      const lab = tr('1 秒', '1 s');
      text(ctx, lab, qb.x, qb.y - 24, K.pink, 22, 'center', a);
      text(ctx, lab, gd.x0 + gd.cols * gd.pitch + 6, yd, K.pink, 22, 'left', a);
    }
  }
  function drawEqual(ctx, tl) {
    const a = appear(tl, 8.1);
    if (a <= 0) return;
    pill(ctx, 500, 410, 64, 64, K.green, a);
    text(ctx, '=', 500, 408, K.green, 44, 'center', a);
  }

  // 第 5 步：P = E／t = IV
  function drawPIV(ctx, st, tl) {
    const run = st.run[0], r = RIG5, dev = DRYER5;
    drawDevice(ctx, dev, run, tl, 'under');
    drawDevice(ctx, dev, run, tl, 'comp');
    drawDevice(ctx, dev, run, tl, 'over');
    fitText(ctx, '110 V', r.LX - r.batW / 2 - 10, r.MID, K.cyan, 28, r.LX - r.batW / 2 - 18, 'right');
    fitText(ctx, 'I = 7.27 A', (r.LX + r.RX) / 2, r.TOP - 30, K.current, 26, 260, 'center');
    const c = clockOf(run, tl), e = converted(dev, run, tl) * J_PER;
    // 讀數放在計數格下方（放上方會被飛進計數格的方塊劃過）
    fitText(ctx, `t = ${(Math.floor(c * 10 + 1e-6) / 10).toFixed(1)} s`, 130, 508, tl >= run.T0 ? K.white : K.muted, 28, 150, 'center');
    fitText(ctx, `E = ${e} J`, 310, 508, K.yellow, 28, 200, 'center');
    // 右欄：推論
    const X = 720, MW = 480;
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.22)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(462, 90); ctx.lineTo(462, 500); ctx.stroke(); ctx.restore();
    fitText(ctx, tr('P = E／t', 'P = E/t'), X, 118, K.green, 38, MW, 'center', appear(tl, 0.4));
    fitText(ctx, tr('每秒 800 J → P = 800 W', '800 J each second → P = 800 W'), X, 176, K.yellow, 26, MW, 'center', appear(tl, run.T0 + 1 / run.speed + 0.5));
    fitText(ctx, tr('110 V：每 1 C 帶 110 J', '110 V: each 1 C carries 110 J'), X, 250, K.cyan, 26, MW, 'center', appear(tl, 3.4));
    fitText(ctx, tr('7.27 A：每秒通過 7.27 C', '7.27 A: 7.27 C pass each second'), X, 300, K.current, 26, MW, 'center', appear(tl, 4.4));
    fitText(ctx, tr('每秒 7.27 × 110 ≈ 800 J', '7.27 × 110 ≈ 800 J each second'), X, 350, K.yellow, 26, MW, 'center', appear(tl, 5.4));
    const a = appear(tl, 7.2);
    if (a > 0) {
      const s = 'P = IV ≈ 800 W', z = fitSize(ctx, s, MW - 40, 36), w = textW(ctx, s, z) + 48;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.green; ctx.lineWidth = 3; ctx.shadowColor = K.green; ctx.shadowBlur = 14;
      rrect(ctx, X - w / 2, 428 - 32, w, 64, 12); ctx.stroke(); ctx.restore();
      text(ctx, s, X, 428, K.green, z, 'center', a);
    }
  }

  // ───────── 圖例、說明 ─────────
  function drawLegend(ctx) {
    const items = [[tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −'), 'e'],
      [tr('黃方塊＝能量，1 格＝40 J（教學符號）', 'Yellow square = 40 J of energy (symbol)'), 's']];
    const z = 22, gapIcon = 26, gapItem = 40, maxW = W - 60;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [560] : [546, 578];
    rows.forEach((row, ri) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[ri];
        if (kind === 'e') ball(ctx, x + 8, y, 7, 1); else square(ctx, x + 8, y, 1, 12);
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    const y0 = ls.length > 1 ? 46 : 54;          // 畫布最上方 0～30px 留給進度條
    ls.forEach((l, i) => text(ctx, l, W / 2, y0 + i * 28, K.yellow, 24));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = K.bg; STARTS.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    const st = STEPS[i];
    if (st.key === 'piv') drawPIV(ctx, st, tl); else drawPair(ctx, st, tl);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('powerAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('powerAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-power');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-power'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const c = ctl();
    if (S.last && !(c && c.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    // 學生模式：以「正在播的步驟」為準，播到該步結尾就停在最後一幀；stepStop＝false 則連播到底
    const kk = S.step >= 0 ? S.step : stepAt(S.t);
    const end = stepStop ? (STARTS[kk + 1] !== undefined ? STARTS[kk + 1] : TOTAL) : TOTAL;
    if (S.t >= end) {
      S.t = end - 1e-3; render();
      if (!stepStop && !S.ended && c && typeof c.onEnd === 'function') { S.ended = true; c.onEnd(); }
      return;
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.on || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.on) start(); });

  window.EpAnim.power = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-power'); if (row) row.innerHTML = '';
      const r = document.getElementById('powerAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { power: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'power' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
