/* mechanics_2_lab_radar_1125_v1.js — 「動手做｜向量夾角雷達」實驗台（#radarLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.radar = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab3 最後，並注入 <style id="lab-radar-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 物理：兩力 F₁（沿 +x）與 F₂（與 F₁ 夾角 θ）從同一作用點出發，
 *   合力向量 R ＝ F₁ ＋ F₂（平行四邊形的對角線），大小 R ＝ √(F₁²＋F₂²＋2F₁F₂cosθ)。
 *   θ＝0° 時 R ＝ F₁＋F₂（最大）；θ＝180° 時 R ＝ |F₁−F₂|（最小）。
 * 畫面：左側向量圖（箭頭長度 ＝ gw × PX_PER_GW，背景方格 1 格 ＝ 10 gw）；右側 R–θ 圖，黃點隨 θ 沿曲線移動。
 * 互動：三條滑桿（θ、F₁、F₂）＋按鈕（θ＝0°／90°／180°／重設）；方向鍵 ←→ 每次 ±5°。
 * 動畫：數值用短緩動追到目標，穩定後停止 RAF，不佔 CPU。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'radar', TAB = 'tab3';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };
  const DEF = { th: 60, f1: 30, f2: 40 };
  const RMAX = 100;                       /* R–θ 圖縱軸上限（F₁＋F₂ 最大 100 gw） */

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

  /* ═════════ 物理（全部用向量算，不手填數字） ═════════ */
  function vec(th, f1, f2) {
    const a = th * Math.PI / 180;
    const x2 = f2 * Math.cos(a), y2 = f2 * Math.sin(a);      /* F₂ 分量（y 向上為正） */
    const rx = f1 + x2, ry = y2;
    return { a, x2, y2, rx, ry, R: Math.hypot(rx, ry) };
  }
  const Rof = (th, f1, f2) => vec(th, f1, f2).R;
  const isInt = v => Math.abs(v - Math.round(v)) < 1e-6;
  const approxSign = v => (isInt(v) ? '＝' : '≈');
  const approxEn = v => (isInt(v) ? '=' : '≈');

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    tgt: { th: DEF.th, f1: DEF.f1, f2: DEF.f2 },
    cur: { th: DEF.th, f1: DEF.f1, f2: DEF.f2 },
    actions: 0, note: 'start', boxes: [], idle: true
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  /* ═════════ 文字（記錄文字框供檢查） ═════════ */
  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    S.boxes.push({ s, str: s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
  }

  /* ═════════ 左側：向量圖 ═════════ */
  const LX0 = 12, LX1 = 572, LY0 = 12, LY1 = 528;      /* 左面板 */
  const OX = 200, OY = 350;                              /* 作用點 */
  const PX = 3.2;                                        /* 每 gw 的像素；1 格 ＝ 10 gw ＝ 32 px */
  const GRID = 10 * PX;

  function arrow(c, x0, y0, x1, y1, col, lw, head, glow) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const h = Math.min(head, len * 0.75), hw = h * 0.5;
    const bx = x1 - ux * h * 0.85, by = y1 - uy * h * 0.85;
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'butt'; c.lineJoin = 'round';
    if (glow) { c.shadowColor = rgba(col, 0.85); c.shadowBlur = 14; }
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(bx, by); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(bx - uy * hw, by + ux * hw); c.lineTo(bx + uy * hw, by - ux * hw); c.closePath(); c.fill();
    c.restore();
  }
  function segPts(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 5)), out = [];
    for (let i = 0; i <= n; i++) out.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
    return out;
  }
  /* 文字擺位：每個標籤給一串候選位置，挑「不壓別的字、不壓箭頭線、不出界」中最好的 */
  function placeLabel(c, str, size, cands, placed, pts) {
    const w = tw(c, str, size);
    let best = null;
    for (let i = 0; i < cands.length; i++) {
      const p = cands[i], al = p.al || 'center';
      const x0 = al === 'left' ? p.x : al === 'right' ? p.x - w : p.x - w / 2;
      const b = { x0, y0: p.y - size * 0.6, x1: x0 + w, y1: p.y + size * 0.6 };
      let pen = i * 0.01;
      if (b.x0 < LX0 + 6 || b.x1 > LX1 - 6 || b.y0 < LY0 + 6 || b.y1 > LY1 - 6) pen += 5000;
      for (const q of placed) {
        const ox = Math.min(b.x1, q.x1) - Math.max(b.x0, q.x0) + 6, oy = Math.min(b.y1, q.y1) - Math.max(b.y0, q.y0) + 4;
        if (ox > 0 && oy > 0) pen += 1000;
      }
      for (const pt of pts) if (pt[0] > b.x0 - 4 && pt[0] < b.x1 + 4 && pt[1] > b.y0 - 3 && pt[1] < b.y1 + 3) pen += 1;
      if (!best || pen < best.pen) best = { pen, x: p.x, y: p.y, al, box: b };
      if (pen < 0.5) break;
    }
    placed.push(best.box);
    return best;
  }
  function drawLeft(c) {
    /* 面板與方格（1 格 ＝ 10 gw） */
    c.fillStyle = 'rgba(11,26,21,0.55)'; rr(c, LX0, LY0, LX1 - LX0, LY1 - LY0, 12); c.fill();
    c.save(); rr(c, LX0, LY0, LX1 - LX0, LY1 - LY0, 12); c.clip();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(163,184,176,0.14)';
    for (let x = OX % GRID; x < LX1; x += GRID) { c.beginPath(); c.moveTo(x, LY0); c.lineTo(x, LY1); c.stroke(); }
    for (let y = OY % GRID; y < LY1; y += GRID) { c.beginPath(); c.moveTo(LX0, y); c.lineTo(LX1, y); c.stroke(); }
    c.strokeStyle = 'rgba(163,184,176,0.32)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(LX0, OY); c.lineTo(LX1, OY); c.stroke();
    c.restore();

    const { f1, f2, th } = S.cur;
    const v = vec(th, f1, f2);
    const P1 = [OX + f1 * PX, OY];
    const P2 = [OX + v.x2 * PX, OY - v.y2 * PX];
    const PR = [P1[0] + P2[0] - OX, P1[1] + P2[1] - OY];

    /* 平行四邊形：淡黃底＋虛線補邊 */
    c.save(); c.fillStyle = 'rgba(255,224,102,0.08)';
    c.beginPath(); c.moveTo(OX, OY); c.lineTo(P1[0], P1[1]); c.lineTo(PR[0], PR[1]); c.lineTo(P2[0], P2[1]); c.closePath(); c.fill();
    c.setLineDash([9, 7]); c.lineWidth = 3; c.lineCap = 'butt';
    c.strokeStyle = rgba(COL.pink, 0.85);              /* 與 F₂ 平行的邊 */
    c.beginPath(); c.moveTo(P1[0], P1[1]); c.lineTo(PR[0], PR[1]); c.stroke();
    c.strokeStyle = rgba(COL.teal, 0.85);              /* 與 F₁ 平行的邊 */
    c.beginPath(); c.moveTo(P2[0], P2[1]); c.lineTo(PR[0], PR[1]); c.stroke();
    c.restore();

    /* 夾角弧 */
    const arcR = 46;
    if (th > 0.5) {
      c.save(); c.strokeStyle = COL.white; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.arc(OX, OY, arcR, -v.a, 0); c.stroke(); c.restore();
    }

    /* 箭頭：F₂、F₁ 先畫，R 最後畫；F₁、F₂ 近乎同線（0°／180°）時 R 整條上移一點，才看得到它自己 */
    const off = 18 * clamp(1 - Math.abs(v.y2) * PX / 26, 0, 1);
    const RO = [OX, OY - off], RT = [PR[0], PR[1] - off];
    arrow(c, OX, OY, P2[0], P2[1], COL.pink, 5.5, 20, false);
    arrow(c, OX, OY, P1[0], P1[1], COL.teal, 5.5, 20, false);
    if (v.R * PX > 1) arrow(c, RO[0], RO[1], RT[0], RT[1], COL.yellow, 8, 26, true);
    c.save(); c.fillStyle = COL.white; c.strokeStyle = COL.deep; c.lineWidth = 2.5;
    c.beginPath(); c.arc(OX, OY, 7, 0, TAU); c.fill(); c.stroke(); c.restore();
    if (v.R * PX <= 1) {                                  /* 合力 0：作用點上亮一圈黃 */
      c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 4; c.shadowColor = rgba(COL.yellow, 0.8); c.shadowBlur = 12;
      c.beginPath(); c.arc(OX, OY, 14, 0, TAU); c.stroke(); c.restore();
    }

    /* 文字：先放固定的，再依序替四個標籤找位置 */
    const r1 = Math.round(f1), r2 = Math.round(f2), Rv = v.R, rR = Math.round(Rv);
    const sF1 = 'F₁ = ' + r1 + ' gw', sF2 = 'F₂ = ' + r2 + ' gw';
    const sR = 'R ' + (isInt(Rv) ? '=' : '≈') + ' ' + rR + ' gw';
    const sTh = 'θ = ' + Math.round(th) + '°';
    const sCap = T('黃色對角線＝合力 R', 'Yellow diagonal = resultant R');
    const sScale = T('1 格 ＝ 10 gw', '1 square = 10 gw');
    const placed = [];
    const wCap = tw(c, sCap, 22), wSc = tw(c, sScale, 22);
    const yCap = 470, ySc = 504;
    placed.push({ x0: 34, y0: yCap - 13, x1: 34 + wCap, y1: yCap + 13 });
    placed.push({ x0: 62, y0: ySc - 13, x1: 62 + wSc, y1: ySc + 13 });

    const pts = [].concat(segPts(OX, OY, P1[0], P1[1]), segPts(OX, OY, P2[0], P2[1]), segPts(RO[0], RO[1], RT[0], RT[1]),
      segPts(P1[0], P1[1], PR[0], PR[1]), segPts(P2[0], P2[1], PR[0], PR[1]));
    if (th > 0.5) for (let a = 0; a <= v.a; a += 0.12) pts.push([OX + arcR * Math.cos(a), OY - arcR * Math.sin(a)]);
    const wF1 = tw(c, sF1, 22), wR = tw(c, sR, 22), wF2 = tw(c, sF2, 22);
    const lenR = Math.hypot(RT[0] - RO[0], RT[1] - RO[1]) || 1, uR = [(RT[0] - RO[0]) / lenR, (RT[1] - RO[1]) / lenR];
    const lenA = Math.hypot(P2[0] - OX, P2[1] - OY) || 1, u2 = [(P2[0] - OX) / lenA, (P2[1] - OY) / lenA];
    const tipC = (P, u, w, gap) => ({ x: P[0] + u[0] * (w / 2 + gap), y: P[1] + u[1] * 28 });
    const sideC = (P, Q, u, tl, dl, sides) => {
      const out = [];
      for (const d of dl) for (const sd of sides) for (const t of tl)
        out.push({ x: Q[0] + (P[0] - Q[0]) * t + u[1] * sd * d, y: Q[1] + (P[1] - Q[1]) * t - u[0] * sd * d });
      return out;
    };

    /* F₁：放在箭頭下方（下方永遠是空的），靠右一點，把左下角留給 θ */
    const fx = Math.max(OX + wF1 / 2 + 14, P1[0]);
    const cF1 = [{ x: fx, y: OY + 34 }, { x: fx, y: OY + 62 }, { x: P1[0] + 20, y: OY + 34 }, { x: fx, y: OY - 34 }];
    const pF1 = placeLabel(c, sF1, 22, cF1, placed, pts);
    /* R：先放箭頭尖端外側，再放對角線兩側 */
    const cR = [tipC(RT, uR, wR, 18), { x: RT[0] + uR[0] * (wR / 2 + 18), y: RT[1] - 36 }]
      .concat(sideC(RT, RO, uR, [0.55, 0.4, 0.7, 0.85], [36, 64, 92], [1, -1]));
    const pR = placeLabel(c, sR, 22, cR, placed, pts);
    /* F₂：尖端外側優先，再放 F₂ 兩側 */
    const cF2 = [tipC(P2, u2, wF2, 16)].concat(sideC(P2, [OX, OY], u2, [0.5, 0.35, 0.65, 0.85], [36, 64, 92], [1, -1]));
    const pF2 = placeLabel(c, sF2, 22, cF2, placed, pts);
    /* θ：優先放在夾角平分線上、弧的外側；放不下就放作用點左下 */
    const bis = -v.a / 2, cTh = [];
    for (const r of [arcR + 44, arcR + 76, arcR + 110]) cTh.push({ x: OX + r * Math.cos(bis), y: OY + r * Math.sin(bis) });
    cTh.push({ x: OX - 18, y: OY + 36, al: 'right' }, { x: OX - 18, y: OY - 36, al: 'right' }, { x: OX - 18, y: OY + 70, al: 'right' });
    const pTh = placeLabel(c, sTh, 22, cTh, placed, pts);

    label(c, sF1, pF1.x, pF1.y, COL.teal, 22, pF1.al);
    label(c, sF2, pF2.x, pF2.y, COL.pink, 22, pF2.al);
    label(c, sR, pR.x, pR.y, COL.yellow, 22, pR.al);
    label(c, sTh, pTh.x, pTh.y, COL.white, 22, pTh.al);
    label(c, sCap, 34, yCap, COL.yellow, 22, 'left');
    /* 比例尺小方格 */
    c.save(); c.strokeStyle = COL.white; c.lineWidth = 2.5; c.strokeRect(24, ySc - 13, 26, 26); c.restore();
    label(c, sScale, 62, ySc, COL.dim, 22, 'left');
  }

  /* ═════════ 右側：R–θ 圖 ═════════ */
  const GX0 = 650, GX1 = 820, GY0 = 150, GY1 = 420;
  const gx = th => GX0 + th / 180 * (GX1 - GX0);
  const gy = R => GY1 - R / RMAX * (GY1 - GY0);

  function drawGraph(c) {
    c.fillStyle = 'rgba(11,26,21,0.62)'; rr(c, 590, LY0, 350, LY1 - LY0, 12); c.fill();
    const { f1, f2, th } = S.cur;
    label(c, T('合力 R 與夾角 θ 的關係', 'Resultant R vs angle θ'), 765, 44, COL.white, 22, 'center');
    label(c, T('R（gw）', 'R (gw)'), 600, 84, COL.yellow, 22, 'left');

    /* 格線與刻度 */
    c.lineWidth = 1.5;
    for (const R of [0, 50, 100]) {
      c.strokeStyle = 'rgba(163,184,176,0.22)'; c.beginPath(); c.moveTo(GX0, gy(R)); c.lineTo(GX1, gy(R)); c.stroke();
      label(c, String(R), GX0 - 10, gy(R), COL.white, 22, 'right');
    }
    for (const a of [0, 90, 180]) {
      c.strokeStyle = 'rgba(163,184,176,0.22)'; c.beginPath(); c.moveTo(gx(a), GY0); c.lineTo(gx(a), GY1); c.stroke();
      label(c, String(a), gx(a), GY1 + 28, COL.white, 22, 'center');
    }
    label(c, T('夾角 θ（°）', 'Angle θ (°)'), (GX0 + GX1) / 2, 492, COL.white, 22, 'center');
    /* 座標軸 */
    c.strokeStyle = COL.white; c.fillStyle = COL.white; c.lineWidth = 3;
    c.beginPath(); c.moveTo(GX0, GY1); c.lineTo(GX1 + 14, GY1); c.moveTo(GX0, GY1); c.lineTo(GX0, GY0 - 14); c.stroke();
    c.beginPath(); c.moveTo(GX1 + 22, GY1); c.lineTo(GX1 + 10, GY1 - 6); c.lineTo(GX1 + 10, GY1 + 6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(GX0, GY0 - 22); c.lineTo(GX0 - 6, GY0 - 10); c.lineTo(GX0 + 6, GY0 - 10); c.closePath(); c.fill();

    /* 整條 R(θ) 曲線 */
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = rgba(COL.yellow, 0.9);
    c.beginPath();
    for (let a = 0; a <= 180; a += 1) { const x = gx(a), y = gy(Rof(a, f1, f2)); if (a === 0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke(); c.restore();

    /* 兩端的值 */
    const R0 = Rof(0, f1, f2), R180 = Rof(180, f1, f2);
    for (const [a, R] of [[0, R0], [180, R180]]) {
      c.save(); c.fillStyle = COL.deep; c.strokeStyle = COL.white; c.lineWidth = 3;
      c.beginPath(); c.arc(gx(a), gy(R), 8, 0, TAU); c.fill(); c.stroke(); c.restore();
    }
    label(c, '0°' + T('：相加 ', ': sum ') + Math.round(R0), gx(0) + 14, gy(R0) - 32, COL.white, 22, 'left');
    label(c, '180°', GX1 + 18, gy(R180) - 44, COL.white, 22, 'left');
    label(c, T('相減 ', 'diff ') + Math.round(R180), GX1 + 18, gy(R180) - 16, COL.white, 22, 'left');

    /* 目前的 θ：黃點 ＋ 到座標軸的虛線 */
    const cx = gx(th), cy = gy(Rof(th, f1, f2));
    c.save(); c.setLineDash([6, 6]); c.strokeStyle = rgba(COL.yellow, 0.65); c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, GY1); c.moveTo(cx, cy); c.lineTo(GX0, cy); c.stroke(); c.restore();
    c.save(); c.shadowColor = rgba(COL.yellow, 0.95); c.shadowBlur = 18;
    c.fillStyle = COL.yellow; c.strokeStyle = COL.white; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, 11, 0, TAU); c.fill(); c.stroke(); c.restore();
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    drawLeft(c);
    drawGraph(c);
  }

  /* ═════════ 迴圈（只在有動作時跑，穩定就停） ═════════ */
  const KEYS = ['th', 'f1', 'f2'];
  const settled = () => KEYS.every(k => Math.abs(S.cur[k] - S.tgt[k]) < 0.02);
  function snap() { KEYS.forEach(k => { S.cur[k] = S.tgt[k]; }); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const k = 1 - Math.exp(-dt * 13);
    KEYS.forEach(n => { S.cur[n] += (S.tgt[n] - S.cur[n]) * k; });
    if (settled()) { snap(); S.idle = true; render(); return; }
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
    if (settled()) { snap(); S.idle = true; render(); return; }
    S.idle = false; sync(); if (!S.raf) { snap(); S.idle = true; render(); }
  }

  /* ═════════ 操作 ═════════ */
  function setVal(k, v) {
    const lim = { th: [0, 180], f1: [10, 50], f2: [10, 50] }[k];
    S.tgt[k] = clamp(Math.round(v), lim[0], lim[1]);
    S.actions++; S.note = k + ':' + S.tgt[k];
    updateUI(); kick();
  }
  function act(k) {
    if (k === 'th0') setVal('th', 0);
    else if (k === 'th90') setVal('th', 90);
    else if (k === 'th180') setVal('th', 180);
    else if (k === 'reset') { S.tgt.th = DEF.th; S.tgt.f1 = DEF.f1; S.tgt.f2 = DEF.f2; S.actions++; S.note = 'reset'; updateUI(); kick(); }
  }

  const SL = [['th', 0, 180, 1], ['f1', 10, 50, 10], ['f2', 10, 50, 10]];
  const slName = k => (k === 'th' ? T('夾角 θ', 'Angle θ') : k === 'f1' ? 'F₁' : 'F₂');
  const slVal = k => (k === 'th' ? S.tgt.th + '°' : S.tgt[k] + ' gw');
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    for (const [k, mn, mx, st] of SL) {
      const row = document.createElement('div'); row.className = 'lab-row lab-srow';
      const nm = document.createElement('label'); nm.className = 'lab-name'; nm.textContent = slName(k); nm.htmlFor = 'radar-' + k; row.appendChild(nm);
      const r = document.createElement('input'); r.type = 'range'; r.id = 'radar-' + k; r.min = mn; r.max = mx; r.step = st; r.value = S.tgt[k];
      r.dataset.k = k; r.addEventListener('input', () => setVal(k, +r.value)); row.appendChild(r);
      const val = document.createElement('span'); val.className = 'lab-val'; val.dataset.k = k; val.textContent = slVal(k); row.appendChild(val);
      ctrl.appendChild(row);
    }
    const row = document.createElement('div'); row.className = 'lab-row lab-brow';
    for (const [k, text] of [['th0', 'θ = 0°'], ['th90', 'θ = 90°'], ['th180', 'θ = 180°'], ['reset', T('重設', 'Reset')]]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = k; b.textContent = text;
      b.addEventListener('click', () => act(k)); row.appendChild(b);
    }
    ctrl.appendChild(row);
  }
  function updateUI() {
    if (ctrl) {
      ctrl.querySelectorAll('input[type=range]').forEach(r => { if (+r.value !== S.tgt[r.dataset.k]) r.value = S.tgt[r.dataset.k]; });
      ctrl.querySelectorAll('.lab-val').forEach(s => { s.textContent = slVal(s.dataset.k); });
      ctrl.querySelectorAll('.lab-btn').forEach(b => {
        const th = { th0: 0, th90: 90, th180: 180 }[b.dataset.act];
        const on = th !== undefined && S.tgt.th === th; b.classList.toggle('active', on);
        if (th !== undefined) b.setAttribute('aria-pressed', String(on));
      });
    }
    if (cv) cv.setAttribute('aria-label', T('向量夾角雷達：拉動滑桿改變兩力的夾角與大小，觀察平行四邊形與合力；左右方向鍵每次改變 5 度',
      'Vector angle radar: drag the sliders to change the angle and size of the two forces and watch the parallelogram and the resultant; left/right arrows change the angle by 5 degrees'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const { th, f1, f2 } = S.tgt, R = Rof(th, f1, f2), rR = Math.round(R);
    const l1 = T(`<b class="lr-a">夾角 ${th}°</b>：合力 <b class="lr-r">R ${approxSign(R)} ${rR} gw</b>`,
      `<b class="lr-a">Angle ${th}°</b>: resultant <b class="lr-r">R ${approxEn(R)} ${rR} gw</b>`);
    let l2;
    if (th === 0) l2 = T(`同向：合力＝兩力相加＝${f1 + f2} gw（最大）`, `Same direction: resultant = sum of the two forces = ${f1 + f2} gw (maximum)`);
    else if (th === 180) {
      l2 = f1 === f2
        ? T('反向且一樣大：合力 0（兩力互相抵消）', 'Opposite and equal: resultant 0 (the forces cancel)')
        : T(`反向：合力＝兩力相減＝${Math.abs(f1 - f2)} gw（最小）`, `Opposite direction: resultant = difference of the two forces = ${Math.abs(f1 - f2)} gw (minimum)`);
    } else if (th === 90 && f1 === 30 && f2 === 40) l2 = T('互相垂直：合力 ＝ 50 gw（3-4-5 直角三角形）', 'Perpendicular: resultant = 50 gw (a 3-4-5 right triangle)');
    else l2 = T('夾角越大，合力越小', 'The larger the angle, the smaller the resultant');
    const l3 = T(`F₁ ＝ ${f1} gw、F₂ ＝ ${f2} gw：合力介於 ${Math.abs(f1 - f2)} ～ ${f1 + f2} gw 之間`,
      `F₁ = ${f1} gw, F₂ = ${f2} gw: the resultant lies between ${Math.abs(f1 - f2)} and ${f1 + f2} gw`);
    res.innerHTML = `<div>${l1}</div><div>${l2}</div><div class="lr-t">${l3}</div>`;
  }

  /* ═════════ 鍵盤 ═════════ */
  function onKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setVal('th', S.tgt.th + 5); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setVal('th', S.tgt.th - 5); }
  }
  const onVis = () => sync();
  function onFocus() { cv.focus({ preventScroll: true }); }

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
    cv.addEventListener('keydown', onKey);
    cv.addEventListener('pointerdown', onFocus);
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
    if (cv) { cv.removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onFocus); }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    const v = vec(S.tgt.th, S.tgt.f1, S.tgt.f2);
    return {
      theta: S.tgt.th, F1: S.tgt.f1, F2: S.tgt.f2, R: +v.R.toFixed(3), Rround: Math.round(v.R),
      shown: { th: +S.cur.th.toFixed(3), f1: +S.cur.f1.toFixed(3), f2: +S.cur.f2.toFixed(3) },
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-radar.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-radar .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-radar .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-radar .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-radar canvas{display:block;width:100%;height:auto;outline:none}
#lab-radar canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-radar .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-radar .result-box>div+div{margin-top:4px}
#lab-radar .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-radar .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-radar .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-radar .lab-brow{min-height:44px;gap:8px}
#lab-radar .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:4.6em}
#lab-radar .lab-srow input[type=range]{flex:1 1 auto;min-width:0;max-width:520px;height:28px;accent-color:#ffe066;cursor:pointer;margin:0}
#lab-radar .lab-val{font-family:"JetBrains Mono","Noto Sans TC",monospace;font-size:22px;font-weight:700;min-width:5.6em;text-align:left;color:#f6f3ea}
#lab-radar .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-radar .lab-btn:hover{border-color:#ffe066}
#lab-radar .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-radar .lr-a{color:#f6f3ea}#lab-radar .lr-r{color:#ffe066}
#lab-radar .lr-t{color:#a3b8b0}
@media (max-width:640px){#lab-radar.lab-desk{padding:12px 12px 14px}#lab-radar .lab-title{font-size:24px}#lab-radar .lab-name{min-width:3.4em}#lab-radar .lab-val{min-width:4.6em}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜向量夾角雷達', te = '🔧 Try it | Angle radar';
    const kz = '拉動滑桿改變兩力的夾角，看平行四邊形與黃色對角線（合力）怎麼變。夾角為 0° 與 180° 時，合力各是多少？';
    const ke = 'Drag the slider to change the angle between the two forces and watch how the parallelogram and the yellow diagonal (the resultant) change. What is the resultant when the angle is 0° and when it is 180°?';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI();
    snap(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug() { render(); return S.boxes.slice(); } };
})();
