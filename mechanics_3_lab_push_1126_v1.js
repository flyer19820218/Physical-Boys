/* mechanics_3_lab_push_1126_v1.js — 「動手做｜推箱子實戰」實驗台（#pushLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.push = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab2 最後（所有 .sub-view 之後），並注入 <style id="lab-push-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 版面（畫布 960×540）：左＝箱子在地面（March 在左側推，用 assets/characters/march/ 的表情圖當旁白）；
 *   右＝f–F 折線圖（橫軸水平推力 F 0～100 gw、縱軸摩擦力 f 0～100 gw）。
 *
 * 物理（數字固定）：最大靜摩擦力 60 gw、動摩擦力 40 gw。
 *   靜止時：F ≤ 60 → 箱子不動，f ＝ F（合力 0）。F > 60 → 突破，開始滑動。
 *   滑動中：f ＝ 40（固定）；加速度 ∝ (F − 40)：F > 40 加速、F ＝ 40 等速、F < 40 減速到停；
 *   速度減到 0 就停下，回到靜摩擦狀態 f ＝ F。
 *   速度上限只是畫面保險（VMAX），不寫在畫面上。
 * 折線圖：理論折線（f＝F 到 60，掉到 40，水平到 100）淡色畫好；紅點在折線上；走過的線段用亮色描出。
 *   補充：箱子已在動、F 又調到 60 以下時，紅點會落在 f＝40 的水平線上（動摩擦力與 F 無關），
 *   所以把這條水平線向左用虛線延伸到 F＝0（只有「已經在滑」時才會走到）。
 * 箱子與 March 在畫面上不動，地面刻度反向捲動來表現滑動（所以沒有「撞到邊界」的問題）。
 * 動畫只在箱子還在滑動、或「自動緩慢加推力」進行中才跑 RAF，靜止就停；離開分頁／頁面隱藏也停。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'push', TAB = 'tab2';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6', red: '#ff4d5e'
  };

  /* ═════════ 常數 ═════════ */
  const FMAX = 100, FS = 60, FK = 40;                 /* 最大靜摩擦力、動摩擦力（gw） */
  const K = 3;                                         /* 加速度 px/s² 每 gw（只決定畫面快慢） */
  const VMAX = 600;                                    /* 畫面速度保險 */
  const AUTO_RATE = 15;                                /* 自動加推力：gw／秒 */
  const GY = 400;                                      /* 地面線 */
  const BW = 112, BH = 112, CX = 300;                  /* 箱子大小與中心 x */
  const PXG = 1.4;                                     /* 場景箭頭：px／gw */
  /* 圖表 */
  const GX0 = 570, GY0 = 432, GWD = 340, GHT = 290;    /* 原點與 100 gw 的長度 */
  const gx = F => GX0 + F * GWD / FMAX, gy = f => GY0 - f * GHT / FMAX;

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

  /* ═════════ 圖片（March 表情） ═════════ */
  const IMG = {};
  [['n', 'normal'], ['s', 'struggling'], ['v', 'victory'], ['t', 'thinking']].forEach(([k, p]) => {
    const im = new Image(); im.onload = () => { if (!S.raf) render(); };
    im.src = 'assets/characters/march/' + p + '.png?v=20261126c'; IMG[k] = im;
  });
  const ok = im => im && im.complete && im.naturalWidth;

  /* ═════════ 狀態與物理 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    F: 0, v: 0, mov: false, pos: 0,                  /* 推力、速度、是否滑動中、地面捲動量 */
    auto: false, fAuto: 0,
    vd: new Uint8Array(FMAX + 1), vk: new Uint8Array(FMAX + 1), drop: false,   /* 走過的線段 */
    actions: 0, note: 'start', debug: false, boxes: []
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  const fric = () => (S.mov ? FK : S.F);               /* 目前摩擦力 */
  const netF = () => (S.mov ? S.F - FK : 0);           /* 合力（向右為正） */
  function mode() {
    if (!S.mov) return S.F === 0 ? 'zero' : 'static';
    return S.F > FK ? 'accel' : S.F === FK ? 'steady' : 'decel';
  }
  function markRange(arr, a, b) {
    const lo = clamp(Math.min(a, b), 0, FMAX), hi = clamp(Math.max(a, b), 0, FMAX);
    for (let i = lo; i <= hi; i++) arr[i] = 1;
  }
  function resetTrace() { S.vd.fill(0); S.vk.fill(0); S.drop = false; S.vd[S.F] = S.mov ? 0 : 1; if (S.mov) S.vk[S.F] = 1; }

  /* 改變推力：處理走過的線段與「突破」 */
  function applyF(nf) {
    nf = clamp(Math.round(nf), 0, FMAX);
    const old = S.F;
    if (nf === old) return;
    S.F = nf;
    if (!S.mov) {
      if (nf <= FS) markRange(S.vd, Math.min(old, FS), nf);
      else {                                           /* 突破最大靜摩擦力：開始滑動 */
        markRange(S.vd, Math.min(old, FS), FS);
        S.drop = true; S.mov = true; S.v = 0.5;
        markRange(S.vk, FS, nf);
      }
    } else markRange(S.vk, old, nf);
  }

  /* ═════════ 文字 ═════════ */
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save();
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  function pill(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x0 + w / 2, y, color, size, 'center'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, x1: x0 + w };
  }

  /* ═════════ 場景：地面、箱子、March ═════════ */
  function drawFloor(c) {
    const gl = c.createRadialGradient(240, 250, 20, 240, 250, 340);
    gl.addColorStop(0, 'rgba(255,224,102,0.06)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 470, GY);
    const g = c.createLinearGradient(0, GY, 0, H);
    g.addColorStop(0, '#2d5044'); g.addColorStop(1, '#16332b');
    c.save(); c.beginPath(); c.rect(0, GY, 480, H - GY); c.clip();
    c.fillStyle = g; c.fillRect(0, GY, 480, H - GY);
    /* 地面刻度：箱子滑動時反向捲動 */
    const sp = 48, off = ((-S.pos) % sp + sp) % sp;
    c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 1.5;
    for (let x = off - sp; x <= 480; x += sp) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x, H); c.stroke(); }
    for (let y = GY + 24; y <= H; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(480, y); c.stroke(); }
    c.restore();
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(470, GY); c.stroke();
  }

  function drawCrate(c, cx) {
    const x = cx - BW / 2, y = GY - BH;
    c.save(); c.globalAlpha = 0.45; c.fillStyle = COL.deep;
    c.beginPath(); c.ellipse(cx, GY + 3, BW / 2 + 6, 8, 0, 0, TAU); c.fill(); c.restore();
    /* 速度線（滑得快才畫，在箱子後方） */
    if (S.mov && S.v > 25) {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 3; c.lineCap = 'round';
      [-34, 0, 34].forEach((dy, i) => {
        const len = 16 + Math.min(44, S.v * 0.1) - i % 2 * 8;
        c.beginPath(); c.moveTo(x - 6, y + BH / 2 + dy); c.lineTo(x - 6 - len, y + BH / 2 + dy); c.stroke();
      });
      c.restore();
    }
    c.save();
    const g = c.createLinearGradient(0, y, 0, y + BH);
    g.addColorStop(0, '#d49a5a'); g.addColorStop(1, '#a8703a');
    c.fillStyle = g; rr(c, x, y, BW, BH, 6); c.fill();
    c.beginPath(); rr(c, x + 1, y + 1, BW - 2, BH - 2, 6); c.clip();
    const ph = BH / 3;
    for (let p = 0; p < 3; p++) {
      const py = y + p * ph;
      c.fillStyle = p % 2 ? 'rgba(120,70,30,0.12)' : 'rgba(255,220,160,0.1)'; c.fillRect(x, py, BW, ph);
      c.strokeStyle = 'rgba(90,52,22,0.5)'; c.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) {
        const gy2 = py + 8 + k * 9.5;
        c.beginPath();
        for (let q = 0; q <= BW; q += 6) {
          const yy = gy2 + Math.sin(q * 0.07 + p * 2.1 + k * 1.3) * 2.2;
          if (q === 0) c.moveTo(x + q, yy); else c.lineTo(x + q, yy);
        }
        c.stroke();
      }
      c.strokeStyle = 'rgba(70,40,16,0.85)'; c.lineWidth = 2.6;
      if (p > 0) { c.beginPath(); c.moveTo(x, py); c.lineTo(x + BW, py); c.stroke(); }
    }
    c.strokeStyle = 'rgba(80,46,18,0.55)'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(x + 12, y + BH - 12); c.lineTo(x + BW - 12, y + 12); c.stroke();
    c.strokeStyle = '#7a4a22'; c.lineWidth = 11; c.strokeRect(x + 5, y + 5, BW - 10, BH - 10);
    c.restore();
    c.strokeStyle = '#4a2c12'; c.lineWidth = 3; rr(c, x, y, BW, BH, 6); c.stroke();
    c.fillStyle = '#3a2410';
    [[x + 9, y + 9], [x + BW - 9, y + 9], [x + 9, y + BH - 9], [x + BW - 9, y + BH - 9]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 3, 0, TAU); c.fill(); });
  }

  function drawMarch(c, right) {
    const m = mode();
    const k = m === 'zero' ? 'n' : m === 'static' ? 's' : m === 'decel' ? 't' : 'v';
    const im = IMG[k]; if (!ok(im)) return;
    const hgt = 215, wd = im.naturalWidth * hgt / im.naturalHeight;
    c.save(); c.globalAlpha = 0.4; c.fillStyle = COL.deep;
    c.beginPath(); c.ellipse(right - wd / 2, GY + 3, wd / 2, 7, 0, 0, TAU); c.fill(); c.restore();
    c.drawImage(im, right - wd, GY - hgt + 4, wd, hgt);
  }

  /* ═════════ 箭頭 ═════════ */
  function arrow(c, x0, y, dir, len, color, shaft, headL, headH) {
    c.save();
    if (len > 0.5) {
      const hl = Math.min(headL, len), xe = x0 + dir * len, xs = xe - dir * hl;
      c.fillStyle = color;
      if (len > hl) c.fillRect(Math.min(x0, xs), y - shaft / 2, Math.abs(xs - x0), shaft);
      c.beginPath(); c.moveTo(xe, y); c.lineTo(xs, y - headH); c.lineTo(xs, y + headH); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5; c.stroke();
    }
    c.fillStyle = color; c.strokeStyle = COL.deep; c.lineWidth = 2.5;
    c.beginPath(); c.arc(x0, y, 7, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  function leader(c, x, y0, y1, color) {
    c.save(); c.setLineDash([5, 6]); c.strokeStyle = rgba(color, 0.5); c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.restore();
  }

  function drawScene(c) {
    drawFloor(c);
    drawMarch(c, CX - BW / 2 - 4);
    drawCrate(c, CX);
    /* 推力（青，向右）：箱子上方；摩擦力（珊瑚，向左）：畫在接觸面（地面）上 */
    const Y_F = 262, Y_f = GY + 34;
    leader(c, CX, GY - BH, Y_F, COL.teal);
    arrow(c, CX, Y_F, 1, S.F * PXG, COL.teal, 12, 22, 14);
    label(c, T('推力 F = ', 'Push F = ') + S.F + ' gw', 274, Y_F - 36, COL.teal, 22, 'left');
    const f = fric();
    leader(c, CX, GY, Y_f, COL.coral);
    arrow(c, CX, Y_f, -1, f * PXG, COL.coral, 12, 22, 14);
    label(c, T('摩擦力 f = ', 'Friction f = ') + f + ' gw', CX, Y_f + 38, COL.coral, 22, 'center');
    /* 狀態小標籤 */
    const m = mode();
    const st = m === 'zero' ? T('靜止', 'At rest') : m === 'static' ? T('靜止（靜摩擦）', 'At rest (static)') :
      m === 'accel' ? T('加速滑動中', 'Speeding up') : m === 'steady' ? T('等速滑動', 'Constant speed') : T('減速中', 'Slowing down');
    pill(c, st, 235, 60, m === 'zero' || m === 'static' ? COL.green : m === 'decel' ? COL.coral : COL.yellow, 22, 'center');
  }

  /* ═════════ 折線圖 ═════════ */
  function drawChart(c) {
    /* 底框 */
    c.save(); c.fillStyle = 'rgba(11,26,21,0.55)'; rr(c, 484, 14, 462, 512, 14); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 2; c.stroke(); c.restore();
    /* 格線與刻度 */
    c.strokeStyle = 'rgba(246,243,234,0.12)'; c.lineWidth = 1.5;
    for (let v = 20; v <= FMAX; v += 20) {
      c.beginPath(); c.moveTo(gx(v), gy(0)); c.lineTo(gx(v), gy(FMAX)); c.stroke();
      c.beginPath(); c.moveTo(gx(0), gy(v)); c.lineTo(gx(FMAX), gy(v)); c.stroke();
    }
    for (let v = 0; v <= FMAX; v += 20) {
      label(c, String(v), gx(v), GY0 + 24, COL.dim, 20, 'center');
      const hi = v === FS || v === FK;
      label(c, String(v), GX0 - 14, gy(v), hi ? COL.coral : COL.dim, 20, 'right');
    }
    /* 軸 */
    c.strokeStyle = COL.white; c.lineWidth = 3.5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(GX0, GY0 + 1); c.lineTo(gx(FMAX) + 26, GY0 + 1); c.stroke();
    c.beginPath(); c.moveTo(GX0, GY0 + 1); c.lineTo(GX0, gy(FMAX) - 22); c.stroke();
    c.fillStyle = COL.white;
    c.beginPath(); c.moveTo(gx(FMAX) + 38, GY0 + 1); c.lineTo(gx(FMAX) + 24, GY0 - 7); c.lineTo(gx(FMAX) + 24, GY0 + 9); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(GX0, gy(FMAX) - 34); c.lineTo(GX0 - 8, gy(FMAX) - 20); c.lineTo(GX0 + 8, gy(FMAX) - 20); c.closePath(); c.fill();
    label(c, T('水平推力 F (gw)', 'Horizontal push F (gw)'), gx(50), GY0 + 62, COL.teal, 22, 'center');
    label(c, T('摩擦力 f (gw)', 'Friction f (gw)'), GX0 - 70, 52, COL.coral, 22, 'left');

    /* 淡色理論折線：f = F 到 60、掉到 40、水平到 100 */
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(gx(0), gy(0)); c.lineTo(gx(FS), gy(FS)); c.lineTo(gx(FS), gy(FK)); c.lineTo(gx(FMAX), gy(FK)); c.stroke();
    /* 水平線向左的虛線延伸（只有已經在滑才會走到） */
    c.setLineDash([3, 11]); c.lineWidth = 5; c.strokeStyle = 'rgba(246,243,234,0.28)';
    c.beginPath(); c.moveTo(gx(0), gy(FK)); c.lineTo(gx(FS), gy(FK)); c.stroke();
    c.setLineDash([]);
    /* 亮色：走過的線段 */
    c.strokeStyle = COL.yellow; c.lineWidth = 7; c.shadowColor = rgba(COL.yellow, 0.55); c.shadowBlur = 10;
    runs(S.vd, 0, FS, (a, b) => { c.beginPath(); c.moveTo(gx(a), gy(a)); c.lineTo(gx(b), gy(b)); c.stroke(); });
    if (S.drop) { c.beginPath(); c.moveTo(gx(FS), gy(FS)); c.lineTo(gx(FS), gy(FK)); c.stroke(); }
    runs(S.vk, 0, FMAX, (a, b) => { c.beginPath(); c.moveTo(gx(a), gy(FK)); c.lineTo(gx(b), gy(FK)); c.stroke(); });
    c.restore();

    /* 峰值與動摩擦力標示 */
    c.save(); c.setLineDash([6, 7]); c.strokeStyle = rgba(COL.coral, 0.55); c.lineWidth = 2;
    c.beginPath(); c.moveTo(GX0, gy(FS)); c.lineTo(gx(FS), gy(FS)); c.stroke();
    c.beginPath(); c.moveTo(GX0, gy(FK)); c.lineTo(gx(FS), gy(FK)); c.stroke(); c.restore();
    c.fillStyle = COL.coral; c.strokeStyle = COL.deep; c.lineWidth = 2.5;
    c.beginPath(); c.arc(gx(FS), gy(FS), 7, 0, TAU); c.fill(); c.stroke();
    label(c, T('最大靜摩擦力 60 gw', 'Max static friction 60 gw'), gx(FS) - 6, gy(FS) - 26, COL.coral, 22, 'center');
    label(c, T('動摩擦力 40 gw', 'Kinetic friction 40 gw'), gx(FMAX) - 4, gy(FK) + 32, COL.coral, 22, 'right');

    /* 紅點與引導線 */
    const f = fric(), px = gx(S.F), py = gy(f);
    c.save(); c.setLineDash([7, 7]); c.strokeStyle = rgba(COL.red, 0.7); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px, GY0); c.stroke();
    c.beginPath(); c.moveTo(px, py); c.lineTo(GX0, py); c.stroke(); c.restore();
    c.save(); c.shadowColor = rgba(COL.red, 0.8); c.shadowBlur = 14;
    c.fillStyle = COL.red; c.beginPath(); c.arc(px, py, 12, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = COL.white; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 12, 0, TAU); c.stroke();
    /* 紅點讀數：固定放在圖的左上空白處 */
    pill(c, '(F, f) = (' + S.F + ', ' + f + ')', GX0 + 18, gy(92), COL.red, 22, 'left');
  }
  /* 連續被標記的區段：fn(a, b) */
  function runs(arr, lo, hi, fn) {
    let a = -1;
    for (let i = lo; i <= hi + 1; i++) {
      const on = i <= hi && arr[i];
      if (on && a < 0) a = i;
      if (!on && a >= 0) { fn(a, i - 1); a = -1; }
    }
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    drawScene(c);
    drawChart(c);
  }

  /* ═════════ 迴圈（箱子滑動中或自動加推力時才跑） ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    if (S.auto) {
      S.fAuto = Math.min(FMAX, S.fAuto + AUTO_RATE * dt);
      applyF(S.fAuto);
      if (S.fAuto >= FMAX) { S.auto = false; syncAutoBtn(); }
      syncSliders(); updateResult();
    }
    if (S.mov) {
      S.v = clamp(S.v + K * (S.F - FK) * dt, -1, VMAX);
      S.vk[S.F] = 1;
      if (S.v <= 0) {                                /* 停下：回到靜摩擦狀態 f = F */
        S.v = 0; S.mov = false; S.vd[S.F] = 1; updateResult();
      } else S.pos += S.v * dt;
    }
    render();
    if (S.mov || S.auto) S.raf = requestAnimationFrame(frame);
    else updateResult();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && (S.mov || S.auto);
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() { sync(); if (!S.raf) render(); }

  /* ═════════ 操作 ═════════ */
  function stopAuto() { if (S.auto) { S.auto = false; syncAutoBtn(); } }
  function act(k) {
    S.actions++;
    if (k === 'reset') {
      S.auto = false; S.F = 0; S.v = 0; S.mov = false; S.pos = 0; S.fAuto = 0; S.note = 'reset';
      resetTrace(); syncSliders(); syncAutoBtn(); updateResult(); kick(); return;
    }
    if (k === 'auto') {
      if (S.auto) { stopAuto(); S.note = 'auto-stop'; kick(); return; }
      /* 從 0 重新開始：箱子歸位、清掉線段，再慢慢加推力 */
      S.F = 0; S.v = 0; S.mov = false; S.pos = 0; S.fAuto = 0; S.auto = true; S.note = 'auto';
      resetTrace(); syncSliders(); syncAutoBtn(); updateResult(); S.last = performance.now(); kick();
    }
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const row = document.createElement('div'); row.className = 'lab-row lab-srow';
    const nm = document.createElement('span'); nm.className = 'lab-name'; nm.style.color = COL.teal; nm.textContent = T('水平推力 F', 'Horizontal push F');
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = FMAX; inp.step = 1; inp.value = S.F;
    inp.id = KEY + 'Slider'; inp.setAttribute('aria-label', T('水平推力 F（gw）', 'Horizontal push F (gw)'));
    const val = document.createElement('span'); val.className = 'lab-val'; val.id = KEY + 'Val'; val.textContent = S.F + ' gw';
    inp.addEventListener('pointerdown', stopAuto);
    inp.addEventListener('input', () => {
      stopAuto();
      applyF(+inp.value); S.fAuto = S.F; S.note = 'slider'; S.actions++;
      val.textContent = S.F + ' gw'; updateResult(); kick();
    });
    row.append(nm, inp, val); ctrl.appendChild(row);
    const br = document.createElement('div'); br.className = 'lab-row lab-brow';
    const b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'lab-btn'; b1.dataset.act = 'reset'; b1.textContent = T('↺ 重來', '↺ Start over');
    const b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'lab-btn'; b2.dataset.act = 'auto'; b2.id = KEY + 'AutoBtn';
    b1.addEventListener('click', () => act('reset')); b2.addEventListener('click', () => act('auto'));
    br.append(b1, b2); ctrl.appendChild(br);
    syncAutoBtn();
  }
  function syncAutoBtn() {
    const b = document.getElementById(KEY + 'AutoBtn'); if (!b) return;
    b.textContent = S.auto ? T('⏹ 停止自動加推力', '⏹ Stop auto push') : T('⏩ 自動緩慢加推力', '⏩ Slowly raise the push');
    b.classList.toggle('on', S.auto);
  }
  function syncSliders() {
    const inp = document.getElementById(KEY + 'Slider'), val = document.getElementById(KEY + 'Val');
    if (inp) inp.value = S.F; if (val) val.textContent = S.F + ' gw';
  }
  function updateUI() {
    if (cv) cv.setAttribute('aria-label', T('推箱子實戰：左邊是箱子與摩擦力箭頭，右邊是摩擦力 f 對水平推力 F 的折線圖，紅點顯示目前狀態',
      'Pushing a crate: the crate and friction arrows on the left, and the f versus F line graph on the right with a red dot for the current state'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const F = S.F, m = mode(), net = Math.abs(F - FK);
    let l1, l2;
    if (m === 'zero') {
      l1 = T('<b class="lt-g">靜止：f ＝ F ＝ 0 gw</b>', '<b class="lt-g">At rest: f = F = 0 gw</b>');
      l2 = T('還沒有推，沒有摩擦力；推力要超過 60 gw 箱子才會滑動。', 'No push yet, so no friction. The push must exceed 60 gw before the crate slides.');
    } else if (m === 'static') {
      l1 = T(`<b class="lt-g">靜止：f ＝ F ＝ ${F} gw</b>`, `<b class="lt-g">At rest: f = F = ${F} gw</b>`);
      l2 = F === FS
        ? T('合力 ＝ 0，箱子不動；已經是最大靜摩擦力 60 gw，再多推一點就會滑動。', 'Net force = 0, the crate stays put. This is the maximum static friction of 60 gw; push any harder and it slides.')
        : T(`合力 ＝ ${F} − ${F} ＝ 0，箱子不動；還要再推 ${FS - F} gw 才到最大靜摩擦力 60 gw。`, `Net force = ${F} − ${F} = 0, the crate stays put. ${FS - F} gw more reaches the maximum static friction of 60 gw.`);
    } else if (m === 'accel') {
      l1 = T('<b class="lt-y">滑動中：f ＝ 40 gw（固定）</b>', '<b class="lt-y">Sliding: f = 40 gw (fixed)</b>');
      l2 = T(`合力 ＝ ${F} − 40 ＝ ${net} gw，向右，箱子越滑越快（加速）。`, `Net force = ${F} − 40 = ${net} gw, to the right, so the crate keeps speeding up.`);
    } else if (m === 'steady') {
      l1 = T('<b class="lt-y">等速滑動：f ＝ 40 gw（固定）</b>', '<b class="lt-y">Constant speed: f = 40 gw (fixed)</b>');
      l2 = T('合力 ＝ 40 − 40 ＝ 0，箱子保持等速。', 'Net force = 40 − 40 = 0, so the crate keeps a constant speed.');
    } else {
      l1 = T('<b class="lt-c">減速：f ＝ 40 gw（固定）</b>', '<b class="lt-c">Slowing down: f = 40 gw (fixed)</b>');
      l2 = T(`合力 ＝ 40 − ${F} ＝ ${net} gw，向左（與運動方向相反），箱子漸慢到停下，停下後 f ＝ F。`,
        `Net force = 40 − ${F} = ${net} gw, to the left (against the motion), so the crate slows to a stop; after that f = F again.`);
    }
    res.innerHTML = `<div>${l1}</div><div class="lt-t">${l2}</div>`;
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
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    stopAuto();
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    let nd = 0, nk = 0; S.vd.forEach(x => { nd += x; }); S.vk.forEach(x => { nk += x; });
    return {
      F: S.F, f: fric(), mode: mode(), mov: S.mov, v: +S.v.toFixed(2), net: netF(), pos: +S.pos.toFixed(1),
      auto: S.auto, drop: S.drop, litStatic: nd, litKinetic: nk, running: !!S.raf, on: S.on,
      actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-push.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-push .lab-title{order:0;font-size:32px;font-weight:700;color:#4dd2ff;margin:0 0 4px;line-height:1.35}
#lab-push .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#a3b8b0;font-weight:700}
#lab-push .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-push canvas{display:block;width:100%;height:auto;outline:none}
#lab-push .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-push .result-box>div+div{margin-top:4px}
#lab-push .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-push .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-push .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-push .lab-brow{min-height:44px;margin-top:2px}
#lab-push .lab-name{font-size:22px;font-weight:700;min-width:8.2em}
#lab-push .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;min-width:4.6em;text-align:right;color:#f6f3ea}
#lab-push input[type=range]{flex:1 1 auto;min-width:0;height:36px;margin:0;background:transparent;cursor:pointer;touch-action:none;-webkit-appearance:none;appearance:none}
#lab-push input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:rgba(77,210,255,.35)}
#lab-push input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(77,210,255,.35)}
#lab-push input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:34px;height:34px;margin-top:-12px;border-radius:50%;background:#4dd2ff;border:3px solid #f6f3ea;box-shadow:0 0 8px rgba(77,210,255,.6)}
#lab-push input[type=range]::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:#4dd2ff;border:3px solid #f6f3ea;box-shadow:0 0 8px rgba(77,210,255,.6)}
#lab-push .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer;touch-action:manipulation}
#lab-push .lab-btn:hover{border-color:#ffe066}
#lab-push .lab-btn.on{border-color:#ffe066;background:#3a3a14;color:#ffe066}
#lab-push .lt-g{color:#33cc99}#lab-push .lt-y{color:#ffe066}#lab-push .lt-c{color:#ff8040}
#lab-push .lt-t{color:#a3b8b0}
@media (max-width:640px){#lab-push.lab-desk{padding:12px 12px 14px}#lab-push .lab-title{font-size:26px}#lab-push .lab-srow{flex-wrap:wrap}#lab-push .lab-name{min-width:0;width:100%}#lab-push input[type=range]{flex:1 1 150px}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '動手做｜推箱子實戰', te = 'Try it | Pushing a crate';
    const kz = '慢慢加大水平推力，看紅點怎麼沿著折線走：推到哪裡箱子才會動？動了以後摩擦力變多少？',
      ke = 'Raise the horizontal push slowly and watch the red dot follow the line. When does the crate start to move, and what does friction become then?';
    d.innerHTML =
      `<h2 class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</h2>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    resetTrace();
    bind(); buildControls(); updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
