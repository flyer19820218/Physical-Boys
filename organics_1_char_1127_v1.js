/* ==================================================================
   organics_1 ｜ 砂糖、麵粉、食鹽，誰會變黑？（cvs-char，960×540）
   四步：1 準備加熱 → 2 加熱砂糖 → 3 加熱麵粉 → 4 加熱食鹽
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption、M4.L／T／P／withA／fin／fout／grow、
        O1.lamp／flame／smoke／stamp，以及本檔新增到 O1 的 O1.dspoon／match／goggles／lampCap。

   科學內容（只用簡報）：戴上護目鏡、點燃酒精燈；燃燒匙放在外焰（外焰：溫度最高）；
     砂糖：熔化成液體 → 褐色、冒煙 → 變黑；麵粉：白 → 黃 → 褐、冒煙 → 變黑；
     食鹽：劈啪跳動，一直是白色（不冒煙、不變色）；變黑的是含碳的有機物。畫面上沒有任何數字。
   器材移動（不畫手）：燃燒匙的吊夾沿鐵架橫桿滑到酒精燈正上方，再往下移進外焰；加熱完往上提、滑到左邊放好。
     酒精燈固定不動（不移動點燃的酒精燈）；開燈前燈帽往上拿開、最後燈帽蓋回去熄火，熄火後整盞淡出收走（燈帽是示意，不加文字）。

   第 1 步（11 s）準備加熱：
     u 0.2 標題；u 0.3～1.1 實驗桌、鐵架（兩根直桿＋橫桿）淡入 → u 1.0～1.4 護目鏡蓋到標題右邊、u 1.4「戴上護目鏡」
     → u 1.8～2.4 酒精燈（蓋著燈帽）升起淡入 → u 2.4～2.9 燈帽往上拿開
     → u 2.6 火柴出現、火柴頭點燃 → u 2.9～3.8 火柴移到燈芯 → u 3.9～4.4 酒精燈點燃 → u 4.3～5.0 火柴離開、熄滅淡出
     → u 5.2～5.7 箭頭＋「外焰：溫度最高」→ u 6.0 / 6.4 / 6.8 砂糖、麵粉、食鹽三支燃燒匙依序滑進吊夾（u 6.3 / 6.7 / 7.1 名牌）
     → u 8.0 字卡；u 8.6～11 靜止（只有火焰閃動）。
   第 2 步（11 s）加熱砂糖：
     u 0～0.4「外焰」標籤淡出；u 0.6～1.6 砂糖匙沿橫桿滑到燈上方 → u 1.6～2.2 下移進外焰（杯底橘光）
     → u 2.4～4.0 粉末熔化成透亮液體（u 3.0 右側第 1 行「熔化成液體」）
     → u 4.0～5.6 變褐色、u 4.2 起冒泡、u 4.6 起冒煙（u 4.8 第 2 行「褐色、冒煙」）
     → u 5.6～7.0 變黑（u 6.6 第 3 行「變黑」）→ u 7.6～8.2 往上提離火焰；u 8.0 字卡；u 8.2～9.2 煙散去；u 9.2～11 靜止。
   第 3 步（11 s）加熱麵粉：
     u 0～0.4 右側變化表淡出；u 0.4～1.4 黑色砂糖匙滑到左邊放好 → u 1.2～2.2 麵粉匙滑到燈上方 → u 2.2～2.8 下移進外焰
     → u 2.4 第 1 行「白色」→ u 2.8～4.0 白 → 黃（u 3.6「黃色」）→ u 4.0～5.2 黃 → 褐、u 4.6 起冒煙（u 4.8「褐色、冒煙」）
     → u 5.2～6.6 變黑（u 6.2「變黑」）→ u 7.0～7.6 往上提；u 7.6～9.0 煙散去；u 8.0 字卡；u 9.0～11 靜止。
   第 4 步（12 s）加熱食鹽：
     u 0～0.4 變化表淡出；u 0.4～1.4 黑色麵粉匙滑到左邊 → u 1.2～2.2 食鹽匙滑到燈上方 → u 2.2～2.8 下移進外焰
     → u 2.8～6.0 鹽粒劈啪跳起落下（確定性 hash）、不冒煙不變色（u 3.2「劈啪跳動」、u 4.4「一直是白色」、u 5.4「不冒煙、不變色」）
     → u 6.0～6.6 往上提 → u 6.4～7.0 燈帽蓋回、u 6.9～7.3 火焰熄滅 → u 7.0～7.4 變化表淡出
     → u 7.4～8.0 蓋好燈帽的酒精燈收走（淡出，讓出位置）→ u 7.2～8.4 三支匙並排（x 230／480／730）→ u 8.6 / 9.0 / 9.4 印章「有機物（含碳）」「有機物（含碳）」「不含碳」
     → u 9.6 字卡；u 10.2～12 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）；鐵架直桿 x 50／915、橫桿 y 150；吊夾在柄的 x（杯中心 +30）。
     燃燒匙：杯口 y 258（休息）／300（加熱，下移 42 px）；柄長 165（柄頂 93／135，一直在吊夾上方）；杯寬 52、杯深約 16。
       名牌 pill 跟著匙走，在杯口上方 55 px（休息時 y 203）。
       x 位置：第 1 步 610／730／850（砂糖／麵粉／食鹽）；加熱位置 480；放好的位置 砂糖 230、麵粉 355；最後並排 230／480／730。
     酒精燈 (480,452) 縮放 1.3（燈芯頂 ≈ y 371）；火焰自 y 374 往上高 91 px、半寬 22（焰尖 ≈ y 283，加熱時杯底 ≈ y 316 在外焰上段）。
       燈帽蓋著時帽口 y = 452 − 44×1.3 ≈ 395。
     護目鏡：標題 pill 右緣 +62（約 x 610～630）、y 62，縮放 0.9；「戴上護目鏡」pill 左對齊在護目鏡右緣 +14。
     「外焰：溫度最高」pill 右對齊 x 418、y 318，箭頭 422 → 462。
     右側變化表：色塊 x 566（半徑 11）、文字左對齊 x 586、行 y 312／352／392／432（22px），最新一行黃、之前的灰白。
     第 4 步印章：(230,335)／(480,335)／(730,335)，字級 26＋22。
   字級：標題 24、字卡 24、名牌／標籤／變化表 22、印章 26／22。
   示意：粉末變色的過程與顏色、液體冒泡、鹽粒跳動的高度與次數、燈帽、火焰形狀都是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.dspoon) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 452, BAR_Y = 150, POST_L = 50, POST_R = 915;
  const SS = 1.7, R0 = 245, R1 = 290, ROD = 155, OFF = 30 * SS;   /* 匙縮放、杯口 y（休息／加熱）、柄長、柄位移 */
  const LX = 480, LS = 1.3, FH = 91, FW = 22;              /* 酒精燈、火焰 */
  const FLAME_Y = GY - 60 * LS, CAP_Y = GY - 44 * LS;
  const ROW_X = 566, ROW_Y = [312, 352, 392, 432];          /* 右側變化表 */
  const CMP_X = [230, 480, 730], CMP_Y = 335;               /* 第 4 步並排、印章 */

  /* ── 顏色（hex 互相內插，可連續串） ── */
  const POWDER = '#f4f2ec', LIQ = '#d6ecf2', YELLOW = '#e9c75a', BROWN = '#8b5a2b', BLACK = '#26201c';
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const cl = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))).toString(16).padStart(2, '0')).join(''); };
  /* 描邊：亮色往深色描、深色（變黑後）往淺色描，黑色焦炭在深色杯裡也看得見 */
  const edgeOf = col => { const v = hx(col).reduce((p, q) => p + q, 0) / 3; return v < 90 ? '#6f665d' : cl(col, '#0b1a15', 0.45); };

  /* ═══════════ 時間函式（純函式） ═══════════ */
  /* 三支匙：x、杯口 y、出場透明度、名牌透明度 */
  const SP = [
    { key: 'sugar', name: () => L('砂糖', 'Sugar'), seed: 3,
      x: s => 590 + (480 - 590) * grow(s, 2, 0.6, 1.6) + (230 - 480) * grow(s, 3, 0.4, 1.4),
      dip: s => grow(s, 2, 1.6, 2.2) - grow(s, 2, 7.6, 8.2), t0: 6.0 },
    { key: 'flour', name: () => L('麵粉', 'Flour'), seed: 7,
      x: s => 710 + (480 - 710) * grow(s, 3, 1.2, 2.2) + (355 - 480) * grow(s, 4, 0.4, 1.4) + (480 - 355) * grow(s, 4, 7.2, 8.4),
      dip: s => grow(s, 3, 2.2, 2.8) - grow(s, 3, 7.0, 7.6), t0: 6.4 },
    { key: 'salt', name: () => L('食鹽', 'Salt'), seed: 11,
      x: s => 830 + (480 - 830) * grow(s, 4, 1.2, 2.2) + (730 - 480) * grow(s, 4, 7.2, 8.4),
      dip: s => grow(s, 4, 2.2, 2.8) - grow(s, 4, 6.0, 6.6), t0: 6.8 }
  ];
  /* 火焰大小 0..1：第 1 步 u 3.9 點燃，第 4 步 u 6.9 熄滅 */
  const flameK = s => grow(s, 1, 3.9, 4.4) - grow(s, 4, 6.9, 7.3);
  /* 內容物狀態 */
  function content(d, s) {
    if (d.key === 'sugar') {
      const m = grow(s, 2, 2.4, 4.0), b = grow(s, 2, 4.0, 5.6), k = grow(s, 2, 5.6, 7.0);
      return { col: cl(cl(cl(POWDER, LIQ, m), BROWN, b), BLACK, k), melt: m, clear: m * (1 - b), load: 1 - 0.15 * m,
        bubble: grow(s, 2, 4.2, 5.0) - grow(s, 2, 7.6, 8.2), smoke: grow(s, 2, 4.6, 5.4) - grow(s, 2, 8.2, 9.2) };
    }
    if (d.key === 'flour') {
      const y = grow(s, 3, 2.8, 4.0), b = grow(s, 3, 4.0, 5.2), k = grow(s, 3, 5.2, 6.6);
      return { col: cl(cl(cl(POWDER, YELLOW, y), BROWN, b), BLACK, k), melt: 0.25 * k, clear: 0, load: 1 - 0.2 * k,
        bubble: 0, smoke: grow(s, 3, 4.6, 5.2) - grow(s, 3, 7.6, 9.0) };
    }
    return { col: POWDER, melt: 0, clear: 0, load: 1, bubble: 0, smoke: 0, crackle: grow(s, 4, 2.8, 3.2) - grow(s, 4, 5.8, 6.0) };
  }

  /* ═══════════ 背景器材 ═══════════ */
  function bench(c, s) {
    const a = fin(s, 1, 0.3, 0.6); if (a <= 0.02) return;
    M3.ground(c, GY, { a });
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 6, a });
  }
  /* 鐵架：兩根直桿＋橫桿（燃燒匙的吊夾掛在橫桿上） */
  function rack(c, s) {
    const a = fin(s, 1, 0.5, 0.6); if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.lineCap = 'round';
      [POST_L, POST_R].forEach(x => {
        const bg = c.createLinearGradient(0, GY - 12, 0, GY); bg.addColorStop(0, '#6d7a82'); bg.addColorStop(1, '#3d474d');
        c.fillStyle = bg; W5.rr(c, x - 34, GY - 12, 68, 12, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
        const rg = c.createLinearGradient(x - 4, 0, x + 4, 0); rg.addColorStop(0, '#dfe6ea'); rg.addColorStop(1, '#7d8a92');
        c.fillStyle = rg; c.fillRect(x - 4, BAR_Y - 14, 8, GY - 12 - BAR_Y + 14); c.strokeRect(x - 4, BAR_Y - 14, 8, GY - 12 - BAR_Y + 14);
      });
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(POST_L, BAR_Y); c.lineTo(POST_R, BAR_Y); c.stroke();
      c.strokeStyle = '#a9b6bd'; c.lineWidth = 5; c.beginPath(); c.moveTo(POST_L, BAR_Y); c.lineTo(POST_R, BAR_Y); c.stroke();
      c.fillStyle = '#4a555c'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
      [POST_L, POST_R].forEach(x => { c.fillRect(x - 9, BAR_Y - 9, 18, 18); c.strokeRect(x - 9, BAR_Y - 9, 18, 18); });
      c.restore();
    });
  }
  /* 吊夾（柄從中間穿過去） */
  function hanger(c, x, a) {
    withA(c, a, () => {
      c.save(); c.fillStyle = '#4a555c'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
      W5.rr(c, x - 8, BAR_Y - 12, 16, 24, 3); c.fill(); c.stroke();
      c.fillStyle = '#8f9ca3'; c.beginPath(); c.arc(x + 10, BAR_Y - 4, 3.5, 0, TAU); c.fill(); c.stroke();
      c.restore();
    });
  }

  /* ═══════════ 酒精燈、燈帽、火柴 ═══════════ */
  function lamp(c, s) {
    const u = s.u, t = s.t;
    /* 第 4 步 u 7.4～8.0 蓋好燈帽的酒精燈收走（淡出），讓出並排比較的位置 */
    const la = fin(s, 1, 1.8, 0.6) * fout(s, 4, 7.4, 0.6); if (la <= 0.02) return;
    const rise = s.n === 1 ? 24 * (1 - ease(clamp01((u - 1.8) / 0.6))) : 0;
    O1.lamp(c, LX, GY + rise, { s: LS, on: false, a: la });
    const fk = flameK(s);
    if (fk > 0.02) O1.flame(c, LX, FLAME_Y, FH * fk, t, { w: FW * Math.max(0.4, fk) });
    /* 點燃那一下的火花 */
    if (s.n === 1 && u > 3.8 && u < 4.4) {
      const k = (u - 3.8) / 0.6;
      W5.glow(c, LX, FLAME_Y - 8, 46 * (1 - 0.4 * k), YEL, 0.8 * (1 - k));
    }
    /* 燈帽：第 1 步 u 2.4～2.9 拿開；第 4 步 u 6.4～7.0 蓋回 */
    let ca = 0, cx = LX, cy = CAP_Y;
    if (s.n === 1) { const k = ease(clamp01((u - 2.4) / 0.5)); ca = la * (1 - k); cy = CAP_Y + rise - 70 * k; cx = LX + 30 * k; }
    if (s.n === 4) { const k = ease(clamp01((u - 6.4) / 0.6)); ca = clamp01((u - 6.4) / 0.2) * la; cy = CAP_Y - 70 * (1 - k); cx = LX + 30 * (1 - k); }
    O1.lampCap(c, cx, cy, LS, { a: ca });
  }
  function match(c, s) {
    if (s.n !== 1) return;
    const u = s.u;
    const a = clamp01((u - 2.6) / 0.2) * (1 - clamp01((u - 4.8) / 0.4)); if (a <= 0.02) return;
    const go = ease(clamp01((u - 2.9) / 0.9)), back = ease(clamp01((u - 4.3) / 0.7));
    const hx0 = 640, hy0 = 330, hx1 = LX + 12, hy1 = FLAME_Y - 6;
    const x = lerp(lerp(hx0, hx1, go), hx0 + 20, back), y = lerp(lerp(hy0, hy1, go), hy0 - 10, back);
    const lit = clamp01((u - 2.6) / 0.25) * (1 - clamp01((u - 4.5) / 0.3));
    /* 劃火柴的火花 */
    if (u > 2.6 && u < 3.0) W5.glow(c, hx0, hy0, 30, YEL, 0.7 * (1 - (u - 2.6) / 0.4));
    O1.match(c, x, y, 0.45, { a, lit, burnt: clamp01((u - 4.5) / 0.3), t: s.t });
  }
  /* 外焰標籤＋箭頭（第 1 步 u 5.2 出現，第 2 步開頭淡出） */
  function outerLabel(c, s) {
    const a = s.n === 1 ? fin(s, 1, 5.2, 0.5) : s.n === 2 ? fout(s, 2, 0, 0.4) : 0; if (a <= 0.02) return;
    const g = s.n === 1 ? ease(clamp01((s.u - 5.2) / 0.5)) : 1;
    withA(c, a, () => {
      W5.arrow(c, 422, 318, lerp(422, 462, g), 318, 'rgba(11,26,21,0.85)', 8, 18);
      W5.arrow(c, 422, 318, lerp(422, 462, g), 318, YEL, 4, 14);
    });
    P(c, a, L('外焰：溫度最高', 'Outer flame: hottest'), 418, 318, YEL, 22, 'right');
  }

  /* ═══════════ 燃燒匙 ═══════════ */
  function spoons(c, s) {
    const t = s.t, u = s.u;
    const geo = [];
    SP.forEach((d, j) => {
      const a = fin(s, 1, d.t0, 0.5); if (a <= 0.02) { geo.push(null); return; }
      const drop = s.n === 1 ? -40 * (1 - ease(clamp01((u - d.t0) / 0.5))) : 0;
      const x = d.x(s), dip = d.dip(s), y = lerp(R0, R1, ease(clamp01(dip))) + drop, st = content(d, s);
      const heat = clamp01(dip) * flameK(s) * (Math.abs(x - LX) < 4 ? 1 : 0);
      /* 食鹽劈啪：整堆輕輕抖 */
      const jit = st.crackle > 0 ? (hash(Math.floor(u * 14) + j) - 0.5) * 2 * st.crackle : 0;
      hanger(c, x + OFF, a);
      if (heat > 0.02) W5.glow(c, x, y + 18, 70, '#ff9a40', 0.25 * heat);   /* 火光畫在匙的後面，不染到內容物 */
      const g = O1.dspoon(c, { s: SS, x: x + jit, y, top: y - ROD, off: OFF - jit, a, load: st.load, col: st.col, edge: edgeOf(st.col),
        melt: st.melt, clear: st.clear, heat, bubble: st.bubble, t, seed: d.seed });
      geo.push({ x, y, a, st, surf: g.surf });
    });
    return geo;
  }
  /* 煙（畫在名牌下面） */
  function smokes(c, s, geo) {
    geo.forEach((g, j) => {
      if (!g || g.st.smoke <= 0.02) return;
      O1.smoke(c, g.x, g.surf - 2, s.t, { n: 22, h: 140, a: 1.6 * g.st.smoke, spread: 44, r: 13, speed: 0.4, col: '#e4e8e6', seed: 5 + j * 3, drift: 0.05 });
    });
  }
  /* 鹽粒跳動（確定性）：每顆有自己的週期；週期前 70% 在空中（往左右彈出再落回杯裡），跳起那一下一圈小火花 */
  function crackle(c, s, g) {
    if (!g || !(g.st.crackle > 0.02)) return;
    const u = s.u, k = g.st.crackle;
    c.save();
    for (let i = 0; i < 9; i++) {
      const per = 0.45 + 0.5 * hash(i + 31), ph = hash(i + 57), f = ((u + ph * per) / per) % 1;
      const bx = g.x + (hash(i + 3) - 0.5) * 40, H = (16 + 16 * hash(i + 77)) * k, dx = (i % 2 ? 1 : -1) * (30 + 30 * hash(i + 91)) * k;
      if (f < 0.7) {
        const ff = f / 0.7, px = bx + dx * Math.sin(ff * Math.PI), py = g.surf - 1 - H * 4 * ff * (1 - ff);
        c.save(); c.translate(px, py); c.rotate(ff * 5 + i);
        c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 1.5; c.fillRect(-4.5, -4.5, 9, 9); c.strokeRect(-4.5, -4.5, 9, 9);
        c.restore();
        if (ff < 0.22) {                              /* 跳起那一下的「啪」：小白光線 */
          const q = ff / 0.22;
          withA(c, (1 - q) * k, () => {
            c.save(); c.strokeStyle = '#fff4c0'; c.lineWidth = 2.4; c.lineCap = 'round';
            for (let r = 0; r < 5; r++) { const th = r / 5 * TAU + i, r0 = 6 + 6 * q, r1 = 12 + 12 * q; c.beginPath(); c.moveTo(bx + Math.cos(th) * r0, g.surf - 2 + Math.sin(th) * r0); c.lineTo(bx + Math.cos(th) * r1, g.surf - 2 + Math.sin(th) * r1); c.stroke(); }
            c.restore();
          });
        }
      }
    }
    c.restore();
  }
  /* 名牌（跟著匙走） */
  function nameTags(c, s, geo) {
    SP.forEach((d, j) => {
      const g = geo[j]; if (!g) return;
      P(c, g.a * fin(s, 1, d.t0 + 0.3, 0.4), d.name(), g.x, g.y - 60, WHITE, 22);
    });
  }

  /* ═══════════ 護目鏡 ═══════════ */
  function goggles(c, s, titleStr) {
    const a = fin(s, 1, 1.0, 0.2); if (a <= 0.02) return;
    c.save(); c.font = W5.font(24); const tw = c.measureText(titleStr).width + 28; c.restore();
    const gx = 480 + tw / 2 + 62, k = s.n === 1 ? ease(clamp01((s.u - 1.0) / 0.4)) : 1;
    O1.goggles(c, gx, M3.KEY_Y, { a, s: 0.9 * lerp(1.8, 1, k) });
    P(c, fin(s, 1, 1.4, 0.4), L('戴上護目鏡', 'Goggles on'), gx + 45 + 14, M3.KEY_Y, GREEN, 22, 'left');
  }

  /* ═══════════ 右側變化表 ═══════════ */
  const ROWS = {
    2: [{ t: 3.0, sw: LIQ, txt: () => L('熔化成液體', 'Melts into a liquid') },
        { t: 4.8, sw: BROWN, txt: () => L('褐色、冒煙', 'Turns brown, smokes') },
        { t: 6.6, sw: BLACK, txt: () => L('變黑', 'Turns black') }],
    3: [{ t: 2.4, sw: POWDER, txt: () => L('白色', 'White') },
        { t: 3.6, sw: YELLOW, txt: () => L('黃色', 'Yellow') },
        { t: 4.8, sw: BROWN, txt: () => L('褐色、冒煙', 'Brown, smokes') },
        { t: 6.2, sw: BLACK, txt: () => L('變黑', 'Turns black') }],
    4: [{ t: 3.2, sw: POWDER, txt: () => L('劈啪跳動', 'Crackles and jumps') },
        { t: 4.4, sw: POWDER, txt: () => L('一直是白色', 'Stays white') },
        { t: 5.4, sw: POWDER, txt: () => L('不冒煙、不變色', 'No smoke or color change') }]
  };
  function rowsFor(c, s, n, a) {
    const R = ROWS[n]; if (!R || a <= 0.02) return;
    const u = s.n === n ? s.u : 99;
    let last = -1; R.forEach((r, i) => { if (u >= r.t) last = i; });
    R.forEach((r, i) => {
      const ra = a * clamp01((u - r.t) / 0.4); if (ra <= 0.02) return;
      const y = ROW_Y[i], dx = 16 * (1 - ease(clamp01((u - r.t) / 0.4)));
      withA(c, ra, () => {
        c.save(); c.fillStyle = r.sw; c.strokeStyle = i === last ? YEL : 'rgba(246,243,234,0.7)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(ROW_X + dx, y, 11, 0, TAU); c.fill(); c.stroke(); c.restore();
        if (i > 0) { c.save(); c.strokeStyle = 'rgba(163,184,176,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ROW_X, ROW_Y[i - 1] + 14); c.lineTo(ROW_X, y - 14); c.stroke(); c.restore(); }
      });
      T(c, ra, r.txt(), ROW_X + 20 + dx, y, i === last ? YEL : DIM, 22, 'left');
    });
  }
  function rows(c, s) {
    if (s.n === 2) rowsFor(c, s, 2, 1);
    if (s.n === 3) { rowsFor(c, s, 2, fout(s, 3, 0, 0.4)); rowsFor(c, s, 3, 1); }
    if (s.n === 4) { rowsFor(c, s, 3, fout(s, 4, 0, 0.4)); rowsFor(c, s, 4, fout(s, 4, 7.0, 0.4)); }
  }

  /* ═══════════ 第 4 步：並排比一比 ═══════════ */
  function compare(c, s) {
    if (s.n !== 4) return;
    const u = s.u;
    const ST = [
      { lines: [L('有機物', 'Organic'), L('（含碳）', '(has carbon)')], col: GREEN, t: 8.6 },
      { lines: [L('有機物', 'Organic'), L('（含碳）', '(has carbon)')], col: GREEN, t: 9.0 },
      { lines: [L('不含碳', 'No carbon')], col: WHITE, t: 9.4 }
    ];
    ST.forEach((d, j) => {
      O1.stamp(c, d.lines, CMP_X[j], CMP_Y, { col: d.col, sizes: d.lines.length > 1 ? [26, 22] : [26], rot: -0.07, slam: clamp01((u - d.t) / 0.3), a: u > d.t ? 1 : 0, padY: 10 });
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('準備加熱', 'Get ready'),
    () => L('加熱砂糖', 'Heat sugar'),
    () => L('加熱麵粉', 'Heat flour'),
    () => L('加熱食鹽', 'Heat salt')
  ];
  function texts(c, s) {
    const n = s.n, ts = TITLES[n - 1]();
    P(c, fin(s, n, 0.2, 0.5), ts, 480, M3.KEY_Y, WHITE, 24);
    goggles(c, s, ts);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('戴上護目鏡、點燃酒精燈；三支燃燒匙裝砂糖、麵粉、食鹽', 'Goggles on, lamp lit; three spoons hold sugar, flour and salt'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('砂糖：熔化成液體 → 褐色、冒煙 → 變黑', 'Sugar: melts into a liquid → brown, smokes → black'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.0, 0.6) * fout(s, 4, 0, 0.4), L('麵粉：白 → 黃 → 褐、冒煙 → 變黑', 'Flour: white → yellow → brown, smokes → black'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.6, 0.6), L('食鹽：劈啪跳動，一直是白色；變黑的是含碳的有機物', 'Salt crackles but stays white; what turns black is organic (has carbon)'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c, s);
    rack(c, s);
    lamp(c, s);
    match(c, s);
    const geo = spoons(c, s);
    smokes(c, s, geo);
    crackle(c, s, geo[2]);
    nameTags(c, s, geo);
    outerLabel(c, s);
    rows(c, s);
    compare(c, s);
    texts(c, s);
  }

  W5.register('char', { canvas: 'cvs-char', steps: DUR, draw });
})();
