/* ==================================================================
   work_5 ｜ 太陽能（cvs-solar，960×540）
   四步：1 太陽能變熱（熱水器、太陽爐；光能→熱能） → 2 太陽能板直接發電（光能→電能）
        → 3 為什麼斜放？水面型怎麼降溫（板溫↓效率↑；夜間無法發電） → 4 太陽能發電的三種方法
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 thermal／hydrowind 一致）：能量／太陽＝黃 ENE、熱＝橘紅 HEAT、水＝藍 WATER、
   水氣＝淡青白 VAPOR、再生能源＝綠 REN #33cc99；冷＝藍 COLD。
   發電不畫電子、不畫電流小點：只用燈泡亮度、導線微光與輸出波形表示（比照 thermal／hydrowind）。

   純函式作法：所有畫面都由 s 算出；持續的小動畫（光子、蒸氣、轉動）一律用該步秒數 s.u 的純函式，
   跳步驟不走樣；亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；畫布字 ≥ 20px；
   畫布頂端 0～30px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量／太陽：黃 */
  const HEAT = '#ff6a3d';            /* 熱：橘紅 */
  const WATER = '#5ab8e8';           /* 水：藍 */
  const VAPOR = '#d8f3f0';           /* 水氣：淡青白 */
  const STEAM = '#e8f1f4';           /* 蒸氣：淡白 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const COLD = '#72b9ff', CAUTION = '#fb923c';
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const GROUND = '#2c4a3a', GROUND_EDGE = '#5f8a6c';
  const ABSORB = '#161c1b';          /* 集熱板的黑色吸熱面（不用純黑） */
  const CELL = '#1f4f8c', CELL_HI = '#3a78c2', CELL_LINE = '#9cc3ea';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

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
  /* 底部字幕：說明一般框、結論綠框（同 thermal／hydrowind） */
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

  /* ── 路徑工具（同 thermal／hydrowind） ── */
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
  function flow(c, path, col, off, gap, dash, w, a) {
    if (a != null && a <= 0.02) return;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0 - gap; d < path.len; d += gap) {
      const p = Math.max(0, d), q = Math.min(path.len, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
    }
    c.restore();
  }
  /* 線段（導線）：灰底，通電時同一條線轉亮黃（不畫電流小點） */
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
  /* 光線：從 (x0,y0) 往 (x1,y1) 長出 frac，虛線流動；長到底才畫箭頭 */
  function ray(c, x0, y0, x1, y1, frac, col, off, a, head) {
    if (frac <= 0.01) return;
    withA(c, a, () => {
      const xe = lerp(x0, x1, frac), ye = lerp(y0, y1, frac);
      c.strokeStyle = col; c.lineWidth = 3.2; c.lineCap = 'round'; c.setLineDash([12, 9]); c.lineDashOffset = -off;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
      if (head !== false && frac > 0.97) W5.arrow(c, lerp(x0, x1, 0.9), lerp(y0, y1, 0.9), x1, y1, col, 3.2, 11);
    });
  }
  function bulb(c, bx, by, lit, R) {
    R = R || 17; const s = R / 17;
    if (lit > 0.02) W5.glow(c, bx, by, 48 * s, ENE, 0.75 * lit);
    c.fillStyle = mixHex('#3a4a45', '#fff4b0', lit); c.beginPath(); c.arc(bx, by, R, 0, TAU); c.fill();
    c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7f918a'; c.fillRect(bx - 8 * s, by + 15 * s, 16 * s, 11 * s);
    c.strokeStyle = mixHex('#6d817a', '#ffb000', lit); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx - 6 * s, by + 9 * s); c.lineTo(bx - 3 * s, by - 4 * s); c.lineTo(bx, by + 2 * s); c.lineTo(bx + 3 * s, by - 4 * s); c.lineTo(bx + 6 * s, by + 9 * s); c.stroke();
  }
  function hbar(c, x, y, w, h, f, col) {
    c.fillStyle = INK; W5.rr(c, x, y - h / 2, w, h, h / 2); c.fill();
    if (f > 0.005) {
      c.save(); W5.rr(c, x, y - h / 2, w, h, h / 2); c.clip();
      c.fillStyle = col; c.fillRect(x, y - h / 2, w * clamp01(f), h); c.restore();
    }
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5; W5.rr(c, x, y - h / 2, w, h, h / 2); c.stroke();
  }
  /* 溫度計：直立長條＋底部圓球，顏色由冷（藍）到熱（橘紅） */
  function thermo(c, x, y0, y1, f) {
    const w = 22, col = mixHex(COLD, HEAT, f);
    c.fillStyle = INK; W5.rr(c, x - w / 2, y0, w, y1 - y0, w / 2); c.fill();
    c.beginPath(); c.arc(x, y1 + 8, 17, 0, TAU); c.fill();
    c.save(); W5.rr(c, x - w / 2 + 4, y0 + 4, w - 8, y1 - y0, (w - 8) / 2); c.clip();
    const top = lerp(y1, y0 + 4, clamp01(f));
    c.fillStyle = col; c.fillRect(x - w / 2, top, w, y1 - top + 20); c.restore();
    c.fillStyle = col; c.beginPath(); c.arc(x, y1 + 8, 12, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 1.5;
    W5.rr(c, x - w / 2, y0, w, y1 - y0, w / 2); c.stroke();
    c.beginPath(); c.arc(x, y1 + 8, 17, 0, TAU); c.stroke();
    for (let i = 1; i < 5; i++) { const yy = lerp(y1, y0, i / 5); c.beginPath(); c.moveTo(x + w / 2, yy); c.lineTo(x + w / 2 + 7, yy); c.stroke(); }
  }
  function puff(c, x, y, r, col, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.7, y + r * 0.2, r * 0.75, 0, TAU); c.arc(x - r * 0.6, y + r * 0.25, r * 0.65, 0, TAU); c.fill();
    c.restore();
  }
  /* 平行四邊形太陽能板（斜看）：bl→br 底邊、往 (dx,dy) 斜上；cells 小方格 */
  function panelQuad(c, bl, br, dx, dy, cols, rows, lit) {
    const p = (fu, fv) => [lerp(bl[0], br[0], fu) + dx * fv, lerp(bl[1], br[1], fu) + dy * fv];
    c.fillStyle = '#0f1c2c';
    c.beginPath(); [p(0, 0), p(1, 0), p(1, 1), p(0, 1)].forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill();
    const gu = 0.018, gv = 0.025;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const u0 = i / cols + gu, u1 = (i + 1) / cols - gu, v0 = j / rows + gv, v1 = (j + 1) / rows - gv;
      const q = [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)];
      c.fillStyle = mixHex(CELL, CELL_HI, 0.25 + 0.35 * hash(i * 7 + j * 13 + 900) + 0.25 * lit);
      c.beginPath(); q.forEach((r, m) => m ? c.lineTo(r[0], r[1]) : c.moveTo(r[0], r[1])); c.closePath(); c.fill();
      c.strokeStyle = W5.rgba(CELL_LINE, 0.55); c.lineWidth = 1; c.stroke();
    }
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 3.5; c.lineJoin = 'round';
    c.beginPath(); [p(0, 0), p(1, 0), p(1, 1), p(0, 1)].forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke();
    return p;
  }
  /* 角速度平滑上升的轉角（解析積分） */
  function spin(u, R0, RD, OM) {
    if (u <= R0) return 0;
    const x = (u - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (u - R0 - RD));
  }
  /* 上方能量流轉條：items＝[[中,英,亮起的顏色]]，ats＝各自亮起的秒數（同 hydrowind） */
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

  /* ═════════════════ 第 1 步：太陽能變熱 ═════════════════ */
  const GY = 432;                                            /* 地面 */
  const SUN1 = { x: 64, y: 232, R: 24 };
  const DIR = { x: Math.sin(20 * Math.PI / 180), y: Math.cos(20 * Math.PI / 180) };   /* 平行陽光的前進方向 */
  /* 熱水器：集熱板（斜看的平行四邊形）＋水塔 */
  const CB = { bl: [92, 396], br: [290, 396], dx: 56, dy: -96 };
  const TANK = { x: 136, y: 258, w: 220, h: 38 };
  const DOWN1 = mkPath([[350, 286], [368, 286], [368, 394], [292, 394]]);
  const TH1 = { x: 408, y0: 258, y1: 394 };
  /* 太陽爐：拋物面（局部座標：x 橫、h 沿軸往上），軸朝向陽光來的方向 */
  const DV = { x: 748, y: 404 }, DF = 110, DA = 1 / (4 * DF), DHW = 120;
  const AX = { x: -DIR.x, y: -DIR.y }, RX = { x: DIR.y, y: -DIR.x };
  const dishPt = (x, h) => ({ x: DV.x + x * RX.x + h * AX.x, y: DV.y + x * RX.y + h * AX.y });
  const FOC = dishPt(0, DF);
  const HITS = [-104, -66, 60, 96];
  function collectorPt(fu, fv) { return [lerp(CB.bl[0], CB.br[0], fu) + CB.dx * fv, lerp(CB.bl[1], CB.br[1], fu) + CB.dy * fv]; }
  function step1(c, s) {
    const u = s.u, k = s.k;
    const rayIn = ease(seg(u, 0.5, 1.5));
    const temp = 0.12 + 0.76 * ease(seg(u, 1.4, 6.0));
    const warm = ease(seg(u, 1.3, 3.0));
    const refl = ease(seg(u, 1.5, 2.3));
    const pot = ease(seg(u, 2.2, 4.6));

    withA(c, k, () => {
      /* 地面 */
      c.fillStyle = GROUND; c.fillRect(40, GY, 880, 10);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(40, GY); c.lineTo(920, GY); c.stroke();
      /* 熱水器支架 */
      c.strokeStyle = METAL; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(338, 300); c.lineTo(338, GY); c.moveTo(186, 300); c.lineTo(186, GY - 2); c.moveTo(120, 396); c.lineTo(120, GY); c.moveTo(270, 396); c.lineTo(270, GY); c.stroke();
      /* 冷水下降管（水塔 → 集熱板底部） */
      pipe(c, DOWN1, mixHex(WATER, '#3d6f8f', 0.2), 8);
      flow(c, DOWN1, 'rgba(230,246,255,0.75)', u * 45, 30, 10, 3, warm);
      /* 集熱板：黑色吸熱面＋水管 */
      const q = [collectorPt(0, 0), collectorPt(1, 0), collectorPt(1, 1), collectorPt(0, 1)];
      c.fillStyle = ABSORB; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
      if (warm > 0.02) {
        c.save(); c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.clip();
        W5.glow(c, 218, 348, 140, HEAT, 0.32 * warm); c.restore();
      }
      const NT = 7;
      for (let i = 1; i <= NT; i++) {
        const f = i / (NT + 1), a0 = collectorPt(f, 0.04), a1 = collectorPt(f, 0.96);
        const g = c.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
        g.addColorStop(0, WATER); g.addColorStop(1, mixHex(WATER, HEAT, 0.9 * warm));
        c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
        c.strokeStyle = g; c.lineWidth = 4; c.stroke();
        if (warm > 0.05) {         /* 熱水往上流 */
          const path = mkPath([a0, a1]);
          flow(c, path, 'rgba(255,236,214,0.85)', u * 26 + i * 7, 26, 7, 2, warm);
        }
      }
      /* 上下集水管 */
      const b0 = collectorPt(0, 0.02), b1 = collectorPt(1, 0.02), t0 = collectorPt(0, 0.98), t1 = collectorPt(1, 0.98);
      c.lineCap = 'round';
      c.strokeStyle = WATER; c.lineWidth = 7; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
      c.strokeStyle = mixHex(WATER, HEAT, 0.9 * warm); c.beginPath(); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]); c.stroke();
      c.strokeStyle = '#c9d4d1'; c.lineWidth = 3; c.lineJoin = 'round';
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
      /* 水塔（開一個窗看裡面的水溫） */
      c.fillStyle = SHELL; W5.rr(c, TANK.x, TANK.y, TANK.w, TANK.h, TANK.h / 2); c.fill();
      c.fillStyle = mixHex(WATER, HEAT, temp); W5.rr(c, TANK.x + 26, TANK.y + 9, TANK.w - 52, TANK.h - 18, 8); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, TANK.x, TANK.y, TANK.w, TANK.h, TANK.h / 2); c.stroke();
      /* 溫度計 */
      thermo(c, TH1.x, TH1.y0, TH1.y1, temp);

      /* 太陽爐：支架 */
      c.strokeStyle = METAL; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(DV.x, DV.y); c.lineTo(DV.x - 26, GY); c.moveTo(DV.x, DV.y); c.lineTo(DV.x + 26, GY); c.stroke();
      const arm0 = dishPt(0, 4), arm1 = dishPt(0, DF - 18);
      c.lineWidth = 3; c.beginPath(); c.moveTo(arm0.x, arm0.y); c.lineTo(arm1.x, arm1.y); c.stroke();
      /* 拋物面反射鏡 */
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      for (let x = -DHW; x <= DHW; x += 6) { const p = dishPt(x, DA * x * x); if (x === -DHW) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); }
      c.strokeStyle = INK; c.lineWidth = 11; c.stroke();
      const lg = c.createLinearGradient(dishPt(-DHW, 0).x, 0, dishPt(DHW, 0).x, 0);
      lg.addColorStop(0, '#8fa39c'); lg.addColorStop(0.5, '#f2f6f4'); lg.addColorStop(1, '#8fa39c');
      c.strokeStyle = lg; c.lineWidth = 6; c.stroke();
      c.restore();
    });

    /* 陽光：照在集熱板上 */
    [[0.15, 0.3], [0.35, 0.35], [0.55, 0.35]].forEach((f, i) => {
      const p = collectorPt(f[0], f[1]), an = Math.atan2(p[1] - SUN1.y, p[0] - SUN1.x);
      ray(c, SUN1.x + Math.cos(an) * SUN1.R * 1.7, SUN1.y + Math.sin(an) * SUN1.R * 1.7, p[0], p[1], rayIn, ENE, u * 40 + i * 6, k);
    });
    /* 陽光：照到拋物面，再反射到焦點 */
    HITS.forEach((x, i) => {
      const h = dishPt(x, DA * x * x), L1 = (h.y - 224) / DIR.y;
      ray(c, h.x - DIR.x * L1, h.y - DIR.y * L1, h.x, h.y, rayIn, ENE, u * 40 + i * 5, k, false);
      const dx = FOC.x - h.x, dy = FOC.y - h.y, dl = Math.hypot(dx, dy), stop = (dl - 26) / dl;
      ray(c, h.x, h.y, h.x + dx * stop, h.y + dy * stop, refl, ENE, u * 40 + i * 5, k);
    });

    /* 焦點上的鍋子 */
    withA(c, k, () => {
      if (pot > 0.02) W5.glow(c, FOC.x, FOC.y, 60, HEAT, 0.5 * pot);
      const px = FOC.x, py = FOC.y;
      c.fillStyle = mixHex('#33423e', '#7a3a26', pot); W5.rr(c, px - 23, py - 12, 46, 28, 6); c.fill();
      c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#5d6f69'; W5.rr(c, px - 26, py - 17, 52, 7, 3); c.fill();
      c.fillStyle = '#cfe0da'; c.fillRect(px - 4, py - 22, 8, 5);
      c.strokeStyle = '#cfe0da'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(px - 23, py - 4); c.lineTo(px - 31, py - 4); c.moveTo(px + 23, py - 4); c.lineTo(px + 31, py - 4); c.stroke();
      /* 水煮開冒出的蒸氣 */
      for (let i = 0; i < 6; i++) {
        const ph = (u * 0.6 + hash(i + 40)) % 1;
        puff(c, px - 10 + 20 * hash(i + 50) + 6 * Math.sin(u * 2 + i), py - 26 - ph * 46, 5 + 5 * ph, STEAM, 0.6 * seg(pot, 0.5, 1) * Math.sin(ph * Math.PI));
      }
    });

    sun(c, SUN1.x, SUN1.y, SUN1.R, u, k);
    T(c, k, L('太陽', 'Sun'), SUN1.x, SUN1.y - 54, ENE, 20);
    P(c, k, L('太陽能熱水器', 'Solar water heater'), 246, 200, WHITE, 20);
    T(c, k, L('水塔', 'Water tank'), 246, 240, WHITE, 20);
    T(c, k * seg(u, 0.4, 0.9), L('黑色集熱板', 'Black collector'), 190, 415, WHITE, 20);
    T(c, k, L('水溫', 'Water temp.'), TH1.x, 230, mixHex(COLD, HEAT, temp), 20);
    P(c, k, L('太陽爐', 'Solar cooker'), 748, 200, WHITE, 20);
    T(c, k * refl, L('焦點', 'Focus'), FOC.x - 18, FOC.y - 40, ENE, 20, 'right');
    T(c, k, L('反射面', 'Reflector'), 866, 392, WHITE, 20);

    chain(c, k, u, [['光能', 'Light', ENE], ['熱能', 'Heat', HEAT]], [0.6, 2.4], 104);
  }

  /* ═════════════════ 第 2 步：太陽能板直接發電 ═════════════════ */
  const SUN2 = { x: 95, y: 168, R: 28 };
  const PB = { bl: [120, 412], br: [400, 412], dx: 52, dy: -180 };
  const panelPt = (fu, fv) => [lerp(PB.bl[0], PB.br[0], fu) + PB.dx * fv, lerp(PB.bl[1], PB.br[1], fu) + PB.dy * fv];
  const RL = 580, RR = 760, YB = 215, YT = 385, YW = 425;
  const BULB2 = { x: 670, y: 192 };
  const OUT2 = { x: 786, y: 196, w: 146, h: 140 };
  const elec2 = u => ease(seg(u, 2.0, 3.2));
  function step2(c, s) {
    const u = s.u, k = s.k;
    const E = elec2(u);
    const charge = 0.12 + 0.76 * ease(seg(u, 2.8, 7.6));

    withA(c, k, () => {
      c.fillStyle = GROUND; c.fillRect(40, GY, 500, 10);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(40, GY); c.lineTo(540, GY); c.stroke();
      /* 支架 */
      c.strokeStyle = METAL; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(150, 412); c.lineTo(150, GY); c.moveTo(372, 412); c.lineTo(372, GY);
      c.moveTo(430, 300); c.lineTo(462, GY); c.moveTo(210, 300); c.lineTo(236, GY - 2); c.stroke();
      /* 導線與電路（不畫電流小點，只讓線轉亮） */
      wire(c, [[466, 314], [RL, 314]], E);
      wire(c, [[466, 332], [506, 332], [506, YW], [RR, YW], [RR, YT]], E);
      wire(c, [[RL, YB], [RL, YT]], E);
      wire(c, [[RR, YB], [RR, YT]], E);
      wire(c, [[RL, YB], [BULB2.x - 10, YB]], E);
      wire(c, [[BULB2.x + 10, YB], [RR, YB]], E);
      wire(c, [[RL, YT], [636, YT]], E);
      wire(c, [[710, YT], [RR, YT]], E);
      /* 太陽能板：小方格 */
      panelQuad(c, PB.bl, PB.br, PB.dx, PB.dy, 6, 4, E);
      if (E > 0.02) {
        c.save(); c.beginPath(); [panelPt(0, 0), panelPt(1, 0), panelPt(1, 1), panelPt(0, 1)].forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.clip();
        W5.glow(c, 286, 322, 190, ENE, 0.16 * E); c.restore();
      }
      /* 接線盒 */
      c.fillStyle = SHELL; W5.rr(c, 440, 304, 28, 38, 5); c.fill(); c.strokeStyle = METAL; c.lineWidth = 2; c.stroke();
      /* 燈泡 */
      bulb(c, BULB2.x, BULB2.y, E);
      /* 電池：充電量 */
      c.fillStyle = INK; W5.rr(c, 636, YT - 15, 70, 30, 6); c.fill();
      c.save(); W5.rr(c, 636, YT - 15, 70, 30, 6); c.clip();
      c.fillStyle = W5.rgba(ENE, 0.9); c.fillRect(636, YT - 15, 70 * charge, 30); c.restore();
      c.strokeStyle = '#cfe0da'; c.lineWidth = 2; W5.rr(c, 636, YT - 15, 70, 30, 6); c.stroke();
      c.fillStyle = '#cfe0da'; c.fillRect(706, YT - 6, 5, 12);
      /* 輸出：電壓隨時間（直流，穩定的一條線） */
      c.fillStyle = 'rgba(11,26,21,0.92)'; W5.rr(c, OUT2.x, OUT2.y, OUT2.w, OUT2.h, 14); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(ENE, 0.55); c.stroke();
      const X0 = OUT2.x + 16, X1 = OUT2.x + OUT2.w - 14, YC = 292, AMP = 46, WIN = 3;
      c.strokeStyle = 'rgba(163,184,176,0.55)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(X0, YC); c.lineTo(X1, YC); c.moveTo(X0, YC + 4); c.lineTo(X0, YC - AMP - 8); c.stroke();
      c.strokeStyle = ENE; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
      for (let px = 0; px <= X1 - X0; px += 2) {
        const tt = u - (1 - px / (X1 - X0)) * WIN, y = YC - AMP * elec2(tt);
        if (px === 0) c.moveTo(X0 + px, y); else c.lineTo(X0 + px, y);
      }
      c.stroke();
      if (E > 0.02) W5.glow(c, X1, YC - AMP * E, 12, ENE, 0.7 * E);
    });

    /* 光子：黃色小粒從太陽飛進太陽能板 */
    withA(c, k * seg(u, 0.3, 0.7), () => {
      const per = 1.3;
      for (let i = 0; i < 26; i++) {
        const st = 0.3 + hash(i + 200) * per;
        if (u < st) continue;
        const ph = ((u - st) / per) % 1;
        const tg = panelPt(0.06 + 0.88 * hash(i * 3.71 + 210.3), 0.08 + 0.84 * hash(i * 5.37 + 220.9));
        const an = Math.atan2(tg[1] - SUN2.y, tg[0] - SUN2.x);
        const ox = SUN2.x + Math.cos(an) * SUN2.R * 1.4, oy = SUN2.y + Math.sin(an) * SUN2.R * 1.4;
        if (ph < 0.86) {
          const f = ph / 0.86, x = lerp(ox, tg[0], f), y = lerp(oy, tg[1], f);
          W5.glow(c, x, y, 11, ENE, 0.5);
          c.fillStyle = '#fff2a0'; c.beginPath(); c.arc(x, y, 4.2, 0, TAU); c.fill();
        } else {
          const f = (ph - 0.86) / 0.14;
          c.save(); c.globalAlpha *= 1 - f; c.strokeStyle = ENE; c.lineWidth = 2;
          c.beginPath(); c.arc(tg[0], tg[1], 4 + 10 * f, 0, TAU); c.stroke(); c.restore();
        }
      }
    });
    sun(c, SUN2.x, SUN2.y, SUN2.R, u, k);

    T(c, k, L('太陽', 'Sun'), SUN2.x, 116, ENE, 20);
    T(c, k * seg(u, 0.5, 1.0), L('光子', 'Photons'), 152, 140, ENE, 20, 'left');
    P(c, k, L('太陽能板', 'Solar panel'), 312, 196, WHITE, 20);
    T(c, k * seg(u, 2.2, 2.7), L('燈泡亮', 'Bulb lights'), BULB2.x, 146, ENE, 20);
    T(c, k * seg(u, 2.8, 3.3), L('電池充電', 'Battery charges'), 670, 350, WHITE, 20);
    T(c, k, L('電壓', 'Voltage'), OUT2.x + OUT2.w / 2, 218, DIM, 20);
    T(c, k * seg(u, 3.0, 3.5), L('穩定直流', 'Steady DC'), OUT2.x + OUT2.w / 2, 316, ENE, 20);
    P(c, k * seg(u, 4.2, 4.7), L('再生能源', 'Renewable'), 860, 372, REN, 20);

    chain(c, k, u, [['光能', 'Light', ENE], ['電能', 'Electrical', ENE]], [0.6, 2.2], 104);
  }

  /* ═════════════════ 第 3 步：為什麼斜放？水面型怎麼降溫 ═════════════════ */
  const TILT = 25 * Math.PI / 180;
  const CP = { x: 330, y: 284 }, HL = 62, G3 = 322;
  const NF = { x: Math.sin(TILT), y: -Math.cos(TILT) };           /* 斜好之後板面的法線（朝向太陽） */
  const SUN3 = { x: CP.x + 132 * NF.x, y: CP.y + 132 * NF.y, R: 22 };
  const FP = [585, 715, 845], WTOP = 278, WBOT = 316;
  const DAY = { x0: 92, x1: 868, base: 436, amp: 72 };
  const dayX = h => lerp(DAY.x0, DAY.x1, h / 24);
  const dayY = h => DAY.base - (h > 6 && h < 18 ? DAY.amp * Math.sin(Math.PI * (h - 6) / 12) : 0);
  function step3(c, s) {
    const u = s.u, k = s.k;
    const ang = TILT * ease(seg(u, 0.8, 2.2));
    const aligned = seg(u, 2.2, 2.7);
    const cool = ease(seg(u, 2.6, 5.2));
    const ptemp = 0.86 - 0.44 * cool, eff = 0.42 + 0.36 * ease(seg(u, 2.8, 5.4));
    const vap = seg(u, 2.2, 2.8);
    const draw3 = ease(seg(u, 4.4, 6.4));

    /* ── 左：斜放朝天空（側視） ── */
    withA(c, k, () => {
      c.fillStyle = GROUND; c.fillRect(60, G3, 390, 8);
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(60, G3); c.lineTo(450, G3); c.stroke();
      /* 水平時的位置（淡虛線） */
      c.save(); c.globalAlpha *= 0.35 * (1 - aligned * 0.4); c.strokeStyle = DIM; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(CP.x - HL, CP.y); c.lineTo(CP.x + HL, CP.y); c.stroke(); c.restore();
      /* 支柱 */
      c.strokeStyle = METAL; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(CP.x, CP.y + 4); c.lineTo(CP.x, G3); c.stroke();
    });
    const e = { x: Math.cos(ang), y: Math.sin(ang) }, nn = { x: Math.sin(ang), y: -Math.cos(ang) };
    const pL = { x: CP.x - HL * e.x, y: CP.y - HL * e.y }, pR = { x: CP.x + HL * e.x, y: CP.y + HL * e.y };
    /* 平行陽光：方向固定（從太陽來），打到目前的板面 */
    const D3 = { x: -NF.x, y: -NF.y }, EF = { x: Math.cos(TILT), y: Math.sin(TILT) };
    [-38, 0, 38].forEach((o, i) => {
      const S = { x: SUN3.x + o * EF.x - 22 * D3.x * 0, y: SUN3.y + o * EF.y };
      const st = { x: S.x + D3.x * 34, y: S.y + D3.y * 34 };
      /* 與板面所在直線求交點 */
      const den = D3.x * nn.x + D3.y * nn.y;
      const tt = Math.abs(den) < 1e-6 ? 100 : ((CP.x - st.x) * nn.x + (CP.y - st.y) * nn.y) / den;
      const end = { x: st.x + D3.x * (tt - 6), y: st.y + D3.y * (tt - 6) };
      ray(c, st.x, st.y, end.x, end.y, ease(seg(u, 0.3, 1.0)), ENE, u * 40 + i * 6, k);
    });
    withA(c, k, () => {
      /* 板子側視：上面是電池面（藍），下面是框（銀） */
      c.lineCap = 'butt';
      c.strokeStyle = '#c9d4d1'; c.lineWidth = 11; c.beginPath(); c.moveTo(pL.x, pL.y); c.lineTo(pR.x, pR.y); c.stroke();
      c.strokeStyle = mixHex(CELL, CELL_HI, 0.3 + 0.5 * aligned); c.lineWidth = 6;
      c.beginPath(); c.moveTo(pL.x + nn.x * 2.5, pL.y + nn.y * 2.5); c.lineTo(pR.x + nn.x * 2.5, pR.y + nn.y * 2.5); c.stroke();
      if (aligned > 0.02) W5.glow(c, CP.x + nn.x * 6, CP.y + nn.y * 6, 70, ENE, 0.3 * aligned);
      c.fillStyle = METAL; c.beginPath(); c.arc(CP.x, CP.y, 5, 0, TAU); c.fill();
      /* 角度示意：只畫一個弧，不標數字 */
      if (ang > 0.05) {
        c.strokeStyle = W5.rgba(WHITE, 0.7); c.lineWidth = 2; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(pR.x, pR.y); c.lineTo(pR.x - 78, pR.y); c.stroke(); c.setLineDash([]);
        c.strokeStyle = ENE; c.lineWidth = 3; c.beginPath(); c.arc(pR.x, pR.y, 40, Math.PI, Math.PI + ang); c.stroke();
      }
    });
    sun(c, SUN3.x, SUN3.y, SUN3.R, u, k);
    T(c, k * aligned, L('正對陽光', 'Facing the sun'), 178, 236, GOOD, 20);

    /* ── 右：水面型 ── */
    withA(c, k, () => {
      const wg = c.createLinearGradient(0, WTOP, 0, WBOT);
      wg.addColorStop(0, W5.rgba(WATER, 0.75)); wg.addColorStop(1, W5.rgba(WATER, 0.35));
      c.fillStyle = wg; c.beginPath(); c.moveTo(500, WBOT);
      for (let x = 500; x <= 930; x += 6) c.lineTo(x, WTOP + 2.5 * Math.sin(x / 20 + u * 1.6));
      c.lineTo(930, WBOT); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(216,240,255,0.6)'; c.lineWidth = 2; c.beginPath();
      for (let x = 500; x <= 930; x += 6) { const y = WTOP + 2.5 * Math.sin(x / 20 + u * 1.6); if (x === 500) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      FP.forEach((x, i) => {
        const bob = 1.5 * Math.sin(u * 1.6 + i * 1.3), y = WTOP - 12 + bob, a = 10 * Math.PI / 180;
        c.fillStyle = '#d9e2dd'; W5.rr(c, x - 44, WTOP - 6 + bob, 88, 12, 5); c.fill();
        if (ptemp > 0.45) W5.glow(c, x, y - 4, 56, HEAT, 0.55 * (ptemp - 0.42));
        c.save(); c.translate(x, y); c.rotate(-a);
        c.fillStyle = '#c9d4d1'; c.fillRect(-50, -3, 100, 8);
        c.fillStyle = mixHex(CELL, CELL_HI, 0.4); c.fillRect(-50, -6, 100, 5);
        c.restore();
      });
    });
    /* 水氣蒸發，帶走熱 */
    withA(c, k * vap, () => {
      const gaps = [[506, 532], [640, 662], [770, 792], [898, 926]];
      for (let i = 0; i < 24; i++) {
        const per = 2.2, st = 2.2 + hash(i + 300) * per;
        if (u < st) continue;
        const ph = ((u - st) / per) % 1, gp = gaps[i % 4];
        const x = lerp(gp[0], gp[1], hash(i + 310)) + 5 * Math.sin(u * 2.2 + i);
        const y = WTOP - 4 - ph * 34;
        c.globalAlpha = k * vap * Math.sin(ph * Math.PI) * 0.9;
        c.fillStyle = mixHex('#ffc9a8', VAPOR, ph);
        c.beginPath(); c.arc(x, y, 3 + 1.5 * hash(i + 320), 0, TAU); c.fill();
      }
    });
    /* 板溫、效率長條 */
    withA(c, k, () => {
      hbar(c, 656, 150, 236, 16, ptemp, mixHex(COLD, HEAT, ptemp));
      hbar(c, 656, 188, 236, 16, eff, ENE);
      const ar = seg(u, 2.8, 3.3);
      if (ar > 0.02) {
        c.save(); c.globalAlpha *= ar;
        W5.arrow(c, 912, 140, 912, 162, COLD, 3.5, 11);
        W5.arrow(c, 912, 198, 912, 176, ENE, 3.5, 11);
        c.restore();
      }
    });
    T(c, k, L('板溫', 'Panel temp.'), 512, 150, WHITE, 20, 'left');
    T(c, k, L('發電效率', 'Efficiency'), 512, 188, WHITE, 20, 'left');
    T(c, k * vap, L('水氣蒸發帶走熱', 'Evaporation carries heat away'), 715, 224, VAPOR, 20);
    T(c, k * seg(u, 3.4, 3.9), L('溫度越高，效率反而下降', 'Hotter panels work less efficiently'), 715, 332, CAUTION, 20);

    /* ── 下：一天的發電量 ── */
    const hx = 24 * draw3;
    withA(c, k * seg(u, 4.2, 4.6), () => {
      c.fillStyle = 'rgba(11,26,21,0.55)';
      c.fillRect(DAY.x0, 352, dayX(6) - DAY.x0, DAY.base - 352); c.fillRect(dayX(18), 352, DAY.x1 - dayX(18), DAY.base - 352);
      c.strokeStyle = 'rgba(163,184,176,0.6)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(DAY.x0, DAY.base); c.lineTo(DAY.x1, DAY.base); c.moveTo(DAY.x0, DAY.base); c.lineTo(DAY.x0, 352); c.stroke();
      if (hx > 0.05) {
        c.beginPath(); c.moveTo(dayX(0), DAY.base);
        for (let h = 0; h <= hx; h += 0.2) c.lineTo(dayX(h), dayY(h));
        c.lineTo(dayX(hx), dayY(hx)); c.lineTo(dayX(hx), DAY.base); c.closePath();
        c.fillStyle = W5.rgba(ENE, 0.18); c.fill();
        c.beginPath(); c.moveTo(dayX(0), dayY(0));
        for (let h = 0; h <= hx; h += 0.2) c.lineTo(dayX(h), dayY(h));
        c.lineTo(dayX(hx), dayY(hx));
        c.strokeStyle = ENE; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
        if (draw3 < 1) { W5.glow(c, dayX(hx), dayY(hx), 14, ENE, 0.8); c.fillStyle = WHITE; c.beginPath(); c.arc(dayX(hx), dayY(hx), 4, 0, TAU); c.fill(); }
      }
    });
    T(c, k * seg(u, 4.2, 4.6), L('發電量', 'Power output'), DAY.x0 + 12, 362, ENE, 20, 'left');
    T(c, k * seg(u, 4.5, 5.0), L('夜間無法發電', 'Night: no power'), (DAY.x0 + dayX(6)) / 2, 410, CAUTION, 20);
    T(c, k * seg(u, 5.3, 5.8), L('白天', 'Daytime'), 480, 412, ENE, 20);
    T(c, k * seg(u, 5.9, 6.4), L('夜間無法發電', 'Night: no power'), (dayX(18) + DAY.x1) / 2, 410, CAUTION, 20);

    P(c, k, L('斜放朝向天空', 'Tilted toward the sky'), 250, 104, ENE, 22);
    P(c, k * seg(u, 2.0, 2.5), L('水面型', 'Floating on water'), 715, 104, WATER, 22);
  }

  /* ═════════════════ 第 4 步：太陽能發電的三種方法 ═════════════════ */
  const ROWS = [172, 282, 392];
  const SX = [78, 162, 246, 330];
  const RST = [0.3, 2.2, 4.1];
  const ROUTE = [
    { name: ['① 太陽能電池', '(1) Solar cells'],
      ch: [['光能', 'Light', ENE], ['電能', 'Electrical', ENE]], slots: [0, 1, 3], cs: [0, 2] },
    { name: ['② 集熱板把水加熱成蒸氣，推動渦輪發電機', '(2) Collected heat makes steam to spin a turbine'],
      ch: [['光能', 'Light', ENE], ['熱能', 'Heat', HEAT], ['動能', 'Kinetic', ENE], ['電能', 'Electrical', ENE]], slots: [0, 1, 2, 3], cs: [0, 1, 2, 3] },
    { name: ['③ 陽光分解水產生氫氣，氫氣當發電燃料', '(3) Sunlight splits water; hydrogen fuels power'],
      ch: [['光能', 'Light', ENE], ['化學能（氫氣）', 'Chemical (H₂)', ENE], ['電能', 'Electrical', ENE]], slots: [0, 1, 2, 3], cs: [0, 1, 3] }
  ];
  function miniSun(c, x, y, r, u) {
    W5.glow(c, x, y, r * 2.2, ENE, 0.4);
    c.strokeStyle = ENE; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const an = i * TAU / 8 + u * 0.3; c.beginPath(); c.moveTo(x + Math.cos(an) * r * 1.3, y + Math.sin(an) * r * 1.3); c.lineTo(x + Math.cos(an) * r * 1.75, y + Math.sin(an) * r * 1.75); c.stroke(); }
    c.fillStyle = ENE; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function icon(c, row, slot, y, u, on, lit) {
    const x = SX[slot];
    if (row === 0) {
      if (slot === 0) miniSun(c, x, y, 16, u);
      if (slot === 1) {
        panelQuad(c, [x - 34, y + 22], [x + 22, y + 22], 12, -44, 4, 3, lit);
        for (let i = 0; i < 4; i++) {        /* 光子 */
          const ph = (u * 0.9 + i / 4) % 1, xx = lerp(SX[0] + 20, x - 4, ph), yy = lerp(y - 6, y + (i % 2 ? 4 : -8), ph);
          c.fillStyle = '#fff2a0'; c.globalAlpha = Math.sin(ph * Math.PI); c.beginPath(); c.arc(xx, yy, 3.5, 0, TAU); c.fill(); c.globalAlpha = 1;
        }
      }
      if (slot === 3) bulb(c, x, y - 8, lit, 15);
    } else if (row === 1) {
      if (slot === 0) {
        miniSun(c, x - 28, y - 30, 8, u);
        c.fillStyle = ABSORB; c.beginPath(); c.moveTo(x - 28, y + 24); c.lineTo(x + 20, y + 24); c.lineTo(x + 32, y - 18); c.lineTo(x - 16, y - 18); c.closePath(); c.fill();
        if (on > 0.02) { c.save(); c.clip(); W5.glow(c, x + 2, y + 3, 44, HEAT, 0.5 * on); c.restore(); }
        c.strokeStyle = mixHex(WATER, HEAT, on); c.lineWidth = 3;
        for (let i = 1; i <= 4; i++) { const f = i / 5; c.beginPath(); c.moveTo(lerp(x - 28, x + 20, f), y + 22); c.lineTo(lerp(x - 16, x + 32, f), y - 16); c.stroke(); }
        c.strokeStyle = '#c9d4d1'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 28, y + 24); c.lineTo(x + 20, y + 24); c.lineTo(x + 32, y - 18); c.lineTo(x - 16, y - 18); c.closePath(); c.stroke();
      }
      if (slot === 1) {                     /* 鍋爐：水 → 蒸氣 */
        c.fillStyle = SHELL; W5.rr(c, x - 22, y - 10, 44, 36, 8); c.fill();
        c.fillStyle = W5.rgba(WATER, 0.85); c.fillRect(x - 18, y + 6, 36, 16);
        c.strokeStyle = METAL; c.lineWidth = 2.5; W5.rr(c, x - 22, y - 10, 44, 36, 8); c.stroke();
        for (let i = 0; i < 4; i++) { const ph = (u * 0.8 + i / 4) % 1; puff(c, x - 8 + 16 * hash(i + 600), y - 16 - ph * 26, 4 + 4 * ph, STEAM, 0.7 * on * Math.sin(ph * Math.PI)); }
      }
      if (slot === 2) {                     /* 渦輪：轉動 */
        const th = spin(u, RST[1] + 1.0, 0.8, TAU * 0.9);
        c.fillStyle = SHELL; c.beginPath(); c.arc(x, y, 25, 0, TAU); c.fill();
        c.strokeStyle = METAL; c.lineWidth = 2.5; c.stroke();
        c.strokeStyle = '#d8e8e2'; c.lineWidth = 3;
        for (let j = 0; j < 6; j++) { const a = th + j * TAU / 6; c.beginPath(); c.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); c.quadraticCurveTo(x + Math.cos(a + 0.5) * 14, y + Math.sin(a + 0.5) * 14, x + Math.cos(a + 0.35) * 21, y + Math.sin(a + 0.35) * 21); c.stroke(); }
        c.fillStyle = METAL; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
      }
      if (slot === 3) bulb(c, x, y - 8, lit, 15);
    } else {
      if (slot === 0) {                     /* 水杯＋陽光：冒出氣泡 */
        miniSun(c, x - 30, y - 30, 8, u);
        c.fillStyle = W5.rgba(WATER, 0.75); c.fillRect(x - 20, y - 4, 40, 28);
        c.strokeStyle = '#cfe0da'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 22, y - 16); c.lineTo(x - 22, y + 26); c.lineTo(x + 22, y + 26); c.lineTo(x + 22, y - 16); c.stroke();
        for (let i = 0; i < 6; i++) {
          const ph = (u * 0.9 + hash(i + 700)) % 1, bx = x - 14 + 28 * hash(i + 710), by = y + 20 - ph * 24;
          c.strokeStyle = W5.rgba('#eaf6ff', 0.9 * on * Math.sin(ph * Math.PI)); c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by, 2.5 + 1.5 * hash(i + 720), 0, TAU); c.stroke();
        }
      }
      if (slot === 1) {                     /* 氫氣、氧氣兩種氣泡 */
        const ph = (u * 0.5) % 1;
        [[-1, '#eaf6ff'], [1, '#ffb3b3']].forEach(([sd, col], i) => {
          const by = y + sd * 15 - 2 * Math.sin((ph + i * 0.5) * TAU);
          c.fillStyle = W5.rgba(col, 0.35 * on); c.strokeStyle = W5.rgba(col, 0.9 * on); c.lineWidth = 2;
          c.beginPath(); c.arc(x - 14, by, 9, 0, TAU); c.fill(); c.stroke();
        });
      }
      if (slot === 2 && on > 0.02) {        /* 氫氣當燃料：藍色小火焰 */
        const fx = x, fy = y + 14, f = 1 + 0.12 * Math.sin(u * 13) + 0.06 * Math.sin(u * 7.3);
        c.save(); c.globalAlpha *= on;
        W5.glow(c, fx, fy - 10, 30, '#7fc8ff', 0.4);
        c.fillStyle = '#7fc8ff'; c.beginPath(); c.moveTo(fx, fy - 30 * f);
        c.bezierCurveTo(fx + 14, fy - 14, fx + 11, fy + 6, fx, fy + 6); c.bezierCurveTo(fx - 11, fy + 6, fx - 14, fy - 14, fx, fy - 30 * f); c.fill();
        c.fillStyle = '#e6f4ff'; c.beginPath(); c.moveTo(fx, fy - 14 * f);
        c.bezierCurveTo(fx + 6, fy - 4, fx + 5, fy + 6, fx, fy + 6); c.bezierCurveTo(fx - 5, fy + 6, fx - 6, fy - 4, fx, fy - 14 * f); c.fill();
        c.restore();
        c.fillStyle = '#5d6f69'; W5.rr(c, fx - 16, fy + 6, 32, 8, 3); c.fill();
      }
      if (slot === 3) bulb(c, x, y - 8, lit, 15);
    }
  }
  function step4(c, s) {
    const u = s.u, k = s.k;
    /* 分隔線 */
    withA(c, k * 0.5, () => {
      c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 1.5; c.setLineDash([6, 8]);
      [227, 337].forEach(y => { c.beginPath(); c.moveTo(40, y); c.lineTo(920, y); c.stroke(); });
      c.setLineDash([]);
    });
    ROUTE.forEach((R, ri) => {
      const st = RST[ri], y = ROWS[ri], a = k * seg(u, st, st + 0.5);
      if (a <= 0.02) return;
      const nst = R.slots.length;
      const stageAt = j => st + 0.35 + 0.42 * j;        /* 第 j 個小圖亮起的時間 */
      const lit = ease(seg(u, stageAt(nst - 1), stageAt(nst - 1) + 0.5));
      withA(c, a, () => {
        R.slots.forEach((sl, j) => {
          const on = ease(seg(u, stageAt(j), stageAt(j) + 0.5));
          if (j > 0) {
            const x0 = SX[R.slots[j - 1]] + 32, x1 = SX[sl] - 32 - (ri !== 0 && sl === 3 ? 0 : 0);
            const g = seg(u, stageAt(j) - 0.3, stageAt(j));
            if (g > 0.02) W5.arrow(c, x0, y, lerp(x0 + 6, x1, g), y, R.ch[Math.min(j, R.ch.length - 1)][2] === HEAT ? HEAT : ENE, 3.5, 11);
          }
          icon(c, ri, sl, y, u, on, lit);
        });
      });
      if (ri === 2) {
        const on = seg(u, stageAt(1), stageAt(1) + 0.5);
        T(c, a * on, 'H₂', SX[1] + 16, y - 15, '#eaf6ff', 20, 'center', true);
        T(c, a * on, 'O₂', SX[1] + 16, y + 15, '#ffb3b3', 20, 'center', true);
      }
      T(c, a, L(R.name[0], R.name[1]), 384, y - 24, WHITE, 22, 'left');
      chain(c, a, u, R.ch, R.cs.map(j => stageAt(j)), y + 20, 384, 20, 34);
    });
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['太陽能變熱', 'Solar energy into heat'],
      sub: ['黑色集熱板吸收陽光、把管裡的水加熱送進水塔；太陽爐把陽光反射集中到焦點上的鍋子', 'The black collector absorbs sunlight and heats the water flowing up to the tank; a solar cooker reflects sunlight onto the pot at its focus.'],
      con: ['結論：太陽能熱水器和太陽爐，都是把光能變成熱能', 'Conclusion: solar water heaters and solar cookers both turn light energy into heat.'] },
    { title: ['太陽能板直接發電', 'Solar panels make electricity directly'],
      sub: ['光照到太陽能板，板子直接把光能變成電能：燈泡亮起、電池充電', 'When light hits the panel, the panel turns light energy straight into electricity: the bulb lights and the battery charges.'],
      con: ['結論：光能 → 電能，不用燒水、也不用轉動，發電時不排放汙染', 'Conclusion: light → electrical energy, with no boiling and no spinning, and no pollution while generating.'] },
    { title: ['為什麼斜放？水面型怎麼降溫', 'Why tilt? How do floating panels stay cool?'],
      sub: ['板子斜放、正對陽光，收到的光比較多；水面蒸發帶走熱，板子降溫、效率提高', 'A tilted panel faces the sun and catches more light; on water, evaporation carries heat away, so the panel cools and works better.'],
      con: ['結論：板子溫度越低效率越好；但夜間沒有陽光，無法發電', 'Conclusion: cooler panels work better, but with no sunlight at night they cannot generate.'] },
    { title: ['太陽能發電的三種方法', 'Three ways to generate from sunlight'],
      sub: ['三條路線最後都得到電能：直接用光、先變成熱，或先把能量存在氫氣裡', 'All three routes end in electricity: use the light directly, turn it into heat first, or store it in hydrogen first.'],
      con: ['結論：三種方法都把太陽能變成電能；台灣主要用太陽能電池', 'Conclusion: all three turn solar energy into electricity; Taiwan mainly uses solar cells.'] }
  ];

  W5.register('solar', {
    canvas: 'cvs-solar',
    steps: DUR,
    draw(c, s) {
      const n = s.n, u = s.u, k = s.k;
      if (n === 1) step1(c, s);
      else if (n === 2) step2(c, s);
      else if (n === 3) step3(c, s);
      else step4(c, s);

      const X = TXT[n - 1];
      P(c, k, L(X.title[0], X.title[1]), 480, 52, WHITE, 24);
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), GOOD);
    }
  });
})();
