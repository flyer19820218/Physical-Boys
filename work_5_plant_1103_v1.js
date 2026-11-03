/* ==================================================================
   work_5 ｜ 核能電廠（壓水式 PWR）兩個迴路側視示意（cvs-plant，960×540）
   五步自動循環：1 反應爐產熱 → 2 產生蒸氣 → 3 推動渦輪 → 4 發電機 → 5 冷卻與輸電
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   版面（左→右）：反應爐（燃料棒、控制棒）→ 蒸氣產生器 → 渦輪機 → 發電機 → 變壓器／輸電塔；
   渦輪下方冷凝器＋冷卻水（海水）；右上角一塊「說明板」每步換內容
   （1 水溫、2 圖例、3 渦輪正視、4 發電機放大＋交流波形＋燈泡、5 能量長條）。

   語意色（比照 fission）：能量＝黃 COL.energy、熱＝橘紅 HEAT、水＝藍 WATER、蒸氣＝淡白 STEAM；
   一次水被加熱後由藍漸變成橘紅；磁鐵 N 紅、S 藍（比照 electromagnetic_induction_4）。
   本動畫沒有電子、沒有電流小點：發電只用交流波形、線圈微光與燈泡亮度表示。

   純函式作法：所有狀態都由 s 算出（state(s)）；渦輪／轉子角度用「角速度的解析積分」θ(t)，
   跳步驟、重播時畫面與真的播過一樣；亂數一律 W5.hash。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy, WHITE = COL.white, DIM = COL.dim, GOOD = COL.green, ORANGE = COL.orange;
  const HEAT = '#ff6a3d';            /* 熱：橘紅（同 fission） */
  const WATER = '#5ab8e8';           /* 水：藍（同 fission） */
  const STEAM = '#e8f1f4';           /* 蒸氣：淡白 */
  const NPOLE = '#ff6f76', SPOLE = '#72b9ff';
  const COPPER = '#d08a4a', METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f';
  const DUR = [7.5, 8, 8, 8.5, 9];   /* 總長 41 秒 */
  const B = [0]; DUR.forEach(d => B.push(B[B.length - 1] + d));
  const DIMA = 0.42;                 /* 非本步重點的元件淡一點 */

  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), Bc = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, Bc[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字（同 fission）：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  /* 多行標籤：字串用 \n 分行 */
  function TL(c, a, str, x, y, col, size, align, lh) {
    size = size || 20; lh = lh || size + 6;
    str.split('\n').forEach((l, i) => T(c, a, l, x, y + i * lh, col, size, align));
  }
  const CJK = /[⺀-鿿　-〿＀-￯]/;
  const NOHEAD = /^[，、。：；）」！？]/;
  function wrap(c, str, size, maxW) {
    if (str.indexOf('\n') >= 0) return str.split('\n');
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
  /* 底部字幕（同 fission）；結論用綠框 */
  function subtitle(c, a, str, border) {
    if (a <= 0.02) return;
    const size = 22, lh = 31, lines = wrap(c, str, size, 860);
    let w = 0; lines.forEach(l => { w = Math.max(w, W5.tw(c, l, size)); });
    w += 48; const h = lines.length * lh + 18, y0 = 490 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.84)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    lines.forEach((l, i) => W5.label(c, l, 480, y0 + 9 + lh * (i + 0.5), WHITE, size));
    c.restore();
  }

  /* ── 管路：折線＋沿線距離 ── */
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
  /* 管子：外殼＋內容物（fill 可為 null＝空管；d1＝填到哪裡） */
  function pipe(c, path, fill, w, d1) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
    subPath(c, path, 0, path.len);
    c.strokeStyle = '#0b1a15'; c.lineWidth = w + 7; c.stroke();
    c.strokeStyle = '#6d817a'; c.lineWidth = w + 4; c.stroke();
    c.strokeStyle = EMPTY; c.lineWidth = w; c.stroke();
    const e = d1 == null ? path.len : d1;
    if (fill && e > 0.5) { subPath(c, path, 0, e); c.strokeStyle = fill; c.lineWidth = w; c.stroke(); }
    c.restore();
  }
  /* 管內流動的亮紋（off 隨時間增加＝往前流） */
  function flow(c, path, col, off, gap, dash, w, d1, a) {
    if (a != null && a <= 0.02) return;
    const e = d1 == null ? path.len : d1;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0 - gap; d < e; d += gap) {
      const p = Math.max(0, d), q = Math.min(e, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
    }
    c.restore();
  }
  function pump(c, x, y, ang) {
    c.save();
    c.fillStyle = SHELL; c.strokeStyle = METAL; c.lineWidth = 2.5;
    c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#cfe0da'; c.lineWidth = 2;
    for (let j = 0; j < 3; j++) { const an = ang + j * TAU / 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * 8, y + Math.sin(an) * 8); c.stroke(); }
    c.restore();
  }

  /* ═════════════════ 幾何 ═════════════════ */
  const RV = { x: 104, y: 176, w: 108, h: 240, r: 44 };                 /* 反應爐壓力槽 */
  const FUEL = [128, 150, 172, 194], CROD = [139, 161, 183], CORE0 = 282, CORE1 = 400, CTIP = 300;
  const SG = { x: 262, y: 136, w: 76, h: 280, r: 30 }, LEVEL = 216;     /* 蒸氣產生器 */
  const HOT = mkPath([[212, 232], [240, 232], [240, 404], [284, 404]]);
  const UT = mkPath((function () {
    const pts = [[284, 404], [284, 250]];
    for (let i = 1; i < 12; i++) { const th = Math.PI - i / 12 * Math.PI; pts.push([300 + 16 * Math.cos(th), 250 - 16 * Math.sin(th)]); }
    pts.push([316, 250], [316, 404]); return pts;
  })());
  const COLD = mkPath([[316, 404], [316, 430], [226, 430], [226, 350], [212, 350]]);
  const STP = mkPath([[300, 136], [300, 112], [440, 112], [440, 182]]);  /* 蒸氣管 */
  const TB = { x0: 424, x1: 548, h0: 28, h1: 62, cy: 206 };            /* 渦輪機（左窄右寬） */
  const tbHalf = x => lerp(TB.h0, TB.h1, (x - TB.x0) / (TB.x1 - TB.x0));
  const GN = { x: 578, y: 156, w: 106, h: 100, cx: 631, cy: 206, r: 38 }; /* 發電機 */
  const CD = { x: 424, y: 320, w: 136, h: 82 };                         /* 冷凝器 */
  const FEED = mkPath([[470, 402], [470, 428], [356, 428], [356, 300], [338, 300]]);
  const COOLP = mkPath([[596, 430], [572, 430], [572, 380], [440, 380], [440, 344], [676, 344], [676, 400]]);
  const COOL_TUBE_END = COOLP.cum[5] - (676 - 560);                     /* 離開冷凝器的位置 */
  const SEA = { x: 584, y: 392, w: 116, h: 52 };
  const WIRE = mkPath([[664, 256], [664, 318], [764, 318]]);
  const TF = { x: 764, y: 292, w: 32, h: 52, cx: 780 };                 /* 變壓器 */
  const TW = { cx: 880, top: 262, base: 440 };                          /* 輸電塔 */
  const PANEL = { x: 700, y: 66, w: 244, h: 190 };                      /* 右上說明板 */

  /* ═════════════════ 轉軸角度：角速度平滑上升後定速，θ 為解析積分 ═════════════════ */
  const R0 = B[2] + 1.3, RD = 2.6, OM = TAU * 0.85;
  function theta(t) {
    if (t <= R0) return 0;
    const x = (t - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (t - R0 - RD));
  }
  const amp = t => ease((t - R0) / RD);
  const emf = t => amp(t) * Math.sin(theta(t));

  function state(s) {
    const n = s.n, u = s.u, t = s.t;
    return {
      t, n, u,
      heat: n === 1 ? ease(seg(u, 0.6, 5.6)) : 1,
      act: n === 1 ? ease(seg(u, 0.1, 1.0)) : 1,
      boil: n === 1 ? 0 : n === 2 ? ease(seg(u, 1.2, 2.8)) : 1,
      steamFill: n === 1 ? 0 : n === 2 ? ease(seg(u, 2.2, 5.2)) : 1,
      steamFront: n < 3 ? 0 : n === 3 ? ease(seg(u, 0.2, 1.6)) : 1,
      th: theta(t), A: amp(t),
      cool: n === 5 ? ease(seg(u, 0.3, 1.3)) : 0,
      elec: n === 4 ? ease(seg(u, 0.5, 2.0)) : n === 5 ? 1 : 0,
      grid: n === 5 ? ease(seg(u, 3.2, 4.4)) : 0
    };
  }

  /* 每步的重點元件：R 反應爐、P 一次迴路、S 蒸氣產生器、X 蒸氣管、T 渦輪、G 發電機、C 冷凝器＋回水、W 冷卻水、E 變壓器與輸電 */
  const FOC = { 1: 'RP', 2: 'PS', 3: 'XT', 4: 'TGE', 5: 'CWE' };
  function fa(s, ch) {
    const a = FOC[s.prev].indexOf(ch) >= 0 ? 1 : DIMA, b = FOC[s.n].indexOf(ch) >= 0 ? 1 : DIMA;
    return lerp(a, b, s.k);
  }
  const isF = (s, ch) => FOC[s.n].indexOf(ch) >= 0;

  /* ═════════════════ 元件 ═════════════════ */
  function primaryColors(S) {
    const hotC = mixHex(WATER, HEAT, S.heat);
    const coolC = mixHex(WATER, mixHex(HEAT, ORANGE, S.boil), S.heat * (1 - 0.3 * S.boil));
    return { hotC, coolC };
  }

  function drawReactor(c, S, al) {
    c.save(); c.globalAlpha *= al;
    const { hotC, coolC } = primaryColors(S);
    /* 壓力槽內的一次水：上熱下涼 */
    c.save();
    W5.rr(c, RV.x, RV.y, RV.w, RV.h, RV.r); c.clip();
    const g = c.createLinearGradient(0, RV.y, 0, RV.y + RV.h);
    g.addColorStop(0, hotC); g.addColorStop(0.55, mixHex(coolC, hotC, 0.5)); g.addColorStop(1, coolC);
    c.globalAlpha *= 0.82; c.fillStyle = g; c.fillRect(RV.x, RV.y, RV.w, RV.h); c.globalAlpha /= 0.82;
    /* 熱水往上冒的波紋 */
    c.strokeStyle = W5.rgba('#ffe2c8', 0.45 * S.heat); c.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const x0 = 114 + i * 18, ph = (S.t * 46 + hash(i + 3) * 90) % 90;
      for (let m = 0; m < 3; m++) {
        const yb = CORE0 - 4 - ph - m * 30 + 30;
        if (yb < RV.y + 10 || yb > CORE0) continue;
        c.beginPath();
        for (let k = 0; k <= 8; k++) { const yy = yb - k * 2.5, xx = x0 + 3 * Math.sin(k * 0.9 + S.t * 4 + i); if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); }
        c.stroke();
      }
    }
    /* 爐心光暈 */
    W5.glow(c, 161, 342, 100, HEAT, 0.55 * S.heat * S.act + 0.12 * S.act);
    /* 燃料棒 */
    FUEL.forEach((x, i) => {
      const gr = c.createLinearGradient(x - 6, 0, x + 6, 0);
      gr.addColorStop(0, '#6f6640'); gr.addColorStop(0.4, mixHex('#c9b66e', '#ffcf8a', S.heat)); gr.addColorStop(1, '#5d5636');
      c.fillStyle = gr; W5.rr(c, x - 6, CORE0, 12, CORE1 - CORE0, 4); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1; c.stroke();
    });
    /* 核分裂的閃光（能量黃＋熱橘紅），位置用 hash */
    const PER = 0.045, i0 = Math.floor(S.t / PER);
    for (let j = i0 - 7; j <= i0; j++) {
      if (j < 0) continue;
      const age = S.t - j * PER; if (age < 0 || age > 0.45) continue;
      if (hash(j * 3 + 7) > S.act) continue;
      const x = FUEL[Math.floor(hash(j * 3 + 1) * 4)], y = CORE0 + 8 + hash(j * 3 + 2) * (CORE1 - CORE0 - 16), k = 1 - age / 0.45;
      W5.glow(c, x, y, 10 + 22 * k, HEAT, 0.7 * k);
      W5.glow(c, x, y, 9, ENE, 0.95 * k * k);
    }
    /* 控制棒（部分插入） */
    CROD.forEach(x => {
      const gr = c.createLinearGradient(x - 4, 0, x + 4, 0);
      gr.addColorStop(0, '#1f2a27'); gr.addColorStop(0.45, '#56665f'); gr.addColorStop(1, '#1a2421');
      c.fillStyle = gr; W5.rr(c, x - 4, RV.y - 4, 8, CTIP - RV.y + 4, 3); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 1; c.stroke();
    });
    c.restore();
    /* 槽壁、上蓋與控制棒驅動 */
    c.strokeStyle = '#9fb3ac'; c.lineWidth = 4; W5.rr(c, RV.x, RV.y, RV.w, RV.h, RV.r); c.stroke();
    c.fillStyle = '#33423e'; W5.rr(c, 122, 146, 72, 30, 6); c.fill(); c.strokeStyle = METAL; c.lineWidth = 2; c.stroke();
    c.restore();
  }

  function drawPrimary(c, S, al) {
    c.save(); c.globalAlpha *= al;
    const { hotC, coolC } = primaryColors(S), off = S.t * 70;
    pipe(c, HOT, hotC, 10); flow(c, HOT, 'rgba(255,255,255,0.45)', off, 34, 10, 4);
    pipe(c, COLD, coolC, 10); flow(c, COLD, 'rgba(255,255,255,0.45)', off, 34, 10, 4);
    pump(c, 262, 430, S.t * 7);
    c.restore();
  }

  function drawSG(c, S, al) {
    c.save(); c.globalAlpha *= al;
    const { hotC, coolC } = primaryColors(S);
    c.save(); W5.rr(c, SG.x, SG.y, SG.w, SG.h, SG.r); c.clip();
    c.fillStyle = EMPTY; c.fillRect(SG.x, SG.y, SG.w, SG.h);
    /* 上方：蒸氣 */
    c.fillStyle = W5.rgba(STEAM, 0.05 + 0.42 * S.steamFill); c.fillRect(SG.x, SG.y, SG.w, LEVEL - SG.y);
    for (let i = 0; i < 12; i++) {
      if (hash(i + 120) > S.steamFill) continue;
      const x = SG.x + 12 + hash(i + 130) * (SG.w - 24) + 3 * Math.sin(S.t * 2 + i);
      const y = LEVEL - 4 - ((S.t * 30 + hash(i + 140) * 76) % 76);
      c.fillStyle = W5.rgba(STEAM, 0.38); c.beginPath(); c.arc(x, y, 6 + 4 * hash(i + 150), 0, TAU); c.fill();
    }
    /* 下方：二次水（藍），沸騰時水面起伏 */
    const wob = 2.5 * S.boil;
    c.beginPath(); c.moveTo(SG.x, SG.y + SG.h);
    for (let x = SG.x; x <= SG.x + SG.w; x += 4) c.lineTo(x, LEVEL + wob * Math.sin(x / 9 + S.t * 7));
    c.lineTo(SG.x + SG.w, SG.y + SG.h); c.closePath();
    c.fillStyle = W5.rgba(mixHex(WATER, '#9fd8f5', 0.3 * S.boil), 0.55); c.fill();
    /* U 形管（一次水，左進熱、右出較涼） */
    pipe(c, UT, hotC, 10);
    c.save(); c.lineJoin = 'round'; subPath(c, UT, UT.len / 2, UT.len); c.strokeStyle = coolC; c.lineWidth = 10; c.stroke(); c.restore();
    flow(c, UT, 'rgba(255,255,255,0.45)', S.t * 70, 34, 10, 4);
    /* 沸騰氣泡 */
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6;
    for (let i = 0; i < 24; i++) {
      if (hash(i + 50) > S.boil) continue;
      const sp = 40 + 35 * hash(i + 60), y = 408 - ((S.t * sp + hash(i + 70) * 190) % 190);
      const x = SG.x + 8 + hash(i + 80) * (SG.w - 16) + 2 * Math.sin(S.t * 5 + i);
      c.beginPath(); c.arc(x, y, 1.6 + 2.6 * hash(i + 90) * (1 + (408 - y) / 190), 0, TAU); c.stroke();
    }
    c.restore();
    c.strokeStyle = '#9fb3ac'; c.lineWidth = 4; W5.rr(c, SG.x, SG.y, SG.w, SG.h, SG.r); c.stroke();
    c.restore();
  }

  function drawSteamPipe(c, S, al) {
    c.save(); c.globalAlpha *= al;
    const front = STP.len * S.steamFront;
    pipe(c, STP, mixHex(EMPTY, STEAM, 0.6), 12, front);
    if (front > 1) {
      c.fillStyle = 'rgba(255,255,255,0.85)';
      const off = S.t * 160;
      for (let d = (off % 30) - 30; d < front; d += 30) { if (d < 0) continue; const q = at(STP, d); c.beginPath(); c.arc(q.x, q.y, 3.5, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  function turbinePoly(c) {
    c.beginPath(); c.moveTo(TB.x0, TB.cy - TB.h0); c.lineTo(TB.x1, TB.cy - TB.h1);
    c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(TB.x0, TB.cy + TB.h0); c.closePath();
  }
  function drawTurbine(c, S, al) {
    c.save(); c.globalAlpha *= al;
    /* 排氣管（接冷凝器），畫在渦輪後面 */
    c.fillStyle = SHELL; c.fillRect(512, 250, 32, 72); c.strokeStyle = METAL; c.lineWidth = 2; c.strokeRect(512, 250, 32, 72);
    for (let i = 0; i < 5; i++) {   /* 用過的蒸氣往下流 */
      const ph = (S.t * 1.1 + i / 5) % 1;
      c.fillStyle = W5.rgba(STEAM, 0.45 * S.A * (1 - ph)); c.beginPath(); c.arc(520 + hash(i + 300) * 16, 262 + ph * 56, 5, 0, TAU); c.fill();
    }
    /* 轉軸 */
    c.fillStyle = '#7f918a'; c.fillRect(TB.x0 - 6, TB.cy - 4, GN.x - TB.x0 + 12, 8);
    /* 外殼 */
    turbinePoly(c);
    const g = c.createLinearGradient(0, TB.cy - TB.h1, 0, TB.cy + TB.h1);
    g.addColorStop(0, '#34463f'); g.addColorStop(0.5, '#22312d'); g.addColorStop(1, '#34463f');
    c.fillStyle = g; c.fill();
    c.save(); turbinePoly(c); c.clip();
    c.fillStyle = '#7f918a'; c.fillRect(TB.x0, TB.cy - 4, TB.x1 - TB.x0, 8);
    /* 蒸氣在渦輪裡往右流 */
    if (S.steamFront >= 1) {
      for (let i = 0; i < 14; i++) {
        const px = TB.x0 + ((S.t * 110 + i * 37) % (TB.x1 - TB.x0)), hh = tbHalf(px) * 0.85;
        const py = TB.cy + (hash(i + 400) - 0.5) * 2 * hh;
        c.fillStyle = W5.rgba(STEAM, 0.30); c.beginPath(); c.arc(px, py, 4 + 2 * hash(i + 410), 0, TAU); c.fill();
      }
    }
    /* 葉片列（側視）：葉片隨轉軸角度上下繞，正面亮、背面暗 */
    for (let r = 0; r < 5; r++) {
      const x = 438 + r * 24, hh = tbHalf(x) - 6;
      for (let j = 0; j < 10; j++) {
        const a = S.th + j * TAU / 10 + r * 0.3, yb = TB.cy + hh * Math.cos(a), front = Math.sin(a) > 0;
        c.strokeStyle = front ? '#d8e8e2' : '#56685f'; c.lineWidth = front ? 3.2 : 2.2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 5, yb - 4); c.lineTo(x + 5, yb + 4); c.stroke();
      }
    }
    c.restore();
    turbinePoly(c); c.strokeStyle = METAL; c.lineWidth = 3; c.stroke();
    c.restore();
  }

  /* 磁鐵在線圈中：cx,cy 中心、R 定子半徑；letters＝寫 N/S */
  function magnetCoil(c, cx, cy, R, th, glowA, letters) {
    c.save();
    c.strokeStyle = '#5d6f69'; c.lineWidth = R * 0.14;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    /* 上下兩個線圈 */
    const cw = R * 0.9, ch = R * 0.36;
    [-1, 1].forEach(sd => {
      const y0 = cy + sd * (R - ch * 0.5) - ch / 2;
      if (glowA > 0.02) W5.glow(c, cx, y0 + ch / 2, R * 0.75, ENE, 0.7 * glowA);
      c.fillStyle = '#7a4a22'; W5.rr(c, cx - cw / 2, y0, cw, ch, 3); c.fill();
      c.strokeStyle = COPPER; c.lineWidth = Math.max(1.5, R * 0.05);
      for (let k = 0; k < 6; k++) { const xx = cx - cw / 2 + cw * (k + 0.5) / 6; c.beginPath(); c.moveTo(xx - 2, y0 + 1); c.lineTo(xx + 2, y0 + ch - 1); c.stroke(); }
    });
    /* 轉子磁鐵 */
    c.translate(cx, cy); c.rotate(th);
    const hl = R * 0.56, hw = R * 0.22;
    c.fillStyle = NPOLE; W5.rr(c, 0, -hw, hl, hw * 2, 3); c.fill();
    c.fillStyle = SPOLE; W5.rr(c, -hl, -hw, hl, hw * 2, 3); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; W5.rr(c, -hl, -hw, hl * 2, hw * 2, 3); c.stroke();
    c.fillStyle = '#cfe0da'; c.beginPath(); c.arc(0, 0, R * 0.08, 0, TAU); c.fill();
    c.restore();
    if (letters) {
      const d = hl * 0.55;
      W5.label(c, 'N', cx + Math.cos(th) * d, cy + Math.sin(th) * d + 1, '#ffffff', 20, 'center', true);
      W5.label(c, 'S', cx - Math.cos(th) * d, cy - Math.sin(th) * d + 1, '#ffffff', 20, 'center', true);
    }
  }

  function drawGenerator(c, S, al) {
    c.save(); c.globalAlpha *= al;
    c.fillStyle = SHELL; W5.rr(c, GN.x, GN.y, GN.w, GN.h, 16); c.fill();
    c.strokeStyle = METAL; c.lineWidth = 3; c.stroke();
    magnetCoil(c, GN.cx, GN.cy, GN.r, S.th + Math.PI / 2, S.elec * Math.abs(emf(S.t)), false);
    c.restore();
  }

  function drawCondShell(c, S, al) {   /* 外殼與底部集水：畫在冷卻水管之前，管子才看得到 */
    c.save(); c.globalAlpha *= al;
    c.fillStyle = '#1a2b27'; W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.fill();
    c.save(); W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.clip();
    c.fillStyle = W5.rgba(WATER, 0.6); c.fillRect(CD.x, 389, CD.w, 20);
    c.restore();
    c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.stroke();
    c.restore();
  }
  function drawCondenser(c, S, al) {
    c.save(); c.globalAlpha *= al;
    c.save(); W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.clip();
    for (let i = 0; i < 8; i++) {   /* 進來的蒸氣（淡白）往下散開 */
      const ph = (S.t * 0.9 + hash(i + 500)) % 1;
      const x = 528 - ph * (20 + 70 * hash(i + 510)), y = 326 + ph * 30;
      c.fillStyle = W5.rgba(STEAM, 0.5 * Math.max(S.A, S.cool) * (1 - ph)); c.beginPath(); c.arc(x, y, 6 + 4 * ph, 0, TAU); c.fill();
    }
    for (let i = 0; i < 14; i++) {  /* 冷卻後凝結的水滴（藍） */
      const ph = (S.t * 1.25 + hash(i + 200)) % 1;
      const x = 446 + hash(i + 210) * 104, y = 350 + ph * 40;
      c.fillStyle = W5.rgba(WATER, 0.95 * S.cool * Math.min(1, ph * 4));
      c.beginPath(); c.ellipse(x, y, 2.6, 3.6, 0, 0, TAU); c.fill();
    }
    c.restore();
    c.restore();
  }

  function drawCooling(c, S, al) {
    c.save(); c.globalAlpha *= al;
    /* 海：水面起伏 */
    c.beginPath(); c.moveTo(SEA.x, SEA.y + SEA.h);
    for (let x = SEA.x; x <= SEA.x + SEA.w; x += 4) c.lineTo(x, SEA.y + 2 + 3 * Math.sin(x / 16 + S.t * 1.6));
    c.lineTo(SEA.x + SEA.w, SEA.y + SEA.h); c.closePath();
    const g = c.createLinearGradient(0, SEA.y, 0, SEA.y + SEA.h); g.addColorStop(0, W5.rgba(WATER, 0.55)); g.addColorStop(1, W5.rgba(WATER, 0.22));
    c.fillStyle = g; c.fill();
    if (S.cool > 0.02) W5.glow(c, 676, 404, 46, ORANGE, 0.45 * S.cool);       /* 溫排水：廢熱 */
    /* 冷卻水管：進冷凝器前藍，出來後溫一點 */
    pipe(c, COOLP, WATER, 8);
    c.save(); c.lineJoin = 'round'; subPath(c, COOLP, COOL_TUBE_END, COOLP.len); c.strokeStyle = mixHex(WATER, ORANGE, 0.55 * S.cool); c.lineWidth = 8; c.stroke(); c.restore();
    flow(c, COOLP, 'rgba(255,255,255,0.55)', S.t * 80, 30, 9, 3, null, S.cool);
    c.restore();
  }

  function drawFeed(c, S, al) {
    c.save(); c.globalAlpha *= al;
    pipe(c, FEED, WATER, 8);
    flow(c, FEED, 'rgba(255,255,255,0.55)', S.t * 60, 30, 9, 3, null, S.cool);
    pump(c, 412, 428, S.t * 7 * S.cool);
    c.restore();
  }

  function sag(c, x0, y0, x1, y1, dip) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + dip, x1, y1); }
  function drawGrid(c, S, al) {
    c.save(); c.globalAlpha *= al;
    /* 發電機 → 變壓器 */
    c.lineJoin = 'round';
    subPath(c, WIRE, 0, WIRE.len); c.strokeStyle = '#9a7b52'; c.lineWidth = 4; c.stroke();
    if (S.elec > 0.02) {
      const sh = 0.85 + 0.15 * Math.sin(S.t * 6);
      c.save(); c.globalAlpha *= S.elec;
      subPath(c, WIRE, 0, WIRE.len); c.strokeStyle = W5.rgba(ENE, 0.25 * sh); c.lineWidth = 12; c.stroke();
      c.strokeStyle = ENE; c.lineWidth = 3.5; c.stroke(); c.restore();
    }
    /* 變壓器：鐵芯＋兩組線圈（右邊匝數多＝升壓） */
    c.strokeStyle = '#6d817a'; c.lineWidth = 7; c.strokeRect(TF.x, TF.y, TF.w, TF.h);
    if (S.elec > 0.02) W5.glow(c, TF.cx, TF.y + TF.h / 2, 46, ENE, 0.3 * S.elec);
    c.strokeStyle = COPPER; c.lineWidth = 2.5;
    for (let k = 0; k < 5; k++) { const y = TF.y + 10 + k * 8; c.beginPath(); c.moveTo(TF.x - 7, y); c.lineTo(TF.x + 7, y + 3); c.stroke(); }
    for (let k = 0; k < 9; k++) { const y = TF.y + 6 + k * 4.6; c.beginPath(); c.moveTo(TF.x + TF.w - 7, y); c.lineTo(TF.x + TF.w + 7, y + 2); c.stroke(); }
    /* 輸電塔 */
    const t0 = TW.top, b0 = TW.base, cx = TW.cx;
    c.strokeStyle = METAL; c.lineWidth = 2.5; c.lineCap = 'round';
    const legL = y => lerp(cx - 14, cx - 42, (y - t0) / (b0 - t0)), legR = y => 2 * cx - legL(y);
    c.beginPath(); c.moveTo(cx - 14, t0); c.lineTo(cx - 42, b0); c.moveTo(cx + 14, t0); c.lineTo(cx + 42, b0); c.moveTo(cx - 14, t0); c.lineTo(cx + 14, t0); c.stroke();
    c.lineWidth = 1.5;
    for (let y = t0 + 24; y < b0 - 10; y += 34) {
      c.beginPath(); c.moveTo(legL(y), y); c.lineTo(legR(y + 34), Math.min(b0, y + 34)); c.moveTo(legR(y), y); c.lineTo(legL(y + 34), Math.min(b0, y + 34)); c.stroke();
    }
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx - 46, 284); c.lineTo(cx + 46, 284); c.moveTo(cx - 32, 314); c.lineTo(cx + 32, 314); c.stroke();
    /* 輸電線 */
    const lines = [[TF.x + TF.w, TF.y + 8, cx - 46, 284, 10], [cx + 46, 284, 960, 292, 8], [TF.x + TF.w, TF.y + 40, cx - 32, 314, 8], [cx + 32, 314, 960, 322, 8]];
    lines.forEach(q => { sag(c, q[0], q[1], q[2], q[3], q[4]); c.strokeStyle = '#b9c7c1'; c.lineWidth = 2; c.stroke(); });
    if (S.grid > 0.02) {
      const sh = 0.85 + 0.15 * Math.sin(S.t * 6 + 1);
      c.save(); c.globalAlpha *= S.grid;
      lines.forEach(q => {
        sag(c, q[0], q[1], q[2], q[3], q[4]);
        c.strokeStyle = W5.rgba(ENE, 0.25 * sh); c.lineWidth = 9; c.stroke();
        c.strokeStyle = ENE; c.lineWidth = 2.5; c.stroke();
      });
      c.restore();
    }
    c.restore();
  }

  /* ═════════════════ 整張示意圖 ═════════════════ */
  function drawPlant(c, s, S) {
    drawCondShell(c, S, fa(s, 'C'));
    drawCooling(c, S, fa(s, 'W'));
    drawFeed(c, S, fa(s, 'C'));
    drawPrimary(c, S, fa(s, 'P'));
    drawSteamPipe(c, S, fa(s, 'X'));
    drawSG(c, S, Math.max(fa(s, 'S'), fa(s, 'P') * 0.8));
    drawReactor(c, S, fa(s, 'R'));
    drawCondenser(c, S, fa(s, 'C'));
    drawTurbine(c, S, fa(s, 'T'));
    drawGrid(c, S, fa(s, 'E'));
    drawGenerator(c, S, fa(s, 'G'));

    /* 元件名稱：本步重點白色，其餘淡色 */
    const nc = ch => (isF(s, ch) ? WHITE : DIM);
    T(c, 1, L('反應爐', 'Reactor'), 158, 434, nc('R'), 20);
    c.save(); c.strokeStyle = 'rgba(163,184,176,0.6)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(101, 158); c.lineTo(121, 160); c.moveTo(101, 332); c.lineTo(121, 334); c.stroke(); c.restore();
    TL(c, 1, L('控制棒', 'Control\nrods'), 98, 158, nc('R'), 20, 'right', 24);
    TL(c, 1, L('燃料棒\n（鈾）', 'Fuel\nrods (U)'), 98, 332, isF(s, 'R') ? '#e3cf85' : DIM, 20, 'right', 24);
    T(c, 1, L('蒸氣產生器', 'Steam generator'), 294, 122, nc('S'), 20, 'right');
    T(c, 1, L('渦輪機', 'Turbine'), 486, 134, nc('T'), 20);
    T(c, 1, L('發電機', 'Generator'), 631, 134, nc('G'), 20);
    T(c, 1, L('冷凝器', 'Condenser'), 506, 290, nc('C'), 20, 'right');
    T(c, 1, L('冷卻水', 'Cooling water'), 642, 422, isF(s, 'W') ? WATER : DIM, 20);
    T(c, 1, L('變壓器（升壓）', 'Step-up transformer'), 780, 372, nc('E'), 20);
    T(c, 1, L('輸電線', 'Power lines'), 836, 420, nc('E'), 20, 'right');
    T(c, S.steamFront, L('高壓蒸氣', 'High-pressure steam'), 370, 92, isF(s, 'X') ? STEAM : DIM, 20);
    T(c, S.cool, L('廢熱', 'waste heat'), 612, 370, HEAT, 20);
  }

  /* ═════════════════ 右上說明板 ═════════════════ */
  function panelBox(c, a, col) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 16); c.fill();
    c.lineWidth = 2; c.strokeStyle = W5.rgba(col, 0.55); c.stroke();
    c.restore();
  }
  function swatch(c, a, x, y, col, col2) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    if (col2) { const g = c.createLinearGradient(x, 0, x + 34, 0); g.addColorStop(0, col); g.addColorStop(1, col2); c.fillStyle = g; } else c.fillStyle = col;
    W5.rr(c, x, y - 8, 34, 16, 6); c.fill(); c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
  const PX = PANEL.x + 16, PCX = PANEL.x + PANEL.w / 2;
  /* 說明板標題：22px 放不下就用 20px（不再更小） */
  function head(c, a, str) { const sz = W5.tw(c, str, 22) + 28 <= PANEL.w - 16 ? 22 : 20; P(c, a, str, PCX, 94, ENE, sz); }

  function panel1(c, a, S) {
    panelBox(c, a, ENE);
    head(c, a, L('核能 → 熱能', 'Nuclear → heat'));
    swatch(c, a, PX, 132, WATER, HEAT);
    T(c, a, L('一次水', 'Primary water'), PX + 46, 132, WHITE, 20, 'left');
    T(c, a, L('水溫', 'Temp'), PX, 168, DIM, 20, 'left');
    T(c, a, Math.round(lerp(30, 320, S.heat)) + ' °C', PANEL.x + PANEL.w - 16, 168, mixHex(WATER, HEAT, S.heat), 26, 'right', true);
    TL(c, a, L('加壓到約 150 大氣壓，\n所以不會沸騰', 'Kept at ~150 atm,\nso it does not boil'), PX, 204, DIM, 20, 'left', 26);
  }
  function panel2(c, a, S, u) {
    panelBox(c, a, ENE);
    head(c, a, L('熱傳給二次水', 'Heat passes on'));
    swatch(c, a, PX, 130, HEAT); T(c, a, L('一次水', 'Primary water'), PX + 46, 130, WHITE, 20, 'left');
    swatch(c, a, PX, 156, WATER); T(c, a, L('二次水', 'Secondary water'), PX + 46, 156, WHITE, 20, 'left');
    const a3 = a * seg(u, 2.0, 2.6);
    swatch(c, a3, PX, 182, STEAM); T(c, a3, L('蒸氣', 'Steam'), PX + 46, 182, WHITE, 20, 'left');
    TL(c, a * seg(u, 3.2, 3.8), L('只傳熱，水不混合', 'Only heat passes;\nwater never mixes'), PX, 210, GOOD, 20, 'left', 26);
  }
  function panel3(c, a, S) {
    panelBox(c, a, ENE);
    if (a <= 0.02) return;
    head(c, a, L('熱能 → 動能', 'Heat → kinetic'));
    c.save(); c.globalAlpha *= a;
    const cx = 762, cy = 170, R = 44;
    /* 進來的蒸氣 */
    for (let i = 0; i < 6; i++) {
      const ph = (S.t * 1.4 + i / 6) % 1;
      c.fillStyle = W5.rgba(STEAM, 0.7 * S.steamFront * (1 - ph)); c.beginPath(); c.arc(712 + ph * 30, cy - 30 + i * 12, 3.5, 0, TAU); c.fill();
    }
    c.strokeStyle = '#5d6f69'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R + 4, 0, TAU); c.stroke();
    for (let j = 0; j < 10; j++) {   /* 正視的葉輪 */
      const an = S.th + j * TAU / 10;
      c.save(); c.translate(cx, cy); c.rotate(an);
      c.fillStyle = j === 0 ? '#ffffff' : '#b8cbc4';
      c.beginPath(); c.moveTo(9, -3); c.quadraticCurveTo(R * 0.6, -12, R, -6); c.lineTo(R, 4); c.quadraticCurveTo(R * 0.6, 0, 9, 4); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = '#7f918a'; c.beginPath(); c.arc(cx, cy, 10, 0, TAU); c.fill();
    c.restore();
    TL(c, a, L('蒸氣推動\n葉片旋轉', 'Steam\npushes\nthe blades'), 822, L('a', 'b') === 'a' ? 158 : 146, WHITE, 20, 'left', 26);
    T(c, a, L('實際每分鐘約 1800 轉', 'Real: ~1800 rpm'), PCX, 238, DIM, 20);
  }
  function panel4(c, a, S) {
    panelBox(c, a, ENE);
    if (a <= 0.02) return;
    head(c, a, L('動能 → 電能', 'Kinetic → electric'));
    c.save(); c.globalAlpha *= a;
    magnetCoil(c, 760, 170, 44, S.th + Math.PI / 2, S.elec * Math.abs(emf(S.t)), true);
    /* 燈泡：亮度＝發電量 */
    const bx = 882, by = 130, lit = S.elec * S.A;
    if (lit > 0.02) W5.glow(c, bx, by, 44, ENE, 0.75 * lit);
    c.fillStyle = mixHex('#3a4a45', '#fff4b0', lit); c.beginPath(); c.arc(bx, by, 15, 0, TAU); c.fill();
    c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7f918a'; c.fillRect(bx - 7, by + 14, 14, 10);
    c.strokeStyle = mixHex('#6d817a', '#ffb000', lit); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx - 5, by + 8); c.lineTo(bx - 3, by - 3); c.lineTo(bx, by + 2); c.lineTo(bx + 3, by - 3); c.lineTo(bx + 5, by + 8); c.stroke();
    /* 交流波形：最新的在右邊，往左捲 */
    const X0 = 826, X1 = 934, YC = 188, AMP = 20, WIN = 2.4;
    c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(X0, YC); c.lineTo(X1, YC); c.moveTo(X0, YC - AMP - 4); c.lineTo(X0, YC + AMP + 4); c.stroke();
    c.strokeStyle = ENE; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
    for (let px = 0; px <= X1 - X0; px += 2) {
      const tt = S.t - (1 - px / (X1 - X0)) * WIN, y = YC - AMP * S.elec * emf(tt);
      if (px === 0) c.moveTo(X0 + px, y); else c.lineTo(X0 + px, y);
    }
    c.stroke();
    c.restore();
    T(c, a, L('線圈', 'coils'), 760, 234, COPPER, 20);
    T(c, a, L('交流電', 'AC'), 880, 234, ENE, 20);
  }
  function panel5(c, a, S, u) {
    panelBox(c, a, ENE);
    if (a <= 0.02) return;
    head(c, a, L('能量去哪裡？', 'Where energy goes'));
    const bx = PX, by = 124, bw = PANEL.w - 32, bh = 26;
    const fill = ease(seg(u, 0.6, 1.8)), split = ease(seg(u, 2.2, 3.4));
    c.save(); c.globalAlpha *= a;
    c.fillStyle = '#0b1a15'; W5.rr(c, bx, by, bw, bh, 8); c.fill();
    c.save(); W5.rr(c, bx, by, bw, bh, 8); c.clip();
    c.fillStyle = HEAT; c.fillRect(bx, by, bw * fill, bh);
    if (split > 0) { c.fillStyle = ENE; c.fillRect(bx, by, bw / 3 * split, bh); }
    c.restore();
    if (split > 0.98) { c.strokeStyle = '#0b1a15'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw / 3, by); c.lineTo(bx + bw / 3, by + bh); c.stroke(); }
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5; W5.rr(c, bx, by, bw, bh, 8); c.stroke();
    c.restore();
    const r1 = a * seg(u, 2.8, 3.3), r2 = a * seg(u, 3.3, 3.8);
    swatch(c, r1, PX, 176, ENE); T(c, r1, L('約 1/3 → 電能', '~1/3 → electricity'), PX + 42, 176, ENE, 20, 'left');
    swatch(c, r2, PX, 204, HEAT); T(c, r2, L('約 2/3 → 廢熱', '~2/3 → waste heat'), PX + 42, 204, HEAT, 20, 'left');
    T(c, r2, L('（被冷卻水帶走）', '(into cooling water)'), PX + 42 * (L('a', 'b') === 'a' ? 1 : 0), 232, DIM, 20, 'left');
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['反應爐：核分裂產生熱', 'Reactor: fission makes heat'],
      sub: ['爐心的鈾核分裂放出大量的熱，把周圍的一次水加熱', 'Uranium fission in the core releases heat and warms the primary water around it.'],
      con: ['結論：核能 → 熱能，一次水被加熱到約 320 °C', 'Conclusion: nuclear energy → heat. The primary water reaches about 320 °C.'] },
    { title: ['蒸氣產生器：一次水把熱傳給二次水', 'Steam generator: heat passes to the second loop'],
      sub: ['熱的一次水流過細管，把熱傳給管外的二次水，二次水沸騰變成蒸氣', 'Hot primary water flows through tubes and heats the secondary water outside, which boils into steam.'],
      con: ['結論：只傳熱、不混水——有放射性的一次水不會流到渦輪', 'Conclusion: heat moves, water does not. The radioactive primary water never reaches the turbine.'] },
    { title: ['渦輪機：蒸氣推動葉片旋轉', 'Turbine: steam spins the blades'],
      sub: ['高壓蒸氣衝向渦輪葉片，推動渦輪越轉越快', 'High-pressure steam rushes onto the turbine blades and spins the turbine faster and faster.'],
      con: ['結論：熱能 → 動能（蒸氣讓渦輪轉起來）', 'Conclusion: heat → kinetic energy (the steam makes the turbine spin).'] },
    { title: ['發電機：磁鐵在線圈中旋轉（電磁感應）', 'Generator: a magnet spins inside coils (electromagnetic induction)'],
      sub: ['渦輪軸帶動磁鐵在線圈中旋轉，線圈產生方向來回改變的交流電', 'The turbine shaft spins a magnet inside the coils, which produce alternating current (AC).'],
      con: ['結論：動能 → 電能（電磁感應）', 'Conclusion: kinetic energy → electrical energy (electromagnetic induction).'] },
    { title: ['冷凝器把蒸氣變回水；電經變壓器送出', 'Steam turns back into water; power goes out to the grid'],
      sub: ['冷卻水把蒸氣冷成水，送回蒸氣產生器再用；電經變壓器升壓後送上輸電線', 'Cooling water turns the steam back into water for reuse; a transformer steps up the voltage for the power lines.'],
      con: ['結論：只有約 1/3 變成電，約 2/3 成為廢熱被冷卻水帶走', 'Conclusion: only about 1/3 becomes electricity; about 2/3 is waste heat carried off by cooling water.'] }
  ];

  W5.register('plant', {
    canvas: 'cvs-plant',
    steps: DUR,
    draw(c, s) {
      const S = state(s), n = s.n, u = s.u, k = s.k;
      drawPlant(c, s, S);
      const pk = k;
      if (n === 1) panel1(c, pk, S);
      else if (n === 2) panel2(c, pk, S, u);
      else if (n === 3) panel3(c, pk, S);
      else if (n === 4) {
        panel4(c, pk, S);
        /* 放大的來源：發電機 → 說明板 */
        c.save(); c.globalAlpha *= pk * 0.8; c.strokeStyle = ENE; c.lineWidth = 1.5; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(GN.x + GN.w, GN.y + 8); c.lineTo(PANEL.x, PANEL.y + 50); c.moveTo(GN.x + GN.w, GN.y + GN.h - 8); c.lineTo(PANEL.x, PANEL.y + PANEL.h - 8); c.stroke();
        c.restore();
      } else panel5(c, pk, S, u);

      const X = TXT[n - 1];
      P(c, k, L(X.title[0], X.title[1]), 480, 38, WHITE, 22);
      /* 說明 → 結論：先淡出再淡入，兩句不同時出現 */
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), GOOD);
    }
  });
})();
