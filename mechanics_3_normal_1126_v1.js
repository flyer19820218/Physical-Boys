/* ==================================================================
   mechanics_3 ｜ 正向力（cvs-normal，960×540）
   四步：1 0 顆砝碼（正向力 200、峰值 70）→ 2 加 1 顆（250、87.5）→ 3 加 2 顆（300、105）→ 4 找出規律（表＋f_max–N 圖）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   場景：沿用 M3.pullScene（同 surface／area）——桌上鋪木板、木塊 200 gw，March 用彈簧秤水平往右拉；
         讀數升到峰值 → 木塊滑動、讀數掉下來（預設 0.72 倍，不寫數字）→ 秤上與曲線圖保留峰值標籤。
         木塊中線移到 x 290、彈簧原長 196，讓左邊放得下力的標籤、右上角放得下紀錄卡。
   力：比例尺 K＝0.45 px／gw（300 gw＝135 px，整支不變），每 50 gw 一道刻痕（一顆砝碼＝多一格）。
         重力（粉）從木塊中心往下、正向力（綠）從接觸面往上，兩支等長；標籤放在箭頭左邊。
   第 2、3 步開頭：木塊拉回原位 → 砝碼從上方落下 → 兩支箭頭一起變長（＋50 gw）→ 再拉一次。
   右上角紀錄卡：每次滑動後記下「正向力｜峰值」一列。
   第 4 步：場景淡出；左邊整理成表（正向力｜最大靜摩擦力｜相除＝0.35），右邊 f_max–N 圖（三點＋過原點直線），
         底部黃色結論「最大靜摩擦力 ＝ 0.35 × 正向力」。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.pullScene) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = M3.FC.net, GRAV = M3.FC.gravity, NORM = M3.FC.normal;
  const TAU = Math.PI * 2;
  const DUR = [12, 12, 12, 12];      /* 總長 48 秒 */

  const GY = M3.GY;
  const RUNS = [{ N: 200, peak: 70 }, { N: 250, peak: 87.5 }, { N: 300, peak: 105 }];
  const K = 0.45;                    /* 力的比例尺 px／gw */
  const BLOCK_CX = 290, LEN0 = 196;
  const PULL_T = [[3.0, 10.2], [4.0, 10.8], [4.0, 10.8]];   /* 各步拉動進度 t 0→1 的起訖秒 */
  const RET = [0.1, 0.9];            /* 第 2、3 步：木塊拉回原位 */
  const DROP = [1.0, 2.2];           /* 第 2、3 步：砝碼落下 */
  const GROW = [2.2, 3.0];           /* 第 2、3 步：箭頭變長 */
  const GRAPH = { x0: 340, y0: 40, x1: 640, y1: 196 };
  const CARD = { x0: 784, y0: 40, x1: 944, y1: 246, c1: 832, c2: 904 };
  const CAP = { x: 700, y: 500 };
  const TAG_Y = [496, 526];

  M3.preload(['tug']);

  /* 第 n 步（1..3）滑動的時刻 */
  const slipAt = n => { const p = PULL_T[n - 1]; return p[0] + M3.PULL.TSLIP * (p[1] - p[0]); };
  const fmt = v => String(Math.round(v * 10) / 10);

  /* ═══════════ 第 1～3 步：疊砝碼＋拉木塊 ═══════════ */
  function pullStep(c, s, a) {
    const n = Math.min(s.n, 3) - 1, u = s.n <= 3 ? s.u : 99, R = RUNS[n], pt = PULL_T[n];
    const t = s.n <= 3 ? seg(u, pt[0], pt[1]) : 1;
    const ret = n > 0 && s.n <= 3 ? ease(seg(u, RET[0], RET[1])) : 1;
    const massIn = n > 0 && s.n <= 3 ? seg(u, DROP[0], DROP[1]) : 1;
    const res = M3.pullScene(c, {
      a, t, peak: R.peak, mat: 'wood', sheet: 10, blockCx: BLOCK_CX, len0: LEN0, labels: false,
      shift: (1 - ret) * M3.PULL.slide,
      masses: n, massIn,
      graph: { panel: GRAPH, ghosts: RUNS.slice(0, n).map(r => ({ peak: r.peak, a: 0.5 })) }
    });
    /* 讀數 pill（自己畫：87.5 不能被四捨五入成 88） */
    const st = res.st, rx = res.ring.x - 22 - 75, ry = res.hook.y - 48;
    if (!st.slipped) P(c, a, (st.r >= R.peak - 0.5 ? fmt(R.peak) : String(Math.round(st.r))) + ' gw', rx, ry, WHITE, 22, 'center', true);
    else P(c, a, L('峰值 ', 'Peak ') + fmt(R.peak) + ' gw', rx, ry, FR, 22, 'center', true);
    /* 兩支力的箭頭：第 1 步長出來；第 2、3 步砝碼落定後一起變長 */
    let val, grow;
    if (n === 0) { val = R.N; grow = s.n === 1 ? ease(seg(u, 0.8, 2.2)) : 1; }
    else { val = lerp(RUNS[n - 1].N, R.N, s.n <= 3 ? ease(seg(u, GROW[0], GROW[1])) : 1); grow = 1; }
    const B = res.block, cy = (B.y0 + B.y1) / 2, gx = B.cx - 24, nx = B.cx + 24;
    const ga = a, la = a * (n === 0 && s.n === 1 ? fin(s, 1, 2.0, 0.4) : 1);
    M3.force(c, { x: gx, y: cy, dir: 'down', val, k: K, col: GRAV, a: ga, grow, tick: 50, lab: null });
    M3.force(c, { x: nx, y: B.y1, dir: 'up', val, k: K, col: NORM, a: ga, grow, tick: 50, lab: null });
    const len = val * K * grow;
    const gTip = cy + len, nTip = B.y1 - len;
    P(c, la, L('重力 ', 'Weight ') + fmt(val) + ' gw', gx - 16, Math.max(gTip, 404), GRAV, 20, 'right', true);
    P(c, la, L('正向力 ', 'Normal ') + fmt(val) + ' gw', B.x0 - 12, nTip, NORM, 20, 'right', true);
    /* 砝碼落定：「＋50 gw」 */
    if (n > 0 && s.n <= 3) {
      const pa = a * fin(s, n + 1, DROP[1] - 0.1, 0.3) * fout(s, n + 1, 4.4, 0.5);
      P(c, pa, '+50 gw', B.cx, B.y0 - 41 * n - 34, GRAV, 20, 'center', true);
    }
    /* 左上：步驟標題 */
    const titleA = a * (s.n === 1 ? fin(s, 1, 0.2, 0.5) : 1);
    const ttl = n === 0 ? L('第 1 次：0 顆砝碼', 'Test 1: no mass') : L('第 ' + (n + 1) + ' 次：加 ' + n + ' 顆砝碼', 'Test ' + (n + 1) + ': ' + n + (n > 1 ? ' masses' : ' mass'));
    P(c, titleA, ttl, 24, M3.KEY_Y, WHITE, 24, 'left');
    /* 結論字卡：滑動後 */
    const ca = s.n <= 3 ? fin(s, n + 1, slipAt(n + 1) + 0.3, 0.5) : 1;
    M3.caption(c, a * ca, L('最大靜摩擦力 ＝ ' + fmt(R.peak) + ' gw', 'Max static friction = ' + fmt(R.peak) + ' gw'), FR, CAP.x, CAP.y, 24);
    card(c, s, n, a);
  }

  /* 右上角紀錄卡：每次滑動後多一列 */
  function card(c, s, n, a) {
    if (a <= 0.02) return;
    const C = CARD;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 14); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(C.x0 + 12, C.y0 + 76); c.lineTo(C.x1 - 12, C.y0 + 76); c.stroke();
      c.beginPath(); c.moveTo((C.c1 + C.c2) / 2 + 6, C.y0 + 56); c.lineTo((C.c1 + C.c2) / 2 + 6, C.y1 - 12); c.stroke();
      c.restore();
    });
    T(c, a, L('紀錄（gw）', 'Log (gw)'), (C.x0 + C.x1) / 2, C.y0 + 24, WHITE, 20);
    T(c, a, L('正向力', 'Normal'), C.c1, C.y0 + 58, NORM, 20);
    T(c, a, L('峰值', 'Peak'), C.c2, C.y0 + 58, FR, 20);
    RUNS.forEach((R, i) => {
      if (i > n) return;
      const ra = a * (s.n <= 3 && i === n ? fin(s, i + 1, slipAt(i + 1) + 0.2, 0.5) : 1);
      if (ra <= 0.02) return;
      const y = C.y0 + 100 + i * 38;
      if (i === n && s.n <= 3) withA(c, ra, () => { c.save(); c.fillStyle = 'rgba(255,224,102,0.10)'; W5.rr(c, C.x0 + 8, y - 17, C.x1 - C.x0 - 16, 34, 8); c.fill(); c.restore(); });
      T(c, ra, String(R.N), C.c1, y, NORM, 22, 'center', true);
      T(c, ra, fmt(R.peak), C.c2, y, FR, 22, 'center', true);
    });
  }

  /* ═══════════ 第 4 步：表＋f_max–N 圖 ═══════════ */
  const TB = { x0: 24, x1: 470, c: [97, 268, 418], y: [118, 146], rows: [200, 248, 296], line: 168 };
  const GR = { x0: 540, y0: 64, x1: 940, y1: 446, ox: 604, oy: 380, kx: 0.95, ky: 2.1, xmax: 330 };
  const rowT = i => 0.9 + i * 0.8;       /* 表的第 i 列＋圖上第 i 點出現 */
  const ratioT = i => 3.6 + i * 0.7;     /* 相除欄出現 */
  const LINE_T = [5.8, 7.0];             /* 過原點直線 */
  function pattern(c, s, a) {
    if (a <= 0.02) return;
    const u = s.u;
    /* ── 表 ── */
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, TB.x0, 84, TB.x1 - TB.x0, 250, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, TB.x0, 84, TB.x1 - TB.x0, 250, 14); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(TB.x0 + 12, TB.line); c.lineTo(TB.x1 - 12, TB.line); c.stroke();
      [170, 366].forEach(x => { c.beginPath(); c.moveTo(x, 100); c.lineTo(x, 318); c.stroke(); });
      c.restore();
    });
    T(c, a, L('正向力', 'Normal force'), TB.c[0], TB.y[0], NORM, 20);
    T(c, a, L('最大靜摩擦力', 'Max static friction'), TB.c[1], TB.y[0], FR, 20);
    T(c, a, L('相除', 'Ratio'), TB.c[2], TB.y[0], YEL, 20);
    T(c, a, '(gw)', TB.c[0], TB.y[1], COL.dim, 18, 'center', true);
    T(c, a, '(gw)', TB.c[1], TB.y[1], COL.dim, 18, 'center', true);
    T(c, a, L('摩擦÷正向', 'f ÷ N'), TB.c[2], TB.y[1], COL.dim, 18);
    RUNS.forEach((R, i) => {
      const ra = a * fin(s, 4, rowT(i), 0.4), y = TB.rows[i];
      T(c, ra, String(R.N), TB.c[0], y, NORM, 24, 'center', true);
      T(c, ra, fmt(R.peak), TB.c[1], y, FR, 24, 'center', true);
      const qa = a * fin(s, 4, ratioT(i), 0.4);
      if (qa > 0.02) W5.glow(c, TB.c[2], y, 44, YEL, 0.25 * qa * (1 - 0.6 * seg(u, ratioT(i) + 0.4, ratioT(i) + 1.2)));
      T(c, qa, '0.35', TB.c[2], y, YEL, 24, 'center', true);
    });
    T(c, a * fin(s, 4, 5.4, 0.5), L('每次相除都是 0.35', 'Every ratio is 0.35'), (TB.x0 + TB.x1) / 2, 370, WHITE, 22);
    T(c, a * fin(s, 4, 8.4, 0.5), L('0.35 是這塊木板的靜摩擦係數 μs', '0.35 = static friction coefficient μs'), (TB.x0 + TB.x1) / 2, 410, COL.dim, 20);

    /* ── f_max–N 圖 ── */
    const X = N => GR.ox + N * GR.kx, Y = f => GR.oy - f * GR.ky;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, GR.x0, GR.y0, GR.x1 - GR.x0, GR.y1 - GR.y0, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, GR.x0, GR.y0, GR.x1 - GR.x0, GR.y1 - GR.y0, 14); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.09)'; c.lineWidth = 1.2;
      [35, 70, 105].forEach(f => { c.beginPath(); c.moveTo(GR.ox, Y(f)); c.lineTo(X(GR.xmax), Y(f)); c.stroke(); });
      [100, 200, 300].forEach(N => { c.beginPath(); c.moveTo(X(N), GR.oy); c.lineTo(X(N), Y(125)); c.stroke(); });
      c.restore();
      W5.arrow(c, GR.ox, GR.oy, X(GR.xmax) + 16, GR.oy, WHITE, 2.5, 10);
      W5.arrow(c, GR.ox, GR.oy, GR.ox, Y(125) - 10, WHITE, 2.5, 10);
    });
    [35, 70, 105].forEach(f => T(c, a, String(f), GR.ox - 10, Y(f), COL.dim, 18, 'right', true));
    [100, 200, 300].forEach(N => T(c, a, String(N), X(N), GR.oy + 20, COL.dim, 18, 'center', true));
    T(c, a, '0', GR.ox - 10, GR.oy + 16, COL.dim, 18, 'right', true);
    T(c, a, L('最大靜摩擦力（gw）', 'Max static friction (gw)'), GR.x0 + 18, GR.y0 + 26, FR, 20, 'left');
    T(c, a, L('正向力（gw）', 'Normal force (gw)'), GR.x1 - 18, GR.oy + 50, NORM, 20, 'right');
    /* 過原點的直線 */
    const lg = ease(seg(u, LINE_T[0], LINE_T[1]));
    if (lg > 0.01) withA(c, a, () => {
      const N1 = GR.xmax * lg;
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(N1), Y(0.35 * N1)); c.stroke();
      c.strokeStyle = YEL; c.lineWidth = 4; c.shadowColor = YEL; c.shadowBlur = 10;
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(N1), Y(0.35 * N1)); c.stroke();
      c.restore();
      if (lg < 1) W5.glow(c, X(N1), Y(0.35 * N1), 24, YEL, 0.5);
    });
    /* 三點（加虛線指到兩軸） */
    RUNS.forEach((R, i) => {
      const pa = a * fin(s, 4, rowT(i), 0.4), x = X(R.N), y = Y(R.peak);
      withA(c, pa, () => {
        c.save(); c.setLineDash([5, 5]); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x, GR.oy); c.lineTo(x, y); c.lineTo(GR.ox, y); c.stroke(); c.restore();
        W5.glow(c, x, y, 22, FR, 0.5);
        c.save(); c.fillStyle = FR; c.strokeStyle = '#fff3ec'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.stroke(); c.restore();
      });
      T(c, pa, fmt(R.peak), x - 14, y - 22, FR, 20, 'right', true);
    });
    T(c, a * fin(s, 4, LINE_T[1] - 0.2, 0.5), L('過原點的直線', 'Straight line through 0'), X(330), Y(20), YEL, 20, 'right');
    /* 結論 */
    const ca = a * fin(s, 4, 7.4, 0.6);
    if (ca > 0.02) W5.glow(c, 480, M3.BOT_Y, 230, YEL, 0.12 * ca);
    P(c, ca, L('最大靜摩擦力 ＝ 0.35 × 正向力', 'Max static friction = 0.35 × normal force'), 480, M3.BOT_Y, YEL, 24, 'center', true);
  }

  /* ═══════════ 固定的角落標籤 ═══════════ */
  function tags(c, a) {
    T(c, a, L('木塊 200 gw・每顆砝碼 50 gw・木板（不變）', 'Block 200 gw · each mass 50 gw · wood board'), 24, TAG_Y[0], COL.dim, 20, 'left');
    T(c, a, L('水平桌面：正向力 ＝ 總重量', 'Level table: normal force = total weight'), 24, TAG_Y[1], NORM, 20, 'left');
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a0 = s.n === 1 ? s.k : 1;
    M3.backdrop(c, { gy: GY, cell: 40, glow: COL.teal, gx: 360 });
    M3.ground(c, GY);
    if (s.n <= 3) { pullStep(c, s, a0); tags(c, a0); }
    else {
      const fo = fout(s, 4, 0.0, 0.45);
      pullStep(c, s, fo); tags(c, fo);
      P(c, fin(s, 4, 0.4, 0.5), L('找出規律', 'Find the pattern'), 480, M3.KEY_Y - 8, WHITE, 24);
      pattern(c, s, fin(s, 4, 0.4, 0.6));
    }
  }

  W5.register('normal', { canvas: 'cvs-normal', steps: DUR, draw });
})();
