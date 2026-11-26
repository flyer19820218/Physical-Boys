/* ==================================================================
   mechanics_4 ｜ 資優補充：表壓與總壓力：空氣球越潛越小（cvs-total，960×540）
   四步：1 水的表壓 → 2 加上大氣壓 → 3 10 m：剩一半 → 4 40 m：剩約 1/5
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （沿用 M4.tank／M4.depthRuler／M4.atmArrow；M4.airBall、M4.squeeze 由本檔新增）。

   數字（照簡報，不可改）：每 1 m 清水 → 100 gw/cm²（表壓 P ＝ h × 100）；大氣壓 1033 gw/cm²；總壓力 ＝ 1033 ＋ P。
     空氣球（柔軟、溫度不變）：總壓力 × 體積 ＝ 定值 → V／V₀ ＝ 1033 ÷ 總壓力；半徑 R ＝ R₀ × (V／V₀)^(1/3)（程式裡確實計算）。
       0 m：1033 → 100%（R₀）；10 m：2033 → 50.8%（0.80 R₀）；40 m：5033 → 20.5%（0.59 R₀）。
   比例尺：深度 1 m ＝ K 7.8 px（示意：長度壓縮，但 0～40 m 刻度均勻）；水面 y 118、10 m y 196、40 m y 430。
     球心的 y 就是它的深度（0 m 時球心在水面上，半顆露出水面）；R₀ ＝ 40 px → 10 m 31.9 px、40 m 23.6 px。
   壓力箭頭長度 ∝ 壓力：PK ＝ 0.025 px／(gw/cm²) → 表壓 1000 ＝ 25 px（珊瑚）、大氣壓 1033 ＝ 25.8 px（灰白）。
     第 1 步球四周 6 支珊瑚箭頭（表壓，尖端貼球面朝內）；第 2 步每支外側再接一段灰白（大氣壓經由水傳到球上）→ 總長 ∝ 2033。
     水面上方兩支灰白箭頭（大氣壓，尖端在水面）與球四周的灰白段一樣長。第 3 步起球會移動，箭頭淡出（數字改看右側計算板）。
   版面：水桶內壁 x 100～370、桶口 70、內底 474、地面 480；深度尺在桶左外側 x 76（數字右緣 x 62）；
     右側計算板 x 418～944、y 92～458：上半算式（y 120 公式 pill、之下逐行），第 3 步起下半是小表（表頭 y 300、三列 340／384／428）；
     步驟標題 KEY_Y 62；字卡 BOT_Y 505（地面下方）。標籤 22px、算式／標題／字卡 24px。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.airBall || !M4.squeeze) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PR = M4.PC.pressure, ATM = M4.PC.atm;
  const AIRC = '#cfe9ff';                                  /* 空氣球／體積的顏色 */
  const DUR = [11, 11, 12, 12];                            /* 總長 46 秒 */

  /* ── 場景 ── */
  const TX0 = 100, TX1 = 370, WALL = 6, TB = 474, RIM = 70, GY = 480;
  const SURF = 118, K = 7.8;                               /* 水面 y、px／m */
  const yOf = d => SURF + d * K;
  const BX = 235;                                          /* 球心 x */
  const R0 = 40;
  const RUL_X = 76, LAB_X = 62;
  const ATM_P = 1033, PK = 0.025;
  const ATM_X = [130, 340];
  const PX0 = 418, PX1 = 944, PY0 = 92, PY1 = 458, PCX = (PX0 + PX1) / 2;

  /* ── 物理（純函式） ── */
  const gauge = d => 100 * d;
  const total = d => ATM_P + gauge(d);
  const vol = d => ATM_P / total(d);
  const rad = d => R0 * Math.cbrt(vol(d));
  const pct = d => (100 * vol(d)).toFixed(1).replace(/\.0$/, '') + '%';

  /* 球的深度（m） */
  function depth(s) {
    if (s.n <= 2) return 10;
    if (s.n === 3) {
      if (s.u < 3.4) return lerp(10, 0, ease(clamp01((s.u - 0.6) / 2.0)));
      return lerp(0, 10, ease(clamp01((s.u - 3.4) / 3.6)));
    }
    return lerp(10, 40, ease(clamp01((s.u - 0.6) / 4.4)));
  }

  /* ═══════════ 場景 ═══════════ */
  function scene(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    M4.tank(c, { x0: TX0, x1: TX1, bot: TB, top: RIM, level: SURF, wall: WALL, t: s.t, wob: 0.8,
      glow: s.n === 2 ? 0.35 + 0.5 * fin(s, 2, 0.8, 0.5) * fout(s, 2, 2.6, 0.8) : 0.35 });
    /* 深度尺 0～40 m（每 5 m 一格、10 m 長刻度） */
    M4.depthRuler(c, RUL_X, SURF, yOf(40), K, {});
    [0, 10, 20, 30, 40].forEach(d => {
      const hi = d === 10 && s.n === 1 ? fin(s, 1, 2.4, 0.5) : 0;
      T(c, 1, d + ' m', LAB_X, yOf(d), hi > 0.5 ? YEL : WHITE, 22, 'right');
    });
  }

  /* ── 深度 h：第 1 步從水面往下長到 10 m（黃虛線）；之後球心水平點線跟著球 ── */
  function measure(c, s, d) {
    const g = grow(s, 1, 1.0, 2.4), ha = s.n <= 2 ? 1 : fout(s, 3, 0, 0.5);
    const yEnd = lerp(SURF, yOf(10), g);
    if (g > 0.01 && ha > 0.02 && yEnd - SURF > 8) withA(c, ha, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 4; c.setLineDash([7, 6]);
      c.beginPath(); c.moveTo(RUL_X, SURF); c.lineTo(RUL_X, yEnd - 8); c.stroke(); c.setLineDash([]); c.restore();
      W5.arrow(c, RUL_X, yEnd - 12, RUL_X, yEnd, YEL, 3, 11);
    });
    /* 球心的水平點線（尺 → 球） */
    const la = fin(s, 1, 2.2, 0.6), y = yOf(d), r = rad(d);
    if (la > 0.02 && BX - r - 6 > RUL_X + 10) withA(c, 0.6 * la, () => {
      c.save(); c.strokeStyle = s.n === 1 ? YEL : WHITE; c.lineWidth = 2; c.setLineDash([3, 6]);
      c.beginPath(); c.moveTo(RUL_X + 9, y); c.lineTo(BX - r - 6, y); c.stroke(); c.restore();
    });
  }

  /* ── 大氣壓：水面上方兩支灰白箭頭（第 2 步起） ── */
  function atmosphere(c, s) {
    const g = grow(s, 2, 0.8, 2.0);
    const len = PK * ATM_P * g;
    ATM_X.forEach(x => M4.atmArrow(c, x, SURF - 2, len, { dir: 'down', lw: 5 }));
    const la = fin(s, 2, 1.6, 0.5) * (s.n === 3 ? fout(s, 3, 0.2, 0.5) : s.n === 4 ? 0 : 1);
    T(c, la, L('大氣壓 1033', 'Air 1033'), BX, 96, ATM, 22);
  }

  /* ── 空氣球＋四周向內壓的箭頭 ── */
  function ball(c, s, d) {
    const y = yOf(d), r = rad(d);
    /* 原本大小的虛線圓：第 3 步球回到水面後出現，之後一直跟著球 */
    const ga = s.n === 3 ? fin(s, 3, 2.8, 0.5) : s.n === 4 ? 1 : 0;
    M4.airBall(c, BX, y, r, { t: s.t, ghost: ga > 0.02 ? R0 : null, ghostA: ga });
    const la = (s.n === 3 ? fin(s, 3, 4.2, 0.5) : s.n === 4 ? 1 : 0);
    T(c, la, L('原本大小', 'Original size'), BX, y - R0 - 16, WHITE, 22);
    /* 壓力箭頭（第 1、2 步；第 3 步開頭淡出） */
    const aa = s.n <= 2 ? 1 : fout(s, 3, 0, 0.5);
    const gp = grow(s, 1, 2.6, 4.0), ga2 = grow(s, 2, 3.2, 4.6);
    const parts = [{ len: PK * ATM_P * ga2, col: ATM }, { len: PK * 1000 * gp, col: PR }];
    if (gp > 0.01) M4.squeeze(c, BX, y, r, parts, { n: 6, ang0: 0, gap: 2, lw: 5, a: aa });
  }

  /* ═══════════ 右側計算板 ═══════════ */
  function board(c, s) {
    const a = fin(s, 1, 0.4, 0.6);
    withA(c, a, () => {
      c.save(); W5.rr(c, PX0, PY0, PX1 - PX0, PY1 - PY0, 14);
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill(); c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; c.stroke(); c.restore();
    });
    const n = s.n;
    /* 第 1、2 步：表壓 → 加上大氣壓 */
    const o12 = n <= 2 ? 1 : fout(s, 3, 0, 0.5);
    const fa = fin(s, 1, 3.0, 0.6) * o12;
    if (fa > 0.02) W5.glow(c, PCX, 120, 120, YEL, 0.10 * fa);
    P(c, fa, L('表壓 P ＝ h × 100', 'Gauge P = h × 100'), PCX, 120, YEL, 24);
    T(c, fin(s, 1, 3.4, 0.6) * o12, L('h 用 m，P 用 gw/cm²', 'h in m, P in gw/cm²'), PCX, 160, DIM, 22);
    M4.pPill(c, fin(s, 1, 4.6, 0.6) * o12, L('表壓 ＝ 10 × 100 ＝ 1000 gw/cm²', 'Gauge = 10 × 100 = 1000 gw/cm²'), PCX, 208, 24);
    P(c, fin(s, 2, 2.2, 0.6) * o12, L('大氣壓 ＝ 1033 gw/cm²', 'Air pressure = 1033 gw/cm²'), PCX, 262, ATM, 24);
    const ta = fin(s, 2, 4.8, 0.6) * o12;
    if (ta > 0.02) W5.glow(c, PCX, 330, 200, YEL, 0.12 * ta);
    P(c, ta, L('總壓力 ＝ 1033 ＋ 1000 ＝ 2033 gw/cm²', 'Total = 1033 + 1000 = 2033 gw/cm²'), PCX, 330, YEL, 24);
    T(c, ta, L('（10 m 深）', '(at 10 m)'), PCX, 372, DIM, 22);

    /* 第 3、4 步：體積比 */
    const fb = fin(s, 3, 0.8, 0.6);
    if (fb > 0.02) W5.glow(c, PCX, 120, 120, YEL, 0.10 * fb);
    P(c, fb, L('體積比 ＝ 1033 ÷ 總壓力', 'Volume ratio = 1033 ÷ total'), PCX, 120, YEL, 24);
    const a3 = n === 4 ? fout(s, 4, 0, 0.5) : 1;
    T(c, fin(s, 3, 7.2, 0.5) * a3, L('10 m：1033 ÷ 2033 ≈ 50.8%', '10 m: 1033 ÷ 2033 ≈ 50.8%'), PCX, 172, AIRC, 24);
    T(c, fin(s, 3, 7.8, 0.5) * a3, L('半徑 ＝ ∛0.508 ≈ 0.80 倍', 'Radius = ∛0.508 ≈ 0.80×'), PCX, 214, DIM, 22);
    T(c, fin(s, 4, 5.2, 0.5), L('40 m：總壓力 1033 ＋ 4000 ＝ 5033', '40 m: total 1033 + 4000 = 5033'), PCX, 168, WHITE, 22);
    T(c, fin(s, 4, 5.8, 0.5), L('1033 ÷ 5033 ≈ 20.5%', '1033 ÷ 5033 ≈ 20.5%'), PCX, 206, AIRC, 24);
    T(c, fin(s, 4, 6.4, 0.5), L('半徑 ＝ ∛0.205 ≈ 0.59 倍', 'Radius = ∛0.205 ≈ 0.59×'), PCX, 244, DIM, 22);

    /* 小表：深度｜總壓力 → 體積｜（球的大小，確實按 ∛ 畫） */
    const ha = fin(s, 3, 2.8, 0.6);
    const CX = [482, 610, 690, 790, 892];
    if (ha > 0.02) withA(c, ha, () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(PX0 + 18, 318); c.lineTo(PX1 - 18, 318); c.stroke(); c.restore();
    });
    T(c, ha, L('深度', 'Depth'), CX[0], 298, DIM, 22);
    T(c, ha, L('總壓力', 'Total P'), CX[1], 298, DIM, 22);
    T(c, ha, L('體積', 'Volume'), CX[3], 298, DIM, 22);
    const rows = [
      { d: 0, y: 342, a: fin(s, 3, 3.0, 0.6) },
      { d: 10, y: 386, a: fin(s, 3, 8.2, 0.6) },
      { d: 40, y: 430, a: fin(s, 4, 7.0, 0.6) }
    ];
    rows.forEach(rw => {
      if (rw.a <= 0.02) return;
      const hot = (rw.d === 10 && s.n === 3) || (rw.d === 40 && s.n === 4);
      if (hot) withA(c, rw.a, () => { c.save(); W5.rr(c, PX0 + 12, rw.y - 21, PX1 - PX0 - 24, 42, 10); c.fillStyle = 'rgba(255,224,102,0.10)'; c.fill(); c.restore(); });
      T(c, rw.a, rw.d + ' m', CX[0], rw.y, WHITE, 24);
      T(c, rw.a, String(total(rw.d)), CX[1], rw.y, rw.d ? YEL : ATM, 24);
      T(c, rw.a, '→', CX[2], rw.y, DIM, 24);
      T(c, rw.a, pct(rw.d), CX[3], rw.y, AIRC, 24);
      const r = 18 * Math.cbrt(vol(rw.d));
      M4.airBall(c, CX[4], rw.y - 2, r, { a: rw.a, n: 8, knot: false, ghost: rw.d ? 18 : null, ghostA: 0.6 });
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('水的表壓', 'Gauge pressure'),
    () => L('加上大氣壓', 'Add the air'),
    () => L('10 m：剩一半', '10 m: half left'),
    () => L('40 m：剩約 1/5', '40 m: about 1/5')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 6.4, 0.6) * fout(s, 2, 0, 0.4), L('表壓：只算「水」造成的壓力', 'Gauge pressure: from the water only'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 6.4, 0.6) * fout(s, 3, 0, 0.4), L('總壓力 ＝ 大氣壓 ＋ 表壓', 'Total pressure = air pressure + gauge pressure'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.8, 0.6) * fout(s, 4, 0, 0.4), L('10 m：體積約剩 50.8%（約一半）', '10 m: about 50.8% of the volume left (about half)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.0, 0.6), L('越深，總壓力越大，空氣球越小；但水幾乎壓不縮', 'Deeper → more total pressure → smaller balloon; water hardly squeezes'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const d = depth(s);
    scene(c, s);
    measure(c, s, d);
    atmosphere(c, s);
    ball(c, s, d);
    board(c, s);
    texts(c, s);
  }

  W5.register('total', { canvas: 'cvs-total', steps: DUR, draw });
})();
