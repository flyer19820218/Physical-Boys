/* ==================================================================
   mechanics_5 ｜ 大氣壓力：吸管的真相：不是吸，是壓（cvs-straw，960×540）
   四步：1 空氣有重量 → 2 吸走管內空氣 → 3 大氣壓壓飲料 → 4 吸盤
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／slab／mass／caption／dashArrow、M4.cup（經 M5.glass）／hand／pPill／L／T／P／fin／fout／grow、
        M5.airSea／gasDots／pArrowAt／glass／tube（M5 由本檔建立）。

   數字（照簡報）：大氣壓力約 1033.6 gw/cm²（1 cm² 受到約 1033.6 gw）。畫面上沒有其他數字。
   第 1 步（11 s）：空氣海洋由上往下罩住整個畫面（u 0.3～2.3）→ 1 cm² 方塊上的空氣柱、4 個「示意」砝碼一個個疊下（u 3.0～5.3）
     → 珊瑚箭頭（∝ 示意，不是比例）指向方塊頂面＋「1 cm² 受到約 1033.6 gw」（u 5.4）→ 杯子、方塊四周的箭頭（u 6.6）→ 字卡（u 8.0）。
   第 2 步（11 s）：吸管滑進杯子（u 0.3～1.8，管內外液面一樣高）→ 側臉含住吸管（u 1.6～2.6）→ 管內 12 顆空氣分子被一顆顆抽進嘴裡
     （u 2.8～9.0，剩 2～3 顆）；管內箭頭由 66 px 縮成 16 px（長度 ∝ 管內剩下的分子比例，示意），杯內液面上的箭頭固定 66 px。
   第 3 步（11 s）：飲料沿吸管上升到嘴邊（u 0.8～4.8）；杯內液面先降 6 px、之後慢慢再降 8 px（一直在喝）。沒有任何向上的「吸力」箭頭。
   第 4 步（12 s）：左邊淡出（0.22），右側吸盤：靠近光滑牆面 → 手壓平、空氣從邊緣擠出（u 2.4～4.0）→ 放手（u 4.2）→ 外面 7 支長箭頭、
     裡面 2 支短箭頭（u 5.0）→ 掛上小重物（u 6.6，示意不標數字）→ 字卡（u 8.2）。
   比例尺：示意圖，箭頭長短只比「大／小」，不代表數值（畫面第 1 步標「示意」）。
   版面：桌面 GY 452（M3.slab 452～466）；杯子中線 300、內底 442、杯口 262、內底半寬 58、杯口內半寬 76、果汁液面 352；
     吸管中線 x 322（管內半寬 7、壁 3），下端 432，直上到 160 後彎向左，嘴端 (236,137)；側臉嘴唇中心 (232,137)、頭頂 y 39；
     1 cm² 方塊 x 520～560、y 412～452，空氣柱 y 96～412；吸盤：牆面 x 880（磁磚牆 880～940）、吸盤中線 y 250、半高 62。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.tube) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PR = M5.PC.pressure, JU = M5.PC.juice, JE = M5.PC.juiceEdge;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452;
  const CX = 330, BOT = 442, RIM = 240, RB = 72, RT = 94, LV0 = 341;
  const half = y => RB + (RT - RB) * (BOT - y) / (BOT - RIM);
  const SX = 366, SB = 432, HW = 10, SY = 152;            /* 吸管：中線 x、下端、管內半寬、嘴端那段的 y */
  const STRAW = [[SX, SB], [SX, SY + 24], [SX - 2, SY + 14], [SX - 8, SY + 6], [SX - 17, SY + 1.5], [SX - 28, SY], [268, SY]];
  const SP = M5.poly(STRAW);
  const MOUTH = [264, SY], FS = 1.15;                     /* 嘴唇中心、側臉縮放 */
  const CUBE = { x0: 570, x1: 610, y0: 412 }, COLY0 = 96;
  const WALLX = 800, CYS = 250, RV = 96;                  /* 吸盤：牆面 x、中線 y、半高 */

  /* ── 時間函式（純函式） ── */
  const strawDy = s => (s.n === 1 ? null : s.n === 2 ? -60 * (1 - ease(clamp01((s.u - 0.3) / 1.5))) : 0);
  const pumpK = s => (s.n < 2 ? 0 : s.n > 2 ? 1 : clamp01((s.u - 2.8) / 6.2));
  const riseK = s => (s.n < 3 ? 0 : s.n > 3 ? 1 : ease(clamp01((s.u - 0.8) / 4.0)));
  function level(s) {
    if (s.n < 3) return LV0;
    const drink = s.n === 3 ? clamp01((s.u - 4.8) / 6.2) : 1;
    return LV0 + 6 * riseK(s) + 8 * drink;
  }
  /* 吸管內液體長度（由下端量起）：第 2 步＝跟杯內一樣高；第 3 步升到嘴邊 */
  function strawFill(s, dy, lv) {
    const base = Math.max(0, (SB + dy) - lv);
    return lerp(base, SP.len - 1, riseK(s));
  }
  const leftA = s => (s.n === 4 ? 1 - 0.85 * ease(clamp01(s.u / 0.8)) : 1);   /* 第 4 步左邊淡出 */

  /* ═══════════ 背景：空氣的海洋 ═══════════ */
  function sea(c, s) {
    const bot = s.n === 1 ? lerp(170, GY, ease(clamp01((s.u - 0.3) / 2.0))) : GY;
    const dy = strawDy(s), lv = level(s), sd = sucker(s);
    const holes = [];
    holes.push(cc => {                                   /* 杯內液體不畫點 */
      const h = half(lv); cc.moveTo(CX - h, lv); cc.lineTo(CX + h, lv); cc.lineTo(CX + RB, BOT); cc.lineTo(CX - RB, BOT); cc.closePath();
    });
    if (dy !== null) holes.push(cc => {                  /* 吸管內（另外畫） */
      const e = HW + 4;
      cc.moveTo(SX - e, SY - e + dy); cc.lineTo(SX + e, SY - e + dy); cc.lineTo(SX + e, SB + dy); cc.lineTo(SX - e, SB + dy); cc.closePath();
      cc.moveTo(250, SY - e + dy); cc.lineTo(SX - e, SY - e + dy); cc.lineTo(SX - e, SY + e + dy); cc.lineTo(250, SY + e + dy); cc.closePath();
    });
    if (sd) holes.push(cc => { cc.moveTo(sd.rx, CYS - sd.ry); cc.ellipse(sd.rx, CYS, Math.max(1, sd.d), sd.ry, 0, -Math.PI / 2, Math.PI / 2, true); cc.closePath(); });
    M5.airSea(c, 0, 34, 960, bot, { n: 150, seed: 9, t: s.t, dense: 0.7, fillA: 0.24, holes });
    if (bot < GY - 1) {                                  /* 往下罩的時候，下緣是柔和的漸層 */
      const fy = Math.min(GY, bot + 60), g = c.createLinearGradient(0, bot, 0, fy);
      g.addColorStop(0, W5.rgba(M5.PC.sea, 0.24)); g.addColorStop(1, W5.rgba(M5.PC.sea, 0));
      c.save(); c.fillStyle = g; c.fillRect(0, bot, 960, fy - bot); c.restore();
    }
    /* 海洋的上緣光（「空氣的海洋」標籤，第 1 步） */
    const la = fin(s, 1, 0.6, 0.6) * fout(s, 1, 7.6, 0.6);
    T(c, la, L('空氣的海洋', 'An ocean of air'), 120, 92, M5.PC.sea, 22);
  }

  /* ═══════════ 桌子、杯子 ═══════════ */
  function table(c) {
    M3.ground(c, GY);
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 4 });
  }
  function cup(c, s) {
    return M5.glass(c, { cx: CX, bot: BOT, rim: RIM, rb: RB, rt: RT, level: level(s), wall: 6, base: 10, t: s.t, wob: 1.2,
      col: JU, edge: JE, glow: s.n === 3 ? 0.4 : 0 });
  }

  /* ═══════════ 第 1 步：1 cm² 方塊＋空氣柱＋砝碼 ═══════════ */
  function cube(c, s) {
    const a = s.n === 1 ? fin(s, 1, 2.0, 0.6) : s.n === 2 ? fout(s, 2, 0, 0.6) : 0;
    if (a <= 0.02) return;
    const { x0, x1, y0 } = CUBE, w = x1 - x0;
    /* 空氣柱（虛線框＋淡藍底，往下罩） */
    const cg = s.n === 1 ? ease(clamp01((s.u - 2.0) / 0.9)) : 1;
    const cy0 = lerp(y0, COLY0, cg);
    withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, cy0, 0, y0); g.addColorStop(0, W5.rgba(M5.PC.sea, 0.08)); g.addColorStop(1, W5.rgba(M5.PC.sea, 0.3));
      c.fillStyle = g; c.fillRect(x0, cy0, w, y0 - cy0);
      c.strokeStyle = W5.rgba(M5.PC.sea, 0.9); c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -s.t * 12;
      c.beginPath(); c.moveTo(x0, cy0); c.lineTo(x0, y0); c.moveTo(x1, cy0); c.lineTo(x1, y0); c.stroke(); c.setLineDash([]);
      /* 方塊（淺色木塊） */
      c.restore();
    });
    M3.block(c, (x0 + x1) / 2, GY, w, GY - y0, { a, seed: 3 });
    T(c, a, '1 cm²', x0 - 42, (y0 + GY) / 2, WHITE, 22, 'right', true);
    /* 砝碼：4 個一個個從空氣柱上方掉下來疊好（示意空氣的重量） */
    let by = 300;
    for (let i = 0; i < 4; i++) {
      const t0 = 3.0 + 0.6 * i, f = s.n === 1 ? ease(clamp01((s.u - t0) / 0.5)) : 1;
      if (f <= 0) break;
      const ma = a * clamp01(f * 3) * 0.92;
      const yy = lerp(COLY0 + 20, by, f);
      const top = M3.mass(c, (x0 + x1) / 2, yy, { w: 34, h: 18, a: ma });
      if (f >= 1) by = top + 7;   /* 落定了，下一個疊在這個的頂面 */
      else break;
    }
    T(c, a * fin(s, 1, 4.0, 0.5), L('示意', 'Not to scale'), x1 + 12, 232, DIM, 22, 'left');
    /* 箭頭：空氣柱壓在 1 cm² 上 */
    const g2 = grow(s, 1, 5.4, 6.2);
    M5.pArrowAt(c, (x0 + x1) / 2, y0 - 3, Math.PI / 2, 100 * g2, { a, lw: 7 });
    M4.pPill(c, a * fin(s, 1, 6.0, 0.5), L('1 cm² 受到約 1033.6 gw', '1 cm² feels about 1033.6 gw'), x1 + 14, 362, 22, 'left');
  }

  /* 杯子＋方塊四周：從四面八方來的大氣壓力（第 1 步 u 6.6 起） */
  function allSides(c, s) {
    const a = s.n === 1 ? fin(s, 1, 6.6, 0.7) : s.n === 2 ? fout(s, 2, 0, 0.6) : 0;
    if (a <= 0.02) return;
    const g = s.n === 1 ? ease(clamp01((s.u - 6.6) / 0.8)) : 1, t = s.t, len = k => 40 * g * (1 + 0.07 * Math.sin(t * 3.2 + k));
    const dx = 6 * Math.hypot(BOT - RIM, RT - RB) / (BOT - RIM), tilt = Math.atan2(RT - RB, BOT - RIM);
    /* 液面（向下） */
    [290, 330].forEach((x, k) => M5.pArrowAt(c, x, LV0 - 3, Math.PI / 2, len(k), { a }));
    /* 杯壁（垂直於斜壁，朝內） */
    [300, 404].forEach((y, k) => {
      const h = half(y) + dx + 3;
      M5.pArrowAt(c, CX - h, y, tilt, len(k + 2), { a });
      M5.pArrowAt(c, CX + h, y, Math.PI - tilt, len(k + 4), { a });
    });
    /* 方塊兩側 */
    M5.pArrowAt(c, CUBE.x0 - 3, 432, 0, 30 * g, { a: a * (s.n === 1 ? 1 : 0) });
    M5.pArrowAt(c, CUBE.x1 + 3, 432, Math.PI, 30 * g, { a: a * (s.n === 1 ? 1 : 0) });
    P(c, a * fin(s, 1, 7.2, 0.5) * (s.n === 1 ? 1 : 0), L('四面八方都有', 'From every direction'), 150, 196, PR, 22);
  }

  /* ═══════════ 吸管、嘴巴 ═══════════ */
  function straw(c, s) {
    const dy = strawDy(s); if (dy === null) return;
    const a = s.n === 2 ? fin(s, 2, 0.3, 0.5) : 1;
    const lv = level(s), fill = strawFill(s, dy, lv);
    c.save(); c.translate(0, dy);
    M5.tube(c, STRAW, { hw: HW, wall: 3, fill, col: JU, t: s.t, flow: s.n === 3 ? riseK(s) : 0, stripe: '#4dd2ff', a });
    c.restore();
  }
  /* 管內空氣分子（第 2 步被抽走；第 3 步剩下的被液體往上推） */
  function strawAir(c, s) {
    const dy = strawDy(s); if (dy === null) return 1;
    const lv = level(s), fill = strawFill(s, dy, lv);
    const front = SP.at(fill)[1] + dy;
    const y1 = Math.max(SY + 22 + dy, front - 5), y0 = SY + 18 + dy;
    const a = (s.n === 2 ? fin(s, 2, 0.6, 0.6) : 1) * clamp01((y1 - y0 - 6) / 20);
    return M5.gasDots(c, { box: [SX - 5, y0, SX + 5, y1], cols: 1, n: 12, seed: 31, t: s.t, r: 3.6, col: '#ffffff', jig: 1.4,
      k: pumpK(s), frac: 0.8, win: 0.25, path: [[SX - 1, SY + 14 + dy], [SX - 8, SY + 6 + dy], [SX - 28, SY + dy], [262, SY + dy], [236, SY + 4 + dy]], a: a * leftA(s) });
  }
  function face(c, s) {
    if (s.n === 1) return;
    const sl = s.n === 2 ? ease(clamp01((s.u - 1.6) / 1.0)) : 1;
    const a = (s.n === 2 ? clamp01((s.u - 1.6) / 0.5) : 1);
    if (a <= 0.02) return;
    const ox = -140 * (1 - sl);
    /* 吸的動作：第 2 步抽氣時臉頰一縮一縮、嘴唇嘟起；第 3 步慢慢在喝 */
    const pump = s.n === 2 && s.u > 2.8 && s.u < 9.2 ? 0.5 + 0.5 * Math.sin((s.u - 2.8) * 4.2 - Math.PI / 2) : s.n === 3 ? 0.25 + 0.25 * Math.sin(s.u * 3) : 0;
    const S = M4.SKIN, mx = MOUTH[0] + ox, my = MOUTH[1];
    withA(c, a, () => {
      c.save(); c.translate(mx, my); c.scale(FS, FS); c.lineJoin = 'round'; c.lineCap = 'round';
      /* 脖子 */
      const ng = c.createLinearGradient(0, 30, 0, 112); ng.addColorStop(0, S.fill); ng.addColorStop(1, W5.rgba(S.fill, 0));
      c.fillStyle = ng; c.beginPath(); c.moveTo(-104, 24); c.lineTo(-58, 32); c.lineTo(-54, 112); c.lineTo(-108, 112); c.closePath(); c.fill();
      /* 頭：後腦＋臉＋下巴（側臉朝右） */
      c.fillStyle = S.fill; c.strokeStyle = S.line; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-60, -96);
      c.bezierCurveTo(-28, -96, -16, -78, -16, -60);            /* 額頭 */
      c.lineTo(-12, -46); c.lineTo(-2, -30); c.lineTo(-13, -24); /* 鼻子 */
      c.lineTo(-12, -12);                                         /* 人中 */
      c.lineTo(-14, 10);                                          /* 嘴 */
      c.bezierCurveTo(-12, 24, -22, 34, -40, 34);                 /* 下巴 */
      c.bezierCurveTo(-70, 34, -96, 30, -112, 10);                /* 下顎 */
      c.bezierCurveTo(-140, -20, -134, -96, -60, -96);            /* 後腦 */
      c.closePath(); c.fill(); c.stroke();
      /* 臉頰往內縮（吸的時候） */
      if (pump > 0.02) {
        const cg = c.createRadialGradient(-38, -2, 2, -38, -2, 20);
        cg.addColorStop(0, W5.rgba('#b9764a', 0.45 * pump)); cg.addColorStop(1, W5.rgba('#b9764a', 0));
        c.fillStyle = cg; c.beginPath(); c.arc(-38, -2, 20, 0, TAU); c.fill();
      }
      /* 頭髮 */
      c.fillStyle = '#3a2a22';
      c.beginPath(); c.moveTo(-18, -70); c.bezierCurveTo(-24, -100, -86, -110, -118, -66);
      c.bezierCurveTo(-130, -40, -124, -16, -110, -4); c.bezierCurveTo(-112, -30, -100, -52, -76, -64);
      c.bezierCurveTo(-56, -72, -36, -66, -18, -70); c.closePath(); c.fill();
      /* 耳朵 */
      c.fillStyle = S.shade; c.beginPath(); c.ellipse(-80, -30, 8, 12, 0.2, 0, TAU); c.fill();
      /* 眼睛、眉毛 */
      c.fillStyle = '#2b2420'; c.beginPath(); c.ellipse(-30, -54, 3.2, 4.2, 0, 0, TAU); c.fill();
      c.strokeStyle = '#3a2a22'; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, -66); c.lineTo(-24, -67); c.stroke();
      /* 嘴唇含住吸管（嘟起） */
      const pk = 1 + 0.12 * pump;
      c.fillStyle = '#d9776a';
      c.beginPath(); c.ellipse(-6, -8 * pk, 9 * pk, 5, -0.2, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(-6, 8 * pk, 9 * pk, 5, 0.2, 0, TAU); c.fill();
      c.restore();
    });
  }

  /* ═══════════ 第 2、3 步：壓力箭頭與標籤 ═══════════ */
  function thinDown(c, x, tipY, len, a) {          /* 管內的細箭頭（管子只有 14 px 寬） */
    if (a <= 0.02 || len < 3) return;
    withA(c, a, () => {
      W5.arrow(c, x, tipY - len, x, tipY, 'rgba(11,26,21,0.85)', 7, 13);
      W5.arrow(c, x, tipY - len, x, tipY, PR, 4, 11);
    });
  }
  function pressure(c, s, dens) {
    if (s.n !== 2 && s.n !== 3) return;
    const la = leftA(s), lv = level(s), t = s.t, dy = strawDy(s);
    /* 杯內自由液面：大氣壓力（長、固定） */
    const oa = s.n === 2 ? fin(s, 2, 3.0, 0.6) : 1;
    const OL = 66;
    [290, 324].forEach((x, k) => M5.pArrowAt(c, x, lv - 3, Math.PI / 2, OL * (1 + 0.06 * Math.sin(t * 3.2 + k * 1.7)), { a: oa * la, lw: 7 }));
    /* 管內液面：壓力變小（長度 ∝ 管內剩下的分子） */
    const fill = strawFill(s, dy, lv), front = SP.at(fill)[1] + dy;
    const il = 16 + 50 * clamp01((dens - 0.2) / 0.8);
    const ia = oa * clamp01((front - SY - 40) / 30);
    thinDown(c, SX, front - 3, Math.min(il, front - SY - 20), ia * la);
    /* 標籤 */
    const l1 = s.n === 2 ? fin(s, 2, 3.4, 0.5) : fout(s, 3, 0.4, 0.5);
    T(c, l1 * la, L('管外：大氣壓力', 'Outside: air pressure'), 226, 300, PR, 22, 'right');
    withA(c, l1 * la, () => { c.save(); c.strokeStyle = W5.rgba(PR, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(230, 306); c.lineTo(282, lv - 34); c.stroke(); c.restore(); });
    const l2 = s.n === 2 ? fin(s, 2, 6.0, 0.5) : fout(s, 3, 0.4, 0.5);
    P(c, l2 * la, L('管內：壓力變小', 'Inside: pressure drops'), 464, 290, PR, 22, 'left');
    withA(c, l2 * la, () => { c.save(); c.strokeStyle = W5.rgba(PR, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(462, 290); c.lineTo(SX + HW + 4, lv - 24); c.stroke(); c.restore(); });
    /* 第 3 步：大氣壓力把飲料壓進吸管（液體流動用虛線，不是力） */
    if (s.n === 3) {
      const fa = fin(s, 3, 0.6, 0.5);
      T(c, fa, L('大氣壓力', 'Air pressure'), 307, lv - OL - 22, PR, 22);
      M3.dashArrow(c, 292, lv + 18, 350, 420, JE, fa * 0.9 * (1 - 0.6 * clamp01((s.u - 9) / 2)), t * 40, { lw: 3, head: 11, dash: [8, 7] });
      const ra = fin(s, 3, 1.2, 0.5);
      P(c, ra, L('飲料被壓上來', 'The drink is pushed up'), 464, 220, JE, 22, 'left');
      withA(c, ra, () => { c.save(); c.strokeStyle = W5.rgba(JE, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(462, 220); c.lineTo(SX + HW + 4, 236); c.stroke(); c.restore(); });
    }
  }

  /* ═══════════ 第 4 步：吸盤 ═══════════ */
  /* 吸盤狀態：rx 邊緣 x、d 鼓起深度、ry 半高 */
  function sucker(s) {
    if (s.n !== 4) return null;
    const u = s.u;
    const move = ease(clamp01((u - 2.4) / 0.4)), flat = ease(clamp01((u - 2.8) / 0.6)), back = ease(clamp01((u - 4.2) / 0.6));
    const rx = lerp(WALLX - 22, WALLX, move);
    const d = lerp(lerp(64, 10, flat), 24, back);
    const ry = lerp(RV, RV + 10, flat) - 4 * back;
    return { rx, d, ry, flat, back };
  }
  function tileWall(c, a) {
    withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(WALLX, 0, 960, 0); g.addColorStop(0, '#dfe9ee'); g.addColorStop(1, '#9fb2bc');
      c.fillStyle = g; c.fillRect(WALLX, 90, 960 - WALLX, GY - 90);
      c.strokeStyle = 'rgba(80,100,110,0.45)'; c.lineWidth = 2;
      for (let y = 90; y <= GY; y += 60) { c.beginPath(); c.moveTo(WALLX, y); c.lineTo(960, y); c.stroke(); }
      for (let x = WALLX + 60; x < 960; x += 60) { c.beginPath(); c.moveTo(x, 90); c.lineTo(x, GY); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(WALLX + 1.5, 90); c.lineTo(WALLX + 1.5, GY); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2.5;
      [[WALLX + 16, 130], [WALLX + 76, 250], [WALLX + 30, 400]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 24, y - 22); c.stroke(); });
      c.restore();
    });
    T(c, a, L('光滑的牆', 'Smooth wall'), (WALLX + 960) / 2, 72, DIM, 22, 'center');
  }
  function suckerDraw(c, sd, a) {
    const knobX = sd.rx - sd.d - 76;
    withA(c, a, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      /* 杯身（藍綠色橡膠，剖面） */
      c.beginPath(); c.moveTo(sd.rx, CYS - sd.ry);
      c.ellipse(sd.rx, CYS, Math.max(1, sd.d), sd.ry, 0, -Math.PI / 2, Math.PI / 2, true);
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 13; c.stroke();
      c.strokeStyle = '#7fd8c6'; c.lineWidth = 9; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(sd.rx, CYS, Math.max(1, sd.d) + 3, sd.ry + 3, 0, -Math.PI * 0.86, -Math.PI * 0.62); c.stroke();
      /* 柄＋圓頭（圓頭下方有小勾） */
      c.fillStyle = '#5fbfae'; c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = 1.6;
      c.fillRect(knobX, CYS - 8, sd.rx - sd.d - knobX + 3, 16); c.strokeRect(knobX, CYS - 8, sd.rx - sd.d - knobX + 3, 16);
      c.fillStyle = '#7fd8c6'; c.beginPath(); c.arc(knobX, CYS, 14, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = '#b9c5cc'; c.lineWidth = 3; c.beginPath(); c.arc(knobX, CYS + 20, 6, -Math.PI * 0.5, Math.PI * 1.2); c.stroke();
      c.restore();
    });
    return { knobX };
  }
  function suction(c, s) {
    const sd = sucker(s); if (!sd) return;
    const u = s.u, t = s.t;
    const a = fin(s, 4, 0.6, 0.8);
    tileWall(c, a);
    /* 吸盤內空氣：壓平時從上下邊緣被擠出去；放手後只剩很疏的兩顆 */
    const box = [sd.rx - Math.max(6, sd.d) + 5, CYS - sd.ry * 0.6, sd.rx - 4, CYS + sd.ry * 0.6];
    const k = clamp01((u - 2.8) / 1.8);
    M5.gasDots(c, { box, n: 7, cols: 2, seed: 41, t, r: 3.8, col: '#ffffff', jig: 1.4, k, frac: 0.8, win: 0.45,
      path: [[sd.rx - 4, CYS - sd.ry + 6], [sd.rx - 30, CYS - sd.ry - 26], [sd.rx - 80, CYS - sd.ry - 46]], a });
    M5.gasDots(c, { box, n: 7, cols: 2, seed: 47, t, r: 3.8, col: '#ffffff', jig: 1.4, k, frac: 0.8, win: 0.45,
      path: [[sd.rx - 4, CYS + sd.ry - 6], [sd.rx - 30, CYS + sd.ry + 26], [sd.rx - 80, CYS + sd.ry + 46]], a });
    const kn = suckerDraw(c, sd, a);
    const sq = fin(s, 4, 2.9, 0.3) * fout(s, 4, 5.0, 0.5);
    T(c, sq, L('空氣被擠出去', 'Air is squeezed out'), 640, 110, WHITE, 22, 'center');
    /* 手：從左邊伸過來壓住圓頭（u 1.6～4.2），之後離開 */
    const inn = ease(clamp01((u - 1.6) / 0.8)), out = ease(clamp01((u - 4.2) / 0.8));
    const ha = clamp01((u - 1.6) / 0.4) * (1 - out);
    if (ha > 0.02) {
      const palmX = kn.knobX - 14 - 120 * (1 - inn) - 90 * out;
      c.save(); c.translate(palmX, CYS); c.rotate(-Math.PI / 2);
      M4.hand(c, 0, 0, { dir: 'right', armTop: -200, a: ha * a });
      c.restore();
    }
    /* 大氣壓力：外面多、長；裡面少、短（u 5.0 起） */
    const pa = fin(s, 4, 5.0, 0.6), g = grow(s, 4, 5.0, 5.8);
    for (let i = 0; i < 9; i++) {
      const th = Math.PI * (0.6 + 0.8 * i / 8);                      /* 吸盤左側的弧 */
      const ex = sd.rx + Math.cos(th) * (sd.d + 9), ey = CYS + Math.sin(th) * (sd.ry + 9);
      if (Math.abs(ey - CYS) < 24) continue;                          /* 柄的位置不畫 */
      const nx = Math.cos(th) / Math.max(1, sd.d), ny = Math.sin(th) / sd.ry, an = Math.atan2(-ny, -nx);
      M5.pArrowAt(c, ex, ey, an, 58 * g * (1 + 0.06 * Math.sin(t * 3.2 + i * 1.7)), { a: pa, lw: 7 });
    }
    [CYS - 42, CYS + 42].forEach(y => M5.pArrowAt(c, WALLX - 3, y, Math.PI, 16 * g, { a: pa, lw: 3 }));
    P(c, fin(s, 4, 5.6, 0.5), L('外面大氣壓力大', 'Outside: big air pressure'), 700, 168, PR, 22, 'right');
    const ia = fin(s, 4, 6.0, 0.5);
    P(c, ia, L('裡面壓力小', 'Inside: low pressure'), 948, 414, PR, 22, 'right');
    withA(c, ia, () => { c.save(); c.strokeStyle = W5.rgba(PR, 0.85); c.lineWidth = 2; c.beginPath(); c.moveTo(830, 395); c.lineTo(WALLX - 10, CYS + 62); c.stroke(); c.restore(); });
    /* 掛一個小重物（示意）：u 6.6 細繩往下長、重物輕輕晃 */
    const wg = ease(clamp01((u - 6.6) / 0.9));
    if (wg > 0.01) {
      const hx = kn.knobX, hy = CYS + 26, Ls = 64 * wg;
      const sw = 0.1 * Math.sin((u - 6.6) * 3.4) * Math.exp(-(u - 6.6) * 0.2);
      const wx = hx + Math.sin(sw) * Ls, wy = hy + Math.cos(sw) * Ls;
      withA(c, a, () => { c.save(); c.strokeStyle = '#d9cbb0'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(wx, wy); c.stroke(); c.restore(); });
      M3.mass(c, wx, wy + 40, { w: 48, h: 30, a: a * clamp01(wg * 2) });
    }
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('空氣有重量', 'Air has weight'),
    () => L('吸走管內空氣', 'Remove the air in the straw'),
    () => L('大氣壓壓飲料', 'The air pushes the drink'),
    () => L('吸盤', 'Suction cups')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('空氣有重量，壓力約 1033.6 gw/cm²', 'Air has weight: about 1033.6 gw/cm²'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 7.6, 0.6) * fout(s, 3, 0, 0.4), L('吸走管內空氣 → 管內壓力變小', 'Air removed → less pressure in the straw'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 5.2, 0.6) * fout(s, 4, 0, 0.4), L('大氣壓力把飲料壓進吸管', 'Air pressure pushes the drink up the straw'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.2, 0.6), L('吸盤、馬桶疏通器：同樣的道理', 'Suction cups and plungers work the same way'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    sea(c, s);
    table(c);
    const la = leftA(s);
    withA(c, la, () => { cup(c, s); });
    cube(c, s);
    allSides(c, s);
    withA(c, la, () => { straw(c, s); });
    const dens = strawAir(c, s);
    withA(c, la, () => { face(c, s); });
    pressure(c, s, dens);
    suction(c, s);
    texts(c, s);
  }

  W5.register('straw', { canvas: 'cvs-straw', steps: DUR, draw });
})();
