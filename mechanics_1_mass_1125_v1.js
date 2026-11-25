/* ==================================================================
   mechanics_1 ｜ 質量：物質的含量（cvs-mass，960×540）
   四步：1 物質的含量 → 2 天平比一比 → 3 搬到月球 → 4 質量不變
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全站）：質量＝綠 COL.green（鐵塊裡代表物質的圓點、所有 kg 標籤、平衡時的指針光）。
   鐵塊＝深灰鋼色、砝碼＝亮鉻色（物體本身不佔用語意色）。
   一塊 6 kg 鐵塊的「物質」畫成 4 列 × 6 行＝24 顆綠點（每 1 kg 兩行），2 kg、4 kg 依比例 8、16 顆；
   第 4 步兩塊鐵塊的點一顆對一顆同時亮起，數得出一樣多。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   人物：March 圖（victory＝在月球上揮手），腳踩在月面線上。
   亂數一律 W5.hash；文字一律 L('中文','English')；整檔包在 IIFE。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const M_COL = COL.green;           /* 質量：綠 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', SPACE = '#0b1a15';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  /* 兩個 hex 色混合，回傳 hex（W5.ball 只吃 hex） */
  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }

  /* ── March 圖 ── */
  const MARCH = {};
  ['victory'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（也不記進 W5.boxes） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
  /* 底部字幕列（預設 y = 494） */
  function subtitle(c, a, str, border, col, yc) {
    if (a <= 0.02) return;
    yc = yc || 494;
    const size = 22, w = W5.tw(c, str, size) + 48, h = 46, y0 = yc - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    W5.label(c, str, 480, yc, col || WHITE, size);
    c.restore();
  }

  /* ── 木桌（與 ftypes 同款） ── */
  function bench(c, x0, x1, y, yb, a) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.35; c.fillStyle = INK; c.fillRect(x0 + 6, yb, x1 - x0 - 12, 6); c.restore();
      c.fillStyle = '#8a6040'; c.fillRect(x0, y - 12, x1 - x0, 12);
      c.fillStyle = 'rgba(255,220,170,0.28)'; c.fillRect(x0, y - 12, x1 - x0, 3);
      const g = c.createLinearGradient(0, y, 0, yb); g.addColorStop(0, '#5e3f26'); g.addColorStop(1, '#3d2816');
      c.fillStyle = g; c.fillRect(x0, y, x1 - x0, yb - y);
      c.strokeStyle = 'rgba(255,220,170,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const yy = y + 14 + i * 20; c.beginPath(); c.moveTo(x0, yy); c.bezierCurveTo(x0 + 200, yy - 4, x1 - 300, yy + 5, x1, yy); c.stroke(); }
      c.strokeStyle = '#2a1b0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    });
  }

  /* ── 鐵塊（立方體：正面＋頂面＋右側面）。xray 0..1 時正面變透明、露出代表物質的綠點 ──
     x：正面左緣、yb：底、cols×rows 個格子（每格一顆點）、cell 格寬。
     lit(i) 回傳第 i 顆點的亮度 0..1（i＝列優先編號）；不給就全亮。 */
  function blockGeom(x, yb, cols, rows, cell) {
    const w = cols * cell, h = rows * cell, d = cell * 0.7;
    return { x, yb, w, h, dx: d, dy: -d * 0.8, top: yb - h, cell, cols, rows };
  }
  function dotPos(G, i) {
    const r = Math.floor(i / G.cols), col = i % G.cols;
    return { x: G.x + (col + 0.5) * G.cell, y: G.top + (r + 0.5) * G.cell };
  }
  function ironBlock(c, G, a, xray, lit, dotR) {
    if (a <= 0.02) return;
    const { x, yb, w, h, dx, dy, top } = G;
    c.save(); c.globalAlpha *= a;
    /* 影子 */
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
    c.beginPath(); c.ellipse(x + w / 2 + dx / 2, yb + 2, w / 2 + dx / 2 + 6, 6 + dx * 0.15, 0, 0, TAU); c.fill(); c.restore();
    /* 右側面 */
    c.beginPath(); c.moveTo(x + w, yb); c.lineTo(x + w + dx, yb + dy); c.lineTo(x + w + dx, top + dy); c.lineTo(x + w, top); c.closePath();
    const gs = c.createLinearGradient(x + w, 0, x + w + dx, 0); gs.addColorStop(0, '#46514f'); gs.addColorStop(1, '#2f3937');
    c.fillStyle = gs; c.fill();
    /* 頂面 */
    c.beginPath(); c.moveTo(x, top); c.lineTo(x + dx, top + dy); c.lineTo(x + w + dx, top + dy); c.lineTo(x + w, top); c.closePath();
    const gt = c.createLinearGradient(0, top + dy, 0, top); gt.addColorStop(0, '#c3cdca'); gt.addColorStop(1, '#93a09c');
    c.fillStyle = gt; c.fill();
    /* 正面（實心部分隨 xray 變淡） */
    const solid = 1 - 0.82 * xray;
    c.save(); c.globalAlpha *= solid;
    const gf = c.createLinearGradient(0, top, 0, yb); gf.addColorStop(0, '#83908d'); gf.addColorStop(1, '#4a5553');
    c.fillStyle = gf; c.fillRect(x, top, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
    for (let i = 0; i < h / 5; i++) {
      const yy = top + 3 + i * 5 + hash(i * 3.1 + w) * 2;
      c.beginPath(); c.moveTo(x + 2, yy); c.lineTo(x + w - 2, yy); c.stroke();
    }
    c.restore();
    if (xray > 0.02) {
      c.save(); c.globalAlpha *= 0.9 * xray; c.fillStyle = 'rgba(11,26,21,0.85)'; c.fillRect(x, top, w, h); c.restore();
    }
    /* 邊線與高光 */
    c.strokeStyle = 'rgba(20,30,28,0.9)'; c.lineWidth = 1.5; c.strokeRect(x, top, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 1, top + 1); c.lineTo(x + w - 1, top + 1); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.beginPath(); c.moveTo(x + w, top); c.lineTo(x + w + dx, top + dy); c.stroke();
    /* 物質圓點 */
    if (xray > 0.02) {
      const n = G.cols * G.rows, r = dotR || G.cell * 0.28;
      for (let i = 0; i < n; i++) {
        const p = dotPos(G, i), l = lit ? lit(i) : 1;
        c.save(); c.globalAlpha *= xray;
        if (l > 0.02) W5.glow(c, p.x, p.y, r * 2.3, M_COL, 0.4 * l);
        W5.ball(c, p.x, p.y, r, mixHex('#3c5a50', M_COL, l));
        c.restore();
      }
    }
    c.restore();
  }

  /* ── 砝碼（亮鉻色，帶握鈕）；x 中心、yb 底 ── */
  function weight(c, x, yb, sc, a) {
    if (a <= 0.02) return;
    const w = 26 * sc, h = 30 * sc;
    c.save(); c.globalAlpha *= a;
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, '#5f6a68'); g.addColorStop(0.3, '#eef3f1'); g.addColorStop(0.55, '#b4bfbc'); g.addColorStop(1, '#55605d');
    c.fillStyle = g; W5.rr(c, x - w / 2, yb - h, w, h, 4 * sc); c.fill();
    c.strokeStyle = 'rgba(20,30,28,0.7)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - w / 2 + 2 * sc, yb - h + 2 * sc, w - 4 * sc, 2 * sc);
    /* 頸＋握鈕 */
    c.fillStyle = g; c.fillRect(x - 5 * sc, yb - h - 6 * sc, 10 * sc, 6 * sc);
    W5.ball(c, x, yb - h - 11 * sc, 7 * sc, '#c9d3d0');
    c.restore();
  }
  const WGAP = 30;                                        /* 砝碼中心間距（sc＝1） */
  function weightsRow(c, px, py, sc, count, alphaFn, yOffFn) {
    for (let i = 0; i < count; i++) {
      const a = alphaFn(i); if (a <= 0.02) continue;
      weight(c, px + (i - 2.5) * WGAP * sc, py - 1 + yOffFn(i), sc, a);
    }
  }

  /* ── 天平（等臂、吊盤式）。th＞0＝左盤下沉 ──
     o: { cx, gy, sc, th, a, left(px,py), right(px,py), ok（平衡光 0..1） } */
  function balanceGeom(cx, gy, sc, th) {
    const py0 = gy - 270 * sc, Lr = 230 * sc, S = 170 * sc;
    const eL = { x: cx - Lr * Math.cos(th), y: py0 + Lr * Math.sin(th) };
    const eR = { x: cx + Lr * Math.cos(th), y: py0 - Lr * Math.sin(th) };
    return { py0, Lr, S, eL, eR, pL: { x: eL.x, y: eL.y + S }, pR: { x: eR.x, y: eR.y + S } };
  }
  function balance(c, o) {
    const { cx, gy, sc, th, a } = o;
    if (a <= 0.02) return;
    const B = balanceGeom(cx, gy, sc, th), prx = 110 * sc;
    c.save(); c.globalAlpha *= a;
    /* 底座 */
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK; c.beginPath(); c.ellipse(cx, gy + 2, 120 * sc, 7 * sc, 0, 0, TAU); c.fill(); c.restore();
    const gb = c.createLinearGradient(0, gy - 24 * sc, 0, gy);
    gb.addColorStop(0, '#9aa7a3'); gb.addColorStop(1, '#3f4a48');
    c.fillStyle = gb;
    c.beginPath(); c.moveTo(cx - 112 * sc, gy); c.lineTo(cx - 92 * sc, gy - 24 * sc); c.lineTo(cx + 92 * sc, gy - 24 * sc); c.lineTo(cx + 112 * sc, gy); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(cx - 90 * sc, gy - 24 * sc, 180 * sc, 2 * sc);
    /* 立柱 */
    const gp = c.createLinearGradient(cx - 9 * sc, 0, cx + 9 * sc, 0);
    gp.addColorStop(0, '#5d6a67'); gp.addColorStop(0.4, '#d6dfdc'); gp.addColorStop(1, '#4d5856');
    c.fillStyle = gp; c.fillRect(cx - 9 * sc, B.py0 - 4 * sc, 18 * sc, gy - 24 * sc - B.py0 + 4 * sc);
    /* 指針刻度板 */
    const tipR = 196 * sc, plY = B.py0 + tipR - 4 * sc;
    c.fillStyle = 'rgba(11,26,21,0.92)'; W5.rr(c, cx - 48 * sc, plY - 14 * sc, 96 * sc, 30 * sc, 6 * sc); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      const tx = cx + Math.sin(i * 0.07) * tipR, hh = i === 0 ? 14 : 8;
      c.strokeStyle = i === 0 ? W5.mix('#f6f3ea', M_COL, o.ok || 0) : 'rgba(246,243,234,0.55)';
      c.lineWidth = i === 0 ? 3 : 2;
      c.beginPath(); c.moveTo(tx, plY + 12 * sc); c.lineTo(tx, plY + 12 * sc - hh * sc); c.stroke();
    }
    /* 吊繩 */
    c.strokeStyle = 'rgba(214,223,220,0.75)'; c.lineWidth = Math.max(1.2, 2 * sc);
    [[B.eL, B.pL], [B.eR, B.pR]].forEach(([e, p]) => {
      c.beginPath(); c.moveTo(p.x - (prx - 6 * sc), p.y); c.lineTo(e.x, e.y + 10 * sc); c.lineTo(p.x + (prx - 6 * sc), p.y); c.stroke();
    });
    /* 秤盤 */
    [B.pL, B.pR].forEach(p => {
      const gpan = c.createLinearGradient(0, p.y, 0, p.y + 16 * sc);
      gpan.addColorStop(0, '#b9c4c1'); gpan.addColorStop(1, '#4f5a58');
      c.fillStyle = gpan;
      c.beginPath(); c.moveTo(p.x - prx, p.y); c.quadraticCurveTo(p.x, p.y + 30 * sc, p.x + prx, p.y); c.closePath(); c.fill();
      c.fillStyle = '#dfe8e4'; c.beginPath(); c.ellipse(p.x, p.y, prx, 5 * sc, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(40,52,48,0.6)'; c.lineWidth = 1; c.stroke();
    });
    /* 盤上的東西 */
    if (o.left) o.left(B.pL.x, B.pL.y - 2 * sc);
    if (o.right) o.right(B.pR.x, B.pR.y - 2 * sc);
    /* 秤桿 */
    c.save(); c.translate(cx, B.py0); c.rotate(-th);
    const gbeam = c.createLinearGradient(0, -10 * sc, 0, 10 * sc);
    gbeam.addColorStop(0, '#eef3f1'); gbeam.addColorStop(0.5, '#a9b5b2'); gbeam.addColorStop(1, '#55605d');
    c.fillStyle = gbeam;
    c.beginPath();
    c.moveTo(-B.Lr, -4 * sc); c.lineTo(0, -10 * sc); c.lineTo(B.Lr, -4 * sc);
    c.lineTo(B.Lr, 4 * sc); c.lineTo(0, 10 * sc); c.lineTo(-B.Lr, 4 * sc); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,30,28,0.6)'; c.lineWidth = 1; c.stroke();
    W5.ball(c, -B.Lr, 0, 7 * sc, '#c9d3d0'); W5.ball(c, B.Lr, 0, 7 * sc, '#c9d3d0');
    /* 指針（與秤桿一體） */
    const ok = o.ok || 0;
    if (ok > 0.02) { c.save(); c.globalAlpha *= ok; c.strokeStyle = W5.rgba(M_COL, 0.45); c.lineWidth = 10 * sc + 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 14 * sc); c.lineTo(0, tipR - 6 * sc); c.stroke(); c.restore(); }
    c.strokeStyle = 'rgba(20,30,28,0.85)'; c.lineWidth = Math.max(4, 7 * sc); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 14 * sc); c.lineTo(0, tipR - 4 * sc); c.stroke();
    c.strokeStyle = W5.mix('#f6f3ea', M_COL, ok); c.lineWidth = Math.max(2, 4 * sc);
    c.beginPath(); c.moveTo(0, 14 * sc); c.lineTo(0, tipR - 4 * sc); c.stroke();
    c.fillStyle = W5.mix('#f6f3ea', M_COL, ok);
    c.beginPath(); c.moveTo(0, tipR + 2 * sc); c.lineTo(-5 * sc, tipR - 10 * sc); c.lineTo(5 * sc, tipR - 10 * sc); c.closePath(); c.fill();
    c.restore();
    /* 掛鉤 */
    c.strokeStyle = '#c9d3d0'; c.lineWidth = Math.max(1.5, 2.5 * sc);
    [B.eL, B.eR].forEach(e => { c.beginPath(); c.moveTo(e.x, e.y + 4 * sc); c.lineTo(e.x, e.y + 10 * sc); c.stroke(); });
    /* 支點 */
    c.fillStyle = '#7d8a87';
    c.beginPath(); c.moveTo(cx, B.py0 - 2 * sc); c.lineTo(cx - 12 * sc, B.py0 + 16 * sc); c.lineTo(cx + 12 * sc, B.py0 + 16 * sc); c.closePath(); c.fill();
    W5.ball(c, cx, B.py0, 9 * sc, '#dfe8e4');
    c.restore();
    return B;
  }

  /* 秤桿受到「加一個重物」後擺動、停下（x＝放上後經過的秒數）：0 → 1 */
  function settle(x) {
    if (x <= 0) return 0;
    if (x >= 1.6) return 1;
    return 1 - Math.exp(-5 * x) * Math.cos(9 * x);
  }
  const TH = 0.2;                                         /* 最大傾角（rad） */
  const DROP = 0.45;
  /* 掉落：tl＝落到盤上的時刻；回傳 { y 偏移, a 透明度 } */
  function drop(u, tl, hgt) {
    const q = seg(u, tl - DROP, tl);
    return { y: -(1 - q * q) * hgt, a: ease(seg(u, tl - DROP, tl - DROP + 0.15)) };
  }

  /* ═══════════ 步驟 1：物質的含量 ═══════════ */
  const B1Y = 430;                                        /* 桌面 */
  const C1 = 30;
  const BLK1 = [
    { kg: 2, G: blockGeom(70, B1Y, 2, 4, C1) },
    { kg: 4, G: blockGeom(170, B1Y, 4, 4, C1) },
    { kg: 6, G: blockGeom(330, B1Y, 6, 4, C1) }
  ];
  const ZX = 750, ZY = 250, ZR = 150, ZS = 40;            /* 放大圈 */
  const LENS = { x: 318, y: 290, w: 236, h: 152 };

  function zoomDot(i) { const r = Math.floor(i / 6), col = i % 6; return { x: ZX + (col - 2.5) * ZS, y: ZY + (r - 1.5) * ZS }; }

  function draw1(c, s) {
    const u = s.u, k = s.k;
    bench(c, 30, 580, B1Y, 500, k);
    /* 三塊鐵塊依序滑入 */
    const xray = ease(seg(u, 4.4, 5.2));
    BLK1.forEach((b, j) => {
      const a = ease(seg(u, 0.15 + j * 0.3, 0.75 + j * 0.3));
      c.save(); c.translate(0, -(1 - a) * 24);
      ironBlock(c, b.G, a, xray, null, 8);
      c.restore();
      const cxL = b.G.x + (b.G.w + b.G.dx) / 2;
      P(c, ease(seg(u, 0.6 + j * 0.3, 1.1 + j * 0.3)), b.kg + ' kg', cxL, 268, M_COL, 22, 'center', true);
    });

    /* 放大鏡框＋錐形連線 */
    const aLens = ease(seg(u, 1.4, 1.9));
    const R = ZR * ease(seg(u, 1.8, 2.6));
    withA(c, aLens, () => {
      c.save(); c.setLineDash([7, 7]); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5;
      W5.rr(c, LENS.x, LENS.y, LENS.w, LENS.h, 12); c.stroke();
      if (R > 2) {
        c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2;
        const a1 = Math.PI * 1.13, a2 = Math.PI * 0.87;
        c.beginPath(); c.moveTo(LENS.x + LENS.w, LENS.y); c.lineTo(ZX + R * Math.cos(a1), ZY + R * Math.sin(a1));
        c.moveTo(LENS.x + LENS.w, LENS.y + LENS.h); c.lineTo(ZX + R * Math.cos(a2), ZY + R * Math.sin(a2)); c.stroke();
      }
      c.restore();
    });
    /* 放大圈 */
    if (R > 2) {
      c.save();
      W5.glow(c, ZX, ZY, R * 1.25, M_COL, 0.12);
      c.fillStyle = 'rgba(11,26,21,0.96)'; c.beginPath(); c.arc(ZX, ZY, R, 0, TAU); c.fill();
      c.beginPath(); c.arc(ZX, ZY, R, 0, TAU); c.clip();
      /* 鐵塊內部的淡色框 */
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2;
      W5.rr(c, ZX - 3 * ZS, ZY - 2 * ZS, 6 * ZS, 4 * ZS, 8); c.stroke();
      for (let i = 0; i < 24; i++) {
        const q = seg(u, 2.6 + i * 0.07, 2.85 + i * 0.07); if (q <= 0) continue;
        const pop = q < 1 ? 1 + 0.35 * Math.sin(Math.PI * q) : 1;
        const p = zoomDot(i);
        W5.glow(c, p.x, p.y, 30, M_COL, 0.35 * q);
        W5.ball(c, p.x, p.y, 14 * ease(q) * pop, M_COL);
      }
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(ZX, ZY, R, 0, TAU); c.stroke();
      c.strokeStyle = W5.rgba(M_COL, 0.6); c.lineWidth = 1.5; c.beginPath(); c.arc(ZX, ZY, R + 5, 0, TAU); c.stroke();
    }
    P(c, ease(seg(u, 3.4, 3.9)), L('一顆圓點＝一小份物質', 'One dot = a bit of matter'), ZX, 432, WHITE, 22);

    /* 結論 */
    P(c, ease(seg(u, 5.0, 5.5)), L('質量＝物質的含量', 'Mass = amount of matter'), 480, 64, M_COL, 26);
    subtitle(c, ease(seg(u, 5.8, 6.4)), L('圓點越多 → 物質越多 → 質量越大', 'More dots → more matter → more mass'), M_COL);
  }

  /* ═══════════ 步驟 2：天平比一比 ═══════════ */
  const GY2 = 440, BX2 = 480;
  const W2_T0 = 1.3, W2_DT = 0.72;                       /* 第 i 個砝碼落下的時刻 = W2_T0 + i·W2_DT */
  const land2 = i => W2_T0 + i * W2_DT;
  function th2(u) {
    let th = TH;
    for (let i = 0; i < 6; i++) th -= TH / 6 * settle(u - land2(i));
    return th;
  }
  const BLK2 = (px, py) => blockGeom(px - 54 - 8, py, 6, 4, 18);

  function draw2(c, s) {
    const u = s.u, k = s.k;
    bench(c, 150, 810, GY2, 515, k);
    const th = th2(u);
    const nOn = [0, 1, 2, 3, 4, 5].filter(i => u >= land2(i)).length;
    const ok = ease(seg(u, 6.2, 6.7));
    balance(c, {
      cx: BX2, gy: GY2, sc: 1, th, a: k, ok,
      left(px, py) {
        const G = BLK2(px, py);
        ironBlock(c, G, 1, 0);
        T(c, 1, '6 kg', G.x + G.w / 2, G.top + G.h / 2, M_COL, 22, 'center', true);
      },
      right(px, py) {
        weightsRow(c, px, py, 1, 6, i => drop(u, land2(i), 120).a, i => drop(u, land2(i), 120).y);
      }
    });
    P(c, ease(seg(u, 0.4, 1.0)), L('天平：比較兩邊', 'Balance: compare both sides'), 480, 64, WHITE, 26);
    /* 砝碼計數（右盤下方） */
    const B = balanceGeom(BX2, GY2, 1, th);
    if (nOn > 0) P(c, k, L('砝碼 1 kg × ', 'Weights 1 kg × ') + nOn, B.pR.x, 412, WHITE, 22);
    else P(c, k * ease(seg(u, 0.5, 1.0)), L('右盤還沒放砝碼', 'Right pan: no weights yet'), B.pR.x, 412, DIM, 22);
    subtitle(c, ease(seg(u, 6.4, 7.0)), L('平衡了：鐵塊的質量＝ 6 kg', 'Balanced: the iron block is 6 kg'), M_COL, M_COL);
  }

  /* ═══════════ 步驟 3：搬到月球 ═══════════ */
  const GY3 = 440, SC3 = 0.5, EX3 = 240, MX3 = 668;
  const BLK_T3 = 1.35;                                    /* 鐵塊落到左盤 */
  const W3_T0 = 2.0, W3_DT = 0.3;
  const land3 = i => W3_T0 + i * W3_DT;
  function th3(u) {
    let th = TH * settle(u - BLK_T3);
    for (let i = 0; i < 6; i++) th -= TH / 6 * settle(u - land3(i));
    return Math.max(-TH, Math.min(TH, th));
  }
  const BLK3 = (px, py) => blockGeom(px - 27 - 4, py, 6, 4, 9);

  function earthHalf(c, a) {
    withA(c, a, () => {
      c.save(); c.beginPath(); c.rect(0, 32, 480, 508); c.clip();
      const sky = c.createLinearGradient(0, 32, 0, GY3);
      sky.addColorStop(0, '#0c1f19'); sky.addColorStop(1, '#14352b');
      c.fillStyle = sky; c.fillRect(0, 32, 480, GY3 - 32);
      /* 背景的地球：藍綠星球 */
      const ex = 250, ey = 158, er = 80;
      W5.glow(c, ex, ey, er * 1.45, '#7fc8ff', 0.28);
      c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip();
      const go = c.createRadialGradient(ex - er * 0.35, ey - er * 0.4, er * 0.1, ex, ey, er);
      go.addColorStop(0, '#4aa3e8'); go.addColorStop(1, '#14457a');
      c.fillStyle = go; c.fillRect(ex - er, ey - er, er * 2, er * 2);
      c.fillStyle = '#3f9a5a';
      [[-40, -30, 34, 22, 0.4], [10, 10, 40, 26, -0.3], [-30, 40, 22, 14, 0.2], [48, -44, 20, 12, 0.6], [-70, 6, 16, 26, 0]].forEach(([dx, dy, rx, ry, rot]) => {
        c.beginPath(); c.ellipse(ex + dx, ey + dy, rx, ry, rot, 0, TAU); c.fill();
      });
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 5; c.lineCap = 'round';
      [[-60, -55, 40], [0, 50, 50], [20, -20, 30]].forEach(([dx, dy, l]) => { c.beginPath(); c.moveTo(ex + dx, ey + dy); c.lineTo(ex + dx + l, ey + dy - 6); c.stroke(); });
      const sh = c.createRadialGradient(ex - er * 0.5, ey - er * 0.5, er * 0.4, ex, ey, er * 1.25);
      sh.addColorStop(0, 'rgba(11,26,21,0)'); sh.addColorStop(1, 'rgba(11,26,21,0.7)');
      c.fillStyle = sh; c.fillRect(ex - er, ey - er, er * 2, er * 2);
      c.restore();
      c.strokeStyle = 'rgba(160,220,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.stroke();
      /* 草地 */
      const g = c.createLinearGradient(0, GY3, 0, 540);
      g.addColorStop(0, '#1c4a31'); g.addColorStop(1, '#10291f');
      c.fillStyle = g; c.fillRect(0, GY3, 480, 100);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, GY3); c.lineTo(480, GY3); c.stroke();
      c.strokeStyle = 'rgba(120,210,140,0.55)'; c.lineWidth = 2;
      for (let x = 6; x < 476; x += 13) {
        const h = 6 + 7 * hash(x * 0.37), lean = (hash(x * 1.3) - 0.5) * 6;
        c.beginPath(); c.moveTo(x, GY3); c.lineTo(x + lean, GY3 - h); c.stroke();
      }
      c.restore();
    });
  }
  function moonHalf(c, a) {
    withA(c, a, () => {
      c.save(); c.beginPath(); c.rect(480, 32, 480, 508); c.clip();
      c.fillStyle = SPACE; c.fillRect(480, 32, 480, 508);
      /* 星星 */
      for (let i = 0; i < 46; i++) {
        const x = 490 + hash(i * 7.3) * 460, y = 90 + hash(i * 3.9 + 1) * 300, r = 0.8 + hash(i * 1.7) * 1.6;
        c.fillStyle = 'rgba(246,243,234,' + (0.25 + 0.5 * hash(i * 9.1)) + ')';
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      /* 月面 */
      const g = c.createLinearGradient(0, GY3 - 10, 0, 540);
      g.addColorStop(0, '#a3aaa7'); g.addColorStop(1, '#4f5654');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(480, GY3 + 4);
      for (let x = 480; x <= 960; x += 20) c.lineTo(x, GY3 + 2 * Math.sin(x * 0.05) + (hash(x) - 0.5) * 2);
      c.lineTo(960, 540); c.lineTo(480, 540); c.closePath(); c.fill();
      c.strokeStyle = '#cfd6d3'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(480, GY3); c.lineTo(960, GY3); c.stroke();
      /* 隕石坑 */
      [[540, 470, 26], [640, 505, 34], [760, 462, 18], [850, 498, 30], [930, 458, 14], [700, 530, 22]].forEach(([x, y, r]) => {
        c.fillStyle = 'rgba(60,66,64,0.55)'; c.beginPath(); c.ellipse(x, y, r, r * 0.32, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(220,226,223,0.45)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 1.5, r, r * 0.32, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      });
      /* 遠方的大月面弧（背景） */
      c.restore();
    });
  }
  function marchWave(c, u, a) {
    const im = MARCH.victory;
    if (a <= 0.01 || !im || !im.complete || !im.naturalWidth) return;
    const h = 150, w = im.naturalWidth * h / im.naturalHeight, x = 846, gy = GY3;
    const env = ease(seg(u, 0.9, 1.3)) * (1 - ease(seg(u, 6.0, 6.6)));
    const ang = 0.07 * Math.sin((u - 0.9) * 7.5) * env;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK; c.beginPath(); c.ellipse(x + w * 0.5, gy + 2, w * 0.4, 6, 0, 0, TAU); c.fill(); c.restore();
    c.translate(x + w * 0.5, gy); c.rotate(ang);
    c.drawImage(im, -w * 0.5, -h, w, h);
    /* 揮手的弧線 */
    if (env > 0.02) {
      c.globalAlpha *= env * (0.5 + 0.5 * Math.abs(Math.sin((u - 0.9) * 7.5)));
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5; c.lineCap = 'round';
      [[-w * 0.5 + 6, -h + 18, Math.PI * 0.95, Math.PI * 1.35], [w * 0.5 - 6, -h + 12, -Math.PI * 0.35, Math.PI * 0.05]].forEach(([hx, hy, a0, a1]) => {
        c.beginPath(); c.arc(hx, hy, 16, a0, a1); c.stroke();
        c.beginPath(); c.arc(hx, hy, 24, a0, a1); c.stroke();
      });
    }
    c.restore();
  }
  function check(c, x, y, a) {
    withA(c, a, () => {
      W5.glow(c, x, y, 26, M_COL, 0.35);
      c.strokeStyle = M_COL; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x - 3, y + 8); c.lineTo(x + 12, y - 9); c.stroke();
    });
  }

  function draw3(c, s) {
    const u = s.u, k = s.k;
    earthHalf(c, k);
    moonHalf(c, k);
    /* 分隔線 */
    withA(c, k, () => {
      const g = c.createLinearGradient(0, 32, 0, 540);
      g.addColorStop(0, 'rgba(246,243,234,0)'); g.addColorStop(0.2, 'rgba(246,243,234,0.55)'); g.addColorStop(1, 'rgba(246,243,234,0.2)');
      c.fillStyle = g; c.fillRect(478.5, 32, 3, 508);
    });
    const th = th3(u), ok = ease(seg(u, 5.0, 5.5));
    const bDrop = drop(u, BLK_T3, 70);
    const load = {
      left(px, py) {
        c.save(); c.globalAlpha *= bDrop.a; c.translate(0, bDrop.y);
        ironBlock(c, BLK3(px, py), 1, 0); c.restore();
      },
      right(px, py) { weightsRow(c, px, py, SC3, 6, i => drop(u, land3(i), 60).a, i => drop(u, land3(i), 60).y); }
    };
    [EX3, MX3].forEach(cx => balance(c, Object.assign({ cx, gy: GY3, sc: SC3, th, a: k, ok }, load)));
    marchWave(c, u, k);

    P(c, k, L('地球', 'Earth'), 24, 64, WHITE, 26, 'left');
    P(c, k, L('月球', 'Moon'), 504, 64, WHITE, 26, 'left');

    /* 平衡後的標籤：盤下方 */
    const aLab = ease(seg(u, 4.8, 5.3));
    [EX3, MX3].forEach(cx => {
      const B = balanceGeom(cx, GY3, SC3, th);
      P(c, aLab, '6 kg', B.pL.x, 464, M_COL, 22, 'center', true);
      P(c, aLab, '1 kg × 6', B.pR.x, 464, WHITE, 22, 'center', true);
      check(c, cx, B.py0 - 30, ok);
    });
    subtitle(c, ease(seg(u, 5.4, 6.0)), L('天平仍然平衡：質量一樣', 'Still balanced: same mass'), M_COL, M_COL, 512);
  }

  /* ═══════════ 步驟 4：質量不變 ═══════════ */
  const B4Y = 360, C4 = 34;
  const G4L = blockGeom(140, B4Y, 6, 4, C4), G4R = blockGeom(592, B4Y, 6, 4, C4);
  const P4_T0 = 1.8, P4_DT = 0.12;
  function planetIcon(c, x, y, moon, a) {
    withA(c, a, () => {
      if (moon) {
        W5.ball(c, x, y, 13, '#b9c0bd');
        c.fillStyle = 'rgba(70,78,75,0.6)';
        c.beginPath(); c.arc(x - 4, y - 2, 3.5, 0, TAU); c.arc(x + 5, y + 4, 2.5, 0, TAU); c.fill();
      } else {
        W5.ball(c, x, y, 13, '#3f8fd6');
        c.fillStyle = 'rgba(63,154,90,0.9)';
        c.beginPath(); c.ellipse(x - 3, y - 2, 6, 4, 0.4, 0, TAU); c.ellipse(x + 5, y + 5, 4, 3, 0, 0, TAU); c.fill();
      }
    });
  }
  function placeTag(c, a, str, cx, y, moon) {
    if (a <= 0.02) return;
    const w = W5.tw(c, str, 22) + 28, iw = 34, x0 = cx - (w + iw) / 2;
    planetIcon(c, x0 + 13, y, moon, a);
    P(c, a, str, x0 + iw, y, DIM, 22, 'left');
  }

  function draw4(c, s) {
    const u = s.u, k = s.k;
    bench(c, 70, 890, B4Y, 440, k);
    const xray = ease(seg(u, 0.8, 1.6));
    const lit = i => ease(seg(u, P4_T0 + i * P4_DT, P4_T0 + i * P4_DT + 0.15));
    ironBlock(c, G4L, k, xray, lit, 10);
    ironBlock(c, G4R, k, xray, lit, 10);
    /* 正在數的這一對：一條連線＋光圈（數完就消失） */
    for (let i = 0; i < 24; i++) {
      const f = Math.sin(Math.PI * seg(u, P4_T0 + i * P4_DT, P4_T0 + i * P4_DT + 0.36));
      if (f <= 0.02) continue;
      const a = dotPos(G4L, i), b = dotPos(G4R, i);
      withA(c, f, () => {
        W5.glow(c, a.x, a.y, 30, M_COL, 0.6); W5.glow(c, b.x, b.y, 30, M_COL, 0.6);
        c.save(); c.setLineDash([6, 7]); c.strokeStyle = W5.rgba(M_COL, 0.55); c.lineWidth = 2;
        c.beginPath(); c.moveTo(a.x + 12, a.y); c.bezierCurveTo(a.x + 120, a.y - 60, b.x - 120, b.y - 60, b.x - 12, b.y); c.stroke(); c.restore();
      });
    }
    placeTag(c, k, L('在地球', 'On Earth'), G4L.x + G4L.w / 2, 150, false);
    placeTag(c, k, L('在月球', 'On the Moon'), G4R.x + G4R.w / 2, 150, true);

    const aEq = ease(seg(u, 5.0, 5.5));
    T(c, aEq, '＝', 480, 292, M_COL, 48);
    P(c, aEq, L('質量 6 kg', 'Mass 6 kg'), G4L.x + G4L.w / 2, 404, M_COL, 24);
    P(c, aEq, L('質量 6 kg', 'Mass 6 kg'), G4R.x + G4R.w / 2, 404, M_COL, 24);
    subtitle(c, ease(seg(u, 5.9, 6.5)), L('質量：天平、kg、g；不隨地點改變', 'Mass: balance, kg, g; it stays the same anywhere'), M_COL, WHITE);
  }

  W5.register('mass', {
    canvas: 'cvs-mass',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) draw1(c, s);
      else if (s.n === 2) draw2(c, s);
      else if (s.n === 3) draw3(c, s);
      else draw4(c, s);
    }
  });
})();
