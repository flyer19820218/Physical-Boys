/* ==================================================================
   mechanics_5 ｜ 阿基米德原理：浮力 ＝ 排開液體的重量（cvs-archi，960×540）
   四步：1 空氣中稱重 → 2 慢慢放入水中 → 3 讀數與溢水 → 4 為什麼有浮力
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption／force／eqRow／dashArrow、M4.cup／L／T／P／withA／fin／fout／grow、
        M5.overflowCan／spill／platScale／pArrowAt（overflowCan、spill、platScale 由 crown 新增）。

   數字（照簡報）：鐵塊空氣中 150 gw；完全沒入後讀數 120 gw；排開水 30 cm³ ＝ 30 gw；B ＝ 30 gw；
     B ＝ W排開液體 ＝ V排開 × D液體 ＝ 30 × 1.0 ＝ 30 gw；150 ＝ 120 ＋ 30。
   物理：溢水杯一開始裝滿到出水管；鐵塊沒入的比例 f（0..1）→ 浮力 30f、彈簧秤讀數 150 － 30f、溢出的水 30f gw（三個數字同一個 f，連續、同步）。
     彈簧秤刻度 1 gw ＝ 0.4 px：讀數變小，彈簧縮短，掛鉤（和鐵塊）相對秤身往上移 0.4 px/gw → 鐵塊位置用聯立解：
     鐵塊底面 ＝ A ＋ 266 － 12f、f ＝ clamp((A － 64) ÷ 82)，A＝夾具（秤的吊點）高度、水面 y 330；A＝146 時剛好完全沒入，最後停在 A＝176（上表面在水面下 30 px）。
   比例尺：
     彈簧秤：1 gw ＝ 0.4 px（0～200 gw 長 80 px）。鐵塊、杯子：示意（鐵塊邊長 70 px）；接水杯水高 1 gw ＝ 1.1 px（示意）。
     第 4 步受力圖：1 gw ＝ 0.9 px（W 150 → 135 px、T 120 → 108 px、B 30 → 27 px，同一比例）。
     第 4 步放大圖的液體壓力箭頭：示意、不依比例（長度 ∝ 深度，畫面標「示意」）。
   第 1 步（11 s）：u 0.6 起鐵塊掛上、彈簧拉長（臨界阻尼，讀數 0 → 150 gw，不衝過頭）；右側面板「彈簧秤讀數 150 gw」u 2.4、
     「接水杯的水重 0 gw」u 3.0；字卡 u 6.5。
   第 2 步（11 s）：u 0.8～7.8 夾具沿支架往下滑（A 44 → 176），鐵塊慢慢降入水中；指針 150 → 120、水從出水管流進接水杯、磅秤 0 → 30 gw；字卡 u 8.3。
   第 3 步（11 s）：停住；黃框「讀數 120 gw（少 30 gw）」u 0.6、「溢出的水 30 gw（30 cm³）」u 1.4，中間等號連線 u 2.4；字卡 u 4.5。
   第 4 步（12 s）：裝置淡出（剩 0.12，u 6.8 起完全淡出）、放大框由鐵塊長出（u 0～1.2）：上表面向下短、下表面向上長的液體壓力箭頭（u 1.4～3.0，標「示意」）、
     側面左右相等互相抵消；合力向上＝浮力 B（u 3.4）；右邊受力圖 W、T、B 依序長出（u 4.6～6.4）；「150 ＝ 120 ＋ 30」u 6.8；
     公式兩列 u 7.6、8.4；字卡 u 9.0。
   版面：地面 GY 476。支架：底座 x 60～230、立桿 x 120（y 40～476）；夾具／吊臂高度 A（44 → 176）、吊臂伸到 x 305。
     彈簧秤中線 x 305：吊環 A、外殼 A＋14～A＋114、刻度 0～200 gw 在 A＋24～A＋104；鐵塊上表面 ＝ A＋136＋0.4×讀數、邊長 70。
     溢水杯內壁 x 230～380、內底 464、杯口 305、出水管中心 y 325（水面 330），管口約 (433, 340)；
     接水杯中線 x 480、內底 430、杯口 376（放在磅秤上：磅秤中線 480、底 476、平台寬 130）。
     右側讀數面板中線 x 800：彈簧秤 y 128／170／212，接水杯 y 290／332／374；黃框 x 680～920。
     第 4 步：放大框 x 30～440、y 92～392（方塊邊長 100、中心 (190, 236)、水面 y 114）；受力圖方塊中心 (640, 240)；
     「W ＝ T ＋ B」(820, 110)、「150 ＝ 120 ＋ 30」(820, 156)；公式兩列 y 412／454。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.platScale) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, WE = M4.PC.waterEdge;
  const FW = M3.FC.gravity, FT = M3.FC.push, FB = COL.green, PR = M4.PC.pressure;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 476, RODX = 120, SX = 305, BS = 70, KS = 0.4;   /* KS：彈簧秤 px/gw */
  const CAN = { x0: 230, x1: 380, bot: 464, rim: 305, spY: 325, spR: 5 }, LV = CAN.spY + CAN.spR;
  const CUP = { cx: 480, bot: 430, rim: 376, rb: 32, rt: 36 }, KCUP = 1.1;
  const PX = 800, FX0 = 680, FX1 = 920;
  const A0 = 44, A1 = 176;

  /* ── 時間函式（純函式） ── */
  const clampA = s => (s.n === 1 ? A0 : s.n === 2 ? lerp(A0, A1, ease(clamp01((s.u - 0.8) / 7.0))) : A1);
  const subF = A => clamp01((A - 64) / 82);              /* 沒入比例（見檔頭聯立式） */
  function state(s) {
    const A = clampA(s), f = subF(A);
    let R = 150 - 30 * f;
    if (s.n === 1) { const tau = Math.max(0, s.u - 0.6), k = 3.2; R = s.u < 0.6 ? 0 : 150 * (1 - (1 + k * tau) * Math.exp(-k * tau)); }
    const top = A + 136 + KS * R;
    return { A, f, R, top, spill: 30 * f };
  }

  /* ═══════════ 裝置 ═══════════ */
  function stand(c, A) {
    c.save(); c.lineJoin = 'round';
    c.fillStyle = '#5f6b72'; W5.rr(c, 60, GY - 14, 170, 14, 4); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
    const rg = c.createLinearGradient(RODX - 5, 0, RODX + 5, 0); rg.addColorStop(0, '#e6ecef'); rg.addColorStop(1, '#7d8a92');
    c.fillStyle = rg; c.fillRect(RODX - 5, 40, 10, GY - 54); c.strokeRect(RODX - 5, 40, 10, GY - 54);
    /* 吊臂＋夾具 */
    c.fillStyle = rg; c.fillRect(RODX, A - 4, SX + 6 - RODX, 8); c.strokeRect(RODX, A - 4, SX + 6 - RODX, 8);
    c.fillStyle = '#3d4a52'; W5.rr(c, RODX - 12, A - 13, 24, 26, 4); c.fill(); c.stroke();
    c.fillStyle = '#9aa6ab'; c.beginPath(); c.arc(RODX - 16, A, 5, 0, TAU); c.fill();
    c.restore();
  }
  function springScale(c, A, R, t) {
    const top = A + 14, bot = A + 114, z0 = A + 24, w = 30, py = z0 + KS * R;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    /* 吊環 */
    c.strokeStyle = '#cfd8dc'; c.lineWidth = 3.5; c.beginPath(); c.ellipse(SX, A + 5, 6, 8, 0, 0, TAU); c.stroke();
    /* 外殼 */
    const g = c.createLinearGradient(SX - w / 2, 0, SX + w / 2, 0); g.addColorStop(0, '#f2f5f6'); g.addColorStop(1, '#a9b6bc');
    c.fillStyle = g; W5.rr(c, SX - w / 2, top, w, bot - top, 7); c.fill();
    c.strokeStyle = '#4e5b61'; c.lineWidth = 2; c.stroke();
    /* 刻度：每 10 gw 一小格、每 50 一中格 */
    c.strokeStyle = '#3d474c';
    for (let v = 0; v <= 200; v += 10) { const y = z0 + KS * v, big = v % 50 === 0; c.lineWidth = big ? 2 : 1.2; c.beginPath(); c.moveTo(SX - w / 2 + 3, y); c.lineTo(SX - w / 2 + (big ? 13 : 8), y); c.stroke(); }
    /* 彈簧（外殼中間的窗）：上端固定在 top＋6，下端到指針 */
    c.fillStyle = 'rgba(11,26,21,0.25)'; c.fillRect(SX - 2, top + 6, 13, bot - top - 12);
    c.strokeStyle = '#6e7c84'; c.lineWidth = 1.6; c.beginPath();
    const n = 9, y0 = top + 8, y1 = Math.max(y0 + 6, py - 2);
    for (let i = 0; i <= n * 8; i++) { const q = i / (n * 8), y = lerp(y0, y1, q), x = SX + 4.5 + 4.5 * Math.sin(q * n * TAU); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    /* 指針（紅三角，從右邊指向刻度） */
    c.fillStyle = COL.red; c.strokeStyle = '#5a1a1a'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(SX - w / 2 + 2, py); c.lineTo(SX + 4, py - 6); c.lineTo(SX + 4, py + 6); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#7d8a92'; c.lineWidth = 3; c.beginPath(); c.moveTo(SX + 4, py); c.lineTo(SX + 10, py); c.stroke();
    /* 掛鉤桿：由殼底伸出，跟著指針一起動 */
    const hy = bot + 8 + KS * R;
    c.strokeStyle = '#cfd8dc'; c.lineWidth = 3; c.beginPath(); c.moveTo(SX, bot - 2); c.lineTo(SX, hy); c.stroke();
    c.beginPath(); c.arc(SX + 4, hy + 4, 4.5, Math.PI, Math.PI * 0.4, true); c.stroke();
    c.restore();
    T(c, 1, '0', SX - w / 2 - 8, z0, DIM, 22, 'right', true);
    T(c, 1, '100', SX - w / 2 - 8, z0 + 100 * KS, DIM, 22, 'right', true);
    T(c, 1, '200', SX - w / 2 - 8, z0 + 200 * KS, DIM, 22, 'right', true);
    return { py, hy };
  }
  function ironBlock(c, x, top, side, a) {
    withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(x - side / 2, top, x + side / 2, top + side);
      g.addColorStop(0, '#c3ccd3'); g.addColorStop(0.5, '#8d98a1'); g.addColorStop(1, '#5d6871');
      c.fillStyle = g; c.fillRect(x - side / 2, top, side, side);
      c.strokeStyle = 'rgba(20,28,34,0.9)'; c.lineWidth = 2; c.strokeRect(x - side / 2, top, side, side);
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - side / 2 + 5, top + side * 0.7); c.lineTo(x - side / 2 + 5, top + 5); c.lineTo(x + side * 0.1, top + 5); c.stroke();
      c.restore();
    });
  }
  function apparatus(c, s, st) {
    const a = s.n === 4 ? lerp(1, 0.12, ease(clamp01(s.u / 0.9))) * fout(s, 4, 6.8, 0.6) : 1;   /* 第 4 步淡到 0.12，公式出現前再完全淡出 */
    withA(c, a, () => {
      stand(c, st.A);
      const sp = springScale(c, st.A, st.R, s.t);
      /* 鐵塊（掛在掛鉤下，細繩 14 px）：畫在溢水杯的水「後面」→ 沒入的部分被水染色 */
      const hooked = s.n > 1 || s.u >= 0.6;
      const can = M5.overflowCan(c, {
        x0: CAN.x0, x1: CAN.x1, bot: CAN.bot, rim: CAN.rim, spY: CAN.spY, spR: CAN.spR, t: s.t, flow: flowK(s),
        front: cc => {
          const ba = hooked ? 1 : fin(s, 1, 0, 0.4);
          withA(cc, ba, () => { cc.save(); cc.strokeStyle = 'rgba(230,236,233,0.9)'; cc.lineWidth = 2; cc.beginPath(); cc.moveTo(SX + 4, sp.hy + 8); cc.lineTo(SX, st.top); cc.stroke(); cc.restore(); });
          ironBlock(cc, SX, st.top, BS, ba);
        }
      });
      /* 接水杯＋磅秤 */
      const sc = M5.platScale(c, { cx: CUP.cx, by: GY, w: 130, text: Math.round(st.spill) + ' gw', dispW: 84, glow: s.n === 3 ? fin(s, 3, 1.4, 0.4) : 0 });
      M4.cup(c, { cx: CUP.cx, bot: CUP.bot, rim: CUP.rim, rb: CUP.rb, rt: CUP.rt, level: CUP.bot - KCUP * st.spill, t: s.t + 1 });
      const fk = flowK(s);
      M5.spill(c, { x: can.lip[0], y: can.lip[1], dx: CUP.cx - can.lip[0], landY: CUP.bot - KCUP * st.spill - 2, f: fk, t: s.t });
      /* 讀數引線（虛線）：指針 → 面板、磅秤 → 面板 */
      const la = s.n === 4 ? 0 : fin(s, 1, 2.4, 0.5) * 0.7;
      withA(c, la, () => {
        c.save(); c.strokeStyle = W5.rgba(DIM, 0.8); c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -s.t * 8;
        c.beginPath(); c.moveTo(SX + 14, sp.py); c.lineTo(FX0 - 6, 170); c.stroke();
        c.beginPath(); c.moveTo(CUP.cx + 46, GY - 14); c.lineTo(FX0 - 6, 332); c.stroke();
        c.restore();
      });
    });
  }
  function flowK(s) {
    if (s.n !== 2) return 0;
    const u = s.u, d = subF(clampA(s)) - subF(lerp(A0, A1, ease(clamp01((u - 0.25 - 0.8) / 7.0))));
    return clamp01(d * 30 / 1.2);
  }

  /* ═══════════ 右側讀數面板 ═══════════ */
  function panel(c, s, st) {
    const a = s.n === 4 ? fout(s, 4, 0, 0.6) : 1; if (a <= 0.02) return;
    const a1 = a * fin(s, 1, 2.4, 0.5), a2 = a * fin(s, 1, 3.0, 0.5);
    T(c, a1, L('彈簧秤讀數', 'Spring-scale reading'), PX, 128, DIM, 22);
    P(c, a1, Math.round(st.R) + ' gw', PX, 170, WHITE, 28, 'center', true);
    T(c, a2, L('接水杯的水重', 'Water in the cup'), PX, 290, DIM, 22);
    P(c, a2, Math.round(st.spill) + ' gw', PX, 332, WE, 28, 'center', true);
    /* 第 2 步之後：少了多少 */
    const less = 150 - Math.round(st.R);
    T(c, a * (s.n === 2 ? clamp01(less / 3) : s.n > 2 ? 1 : 0), L('少 ', 'down by ') + less + ' gw', PX, 212, CORAL, 22, 'center', true);
    T(c, a * (s.n === 2 ? clamp01(st.spill / 3) : s.n > 2 ? 1 : 0), '（' + Math.round(st.spill) + ' cm³）', PX, 374, WE, 22, 'center', true);
    /* 第 3 步：黃框＋等號 */
    if (s.n >= 3) {
      const pulse = 0.75 + 0.25 * Math.sin(s.t * 4);
      [[150, 236, 0.6], [310, 396, 1.4]].forEach(([y0, y1, t0]) => {
        const fa = a * fin(s, 3, t0, 0.4); if (fa <= 0.02) return;
        withA(c, fa, () => {
          c.save(); c.strokeStyle = YEL; c.lineWidth = 3.5; c.shadowColor = YEL; c.shadowBlur = 12 * pulse;
          W5.rr(c, FX0, y0, FX1 - FX0, y1 - y0, 12); c.stroke(); c.restore();
        });
      });
      const ea = a * fin(s, 3, 2.4, 0.4), g = s.n === 3 ? grow(s, 3, 2.4, 3.0) : 1;
      if (ea > 0.02) {
        withA(c, ea, () => {
          c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -s.t * 12;
          c.beginPath(); c.moveTo(FX1 - 20, 236); c.lineTo(FX1 - 20, lerp(236, 310, g)); c.stroke(); c.restore();
        });
        P(c, ea * clamp01((g - 0.8) / 0.2), '＝', FX1 - 20, 255, YEL, 24, 'center', true);
      }
    }
  }

  /* ═══════════ 第 4 步：放大＋受力 ═══════════ */
  const ZB = { x0: 30, y0: 92, x1: 440, y1: 392 }, ZS = 100, ZC = [190, 236];   /* 放大框；放大後的方塊邊長、中心 */
  function zoom(c, s) {
    if (s.n !== 4) return;
    const z = ease(clamp01(s.u / 1.2));
    if (z <= 0.01) return;
    /* 由鐵塊位置長出 */
    const bx = SX, by = A1 + 136 + KS * 120 + BS / 2;
    const x0 = lerp(bx - 40, ZB.x0, z), x1 = lerp(bx + 40, ZB.x1, z), y0 = lerp(by - 40, ZB.y0, z), y1 = lerp(by + 40, ZB.y1, z);
    const surfY = ZB.y0 + 22, cx = ZC[0], cy = ZC[1], h = ZS / 2;
    const bTop = cy - h, bBot = cy + h;
    withA(c, z, () => {
      c.save();
      W5.rr(c, x0, y0, x1 - x0, y1 - y0, 16); c.save(); c.clip();
      c.fillStyle = 'rgba(11,26,21,0.9)'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      /* 水（越深越濃） */
      const g = c.createLinearGradient(0, surfY, 0, ZB.y1);
      g.addColorStop(0, W5.rgba(M4.PC.water, 0.35)); g.addColorStop(1, W5.rgba('#1a60a8', 0.85));
      c.fillStyle = g; c.fillRect(x0, surfY, x1 - x0, y1 - surfY);
      c.strokeStyle = WE; c.lineWidth = 3; c.beginPath();
      for (let x = x0; x <= x1; x += 4) { const y = surfY + 1.4 * Math.sin(x * 0.06 + s.t * 3); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
      /* 細繩＋方塊 */
      c.strokeStyle = 'rgba(230,236,233,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, y0); c.lineTo(cx, bTop); c.stroke();
      c.restore();
      ironBlock(c, cx, bTop, ZS, 1);
      c.strokeStyle = W5.rgba(WE, 0.9); c.lineWidth = 3; W5.rr(c, x0, y0, x1 - x0, y1 - y0, 16); c.stroke();
      c.restore();
    });
    if (z < 0.98) return;
    /* 液體壓力箭頭（長度 ∝ 深度，示意） */
    const pl = y => 0.32 * (y - surfY), t = s.t;
    const aTop = fin(s, 4, 1.4, 0.4), aBot = fin(s, 4, 2.0, 0.4), aSide = fin(s, 4, 2.6, 0.4) * (1 - 0.55 * fin(s, 4, 3.4, 0.5));
    const br = (i) => 1 + 0.05 * Math.sin(t * 3.2 + i);
    [cx - 30, cx + 30].forEach((x, i) => M5.pArrowAt(c, x, bTop - 3, Math.PI / 2, pl(bTop) * br(i), { a: aTop, lw: 5 }));
    [cx - 32, cx, cx + 32].forEach((x, i) => M5.pArrowAt(c, x, bBot + 3, -Math.PI / 2, pl(bBot) * br(i + 2), { a: aBot, lw: 5 }));
    [cy - 25, cy + 25].forEach((y, i) => {
      M5.pArrowAt(c, cx - h - 3, y, 0, pl(y) * 0.7 * br(i + 5), { a: aSide, lw: 5 });
      M5.pArrowAt(c, cx + h + 3, y, Math.PI, pl(y) * 0.7 * br(i + 5), { a: aSide, lw: 5 });
    });
    T(c, aTop, L('淺：壓力小', 'shallow: weaker'), cx + 66, bTop - 22, PR, 22, 'left');
    T(c, aBot, L('深：壓力大', 'deep: stronger'), cx + 66, bBot + 34, PR, 22, 'left');
    T(c, fin(s, 4, 1.4, 0.4), L('示意', 'not to scale'), ZB.x0 + 14, ZB.y0 + 48, DIM, 22, 'left');
    /* 合力向上 ＝ 浮力 */
    const nb = fin(s, 4, 3.4, 0.5), ng = grow(s, 4, 3.4, 4.0);
    if (nb > 0.02) {
      M3.arrowFx(c, cx, cy + 10, cx, cy + 10 - 70 * ng, FB, nb, 8, 0);
      P(c, nb * clamp01((ng - 0.8) / 0.2), L('合力向上 ＝ 浮力 B', 'Net push up = buoyancy B'), 235, ZB.y1 - 22, FB, 22, 'center');
    }
  }
  function fbd(c, s) {
    if (s.n !== 4) return;
    const a = fin(s, 4, 4.4, 0.4); if (a <= 0.02) return;
    const cx = 640, cy = 240, hw = 26, K = 0.8;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(141,152,161,0.9)'; c.fillRect(cx - hw, cy - hw, 2 * hw, 2 * hw);
      c.strokeStyle = WHITE; c.lineWidth = 2.5; c.strokeRect(cx - hw, cy - hw, 2 * hw, 2 * hw); c.restore();
    });
    M3.force(c, { x: cx, y: cy + hw, dir: 'down', val: 150, k: K, col: FW, a, grow: grow(s, 4, 4.6, 5.2), name: 'W', lab: 'right' });
    M3.force(c, { x: cx - 13, y: cy - hw, dir: 'up', val: 120, k: K, col: FT, a, grow: grow(s, 4, 5.2, 5.8), name: L('拉力 T', 'Pull T'), lab: 'left' });
    M3.force(c, { x: cx + 13, y: cy - hw, dir: 'up', val: 30, k: K, col: FB, a, grow: grow(s, 4, 5.8, 6.4), name: L('浮力 B', 'Buoyancy B'), lab: 'right', dy: -4 });
    M3.eqRow(c, { x: 820, y: 156, size: 26, mono: true, show: clamp01((s.u - 6.8) / 1.0) * 5, tokens: [
      { t: '150', col: FW }, { t: '＝', col: WHITE }, { t: '120', col: FT }, { t: '＋', col: WHITE }, { t: '30', col: FB }] });
    T(c, fin(s, 4, 7.2, 0.5), 'W ＝ T ＋ B', 820, 110, DIM, 22, 'center', true);
    /* 公式兩列 */
    M3.eqRow(c, { x: 480, y: 412, size: 24, show: clamp01((s.u - 7.6) / 0.8) * 5, tokens: [
      { t: 'B', col: FB }, { t: '＝', col: WHITE }, { t: L('W排開液體', 'W(displaced liquid)'), col: WE }, { t: '＝', col: WHITE }, { t: L('V排開 × D液體', 'V(displaced) × D(liquid)'), col: WHITE }] });
    M3.eqRow(c, { x: 480, y: 454, size: 26, mono: true, show: clamp01((s.u - 8.4) / 0.8) * 5, tokens: [
      { t: '＝', col: WHITE }, { t: '30 × 1.0', col: WHITE }, { t: '＝', col: WHITE }, { t: '30 gw', col: FB, pill: true }] });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('空氣中稱重', 'Weigh in air'),
    () => L('慢慢放入水中', 'Lower it into water'),
    () => L('讀數與溢水', 'Reading and spilled water'),
    () => L('為什麼有浮力', 'Why there is a lift')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 6.5, 0.6) * fout(s, 2, 0, 0.4), L('空氣中：150 gw', 'In air: 150 gw'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.3, 0.6) * fout(s, 3, 0, 0.4), L('越沉越深：讀數變小，水溢出來', 'Deeper: the reading drops, water spills'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 4.5, 0.6) * fout(s, 4, 0, 0.4), L('少掉的讀數，剛好等於溢出的水重', 'The lost reading equals the spilled water\'s weight'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.0, 0.6), L('浮力 ＝ 排開液體的重量', 'Buoyancy = weight of liquid pushed aside'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const st = state(s);
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    apparatus(c, s, st);
    panel(c, s, st);
    zoom(c, s);
    fbd(c, s);
    texts(c, s);
  }

  W5.register('archi', { canvas: 'cvs-archi', steps: DUR, draw });
})();
