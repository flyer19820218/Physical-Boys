/* ==================================================================
   organics_1 ｜ 有機物的定義：烏拉的意外（cvs-urea，960×540）
   四步：1 早期迷思 → 2 無機物加熱 → 3 尿素出現 → 4 現在的定義
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／dashArrow／magnifier、M4.L／T／P／withA／fin／fout／grow／zoomLeader／okMark、
        O1.MOL（UREA、CH4、ETOH）／atom／bond／fx／lamp／flame／smoke，以及本檔新增到 O1 的
        O1.flask／stand／crystals／spatula／bigX／stamp／burst／plant／critter。

   科學內容（只用簡報）：早期迷思＝有機物必須由生命體製造；德國科學家烏拉意外用無機物加熱，人工合成出有機物尿素 CO(NH₂)₂；
     現在的定義＝含有碳（C）的化合物就是有機物。畫面上沒有任何數字；「無機物」不標具體藥品名稱（講義沒寫）。本支不提四大例外。

   第 1 步（11 s）早期迷思：
     u 0.6～1.8 植物長出來、u 1.0 小兔子跳出來（＝生命體，不畫人）、u 1.2「生命體」→ u 2.2～3.0 白箭頭「製造」長向右
     → u 3.0～3.8 甲烷 CH4、乙醇 C2H5OH 分子彈出、u 3.6「有機物」→ u 4.6 左下「無機物」箱（晶體）
     → u 5.4～6.1 虛線箭頭從無機物伸向有機物 → u 6.2 大 ✕ 砸下擋住、箭頭被彈回抖動 → u 6.9「早期迷思」印章 → u 8.0 字卡。
   第 2 步（11 s）無機物加熱：
     u 0～0.6 第 1 步淡出；u 0.4～1.2 實驗桌、鐵架、圓底燒瓶淡入 → u 1.0～1.6 名牌「德國科學家 烏拉」由右滑入
     → u 1.8～2.4 藥匙移到瓶口、u 2.4～2.8 傾斜、u 2.6～4.4 晶體一顆顆落進瓶底、u 3.8～4.4 藥匙離開；u 3.6「無機物」
     → u 4.2～5.2 酒精燈沿桌面滑到瓶下、u 5.3 火花＋點燃、u 5.6「加熱」→ u 5.8 起瓶底橘光、瓶內熱氣、瓶口冒熱氣
     → u 7.0 閃光＋「!」爆炸框、u 7.3「意外！」→ u 8.0 字卡。
   第 3 步（11 s）尿素出現：
     u 0～0.5 名牌、意外框淡出；u 0.4～1.6 原本的晶體淡掉、u 0.6～2.2 瓶底長出白色針狀結晶 → u 2.0～2.6 火焰熄滅、u 2.4「白色結晶」
     → u 2.8～3.6 放大鏡長出來（虛線連到瓶底）、u 3.4～4.4 尿素分子一顆原子一顆原子出現 → u 4.4「尿素 CO(NH2)2」
     → u 4.8 第 1 步的 ✕ 擋板回到瓶子與放大鏡之間（標「早期迷思」）→ u 5.5～6.0 裂開 → u 6.1～7.1 碎掉飛散
     → u 7.2 綠色印章「有機物！由無機物合成」砸下 → u 8.2 字卡。
   第 4 步（12 s）現在的定義：
     u 0～0.6 實驗器材、放大鏡淡出；u 0.2～1.4 尿素分子從放大鏡縮小移到左邊 → u 1.2 甲烷、u 1.8 乙醇依序出現
     → u 2.6 / 2.8 / 3.0 三個名稱＋化學式 → u 3.6 尿素的 C、u 4.3 甲烷的 C、u 5.0 / 5.4 乙醇的兩個 C 依序亮黃色光圈
     → u 6.4 大字「含碳（C）的化合物 ＝ 有機物」→ u 7.4 / 7.6 / 7.8 三個綠勾「有機物」→ u 8.4 字卡。
   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     第 1 步：生命體框 (50,105)～(300,315)、有機物框 (590,105)～(920,315)、無機物框 (50,345)～(300,462)，框名 pill 壓在框頂邊 y 105／345；
       甲烷中心 (668,218)、乙醇中心 (822,218)、化學式 y 288（24px，下標 16px）；生命體→有機物箭頭 y 210（x 315→578）；
       無機物虛線箭頭 (305,400)→(640,322)，✕ 中心 (472,361) 半邊長 42，「早期迷思」印章 (600,432)。
     第 2、3 步：桌面 GY 452（M3.slab 452～466）；燒瓶 球心 (330,270)、半徑 58、瓶頸半寬 15、瓶口 y 145；鐵架直桿 x 190、夾子 y 178；
       酒精燈 (330,452) 縮放 1.15（燈芯頂 ≈ y 381，火焰 60 px 剛好碰到瓶底 y 324）；名牌 (650,234)～(830,306)；
       瓶旁標籤左對齊 x 410（無機物／白色結晶 y 318、加熱 y 372）；意外框 (468,206) 半徑 38、「意外！」(518,206)；
       放大鏡 (720,240) 半徑 140、柄角 0.85；尿素在鏡內每單位 46 px；「尿素 CO(NH2)2」y 422；✕ 擋板 (505,250) 半邊長 34；印章 (492,250)。
     第 4 步：三個分子中心 x 200／488／770、y 278（尿素 263），每單位 44 px、原子 0.75 倍；名稱 y 372、化學式 y 410、綠勾「有機物」y 452；
       大字 (480,140) 30px。
   示意：分子是球棒模型（平面展開示意，不是真實鍵角）；晶體形狀、顏色、針狀白色結晶都是示意，畫面上不加文字說明。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.flask) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green, TEAL = COL.teal;
  const INO = '#b9cbd3';                                 /* 無機物（晶體）的灰藍 */
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452;
  const BOX_LIV = [50, 105, 300, 315], BOX_ORG = [590, 105, 920, 315], BOX_INO = [50, 345, 300, 462];
  const ARW0 = [305, 400], ARW1 = [640, 322], XC = [472, 361];       /* 第 1 步：無機物虛線箭頭、✕ */
  const FX = 330, FY = 270, FR = 58, NW = 15, FTOP = 145;           /* 燒瓶 */
  const RODX = 190, CLAMPY = 178;                                   /* 鐵架 */
  const LAMP_S = 1.15, FLAME_H = 52;                                /* 酒精燈：火焰 52×1.15 ≈ 60 px */
  const LBX = 410, LBY1 = 318, LBY2 = 372;                          /* 瓶旁標籤 */
  const MX = 720, MY = 240, MR = 140, MS = 46;                      /* 放大鏡、鏡內尿素尺度 */
  const BX = 505, BY = 250;                                         /* 第 3 步擋板 */
  const M4X = [200, 488, 770], M4Y = 278, S4 = 44, K4 = 0.75;       /* 第 4 步三個分子 */
  const SPOON = [FX - 4, FTOP - 14];                                /* 藥匙勺尖（倒的位置） */

  /* ── 時間函式（純函式） ── */
  const A1 = s => (s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.6) : 0);                       /* 第 1 步畫面 */
  const LAB = s => (s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 0.4, 0.8) : s.n === 3 ? 1 : fout(s, 4, 0, 0.6));   /* 實驗器材 */
  const lampX = s => (s.n === 2 ? lerp(560, FX, ease(clamp01((s.u - 4.4) / 0.8))) : FX);
  const lampA = s => (s.n === 2 ? fin(s, 2, 4.2, 0.4) : LAB(s));
  function flameK(s) {                                   /* 火焰大小 0..1 */
    if (s.n === 2) return ease(clamp01((s.u - 5.3) / 0.5));
    if (s.n === 3) return 1 - ease(clamp01((s.u - 2.0) / 0.6));
    return 0;
  }
  function heatK(s) {                                    /* 瓶底被加熱的程度 */
    if (s.n === 2) return flameK(s) * ease(clamp01((s.u - 5.8) / 1.2));
    if (s.n === 3) return 1 - ease(clamp01((s.u - 1.6) / 1.6));
    return 0;
  }
  /* 瓶裡的晶體：old＝原本的無機物（第 2 步落進去、第 3 步淡掉）；fresh＝白色結晶（第 3 步長出來） */
  function oldK(s) { return s.n === 2 ? clamp01((s.u - 3.24) / 1.16) : s.n > 2 ? 1 : 0; }
  function oldA(s) { return s.n === 2 ? 1 : s.n === 3 ? 1 - ease(clamp01((s.u - 0.4) / 1.2)) : 0; }
  function freshK(s) { return s.n === 3 ? ease(clamp01((s.u - 0.6) / 1.6)) : s.n > 3 ? 1 : 0; }

  /* ═══════════ 小工具 ═══════════ */
  /* 框（第 1 步的三個區）：底色＋細框，框名 pill 壓在上邊 */
  function zone(c, b, col, a, label) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.fillStyle = W5.rgba(col, 0.07); W5.rr(c, b[0], b[1], b[2] - b[0], b[3] - b[1], 16); c.fill();
      c.strokeStyle = W5.rgba(col, 0.55); c.lineWidth = 2; c.setLineDash([10, 7]); W5.rr(c, b[0], b[1], b[2] - b[0], b[3] - b[1], 16); c.stroke();
      c.restore();
    });
    P(c, a, label, (b[0] + b[2]) / 2, b[1], col, 22);
  }
  /* 實心箭頭（深色描邊） */
  function solidArrow(c, x0, y0, x1, y1, col, a, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 6) return;
    withA(c, a, () => {
      W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', (lw || 6) + 4, 24);
      W5.arrow(c, x0, y0, x1, y1, col, lw || 6, 20);
    });
  }
  /* 化學式寬度（和 O1.fx 同一套量法，先量再畫底板） */
  function fxW(c, str, size) {
    const sub = Math.round(size * 0.68); let w = 0, prevSub = false, prev = '';
    c.save();
    for (const ch of str) {
      const isSub = /[0-9]/.test(ch) && prev && (/[A-Za-z)]/.test(prev) || prevSub);
      c.font = W5.font(isSub ? sub : size, true); w += c.measureText(ch).width; prevSub = isSub; prev = ch;
    }
    c.restore(); return w;
  }
  /* 名稱＋化學式的 pill（例：「尿素 CO(NH2)2」） */
  function namePill(c, a, name, fx, x, y, col) {
    if (a <= 0.02) return;
    const size = 24; c.save(); c.font = W5.font(size); const nw = c.measureText(name).width; c.restore();
    const fw = fxW(c, fx, 26), gap = 12, w = nw + gap + fw + 32, h = 42, x0 = x - w / 2;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.restore();
      T(c, 1, name, x0 + 16, y, col, size, 'left');
      O1.fx(c, fx, x0 + 16 + nw + gap, y, WHITE, 26, 'left');
    });
  }
  /* 分子（每顆原子各自的透明度／縮放，給「一顆一顆出現」用）：
     atomK(i) 0..1、bondA 鍵的透明度、k 原子大小倍率、glowC(i) 這顆碳的黃色光圈強度 0..1 */
  function molStaged(c, m, ox, oy, S, k, atomK, bondA, glowC, t) {
    m.bonds.forEach(b => {
      const A = m.atoms[b[0]], B = m.atoms[b[1]];
      const ba = bondA * Math.min(atomK(b[0]), atomK(b[1]));
      O1.bond(c, ox + A.x * S, oy + A.y * S, ox + B.x * S, oy + B.y * S, { order: b[2], a: ba, lw: Math.max(3, 6 * k) });
    });
    /* 碳的光圈（畫在原子下面） */
    if (glowC) m.atoms.forEach((A, i) => {
      const g = glowC(i); if (g <= 0.02) return;
      W5.glow(c, ox + A.x * S, oy + A.y * S, O1.EL.C.r * k * 2.6, YEL, 0.55 * g);
    });
    m.atoms.map((A, i) => i).sort((i, j) => O1.EL[m.atoms[j].el].r - O1.EL[m.atoms[i].el].r).forEach(i => {
      const A = m.atoms[i], q = atomK(i); if (q <= 0.02) return;
      const pop = q < 1 ? ease(q) * (1 + 0.18 * Math.sin(q * Math.PI)) : 1;
      const r = O1.EL[A.el].r * k * pop;
      O1.atom(c, ox + A.x * S, oy + A.y * S, A.el, r, { a: clamp01(q * 2), label: false });
      /* 元素符號自己寫：碳用白字（深灰藍球上的深色字看不清楚），其餘照 O1.EL 的字色；最小 16px */
      if (r > 8) withA(c, clamp01(q * 2), () => {
        const fs = Math.max(16, Math.round(r * 0.9)), x = ox + A.x * S, y = oy + A.y * S + 1;
        if (A.el === 'C') { W5.label(c, 'C', x, y, WHITE, fs); return; }
        c.save(); c.font = W5.font(fs); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = O1.EL[A.el].txt; c.fillText(A.el, x, y); c.restore();
      });
    });
    /* 碳的黃色圈（畫在原子上面） */
    if (glowC) m.atoms.forEach((A, i) => {
      const g = glowC(i); if (g <= 0.02) return;
      const r = O1.EL.C.r * k + 7 + 2 * Math.sin((t || 0) * 4 + i);
      withA(c, g, () => {
        c.save(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 7; c.beginPath(); c.arc(ox + A.x * S, oy + A.y * S, r, 0, TAU); c.stroke();
        c.strokeStyle = YEL; c.lineWidth = 4; c.beginPath(); c.arc(ox + A.x * S, oy + A.y * S, r, 0, TAU); c.stroke(); c.restore();
      });
    });
  }

  /* ═══════════ 第 1 步：早期迷思 ═══════════ */
  function myth(c, s) {
    const a = A1(s); if (a <= 0.02) return;
    const u = s.n === 1 ? s.u : 99, t = s.t;
    withA(c, a, () => {
      /* 生命體 */
      zone(c, BOX_LIV, GREEN, fin(s, 1, 0.4, 0.5), L('生命體', 'Living things'));
      O1.plant(c, 118, 292, { g: clamp01((u - 0.6) / 1.2), h: 130, t, a: fin(s, 1, 0.5, 0.3) });
      O1.critter(c, 222, 294, { s: 0.95, t, a: fin(s, 1, 1.0, 0.3), hop: clamp01((u - 1.0) / 0.5) + clamp01((u - 1.7) / 0.5) * 0 });
      /* 生命體 → 有機物 */
      const g1 = grow(s, 1, 2.2, 3.0);
      solidArrow(c, 315, 210, lerp(315, 578, g1), 210, WHITE, fin(s, 1, 2.2, 0.2), 6);
      T(c, fin(s, 1, 2.6, 0.4), L('製造', 'make'), 446, 182, WHITE, 22);
      /* 有機物 */
      zone(c, BOX_ORG, YEL, fin(s, 1, 2.8, 0.5), L('有機物', 'Organic matter'));
      const m1 = clamp01((u - 3.0) / 0.5), m2 = clamp01((u - 3.3) / 0.5);
      molStaged(c, O1.MOL.CH4, 668, 218, 40, 0.72, () => m1, 1, null, t);
      molStaged(c, O1.MOL.ETOH, 822, 218, 34, 0.68, () => m2, 1, null, t);
      withA(c, fin(s, 1, 3.6, 0.4), () => { O1.fx(c, 'CH4', 668, 288, WHITE, 24); O1.fx(c, 'C2H5OH', 822, 288, WHITE, 24); });
      /* 無機物 */
      const ia = fin(s, 1, 4.6, 0.5);
      zone(c, BOX_INO, INO, ia, L('無機物', 'Inorganic matter'));
      O1.crystals(c, { x0: 85, x1: 265, y: 446, n: 13, s: 1.5, seed: 4, k: clamp01((u - 4.6) / 0.8), a: ia, col: '#d5e2e8', edge: '#6f8790' });
      /* 無機物 → 有機物：伸到 ✕ 前面就被擋住 */
      const dx = ARW1[0] - ARW0[0], dy = ARW1[1] - ARW0[1];
      const reach = 0.36 * ease(clamp01((u - 5.4) / 0.7));
      const bump = u > 6.2 ? 0.04 * Math.exp(-(u - 6.2) * 3) * Math.sin((u - 6.2) * 22) : 0;   /* 被擋時往回彈、抖動 */
      const tip = Math.max(0.02, reach - Math.abs(bump));
      M3.dashArrow(c, ARW0[0], ARW0[1], ARW0[0] + dx * tip, ARW0[1] + dy * tip, INO, fin(s, 1, 5.4, 0.2), t * 30, { lw: 4, head: 16, dash: [10, 8] });
      /* 想去的地方（淡虛線） */
      withA(c, fin(s, 1, 5.6, 0.5) * 0.45, () => {
        c.save(); c.strokeStyle = INO; c.lineWidth = 2; c.setLineDash([4, 8]);
        c.beginPath(); c.moveTo(ARW0[0] + dx * 0.62, ARW0[1] + dy * 0.62); c.lineTo(ARW1[0], ARW1[1]); c.stroke(); c.restore();
      });
      /* 大 ✕ 砸下 */
      const xk = clamp01((u - 6.2) / 0.3);
      O1.bigX(c, XC[0], XC[1], 42, { a: clamp01(xk * 3), sc: lerp(1.6, 1, ease(xk)), lw: 20 });
      O1.stamp(c, [L('早期迷思', 'Old myth')], 600, 432, { col: CORAL, sizes: [28], rot: -0.1, slam: clamp01((u - 6.9) / 0.3), a: u > 6.9 ? 1 : 0 });
    });
  }

  /* ═══════════ 第 2、3 步：實驗桌 ═══════════ */
  function bench(c, s) {
    const a = LAB(s); if (a <= 0.02) return;
    M3.ground(c, GY, { a });
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 4, a });
  }
  /* 瓶內內容（clip 在瓶裡） */
  function inner(s) {
    return (c, g) => {
      /* 原本的無機物晶體 */
      O1.crystals(c, { x0: FX - 38, x1: FX + 38, floor: g.floor, n: 14, s: 1.05, seed: 7, k: oldK(s), a: oldA(s), col: '#d5e2e8', edge: '#6f8790' });
      /* 白色針狀結晶 */
      O1.crystals(c, { x0: FX - 42, x1: FX + 42, floor: g.floor, n: 18, s: 1.0, seed: 11, k: freshK(s), a: s.n >= 3 ? 1 : 0, shape: 'needle' });
      /* 瓶內熱氣 */
      const h = heatK(s);
      if (h > 0.02) O1.smoke(c, FX, g.bottom - 14, s.t, { n: 8, h: 110, a: h * 0.7, spread: 50, r: 7, speed: 0.5, col: '#ffd9b0', seed: 3 });
    };
  }
  function lab(c, s) {
    const a = LAB(s); if (a <= 0.02) return;
    const u = s.u, t = s.t;
    /* 酒精燈（先畫，火焰在瓶底後面） */
    const fk = flameK(s);
    O1.lamp(c, lampX(s), GY, { s: LAMP_S, on: fk > 0.02, fh: FLAME_H * fk, t, a: lampA(s) });
    /* 點火的火花 */
    if (s.n === 2 && u > 5.2 && u < 5.8) {
      const k = (u - 5.2) / 0.6, wy = GY - 62 * LAMP_S;
      W5.glow(c, FX, wy - 6, 40 * (1 - k * 0.5), YEL, 0.8 * (1 - k));
      withA(c, 1 - k, () => {
        c.save(); c.strokeStyle = '#fff4c0'; c.lineWidth = 2.5; c.lineCap = 'round';
        for (let i = 0; i < 8; i++) { const th = i / 8 * TAU + 0.3, r0 = 8 + 10 * k, r1 = 16 + 22 * k; c.beginPath(); c.moveTo(FX + Math.cos(th) * r0, wy - 6 + Math.sin(th) * r0); c.lineTo(FX + Math.cos(th) * r1, wy - 6 + Math.sin(th) * r1); c.stroke(); }
        c.restore();
      });
    }
    /* 鐵架、燒瓶 */
    O1.stand(c, { x: RODX, gy: GY, top: 118, clampY: CLAMPY, toX: FX, jaw: 17, a });
    O1.flask(c, { x: FX, y: FY, r: FR, nw: NW, top: FTOP, a, heat: heatK(s), inner: inner(s) });
    /* 瓶口熱氣 */
    const h = heatK(s);
    if (h > 0.02) O1.smoke(c, FX, FTOP - 4, t, { n: 10, h: 56, a: a * h, spread: 16, r: 6, speed: 0.45, seed: 9 });
    /* 白色結晶閃光（第 3 步 u 2.0～3.2） */
    if (s.n === 3 && u > 2.0 && u < 3.4) {
      for (let i = 0; i < 4; i++) {
        const tt = (u - 2.0 - i * 0.25) / 0.6; if (tt <= 0 || tt >= 1) continue;
        const px = FX - 30 + hash(i + 21) * 60, py = FY + FR - 14 - hash(i + 5) * 10, r = 10 * Math.sin(tt * Math.PI);
        withA(c, Math.sin(tt * Math.PI), () => {
          c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(px - r, py); c.lineTo(px + r, py); c.moveTo(px, py - r); c.lineTo(px, py + r); c.stroke(); c.restore();
        });
      }
    }
  }
  /* 藥匙把晶體倒進瓶裡（第 2 步 u 1.8～4.4） */
  function spoon(c, s) {
    if (s.n !== 2) return;
    const u = s.u;
    const inK = ease(clamp01((u - 1.8) / 0.6)), outK = ease(clamp01((u - 3.8) / 0.6)), tilt = ease(clamp01((u - 2.4) / 0.4));
    const sa = clamp01((u - 1.7) / 0.3) * (1 - outK);
    if (sa > 0.02) {
      const x = SPOON[0] - 170 * (1 - inK) - 150 * outK, y = SPOON[1] - 20 * (1 - inK) - 30 * outK;
      O1.spatula(c, x, y, Math.PI + 0.22 + 0.42 * tilt, { a: sa, len: 125, load: 1 - clamp01((u - 2.6) / 1.2), col: '#d5e2e8' });
    }
    /* 落下的晶體顆粒：從勺尖掉進瓶底（等加速，0.64 s 落到瓶底） */
    for (let i = 0; i < 14; i++) {
      const t0 = 2.6 + i * 0.08 + hash(i + 40) * 0.05, dt = u - t0; if (dt <= 0) continue;
      const fall = 0.5 * 900 * dt * dt, y = SPOON[1] + 4 + fall;
      if (y > FY + FR - 10) continue;
      const x = SPOON[0] + 4 + (hash(i + 7) - 0.5) * 16 * Math.min(1, fall / 60);
      c.save(); c.translate(x, y); c.rotate(hash(i) * 3 + dt * 6);
      c.fillStyle = '#d5e2e8'; c.strokeStyle = '#6f8790'; c.lineWidth = 1.2; c.fillRect(-3.5, -3.5, 7, 7); c.strokeRect(-3.5, -3.5, 7, 7);
      c.restore();
    }
  }
  /* 瓶旁標籤＋引線 */
  function sideLabel(c, a, str, y, col, tx, ty) {
    if (a <= 0.02) return;
    withA(c, a, () => { c.save(); c.strokeStyle = W5.rgba(col, 0.85); c.lineWidth = 2; c.beginPath(); c.moveTo(LBX - 4, y); c.lineTo(tx, ty); c.stroke(); c.restore(); });
    P(c, a, str, LBX, y, col, 22, 'left');
  }
  function labLabels(c, s) {
    const u = s.u;
    sideLabel(c, s.n === 2 ? fin(s, 2, 3.6, 0.5) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0, L('無機物', 'Inorganic matter'), LBY1, INO, 362, LBY1);
    sideLabel(c, s.n === 2 ? fin(s, 2, 5.6, 0.5) : s.n === 3 ? fout(s, 3, 2.0, 0.5) : 0, L('加熱', 'Heat'), LBY2, CORAL, 348, 360);
    sideLabel(c, s.n === 3 ? fin(s, 3, 2.4, 0.5) * fout(s, 3, 7.0, 0.5) : 0, L('白色結晶', 'White crystals'), LBY1, WHITE, 366, LBY1 + 2);
    /* 名牌：德國科學家 烏拉（不畫人，只用文字） */
    const na = s.n === 2 ? fin(s, 2, 1.0, 0.6) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    if (na > 0.02) {
      const dx = s.n === 2 ? 60 * (1 - ease(clamp01((u - 1.0) / 0.6))) : 0;
      withA(c, na, () => {
        c.save(); c.translate(dx, 0);
        const l1 = L('德國科學家', 'German scientist'), l2 = L('烏拉', 'Wöhler');
        c.save(); c.font = W5.font(22); const cw = Math.max(180, c.measureText(l1).width + 52); c.restore();   /* 名牌寬度隨字寬 */
        c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, 650, 234, cw, 72, 12); c.fill();
        c.strokeStyle = TEAL; c.lineWidth = 2; c.stroke();
        c.fillStyle = TEAL; W5.rr(c, 650, 234, 8, 72, 4); c.fill();
        T(c, 1, l1, 654 + cw / 2, 256, DIM, 22);
        T(c, 1, l2, 654 + cw / 2, 286, TEAL, 26);
        c.restore();
      });
    }
    /* 意外！ */
    if (s.n === 2 || s.n === 3) {
      const ea = s.n === 2 ? 1 : fout(s, 3, 0, 0.5);
      if (s.n === 2 && u > 7.0 && u < 8.0) {           /* 閃光 */
        const k = (u - 7.0) / 1.0;
        W5.glow(c, FX, FY + 20, 200 * (0.6 + 0.4 * k), '#fff6d0', 0.75 * (1 - k) * (1 - k));
      }
      const bk = s.n === 2 ? clamp01((u - 7.0) / 0.35) : 1;
      O1.burst(c, 468, 206, 38, { a: ea * (bk > 0 ? 1 : 0), k: bk, t: s.t });
      P(c, ea * (s.n === 2 ? fin(s, 2, 7.3, 0.4) : 1), L('意外！', 'Surprise!'), 518, 206, YEL, 24, 'left');
    }
  }

  /* ═══════════ 第 3 步：放大鏡＋尿素＋擋板碎裂 ═══════════ */
  const UREA = O1.MOL.UREA;
  function magnify(c, s) {
    if (s.n !== 3 && s.n !== 4) return;
    const u = s.u;
    const ra = s.n === 3 ? 1 : fout(s, 4, 0, 0.5);            /* 第 4 步：鏡框淡出，分子留著移走 */
    const r = s.n === 3 ? MR * ease(clamp01((u - 2.8) / 0.8)) : MR;
    if (s.n === 3) M4.zoomLeader(c, FX, FY + FR - 12, MX, MY, r, { a: fin(s, 3, 2.9, 0.5), col: WHITE, mark: 20 });
    if (r > 2 && ra > 0.02) {
      M3.magnifier(c, MX, MY, r, { a: ra, handle: 0.85, len: 105, glassA: 0.35, inner: cc => {
        cc.fillStyle = 'rgba(13,32,26,0.92)'; cc.fillRect(MX - r, MY - r, 2 * r, 2 * r);
        W5.glow(cc, MX, MY, r, TEAL, 0.08);
        if (s.n === 3) {
          const ak = i => clamp01((u - 3.4 - i * 0.12) / 0.3);
          molStaged(cc, UREA, MX, MY - 11, MS, 1, ak, fin(s, 3, 3.5, 0.6), null, s.t);
        }
      } });
    }
    namePill(c, s.n === 3 ? fin(s, 3, 4.4, 0.5) : fout(s, 4, 0, 0.4), L('尿素', 'Urea'), 'CO(NH2)2', MX - 30, 422, YEL);
  }
  function breakMyth(c, s) {
    if (s.n !== 3) return;
    const u = s.u;
    const xk = clamp01((u - 4.8) / 0.3), sh = u - 6.1;
    O1.bigX(c, BX, BY, 34, { a: clamp01(xk * 3), sc: lerp(1.5, 1, ease(xk)), lw: 15, crack: (u - 5.5) / 0.5, shatter: sh > 0 ? sh : 0, seed: 8 });
    P(c, fin(s, 3, 5.0, 0.4) * fout(s, 3, 6.1, 0.3), L('早期迷思', 'Old myth'), BX, BY - 66, CORAL, 22);
  }
  /* 印章最後畫（蓋在引線、標籤上面） */
  function stamp3(c, s) {
    if (s.n !== 3) return;
    const u = s.u;
    O1.stamp(c, [L('有機物！', 'Organic!'), L('由無機物合成', 'from inorganic')], 492, BY, { col: GREEN, sizes: [30, 22], rot: -0.14, slam: clamp01((u - 7.2) / 0.35), a: u > 7.2 ? 1 : 0 });
  }

  /* ═══════════ 第 4 步：現在的定義 ═══════════ */
  const DEF = [
    { m: O1.MOL.UREA, fx: 'CO(NH2)2', name: () => L('尿素', 'Urea'), dy: -15, cT: [3.6] },
    { m: O1.MOL.CH4, fx: 'CH4', name: () => L('甲烷', 'Methane'), dy: 0, cT: [4.3] },
    { m: O1.MOL.ETOH, fx: 'C2H5OH', name: () => L('乙醇（酒精）', 'Ethanol (alcohol)'), dy: 0, cT: [5.0, 5.4] }
  ];
  function definition(c, s) {
    if (s.n !== 4) return;
    const u = s.u, t = s.t;
    DEF.forEach((d, j) => {
      let ox = M4X[j], oy = M4Y + d.dy, S = S4, k = K4, a = 1;
      if (j === 0) {                                        /* 尿素：從放大鏡移過來、縮小 */
        const f = ease(clamp01((u - 0.2) / 1.2));
        ox = lerp(MX, ox, f); oy = lerp(MY - 11, oy, f); S = lerp(MS, S4, f); k = lerp(1, K4, f);
      } else {
        const t0 = j === 1 ? 1.2 : 1.8, f = ease(clamp01((u - t0) / 0.6));
        oy += 30 * (1 - f); a = f;
      }
      /* 這個分子裡的第幾個 C 何時亮 */
      let ci = 0; const cIdx = {};
      d.m.atoms.forEach((A, i) => { if (A.el === 'C') cIdx[i] = d.cT[ci++]; });
      const glowC = i => (cIdx[i] == null ? 0 : ease(clamp01((u - cIdx[i]) / 0.4)));
      molStaged(c, d.m, ox, oy, S, k, () => a, a, glowC, t);
      /* 亮起那一刻的一圈擴散波 */
      Object.keys(cIdx).forEach(i => {
        const tt = (u - cIdx[i]) / 0.8; if (tt <= 0 || tt >= 1) return;
        const A = d.m.atoms[i];
        withA(c, 1 - tt, () => { c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.beginPath(); c.arc(ox + A.x * S, oy + A.y * S, 26 + 40 * tt, 0, TAU); c.stroke(); c.restore(); });
      });
      /* 名稱、化學式、綠勾 */
      const na = fin(s, 4, 2.6 + 0.2 * j, 0.4);
      T(c, na, d.name(), M4X[j], 372, DIM, 22);
      withA(c, na, () => O1.fx(c, d.fx, M4X[j], 410, WHITE, 26));
      const oa = fin(s, 4, 7.4 + 0.2 * j, 0.4);
      const box = P(c, oa, L('有機物', 'Organic'), M4X[j] + 14, 452, GREEN, 22);
      if (box) M4.okMark(c, box.x - 20, 452, true, { a: oa, r: 15 });
    });
    P(c, fin(s, 4, 6.4, 0.5), L('含碳（C）的化合物 ＝ 有機物', 'Compound with carbon (C) = organic'), 480, 140, YEL, 30);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('早期迷思', 'The old myth'),
    () => L('無機物加熱', 'Heating inorganic matter'),
    () => L('尿素出現', 'Urea appears'),
    () => L('現在的定義', "Today's definition")
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('早期迷思：以為有機物必須由「生命體」製造', 'Old myth: organic matter had to be made by living things'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('德國科學家烏拉，意外用無機物加熱……', 'German scientist Wöhler heated inorganic matter by accident...'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('人工合成出有機物：尿素 CO(NH₂)₂', 'An organic compound made in the lab: urea CO(NH₂)₂'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.4, 0.6), L('現在的定義：只要含有碳（C）的化合物，就是有機物！', 'Today: any compound that contains carbon (C) is organic!'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c, s);
    myth(c, s);
    lab(c, s);
    spoon(c, s);
    magnify(c, s);
    breakMyth(c, s);
    labLabels(c, s);
    stamp3(c, s);
    definition(c, s);
    texts(c, s);
  }

  W5.register('urea', { canvas: 'cvs-urea', steps: DUR, draw });
})();
