/* ==================================================================
   work_5 ｜ 台灣與新興能源（cvs-newtech，960×540）
   五步：1 離岸風電 vs 陸域風電 → 2 太陽能（屋頂、魚塭、水庫）與黑潮
        → 3 氫燃料電池車 → 4 油電混合車與純電動車 → 5 太陽能飛機
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 solar／hydrowind／thermal 一致）：能量／太陽／電＝黃 ENE、熱＝橘紅 HEAT、
   水＝藍 WATER、風＝淡青白 WIND、再生能源＝綠 REN #33cc99、限制／缺點＝橘 CAUTION。
   純函式：所有畫面都由 s 算出；轉角、路面位移都用解析積分，跳步驟不走樣；
   亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；畫布字 ≥ 20px；
   畫布頂端 0～30px 留給進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。只講科學與事實。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量／太陽／電：黃 */
  const HEAT = '#ff6a3d';            /* 熱、引擎燃燒：橘紅 */
  const WATER = '#5ab8e8';           /* 水：藍 */
  const WIND = '#d8f3f0';            /* 風、空氣：淡青白 */
  const VAPOR = '#e8f1f4';           /* 水蒸氣 */
  const H2C = '#a5e4ff';             /* 氫氣 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const CAUTION = '#fb923c';
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const GROUND = '#2c4a3a', GROUND_EDGE = '#5f8a6c';
  const CELL = '#1f4f8c', CELL_HI = '#3a78c2', CELL_LINE = '#9cc3ea';
  const DUR = [8, 8, 8, 8, 8];       /* 總長 40 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), Bc = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, Bc[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }

  /* ── 文字（同 hydrowind／solar） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
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
  function TW(c, a, str, x, y, col, size, maxW, lh, align) {
    const lines = wrap(c, str, size, maxW);
    lines.forEach((l, i) => T(c, a, l, x, y + i * lh, col, size, align));
    return lines.length;
  }
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
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  /* ── 路徑工具（同 hydrowind） ── */
  function mkPath(pts) {
    const Pp = pts.map(p => ({ x: p[0], y: p[1] })), cum = [0];
    for (let i = 1; i < Pp.length; i++) cum.push(cum[i - 1] + Math.hypot(Pp[i].x - Pp[i - 1].x, Pp[i].y - Pp[i - 1].y));
    return { P: Pp, cum, len: cum[cum.length - 1] };
  }
  function at(path, d) {
    d = Math.max(0, Math.min(path.len, d));
    const Pp = path.P, cum = path.cum;
    for (let i = 1; i < Pp.length; i++) {
      if (d <= cum[i]) { const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return { x: lerp(Pp[i - 1].x, Pp[i].x, f), y: lerp(Pp[i - 1].y, Pp[i].y, f) }; }
    }
    const n = Pp.length - 1; return { x: Pp[n].x, y: Pp[n].y };
  }
  function subPath(c, path, d0, d1) {
    c.beginPath(); const a = at(path, d0); c.moveTo(a.x, a.y);
    for (let i = 1; i < path.P.length; i++) if (path.cum[i] > d0 && path.cum[i] < d1) c.lineTo(path.P[i].x, path.P[i].y);
    const b = at(path, d1); c.lineTo(b.x, b.y);
  }
  function pipe(c, path, w) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    subPath(c, path, 0, path.len);
    c.strokeStyle = '#6d817a'; c.lineWidth = w + 4; c.stroke();
    c.strokeStyle = EMPTY; c.lineWidth = w; c.stroke();
    c.restore();
  }
  /* 沿路徑流動的虛線段；off 越大越往前；reverse＝反向流 */
  function flow(c, path, col, off, gap, dash, w, a, reverse) {
    if (a != null && a <= 0.02) return;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const o = reverse ? -off : off, s0 = ((o % gap) + gap) % gap;
    for (let d = s0 - gap; d < path.len; d += gap) {
      const p = Math.max(0, d), q = Math.min(path.len, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
    }
    c.restore();
  }
  /* 沿路徑流動的小球（氣體分子、水滴） */
  function dots(c, path, col, off, gap, r, a, seed) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0, i = 0; d < path.len; d += gap, i++) {
      const p = at(path, d), j = (hash(seed + i) - 0.5) * 6;
      W5.ball(c, p.x, p.y + j, r, col);
    }
    c.restore();
  }

  /* ── 共用小零件 ── */
  function sun(c, x, y, R, t, a) {
    withA(c, a, () => {
      W5.glow(c, x, y, R * 2.1, ENE, 0.45);
      c.save(); c.strokeStyle = ENE; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const an = i * TAU / 12 + t * 0.25, r0 = R * 1.22, r1 = R * (1.5 + 0.08 * Math.sin(t * 3 + i));
        c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.stroke();
      }
      c.restore();
      const g = c.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
      g.addColorStop(0, '#fff7c2'); g.addColorStop(0.55, ENE); g.addColorStop(1, '#f2b400');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    });
  }
  function cloud(c, x, y, w, a, col) {
    if (a <= 0.02 || w <= 1) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = col || '#e6eeec';
    const r = w * 0.22;
    c.beginPath();
    c.arc(x - w * 0.28, y + r * 0.25, r * 0.95, 0, TAU);
    c.arc(x - w * 0.05, y - r * 0.35, r * 1.25, 0, TAU);
    c.arc(x + w * 0.24, y - r * 0.05, r * 1.05, 0, TAU);
    c.arc(x + w * 0.4, y + r * 0.35, r * 0.75, 0, TAU);
    c.rect(x - w * 0.42, y + r * 0.1, w * 0.84, r * 1.05);
    c.fill();
    c.restore();
  }
  function puff(c, x, y, r, col, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.7, y + r * 0.2, r * 0.75, 0, TAU); c.arc(x - r * 0.6, y + r * 0.25, r * 0.65, 0, TAU); c.fill();
    c.restore();
  }
  /* 平行四邊形太陽能板（同 solar）：bl→br 底邊、往 (dx,dy) 斜上 */
  function panelQuad(c, bl, br, dx, dy, cols, rows, lit) {
    const p = (fu, fv) => [lerp(bl[0], br[0], fu) + dx * fv, lerp(bl[1], br[1], fu) + dy * fv];
    c.fillStyle = '#0f1c2c';
    c.beginPath(); [p(0, 0), p(1, 0), p(1, 1), p(0, 1)].forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill();
    const gu = 0.02, gv = 0.04;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const u0 = i / cols + gu, u1 = (i + 1) / cols - gu, v0 = j / rows + gv, v1 = (j + 1) / rows - gv;
      const q = [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)];
      c.fillStyle = mixHex(CELL, CELL_HI, 0.25 + 0.35 * hash(i * 7 + j * 13 + 900) + 0.3 * lit);
      c.beginPath(); q.forEach((r, m) => m ? c.lineTo(r[0], r[1]) : c.moveTo(r[0], r[1])); c.closePath(); c.fill();
      c.strokeStyle = W5.rgba(CELL_LINE, 0.55); c.lineWidth = 1; c.stroke();
    }
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath(); [p(0, 0), p(1, 0), p(1, 1), p(0, 1)].forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke();
    return p;
  }
  /* 角速度平滑上升的轉角（解析積分，同 solar） */
  function spin(u, R0, RD, OM) {
    if (u <= R0) return 0;
    const x = (u - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (u - R0 - RD));
  }
  function chain(c, k, u, items, ats, y, x0, sz, gap) {
    sz = sz || 22; gap = gap || 44;
    const ws = items.map(p => W5.tw(c, L(p[0], p[1]), sz) + 28);
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let x = x0 == null ? 480 - tot / 2 : x0;
    items.forEach((p, i) => {
      const on = seg(u, ats[i], ats[i] + 0.5), col = p[2] || ENE;
      const cx = x + ws[i] / 2;
      if (on > 0.02) withA(c, k * on, () => W5.glow(c, cx, y, ws[i] * 0.6, col, 0.3));
      P(c, k, L(p[0], p[1]), cx, y, mixHex('#6f7f78', col, on), sz);
      if (i < items.length - 1) {
        const nx = seg(u, ats[i + 1], ats[i + 1] + 0.5), ncol = items[i + 1][2] || ENE;
        withA(c, k, () => W5.arrow(c, x + ws[i] + 8, y, x + ws[i] + gap - 8, y, mixHex('#6f7f78', ncol, nx), 3.5, 11));
      }
      x += ws[i] + gap;
    });
    return tot;
  }
  /* 橫向長條（同 solar hbar） */
  function hbar(c, x, y, w, h, f, col) {
    c.fillStyle = INK; W5.rr(c, x, y - h / 2, w, h, h / 2); c.fill();
    if (f > 0.005) {
      c.save(); W5.rr(c, x, y - h / 2, w, h, h / 2); c.clip();
      c.fillStyle = col; c.fillRect(x, y - h / 2, w * clamp01(f), h); c.restore();
    }
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5; W5.rr(c, x, y - h / 2, w, h, h / 2); c.stroke();
  }
  /* 直立電池（填充＝能量黃） */
  function battery(c, x, y, w, h, f, glowA) {
    if (glowA > 0.02) W5.glow(c, x + w / 2, y + h / 2, Math.max(w, h) * 0.8, ENE, 0.35 * glowA);
    c.fillStyle = '#c9d4d1'; W5.rr(c, x + w * 0.32, y - 7, w * 0.36, 9, 3); c.fill();
    c.fillStyle = INK; W5.rr(c, x, y, w, h, 8); c.fill();
    const ih = (h - 10) * clamp01(f);
    if (ih > 0.5) { c.fillStyle = ENE; W5.rr(c, x + 5, y + h - 5 - ih, w - 10, ih, 4); c.fill(); }
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 3; W5.rr(c, x, y, w, h, 8); c.stroke();
  }
  /* 橫放電池（車上）：填充由左到右 */
  function batteryH(c, x, y, w, h, f, glowA) {
    if (glowA > 0.02) W5.glow(c, x + w / 2, y + h / 2, w * 0.6, ENE, 0.35 * glowA);
    c.fillStyle = INK; W5.rr(c, x, y, w, h, 5); c.fill();
    const iw = (w - 8) * clamp01(f);
    if (iw > 0.5) { c.fillStyle = ENE; W5.rr(c, x + 4, y + 4, iw, h - 8, 3); c.fill(); }
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 2.5; W5.rr(c, x, y, w, h, 5); c.stroke();
    c.fillStyle = '#c9d4d1'; c.fillRect(x + w, y + h * 0.3, 4, h * 0.4);
  }
  function wheel(c, x, y, R, th) {
    c.fillStyle = '#26302d'; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    c.strokeStyle = '#4b5a55'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#9aa8a3'; c.beginPath(); c.arc(x, y, R * 0.55, 0, TAU); c.fill();
    c.strokeStyle = '#26302d'; c.lineWidth = Math.max(2, R * 0.12); c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const an = th + i * TAU / 5;
      c.beginPath(); c.moveTo(x + Math.cos(an) * R * 0.14, y + Math.sin(an) * R * 0.14); c.lineTo(x + Math.cos(an) * R * 0.5, y + Math.sin(an) * R * 0.5); c.stroke();
    }
    c.fillStyle = '#5b6a65'; c.beginPath(); c.arc(x, y, R * 0.14, 0, TAU); c.fill();
  }
  /* 馬達：圓筒＋轉動的線圈記號 */
  function motor(c, x, y, R, th, lit) {
    if (lit > 0.02) W5.glow(c, x, y, R * 2, ENE, 0.4 * lit);
    c.fillStyle = '#3c4d47'; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = mixHex('#c27a3a', ENE, lit); c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const an = th + i * TAU / 3;
      c.beginPath(); c.moveTo(x + Math.cos(an) * R * 0.25, y + Math.sin(an) * R * 0.25); c.lineTo(x + Math.cos(an) * R * 0.75, y + Math.sin(an) * R * 0.75); c.stroke();
    }
    c.fillStyle = '#c9d4d1'; c.beginPath(); c.arc(x, y, R * 0.18, 0, TAU); c.fill();
  }
  /* 側視車身（朝右）。g＝{x, y, s} 把原始座標（長 150～830）縮放到畫布 */
  const CAR = [[150, 338], [150, 286], [186, 262], [282, 252], [338, 194], [374, 184], [552, 182], [598, 192], [668, 248], [790, 262], [826, 288], [828, 338]];
  function carBody(c, g, a) {
    const X = v => g.x + (v - 150) * g.s, Y = v => g.y + (v - 180) * g.s;
    c.save(); c.globalAlpha *= a;
    c.beginPath(); CAR.forEach((p, i) => i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))); c.closePath();
    c.fillStyle = 'rgba(34,49,45,0.92)'; c.fill();
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    /* 車窗（淡） */
    c.fillStyle = 'rgba(114,185,255,0.12)'; c.beginPath();
    c.moveTo(X(350), Y(200)); c.lineTo(X(380), Y(196)); c.lineTo(X(548), Y(194)); c.lineTo(X(590), Y(204)); c.lineTo(X(640), Y(246)); c.lineTo(X(312), Y(248)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(201,212,209,0.45)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(X(470), Y(196)); c.lineTo(X(470), Y(248)); c.stroke();
    c.restore();
    return { X, Y };
  }

  /* ═════════════════ 第 1 步：陸域風電 vs 離岸風電 ═════════════════ */
  const GY1 = 262;
  const SIDE = [{ x0: 24, x1: 468 }, { x0: 492, x1: 936 }];
  /* 風速（0～1）：陸域慢而起伏大；離岸快而穩。iX＝解析積分（給轉角、風線位移用） */
  const VL = [0.36, [0.16, 1.3, 0.4], [0.11, 2.9, 1.7], [0.07, 5.3, 2.2]];
  const VS = [0.80, [0.05, 1.1, 0.9], [0.03, 2.3, 0.2]];
  const vf = (V, t) => V.slice(1).reduce((a, q) => a + q[0] * Math.sin(q[1] * t + q[2]), V[0]);
  const vi = (V, t) => V.slice(1).reduce((a, q) => a - q[0] / q[1] * (Math.cos(q[1] * t + q[2]) - Math.cos(q[2])), V[0] * t);
  function turbine(c, x, hubY, baseY, R, th, glowA, sea) {
    const tw0 = Math.max(2, R * 0.05), tw1 = Math.max(4, R * 0.1);
    c.fillStyle = '#c9d4d1'; c.beginPath();
    c.moveTo(x - tw0, hubY); c.lineTo(x + tw0, hubY); c.lineTo(x + tw1, baseY); c.lineTo(x - tw1, baseY); c.closePath(); c.fill();
    if (sea) { c.fillStyle = '#e8c547'; c.fillRect(x - tw1 - 3, baseY - 14, (tw1 + 3) * 2, 14); }
    if (glowA > 0.02) W5.glow(c, x, hubY, R * 0.5, ENE, 0.6 * glowA);
    c.fillStyle = '#dfe8e4'; W5.rr(c, x - R * 0.1, hubY - R * 0.11, R * 0.34, R * 0.22, 4); c.fill();
    for (let j = 0; j < 3; j++) {
      c.save(); c.translate(x, hubY); c.rotate(th + j * TAU / 3);
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(0, -R * 0.06);
      c.quadraticCurveTo(R * 0.4, -R * 0.13, R, -R * 0.02); c.lineTo(R, R * 0.02); c.quadraticCurveTo(R * 0.4, R * 0.06, 0, R * 0.06); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = METAL; c.beginPath(); c.arc(x, hubY, R * 0.09, 0, TAU); c.fill();
  }
  function tree(c, x, y, h) {
    c.fillStyle = '#5a4632'; c.fillRect(x - 3, y - h * 0.35, 6, h * 0.35);
    c.fillStyle = '#3f7a52'; c.beginPath(); c.arc(x, y - h * 0.62, h * 0.3, 0, TAU); c.arc(x - h * 0.18, y - h * 0.45, h * 0.22, 0, TAU); c.arc(x + h * 0.18, y - h * 0.45, h * 0.22, 0, TAU); c.fill();
  }
  function house(c, x, y, w, h) {
    c.fillStyle = '#b9a58a'; c.fillRect(x, y - h, w, h);
    c.fillStyle = '#9c4f3a'; c.beginPath(); c.moveTo(x - 6, y - h); c.lineTo(x + w / 2, y - h - h * 0.62); c.lineTo(x + w + 6, y - h); c.closePath(); c.fill();
    c.fillStyle = '#ffe9a8'; c.fillRect(x + w * 0.2, y - h * 0.7, w * 0.22, h * 0.3); c.fillRect(x + w * 0.58, y - h * 0.7, w * 0.22, h * 0.3);
  }
  function step1(c, s) {
    const u = s.u, k = s.k;
    const ramp = seg(u, 0.3, 1.2);
    const dL = vi(VL, u) * ramp, dS = vi(VS, u) * ramp;
    const elec = seg(u, 1.2, 1.8);

    withA(c, k, () => {
      /* 中線 */
      c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2; c.setLineDash([8, 8]);
      c.beginPath(); c.moveTo(480, 82); c.lineTo(480, 436); c.stroke(); c.setLineDash([]);

      /* ── 陸域 ── */
      const A = SIDE[0];
      c.fillStyle = GROUND; c.fillRect(A.x0, GY1, A.x1 - A.x0, 14);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(A.x0, GY1); c.lineTo(A.x1, GY1); c.stroke();
      /* 風線：高處的穿過、低處的被樹與建物擋住（走到樹前就散掉）；彎曲＝亂流 */
      c.lineCap = 'round';
      for (let i = 0; i < 11; i++) {
        const y0 = 168 + i * 9, low = y0 > 205, span = A.x1 - A.x0;
        const sp = 120 + 40 * hash(i + 30);
        let x = A.x0 + ((((dL * sp + hash(i + 40) * span) % span) + span) % span);
        const len = 26 + 44 * vf(VL, u);
        const xEnd = low ? 92 : A.x1;
        if (x > xEnd) continue;
        const fade = low ? clamp01((xEnd - x) / 40) : 1;
        c.strokeStyle = W5.rgba(WIND, (0.25 + 0.45 * vf(VL, u)) * fade); c.lineWidth = 2.5;
        c.beginPath();
        for (let q = 0; q <= len; q += 4) {
          const xx = Math.min(x + q, xEnd), yy = y0 + (low ? 6 : 4 + (xx > 100 && xx < 260 ? 5 : 0)) * Math.sin(xx * 0.06 + i + u * 3);
          if (q === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
      }
      tree(c, 112, GY1, 78); tree(c, 146, GY1, 64);
      c.fillStyle = '#56645f'; c.fillRect(170, 206, 40, GY1 - 206); c.fillStyle = '#6b7a74'; c.fillRect(214, 226, 34, GY1 - 226);
      c.fillStyle = 'rgba(255,233,168,0.7)';
      for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) c.fillRect(176 + q * 18, 214 + r * 11, 8, 6);
      turbine(c, 320, 200, GY1, 40, 1.2 + 5.5 * dL, elec * vf(VL, u), false);
      house(c, 396, GY1, 50, 24);
      /* 低頻噪音：從風車往房子擴散的弧 */
      const na = seg(u, 2.0, 2.5);
      for (let j = 0; j < 3; j++) {
        const ph = ((u * 0.9 + j / 3) % 1);
        withA(c, na * (1 - ph), () => {
          c.strokeStyle = CAUTION; c.lineWidth = 2.5;
          c.beginPath(); c.arc(330, 214, 16 + ph * 52, -0.5, 0.75); c.stroke();
        });
      }

      /* ── 離岸 ── */
      const B = SIDE[1];
      /* 風線：平直、較快、較長、較亮 */
      for (let i = 0; i < 12; i++) {
        const y0 = 160 + i * 8.5, span = B.x1 - B.x0;
        const sp = 140 + 30 * hash(i + 60);
        const x = B.x0 + ((((dS * sp + hash(i + 70) * span) % span) + span) % span);
        const len = 50 + 50 * vf(VS, u);
        c.strokeStyle = W5.rgba(WIND, 0.3 + 0.45 * vf(VS, u)); c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x, y0); c.lineTo(Math.min(x + len, B.x1), y0); c.stroke();
      }
      turbine(c, 640, 206, GY1 + 12, 34, 0.4 + 5.5 * dS * 1.3, elec * 0.8, true);
      turbine(c, 862, 172, GY1 + 12, 60, 2.0 + 5.5 * dS * 0.75, elec, true);
      /* 海 */
      c.fillStyle = 'rgba(40,110,160,0.55)'; c.fillRect(B.x0, GY1, B.x1 - B.x0, 20);
      c.strokeStyle = W5.rgba(WATER, 0.9); c.lineWidth = 2.5; c.beginPath();
      for (let x = B.x0; x <= B.x1; x += 4) { const y = GY1 + 2 * Math.sin(x * 0.07 - u * 2.5); if (x === B.x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    });

    /* 標題與標示 */
    P(c, k, L('陸域風電', 'Onshore wind'), 246, 96, WHITE, 22);
    P(c, k, L('離岸風電', 'Offshore wind'), 690, 96, WHITE, 22);
    T(c, k * seg(u, 0.8, 1.3), L('樹與建物擋風', 'Trees, buildings block wind'), 30, 138, WIND, 20, 'left');
    T(c, k * seg(u, 0.8, 1.3), L('海面平坦、阻擋少', 'Flat sea, little in the way'), 500, 138, WIND, 20, 'left');
    const tg = [
      [0, 0, '離住家近 → 低頻噪音', 'Near homes → low-frequency noise', CAUTION, 2.1],
      [0, 1, '土地受限、風車較小', 'Limited land, smaller turbines', CAUTION, 2.6],
      [1, 0, '風速較快較穩、發電時數長', 'Faster, steadier wind; more hours', REN, 2.1],
      [1, 1, '成本與維護較高', 'Higher cost and upkeep', CAUTION, 2.6]
    ];
    tg.forEach(g => P(c, k * seg(u, g[5], g[5] + 0.4), L(g[2], g[3]), SIDE[g[0]].x0 + 8, 303 + g[1] * 39, g[4], 20, 'left'));

    /* 下方：風速曲線＋年發電量 */
    const ca = k * seg(u, 3.0, 3.5), grow = ease(seg(u, 3.4, 4.6));
    SIDE.forEach((S, i) => {
      const V = i ? VS : VL, bx = S.x0 + 4, bw = S.x1 - S.x0 - 8;
      withA(c, ca, () => {
        c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, bx, 364, bw, 76, 10); c.fill();
        c.strokeStyle = W5.rgba(WIND, 0.35); c.lineWidth = 1.5; c.stroke();
        const x0 = bx + 12, x1 = bx + 252, y0 = 394, y1 = 434;
        c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = WIND; c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath();
        for (let px = 0; px <= x1 - x0 - 6; px += 2) {
          const tt = u - (1 - px / (x1 - x0 - 6)) * 6, y = y1 - 3 - (y1 - y0 - 4) * vf(V, tt);
          if (px === 0) c.moveTo(x0 + px, y); else c.lineTo(x0 + px, y);
        }
        c.stroke();
        const yN = y1 - 3 - (y1 - y0 - 4) * vf(V, u);
        c.fillStyle = WHITE; c.beginPath(); c.arc(x1 - 6, yN, 4, 0, TAU); c.fill();
        hbar(c, bx + 272, 418, 150, 18, grow * (i ? 1 : 0.32), ENE);
      });
      T(c, ca, L('風速', 'Wind speed'), bx + 14, 380, WIND, 20, 'left');
      T(c, ca, L('年發電量', 'Yearly output'), bx + 272, 380, ENE, 20, 'left');
    });
  }

  /* ═════════════════ 第 2 步：太陽能三種裝法＋黑潮 ═════════════════ */
  const GY2 = 300;
  /* 簡化的島形（不求精準）：南北長、北寬南尖 */
  const ISLE = [[716, 118], [744, 128], [764, 152], [766, 190], [760, 236], [752, 282], [738, 330], [718, 376], [702, 396], [690, 372], [674, 330], [660, 286], [654, 238], [662, 186], [680, 148], [696, 126]];
  const KURO = mkPath([[812, 432], [800, 360], [790, 280], [782, 200], [770, 130], [754, 96]]);
  function step2(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const lit = seg(u, 1.0, 1.8);

    withA(c, k, () => {
      c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2; c.setLineDash([8, 8]);
      c.beginPath(); c.moveTo(612, 82); c.lineTo(612, 436); c.stroke(); c.setLineDash([]);
      c.fillStyle = GROUND; c.fillRect(24, GY2, 570, 12);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(24, GY2); c.lineTo(594, GY2); c.stroke();
    });
    sun(c, 300, 112, 22, t, k);
    /* 陽光：三道光射向三種板子 */
    const TG = [[110, 222], [300, 214], [492, 262]];
    TG.forEach((g, i) => withA(c, k * seg(u, 0.4 + i * 0.15, 0.9 + i * 0.15), () => {
      c.strokeStyle = ENE; c.lineWidth = 3; c.setLineDash([10, 8]); c.lineDashOffset = -u * 30;
      const a0 = Math.atan2(g[1] - 112, g[0] - 300);
      c.beginPath(); c.moveTo(300 + Math.cos(a0) * 40, 112 + Math.sin(a0) * 40); c.lineTo(g[0], g[1] - 14); c.stroke(); c.setLineDash([]);
    }));

    withA(c, k, () => {
      /* 1 屋頂 */
      c.fillStyle = '#b9a58a'; c.fillRect(48, 246, 124, GY2 - 246);
      c.fillStyle = '#9c4f3a'; c.beginPath(); c.moveTo(40, 248); c.lineTo(180, 248); c.lineTo(180, 226); c.lineTo(40, 208); c.closePath(); c.fill();
      panelQuad(c, [52, 238], [170, 238], -6, -22, 5, 2, lit);
      c.fillStyle = '#ffe9a8'; c.fillRect(70, 262, 24, 20); c.fillRect(126, 262, 24, 20);
      /* 2 魚塭上方 */
      c.fillStyle = 'rgba(40,110,160,0.6)'; c.fillRect(214, 270, 172, GY2 - 270);
      c.strokeStyle = W5.rgba(WATER, 0.9); c.lineWidth = 2; c.beginPath();
      for (let x = 214; x <= 386; x += 4) { const y = 270 + 1.5 * Math.sin(x * 0.09 - u * 2.2); if (x === 214) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      c.strokeStyle = '#8fa39c'; c.lineWidth = 3;
      [236, 300, 364].forEach(x => { c.beginPath(); c.moveTo(x, 236); c.lineTo(x, GY2); c.stroke(); });
      panelQuad(c, [222, 238], [378, 238], 10, -24, 6, 2, lit);
      for (let i = 0; i < 3; i++) {
        const fx = 236 + ((((u * (18 + 6 * i) + i * 50) % 140) + 140) % 140), fy = 284 + 6 * Math.sin(u * 2 + i * 2);
        c.fillStyle = '#f0a860'; c.beginPath(); c.ellipse(fx, fy, 9, 4.5, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(fx - 8, fy); c.lineTo(fx - 15, fy - 5); c.lineTo(fx - 15, fy + 5); c.closePath(); c.fill();
      }
      /* 3 水庫水面浮動式 */
      c.fillStyle = GROUND; c.beginPath(); c.moveTo(410, GY2); c.lineTo(410, 236); c.quadraticCurveTo(424, 230, 438, 262); c.lineTo(438, GY2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(594, GY2); c.lineTo(594, 230); c.quadraticCurveTo(576, 232, 566, 262); c.lineTo(566, GY2); c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,110,160,0.6)'; c.fillRect(438, 268, 128, GY2 - 268);
      const bob = 1.5 * Math.sin(u * 2.0);
      c.fillStyle = '#c9d4d1'; c.fillRect(446, 266 + bob, 112, 5);
      panelQuad(c, [450, 266 + bob], [554, 266 + bob], 6, -12, 4, 1, lit);
      c.strokeStyle = W5.rgba(WATER, 0.9); c.lineWidth = 2; c.beginPath();
      for (let x = 438; x <= 566; x += 4) { const y = 270 + 1.5 * Math.sin(x * 0.09 - u * 2.2 + 1); if (x === 438) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 發電：板子微光 */
      [[110, 228], [300, 226], [502, 262]].forEach(g => W5.glow(c, g[0], g[1], 56, ENE, 0.32 * lit * (0.75 + 0.25 * Math.sin(u * 4 + g[0]))));
    });
    const LB = [[110, '屋頂', 'Rooftops', '利用屋頂空間', 'Uses roof space'],
      [300, '魚塭上方', 'Over fish ponds', '板下照常養殖', 'Fish farmed below'],
      [502, '水庫水面', 'On reservoirs', '浮動式', 'Floating panels']];
    LB.forEach((g, i) => {
      const a = k * seg(u, 1.6 + i * 0.35, 2.0 + i * 0.35);
      T(c, a, L(g[1], g[2]), g[0], 328, WHITE, 20);
      T(c, a, L(g[3], g[4]), g[0], 356, DIM, 20);
    });
    P(c, k * seg(u, 2.8, 3.2), L('太陽能 → 電能', 'Solar → electrical'), 120, 108, ENE, 20);
    P(c, k * seg(u, 3.0, 3.4), L('再生能源', 'Renewable'), 300, 400, REN, 20);

    /* 右：台灣與黑潮 */
    const ma = k * seg(u, 3.3, 3.9);
    withA(c, ma, () => {
      c.fillStyle = 'rgba(40,110,160,0.18)'; W5.rr(c, 626, 82, 312, 356, 14); c.fill();
      c.beginPath(); ISLE.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.fillStyle = '#3f6b4c'; c.fill(); c.strokeStyle = GROUND_EDGE; c.lineWidth = 2.5; c.stroke();
      /* 黑潮：寬帶＋往北流的虛線 */
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      subPath(c, KURO, 0, KURO.len); c.strokeStyle = 'rgba(40,110,200,0.45)'; c.lineWidth = 30; c.stroke(); c.restore();
      flow(c, KURO, WATER, u * 60, 46, 24, 5, 1);
      const e = at(KURO, KURO.len), e0 = at(KURO, KURO.len - 20);
      W5.arrow(c, e0.x, e0.y, e.x, e.y, WATER, 6, 22);
    });
    T(c, ma, L('台灣', 'Taiwan'), 710, 250, WHITE, 20);
    P(c, ma, L('黑潮', 'Kuroshio'), 872, 238, WATER, 20);
    T(c, ma * seg(u, 3.8, 4.2), L('往北流', 'Flows north'), 872, 282, WIND, 20);
    T(c, ma * seg(u, 3.8, 4.2), L('快又穩定', 'Fast, steady'), 872, 310, WIND, 20);
  }

  /* ═════════════════ 第 3 步：氫燃料電池車 ═════════════════ */
  const G3 = { x: 150, y: 168, s: 1.0 };
  const RD3 = 382;
  const H2P = mkPath([[318, 304], [398, 304]]);
  const AIRP = mkPath([[944, 296], [830, 296], [700, 290], [660, 280], [520, 280], [500, 290]]);
  const WATP = mkPath([[440, 334], [440, 340], [154, 340], [110, 334], [60, 312]]);
  const WPIPE = mkPath([[440, 334], [440, 340], [150, 340]]);
  const ELP = mkPath([[500, 314], [596, 314]]);
  function step3(c, s) {
    const u = s.u, k = s.k;
    const h2 = seg(u, 0.6, 1.0), air = seg(u, 1.0, 1.4), cell = seg(u, 1.6, 2.1), el = seg(u, 1.9, 2.3), go = seg(u, 2.3, 2.8), wat = seg(u, 2.6, 3.0);
    const dist = spin(u, 2.3, 1.2, 1);   /* 行駛位移（單位：秒×全速） */

    withA(c, k, () => {
      /* 路面 */
      c.fillStyle = '#26302d'; c.fillRect(24, RD3, 912, 10);
      c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const x = 24 + ((((i * 110 - dist * 220) % 990) + 990) % 990); if (x < 900) { c.beginPath(); c.moveTo(x, RD3 + 5); c.lineTo(Math.min(x + 50, 936), RD3 + 5); c.stroke(); } }
    });
    withA(c, k, () => {
      carBody(c, G3, 1);
      /* 氫氣瓶 */
      c.fillStyle = '#3a5560'; W5.rr(c, 176, 284, 142, 40, 20); c.fill();
      c.strokeStyle = H2C; c.lineWidth = 2.5; c.stroke();
      /* 燃料電池堆 */
      if (cell > 0.02) W5.glow(c, 450, 304, 80, ENE, 0.35 * cell);
      c.fillStyle = '#2d3f3a'; c.fillRect(400, 272, 100, 62);
      c.strokeStyle = '#c9d4d1'; c.lineWidth = 2.5; c.strokeRect(400, 272, 100, 62);
      for (let i = 1; i < 9; i++) { c.strokeStyle = mixHex('#6d817a', ENE, cell * (0.6 + 0.4 * Math.sin(u * 6 + i))); c.lineWidth = 2; c.beginPath(); c.moveTo(400 + i * 11, 276); c.lineTo(400 + i * 11, 330); c.stroke(); }
      pipe(c, H2P, 8); pipe(c, ELP, 6);
      /* 馬達＋傳動到前輪 */
      c.strokeStyle = '#8fa39c'; c.lineWidth = 5; c.beginPath(); c.moveTo(620, 314); c.lineTo(712, 346); c.stroke();
      motor(c, 620, 314, 24, 6 * dist, el);
      pipe(c, WPIPE, 5);
    });
    /* 流動：氫、空氣、電、水 */
    dots(c, H2P, H2C, u * 50, 26, 5, k * h2, 10);
    dots(c, AIRP, WIND, u * 70, 34, 5, k * air, 20);
    flow(c, ELP, ENE, u * 60, 22, 11, 5, k * el);
    dots(c, WATP, WATER, u * 55, 30, 4.5, k * wat, 30);
    withA(c, k, () => { wheel(c, 252, 346, 34, 6.5 * dist); wheel(c, 712, 346, 34, 6.5 * dist); });
    for (let i = 0; i < 4; i++) {
      const ph = ((u * 0.45 + i / 4) % 1);
      puff(c, 72 - ph * 30, 300 - ph * 70, 9 + ph * 12, VAPOR, k * wat * 0.55 * (1 - ph));
    }
    /* 標示 */
    T(c, k, L('氫氣瓶', 'Hydrogen tank'), 247, 236, H2C, 20);
    T(c, k * seg(u, 1.6, 2.0), L('燃料電池', 'Fuel cell'), 450, 236, ENE, 20);
    T(c, k * seg(u, 2.0, 2.4), L('馬達', 'Motor'), 620, 258, ENE, 20);
    T(c, k * seg(u, 1.0, 1.4), L('空氣（氧）', 'Air (O₂)'), 900, 236, WIND, 20);
    TW(c, k * seg(u, 2.8, 3.2), L('只排出水蒸氣', 'Only water vapour comes out'), 24, 156, WATER, 20, 200, 26, 'left');
    P(c, k * seg(u, 1.6, 2.0), L('氫 ＋ 氧 → 電 ＋ 水', 'Hydrogen + oxygen → electricity + water'), 480, 146, WHITE, 20);
    chain(c, k, u, [['化學能', 'Chemical'], ['電能', 'Electrical'], ['動能', 'Kinetic']], [0.6, 2.0, 2.5], 100);
    T(c, k * seg(u, 3.4, 3.8), L('氫氣製造與儲存成本高', 'Making and storing hydrogen is costly'), 480, 416, CAUTION, 20);
  }

  /* ═════════════════ 第 4 步：油電混合車 vs 純電動車 ═════════════════ */
  const SC4 = 0.6;
  const G4 = [{ x: 36, y: 136, s: SC4 }, { x: 506, y: 136, s: SC4 }];
  const RD4 = 136 + (382 - 180) * SC4;
  /* 速度：0～3.4 全速；3.4～5.4 煞車減到 0.2；之後低速 */
  const B0 = 3.4, B1 = 5.4, VMIN = 0.2;
  function v4(u) { return u < B0 ? 1 : u < B1 ? lerp(1, VMIN, (u - B0) / (B1 - B0)) : VMIN; }
  function d4(u) {
    if (u < B0) return u;
    if (u < B1) { const x = u - B0; return B0 + x - (1 - VMIN) * x * x / (2 * (B1 - B0)); }
    return B0 + (B1 - B0) * (1 + VMIN) / 2 + VMIN * (u - B1);
  }
  const braking = u => u >= B0 && u < B1;
  /* 電量：行駛時慢慢減、煞車時回充 */
  function soc(u, f0) {
    const drive = Math.min(u, B0) * 0.035, regen = clamp01((u - B0) / (B1 - B0)) * 0.22, after = Math.max(0, u - B1) * 0.01;
    return f0 - drive + regen - after;
  }
  function step4(c, s) {
    const u = s.u, k = s.k;
    const dist = d4(u), br = braking(u), regA = k * (seg(u, B0, B0 + 0.3) - seg(u, B1 - 0.3, B1));
    const drvA = k * (1 - seg(u, B0 - 0.2, B0)) * seg(u, 0.5, 0.9);

    withA(c, k, () => {
      c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2; c.setLineDash([8, 8]);
      c.beginPath(); c.moveTo(480, 82); c.lineTo(480, 360); c.stroke(); c.setLineDash([]);
    });
    G4.forEach((g, i) => {
      const X = v => g.x + (v - 150) * g.s, Y = v => g.y + (v - 180) * g.s;
      const ev = i === 1;
      withA(c, k, () => {
        c.fillStyle = '#26302d'; c.fillRect(g.x - 18, RD4, 420, 7);
        c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2.5;
        for (let j = 0; j < 5; j++) { const x = ((((j * 90 - dist * 140) % 450) + 450) % 450); if (x < 390) { c.beginPath(); c.moveTo(g.x - 18 + x, RD4 + 3.5); c.lineTo(g.x - 18 + Math.min(x + 34, 420), RD4 + 3.5); c.stroke(); } }
        carBody(c, g, 1);
        /* 煞車燈 */
        c.fillStyle = br ? '#ff4d4d' : '#6b2a2a'; c.fillRect(X(150) - 2, Y(286), 6, 14);
        if (br) W5.glow(c, X(150), Y(293), 22, '#ff4d4d', 0.6);
        /* 電池 */
        const f = soc(u, ev ? 0.7 : 0.55);
        if (ev) batteryH(c, X(300), Y(312), (600 - 300) * SC4, 24, f, regA);
        else batteryH(c, X(400), Y(300), 120 * SC4, 26, f, regA);
        /* 馬達 */
        motor(c, X(640), Y(306), 15, 6 * dist, (drvA + regA) * 0.8);
        c.strokeStyle = '#8fa39c'; c.lineWidth = 3; c.beginPath(); c.moveTo(X(640), Y(306)); c.lineTo(X(712), Y(346)); c.stroke();
        if (!ev) {
          /* 油箱＋引擎（引擎在車頭蓋下） */
          c.fillStyle = '#5a3f2e'; W5.rr(c, X(296), Y(296), 80 * SC4, 28, 6); c.fill();
          c.strokeStyle = HEAT; c.lineWidth = 2; c.stroke();
          const eg = drvA * (0.7 + 0.3 * Math.sin(u * 14));
          if (eg > 0.02) W5.glow(c, X(740), Y(296), 30, HEAT, 0.5 * eg);
          c.fillStyle = '#5e3a2c'; c.fillRect(X(700), Y(274), 80 * SC4, 50 * SC4);
          c.strokeStyle = HEAT; c.lineWidth = 2.5; c.strokeRect(X(700), Y(274), 80 * SC4, 50 * SC4);
          c.strokeStyle = HEAT; c.lineWidth = 2; for (let q = 0; q < 3; q++) { c.beginPath(); c.moveTo(X(712 + q * 22), Y(282)); c.lineTo(X(712 + q * 22), Y(316)); c.stroke(); }
        } else {
          c.strokeStyle = 'rgba(163,184,176,0.6)'; c.lineWidth = 2; c.setLineDash([5, 5]);
          c.strokeRect(X(700), Y(274), 80 * SC4, 50 * SC4); c.setLineDash([]);
        }
        wheel(c, X(252), Y(346), 34 * SC4, 6.5 * dist); wheel(c, X(712), Y(346), 34 * SC4, 6.5 * dist);
      });
      /* 能量流：行駛＝電池→馬達（黃）、油→引擎（橘紅）；煞車＝馬達→電池（回收） */
      const bx = ev ? X(600) : X(520), by = ev ? Y(312) + 12 : Y(300) + 13;
      const EP = mkPath([[bx + 4, by], [X(640) - 16, by], [X(640) - 16, Y(306)]]);
      flow(c, EP, ENE, u * 50, 18, 9, 4, drvA);
      flow(c, EP, ENE, u * 50, 18, 9, 4, regA, true);
      if (!ev) {
        const FP = mkPath([[X(336), Y(296) + 28], [X(336), Y(338)], [X(690), Y(338)], [X(700), Y(274) + 28]]);
        flow(c, FP, HEAT, u * 50, 20, 9, 4, drvA * 0.9);
      }
    });
    P(c, k, L('油電混合車', 'Hybrid car'), 246, 96, WHITE, 22);
    P(c, k, L('純電動車', 'Electric car'), 716, 96, WHITE, 22);
    /* 零件標示（車身下方兩列，以短線指向零件） */
    const LBL = [
      [0, 336, 1, '油箱', 'Fuel tank', HEAT], [0, 460, 0, '電池', 'Battery', ENE], [0, 640, 1, '馬達', 'Motor', ENE], [0, 740, 0, '引擎', 'Engine', HEAT],
      [1, 450, 0, '電池', 'Battery', ENE], [1, 640, 1, '馬達', 'Motor', ENE], [1, 740, 0, '無引擎', 'No engine', DIM]
    ];
    const la = k * seg(u, 0.8, 1.2);
    LBL.forEach(q => {
      const g = G4[q[0]], x = g.x + (q[1] - 150) * g.s, y = 290 + q[2] * 28;
      withA(c, la, () => { c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, RD4 + 8); c.lineTo(x, y - 12); c.stroke(); });
      T(c, la, L(q[3], q[4]), x, y, q[5], 20);
    });
    P(c, regA, L('煞車時：馬達變成發電機，把動能存回電池', 'Braking: the motor works as a generator and recharges the battery'), 480, 364, ENE, 20);
    T(c, k * seg(u, 0.9, 1.3) * (1 - seg(u, B0 - 0.3, B0)) + k * seg(u, B1, B1 + 0.3), L('引擎＋電池＋馬達', 'Engine + battery + motor'), 246, 364, WHITE, 20);
    T(c, k * seg(u, 0.9, 1.3) * (1 - seg(u, B0 - 0.3, B0)) + k * seg(u, B1, B1 + 0.3), L('電池＋馬達', 'Battery + motor'), 716, 364, WHITE, 20);
    T(c, k * seg(u, 5.6, 6.0), L('電從哪裡來，會影響整體的碳排放', 'Where the electricity comes from affects the total carbon emissions'), 480, 410, CAUTION, 20);
  }

  /* ═════════════════ 第 5 步：太陽能飛機 ═════════════════ */
  /* 一天：u 0.4～7.6 對應早上 6 點到隔天 6 點 */
  const hourOf = u => 6 + 24 * clamp01((u - 0.4) / 7.2);
  const sunEl = h => (h >= 6 && h <= 18) ? Math.sin(Math.PI * (h - 6) / 12) : 0;
  function soc5(h) {
    if (h <= 8) return 0.3;
    if (h <= 16) { const x = (h - 8) / 8; return 0.3 + 0.65 * x * x * (3 - 2 * x); }
    if (h <= 18) return 0.95;
    return 0.95 - 0.65 * clamp01((h - 18) / 12);
  }
  const charging = h => h > 8 && h < 16, draining = h => h > 18;
  const WING = { x0: 150, x1: 710, y: 214, ch: 38 };
  const PROPS = [236, 346, 514, 624];
  function step5(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const h = hourOf(u), el = sunEl(h), night = 1 - clamp01(el * 4);
    const B = soc5(h);

    withA(c, k, () => {
      /* 天色：白天微暖光、夜晚星星 */
      if (el > 0.01) W5.glow(c, 430, 120, 420, ENE, 0.12 * el);
      for (let i = 0; i < 26; i++) {
        const x = 40 + hash(i + 300) * 880, y = 84 + hash(i + 330) * 220, tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
        c.fillStyle = W5.rgba(WHITE, 0.7 * night * tw); c.beginPath(); c.arc(x, y, 1.6 + hash(i + 360), 0, TAU); c.fill();
      }
      /* 地面雲：往下飄＝飛機往上飛 */
      for (let i = 0; i < 6; i++) {
        const y = 86 + ((((u * 26 + i * 44) % 260) + 260) % 260), x = 80 + hash(i + 400) * 700;
        cloud(c, x, y, 60 + 30 * hash(i + 410), 0.12 + 0.1 * el, '#c9d4d1');
      }
    });
    /* 太陽／月亮與時刻 */
    const isDay = h < 18;
    if (isDay) sun(c, 70, 112, 18, t, k * clamp01(el * 3));
    else withA(c, k * seg(h, 18, 19), () => {
      c.fillStyle = '#e8ecd8'; c.beginPath(); c.arc(70, 112, 18, 0, TAU); c.fill();
      c.fillStyle = '#0d201a'; c.beginPath(); c.arc(79, 106, 16, 0, TAU); c.fill();
    });
    T(c, k, isDay ? L('白天', 'Day') : L('夜晚', 'Night'), 102, 112, isDay ? ENE : WIND, 20, 'left');
    /* 陽光照到機翼 */
    for (let i = 0; i < 6; i++) {
      const x = 190 + i * 96;
      withA(c, k * el * seg(u, 0.5, 0.9), () => {
        c.strokeStyle = ENE; c.lineWidth = 3; c.setLineDash([10, 8]); c.lineDashOffset = -u * 30;
        c.beginPath(); c.moveTo(x + 30, 112); c.lineTo(x, WING.y - 10); c.stroke(); c.setLineDash([]);
      });
    }
    const chg = charging(h), drn = draining(h), solarOn = el > 0.05;
    withA(c, k, () => {
      /* 機身（俯視，機頭朝上）與尾翼 */
      c.fillStyle = '#dfe8e4'; W5.rr(c, 422, 168, 16, 140, 8); c.fill();
      c.fillStyle = '#c9d4d1'; W5.rr(c, 380, 290, 100, 14, 6); c.fill();
      /* 機翼＋太陽能板 */
      c.fillStyle = '#c9d4d1'; W5.rr(c, WING.x0 - 6, WING.y - 4, WING.x1 - WING.x0 + 12, WING.ch + 8, 10); c.fill();
      panelQuad(c, [WING.x0, WING.y + WING.ch], [WING.x1, WING.y + WING.ch], 0, -WING.ch, 18, 2, el);
      if (solarOn) W5.glow(c, 430, WING.y + 18, 260, ENE, 0.18 * el);
      /* 馬達艙＋螺旋槳（固定轉速、解析） */
      PROPS.forEach((x, i) => {
        c.fillStyle = '#9aa8a3'; W5.rr(c, x - 7, WING.y - 22, 14, 30, 6); c.fill();
        const th = u * 22 + i;
        c.fillStyle = 'rgba(216,243,240,0.18)'; c.beginPath(); c.ellipse(x, WING.y - 24, 30, 5, 0, 0, TAU); c.fill();
        c.strokeStyle = WHITE; c.lineWidth = 4; c.lineCap = 'round';
        const L1 = 28 * Math.cos(th);
        c.beginPath(); c.moveTo(x - L1, WING.y - 24); c.lineTo(x + L1, WING.y - 24); c.stroke();
      });
      /* 電池（右側示意） */
      battery(c, 846, 168, 56, 110, B, chg ? 0.8 : drn ? 0.4 : 0);
    });
    /* 能量流：機翼→螺旋槳（白天）；機翼→電池（充電）；電池→螺旋槳（夜晚） */
    const PW = mkPath([[WING.x1 + 6, WING.y + 19], [846, WING.y + 19]]);
    flow(c, PW, ENE, u * 50, 22, 11, 5, k * (chg ? 1 : 0) * seg(u, 0.9, 1.3));
    flow(c, PW, ENE, u * 50, 22, 11, 5, k * (drn ? 1 : 0), true);
    PROPS.forEach((x, i) => withA(c, k * (solarOn || drn ? 1 : 0.4) * seg(u, 0.9, 1.3), () => W5.glow(c, x, WING.y - 10, 18, ENE, 0.55 * (0.7 + 0.3 * Math.sin(u * 8 + i)))));
    T(c, k, L('電池', 'Battery'), 874, 302, ENE, 20);
    T(c, k * seg(u, 0.6, 1.0), L('機翼鋪滿太陽能板', 'Solar cells cover the wings'), 430, 330, WHITE, 20);
    T(c, k * seg(u, 1.0, 1.4), L('螺旋槳', 'Propellers'), 160, 168, WHITE, 20);
    const state = drn ? L('夜晚：電池供電給螺旋槳', 'Night: battery powers propellers')
      : chg ? L('白天：多的電充進電池', 'Day: spare power charges battery')
        : solarOn ? L('白天：板子發電推動螺旋槳', 'Day: panels power propellers') : L('天黑了', 'Getting dark');
    P(c, k * seg(u, 0.8, 1.2), state, 690, 112, drn ? WIND : ENE, 20);

    /* 下方：一天的電池電量 */
    const ga = k * seg(u, 0.4, 0.8);
    const gx0 = 170, gx1 = 640, gy0 = 360, gy1 = 420;
    const hx = hh => lerp(gx0, gx1, (hh - 6) / 24), by = f => gy1 - (gy1 - gy0) * f;
    withA(c, ga, () => {
      c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, 40, 350, 880, 88, 10); c.fill();
      c.strokeStyle = W5.rgba(ENE, 0.4); c.lineWidth = 1.5; c.stroke();
      c.fillStyle = 'rgba(253,224,71,0.08)'; c.fillRect(hx(6), gy0 - 4, hx(18) - hx(6), gy1 - gy0 + 8);
      c.fillStyle = 'rgba(114,185,255,0.08)'; c.fillRect(hx(18), gy0 - 4, hx(30) - hx(18), gy1 - gy0 + 8);
      c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(gx0, gy0 - 4); c.lineTo(gx0, gy1); c.lineTo(gx1, gy1); c.stroke();
      c.strokeStyle = W5.rgba(ENE, 0.3); c.lineWidth = 2.5; c.beginPath();
      for (let hh = 6; hh <= 30.01; hh += 0.25) { const x = hx(hh), y = by(soc5(hh)); if (hh === 6) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      c.strokeStyle = ENE; c.lineWidth = 3.5; c.beginPath();
      for (let hh = 6; hh <= h + 0.001; hh += 0.25) { const x = hx(hh), y = by(soc5(hh)); if (hh === 6) c.moveTo(x, y); else c.lineTo(x, y); }
      c.lineTo(hx(h), by(B)); c.stroke();
      W5.glow(c, hx(h), by(B), 14, ENE, 0.8);
      c.fillStyle = WHITE; c.beginPath(); c.arc(hx(h), by(B), 4.5, 0, TAU); c.fill();
    });
    TW(c, ga, L('電池電量', 'Battery charge'), 104, 380, ENE, 20, 120, 26);
    T(c, ga, L('白天', 'Day'), hx(8), 378, ENE, 20);
    T(c, ga, L('夜晚', 'Night'), hx(26.5), 378, WIND, 20);
    const na = ga * seg(u, 1.4, 1.8);
    withA(c, na, () => { c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(664, 360); c.lineTo(664, 428); c.stroke(); });
    T(c, na, L('效率與夜間限制，', 'Low efficiency, night limits:'), 790, 380, CAUTION, 20);
    T(c, na, L('仍在實驗階段', 'still experimental'), 790, 408, CAUTION, 20);
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['離岸風電與陸域風電', 'Offshore vs onshore wind'],
      sub: ['陸上的風被樹和建物擋住，又慢又亂；海面平坦，風比較快、比較穩', 'On land, trees and buildings slow and disturb the wind; over the flat sea it blows faster and steadier.'],
      con: ['結論：離岸風車更大、發電時數更長，年發電量較多；但建造與維護成本較高', 'Conclusion: offshore turbines are larger and run more hours, so they generate more, but cost more to build and maintain.'] },
    { title: ['太陽能與洋流', 'Solar power and ocean currents'],
      sub: ['太陽能板可以裝在屋頂、魚塭上方或水庫水面；台灣東部外海有黑潮流過', 'Solar panels can go on roofs, above fish ponds or on reservoirs; the Kuroshio current flows past eastern Taiwan.'],
      con: ['結論：太陽能可以和屋頂、水面共用空間；黑潮流動的海水帶有動能', 'Conclusion: solar panels can share space with roofs and water; the flowing Kuroshio carries kinetic energy.'] },
    { title: ['氫燃料電池車', 'Hydrogen fuel-cell car'],
      sub: ['氫氣和空氣中的氧在燃料電池裡反應產生電，電推動馬達、帶動車輪', 'In the fuel cell, hydrogen reacts with oxygen from the air to make electricity, which drives the motor and wheels.'],
      con: ['結論：化學能 → 電能 → 動能，排出的只有水；但氫氣製造與儲存成本高', 'Conclusion: chemical → electrical → kinetic, and only water comes out; but hydrogen is costly to make and store.'] },
    { title: ['油電混合車與純電動車', 'Hybrid and electric cars'],
      sub: ['油電混合車有引擎、電池和馬達；純電動車只有電池和馬達，沒有引擎', 'A hybrid has an engine, a battery and a motor; an electric car has only a battery and a motor, no engine.'],
      con: ['結論：煞車時能把動能回收進電池；電從哪裡來，會影響整體的碳排放', 'Conclusion: braking energy can be stored back in the battery; where the electricity comes from affects total emissions.'] },
    { title: ['太陽能飛機', 'Solar-powered aircraft'],
      sub: ['白天機翼上的太陽能板發電推動螺旋槳，多的電充進電池；夜晚靠電池繼續飛', 'By day the wing panels power the propellers and charge the battery; at night the battery keeps it flying.'],
      con: ['結論：太陽能 → 電能 → 動能；受效率與夜間限制，目前仍在實驗階段', 'Conclusion: solar → electrical → kinetic; limited by efficiency and night time, it is still experimental.'] }
  ];

  W5.register('newtech', {
    canvas: 'cvs-newtech',
    steps: DUR,
    draw(c, s) {
      const n = s.n, u = s.u, k = s.k;
      if (n === 1) step1(c, s);
      else if (n === 2) step2(c, s);
      else if (n === 3) step3(c, s);
      else if (n === 4) step4(c, s);
      else step5(c, s);

      const X = TXT[n - 1];
      P(c, k, L(X.title[0], X.title[1]), 480, 52, WHITE, 24);
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), GOOD);
    }
  });
})();
