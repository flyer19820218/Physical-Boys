/* ==================================================================
   mechanics_2 ｜ 斜面上的重力分解：下滑力與壓迫力（cvs-slope，960×540）
   四步：1 重力垂直向下 → 2 兩個方向 → 3 拆成兩個分力 → 4 合起來還是 W
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_rect（長方形分解）。

   比例：PX_PER_GW＝2.2（1 gw＝2.2 px，整支動畫不變）；1 格＝10 gw＝22 px。
         （2.2 是放得下的最大值：起點時 W、壓迫力、長方形都落在坡體內，滑到坡底附近時 W 尖端仍在畫布內。）
         背景淡方格以「車子起點的作用點 C0」為格點對齊；力的箭頭上每 10 gw 一個刻痕，學生可以數格。
   力（gw，向量由程式算）：重力 W＝100 gw 垂直向下（珊瑚）；坡度 θ＝30°。
         下滑力＝W 在「沿斜面向下」方向的投影（W·sinθ＝50 gw，青）；
         壓迫力＝W 在「垂直斜面、壓進斜面」方向的投影（W·cosθ≈87 gw，粉）；兩者相加＝W（黃，第 4 步）。
         畫面上的數字一律 Math.round(Math.hypot(x, y))；箭頭長＝gw × PX_PER_GW。
   場景（側視）：地面線 GY；斜坡＝直角三角形，θ 角頂點 V 在右邊地面（XV, GY），坡面往左上升，長 SLOPE_LEN；
         小車（本檔自畫：車身、車窗、兩個輪子）平貼坡面，車頭朝坡下；作用點＝車身中心（坡面上方 CAR.hc）。
         車子位置用「離 V 的坡面距離 s」表示：carC(G, s)。第 1～3 步前段停在 S0，第 3 步滑到 S1 附近緩停。
         March（全身圖 touch_water／touch_shock，腳踩 GY）站在坡底右邊看著。
   ── 給 steep（15°／30°／60°＋正向力 N）沿用 ──
         常數：PX_PER_GW、CELL、W_GW、GY、XV、SLOPE_LEN、CAR、S0、S1、MARCH
         函式：slopeGeom(thDeg, len) → { th, t, nIn, nOut, V, top, foot, surf(s), carC(s) }
               decompose(G, v) → { S（下滑分量）, Pr（壓迫分量）}
               drawSlope / thetaArc / drawCar / drawMarch / backdrop / ground / legend / fArrow / vecArrow / dashLine / apDot
         正向力 N 可直接用 { x: -Pr.x, y: -Pr.y }（沿 G.nOut），顏色 COL.green。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const W_COL = COL.coral;           /* 重力 W：珊瑚（被分解的原力） */
  const S_COL = COL.teal;            /* 下滑力：青 */
  const P_COL = COL.pink;            /* 壓迫力：粉 */
  const R_COL = COL.yellow;          /* 合起來：黃 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 9, 12, 10];        /* 總長 40 秒 */

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
  const grow = (s, n, a, b) => (s.n > n ? 1 : s.n < n ? 0 : ease(seg(s.u, a, b)));

  /* ═══════════ 共用常數（steep 沿用） ═══════════ */
  const PX_PER_GW = 2.2;             /* 1 gw ＝ 2.2 px（整支動畫不變；2.4 時 W 會穿出坡體、滑到坡底後出畫布） */
  const CELL = 10 * PX_PER_GW;       /* 1 格 ＝ 10 gw ＝ 22 px */
  const W_GW = 100;                  /* 重力 */
  const TH_DEG = 30;                 /* 本支的坡度 */
  const GY = 400;                    /* 地面線 */
  const XV = 600;                    /* 斜坡 θ 角頂點（坡底）x */
  const SLOPE_LEN = 500;             /* 坡面長（沿斜面，px） */
  const CAR = { half: 58, wheelR: 13, wheelX: 37, bodyBot: 14, bodyTop: 50, hc: 32 };  /* 車：半長、輪半徑、輪距、車身上下緣（離坡面）、作用點離坡面 */
  const S0 = 390;                    /* 車子起點（離 V 的坡面距離） */
  const S1 = 125;                    /* 第 3 步滑到這裡緩停 */
  const MARCH = { x: 850, sc: 0.42 };/* March 身體中線 x、縮放 */
  const KEY_Y = 62, Q_Y = 108, BOT_Y = 505;

  /* 斜坡幾何：t＝沿斜面往坡下的單位向量；nIn＝垂直斜面、壓進斜面；nOut＝垂直斜面、離開斜面（正向力方向） */
  function slopeGeom(thDeg, len) {
    const th = thDeg * DEG, cs = Math.cos(th), sn = Math.sin(th);
    const t = { x: cs, y: sn }, nIn = { x: -sn, y: cs }, nOut = { x: sn, y: -cs };
    const V = { x: XV, y: GY };
    const top = { x: XV - len * cs, y: GY - len * sn }, foot = { x: XV - len * cs, y: GY };
    const surf = s => ({ x: V.x - t.x * s, y: V.y - t.y * s });
    const carC = s => { const p = surf(s); return { x: p.x + nOut.x * CAR.hc, y: p.y + nOut.y * CAR.hc }; };
    return { thDeg, th, t, nIn, nOut, V, top, foot, len, surf, carC };
  }
  const G = slopeGeom(TH_DEG, SLOPE_LEN);

  /* 向量 */
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const mul = (v, k) => ({ x: v.x * k, y: v.y * k });
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const px = (o, v, g) => ({ x: o.x + v.x * PX_PER_GW * (g == null ? 1 : g), y: o.y + v.y * PX_PER_GW * (g == null ? 1 : g) });
  function decompose(g, v) { return { S: mul(g.t, dot(v, g.t)), Pr: mul(g.nIn, dot(v, g.nIn)) }; }

  const WV = { x: 0, y: W_GW };      /* 重力（畫面座標 y 向下） */
  const DC = decompose(G, WV), SV = DC.S, PV = DC.Pr, RV = add(SV, PV);
  const C0 = G.carC(S0);

  /* ═══════════ 角色圖（March 全身） ═══════════ */
  const IMG = {};
  [['water', 'touch_water'], ['shock', 'touch_shock']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/march/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;
  const SOLE = { water: 469, shock: 480 };          /* 原圖鞋底所在列 */
  const BODY = { water: 155, shock: 151 };          /* 原圖身體中線（shock 為左右翻轉後） */
  const FLIP = { water: false, shock: true };       /* shock 原圖面向右，翻轉成面向坡 */
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

  /* ═══════════ 背景：淡方格（以 C0 為格點）＋地面 ═══════════ */
  function backdrop(c, O) {
    const gl = c.createRadialGradient(420, 230, 30, 420, 230, 560);
    gl.addColorStop(0, 'rgba(255,128,64,0.05)'); gl.addColorStop(1, 'rgba(255,128,64,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    c.strokeStyle = 'rgba(246,243,234,0.08)'; c.lineWidth = 1.2;
    const y0 = O.y - Math.floor((O.y - 86) / CELL) * CELL;
    for (let x = O.x - Math.floor(O.x / CELL) * CELL; x <= 960; x += CELL) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, GY); c.stroke(); }
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
  function legend(c, a) {
    const y = 512;
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(22, y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(22, y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), 22 + CELL + 10, y, DIM, 22, 'left');
  }

  /* ═══════════ 斜坡（深色石面＋斜紋＋坡面亮線） ═══════════ */
  function drawSlope(c, g) {
    const V = g.V, A = g.top, F = g.foot;
    c.save();
    c.beginPath(); c.moveTo(V.x, V.y); c.lineTo(A.x, A.y); c.lineTo(F.x, F.y); c.closePath();
    c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
    const fill = c.createLinearGradient(A.x, A.y, A.x + g.nIn.x * 200, A.y + g.nIn.y * 200);
    fill.addColorStop(0, '#4a5f55'); fill.addColorStop(1, '#2c3d36');
    c.fillStyle = fill; c.fill(); c.restore();
    c.clip();
    /* 紋理：與坡面平行的層理＋細碎點 */
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
    /* 坡面亮線、垂直邊 */
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(V.x, V.y); c.stroke();
    c.strokeStyle = 'rgba(246,243,234,0.30)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(F.x, F.y); c.stroke();
    /* 直角記號 */
    const q = 14;
    c.beginPath(); c.moveTo(F.x + q, F.y); c.lineTo(F.x + q, F.y - q); c.lineTo(F.x, F.y - q); c.stroke();
    c.restore();
  }
  /* 坡度角弧（在 V）；glow：發亮強度 0..1 */
  function thetaArc(c, g, a, glow, labA) {
    if (a <= 0.02) return;
    const r = 58;
    withA(c, a, () => {
      if (glow > 0.02) W5.glow(c, g.V.x - 40, g.V.y - 12, 60, R_COL, 0.35 * glow);
      c.fillStyle = W5.rgba(R_COL, 0.18);
      c.beginPath(); c.moveTo(g.V.x, g.V.y); c.arc(g.V.x, g.V.y, r, Math.PI, Math.PI + g.th, false); c.closePath(); c.fill();
      c.strokeStyle = R_COL; c.lineWidth = 3 + 2 * glow;
      c.beginPath(); c.arc(g.V.x, g.V.y, r, Math.PI, Math.PI + g.th, false); c.stroke();
    });
    T(c, a * (labA == null ? 1 : labA), 'θ = ' + g.thDeg + '°', g.V.x + 20, g.V.y - 26, R_COL, 22, 'left', true);
  }

  /* ═══════════ 小車（平貼坡面；s＝離 V 的坡面距離，rot＝輪子轉角） ═══════════ */
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
      /* 本地座標：x 往坡下（車頭）、y 負＝離開坡面 */
      /* 影子 */
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
      c.beginPath(); c.ellipse(0, 1, K.half * 1.05, 5, 0, 0, TAU); c.fill(); c.restore();
      /* 速度線（車尾後方） */
      if (sp > 0.03) {
        c.strokeStyle = 'rgba(200,214,206,' + (0.5 * sp).toFixed(3) + ')'; c.lineWidth = 3; c.lineCap = 'round';
        [-22, -36, -48].forEach((yy, i) => {
          const x = -K.half - 12 - 18 * W5.hash(i + 5);
          c.beginPath(); c.moveTo(x, yy); c.lineTo(x - 22 - 22 * sp, yy); c.stroke();
        });
      }
      /* 輪子 */
      wheel(c, -K.wheelX, -K.wheelR, K.wheelR, rot);
      wheel(c, K.wheelX, -K.wheelR, K.wheelR, rot);
      /* 車廂（上半，梯形） */
      c.beginPath();
      c.moveTo(-K.half + 14, -K.bodyTop); c.lineTo(-K.half + 24, -K.bodyTop - 22);
      c.lineTo(K.half - 30, -K.bodyTop - 22); c.lineTo(K.half - 12, -K.bodyTop); c.closePath();
      c.fillStyle = '#3f74bd'; c.fill(); c.strokeStyle = '#16243a'; c.lineWidth = 2; c.stroke();
      /* 車窗 */
      c.fillStyle = '#bfe3f2';
      c.beginPath(); c.moveTo(-K.half + 22, -K.bodyTop - 3); c.lineTo(-K.half + 28, -K.bodyTop - 18); c.lineTo(-3, -K.bodyTop - 18); c.lineTo(-3, -K.bodyTop - 3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(3, -K.bodyTop - 3); c.lineTo(3, -K.bodyTop - 18); c.lineTo(K.half - 32, -K.bodyTop - 18); c.lineTo(K.half - 20, -K.bodyTop - 3); c.closePath(); c.fill();
      /* 車身（下半） */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const bg = c.createLinearGradient(0, -K.bodyTop, 0, -K.bodyBot);
      bg.addColorStop(0, '#5b8fd6'); bg.addColorStop(1, '#2f5a99');
      c.fillStyle = bg; W5.rr(c, -K.half, -K.bodyTop, K.half * 2, K.bodyTop - K.bodyBot, 10); c.fill(); c.restore();
      c.strokeStyle = '#16243a'; c.lineWidth = 2; W5.rr(c, -K.half, -K.bodyTop, K.half * 2, K.bodyTop - K.bodyBot, 10); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-K.half + 10, -K.bodyTop + 3); c.lineTo(K.half - 10, -K.bodyTop + 3); c.stroke();
      /* 車燈、尾燈 */
      c.fillStyle = '#fff3c4'; W5.rr(c, K.half - 7, -K.bodyTop + 7, 6, 8, 2); c.fill();
      c.fillStyle = '#e0605a'; W5.rr(c, -K.half + 1, -K.bodyTop + 7, 5, 8, 2); c.fill();
      c.restore();
    });
  }
  /* 第 3 步滑動：s(u)；起步平順加速、到底端附近緩停 */
  function carS(s) {
    if (s.n < 3) return S0;
    if (s.n > 3) return S1;
    return lerp(S0, S1, ease(seg(s.u, 6.4, 9.8)));
  }
  function carSpeed(s) {
    if (s.n !== 3) return 0;
    const t = seg(s.u, 6.4, 9.8);
    return t > 0 && t < 1 ? 4 * t * (1 - t) : 0;
  }

  /* ═══════════ 力的箭頭（刻痕：每 10 gw 一格） ═══════════ */
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
  /* 作用點：白色小球＋珊瑚光 */
  function apDot(c, O, a) {
    withA(c, a, () => {
      W5.glow(c, O.x, O.y, 24, W_COL, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(O.x, O.y, 8, 0, TAU); c.fill();
      W5.ball(c, O.x, O.y, 6, WHITE);
    });
  }

  /* 兩條方向軸（淡）：沿著斜面（往坡下）、壓進斜面 */
  const AX_T = 176, AX_N = 200;
  function axes(c, O, gt, gn, a) {
    if (a <= 0.02) return;
    const et = { x: O.x + G.t.x * AX_T, y: O.y + G.t.y * AX_T }, en = { x: O.x + G.nIn.x * AX_N, y: O.y + G.nIn.y * AX_N };
    withA(c, a, () => {
      if (gt > 0.01) W5.arrow(c, O.x, O.y, lerp(O.x, et.x, gt), lerp(O.y, et.y, gt), 'rgba(246,243,234,0.6)', 2.5, 14);
      if (gn > 0.01) W5.arrow(c, O.x, O.y, lerp(O.x, en.x, gn), lerp(O.y, en.y, gn), 'rgba(246,243,234,0.6)', 2.5, 14);
    });
    T(c, a * clamp01(gt * 3 - 2), L('沿著斜面', 'Along the slope'), et.x + 12, et.y - 8, DIM, 22, 'left');
    T(c, a * clamp01(gn * 3 - 2), L('壓進斜面', 'Into the slope'), Math.max(en.x, 12 + W5.tw(c, L('壓進斜面', 'Into the slope'), 22) / 2), en.y + 24, DIM, 22, 'center');
  }
  /* W 與「壓進斜面」的夾角弧（在作用點） */
  function wnArc(c, O, sweep, a, glow) {
    if (a <= 0.02 || sweep <= 0.01) return;
    const a0 = Math.PI / 2, a1 = Math.atan2(G.nIn.y, G.nIn.x), r = 66;
    withA(c, a, () => {
      if (glow > 0.02) W5.glow(c, O.x - 14, O.y + 60, 60, R_COL, 0.35 * glow);
      c.fillStyle = W5.rgba(R_COL, 0.18);
      c.beginPath(); c.moveTo(O.x, O.y); c.arc(O.x, O.y, r, a0, lerp(a0, a1, sweep), false); c.closePath(); c.fill();
      c.strokeStyle = R_COL; c.lineWidth = 3 + 2 * glow;
      c.beginPath(); c.arc(O.x, O.y, r, a0, lerp(a0, a1, sweep), false); c.stroke();
    });
    /* 字放在 W 與壓進方向兩線之間、靠下（不壓到箭頭） */
    T(c, a * clamp01(sweep * 3 - 2), G.thDeg + '°', O.x - 8, O.y + 116, R_COL, 22, 'right', true);
  }

  /* 長方形：從尖端 tip 出發的兩條虛線到兩個分力的尖端 a、b；g1、g2 生長，fill 填色 */
  function rectangle(c, O, tip, ea, eb, g1, g2, fillA, a) {
    if (a <= 0.02) return;
    withA(c, a * fillA, () => {
      c.fillStyle = 'rgba(246,243,234,0.07)';
      c.beginPath(); c.moveTo(O.x, O.y); c.lineTo(ea.x, ea.y); c.lineTo(tip.x, tip.y); c.lineTo(eb.x, eb.y); c.closePath(); c.fill();
    });
    if (g1 > 0.01) dashLine(c, tip.x, tip.y, lerp(tip.x, ea.x, g1), lerp(tip.y, ea.y, g1), 'rgba(246,243,234,0.85)', a, 3);
    if (g2 > 0.01) dashLine(c, tip.x, tip.y, lerp(tip.x, eb.x, g2), lerp(tip.y, eb.y, g2), 'rgba(246,243,234,0.85)', a, 3);
    /* 直角記號（在 O） */
    withA(c, a * fillA, () => {
      const q = 14, u = G.t, n = G.nIn;
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(O.x + u.x * q, O.y + u.y * q); c.lineTo(O.x + u.x * q + n.x * q, O.y + u.y * q + n.y * q); c.lineTo(O.x + n.x * q, O.y + n.y * q);
      c.stroke();
    });
  }

  /* ═══════════ 標籤（位置跟著作用點 O） ═══════════ */
  function wLabel(c, O, a) {
    const tip = px(O, WV);
    P(c, a, L('重力 W = ', 'Weight W = ') + gwOf(WV) + ' gw', O.x + 18, tip.y - 20, W_COL, 22, 'left');
  }
  function sLabel(c, O, a, below) {
    const tip = px(O, SV);
    if (below) P(c, a, L('下滑力 = ', 'Down-slope = ') + gwOf(SV) + ' gw', O.x + 22, tip.y + 42, S_COL, 22, 'left');   /* 左緣避開 W／合力箭頭 */
    else P(c, a, L('下滑力 = ', 'Down-slope = ') + gwOf(SV) + ' gw', tip.x + 12, tip.y - 26, S_COL, 22, 'left');
  }
  /* below：起點時（尖端貼近坡的左邊，左邊放不下）放在尖端正下方的地面上；否則放在尖端左邊 */
  function pLabel(c, O, a, below) {
    const tip = px(O, PV), str = L('壓迫力 = ', 'Pressing = ') + gwOf(PV) + ' gw';
    if (below) {
      const ly = GY + 30;
      dashLine(c, tip.x, tip.y + 14, tip.x, ly - 20, W5.rgba(P_COL, 0.8), a, 2);
      P(c, a, str, Math.max(tip.x, 14 + (W5.tw(c, str, 22) + 28) / 2), ly, P_COL, 22, 'center');
    }
    else P(c, a, str, tip.x - 14, tip.y + 4, P_COL, 22, 'right');
  }
  function glowBottom(c, a, str, col, x) {
    x = x || 480;
    if (a > 0.02) W5.glow(c, x, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, x, BOT_Y, col, 24, 'center');
  }

  /* ── 第 1 步：重力垂直向下 ── */
  function step1(c, s, O) {
    const n = 1, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('重力垂直向下', 'Gravity points straight down'), 480, KEY_Y, WHITE, 24);
    P(c, fin(s, n, 1.0, 0.6), L('為什麼車子會往坡下滑，而不是直直陷進地面？', 'Why does the car roll down the slope, not sink straight in?'), 480, Q_Y, R_COL, 24);
    thetaArc(c, G, fin(s, n, 2.0, 0.5), 0);
    apDot(c, O, fin(s, n, 2.8, 0.4));
    vecArrow(c, O, WV, ease(seg(u, 3.2, 4.3)), 1, W_COL, 8, true);
    wLabel(c, O, fin(s, n, 4.3, 0.4));
    glowBottom(c, fin(s, n, 5.6, 0.5), L('W 是垂直向下，不是垂直斜面', 'W points straight down, not into the slope'), W_COL, 520);
  }

  /* ── 第 2 步：兩個方向 ── */
  function step2(c, s, O) {
    const n = 2, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('兩個方向', 'Two directions'), 480, KEY_Y, WHITE, 24);
    const dimW = lerp(1, 0.4, grow(s, n, 0.4, 1.0));
    const hiW = fin(s, n, 4.0, 0.4) * fout(s, n, 6.6, 0.5);
    axes(c, O, ease(seg(u, 1.0, 2.0)), ease(seg(u, 2.0, 3.0)), 1);
    const sweep = ease(seg(u, 4.2, 5.4));
    /* 兩個 30° 一起閃：包絡在 7.1 秒前收掉，最後 1.5 秒不動 */
    const glow = fin(s, n, 5.4, 0.3) * fout(s, n, 6.6, 0.5) * (0.5 + 0.5 * Math.sin(Math.max(0, u - 5.4) * 5));
    thetaArc(c, G, 1, glow);
    wnArc(c, O, sweep, 1, glow);
    vecArrow(c, O, WV, 1, Math.max(dimW, 0.9 * hiW), W_COL, 8, true);
    apDot(c, O, 1);
    wLabel(c, O, dimW);
    glowBottom(c, fin(s, n, 5.6, 0.5), L('W 和「壓進斜面」夾角 ＝ 坡度 30°', 'Angle between W and "into" = slope angle 30°'), R_COL, 520);
  }

  /* ── 第 3 步：拆成兩個分力（再滑下去） ── */
  function step3(c, s, O) {
    const n = 3, u = s.u;
    const tip = px(O, WV), eS = px(O, SV), eP = px(O, PV);
    const slide = u >= 6.4;
    P(c, fin(s, n, 0.3, 0.5), L('拆成兩個分力', 'Split in two'), 480, KEY_Y, WHITE, 24);
    const rectA = fout(s, n, 6.0, 0.5);
    axes(c, O, 1, 1, 0.55 * rectA * fout(s, n, 4.6, 0.4));
    rectangle(c, O, tip, eS, eP, ease(seg(u, 0.8, 1.8)), ease(seg(u, 1.6, 2.6)), ease(seg(u, 2.4, 3.0)), rectA);
    const wA = lerp(1, 0.35, fin(s, n, 5.2, 0.6));
    vecArrow(c, O, WV, 1, wA, W_COL, 8, false);
    vecArrow(c, O, SV, ease(seg(u, 3.0, 3.9)), 1, S_COL, 9, true);
    vecArrow(c, O, PV, ease(seg(u, 4.0, 4.9)), 1, P_COL, 9, true);
    apDot(c, O, 1);
    wLabel(c, O, fout(s, n, 5.2, 0.6));
    const lab = fout(s, n, 6.2, 0.3) + fin(s, n, 9.8, 0.4);
    sLabel(c, O, Math.min(1, lab) * fin(s, n, 3.9, 0.4), slide);
    pLabel(c, O, Math.min(1, lab) * fin(s, n, 4.9, 0.4), !slide);
    P(c, fin(s, n, 5.0, 0.5) * fout(s, n, 6.8, 0.4), L('壓迫力：把車子壓在斜面上', 'Pressing part: pushes the car onto the slope'), 480, Q_Y, P_COL, 24);
    P(c, fin(s, n, 7.0, 0.5), L('下滑力：把車子往坡下拉', 'Down-slope part: pulls the car downhill'), 480, Q_Y, S_COL, 24);
  }

  /* ── 第 4 步：合起來還是 W ── */
  function step4(c, s, O) {
    const n = 4, u = s.u;
    const tip = px(O, RV), eS = px(O, SV), eP = px(O, PV);
    P(c, fin(s, n, 0.3, 0.5), L('合起來還是 W', 'Together: still W'), 480, KEY_Y, WHITE, 24);
    /* 原來的 W（珊瑚，淡）：被黃色疊上 */
    const ghost = fin(s, n, 0.6, 0.5);
    vecArrow(c, O, WV, 1, ghost * 0.85, W_COL, 16, false);   /* 粗一點：黃箭頭疊上去後兩側還露出珊瑚邊 */
    rectangle(c, O, tip, eS, eP, ease(seg(u, 1.0, 2.0)), ease(seg(u, 1.6, 2.6)), ease(seg(u, 2.4, 3.0)), 1);
    vecArrow(c, O, SV, 1, 1, S_COL, 9, true);
    vecArrow(c, O, PV, 1, 1, P_COL, 9, true);
    vecArrow(c, O, RV, ease(seg(u, 3.0, 4.2)), 1, R_COL, 8, true);
    apDot(c, O, 1);
    sLabel(c, O, 1, true);
    pLabel(c, O, 1);
    const rLab = fin(s, n, 4.2, 0.4);
    P(c, rLab, L('合起來 = ', 'Together = ') + gwOf(RV) + L(' gw ＝ W', ' gw = W'), O.x + 18, tip.y - 20, R_COL, 22, 'left');
    const m1 = fin(s, n, 5.0, 0.5), m2 = fin(s, n, 6.4, 0.5);
    if (m1 > 0.02) W5.glow(c, 600, Q_Y, 220, R_COL, 0.10 * m1);
    P(c, m1, L('兩個分力合起來 ＝ W', 'The two parts together = W'), 600, Q_Y, R_COL, 24);
    P(c, m2, L('分力不是多出來的力，是 W 的兩種效果', 'The parts are not extra forces: they are two effects of W'), 600, Q_Y + 46, WHITE, 22);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const k = s.n === 1 ? s.k : 1;
    const sNow = carS(s), O = G.carC(sNow);
    const rot = (S0 - sNow) / CAR.wheelR;
    backdrop(c, C0);
    ground(c);
    legend(c, 1);
    drawSlope(c, G);
    /* θ 弧：第 1、2 步在 step 裡畫；第 3 步滑動前保留，之後淡出 */
    if (s.n === 3) thetaArc(c, G, fout(s, 3, 6.0, 0.5), 0);
    /* March：第 3 步車子滑下時換成嚇一跳 */
    const shock = s.n === 3 ? fin(s, 3, 7.0, 0.4) : 0;
    marchShadow(c, k);
    drawMarch(c, 'water', k * (1 - shock));
    drawMarch(c, 'shock', k * shock);
    drawCar(c, G, sNow, rot, k, carSpeed(s));
    if (s.n === 1) step1(c, s, O);
    if (s.n === 2) step2(c, s, O);
    if (s.n === 3) step3(c, s, O);
    if (s.n === 4) step4(c, s, O);
  }

  W5.register('slope', { canvas: 'cvs-slope', steps: DUR, draw });
})();
