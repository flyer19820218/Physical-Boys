/* ==================================================================
   organics_1 ｜ 乾餾裝置（cvs-distill，960×540）
   四步：1 燒成灰 vs 乾餾 → 2 組裝裝置 → 3 加熱 → 4 三處產物
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption、M4.L／T／P／withA／fin／fout／grow、
        O1.lamp／flame／smoke／match／stamp，以及本檔新增到 O1 的 O1.htube／rigPts／rig／spot（整組乾餾裝置 → products、smoke、竹筷乾餾動手做共用）。

   科學內容（只用簡報）：乾餾＝隔絕空氣加熱，避免物質直接燃燒化為灰燼，藉此分離出有機物內部的成分；
     硬質試管裝竹筷碎片，管口塞子＋導管接到放在冷水燒杯裡的收集管；試管口略向下傾斜：水才不會流回熱的管底，試管才不會破裂；
     先來回移動酒精燈預熱，再集中加熱竹筷：冒白煙，竹筷由黃褐變黑；收集管積黃褐色液體、底部黑褐色黏稠焦油；導管口持續冒白色氣體；
     三處產物：導管口→氣體、收集管→液體、試管底→固體（黑色）。畫面上沒有任何數字。
   不畫手：火柴自己移動點燈；酒精燈自己左右移動。

   第 1 步（11 s）燒成灰 vs 乾餾：
     u 0.2 標題；u 0.4 中間虛線分隔；u 0.5 左標「在空氣中燃燒」、右標「隔絕空氣加熱」
     → u 1.0～1.5 左：耐熱板＋木塊升起；右：密閉小試管（實心塞）＋竹筷碎片＋酒精燈升起
     → u 1.6～2.2 左：木塊起火；u 1.8～2.2 右：酒精燈點燃
     → u 2.0～2.6 左：四支「空氣」箭頭往火源流進來（之後一直流動），u 2.4「空氣」標籤
     → u 2.6～7.0 左：木塊越燒越小、火越來越小、冒灰煙，灰堆長出來；右：竹筷慢慢變黑（u 2.6～7.0）、u 3.6「沒有火焰」
     → u 6.6～7.0 左：空氣箭頭淡出 → u 7.2 左「只剩一小堆灰」；u 7.6 右「只剩炭」→ u 8.0 右上印章「乾餾」
     → u 8.6 字卡；u 9.2～11 靜止（只有火焰閃動）。
   第 2 步（11 s）組裝裝置：
     u 0～0.5 第 1 步畫面淡出 → u 0.5 鐵架 → u 1.0 硬質試管（u 1.3 標「硬質試管」）→ u 1.8～2.6 竹筷碎片一片片滑進管底（u 2.4 標「竹筷碎片」）
     → u 3.0 塞子、u 3.2～4.0 導管長出來（u 3.8 標「導管」）→ u 4.0 燒杯＋冷水（u 4.3 標「冷水」）→ u 4.6 收集管（u 5.0 標「收集管」）、u 5.0～5.5 出氣導管長出來
     → u 5.6～6.1 酒精燈升到竹筷下方（未點燃，u 6.0 標「酒精燈」）
     → u 6.4～6.8「硬質試管」「竹筷碎片」標籤淡出，換成傾斜示意：u 6.6 水平虛線＋沿管方向的黃箭頭、u 7.0 標「管口略向下傾斜」
     → u 7.4 管口附近管壁出現小水珠 → u 7.8～9.2 水珠沿下管壁滑向管口、聚在塞子邊；u 8.2 字卡；u 9.2～11 靜止。
   第 3 步（11 s）加熱：
     u 0～0.4 第 2 步標籤與傾斜示意淡出 → u 0.5 火柴出現（已點燃）→ u 0.8～1.6 火柴移到燈芯 → u 1.6～2.0 酒精燈點燃 → u 1.9～2.6 火柴離開、熄滅淡出
     → u 2.4～5.4 酒精燈來回移動兩趟（預熱，管底受熱光弱）、u 2.6 左上清單 ①「來回移動預熱」
     → u 5.4 停在竹筷下方集中加熱（受熱光變強）、u 5.6 ②「集中加熱竹筷」
     → u 5.8～6.8 試管內冒白煙（u 6.6 ③「冒白煙」）、u 6.4～7.2 導管口開始冒白色氣體
     → u 6.2～9.4 竹筷由黃褐→褐→黑（u 8.0 ④「竹筷變黑」）；u 6.6～9.6 導管端滴下液滴；u 6.8～9.4 收集管積黃褐色液體；u 7.6～9.4 底部焦油變厚
     → u 8.6 字卡；u 9.6～11 靜止（火焰、白煙、氣體持續飄動）。
   第 4 步（12 s）三處產物：
     u 0～0.4 清單淡出 → u 0.6～1.2 其他部分變暗（聚光）
     → u 1.2～1.8 導管口畫出黃圈（u 1.6「氣體」、u 2.0「導管口」）
     → u 3.2～3.8 收集管畫出黃圈（u 3.6「液體」、u 4.0「收集管」）
     → u 5.2～5.8 試管底畫出黃圈（u 5.6「固體（黑色）」、u 6.0「試管底」）
     → u 7.0 字卡；u 7.6～12 靜止（三個圈持續微微發光、火焰與煙持續）。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）。
     第 1 步：分隔虛線 x 480、y 96～440；左標 (240,112)、右標 (720,112)。
       左：耐熱板 x 160～320、y 440～452；木塊 120×46、底 y 440、中心 x 240；火焰在木塊頂面 x 210／240／270；空氣箭頭 (88,330)→(162,384)、(80,422)→(158,422)、右側對稱；「空氣」標 (96,292)／(384,292)；
           「只剩一小堆灰」(240,360)。
       右：O1.htube 閉口端 (600,300)、水平、管長 240、實心塞；竹筷管軸 10～150；酒精燈 (680,452) 縮放 1.1（焰底 y 386、火高 90）；
           「沒有火焰」(720,240)；「只剩炭」(815,380)；印章「乾餾」(720,178)。
     第 2～4 步：O1.rig 原寸（x = y = 0、s = 1），座標見 O1.rig 註解：夾子點 (370,276)、管口 ≈ (425,280)、竹筷中心 ≈ (193,268)、
       收集管中線 x 660（管口 310、外底 440）、燒杯 605～715、導管口 ≈ (704,238)、酒精燈 lampX 193（預熱時 193～323 來回）。
       第 2 步零件標籤由 O1.rig 畫：硬質試管 (346,150)、竹筷碎片 (150,196)、導管 (550,236)、收集管 左對齊 (735,300)、冷水 左對齊 (735,404)、酒精燈 左對齊 (lampX+66,420)。
       傾斜示意：起點 (150,184)，白虛線水平到 x 450、黃箭頭沿管方向 300 px；「管口略向下傾斜」左對齊 (462,172)。
       第 3 步清單：2×2，① (40,118) ② (300,118) ③ (40,162) ④ (300,162)，色點半徑 10、文字左對齊在點右 20 px。
       第 4 步聚光圓：氣體 (708,220) r 52、液體 (660,410) r 48、固體＝竹筷中心 r 78；
         標籤：氣體／導管口 左對齊 (778,190)／(778,232)；液體／收集管 左對齊 (735,388)／(735,430)；固體（黑色）／試管底 置中 (193,122)／(193,164)。
   字級：標題 24、字卡 24、所有標籤 22（第 4 步產物名 24）、印章 26。
   示意：木塊燃燒、灰堆、竹筷變色的過程與顏色、白煙與氣體的樣子、液體與焦油的量、水珠滑動、火焰形狀都是示意；
     收集管用雙孔塞＋出氣導管（導管口）是常見裝置畫法；傾斜角度刻意畫得小（約 4.6°）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.rig) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green, TEAL = COL.teal;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452;
  const LAMP0 = O1.rigPts({}).chips.x;                  /* 竹筷中心 x ≈ 193（酒精燈集中加熱的位置） */
  /* 第 1 步 */
  const W_X = 240, W_W = 120, W_H = 46, W_BOT = 440;     /* 木塊 */
  const MT = { x: 600, y: 300, len: 240 }, ML_X = 680, ML_S = 1.1;   /* 右側密閉小試管、酒精燈 */

  /* 顏色 */
  const WOOD = '#b98a52', WOOD_D = '#5a3a20', ASH = '#a7a6a0';

  /* ═══════════ 背景 ═══════════ */
  function bench(c) {
    M3.ground(c, GY, {});
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 6 });
  }

  /* ═══════════ 第 1 步：燒成灰 vs 乾餾 ═══════════ */
  function step1(c, s) {
    const A = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (A <= 0.02) return;
    const u = s.n === 1 ? s.u : 11, t = s.t;
    withA(c, A, () => {
      /* 分隔虛線 */
      withA(c, fin(s, 1, 0.4, 0.4), () => {
        c.save(); c.setLineDash([10, 10]); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(480, 96); c.lineTo(480, 440); c.stroke(); c.restore();
      });
      P(c, fin(s, 1, 0.5, 0.4), L('在空氣中燃燒', 'Burning in air'), 240, 112, CORAL, 22);
      P(c, fin(s, 1, 0.5, 0.4), L('隔絕空氣加熱', 'Heating without air'), 720, 112, GREEN, 22);

      /* ── 左：木塊在空氣中燃燒 ── */
      const la = fin(s, 1, 1.0, 0.5), rise = 20 * (1 - ease(clamp01((u - 1.0) / 0.5)));
      const b = grow(s, 1, 2.6, 7.0);                    /* 燒掉的比例 */
      const fire = clamp01((u - 1.6) / 0.6) * (1 - clamp01((u - 5.6) / 1.4));
      withA(c, la, () => {
        c.save(); c.translate(0, rise);
        /* 耐熱板 */
        c.fillStyle = '#7d8a92'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
        W5.rr(c, 160, 440, 160, 12, 3); c.fill(); c.stroke();
        /* 灰堆 */
        const ash = clamp01((b - 0.25) / 0.75);
        if (ash > 0.02) {
          c.fillStyle = ASH; c.strokeStyle = 'rgba(70,70,66,0.9)'; c.lineWidth = 1.5;
          c.beginPath(); c.ellipse(W_X, W_BOT, 22 + 26 * ash, 4 + 12 * ash, 0, Math.PI, TAU); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = 'rgba(90,90,86,0.7)';
          for (let i = 0; i < 9; i++) { const px = W_X + (hash(i + 5) - 0.5) * 70 * ash, py = W_BOT - 3 - hash(i + 9) * 9 * ash; c.fillRect(px - 1.5, py - 1.5, 3, 3); }
        }
        /* 木塊：越燒越矮、越來越黑；燒完消失 */
        const h = W_H * (1 - b), w = W_W * (1 - 0.55 * b);
        if (h > 1.5) {
          const wg = c.createLinearGradient(0, W_BOT - h, 0, W_BOT);
          wg.addColorStop(0, W5.mix(WOOD, '#2a221d', clamp01(b * 1.4))); wg.addColorStop(1, W5.mix(WOOD_D, '#2a221d', b));
          c.fillStyle = wg; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2;
          W5.rr(c, W_X - w / 2, W_BOT - h, w, h, 4); c.fill(); c.stroke();
          /* 木紋 */
          c.strokeStyle = 'rgba(60,36,16,' + (0.5 * (1 - b)).toFixed(2) + ')'; c.lineWidth = 1.5;
          for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(W_X - w / 2 + 8, W_BOT - h * i / 3); c.lineTo(W_X + w / 2 - 8, W_BOT - h * i / 3 + 2); c.stroke(); }
          /* 燒紅的邊 */
          if (fire > 0.02) { c.strokeStyle = 'rgba(255,128,64,' + (0.8 * fire).toFixed(2) + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(W_X - w / 2 + 4, W_BOT - h); c.lineTo(W_X + w / 2 - 4, W_BOT - h); c.stroke(); }
        }
        c.restore();
      });
      /* 灰煙＋火焰 */
      if (fire > 0.02) {
        const top = W_BOT - W_H * (1 - b);
        O1.smoke(c, W_X, top - 60, t, { n: 14, h: 120, a: 0.9 * fire, spread: 40, r: 12, speed: 0.35, col: '#9aa0a0', seed: 3 });
        [[-30, 0.75], [0, 1], [30, 0.8]].forEach(([dx, k], i) => {
          const fh = (70 + 20 * k) * fire * (0.6 + 0.4 * (1 - b));
          O1.flame(c, W_X + dx * (1 - 0.5 * b), top + 2, fh * k, t + i * 0.37, { w: 16 * k * Math.max(0.5, fire) });
        });
      }
      /* 空氣箭頭（流動虛線） */
      const air = fin(s, 1, 2.0, 0.6) * fout(s, 1, 6.6, 0.4);
      if (air > 0.02) {
        const g = ease(clamp01((u - 2.0) / 0.6));
        [[88, 330, 162, 384], [80, 422, 158, 422], [392, 330, 318, 384], [400, 422, 322, 422]].forEach(([x0, y0, x1, y1]) => {
          M3.dashArrow(c, x0, y0, lerp(x0, x1, g), lerp(y0, y1, g), TEAL, air, t * 1.5);
        });
        P(c, air * fin(s, 1, 2.4, 0.4), L('空氣', 'Air'), 96, 292, TEAL, 22);
        P(c, air * fin(s, 1, 2.4, 0.4), L('空氣', 'Air'), 384, 292, TEAL, 22);
      }
      P(c, fin(s, 1, 7.2, 0.5), L('只剩一小堆灰', 'Only a little ash left'), W_X, 360, WHITE, 22);

      /* ── 右：密閉小試管隔絕空氣加熱 ── */
      const ra = fin(s, 1, 1.0, 0.5), rr = 20 * (1 - ease(clamp01((u - 1.0) / 0.5)));
      const lit = clamp01((u - 1.8) / 0.4);
      withA(c, ra, () => {
        c.save(); c.translate(0, rr);
        O1.lamp(c, ML_X, GY, { s: ML_S, on: false });
        if (lit > 0.02) O1.flame(c, ML_X, GY - 60 * ML_S, 90 * lit, t, { w: 18 });
        const dark = grow(s, 1, 2.6, 7.0);
        O1.htube(c, { x: MT.x, y: MT.y, ang: 0, len: MT.len, r: 22, t, chips: 1, dark, chip0: 10, chip1: 150, seed: 9, stopper: 'plug',
          heat: lit * 0.8, heatD: ML_X - MT.x });
        c.restore();
      });
      if (s.n === 1 && u > 1.8 && u < 2.3) W5.glow(c, ML_X, GY - 66 * ML_S - 8, 40, YEL, 0.7 * (1 - (u - 1.8) / 0.5));
      P(c, fin(s, 1, 3.6, 0.5), L('沒有火焰', 'No flame'), 720, 240, WHITE, 22);
      P(c, fin(s, 1, 7.6, 0.5), L('只剩炭', 'Only charcoal left'), 815, 380, WHITE, 22);
      O1.stamp(c, [L('乾餾', 'Dry distillation')], 720, 178, { col: GREEN, sizes: [26], rot: -0.06, slam: clamp01((u - 8.0) / 0.3), a: u > 8.0 ? 1 : 0, padY: 8 });
    });
  }

  /* ═══════════ 第 2～4 步：乾餾裝置 ═══════════ */
  /* 酒精燈位置：第 3 步 u 2.4～5.4 來回兩趟（193 ↔ 323），其餘時間在竹筷下方 */
  function lampX(s) {
    if (s.n !== 3) return LAMP0;
    const p = clamp01((s.u - 2.4) / 3.0);
    return LAMP0 + 130 * (1 - Math.cos(TAU * 2 * p)) / 2;
  }
  function rigOpts(s) {
    const n = s.n, u = s.u;
    const parts = {
      stand: fin(s, 2, 0.5, 0.5), tube: fin(s, 2, 1.0, 0.5), chips: s.n > 2 || (s.n === 2 && u >= 1.8) ? 1 : 0,
      stopper: fin(s, 2, 3.0, 0.4), delivery: fin(s, 2, 3.0, 0.2), beaker: fin(s, 2, 4.0, 0.5),
      collector: fin(s, 2, 4.6, 0.5), outlet: fin(s, 2, 5.0, 0.2), lamp: fin(s, 2, 5.6, 0.5)
    };
    const lampOn = grow(s, 3, 1.6, 2.0);
    const sweep = n === 3 && u >= 2.4 && u < 5.4;
    return {
      t: s.t, parts,
      grow: { delivery: grow(s, 2, 3.2, 4.0), outlet: grow(s, 2, 5.0, 5.5) },
      chips: grow(s, 2, 1.8, 2.6),
      lampX: lampX(s), lampLift: n === 2 ? 30 * (1 - ease(clamp01((u - 5.6) / 0.5))) : 0,
      lampOn: lampOn > 0.02 ? lampOn : false,
      heat: lampOn * (sweep ? 0.45 : n === 3 && u < 5.4 ? 0.3 : 1) * (n >= 3 ? 1 : 0),
      chipsDarkness: grow(s, 3, 6.2, 9.4),
      smokeAmt: grow(s, 3, 5.8, 6.8), gasAmt: grow(s, 3, 6.4, 7.2),
      liquidAmt: grow(s, 3, 6.8, 9.4), tarAmt: grow(s, 3, 7.6, 9.4),
      drip: grow(s, 3, 6.6, 7.0) - grow(s, 3, 9.2, 9.6),
      dew: fin(s, 2, 7.4, 0.5), dewSlide: grow(s, 2, 7.8, 9.2),
      labels: n === 2 || (n === 3 && u < 0.5) ? {
        tube: fin(s, 2, 1.3, 0.4) * fout(s, 2, 6.4, 0.4), chips: fin(s, 2, 2.4, 0.4) * fout(s, 2, 6.4, 0.4),
        delivery: fin(s, 2, 3.8, 0.4) * fout(s, 3, 0, 0.4), water: fin(s, 2, 4.3, 0.4) * fout(s, 3, 0, 0.4),
        collector: fin(s, 2, 5.0, 0.4) * fout(s, 3, 0, 0.4), lamp: fin(s, 2, 6.0, 0.4) * fout(s, 3, 0, 0.4)
      } : false
    };
  }

  /* 傾斜示意（第 2 步）：水平虛線 vs 沿管方向的黃箭頭 */
  function tiltMark(c, s, R) {
    const a = fin(s, 2, 6.6, 0.4) * (s.n === 2 ? 1 : fout(s, 3, 0, 0.4)); if (a <= 0.02) return;
    const g = s.n === 2 ? ease(clamp01((s.u - 6.6) / 0.6)) : 1;
    const x0 = 150, y0 = 184, len = 300, th = R.tilt;
    withA(c, a, () => {
      c.save(); c.setLineDash([9, 8]); c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + len * g, y0); c.stroke(); c.restore();
      const x1 = x0 + len * g * Math.cos(th), y1 = y0 + len * g * Math.sin(th);
      W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', 8, 18);
      W5.arrow(c, x0, y0, x1, y1, YEL, 4, 14);
      c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5; c.beginPath(); c.arc(x0, y0, 120, 0, th); c.stroke(); c.restore();
    });
    P(c, fin(s, 2, 7.0, 0.4) * (s.n === 2 ? 1 : fout(s, 3, 0, 0.4)), L('管口略向下傾斜', 'Mouth tilted slightly down'), 462, 172, YEL, 22, 'left');
  }

  /* 火柴（第 3 步）：自己移到燈芯點燈 */
  function match(c, s, R) {
    if (s.n !== 3) return;
    const u = s.u;
    const a = clamp01((u - 0.5) / 0.2) * (1 - clamp01((u - 2.3) / 0.3)); if (a <= 0.02) return;
    const go = ease(clamp01((u - 0.8) / 0.8)), back = ease(clamp01((u - 1.9) / 0.6));
    const hx0 = 520, hy0 = 390, hx1 = R.wick.x + 12, hy1 = R.wick.y - 4;
    const x = lerp(lerp(hx0, hx1, go), hx0, back), y = lerp(lerp(hy0, hy1, go), hy0 + 10, back);
    const lit = clamp01((u - 0.5) / 0.25) * (1 - clamp01((u - 2.0) / 0.3));
    O1.match(c, x, y, 0.35, { a, lit, burnt: clamp01((u - 2.0) / 0.3), t: s.t });
    if (u > 1.55 && u < 2.1) W5.glow(c, R.wick.x, R.wick.y - 10, 46, YEL, 0.8 * (1 - (u - 1.55) / 0.55));
  }

  /* 第 3 步清單（2×2） */
  const ROWS = [
    { t: 2.6, x: 40, y: 118, sw: '#ff9a40', txt: () => L('來回移動預熱', 'Sweep to preheat') },
    { t: 5.6, x: 300, y: 118, sw: '#ff8040', txt: () => L('集中加熱竹筷', 'Heat the chips') },
    { t: 6.6, x: 40, y: 162, sw: '#eef2f0', txt: () => L('冒白煙', 'White smoke') },
    { t: 8.0, x: 300, y: 162, sw: '#2a221d', txt: () => L('竹筷變黑', 'Chips turn black') }
  ];
  function rows(c, s) {
    const A = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.4) : 0; if (A <= 0.02) return;
    const u = s.n === 3 ? s.u : 99;
    let last = -1; ROWS.forEach((r, i) => { if (u >= r.t) last = i; });
    ROWS.forEach((r, i) => {
      const ra = A * clamp01((u - r.t) / 0.4); if (ra <= 0.02) return;
      const dx = 14 * (1 - ease(clamp01((u - r.t) / 0.4)));
      withA(c, ra, () => {
        c.save(); c.fillStyle = r.sw; c.strokeStyle = i === last ? YEL : 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(r.x + 10 + dx, r.y, 10, 0, TAU); c.fill(); c.stroke(); c.restore();
      });
      T(c, ra, (i + 1) + '  ' + r.txt(), r.x + 30 + dx, r.y, i === last ? YEL : DIM, 22, 'left');
    });
  }

  /* 第 4 步：三處產物（聚光＋黃圈＋標籤） */
  function products(c, s, R) {
    if (s.n !== 4) return;
    const u = s.u;
    const H = [
      { x: R.outlet.x + 4, y: R.outlet.y - 18, r: 52, t: 1.2 },
      { x: R.liquidMid.x, y: 410, r: 48, t: 3.2 },
      { x: R.chips.x, y: R.chips.y, r: 78, t: 5.2 }
    ];
    /* 圓洞跟著圈出現才打開 */
    O1.spot(c, H.map(h => ({ x: h.x, y: h.y, r: h.r * ease(clamp01((u - h.t + 0.6) / 0.6)) + 0.1 })), { a: fin(s, 4, 0.6, 0.6) });
    H.forEach((h, i) => {
      const k = ease(clamp01((u - h.t) / 0.6)); if (k <= 0.01) return;
      const pulse = 1 + 0.04 * Math.sin(s.t * 3 + i);
      W5.glow(c, h.x, h.y, h.r * 1.25, YEL, 0.10 * k);
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.arc(h.x, h.y, h.r * pulse, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
      c.strokeStyle = YEL; c.lineWidth = 5; c.beginPath(); c.arc(h.x, h.y, h.r * pulse, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
      c.restore();
    });
    const lab = [
      { a: 1.6, b: 2.0, p: L('氣體', 'Gas'), q: L('導管口', 'Gas outlet'), x: 778, y0: 190, y1: 232, al: 'left' },
      { a: 3.6, b: 4.0, p: L('液體', 'Liquid'), q: L('收集管', 'Collecting tube'), x: 735, y0: 388, y1: 430, al: 'left' },
      { a: 5.6, b: 6.0, p: L('固體（黑色）', 'Solid (black)'), q: L('試管底', 'Tube bottom'), x: R.chips.x, y0: 122, y1: 164, al: 'center' }
    ];
    lab.forEach(d => {
      P(c, fin(s, 4, d.a, 0.4), d.p, d.x, d.y0, YEL, 24, d.al);
      P(c, fin(s, 4, d.b, 0.4), d.q, d.x, d.y1, WHITE, 22, d.al);
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('燒成灰 vs 乾餾', 'Ash vs dry distillation'),
    () => L('組裝裝置', 'Set up the apparatus'),
    () => L('加熱', 'Heat'),
    () => L('三處產物', 'Products in three places')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.6, 0.6) * fout(s, 2, 0, 0.4), L('乾餾：隔絕空氣加熱，才不會直接燒成灰', 'Dry distillation: heat without air, so it won\'t burn to ash'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.2, 0.6) * fout(s, 3, 0, 0.4), L('試管口略向下傾斜：水才不會流回熱的管底，試管才不會破裂', 'Mouth tilted down: water can\'t run back to the hot bottom and crack it'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.6, 0.6) * fout(s, 4, 0, 0.4), L('先來回移動酒精燈預熱，再集中加熱竹筷：冒白煙，竹筷變黑', 'Sweep to preheat, then heat the chips: white smoke, chips turn black'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.0, 0.6), L('氣體從導管口出來、液體聚在收集管、黑色固體留在試管', 'Gas from the outlet, liquid in the collector, black solid in the tube'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c);
    step1(c, s);
    if (s.n >= 2) {
      const o = rigOpts(s);
      const R = O1.rig(c, o);
      tiltMark(c, s, R);
      match(c, s, R);
      rows(c, s);
      products(c, s, R);
    }
    texts(c, s);
  }

  W5.register('distill', { canvas: 'cvs-distill', steps: DUR, draw });
})();
