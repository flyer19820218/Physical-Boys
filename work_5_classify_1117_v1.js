/* ==================================================================
   work_5 ｜ 能源怎麼分？（cvs-classify，960×540）
   四步：1 生活處處要能源 → 2 用得完 vs 用不完 → 3 天然的與加工的（補充）→ 4 能源的源頭
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全程同色）：太陽／能量＝黃 SUN、再生能源＝綠 REN #33cc99、非再生能源＝橘紅 NON #ff8040；
   電力＝電子藍 ELEC（全站電學色）、水＝藍 WATER。
   畫布頂端 0～30px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   不用任何圖片檔，全部 Canvas 繪製；亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const SUN = COL.yellow;            /* 太陽／能量：黃 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const NON = '#ff8040';             /* 非再生能源：橘紅 */
  const ELEC = COL.teal;             /* 電力：電子藍 */
  const WATER = '#5ab8e8';
  const WHITE = COL.white, DIM = COL.dim, PINK = COL.pink;
  const METAL = '#8fa39c', INK = '#0b1a15', LINE = '#cfe0da';
  const DUR = [8, 9, 9, 9];          /* 總長 35 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（也不記進 W5.boxes） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  function TL(c, a, lines, x, y, col, size, lh, align) {
    lines.forEach((l, i) => T(c, a, l, x, y + i * lh, col, size, align));
  }
  const NOHEAD = /^[，、。：；）」！？]/;
  function wrap(c, str, size, maxW) {
    const toks = str.match(/[⺀-鿿　-〿＀-￯]|[^\s⺀-鿿　-〿＀-￯]+\s*|\s+/g) || [];
    const lines = []; let cur = '';
    for (const t of toks) {
      const test = cur + t;
      if (cur && W5.tw(c, test.trim(), size) > maxW && !NOHEAD.test(t)) { lines.push(cur.trim()); cur = t.trimStart(); }
      else cur = test;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  /* 底部字幕：說明一般框、結論綠框 */
  function subtitle(c, a, str, border) {
    if (a <= 0.02) return;
    const size = 22, lh = 31, lines = wrap(c, str, size, 860);
    let w = 0; lines.forEach(l => { w = Math.max(w, W5.tw(c, l, size)); });
    w += 48; const h = lines.length * lh + 18, y0 = 490 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.86)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    lines.forEach((l, i) => W5.label(c, l, 480, y0 + 9 + lh * (i + 0.5), WHITE, size));
    c.restore();
  }

  /* ── 共用小零件 ── */
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
  function badge(c, x, y, r, col, lit) {
    c.save();
    if (lit > 0) W5.glow(c, x, y, r * 1.45, col, 0.28 * lit);
    c.fillStyle = 'rgba(11,26,21,0.88)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.lineWidth = 3; c.strokeStyle = col; c.stroke();
    c.restore();
  }
  function clipCircle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); }
  function flame(c, x, y, s, t, outer, inner) {
    const f = 1 + 0.12 * Math.sin(t * 13) + 0.07 * Math.sin(t * 7.3 + 1);
    const h = s * 1.7 * f;
    c.save();
    c.fillStyle = outer; c.beginPath(); c.moveTo(x, y - h);
    c.bezierCurveTo(x + s * 0.9, y - h * 0.45, x + s * 0.7, y, x, y);
    c.bezierCurveTo(x - s * 0.7, y, x - s * 0.9, y - h * 0.45, x, y - h); c.fill();
    c.fillStyle = inner; c.beginPath(); c.moveTo(x, y - h * 0.55);
    c.bezierCurveTo(x + s * 0.4, y - h * 0.25, x + s * 0.32, y, x, y);
    c.bezierCurveTo(x - s * 0.32, y, x - s * 0.4, y - h * 0.25, x, y - h * 0.55); c.fill();
    c.restore();
  }
  /* 往上飄的黃色能量小點（表示「正在用能量」） */
  function sparks(c, x, y, n, t, seed, spread) {
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.55 + hash(seed + i * 3.1)) % 1;
      const px = x + (hash(seed + i * 7.7) - 0.5) * spread + Math.sin(t * 2 + i) * 4;
      const py = y - ph * 42;
      const a = Math.sin(ph * Math.PI);
      c.save(); c.globalAlpha *= a;
      W5.glow(c, px, py, 9, SUN, 0.7);
      c.fillStyle = '#fff6c4'; c.beginPath(); c.arc(px, py, 2.6, 0, TAU); c.fill();
      c.restore();
    }
  }
  /* 二次貝茲曲線取點 */
  function qpt(p0, p1, p2, f) {
    const g = 1 - f;
    return { x: g * g * p0[0] + 2 * g * f * p1[0] + f * f * p2[0], y: g * g * p0[1] + 2 * g * f * p1[1] + f * f * p2[1] };
  }
  function qcurve(c, p0, p1, p2, f1) {
    c.beginPath(); c.moveTo(p0[0], p0[1]);
    const N = 26;
    for (let i = 1; i <= N; i++) { const q = qpt(p0, p1, p2, f1 * i / N); c.lineTo(q.x, q.y); }
  }
  function headAt(c, p0, p1, p2, col, size) {
    const a = qpt(p0, p1, p2, 0.96), b = qpt(p0, p1, p2, 1);
    const an = Math.atan2(b.y - a.y, b.x - a.x);
    c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(b.x, b.y);
    c.lineTo(b.x - Math.cos(an - 0.45) * size, b.y - Math.sin(an - 0.45) * size);
    c.lineTo(b.x - Math.cos(an + 0.45) * size, b.y - Math.sin(an + 0.45) * size);
    c.closePath(); c.fill(); c.restore();
  }

  /* ═════════════════ 圖示（中心 x,y；R＝半徑尺度） ═════════════════ */
  function iconCoal(c, x, y, R) {
    const lumps = [[-0.42, 0.28, 0.4], [0.38, 0.3, 0.38], [0, -0.2, 0.44]];
    lumps.forEach((L0, i) => {
      const cx = x + L0[0] * R, cy = y + L0[1] * R, s = L0[2] * R;
      c.beginPath();
      for (let j = 0; j < 7; j++) {
        const an = j / 7 * TAU + i, rr = s * (0.82 + 0.3 * hash(i * 10 + j));
        const px = cx + Math.cos(an) * rr, py = cy + Math.sin(an) * rr;
        if (j) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath(); c.fillStyle = '#2d3331'; c.fill(); c.strokeStyle = '#8a9490'; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(210,220,215,0.55)'; c.beginPath(); c.arc(cx - s * 0.32, cy - s * 0.3, s * 0.16, 0, TAU); c.fill();
    });
  }
  function iconBarrel(c, x, y, R) {
    const w = R * 1.1, h = R * 1.5;
    c.fillStyle = '#c4532c'; W5.rr(c, x - w / 2, y - h / 2, w, h, R * 0.14); c.fill();
    c.strokeStyle = '#ffb08a'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#7a2e17'; c.lineWidth = 3;
    [-0.24, 0.24].forEach(f => { c.beginPath(); c.moveTo(x - w / 2 + 2, y + h * f); c.lineTo(x + w / 2 - 2, y + h * f); c.stroke(); });
    c.fillStyle = '#16201d'; c.beginPath(); c.moveTo(x, y - R * 0.36);
    c.bezierCurveTo(x + R * 0.3, y - R * 0.02, x + R * 0.24, y + R * 0.3, x, y + R * 0.3);
    c.bezierCurveTo(x - R * 0.24, y + R * 0.3, x - R * 0.3, y - R * 0.02, x, y - R * 0.36); c.fill();
    c.strokeStyle = '#ffd2bd'; c.lineWidth = 1.5; c.stroke();
  }
  function iconGas(c, x, y, R, t) {
    const w = R * 0.8, h = R * 1.25, y0 = y - h / 2 + R * 0.22;
    c.fillStyle = '#9fb6c4'; W5.rr(c, x - w / 2, y0, w, h, w * 0.45); c.fill();
    c.strokeStyle = '#e3eef4'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#5c6f78'; c.fillRect(x - R * 0.12, y0 - R * 0.16, R * 0.24, R * 0.18);
    flame(c, x, y0 - R * 0.18, R * 0.24, t, '#5aa9ff', '#d8ecff');
  }
  function iconRod(c, x, y, R, t) {
    W5.glow(c, x, y, R * 1.05, NON, 0.22 + 0.1 * Math.sin(t * 3));
    [-0.36, 0, 0.36].forEach((dx, i) => {
      const rx = x + dx * R, w = R * 0.22, h = R * 1.45;
      c.fillStyle = '#b9c7c1'; W5.rr(c, rx - w / 2, y - h / 2, w, h, w / 2); c.fill();
      c.strokeStyle = '#e9f1ee'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#4b5a54';
      for (let j = 0; j < 4; j++) c.fillRect(rx - w * 0.3, y - h / 2 + h * (0.14 + j * 0.2), w * 0.6, h * 0.12);
      if (i === 1) { c.fillStyle = NON; c.fillRect(rx - w / 2, y - h / 2 + h * 0.02, w, h * 0.06); }
    });
  }
  function iconSun(c, x, y, R, t) {
    W5.glow(c, x, y, R * 1.6, SUN, 0.45);
    c.save(); c.strokeStyle = SUN; c.lineWidth = Math.max(2.5, R * 0.1); c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const an = i / 12 * TAU + t * 0.35, r0 = R * 0.7, r1 = R * (0.95 + 0.07 * Math.sin(t * 3 + i));
      c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.stroke();
    }
    c.restore();
    const g = c.createRadialGradient(x - R * 0.15, y - R * 0.15, R * 0.05, x, y, R * 0.58);
    g.addColorStop(0, '#fff7c2'); g.addColorStop(0.55, SUN); g.addColorStop(1, '#f2b400');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 0.56, 0, TAU); c.fill();
  }
  function iconWind(c, x, y, R, t) {
    const hx = x - R * 0.1, hy = y - R * 0.28;
    /* 風的流線 */
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + i / 3) % 1, yy = y - R * 0.55 + i * R * 0.45, x0 = x - R * 0.95 + ph * R * 0.5;
      c.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
      c.beginPath(); c.moveTo(x0, yy); c.quadraticCurveTo(x0 + R * 0.3, yy - R * 0.1, x0 + R * 0.55, yy); c.stroke();
    }
    c.restore();
    c.fillStyle = '#dfe8e4'; c.beginPath();
    c.moveTo(hx - R * 0.05, hy); c.lineTo(hx + R * 0.05, hy); c.lineTo(hx + R * 0.1, y + R * 0.85); c.lineTo(hx - R * 0.1, y + R * 0.85); c.closePath(); c.fill();
    const ang = t * 2.2;
    for (let j = 0; j < 3; j++) {
      const an = ang + j * TAU / 3;
      c.save(); c.translate(hx, hy); c.rotate(an);
      c.fillStyle = '#f6f3ea'; c.beginPath(); c.moveTo(0, -R * 0.05); c.quadraticCurveTo(R * 0.4, -R * 0.12, R * 0.68, 0); c.quadraticCurveTo(R * 0.4, R * 0.06, 0, R * 0.05); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = METAL; c.beginPath(); c.arc(hx, hy, R * 0.08, 0, TAU); c.fill();
  }
  function iconHydro(c, x, y, R, t) {
    c.save(); clipCircle(c, x, y, R * 1.05);
    c.fillStyle = 'rgba(90,184,232,0.75)'; c.fillRect(x - R, y - R * 0.15, R * 0.9, R * 1.2);
    c.fillStyle = '#8e9c97'; c.beginPath();
    c.moveTo(x - R * 0.12, y - R * 0.35); c.lineTo(x + R * 0.08, y - R * 0.35); c.lineTo(x + R * 0.3, y + R * 1.1); c.lineTo(x - R * 0.12, y + R * 1.1); c.closePath(); c.fill();
    c.strokeStyle = '#d6e2de'; c.lineWidth = 1.5; c.stroke();
    /* 溢流 */
    c.strokeStyle = WATER; c.lineWidth = 4; c.setLineDash([7, 6]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(x + R * 0.12, y + R * 0.05); c.quadraticCurveTo(x + R * 0.45, y + R * 0.1, x + R * 0.55, y + R * 0.9); c.stroke();
    c.setLineDash([]);
    c.restore();
    /* 水滴 */
    const dy = Math.sin(t * 2.4) * R * 0.06, dx0 = x + R * 0.52, dy0 = y - R * 0.55 + dy;
    c.fillStyle = WATER; c.beginPath(); c.moveTo(dx0, dy0 - R * 0.28);
    c.bezierCurveTo(dx0 + R * 0.22, dy0, dx0 + R * 0.18, dy0 + R * 0.2, dx0, dy0 + R * 0.2);
    c.bezierCurveTo(dx0 - R * 0.18, dy0 + R * 0.2, dx0 - R * 0.22, dy0, dx0, dy0 - R * 0.28); c.fill();
    c.strokeStyle = '#d8f1ff'; c.lineWidth = 1.5; c.stroke();
  }
  function iconTide(c, x, y, R, t) {
    c.fillStyle = '#e8eef0'; c.beginPath(); c.arc(x + R * 0.42, y - R * 0.5, R * 0.22, 0, TAU); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(x + R * 0.52, y - R * 0.56, R * 0.2, 0, TAU); c.fill();
    c.save(); clipCircle(c, x, y, R * 1.05);
    const lvl = Math.sin(t * 1.4) * R * 0.08;
    for (let k = 0; k < 2; k++) {
      const yy = y + R * (0.05 + k * 0.38) + lvl;
      c.beginPath(); c.moveTo(x - R * 1.1, y + R * 1.2);
      for (let i = 0; i <= 24; i++) { const px = x - R * 1.1 + i / 24 * R * 2.2; c.lineTo(px, yy + Math.sin(px * 0.09 - t * 2.6 + k) * R * 0.1); }
      c.lineTo(x + R * 1.1, y + R * 1.2); c.closePath();
      c.fillStyle = k ? 'rgba(90,184,232,0.85)' : 'rgba(90,184,232,0.45)'; c.fill();
    }
    c.restore();
  }
  function iconGeo(c, x, y, R, t) {
    c.save(); clipCircle(c, x, y, R * 1.05);
    c.fillStyle = '#6b4a32'; c.fillRect(x - R * 1.1, y, R * 2.2, R * 1.2);
    c.fillStyle = '#835c3f'; c.fillRect(x - R * 1.1, y + R * 0.3, R * 2.2, R * 0.22);
    const mg = c.createRadialGradient(x, y + R * 1.0, R * 0.05, x, y + R * 1.0, R * 0.6);
    mg.addColorStop(0, '#ffd27a'); mg.addColorStop(0.5, '#ff5a36'); mg.addColorStop(1, 'rgba(255,90,54,0)');
    c.fillStyle = mg; c.fillRect(x - R, y + R * 0.4, R * 2, R * 0.8);
    c.fillStyle = METAL; c.fillRect(x - R * 0.07, y - R * 0.12, R * 0.14, R * 0.9);
    c.restore();
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.5 + i / 4) % 1;
      c.save(); c.globalAlpha *= Math.sin(ph * Math.PI) * 0.85;
      c.fillStyle = '#eef3f1'; c.beginPath();
      c.arc(x + Math.sin(ph * 6 + i) * R * 0.12, y - R * 0.18 - ph * R * 0.7, R * (0.1 + ph * 0.16), 0, TAU); c.fill();
      c.restore();
    }
  }
  function iconPlant(c, x, y, R, t) {
    c.fillStyle = '#7a5235'; W5.rr(c, x - R * 0.55, y + R * 0.55, R * 1.1, R * 0.26, R * 0.12); c.fill();
    c.fillStyle = '#a07050'; c.beginPath(); c.arc(x + R * 0.48, y + R * 0.68, R * 0.11, 0, TAU); c.fill();
    const sw = Math.sin(t * 1.5) * 0.08;
    c.save(); c.translate(x, y + R * 0.55); c.rotate(sw);
    c.strokeStyle = '#2f9e62'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-R * 0.08, -R * 0.6, 0, -R * 1.15); c.stroke();
    [[-1, 0.42], [1, 0.62], [-1, 0.86], [1, 1.05]].forEach(([sd, h], i) => {
      c.save(); c.translate(0, -R * h); c.rotate(sd * (0.75 + 0.05 * Math.sin(t * 2 + i)));
      c.fillStyle = i % 2 ? '#4ade80' : '#33cc99';
      c.beginPath(); c.ellipse(0, -R * 0.2, R * 0.12, R * 0.24, 0, 0, TAU); c.fill();
      c.restore();
    });
    c.restore();
  }
  function iconBolt(c, x, y, R, t) {
    W5.glow(c, x, y, R * 1.1, ELEC, 0.3 + 0.12 * Math.sin(t * 5));
    c.fillStyle = ELEC; c.beginPath();
    c.moveTo(x + R * 0.18, y - R * 0.8); c.lineTo(x - R * 0.42, y + R * 0.1); c.lineTo(x - R * 0.02, y + R * 0.1);
    c.lineTo(x - R * 0.2, y + R * 0.8); c.lineTo(x + R * 0.42, y - R * 0.12); c.lineTo(x + R * 0.02, y - R * 0.12); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(214,246,255,0.95)'; c.lineWidth = 1.5; c.stroke();
  }
  function iconCan(c, x, y, R) {
    const w = R * 1.05, h = R * 1.3;
    c.fillStyle = NON; c.beginPath(); c.moveTo(x - w / 2, y - h / 2 + R * 0.25); c.lineTo(x - w / 2 + R * 0.25, y - h / 2);
    c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w / 2, y + h / 2); c.lineTo(x - w / 2, y + h / 2); c.closePath(); c.fill();
    c.strokeStyle = '#ffd2bd'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#8a3417'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - w / 2 + 6, y - h / 2 + 8); c.lineTo(x + w / 2 - 6, y + h / 2 - 6); c.moveTo(x + w / 2 - 6, y - h / 2 + 8); c.lineTo(x - w / 2 + 6, y + h / 2 - 6); c.stroke();
    c.fillStyle = '#a8441f'; c.fillRect(x - w / 2 - R * 0.12, y - h / 2 - R * 0.2, R * 0.24, R * 0.3);
  }
  function iconPump(c, x, y, R) {
    const w = R * 0.85, h = R * 1.45;
    c.fillStyle = '#d9692f'; W5.rr(c, x - w / 2 - R * 0.15, y - h / 2, w, h, R * 0.1); c.fill();
    c.strokeStyle = '#ffd2bd'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#16201d'; c.fillRect(x - w / 2 - R * 0.02, y - h / 2 + R * 0.16, w - R * 0.26, R * 0.36);
    c.strokeStyle = '#ffd2bd'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + w / 2 - R * 0.15, y - R * 0.2); c.quadraticCurveTo(x + w / 2 + R * 0.3, y - R * 0.1, x + w / 2 + R * 0.2, y + R * 0.4); c.stroke();
  }
  function iconLPG(c, x, y, R) {
    const w = R * 0.95, h = R * 1.3;
    c.fillStyle = '#e8743a'; W5.rr(c, x - w / 2, y - h / 2 + R * 0.15, w, h, w * 0.35); c.fill();
    c.strokeStyle = '#ffd2bd'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#8a3417'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - w / 2 + 3, y + R * 0.15); c.lineTo(x + w / 2 - 3, y + R * 0.15); c.stroke();
    c.fillStyle = METAL; W5.rr(c, x - R * 0.24, y - h / 2 - R * 0.12, R * 0.48, R * 0.3, 4); c.fill();
  }

  /* ═════════════════ 第 1 步：生活處處要能源 ═════════════════ */
  const HOUSE = { x: 320, y: 205, w: 320, h: 185 };
  function step1(c, s) {
    const u = s.u, k = s.k, t = s.t;
    withA(c, k, () => {
      /* 街道 */
      c.fillStyle = '#22302c'; c.fillRect(0, 395, 960, 58);
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 395); c.lineTo(960, 395); c.stroke();
      c.strokeStyle = 'rgba(255,224,102,0.35)'; c.lineWidth = 3; c.setLineDash([26, 22]);
      c.beginPath(); c.moveTo(0, 452); c.lineTo(960, 452); c.stroke(); c.setLineDash([]);
      /* 房子（剖面） */
      const H0 = HOUSE;
      c.fillStyle = '#1c3d34'; c.fillRect(H0.x, H0.y, H0.w, H0.h);
      c.strokeStyle = LINE; c.lineWidth = 3; c.strokeRect(H0.x, H0.y, H0.w, H0.h);
      c.fillStyle = '#5a3a2e'; c.beginPath(); c.moveTo(H0.x - 22, H0.y + 2); c.lineTo(480, 138); c.lineTo(H0.x + H0.w + 22, H0.y + 2); c.closePath(); c.fill();
      c.strokeStyle = '#e3b9a3'; c.stroke();
      c.strokeStyle = 'rgba(207,224,218,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(480, H0.y); c.lineTo(480, H0.y + H0.h); c.stroke();
    });
    const a1 = seg(u, 1.0, 1.4), a2 = seg(u, 1.8, 2.2), a3 = seg(u, 2.6, 3.0), a4 = seg(u, 3.4, 3.8);

    /* 廚房：流理台＋瓦斯爐 */
    withA(c, k, () => {
      c.fillStyle = '#3c524b'; c.fillRect(338, 335, 126, 55); c.strokeStyle = LINE; c.lineWidth = 2; c.strokeRect(338, 335, 126, 55);
      c.fillStyle = '#26332f'; c.fillRect(358, 327, 86, 10);
      c.fillStyle = '#9aa8a3'; W5.rr(c, 372, 286, 60, 30, 6); c.fill();      /* 鍋子 */
      c.fillStyle = '#6d7b76'; c.fillRect(366, 284, 72, 6);
      if (a2 > 0) {
        withA(c, a2, () => {
          for (let i = -1; i <= 1; i++) flame(c, 402 + i * 14, 326, 6, t + i, '#5aa9ff', '#d8ecff');
          sparks(c, 402, 280, 4, t, 11, 50);
        });
      }
    });
    /* 客廳：吊燈＋電風扇 */
    withA(c, k, () => {
      c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.moveTo(540, H0y()); c.lineTo(540, 238); c.stroke();
      if (a3 > 0) { W5.glow(c, 540, 252, 60, SUN, 0.55 * a3); }
      c.fillStyle = a3 > 0 ? mixC('#5e6b66', '#fff3b0', a3) : '#5e6b66';
      c.beginPath(); c.arc(540, 252, 13, 0, TAU); c.fill();
      c.fillStyle = '#8fa39c'; c.fillRect(533, 236, 14, 6);
      /* 電風扇（正面） */
      const fx = 600, fy = 318, ang = a3 > 0 ? t * 9 * a3 : 0.3;
      c.strokeStyle = LINE; c.lineWidth = 4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, 382); c.stroke();
      c.fillStyle = '#5e6b66'; W5.rr(c, fx - 22, 378, 44, 9, 4); c.fill();
      c.strokeStyle = 'rgba(207,224,218,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(fx, fy, 30, 0, TAU); c.stroke();
      c.fillStyle = '#b7c7c1';
      for (let j = 0; j < 3; j++) {
        c.save(); c.translate(fx, fy); c.rotate(ang + j * TAU / 3);
        c.beginPath(); c.ellipse(15, 0, 13, 7, 0, 0, TAU); c.fill(); c.restore();
      }
      c.fillStyle = '#e8eef0'; c.beginPath(); c.arc(fx, fy, 5, 0, TAU); c.fill();
      if (a3 > 0) withA(c, a3, () => { sparks(c, 540, 238, 3, t, 31, 30); sparks(c, fx, 286, 3, t, 41, 40); });
    });

    /* 電動機車：從左邊騎進來 */
    const sx = lerp(-90, 150, ease(seg(u, 0.2, 2.0))) + (a1 > 0 ? Math.sin(t * 3) * 2 : 0);
    withA(c, k, () => {
      const wy = 430, rot = sx * 0.08;
      [sx - 34, sx + 36].forEach(wx => {
        c.fillStyle = '#26302d'; c.beginPath(); c.arc(wx, wy, 13, 0, TAU); c.fill();
        c.strokeStyle = LINE; c.lineWidth = 3; c.stroke();
        c.strokeStyle = METAL; c.lineWidth = 2; c.beginPath(); c.moveTo(wx + Math.cos(rot) * 10, wy + Math.sin(rot) * 10); c.lineTo(wx - Math.cos(rot) * 10, wy - Math.sin(rot) * 10); c.stroke();
      });
      c.fillStyle = '#e8eef0'; c.beginPath();
      c.moveTo(sx - 46, wy - 10); c.lineTo(sx - 40, wy - 30); c.lineTo(sx + 6, wy - 30); c.lineTo(sx + 14, wy - 14); c.lineTo(sx + 28, wy - 14); c.lineTo(sx + 26, wy - 6); c.lineTo(sx - 46, wy - 6); c.closePath(); c.fill();
      c.strokeStyle = '#e8eef0'; c.lineWidth = 4; c.beginPath(); c.moveTo(sx + 36, wy); c.lineTo(sx + 24, wy - 48); c.lineTo(sx + 14, wy - 50); c.stroke();
      c.fillStyle = '#36423e'; W5.rr(c, sx - 42, wy - 38, 40, 9, 4); c.fill();
      /* 電池上的藍色閃電 */
      c.fillStyle = ELEC; c.beginPath(); c.moveTo(sx - 16, wy - 28); c.lineTo(sx - 24, wy - 18); c.lineTo(sx - 18, wy - 18); c.lineTo(sx - 22, wy - 9); c.lineTo(sx - 12, wy - 21); c.lineTo(sx - 18, wy - 21); c.closePath(); c.fill();
      if (a1 > 0) withA(c, a1, () => sparks(c, sx - 10, wy - 40, 3, t, 51, 40));
    });

    /* 汽油車：從右邊開進來 */
    const cx = lerp(1060, 805, ease(seg(u, 1.6, 3.6)));
    withA(c, k, () => {
      const wy = 432;
      c.fillStyle = '#c75a3a'; c.beginPath();
      c.moveTo(cx - 70, wy - 8); c.lineTo(cx - 70, wy - 30); c.lineTo(cx - 40, wy - 34); c.lineTo(cx - 22, wy - 56); c.lineTo(cx + 30, wy - 56); c.lineTo(cx + 50, wy - 34); c.lineTo(cx + 72, wy - 30); c.lineTo(cx + 72, wy - 8); c.closePath(); c.fill();
      c.strokeStyle = '#ffc2a8'; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(160,215,240,0.7)'; c.beginPath(); c.moveTo(cx - 34, wy - 34); c.lineTo(cx - 19, wy - 51); c.lineTo(cx + 2, wy - 51); c.lineTo(cx + 2, wy - 34); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(cx + 8, wy - 34); c.lineTo(cx + 8, wy - 51); c.lineTo(cx + 27, wy - 51); c.lineTo(cx + 42, wy - 34); c.closePath(); c.fill();
      [cx - 42, cx + 44].forEach(wx => {
        c.fillStyle = '#26302d'; c.beginPath(); c.arc(wx, wy, 14, 0, TAU); c.fill();
        c.strokeStyle = LINE; c.lineWidth = 3; c.stroke();
        const rot = cx * 0.07;
        c.strokeStyle = METAL; c.lineWidth = 2; c.beginPath(); c.moveTo(wx + Math.cos(rot) * 10, wy + Math.sin(rot) * 10); c.lineTo(wx - Math.cos(rot) * 10, wy - Math.sin(rot) * 10); c.stroke();
      });
      /* 排氣（汽油在燃燒） */
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.8 + i / 4) % 1;
        c.save(); c.globalAlpha *= Math.sin(ph * Math.PI) * 0.6;
        c.fillStyle = '#9aa8a3'; c.beginPath(); c.arc(cx + 78 + ph * 40, wy - 12 - ph * 14, 4 + ph * 8, 0, TAU); c.fill(); c.restore();
      }
      if (a4 > 0) withA(c, a4, () => sparks(c, cx - 10, wy - 60, 3, t, 61, 60));
    });

    /* 標籤：電＝電子藍；瓦斯、汽油＝橘紅（化石燃料） */
    const dash = (a, col, x1, y1, x2, y2) => withA(c, a * 0.8, () => {
      c.strokeStyle = col; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
    });
    dash(a2, NON, 268, 250, 372, 300);
    dash(a3, ELEC, 680, 250, 628, 300);
    P(c, a1, L('電動機車：電', 'E-scooter: electricity'), 150, 352, ELEC, 20);
    P(c, a2, L('瓦斯爐：瓦斯', 'Gas stove: gas'), 160, 250, NON, 20);
    P(c, a3, L('電燈、電風扇：電', 'Lamp & fan: electricity'), 805, 250, ELEC, 20);
    P(c, a4, L('汽油車：汽油', 'Car: gasoline'), 808, 352, NON, 20);

    /* 中央結論 */
    P(c, seg(u, 4.4, 4.9), L('能提供能量的資源＝能源', 'Resources that supply energy = energy sources'), 480, 104, SUN, 22);
  }
  function H0y() { return HOUSE.y; }
  function mixC(a, b, f) { return W5.mix(a, b, clamp01(f)); }

  /* ═════════════════ 第 2 步：用得完 vs 用不完 ═════════════════ */
  const LEFT_ICONS = [
    { x: 110, y: 185, f: iconCoal, zh: '煤', en: 'Coal' },
    { x: 260, y: 185, f: iconBarrel, zh: '石油', en: 'Oil' },
    { x: 110, y: 320, f: iconGas, zh: '天然氣', en: 'Natural gas' },
    { x: 260, y: 320, f: iconRod, zh: '核燃料', en: 'Nuclear fuel' }
  ];
  const RIGHT_ICONS = [
    { x: 580, y: 185, f: iconSun, zh: '太陽能', en: 'Solar' },
    { x: 720, y: 185, f: iconWind, zh: '風力', en: 'Wind' },
    { x: 860, y: 185, f: iconHydro, zh: '水力', en: 'Hydro' },
    { x: 580, y: 320, f: iconTide, zh: '潮汐', en: 'Tidal' },
    { x: 720, y: 320, f: iconGeo, zh: '地熱', en: 'Geothermal' },
    { x: 860, y: 320, f: iconPlant, zh: '生質能', en: 'Biomass' }
  ];
  function step2(c, s) {
    const u = s.u, k = s.k, t = s.t;
    withA(c, k, () => {
      c.fillStyle = 'rgba(255,128,64,0.07)'; W5.rr(c, 20, 80, 445, 368, 18); c.fill();
      c.strokeStyle = 'rgba(255,128,64,0.45)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(51,204,153,0.07)'; W5.rr(c, 495, 80, 445, 368, 18); c.fill();
      c.strokeStyle = 'rgba(51,204,153,0.45)'; c.stroke();
    });
    T(c, k, L('非再生能源', 'Non-renewable'), 200, 104, NON, 24);
    T(c, k, L('再生能源', 'Renewable'), 718, 104, REN, 24);

    LEFT_ICONS.forEach((I, i) => {
      const a = k * seg(u, 0.6 + i * 0.35, 1.0 + i * 0.35);
      withA(c, a, () => { badge(c, I.x, I.y, 42, NON, 0); I.f(c, I.x, I.y, 30, t); });
      T(c, a, L(I.zh, I.en), I.x, I.y + 62, NON, 20);
    });
    RIGHT_ICONS.forEach((I, i) => {
      const a = k * seg(u, 2.2 + i * 0.3, 2.6 + i * 0.3);
      withA(c, a, () => { badge(c, I.x, I.y, 42, REN, 0.6); I.f(c, I.x, I.y, 32, t); });
      T(c, a, L(I.zh, I.en), I.x, I.y + 62, REN, 20);
    });

    /* 存量條：一直往下掉 */
    const bx = 372, by = 162, bw = 34, bh = 218;
    const lvl = 1 - 0.84 * ease(seg(u, 1.2, 7.6));
    withA(c, k, () => {
      c.fillStyle = INK; W5.rr(c, bx, by, bw, bh, 8); c.fill();
      c.save(); W5.rr(c, bx, by, bw, bh, 8); c.clip();
      const g = c.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, '#ffb08a'); g.addColorStop(1, NON);
      c.fillStyle = g; c.fillRect(bx, by + bh * (1 - lvl), bw, bh * lvl);
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2; W5.rr(c, bx, by, bw, bh, 8); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(bx, by + bh * i / 4); c.lineTo(bx + 8, by + bh * i / 4); c.stroke(); }
      /* 往下的箭頭（跟著液面） */
      const ay = by + bh * (1 - lvl) - 4 + Math.sin(t * 4) * 3;
      if (lvl < 0.995) W5.arrow(c, bx + bw + 20, ay - 22, bx + bw + 20, ay + 6, NON, 4, 12);
    });
    T(c, k, L('存量', 'Reserve'), bx + bw / 2, 140, NON, 20);
    T(c, k * seg(u, 2.0, 2.5), L('用完很難再生', 'Hard to replace once used up'), 228, 424, NON, 20);

    /* 循環箭頭 */
    const ca = k * seg(u, 4.2, 4.7);
    withA(c, ca, () => {
      const ox = 612, oy = 424, r = 17, rot = t * 2.2;
      c.strokeStyle = REN; c.lineWidth = 4; c.lineCap = 'round';
      for (let j = 0; j < 2; j++) {
        const a0 = rot + j * Math.PI, a1 = a0 + Math.PI * 0.72;
        c.beginPath(); c.arc(ox, oy, r, a0, a1); c.stroke();
        const hx = ox + Math.cos(a1) * r, hy = oy + Math.sin(a1) * r, tg = a1 + Math.PI / 2;
        c.fillStyle = REN; c.beginPath(); c.moveTo(hx + Math.cos(tg) * 9, hy + Math.sin(tg) * 9);
        c.lineTo(hx + Math.cos(tg + 2.3) * 8, hy + Math.sin(tg + 2.3) * 8); c.lineTo(hx + Math.cos(tg - 2.3) * 8, hy + Math.sin(tg - 2.3) * 8); c.closePath(); c.fill();
      }
    });
    T(c, ca, L('可以循環利用', 'Naturally replenished'), 642, 424, REN, 20, 'left');
  }

  /* ═════════════════ 第 3 步：初級 vs 次級（補充） ═════════════════ */
  const TOP_Y = 140, BOT_Y = 385, FX = 550, FY0 = 248, FY1 = 304;
  const PRIM = {
    coal: { x: 230, f: iconCoal, col: NON, zh: '原煤', en: 'Coal', inX: 516 },
    oil: { x: 390, f: iconBarrel, col: NON, zh: '原油', en: 'Crude oil', inX: 534 },
    gas: { x: 550, f: iconGas, col: NON, zh: '天然氣', en: 'Natural gas', inX: 550 },
    ura: { x: 710, f: iconRod, col: NON, zh: '鈾', en: 'Uranium', inX: 566 },
    sun: { x: 870, f: iconSun, col: SUN, zh: '陽光', en: 'Sunlight', inX: 584 }
  };
  const SEC = {
    elec: { x: 260, f: iconBolt, col: ELEC, zh: '電力', en: 'Electricity', outX: 518 },
    gasoline: { x: 460, f: iconCan, col: NON, zh: '汽油', en: 'Gasoline', outX: 538 },
    diesel: { x: 640, f: iconPump, col: NON, zh: '柴油', en: 'Diesel', outX: 562 },
    lpg: { x: 820, f: iconLPG, col: NON, zh: '液化石油氣', en: 'LPG', outX: 582 }
  };
  /* 路線：[來源, 產物, 開始秒, 是否主路線] */
  const ROUTES = [
    ['oil', 'gasoline', 2.0, true], ['oil', 'diesel', 2.35, true], ['oil', 'lpg', 2.7, true],
    ['coal', 'elec', 4.0, true], ['gas', 'elec', 4.35, true],
    ['ura', 'elec', 5.2, false], ['sun', 'elec', 5.5, false]
  ];
  function routeGeom(r) {
    const A = PRIM[r[0]], B = SEC[r[1]];
    const p0 = [A.x, TOP_Y + 66], p2 = [A.inX, FY0 - 2], p1 = [A.x, FY0 - 4];
    const q0 = [B.outX, FY1 + 2], q2 = [B.x, BOT_Y - 36], q1 = [B.x, FY1 + 22];
    return { A, B, p0, p1, p2, q0, q1, q2 };
  }
  function step3(c, s) {
    const u = s.u, k = s.k, t = s.t;
    /* 列名 */
    TL(c, k, [L('初級能源', 'Primary'), L('（直接取得）', 'energy')], 80, TOP_Y - 14, SUN, 22, 30);
    TL(c, k * seg(u, 1.2, 1.6), [L('次級能源', 'Secondary'), L('（加工得到）', 'energy')], 80, BOT_Y - 14, ELEC, 22, 30);
    withA(c, k * 0.5, () => {
      c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 1.5; c.setLineDash([4, 6]);
      c.beginPath(); c.moveTo(150, TOP_Y + 66); c.lineTo(940, TOP_Y + 66); c.moveTo(150, BOT_Y - 64); c.lineTo(940, BOT_Y - 64); c.stroke(); c.setLineDash([]);
    });

    /* 路線（先畫，圖示與工廠蓋在上面） */
    ROUTES.forEach((r, i) => {
      const G = routeGeom(r), rv = ease(seg(u, r[2], r[2] + 1.0)), main = r[3];
      if (rv <= 0) return;
      const r1 = clamp01(rv * 2), r2 = clamp01(rv * 2 - 1);
      c.save(); c.globalAlpha *= k * (main ? 1 : 0.6);
      c.lineWidth = main ? 4 : 2.5; c.lineCap = 'round';
      if (!main) c.setLineDash([6, 6]);
      c.strokeStyle = G.A.col; qcurve(c, G.p0, G.p1, G.p2, r1); c.stroke();
      if (r1 >= 1) headAt(c, G.p0, G.p1, G.p2, G.A.col, 11);
      if (r2 > 0) { c.strokeStyle = G.B.col; qcurve(c, G.q0, G.q1, G.q2, r2); c.stroke(); }
      c.setLineDash([]);
      if (r2 >= 1) headAt(c, G.q0, G.q1, G.q2, G.B.col, 13);
      c.restore();
      /* 流動的小點：進工廠前是原料色、出工廠後是產物色 */
      if (main && rv >= 1) {
        for (let j = 0; j < 3; j++) {
          const ph = (t * 0.45 + j / 3 + hash(i) * 0.3) % 1;
          const q = ph < 0.5 ? qpt(G.p0, G.p1, G.p2, ph * 2) : qpt(G.q0, G.q1, G.q2, ph * 2 - 1);
          const col = ph < 0.5 ? G.A.col : G.B.col;
          c.save(); c.globalAlpha *= k; W5.glow(c, q.x, q.y, 11, col, 0.6);
          c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(q.x, q.y, 3.2, 0, TAU); c.fill(); c.restore();
        }
      }
    });

    /* 上排：初級能源 */
    Object.keys(PRIM).forEach((key, i) => {
      const I = PRIM[key], a = k * seg(u, 0.3 + i * 0.2, 0.7 + i * 0.2);
      withA(c, a, () => { badge(c, I.x, TOP_Y, 34, I.col, key === 'sun' ? 0.6 : 0); I.f(c, I.x, TOP_Y, 25, t); });
      T(c, a, L(I.zh, I.en), I.x, TOP_Y + 50, I.col, 20);
    });

    /* 工廠：加工轉換 */
    const fa = k * seg(u, 1.0, 1.4);
    withA(c, fa, () => {
      const busy = seg(u, 2.0, 2.6);
      if (busy > 0) W5.glow(c, FX, (FY0 + FY1) / 2, 90, SUN, 0.18 * busy);
      /* 煙囪與煙 */
      [[FX + 22, 14], [FX + 40, 14]].forEach(([x0, w], j) => {
        c.fillStyle = '#6d7b76'; c.fillRect(x0, FY0 - 26, w, 28);
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.5 + i / 3 + j * 0.17) % 1;
          c.save(); c.globalAlpha *= Math.sin(ph * Math.PI) * 0.5 * busy;
          c.fillStyle = '#b7c7c1'; c.beginPath(); c.arc(x0 + w / 2 + ph * 16, FY0 - 30 - ph * 8, 3 + ph * 5, 0, TAU); c.fill(); c.restore();
        }
      });
      c.fillStyle = '#2b4a40'; c.beginPath();
      c.moveTo(FX - 52, FY1); c.lineTo(FX - 52, FY0 + 10);
      c.lineTo(FX - 26, FY0); c.lineTo(FX - 26, FY0 + 10); c.lineTo(FX, FY0); c.lineTo(FX, FY0 + 10); c.lineTo(FX + 52, FY0 + 10); c.lineTo(FX + 52, FY1); c.closePath(); c.fill();
      c.strokeStyle = LINE; c.lineWidth = 2.5; c.stroke();
      /* 齒輪 */
      const gx = FX + 22, gy = FY0 + 31, ang = t * 1.6 * (0.3 + busy);
      c.save(); c.translate(gx, gy); c.rotate(ang); c.fillStyle = SUN;
      for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * TAU / 8); c.fillRect(-3, -15, 6, 6); c.restore(); }
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.fillStyle = '#2b4a40'; c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,224,102,0.5)'; c.fillRect(FX - 40, FY0 + 22, 14, 12); c.fillRect(FX - 20, FY0 + 22, 14, 12);
    });
    T(c, fa, L('加工轉換', 'Processing'), FX - 64, (FY0 + FY1) / 2 + 2, WHITE, 22, 'right');

    /* 下排：次級能源 */
    Object.keys(SEC).forEach((key, i) => {
      const I = SEC[key], a = k * seg(u, 1.4 + i * 0.15, 1.8 + i * 0.15);
      const lit = key === 'elec' ? seg(u, 5.0, 5.4) : seg(u, 2.9 + i * 0.35, 3.3 + i * 0.35);
      withA(c, a, () => { badge(c, I.x, BOT_Y, 34, I.col, lit); I.f(c, I.x, BOT_Y, 24, t); });
      T(c, a, L(I.zh, I.en), I.x, BOT_Y + 50, I.col, 20);
    });
  }

  /* ═════════════════ 第 4 步：能源的源頭 ═════════════════ */
  const SX = 370, SY = 250, SR = 60;
  const TARGETS = [
    { key: 'fossil', x: 150, y: 345, col: NON, at: 0.9, zh: '化石燃料（古代生物）', en: 'Fossil fuels (ancient life)' },
    { key: 'wind', x: 150, y: 140, col: REN, at: 1.9, zh: '風', en: 'Wind' },
    { key: 'water', x: 630, y: 140, lx: 662, col: REN, at: 2.9, zh: '水循環（雲、雨）', en: 'Water cycle (clouds, rain)' },
    { key: 'bio', x: 630, y: 345, col: REN, at: 3.9, zh: '生質（植物）', en: 'Biomass (plants)' }
  ];
  function drawFossil(c, x, y, R, t) {
    c.save(); clipCircle(c, x, y, R * 1.05);
    const bands = ['#7a5a3c', '#5e4630', '#8a6a48', '#4a3828'];
    bands.forEach((b, i) => { c.fillStyle = b; c.fillRect(x - R * 1.1, y - R * 1.1 + i * R * 0.55, R * 2.2, R * 0.56); });
    c.restore();
    /* 蕨類化石 */
    c.save(); c.strokeStyle = '#d9c7a3'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - R * 0.6, y + R * 0.1); c.quadraticCurveTo(x - R * 0.1, y - R * 0.35, x + R * 0.5, y - R * 0.45); c.stroke();
    for (let i = 1; i < 7; i++) {
      const q = qpt([x - R * 0.6, y + R * 0.1], [x - R * 0.1, y - R * 0.35], [x + R * 0.5, y - R * 0.45], i / 7), l = R * 0.22 * (1 - i / 9);
      c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - l * 0.3, q.y - l); c.moveTo(q.x, q.y); c.lineTo(q.x + l * 0.5, q.y + l * 0.8); c.stroke();
    }
    c.restore();
    iconCoal(c, x - R * 0.35, y + R * 0.55, R * 0.45);
    iconBarrel(c, x + R * 0.45, y + R * 0.45, R * 0.42);
  }
  function drawWater(c, x, y, R, t) {
    c.save(); clipCircle(c, x, y, R * 1.05);
    c.fillStyle = 'rgba(90,184,232,0.8)'; c.beginPath(); c.moveTo(x - R * 1.1, y + R * 1.2);
    for (let i = 0; i <= 20; i++) { const px = x - R * 1.1 + i / 20 * R * 2.2; c.lineTo(px, y + R * 0.6 + Math.sin(px * 0.12 - t * 2) * 3); }
    c.lineTo(x + R * 1.1, y + R * 1.2); c.closePath(); c.fill();
    /* 雨 */
    c.strokeStyle = WATER; c.lineWidth = 2.5; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const ph = (t * 1.2 + hash(i + 5)) % 1, px = x - R * 0.55 + i * R * 0.13, py = y - R * 0.15 + ph * R * 0.7;
      c.globalAlpha = 1 - ph * 0.6; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 2, py + 9); c.stroke();
    }
    c.globalAlpha = 1;
    c.restore();
    /* 蒸發（往上的波浪箭頭） */
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.6 + i * 0.5) % 1, px = x + R * 0.45 + i * R * 0.18, py = y + R * 0.5 - ph * R * 0.75;
      c.save(); c.globalAlpha *= Math.sin(ph * Math.PI);
      c.strokeStyle = '#e8f1f4'; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py + 12); c.quadraticCurveTo(px + 5, py + 6, px, py); c.stroke();
      c.restore();
    }
    /* 雲 */
    c.fillStyle = '#eef3f1';
    [[-0.5, -0.38, 0.26], [-0.22, -0.52, 0.32], [0.08, -0.4, 0.26], [-0.25, -0.3, 0.26]].forEach(([dx, dy, r]) => {
      c.beginPath(); c.arc(x + dx * R, y + dy * R, r * R, 0, TAU); c.fill();
    });
  }
  function step4(c, s) {
    const u = s.u, k = s.k, t = s.t;
    /* 光線：太陽 → 每個目標 */
    TARGETS.forEach(G => {
      const rv = ease(seg(u, G.at, G.at + 0.7));
      if (rv <= 0) return;
      const an = Math.atan2(G.y - SY, G.x - SX);
      const x0 = SX + Math.cos(an) * (SR + 8), y0 = SY + Math.sin(an) * (SR + 8);
      const x1 = G.x - Math.cos(an) * 56, y1 = G.y - Math.sin(an) * 56;
      const xe = lerp(x0, x1, rv), ye = lerp(y0, y1, rv);
      c.save(); c.globalAlpha *= k;
      c.strokeStyle = 'rgba(255,224,102,0.28)'; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(xe, ye); c.stroke();
      c.strokeStyle = SUN; c.lineWidth = 4; c.setLineDash([14, 10]); c.lineDashOffset = -t * 50;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
      if (rv >= 1) W5.arrow(c, lerp(x0, x1, 0.9), lerp(y0, y1, 0.9), x1, y1, SUN, 4, 14);
      c.restore();
    });
    /* 大太陽 */
    withA(c, k, () => iconSun(c, SX, SY, SR * 1.55, t));
    /* 目標：被照亮前是暗的 */
    TARGETS.forEach(G => {
      const lit = seg(u, G.at + 0.6, G.at + 1.0), a = k * (0.32 + 0.68 * lit);
      withA(c, a, () => {
        badge(c, G.x, G.y, 48, G.col, lit);
        if (G.key === 'fossil') drawFossil(c, G.x, G.y, 40, t);
        else if (G.key === 'wind') iconWind(c, G.x, G.y, 38, t);
        else if (G.key === 'water') drawWater(c, G.x, G.y, 40, t);
        else iconPlant(c, G.x, G.y + 2, 38, t);
      });
      T(c, k * lit, L(G.zh, G.en), G.lx || G.x, G.y + 70, G.col, 20);
    });
    P(c, k * seg(u, 4.8, 5.2), L('絕大部分來自太陽', 'Mostly from the Sun'), SX, 374, SUN, 22);

    /* 右下角：不是來自太陽的一小部分 */
    const ba = k * seg(u, 5.4, 5.9);
    withA(c, ba, () => {
      c.fillStyle = 'rgba(11,26,21,0.86)'; W5.rr(c, 740, 244, 206, 208, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 2; c.stroke();
      const px = 843, py = 282, pr = 28, small = 0.1 * ease(seg(u, 5.6, 6.4));
      const a0 = -Math.PI / 2;
      c.fillStyle = SUN; c.beginPath(); c.moveTo(px, py); c.arc(px, py, pr, a0 + small * TAU, a0 + TAU); c.closePath(); c.fill();
      if (small > 0) { c.fillStyle = PINK; c.beginPath(); c.moveTo(px, py); c.arc(px, py, pr + 3, a0, a0 + small * TAU); c.closePath(); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.stroke();
    });
    const pinkL = L('核能、地熱、潮汐', 'Nuclear,\ngeothermal, tidal:').split('\n');
    const whiteL = L('只占一小部分\n不是來自太陽', 'a small part,\nnot from the Sun').split('\n');
    TL(c, ba, pinkL, 843, 334, PINK, 20, 26);
    TL(c, ba, whiteL, 843, 342 + pinkL.length * 26, WHITE, 20, 26);
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['生活處處要能源', 'Energy is everywhere in daily life'],
      sub: ['騎車、煮飯、照明、開車……生活處處都要用到能量', 'Riding, cooking, lighting, driving: we use energy all day long.'],
      con: ['電、瓦斯、汽油都能提供能量，它們都是「能源」', 'Electricity, gas and gasoline all supply energy: they are energy sources.'] },
    { title: ['用得完 vs 用不完', 'Runs out vs. renewable'],
      sub: ['煤、石油、天然氣、核燃料存量有限，用完很難再生', 'Coal, oil, natural gas and nuclear fuel are limited and hard to replace.'],
      con: ['太陽、風、水、潮汐、地熱、生質能可以不斷循環利用', 'Sun, wind, water, tides, geothermal heat and biomass keep coming back.'] },
    { title: ['天然的與加工的', 'Natural vs. processed'],
      sub: ['直接從自然取得的是初級能源；加工轉換得到的是次級能源', 'Primary energy comes straight from nature; processed energy is secondary.'],
      con: ['例：原油 → 汽油、柴油；煤、天然氣 → 電', 'e.g. crude oil → gasoline, diesel; coal, natural gas → electricity'] },
    { title: ['能源的源頭', 'Where energy comes from'],
      sub: ['陽光帶動風和雨、讓植物生長，古代生物也變成了化石燃料', 'Sunlight drives wind and rain, grows plants, and made fossil fuels long ago.'],
      con: ['結論：絕大部分能源來自太陽；核能、地熱、潮汐例外', 'Most energy traces back to the Sun; nuclear, geothermal and tidal do not.'] }
  ];

  W5.register('classify', {
    canvas: 'cvs-classify',
    steps: DUR,
    draw(c, s) {
      const n = s.n, u = s.u, k = s.k;
      if (n === 1) step1(c, s);
      else if (n === 2) step2(c, s);
      else if (n === 3) step3(c, s);
      else step4(c, s);

      const X = TXT[n - 1];
      const tp = P(c, k, L(X.title[0], X.title[1]), 480, 52, WHITE, 24);
      if (n === 3 && tp) P(c, k, L('補充', 'Extra'), tp.x + tp.w + 12, 52, PINK, 20, 'left');
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), REN);
    }
  });
})();
