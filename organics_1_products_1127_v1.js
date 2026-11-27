/* ==================================================================
   organics_1 ｜ 乾餾三大產物（cvs-products，960×540）
   四步：1 氣體 → 2 點燃導管口 → 3 液體 → 4 固體
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／magnifier／dashArrow、M4.L／T／P／withA／fin／fout／grow／zoomLeader、
        O1.MOL／atom／bond／fx／flame／card／match／stamp／htube／rig／rigPts／spot，
        以及本檔新增到 O1 的 O1.MOL.H2／noFire／litmus／rod／cBlob。

   科學內容（只用簡報）：氣體 CO、CH₄、H₂ 可燃，CO₂ 不可燃；點燃導管口，氣體燒起來 → 裡面有可燃性氣體；
     液體：深色黏稠的焦油、透明的醋酸；醋酸使藍色石蕊試紙變紅（醋酸：酸性）；固體：黑色的木炭＝碳，竹筷裡本來就含有碳。
     畫面上沒有任何數字（除化學式下標）。不畫手：火柴、玻璃棒都自己移動。

   第 1 步（11 s）氣體：
     u 0.2 標題 → u 0.6 / 1.0 / 1.4 / 1.8 四張分子卡（CO、CH4、H2、CO2）依序升起（分子跟著卡片）、各卡 +0.3 s 名稱與化學式
     → u 3.0 / 3.6 / 4.2 CO、CH4、H2 卡上的小火苗依序點燃，各 +0.3 s 綠色「可燃」、卡框轉綠
     → u 5.2 CO2 卡出現小火苗 → u 5.6～6.2 火苗變小變暗（冒一縷煙）→ u 6.2～6.7 珊瑚色禁止符號畫出 → u 6.8「不可燃」、卡框轉珊瑚
     → u 8.0 字卡；u 9.0～11 靜止（只有火苗閃動）。
   第 2 步（11 s）點燃導管口：
     u 0～0.5 分子卡淡出、u 0.3～1.0 縮小的乾餾裝置淡入（正在加熱：竹筷黑、收集管有液體與焦油、導管口冒白色氣體）
     → u 0.8「導管口」→ u 1.0 點燃的火柴在右下出現 → u 1.2～2.7 火柴移到導管口
     → u 2.8 閃光、u 2.8～3.3 導管口燃起火焰（白色氣體變少）→ u 3.4～4.3 火柴退回右下、熄滅、淡出
     → u 4.4 右側框「可燃性氣體」＋虛線箭頭指向火焰 → u 5.0 / 5.4 / 5.8 CO、CH4、H2（化學式＋小分子）依序出現
     → u 8.0 字卡；u 9.0～11 靜止（火焰、白煙持續）。
   第 3 步（11 s）液體：
     u 0～0.5 第 2 步右側框與「導管口」淡出（導管口火焰持續）→ u 0.6～1.2 其他部分變暗，只留收集管
     → u 1.0～1.8 放大鏡長出（虛線連到收集管）：上層淡黃褐透明液體、底部黑褐黏稠焦油
     → u 2.0「透明的醋酸」、u 2.6「深色黏稠的焦油」（引線指進放大鏡）
     → u 3.4 藍色石蕊試紙出現、u 3.6「藍色石蕊試紙」
     → u 4.0 玻璃棒出現在管內液面上方 → u 4.2～4.8 往下沾進液體（u 4.8 漣漪）→ u 4.9～5.4 提起（尖端掛一滴）
     → u 5.4～6.2 移到試紙上 → u 6.2 點上去 → u 6.3～7.4 試紙從點的地方往外由藍變紅
     → u 7.0～7.6 玻璃棒退開淡出 → u 7.6「醋酸：酸性」→ u 8.2 字卡；u 9.2～11 靜止。
   第 4 步（12 s）固體：
     u 0～0.6 裝置、放大鏡、試紙淡出 → u 0.6～1.2 放大的硬質試管升起（管底黑色木炭）
     → u 1.6「黑色的木炭」→ u 2.4～3.2 放大鏡長出（虛線連到木炭）→ u 3.2～5.2 碳原子由中心往外一顆顆聚成不規則塊
     → u 5.6「木炭＝碳」印章砸下 → u 6.6 竹筷升起＋「竹筷」→ u 7.2～7.8 竹筷上亮出幾個碳原子 C
     → u 8.0～8.6 黃箭頭由竹筷指向木炭 → u 8.6 字卡；u 10～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）。
     第 1 步：四張卡 寬 210、y 100～440，中心 x 135／365／595／825；卡內 名稱 y 128（22px）、化學式 y 166（30px）、分子中心 y 248、
       火苗底 y 370（高 48）、禁止符號中心 (825,350) r 34、「可燃／不可燃」pill y 410（22px）。
       分子：CO 每單位 52 px、CH4 40 px（原子 0.75 倍）、H2 56 px、CO2 44 px（原子 0.85 倍）。
     第 2、3 步：O1.rig 縮放 0.75、平移 (−40,113)（桌面仍在 452）：導管口 ≈ (488,291)、收集管中線 x 455（管口 345、外底 443）、
       燒杯 414～496、竹筷中心 ≈ (105,314)、酒精燈 x ≈ 105。
       第 2 步：「導管口」右對齊 (468,241)；火柴起點（頭）(860,420) → 終點 導管口 +(14,−12)，木棒角度 0.5 rad；導管口火焰 底 = 導管口 +(4,−2)、高 54。
         右側框 (600,140)～(920,330)：「可燃性氣體」(760,174)（24px，黃）、化學式 y 224（30px）x 668／760／852、小分子 y 286；虛線箭頭 (600,236) → (516,262)。
     第 3 步：聚光洞 收集管 (455,395) r 62；放大鏡中心 (660,215) r 115（柄朝下、長 100），虛線連到收集管 (455,400)；
       放大鏡內：管內壁 x 590～730、液面 y 200、焦油頂 y 285、管內底 y 320。
       「透明的醋酸」右對齊 (530,140) → 引線到 (622,240)；「深色黏稠的焦油」右對齊 (530,196) → 引線到 (620,300)。
       石蕊試紙 (740,398)～(930,426)，點的位置 (792,412)；「藍色石蕊試紙」(835,452)；「醋酸：酸性」(835,350)（珊瑚）。
       玻璃棒長 110、方向 −75°（尖端在下）：出現 尖端 (697,160) → 沾 (673,250) → 提起 (697,160) → 試紙 (792,410)。
     第 4 步：放大的硬質試管＝O1.htube 原寸畫完再整體放大 1.6 倍，閉口端 (60,250)、水平（x 60～540、y 215～285）、木炭在 x 76～260；
       「黑色的木炭」(170,170)；放大鏡中心 (720,240) r 130（柄朝右上、長 80），虛線連到 (170,272)；碳原子塊 O1.cBlob 中心 (720,240) R 98、r 19、30 顆；
       印章「木炭＝碳」(750,414)；竹筷 x 90～400、y 392（高 12）；「竹筷」左對齊 (420,398)；竹筷上 C 原子 x 150／230／310、r 15；黃箭頭 (250,380) → (196,300)。
   字級：標題 24、字卡 24、所有標籤 22（「可燃性氣體」24、印章 28）、卡內化學式 30、原子元素符號 ≥ 16。
   示意：分子卡上的火苗與禁止符號只是「可燃／不可燃」的圖示；乾餾裝置縮小重用；液體分層與顏色、焦油量、試紙顏色、
     碳原子排列（不規則塊）、竹筷裡的碳原子位置都是示意；放大鏡內玻璃棒與管子同一比例（示意）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.rig || !O1.cBlob) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green, TEAL = COL.teal;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452;
  /* 第 1 步：分子卡 */
  const CW = 210, CY0 = 100, CY1 = 440;
  const CARDS = [
    { x: 135, t0: 0.6, fire: 3.0, ok: true, m: 'CO', fx: 'CO', S: 52, k: 1, name: () => L('一氧化碳', 'Carbon monoxide') },
    { x: 365, t0: 1.0, fire: 3.6, ok: true, m: 'CH4', fx: 'CH4', S: 40, k: 0.75, name: () => L('甲烷', 'Methane') },
    { x: 595, t0: 1.4, fire: 4.2, ok: true, m: 'H2', fx: 'H2', S: 56, k: 1, name: () => L('氫氣', 'Hydrogen') },
    { x: 825, t0: 1.8, fire: 5.2, ok: false, m: 'CO2', fx: 'CO2', S: 44, k: 0.85, name: () => L('二氧化碳', 'Carbon dioxide') }
  ];
  /* 第 2、3 步：縮小的乾餾裝置 */
  const RS = 0.75, RX = -40, RY = GY - RS * GY;          /* RY = 113：設計桌面 452 仍落在 452 */
  const RP = O1.rigPts({ x: RX, y: RY, s: RS });
  const OUT = { x: RP.outlet.x, y: RP.outlet.y };        /* 導管口 ≈ (488,291) */
  const COLX = RP.colTop.x;                              /* 收集管中線 ≈ 455 */
  /* 第 3 步：放大鏡＋試紙＋玻璃棒 */
  const MX = 660, MY = 215, MR = 115;
  const TW0 = 590, TW1 = 730, SURF = 200, TAR = 285, TBOT = 320;
  const LIT = { x: 740, y: 398, w: 190, h: 28 }, DOT = { x: 792, y: 412 };
  const ROD_LEN = 110, ROD_ANG = -75 * Math.PI / 180;
  /* 第 4 步 */
  const HT = { x: 60, y: 250, sc: 1.6 }, ZX = 720, ZY = 240, ZR = 130;

  /* 顏色 */
  const ACID = '#e8cf96', TARC = '#3a2414', BAMBOO = '#d8b98a';

  /* ═══════════ 背景 ═══════════ */
  function bench(c) {
    M3.ground(c, GY, {});
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 6 });
  }

  /* 分子（整顆一起縮放彈出）：k＝原子縮放、pop 0..1 */
  function molPop(c, m, x, y, S, k, pop) {
    if (pop <= 0.01) return;
    const sc = 0.5 + 0.5 * ease(pop) + 0.12 * Math.sin(Math.PI * pop);
    O1.mol(c, m, x, y, { scale: S * sc, atomScale: k * sc, a: clamp01(pop * 2) });
  }

  /* ═══════════ 第 1 步：四張分子卡 ═══════════ */
  function step1(c, s) {
    const A = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (A <= 0.02) return;
    const u = s.n === 1 ? s.u : 11, t = s.t;
    withA(c, A, () => {
      CARDS.forEach((d, i) => {
        const ca = clamp01((u - d.t0) / 0.5); if (ca <= 0.01) return;
        const dy = 24 * (1 - ease(ca)), x0 = d.x - CW / 2;
        const tagA = clamp01((u - (d.ok ? d.fire + 0.3 : 6.8)) / 0.4);
        withA(c, ca, () => {
          c.save(); c.translate(0, dy);
          O1.card(c, x0, CY0, CW, CY1 - CY0, { col: DIM, band: 86 });
          if (tagA > 0.02) O1.card(c, x0, CY0, CW, CY1 - CY0, { col: d.ok ? GREEN : CORAL, band: 86, a: tagA });
          molPop(c, O1.MOL[d.m], d.x, 248, d.S, d.k, clamp01((u - d.t0 - 0.1) / 0.5));
          c.restore();
          const na = clamp01((u - d.t0 - 0.3) / 0.4);
          T(c, na, d.name(), d.x, CY0 + 28 + dy, WHITE, 22);
          withA(c, na, () => O1.fx(c, d.fx, d.x, CY0 + 66 + dy, YEL, 30, 'center'));
        });
        /* 火苗 */
        const fb = 370 + dy;
        if (d.ok) {
          const f = clamp01((u - d.fire) / 0.4);
          if (f > 0.02) {
            if (u - d.fire < 0.5) W5.glow(c, d.x, fb - 20, 50, YEL, 0.6 * (1 - (u - d.fire) / 0.5));
            O1.flame(c, d.x, fb, 48 * ease(f), t + i * 0.41, { a: A, w: 15 });
          }
        } else {
          const f = clamp01((u - 5.2) / 0.4), dim = ease(clamp01((u - 5.6) / 0.6));
          if (f > 0.02) {
            O1.flame(c, d.x, fb, 48 * ease(f) * (1 - 0.55 * dim), t + 1.3, { a: A * (1 - 0.5 * dim), w: 15 * (1 - 0.4 * dim) });
            if (dim > 0.02 && u < 9) O1.smoke(c, d.x, fb - 30, t, { n: 6, h: 60, a: dim * (1 - clamp01((u - 7.5) / 1.5)), spread: 10, r: 6, speed: 0.4, col: '#9aa0a0', seed: 2 });
          }
          O1.noFire(c, d.x, 350 + dy, 34, { a: A, k: clamp01((u - 6.2) / 0.5), lw: 6 });
        }
        withA(c, A, () => P(c, tagA, d.ok ? L('可燃', 'Flammable') : L('不可燃', 'Not flammable'), d.x, 410 + dy, d.ok ? GREEN : CORAL, 22));
      });
    });
  }

  /* ═══════════ 第 2～3 步：縮小的乾餾裝置 ═══════════ */
  /* 導管口火焰：第 2 步 u 2.8 點燃，之後一直燒到第 4 步淡出 */
  const lit2 = s => (s.n === 2 ? clamp01((s.u - 2.8) / 0.5) : s.n > 2 ? 1 : 0);
  function rigA(s) { return s.n === 2 ? fin(s, 2, 0.3, 0.7) : s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.6) : 0; }
  function rig(c, s) {
    const A = rigA(s); if (A <= 0.02) return null;
    const lt = lit2(s);
    const R = O1.rig(c, {
      x: RX, y: RY, s: RS, a: A, t: s.t,
      lampOn: true, heat: 1, chipsDarkness: s.n === 2 ? lerp(0.75, 1, grow(s, 2, 0, 9)) : 1,
      smokeAmt: 1, gasAmt: 1 - 0.85 * lt, liquidAmt: 0.85, tarAmt: 0.75, drip: 1
    });
    if (lt > 0.02) {
      if (s.n === 2 && s.u > 2.8 && s.u < 3.5) W5.glow(c, OUT.x + 4, OUT.y - 14, 70, YEL, 0.8 * (1 - (s.u - 2.8) / 0.7));
      O1.flame(c, OUT.x + 4, OUT.y - 2, 54 * ease(lt), s.t + 0.7, { a: A, w: 15 });
    }
    return R;
  }

  /* 火柴（第 2 步）：自己從右下移到導管口，點燃後退回 */
  function match(c, s) {
    if (s.n !== 2) return;
    const u = s.u;
    const a = clamp01((u - 1.0) / 0.3) * (1 - clamp01((u - 4.0) / 0.3)); if (a <= 0.02) return;
    const go = ease(clamp01((u - 1.2) / 1.5)), back = ease(clamp01((u - 3.4) / 0.9));
    const x0 = 860, y0 = 420, x1 = OUT.x + 14, y1 = OUT.y - 12;
    const x = lerp(lerp(x0, x1, go), x0, back), y = lerp(lerp(y0, y1, go), y0 + 6, back);
    const lit = clamp01((u - 1.0) / 0.25) * (1 - clamp01((u - 3.6) / 0.3));
    O1.match(c, x, y, 0.5, { a, lit, burnt: clamp01((u - 3.6) / 0.3), t: s.t });
  }

  /* 第 2 步標籤＋右側框 */
  const GAS2 = [
    { fx: 'CO', m: 'CO', x: 668, t: 5.0, S: 32, k: 0.55 },
    { fx: 'CH4', m: 'CH4', x: 760, t: 5.4, S: 22, k: 0.5 },
    { fx: 'H2', m: 'H2', x: 852, t: 5.8, S: 30, k: 0.6 }
  ];
  function labels2(c, s) {
    const out = s.n === 2 ? 1 : s.n === 3 ? fout(s, 3, 0, 0.5) : 0; if (out <= 0.02) return;
    P(c, out * fin(s, 2, 0.8, 0.4), L('導管口', 'Gas outlet'), OUT.x - 20, OUT.y - 50, WHITE, 22, 'right');
    const ba = out * fin(s, 2, 4.4, 0.5); if (ba <= 0.02) return;
    withA(c, ba, () => {
      O1.card(c, 600, 140, 320, 190, { col: YEL, band: 0 });
      M3.dashArrow(c, 600, 236, lerp(600, OUT.x + 28, grow(s, 2, 4.4, 5.0)), lerp(236, OUT.y - 29, grow(s, 2, 4.4, 5.0)), YEL, 1, s.t * 1.5);
    });
    T(c, ba, L('可燃性氣體', 'Flammable gases'), 760, 174, YEL, 24);
    GAS2.forEach(g => {
      const q = s.n === 2 ? clamp01((s.u - g.t) / 0.4) : 1; if (q <= 0.01) return;
      withA(c, out * q, () => O1.fx(c, g.fx, g.x, 224, WHITE, 30, 'center'));
      withA(c, out, () => molPop(c, O1.MOL[g.m], g.x, 286, g.S, g.k, q));
    });
  }

  /* ═══════════ 第 3 步：放大收集管＋石蕊試紙 ═══════════ */
  /* 玻璃棒尖端位置（第 3 步 u） */
  function rodTip(u) {
    const up = { x: 697, y: 160 }, dip = { x: 673, y: 250 };
    if (u < 4.2) return up;
    if (u < 4.9) { const k = ease(clamp01((u - 4.2) / 0.6)); return { x: lerp(up.x, dip.x, k), y: lerp(up.y, dip.y, k) }; }
    if (u < 5.4) { const k = ease(clamp01((u - 4.9) / 0.5)); return { x: lerp(dip.x, up.x, k), y: lerp(dip.y, up.y, k) }; }
    if (u < 6.2) { const k = ease(clamp01((u - 5.4) / 0.8)); return { x: lerp(up.x, DOT.x, k), y: lerp(up.y, DOT.y - 2, k) - 40 * Math.sin(Math.PI * k) }; }
    if (u < 7.0) return { x: DOT.x, y: DOT.y - 2 };
    const k = ease(clamp01((u - 7.0) / 0.6)); return { x: DOT.x + 60 * k, y: DOT.y - 2 - 70 * k };
  }
  function zoomInner(c, s, r) {
    c.fillStyle = 'rgba(13,32,26,0.94)'; c.fillRect(MX - r, MY - r, 2 * r, 2 * r);
    W5.glow(c, MX, MY, r, TEAL, 0.06);
    const cxm = (TW0 + TW1) / 2, ri = (TW1 - TW0) / 2;
    const inner = () => { c.beginPath(); c.moveTo(TW0, MY - r - 20); c.lineTo(TW0, TBOT - ri); c.arc(cxm, TBOT - ri, ri, Math.PI, 0, true); c.lineTo(TW1, MY - r - 20); c.closePath(); };
    /* 管內液體 */
    c.save(); inner(); c.clip();
    const lg = c.createLinearGradient(0, SURF, 0, TAR); lg.addColorStop(0, W5.rgba(ACID, 0.30)); lg.addColorStop(1, W5.rgba(ACID, 0.46));
    c.fillStyle = lg; c.fillRect(TW0, SURF, TW1 - TW0, TAR - SURF + 4);
    /* 透明：看得到後面的黑板格線 */
    c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1;
    for (let x = TW0 + 20; x < TW1; x += 40) { c.beginPath(); c.moveTo(x, SURF + 4); c.lineTo(x, TAR); c.stroke(); }
    const tg = c.createLinearGradient(0, TAR, 0, TBOT); tg.addColorStop(0, '#4a2e18'); tg.addColorStop(1, '#1f130a');
    c.fillStyle = tg; c.beginPath(); c.moveTo(TW0, TAR + 3);
    for (let x = TW0; x <= TW1; x += 10) c.lineTo(x, TAR + 3 * Math.sin(x * 0.07 + 1) - 2);
    c.lineTo(TW1, TBOT + 10); c.lineTo(TW0, TBOT + 10); c.closePath(); c.fill();
    /* 焦油的黏稠光澤 */
    c.strokeStyle = 'rgba(255,200,140,0.22)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(TW0 + 22, TAR + 10); c.quadraticCurveTo(cxm, TAR + 2, TW1 - 26, TAR + 12); c.stroke();
    /* 液面 */
    c.strokeStyle = 'rgba(255,236,190,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(TW0, SURF); c.lineTo(TW1, SURF); c.stroke();
    /* 沾的時候：漣漪 */
    if (s.n === 3 && s.u > 4.7 && s.u < 5.6) {
      const k = (s.u - 4.7) / 0.9;
      c.strokeStyle = 'rgba(255,236,190,' + (0.8 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(680, SURF, 10 + 40 * k, 3 + 5 * k, 0, 0, TAU); c.stroke();
    }
    c.restore();
    /* 管壁 */
    const outer = () => { c.beginPath(); c.moveTo(TW0 - 3, MY - r - 20); c.lineTo(TW0 - 3, TBOT - ri); c.arc(cxm, TBOT - ri, ri + 3, Math.PI, 0, true); c.lineTo(TW1 + 3, MY - r - 20); };
    outer(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 9; c.stroke();
    outer(); c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 4; c.beginPath(); c.moveTo(TW0 + 10, MY - r); c.lineTo(TW0 + 10, TBOT - ri); c.stroke();
  }
  function step3(c, s) {
    const A = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.6) : 0; if (A <= 0.02) return;
    const u = s.n === 3 ? s.u : 11;
    O1.spot(c, [{ x: COLX, y: 395, r: 62 }], { a: A * fin(s, 3, 0.6, 0.6) });
    const r = MR * ease(clamp01((u - 1.0) / 0.8));
    withA(c, A, () => {
      M4.zoomLeader(c, COLX, 400, MX, MY, Math.max(r, 1), { a: fin(s, 3, 1.1, 0.5), col: WHITE, mark: 30 });
      if (r > 2) M3.magnifier(c, MX, MY, r, { handle: Math.PI / 2, len: 100, glassA: 0.35, inner: cc => zoomInner(cc, s, r) });
      /* 標籤＋引線 */
      const lead = (al, x0, y0, x1, y1) => {
        withA(c, al, () => {
          c.save(); c.lineCap = 'round';
          c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.strokeStyle = 'rgba(246,243,234,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.fillStyle = WHITE; c.beginPath(); c.arc(x1, y1, 4, 0, TAU); c.fill(); c.restore();
        });
      };
      const a1 = fin(s, 3, 2.0, 0.4), a2 = fin(s, 3, 2.6, 0.4);
      lead(a1, 532, 140, 622, 240); lead(a2, 532, 196, 620, 302);
      P(c, a1, L('透明的醋酸', 'Clear acetic acid'), 530, 140, YEL, 22, 'right');
      P(c, a2, L('深色黏稠的焦油', 'Dark, thick tar'), 530, 196, YEL, 22, 'right');
      /* 石蕊試紙 */
      const la = fin(s, 3, 3.4, 0.4);
      withA(c, la, () => O1.litmus(c, LIT.x, LIT.y, LIT.w, LIT.h, { k: 1.25 * grow(s, 3, 6.3, 7.4), cx: DOT.x, cy: DOT.y, wet: clamp01((u - 6.2) / 0.2) }));
      P(c, fin(s, 3, 3.6, 0.4), L('藍色石蕊試紙', 'Blue litmus paper'), 835, 452, TEAL, 22);
      /* 玻璃棒 */
      if (s.n === 3) {
        const ra = clamp01((u - 4.0) / 0.2) * (1 - clamp01((u - 7.2) / 0.4));
        if (ra > 0.02) {
          const p = rodTip(u);
          const x1 = p.x + ROD_LEN * Math.cos(ROD_ANG), y1 = p.y + ROD_LEN * Math.sin(ROD_ANG);
          const drop = u > 4.9 && u < 6.25 ? clamp01((u - 4.9) / 0.3) : 0;
          O1.rod(c, p.x, p.y, x1, y1, { a: ra, drop, dropCol: ACID });
          /* 沾在液體裡的那段：疊一層液體色（只在放大鏡內、液面以下） */
          if (u > 4.4 && u < 5.3) {
            c.save(); c.beginPath(); c.arc(MX, MY, r, 0, TAU); c.clip(); c.beginPath(); c.rect(TW0, SURF, TW1 - TW0, TAR - SURF); c.clip();
            c.strokeStyle = W5.rgba(ACID, 0.45); c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(x1, y1); c.stroke(); c.restore();
          }
        }
      }
      P(c, fin(s, 3, 7.6, 0.4), L('醋酸：酸性', 'Acetic acid: acidic'), 835, 350, CORAL, 22);
    });
  }

  /* ═══════════ 第 4 步：木炭＝碳 ═══════════ */
  function step4(c, s) {
    if (s.n !== 4) return;
    const u = s.u, t = s.t;
    const ta = fin(s, 4, 0.6, 0.6), dy = 24 * (1 - ease(clamp01((u - 0.6) / 0.6)));
    withA(c, ta, () => {
      c.save(); c.translate(HT.x, HT.y + dy); c.scale(HT.sc, HT.sc);
      O1.htube(c, { x: 0, y: 0, ang: 0, len: 300, r: 22, t, chips: 1, dark: 1, chip0: 10, chip1: 125, seed: 4, stopper: 'none' });
      c.restore();
    });
    P(c, fin(s, 4, 1.6, 0.4), L('黑色的木炭', 'Black charcoal'), 170, 170, WHITE, 22);
    /* 放大鏡＋碳原子塊 */
    const r = ZR * ease(clamp01((u - 2.4) / 0.8));
    M4.zoomLeader(c, 170, 272, ZX, ZY, Math.max(r, 1), { a: fin(s, 4, 2.5, 0.5), col: WHITE, mark: 40 });
    if (r > 2) M3.magnifier(c, ZX, ZY, r, { handle: -0.75, len: 80, glassA: 0.3, inner: cc => {
      cc.fillStyle = 'rgba(13,32,26,0.94)'; cc.fillRect(ZX - r, ZY - r, 2 * r, 2 * r);
      O1.cBlob(cc, ZX, ZY, { n: 30, r: 19, R: 98, k: grow(s, 4, 3.2, 5.2), seed: 5, glow: YEL });
    } });
    O1.stamp(c, [L('木炭＝碳', 'Charcoal = carbon')], ZX + 30, 414, { col: YEL, sizes: [28], rot: -0.05, slam: clamp01((u - 5.6) / 0.3), a: u > 5.6 ? 1 : 0, padY: 8 });
    /* 竹筷 */
    const ba = fin(s, 4, 6.6, 0.5), by = 392 + 16 * (1 - ease(clamp01((u - 6.6) / 0.5)));
    withA(c, ba, () => {
      c.save();
      c.fillStyle = 'rgba(0,0,0,0.22)'; W5.rr(c, 94, by + 4, 310, 12, 4); c.fill();
      const g = c.createLinearGradient(0, by - 6, 0, by + 6); g.addColorStop(0, '#ecd3a6'); g.addColorStop(1, '#b8915c');
      c.fillStyle = g; c.strokeStyle = 'rgba(60,36,16,0.9)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(90, by - 6); c.lineTo(400, by - 4); c.lineTo(400, by + 4); c.lineTo(90, by + 6); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(120,80,40,0.45)'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(100 + i * 4, by - 2 + i * 2); c.lineTo(390, by - 2 + i * 1.5); c.stroke(); }
      c.restore();
    });
    T(c, ba, L('竹筷', 'Chopstick'), 420, 398, WHITE, 22, 'left');
    [150, 230, 310].forEach((x, i) => {
      const q = clamp01((u - 7.2 - i * 0.2) / 0.4); if (q <= 0.01) return;
      W5.glow(c, x, by, 30, YEL, 0.35 * q);
      O1.atom(c, x, by, 'C', 15 * (0.6 + 0.4 * ease(q)), { a: q });
    });
    const ar = grow(s, 4, 8.0, 8.6);
    if (ar > 0.01) {
      const x0 = 250, y0 = 378, x1 = lerp(x0, 196, ar), y1 = lerp(y0, 300, ar);
      W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', 9, 20);
      W5.arrow(c, x0, y0, x1, y1, YEL, 5, 16);
    }
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('氣體', 'Gases'),
    () => L('點燃導管口', 'Light the gas outlet'),
    () => L('液體', 'Liquids'),
    () => L('固體', 'The solid')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('氣體：CO、CH₄、H₂ 可燃；CO₂ 不可燃', 'Gases: CO, CH₄ and H₂ burn; CO₂ does not'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('點燃導管口：氣體燒起來了——裡面有可燃性氣體', 'Light the outlet: the gas burns, so it contains flammable gases'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('液體：深色黏稠的焦油、透明的醋酸；醋酸使藍色石蕊試紙變紅', 'Liquids: dark thick tar, clear acetic acid; the acid turns blue litmus red'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.6, 0.6), L('固體：黑色的木炭——就是碳，竹筷裡本來就含有碳', 'Solid: black charcoal is carbon; the bamboo had carbon all along'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c);
    step1(c, s);
    rig(c, s);
    match(c, s);
    labels2(c, s);
    step3(c, s);
    step4(c, s);
    texts(c, s);
  }

  W5.register('products', { canvas: 'cvs-products', steps: DUR, draw });
})();
