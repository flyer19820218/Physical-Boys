/* ==================================================================
   mechanics_2 ｜ 夾角與合力：越張越小；單槓為何越張越痠（cvs-angle，960×540）
   四步：1 夾角 0°：最大 → 2 夾角變大 → 3 夾角 180°：最小 → 4 單槓越張越痠
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_parallelogram（方格地面、球＋插銷、同一支比例尺）。

   比例：PX_PER_GW＝3.2（1 gw＝3.2 px，整支動畫不變，同 parallelogram）；1 格＝10 gw＝32 px。
         第 1～3 步的方格地面、R–θ 圖的縱軸（每格 10 gw＝32 px）、第 4 步背景牆的方格，全部是同一個格。
   力（畫面座標，y 向下；單位 gw）：F₁＝(30, 0) 向右（青）；F₂＝40 gw、與 F₁ 夾角 θ（粉）；R＝F₁＋F₂（黃）。
         R(θ) 一律由向量加法算（Math.round(Math.hypot(x, y))）：0°→70、60°→61、90°→50、120°→36、180°→10。
         第 1 步 θ＝0°；第 2 步 θ：0°→60°（停）→90°（停）→120°（停）；第 3 步 θ：120°→180°。
   第 4 步（單槓正面）：體重 W＝60 gw（珊瑚，向下）吊在中央環上；兩條手臂（青、粉）從環連到單槓握點。
         環到單槓的垂直距離固定 ARM_H＝100 px，所以手臂長＝ARM_H／cos(θ/2)；
         每手拉力 T＝(W/2)／cos(θ/2)：0°→30、120°→60、150°→116 gw；箭頭長＝T×3.2 px＝96／cos(θ/2)，
         恰好是手臂長的 0.96 倍 → 箭頭永遠沿著手臂、尖端停在握點前。每支箭頭的垂直分量都是 30 gw（3 格）。
   版面：第 1～3 步左邊方格地面 MAT（作用點 O＝球心，插銷固定），右邊 R–θ 圖 GR（橫軸 θ 0～180°、縱軸 R 0～70 gw）；
         第 4 步換成單槓，右側 March（全身圖 touch_ready → touch_water，腳踩地面線 GY）當觀察員。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F1_COL = COL.teal, F2_COL = COL.pink, R_COL = COL.yellow, W_COL = COL.coral, OK_COL = COL.green;
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 11, 9, 12];        /* 總長 41 秒 */

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
  /* 固定寬度內的字：先量再縮，最小 22px */
  function fit(c, str, maxW, size, mono) { let z = size; while (z > 22 && W5.tw(c, str, z, mono) > maxW) z--; return z; }

  /* 跨步時間 */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);
  const grow = (s, n, a, b) => (s.n > n ? 1 : s.n < n ? 0 : ease(seg(s.u, a, b)));

  /* ═══════════ 比例與幾何 ═══════════ */
  const PX_PER_GW = 3.2;             /* 1 gw ＝ 3.2 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 1 格 ＝ 10 gw ＝ 32 px */
  const GY = 492, KEY_Y = 62, BOT_Y = 515;
  const O = { x: 212, y: 330 };      /* 作用點（球心） */
  const MAT = { x0: 16, y0: 92, x1: 500, y1: 474 };     /* 方格地面 */
  const GR = { x0: 516, y0: 92, x1: 948, y1: 474 };     /* R–θ 圖面板 */
  const GX0 = 576, GYB = 436, PX_PER_DEG = 1.9;         /* 圖：原點（θ=0、R=0）、橫軸每度幾 px；縱軸用 PX_PER_GW */
  const BALL_R = 17;
  const ROW1 = 404;                  /* 第 1、3 步「頭尾相接」那一排的 y */
  const STOPS = [60, 90, 120];       /* 第 2 步停一下的角度 */

  /* 向量（gw） */
  const F1 = { x: 30, y: 0 };
  const F2_MAG = 40;
  const f2At = th => ({ x: F2_MAG * Math.cos(th * DEG), y: -F2_MAG * Math.sin(th * DEG) });
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const unit = v => { const m = mag(v) || 1; return { x: v.x / m, y: v.y / m }; };
  const px = (o, v, k) => ({ x: o.x + v.x * PX_PER_GW * (k == null ? 1 : k), y: o.y + v.y * PX_PER_GW * (k == null ? 1 : k) });
  const Rof = th => add(F1, f2At(th));
  const SUB1 = 'F₁', SUB2 = 'F₂';

  /* 單槓（第 4 步） */
  const W_GW = 60;                   /* 體重 */
  const BAR_Y = 118, ARM_H = 100, RING = { x: 410, y: BAR_Y + ARM_H }, ATT = 12;   /* 環心、手臂接點離環心的水平距 */
  const BAR_X0 = 8, BAR_X1 = 812;
  const BLOCK = { w: 104, h: 66, top: RING.y + 24 };
  const tensionGw = th => (W_GW / 2) / Math.cos(th / 2 * DEG);

  /* ═══════════ 角色圖（March 全身） ═══════════ */
  const IMG = {};
  [['ready', 'touch_ready'], ['worry', 'touch_water']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/march/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;
  const SOLE = { ready: 466, worry: 466 };            /* 原圖鞋底所在列 */
  const BODY = { ready: 138, worry: 160 };            /* 原圖身體中線（ready 左右翻轉後） */
  const MX = 886, SCM = 0.5;
  function march(c, key, a, flip) {
    const im = IMG[key];
    if (a <= 0.02 || !ok(im)) return;
    const w = im.naturalWidth * SCM, h = im.naturalHeight * SCM, top = GY - SOLE[key] * SCM, x0 = MX - BODY[key] * SCM;
    withA(c, a, () => {
      if (flip) { c.save(); c.translate(x0 + w, top); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); }
      else c.drawImage(im, x0, top, w, h);
    });
  }
  function marchShadow(c, a) {
    withA(c, a * 0.4, () => { c.fillStyle = INK; c.beginPath(); c.ellipse(MX, GY + 3, 50, 7, 0, 0, TAU); c.fill(); });
  }
  const MTOP = GY - (SOLE.ready - 8) * SCM;          /* 頭頂 */
  function bubble(c, a, str, col) {
    if (a <= 0.02) return;
    const w = W5.tw(c, str, 24) + 28, xr = 948, cx = Math.min(xr - w / 2, MX + 10), cy = MTOP - 34;
    const hx = MX - 4, hy = MTOP + 6;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath(); c.moveTo(hx - 16, cy + 18); c.lineTo(hx, hy); c.lineTo(hx + 8, cy + 18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx - 16, cy + 20); c.lineTo(hx, hy); c.lineTo(hx + 8, cy + 20); c.stroke();
    });
    P(c, a, str, cx, cy, col, 24, 'center');
  }

  /* ═══════════ 背景 ═══════════ */
  function floor(c) {
    const gl = c.createRadialGradient(480, 260, 30, 480, 260, 560);
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
  function mat(c, a) {
    withA(c, a, () => {
      const w = MAT.x1 - MAT.x0, h = MAT.y1 - MAT.y0;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.7)'; c.shadowBlur = 14; c.shadowOffsetY = 5;
      const g = c.createRadialGradient(O.x + 60, O.y - 60, 30, O.x + 60, O.y - 60, 420);
      g.addColorStop(0, '#24524a'); g.addColorStop(1, '#163830');
      c.fillStyle = g; W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.fill(); c.restore();
      c.save(); W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.clip();
      c.strokeStyle = 'rgba(246,243,234,0.11)'; c.lineWidth = 1.2;
      for (let x = O.x - Math.floor((O.x - MAT.x0) / CELL) * CELL; x <= MAT.x1; x += CELL) { c.beginPath(); c.moveTo(x, MAT.y0); c.lineTo(x, MAT.y1); c.stroke(); }
      for (let y = O.y - Math.floor((O.y - MAT.y0) / CELL) * CELL; y <= MAT.y1; y += CELL) { c.beginPath(); c.moveTo(MAT.x0, y); c.lineTo(MAT.x1, y); c.stroke(); }
      c.restore();
      c.strokeStyle = '#7fa396'; c.lineWidth = 3; W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.stroke();
    });
  }
  function legend(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(22, BOT_Y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(22, BOT_Y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), 22 + CELL + 10, BOT_Y, DIM, 22, 'left');
  }
  function glowBottom(c, a, str, col) {
    col = col || R_COL;
    if (a > 0.02) W5.glow(c, 560, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 560, BOT_Y, col, 24, 'center');
  }

  /* ═══════════ 物件 ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  function vecArrow(c, o, v, g, a, col, lw) {
    if (g <= 0.01) return;
    const t = px(o, v, g);
    fArrow(c, o.x, o.y, t.x, t.y, a, col, lw);
  }
  function ballAt(c, x, y, a) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.5; c.fillStyle = INK; c.beginPath(); c.arc(x + 3, y + 5, BALL_R + 1, 0, TAU); c.fill(); c.restore();
      W5.ball(c, x, y, BALL_R, '#e2b866');
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, BALL_R, 0, TAU); c.stroke();
    });
  }
  function pin(c, x, y, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; c.beginPath(); c.arc(x + 2, y + 3, 8, 0, TAU); c.fill();
      W5.ball(c, x, y, 7, '#c9d4d0');
      c.strokeStyle = '#4b5754'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.stroke();
    });
  }
  function dashLine(c, x0, y0, x1, y1, col, a, lw) {
    withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = col; c.lineWidth = lw || 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
    });
  }
  function pulse(c, x, y, col, a, u0, u) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      W5.glow(c, x, y, 26, col, 0.5);
      if (u >= u0 && u < u0 + 1.6) { const ph = ((u - u0) % 0.8) / 0.8; c.strokeStyle = W5.rgba(col, 0.9 * (1 - ph)); c.lineWidth = 3; c.beginPath(); c.arc(x, y, 10 + 22 * ph, 0, TAU); c.stroke(); }
    });
  }
  /* 直線上的力（頭尾相接那一排）：x0→x1，y */
  function barArrow(c, x0, x1, y, g, a, col, lw) {
    if (g <= 0.01) return;
    fArrow(c, x0, y, lerp(x0, x1, g), y, a, col, lw || 6);
  }

  /* ═══════════ 第 1～3 步：夾角 θ ═══════════ */
  function thetaOf(s) {
    const u = s.u;
    if (s.n === 1) return 0;
    if (s.n === 2) {
      if (u < 3.6) return lerp(0, 60, ease(seg(u, 0.8, 2.6)));
      if (u < 5.8) return lerp(60, 90, ease(seg(u, 3.6, 4.8)));
      return lerp(90, 120, ease(seg(u, 5.8, 7.0)));
    }
    return lerp(120, 180, ease(seg(u, 0.8, 3.0)));
  }
  /* 停住的瞬間（第 2 步：到 60／90／120 的時刻） */
  const STOP_U = [2.6, 4.8, 7.0];

  function forceScene(c, s, th) {
    const n = s.n, u = s.u;
    const F2 = f2At(th), R = Rof(th), uR = unit(R);
    const d1 = unit(F1), d2 = unit(F2);
    const t1 = px(O, F1), t2 = px(O, F2), tR = px(O, R);
    const rig = n === 1 ? s.k : 1;
    const g1 = n === 1 ? ease(seg(u, 0.6, 1.3)) : 1;
    const g2 = n === 1 ? ease(seg(u, 1.6, 2.3)) : 1;
    const gR = n === 1 ? ease(seg(u, 4.6, 5.4)) : 1;

    /* 平行四邊形（θ 在 0°、180° 附近會壓扁成一直線 → 淡出） */
    const pa = clamp01((th - 3) / 10) * clamp01((177 - th) / 10);
    if (pa > 0.02) {
      withA(c, pa, () => {
        c.fillStyle = W5.rgba(R_COL, 0.10);
        c.beginPath(); c.moveTo(O.x, O.y); c.lineTo(t1.x, t1.y); c.lineTo(tR.x, tR.y); c.lineTo(t2.x, t2.y); c.closePath(); c.fill();
      });
      dashLine(c, t1.x, t1.y, tR.x, tR.y, W5.rgba(F2_COL, 0.9), pa, 3);
      dashLine(c, t2.x, t2.y, tR.x, tR.y, W5.rgba(F1_COL, 0.9), pa, 3);
    }

    ballAt(c, O.x, O.y, rig);
    /* 夾角弧 */
    if (th > 1) {
      withA(c, rig, () => {
        c.strokeStyle = WHITE; c.lineWidth = 2.5;
        c.beginPath(); c.arc(O.x, O.y, 34, -th * DEG, 0); c.stroke();
      });
      /* θ 字放在 R 與 F₂ 之間的空隙（太窄就不標，左上角讀數有 θ）；θ 接近 180° 時放在弧的右上方 */
      const aR = Math.atan2(-R.y, R.x) / DEG;
      if (th > 140) T(c, rig, 'θ', O.x + 54 * Math.cos(45 * DEG), O.y - 54 * Math.sin(45 * DEG), WHITE, 24, 'center', true);
      else if (th - aR > 30) { const ta = (aR + th) / 2 * DEG; T(c, rig, 'θ', O.x + 60 * Math.cos(ta), O.y - 60 * Math.sin(ta), WHITE, 24, 'center', true); }
    }

    /* 箭頭：合力 R 先畫（同一直線時三支重疊，短的疊在上面） */
    vecArrow(c, O, R, gR, rig, R_COL, 11);
    vecArrow(c, O, F2, g2, rig, F2_COL, 7);
    vecArrow(c, O, F1, g1, rig, F1_COL, 5);
    pin(c, O.x, O.y, rig);

    /* 標示：F₁ 在線下；F₂ 在 F₂ 的「外側」（遠離平行四邊形）；θ＝180° 時 F₂ 標在線上方 */
    const lab1 = SUB1 + ' = ' + gwOf(F1) + ' gw', lab2 = SUB2 + ' = ' + gwOf(F2) + ' gw';
    const la1 = n === 1 ? fin(s, 1, 1.3, 0.4) : 1, la2 = n === 1 ? fin(s, 1, 2.3, 0.4) : 1;
    P(c, la1 * rig, lab1, O.x + F1.x * PX_PER_GW / 2 + 6, O.y + 38, F1_COL, 22, 'center', true);
    {
      const w = W5.tw(c, lab2, 22, true) + 28;
      const n2 = { x: d2.y, y: -d2.x };
      const d = 14 + Math.abs(n2.x) * w / 2 + Math.abs(n2.y) * 19;
      const m = px(O, F2, 0.5);
      /* θ 接近 180° 時改標在 F₂ 下方、F₁ 字的左邊（不和 F₁ 的字重疊），用 b 平滑移過去 */
      const b = ease(clamp01((th - 130) / 30));
      const qx = lerp(m.x + n2.x * d, O.x - 118, b), qy = lerp(m.y + n2.y * d, O.y + 38, b);
      P(c, la2 * rig, lab2, qx, qy, F2_COL, 22, 'center', true);
    }
    /* R 的字：在尖端外側（θ 接近 180° 時 R 很短，改在下面那一排標） */
    if (gR > 0.98 && th < 135) {
      const nR = { x: -uR.y, y: uR.x };
      const off = th < 1 ? { x: uR.x * 26, y: 0 } : { x: nR.x * 26 + uR.x * 8, y: nR.y * 26 + uR.y * 8 };
      T(c, n === 1 ? fin(s, 1, 5.4, 0.4) : 1, 'R', tR.x + off.x, tR.y + off.y, R_COL, 26, 'center', true);
    }
  }

  /* ═══════════ R–θ 圖 ═══════════ */
  const gxOf = th => GX0 + th * PX_PER_DEG;
  const gyOf = r => GYB - r * PX_PER_GW;
  function graph(c, s, th, a, da) {
    if (a <= 0.02) return;
    da = (da == null ? 1 : da) * a;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, GR.x0, GR.y0, GR.x1 - GR.x0, GR.y1 - GR.y0, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, GR.x0, GR.y0, GR.x1 - GR.x0, GR.y1 - GR.y0, 16); c.stroke();
      /* 格線：橫線每 10 gw（＝1 格 32 px）、直線每 30° */
      c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1.2;
      for (let r = 10; r <= 70; r += 10) { c.beginPath(); c.moveTo(GX0, gyOf(r)); c.lineTo(gxOf(180), gyOf(r)); c.stroke(); }
      for (let d = 30; d <= 180; d += 30) { c.beginPath(); c.moveTo(gxOf(d), GYB); c.lineTo(gxOf(d), gyOf(70)); c.stroke(); }
      /* 軸 */
      c.strokeStyle = WHITE; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(GX0, gyOf(74)); c.lineTo(GX0, GYB); c.lineTo(gxOf(184), GYB); c.stroke();
    });
    T(c, a, L('合力 R 和夾角 θ', 'R vs. angle θ'), (GR.x0 + GR.x1) / 2, GR.y0 + 28, WHITE, 24, 'center');
    T(c, a, 'R (gw)', GR.x0 + 12, GR.y0 + 66, R_COL, 22, 'left', true);
    for (let r = 10; r <= 70; r += 10) T(c, a * 0.95, String(r), GX0 - 10, gyOf(r), DIM, 22, 'right', true);
    [0, 60, 90, 120, 180].forEach(d => T(c, a * 0.95, d + '°', gxOf(d), GYB + 22, DIM, 22, 'center', true));

    a = da;
    /* 軌跡：0 → θ（黃） */
    withA(c, a, () => {
      c.strokeStyle = R_COL; c.lineWidth = 4; c.lineJoin = 'round'; c.lineCap = 'round';
      c.shadowColor = W5.rgba(R_COL, 0.6); c.shadowBlur = 8;
      c.beginPath();
      const N = Math.max(1, Math.ceil(th));
      for (let i = 0; i <= N; i++) { const t = th * i / N, x = gxOf(t), y = gyOf(mag(Rof(t))); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
    });
    /* 停過的點（0°、60°、90°、120°、180°）：虛線＋數字 */
    const marks = [0].concat(STOPS, [180]);
    marks.forEach(m => {
      if (th < m - 0.01) return;
      let ma = a;
      if (s.n === 2 && m > 0) ma *= fin(s, 2, STOP_U[STOPS.indexOf(m)], 0.3);
      if (s.n === 3 && m === 180) ma *= fin(s, 3, 3.0, 0.3);
      const x = gxOf(m), r = mag(Rof(m)), y = gyOf(r);
      if (m > 0) dashLine(c, x, y + 8, x, GYB - 2, 'rgba(246,243,234,0.45)', ma, 2);
      withA(c, ma, () => { c.fillStyle = R_COL; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); });
      const lx = m === 180 ? x - 6 : x + 12, ly = m === 180 ? y - 24 : y - 20;
      T(c, ma, String(Math.round(r)), lx, ly, R_COL, 24, m === 180 ? 'center' : 'left', true);
    });
    /* 目前的點 */
    const x = gxOf(th), y = gyOf(mag(Rof(th)));
    withA(c, a, () => { W5.glow(c, x, y, 22, R_COL, 0.6); W5.ball(c, x, y, 9, R_COL); });
  }

  /* 左上角讀數：θ、R */
  function readouts(c, a, th, rStr, rCol) {
    P(c, a, 'θ = ' + Math.round(th) + '°', MAT.x0 + 16, MAT.y0 + 30, WHITE, 24, 'left', true);
    if (rStr) P(c, a, rStr, MAT.x0 + 16, MAT.y0 + 76, rCol || R_COL, 24, 'left', true);
  }

  /* ── 第 1 步：夾角 0°，合力最大 ── */
  function step1(c, s) {
    const n = 1, u = s.u, th = 0;
    P(c, fin(s, n, 0.3, 0.5), L('同方向：合力最大', 'Same way: largest R'), 480, KEY_Y, WHITE, 24);
    forceScene(c, s, th);
    /* 頭尾相接：F₁ 接 F₂ → 剛好等於 R */
    const xa = O.x, xb = O.x + mag(F1) * PX_PER_GW, xc = xb + F2_MAG * PX_PER_GW;
    const ra = fin(s, n, 3.0, 0.4);
    barArrow(c, xa, xb, ROW1, ease(seg(u, 3.0, 3.6)), ra, F1_COL);
    barArrow(c, xb, xc, ROW1, ease(seg(u, 3.7, 4.4)), ra, F2_COL);
    dashLine(c, xc, O.y + 12, xc, ROW1 - 10, 'rgba(255,224,102,0.7)', fin(s, n, 5.4, 0.4), 2);
    dashLine(c, xa, O.y + 20, xa, ROW1 - 10, 'rgba(246,243,234,0.45)', ra, 2);
    T(c, fin(s, n, 3.6, 0.3), String(gwOf(F1)), (xa + xb) / 2, ROW1 + 34, F1_COL, 24, 'center', true);
    T(c, fin(s, n, 4.4, 0.3), String(F2_MAG), (xb + xc) / 2, ROW1 + 34, F2_COL, 24, 'center', true);
    T(c, ra, L('接起來', 'tip to tail'), MAT.x0 + 14, ROW1, DIM, 22, 'left');
    /* 讀數 */
    const Rg = gwOf(Rof(th));
    readouts(c, fin(s, n, 2.4, 0.4), th,
      fin(s, n, 5.6, 0.4) > 0.02 ? 'R = ' + gwOf(F1) + ' + ' + F2_MAG + ' = ' + Rg + ' gw' + L('（最大）', ' (max)') : null);
    graph(c, s, th, s.k, fin(s, n, 6.0, 0.5));
    pulse(c, px(O, Rof(0)).x, O.y, R_COL, fin(s, n, 5.4, 0.3) * fout(s, n, 7.0, 0.3), 5.4, u);
    glowBottom(c, fin(s, n, 7.0, 0.5), L('夾角 0°：同方向，合力最大', 'Angle 0°: same way, R is largest'));
  }

  /* ── 第 2 步：夾角變大 ── */
  function step2(c, s) {
    const n = 2, u = s.u, th = thetaOf(s);
    P(c, fin(s, n, 0.3, 0.5), L('夾角變大，合力變小', 'Wider angle, smaller R'), 480, KEY_Y, WHITE, 24);
    forceScene(c, s, th);
    readouts(c, 1, th, 'R = ' + gwOf(Rof(th)) + ' gw');
    graph(c, s, th, 1);
    /* 停住時：R 尖端與圖上的點各亮一下 */
    STOP_U.forEach((t0, i) => {
      const a = fin(s, n, t0, 0.2) * fout(s, n, t0 + 1.0, 0.3);
      if (a <= 0.02) return;
      const m = STOPS[i], tip = px(O, Rof(m));
      pulse(c, tip.x, tip.y, R_COL, a, t0, u);
      pulse(c, gxOf(m), gyOf(mag(Rof(m))), R_COL, a, t0, u);
    });
    glowBottom(c, fin(s, n, 8.4, 0.5), L('夾角越大，合力 R 越小', 'The wider the angle, the smaller R'));
  }

  /* ── 第 3 步：夾角 180°，合力最小 ── */
  function step3(c, s) {
    const n = 3, u = s.u, th = thetaOf(s);
    P(c, fin(s, n, 0.3, 0.5), L('反方向：合力最小', 'Opposite: smallest R'), 480, KEY_Y, WHITE, 24);
    forceScene(c, s, th);
    const R = Rof(th), Rg = gwOf(R), done = fin(s, n, 5.0, 0.4);
    readouts(c, 1, th, done > 0.5
      ? 'R = ' + F2_MAG + ' − ' + gwOf(F1) + ' = ' + Rg + ' gw' + L('（最小）', ' (min)')
      : 'R = ' + Rg + ' gw');
    graph(c, s, th, 1);
    /* 頭尾相接：F₂（向左 40）接 F₁（向右 30）→ 剩向左 10 */
    const xa = O.x, xb = O.x - F2_MAG * PX_PER_GW, xc = xb + mag(F1) * PX_PER_GW;
    const ya = ROW1, yb = ROW1 + 24, yc = ROW1 + 48;
    const ra = fin(s, n, 3.4, 0.4);
    barArrow(c, xa, xb, ya, ease(seg(u, 3.4, 4.0)), ra, F2_COL);
    dashLine(c, xb, ya + 4, xb, yb - 4, 'rgba(246,243,234,0.6)', fin(s, n, 4.0, 0.3), 2);
    barArrow(c, xb, xc, yb, ease(seg(u, 4.1, 4.7)), ra, F1_COL);
    const rc = fin(s, n, 4.8, 0.4);
    dashLine(c, xc, yb + 4, xc, yc - 4, 'rgba(255,224,102,0.7)', rc, 2);
    dashLine(c, xa, O.y + 20, xa, yc - 4, 'rgba(246,243,234,0.45)', ra, 2);
    barArrow(c, xa, xc, yc, ease(seg(u, 4.8, 5.2)), rc, R_COL, 8);
    T(c, fin(s, n, 4.0, 0.3), String(F2_MAG), xb - 14, ya, F2_COL, 24, 'right', true);
    T(c, fin(s, n, 4.7, 0.3), String(gwOf(F1)), xc + 14, yb, F1_COL, 24, 'left', true);
    T(c, fin(s, n, 5.2, 0.3), 'R = ' + Rg, xa + 16, yc, R_COL, 24, 'left', true);
    /* 方向：朝向較大的 F₂ */
    P(c, fin(s, n, 5.6, 0.4), L('R 朝向較大的 F₂', 'R points along the bigger F₂'), 340, 210, R_COL, 22, 'center');
    glowBottom(c, fin(s, n, 6.2, 0.5), L('夾角 180°：反方向，合力最小', 'Angle 180°: opposite, R is smallest'));
  }

  /* ═══════════ 第 4 步：單槓 ═══════════ */
  function thetaBar(u) {
    if (u < 4.6) return lerp(0, 120, ease(seg(u, 2.6, 4.6)));
    return lerp(120, 150, ease(seg(u, 5.6, 7.2)));
  }
  function wallGrid(c, a) {
    withA(c, a, () => {
      c.strokeStyle = 'rgba(246,243,234,0.07)'; c.lineWidth = 1.2;
      for (let x = RING.x - Math.floor((RING.x - 0) / CELL) * CELL; x <= 830; x += CELL) { c.beginPath(); c.moveTo(x, 92); c.lineTo(x, GY); c.stroke(); }
      for (let y = RING.y - Math.floor((RING.y - 92) / CELL) * CELL; y <= GY; y += CELL) { c.beginPath(); c.moveTo(0, y); c.lineTo(830, y); c.stroke(); }
    });
  }
  function bar(c, a) {
    withA(c, a, () => {
      /* 吊架：從天花板垂下 */
      [70, 750].forEach(x => {
        c.fillStyle = '#5d6b67'; c.fillRect(x - 5, 32, 10, BAR_Y - 32);
        c.fillStyle = '#87948f'; c.fillRect(x - 5, 32, 3, BAR_Y - 32);
      });
      /* 單槓本體 */
      const g = c.createLinearGradient(0, BAR_Y - 9, 0, BAR_Y + 9);
      g.addColorStop(0, '#f2f5f4'); g.addColorStop(0.45, '#aab7b3'); g.addColorStop(1, '#5b6865');
      c.fillStyle = g; W5.rr(c, BAR_X0, BAR_Y - 9, BAR_X1 - BAR_X0, 18, 9); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 2; W5.rr(c, BAR_X0, BAR_Y - 9, BAR_X1 - BAR_X0, 18, 9); c.stroke();
    });
  }
  /* 一條手臂：從環接點 p 到握點 q（粗圓角線＋手掌） */
  function arm(c, p, q, col, a) {
    withA(c, a, () => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 20; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
      c.strokeStyle = W5.mix(col, '#17332a', 0.55); c.lineWidth = 15; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
      /* 手掌包住單槓 */
      c.fillStyle = '#f1c9a5'; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2;
      W5.rr(c, q.x - 11, q.y - 12, 22, 24, 8); c.fill(); c.stroke();
    });
  }
  function step4(c, s) {
    const n = 4, u = s.u, k = s.k;
    const th = thetaBar(u), ph = th / 2 * DEG;
    const Tg = tensionGw(th);
    wallGrid(c, k);
    bar(c, k);
    P(c, fin(s, n, 0.3, 0.5), L('張越開，每手越用力', 'Wider grip, harder pull'), 480, KEY_Y, WHITE, 24);

    /* 手臂：接點 p，握點 q（垂直距離固定 ARM_H） */
    const pL = { x: RING.x - ATT, y: RING.y }, pR = { x: RING.x + ATT, y: RING.y };
    const dx = ARM_H * Math.tan(ph);
    const qL = { x: pL.x - dx, y: BAR_Y }, qR = { x: pR.x + dx, y: BAR_Y };
    arm(c, pL, qL, F1_COL, k);
    arm(c, pR, qR, F2_COL, k);
    /* 吊繩＋重物 */
    withA(c, k, () => {
      c.strokeStyle = '#d9c9a3'; c.lineWidth = 4; c.beginPath(); c.moveTo(RING.x, RING.y + 10); c.lineTo(RING.x, BLOCK.top); c.stroke();
      c.save(); c.shadowColor = 'rgba(11,26,21,0.7)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(0, BLOCK.top, 0, BLOCK.top + BLOCK.h);
      g.addColorStop(0, '#8a6a52'); g.addColorStop(1, '#5a4334');
      c.fillStyle = g; W5.rr(c, RING.x - BLOCK.w / 2, BLOCK.top, BLOCK.w, BLOCK.h, 10); c.fill(); c.restore();
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2; W5.rr(c, RING.x - BLOCK.w / 2, BLOCK.top, BLOCK.w, BLOCK.h, 10); c.stroke();
      /* 環 */
      c.strokeStyle = '#c9d4d0'; c.lineWidth = 6; c.beginPath(); c.arc(RING.x, RING.y, 13, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(RING.x, RING.y, 16, 0, TAU); c.stroke();
    });
    T(c, k, L('體重', 'Weight'), RING.x, BLOCK.top + 18, WHITE, 22, 'center');
    /* 夾角弧（兩手臂之間，環的上方） */
    if (th > 2) {
      withA(c, k, () => {
        c.strokeStyle = WHITE; c.lineWidth = 2.5;
        c.beginPath(); c.arc(RING.x, RING.y, 44, -Math.PI / 2 - ph, -Math.PI / 2 + ph); c.stroke();
      });
    }

    /* 力：W（珊瑚，從重物重心向下）；T₁、T₂（沿手臂，從環接點出發） */
    const gF = ease(seg(u, 0.8, 1.6));
    const wc = { x: RING.x, y: BLOCK.top + 36 };
    vecArrow(c, wc, { x: 0, y: W_GW }, gF, 1, W_COL, 8);
    const vL = { x: -Tg * Math.sin(ph), y: -Tg * Math.cos(ph) }, vR = { x: Tg * Math.sin(ph), y: -Tg * Math.cos(ph) };
    vecArrow(c, pL, vL, gF, 1, F1_COL, 7);
    vecArrow(c, pR, vR, gF, 1, F2_COL, 7);
    /* 拉力數字：在手臂下方（遠離單槓） */
    const la = fin(s, n, 1.6, 0.4), tStr = Math.round(Tg) + ' gw';
    const wT = W5.tw(c, tStr, 22, true) + 28;
    [[pL, vL, F1_COL, -1], [pR, vR, F2_COL, 1]].forEach(([p, v, col, sd]) => {
      const m = px(p, v, 0.55), uv = unit(v);
      let nv = { x: -uv.y * sd, y: uv.x * sd };          /* 手臂的法向，朝外下方 */
      if (nv.y < 0) nv = { x: -nv.x, y: -nv.y };
      const d = 16 + Math.abs(nv.x) * wT / 2 + Math.abs(nv.y) * 19;
      P(c, la, tStr, m.x + nv.x * d, m.y + nv.y * d, col, 22, 'center', true);
    });
    P(c, fin(s, n, 1.6, 0.4), 'W = ' + W_GW + ' gw', RING.x - 20, 448, W_COL, 22, 'right', true);

    /* 左下讀數 */
    const ra = fin(s, n, 1.8, 0.4);
    const lx = 26;
    P(c, ra, 'θ = ' + Math.round(th) + '°', lx, 262, WHITE, 24, 'left', true);
    P(c, ra, L('每隻手 ', 'Each hand ') + Math.round(Tg) + ' gw', lx, 306, WHITE, 24, 'left');
    P(c, fin(s, n, 2.0, 0.4), L('兩手的合力 ＝ ', 'Both hands = ') + W_GW + ' gw', lx, 358, R_COL, 22, 'left');
    T(c, fin(s, n, 2.0, 0.4), L('＝ 體重（永遠不變）', '= weight (never changes)'), lx + 12, 396, R_COL, 22, 'left');

    /* March 觀察員：θ 變大 → 擔心 */
    const wz = ease(seg(u, 5.8, 6.4));
    marchShadow(c, k);
    march(c, 'ready', k * (1 - wz), true);
    march(c, 'worry', k * wz, false);
    bubble(c, fin(s, n, 1.6, 0.4) * fout(s, n, 3.0, 0.3), L('一手撐一半', 'Half each'), WHITE);
    bubble(c, fin(s, n, 7.2, 0.4), L('手好痠！', 'My arms ache!'), W_COL);

    /* 結尾對照卡 */
    const ca = fin(s, n, 7.8, 0.5);
    if (ca > 0.02) {
      const X0 = 470, Y0 = 254, CW = 330, CH = 200;
      withA(c, ca, () => {
        c.fillStyle = 'rgba(11,26,21,0.88)'; W5.rr(c, X0, Y0, CW, CH, 14); c.fill();
        c.strokeStyle = W5.rgba(WHITE, 0.5); c.lineWidth = 2; W5.rr(c, X0, Y0, CW, CH, 14); c.stroke();
      });
      const head = L('每隻手的拉力', 'Pull of each hand');
      T(c, ca, head, X0 + CW / 2, Y0 + 30, WHITE, fit(c, head, CW - 24, 24), 'center');
      [0, 120, 150].forEach((d, i) => {
        const a = fin(s, n, 8.0 + i * 0.4, 0.3), y = Y0 + 78 + i * 46;
        const t = Math.round(tensionGw(d));
        T(c, a, 'θ = ' + d + '°', X0 + 24, y, WHITE, 24, 'left', true);
        T(c, a, '→', X0 + 170, y, DIM, 24, 'center', true);
        T(c, a, t + ' gw', X0 + CW - 24, y, i === 2 ? W_COL : WHITE, 24 + i * 2, 'right', true);
      });
    }
    glowBottom(c, fin(s, n, 9.2, 0.5), L('夾角越大，每隻手要出越多力', 'Wider angle: each hand pulls harder'), W_COL);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    floor(c);
    if (s.n < 4) mat(c, s.n === 1 ? s.k : 1);
    legend(c, 1);
    if (s.n === 1) step1(c, s);
    if (s.n === 2) step2(c, s);
    if (s.n === 3) step3(c, s);
    if (s.n === 4) step4(c, s);
  }

  W5.register('angle', { canvas: 'cvs-angle', steps: DUR, draw });
})();
