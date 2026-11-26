/* ==================================================================
   mechanics_4 ｜ 壓力的定義（cvs-pdef，960×540）
   四步：1 同一個力 → 2 單根釘子（氣球破）→ 3 密集釘板（氣球沒事）→ 4 壓力公式 P ＝ F ÷ A
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3（mechanics_3_common）與 M4（mechanics_4_common）。

   版面（左右並排、整支延續）：
   ・左半中線 LX＝300：一根釘子尖朝上立在長桌上，氣球放在釘尖上，壓板＋手。放大鏡在左邊外側 (110,330)。
   ・右半中線 RX＝660：密集釘板（前排 21 根＋後兩排），同樣的氣球、壓板、手。放大鏡在右邊外側 (850,330)。
   ・長桌面 y＝408～424（x 190～770）；釘高 54 → 釘尖 TIP＝354。
   ・文字列：頂端步驟標題 KEY_Y 62；問句／結論 Q_Y 108；面積／壓力 pill 列 ROW_A 452；算式 pill 列 ROW_B 502（第 4 步改放底部結論）。
   數字（照簡報）：F ＝ 200 gw；單根 A ＝ 0.1 cm² → P ＝ 2000 gw/cm²；200 根 A ＝ 20 cm² → P ＝ 10 gw/cm²；相差 200 倍。
   比例尺：施力 0.3 px／gw（200 gw＝60 px，兩邊一樣長）；壓力箭頭 0.05 px／(gw/cm²)（2000 → 100 px）。
       右邊 10 gw/cm² 照比例只有 0.5 px 看不見，改畫成 12 px 的細短箭頭（示意，見交付說明）。
   壓力箭頭：畫在釘尖處、尖端朝向被壓的面（釘尖頂住氣球的那一點），方向與施力相同（向下）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.balloon) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow, since = M4.since;
  const WHITE = COL.white, YEL = COL.yellow, PUSH = M4.PC.force, PR = M4.PC.pressure;
  const DUR = [10, 11, 12, 11];      /* 總長 44 秒 */

  const LX = 300, RX = 660;          /* 左右場景中線 */
  const TABLE_T = 408, TABLE_TH = 16, NAIL_H = 54, TIP = TABLE_T - NAIL_H;
  const BAL_W = 150, BAL_H = 128, PLATE_W = 170, HOVER = 24, ARM_TOP = 132;
  const FK = 0.3, F = 200;           /* 施力比例尺 px／gw */
  const PK = 0.05;                   /* 壓力比例尺 px／(gw/cm²) */
  const BED_W = 160;
  const MAG = { r: 56, y: 330, lx: 110, rx: 850 };
  const ROW_A = 452, ROW_B = 502;
  const POP_T = 7.0;                 /* 第 2 步幾秒爆 */

  /* ── 狀態（純函式） ── */
  function leftState(s) {
    const descend = grow(s, 2, 2.6, 4.0), comp = 10 * grow(s, 2, 4.0, 5.0);
    const popT = since(s, 2, POP_T), popped = popT >= 0;
    const d = 3 + 0.4 * comp, h = BAL_H - comp, w = BAL_W + comp * 0.9;
    const balBy = TIP + d, balTop = balBy - h;
    let plateBy = balTop;
    if (popped) { const q = clamp01(popT / 0.35); plateBy = lerp(balTop, TIP, q * q); }
    const gap = HOVER * (1 - descend);
    return { descend, comp, popT, popped, d, h, w, balBy, plateBy, palm: plateBy - 16 - gap };
  }
  function rightState(s) {
    const descend = grow(s, 3, 2.8, 4.2), comp = 12 * grow(s, 3, 4.2, 5.4);
    const h = BAL_H - comp, w = BAL_W + comp, balBy = TIP + 2, plateBy = balBy - h;
    return { descend, comp, h, w, balBy, plateBy, palm: plateBy - 16 - HOVER * (1 - descend) };
  }
  /* 左右兩半的亮度：第 2 步右半暗、第 3 步左半暗、第 4 步都亮 */
  function dims(s) {
    const n = s.n, a1 = n === 1 ? s.k : 1;
    let la = a1, ra = a1;
    if (n === 2) ra = lerp(1, 0.35, fin(s, 2, 0, 0.8));
    if (n === 3) { la = lerp(1, 0.35, fin(s, 3, 0, 0.8)); ra = lerp(0.35, 1, fin(s, 3, 0, 0.8)); }
    if (n === 4) la = lerp(0.35, 1, fin(s, 4, 0, 0.8));
    return { la, ra, a1 };
  }

  /* ── 施力箭頭（兩邊一樣長）＋標籤（放外側） ── */
  function forceArrow(c, s, x, palm, side, a) {
    const g = grow(s, 1, 1.4, 2.8);
    if (g <= 0.005) return;
    M3.force(c, { x, y: palm - F * FK, dir: 'down', val: F, k: FK, col: PUSH, a, grow: g, lw: 7,
      text: L('施力 F ＝ 200 gw', 'Force F = 200 gw'), lab: side, la: fin(s, 1, 2.6, 0.5),
      dx: side === 'left' ? -16 : 16, dy: -10 });
  }

  /* ═══════════ 左半：單根釘子 ═══════════ */
  function leftScene(c, s, st, a) {
    withA(c, a, () => {
      M4.nail(c, LX, TABLE_T, NAIL_H, { w: 11 });
      if (!st.popped) M4.balloon(c, LX, st.balBy, { w: st.w, h: st.h, box: 0, dimple: { x: LX, depth: st.d, wid: 10 } });
      else M4.balloonScraps(c, LX, TIP, TABLE_T, {});
      /* 壓力箭頭：一根長箭頭，尖端在釘尖 */
      const pg = grow(s, 2, 4.4, 5.4), pa = st.popped ? 1 - clamp01(st.popT / 0.15) : 1;
      if (pg > 0.01) M4.pArrow(c, LX, TIP, 2000 * PK * pg, { a: pa, lw: 8 });
      M4.pressPlate(c, LX, st.plateBy, PLATE_W, { gap: st.plateBy - 16 - st.palm, dir: 'left', armTop: ARM_TOP, seed: 7 });
      forceArrow(c, s, LX, st.palm, 'left', 1);
      /* 啪！ */
      if (st.popped && st.popT < 1.3) {
        M4.balloonPop(c, LX, st.balBy - st.h / 2, st.popT, { r: 70, floorY: TABLE_T, seed: 5 });
        const ta = st.popT < 0.1 ? st.popT / 0.1 : 1 - clamp01((st.popT - 0.9) / 0.4);
        T(c, ta, L('啪！', 'POP!'), LX + 62, 282 - 10 * ease(clamp01(st.popT / 0.3)), YEL, 34);
      }
    });
  }
  /* 左放大鏡：釘尖頂住氣球皮的一小點 */
  function leftLens(c, s, st, a) {
    if (a <= 0.02) return;
    const cx = MAG.lx, cy = MAG.y, r = MAG.r;
    M4.zoomLeader(c, LX, TIP, cx, cy, r + 10, { a: a * 0.9, mark: 13 });
    M3.magnifier(c, cx, cy, r, { a, handleA: 0, inner: cc => {
      cc.fillStyle = 'rgba(13,32,26,0.92)'; cc.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const tipY = cy + 4, press = st.comp / 10;
      /* 釘尖（放大） */
      const g = cc.createLinearGradient(cx - 30, 0, cx + 30, 0);
      g.addColorStop(0, '#8693a0'); g.addColorStop(0.42, '#ffffff'); g.addColorStop(1, '#69767f');
      cc.fillStyle = g; cc.beginPath(); cc.moveTo(cx - 34, cy + r + 4); cc.lineTo(cx, tipY); cc.lineTo(cx + 34, cy + r + 4); cc.closePath(); cc.fill();
      /* 氣球皮：被尖端頂出一個小凹點 */
      const side = 10 + 10 * press;
      cc.beginPath(); cc.moveTo(cx - r, cy - r);
      for (let x = cx - r; x <= cx + r; x += 2) { const q = (x - cx) / 15; cc.lineTo(x, tipY + side * (1 - Math.exp(-q * q))); }
      cc.lineTo(cx + r, cy - r); cc.closePath();
      const bg = cc.createLinearGradient(0, cy - r, 0, tipY + side);
      bg.addColorStop(0, W5.mix(M4.BALLOON, '#ffffff', 0.25)); bg.addColorStop(1, W5.mix(M4.BALLOON, '#1a1030', 0.3));
      cc.fillStyle = bg; cc.fill();
      cc.strokeStyle = W5.mix(M4.BALLOON, '#ffffff', 0.5); cc.lineWidth = 3; cc.stroke();
      /* 接觸點（珊瑚） */
      W5.glow(cc, cx, tipY, 16, PR, 0.6);
      cc.fillStyle = PR; cc.beginPath(); cc.ellipse(cx, tipY, 4.5, 3, 0, 0, Math.PI * 2); cc.fill();
    } });
    T(c, a, L('1 根釘子', '1 nail'), cx, 416, WHITE, 22);
  }

  /* ═══════════ 右半：密集釘板 ═══════════ */
  function rightScene(c, s, st, a) {
    withA(c, a, () => {
      M4.nailBed(c, RX, TABLE_T, BED_W, { n: 21, h: NAIL_H, frontLater: true });
      M4.balloon(c, RX, st.balBy, { w: st.w, h: st.h, box: 0.25 + st.comp / 12 * 0.4 });
      const bed = M4.nailBed(c, RX, TABLE_T, BED_W, { n: 21, h: NAIL_H, a: 0 });
      M4.nailBedFront(c, RX, TABLE_T, BED_W, { n: 21, h: NAIL_H });
      /* 壓力箭頭：很多根很短的箭頭 */
      const pg = grow(s, 3, 4.8, 5.8);
      if (pg > 0.01) bed.xs.forEach((x, i) => { if (i % 2 === 0) M4.pArrow(c, x, TIP, 12 * pg, { lw: 3 }); });
      M4.pressPlate(c, RX, st.plateBy, PLATE_W, { gap: st.plateBy - 16 - st.palm, dir: 'right', armTop: ARM_TOP, seed: 9 });
      forceArrow(c, s, RX, st.palm, 'right', 1);
    });
  }
  /* 右放大鏡：好幾根釘尖一起頂住平平的氣球底 */
  function rightLens(c, s, st, a) {
    if (a <= 0.02) return;
    const cx = MAG.rx, cy = MAG.y, r = MAG.r;
    M4.zoomLeader(c, RX + 34, TIP, cx, cy, r + 10, { a: a * 0.9, mark: 22 });
    M3.magnifier(c, cx, cy, r, { a, handleA: 0, inner: cc => {
      cc.fillStyle = 'rgba(13,32,26,0.92)'; cc.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const tipY = cy + 8, xs = [-2, -1, 0, 1, 2].map(i => cx + i * 25);
      xs.forEach(x => {
        const g = cc.createLinearGradient(x - 10, 0, x + 10, 0);
        g.addColorStop(0, '#8693a0'); g.addColorStop(0.42, '#ffffff'); g.addColorStop(1, '#69767f');
        cc.fillStyle = g; cc.beginPath(); cc.moveTo(x - 10, cy + r + 4); cc.lineTo(x, tipY); cc.lineTo(x + 10, cy + r + 4); cc.closePath(); cc.fill();
      });
      cc.beginPath(); cc.moveTo(cx - r, cy - r);
      for (let x = cx - r; x <= cx + r; x += 2) {
        let dy = 4; xs.forEach(xx => { const q = (x - xx) / 6; dy -= 4 * Math.exp(-q * q); });
        cc.lineTo(x, tipY + dy);
      }
      cc.lineTo(cx + r, cy - r); cc.closePath();
      const bg = cc.createLinearGradient(0, cy - r, 0, tipY + 4);
      bg.addColorStop(0, W5.mix(M4.BALLOON, '#ffffff', 0.25)); bg.addColorStop(1, W5.mix(M4.BALLOON, '#1a1030', 0.3));
      cc.fillStyle = bg; cc.fill();
      cc.strokeStyle = W5.mix(M4.BALLOON, '#ffffff', 0.5); cc.lineWidth = 3; cc.stroke();
      xs.forEach(x => { W5.glow(cc, x, tipY, 9, PR, 0.5); cc.fillStyle = PR; cc.beginPath(); cc.ellipse(x, tipY, 3.5, 2.5, 0, 0, Math.PI * 2); cc.fill(); });
    } });
    T(c, a, L('200 根釘子', '200 nails'), cx, 416, WHITE, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('同一個力', 'The same force'),
    () => L('單根釘子', 'One nail'),
    () => L('密集釘板', 'A bed of nails'),
    () => L('壓力公式', 'The formula')
  ];
  function texts(c, s, dm) {
    const n = s.n, la = dm.la, ra = dm.ra;
    P(c, dm.a1 * fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    /* 第 1 步問句 */
    M3.caption(c, fin(s, 1, 4.0, 0.6) * fout(s, 2, 0, 0.4) * dm.a1, L('同樣的力，結果會一樣嗎？', 'Same force, same result?'), YEL, 480, M3.Q_Y, 24);
    /* 第 2 步：面積、算式、結論（左） */
    P(c, la * fin(s, 2, 1.0, 0.6) * fout(s, 3, 0, 0.5), L('接觸面積 A ＝ 0.1 cm²', 'Contact area A = 0.1 cm²'), LX, ROW_A, WHITE, 22);
    M4.pPill(c, la * fin(s, 2, 5.4, 0.6) * fout(s, 3, 0, 0.5), 'P ＝ 200 ÷ 0.1 ＝ 2000 gw/cm²', LX, ROW_B, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('面積小 → 壓力大', 'Small area → big pressure'), YEL, LX, M3.Q_Y, 24);
    M4.pPill(c, la * fin(s, 3, 0.3, 0.6), 'P ＝ 2000 gw/cm²', LX, ROW_A, 22);
    /* 第 3 步：面積、算式、結論（右） */
    P(c, ra * fin(s, 3, 1.0, 0.6) * fout(s, 4, 0, 0.5), L('總面積 A ＝ 20 cm²', 'Total area A = 20 cm²'), RX, ROW_A, WHITE, 22);
    M4.pPill(c, ra * fin(s, 3, 6.2, 0.6) * fout(s, 4, 0, 0.5), 'P ＝ 200 ÷ 20 ＝ 10 gw/cm²', RX, ROW_B, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('面積大 → 壓力小（分散）', 'Big area → small pressure (spread out)'), YEL, RX, M3.Q_Y, 24);
    M4.pPill(c, ra * fin(s, 4, 0.3, 0.6), 'P ＝ 10 gw/cm²', RX, ROW_A, 22);
    /* 第 4 步：公式、F 相同、相差 200 倍、結論 */
    if (n === 4) {
      const fa = fin(s, 4, 0.6, 0.6);
      if (fa > 0.02) W5.glow(c, 480, M3.Q_Y, 160, YEL, 0.14 * fa);
      P(c, fa, 'P ＝ F ÷ A', 480, M3.Q_Y, YEL, 30);
      P(c, fin(s, 4, 2.0, 0.6), L('F 相同', 'Same F'), 480, 255, YEL, 22);
      T(c, fin(s, 4, 3.4, 0.6), L('相差 200 倍', '200× apart'), 480, ROW_A, YEL, 22);
      M3.caption(c, fin(s, 4, 5.0, 0.6), L('壓力不是力，是力量集中的程度', 'Pressure is not a force: it is how concentrated a force is'), YEL, 480, M3.BOT_Y, 24);
    }
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const dm = dims(s), n = s.n;
    M3.backdrop(c, { gy: TABLE_T, cell: 40, ox: 0, glow: COL.teal, a: dm.a1 });
    /* 中間分隔虛線 */
    withA(c, dm.a1 * 0.5, () => { c.save(); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.setLineDash([8, 8]);
      c.beginPath(); c.moveTo(480, 150); c.lineTo(480, 396); c.stroke(); c.restore(); });
    M3.slab(c, 190, TABLE_T, 770, TABLE_T + TABLE_TH, 'wood', { a: dm.a1, seed: 11 });
    const ls = leftState(s), rs = rightState(s);
    leftScene(c, s, ls, dm.la);
    rightScene(c, s, rs, dm.ra);
    /* 放大鏡：第 2 步左（爆了就收）、第 3 步右 */
    const lA = n === 2 ? fin(s, 2, 0.6, 0.8) * (1 - clamp01((ls.popT - 0.05) / 0.25)) : 0;
    leftLens(c, s, ls, lA);
    const rA = n === 3 ? fin(s, 3, 0.6, 0.8) : n === 4 ? fout(s, 4, 0, 0.5) : 0;
    rightLens(c, s, rs, rA);
    texts(c, s, dm);
  }

  W5.register('pdef', { canvas: 'cvs-pdef', steps: DUR, draw });
})();
