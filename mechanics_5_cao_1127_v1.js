/* ==================================================================
   mechanics_5 ｜ 曹沖稱象：用水線換成重量（cvs-cao，960×540）
   四步：1 大象上船 → 2 標記水線 → 3 換成石頭 → 4 秤石頭
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.caption／march／marchHand／eqRow／flash、M4.L／T／P／withA／fin／fout／grow、M5.img／platScale（crown 新增）。
   素材：assets/mechanics_5/cao_chong_river.jpg（1600×900 背景，取 x 240～1600、y 40～760 畫到 y 32～540，裁掉原圖左下角的碼頭；加一層深色讓字清楚）、
        cao_chong_boat.webp（1400×600，取 x 14～1383、y 120～500）、cao_chong_elephant.webp（取 x 0～683、y 7～480）、
        cao_chong_stones.webp（取 x 26～338、y 28～222）；曹沖用 March（touch_ready，手往前伸拿長柄紅筆）。
        圖還沒載入完時改畫程式版（船身、大象、石籃都有簡化畫法），不畫空框。

   數字（照簡報）：每籃石頭 500 kgw，剛好 6 籃對上水線；大象 ＝ 6 × 500 ＝ 3000 kgw；空船重量不標數字（W船）。
   物理：同一艘船、同一條水線（紅色記號畫在船身上，跟著船一起動）。船下沉量 ∝ 船上的載重（船身近似直壁）：
     下沉量 ＝ 24 px × 載重 ÷ 3000 kgw（大象全上船 ＝ 24 px，每籃石頭 4 px）→ 6 籃剛好 24 px，水面貼齊紅色記號。
     大象走上／走下跳板時，載重 ＝ 3000 × 大象跨上船的比例（身體中線 x 205 → 395 由 0 到 1），吃水連續變化。
     卸石頭（第 4 步）時船跟著浮起，記號又高出水面。
   比例尺：船圖縮放 0.4529（船寬 620 px）；空船水線在船圖 y 472、載滿（大象或 6 籃）水線在船圖 y 419（＝紅色記號的位置）。
     大象、石籃、磅秤：示意，不依比例。
   第 1 步（11 s）：河岸碼頭，大象 u 1.0～7.0 由碼頭 x 120 走到船中央 x 600；船逐漸下沉 24 px；船身上的水線（青色亮線＋「水線」）
     跟著在船身上升高；字卡 u 7.6。
   第 2 步（11 s）：曹沖（March）u 0.3 出現在碼頭邊，u 1.0～3.0 用長柄紅筆沿水面在船身畫紅線；「記號」u 3.0；u 3.4 曹沖退開；
     大象 u 4.0～8.6 轉身走下船回到碼頭，船浮起，記號高出水面 24 px（標「記號高出水面」）；字卡 u 8.8。
   第 3 步（12 s）：大象往左走出畫面（u 0～1.6）；6 籃石頭在碼頭堆好（u 0.6）；u 1.2 起每 1.15 s 搬一籃上船（飛 0.9 s），
     落下時船沉 4 px，每籃上方「500 kgw」（兩排交錯）；最後一籃 u 7.85 落下，u 8.3 水面貼齊紅色記號，「對齊」光圈 u 8.3；字卡 u 9.2。
   第 4 步（12 s）：u 0.4 起每 0.8 s 卸一籃到碼頭上的磅秤（飛 0.7 s），磅秤顯示 500、1000、…、3000 kgw；船跟著浮起；
     右上推理面板 u 5.4 起：同一條水線 → 排開相同重量的水 → 浮力相同 → 總重相同（u 5.6～7.4）；
     「船＋大象 ＝ 船＋石頭」u 7.8；「大象 ＝ 石頭 ＝ 6 × 500 ＝ 3000 kgw」u 8.6；字卡 u 9.6。
   版面：水面 SW 420（近景水面 y 420～540）；碼頭 x 0～290、頂面 y 372；跳板 (285,372)～(372,甲板)；
     船圖左上 (300, 260.6＋下沉量)、寬 620、高 172；甲板站立線 ＝ 360.2＋下沉量；石籃甲板位置中線 x 440＋64i（i＝0～5）；
     碼頭石堆：石籃上下兩排（底 372／333.4）；磅秤：中線 150、底 372、平台頂 336、石籃上下兩排（底 336／297.4）；石籃中線 x 82、150、218；
     推理面板 x 330～940、y 88～292。步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.platScale) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, RED = COL.red, TEAL = COL.teal, WE = M4.PC.waterEdge;
  const DUR = [11, 11, 12, 12];                         /* 總長 46 秒 */
  const SRC = {
    river: 'assets/mechanics_5/cao_chong_river.jpg', boat: 'assets/mechanics_5/cao_chong_boat.webp',
    ele: 'assets/mechanics_5/cao_chong_elephant.webp', stones: 'assets/mechanics_5/cao_chong_stones.webp'
  };
  Object.keys(SRC).forEach(k => M5.img(SRC[k]));        /* 預載 */
  M3.preload(['touch_ready']);

  /* ── 版面 ── */
  const SW = 420, DOCK_Y = 372, DOCK_X1 = 290;
  const BOAT = { sx: 14, sy: 120, sw: 1369, sh: 380, x0: 300, w: 620 }, BS = BOAT.w / BOAT.sw;      /* 船圖縮放 0.4529 */
  const YTOP0 = SW - (472 - BOAT.sy) * BS;              /* 空船時船圖頂端 y（空船水線＝船圖 y 472） */
  const DELTA = 24;                                     /* 3000 kgw 的下沉量（px） */
  const DECK0 = YTOP0 + (340 - BOAT.sy) * BS;           /* 甲板站立線（空船） */
  const MARK_ROW = 472 - DELTA / BS;                    /* 紅色記號在船圖上的列（≈ 419） */
  /* 船身左右緣（船圖 y 300～495，每 5 列；alpha > 128 的範圍） */
  const HULL = [[37,1338],[38,1336],[38,1334],[39,1332],[39,1330],[40,1328],[41,1326],[41,1323],[42,1321],[42,1318],[43,1316],[45,1313],[60,1310],[62,1308],[65,1305],[67,1302],[70,1299],[73,1296],[77,1294],[81,1291],[85,1288],[90,1284],[94,1282],[99,1278],[104,1275],[110,1271],[116,1268],[122,1265],[129,1261],[136,1258],[144,1254],[153,1250],[164,1246],[178,1242],[197,1238],[229,1233],[268,1229],[335,1220]];
  function hullAt(row) {                                /* 船圖某列的左右緣（船圖 x） */
    const f = clamp01((row - 300) / 5 / (HULL.length - 1)) * (HULL.length - 1), i = Math.min(HULL.length - 2, Math.floor(f)), q = f - i;
    return [lerp(HULL[i][0], HULL[i + 1][0], q), lerp(HULL[i][1], HULL[i + 1][1], q)];
  }
  const bx = ix => BOAT.x0 + (ix - BOAT.sx) * BS;       /* 船圖 x → 畫布 x */
  const by = (iy, sink) => YTOP0 + sink + (iy - BOAT.sy) * BS;
  const EW = 200, EH = EW * 473 / 683;                  /* 大象 */
  const KW = 62, KH = KW * 194 / 312;                   /* 石籃 */
  const DECK_X = i => 440 + 64 * i;
  const STACK = (j, base) => [82, 150, 218][j % 3] !== undefined ? [[82, 150, 218][j % 3], j < 3 ? base : base - KH + 2] : null;   /* 碼頭（base 372）／磅秤（base 336）上的石籃：中線 x、底面 y */

  /* ── 時間函式（純函式） ── */
  function elephant(s) {                                /* { x 中線, dir, on 在畫面上 } */
    if (s.n === 1) return { x: lerp(120, 600, ease(clamp01((s.u - 1.0) / 6.0))), dir: 1, walk: s.u > 1.0 && s.u < 7.0 };
    if (s.n === 2) return { x: lerp(600, 120, ease(clamp01((s.u - 4.0) / 4.6))), dir: s.u < 3.7 ? 1 : -1, walk: s.u > 4.0 && s.u < 8.6 };
    if (s.n === 3) return { x: lerp(120, -150, clamp01(s.u / 1.6)), dir: -1, walk: s.u < 1.6 };
    return null;
  }
  const eleF = x => clamp01((x - 205) / 190);            /* 大象跨上船的比例 */
  const landT = i => 1.2 + 1.15 * i;                    /* 第 3 步：第 i 籃起飛時間（飛 0.9 s） */
  const offT = j => 0.4 + 0.8 * j;                      /* 第 4 步：第 j 次卸籃起飛時間（飛 0.7 s） */
  function stonesOn(s) {                                /* 船上石頭的「籃數」（連續） */
    if (s.n === 3) { let k = 0; for (let i = 0; i < 6; i++) k += ease(clamp01((s.u - landT(i) - 0.9) / 0.4)); return k; }
    if (s.n === 4) { let k = 6; for (let j = 0; j < 6; j++) k -= ease(clamp01((s.u - offT(j) - 0.7) / 0.4)); return k; }
    return 0;
  }
  function sinkOf(s) {
    const e = elephant(s), load = (e ? 3000 * eleF(e.x) : 0) + 500 * stonesOn(s);
    return DELTA * load / 3000;
  }
  const deckY = sink => DECK0 + sink;

  /* ═══════════ 背景、碼頭、水 ═══════════ */
  function scenery(c) {
    const im = M5.img(SRC.river);
    if (im) c.drawImage(im, 240, 40, 1360, 720, 0, 32, 960, 508);   /* 裁掉原圖左下角的碼頭，只畫在 y ≥ 32 */
    else {
      const g = c.createLinearGradient(0, 32, 0, SW); g.addColorStop(0, '#f3d9a4'); g.addColorStop(0.55, '#a9c7c9'); g.addColorStop(1, '#5d8fa0');
      c.fillStyle = g; c.fillRect(0, 32, 960, 508);
    }
    c.fillStyle = 'rgba(13,32,26,0.34)'; c.fillRect(0, 32, 960, 508);
  }
  function dock(c) {
    c.save();
    const g = c.createLinearGradient(0, DOCK_Y, 0, DOCK_Y + 16); g.addColorStop(0, '#b98552'); g.addColorStop(1, '#6e4726');
    c.fillStyle = '#5a3a1f';
    [30, 130, 230].forEach(x => c.fillRect(x - 7, DOCK_Y + 10, 14, 540 - DOCK_Y));
    c.fillStyle = g; c.fillRect(0, DOCK_Y, DOCK_X1, 16);
    c.strokeStyle = 'rgba(40,22,10,0.8)'; c.lineWidth = 1.5; c.strokeRect(-2, DOCK_Y, DOCK_X1 + 2, 16);
    c.strokeStyle = 'rgba(40,22,10,0.45)'; c.lineWidth = 1;
    for (let x = 36; x < DOCK_X1; x += 48) { c.beginPath(); c.moveTo(x, DOCK_Y + 1); c.lineTo(x, DOCK_Y + 15); c.stroke(); }
    c.restore();
  }
  function waterFront(c, t) {
    c.save();
    const g = c.createLinearGradient(0, SW, 0, 540); g.addColorStop(0, 'rgba(47,143,216,0.50)'); g.addColorStop(1, 'rgba(16,60,110,0.86)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 540);
    const yS = x => SW + 1.2 * Math.sin(x * 0.03 + t * 2.2);
    for (let x = 0; x <= 960; x += 8) c.lineTo(x, yS(x));
    c.lineTo(960, 540); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(160,220,255,0.75)'; c.lineWidth = 2.2; c.beginPath();
    for (let x = 0; x <= 960; x += 8) (x ? c.lineTo(x, yS(x)) : c.moveTo(x, yS(x))); c.stroke();
    /* 流動的波光 */
    c.strokeStyle = 'rgba(200,235,255,0.35)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = SW + 18 + (i % 7) * 16, x = ((W5.hash(i * 3.1) * 960 + t * (18 + 10 * W5.hash(i))) % 1040) - 40, w = 26 + 30 * W5.hash(i * 7.7);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 船、大象、石籃 ═══════════ */
  function boat(c, sink) {
    const im = M5.img(SRC.boat), y0 = YTOP0 + sink;
    if (im) { c.drawImage(im, BOAT.sx, BOAT.sy, BOAT.sw, BOAT.sh, BOAT.x0, y0, BOAT.w, BOAT.sh * BS); return; }
    /* 程式版船身：用量好的船身左右緣畫輪廓 */
    c.save(); c.beginPath();
    for (let r = 300; r <= 490; r += 5) { const h = hullAt(r); c.lineTo(bx(h[0]), by(r, sink)); }
    for (let r = 490; r >= 300; r -= 5) { const h = hullAt(r); c.lineTo(bx(h[1]), by(r, sink)); }
    c.closePath(); const g = c.createLinearGradient(0, by(300, sink), 0, by(495, sink)); g.addColorStop(0, '#b37a45'); g.addColorStop(1, '#3d4a35');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(40,22,10,0.8)'; c.lineWidth = 2; c.stroke(); c.restore();
  }
  function drawElephant(c, x, footY, dir, t, walk) {
    const im = M5.img(SRC.ele), bob = walk ? Math.abs(Math.sin(t * 5)) * 3 : 0.8 * Math.sin(t * 1.5);
    const top = footY - EH - bob;
    c.save();
    c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse(x, footY + 2, EW * 0.38, 5, 0, 0, TAU); c.fill();
    c.translate(x, 0); c.scale(dir, 1);
    if (im) c.drawImage(im, 0, 7, 683, 473, -EW / 2, top, EW, EH);
    else {
      c.fillStyle = '#9b8a78';
      c.beginPath(); c.ellipse(-8, top + EH * 0.42, EW * 0.38, EH * 0.3, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(EW * 0.32, top + EH * 0.3, EW * 0.13, EH * 0.18, 0, 0, TAU); c.fill();
      [-0.3, -0.12, 0.08, 0.24].forEach(f => c.fillRect(EW * f - 9, top + EH * 0.55, 18, EH * 0.45));
    }
    c.restore();
  }
  function basket(c, x, bot, a) {
    withA(c, a, () => {
      const im = M5.img(SRC.stones);
      if (im) c.drawImage(im, 26, 28, 312, 194, x - KW / 2, bot - KH, KW, KH);
      else {
        c.fillStyle = '#8a9096'; c.beginPath(); c.ellipse(x, bot - KH * 0.7, KW * 0.42, KH * 0.3, 0, 0, TAU); c.fill();
        c.fillStyle = '#c08a4a'; W5.rr(c, x - KW / 2, bot - KH * 0.62, KW, KH * 0.62, 8); c.fill();
      }
    });
  }

  /* 石籃位置：{ x, bot, onBoat } 或 null */
  function basketPos(s, i, sink) {
    const arc = (p0, p1, q, h) => { const e = ease(q); return [lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e) - h * Math.sin(Math.PI * q)]; };
    const deck = () => [DECK_X(i), deckY(sink)];
    if (s.n === 3) {
      const q = clamp01((s.u - landT(i)) / 0.9), st = STACK(5 - i, DOCK_Y);   /* 先拿上排 */
      if (q <= 0) return { p: st, onBoat: false };
      if (q >= 1) return { p: deck(), onBoat: true };
      return { p: arc(st, deck(), q, 70), onBoat: false };
    }
    if (s.n === 4) {
      const j = 5 - i, q = clamp01((s.u - offT(j)) / 0.7), sl = STACK(j, 336);
      if (q <= 0) return { p: deck(), onBoat: true };
      if (q >= 1) return { p: sl, onBoat: false };
      return { p: arc(deck(), sl, q, 70), onBoat: false };
    }
    return null;
  }

  /* ═══════════ 水線（青）與紅色記號 ═══════════ */
  function waterline(c, s, sink) {
    const row = BOAT.sy + (SW - YTOP0 - sink) / BS, h = hullAt(row), a = 0.85;
    withA(c, a, () => {
      c.save(); c.strokeStyle = W5.rgba(TEAL, 0.95); c.lineWidth = 3; c.shadowColor = TEAL; c.shadowBlur = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx(h[0]) + 4, SW); c.lineTo(bx(h[1]) - 4, SW); c.stroke(); c.restore();
    });
    const la = s.n === 4 ? fout(s, 4, 5.0, 0.5) : fin(s, 1, 0.5, 0.5);
    P(c, la, L('水線', 'Waterline'), 940, SW + 30, TEAL, 22, 'right');
  }
  function mark(c, s, sink) {
    if (s.n < 2) return null;
    const h = hullAt(MARK_ROW), x0 = bx(h[0]) + 8, x1 = x0 + 150, y = by(MARK_ROW, sink);
    const g = s.n === 2 ? grow(s, 2, 1.0, 3.0) : 1;
    if (g <= 0.005) return { x0, x1, y, tip: [x0, y] };
    withA(c, 1, () => {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(60,10,10,0.8)'; c.lineWidth = 7; c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, g), y); c.stroke();
      c.strokeStyle = RED; c.lineWidth = 4.5; c.shadowColor = RED; c.shadowBlur = 6; c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, g), y); c.stroke();
      c.restore();
    });
    return { x0, x1, y, tip: [lerp(x0, x1, g), y] };
  }

  /* ═══════════ 推理面板（第 4 步） ═══════════ */
  function reasoning(c, s) {
    if (s.n !== 4) return;
    const a = fin(s, 4, 5.4, 0.5); if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.88)'; W5.rr(c, 330, 88, 610, 204, 16); c.fill();
      c.strokeStyle = W5.rgba(YEL, 0.6); c.lineWidth = 2; c.stroke(); c.restore();
    });
    const chain = [
      [L('同一條水線', 'Same waterline'), 5.6, TEAL],
      [L('排開相同重量的水', 'Same water weight displaced'), 6.2, WE],
      [L('浮力相同', 'Same buoyancy'), 6.8, COL.green],
      [L('總重相同', 'Same total weight'), 7.4, YEL]
    ];
    const rows = [[chain[0], chain[1]], [chain[2], chain[3]]];
    rows.forEach((r, ri) => {
      const y = 120 + ri * 46;
      const w0 = W5.tw(c, r[0][0], 22) + 28, w1 = W5.tw(c, r[1][0], 22) + 28, gap = 46;
      const lead = ri === 1 ? 46 : 0, tot = lead + w0 + gap + w1;
      let x = 635 - tot / 2;
      if (ri === 1) { const aa = fin(s, 4, r[0][1] - 0.2, 0.3); arrowR(c, x + 6, x + lead - 8, y, aa); x += lead; }
      P(c, fin(s, 4, r[0][1], 0.4), r[0][0], x + w0 / 2, y, r[0][2], 22);
      arrowR(c, x + w0 + 8, x + w0 + gap - 8, y, fin(s, 4, r[1][1] - 0.2, 0.3));
      P(c, fin(s, 4, r[1][1], 0.4), r[1][0], x + w0 + gap + w1 / 2, y, r[1][2], 22);
    });
    M3.eqRow(c, { x: 635, y: 218, size: 26, show: clamp01((s.u - 7.8) / 0.8) * 3, tokens: [
      { t: L('船 ＋ 大象', 'Boat + elephant'), col: WHITE }, { t: '＝', col: YEL }, { t: L('船 ＋ 石頭', 'Boat + stones'), col: WHITE }] });
    M3.eqRow(c, { x: 635, y: 264, size: 24, show: clamp01((s.u - 8.6) / 0.8) * 7, tokens: [
      { t: L('大象', 'Elephant'), col: WHITE }, { t: '＝', col: YEL }, { t: L('石頭', 'Stones'), col: WHITE }, { t: '＝', col: YEL },
      { t: '6 × 500', col: WHITE }, { t: '＝', col: YEL }, { t: '3000 kgw', col: YEL, pill: true }] });
  }
  function arrowR(c, x0, x1, y, a) {
    withA(c, a, () => { W5.arrow(c, x0, y, x1, y, 'rgba(11,26,21,0.85)', 6, 14); W5.arrow(c, x0, y, x1, y, WHITE, 3, 12); });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('大象上船', 'Elephant aboard'),
    () => L('標記水線', 'Mark the waterline'),
    () => L('換成石頭', 'Swap in stones'),
    () => L('秤石頭', 'Weigh the stones')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.6, 0.6) * fout(s, 2, 0, 0.4), L('大象上船，船往下沉', 'The elephant boards; the boat sinks lower'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.8, 0.6) * fout(s, 3, 0, 0.4), L('記下水線，大象下船', 'Mark the waterline, then the elephant gets off'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 9.2, 0.6) * fout(s, 4, 0, 0.4), L('放石頭，直到回到同一條水線', 'Add stones until the same waterline is reached'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.6, 0.6), L('同一條水線：大象 ＝ 石頭 ＝ 3000 kgw', 'Same waterline: elephant = stones = 3000 kgw'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const t = s.t, sink = sinkOf(s) + 0.8 * Math.sin(t * 1.3);   /* 船在水上微微起伏 */
    scenery(c);
    dock(c);
    /* 跳板（第 1、2 步） */
    const plankA = s.n <= 2 ? 1 : fout(s, 3, 1.6, 0.5);
    withA(c, plankA, () => {
      c.save(); c.strokeStyle = '#3d2814'; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(270, DOCK_Y + 2); c.lineTo(372, deckY(sink) + 2); c.stroke();
      c.strokeStyle = '#a8763d'; c.lineWidth = 6; c.stroke(); c.restore();
    });
    boat(c, sink);
    /* 石籃 */
    const bas = [];
    for (let i = 0; i < 6; i++) { const b = basketPos(s, i, sink); if (b) bas.push([i, b]); }
    const stackA = s.n === 3 ? fin(s, 3, 0.6, 0.5) : 1;
    bas.filter(([, b]) => b.onBoat).forEach(([i, b]) => basket(c, b.p[0], b.p[1], 1));
    /* 大象 */
    const e = elephant(s);
    if (e && e.x > -140) {
      const f = eleF(e.x), footY = lerp(DOCK_Y, deckY(sink), f);
      drawElephant(c, e.x, footY, e.dir, t, e.walk);
    }
    waterFront(c, t);
    waterline(c, s, sink);
    const mk = mark(c, s, sink);
    /* 對齊光圈（第 3 步最後） */
    if (mk && s.n === 3) {
      const ra = fin(s, 3, 8.3, 0.4), pulse = (s.u * 0.9) % 1;
      if (ra > 0.02) withA(c, ra, () => {
        c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.shadowColor = YEL; c.shadowBlur = 10;
        const mx = (mk.x0 + mk.x1) / 2;
        c.beginPath(); c.ellipse(mx, mk.y, 92, 22, 0, 0, TAU); c.stroke();
        c.globalAlpha *= 1 - pulse; c.beginPath(); c.ellipse(mx, mk.y, 92 + 30 * pulse, 22 + 10 * pulse, 0, 0, TAU); c.stroke();
        c.restore();
      });
      P(c, ra, L('對齊！', 'Lined up!'), (mk.x0 + mk.x1) / 2, mk.y - 46, YEL, 22);
    }
    /* 記號說明 */
    if (mk && s.n === 2) {
      P(c, fin(s, 2, 3.0, 0.4) * fout(s, 2, 4.0, 0.4), L('記號', 'Mark'), (mk.x0 + mk.x1) / 2, mk.y - 34, RED, 22);
      const ga = fin(s, 2, 8.2, 0.4);
      if (ga > 0.02) {
        withA(c, ga, () => { c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5; W5.arrow(c, mk.x1 + 18, SW - 2, mk.x1 + 18, mk.y + 3, YEL, 2.5, 9); c.restore(); });
        T(c, ga, L('記號高出水面', 'Mark is above the water'), mk.x1 + 30, (SW + mk.y) / 2 - 6, YEL, 22, 'left');
      }
    }
    /* 碼頭上的石籃（還沒搬／已經卸下）、飛行中的石籃 */
    if (s.n === 4) {
      const done = (() => { let k = 0; for (let j = 0; j < 6; j++) if (s.u >= offT(j) + 0.7) k++; return k; })();
      const glow = (() => { for (let j = 0; j < 6; j++) { const d = s.u - offT(j) - 0.7; if (d >= 0 && d < 0.6) return 1 - d / 0.6; } return 0; })();
      M5.platScale(c, { cx: 150, by: DOCK_Y, w: 236, text: (500 * done) + ' kgw', dispW: 126, glow });
      if (glow > 0.02) P(c, glow, '＋500', 150, 230, YEL, 22, 'center', true);
    }
    bas.filter(([, b]) => !b.onBoat).forEach(([i, b]) => basket(c, b.p[0], b.p[1], s.n === 3 ? stackA : 1));
    /* 每籃 500 kgw（第 3 步，兩排交錯） */
    if (s.n === 3) bas.forEach(([i, b]) => {
      if (!b.onBoat) return;
      const la = clamp01((s.u - landT(i) - 0.9) / 0.4);
      T(c, la, '500 kgw', b.p[0], b.p[1] - KH - (i % 2 ? 46 : 18), YEL, 22, 'center', true);
    });
    /* 曹沖（March）＋長柄紅筆 */
    const ma = s.n === 2 ? fin(s, 2, 0.3, 0.5) * fout(s, 2, 3.4, 0.4) : 0;
    if (ma > 0.02 && mk) {
      const mx = 232, box = M3.march(c, 'touch_ready', mx, DOCK_Y, { sc: 0.3, a: ma });
      const hd = M3.marchHand('touch_ready', mx, DOCK_Y, { sc: 0.3 });
      if (hd) withA(c, ma, () => {
        c.save(); c.lineCap = 'round';
        c.strokeStyle = '#3d2814'; c.lineWidth = 6; c.beginPath(); c.moveTo(hd.x - 6, hd.y - 4); c.lineTo(mk.tip[0], mk.tip[1] - 4); c.stroke();
        c.strokeStyle = '#a8763d'; c.lineWidth = 3.5; c.stroke();
        c.fillStyle = RED; c.beginPath(); c.arc(mk.tip[0], mk.tip[1] - 2, 5, 0, TAU); c.fill();
        c.restore();
      });
      T(c, ma, L('曹沖', 'Cao Chong'), mx, DOCK_Y - 160, WHITE, 22);
    }
    reasoning(c, s);
    texts(c, s);
  }

  W5.register('cao', { canvas: 'cvs-cao', steps: DUR, draw });
})();
