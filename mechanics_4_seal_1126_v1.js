/* ==================================================================
   mechanics_4 ｜ 液體壓力：密閉加蓋，空氣也在出力（cvs-seal，960×540）
   四步：1 開口：噴水 → 2 蓋上密閉蓋 → 3 上方氣壓降低 → 4 水流停止（最後 3 秒打開通氣孔，又噴了）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （M4.atmArrow／M4.airDots／M4.lid／M4.gauge 由本檔新增；水桶、噴流沿用 depth 的 M4.tank／M4.jet）。

   數字（照簡報）：水深 40 cm；只有 1 個洞，在水面下 30 cm（離桶底 10 cm）；清水 D ＝ 1 gw/cm³；大氣壓 1033 gw/cm²。
     洞口淨壓（以 gw/cm² 計，等於「cm 水柱」）＝ P氣 ＋（洞的深度）－ 1033；開口時 P氣 ＝ 1033 → 淨壓 ＝ 液體壓力 30。
   物理模型（全部是時間的純函式）：
     開口時水面以 0.045 cm/s 緩降（洞口截面 ≈ 0.8 cm²、桶截面 ≈ 2800 cm² 的量級，誠實的小量）。
     第 2 步 u＝3.0（T＝14 s）蓋緊：上方空氣柱 H0 ＝ 25 ＋ 已降的 0.63 cm，之後遵守波以耳定律 P氣 ＝ 1033 × H0 ÷ (H0 ＋ Δ)。
     平衡（水停）：P氣 ＋ (h0 － Δ) ＝ 1033 → Δe ≈ 0.7 cm（水面只再降約 3.5 px）、P氣 約 1004（畫面不標這個數字）。
     流速 ∝ √淨壓 → 淨壓 ≈ h0·(1－τ/Ts)²、Δ ＝ Δe·[1－(1－τ/Ts)²]（托里切利排水的形狀），Ts ＝ 19.6 s → 第 4 步 u≈0.6 停止。
     第 4 步 u＝8.6 打開通氣孔：空氣進入，P氣 0.6 秒內回到 1033，噴流恢復（淨壓 ≈ 28.6）。
   比例尺：1 cm ＝ 5 px（水桶、噴流同一比例）。桶內 x 120～370、內底 TB＝440、桶口 RIM＝115、水面 240（40 cm）、洞 y 390。
     噴流：M4.jet（g＝1 無因次拋物線），h＝淨壓 × 5 px；洞到落點落差 74 px → 開口射程 ≈ 211 px。
   壓力箭頭長度：
     液體壓力（珊瑚，M4.pArrow）2 px／(gw/cm²) → 30 → 60 px，尖端在洞口內壁、朝外。
     氣壓（灰白，M4.atmArrow，有斷軸記號）＝ 40 px（代表前面 1000，斷軸省略）＋ 2 px／(gw/cm²) × (P－1000)：
       1033 → 106 px；P氣 1004 → 48 px。上方箭頭尖端在水面（向下）；洞外箭頭在洞口上方 15 px（向左、尖端在外壁），兩者開口時等長。
   壓力計：圓形指針 990～1040（270° 刻度），藍色標記＝1033；第 3 步出現時，珊瑚拖尾弧顯示「從 1033 已經降了多少」。
   版面：步驟標題 KEY_Y 62；字卡／平衡式在底部 BOT_Y 505（地面 GY 472 下方）；壓力計在右側 (790,175)，導管由桶壁接過去。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.jet || !M4.gauge) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PR = M4.PC.pressure, ATM = M4.PC.atm;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */
  const S0 = [0, 11, 22, 33];          /* 各步開始的總秒數 */

  /* ── 場景（1 cm ＝ K px） ── */
  const K = 5;
  const TX0 = 120, TX1 = 370, WALL = 6, TB = 440, RIM = 115;
  const HX = TX1 + WALL, HY = TB - 10 * K;          /* 洞口（外壁）390 */
  const GY = 472, LY = GY - 8, TR0 = 388, TR1 = 668;
  const RIM_Y = RIM - 4;                             /* 桶口頂面（蓋子的橡皮墊壓在這） */
  const VENT_X = 310;                                /* 通氣孔 */
  const ARR_X = 156;                                 /* 上方氣壓箭頭 x */
  const MARK_X = 92;                                 /* 左側「30 cm」量線 x */
  const GX = 790, GYC = 175, GR = 62;                /* 壓力計 */
  const ATM_P = 1033, AK = 2, A0 = 40;               /* 氣壓箭頭：40 px（1000）＋ 2 px／單位 */
  const atmLen = p => A0 + AK * (p - 1000);

  /* ── 物理（純函式；T＝迴圈總秒數） ── */
  const R0 = 0.045;                                  /* 開口時水面下降 cm/s */
  const T_SEAL = S0[1] + 3.0, T_STOP = S0[3] + 0.6, T_VENT = S0[3] + 8.6, TS = T_STOP - T_SEAL;
  const D1 = R0 * T_SEAL, H0 = 25 + D1, HH0 = 30 - D1;
  const netAt = d => ATM_P * H0 / (H0 + d) + (HH0 - d) - ATM_P;   /* 蓋緊後再降 d cm 時的淨壓 */
  const DE = (() => { let lo = 0, hi = 5; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (netAt(m) > 0) lo = m; else hi = m; } return lo; })();
  const P_END = ATM_P * H0 / (H0 + DE);
  function drop(t) {                                 /* 水面從 40 cm 降了多少 cm */
    if (t <= T_SEAL) return R0 * t;
    if (t < T_VENT) { const x = Math.min(1, (t - T_SEAL) / TS); return D1 + DE * (1 - (1 - x) * (1 - x)); }
    return D1 + DE + R0 * (t - T_VENT);
  }
  const ventK = t => ease(clamp01((t - T_VENT - 0.3) / 0.6));      /* 空氣進去、氣壓回升 0..1 */
  function pGas(t) {
    if (t <= T_SEAL) return ATM_P;
    const ps = ATM_P * H0 / (H0 + Math.min(drop(t), D1 + DE) - D1);
    return t < T_VENT ? ps : lerp(P_END, ATM_P, ventK(t));
  }
  const depth = t => 30 - drop(t);                   /* 洞的深度 cm（＝液體壓力 gw/cm²） */
  const net = t => Math.max(0, pGas(t) + depth(t) - ATM_P);         /* 洞口淨壓 */
  const levelY = t => TB - (40 - drop(t)) * K;
  const T_DRIP = (() => { let t = T_SEAL; while (t < T_STOP && net(t) > 2) t += 0.02; return t; })();   /* 淨壓 ＜ 2 起只剩水滴 */

  /* ═══════════ 場景 ═══════════ */
  function lidState(s) {
    if (s.n === 1) return null;
    if (s.n > 2) return { dy: 0, squash: 1, a: 1 };
    const d = 1 - ease(clamp01((s.u - 0.6) / 1.8));
    return { dy: -46 * d, squash: clamp01((s.u - 2.4) / 0.6), a: fin(s, 2, 0.3, 0.5) };
  }
  function scene(c, s) {
    const t = s.t, ly = levelY(t);
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    M3.table(c, TX0 - WALL - 16, TX1 + WALL, TB + WALL, GY, { thick: 16, seed: 11 });
    M4.trough(c, TR0, TR1, GY, { h: 24 });
    const tk = M4.tank(c, { x0: TX0, x1: TX1, bot: TB, top: RIM, level: ly, wall: WALL, t, wob: 0.8, glow: 0.35,
      holes: [{ y: HY, side: 'right', r: 5 }] });
    /* 蓋緊時的水面（虛線），之後看得出水面只再降一點點 */
    const ra = s.n === 2 ? fin(s, 2, 3.2, 0.6) : s.n > 2 ? 1 : 0;
    if (ra > 0.02) withA(c, 0.5 * ra, () => {
      const y = levelY(T_SEAL);
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 1.5; c.setLineDash([5, 6]);
      c.beginPath(); c.moveTo(TX0 + 2, y); c.lineTo(TX1 - 2, y); c.stroke(); c.restore();
    });
    /* 空氣分子點（位置是比例 → 空氣柱變高就照比例散開） */
    const lid = lidState(s);
    const gapTop = lid && lid.dy === 0 ? M4.lid(c, TX0 - WALL, TX1 + WALL, RIM_Y, { squash: 1, a: 0 }).bot + 2 : RIM;
    M4.airDots(c, TX0 + 4, gapTop, TX1 - 4, ly - 4, { n: 30, cols: 10, seed: 17, t, a: s.n === 1 ? 0 : s.n === 2 ? 0.75 * fin(s, 2, 3.0, 0.8) : 0.75 });
    return tk;
  }

  /* ── 噴流、水滴、洞口水珠 ── */
  function flow(c, s) {
    const t = s.t, h = net(t);
    const ja = clamp01((h - 0.6) / 1.4);
    let f = 1;
    if (t >= T_VENT) f = clamp01((t - T_VENT - 0.5) / 0.9);
    if (ja > 0.02 && f > 0) M4.jet(c, { x: HX, y: HY, h: h * K, landY: LY, f, t, a: ja });
    /* 水滴：淨壓 ＜ 2 之後到停止，每 0.45 秒滴一滴（各自走拋物線） */
    const G = 24;                                    /* 無因次時間 τ ＝ 24 × 秒 */
    for (let k = 0; ; k++) {
      const tk = T_DRIP + 0.45 * k; if (tk > T_STOP || tk > t) break;
      const age = t - tk, tau = G * age, v = Math.sqrt(2 * net(tk) * K);
      const y = HY + 2 + tau * tau / 2; if (y > LY) continue;
      const x = HX + 2 + v * tau;
      withA(c, 1, () => { c.save(); c.fillStyle = M4.PC.waterEdge; c.beginPath(); c.ellipse(x, y, 3, 4, 0, 0, Math.PI * 2); c.fill(); c.restore(); });
    }
    /* 停止時洞口鼓著一顆小水珠 */
    const ba = t > T_DRIP && t < T_VENT + 0.6 ? clamp01((t - T_DRIP) / 0.6) * (t > T_VENT ? 1 - clamp01((t - T_VENT) / 0.6) : 1) : 0;
    if (ba > 0.02) withA(c, ba, () => {
      c.save(); c.fillStyle = W5.rgba(M4.PC.water, 0.85); c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 1.5;
      c.beginPath(); c.arc(HX, HY, 5, -Math.PI / 2, Math.PI / 2); c.fill(); c.stroke(); c.restore();
    });
  }

  /* ── 蓋子＋橡皮墊＋通氣孔（第 2 步落下；第 4 步最後打開通氣孔） ── */
  function lidDraw(c, s) {
    const lid = lidState(s); if (!lid) return;
    const open = s.n === 4 ? ease(clamp01((s.u - 8.6) / 0.4)) : 0;
    c.save(); c.translate(0, lid.dy);
    const r = M4.lid(c, TX0 - WALL, TX1 + WALL, RIM_Y, { squash: lid.squash, vent: VENT_X, open, a: lid.a });
    c.restore();
    /* 標籤：橡皮墊、密閉蓋（第 2 步） */
    const la = s.n === 2 ? fin(s, 2, 2.6, 0.5) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    T(c, la, L('密閉蓋', 'Airtight lid'), TX1 + WALL + 22, r.top + 6 + lid.dy, WHITE, 22, 'left');
    T(c, la, L('橡皮墊', 'Rubber seal'), TX1 + WALL + 22, r.top + 36 + lid.dy, DIM, 22, 'left');
    withA(c, la, () => {
      c.save(); c.strokeStyle = DIM; c.lineWidth = 2;
      c.beginPath(); c.moveTo(TX1 + WALL + 18, r.top + 36 + lid.dy); c.lineTo(TX1 + WALL + 6, r.bot + 3 + lid.dy); c.stroke(); c.restore();
    });
    /* 通氣孔打開：空氣一顆顆從上方鑽進去（第 4 步最後 3 秒） */
    if (s.n === 4 && s.u > 8.7) {
      const ta = clamp01((s.u - 8.7) / 0.3) * (1 - clamp01((s.u - 11.2) / 0.6));
      withA(c, ta, () => {
        c.save(); c.fillStyle = W5.rgba(M4.PC.air, 0.9);
        for (let i = 0; i < 7; i++) {
          const q = ((s.u - 8.7) * 1.4 + i / 7) % 1;           /* 0：上方 → 1：進到桶內 */
          const y = lerp(r.top - 58, r.bot + 34, q), x = VENT_X + (q > 0.62 ? (q - 0.62) * 90 * (i % 2 ? 1 : -1) : 0);
          c.globalAlpha = ta * (q < 0.1 ? q / 0.1 : 1);
          c.beginPath(); c.arc(x, y, 3.6, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      });
      T(c, ta, L('空氣進去', 'Air goes in'), VENT_X - 16, r.top - 34, WHITE, 22, 'right');
    }
  }

  /* ── 壓力箭頭：上方氣壓（向下，尖端在水面）、洞外大氣壓（向左）、液體壓力（珊瑚，向右） ── */
  function arrows(c, s) {
    const t = s.t, ly = levelY(t), pg = pGas(t);
    const ta = fin(s, 1, 1.2, 0.6), oa = fin(s, 1, 2.0, 0.6);
    M4.atmArrow(c, ARR_X, ly - 2, atmLen(pg), { dir: 'down', a: ta, brk: 14 });
    M4.atmArrow(c, HX, HY - 15, atmLen(ATM_P), { dir: 'left', a: oa, brk: 14 });
    /* 上方箭頭的標籤：開口＝大氣壓 1033；蓋緊＝P氣；第 3 步＝P氣 降低；通氣孔打開後＝大氣壓 1033 */
    const sealed = t > T_SEAL && t < T_VENT + 0.9;
    const lx = ARR_X + 18, lyy = ly - atmLen(pg) / 2 - 4;
    const aOpen = ta * (s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 2.8, 0.4) : s.n === 4 ? fin(s, 4, 9.3, 0.4) : 0);
    T(c, aOpen, L('大氣壓 1033', 'Air 1033'), lx, lyy, ATM, 22, 'left');
    const aGas = sealed ? (s.n === 2 ? fin(s, 2, 3.2, 0.5) : s.n === 4 ? fout(s, 4, 8.8, 0.4) : 1) : 0;
    const drop3 = s.n === 3 ? fin(s, 3, 1.4, 0.5) : s.n === 4 ? 1 : 0;
    T(c, aGas * (1 - drop3), L('P氣', 'P gas'), lx, lyy, ATM, 22, 'left');
    if (aGas * drop3 > 0.02) P(c, aGas * drop3, L('P氣 降低', 'P gas drops'), lx, lyy, PR, 22, 'left');
    /* 洞外大氣壓標籤 */
    T(c, oa, L('洞外大氣壓 1033', 'Outside air 1033'), HX + 10, HY - 44, ATM, 22, 'left');
    /* 液體壓力（∝ 深度；第 1 步長出來） */
    const g = grow(s, 1, 3.0, 3.8), d = depth(t);
    M4.pArrow(c, TX1, HY, AK * d * g, { dir: 'right', lw: 6 });
    const pa = fin(s, 1, 3.6, 0.5);
    const pl = s.n === 1 ? L('液體壓力 30', 'Water P 30') : L('液體壓力', 'Water P');
    T(c, pa, pl, TX1 - AK * d - 12, HY, PR, 22, 'right');
    /* 左側：水面到洞的垂直深度 30 cm（第 1 步） */
    const ma = fin(s, 1, 0.6, 0.6);
    if (ma > 0.02) withA(c, ma, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 2.5;
      c.setLineDash([6, 5]); c.beginPath(); c.moveTo(MARK_X, ly); c.lineTo(MARK_X, HY); c.stroke(); c.setLineDash([]);
      c.lineWidth = 2; c.beginPath(); c.moveTo(MARK_X - 7, ly); c.lineTo(MARK_X + 7, ly); c.moveTo(MARK_X - 7, HY); c.lineTo(MARK_X + 7, HY); c.stroke();
      c.strokeStyle = W5.rgba(YEL, 0.5); c.setLineDash([3, 5]); c.beginPath(); c.moveTo(MARK_X + 8, HY); c.lineTo(TX0 - WALL - 2, HY); c.stroke();
      c.restore();
    });
    T(c, ma, '30 cm', MARK_X - 10, (ly + HY) / 2, YEL, 22, 'right');
  }

  /* ── 右側壓力計（第 3 步出現）＋導管 ── */
  function gauge(c, s) {
    const a = s.n === 3 ? fin(s, 3, 0.2, 0.8) : s.n === 4 ? 1 : 0;
    if (a <= 0.02) return;
    const t = s.t;
    withA(c, a, () => {
      c.save();
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 10; c.beginPath(); c.moveTo(TX1 - 2, GYC); c.lineTo(GX - GR - 4, GYC); c.stroke();
      c.strokeStyle = '#b9c5cc'; c.lineWidth = 6; c.beginPath(); c.moveTo(TX1 - 2, GYC); c.lineTo(GX - GR - 4, GYC); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(TX1 + WALL + 2, GYC - 2); c.lineTo(GX - GR - 6, GYC - 2); c.stroke();
      c.restore();
    });
    const hg = s.n === 3 ? fin(s, 3, 0.2, 0.6) * (1 - 0.6 * fin(s, 3, 3.0, 1.0)) : 0.4;
    if (hg * a > 0.02) W5.glow(c, GX, GYC, 120, PR, 0.16 * hg * a);
    M4.gauge(c, GX, GYC, GR, { min: 990, max: 1040, val: pGas(t), mark: ATM_P, markLabel: '1033', from: t < T_VENT ? ATM_P : null, a });
    T(c, a, L('上方氣壓 P氣', 'Air above: P gas'), GX, GYC + GR + 30, WHITE, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('開口：噴水', 'Open top: it sprays'),
    () => L('蓋上密閉蓋', 'Seal the lid'),
    () => L('上方氣壓降低', 'Pressure above drops'),
    () => L('水流停止', 'The flow stops')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 4.6, 0.6) * fout(s, 2, 0, 0.4), L('大氣壓兩邊抵消 → 液體壓力把水推出', 'Air pressures cancel → water pressure pushes it out'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 5.6, 0.6) * fout(s, 3, 0, 0.4), L('蓋緊了：空氣進不來，水還在流', 'Sealed: no air gets in, water still flows'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 4.6, 0.6) * fout(s, 4, 0, 0.4), L('水流出 → 空氣膨脹 → 氣壓降低', 'Water out → air expands → pressure drops'), YEL, 480, M3.BOT_Y, 24);
    /* 平衡式（第 4 步，通氣孔打開前） */
    const ea = fin(s, 4, 1.4, 0.6) * fout(s, 4, 8.4, 0.4);
    if (ea > 0.02) W5.glow(c, 480, M3.BOT_Y, 220, YEL, 0.12 * ea);
    P(c, ea, L('P氣 ＋ 液體壓力 ＝ 洞外大氣壓', 'P gas + water pressure = outside air'), 480, M3.BOT_Y, YEL, 24);
    M3.caption(c, fin(s, 4, 9.0, 0.5), L('讓空氣進去 → 又噴了', 'Let air in → it sprays again'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    scene(c, s);
    flow(c, s);
    arrows(c, s);
    lidDraw(c, s);
    gauge(c, s);
    texts(c, s);
  }

  W5.register('seal', { canvas: 'cvs-seal', steps: DUR, draw });
})();
