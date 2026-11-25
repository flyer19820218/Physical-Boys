/* mechanics_2_lab_tug_1125_v1.js — 「動手做｜向量拔河賽」實驗台（#tugLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.tug = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab1 最後，並注入 <style id="lab-tug-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 物理（一直線上兩個反向力）：向右為正，F左 ＝ March 的拉力（向左）、F右 ＝ April 的拉力（向右）。
 *   合力向量 R ＝ (F右 − F左, 0)，大小用 Math.hypot 算；方向朝向較大的力；相等時 R ＝ 0。
 *   木塊示意：加速度 ∝ 合力、無摩擦（K px/s² 每 gw）；撞到軌道左右端點就停住並顯示「到頭了」。
 *   合力 ＝ 0 時木塊「停在原位不動」（教學示意：快速緩停，不讓它帶著速度漂走），並顯示「靜力平衡」。
 * 箭頭長度 ∝ gw：PX_PER_GW ＝ 2.8 px（地面方格每格 10 gw ＝ 28 px）。
 * 人物：拔河圖兩半（assets/characters/tug/）＋麻繩切片；表情徽章依勝負換（victory／struggling／normal）。
 * 動畫只在木塊還在動（或預備起跑）時跑 RAF，靜止就停。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'tug', TAB = 'tab1';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* ═════════ 常數 ═════════ */
  const PX_PER_GW = 2.8, GRID = 10 * PX_PER_GW;       /* 28 px ＝ 10 gw */
  const FMAX = 100, FSTEP = 10, DEF_M = 30, DEF_A = 80;
  const GY = 455;                                      /* 地面線 */
  const SC = 0.42;                                     /* 拔河圖縮放（原圖約 352×572） */
  const IMG_ROPE_Y = 285, IMG_FOOT = 565;
  const ROPE_Y = GY - (IMG_FOOT - IMG_ROPE_Y) * SC;    /* ≈ 337，繩子與木塊作用點的高度 */
  const GL = 250, GR = 710;                            /* 兩人握點 x */
  const BW = 136, BH = 136, HALF = BW / 2;             /* 木塊 */
  const X0 = 480, XMIN = 360, XMAX = 600;              /* 木塊中心起點與軌道範圍 */
  const K = 1.66;                                      /* 加速度（px/s²）每 gw */
  const Y_FL = 84, Y_FL_LBL = 40;                      /* 兩條拉力箭頭基線與其標籤 */
  const Y_R = 180, Y_R_LBL = 138;                      /* 合力箭頭基線與標籤 */
  const Y_PILL = 252;                                  /* 「靜力平衡／到頭了」小標籤 */

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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

  /* ═════════ 圖片 ═════════ */
  const IMG = {};
  function loadImg(k, src) {
    const im = new Image(); im.onload = () => { if (!S.raf) render(); }; im.src = src; IMG[k] = im;
  }
  [['L', 'tug/tug_march_left'], ['R', 'tug/tug_april_right'], ['S', 'tug/tug_rope_strip'],
    ['mv', 'march/victory'], ['ms', 'march/struggling'], ['mn', 'march/normal'],
    ['av', 'april/victory'], ['as', 'april/struggling'], ['an', 'april/normal']
  ].forEach(([k, p]) => loadImg(k, 'assets/characters/' + p + '.png'));
  const ok = im => im && im.complete && im.naturalWidth;

  /* ═════════ 狀態與物理 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    fm: DEF_M, fa: DEF_A,          /* March（左）、April（右）的拉力 gw */
    x: X0, v: 0, hold: 0,          /* 木塊中心 x、速度 px/s、起跑前的預備秒數 */
    idle: true, debug: false, boxes: [], actions: 0, note: 'start'
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  /* 合力向量（向右為正）：用向量算，大小 hypot，方向看 x 分量的正負 */
  function net() {
    const rx = S.fa - S.fm, ry = 0, mag = Math.hypot(rx, ry);
    return { x: rx, y: ry, mag, dir: rx > 0 ? 1 : rx < 0 ? -1 : 0 };
  }
  function stuck() {
    const r = net();
    return (S.x <= XMIN + 0.01 && r.dir < 0) || (S.x >= XMAX - 0.01 && r.dir > 0);
  }

  /* ═════════ 文字 ═════════ */
  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, str: s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  function pill(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x0 + w / 2, y, color, size, 'center'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, str: s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, x1: x0 + w };
  }

  /* ═════════ 地面、方格、擋塊 ═════════ */
  function drawFloor(c) {
    const gl = c.createRadialGradient(480, 300, 30, 480, 300, 480);
    gl.addColorStop(0, 'rgba(255,224,102,0.06)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, GY);
    const g = c.createLinearGradient(0, GY, 0, H);
    g.addColorStop(0, '#2d5044'); g.addColorStop(1, '#16332b');
    c.fillStyle = g; c.fillRect(0, GY, W, H - GY);
    /* 方格比例尺：1 格 ＝ 10 gw ＝ GRID px */
    c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 1.5;
    for (let x = 0; x <= W; x += GRID) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x, H); c.stroke(); }
    for (let y = GY; y <= H; y += GRID) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(W, GY); c.stroke();
    /* 起點記號 */
    c.fillStyle = 'rgba(255,224,102,0.8)';
    c.beginPath(); c.moveTo(X0, GY + 3); c.lineTo(X0 - 7, GY + 15); c.lineTo(X0 + 7, GY + 15); c.closePath(); c.fill();
  }
  function bumper(c, x, side) {
    const w = 14, h = 58, y = GY - h;
    c.save(); c.fillStyle = '#e8e2d2'; rr(c, x, y, w, h, 4); c.fill();
    c.beginPath(); rr(c, x, y, w, h, 4); c.clip();
    c.fillStyle = '#d6454a';
    for (let k = 0; k < 4; k++) c.fillRect(x - 2, y + 6 + k * 14, w + 4, 7);
    c.restore();
    c.strokeStyle = '#6b2326'; c.lineWidth = 2; rr(c, x, y, w, h, 4); c.stroke();
  }

  /* ═════════ 人物＋麻繩 ═════════ */
  function ropeStrip(c, x0, x1, y, sc, sag) {
    const im = IMG.S; if (!ok(im) || x1 <= x0) return;
    const sh = im.naturalHeight, sw = im.naturalWidth, dh = sh * sc, step = 3;
    const len = x1 - x0, wid = sw * sc;
    for (let x = 0; x < len; x += step) {
      const w = Math.min(step, len - x), t = (x + w / 2) / len;
      const u = ((x % wid) / sc), uw = Math.min(w / sc, sw - u);
      c.drawImage(im, u, 0, Math.max(0.5, uw), sh, x0 + x, y - dh / 2 + 4 * (sag || 0) * t * (1 - t), w + 0.6, dh);
    }
  }
  function drawPeople(c) {
    const L = IMG.L, R = IMG.R; if (!ok(L) || !ok(R)) return;
    const hl = L.naturalHeight * SC, top = GY - IMG_FOOT * SC;
    /* 腳下影子 */
    c.save(); c.globalAlpha = 0.4; c.fillStyle = COL.deep;
    c.beginPath(); c.ellipse(GL - 74, GY + 3, 64, 7, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(GR + 74, GY + 3, 64, 7, 0, 0, TAU); c.fill(); c.restore();
    /* 兩段繩（拉力太小時鬆垮下垂） */
    const bl = S.x - HALF, br = S.x + HALF;
    const sagL = Math.min(22, (bl - GL) * 0.1) * clamp(1 - S.fm / 15, 0, 1), sagR = Math.min(22, (GR - br) * 0.1) * clamp(1 - S.fa / 15, 0, 1);
    ropeStrip(c, GL - 2, bl + 6, ROPE_Y, SC, sagL);
    ropeStrip(c, br - 6, GR + 2, ROPE_Y, SC, sagR);
    c.drawImage(L, GL - L.naturalWidth * SC, top, L.naturalWidth * SC, hl);
    c.drawImage(R, GR, top, R.naturalWidth * SC, R.naturalHeight * SC);
  }

  /* ═════════ 表情徽章（贏／輸／平手） ═════════ */
  function badge(c, cx, cy, who, state, color) {
    const k = (who === 'm' ? 'm' : 'a') + (state === 'win' ? 'v' : state === 'lose' ? 's' : 'n');
    const im = IMG[k], sz = 88, x0 = cx - sz / 2, y0 = cy - sz / 2;
    c.save();
    c.fillStyle = '#11261f'; rr(c, x0, y0, sz, sz, 16); c.fill();
    if (ok(im)) {
      c.save(); rr(c, x0, y0, sz, sz, 16); c.clip();
      const s = Math.min(im.naturalWidth, im.naturalHeight);
      c.drawImage(im, 0, 0, s, s, x0, y0, sz, sz); c.restore();
    }
    c.lineWidth = state === 'win' ? 5 : 3.5; c.strokeStyle = state === 'win' ? COL.yellow : color;
    rr(c, x0, y0, sz, sz, 16); c.stroke(); c.restore();
    label(c, who === 'm' ? 'March' : 'April', cx, cy + sz / 2 + 24, color, 22);
    const cap = state === 'win' ? T('拉贏了', 'Winning') : state === 'lose' ? T('拉輸了', 'Losing') : T('平手', 'Tied');
    label(c, cap, cx, cy + sz / 2 + 54, state === 'win' ? COL.yellow : COL.dim, 22);
  }

  /* ═════════ 木箱（自己畫木紋） ═════════ */
  function drawCrate(c, cx) {
    const x = cx - HALF, y = GY - BH;
    /* 影子 */
    c.save(); c.globalAlpha = 0.45; c.fillStyle = COL.deep;
    c.beginPath(); c.ellipse(cx, GY + 3, HALF + 6, 8, 0, 0, TAU); c.fill(); c.restore();
    /* 速度線（動得快才畫，畫在木塊後方） */
    if (Math.abs(S.v) > 25) {
      const d = S.v > 0 ? -1 : 1, bx = d < 0 ? x : x + BW;
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 3; c.lineCap = 'round';
      [-38, 0, 38].forEach((dy, i) => {
        const len = 20 + Math.min(40, Math.abs(S.v) * 0.18) - i % 2 * 8;
        c.beginPath(); c.moveTo(bx + d * 8, y + BH / 2 + dy); c.lineTo(bx + d * (8 + len), y + BH / 2 + dy); c.stroke();
      });
      c.restore();
    }
    /* 箱體 */
    c.save();
    const g = c.createLinearGradient(0, y, 0, y + BH);
    g.addColorStop(0, '#d49a5a'); g.addColorStop(1, '#a8703a');
    c.fillStyle = g; rr(c, x, y, BW, BH, 6); c.fill();
    c.beginPath(); rr(c, x + 1, y + 1, BW - 2, BH - 2, 6); c.clip();
    /* 三塊橫木板與木紋 */
    const ph = BH / 3;
    for (let p = 0; p < 3; p++) {
      const py = y + p * ph;
      c.fillStyle = p % 2 ? 'rgba(120,70,30,0.12)' : 'rgba(255,220,160,0.1)'; c.fillRect(x, py, BW, ph);
      c.strokeStyle = 'rgba(90,52,22,0.5)'; c.lineWidth = 1.6;
      for (let k = 0; k < 4; k++) {
        const gy = py + 9 + k * 9.5;
        c.beginPath();
        for (let gx = 0; gx <= BW; gx += 6) {
          const yy = gy + Math.sin(gx * 0.07 + p * 2.1 + k * 1.3) * 2.2;
          if (gx === 0) c.moveTo(x + gx, yy); else c.lineTo(x + gx, yy);
        }
        c.stroke();
      }
      c.strokeStyle = 'rgba(70,40,16,0.85)'; c.lineWidth = 2.6;
      if (p > 0) { c.beginPath(); c.moveTo(x, py); c.lineTo(x + BW, py); c.stroke(); }
    }
    /* 斜撐 */
    c.strokeStyle = 'rgba(80,46,18,0.55)'; c.lineWidth = 9; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x + 14, y + BH - 14); c.lineTo(x + BW - 14, y + 14); c.stroke();
    c.strokeStyle = 'rgba(255,220,160,0.18)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + 14, y + BH - 18); c.lineTo(x + BW - 18, y + 14); c.stroke();
    /* 邊框木條 */
    c.strokeStyle = '#7a4a22'; c.lineWidth = 12;
    c.strokeRect(x + 6, y + 6, BW - 12, BH - 12);
    c.restore();
    c.strokeStyle = '#4a2c12'; c.lineWidth = 3; rr(c, x, y, BW, BH, 6); c.stroke();
    /* 釘子 */
    c.fillStyle = '#3a2410';
    [[x + 10, y + 10], [x + BW - 10, y + 10], [x + 10, y + BH - 10], [x + BW - 10, y + BH - 10]].forEach(p => {
      c.beginPath(); c.arc(p[0], p[1], 3, 0, TAU); c.fill();
    });
    /* 兩側鐵環（繩子接在這裡，也是兩個作用點） */
    [x, x + BW].forEach((ex, i) => {
      c.fillStyle = '#b9c4c0'; c.strokeStyle = '#55635f'; c.lineWidth = 2;
      rr(c, ex - (i ? 3 : 9), ROPE_Y - 13, 12, 26, 3); c.fill(); c.stroke();
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 4;
      c.beginPath(); c.arc(ex + (i ? 9 : -9), ROPE_Y, 7, 0, TAU); c.stroke();
    });
  }

  /* ═════════ 箭頭（長度 ∝ gw，沿箭身每 10 gw 一個刻痕） ═════════ */
  function arrow(c, x0, y, dir, gw, color, shaft, headL, headH, glow) {
    const len = gw * PX_PER_GW;
    /* 作用點圓點 */
    c.save();
    if (len > 0.5) {
      const hl = Math.min(headL, len), xe = x0 + dir * len, xs = xe - dir * hl;
      if (glow) { c.shadowColor = rgba(color, 0.85); c.shadowBlur = 16; }
      c.fillStyle = color;
      if (len > hl) { c.fillRect(Math.min(x0, xs), y - shaft / 2, Math.abs(xs - x0), shaft); }
      c.beginPath(); c.moveTo(xe, y); c.lineTo(xs, y - headH); c.lineTo(xs, y + headH); c.closePath(); c.fill();
      c.shadowColor = 'transparent';
      c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = 2;
      for (let k = 1; k * GRID < len - hl + 0.1; k++) {
        const tx = x0 + dir * k * GRID; c.beginPath(); c.moveTo(tx, y - shaft / 2); c.lineTo(tx, y + shaft / 2); c.stroke();
      }
    }
    c.fillStyle = color; c.strokeStyle = COL.deep; c.lineWidth = 2.5;
    c.beginPath(); c.arc(x0, y, 8, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  function leader(c, x, y0, y1, color) {
    c.save(); c.setLineDash([5, 6]); c.strokeStyle = rgba(color, 0.45); c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.restore();
  }

  function drawForces(c) {
    const r = net(), bl = S.x - HALF, br = S.x + HALF, bc = S.x;
    /* 作用點的引線（淡虛線，從木塊上的作用點拉到各自的箭頭基線） */
    leader(c, bl, ROPE_Y, Y_FL, COL.teal);
    leader(c, br, ROPE_Y, Y_FL, COL.pink);
    if (r.mag > 0) leader(c, bc, GY - BH, Y_R, COL.yellow);
    /* 左拉力（青，向左）、右拉力（粉，向右）：同一條基線，反向，互不重疊 */
    arrow(c, bl, Y_FL, -1, S.fm, COL.teal, 12, 24, 15, false);
    arrow(c, br, Y_FL, 1, S.fa, COL.pink, 12, 24, 15, false);
    label(c, T('F左 = ', 'F left = ') + S.fm + ' gw', bl, Y_FL_LBL, COL.teal, 22, 'right');
    label(c, T('F右 = ', 'F right = ') + S.fa + ' gw', br, Y_FL_LBL, COL.pink, 22, 'left');
    /* 合力（黃，粗，另一條基線） */
    const mag = Math.round(r.mag);
    arrow(c, bc, Y_R, r.dir || 1, r.mag, COL.yellow, 20, 30, 21, true);
    const sym = r.dir > 0 ? ' →' : r.dir < 0 ? ' ←' : '';
    const txt = r.mag === 0 ? T('合力 = 0', 'Net force = 0') : T('合力 = ', 'Net force = ') + mag + ' gw' + sym;
    const w = tw(c, txt, 22);
    const mid = bc + r.dir * r.mag * PX_PER_GW / 2;
    const cx = clamp(mid, 10 + w / 2, W - 10 - w / 2);
    label(c, txt, cx, Y_R_LBL, COL.yellow, 22, 'center');
  }

  function drawStatus(c) {
    const r = net();
    if (r.mag === 0) pill(c, T('靜力平衡', 'Equilibrium'), S.x, Y_PILL, COL.green, 22, 'center');
    else if (stuck()) pill(c, T('到頭了！', 'At the end!'), S.x, Y_PILL, COL.coral, 22, 'center');
  }

  function drawLegend(c) {
    const y = 497, sx = 318;
    c.save(); c.fillStyle = 'rgba(255,224,102,0.18)'; c.fillRect(sx, y - GRID / 2, GRID, GRID);
    c.strokeStyle = COL.yellow; c.lineWidth = 3; c.strokeRect(sx, y - GRID / 2, GRID, GRID); c.restore();
    pill(c, T('1 格 ＝ 10 gw（箭頭長度）', '1 square = 10 gw (arrow length)'), sx + GRID + 14, y, COL.white, 22, 'left');
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    drawFloor(c);
    bumper(c, XMIN - HALF - 18, -1);
    bumper(c, XMAX + HALF + 4, 1);
    drawPeople(c);
    drawCrate(c, S.x);
    drawForces(c);
    const r = net();
    const sm = r.dir > 0 ? 'lose' : r.dir < 0 ? 'win' : 'tie';
    const sa = r.dir > 0 ? 'win' : r.dir < 0 ? 'lose' : 'tie';
    badge(c, 52, 300, 'm', sm, COL.teal);
    badge(c, 908, 300, 'a', sa, COL.pink);
    drawStatus(c);
    drawLegend(c);
  }

  /* ═════════ 迴圈（木塊還在動才跑） ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const r = net();
    if (S.hold > 0) { S.hold -= dt; S.idle = false; render(); S.raf = requestAnimationFrame(frame); return; }
    if (r.dir === 0) { S.v *= Math.exp(-dt * 9); if (Math.abs(S.v) < 0.8) S.v = 0; }
    else S.v += K * r.x * dt;
    S.x += S.v * dt;
    if (S.x <= XMIN) { S.x = XMIN; S.v = 0; }
    if (S.x >= XMAX) { S.x = XMAX; S.v = 0; }
    if (S.v === 0 && (r.dir === 0 || stuck())) { S.idle = true; render(); return; }
    S.idle = false;
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !S.idle;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() {
    const r = net();
    S.idle = (S.v === 0 && S.hold <= 0 && (r.dir === 0 || stuck()));
    sync(); if (!S.raf) render();
  }

  /* ═════════ 操作 ═════════ */
  function setForces(m, a, note) {
    S.fm = clamp(Math.round(m / FSTEP) * FSTEP, 0, FMAX);
    S.fa = clamp(Math.round(a / FSTEP) * FSTEP, 0, FMAX);
    S.note = note || 'set'; S.actions++;
    syncSliders(); updateResult(); kick();
  }
  function home(hold) { S.x = X0; S.v = 0; S.hold = hold ? 0.7 : 0; }
  function act(k) {
    if (k === 'equal') { const m = Math.max(S.fm, S.fa); setForces(m, m, 'equal'); return; }
    if (k === 'swap') { setForces(S.fa, S.fm, 'swap'); return; }
    if (k === 'home') { home(true); S.note = 'home'; S.actions++; updateResult(); S.idle = false; sync(); if (!S.raf) render(); return; }
    if (k === 'reset') { S.fm = DEF_M; S.fa = DEF_A; home(true); S.note = 'reset'; S.actions++; syncSliders(); updateResult(); S.idle = false; sync(); if (!S.raf) render(); }
  }

  const SLIDERS = [
    { id: 'm', zh: 'March 的拉力', en: "March's pull", col: COL.teal },
    { id: 'a', zh: 'April 的拉力', en: "April's pull", col: COL.pink }
  ];
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    SLIDERS.forEach(sd => {
      const row = document.createElement('div'); row.className = 'lab-row lab-srow';
      const nm = document.createElement('span'); nm.className = 'lab-name'; nm.style.color = sd.col; nm.textContent = T(sd.zh, sd.en);
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = FMAX; inp.step = FSTEP;
      inp.value = sd.id === 'm' ? S.fm : S.fa; inp.id = KEY + 'Slider_' + sd.id; inp.setAttribute('aria-label', T(sd.zh, sd.en) + '（gw）');
      const val = document.createElement('span'); val.className = 'lab-val'; val.id = KEY + 'Val_' + sd.id; val.textContent = inp.value + ' gw';
      inp.addEventListener('input', () => {
        const v = clamp(+inp.value, 0, FMAX);
        if (sd.id === 'm') S.fm = v; else S.fa = v;
        val.textContent = v + ' gw'; S.note = 'slider:' + sd.id; S.actions++;
        updateResult(); kick();
      });
      row.append(nm, inp, val); ctrl.appendChild(row);
    });
    const br = document.createElement('div'); br.className = 'lab-row lab-brow';
    [['equal', T('雙方一樣大', 'Make them equal')], ['swap', T('對調', 'Swap')], ['home', T('木塊歸位', 'Block back to start')], ['reset', T('重設', 'Reset')]].forEach(([k, text]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = k; b.textContent = text;
      b.addEventListener('click', () => act(k)); br.appendChild(b);
    });
    ctrl.appendChild(br);
  }
  function syncSliders() {
    if (!ctrl) return;
    [['m', S.fm], ['a', S.fa]].forEach(([id, v]) => {
      const inp = document.getElementById(KEY + 'Slider_' + id), val = document.getElementById(KEY + 'Val_' + id);
      if (inp) inp.value = v; if (val) val.textContent = v + ' gw';
    });
  }
  function updateUI() {
    if (cv) cv.setAttribute('aria-label', T('向量拔河賽實驗台：用滑桿調整 March 與 April 的拉力，觀察黃色合力與木塊的移動',
      'Vector tug-of-war bench: use the sliders to set March and April pulls and watch the yellow net force and the block'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const m = S.fm, a = S.fa, r = net(), mag = Math.round(r.mag);
    const big = Math.max(m, a), small = Math.min(m, a);
    const head = T(`<b class="lt-m">左 ${m} gw（向左）</b>、<b class="lt-a">右 ${a} gw（向右）</b> → `,
      `<b class="lt-m">Left ${m} gw (←)</b>, <b class="lt-a">right ${a} gw (→)</b> → `);
    let tail;
    if (r.dir === 0) tail = T('<b class="lt-r">合力 ＝ 0 gw，木塊不動</b>', '<b class="lt-r">net force = 0 gw, the block stays put</b>');
    else tail = T(`<b class="lt-r">合力 ＝ ${big} − ${small} ＝ ${mag} gw，向${r.dir > 0 ? '右' : '左'}</b>`,
      `<b class="lt-r">net force = ${big} − ${small} = ${mag} gw, ${r.dir > 0 ? 'rightward' : 'leftward'}</b>`);
    const l2 = T('反向相減，方向朝向較大的力', 'Opposite directions subtract; the net force points toward the larger force');
    res.innerHTML = `<div>${head}${tail}</div><div class="lt-t">${l2}</div>`;
  }

  const onVis = () => sync();

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
    if (S.x === X0 && S.v === 0 && !stuck()) S.hold = 0.7;     /* 進分頁先讓學生看一下再起跑 */
    const r = net(); S.idle = (S.v === 0 && S.hold <= 0 && (r.dir === 0 || stuck()));
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    const r = net();
    return {
      fm: S.fm, fa: S.fa, net: r.mag, netSigned: r.x, dir: r.dir, x: +S.x.toFixed(2), v: +S.v.toFixed(2),
      stuck: stuck(), hold: +S.hold.toFixed(2), running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note,
      t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-tug.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-tug .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-tug .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-tug .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-tug canvas{display:block;width:100%;height:auto;outline:none}
#lab-tug .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-tug .result-box>div+div{margin-top:4px}
#lab-tug .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-tug .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-tug .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-tug .lab-brow{min-height:44px;margin-top:2px}
#lab-tug .lab-name{font-size:22px;font-weight:700;min-width:8.2em}
#lab-tug .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;min-width:4.6em;text-align:right;color:#f6f3ea}
#lab-tug input[type=range]{flex:1 1 auto;min-width:0;height:36px;margin:0;accent-color:#ffe066;cursor:pointer}
#lab-tug .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-tug .lab-btn:hover{border-color:#ffe066}
#lab-tug .lt-m{color:#4dd2ff}#lab-tug .lt-a{color:#f472b6}#lab-tug .lt-r{color:#ffe066}
#lab-tug .lt-t{color:#a3b8b0}
@media (max-width:640px){#lab-tug.lab-desk{padding:12px 12px 14px}#lab-tug .lab-title{font-size:24px}#lab-tug .lab-srow{flex-wrap:wrap}#lab-tug .lab-name{min-width:0;width:100%}#lab-tug input[type=range]{flex:1 1 150px}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜向量拔河賽', te = '🔧 Try it | Vector tug of war';
    const kz = '調整兩側選手的拉力，觀察黃色的合力。先猜猜木塊會往哪邊跑，再用滑桿驗證！';
    const ke = "Adjust each player's pull and watch the yellow net force. First guess which way the block will go, then check it with the sliders!";
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
