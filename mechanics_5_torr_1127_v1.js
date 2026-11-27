/* ==================================================================
   mechanics_5 ｜ 托里切利實驗：大氣壓力撐住水銀柱（cvs-torr，960×540）
   四步：1 裝滿水銀倒插 → 2 停在 76 cm → 3 大氣壓撐住 → 4 算出 1 atm
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption／eqRow／magnifier、M4.L／T／P／withA／fin／fout／grow／pPill／sideRuler／pourLiquid／zoomLeader／SKIN、
        M5.trough／baroTube／liqFill／dimV／airCol／pArrowAt（trough、baroTube、liqFill、dimV、airCol 由本檔新增進 M5，tilt、water 沿用）。

   數字（照簡報）：1 atm ＝ 76 cmHg ＝ 13.6 × 76 ＝ 1033.6 gw/cm²；水銀 D ＝ 13.6；管長約 100 cm（槽面以上），真空約 24 cm。
   比例尺：1 cm ＝ 3.6 px（垂直、照比例）。槽面 y 448；76 cm ＝ 273.6 px → 水銀頂 y 174.4；管頂（封閉端外頂）y 88（槽面以上 100 cm＝360 px）；
     管口插在槽面下 22 px（約 6 cm），管口 y 470。管內半寬 10 px（管寬是示意，不照比例）。
   第 1 步（11 s）：右上方燒杯傾倒水銀（u 0.5～4.6），斜拿的玻璃管（開口朝右上）由封閉端裝到管口全滿（u 1.4～4.4）；
     「水銀 D ＝ 13.6」標籤 u 0.8；燒杯淡出 u 4.6；大拇指蓋住管口 u 4.6～5.2（「手指堵住管口」）；
     u 5.4～8.0 管子順時針轉 140° 成「開口朝下」並移到槽的正上方（中心 (637,296)→(330,245)）；u 8.0～9.2 垂直插進槽面下；字卡 u 8.6。
   第 2 步（11 s）：u 0.4～1.0 拇指離開管口、u 1.0～2.0 手移開淡出；u 1.0 起水銀柱下降：h(τ) ＝ 76 ＋ 24·e^(−2.65τ)·cos(4τ)（cm，τ＝u−1），
     由 100 cm（全滿）掉到 76 cm，第一次過衝到約 73 cm（τ≈0.8 s），約 3 秒內停穩；「真空」u 3.6；左側量尺 u 4.2、尺寸標「76 cm」u 4.6；字卡 u 6.4。
   第 3 步（11 s）：槽面水平虛線＋「同一水平線」u 0.3；A（管內、柱底）、B（管外槽面）u 0.8；槽面上 5 支大氣壓力箭頭（64 px）＋「大氣壓力」u 1.4；
     柱內往下流的小箭頭＋柱底向下箭頭（64 px，尖端在 A）＋「水銀柱的壓力」u 2.4；u 3.6 右側放大圈：B 向下 70 px、A 向下 70 px＋向上 70 px（同長），
     「同一水平線上，壓力相等」u 4.6；字卡 u 6.4。箭頭長度只表示「一樣大」（同長），不代表數值。
   第 4 步（12 s）：放大圈、箭頭淡出（u 0～0.6）；算式兩行逐塊浮現：「P ＝ h × D ＝ 76 × 13.6」u 0.6～2.8、「＝ 1033.6 gw/cm² ＝ 1 atm」u 3.0～4.8；
     右側 1 cm² 細水銀柱（寬 26 px 示意、高 76 cm＝274 px 照比例）由下長高 u 5.0～6.4，黃虛線連到管內水銀頂（同高）；
     「體積 76 cm³」u 6.4、「× 13.6 ＝ 1033.6 gw」u 7.0；1 cm² 空氣柱＋向下箭頭＋「1033.6 gw」u 7.8～8.6；「一樣重」u 9.0；字卡 u 9.6。
   版面：地面 GY 486；水銀槽內壁 x 130～470、內底 480、槽口 420；管子中線 x 330；左側量尺 x 175（0～100 cm，數字在左）；尺寸標 x 245；
     放大圈中心 (745,285) 半徑 145；第 4 步：算式左緣 x 520、兩行 y 112／160；細水銀柱 x 580、空氣柱 x 880。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.baroTube) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, TEAL = COL.teal, PR = M5.PC.pressure, HG = M5.PC.hg;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const K = 3.6, GY = 486, SURF = 448;
  const TX = 330, DIP = 22, LEN = 360 + DIP, HW = 10;    /* 管子：中線、插入深度、總長、內半寬 */
  const TR = { x0: 130, x1: 470, bot: 480, top: 420 };
  const RUL = 175, DIMX = 245;
  const Y76 = SURF - 76 * K;                             /* 174.4 */
  const ZC = [745, 270], ZR = 135;
  /* 第 1 步：裝水銀的姿勢（開口朝右上）與倒插前、後的姿勢（用管子中點＋角度描述） */
  const ANG_FILL = Math.PI + 0.7, ANG_END = TAU;
  const MOUTH_FILL = [760, 165];
  const C_FILL = [MOUTH_FILL[0] + Math.sin(ANG_FILL) * LEN / 2, MOUTH_FILL[1] - Math.cos(ANG_FILL) * LEN / 2];
  const C_PRE = [TX, SURF + DIP - LEN / 2 - 38], C_END = [TX, SURF + DIP - LEN / 2];
  const BEAK = [766, 100];                               /* 燒杯傾倒口（旋轉支點） */

  /* ── 時間函式（純函式） ── */
  /* 管子的姿勢：{ x,y 管口, ang } */
  function pose(s) {
    let cx, cy, ang;
    if (s.n === 1) {
      const r = ease(clamp01((s.u - 5.4) / 2.6)), d = ease(clamp01((s.u - 8.0) / 1.2));
      ang = lerp(ANG_FILL, ANG_END, r);
      cx = lerp(C_FILL[0], C_PRE[0], r); cy = lerp(C_FILL[1], C_PRE[1], r) - 40 * Math.sin(Math.PI * r);   /* 轉的時候稍微抬高 */
      cy = lerp(cy, C_END[1], d);
    } else { cx = C_END[0]; cy = C_END[1]; ang = ANG_END; }
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    return { x: cx - ux * LEN / 2, y: cy - uy * LEN / 2, ang };
  }
  /* 管內水銀柱高（cm，由槽面量起）：第 2 步才掉下來 */
  function hCol(s) {
    if (s.n === 1) return null;
    if (s.n > 2) return 76;
    const tau = s.u - 1.0;
    if (tau <= 0) return 100;
    return 76 + 24 * Math.exp(-2.65 * tau) * Math.cos(4 * tau);
  }
  /* 管內液面 y（世界座標） */
  function tubeLevel(s) {
    if (s.n === 1) {
      if (s.u < 4.6) return lerp(470, 150, ease(clamp01((s.u - 1.4) / 3.0)));    /* 裝水銀：由封閉端（最低點）升到管口 */
      return -Infinity;                                                          /* 裝滿 */
    }
    const h = hCol(s); return h >= 100 ? -Infinity : SURF - h * K;
  }
  const thumbK = s => (s.n === 1 ? ease(clamp01((s.u - 4.6) / 0.6)) : s.n === 2 ? 1 - ease(clamp01((s.u - 0.4) / 0.6)) : 0);
  const handA = s => (s.n === 1 ? clamp01((s.u - 0.3) / 0.5) : s.n === 2 ? 1 - clamp01((s.u - 1.0) / 1.0) : 0);
  const handOff = s => (s.n === 2 ? ease(clamp01((s.u - 1.0) / 1.0)) : 0);
  const s3A = s => (s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.6) : 0);     /* 第 3 步的東西，第 4 步開頭淡出 */

  /* ═══════════ 槽、管子、手 ═══════════ */
  function trough(c, s) {
    return M5.trough(c, Object.assign({ level: SURF, t: s.t, wob: 1.3 }, TR));
  }
  function tube(c, s) {
    const p = pose(s);
    return M5.baroTube(c, { x: p.x, y: p.y, len: LEN, ang: p.ang, hw: HW, level: tubeLevel(s), a: s.n === 1 ? fin(s, 1, 0, 0.5) : 1 });
  }
  /* 握住管子的手（管子局部座標：管口在 (0,0)、封閉端朝 −y）＋大拇指蓋管口 */
  function hand(c, s) {
    const a = handA(s); if (a <= 0.02) return;
    const p = pose(s), tk = thumbK(s), off = handOff(s), S = M4.SKIN;
    const ux = Math.sin(p.ang), uy = -Math.cos(p.ang);
    const fx = p.x + ux * 46 + 60 * off, fy = p.y + uy * 46 + 26 * off;       /* 拳頭中心（世界座標） */
    withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      /* 前臂（往右下延伸、淡出） */
      const g = c.createLinearGradient(fx, fy, fx + 96, fy - 22);
      g.addColorStop(0, S.sleeve); g.addColorStop(1, W5.rgba(S.sleeve, 0));
      c.strokeStyle = g; c.lineWidth = 26; c.beginPath(); c.moveTo(fx + 10, fy - 2); c.lineTo(fx + 96, fy - 22); c.stroke();
      /* 拳頭與拇指（跟著管子轉） */
      c.translate(fx, fy); c.rotate(p.ang);
      c.fillStyle = S.fill; c.strokeStyle = S.line; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 24, 21, 0, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = W5.rgba('#8a5536', 0.6); c.lineWidth = 2;
      [-9, 0, 9].forEach(yy => { c.beginPath(); c.moveTo(8, yy - 4); c.quadraticCurveTo(16, yy, 8, yy + 4); c.stroke(); });
      /* 拇指：休息位置（拳頭左側）→ 蓋住管口（局部 (0, 46＋8)） */
      const tx = lerp(-26, 0, tk), ty = lerp(14, 54, tk);
      c.strokeStyle = S.line; c.lineWidth = 16; c.beginPath(); c.moveTo(-14, 8); c.lineTo(tx, ty); c.stroke();
      c.strokeStyle = S.fill; c.lineWidth = 13; c.beginPath(); c.moveTo(-14, 8); c.lineTo(tx, ty); c.stroke();
      c.fillStyle = S.fill; c.strokeStyle = S.line; c.lineWidth = 2;
      c.beginPath(); c.ellipse(tx, ty, lerp(8, 17, tk), 8, 0, 0, TAU); c.fill(); c.stroke();
      c.restore();
    });
  }

  /* ═══════════ 第 1 步：燒杯倒水銀 ═══════════ */
  function beaker(c, s) {
    if (s.n !== 1) return;
    const a = fin(s, 1, 0.5, 0.5) * fout(s, 1, 4.6, 0.6); if (a <= 0.02) return;
    const pour = clamp01((s.u - 1.4) / 3.0);
    const th = -1.1, [bx, by] = BEAK;
    const lv = by + lerp(2, 26, ease(pour));            /* 燒杯裡的水銀慢慢變少（液面世界座標） */
    const body = cc => { cc.beginPath(); cc.moveTo(0, 0); cc.lineTo(0, 64); cc.lineTo(56, 64); cc.lineTo(56, -4); cc.closePath(); };
    withA(c, a, () => {
      c.save(); c.translate(bx, by); c.rotate(th);
      body(c); c.fillStyle = 'rgba(190,230,255,0.10)'; c.fill();
      c.save(); body(c); c.clip(); c.rotate(-th); c.translate(-bx, -by);
      c.fillStyle = M5.liqFill(HG, c, bx, lv, bx + 60, lv + 60); c.fillRect(bx - 20, lv, 140, 120);
      c.strokeStyle = '#f6f9fa'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(bx - 20, lv); c.lineTo(bx + 120, lv); c.stroke();
      c.restore();
      c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = 7; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-6, -4); c.lineTo(0, 0); c.lineTo(0, 64); c.lineTo(56, 64); c.lineTo(56, -4); c.stroke();
      c.strokeStyle = 'rgba(200,236,255,0.92)'; c.lineWidth = 4; c.stroke();
      c.restore();
    });
    /* 倒出的水銀細流：傾倒口 → 管口 */
    const fa = a * clamp01((s.u - 1.3) / 0.3) * (1 - clamp01((s.u - 4.3) / 0.3));
    M4.pourLiquid(c, bx - 6, by + 6, MOUTH_FILL[1] - 2, { col: HG, hi: '#ffffff', rim: '#ffffff', w: 6, t: s.t, a: fa, rw: 10 });
    T(c, fin(s, 1, 0.8, 0.5) * fout(s, 1, 5.0, 0.5), L('水銀 D ＝ 13.6', 'Mercury, D = 13.6'), 712, 112, HG, 22, 'right');
  }

  /* ═══════════ 量尺、尺寸標、真空 ═══════════ */
  function measures(c, s) {
    if (s.n === 1) return;
    const ra = fin(s, 2, 4.2, 0.6);
    M4.sideRuler(c, RUL, SURF, K, 100, { side: 'left', nums: [0, 20, 40, 60, 80, 100], a: ra });
    T(c, ra, 'cm', RUL, 88 - 20, DIM, 22, 'center', true);
    /* 管內水銀頂 → 量尺的黃虛線、尺寸標 */
    const dg = grow(s, 2, 4.6, 5.4), da = fin(s, 2, 4.6, 0.3);
    withA(c, da, () => {
      c.save(); c.strokeStyle = W5.rgba(YEL, 0.9); c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -s.t * 10;
      c.beginPath(); c.moveTo(RUL + 8, Y76); c.lineTo(TX - HW - 6, Y76); c.stroke(); c.setLineDash([]); c.restore();
    });
    M5.dimV(c, DIMX, SURF, Y76, '76 cm', { a: da, g: dg });
    /* 真空 */
    const va = fin(s, 2, 3.6, 0.5);
    P(c, va, L('真空', 'Vacuum'), TX + 32, 128, TEAL, 22, 'left');
    withA(c, va, () => { c.save(); c.strokeStyle = W5.rgba(TEAL, 0.85); c.lineWidth = 2; c.beginPath(); c.moveTo(TX + 30, 128); c.lineTo(TX + 4, 132); c.stroke(); c.restore(); });
    /* 放開手指 */
    T(c, fin(s, 2, 0.3, 0.4) * fout(s, 2, 2.6, 0.5), L('放開手指', 'Let go'), 400, 396, WHITE, 22, 'left');
  }

  /* ═══════════ 第 3 步：同一水平線、A 與 B ═══════════ */
  function balance(c, s) {
    const a = s3A(s); if (a <= 0.02) return;
    const t = s.t;
    /* 水平虛線 */
    const lg = grow(s, 3, 0.3, 1.0);
    withA(c, a * fin(s, 3, 0.3, 0.3), () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5; c.setLineDash([10, 7]); c.lineDashOffset = -t * 14;
      c.beginPath(); c.moveTo(20, SURF); c.lineTo(lerp(20, 498, lg), SURF); c.stroke(); c.setLineDash([]); c.restore();
    });
    T(c, a * fin(s, 3, 0.9, 0.5), L('同一水平線', 'Same level'), 114, SURF - 22, YEL, 22, 'right');
    /* A、B 兩點 */
    const pa = a * fin(s, 3, 0.8, 0.4), BX = 420;
    withA(c, pa, () => {
      [[TX, SURF], [BX, SURF]].forEach(([x, y]) => { c.save(); c.fillStyle = YEL; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.stroke(); c.restore(); });
    });
    T(c, pa, 'A', TX - 24, SURF + 18, YEL, 24, 'center', true);
    T(c, pa, 'B', BX + 26, SURF + 18, YEL, 24, 'center', true);
    /* 槽面上的大氣壓力（B 那一支在 x 420） */
    const ga = grow(s, 3, 1.4, 2.0), aa = a * fin(s, 3, 1.4, 0.3);
    [205, 285, 380, BX, 455].forEach((x, k) => M5.pArrowAt(c, x, SURF - 4, Math.PI / 2, 64 * ga * (1 + 0.05 * Math.sin(t * 3.2 + k * 1.7)), { a: aa, lw: 6 }));
    M4.pPill(c, a * fin(s, 3, 1.8, 0.5), L('大氣壓力', 'Air pressure'), BX, 344, 22);
    /* 柱內：往下流的小箭頭＋柱底（A）向下箭頭 */
    const ca = a * fin(s, 3, 2.4, 0.5);
    withA(c, ca, () => {
      c.save(); c.beginPath(); c.rect(TX - HW + 2, Y76 + 6, 2 * HW - 4, SURF - 70 - Y76 - 10); c.clip();
      c.strokeStyle = W5.rgba(PR, 0.85); c.lineWidth = 2.5; c.lineCap = 'round';
      for (let k = 0; k < 9; k++) {
        const y = Y76 + ((k * 34 + t * 40) % 306);
        c.beginPath(); c.moveTo(TX - 5, y - 5); c.lineTo(TX, y); c.lineTo(TX + 5, y - 5); c.stroke();
      }
      c.restore();
    });
    M5.pArrowAt(c, TX, SURF - 4, Math.PI / 2, 64 * grow(s, 3, 2.4, 3.0), { a: ca, lw: 4 });
    P(c, ca, L('水銀柱的壓力', 'Column pressure'), TX + 30, 250, PR, 22, 'left');
    withA(c, ca, () => { c.save(); c.strokeStyle = W5.rgba(PR, 0.85); c.lineWidth = 2; c.beginPath(); c.moveTo(TX + 28, 256); c.lineTo(TX + HW + 4, 282); c.stroke(); c.restore(); });
    /* 放大圈 */
    const za = a * fin(s, 3, 3.6, 0.6);
    M4.zoomLeader(c, 375, SURF, ZC[0], ZC[1], ZR, { a: za * 0.8, mark: 50, col: WHITE });
    M3.magnifier(c, ZC[0], ZC[1], ZR, { a: za, handleA: 0, rim: 8, glassA: 0.6, inner: cc => zoomInner(cc, s, za) });
    P(c, a * fin(s, 3, 4.6, 0.5), L('同一水平線上，壓力相等', 'Same level → same pressure'), 935, 444, YEL, 22, 'right');
  }
  /* 放大圈內：左邊是管子底部（A 在柱底），右邊是槽面（B） */
  function zoomInner(c, s, za) {
    const [cx, cy] = ZC, sy = cy + 22, ax = cx - 62, bx = cx + 72, hw = 30, t = s.t;
    c.fillStyle = '#0f2620'; c.fillRect(cx - ZR, cy - ZR, 2 * ZR, 2 * ZR);
    M5.airSea(c, cx - ZR, cy - ZR, cx + ZR, sy, { n: 26, seed: 7, t, dense: 0.5, fillA: 0.18 });
    /* 槽內水銀 */
    c.fillStyle = M5.liqFill(HG, c, 0, sy, 0, cy + ZR); c.fillRect(cx - ZR, sy, 2 * ZR, ZR);
    c.strokeStyle = '#f4f8fa'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - ZR, sy); c.lineTo(cx + ZR, sy); c.stroke();
    /* 管子（放大）：柱一直延伸到上面 */
    c.fillStyle = M5.liqFill(HG, c, ax - hw, 0, ax + hw, 0); c.fillRect(ax - hw, cy - ZR, 2 * hw, ZR + 60);
    c.strokeStyle = 'rgba(200,236,255,0.92)'; c.lineWidth = 6;
    [ax - hw - 3, ax + hw + 3].forEach(x => { c.beginPath(); c.moveTo(x, cy - ZR); c.lineTo(x, sy + 44); c.stroke(); });
    /* 同一水平線 */
    c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5; c.setLineDash([10, 7]); c.lineDashOffset = -t * 14;
    c.beginPath(); c.moveTo(cx - ZR, sy); c.lineTo(cx + ZR, sy); c.stroke(); c.restore();
    /* 箭頭：同長 70 px */
    const g = ease(clamp01((s.n === 3 ? s.u - 3.9 : 9) / 0.7)), Lz = 70 * g, p = 1 + 0.04 * Math.sin(t * 3.2);
    M5.pArrowAt(c, bx, sy - 5, Math.PI / 2, Lz * p, { a: 1, lw: 6 });
    M5.pArrowAt(c, ax, sy - 5, Math.PI / 2, Lz * p, { a: 1, lw: 6 });
    M5.pArrowAt(c, ax, sy + 5, -Math.PI / 2, Lz * p, { a: 1, lw: 6 });
    [[ax, sy], [bx, sy]].forEach(([x, y]) => { c.fillStyle = YEL; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); c.stroke(); });
    T(c, 1, 'A', ax - hw - 22, sy + 24, YEL, 24, 'center', true);
    T(c, 1, 'B', bx + 30, sy + 24, YEL, 24, 'center', true);
  }

  /* ═══════════ 第 4 步：算出 1 atm ═══════════ */
  const CX1 = 580, CW = 26, AX = 900, EQX = 618;
  function calc(c, s) {
    if (s.n !== 4) return;
    const u = s.u, t = s.t;
    const r1 = clamp01((u - 0.6) / 2.2) * 5, r2 = clamp01((u - 3.0) / 1.8) * 4;
    /* 算式：四行往下排（每行左緣對齊 EQX，「＝」對齊） */
    const row = (y, show, toks) => M3.eqRow(c, { x: EQX, y, align: 'left', size: 28, mono: true, show, tokens: toks });
    row(108, clamp01(r1 / 2.5) * 3, [{ t: 'P', col: PR }, { t: '＝', col: WHITE }, { t: 'h × D', col: WHITE }]);
    const row2 = (y, show, tok) => M3.eqRow(c, { x: EQX + 22, y, align: 'left', size: 28, mono: true, show, tokens: [tok] });
    row2(152, clamp01((r1 - 2.5) / 2.5), { t: '＝ 76 × 13.6', col: YEL });
    row2(198, clamp01(r2 / 2), { t: '＝ 1033.6 gw/cm²', col: YEL, pill: true });
    row2(248, clamp01((r2 - 2) / 2), { t: '＝ 1 atm', col: PR, pill: true });
    /* 1 cm² 細水銀柱（高 76 cm，照比例） */
    const hg = ease(clamp01((u - 5.0) / 1.4)), top = lerp(SURF, Y76, hg), ca = clamp01((u - 4.9) / 0.3);
    withA(c, ca, () => {
      c.save();
      c.fillStyle = M5.liqFill(HG, c, CX1 - CW / 2, 0, CX1 + CW / 2, 0); c.fillRect(CX1 - CW / 2, top, CW, SURF - top);
      c.strokeStyle = '#f6f9fa'; c.lineWidth = 2.5; c.strokeRect(CX1 - CW / 2, top, CW, SURF - top);
      c.fillStyle = '#8b99a3'; c.fillRect(CX1 - CW / 2 - 8, SURF, CW + 16, 7);
      c.restore();
    });
    T(c, ca, '1 cm²', CX1, 470, WHITE, 22, 'center', true);
    const la = fin(s, 4, 6.4, 0.5);
    withA(c, la, () => {
      c.save(); c.strokeStyle = W5.rgba(YEL, 0.9); c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -t * 10;
      c.beginPath(); c.moveTo(TX + HW + 8, Y76); c.lineTo(CX1 - CW / 2 - 4, Y76); c.stroke(); c.setLineDash([]); c.restore();
    });
    T(c, la, L('體積 76 cm³', 'Volume 76 cm³'), CX1 + 30, 330, WHITE, 22, 'left');
    T(c, fin(s, 4, 7.0, 0.5), '× 13.6 ＝ 1033.6 gw', CX1 + 30, 368, YEL, 22, 'left', true);
    /* 1 cm² 的空氣柱 */
    const aa = fin(s, 4, 7.8, 0.6);
    M5.airCol(c, AX - CW / 2, 286, AX + CW / 2, SURF, { a: aa, t, seed: 23, n: 16 });
    withA(c, aa, () => { c.save(); c.fillStyle = '#8b99a3'; c.fillRect(AX - CW / 2 - 8, SURF, CW + 16, 7); c.restore(); });
    M5.pArrowAt(c, AX, SURF - 4, Math.PI / 2, 120 * grow(s, 4, 8.0, 8.7) * (1 + 0.04 * Math.sin(t * 3.2)), { a: aa, lw: 7 });
    T(c, aa, L('1 cm² 的空氣柱', '1 cm² air column'), 948, 290, M5.PC.sea, 22, 'right');
    M4.pPill(c, fin(s, 4, 8.6, 0.5), '1033.6 gw', AX - 18, 470, 22);
    P(c, fin(s, 4, 9.0, 0.5), L('一樣重', 'Same weight'), 742, 424, YEL, 24);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('裝滿水銀，倒插', 'Fill with mercury, flip it'),
    () => L('停在 76 cm', 'It stops at 76 cm'),
    () => L('大氣壓撐住', 'Air pressure holds it up'),
    () => L('算出 1 atm', 'Work out 1 atm')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    T(c, fin(s, 1, 4.8, 0.4) * fout(s, 1, 7.4, 0.5), L('手指堵住管口', 'Thumb seals it'), 800, 210, WHITE, 22, 'left');
    M3.caption(c, fin(s, 1, 8.6, 0.6) * fout(s, 2, 0, 0.4), L('裝滿水銀，倒插進水銀槽', 'Fill it, then flip it into the mercury'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 6.4, 0.6) * fout(s, 3, 0, 0.4), L('水銀沒有掉光，停在 76 cm', 'The mercury stops at 76 cm'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 6.4, 0.6) * fout(s, 4, 0, 0.4), L('大氣壓力＝水銀柱的壓力', 'Air pressure = mercury column pressure'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.6, 0.6), L('1 atm ＝ 76 cmHg ＝ 1033.6 gw/cm²', '1 atm = 76 cmHg = 1033.6 gw/cm²'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    trough(c, s);
    tube(c, s);
    hand(c, s);
    beaker(c, s);
    measures(c, s);
    balance(c, s);
    calc(c, s);
    texts(c, s);
  }

  W5.register('torr', { canvas: 'cvs-torr', steps: DUR, draw });
})();
