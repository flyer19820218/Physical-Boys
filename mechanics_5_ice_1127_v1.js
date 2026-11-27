/* ==================================================================
   mechanics_5 ｜ 資優補充：冰塊陷阱：液面升降（cvs-ice，960×540）
   四步：1 清水：冰排開多少 → 2 清水：融化後 → 3 鹽水：冰排開多少 → 4 鹽水：融化後
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／caption／block（mat 'ice'）／force、M4.L／T／P／withA／fin／fout／grow／okMark、
        M5.trough（透明杯剖面，液體可換顏色）、M5.dimV、M5.wetBox（本檔新增到 M5，vol 也用）。

   數字（照簡報）：冰塊重 90 gw、體積 100 cm³（D冰＝0.9）。
     清水 D＝1：浮著 B＝W＝90 gw → V排＝90 ÷ 1＝90 cm³；融成 90 gw 的水＝90 cm³＝V排 → 液面不變。
     濃鹽水 D＝1.2：V排＝90 ÷ 1.2＝75 cm³；融出 90 cm³ 淡水 ＞ 75 cm³，多 15 cm³ → 液面上升
     （杯底 100 cm² → 實際只升 15 ÷ 100＝0.15 cm；畫面把高度差放大，標「示意：高度差放大」）。
   物理畫法（剖面，面積 ∝ 體積）：冰塊寬 W0＝130 px 固定，高度 ＝ 100 px × (1－f)（f＝融化比例，1 px 高 ＝ 1 cm³）；
     浮著時水下深度 ＝ D排 × (1－f)（清水 D排＝90、鹽水 75），冰塊底 ＝ 液面 ＋ D排 × (1－f)。
     「坑洞」＝原來液面 L0 以下、寬 W0、深 D排 的方框（＝冰塊原本排開的體積）；融出的水（淡青）＝坑洞裡冰塊底以下的部分
       ＋（鹽水）液面上升的那一層。清水：融出 90f 剛好＝坑洞被空出來的 90f，液面恆在 L0。
       鹽水：坑洞只空出 75f，多出的 15f 攤在整杯液面上 → 液面上升 RISE × f（RISE＝22 px，示意放大；照實際比例只約 6 px）。
     冰塊落水：等加速落到液面後阻尼上下晃，停在水下 90／75 px；落水時液面上升 ＝ W0 × 浸入深度 ÷ 杯寬（剖面面積守恆），
       停好時液面＝L0（清水、鹽水的原水量各自調成停好剛好在 L0）。
   比例尺：冰塊 130 × 100 px ＝ 100 cm³（水下深度 1 px ＝ 1 cm³）；力 1 gw ＝ 0.6 px（B、W 各 90 gw ＝ 54 px，第 1、3 步同一比例）。
   第 1 步（11.5 s）：冰塊 u 0.3 出現在杯上方、u 1.2～1.6 落到水面、晃動後停在水下 90 px；「原來液面」虛線 u 3.8 由左畫到右；
     坑洞（白色虛線框＋淡光、框內「V排」、框下「90 cm³」）u 4.6；右側受力圖 B 長出 u 5.4～6.0、W 長出 u 6.0～6.6；
     「B ＝ W ＝ 90 gw」u 6.9；「V排 ＝ 90 ÷ 1 ＝ 90 cm³」u 7.6；字卡 u 8.8。停在：冰浮在清水，坑洞框＋兩個式子。
   第 2 步（12 s）：受力圖、B＝W 淡出 u 0～0.5；冰 u 0.8～8.0 融化（冰塊變矮、側面水滴流下），淡青融水由坑洞底往上補，
     右側「冰 90 gw → 水 90 gw」u 0.8、「融出 N cm³」跟著跑；u 8.3「V融化 ＝ 90 cm³ ＝ V排」、原來液面虛線發亮＋綠勾「液面不變」u 8.9；字卡 u 9.4。
     停在：坑洞被淡青融水剛好填滿，液面與虛線重合。
   第 3 步（11.5 s）：清水杯淡出 u 0～0.6、濃鹽水杯（顏色較深，左下「濃鹽水 D ＝ 1.2」）淡入 u 0.4～1.0；冰塊 u 1.2 出現、
     u 1.6～2.0 落水、停在水下 75 px（露出較多）；虛線 u 4.2；坑洞（75 px 深）u 4.8；受力圖 u 5.6～6.8；「B ＝ W ＝ 90 gw」u 7.0；
     「V排 ＝ 90 ÷ 1.2 ＝ 75 cm³」u 7.7；字卡 u 8.8。停在：冰浮在鹽水，75 cm³ 坑洞。
   第 4 步（12 s）：受力圖淡出；冰 u 0.8～8.0 融化：淡青融水補滿 75 cm³ 坑洞，同時一層淡青融水在整個液面上變厚、液面升到虛線之上；
     左上「示意：高度差放大」u 1.5；「多出 15 cm³」（指向上面那層）u 6.0；左側黃色「上升」箭頭 u 6.6；「實際：15 ÷ 100／＝ 0.15 cm」u 7.2；
     右側「V融化 ＝ 90 ＞ V排 ＝ 75」u 8.3、「液面上升」u 8.9；字卡 u 9.4。停在：液面在虛線上方 22 px，上升箭頭。
   版面：杯內壁 x 250～570（寬 320）、杯口 y 120、內底 455；原來液面 L0＝250；冰塊中線 x 410。
     左欄 x 20～240：「原來液面」標在 (24, L0＋22)、液體名 (125, 420)、第 4 步註記 y 140～352。
     右欄 x 600～950（中線 775）：說明 y 112／146、受力圖冰塊圖示 (690, 260) 邊長 50、式子 pill y 380／425；第 2、4 步 y 130～350。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.trough || !M5.wetBox) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, WE = M4.PC.waterEdge;
  const FW = COL.pink, FB = COL.teal;
  const BRINE = '#1f7f8c', BRINE_E = '#7fe0d6';               /* 濃鹽水：比清水深的藍綠 */
  const MELT = '#8ff7ee', MELT_E = '#d4fffa';                 /* 融出的淡水：淡青 */
  const HOLE = '#eef7ff';                                     /* 坑洞虛線框 */
  const DUR = [11.5, 12, 11.5, 12];                           /* 總長 47 秒 */

  /* ── 版面 ── */
  const CUP = { x0: 250, x1: 570, top: 120, bot: 455 }, WC = CUP.x1 - CUP.x0;
  const L0 = 250, CX = 410, W0 = 130, H0 = 100;
  const DF = 90, DB = 75;                                     /* 水下深度 px（＝ V排 cm³） */
  const RISE = 22;                                            /* 鹽水融完液面上升（示意放大） */
  const KF = 0.6;                                             /* 力 px/gw */
  const HANG = 100;                                           /* 冰塊懸在杯上方的頂面 y */
  const FBD = { x: 690, y: 260, s: 50 };
  const RX = 775;                                             /* 右欄中線 */
  const MONO = () => L('zh', 'en') === 'zh';                  /* 英文式子較長：改用比例字型 */

  /* ── 物理小函式 ── */
  const riseIn = d => W0 * d / WC;                            /* 浸入 d px → 液面上升 */
  function bob(tau, D) {                                      /* 落水後的阻尼晃動（入水 150 px/s，示意） */
    if (tau <= 0) return 0;
    const g = 2.2, w = 5, Bc = (150 - D * g) / w, e = Math.exp(-g * tau);
    return Math.max(0, Math.min(H0 - 4, D * (1 - e * Math.cos(w * tau)) + Bc * e * Math.sin(w * tau)));
  }
  /* 落水那一步：t0＝開始落下的 u → { top, h, level, d, f:0 } */
  function dropState(D, u, t0) {
    const base = L0 + riseIn(D);                              /* 冰還沒放進去時的液面 */
    if (u < t0 + 0.4) {
      const q = clamp01((u - t0) / 0.4), fall = base - (HANG + H0);
      return { top: HANG + fall * q * q, h: H0, level: base, d: 0, f: 0 };
    }
    const d = bob(u - t0 - 0.4, D), level = base - riseIn(d);
    return { top: level + d - H0, h: H0, level, d, f: 0 };
  }
  /* 融化：f 0..1 → 液面、冰塊 */
  function meltState(D, f, brine) {
    const level = L0 - (brine ? RISE * f : 0), h = H0 * (1 - f), bot = level + D * (1 - f);
    return { top: bot - h, h, level, d: D * (1 - f), f };
  }
  const meltF = (s, n) => (s.n > n ? 1 : s.n < n ? 0 : ease(clamp01((s.u - 0.8) / 7.2)));

  /* ═══════════ 畫法 ═══════════ */
  function cup(c, level, t, brine, a) {
    return M5.trough(c, { x0: CUP.x0, x1: CUP.x1, bot: CUP.bot, top: CUP.top, level, wall: 6, col: brine ? BRINE : M4.PC.water, edge: brine ? BRINE_E : WE, t, wob: 1.2, a });
  }
  function ice(c, st, t, a) {
    if (st.h < 1.5 || a <= 0.02) return;
    const ia = a * clamp01(st.h / 6);
    M3.block(c, CX, st.top + st.h, W0, st.h, { a: ia, mat: 'ice', shadow: false, seed: 11 });
    /* 融化中：側面往下流的小水滴（確定性） */
    if (st.f > 0.01 && st.f < 0.99) {
      withA(c, ia, () => {
        c.save(); c.fillStyle = W5.rgba(MELT_E, 0.9);
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? 1 : -1, ph = (t * 0.9 + i * 0.37) % 1;
          const x = CX + side * (W0 / 2 - 4 - 10 * (i % 3)), y = st.top + 4 + ph * Math.max(4, st.level - st.top - 2);
          if (y > st.level - 2) continue;
          c.globalAlpha = ia * (1 - ph * 0.6);
          c.beginPath(); c.ellipse(x, y, 2.6, 3.6, 0, 0, TAU); c.fill();
        }
        c.restore();
      });
    }
  }
  /* 融出的水（淡青）：坑洞裡冰塊底以下 ＋ 原來液面以上那一層（鹽水才有） */
  function meltWater(c, D, st, res, a) {
    if (st.f <= 0.002 || a <= 0.02) return;
    const xl = CX - W0 / 2, xr = CX + W0 / 2, hb = L0 + D, ib = st.top + st.h;
    withA(c, a, () => {
      c.save();
      c.beginPath();
      const layer = L0 - st.level > 0.8;
      if (layer) {
        c.moveTo(CUP.x0, L0); c.lineTo(CUP.x0, res.surf(CUP.x0));
        for (let x = CUP.x0 + 4; x < CUP.x1; x += 4) c.lineTo(x, res.surf(x));
        c.lineTo(CUP.x1, res.surf(CUP.x1)); c.lineTo(CUP.x1, L0);
        c.lineTo(xr, L0); c.lineTo(xr, hb); c.lineTo(xl, hb); c.lineTo(xl, L0); c.closePath();
      } else { c.rect(xl, Math.min(ib, hb), W0, Math.max(0, hb - ib)); }
      const g = c.createLinearGradient(0, st.level, 0, hb);
      g.addColorStop(0, W5.rgba(MELT, 0.78)); g.addColorStop(1, W5.rgba(MELT, 0.6));
      c.fillStyle = g; c.fill();
      if (layer) {
        c.strokeStyle = MELT_E; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(CUP.x0 + 1, res.surf(CUP.x0)); for (let x = CUP.x0 + 4; x < CUP.x1; x += 4) c.lineTo(x, res.surf(x)); c.lineTo(CUP.x1 - 1, res.surf(CUP.x1)); c.stroke();
      }
      c.restore();
    });
  }
  /* 坑洞：原來液面以下、冰塊原本排開的那一塊（白色虛線框；fillA 淡光） */
  function hole(c, D, a, t, fillA) {
    if (a <= 0.02) return;
    const xl = CX - W0 / 2;
    withA(c, a, () => {
      c.save();
      if (fillA > 0.01) { c.fillStyle = W5.rgba(HOLE, 0.3 * fillA); c.fillRect(xl, L0, W0, D); }
      c.strokeStyle = HOLE; c.lineWidth = 2.5; c.setLineDash([8, 6]); c.lineDashOffset = -t * 14;
      c.strokeRect(xl, L0, W0, D); c.restore();
    });
  }
  /* 原來液面：橫向虛線（g 由左長到右；glow 發亮） */
  function levelLine(c, a, g, t, glow) {
    if (a <= 0.02 || g <= 0.01) return;
    const xa = 20, xb = 590, xe = lerp(xa, xb, g);
    withA(c, a, () => {
      c.save();
      if (glow > 0.02) { c.shadowColor = YEL; c.shadowBlur = 12 * glow; }
      c.strokeStyle = W5.rgba(YEL, 0.85 + 0.15 * glow); c.lineWidth = 2.5 + glow; c.setLineDash([10, 7]); c.lineDashOffset = -t * 10;
      c.beginPath(); c.moveTo(xa, L0); c.lineTo(xe, L0); c.stroke(); c.restore();
    });
    T(c, a * clamp01((g - 0.3) / 0.3), L('原來液面', 'Original level'), 24, L0 + 22, YEL, 22, 'left');
  }
  /* 受力圖：右欄小冰塊＋B、W 各 90 gw */
  function fbd(c, a, gB, gW) {
    if (a <= 0.02) return;
    const { x, y, s: sz } = FBD;
    M3.block(c, x, y + sz / 2, sz, sz, { a, mat: 'ice', shadow: false, seed: 3 });
    M3.force(c, { x, y: y - sz / 2, dir: 'up', val: 90, k: KF, col: FB, a, grow: gB, text: 'B ＝ 90 gw', lab: 'right', lw: 6 });
    M3.force(c, { x, y: y + sz / 2, dir: 'down', val: 90, k: KF, col: FW, a, grow: gW, text: 'W ＝ 90 gw', lab: 'right', lw: 6 });
  }

  /* ═══════════ 一杯（清水或鹽水）的場景 ═══════════ */
  function scene(c, s, brine, a) {
    if (a <= 0.02) return;
    const t = s.t, D = brine ? DB : DF, nDrop = brine ? 3 : 1, nMelt = brine ? 4 : 2;
    let st, ia = 1;
    if (s.n === nDrop) { const t0 = brine ? 1.6 : 1.2; st = dropState(D, s.u, t0); ia = fin(s, nDrop, t0 - 0.4, 0.4); }
    else st = meltState(D, meltF(s, nMelt), brine);
    withA(c, a, () => {
      const res = cup(c, st.level, t + (brine ? 0.7 : 0), brine, 1);
      meltWater(c, D, st, res, 1);
      ice(c, st, t, ia);
      if (st.h > 1.5) M5.wetBox(c, CX - W0 / 2, CX + W0 / 2, st.top, st.top + st.h, st.level, { col: brine ? BRINE : M4.PC.water, edge: brine ? BRINE_E : WE, t, a: ia });
    });
    /* 原來液面、坑洞 */
    const lineT = brine ? 4.2 : 3.8, holeT = brine ? 4.8 : 4.6;
    const glow = s.n === nMelt ? fin(s, nMelt, brine ? 99 : 8.9, 0.5) * (0.6 + 0.4 * Math.sin(t * 4)) : 0;
    levelLine(c, a, grow(s, nDrop, lineT, lineT + 0.8), t, glow);
    const ha = a * fin(s, nDrop, holeT, 0.5);
    const pulse = s.n === nDrop ? 0.55 + 0.45 * Math.sin(t * 3) : 0.3;
    hole(c, D, ha, t, pulse * (s.n === nDrop ? 1 : fout(s, nMelt, 0.4, 0.6) + 0.3));
    /* 坑洞裡的字：融化開始就淡出 */
    const ta = ha * fout(s, nMelt, 0.4, 0.5);
    P(c, ta, L('V排', 'V(disp.)'), CX, L0 + D / 2, HOLE, 22, 'center');
    P(c, ta, D + ' cm³', CX, L0 + D + 24, HOLE, 22, 'center', true);
    /* 液體名 */
    T(c, a, brine ? L('濃鹽水', 'Strong brine') : L('清水', 'Fresh water'), 125, 404, brine ? BRINE_E : WE, 22, 'center');
    P(c, a, brine ? 'D ＝ 1.2' : 'D ＝ 1', 125, 440, brine ? BRINE_E : WE, 22, 'center', true);
    return st;
  }

  /* ═══════════ 右欄：落水那一步（1、3） ═══════════ */
  function dropPanel(c, s, brine) {
    const n = brine ? 3 : 1, nx = n + 1;
    const k = brine ? 0.4 : 0, keep = fout(s, nx, 0, 0.5);
    const a0 = fin(s, n, 0.5 + k, 0.5);
    T(c, a0 * keep, L('冰塊：90 gw、100 cm³', 'Ice: 90 gw, 100 cm³'), RX, 112, WHITE, 22, 'center');
    T(c, a0 * keep, L('D冰 ＝ 90 ÷ 100 ＝ 0.9', 'D(ice) = 90 ÷ 100 = 0.9'), RX, 146, DIM, 22, 'center');
    const t5 = brine ? 5.6 : 5.4;
    fbd(c, fin(s, n, t5 - 0.3, 0.3) * keep, grow(s, n, t5, t5 + 0.6), grow(s, n, t5 + 0.6, t5 + 1.2));
    P(c, fin(s, n, brine ? 7.0 : 6.9, 0.5) * keep, L('浮著：B ＝ W ＝ 90 gw', 'Floating: B = W = 90 gw'), RX, 380, YEL, 22, 'center');
    /* V排 式子：融化那一步留著（變淡、往下移一點） */
    const va = fin(s, n, brine ? 7.7 : 7.6, 0.5);
    const str = brine ? L('V排 ＝ 90 ÷ 1.2 ＝ 75 cm³', 'V(disp.) = 90 ÷ 1.2 = 75 cm³') : L('V排 ＝ 90 ÷ 1 ＝ 90 cm³', 'V(disp.) = 90 ÷ 1 = 90 cm³');
    P(c, va * (s.n === nx ? 0.75 : 1) * fout(s, n + 2, 0, 0.5), str, RX, 425, HOLE, 22, 'center', MONO());
  }

  /* ═══════════ 右欄：融化那一步（2、4） ═══════════ */
  function meltPanel(c, s, brine) {
    const n = brine ? 4 : 2, out = brine ? 1 : fout(s, 3, 0, 0.5);
    if (s.n !== n && !(s.n === n + 1 && !brine)) return;
    const f = meltF(s, n);
    T(c, fin(s, n, 0.8, 0.5) * out, L('冰 90 gw → 水 90 gw', '90 gw ice → 90 gw water'), RX, 130, WHITE, 22, 'center');
    T(c, fin(s, n, 1.3, 0.5) * out, L('（質量不變，水的體積 90 cm³）', '(same mass: 90 cm³ of water)'), RX, 166, DIM, 22, 'center');
    P(c, fin(s, n, 1.0, 0.5) * out, L('融出的水 ', 'Melted: ') + Math.round(90 * f) + ' cm³', RX, 230, MELT, 24, 'center', true);
    const ea = fin(s, n, 8.3, 0.5) * out;
    if (!brine) {
      P(c, ea, L('V融化 ＝ 90 cm³ ＝ V排', 'V(melt) = 90 cm³ = V(disp.)'), RX, 300, YEL, 22, 'center', MONO());
      const oa = fin(s, n, 8.9, 0.4) * out;
      M4.okMark(c, RX - 70, 350, true, { a: oa, r: 15 });
      T(c, oa, L('液面不變', 'Level unchanged'), RX - 46, 350, COL.green, 22, 'left');
    } else {
      P(c, ea, L('V融化 ＝ 90 ＞ V排 ＝ 75', 'V(melt) = 90 > V(disp.) = 75'), RX, 300, YEL, 22, 'center', MONO());
      const oa = fin(s, n, 8.9, 0.4);
      withA(c, oa, () => { W5.arrow(c, RX - 66, 362, RX - 66, 336, COL.coral, 4, 11); });
      T(c, oa, L('液面上升', 'The level rises'), RX - 46, 350, COL.coral, 22, 'left');
    }
  }

  /* 第 4 步左欄：放大註記、多出的 15 cm³、上升箭頭、實際高度 */
  function risePanel(c, s, st) {
    if (s.n !== 4) return;
    const t = s.t;
    P(c, fin(s, 4, 1.5, 0.5), L('示意：高度差放大', 'Rise enlarged'), 125, 140, DIM, 22, 'center');
    const xa = fin(s, 4, 6.0, 0.5);
    if (xa > 0.02) {
      const ly = (st.level + L0) / 2;
      withA(c, xa, () => {
        c.save(); c.strokeStyle = MELT_E; c.lineWidth = 2; c.setLineDash([5, 5]); c.lineDashOffset = -t * 10;
        c.beginPath(); c.moveTo(200, 196); c.lineTo(300, ly); c.stroke(); c.restore();
        c.save(); c.fillStyle = MELT_E; c.beginPath(); c.arc(300, ly, 4, 0, TAU); c.fill(); c.restore();
      });
      P(c, xa, L('多出 15 cm³', 'Extra 15 cm³'), 125, 186, MELT, 22, 'center', true);
    }
    const ra = fin(s, 4, 6.6, 0.4);
    if (ra > 0.02 && L0 - st.level > 6) {
      withA(c, ra, () => {
        c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(222, st.level); c.lineTo(244, st.level); c.stroke(); c.restore();
        W5.arrow(c, 232, L0, 232, st.level + 1, YEL, 4, 10);
      });
      T(c, ra, L('上升', 'Up'), 220, (st.level + L0) / 2 - 2, YEL, 22, 'right');
    }
    const ka = fin(s, 4, 7.2, 0.5);
    T(c, ka, L('實際：15 ÷ 100', 'Real: 15 ÷ 100'), 125, 318, DIM, 22, 'center', true);
    T(c, ka, '＝ 0.15 cm', 125, 352, DIM, 22, 'center', true);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('清水：冰排開多少？', 'Fresh water: how much does the ice displace?'),
    () => L('清水：冰融化後', 'Fresh water: after melting'),
    () => L('濃鹽水：冰排開多少？', 'Brine: how much does the ice displace?'),
    () => L('濃鹽水：冰融化後', 'Brine: after melting')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.8, 0.6) * fout(s, 2, 0, 0.4), L('冰浮著：B ＝ W ＝ 90 gw，排開 90 cm³ 的水', 'Floating ice: B = W = 90 gw, it displaces 90 cm³'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 9.4, 0.6) * fout(s, 3, 0, 0.4), L('融出的 90 cm³ 剛好補滿坑洞：液面不變', 'The 90 cm³ of meltwater just fills the hole: no change'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.8, 0.6) * fout(s, 4, 0, 0.4), L('鹽水密度大：冰只要排開 75 cm³ 就浮得住', 'Denser brine: 75 cm³ is enough to hold the ice up'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.4, 0.6), L('融出 90 cm³ ＞ 坑洞 75 cm³：多 15 cm³，液面上升', 'Meltwater 90 cm³ > hole 75 cm³: 15 cm³ extra, level rises'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 540, cell: 40, glow: '#c084fc' });
    const fa = s.n <= 2 ? 1 : s.n === 3 ? fout(s, 3, 0, 0.6) : 0;
    const ba = s.n === 3 ? fin(s, 3, 0.4, 0.6) : s.n === 4 ? 1 : 0;
    scene(c, s, false, fa);
    const st = s.n >= 3 ? scene(c, s, true, ba) : null;
    if (s.n === 1) dropPanel(c, s, false);
    if (s.n === 2) { dropPanel(c, s, false); meltPanel(c, s, false); }
    if (s.n === 3) { dropPanel(c, s, false); meltPanel(c, s, false); dropPanel(c, s, true); }
    if (s.n === 4) { dropPanel(c, s, true); meltPanel(c, s, true); risePanel(c, s, st); }
    texts(c, s);
  }

  W5.register('ice', { canvas: 'cvs-ice', steps: DUR, draw });
})();
