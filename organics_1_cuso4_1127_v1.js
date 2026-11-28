/* ==================================================================
   organics_1 ｜ 補充：檢驗水的另一種方法——無水硫酸銅（cvs-cuso4，960×540，tab5）
   四步：1 白色粉末 → 2 遇到水 → 3 變成藍色 → 4 與試紙比一比
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／dashArrow、
        M4.L／P／withA／fin／fout／grow，
        O1.bottle／spatula／dropper／miniMol／mol／MOL.H2O／fx／cocl／tweezers，
        以及本檔新增到 O1 的 O1.CUSO4／cuso4Pile／waterDrop。

   科學內容（只用簡報）：白色的無水硫酸銅粉末；滴進水；無水硫酸銅遇到水，由白色變成藍色；
     氯化亞鈷試紙遇水由藍變紅（粉紅），無水硫酸銅遇水由白變藍，兩者都能檢驗 H₂O。
     畫面上沒有任何數字（除化學式下標 H₂O）。不畫手：藥匙、滴管、鑷子都自己移動；滴管從畫面上方移入。

   第 1 步（11 s）白色粉末：
     u 0.2 標題 → u 0.3～0.9 空的蒸發皿淡入 → u 0.7～1.2 左邊試劑瓶淡入
     → u 1.2～1.6 藥匙（盛滿白色粉末）在瓶口上方出現 → u 1.6～2.6 藥匙沿弧線移到蒸發皿上方
     → u 2.6～4.2 粉末一粒粒從藥匙落下（藥匙上的粉末變少）、u 2.7～4.4 皿裡的白色粉堆長大
     → u 4.2～4.9 藥匙往右上退開淡出 → u 4.8「無水硫酸銅」（引線指到粉堆）
     → u 5.6 下方「白色」 → u 6.4～7.2 粉堆閃一下白光 → u 7.4 字卡；u 8.0～11 靜止。
   第 2 步（11 s）遇到水：
     u 0～0.5 試劑瓶淡出 → u 0.2 標題 → u 0.6～2.2 裝了水的滴管從畫面上方往下移入，停在粉堆正上方
     → u 2.2「水」（青色，在滴管左邊）→ u 3.0～3.6 橡皮頭擠扁、尖端長出一顆水珠
     → u 3.6～4.1 水珠下落（越落越快、拉長）→ u 4.1 打到粉堆：水花圈＋四顆小水花（0.6 s）
     → u 4.1～4.6 粉堆上出現濕痕 → u 4.6～6.0 滴到的地方出現一小點藍色
     → u 6.8 字卡；u 7.6～11 靜止。
   第 3 步（11 s）變成藍色：
     u 0.2 標題 → u 0.5～1.0 第二顆水珠長出、u 1.0～1.45 下落、u 1.45 打到同一點
     → u 0.6～6.6 藍色從滴到的地方往四周擴散，最後整堆變藍（濕痕 u 1～4 被藍色蓋掉）
     → u 1.8～2.3 第三顆水珠長出、u 2.3～2.75 下落、u 2.75 打到
     → u 3.4～4.6 滴管往上退出畫面 → u 4.0 下方「白色」右邊長出箭頭＋「藍色」
     → u 6.6～7.4 整堆閃一下藍光 → u 7.0 字卡；u 8.0～11 靜止。
   第 4 步（12 s）與試紙比一比：
     u 0～0.6 大蒸發皿、標籤淡出 → u 0.6～1.0 中間 H₂O 分子彈出 → u 1.0「H₂O」
     → u 1.4～2.0 左邊：藍色氯化亞鈷試紙＋鑷子淡入、u 1.6「氯化亞鈷試紙」
     → u 1.8～2.4 右邊：小蒸發皿＋白色粉末淡入、u 2.0「無水硫酸銅」
     → u 2.4～3.0 兩條黃色虛線箭頭由 H₂O 指向兩邊
     → u 2.6～4.1 小 H₂O 粒子（每邊 3 顆，間隔 0.25 s，各飛 1.0 s；從 H₂O 兩側 x 424／536 出發）飛到試紙尖端與粉堆頂
     → u 3.6～5.6 試紙從尖端由藍變粉紅、粉堆從頂端由白變藍（同時）
     → u 5.0「藍 → 紅（粉紅）」（左，粉紅）、「白 → 藍」（右，藍）
     → u 6.2「檢驗水」（黃）→ u 7.2 字卡；u 8.0～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34
     （滴管移入時用 clip 把 y < 34 的部分切掉）。桌面 GY 452（M3.slab 20～940、452～466）。
     第 1～3 步：蒸發皿 O1.cuso4Pile 皿底 (400,452)、縮放 1：皿口半寬 150（250～550）、皿口中線 y 382；粉堆半寬 112、頂 ≈ y 300。
       試劑瓶 O1.bottle (150,452)（瓶蓋頂 y 344）；藥匙勺尖 (172,318) → 弧線（最高 y 200）→ (400,236)，柄方向 −0.55 rad、長 130。
       水珠落點 IX 355、IY＝粉堆表面（≈ y 315，粉堆左上坡）。滴管 O1.dropper 放大 1.8 倍、尖端 x 355，停在 y 210（橡皮頭頂 ≈ y 64，在標題 pill 左邊）；
         移入起點尖端 y −110，退出終點 y −120。滴管上的水珠 r 9；下落的水珠 O1.waterDrop r 8。
       「水」pill (260,130)（青）；「無水硫酸銅」左對齊 (560,230)，引線到粉堆 (468,322)；
       下方兩格 y 405：「白色」(650)、「藍色」(830)，格間白箭頭。
     第 4 步：H₂O O1.mol scale 36 中心 (480,288)；「H₂O」O1.fx (480,360) 30px；「檢驗水」(480,412)（黃）。
       左：氯化亞鈷試紙 O1.cocl 尖端 (340,320)、朝左（ang π）、長 200、寬 34（140～340）；鑷子尖端 (154,320)、長 100。
         「氯化亞鈷試紙」(240,160)；「藍 → 紅（粉紅）」(240,220)（粉紅）。
       右：小蒸發皿 O1.cuso4Pile 皿底 (760,452)、縮放 0.7（皿口 655～865、粉堆頂 ≈ y 345）。
         「無水硫酸銅」(760,160)；「白 → 藍」(760,220)（藍）。
       黃色虛線箭頭 (420,288)→(360,316)、(540,288)→(690,336)；H₂O 小粒子 O1.miniMol scale 9。
   字級：標題 24、字卡 24、所有標籤 22、角落小標 20、H₂O 化學式 30、原子元素符號 ≥ 16。
   示意：一匙粉末就堆成一堆、粉末落下的樣子、粉堆形狀與大小、水珠大小與滴數、藍色擴散的速度與形狀、
     第 4 步試紙整條變色與粉堆整堆變藍的速度、H₂O 粒子飛過去都是示意；藍色的色調（#2f8fe8）、試紙的藍與粉紅沿用 O1.cocl 預設。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' ||
      !O1.cuso4Pile || !O1.waterDrop || !O1.dropper || !O1.cocl || !O1.tweezers || !O1.bottle || !O1.spatula || !O1.miniMol) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, YEL = COL.yellow, CORAL = COL.coral, TEAL = COL.teal;
  const BLUE = O1.CUSO4.blueHi, PINK = '#f28cb1', WATER = '#4dd2ff';
  const DUR = [11, 11, 11, 12];                           /* 總長 45 秒 */

  const seg = (u, a, b) => clamp01((u - a) / (b - a));

  /* ── 版面 ── */
  const GY = 452;
  const DISH = { x: 400, y: GY, s: 1 };
  const PILE = O1.cuso4Pile(null, DISH.x, DISH.y, { a: 0, s: DISH.s, k: 1 });   /* 只算錨點，不畫 */
  const IX = 355, IY = PILE.surf(IX);                     /* 水珠落點 */
  const BOT = { x: 150, y: GY };                          /* 試劑瓶 */
  const SP0 = { x: 172, y: 318 }, SP1 = { x: 400, y: 236 }, SP_ANG = -0.55;
  const DS = 1.8, DTIP = 210;                             /* 滴管放大倍數、停住時尖端 y */
  const DROP_R = 9, FALL_R = 8;
  const NAME = { x: 560, y: 230 }, NAME_TO = { x: 468, y: 322 };
  const CH_Y = 405, CH = [650, 830];
  /* 第 4 步 */
  const HC = { x: 480, y: 288 };
  const PAPER = { x: 340, y: 320, len: 200, w: 34 };
  const DISH4 = { x: 760, y: GY, s: 0.7 };
  const PILE4 = O1.cuso4Pile(null, DISH4.x, DISH4.y, { a: 0, s: DISH4.s, k: 1 });
  const ROW1 = 160, ROW2 = 220, LX4 = 240, RX4 = 760;

  /* ═══════════ 小工具 ═══════════ */
  /* 滴管（放大 DS 倍；只畫在 y ≥ 34） */
  function dropper(c, x, tipY, o) {
    c.save(); c.beginPath(); c.rect(0, 34, 960, 506); c.clip();
    c.translate(x, tipY); c.scale(DS, DS);
    O1.dropper(c, 0, 0, Object.assign({ len: 55, col: WATER }, o));
    c.restore();
  }
  /* 一顆水珠：u 秒；tg 長出 [g0,g1]、tf 落下 [g1,f1]；回傳是否已打到 */
  function dropAt(u, g0, g1, f1) {
    return { grow: seg(u, g0, g1), fall: u >= g1 && u < f1 ? (u - g1) / (f1 - g1) : u >= f1 ? 1 : -1, hit: u - f1 };
  }
  function fallingDrop(c, d, a) {
    if (d.fall < 0 || d.fall >= 1) return;
    const k = d.fall * d.fall, y0 = DTIP + DROP_R * 0.9 * DS * 0.5 + 6, y1 = IY - FALL_R;
    O1.waterDrop(c, IX, lerp(y0, y1, k), FALL_R, { a, col: WATER, stretch: d.fall });
  }
  /* 水花：age 秒（0～0.6） */
  function splash(c, x, y, age, a) {
    if (age < 0 || age > 0.6 || a <= 0.02) return;
    const p = age / 0.6;
    withA(c, a * (1 - p), () => {
      c.strokeStyle = W5.rgba(WATER, 0.9); c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(x, y + 2, 10 + 30 * ease(p), 4 + 9 * ease(p), 0, 0, TAU); c.stroke();
      c.fillStyle = W5.rgba(WATER, 0.95);
      [-1.2, -0.5, 0.5, 1.2].forEach((v, i) => {
        const px = x + v * 34 * p, py = y - (60 + 14 * (i % 2)) * p + 120 * p * p;
        c.beginPath(); c.arc(px, py, 3.2 * (1 - 0.5 * p), 0, TAU); c.fill();
      });
    });
  }
  /* 引線（深色外框＋彩色細線＋端點小圓） */
  function leader(c, a, x0, y0, x1, y1, col) {
    withA(c, a, () => {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(x1, y1, 4, 0, TAU); c.fill(); c.restore();
    });
  }

  /* ═══════════ 背景 ═══════════ */
  function bench(c) {
    M3.ground(c, GY, {});
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 4 });
  }

  /* ═══════════ 第 1～3 步：蒸發皿＋粉堆 ═══════════ */
  function bigDish(c, s) {
    const A = s.n <= 3 ? fin(s, 1, 0.3, 0.6) : fout(s, 4, 0, 0.6);
    if (A <= 0.02) return;
    const u = s.u;
    const k = s.n === 1 ? grow(s, 1, 2.7, 4.4) : 1;
    let blue = 0, wet = 0;
    if (s.n === 2) { blue = 0.1 * ease(seg(u, 4.6, 6.0)); wet = ease(seg(u, 4.1, 4.6)); }
    else if (s.n === 3) { blue = lerp(0.1, 1.3, ease(seg(u, 0.6, 6.6))); wet = 1 - seg(u, 1.0, 4.0); }
    else if (s.n === 4) blue = 1.3;
    O1.cuso4Pile(c, DISH.x, DISH.y, { a: A, s: DISH.s, k, blue, wet, bx: IX, by: IY + 4, seed: 4 });
    /* 閃光 */
    if (s.n === 1 && u > 6.4 && u < 7.2) W5.glow(c, DISH.x, PILE.top.y + 40, 120, '#ffffff', 0.3 * Math.sin(Math.PI * (u - 6.4) / 0.8));
    if (s.n === 3 && u > 6.6 && u < 7.4) W5.glow(c, DISH.x, PILE.top.y + 40, 130, O1.CUSO4.blue, 0.4 * Math.sin(Math.PI * (u - 6.6) / 0.8));
  }

  /* 第 1 步：試劑瓶＋藥匙 */
  function step1(c, s) {
    const bA = s.n === 1 ? fin(s, 1, 0.7, 0.5) : s.n === 2 ? fout(s, 2, 0, 0.5) : 0;
    if (bA > 0.02) O1.bottle(c, BOT.x, BOT.y, { a: bA });
    if (s.n !== 1) return;
    const u = s.u;
    const sA = fin(s, 1, 1.2, 0.4) * fout(s, 1, 4.4, 0.5);
    if (sA <= 0.02) return;
    const m = ease(seg(u, 1.6, 2.6)), back = ease(seg(u, 4.2, 4.9));
    let x = lerp(SP0.x, SP1.x, m), y = lerp(SP0.y, SP1.y, m) - 110 * Math.sin(Math.PI * m) * 0.75;
    x += 120 * back; y -= 80 * back;
    const load = 1 - seg(u, 2.6, 4.2);
    /* 落下的粉末（確定性） */
    if (u > 2.6 && u < 4.8) {
      const top = PILE.surf(SP1.x);
      for (let i = 0; i < 28; i++) {
        const t0 = 2.6 + i * 0.055, age = u - t0; if (age < 0) continue;
        const yEnd = lerp(PILE.base, top, grow(s, 1, 2.7, 4.4)) - 2;
        const py = SP1.y + 6 + 600 * age * age; if (py > yEnd) continue;
        const px = SP1.x + (hash(i * 3.7) - 0.5) * 10 + (hash(i * 1.3) - 0.5) * 18 * age;
        c.fillStyle = i % 3 ? 'rgba(251,251,246,0.95)' : 'rgba(200,206,200,0.95)';
        c.beginPath(); c.arc(px, py, 2.4, 0, TAU); c.fill();
      }
    }
    O1.spatula(c, x, y, SP_ANG, { a: sA, len: 130, load, col: O1.CUSO4.white });
  }

  /* 第 2、3 步：滴管與水珠 */
  function water(c, s) {
    if (s.n !== 2 && s.n !== 3) return;
    const u = s.u;
    let tipY, sq = 0, dropK = 0, fill;
    const drops = [];
    if (s.n === 2) {
      tipY = lerp(-110, DTIP, ease(seg(u, 0.6, 2.2)));
      const d = dropAt(u, 3.0, 3.6, 4.1); drops.push(d);
      sq = d.grow * (d.fall < 0 ? 1 : 1 - seg(u, 3.6, 4.0));
      dropK = d.fall < 0 ? d.grow : 0;
      fill = 0.75 - 0.08 * seg(u, 3.0, 3.6);
    } else {
      tipY = lerp(DTIP, -120, ease(seg(u, 3.4, 4.6)));
      const d1 = dropAt(u, 0.5, 1.0, 1.45), d2 = dropAt(u, 1.8, 2.3, 2.75); drops.push(d1, d2);
      const cur = u < 1.4 ? d1 : d2;
      sq = cur.grow * (cur.fall < 0 ? 1 : 1 - seg(u, cur === d1 ? 1.0 : 2.3, cur === d1 ? 1.4 : 2.7));
      dropK = cur.fall < 0 ? cur.grow : 0;
      fill = 0.67 - 0.08 * seg(u, 0.5, 1.0) - 0.08 * seg(u, 1.8, 2.3);
    }
    const dA = s.n === 2 ? fin(s, 2, 0.6, 0.4) : fout(s, 3, 4.2, 0.4);
    dropper(c, IX, tipY, { a: dA, fill, squeeze: sq, drop: dropK });
    drops.forEach(d => { fallingDrop(c, d, 1); splash(c, IX, IY, d.hit, 1); });
    /* 「水」 */
    const wA = s.n === 2 ? fin(s, 2, 2.2, 0.4) : fout(s, 3, 3.2, 0.4);
    P(c, wA, L('水', 'Water'), 260, 130, TEAL, 22);
  }

  /* 第 1～3 步的標籤 */
  function labels(c, s) {
    const out = s.n <= 3 ? 1 : fout(s, 4, 0, 0.5);
    const aN = out * fin(s, 1, 4.8, 0.4);
    const r = P(c, aN, L('無水硫酸銅', 'Anhydrous copper sulfate'), NAME.x, NAME.y, WHITE, 22, 'left');
    if (r) leader(c, aN, r.x - 2, NAME.y, NAME_TO.x, NAME_TO.y, WHITE);
    const a1 = out * fin(s, 1, 5.6, 0.4), a2 = out * fin(s, 3, 4.0, 0.4);
    const r1 = P(c, a1, L('白色', 'White'), CH[0], CH_Y, WHITE, 22);
    const r2 = P(c, a2, L('藍色', 'Blue'), CH[1], CH_Y, BLUE, 22);
    if (r1 && r2 && a2 > 0.02) {
      const g = s.n === 3 ? ease(seg(s.u, 4.0, 4.5)) : 1;
      withA(c, a2, () => W5.arrow(c, r1.x + r1.w + 4, CH_Y, lerp(r1.x + r1.w + 8, r2.x - 4, g), CH_Y, WHITE, 3, 9));
    }
  }

  /* ═══════════ 第 4 步：與試紙比一比 ═══════════ */
  function step4(c, s) {
    if (s.n !== 4) return;
    const u = s.u;
    /* 試紙＋鑷子（鑷子先畫，在試紙後面） */
    const pA = fin(s, 4, 1.4, 0.6), pk = ease(seg(u, 3.6, 5.6));
    const tail = PAPER.x - PAPER.len;
    O1.tweezers(c, tail + 14, PAPER.y, Math.PI, { a: pA, len: 100, tip: 4 });
    O1.cocl(c, PAPER.x, PAPER.y, Math.PI, { a: pA, len: PAPER.len, w: PAPER.w, k: pk, wet: ease(seg(u, 3.6, 4.2)) });
    /* 小蒸發皿 */
    const dA = fin(s, 4, 1.8, 0.6);
    O1.cuso4Pile(c, DISH4.x, DISH4.y, { a: dA, s: DISH4.s, k: 1, blue: 1.3 * ease(seg(u, 3.6, 5.6)), bx: DISH4.x, by: PILE4.top.y + 4, seed: 8 });
    /* 中間的 H₂O */
    const q = clamp01((u - 0.6) / 0.4), sc = q >= 1 ? 1 : 0.5 + 0.5 * ease(q) + 0.15 * Math.sin(Math.PI * q);
    if (q > 0) {
      W5.glow(c, HC.x, HC.y, 90, WATER, 0.18 * clamp01(q * 2));
      O1.mol(c, O1.MOL.H2O, HC.x, HC.y, { scale: 36 * sc, atomScale: 0.85 * sc, a: clamp01(q * 2.5) });
    }
    withA(c, fin(s, 4, 1.0, 0.4), () => O1.fx(c, 'H2O', HC.x, 360, WHITE, 30, 'center'));
    /* 虛線箭頭 */
    const g = ease(seg(u, 2.4, 3.0)), aA = fin(s, 4, 2.4, 0.3);
    if (g > 0.01) {
      M3.dashArrow(c, 420, 288, lerp(420, 360, g), lerp(288, 316, g), YEL, aA, s.t * 1.5);
      M3.dashArrow(c, 540, 288, lerp(540, 690, g), lerp(288, 336, g), YEL, aA, s.t * 1.5);
    }
    /* 小 H₂O 粒子飛到兩邊 */
    const TG = [{ x: PAPER.x - 6, y: PAPER.y }, { x: DISH4.x, y: PILE4.top.y + 6 }];
    TG.forEach((tg, side) => {
      for (let i = 0; i < 3; i++) {
        const t0 = 2.6 + i * 0.25, p = (u - t0) / 1.0; if (p < 0 || p > 1) continue;
        const sx = HC.x + (side ? 56 : -56), e = ease(p), x = lerp(sx, tg.x, e), y = lerp(HC.y + 6, tg.y, e) - 40 * Math.sin(Math.PI * e) + (i - 1) * 10 * (1 - e);
        O1.miniMol(c, O1.MOL.H2O, x, y, { scale: 9, k: 0.3, rot: u * 3 + i + side, a: clamp01(p * 6) * (1 - seg(p, 0.85, 1)) });
      }
    });
    /* 標籤 */
    P(c, fin(s, 4, 1.6, 0.4), L('氯化亞鈷試紙', 'Cobalt chloride paper'), LX4, ROW1, WHITE, 22);
    P(c, fin(s, 4, 2.0, 0.4), L('無水硫酸銅', 'Anhydrous copper sulfate'), RX4, ROW1, WHITE, 22);
    P(c, fin(s, 4, 5.0, 0.4), L('藍 → 紅（粉紅）', 'Blue → red (pink)'), LX4, ROW2, PINK, 22);
    P(c, fin(s, 4, 5.0, 0.4), L('白 → 藍', 'White → blue'), RX4, ROW2, BLUE, 22);
    const tA = fin(s, 4, 6.2, 0.5);
    if (tA > 0.02) W5.glow(c, HC.x, 412, 110, YEL, 0.12 * tA);
    P(c, tA, L('檢驗水', 'Tests for water'), HC.x, 412, YEL, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('白色粉末', 'White powder'),
    () => L('遇到水', 'Meet water'),
    () => L('變成藍色', 'Turns blue'),
    () => L('與試紙比一比', 'Compare with the paper')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.4, 0.6) * fout(s, 2, 0, 0.4), L('白色的無水硫酸銅粉末', 'White anhydrous copper sulfate powder'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 6.8, 0.6) * fout(s, 3, 0, 0.4), L('滴進水……', 'Add a drop of water...'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * fout(s, 4, 0, 0.4), L('無水硫酸銅遇到水，由白色變成藍色', 'Anhydrous copper sulfate meets water: white turns blue'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.2, 0.6), L('氯化亞鈷試紙：藍→紅；無水硫酸銅：白→藍；都能檢驗 H₂O', 'Cobalt paper: blue→red; copper sulfate: white→blue; both test H₂O'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c);
    step1(c, s);
    bigDish(c, s);
    water(c, s);
    labels(c, s);
    step4(c, s);
    texts(c, s);
  }

  W5.register('cuso4', { canvas: 'cvs-cuso4', steps: DUR, draw });
})();
