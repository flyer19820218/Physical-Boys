/* ==================================================================
   organics_1 ｜ 含碳卻是無機物：四大例外（cvs-except，960×540）
   四步：1 含碳＝有機 → 2 碳的氧化物 → 3 碳酸鹽、氰化物 → 4 碳化物
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／caption、M4.L／T／P／withA／fin／fout／grow／okMark、
        O1.MOL（CH4、ETOH、UREA、CO、CO2）／atom／bond／stamp／crystals，以及本檔新增到 O1 的
        O1.fxTokens／fxHi／card／rock／powder／bottle。

   科學內容（只用簡報）：含碳的化合物是有機物（甲烷 CH4、酒精 C2H5OH、尿素 CO(NH2)2）；四大例外——
     ①碳的氧化物 CO、CO2 ②碳酸鹽類 CaCO3、NaHCO3 ③氰化物 KCN ④碳化物 CaC2（碳化鈣／電石），四類都是含碳的無機物。
     畫面上沒有任何數字（除化學式下標）。卡片下的小圖（石灰岩塊、白粉堆、試劑小瓶、灰色塊）都只是示意，不加文字說明；不畫骷髏頭。

   第 1 步（11 s）含碳＝有機：
     u 0.2 標題；u 0.4 綠色「有機物」框 → u 1.0 甲烷、u 1.5 乙醇、u 2.0 尿素一顆顆彈出
     → u 2.6 / 2.8 / 3.0 名稱＋化學式 → u 3.6 甲烷的 C、u 4.2 / 4.5 乙醇的兩個 C、u 5.0 尿素的 C 依序亮黃光圈（化學式裡的 C 同時變黃）
     → u 5.8「含碳（C）→ 有機物」綠色橫幅 → u 6.8 右側珊瑚色「？」框彈出、u 7.2「例外？」→ u 8.0 字卡。
   第 2 步（11 s）碳的氧化物：
     u 0～0.5 三個分子淡出；u 0～1.2 綠框縮到左邊、珊瑚框展開成右邊大框；u 1.0 綠框裡列出三個化學式（C 黃）、u 1.2 框名「例外」
     → u 1.8 CO、u 2.3 CO2 分子彈出 → u 2.8 名稱、u 3.0 化學式 → u 3.8 CO 的 C、u 4.3 CO2 的 C 亮黃光圈
     → u 5.4「無機物（例外）」印章砸下 → u 8.0 字卡。
   第 3 步（11 s）碳酸鹽、氰化物：
     u 0～0.6 第 2 步淡出；u 1.0 / 1.6 / 2.2 三張卡片依序升起（碳酸鈣＋石灰岩塊、小蘇打＋白粉堆、氰化鉀＋試劑瓶）
     → u 3.4 / 3.8 / 4.2 化學式裡的 C 依序亮黃（擴散波）→ u 5.0 左側「碳酸鹽類」群組框、u 5.6 右側「氰化物」群組框
     → u 6.4 / 6.6 / 6.8 三張卡底部「無機物」標籤 → u 8.0 字卡。
   第 4 步（12 s）碳化物：
     u 0～0.6 第 3 步淡出；u 0.6～1.4 碳化鈣卡片升起（名稱 u 1.0、化學式 u 1.4）→ u 1.8～2.6 灰色塊長出 → u 2.8 兩個 C 亮黃
     → u 3.2「碳化物」標籤 → u 4.0～4.8 卡片縮小移到右下格 → u 4.4 / 4.8 / 5.2 其餘三格（碳的氧化物、碳酸鹽類、氰化物）依序出現、u 4.8 右下格內容
     → u 6.0 / 6.4 / 6.8 / 7.2 四格各蓋「含碳但屬無機物」印章 → u 8.2 字卡。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     第 1 步：有機物框 (40,100)～(640,450)，框名 pill 壓在上邊 (340,100)；甲烷 (130,225) 每單位 46 px、乙醇 (330,225) 36 px、尿素 (545,215) 36 px；
       名稱 y 330（22px）、化學式 y 372（28px，C 黃）、橫幅 (340,420)；「？」框 (680,100)～(920,450)，「？」120px 在 (800,262)、「例外？」(800,100)。
     第 2 步：有機物框縮成 (40,100)～(300,450)，化學式 x 170、y 175／255／335（28px）；例外框 (330,100)～(920,450)、框名 (625,100)；
       CO (480,220) 每單位 60 px、CO2 (760,220) 每單位 54 px；名稱 y 310、化學式 y 352（34px）；印章 (625,415) 28px。
     第 3 步：碳酸鹽類群組框 (40,100)～(600,456)、氰化物群組框 (640,100)～(920,456)，群組名 pill 壓在上邊 y 100；
       卡片寬 250、y 128～440，中心 x 180／460／780；卡內名稱 y 162（24px）、化學式 y 215（34px）、小圖底 y 360、「無機物」標籤 y 405。
     第 4 步：碳化鈣卡 (350,128)～(610,440)、「碳化物」(480,100)；四格 (60,100)～(465,275)、(495,100)～(900,275)、(60,295)～(465,470)、(495,295)～(900,470)，
       格名 pill 在格頂 +30（24px）、化學式在 +84（30px）、印章在 +140（22px）。
   字級：標題 24、字卡 24、框名／名稱 22～24、化學式 28～34（下標 0.68 倍 ≥ 19px）、原子元素符號 ≥ 16。
   示意：分子是球棒模型（平面展開示意，不是真實鍵角）；卡片下的小圖只是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.fxHi) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const G1 = [40, 100, 640, 450], G2 = [40, 100, 300, 450];       /* 有機物框（第 1 步 → 第 2 步） */
  const Q1 = [680, 100, 920, 450], Q2 = [330, 100, 920, 450];     /* 「？」框 → 例外框 */
  const MOL1 = [
    { m: O1.MOL.CH4, x: 130, y: 225, S: 46, k: 0.72, t0: 1.0, cT: [3.6], fx: 'CH4', name: () => L('甲烷', 'Methane') },
    { m: O1.MOL.ETOH, x: 330, y: 225, S: 36, k: 0.68, t0: 1.5, cT: [4.2, 4.5], fx: 'C2H5OH', name: () => L('酒精', 'Alcohol') },
    { m: O1.MOL.UREA, x: 545, y: 215, S: 36, k: 0.7, t0: 2.0, cT: [5.0], fx: 'CO(NH2)2', name: () => L('尿素', 'Urea') }
  ];
  const MOL2 = [
    { m: O1.MOL.CO, x: 480, y: 220, S: 60, k: 1, t0: 1.8, cT: [3.8], fx: 'CO', name: () => L('一氧化碳', 'Carbon monoxide') },
    { m: O1.MOL.CO2, x: 760, y: 220, S: 54, k: 0.95, t0: 2.3, cT: [4.3], fx: 'CO2', name: () => L('二氧化碳', 'Carbon dioxide') }
  ];
  const CARD_W = 250, CARD_Y0 = 128, CARD_Y1 = 440;
  const CARDS3 = [
    { x: 180, t0: 1.0, cT: 3.4, tagT: 6.4, fx: 'CaCO3', name: () => L('碳酸鈣', 'Calcium carbonate'), icon: 'rock' },
    { x: 460, t0: 1.6, cT: 3.8, tagT: 6.6, fx: 'NaHCO3', name: () => L('小蘇打', 'Baking soda'), icon: 'powder' },
    { x: 780, t0: 2.2, cT: 4.2, tagT: 6.8, fx: 'KCN', name: () => L('氰化鉀', 'Potassium cyanide'), icon: 'bottle' }
  ];
  const GRP_CARB = [40, 100, 600, 456], GRP_CN = [640, 100, 920, 456];
  const CARD4 = [350, 128, 610, 440];
  const TILES = [
    { r: [60, 100, 465, 275], t0: 4.4, st: 6.0, fx: ['CO', 'CO2'], name: () => L('碳的氧化物', 'Oxides of carbon') },
    { r: [495, 100, 900, 275], t0: 4.8, st: 6.4, fx: ['CaCO3', 'NaHCO3'], name: () => L('碳酸鹽類', 'Carbonates') },
    { r: [60, 295, 465, 470], t0: 5.2, st: 6.8, fx: ['KCN'], name: () => L('氰化物', 'Cyanides') },
    { r: [495, 295, 900, 470], t0: 4.8, st: 7.2, fx: ['CaC2'], name: () => L('碳化物', 'Carbides') }
  ];

  /* ═══════════ 小工具 ═══════════ */
  const lerpBox = (a, b, f) => a.map((v, i) => lerp(v, b[i], f));
  /* 框：底色＋虛線框，框名 pill 壓在上邊（lab 可為 null） */
  function zone(c, b, col, a, lab, labA) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.fillStyle = W5.rgba(col, 0.07); W5.rr(c, b[0], b[1], b[2] - b[0], b[3] - b[1], 16); c.fill();
      c.strokeStyle = W5.rgba(col, 0.6); c.lineWidth = 2; c.setLineDash([10, 7]); W5.rr(c, b[0], b[1], b[2] - b[0], b[3] - b[1], 16); c.stroke();
      c.restore();
    });
    if (lab) P(c, a * (labA == null ? 1 : labA), lab, (b[0] + b[2]) / 2, b[1], col, 22);
  }
  /* 分子：pop 0..1（彈出）、glowC(i) 這顆碳的黃光 0..1 */
  function molG(c, d, ox, oy, pop, glowC, t) {
    if (pop <= 0.02) return;
    const m = d.m, S = d.S, k = d.k, a = clamp01(pop * 2), sc = pop < 1 ? ease(pop) * (1 + 0.18 * Math.sin(pop * Math.PI)) : 1;
    m.bonds.forEach(b => {
      const A = m.atoms[b[0]], B = m.atoms[b[1]];
      O1.bond(c, ox + A.x * S, oy + A.y * S, ox + B.x * S, oy + B.y * S, { order: b[2], a, lw: Math.max(3, 6 * k) });
    });
    m.atoms.forEach((A, i) => { const g = glowC(i); if (g > 0.02) W5.glow(c, ox + A.x * S, oy + A.y * S, O1.EL.C.r * k * 2.6, YEL, 0.55 * g); });
    m.atoms.map((A, i) => i).sort((i, j) => O1.EL[m.atoms[j].el].r - O1.EL[m.atoms[i].el].r).forEach(i => {
      const A = m.atoms[i];
      O1.atom(c, ox + A.x * S, oy + A.y * S, A.el, O1.EL[A.el].r * k * sc, { a });
    });
    m.atoms.forEach((A, i) => {
      const g = glowC(i); if (g <= 0.02) return;
      const r = O1.EL.C.r * k + 7 + 2 * Math.sin(t * 4 + i), x = ox + A.x * S, y = oy + A.y * S;
      withA(c, g, () => {
        c.save(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 7; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
        c.strokeStyle = YEL; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.restore();
      });
    });
  }
  /* 亮起那一刻的一圈擴散波 */
  function ripple(c, x, y, u, t0, r0) {
    const tt = (u - t0) / 0.8; if (tt <= 0 || tt >= 1) return;
    withA(c, 1 - tt, () => { c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.beginPath(); c.arc(x, y, (r0 || 24) + 40 * tt, 0, TAU); c.stroke(); c.restore(); });
  }
  /* 一個分子＋名稱＋化學式（第 1、2 步） */
  function molBlock(c, s, d, a, nameY, fxY, fxSize, nameT) {
    if (a <= 0.02) return;
    const u = s.u, pop = s.n === d.step ? clamp01((u - d.t0) / 0.5) : 1;
    const cAt = {}; let ci = 0;
    d.m.atoms.forEach((A, i) => { if (A.el === 'C') cAt[i] = d.cT[ci++]; });
    const uu = s.n === d.step ? u : 99;
    const glowC = i => (cAt[i] == null ? 0 : ease(clamp01((uu - cAt[i]) / 0.4)));
    withA(c, a, () => {
      molG(c, d, d.x, d.y, pop, glowC, s.t);
      Object.keys(cAt).forEach(i => { const A = d.m.atoms[i]; ripple(c, d.x + A.x * d.S, d.y + A.y * d.S, uu, cAt[i], 22); });
      const na = s.n === d.step ? clamp01((u - nameT) / 0.4) : 1;
      T(c, na, d.name(), d.x, nameY, DIM, 22);
      const lastC = Math.max.apply(null, d.cT);
      O1.fxHi(c, d.fx, d.x, fxY, WHITE, fxSize, 'center', { a: na, hiCol: uu >= d.cT[0] ? YEL : WHITE, glow: ease(clamp01((uu - lastC) / 0.4)) * 0.6 });
    });
  }

  /* ═══════════ 第 1、2 步：有機物框 vs 例外框 ═══════════ */
  function boxes(c, s) {
    if (s.n > 3 || (s.n === 3 && s.u > 0.7)) return;
    const u = s.u, aOut = s.n === 3 ? fout(s, 3, 0, 0.6) : 1;
    const f2 = s.n === 1 ? 0 : ease(clamp01(u / 1.2));
    withA(c, aOut, () => {
      /* 有機物框 */
      const gb = lerpBox(G1, G2, f2);
      zone(c, gb, GREEN, fin(s, 1, 0.4, 0.5), L('有機物', 'Organic'));
      /* 第 1 步三個分子（第 2 步開頭淡出） */
      const ma = s.n === 1 ? 1 : fout(s, 2, 0, 0.5);
      MOL1.forEach((d, j) => { d.step = 1; molBlock(c, s, d, ma, 330, 372, 28, 2.6 + 0.2 * j); });
      /* 橫幅：含碳 → 有機物 */
      P(c, fin(s, 1, 5.8, 0.5) * (s.n === 1 ? 1 : fout(s, 2, 0, 0.4)), L('含碳（C）就是有機物', 'Has carbon (C): organic'), 340, 420, GREEN, 24);
      /* 第 2 步：縮小後的綠框列出三個化學式 */
      if (s.n >= 2) {
        const la = fin(s, 2, 1.0, 0.6);
        MOL1.forEach((d, j) => O1.fxHi(c, d.fx, 170, 175 + 80 * j, WHITE, 28, 'center', { a: la }));
        withA(c, la, () => [0, 1, 2].forEach(j => {
          if (j < 2) { c.save(); c.strokeStyle = W5.rgba(GREEN, 0.35); c.lineWidth = 1.5; c.beginPath(); c.moveTo(80, 215 + 80 * j); c.lineTo(260, 215 + 80 * j); c.stroke(); c.restore(); }
        }));
        M4.okMark(c, 170, 402, true, { a: fin(s, 2, 1.4, 0.4), r: 18 });
      }
      /* 「？」框 → 例外框 */
      const qa = s.n === 1 ? fin(s, 1, 6.8, 0.4) : 1;
      const qb = lerpBox(Q1, Q2, f2);
      if (qa > 0.02) {
        const pop = s.n === 1 ? clamp01((u - 6.8) / 0.4) : 1, sc = pop < 1 ? ease(pop) * (1 + 0.15 * Math.sin(pop * Math.PI)) : 1;
        const cx = (qb[0] + qb[2]) / 2, cy = (qb[1] + qb[3]) / 2;
        c.save(); c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
        zone(c, qb, CORAL, qa, null);
        /* 大問號（第 2 步淡出） */
        const qm = s.n === 1 ? 1 : fout(s, 2, 0, 0.5);
        withA(c, qa * qm, () => {
          W5.glow(c, 800, 262, 90, CORAL, 0.18);
          c.save(); c.font = W5.font(120); c.textAlign = 'center'; c.textBaseline = 'middle';
          const bob = s.n === 1 && u > 7.2 ? 4 * Math.sin((u - 7.2) * 3) : 0;
          c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.strokeText('?', 800, 262 + bob);
          c.fillStyle = CORAL; c.fillText('?', 800, 262 + bob); c.restore();
        });
        c.restore();
        P(c, qa * (s.n === 1 ? fin(s, 1, 7.2, 0.4) : fout(s, 2, 0, 0.4)), L('例外？', 'Exceptions?'), (qb[0] + qb[2]) / 2, qb[1], CORAL, 22);
        P(c, s.n >= 2 ? fin(s, 2, 1.2, 0.5) : 0, L('例外', 'Exceptions'), (Q2[0] + Q2[2]) / 2, Q2[1], CORAL, 22);
      }
      /* 第 2 步：CO、CO2 */
      if (s.n >= 2) {
        MOL2.forEach((d, j) => { d.step = 2; molBlock(c, s, d, 1, 310, 352, 34, 2.8 + 0.2 * j); });
        O1.stamp(c, [L('無機物（例外）', 'Inorganic (exception)')], 625, 415, { col: CORAL, sizes: [28], rot: -0.08, slam: s.n === 2 ? clamp01((u - 5.4) / 0.3) : 1, a: s.n > 2 || u > 5.4 ? 1 : 0 });
      }
    });
  }

  /* ═══════════ 第 3 步：碳酸鹽類、氰化物 ═══════════ */
  function icon(c, kind, x, y, k, t) {
    if (kind === 'rock') O1.rock(c, x, y, { s: 1.1, seed: 4, a: k });
    else if (kind === 'powder') O1.powder(c, x, y, { s: 1.0, a: k, k });
    else if (kind === 'bottle') O1.bottle(c, x, y, { s: 1.0, a: k });
    else if (kind === 'lump') O1.crystals(c, { x0: x - 70, x1: x + 70, y: y - 2, n: 10, s: 2.3, seed: 6, k, col: '#9aa3a8', edge: '#4a545a' });
  }
  /* 一張化學式卡：中心 x、上緣 y0；rise 0..1 升起；cT 化學式 C 亮的時間；tagT 底部「無機物」時間 */
  function card(c, s, n, d, x, y0, y1, w, a) {
    if (a <= 0.02) return;
    const u = s.n === n ? s.u : 99, rise = ease(clamp01((u - d.t0) / 0.6)); if (rise <= 0.02) return;
    const dy = 40 * (1 - rise);
    withA(c, a * rise, () => {
      c.save(); c.translate(0, dy);
      O1.card(c, x - w / 2, y0, w, y1 - y0, { col: CORAL, band: 62 });
      T(c, 1, d.name(), x, y0 + 34, WHITE, 24);
      const r = O1.fxHi(c, d.fx, x, y0 + 87, WHITE, 34, 'center', { hiCol: u >= d.cT ? YEL : WHITE, glow: ease(clamp01((u - d.cT) / 0.4)) * 0.7 });
      r.hits.forEach((h, i) => ripple(c, h.x, h.y, u, d.cT + i * 0.15, 18));
      icon(c, d.icon, x, 360, d.icon === 'lump' ? ease(clamp01((u - 1.8) / 0.8)) : 1, s.t);
      if (d.tagT != null) P(c, clamp01((u - d.tagT) / 0.4), L('無機物', 'Inorganic'), x, 405, CORAL, 22);
      c.restore();
    });
  }
  function salts(c, s) {
    if (s.n !== 3 && !(s.n === 4 && s.u < 0.7)) return;
    const a = s.n === 3 ? 1 : fout(s, 4, 0, 0.6);
    withA(c, a, () => {
      zone(c, GRP_CARB, CORAL, fin(s, 3, 5.0, 0.5), L('碳酸鹽類', 'Carbonates'));
      zone(c, GRP_CN, CORAL, fin(s, 3, 5.6, 0.5), L('氰化物', 'Cyanides'));
      CARDS3.forEach(d => card(c, s, 3, d, d.x, CARD_Y0, CARD_Y1, CARD_W, 1));
    });
  }

  /* ═══════════ 第 4 步：碳化物＋四類總整理 ═══════════ */
  const CAC2 = { t0: 0.6, cT: 2.8, fx: 'CaC2', name: () => L('碳化鈣（電石）', 'Calcium carbide'), icon: 'lump' };
  function tileBody(c, s, d, b, a, stampK) {
    if (a <= 0.02) return;
    const cx = (b[0] + b[2]) / 2, y = b[1];
    withA(c, a, () => {
      P(c, 1, d.name(), cx, y + 30, CORAL, 24);
      /* 化學式一列，置中排開 */
      const ws = d.fx.map(f => O1.fxHi(c, f, 0, 0, WHITE, 30, 'left', { measure: true }).w), gap = 48;
      let x = cx - (ws.reduce((p, q) => p + q, 0) + gap * (ws.length - 1)) / 2;
      d.fx.forEach((f, i) => { O1.fxHi(c, f, x, y + 84, WHITE, 30, 'left', { hiCol: YEL }); x += ws[i] + gap; });
    });
    O1.stamp(c, [L('含碳但屬無機物', 'Carbon, yet inorganic')], cx, y + 140, { col: CORAL, sizes: [22], rot: -0.06, slam: stampK, a: stampK > 0 ? a : 0, padY: 10 });
  }
  function carbide(c, s) {
    if (s.n !== 4) return;
    const u = s.u;
    /* 碳化鈣卡 → 縮進右下格 */
    const mk = ease(clamp01((u - 4.0) / 0.8));
    const B4 = TILES[3].r, box = lerpBox(CARD4, B4, mk);
    const rise = ease(clamp01((u - 0.6) / 0.6));
    if (rise > 0.02) {
      const dy = 40 * (1 - rise);
      withA(c, rise, () => {
        c.save(); c.translate(0, dy);
        O1.card(c, box[0], box[1], box[2] - box[0], box[3] - box[1], { col: CORAL, band: lerp(62, 0, mk) });
        const ca = 1 - clamp01((u - 3.8) / 0.4);
        withA(c, ca, () => {
          const x = (CARD4[0] + CARD4[2]) / 2;
          T(c, fin(s, 4, 1.0, 0.4), CAC2.name(), x, CARD4[1] + 34, WHITE, 24);
          const r = O1.fxHi(c, CAC2.fx, x, CARD4[1] + 87, WHITE, 34, 'center', { a: fin(s, 4, 1.4, 0.4), hiCol: u >= CAC2.cT ? YEL : WHITE, glow: ease(clamp01((u - CAC2.cT) / 0.4)) * 0.7 });
          r.hits.forEach(h => ripple(c, h.x, h.y, u, CAC2.cT, 18));
          icon(c, 'lump', x, 360, ease(clamp01((u - 1.8) / 0.8)), s.t);
        });
        c.restore();
      });
    }
    P(c, fin(s, 4, 3.2, 0.4) * fout(s, 4, 3.8, 0.4), L('碳化物', 'Carbides'), 480, 100, CORAL, 22);
    /* 四格 */
    TILES.forEach((d, j) => {
      const b = d.r, ta = j === 3 ? fin(s, 4, d.t0, 0.5) : fin(s, 4, d.t0, 0.5);
      if (j < 3 && ta > 0.02) {
        const dy = 24 * (1 - ta);
        withA(c, ta, () => { c.save(); c.translate(0, dy); O1.card(c, b[0], b[1], b[2] - b[0], b[3] - b[1], { col: CORAL }); c.restore(); });
      }
      tileBody(c, s, d, b, ta, clamp01((u - d.st) / 0.3));
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('含碳＝有機', 'Carbon means organic'),
    () => L('碳的氧化物', 'Oxides of carbon'),
    () => L('碳酸鹽、氰化物', 'Carbonates and cyanides'),
    () => L('碳化物', 'Carbides')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('含碳的化合物是有機物：甲烷、酒精、尿素', 'Carbon compounds are organic: methane, alcohol, urea'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('例外①：碳的氧化物 CO、CO₂（含碳，卻是無機物）', 'Exception 1: oxides of carbon CO, CO₂ (carbon, yet inorganic)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.0, 0.6) * fout(s, 4, 0, 0.4), L('例外②③：碳酸鹽類（CaCO₃、NaHCO₃）、氰化物（KCN）', 'Exceptions 2, 3: carbonates (CaCO₃, NaHCO₃), cyanides (KCN)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.2, 0.6), L('例外④：碳化物 CaC₂（碳化鈣／電石）；四類都是含碳的無機物', 'Exception 4: carbides CaC₂; all four contain carbon yet are inorganic'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 480, cell: 40 });
    boxes(c, s);
    salts(c, s);
    carbide(c, s);
    texts(c, s);
  }

  W5.register('except', { canvas: 'cvs-except', steps: DUR, draw });
})();
