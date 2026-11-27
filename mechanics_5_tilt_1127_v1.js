/* ==================================================================
   mechanics_5 ｜ 垂直高度：不看長短，不看粗細（cvs-tilt，960×540）
   四步：1 傾斜管子 → 2 換成粗管 → 3 混入空氣 → 4 上高山
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption、M4.L／T／P／withA／fin／fout／grow、
        M5.trough／baroTube／dimV／airCol／pArrowAt／tube／PC（trough、baroTube、dimV、airCol 由 torr 新增）。

   數字（照簡報）：1 atm ＝ 76 cmHg；傾斜 37°（cos ＝ 0.8）→ 管內長度 76 ÷ 0.8 ＝ 95 cm；管頂混入空氣 → 約 66 cm（示意）；
     高山約 3000 m → 約 53 cm。
   比例尺：1 cm ＝ 3.6 px（垂直、照比例，同 torr）。槽面 y 448；76 cm＝273.6 px → 黃色橫向虛線 y 174.4（第 1～4 步一直都在）；
     95 cm＝342 px；66 cm → y 210.4；53 cm → y 257.2。管子槽面以上 100 cm＝360 px、插在槽面下 22 px（傾斜時繞「管子與槽面的交點」轉）。
     管寬：細管內半寬 10 px、粗管 30 px（直徑 3 倍，示意，不照比例）。
   第 1 步（11 s）：虛線＋左側尺寸標「76 cm」u 0.3；u 1.5～5.0 直立的管子往右傾到 37°，水銀頂端沿虛線往右滑（液面一直是水平的）；
     u 5.4 起直角三角形：沿管的青色尺寸線「長度 95 cm」、黃色垂直邊「垂直高度 76 cm」、槽面上的水平虛邊（不標）、直角記號；字卡 u 7.4。
   第 2 步（11 s）：u 0～1.4 傾斜管轉回直立、u 1.4～2.0 淡出；u 2.0～2.6 細管（x 240）與粗管（x 420）裝滿出現，
     u 2.8 起兩管水銀柱一起掉下來（h ＝ 76 ＋ 24·e^(−2.65τ)·cos(4τ)），停在同一條虛線上；「細管」「粗管」u 2.4、兩個「76 cm」u 6.0；字卡 u 7.0。
   第 3 步（11 s）：粗管淡出 u 0～0.8；小彎管伸進槽裡、開口在細管管口正下方 u 0.6～1.2；氣泡沿彎管走到管口 u 1.4～2.4，
     沿管內往上升到管頂 u 2.4～5.0；u 5.0～6.2 管頂出現 14 顆空氣分子、水銀頂端由 76 cm 降到 66 cm；「約 66 cm（示意）」u 6.2；字卡 u 7.0。
   第 4 步（12 s）：舊畫面淡出 u 0～0.6；左「平地」、右「高山（約 3000 m）」兩組（槽＋管，同比例尺、同槽面）u 0.4～1.2 出現（右組一開始也是 76 cm）；
     u 1.6～4.6 右組背後的山升起、右組頭上的空氣柱變短變疏（頂端 y 60→200、點數 26→12）、槽面大氣壓力箭頭由 64 px 縮成 45 px（∝ 76:53）、
     水銀柱由 76 cm 降到 53 cm；「約 53 cm」u 4.8；字卡 u 7.0。
   版面：地面 GY 486；第 1～3 步：槽內壁 x 110～560（內底 480、槽口 420），尺寸標 x 160，細管 x 240、粗管 x 420、彎管 x 300；
     第 4 步：左槽 x 90～350（管 x 220、空氣柱 x 112～172、尺寸標 x 290），右槽 x 560～820（管 x 680、空氣柱 x 586～646、尺寸標 x 750）。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.baroTube) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, TEAL = COL.teal, PR = M5.PC.pressure;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const K = 3.6, GY = 486, SURF = 448, DIP = 22, LEN = 360 + DIP, MOUTH = SURF + DIP;
  const Y76 = SURF - 76 * K, Y66 = SURF - 66 * K, Y53 = SURF - 53 * K;
  const TR = { x0: 110, x1: 560, bot: 480, top: 420 };
  const DIMX = 160, TX = 240, THX = 420, THW = 30;
  const TILT = Math.atan2(0.6, 0.8);                    /* 37°（cos ＝ 0.8） */
  const BEND = [[300, 398], [300, 475], [266, 475], [246, 475]];   /* 送氣泡的小彎管 */
  const GL = { x0: 90, x1: 350, tx: 220 }, GR = { x0: 560, x1: 820, tx: 680 };

  /* ── 時間函式（純函式） ── */
  const drop = tau => (tau <= 0 ? 100 : 76 + 24 * Math.exp(-2.65 * tau) * Math.cos(4 * tau));
  function tiltAng(s) {
    if (s.n === 1) return TILT * ease(clamp01((s.u - 1.5) / 3.5));
    if (s.n === 2) return TILT * (1 - ease(clamp01(s.u / 1.4)));
    return 0;
  }
  const mainA = s => (s.n === 4 ? fout(s, 4, 0, 0.6) : 1);          /* 第 1～3 步的畫面，第 4 步開頭淡出 */
  const newA = s => (s.n === 4 ? fin(s, 4, 0.4, 0.8) : 0);          /* 第 4 步的兩組 */

  /* 以「管子與槽面交點」為支點的管口位置 */
  function mouthAt(px, ang) { return [px - Math.sin(ang) * DIP, SURF + Math.cos(ang) * DIP]; }

  /* ═══════════ 一直都在：76 cm 橫向虛線 ═══════════ */
  function line76(c, s) {
    const a = s.n === 1 ? fin(s, 1, 0.3, 0.6) : 1;
    withA(c, a, () => {
      c.save(); c.strokeStyle = W5.rgba(YEL, 0.9); c.lineWidth = 2.5; c.setLineDash([12, 8]); c.lineDashOffset = -s.t * 12;
      c.beginPath(); c.moveTo(40, Y76); c.lineTo(940, Y76); c.stroke(); c.setLineDash([]); c.restore();
    });
  }

  /* ═══════════ 第 1～3 步 ═══════════ */
  function mainScene(c, s) {
    const A = mainA(s); if (A <= 0.02) return;
    const t = s.t;
    withA(c, A, () => {
      M5.trough(c, Object.assign({ level: SURF, t, wob: 1.3 }, TR));
      M5.dimV(c, DIMX, SURF, Y76, '76 cm', { a: s.n === 1 ? fin(s, 1, 0.3, 0.6) : 1 });
      if (s.n === 1 || s.n === 2) tiltTube(c, s);
      if (s.n === 2 || s.n === 3) twoTubes(c, s);
      if (s.n === 3) bubble(c, s);
    });
  }

  /* 第 1 步：傾斜（第 2 步開頭轉回直立、淡出） */
  function tiltTube(c, s) {
    const ang = tiltAng(s), a = s.n === 2 ? 1 - clamp01((s.u - 1.4) / 0.6) : 1;
    if (a <= 0.02) return;
    const m = mouthAt(TX, ang);
    M5.baroTube(c, { x: m[0], y: m[1], len: LEN, ang, hw: 10, level: Y76, a });
    if (s.n !== 1) return;
    /* 直角三角形 */
    const g = grow(s, 1, 5.4, 6.2), ta = fin(s, 1, 5.4, 0.4);
    const topX = TX + 95 * K * Math.sin(TILT);            /* 205.2 px 往右 */
    const nx = -Math.cos(TILT), ny = -Math.sin(TILT), off = 30;   /* 往左上的法向 */
    withA(c, ta, () => {
      c.save();
      /* 水平邊（槽面上，虛線，不標） */
      c.strokeStyle = W5.rgba(WHITE, 0.75); c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(TX, SURF); c.lineTo(lerp(TX, topX, g), SURF); c.stroke(); c.setLineDash([]);
      /* 直角記號 */
      if (g > 0.95) { c.strokeStyle = WHITE; c.lineWidth = 2; c.beginPath(); c.moveTo(topX - 14, SURF); c.lineTo(topX - 14, SURF - 14); c.lineTo(topX, SURF - 14); c.stroke(); }
      /* 沿管的長度尺寸線（青） */
      const x0 = TX + nx * off, y0 = SURF + ny * off, x1 = topX + nx * off, y1 = Y76 + ny * off;
      const xe = lerp(x0, x1, g), ye = lerp(y0, y1, g);
      c.strokeStyle = TEAL; c.lineWidth = 3;
      c.beginPath(); c.moveTo(TX + nx * (off - 9), SURF + ny * (off - 9)); c.lineTo(TX + nx * (off + 9), SURF + ny * (off + 9)); c.stroke();
      W5.arrow(c, (x0 + xe) / 2, (y0 + ye) / 2, x0, y0, TEAL, 3, 12);
      W5.arrow(c, (x0 + xe) / 2, (y0 + ye) / 2, xe, ye, TEAL, 3, 12);
      if (g > 0.98) { c.beginPath(); c.moveTo(topX + nx * (off - 9), Y76 + ny * (off - 9)); c.lineTo(topX + nx * (off + 9), Y76 + ny * (off + 9)); c.stroke(); }
      c.restore();
    });
    M5.dimV(c, topX, SURF, Y76, null, { a: ta, g });
    P(c, fin(s, 1, 6.0, 0.5), L('長度 95 cm', 'Length 95 cm'), 270, 252, TEAL, 22, 'center', true);
    P(c, fin(s, 1, 6.6, 0.5), L('垂直高度 76 cm', 'Vertical height 76 cm'), topX + 16, 311, YEL, 22, 'left', true);
    T(c, fin(s, 1, 2.0, 0.5), '37°', TX + 26, SURF - 70, WHITE, 22, 'left', true);
    withA(c, fin(s, 1, 2.0, 0.5), () => {
      c.save(); c.strokeStyle = W5.rgba(WHITE, 0.8); c.lineWidth = 2;
      c.beginPath(); c.arc(TX, SURF, 56, -Math.PI / 2, -Math.PI / 2 + ang); c.stroke();
      c.setLineDash([5, 5]); c.beginPath(); c.moveTo(TX, SURF); c.lineTo(TX, SURF - 76); c.stroke(); c.setLineDash([]); c.restore();
    });
  }

  /* 第 2 步：細管＋粗管一起掉到 76 cm；第 3 步粗管淡出、細管留著 */
  function twoTubes(c, s) {
    const a = s.n === 2 ? clamp01((s.u - 2.0) / 0.6) : 1;
    if (a <= 0.02) return;
    const h = s.n === 2 ? drop(s.u - 2.8) : 76;
    const thinLv = s.n === 3 ? thinLevel(s) : SURF - h * K;
    const gas = s.n === 3 ? gasN(s) : 0;
    M5.baroTube(c, { x: TX, y: MOUTH, len: LEN, hw: 10, level: thinLv, a, gas: gas > 0 ? { n: gas, seed: 31, t: s.t, r: 3 } : null });
    const tha = a * (s.n === 3 ? 1 - clamp01(s.u / 0.8) : 1);
    M5.baroTube(c, { x: THX, y: MOUTH, len: LEN, hw: THW, wall: 5, level: SURF - h * K, a: tha });
    const la = s.n === 2 ? fin(s, 2, 2.4, 0.5) : 1 - clamp01(s.u / 0.6);
    T(c, la, L('細管', 'Thin'), TX + 22, 112, WHITE, 22, 'left');
    T(c, la * (s.n === 2 ? 1 : 0), L('粗管', 'Wide'), THX + THW + 14, 112, WHITE, 22, 'left');
    const da = s.n === 2 ? fin(s, 2, 6.0, 0.5) : 1 - clamp01(s.u / 0.6);
    M5.dimV(c, 500, SURF, Y76, '76 cm', { a: da * (s.n === 2 ? 1 : 0) });
  }

  /* 第 3 步：氣泡 */
  const bubK = s => clamp01((s.u - 1.4) / 1.0);                       /* 在彎管裡 */
  const riseK = s => ease(clamp01((s.u - 2.4) / 2.6));                 /* 在管內往上 */
  const mergeK = s => ease(clamp01((s.u - 5.0) / 1.2));
  const thinLevel = s => lerp(Y76, Y66, mergeK(s));
  const gasN = s => Math.round(14 * mergeK(s));
  function bubble(c, s) {
    const ba = fin(s, 3, 0.6, 0.6);
    M5.tube(c, BEND, { style: 'glass', hw: 4, wall: 2.5, a: ba });
    const k = bubK(s), r = riseK(s), u = s.u, t = s.t;
    let bx = null, by = null;
    if (u >= 1.4 && u < 2.4) { const Pl = M5.poly(BEND), p = Pl.at(Pl.len * k); bx = p[0]; by = p[1]; }
    else if (u >= 2.4 && mergeK(s) < 0.4) { bx = TX + 1.5 * Math.sin(t * 9); by = lerp(MOUTH - 4, 98, r); }
    if (bx != null) {
      const br = u < 2.4 ? 5 : lerp(6, 8, r), ga = 1 - clamp01(mergeK(s) / 0.4);
      withA(c, ga, () => {
        c.save(); c.fillStyle = 'rgba(13,32,26,0.7)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
        c.fillStyle = W5.rgba(M5.PC.air, 0.95); c.beginPath(); c.arc(bx - 1.5, by - 1.5, 2.2, 0, TAU); c.fill();
        c.restore();
      });
    }
    T(c, fin(s, 3, 1.4, 0.4) * fout(s, 3, 4.6, 0.5), L('空氣泡', 'Air bubble'), 312, 392, WHITE, 22, 'left');
    /* 管頂空氣、新高度 */
    const ma = fin(s, 3, 5.6, 0.5);
    P(c, ma, L('管頂有空氣', 'Air at the top'), TX + 26, 128, M5.PC.air, 22, 'left');
    const dg = grow(s, 3, 6.0, 6.6), da = fin(s, 3, 6.0, 0.3);
    M5.dimV(c, 286, SURF, Y66, null, { a: da, g: dg, col: PR });
    withA(c, da, () => { c.save(); c.strokeStyle = W5.rgba(PR, 0.9); c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(TX + 14, Y66); c.lineTo(296, Y66); c.stroke(); c.setLineDash([]); c.restore(); });
    P(c, fin(s, 3, 6.2, 0.5), L('約 66 cm（示意）', 'About 66 cm (schematic)'), 304, 318, PR, 22, 'left');
  }

  /* ═══════════ 第 4 步：平地 vs 高山 ═══════════ */
  function mountain(c, k, a) {
    if (a * k <= 0.02) return;
    const dy = 120 * (1 - k);
    withA(c, a * k, () => {
      c.save();
      const g = c.createLinearGradient(0, 120 + dy, 0, GY); g.addColorStop(0, '#5e7f74'); g.addColorStop(1, '#27443a');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(470, GY);
      [[540, 300], [610, 230], [655, 262], [720, 138], [790, 220], [850, 180], [960, 330], [960, GY]].forEach(([x, y]) => c.lineTo(x, y + dy));
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(246,243,234,0.85)';      /* 雪頂 */
      c.beginPath(); c.moveTo(696, 170 + dy); c.lineTo(720, 138 + dy); c.lineTo(746, 176 + dy); c.lineTo(730, 168 + dy); c.lineTo(718, 180 + dy); c.lineTo(706, 166 + dy); c.closePath(); c.fill();
      c.restore();
    });
  }
  function compare(c, s) {
    const a = newA(s); if (a <= 0.02) return;
    const t = s.t, k = ease(clamp01((s.u - 1.6) / 3.0));
    const hR = lerp(76, 53, k), lvR = SURF - hR * K;
    mountain(c, k, a * 0.55);
    withA(c, a, () => {
      /* 頭上的空氣柱：左長、密；右變短、變疏 */
      M5.airCol(c, 112, 60, 172, SURF - 6, { t, seed: 41, n: 26, dense: 0.6 });
      M5.airCol(c, 586, lerp(60, 200, k), 646, SURF - 6, { t, seed: 43, n: Math.round(lerp(26, 12, k)), dense: 0.6 });
      [GL, GR].forEach((G, i) => {
        M5.trough(c, { x0: G.x0, x1: G.x1, bot: 480, top: 420, level: SURF, t: t + i * 0.7, wob: 1.3 });
        M5.baroTube(c, { x: G.tx, y: MOUTH, len: LEN, hw: 10, level: i ? lvR : Y76 });
      });
    });
    /* 槽面的大氣壓力（長度 ∝ 大氣壓力：64 px ↔ 76 cm） */
    const pa = a * fin(s, 4, 1.2, 0.5);
    [270, 320].forEach((x, j) => M5.pArrowAt(c, x, SURF - 4, Math.PI / 2, 64 * (1 + 0.04 * Math.sin(t * 3.2 + j)), { a: pa, lw: 6 }));
    [730, 780].forEach((x, j) => M5.pArrowAt(c, x, SURF - 4, Math.PI / 2, 64 * hR / 76 * (1 + 0.04 * Math.sin(t * 3.2 + j)), { a: pa, lw: 6 }));
    /* 高度 */
    M5.dimV(c, 290, SURF, Y76, '76 cm', { a: a * fin(s, 4, 1.0, 0.5), ty: 300 });
    M5.dimV(c, 750, SURF, lvR, k > 0.99 ? L('約 53 cm', '≈ 53 cm') : null, { a: a * fin(s, 4, 1.0, 0.5), ty: 330 });
    P(c, a, L('平地', 'Sea level'), 120, M3.KEY_Y, WHITE, 22);
    P(c, a, L('高山（約 3000 m）', 'Mountain (~3000 m)'), 836, M3.KEY_Y, WHITE, 22);
    T(c, a * fin(s, 4, 4.4, 0.5), L('頭上空氣變少', 'Less air above'), 616, 146, M5.PC.sea, 22, 'center');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('傾斜管子', 'Tilt the tube'),
    () => L('換成粗管', 'A wider tube'),
    () => L('混入空氣', 'Let air in'),
    () => L('上高山', 'Up a mountain')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.4, 0.6) * fout(s, 2, 0, 0.4), L('變長的是長度，垂直高度不變', 'The length grows; the vertical height stays'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 7.0, 0.6) * fout(s, 3, 0, 0.4), L('粗細不影響垂直高度', 'Width does not change the vertical height'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * fout(s, 4, 0, 0.4), L('管頂有空氣：垂直高度變低', 'Air at the top: the height drops'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.0, 0.6), L('上高山：大氣壓力變小，水銀柱變低', 'Higher up: less air pressure, a shorter column'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    if (s.n === 4) compare(c, s);
    M3.ground(c, GY);
    mainScene(c, s);
    line76(c, s);
    texts(c, s);
  }

  W5.register('tilt', { canvas: 'cvs-tilt', steps: DUR, draw });
})();
