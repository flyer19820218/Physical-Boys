/* mechanics_2_lab_incline_1125_v1.js — 「動手做｜斜面車子解析」實驗台（#inclineLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.incline = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab5 最後，並注入 <style id="lab-incline-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 規則：重力 W 垂直向下；下滑力 ＝ W·sinθ（平行斜面向下）、壓迫力 ＝ W·cosθ（垂直斜面向下）；
 *   兩分力與 W 組成長方形（虛線）。正向力 N 與壓迫力等長、方向相反（綠，可顯示／隱藏）。
 *   箭頭長度 ＝ gw × PX_PER_GW（畫面左下角有比例尺）。
 * 因果：車子沿斜面往下滑（無摩擦示意），加速度 ∝ sinθ（與 W 無關）；滑到底端附近停一下，回到頂部重來；θ＝0° 不動。
 *   改任何滑桿／按鈕，車子回到斜面頂部重新滑。
 * 動畫：只在 θ > 0、分頁啟用、畫布在視窗內時跑一條 RAF；其餘時間靜止不跑。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'incline', TAB = 'tab5';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* ═════════ 幾何與常數 ═════════ */
  const PX_PER_GW = 1.0;                 /* 箭頭長度：每 gw 幾像素 */
  const GY = 360, XV = 560;              /* 地面線 y、斜面底端頂點（θ 角）x */
  const BASE = 520, HMAX = 270;          /* 底邊長（縮放前）、斜面最大高度（θ 大時縮放） */
  const CAR_HALF = 42, CAR_CY = 30;      /* 車長一半、車身中心離坡面的距離 */
  const STOP_D = 56;                     /* 車中心停在離底端頂點的坡面距離 */
  const A_G = 350;                       /* 加速度示意：a ＝ A_G·sinθ（px/s²），與 W 無關（無摩擦時 a ＝ g·sinθ） */
  const HOLD_BOTTOM = 1.0, HOLD_TOP = 0.7;
  const MARCH = { cx: 850, h: 180, feet: GY + 2 };

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const deg = r => r * 180 / Math.PI;
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function font(size) { return '700 ' + size + 'px "Noto Sans TC","JetBrains Mono",sans-serif'; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const TW = new Map();
  function tw(c, s, size) {
    const k = size + '|' + s; let w = TW.get(k);
    if (w === undefined) { c.save(); c.font = font(size); w = c.measureText(s).width; c.restore(); if (TW.size > 3000) TW.clear(); TW.set(k, w); }
    return w;
  }

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    th: 30, w: 100, showN: false,
    dv: 0, v: 0, phase: 'top', pt: 0,      /* 車中心離底端頂點的坡面距離、速度、階段、階段計時 */
    actions: 0, note: 'start', boxes: [], idle: true
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  /* 人物圖 */
  const IMG = {};
  function loadImg(k, src) {
    const im = new Image(); im.onload = () => { if (!S.raf) render(); }; im.src = src; IMG[k] = im;
  }
  loadImg('thinking', 'assets/characters/march/thinking.png');
  loadImg('shocked', 'assets/characters/march/shocked.png');

  /* ═════════ 物理（向量計算，顯示時才四捨五入） ═════════ */
  function calc() {
    const r = S.th * Math.PI / 180, sn = Math.sin(r), cs = Math.cos(r);
    const W0 = S.w;
    const fs = W0 * sn, fp = W0 * cs;
    return { r, sn, cs, fs, fp, N: Math.hypot(0, fp) };
  }
  function geom() {
    const r = S.th * Math.PI / 180, sn = Math.sin(r), cs = Math.cos(r), tn = Math.tan(r);
    const s = tn > 0 ? Math.min(1, HMAX / (BASE * tn)) : 1;
    const bs = BASE * s, hh = bs * tn, Lh = bs / cs;
    return { r, sn, cs, s, bs, hh, Lh, x0: XV - bs, yTop: GY - hh, dv0: Lh - STOP_D };
  }
  function carPose() {
    const g = geom();
    const px = XV - S.dv * g.cs, py = GY - S.dv * g.sn;                 /* 坡面上的接觸點 */
    return { g, px, py, cx: px + CAR_CY * g.sn, cy: py - CAR_CY * g.cs };    /* 車身中心 */
  }
  function restart(note) {
    S.dv = geom().dv0; S.v = 0; S.phase = S.th > 0 ? 'top' : 'still'; S.pt = 0; S.note = note || S.note;
  }

  /* ═════════ 文字（記錄框供檢查） ═════════ */
  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    const b = { s, str: s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size };
    S.boxes.push(b); return b;
  }

  /* ═════════ 繪圖元件 ═════════ */
  function arrow(c, x0, y0, x1, y1, color, lw) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    const ux = dx / len, uy = dy / len;
    const hl = Math.min(18, Math.max(8, len * 0.4)), hw = hl * 0.5;
    const bx = x1 - ux * hl * 0.8, by = y1 - uy * hl * 0.8;
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineCap = 'round';
    c.shadowColor = rgba(color, 0.55); c.shadowBlur = 8;
    c.lineWidth = lw;
    if (len > hl * 0.8) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(bx, by); c.stroke(); }
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(bx - uy * hw, by + ux * hw); c.lineTo(bx + uy * hw, by - ux * hw); c.closePath(); c.fill();
    c.restore();
  }
  function dashed(c, x0, y0, x1, y1, color) {
    c.save(); c.setLineDash([8, 6]); c.strokeStyle = rgba(color, 0.9); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
  }

  function drawGround(c) {
    c.fillStyle = 'rgba(246,243,234,0.05)'; c.fillRect(0, GY, W, H - GY);
    c.strokeStyle = COL.white; c.lineWidth = 4; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(0, GY); c.lineTo(W, GY); c.stroke();
  }
  function drawSlope(c, g) {
    if (g.hh < 1) return;
    c.save();
    const gr = c.createLinearGradient(0, g.yTop, 0, GY);
    gr.addColorStop(0, '#2c5a4c'); gr.addColorStop(1, '#1f4439');
    c.fillStyle = gr; c.beginPath(); c.moveTo(g.x0, GY); c.lineTo(XV, GY); c.lineTo(g.x0, g.yTop); c.closePath(); c.fill();
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
    /* 直角記號 */
    const k = Math.min(16, g.hh * 0.6, g.bs * 0.6);
    c.strokeStyle = COL.dim; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(g.x0 + k, GY); c.lineTo(g.x0 + k, GY - k); c.lineTo(g.x0, GY - k); c.stroke();
    c.restore();
  }
  function drawAngle(c, g) {
    const ra = clamp(Math.min(58, g.bs * 0.8), 20, 58);
    c.save();
    if (S.th > 0) {
      c.fillStyle = rgba(COL.yellow, 0.2);
      c.beginPath(); c.moveTo(XV, GY); c.arc(XV, GY, ra, Math.PI, Math.PI + g.r, false); c.closePath(); c.fill();
      c.strokeStyle = COL.yellow; c.lineWidth = 3.5;
      c.beginPath(); c.arc(XV, GY, ra, Math.PI, Math.PI + g.r, false); c.stroke();
    }
    c.restore();
    return label(c, 'θ = ' + S.th + '°', XV + 20 + 90 * Math.pow(Math.sin(g.r), 2), GY - 26, COL.yellow, 22, 'left');
  }
  function drawMarch(c) {
    const im = IMG[S.th > 40 ? 'shocked' : 'thinking'];
    const kx = { x0: MARCH.cx - 80, x1: MARCH.cx + 80, y0: MARCH.feet - MARCH.h - 4, y1: MARCH.feet + 4 };
    if (im && im.complete && im.naturalWidth) {
      const h = MARCH.h, w = im.naturalWidth / im.naturalHeight * h;
      c.drawImage(im, MARCH.cx - w / 2, MARCH.feet - h, w, h);
      kx.x0 = MARCH.cx - w / 2 - 4; kx.x1 = MARCH.cx + w / 2 + 4;
    }
    return kx;
  }
  function drawScale(c) {
    const len = 100 * PX_PER_GW, y = 508, x = W - 36 - len - 120;
    const b0 = label(c, T('比例尺', 'Scale'), x, y - 34, COL.dim, 22, 'left');
    c.save(); c.strokeStyle = COL.white; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.moveTo(x, y - 8); c.lineTo(x, y + 8); c.moveTo(x + len, y - 8); c.lineTo(x + len, y + 8); c.stroke();
    c.restore();
    const b1 = label(c, '= 100 gw', x + len + 12, y, COL.dim, 22, 'left');
    return { x0: Math.min(b0.x0, x), x1: Math.max(b0.x1, b1.x1), y0: b0.y0, y1: b1.y1 };
  }
  function drawCar(c, g, px, py) {
    c.save(); c.translate(px, py); c.rotate(g.r);
    /* 輪子 */
    for (const wx of [-27, 27]) {
      c.fillStyle = '#26352f'; c.strokeStyle = '#d6dfdc'; c.lineWidth = 3;
      c.beginPath(); c.arc(wx, -10, 10, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#d6dfdc'; c.beginPath(); c.arc(wx, -10, 3.2, 0, TAU); c.fill();
    }
    /* 車身 */
    const gr = c.createLinearGradient(0, -44, 0, -18);
    gr.addColorStop(0, '#f4f1e6'); gr.addColorStop(1, '#bcc9c3');
    c.fillStyle = gr; c.strokeStyle = '#5c6e68'; c.lineWidth = 2.5;
    rr(c, -CAR_HALF, -44, CAR_HALF * 2, 26, 7); c.fill(); c.stroke();
    /* 車廂與窗 */
    c.fillStyle = gr; c.beginPath(); c.moveTo(-26, -44); c.lineTo(-18, -58); c.lineTo(14, -58); c.lineTo(24, -44); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#1b3a49';
    c.beginPath(); c.moveTo(-20, -46); c.lineTo(-14, -55); c.lineTo(-2, -55); c.lineTo(-2, -46); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(3, -46); c.lineTo(3, -55); c.lineTo(11, -55); c.lineTo(19, -46); c.closePath(); c.fill();
    /* 車燈、飾條 */
    c.fillStyle = COL.yellow; c.fillRect(CAR_HALF - 7, -38, 6, 8);
    c.fillStyle = '#d6dfdc'; c.fillRect(-CAR_HALF + 3, -30, 8, 6);
    c.restore();
  }

  /* ═════════ 標籤擺放（避開箭頭、車、斜面、其他標籤、March） ═════════ */
  function place(c, str, color, ax, ay, dirs, obst, placed) {
    const size = 22, w = tw(c, str, size), hh = size * 0.6;
    const test = (x0, y0) => {
      const x1 = x0 + w, y1 = y0 + hh * 2;
      if (x0 < 6 || x1 > W - 6 || y0 < 6 || y1 > H - 6) return false;
      for (const p of obst.pts) if (p[0] > x0 - 4 && p[0] < x1 + 4 && p[1] > y0 - 4 && p[1] < y1 + 4) return false;
      for (const b of placed) if (Math.min(x1, b.x1) - Math.max(x0, b.x0) > -4 && Math.min(y1, b.y1) - Math.max(y0, b.y0) > -4) return false;
      return true;
    };
    const ring = dirs.concat([0, 45, 90, 135, 180, 225, 270, 315, 20, 70, 110, 160, 200, 250, 290, 340]);
    for (const r of [18, 32, 50, 74, 104, 140, 190]) {
      for (const d of ring) {
        const a = d * Math.PI / 180, ox = Math.cos(a) * r, oy = Math.sin(a) * r;
        const al = Math.cos(a) > 0.35 ? 'left' : Math.cos(a) < -0.35 ? 'right' : 'center';
        const x = ax + ox, y = ay + oy;
        const x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
        if (test(x0, y - hh)) return finish(c, str, color, ax, ay, x, y, al, r, w, hh);
      }
    }
    const a = dirs[0] * Math.PI / 180, x = ax + Math.cos(a) * 18, y = ay + Math.sin(a) * 18;
    return finish(c, str, color, ax, ay, x, y, Math.cos(a) > 0 ? 'left' : 'right', 18, w, hh);
  }
  function finish(c, str, color, ax, ay, x, y, al, r, w, hh) {
    if (r > 40) {                                             /* 離箭頭太遠時補一條引線 */
      const x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
      const ex = clamp(ax, x0 - 6, x0 + w + 6), ey = clamp(ay, y - hh - 4, y + hh + 4);
      c.save(); c.strokeStyle = rgba(color, 0.7); c.lineWidth = 2; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.stroke(); c.restore();
    }
    return label(c, str, x, y, color, 22, al);
  }

  /* ═════════ 主繪圖 ═════════ */
  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(400, 260, 20, 400, 260, 420);
    gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);

    const g = geom(), F = calc();
    drawGround(c);
    drawSlope(c, g);
    const placed = [];
    placed.push(drawAngle(c, g));
    placed.push(drawScale(c));
    const mk = drawMarch(c);
    placed.push({ x0: mk.x0, x1: mk.x1, y0: mk.y0, y1: mk.y1 });

    /* 車與向量 */
    const car = carPose();
    drawCar(c, g, car.px, car.py);
    const Cx = car.cx, Cy = car.cy;
    const Wl = S.w * PX_PER_GW;
    const Wt = [Cx, Cy + Wl];
    const St = [Cx + F.fs * PX_PER_GW * g.cs, Cy + F.fs * PX_PER_GW * g.sn];
    const Pt = [Cx - F.fp * PX_PER_GW * g.sn, Cy + F.fp * PX_PER_GW * g.cs];
    const Nt = [Cx + F.fp * PX_PER_GW * g.sn, Cy - F.fp * PX_PER_GW * g.cs];

    if (S.th > 0) { dashed(c, St[0], St[1], Wt[0], Wt[1], COL.pink); dashed(c, Pt[0], Pt[1], Wt[0], Wt[1], COL.teal); }
    if (S.showN) arrow(c, Cx, Cy, Nt[0], Nt[1], COL.green, 6);
    arrow(c, Cx, Cy, Pt[0], Pt[1], COL.pink, S.th < 3 ? 11 : 6);
    if (S.th > 0) arrow(c, Cx, Cy, St[0], St[1], COL.teal, 6);
    arrow(c, Cx, Cy, Wt[0], Wt[1], COL.coral, S.th < 3 ? 5 : 6);
    c.save(); c.fillStyle = COL.white; c.strokeStyle = COL.deep; c.lineWidth = 2;
    c.beginPath(); c.arc(Cx, Cy, 6, 0, TAU); c.fill(); c.stroke(); c.restore();

    /* 障礙點：箭頭、車、斜面線 */
    const pts = [];
    const seg = (a, b, step) => { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let i = 0; i <= n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
    seg([Cx, Cy], Wt, 7); seg([Cx, Cy], Pt, 7); if (S.th > 0) seg([Cx, Cy], St, 7); if (S.showN) seg([Cx, Cy], Nt, 7);
    for (let u = -48; u <= 48; u += 12) for (let v = 0; v <= 60; v += 12) {      /* 車（坡面座標） */
      pts.push([car.px + u * g.cs + v * g.sn, car.py + u * g.sn - v * g.cs]);
    }
    if (g.hh > 1) { seg([g.x0, g.yTop], [XV, GY], 12); seg([g.x0, g.yTop], [g.x0, GY], 12); }
    seg([0, GY], [W, GY], 10);                                    /* 地面線 */

    /* 標籤 */
    const obst = { pts };
    const dn = deg(Math.atan2(-g.cs, g.sn));                       /* N 的方向（canvas 角度） */
    placed.push(place(c, 'W = ' + Math.round(S.w) + ' gw', COL.coral, Wt[0], Wt[1], [90, 60, 120, 30, 150, 0, 180], obst, placed));
    if (S.th > 0) placed.push(place(c, T('下滑力 = ', 'Down-slope = ') + Math.round(F.fs) + ' gw', COL.teal, St[0], St[1], [0, -25, 25, -50, 50, 75, -75, 100], obst, placed));
    placed.push(place(c, T('壓迫力 = ', 'Pressing = ') + Math.round(F.fp) + ' gw', COL.pink, Pt[0], Pt[1], [180, 155, 205, 130, 230, 105], obst, placed));
    if (S.showN) placed.push(place(c, 'N = ' + Math.round(F.N) + ' gw', COL.green, Nt[0], Nt[1], [dn, dn - 35, dn + 35, dn - 70, dn + 70, dn + 110, dn - 110], obst, placed));
  }

  /* ═════════ 迴圈（θ>0 時車子循環下滑；θ＝0 靜止就停） ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible || S.th <= 0) { S.idle = true; return; }
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const g = geom(), F = calc();
    if (S.phase === 'top') {
      S.dv = g.dv0; S.v = 0; S.pt += dt;
      if (S.pt >= HOLD_TOP) { S.phase = 'slide'; S.pt = 0; }
    } else if (S.phase === 'slide') {
      const a = A_G * F.sn;                                  /* 加速度示意 ∝ sinθ，W 只影響箭頭與數字 */
      S.v += a * dt; S.dv -= S.v * dt;
      if (S.dv <= STOP_D) { S.dv = STOP_D; S.phase = 'hold'; S.pt = 0; }
    } else if (S.phase === 'hold') {
      S.pt += dt;
      if (S.pt >= HOLD_BOTTOM) { S.phase = 'top'; S.pt = 0; S.v = 0; S.dv = g.dv0; }
    }
    S.idle = false;
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && S.th > 0;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (!want) S.idle = true;
  }
  function kick() { restart(); render(); sync(); }
  const onVis = () => sync();

  /* ═════════ 操作與介面 ═════════ */
  function setTh(v) { S.th = clamp(Math.round(v), 0, 80); S.actions++; S.note = 'th:' + S.th; updateUI(); kick(); }
  function setW(v) { S.w = clamp(Math.round(v / 10) * 10, 50, 200); S.actions++; S.note = 'w:' + S.w; updateUI(); kick(); }
  function toggleN() { S.showN = !S.showN; S.actions++; S.note = 'N:' + S.showN; updateUI(); render(); }
  function resetAll() { S.th = 30; S.w = 100; S.showN = false; S.actions++; S.note = 'reset'; updateUI(); kick(); }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const mkSlider = (id, name, min, max, step, onInput) => {
      const row = document.createElement('div'); row.className = 'lab-row lab-srow';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name;
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.id = id;
      inp.setAttribute('aria-label', name);
      inp.addEventListener('input', () => onInput(+inp.value));
      const val = document.createElement('span'); val.className = 'lab-val'; val.id = id + 'Val';
      row.appendChild(sp); row.appendChild(inp); row.appendChild(val); ctrl.appendChild(row);
    };
    mkSlider('inclineTh', T('斜面坡度 θ', 'Slope angle θ'), 0, 80, 1, setTh);
    mkSlider('inclineW', T('重力 W', 'Weight W'), 50, 200, 10, setW);
    const row = document.createElement('div'); row.className = 'lab-row lab-brow';
    const btn = (k, text, fn) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = k; b.textContent = text;
      b.addEventListener('click', fn); row.appendChild(b);
    };
    btn('t15', '15°', () => setTh(15)); btn('t30', '30°', () => setTh(30)); btn('t60', '60°', () => setTh(60));
    btn('n', '', toggleN);
    btn('reset', T('重設', 'Reset'), resetAll);
    ctrl.appendChild(row);
  }
  function updateUI() {
    if (ctrl) {
      const a = ctrl.querySelector('#inclineTh'), b = ctrl.querySelector('#inclineW');
      if (a) { a.value = S.th; ctrl.querySelector('#inclineThVal').textContent = S.th + '°'; }
      if (b) { b.value = S.w; ctrl.querySelector('#inclineWVal').textContent = S.w + ' gw'; }
      ctrl.querySelectorAll('.lab-btn').forEach(el => {
        const k = el.dataset.act;
        if (k === 't15' || k === 't30' || k === 't60') {
          const on = S.th === +k.slice(1); el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on));
        } else if (k === 'n') {
          el.textContent = S.showN ? T('隱藏正向力 N', 'Hide normal force N') : T('顯示正向力 N', 'Show normal force N');
          el.classList.toggle('active', S.showN); el.setAttribute('aria-pressed', String(S.showN));
        }
      });
    }
    if (cv) cv.setAttribute('aria-label', T('斜面車子解析實驗台：用滑桿調整斜面坡度與重力，看重力被拆成下滑力與壓迫力',
      'Incline car bench: use the sliders to change the slope and weight and watch gravity split into a down-slope force and a pressing force'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const F = calc(), th = S.th, fs = Math.round(F.fs), fp = Math.round(F.fp);
    const l1 = T(`<b class="li-t">θ = ${th}°</b>：<b class="li-s">下滑力 ≈ ${fs} gw</b>，<b class="li-p">壓迫力 ≈ ${fp} gw</b>`,
      `<b class="li-t">θ = ${th}°</b>: <b class="li-s">down-slope force ≈ ${fs} gw</b>, <b class="li-p">pressing force ≈ ${fp} gw</b>`);
    let l2 = th === 0
      ? T('平地：沒有下滑力，壓迫力＝重力', 'Level ground: no down-slope force, and the pressing force equals the weight')
      : T('坡度越陡，下滑力越大、壓迫力越小', 'The steeper the slope, the larger the down-slope force and the smaller the pressing force');
    if (S.showN) l2 += T('；<b class="li-n">正向力 N ＝ 壓迫力（大小相同、方向相反）</b>', '; <b class="li-n">normal force N = pressing force (equal in size, opposite in direction)</b>');
    res.innerHTML = `<div>${l1}</div><div class="li-2">${l2}</div>`;
  }

  /* ═════════ 介面契約 ═════════ */
  function bind() {
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    if (cv) ctx = cv.getContext('2d');
  }
  function activate() {
    if (S.on) deactivate();
    bind(); if (!cv) return;
    S.on = true; S.visible = true;
    buildControls(); updateUI();
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    restart('activate'); render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    S.idle = true;
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    const F = calc();
    return {
      theta: S.th, weight: S.w, showN: S.showN,
      slide: +F.fs.toFixed(2), press: +F.fp.toFixed(2), slideShown: Math.round(F.fs), pressShown: Math.round(F.fp),
      phase: S.phase, dv: +S.dv.toFixed(1), speed: +S.v.toFixed(1), accel: +(A_G * F.sn).toFixed(1),
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-incline.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-incline .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-incline .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-incline .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-incline canvas{display:block;width:100%;height:auto;outline:none}
#lab-incline .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-incline .result-box>div+div{margin-top:4px}
#lab-incline .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-incline .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:36px}
#lab-incline .lab-brow{min-height:44px}
#lab-incline .lab-srow{flex-wrap:nowrap;gap:12px}
#lab-incline .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:8em;flex:0 0 auto}
#lab-incline .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;color:#f6f3ea;min-width:4.8em;text-align:left;flex:0 0 auto}
#lab-incline input[type=range]{flex:1 1 200px;min-width:120px;max-width:520px;height:28px;margin:0;accent-color:#ffe066;cursor:pointer}
#lab-incline .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-incline .lab-btn:hover{border-color:#ffe066}
#lab-incline .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-incline .li-t{color:#ffe066}#lab-incline .li-s{color:#4dd2ff}#lab-incline .li-p{color:#f472b6}#lab-incline .li-n{color:#33cc99}
@media (max-width:640px){#lab-incline.lab-desk{padding:12px 12px 14px}#lab-incline .lab-title{font-size:24px}#lab-incline .lab-srow{flex-wrap:wrap}#lab-incline .lab-name{min-width:0;flex:1 1 auto}#lab-incline .lab-val{min-width:0}#lab-incline input[type=range]{flex:1 1 100%;max-width:none;order:3}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜斜面車子解析', te = '🔧 Try it | Incline car';
    const kz = '調整斜面的坡度，看重力 W 被拆成下滑力與壓迫力；坡度越陡，哪個力變大、哪個力變小？';
    const ke = 'Change the slope and watch the weight W split into a down-slope force and a pressing force. As the slope gets steeper, which force grows and which one shrinks?';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); restart('inject'); buildControls(); updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { TW.clear(); if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug() { render(); return S.boxes.slice(); } };
})();
