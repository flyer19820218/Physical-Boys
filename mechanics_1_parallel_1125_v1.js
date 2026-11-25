/* ==================================================================
   mechanics_1 ｜ 彈簧並聯（cvs-parallel，960×540）
   四步：1 單條彈簧 → 2 兩條並排 → 3 各承受一半 → 4 伸長只剩一半
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：彈簧相同，原長 10 cm、k＝10 gw/cm；重物 W＝60 gw。
     單條掛 60 gw → 伸長 6 cm；兩條並聯 → 每條受 30 gw，各伸長 3 cm。
   語意色（全站）：外力 F＝珊瑚 COL.coral；伸長量 ΔX＝青 COL.teal；張力＝黃 COL.yellow。
   版面：天花板橫樑（y 36～58）吊著直尺（左，0 cm 對齊彈簧上端掛點 Y0）與彈簧；
         單條彈簧在 SX1，並聯兩條在 PXA／PXB（下端共用一根橫桿，重物掛橫桿正中 PXC）；
         右側 x 600～940、y ≤ 230 是說明欄（每步換一組字），右下 March 站在地面線 GY 上。
   畫風沿用 hooke／series：立體線圈（前亮後暗）、鋼色漸層、珊瑚外力箭頭、黃張力箭頭、
         青量度括號（端點短線＋光暈）、米色直尺。本檔自成 IIFE，不依賴其他動畫檔。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const X_COL = COL.teal;            /* 伸長量 ΔX：青 */
  const T_COL = COL.yellow;          /* 張力：黃 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [8, 10, 10, 10];       /* 總長 38 秒 */

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
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);

  /* ═══════════ 幾何 ═══════════ */
  const CEIL0 = 36, CEIL1 = 58;      /* 天花板橫樑上下緣 */
  const CX0 = 20, CX1 = 590;         /* 天花板左右 */
  const Y0 = 92;                     /* 彈簧上端掛點（＝直尺 0 cm） */
  const SC = 17;                     /* 每 cm 幾 px */
  const yOf = cm => Y0 + cm * SC;
  const RX = 50, RW = 46, RMAX = 18; /* 直尺 */
  const SX1 = 170;                   /* 單條彈簧（第 4 步的虛影也在這） */
  const PXA = 340, PXB = 460, PXC = 400;   /* 並聯兩條、重物中心 */
  const BAR_HW = 74;                 /* 下橫桿半寬 */
  const B1X = 216;                   /* 單條的量度括號 x */
  const B2X = 530;                   /* 並聯的量度括號 x */
  const TAX = PXA - 38, TBX = PXB + 38;    /* 黃張力箭頭 x */
  const GY = 506;                    /* 地面線 */
  const WW = 90, WH = 44;            /* 重物寬高 */
  const ARR = 50;                    /* 外力箭頭長 */
  const L0 = 10, D1 = 6, D2 = 3;     /* 原長、單條伸長、並聯每條伸長 */
  const IX = 770, IY = [100, 152, 202];    /* 右側說明欄 */

  /* ═══════════ March（右下角解說） ═══════════ */
  const MARCH = {};
  ['touch_water', 'victory'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  const M_X = 880;
  function march(c, pose, h, a) {
    const im = MARCH[pose];
    if (a <= 0.02 || !im || !im.complete || !im.naturalWidth) return;
    const w = im.naturalWidth * h / im.naturalHeight;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
    c.beginPath(); c.ellipse(M_X, GY + 3, w * 0.42, 7, 0, 0, TAU); c.fill(); c.restore();
    c.drawImage(im, M_X - w / 2, GY - h, w, h);
    c.restore();
  }

  /* ═══════════ 金屬漸層 ═══════════ */
  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }

  /* ═══════════ 背景：柔光、地面、天花板 ═══════════ */
  function floor(c, a) {
    withA(c, a, () => {
      const gl = c.createRadialGradient(320, 260, 30, 320, 260, 460);
      gl.addColorStop(0, 'rgba(77,210,255,0.06)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
      const g = c.createLinearGradient(0, GY, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
      const e = c.createLinearGradient(0, 0, 960, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.30)'); e.addColorStop(0.5, 'rgba(246,243,234,0.22)'); e.addColorStop(1, 'rgba(246,243,234,0.08)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
    });
  }

  function ceiling(c, a, glowA) {
    withA(c, a, () => {
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(0, CEIL0, 0, CEIL1);
      g.addColorStop(0, '#3e5a52'); g.addColorStop(0.6, '#6f8a82'); g.addColorStop(1, '#93aaa3');
      c.fillStyle = g; W5.rr(c, CX0, CEIL0, CX1 - CX0, CEIL1 - CEIL0, 4); c.fill(); c.restore();
      /* 斜線（固定端記號） */
      c.save(); W5.rr(c, CX0, CEIL0, CX1 - CX0, CEIL1 - CEIL0, 4); c.clip();
      c.strokeStyle = 'rgba(20,40,34,0.55)'; c.lineWidth = 2;
      for (let x = CX0 - 30; x < CX1 + 30; x += 16) { c.beginPath(); c.moveTo(x, CEIL1); c.lineTo(x + 22, CEIL0); c.stroke(); }
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(CX0 + 2, CEIL1); c.lineTo(CX1 - 2, CEIL1); c.stroke();
    });
    if (glowA > 0.02) withA(c, glowA, () => {
      const g = c.createLinearGradient(0, CEIL1 - 10, 0, CEIL1 + 14);
      g.addColorStop(0, W5.rgba(WHITE, 0)); g.addColorStop(0.5, W5.rgba(WHITE, 0.35)); g.addColorStop(1, W5.rgba(WHITE, 0));
      c.fillStyle = g; c.fillRect(PXA - 40, CEIL1 - 10, PXB - PXA + 80, 24);
    });
  }

  /* 吊架：天花板下緣的固定座＋短桿到掛點 Y0 */
  function hanger(c, x, a) {
    withA(c, a, () => {
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
      c.fillStyle = steelH(c, CEIL1, CEIL1 + 9); W5.rr(c, x - 14, CEIL1 - 1, 28, 10, 3); c.fill(); c.restore();
      W5.ball(c, x - 8, CEIL1 + 4, 2.6, '#c9d3d0'); W5.ball(c, x + 8, CEIL1 + 4, 2.6, '#c9d3d0');
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, CEIL1 + 9); c.lineTo(x, Y0); c.stroke();
    });
  }

  /* ═══════════ 直尺（直立，0 在掛點，刻度在右緣） ═══════════ */
  function ruler(c, a) {
    withA(c, a, () => {
      const top = Y0 - 6, h = RMAX * SC + 12;
      c.fillStyle = '#c9d3d0'; c.fillRect(RX + RW / 2 - 3, CEIL1, 6, top - CEIL1);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(RX, 0, RX + RW, 0);
      g.addColorStop(0, '#cfc298'); g.addColorStop(1, '#f4ecd0');
      c.fillStyle = g; W5.rr(c, RX, top, RW, h, 4); c.fill(); c.restore();
      c.strokeStyle = '#6b6240'; c.lineWidth = 2; W5.rr(c, RX, top, RW, h, 4); c.stroke();
      c.strokeStyle = '#3a361f';
      for (let k = 0; k <= RMAX; k++) {
        const y = yOf(k), big = k % 2 === 0;
        c.lineWidth = big ? 2.2 : 1.4;
        c.beginPath(); c.moveTo(RX + RW, y); c.lineTo(RX + RW - (big ? 15 : 8), y); c.stroke();
      }
      for (let k = 0; k <= RMAX; k += 2) W5.label(c, String(k), RX + 17, yOf(k), WHITE, 20, 'center', true);
    });
    T(c, a, 'cm', RX + RW / 2, yOf(RMAX) + 34, DIM, 22, 'center', true);
  }

  /* ═══════════ 彈簧（直立立體線圈：固定圈數，伸長時圈距變大） ═══════════ */
  function coil(c, x, y0, y1) {
    const turns = 13, amp = 18, n = turns * 14;
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const cm = Math.cos((p0 + p1) / 2), front = cm > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (cm > 0.7 ? '#eef4f1' : '#a8b8b3') : '#5f6f6b'; c.lineWidth = front ? 4.2 : 3.2;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }
  /* 整條彈簧：Y0 → 線圈 → 下端掛環；Lcm 總長；回傳下端 y */
  function spring(c, x, Lcm, a) {
    const yb = yOf(Lcm);
    withA(c, a, () => {
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, Y0); c.lineTo(x, Y0 + 6); c.moveTo(x, yb - 6); c.lineTo(x, yb); c.stroke();
      coil(c, x, Y0 + 6, yb - 6);
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(x, yb + 6, 6, 0, TAU); c.stroke();
    });
    return yb;
  }

  /* 重物 60 gw（鋼色圓柱側視＋上鉤）：cx 中心、hookY 鉤子掛點、top 本體上緣 */
  function weight(c, cx, hookY, top, a, txtA) {
    withA(c, a, () => {
      const x = cx - WW / 2;
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, hookY + 8); c.stroke();
      c.beginPath(); c.arc(cx, hookY + 4, 4.5, Math.PI * 0.5, Math.PI * 2.1); c.stroke();
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(x, 0, x + WW, 0);
      g.addColorStop(0, '#4a5553'); g.addColorStop(0.3, '#b9c4c0'); g.addColorStop(0.55, '#8b9894'); g.addColorStop(1, '#3d4745');
      c.fillStyle = g; W5.rr(c, x, top, WW, WH, 7); c.fill(); c.restore();
      c.strokeStyle = 'rgba(20,30,28,0.9)'; c.lineWidth = 1.5; W5.rr(c, x, top, WW, WH, 7); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 7, top + 1.5); c.lineTo(x + WW - 7, top + 1.5); c.stroke();
    });
    T(c, a * (txtA == null ? 1 : txtA), '60 gw', cx, top + WH / 2 + 1, WHITE, 22, 'center', true);
  }

  /* 下橫桿（並聯兩條的下端共用）：y 桿上緣 */
  function bar(c, y, a, glowA) {
    withA(c, a, () => {
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3; c.lineCap = 'round';
      [PXA, PXB].forEach(x => { c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x, y + 2); c.stroke(); });
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = steelH(c, y, y + 10); W5.rr(c, PXC - BAR_HW, y, BAR_HW * 2, 10, 5); c.fill(); c.restore();
      W5.ball(c, PXA, y + 5, 3.2, '#e6eeeb'); W5.ball(c, PXB, y + 5, 3.2, '#e6eeeb');
    });
    if (glowA > 0.02) withA(c, glowA, () => {
      const g = c.createLinearGradient(0, y - 12, 0, y + 22);
      g.addColorStop(0, W5.rgba(WHITE, 0)); g.addColorStop(0.5, W5.rgba(WHITE, 0.4)); g.addColorStop(1, W5.rgba(WHITE, 0));
      c.fillStyle = g; c.fillRect(PXC - BAR_HW - 14, y - 12, BAR_HW * 2 + 28, 34);
    });
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

  /* 黃色張力箭頭（深色描邊＋光暈） */
  function tArrow(c, x0, y0, x1, y1, a, lw, head) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 3) return;
    lw = lw || 5; head = head || 15;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, head + 4);
    c.shadowColor = W5.rgba(T_COL, 0.85); c.shadowBlur = 10;
    W5.arrow(c, x0, y0, x1, y1, T_COL, lw, head);
    c.restore();
  }

  /* 直立量度括號：x、上端 y0、下端 y1；grow 0..1 由上往下長出 */
  function bracket(c, x, y0, y1, col, a, grow, lw) {
    if (a <= 0.02) return;
    grow = grow == null ? 1 : grow;
    const ye = lerp(y0, y1, grow);
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = lw || 3; c.lineCap = 'round';
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

  /* 掛上重物後的伸長：緩緩拉長＋小幅阻尼彈跳後定住（t<0 時為 La） */
  function bounce(La, Lb, t) {
    if (t <= 0) return La;
    if (t >= 3.2) return Lb;              /* 3.2 秒後殘幅 < 0.01 px，直接定住，確保每步結尾完全靜止 */
    return Lb - (Lb - La) * Math.exp(-2.8 * t) * Math.cos(5.2 * t);
  }

  /* ═══════════ 場景狀態 ═══════════ */
  function state(s) {
    const u = s.u, S = {
      single: 0, sx: SX1, sL: L0,                 /* 單條：透明度、x、長度 */
      sW: 0, sWdy: 0, sWdx: 0,                    /* 單條的重物：透明度、位移 */
      pair: 0, pBdx: 0, pL: L0 + D2,              /* 並聯：第二條透明度、第二條滑入位移、長度 */
      barA: 0, barDy: 0, pW: 0, pWdy: 0,          /* 下橫桿、並聯重物 */
      fA: 0, fG: 0                                 /* 外力箭頭（透明度、長出） */
    };
    if (s.n === 1) {
      const drop = ease(seg(u, 1.2, 1.9));
      S.single = 1; S.sW = drop; S.sWdy = (1 - drop) * -30; S.sWdx = (1 - drop) * 120;   /* 從右上方移入掛上 */
      S.sL = bounce(L0, L0 + D1, u - 1.9);
      S.fA = fin(s, 1, 3.6, 0.4); S.fG = ease(seg(u, 3.6, 4.2));
      return S;
    }
    if (s.n === 2) {
      const off = ease(seg(u, 0.1, 1.0));          /* 先把重物拿走：彈簧縮回原長 */
      S.sW = 1 - off; S.sWdx = off * 60; S.sWdy = off * 30;
      S.sL = u < 0.3 ? L0 + D1 : bounce(L0 + D1, L0, u - 0.3);
      S.fA = 1 - ease(seg(u, 0, 0.4)); S.fG = 1;
      const mv = ease(seg(u, 1.3, 2.6));           /* 單條沿天花板滑到並聯左位 */
      S.single = 1; S.sx = lerp(SX1, PXA, mv);
      S.pair = ease(seg(u, 2.0, 2.8)); S.pBdx = (1 - ease(seg(u, 2.0, 3.0))) * 140;
      S.barA = ease(seg(u, 3.0, 3.6)); S.barDy = (1 - S.barA) * 24;
      const hang = ease(seg(u, 3.7, 4.4));
      S.pW = hang; S.pWdy = (1 - hang) * -46;
      S.pL = bounce(L0, L0 + D2, u - 4.4);
      if (u < 3.0) S.pL = L0;
      S.afterSlide = u >= 2.6;
      return S;
    }
    S.single = 1; S.sx = PXA; S.pair = 1; S.barA = 1; S.pW = 1; S.pL = L0 + D2; S.afterSlide = true;
    return S;
  }

  /* 兩個 #rrggbb 混色，回傳 #rrggbb（W5.ball 需要 hex） */
  function mixHex(a, b, t) {
    const h = v => parseInt(v, 16), A = [1, 3, 5].map(i => h(a.slice(i, i + 2))), B = [1, 3, 5].map(i => h(b.slice(i, i + 2)));
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
  }

  /* 第 3 步：力的流動粒子（從外力箭頭往上到橫桿中央 → 分成兩股 → 沿彈簧往上，珊瑚漸變黃） */
  function flow(c, s, barY, arrowEnd) {
    const u = s.u, a = seg(u, 0.8, 1.2) * (1 - seg(u, 4.6, 5.4));
    if (a <= 0.02) return;
    const pts = side => [[PXC, arrowEnd], [PXC, barY + 5], [side, barY + 5], [side, Y0 + 10]];
    const seglen = p => { const d = []; let tot = 0; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); d.push(l); tot += l; } return { d, tot }; };
    [PXA, PXB].forEach((side, si) => {
      const p = pts(side), { d, tot } = seglen(p), split = (d[0]) / tot;
      for (let i = 0; i < 9; i++) {
        /* 第 i 顆在 i/9 輪後才出發（從箭頭尖端依序流出），之後循環 */
        let q = (u - 0.8) * 0.42 - i / 9;
        if (q < 0) continue;
        q = q % 1;
        let dist = q * tot, k = 0;
        while (k < d.length - 1 && dist > d[k]) { dist -= d[k]; k++; }
        const f = clamp01(dist / d[k]);
        const x = lerp(p[k][0], p[k + 1][0], f), y = lerp(p[k][1], p[k + 1][1], f);
        const col = q < split ? F_COL : mixHex(F_COL, T_COL, clamp01((q - split) / 0.25));
        const fade = Math.min(1, q / 0.06, (1 - q) / 0.08);
        withA(c, a * fade, () => {
          W5.glow(c, x, y, 16, q < split ? F_COL : T_COL, 0.55);
          W5.ball(c, x, y, q < split ? 6.5 : 5, col);
        });
      }
    });
  }

  /* 右側說明欄的比較長條（第 4 步）：單條 6 cm vs 並聯 3 cm */
  function compareBars(c, s) {
    const x0 = 700, pc = 25;
    const rows = [
      { y: IY[1] + 4, txt: L('單條', 'Single'), cm: D1, col: X_COL, a: fin(s, 4, 4.6, 0.5), g: ease(seg(s.u, 4.6, 5.3)), dim: true },
      { y: IY[2] + 10, txt: L('並聯', 'Parallel'), cm: D2, col: X_COL, a: fin(s, 4, 5.3, 0.5), g: ease(seg(s.u, 5.3, 5.9)), dim: false }
    ];
    rows.forEach(r => {
      if (r.a <= 0.02) return;
      T(c, r.a, r.txt, x0 - 12, r.y, r.dim ? DIM : WHITE, 22, 'right');
      withA(c, r.a, () => {
        c.save(); c.fillStyle = 'rgba(77,210,255,0.10)'; W5.rr(c, x0, r.y - 10, D1 * pc, 20, 6); c.fill(); c.restore();
        const w = r.cm * pc * r.g;
        if (w > 4) {
          c.save(); c.shadowColor = W5.rgba(r.col, 0.7); c.shadowBlur = r.dim ? 4 : 12;
          c.fillStyle = r.dim ? W5.rgba(r.col, 0.55) : r.col; W5.rr(c, x0, r.y - 10, w, 20, 6); c.fill(); c.restore();
        }
      });
      T(c, r.a * ease(seg(r.g, 0.6, 1)), r.cm + ' cm', x0 + r.cm * pc + 10, r.y, r.dim ? W5.mix(X_COL, '#0d201a', 0.25) : X_COL, 22, 'left', true);
    });
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = state(s);
    const a1 = s.n === 1 ? s.k : 1;

    floor(c, a1);

    /* ── 第 4 步：單條 6 cm 的虛影（畫在最底層，淡淡的） ── */
    const ghA = fin(s, 4, 0.6, 0.8) * 0.32;
    if (ghA > 0.02) {
      withA(c, ghA, () => {
        hanger(c, SX1, 1);
        const yb = spring(c, SX1, L0 + D1, 1);
        weight(c, SX1, yb + 12, yb + 26, 1, 0);
      });
      T(c, fin(s, 4, 0.9, 0.6), L('單條', 'Single'), SX1, yOf(L0 + D1) + 104, DIM, 22, 'center');
    }

    ceiling(c, a1, s.n === 2 ? Math.sin(Math.PI * seg(s.u, 5.4, 6.6)) * 0.9 : 0);
    ruler(c, a1);

    /* 原長參考線（第 1 步出現；第 4 步再拉一條橫跨的） */
    const oA = (s.n === 1 ? fin(s, 1, 0.8, 0.5) : s.n === 2 ? fout(s, 2, 0, 0.4) : 0);
    bracket(c, B1X, Y0, yOf(L0), DIM, oA, s.n === 1 ? ease(seg(s.u, 0.8, 1.4)) : 1);
    T(c, oA * (s.n === 1 ? fin(s, 1, 1.2, 0.4) : 1), L('原長 10 cm', 'Natural 10 cm'), B1X + 14, yOf(L0 / 2), WHITE, 22, 'left');
    dash(c, RX + RW, B1X + 10, yOf(L0), 'rgba(163,184,176,0.85)', oA * (s.n === 1 ? fin(s, 1, 1.2, 0.4) : 1));
    dash(c, RX + RW, B2X + 14, yOf(L0), 'rgba(163,184,176,0.85)', fin(s, 4, 1.4, 0.5));

    /* ── 單條彈簧（第 2 步滑到並聯左位，之後就是並聯的左條） ── */
    hanger(c, S.sx, a1 * S.single);
    const ybS = spring(c, S.sx, S.afterSlide ? S.pL : S.sL, a1 * S.single);
    if (S.sW > 0.02) {
      const yb = yOf(S.sL);
      c.save(); c.translate(S.sWdx, S.sWdy);
      weight(c, SX1, yb + 12, yb + 26, a1 * S.sW);
      c.restore();
    }
    /* 單條的外力箭頭＋ΔX 括號（第 1 步；第 2 步開頭淡出） */
    if (s.n === 1 || (s.n === 2 && s.u < 0.6)) {
      const yb = yOf(S.sL), fy = yb + 26 + WH + 6;
      forceArrow(c, SX1, fy, ARR * S.fG, S.fA * a1);
      T(c, S.fA * ease(seg(S.fG, 0.6, 1)), '60 gw', SX1 + 18, fy + ARR * 0.55, F_COL, 22, 'left', true);
      const bA = s.n === 1 ? fin(s, 1, 4.2, 0.4) : fout(s, 2, 0, 0.4);
      bracket(c, B1X, yOf(L0), yOf(L0 + D1), X_COL, bA, s.n === 1 ? ease(seg(s.u, 4.2, 4.8)) : 1);
      T(c, bA * (s.n === 1 ? fin(s, 1, 4.7, 0.4) : 1), '6 cm', B1X + 14, yOf(L0 + D1 / 2), X_COL, 22, 'left', true);
    }

    /* ── 並聯：第二條、下橫桿、重物 ── */
    if (S.pair > 0.02) {
      hanger(c, PXB + S.pBdx, S.pair);
      spring(c, PXB + S.pBdx, S.pL, S.pair);
    }
    const ybP = yOf(S.pL), barY = ybP + 12;
    if (S.barA > 0.02) bar(c, barY + S.barDy, S.barA, s.n === 2 ? Math.sin(Math.PI * seg(s.u, 5.4, 6.6)) * 0.9 : 0);
    if (S.pW > 0.02) {
      c.save(); c.translate(0, S.pWdy);
      weight(c, PXC, barY + 10, barY + 10 + 18, S.pW);
      c.restore();
    }
    const fyP = barY + 10 + 18 + WH + 6;
    const fPA = s.n === 2 ? fin(s, 2, 5.0, 0.5) : s.n > 2 ? 1 : 0;
    forceArrow(c, PXC, fyP, ARR * (s.n === 2 ? ease(seg(s.u, 5.0, 5.6)) : 1), fPA);
    T(c, fPA * (s.n === 2 ? fin(s, 2, 5.4, 0.4) : 1), '60 gw', PXC + 18, fyP + ARR * 0.55, F_COL, 22, 'left', true);

    /* ── 第 3、4 步：力分成兩股，每條 30 gw（黃色張力，向上拉住橫桿） ── */
    if (s.n === 3) flow(c, s, barY, fyP + ARR);
    const tA = s.n === 3 ? fin(s, 3, 2.6, 0.5) : s.n === 4 ? 1 : 0;
    const tG = s.n === 3 ? ease(seg(s.u, 2.6, 3.3)) : 1;
    if (tA > 0.02) {
      const yA = yOf(11.6), yB = lerp(yA, yOf(4.4), tG);
      tArrow(c, TAX, yA, TAX, yB, tA);
      tArrow(c, TBX, yA, TBX, yB, tA);
      const lA = s.n === 3 ? fin(s, 3, 3.2, 0.4) : 1;
      T(c, lA, '30 gw', TAX - 14, yOf(8), T_COL, 22, 'right', true);
      T(c, lA, '30 gw', TBX + 14, yOf(8), T_COL, 22, 'left', true);
      if (s.n === 3) {
        const pg = Math.sin(Math.PI * seg(s.u, 3.2, 4.2));
        if (pg > 0.02) { W5.glow(c, TAX, yOf(8), 40, T_COL, 0.35 * pg); W5.glow(c, TBX, yOf(8), 40, T_COL, 0.35 * pg); }
      }
    }
    /* 橫桿中央的分叉點 */
    const fkA = s.n === 3 ? fin(s, 3, 1.4, 0.4) : 0;
    if (fkA > 0.02) {
      W5.glow(c, PXC, barY + 5, 30, F_COL, 0.4 * fkA * (s.n === 3 ? 1 - 0.6 * seg(s.u, 5, 6) : 1));
      withA(c, fkA, () => W5.ball(c, PXC, barY + 5, 6, F_COL));
    }

    /* ── 第 4 步：量度括號（單條虛影 6 cm、並聯 3 cm） ── */
    if (s.n === 4) {
      const gA = fin(s, 4, 1.8, 0.4);
      bracket(c, B1X, yOf(L0), yOf(L0 + D1), X_COL, gA * 0.6, ease(seg(s.u, 1.8, 2.5)));
      T(c, fin(s, 4, 2.4, 0.4) * 0.75, '6 cm', B1X + 14, yOf(L0 + D1 / 2) + 10, X_COL, 22, 'left', true);
      const pA = fin(s, 4, 2.9, 0.4);
      bracket(c, B2X, yOf(L0), yOf(L0 + D2), X_COL, pA, ease(seg(s.u, 2.9, 3.4)));
      if (pA > 0.02) W5.glow(c, B2X, yOf(L0 + D2 / 2), 46, X_COL, 0.22 * pA);
      T(c, fin(s, 4, 3.3, 0.4), '3 cm', B2X + 14, yOf(L0 + D2 / 2), X_COL, 22, 'left', true);
    }

    /* ═══ 右側說明欄（每步一組；上一步的在新步開頭 0.5 秒內淡出） ═══ */
    const out = n => (s.n === n ? 1 : (s.n === n % 4 + 1 ? fout(s, n % 4 + 1, 0, 0.5) : 0));
    /* 第 1 步 */
    if (s.n === 1 || s.n === 2) {
      const o = out(1);
      P(c, o * (s.n === 1 ? fin(s, 1, 1.0, 0.5) : 1), L('一條彈簧掛 60 gw', 'One spring holds 60 gw'), IX, IY[0], WHITE, 24, 'center');
      P(c, o * (s.n === 1 ? fin(s, 1, 4.9, 0.5) : 1), L('伸長 6 cm', 'It stretches 6 cm'), IX, IY[1], X_COL, 24, 'center');
      T(c, o * (s.n === 1 ? fin(s, 1, 5.6, 0.5) : 1), L('每 10 gw 伸長 1 cm', '1 cm for every 10 gw'), IX, IY[2], DIM, 22, 'center');
    }
    /* 第 2 步 */
    if (s.n === 2 || s.n === 3) {
      const o = out(2);
      P(c, o * (s.n === 2 ? fin(s, 2, 1.2, 0.5) : 1), L('換成兩條相同彈簧', 'Now two identical springs'), IX, IY[0], WHITE, 24, 'center');
      const pa = o * (s.n === 2 ? fin(s, 2, 5.4, 0.5) : 1);
      if (pa > 0.02 && s.n === 2) W5.glow(c, IX, IY[1], 150, WHITE, 0.07 * pa);
      P(c, pa, L('並聯：平行並列', 'Parallel: side by side'), IX, IY[1], WHITE, 24, 'center');
      T(c, o * (s.n === 2 ? fin(s, 2, 6.0, 0.5) : 1), L('上端、下端各接在一起', 'Tops joined, bottoms joined'), IX, IY[2], DIM, 22, 'center');
    }
    /* 第 3 步 */
    if (s.n === 3 || s.n === 4) {
      const o = out(3);
      P(c, o * (s.n === 3 ? fin(s, 3, 0.6, 0.5) : 1), L('60 gw 由兩條分擔', 'Two springs share 60 gw'), IX, IY[0], WHITE, 24, 'center');
      P(c, o * (s.n === 3 ? fin(s, 3, 4.4, 0.5) : 1), '60 gw ÷ 2 = 30 gw', IX, IY[1], T_COL, 24, 'center', true);
      T(c, o * (s.n === 3 ? fin(s, 3, 5.2, 0.5) : 1), L('每條只承受一半', 'Each holds only half'), IX, IY[2], WHITE, 22, 'center');
    }
    /* 第 4 步 */
    if (s.n === 4 || s.n === 1) {
      const o = out(4);
      const ha = o * (s.n === 4 ? fin(s, 4, 3.9, 0.5) : 1);
      if (ha > 0.02 && s.n === 4) W5.glow(c, IX, IY[0], 170, X_COL, 0.08 * ha);
      P(c, ha, L('並聯：伸長只剩一半', 'Parallel: half the stretch'), IX, IY[0], X_COL, 24, 'center');
      if (s.n === 4) compareBars(c, s);
    }

    /* March：第 4 步結尾換成 victory */
    const vA = s.n === 4 ? fin(s, 4, 6.4, 0.6) : 0;
    march(c, 'touch_water', 196, a1 * (1 - vA));
    march(c, 'victory', 206, vA);
  }

  W5.register('parallel', { canvas: 'cvs-parallel', steps: DUR, draw });
})();
