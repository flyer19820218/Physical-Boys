/* ==================================================================
   mechanics_2 ｜ 力的分解：水平分力與垂直分力（cvs-rect，960×540）
   四步：1 斜向的拉力 → 2 畫成長方形 → 3 水平分力 → 4 垂直分力
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_fdraw／angle。

   比例：PX_PER_GW＝2.5（1 gw＝2.5 px，整支動畫不變）；1 格＝10 gw＝25 px。
         背景淡方格以作用點（March 的手）為格點對齊，學生可以直接數格子。
   力（gw，向量由程式算）：F＝100 gw、斜向上 30°（珊瑚）；
         水平分力 Fx＝F·cos30°（≈87 gw，青）；垂直分力 Fy＝F·sin30°（＝50 gw，粉）。
         畫面上的數字一律 Math.round(Math.hypot(x, y))；箭頭長＝gw × PX_PER_GW。
   場景（側視）：地面線 GY；左邊行李箱（本檔自畫：箱體、拉桿、兩個輪子），
         右邊 March（拔河全身圖 tug_march_left.png 左右翻轉，腳踩 GY；新圖無繩、整張畫）。
         拉桿從箱子前上角斜 30° 伸到 March 的前拳；前拳＝作用點 H；握把再從前拳接到後拳（拉桿先畫、人後畫）。
         前進用「輪子轉動＋地面刻度後退」表現（鏡頭跟著箱子），March 與箱子在畫面上位置不變。
         第 2 步起 March 淡成 0.4，讓長方形、分力箭頭看得清楚（人仍在、腳仍踩地）。
   第 4 步：箱子以後輪著地點為軸，前端抬起 3°（示意被往上提）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 被分解的原力 F：珊瑚 */
  const X_COL = COL.teal;            /* 水平分力：青 */
  const Y_COL = COL.pink;            /* 垂直分力：粉 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [8, 10, 9, 10];        /* 總長 37 秒 */

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
  /* 第 n 步 [a,b] 秒內 0→1；之後的步驟＝1、之前＝0 */
  const grow = (s, n, a, b) => (s.n > n ? 1 : s.n < n ? 0 : ease(seg(s.u, a, b)));

  /* ═══════════ 比例與向量 ═══════════ */
  const PX_PER_GW = 2.5;             /* 1 gw ＝ 2.5 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 1 格 ＝ 10 gw ＝ 25 px */
  const F_GW = 100, F_DEG = 30;
  const F = { x: F_GW * Math.cos(F_DEG * DEG), y: -F_GW * Math.sin(F_DEG * DEG) };   /* 畫面座標 y 向下 */
  const FX = { x: F.x, y: 0 }, FY = { x: 0, y: F.y };
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const cellsOf = v => String(Math.round(mag(v)) / 10);          /* 87 → "8.7"、50 → "5" */
  const px = (o, v, g) => ({ x: o.x + v.x * PX_PER_GW * (g == null ? 1 : g), y: o.y + v.y * PX_PER_GW * (g == null ? 1 : g) });

  /* ═══════════ 版面 ═══════════ */
  const GY = 450, KEY_Y = 62, BOT_Y = 500;
  const SC = 0.5;                    /* March 拔河圖縮放（原圖 325×572，無繩） */
  const IMG_W = 325, IMG_H = 572, IMG_FOOT = 565, IMG_HAND_X = 273, IMG_HAND_Y = 285, IMG_CLIP = 325;
  const IMG_BACK_X = 122, IMG_BACK_Y = 292;       /* 後拳拳心（原圖座標）；IMG_HAND_X＝前拳 */
  const HAND_H = (IMG_FOOT - IMG_HAND_Y) * SC;    /* 拳頭離腳底 140 px */
  const H = { x: 520, y: GY - HAND_H };           /* 作用點：March 的前拳＝拉桿頂端 */
  const GRIP = { x: H.x + (IMG_HAND_X - IMG_BACK_X) * SC, y: H.y + (IMG_BACK_Y - IMG_HAND_Y) * SC };   /* 後拳（翻轉後在前拳右邊） */
  const ROD = 96;                                 /* 拉桿長（沿 30°） */
  const A0 = { x: H.x - ROD * Math.cos(F_DEG * DEG), y: H.y + ROD * Math.sin(F_DEG * DEG) };  /* 拉桿接在箱子前上角 */
  const BOX = { w: 150, h: 70 };                  /* 箱體（右上角＝A0） */
  const WHEEL_R = 14, WHEEL_INSET = 26;
  const BOX_BOT = GY - WHEEL_R - 8;               /* 箱底 */
  const BOX_X0 = A0.x - BOX.w;
  const PIVOT = { x: BOX_X0 + WHEEL_INSET, y: GY };   /* 後輪著地點（第 4 步抬起的轉軸） */
  const LIFT_DEG = 3;

  /* 終點 */
  const TIP = px(H, F), TX = px(H, FX), TY = px(H, FY);

  /* ═══════════ March（拔河圖，左右翻轉） ═══════════ */
  const IMG = new Image(); IMG.src = 'assets/characters/tug/tug_march_left.png?v=20261126';
  const ok = im => im && im.complete && im.naturalWidth;
  function march(c, a) {
    if (a <= 0.02 || !ok(IMG)) return;
    const left = H.x - (IMG_W - IMG_HAND_X) * SC, top = GY - IMG_FOOT * SC;
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
      c.beginPath(); c.ellipse(left + IMG_W * SC * 0.53, GY + 3, 80, 8, 0, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(left + IMG_W * SC, top); c.scale(-1, 1);
      c.drawImage(IMG, 0, 0, IMG_CLIP, IMG_H, 0, 0, IMG_CLIP * SC, IMG_H * SC);
      c.restore();
    });
  }
  /* March 的透明度：第 1 步先正常，角度弧出現時淡成 0.6（30° 畫在他身上）；第 2 步開頭再淡成 0.4（之後維持） */
  const marchA = s => (s.n === 1 ? s.k * lerp(1, 0.6, ease(seg(s.u, 3.0, 3.8))) : lerp(0.6, 0.4, grow(s, 2, 0.2, 1.2)));

  /* ═══════════ 背景：淡方格（以 H 為格點）＋地面＋會後退的刻度 ═══════════ */
  function backdrop(c) {
    const gl = c.createRadialGradient(560, 240, 30, 560, 240, 560);
    gl.addColorStop(0, 'rgba(255,128,64,0.05)'); gl.addColorStop(1, 'rgba(255,128,64,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    c.strokeStyle = 'rgba(246,243,234,0.09)'; c.lineWidth = 1.2;
    for (let x = H.x - Math.floor((H.x - 0) / CELL) * CELL; x <= 960; x += CELL) { c.beginPath(); c.moveTo(x, 88); c.lineTo(x, GY); c.stroke(); }
    for (let y = H.y - Math.floor((H.y - 88) / CELL) * CELL; y <= GY; y += CELL) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
  }
  const TICK = 60;
  function ground(c, dist) {
    const g = c.createLinearGradient(0, GY, 0, 540);
    g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
    c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
    /* 刻度：鏡頭跟著箱子，地面往後（左）退 */
    const off = ((dist % TICK) + TICK) % TICK;
    c.strokeStyle = 'rgba(246,243,234,0.28)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let x = -off; x < 970; x += TICK) { c.beginPath(); c.moveTo(x, GY + 6); c.lineTo(x - 10, GY + 18); c.stroke(); }
    const e = c.createLinearGradient(0, 0, 960, 0);
    e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
    c.strokeStyle = e; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
  }
  function legend(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(22, BOT_Y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(22, BOT_Y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), 22 + CELL + 10, BOT_Y, DIM, 22, 'left');
  }
  function glowBottom(c, a, str, col) {
    if (a > 0.02) W5.glow(c, 570, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 570, BOT_Y, col, 24, 'center');
  }

  /* ═══════════ 行進距離（每一步自己算；第 1、3 步會走） ═══════════ */
  const D1 = 170, D3 = 230;
  function distOf(s) {
    if (s.n === 1) return D1 * ease(seg(s.u, 0.8, 5.6));
    if (s.n === 2) return D1;
    if (s.n === 3) return D1 + D3 * ease(seg(s.u, 2.2, 6.8));
    return D1 + D3;
  }
  /* 速度感 0..1（給輪子旁的小風線） */
  function speedOf(s) {
    const bell = (u, a, b) => { const t = seg(u, a, b); return t > 0 && t < 1 ? 4 * t * (1 - t) : 0; };
    if (s.n === 1) return bell(s.u, 0.8, 5.6);
    if (s.n === 3) return bell(s.u, 2.2, 6.8);
    return 0;
  }

  /* ═══════════ 行李箱 ═══════════ */
  function wheel(c, x, y, rot) {
    c.fillStyle = '#26302d'; c.beginPath(); c.arc(x, y, WHEEL_R, 0, TAU); c.fill();
    c.strokeStyle = '#0f1714'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#9aa6a2'; c.beginPath(); c.arc(x, y, WHEEL_R * 0.55, 0, TAU); c.fill();
    c.strokeStyle = '#4b5754'; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const a = rot + i * TAU / 3;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * WHEEL_R * 0.55, y + Math.sin(a) * WHEEL_R * 0.55); c.stroke();
    }
    c.fillStyle = '#d9e2dd'; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill();
  }
  /* lift：前端抬起角度（度）；回傳拉桿接點（世界座標） */
  function suitcase(c, a, dist, lift, sp) {
    const ang = -lift * DEG;
    const rot = dist / WHEEL_R;
    const toW = (x, y) => {               /* 以後輪著地點為軸旋轉 */
      const dx = x - PIVOT.x, dy = y - PIVOT.y;
      return { x: PIVOT.x + dx * Math.cos(ang) - dy * Math.sin(ang), y: PIVOT.y + dx * Math.sin(ang) + dy * Math.cos(ang) };
    };
    withA(c, a, () => {
      /* 影子 */
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
      c.beginPath(); c.ellipse(BOX_X0 + BOX.w / 2, GY + 3, BOX.w * 0.58, 7, 0, 0, TAU); c.fill(); c.restore();
      /* 小風線（往後飄） */
      if (sp > 0.03) {
        c.strokeStyle = 'rgba(200,214,206,' + (0.45 * sp).toFixed(3) + ')'; c.lineWidth = 3; c.lineCap = 'round';
        [[-18, 0.0], [-40, 0.35], [-62, 0.7]].forEach(([dy, ph], i) => {
          const x = BOX_X0 - 16 - 30 * W5.hash(i + 3);
          c.beginPath(); c.moveTo(x, BOX_BOT + dy); c.lineTo(x - 26 - 18 * sp, BOX_BOT + dy); c.stroke();
        });
      }
      c.save();
      c.translate(PIVOT.x, PIVOT.y); c.rotate(ang); c.translate(-PIVOT.x, -PIVOT.y);
      /* 輪子 */
      wheel(c, BOX_X0 + WHEEL_INSET, GY - WHEEL_R, rot);
      wheel(c, BOX_X0 + BOX.w - WHEEL_INSET, GY - WHEEL_R, rot);
      /* 箱體 */
      const x = BOX_X0, y = BOX_BOT - BOX.h, w = BOX.w, h = BOX.h;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#5b8fd6'); g.addColorStop(1, '#2f5a99');
      c.fillStyle = g; W5.rr(c, x, y, w, h, 12); c.fill(); c.restore();
      /* 稜線、拉鍊、角護 */
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 10, y + 3); c.lineTo(x + w - 10, y + 3); c.stroke();
      c.strokeStyle = 'rgba(20,40,70,0.65)'; c.lineWidth = 2.5;
      for (let i = 1; i <= 3; i++) { const xx = x + i * w / 4; c.beginPath(); c.moveTo(xx, y + 8); c.lineTo(xx, y + h - 8); c.stroke(); }
      c.setLineDash([4, 4]); c.strokeStyle = 'rgba(230,236,240,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 8, y + h * 0.5); c.lineTo(x + w - 8, y + h * 0.5); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#23324a';
      [[x, y], [x + w - 14, y], [x, y + h - 14], [x + w - 14, y + h - 14]].forEach(([qx, qy]) => { W5.rr(c, qx, qy, 14, 14, 5); c.fill(); });
      c.strokeStyle = '#16243a'; c.lineWidth = 2; W5.rr(c, x, y, w, h, 12); c.stroke();
      /* 拉桿底座 */
      c.fillStyle = '#4b5754'; W5.rr(c, A0.x - 14, A0.y - 6, 18, 12, 3); c.fill();
      c.restore();
    });
    return toW(A0.x - 4, A0.y);
  }
  /* 拉桿：從接點 A 到前拳 H（雙管）；握把從前拳接到後拳（兩拳之間露出一段，畫在人物下面） */
  function rod(c, a, A) {
    withA(c, a, () => {
      const ang = Math.atan2(H.y - A.y, H.x - A.x), len = Math.hypot(H.x - A.x, H.y - A.y);
      c.save(); c.translate(A.x, A.y); c.rotate(ang); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
      c.strokeStyle = '#b8c4c0'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(2, -1.5); c.lineTo(len - 4, -1.5); c.stroke();
      /* 伸縮接頭 */
      c.fillStyle = '#6d7a76'; c.fillRect(len * 0.45 - 4, -5, 8, 10);
      c.restore();
      /* 握把：前拳 H → 後拳 GRIP（深色橡膠握把） */
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 12; c.beginPath(); c.moveTo(H.x, H.y); c.lineTo(GRIP.x, GRIP.y); c.stroke();
      c.strokeStyle = '#2b3330'; c.lineWidth = 9; c.beginPath(); c.moveTo(H.x, H.y); c.lineTo(GRIP.x, GRIP.y); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(H.x, H.y - 2.5); c.lineTo(GRIP.x, GRIP.y - 2.5); c.stroke();
      c.restore();
    });
  }

  /* ═══════════ 力的箭頭 ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  function vecArrow(c, v, g, a, col, lw) {
    if (g <= 0.01) return;
    const t = px(H, v, g);
    fArrow(c, H.x, H.y, t.x, t.y, a, col, lw);
  }
  function dashLine(c, x0, y0, x1, y1, col, a, lw) {
    withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = col; c.lineWidth = lw || 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
    });
  }
  /* 作用點：白色小球＋珊瑚光 */
  function apDot(c, a) {
    withA(c, a, () => {
      W5.glow(c, H.x, H.y, 26, F_COL, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(H.x, H.y, 8, 0, TAU); c.fill();
      W5.ball(c, H.x, H.y, 6, WHITE);
    });
  }
  /* 30° 角弧＋字 */
  function angleMark(c, a, withRef) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      if (withRef) dashLine(c, H.x + 10, H.y, H.x + 92, H.y, 'rgba(246,243,234,0.55)', 1, 2);
      c.strokeStyle = WHITE; c.lineWidth = 2.5;
      c.beginPath(); c.arc(H.x, H.y, 50, -F_DEG * DEG, 0); c.stroke();
    });
    const m = F_DEG / 2 * DEG;
    T(c, a, F_DEG + '°', H.x + 80 * Math.cos(m), H.y - 80 * Math.sin(m) + 2, WHITE, 22, 'center', true);
  }
  /* 座標軸（淡）：X 向前、Y 向上 */
  function axes(c, gx, gy, a) {
    if (a <= 0.02) return;
    const xEnd = TX.x + 56, yEnd = TY.y - 36;
    withA(c, a, () => {
      if (gx > 0.01) W5.arrow(c, H.x, H.y, lerp(H.x, xEnd, gx), H.y, 'rgba(246,243,234,0.55)', 2.5, 14);
      if (gy > 0.01) W5.arrow(c, H.x, H.y, H.x, lerp(H.y, yEnd, gy), 'rgba(246,243,234,0.55)', 2.5, 14);
    });
    T(c, a * clamp01(gx * 3 - 2), L('X 向前', 'X forward'), xEnd + 10, H.y, DIM, 22, 'left');
    T(c, a * clamp01(gy * 3 - 2), L('Y 向上', 'Y up'), H.x, yEnd - 20, DIM, 22, 'center');
  }
  /* 長方形：兩條虛線（由 F 尖端出發）＋填色＋直角記號 */
  function rectangle(c, s, a) {
    if (a <= 0.02) return;
    const gV = grow(s, 2, 2.8, 4.0), gH = grow(s, 2, 4.4, 5.6), gF = grow(s, 2, 6.0, 6.8);
    withA(c, a * gF, () => {
      c.fillStyle = 'rgba(246,243,234,0.07)';
      c.fillRect(H.x, TIP.y, TIP.x - H.x, H.y - TIP.y);
    });
    /* 尖端 → 往下到 X 軸；尖端 → 往左到 Y 軸 */
    if (gV > 0.01) dashLine(c, TIP.x, TIP.y, TIP.x, lerp(TIP.y, H.y, gV), 'rgba(246,243,234,0.85)', a, 3);
    if (gH > 0.01) dashLine(c, TIP.x, TIP.y, lerp(TIP.x, H.x, gH), TIP.y, 'rgba(246,243,234,0.85)', a, 3);
    /* 直角記號 */
    withA(c, a * gF, () => {
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
      const q = 13;
      c.beginPath(); c.moveTo(TX.x - q, H.y); c.lineTo(TX.x - q, H.y - q); c.lineTo(TX.x, H.y - q); c.stroke();
      c.beginPath(); c.moveTo(H.x, TY.y + q); c.lineTo(H.x + q, TY.y + q); c.lineTo(H.x + q, TY.y); c.stroke();
    });
  }
  /* 長方形落在軸上的兩條邊（第 2 步補上；白實線） */
  function rectAxisSides(c, s, a) {
    if (a <= 0.02) return;
    const g = grow(s, 2, 6.0, 6.8);
    withA(c, a * g, () => {
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(H.x, TY.y); c.lineTo(H.x, H.y); c.lineTo(TX.x, H.y); c.stroke();
    });
  }

  /* ═══════════ 標籤位置 ═══════════ */
  const LAB_F = { x: TIP.x + 16, y: TIP.y - 4 };
  const LAB_X = { x: (H.x + TX.x) / 2, y: H.y + 36 };
  const LAB_Y = { x: H.x - 18, y: (H.y + TY.y) / 2 - 4 };
  const MEAS = { x: 24, y: 120 };

  function fLabel(c, a) {
    P(c, a, 'F = ' + gwOf(F) + ' gw', LAB_F.x, LAB_F.y, F_COL, 24, 'left', true);
  }
  function xLabel(c, a) {
    P(c, a, L('水平分力 = ', 'Horizontal part = ') + gwOf(FX) + ' gw', LAB_X.x, LAB_X.y, X_COL, 22, 'center');
  }
  function yLabel(c, a) {
    P(c, a, L('垂直分力 = ', 'Vertical part = ') + gwOf(FY) + ' gw', LAB_Y.x, LAB_Y.y, Y_COL, 22, 'right');
  }

  /* ── 第 1 步：斜向的拉力 ── */
  function step1(c, s) {
    const n = 1, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('斜向的拉力', 'A slanted pull'), 480, KEY_Y, WHITE, 24);
    vecArrow(c, F, ease(seg(u, 1.6, 2.6)), 1, F_COL, 8);
    apDot(c, fin(s, n, 1.2, 0.4));
    fLabel(c, fin(s, n, 2.6, 0.4));
    angleMark(c, fin(s, n, 3.2, 0.5), true);
    P(c, fin(s, n, 4.4, 0.5), L('這個斜的力，是在往前拉，還是往上提？', 'Is this slanted force pulling forward, or lifting up?'), 480, 122, COL.yellow, 24);
    glowBottom(c, fin(s, n, 5.8, 0.5), L('F ＝ 100 gw，斜向上 30°', 'F = 100 gw, slanted up 30°'), F_COL);
  }

  /* ── 第 2 步：畫成長方形 ── */
  function step2(c, s) {
    const n = 2, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('畫成長方形', 'Draw a rectangle'), 480, KEY_Y, WHITE, 24);
    axes(c, ease(seg(u, 0.8, 1.6)), ease(seg(u, 1.4, 2.2)), 1);
    rectangle(c, s, 1);
    rectAxisSides(c, s, 1);
    angleMark(c, 1, false);
    const glowF = fin(s, n, 6.8, 0.4);
    if (glowF > 0.02) withA(c, glowF * 0.8, () => { const m = px(H, F, 0.5); W5.glow(c, m.x, m.y, 150, F_COL, 0.16); });
    vecArrow(c, F, 1, 1, F_COL, glowF > 0.02 ? 9 : 8);
    apDot(c, 1);
    fLabel(c, 1);
    glowBottom(c, fin(s, n, 7.2, 0.5), L('斜的力 F ＝ 長方形的對角線', 'The slanted F = the rectangle\'s diagonal'), F_COL);
  }

  /* ── 第 3 步：水平分力 ── */
  function step3(c, s) {
    const n = 3, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('水平分力：往前拉', 'Horizontal part: pulls forward'), 480, KEY_Y, WHITE, 24);
    axes(c, 1, 1, 0.8);
    rectangle(c, s, 0.8);
    angleMark(c, 0.8, false);
    vecArrow(c, F, 1, lerp(1, 0.45, fin(s, n, 0.6, 0.6)), F_COL, 8);
    vecArrow(c, FX, ease(seg(u, 0.8, 1.8)), 1, X_COL, 10);
    apDot(c, 1);
    fLabel(c, lerp(1, 0.6, fin(s, n, 0.6, 0.6)));
    xLabel(c, fin(s, n, 1.8, 0.4));
    /* 往前的提示：箭頭尖前方的青色 >>> */
    const sp = speedOf(s);
    if (sp > 0.03) withA(c, sp, () => {
      c.strokeStyle = X_COL; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = ((u * 1.6 + i / 3) % 1), x = TX.x + 18 + ph * 26, al = Math.sin(ph * Math.PI);
        c.globalAlpha = sp * al;
        c.beginPath(); c.moveTo(x - 6, H.y - 9); c.lineTo(x + 3, H.y); c.lineTo(x - 6, H.y + 9); c.stroke();
      }
    });
    P(c, fin(s, n, 3.0, 0.5), L('數一數：約 ', 'Count: about ') + cellsOf(FX) + L(' 格 → 約 ', ' boxes → about ') + gwOf(FX) + ' gw', MEAS.x, MEAS.y, X_COL, 22, 'left');
    glowBottom(c, fin(s, n, 7.0, 0.5), L('水平分力：負責往前拉', 'Horizontal part: does the forward pull'), X_COL);
  }

  /* ── 第 4 步：垂直分力 ── */
  function step4(c, s) {
    const n = 4, u = s.u;
    const all = fin(s, n, 7.0, 0.6);              /* 最後 3 秒：F 與兩分力一起 */
    P(c, fin(s, n, 0.3, 0.5), L('垂直分力：往上提', 'Vertical part: lifts up'), 480, KEY_Y, WHITE, 24);
    axes(c, 1, 1, 0.8);
    rectangle(c, s, 0.8);
    angleMark(c, 0.8, false);
    vecArrow(c, F, 1, lerp(0.45, 1, all), F_COL, 8);
    vecArrow(c, FX, 1, lerp(0.55, 1, all), X_COL, 10);
    vecArrow(c, FY, ease(seg(u, 0.8, 1.8)), 1, Y_COL, 10);
    apDot(c, 1);
    fLabel(c, lerp(0.6, 1, all));
    xLabel(c, lerp(0.6, 1, all));
    yLabel(c, fin(s, n, 1.8, 0.4));
    T(c, fin(s, n, 3.6, 0.4), L('前端抬起一點', 'Front lifts a bit'), 356, 322, Y_COL, 22, 'center');
    P(c, fin(s, n, 3.6, 0.5), L('數一數：', 'Count: ') + cellsOf(FY) + L(' 格 → ', ' boxes → ') + gwOf(FY) + ' gw', MEAS.x, MEAS.y, Y_COL, 22, 'left');
    glowBottom(c, fin(s, n, 4.6, 0.5) * fout(s, n, 6.6, 0.4), L('垂直分力：負責往上提', 'Vertical part: does the lifting'), Y_COL);
    glowBottom(c, all, L('兩個分力合起來 ＝ 原來的 F', 'Both parts together = the original F'), COL.yellow);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    backdrop(c);
    const dist = distOf(s);
    ground(c, dist);
    legend(c, 1);
    const k = s.n === 1 ? s.k : 1;
    const lift = s.n === 4 ? LIFT_DEG * ease(seg(s.u, 2.4, 3.6)) : 0;
    const A = suitcase(c, k, dist, lift, speedOf(s));
    rod(c, k, A);
    march(c, marchA(s));
    if (s.n === 1) step1(c, s);
    if (s.n === 2) step2(c, s);
    if (s.n === 3) step3(c, s);
    if (s.n === 4) step4(c, s);
  }

  W5.register('rect', { canvas: 'cvs-rect', steps: DUR, draw });
})();
