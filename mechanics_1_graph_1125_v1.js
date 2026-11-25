/* ==================================================================
   mechanics_1 ｜ 看懂彈簧的座標圖（座標圖陷阱）（cvs-graph，960×540）
   四步：1 畫「伸長量」→ 2 畫「總長度」→ 3 兩張並排比 → 4 外力 0 時
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：原長 10 cm；k＝10 gw/cm；F＝0、20、40、60、80 gw（全在彈性限度內）；
     伸長量 ΔX＝0、2、4、6、8 cm；總長度 L＝10、12、14、16、18 cm。
   語意色（全站）：外力 F＝珊瑚；伸長量 ΔX＝青；斜率（同一個 k）強調＝黃（同 hooke 的 k）。
     總長度 L＝淡灰藍 #c3d0ff（本檔專用，不是全站語意；畫面上方有圖例）；原長括號＝說明灰。
   版面：左＝縮小的支架＋直尺＋彈簧＋20 gw 鉤碼（輔助）；右＝兩張同尺度座標圖並排
     （左圖縱軸 ΔX、右圖縱軸 L，縱軸都是 0～20 cm，平移 10 cm 一眼看得出）。
   畫法沿用 mechanics_1_hooke／limit（支架、直尺、線圈、鉤碼、括號、drawAxes、dataPoint），
     但全部複製在本 IIFE 內，不依賴它們。畫布頂端 0～31px 留給 kit 的進度條。
   本檔不放 March：版面已被兩張座標圖占滿，人物放進來會壓到圖。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const X_COL = COL.teal;            /* 伸長量 ΔX：青 */
  const L_COL = '#c3d0ff';           /* 總長度 L：淡灰藍（本檔專用） */
  const K_COL = COL.yellow;          /* 斜率／同一個 k */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [10, 10, 9, 8];        /* 總長 37 秒 */

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

  /* 第 n 步 t 秒起淡入（之後的步驟＝1、之前的步驟＝0） */
  function appear(s, n, t, d) { return s.n > n ? 1 : s.n < n ? 0 : ease(seg(s.u, t, t + (d || 0.5))); }
  /* 只在第 n 步：a 秒淡入、b 秒淡出 */
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

  /* ═══════════ 左側（輔助）：縮小的支架、直尺、彈簧、鉤碼 ═══════════ */
  const RIG = {
    SX: 128, Y0: 80, SC: 12,           /* 彈簧中心、掛點（直尺 0）、每 cm 像素 */
    RX: 40, RW: 40,                    /* 直尺 */
    POST: 20, ARM_Y: 48, BASE_Y: 486,
    BX: 190, BX2: 212, PX: 222,        /* 原長／ΔX 括號、總長括號、數值標籤 */
    WW: 84, WH: 30, WG: 6
  };
  const yOf = Lcm => RIG.Y0 + Lcm * RIG.SC;
  const GROUND = RIG.BASE_Y + 16;
  const PITCH = RIG.WH + RIG.WG + 6;

  function bench(c, a) {
    withA(c, a, () => {
      const y = GROUND;
      const g = c.createLinearGradient(0, y, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(0, y, 960, 540 - y);
      const e = c.createLinearGradient(0, 0, 960, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.30)'); e.addColorStop(0.4, 'rgba(246,243,234,0.20)'); e.addColorStop(1, 'rgba(246,243,234,0.06)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke();
    });
  }

  function drawStand(c, a) {
    withA(c, a, () => {
      const { POST, ARM_Y, BASE_Y, SX } = RIG;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, BASE_Y, BASE_Y + 16); W5.rr(c, 6, BASE_Y, 230, 16, 7); c.fill(); c.restore();
      c.fillStyle = steelV(c, POST - 7, POST + 7); c.fillRect(POST - 7, ARM_Y + 6, 14, BASE_Y - ARM_Y - 6);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, ARM_Y, ARM_Y + 14); W5.rr(c, POST - 12, ARM_Y, SX + 36 - (POST - 12), 14, 7); c.fill(); c.restore();
      c.fillStyle = '#d6dfdc'; W5.rr(c, SX - 8, ARM_Y + 12, 16, 7, 3); c.fill();
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(SX, ARM_Y + 18); c.lineTo(SX, RIG.Y0); c.stroke();
      c.fillStyle = '#c9d3d0'; c.fillRect(RIG.RX + RIG.RW / 2 - 3, ARM_Y + 12, 6, RIG.Y0 - 6 - (ARM_Y + 12));
    });
  }

  function drawRuler(c, a, maxCm) {
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
        c.lineWidth = big ? 2 : 1.3;
        c.beginPath(); c.moveTo(RX + RW, y); c.lineTo(RX + RW - (big ? 9 : 5), y); c.stroke();
      }
      for (let k = 0; k <= maxCm; k += 2) W5.label(c, String(k), RX + 16, yOf(k), WHITE, 20, 'center', true);
      W5.label(c, 'cm', RX + RW / 2, top + h + 22, DIM, 22, 'center', true);
    });
  }

  /* 立體線圈：固定圈數（拉長時圈距變大） */
  function drawCoil(c, x, y0, y1, amp, turns) {
    const n = turns * 14;
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const cm = Math.cos((p0 + p1) / 2), front = cm > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (cm > 0.7 ? '#eef4f1' : '#a8b8b3') : '#5f6f6b'; c.lineWidth = front ? 3.8 : 2.9;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }

  /* 整條彈簧：上端 (x, yTop)、總長 Lcm；回傳下端 y */
  function springAt(c, x, yTop, Lcm) {
    const yb = yTop + Lcm * RIG.SC;
    c.save();
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + 6); c.moveTo(x, yb - 6); c.lineTo(x, yb); c.stroke();
    drawCoil(c, x, yTop + 6, yb - 6, 16, 11);
    c.beginPath(); c.arc(x, yb + 5, 5, 0, TAU); c.stroke();
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

  /* 鉤碼串：n 個 20 gw；enter 0..1 下一個飛入；exit 0..1 全部飛走（以 yExit 為基準） */
  function drawWeights(c, yb, n, enter, exit, yExit) {
    const { SX } = RIG;
    if (exit > 0) {
      const k = ease(exit), top0 = yExit + 22;
      c.save(); c.translate(k * 130, -k * 40);
      for (let i = 0; i < n; i++) weightBody(c, SX, top0 + i * PITCH, 1 - k, '20 gw');
      c.restore();
      return;
    }
    const top0 = yb + 22;
    for (let i = 0; i < n; i++) weightBody(c, SX, top0 + i * PITCH, 1, '20 gw');
    if (enter > 0.02 && enter < 1) {
      const k = ease(enter);
      c.save(); c.translate((1 - k) * 110, -(1 - k) * 34);
      weightBody(c, SX, top0 + n * PITCH, k, '20 gw');
      c.restore();
    }
  }

  function bracket(c, x, y0, y1, col, a, grow) {
    if (a <= 0.02 || Math.abs(y1 - y0) < 2) return;
    grow = grow == null ? 1 : grow;
    const ye = lerp(y0, y1, grow);
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
    c.shadowColor = W5.rgba(col.length === 7 ? col : '#a3b8b0', 0.7); c.shadowBlur = 8;
    c.beginPath(); c.moveTo(x - 6, y0); c.lineTo(x + 6, y0); c.moveTo(x, y0); c.lineTo(x, ye); c.stroke();
    if (grow > 0.98) { c.beginPath(); c.moveTo(x - 6, y1); c.lineTo(x + 6, y1); c.stroke(); }
    c.restore();
  }

  function dashLine(c, x0, y0, x1, y1, col, a, lw, pat) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.setLineDash(pat || [6, 6]); c.strokeStyle = col; c.lineWidth = lw || 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
  }

  /* 掛上鉤碼後：緩緩拉長＋小幅阻尼彈跳（0→1） */
  const resp = t => (t <= 0 ? 0 : 1 - Math.exp(-2.8 * t) * Math.cos(5.2 * t));

  /* ═══════════ 右側：兩張座標圖（同尺度：F 0～80 gw、縱軸 0～20 cm） ═══════════ */
  const GA = { x0: 390, x1: 620, y0: 112, y1: 384, fmax: 80, fstep: 20, ymax: 20, ystep: 2 };
  const GB = { x0: 705, x1: 935, y0: 112, y1: 384, fmax: 80, fstep: 20, ymax: 20, ystep: 2 };
  const X = (G, F) => G.x0 + F / G.fmax * (G.x1 - G.x0);
  const Y = (G, v) => G.y1 - v / G.ymax * (G.y1 - G.y0);
  const FS = [0, 20, 40, 60, 80];

  function drawAxes(c, G, a, title, tCol) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, G.x0, G.y0 - 10, G.x1 - G.x0 + 6, G.y1 - G.y0 + 10, 6); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(163,184,176,0.18)';
      for (let F = G.fstep; F <= G.fmax; F += G.fstep) { c.beginPath(); c.moveTo(X(G, F), G.y0 - 6); c.lineTo(X(G, F), G.y1); c.stroke(); }
      for (let v = G.ystep; v <= G.ymax; v += G.ystep) { c.beginPath(); c.moveTo(G.x0, Y(G, v)); c.lineTo(G.x1, Y(G, v)); c.stroke(); }
      for (let F = 0; F <= G.fmax; F += G.fstep) W5.label(c, String(F), X(G, F), G.y1 + 20, WHITE, 20, 'center', true);
      for (let v = G.ystep; v <= G.ymax; v += G.ystep) W5.label(c, String(v), G.x0 - 12, Y(G, v), WHITE, 20, 'right', true);
      c.strokeStyle = WHITE; c.fillStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(G.x0, G.y1); c.lineTo(G.x1 + 12, G.y1); c.moveTo(G.x0, G.y1); c.lineTo(G.x0, G.y0 - 18); c.stroke();
      c.beginPath(); c.moveTo(G.x1 + 22, G.y1); c.lineTo(G.x1 + 9, G.y1 - 7); c.lineTo(G.x1 + 9, G.y1 + 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(G.x0, G.y0 - 28); c.lineTo(G.x0 - 7, G.y0 - 15); c.lineTo(G.x0 + 7, G.y0 - 15); c.closePath(); c.fill();
    });
    T(c, a, L('外力 F（gw）', 'Force F (gw)'), (G.x0 + G.x1) / 2, G.y1 + 48, F_COL, 22);
    T(c, a, title, G.x0 + 18, G.y0 - 30, tCol, 22, 'left');
  }
  const titleA = () => L('伸長量 ΔX（cm）', 'Extension ΔX (cm)');
  const titleB = () => L('彈簧總長度 L（cm）', 'Total length L (cm)');

  function dataPoint(c, x, y, a, pop, col, r0) {
    if (a <= 0.02) return;
    const r = (r0 || 8) * (1 + 0.5 * Math.sin(Math.PI * clamp01(pop == null ? 1 : pop)));
    c.save(); c.globalAlpha *= a;
    W5.glow(c, x, y, 26, col, 0.45);
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 2.5, 0, TAU); c.fill();
    W5.ball(c, x, y, r, col);
    c.restore();
  }

  /* 一條資料線：從 F=0 到 F=0+80·grow；v(F) 給縱軸值 */
  function dataLine(c, G, vf, col, a, grow, dx, dy, dashed) {
    if (a <= 0.02 || grow <= 0.005) return;
    const F1 = 80 * grow;
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round';
    c.shadowColor = W5.rgba(col, 0.6); c.shadowBlur = 8;
    if (dashed) c.setLineDash([9, 7]);
    c.beginPath(); c.moveTo(X(G, 0) + (dx || 0), Y(G, vf(0)) + (dy || 0)); c.lineTo(X(G, F1) + (dx || 0), Y(G, vf(F1)) + (dy || 0)); c.stroke();
    c.restore();
  }

  /* 新點出現時的導引虛線（珊瑚往橫軸、縱軸色往縱軸） */
  function guide(c, G, F, v, col, a) {
    if (a <= 0.02) return;
    const x = X(G, F), y = Y(G, v);
    if (F > 0) dashLine(c, x, y, x, G.y1, F_COL, a * 0.9, 2, [4, 4]);
    if (v > 0) dashLine(c, x, y, G.x0, y, col, a * 0.9, 2, [4, 4]);
  }

  /* 斜率小三角：F 40→80、縱軸 +4 */
  function slopeTri(c, G, v40, a, grow) {
    if (a <= 0.02) return;
    const xa = X(G, 40), xb = X(G, 80), ya = Y(G, v40), yb = Y(G, v40 + 4);
    const g1 = ease(clamp01(grow * 2)), g2 = ease(clamp01(grow * 2 - 1));
    c.save(); c.globalAlpha *= a; c.strokeStyle = K_COL; c.lineWidth = 3; c.lineCap = 'round';
    c.shadowColor = W5.rgba(K_COL, 0.6); c.shadowBlur = 6; c.setLineDash([7, 5]);
    c.beginPath(); c.moveTo(xa, ya); c.lineTo(lerp(xa, xb, g1), ya); c.stroke();
    if (g2 > 0) { c.beginPath(); c.moveTo(xb, ya); c.lineTo(xb, lerp(ya, yb, g2)); c.stroke(); }
    c.restore();
  }

  /* 多色字串放在同一個圓角底板上（公式用） */
  function colorPill(c, a, parts, cx, y, border) {
    if (a <= 0.02) return;
    const size = 22, ws = parts.map(p => W5.tw(c, p[0], size, p[2]));
    const tot = ws.reduce((m, w) => m + w, 0), w = tot + 28, h = size + 16, x0 = cx - w / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2; c.strokeStyle = border || WHITE; c.stroke();
    let x = x0 + 14;
    parts.forEach((p, i) => { W5.label(c, p[0], x, y, p[1], size, 'left', p[2]); x += ws[i]; });
    c.restore();
  }

  /* 聚光燈：整張畫布變暗，只留幾個橢圓洞 */
  function spotlight(c, a, holes) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.rect(0, 32, 960, 508);
    const shape = (h, g) => {
      if (h.w) {   /* 圓角矩形洞（不呼叫 beginPath，才能和外框一起用 evenodd） */
        const x = h.x - g, y = h.y - g, w = h.w + 2 * g, hh = h.h + 2 * g, r = h.r + g;
        c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r);
        c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
      } else { c.moveTo(h.x + h.rx + g, h.y); c.ellipse(h.x, h.y, h.rx + g, h.ry + g, 0, 0, TAU); }
    };
    holes.forEach(h => shape(h, 0));
    c.fillStyle = 'rgba(7,18,14,0.74)'; c.fill('evenodd');
    holes.forEach(h => {
      for (let i = 1; i <= 3; i++) {
        c.strokeStyle = 'rgba(7,18,14,' + (0.22 - 0.06 * i) + ')'; c.lineWidth = 8;
        c.beginPath(); shape(h, 4 + 8 * (i - 1)); c.stroke();
      }
      c.strokeStyle = 'rgba(255,224,102,0.45)'; c.lineWidth = 2;
      c.beginPath(); shape(h, 0); c.stroke();
    });
    c.restore();
  }

  /* ═══════════ 場景狀態（純函式） ═══════════ */
  /* 步驟 1：鉤碼在 TA 秒落定；步驟 2：先全部取下（0.1～0.9 s），再在 TB 秒逐一落定；
     步驟 3：維持 80 gw；步驟 4：全部取下 */
  const TA = [1.4, 3.0, 4.6, 6.2], TB = [2.0, 3.4, 4.8, 6.2], ENTER = 1.0;
  const EX0 = 0.1, EX1 = 0.9;

  function hang(u, times) {
    let n = 0, enter = 0, add = 0;
    times.forEach((t, i) => {
      if (u >= t) n = i + 1;
      else if (u > t - ENTER && enter === 0) enter = (u - (t - ENTER)) / ENTER;
      add += 2 * resp(u - t);
    });
    return { n, enter, add };
  }

  function scene(s) {
    const u = s.u, R = { L: 10, n: 0, enter: 0, exit: 0, show: 0, valA: 1 };
    if (s.n === 1) {
      const h = hang(u, TA); R.n = h.n; R.enter = h.enter; R.L = 10 + h.add; R.show = h.n;
    } else if (s.n === 2) {
      const h = hang(u, TB);
      R.exit = seg(u, EX0, EX1);
      R.L = 18 - 8 * resp(u - EX0 - 0.05) + h.add;
      if (R.exit > 0 && R.exit < 1) { R.n = 4; R.show = R.exit < 0.5 ? 4 : 0; R.valA = Math.abs(1 - 2 * R.exit); }
      else { R.n = h.n; R.enter = h.enter; R.show = h.n; R.exit = 0; }
    } else if (s.n === 3) {
      R.L = 18; R.n = 4; R.show = 4;
    } else {
      R.exit = seg(u, EX0, EX1);
      R.L = 18 - 8 * resp(u - EX0 - 0.05);
      if (R.exit < 1) { R.n = 4; R.show = R.exit < 0.5 ? 4 : 0; R.valA = Math.abs(1 - 2 * R.exit); }
      else { R.n = 0; R.show = 0; R.exit = 0; }
    }
    return R;
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = scene(s), u = s.u;
    const a1 = s.n === 1 ? s.k : 1;

    withA(c, a1, () => {
      const gl = c.createRadialGradient(660, 250, 30, 660, 250, 420);
      gl.addColorStop(0, 'rgba(77,210,255,0.06)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, 508);
    });
    bench(c, a1);

    /* ── 左：支架＋直尺＋彈簧＋鉤碼 ── */
    drawStand(c, a1);
    drawRuler(c, a1, 20);
    let yb = yOf(S.L);
    withA(c, a1, () => {
      yb = springAt(c, RIG.SX, RIG.Y0, S.L);
      drawWeights(c, yb, S.n, S.enter, S.exit, yOf(18));
    });

    /* 括號：原長（灰，0→10）、伸長量（青，10→L）、總長度（淡灰藍，0→L，第 2 步起） */
    const gO = s.n === 1 ? ease(seg(u, 0.6, 1.3)) : 1;
    bracket(c, RIG.BX, RIG.Y0, yOf(10), DIM, a1, gO);
    dashLine(c, RIG.SX + 20, yOf(10), RIG.BX - 8, yOf(10), 'rgba(163,184,176,0.85)', s.n === 1 ? ease(seg(u, 1.0, 1.5)) : 1, 2);
    bracket(c, RIG.BX, yOf(10), yb, X_COL, clamp01((S.L - 10.15) / 0.5), 1);
    const totA = appear(s, 2, 1.0, 0.6);
    bracket(c, RIG.BX2, RIG.Y0, yb, L_COL, totA, s.n === 2 ? ease(seg(u, 1.0, 1.6)) : 1);

    /* 數值標籤（值在鉤碼落定時才換） */
    const oLab = s.n === 1 ? ease(seg(u, 1.0, 1.5)) : s.n === 2 ? 1 - ease(seg(u, 0.1, 0.5)) : 0;
    T(c, oLab, L('原長', 'Natural'), RIG.PX + 4, yOf(5) - 20, DIM, 22, 'left');
    P(c, oLab, '10 cm', RIG.PX, yOf(5) + 18, WHITE, 22, 'left', true);
    const vA = (s.n === 1 ? ease(seg(u, 0.9, 1.4)) : 1) * S.valA;
    const yl = Math.max(yb, yOf(10)), dxv = 2 * S.show, Lv = 10 + dxv, Fv = 20 * S.show;
    P(c, vA, 'ΔX=' + dxv + ' cm', RIG.PX, (yOf(10) + yl) / 2 + 2, X_COL, 22, 'left', true);
    P(c, vA * totA, 'L=' + Lv + ' cm', RIG.PX, (RIG.Y0 + yl) / 2, L_COL, 22, 'left', true);
    P(c, vA, 'F=' + Fv + ' gw', 180, yl + 42, F_COL, 22, 'left', true);

    /* ── 右：兩張座標圖 ── */
    const axA = s.n === 1 ? ease(seg(u, 0.3, 1.0)) : 1;
    drawAxes(c, GA, axA, titleA(), X_COL);
    const axB = appear(s, 2, 0.2, 0.8);
    drawAxes(c, GB, axB, titleB(), L_COL);

    const f4 = s.n === 4 ? 1 - ease(seg(u, 0, 0.8)) : 1;    /* 第 4 步淡掉第 3 步的輔助線 */

    /* 左圖：伸長量 */
    const lineA = s.n === 1 ? ease(seg(u, 7.0, 7.8)) : 1;
    dataLine(c, GA, F => F / 10, X_COL, 1, lineA);
    const glowA = appear(s, 1, 7.6, 0.6);
    if (glowA > 0.02) withA(c, glowA, () => W5.glow(c, X(GA, 0), Y(GA, 0), 34, WHITE, 0.4));
    FS.forEach((F, i) => {
      const t = i === 0 ? 1.0 : TA[i - 1] + 0.25;
      const a = appear(s, 1, t, 0.3), pop = s.n === 1 ? seg(u, t, t + 0.5) : 1;
      if (i > 0) guide(c, GA, F, F / 10, X_COL, win(s, 1, t, t + 1.3));
      dataPoint(c, X(GA, F), Y(GA, F / 10), a, pop, X_COL);
    });

    /* 右圖：總長度 */
    const lineB = s.n === 2 ? ease(seg(u, 6.9, 7.7)) : s.n > 2 ? 1 : 0;
    /* 縱軸截距括號（青：原長 10 cm） */
    const icA = appear(s, 2, 1.3, 0.5);
    bracket(c, GB.x0 + 12, GB.y1, Y(GB, 10), X_COL, icA * f4, s.n === 2 ? ease(seg(u, 1.3, 1.9)) : 1);
    /* 不過原點：原點空心虛線圈 */
    const miss = appear(s, 2, 7.6, 0.5);
    if (miss > 0.02) withA(c, miss, () => {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = WHITE; c.lineWidth = 2;
      c.beginPath(); c.arc(X(GB, 0), Y(GB, 0), 11, 0, TAU); c.stroke(); c.restore();
    });

    /* 第 3 步：左圖的線複製到右圖（平移過來），再整條往上平移 10 */
    const slide = s.n === 3 ? ease(seg(u, 0.4, 1.8)) : s.n === 4 ? 1 : 0;
    const lift = s.n === 3 ? ease(seg(u, 2.0, 3.4)) : s.n === 4 ? 1 : 0;
    const DXAB = GB.x0 - GA.x0, DY10 = Y(GB, 10) - Y(GB, 0);
    if (s.n === 3 && slide > 0 && slide < 1) {
      dataLine(c, GA, F => F / 10, X_COL, 0.9, 1, DXAB * slide, 0, true);
      FS.forEach(F => dataPoint(c, X(GA, F) + DXAB * slide, Y(GA, F / 10), 0.9, 1, X_COL, 4));
    }
    const ghostA = (s.n === 3 ? (slide >= 1 ? 1 : 0) : 0) + (s.n === 4 ? f4 : 0);
    if (ghostA > 0.02) {
      dataLine(c, GB, F => F / 10, X_COL, 0.85 * ghostA, 1, 0, 0, true);
      FS.forEach(F => dataPoint(c, X(GB, F), Y(GB, F / 10), 0.85 * ghostA, 1, X_COL, 4));
    }
    /* 上移的箭頭：+10 */
    const triA = s.n === 3 ? ease(seg(u, 4.6, 5.0)) : 0;
    const arrA = (s.n === 3 ? 1 - 0.65 * triA : f4) * (lift > 0.03 ? 1 : 0);
    if (arrA > 0.02) withA(c, arrA, () => {
      [20, 40, 60, 80].forEach(F => {
        const x = X(GB, F), y0 = Y(GB, F / 10), y1 = y0 + DY10 * lift;
        if (Math.abs(y1 - y0) > 14) W5.arrow(c, x, y0 - 4, x, y1 + 6, WHITE, 3, 12);
      });
    });
    T(c, (s.n === 3 ? ease(seg(u, 3.2, 3.7)) * (1 - 0.65 * triA) : f4 * (s.n === 4 ? 1 : 0)), '+10 cm', X(GB, 40) + 10, Y(GB, 9), WHITE, 22, 'left', true);
    if (s.n === 3 && lift > 0.02 && lift < 1) {
      dataLine(c, GB, F => F / 10, X_COL, 0.9 * (1 - lift * 0.5), 1, 0, DY10 * lift);
    }
    dataLine(c, GB, F => 10 + F / 10, L_COL, 1, lineB);
    const flash = s.n === 3 ? seg(u, 3.4, 3.6) * (1 - seg(u, 3.6, 4.4)) : 0;
    if (flash > 0.02) withA(c, flash, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 9; c.lineCap = 'round'; c.shadowColor = L_COL; c.shadowBlur = 24; c.globalAlpha *= 0.5;
      c.beginPath(); c.moveTo(X(GB, 0), Y(GB, 10)); c.lineTo(X(GB, 80), Y(GB, 18)); c.stroke(); c.restore();
    });
    FS.forEach((F, i) => {
      const t = i === 0 ? 1.2 : TB[i - 1] + 0.25;
      const a = appear(s, 2, t, 0.3), pop = s.n === 2 ? seg(u, t, t + 0.5) : 1;
      if (i > 0) guide(c, GB, F, 10 + F / 10, L_COL, win(s, 2, t, t + 1.3));
      dataPoint(c, X(GB, F), Y(GB, 10 + F / 10), a, pop, L_COL);
    });

    /* 斜率相同（第 3 步） */
    const tri = (s.n === 3 ? triA : 0) + (s.n === 4 ? f4 : 0);
    const triG = s.n === 3 ? seg(u, 4.6, 5.4) : 1;
    slopeTri(c, GA, 4, tri, triG);
    slopeTri(c, GB, 14, tri, triG);
    const t4 = (s.n === 3 ? ease(seg(u, 5.2, 5.6)) : 0) + (s.n === 4 ? f4 : 0);
    T(c, t4, '+4', X(GA, 80) - 8, Y(GA, 5.0), K_COL, 22, 'right', true);
    T(c, t4, '+4', X(GB, 80) - 8, Y(GB, 15.0), K_COL, 22, 'right', true);
    P(c, (s.n === 3 ? ease(seg(u, 5.8, 6.3)) : 0) + (s.n === 4 ? f4 : 0), L('斜率相同：同一個 k', 'Same slope: same k'), (GA.x0 + GA.x1) / 2 + 4, Y(GA, 11.6), K_COL, 22, 'center');

    /* 圖內結論小標 */
    P(c, appear(s, 1, 7.8, 0.5), L('直線過原點', 'Through origin'), GA.x0 + 16, Y(GA, 15), X_COL, 22, 'left');
    P(c, appear(s, 2, 7.8, 0.5), L('不過原點', 'Misses origin'), GB.x0 + 16, Y(GB, 17), L_COL, 22, 'left');
    /* 截距標籤（第 2 步；第 3 步淡出，讓位給平移） */
    const icL = s.n === 2 ? ease(seg(u, 1.8, 2.3)) : s.n === 3 ? 1 - ease(seg(u, 0, 0.4)) : 0;
    P(c, icL, L('原長 10 cm', 'Natural 10 cm'), GB.x0 + 26, Y(GB, 6), X_COL, 22, 'left');

    /* ── 第 4 步：聚光燈照在 F＝0 ── */
    const spot = win(s, 4, 1.1, null, 0.8);
    if (spot > 0.02) {
      spotlight(c, spot, [
        { x: 30, y: 58, w: 322, h: 226, r: 18 },
        { x: X(GA, 0), y: Y(GA, 0), rx: 40, ry: 40 },
        { x: X(GB, 0), y: Y(GB, 10), rx: 40, ry: 40 }
      ]);
      const pa = win(s, 4, 2.0, null, 0.5);
      withA(c, pa, () => {
        W5.glow(c, X(GA, 0), Y(GA, 0), 40, X_COL, 0.5);
        W5.glow(c, X(GB, 0), Y(GB, 10), 40, L_COL, 0.5);
      });
      dataPoint(c, X(GA, 0), Y(GA, 0), spot, 0, X_COL);
      dataPoint(c, X(GB, 0), Y(GB, 10), spot, 0, L_COL);
      dashLine(c, GA.x0 + 26, Y(GA, 8.5) + 19, X(GA, 0) + 8, Y(GA, 0) - 10, X_COL, pa, 2, [4, 4]);
      P(c, pa, 'ΔX = 0', GA.x0 + 20, Y(GA, 8.5), X_COL, 22, 'left', true);
      dashLine(c, GB.x0 + 34, Y(GB, 6) - 19, X(GB, 0) + 8, Y(GB, 10) + 10, L_COL, pa, 2, [4, 4]);
      P(c, pa, L('L = 10 cm（原長）', 'L = 10 cm (natural)'), GB.x0 + 26, Y(GB, 6), L_COL, 22, 'left');
      /* 「看縱軸」：縱軸標題亮起 */
      const ax = win(s, 4, 3.6, null, 0.5);
      if (ax > 0.02) {
        P(c, ax, titleA(), GA.x0 + 10, GA.y0 - 30, X_COL, 22, 'left');
        P(c, ax, titleB(), GB.x0 + 10, GB.y0 - 30, L_COL, 22, 'left');
      }
    }

    /* ── 圖例（上方） ── */
    const legY = 48;
    const legItem = (a, x, col, txt) => {
      if (a <= 0.02) return;
      withA(c, a, () => {
        c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, legY); c.lineTo(x + 34, legY); c.stroke();
        W5.ball(c, x + 17, legY, 6, col);
      });
      T(c, a, txt, x + 44, legY, col, 22, 'left');
    };
    legItem(axA, 470, X_COL, L('伸長量 ΔX', 'Extension ΔX'));
    legItem(axB, 690, L_COL, L('總長度 L', 'Total length L'));

    /* ── 狀態列（下方） ── */
    const SXc = 640, SY = 474;
    const arrowTxt = (zh1, zh2, en) => L(zh1 + '　→　' + zh2, en);
    P(c, win(s, 1, 7.9, null, 0.5) + (s.n === 2 ? 1 - ease(seg(u, 0, 0.4)) : 0),
      arrowTxt('縱軸：伸長量', '過原點', 'y-axis: extension → through origin'), SXc, SY, X_COL, 22, 'center');
    P(c, win(s, 2, 7.9, null, 0.5) + (s.n === 3 ? 1 - ease(seg(u, 0, 0.4)) : 0),
      arrowTxt('縱軸：總長度', '不過原點', 'y-axis: total length → misses origin'), SXc, SY, L_COL, 22, 'center');
    const fA = win(s, 3, 3.7, null, 0.5) + (s.n === 4 ? 1 - ease(seg(u, 0.6, 1.0)) : 0);
    colorPill(c, fA, [
      [L('總長度 L', 'Total L'), L_COL], [' ＝ ', WHITE], [L('原長 10 cm', 'natural 10 cm'), DIM], [' ＋ ', WHITE], [L('伸長量 ΔX', 'extension ΔX'), X_COL]
    ], SXc, SY, WHITE);
    P(c, win(s, 4, 2.8, null, 0.5), L('外力 0：伸長量 0，長度＝原長', 'Force 0: extension 0, length = natural length'), SXc, SY, WHITE, 22, 'center');
    P(c, win(s, 4, 3.6, null, 0.5), L('看圖先看縱軸畫的是什麼', 'Read a graph: check the y-axis first'), SXc, 518, K_COL, 22, 'center');
  }

  W5.register('graph', { canvas: 'cvs-graph', steps: DUR, draw });
})();
