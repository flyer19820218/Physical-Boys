/* ==================================================================
   mechanics_4 ｜ 液體壓力：不同形狀的杯子，只看深度（cvs-shape，960×540）
   四步：1 三種杯子（倒水）→ 2 水面一樣高（A、B、C）→ 3 量垂直深度 h → 4 結論（三支一樣長的壓力箭頭）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4（M4.cup／M4.pour 由本檔新增）。

   數字（照簡報）：三杯都是清水、水面到杯底 20 cm；D ＝ 1 gw/cm³ → P ＝ 20 × 1 ＝ 20 gw/cm²，三點相等。
   比例尺：1 cm ＝ 8 px。杯內底 BOT＝360、水面 LV＝200（20 cm）、杯口 RIM＝168；杯底外緣＝地面 GY＝370。
   杯子（側視剖面＝圓台，內半寬 底／口）：甲 110／50（上窄下寬）、乙 80／80（圓柱）、丙 35／120（上寬下窄）。
       水量（圓台體積，相對值）：甲 ≈ 22300、乙 ≈ 19200、丙 ≈ 16100 → 甲 ＞ 乙 ＞ 丙（不標毫升數）。
       第 1 步三杯「同樣的流量」一起倒：甲 5.0 秒、乙 4.3 秒、丙 3.6 秒倒滿（水少的先滿，看得出水量不同）。
   壓力箭頭（珊瑚）3 px／(gw/cm²) → 三支都 60 px，尖端在杯底（朝下）。
   版面：杯子中線 x 160／480／800；杯名 y 398、壓力 pill y 446、結論字卡 BOT_Y 505；
       步驟標題 KEY_Y 62、問句／量法字卡／公式 Q_Y 108；「水面一樣高」標在甲、乙之間 (305, 178)。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.cup) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, EDGE = M4.PC.waterEdge;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */

  /* ── 場景（1 cm ＝ K px） ── */
  const K = 8, BOT = 360, LV = BOT - 20 * K, RIM = 168, BASE = 10, GY = BOT + BASE;
  const CUPS = [
    { cx: 160, rb: 110, rt: 50, pt: 'A', name: () => L('甲：上窄下寬', 'Cup A: narrow top') },
    { cx: 480, rb: 80, rt: 80, pt: 'B', name: () => L('乙：圓柱', 'Cup B: straight sides') },
    { cx: 800, rb: 35, rt: 120, pt: 'C', name: () => L('丙：上寬下窄', 'Cup C: wide top') }
  ];
  const NAME_Y = 398, PILL_Y = 446, H_Y = 252, LABEL_X = 305;
  const PK = 3, P_VAL = 20, ARR_DX = 28;   /* 壓力箭頭：3 px／(gw/cm²)，畫在點的右邊 28 px */

  /* ── 倒水：圓台體積 V(h)＝∫(rb＋m z)² dz（π 省略，只比相對值），同樣流量 Q 一起倒 ── */
  const H = BOT - RIM, HW = BOT - LV;
  const vol = (cp, h) => { const m = (cp.rt - cp.rb) / H; return cp.rb * cp.rb * h + cp.rb * m * h * h + m * m * h * h * h / 3; };
  const VFULL = CUPS.map(cp => vol(cp, HW));
  const POUR0 = 1.5, FALL = 0.25, Q = VFULL[0] / 5.0;          /* 甲 5 秒倒滿 */
  const TFILL = VFULL.map(v => v / Q);                          /* 各杯倒滿要幾秒 */
  const hOfVol = (cp, v) => { let lo = 0, hi = HW; for (let k = 0; k < 28; k++) { const mid = (lo + hi) / 2; if (vol(cp, mid) < v) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  /* 第 i 杯：已倒了幾秒（從水柱落到杯底算起） */
  function pourT(s) { return s.n === 1 ? s.u - POUR0 - FALL : 99; }
  function levelY(s, i) {
    const tp = pourT(s);
    if (tp <= 0) return BOT;
    if (tp >= TFILL[i]) return LV;
    return BOT - hOfVol(CUPS[i], Q * tp);
  }

  /* ═══════════ 場景 ═══════════ */
  function scene(c, s) {
    const n = s.n, t = s.t;
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    const ca = fin(s, 1, 0.1, 0.8);
    const glow = n === 2 ? 0.35 + 0.45 * seg(s.u, 0.6, 1.2) * (1 - seg(s.u, 3.0, 3.8)) : n > 2 ? 0.35 : 0;
    CUPS.forEach((cp, i) => {
      const ly = levelY(s, i), tp = pourT(s);
      /* 倒水時水面晃得大一點，倒滿後 0.6 秒內平靜下來 */
      const stir = n === 1 ? clamp01(tp + FALL) * (1 - clamp01((tp - TFILL[i]) / 0.6)) : 0;
      const res = M4.cup(c, { cx: cp.cx, bot: BOT, rim: RIM, rb: cp.rb, rt: cp.rt, level: ly, base: BASE, t: t + i * 0.41,
        wob: 1.6 + 1.6 * stir, a: ca, glow });
      /* 水柱：從上方落下（FALL 秒落到杯底）→ 倒滿後尾端往下收（FALL 秒） */
      if (n === 1) {
        const u = s.u - POUR0;
        if (u > 0) {
          const y0 = 88, yHit = ly < BOT - 0.5 ? res.surf(cp.cx) : BOT;
          const head = lerp(y0, yHit, clamp01(u / FALL));
          const tail = lerp(y0, yHit, clamp01((u - FALL - TFILL[i]) / FALL));
          if (head - tail > 2) M4.pour(c, cp.cx, tail, head, { t: t + i * 0.3, w: 8, splash: u > FALL, rw: Math.min(26, cp.rb - 8) });
        }
      }
    });
  }

  /* ── 杯名（甲乙丙＋形狀特徵） ── */
  function names(c, s) {
    const a = fin(s, 1, 0.8, 0.6);
    CUPS.forEach(cp => T(c, a, cp.name(), cp.cx, NAME_Y, WHITE, 22));
  }

  /* ── 第 2 步：水面一樣高（橫貫三杯的水平虛線）＋杯底亮點 A、B、C ── */
  function levelLine(c, s) {
    const g = grow(s, 2, 0.6, 2.4); if (g <= 0.01) return;
    const x0 = 24, x1 = lerp(x0, 936, g), a = s.n === 4 ? 0.75 : 1;
    withA(c, a, () => {
      c.save(); c.strokeStyle = EDGE; c.lineWidth = 3; c.setLineDash([12, 8]);
      c.beginPath(); c.moveTo(x0, LV); c.lineTo(x1, LV); c.stroke(); c.restore();
    });
    T(c, fin(s, 2, 1.8, 0.6) * a, L('水面一樣高', 'Same level'), LABEL_X, LV - 22, EDGE, 22);
  }
  function points(c, s) {
    CUPS.forEach((cp, i) => {
      const a = fin(s, 2, 3.2 + 0.5 * i, 0.5); if (a <= 0.02) return;
      const x = cp.cx, y = BOT - 5;
      /* 剛出現時閃一下 */
      const pulse = s.n === 2 ? Math.max(0, 1 - Math.abs(s.u - (3.5 + 0.5 * i)) / 0.6) : 0;
      W5.glow(c, x, y, 26 + 14 * pulse, YEL, (0.35 + 0.35 * pulse) * a);
      withA(c, a, () => {
        c.save(); c.fillStyle = YEL; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(x, y, 6.5, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
      });
      T(c, a, cp.pt, x - 14, BOT - 20, YEL, 24, 'right');
    });
  }

  /* ── 第 3 步：從水面垂直往下的量尺到 A、B、C，標 h ＝ 20 cm ── */
  function rulers(c, s) {
    CUPS.forEach((cp, i) => {
      const g = grow(s, 3, 1.0 + 0.6 * i, 2.6 + 0.6 * i); if (g <= 0.01) return;
      const y1 = lerp(LV, BOT, g);
      M4.depthRuler(c, cp.cx, LV, y1, K, { a: 1 });
      if (g < 0.999) W5.arrow(c, cp.cx, y1 - 14, cp.cx, y1, YEL, 3, 11);
      P(c, fin(s, 3, 2.8 + 0.6 * i, 0.5), L('h ＝ 20 cm', 'h = 20 cm'), cp.cx, H_Y, YEL, 22);
    });
  }

  /* ── 第 4 步：三支一樣長的壓力箭頭（尖端在杯底、朝下）＋ P 算式 ── */
  function pressure(c, s) {
    if (s.n < 4) return;
    const g = grow(s, 4, 1.0, 2.2), len = PK * P_VAL * g;
    CUPS.forEach(cp => M4.pArrow(c, cp.cx + ARR_DX, BOT, len, { dir: 'down', lw: 6 }));
    /* 三支箭頭尾端一樣高：淡淡的水平點線 */
    const ea = 0.55 * fin(s, 4, 3.2, 0.6), ty = BOT - PK * P_VAL;
    if (ea > 0.02) withA(c, ea, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 2; c.setLineDash([3, 7]);
      c.beginPath(); c.moveTo(CUPS[0].cx + ARR_DX - 22, ty); c.lineTo(CUPS[2].cx + ARR_DX + 22, ty); c.stroke(); c.restore();
    });
    CUPS.forEach((cp, i) => M4.pPill(c, fin(s, 4, 2.2 + 0.5 * i, 0.5), L('P ＝ 20 × 1 ＝ 20 gw/cm²', 'P = 20 × 1 = 20 gw/cm²'), cp.cx, PILL_Y, 22));
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('三種杯子', 'Three cups'),
    () => L('水面一樣高', 'Same water level'),
    () => L('量垂直深度 h', 'Measure the vertical depth h'),
    () => L('結論：壓力一樣大', 'Conclusion: same pressure')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.0, 0.6) * fout(s, 2, 0, 0.4), L('形狀不同、水量不同', 'Different shapes, different amounts of water'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 2, 6.0, 0.6) * fout(s, 3, 0, 0.4), L('杯底 A、B、C 的水壓一樣大嗎？', 'Is the pressure the same at A, B and C?'), WHITE, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 3, 0.4, 0.6) * fout(s, 4, 0, 0.4), L('h：從水面「垂直」往下量', 'h: measured straight down from the surface'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 4, 0.4, 0.6), L('P ＝ h × D（清水 D ＝ 1 gw/cm³）', 'P = h × D  (water: D = 1 gw/cm³)'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 4, 6.0, 0.6), L('P甲 ＝ P乙 ＝ P丙：與形狀、水量無關', 'P(A) = P(B) = P(C): shape and amount of water don’t matter'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    scene(c, s);
    levelLine(c, s);
    rulers(c, s);
    points(c, s);
    pressure(c, s);
    names(c, s);
    texts(c, s);
  }

  W5.register('shape', { canvas: 'cvs-shape', steps: DUR, draw });
})();
