/* ==================================================================
   mechanics_4 ｜ 液體壓力：越深越大（cvs-depth，960×540）
   四步：1 垂直深度 h → 2 洞越深噴越遠 → 3 算出壓力 P ＝ h × D → 4 水面降低
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （M4.tank／M4.jet／M4.jetRange／M4.plug／M4.trough／M4.depthRuler 由本檔新增）。

   數字（照簡報）：水深 40 cm；三個洞在水面下 10、20、30 cm（離桶底 30、20、10 cm）；清水 D ＝ 1 gw/cm³
       → P ＝ 10、20、30 gw/cm²。第 4 步水位 40 → 25 cm：上洞露出水面，另兩洞 h ＝ 5、15 cm → P ＝ 5、15 gw/cm²。
   比例尺：1 cm ＝ 3 px（水桶、支架、噴流全用同一個比例）。
       桶內底 TB＝222、水面 y＝222－3×水位；地面 GY＝474，接水槽水面 LY＝466 → 支架落差（桶底到落點）＝ 244 px ≈ 81 cm ＞ 2 × 40 cm。
       噴流：真正的拋物線（M4.jet，g＝1 無因次：v＝√(2h)），水平射程 ＝ 2√(h × 落差)：
         40 cm 水位：h 10／20／30 cm、落差 111.3／101.3／91.3 cm → 射程 66.7／90.0／104.7 cm（200／270／314 px，深者較遠）
         25 cm 水位：h 5／15 cm → 射程 45.0／74.0 cm（135／222 px）
   初速箭頭（青）長 ＝ 40 px × √(h／10 cm)（∝ √h）；壓力箭頭（珊瑚）3 px／(gw/cm²)＝30／60／90 px，尖端在洞口內壁（朝外）。
   版面：量尺與深度數字在桶左外側（x 40～126）；水桶內壁 x 140～450；噴流向右落進接水槽 x 540～820；
       步驟標題 KEY_Y 62（中）、公式 pill 右上 (810, 62)；字卡在底部 BOT_Y 505（地面下方）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.jet) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow, since = M4.since;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PUSH = M4.PC.force, PR = M4.PC.pressure;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */

  /* ── 場景（1 cm ＝ K px） ── */
  const K = 3;
  const TX0 = 140, TX1 = 450, WALL = 6, TB = 222, RIM = 90;
  const GY = 474, TR0 = 540, TR1 = 820;
  const LY = GY - 8;                   /* 接水槽水面＝落點 */
  const HB = [30, 20, 10];             /* 洞離桶底 cm */
  const HY = HB.map(b => TB - b * K);  /* 洞的 y：132、162、192 */
  const RUL_X = 119, LAB_X = 104;      /* 量尺中線、深度數字右緣 */
  const VK = 40, PK = 3;               /* 初速箭頭 40 px × √(h/10)；壓力 3 px／(gw/cm²) */
  const POP = [1.2, 1.8, 2.4];         /* 第 2 步塞子依序彈開 */
  const FREE_X = 220;                  /* 「自由液面」標籤 x */

  /* ── 狀態（純函式） ── */
  function level(s) { return s.n === 4 ? 40 - 15 * ease(seg(s.u, 1.0, 7.0)) : 40; }   /* 水位 cm */
  const yOfLevel = lv => TB - lv * K;
  /* 第 i 個洞：噴流前緣（飛行時間比例）、塞子 */
  function jetF(s, i) {
    if (s.n === 1) return 0;
    if (s.n > 2) return 1;
    const dropCm = (LY - HY[i]) / K, dur = 1.1 * Math.sqrt(dropCm / 100);
    return clamp01((s.u - POP[i]) / dur);
  }

  /* ═══════════ 場景 ═══════════ */
  function scene(c, s, lv) {
    const n = s.n, t = s.t, ly = yOfLevel(lv);
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    M3.table(c, TX0 - WALL - 16, TX1 + WALL + 16, TB + WALL, GY, { thick: 18, seed: 11 });
    M4.trough(c, TR0, TR1, GY, { h: 24 });
    /* 自由液面高亮：第 1 步一開始、第 4 步下降時 */
    const glow = n === 1 ? fin(s, 1, 0.6, 0.6) * (1 - 0.6 * fin(s, 1, 3.0, 0.8)) : n === 4 ? 0.4 + 0.4 * seg(s.u, 1.0, 1.6) * (1 - seg(s.u, 7.0, 8.0)) : 0.4;
    M4.tank(c, { x0: TX0, x1: TX1, bot: TB, top: RIM, level: ly, wall: WALL, t, glow,
      holes: HY.map(y => ({ y, side: 'right', r: 5 })) });
    /* 噴流 */
    const res = HY.map((y, i) => {
      const hPx = ly < y ? (y - ly) : 0, f = jetF(s, i);
      return M4.jet(c, { x: TX1 + WALL, y, h: hPx, landY: LY, f, t: t + i * 0.37, seed: i });
    });
    /* 軟木塞：第 1 步塞著；第 2 步彈開後跟著噴流前緣飛、落進水槽後淡出 */
    HY.forEach((y, i) => {
      if (n === 1) { M4.plug(c, TX1 + 2, y, {}); return; }
      if (n !== 2) return;
      const u = s.u - POP[i];
      if (u < 0) { M4.plug(c, TX1 + 2, y, { rot: u > -0.25 ? 0.15 * Math.sin(u * 60) : 0 }); return; }
      const f = jetF(s, i), fr = res[i].front, land = f >= 1;
      const a = land ? 1 - clamp01((u - 1.4) / 0.4) : 1;
      M4.plug(c, fr[0] + 4, fr[1] - (land ? 0 : 3), { rot: u * 7, a });
    });
    return res;
  }

  /* ── 深度量尺（左外側）＋垂直虛線 h＋到洞口的水平點線 ── */
  function ruler(c, s, lv) {
    const ly = yOfLevel(lv), n = s.n;
    const ra = fin(s, 1, 2.0, 0.6);
    M4.depthRuler(c, RUL_X, ly, TB, K, { a: ra });
    T(c, ra, '0', RUL_X, ly - 16, YEL, 22);   /* 0 在量尺頂端上方（水面降到 5 cm 時才不會壓到深度數字） */
    /* 黃色垂直虛線：從自由液面往下長到最深的洞 */
    const g = grow(s, 1, 2.4, 4.6), deepest = HY.filter(y => y > ly + 1).pop() || ly;
    const yEnd = lerp(ly, deepest, g);
    if (g > 0.01 && yEnd - ly > 6) withA(c, 1, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 4; c.setLineDash([7, 6]);
      c.beginPath(); c.moveTo(RUL_X, ly); c.lineTo(RUL_X, yEnd - 8); c.stroke(); c.setLineDash([]); c.restore();
      W5.arrow(c, RUL_X, yEnd - 12, RUL_X, yEnd, YEL, 3, 11);
    });
    /* 每個洞：深度數字、點線（第 3 步起淡出，讓位給壓力） */
    const lineA = n <= 2 ? 1 : fout(s, 3, 0, 0.6);
    HY.forEach((y, i) => {
      const d = (y - ly) / K, reach = clamp01((yEnd - y + 8) / 8);
      const da = reach * clamp01((d - 1.5) / 1.5);
      if (da <= 0.02) return;
      withA(c, 0.55 * da * lineA, () => {
        c.save(); c.strokeStyle = WHITE; c.lineWidth = 2; c.setLineDash([3, 6]);
        c.beginPath(); c.moveTo(RUL_X + 8, y); c.lineTo(TX1 - 4, y); c.stroke(); c.restore();
      });
      T(c, da, Math.round(d) + ' cm', LAB_X, y, WHITE, 22, 'right');
    });
    /* 「自由液面」標籤＋引線 */
    const fa = fin(s, 1, 1.0, 0.6);
    T(c, fa, L('自由液面', 'Free surface'), FREE_X, 66, M4.PC.waterEdge, 22);
    withA(c, fa * 0.8, () => {
      c.save(); c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 2;
      c.beginPath(); c.moveTo(FREE_X, 80); c.lineTo(FREE_X, ly - 7); c.stroke();
      c.beginPath(); c.arc(FREE_X, ly, 4, 0, Math.PI * 2); c.fillStyle = M4.PC.waterEdge; c.fill(); c.restore();
    });
  }

  /* ── 初速箭頭（第 2 步；∝ √h） ── */
  function speedArrows(c, s, lv) {
    if (s.n !== 2 && s.n !== 3) return;
    const a = s.n === 3 ? fout(s, 3, 0, 0.6) : 1;
    HY.forEach((y, i) => {
      const h = (y - yOfLevel(lv)) / K, g = grow(s, 2, 4.0 + 0.5 * i, 4.6 + 0.5 * i);
      if (g <= 0.01 || h <= 0) return;
      const len = VK * Math.sqrt(h / 10) * g, x0 = TX1 + WALL + 4;
      M3.arrowFx(c, x0, y, x0 + len, y, PUSH, a, 5, 0);
    });
  }

  /* ── 壓力箭頭（珊瑚，尖端在洞口內壁、朝外；長 ∝ h）＋洞旁算式 ── */
  function pressure(c, s, lv) {
    if (s.n < 3) return;
    const ly = yOfLevel(lv);
    const live = HY.map(y => (y - ly) / K);
    const top = live.findIndex(d => d > 0.5);   /* 最淺、還在水裡的洞：寫單位 */
    HY.forEach((y, i) => {
      const d = live[i], g = grow(s, 3, 1.8 + 1.2 * i, 2.6 + 1.2 * i);
      if (g <= 0.01 || d <= 0.05) return;
      const len = PK * d * g;
      M4.pArrow(c, TX1, y, len, { dir: 'right', lw: 6 });
      const la = fin(s, 3, 2.4 + 1.2 * i, 0.5) * clamp01((d - 1.5) / 1.5);
      const v = Math.round(d);
      const str = 'P ＝ ' + v + ' × 1 ＝ ' + v + (i === top ? ' gw/cm²' : '');
      T(c, la, str, TX1 - PK * d - 12, y, PR, 22, 'right');
    });
    /* 上洞露出水面 */
    const ex = clamp01((ly - HY[0]) / (1.5 * K));
    T(c, ex * (s.n === 4 ? 1 : 0), L('露出水面：停止出水', 'Above water: no flow'), TX1 + WALL + 14, HY[0], DIM, 22, 'left');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('垂直深度 h', 'Vertical depth h'),
    () => L('洞越深，噴越遠', 'Deeper hole, farther jet'),
    () => L('算出壓力', 'Work out the pressure'),
    () => L('水面降低', 'Lower the water level')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    /* 公式（第 3 步起） */
    const fa = fin(s, 3, 0.8, 0.6);
    if (fa > 0.02) W5.glow(c, 810, M3.KEY_Y, 110, YEL, 0.12 * fa);
    P(c, fa, 'P ＝ h × D', 810, M3.KEY_Y, YEL, 28);
    T(c, fin(s, 3, 1.4, 0.6), L('清水 D ＝ 1 gw/cm³', 'Water: D = 1 gw/cm³'), 810, 104, WHITE, 22);
    /* 字卡 */
    M3.caption(c, fin(s, 1, 6.0, 0.6) * fout(s, 2, 0, 0.4), L('h：從自由液面「垂直」往下量', 'h: measured straight down from the free surface'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 6.2, 0.6) * fout(s, 3, 0, 0.4), L('越深，噴得越有力', 'The deeper the hole, the stronger the jet'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 6.6, 0.6) * fout(s, 4, 0, 0.4), L('壓力和深度成正比', 'Pressure is proportional to depth'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.0, 0.6), L('h 從自由液面往下量；水面降低，壓力就變小', 'h is measured from the free surface: lower level, lower pressure'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const lv = level(s);
    scene(c, s, lv);
    ruler(c, s, lv);
    speedArrows(c, s, lv);
    pressure(c, s, lv);
    texts(c, s);
  }

  W5.register('depth', { canvas: 'cvs-depth', steps: DUR, draw });
})();
