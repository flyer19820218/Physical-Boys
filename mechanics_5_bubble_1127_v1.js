/* ==================================================================
   mechanics_5 ｜ 深海氣泡：越浮越大（cvs-bubble，960×540）
   四步：1 深海釋放 → 2 往上，水壓變小 → 3 氣泡膨脹 → 4 浮力變大
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／caption／arrowFx、M4.L／T／P／withA／fin／fout／grow、M5.ATM／pressRing／pArrowAt。

   數字（照簡報，與 mechanics_4 的空氣球一致）：水下 10 m ＝ 1000 gw/cm²（D＝1）；總壓力 P ＝ 1033.6 ＋ 100 × 深度(m)。
     30／20／10／0 m：P ＝ 4033.6／3033.6／2033.6／1033.6 gw/cm²（畫面寫約 4034／3034／2034／1034）。
     溫度不變，V ∝ 1/P：相對體積（30 m ＝ 1）＝ 1／1.33／1.98／3.90；半徑 ∝ V^(1/3) ＝ 1／1.10／1.26／1.57。
   物理：氣泡上升時一直依目前深度的 P 算體積與半徑（連續膨脹，不是跳格）；浮力 B ＝ V排 × D液 ∝ V → 越往上浮力越大、越浮越快；
     氣泡內的分子數不變（質量不變），體積變大 → 分子點變疏 → 氣體密度變小。
   比例尺：深度 1 m ＝ 11 px（水面 y 104、30 m 在 y 434）。氣泡半徑 30 m 時 14 px，其他深度 ＝ 14 × V^(1/3)（照比例）。
     壓力箭頭：長度 ＝ 34 px × P ÷ 4033.6（∝ 總壓力，示意，畫面標「示意」）。
     浮力箭頭（第 4 步）：長度 ＝ 22 px × V（∝ 體積，示意，標「示意」）。
     第 3 步右側並排的 4 顆氣泡、第 4 步右側放大圖：氣泡畫成 2.2 倍／3 倍大（彼此之間照比例）。
   第 1 步（11 s）：海底岩縫 u 0.8～1.6 冒出氣泡（半徑 0 → 14 px，停在 30 m）；四周壓力箭頭 u 1.8～2.6 長出（「示意」u 2.6）；
     「30 m：總壓力 約 4034 gw/cm²」u 3.2；「＝ 1033.6（大氣）＋ 3000（水）」u 4.4；字卡 u 7.0。
   第 2 步（11 s）：u 0.5 起往上，深度 ＝ 30 － 26 q^1.5（q ＝ (u－0.5)/10.5，越來越快），u 11 到 4 m；
     經過 20 m（u 6.05）、10 m（u 9.3）時在該深度留下標籤「20 m：3034 gw/cm²」「10 m：2034 gw/cm²」；壓力箭頭隨深度變短；字卡 u 3.0。
   第 3 步（11 s）：接著上升（初速同第 2 步末），u 1.0 衝出水面破掉（漣漪）；深度標籤淡出；右側並排 30／20／10／0 m 的氣泡
     u 1.6／2.2／2.8／3.4 依序出現（框 u 1.2），體積 V：1、1.33、1.98、3.9；「體積 V 變大」u 4.4；字卡 u 6.5。
   第 4 步（12 s）：同一顆氣泡重播一次：u 0.6～8.0 由 30 m 升到水面（深度 ＝ 30 ×（1 － q^1.8），越來越快，下方速度線越來越長）；
     旁邊的浮力 B 箭頭長度 ∝ V 一路變長；每經過 30／20／10／0 m 留下淡淡的氣泡＋該處的 B 箭頭與「B ×1／×1.33／×1.98／×3.9」
     （u 0.6／4.6／6.5／8.0，逐段加長，最後畫面停在這 4 支箭頭）；「B ＝ V排 × D液」u 1.0、「B 箭頭長度 ∝ V（示意）」u 1.6；
     右側放大圖（30 m 與 0 m，同樣 12 個分子點）u 2.6～3.6；「質量不變、體積變大 → 氣體密度變小」u 5.0；u 8.0 破出水面；字卡 u 8.8。
   版面：水 x 94～960、水面 y 104、海底 y 470；深度尺 x 80（0／10／20／30 m 字在 x 70 右對齊）；氣泡中線 x 280；
     深度標籤 pill 在 x 350 左對齊、y ＝ 該深度；第 3 步並排框 x 480～940（氣泡中線 x 565／668／775／882，y 272）；
     第 4 步放大圖框 x 500～930、y 214～398，氣泡中心 (610, 300)／(820, 296)。步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.pressRing) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, FB = COL.teal, PR = M4.PC.pressure, WE = M4.PC.waterEdge;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const SURF = 104, PXM = 11, SEABED = 470, BX = 280, RX = 80, WX0 = 94;
  const Y = d => SURF + PXM * d;
  const R0 = 14;

  /* ── 物理 ── */
  const Pt = d => M5.ATM + 100 * d;                     /* 總壓力 gw/cm² */
  const Vr = d => Pt(30) / Pt(d);                       /* 相對體積（30 m ＝ 1） */
  const Rr = d => R0 * Math.cbrt(Vr(d));                /* 半徑 px */
  const ringLen = d => 34 * Pt(d) / Pt(30);

  /* 深度（m）；pop＝破出水面後幾秒（沒破＝-1） */
  const Q2 = u => clamp01((u - 0.5) / 10.5);
  const V2END = 26 * 1.5 / 10.5;                       /* 第 2 步末速度 m/s */
  function depth(s) {
    const u = s.u;
    if (s.n === 1) return { d: 30, pop: -1 };
    if (s.n === 2) return { d: 30 - 26 * Math.pow(Q2(u), 1.5), pop: -1 };
    if (s.n === 3) {
      const d = 4 - V2END * u - 0.5 * u * u;
      const tHit = (-V2END + Math.sqrt(V2END * V2END + 8)) / 1;   /* 4 － v u － 0.5u² ＝ 0 */
      return d > 0 ? { d, pop: -1 } : { d: 0, pop: u - tHit };
    }
    const q = clamp01((u - 0.6) / 7.4), d = 30 * (1 - Math.pow(q, 1.8));
    return u < 8.0 ? { d, pop: -1, q } : { d: 0, pop: u - 8.0, q: 1 };
  }
  const T2 = dd => 0.5 + 10.5 * Math.pow((30 - dd) / 26, 1 / 1.5);   /* 第 2 步經過某深度的 u */

  /* ═══════════ 場景 ═══════════ */
  function water(c, t) {
    c.save();
    const g = c.createLinearGradient(0, SURF, 0, SEABED);
    g.addColorStop(0, 'rgba(70,160,215,0.55)'); g.addColorStop(1, 'rgba(10,40,80,0.9)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(WX0, SEABED);
    for (let x = WX0; x <= 960; x += 6) c.lineTo(x, SURF + 1.4 * Math.sin(x * 0.05 + t * 2.3));
    c.lineTo(960, SEABED); c.closePath(); c.fill();
    /* 漂浮的小顆粒（確定性） */
    c.fillStyle = 'rgba(200,230,245,0.35)';
    for (let i = 0; i < 26; i++) {
      const x = WX0 + 10 + 846 * hash(i * 3.1 + 1), y0 = SURF + 20 + (SEABED - SURF - 40) * hash(i * 5.7 + 2);
      const y = y0 + 6 * Math.sin(t * 0.6 + i), xx = x + 8 * Math.sin(t * 0.4 + i * 1.3);
      c.beginPath(); c.arc(xx, y, 1.8, 0, TAU); c.fill();
    }
    /* 水面亮線 */
    c.strokeStyle = WE; c.lineWidth = 3; c.beginPath();
    for (let x = WX0; x <= 960; x += 6) (x === WX0 ? c.moveTo(x, SURF + 1.4 * Math.sin(x * 0.05 + t * 2.3)) : c.lineTo(x, SURF + 1.4 * Math.sin(x * 0.05 + t * 2.3)));
    c.stroke();
    /* 海底＋岩縫 */
    const sg = c.createLinearGradient(0, SEABED, 0, 540); sg.addColorStop(0, '#4a5a48'); sg.addColorStop(1, '#1f2b22');
    c.fillStyle = sg; c.beginPath(); c.moveTo(WX0, 540); c.lineTo(WX0, SEABED);
    for (let x = WX0; x <= 960; x += 20) c.lineTo(x, SEABED + 4 * Math.sin(x * 0.03) + 3 * hash(x));
    c.lineTo(960, 540); c.closePath(); c.fill();
    c.fillStyle = '#5b6a5c';
    c.beginPath(); c.moveTo(BX - 60, SEABED + 4); c.quadraticCurveTo(BX - 30, 452, BX - 8, 454); c.lineTo(BX + 8, 454); c.quadraticCurveTo(BX + 34, 450, BX + 64, SEABED + 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(BX - 6, 455); c.lineTo(BX, 462); c.lineTo(BX + 6, 455); c.stroke();
    c.restore();
  }
  function ruler(c) {
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(RX, SURF); c.lineTo(RX, Y(30)); c.stroke();
    for (let d = 0; d <= 30; d += 2) { const big = d % 10 === 0; c.beginPath(); c.moveTo(RX, Y(d)); c.lineTo(RX + (big ? 14 : 7), Y(d)); c.stroke(); }
    c.restore();
    for (let d = 0; d <= 30; d += 10) T(c, 1, d + ' m', RX - 10, Y(d), WHITE, 22, 'right', true);
  }
  /* 氣泡：r 半徑；dots 內部分子點數（0＝不畫） */
  function bubble(c, x, y, r, a, t, dots, dotR) {
    if (a <= 0.02 || r < 0.5) return;
    withA(c, a, () => {
      c.save();
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(190,230,255,0.22)'); g.addColorStop(1, 'rgba(160,215,250,0.45)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(225,245,255,0.95)'; c.lineWidth = Math.max(1.6, r * 0.08); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(1.4, r * 0.07); c.lineCap = 'round';
      c.beginPath(); c.arc(x, y, r * 0.68, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
      if (dots) {
        c.fillStyle = W5.rgba(M5.PC.air, 0.95);
        for (let i = 0; i < dots; i++) {
          const rr = 0.78 * Math.sqrt((i + 0.5) / dots), an = i * 2.39996 + 0.4, ph = TAU * hash(i * 3.3);
          c.beginPath(); c.arc(x + Math.cos(an) * r * rr + 1.4 * Math.sin(t * 2.4 + ph), y + Math.sin(an) * r * rr + 1.4 * Math.cos(t * 2 + ph), dotR || 2.4, 0, TAU); c.fill();
        }
      }
      c.restore();
    });
  }
  /* 破出水面的漣漪 */
  function ripple(c, x, tp) {
    if (tp < 0 || tp > 1.6) return;
    c.save(); c.strokeStyle = WE; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const q = clamp01((tp - i * 0.2) / 1.2); if (q <= 0 || q >= 1) continue;
      c.globalAlpha = 1 - q; c.beginPath(); c.ellipse(x, SURF, 10 + 50 * q, 3 + 6 * q, 0, 0, TAU); c.stroke();
    }
    c.globalAlpha = Math.max(0, 1 - tp / 0.5);
    c.fillStyle = 'rgba(225,245,255,0.9)';
    for (let i = 0; i < 6; i++) { const an = -Math.PI * (0.15 + 0.7 * i / 5), rr = 10 + 26 * clamp01(tp / 0.5); c.beginPath(); c.arc(x + Math.cos(an) * rr, SURF + Math.sin(an) * rr, 2.5, 0, TAU); c.fill(); }
    c.restore();
  }

  /* ═══════════ 主氣泡（各步） ═══════════ */
  function mainBubble(c, s) {
    const t = s.t, st = depth(s), d = st.d, y = Y(d), r = Rr(d);
    let a = 1, grow1 = 1;
    if (s.n === 1) { grow1 = ease(clamp01((s.u - 0.8) / 0.8)); a = fin(s, 1, 0.8, 0.2); }
    if (s.n === 4) a = fin(s, 4, 0.1, 0.5);
    const wob = 1 + 0.04 * Math.sin(t * 7.3);
    const popped = st.pop >= 0;
    /* 第 1 步：岩縫冒出的小泡 */
    if (s.n === 1 && s.u < 1.8) {
      for (let i = 0; i < 3; i++) { const q = ((s.u * 1.3 + i / 3) % 1); bubble(c, BX + 6 * Math.sin(i * 2 + q * 6), 458 - 34 * q, 2.5, (1 - q) * fin(s, 1, 0.3, 0.3), t, 0); }
    }
    /* 速度線（第 4 步）：長度 ∝ 上升速度 */
    if (s.n === 4 && !popped && st.q > 0.01) {
      const v = 30 * 1.8 * Math.pow(st.q, 0.8) / 7.4;      /* m/s */
      withA(c, clamp01(v / 2), () => {
        c.save(); c.strokeStyle = 'rgba(220,240,250,0.8)'; c.lineWidth = 3; c.lineCap = 'round';
        [-0.5, 0, 0.5].forEach((f, i) => { const xx = BX + f * r, len = 10 + 9 * v * (0.8 + 0.3 * hash(i + 2)); c.beginPath(); c.moveTo(xx, y + r + 6); c.lineTo(xx, y + r + 6 + len); c.stroke(); });
        c.restore();
      });
    }
    if (!popped) {
      /* 壓力箭頭（第 1～3 步） */
      const ra = s.n === 1 ? fin(s, 1, 1.8, 0.4) : s.n <= 3 ? 1 : 0;
      if (ra > 0.02) M5.pressRing(c, BX, y, r * grow1, { n: 12, len: ringLen(d), gap: 4, lw: 5, t, a: ra * a, grow: s.n === 1 ? grow(s, 1, 1.8, 2.6) : 1, ang0: Math.PI / 12 });
      bubble(c, BX, y, r * grow1 * wob, a, t, s.n === 4 ? 10 : 0, 2.2);
      const sa = (s.n === 1 ? fin(s, 1, 2.6, 0.4) : s.n <= 3 ? 1 : 0) * a;
      T(c, sa, L('示意', 'not to scale'), BX - r - ringLen(d) - 12, y, DIM, 22, 'right');
    } else ripple(c, BX, st.pop);
    /* 第 4 步：浮力箭頭（∝ V，示意） */
    if (s.n === 4 && !popped) {
      const ba = fin(s, 4, 0.6, 0.4), len = 22 * Vr(d), x = BX + r + 26;
      M3.arrowFx(c, x, y + len / 2, x, y - len / 2, FB, ba, 6, 0);
    }
    return { d, y, r };
  }

  /* ═══════════ 深度標籤（第 1、2 步） ═══════════ */
  function tags(c, s) {
    const fa = s.n === 3 ? fout(s, 3, 0.6, 0.5) : s.n > 3 ? 0 : 1; if (fa <= 0.02) return;
    const a30 = fa * fin(s, 1, 3.2, 0.5);
    P(c, a30, L('30 m：總壓力 約 4034 gw/cm²', '30 m: total pressure ≈ 4034 gw/cm²'), 350, Y(30), PR, 22, 'left');
    T(c, fa * fin(s, 1, 4.4, 0.5), L('＝ 1033.6（大氣）＋ 3000（水）', '= 1033.6 (air) + 3000 (water)'), 364, Y(30) - 44, DIM, 22, 'left');
    P(c, fa * fin(s, 2, T2(20), 0.4), L('20 m：3034 gw/cm²', '20 m: 3034 gw/cm²'), 350, Y(20), PR, 22, 'left');
    P(c, fa * fin(s, 2, T2(10), 0.4), L('10 m：2034 gw/cm²', '10 m: 2034 gw/cm²'), 350, Y(10), PR, 22, 'left');
  }

  /* ═══════════ 第 3 步：並排比較 ═══════════ */
  const ROW = [[30, 565, 1.6], [20, 668, 2.2], [10, 775, 2.8], [0, 882, 3.4]];
  function compare(c, s) {
    const a = s.n === 3 ? fin(s, 3, 1.2, 0.5) : s.n === 4 ? fout(s, 4, 0, 0.5) : 0; if (a <= 0.02) return;
    const t = s.t;
    withA(c, a, () => { c.save(); c.fillStyle = 'rgba(11,26,21,0.82)'; W5.rr(c, 480, 120, 460, 316, 16); c.fill(); c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 2; c.stroke(); c.restore(); });
    T(c, a, L('相對體積 V（30 m ＝ 1）', 'Relative volume V (30 m = 1)'), 710, 150, WHITE, 22, 'center');
    const vs = ['1', '1.33', '1.98', '3.9'];
    ROW.forEach(([d, x, t0], i) => {
      const k = a * (s.n === 3 ? fin(s, 3, t0, 0.4) : 1);
      const g = s.n === 3 ? ease(clamp01((s.u - t0) / 0.6)) : 1;
      T(c, k, d + ' m', x, 196, DIM, 22, 'center', true);
      bubble(c, x, 272, 2.2 * Rr(d) * (0.6 + 0.4 * g) * (1 + 0.03 * Math.sin(t * 5 + i)), k, t, 0);
      P(c, k, vs[i], x, 352, YEL, 22, 'center', true);
    });
    const ga = a * fin(s, 3, 4.4, 0.5), gg = s.n === 3 ? grow(s, 3, 4.4, 5.2) : 1;
    if (ga > 0.02) M3.arrowFx(c, 540, 396, lerp(540, 910, gg), 396, YEL, ga, 5, 0);
    P(c, ga * clamp01((gg - 0.7) / 0.3), L('體積 V 變大', 'Volume V grows'), 725, 396, YEL, 22, 'center');
  }

  /* ═══════════ 第 4 步：浮力與密度 ═══════════ */
  const STAMPS = [[30, '1'], [20, '1.33'], [10, '1.98'], [0, '3.9']];
  const T4 = dd => 0.6 + 7.4 * Math.pow(1 - dd / 30, 1 / 1.8);   /* 第 4 步經過某深度的 u */
  function step4(c, s) {
    if (s.n !== 4) return;
    const t = s.t;
    /* 每經過 10 m 留下一個淡淡的氣泡＋該處的浮力箭頭（∝ V）→ 箭頭逐段加長 */
    STAMPS.forEach(([dd, v], i) => {
      const a = fin(s, 4, T4(dd), 0.3); if (a <= 0.02) return;
      const y = Y(dd), r = Rr(dd), len = 22 * Vr(dd), x = BX + r + 26;
      bubble(c, BX, y, r, a * 0.45, t + i, 0);
      M3.arrowFx(c, x, y + len / 2, x, y - len / 2, FB, a * 0.75, 6, 0);
      T(c, a, 'B ×' + v, x + 22, dd === 0 ? y + 18 : y, FB, 22, 'left', true);
    });
    P(c, fin(s, 4, 1.0, 0.5), L('B ＝ V排 × D液', 'B = V(displaced) × D(liquid)'), 715, 146, FB, 24, 'center');
    T(c, fin(s, 4, 1.6, 0.5), L('B 箭頭長度 ∝ V（示意）', 'B arrow length ∝ V (sketch)'), 715, 190, DIM, 22, 'center');
    const za = fin(s, 4, 2.6, 0.5);
    if (za > 0.02) {
      withA(c, za, () => { c.save(); c.fillStyle = 'rgba(11,26,21,0.78)'; W5.rr(c, 500, 214, 430, 184, 16); c.fill(); c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 2; c.stroke(); c.restore(); });
      T(c, za, L('放大圖', 'Close-up'), 514, 236, DIM, 22, 'left');
      bubble(c, 610, 300, 3 * Rr(30), za, t, 12, 3.2);
      T(c, za, '30 m', 610, 380, DIM, 22, 'center', true);
      const zb = fin(s, 4, 3.4, 0.5);
      M3.arrowFx(c, 672, 300, 724, 300, WHITE, zb, 4, 0);
      bubble(c, 820, 296, 3 * Rr(0), zb, t, 12, 3.2);
      T(c, zb, '0 m', 820, 380, DIM, 22, 'center', true);
    }
    P(c, fin(s, 4, 5.0, 0.5), L('質量不變、體積變大 → 氣體密度變小', 'Same mass, more volume → less dense gas'), 715, 436, YEL, 22, 'center');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('深海釋放', 'Released deep down'),
    () => L('往上，水壓變小', 'Up: less pressure'),
    () => L('氣泡膨脹', 'The bubble expands'),
    () => L('浮力變大', 'Buoyancy grows')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.0, 0.6) * fout(s, 2, 0, 0.4), L('深海的總壓力大，氣泡被壓得很小', 'Deep down the pressure is high: the bubble is squeezed small'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 3.0, 0.6) * fout(s, 3, 0, 0.4), L('越往上，深度越淺，水壓越小', 'Higher up: less depth, less water pressure'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 6.5, 0.6) * fout(s, 4, 0, 0.4), L('壓力變小，氣泡的體積 V 變大', 'Less pressure: the bubble\'s volume V grows'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.8, 0.6), L('體積變大 → 浮力變大 → 越浮越快', 'Bigger volume → more buoyancy → rises faster'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: SURF, cell: 40 });
    water(c, s.t);
    ruler(c);
    tags(c, s);
    compare(c, s);
    step4(c, s);
    mainBubble(c, s);
    texts(c, s);
  }

  W5.register('bubble', { canvas: 'cvs-bubble', steps: DUR, draw });
})();
