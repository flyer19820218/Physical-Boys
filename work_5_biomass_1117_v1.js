/* ==================================================================
   work_5 ｜ 生質能（cvs-biomass，960×540）
   三步：1 光合作用（光能→化學能；葡萄糖存在植物體內）
        → 2 燃燒與沼氣（左：木屑、稻稈進鍋爐；右：畜牧排泄物發酵產生沼氣；兩路都是 化學能→熱能→電能）
        → 3 生質燃料（甘蔗、玉米→發酵→生質酒精，加進汽油給車輛當動力燃料；碳循環小箭頭）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 solar／thermal／hydrowind 一致）：能量／太陽＝黃 ENE、熱＝橘紅 HEAT、水＝藍 WATER、
   再生能源＝綠 REN #33cc99；本檔另加：化學能＝琥珀橘 CHEM（比熱的橘紅偏黃，畫面上用「方塊＝化學能」標籤說明）、
   二氧化碳＝灰 SMOKE、氧氣＝淡青 OXY。發電不畫電子、不畫電流小點：只用燈泡亮度與導線轉亮表示。

   純函式作法：所有畫面都由 s 算出；持續的小動畫一律用該步秒數 s.u 的純函式，跳步不走樣；
   亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；畫布字 ≥ 20px；
   畫布頂端 0～30px 留給進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。整個包在 IIFE 內。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量／太陽／電：黃 */
  const HEAT = '#ff6a3d';            /* 熱：橘紅 */
  const CHEM = '#ffa53a';            /* 化學能：琥珀橘（與熱區分） */
  const CHEM_EDGE = 'rgba(255,232,196,0.95)';
  const WATER = '#5ab8e8';           /* 水：藍 */
  const STEAM = '#e8f1f4';           /* 蒸氣：淡白 */
  const SMOKE = '#b7c7c1';           /* 二氧化碳、廢氣：灰 */
  const OXY = '#bdf3ff';             /* 氧氣：淡青 */
  const GAS = '#d6f5c2';             /* 沼氣（甲烷）氣泡：淡黃綠 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const GROUND = '#2c4a3a', GROUND_EDGE = '#5f8a6c', SOIL = '#3b2f24';
  const LEAF = '#2f8f4e', LEAF_HI = '#46b866', BARK = '#7a5236';
  const DUR = [9, 9, 9];             /* 總長 27 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), Bc = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, Bc[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（也不記進 W5.boxes） ── */
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
  /* 底部字幕：說明一般框、結論綠框（同 solar／thermal） */
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

  /* ── 路徑工具（同 solar／thermal） ── */
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
  function pipe(c, path, fill, w) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
    subPath(c, path, 0, path.len);
    c.strokeStyle = INK; c.lineWidth = w + 6; c.stroke();
    c.strokeStyle = '#6d817a'; c.lineWidth = w + 3; c.stroke();
    c.strokeStyle = fill || EMPTY; c.lineWidth = w; c.stroke();
    c.restore();
  }
  /* 沿路徑移動的小東西：n 個，速度 v（px/秒），fn(x,y,i) 畫一個 */
  function along(path, u, n, v, fn) {
    const gap = path.len / n;
    for (let i = 0; i < n; i++) {
      const d = ((u * v + i * gap) % path.len + path.len) % path.len;
      const p = at(path, d); fn(p.x, p.y, i, d / path.len);
    }
  }
  function wire(c, pts, lit) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    c.strokeStyle = INK; c.lineWidth = 7; c.stroke();
    c.strokeStyle = mixHex('#7d8f89', ENE, 0.85 * lit); c.lineWidth = 3.5; c.stroke();
    c.restore();
  }

  /* ── 共用小零件 ── */
  function sun(c, x, y, R, u, a) {
    withA(c, a, () => {
      W5.glow(c, x, y, R * 2.1, ENE, 0.45);
      c.save(); c.strokeStyle = ENE; c.lineWidth = Math.max(2, R * 0.1); c.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const an = i * TAU / 12 + u * 0.25, r0 = R * 1.22, r1 = R * (1.5 + 0.08 * Math.sin(u * 3 + i));
        c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.stroke();
      }
      c.restore();
      const g = c.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
      g.addColorStop(0, '#fff7c2'); g.addColorStop(0.55, ENE); g.addColorStop(1, '#f2b400');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    });
  }
  function ray(c, x0, y0, x1, y1, frac, col, off, a) {
    if (frac <= 0.01) return;
    withA(c, a, () => {
      const xe = lerp(x0, x1, frac), ye = lerp(y0, y1, frac);
      c.strokeStyle = col; c.lineWidth = 3.2; c.lineCap = 'round'; c.setLineDash([12, 9]); c.lineDashOffset = -off;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
      if (frac > 0.97) W5.arrow(c, lerp(x0, x1, 0.9), lerp(y0, y1, 0.9), x1, y1, col, 3.2, 11);
    });
  }
  function bulb(c, bx, by, lit) {
    if (lit > 0.02) W5.glow(c, bx, by, 46, ENE, 0.75 * lit);
    c.fillStyle = mixHex('#3a4a45', '#fff4b0', lit); c.beginPath(); c.arc(bx, by, 16, 0, TAU); c.fill();
    c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7f918a'; c.fillRect(bx - 8, by + 14, 16, 10);
    c.strokeStyle = mixHex('#6d817a', '#ffb000', lit); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx - 6, by + 9); c.lineTo(bx - 3, by - 4); c.lineTo(bx, by + 2); c.lineTo(bx + 3, by - 4); c.lineTo(bx + 6, by + 9); c.stroke();
  }
  function flame(c, x, y, s, t, outer, inner) {
    const f = 1 + 0.12 * Math.sin(t * 13 + x) + 0.07 * Math.sin(t * 7.3 + 1 + x * 0.3);
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
  function lump(c, x, y, s, seed, fill, edge) {
    c.beginPath();
    for (let j = 0; j < 7; j++) {
      const an = j / 7 * TAU + seed, r = s * (0.8 + 0.32 * hash(seed * 10 + j));
      const px = x + Math.cos(an) * r, py = y + Math.sin(an) * r * 0.8;
      if (j) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = edge; c.lineWidth = 1.5; c.stroke();
  }
  function puff(c, x, y, r, col, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.7, y + r * 0.2, r * 0.75, 0, TAU); c.arc(x - r * 0.6, y + r * 0.25, r * 0.65, 0, TAU); c.fill();
    c.restore();
  }
  /* 化學能方塊（教學符號）：琥珀橘＋亮外框 */
  function cube(c, x, y, s, a) {
    withA(c, a, () => {
      c.fillStyle = CHEM; W5.rr(c, x, y, s, s, 4); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.28)'; W5.rr(c, x + 3, y + 3, s - 6, s * 0.32, 3); c.fill();
      c.strokeStyle = CHEM_EDGE; c.lineWidth = 2; W5.rr(c, x, y, s, s, 4); c.stroke();
    });
  }
  /* 角速度平滑上升的轉角（解析積分） */
  function spin(u, R0, RD, OM) {
    if (u <= R0) return 0;
    const x = (u - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (u - R0 - RD));
  }
  function ground(c, x0, x1, y) {
    c.fillStyle = GROUND; c.fillRect(x0, y, x1 - x0, 10);
    c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  }
  /* 能量流轉條：items＝[[中,英,顏色]]，ats＝各自亮起的秒數；cx＝置中位置，或 x0＝靠左起點 */
  function chainW(c, items, sz, gap) {
    const ws = items.map(p => W5.tw(c, L(p[0], p[1]), sz) + 28);
    return { ws, tot: ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1) };
  }
  function chain(c, k, u, items, ats, y, opt) {
    const sz = opt.sz || 22, gap = opt.gap || 44;
    const m = chainW(c, items, sz, gap);
    let x = opt.x0 != null ? opt.x0 : opt.cx - m.tot / 2;
    items.forEach((p, i) => {
      const on = seg(u, ats[i], ats[i] + 0.5), col = p[2] || ENE;
      const cx = x + m.ws[i] / 2;
      if (on > 0.02) withA(c, k * on, () => W5.glow(c, cx, y, m.ws[i] * 0.6, col, 0.3));
      P(c, k, L(p[0], p[1]), cx, y, mixHex('#6f7f78', col, on), sz);
      if (i < items.length - 1) {
        const nx = seg(u, ats[i + 1], ats[i + 1] + 0.5), ncol = items[i + 1][2] || ENE;
        withA(c, k, () => W5.arrow(c, x + m.ws[i] + 7, y, x + m.ws[i] + gap - 7, y, mixHex('#6f7f78', ncol, nx), 3.5, 10));
      }
      x += m.ws[i] + gap;
    });
  }

  /* ═════════════════ 第 1 步：光合作用（光能 → 化學能） ═════════════════ */
  const GY1 = 372;
  const SUN1 = { x: 90, y: 165, R: 26 };
  const TREE = { x: 400, y: 225 };
  const CANOPY = [[-60, 10, 48], [0, -22, 56], [60, 8, 50], [-26, 36, 44], [30, 38, 46], [-82, -14, 36], [80, -18, 36], [2, 22, 48]];
  const CHL = { x: 440, y: 240 };                       /* 葉綠體（放大示意） */
  const PANEL = { x: 650, y: 158, w: 275, h: 214 };
  const NCUBE = 15, CS = 30, CG = 8;
  const slot = i => ({ x: PANEL.x + PANEL.w / 2 - (5 * CS + 4 * CG) / 2 + (i % 5) * (CS + CG), y: 300 - Math.floor(i / 5) * (CS + CG) });
  const CO2_1 = [mkPath([[150, 228], [292, 222]]), mkPath([[150, 262], [292, 256]])];
  const H2O_1 = mkPath([[400, 386], [400, 330], [402, 280], [420, 250]]);
  const O2_1 = [mkPath([[500, 178], [562, 150]]), mkPath([[506, 206], [580, 196]])];
  function co2mol(c, x, y, a) {      /* 二氧化碳小分子：灰色中心＋兩顆小球 */
    withA(c, a, () => {
      c.fillStyle = '#7d8f89'; c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill();
      c.fillStyle = SMOKE; c.beginPath(); c.arc(x - 8, y, 4.5, 0, TAU); c.arc(x + 8, y, 4.5, 0, TAU); c.fill();
    });
  }
  function step1(c, s) {
    const u = s.u, k = s.k;
    const rayIn = ease(seg(u, 0.4, 1.3));
    const chl = ease(seg(u, 1.0, 1.8));
    const inA = seg(u, 0.8, 1.3), outA = seg(u, 1.8, 2.3);

    withA(c, k, () => {
      ground(c, 40, 920, GY1);
      /* 根 */
      c.strokeStyle = '#8a6a4a'; c.lineWidth = 3; c.lineCap = 'round';
      [[-34, 12], [-16, 14], [14, 14], [34, 10]].forEach(r => {
        c.beginPath(); c.moveTo(TREE.x, GY1 + 2); c.quadraticCurveTo(TREE.x + r[0] * 0.5, GY1 + r[1], TREE.x + r[0], GY1 + r[1]); c.stroke();
      });
      /* 樹幹 */
      c.fillStyle = BARK; c.beginPath(); c.moveTo(TREE.x - 13, GY1); c.lineTo(TREE.x - 7, 270); c.lineTo(TREE.x + 7, 270); c.lineTo(TREE.x + 13, GY1); c.closePath(); c.fill();
      c.strokeStyle = BARK; c.lineWidth = 6;
      c.beginPath(); c.moveTo(TREE.x, 300); c.lineTo(TREE.x - 34, 262); c.moveTo(TREE.x + 2, 292); c.lineTo(TREE.x + 36, 258); c.stroke();
    });
    /* 水：從根往上 */
    withA(c, k * inA, () => {
      c.save(); c.strokeStyle = W5.rgba(WATER, 0.45); c.lineWidth = 3; c.setLineDash([6, 8]); c.lineDashOffset = -u * 30;
      subPath(c, H2O_1, 0, H2O_1.len); c.stroke(); c.restore();
      along(H2O_1, u, 5, 34, (x, y, i, f) => {
        c.save(); c.globalAlpha *= Math.sin(f * Math.PI);
        c.fillStyle = WATER; c.beginPath(); c.arc(x, y + 2, 5, 0, TAU); c.moveTo(x - 4.3, y); c.lineTo(x, y - 8); c.lineTo(x + 4.3, y); c.fill(); c.restore();
      });
    });
    /* 樹冠 */
    withA(c, k, () => {
      CANOPY.forEach((q, i) => {
        const sw = 2 * Math.sin(u * 1.3 + i);
        const g = c.createRadialGradient(TREE.x + q[0] + sw - q[2] * 0.3, TREE.y + q[1] - q[2] * 0.35, q[2] * 0.15, TREE.x + q[0] + sw, TREE.y + q[1], q[2]);
        g.addColorStop(0, LEAF_HI); g.addColorStop(1, LEAF);
        c.fillStyle = g; c.beginPath(); c.arc(TREE.x + q[0] + sw, TREE.y + q[1], q[2], 0, TAU); c.fill();
      });
      if (rayIn > 0.02) W5.glow(c, TREE.x, TREE.y - 10, 120, ENE, 0.22 * rayIn);
      /* 葉綠體（放大示意）：綠色橢圓＋內部疊片 */
      if (chl > 0.02) W5.glow(c, CHL.x, CHL.y, 46, ENE, 0.55 * chl * (0.75 + 0.25 * Math.sin(u * 4)));
      c.save(); c.translate(CHL.x, CHL.y); c.rotate(-0.2);
      c.fillStyle = '#7ddc8a'; c.beginPath(); c.ellipse(0, 0, 30, 17, 0, 0, TAU); c.fill();
      c.strokeStyle = '#e9ffe9'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#1f6b3a';
      for (let i = 0; i < 4; i++) { W5.rr(c, -20 + i * 11, -7 + (i % 2) * 4, 8, 10, 2); c.fill(); }
      c.restore();
      /* 葉綠體標籤的引線 */
      c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(CHL.x + 24, CHL.y + 14); c.lineTo(522, 330); c.stroke();
    });
    /* 陽光 */
    [[300, 196], [330, 166], [366, 150]].forEach((p, i) => {
      const an = Math.atan2(p[1] - SUN1.y, p[0] - SUN1.x);
      ray(c, SUN1.x + Math.cos(an) * SUN1.R * 1.7, SUN1.y + Math.sin(an) * SUN1.R * 1.7, p[0], p[1], rayIn, ENE, u * 40 + i * 6, k);
    });
    sun(c, SUN1.x, SUN1.y, SUN1.R, u, k);
    /* 二氧化碳：從左邊進入葉子 */
    withA(c, k * inA, () => {
      CO2_1.forEach((pth, j) => {
        c.save(); c.strokeStyle = W5.rgba(SMOKE, 0.5); c.lineWidth = 2.5; c.setLineDash([8, 8]); c.lineDashOffset = -u * 30;
        subPath(c, pth, 0, pth.len - 10); c.stroke(); c.restore();
        W5.arrow(c, pth.P[1].x - 22, pth.P[1].y + 1, pth.P[1].x, pth.P[1].y, SMOKE, 3, 11);
        along(pth, u + j * 0.4, 3, 38, (x, y, i, f) => co2mol(c, x, y, Math.sin(f * Math.PI)));
      });
    });
    /* 氧氣：從葉子出去 */
    withA(c, k * outA, () => {
      O2_1.forEach((pth, j) => {
        c.save(); c.strokeStyle = W5.rgba(OXY, 0.45); c.lineWidth = 2.5; c.setLineDash([8, 8]); c.lineDashOffset = -u * 30;
        subPath(c, pth, 0, pth.len); c.stroke(); c.restore();
        W5.arrow(c, lerp(pth.P[0].x, pth.P[1].x, 0.75), lerp(pth.P[0].y, pth.P[1].y, 0.75), pth.P[1].x, pth.P[1].y, OXY, 3, 11);
        along(pth, u + j * 0.3, 3, 30, (x, y, i, f) => {
          c.save(); c.globalAlpha *= Math.sin(f * Math.PI);
          c.fillStyle = OXY; c.beginPath(); c.arc(x - 5, y, 5, 0, TAU); c.arc(x + 5, y, 5, 0, TAU); c.fill(); c.restore();
        });
      });
    });
    /* 右：植物體內儲存的葡萄糖（化學能方塊越堆越多） */
    withA(c, k, () => {
      c.fillStyle = 'rgba(11,26,21,0.62)'; W5.rr(c, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(CHEM, 0.55); c.stroke();
      for (let i = 0; i < NCUBE; i++) {
        const q = slot(i);
        c.strokeStyle = 'rgba(255,165,58,0.28)'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
        W5.rr(c, q.x, q.y, CS, CS, 4); c.stroke(); c.setLineDash([]);
      }
    });
    for (let i = 0; i < NCUBE; i++) {
      const st = 2.2 + i * 0.3;
      if (u < st) continue;
      const f = ease(seg(u, st, st + 0.6)), q = slot(i);
      const x = lerp(CHL.x - CS / 2, q.x, f), y = lerp(CHL.y - CS / 2, q.y, f) - Math.sin(f * Math.PI) * 30;
      cube(c, x, y, CS * lerp(0.6, 1, f), k);
      if (f >= 1) withA(c, k * (0.35 + 0.25 * Math.sin(u * 3 + i)), () => W5.glow(c, q.x + CS / 2, q.y + CS / 2, 22, CHEM, 0.35));
    }

    T(c, k, L('太陽', 'Sun'), SUN1.x, 222, ENE, 20);
    T(c, k * inA, L('二氧化碳', 'Carbon dioxide'), 210, 298, SMOKE, 20);
    T(c, k * inA, L('水（根吸收）', 'Water (from roots)'), 380, 350, WATER, 20, 'right');
    T(c, k * outA, L('氧氣', 'Oxygen'), 568, 140, OXY, 20, 'left');
    T(c, k * chl, L('葉綠體', 'Chloroplast'), 526, 340, '#7ddc8a', 20, 'left');
    T(c, k, L('葡萄糖（存在植物體內）', 'Glucose (in the plant)'), PANEL.x + PANEL.w / 2, 184, CHEM, 20);
    T(c, k * seg(u, 2.4, 2.9), L('方塊＝化學能', 'Cube = chemical energy'), PANEL.x + PANEL.w / 2, 350, CHEM, 20);
    P(c, k * seg(u, 1.6, 2.1), L('水＋二氧化碳 → 葡萄糖＋氧氣（需日光、葉綠體）', 'water + carbon dioxide → glucose + oxygen (needs sunlight, chloroplasts)'), 480, 408, WHITE, 20);

    chain(c, k, u, [['光能', 'Light', ENE], ['化學能', 'Chemical', CHEM]], [0.6, 2.2], 104, { cx: 480 });
  }

  /* ═════════════════ 第 2 步：燃燒與沼氣（化學能 → 熱能 → 電能） ═════════════════ */
  const GY2 = 400;
  const BO = { x: 205, y: 232, w: 96, h: 122 };          /* 鍋爐水箱；下面是燃燒室 */
  const FUEL2 = mkPath([[110, 384], [212, 384]]);
  const STEAM2 = mkPath([[BO.x + BO.w, 252], [340, 252]]);
  const TU = { x: 362, y: 252, r: 23 };
  const GN = { x: 398, y: 232, w: 60, h: 40 };
  const BUL_L = { x: 428, y: 172 };
  const DG = { x: 705, y: 300, w: 100, h: 100, cx: 755 }; /* 發酵槽 */
  const MAN2 = mkPath([[600, 394], [708, 394]]);
  const GASP = mkPath([[790, 268], [826, 268], [826, 300], [846, 300]]);
  const GR = { x: 846, y: 280, w: 70, h: 56 };
  const BUL_R = { x: 881, y: 228 };
  function cow(c, x, y, u) {        /* 乳牛：白底黑斑 */
    const bob = 1.5 * Math.sin(u * 2.2);
    c.strokeStyle = '#d8dcd6'; c.lineWidth = 5; c.lineCap = 'round';
    [-24, -12, 14, 26].forEach(dx => { c.beginPath(); c.moveTo(x + dx, y + 12); c.lineTo(x + dx, y + 34); c.stroke(); });
    c.fillStyle = '#eef0ea'; W5.rr(c, x - 34, y - 18, 72, 34, 14); c.fill();
    c.fillStyle = '#2b3330';
    c.beginPath(); c.ellipse(x - 14, y - 6, 10, 7, 0.3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + 16, y + 2, 9, 6, -0.4, 0, TAU); c.fill();
    c.save(); c.translate(x + 42, y - 14 + bob);
    c.fillStyle = '#eef0ea'; W5.rr(c, -8, -10, 22, 24, 8); c.fill();
    c.fillStyle = '#f2b6b6'; W5.rr(c, -4, 6, 18, 10, 5); c.fill();
    c.fillStyle = '#2b3330'; c.beginPath(); c.arc(6, -2, 2.4, 0, TAU); c.fill();
    c.strokeStyle = '#d9c9a0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-4, -10); c.lineTo(-8, -17); c.moveTo(8, -10); c.lineTo(12, -17); c.stroke();
    c.restore();
    c.strokeStyle = '#eef0ea'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 34, y - 10); c.quadraticCurveTo(x - 44, y + 2 + 3 * Math.sin(u * 3), x - 40, y + 16); c.stroke();
  }
  function pig(c, x, y, u) {        /* 豬：粉紅 */
    const bob = 1.2 * Math.sin(u * 2.6 + 1);
    c.strokeStyle = '#d98a9c'; c.lineWidth = 5; c.lineCap = 'round';
    [-14, -4, 8, 16].forEach(dx => { c.beginPath(); c.moveTo(x + dx, y + 8); c.lineTo(x + dx, y + 20); c.stroke(); });
    c.fillStyle = '#f2a7b8'; c.beginPath(); c.ellipse(x, y, 26, 15, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(x + 26, y - 4 + bob, 11, 0, TAU); c.fill();
    c.fillStyle = '#e48aa0'; c.beginPath(); c.ellipse(x + 36, y - 2 + bob, 4.5, 5.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#2b3330'; c.beginPath(); c.arc(x + 28, y - 8 + bob, 1.8, 0, TAU); c.fill();
    c.fillStyle = '#f2a7b8'; c.beginPath(); c.moveTo(x + 20, y - 12 + bob); c.lineTo(x + 24, y - 20 + bob); c.lineTo(x + 28, y - 13 + bob); c.fill();
    c.strokeStyle = '#f2a7b8'; c.lineWidth = 2; c.beginPath(); c.arc(x - 29, y - 3, 4, 0, Math.PI * 1.5); c.stroke();
  }
  function genBox(c, x, y, w, h, th, lit) {    /* 發電機：外殼＋轉動的線圈示意 */
    c.fillStyle = SHELL; W5.rr(c, x, y, w, h, 8); c.fill();
    c.strokeStyle = METAL; c.lineWidth = 2.5; c.stroke();
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.32;
    if (lit > 0.02) W5.glow(c, cx, cy, r * 2.2, ENE, 0.5 * lit);
    c.strokeStyle = '#d08a4a'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
    c.strokeStyle = mixHex('#cfe0da', ENE, lit); c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); c.lineTo(cx - Math.cos(th) * r, cy - Math.sin(th) * r); c.stroke();
  }
  function step2(c, s) {
    const u = s.u, k = s.k;
    /* 左：燃燒 */
    const fuelA = seg(u, 0.4, 0.9), fire = ease(seg(u, 0.9, 1.8)), boil = ease(seg(u, 1.6, 2.6));
    const stA = seg(u, 2.2, 2.7), thL = spin(u, 2.4, 1.2, 7), litL = ease(seg(u, 3.2, 3.8));
    /* 右：沼氣 */
    const manA = seg(u, 0.7, 1.2), bub = seg(u, 1.4, 2.0), gasA = seg(u, 2.4, 2.9);
    const burnR = ease(seg(u, 2.9, 3.5)), thR = spin(u, 3.0, 1.0, 7), litR = ease(seg(u, 3.5, 4.1));

    /* 中央分隔線 */
    withA(c, k, () => {
      c.save(); c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; c.setLineDash([8, 8]);
      c.beginPath(); c.moveTo(480, 140); c.lineTo(480, 436); c.stroke(); c.restore();
      ground(c, 30, 466, GY2); ground(c, 494, 930, GY2);
    });

    /* ── 左：植物當燃料 → 鍋爐 → 渦輪 → 發電機 ── */
    withA(c, k, () => {
      /* 燃料堆：柳樹木屑＋稻稈 */
      for (let i = 0; i < 11; i++) lump(c, 48 + 58 * hash(i + 3), 392 - 26 * hash(i + 17) * (1 - Math.abs(hash(i + 3) - 0.5)), 7 + 3 * hash(i + 9), i * 1.7, '#b07a4a', '#e0b07a');
      c.strokeStyle = '#d9c27a'; c.lineWidth = 2.5; c.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const x0 = 108 + 6 * i + 3 * hash(i + 50), y0 = 397;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 6 - 12 * hash(i + 60), y0 - 24 - 10 * hash(i + 70)); c.stroke();
      }
      c.strokeStyle = '#b39a52'; c.lineWidth = 3; c.beginPath(); c.moveTo(106, 386); c.lineTo(166, 386); c.stroke();
      /* 化學能小方塊：燃料裡存的能量 */
      cube(c, 92, 340, 22, 1); cube(c, 118, 344, 22, 1);
      /* 燃燒室 */
      c.fillStyle = '#1a2622'; W5.rr(c, BO.x, BO.y + BO.h + 2, BO.w, GY2 - BO.y - BO.h - 2, 8); c.fill();
      c.save(); W5.rr(c, BO.x, BO.y + BO.h + 2, BO.w, GY2 - BO.y - BO.h - 2, 8); c.clip();
      if (fire > 0.02) {
        W5.glow(c, BO.x + BO.w / 2, GY2 - 4, 70, HEAT, 0.6 * fire);
        for (let i = 0; i < 5; i++) flame(c, BO.x + 14 + i * 17, GY2 - 4, 8 * fire, u + i, '#ff7a3a', '#ffd27a');
      }
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 2.5; W5.rr(c, BO.x, BO.y + BO.h + 2, BO.w, GY2 - BO.y - BO.h - 2, 8); c.stroke();
      /* 鍋爐水箱 */
      c.fillStyle = '#1f2f2b'; W5.rr(c, BO.x, BO.y, BO.w, BO.h, 12); c.fill();
      c.save(); W5.rr(c, BO.x, BO.y, BO.w, BO.h, 12); c.clip();
      c.fillStyle = mixHex(WATER, '#e07a5a', 0.55 * boil); c.fillRect(BO.x, BO.y + 44, BO.w, BO.h - 44);
      if (boil > 0.05) for (let i = 0; i < 9; i++) {
        const ph = (u * 0.9 + hash(i + 80)) % 1;
        c.save(); c.globalAlpha *= boil * Math.sin(ph * Math.PI);
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(BO.x + 12 + 72 * hash(i + 90), BO.y + BO.h - 6 - ph * (BO.h - 52), 3 + 2 * ph, 0, TAU); c.stroke(); c.restore();
      }
      if (boil > 0.05) for (let i = 0; i < 4; i++) {
        const ph = (u * 0.6 + hash(i + 120)) % 1;
        puff(c, BO.x + 20 + 56 * hash(i + 130), BO.y + 38 - ph * 22, 6 + 4 * ph, STEAM, 0.5 * boil * Math.sin(ph * Math.PI));
      }
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, BO.x, BO.y, BO.w, BO.h, 12); c.stroke();
      /* 蒸氣管 */
      pipe(c, STEAM2, '#24413a', 10);
    });
    /* 燃料送進燃燒室 */
    withA(c, k * fuelA, () => {
      along(FUEL2, u, 4, 28, (x, y, i, f) => {
        c.save(); c.globalAlpha *= Math.min(1, (1 - f) * 5);
        lump(c, x, y - 4, 6, i * 2.3, '#b07a4a', '#e0b07a'); c.restore();
      });
      W5.arrow(c, 170, 372, 200, 372, CHEM, 3, 10);
    });
    withA(c, k * stA, () => {
      along(STEAM2, u, 3, 45, (x, y, i, f) => puff(c, x, y, 4.5, STEAM, 0.85 * Math.sin(f * Math.PI)));
    });
    withA(c, k, () => {
      /* 渦輪 */
      c.fillStyle = SHELL; c.beginPath(); c.arc(TU.x, TU.y, TU.r + 4, 0, TAU); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 2.5; c.stroke();
      c.save(); c.translate(TU.x, TU.y); c.rotate(thL);
      c.fillStyle = '#cfe0da';
      for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.ellipse(TU.r * 0.5, 0, TU.r * 0.45, 5, 0.35, 0, TAU); c.fill(); }
      c.restore();
      c.fillStyle = METAL; c.beginPath(); c.arc(TU.x, TU.y, 4, 0, TAU); c.fill();
      /* 轉軸 */
      c.strokeStyle = METAL; c.lineWidth = 5; c.beginPath(); c.moveTo(TU.x + TU.r + 4, TU.y); c.lineTo(GN.x, TU.y); c.stroke();
      genBox(c, GN.x, GN.y, GN.w, GN.h, thL, litL);
      wire(c, [[GN.x + GN.w / 2, GN.y], [BUL_L.x, BUL_L.y + 24]], litL);
      bulb(c, BUL_L.x, BUL_L.y, litL);
    });

    /* ── 右：畜牧場 → 發酵槽 → 沼氣 → 發電機 ── */
    withA(c, k, () => {
      /* 柵欄 */
      c.strokeStyle = '#8a6a4a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(500, 352); c.lineTo(588, 352); c.moveTo(500, 372); c.lineTo(588, 372);
      for (let x = 504; x <= 584; x += 20) { c.moveTo(x, 344); c.lineTo(x, GY2); }
      c.stroke();
      cow(c, 548, 360, u);
      pig(c, 630, 378, u);
      /* 排泄物溝 */
      c.fillStyle = SOIL; W5.rr(c, 596, 388, 112, 12, 4); c.fill();
      /* 發酵槽：槽體＋圓頂 */
      c.fillStyle = '#26342f';
      c.beginPath(); c.moveTo(DG.x, DG.y + DG.h); c.lineTo(DG.x, DG.y); c.arc(DG.cx, DG.y, DG.w / 2, Math.PI, 0); c.lineTo(DG.x + DG.w, DG.y + DG.h); c.closePath(); c.fill();
      c.save(); c.beginPath(); c.moveTo(DG.x, DG.y + DG.h); c.lineTo(DG.x, DG.y); c.arc(DG.cx, DG.y, DG.w / 2, Math.PI, 0); c.lineTo(DG.x + DG.w, DG.y + DG.h); c.closePath(); c.clip();
      /* 頂部集氣（沼氣） */
      c.fillStyle = W5.rgba(GAS, 0.28 * bub); c.fillRect(DG.x, DG.y - 52, DG.w, 82);
      /* 排泄物漿 */
      c.fillStyle = '#6b4a2e'; c.fillRect(DG.x, DG.y + 30 + 2 * Math.sin(u * 2), DG.w, DG.h);
      for (let i = 0; i < 10; i++) {          /* 甲烷氣泡往上冒 */
        const ph = (u * 0.55 + hash(i + 200)) % 1, y = DG.y + DG.h - 6 - ph * (DG.h + 20);
        c.save(); c.globalAlpha *= bub * Math.sin(ph * Math.PI);
        c.fillStyle = W5.rgba(GAS, 0.85); c.beginPath(); c.arc(DG.x + 14 + 72 * hash(i + 210) + 3 * Math.sin(u * 3 + i), y, 3.5 + 3 * hash(i + 220), 0, TAU); c.fill();
        c.restore();
      }
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 3;
      c.beginPath(); c.moveTo(DG.x, DG.y + DG.h); c.lineTo(DG.x, DG.y); c.arc(DG.cx, DG.y, DG.w / 2, Math.PI, 0); c.lineTo(DG.x + DG.w, DG.y + DG.h); c.stroke();
      /* 沼氣管 */
      pipe(c, GASP, '#2c3d2f', 8);
      /* 發電機（燒沼氣）：小窗看得到火 */
      c.fillStyle = SHELL; W5.rr(c, GR.x, GR.y, GR.w, GR.h, 8); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#1a2622'; W5.rr(c, GR.x + 8, GR.y + 10, 24, 36, 5); c.fill();
      c.save(); W5.rr(c, GR.x + 8, GR.y + 10, 24, 36, 5); c.clip();
      if (burnR > 0.02) { W5.glow(c, GR.x + 20, GR.y + 44, 30, HEAT, 0.6 * burnR); flame(c, GR.x + 20, GR.y + 44, 8 * burnR, u, '#5ab8e8', '#e8f6ff'); }
      c.restore();
      const cx = GR.x + 52, cy = GR.y + 28, r = 11;
      if (litR > 0.02) W5.glow(c, cx, cy, 26, ENE, 0.5 * litR);
      c.strokeStyle = '#d08a4a'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      c.strokeStyle = mixHex('#cfe0da', ENE, litR);
      c.beginPath(); c.moveTo(cx + Math.cos(thR) * r, cy + Math.sin(thR) * r); c.lineTo(cx - Math.cos(thR) * r, cy - Math.sin(thR) * r); c.stroke();
      wire(c, [[BUL_R.x, GR.y], [BUL_R.x, BUL_R.y + 24]], litR);
      bulb(c, BUL_R.x, BUL_R.y, litR);
    });
    /* 排泄物送進發酵槽 */
    withA(c, k * manA, () => {
      along(MAN2, u, 4, 24, (x, y, i, f) => {
        c.save(); c.globalAlpha *= Math.min(1, (1 - f) * 6);
        lump(c, x, y, 5.5, i * 1.9 + 4, '#7a5636', '#a37a52'); c.restore();
      });
    });
    /* 沼氣沿管子送到發電機 */
    withA(c, k * gasA, () => {
      along(GASP, u, 4, 40, (x, y, i, f) => {
        c.save(); c.globalAlpha *= Math.sin(f * Math.PI); c.fillStyle = GAS;
        c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); c.restore();
      });
    });

    /* 標籤（左） */
    P(c, k, L('植物當燃料', 'Plants as fuel'), 100, 300, CHEM, 20);
    T(c, k, L('柳樹木屑、稻稈', 'Willow chips, rice straw'), 130, 424, WHITE, 20);
    T(c, k, L('鍋爐', 'Boiler'), BO.x + BO.w / 2, 210, WHITE, 20);
    T(c, k, L('渦輪', 'Turbine'), TU.x, 212, WHITE, 20);
    T(c, k, L('發電機', 'Generator'), GN.x + GN.w / 2, 296, WHITE, 20);
    T(c, k * stA, L('蒸氣', 'Steam'), 306, 300, STEAM, 20, 'left');
    /* 標籤（右） */
    P(c, k, L('畜牧場（牛、豬）', 'Farm (cows, pigs)'), 592, 300, WHITE, 20);
    T(c, k * manA, L('排泄物', 'Manure'), 655, 424, '#d9b48a', 20);
    T(c, k, L('發酵槽', 'Digester'), DG.cx, 424, WHITE, 20);
    T(c, k * bub, L('沼氣（甲烷）', 'Biogas (methane)'), DG.cx, 228, GAS, 20);
    T(c, k, L('發電機', 'Generator'), GR.x + GR.w / 2, 360, WHITE, 20);

    const CH = [['化學能', 'Chemical', CHEM], ['熱能', 'Heat', HEAT], ['電能', 'Electrical', ENE]];
    chain(c, k, u, CH, [0.6, 1.4, 3.2], 104, { cx: 252, sz: 20, gap: 34 });
    chain(c, k, u, CH, [0.9, 2.9, 3.5], 104, { cx: 712, sz: 20, gap: 34 });
  }

  /* ═════════════════ 第 3 步：生質燃料 ═════════════════ */
  const GY3 = 400;
  const HARV = mkPath([[244, 352], [286, 352]]);
  const ETH1 = mkPath([[374, 354], [420, 354]]);
  const ETH2 = mkPath([[490, 362], [546, 362]]);
  const FUEL3 = mkPath([[616, 392], [728, 392]]);
  const FM = { x: 290, y: 302, w: 80, h: 98 };          /* 發酵槽 */
  const FL = { x: 455, y: 398 };                         /* 生質酒精燒瓶（底部中心） */
  const CAN = { x: 550, y: 326, w: 62, h: 70 };
  const CAR = { x: 735, y: 348 };
  /* 碳循環：從車子排氣往上，越過畫面，回到田裡（三次貝茲） */
  const CC = [[722, 340], [722, 122], [175, 122], [175, 266]];
  function bez(t) {
    const m = 1 - t, a = m * m * m, b = 3 * m * m * t, cc = 3 * m * t * t, d = t * t * t;
    return { x: a * CC[0][0] + b * CC[1][0] + cc * CC[2][0] + d * CC[3][0], y: a * CC[0][1] + b * CC[1][1] + cc * CC[2][1] + d * CC[3][1] };
  }
  function cane(c, x, h, i, u) {     /* 甘蔗：一節一節的莖＋長葉 */
    const top = GY3 - h, sw = 2 * Math.sin(u * 1.4 + i);
    c.strokeStyle = '#8fbf4f'; c.lineWidth = 7; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x, GY3); c.lineTo(x + sw * 0.4, top); c.stroke();
    c.strokeStyle = '#4d7a2a'; c.lineWidth = 2;
    for (let y = GY3 - 16; y > top + 6; y -= 18) { c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.stroke(); }
    c.strokeStyle = '#3fae5f'; c.lineWidth = 3; c.lineCap = 'round';
    [[-1, 0.15], [1, 0.3], [-1, 0.5], [1, 0.05]].forEach(q => {
      c.beginPath(); c.moveTo(x + sw * 0.4, top + h * q[1]);
      c.quadraticCurveTo(x + q[0] * 18 + sw, top + h * q[1] - 16, x + q[0] * 28 + sw, top + h * q[1] + 6); c.stroke();
    });
  }
  function corn(c, x, h, i, u) {     /* 玉米：莖＋葉＋黃色玉米穗 */
    const top = GY3 - h, sw = 2 * Math.sin(u * 1.2 + i + 2);
    c.strokeStyle = '#6fa848'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, GY3); c.lineTo(x + sw * 0.4, top); c.stroke();
    c.strokeStyle = '#46b866'; c.lineWidth = 3;
    [[-1, 0.25], [1, 0.45], [-1, 0.65]].forEach(q => {
      c.beginPath(); c.moveTo(x, top + h * q[1]);
      c.quadraticCurveTo(x + q[0] * 16 + sw, top + h * q[1] - 12, x + q[0] * 24 + sw, top + h * q[1] + 10); c.stroke();
    });
    if (h > 40) {
      const cy = top + h * 0.45;
      c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(x + 7, cy, 5, 12, 0.25, 0, TAU); c.fill();
      c.strokeStyle = '#6fa848'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2, cy + 12); c.quadraticCurveTo(x + 12, cy, x + 9, cy - 14); c.stroke();
    }
    c.strokeStyle = '#d9c27a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + sw * 0.4, top); c.lineTo(x - 5 + sw * 0.4, top - 8); c.moveTo(x + sw * 0.4, top); c.lineTo(x + 5 + sw * 0.4, top - 8); c.stroke();
  }
  function car(c, x, y, u, run) {    /* 小汽車（車頭向右），輪子依車速轉 */
    c.fillStyle = '#5e88a8'; W5.rr(c, x + 24, y - 26, 80, 30, 10); c.fill();
    c.fillStyle = '#bfe3f2'; W5.rr(c, x + 32, y - 20, 30, 18, 4); c.fill(); W5.rr(c, x + 68, y - 20, 28, 18, 4); c.fill();
    c.fillStyle = '#7aa6c6'; W5.rr(c, x, y, 132, 36, 12); c.fill();
    c.strokeStyle = '#d9ecf5'; c.lineWidth = 2; W5.rr(c, x, y, 132, 36, 12); c.stroke();
    c.fillStyle = '#fff2a0'; W5.rr(c, x + 122, y + 8, 9, 8, 3); c.fill();
    c.fillStyle = '#ff8a8a'; W5.rr(c, x + 1, y + 8, 7, 8, 3); c.fill();
    c.fillStyle = '#6d817a'; c.fillRect(x - 6, y + 26, 10, 5);
    const ang = run;
    [[x + 30, y + 38], [x + 104, y + 38]].forEach(w => {
      c.fillStyle = '#26302d'; c.beginPath(); c.arc(w[0], w[1], 13, 0, TAU); c.fill();
      c.fillStyle = '#9fb1aa'; c.beginPath(); c.arc(w[0], w[1], 6, 0, TAU); c.fill();
      c.strokeStyle = '#26302d'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const a = ang + i * TAU / 3; c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[0] + Math.cos(a) * 6, w[1] + Math.sin(a) * 6); c.stroke(); }
    });
  }
  function arrowFlow(c, path, col, u, a) {
    withA(c, a, () => {
      c.save(); c.strokeStyle = col; c.lineWidth = 3; c.setLineDash([8, 7]); c.lineDashOffset = -u * 30; c.lineCap = 'round';
      subPath(c, path, 0, path.len - 8); c.stroke(); c.restore();
      const n = path.P.length; W5.arrow(c, path.P[n - 2].x, path.P[n - 2].y, path.P[n - 1].x, path.P[n - 1].y, col, 3, 11);
    });
  }
  function step3(c, s) {
    const u = s.u, k = s.k;
    const grow = ease(seg(u, 0.2, 1.4));
    const harv = seg(u, 1.2, 1.6), ferm = ease(seg(u, 1.5, 2.3));
    const eth = ease(seg(u, 2.2, 3.2)), blend = ease(seg(u, 3.0, 4.0));
    const fuelA = seg(u, 3.8, 4.2), drive = ease(seg(u, 4.0, 5.0));
    const cyc = ease(seg(u, 4.6, 5.8));
    const runD = spin(u, 4.0, 1.0, 9);       /* 車輪轉角＝路面捲動距離 / 半徑 */

    withA(c, k, () => {
      ground(c, 30, 620, GY3);
      /* 馬路 */
      c.fillStyle = '#2b3532'; c.fillRect(620, GY3, 310, 16);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(620, GY3); c.lineTo(930, GY3); c.stroke();
      c.save(); c.beginPath(); c.rect(620, GY3, 310, 16); c.clip();
      c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 3;
      const off = (runD * 13) % 48;
      for (let x = 620 - off; x < 940; x += 48) { c.beginPath(); c.moveTo(x, GY3 + 9); c.lineTo(x + 24, GY3 + 9); c.stroke(); }
      c.restore();
      /* 田：甘蔗、玉米 */
      [62, 96, 130].forEach((x, i) => cane(c, x, 104 * (0.35 + 0.65 * grow) * (0.92 + 0.12 * hash(i + 300)), i, u));
      [172, 204, 236].forEach((x, i) => corn(c, x, 96 * (0.35 + 0.65 * grow) * (0.92 + 0.12 * hash(i + 310)), i, u));
      /* 發酵槽 */
      c.fillStyle = '#26342f'; W5.rr(c, FM.x, FM.y, FM.w, FM.h, 12); c.fill();
      c.save(); W5.rr(c, FM.x, FM.y, FM.w, FM.h, 12); c.clip();
      c.fillStyle = mixHex('#6f8f3a', '#c8b25a', ferm); c.fillRect(FM.x, FM.y + 34, FM.w, FM.h);
      if (ferm > 0.02) for (let i = 0; i < 8; i++) {
        const ph = (u * 0.7 + hash(i + 400)) % 1;
        c.save(); c.globalAlpha *= ferm * Math.sin(ph * Math.PI);
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(FM.x + 10 + 60 * hash(i + 410), FM.y + FM.h - 6 - ph * (FM.h - 40), 2.5 + 2 * ph, 0, TAU); c.stroke(); c.restore();
      }
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, FM.x, FM.y, FM.w, FM.h, 12); c.stroke();
      /* 生質酒精燒瓶 */
      const fx = FL.x, fy = FL.y;
      const flask = () => { c.beginPath(); c.moveTo(fx - 9, fy - 82); c.lineTo(fx - 9, fy - 52); c.lineTo(fx - 32, fy - 4); c.quadraticCurveTo(fx - 33, fy, fx - 28, fy); c.lineTo(fx + 28, fy); c.quadraticCurveTo(fx + 33, fy, fx + 32, fy - 4); c.lineTo(fx + 9, fy - 52); c.lineTo(fx + 9, fy - 82); };
      c.save(); flask(); c.clip();
      c.fillStyle = 'rgba(30,48,42,0.9)'; c.fillRect(fx - 40, fy - 90, 80, 92);
      const lv = 44 * eth;
      if (lv > 0.5) { c.fillStyle = '#eef6cf'; c.fillRect(fx - 40, fy - lv, 80, lv + 2); W5.glow(c, fx, fy - lv / 2, 30, CHEM, 0.35 * eth); }
      c.restore();
      flask(); c.strokeStyle = '#cfe0da'; c.lineWidth = 2.5; c.stroke();
      /* 小油罐：汽油（下層）＋生質酒精（上層） */
      c.save(); W5.rr(c, CAN.x, CAN.y, CAN.w, CAN.h, 9); c.clip();
      c.fillStyle = '#1f2f2b'; c.fillRect(CAN.x, CAN.y, CAN.w, CAN.h);
      c.fillStyle = '#c98a3a'; c.fillRect(CAN.x, CAN.y + CAN.h - 36, CAN.w, 36);
      const bl = 20 * blend;
      if (bl > 0.5) { c.fillStyle = '#eef6cf'; c.fillRect(CAN.x, CAN.y + CAN.h - 36 - bl, CAN.w, bl); }
      c.restore();
      if (blend > 0.02) withA(c, blend * (0.7 + 0.3 * Math.sin(u * 3)), () => W5.glow(c, CAN.x + CAN.w / 2, CAN.y + CAN.h - 30, 46, CHEM, 0.4));
      c.strokeStyle = '#d9e2dd'; c.lineWidth = 3; W5.rr(c, CAN.x, CAN.y, CAN.w, CAN.h, 9); c.stroke();
      c.fillStyle = METAL; W5.rr(c, CAN.x + 6, CAN.y - 12, 16, 12, 3); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 4; c.beginPath(); c.moveTo(CAN.x + 30, CAN.y); c.lineTo(CAN.x + 30, CAN.y - 10); c.lineTo(CAN.x + 52, CAN.y - 10); c.lineTo(CAN.x + 52, CAN.y); c.stroke();
    });
    /* 流程箭頭與移動的東西 */
    arrowFlow(c, HARV, '#7ddc8a', u, k * harv);
    withA(c, k * harv, () => along(HARV, u, 2, 22, (x, y, i, f) => { c.save(); c.globalAlpha *= Math.sin(f * Math.PI); c.fillStyle = i ? '#f2c94c' : '#8fbf4f'; W5.rr(c, x - 6, y - 14, 12, 8, 3); c.fill(); c.restore(); }));
    arrowFlow(c, ETH1, '#eef6cf', u, k * seg(u, 2.0, 2.4));
    arrowFlow(c, ETH2, '#eef6cf', u, k * seg(u, 2.9, 3.3));
    arrowFlow(c, FUEL3, CHEM, u, k * fuelA);
    /* 車：排氣 */
    withA(c, k * drive, () => {
      for (let i = 0; i < 5; i++) {
        const ph = (u * 0.7 + i / 5) % 1;
        puff(c, CAR.x - 8 - ph * 10, CAR.y + 26 - ph * 50, 5 + 6 * ph, SMOKE, 0.55 * Math.sin(ph * Math.PI));
      }
    });
    withA(c, k, () => {
      const bounce = drive * 1.2 * Math.sin(u * 14);
      car(c, CAR.x, CAR.y + bounce, u, runD);
      if (drive > 0.02) {   /* 速度線 */
        c.save(); c.globalAlpha *= drive * 0.6; c.strokeStyle = WHITE; c.lineWidth = 2; c.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const o = (u * 80 + i * 26) % 60; c.beginPath(); c.moveTo(CAR.x + 140 + o * 0.2, CAR.y + 8 + i * 9); c.lineTo(CAR.x + 156 + o * 0.5, CAR.y + 8 + i * 9); c.stroke(); }
        c.restore();
      }
    });
    /* 碳循環：排氣的二氧化碳 → 植物生長時吸收 */
    withA(c, k * cyc, () => {
      c.save(); c.strokeStyle = W5.rgba(SMOKE, 0.75); c.lineWidth = 3; c.setLineDash([10, 8]); c.lineDashOffset = -u * 30; c.lineCap = 'round';
      c.beginPath(); c.moveTo(CC[0][0], CC[0][1]); c.bezierCurveTo(CC[1][0], CC[1][1], CC[2][0], CC[2][1], CC[3][0], CC[3][1] - 8); c.stroke(); c.restore();
      const e0 = bez(0.97); W5.arrow(c, e0.x, e0.y, CC[3][0], CC[3][1], SMOKE, 3, 12);
      for (let i = 0; i < 6; i++) {
        const f = (u * 0.12 + i / 6) % 1, p = bez(f);
        co2mol(c, p.x, p.y, Math.sin(f * Math.PI));
      }
    });

    T(c, k, L('甘蔗', 'Sugarcane'), 96, 424, '#8fbf4f', 20);
    T(c, k, L('玉米', 'Corn'), 204, 424, '#f2c94c', 20);
    T(c, k * harv, L('發酵', 'Fermenting'), FM.x + FM.w / 2, 278, WHITE, 20);
    T(c, k * seg(u, 2.2, 2.7), L('生質酒精', 'Bioethanol'), FL.x, 274, '#eef6cf', 20);
    T(c, k * seg(u, 3.0, 3.5), L('汽油＋生質酒精', 'Gasoline + bioethanol'), CAN.x + CAN.w / 2, 300, CHEM, 20);
    T(c, k * seg(u, 4.0, 4.5), L('車輛動力燃料', 'Fuel for vehicles'), 815, 300, WHITE, 20);
    P(c, k * cyc, L('碳循環', 'Carbon cycle'), 448, 204, SMOKE, 20);
    T(c, k * cyc, L('燃燒時放出 CO₂', 'Burning releases CO₂'), 738, 232, SMOKE, 20, 'left');
    T(c, k * cyc, L('生長時吸收 CO₂', 'Plants absorb CO₂'), 112, 172, SMOKE, 20);
    P(c, k * seg(u, 5.0, 5.5), L('替代化石燃料的選擇之一', 'One option to replace fossil fuels'), 935, 104, REN, 20, 'right');

    chain(c, k, u, [['化學能', 'Chemical', CHEM], ['動能', 'Kinetic', ENE]], [3.4, 4.2], 104, { x0: 40 });
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['光合作用：把光能存進植物', 'Photosynthesis stores light energy in plants'],
      sub: ['葉綠體利用日光，把水和二氧化碳變成葡萄糖，並放出氧氣', 'Using sunlight, chloroplasts turn water and carbon dioxide into glucose and release oxygen.'],
      con: ['結論：光能 → 化學能，能量以葡萄糖的形式存在植物體內', 'Conclusion: light → chemical energy, stored in the plant as glucose.'] },
    { title: ['燃燒與沼氣：化學能變成電能', 'Burning and biogas: chemical energy into electricity'],
      sub: ['左：木屑、稻稈在鍋爐燃燒，把水煮成蒸氣推動渦輪；右：牛、豬的排泄物發酵產生沼氣，送去發電', 'Left: wood chips and straw burn in a boiler, and the steam spins a turbine. Right: manure ferments into biogas that runs a generator.'],
      con: ['結論：兩條路都是 化學能 → 熱能 → 電能，廢棄物也能變成能源', 'Conclusion: both routes go chemical → heat → electrical, and waste becomes a source of energy.'] },
    { title: ['生質燃料：作物變成車子的燃料', 'Biofuel: crops become fuel for cars'],
      sub: ['甘蔗、玉米經過發酵做成生質酒精，加進汽油裡，給車輛當動力燃料', 'Sugarcane and corn are fermented into bioethanol, which is blended into gasoline to power vehicles.'],
      con: ['結論：生質燃料是替代化石燃料的選擇之一；植物生長時吸收二氧化碳，燃燒時再放出', 'Conclusion: biofuel is one option for replacing fossil fuels; plants absorb CO₂ as they grow, and burning releases it again.'] }
  ];

  W5.register('biomass', {
    canvas: 'cvs-biomass',
    steps: DUR,
    draw(c, s) {
      const n = s.n, u = s.u, k = s.k;
      if (n === 1) step1(c, s);
      else if (n === 2) step2(c, s);
      else step3(c, s);

      const X = TXT[n - 1];
      P(c, k, L(X.title[0], X.title[1]), 480, 52, WHITE, 24);
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), GOOD);
    }
  });
})();
