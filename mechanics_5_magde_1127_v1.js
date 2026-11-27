/* ==================================================================
   mechanics_5 ｜ 大氣壓力：馬德堡半球：看不見的巨大壓力（cvs-magde，960×540）
   四步：1 合起來還沒抽氣 → 2 抽走內部空氣 → 3 大氣壓往內壓 → 4 八匹馬拉開
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption／shake、M4.L／T／P／withA／fin／fout／grow／pPill、
        M5.airSea／gasDots／pArrowAt／pressRing／halfGauge／burst／hemis／horse（hemis、horse、halfGauge、burst 由 magde 補進 M5）。

   數字（照簡報，只有這三個）：外面約 1 atm（1033.6 gw/cm²）、裡面 ≈ 0、左右各 8 匹馬。不寫拉力的數字。
   第 1 步（11 s）：球內 34 顆空氣分子（密）；u 1.0 起內外各 8 支等長珊瑚箭頭（外→內、內→外）＋「裡面 ＝ 外面，壓力相同」；
     u 4.6 左右各 1 匹馬輕拉：u 5.0～6.6 兩半球分開到 40 px，u 7.6～9.0 合回去；字卡 u 8.4。
   第 2 步（11 s）：抽氣機＋軟管出現（u 0.3），手動泵的把手上下打；u 1.6～9.2 分子一顆顆從閥口經軟管被抽走（34 → 2 顆）；
     閥上方的半圓錶讀數 ＝ 球內剩下的分子比例 × 1 atm（1 → 0.06，顯示「≈ 0」）；字卡 u 7.0。
   第 3 步（11 s）：抽氣機拆掉；球外 15 支（16 支扣掉閥那一支）粗珊瑚箭頭由四面八方指向球心（u 0.6～2.4 長出、之後呼吸）；
     「外面：約 1 atm（1033.6 gw/cm²）」u 2.2、「裡面：≈ 0」u 3.2；u 5.2 起兩支大箭頭由左右壓向接縫＋「兩半球被壓在一起」；字卡 u 6.4。
   第 4 步（12 s）：其餘 7＋7 匹馬進場（u 0～1.4）；u 1.4～7.0 全部往外拉：身體前傾、腳步、繩子繃直抖動、球微微晃（拉不開）、u 3.0 起汗滴；
     u 7.0「碰！」兩半球分開 120 px、馬往前衝；u 7.45 兩半球掉到地上；空氣分子 u 7.3～9.3 湧進半球、錶回到 1 atm；字卡 u 8.6。
   比例尺：示意圖；第 1 步內外箭頭等長（34 px）只表示「一樣大」；第 3 步外面箭頭 46 px、裡面沒有箭頭（≈ 0）。
   版面：地面 GY 470；球心 (480,320)、半徑 R 95（直徑 190）、殼厚 9、接縫兩圈凸緣；球下方木柱 x 468～492；
     閥在右半球頂端偏右（M5.HEMI_VALVE），閥上方 52 px 是半圓錶（半徑 40）；抽氣機在右邊地上 x 806～846；
     馬（約 44×34 px）：前排蹄底 y 468、後排 y 452（0.92 倍、較暗）；左隊前排中心 x 262/206/150/94、後排 234/178/122/66，右隊左右對稱。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.hemis || !M5.horse) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PR = M5.PC.pressure;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 470, CX = 480, CY = 320, R = 95, SH = 9;
  const FRONT = [262, 206, 150, 94], BACK = [234, 178, 122, 66], FBY = 468, BBY = 452, BS = 0.92;
  const VA = M5.HEMI_VALVE;
  const NDOT = 34, FRAC = 0.94;
  const PUMP_X = 826, PUMP_TOP = 330;
  const BANG = 7.0;

  /* ── 時間函式（純函式） ── */
  function gapOf(s) {                                   /* 兩半球分開的距離 px */
    if (s.n === 1) return 40 * ease(clamp01((s.u - 5.0) / 1.6)) * (1 - ease(clamp01((s.u - 7.6) / 1.4)));
    if (s.n === 4) return 120 * ease(clamp01((s.u - BANG) / 0.5));
    return 0;
  }
  const pumpK = s => (s.n < 2 ? 0 : s.n > 2 ? 1 : clamp01((s.u - 1.6) / 7.6));
  const refillK = s => (s.n === 4 ? clamp01((s.u - BANG - 0.3) / 2.0) : 0);
  const pullOn = s => (s.n === 1 ? ease(clamp01((s.u - 4.6) / 0.5)) * (1 - ease(clamp01((s.u - 7.8) / 0.8)))
    : s.n === 4 ? ease(clamp01((s.u - 1.4) / 0.4)) : 0);
  const shakeOf = s => (s.n === 4 && s.u > 1.6 && s.u < BANG ? M3.shake(s.u, 1.6, 34, 2) : 0);
  /* 爆開後兩半球掉到地上（凸緣下緣碰到地面 GY），落地小彈一下 */
  const DROP = GY - (CY + R + 9);
  function fallOf(s) {
    if (s.n !== 4 || s.u < BANG + 0.45) return 0;
    const q = s.u - BANG - 0.45, tf = 0.42;
    if (q < tf) return DROP * (q / tf) * (q / tf);
    const b = q - tf; return DROP - 7 * Math.max(0, Math.sin(Math.min(Math.PI, b * 9))) * Math.exp(-b * 3);
  }

  /* 一匹馬的狀態：i＝排內第幾匹（0＝最靠近球）、row 0 前排／1 後排、side －1 左隊／＋1 右隊 */
  function horseState(s, i, row, side) {
    const base = row === 0 ? FRONT[i] : BACK[i], by = row === 0 ? FBY : BBY, sc = row === 0 ? 1 : BS;
    let x = side < 0 ? base : 960 - base;
    let a = 1, lean = 0, stride = 0, sweat = 0;
    const lead = i === 0 && row === 0;
    const pull = pullOn(s), g = gapOf(s);
    if (s.n === 1) {
      if (!lead) return null;
      a = fin(s, 1, 0.2, 0.6); lean = 0.6 * pull; stride = 0.5 * pull;
      x += side * g / 2;
    } else if (s.n === 2 || s.n === 3) {
      if (!lead) return null;
      a = s.n === 3 ? 1 - 0.35 * fin(s, 3, 0, 0.6) : 1;
    } else {
      if (!lead) {
        const k = ease(clamp01((s.u - 0.1 * (i + row * 0.5)) / 1.0));
        a = k; x += side * 60 * (1 - k);
      } else a = fin(s, 4, 0, 0.6) * 0.35 + 0.65;
      lean = pull; stride = pull;
      sweat = clamp01((s.u - 3.0) / 0.8) * (s.u < BANG + 1.5 ? 1 : 1 - clamp01((s.u - BANG - 1.5) / 1.0));
      const lurch = s.u > BANG ? 30 * ease(clamp01((s.u - BANG) / 0.6)) - 10 * ease(clamp01((s.u - BANG - 0.6) / 1.2)) : 0;
      x += side * (lurch + M3.shake(s.u, 1.2, 25, i + row * 4));
      if (s.u > BANG) lean = pull * (1 - 0.8 * ease(clamp01((s.u - BANG - 0.4) / 1.0)));
    }
    return { x, by, s: sc, a, lean, stride, sweat, dir: side };
  }

  /* ═══════════ 背景：外面的空氣 ═══════════ */
  function air(c, s, H) {
    M5.airSea(c, 0, 34, 960, GY, { n: 130, seed: 23, t: s.t, dense: 0.3, fillA: 0.12, holes: [cc => H.clip(cc)] });
  }

  /* ═══════════ 馬＋繩子 ═══════════ */
  function rope(c, pts, taut, t, a) {
    if (a <= 0.02 || pts.length < 2) return;
    withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => {
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i - 1], q = pts[i], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
          const sag = (1 - taut) * (i === 1 ? 26 : 6), vib = taut > 0.9 ? Math.sin(t * 60 + i) * 0.8 : 0;
          c.quadraticCurveTo(mx, my + sag + vib, q[0], q[1]);
        }
      };
      path(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 6; c.stroke();
      path(); c.strokeStyle = taut > 0.9 ? '#e8d3a2' : '#c9b48a'; c.lineWidth = 3.4; c.stroke();
      c.restore();
    });
  }
  function team(c, s, side, ring) {
    const taut = pullOn(s) * (s.n === 4 && s.u > BANG ? 1 - ease(clamp01((s.u - BANG) / 0.3)) : 1);
    [1, 0].forEach(row => {                                /* 先畫後排 */
      const hs = [];
      for (let i = 0; i < 4; i++) { const h = horseState(s, i, row, side); if (h) hs.push(h); }
      if (!hs.length) return;
      const info = hs.map(h => M5.horse(c, h.x, h.by, { dir: h.dir, s: h.s, lean: h.lean, a: 0 }));   /* 先算頸圈位置（不畫） */
      const pts = [ring].concat(info.map(r => r.collar));
      rope(c, pts, taut, s.t, Math.min(...hs.map(h => h.a)));
      hs.forEach(h => M5.horse(c, h.x, h.by, { dir: h.dir, s: h.s, a: h.a * (row ? 0.85 : 1), lean: h.lean, gait: s.t * 9 + h.x * 0.05,
        stride: h.stride, sweat: h.sweat, t: s.t, col: row ? '#6f4a2e' : '#8a5a35' }));
    });
  }

  /* 軟管：閥口 → 往右上 → 抽氣機底部入口 */
  const hosePts = H => [H.valve, [H.valve[0] + 40, H.valve[1] - 8], [640, 208], [744, 216], [792, 266], [PUMP_X - 22, 440]];

  /* ═══════════ 球內空氣分子 ═══════════ */
  function inside(c, s, H, g) {
    const dy = shakeOf(s) + fallOf(s), shift = hx => [hx < CX ? -g / 2 : g / 2, dy];
    const t = s.t, Y = CY + dy;
    if (s.n === 4 && s.u > BANG) {                        /* 爆開後：空氣湧進兩個半球 */
      M5.gasDots(c, { circle: [CX, CY, R - SH - 6], n: NDOT, seed: 61, t, r: 3.4, col: '#ffffff', k: refillK(s), frac: FRAC, mode: 'in', win: 0.35,
        shift, paths: [[[CX, Y - 30], [CX - 10, Y - 120], [CX - 40, Y - 190]], [[CX, Y + 30], [CX + 14, Y + 90], [CX + 60, Y + 120]],
          [[CX, Y - 20], [CX + 20, Y - 130], [CX + 70, Y - 180]], [[CX, Y + 20], [CX - 20, Y + 90], [CX - 70, Y + 120]]] });
      return 1 - FRAC * (1 - refillK(s));
    }
    const k = pumpK(s);
    const path = [H.valveIn].concat(hosePts(H), [[PUMP_X, 440], [PUMP_X, PUMP_TOP + 4], [PUMP_X, PUMP_TOP - 40]]);
    return M5.gasDots(c, { circle: [CX, CY, R - SH - 6], n: NDOT, seed: 61, t, r: 3.4, col: '#ffffff', k, frac: FRAC, win: 0.28, shift, path });
  }

  /* ═══════════ 第 1 步：內外壓力相同 ═══════════ */
  function equal(c, s, g) {
    const back = s.n === 1 ? clamp01(fout(s, 1, 4.4, 0.5) + fin(s, 1, 9.0, 0.6)) : 0;   /* 馬拉的時候先收起來，合回去後再出現 */
    const a = s.n === 1 ? fin(s, 1, 1.0, 0.6) * back : 0;
    if (a <= 0.02) return;
    const gr = ease(clamp01((s.u - 1.0) / 0.8));
    M5.pressRing(c, CX, CY, R, { n: 8, ang0: Math.PI / 8, len: 34 * gr, gap: 5, lw: 6, a, t: s.t });
    M5.pressRing(c, CX, CY, R - SH, { n: 8, ang0: Math.PI / 8, len: 34 * gr, gap: 5, lw: 6, a, t: s.t + 0.4, out: true });
    P(c, fin(s, 1, 1.8, 0.5) * back, L('裡面 ＝ 外面，壓力相同', 'Inside = outside: same pressure'), 480, 176, PR, 22);
  }

  /* ═══════════ 抽氣機＋軟管、閥上的半圓錶 ═══════════ */
  function pump(c, s, H) {
    const a = s.n === 2 ? fin(s, 2, 0.3, 0.6) : s.n === 3 ? fout(s, 3, 0, 0.7) : 0;
    if (a <= 0.02) return;
    const hose = hosePts(H);
    withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(hose[0][0], hose[0][1]); for (let i = 1; i < hose.length; i++) c.lineTo(hose[i][0], hose[i][1]); };
      path(); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 14; c.stroke();
      path(); c.strokeStyle = '#5d6f7a'; c.lineWidth = 10; c.stroke();
      path(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.stroke();
      /* 手動泵：筒身＋底座＋上下打的 T 型把手 */
      const stroke = s.n === 2 && s.u > 1.4 && s.u < 9.4 ? 0.5 - 0.5 * Math.cos((s.u - 1.4) * 4.4) : 0;
      const hy = PUMP_TOP - 64 + 40 * stroke;
      c.fillStyle = '#6b7780'; c.fillRect(PUMP_X - 34, GY - 8, 68, 10);
      const g = c.createLinearGradient(PUMP_X - 20, 0, PUMP_X + 20, 0); g.addColorStop(0, '#9aa6ab'); g.addColorStop(0.4, '#e6edf1'); g.addColorStop(1, '#6f7d86');
      c.fillStyle = g; W5.rr(c, PUMP_X - 20, PUMP_TOP, 40, GY - 8 - PUMP_TOP, 5); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = '#c9d3d9'; c.lineWidth = 6; c.beginPath(); c.moveTo(PUMP_X, PUMP_TOP); c.lineTo(PUMP_X, hy); c.stroke();
      c.strokeStyle = '#4dd2ff'; c.lineWidth = 9; c.beginPath(); c.moveTo(PUMP_X - 26, hy); c.lineTo(PUMP_X + 26, hy); c.stroke();
      c.restore();
    });
    T(c, a, L('抽氣機', 'Pump'), PUMP_X, PUMP_TOP + 60, WHITE, 22, 'center');
    T(c, a * fin(s, 2, 1.6, 0.5), L('空氣被抽走', 'Air pumped out'), 690, 248, WHITE, 22, 'center');
  }
  function gauge(c, s, H, dens) {
    if (s.n === 1) return;
    const a = s.n === 2 ? fin(s, 2, 0.3, 0.6) : 1;
    const gx = H.valve[0], gy = H.valve[1] - 64;
    withA(c, a, () => {
      c.save(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 8; c.beginPath(); c.moveTo(gx, H.valve[1]); c.lineTo(gx, gy); c.stroke();
      c.strokeStyle = '#9aa6ab'; c.lineWidth = 5; c.beginPath(); c.moveTo(gx, H.valve[1]); c.lineTo(gx, gy); c.stroke(); c.restore();
    });
    M5.halfGauge(c, gx, gy, 40, { min: 0, max: 1, val: dens, labels: ['0', '1 atm'], a, from: s.n === 2 || s.n === 3 ? 1 : null });
    T(c, a, L('球內壓力', 'Inside pressure'), gx - 56, gy - 18, WHITE, 22, 'right');
    const za = dens < 0.12 && !(s.n === 4 && s.u > BANG + 0.5) ? a : 0;
    T(c, za, '≈ 0', gx + 56, gy - 18, PR, 22, 'left', true);
  }

  /* ═══════════ 第 3、4 步：外面的大氣壓力 ═══════════ */
  function outside(c, s, g) {
    const a = s.n === 3 ? fin(s, 3, 0.6, 0.5) : s.n === 4 ? (1 - fin(s, 4, BANG, 0.3)) : 0;
    if (a <= 0.02) return;
    const dim = s.n === 3 ? 1 - 0.65 * fin(s, 3, 5.2, 0.5) * fout(s, 3, 9.0, 0.6) : 0.6;
    const gr = s.n === 3 ? ease(clamp01((s.u - 0.6) / 1.8)) : 1;
    const skipV = th => { let d = Math.abs(th - ((VA % TAU) + TAU) % TAU); d = Math.min(d, TAU - d); return d < 0.16; };
    M5.pressRing(c, CX + 0, CY + shakeOf(s) * 0.3, R, { n: 16, ang0: Math.PI / 16, len: 46 * gr, gap: 6, lw: 7, a: a * dim, t: s.t, skip: skipV });
    /* 標籤 */
    const la = s.n === 3 ? fin(s, 3, 2.2, 0.5) : 0;
    M4.pPill(c, la, L('外面：約 1 atm', 'Outside: about 1 atm'), 190, 124, 22);
    M4.pPill(c, la, L('（1033.6 gw/cm²）', '(1033.6 gw/cm²)'), 190, 164, 22);
    P(c, s.n === 3 ? fin(s, 3, 3.2, 0.5) : 0, L('裡面：≈ 0', 'Inside: ≈ 0'), CX, CY, WHITE, 22);
    /* 兩支大箭頭壓向接縫 */
    const ba = s.n === 3 ? fin(s, 3, 5.2, 0.5) : 0, bg = s.n === 3 ? ease(clamp01((s.u - 5.2) / 0.8)) : 0;
    const by = CY - 50, tipX = Math.sqrt(R * R - 50 * 50) + 6;
    [-1, 1].forEach(sd => {
      const x1 = CX + sd * tipX, x0 = x1 + sd * 150 * bg;
      if (ba * bg <= 0.02) return;
      withA(c, ba, () => {
        W5.arrow(c, x0, by, x1, by, 'rgba(11,26,21,0.85)', 15, 36);
        c.save(); c.shadowColor = W5.rgba(PR, 0.85); c.shadowBlur = 14; W5.arrow(c, x0, by, x1, by, PR, 11, 32); c.restore();
      });
    });
    P(c, s.n === 3 ? fin(s, 3, 5.8, 0.5) : 0, L('兩半球被壓在一起', 'The halves are pressed together'), CX, 446, PR, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('合起來還沒抽氣', 'Joined, not pumped'),
    () => L('抽走內部空氣', 'Pump the air out'),
    () => L('大氣壓往內壓', 'The air presses inward'),
    () => L('八匹馬拉開', 'Eight horses pull')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.4, 0.6) * fout(s, 2, 0, 0.4), L('沒抽氣：內外壓力相同，輕輕就拉開', 'Not pumped: same pressure, they come apart easily'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 7.0, 0.6) * fout(s, 3, 0, 0.4), L('抽走內部空氣，裡面壓力趨近零', 'Pump the air out: the inside pressure nears zero'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 6.4, 0.6) * fout(s, 4, 0, 0.4), L('外面的大氣壓力把兩個半球壓緊', 'The outside air presses the halves together'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.6, 0.6), L('不是真空吸住，是外面的空氣壓住', 'Not sucked by a vacuum: pressed by the air outside'), YEL, 480, M3.BOT_Y, 24);
    /* 第 1 步：一匹馬輕輕拉 */
    T(c, fin(s, 1, 5.0, 0.4) * fout(s, 1, 8.0, 0.5), L('各 1 匹馬輕輕拉', 'One horse each side'), 480, 176, WHITE, 22);
    /* 第 4 步：左右各 8 匹馬、拉不開 */
    const na = fin(s, 4, 0.8, 0.5);
    P(c, na, L('左右各 8 匹馬', '8 horses on each side'), 190, 124, WHITE, 22);
    const ka = fin(s, 4, 3.2, 0.4) * fout(s, 4, BANG - 0.2, 0.2);
    T(c, ka, L('拉不開！', 'Won\'t budge!'), 760, 230 + M3.shake(s.u, 1.2, 30, 5), WHITE, 26);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const g = gapOf(s), dy = shakeOf(s) + fallOf(s);
    M3.backdrop(c, { gy: GY, cell: 40 });
    const H0 = M5.hemis(c, { cx: CX, cy: CY, R, shell: SH, gap: g, dy, a: 0 });   /* 先拿位置（不畫） */
    air(c, s, H0);
    M3.ground(c, GY);
    /* 球下方的木柱（支撐） */
    withA(c, 1, () => {
      c.save();
      const pg = c.createLinearGradient(CX - 12, 0, CX + 12, 0); pg.addColorStop(0, '#8a5d40'); pg.addColorStop(1, '#5a3622');
      c.fillStyle = pg; c.fillRect(CX - 12, CY + R + 8, 24, GY - CY - R - 8);
      c.fillStyle = '#6d4630'; W5.rr(c, CX - 28, GY - 8, 56, 10, 3); c.fill();
      c.restore();
    });
    pump(c, s, H0);
    const H = M5.hemis(c, { cx: CX, cy: CY, R, shell: SH, gap: g, dy, inner: 0.6 });
    const dens = inside(c, s, H, g);
    team(c, s, -1, H.ringL);
    team(c, s, 1, H.ringR);
    equal(c, s, g);
    outside(c, s, g);
    gauge(c, s, H, dens);
    if (s.n === 4) M5.burst(c, CX, CY, s.u - BANG, { r: 80 });
    texts(c, s);
  }

  W5.register('magde', { canvas: 'cvs-magde', steps: DUR, draw });
})();
