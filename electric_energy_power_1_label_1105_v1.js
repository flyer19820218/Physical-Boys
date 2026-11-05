/* electric_energy_power_1_label_1105_v1.js — 「電器標示（銘牌）」分頁動畫（#labelAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.label = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'label'。畫布不綁任何事件；唯一控制是 #steps-label 裡的 5 個步驟鈕；結果框 #labelAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 教學符號 ────────────────────────────────────────────────────────
 *   能量＝藍色小方塊（教學符號，不代表實體粒子）。1 格代表多少 J 會依步驟換一次，圖例每步都寫明：
 *     第 2、3 步：1 格＝100 J → 吹風機每秒 8 格（800 J）；第 3 步把這 8 格用「每 1 C 帶 110 J」的尺切開 → 7.27 份 → 7.27 A。
 *     第 4、5 步：1 格＝8000 J（吹風機 10 秒）→ 3 分鐘：吹風機 18 格（144 kJ）、電熱水壺 27 格（216 kJ）、冷氣機 45 格（360 kJ）。
 *   藍球＝電子，從電源負極出發；方塊沿著同一方向（負極 → 下導線 → 右導線）走進吹風機，在吹風機中心被轉換。
 *   電壓只用「每 1 C 帶多少 J」講（110 V＝每 1 C 帶 110 J），不用水位比喻。
 *
 * ── 步驟表，共 45 s ─────────────────────────────────────────────
 *   1 銘牌     8 s  左邊吹風機（握把上貼銘牌），銘牌放大到右邊：額定電壓 110 V、額定功率 800 W 依序亮起
 *   2 額定功率 9 s  110 V 電源＋吹風機迴路，實際時間跑 4 s：每秒 8 格（800 J）排成一列 → 每秒 800 J＝800 W
 *   3 額定電流 9 s  1 秒的 8 格（800 J）用「1 C 帶 110 J」的尺切成 7 份＋0.27 份 → 每秒 7.27 C → I = P／V ≈ 7.27 A
 *   4 用多少電 10 s 快轉 3 分鐘（180 s）：每 10 s 一格 8000 J，共 18 格 → E = Pt = 144,000 J = 144 kJ ≈ 0.040 kWh
 *   5 三台比較 9 s  吹風機／電熱水壺／冷氣機同時快轉 3 分鐘：18／27／45 格；I 各為 7.27／10.91／9.09 A，標出「功率大≠電流大」
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–48px，Noto Sans TC 900；寫字前一律 measureText（fitText 最小 22）。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', current: '#ff4d4d', energy: '#4dd2ff', panel: '#123029'
  };
  const TAU = Math.PI * 2;
  const FA = 0.9, FB = 0.5;    // 方塊：沿導線走進元件的時間、從元件飛到計數格的時間（畫面秒）

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const mod = (a, n) => ((a % n) + n) % n;
  const appear = (tl, t0) => clamp((tl - t0) / 0.4, 0, 1);
  const fmt = n => Math.round(n).toLocaleString('en-US');

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

  // ───────── 迴路幾何（與「電功率」分頁同一套） ─────────
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function atPoly(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y };
  }
  // 電源在左側直立導線（+ 上、− 下），吹風機在右側直立導線正中央。
  function makeRig(o) {
    const r = Object.assign({}, o);
    r.MID = (r.TOP + r.BOT) / 2;
    r.pinT = r.MID - r.batH / 2; r.pinB = r.MID + r.batH / 2;
    r.devT = r.MID - r.R - 8 * r.sc; r.devB = r.MID + r.R + 8 * r.sc;
    r.P = [{ x: r.LX, y: r.pinB }, { x: r.LX, y: r.BOT }, { x: r.RX, y: r.BOT }, { x: r.RX, y: r.devB },
      { x: r.RX, y: r.devT }, { x: r.RX, y: r.TOP }, { x: r.LX, y: r.TOP }, { x: r.LX, y: r.pinT }];
    r.Lpath = polyLen(r.P); r.Lc = r.Lpath + r.batH;
    r.sDevC = (r.BOT - r.pinB) + (r.RX - r.LX) + (r.BOT - r.MID);     // 吹風機中心在路徑上的位置
    return r;
  }
  function posAt(r, s) {
    const sm = mod(s, r.Lc);
    if (sm <= r.Lpath) return Object.assign(atPoly(r.P, sm), { sm, inBat: false });
    return { x: r.LX, y: r.pinT + (sm - r.Lpath), sm, inBat: true };
  }
  function normalAt(r, s) {
    const a = atPoly(r.P, clamp(s - 18, 0, r.Lpath)), b = atPoly(r.P, clamp(s + 18, 0, r.Lpath));
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    return { x: dy, y: -dx };
  }
  const RIG = makeRig({ LX: 130, RX: 340, TOP: 140, BOT: 420, batW: 44, batH: 100, R: 40, sc: 1.3 });
  const E_GAP = 24, E_V = 90;

  // ───────── 步驟 ─────────
  // run：模擬時鐘 { T0, speed, Cend }；c(tl)＝clamp((tl−T0)·speed, 0, Cend)；J：1 格幾焦耳；rate＝每模擬秒幾格
  const STEPS = [
    { key: 'plate', dur: 8, b: ['銘牌', 'Nameplate'],
      cap: ['銘牌上的兩個數字：110 V、800 W', 'Two numbers on the nameplate: 110 V, 800 W'],
      res: ['銘牌上有兩個數字：額定電壓 110 V、額定功率 800 W。',
        'The nameplate shows two numbers: rated voltage 110 V and rated power 800 W.'] },
    { key: 'power', dur: 9, b: ['額定功率', 'Rated power'], J: 100,
      run: { T0: 1.0, speed: 1, Cend: 4 },
      cap: ['在 110 V 下，每秒轉換 800 J', 'At 110 V, 800 J is transformed each second'],
      res: ['額定功率是在額定電壓下，每秒轉換的能量：每秒 800 J。',
        'Rated power is the energy transformed per second at rated voltage: 800 J each second.'] },
    { key: 'current', dur: 9, b: ['額定電流', 'Rated current'], J: 100,
      cap: ['額定電流 I = P／V ≈ 7.27 A', 'Rated current I = P/V ≈ 7.27 A'],
      res: ['額定電流 I = P／V = 800／110 ≈ 7.27 A。', 'Rated current I = P/V = 800/110 ≈ 7.27 A.'] },
    { key: 'energy', dur: 10, b: ['用多少電', 'Energy used'], J: 8000,
      run: { T0: 1.0, speed: 36, Cend: 180 },
      cap: ['用 3 分鐘：E = Pt = 144 kJ', 'Used for 3 min: E = Pt = 144 kJ'],
      res: ['用 3 分鐘：E = Pt = 800 × 180 = 144 kJ，相當於 0.040 kWh。',
        'Used for 3 min: E = Pt = 800 × 180 = 144 kJ, equal to 0.040 kWh.'] },
    { key: 'compare', dur: 9, b: ['三台比較', 'Compare 3'], J: 8000,
      run: { T0: 1.0, speed: 36, Cend: 180 },
      cap: ['功率大不代表電流大', 'Higher power does not mean larger current'],
      res: ['功率大不代表電流大：冷氣機 2000 W，但用 220 V，電流（9.09 A）比電熱水壺（10.91 A）小。',
        'Higher power does not mean larger current: the 2000 W air conditioner runs on 220 V, so its current (9.09 A) is smaller than the kettle\'s (10.91 A).'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  const APPS = [
    { kind: 'dryer', cx: 170, name: ['吹風機', 'Hair dryer'], V: 110, P: 800, I: '7.27', kJ: 144 },
    { kind: 'kettle', cx: 500, name: ['電熱水壺', 'Electric kettle'], V: 110, P: 1200, I: '10.91', kJ: 216 },
    { kind: 'aircon', cx: 830, name: ['冷氣機', 'Air conditioner'], V: 220, P: 2000, I: '9.09', kJ: 360 }
  ];

  // ───────── 時鐘與方塊（全是 tl 的解析式） ─────────
  const clockOf = (run, tl) => clamp((tl - run.T0) * run.speed, 0, run.Cend);
  // 第 i 格進入元件（被轉換）的畫面時刻；rate＝每模擬秒幾格
  const tauOf = (run, rate, i) => run.T0 + (i + 1) / rate / run.speed;
  const nTotal = (run, rate) => Math.round(rate * run.Cend);
  function converted(run, rate, tl) {
    if (tl < run.T0) return 0;
    return clamp(Math.floor(rate * clockOf(run, tl) + 1e-6), 0, nTotal(run, rate));
  }

  // ───────── 繪圖小件 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function wirePath(ctx, pts, w) {
    ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function square(ctx, x, y, alpha, size) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 8; ctx.fillStyle = K.energy;
    rrect(ctx, x - size / 2, y - size / 2, size, size, Math.min(4, size / 5)); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function glowBox(ctx, x, y, w, h, color, a, rad) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 14;
    rrect(ctx, x, y, w, h, rad === undefined ? 10 : rad); ctx.stroke(); ctx.restore();
  }
  function pill(ctx, x, y, w, h, color, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K.bg; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function boxedText(ctx, s, x, y, color, want, maxW, a) {
    if (a <= 0) return;
    const z = fitSize(ctx, s, maxW - 40, want), w = textW(ctx, s, z) + 40, h = z + 26;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K.bg; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 12;
    rrect(ctx, x - w / 2, y - h / 2, w, h, 12); ctx.fill(); ctx.stroke(); ctx.restore();
    text(ctx, s, x, y, color, z, 'center', a);
  }

  // 電源（直立在左導線上；+ 上、− 下）
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
    text(ctx, '+', r.LX, y + r.batH * 0.32, K.pos, 26);
    text(ctx, '−', r.LX, y + r.batH * 0.68, K.electron, 26);
  }
  // 迴路裡的吹風機符號：圓形機身（內有電熱絲）＋右側出風口＋熱風波紋（橘／粉紅）
  function drawDryerSym(ctx, r, g, tl) {
    const cx = r.RX, cy = r.MID, R = r.R, s = r.sc;
    if (g > 0.01) {
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
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r.RX, r.devB); ctx.lineTo(r.RX, r.MID + r.R); ctx.moveTo(r.RX, r.devT); ctx.lineTo(r.RX, r.MID - r.R); ctx.stroke();
    ctx.fillStyle = K.wire; [r.devT, r.devB].forEach(py => { ctx.beginPath(); ctx.arc(r.RX, py, 4.5, 0, TAU); ctx.fill(); });
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#1d4339'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx + R - 6 * s, cy - 12 * s, 32 * s, 24 * s, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = g > 0.01 ? `rgb(${Math.round(lerp(22, 70, g))},${Math.round(lerp(58, 52, g))},${Math.round(lerp(49, 40, g))})` : '#163a31';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = g > 0.01 ? `rgb(${Math.round(lerp(150, 255, g))},${Math.round(lerp(96, 140, g))},60)` : '#8a5a36';
    ctx.lineWidth = 3; if (g > 0.01) { ctx.shadowColor = K.orange; ctx.shadowBlur = 16 * g; }
    ctx.beginPath();
    const n = 8, y0 = cy + R * 0.55, y1 = cy - R * 0.55;
    ctx.moveTo(cx, cy + R);
    for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), x = cx + (i === 0 || i === n ? 0 : (i % 2 ? -1 : 1) * R * 0.34); ctx.lineTo(x, y); }
    ctx.lineTo(cx, cy - R);
    ctx.stroke(); ctx.restore();
  }

  // 吹風機外觀（側面）：(x,y)＝機身中心；s＝縮放。回傳銘牌貼紙的位置。
  function dryerShape(ctx, x, y, s, on, tl, noCord) {
    const st = { x: x - 33 * s, y: y + 78 * s, w: 30 * s, h: 26 * s };
    if (on > 0.01) {   // 熱風
      ctx.save(); ctx.lineWidth = 3; ctx.lineCap = 'round';
      [-12, 0, 12].forEach((dy, k) => {
        const x0 = x + 108 * s, len = 36 * s, ph = tl * 9 + k * 1.3;
        ctx.strokeStyle = k === 1 ? `rgba(244,114,182,${0.9 * on})` : `rgba(251,146,60,${0.9 * on})`;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) { const xx = x0 + len * i / 12, yy = y + dy * s + Math.sin(ph - i * 0.9) * 3 * s; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      });
      ctx.restore();
    }
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    // 電線
    if (!noCord) { ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 33 * s, y + 132 * s); ctx.bezierCurveTo(x - 30 * s, y + 160 * s, x + 30 * s, y + 150 * s, x + 50 * s, y + 170 * s); ctx.stroke(); ctx.restore(); }
    // 握把
    ctx.fillStyle = '#1f4a3e';
    ctx.beginPath(); ctx.moveTo(x - 50 * s, y + 26 * s); ctx.lineTo(x - 8 * s, y + 26 * s); ctx.lineTo(x - 14 * s, y + 132 * s);
    ctx.lineTo(x - 54 * s, y + 132 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 出風口
    ctx.fillStyle = '#1d4339';
    rrect(ctx, x + 58 * s, y - 24 * s, 44 * s, 48 * s, 6 * s); ctx.fill(); ctx.stroke();
    // 機身
    ctx.fillStyle = '#245446';
    rrect(ctx, x - 92 * s, y - 36 * s, 154 * s, 72 * s, 34 * s); ctx.fill(); ctx.stroke();
    // 後方進風格柵
    ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - 76 * s, y + i * 10 * s); ctx.lineTo(x - 60 * s, y + i * 10 * s); ctx.stroke(); }
    // 開關
    ctx.fillStyle = K.muted; rrect(ctx, x - 40 * s, y + 40 * s, 14 * s, 18 * s, 3); ctx.fill();
    ctx.restore();
    return st;
  }
  // 電熱水壺（小圖示）
  function kettleShape(ctx, x, y, s, on) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    if (on > 0.01) {   // 蒸氣（白色）
      ctx.save(); ctx.strokeStyle = `rgba(242,236,217,${0.6 * on})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      [-10, 6].forEach(dx => { ctx.beginPath(); ctx.moveTo(x - 52 * s + dx * s, y - 26 * s); ctx.bezierCurveTo(x - 62 * s + dx * s, y - 40 * s, x - 42 * s + dx * s, y - 48 * s, x - 52 * s + dx * s, y - 62 * s); ctx.stroke(); });
      ctx.restore();
    }
    ctx.fillStyle = '#1d4339'; rrect(ctx, x - 36 * s, y + 30 * s, 72 * s, 10 * s, 4); ctx.fill(); ctx.stroke();   // 底座
    ctx.fillStyle = on > 0.01 ? `rgb(${Math.round(lerp(36, 84, on))},${Math.round(lerp(84, 60, on))},${Math.round(lerp(70, 44, on))})` : '#245446';
    ctx.beginPath(); ctx.moveTo(x - 22 * s, y - 26 * s); ctx.lineTo(x + 22 * s, y - 26 * s); ctx.lineTo(x + 30 * s, y + 28 * s); ctx.lineTo(x - 30 * s, y + 28 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 24 * s, y - 14 * s); ctx.lineTo(x - 46 * s, y - 26 * s); ctx.lineTo(x - 42 * s, y - 20 * s); ctx.lineTo(x - 27 * s, y - 4 * s); ctx.stroke();  // 壺嘴
    ctx.beginPath(); ctx.moveTo(x + 22 * s, y - 18 * s); ctx.bezierCurveTo(x + 48 * s, y - 18 * s, x + 48 * s, y + 18 * s, x + 28 * s, y + 18 * s); ctx.stroke();       // 把手
    ctx.fillStyle = K.muted; rrect(ctx, x - 7 * s, y - 34 * s, 14 * s, 8 * s, 3); ctx.fill();
    ctx.restore();
  }
  // 冷氣機（室內機小圖示）
  function airconShape(ctx, x, y, s, on, tl) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.fillStyle = '#245446'; rrect(ctx, x - 72 * s, y - 26 * s, 144 * s, 46 * s, 10 * s); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 60 * s, y + (6 + i * 5) * s); ctx.lineTo(x + 60 * s, y + (6 + i * 5) * s); ctx.stroke(); }
    ctx.fillStyle = on > 0.01 ? K.green : K.muted; ctx.beginPath(); ctx.arc(x + 58 * s, y - 14 * s, 3.5 * s, 0, TAU); ctx.fill();
    if (on > 0.01) {   // 出風（白色波線）
      ctx.strokeStyle = `rgba(242,236,217,${0.6 * on})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      [-36, 0, 36].forEach((dx, k) => {
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) { const yy = y + 26 * s + i * 3 * s, xx = x + dx * s + Math.sin(tl * 7 + k - i * 0.8) * 3 * s; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  // 迴路：導線 → 電子 → 線上方塊 → 吹風機（元件畫在電子之後）
  // flow：{ tOn, tOff, tau(i), iLo, iHi, size }，第 i 格在 tau(i) 抵達吹風機中心
  function drawCircuit(ctx, tl, flow, glow, eSpeed) {
    const r = RIG, w = 5;
    wirePath(ctx, [{ x: r.LX, y: r.pinB }, { x: r.LX, y: r.BOT }, { x: r.RX, y: r.BOT }, { x: r.RX, y: r.devB }], w);
    wirePath(ctx, [{ x: r.RX, y: r.devT }, { x: r.RX, y: r.TOP }, { x: r.LX, y: r.TOP }, { x: r.LX, y: r.pinT }], w);
    const ph = (eSpeed || E_V) * (clamp(tl, flow.tOn, flow.tOff) - flow.tOn);
    const n = Math.floor(r.Lc / E_GAP), gap = r.Lc / n;
    for (let k = 0; k < n; k++) {
      const p = posAt(r, ph + k * gap + 8);
      if (p.inBat) continue;
      if (Math.abs(p.x - r.RX) < 1 && p.y > r.MID - r.R - 4 && p.y < r.MID + r.R + 4) continue;
      ball(ctx, p.x, p.y, 6.5, 1);
    }
    for (let i = flow.iLo; i <= flow.iHi; i++) {
      const tau = flow.tau(i);
      if (tl < tau - FA || tl >= tau) continue;
      const k = (tl - tau + FA) / FA, s = k * r.sDevC, p = atPoly(r.P, s), nn = normalAt(r, s);
      const off = 15 * clamp((r.sDevC - s) / 40, 0, 1);
      square(ctx, p.x + nn.x * off, p.y + nn.y * off, clamp(k * 5, 0, 1), flow.size);
    }
    drawSource(ctx, r, glow > 0 ? 0.6 : 0);
    drawDryerSym(ctx, r, glow, tl);
    fitText(ctx, '110 V', r.LX - r.batW / 2 - 10, r.MID, K.cyan, 28, r.LX - r.batW / 2 - 18, 'right');
    fitText(ctx, tr('吹風機', 'Hair dryer'), r.RX, r.BOT + 34, K.white, 24, 220, 'center');
  }
  // 由吹風機中心飛到計數格的方塊
  function drawFlyers(ctx, tl, run, rate, slot, size) {
    const N = nTotal(run, rate), r = RIG;
    for (let i = 0; i < N; i++) {
      const tau = tauOf(run, rate, i);
      if (tl < tau) break;
      const q = slot(i), k = ease((tl - tau) / FB);
      square(ctx, lerp(r.RX, q.x, k), lerp(r.MID, q.y, k), clamp(k * 4, 0, 1), size * lerp(0.6, 1, k));
    }
  }
  function slotDot(ctx, x, y, size) {
    ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,0.22)'; ctx.lineWidth = 1.5;
    rrect(ctx, x - size / 2, y - size / 2, size, size, Math.min(4, size / 5)); ctx.stroke(); ctx.restore();
  }

  // ───────── 第 1 步：銘牌 ─────────
  function drawPlate(ctx, tl) {
    const st = dryerShape(ctx, 250, 230, 1.6, 0, tl);
    // 握把上的銘牌貼紙
    const g1 = appear(tl, 0.8);
    ctx.save(); ctx.fillStyle = '#e9e2c8'; ctx.strokeStyle = K.white; ctx.lineWidth = 2;
    rrect(ctx, st.x - st.w / 2, st.y - st.h / 2, st.w, st.h, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#33524a'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(st.x - st.w / 2 + 6, st.y - 7 + i * 7); ctx.lineTo(st.x + st.w / 2 - 6, st.y - 7 + i * 7); ctx.stroke(); }
    ctx.restore();
    glowBox(ctx, st.x - st.w / 2 - 6, st.y - st.h / 2 - 6, st.w + 12, st.h + 12, K.pink, g1, 6);
    // 放大卡片（從貼紙長出來）
    const CX = 545, CY = 110, CW = 400, CH = 330;
    const z = ease((tl - 1.5) / 1.0);
    if (z > 0) {
      const x = lerp(st.x - st.w / 2, CX, z), y = lerp(st.y - st.h / 2, CY, z), w = lerp(st.w, CW, z), h = lerp(st.h, CH, z);
      ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = K.pink; ctx.lineWidth = 2; ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(st.x + st.w / 2, st.y - st.h / 2); ctx.lineTo(x, y);
      ctx.moveTo(st.x + st.w / 2, st.y + st.h / 2); ctx.lineTo(x, y + h);
      ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#183b32'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
      rrect(ctx, x, y, w, h, 14 * z); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    const a = clamp((tl - 2.4) / 0.4, 0, 1);
    if (a > 0) {
      fitText(ctx, tr('吹風機　銘牌', 'Hair dryer · Nameplate'), CX + CW / 2, CY + 38, K.white, 28, CW - 40, 'center', a);
      ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = K.white; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(CX + 24, CY + 70); ctx.lineTo(CX + CW - 24, CY + 70); ctx.stroke(); ctx.restore();
      const rows = [
        { y: CY + 140, lab: tr('額定電壓', 'Rated voltage'), val: '110 V', col: K.cyan, t0: 3.0 },
        { y: CY + 250, lab: tr('額定功率', 'Rated power'), val: '800 W', col: K.yellow, t0: 4.8 }
      ];
      rows.forEach(rw => {
        const b = appear(tl, rw.t0);
        text(ctx, rw.val, CX + CW - 34, rw.y, rw.col, 48, 'right', a * (0.25 + 0.75 * b));
        const labW = CW - 68 - textW(ctx, rw.val, 48) - 20;
        fitText(ctx, rw.lab, CX + 34, rw.y, rw.col, 28, labW, 'left', a * (0.25 + 0.75 * b));
        glowBox(ctx, CX + 18, rw.y - 44, CW - 36, 88, rw.col, b * (tl < rw.t0 + 1.8 || rw.t0 > 4 ? 1 : 0.35), 12);
      });
    }
    fitText(ctx, tr('額定＝設計上該用的電壓與功率', 'Rated = the designed operating values'), CX + CW / 2, 488, K.white, 24, 440, 'center', appear(tl, 6.4));
  }

  // ───────── 第 2 步：額定功率（1 格＝100 J，每秒 8 格） ─────────
  const G2 = { x0: 600, pitch: 40, size: 30, y0: 182, row: 62 };
  const slot2 = i => ({ x: G2.x0 + (i % 8) * G2.pitch, y: G2.y0 + Math.floor(i / 8) * G2.row });
  function drawPower(ctx, st, tl) {
    const run = st.run, rate = 800 / st.J, N = nTotal(run, rate);
    const off = run.T0 + run.Cend / run.speed;
    const flow = { tOn: run.T0 - FA, tOff: off, tau: i => tauOf(run, rate, i), iLo: 0, iHi: N - 1, size: 12 };
    const on = tl >= run.T0 - 0.3 && tl <= off + 0.05 ? 0.85 : 0;
    drawCircuit(ctx, tl, flow, on);
    divider(ctx);
    const c = clockOf(run, tl), n = converted(run, rate, tl);
    fitText(ctx, `t = ${(Math.floor(c * 10 + 1e-6) / 10).toFixed(1)} s`, 600, 108, tl >= run.T0 ? K.white : K.muted, 30, 200, 'center');
    fitText(ctx, `E = ${fmt(n * st.J)} J`, 830, 108, K.yellow, 32, 250, 'center');
    for (let k = 0; k < 4; k++) {
      const y = G2.y0 + k * G2.row, started = tl >= run.T0 + k / run.speed;
      fitText(ctx, tr(`第 ${k + 1} 秒`, `Sec ${k + 1}`), 490, y, started ? K.white : K.muted, 22, 82, 'left', started ? 1 : 0.5);
      for (let j = 0; j < 8; j++) slotDot(ctx, G2.x0 + j * G2.pitch, y, G2.size);
      const done = n >= (k + 1) * 8;
      fitText(ctx, '800 J', 906, y, K.yellow, 22, 88, 'left', done ? 1 : 0);
    }
    drawFlyers(ctx, tl, run, rate, slot2, G2.size);
    boxedText(ctx, tr('每秒 800 J ＝ 800 W', '800 J each second = 800 W'), 725, 448, K.green, 30, 470, appear(tl, 6.2));
  }
  function divider(ctx) {
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.22)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(468, 80); ctx.lineTo(468, 510); ctx.stroke(); ctx.restore();
  }

  // ───────── 第 3 步：額定電流（800 J 用「1 C 帶 110 J」切開） ─────────
  const B3 = { x0: 520, pitch: 52, size: 46, y: 168 };
  const jx = J => B3.x0 + J / 100 * B3.pitch;     // 能量（J）→ 橫座標
  function drawCurrent(ctx, st, tl) {
    // 穩定運轉：每秒 8 格不停送進吹風機（從前一刻就在線上）
    const flow = { tOn: -10, tOff: 99, tau: i => i / 8, iLo: Math.floor((tl - 0.01) * 8), iHi: Math.ceil((tl + FA) * 8) + 1, size: 12 };
    drawCircuit(ctx, tl, flow, 0.85);
    divider(ctx);
    fitText(ctx, tr('吹風機 1 秒用掉 800 J', 'The dryer uses 800 J in 1 s'), 725, 100, K.yellow, 26, 480, 'center', appear(tl, 0.4));
    // 尺：每 110 J 一段＝1 C（先畫段落底色，再畫方塊，最後畫切線）
    const segW = jx(110) - jx(0), yR = B3.y + B3.size / 2 + 14;
    const nCut = clamp(Math.floor((tl - 2.0) / 0.45) + 1, 0, 7), rem = tl >= 2.0 + 7 * 0.45 + 0.2;
    ctx.save();
    for (let k = 0; k < nCut; k++) {
      ctx.globalAlpha = k % 2 ? 0.16 : 0.32; ctx.fillStyle = K.cyan;
      ctx.fillRect(jx(k * 110), B3.y - B3.size / 2 - 8, segW, B3.size + 16);
    }
    ctx.restore();
    // 8 格＝800 J
    for (let k = 0; k < 8; k++) {
      const a = clamp((tl - 0.6 - k * 0.08) / 0.3, 0, 1);
      square(ctx, B3.x0 + k * B3.pitch + B3.size / 2, B3.y, a, B3.size);
    }
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = K.cyan; ctx.lineCap = 'round';
    for (let k = 0; k < nCut; k++) {
      const x0 = jx(k * 110) + 2, x1 = jx((k + 1) * 110) - 2;
      ctx.beginPath(); ctx.moveTo(jx((k + 1) * 110), B3.y - B3.size / 2 - 8); ctx.lineTo(jx((k + 1) * 110), B3.y + B3.size / 2 + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, yR - 8); ctx.lineTo(x0, yR); ctx.lineTo(x1, yR); ctx.lineTo(x1, yR - 8); ctx.stroke();
    }
    if (rem) {
      const x0 = jx(770) + 2, x1 = jx(800);
      ctx.strokeStyle = K.pink; ctx.beginPath(); ctx.moveTo(x0, yR - 8); ctx.lineTo(x0, yR); ctx.lineTo(x1, yR); ctx.stroke();
    }
    ctx.restore();
    for (let k = 0; k < nCut; k++) {
      const xc = (jx(k * 110) + jx((k + 1) * 110)) / 2;
      ball(ctx, xc, yR + 18, 6.5, 1);
      text(ctx, '1 C', xc, yR + 44, K.cyan, 22, 'center');
    }
    if (rem) {
      const xc = (jx(770) + jx(800)) / 2;
      ctx.save(); ctx.strokeStyle = K.pink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xc, yR + 4); ctx.lineTo(xc, yR + 64); ctx.stroke(); ctx.restore();
      text(ctx, '0.27 C', xc + 8, yR + 80, K.pink, 22, 'right');
    }
    fitText(ctx, tr('110 V：每 1 C 帶 110 J', '110 V: each 1 C carries 110 J'), 725, 340, K.cyan, 26, 480, 'center', appear(tl, 1.2));
    fitText(ctx, tr('800 ÷ 110 ≈ 7.27 → 每秒 7.27 C', '800 ÷ 110 ≈ 7.27 → 7.27 C each second'), 725, 390, K.current, 26, 480, 'center', appear(tl, 5.8));
    boxedText(ctx, tr('I = P／V = 800／110 ≈ 7.27 A', 'I = P/V = 800/110 ≈ 7.27 A'), 725, 452, K.current, 30, 480, appear(tl, 7.0));
    fitText(ctx, 'I ≈ 7.27 A', (RIG.LX + RIG.RX) / 2, RIG.TOP - 34, K.current, 28, 300, 'center', appear(tl, 7.0));
  }

  // ───────── 第 4 步：用多少電（1 格＝8000 J，快轉 3 分鐘） ─────────
  const G4 = { x0: 557, pitch: 42, size: 34, y0: 190, cols: 9 };
  const slot4 = i => ({ x: G4.x0 + (i % G4.cols) * G4.pitch, y: G4.y0 + Math.floor(i / G4.cols) * G4.pitch });
  function drawEnergy(ctx, st, tl) {
    const run = st.run, rate = 800 / st.J, N = nTotal(run, rate);
    const off = run.T0 + run.Cend / run.speed;
    const flow = { tOn: run.T0 - FA, tOff: off, tau: i => tauOf(run, rate, i), iLo: 0, iHi: N - 1, size: 16 };
    const on = tl >= run.T0 - 0.3 && tl <= off + 0.05 ? 0.85 : 0;
    drawCircuit(ctx, tl, flow, on, E_V * 1.6);
    divider(ctx);
    const c = clockOf(run, tl), n = converted(run, rate, tl);
    fitText(ctx, `t = ${Math.floor(c + 1e-6)} s`, 600, 100, tl >= run.T0 ? K.white : K.muted, 30, 200, 'center');
    fitText(ctx, tr('快轉', 'Fast-forward'), 600, 136, K.cyan, 22, 200, 'center', tl >= run.T0 - FA && tl <= off + 0.3 ? 1 : 0.45);
    fitText(ctx, `E = ${fmt(n * st.J)} J`, 830, 100, K.yellow, 30, 260, 'center');
    fitText(ctx, tr('已使用電能', 'Energy used'), 830, 136, K.muted, 22, 260, 'center');
    for (let i = 0; i < N; i++) { const q = slot4(i); slotDot(ctx, q.x, q.y, G4.size); }
    drawFlyers(ctx, tl, run, rate, slot4, G4.size);
    fitText(ctx, tr('1 格 = 8000 J（吹風機 10 秒）', '1 square = 8000 J (10 s of the dryer)'), 725, 268, K.pink, 22, 480, 'center');
    fitText(ctx, 'E = Pt = 800 W × 180 s', 725, 318, K.white, 28, 480, 'center', appear(tl, 6.4));
    fitText(ctx, '= 144,000 J = 144 kJ', 725, 362, K.yellow, 28, 480, 'center', appear(tl, 7.0));
    fitText(ctx, tr('1 度 = 1 kWh = 3,600,000 J', '1 kWh = 3,600,000 J'), 725, 408, K.muted, 24, 480, 'center', appear(tl, 7.7));
    boxedText(ctx, tr('144 kJ ≈ 0.040 kWh（0.040 度）', '144 kJ ≈ 0.040 kWh'), 725, 462, K.green, 28, 480, appear(tl, 8.4));
  }

  // ───────── 第 5 步：三台比較 ─────────
  const G5 = { pitch: 28, size: 22, cols: 9, y0: 366 };
  const slot5 = (app, i) => ({ x: app.cx - 4 * G5.pitch + (i % G5.cols) * G5.pitch, y: G5.y0 + Math.floor(i / G5.cols) * G5.pitch });
  function drawCompare(ctx, st, tl) {
    const run = st.run, off = run.T0 + run.Cend / run.speed, c = clockOf(run, tl);
    const on = tl >= run.T0 && tl <= off + 0.05 ? 1 : 0;
    fitText(ctx, tr(`t = ${Math.floor(c + 1e-6)} s（快轉 3 分鐘）`, `t = ${Math.floor(c + 1e-6)} s (fast-forward 3 min)`), 500, 92, tl >= run.T0 ? K.white : K.muted, 26, 600, 'center');
    const hl = appear(tl, 6.6);
    APPS.forEach((ap, k) => {
      const x = ap.cx - 155, y = 114, w = 310, h = 424;
      ctx.save(); ctx.fillStyle = 'rgba(18,48,41,0.55)'; ctx.strokeStyle = 'rgba(242,236,217,0.28)'; ctx.lineWidth = 2;
      rrect(ctx, x, y, w, h, 16); ctx.fill(); ctx.stroke(); ctx.restore();
      fitText(ctx, tr(ap.name[0], ap.name[1]), ap.cx, 140, K.white, 28, 290, 'center');
      if (ap.kind === 'dryer') dryerShape(ctx, ap.cx - 8, 180, 0.42, on, tl, true);
      else if (ap.kind === 'kettle') kettleShape(ctx, ap.cx, 194, 0.8, on);
      else airconShape(ctx, ap.cx, 188, 0.9, on, tl);
      text(ctx, `${ap.V} V`, ap.cx - 70, 250, K.cyan, 26, 'center');
      text(ctx, `${ap.P} W`, ap.cx + 70, 250, K.yellow, 26, 'center');
      fitText(ctx, tr(`I = ${ap.P}／${ap.V}`, `I = ${ap.P}/${ap.V}`), ap.cx, 288, K.current, 24, 280, 'center');
      const sI = `≈ ${ap.I} A`, zI = 30;
      text(ctx, sI, ap.cx, 324, K.current, zI, 'center');
      // 方塊：1 格＝8000 J
      const rate = ap.P / st.J, N = nTotal(run, rate), n = converted(run, rate, tl);
      for (let i = 0; i < N; i++) { const q = slot5(ap, i); slotDot(ctx, q.x, q.y, G5.size); }
      const sx = ap.cx, sy = 190;
      for (let i = 0; i < N; i++) {
        const tau = tauOf(run, rate, i); if (tl < tau) break;
        const q = slot5(ap, i), kk = ease((tl - tau) / 0.45);
        square(ctx, lerp(sx, q.x, kk), lerp(sy, q.y, kk), clamp(kk * 4, 0, 1), G5.size * lerp(0.6, 1, kk));
      }
      fitText(ctx, `E = ${n * st.J / 1000} kJ`, ap.cx, 512, K.yellow, 28, 290, 'center');
      if (k > 0) {   // 電熱水壺、冷氣機：電流比較
        const wI = textW(ctx, sI, zI) + 24;
        glowBox(ctx, ap.cx - wI / 2, 324 - 23, wI, 46, K.pink, hl, 10);
      }
      if (k === 2) glowBox(ctx, ap.cx - 70 - 48, 250 - 20, 96, 40, K.pink, appear(tl, 7.4), 10);
    });
    pill(ctx, 665, 324, 40, 40, K.pink, hl);
    text(ctx, '>', 665, 323, K.pink, 30, 'center', hl);
  }

  // ───────── 圖例、說明 ─────────
  function drawLegend(ctx, st) {
    if (st.key === 'plate') return;
    const items = [];
    if (st.key !== 'compare') items.push([tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −'), 'e']);
    const jt = st.J === 8000 ? '8000 J' : '100 J';
    items.push([tr(`藍方塊＝能量，1 格＝${jt}（教學符號）`, `Blue square = ${jt} of energy (symbol)`), 's']);
    const z = 22, gapIcon = 28, gapItem = 40, maxW = W - 60;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [566] : [552, 582];
    rows.forEach((row, ri) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[ri];
        if (kind === 'e') ball(ctx, x + 9, y, 7, 1); else square(ctx, x + 9, y, 1, st.J === 8000 ? 16 : 12);
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
    if (st.key === 'plate') drawPlate(ctx, tl);
    else if (st.key === 'power') drawPower(ctx, st, tl);
    else if (st.key === 'current') drawCurrent(ctx, st, tl);
    else if (st.key === 'energy') drawEnergy(ctx, st, tl);
    else drawCompare(ctx, st, tl);
    drawLegend(ctx, st);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('labelAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('labelAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-label');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-label'); if (!row) return;
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
    // 學生模式：播到該步結尾就停在最後一幀；stepStop＝false 則連播到底
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

  window.EpAnim.label = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-label'); if (row) row.innerHTML = '';
      const r = document.getElementById('labelAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { label: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'label' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
