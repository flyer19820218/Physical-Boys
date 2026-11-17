/* ==================================================================
   work_5 ｜ 水力與風力（cvs-hydrowind，960×540）
   四步：1 水循環是太陽推動 → 2 水力發電（重力位能→動能→電能；台灣河川短而急）
        → 3 風從哪裡來（陽光照射不均→氣壓差→風） → 4 風力發電（風的動能→電能；風不穩定）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 classify／thermal 一致）：能量／太陽＝黃 ENE、水＝藍 WATER、風＝淡青白 WIND、
   再生能源＝綠 REN #33cc99；熱＝橘紅 HEAT、冷＝藍 COLD。
   發電不畫電子、不畫電流小點：只用發電機微光、輸電線黃色流動與房子亮燈表示（比照 thermal）。

   純函式作法：所有畫面都由 s 算出；水輪與風機葉片角度用「角速度的解析積分」θ(t)，跳步驟不走樣；
   亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；畫布字 ≥ 20px；
   畫布頂端 0～30px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量／太陽：黃 */
  const WATER = '#5ab8e8';           /* 水：藍 */
  const WIND = '#d8f3f0';            /* 風：淡青白 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const HEAT = '#ff6a3d', COLD = '#72b9ff', CAUTION = '#fb923c';
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const GROUND = '#2c4a3a', GROUND_EDGE = '#5f8a6c', ROCK = '#3a4f44';
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
  /* 多行標籤（自動換行），回傳行數 */
  function TW(c, a, str, x, y, col, size, maxW, lh, align) {
    const lines = wrap(c, str, size, maxW);
    lines.forEach((l, i) => T(c, a, l, x, y + i * lh, col, size, align));
    return lines.length;
  }
  /* 底部字幕：說明一般框、結論綠框（同 thermal／classify） */
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

  /* ── 路徑工具（同 thermal） ── */
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
  function pipe(c, path, fill, w, d1) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
    subPath(c, path, 0, path.len);
    c.strokeStyle = INK; c.lineWidth = w + 7; c.stroke();
    c.strokeStyle = '#6d817a'; c.lineWidth = w + 4; c.stroke();
    c.strokeStyle = EMPTY; c.lineWidth = w; c.stroke();
    const e = d1 == null ? path.len : d1;
    if (fill && e > 0.5) { subPath(c, path, 0, e); c.strokeStyle = fill; c.lineWidth = w; c.stroke(); }
    c.restore();
  }
  function flow(c, path, col, off, gap, dash, w, a, dEnd) {
    if (a != null && a <= 0.02) return;
    const end = dEnd == null ? path.len : dEnd;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0 - gap; d < end; d += gap) {
      const p = Math.max(0, d), q = Math.min(end, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
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
  /* 柔邊光帶：上下用漸層、左右兩端淡出（不留硬邊） */
  function softBand(c, x0, x1, yTop, yBot, col, amax, fadeW) {
    for (let x = x0; x < x1; x += 4) {
      const f = Math.min(1, (x - x0) / fadeW, (x1 - x) / fadeW);
      if (f <= 0) continue;
      const g = c.createLinearGradient(0, yTop, 0, yBot);
      g.addColorStop(0, W5.rgba(col, 0)); g.addColorStop(1, W5.rgba(col, amax * f));
      c.fillStyle = g; c.fillRect(x, yTop, 4, yBot - yTop);
    }
  }
  function dashRay(c, x0, y0, x1, y1, col, off, a) {
    withA(c, a, () => {
      c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round'; c.setLineDash([12, 9]); c.lineDashOffset = -off;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
      W5.arrow(c, lerp(x0, x1, 0.92), lerp(y0, y1, 0.92), x1, y1, col, 3.5, 12);
    });
  }
  /* 上方能量流轉條：items＝[[中,英,亮起的顏色]]，ats＝各自亮起的秒數 */
  function chain(c, k, u, items, ats, y) {
    const sz = 22, gap = 44;
    const ws = items.map(p => W5.tw(c, L(p[0], p[1]), sz) + 28);
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let x = 480 - tot / 2;
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
  }

  /* ═════════════════ 第 1 步：水循環是太陽推動 ═════════════════ */
  const MT1 = [[480, 445], [480, 414], [530, 394], [600, 334], [680, 266], [770, 212], [845, 244], [920, 292], [920, 445]];
  function mtY1(x) {
    for (let i = 2; i < MT1.length - 1; i++) {
      const a = MT1[i - 1], b = MT1[i];
      if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / ((b[0] - a[0]) || 1));
    }
    return 445;
  }
  const RIVER1 = mkPath([[752, 232], [722, 262], [690, 290], [660, 302], [625, 336], [590, 352], [560, 374], [520, 404], [484, 414]]);
  const SEA1 = { x0: 40, x1: 480, top: 392, bot: 445 };
  const SUN1 = { x: 96, y: 118, R: 34 };
  const CL0 = { x: 385, y: 170 }, CL1 = { x: 725, y: 130 };
  function step1(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const heat = ease(seg(u, 0.4, 1.6));
    const vapA = seg(u, 1.0, 1.6);
    const grow = ease(seg(u, 2.2, 3.6));
    const move = ease(seg(u, 3.8, 5.0));
    const rainA = seg(u, 4.9, 5.3);
    const front = ease(seg(u, 5.3, 6.5));
    const cyc = seg(u, 6.0, 6.5);

    withA(c, k, () => {
      /* 海 */
      const sg = c.createLinearGradient(0, SEA1.top, 0, SEA1.bot);
      sg.addColorStop(0, W5.rgba(WATER, 0.75)); sg.addColorStop(1, W5.rgba(WATER, 0.4));
      c.fillStyle = sg; c.beginPath(); c.moveTo(SEA1.x0, SEA1.bot);
      for (let x = SEA1.x0; x <= SEA1.x1; x += 6) c.lineTo(x, SEA1.top + 3 * Math.sin(x / 22 + t * 1.6));
      c.lineTo(SEA1.x1, SEA1.bot); c.closePath(); c.fill();
      /* 海面被加熱的光 */
      if (heat > 0.02) {
        softBand(c, 150, SEA1.x1, SEA1.top - 14, SEA1.top + 6, ENE, 0.3 * heat, 90);
      }
      c.strokeStyle = 'rgba(216,240,255,0.6)'; c.lineWidth = 2; c.beginPath();
      for (let x = SEA1.x0; x <= SEA1.x1; x += 6) { const y = SEA1.top + 3 * Math.sin(x / 22 + t * 1.6); if (x === SEA1.x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 山 */
      c.fillStyle = GROUND; c.beginPath(); MT1.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 3; c.beginPath();
      for (let i = 1; i < MT1.length - 1; i++) { if (i === 1) c.moveTo(MT1[i][0], MT1[i][1]); else c.lineTo(MT1[i][0], MT1[i][1]); }
      c.stroke();
    });
    /* 河道（淡）＋水 */
    withA(c, k, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      subPath(c, RIVER1, 0, RIVER1.len); c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 12; c.stroke();
      if (front > 0.01) { subPath(c, RIVER1, 0, RIVER1.len * front); c.strokeStyle = W5.rgba(WATER, 0.9); c.lineWidth = 8; c.stroke(); }
      c.restore();
      flow(c, RIVER1, 'rgba(230,246,255,0.85)', u * 70, 34, 12, 3, front > 0.02 ? 1 : 0, RIVER1.len * front);
      if (front > 0.98) W5.arrow(c, 486, 414, 452, 414, WATER, 4, 14);
    });

    /* 陽光加熱海面 */
    sun(c, SUN1.x, SUN1.y, SUN1.R, t, k);
    [0.63, 0.88, 1.13].forEach((an, i) => {
      const dx = Math.cos(an), dy = Math.sin(an);
      dashRay(c, SUN1.x + dx * 50, SUN1.y + dy * 50, SUN1.x + dx * 150, SUN1.y + dy * 150, ENE, u * 40 + i * 5, k * heat);
    });

    /* 水蒸氣上升 */
    withA(c, k * vapA, () => {
      for (let i = 0; i < 26; i++) {
        const per = 2.6, st = 1.0 + hash(i + 10) * per;
        if (u < st) continue;
        const ph = ((u - st) / per) % 1;
        const x = 312 + hash(i + 50) * 126 + 6 * Math.sin(u * 2.4 + i);
        const y = 384 - ph * 186;
        c.globalAlpha = k * vapA * Math.sin(ph * Math.PI) * 0.9;
        c.fillStyle = WIND; c.beginPath(); c.arc(x, y, 3.2 + 1.6 * hash(i + 70), 0, TAU); c.fill();
      }
    });

    /* 雲：先在海上形成，再飄到山上降雨；之後海上又開始長新的雲（循環） */
    const cx = lerp(CL0.x, CL1.x, move), cy = lerp(CL0.y, CL1.y, move);
    const darker = mixHex('#e6eeec', '#9fb0ad', rainA);
    cloud(c, cx, cy, 150 * (0.35 + 0.65 * grow), k * grow, darker);
    cloud(c, CL0.x, CL0.y + 8, 110 * ease(seg(u, 6.0, 7.4)), k * 0.75 * ease(seg(u, 6.0, 7.4)), '#e6eeec');
    /* 雨 */
    withA(c, k * rainA, () => {
      c.strokeStyle = W5.rgba(WATER, 0.95); c.lineWidth = 2.5; c.lineCap = 'round';
      for (let i = 0; i < 30; i++) {
        const x = CL1.x - 58 + hash(i + 120) * 116, y0 = CL1.y + 26, y1 = mtY1(x) - 4;
        const ph = (u * 1.9 + hash(i + 140)) % 1, y = lerp(y0, y1, ph);
        if (y + 12 > y1) continue;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 12); c.stroke();
      }
    });
    /* 循環箭頭 */
    withA(c, k * cyc, () => {
      W5.arrow(c, 464, 372, 464, 224, WIND, 4, 14);
      c.strokeStyle = WIND; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(488, 178); c.quadraticCurveTo(560, 160, 612, 162); c.stroke();
      W5.arrow(c, 600, 162, 626, 162, WIND, 4, 14);
    });

    /* 標籤 */
    T(c, k, L('太陽', 'Sun'), 160, 118, ENE, 20, 'left');
    T(c, k * heat, L('陽光加熱海水', 'Sunlight warms the sea'), 50, 362, ENE, 20, 'left');
    T(c, k, L('海洋', 'Sea'), 110, 422, WHITE, 20);
    T(c, k * vapA, L('水蒸氣上升', 'Water vapor rises'), 50, 322, WIND, 20, 'left');
    T(c, k * grow, L('雲', 'Clouds'), cx - 88, cy, WHITE, 20, 'right');
    T(c, k * rainA, L('降雨', 'Rain'), 812, 186, WATER, 20, 'left');
    T(c, k * seg(u, 5.6, 6.1), L('河流流回海洋', 'Rivers flow back to the sea'), 712, 410, WATER, 20);
    P(c, k * seg(u, 6.3, 6.8), L('水力的能量來自太陽', "Hydropower's energy comes from the Sun"), 445, 96, ENE, 20);
  }

  /* ═════════════════ 第 2 步：水力發電 ═════════════════ */
  const RES = { x0: 40, x1: 228, wl: 170, bot: 300 };
  const PEN = mkPath([[226, 286], [264, 294], [412, 398], [434, 398]]);
  const PH = { x: 434, y: 350, w: 108, h: 75 };
  const OUT2 = mkPath([[542, 432], [715, 432]]);
  const TOW = { x: 612, top: 318, base: 425, arm: 332 };
  const HOUSE = { x: 670, y: 395, w: 44, h: 30 };
  const PN2 = { x: 722, y: 140, w: 214, h: 304 };
  const R0 = 2.0, RD = 1.6, OM = TAU * 1.3;
  function wheelTheta(u) {          /* 角速度 ω(u)＝OM·smoothstep 的解析積分 */
    if (u <= R0) return 0;
    const x = (u - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (u - R0 - RD));
  }
  function step2(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const front = ease(seg(u, 0.9, 2.2));
    const elec = ease(seg(u, 2.0, 3.6));
    const wire = seg(u, 3.2, 3.7);
    const th = wheelTheta(u);

    withA(c, k, () => {
      /* 背後的山 */
      c.fillStyle = ROCK; c.beginPath();
      c.moveTo(40, 300); c.lineTo(40, 150); c.lineTo(92, 128); c.lineTo(150, 156); c.lineTo(200, 140); c.lineTo(232, 160); c.lineTo(232, 300); c.closePath(); c.fill();
      /* 水庫 */
      c.fillStyle = W5.rgba(WATER, 0.7); c.beginPath(); c.moveTo(RES.x0, RES.bot);
      for (let x = RES.x0; x <= RES.x1; x += 6) c.lineTo(x, RES.wl + 2 * Math.sin(x / 16 + t * 1.5));
      c.lineTo(RES.x1, RES.bot); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(216,240,255,0.65)'; c.lineWidth = 2; c.beginPath();
      for (let x = RES.x0; x <= RES.x1; x += 6) { const y = RES.wl + 2 * Math.sin(x / 16 + t * 1.5); if (x === RES.x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 地形 */
      c.fillStyle = GROUND; c.beginPath();
      c.moveTo(40, 445); c.lineTo(40, 300); c.lineTo(262, 300); c.lineTo(420, 425); c.lineTo(715, 425); c.lineTo(715, 445); c.closePath(); c.fill();
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 3; c.beginPath(); c.moveTo(232, 300); c.lineTo(262, 300); c.lineTo(420, 425); c.lineTo(715, 425); c.stroke();
      /* 水壩 */
      c.fillStyle = '#8e9c97'; c.beginPath(); c.moveTo(228, 150); c.lineTo(252, 150); c.lineTo(276, 300); c.lineTo(222, 300); c.closePath(); c.fill();
      c.strokeStyle = '#d6e2de'; c.lineWidth = 2; c.stroke();
      /* 引水道（水由上往下填滿，之後持續往下衝） */
      pipe(c, PEN, W5.rgba(WATER, 0.9), 14, PEN.len * front);
      flow(c, PEN, 'rgba(230,246,255,0.9)', u * 150, 30, 12, 3, front > 0.02 ? 1 : 0, PEN.len * front);
      /* 尾水：流向下游 */
      c.fillStyle = 'rgba(11,26,21,0.6)'; c.fillRect(542, 427, 173, 11);
      if (elec > 0.02) {
        c.save(); c.globalAlpha *= elec; c.fillStyle = W5.rgba(WATER, 0.8); c.fillRect(542, 427, 173, 11); c.restore();
        flow(c, OUT2, 'rgba(230,246,255,0.85)', u * 60, 30, 12, 3, elec);
      }
      /* 發電廠：水輪機＋發電機 */
      c.fillStyle = SHELL; c.fillRect(PH.x, PH.y, PH.w, PH.h);
      c.strokeStyle = METAL; c.lineWidth = 3; c.strokeRect(PH.x, PH.y, PH.w, PH.h);
      const wx = 466, wy = 398, wr = 19;
      c.fillStyle = EMPTY; c.beginPath(); c.arc(wx, wy, wr + 4, 0, TAU); c.fill();
      c.strokeStyle = WATER; c.lineWidth = 3;
      for (let j = 0; j < 8; j++) {
        const a = th + j * TAU / 8;
        c.beginPath(); c.moveTo(wx + Math.cos(a) * 5, wy + Math.sin(a) * 5);
        c.quadraticCurveTo(wx + Math.cos(a + 0.5) * wr * 0.7, wy + Math.sin(a + 0.5) * wr * 0.7, wx + Math.cos(a + 0.3) * wr, wy + Math.sin(a + 0.3) * wr); c.stroke();
      }
      c.fillStyle = METAL; c.beginPath(); c.arc(wx, wy, 5, 0, TAU); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 4; c.beginPath(); c.moveTo(wx + 8, wy); c.lineTo(506, 390); c.stroke();
      const gx = 516, gy = 388;
      if (elec > 0.02) W5.glow(c, gx, gy, 34, ENE, 0.55 * elec * (0.8 + 0.2 * Math.sin(th * 2)));
      c.fillStyle = '#33423e'; W5.rr(c, gx - 18, gy - 18, 36, 36, 8); c.fill();
      c.strokeStyle = '#d08a4a'; c.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(gx - 12 + i * 8, gy - 13); c.lineTo(gx - 10 + i * 8, gy + 13); c.stroke(); }
      /* 輸電塔 */
      c.strokeStyle = '#b7c7c1'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(TOW.x - 14, TOW.base); c.lineTo(TOW.x, TOW.top); c.lineTo(TOW.x + 14, TOW.base);
      c.moveTo(TOW.x - 16, TOW.arm); c.lineTo(TOW.x + 16, TOW.arm);
      c.moveTo(TOW.x - 10, 380); c.lineTo(TOW.x + 10, 380); c.moveTo(TOW.x - 7, 352); c.lineTo(TOW.x + 9, 380); c.moveTo(TOW.x + 7, 352); c.lineTo(TOW.x - 9, 380); c.stroke();
      /* 房子 */
      c.fillStyle = '#41524c'; c.fillRect(HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h);
      c.beginPath(); c.moveTo(HOUSE.x - 4, HOUSE.y); c.lineTo(HOUSE.x + HOUSE.w / 2, HOUSE.y - 16); c.lineTo(HOUSE.x + HOUSE.w + 4, HOUSE.y); c.closePath(); c.fillStyle = '#6a7c76'; c.fill();
      const lit = wire * elec;
      [HOUSE.x + 8, HOUSE.x + 26].forEach(xx => { c.fillStyle = mixHex('#1a2a25', ENE, lit); c.fillRect(xx, HOUSE.y + 9, 10, 10); });
      if (lit > 0.02) W5.glow(c, HOUSE.x + HOUSE.w / 2, HOUSE.y + 14, 34, ENE, 0.35 * lit);
      /* 輸電線：電能送出（黃色流動） */
      const lines = [[[PH.x + PH.w, 368], [TOW.x - 16, TOW.arm]], [[TOW.x + 16, TOW.arm], [HOUSE.x + HOUSE.w / 2, HOUSE.y - 16]]];
      lines.forEach(([a, b]) => {
        c.strokeStyle = '#7d8f89'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        if (wire > 0.02) {
          c.save(); c.globalAlpha *= wire; c.strokeStyle = ENE; c.lineWidth = 3; c.setLineDash([10, 12]); c.lineDashOffset = -u * 60;
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore();
        }
      });
    });
    T(c, k, L('水庫', 'Reservoir'), 134, 238, WHITE, 20);
    T(c, k, L('水壩', 'Dam'), 284, 175, WHITE, 20, 'left');
    T(c, k * seg(u, 0.9, 1.4), L('引水道', 'Penstock'), 318, 305, WATER, 20, 'left');
    T(c, k, L('發電廠', 'Power station'), 487, 332, WHITE, 20);
    T(c, k * wire, L('輸電', 'Transmission'), TOW.x, 296, ENE, 20);

    /* 右側小圖：台灣河川短而急、蓄水有限 */
    const pa = k * seg(u, 3.8, 4.3);
    withA(c, pa, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, PN2.x, PN2.y, PN2.w, PN2.h, 16); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(WATER, 0.55); c.stroke();
      /* 短而陡的河川剖面 */
      c.fillStyle = W5.rgba(WATER, 0.55); c.fillRect(812, 268, 112, 16);
      c.fillStyle = GROUND; c.beginPath(); c.moveTo(736, 284); c.lineTo(736, 198); c.lineTo(752, 196); c.lineTo(812, 270); c.lineTo(812, 284); c.closePath(); c.fill();
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2; c.beginPath(); c.moveTo(736, 198); c.lineTo(752, 196); c.lineTo(812, 270); c.stroke();
      const rv = mkPath([[750, 200], [812, 268], [900, 270]]);
      c.save(); subPath(c, rv, 0, rv.len); c.strokeStyle = W5.rgba(WATER, 0.95); c.lineWidth = 5; c.lineCap = 'round'; c.stroke(); c.restore();
      flow(c, rv, 'rgba(230,246,255,0.95)', u * 160, 22, 8, 2.5, 1);
      W5.arrow(c, 890, 270, 916, 270, WATER, 3, 11);
      /* 水庫水位條：雨季一下就滿、很快又流掉 */
      const f = 0.32 + 0.52 * ease(seg(u, 4.5, 5.2)) - 0.5 * ease(seg(u, 5.5, 7.0));
      const gx0 = 742, gy0 = 320, gw = 22, gh = 112;
      c.fillStyle = INK; W5.rr(c, gx0, gy0, gw, gh, 6); c.fill();
      c.save(); W5.rr(c, gx0, gy0, gw, gh, 6); c.clip();
      c.fillStyle = W5.rgba(WATER, 0.9); c.fillRect(gx0, gy0 + gh * (1 - f), gw, gh * f); c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 1.5; W5.rr(c, gx0, gy0, gw, gh, 6); c.stroke();
      const ra = seg(u, 4.3, 4.6) * (1 - seg(u, 5.1, 5.4));
      if (ra > 0.02) {
        c.save(); c.globalAlpha *= ra; c.strokeStyle = WATER; c.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const ph = (u * 2.2 + i / 4) % 1, x = gx0 + 4 + i * 5, y = gy0 - 18 + ph * 14; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1, y + 6); c.stroke(); }
        c.restore();
      }
    });
    P(c, pa, L('台灣的河川', "Taiwan's rivers"), PN2.x + PN2.w / 2, 168, WATER, 20);
    T(c, pa, L('短而急', 'Short & steep'), PN2.x + PN2.w / 2, 302, WHITE, 20);
    const n1 = pa > 0.02 ? TW(c, pa, L('水庫水位', 'Reservoir level'), 776, 340, WATER, 20, 150, 26, 'left') : 1;
    TW(c, pa * seg(u, 5.5, 6.0), L('蓄水有限', 'Limited storage'), 776, 340 + n1 * 26 + 16, CAUTION, 20, 150, 26, 'left');

    chain(c, k, u, [['重力位能', 'Gravitational PE'], ['動能', 'Kinetic'], ['電能', 'Electrical']], [0.6, 2.2, 3.2], 104);
  }

  /* ═════════════════ 第 3 步：風從哪裡來 ═════════════════ */
  const LOOP3 = mkPath([[330, 350], [330, 225], [345, 210], [625, 210], [640, 225], [640, 350], [625, 365], [345, 365], [330, 350]]);
  const GR3 = { x0: 40, x1: 920, top: 390, bot: 445 };
  const SUN3 = { x: 110, y: 172, R: 30 };
  const VMAX3 = 120, A3 = 1.6, B3 = 3.6;
  function airDist(u) {             /* 線性加速的解析積分：粒子沿環流走了多遠 */
    if (u <= A3) return 0;
    if (u < B3) return VMAX3 * (u - A3) * (u - A3) / (2 * (B3 - A3));
    return VMAX3 * ((B3 - A3) / 2 + (u - B3));
  }
  function step3(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const heat = ease(seg(u, 0.6, 2.2));
    const air = seg(u, 1.0, 1.8);
    const run = seg(u, A3, B3);
    const pL = seg(u, 2.6, 3.1), pH = seg(u, 3.0, 3.5), wA = seg(u, 3.8, 4.3);

    withA(c, k, () => {
      /* 地面：左側被陽光照得較熱、右側在雲影下較冷 */
      const g = c.createLinearGradient(GR3.x0, 0, GR3.x1, 0);
      g.addColorStop(0, mixHex('#5a4a36', '#a0532f', heat)); g.addColorStop(0.42, mixHex('#5a4a36', '#8a5634', heat));
      g.addColorStop(0.58, '#3e4d4c'); g.addColorStop(1, '#2c4552');
      c.fillStyle = g; c.fillRect(GR3.x0, GR3.top, GR3.x1 - GR3.x0, GR3.bot - GR3.top);
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(GR3.x0, GR3.top); c.lineTo(GR3.x1, GR3.top); c.stroke();
      if (heat > 0.02) {
        softBand(c, GR3.x0, 470, GR3.top - 40, GR3.top, HEAT, 0.28 * heat, 110);
        /* 熱浪 */
        c.strokeStyle = W5.rgba('#ffd2b8', 0.6 * heat); c.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const x = 120 + i * 40, ph = (t * 0.7 + hash(i + 300)) % 1, yb = GR3.top - 4 - ph * 14;
          c.beginPath(); for (let j = 0; j <= 6; j++) { const yy = yb - j * 3, xx = x + 3 * Math.sin(j * 1.1 + t * 4 + i); if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke();
        }
      }
    });
    cloud(c, 800, 186, 130, k, '#c9d4d1');
    sun(c, SUN3.x, SUN3.y, SUN3.R, t, k);
    [[176, 386], [236, 386], [296, 386]].forEach((p, i) => {
      const an = Math.atan2(p[1] - SUN3.y, p[0] - SUN3.x);
      dashRay(c, SUN3.x + Math.cos(an) * 48, SUN3.y + Math.sin(an) * 48, p[0], p[1], ENE, u * 40 + i * 6, k * seg(u, 0.4, 1.0));
    });

    /* 空氣粒子：一開始靜止，受熱後開始繞圈（熱處上升→上方流向冷處→冷處下沉→地面流回熱處） */
    const D = airDist(u);
    withA(c, k * air, () => {
      const N = 34;
      for (let i = 0; i < N; i++) {
        const d = ((i / N) * LOOP3.len + D) % LOOP3.len, q = at(LOOP3, d);
        const jx = (hash(i + 400) - 0.5) * 12, jy = (hash(i + 410) - 0.5) * 12;
        const warm = q.x < 400 ? 1 : q.x > 600 ? 0 : 1 - (q.x - 400) / 200;
        c.fillStyle = mixHex(WIND, '#ffc9a8', 0.6 * warm * run);
        c.beginPath(); c.arc(q.x + jx, q.y + jy, 4.5, 0, TAU); c.fill();
      }
    });
    withA(c, k * seg(u, 2.4, 3.0), () => {
      W5.arrow(c, 330, 300, 330, 268, WIND, 4, 14);
      W5.arrow(c, 470, 210, 504, 210, WIND, 4, 14);
      W5.arrow(c, 640, 268, 640, 302, WIND, 4, 14);
      W5.arrow(c, 504, 365, 466, 365, WIND, 5, 16);
    });

    T(c, k, L('太陽', 'Sun'), SUN3.x, SUN3.y - 58, ENE, 20);
    T(c, k * seg(u, 1.8, 2.3), L('熱空氣上升', 'Warm air rises'), 352, 262, '#ffc9a8', 20, 'left');
    T(c, k * seg(u, 2.4, 2.9), L('冷空氣下沉', 'Cool air sinks'), 618, 302, WIND, 20, 'right');
    T(c, k * wA, L('風', 'Wind'), 485, 336, WIND, 24);
    T(c, k * heat, L('較熱', 'Warmer'), 150, 418, '#ffb38f', 20);
    T(c, k, L('較冷', 'Cooler'), 830, 418, COLD, 20);
    P(c, k * pL, L('低壓', 'Low pressure'), 330, 418, HEAT, 20);
    P(c, k * pH, L('高壓', 'High pressure'), 640, 418, COLD, 20);

    chain(c, k, u, [['陽光照射不均', 'Uneven sunlight', ENE], ['氣壓差', 'Pressure difference', WHITE], ['風', 'Wind', WIND]], [0.8, 2.8, 4.0], 104);
  }

  /* ═════════════════ 第 4 步：風力發電 ═════════════════ */
  const TURB = [{ x: 200, y: 215, R: 74, d: 0, ph: 0.3 }, { x: 410, y: 195, R: 66, d: 0.5, ph: 1.4 }, { x: 600, y: 225, R: 58, d: 1.0, ph: 2.6 }];
  const KW = 2.7;                    /* 葉片角速度＝KW × 風速 */
  const windV = x => 0.55 + 0.25 * Math.sin(0.9 * x) + 0.15 * Math.sin(2.3 * x + 1);
  const windI = x => 0.55 * x + (0.25 / 0.9) * (1 - Math.cos(0.9 * x)) + (0.15 / 2.3) * (Math.cos(1) - Math.cos(2.3 * x + 1));   /* ∫₀ˣ windV */
  const power = x => { const v = windV(x); return v * v; };
  const CV = { x0: 704, x1: 928, y0: 178, y1: 292, win: 6 };
  function turbine(c, T4, u, glowA) {
    const th = T4.ph + KW * windI(u - T4.d), x = T4.x, y = T4.y, R = T4.R;
    c.fillStyle = '#c9d4d1'; c.beginPath();
    c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.lineTo(x + 7, 432); c.lineTo(x - 7, 432); c.closePath(); c.fill();
    if (glowA > 0.02) W5.glow(c, x, y, R * 0.45, ENE, 0.6 * glowA);
    c.fillStyle = '#dfe8e4'; W5.rr(c, x - 6, y - 7, 22, 14, 5); c.fill();
    for (let j = 0; j < 3; j++) {
      const an = th + j * TAU / 3;
      c.save(); c.translate(x, y); c.rotate(an);
      c.fillStyle = '#f6f3ea'; c.beginPath(); c.moveTo(0, -R * 0.06);
      c.quadraticCurveTo(R * 0.4, -R * 0.13, R, -R * 0.02); c.lineTo(R, R * 0.02); c.quadraticCurveTo(R * 0.4, R * 0.06, 0, R * 0.06); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = METAL; c.beginPath(); c.arc(x, y, R * 0.09, 0, TAU); c.fill();
  }
  function iconWeather(c, x, y) {
    cloud(c, x, y - 3, 30, 1, '#c9d4d1');
    c.strokeStyle = WATER; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 6 + i * 6, y + 6); c.lineTo(x - 8 + i * 6, y + 12); c.stroke(); }
  }
  function iconNoise(c, x, y) {
    c.fillStyle = '#c9d4d1'; c.beginPath(); c.moveTo(x - 10, y - 4); c.lineTo(x - 5, y - 4); c.lineTo(x + 1, y - 10); c.lineTo(x + 1, y + 10); c.lineTo(x - 5, y + 4); c.lineTo(x - 10, y + 4); c.closePath(); c.fill();
    c.strokeStyle = '#c9d4d1'; c.lineWidth = 2;
    [6, 11].forEach(r => { c.beginPath(); c.arc(x + 2, y, r, -0.8, 0.8); c.stroke(); });
  }
  function iconScenery(c, x, y) {
    c.fillStyle = REN; c.beginPath(); c.moveTo(x - 13, y + 9); c.lineTo(x - 3, y - 7); c.lineTo(x + 3, y + 1); c.lineTo(x + 7, y - 4); c.lineTo(x + 14, y + 9); c.closePath(); c.fill();
    c.strokeStyle = '#f6f3ea'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 3, y - 12); c.lineTo(x + 3, y + 2); c.stroke();
    c.beginPath(); c.moveTo(x + 3, y - 12); c.lineTo(x + 9, y - 14); c.moveTo(x + 3, y - 12); c.lineTo(x - 2, y - 17); c.stroke();
  }
  function step4(c, s) {
    const u = s.u, k = s.k;
    const elec = seg(u, 1.6, 2.2);
    const v = windV(u), Wd = windI(u);

    withA(c, k, () => {
      /* 遠方山丘 */
      c.fillStyle = GROUND; c.beginPath(); c.moveTo(40, 445); c.lineTo(40, 436);
      c.quadraticCurveTo(240, 420, 420, 432); c.quadraticCurveTo(560, 424, 680, 434); c.lineTo(680, 445); c.closePath(); c.fill();
      /* 風的流線：速度與亮度都跟著風速 */
      c.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        const span = 640, y = 142 + hash(i + 500) * 150, sp = 150 + 40 * hash(i + 510);
        const x = 40 + (((Wd * sp + hash(i + 520) * span) % span) + span) % span;
        const len = 30 + 60 * v;
        c.strokeStyle = W5.rgba(WIND, 0.25 + 0.5 * v); c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(Math.min(x + len, 40 + span), y); c.stroke();
      }
      TURB.slice().reverse().forEach(T4 => turbine(c, T4, u, elec * power(u - T4.d)));
    });
    T(c, k, L('風', 'Wind'), 64, 318, WIND, 22, 'left');
    W5.arrow(c, 64, 342, 112, 342, W5.rgba(WIND, k), 3.5, 12);
    T(c, k, L('風力發電機', 'Wind turbines'), 186, 372, WHITE, 20, 'right');
    P(c, k * seg(u, 2.4, 2.9), L('再生能源', 'Renewable'), 110, 408, REN, 20);

    /* 右側：發電量曲線（風不穩定） */
    const ca = k * seg(u, 2.4, 2.9);
    withA(c, ca, () => {
      c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, CV.x0 - 8, CV.y0 - 10, CV.x1 - CV.x0 + 16, CV.y1 - CV.y0 + 20, 12); c.fill();
      c.strokeStyle = W5.rgba(ENE, 0.5); c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(CV.x0, CV.y1); c.lineTo(CV.x1, CV.y1); c.moveTo(CV.x0, CV.y0); c.lineTo(CV.x0, CV.y1); c.stroke();
      c.strokeStyle = ENE; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
      const W0 = CV.x1 - CV.x0 - 12;
      for (let px = 0; px <= W0; px += 2) {
        const tt = u - (1 - px / W0) * CV.win, y = CV.y1 - 8 - (CV.y1 - CV.y0 - 16) * power(tt) / 0.95;
        if (px === 0) c.moveTo(CV.x0 + px, y); else c.lineTo(CV.x0 + px, y);
      }
      c.stroke();
      const yNow = CV.y1 - 8 - (CV.y1 - CV.y0 - 16) * power(u) / 0.95;
      W5.glow(c, CV.x0 + W0, yNow, 14, ENE, 0.8);
      c.fillStyle = WHITE; c.beginPath(); c.arc(CV.x0 + W0, yNow, 4.5, 0, TAU); c.fill();
    });
    T(c, ca, L('發電量', 'Power output'), (CV.x0 + CV.x1) / 2, 152, ENE, 20);

    /* 右側：三個小標示 */
    const TAGS = [[iconWeather, '受天候影響', 'Depends on weather', 3.6], [iconNoise, '噪音', 'Noise', 4.2], [iconScenery, '景觀', 'Scenery', 4.8]];
    TAGS.forEach((g, i) => {
      const a = k * seg(u, g[3], g[3] + 0.5), y = 330 + i * 46;
      withA(c, a, () => g[0](c, 702, y));
      P(c, a, L(g[1], g[2]), 722, y, CAUTION, 20, 'left');
    });

    chain(c, k, u, [['風的動能', "Wind's kinetic energy", ENE], ['電能', 'Electrical', ENE]], [0.6, 1.8], 104);
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['水循環是太陽推動', 'The Sun drives the water cycle'],
      sub: ['太陽加熱海面，水蒸發成水蒸氣上升成雲，降雨落在山上，再沿河流回到海洋', 'Sunlight warms the sea; water evaporates, rises and forms clouds, rain falls on the mountains, and rivers carry it back.'],
      con: ['結論：是太陽把水送到高山上——水力的能量來自太陽', 'Conclusion: the Sun lifts water up the mountains, so hydropower\'s energy comes from the Sun.'] },
    { title: ['水力發電', 'Hydropower'],
      sub: ['水庫把水存在高處，水沿引水道往下衝，推動水輪機帶動發電機', 'A reservoir stores water up high; it rushes down the penstock and spins the turbine and generator.'],
      con: ['結論：重力位能 → 動能 → 電能；台灣河川短而急，能存的水有限', 'Conclusion: gravitational PE → kinetic → electrical. Taiwan\'s rivers are short and steep, so storage is limited.'] },
    { title: ['風從哪裡來', 'Where does wind come from?'],
      sub: ['陽光照得較熱的地方，空氣受熱上升、氣壓變低；較冷處氣壓較高，空氣流過來補', 'Where the ground is warmer, air heats up and rises, so pressure drops; cooler air at higher pressure flows in.'],
      con: ['結論：陽光照射不均 → 氣壓差 → 風，所以風的能量也來自太陽', 'Conclusion: uneven sunlight → pressure difference → wind. Wind energy also comes from the Sun.'] },
    { title: ['風力發電', 'Wind power'],
      sub: ['風推動葉片轉動，帶動發電機；風速一變，轉速和發電量就跟著變', 'Wind turns the blades, which drive a generator; when the wind speed changes, so do the spin and the output.'],
      con: ['結論：風的動能 → 電能；可再生、不排碳，但受天候影響、有噪音、改變景觀', 'Conclusion: wind\'s kinetic energy → electricity. Renewable and carbon-free, but weather-dependent, noisy, and it changes the scenery.'] }
  ];

  W5.register('hydrowind', {
    canvas: 'cvs-hydrowind',
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
