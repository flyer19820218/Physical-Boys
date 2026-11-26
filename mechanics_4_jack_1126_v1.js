/* ==================================================================
   mechanics_4 ｜ 帕斯卡原理：液壓千斤頂（以小搏大）（cvs-jack，960×540）
   四步：1 兩個活塞 → 2 左邊壓 10 kgw → 3 壓力處處相等 → 4 右邊舉起 100 kgw
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （沿用 M4.piston／M4.pWaves／M4.hand／M4.pArrow／M4.pPill（transmit 建立）；M4.jack 由本檔新增）。

   數字（照簡報，不可改）：A小 ＝ 20 cm²、A大 ＝ 200 cm²（10 倍）；F小 ＝ 10 kgw ＝ 10000 gw
     → P ＝ 10000 ÷ 20 ＝ 500 gw/cm² → F大 ＝ 500 × 200 ＝ 100000 gw ＝ 100 kgw；重物 100 kgw。
   場景（側視剖面、整支同一個場景；液體與 transmit 一致用水）：
     連通管內部 y 410～462（筒口 MOUTH 410、管內底 FLOOR 462），壁厚 8。
     左小筒中線 SX 150、內寬 46 px；右大筒中線 BX 440、內寬 46×√10 ＝ 145.5 px（面積比 1：10 → 寬度比 1：3.16）。
     兩活塞內面起初都在 y 355；第 4 步大活塞上升 5 px、小活塞下降 50 px（體積守恆：20 × 50 ＝ 200 × 5），只升一點點。
   比例尺（整支固定）：
     力（青，M3.force）2.4 px／kgw：10 kgw ＝ 24 px、100 kgw ＝ 240 px（F大 箭頭每 10 kgw 一道刻痕 → 剛好 10 段）。
     壓力（珊瑚，M4.pArrow）0.1 px／(gw/cm²)：500 gw/cm² ＝ 50 px（三處等長）。
   版面：步驟標題 KEY_Y 62；P 公式 pill (700,108)；第 4 步比例式在右欄 x 790（y 190／250／310）；字卡 BOT_Y 505；標籤 22px、標題／公式／字卡 24px。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.jack) return;

  const COL = W5.COL, lerp = W5.lerp;
  const L = M4.L, T = M4.T, P = M4.P, fin = M4.fin, fout = M4.fout, grow = M4.grow, since = M4.since;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PUSH = M4.PC.force, PR = M4.PC.pressure, WT = M4.PC.weight;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */

  /* ── 場景 ── */
  const MOUTH = 410, FLOOR = 462, WALL = 8;
  const SX = 150, SW = 46, BX = 440, BW = SW * Math.sqrt(10);
  const POS0 = 55, RISE = 5, DROP = RISE * 10;                /* 活塞內面 y ＝ MOUTH − pos */
  const SM = { x: SX, w: SW, len: 80, th: 14, rod: 70, handle: 60 };
  const BG = { x: BX, w: BW, len: 85, th: 20, rod: 17, handle: 156 };
  const CRATE_W = 112, CRATE_H = 92;
  const FK = 2.4, F_S = 10, F_B = 100;                        /* 力：px／kgw */
  const PK = 0.1, PRESS = 500, PLEN = PRESS * PK;             /* 壓力：px／(gw/cm²) */
  const CHX = 262;                                            /* 連通管裡那支壓力箭頭的 x */
  const BPX = BX - 40;                                        /* 大活塞底面壓力箭頭 x（避開 F大 箭頭） */
  const FORM_X = 700, FORM_Y = M3.Q_Y, COL_X = 790;

  /* ── 狀態（純函式） ── */
  const sceneA = s => (s.n === 1 ? fin(s, 1, 0.2, 1.0) : 1);
  const lift = s => grow(s, 4, 2.6, 4.8);                     /* 第 4 步 0..1 */
  const sPos = s => POS0 - DROP * lift(s);
  const bPos = s => POS0 + RISE * lift(s);

  /* ═══════════ 千斤頂本體＋重物 ═══════════ */
  function body(c, s, a) {
    const r = M4.jack(c, {
      mouth: MOUTH, floor: FLOOR, wall: WALL, a,
      s: Object.assign({ pos: sPos(s) }, SM), b: Object.assign({ pos: bPos(s) }, BG)
    });
    /* 重物（木箱）放在大活塞平台上：第 1 步 1.0 秒起由上方 30 px 放下來 */
    const ca = s.n === 1 ? fin(s, 1, 1.0, 0.6) : 1;
    const drop = 30 * (1 - grow(s, 1, 1.0, 1.8));
    const by = r.b.out[1] - drop;
    M3.crate(c, BX, by, CRATE_W, CRATE_H, { a: ca, seed: 31 });
    M3.P(c, fin(s, 1, 3.0, 0.5), '100 kgw', BX + CRATE_W / 2 + 12, by - CRATE_H / 2, WT, 22, 'left');
    /* 面積標籤 */
    T(c, fin(s, 1, 2.0, 0.5), L('A小 ＝ 20 cm²', 'A₁ = 20 cm²'), SX + SW / 2 + 18, 345, WHITE, 22, 'left');
    T(c, fin(s, 1, 2.5, 0.5), L('A大 ＝ 200 cm²', 'A₂ = 200 cm²'), BX + BW / 2 + 18, 345, WHITE, 22, 'left');
    return r;
  }

  /* 第 2 步起：手壓小活塞＋F小 */
  function handAndPush(c, s, r) {
    const palm = r.s.out[1];
    const ha = s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 0.2, 0.6) : 1;
    const gap = 40 * (1 - grow(s, 2, 0.6, 1.6));
    M4.hand(c, SX, palm - gap, { dir: 'left', armTop: 32, a: ha });
    const fg = grow(s, 2, 1.6, 2.4);
    if (fg > 0.005) M3.forceInto(c, { x: SX, y: palm, dir: 'down', val: F_S, k: FK, col: PUSH, grow: fg, lw: 7,
      text: L('F小 ＝ 10 kgw', 'F₁ = 10 kgw'), lab: 'right', la: fin(s, 2, 2.2, 0.5), dx: 18, dy: -14 });
  }

  /* 第 2 步：壓力從小活塞底面一圈一圈往外傳（只在液體裡） */
  function waves(c, s, r) {
    if (s.n !== 2) return;
    M4.pWaves(c, SX, MOUTH - sPos(s), since(s, 2, 2.6), { clip: r.clip, dur: 4.0, gap: 0.55, speed: 170, rMax: 480,
      ang: [-0.7, Math.PI * 0.5 + 0.4], n: 9, len: 18, a: fout(s, 2, 9.4, 0.8) });
  }

  /* 第 3 步起：三處等長的壓力箭頭（500 gw/cm² ＝ 50 px）＋「500」 */
  function pressureArrows(c, s) {
    const dim = s.n === 4 ? lerp(1, 0.5, fin(s, 4, 0.3, 0.6)) : 1;
    const fyS = MOUTH - sPos(s), fyB = MOUTH - bPos(s);
    const g1 = grow(s, 3, 0.6, 1.4), g2 = grow(s, 3, 1.6, 2.4), g3 = grow(s, 3, 2.6, 3.4);
    /* 小活塞 → 水：尖端朝下（被壓的是活塞下面的水） */
    if (g1 > 0.01) M4.pArrow(c, SX, fyS + PLEN * g1, PLEN * g1, { dir: 'down', lw: 6, a: dim });
    /* 管內：水壓在管底，尖端朝下 */
    if (g2 > 0.01) M4.pArrow(c, CHX, FLOOR, PLEN * g2, { dir: 'down', lw: 6, a: dim });
    /* 水 → 大活塞：尖端在大活塞底面、朝上 */
    if (g3 > 0.01) M4.pArrow(c, BPX, fyB, PLEN * g3, { dir: 'up', lw: 6, a: dim });
    const pa = k => fin(s, 3, k, 0.4) * dim;
    M4.pPill(c, pa(1.5), '500', SX - SW / 2 - 16, fyS + PLEN / 2, 22, 'right');
    M4.pPill(c, pa(2.5), '500', CHX + 14, (MOUTH + FLOOR) / 2, 22, 'left');
    M4.pPill(c, pa(3.5), '500', BPX + 14, fyB + PLEN / 2, 22, 'left');
  }

  /* 第 4 步：F大（青，240 px，每 10 kgw 一道刻痕）由大活塞底面往上 */
  function bigForce(c, s) {
    const g = grow(s, 4, 0.8, 2.4); if (g <= 0.005) return;
    const fy = MOUTH - bPos(s);
    const r = M3.force(c, { x: BX, y: fy, dir: 'up', val: F_B, k: FK, col: PUSH, grow: g, lw: 7, tick: 10, lab: null });
    M3.P(c, fin(s, 4, 2.3, 0.5), L('F大 ＝ 100 kgw', 'F₂ = 100 kgw'), BX - 18, r.y1 + 26, PUSH, 22, 'right');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('兩個活塞', 'Two pistons'),
    () => L('左邊壓 10 kgw', 'Push 10 kgw on the left'),
    () => L('壓力處處相等', 'Equal pressure everywhere'),
    () => L('右邊舉起 100 kgw', 'Lift 100 kgw on the right')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    /* 第 1 步：說明 */
    T(c, fin(s, 1, 3.6, 0.6) * fout(s, 2, 0, 0.5), L('下方相通、裝滿水', 'Joined at the bottom, full of water'), FORM_X, FORM_Y, WHITE, 24);
    /* 第 2 步起：P 公式＋單位換算 */
    const fa = fin(s, 2, 4.2, 0.6);
    if (fa > 0.02) W5.glow(c, FORM_X, FORM_Y, 180, PR, 0.08 * fa);
    M4.pPill(c, fa, 'P ＝ 10000 ÷ 20 ＝ 500 gw/cm²', FORM_X, FORM_Y, 24);
    T(c, fin(s, 2, 2.8, 0.5) * fout(s, 4, 0.3, 0.5), '1 kgw ＝ 1000 gw', FORM_X, FORM_Y + 44, DIM, 22);
    /* 第 3 步：字卡 */
    M3.caption(c, fin(s, 3, 4.4, 0.6) * fout(s, 4, 0, 0.4), L('壓力處處相等：都是 500 gw/cm²', 'Same pressure everywhere: 500 gw/cm²'), YEL, 480, M3.BOT_Y, 24);
    /* 第 4 步：比例式＋字卡 */
    P(c, fin(s, 4, 5.2, 0.5), L('F小 ÷ A小 ＝ F大 ÷ A大', 'F₁ ÷ A₁ = F₂ ÷ A₂'), COL_X, 190, YEL, 24);
    P(c, fin(s, 4, 6.2, 0.5), L('10 ÷ 20 ＝ F大 ÷ 200', '10 ÷ 20 = F₂ ÷ 200'), COL_X, 250, YEL, 24);
    P(c, fin(s, 4, 7.2, 0.5), L('→ F大 ＝ 100 kgw', '→ F₂ = 100 kgw'), COL_X, 310, YEL, 24);
    M3.caption(c, fin(s, 4, 8.2, 0.6), L('面積 10 倍 → 力 10 倍', '10× the area → 10× the force'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a = sceneA(s);
    M3.backdrop(c, { gy: 532, cell: 40 });
    const r = body(c, s, a);
    waves(c, s, r);
    pressureArrows(c, s);
    bigForce(c, s);
    handAndPush(c, s, r);
    texts(c, s);
  }

  W5.register('jack', { canvas: 'cvs-jack', steps: DUR, draw });
})();
