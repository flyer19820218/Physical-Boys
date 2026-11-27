/* ==================================================================
   mechanics_5 ｜ 大船入港：吃水加深（cvs-ship，960×540）
   四步：1 海水中航行 → 2 駛過交界 → 3 淡水河中 → 4 B ＝ W 不變
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／caption／arrowFx／eqRow、M4.L／T／P／withA／fin／fout／grow。

   數字（照簡報）：船重 W ＝ 1030 tf（公噸重）；海水 D ＝ 1.03、淡水 D ＝ 1.00。
     V排（海）＝ 1030 ÷ 1.03 ＝ 1000 m³；V排（淡）＝ 1030 ÷ 1.00 ＝ 1030 m³；多 30 m³。B ＝ W ＝ 1030 tf 不變。
   物理：船是浮體，B ＝ W 不變；B ＝ V排 × D液 → V排 ＝ W ÷ D。船身近似直壁 → 吃水 ∝ V排。
     河口混合區的密度隨位置線性變化（船中線 x 400 → 540：1.03 → 1.00），吃水跟著船底下的密度連續變化。
   比例尺：船、水深：示意。吃水：海水 42 px、淡水 62 px（真實只差 3％ ≈ 1.3 px，差異放大約 16 倍，畫面標「示意：吃水差異放大」）；
     中間的吃水 ＝ 42 ＋ 20 ×（1.03 ÷ D － 1）÷ 0.03。B、W 箭頭同長 70 px（＝ 1030 tf，兩支同比例）。
   第 1 步（11 s）：海上，船中線 x 215 → 265 慢慢往右航行；綠色虛線「海水吃水」u 1.0；水下船形淡色區塊「排開 1000 m³」u 2.4；
     W（粉，船內往下）u 3.8～4.4、B（青，水下往上頂船底）u 4.4～5.0，兩支同長；「海水 D ＝ 1.03」u 6.0；字卡 u 8.0。
   第 2 步（11 s）：船中線 265 → 400（u 0～2）→ 540（u 2～7，穿過河口約 5 秒）→ 640（u 7～9.5）→ 650（u 9.5～11）；
     水色由深藍漸變成淺藍，船身慢慢下沉 20 px（綠線沉到水面下）；船邊即時顯示「D ＝ 1.03 → 1.00」與排開體積 1000 → 1030 m³；字卡 u 3.0。
   第 3 步（11 s）：河中，船 650 → 664；黃色「淡水吃水」u 0.6；綠黃兩線間的尺寸標「吃水加深」u 1.6；「示意：吃水差異放大」u 2.2；
     「排開 1030 m³」持續；「淡水 D ＝ 1.00」u 3.6；字卡 u 7.0。
   第 4 步（12 s）：船停在 664～670；左上算式框 u 0.4：海水 V ＝ W ÷ D ＝ 1030 ÷ 1.03 ＝ 1000 m³（u 0.8～2.6）、
     淡水 V ＝ 1030 ÷ 1.00 ＝ 1030 m³（u 3.0～4.8）、B ＝ W ＝ 1030 tf 不變（u 5.4）、第 2 列尾端「多 30」u 6.4；字卡 u 7.6。
   版面：水面 WL 330（水一直畫到畫布底）；海 x ＜ 400、河口 400～540、河 ＞ 540；船長 274（船尾 x－130、船艏 x＋144），
     船底 K ＝ WL ＋ 吃水、甲板 ＝ K － 80；W 箭頭 x－40（K－75 → K－5）、B 箭頭 x＋60（K＋75 → K＋5）；排開體積字 (x－60, K＋46)；吃水線只畫在船身前半（x＋10～x＋150），標籤在船艏右邊。
     水中液體名 y 456；算式框 x 20～650、y 92～242；步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined') return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, GRN = COL.green;
  const FW = COL.pink, FB = COL.teal, GHOST = '#bfe6ff';
  const SEA = '#1b5a98', RIVER = '#5fb0dc', SEA_E = '#7fc4ff', RIVER_E = '#c4ecff';
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const WL = 330, X_SEA = 400, X_RIV = 540, ARW = 70;
  const DR_SEA = 42, DR_RIV = 62;

  /* ── 物理 ── */
  const dens = x => lerp(1.03, 1.00, clamp01((x - X_SEA) / (X_RIV - X_SEA)));
  const draft = D => DR_SEA + (DR_RIV - DR_SEA) * (1.03 / D - 1) / 0.03;
  const vol = D => 1030 / D;

  /* 船中線 x：分段（每步都連續） */
  function shipX(s) {
    const u = s.u;
    if (s.n === 1) return lerp(215, 265, u / 11);
    if (s.n === 2) {
      const K = [[0, 265], [2, 400], [7, 540], [9.5, 640], [11, 650]];
      for (let i = 1; i < K.length; i++) if (u <= K[i][0]) {
        const q = (u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
        return lerp(K[i - 1][1], K[i][1], q);
      }
      return 650;
    }
    if (s.n === 3) return lerp(650, 664, u / 11);
    return lerp(664, 670, ease(u / 12));
  }

  /* ═══════════ 水 ═══════════ */
  const waveY = (x, t) => WL + 1.6 * Math.sin(x * 0.045 + t * 2.4) + 0.9 * Math.sin(x * 0.11 - t * 3.3);
  function waterBody(c, t, front) {
    c.save();
    c.beginPath(); c.moveTo(0, 540);
    for (let x = 0; x <= 960; x += 6) c.lineTo(x, waveY(x, t));
    c.lineTo(960, 540); c.closePath();
    const g = c.createLinearGradient(0, 0, 960, 0);
    const al = front ? 0.5 : 0.92;
    g.addColorStop(0, W5.rgba(SEA, al)); g.addColorStop(X_SEA / 960, W5.rgba(SEA, al));
    g.addColorStop(X_RIV / 960, W5.rgba(RIVER, al)); g.addColorStop(1, W5.rgba(RIVER, al));
    c.fillStyle = g; c.fill();
    if (!front) {   /* 往下變深 */
      const v = c.createLinearGradient(0, WL, 0, 540); v.addColorStop(0, 'rgba(11,26,21,0)'); v.addColorStop(1, 'rgba(11,26,21,0.45)');
      c.fillStyle = v; c.fill();
    }
    c.restore();
  }
  function surfLine(c, t) {
    c.save(); c.lineWidth = 3; c.lineCap = 'round';
    const g = c.createLinearGradient(0, 0, 960, 0);
    g.addColorStop(0, SEA_E); g.addColorStop(X_SEA / 960, SEA_E); g.addColorStop(X_RIV / 960, RIVER_E); g.addColorStop(1, RIVER_E);
    c.strokeStyle = g; c.beginPath();
    for (let x = 0; x <= 960; x += 6) (x ? c.lineTo(x, waveY(x, t)) : c.moveTo(x, waveY(x, t)));
    c.stroke(); c.restore();
  }

  /* ═══════════ 船 ═══════════ */
  function hullPath(c, x, K) {
    c.beginPath();
    c.moveTo(x - 130, K - 80);
    c.lineTo(x + 144, K - 86);
    c.quadraticCurveTo(x + 128, K - 20, x + 100, K);
    c.lineTo(x - 116, K);
    c.quadraticCurveTo(x - 132, K - 4, x - 130, K - 30);
    c.closePath();
  }
  function ship(c, x, K, t) {
    const deck = K - 80;
    c.save(); c.lineJoin = 'round';
    /* 船橋（船尾）＋煙囪 */
    const bx0 = x - 122, bx1 = x - 66;
    c.fillStyle = '#e9eef0'; c.fillRect(bx0, deck - 58, bx1 - bx0, 58);
    c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; c.strokeRect(bx0, deck - 58, bx1 - bx0, 58);
    c.fillStyle = '#e9eef0'; c.fillRect(bx0 - 6, deck - 64, bx1 - bx0 + 12, 8); c.strokeRect(bx0 - 6, deck - 64, bx1 - bx0 + 12, 8);
    c.fillStyle = '#2c4a5a'; for (let i = 0; i < 4; i++) c.fillRect(bx0 + 6 + i * 12, deck - 52, 8, 7);
    c.fillStyle = '#c0533a'; c.fillRect(x - 108, deck - 88, 18, 24); c.fillStyle = '#2b2b2b'; c.fillRect(x - 108, deck - 92, 18, 6);
    /* 煙（確定性） */
    for (let i = 0; i < 4; i++) {
      const q = ((t * 0.35 + i * 0.25) % 1), r = 5 + 9 * q;
      c.fillStyle = W5.rgba('#c9d1d6', 0.45 * (1 - q));
      c.beginPath(); c.arc(x - 99 - 34 * q, deck - 98 - 26 * q, r, 0, TAU); c.fill();
    }
    /* 貨櫃：兩層 */
    const cols = ['#d9534f', '#3e8ed0', '#f0ad4e', '#4cae4c', '#9b59b6', '#e67e22', '#2a9d8f'];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) {
      if (r === 1 && (i === 0 || i === 6)) continue;
      const cx0 = x - 56 + i * 26, cy0 = deck - 22 * (r + 1);
      c.fillStyle = cols[(i * 3 + r * 2) % cols.length]; c.fillRect(cx0, cy0, 24, 20);
      c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 1.2; c.strokeRect(cx0, cy0, 24, 20);
    }
    /* 船身 */
    hullPath(c, x, K);
    const g = c.createLinearGradient(0, deck, 0, K);
    g.addColorStop(0, '#41606f'); g.addColorStop(0.55, '#2f4a58'); g.addColorStop(1, '#8a3a2e');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - 126, deck + 6); c.lineTo(x + 136, deck + 1); c.stroke();
    c.restore();
  }
  /* 船身上一條水平線（夾在船身內）＋右或左的標籤 */
  function hullLine(c, x, K, y, col, a, t, dash) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); hullPath(c, x, K); c.clip();
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 10, y); c.lineTo(x + 150, y); c.stroke();
      c.strokeStyle = col; c.lineWidth = 3.5; if (dash) { c.setLineDash([12, 7]); c.lineDashOffset = -t * 10; }
      c.beginPath(); c.moveTo(x + 10, y); c.lineTo(x + 150, y); c.stroke();
      c.restore();
    });
  }
  /* 水下船形（排開的水）：船身 ∩ y ≥ 水面 */
  function displaced(c, x, K, t, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); hullPath(c, x, K); c.clip();
      c.beginPath(); c.moveTo(x - 140, 540);
      for (let xx = x - 140; xx <= x + 150; xx += 6) c.lineTo(xx, waveY(xx, t));
      c.lineTo(x + 150, 540); c.closePath();
      c.fillStyle = W5.rgba(GHOST, 0.42); c.fill();
      c.strokeStyle = GHOST; c.lineWidth = 2; c.setLineDash([7, 6]); c.lineDashOffset = -t * 12;
      c.save(); hullPath(c, x, K); c.stroke(); c.restore();
      c.restore();
    });
  }

  /* ═══════════ 主場景 ═══════════ */
  function scene(c, s) {
    const t = s.t, x = shipX(s), D = dens(x), dr = draft(D), heave = 1.2 * Math.sin(t * 1.7);
    const K = WL + dr + heave;
    waterBody(c, t, false);
    ship(c, x, K, t);
    waterBody(c, t, true);                               /* 水蓋在船身水下部分上（半透明）→ 看得出泡在水裡 */
    surfLine(c, t);
    /* 排開的水 */
    const da = fin(s, 1, 2.4, 0.6);
    displaced(c, x, K, t, da);
    /* 海水吃水（綠虛線，畫在船身上 → 跟著船走） */
    const ySea = K - DR_SEA, yRiv = K - DR_RIV;
    hullLine(c, x, K, ySea, GRN, fin(s, 1, 1.0, 0.5), t, true);
    const gl = fin(s, 1, 1.0, 0.5);
    T(c, gl, L('海水吃水', 'Sea draft'), x + 152, ySea + 12, GRN, 22, 'left');
    /* 淡水吃水（黃線，第 3 步起） */
    const ya = fin(s, 3, 0.6, 0.5);
    hullLine(c, x, K, yRiv, YEL, ya, t, false);
    T(c, ya, L('淡水吃水', 'River draft'), x + 152, yRiv - 10, YEL, 22, 'left');
    /* 吃水加深：綠黃兩線間的尺寸標 */
    const dimA = fin(s, 3, 1.6, 0.5);
    if (dimA > 0.02) {
      const bx = x + 112;
      withA(c, dimA, () => {
        c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx - 8, yRiv); c.lineTo(bx + 8, yRiv); c.moveTo(bx - 8, ySea); c.lineTo(bx + 8, ySea); c.moveTo(bx, yRiv); c.lineTo(bx, ySea); c.stroke();
        c.restore();
      });
    }
    /* 力：W（船內往下）、B（水下往上頂船底），同長 */
    const wg = grow(s, 1, 3.8, 4.4), bg = grow(s, 1, 4.4, 5.0), fa = fin(s, 1, 3.8, 0.3);
    if (fa > 0.02) {
      M3.arrowFx(c, x - 40, K - 75, x - 40, K - 75 + ARW * wg, FW, fa, 7, 0);
      M3.arrowFx(c, x + 60, K + 75, x + 60, K + 75 - ARW * bg, FB, fa, 7, 0);
    }
    P(c, fa * clamp01((wg - 0.8) / 0.2), 'W ＝ 1030 tf', x - 54, K - 40, FW, 22, 'right');
    P(c, fa * clamp01((bg - 0.8) / 0.2), 'B ＝ 1030 tf', x + 74, K + 40, FB, 22, 'left');
    /* 排開體積（跟著船，第 2 步即時變化） */
    T(c, da, L('排開 ', 'Displaced ') + Math.round(vol(D)) + ' m³', x - 60, K + 46, GHOST, 22, 'center', true);
    /* 第 2 步：船邊即時密度 */
    const la = s.n === 2 ? fin(s, 2, 0.4, 0.4) * fout(s, 2, 10.2, 0.5) : 0;
    P(c, la, 'D ＝ ' + D.toFixed(2), x + 60, K - 156, D > 1.025 ? SEA_E : D < 1.005 ? RIVER_E : WHITE, 22, 'center', true);
    return { x, K, D };
  }

  /* ═══════════ 文字 ═══════════ */
  function labels(c, s) {
    T(c, fin(s, 1, 6.0, 0.5), L('海水 D ＝ 1.03', 'Sea water D = 1.03'), 130, 470, SEA_E, 22, 'center');
    T(c, fin(s, 1, 6.0, 0.5), L('河口', 'Estuary'), (X_SEA + X_RIV) / 2, 470, WHITE, 22, 'center');
    T(c, fin(s, 3, 3.6, 0.5), L('淡水 D ＝ 1.00', 'Fresh water D = 1.00'), 850, 470, RIVER_E, 22, 'center');
    /* 示意：吃水差異放大（第 3 步起，左上） */
    P(c, fin(s, 3, 2.2, 0.5) * (s.n === 4 ? fout(s, 4, 0, 0.4) : 1), L('示意：吃水差異放大', 'Not to scale: depth change exaggerated'), 300, 120, DIM, 22, 'center');
  }
  function formulas(c, s) {
    if (s.n !== 4) return;
    const a = fin(s, 4, 0.4, 0.5); if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.82)'; W5.rr(c, 20, 92, 630, 150, 14); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 2; c.stroke(); c.restore();
    });
    const sh = (t0, d) => clamp01((s.u - t0) / d);
    M3.eqRow(c, { x: 335, y: 122, size: 22, gap: 8, show: sh(0.8, 1.8) * 7, tokens: [
      { t: L('海水', 'Sea'), col: SEA_E }, { t: 'V ＝ W ÷ D', col: WHITE }, { t: '＝', col: WHITE }, { t: '1030 ÷ 1.03', col: WHITE }, { t: '＝', col: WHITE }, { t: '1000 m³', col: GHOST }] });
    M3.eqRow(c, { x: 335, y: 166, size: 22, gap: 8, show: Math.min(6, sh(3.0, 1.8) * 6) + sh(6.4, 0.5), tokens: [
      { t: L('淡水', 'Fresh'), col: RIVER_E }, { t: 'V ＝ W ÷ D', col: WHITE }, { t: '＝', col: WHITE }, { t: '1030 ÷ 1.00', col: WHITE }, { t: '＝', col: WHITE }, { t: '1030 m³', col: YEL }, { t: L('多 30', '+30'), col: YEL, pill: true }] });
    M3.eqRow(c, { x: 335, y: 214, size: 24, gap: 10, show: sh(5.4, 1.2) * 3, tokens: [
      { t: 'B ＝ W ＝ 1030 tf', col: FB }, { t: L('不變', 'unchanged'), col: WHITE, pill: true }] });
  }
  const TITLES = [
    () => L('海水中航行', 'Sailing in sea water'),
    () => L('駛過交界', 'Crossing the boundary'),
    () => L('淡水河中', 'In the river'),
    () => L('B ＝ W 不變', 'B = W stays')
  ];
  function texts(c, s, st) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('浮在海上：B ＝ W ＝ 1030 tf', 'Floating at sea: B = W = 1030 tf'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 3.0, 0.6) * fout(s, 3, 0, 0.4), L('密度變小，排開的水不夠重了', 'Lower density: the displaced water weighs too little'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * fout(s, 4, 0, 0.4), L('淡水中要排開 1030 m³，吃水加深', 'In fresh water it must displace 1030 m³: it sits lower'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.6, 0.6), L('B ＝ W 不變，V排 多 30 m³，所以吃水加深', 'Same B = W, 30 m³ more displaced, so it sits lower'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: WL, cell: 40 });
    const st = scene(c, s);
    labels(c, s);
    formulas(c, s);
    texts(c, s, st);
  }

  W5.register('ship', { canvas: 'cvs-ship', steps: DUR, draw });
})();
