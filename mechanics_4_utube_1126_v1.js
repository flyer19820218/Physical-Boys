/* ==================================================================
   mechanics_4 ｜ 資優補充：U 型管裡的兩種液體（cvs-utube，960×540）
   四步：1 只有水：兩邊等高 → 2 右邊倒油（右邊水面被壓下、左邊升高）→ 3 過油水交界取基準線＋量尺 → 4 比基準線上的壓力
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （M4.uTube／M4.pourLiquid／M4.sideRuler 由本檔新增）。

   數字（照簡報，不可改）：D水 ＝ 1 gw/cm³、D油 ＝ 0.8 gw/cm³；最後：以油水交界為基準線，左邊水柱 20 cm、右邊油柱 25 cm；
       基準線處壓力：左 20 × 1 ＝ 20、右 25 × 0.8 ＝ 20 gw/cm² → h₁ × D₁ ＝ h₂ × D₂。
   水量守恆（兩臂同粗）：高度 h 由直臂下端（彎管圓心 YB）往上量。一開始兩邊水面都在 H0 ＝ 15 cm。
       倒入油柱 hₒ 時（每一刻都當作已平衡）：右邊水面（＝交界）降 d、左邊水面升 d，左水面比交界高 2d；
       交界處壓力相等 2d × 1 ＝ hₒ × 0.8 → d ＝ 0.4 hₒ。hₒ ＝ 25 → d ＝ 10：交界 5 cm、左水面 25 cm（比交界高 20 ✓）、油面 30 cm（比交界高 25 ✓）。
   比例尺：1 cm ＝ 6 px；兩臂中線 x 410／550、管內半寬 22（兩臂同粗）、直臂下端 YB 365、管口 155（35 cm）。
       y(h) ＝ 365 － 6h：原水面 275、最後左水面 215、交界（基準線）335、油面 185。
   壓力箭頭（珊瑚）3 px／(gw/cm²)：20 gw/cm² → 60 px，兩支等長，尖端在基準線上（朝下：上面的液柱壓著基準線）。
   版面：步驟標題 KEY_Y 62；第 4 步公式 Q_Y 108；底部字卡 BOT_Y 505；量尺 左 x 360（數字在左）、右 x 600（數字在右）；
       左側文字靠右對齊在 x ≤ 365（基準線、水柱 ≤ 305）、右側文字靠左對齊在 x ≥ 596；第 4 步壓力 pill 在彎管兩側 y 420。
       倒油的燒杯在右臂上方（杯嘴 (557,146)），傾斜角由「杯內剩下的油面剛好到杯嘴」反解（越倒越斜）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.uTube) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, YEL = COL.yellow, EDGE = M4.PC.waterEdge, OIL = M4.PC.oil, OILT = '#ffc970';
  const DUR = [11, 12, 11, 12];        /* 總長 46 秒 */

  /* ── 場景（1 cm ＝ K px） ── */
  const K = 6, XL = 410, XR = 550, YB = 365, RIM = 155, HW = 22, WL = 6, GY = 482;
  const yOf = h => YB - K * h;
  const H0 = 15, HOIL = 25, DW = 1, DO = 0.8;
  const IFACE = H0 - 0.4 * HOIL;                 /* 5 cm */
  const Y_BASE = yOf(IFACE);                     /* 335 */
  const PK = 3;
  const RUL_L = 360, RUL_R = 600;
  const PILL_Y = 420;

  /* 第 2 步時間點：燒杯進場、開始倒、停 */
  const P0 = 1.5, P1 = 8.0, FALL = 0.16;
  function oilH(s) {
    if (s.n < 2) return 0;
    if (s.n > 2) return HOIL;
    return HOIL * ease(seg(s.u, P0 + FALL, P1));
  }
  function levels(s) {
    const ho = oilH(s), d = 0.4 * ho;
    return { ho, left: H0 + d, iface: H0 - d, top: H0 - d + ho };
  }

  /* ═══════════ 燒杯：杯嘴為支點，杯內油面水平；傾斜角由面積反解 ═══════════ */
  const BW = 40, BH = 56, BA = BW * BH, PX = 557, PY = 146;
  const BODY = [[0, 0], [BW, 0], [BW, BH], [0, BH]];
  const rot = (th, p) => { const cs = Math.cos(-th), sn = Math.sin(-th); return [p[0] * cs - p[1] * sn, p[0] * sn + p[1] * cs]; };
  function areaBelow(poly, y) {            /* 多邊形在 y 以下（py ≥ y）的面積 */
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], pin = p[1] >= y, qin = q[1] >= y;
      if (pin) out.push(p);
      if (pin !== qin) { const f = (y - p[1]) / (q[1] - p[1]); out.push([lerp(p[0], q[0], f), y]); }
    }
    let A = 0; for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; A += p[0] * q[1] - q[0] * p[1]; }
    return Math.abs(A) / 2;
  }
  function levelOf(th, A) {
    const poly = BODY.map(p => rot(th, p)), ys = poly.map(p => p[1]);
    let lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (areaBelow(poly, m) > A) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const TH0 = 0.35, TH_MAX = 2.0;
  function thPour(A) {                     /* 油面剛好到杯嘴（y ＝ －2）的傾斜角 */
    let lo = TH0, hi = TH_MAX;
    for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; if (levelOf(m, A) > -2) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const A_FULL = 0.52 * BA, A_END = 0.07 * BA;
  const TH_P0 = thPour(A_FULL);
  function beakerState(s) {
    const u = s.u;
    let A = A_FULL, th = TH0;
    if (u < P0) th = lerp(TH0, TH_P0, ease(seg(u, 0.6, P0)));
    else if (u < P1) { A = lerp(A_FULL, A_END, seg(u, P0, P1)); th = thPour(A); }
    else { A = A_END; th = lerp(thPour(A_END), TH0, ease(seg(u, P1, P1 + 0.8))); }
    return { A, th };
  }
  function beaker(c, s) {
    if (s.n !== 2) return;
    const a = fin(s, 2, 0.2, 0.5) * fout(s, 2, 9.2, 0.6); if (a <= 0.02) return;
    const st = beakerState(s), lv = levelOf(st.th, st.A);
    withA(c, a, () => {
      c.save(); c.translate(PX, PY); c.rotate(-st.th);
      c.fillStyle = 'rgba(200,230,245,0.10)'; c.fillRect(0, 0, BW, BH);
      /* 杯內的油：杯身內 ∩ 水平油面以下 */
      c.save(); c.beginPath(); c.rect(0, 0, BW, BH); c.clip();
      c.rotate(st.th);
      c.fillStyle = W5.rgba(OIL, 0.8); c.fillRect(-120, lv, 240, 200);
      c.strokeStyle = '#ffd890'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-120, lv); c.lineTo(120, lv); c.stroke();
      c.restore();
      /* 杯身（玻璃）＋杯嘴 */
      c.strokeStyle = 'rgba(225,242,250,0.9)'; c.lineWidth = 3; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-5, -4); c.quadraticCurveTo(0, -1, 0, 4); c.lineTo(0, BH); c.lineTo(BW, BH); c.lineTo(BW, 0); c.stroke();
      c.strokeStyle = 'rgba(225,242,250,0.5)'; c.lineWidth = 1.5;
      for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(BW, BH - k * 12); c.lineTo(BW - 9, BH - k * 12); c.stroke(); }
      c.restore();
    });
  }
  function stream(c, s, res) {
    if (s.n !== 2) return;
    const u = s.u - P0; if (u <= 0) return;
    const x = PX - 3, y0 = PY + 2, yHit = res.surfR(x);
    const head = lerp(y0, yHit, clamp01(u / FALL)), tail = lerp(y0, yHit, clamp01((s.u - P1) / FALL));
    if (head - tail > 2) M4.pourLiquid(c, x, tail, head, { t: s.t, w: 6, splash: u > FALL, rw: 12 });
  }

  /* ═══════════ 場景：底座＋U 型管 ═══════════ */
  function stand(c, a) {
    withA(c, a, () => {
      c.save();
      const cx = (XL + XR) / 2, bot = YB + (XR - XL) / 2 + HW + WL;
      const g = c.createLinearGradient(cx - 20, 0, cx + 20, 0); g.addColorStop(0, '#6d5a48'); g.addColorStop(1, '#4a3b2f');
      c.fillStyle = g; c.fillRect(cx - 18, bot - 4, 36, GY - bot + 4);
      c.fillStyle = '#8a735c'; W5.rr(c, cx - 34, bot - 8, 68, 8, 4); c.fill();
      c.fillStyle = '#5a4838'; W5.rr(c, cx - 70, GY - 8, 140, 10, 4); c.fill();
      c.restore();
    });
  }
  function scene(c, s, lv) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    const a = fin(s, 1, 0.1, 0.8);
    stand(c, a);
    const pouring = s.n === 2 ? clamp01((s.u - P0) / 0.5) * (1 - clamp01((s.u - P1) / 2.0)) : 0;
    return M4.uTube(c, {
      xl: XL, xr: XR, yb: YB, rim: RIM, hw: HW, wall: WL, t: s.t, a, wob: 0.8 + 1.4 * pouring,
      lvL: yOf(lv.left), lvR: yOf(lv.iface), oilTop: lv.ho > 0.05 ? yOf(lv.top) : null
    });
  }

  /* ── 第 1 步：等高虛線（第 2 步變成淡淡的「原來的水面」） ── */
  function equalLine(c, s) {
    const g = grow(s, 1, 1.5, 2.7);
    const a = s.n === 1 ? 1 : s.n === 2 ? lerp(1, 0.4, fin(s, 2, 0, 0.8)) : 0.4 * fout(s, 3, 0, 0.5);
    M4.levelDash(c, 366, 598, yOf(H0), { g, a });
    T(c, fin(s, 1, 2.6, 0.6) * fout(s, 2, 0, 0.4), L('同一種液體 → 等高', 'Same liquid → same level'), 606, yOf(H0), EDGE, 22, 'left');
  }

  /* ── 第 2 步：兩種液體的密度 ── */
  function densities(c, s, lv) {
    const off = fout(s, 3, 0, 0.5);
    T(c, fin(s, 2, 2.0, 0.6) * off, L('D水 ＝ 1 gw/cm³', 'Water: D = 1 gw/cm³'), 366, 300, EDGE, 22, 'right');
    T(c, fin(s, 2, 3.2, 0.6) * off, L('油比水輕：D油 ＝ 0.8 gw/cm³', 'Oil is lighter: D = 0.8 gw/cm³'), 596, 246, OILT, 22, 'left');
  }

  /* ── 第 3 步：基準線（過油水交界的水平線）＋線以下同一種水 ── */
  function baseline(c, s, res) {
    if (s.n < 3) return;
    /* 線以下的水亮一下（同一種水、連在一起） */
    const ga = 0.22 * fin(s, 3, 2.4, 0.5) * (1 - 0.7 * fin(s, 3, 4.6, 0.8)) * (s.n === 3 ? 1 : 0.3);
    if (ga > 0.01) withA(c, ga, () => {
      c.save(); res.path(c); c.clip();
      c.fillStyle = '#bfe6ff'; c.fillRect(XL - HW - 2, Y_BASE, XR - XL + 2 * HW + 4, 200); c.restore();
    });
    const g = grow(s, 3, 0.5, 2.3), x0 = 312, x1 = 648;
    withA(c, 1, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([12, 8]);
      c.shadowColor = W5.rgba(YEL, 0.6); c.shadowBlur = 6;
      c.beginPath(); c.moveTo(x0, Y_BASE); c.lineTo(lerp(x0, x1, g), Y_BASE); c.stroke(); c.restore();
    });
    T(c, fin(s, 3, 1.8, 0.6), L('基準線', 'Baseline'), 304, Y_BASE, YEL, 22, 'right');
  }

  /* ── 第 3、4 步：量尺（從基準線往上）＋水柱、油柱 ── */
  function rulers(c, s, lv) {
    if (s.n < 3) return;
    const g = grow(s, 3, 4.6, 6.2), a = 1;
    M4.sideRuler(c, RUL_L, Y_BASE, K, 20, { side: 'left', nums: [10, 20], g, a });
    M4.sideRuler(c, RUL_R, Y_BASE, K, 25, { side: 'right', nums: [10, 20, 25], g, a });
    /* 液面連到量尺頂端的短虛線 */
    const ca = fin(s, 3, 6.0, 0.5);
    if (ca > 0.02) withA(c, ca, () => {
      c.save(); c.lineWidth = 2; c.setLineDash([5, 5]);
      c.strokeStyle = EDGE; c.beginPath(); c.moveTo(RUL_L + 8, yOf(lv.left)); c.lineTo(XL - HW - WL, yOf(lv.left)); c.stroke();
      c.strokeStyle = OILT; c.beginPath(); c.moveTo(XR + HW + WL, yOf(lv.top)); c.lineTo(RUL_R - 8, yOf(lv.top)); c.stroke();
      c.restore();
    });
    const la = fin(s, 3, 6.4, 0.6);
    T(c, la, L('水柱 20 cm', 'Water: 20 cm'), 304, yOf(IFACE + 10), EDGE, 22, 'right');
    T(c, la, L('油柱 25 cm', 'Oil: 25 cm'), 656, yOf(IFACE + 12.5), OILT, 22, 'left');
  }

  /* ── 第 4 步：基準線上的兩支壓力箭頭（等長）＋算式 pill ── */
  function pressures(c, s) {
    if (s.n !== 4) return;
    const len = PK * 20 * grow(s, 4, 0.5, 1.6);
    M4.pArrow(c, XL, Y_BASE, len, { dir: 'down', lw: 7 });
    M4.pArrow(c, XR, Y_BASE, len, { dir: 'down', lw: 7 });
    /* 兩支箭尾一樣高（淡點線） */
    const ea = 0.6 * fin(s, 4, 1.8, 0.5), ty = Y_BASE - PK * 20;
    if (ea > 0.02) withA(c, ea, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 2; c.setLineDash([3, 7]);
      c.beginPath(); c.moveTo(XL - 16, ty); c.lineTo(XR + 16, ty); c.stroke(); c.restore();
    });
    /* pill ＋ 引線到箭頭尖端 */
    const la = fin(s, 4, 1.8, 0.6), ra = fin(s, 4, 3.2, 0.6);
    const lead = (a, xa, ya, xb) => {
      if (a <= 0.02) return;
      withA(c, a, () => {
        c.save(); c.strokeStyle = W5.rgba(COL.coral, 0.85); c.lineWidth = 2; c.setLineDash([4, 5]);
        c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, Y_BASE + 4); c.stroke(); c.setLineDash([]);
        c.fillStyle = COL.coral; c.beginPath(); c.arc(xb, Y_BASE, 4.5, 0, Math.PI * 2); c.fill(); c.restore();
      });
    };
    lead(la, 352, PILL_Y - 20, XL);
    lead(ra, 608, PILL_Y - 20, XR);
    M4.pPill(c, la, L('左：20 × 1 ＝ 20 gw/cm²', 'Left: 20 × 1 = 20 gw/cm²'), 376, PILL_Y, 22, 'right');
    M4.pPill(c, ra, L('右：25 × 0.8 ＝ 20 gw/cm²', 'Right: 25 × 0.8 = 20 gw/cm²'), 584, PILL_Y, 22, 'left');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('只有水：兩邊等高', 'Water only: both sides level'),
    () => L('右邊倒油', 'Pour oil in on the right'),
    () => L('過油水交界取一條水平線', 'A level line through the boundary'),
    () => L('比一比基準線上的壓力', 'Compare the pressures on the line')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 6.0, 0.6) * fout(s, 2, 0, 0.4), L('如果在右邊倒入油呢？', 'What if we pour oil in on the right?'), WHITE, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 4.6, 0.6) * fout(s, 3, 0, 0.4), L('油把右邊的水往下壓，左邊水面升高', 'The oil pushes the water down; the left side rises'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 3.0, 0.6) * fout(s, 4, 0, 0.4), L('基準線以下：連在一起的同一種水', 'Below the line: one connected body of water'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 5.4, 0.6), L('h₁ × D₁ ＝ h₂ × D₂', 'h₁ × D₁ = h₂ × D₂'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 4, 7.4, 0.6), L('密度小的液體，液柱較高', 'The less dense liquid stands taller'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const lv = levels(s);
    const res = scene(c, s, lv);
    stream(c, s, res);
    beaker(c, s);
    equalLine(c, s);
    densities(c, s, lv);
    baseline(c, s, res);
    rulers(c, s, lv);
    pressures(c, s);
    texts(c, s);
  }

  W5.register('utube', { canvas: 'cvs-utube', steps: DUR, draw });
})();
