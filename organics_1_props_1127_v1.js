/* ==================================================================
   organics_1 ｜ 結構不同，性質完全不同（cvs-props，960×540）
   四步：1 同一個分子式 → 2 常溫狀態 → 3 溶解度與殺菌 → 4 丟入金屬鈉
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／caption、M4.L／T／P／withA／fin／fout／grow／cup／lid、
        O1.MOL.ETOH／MOL.DME／atom／bond／fx／fxHi／arcPt（與 iso 同一套分子、同樣的黃色 C−O−H／C−O−C 鍵），
        以及本檔新增到 O1 的 O1.miniMol／dropper／germ／naBlock／bubble。

   科學內容（只用簡報）：乙醇和甲醚的分子式都是 C₂H₆O；乙醇常溫是液體、甲醚常溫是氣體；
     乙醇溶於水、可殺菌；甲醚在水中的溶解度比乙醇小得多；丟入鈉：乙醇反應、冒氣泡產生氣體，甲醚不反應；
     乙醇有 −OH、甲醚沒有 −OH。氣泡成分畫面只寫「產生氣體」（不寫氫氣）。畫面上的數字只有化學式下標。
   器材移動（不畫手）：滴管、鈉塊、玻璃導管、容器蓋都自己移動。

   左邊一律是乙醇、右邊一律是甲醚（兩邊同步對照）；第 2～4 步上方保留兩個小分子結構當「表頭」。

   第 1 步（11 s）同一個分子式：
     u 0.2 標題 → u 0.5～1.3 乙醇彈出（左）→ u 0.9～1.7 甲醚彈出（右）→ u 1.6「乙醇」「甲醚」名稱
     → u 2.4 乙醇下方 C₂H₆O、u 2.8 甲醚下方 C₂H₆O（白字）
     → 數元素：u 3.4～4.2 兩個分子的碳＋式子裡的 C 亮黃、u 4.3～5.1 氫＋H、u 5.2～6.0 氧＋O
     → u 6.0 兩個式子變黃＋中間「＝」→ u 6.8 黃色的 C−O−H／C−O−C 鍵閃光＋「排列結構不同」
     → u 7.8 字卡；u 8.4～11 靜止。
   第 2 步（11 s）常溫狀態：
     u 0～1.0 兩個分子縮小飛到上方當表頭、名稱一起上移；式子、「＝」、「排列結構不同」淡出
     → u 0.6 中間虛線分隔、兩個容器淡入（左：開口燒杯；右：有蓋容器）
     → u 1.2～3.45 六個小乙醇分子依序落進左杯（每 0.3 s 一顆），液面跟著升高（u 1.5～3.7）→ 分子緊挨著、持續緩慢流動
     → u 3.6「液體」、u 3.9「分子緊挨著」
     → u 3.8 右邊容器底部出現一團四個小甲醚分子 → u 4.2～5.6 各自飛散到整個容器，之後持續四處亂飛、碰壁反彈
     → u 5.6「氣體」、u 5.9「分子四處飛散」→ u 7.4 字卡；u 8.0～11 靜止（分子持續運動）。
   第 3 步（12 s）溶解度與殺菌：
     u 0～0.5 第 2 步的液體、分子、標籤淡出；右邊蓋子往上抬走 → u 0.5～1.2 兩杯水升到液面 → u 1.2「水」
     → 左：u 1.0～1.5 滴管（淡紫色乙醇）降到左杯上方 → u 1.8、2.4 兩滴落下（各 0.22 s 落到水面、漣漪）
       → u 2.0～5.0 淡紫色從落點擴散、u 3.2～5.0 整杯變均勻 → u 5.0「混合均勻」
       → u 5.4～6.2 滴管飛到右邊小玻片上方 → u 6.3 滴一滴、u 6.5～6.9 玻片上一小灘乙醇 → u 6.8～7.4 滴管上移淡出
       細菌：u 1.2 三隻細菌淡入，在玻片上方原地游動（鞭毛擺動）→ u 7.0～8.0 游向那灘乙醇 → u 8.0～8.5 停止擺動、變灰
       → u 8.6「可殺菌」
     → 右：u 0.6～1.2 玻璃導管伸進右杯水中 → u 2.0～6.05 十個甲醚氣泡依序冒出（每 0.45 s 一個，上升 1.5 s）
       → 大部分浮到水面破掉、變成小甲醚分子往上飄走淡出；第 3、7 個在水中途縮小、變成小分子留在水裡（緩慢漂移）
       → u 4.8「大部分浮出水面」、u 5.8「只有少量溶進」
     → u 9.2 字卡；u 9.8～12 靜止（溶進的分子輕微漂移）。
   第 4 步（12 s）丟入金屬鈉：
     u 0～0.5 第 3 步內容淡出 → u 0.4～1.0 左杯升起淡紫色乙醇（液體）、右邊蓋子回來、甲醚分子淡入（氣體，持續亂飛）
     → u 0.9 兩塊鈉（銀灰小方塊）出現在中間兩側、u 1.0「鈉」標籤（u 2.2 淡出）
     → 左：u 1.6～2.4 鈉塊走弧線到左杯上方 → u 2.4～3.1 落入乙醇、沉到杯底（u ≈ 2.55 液面漣漪）
       → u 3.1 起鈉塊表面不斷冒出氣泡（每 0.05 s 一顆、上升 0.9～1.4 s、到液面破掉）
       → u 4.0「冒氣泡」、u 4.4「產生氣體」
     → 右：u 1.4～2.0 蓋子往右滑開 → u 2.0～2.8 鈉塊走弧線到容器口 → u 2.8～3.5 掉到容器底、靜止不動 → u 3.6～4.2 蓋子滑回
       → u 4.8「不反應」
     → u 5.6～6.2 表頭乙醇的 O、H 亮黃，黃色虛線橢圓把 −OH 圈出來＋「−OH」→ u 6.4 表頭甲醚旁「沒有 −OH」
     → u 7.4 字卡；u 8.0～12 靜止（氣泡、氣體分子持續）。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     背景 M3.backdrop 方格到 y 540，不畫桌面。
     第 1 步（與 iso 第 4 步相同）：乙醇中心 (250,255)、甲醚中心 (710,255)，每單位 58 px、原子 0.8 倍；名稱 pill y 112（24px）；
       C₂H₆O y 390（34px）x 250／710、「＝」(480,390)（34px）；「排列結構不同」pill (480,445)（24px）。
     第 2～4 步表頭：乙醇 (200,168)、甲醚 (760,168)，每單位 32 px、原子 0.55 倍（範圍約 y 120～216）；名稱 pill y 96（24px）。
       中間虛線 x 480、y 86～470。
     容器（M4.cup）：左 cx 190、右 cx 770；杯口 y 262、杯底 y 438、杯口內半寬 78、杯底內半寬 66、壁 6、底厚 10。
       右容器的蓋子 M4.lid（蓋板 y 244～256，x 682～858）；第 4 步往右滑開 95 px（最右 953）。
       第 2 步左杯液面 y 362、小分子兩排 y 420／388、x cx−40／cx／cx＋40（每單位 9 px、原子 0.26 倍，不寫元素符號）；
       右容器氣體分子中心範圍 x 728～812、y 292～412（四個圓盤 r 23 彈性碰撞，載入時算好位置表，用 s.t 查表，純函式）。
       第 3 步水面 y 330；滴管尖端 (215,300)（全長 81，頂端 y 219）→ 玻片上方 (380,408)；玻片 x 320～440、y 440～447；乙醇小灘中心 (380,437)；
       細菌三隻：原地游動中心 (328,396)(432,398)(382,384) → 停在 (334,429)(428,429)(381,411)，頭都朝乙醇；
       玻璃導管 x 792、y 236～420；氣泡從 (792,420) 升到水面；氣泡出導管後偏到 x≈770 上升；溶進的兩個分子最後停在 (712,350)(757,376) 附近；飄走的分子往左上。
       第 4 步左杯乙醇液面 y 332；鈉塊 30×22，起點 (377,300)／(583,300)，左落點 (190,427)、右落點 (735,427)。
     標籤欄：左 x 377、右 x 583（杯子外緣與中線之間，寬度 ≤ 約 190 px）：上排 y 300、下排 y 350（第 2 步）／ y 300、350（第 3、4 步）；
       「−OH」pill (340,140)；「沒有 −OH」pill (583,168)；「水」pill (168,408)／(735,408)；「鈉」pill y 345。
   字級：標題 24、字卡 24、名稱 24、狀態與性質標籤 22～24、化學式 34、表頭原子元素符號 16。
   示意：分子平面展開（同 O1.MOL）；容器內的小分子不寫元素符號、數量（液體 6、氣體 4）與運動速度是示意；
     乙醇在水中的淡紫色只是為了看得出擴散（乙醇本身無色）；細菌形狀、玻片、氣泡大小數量、溶進的分子數（10 個裡 2 個）、
     鈉塊大小與沉到杯底、甲醚容器打開蓋子放鈉塊，都是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.MOL || !O1.MOL.ETOH || !O1.miniMol) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, GREEN = COL.green, CORAL = COL.coral, TEAL = COL.teal;
  const DUR = [11, 11, 12, 12];                         /* 總長 46 秒 */
  const ETH = '#c39bff';                                /* 乙醇示意色（淡紫） */

  const ME = O1.MOL.ETOH, MD = O1.MOL.DME;
  const HI_E = [[1, 2], [2, 3]], HI_D = [[0, 1], [1, 2]];   /* C−O−H、C−O−C（O1.MOL 原子編號） */

  /* ── 版面 ── */
  const E1 = { x: 250, y: 255 }, D1 = { x: 710, y: 255 }, S1 = 58, K1 = 0.8, NY1 = 112;
  const EH = { x: 200, y: 168 }, DH = { x: 760, y: 168 }, SH = 32, KH = 0.55, NYH = 96;
  const CL = 190, CR = 770, RIM = 262, BOT = 438, RT = 78, RB = 66;
  const LX = 377, RX = 583;
  const half = y => RB + (RT - RB) * (BOT - y) / (BOT - RIM);
  const MS = 9, MK = 0.26;                              /* 容器裡的小分子 */

  /* 只屬於第 n 步的東西：第 n 步 t 秒淡入、下一步開頭 0.5 s 淡出 */
  const only = (s, n, t, d) => (s.n === n ? fin(s, n, t, d || 0.5) : s.n === n + 1 ? fout(s, n + 1, 0, 0.5) : 0);
  /* 第 n 步的「步內時間」（下一步淡出時停在結尾） */
  const uu = (s, n) => (s.n === n ? s.u : s.n > n ? DUR[n - 1] : 0);

  /* ═══════════ 大分子（球棒、有元素符號） ═══════════ */
  /* o：{ a, glowEl 要發光的元素, glow 0..1, hiGlow 黃鍵閃光 0..1, ring:[原子編號] 額外黃光 } */
  function drawMol(c, m, hi, cx, cy, S, K, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const pts = m.atoms.map(A => ({ x: cx + A.x * S, y: cy + A.y * S }));
    const isHi = b => hi.some(h => (h[0] === b[0] && h[1] === b[1]) || (h[0] === b[1] && h[1] === b[0]));
    withA(c, a, () => {
      m.bonds.forEach(b => {
        const A = pts[b[0]], B = pts[b[1]], h = isHi(b);
        if (h && o.hiGlow > 0.02) W5.glow(c, (A.x + B.x) / 2, (A.y + B.y) / 2, 46 * K, YEL, 0.6 * o.hiGlow);
        O1.bond(c, A.x, A.y, B.x, B.y, { lw: Math.max(3, 6 * K), col: h ? YEL : null });
      });
      m.atoms.map((A, i) => i).sort((i, j) => O1.EL[m.atoms[j].el].r - O1.EL[m.atoms[i].el].r).forEach(i => {
        const A = m.atoms[i], r = O1.EL[A.el].r * K;
        if (o.glow > 0.02 && A.el === o.glowEl) W5.glow(c, pts[i].x, pts[i].y, r * 2.6, YEL, 0.6 * o.glow);
        if (o.ring && o.ring.indexOf(i) >= 0 && o.ringA > 0.02) W5.glow(c, pts[i].x, pts[i].y, r * 2.6, YEL, 0.55 * o.ringA);
        O1.atom(c, pts[i].x, pts[i].y, A.el, r);
      });
    });
    return pts;
  }

  /* 分子與名稱的位置：第 1 步大、第 2 步開頭縮到表頭 */
  function molPlace(s, big, head) {
    if (s.n === 1) {
      return { x: big.x, y: big.y, S: S1, K: K1, ny: NY1 };
    }
    const k = s.n === 2 ? ease(clamp01(s.u / 1.0)) : 1;
    return { x: lerp(big.x, head.x, k), y: lerp(big.y, head.y, k), S: lerp(S1, SH, k), K: lerp(K1, KH, k), ny: lerp(NY1, NYH, k) };
  }

  /* 第 1 步數元素：C 3.4～4.2、H 4.3～5.1、O 5.2～6.0 */
  const CNT = [{ el: 'C', t: 3.4 }, { el: 'H', t: 4.3 }, { el: 'O', t: 5.2 }];
  function counting(u) {
    for (const q of CNT) if (u >= q.t && u < q.t + 0.8) return { el: q.el, g: Math.sin(Math.PI * clamp01((u - q.t) / 0.8)) };
    return null;
  }

  function molecules(c, s) {
    const u = s.u;
    let cnt = null, hiGlow = 0, popE = 1, popD = 1;
    if (s.n === 1) {
      cnt = counting(u);
      hiGlow = u > 6.8 && u < 7.8 ? Math.sin(Math.PI * (u - 6.8)) : 0;
      popE = clamp01((u - 0.5) / 0.8); popD = clamp01((u - 0.9) / 0.8);
    }
    const ps = p => (p >= 1 ? 1 : 0.6 + 0.4 * ease(p) + 0.1 * Math.sin(Math.PI * p));
    const pe = molPlace(s, E1, EH), pd = molPlace(s, D1, DH);
    /* 第 4 步 −OH 圈 */
    const ohA = s.n === 4 ? clamp01((u - 5.6) / 0.6) : 0;
    const ePts = drawMol(c, ME, HI_E, pe.x, pe.y, pe.S * ps(popE), pe.K * ps(popE),
      { a: clamp01(popE * 2), glowEl: cnt && cnt.el, glow: cnt ? cnt.g : 0, hiGlow, ring: [2, 3], ringA: ohA });
    drawMol(c, MD, HI_D, pd.x, pd.y, pd.S * ps(popD), pd.K * ps(popD),
      { a: clamp01(popD * 2), glowEl: cnt && cnt.el, glow: cnt ? cnt.g : 0, hiGlow });
    /* 名稱 */
    const na = s.n === 1 ? fin(s, 1, 1.6, 0.4) : 1;
    P(c, na, L('乙醇', 'Ethanol'), pe.x, pe.ny, WHITE, 24);
    P(c, na, L('甲醚', 'Dimethyl ether'), pd.x, pd.ny, WHITE, 24);
    /* −OH 圈（第 4 步） */
    if (ohA > 0.02 && ePts) {
      const O = ePts[2], H = ePts[3], mx = (O.x + H.x) / 2, my = (O.y + H.y) / 2, ang = Math.atan2(H.y - O.y, H.x - O.x);
      withA(c, ohA, () => {
        c.save(); c.translate(mx, my); c.rotate(ang);
        c.setLineDash([7, 5]); c.lineDashOffset = -s.t * 12;
        c.strokeStyle = YEL; c.lineWidth = 3; c.shadowColor = W5.rgba(YEL, 0.8); c.shadowBlur = 8;
        c.beginPath(); c.ellipse(0, 0, 37 * (0.7 + 0.3 * ease(ohA)), 25 * (0.7 + 0.3 * ease(ohA)), 0, 0, TAU); c.stroke();
        c.restore();
      });
      P(c, fin(s, 4, 6.0, 0.4), '−OH', 340, 140, YEL, 24);
    }
    P(c, s.n === 4 ? fin(s, 4, 6.4, 0.4) : 0, L('沒有 −OH', 'No −OH'), RX, DH.y, CORAL, 24);
  }

  /* 第 1 步：式子、「＝」、「排列結構不同」 */
  function step1(c, s) {
    const A = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (A <= 0.02) return;
    const u = uu(s, 1), cnt = counting(u), allY = u >= 6.0;
    [[E1.x, 2.4], [D1.x, 2.8]].forEach(([x, t0]) => {
      const a = A * ease(clamp01((u - t0) / 0.5)); if (a <= 0.02) return;
      const y = 390 + 10 * (1 - ease(clamp01((u - t0) / 0.5)));
      if (allY && u < 6.8) W5.glow(c, x, y, 90, YEL, 0.4 * Math.sin(Math.PI * (u - 6.0) / 0.8) * a);
      if (allY) withA(c, a, () => O1.fx(c, 'C2H6O', x, y, YEL, 34, 'center'));
      else O1.fxHi(c, 'C2H6O', x, y, WHITE, 34, 'center', { hi: cnt ? [cnt.el] : [], hiCol: YEL, glow: cnt ? cnt.g : 0, a });
    });
    T(c, A * ease(clamp01((u - 6.0) / 0.4)), L('＝', '='), 480, 390, WHITE, 34);
    P(c, A * ease(clamp01((u - 6.8) / 0.4)), L('排列結構不同', 'Different arrangement'), 480, 445, WHITE, 24);
  }

  /* ═══════════ 容器 ═══════════ */
  function cupGeo(cx) { return { cx, bot: BOT, rim: RIM, rb: RB, rt: RT, wall: 6, base: 10 }; }
  function cupAlpha(s) { return s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 0.6, 0.5) : 1; }
  /* 液體（畫在玻璃後面）：淡紫色乙醇；level 液面 y */
  function liquidPath(c, cx, lv, t) {
    const hl = half(lv), xa = cx - hl, xb = cx + hl, sf = x => lv + 1.2 * Math.sin((x - cx) * 0.07 + t * 2.6);
    c.beginPath(); c.moveTo(cx - RB, BOT); c.lineTo(xa, sf(xa));
    for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, sf(x));
    c.lineTo(xb, sf(xb)); c.lineTo(cx + RB, BOT); c.closePath();
    return sf;
  }
  function ethLiquid(c, cx, lv, t, a) {
    if (a <= 0.02 || lv > BOT - 1) return;
    withA(c, a, () => {
      const sf = liquidPath(c, cx, lv, t);
      const g = c.createLinearGradient(0, lv, 0, BOT); g.addColorStop(0, W5.rgba(ETH, 0.22)); g.addColorStop(1, W5.rgba(ETH, 0.42));
      c.fillStyle = g; c.fill();
      const hl = half(lv);
      c.strokeStyle = W5.rgba('#e4d2ff', 0.95); c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - hl + 1.5, sf(cx - hl)); for (let x = cx - hl + 4; x < cx + hl; x += 4) c.lineTo(x, sf(x)); c.lineTo(cx + hl - 1.5, sf(cx + hl)); c.stroke();
    });
  }

  /* 右容器的蓋子：第 2 步跟容器一起出現；第 3 步開頭抬走；第 4 步回來、滑開、滑回 */
  function lid(c, s) {
    let a = 0, dx = 0, dy = 0;
    if (s.n === 2) a = fin(s, 2, 0.6, 0.5);
    else if (s.n === 3) { const k = clamp01(s.u / 0.5); a = 1 - k; dy = -40 * ease(k); }
    else if (s.n === 4) { a = fin(s, 4, 0.4, 0.5); dx = 95 * (grow(s, 4, 1.4, 2.0) - grow(s, 4, 3.6, 4.2)); }
    if (a <= 0.02) return;
    c.save(); c.translate(dx, dy); M4.lid(c, CR - RT, CR + RT, RIM, { a }); c.restore();
  }

  /* ── 液體裡的小乙醇分子（第 2 步） ── */
  const SLOT = [{ x: -40, y: 420 }, { x: 0, y: 420 }, { x: 40, y: 420 }, { x: -40, y: 388 }, { x: 0, y: 388 }, { x: 40, y: 388 }];
  const ROT0 = [0.3, -0.5, 0.9, -0.2, 0.6, -0.8];
  function liquidMols(c, s, a) {
    if (a <= 0.02) return;
    const u = uu(s, 2), t = s.t;
    SLOT.forEach((q, i) => {
      const tf = 1.2 + i * 0.3, k = clamp01((u - tf) / 0.75); if (k <= 0) return;
      const row = q.y > 400 ? 0 : 1, ph = i * 1.7;
      const flow = 7 * Math.sin(0.6 * t + row * 2.1);           /* 整排一起流動 */
      const tx = CL + q.x + flow + 4 * Math.sin(1.1 * t + ph), ty = q.y + 2.5 * Math.cos(1.3 * t + ph);
      const sx = CL + (i % 3 - 1) * 30, sy = 248;
      const ke = k * k * (3 - 2 * k);
      const x = lerp(sx, tx, ke), y = lerp(sy, ty, k * k);       /* 往下掉：加速 */
      O1.miniMol(c, ME, x, y, { scale: MS, k: MK, rot: ROT0[i] + 0.25 * Math.sin(0.8 * t + ph) * ke, a: a * clamp01(k * 4), hi: HI_E });
    });
  }

  /* ── 容器裡的甲醚氣體分子（第 2、4 步）：三角波反彈 ── */
  /* 四個分子當成半徑 GR 的圓盤，在盒子裡做彈性碰撞（彼此碰撞＋碰壁反彈）：
     載入時用固定初值、固定步長算好 0～48 s 的位置表（確定性），draw 只查表內插 → 仍是純函式。 */
  const NG = 4, GR = 23, GX0 = CR - 42, GX1 = CR + 42, GY0 = 292, GY1 = 412, GDT = 0.02, GSUB = 8;
  const GTAB = (function () {
    const p = [{ x: GX0 + 8, y: GY0 + 10, vx: 62, vy: 48 }, { x: GX1 - 6, y: GY0 + 40, vx: -55, vy: 66 },
               { x: GX0 + 20, y: GY1 - 12, vx: 50, vy: -70 }, { x: GX1 - 14, y: GY1 - 30, vx: -68, vy: -42 }];
    const tab = [], h = GDT / GSUB;
    for (let f = 0; f <= 48 / GDT; f++) {
      tab.push(p.map(q => [q.x, q.y]));
      for (let k = 0; k < GSUB; k++) {
        p.forEach(q => {
          q.x += q.vx * h; q.y += q.vy * h;
          if (q.x < GX0) { q.x = 2 * GX0 - q.x; q.vx = Math.abs(q.vx); } if (q.x > GX1) { q.x = 2 * GX1 - q.x; q.vx = -Math.abs(q.vx); }
          if (q.y < GY0) { q.y = 2 * GY0 - q.y; q.vy = Math.abs(q.vy); } if (q.y > GY1) { q.y = 2 * GY1 - q.y; q.vy = -Math.abs(q.vy); }
        });
        for (let a = 0; a < NG; a++) for (let b = a + 1; b < NG; b++) {
          const A = p[a], B = p[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
          if (d < 2 * GR) {
            const nx = dx / d, ny = dy / d, rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
            if (rv < 0) { A.vx += rv * nx; A.vy += rv * ny; B.vx -= rv * nx; B.vy -= rv * ny; }
          }
        }
      }
    }
    return tab;
  })();
  function gasPos(i, t) {
    const f = Math.max(0, Math.min(GTAB.length - 2, t / GDT)), f0 = Math.floor(f), w = f - f0;
    const A = GTAB[f0][i], B = GTAB[f0 + 1][i];
    return { x: lerp(A[0], B[0], w), y: lerp(A[1], B[1], w), rot: 1.3 * i + t * (0.6 + 0.25 * i) * (i % 2 ? 1 : -1) };
  }
  function gasMols(c, s) {
    let a = 0, spread = 1;
    if (s.n === 2) { a = fin(s, 2, 3.8, 0.3); }
    else if (s.n === 3) a = fout(s, 3, 0, 0.4);
    else if (s.n === 4) a = fin(s, 4, 0.4, 0.5);
    if (a <= 0.02) return;
    for (let i = 0; i < NG; i++) {
      const g = gasPos(i, s.t);
      let x = g.x, y = g.y, rot = g.rot;
      if (s.n === 2) {
        const k = ease(clamp01((s.u - 4.2 - i * 0.05) / 1.2));
        const cx = CR + (i % 2 - 0.5) * 50, cy = 418 - Math.floor(i / 2) * 28;
        x = lerp(cx + 2 * Math.sin(s.t * 3 + i), g.x, k); y = lerp(cy, g.y, k); rot = lerp(i * 0.7, g.rot, k);
        spread = k;
      }
      O1.miniMol(c, MD, x, y, { scale: MS, k: MK, rot, a, hi: HI_D });
    }
  }

  function step2Labels(c, s) {
    P(c, only(s, 2, 3.6, 0.4), L('液體', 'Liquid'), LX, 300, WHITE, 24);
    P(c, only(s, 2, 3.9, 0.4), L('分子緊挨著', 'Packed close'), LX, 350, DIM, 22);
    P(c, only(s, 2, 5.6, 0.4), L('氣體', 'Gas'), RX, 300, WHITE, 24);
    P(c, only(s, 2, 5.9, 0.4), L('分子四處飛散', 'Flying apart'), RX, 350, DIM, 22);
  }

  /* ═══════════ 第 3 步 ═══════════ */
  const WL = 330;
  const DROPS = [1.8, 2.4];
  const DRP0 = { x: 215, y: 300 }, DRP1 = { x: 380, y: 408 }, PUD = { x: 380, y: 437 };
  function dropperState(u) {
    /* 回傳 { x, y, a, fill, drop, squeeze } */
    let x = DRP0.x, y = lerp(280, DRP0.y, ease(clamp01((u - 1.0) / 0.5))), a = clamp01((u - 1.0) / 0.4);
    const km = ease(clamp01((u - 5.4) / 0.8));
    if (km > 0) { const p = O1.arcPt(DRP0, DRP1, km, 110); x = p.x; y = p.y; }
    const ko = ease(clamp01((u - 6.8) / 0.6));
    if (ko > 0) { y -= 40 * ko; a *= 1 - ko; }
    let drop = 0, squeeze = 0;
    DROPS.concat([6.3]).forEach(td => {
      if (u > td - 0.3 && u < td) drop = clamp01((u - td + 0.3) / 0.3);
      if (u > td - 0.25 && u < td + 0.15) squeeze = Math.max(squeeze, Math.sin(Math.PI * clamp01((u - td + 0.25) / 0.4)));
    });
    const fill = 0.75 - 0.12 * (u > 1.8) - 0.12 * (u > 2.4) - 0.1 * (u > 6.3);
    return { x, y, a, fill, drop, squeeze };
  }
  function step3(c, s, A) {
    if (A <= 0.02) return;
    const u = uu(s, 3), t = s.t;
    const lv = lerp(BOT, WL, s.n === 3 ? grow(s, 3, 0.5, 1.2) : 1);
    withA(c, A, () => {
      /* 水 */
      [CL, CR].forEach(cx => M4.cup(c, Object.assign(cupGeo(cx), { level: lv, t, wob: 0.8 })));
      /* 乙醇擴散（裁在左杯水裡） */
      if (u > 2.02 && lv < BOT - 2) {
        c.save(); liquidPath(c, CL, lv + 2, t); c.clip();
        const k = ease(clamp01((u - 2.02) / 3.0)), r = 14 + 150 * k;
        const g = c.createRadialGradient(DRP0.x, WL + 10, 0, DRP0.x, WL + 10, r);
        g.addColorStop(0, W5.rgba(ETH, 0.6 * (1 - 0.55 * k))); g.addColorStop(1, W5.rgba(ETH, 0));
        c.fillStyle = g; c.fillRect(CL - 90, WL - 10, 180, BOT - WL + 12);
        const ku = ease(clamp01((u - 3.2) / 1.8));
        c.fillStyle = W5.rgba(ETH, 0.32 * ku); c.fillRect(CL - 90, WL - 10, 180, BOT - WL + 12);
        c.restore();
      }
      /* 漣漪 */
      DROPS.forEach(td => {
        const q = (u - td - 0.22) / 0.5; if (q < 0 || q > 1) return;
        c.strokeStyle = W5.rgba('#e4d2ff', 0.9 * (1 - q)); c.lineWidth = 2;
        c.beginPath(); c.ellipse(DRP0.x, WL, 4 + 26 * q, 2 + 3 * q, 0, 0, TAU); c.stroke();
      });
      /* 落下中的液滴 */
      DROPS.concat([6.3]).forEach((td, j) => {
        const tgt = j < 2 ? WL : PUD.y - 3, src = j < 2 ? DRP0 : DRP1, dur = j < 2 ? 0.22 : 0.18;
        const q = (u - td) / dur; if (q < 0 || q > 1) return;
        c.fillStyle = W5.rgba(ETH, 0.95); c.beginPath(); c.arc(src.x, lerp(src.y + 5, tgt, q * q), 5, 0, TAU); c.fill();
      });
      /* 玻片＋一小灘乙醇 */
      const pa = clamp01((u - 1.0) / 0.4);
      withA(c, pa, () => {
        c.fillStyle = 'rgba(200,230,245,0.22)'; W5.rr(c, 320, 440, 120, 7, 2); c.fill();
        c.strokeStyle = 'rgba(232,246,255,0.8)'; c.lineWidth = 1.4; c.stroke();
      });
      const pk = ease(clamp01((u - 6.48) / 0.4));
      if (pk > 0.02) {
        if (u > 7.9 && u < 8.7) W5.glow(c, PUD.x, PUD.y - 4, 60, ETH, 0.5 * Math.sin(Math.PI * (u - 7.9) / 0.8));
        c.fillStyle = W5.rgba(ETH, 0.7); c.beginPath(); c.ellipse(PUD.x, PUD.y, 30 * pk, 6 * pk, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(PUD.x - 10 * pk, PUD.y - 2, 8 * pk, 1.6, 0, 0, TAU); c.fill();
      }
      germs(c, u, t);
      /* 滴管 */
      const d = dropperState(u);
      O1.dropper(c, d.x, d.y, { a: d.a, fill: d.fill, col: ETH, drop: d.drop, squeeze: d.squeeze });
      /* 右杯：玻璃導管＋氣泡 */
      dmeBubbles(c, u, t, lv);
      /* 「水」 */
      P(c, fin(s, 3, 1.2, 0.4), L('水', 'Water'), CL - 22, 408, TEAL, 22);
      P(c, fin(s, 3, 1.2, 0.4), L('水', 'Water'), CR - 35, 408, TEAL, 22);
    });
  }

  /* 細菌：原地游動 → 游向乙醇 → 停止變灰 */
  const GB = [{ x: 328, y: 396 }, { x: 432, y: 398 }, { x: 382, y: 384 }];
  const GT = [{ x: 334, y: 429 }, { x: 428, y: 429 }, { x: 381, y: 411 }], GA = [0.2, Math.PI - 0.2, Math.PI / 2];   /* 停下時頭朝乙醇 */
  function germs(c, u, t) {
    const a = clamp01((u - 1.2) / 0.5); if (a <= 0.02) return;
    const tf = Math.min(t, t - u + 7.0);                      /* 游向乙醇時不再原地繞 */
    GB.forEach((b, i) => {
      const ph = i * 2.1, w = 1.1 + 0.2 * i;
      const wx = b.x + 10 * Math.sin(w * tf + ph), wy = b.y + 5 * Math.sin(1.6 * w * tf + ph);
      const wang = Math.atan2(5 * 1.6 * Math.cos(1.6 * w * tf + ph), 10 * Math.cos(w * tf + ph));
      const k = ease(clamp01((u - 7.0) / 1.0));
      const x = lerp(wx, GT[i].x, k), y = lerp(wy, GT[i].y, k);
      const da = ((GA[i] - wang) % TAU + TAU * 1.5) % TAU - Math.PI;   /* 最短轉角 */
      O1.germ(c, x, y, { a, ang: wang + da * k, t, dead: clamp01((u - 8.0) / 0.5), seed: i * 1.3 });
    });
  }

  /* 甲醚氣泡：10 個，第 3、7 個（i＝2、6）溶進水裡 */
  const TX = 792, NB = 10, DIS = { 2: { x: 712, y: 350 }, 6: { x: 757, y: 376 } };
  function dmeBubbles(c, u, t, lv) {
    /* 導管 */
    const ka = clamp01((u - 0.6) / 0.6), by = lerp(410, 420, ease(ka)), ty = by - 184;
    withA(c, ka, () => {
      c.fillStyle = 'rgba(200,230,245,0.16)'; c.fillRect(TX - 6, ty, 12, by - ty);
      c.strokeStyle = 'rgba(232,246,255,0.85)'; c.lineWidth = 1.6; c.strokeRect(TX - 6, ty, 12, by - ty);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(TX - 3, ty + 4); c.lineTo(TX - 3, by - 6); c.stroke();
    });
    for (let i = 0; i < NB; i++) {
      const tb = 2.0 + 0.45 * i, k = (u - tb) / 1.5; if (k < 0) continue;
      const jx = (hash(i * 11 + 3) - 0.5) * 10;
      /* 從導管下端冒出後往左偏到導管旁邊上升（x 約 TX−22） */
      const bx = q => TX - 22 * ease(clamp01(q / 0.15)) + jx * q + 4 * Math.sin(q * 9 + i);
      const byk = q => 420 - (420 - WL - 6) * Math.pow(q, 1.15);
      if (DIS[i]) {
        /* 溶進：上升到一半縮小，變成小分子留在水中 */
        const kd = 0.45, td = tb + 1.5 * kd;
        if (u < td) { O1.bubble(c, bx(k), byk(k), 7 + 2 * k); continue; }
        const sh = clamp01((u - td) / 0.25), p0 = { x: bx(kd), y: byk(kd) };
        if (sh < 1) O1.bubble(c, p0.x, p0.y, (7 + 2 * kd) * (1 - sh));
        const kk = ease(clamp01((u - td - 0.1) / 1.5)), tgt = DIS[i];
        const x = lerp(p0.x, tgt.x, kk) + 4 * Math.sin(0.7 * t + i) * kk, y = lerp(p0.y, tgt.y, kk) + 3 * Math.cos(0.9 * t + i) * kk;
        O1.miniMol(c, MD, x, y, { scale: 6.5, k: 0.2, rot: i + 0.3 * Math.sin(0.5 * t + i), a: clamp01(sh * 2), hi: HI_D });
        continue;
      }
      if (k < 1) { O1.bubble(c, bx(k), byk(k), 7 + 2 * k); continue; }
      /* 破掉＋小分子往上飄走 */
      const q = (u - tb - 1.5);
      if (q < 0.3) { c.strokeStyle = W5.rgba('#e8f6ff', 0.9 * (1 - q / 0.3)); c.lineWidth = 2; c.beginPath(); c.ellipse(bx(1), lv, 6 + 16 * q / 0.3, 2 + 2 * q / 0.3, 0, 0, TAU); c.stroke(); }
      const kr = clamp01(q / 1.4); if (kr >= 1) continue;
      const drift = -20 - 50 * hash(i * 13 + 1);   /* 往左上飄，避開導管 */
      O1.miniMol(c, MD, bx(1) + drift * kr, lerp(lv - 10, 250, ease(kr)), { scale: 6.5, k: 0.2, rot: i + kr * 2, a: clamp01(q / 0.2) * (1 - clamp01((kr - 0.6) / 0.4)), hi: HI_D });
    }
  }
  function step3Labels(c, s) {
    P(c, only(s, 3, 5.0, 0.4), L('混合均勻', 'Mixes evenly'), LX, 300, YEL, 22);
    P(c, only(s, 3, 8.6, 0.4), L('可殺菌', 'Kills germs'), LX, 350, GREEN, 22);
    P(c, only(s, 3, 4.8, 0.4), L('大部分浮出水面', 'Most escape'), RX, 300, CORAL, 22);
    P(c, only(s, 3, 5.8, 0.4), L('只有少量溶進', 'Few dissolve'), RX, 350, WHITE, 22);
  }

  /* ═══════════ 第 4 步 ═══════════ */
  const NAL0 = { x: LX, y: 300 }, NAL1 = { x: CL, y: 296 }, NAR0 = { x: RX, y: 300 }, NAR1 = { x: 735, y: 236 }, NA_Y = 427;
  const EL4 = 332;
  function naLeft(u) {
    const k1 = ease(clamp01((u - 1.6) / 0.8));
    let p = O1.arcPt(NAL0, NAL1, k1, 60), rot = 0.5 * k1;
    const k2 = clamp01((u - 2.4) / 0.7);
    if (k2 > 0) { p = { x: NAL1.x, y: lerp(NAL1.y, NA_Y, 1 - (1 - k2) * (1 - k2)) }; rot = 0.5 - 0.5 * ease(k2); }   /* 進液體後減速 */
    if (u > 3.1) p.x += 1.2 * Math.sin(u * 37);
    return { x: p.x, y: p.y, rot };
  }
  function naRight(u) {
    const k1 = ease(clamp01((u - 2.0) / 0.8));
    let p = O1.arcPt(NAR0, NAR1, k1, 35), rot = -0.4 * k1;
    const k2 = clamp01((u - 2.8) / 0.7);
    if (k2 > 0) { p = { x: NAR1.x, y: lerp(NAR1.y, NA_Y, k2 * k2) }; rot = -0.4 + 0.4 * ease(k2); }
    return { x: p.x, y: p.y, rot };
  }
  function step4(c, s) {
    if (s.n !== 4) return;
    const u = s.u, t = s.t;
    const na = clamp01((u - 0.9) / 0.3);
    const nl = naLeft(u), nr = naRight(u);
    /* 左：鈉在乙醇中（液面以下才冒泡） */
    O1.naBlock(c, nl.x, nl.y, { a: na, rot: nl.rot });
    /* 落入的漣漪 */
    const tSplash = 2.4 + 0.7 * (1 - Math.sqrt(1 - (EL4 - NAL1.y) / (NA_Y - NAL1.y)));
    const qs = (u - tSplash) / 0.5;
    if (qs > 0 && qs < 1) { c.strokeStyle = W5.rgba('#e4d2ff', 0.9 * (1 - qs)); c.lineWidth = 2; c.beginPath(); c.ellipse(CL, EL4, 6 + 34 * qs, 2 + 4 * qs, 0, 0, TAU); c.stroke(); }
    /* 氣泡 */
    if (u > 3.1) {
      for (let j = 0; j < 180; j++) {
        const tb = 3.1 + j * 0.05; if (tb > u) break;
        const d = 0.9 + 0.5 * hash(j * 5 + 1), k = (u - tb) / d;
        const x0 = CL + (hash(j * 5 + 2) - 0.5) * 34, x = x0 + 6 * Math.sin(k * 8 + j) * k;
        const r = (2.5 + 4 * hash(j * 5 + 3)) * (1 + 0.3 * k);
        if (k < 1) O1.bubble(c, x, lerp(NA_Y - 13, EL4 + r, k), r, { a: clamp01(k * 6) });
        else if (k < 1.25) { const q = (k - 1) / 0.25; c.strokeStyle = W5.rgba('#e8f6ff', 0.8 * (1 - q)); c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, EL4, r + 8 * q, 1.5 + 2 * q, 0, 0, TAU); c.stroke(); }
      }
    }
    /* 右：鈉塊掉進甲醚（氣體）容器 */
    O1.naBlock(c, nr.x, nr.y, { a: na, rot: nr.rot });
    /* 鈉標籤 */
    const la = fin(s, 4, 1.0, 0.4) * fout(s, 4, 2.2, 0.4);
    P(c, la, L('鈉', 'Sodium'), LX, 345, WHITE, 22);
    P(c, la, L('鈉', 'Sodium'), RX, 345, WHITE, 22);
    /* 結果 */
    P(c, fin(s, 4, 4.0, 0.4), L('冒氣泡', 'Bubbles'), LX, 300, YEL, 22);
    P(c, fin(s, 4, 4.4, 0.4), L('產生氣體', 'Gives off gas'), LX, 350, YEL, 22);
    P(c, fin(s, 4, 4.8, 0.4), L('不反應', 'No reaction'), RX, 325, CORAL, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('同一個分子式', 'One formula'),
    () => L('常溫狀態', 'State at room temperature'),
    () => L('溶解度與殺菌', 'Solubility and disinfecting'),
    () => L('丟入金屬鈉', 'Drop in sodium')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.8, 0.6) * fout(s, 2, 0, 0.4), L('乙醇和甲醚的分子式都是 C₂H₆O', 'Ethanol and dimethyl ether share one formula: C₂H₆O'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 7.4, 0.6) * fout(s, 3, 0, 0.4), L('乙醇在常溫是液體；甲醚在常溫是氣體', 'At room temperature: ethanol is a liquid, dimethyl ether a gas'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 9.2, 0.6) * fout(s, 4, 0, 0.4), L('乙醇溶於水、可殺菌；甲醚在水中的溶解度比乙醇小得多', 'Ethanol dissolves, kills germs; dimethyl ether is far less soluble'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.4, 0.6), L('丟入鈉：乙醇反應、冒氣泡產氣；甲醚不反應', 'Sodium: ethanol reacts, bubbling out gas; dimethyl ether does not'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 540, cell: 40 });
    /* 中間分隔線 */
    const dv = s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 0.6, 0.5) : 1;
    withA(c, dv * 0.35, () => {
      c.save(); c.setLineDash([8, 8]); c.strokeStyle = DIM; c.lineWidth = 2;
      c.beginPath(); c.moveTo(480, 86); c.lineTo(480, 470); c.stroke(); c.restore();
    });
    step1(c, s);
    const ca = cupAlpha(s);
    /* 第 2 步：左杯液體＋分子（玻璃後面） */
    const a2 = s.n === 2 ? 1 : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    if (a2 > 0.02) {
      const u2 = uu(s, 2);
      ethLiquid(c, CL, lerp(BOT, 362, ease(clamp01((u2 - 1.5) / 2.2))), s.t, a2);
      liquidMols(c, s, a2);
    }
    if (s.n === 4) ethLiquid(c, CL, lerp(BOT, EL4, grow(s, 4, 0.4, 1.0)), s.t, 1);   /* 第 4 步乙醇（玻璃後面） */
    if (s.n === 2 || s.n === 4) {
      [CL, CR].forEach(cx => M4.cup(c, Object.assign(cupGeo(cx), { a: ca })));
    }
    /* 第 3 步（含杯子與水；第 4 步開頭淡出） */
    const a3 = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.5) : 0;
    if (s.n === 4 && a3 > 0.02) step3(c, s, a3);
    if (s.n === 3) step3(c, s, 1);
    gasMols(c, s);
    step4(c, s);
    lid(c, s);
    molecules(c, s);
    step2Labels(c, s);
    step3Labels(c, s);
    texts(c, s);
  }

  W5.register('props', { canvas: 'cvs-props', steps: DUR, draw });
})();
