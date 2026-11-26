/* ==================================================================
   mechanics_4 ｜ 帕斯卡原理：以小搏大，但不省功（cvs-work，960×540）
   四步：1 小活塞下壓 10 cm → 2 排開 200 cm³ → 3 大活塞只升 1 cm → 4 力 × 距離
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （沿用 M4.jack／M4.hand／M4.zoomLeader；M4.cmRuler、M4.slug 由本檔新增）。

   數字（照簡報，不可改；延續 jack）：A小 ＝ 20 cm²、A大 ＝ 200 cm²；F小 ＝ 10 kgw、F大 ＝ 100 kgw。
     小活塞下壓 10 cm → 排開 20 × 10 ＝ 200 cm³ → 大活塞上升 200 ÷ 200 ＝ 1 cm。
     力 × 距離：10 kgw × 10 cm ＝ 100、100 kgw × 1 cm ＝ 100（kgw·cm）→ 不省功。
   場景：與 jack 完全同一套座標（筒口 MOUTH 410、管內底 FLOOR 462；小筒 SX 150 內寬 46、大筒 BX 440 內寬 46×√10）。
   長度比例尺（整支固定，兩邊共用）：1 cm ＝ 5 px（＝ jack 的 DROP 50／RISE 5）。
     小活塞內面 y 355 → 405（下 50 px ＝ 10 cm）；大活塞內面 y 355 → 350（上 5 px ＝ 1 cm），同時發生（水不可壓縮）。
     兩支行程尺（M4.cmRuler）同為 10 cm ＝ 50 px，刻度 1 cm ＝ 5 px；1 cm 太小，第 3 步用放大鏡（×5，畫面重畫放大）。
   水量守恆：剖面寬度是直徑（面積比 1：10 → 直徑比 1：√10），排開的那段水用 M4.slug 畫成圓柱：
     46² × 50 ＝ 145.5² × 5（∝ 體積），兩段亮藍圓柱一高一扁、體積相同。
   版面：步驟標題 KEY_Y 62；第 2、3 步算式 pill 在右欄 (750,120)／(750,172)；放大鏡 (750,300) r 88；
     第 4 步兩個算式 pill 並排在 y 150（中心 x 300／690，中間「＝」在 495）；字卡 BOT_Y 505；
     標籤 22px、標題／算式／字卡 24px。畫布頂端 0～31px 留給 kit 的進度條，內容一律在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.jack || !M4.cmRuler) return;

  const COL = W5.COL, lerp = W5.lerp, clamp01 = W5.clamp01, ease = W5.ease;
  const L = M4.L, T = M4.T, P = M4.P, fin = M4.fin, fout = M4.fout, grow = M4.grow, since = M4.since;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, WT = M4.PC.weight;
  const HI = '#9fe3ff';                                       /* 被標亮的那份水 */
  const DUR = [11, 11, 11, 12];                               /* 總長 45 秒 */

  /* ── 場景（同 jack） ── */
  const MOUTH = 410, FLOOR = 462, WALL = 8;
  const SX = 150, SW = 46, BX = 440, BW = SW * Math.sqrt(10);
  const K = 5;                                                /* 長度：px／cm（兩邊共用） */
  const POS0 = 55, DROP = 10 * K, RISE = 1 * K;               /* 活塞內面 y ＝ MOUTH − pos */
  const FACE0 = MOUTH - POS0;                                 /* 兩活塞起點 y 355 */
  const SM = { x: SX, w: SW, len: 80, th: 14, rod: 70, handle: 60 };
  const BG = { x: BX, w: BW, len: 85, th: 20, rod: 17, handle: 156 };
  const CRATE_W = 112, CRATE_H = 92;
  /* 行程尺：貼在筒外壁右側 */
  const RS = SX + SW / 2 + 6 + 3 + 8 + 7, RB = BX + BW / 2 + 6 + 3 + 8 + 7;
  /* 放大鏡 */
  const ZX = BX + 50, ZY = FACE0 - 3, ZK = 5, LX = 750, LY = 300, LR = 88;
  const COL_X = 750;

  /* ── 狀態（純函式） ── */
  const sceneA = s => (s.n === 1 ? fin(s, 1, 0.2, 1.0) : 1);
  const press = s => grow(s, 1, 3.2, 6.8);                    /* 第 1 步 0..1：兩邊同時動 */
  const sPos = s => POS0 - DROP * press(s);
  const bPos = s => POS0 + RISE * press(s);
  const sFace = s => MOUTH - sPos(s), bFace = s => MOUTH - bPos(s);
  const packet = s => grow(s, 2, 4.2, 8.4);                   /* 第 2 步：那份水沿管流到右邊 */

  /* ═══════════ 千斤頂本體＋重物 ═══════════ */
  function body(c, s, a) {
    const r = M4.jack(c, {
      mouth: MOUTH, floor: FLOOR, wall: WALL, a,
      s: Object.assign({ pos: sPos(s) }, SM), b: Object.assign({ pos: bPos(s) }, BG)
    });
    M3.crate(c, BX, r.b.out[1], CRATE_W, CRATE_H, { a, seed: 31 });
    return r;
  }
  function bodyLabels(c, s, r) {
    /* 放在木箱左邊（右邊要讓給放大鏡的引線） */
    M3.P(c, fin(s, 1, 1.2, 0.5), '100 kgw', BX - CRATE_W / 2 - 12, r.b.out[1] - CRATE_H / 2, WT, 22, 'right');
    T(c, fin(s, 1, 1.4, 0.5), L('A小 ＝ 20 cm²', 'A₁ = 20 cm²'), SX + SW / 2 + 18, 300, WHITE, 22, 'left');
    T(c, fin(s, 1, 1.8, 0.5), L('A大 ＝ 200 cm²', 'A₂ = 200 cm²'), BX + BW / 2 + 18, 394, WHITE, 22, 'left');
  }
  function hand(c, s, r) {
    M4.hand(c, SX, r.s.out[1], { dir: 'left', armTop: 32, a: fin(s, 1, 0.4, 0.6) });
  }

  /* ═══════════ 行程尺（同一比例尺：10 cm ＝ 50 px） ═══════════ */
  function startLine(c, a, x0, x1) {
    if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, FACE0); c.lineTo(x1, FACE0); c.stroke(); c.restore();
    });
  }
  function faceMark(c, a, x0, x1, y) {
    if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
    });
  }
  function rulers(c, s) {
    /* 左：小活塞（第 1 步起） */
    const ra = fin(s, 1, 2.0, 0.6), hl = s.n === 4 ? fin(s, 4, 0.8, 0.5) : 0;
    M4.cmRuler(c, RS, FACE0, K, 10, { a: ra, hi: [0, 10 * press(s)], hiA: hl });
    startLine(c, fin(s, 1, 2.3, 0.5), SX - SW / 2 - 6, RS + 7);
    faceMark(c, ra, SX + SW / 2 + 6, RS - 7, sFace(s));
    const g = press(s);
    if (g > 0.02) M3.dashArrow(c, RS + 16, FACE0 - 2, RS + 16, sFace(s) + 2, WHITE, ra, s.t * 18, { lw: 3, head: 11, dash: [6, 5] });
    T(c, fin(s, 1, 7.0, 0.5), L('向下 10 cm', 'down 10 cm'), RS + 28, (FACE0 + MOUTH - POS0 + DROP) / 2, WHITE, 22, 'left');
    /* 右：大活塞（第 3 步起；同一支尺、同一比例） */
    const rb = fin(s, 3, 1.4, 0.6);
    M4.cmRuler(c, RB, FACE0, K, 10, { a: rb, dir: 'up', hi: [0, 1], hiA: hl });
    startLine(c, fin(s, 3, 1.7, 0.5), BX - BW / 2 - 6, RB + 7);
    faceMark(c, rb, BX + BW / 2 + 6, RB - 7, bFace(s));
    T(c, fin(s, 4, 0.8, 0.5), L('上升 1 cm', 'up 1 cm'), RB + 14, FACE0 - 28, WHITE, 22, 'left');
  }

  /* ═══════════ 第 2 步：活塞走過的空間＝被擠走的水（200 cm³） ═══════════ */
  function ghostFill(c, s) {
    /* 先畫（在活塞與桿的後面） */
    const a = ghostA(s); if (a <= 0.02) return;
    M4.slug(c, SX, FACE0, MOUTH - POS0 + DROP, SW, { a, dash: false, fillA: 0.6, glow: s.n === 2 ? pulse(s) : 0 });
  }
  function ghostLine(c, s) {
    const a = ghostA(s); if (a <= 0.02) return;
    M4.slug(c, SX, FACE0, MOUTH - POS0 + DROP, SW, { a, fillA: 0, phase: s.t * 12 });
    T(c, fin(s, 2, 1.6, 0.5) * labA(s), '200 cm³', SX - SW / 2 - 14, 380, HI, 22, 'right');
  }
  const ghostA = s => (s.n < 2 ? 0 : fin(s, 2, 0.6, 0.8) * (s.n === 2 ? lerp(1, 0.75, fin(s, 2, 4.2, 0.8)) : s.n === 3 ? 0.75 : lerp(0.75, 0.6, fin(s, 4, 0, 0.6))));
  const labA = s => (s.n === 4 ? fout(s, 4, 0, 0.6) : 1);
  const pulse = s => 0.6 + 0.4 * Math.sin(Math.max(0, since(s, 2, 0.6)) * 3.2);

  /* 那份水沿連通管流到大筒底下（只在液體裡發亮） */
  function flow(c, s, r) {
    let a, px, py;
    if (s.n === 2) {
      const g = packet(s); if (g <= 0) return;
      a = fin(s, 2, 4.2, 0.4);
      /* 路徑：小筒底 (SX, 436) → 管中 → 大筒中線 (BX, 436) → 上到大活塞下方 (BX, 372) */
      const L1 = BX - SX, L2 = 436 - 372, d = ease(g) * (L1 + L2);
      if (d <= L1) { px = SX + d; py = 436; } else { px = BX; py = 436 - (d - L1); }
    } else if (s.n === 3) {
      a = fout(s, 3, 0.2, 1.0); px = BX; py = 372;
    } else return;
    if (a <= 0.02) return;
    c.save(); c.beginPath(); r.clip(c); c.clip();
    M3.withA(c, a, () => {
      W5.glow(c, px, py, 46, '#5cc8ff', 0.75);
      /* 流向 ›››（跟在亮團前面、在管裡） */
      if (s.n === 2 && py >= 435.5) {
        c.strokeStyle = W5.rgba(HI, 0.9); c.lineWidth = 3; c.lineJoin = 'round'; c.lineCap = 'round';
        for (let i = 1; i <= 3; i++) {
          const x = px + 18 + i * 20; if (x > BX - 10) continue;
          c.beginPath(); c.moveTo(x - 6, 428); c.lineTo(x + 2, 436); c.lineTo(x - 6, 444); c.stroke();
        }
      }
    });
    c.restore();
  }

  /* ═══════════ 第 3 步：同樣 200 cm³ 攤在大活塞下：只有 1 cm ═══════════ */
  const layerA = s => (s.n < 3 ? 0 : s.n === 3 ? fin(s, 3, 0.4, 1.0) : lerp(1, 0.7, fin(s, 4, 0, 0.6)));
  function layer(c, s, a) {
    if (a <= 0.02) return;
    /* 上緣被大活塞蓋住 → 只畫下緣前半弧（扁圓餅） */
    M4.slug(c, BX, bFace(s), FACE0, BW, { a, top: false, fillA: 0.55, phase: s.t * 12, glow: s.n === 3 ? 0.6 : 0 });
  }

  /* 放大鏡：把大活塞右下角那一小塊（含筒壁、行程尺）放大 5 倍重畫 */
  function lens(c, s, r) {
    const a = fin(s, 3, 2.6, 0.7) * (s.n === 4 ? fout(s, 4, 0, 0.6) : 1);
    if (a <= 0.02) return;
    M4.zoomLeader(c, ZX, ZY, LX, LY, LR + 10, { a: a * 0.9, mark: 16 });
    M3.magnifier(c, LX, LY, LR, { a, handleA: 0, inner: cc => {
      cc.fillStyle = 'rgba(13,32,26,0.96)'; cc.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      cc.save(); cc.translate(LX, LY); cc.scale(ZK, ZK); cc.translate(-ZX, -ZY);
      M4.jack(cc, { mouth: MOUTH, floor: FLOOR, wall: WALL, s: Object.assign({ pos: sPos(s) }, SM), b: Object.assign({ pos: bPos(s) }, BG) });
      layer(cc, s, 1);
      startLine(cc, 1, BX - BW / 2 - 6, RB + 7);
      cc.restore();
      /* 鏡片右側：同一支行程尺放大 5 倍後的樣子（1 cm ＝ 25 px，與鏡中活塞同高對齊），0～1 cm 塗黃 */
      const y0 = LY + (FACE0 - ZY) * ZK, step = K * ZK, rx = LX + 46, rw = 22;
      cc.save();
      cc.fillStyle = 'rgba(13,32,26,0.75)'; cc.fillRect(rx - rw / 2 - 6, LY - LR, rw + 40, 2 * LR);
      cc.fillStyle = 'rgba(246,243,234,0.16)'; cc.fillRect(rx - rw / 2, LY - LR, rw, 2 * LR);
      cc.fillStyle = W5.rgba(YEL, 0.6); cc.fillRect(rx - rw / 2, y0 - step, rw, step);
      cc.strokeStyle = 'rgba(246,243,234,0.85)'; cc.lineWidth = 2;
      cc.beginPath(); cc.moveTo(rx - rw / 2, LY - LR); cc.lineTo(rx - rw / 2, LY + LR); cc.moveTo(rx + rw / 2, LY - LR); cc.lineTo(rx + rw / 2, LY + LR); cc.stroke();
      for (let d = -4; d <= 4; d++) { const y = y0 - d * step; cc.lineWidth = d === 0 ? 3 : 2; cc.beginPath(); cc.moveTo(rx - rw / 2, y); cc.lineTo(rx + (d === 0 ? rw / 2 : 0), y); cc.stroke(); }
      /* 1 cm 括號 */
      const bx = rx + rw / 2 + 8;
      cc.strokeStyle = YEL; cc.lineWidth = 3; cc.lineCap = 'round';
      cc.beginPath(); cc.moveTo(bx - 4, y0); cc.lineTo(bx + 4, y0); cc.lineTo(bx + 4, y0 - step); cc.lineTo(bx - 4, y0 - step); cc.stroke();
      cc.restore();
    } });
    T(c, fin(s, 3, 3.0, 0.5) * (s.n === 4 ? fout(s, 4, 0, 0.6) : 1), L('放大 5 倍', '5× zoom'), LX + 20, LY + LR + 46, DIM, 22, 'left');
    M3.P(c, fin(s, 3, 4.2, 0.5) * (s.n === 4 ? fout(s, 4, 0, 0.6) : 1), L('上升 1 cm', 'up 1 cm'), LX, LY + LR + 46, YEL, 22, 'right');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('小活塞下壓 10 cm', 'Push the small piston down 10 cm'),
    () => L('排開 200 cm³ 的水', '200 cm³ of water moves over'),
    () => L('大活塞只升 1 cm', 'The big piston rises only 1 cm'),
    () => L('力 × 距離', 'Force × distance')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    const o4 = s.n === 4 ? fout(s, 4, 0, 0.6) : 1;
    /* 第 2 步：體積 */
    P(c, fin(s, 2, 2.6, 0.5) * o4, L('20 × 10 ＝ 200 cm³', '20 × 10 = 200 cm³'), COL_X, 120, YEL, 24);
    M3.caption(c, fin(s, 2, 8.6, 0.6) * fout(s, 3, 0, 0.4), L('活塞走過的空間 ＝ 被擠走的水', 'Space the piston sweeps = water pushed out'), YEL, 480, M3.BOT_Y, 24);
    /* 第 3 步：高度 */
    P(c, fin(s, 3, 5.4, 0.5) * o4, L('200 ÷ 200 ＝ 1 cm', '200 ÷ 200 = 1 cm'), COL_X, 172, YEL, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * o4, L('同樣 200 cm³，攤在 10 倍大的底面上', 'Same 200 cm³, spread over 10× the area'), YEL, 480, M3.BOT_Y, 24);
    /* 第 4 步：力 × 距離 並排 */
    const X1 = 300, X2 = 690, XE = 495, Y = 150;
    T(c, fin(s, 4, 1.4, 0.5), L('小活塞', 'Small piston'), X1, M3.Q_Y - 6, DIM, 22);
    P(c, fin(s, 4, 1.8, 0.5), '10 kgw × 10 cm ＝ 100', X1, Y, YEL, 24);
    T(c, fin(s, 4, 3.2, 0.5), L('大活塞', 'Big piston'), X2, M3.Q_Y - 6, DIM, 22);
    P(c, fin(s, 4, 3.6, 0.5), '100 kgw × 1 cm ＝ 100', X2, Y, YEL, 24);
    T(c, fin(s, 4, 5.0, 0.5), '＝', XE, Y, YEL, 34);
    T(c, fin(s, 4, 5.8, 0.5), L('（單位 kgw·cm）', '(unit: kgw·cm)'), XE, Y + 44, DIM, 22);
    M3.caption(c, fin(s, 4, 7.2, 0.6), L('力大 10 倍、距離小 10 倍 → 沒有省功', '10× the force, 1/10 the distance → no work saved'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a = sceneA(s);
    M3.backdrop(c, { gy: 532, cell: 40 });
    ghostFill(c, s);
    const r = body(c, s, a);
    flow(c, s, r);
    layer(c, s, layerA(s));
    ghostLine(c, s);
    rulers(c, s);
    bodyLabels(c, s, r);
    hand(c, s, r);
    lens(c, s, r);
    texts(c, s);
  }

  W5.register('work', { canvas: 'cvs-work', steps: DUR, draw });
})();
