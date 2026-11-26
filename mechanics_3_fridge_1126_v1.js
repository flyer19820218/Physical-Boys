/* ==================================================================
   mechanics_3 ｜ 資優補充：冰箱靠牆（cvs-fridge，960×540）
   四步：1 平地推：25 kgw → 2 比例 1：2 → 3 靠牆：重力 50 → 4 推力 100 kgw
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   版面：
   ・左半「場景」：地面線 GY＝455。第 1、2 步冰箱放在地上（中線 FL_CX），March（touch_ready）在左邊往右推；
     第 3 步牆從右邊滑進來（牆面 WALL_X），冰箱被抬離地面、壓到牆上（中線 WL_CX、底面 GY−44），March 跟著往右推。
   ・右半「冰箱受力圖」：M3.fbdBox 小冰箱（中心 BX,BY），全部的力都畫在這裡，標名稱＋數字（kgw）。
       重力（粉 ↓）、平地的正向力（綠 ↑）從中心點出發；推力（青 →）、牆的正向力（綠 ←）用 M3.forceInto 畫成「推進表面」；
       平地的摩擦力（珊瑚 ←）貼在底面左下角；牆的摩擦力（珊瑚 ↑）貼在冰箱右面外側（牆的接觸面）。
   ・上方兩列（y＝104、146）：第 2 步的比例條（M3.segArrow＋M3.brace）、第 4 步的算式（M3.eqRow）。
   比例尺：K＝1.8 px／kgw（100 kgw＝180 px 放得下），整支不變；背景方格 1 格＝45 px＝25 kgw；力箭頭每 25 kgw 一道刻痕。
   數字（照簡報）：冰箱 50 kg → 重力 50 kgw；平地正向力 50、推力 25、最大靜摩擦力 25（1：2）；
       靠牆：摩擦力 50 ＝ 重力 50 → 正向力 ＝ 50 × 2 ＝ 100 → 推力 100 kgw。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.marchPush || !M3.fbdBox) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow;
  const FR = M3.FC.friction, PUSH = M3.FC.push, GRAV = M3.FC.gravity, NORM = M3.FC.normal;
  const DUR = [11, 11, 12, 12];      /* 總長 46 秒 */

  const K = 1.8, CELL = 45, TICK = 25, U = 'kgw';   /* 1.8 px／kgw；1 格＝25 kgw */
  const GY = M3.GY;
  const FW = 120, FH = 220;          /* 場景冰箱 */
  const FL_CX = 270;                 /* 平地：冰箱中線 */
  const WALL_X = 400, WL_CX = WALL_X - FW / 2, LIFT = 44;   /* 靠牆：牆面、冰箱中線、離地高度 */
  const BX = 690, BY = 315, BW = 96, BH = 120;             /* 受力圖小冰箱 */
  const B = { x0: BX - BW / 2, x1: BX + BW / 2, y0: BY - BH / 2, y1: BY + BH / 2 };
  const HY = BY + 25;                /* 推力／牆的正向力所在高度 */
  const FLOOR_FR_Y = B.y1 + 14;      /* 平地摩擦力（底面下緣） */
  const WALL_FR_X = B.x1 + 16;       /* 牆的摩擦力（右面外側） */
  const ROW1 = 104, ROW2 = 146;      /* 上方兩列 */

  M3.preload(['touch_ready', 'victory']);

  /* ── 場景狀態（純函式）：冰箱中線、底面、牆的位置與透明度、顫抖 ── */
  function sceneState(s) {
    const n = s.n, u = s.u;
    if (n <= 2) {
      const sh = n === 1 ? 1.6 * ease(seg(u, 5.6, 6.2)) * (1 - ease(seg(u, 8.6, 9.6))) : 0;
      return { cx: FL_CX + M3.shake(u, sh, 36, 0.7), by: GY, wallX: WALL_X + 160, wallA: 0, lifted: 0 };
    }
    if (n === 3) {
      const m = ease(seg(u, 0.6, 2.6)), up = ease(seg(u, 0.6, 1.8));
      const slip = 6 * ease(seg(u, 2.9, 3.4));                     /* 重力一出現就往下滑一點，摩擦力出現後停住 */
      const sh = 1.4 * ease(seg(u, 2.9, 3.2)) * (1 - ease(seg(u, 3.8, 4.4)));
      return {
        cx: lerp(FL_CX, WL_CX, m), by: GY - LIFT * up + slip + M3.shake(u, sh, 40, 2.1),
        wallX: lerp(WALL_X + 160, WALL_X, ease(seg(u, 0.2, 1.8))), wallA: fin(s, 3, 0.2, 1.0), lifted: up
      };
    }
    return { cx: WL_CX, by: GY - LIFT + 6, wallX: WALL_X, wallA: 1, lifted: 1 };
  }

  function backdrop(c) {
    M3.backdrop(c, { gy: GY, cell: CELL, ox: B.x0, oy: GY, glow: COL.teal, gx: 600 });
    M3.ground(c, GY);
  }

  /* ═══════════ 左半：場景 ═══════════ */
  function scene(c, s, st, hl) {
    if (st.wallA > 0.02) M3.wall(c, st.wallX, 40, GY, 'right', { a: st.wallA, w: 45 });
    /* 離地：地上留一個淡影子＋「離地」小虛線 */
    if (st.lifted > 0.02) {
      withA(c, st.lifted * 0.4, () => { c.fillStyle = M3.INK; c.beginPath(); c.ellipse(st.cx, GY + 3, FW * 0.5, 6, 0, 0, Math.PI * 2); c.fill(); });
    }
    M3.fridge(c, st.cx, st.by, FW, FH, { handle: 'left', shadow: st.lifted < 0.05, contact: hl.floorFr, contactCol: FR });
    /* 牆的接觸面（摩擦力的作用處）：冰箱右面亮珊瑚色 */
    if (hl.wallFr > 0.02) withA(c, hl.wallFr, () => {
      const x = st.cx + FW / 2 - 1;
      W5.glow(c, x, st.by - FH / 2, FH * 0.55, FR, 0.18);
      c.save(); c.strokeStyle = FR; c.lineWidth = 6; c.lineCap = 'round'; c.shadowColor = FR; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(x, st.by - FH + 12); c.lineTo(x, st.by - 12); c.stroke(); c.restore();
    });
    const mp = M3.marchPush(c, st.cx - FW / 2, GY, 'right', {});
    /* 推力的作用處：手掌青光 */
    if (mp.hand && hl.hand > 0.02) W5.glow(c, mp.hand.x, mp.hand.y, 34, PUSH, 0.45 * hl.hand);
  }

  /* ═══════════ 右半：受力圖 ═══════════ */
  function fbdTag(c, a) { T(c, a, L('冰箱受力圖', 'Forces on fridge'), B.x0 - 18, B.y0 + 6, DIM, 20, 'right'); }

  /* 平地的四個力。o：{ a, g 重力長出, nn 正向力長出, F 推力數值, f 摩擦力數值, fmax 是否已到最大靜摩擦力, hiN, hiF 強調光暈 } */
  function floorForces(c, o) {
    const a = o.a;
    if (a <= 0.02) return;
    if (o.hiN > 0.02) W5.glow(c, BX, BY - 50 - 30, 70, NORM, 0.22 * o.hiN * a);
    if (o.hiF > 0.02) W5.glow(c, B.x0 - 22, FLOOR_FR_Y, 50, FR, 0.28 * o.hiF * a);
    M3.force(c, { x: BX, y: BY, dir: 'up', val: 50, k: K, tick: TICK, col: NORM, grow: o.nn, a, name: L('正向力', 'Normal force'), unit: U, lab: 'tip' });
    M3.force(c, { x: BX, y: BY, dir: 'down', val: 50, k: K, tick: TICK, col: GRAV, grow: o.g, a, name: L('重力', 'Weight'), unit: U, lab: 'tip' });
    if (o.F > 0.3) M3.forceInto(c, { x: B.x0, y: HY, dir: 'right', val: o.F, k: K, tick: TICK, col: PUSH, a, la: 1, name: L('推力', 'Push'), unit: U, lab: 'left' });
    if (o.f > 0.3) M3.force(c, {
      x: B.x0, y: FLOOR_FR_Y, dir: 'left', val: o.f, k: K, tick: TICK, col: FR, a, la: 1, unit: U, lab: 'left',
      name: o.fmax ? L('最大靜摩擦力', 'Max static friction') : L('靜摩擦力', 'Static friction')
    });
  }

  /* 靠牆的力。o：{ a, g 重力, gla 重力標籤透明度（接在平地的標籤淡出之後）, fw 摩擦力長出, q 問號透明度, F 推力＝牆的正向力（0＝還不知道）, u, la 標籤 } */
  function wallForces(c, o) {
    const a = o.a;
    if (a <= 0.02) return;
    M3.force(c, { x: BX, y: BY, dir: 'down', val: 50, k: K, tick: TICK, col: GRAV, grow: o.g, a, la: o.gla, name: L('重力', 'Weight'), unit: U, lab: 'left', dy: 47, dx: -10 });
    M3.force(c, { x: WALL_FR_X, y: BY + 5, dir: 'up', val: 50, k: K, tick: TICK, col: FR, grow: o.fw, a, name: L('摩擦力', 'Friction'), unit: U, lab: 'tip' });
    /* 還不知道多大：虛線、會脈動 */
    if (o.q > 0.02) {
      const pu = Math.sin(o.u * 3.4);
      M3.forceQ(c, { x: B.x0, y: HY, dir: 'right', len: 110, col: PUSH, a: a * o.q, phase: o.u * 26, pulse: pu, into: true, text: L('推力要多大？', 'Push = ?'), lab: 'above', dx: -16 });
      M3.forceQ(c, { x: B.x1, y: HY, dir: 'left', len: 110, col: NORM, a: a * o.q * o.qn, phase: o.u * 26, pulse: pu, into: true, text: L('牆的正向力 ？', 'Normal force ?'), lab: 'below', dx: -16, dy: 56 });
    }
    if (o.F > 0.3) {
      /* 數字一格一格往上數；標籤固定在 100 kgw 時的位置，不跟著箭頭長度跑 */
      const F = Math.max(1, Math.round(o.F)), sh = (100 - F) * K / 2;
      M3.forceInto(c, { x: B.x0, y: HY, dir: 'right', val: F, k: K, tick: TICK, col: PUSH, a, la: 1, name: L('推力', 'Push'), unit: U, lab: 'above', dx: -sh - 12 });
      M3.forceInto(c, { x: B.x1, y: HY, dir: 'left', val: F, k: K, tick: TICK, col: NORM, a, la: 1, name: L('牆的正向力', 'Normal force'), unit: U, lab: 'below', dx: -16 + sh, dy: 56 });
    }
  }

  /* ═══════════ 第 2 步：比例條 ═══════════ */
  const RX = 620;                    /* 比例條的起點 */
  function ratioBars(c, s, a) {
    if (a <= 0.02) return;
    const n = 2, u = s.u;
    const g1 = grow(s, n, 0.8, 1.6), g2 = grow(s, n, 2.0, 3.2);
    T(c, a * fin(s, n, 0.6, 0.5), L('最大靜摩擦力 25 kgw', 'Max static friction 25 kgw'), RX - 16, ROW1, FR, 22, 'right');
    T(c, a * fin(s, n, 1.8, 0.5), L('正向力 50 kgw', 'Normal force 50 kgw'), RX - 16, ROW2, NORM, 22, 'right');
    M3.segArrow(c, { x: RX, y: ROW1, dir: 'right', k: K, parts: [{ val: 25, col: FR }], a, grow: g1 });
    const sb = M3.segArrow(c, { x: RX, y: ROW2, dir: 'right', k: K, parts: [{ val: 25, col: NORM }, { val: 25, col: NORM }], a, grow: g2 });
    /* 摩擦力那一段「複製」兩次：疊到正向力的第一段、第二段上（虛線框），看出剛好 2 倍 */
    const w = 25 * K;
    [0, 1].forEach(i => {
      const t = ease(seg(s.n > n ? 99 : u, 3.6 + i * 1.0, 4.4 + i * 1.0)), ga = a * (s.n > n ? 1 : fin(s, n, 3.6 + i * 1.0, 0.3));
      if (ga <= 0.02) return;
      const x0 = lerp(RX, RX + i * w, t), y0 = lerp(ROW1, ROW2, t);
      M3.ghostBox(c, x0 + 1, y0 - 13, w - 2, 26, FR, ga * (0.55 + 0.45 * t), u * 20, 0.10);
    });
    /* 大括號＋1：2 */
    const bx = RX + sb.ends[1].x - RX + 26;
    M3.brace(c, bx, ROW1 - 18, bx, ROW2 + 18, { col: YEL, a: a * fin(s, n, 5.6, 0.4), side: -1, depth: 16, text: '1 : 2', size: 24, gapPx: 10 });
  }

  /* ═══════════ 第 4 步：算式 ═══════════ */
  function equations(c, s, a) {
    if (a <= 0.02) return;
    const n = 4, u = s.u, X = 690;
    const show1 = Math.max(0, (u - 0.5) / 0.45);
    M3.eqRow(c, { x: X, y: ROW1, size: 24, a, show: show1, tokens: [
      { t: L('摩擦力 50', 'Friction 50'), col: FR }, { t: '＝', col: WHITE }, { t: '½ ×', col: WHITE }, { t: L('正向力', 'normal force'), col: NORM }
    ] });
    const show2 = Math.max(0, (u - 2.6) / 0.45);
    M3.eqRow(c, { x: X, y: ROW2, size: 24, a, show: show2, tokens: [
      { t: L('正向力', 'Normal force'), col: NORM }, { t: '＝', col: WHITE }, { t: '50 × 2', col: WHITE }, { t: '＝', col: WHITE }, { t: '100 kgw', col: YEL, pill: true }
    ] });
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const n = s.n, u = s.u;
    backdrop(c);
    const st = sceneState(s);

    /* ── 推力數值、各力長出 ── */
    const F1 = n === 1 ? 25 * ease(seg(u, 3.8, 6.0)) : 25;
    const floorA = n <= 2 ? 1 : fout(s, 3, 0.2, 0.8);
    const fwGrow = grow(s, 3, 3.6, 4.6);
    const F4 = n === 4 ? 100 * ease(seg(u, 5.0, 7.4)) : 0;
    const hl = {
      floorFr: n <= 2 ? (F1 > 0.3 ? 0.9 : 0) : floorA * 0.9,
      wallFr: n >= 3 ? fwGrow * 0.9 : 0,
      hand: n === 1 ? clamp01(F1 / 6) : n === 2 ? 1 : n === 3 ? (st.lifted > 0.9 ? 0.6 + 0.4 * fin(s, 3, 5.4, 0.5) : 0) : 1
    };
    scene(c, s, st, hl);

    /* ── 受力圖 ── */
    const boxA = fin(s, 1, 0.4, 0.6);
    M3.fbdBox(c, BX, BY, BW, BH, { kind: 'fridge', dot: true, a: boxA, glow: n === 4 ? YEL : null });
    fbdTag(c, boxA);
    if (n <= 3) floorForces(c, {
      a: floorA, g: grow(s, 1, 1.0, 2.0), nn: grow(s, 1, 2.2, 3.2), F: F1, f: F1, fmax: n > 1 || u > 6.0,
      hiN: n === 2 ? fin(s, 2, 1.8, 0.4) * fout(s, 2, 6.0, 0.6) : 0, hiF: n === 2 ? fin(s, 2, 0.6, 0.4) * fout(s, 2, 6.0, 0.6) : 0
    });
    if (n >= 3) wallForces(c, {
      a: 1, g: 1, gla: n === 3 ? fin(s, 3, 1.0, 0.5) : 1, fw: fwGrow, u,
      q: n === 3 ? fin(s, 3, 5.4, 0.5) : fout(s, 4, 4.8, 0.4), qn: n === 3 ? fin(s, 3, 6.6, 0.5) : 1,
      F: F4
    });

    /* ── 上方：比例條／算式 ── */
    if (n === 2) ratioBars(c, s, 1);
    if (n === 3) ratioBars(c, { n: 2, u: 11, d: 11 }, fout(s, 3, 0, 0.6));
    if (n === 4) equations(c, s, 1);

    /* ── 頂端主標、比例尺 ── */
    const keys = [L('平地推：25 kgw', 'On the floor: 25 kgw'), L('比例 1：2', 'Ratio 1 : 2'), L('靠牆：重力 50', 'On the wall: weight 50'), L('推力 100 kgw', 'Push 100 kgw')];
    P(c, n === 1 ? fin(s, 1, 0.2, 0.5) : fin(s, n, 0, 0.4), keys[n - 1], 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 40, M3.KEY_Y, CELL, 25, fin(s, 1, 0.2, 0.5), U);

    /* ── 底部結論 ── */
    if (n === 1) M3.caption(c, fin(s, 1, 6.6, 0.5), L('剛好推得動：最大靜摩擦力 ＝ 25 kgw', 'Just about to move: max static friction = 25 kgw'), FR);
    if (n === 2) {
      M3.caption(c, fout(s, 2, 0, 0.4), L('剛好推得動：最大靜摩擦力 ＝ 25 kgw', 'Just about to move: max static friction = 25 kgw'), FR);
      M3.caption(c, fin(s, 2, 6.4, 0.5), L('這一題：最大靜摩擦力永遠是正向力的一半', 'Here, max static friction is always half the normal force'), YEL);
    }
    if (n === 3) {
      M3.caption(c, fout(s, 3, 0, 0.4), L('這一題：最大靜摩擦力永遠是正向力的一半', 'Here, max static friction is always half the normal force'), YEL);
      M3.caption(c, fin(s, 3, 4.8, 0.5) * fout(s, 3, 8.0, 0.4), L('不掉下來：向上的摩擦力 ＝ 重力 ＝ 50 kgw', 'Not falling: upward friction = weight = 50 kgw'), FR);
      M3.caption(c, fin(s, 3, 8.4, 0.5), L('推力把冰箱壓向牆：推力 ＝ 牆的正向力', 'The push presses it on the wall: push = normal force'), WHITE);
    }
    if (n === 4) {
      M3.caption(c, fout(s, 4, 0, 0.4), L('推力把冰箱壓向牆：推力 ＝ 牆的正向力', 'The push presses it on the wall: push = normal force'), WHITE);
      M3.caption(c, fin(s, 4, 8.0, 0.6), L('推力 ＝ 100 kgw', 'Push = 100 kgw'), YEL, 480, M3.BOT_Y, 28);
      /* 冰箱穩穩不動：March 勝利（前景角落的旁白表情） */
      const va = fin(s, 4, 8.6, 0.5), hop = 6 * Math.abs(Math.sin(u * 4.2)) * va;
      if (va > 0.02) W5.glow(c, 62, 490, 70, YEL, 0.16 * va);
      M3.march(c, 'victory', 62, 534 - hop, { sc: 0.27, a: va, shadow: false });
    }
  }

  W5.register('fridge', { canvas: 'cvs-fridge', steps: DUR, draw });
})();
