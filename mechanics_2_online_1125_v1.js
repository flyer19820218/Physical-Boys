/* ==================================================================
   mechanics_2 ｜ 一直線上的合力：同向相加、反向相減（cvs-online，960×540）
   四步：1 同向相加 → 2 反向相減 → 3 誰大往誰 → 4 一樣大＝0
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_fdraw。

   比例：PX_PER_GW＝3（1 gw＝3 px，整支動畫不變）；比例尺 1 格＝10 gw＝30 px。
         30 gw＝90 px、50 gw＝150 px、80 gw＝240 px。畫面上的 gw 數一律由箭頭向量長度算出來。
   語意色：March 的拉力＝青 COL.teal；April 的拉力＝粉 COL.pink；合力 R＝黃 COL.yellow。
   場景：地面線 GY；木塊（canvas 自畫）在中間，左右兩側各一個鐵環＝作用點（高度 AY＝人物拳頭高）。
         人物用拔河圖 assets/characters/tug/：March＝tug_march_left（第 1 步左右翻轉，站到右邊往右拉），
         April＝tug_april_right；原圖手裡的繩頭裁掉，繩子由本檔從鐵環畫到拳頭。
         力的箭頭畫在繩上、從鐵環（作用點）出發；上方一條獨立基線：
           RY0／RY1＝把兩支箭頭「搬上來」首尾相接的列，RY2＝黃色合力 R，RU＝比例尺。
   運動：合力不為 0 → 木塊連同兩人往合力方向加速（位移∝合力，最後緩停）；合力為 0 → 不動。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const M_COL = COL.teal, A_COL = COL.pink, R_COL = COL.yellow;
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 9, 10, 9];         /* 總長 37 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size || 22, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size || 22, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  /* 跨步時間 */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);

  /* ═══════════ 比例與幾何 ═══════════ */
  const PX_PER_GW = 3;               /* 1 gw ＝ 3 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 比例尺 1 格 ＝ 10 gw ＝ 30 px */
  const GY = 460;                    /* 地面線 */
  const SC = 0.40;                   /* 拔河圖縮放（原圖 352×572／346×572） */
  const IMG_FOOT = 565, IMG_HAND_Y = 285;
  const M_W = 352, M_HAND_X = 318, M_CLIP = 322;      /* March：拳頭 x、繩頭裁切 */
  const A_W = 346, A_HAND_X = 40, A_CLIP = 36;        /* April：拳頭 x、繩頭裁切（左側） */
  const HAND_H = (IMG_FOOT - IMG_HAND_Y) * SC;        /* 拳頭離腳底 112 px */
  const AY = GY - HAND_H;                             /* 繩／作用點高度 348 */
  const BOX_W = 120, BOX_H = 130;                     /* 木塊（頂 330） */
  const RY0 = 140, RY1 = 164, RY2 = 198, RU = 222;    /* 上方基線：小箭頭列、大箭頭列、合力列、比例尺 */
  const EQ_Y = 108, KEY_Y = 62, BOT_Y = 505;
  const T_MOVE = [5.4, 7.4];                          /* 木塊加速的時間窗 */

  /* 每一步的場景：cx0＝木塊中心起點；gwL／gwR＝向左／向右的力；mOff／aOff＝拳頭離作用點多遠 */
  const ST = [null,
    { same: true, cx0: 280, gwL: 0, gwR: 0, m: 30, a: 50, mOff: 175, aOff: 315 },   /* 第 1 步：兩人都在右邊往右拉 */
    { cx0: 430, gwL: 30, gwR: 80, mOff: 120, aOff: 265 },
    { cx0: 540, gwL: 70, gwR: 40, mOff: 235, aOff: 145 },
    { cx0: 480, gwL: 50, gwR: 50, mOff: 175, aOff: 175 }
  ];
  /* 合力（帶正負，向右為正，單位 gw）：由兩個力的向量相加 */
  const netOf = P => P.same ? P.m + P.a : P.gwR - P.gwL;

  /* ═══════════ 角色圖 ═══════════ */
  const IMG = {};
  [['M', 'tug_march_left'], ['A', 'tug_april_right']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/tug/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;

  function shadow(c, x, w) {
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
    c.beginPath(); c.ellipse(x, GY + 3, w, 8, 0, 0, TAU); c.fill(); c.restore();
  }
  /* March 面向右、往左拉（拳頭 fx 在右側） */
  function marchL(c, fx) {
    if (!ok(IMG.M)) return;
    const left = fx - M_HAND_X * SC, top = GY - IMG_FOOT * SC;
    shadow(c, left + 190 * SC, 62);
    c.drawImage(IMG.M, 0, 0, M_CLIP, 572, left, top, M_CLIP * SC, 572 * SC);
  }
  /* March 左右翻轉：面向左、往右拉（拳頭 fx 在左側） */
  function marchR(c, fx) {
    if (!ok(IMG.M)) return;
    const left = fx - (M_W - M_HAND_X) * SC, top = GY - IMG_FOOT * SC;
    shadow(c, left + (M_W - 190) * SC, 62);
    c.save(); c.translate(left + M_W * SC, top); c.scale(-1, 1);
    c.drawImage(IMG.M, 0, 0, M_CLIP, 572, 0, 0, M_CLIP * SC, 572 * SC);
    c.restore();
  }
  /* April 面向左、往右拉（拳頭 fx 在左側） */
  function aprilR(c, fx) {
    if (!ok(IMG.A)) return;
    const left = fx - (A_HAND_X - A_CLIP) * SC, top = GY - IMG_FOOT * SC;
    shadow(c, left + 150 * SC, 62);
    c.drawImage(IMG.A, A_CLIP, 0, A_W - A_CLIP, 572, left, top, (A_W - A_CLIP) * SC, 572 * SC);
  }

  /* ═══════════ 地面（同 fdraw） ═══════════ */
  function floor(c) {
    const gl = c.createRadialGradient(480, 300, 30, 480, 300, 460);
    gl.addColorStop(0, 'rgba(255,224,102,0.05)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    const g = c.createLinearGradient(0, GY, 0, 540);
    g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
    c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
    const e = c.createLinearGradient(0, 0, 960, 0);
    e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
    c.strokeStyle = e; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
  }

  /* ═══════════ 木塊（同 fdraw 的木箱畫法，尺寸較小） ═══════════ */
  function crate(c, cx) {
    const x = cx - BOX_W / 2, y = GY - BOX_H, w = BOX_W, h = BOX_H, fr = 12;
    c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
    c.beginPath(); c.ellipse(x + w / 2, GY + 3, w * 0.6, 8, 0, 0, TAU); c.fill(); c.restore();
    c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#c58d52'); g.addColorStop(1, '#8f5c2f');
    c.fillStyle = g; W5.rr(c, x, y, w, h, 6); c.fill(); c.restore();
    c.save(); W5.rr(c, x, y, w, h, 6); c.clip();
    c.strokeStyle = 'rgba(70,40,16,0.55)'; c.lineWidth = 2;
    for (let yy = y + fr + 27; yy < y + h - fr; yy += 27) { c.beginPath(); c.moveTo(x + fr, yy); c.lineTo(x + w - fr, yy); c.stroke(); }
    c.strokeStyle = 'rgba(90,54,22,0.35)'; c.lineWidth = 1.3;
    for (let i = 0; i < 8; i++) {
      const yy = y + fr + 8 + i * 13 + W5.hash(i) * 6, amp = 2 + W5.hash(i + 20) * 3, ph = W5.hash(i + 40) * 6;
      c.beginPath();
      for (let xx = x + fr; xx <= x + w - fr; xx += 6) {
        const py = yy + amp * Math.sin((xx - x) / 18 + ph);
        if (xx === x + fr) c.moveTo(xx, py); else c.lineTo(xx, py);
      }
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#7a4a22';
    c.fillRect(x, y, w, fr); c.fillRect(x, y + h - fr, w, fr); c.fillRect(x, y, fr, h); c.fillRect(x + w - fr, y, fr, h);
    c.save(); c.beginPath(); c.rect(x + fr, y + fr, w - 2 * fr, h - 2 * fr); c.clip();
    c.strokeStyle = '#7a4a22'; c.lineWidth = 13; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x + fr - 4, y + h - fr + 4); c.lineTo(x + w - fr + 4, y + fr - 4); c.stroke();
    c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + fr - 4, y + h - fr - 4); c.lineTo(x + w - fr - 4, y + fr - 4); c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(255,226,180,0.45)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 6, y + 2.5); c.lineTo(x + w - 6, y + 2.5); c.stroke();
    c.fillStyle = '#3d2a18';
    [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 2.6, 0, TAU); c.fill(); });
    c.strokeStyle = '#3a2412'; c.lineWidth = 2; W5.rr(c, x, y, w, h, 6); c.stroke();
  }

  /* 鐵環：xe＝木塊側面 x，dir＝+1 右側、−1 左側 */
  function eyeBolt(c, xe, dir) {
    c.fillStyle = '#5b6662'; c.fillRect(dir > 0 ? xe - 3 : xe - 2, AY - 7, 5, 14);
    c.strokeStyle = '#c7d2ce'; c.lineWidth = 3.5;
    c.beginPath(); c.arc(xe + dir * 7, AY, 7, 0, TAU); c.stroke();
  }

  /* 滑動時的塵土（確定性）：x 木塊後下角、dir 運動方向、v 0..1 */
  function dust(c, x, dir, v, t) {
    if (v <= 0.03) return;
    for (let i = 0; i < 4; i++) {
      const ph = ((t * 1.7 + i / 4) % 1 + 1) % 1;
      const px = x - dir * (4 + ph * 34), py = GY - 5 - ph * 16 + W5.hash(i) * 4, r = 5 + ph * 11;
      c.fillStyle = 'rgba(200,214,206,' + (0.32 * (1 - ph) * Math.min(1, v)).toFixed(3) + ')';
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    }
  }

  /* ═══════════ 繩子（同 fdraw，水平） ═══════════ */
  function rope(c, x0, x1, wd) {
    if (x1 < x0) { const t = x0; x0 = x1; x1 = t; }
    const len = x1 - x0; if (len < 2) return;
    wd = wd || 8;
    c.save(); c.translate(x0, AY); c.lineCap = 'round';
    c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.strokeStyle = '#4a361e'; c.lineWidth = wd + 4; c.stroke();
    c.shadowColor = 'transparent';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.strokeStyle = '#c9a46a'; c.lineWidth = wd; c.stroke();
    c.beginPath(); c.moveTo(0, -wd * 0.22); c.lineTo(len, -wd * 0.22); c.strokeStyle = 'rgba(244,224,178,0.75)'; c.lineWidth = wd * 0.28; c.stroke();
    c.strokeStyle = 'rgba(90,64,32,0.75)'; c.lineWidth = Math.max(1.5, wd * 0.16);
    const hw = wd * 0.42;
    for (let x = wd; x < len - 2; x += wd * 0.95) { c.beginPath(); c.moveTo(x - wd * 0.25, -hw); c.lineTo(x + wd * 0.25, hw); c.stroke(); }
    c.restore();
  }

  /* ═══════════ 力的箭頭（深色描邊＋光暈，同 fdraw） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  /* 水平力：起點 x0、帶正負的 gw（向右為正）；回傳尖端 x */
  function hArrowGW(c, x0, y, gw, a, col, lw) {
    const x1 = x0 + gw * PX_PER_GW;
    fArrow(c, x0, y, x1, y, a, col, lw);
    return x1;
  }
  const gwOf = (x0, x1) => Math.round(Math.abs(x1 - x0) / PX_PER_GW);

  /* 作用點：白色小球 */
  function apDot(c, x, y, a, col) {
    withA(c, a, () => {
      W5.glow(c, x, y, 22, col, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
      W5.ball(c, x, y, 6, WHITE);
    });
  }

  /* 加速後緩停：τ∈[0,0.75] 等加速，之後減速停下；回傳位移比例 0..1 與速度感 0..1 */
  function accel(u, a, b) {
    const t = seg(u, a, b), A = 1 / 0.375;
    let x, v;
    if (t <= 0.75) { x = 0.5 * A * t * t; v = A * t; }
    else { const d = t - 0.75; x = 0.5 * A * 0.5625 + 0.75 * A * d - 1.5 * A * d * d; v = 0.75 * A - 3 * A * d; }
    return { f: Math.min(1, x), v: t > 0 && t < 1 ? v / (0.75 * A) : 0 };
  }

  /* ═══════════ 上方基線：比例尺＋格線 ═══════════ */
  /* ox＝原點 x；lo..hi＝格數範圍（相對原點） */
  function ruler(c, ox, lo, hi, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 1.5;
      for (let i = lo; i <= hi; i++) { const x = ox + i * CELL; c.beginPath(); c.moveTo(x, RY0 - 14); c.lineTo(x, RU - 6); c.stroke(); }
      c.restore();
      for (let i = lo; i < hi; i++) {
        c.fillStyle = (i - lo) % 2 ? 'rgba(255,224,102,0.14)' : 'rgba(255,224,102,0.30)';
        c.fillRect(ox + i * CELL, RU - 6, CELL, 12);
      }
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(ox + lo * CELL, RU - 6, (hi - lo) * CELL, 12);
      for (let i = lo + 1; i < hi; i++) { c.beginPath(); c.moveTo(ox + i * CELL, RU - 6); c.lineTo(ox + i * CELL, RU + 6); c.stroke(); }
      /* 原點：白色小三角 */
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(ox, RU + 7); c.lineTo(ox - 6, RU + 16); c.lineTo(ox + 6, RU + 16); c.closePath(); c.fill();
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), ox + lo * CELL - 14, RU, WHITE, 22, 'right');
  }

  /* 原點到木塊的虛線（合力作用在這個木塊上） */
  function linkLine(c, x, y1, a) {
    withA(c, a, () => {
      c.save(); c.setLineDash([5, 5]); c.strokeStyle = 'rgba(255,224,102,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, RU + 18); c.lineTo(x, y1); c.stroke(); c.restore();
    });
  }

  /* ═══════════ 場景狀態（每一步自己算，跳步進來也成立） ═══════════ */
  function sceneOf(s) {
    const P = ST[s.n], net = netOf(P);
    const m = accel(s.u, T_MOVE[0], T_MOVE[1]);
    const D = net * 1.0;                       /* 位移 ∝ 合力（同樣時間、同一木塊）；合力 0 → 不動 */
    const cx = P.cx0 + D * m.f;
    return { P, net, cx, xl: cx - BOX_W / 2, xr: cx + BOX_W / 2, v: net === 0 ? 0 : m.v, dir: Math.sign(net), moved: m.f };
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    floor(c);
    const S = sceneOf(s), P = S.P, sa = s.k;      /* 每一步開頭 0.8 秒整個場景淡入 */
    const { xl, xr, cx } = S;

    /* ── 場景：木塊 → 繩 → 人物 ── */
    withA(c, sa, () => {
      if (S.v > 0.03) dust(c, S.dir > 0 ? xl : xr, S.dir, S.v, s.t);
      if (P.same) {
        rope(c, xr + 9, xr + P.aOff + 4, 8);
        crate(c, cx); eyeBolt(c, xr, 1);
        aprilR(c, xr + P.aOff);
        marchR(c, xr + P.mOff);
      } else {
        rope(c, xl - P.mOff, xl - 9, 8);
        rope(c, xr + 9, xr + P.aOff + 4, 8);
        crate(c, cx); eyeBolt(c, xl, -1); eyeBolt(c, xr, 1);
        marchL(c, xl - P.mOff);
        aprilR(c, xr + P.aOff);
      }
    });

    if (s.n === 1) step1(c, s, S);
    else stepOpp(c, s, S);
  }

  /* ── 第 1 步：同向相加 ── */
  function step1(c, s, S) {
    const P = S.P, n = 1, xr = S.xr, sa = s.k, ox = P.cx0 + BOX_W / 2;      /* 原點＝起始作用點 */
    P_(c, fin(s, n, 0.3, 0.5), L('同方向的兩個力：相加', 'Same direction: add them'), 480, KEY_Y, R_COL, 24);

    /* 繩上：兩支力都從作用點出發（上下錯開一點，看得出是兩個力） */
    const g1 = ease(seg(s.u, 0.6, 1.4)), g2 = ease(seg(s.u, 1.4, 2.2));
    const t1 = hArrowGW(c, xr, AY - 13, P.m * g1, sa, M_COL);
    const t2 = hArrowGW(c, xr, AY + 13, P.a * g2, sa, A_COL);
    apDot(c, xr, AY, sa * fin(s, n, 0.5, 0.4), WHITE);
    T(c, fin(s, n, 1.3, 0.4), gwOf(xr, t1) + ' gw', (xr + t1) / 2, AY - 44, M_COL, 22, 'center', true);
    T(c, fin(s, n, 2.1, 0.4), gwOf(xr, t2) + ' gw', (xr + t2) / 2, AY + 44, A_COL, 22, 'center', true);

    /* 上方：比例尺、首尾相接、合力 */
    ruler(c, ox, 0, Math.round(S.net * PX_PER_GW / CELL), fin(s, n, 2.4, 0.5));
    const f = ease(clamp01(since(s, n, 2.6) / 0.9));
    if (since(s, n, 2.6) >= 0) {
      const mx = lerp(xr, ox, f), my = lerp(AY - 13, RY1, f);
      const ax0 = lerp(xr, ox + P.m * PX_PER_GW, f), ay = lerp(AY + 13, RY1, f);
      fArrow(c, mx, my, mx + P.m * PX_PER_GW, my, 0.4 + 0.6 * f, M_COL);
      fArrow(c, ax0, ay, ax0 + P.a * PX_PER_GW, ay, 0.4 + 0.6 * f, A_COL);
    }
    T(c, fin(s, n, 3.4, 0.4) * fout(s, n, 4.6, 0.4), L('頭接尾', 'Tip to tail'), ox + P.m * PX_PER_GW, EQ_Y, WHITE, 22);
    rArrow(c, s, ox, S.net, 3.8, 1);
    P_(c, fin(s, n, 4.6, 0.5), S.net === 0 ? '' : eqText(P.m + ' + ' + P.a, S.net), ox + S.net * PX_PER_GW / 2, EQ_Y, R_COL, 24, true);
    linkLine(c, ox, AY - 20, fin(s, n, 3.8, 0.5) * fout(s, n, T_MOVE[0], 0.4));

    T(c, fin(s, n, T_MOVE[0] + 0.3, 0.5), L('往右加速', 'Speeds up →'), S.xr - 10, 300, WHITE, 22, 'right');
    glowBottom(c, fin(s, n, 7.0, 0.6), L('合力＝兩力相加，方向不變', 'Resultant = sum, same direction'));
  }

  /* 黃色合力箭頭（基線 RY2），t0 開始長出 */
  function rArrow(c, s, ox, net, t0, a) {
    const g = ease(seg(s.u, t0, t0 + 0.8));
    if (net === 0) {
      const ga = fin(s, s.n, t0, 0.5);
      withA(c, ga, () => { W5.glow(c, ox, RY2, 26, R_COL, 0.6); c.fillStyle = INK; c.beginPath(); c.arc(ox, RY2, 10, 0, TAU); c.fill(); W5.ball(c, ox, RY2, 8, R_COL); });
      T(c, ga, 'R = 0', ox + 22, RY2, R_COL, 24, 'left', true);
      return;
    }
    const x1 = hArrowGW(c, ox, RY2, net * g, a, R_COL, 9);
    const dir = Math.sign(net);
    T(c, fin(s, s.n, t0 + 0.7, 0.4), L('合力 R', 'Net R'), x1 + dir * 14, RY2, R_COL, 24, dir > 0 ? 'left' : 'right');
  }

  /* 算式：「80 − 30 = 50 gw（向右）」；數字由向量算出 */
  function eqText(lhs, net) {
    const v = Math.round(Math.abs(net * PX_PER_GW) / PX_PER_GW);
    if (v === 0) return lhs + ' = 0';
    return lhs + ' = ' + v + ' gw' + (net > 0 ? L('（向右）', ' (right)') : L('（向左）', ' (left)'));
  }

  function P_(c, a, str, x, y, col, size, mono) { if (str) P(c, a, str, x, y, col, size || 24, 'center', mono); }
  function glowBottom(c, a, str, col) {
    col = col || R_COL;
    if (a > 0.02) W5.glow(c, 480, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 480, BOT_Y, col, 24, 'center');
  }

  /* ── 第 2～4 步：反向（兩人分站兩邊） ── */
  function stepOpp(c, s, S) {
    const P = S.P, n = s.n, xl = S.xl, xr = S.xr, sa = s.k;
    const ox = P.cx0;                                    /* 原點＝木塊起始中心 */
    const keys = [null, null,
      L('反方向：大的減小的', 'Opposite: big minus small'),
      L('換左邊比較大', 'Now the left is bigger'),
      L('兩邊一樣大，方向相反', 'Equal size, opposite ways')];
    P_(c, fin(s, n, 0.3, 0.5), keys[n], 480, KEY_Y, R_COL, 24);

    /* 繩上兩支力：March 向左（青）、April 向右（粉），都從鐵環出發 */
    const g = ease(seg(s.u, 0.6, 1.5));
    const tl = hArrowGW(c, xl, AY, -P.gwL * g, sa, M_COL);
    const trr = hArrowGW(c, xr, AY, P.gwR * g, sa, A_COL);
    apDot(c, xl, AY, sa * fin(s, n, 0.5, 0.4), WHITE);
    apDot(c, xr, AY, sa * fin(s, n, 0.5, 0.4), WHITE);
    const la = fin(s, n, 1.4, 0.4);
    T(c, la, gwOf(xl, tl) + ' gw', (xl + tl) / 2, AY + 40, M_COL, 22, 'center', true);
    T(c, la, gwOf(xr, trr) + ' gw', (xr + trr) / 2, AY + 40, A_COL, 22, 'center', true);

    /* 大的箭頭放在 RY1、從原點出發；小的放在 RY0、尾巴接在大箭頭的尖端（頭接尾） */
    const rightBig = P.gwR > P.gwL;
    const big = rightBig ? { gw: P.gwR, col: A_COL, from: xr, dir: 1 } : { gw: P.gwL, col: M_COL, from: xl, dir: -1 };
    const sml = rightBig ? { gw: P.gwL, col: M_COL, from: xl, dir: -1 } : { gw: P.gwR, col: A_COL, from: xr, dir: 1 };
    const bigTip = ox + big.dir * big.gw * PX_PER_GW;
    const smlTip = bigTip + sml.dir * sml.gw * PX_PER_GW;
    const lo = Math.min(0, Math.round((bigTip - ox) / CELL)), hi = Math.max(0, Math.round((bigTip - ox) / CELL));
    ruler(c, ox, lo, hi, fin(s, n, 1.8, 0.5));

    const f = ease(clamp01(since(s, n, 2.0) / 0.9));
    const cut = ease(seg(s.u, 3.6, 4.4));               /* 0..1：重疊的那一段被剪掉 */
    if (since(s, n, 2.0) >= 0) {
      const a0 = 0.4 + 0.6 * f;
      /* 大箭頭：整支（淡出）＋剩下那段（淡入） */
      const bx = lerp(big.from, ox, f), by = lerp(AY, RY1, f);
      fArrow(c, bx, by, bx + big.dir * big.gw * PX_PER_GW, by, a0 * (1 - cut), big.col);
      fArrow(c, ox, RY1, smlTip, RY1, cut, big.col);
      const sx = lerp(sml.from, bigTip, f), sy = lerp(AY, RY0, f);
      fArrow(c, sx, sy, sx + sml.dir * sml.gw * PX_PER_GW, sy, a0 * (1 - cut), sml.col);
    }
    /* 重疊區：亮框＋剪刀虛線 */
    const bandA = fin(s, n, 3.0, 0.4) * fout(s, n, 4.6, 0.4);
    if (bandA > 0.02) {
      const x0 = Math.min(smlTip, bigTip), x1 = Math.max(smlTip, bigTip);
      withA(c, bandA, () => {
        c.fillStyle = 'rgba(246,243,234,0.10)'; W5.rr(c, x0 - 4, RY0 - 18, x1 - x0 + 8, RY1 - RY0 + 36, 8); c.fill();
        c.save(); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
        W5.rr(c, x0 - 4, RY0 - 18, x1 - x0 + 8, RY1 - RY0 + 36, 8); c.stroke(); c.restore();
        c.save(); c.strokeStyle = WHITE; c.lineWidth = 3; c.setLineDash([6, 5]);
        c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = 10;
        c.beginPath(); c.moveTo(smlTip, RY0 - 20); c.lineTo(smlTip, RY1 + 20); c.stroke(); c.restore();
      });
      T(c, bandA, L('互相抵消', 'Cancel out'), (x0 + x1) / 2, EQ_Y, WHITE, 22);
    }

    rArrow(c, s, ox, S.net, 4.5, 1);
    const lhs = (rightBig ? P.gwR + ' − ' + P.gwL : P.gwL + ' − ' + P.gwR);
    const eqX = ox + (lo + hi) / 2 * CELL;
    P_(c, fin(s, n, 4.8, 0.5), eqText(lhs, S.net), eqX, EQ_Y, R_COL, 24, true);
    linkLine(c, ox, S.net === 0 ? 280 : GY - BOX_H - 4, fin(s, n, 4.5, 0.5) * (S.net === 0 ? 1 : fout(s, n, T_MOVE[0], 0.4)));

    if (S.net !== 0) {
      T(c, fin(s, n, T_MOVE[0] + 0.3, 0.5), S.net > 0 ? L('往右加速', 'Speeds up →') : L('往左加速', '← Speeds up'), S.cx, 300, WHITE, 22);
    }

    if (n === 2) glowBottom(c, fin(s, n, 7.2, 0.6), L('反向：大減小，方向跟大的', 'Opposite: subtract, follow the bigger'));
    if (n === 3) {
      /* 小對照：上一步右邊贏、這一步左邊贏 */
      const ka = fin(s, n, 7.4, 0.5);
      withA(c, ka, () => {
        c.fillStyle = 'rgba(11,26,21,0.6)'; W5.rr(c, 668, 96, 280, 104, 16); c.fill();
        c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, 668, 96, 280, 104, 16); c.stroke();
      });
      const p2 = ST[2], p3 = ST[3];
      cmpRow(c, ka, 124, '②', p2.gwR + ' > ' + p2.gwL, netOf(p2));
      cmpRow(c, ka, 172, '③', p3.gwL + ' > ' + p3.gwR, netOf(p3));
      glowBottom(c, fin(s, n, 8.0, 0.6), L('合力的方向，朝向較大的力', 'Resultant points to the bigger force'));
    }
    if (n === 4) {
      const za = fin(s, n, 5.6, 0.5);
      T(c, za, L('木塊不動', 'Block stays still'), S.cx, 300, WHITE, 22);
      glowBottom(c, fin(s, n, 6.4, 0.6), L('合力為 0：靜力平衡', 'Net force 0: static equilibrium'));
    }
  }

  /* 對照列：編號、不等式、黃色小方向箭頭＋「右／左」 */
  function cmpRow(c, a, y, tag, ineq, net) {
    T(c, a, tag, 690, y, WHITE, 24, 'left');
    T(c, a, ineq, 732, y, WHITE, 22, 'left', true);
    const dir = Math.sign(net), ax = 856;
    withA(c, a, () => W5.arrow(c, ax - dir * 22, y, ax + dir * 22, y, R_COL, 5, 14));
    T(c, a, dir > 0 ? L('右', 'R') : L('左', 'L'), 892, y, R_COL, 22, 'left');
  }

  W5.register('online', { canvas: 'cvs-online', steps: DUR, draw });
})();
