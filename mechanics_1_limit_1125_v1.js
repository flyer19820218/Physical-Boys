/* ==================================================================
   mechanics_1 ｜ 彈性限度與永久形變（cvs-limit，960×540）
   四步：1 限度內：會恢復 → 2 超過彈性限度 → 3 卸載：永久形變 → 4 換新彈簧
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：原長 10 cm；k＝10 gw/cm；彈性限度 80 gw（伸長 8 cm）；
     60 gw→6 cm（卸載後回 10 cm）；100 gw→約 14 cm（總長 24 cm）；卸載後停在 14 cm（永久形變 4 cm）。
   語意色（全站）：外力 F＝珊瑚；伸長量 ΔX＝青；過勞／超限＝偏紅暗色（線圈 #d8434a 系，字用 COL.red）；
     定律強調＝黃（同 hooke 的 k）。
   版面沿用 mechanics_1_hooke_1125_v1.js（支架、直尺、彈簧、鉤碼、括號、座標圖），
     只把每 cm 像素由 15 降為 13（直尺要放到 24 cm），座標圖改為 F 0～100、ΔX 0～14。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   人物：March（running 跑進來、touch_ready 伸手遞新彈簧；鏡像成面向左），只在第 4 步出現。

   ── 可給 graph 借用的畫法（都在本 IIFE 內，複製即可用，皆為純函式、參數化） ──
     RIG, yOf(L)              支架／彈簧／直尺幾何（SC＝13 px/cm，直尺 0～24 cm）
     bench / drawStand / drawRuler(c, a, maxCm)
     drawCoil(c, x, y0, y1, o)            立體線圈（o.dmg 0..1 過勞變紅＋暗紅光暈）
     springAt(c, x, yTop, Lcm, o)         任意位置／縮放的整條彈簧（o.scale、o.dmg），回傳下端 y
     weightBody(c, cx, top, a, txt)       一個鉤碼（文字可自訂，例如「60 gw」）
     bracket / dash / forceArrow / readout / bounce
     G, gx(F), gy(v), drawAxes(c, G, a)   座標圖（F 0～100、ΔX 0～14，可改範圍）
     limitMark(c, a, flash)               圖上的「彈性限度 80 gw」虛線＋超限區淡紅底
     ext(F) / Finv(dx)                    本彈簧的 F→ΔX（限度後平滑變陡）與反函數
     dataPoint(c, x, y, a, pop)           青色資料點
     drawMarch(c, pose, cx, a, flip, bob) March 站在地面線上
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const X_COL = COL.teal;            /* 伸長量 ΔX：青 */
  const LAW_COL = COL.yellow;        /* 定律強調（同 hooke 的 k） */
  const BAD = COL.red;               /* 超限／永久形變的警示字 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 10, 10, 9];        /* 總長 38 秒 */
  const LIMIT = 80;

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size || 22, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size || 22, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  /* 第 n 步的時間窗：a 秒淡入、b 秒淡出（b 可省略＝留到步驟結束） */
  function win(s, n, a, b, d) {
    if (s.n !== n) return 0;
    d = d || 0.4;
    return ease(clamp01((s.u - a) / d)) * (b == null ? 1 : 1 - ease(clamp01((s.u - b) / 0.3)));
  }

  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }

  /* ═══════════ 彈簧的 F–ΔX（限度內 10 gw/cm；超過 80 gw 後平滑變陡，100 gw → 14 cm） ═══════════ */
  function ext(F) { if (F <= LIMIT) return F / 10; const u = F - LIMIT; return 8 + 0.1 * u + 0.01 * u * u; }
  function Finv(dx) {
    if (dx <= 8) return dx * 10;
    return LIMIT + (-0.1 + Math.sqrt(0.01 + 0.04 * (dx - 8))) / 0.02;
  }

  /* ═══════════ 左側：支架、直尺、彈簧、鉤碼 ═══════════ */
  const RIG = {
    SX: 250, Y0: 78, SC: 13,
    RX: 146, RW: 48,
    POST: 26, ARM_Y: 44,
    BASE_Y: 492,
    BX: 316,
    WW: 84, WH: 30, WG: 6
  };
  const yOf = Lcm => RIG.Y0 + Lcm * RIG.SC;
  const GROUND = RIG.BASE_Y + 16;      /* 桌面線（March 也站在這條線上） */

  function bench(c, a) {
    withA(c, a, () => {
      const y = GROUND;
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
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, BASE_Y, BASE_Y + 16); W5.rr(c, 6, BASE_Y, 340, 16, 7); c.fill(); c.restore();
      c.fillStyle = steelV(c, POST - 8, POST + 8); c.fillRect(POST - 8, ARM_Y + 6, 16, BASE_Y - ARM_Y - 6);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, ARM_Y, ARM_Y + 16); W5.rr(c, POST - 14, ARM_Y, SX + 40 - (POST - 14), 16, 8); c.fill(); c.restore();
      c.fillStyle = '#d6dfdc'; W5.rr(c, SX - 9, ARM_Y + 14, 18, 8, 3); c.fill();
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(SX, ARM_Y + 20); c.lineTo(SX, RIG.Y0); c.stroke();
      c.fillStyle = '#c9d3d0'; c.fillRect(RIG.RX + RIG.RW / 2 - 3, ARM_Y + 14, 6, RIG.Y0 - 6 - (ARM_Y + 14));
    });
  }

  function drawRuler(c, a, maxCm) {
    maxCm = maxCm || 24;
    withA(c, a, () => {
      const { RX, RW } = RIG, top = RIG.Y0 - 6, h = maxCm * RIG.SC + 12;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(RX, 0, RX + RW, 0);
      g.addColorStop(0, '#cfc298'); g.addColorStop(1, '#f4ecd0');
      c.fillStyle = g; W5.rr(c, RX, top, RW, h, 4); c.fill(); c.restore();
      c.strokeStyle = '#6b6240'; c.lineWidth = 2; W5.rr(c, RX, top, RW, h, 4); c.stroke();
      c.strokeStyle = '#3a361f';
      for (let k = 0; k <= maxCm; k++) {
        const y = yOf(k), big = k % 2 === 0;
        c.lineWidth = big ? 2.2 : 1.4;
        c.beginPath(); c.moveTo(RX + RW, y); c.lineTo(RX + RW - (big ? 15 : 8), y); c.stroke();
      }
      for (let k = 0; k <= maxCm; k += 2) W5.label(c, String(k), RX + 18, yOf(k), WHITE, 20, 'center', true);
      W5.label(c, 'cm', RX + RW / 2, top + h + 24, DIM, 22, 'center', true);
    });
  }

  /* 立體線圈：固定圈數（拉長時圈距變大）；dmg 0..1 過勞變紅＋暗紅光暈（同 lab_spring） */
  function drawCoil(c, x, y0, y1, o) {
    o = o || {};
    const turns = o.turns || 13, amp = o.amp || 18, n = turns * 14, dmg = o.dmg || 0;
    const f1 = W5.mix('#eef4f1', '#d8434a', dmg), f2 = W5.mix('#a8b8b3', '#a3202b', dmg), b1 = W5.mix('#5f6f6b', '#6a1a22', dmg);
    c.save(); c.lineCap = 'round';
    if (dmg > 0.05) {
      c.strokeStyle = 'rgba(214,52,62,' + (0.12 * dmg) + ')'; c.lineWidth = amp * 2 + 4;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    }
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

  /* 整條彈簧：上端 (x, yTop)，總長 Lcm（以 RIG.SC 換算），o.scale 可縮小（March 手上）；回傳下端 y */
  function springAt(c, x, yTop, Lcm, o) {
    o = o || {};
    const sc = o.scale == null ? 1 : o.scale, yb = yTop + Lcm * RIG.SC * sc;
    c.save();
    c.strokeStyle = W5.mix('#d6dfdc', '#c9757a', (o.dmg || 0) * 0.6); c.lineWidth = 3.5 * Math.max(0.6, sc); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + 6 * sc); c.moveTo(x, yb - 6 * sc); c.lineTo(x, yb); c.stroke();
    drawCoil(c, x, yTop + 6 * sc, yb - 6 * sc, { dmg: o.dmg, amp: 18 * sc });
    c.beginPath(); c.arc(x, yb + 6 * sc, 6 * sc, 0, TAU); c.stroke();
    c.restore();
    return yb;
  }

  function weightBody(c, cx, top, a, txt) {
    withA(c, a, () => {
      const { WW, WH } = RIG, x = cx - WW / 2;
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, top - 5); c.stroke();
      c.beginPath(); c.arc(cx, top - 9, 4.5, Math.PI * 0.5, Math.PI * 2.1); c.stroke();
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(x, 0, x + WW, 0);
      g.addColorStop(0, '#4a5553'); g.addColorStop(0.3, '#b9c4c0'); g.addColorStop(0.55, '#8b9894'); g.addColorStop(1, '#3d4745');
      c.fillStyle = g; W5.rr(c, x, top, WW, WH, 6); c.fill(); c.restore();
      c.strokeStyle = 'rgba(20,30,28,0.9)'; c.lineWidth = 1.5; W5.rr(c, x, top, WW, WH, 6); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, top + 1.5); c.lineTo(x + WW - 6, top + 1.5); c.stroke();
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(cx, top + WH + 3, 3, 0, TAU); c.stroke();
    });
    T(c, a, txt, cx, top + RIG.WH / 2 + 1, WHITE, 22, 'center', true);
  }
  const PITCH = RIG.WH + RIG.WG + 6;

  /* 鉤碼串：list＝已掛上的文字；enter＝{txt,k} 正在飛入的；exit 0..1 全部飛走（以 yExit 為基準） */
  function drawWeights(c, yb, list, enter, exit, yExit) {
    const { SX } = RIG;
    if (exit > 0) {
      const k = ease(exit), top0 = yExit + 22;
      c.save(); c.translate(k * 150, -k * 40);
      list.forEach((t, i) => weightBody(c, SX, top0 + i * PITCH, 1 - k, t));
      c.restore();
      return;
    }
    const top0 = yb + 22;
    list.forEach((t, i) => weightBody(c, SX, top0 + i * PITCH, 1, t));
    if (enter && enter.k > 0.02 && enter.k < 1) {
      const k = ease(enter.k);
      c.save(); c.translate((1 - k) * 120, -(1 - k) * 34);
      weightBody(c, SX, top0 + list.length * PITCH, k, enter.txt);
      c.restore();
    }
  }

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

  function dash(c, x0, x1, y, col, a, lw) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.setLineDash([6, 6]); c.strokeStyle = col; c.lineWidth = lw || 2;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
  }

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
  const fLen = F => 30 + F * 0.5;

  function readout(c, Lcm, a, txt) {
    if (a <= 0.02) return;
    const { RX, RW, SX } = RIG, y = yOf(Lcm);
    withA(c, a, () => {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = WHITE; c.lineWidth = 2;
      c.beginPath(); c.moveTo(SX - 10, y); c.lineTo(RX + RW - 2, y); c.stroke(); c.restore();
      c.fillStyle = WHITE;
      c.beginPath(); c.moveTo(RX - 2, y); c.lineTo(RX - 15, y - 8); c.lineTo(RX - 15, y + 8); c.closePath(); c.fill();
    });
    P(c, a, txt, RX - 18, y, WHITE, 22, 'right', true);
  }

  function bounce(L0, L1, t) {
    if (t <= 0) return L0;
    return L1 - (L1 - L0) * Math.exp(-2.8 * t) * Math.cos(5.2 * t);
  }

  /* ═══════════ March ═══════════ */
  const MARCH = {};
  ['running', 'touch_ready'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  const M_SCALE = 290 / 472;           /* touch_ready 全身 472px → 290px */
  const M_X = 440;                     /* 站定位置（中心） */
  /* 鏡像後 touch_ready 的手：原圖 (200,170) → 相對中心 −59、離頭頂 104 */
  const HAND = { x: M_X - (200 - 104) * M_SCALE - 14, y: GROUND - 472 * M_SCALE + 170 * M_SCALE - 22 };

  function drawMarch(c, pose, cx, a, flip, bob) {
    const im = MARCH[pose];
    if (a <= 0.02 || !im || !im.complete || !im.naturalWidth) return;
    const h = im.naturalHeight * M_SCALE, w = im.naturalWidth * M_SCALE;
    c.save(); c.globalAlpha *= a;
    c.translate(cx, GROUND - (bob || 0)); if (flip) c.scale(-1, 1);
    c.drawImage(im, -w / 2, -h, w, h);
    c.restore();
  }

  /* ═══════════ 右側：座標圖 ═══════════ */
  const G = { x0: 590, x1: 900, y0: 112, y1: 400, fmax: 100, fstep: 20, ymax: 14, ystep: 2 };
  const gx = F => G.x0 + F / G.fmax * (G.x1 - G.x0);
  const gy = v => G.y1 - v / G.ymax * (G.y1 - G.y0);

  function drawAxes(c, Gr, a) {
    withA(c, a, () => {
      const X = F => Gr.x0 + F / Gr.fmax * (Gr.x1 - Gr.x0), Y = v => Gr.y1 - v / Gr.ymax * (Gr.y1 - Gr.y0);
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, Gr.x0, Gr.y0 - 10, Gr.x1 - Gr.x0 + 6, Gr.y1 - Gr.y0 + 10, 6); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(163,184,176,0.18)';
      for (let F = Gr.fstep; F <= Gr.fmax; F += Gr.fstep) { c.beginPath(); c.moveTo(X(F), Gr.y0 - 6); c.lineTo(X(F), Gr.y1); c.stroke(); }
      for (let v = Gr.ystep; v <= Gr.ymax; v += Gr.ystep) { c.beginPath(); c.moveTo(Gr.x0, Y(v)); c.lineTo(Gr.x1, Y(v)); c.stroke(); }
      for (let F = 0; F <= Gr.fmax; F += Gr.fstep) W5.label(c, String(F), X(F), Gr.y1 + 20, F === LIMIT ? F_COL : WHITE, 20, 'center', true);
      for (let v = Gr.ystep; v <= Gr.ymax; v += Gr.ystep) W5.label(c, String(v), Gr.x0 - 12, Y(v), WHITE, 20, 'right', true);
      c.strokeStyle = WHITE; c.fillStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(Gr.x0, Gr.y1); c.lineTo(Gr.x1 + 12, Gr.y1); c.moveTo(Gr.x0, Gr.y1); c.lineTo(Gr.x0, Gr.y0 - 18); c.stroke();
      c.beginPath(); c.moveTo(Gr.x1 + 22, Gr.y1); c.lineTo(Gr.x1 + 9, Gr.y1 - 7); c.lineTo(Gr.x1 + 9, Gr.y1 + 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(Gr.x0, Gr.y0 - 28); c.lineTo(Gr.x0 - 7, Gr.y0 - 15); c.lineTo(Gr.x0 + 7, Gr.y0 - 15); c.closePath(); c.fill();
    });
    T(c, a, L('外力 F（gw）', 'Force F (gw)'), (Gr.x0 + Gr.x1) / 2, Gr.y1 + 50, F_COL, 22);
    T(c, a, L('伸長量 ΔX（cm）', 'Extension ΔX (cm)'), Gr.x0 + 18, Gr.y0 - 30, X_COL, 22, 'left');
  }

  /* 彈性限度：超限區淡紅底＋珊瑚虛線＋標籤（flash 0..1 越線時發亮） */
  function limitMark(c, a, flash) {
    if (a <= 0.02) return;
    const x = gx(LIMIT);
    withA(c, a, () => {
      c.fillStyle = 'rgba(214,52,62,' + (0.12 + 0.12 * flash) + ')'; c.fillRect(x, G.y0 - 6, G.x1 - x, G.y1 - G.y0 + 6);
      c.save(); c.setLineDash([9, 7]); c.strokeStyle = F_COL; c.lineWidth = 2.5 + 1.5 * flash;
      c.shadowColor = W5.rgba(F_COL, 0.9); c.shadowBlur = 4 + 14 * flash;
      c.beginPath(); c.moveTo(x, G.y0 - 6); c.lineTo(x, G.y1); c.stroke(); c.restore();
    });
    P(c, a, L('彈性限度 80 gw', 'Limit 80 gw'), x, gy(2.4), F_COL, 22, 'center');
  }

  function dataPoint(c, x, y, a, pop, col) {
    if (a <= 0.02) return;
    col = col || X_COL;
    const r = 8 * (1 + 0.5 * Math.sin(Math.PI * clamp01(pop == null ? 1 : pop)));
    c.save(); c.globalAlpha *= a;
    W5.glow(c, x, y, 26, col, 0.45);
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 2.5, 0, TAU); c.fill();
    W5.ball(c, x, y, r, col);
    c.restore();
  }

  /* 加載軌跡：從原點沿 ext() 畫到 F1 */
  function loadPath(c, F1, a) {
    if (a <= 0.02 || F1 <= 0.2) return;
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = W5.rgba(X_COL, 0.85); c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    c.shadowColor = W5.rgba(X_COL, 0.6); c.shadowBlur = 8;
    c.beginPath(); c.moveTo(gx(0), gy(0));
    const n = Math.max(2, Math.ceil(F1 / 2));
    for (let i = 1; i <= n; i++) { const F = F1 * i / n; c.lineTo(gx(F), gy(ext(F))); }
    c.stroke(); c.restore();
  }

  /* ═══════════ 場景狀態（純函式） ═══════════ */
  /* 步驟 1：60 gw 掛上（2.2 s）→ 取下（5.0 s）
     步驟 2：60 gw 掛上（1.4 s）→ 再掛 40 gw（3.4 s，3.4 秒內緩緩拉到 24 cm）
     步驟 3：取下全部（1.0 s）→ 彈回停在 14 cm
     步驟 4：March 換彈簧 */
  const ENTER = 1.1, EXIT = 0.9;
  const S1A = 2.2, S1R = 5.0, S2A = 1.4, S2B = 3.4, S2C = 3.4, S3R = 1.0;
  const creep = t => 16 + 8 * ease(clamp01(t / S2C));
  /* 越過 80 gw（總長 18 cm）的時刻（解 ease(x)=0.25） */
  const X25 = (() => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ease(m) < 0.25) lo = m; else hi = m; } return lo; })();
  const S2X = S2B + X25 * S2C;

  function scene(s) {
    const u = s.u, R = { L: 10, list: [], enter: null, exit: 0, yExit: 0, F: 0, dmg: 0, pF: 0, pX: 0, trace: 0, ret: null };
    if (s.n === 1) {
      if (u < S1A) {
        if (u > S1A - ENTER) R.enter = { txt: '60 gw', k: (u - (S1A - ENTER)) / ENTER };
      } else if (u < S1R) {
        R.L = bounce(10, 16, u - S1A); R.list = ['60 gw']; R.F = 60;
      } else {
        R.L = bounce(16, 10, u - S1R); R.list = ['60 gw']; R.exit = clamp01((u - S1R) / EXIT); R.yExit = yOf(16);
      }
      const dx = R.L - 10;
      R.pF = Math.max(0, Math.min(60, dx * 10)); R.pX = R.pF / 10;
      R.trace = u < S1A ? 0 : (u - S1A < 0.6 ? R.pF : 60);
    } else if (s.n === 2) {
      if (u < S2A) {
        if (u > S2A - ENTER) R.enter = { txt: '60 gw', k: (u - (S2A - ENTER)) / ENTER };
      } else {
        R.L = bounce(10, 16, u - S2A); R.list = ['60 gw']; R.F = 60;
        if (u < S2B && u > S2B - ENTER) R.enter = { txt: '40 gw', k: (u - (S2B - ENTER)) / ENTER };
        if (u >= S2B) { R.L = creep(u - S2B); R.list = ['60 gw', '40 gw']; R.F = 100; }
      }
      const dx = R.L - 10;
      R.pF = Math.max(0, Math.min(100, Finv(dx))); R.pX = ext(R.pF);
      R.trace = Math.max(60, R.pF);
      R.dmg = 0.7 * clamp01((dx - 8) / 6);
    } else if (s.n === 3) {
      R.trace = 100;
      if (u < S3R) { R.L = 24; R.list = ['60 gw', '40 gw']; R.F = 100; R.dmg = 0.7; }
      else {
        R.L = bounce(24, 14, u - S3R); R.list = ['60 gw', '40 gw']; R.exit = clamp01((u - S3R) / EXIT); R.yExit = yOf(24);
        R.dmg = lerp(0.7, 0.5, ease(clamp01((u - S3R) / 1.5)));
      }
      const dx = R.L - 10;
      const back = u < S3R ? 100 : (u - S3R < 0.6 ? Math.max(0, Math.min(100, (dx - 4) * 10)) : 0);
      R.pF = back; R.pX = 4 + back / 10; R.ret = back;
    } else {
      R.L = 14; R.dmg = 0.5; R.trace = 100; R.ret = 0; R.pF = 0; R.pX = 4;
    }
    return R;
  }

  /* 第 4 步：舊彈簧被拿走、新彈簧換上（畫在 March 之後，彈簧在手前） */
  function drawSwap(c, s) {
    const u = s.u;
    /* 舊彈簧：2.4～3.8 s 從掛點移到 March 手上、縮小、淡出 */
    const ko = ease(seg(u, 2.4, 3.6)), oa = 1 - seg(u, 3.2, 3.8);
    if (oa > 0.02) withA(c, oa, () => {
      springAt(c, lerp(RIG.SX, HAND.x, ko), lerp(RIG.Y0, HAND.y, ko), 14, { dmg: 0.5, scale: lerp(1, 0.5, ko) });
    });
    /* 新彈簧：3.9 s 在手上出現，4.5～5.5 s 移到掛點並放大 */
    const na = ease(seg(u, 3.9, 4.4)), kn = ease(seg(u, 4.5, 5.5));
    if (na > 0.02) {
      const x = lerp(HAND.x, RIG.SX, kn), y = lerp(HAND.y, RIG.Y0, kn), sc = lerp(0.5, 1, kn);
      withA(c, na, () => {
        W5.glow(c, x, y + 65 * sc, 70 * sc, X_COL, 0.16 * (1 - 0.5 * kn));
        springAt(c, x, y, 10, { scale: sc });
      });
      /* 掛上的那一下：掛點閃一下 */
      const fl = seg(u, 5.5, 5.8) * (1 - seg(u, 5.8, 6.4));
      if (fl > 0.02) W5.glow(c, RIG.SX, RIG.Y0, 40, WHITE, 0.6 * fl);
    }
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = scene(s);
    const a1 = s.n === 1 ? s.k : 1;

    withA(c, a1, () => {
      const gl = c.createRadialGradient(240, 270, 20, 240, 270, 360);
      gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, 508);
    });
    bench(c, a1);
    drawStand(c, a1);
    drawRuler(c, a1, 24);

    /* 原長 10 cm：灰虛線＋灰括號＋標籤（全程保留） */
    const aO = s.n === 1 ? fin(s, 1, 0.8, 0.6) : 1, gO = s.n === 1 ? ease(seg(s.u, 0.8, 1.6)) : 1;
    const oLab = s.n === 1 ? fin(s, 1, 1.4, 0.5) : 1;
    const hi4 = win(s, 4, 5.8, null, 0.5);                       /* 第 4 步：新彈簧對齊原長，虛線亮起 */
    dash(c, RIG.RX + RIG.RW, RIG.BX + 8, yOf(10), hi4 > 0.02 ? W5.rgba(WHITE, 0.6 + 0.3 * hi4) : 'rgba(163,184,176,0.85)', oLab, 2 + hi4);
    bracket(c, RIG.BX, RIG.Y0, yOf(10), hi4 > 0.02 ? W5.mix(DIM, WHITE, hi4) : DIM, aO, gO);
    T(c, oLab, L('原長', 'Natural length'), RIG.BX + 16, yOf(5) - 20, hi4 > 0.02 ? W5.mix(DIM, WHITE, hi4) : DIM, 22, 'left');
    P(c, oLab, '10 cm', RIG.BX + 14, yOf(5) + 18, WHITE, 22, 'left', true);

    /* ── 彈簧（第 4 步：舊的被拿走、新的換上） ── */
    let yb = yOf(S.L);
    if (s.n < 4) {
      withA(c, a1, () => {
        yb = springAt(c, RIG.SX, RIG.Y0, S.L, { dmg: S.dmg });
        drawWeights(c, yb, S.list, S.enter, S.exit, S.yExit);
      });
    } else {
      yb = yOf(10);
    }

    /* ── 伸長量括號、外力箭頭、直尺讀數 ── */
    const stretch = clamp01((S.L - 10.2) / 0.6);
    if (s.n <= 3) {
      const hang = S.list.length > 0 && S.exit < 1 ? (1 - ease(S.exit)) : 0;
      const bA = Math.min(stretch, hang > 0 ? 1 : stretch) * (s.n === 3 ? 1 - ease(clamp01((s.u - S3R + 0.4) / 0.4)) : 1);
      bracket(c, RIG.BX, yOf(10), yb, X_COL, bA, 1);
      forceArrow(c, RIG.BX, yb + 22, fLen(S.F) * ease(clamp01(hang)), hang * (S.F > 0 ? 1 : 0));
    }
    /* 數字標籤（只在定住時出現） */
    const lab1 = win(s, 1, S1A + 1.4, S1R - 0.3);
    const lab2 = win(s, 2, S2B + S2C + 0.3) + (s.n === 3 ? 1 - ease(clamp01((s.u - 0.4) / 0.4)) : 0);
    if (lab1 > 0.02) {
      P(c, lab1, 'ΔX = 6 cm', RIG.BX + 14, (yOf(10) + yOf(16)) / 2, X_COL, 22, 'left', true);
      P(c, lab1, 'F = 60 gw', RIG.BX + 18, yOf(16) + 22 + fLen(60) * 0.55, F_COL, 22, 'left', true);
    }
    if (lab2 > 0.02) {
      P(c, lab2, 'ΔX = 14 cm', RIG.BX + 14, (yOf(10) + yOf(24)) / 2, X_COL, 22, 'left', true);
      P(c, lab2, 'F = 100 gw', RIG.BX + 18, yOf(24) + 22 + fLen(100) * 0.55, F_COL, 22, 'left', true);
    }
    readout(c, 16, lab1, '16 cm');
    readout(c, 10, win(s, 1, 6.3), '10 cm');
    readout(c, 24, lab2, '24 cm');
    const r14 = win(s, 3, 3.0) + (s.n === 4 ? 1 - ease(clamp01(s.u / 0.6)) : 0);
    readout(c, 14, r14, '14 cm');
    readout(c, 10, win(s, 4, 5.9), '10 cm');

    /* 第 3 步：永久形變括號（原長線 → 14 cm） */
    const pA = win(s, 3, 3.6, null, 0.5) + (s.n === 4 ? 1 - ease(clamp01(s.u / 0.6)) : 0);
    if (pA > 0.02) {
      const g = s.n === 3 ? ease(seg(s.u, 3.6, 4.3)) : 1;
      bracket(c, RIG.BX, yOf(10), yOf(14), X_COL, pA, g);
      const la = pA * (s.n === 3 ? ease(seg(s.u, 4.2, 4.7)) : 1);
      P(c, la, L('永久形變 4 cm', 'Permanent set 4 cm'), RIG.BX + 14, yOf(12), X_COL, 22, 'left');
    }

    /* ── 右側：座標圖 ── */
    const axA = s.n === 1 ? fin(s, 1, 0.6, 0.8) : 1;
    drawAxes(c, G, axA);
    /* 越線閃光（第 2 步越過 80 gw 時） */
    const fx = s.n === 2 ? seg(s.u, S2X, S2X + 0.3) * (1 - seg(s.u, S2X + 0.6, S2X + 1.6)) : 0;
    limitMark(c, s.n === 1 ? fin(s, 1, 1.2, 0.6) : 1, fx);

    /* 第 4 步：圖上內容淡出、座標軸重置 */
    const gA = s.n === 4 ? 1 - ease(seg(s.u, 0.2, 1.0)) : 1;

    /* 限度內的虎克直線延長（淡虛線），對照超限後變陡 */
    const ghost = (s.n === 2 ? ease(seg(s.u, S2X + 0.4, S2X + 1.2)) : s.n === 3 ? 1 : 0) * gA;
    if (ghost > 0.02) withA(c, ghost, () => {
      c.save(); c.setLineDash([3, 7]); c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(gx(LIMIT), gy(8)); c.lineTo(gx(100), gy(10)); c.stroke(); c.restore();
    });

    loadPath(c, S.trace, gA);

    /* 回程線（第 3 步）：從 (100,14) 沿平行於原直線的新線落到 (0,4) */
    if (S.ret != null && gA > 0.02) {
      const F0 = S.ret;
      if (F0 < 99.8) withA(c, gA, () => {
        c.save(); c.setLineDash([8, 7]); c.strokeStyle = W5.rgba(BAD, 0.9); c.lineWidth = 3; c.lineCap = 'round';
        c.shadowColor = W5.rgba(BAD, 0.5); c.shadowBlur = 6;
        c.beginPath(); c.moveTo(gx(100), gy(14)); c.lineTo(gx(F0), gy(4 + F0 / 10)); c.stroke(); c.restore();
      });
    }

    /* 資料點 */
    const ptA = (s.n === 1 ? fin(s, 1, 1.6, 0.5) : 1) * gA;
    const pop3 = s.n === 3 ? seg(s.u, S3R + 0.6, S3R + 1.1) : 0;
    dataPoint(c, gx(S.pF), gy(S.pX), ptA, pop3);
    /* 第 1 步：回到原點時原點發亮；第 3 步：停在 4 cm、原點只剩空圈 */
    const og = win(s, 1, 6.0, null, 0.5);
    if (og > 0.02) withA(c, og, () => W5.glow(c, gx(0), gy(0), 30, WHITE, 0.35));
    const miss = (s.n === 3 ? ease(seg(s.u, 3.0, 3.6)) : s.n === 4 ? 1 : 0) * gA;
    if (miss > 0.02) {
      withA(c, miss, () => {
        c.save(); c.setLineDash([4, 4]); c.strokeStyle = WHITE; c.lineWidth = 2;
        c.beginPath(); c.arc(gx(0), gy(0), 11, 0, TAU); c.stroke(); c.restore();
      });
      P(c, miss, '4 cm', gx(0) + 20, gy(4) + 28, X_COL, 22, 'left', true);
    }

    /* 第 4 步：限度內那一段亮起＋定律 */
    const law = win(s, 4, 6.4, null, 0.6);
    if (law > 0.02) {
      withA(c, law, () => { c.fillStyle = W5.rgba(X_COL, 0.08); c.fillRect(G.x0, G.y0 - 6, gx(LIMIT) - G.x0, G.y1 - G.y0 + 6); });
      const t1 = L('虎克定律', "Hooke's law holds");
      const t2 = L('只在彈性限度內成立', 'only within the limit');
      P(c, law, t1, (G.x0 + gx(LIMIT)) / 2, gy(10.4), LAW_COL, 22, 'center');
      P(c, law, t2, (G.x0 + gx(LIMIT)) / 2, gy(8.2), LAW_COL, 22, 'center');
    }

    /* ── March（第 4 步） ── */
    if (s.n === 4) {
      const u = s.u;
      if (u < 2.2) {
        const x = lerp(1010, M_X, 1 - Math.pow(1 - seg(u, 0.3, 2.2), 2));
        drawMarch(c, 'running', x, ease(seg(u, 0.3, 0.6)), true, Math.abs(Math.sin(u * 9)) * 6);
      } else {
        drawMarch(c, 'touch_ready', M_X, 1, true, 0);
      }
      drawSwap(c, s);
    }

    /* ── 狀態標籤（右下） ── */
    const SX0 = 745, SY = 500;
    P(c, win(s, 1, 6.6, null, 0.5), L('彈性限度內：卸載後恢復原長', 'Within the limit: it returns to 10 cm'), SX0, SY, WHITE, 22, 'center');
    P(c, win(s, 2, S2X + 0.5, null, 0.5), L('超過彈性限度', 'Beyond the elastic limit'), SX0, SY, BAD, 22, 'center');
    P(c, win(s, 3, 5.4, null, 0.5), L('永久形變：回不去了', 'Permanent set: no way back'), SX0, SY, BAD, 22, 'center');
    P(c, win(s, 4, 6.0, null, 0.5), L('只有更換新彈簧才能恢復', 'Only a new spring starts fresh'), SX0, SY, WHITE, 22, 'center');
  }

  W5.register('limit', { canvas: 'cvs-limit', steps: DUR, draw });
})();
