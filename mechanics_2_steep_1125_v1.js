/* ==================================================================
   mechanics_2 ｜ 坡度越陡：下滑力越大、壓迫力越小；壓迫力與正向力 N（cvs-steep，960×540）
   四步：1 緩坡 15° → 2 坡度 30° → 3 陡坡 60° → 4 壓迫力與正向力
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。
   場景語彙沿用 mechanics_2_slope_1125_v1.js（同一個斜坡、小車、箭頭畫法、顏色語意、比例）；
   表格畫法參考 mechanics_2_trend 的面板。

   比例：PX_PER_GW＝2.2（同 slope；1 gw＝2.2 px，整支動畫不變）；1 格＝10 gw＝22 px。
         背景淡方格以坡底 V 為格點；力的箭頭上每 10 gw 一個刻痕。
   力（gw，向量由程式算）：重力 W＝100 gw 垂直向下（珊瑚）。
         下滑力＝W 在沿斜面向下方向的投影（青）；壓迫力＝W 在壓進斜面方向的投影（粉）；
         正向力 N＝斜面給車子的力＝ −壓迫力（綠，第 4 步）。
         畫面上的數字一律 Math.round(Math.hypot(x, y))：15° → 26／97、30° → 50／87、60° → 87／50。
   場景（側視）：斜坡＝一塊「繞坡底 V 抬起」的板子，坡面長 SLOPE_LEN 固定、θ 用緩動改變。
         （簡報原寫「底邊固定、頂端上升」：W＝220 px 長，15° 時車子必須離地夠高 W 尖端才不出畫布，
           而同一條底邊抬到 60° 會高出畫布；改成坡面長固定，三個角度的斜坡、車子、W 都完整在畫布內。）
         車子位置用「離 V 的坡面距離 s」：每步從 S0 出發，依下滑力滑 K_SLIDE·sinθ（同一段時間 → 滑行距離 ∝ 加速度 ∝ 下滑力）。
         第 4 步車子放在 S4（較低處），讓壓迫力箭頭（從接觸面壓進斜面）整支落在坡體裡。
         March（全身圖 touch_water／touch_shock，腳踩 GY）站在左邊看著。
         右上角小表格（坡度／下滑力／壓迫力）逐步填入；第 4 步表格收起，換成接觸面放大圈。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const W_COL = COL.coral;           /* 重力 W：珊瑚 */
  const S_COL = COL.teal;            /* 下滑力：青 */
  const P_COL = COL.pink;            /* 壓迫力：粉 */
  const N_COL = COL.green;           /* 正向力 N：綠 */
  const R_COL = COL.yellow;          /* 角度、重點：黃 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 9, 10, 12];        /* 總長 40 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const isEn = () => L('zh', 'en') === 'en';

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

  /* ═══════════ 共用常數（同 slope，位置重新安排） ═══════════ */
  const PX_PER_GW = 2.2;             /* 1 gw ＝ 2.2 px（同 slope） */
  const CELL = 10 * PX_PER_GW;       /* 1 格 ＝ 10 gw ＝ 22 px */
  const W_GW = 100;
  const GY = 390;                    /* 地面線 */
  const XV = 560;                    /* 坡底 V 的 x */
  const SLOPE_LEN = 310;             /* 坡面長（固定；60° 時坡頂 y≈122） */
  const CAR = { half: 58, wheelR: 13, wheelX: 37, bodyBot: 14, bodyTop: 50, hc: 32 };
  const S0 = 240;                    /* 每一步的起點（離 V 的坡面距離） */
  const S4 = 110;                    /* 第 4 步車子停的位置：接觸點往斜面內 110 px（＝壓迫力 50 gw）仍在坡體內 */
  const K_SLIDE = 190;               /* 滑行距離 ＝ K_SLIDE·sinθ（15°≈49、30°＝95、60°≈165 px） */
  const TH = [15, 15, 30, 60, 60];   /* 各步最後的坡度（索引＝步驟） */
  const SLIDE = { 1: [5.0, 7.0], 2: [4.0, 6.2], 3: [4.2, 6.4] };   /* 三步滑行時間一樣長 */
  const MARCH = { x: 108, sc: 0.42 };
  const KEY_Y = 62, MSG_X = 24, MSG_Y = 108;

  /* 斜坡幾何（同 slope） */
  function slopeGeom(thDeg, len) {
    const th = thDeg * DEG, cs = Math.cos(th), sn = Math.sin(th);
    const t = { x: cs, y: sn }, nIn = { x: -sn, y: cs }, nOut = { x: sn, y: -cs };
    const V = { x: XV, y: GY };
    const top = { x: XV - len * cs, y: GY - len * sn }, foot = { x: XV - len * cs, y: GY };
    const surf = s => ({ x: V.x - t.x * s, y: V.y - t.y * s });
    const carC = s => { const p = surf(s); return { x: p.x + nOut.x * CAR.hc, y: p.y + nOut.y * CAR.hc }; };
    return { thDeg, th, t, nIn, nOut, V, top, foot, len, surf, carC };
  }

  /* 向量 */
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const mul = (v, k) => ({ x: v.x * k, y: v.y * k });
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const px = (o, v, g) => ({ x: o.x + v.x * PX_PER_GW * (g == null ? 1 : g), y: o.y + v.y * PX_PER_GW * (g == null ? 1 : g) });
  function decompose(g, v) { return { S: mul(g.t, dot(v, g.t)), Pr: mul(g.nIn, dot(v, g.nIn)) }; }
  const WV = { x: 0, y: W_GW };

  /* ═══════════ 角色圖（March 全身，站在左邊、面向右邊的斜坡） ═══════════ */
  const IMG = {};
  [['water', 'touch_water'], ['shock', 'touch_shock']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/march/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;
  const SOLE = { water: 469, shock: 480 };          /* 原圖鞋底所在列 */
  const BODY = { water: 65, shock: 115 };           /* 畫出來（翻轉後）的身體中線 */
  const FLIP = { water: true, shock: false };       /* water 原圖面向左，翻轉成面向右 */
  function drawMarch(c, key, a) {
    const im = IMG[key];
    if (a <= 0.02 || !ok(im)) return;
    const sc = MARCH.sc, w = im.naturalWidth * sc, h = im.naturalHeight * sc, top = GY - SOLE[key] * sc, x0 = MARCH.x - BODY[key] * sc;
    withA(c, a, () => {
      if (FLIP[key]) { c.save(); c.translate(x0 + w, top); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); }
      else c.drawImage(im, x0, top, w, h);
    });
  }
  function marchShadow(c, a) {
    withA(c, a * 0.4, () => { c.fillStyle = INK; c.beginPath(); c.ellipse(MARCH.x, GY + 3, 44, 7, 0, 0, TAU); c.fill(); });
  }

  /* ═══════════ 背景（同 slope） ═══════════ */
  function backdrop(c) {
    const gl = c.createRadialGradient(420, 230, 30, 420, 230, 560);
    gl.addColorStop(0, 'rgba(255,128,64,0.05)'); gl.addColorStop(1, 'rgba(255,128,64,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    c.strokeStyle = 'rgba(246,243,234,0.08)'; c.lineWidth = 1.2;
    const y0 = GY - Math.floor((GY - 86) / CELL) * CELL;
    for (let x = XV - Math.floor(XV / CELL) * CELL; x <= 960; x += CELL) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, GY); c.stroke(); }
    for (let y = y0; y <= GY; y += CELL) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
  }
  function ground(c) {
    const g = c.createLinearGradient(0, GY, 0, 540);
    g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
    c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
    const e = c.createLinearGradient(0, 0, 960, 0);
    e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
    c.strokeStyle = e; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
  }
  /* 比例尺：左上角（下方要留給箭頭與標籤） */
  function legend(c, a) {
    const x = 22, y = KEY_Y;
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(x, y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(x, y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), x + CELL + 10, y, DIM, 22, 'left');
  }

  /* ═══════════ 斜坡（同 slope） ═══════════ */
  function drawSlope(c, g) {
    const V = g.V, A = g.top, F = g.foot;
    c.save();
    c.beginPath(); c.moveTo(V.x, V.y); c.lineTo(A.x, A.y); c.lineTo(F.x, F.y); c.closePath();
    c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
    const fill = c.createLinearGradient(A.x, A.y, A.x + g.nIn.x * 200, A.y + g.nIn.y * 200);
    fill.addColorStop(0, '#4a5f55'); fill.addColorStop(1, '#2c3d36');
    c.fillStyle = fill; c.fill(); c.restore();
    c.clip();
    c.strokeStyle = 'rgba(20,34,29,0.55)'; c.lineWidth = 2;
    for (let d = 18; d < 400; d += 22) {
      const ox = g.nIn.x * d, oy = g.nIn.y * d;
      c.beginPath(); c.moveTo(A.x + ox - g.t.x * 40, A.y + oy - g.t.y * 40); c.lineTo(V.x + ox + g.t.x * 40, V.y + oy + g.t.y * 40); c.stroke();
    }
    c.fillStyle = 'rgba(160,184,172,0.16)';
    for (let i = 0; i < 70; i++) {
      const u = W5.hash(i * 3 + 1), v = W5.hash(i * 7 + 2);
      const x = lerp(F.x, V.x, u), ytop = GY - (V.x - x) * Math.tan(g.th), y = lerp(ytop + 6, GY - 4, v);
      c.beginPath(); c.arc(x, y, 1.6 + 1.6 * W5.hash(i + 40), 0, TAU); c.fill();
    }
    c.restore();
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(V.x, V.y); c.stroke();
    c.strokeStyle = 'rgba(246,243,234,0.30)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(F.x, F.y); c.stroke();
    const q = 14;
    c.beginPath(); c.moveTo(F.x + q, F.y); c.lineTo(F.x + q, F.y - q); c.lineTo(F.x, F.y - q); c.stroke();
    c.restore();
  }
  /* 坡度角弧（在 V）；字放在 V 右下方的地面上（不和箭頭標籤搶位置） */
  function thetaArc(c, g, a, glow) {
    if (a <= 0.02) return;
    const r = 58;
    withA(c, a, () => {
      if (glow > 0.02) W5.glow(c, g.V.x - 40, g.V.y - 12, 60, R_COL, 0.35 * glow);
      c.fillStyle = W5.rgba(R_COL, 0.18);
      c.beginPath(); c.moveTo(g.V.x, g.V.y); c.arc(g.V.x, g.V.y, r, Math.PI, Math.PI + g.th, false); c.closePath(); c.fill();
      c.strokeStyle = R_COL; c.lineWidth = 3 + 2 * glow;
      c.beginPath(); c.arc(g.V.x, g.V.y, r, Math.PI, Math.PI + g.th, false); c.stroke();
    });
    /* 只標「θ」（放在角弧裡面、角平分線上）；度數寫在重點句與表格裡，避免和移動中的箭頭標籤相撞 */
    const b = g.th / 2, rr = r - 24;
    T(c, a, 'θ', g.V.x - rr * Math.cos(b), g.V.y - rr * Math.sin(b), R_COL, 24, 'center', true);
  }

  /* ═══════════ 小車（同 slope） ═══════════ */
  function wheel(c, x, y, r, rot) {
    c.fillStyle = '#26302d'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = '#0f1714'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#9aa6a2'; c.beginPath(); c.arc(x, y, r * 0.55, 0, TAU); c.fill();
    c.strokeStyle = '#4b5754'; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const q = rot + i * TAU / 3;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(q) * r * 0.55, y + Math.sin(q) * r * 0.55); c.stroke();
    }
    c.fillStyle = '#d9e2dd'; c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill();
  }
  function drawCar(c, g, s, rot, a, sp) {
    if (a <= 0.02) return;
    const p = g.surf(s), K = CAR;
    withA(c, a, () => {
      c.save(); c.translate(p.x, p.y); c.rotate(g.th);
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
      c.beginPath(); c.ellipse(0, 1, K.half * 1.05, 5, 0, 0, TAU); c.fill(); c.restore();
      if (sp > 0.03) {
        c.strokeStyle = 'rgba(200,214,206,' + (0.5 * sp).toFixed(3) + ')'; c.lineWidth = 3; c.lineCap = 'round';
        [-22, -36, -48].forEach((yy, i) => {
          const x = -K.half - 12 - 18 * W5.hash(i + 5);
          c.beginPath(); c.moveTo(x, yy); c.lineTo(x - 22 - 22 * sp, yy); c.stroke();
        });
      }
      wheel(c, -K.wheelX, -K.wheelR, K.wheelR, rot);
      wheel(c, K.wheelX, -K.wheelR, K.wheelR, rot);
      c.beginPath();
      c.moveTo(-K.half + 14, -K.bodyTop); c.lineTo(-K.half + 24, -K.bodyTop - 22);
      c.lineTo(K.half - 30, -K.bodyTop - 22); c.lineTo(K.half - 12, -K.bodyTop); c.closePath();
      c.fillStyle = '#3f74bd'; c.fill(); c.strokeStyle = '#16243a'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#bfe3f2';
      c.beginPath(); c.moveTo(-K.half + 22, -K.bodyTop - 3); c.lineTo(-K.half + 28, -K.bodyTop - 18); c.lineTo(-3, -K.bodyTop - 18); c.lineTo(-3, -K.bodyTop - 3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(3, -K.bodyTop - 3); c.lineTo(3, -K.bodyTop - 18); c.lineTo(K.half - 32, -K.bodyTop - 18); c.lineTo(K.half - 20, -K.bodyTop - 3); c.closePath(); c.fill();
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const bg = c.createLinearGradient(0, -K.bodyTop, 0, -K.bodyBot);
      bg.addColorStop(0, '#5b8fd6'); bg.addColorStop(1, '#2f5a99');
      c.fillStyle = bg; W5.rr(c, -K.half, -K.bodyTop, K.half * 2, K.bodyTop - K.bodyBot, 10); c.fill(); c.restore();
      c.strokeStyle = '#16243a'; c.lineWidth = 2; W5.rr(c, -K.half, -K.bodyTop, K.half * 2, K.bodyTop - K.bodyBot, 10); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-K.half + 10, -K.bodyTop + 3); c.lineTo(K.half - 10, -K.bodyTop + 3); c.stroke();
      c.fillStyle = '#fff3c4'; W5.rr(c, K.half - 7, -K.bodyTop + 7, 6, 8, 2); c.fill();
      c.fillStyle = '#e0605a'; W5.rr(c, -K.half + 1, -K.bodyTop + 7, 5, 8, 2); c.fill();
      c.restore();
    });
  }

  /* ═══════════ 坡度與車子位置（只看 s，不累積狀態） ═══════════ */
  function thAt(s) {
    if (s.n === 2) return lerp(15, 30, ease(seg(s.u, 0.8, 3.0)));
    if (s.n === 3) return lerp(30, 60, ease(seg(s.u, 0.8, 3.4)));
    return TH[s.n];
  }
  const slideD = n => K_SLIDE * Math.sin(TH[n] * DEG);
  const sEnd = n => S0 - slideD(n);
  function carS(s) {
    const w = SLIDE[s.n];
    if (!w) return s.n === 4 ? S4 : S0;
    return S0 - slideD(s.n) * ease(seg(s.u, w[0], w[1]));
  }
  function carSpeed(s) {
    const w = SLIDE[s.n];
    if (!w) return 0;
    const t = seg(s.u, w[0], w[1]);
    return t > 0 && t < 1 ? 4 * t * (1 - t) * Math.sin(TH[s.n] * DEG) / Math.sin(60 * DEG) : 0;
  }

  /* ═══════════ 力的箭頭（同 slope） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw, ticks) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (a <= 0.02 || len < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.shadowColor = 'transparent';
    if (ticks) {
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 2;
      for (let d = CELL; d < len - 20; d += CELL) {
        const x = x0 + ux * d, y = y0 + uy * d;
        c.beginPath(); c.moveTo(x - uy * (lw / 2 + 3), y + ux * (lw / 2 + 3)); c.lineTo(x + uy * (lw / 2 + 3), y - ux * (lw / 2 + 3)); c.stroke();
      }
    }
    c.restore();
  }
  function vecArrow(c, O, v, g, a, col, lw, ticks) {
    if (g <= 0.01) return;
    const t = px(O, v, g);
    fArrow(c, O.x, O.y, t.x, t.y, a, col, lw, ticks);
  }
  function dashLine(c, x0, y0, x1, y1, col, a, lw) {
    withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = col; c.lineWidth = lw || 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
    });
  }
  function apDot(c, O, a, col) {
    withA(c, a, () => {
      W5.glow(c, O.x, O.y, 24, col || W_COL, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(O.x, O.y, 8, 0, TAU); c.fill();
      W5.ball(c, O.x, O.y, 6, WHITE);
    });
  }
  /* 長方形（同 slope；直角記號用目前的坡度） */
  function rectangle(c, g, O, tip, ea, eb, fillA, a) {
    if (a <= 0.02) return;
    withA(c, a * fillA, () => {
      c.fillStyle = 'rgba(246,243,234,0.07)';
      c.beginPath(); c.moveTo(O.x, O.y); c.lineTo(ea.x, ea.y); c.lineTo(tip.x, tip.y); c.lineTo(eb.x, eb.y); c.closePath(); c.fill();
    });
    dashLine(c, tip.x, tip.y, ea.x, ea.y, 'rgba(246,243,234,0.85)', a * fillA, 3);
    dashLine(c, tip.x, tip.y, eb.x, eb.y, 'rgba(246,243,234,0.85)', a * fillA, 3);
    withA(c, a * fillA, () => {
      const q = 14, u = g.t, n = g.nIn;
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(O.x + u.x * q, O.y + u.y * q); c.lineTo(O.x + u.x * q + n.x * q, O.y + u.y * q + n.y * q); c.lineTo(O.x + n.x * q, O.y + n.y * q);
      c.stroke();
    });
  }

  /* ═══════════ 力與標籤（第 1～3 步：作用點＝車身中心 O） ═══════════ */
  function forces(c, g, O, A) {
    const D = decompose(g, WV), SV = D.S, PV = D.Pr;
    const tipW = px(O, WV), eS = px(O, SV), eP = px(O, PV);
    rectangle(c, g, O, tipW, eS, eP, A.rect, A.all);
    vecArrow(c, O, WV, A.gW, A.all * A.wA, W_COL, 8, true);
    vecArrow(c, O, SV, A.gS, A.all, S_COL, 9, true);
    vecArrow(c, O, PV, A.gP, A.all, P_COL, 9, true);
    apDot(c, O, A.all * A.dot);
    /* W 標籤：緩坡放在 W 右邊；陡坡（右邊被下滑力與 θ 角占住）換到左邊，抬坡途中交叉淡換 */
    const wR = clamp01((53 - g.thDeg) / 6), wStr = L('重力 W = ', 'Weight W = ') + gwOf(WV) + ' gw';
    P(c, A.all * A.lW * wR, wStr, O.x + 18, tipW.y - 14, W_COL, 22, 'left');
    P(c, A.all * A.lW * (1 - wR), wStr, O.x - 18, tipW.y - 14, W_COL, 22, 'right');
    P(c, A.all * A.lS, L('下滑力 = ', 'Down-slope = ') + gwOf(SV) + ' gw', eS.x + 14, eS.y - 8, S_COL, 22, 'left');
    /* 壓迫力標籤：在尖端左邊；若剛好落在地面線附近（會碰到 March 的鞋），整個移到地面線下方 */
    let py = eP.y + 4;
    if (py > GY - 30 && py < GY + 24) py = GY + 24;
    P(c, A.all * A.lP, L('壓迫力 = ', 'Pressing = ') + gwOf(PV) + ' gw', eP.x - 14, py, P_COL, 22, 'right');
  }

  /* ═══════════ 右上角表格（坡度／下滑力／壓迫力） ═══════════ */
  const TB = { x0: 604, cw: [90, 128, 124], y0: 92, rh: 40 };
  TB.x1 = TB.x0 + TB.cw.reduce((a, b) => a + b, 0);
  const colX = i => TB.x0 + TB.cw.slice(0, i).reduce((a, b) => a + b, 0);
  const colC = i => colX(i) + TB.cw[i] / 2;
  const rowY = r => TB.y0 + TB.rh * r;            /* r＝0 表頭；1～3 資料列；4 趨勢列 */
  const ROW_T = { 1: 7.0, 2: 6.4, 3: 6.6 };       /* 每一步填入的時間（滑完之後） */
  function table(c, s, a) {
    if (a <= 0.02) return;
    const trend = fin(s, 3, 7.0, 0.5);
    const rows = 3 + (trend > 0.02 ? trend : 0);
    const y1 = rowY(1) + TB.rh * rows;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.78)'; W5.rr(c, TB.x0, TB.y0, TB.x1 - TB.x0, y1 - TB.y0, 12); c.fill();
      c.fillStyle = 'rgba(246,243,234,0.08)'; c.fillRect(TB.x0 + 1, TB.y0 + 1, TB.x1 - TB.x0 - 2, TB.rh - 1);
      c.strokeStyle = 'rgba(163,184,176,0.45)'; c.lineWidth = 1.5;
      for (let r = 1; r < rows; r++) { c.beginPath(); c.moveTo(TB.x0 + 6, rowY(r)); c.lineTo(TB.x1 - 6, rowY(r)); c.stroke(); }
      for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(colX(i), TB.y0 + 6); c.lineTo(colX(i), y1 - 6); c.stroke(); }
      c.strokeStyle = 'rgba(163,184,176,0.7)'; c.lineWidth = 2; W5.rr(c, TB.x0, TB.y0, TB.x1 - TB.x0, y1 - TB.y0, 12); c.stroke();
    });
    const hy = rowY(0) + TB.rh / 2;
    T(c, a, L('坡度', 'Angle'), colC(0), hy, R_COL, 22, 'center');
    T(c, a, L('下滑力', 'Down-slope'), colC(1), hy, S_COL, 22, 'center');
    T(c, a, L('壓迫力', 'Pressing'), colC(2), hy, P_COL, 22, 'center');
    for (let r = 1; r <= 3; r++) {
      const ra = a * fin(s, r, ROW_T[r], 0.5);
      if (ra <= 0.02) continue;
      const g = slopeGeom(TH[r], SLOPE_LEN), D = decompose(g, WV), y = rowY(r) + TB.rh / 2;
      /* 本步剛填入的一列：黃框亮一下後留淡框 */
      if (s.n === r) withA(c, ra, () => {
        c.strokeStyle = W5.rgba(R_COL, 0.75); c.lineWidth = 2.5;
        W5.rr(c, TB.x0 + 4, rowY(r) + 3, TB.x1 - TB.x0 - 8, TB.rh - 6, 8); c.stroke();
      });
      T(c, ra, TH[r] + '°', colC(0), y, R_COL, 22, 'center', true);
      T(c, ra, gwOf(D.S) + ' gw', colC(1), y, S_COL, 22, 'center', true);
      T(c, ra, gwOf(D.Pr) + ' gw', colC(2), y, P_COL, 22, 'center', true);
    }
    if (trend > 0.02) {
      const y = rowY(4) + TB.rh / 2;
      T(c, a * trend, L('越陡', 'Steeper'), colC(0), y, WHITE, 22, 'center');
      trendCell(c, a * trend, colC(1), y, true, L('變大', 'Bigger'), S_COL);
      trendCell(c, a * trend, colC(2), y, false, L('變小', 'Smaller'), P_COL);
    }
  }
  function trendCell(c, a, cx, y, up, str, col) {
    const w = W5.tw(c, str, 22), x0 = cx - (w + 20) / 2;
    withA(c, a, () => W5.arrow(c, x0 + 6, up ? y + 10 : y - 10, x0 + 6, up ? y - 11 : y + 11, col, 4, 11));
    T(c, a, str, x0 + 20, y, col, 22, 'left');
  }

  /* 左上方的說明句（中文一行；英文太長時拆兩行） */
  function msg(c, a, zh, en, col) {
    if (a <= 0.02) return;
    const lines = isEn() ? (Array.isArray(en) ? en : [en]) : [zh];
    lines.forEach((t, i) => P(c, a, t, MSG_X, MSG_Y + i * 44, col, 24, 'left'));
  }

  /* ═══════════ 第 1～3 步 ═══════════ */
  const KEYS = {
    1: ['緩坡 15°：下滑力小', 'Gentle 15°: small down-slope part'],
    2: ['坡度 30°：下滑力變大', '30°: the down-slope part grows'],
    3: ['陡坡 60°：車子很快滑下', 'Steep 60°: the car speeds down'],
    4: ['壓迫力與正向力', 'Pressing force and N']
  };
  function keyPill(c, s) {
    const k = KEYS[s.n];
    P(c, fin(s, s.n, 0.3, 0.5), L(k[0], k[1]), 480, KEY_Y, WHITE, 24);
  }

  function step1(c, s, g, O, carA) {
    const n = 1, u = s.u;
    thetaArc(c, g, fin(s, n, 0.8, 0.5), 0);
    forces(c, g, O, {
      all: carA, dot: fin(s, n, 1.2, 0.4), gW: ease(seg(u, 1.4, 2.3)), wA: 1, lW: fin(s, n, 2.3, 0.4),
      rect: fin(s, n, 2.8, 0.6), gS: ease(seg(u, 3.2, 3.9)), lS: fin(s, n, 3.9, 0.4), gP: ease(seg(u, 4.0, 4.8)), lP: fin(s, n, 4.8, 0.4)
    });
    msg(c, fin(s, n, 5.0, 0.5), '下滑力小 → 車子慢慢滑', 'Small down-slope part → the car rolls slowly', S_COL);
  }
  function step2(c, s, g, O, carA) {
    const n = 2;
    thetaArc(c, g, 1, fin(s, n, 0.8, 0.3) * fout(s, n, 3.0, 0.4));
    /* 抬坡途中：箭頭與長方形跟著變形，數字標籤先收起（避免掃過 March），停好再出現 */
    const lab = Math.min(1, fout(s, n, 0.7, 0.3) + fin(s, n, 3.0, 0.4));
    forces(c, g, O, { all: carA, dot: 1, gW: 1, wA: 1, lW: lab, rect: 1, gS: 1, lS: lab, gP: 1, lP: lab });
    msg(c, fin(s, n, 0.8, 0.4) * fout(s, n, 3.6, 0.3), '把斜面抬高到 30°', 'Raise the slope to 30°', WHITE);
    msg(c, fin(s, n, 4.0, 0.5), '下滑力變大 → 滑得比較快', ['Bigger down-slope part', '→ the car rolls faster'], S_COL);
  }
  function step3(c, s, g, O, carA) {
    const n = 3;
    thetaArc(c, g, 1, fin(s, n, 0.8, 0.3) * fout(s, n, 3.4, 0.4));
    const lab = Math.min(1, fout(s, n, 0.7, 0.3) + fin(s, n, 3.4, 0.4));
    forces(c, g, O, { all: carA, dot: 1, gW: 1, wA: 1, lW: lab, rect: 1, gS: 1, lS: lab, gP: 1, lP: lab });
    msg(c, fin(s, n, 0.8, 0.4) * fout(s, n, 3.8, 0.3), '再抬高到 60°', 'Raise it to 60°', WHITE);
    msg(c, fin(s, n, 4.2, 0.5) * fout(s, n, 6.9, 0.3), '下滑力更大 → 車子很快滑下', ['Even bigger down-slope part', '→ the car speeds down'], S_COL);
    const m = fin(s, n, 7.2, 0.5);
    if (m > 0.02) W5.glow(c, 200, MSG_Y + 10, 200, R_COL, 0.10 * m);
    msg(c, m, '越陡：下滑力越大，壓迫力越小', ['Steeper: bigger down-slope part,', 'smaller pressing force'], R_COL);
  }

  /* ═══════════ 第 4 步：壓迫力與正向力 ═══════════ */
  const Z = { x: 790, y: 190, r: 90, m: 2.0 };    /* 接觸面放大圈 */
  function inset(c, g, sNow, Cc, a, grow) {
    if (a <= 0.02) return;
    const r = Z.r * (0.4 + 0.6 * grow);
    /* 原處的小圈＋連線 */
    withA(c, a, () => {
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(Cc.x, Cc.y, 22, 0, TAU); c.stroke();
      const dx = Z.x - Cc.x, dy = Z.y - Cc.y, d = Math.hypot(dx, dy);
      c.save(); c.setLineDash([6, 6]); c.lineWidth = 2;
      c.beginPath(); c.moveTo(Cc.x + dx / d * 22, Cc.y + dy / d * 22); c.lineTo(Z.x - dx / d * r, Z.y - dy / d * r); c.stroke(); c.restore();
    });
    /* 放大的畫面 */
    withA(c, a, () => {
      c.save();
      c.beginPath(); c.arc(Z.x, Z.y, r, 0, TAU); c.closePath();
      c.fillStyle = COL.bg; c.fill(); c.clip();
      const m = Z.m * r / Z.r;
      c.translate(Z.x, Z.y); c.scale(m, m); c.translate(-Cc.x, -Cc.y);
      drawSlope(c, g);
      drawCar(c, g, sNow, (S0 - sNow) / CAR.wheelR, 1, 0);
      c.restore();
      /* 放大圈內：大小相同、方向相反的一對箭頭，起點都在接觸面中心 */
      const k = 62 * r / Z.r;
      fArrow(c, Z.x, Z.y, Z.x + g.nIn.x * k, Z.y + g.nIn.y * k, 1, P_COL, 7, false);
      fArrow(c, Z.x, Z.y, Z.x + g.nOut.x * k, Z.y + g.nOut.y * k, 1, N_COL, 7, false);
      W5.ball(c, Z.x, Z.y, 6, WHITE);
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 3;
      c.beginPath(); c.arc(Z.x, Z.y, r, 0, TAU); c.stroke();
    });
  }
  function step4(c, s, g, O, Cc, sNow, carA) {
    const n = 4, u = s.u;
    thetaArc(c, g, 1, 0);
    const D = decompose(g, WV), PV = D.Pr, NV = mul(PV, -1);
    /* W 淡淡留著（壓迫力從它來）；壓迫力先在車身中心，再移到接觸面、壓進斜面 */
    vecArrow(c, O, WV, 1, carA * 0.3, W_COL, 8, false);
    const mv = ease(seg(u, 1.2, 2.2));
    const Pp = { x: lerp(O.x, Cc.x, mv), y: lerp(O.y, Cc.y, mv) };
    const dent = fin(s, n, 2.2, 0.3) * fout(s, n, 3.4, 0.6);
    if (dent > 0.02) W5.glow(c, Cc.x, Cc.y, 46, P_COL, 0.5 * dent);
    vecArrow(c, Pp, PV, 1, carA * fin(s, n, 0.4, 0.5), P_COL, 9, true);
    /* 正向力 N：起點＝車子與斜面的接觸面中心，垂直斜面向外，長度＝壓迫力 */
    vecArrow(c, Cc, NV, ease(seg(u, 3.0, 4.2)), carA, N_COL, 9, true);
    apDot(c, Pp, carA * fin(s, n, 0.4, 0.5) * (1 - mv), W_COL);
    apDot(c, Cc, carA * fin(s, n, 2.0, 0.4), N_COL);
    const tP = px(Cc, PV), tN = px(Cc, NV);
    T(c, fin(s, n, 2.2, 0.4), L('壓迫力', 'Pressing'), tP.x - 16, tP.y + 6, P_COL, 22, 'right');
    T(c, fin(s, n, 4.2, 0.4), 'N', tN.x + 16, tN.y - 4, N_COL, 24, 'left', true);
    msg(c, fin(s, n, 1.2, 0.4) * fout(s, n, 2.8, 0.3), '車子把斜面往下壓', 'The car presses on the slope', P_COL);
    msg(c, fin(s, n, 3.0, 0.4), '斜面把車子推回來', 'The slope pushes the car back', N_COL);
    /* 右邊：放大圈＋等式 */
    const zA = fin(s, n, 4.8, 0.6);
    inset(c, g, sNow, Cc, zA, ease(seg(u, 4.8, 5.6)));
    T(c, zA, L('接觸面放大', 'Contact, zoomed'), Z.x, Z.y - Z.r - 12, DIM, 22, 'center');
    const ex = Z.x;
    P(c, fin(s, n, 6.0, 0.4), L('壓迫力 = ', 'Pressing = ') + gwOf(PV) + ' gw', ex, 318, P_COL, 22, 'center');
    const eq = fin(s, n, 6.6, 0.4);
    T(c, eq, '＝', ex, 357, R_COL, 26, 'center');
    withA(c, eq, () => {   /* 雙向小箭頭：粉往下（壓斜面）、綠往上（推車子） */
      W5.arrow(c, ex - 52, 357, ex - 52, 375, P_COL, 4, 11);
      W5.arrow(c, ex - 40, 357, ex - 40, 339, N_COL, 4, 11);
      W5.arrow(c, ex + 40, 357, ex + 40, 375, P_COL, 4, 11);
      W5.arrow(c, ex + 52, 357, ex + 52, 339, N_COL, 4, 11);
    });
    P(c, fin(s, n, 6.8, 0.4), L('正向力 N = ', 'Normal force N = ') + gwOf(NV) + ' gw', ex, 396, N_COL, 22, 'center');
    T(c, fin(s, n, 7.4, 0.4), L('大小相同、方向相反', 'Same size, opposite way'), ex, 434, R_COL, 22, 'center');
    /* 最下面：兩個力作用在不同物體上 */
    const b1 = fin(s, n, 8.4, 0.5), b2 = fin(s, n, 9.4, 0.5);
    if (b1 > 0.02) W5.glow(c, 380, 498, 220, R_COL, 0.08 * b1);
    P(c, b1, L('壓迫力作用在斜面上，正向力作用在車子上', 'Pressing acts on the slope; N acts on the car'), 380, 476, WHITE, 24, 'center');
    P(c, b2, L('作用力與反作用力，不是同一個力', 'Action and reaction: not the same force'), 380, 518, R_COL, 24, 'center');
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const n = s.n, k = n === 1 ? s.k : 1;
    const g = slopeGeom(thAt(s), SLOPE_LEN);
    const sNow = carS(s), O = g.carC(sNow), Cc = g.surf(sNow);
    backdrop(c);
    ground(c);
    legend(c, 1);
    drawSlope(c, g);
    /* March：第 3 步車子衝下時嚇一跳 */
    const shock = n === 3 ? fin(s, 3, 4.8, 0.4) : 0;
    marchShadow(c, k);
    drawMarch(c, 'water', k * (1 - shock));
    drawMarch(c, 'shock', k * shock);
    /* 車子：第 2～4 步開頭，上一步滑下去的車淡出、在起點（S0；第 4 步 S4）重新放好 */
    const carA = n === 1 ? k : fin(s, n, 0.15, 0.5);
    if (n >= 2) drawCar(c, g, sEnd(n - 1), (S0 - sEnd(n - 1)) / CAR.wheelR, fout(s, n, 0, 0.4), 0);
    drawCar(c, g, sNow, (S0 - sNow) / CAR.wheelR, carA, carSpeed(s));
    /* 表格：第 1～3 步；第 4 步收起 */
    table(c, s, n === 4 ? fout(s, 4, 0, 0.6) : (n === 1 ? fin(s, 1, 0.6, 0.6) : 1));
    keyPill(c, s);
    if (n === 1) step1(c, s, g, O, carA);
    if (n === 2) step2(c, s, g, O, carA);
    if (n === 3) step3(c, s, g, O, carA);
    if (n === 4) step4(c, s, g, O, Cc, sNow, carA);
  }

  W5.register('steep', { canvas: 'cvs-steep', steps: DUR, draw });
})();
