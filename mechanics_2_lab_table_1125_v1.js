/* mechanics_2_lab_table_1125_v1.js — 「動手做｜靜力平衡實驗室」（#tableLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.table = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab2 最後，並注入 <style id="lab-table-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 兩個小實驗共用同一張畫布，用分頁按鈕切換（各自保留狀態）：
 *  ① 書本平衡檯：書本重力 W（向下）、桌面支撐力 N（向上），合力 ＝ N − W。
 *     合力為 0 → 書穩穩靜止；N < W → 書加速往下掉（桌面先被壓凹，穿過去後停在地面）；
 *     N > W → 書加速往上彈飛（停在畫布頂端）。調滑桿後書先緩緩回到桌面，再重新演出。
 *     加速度 a ＝ (W − N) × K（K 為示意常數），箭頭長度 ＝ gw × PX_GW（畫面右下有比例尺）。
 *  ② 力桌（2D 俯視）：三力 F₁、F₂、F₃（每顆砝碼 5 gw，0～12 顆），角度 θ：0° 在右、逆時針為正。
 *     向量：Fx ＝ F·cosθ、Fy(畫面，y 向下) ＝ −F·sinθ；合力 R ＝ ΣF。
 *     小環位置 ＝ 圓心 ＋ k·R，k 使 1 gw 偏 6 px（上限 120 px）；|R| < 1 gw 視為平衡，小環歸位並發出綠光。
 *     右側畫出「三力首尾相接」的向量多邊形，缺口（黃）就是合力。
 *     任務：自由探索／等角配重／不對稱配重／尋找角度（鎖定部分控制項）。
 *     加分：可直接拖曳未鎖定的滑輪改角度（只有滑輪上的小圓點熱區 touch-action:none，不影響頁面捲動）。
 * 動畫只在狀態變化時跑（書本運動、小環緩動、光暈），穩定後停止 RAF。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'table', TAB = 'tab2';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };
  const FCOL = [COL.teal, COL.pink, COL.coral];      /* F₁ 青、F₂ 粉、F₃ 珊瑚 */
  const FSUB = ['F₁', 'F₂', 'F₃'];

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, t) { const p = hex2rgb(a), q = hex2rgb(b); return 'rgb(' + p.map((v, i) => Math.round(lerp(v, q[i], t))).join(',') + ')'; }
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
  const fmt = n => String(Number((Math.round(n * 10) / 10).toFixed(1)));
  const norm360 = a => ((Math.round(a) % 360) + 360) % 360;

  /* ═════════ 狀態 ═════════ */
  /* ① 書本平衡檯 */
  const PX_GW = 2.0;                 /* 箭頭：每 gw 幾像素 */
  const K_ACC = 16;                  /* 示意加速度：每 gw 的合力 → 16 px/s² */
  const BOOK_W = 150, BOOK_H = 50;
  const TABLE_Y = 300, FLOOR_Y = 520, CEIL_TOP = 64;
  const MAX_DOWN = FLOOR_Y - TABLE_Y;                 /* 204：書底碰到地面 */
  const MAX_UP = (TABLE_Y - BOOK_H) - CEIL_TOP;       /* 186：書頂碰到天花板 */

  /* ② 力桌 */
  const CX = 310, CY = 270, RR = 186;
  const PX_PER_GW_RING = 6, RING_MAX = 120, EQ_TOL = 1, NEAR_TOL = 5, MAXN = 12;
  const TASKS = {
    free: { n: [2, 3, 4], a: [270, 25, 145], lockN: [0, 0, 0], lockA: [0, 0, 0] },
    t1: { n: [3, 2, 2], a: [270, 30, 150], lockN: [1, 0, 0], lockA: [1, 1, 1] },
    t2: { n: [3, 2, 2], a: [0, 90, 233], lockN: [1, 0, 0], lockA: [1, 1, 1] },
    t3: { n: [4, 5, 6], a: [270, 30, 150], lockN: [1, 1, 1], lockA: [1, 0, 0] }
  };
  const TASK_KEYS = ['free', 't1', 't2', 't3'];
  const cloneSet = k => ({ n: TASKS[k].n.slice(), a: TASKS[k].a.slice() });

  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true, idle: true, debug: true, boxes: [], note: 'start', actions: 0,
    sub: 'book',
    book: { W: 50, N: 50, dW: 50, dN: 50, by: 0, vy: 0, phase: 'rest', wait: 0 },
    force: { task: 'free', sets: { free: cloneSet('free') }, rx: CX, ry: CY, glow: 1 }
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, sw = null, wrap = null, handles = [];

  /* ═════════ 畫字（記錄文字框供檢查） ═════════ */
  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    S.boxes.push({ s, str: s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return { x0, x1: x0 + w };
  }
  function label2(c, s1, s2, x, y, color, size) {            /* 兩行一組，記成一個框 */
    size = size || 22;
    const keep = S.boxes.length;
    label(c, s1, x, y - size * 0.64, color, size, 'center');
    label(c, s2, x, y + size * 0.64, color, size, 'center');
    const a = S.boxes[keep], b = S.boxes[keep + 1];
    S.boxes.length = keep;
    S.boxes.push({ s: s1 + ' / ' + s2, str: s1 + ' / ' + s2, x0: Math.min(a.x0, b.x0), y0: a.y0, x1: Math.max(a.x1, b.x1), y1: b.y1, size });
  }

  function arrow(c, x0, y0, x1, y1, color, lw, hs, glow) {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 0.5) return;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L, h = Math.min(hs || 16, L * 0.9), hw = h * 0.62;
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'butt';
    if (glow) { c.shadowColor = rgba(color, 0.75); c.shadowBlur = 10; }
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.8, y1 - uy * h * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h + uy * hw, y1 - uy * h - ux * hw); c.lineTo(x1 - ux * h - uy * hw, y1 - uy * h + ux * hw); c.closePath(); c.fill();
    c.restore();
  }
  function panelBox(c, x, y, w, h) {
    c.save(); c.fillStyle = 'rgba(11,26,21,0.62)'; rr(c, x, y, w, h, 14); c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(246,243,234,0.22)'; c.stroke(); c.restore();
  }
  function hline(c, x0, x1, y) {
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
  }

  /* ═════════════════════════ ① 書本平衡檯 ═════════════════════════ */
  const BX = 300;                                    /* 書／箭頭所在的垂直線 */
  const bookNet = () => S.book.N - S.book.W;         /* 合力（向上為正） */

  function drawTable(c, dent) {
    const x0 = BX - 250, x1 = BX + 250, ty = TABLE_Y, th = 24;
    /* 地面 */
    c.save(); c.strokeStyle = '#7fa396'; c.lineWidth = 4; c.beginPath(); c.moveTo(20, FLOOR_Y + 2); c.lineTo(580, FLOOR_Y + 2); c.stroke();
    c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2;
    for (let x = 30; x < 580; x += 22) { c.beginPath(); c.moveTo(x, FLOOR_Y + 5); c.lineTo(x - 12, FLOOR_Y + 17); c.stroke(); }
    c.restore();
    /* 桌腳 */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    for (const lx of [BX - 246, BX + 226]) {
      const g = c.createLinearGradient(lx, 0, lx + 20, 0); g.addColorStop(0, '#b98a52'); g.addColorStop(1, '#8a6034');
      c.fillStyle = g; rr(c, lx, ty + th - 2, 20, FLOOR_Y - ty - th + 2, 3); c.fill();
    }
    c.restore();
    /* 桌面（可被壓凹） */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    const g = c.createLinearGradient(0, ty, 0, ty + th); g.addColorStop(0, '#d9a867'); g.addColorStop(1, '#a8743c');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x0, ty); c.lineTo(BX - 95, ty);
    c.quadraticCurveTo(BX, ty + 2 * dent, BX + 95, ty);
    c.lineTo(x1, ty); c.lineTo(x1, ty + th);
    c.lineTo(BX + 95, ty + th); c.quadraticCurveTo(BX, ty + th + 2 * dent, BX - 95, ty + th);
    c.lineTo(x0, ty + th); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = '#6b4620'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, ty); c.lineTo(BX - 95, ty); c.quadraticCurveTo(BX, ty + 2 * dent, BX + 95, ty); c.lineTo(x1, ty); c.stroke();
    c.strokeRect(x0, ty, 0.01, th); c.strokeRect(x1, ty, 0.01, th);
  }
  function drawBook(c, bottom, halo) {
    const x = BX - BOOK_W / 2, y = bottom - BOOK_H;
    if (halo > 0.02) {
      c.save(); const g = c.createRadialGradient(BX, y + BOOK_H / 2, 20, BX, y + BOOK_H / 2, 130);
      g.addColorStop(0, rgba(COL.green, 0.38 * halo)); g.addColorStop(1, rgba(COL.green, 0));
      c.fillStyle = g; c.fillRect(BX - 140, y - 90, 280, BOOK_H + 180); c.restore();
    }
    c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    const gc = c.createLinearGradient(x, 0, x + BOOK_W, 0); gc.addColorStop(0, '#1f5e96'); gc.addColorStop(1, '#2f7fc0');
    c.fillStyle = gc; rr(c, x, y, BOOK_W, BOOK_H, 6); c.fill(); c.restore();
    c.fillStyle = '#f4ecd0'; rr(c, x + 12, y + 8, BOOK_W - 16, BOOK_H - 16, 3); c.fill();
    c.strokeStyle = 'rgba(107,98,64,0.55)'; c.lineWidth = 1.4;
    for (let k = 1; k < 5; k++) { const yy = y + 8 + k * (BOOK_H - 16) / 5; c.beginPath(); c.moveTo(x + 14, yy); c.lineTo(x + BOOK_W - 6, yy); c.stroke(); }
    c.strokeStyle = '#123b61'; c.lineWidth = 2.5; rr(c, x, y, BOOK_W, BOOK_H, 6); c.stroke();
    c.fillStyle = '#123b61'; c.fillRect(x + 7, y + 2, 3, BOOK_H - 4);          /* 書背 */
  }

  function drawBookScene(c) {
    const b = S.book;
    const net = bookNet(), balanced = net === 0;
    const dent = b.by > 0 ? (b.by <= 26 ? b.by : Math.max(0, 26 - (b.by - 26) * 0.45)) : 0;
    /* 天花板 */
    c.save(); c.setLineDash([10, 8]); c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(20, 26); c.lineTo(580, 26); c.stroke(); c.restore();
    drawTable(c, dent);
    const bottom = TABLE_Y + b.by;
    drawBook(c, bottom, balanced && Math.abs(b.by) < 1 ? 1 : 0);
    label(c, T('理化課本', 'Textbook'), BX - 22, bottom - BOOK_H - 18, COL.white, 22, 'right');
    /* 箭頭：起點都在書與桌面接觸中心（BX, TABLE_Y）的同一條垂直線上 */
    const yW = TABLE_Y + b.dW * PX_GW, yN = TABLE_Y - b.dN * PX_GW;
    c.save(); c.fillStyle = COL.white; c.beginPath(); c.arc(BX, TABLE_Y, 5, 0, TAU); c.fill(); c.restore();
    arrow(c, BX, TABLE_Y, BX, yN, COL.green, 11, 26, true);
    arrow(c, BX, TABLE_Y, BX, yW, COL.coral, 11, 26, true);
    /* W、N 標籤（靠右，用虛線連回箭頭尖端） */
    const lxN = BX + 88, lyN = Math.min(yN, 276), lyW = Math.max(yW, 350);
    c.save(); c.setLineDash([4, 5]); c.lineWidth = 2;
    c.strokeStyle = rgba(COL.green, 0.7); c.beginPath(); c.moveTo(BX + 8, yN); c.lineTo(lxN - 6, lyN); c.stroke();
    c.strokeStyle = rgba(COL.coral, 0.7); c.beginPath(); c.moveTo(BX + 8, yW); c.lineTo(lxN - 6, lyW); c.stroke(); c.restore();
    label(c, 'N = ' + S.book.N + ' gw', lxN, lyN, COL.green, 22, 'left');
    label(c, 'W = ' + S.book.W + ' gw', lxN, lyW, COL.coral, 22, 'left');
    /* 合力 R（黃，畫在書左側，起點在書的重心高度） */
    const rx = BX - 140, ry0 = TABLE_Y - BOOK_H / 2, rLen = net * PX_GW, ryT = ry0 - rLen;
    if (net !== 0) arrow(c, rx, ry0, rx, ryT, COL.yellow, 9, 22, true);
    else { c.save(); c.fillStyle = COL.yellow; c.beginPath(); c.arc(rx, ry0, 6, 0, TAU); c.fill(); c.restore(); }
    if (net < 0) label(c, 'R = ' + Math.abs(net) + ' gw', rx, Math.max(ryT + 26, 350), COL.yellow, 22, 'center');
    else label(c, 'R = ' + net + ' gw', rx - 14, net > 0 ? Math.min(ryT, 276) : ry0, COL.yellow, 22, 'right');

    /* 右側說明面板 */
    const px = 600, pw = 340;
    panelBox(c, px, 22, pw, 496);
    const lx = px + 18;
    c.save(); c.fillStyle = COL.coral; c.fillRect(lx, 51, 6, 22); c.fillStyle = COL.green; c.fillRect(lx, 87, 6, 22); c.restore();
    label(c, T('W：書本重力（向下）', 'W: weight (down)'), lx + 16, 62, COL.coral, 22, 'left');
    label(c, T('N：桌面支撐力（向上）', 'N: support (up)'), lx + 16, 98, COL.green, 22, 'left');
    hline(c, px + 14, px + pw - 14, 130);
    label(c, T('二力平衡三條件', 'Three conditions'), px + pw / 2, 160, COL.yellow, 22, 'center');
    const eq = S.book.W === S.book.N;
    const rows = [
      [T('① 大小相等', '1 Equal size'), eq],
      [T('② 方向相反', '2 Opposite way'), true],
      [T('③ 同一直線', '3 Same line'), true]
    ];
    rows.forEach((r, i) => {
      const y = 200 + i * 40;
      label(c, r[0], lx, y, COL.white, 22, 'left');
      label(c, r[1] ? '✓' : '✗', px + pw - 28, y, r[1] ? COL.green : COL.coral, 26, 'center');
    });
    hline(c, px + 14, px + pw - 14, 306);
    label(c, T('合力 R ＝ N − W', 'R = N − W'), px + pw / 2, 338, COL.white, 22, 'center');
    label(c, '＝ ' + S.book.N + ' − ' + S.book.W + ' ＝ ' + (net < 0 ? '−' + (-net) : net) + ' gw', px + pw / 2, 376, COL.yellow, 24, 'center');
    const stTxt = balanced ? T('✓ 靜力平衡', '✓ Equilibrium') : (net < 0 ? T('✗ 書本掉落', '✗ Book falls') : T('✗ 書本彈飛', '✗ Book flies off'));
    const stCol = balanced ? COL.green : COL.coral;
    const w = tw(c, stTxt, 22) + 36, bx = px + pw / 2 - w / 2;
    c.save(); c.fillStyle = rgba(stCol, 0.16); rr(c, bx, 410, w, 44, 22); c.fill(); c.lineWidth = 2.5; c.strokeStyle = stCol; c.stroke(); c.restore();
    label(c, stTxt, px + pw / 2, 432, stCol, 22, 'center');
    /* 比例尺 */
    arrow(c, lx + 2, 492, lx + 2, 492 - 10 * PX_GW, COL.white, 5, 9, false);
    c.save(); c.strokeStyle = COL.white; c.lineWidth = 3; c.beginPath(); c.moveTo(lx - 6, 492); c.lineTo(lx + 10, 492); c.stroke(); c.restore();
    label(c, T('箭頭比例：這一段 ＝ 10 gw', 'Scale: this bar = 10 gw'), lx + 24, 484, COL.dim, 22, 'left');
  }

  /* ── 書本運動 ── */
  function bookChanged() {
    const b = S.book;
    b.vy = 0;
    if (Math.abs(b.by) > 0.6) b.phase = 'ret';
    else { b.by = 0; if (b.W === b.N) b.phase = 'rest'; else { b.phase = 'wait'; b.wait = 0.3; } }
    S.note = 'book:' + b.W + '/' + b.N; S.actions++;
    kick();
  }
  function stepBook(dt) {
    const b = S.book; let mv = false;
    const ka = 1 - Math.exp(-dt * 10);
    b.dW += (b.W - b.dW) * ka; b.dN += (b.N - b.dN) * ka;
    if (Math.abs(b.W - b.dW) < 0.05) b.dW = b.W; else mv = true;
    if (Math.abs(b.N - b.dN) < 0.05) b.dN = b.N; else mv = true;
    if (b.phase === 'ret') {
      b.vy = 0; b.by += (0 - b.by) * (1 - Math.exp(-dt * 7)); mv = true;
      if (Math.abs(b.by) < 0.6) { b.by = 0; if (b.W === b.N) b.phase = 'rest'; else { b.phase = 'wait'; b.wait = 0.35; } }
    } else if (b.phase === 'wait') {
      mv = true; b.wait -= dt;
      if (b.wait <= 0) { b.phase = b.W === b.N ? 'rest' : 'run'; b.vy = 0; }
    } else if (b.phase === 'run') {
      b.vy += (b.W - b.N) * K_ACC * dt; b.by += b.vy * dt;
      if (b.by >= MAX_DOWN) { b.by = MAX_DOWN; b.vy = 0; b.phase = 'done'; }
      else if (b.by <= -MAX_UP) { b.by = -MAX_UP; b.vy = 0; b.phase = 'done'; }
      else mv = true;
    }
    return mv;
  }

  function updateBookResult() {
    if (!res) return;
    const b = S.book, net = bookNet(), a = Math.abs(net), eq = net === 0;
    const l1 = T(`<b class="tb-w">W ＝ ${b.W} gw（向下）</b>，<b class="tb-n">N ＝ ${b.N} gw（向上）</b>→ <b class="tb-r">合力 ＝ ${eq ? '0 gw' : a + ' gw，向' + (net > 0 ? '上' : '下')}</b>`,
      `<b class="tb-w">W = ${b.W} gw (down)</b>, <b class="tb-n">N = ${b.N} gw (up)</b> → <b class="tb-r">net force = ${eq ? '0 gw' : a + ' gw, ' + (net > 0 ? 'up' : 'down')}</b>`);
    let l2, l3;
    if (eq) {
      l2 = T('<div class="tb-ok">✅ 靜力平衡：合力為零</div>', '<div class="tb-ok">✅ Static equilibrium: the net force is zero</div>');
      l3 = T(`N − W ＝ ${b.N} − ${b.W} ＝ 0，書本沒有加速，穩穩靜止在桌面上。`, `N − W = ${b.N} − ${b.W} = 0, so the book does not accelerate and rests steadily on the table.`);
    } else if (net < 0) {
      l2 = T('<div class="tb-bad">❌ 支撐力不足，書本掉落</div>', '<div class="tb-bad">❌ Support too small: the book falls</div>');
      l3 = T(`N − W ＝ ${b.N} − ${b.W} ＝ −${a} gw，合力 ${a} gw 向下，書本加速往下掉。想要平衡，N 要增加到 ${b.W} gw。`,
        `N − W = ${b.N} − ${b.W} = −${a} gw: a net force of ${a} gw downward makes the book accelerate down. To balance, raise N to ${b.W} gw.`);
    } else {
      l2 = T('<div class="tb-bad">❌ 支撐力過大，書本彈飛</div>', '<div class="tb-bad">❌ Support too large: the book flies off</div>');
      l3 = T(`N − W ＝ ${b.N} − ${b.W} ＝ +${a} gw，合力 ${a} gw 向上，書本加速往上彈。想要平衡，N 要減少到 ${b.W} gw。`,
        `N − W = ${b.N} − ${b.W} = +${a} gw: a net force of ${a} gw upward makes the book accelerate up. To balance, lower N to ${b.W} gw.`);
    }
    const ok1 = eq ? '✓' : '✗';
    const l4 = T(`二力平衡三條件：<b class="${eq ? 'tb-okc' : 'tb-badc'}">① 大小相等 ${ok1}</b>　<b class="tb-okc">② 方向相反 ✓</b>　<b class="tb-okc">③ 同一直線 ✓</b>（缺一不可）`,
      `Three conditions: <b class="${eq ? 'tb-okc' : 'tb-badc'}">1 equal size ${ok1}</b>  <b class="tb-okc">2 opposite directions ✓</b>  <b class="tb-okc">3 same line ✓</b> (all needed)`);
    res.innerHTML = `<div>${l1}</div>${l2}<div>${l3}</div><div class="tb-m">${l4}</div>`;
  }

  /* ═════════════════════════ ② 力桌 ═════════════════════════ */
  const curSet = () => { const f = S.force; if (!f.sets[f.task]) f.sets[f.task] = cloneSet(f.task); return f.sets[f.task]; };
  function vecs(set) {
    return set.n.map((n, i) => {
      const F = n * 5, r = set.a[i] * Math.PI / 180;
      return { F, n, th: set.a[i], x: F * Math.cos(r), y: -F * Math.sin(r) };      /* 畫面座標：y 向下 */
    });
  }
  function resultant(set) {
    const v = vecs(set); let x = 0, y = 0; v.forEach(q => { x += q.x; y += q.y; });
    const mag = Math.round(Math.hypot(x, y) * 1e6) / 1e6;
    return { x, y, mag, dir: mag > 1e-9 ? norm360(Math.atan2(-y, x) * 180 / Math.PI) : 0, v };
  }
  function ringTarget(R) {
    if (R.mag < EQ_TOL) return { x: CX, y: CY };
    const k = Math.min(PX_PER_GW_RING, RING_MAX / R.mag);
    return { x: CX + R.x * k, y: CY + R.y * k };
  }
  const isBalanced = R => R.mag < EQ_TOL;
  function pulleyPos(deg) {
    const r = deg * Math.PI / 180, ux = Math.cos(r), uy = -Math.sin(r);
    return { x: CX + RR * ux, y: CY + RR * uy, ux, uy };
  }
  function clusterOf(n, p) {
    const cols = Math.min(n, 4), rows = Math.ceil(n / 4);
    const cw = Math.max(0, cols * 23 - 3), ch = Math.max(0, rows * 17 - 3);
    const d = 22 + Math.abs(p.ux) * cw / 2 + Math.abs(p.uy) * ch / 2;
    return { cx: p.x + p.ux * d, cy: p.y + p.uy * d, cw, ch };
  }

  function drawChips(c, n, cl, color) {
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 4), col = i % 4, cnt = Math.min(4, n - row * 4);
      const x = cl.cx - (cnt * 23 - 3) / 2 + col * 23, y = cl.cy - cl.ch / 2 + row * 17;
      const g = c.createLinearGradient(0, y, 0, y + 14);
      g.addColorStop(0, mix(color, '#ffffff', 0.45)); g.addColorStop(1, mix(color, '#0b1a15', 0.25));
      c.fillStyle = g; rr(c, x, y, 20, 14, 3); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.6; rr(c, x, y, 20, 14, 3); c.stroke();
    }
  }
  function ovArea(a, b) {
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }

  function drawForceScene(c) {
    const f = S.force, set = curSet(), R = resultant(set), bal = isBalanced(R), v = R.v;
    /* 桌面 */
    c.save();
    const g = c.createRadialGradient(CX, CY, 20, CX, CY, RR + 14);
    g.addColorStop(0, '#23524a'); g.addColorStop(1, '#173a32');
    c.fillStyle = g; c.beginPath(); c.arc(CX, CY, RR + 10, 0, TAU); c.fill();
    c.lineWidth = 5; c.strokeStyle = '#7fa396'; c.stroke();
    c.lineCap = 'round';
    for (let d = 0; d < 360; d += 10) {
      const big = d % 30 === 0, r = d * Math.PI / 180, r0 = RR - (big ? 26 : 14), r1 = RR - 4;
      c.strokeStyle = big ? 'rgba(246,243,234,0.4)' : 'rgba(246,243,234,0.2)'; c.lineWidth = big ? 2.5 : 1.5;
      c.beginPath(); c.moveTo(CX + r0 * Math.cos(r), CY - r0 * Math.sin(r)); c.lineTo(CX + r1 * Math.cos(r), CY - r1 * Math.sin(r)); c.stroke();
    }
    c.restore();
    /* 圓心標記（目標圈） */
    c.save(); c.setLineDash([5, 5]); c.strokeStyle = bal ? rgba(COL.green, 0.9) : 'rgba(246,243,234,0.55)'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(CX, CY, 22, 0, TAU); c.stroke(); c.restore();
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(CX - 8, CY); c.lineTo(CX + 8, CY); c.moveTo(CX, CY - 8); c.lineTo(CX, CY + 8); c.stroke(); c.restore();

    const rx = f.rx, ry = f.ry;
    const P = set.a.map(pulleyPos), CL = set.n.map((n, i) => clusterOf(n, P[i]));
    /* 繩子、滑輪、砝碼串 */
    for (let i = 0; i < 3; i++) {
      const p = P[i], col = FCOL[i], cl = CL[i];
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 7; c.beginPath(); c.moveTo(rx, ry); c.lineTo(p.x, p.y); c.stroke();
      c.strokeStyle = col; c.lineWidth = 3.5; c.beginPath(); c.moveTo(rx, ry); c.lineTo(p.x, p.y); c.stroke();
      if (set.n[i] > 0) { c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(cl.cx, cl.cy); c.stroke(); }
      c.restore();
      /* 滑輪 */
      const free = !TASKS[f.task].lockA[i];
      if (free) { c.save(); c.setLineDash([3, 5]); c.strokeStyle = rgba(col, 0.85); c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 21, 0, TAU); c.stroke(); c.restore(); }
      c.save(); c.fillStyle = '#11261f'; c.strokeStyle = col; c.lineWidth = 4.5; c.beginPath(); c.arc(p.x, p.y, 13, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fill(); c.restore();
      drawChips(c, set.n[i], cl, col);
    }
    /* 小環與光暈 */
    if (f.glow > 0.02) {
      const gg = c.createRadialGradient(rx, ry, 8, rx, ry, 70);
      gg.addColorStop(0, rgba(COL.green, 0.55 * f.glow)); gg.addColorStop(1, rgba(COL.green, 0));
      c.save(); c.fillStyle = gg; c.beginPath(); c.arc(rx, ry, 70, 0, TAU); c.fill(); c.restore();
    }
    c.save(); c.shadowColor = rgba(COL.yellow, 0.7); c.shadowBlur = 10;
    c.strokeStyle = bal ? COL.green : COL.yellow; c.lineWidth = 7; c.beginPath(); c.arc(rx, ry, 12, 0, TAU); c.stroke(); c.restore();
    c.save(); c.strokeStyle = '#8a6a10'; c.lineWidth = 1.5; c.beginPath(); c.arc(rx, ry, 15.5, 0, TAU); c.stroke(); c.beginPath(); c.arc(rx, ry, 8.5, 0, TAU); c.stroke(); c.restore();
    /* 合力小箭頭：圓心 → 小環 */
    const dd = Math.hypot(rx - CX, ry - CY);
    if (!bal && dd > 3) arrow(c, CX, CY, rx, ry, COL.yellow, 4.5, Math.min(14, dd), true);

    /* 繩上的標籤（兩行：F = gw／角度），避開彼此、小環、滑輪、砝碼串、右側面板 */
    const obst = [{ x0: rx - 28, y0: ry - 28, x1: rx + 28, y1: ry + 28 }, { x0: CX - 28, y0: CY - 28, x1: CX + 28, y1: CY + 28 }, { x0: 645, y0: 0, x1: W, y1: H }];
    for (let i = 0; i < 3; i++) {
      const cl = CL[i], p = P[i];
      obst.push({ x0: cl.cx - cl.cw / 2 - 4, y0: cl.cy - cl.ch / 2 - 4, x1: cl.cx + cl.cw / 2 + 4, y1: cl.cy + cl.ch / 2 + 4 });
      obst.push({ x0: p.x - 20, y0: p.y - 20, x1: p.x + 20, y1: p.y + 20 });
    }
    const placed = [];
    for (let i = 0; i < 3; i++) {
      const p = P[i], s1 = FSUB[i] + ' = ' + v[i].F + ' gw', s2 = v[i].th + '°';
      const w = Math.max(tw(c, s1, 22), tw(c, s2, 22)) + 6, h = 52;
      const dx = p.x - rx, dy = p.y - ry, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      let best = null;
      outer: for (const t of [0.6, 0.46, 0.72, 0.33, 0.84]) {
        for (const sh of [0, 46, -46, 70, -70]) {
          const x = rx + dx * t + nx * sh, y = ry + dy * t + ny * sh;
          const bx = { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
          let cost = 0;
          obst.forEach(o => { cost += ovArea(bx, o); });
          placed.forEach(o => { cost += ovArea(bx, o) * 3; });
          if (bx.x0 < 4 || bx.x1 > W - 4 || bx.y0 < 4 || bx.y1 > H - 4) cost += 5000;
          cost += Math.abs(sh) * 0.5;
          if (!best || cost < best.cost) best = { cost, x, y, bx };
          if (cost < 1) break outer;
        }
      }
      placed.push(best.bx);
      c.save(); c.fillStyle = 'rgba(11,26,21,0.78)'; rr(c, best.x - w / 2 - 6, best.y - h / 2 + 1, w + 12, h - 2, 10); c.fill();
      c.lineWidth = 2; c.strokeStyle = rgba(FCOL[i], 0.55); c.stroke(); c.restore();
      label2(c, s1, s2, best.x, best.y, FCOL[i], 22);
    }

    /* 右側面板：三力首尾相接 */
    const px = 655, pw = 285;
    panelBox(c, px, 22, pw, 502);
    label(c, T('三力首尾相接', 'Forces tip to tail'), px + pw / 2, 52, COL.yellow, 22, 'center');
    const pts = [{ x: 0, y: 0 }]; v.forEach(q => { const l = pts[pts.length - 1]; pts.push({ x: l.x + q.x, y: l.y + q.y }); });
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    if (bw + bh > 0.5) {
      const sc = Math.min(9, 240 / Math.max(bw, 1), 205 / Math.max(bh, 1));
      const ox = px + pw / 2 - (Math.max(...xs) + Math.min(...xs)) / 2 * sc, oy = 206 - (Math.max(...ys) + Math.min(...ys)) / 2 * sc;
      const M = q => ({ x: ox + q.x * sc, y: oy + q.y * sc });
      for (let i = 0; i < 3; i++) { const a = M(pts[i]), b = M(pts[i + 1]); arrow(c, a.x, a.y, b.x, b.y, FCOL[i], 6, 16, false); }
      const a0 = M(pts[0]), a3 = M(pts[3]);
      if (!bal) { c.save(); c.setLineDash([2, 7]); c.lineCap = 'round'; c.strokeStyle = COL.yellow; c.lineWidth = 5; c.beginPath(); c.moveTo(a0.x, a0.y); c.lineTo(a3.x, a3.y); c.stroke(); c.restore(); }
      c.save(); c.fillStyle = COL.white; c.strokeStyle = COL.deep; c.lineWidth = 2; c.beginPath(); c.arc(a0.x, a0.y, 7, 0, TAU); c.fill(); c.stroke();
      if (!bal) { c.fillStyle = COL.yellow; c.beginPath(); c.arc(a3.x, a3.y, 7, 0, TAU); c.fill(); c.stroke(); }
      c.restore();
    }
    hline(c, px + 14, px + pw - 14, 338);
    label(c, T('合力 R ≈ ', 'R ≈ ') + fmt(R.mag) + ' gw', px + pw / 2, 368, COL.yellow, 24, 'center');
    const stTxt = bal ? T('✓ 三力平衡', '✓ Balanced') : (R.mag < NEAR_TOL ? T('△ 很接近了', '△ So close') : T('✗ 尚未平衡', '✗ Not balanced'));
    const stCol = bal ? COL.green : (R.mag < NEAR_TOL ? COL.yellow : COL.coral);
    const sw0 = tw(c, stTxt, 22) + 36;
    c.save(); c.fillStyle = rgba(stCol, 0.16); rr(c, px + pw / 2 - sw0 / 2, 388, sw0, 44, 22); c.fill(); c.lineWidth = 2.5; c.strokeStyle = stCol; c.stroke(); c.restore();
    label(c, stTxt, px + pw / 2, 410, stCol, 22, 'center');
    /* 圖例 */
    c.save(); c.fillStyle = mix(COL.teal, '#ffffff', 0.4); rr(c, px + 18, 459, 20, 14, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.6; rr(c, px + 18, 459, 20, 14, 3); c.stroke(); c.restore();
    label(c, T('每顆砝碼 ＝ 5 gw', 'Each weight = 5 gw'), px + 48, 466, COL.dim, 22, 'left');
    label(c, T('0° 在右，逆時針為正', '0° at right, CCW +'), px + 18, 496, COL.dim, 22, 'left');
  }

  /* ── 力桌：小環緩動 ── */
  function stepForce(dt) {
    const f = S.force, R = resultant(curSet()), tg = ringTarget(R); let mv = false;
    const k = 1 - Math.exp(-dt * 14);
    f.rx += (tg.x - f.rx) * k; f.ry += (tg.y - f.ry) * k;
    if (Math.hypot(tg.x - f.rx, tg.y - f.ry) < 0.3) { f.rx = tg.x; f.ry = tg.y; } else mv = true;
    const gt = isBalanced(R) ? 1 : 0;
    f.glow += (gt - f.glow) * (1 - Math.exp(-dt * 8));
    if (Math.abs(gt - f.glow) < 0.01) f.glow = gt; else mv = true;
    return mv;
  }
  function forceChanged(note) { S.note = note || 'force'; S.actions++; updateForceUI(); kick(); }

  const TASK_TXT = {
    free: ['自由探索：每顆砝碼 5 gw（5 g）。調整砝碼與角度，讓小環回到圓心，三力就平衡。', 'Free explore: each weight is 5 gw (5 g). Adjust the weights and angles until the ring returns to the center and the forces balance.'],
    t1: ['任務 1｜等角配重：三條繩互隔 120°（270°、30°、150°），F₁ 已掛 15 gw。請調整 F₂、F₃ 的砝碼，讓小環回到圓心。', 'Task 1 | Equal angles: the strings are 120° apart (270°, 30°, 150°) and F₁ already holds 15 gw. Adjust the weights of F₂ and F₃ so the ring returns to the center.'],
    t2: ['任務 2｜不對稱配重：角度固定 F₁＝0°、F₂＝90°、F₃＝233°，F₁ 掛 15 gw。請調整 F₂、F₃ 的砝碼，讓小環回到圓心。', 'Task 2 | Unequal weights: the angles are fixed at F₁ = 0°, F₂ = 90°, F₃ = 233°, and F₁ holds 15 gw. Adjust the weights of F₂ and F₃ so the ring returns to the center.'],
    t3: ['任務 3｜尋找角度：砝碼固定 F₁＝20 gw、F₂＝25 gw、F₃＝30 gw，F₁ 在 270°。請調整 F₂、F₃ 的角度，讓小環回到圓心。', 'Task 3 | Find the angles: the weights are fixed at F₁ = 20 gw, F₂ = 25 gw, F₃ = 30 gw, and F₁ points at 270°. Adjust the angles of F₂ and F₃ so the ring returns to the center.']
  };
  const TASK_WHY = {
    free: ['三個力的向量和為零，小環才不會被任何一邊拉走。', 'The three force vectors add up to zero, so no side can pull the ring away.'],
    t1: ['三個力一樣大（都是 15 gw）、互隔 120°，向量相加剛好為零。', 'Three equal forces (15 gw each) 120° apart add up to exactly zero.'],
    t2: ['15、20、25 gw 剛好是 3：4：5 的直角三角形，F₁ 與 F₂ 互相垂直，F₃ 的反方向就是它們的合力方向。', '15, 20 and 25 gw form a 3:4:5 right triangle: F₁ and F₂ are perpendicular, and F₃ points opposite to their resultant.'],
    t3: ['20、25、30 gw 首尾相接剛好能圍成封閉三角形，所以角度只有特定的組合才會平衡。', '20, 25 and 30 gw placed tip to tail close into a triangle, so only certain angle pairs give balance.']
  };
  function updateForceResult() {
    if (!res) return;
    const f = S.force, set = curSet(), R = resultant(set), bal = isBalanced(R), v = R.v;
    const q = T(...TASK_TXT[f.task]);
    const lf = v.map((o, i) => `<b style="color:${FCOL[i]}">${FSUB[i]} ＝ ${o.F} gw · ${o.th}°</b>`).join('　');
    let st, extra = '';
    if (bal) {
      st = T('<div class="tb-ok">✅ 小環回到圓心：三力平衡成功！</div>', '<div class="tb-ok">✅ The ring is back at the center: the three forces balance!</div>');
      extra = `<div>${T(...TASK_WHY[f.task])}</div>`;
    } else if (R.mag < NEAR_TOL) {
      st = T(`<div class="tb-near">很接近了！剩餘合力約 ${fmt(R.mag)} gw，再微調一次</div>`, `<div class="tb-near">So close! The remaining net force is about ${fmt(R.mag)} gw. One more small tweak.</div>`);
    } else {
      st = T(`<div class="tb-bad">小環偏離圓心，目前合力約 ${fmt(R.mag)} gw（方向約 ${R.dir}°）</div>`, `<div class="tb-bad">The ring is off center. The net force is now about ${fmt(R.mag)} gw (direction about ${R.dir}°).</div>`);
    }
    const sx = R.x, sy = -R.y, mn = n => fmt(n).replace('-', '−');
    const comp = T(`向量相加：水平 ΣFx ＝ ${mn(sx)} gw（向右為正），鉛直 ΣFy ＝ ${mn(sy)} gw（向上為正）`,
      `Vector sum: horizontal ΣFx = ${mn(sx)} gw (right +), vertical ΣFy = ${mn(sy)} gw (up +)`);
    res.innerHTML = `<div class="tb-q">${q}</div><div>${lf}</div>${st}${extra}<div class="tb-m">${comp}</div>`;
  }

  /* ═════════ 繪圖入口與迴圈 ═════════ */
  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(300, 270, 20, 300, 270, 380);
    gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 660, H);
    if (S.sub === 'book') drawBookScene(c); else drawForceScene(c);
    if (S.sub === 'force') placeHandles();
  }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now; S.t += dt;
    const mv = S.sub === 'book' ? stepBook(dt) : stepForce(dt);
    render();
    S.idle = !mv;
    if (mv) S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !S.idle;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() { S.idle = false; updateResult(); sync(); if (!S.raf) render(); }
  function settle() {                          /* 檢查用：快轉到穩定 */
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    for (let i = 0; i < 4000; i++) { const mv = S.sub === 'book' ? stepBook(1 / 60) : stepForce(1 / 60); if (!mv) break; }
    S.idle = true; render(); return _state();
  }
  const updateResult = () => (S.sub === 'book' ? updateBookResult() : updateForceResult());

  /* ═════════ 控制項 ═════════ */
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

  function buildSwitch() {
    if (!sw) return;
    sw.innerHTML = '';
    [['book', T('① 書本平衡檯', '1 Book balance')], ['force', T('② 力桌', '2 Force table')]].forEach(([k, text]) => {
      const b = mk('button', 'lab-btn lab-sw', text); b.type = 'button'; b.dataset.sub = k;
      b.addEventListener('click', () => setSub(k)); sw.appendChild(b);
    });
    updateSwitch();
  }
  function updateSwitch() {
    if (!sw) return;
    sw.querySelectorAll('.lab-sw').forEach(b => { const on = b.dataset.sub === S.sub; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function setTaskText() {
    const el = document.querySelector('#lab-' + KEY + ' .lab-task'); if (!el) return;
    const zh = S.sub === 'book' ? '改變書本的重力，你必須同步調整桌面的支撐力，書本才不會失衡。'
      : '三條細繩繞過滑輪，末端掛著砝碼，每顆砝碼 5 gw（5 g）。中央小環回到圓心，三個力才平衡。';
    const en = S.sub === 'book' ? 'Change the book\'s weight and you must adjust the table\'s support force at the same time, or the book will lose its balance.'
      : 'Three thin strings run over pulleys and carry weights, 5 gw (5 g) each. Only when the small ring returns to the center are the three forces balanced.';
    el.setAttribute('data-zh', zh); el.setAttribute('data-en', en); el.innerHTML = T(zh, en);
  }
  function setSub(k) {
    if (k === S.sub) return;
    S.sub = k; S.note = 'sub:' + k; S.actions++;
    if (k === 'book') { const b = S.book; if (b.phase === 'run') { /* 保持目前演出 */ } }
    else { const f = S.force; const R = resultant(curSet()); const tg = ringTarget(R); f.rx = tg.x; f.ry = tg.y; f.glow = isBalanced(R) ? 1 : 0; }
    setTaskText(); updateSwitch(); buildControls(); showHandles(k === 'force');
    S.idle = false; updateResult(); sync(); if (!S.raf) render();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    if (S.sub === 'book') buildBookControls(); else buildForceControls();
    updateUI();
  }
  function slider(min, max, step, val, label) {
    const r = document.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
    r.className = 'lab-range'; r.setAttribute('aria-label', label); return r;
  }
  function buildBookControls() {
    const defs = [
      ['W', T('書本重力 W（向下）', 'Book weight W (down)'), 10, 100, COL.coral],
      ['N', T('桌面支撐力 N（向上）', 'Table support N (up)'), 0, 100, COL.green]
    ];
    defs.forEach(([k, name, min, max, col]) => {
      const row = mk('div', 'lab-row lab-srow');
      const nm = mk('span', 'lab-name', name); nm.style.color = col; row.appendChild(nm);
      const r = slider(min, max, 10, S.book[k], name); r.dataset.k = k;
      r.addEventListener('input', () => { S.book[k] = +r.value; bookChanged(); updateUI(); });
      row.appendChild(r);
      const val = mk('span', 'lab-val'); val.dataset.k = k; row.appendChild(val);
      ctrl.appendChild(row);
    });
    const row = mk('div', 'lab-row');
    const b = mk('button', 'lab-btn', T('重設', 'Reset')); b.type = 'button';
    b.addEventListener('click', () => {
      Object.assign(S.book, { W: 50, N: 50 }); bookChanged(); updateUI();
    });
    row.appendChild(b); ctrl.appendChild(row);
  }

  function buildForceControls() {
    const f = S.force, tk = TASKS[f.task];
    const rowT = mk('div', 'lab-row');
    const nm = mk('span', 'lab-name', T('任務', 'Task')); rowT.appendChild(nm);
    [['free', T('自由探索', 'Free explore')], ['t1', T('任務 1｜等角配重', 'Task 1 | Equal angles')],
      ['t2', T('任務 2｜不對稱配重', 'Task 2 | Unequal weights')], ['t3', T('任務 3｜尋找角度', 'Task 3 | Find the angles')]].forEach(([k, text]) => {
      const b = mk('button', 'lab-btn', text); b.type = 'button'; b.dataset.task = k;
      b.addEventListener('click', () => setTask(k)); rowT.appendChild(b);
    });
    const rb = mk('button', 'lab-btn', T('重設本題', 'Reset this task')); rb.type = 'button'; rb.dataset.act = 'reset';
    rb.addEventListener('click', () => { f.sets[f.task] = cloneSet(f.task); forceChanged('reset:' + f.task); });
    rowT.appendChild(rb); ctrl.appendChild(rowT);

    const cards = mk('div', 'tb-cards');
    for (let i = 0; i < 3; i++) {
      const card = mk('div', 'tb-card'); card.style.borderColor = FCOL[i]; card.dataset.i = i;
      const hd = mk('div', 'tb-ch');
      const t1 = mk('b', '', FSUB[i]); t1.style.color = FCOL[i]; hd.appendChild(t1);
      const fv = mk('span', 'tb-fv'); fv.dataset.role = 'fv'; hd.appendChild(fv);
      card.appendChild(hd);
      const wr = mk('div', 'tb-wrow');
      const mn = mk('button', 'lab-btn tb-pm', '−'); mn.type = 'button'; mn.dataset.role = 'minus'; mn.setAttribute('aria-label', FSUB[i] + T(' 少一顆砝碼', ' remove a weight'));
      const pl = mk('button', 'lab-btn tb-pm', '＋'); pl.type = 'button'; pl.dataset.role = 'plus'; pl.setAttribute('aria-label', FSUB[i] + T(' 多一顆砝碼', ' add a weight'));
      const cnt = mk('span', 'tb-cnt'); cnt.dataset.role = 'cnt';
      const lk = mk('span', 'tb-lock'); lk.dataset.role = 'lockN';
      mn.addEventListener('click', () => stepN(i, -1)); pl.addEventListener('click', () => stepN(i, +1));
      wr.appendChild(mn); wr.appendChild(cnt); wr.appendChild(pl); wr.appendChild(lk); card.appendChild(wr);
      const ar = mk('div', 'tb-arow');
      ar.appendChild(mk('span', 'tb-an', T('角度', 'Angle')));
      const r = slider(0, 359, 1, 0, FSUB[i] + T(' 角度', ' angle')); r.dataset.role = 'ang';
      r.addEventListener('input', () => { if (TASKS[f.task].lockA[i]) return; curSet().a[i] = +r.value; forceChanged('ang:' + i); });
      ar.appendChild(r);
      const av = mk('span', 'tb-av'); av.dataset.role = 'av'; ar.appendChild(av);
      const la = mk('span', 'tb-lock'); la.dataset.role = 'lockA'; ar.appendChild(la);
      card.appendChild(ar); cards.appendChild(card);
    }
    ctrl.appendChild(cards);
  }
  function setTask(k) {
    const f = S.force; if (f.task === k) return;
    f.task = k; curSet(); S.note = 'task:' + k; S.actions++;
    buildControls(); showHandles(true); kick();
  }
  function stepN(i, d) {
    const f = S.force, set = curSet();
    if (TASKS[f.task].lockN[i]) return;
    const n = clamp(set.n[i] + d, 0, MAXN); if (n === set.n[i]) return;
    set.n[i] = n; forceChanged('n:' + i);
  }
  function updateForceUI() {
    if (!ctrl || S.sub !== 'force') return;
    const f = S.force, set = curSet(), tk = TASKS[f.task];
    ctrl.querySelectorAll('[data-task]').forEach(b => { const on = b.dataset.task === f.task; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    ctrl.querySelectorAll('.tb-card').forEach(card => {
      const i = +card.dataset.i, q = (r) => card.querySelector('[data-role="' + r + '"]');
      q('fv').textContent = '＝ ' + set.n[i] * 5 + ' gw';
      q('cnt').textContent = set.n[i] + T(' 顆', ' wt');
      q('minus').disabled = !!tk.lockN[i] || set.n[i] <= 0;
      q('plus').disabled = !!tk.lockN[i] || set.n[i] >= MAXN;
      q('lockN').textContent = tk.lockN[i] ? T('🔒 固定', '🔒 Fixed') : '';
      const r = q('ang'); r.value = set.a[i]; r.disabled = !!tk.lockA[i];
      q('av').textContent = set.a[i] + '°';
      q('lockA').textContent = tk.lockA[i] ? T('🔒 固定', '🔒 Fixed') : '';
      card.classList.toggle('locked-all', !!tk.lockN[i] && !!tk.lockA[i]);
    });
    placeHandles();
  }
  function updateUI() {
    if (S.sub === 'book' && ctrl) {
      ctrl.querySelectorAll('.lab-val').forEach(e => { e.textContent = S.book[e.dataset.k] + ' gw'; });
      ctrl.querySelectorAll('.lab-range').forEach(r => { if (+r.value !== S.book[r.dataset.k]) r.value = S.book[r.dataset.k]; });
    } else updateForceUI();
    if (cv) cv.setAttribute('aria-label', S.sub === 'book'
      ? T('書本平衡檯：用滑桿調整書本重力與桌面支撐力，看書本靜止、掉落或彈飛', 'Book balance bench: use the sliders to set the book weight and the table support force and see the book rest, fall or fly off')
      : T('力桌：用砝碼數與角度調整三個力，讓中央小環回到圓心', 'Force table: set the three forces with weights and angles so the ring returns to the center'));
    updateResult();
  }

  /* ═════════ 拖曳滑輪（加分）：只有滑輪上的熱區 touch-action:none ═════════ */
  function ensureHandles() {
    if (!wrap || handles.length) return;
    for (let i = 0; i < 3; i++) {
      const h = document.createElement('div'); h.className = 'tb-handle'; h.dataset.i = i; h.style.display = 'none';
      h.setAttribute('aria-hidden', 'true');
      h.addEventListener('pointerdown', e => { if (S.sub !== 'force' || TASKS[S.force.task].lockA[i]) return; e.preventDefault(); h.setPointerCapture(e.pointerId); h._drag = true; dragTo(i, e); });
      h.addEventListener('pointermove', e => { if (h._drag) dragTo(i, e); });
      const end = e => { h._drag = false; try { h.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ } };
      h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
      wrap.appendChild(h); handles.push(h);
    }
  }
  function dragTo(i, e) {
    const r = cv.getBoundingClientRect();
    const lx = (e.clientX - r.left) / r.width * W, ly = (e.clientY - r.top) / r.height * H;
    const a = norm360(Math.atan2(-(ly - CY), lx - CX) * 180 / Math.PI);
    if (curSet().a[i] !== a) { curSet().a[i] = a; forceChanged('drag:' + i); }
  }
  function showHandles(on) { ensureHandles(); handles.forEach(h => { h.style.display = on ? '' : 'none'; }); if (on) placeHandles(); }
  function placeHandles() {
    if (!handles.length || S.sub !== 'force') return;
    const set = curSet(), tk = TASKS[S.force.task];
    handles.forEach((h, i) => {
      const p = pulleyPos(set.a[i]);
      h.style.left = (p.x / W * 100) + '%'; h.style.top = (p.y / H * 100) + '%';
      h.style.display = tk.lockA[i] ? 'none' : '';
    });
  }

  /* ═════════ 介面契約 ═════════ */
  const onVis = () => sync();
  function bind() {
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    sw = document.getElementById(KEY + 'LabSwitch');
    wrap = cv ? cv.parentNode : null;
    if (cv) ctx = cv.getContext('2d');
  }
  function activate() {
    if (S.on) deactivate();
    bind(); if (!cv) return;
    S.on = true; S.visible = true;
    setTaskText(); buildSwitch(); buildControls(); showHandles(S.sub === 'force');
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
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
    bind(); setTaskText(); buildSwitch(); buildControls(); render();
  }
  function _state() {
    const b = S.book, set = curSet(), R = resultant(set), net = bookNet();
    return {
      sub: S.sub,
      book: {
        W: b.W, N: b.N, net, balanced: net === 0, outcome: net === 0 ? 'balanced' : (net < 0 ? 'falls' : 'flies'),
        offsetY: +b.by.toFixed(1), phase: b.phase, shownW: +b.dW.toFixed(2), shownN: +b.dN.toFixed(2)
      },
      force: {
        task: S.force.task, weights: set.n.map(n => n * 5), angles: set.a.slice(),
        resultant: +R.mag.toFixed(2), resultantDir: R.dir, balanced: isBalanced(R), near: !isBalanced(R) && R.mag < NEAR_TOL,
        ring: { x: +S.force.rx.toFixed(1), y: +S.force.ry.toFixed(1), targetOffset: +Math.hypot(ringTarget(R).x - CX, ringTarget(R).y - CY).toFixed(1) },
        glow: +S.force.glow.toFixed(2)
      },
      balanced: S.sub === 'book' ? net === 0 : isBalanced(R),
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-table.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-table .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-table .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-table .lab-switch{order:2;display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
#lab-table .canvas-wrap{order:3;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-table canvas{display:block;width:100%;height:auto;outline:none}
#lab-table .result-box{order:4;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-table .result-box>div+div{margin-top:4px}
#lab-table .lab-controls{order:5;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-table .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:44px}
#lab-table .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-table .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:2.8em}
#lab-table .lab-srow .lab-name{min-width:0;flex:0 0 290px}
#lab-table .lab-range{flex:1 1 160px;min-width:120px;height:36px;accent-color:#ffe066;margin:0}
#lab-table .lab-val{font:700 22px "JetBrains Mono","Noto Sans TC",monospace;min-width:4.6em;text-align:right;color:#f6f3ea}
#lab-table .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-table .lab-btn:hover{border-color:#ffe066}
#lab-table .lab-btn:disabled{opacity:.4;cursor:default}
#lab-table .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-table .lab-sw{flex:1 1 220px}
#lab-table .tb-cards{display:flex;flex-wrap:wrap;gap:8px}
#lab-table .tb-card{flex:1 1 300px;min-width:0;border:2px solid;border-radius:10px;padding:6px 12px 8px;background:rgba(11,26,21,.45);box-sizing:border-box}
#lab-table .tb-ch{font-size:22px;display:flex;align-items:baseline;gap:8px;min-height:30px}
#lab-table .tb-fv{font:700 22px "JetBrains Mono","Noto Sans TC",monospace;color:#f6f3ea}
#lab-table .tb-wrow{display:flex;align-items:center;gap:8px;min-height:44px}
#lab-table .tb-pm{min-width:56px;padding:4px 10px}
#lab-table .tb-cnt{font:700 22px "JetBrains Mono","Noto Sans TC",monospace;min-width:3.2em;text-align:center}
#lab-table .tb-arow{display:flex;align-items:center;gap:8px;min-height:36px}
#lab-table .tb-an{font-size:22px;font-weight:700;color:#a3b8b0;white-space:nowrap}
#lab-table .tb-av{font:700 22px "JetBrains Mono","Noto Sans TC",monospace;min-width:3.1em;text-align:right;white-space:nowrap}
#lab-table .tb-arow .lab-range{flex:1 1 60px;min-width:60px}
#lab-table .tb-lock{font-size:18px;font-weight:700;color:#ffe066;white-space:nowrap}
#lab-table .tb-handle{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;touch-action:none;cursor:grab;z-index:2}
#lab-table .tb-w{color:#ff8040}#lab-table .tb-n{color:#33cc99}#lab-table .tb-r{color:#ffe066}
#lab-table .tb-ok{color:#33cc99;font-weight:700}#lab-table .tb-bad{color:#ff8040;font-weight:700}#lab-table .tb-near{color:#ffe066;font-weight:700}
#lab-table .tb-okc{color:#33cc99}#lab-table .tb-badc{color:#ff8040}
#lab-table .tb-q{color:#f6f3ea}
#lab-table .tb-m{color:#a3b8b0}
@media (max-width:640px){#lab-table.lab-desk{padding:12px 12px 14px}#lab-table .lab-title{font-size:24px}#lab-table .lab-name{min-width:0;width:100%}#lab-table .lab-srow{flex-wrap:wrap}#lab-table .lab-srow .lab-name{min-width:0;width:100%}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜靜力平衡實驗室', te = '🔧 Try it | Equilibrium lab';
    const kz = '改變書本的重力，你必須同步調整桌面的支撐力，書本才不會失衡。';
    const ke = 'Change the book\'s weight and you must adjust the table\'s support force at the same time, or the book will lose its balance.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="lab-switch" id="${KEY}LabSwitch"></div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    const R0 = resultant(curSet()), t0 = ringTarget(R0); S.force.rx = t0.x; S.force.ry = t0.y; S.force.glow = isBalanced(R0) ? 1 : 0;
    bind(); buildSwitch(); buildControls(); showHandles(false);
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { TW.clear(); if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _settle: settle, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
