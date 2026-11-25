/* ==================================================================
   mechanics_2 ｜ 平行四邊形法：對角線是合力（cvs-parallelogram，960×540）
   四步：1 兩力不同線 → 2 補成平行四邊形 → 3 對角線是合力 → 4 不是直接相加
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_fdraw／online／twof／threef。

   比例：PX_PER_GW＝3.2（1 gw＝3.2 px，整支動畫不變）；比例尺 1 格＝10 gw＝32 px（方格地面的格線就是這個格）。
         30 gw＝96 px＝3 格、40 gw＝128 px＝4 格、50 gw＝160 px＝5 格、70 gw＝224 px＝7 格。
   力（畫面座標，y 向下；單位 gw）：F₁＝(30, 0) 向右（March，青）；F₂＝40 gw、與 F₁ 夾角 θ（April，粉）。
         第 1～3 步 θ＝90°；第 4 步 θ 由 90° 緩慢轉到 60°（停一下），再轉到 0°。
         平行四邊形四頂點 O、O＋F₁、O＋F₂、O＋F₁＋F₂ 一律由向量加法算；R＝F₁＋F₂（黃）。
         畫面上的 gw 數、格數、角度一律由向量即時算出（Math.round(Math.hypot(x, y))）。
   場景（俯視、方格地面 MAT）：球在作用點 O；March、April 用角色圖做成小頭像圓章（圓形裁切＋姓名牌）
         站在繩子末端（俯視構圖，不畫站姿）。第 1、2、4 步球用插銷固定；第 3 步拔掉插銷 → 球連同兩人沿 R 加速。
         左側說明面板（x 12～272）：每步的文字／3-4-5 三角形／第 4 步兩條長條（直接相加 70 vs 實際 R）。
         右下地面線 GY 上站著曉臻助教（全身圖 assets/characters/xiaozhen/，腳踩地面線）當講解員，換姿勢＋說話氣泡。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F1_COL = COL.teal, F2_COL = COL.pink, R_COL = COL.yellow, OK_COL = COL.green, BAD = COL.red;
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 10, 10, 10];       /* 總長 39 秒 */

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
  const O = { x: 452, y: 410 };      /* 作用點（球心）的起始位置 */
  const MAT = { x0: 286, y0: 92, x1: 820, y1: 474 };   /* 方格地面 */
  const PX0 = 12, PW = 260, PY0 = 92, PY1 = 474;       /* 左側說明面板 */
  const GY = 492, KEY_Y = 62, BOT_Y = 515;
  const BALL_R = 17, BADGE_R = 28;
  const ROPE = [335, 265];           /* 繩長（px）：球心 → March／April 圓章中心 */
  const MOVE = 30;                   /* 第 3 步球沿 R 移動的距離（px） */

  /* 向量（gw） */
  const F1 = { x: 30, y: 0 };
  const F2_MAG = 40;
  const f2At = th => ({ x: F2_MAG * Math.cos(th * DEG), y: -F2_MAG * Math.sin(th * DEG) });
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const unit = v => { const m = mag(v) || 1; return { x: v.x / m, y: v.y / m }; };
  const px = (o, v, k) => ({ x: o.x + v.x * PX_PER_GW * (k == null ? 1 : k), y: o.y + v.y * PX_PER_GW * (k == null ? 1 : k) });
  const SUB1 = 'F₁', SUB2 = 'F₂';

  /* ═══════════ 角色圖 ═══════════ */
  const IMG = {};
  [['m', 'march/normal'], ['a', 'april/normal'],
   ['zn', 'xiaozhen/normal'], ['zt', 'xiaozhen/thinking'], ['zp', 'xiaozhen/pointing'],
   ['zs', 'xiaozhen/surprised'], ['zh', 'xiaozhen/praising']].forEach(([k, n]) => {
    const im = new Image(); im.src = 'assets/characters/' + n + '.png'; IMG[k] = im;
  });
  const ok = im => im && im.complete && im.naturalWidth;
  /* 頭像裁切圓（原圖座標）：圓心、半徑 */
  const HEAD = { m: [103, 82, 80], a: [92, 84, 74] };

  /* 小頭像圓章：圓形裁切＋彩色外框 */
  function badge(c, key, x, y, col, a) {
    if (a <= 0.02) return;
    const im = IMG[key], h = HEAD[key], r = BADGE_R;
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK; c.beginPath(); c.arc(x + 3, y + 5, r + 3, 0, TAU); c.fill(); c.restore();
      c.fillStyle = '#1f4136'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      if (ok(im)) {
        c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
        const k = r / h[2];
        c.drawImage(im, x - h[0] * k, y - h[1] * k, im.naturalWidth * k, im.naturalHeight * k);
        c.restore();
      }
      c.save(); c.shadowColor = W5.rgba(col, 0.8); c.shadowBlur = 10;
      c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.restore();
    });
  }

  /* 曉臻助教（全身圖，鞋底在原圖第 542 列，踩在地面線 GY 上） */
  const ZX = 886, ZSC = 0.36, ZSOLE = 542, ZTOP = GY - (ZSOLE - 53) * ZSC;
  function zhen(c, key, a, flip) {
    const im = IMG[key];
    if (a <= 0.02 || !ok(im)) return;
    const w = im.naturalWidth * ZSC, h = im.naturalHeight * ZSC, top = GY - ZSOLE * ZSC;
    withA(c, a, () => {
      if (flip) { c.save(); c.translate(ZX + w / 2, top); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); }
      else c.drawImage(im, ZX - w / 2, top, w, h);
    });
  }
  function zhenShadow(c, a) {
    withA(c, a * 0.4, () => { c.fillStyle = INK; c.beginPath(); c.ellipse(ZX, GY + 3, 44, 7, 0, 0, TAU); c.fill(); });
  }
  /* 說話氣泡：在曉臻頭頂左上方，尾巴指向頭 */
  function bubble(c, a, str, col) {
    if (a <= 0.02) return;
    const w = W5.tw(c, str, 24) + 28, xr = 948, cx = xr - w / 2, cy = ZTOP - 40;
    const hx = ZX - 6, hy = ZTOP + 2;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath(); c.moveTo(hx - 22, cy + 18); c.lineTo(hx, hy); c.lineTo(hx + 4, cy + 18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx - 22, cy + 20); c.lineTo(hx, hy); c.lineTo(hx + 4, cy + 20); c.stroke();
    });
    P(c, a, str, cx, cy, col, 24, 'center');
  }

  /* ═══════════ 背景：地面（同 threef）＋方格地面 ═══════════ */
  function floor(c) {
    const gl = c.createRadialGradient(O.x, O.y - 80, 30, O.x, O.y - 80, 520);
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
      const g = c.createRadialGradient(O.x, O.y - 60, 30, O.x, O.y - 60, 420);
      g.addColorStop(0, '#24524a'); g.addColorStop(1, '#163830');
      c.fillStyle = g; W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.fill(); c.restore();
      /* 格線：以 O 為原點，每格 10 gw */
      c.save(); W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.clip();
      c.strokeStyle = 'rgba(246,243,234,0.11)'; c.lineWidth = 1.2;
      for (let x = O.x - Math.floor((O.x - MAT.x0) / CELL) * CELL; x <= MAT.x1; x += CELL) { c.beginPath(); c.moveTo(x, MAT.y0); c.lineTo(x, MAT.y1); c.stroke(); }
      for (let y = O.y - Math.floor((O.y - MAT.y0) / CELL) * CELL; y <= MAT.y1; y += CELL) { c.beginPath(); c.moveTo(MAT.x0, y); c.lineTo(MAT.x1, y); c.stroke(); }
      c.restore();
      c.strokeStyle = '#7fa396'; c.lineWidth = 3; W5.rr(c, MAT.x0, MAT.y0, w, h, 16); c.stroke();
    });
  }
  function panel(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, PX0, PY0, PW, PY1 - PY0, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, PX0, PY0, PW, PY1 - PY0, 16); c.stroke();
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
    if (a > 0.02) W5.glow(c, 500, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 500, BOT_Y, col, 24, 'center');
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
  /* 從 o 出發的力 v（gw），長出比例 g */
  function vecArrow(c, o, v, g, a, col, lw) {
    if (g <= 0.01) return;
    const t = px(o, v, g);
    fArrow(c, o.x, o.y, t.x, t.y, a, col, lw);
  }
  function rope(c, o, dir, len, g, a) {
    if (a <= 0.02 || g <= 0.01) return;
    const e = { x: o.x + dir.x * len * g, y: o.y + dir.y * len * g };
    withA(c, a, () => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 6; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(e.x, e.y); c.stroke();
      c.strokeStyle = '#d9c9a3'; c.lineWidth = 3; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(e.x, e.y); c.stroke();
    });
  }
  function ballAt(c, x, y, a) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.5; c.fillStyle = INK; c.beginPath(); c.arc(x + 3, y + 5, BALL_R + 1, 0, TAU); c.fill(); c.restore();
      W5.ball(c, x, y, BALL_R, '#e2b866');
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, BALL_R, 0, TAU); c.stroke();
    });
  }
  /* 插銷（從上往下看：一顆金屬頭）；off 0..1 拔出 */
  function pin(c, x, y, off) {
    const a = 1 - off; if (a <= 0.02) return;
    const px_ = x - 22 * off, py = y - 34 * off;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; c.beginPath(); c.arc(px_ + 2, py + 3, 8, 0, TAU); c.fill();
      W5.ball(c, px_, py, 7, '#c9d4d0');
      c.strokeStyle = '#4b5754'; c.lineWidth = 1.5; c.beginPath(); c.arc(px_, py, 7, 0, TAU); c.stroke();
    });
  }
  /* 直角記號：頂點 p、兩邊方向 u1、u2、邊長 d */
  function rightMark(c, p, u1, u2, d, a, col) {
    withA(c, a, () => {
      c.strokeStyle = col || WHITE; c.lineWidth = 2.5; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(p.x + u1.x * d, p.y + u1.y * d);
      c.lineTo(p.x + (u1.x + u2.x) * d, p.y + (u1.y + u2.y) * d);
      c.lineTo(p.x + u2.x * d, p.y + u2.y * d);
      c.stroke();
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
  function check(c, x, y, r, g, a) {
    if (g <= 0.01) return;
    withA(c, a, () => {
      c.strokeStyle = OK_COL; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = W5.rgba(OK_COL, 0.7); c.shadowBlur = 10;
      const p1 = [x - r, y], p2 = [x - r * 0.3, y + r * 0.7], p3 = [x + r, y - r * 0.8];
      const g1 = clamp01(g * 2.5), g2 = clamp01(g * 2.5 - 1);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(lerp(p1[0], p2[0], g1), lerp(p1[1], p2[1], g1));
      if (g > 0.4) c.lineTo(lerp(p2[0], p3[0], g2), lerp(p2[1], p3[1], g2));
      c.stroke();
    });
  }
  function cross(c, x, y, r, g, a) {
    if (g <= 0.01) return;
    withA(c, a, () => {
      c.strokeStyle = BAD; c.lineWidth = 6; c.lineCap = 'round';
      c.shadowColor = W5.rgba(BAD, 0.7); c.shadowBlur = 10;
      const g1 = clamp01(g * 2), g2 = clamp01(g * 2 - 1);
      c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x - r + 2 * r * g1, y - r + 2 * r * g1); c.stroke();
      if (g2 > 0) { c.beginPath(); c.moveTo(x + r, y - r); c.lineTo(x + r - 2 * r * g2, y - r + 2 * r * g2); c.stroke(); }
    });
  }
  /* 加速後緩停（同 online／twof）：回傳位移比例 0..1 */
  function accel(u, a, b) {
    const t = seg(u, a, b), A = 1 / 0.375;
    let x;
    if (t <= 0.75) x = 0.5 * A * t * t;
    else { const d = t - 0.75; x = 0.5 * A * 0.5625 + 0.75 * A * d - 1.5 * A * d * d; }
    return Math.min(1, x);
  }

  /* ═══════════ 每一步的狀態（跳步進來也成立） ═══════════ */
  function thetaOf(s) {
    if (s.n < 4) return 90;
    const u = s.u;
    if (u < 5.2) return lerp(90, 60, ease(seg(u, 2.4, 5.2)));
    return lerp(60, 0, ease(seg(u, 6.2, 7.8)));
  }
  function stateOf(s) {
    const n = s.n, u = s.u, th = thetaOf(s);
    const F2 = f2At(th), R = add(F1, F2), uR = unit(R);
    const S = { th, F2, R, uR, o: { x: O.x, y: O.y }, rig: 1,
      rope: [1, 1], g: [1, 1], lab: [1, 1], pinOff: 0,
      p: [0, 0], pA: 0, fill: 0, r: 0 };
    if (n === 1) {
      S.rope = [ease(seg(u, 0.8, 1.3)), ease(seg(u, 2.4, 2.9))];
      S.g = [ease(seg(u, 1.3, 2.0)), ease(seg(u, 2.9, 3.6))];
      S.lab = [fin(s, 1, 2.0, 0.4), fin(s, 1, 3.6, 0.4)];
      S.rig = s.k;
    } else if (n === 2) {
      S.p = [ease(seg(u, 1.0, 2.6)), ease(seg(u, 2.8, 4.4))]; S.pA = 1;
      S.fill = ease(seg(u, 5.0, 5.8));
    } else if (n === 3) {
      S.p = [1, 1]; S.pA = 1; S.fill = 1;
      S.r = ease(seg(u, 0.6, 1.8));
      S.pinOff = ease(seg(u, 5.2, 5.8));
      const d = MOVE * accel(u, 6.0, 8.0);
      S.o = { x: O.x + uR.x * d, y: O.y + uR.y * d };
    } else {
      S.rig = fin(s, 4, 0, 0.6);         /* 重新擺好、插回插銷（淡入） */
      S.p = [1, 1]; S.pA = 1; S.fill = 1; S.r = 1;
    }
    return S;
  }

  /* ═══════════ 力桌主場景（整組隨 S.o 移動） ═══════════ */
  function scene(c, s, S) {
    const o = S.o, F2 = S.F2, R = S.R;
    const d1 = unit(F1), d2 = unit(F2);
    const t1 = px(o, F1), t2 = px(o, F2), tR = px(o, R);

    /* 第 1 步：作用線延長（看出不在同一直線） */
    const la = s.n === 1 ? fin(s, 1, 4.2, 0.6) : (s.n === 2 ? fout(s, 2, 0, 0.5) : 0);
    if (la > 0.02) {
      dashLine(c, MAT.x0 + 10, o.y, MAT.x1 - 10, o.y, W5.rgba(F1_COL, 0.55), la, 2);
      dashLine(c, o.x, MAT.y0 + 10, o.x, MAT.y1 - 10, W5.rgba(F2_COL, 0.55), la, 2);
    }

    /* 平行四邊形：填色、兩條平行虛線（逐段延伸） */
    if (S.fill > 0.02 && S.th > 0.5) {
      withA(c, S.fill * S.pA, () => {
        c.fillStyle = W5.rgba(R_COL, 0.10);
        c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(t1.x, t1.y); c.lineTo(tR.x, tR.y); c.lineTo(t2.x, t2.y); c.closePath(); c.fill();
      });
    }
    if (S.pA > 0.02) {
      if (S.p[0] > 0.01) { const e = px(t1, F2, S.p[0]); dashLine(c, t1.x, t1.y, e.x, e.y, W5.rgba(F2_COL, 0.95), S.pA, 3); }
      if (S.p[1] > 0.01) { const e = px(t2, F1, S.p[1]); dashLine(c, t2.x, t2.y, e.x, e.y, W5.rgba(F1_COL, 0.95), S.pA, 3); }
    }

    /* 繩子、圓章 */
    rope(c, o, d1, ROPE[0], S.rope[0], S.rig);
    rope(c, o, d2, ROPE[1], S.rope[1], S.rig);
    const bm = { x: o.x + d1.x * ROPE[0], y: o.y + d1.y * ROPE[0] }, ba = { x: o.x + d2.x * ROPE[1], y: o.y + d2.y * ROPE[1] };
    badge(c, 'm', bm.x, bm.y, F1_COL, S.rig * clamp01(S.rope[0] * 3 - 2));
    badge(c, 'a', ba.x, ba.y, F2_COL, S.rig * clamp01(S.rope[1] * 3 - 2));

    /* 球、夾角記號 */
    ballAt(c, o.x, o.y, S.rig);
    if (S.th > 89.5) {
      const ra = s.n === 1 ? fin(s, 1, 4.6, 0.4) : 1;
      rightMark(c, o, d1, d2, 26, S.rig * ra, WHITE);
    } else {
      withA(c, S.rig, () => {
        c.strokeStyle = WHITE; c.lineWidth = 2.5;
        c.beginPath(); c.arc(o.x, o.y, 30, -S.th * DEG, 0); c.stroke();
      });
    }
    /* 第 2 步之後：其餘三個角的直角記號 */
    if (S.th > 89.5 && S.pA > 0.02) {
      const ma = s.n === 2 ? fin(s, 2, 5.6, 0.4) : 1;
      const m1 = { x: -d1.x, y: -d1.y }, m2 = { x: -d2.x, y: -d2.y };
      rightMark(c, t1, m1, d2, 13, ma * S.rig * 0.9, WHITE);
      rightMark(c, t2, d1, m2, 13, ma * S.rig * 0.9, WHITE);
      rightMark(c, tR, m1, m2, 13, ma * S.rig * 0.9, WHITE);
    }

    /* 第 3 步：尺（沿 R，5 格逐格亮起） */
    if (s.n === 3) ruler(c, s, S, o, tR);

    /* 力的箭頭：第 4 步合力先畫（夾角 0° 時三支重疊，短的疊在上面） */
    if (s.n === 4) {
      vecArrow(c, o, R, S.r, S.rig, R_COL, 11);
      vecArrow(c, o, F2, S.g[1], S.rig, F2_COL, 7);
      vecArrow(c, o, F1, S.g[0], S.rig, F1_COL, 5);
    } else {
      vecArrow(c, o, F1, S.g[0], S.rig, F1_COL);
      vecArrow(c, o, F2, S.g[1], S.rig, F2_COL);
      vecArrow(c, o, R, S.r, 1, R_COL, 9);
    }
    withA(c, S.rig, () => pin(c, o.x, o.y, S.pinOff));

    /* 標示 */
    const lab1 = SUB1 + ' = ' + gwOf(F1) + ' gw', lab2 = SUB2 + ' = ' + gwOf(F2) + ' gw';
    P(c, S.lab[0] * S.rig, lab1, o.x + F1.x * PX_PER_GW / 2, o.y + 40, F1_COL, 22, 'center', true);
    {
      const w = W5.tw(c, lab2, 22, true) + 28, n2 = { x: d2.y, y: -d2.x };
      const d = 14 + Math.abs(n2.x) * w / 2 + Math.abs(n2.y) * 19;
      const m = px(o, F2, 0.5);
      P(c, S.lab[1] * S.rig, lab2, m.x + n2.x * d, m.y + n2.y * d, F2_COL, 22, 'center', true);
    }
    /* 姓名牌：March 在圓章下方；April 在圓章外側（遠離平行四邊形的一側） */
    P(c, S.rig * clamp01(S.rope[0] * 3 - 2), 'March', bm.x, bm.y + BADGE_R + 22, F1_COL, 22, 'center');
    {
      const w = W5.tw(c, 'April', 22) + 28, n2 = { x: d2.y, y: -d2.x };
      const d = BADGE_R + 10 + Math.abs(n2.x) * w / 2 + Math.abs(n2.y) * 19;
      P(c, S.rig * clamp01(S.rope[1] * 3 - 2), 'April', ba.x + n2.x * d, ba.y + n2.y * d, F2_COL, 22, 'center');
    }
    if (S.r > 0.98) {
      const nR = { x: -S.uR.y, y: S.uR.x };
      T(c, s.n === 3 ? fin(s, 3, 1.8, 0.4) : S.rig, 'R', tR.x + nR.x * 26, tR.y + nR.y * 26, R_COL, 26, 'center', true);
    }
  }

  /* 第 3 步：沿 R 的透明尺 */
  function ruler(c, s, S, o, tR) {
    const u = s.u, a = fin(s, 3, 2.0, 0.4) * fout(s, 3, 5.0, 0.4);
    if (a <= 0.02) return;
    const uR = S.uR, L5 = mag(S.R) * PX_PER_GW, cells = Math.round(L5 / CELL);
    const ang = Math.atan2(uR.y, uR.x);
    withA(c, a, () => {
      c.save(); c.translate(o.x, o.y); c.rotate(ang);
      for (let k = 0; k < cells; k++) {
        const lit = ease(seg(u, 2.3 + k * 0.3, 2.5 + k * 0.3));
        c.fillStyle = k % 2 ? 'rgba(246,243,234,0.16)' : 'rgba(246,243,234,0.30)';
        c.fillRect(k * CELL, -13, CELL, 26);
        if (lit > 0.01) { c.fillStyle = W5.rgba(R_COL, 0.30 * lit); c.fillRect(k * CELL, -13, CELL, 26); }
      }
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(0, -13, cells * CELL, 26);
      for (let k = 1; k < cells; k++) { c.beginPath(); c.moveTo(k * CELL, -13); c.lineTo(k * CELL, 13); c.stroke(); }
      c.restore();
    });
    /* 格數計數（在 R 尖端外側） */
    const cnt = Math.min(cells, Math.floor(clamp01((u - 2.3) / (cells * 0.3)) * cells + (u >= 2.3 ? 1 : 0)));
    if (cnt > 0) T(c, a, L(cnt + ' 格', cnt + (cnt > 1 ? ' boxes' : ' box')), tR.x + uR.x * 44, tR.y + uR.y * 44, WHITE, 24, 'center');
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = stateOf(s);
    floor(c);
    mat(c, s.n === 1 ? s.k : 1);
    panel(c, s.n === 1 ? s.k : 1);
    legend(c, s.n === 1 ? s.k : 1);
    /* 第 3 步移動時：起點的殘影＋軌跡 */
    if (s.n === 3 && s.u > 6.0) {
      const a = fin(s, 3, 6.0, 0.3) * 0.5;
      withA(c, a, () => { c.strokeStyle = WHITE; c.lineWidth = 2; c.beginPath(); c.arc(O.x, O.y, BALL_R, 0, TAU); c.stroke(); });
      dashLine(c, O.x, O.y, S.o.x, S.o.y, 'rgba(255,224,102,0.8)', fin(s, 3, 6.0, 0.3), 2);
    }
    scene(c, s, S);
    xiaozhen(c, s);
    if (s.n === 1) step1(c, s, S);
    if (s.n === 2) step2(c, s, S);
    if (s.n === 3) step3(c, s, S);
    if (s.n === 4) step4(c, s, S);
  }

  /* 曉臻：各步姿勢 */
  function xiaozhen(c, s) {
    const a0 = s.n === 1 ? s.k : 1;
    zhenShadow(c, a0);
    let pose = 'zn', flip = false;
    if (s.n === 1) pose = s.u >= 5.6 ? 'zt' : 'zn';
    if (s.n === 2) { pose = 'zp'; flip = true; }
    if (s.n === 3) { pose = s.u >= 6.0 ? 'zs' : 'zp'; flip = s.u < 6.0; }
    if (s.n === 4) { pose = s.u >= 7.9 ? 'zh' : 'zp'; flip = s.u < 7.9; }
    zhen(c, pose, a0, flip);
  }

  /* 面板裡的一行字（量寬後縮，最小 22px） */
  function row(c, a, str, y, col, size, align, mono) {
    const z = fit(c, str, PW - 28, size || 22, mono);
    const x = align === 'left' ? PX0 + 16 : PX0 + PW / 2;
    return T(c, a, str, x, y, col, z, align || 'center', mono);
  }
  function divider(c, a, y) {
    withA(c, a, () => {
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(PX0 + 22, y); c.lineTo(PX0 + PW - 22, y); c.stroke();
    });
  }

  /* ── 第 1 步：兩力不同線 ── */
  function step1(c, s, S) {
    const n = 1;
    P(c, fin(s, n, 0.3, 0.5), L('兩個力不在同一直線', 'Two forces, two lines'), 480, KEY_Y, WHITE, 24);
    T(c, fin(s, n, 0.5, 0.4) * fout(s, n, 2.6, 0.4), L('插銷固定球', 'Ball pinned'), O.x - 28, O.y, DIM, 22, 'right');
    row(c, fin(s, n, 0.6, 0.4), L('兩人一起拉球', 'Two pulls on one ball'), PY0 + 34, WHITE, 22);
    row(c, S.lab[0], L('March：向右 ', 'March: right ') + gwOf(F1) + ' gw', PY0 + 84, F1_COL, 22);
    row(c, S.lab[1], L('April：向上 ', 'April: up ') + gwOf(S.F2) + ' gw', PY0 + 126, F2_COL, 22);
    const b = fin(s, n, 4.6, 0.4);
    divider(c, b, PY0 + 166);
    row(c, b, L('方向不同', 'Different directions'), PY0 + 204, WHITE, 24);
    row(c, fin(s, n, 5.2, 0.4), L('不在同一直線', 'Not on one line'), PY0 + 246, WHITE, 24);
    /* 錯誤想法：30 + 40 = 70 ? */
    const q = fin(s, n, 6.0, 0.4);
    row(c, q, gwOf(F1) + ' + ' + gwOf(S.F2) + ' = ' + (gwOf(F1) + gwOf(S.F2)) + ' ?', PY0 + 306, DIM, 24, 'center', true);
    row(c, fin(s, n, 6.6, 0.4), L('不能直接相加！', "Can't just add!"), PY0 + 350, BAD, 24);
    /* 合力會在哪裡、多大？ */
    const D = px(S.o, S.R), qa = fin(s, n, 5.8, 0.4);
    if (qa > 0.02) { W5.glow(c, D.x, D.y, 40, R_COL, 0.35 * qa); T(c, qa, '?', D.x, D.y, R_COL, 44, 'center', true); }
    bubble(c, fin(s, n, 5.8, 0.4), L('合力多大？', 'How big is the total?'), R_COL);
    glowBottom(c, fin(s, n, 7.0, 0.5), L('不在同一直線：不能直接相加', 'Not on one line: no simple adding'), WHITE);
  }

  /* ── 第 2 步：補成平行四邊形 ── */
  function step2(c, s, S) {
    const n = 2;
    P(c, fin(s, n, 0.3, 0.5), L('補成平行四邊形', 'Complete the parallelogram'), 480, KEY_Y, WHITE, 24);
    row(c, fin(s, n, 0.8, 0.4), L('① 從 F₁ 的尖端', '① From the tip of F₁,'), PY0 + 32, WHITE, 22);
    row(c, fin(s, n, 1.0, 0.4), L('畫 F₂ 的平行線', 'draw a line ∥ F₂'), PY0 + 66, F2_COL, 22);
    row(c, fin(s, n, 2.6, 0.4), L('② 從 F₂ 的尖端', '② From the tip of F₂,'), PY0 + 112, WHITE, 22);
    row(c, fin(s, n, 2.8, 0.4), L('畫 F₁ 的平行線', 'draw a line ∥ F₁'), PY0 + 146, F1_COL, 22);
    const m = fin(s, n, 5.6, 0.4);
    divider(c, m, PY0 + 186);
    /* 夾角由向量算 */
    const ang = Math.round(Math.acos((F1.x * S.F2.x + F1.y * S.F2.y) / (mag(F1) * mag(S.F2))) / DEG);
    row(c, m, L('夾角 ', 'Angle ') + ang + '°', PY0 + 222, WHITE, 24);
    row(c, fin(s, n, 6.0, 0.4), L('所以是長方形', 'so: a rectangle'), PY0 + 262, R_COL, 24);
    row(c, fin(s, n, 6.4, 0.4), L('（特殊的平行四邊形）', '(a special'), PY0 + 300, DIM, 22);
    if (L(0, 1)) row(c, fin(s, n, 6.4, 0.4), 'parallelogram)', PY0 + 332, DIM, 22);
    /* 兩條虛線交會：第四個頂點亮一下 */
    const D = px(S.o, S.R);
    pulse(c, D.x, D.y, R_COL, fin(s, n, 4.4, 0.3), 4.4, s.u);
    bubble(c, fin(s, n, 4.6, 0.4), L('兩條線交會！', 'They meet!'), R_COL);
    glowBottom(c, fin(s, n, 6.8, 0.5), L('兩力當鄰邊，補成平行四邊形', 'The two forces are its sides'));
  }

  /* ── 第 3 步：對角線是合力 ── */
  function step3(c, s, S) {
    const n = 3;
    P(c, fin(s, n, 0.3, 0.5), L('對角線就是合力 R', 'The diagonal is R'), 480, KEY_Y, R_COL, 24);
    const cells = Math.round(mag(S.R) * PX_PER_GW / CELL), Rg = gwOf(S.R);
    row(c, fin(s, n, 0.6, 0.4), L('用同一把尺量', 'Measure, same scale'), PY0 + 32, WHITE, 22);
    row(c, fin(s, n, 3.8, 0.4), L(cells + ' 格 × 10 gw', cells + ' boxes × 10 gw'), PY0 + 72, WHITE, 24);
    /* 3-4-5 直角三角形小示意（同一比例尺） */
    const ta = fin(s, n, 4.2, 0.5);
    const A = { x: PX0 + 66, y: PY0 + 268 }, B = { x: A.x + F1.x * PX_PER_GW, y: A.y }, C = { x: B.x, y: A.y - mag(S.F2) * PX_PER_GW };
    row(c, ta, L('3、4、5 直角三角形', '3-4-5 right triangle'), PY0 + 112, DIM, 22);
    withA(c, ta, () => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = 5;
      c.strokeStyle = F1_COL; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
      c.strokeStyle = F2_COL; c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(C.x, C.y); c.stroke();
      c.strokeStyle = R_COL; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(C.x, C.y); c.stroke();
    });
    rightMark(c, B, { x: -1, y: 0 }, { x: 0, y: -1 }, 12, ta, WHITE);
    const c3 = Math.round(mag(F1) / 10), c4 = Math.round(mag(S.F2) / 10), c5 = Math.round(mag(S.R) / 10);
    T(c, ta, String(c3), (A.x + B.x) / 2, A.y + 22, F1_COL, 24, 'center', true);
    T(c, ta, String(c4), B.x + 18, (B.y + C.y) / 2, F2_COL, 24, 'left', true);
    T(c, ta, String(c5), (A.x + C.x) / 2 - 22, (A.y + C.y) / 2 - 12, R_COL, 24, 'right', true);
    P(c, fin(s, n, 4.6, 0.5), 'R = ' + Rg + ' gw', PX0 + PW / 2, PY0 + 326, R_COL, 26, 'center', true);
    const sum = gwOf(F1) + gwOf(S.F2);
    row(c, fin(s, n, 4.9, 0.4), L('不是 ' + sum + ' gw', 'not ' + sum + ' gw'), PY0 + 368, DIM, 22);
    /* R 長出時尖端亮一下 */
    const D = px(S.o, S.R);
    pulse(c, D.x, D.y, R_COL, fin(s, n, 0.4, 0.3) * fout(s, n, 2.0, 0.3), 0.4, s.u);
    T(c, fin(s, n, 5.2, 0.3) * fout(s, n, 6.4, 0.3), L('拔掉插銷', 'Pin out'), O.x - 28, O.y, DIM, 22, 'right');
    bubble(c, fin(s, n, 6.2, 0.4), L('沿著 R 加速！', 'It speeds up along R!'), R_COL);
    glowBottom(c, fin(s, n, 7.6, 0.5), L('球沿合力 R 的方向加速', 'The ball speeds up along R'));
  }

  /* ── 第 4 步：不是直接相加 ── */
  function step4(c, s, S) {
    const n = 4, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('合力不是直接相加', 'Not simply added'), 480, KEY_Y, WHITE, 24);
    const x0 = PX0 + 20, BH = 18;
    /* 直接相加的長條：30＋40 */
    const pa = fin(s, n, 0.6, 0.4);
    row(c, pa, L('直接相加？', 'Just add them?'), PY0 + 30, DIM, 22);
    row(c, pa, gwOf(F1) + ' + ' + gwOf(S.F2) + ' = ' + (gwOf(F1) + gwOf(S.F2)) + ' gw', PY0 + 66, WHITE, 22, 'center', true);
    const bg = ease(seg(u, 0.8, 1.6));
    const w1 = mag(F1) * PX_PER_GW, w2 = F2_MAG * PX_PER_GW, yb1 = PY0 + 100;
    withA(c, pa, () => {
      c.fillStyle = F1_COL; c.fillRect(x0, yb1 - BH / 2, w1 * clamp01(bg * 2), BH);
      c.fillStyle = F2_COL; c.fillRect(x0 + w1, yb1 - BH / 2, w2 * clamp01(bg * 2 - 1), BH);
      c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2; c.strokeRect(x0, yb1 - BH / 2, (w1 + w2) * bg, BH);
    });
    /* 實際合力 R 的長條（即時） */
    const Rg = gwOf(S.R), wR = mag(S.R) * PX_PER_GW, yb2 = PY0 + 196;
    const ra = fin(s, n, 1.2, 0.4);
    row(c, ra, L('實際的合力 R', 'The actual R'), PY0 + 158, R_COL, 22);
    withA(c, ra, () => {
      c.fillStyle = R_COL; c.fillRect(x0, yb2 - BH / 2, wR, BH);
      c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2; c.strokeRect(x0, yb2 - BH / 2, wR, BH);
    });
    /* 對照虛線：70 的終點 */
    dashLine(c, x0 + w1 + w2, yb1 + 12, x0 + w1 + w2, yb2 + 14, 'rgba(246,243,234,0.6)', ra, 2);
    /* 夾角（由向量算） */
    const ang = Math.round(Math.acos((F1.x * S.F2.x + F1.y * S.F2.y) / (mag(F1) * mag(S.F2))) / DEG);
    row(c, fin(s, n, 2.2, 0.4), L('夾角 θ = ', 'Angle θ = ') + ang + '°', PY0 + 296, WHITE, 24);
    /* 90°：打叉（夾角變 0 時消失）；0°：R 長條打勾 */
    cross(c, x0 + (w1 + w2) / 2, yb1, 16, ease(seg(u, 1.8, 2.3)), clamp01(S.th / 20));
    const chk = ease(seg(u, 7.8, 8.2));
    const pr = P(c, ra, 'R = ' + Rg + ' gw', PX0 + PW / 2, PY0 + 244, R_COL, 24, 'center', true);
    if (pr) check(c, pr.x + pr.w + 20, PY0 + 244, 11, chk, 1);
    P(c, fin(s, n, 7.8, 0.4), L('夾角 0°：同一直線、同方向', 'Angle 0°: one line, one way'), (MAT.x0 + MAT.x1) / 2, 200, OK_COL, 24, 'center');
    /* 結論 */
    row(c, fin(s, n, 5.2, 0.4) * fout(s, n, 6.2, 0.3), L('夾角變小，R 變大', 'Smaller angle, bigger R'), PY0 + 340, WHITE, 22);
    row(c, fin(s, n, 7.8, 0.4), L('同方向：R = 30 + 40', 'Same way: R = 30 + 40'), PY0 + 340, OK_COL, 22);
    bubble(c, fin(s, n, 8.0, 0.4), L('這樣才是 70！', 'Now it is 70!'), OK_COL);
    glowBottom(c, fin(s, n, 7.9, 0.5), L('只有同方向，合力才等於直接相加', 'Only same direction: R = 30 + 40'), OK_COL);
  }

  W5.register('parallelogram', { canvas: 'cvs-parallelogram', steps: DUR, draw });
})();
