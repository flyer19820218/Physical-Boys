/* ==================================================================
   organics_1 ｜ 同分異構物：同樣 9 顆原子，兩種接法（cvs-iso，960×540）
   四步：1 九顆原子 → 2 接成乙醇 → 3 接成甲醚 → 4 數一數鍵
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／caption、M4.L／T／P／withA／fin／fout／grow、
        O1.MOL.ETOH／MOL.DME／atom／bond／fx／card／stamp，以及本檔新增到 O1 的 O1.badge／freeDir／arcPt。

   科學內容（只用簡報）：2 顆碳、6 顆氫、1 顆氧＝9 顆原子，分子式 C₂H₆O；乙醇：氧接在碳和氫的中間（C−O−H）；
     甲醚：氧夾在兩個碳中間（C−O−C）；一顆沒多、一顆沒少；每個碳 4 條鍵、氧 2 條、氫 1 條；分子式相同、接法不同＝同分異構物。
     畫面上的數字只有：數原子的 1～9、鍵數 4／2／1、化學式下標。

   原子身分（9 顆從頭到尾是同一組，第 1～4 步位置連續）：
     i：0 碳甲、1 碳乙、2 氧、3～8 氫
     乙醇（O1.MOL.ETOH 的第幾顆）MAP_E = [0,1,2,4,5,6,7,8,3]：碳甲在左、碳乙在中、氧在右、氫 8 接在氧上
     甲醚（O1.MOL.DME 的第幾顆）  MAP_D = [0,2,1,3,4,5,6,8,7]：碳甲不動、氧與碳乙對調（氧往上拱、碳乙往下拱）、
       碳乙的兩顆氫（6、7）跟著碳乙往右，原本接在氧上的氫 8 移到碳乙的右邊。

   第 1 步（11 s）九顆原子：
     u 0.2 標題 → u 0.5～2.55 九顆原子依序從上方落下、散成一堆（每 0.2 s 一顆，順序 H C H O H C H H H）
     → u 2.5 三張分組卡淡入 → u 2.6～4.3 原子走弧線分成三堆（碳左、氫中、氧右；每顆晚 0.1 s，飛 0.9 s）
     → u 4.5 / 4.8 碳數 1、2 → u 5.1「碳 C × 2」→ u 5.4～6.9 氫數 1～6（每 0.3 s）→ u 7.2「氫 H × 6」
     → u 7.4 氧數 1 → u 7.6「氧 O × 1」→ u 8.0「9 顆原子 → 分子式」＋ C₂H₆O → u 8.6 字卡；u 9.2～11 靜止。
   第 2 步（11 s）接成乙醇：
     u 0～0.5 數字、分組卡、「碳 C × 2」等淡出；u 0.1～0.9 三堆原子滑到底部零件列；同時 C₂H₆O 縮小飛到右上角
     → u 1.0 碳甲、1.5 碳乙（C−C 鍵 u 2.3）、2.1 氧（C−O 鍵 u 2.9，黃）、2.7 氫 8（O−H 鍵 u 3.5，黃）飛進乙醇位置（每顆 0.8 s 弧線）
     → u 3.5 / 3.9 / 4.3 / 4.7 / 5.1 其餘五顆氫依序飛上碳（各自的 C−H 鍵在到達時長出）→ 最後一條鍵 u 5.9
     → u 6.3 C−O−H 三顆原子後面亮黃光、u 6.4「C−O−H」→ u 6.8「乙醇」→ u 8.0 字卡；u 8.6～11 靜止。
   第 3 步（11 s）接成甲醚：
     u 0～0.5「C−O−H」「乙醇」淡出 → u 0.6～1.1 八條鍵閃一下斷開（鍵中點白光）
     → u 0.8～1.6 原子稍微散開（離中心放大 1.28 倍＋確定性抖動）
     → u 1.9 碳甲回位 → u 2.4～3.3 氧往上拱、碳乙往下拱，兩顆對調（C−O 鍵 u 3.3，黃）
     → u 3.0 / 3.3 / 3.6 碳甲的三顆氫、u 3.9 / 4.2 / 4.5 碳乙的兩顆氫＋原本在氧上的氫（每顆 0.7 s）→ 最後一條鍵 u 5.2
     → u 5.8「C−O−C」→ u 6.2「甲醚」→ u 6.6～7.4 九顆原子依序標上 1～9 → u 7.8 上方「9 顆都在，沒多沒少」
     → u 8.2 字卡；u 8.8～11 靜止。
   第 4 步（12 s）數一數鍵：
     u 0～0.5 數字、標籤、右上 C₂H₆O 淡出 → u 0.2～1.4 甲醚縮小移到右邊 → u 0.8～1.6 左邊彈出一個乙醇
     → u 1.6「乙醇」「甲醚」→ u 2.2～3.4 碳的鍵亮綠、u 2.4 碳旁「4」→ u 3.8～4.8 氧的鍵亮綠、u 4.0 氧旁「2」
     → u 5.0～5.7 每顆氫旁「1」依序（每 0.05 s）、u 5.0～6.0 氫的鍵亮綠
     → u 6.4 兩個 C₂H₆O ＋ 中間「＝」→ u 7.2 印章「同分異構物」砸下 → u 8.4 字卡；u 9.0～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     背景 M3.backdrop 方格到 y 540，不畫桌面。
     第 1 步：散堆 PILE 在 x 330～640、y 220～368；分組卡 y 175～318：碳 x 125～285、氫 x 395～565、氧 x 695～845；
       碳 (175,250)(235,250)；氫 3×2 格 x 430／480／530、y 222／282；氧 (770,250)；
       數數小圓標在原子右上 45°、距中心 r＋13；「碳 C × 2」等 pill y 348（24px）；「9 顆原子 → 分子式」右對齊 (470,412)（24px）、C₂H₆O 中心 (540,412)（40px，黃）。
     第 2、3 步：分子中心 (480,270)、每單位 80 px（原子原尺寸）：乙醇 x 296～668、y 174～366；甲醚 x 296～664。
       零件列 y 440：碳 x 110／165、氫 x 300～550（每 50）、氧 x 820。右上角 C₂H₆O 中心 (860,110)（30px）。
       「乙醇」「甲醚」pill 中心 (170,270)（22px）；「C−O−H」pill (640,405)；「C−O−C」pill (480,405)（22px，黃）；
       「9 顆都在，沒多沒少」pill (480,102)（24px，綠）；1～9 小圓標放在每顆原子最空的方向（O1.freeDir）、距中心 r＋13。
     第 4 步：乙醇中心 (250,255)、甲醚中心 (710,255)，每單位 58 px、原子 0.8 倍；名稱 pill y 112（24px）；
       鍵數小圓標（r 12、18px）放在最空的方向、距中心 r＋13；C₂H₆O y 390（34px）x 250／710、「＝」(480,390)；印章 (480,448)（30px，綠）。
   字級：標題 24、字卡 24、標籤 22～24、化學式 30～40、原子元素符號 ≥ 16、小圓標 18（粒子小標籤）。
   示意：分子畫成平面展開（沿用 O1.MOL 的座標）；原子飛行路徑、散堆位置、拆開時的散開距離都是動畫示意，不代表真實反應過程。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.badge || !O1.MOL || !O1.MOL.ETOH) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, GREEN = COL.green, CORAL = COL.coral;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 原子身分 ── */
  const EL = ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H'];
  const MAP_E = [0, 1, 2, 4, 5, 6, 7, 8, 3];
  const MAP_D = [0, 2, 1, 3, 4, 5, 6, 8, 7];
  const inv = m => { const r = []; m.forEach((v, i) => { r[v] = i; }); return r; };
  const IE = inv(MAP_E), IDm = inv(MAP_D);
  const BE = O1.MOL.ETOH.bonds.map(b => [IE[b[0]], IE[b[1]]]);   /* 乙醇的鍵（身分編號） */
  const BD = O1.MOL.DME.bonds.map(b => [IDm[b[0]], IDm[b[1]]]);  /* 甲醚的鍵 */
  const same = (b, i, j) => (b[0] === i && b[1] === j) || (b[0] === j && b[1] === i);
  const HI_E = b => same(b, 1, 2) || same(b, 2, 8);               /* C−O−H */
  const HI_D = b => same(b, 0, 2) || same(b, 2, 1);               /* C−O−C */
  const R0 = i => O1.EL[EL[i]].r;

  function molPts(m, map, cx, cy, S) { return map.map(k => ({ x: cx + m.atoms[k].x * S, y: cy + m.atoms[k].y * S })); }

  /* ── 版面 ── */
  const MX = 480, MY = 270, MS = 80;
  const E2 = molPts(O1.MOL.ETOH, MAP_E, MX, MY, MS);
  const D3 = molPts(O1.MOL.DME, MAP_D, MX, MY, MS);
  const E4C = { x: 250, y: 255 }, D4C = { x: 710, y: 255 }, S4 = 58, K4 = 0.8;
  const E4 = molPts(O1.MOL.ETOH, MAP_E, E4C.x, E4C.y, S4);
  const D4 = molPts(O1.MOL.DME, MAP_D, D4C.x, D4C.y, S4);

  /* 第 1 步：散堆（落下的位置）、落下順序、三堆 */
  const PILE = [{ x: 395, y: 290 }, { x: 585, y: 255 }, { x: 500, y: 310 }, { x: 330, y: 250 }, { x: 445, y: 220 },
                { x: 520, y: 235 }, { x: 640, y: 315 }, { x: 560, y: 352 }, { x: 455, y: 368 }];
  const ORD = [4, 0, 6, 2, 8, 1, 3, 7, 5];
  const GRP = [{ x: 175, y: 250 }, { x: 235, y: 250 }, { x: 770, y: 250 },
               { x: 430, y: 222 }, { x: 480, y: 222 }, { x: 530, y: 222 }, { x: 430, y: 282 }, { x: 480, y: 282 }, { x: 530, y: 282 }];
  const CARDS = [{ x0: 125, x1: 285, cx: 205, el: 'C' }, { x0: 395, x1: 565, cx: 480, el: 'H' }, { x0: 695, x1: 845, cx: 770, el: 'O' }];
  const CY0 = 175, CY1 = 318;
  /* 數數時間（第 1 步）：碳 4.5／4.8、氫 5.4～6.9、氧 7.4 */
  const CNT1 = [4.5, 4.8, 7.4, 5.4, 5.7, 6.0, 6.3, 6.6, 6.9];
  const CNT1N = [1, 2, 1, 1, 2, 3, 4, 5, 6];
  /* 第 2 步：零件列＋飛進乙醇的時間 */
  const ROW = [{ x: 110, y: 440 }, { x: 165, y: 440 }, { x: 820, y: 440 },
               { x: 300, y: 440 }, { x: 350, y: 440 }, { x: 400, y: 440 }, { x: 450, y: 440 }, { x: 500, y: 440 }, { x: 550, y: 440 }];
  const TF2 = [1.0, 1.5, 2.1, 3.5, 3.9, 4.3, 4.7, 5.1, 2.7], FD2 = 0.8;
  /* 第 3 步：散開位置、回位時間與拱高 */
  const LOOSE = E2.map((p, i) => ({ x: MX + (p.x - MX) * 1.28 + (hash(i * 3 + 7) - 0.5) * 24, y: MY + (p.y - MY) * 1.28 + (hash(i * 5 + 2) - 0.5) * 24 }));
  const TF3 = [1.9, 2.4, 2.4, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5], FD3 = 0.7;
  const LIFT3 = [40, -80, 80, 40, 40, 40, 50, 50, 50];
  const CNT3 = 6.6;                                       /* 1～9 從 u 6.6 起每 0.1 s 一顆 */
  /* 角落化學式 */
  const FX1 = { x: 540, y: 412, size: 40 }, FXC = { x: 860, y: 110, size: 30 };

  /* ═══════════ 畫原子與鍵 ═══════════ */
  /* pts[i]＝{x,y,k 原子縮放,a,top 是否畫在最上層}；bonds＝[{i,j,a,col,glow}] */
  function drawSet(c, pts, bonds) {
    bonds.forEach(b => {
      const A = pts[b.i], B = pts[b.j], a = Math.min(b.a, A.a, B.a); if (a <= 0.02) return;
      const k = Math.min(A.k, B.k);
      if (b.glow > 0.02) W5.glow(c, (A.x + B.x) / 2, (A.y + B.y) / 2, 46 * k, b.col || YEL, 0.5 * b.glow);
      O1.bond(c, A.x, A.y, B.x, B.y, { a, col: b.col, lw: Math.max(3, 6 * k) });
    });
    const idx = pts.map((p, i) => i).filter(i => pts[i].a > 0.02);
    idx.sort((i, j) => ((pts[i].top ? 1 : 0) - (pts[j].top ? 1 : 0)) || (R0(j) - R0(i)));
    idx.forEach(i => {
      const p = pts[i];
      if (p.glow > 0.02) W5.glow(c, p.x, p.y, R0(i) * p.k * 2.4, p.gcol || YEL, 0.45 * p.glow);
      O1.atom(c, p.x, p.y, EL[i], R0(i) * p.k, { a: p.a });
    });
  }
  /* 鍵的透明度：兩端都到了之後 0.25 s 長出 */
  const bondIn = (u, t) => clamp01((u - t) / 0.25);

  /* ═══════════ 9 顆原子的狀態（第 1～3 步，第 4 步的甲醚也用它） ═══════════ */
  function state(s) {
    const n = s.n, u = s.u, pts = [], bonds = [];
    if (n === 1) {
      for (let i = 0; i < 9; i++) {
        const ta = 0.5 + ORD.indexOf(i) * 0.2, kd = clamp01((u - ta) / 0.45);
        const tg = 2.6 + i * 0.1, kg = ease(clamp01((u - tg) / 0.9));
        let p;
        if (kg > 0) p = O1.arcPt(PILE[i], GRP[i], kg, 60);
        else {
          /* 落下：最後一小段輕彈 */
          const e = ease(kd), bounce = kd > 0.7 ? Math.sin((kd - 0.7) / 0.3 * Math.PI) * 6 : 0;
          p = { x: PILE[i].x, y: PILE[i].y - 80 * (1 - e) - bounce };
        }
        pts.push({ x: p.x, y: p.y, k: 1, a: clamp01(kd * 3), top: kg > 0 && kg < 1 });
      }
    } else if (n === 2) {
      for (let i = 0; i < 9; i++) {
        const kr = ease(clamp01((u - 0.1 - i * 0.03) / 0.8));
        const kf = ease(clamp01((u - TF2[i]) / FD2));
        let p = O1.arcPt(GRP[i], ROW[i], kr, 30);
        if (kf > 0) p = O1.arcPt(ROW[i], E2[i], kf, 70);
        pts.push({ x: p.x, y: p.y, k: 1, a: 1, top: kf > 0 && kf < 1 });
      }
      BE.forEach(b => {
        const t = Math.max(TF2[b[0]], TF2[b[1]]) + FD2, hi = HI_E(b), a = bondIn(u, t);
        bonds.push({ i: b[0], j: b[1], a, col: hi ? YEL : null, glow: hi ? clamp01(1 - (u - t) / 0.8) * (a > 0 ? 1 : 0) : 0 });
      });
      /* C−O−H 三顆後面亮黃光 */
      const g = clamp01((u - 6.3) / 0.4);
      [1, 2, 8].forEach(i => { pts[i].glow = g; });
    } else if (n === 3) {
      const kd = ease(clamp01((u - 0.8) / 0.8));
      for (let i = 0; i < 9; i++) {
        const lp = { x: lerp(E2[i].x, LOOSE[i].x, kd), y: lerp(E2[i].y, LOOSE[i].y, kd) };
        const kf = ease(clamp01((u - TF3[i]) / FD3));
        const p = kf > 0 ? O1.arcPt(LOOSE[i], D3[i], kf, LIFT3[i]) : lp;
        pts.push({ x: p.x, y: p.y, k: 1, a: 1, top: kf > 0 && kf < 1 });
      }
      /* 乙醇的鍵斷開 */
      const br = clamp01((u - 0.6) / 0.5);
      BE.forEach(b => {
        if (br < 1) bonds.push({ i: b[0], j: b[1], a: 1 - br, col: HI_E(b) ? YEL : null, glow: 0 });
      });
      /* 甲醚的鍵 */
      BD.forEach(b => {
        const t = Math.max(TF3[b[0]], TF3[b[1]]) + FD3, hi = HI_D(b), a = bondIn(u, t);
        bonds.push({ i: b[0], j: b[1], a, col: hi ? YEL : null, glow: hi ? clamp01(1 - (u - t) / 0.8) * (a > 0 ? 1 : 0) : 0 });
      });
    } else {
      /* 第 4 步：甲醚縮小移到右邊 */
      const km = ease(clamp01((u - 0.2) / 1.2)), k = lerp(1, K4, km);
      for (let i = 0; i < 9; i++) pts.push({ x: lerp(D3[i].x, D4[i].x, km), y: lerp(D3[i].y, D4[i].y, km), k, a: 1 });
      BD.forEach(b => bonds.push({ i: b[0], j: b[1], a: 1, col: HI_D(b) ? YEL : null, glow: 0 }));
    }
    return { pts, bonds };
  }

  /* 鍵斷開的白光（第 3 步 u 0.6～1.1） */
  function breakSparks(c, s) {
    if (s.n !== 3) return;
    const k = (s.u - 0.6) / 0.5; if (k < 0 || k > 1) return;
    BE.forEach((b, q) => {
      const A = E2[b[0]], B = E2[b[1]];
      W5.glow(c, (A.x + B.x) / 2, (A.y + B.y) / 2, 20 + 26 * k, WHITE, 0.7 * Math.sin(Math.PI * k));
    });
  }

  /* 小圓標的位置：在 pts 的 bonds 下最空的方向、距中心 r＋13 */
  function badgeAt(pts, bl, i, k) {
    const th = O1.freeDir(pts, bl, i), d = R0(i) * (k || 1) + 13;
    return { x: pts[i].x + Math.cos(th) * d, y: pts[i].y + Math.sin(th) * d };
  }

  /* ═══════════ 第 1 步：分組卡、數數、分子式 ═══════════ */
  function step1(c, s) {
    const A = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (A <= 0.02) return;
    const u = s.n === 1 ? s.u : 11;
    withA(c, A, () => {
      CARDS.forEach(d => O1.card(c, d.x0, CY0, d.x1 - d.x0, CY1 - CY0, { col: DIM, a: clamp01((u - 2.5) / 0.4) }));
    });
  }
  function step1Top(c, s) {
    const A = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (A <= 0.02) return;
    const u = s.n === 1 ? s.u : 11;
    withA(c, A, () => {
      for (let i = 0; i < 9; i++) {
        const k = clamp01((u - CNT1[i]) / 0.3); if (k <= 0.01) continue;
        const d = R0(i) + 13, p = GRP[i];
        if (u - CNT1[i] < 0.5) W5.glow(c, p.x, p.y, R0(i) * 2.4, YEL, 0.6 * (1 - (u - CNT1[i]) / 0.5));
        O1.badge(c, p.x + d * 0.707, p.y - d * 0.707, CNT1N[i], { k });
      }
    });
    const pa = [5.1, 7.2, 7.6];
    const names = [() => L('碳 C × 2', 'Carbon C × 2'), () => L('氫 H × 6', 'Hydrogen H × 6'), () => L('氧 O × 1', 'Oxygen O × 1')];
    [0, 1, 2].forEach(q => P(c, A * fin(s, 1, pa[q], 0.4), names[q](), CARDS[q].cx, 348, YEL, 24));
    T(c, A * fin(s, 1, 8.0, 0.5), L('9 顆原子 → 分子式', '9 atoms → formula'), 470, FX1.y, WHITE, 24, 'right');
  }
  /* 分子式 C₂H₆O：第 1 步 u 8.0 出現；第 2 步飛到右上角；第 4 步淡出 */
  function formula(c, s) {
    let a, x = FX1.x, y = FX1.y, sz = FX1.size;
    if (s.n === 1) a = fin(s, 1, 8.0, 0.5);
    else if (s.n === 4) { a = fout(s, 4, 0, 0.5); x = FXC.x; y = FXC.y; sz = FXC.size; }
    else {
      a = 1; const k = grow(s, 2, 0.1, 0.9);
      const p = O1.arcPt(FX1, FXC, k, 40); x = p.x; y = p.y; sz = lerp(FX1.size, FXC.size, k);
    }
    if (a <= 0.02) return;
    if (s.n === 1 && s.u > 8.0 && s.u < 8.8) W5.glow(c, x, y, 80, YEL, 0.4 * (1 - (s.u - 8.0) / 0.8));
    withA(c, a, () => O1.fx(c, 'C2H6O', x, y, YEL, Math.round(sz), 'center'));
  }

  /* ═══════════ 第 2、3 步標籤 ═══════════ */
  function labels23(c, s, pts) {
    /* 第 2 步 */
    const o2 = s.n === 2 ? 1 : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    if (o2 > 0.02) {
      P(c, o2 * fin(s, 2, 6.4, 0.4), 'C−O−H', 640, 405, YEL, 22);
      P(c, o2 * fin(s, 2, 6.8, 0.4), L('乙醇', 'Ethanol'), 170, MY, WHITE, 22);
    }
    /* 第 3 步 */
    const o3 = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.5) : 0;
    if (o3 > 0.02) {
      P(c, o3 * fin(s, 3, 5.8, 0.4), 'C−O−C', 480, 405, YEL, 22);
      P(c, o3 * fin(s, 3, 6.2, 0.4), L('甲醚', 'Dimethyl ether'), 170, MY, WHITE, 22);
      const kk = pts[0].k || 1;
      for (let i = 0; i < 9; i++) {
        const t0 = CNT3 + i * 0.1, k = s.n === 3 ? clamp01((s.u - t0) / 0.3) : 1; if (k <= 0.01) continue;
        const p = badgeAt(pts, BD, i, kk);
        O1.badge(c, p.x, p.y, i + 1, { k, col: GREEN, a: o3 });
      }
      P(c, o3 * fin(s, 3, 7.8, 0.4), L('9 顆都在，沒多沒少', 'All 9 atoms: none added, none lost'), 480, 102, GREEN, 24);
    }
  }

  /* ═══════════ 第 4 步：並排數鍵 ═══════════ */
  /* 數鍵的時間：碳、氧、氫 */
  const CNT4 = { C: { hl: 2.2, b: 2.4, n: 4 }, O: { hl: 3.8, b: 4.0, n: 2 }, H: { hl: 5.0, b: 5.0, n: 1 } };
  function hlAmt(u, el) { const t = CNT4[el].hl; return clamp01((u - t) / 0.3) * (1 - clamp01((u - t - 1.0) / 0.3)); }
  function step4(c, s, st) {
    if (s.n !== 4) return;
    const u = s.u;
    /* 左邊的乙醇（另一組原子，彈出） */
    const pop = clamp01((u - 0.8) / 0.8), ps = 0.6 + 0.4 * ease(pop) + 0.1 * Math.sin(Math.PI * pop);
    const ePts = E4.map((p, i) => ({ x: E4C.x + (p.x - E4C.x) * ps, y: E4C.y + (p.y - E4C.y) * ps, k: K4 * ps, a: clamp01(pop * 2) }));
    const eB = BE.map(b => ({ i: b[0], j: b[1], a: 1, hi: HI_E(b) }));
    const dB = BD.map(b => ({ i: b[0], j: b[1], a: 1, hi: HI_D(b) }));
    const dPts = st.pts;
    /* 數鍵時：碰到正在數的元素的鍵亮綠（光暈＋變色），數完回原色（C−O−H／C−O−C 仍是黃） */
    [[ePts, eB], [dPts, dB]].forEach(([pts, bl]) => {
      bl.forEach(b => {
        const h = Math.max(hlAmt(u, EL[b.i]), hlAmt(u, EL[b.j]));
        b.col = h > 0.5 ? GREEN : b.hi ? YEL : null; b.glow = h;
        if (h > 0.02) { const A = pts[b.i], B = pts[b.j]; W5.glow(c, (A.x + B.x) / 2, (A.y + B.y) / 2, 36, GREEN, 0.5 * h * Math.min(A.a, B.a)); }
      });
      drawSet(c, pts, bl.map(b => ({ i: b.i, j: b.j, a: b.a, col: b.col, glow: 0 })));
    });
    /* 名稱 */
    P(c, fin(s, 4, 1.6, 0.4), L('乙醇', 'Ethanol'), E4C.x, 112, WHITE, 24);
    P(c, fin(s, 4, 1.6, 0.4), L('甲醚', 'Dimethyl ether'), D4C.x, 112, WHITE, 24);
    /* 鍵數小圓標 */
    [[E4, BE], [D4, BD]].forEach(([pts0, bl]) => {
      let hj = 0;
      for (let i = 0; i < 9; i++) {
        const cn = CNT4[EL[i]], t0 = EL[i] === 'H' ? cn.b + (hj++) * 0.05 : cn.b;
        const k = clamp01((u - t0) / 0.3); if (k <= 0.01) continue;
        const p = badgeAt(pts0, bl, i, K4);
        O1.badge(c, p.x, p.y, cn.n, { k, r: 12, col: EL[i] === 'C' ? YEL : EL[i] === 'O' ? CORAL : WHITE });
      }
    });
    /* 分子式相同 */
    const fa = fin(s, 4, 6.4, 0.5);
    withA(c, fa, () => {
      O1.fx(c, 'C2H6O', E4C.x, 390, YEL, 34, 'center');
      O1.fx(c, 'C2H6O', D4C.x, 390, YEL, 34, 'center');
    });
    T(c, fa, L('＝', '='), 480, 390, WHITE, 34);
    O1.stamp(c, [L('同分異構物', 'Isomers')], 480, 448, { col: GREEN, sizes: [30], rot: -0.05, slam: clamp01((u - 7.2) / 0.3), a: u > 7.2 ? 1 : 0, padY: 8 });
  }
  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('九顆原子', 'Nine atoms'),
    () => L('接成乙醇', 'Build ethanol'),
    () => L('接成甲醚', 'Build dimethyl ether'),
    () => L('數一數鍵', 'Count the bonds')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.6, 0.6) * fout(s, 2, 0, 0.4), L('2 顆碳、6 顆氫、1 顆氧，一共 9 顆原子：分子式 C₂H₆O', '2 carbons, 6 hydrogens, 1 oxygen: 9 atoms, formula C₂H₆O'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('乙醇：氧接在碳和氫的中間（C−O−H）', 'Ethanol: the O sits between a C and an H (C−O−H)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('甲醚：氧夾在兩個碳中間（C−O−C）；一顆沒多、一顆沒少', 'Dimethyl ether: O between two Cs (C−O−C); none added, none lost'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.4, 0.6), L('每個碳 4 條鍵、氧 2 條、氫 1 條——分子式相同、接法不同＝同分異構物', 'C: 4 bonds, O: 2, H: 1. Same formula, different links = isomers'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 540, cell: 40 });
    step1(c, s);
    formula(c, s);
    const st = state(s);
    if (s.n === 4) step4(c, s, st);
    else { breakSparks(c, s); drawSet(c, st.pts, st.bonds); }
    if (s.n <= 2) step1Top(c, s);
    if (s.n >= 2) labels23(c, s, st.pts);
    texts(c, s);
  }

  W5.register('iso', { canvas: 'cvs-iso', steps: DUR, draw });
})();
