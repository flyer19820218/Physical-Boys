/* ==================================================================
   mechanics_1 ｜ 伸長量與外力成正比（虎克定律）（cvs-hooke，960×540）
   四步：1 原長 10 公分 → 2 掛 20 gw → 3 掛 40、60 gw → 4 比值是定值
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：原長 10 cm；k＝10 gw/cm；20 gw→2 cm、40 gw→4 cm、60 gw→6 cm。
   語意色（全站）：外力 F＝珊瑚 COL.coral；伸長量 ΔX＝青 COL.teal；比值 k 強調＝黃。
   版面：左＝支架＋直尺（0 刻度對齊彈簧上端掛點）＋彈簧＋鉤碼；右上＝F–ΔX 座標圖；右下＝數據表。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   本檔不放 March：直尺 20 cm 高 300 px，人物放進來比例會失真（彈簧比人高），版面也已滿。

   ── 給 limit／graph 借用的畫法（都在本 IIFE 內，複製即可用，皆為純函式、參數化） ──
     RIG                      支架／彈簧／直尺幾何（SX 彈簧中心、Y0 掛點＝直尺 0、SC 每 cm 像素…）
     yOf(L)                   彈簧總長 L（cm）→ 畫布 y
     drawStand(c, a)          支架（底座、立柱、橫臂、掛鉤）
     drawRuler(c, a, maxCm)   直尺（0 在掛點，每 cm 小刻度、每 2 cm 數字）
     drawCoil(c, x, y0, y1, o) 立體線圈彈簧（固定圈數，伸長時圈距自動變大；o.dmg 0..1 過勞變紅）
     drawSpring(c, L, o)      掛點→線圈→下端掛環（L 為總長 cm），回傳下端 y
     drawWeights(c, yHook, n, o) n 個 20 gw 鉤碼串在掛環下方；o.enter 0..1 新鉤碼飛入
     bracket(c, x, y0, y1, col, a, grow)  直立量度括號（端點短橫線＋光暈）
     forceArrow(c, x, y0, len, a)         珊瑚色外力箭頭（向下）
     readout(c, L, a, txtA)   直尺左側讀數指標＋「12 cm」
     GRAPH, gx(F), gy(v), drawAxes(c, G, a)  座標圖（G 可換範圍：fmax/fstep/ymax/ystep）
     dataPoint(c, x, y, a, pop)            青色資料點（帶光暈、彈出）
     drawTable(c, rows, o)    數據表（欄：F、ΔX、F÷ΔX；逐列淡入）
     bounce(L0, L1, t)        掛上重物後的伸長：緩緩拉長＋小幅阻尼彈跳後定住（純函式）
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const X_COL = COL.teal;            /* 伸長量 ΔX：青 */
  const K_COL = COL.yellow;          /* 比值 k 的強調 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [7, 9, 10, 9];         /* 總長 35 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size || 22, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size || 22, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  /* 跨步時間：距離「第 n 步的第 t 秒」過了幾秒（後面的步驟視為很久以前、前面的步驟視為還沒到） */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));        /* 淡入 0..1 */
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);                               /* 淡出 1..0 */

  /* ── 金屬漸層 ── */
  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }

  /* ═══════════ 左側：支架、直尺、彈簧、鉤碼 ═══════════ */
  const RIG = {
    SX: 250,            /* 彈簧中心 x */
    Y0: 92,             /* 彈簧上端掛點 y（＝直尺 0 cm） */
    SC: 15,             /* 每 cm 幾 px */
    RX: 146, RW: 48,    /* 直尺左緣與寬（在彈簧左邊） */
    POST: 26,           /* 立柱中心 x */
    ARM_Y: 58,          /* 橫臂上緣 y */
    BASE_Y: 474,        /* 底座上緣 y（＝桌面線） */
    BX: 316,            /* 量度括號、外力箭頭的 x */
    WW: 84, WH: 30, WG: 6   /* 鉤碼寬、高、間隙 */
  };
  const yOf = Lcm => RIG.Y0 + Lcm * RIG.SC;

  function bench(c, a) {
    withA(c, a, () => {
      const y = RIG.BASE_Y + 16;
      const g = c.createLinearGradient(0, y, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(0, y, 960, 540 - y);
      const e = c.createLinearGradient(0, 0, 960, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.30)'); e.addColorStop(0.45, 'rgba(246,243,234,0.22)'); e.addColorStop(1, 'rgba(246,243,234,0.06)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke();
    });
  }

  function drawStand(c, a) {
    withA(c, a, () => {
      const { POST, ARM_Y, BASE_Y, SX } = RIG;
      /* 底座 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, BASE_Y, BASE_Y + 16); W5.rr(c, 6, BASE_Y, 340, 16, 7); c.fill(); c.restore();
      /* 立柱 */
      c.fillStyle = steelV(c, POST - 8, POST + 8); c.fillRect(POST - 8, ARM_Y + 6, 16, BASE_Y - ARM_Y - 6);
      /* 橫臂 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, ARM_Y, ARM_Y + 16); W5.rr(c, POST - 14, ARM_Y, SX + 40 - (POST - 14), 16, 8); c.fill(); c.restore();
      /* 掛鉤座 */
      c.fillStyle = '#d6dfdc'; W5.rr(c, SX - 9, ARM_Y + 14, 18, 8, 3); c.fill();
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(SX, ARM_Y + 20); c.lineTo(SX, RIG.Y0); c.stroke();
      /* 直尺夾 */
      c.fillStyle = '#c9d3d0'; c.fillRect(RIG.RX + RIG.RW / 2 - 3, ARM_Y + 14, 6, RIG.Y0 - 6 - (ARM_Y + 14));
    });
  }

  function drawRuler(c, a, maxCm) {
    maxCm = maxCm || 20;
    withA(c, a, () => {
      const { RX, RW } = RIG, top = RIG.Y0 - 6, h = maxCm * RIG.SC + 12;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(RX, 0, RX + RW, 0);
      g.addColorStop(0, '#cfc298'); g.addColorStop(1, '#f4ecd0');
      c.fillStyle = g; W5.rr(c, RX, top, RW, h, 4); c.fill(); c.restore();
      c.strokeStyle = '#6b6240'; c.lineWidth = 2; W5.rr(c, RX, top, RW, h, 4); c.stroke();
      c.strokeStyle = '#3a361f';
      for (let k = 0; k <= maxCm; k++) {               /* 刻度在右緣（朝向彈簧） */
        const y = yOf(k), big = k % 2 === 0;
        c.lineWidth = big ? 2.2 : 1.4;
        c.beginPath(); c.moveTo(RX + RW, y); c.lineTo(RX + RW - (big ? 15 : 8), y); c.stroke();
      }
      for (let k = 0; k <= maxCm; k += 2) W5.label(c, String(k), RX + 18, yOf(k), WHITE, 20, 'center', true);
      W5.label(c, 'cm', RX + RW / 2, top + h + 26, DIM, 22, 'center', true);
    });
  }

  /* 立體線圈：固定圈數，所以拉長時圈距自然變大；前半圈亮、後半圈暗 */
  function drawCoil(c, x, y0, y1, o) {
    o = o || {};
    const turns = o.turns || 13, amp = o.amp || 18, n = turns * 14, dmg = o.dmg || 0;
    const f1 = W5.mix('#eef4f1', '#d8434a', dmg), f2 = W5.mix('#a8b8b3', '#a3202b', dmg), b1 = W5.mix('#5f6f6b', '#6a1a22', dmg);
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const cm = Math.cos((p0 + p1) / 2), front = cm > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (cm > 0.7 ? f1 : f2) : b1; c.lineWidth = front ? 4.2 : 3.2;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }

  /* 整條彈簧：上端短直線 → 線圈 → 下端短直線＋掛環；L 為總長（cm，量到下端掛環上緣） */
  function drawSpring(c, Lcm, o) {
    const { SX, Y0 } = RIG, yb = yOf(Lcm);
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(SX, Y0); c.lineTo(SX, Y0 + 6); c.moveTo(SX, yb - 6); c.lineTo(SX, yb); c.stroke();
    drawCoil(c, SX, Y0 + 6, yb - 6, o);
    c.beginPath(); c.arc(SX, yb + 6, 6, 0, TAU); c.stroke();
    return yb;
  }

  /* 一個 20 gw 鉤碼（鋼色圓柱側視＋上鉤）：cx 中心、top 本體上緣 */
  function weightBody(c, cx, top, a, txt) {
    withA(c, a, () => {
      const { WW, WH } = RIG, x = cx - WW / 2;
      /* 上鉤 */
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, top - 5); c.stroke();
      c.beginPath(); c.arc(cx, top - 9, 4.5, Math.PI * 0.5, Math.PI * 2.1); c.stroke();
      /* 本體 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(x, 0, x + WW, 0);
      g.addColorStop(0, '#4a5553'); g.addColorStop(0.3, '#b9c4c0'); g.addColorStop(0.55, '#8b9894'); g.addColorStop(1, '#3d4745');
      c.fillStyle = g; W5.rr(c, x, top, WW, WH, 6); c.fill(); c.restore();
      c.strokeStyle = 'rgba(20,30,28,0.9)'; c.lineWidth = 1.5; W5.rr(c, x, top, WW, WH, 6); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, top + 1.5); c.lineTo(x + WW - 6, top + 1.5); c.stroke();
      /* 下環 */
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(cx, top + WH + 3, 3, 0, TAU); c.stroke();
    });
    T(c, a, txt || '20 gw', cx, top + RIG.WH / 2 + 1, WHITE, 22, 'center', true);
  }

  /* n 個鉤碼串在下端掛環下方；o.enter 0..1：第 n+1 個從右上方飛入（未掛上） */
  function drawWeights(c, yb, n, o) {
    o = o || {};
    const { SX, WH, WG } = RIG, top0 = yb + 22, pitch = WH + WG + 6;
    for (let i = 0; i < n; i++) weightBody(c, SX, top0 + i * pitch, 1);
    const e = o.enter || 0;
    if (e > 0.02 && e < 1) {
      const k = ease(e);
      c.save(); c.translate((1 - k) * 120, -(1 - k) * 34);
      weightBody(c, SX, top0 + n * pitch, k);
      c.restore();
    }
    return top0 + Math.max(0, n) * pitch - WG - 6;   /* 最下方鉤碼底 */
  }

  /* 直立量度括號：x、上端 y0、下端 y1；grow 0..1 由上往下長出 */
  function bracket(c, x, y0, y1, col, a, grow) {
    if (a <= 0.02) return;
    grow = grow == null ? 1 : grow;
    const ye = lerp(y0, y1, grow);
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
    c.shadowColor = W5.rgba(col, 0.7); c.shadowBlur = 8;
    c.beginPath(); c.moveTo(x - 7, y0); c.lineTo(x + 7, y0); c.moveTo(x, y0); c.lineTo(x, ye); c.stroke();
    if (grow > 0.98) { c.beginPath(); c.moveTo(x - 7, y1); c.lineTo(x + 7, y1); c.stroke(); }
    c.restore();
  }

  /* 水平虛線（端到端標記用） */
  function dash(c, x0, x1, y, col, a, lw) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.setLineDash([6, 6]); c.strokeStyle = col; c.lineWidth = lw || 2;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
  }

  /* 外力箭頭（珊瑚、向下、帶光暈） */
  function forceArrow(c, x, y0, len, a) {
    if (a <= 0.02 || len < 4) return;
    const head = Math.min(18, Math.max(10, len * 0.4)), lw = 7;
    c.save(); c.globalAlpha *= a;
    c.shadowColor = W5.rgba(F_COL, 0.8); c.shadowBlur = 14; c.fillStyle = F_COL;
    const shaft = Math.max(0, len - head);
    if (shaft > 0) { W5.rr(c, x - lw / 2, y0, lw, shaft + 2, 3); c.fill(); }
    c.beginPath(); c.moveTo(x, y0 + len); c.lineTo(x - head * 0.75, y0 + len - head); c.lineTo(x + head * 0.75, y0 + len - head); c.closePath(); c.fill();
    c.restore();
  }

  /* 直尺讀數：從彈簧下端拉虛線到直尺，直尺左側小三角＋讀數 */
  function readout(c, Lcm, a, txtA, txt) {
    if (a <= 0.02) return;
    const { RX, RW, SX } = RIG, y = yOf(Lcm);
    withA(c, a, () => {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = WHITE; c.lineWidth = 2;
      c.beginPath(); c.moveTo(SX - 10, y); c.lineTo(RX + RW - 2, y); c.stroke(); c.restore();
      c.fillStyle = WHITE;
      c.beginPath(); c.moveTo(RX - 2, y); c.lineTo(RX - 15, y - 8); c.lineTo(RX - 15, y + 8); c.closePath(); c.fill();
    });
    P(c, a * txtA, txt, RX - 18, y, WHITE, 22, 'right', true);
  }

  /* 掛上重物後的伸長：先緩緩拉長、帶一點阻尼彈跳後定住（t<0 時為 L0） */
  function bounce(L0, L1, t) {
    if (t <= 0) return L0;
    return L1 - (L1 - L0) * Math.exp(-2.8 * t) * Math.cos(5.2 * t);
  }

  /* ═══════════ 右側：座標圖、數據表 ═══════════ */
  const GRAPH = { x0: 575, x1: 905, y0: 92, y1: 250, fmax: 80, fstep: 20, ymax: 8, ystep: 2 };
  const gx = F => GRAPH.x0 + F / GRAPH.fmax * (GRAPH.x1 - GRAPH.x0);
  const gy = v => GRAPH.y1 - v / GRAPH.ymax * (GRAPH.y1 - GRAPH.y0);

  function drawAxes(c, G, a) {
    withA(c, a, () => {
      const X = F => G.x0 + F / G.fmax * (G.x1 - G.x0), Y = v => G.y1 - v / G.ymax * (G.y1 - G.y0);
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, G.x0, G.y0 - 10, G.x1 - G.x0 + 6, G.y1 - G.y0 + 10, 6); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(163,184,176,0.18)';
      for (let F = G.fstep; F <= G.fmax; F += G.fstep) { c.beginPath(); c.moveTo(X(F), G.y0 - 6); c.lineTo(X(F), G.y1); c.stroke(); }
      for (let v = G.ystep; v <= G.ymax; v += G.ystep) { c.beginPath(); c.moveTo(G.x0, Y(v)); c.lineTo(G.x1, Y(v)); c.stroke(); }
      for (let F = 0; F <= G.fmax; F += G.fstep) W5.label(c, String(F), X(F), G.y1 + 20, WHITE, 20, 'center', true);
      for (let v = G.ystep; v <= G.ymax; v += G.ystep) W5.label(c, String(v), G.x0 - 12, Y(v), WHITE, 20, 'right', true);
      c.strokeStyle = WHITE; c.fillStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(G.x0, G.y1); c.lineTo(G.x1 + 12, G.y1); c.moveTo(G.x0, G.y1); c.lineTo(G.x0, G.y0 - 18); c.stroke();
      c.beginPath(); c.moveTo(G.x1 + 22, G.y1); c.lineTo(G.x1 + 9, G.y1 - 7); c.lineTo(G.x1 + 9, G.y1 + 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(G.x0, G.y0 - 28); c.lineTo(G.x0 - 7, G.y0 - 15); c.lineTo(G.x0 + 7, G.y0 - 15); c.closePath(); c.fill();
    });
    T(c, a, L('外力 F（gw）', 'Force F (gw)'), (G.x0 + G.x1) / 2, G.y1 + 50, F_COL, 22);
    T(c, a, L('伸長量 ΔX（cm）', 'Extension ΔX (cm)'), G.x0 + 18, G.y0 - 30, X_COL, 22, 'left');
  }

  function dataPoint(c, x, y, a, pop) {
    if (a <= 0.02) return;
    const r = 8 * (1 + 0.5 * Math.sin(Math.PI * clamp01(pop == null ? 1 : pop)));
    c.save(); c.globalAlpha *= a;
    W5.glow(c, x, y, 26, X_COL, 0.45);
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 2.5, 0, TAU); c.fill();
    W5.ball(c, x, y, r, X_COL);
    c.restore();
  }

  /* 數據表：rows = [{F, dx, a, ra, rp}]（a 該列透明度、ra 比值欄透明度、rp 比值欄高亮）；o.headA、o.kA */
  const TAB = { x: 525, y: 330, colW: 130, headH: 40, rowH: 36 };
  function drawTable(c, rows, o) {
    const { x, y, colW, headH, rowH } = TAB, ncol = 3;
    const headA = o.headA, kA = o.kA || 0;
    if (headA <= 0.02) return;
    const w2 = colW * 2, w3 = colW * ncol, h = headH + rowH * rows.length;
    withA(c, headA, () => {
      c.fillStyle = 'rgba(11,26,21,0.72)'; W5.rr(c, x, y, lerp(w2, w3, kA), h, 10); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.28)'; c.lineWidth = 1.5; W5.rr(c, x, y, lerp(w2, w3, kA), h, 10); c.stroke();
      c.beginPath(); c.moveTo(x + 8, y + headH); c.lineTo(x + lerp(w2, w3, kA) - 8, y + headH); c.stroke();
      c.beginPath(); c.moveTo(x + colW, y + 8); c.lineTo(x + colW, y + h - 8); c.stroke();
      if (kA > 0.02) { c.globalAlpha *= kA; c.beginPath(); c.moveTo(x + w2, y + 8); c.lineTo(x + w2, y + h - 8); c.stroke(); }
    });
    /* 比值欄高亮 */
    if (kA > 0.02) {
      const hi = o.hi || 0;
      withA(c, kA * hi, () => {
        c.save(); c.shadowColor = W5.rgba(K_COL, 0.8); c.shadowBlur = 16;
        c.strokeStyle = K_COL; c.lineWidth = 2.5; W5.rr(c, x + w2 + 4, y + 4, colW - 8, h - 8, 8); c.stroke(); c.restore();
        c.fillStyle = W5.rgba(K_COL, 0.08); W5.rr(c, x + w2 + 4, y + 4, colW - 8, h - 8, 8); c.fill();
      });
    }
    const cx = i => x + colW * i + colW / 2;
    T(c, headA, 'F (gw)', cx(0), y + headH / 2, F_COL, 22, 'center', true);
    T(c, headA, 'ΔX (cm)', cx(1), y + headH / 2, X_COL, 22, 'center', true);
    T(c, headA * kA, 'F ÷ ΔX', cx(2), y + headH / 2, K_COL, 22, 'center', true);
    rows.forEach((r, i) => {
      const ry = y + headH + rowH * i + rowH / 2;
      T(c, r.a, String(r.F), cx(0), ry, F_COL, 22, 'center', true);
      T(c, r.a, String(r.dx), cx(1), ry, X_COL, 22, 'center', true);
      if (r.ra > 0.02) {
        const left = r.F + '÷' + r.dx + '=';
        const w1 = W5.tw(c, left, 22, true), w2b = W5.tw(c, '10', 22, true), x0 = cx(2) - (w1 + w2b) / 2;
        T(c, r.ra, left, x0, ry, DIM, 22, 'left', true);
        T(c, r.ra, '10', x0 + w1, ry, K_COL, 22, 'left', true);
      }
    });
  }

  /* ═══════════ 場景狀態（純函式：由 s 算出） ═══════════ */
  /* 掛上時刻（秒）：步驟 2 第 1 個；步驟 3 第 2、3 個 */
  const ATT = [[2, 2.0], [3, 1.6], [3, 5.4]];
  const ENTER = 1.1;                     /* 鉤碼飛入所需秒數（在掛上之前） */
  const SETTLE = 1.6;                    /* 掛上後到讀數出現 */

  function scene(s) {
    let n = 0, Lc = 10, enter = 0, lastAtt = -99;
    ATT.forEach(([st, t], i) => {
      const dt = since(s, st, t);
      if (dt >= 0) { n = i + 1; lastAtt = dt; }
      else if (dt > -ENTER) enter = 1 + dt / ENTER;
    });
    if (n > 0) Lc = bounce(10 + 2 * (n - 1), 10 + 2 * n, lastAtt);
    /* 文字讀數：定住後才出現；下一個鉤碼要來時先淡出 */
    let txtA = n > 0 ? ease(clamp01((lastAtt - SETTLE) / 0.5)) : 0;
    if (enter > 0) txtA *= 1 - ease(clamp01(enter / 0.35));
    return { n, L: Lc, enter, txtA, F: 20 * n, dx: 2 * n, lastAtt };
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = scene(s);
    const a1 = s.n === 1 ? s.k : 1;                       /* 第 1 步整個場景淡入 */

    /* 左側柔光背板 */
    withA(c, a1, () => {
      const gl = c.createRadialGradient(240, 270, 20, 240, 270, 360);
      gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, 508);
    });
    bench(c, a1);
    drawStand(c, a1);
    drawRuler(c, a1, 20);

    /* 原長：灰虛線（直尺→彈簧右側）＋灰括號＋標籤 */
    const aO = fin(s, 1, 1.3, 0.6), gO = ease(seg(since(s, 1, 1.3), 0, 1.0));
    dash(c, RIG.RX + RIG.RW, RIG.BX + 8, yOf(10), 'rgba(163,184,176,0.85)', fin(s, 1, 2.2, 0.5));
    bracket(c, RIG.BX, RIG.Y0, yOf(10), DIM, aO, gO);
    T(c, fin(s, 1, 2.2, 0.5), L('原長', 'Natural length'), RIG.BX + 16, yOf(5) - 20, DIM, 22, 'left');
    P(c, fin(s, 1, 2.2, 0.5), '10 cm', RIG.BX + 14, yOf(5) + 18, WHITE, 22, 'left', true);

    /* 彈簧與鉤碼 */
    let yb;
    withA(c, a1, () => {
      yb = drawSpring(c, S.L);
      drawWeights(c, yb, S.n, { enter: S.enter });
    });
    if (yb === undefined) yb = yOf(S.L);

    /* 直尺讀數（第 1 步讀 10 cm；之後讀現在的長度） */
    const rdA = s.n === 1 ? fin(s, 1, 2.6, 0.5) : 1;
    const rdTxt = s.n === 1 ? 1 : (S.n === 0 ? 1 - fin(s, 2, 0.6, 0.4) : S.txtA);
    readout(c, S.L, rdA, rdTxt, (S.n === 0 ? 10 : 10 + S.dx) + ' cm');

    /* ΔX 括號（從原長線量到下端）＋珊瑚外力箭頭 */
    if (S.n > 0) {
      const bA = fin(s, 2, 2.0 + SETTLE - 0.2, 0.5);
      bracket(c, RIG.BX, yOf(10), yb, X_COL, bA, 1);
      P(c, bA * S.txtA, 'ΔX = ' + S.dx + ' cm', RIG.BX + 14, (yOf(10) + yOf(10 + S.dx)) / 2, X_COL, 22, 'left', true);
      const fLen = 46 + S.F * 0.9;
      const grow = ease(clamp01(S.lastAtt / 0.5));
      const fLenNow = lerp(S.n > 1 ? 46 + (S.F - 20) * 0.9 : 0, fLen, grow);
      const fy0 = yb + 22;
      forceArrow(c, RIG.BX, fy0, fLenNow, bA);
      P(c, bA * S.txtA, 'F = ' + S.F + ' gw', RIG.BX + 18, fy0 + fLen * 0.55, F_COL, 22, 'left', true);
    }

    /* ── 右側：座標圖 ── */
    const axA = s.n === 1 ? fin(s, 1, 3.0, 0.8) : 1;
    drawAxes(c, GRAPH, axA);

    /* 資料點出現時刻 */
    const PT = [[2, 2.0 + SETTLE + 1.0], [3, 1.6 + SETTLE + 0.9], [3, 5.4 + SETTLE + 0.9]];
    const ROW = [[2, 2.0 + SETTLE + 0.4], [3, 1.6 + SETTLE + 0.3], [3, 5.4 + SETTLE + 0.3]];

    /* 過原點的直線（第 3 步最後畫出） */
    const lnT = since(s, 3, 8.4), lnA = ease(clamp01(lnT / 0.9));
    if (lnA > 0.02) {
      const F1 = lerp(0, 72, lnA);
      c.save(); c.strokeStyle = W5.rgba(X_COL, 0.85); c.lineWidth = 3; c.lineCap = 'round';
      c.shadowColor = W5.rgba(X_COL, 0.6); c.shadowBlur = 8;
      c.beginPath(); c.moveTo(gx(0), gy(0)); c.lineTo(gx(F1), gy(F1 / 10)); c.stroke(); c.restore();
      /* 原點發亮 */
      const og = ease(seg(lnT, 0, 0.5)) * (1 - 0.6 * ease(seg(lnT, 1.0, 1.6)));
      withA(c, 1, () => { W5.glow(c, gx(0), gy(0), 30, WHITE, 0.55 * og + 0.15 * lnA); });
      T(c, ease(seg(lnT, 0.6, 1.1)), L('直線通過原點', 'Through origin'), GRAPH.x1, gy(1.1), X_COL, 22, 'right');
    }

    /* 新點的投影虛線（只在出現後 1.6 秒內） */
    PT.forEach(([st, t], i) => {
      const dt = since(s, st, t);
      if (dt < 0) return;
      const F = 20 * (i + 1), v = 2 * (i + 1), x = gx(F), y = gy(v);
      const ga = ease(seg(dt, 0, 0.3)) * (1 - ease(seg(dt, 1.2, 1.7)));
      if (ga > 0.02) {
        c.save(); c.globalAlpha *= ga; c.setLineDash([5, 5]); c.lineWidth = 2;
        c.strokeStyle = W5.rgba(F_COL, 0.9); c.beginPath(); c.moveTo(x, y); c.lineTo(x, GRAPH.y1); c.stroke();
        c.strokeStyle = W5.rgba(X_COL, 0.9); c.beginPath(); c.moveTo(x, y); c.lineTo(GRAPH.x0, y); c.stroke();
        c.restore();
      }
      dataPoint(c, x, y, ease(seg(dt, 0, 0.25)), seg(dt, 0, 0.45));
    });

    /* ── 第 4 步：倍數關係 ── */
    const x2A = fin(s, 4, 5.0, 0.6);
    if (x2A > 0.02) {
      withA(c, x2A, () => {
        c.save(); c.setLineDash([5, 5]); c.lineWidth = 2;
        [20, 40].forEach(F => {
          c.strokeStyle = W5.rgba(F_COL, 0.8); c.beginPath(); c.moveTo(gx(F), gy(F / 10)); c.lineTo(gx(F), GRAPH.y1); c.stroke();
          c.strokeStyle = W5.rgba(X_COL, 0.8); c.beginPath(); c.moveTo(gx(F), gy(F / 10)); c.lineTo(GRAPH.x0, gy(F / 10)); c.stroke();
        });
        c.restore();
        /* 橫軸 ×2 弧（珊瑚）與縱軸 ×2 弧（青） */
        c.save(); c.lineWidth = 2.5; c.strokeStyle = F_COL; c.fillStyle = F_COL;
        const xa = gx(20), xb = gx(40), yA = GRAPH.y1 - 8;
        c.beginPath(); c.moveTo(xa, yA); c.quadraticCurveTo((xa + xb) / 2, yA - 30, xb - 3, yA - 2); c.stroke();
        c.beginPath(); c.moveTo(xb, yA); c.lineTo(xb - 11, yA - 6); c.lineTo(xb - 6, yA - 12); c.closePath(); c.fill();
        c.strokeStyle = X_COL; c.fillStyle = X_COL;
        const ya = gy(2), yb2 = gy(4), xA = GRAPH.x0 + 8;
        c.beginPath(); c.moveTo(xA, ya); c.quadraticCurveTo(xA + 30, (ya + yb2) / 2, xA + 2, yb2 + 3); c.stroke();
        c.beginPath(); c.moveTo(xA, yb2); c.lineTo(xA + 6, yb2 + 11); c.lineTo(xA + 12, yb2 + 6); c.closePath(); c.fill();
        c.restore();
      });
      T(c, x2A, '×2', (gx(20) + gx(40)) / 2, GRAPH.y1 - 38, F_COL, 22, 'center', true);
      T(c, x2A, '×2', GRAPH.x0 + 40, (gy(2) + gy(4)) / 2, X_COL, 22, 'left', true);
      T(c, fin(s, 4, 5.6, 0.6), L('外力變 2 倍', 'Force ×2'), GRAPH.x0 + 22, GRAPH.y0 + 8, F_COL, 22, 'left');
      T(c, fin(s, 4, 6.2, 0.6), L('伸長量也變 2 倍', 'Extension ×2 too'), GRAPH.x0 + 22, GRAPH.y0 + 40, X_COL, 22, 'left');
    }

    /* ── 數據表 ── */
    const headA = fin(s, 2, 2.0 + SETTLE + 0.1, 0.5);
    const kA = fin(s, 4, 0.5, 0.8);
    const rows = [0, 1, 2].map(i => {
      const dt = since(s, ROW[i][0], ROW[i][1]);
      const rt = since(s, 4, 1.5 + i * 0.7);
      return { F: 20 * (i + 1), dx: 2 * (i + 1), a: ease(clamp01(dt / 0.45)), ra: ease(clamp01(rt / 0.45)) };
    });
    drawTable(c, rows, { headA, kA, hi: fin(s, 4, 3.6, 0.6) });

    /* k 定值 pill */
    const kP = fin(s, 4, 3.9, 0.6);
    if (kP > 0.02) {
      const pulse = 1 + 0.04 * Math.sin(Math.PI * clamp01(since(s, 4, 3.9) / 0.6));
      c.save(); c.translate(715, 506); c.scale(pulse, pulse); c.translate(-715, -506);
      W5.glow(c, 715, 506, 150, K_COL, 0.10 * kP);
      P(c, kP, L('F／ΔX ＝ k ＝ 10 gw/cm（定值）', 'F / ΔX = k = 10 gw/cm (constant)'), 715, 506, K_COL, 22, 'center');
      c.restore();
    }
  }

  W5.register('hooke', { canvas: 'cvs-hooke', steps: DUR, draw });
})();
