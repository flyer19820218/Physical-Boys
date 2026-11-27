/* ==================================================================
   organics_1 ｜ 檢驗碳：CO₂ 使澄清石灰水變混濁（cvs-testc，960×540）
   四步：1 點燃蠟燭 → 2 倒扣石灰水燒杯 → 3 石灰水變混濁 → 4 結論：含碳
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／dashArrow、M4.L／T／P／withA／fin／fout／grow、
        O1.match／atom／mol／MOL，以及本檔新增到 O1 的 O1.CANDLE／candlePts／candle／cocl（蠟燭燃燒檢驗台，testh 與動手做共用）。

   科學內容（只用簡報）：蠟燭的蠟（石蠟）是有機物，用火柴點燃；沾有澄清石灰水的燒杯倒扣在火焰上方（不蓋住火焰）；
     燃燒生成的 CO₂ 跟石灰水作用，產生白色的碳酸鈣（石灰水變混濁）；石灰水變混濁 → 有 CO₂ → 蠟燭含碳（C）。畫面上沒有任何數字。
   器材移動（不畫手）：火柴自己移到燭芯；燒杯由夾子（坩堝夾樣式，往左伸出）夾著，自己翻轉、平移、下降。

   第 1 步（11 s）點燃蠟燭：
     u 0.2 標題 → u 0.3～0.9 實驗桌淡入 → u 0.8～1.4 燭臺＋蠟燭升起淡入
     → u 1.6 標籤「蠟燭（石蠟）：有機物」（引線指燭身）→ u 2.4 火柴出現、火柴頭燃起（劃火光）
     → u 2.8～3.8 火柴移到燭芯 → u 3.9～4.5 蠟燭點燃（閃光、燭火長大）→ u 4.4～5.2 火柴退開、燒黑、淡出
     → u 8.0 字卡；u 8.6～11 靜止（只有燭火閃動；蠟燭從點燃起整段動畫慢慢變短 16 px）。
   第 2 步（11 s）倒扣石灰水燒杯：
     u 0～0.4 蠟燭標籤淡出 → u 0.4～1.4 燒杯（杯口朝上）連夾子從右邊滑進 (x 760→640) → u 1.2～2.0 內壁的淡青色石灰水層出現
     → u 1.6「澄清石灰水」→ u 2.2～2.5 標籤淡出 → u 2.4～3.4 燒杯翻轉成杯口朝下（倒扣）
     → u 3.5～4.9 平移到蠟燭上方 → u 5.0～5.8 下降到焰尖上方（不蓋住火焰）→ u 6.0「澄清石灰水」再出現（右側）
     → u 6.2～7.4 CO₂ 分子從焰尖升起、飄進杯內（持續）→ u 6.8「CO₂」圖例＋引線
     → u 8.0 字卡；u 8.6～11 靜止（分子持續上升）。
   第 3 步（11 s）石灰水變混濁：
     u 0.6～1.0「澄清石灰水」標籤淡出 → u 1.0～5.0 內壁石灰水由杯底（上方）往杯口逐漸變乳白（白色小顆粒跟著出現）
     → u 3.0「變混濁」標籤（同位置）→ u 5.4 右側反應卡淡入 → u 5.6「CO₂ ＋ 石灰水」→ u 6.2～6.7 向下箭頭
     → u 6.6「碳酸鈣（白色）」＋白色色塊 → u 8.2 字卡；u 8.8～11 靜止。
   第 4 步（12 s）結論：含碳：
     u 0～0.5 反應卡、CO₂ 圖例、「變混濁」淡出 → u 0.8 混濁燒杯外一圈黃光
     → u 1.2 因果鏈第 1 格「石灰水變混濁」→ u 1.4～2.0 虛線箭頭：燒杯 → 第 1 格
     → u 2.4～2.9 向下箭頭 → u 2.9 第 2 格「有 CO₂」（小 CO₂ 分子）→ u 3.8～4.3 向下箭頭
     → u 4.3 第 3 格「蠟燭含碳（C）」→ u 5.0 C 原子彈出＋光暈 → u 5.6～6.4 虛線箭頭：第 3 格 → 蠟燭
     → u 7.0 字卡；u 7.6～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）。
     蠟燭檢驗台＝O1.candle 原寸（數字見 organics_1_common 的 O1.CANDLE 註解）：蠟燭中線 x 300、頂面 y 334（最後 350）、燭芯頂 322、
       焰尖 ≈ 269；燒杯放好時 x 230～370、杯口 y 256、杯底（朝上）y 106、中心 y 181；夾子往左，末端 ≈ x 40、y 181。
       第 2 步燒杯起點：中線 x 640、中心 y 230（lift −49）、杯口朝上；移動中 lift −49 → 30（中途杯頂 ≥ y 76，不碰標題）→ 放下 lift 0。
     標籤：「蠟燭（石蠟）：有機物」左對齊 (366,392)；「澄清石灰水／變混濁」左對齊 (410,143)（起點位置時 (750,192)）；
       「CO₂」圖例左對齊 (410,226)，引線到 (330,200)。
     火柴：頭 (640,300) → 燭芯 (306,320)，木棒角度 0.45 rad。
     第 3 步反應卡：(570,250)～(940,430)；「CO₂ ＋ 石灰水」(760,290)、箭頭 (760,316→356)、白色色塊 (604,390) r 14、「碳酸鈣（白色）」左對齊 (628,390)（英文最寬，右緣 ≈ 926）。
     第 4 步因果鏈：三格 x 560～920（寬 360、高 64），中心 y 150／270／390；圖示 x 592、文字左對齊 x 620；
       格間向下箭頭 x 740（184→236、304→356）；虛線箭頭 燒杯 (380,150) → (552,150)、第 3 格 (552,390) → 蠟燭 (334,390)。
   字級：標題 24、字卡 24、標籤 22、反應卡與因果鏈 24。
   示意：石灰水層的厚度與顏色、混濁由杯底往杯口推進、白色小顆粒、CO₂ 分子大小與數量、燭火形狀、蠟燭變短的量、夾子樣式都是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.candle) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, TEAL = COL.teal, GREEN = COL.green;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452, CX = 300;
  const CH = O1.CANDLE;
  const CARD = { x0: 570, y0: 250, x1: 940, y1: 430 };
  const CHAIN = { x0: 560, x1: 920, h: 64, ys: [150, 270, 390], icon: 592, tx: 620, ax: 740 };

  /* ═══════════ 時間函式（純函式） ═══════════ */
  const litK = s => grow(s, 1, 3.9, 4.5);
  const burnK = s => clamp01((s.t - 4.2) / 40.8);
  /* 燒杯狀態：x、lift、flip、透明度、塗層 */
  function beakerState(s) {
    if (s.n < 2) return { a: 0 };
    const u = s.u;
    if (s.n > 2) return { a: 1, bx: CX, lift: 0, flip: 1, coat: 1 };
    const a = clamp01((u - 0.4) / 0.4);
    const slideIn = ease(clamp01((u - 0.4) / 1.0)), move = ease(clamp01((u - 3.5) / 1.4)), drop = ease(clamp01((u - 5.0) / 0.8));
    const bx = lerp(lerp(760, 640, slideIn), CX, move);
    const lift = lerp(lerp(-49, 30, move), 0, drop);
    return { a, bx, lift, flip: ease(clamp01((u - 2.4) / 1.0)), coat: ease(clamp01((u - 1.2) / 0.8)) };
  }
  const gasK = s => grow(s, 2, 6.2, 7.4);
  const turbK = s => (s.n < 3 ? 0 : s.n > 3 ? 1 : clamp01((s.u - 1.0) / 4.0));

  /* ═══════════ 背景 ═══════════ */
  function bench(c, s) {
    const a = fin(s, 1, 0.3, 0.6); if (a <= 0.02) return;
    M3.ground(c, GY, { a });
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 9, a });
  }

  /* ═══════════ 蠟燭檢驗台 ═══════════ */
  function rig(c, s) {
    const u = s.u, b = beakerState(s);
    const ca = fin(s, 1, 0.8, 0.6), rise = s.n === 1 ? 24 * (1 - ease(clamp01((u - 0.8) / 0.6))) : 0;
    /* 燒杯標籤：第 2 步 u 1.6 出現、2.2 淡出、6.0 再出現；第 3 步 0.6 淡出、3.0「變混濁」；第 4 步 0 淡出 */
    let coatA = 0, coatText = null;
    if (s.n === 2) coatA = clamp01((u - 1.6) / 0.4) * (1 - clamp01((u - 2.2) / 0.3)) + clamp01((u - 6.0) / 0.4);
    if (s.n === 3) {
      if (u < 2) coatA = 1 - clamp01((u - 0.6) / 0.4);
      else { coatA = clamp01((u - 3.0) / 0.4); coatText = L('變混濁', 'Turns cloudy'); }
    }
    if (s.n === 4) { coatA = 1 - clamp01(u / 0.5); coatText = L('變混濁', 'Turns cloudy'); }
    const candleLab = fin(s, 1, 1.6, 0.4) * fout(s, 2, 0, 0.4);
    /* 第 4 步：混濁燒杯外一圈黃光（畫在燒杯後面） */
    if (s.n === 4) { const g = fin(s, 4, 0.8, 0.5); if (g > 0.02) W5.glow(c, CX, 181, 120, YEL, 0.22 * g); }
    return O1.candle(c, {
      y: rise, t: s.t, candle: ca, burn: burnK(s), lit: litK(s),
      beaker: b.a, kind: 'lime', bx: b.bx, lift: b.lift, flip: b.flip, coat: b.coat, turb: turbK(s), tongSide: -1,
      gas: gasK(s), gasMol: 'CO2',
      labels: { candle: candleLab, coat: coatA }, candleText: L('蠟燭（石蠟）：有機物', 'Candle wax (paraffin): organic'),
      coatText: coatText || undefined
    });
  }
  /* 點燃那一下的閃光 */
  function ignite(c, s) {
    if (s.n !== 1 || s.u < 3.8 || s.u > 4.5) return;
    const k = (s.u - 3.8) / 0.7, R = O1.candlePts({});
    W5.glow(c, R.wick.x, R.wick.y - 6, 48 * (1 - 0.4 * k), YEL, 0.8 * (1 - k));
  }
  function match(c, s) {
    if (s.n !== 1) return;
    const u = s.u;
    const a = clamp01((u - 2.4) / 0.2) * (1 - clamp01((u - 4.8) / 0.4)); if (a <= 0.02) return;
    const go = ease(clamp01((u - 2.8) / 1.0)), back = ease(clamp01((u - 4.4) / 0.8));
    const hx0 = 640, hy0 = 300, hx1 = CX + 6, hy1 = 320;
    const x = lerp(lerp(hx0, hx1, go), hx0 + 20, back), y = lerp(lerp(hy0, hy1, go), hy0 - 10, back);
    const lit = clamp01((u - 2.4) / 0.25) * (1 - clamp01((u - 4.6) / 0.3));
    if (u > 2.4 && u < 2.8) W5.glow(c, hx0, hy0, 30, YEL, 0.7 * (1 - (u - 2.4) / 0.4));
    O1.match(c, x, y, 0.45, { a, lit, burnt: clamp01((u - 4.6) / 0.3), t: s.t });
  }
  /* CO₂ 圖例（第 2 步 u 6.8 出現，第 4 步開頭淡出） */
  function co2Tag(c, s) {
    const a = fin(s, 2, 6.8, 0.4) * fout(s, 4, 0, 0.5); if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(410, 226); c.lineTo(330, 200); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(410, 226); c.lineTo(330, 200); c.stroke();
      c.fillStyle = 'rgba(246,243,234,0.95)'; c.beginPath(); c.arc(330, 200, 3.5, 0, TAU); c.fill();
      c.restore();
    });
    P(c, a, 'CO₂', 410, 226, WHITE, 22, 'left');
  }

  /* ═══════════ 第 3 步：反應卡 ═══════════ */
  function reaction(c, s) {
    const a = s.n === 3 ? fin(s, 3, 5.4, 0.5) : s.n === 4 ? fout(s, 4, 0, 0.5) : 0; if (a <= 0.02) return;
    const u = s.n === 3 ? s.u : 99;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.88)'; c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2;
      W5.rr(c, CARD.x0, CARD.y0, CARD.x1 - CARD.x0, CARD.y1 - CARD.y0, 16); c.fill(); c.stroke(); c.restore();
      const g = ease(clamp01((u - 6.2) / 0.5));
      if (g > 0.02) { W5.arrow(c, 760, 316, 760, lerp(316, 356, g), 'rgba(11,26,21,0.85)', 9, 20); W5.arrow(c, 760, 316, 760, lerp(316, 356, g), YEL, 5, 16); }
      const w = clamp01((u - 6.6) / 0.4);
      if (w > 0.02) withA(c, w, () => {
        W5.glow(c, 604, 390, 34, '#ffffff', 0.35);
        c.save(); c.fillStyle = '#f6f8f4'; c.strokeStyle = 'rgba(163,184,176,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(604, 390, 14, 0, TAU); c.fill(); c.stroke(); c.restore();
      });
    });
    T(c, a * clamp01((u - 5.6) / 0.4), L('CO₂ ＋ 石灰水', 'CO₂ + limewater'), 760, 290, TEAL, 24);
    T(c, a * clamp01((u - 6.6) / 0.4), L('碳酸鈣（白色）', 'Calcium carbonate (white)'), 628, 390, WHITE, 24, 'left');
  }

  /* ═══════════ 第 4 步：因果鏈 ═══════════ */
  function chain(c, s) {
    if (s.n !== 4) return;
    const u = s.u, X0 = CHAIN.x0, W = CHAIN.x1 - CHAIN.x0, H = CHAIN.h;
    const box = (i, t0, col) => {
      const a = clamp01((u - t0) / 0.4); if (a <= 0.02) return 0;
      const y = CHAIN.ys[i], dx = 18 * (1 - ease(a));
      withA(c, a, () => {
        c.save(); c.fillStyle = 'rgba(11,26,21,0.9)'; c.strokeStyle = col; c.lineWidth = 2.5;
        W5.rr(c, X0 + dx, y - H / 2, W, H, 14); c.fill(); c.stroke(); c.restore();
      });
      return a;
    };
    const down = (y0, t0) => {
      const g = ease(clamp01((u - t0) / 0.5)); if (g <= 0.02) return;
      W5.arrow(c, CHAIN.ax, y0, CHAIN.ax, lerp(y0, y0 + 52, g), 'rgba(11,26,21,0.85)', 9, 20);
      W5.arrow(c, CHAIN.ax, y0, CHAIN.ax, lerp(y0, y0 + 52, g), YEL, 5, 16);
    };
    const dash = (x0, y0, x1, y1, t0, d) => {
      const g = ease(clamp01((u - t0) / d)); if (g <= 0.02) return;
      M3.dashArrow(c, x0, y0, lerp(x0, x1, g), lerp(y0, y1, g), YEL, 1, s.t * 30, { lw: 4, head: 16 });
    };
    /* ① 石灰水變混濁 */
    const a1 = box(0, 1.2, WHITE);
    if (a1 > 0.02) withA(c, a1, () => {
      c.save(); c.fillStyle = '#f6f8f4'; c.strokeStyle = 'rgba(163,184,176,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(CHAIN.icon, CHAIN.ys[0], 13, 0, TAU); c.fill(); c.stroke(); c.restore();
    });
    T(c, a1, L('石灰水變混濁', 'Limewater clouds up'), CHAIN.tx, CHAIN.ys[0], WHITE, 24, 'left');
    dash(380, 150, CHAIN.x0 - 8, 150, 1.4, 0.6);
    down(CHAIN.ys[0] + 34, 2.4);
    /* ② 有 CO₂ */
    const a2 = box(1, 2.9, TEAL);
    if (a2 > 0.02) O1.mol(c, O1.MOL.CO2, CHAIN.icon, CHAIN.ys[1], { scale: 11, atomScale: 0.36, a: a2, label: false });
    T(c, a2, L('有 CO₂', 'CO₂ is present'), CHAIN.tx + 8, CHAIN.ys[1], TEAL, 24, 'left');
    down(CHAIN.ys[1] + 34, 3.8);
    /* ③ 蠟燭含碳（C） */
    const a3 = box(2, 4.3, YEL);
    const pop = clamp01((u - 5.0) / 0.35);
    if (pop > 0.02) {
      W5.glow(c, CHAIN.icon, CHAIN.ys[2], 40, YEL, 0.45 * pop);
      O1.atom(c, CHAIN.icon, CHAIN.ys[2], 'C', 20 * (0.6 + 0.4 * ease(pop) + 0.15 * Math.sin(Math.PI * pop)), { a: pop });
    }
    T(c, a3, L('蠟燭含碳（C）', 'Candle has carbon (C)'), CHAIN.tx, CHAIN.ys[2], YEL, 24, 'left');
    dash(CHAIN.x0 - 8, 390, 334, 390, 5.6, 0.8);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('點燃蠟燭', 'Light the candle'),
    () => L('倒扣石灰水燒杯', 'Limewater beaker over the flame'),
    () => L('石灰水變混濁', 'Limewater turns cloudy'),
    () => L('結論：含碳', 'Conclusion: carbon')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('蠟燭的蠟（石蠟）是有機物，用火柴點燃它', 'Candle wax (paraffin) is organic; light it with a match'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('沾有澄清石灰水的燒杯，倒扣在火焰上方', 'A beaker coated with clear limewater, upside down over the flame'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('燃燒生成的 CO₂ 跟石灰水作用，產生白色的碳酸鈣', 'CO₂ from burning reacts with limewater: white calcium carbonate'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.0, 0.6), L('石灰水變混濁 → 有 CO₂ → 蠟燭含碳（C）', 'Cloudy limewater → CO₂ → the candle has carbon (C)'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c, s);
    rig(c, s);
    ignite(c, s);
    match(c, s);
    co2Tag(c, s);
    reaction(c, s);
    chain(c, s);
    texts(c, s);
  }

  W5.register('testc', { canvas: 'cvs-testc', steps: DUR, draw });
})();
