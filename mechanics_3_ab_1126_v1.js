/* ==================================================================
   mechanics_3 ｜ 資優補充：A、B 疊放（cvs-ab，960×540）
   四步：1 先看 A → 2 反作用力 → 3 再看 B → 4 B 的彈簧讀數
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   版面（上下兩層，中線都對齊 x＝480）：
   ・下層「場景」：地面線 GY＝455。B（大木塊）放地上、A（小木塊）疊在 B 上；
     A 右邊一支彈簧秤連到右牆（讀數 50 gw，讀數寫在秤下方），B 左邊一支彈簧秤連到左牆（第 1～3 步讀數「?」、刻度蓋住；第 4 步揭曉 400 gw）。
   ・上層「受力圖」（y 115～300）：A、B 兩個白框木塊上下分開畫（拆開看），所有力都畫在這裡：
       A：彈簧拉力（青 →，A 右面）、B 給 A 的摩擦力（珊瑚 ←，A 底面下方）。
       B：A 給 B 的摩擦力（珊瑚 →，B 頂面上方）、地面給 B 的摩擦力（珊瑚 →，B 底面下方）、彈簧拉力 F（青 ←，B 左面）。
     第 2 步：A 底面的力「翻轉」落到 B 頂面，再用黃色虛線＋雙向弧箭頭（M3.pairArc）配成一對。
     第 3 步：B 的兩個向右摩擦力滑到 B 右面、首尾相接（M3.segArrow），大括號標 50 ＋ 350 ＝ 400 gw。
     第 4 步：F 從 B 左面往左長到 400 gw；右邊總長的虛線框鏡像到左邊，和 F 一樣長。
   比例尺：K＝0.85 px／gw（400 gw＝340 px），整支不變；背景方格 1 格＝42.5 px＝50 gw（格線對齊受力圖 B 的左右面）；力箭頭每 50 gw 一道刻痕。
   數字（照簡報）：A 的彈簧 50 gw → B 給 A 向左 50 gw → A 給 B 向右 50 gw；地面給 B 向右 350 gw；F ＝ 50 ＋ 350 ＝ 400 gw。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.fbdBox || !M3.pairArc) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, YEL = COL.yellow;
  const FR = M3.FC.friction, PULL = M3.FC.push;
  const DUR = [11, 11, 12, 12];      /* 總長 46 秒 */

  const K = 0.85, CELL = 42.5, TICK = 50, U = 'gw';   /* 0.85 px／gw；1 格＝50 gw */
  const GY = M3.GY;

  /* ── 場景 ── */
  const SX = 480;
  const SB = { w: 240, h: 80 }, SA = { w: 130, h: 52 };
  const SB_TOP = GY - SB.h, SA_TOP = SB_TOP - SA.h;        /* 375、323 */
  const WALL_L = 70, WALL_R = 890, WALL_TOP = 300;
  const SPR_A_Y = SA_TOP + SA.h / 2, SPR_B_Y = SB_TOP + 40; /* 349、415 */

  /* ── 受力圖 ── */
  const FX = 480;
  const FA = { cy: 140, w: 110, h: 50 }, FB = { cy: 252, w: 170, h: 54 };   /* FB 寬 170＝4 格 */
  const FA_X1 = FX + FA.w / 2, FB_X0 = FX - FB.w / 2, FB_X1 = FX + FB.w / 2;
  const FRA_Y = FA.cy + FA.h / 2 + 12;     /* 177：B 給 A（A 底面下方） */
  const FRB_Y = FB.cy - FB.h / 2 - 12;     /* 213：A 給 B（B 頂面上方） */
  const GND_Y = FB.cy + FB.h / 2 + 12;     /* 291：地面給 B（B 底面下方） */

  M3.preload(['thinking', 'victory']);

  function backdrop(c) {
    M3.backdrop(c, { gy: GY, cell: CELL, ox: FB_X1, oy: GY, glow: COL.teal, gx: 480, gyGlow: 240 });
    M3.ground(c, GY);
  }

  /* ═══════════ 下層：場景 ═══════════ */
  /* o：{ aA, aB 兩塊的亮度, cAB A–B 接觸面強調, cG B–地面接觸面強調, Fb B 的彈簧讀數（null＝未知）, cover 刻度遮罩, tensB B 彈簧拉緊發光, hiA A 讀數發光 } */
  function scene(c, s, o) {
    M3.wall(c, WALL_L, WALL_TOP, GY, 'left', { w: 45 });
    M3.wall(c, WALL_R, WALL_TOP, GY, 'right', { w: 45 });

    /* B 與它的彈簧（往左拉） */
    withA(c, o.aB, () => {
      if (o.tensB > 0.02) W5.glow(c, (WALL_L + SX - SB.w / 2) / 2, SPR_B_Y, 150, PULL, 0.22 * o.tensB);
      M3.block(c, SX, GY, SB.w, SB.h, { mat: 'wood', seed: 11, contact: o.cG, contactCol: FR });
      T(c, 1, 'B', SX, SB_TOP + 44, M3.INK, 30);
    });
    const known = o.Fb != null;
    const sb = M3.springScale(c, {
      x0: SX - SB.w / 2, x1: WALL_L, y: SPR_B_Y, val: known ? o.Fb : 0, max: 500, a: o.aB,
      readText: known ? Math.round(o.Fb) + ' gw' : '?', col: known ? PULL : WHITE
    });
    /* 讀數未知：刻度窗蓋一片霧面（第 4 步掀開） */
    if (o.cover > 0.02) withA(c, o.cover, () => {
      const x0 = WALL_L + 22 + 6, w = 138;
      c.fillStyle = W5.mix('#1f3a33', '#3e5056', clamp01((o.aB - 0.3) / 0.7)); W5.rr(c, x0, SPR_B_Y - 13, w, 26, 7); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.5; c.setLineDash([6, 5]); W5.rr(c, x0, SPR_B_Y - 13, w, 26, 7); c.stroke(); c.setLineDash([]);
    });
    void sb;

    /* A 與它的彈簧（往右拉，讀數寫在秤下方） */
    withA(c, o.aA, () => {
      M3.block(c, SX, SB_TOP, SA.w, SA.h, { mat: 'lightwood', seed: 3, shadow: false, contact: o.cAB, contactCol: FR });
      T(c, 1, 'A', SX, SA_TOP + 27, M3.INK, 28);
    });
    const ra = M3.springScale(c, { x0: SX + SA.w / 2, x1: WALL_R, y: SPR_A_Y, val: 50, max: 500, a: o.aA, readDy: -44, col: o.hiA > 0.5 ? PULL : WHITE });
    if (ra.read && o.hiA > 0.02) W5.glow(c, ra.read.x + ra.read.w / 2, ra.read.y + ra.read.h / 2, 60, PULL, 0.3 * o.hiA * o.aA);
  }

  /* ═══════════ 上層：受力圖 ═══════════ */
  /* A 的受力。o：{ a, box, sp 彈簧拉力長出, q 問號, fr 摩擦力長出, lab 標籤透明度, pulse 強調 } */
  function fbdA(c, s, o) {
    const a = o.a;
    if (a <= 0.02) return;
    M3.fbdBox(c, FX, FA.cy, FA.w, FA.h, { kind: 'block', a: a * o.box, label: 'A', size: 24 });
    if (o.box < 0.5) return;
    M3.force(c, { x: FA_X1, y: FA.cy, dir: 'right', val: 50, k: K, tick: TICK, col: PULL, grow: o.sp, a, la: o.lab * clamp01((o.sp - 0.85) / 0.15),
      name: L('彈簧拉力', 'Spring'), unit: U, lab: 'tip' });
    if (o.q > 0.02) M3.forceQ(c, { x: FX, y: FRA_Y, dir: 'left', len: 46, col: FR, a: a * o.q, phase: s.u * 24, pulse: Math.sin(s.u * 3.4),
      text: '?', lab: 'left', dx: -6 });
    if (o.pulse > 0.02) W5.glow(c, FX - 21, FRA_Y, 46, FR, 0.35 * o.pulse * a);
    M3.force(c, { x: FX, y: FRA_Y, dir: 'left', val: 50, k: K, tick: TICK, col: FR, grow: o.fr, a, la: o.lab * clamp01((o.fr - 0.85) / 0.15),
      text: L('B 給 A：向左 50 gw', 'B on A: 50 gw left'), lab: 'left' });
  }

  /* 第 2 步：A 底面的力翻轉落到 B 頂面（虛線鬼影），t 0..1 */
  function flipGhost(c, s, t, a) {
    if (a <= 0.02) return;
    const h = 50 * K / 2, te = ease(t);
    const cx = lerp(FX - h, FX + h, te), cy = lerp(FRA_Y, FRB_Y, te), th = Math.PI * (1 - te);
    const dx = Math.cos(th) * h, dy = -Math.sin(th) * h * 1.6;
    M3.dashArrow(c, cx - dx, cy - dy, cx + dx, cy + dy, FR, a, s.u * 22, { lw: 5, head: 14, dash: [8, 6] });
  }

  function draw(c, s) {
    const n = s.n, u = s.u;
    backdrop(c);

    /* ── 亮度：第 1 步 A 亮、B 淡；第 2 步兩個都亮；第 3、4 步 B 亮、A 淡 ── */
    const DIM = 0.32;
    const sA = n <= 2 ? 1 : lerp(1, DIM, fin(s, 3, 0.2, 0.8));
    const sB = n === 1 ? lerp(1, DIM, fin(s, 1, 0.4, 0.8)) : n === 2 ? lerp(DIM, 1, fin(s, 2, 0.2, 0.8)) : 1;

    /* ── 第 4 步：F 長出、讀數計數 ── */
    const F = n === 4 ? 400 * ease(seg(u, 3.0, 5.4)) : 0;

    scene(c, s, {
      aA: sA, aB: sB,
      cAB: n === 1 ? 0.9 * fin(s, 1, 6.0, 0.5) : n === 2 ? 0.9 : 0.9 * fout(s, 3, 0.2, 0.8),
      cG: n === 3 ? 0.9 * fin(s, 3, 1.0, 0.5) : n === 4 ? 0.5 : 0,
      Fb: n === 4 && u > 3.0 ? F : null,
      cover: n < 4 ? 1 : fout(s, 4, 2.6, 0.4),
      tensB: n === 4 ? fin(s, 4, 0.6, 0.6) * (0.75 + 0.25 * Math.sin(u * 4)) : 0,
      hiA: n === 1 ? fin(s, 1, 1.6, 0.4) * fout(s, 1, 4.0, 0.6) : 0
    });

    /* ── 受力圖：A ── */
    const labA = n <= 2 ? 1 : fout(s, 3, 0.2, 0.6);
    fbdA(c, s, {
      a: sA, box: fin(s, 1, 1.0, 0.5),
      sp: grow(s, 1, 2.0, 3.0),
      q: n === 1 ? fin(s, 1, 4.6, 0.4) * fout(s, 1, 6.0, 0.3) : 0,
      fr: grow(s, 1, 6.0, 7.0),
      lab: labA,
      pulse: n === 2 ? fin(s, 2, 1.0, 0.3) * fout(s, 2, 2.6, 0.4) + (u > 6.2 ? 0.6 + 0.4 * Math.sin(u * 5) : 0) * fout(s, 2, 9.4, 0.5) : 0
    });

    /* ── 受力圖：B ── */
    const boxB = fin(s, 2, 0.6, 0.5);
    M3.fbdBox(c, FX, FB.cy, FB.w, FB.h, { kind: 'block', a: boxB, label: 'B', size: 24, glow: n === 4 && u > 7.6 ? YEL : null });

    /* 第 2 步：鬼影翻轉 → A 給 B 的力長出 → 虛線＋雙向弧配對 */
    if (n === 2) flipGhost(c, s, seg(u, 1.4, 2.6), fin(s, 2, 1.2, 0.3) * fout(s, 2, 2.6, 0.3));
    const slide = grow(s, 3, 3.0, 4.6);              /* 第 3 步：兩支向右的摩擦力滑去接起來 */
    const frB = grow(s, 2, 2.5, 3.3);
    const pairA = n === 2 ? fin(s, 2, 3.8, 0.5) : n === 3 ? fout(s, 3, 0.2, 0.6) : 0;
    const joined = n >= 4 || (n === 3 && u >= 4.6);
    if (pairA > 0.02) {
      withA(c, pairA, () => {
        c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([6, 6]); c.lineDashOffset = -u * 16;
        c.beginPath(); c.moveTo(FX, FRA_Y - 10); c.lineTo(FX, FRB_Y + 10); c.stroke(); c.restore();
        c.fillStyle = YEL; [FRA_Y, FRB_Y].forEach(y => { c.beginPath(); c.arc(FX, y, 5, 0, Math.PI * 2); c.fill(); });
      });
      M3.pairArc(c, FX + 58, FRA_Y - 6, FX + 58, FRB_Y + 6, { col: YEL, a: pairA, bulge: -26, head: 11, grow: n === 2 ? grow(s, 2, 3.9, 4.6) : 1 });
    }
    if (!joined && boxB > 0.5) {
      const st = ease(slide);
      /* A 給 B：50 gw，B 頂面 → 滑到 B 右面 */
      if (frB > 0.005) M3.force(c, {
        x: lerp(FX, FB_X1, st), y: lerp(FRB_Y, FB.cy, st), dir: 'right', val: 50, k: K, tick: TICK, col: FR, grow: frB,
        la: (n === 2 ? clamp01((frB - 0.85) / 0.15) : fout(s, 3, 2.6, 0.4)),
        text: L('A 給 B：向右 50 gw', 'A on B: 50 gw right'), lab: 'tip', dx: 50
      });
      /* 地面給 B：350 gw，B 底面 → 滑到 50 的後面 */
      const g3 = grow(s, 3, 1.0, 2.2);
      if (g3 > 0.005) M3.force(c, {
        x: lerp(FX, FB_X1 + 50 * K, st), y: lerp(GND_Y, FB.cy, st), dir: 'right', val: 350, k: K, tick: TICK, col: FR, grow: g3,
        la: clamp01((g3 - 0.85) / 0.15) * fout(s, 3, 2.6, 0.4),
        text: L('地面給 B：向右 350 gw', 'Ground on B: 350 gw right'), lab: 'above', dx: 78, dy: 0
      });
    }
    if (joined) {
      M3.segArrow(c, { x: FB_X1, y: FB.cy, dir: 'right', k: K, parts: [{ val: 50, col: FR }, { val: 350, col: FR }] });
      /* 刻痕：和其他力箭頭一樣每 50 gw 一道（段與段之間已有分隔線） */
      c.save(); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 2;
      for (let v = 100; v < 400; v += 50) { const x = FB_X1 + v * K; c.beginPath(); c.moveTo(x, FB.cy - 6.5); c.lineTo(x, FB.cy + 6.5); c.stroke(); }
      c.restore();
      const pa = n === 3 ? fin(s, 3, 4.7, 0.4) : 1;
      P(c, pa, '50', FB_X1 + 25 * K + 6, FB.cy + 33, FR, 22);
      P(c, pa, '350', FB_X1 + 50 * K + 175 * K, FB.cy + 33, FR, 22);
      M3.brace(c, FB_X1, FB.cy - 16, FB_X1 + 400 * K, FB.cy - 16, {
        col: FR, a: n === 3 ? fin(s, 3, 5.6, 0.4) : 1, side: -1, depth: 14, grow: grow(s, 3, 5.6, 6.2),
        text: '50 ＋ 350 ＝ 400 gw', size: 22, gapPx: 8
      });
    }

    /* 第 4 步：F（未知 → 長到 400）；右邊總長鏡像到左邊 */
    if (n === 4) {
      const q = fin(s, 4, 0.8, 0.4) * fout(s, 4, 2.9, 0.3);
      if (q > 0.02) M3.forceQ(c, { x: FB_X0, y: FB.cy, dir: 'left', len: 150, col: PULL, a: q, phase: u * 26, pulse: Math.sin(u * 3.4),
        text: L('F ＝ ?', 'F = ?'), lab: 'above' });
      if (F > 0.5) {
        const Fi = Math.max(1, Math.round(F)), mid = FB_X0 - Fi * K / 2;
        M3.force(c, { x: FB_X0, y: FB.cy, dir: 'left', val: Fi, k: K, tick: TICK, col: PULL, la: 1,
          text: 'F ' + Fi + ' gw', lab: 'above', dx: (FB_X0 - 170) - mid });
      }
      /* 鏡像：右邊 400 的長度框 → 移到左邊，與 F 一樣長 */
      const m = ease(seg(u, 5.8, 7.2)), ga = fin(s, 4, 5.6, 0.3);
      if (ga > 0.02) {
        const w = 400 * K, x0 = lerp(FB_X1, FB_X0 - w, m);
        M3.ghostBox(c, x0, FB.cy - 13, w, 26, YEL, ga * (0.5 + 0.5 * m), u * 20, 0.08);
        if (m > 0.98) {
          withA(c, fin(s, 4, 7.2, 0.4), () => {
            c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([6, 6]);
            [FB_X0 - w, FB_X1 + w].forEach(x => { c.beginPath(); c.moveTo(x, FB.cy - 34); c.lineTo(x, FB.cy + 34); c.stroke(); });
            c.restore();
          });
          P(c, fin(s, 4, 7.3, 0.4), L('一樣長', 'Same length'), FB_X0 - w / 2, FB.cy + 46, YEL, 22);
        }
      }
    }

    /* ── 頂端主標、比例尺 ── */
    const keys = [L('先看 A', 'Look at A'), L('反作用力', 'The reaction'), L('再看 B', 'Look at B'), L('B 的彈簧讀數', "B's spring reading")];
    P(c, n === 1 ? fin(s, 1, 0.2, 0.5) : fin(s, n, 0, 0.4), keys[n - 1], 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 40, M3.KEY_Y, CELL, 50, fin(s, 1, 0.2, 0.5), U);

    /* ── 底部結論 ── */
    const c1a = L('A 靜止 → 合力 ＝ 0', 'A stays still, so the net force is 0');
    const c1b = L('B 給 A 的摩擦力：向左 50 gw', 'Friction from B on A: 50 gw to the left');
    const c2 = L('作用力與反作用力：大小相等、方向相反', 'Action and reaction: equal in size, opposite in direction');
    const c3a = L('地面也給 B 摩擦力：向右 350 gw', 'The ground also gives B friction: 350 gw to the right');
    const c3b = L('B 受到向右的力，合起來 400 gw', 'Forces on B to the right add up to 400 gw');
    const c4a = L('B 靜止 → 向左的拉力 ＝ 向右的力', 'B stays still, so the pull left = the forces right');
    if (n === 1) {
      M3.caption(c, fin(s, 1, 3.4, 0.5) * fout(s, 1, 7.4, 0.4), c1a, WHITE);
      M3.caption(c, fin(s, 1, 7.8, 0.5), c1b, FR);
    }
    if (n === 2) {
      M3.caption(c, fout(s, 2, 0, 0.4), c1b, FR);
      M3.caption(c, fin(s, 2, 5.0, 0.5), c2, YEL);
    }
    if (n === 3) {
      M3.caption(c, fout(s, 3, 0, 0.4), c2, YEL);
      M3.caption(c, fin(s, 3, 1.2, 0.5) * fout(s, 3, 6.0, 0.4), c3a, FR);
      M3.caption(c, fin(s, 3, 6.6, 0.5), c3b, FR);
    }
    if (n === 4) {
      M3.caption(c, fout(s, 4, 0, 0.4), c3b, FR);
      M3.caption(c, fin(s, 4, 1.2, 0.5) * fout(s, 4, 7.6, 0.4), c4a, WHITE);
      M3.caption(c, fin(s, 4, 8.0, 0.6), L('F ＝ 400 gw', 'F = 400 gw'), YEL, 480, M3.BOT_Y, 28);
    }

    /* ── 旁白 March：1～3 步想一想，第 4 步算出來了 ── */
    const ta = n <= 3 ? fin(s, 1, 0.6, 0.6) : fout(s, 4, 7.8, 0.4);
    M3.march(c, 'thinking', 900, 540, { sc: 0.27, a: ta });
    if (n === 4) {
      const va = fin(s, 4, 8.4, 0.5), hop = 6 * Math.abs(Math.sin(u * 4.2)) * va;
      if (va > 0.02) W5.glow(c, 900, 490, 70, YEL, 0.16 * va);
      M3.march(c, 'victory', 900, 534 - hop, { sc: 0.27, a: va, shadow: false });
    }
  }

  W5.register('ab', { canvas: 'cvs-ab', steps: DUR, draw });
})();
