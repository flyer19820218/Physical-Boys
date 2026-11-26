/* ==================================================================
   mechanics_4 ｜ 連通管：液面一定等高（cvs-level，960×540）
   四步：1 底部相通 → 2 左側注水（左高右低、水往右流）→ 3 液面等高（壓力平衡）→ 4 左側排水（一起下降、始終等高）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （M4.connected／M4.heightRuler／M4.faucet 由本檔新增）。

   數字（照簡報）：清水 D ＝ 1 gw/cm³；h 從連通管「管內底」往上量。
       第 1 步四管都是 10 cm；第 2 步左管注水到 30 cm（其餘 10 cm）→ 底部 P ＝ 30、10 gw/cm²；
       第 3 步靜止後四管 20 cm → P ＝ 20 gw/cm²；第 4 步從左側排水，四管一起降到 12 cm。
   比例尺：1 cm ＝ 7 px。管內底 FL＝410、管內頂 PT＝390（管內高 20 px ≈ 2.9 cm）；水面 y ＝ 410 － 7h。
   四個容器（內半寬 px；體積用圓截面 π r² 積分，r ＝ 半寬 ÷ 7）：
       ① 細高管  x 110，半寬 13，口 36 cm
       ② 寬圓筒  x 290，半寬 68，口 32 cm
       ③ 漏斗形  x 490，頸半寬 16（到 10 cm）→ 線性張開到 32 cm 的 96（上寬下窄）
       ④ 彎管    半寬 14（水平切面固定），中線 9 cm 以下在 x 770，以上 770 ＋ 28(1 － cos 2πq) 往右彎再彎回
   水量守恆（第 2 步）：總水量 ＝ 四管都在 20 cm 的水量（管內的水一直滿，不計）。
       A 段 1.3～3.3 秒：左管 10 → 30 cm（倒得比流得快）；其餘從 2.2 秒起慢慢升。
       B 段 3.3～6.5 秒：繼續倒、左管維持 30 cm，其餘升到 rC；6.5 秒關水龍頭。
       C 段 6.5～9.5 秒：不再加水，左管 30 → 20 cm，其餘由「V① ＋ V其餘 ＝ 總水量」解出（rC → 20 cm）。
       rC 在載入時解出：V其餘(rC) ＝ V其餘(20) －［V①(30) － V①(20)］（約 19.8 cm：左管細，降 10 cm 只夠其餘升一點點）。
   壓力箭頭（珊瑚）2.4 px／(gw/cm²)：30 → 72 px、20 → 48 px、12 → 28.8 px；尖端在管內底（朝下），長度隨水面即時變化。
   版面：步驟標題 KEY_Y 62；字卡 Q_Y 108；壓力 pill「P ＝ 30」y 478（第 2、3 步；四個 pill 太擠，單位 gw/cm² 只在最右邊寫一次，x 828）；第 4 步結論字卡 BOT_Y 505（pill 先淡出）；
       高度尺在右邊 x 900；注水龍頭在左上（出水口 (110,140)）；排水龍頭接在管左端、水落進左下的接水槽。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.connected) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, EDGE = M4.PC.waterEdge;
  const DUR = [11, 12, 11, 12];        /* 總長 46 秒 */

  /* ── 場景（1 cm ＝ K px） ── */
  const K = 7, FL = 410, PT = 390, HP = (FL - PT) / K, WALL = 6;
  const PX0 = 84, PX1 = 806, GY = 450;
  const yOf = h => FL - K * h;
  const H0 = 10, HHI = 30, HEQ = 20, HLO = 12;
  const PK = 2.4, PILL_Y = 478, RUL_X = 900, UNIT_X = 828;
  const POUR_X = 110, POUR_Y = 140, DRAIN_X = 46, DRAIN_Y = 426, TRX0 = 14, TRX1 = 78;

  /* 每個容器：中線 xc(h)、內半寬 half(h)（px）、口的高度 top（cm）、壓力箭頭 x */
  const V4 = h => (h <= 9 ? 770 : 770 + 28 * (1 - Math.cos(2 * Math.PI * (h - 9) / (33 - 9))));
  const VES = [
    { xc: () => 110, half: () => 13, top: 36, ax: 110, brk: [] },
    { xc: () => 290, half: () => 68, top: 32, ax: 290, brk: [] },
    { xc: () => 490, half: h => (h <= 10 ? 16 : 16 + 80 * (h - 10) / 22), top: 32, ax: 490, brk: [10] },
    { xc: V4, half: () => 14, top: 33, ax: 770, brk: (() => { const a = [9]; for (let h = 9.5; h < 33; h += 0.5) a.push(h); return a; })() }
  ];
  VES.forEach(v => {
    const hs = [HP].concat(v.brk, [v.top]);
    v.pts = hs.map(h => [yOf(h), v.xc(h) - v.half(h), v.xc(h) + v.half(h)]);
  });

  /* ── 水量：A(h) ＝ π r²（r ＝ 半寬 ÷ K，cm），由 HP 往上積分成表 ── */
  const DH = 0.02, NT = Math.ceil((36 - HP) / DH) + 1;
  const VT = VES.map(v => {
    const tb = new Float64Array(NT); let acc = 0;
    for (let k = 1; k < NT; k++) {
      const h = HP + (k - 0.5) * DH, r = v.half(Math.min(h, v.top)) / K;
      acc += Math.PI * r * r * DH; tb[k] = acc;
    }
    return tb;
  });
  const vol = (i, h) => { const f = (Math.max(HP, h) - HP) / DH, k = Math.min(NT - 2, Math.floor(f)); return lerp(VT[i][k], VT[i][k + 1], f - k); };
  const volO = h => vol(1, h) + vol(2, h) + vol(3, h);                   /* ②③④ 同一水面時的水量 */
  const hOfVolO = v => { let lo = HP, hi = 32; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (volO(m) < v) lo = m; else hi = m; } return (lo + hi) / 2; };
  const VTOT = vol(0, HEQ) + volO(HEQ);                                   /* 靜止後的總水量 */
  const RC = hOfVolO(VTOT - vol(0, HHI));                                 /* 關水龍頭那一刻其餘三管的水面 */

  /* 第 2 步時間點 */
  const P_ON = 1.0, A0 = 1.3, A1 = 3.3, R0 = 2.2, STOP = 6.5, C1 = 9.5, FALL = 0.22;
  /* 第 4 步時間點 */
  const V_OPEN = 1.0, D0 = 1.6, D1 = 8.6, V_SHUT = 8.8;

  /* 各步水面（cm）：[左, 其餘] */
  function levels(s) {
    const n = s.n, u = s.u;
    if (n === 1) return [H0, H0];
    if (n === 3) return [HEQ, HEQ];
    if (n === 4) { const h = HEQ - (HEQ - HLO) * ease(seg(u, D0, D1)); return [h, h]; }
    /* 第 2 步 */
    if (u < STOP) {
      const l = H0 + (HHI - H0) * ease(seg(u, A0, A1));
      const r = H0 + (RC - H0) * ease(seg(u, R0, STOP));
      return [l, r];
    }
    const l = HHI - (HHI - HEQ) * ease(seg(u, STOP, C1));
    return [l, hOfVolO(VTOT - vol(0, l))];
  }

  /* ═══════════ 場景 ═══════════ */
  function stand(c, a) {
    withA(c, a, () => {
      c.save();
      [200, 640].forEach(x => {
        const g = c.createLinearGradient(x - 22, 0, x + 22, 0); g.addColorStop(0, '#6d5a48'); g.addColorStop(1, '#4a3b2f');
        c.fillStyle = g; c.fillRect(x - 22, FL + WALL, 44, GY - FL - WALL);
        c.fillStyle = '#8a735c'; c.fillRect(x - 26, FL + WALL, 52, 5);
      });
      c.restore();
    });
  }
  function scene(c, s, lv) {
    const n = s.n, t = s.t;
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    const ca = fin(s, 1, 0.1, 0.8);
    stand(c, ca);
    /* 連通管亮光：第 1 步 2～6 秒亮起、之後淡淡留著 */
    const pg = n === 1 ? fin(s, 1, 2.0, 0.6) * (1 - 0.7 * fin(s, 1, 6.5, 1.0)) : 0;
    const glow = n === 3 ? 0.35 + 0.45 * seg(s.u, 0.4, 1.0) * (1 - seg(s.u, 3.0, 3.8)) : n === 4 ? 0.35 : 0;
    const stir2 = n === 2 ? clamp01((s.u - P_ON) / 0.5) * (1 - clamp01((s.u - STOP) / 2.5)) : 0;
    const res = M4.connected(c, {
      floor: FL, pipeTop: PT, px0: PX0, px1: PX1, wall: WALL, t, a: ca, glow, pipeGlow: pg * ca, wob: 1.4 + 1.2 * stir2,
      vessels: VES.map((v, i) => ({ pts: v.pts, level: yOf(i === 0 ? lv[0] : lv[1]) }))
    });
    /* 第 1 步：管裡流動的亮點（強調「通」） */
    if (pg > 0.02) withA(c, pg * ca, () => {
      c.save(); c.strokeStyle = 'rgba(205,236,255,0.9)'; c.lineWidth = 3; c.lineCap = 'round';
      c.setLineDash([10, 16]); c.lineDashOffset = -(s.u * 60) % 26;
      c.beginPath(); c.moveTo(PX0 + 6, (FL + PT) / 2); c.lineTo(PX1 - 6, (FL + PT) / 2); c.stroke(); c.restore();
    });
    return res;
  }

  /* ── 注水（第 2 步）：左上的水龍頭＋水柱 ── */
  function pourer(c, s, res) {
    if (s.n !== 2) return;
    const a = fin(s, 2, 0.2, 0.5) * fout(s, 2, 10.2, 0.6);
    const open = s.u < STOP ? ease(seg(s.u, P_ON - 0.4, P_ON)) : 1 - ease(seg(s.u, STOP - 0.2, STOP + 0.2));
    M4.faucet(c, POUR_X, POUR_Y, { dir: -1, len: 120, open, a });
    const u = s.u - P_ON; if (u <= 0) return;
    const yHit = res.vessels[0].surf(POUR_X);
    const head = lerp(POUR_Y, yHit, clamp01(u / FALL));
    const tail = lerp(POUR_Y, yHit, clamp01((s.u - STOP) / FALL));
    if (head - tail > 2) M4.pour(c, POUR_X, tail, head, { t: s.t, w: 8, splash: u > FALL, rw: 9 });
  }

  /* ── 排水（第 4 步）：管左端的水龍頭＋流進接水槽 ── */
  function drainer(c, s) {
    const a = s.n === 4 ? fin(s, 4, 0.2, 0.5) : 0;
    if (a <= 0.02) return;
    withA(c, a, () => M4.trough(c, TRX0, TRX1, GY, { h: 24 }));
    const open = ease(seg(s.u, V_OPEN, D0)) * (1 - ease(seg(s.u, D1, V_SHUT)));
    M4.faucet(c, DRAIN_X, DRAIN_Y, { dir: 1, len: PX0 - WALL - DRAIN_X, open, a, drop: (FL + PT) / 2 - DRAIN_Y + 26 + 10 });
    const u = s.u - D0; if (u <= 0) return;
    const yHit = GY - 8;
    const head = lerp(DRAIN_Y, yHit, clamp01(u / 0.12));
    const tail = lerp(DRAIN_Y, yHit, clamp01((s.u - V_SHUT) / 0.12));
    if (head - tail > 2) M4.pour(c, DRAIN_X, tail, head, { t: s.t, w: 7, splash: u > 0.12, rw: 18, a });
  }

  /* ── 高度尺（右）＋左管水面讀數 ── */
  function ruler(c, s, lv) {
    const a = fin(s, 1, 0.8, 0.6);
    M4.heightRuler(c, RUL_X, FL, K, 35, { a });
    /* 其餘三管的水面在尺上的位置：小三角 */
    const ta = fin(s, 1, 1.4, 0.5);
    if (ta > 0.02) withA(c, ta, () => {
      const y = yOf(lv[1]);
      c.save(); c.fillStyle = EDGE; c.beginPath(); c.moveTo(RUL_X - 10, y); c.lineTo(RUL_X - 22, y - 7); c.lineTo(RUL_X - 22, y + 7); c.closePath(); c.fill(); c.restore();
    });
    /* 左管水面讀數（第 2 步起） */
    const la = s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 1.4, 0.5) : 1;
    T(c, la, Math.round(lv[0]) + ' cm', VES[0].xc() - 22, yOf(lv[0]), EDGE, 22, 'right', true);
  }

  /* ── 管內的水流方向（第 2 步往右、第 4 步往左）：運動，不是力 → 虛線箭頭 ── */
  const FLOW = [[132, 214], [374, 462], [520, 740]];
  function flow(c, s, lv) {
    let a = 0, dir = 1;
    if (s.n === 2) a = fin(s, 2, 2.6, 0.5) * clamp01((lv[0] - lv[1]) / 1.5);
    if (s.n === 4) { a = fin(s, 4, D0 + 0.2, 0.5) * fout(s, 4, D1 - 0.4, 0.5); dir = -1; }
    if (a <= 0.02) return;
    const y = (FL + PT) / 2, ph = s.t * 40;
    FLOW.forEach(([x0, x1]) => {
      const xa = dir > 0 ? x0 : x1, xb = dir > 0 ? x1 : x0;
      M3.dashArrow(c, xa, y, xb, y, WHITE, a * 0.9, ph, { lw: 3, head: 12, dash: [8, 7] });
    });
  }

  /* ── 底部壓力箭頭（珊瑚，長度 ∝ P ＝ h × D）＋壓力 pill ── */
  function pressure(c, s, lv) {
    if (s.n === 1) return;
    const a = s.n === 2 ? fin(s, 2, 3.0, 0.6) : 1;
    VES.forEach((v, i) => {
      const h = i === 0 ? lv[0] : lv[1];
      M4.pArrow(c, v.ax, FL, PK * h * a, { dir: 'down', lw: 6, a: clamp01(a * 2) });
    });
    /* 第 3 步：四支箭頭尾端一樣高（淡點線） */
    const ea = s.n === 3 ? 0.55 * fin(s, 3, 3.2, 0.6) : 0, ty = FL - PK * HEQ;
    if (ea > 0.02) withA(c, ea, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 2; c.setLineDash([3, 7]);
      c.beginPath(); c.moveTo(VES[0].ax - 24, ty); c.lineTo(VES[3].ax + 24, ty); c.stroke(); c.restore();
    });
    const pa = s.n === 2 ? fin(s, 2, 3.6, 0.5) : s.n === 3 ? 1 : fout(s, 4, 0, 0.5);
    VES.forEach((v, i) => {
      const h = Math.round(i === 0 ? lv[0] : lv[1]);
      M4.pPill(c, pa, L('P ＝ ' + h, 'P = ' + h), v.ax, PILL_Y, 22);
    });
    /* 單位寫一次（在最右邊 pill 的右邊）：四個 pill 都是 gw/cm² */
    T(c, pa, 'gw/cm²', UNIT_X, PILL_Y, M4.PC.pressure, 22, 'left');
  }

  /* ── 第 1 步：「底部相通」標籤（管下方）＋引線 ── */
  function pipeLabel(c, s) {
    const a = s.n === 1 ? fin(s, 1, 2.2, 0.5) : 0;
    if (a <= 0.02) return;
    const x = 420;
    withA(c, a, () => {
      c.save(); c.strokeStyle = EDGE; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x, PILL_Y - 19); c.lineTo(x, FL + WALL + 4); c.stroke();
      W5.arrow(c, x, PILL_Y - 26, x, FL + WALL + 3, EDGE, 2.5, 10);
      c.restore();
    });
    P(c, a, L('底部相通', 'Joined at the bottom'), x, PILL_Y, EDGE, 22);
  }

  /* ── 第 3、4 步：貫穿四管的水平虛線＋「同一水平高度」 ── */
  function levelLine(c, s, lv) {
    const g = grow(s, 3, 0.6, 2.2); if (g <= 0.01 || s.n < 3) return;
    const y = yOf(lv[1]), x0 = 90, x1 = lerp(x0, RUL_X - 24, g);
    withA(c, 1, () => {
      c.save(); c.strokeStyle = EDGE; c.lineWidth = 3; c.setLineDash([12, 8]);
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
    });
    T(c, fin(s, 3, 1.8, 0.6), L('同一水平高度', 'Same height'), 670, y - 22, EDGE, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('四個形狀、粗細都不同的容器', 'Four vessels, all different shapes'),
    () => L('從左邊倒水', 'Pour water in on the left'),
    () => L('水停了：液面等高', 'Water at rest: the levels match'),
    () => L('從左邊排水', 'Drain water out on the left')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 6.0, 0.6) * fout(s, 2, 0, 0.4), L('倒水進去，水面最後停在哪裡？', 'Pour water in: where will the levels settle?'), WHITE, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 2, 4.0, 0.6) * fout(s, 2, C1 + 0.6, 0.5), L('左邊深 → 底部壓力大 → 水往右流', 'Left is deeper → more pressure → water flows right'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 3, 2.6, 0.6) * fout(s, 4, 0, 0.4), L('液面等高 → 底部壓力平衡', 'Same level → the pressures balance'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 4, 3.0, 0.6), L('形狀、粗細都不影響', 'Shape and width don’t matter'), YEL, 480, M3.Q_Y, 24);
    M3.caption(c, fin(s, 4, 6.5, 0.6), L('同一種液體、靜止 → 液面一定等高', 'Same liquid, at rest → the levels always match'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const lv = levels(s);
    const res = scene(c, s, lv);
    drainer(c, s);
    flow(c, s, lv);
    pressure(c, s, lv);
    levelLine(c, s, lv);
    pourer(c, s, res);
    ruler(c, s, lv);
    pipeLabel(c, s);
    texts(c, s);
  }

  W5.register('level', { canvas: 'cvs-level', steps: DUR, draw });
})();
