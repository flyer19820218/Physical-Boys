/* ==================================================================
   organics_1 ｜ 檢驗氫：H₂O 使氯化亞鈷試紙變紅（cvs-testh，960×540）
   四步：1 倒扣冷燒杯 → 2 內壁起霧 → 3 氯化亞鈷試紙 → 4 結論：含氫
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／dashArrow、M4.L／T／P／withA／fin／fout／grow、
        O1.candle／candlePts／CANDLE／cocl／atom／mol／MOL（testc 新增的蠟燭燃燒檢驗台，kind 'cold'），
        以及本檔新增到 O1 的 O1.tweezers（鑷子）。
   與 testc 同一張實驗桌：蠟燭位置、大小、燒杯倒扣位置、夾子（往左）完全相同（O1.candle 原寸）。

   科學內容（只用簡報）：乾燥的冷燒杯倒扣在火焰上方（不要蓋住火焰）；燒杯內壁起霧，還出現小水珠；
     藍色氯化亞鈷試紙碰到小水珠，由藍色變成紅色（粉紅）；有 H₂O → 蠟燭含氫（H）；碳用石灰水、氫用試紙檢驗。畫面上沒有任何數字。
   器材移動（不畫手）：燒杯由夾子夾著自己翻轉、平移、下降；試紙由鑷子夾著自己移動。

   第 1 步（11 s）倒扣冷燒杯：
     u 0.2 標題 → u 0.3～0.9 實驗桌淡入 → u 0.8～1.4 燭臺＋蠟燭（已點燃）升起淡入 → u 1.2「蠟燭」標籤
     → u 1.4～2.4 乾燥冷燒杯（杯口朝上）連夾子從右邊滑進 (x 760→640) → u 2.0「乾燥的冷燒杯」→ u 2.8～3.1 標籤淡出
     → u 3.0～4.0 燒杯翻轉成杯口朝下（倒扣）→ u 4.0～5.2 平移到蠟燭上方 → u 5.2～6.0 下降到焰尖上方（不蓋住火焰）
     → u 6.2「乾燥的冷燒杯」再出現（右上）→ u 6.6 焰尖與杯口之間綠色光圈＋「不要蓋住火焰」（綠，引線指焰尖）
     → u 8.0 字卡；u 8.6～11 靜止（只有燭火閃動）。
   第 2 步（11 s）內壁起霧：
     u 0～0.4「蠟燭」「不要蓋住火焰」淡出 → u 0.4～1.6 H₂O 分子從焰尖升起、飄進杯內（之後持續）→ u 1.0「H₂O」圖例＋引線
     → u 1.0～1.4「乾燥的冷燒杯」淡出 → u 1.6～4.4 內壁起霧（半透明白，杯底（上方）較濃）→ u 2.8「起霧」標籤
     → u 4.4～7.6 小水珠一顆顆出現、變大（u 5.0～5.3「起霧」淡出、u 5.6「小水珠」）；右內壁靠杯口那顆（試紙要碰的）u 5.6～7.6 長大
     → u 6.6～9.0 水珠沿壁往杯口滑落（變大）→ u 8.0 字卡；u 9.0～11 靜止（分子持續上升）。
   第 3 步（11 s）氯化亞鈷試紙：
     u 0～0.5「H₂O」圖例淡出 → u 0.6～1.6 藍色試紙＋鑷子從右邊滑進、淡入（到「準備位置」）→ u 1.4「藍色氯化亞鈷試紙」標籤（引線指試紙）
     → u 2.4～3.2 往左移到杯口正下方 → u 3.2～4.0 往上伸進杯口、尖端碰到右內壁的水珠
     → u 4.0～5.0 接觸處閃光；u 4.0～4.8 那顆水珠被試紙吸走（縮小）、尖端濕痕 → u 4.3～7.3 粉紅色從尖端往後擴散（到 75%）
     → u 6.2「變成紅色（粉紅）」標籤 → u 8.2 字卡；u 8.8～11 靜止。
   第 4 步（12 s）結論：含氫：
     u 0～0.8 試紙＋鑷子往下退出、淡出；「小水珠」、試紙標籤淡出 → u 0.8 燒杯外一圈黃光
     → u 1.2 第 1 格「有 H₂O」（小 H₂O 分子）→ u 1.4～2.0 虛線箭頭：燒杯 → 第 1 格
     → u 2.4～2.9 向下箭頭 → u 2.9 第 2 格「蠟燭含氫（H）」→ u 3.5 H 原子彈出＋光暈 → u 4.2～5.0 虛線箭頭：第 2 格 → 蠟燭
     → u 5.4 對照卡淡入 → u 5.8 第 1 列「C → 石灰水 → 變混濁」（u 6.2～6.6 箭頭長出、u 6.6 結果）
     → u 6.8 第 2 列「H → 氯化亞鈷試紙 → 變紅」（u 7.2～7.6 箭頭、u 7.6 結果）→ u 8.2 字卡；u 8.8～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）。
     蠟燭檢驗台＝O1.candle 原寸、kind 'cold'（同 testc）：蠟燭中線 x 300、頂面 y 334（最後 350）、焰尖 ≈ 269；
       燒杯放好時 x 230～370、杯口 y 256、杯底（朝上）y 106、中心 y 181；夾子往左，末端 ≈ x 40、y 181。
       第 1 步燒杯起點：中線 x 640、中心 y 230（lift −49）、杯口朝上；移動中 lift −49 → 30 → 放下 lift 0。
       試紙要碰的水珠 ＝ candlePts.dropSpot ≈ (362,234)（右內壁、杯口上方 22 px），本檔另畫一顆會長大、被吸走的水珠在這裡。
     標籤：「蠟燭」左對齊 (366,392)；「乾燥的冷燒杯／起霧／小水珠」左對齊 (410,143)（起點位置時 (750,192)）；
       「H₂O」圖例左對齊 (410,226)，引線到 (330,200)；「不要蓋住火焰」左對齊 (410,300)（綠），引線到 (316,263)。
     試紙：長 84、寬 18、角度 1.0 rad（尖端在左上，往右下伸）；鑷子長 96，尖端＝試紙尖端沿試紙方向 70 px（夾住試紙尾端 14 px）。
       試紙尖端：起點 (580,290) → 準備 (450,300) → 杯口下 (364,300) → 碰水珠 (362,237)；最後鑷子尾端 ≈ (452,377)。
       第 4 步退出：尖端往下 60 px、同時淡出。
       「藍色氯化亞鈷試紙」左對齊 (500,250)（淡藍），引線到試紙中段；「變成紅色（粉紅）」左對齊 (500,300)（粉紅）。
     第 4 步因果鏈：兩格 x 500～920（寬 420、高 56），中心 y 140／236；圖示 x 530、文字左對齊 x 558；
       格間向下箭頭 x 710（170→206）；虛線箭頭 燒杯 (380,160) → (492,140)、第 2 格 (492,248) → 蠟燭 (332,380)。
     對照卡 (470,290)～(940,446)；兩列中心 y 334／404：原子 x 496（r 16）、試劑文字左對齊 x 520；
       箭頭欄跟著兩列試劑文字較寬者（量字寬）：箭頭 x 520＋字寬＋16 起、長 32 → 結果色塊再 +18 → 結果文字再 +16。
       實測：中文 箭頭 652→684、色塊 702、「變混濁／變紅」734～800；英文 箭頭 758→790、色塊 808、'cloudy／turns red' 824～920（卡片右緣 940）。
   字級：標題 24、字卡 24、標籤 22、因果鏈 24、對照卡 22。
   示意：霧的濃淡分布、水珠大小數量與滑落、H₂O 分子大小與數量、燭火形狀、蠟燭變短的量、夾子與鑷子樣式、
     試紙從杯口下方伸進杯內碰水珠（側視時試紙畫在玻璃前面）、粉紅擴散到試紙 75% 都是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.candle || !O1.tweezers) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, YEL = COL.yellow, TEAL = COL.teal, GREEN = COL.green;
  const PINK = '#f28cb1', BLUE = '#8fb2ff';
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452, CX = 300;
  const PL = 84, PA = 1.0, PUX = Math.cos(PA), PUY = Math.sin(PA), TWL = 96, GRIP = PL - 14;
  const CHAIN = { x0: 500, x1: 920, h: 56, ys: [140, 236], icon: 530, tx: 558, ax: 710 };
  const TAB = { x0: 470, y0: 290, x1: 940, y1: 446, ys: [334, 404], atom: 496, tx: 520, gap: 16, arw: 32, chip: 18, rx: 16 };

  /* ═══════════ 時間函式（純函式） ═══════════ */
  const burnK = s => clamp01(s.t / 45);
  /* 燒杯狀態：x、lift、flip、透明度 */
  function beakerState(s) {
    if (s.n < 1) return { a: 0 };
    if (s.n > 1) return { a: 1, bx: CX, lift: 0, flip: 1 };
    const u = s.u;
    const a = clamp01((u - 1.4) / 0.4);
    const slideIn = ease(clamp01((u - 1.4) / 1.0)), move = ease(clamp01((u - 4.0) / 1.2)), drop = ease(clamp01((u - 5.2) / 0.8));
    const bx = lerp(lerp(760, 640, slideIn), CX, move);
    const lift = lerp(lerp(-49, 30, move), 0, drop);
    return { a, bx, lift, flip: ease(clamp01((u - 3.0) / 1.0)) };
  }
  const gasK = s => grow(s, 2, 0.4, 1.6);
  const fogK = s => grow(s, 2, 1.6, 4.4);
  const dropK = s => (s.n < 2 ? 0 : s.n > 2 ? 1 : clamp01((s.u - 4.4) / 3.2));
  const slideK = s => 0.6 * grow(s, 2, 6.6, 9.0);
  /* 試紙尖端位置與透明度 */
  function paperState(s) {
    if (s.n < 3) return null;
    if (s.n === 4) {
      const k = ease(clamp01(s.u / 0.8));
      return { x: 362, y: 237 + 60 * k, a: 1 - k };
    }
    const u = s.u;
    const a = clamp01((u - 0.6) / 0.5);
    const g0 = ease(clamp01((u - 0.6) / 1.0)), g1 = ease(clamp01((u - 2.4) / 0.8)), g2 = ease(clamp01((u - 3.2) / 0.8));
    let x = lerp(580, 450, g0), y = lerp(290, 300, g0);
    x = lerp(x, 364, g1);
    x = lerp(x, 362, g2); y = lerp(y, 237, g2);
    return { x, y, a };
  }
  const pinkK = s => (s.n < 3 ? 0 : s.n > 3 ? 1 : ease(clamp01((s.u - 4.3) / 3.0))) * 0.75;

  /* ═══════════ 背景 ═══════════ */
  function bench(c, s) {
    const a = fin(s, 1, 0.3, 0.6); if (a <= 0.02) return;
    M3.ground(c, GY, { a });
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 9, a });
  }

  /* ═══════════ 蠟燭檢驗台（乾燥冷燒杯） ═══════════ */
  function coatLabel(s) {
    const u = s.u;
    if (s.n === 1) return { a: clamp01((u - 2.0) / 0.4) * (1 - clamp01((u - 2.8) / 0.3)) + clamp01((u - 6.2) / 0.4), text: null };
    if (s.n === 2) {
      if (u < 2.0) return { a: 1 - clamp01((u - 1.0) / 0.4), text: null };
      if (u < 5.3) return { a: clamp01((u - 2.8) / 0.4) * (1 - clamp01((u - 5.0) / 0.3)), text: L('起霧', 'Fog') };
      return { a: clamp01((u - 5.6) / 0.4), text: L('小水珠', 'Water drops') };
    }
    if (s.n === 3) return { a: 1, text: L('小水珠', 'Water drops') };
    return { a: 1 - clamp01(s.u / 0.5), text: L('小水珠', 'Water drops') };
  }
  function rig(c, s) {
    const u = s.u, b = beakerState(s);
    const ca = fin(s, 1, 0.8, 0.6), rise = s.n === 1 ? 24 * (1 - ease(clamp01((u - 0.8) / 0.6))) : 0;
    const cl = coatLabel(s);
    const candleLab = fin(s, 1, 1.2, 0.4) * fout(s, 2, 0, 0.4);
    /* 第 4 步：燒杯外一圈黃光（畫在燒杯後面） */
    if (s.n === 4) { const g = fin(s, 4, 0.8, 0.5); if (g > 0.02) W5.glow(c, CX, 181, 120, YEL, 0.22 * g); }
    return O1.candle(c, {
      y: rise, t: s.t, candle: ca, burn: burnK(s), lit: 1,
      beaker: b.a, kind: 'cold', bx: b.bx, lift: b.lift, flip: b.flip, tongSide: -1,
      fog: fogK(s), drops: dropK(s), dropSlide: slideK(s),
      gas: gasK(s), gasMol: 'H2O',
      labels: { candle: candleLab, coat: cl.a },
      coatText: cl.text || undefined
    });
  }
  /* 前後杯壁的霧與水珠（O1.candle 只畫兩側內壁；這裡補上整片杯壁，畫在分子前面＝前杯壁） */
  function frontWall(c, s, R) {
    if (s.n < 2) return;
    const B = R.beaker, fg = fogK(s), dr = dropK(s), sl = slideK(s);
    const x0 = B.ix0 + 2, x1 = B.ix1 - 2, y0 = B.inTop.y + 2, y1 = B.rim.y - 3;
    if (fg > 0.02) {
      c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(232,242,246,' + (0.34 * fg).toFixed(3) + ')'); g.addColorStop(1, 'rgba(232,242,246,' + (0.12 * fg).toFixed(3) + ')');
      c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      /* 霧的細點：由杯底（上方）往杯口依序出現 */
      c.fillStyle = 'rgba(246,250,252,0.7)';
      for (let i = 0; i < 90; i++) {
        const py = y0 + W5.hash(i * 7 + 3) * (y1 - y0), q = (py - y0) / (y1 - y0);
        if (q > fg * 1.25 - 0.1) continue;
        const px = x0 + W5.hash(i * 11 + 5) * (x1 - x0);
        c.beginPath(); c.arc(px, py, 0.9 + W5.hash(i + 31) * 0.9, 0, TAU); c.fill();
      }
      c.restore();
    }
    if (dr > 0.02) {
      const N = 18;
      for (let i = 0; i < N; i++) {
        const q = clamp01(dr * (N + 2) - i * 1.05); if (q <= 0.02) continue;
        const px = x0 + 10 + W5.hash(i * 13 + 2) * (x1 - x0 - 20);
        const pyA = y0 + 10 + W5.hash(i * 17 + 9) * (y1 - y0 - 34);
        const fall = sl * (0.4 + 0.6 * W5.hash(i + 71)) * (y1 - 10 - pyA) * 0.7, py = pyA + fall;
        const rr = (2.4 + 2.8 * W5.hash(i + 19)) * (0.35 + 0.65 * ease(q)) * (1 + 0.4 * sl);
        if (fall > 4) {   /* 滑過留下的水痕 */
          c.save(); c.strokeStyle = 'rgba(190,232,255,0.35)'; c.lineWidth = rr * 0.9; c.lineCap = 'round';
          c.beginPath(); c.moveTo(px, pyA); c.lineTo(px, py - rr); c.stroke(); c.restore();
        }
        c.save();
        c.fillStyle = 'rgba(190,232,255,0.8)'; c.strokeStyle = 'rgba(77,210,255,0.9)'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(px, py, rr * 0.85, rr, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px - rr * 0.3, py - rr * 0.35, rr * 0.3, 0, TAU); c.fill();
        c.restore();
      }
    }
  }
  /* 試紙要碰的那顆水珠（右內壁、靠杯口）：第 2 步長大、第 3 步被試紙吸走 */
  function targetDrop(c, s, R) {
    let r = 0;
    if (s.n === 2) r = 6.5 * ease(clamp01((s.u - 5.6) / 2.0));
    if (s.n === 3) r = 6.5 * (1 - ease(clamp01((s.u - 4.0) / 0.8)));
    if (r <= 0.3) return;
    const p = R.dropSpot;
    c.save();
    c.fillStyle = 'rgba(190,232,255,0.85)'; c.strokeStyle = 'rgba(77,210,255,0.95)'; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(p.x, p.y, r * 0.85, r, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(p.x - r * 0.3, p.y + r * 0.35, r * 0.3, 0, TAU); c.fill();
    c.restore();
  }
  /* 第 1 步：「不要蓋住火焰」 */
  function gapTag(c, s, R) {
    const a = fin(s, 1, 6.6, 0.4) * fout(s, 2, 0, 0.4); if (a <= 0.02) return;
    const gy = (R.beaker.rim.y + R.flameTip.y) / 2;
    W5.glow(c, R.flameTip.x, gy, 30, GREEN, 0.35 * a);
    withA(c, a, () => {
      c.save(); c.strokeStyle = GREEN; c.lineWidth = 2.5; c.setLineDash([5, 4]);
      c.beginPath(); c.ellipse(R.flameTip.x, gy, 26, 12, 0, 0, TAU); c.stroke(); c.restore();
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(410, 300); c.lineTo(R.flameTip.x + 16, gy); c.stroke();
      c.strokeStyle = 'rgba(51,204,153,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(410, 300); c.lineTo(R.flameTip.x + 16, gy); c.stroke();
      c.restore();
    });
    P(c, a, L('不要蓋住火焰', "Don't cover the flame"), 410, 300, GREEN, 22, 'left');
  }
  /* H₂O 圖例（第 2 步 u 1.0 出現，第 4 步開頭淡出） */
  function h2oTag(c, s) {
    const a = fin(s, 2, 1.0, 0.4) * fout(s, 3, 0, 0.5); if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(410, 226); c.lineTo(330, 200); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(410, 226); c.lineTo(330, 200); c.stroke();
      c.fillStyle = 'rgba(246,243,234,0.95)'; c.beginPath(); c.arc(330, 200, 3.5, 0, TAU); c.fill();
      c.restore();
    });
    P(c, a, 'H₂O', 410, 226, WHITE, 22, 'left');
  }

  /* ═══════════ 第 3 步：氯化亞鈷試紙＋鑷子 ═══════════ */
  function paper(c, s, R) {
    const p = paperState(s); if (!p || p.a <= 0.02) return;
    const k = pinkK(s);
    const wet = s.n === 3 ? ease(clamp01((s.u - 4.0) / 0.8)) : 1;
    /* 接觸那一下的閃光 */
    if (s.n === 3 && s.u > 4.0 && s.u < 5.0) W5.glow(c, R.dropSpot.x, R.dropSpot.y, 34, PINK, 0.6 * (1 - (s.u - 4.0)));
    O1.cocl(c, p.x, p.y, PA, { a: p.a, len: PL, w: 18, k, wet });
    O1.tweezers(c, p.x + PUX * GRIP, p.y + PUY * GRIP, PA, { a: p.a, len: TWL, tip: 4 });
  }
  function paperTags(c, s) {
    const p = paperState(s);
    const a1 = fin(s, 3, 1.4, 0.4) * fout(s, 4, 0, 0.5);
    if (a1 > 0.02 && p) {
      const mx = p.x + PUX * PL * 0.5, my = p.y + PUY * PL * 0.5;
      withA(c, a1, () => {
        c.save(); c.lineCap = 'round';
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(500, 250); c.lineTo(mx + 8, my - 4); c.stroke();
        c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(500, 250); c.lineTo(mx + 8, my - 4); c.stroke();
        c.fillStyle = 'rgba(246,243,234,0.95)'; c.beginPath(); c.arc(mx + 8, my - 4, 3.5, 0, TAU); c.fill();
        c.restore();
      });
      P(c, a1, L('藍色氯化亞鈷試紙', 'Blue cobalt chloride paper'), 500, 250, BLUE, 22, 'left');
    }
    const a2 = fin(s, 3, 6.2, 0.4) * fout(s, 4, 0, 0.5);
    P(c, a2, L('變成紅色（粉紅）', 'Turns red (pink)'), 500, 300, PINK, 22, 'left');
  }

  /* ═══════════ 第 4 步：因果鏈＋對照卡 ═══════════ */
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
    const dash = (x0, y0, x1, y1, t0, d) => {
      const g = ease(clamp01((u - t0) / d)); if (g <= 0.02) return;
      M3.dashArrow(c, x0, y0, lerp(x0, x1, g), lerp(y0, y1, g), YEL, 1, s.t * 30, { lw: 4, head: 16 });
    };
    /* ① 有 H₂O */
    const a1 = box(0, 1.2, TEAL);
    if (a1 > 0.02) O1.mol(c, O1.MOL.H2O, CHAIN.icon, CHAIN.ys[0] + 2, { scale: 13, atomScale: 0.42, a: a1, label: false });
    T(c, a1, L('有 H₂O', 'H₂O is present'), CHAIN.tx, CHAIN.ys[0], TEAL, 24, 'left');
    dash(380, 160, CHAIN.x0 - 8, 140, 1.4, 0.6);
    const g = ease(clamp01((u - 2.4) / 0.5));
    if (g > 0.02) {
      const y0 = CHAIN.ys[0] + H / 2 + 2, y1 = lerp(y0, CHAIN.ys[1] - H / 2 - 2, g);
      W5.arrow(c, CHAIN.ax, y0, CHAIN.ax, y1, 'rgba(11,26,21,0.85)', 9, 18);
      W5.arrow(c, CHAIN.ax, y0, CHAIN.ax, y1, YEL, 5, 14);
    }
    /* ② 蠟燭含氫（H） */
    const a2 = box(1, 2.9, YEL);
    const pop = clamp01((u - 3.5) / 0.35);
    if (pop > 0.02) {
      W5.glow(c, CHAIN.icon, CHAIN.ys[1], 38, YEL, 0.45 * pop);
      O1.atom(c, CHAIN.icon, CHAIN.ys[1], 'H', 18 * (0.6 + 0.4 * ease(pop) + 0.15 * Math.sin(Math.PI * pop)), { a: pop });
    }
    T(c, a2, L('蠟燭含氫（H）', 'Candle has hydrogen (H)'), CHAIN.tx, CHAIN.ys[1], YEL, 24, 'left');
    dash(CHAIN.x0 - 8, CHAIN.ys[1] + 12, 332, 380, 4.2, 0.8);
  }
  function compare(c, s) {
    if (s.n !== 4) return;
    const u = s.u, ca = clamp01((u - 5.4) / 0.4); if (ca <= 0.02) return;
    withA(c, ca, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.88)'; c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2;
      W5.rr(c, TAB.x0, TAB.y0, TAB.x1 - TAB.x0, TAB.y1 - TAB.y0, 16); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(TAB.x0 + 16, (TAB.ys[0] + TAB.ys[1]) / 2); c.lineTo(TAB.x1 - 16, (TAB.ys[0] + TAB.ys[1]) / 2); c.stroke();
      c.restore();
    });
    /* 箭頭欄跟著兩列試劑文字中較寬的那一個（中英文長度差很多） */
    const R0 = L('石灰水', 'limewater'), R1 = L('氯化亞鈷試紙', 'cobalt chloride paper');
    c.save(); c.font = W5.font(22); const rw = Math.max(c.measureText(R0).width, c.measureText(R1).width); c.restore();
    const ax0 = TAB.tx + rw + TAB.gap, ax1 = ax0 + TAB.arw, chipX = ax1 + TAB.chip, rx = chipX + TAB.rx;
    const row = (i, t0, el, reag, res, resCol, chip) => {
      const y = TAB.ys[i], a = ca * clamp01((u - t0) / 0.4); if (a <= 0.02) return;
      O1.atom(c, TAB.atom, y, el, 16, { a });
      T(c, a, reag, TAB.tx, y, WHITE, 22, 'left');
      const g = ease(clamp01((u - t0 - 0.4) / 0.4));
      if (g > 0.02) {
        W5.arrow(c, ax0, y, lerp(ax0, ax1, g), y, 'rgba(11,26,21,0.85)', 8, 16);
        W5.arrow(c, ax0, y, lerp(ax0, ax1, g), y, YEL, 4.5, 13);
      }
      const r = ca * clamp01((u - t0 - 0.8) / 0.4); if (r <= 0.02) return;
      chip(r, y);
      T(c, r, res, rx, y, resCol, 22, 'left');
    };
    row(0, 5.8, 'C', R0, L('變混濁', 'cloudy'), WHITE, (a, y) => withA(c, a, () => {
      c.save(); c.fillStyle = '#f6f8f4'; c.strokeStyle = 'rgba(163,184,176,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(chipX, y, 10, 0, TAU); c.fill(); c.stroke(); c.restore();
    }));
    row(1, 6.8, 'H', R1, L('變紅', 'turns red'), PINK, (a, y) => {
      O1.cocl(c, chipX - 8, y, 0, { a, len: 16, w: 22, k: 1 });
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('倒扣冷燒杯', 'Cold beaker over the flame'),
    () => L('內壁起霧', 'Fog inside the beaker'),
    () => L('氯化亞鈷試紙', 'Cobalt chloride paper'),
    () => L('結論：含氫', 'Conclusion: hydrogen')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('乾燥的冷燒杯倒扣在火焰上方（不要蓋住火焰）', "A dry, cold beaker upside down over the flame (don't cover it)"), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('燒杯內壁起霧，還出現小水珠！', 'Fog forms inside the beaker, then tiny water drops!'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('藍色氯化亞鈷試紙碰到小水珠，由藍色變成紅色（粉紅）', 'Blue cobalt chloride paper touches the drops: blue turns red (pink)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.2, 0.6), L('有 H₂O → 蠟燭含氫（H）；碳用石灰水、氫用試紙檢驗', 'H₂O → the candle has hydrogen (H); limewater tests C, paper tests H'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c, s);
    const R = rig(c, s);
    frontWall(c, s, R);
    targetDrop(c, s, R);
    gapTag(c, s, R);
    h2oTag(c, s);
    paper(c, s, R);
    paperTags(c, s);
    chain(c, s);
    compare(c, s);
    texts(c, s);
  }

  W5.register('testh', { canvas: 'cvs-testh', steps: DUR, draw });
})();
