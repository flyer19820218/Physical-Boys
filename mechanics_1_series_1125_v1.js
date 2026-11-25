/* ==================================================================
   mechanics_1 ｜ 彈簧串聯（cvs-series，960×540）
   四步：1 單條彈簧 → 2 再串一條 → 3 伸長量相加 → 4 串三條
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：每條彈簧相同，原長 10 cm、k＝10 gw/cm；
     總拉力 F＝30 gw → 每條伸長 3 cm；兩條總伸長 6 cm、三條 9 cm。
   語意色（全站）：外力 F＝珊瑚 COL.coral；伸長量 ΔX＝青 COL.teal；張力＝黃 COL.yellow。
   版面：彈簧橫放（軸線 AY），左端固定在牆上（牆面 X0＝直尺 0 cm），右端受向右的拉力 F；
         下方水平直尺（0～40 cm，每 cm SC px）；直尺下方是伸長量分段與總伸長量；
         右下角 March 站在地面線 GY 上當解說（touch_water → 第 4 步結尾換 victory）。
   畫風沿用 hooke／tension：立體線圈（前亮後暗）、鋼色漸層、珊瑚外力箭頭、黃張力箭頭、
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
  const DUR = [9, 10, 10, 10];       /* 總長 39 秒 */

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
  const X0 = 60;                     /* 牆面＝彈簧左端＝直尺 0 cm */
  const SC = 17;                     /* 每 cm 幾 px（40 cm → x 740） */
  const xOf = cm => X0 + cm * SC;
  const AY = 215;                    /* 彈簧軸線 y */
  const AMP = 20;                    /* 線圈半高 */
  const TURNS = 9;                   /* 每條圈數（固定，拉長時圈距變大） */
  const TY = 160, TLY = 134;         /* 黃色張力箭頭 y、上方「30 gw」y */
  const BY = 268, BLY = 293;         /* 每條彈簧下方的量度括號 y、標籤 y */
  const RY = 318, RH = 44, RMAX = 40;/* 直尺上緣、高、最大 cm */
  const SY = 382, SLY = 403;         /* 直尺下方分段括號 y、分段數字 y */
  const TOTY = 426, TOTLY = 459;     /* 總伸長量括號 y、pill y */
  const LINEY = 500;                 /* 第 4 步總結字 y */
  const CAPY = 72;                   /* 上方說明 pill y */
  const GY = 520;                    /* 地面線 */
  const FLEN = 120;                  /* 外力箭頭全長 */
  const L0 = 10, DX = 3;             /* 原長、每條伸長 */

  /* ═══════════ March（右下角解說） ═══════════ */
  const MARCH = {};
  ['touch_water', 'victory'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  const M_X = 884;
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

  /* ═══════════ 地面、牆 ═══════════ */
  function floor(c, a) {
    withA(c, a, () => {
      const gl = c.createRadialGradient(420, 260, 30, 420, 260, 480);
      gl.addColorStop(0, 'rgba(77,210,255,0.05)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
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

  function wall(c, a) {
    withA(c, a, () => {
      const x0 = 18, top = 104;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetX = 4;
      const g = c.createLinearGradient(x0, 0, X0, 0);
      g.addColorStop(0, '#3e5a52'); g.addColorStop(0.7, '#6f8a82'); g.addColorStop(1, '#93aaa3');
      c.fillStyle = g; W5.rr(c, x0, top, X0 - x0, GY - top + 2, 4); c.fill(); c.restore();
      /* 斜線（固定端記號） */
      c.save(); W5.rr(c, x0, top, X0 - x0, GY - top, 4); c.clip();
      c.strokeStyle = 'rgba(20,40,34,0.55)'; c.lineWidth = 2;
      for (let y = top - 40; y < GY + 40; y += 16) { c.beginPath(); c.moveTo(x0, y + 30); c.lineTo(X0, y); c.stroke(); }
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X0, top + 2); c.lineTo(X0, GY); c.stroke();
      /* 固定板＋螺栓 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
      c.fillStyle = steelV(c, X0 - 4, X0 + 6); W5.rr(c, X0 - 3, AY - 26, 9, 52, 3); c.fill(); c.restore();
      W5.ball(c, X0 + 1, AY - 17, 3.5, '#c9d3d0'); W5.ball(c, X0 + 1, AY + 17, 3.5, '#c9d3d0');
    });
  }

  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.4, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }

  /* ═══════════ 直尺（水平，刻度在上緣朝向彈簧） ═══════════ */
  function ruler(c, a) {
    withA(c, a, () => {
      const x0 = X0 - 8, x1 = xOf(RMAX) + 10;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(0, RY, 0, RY + RH);
      g.addColorStop(0, '#f4ecd0'); g.addColorStop(1, '#cfc298');
      c.fillStyle = g; W5.rr(c, x0, RY, x1 - x0, RH, 4); c.fill(); c.restore();
      c.strokeStyle = '#6b6240'; c.lineWidth = 2; W5.rr(c, x0, RY, x1 - x0, RH, 4); c.stroke();
      c.strokeStyle = '#3a361f';
      for (let k = 0; k <= RMAX; k++) {
        const x = xOf(k), big = k % 5 === 0;
        c.lineWidth = big ? 2.2 : 1.3;
        c.beginPath(); c.moveTo(x, RY); c.lineTo(x, RY + (big ? 14 : 8)); c.stroke();
      }
      for (let k = 0; k <= RMAX; k += 5) W5.label(c, String(k), xOf(k), RY + 29, WHITE, 20, 'center', true);
    });
    T(c, a, 'cm', xOf(RMAX) + 36, RY + 22, DIM, 22, 'center', true);
  }

  /* 直尺上的讀數記號：從彈簧端點拉虛線到直尺，直尺上緣一個小三角 */
  function drop(c, cm, a, col, y0) {
    if (a <= 0.02) return;
    const x = xOf(cm);
    withA(c, a, () => {
      c.save(); c.setLineDash([5, 5]); c.strokeStyle = W5.rgba(col, 0.8); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y0 == null ? AY + AMP + 6 : y0); c.lineTo(x, RY - 2); c.stroke(); c.restore();
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x, RY + 1); c.lineTo(x - 7, RY - 10); c.lineTo(x + 7, RY - 10); c.closePath(); c.fill();
    });
  }

  /* ═══════════ 彈簧（水平立體線圈） ═══════════ */
  function coil(c, x0, x1, y) {
    const n = TURNS * 14;
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * TURNS * TAU, p1 = s1 * TURNS * TAU;
        const cm = Math.cos((p0 + p1) / 2), front = cm > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (cm > 0.7 ? '#eef4f1' : '#a8b8b3') : '#5f6f6b'; c.lineWidth = front ? 4.2 : 3.2;
        c.beginPath(); c.moveTo(lerp(x0, x1, s0), y - AMP * Math.sin(p0)); c.lineTo(lerp(x0, x1, s1), y - AMP * Math.sin(p1)); c.stroke();
      }
    }
    c.restore();
  }
  /* 一條彈簧：xs 左端、xe 右端（兩端各一個小掛環，長度量到兩端） */
  function spring(c, xs, xe, a) {
    withA(c, a, () => {
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 6; c.shadowOffsetY = 4;
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.arc(xs + 6, AY, 6, 0, TAU); c.stroke();
      c.beginPath(); c.arc(xe - 6, AY, 6, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(xs + 12, AY); c.lineTo(xs + 17, AY); c.moveTo(xe - 17, AY); c.lineTo(xe - 12, AY); c.stroke();
      c.restore();
      coil(c, xs + 17, xe - 17, AY);
    });
  }

  /* 右端拉環＋外力箭頭（珊瑚、向右、帶光暈）；g 0..1 長出 */
  function puller(c, xe, g, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(xe, AY); c.lineTo(xe + 10, AY); c.stroke();
      W5.ball(c, xe + 13, AY, 6, '#c9d3d0');
    });
    const len = FLEN * g;
    if (len < 6) return;
    const x0 = xe + 20, x1 = x0 + len, head = Math.min(22, Math.max(10, len * 0.35)), lw = 8;
    c.save(); c.globalAlpha *= a;
    c.shadowColor = W5.rgba(F_COL, 0.8); c.shadowBlur = 14; c.fillStyle = F_COL;
    if (len - head > 0) { W5.rr(c, x0, AY - lw / 2, len - head + 2, lw, 3); c.fill(); }
    c.beginPath(); c.moveTo(x1, AY); c.lineTo(x1 - head, AY - head * 0.75); c.lineTo(x1 - head, AY + head * 0.75); c.closePath(); c.fill();
    c.restore();
  }

  /* 黃色張力箭頭（深色描邊＋光暈） */
  function tArrow(c, x0, y0, x1, y1, a, lw, head) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 3) return;
    lw = lw || 4.5; head = head || 14;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, head + 4);
    c.shadowColor = W5.rgba(T_COL, 0.85); c.shadowBlur = 10;
    W5.arrow(c, x0, y0, x1, y1, T_COL, lw, head);
    c.restore();
  }
  /* 一條彈簧上方：兩個向外的小黃箭頭（兩端都被拉）＋「30 gw」 */
  function eachForce(c, xs, xe, a, g) {
    if (a <= 0.02) return;
    const cx = (xs + xe) / 2, len = Math.min(70, (xe - xs) / 2 - 26) * g;
    withA(c, a * 0.6, () => {
      c.save(); c.strokeStyle = W5.rgba(T_COL, 0.55); c.lineWidth = 2; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(xs + 8, TY); c.lineTo(xs + 8, AY - AMP - 6); c.moveTo(xe - 8, TY); c.lineTo(xe - 8, AY - AMP - 6); c.stroke(); c.restore();
    });
    tArrow(c, cx - 6, TY, cx - 6 - len, TY, a, 5, 15);
    tArrow(c, cx + 6, TY, cx + 6 + len, TY, a, 5, 15);
    withA(c, a, () => { c.fillStyle = INK; c.beginPath(); c.arc(cx, TY, 7, 0, TAU); c.fill(); W5.ball(c, cx, TY, 5.5, T_COL); });
    T(c, a * g, '30 gw', cx, TLY, T_COL, 22, 'center', true);
  }

  /* 水平量度括號：x0..x1，y；grow 0..1 由左往右長出 */
  function hBracket(c, x0, x1, y, col, a, grow, lw) {
    if (a <= 0.02) return;
    grow = grow == null ? 1 : grow;
    const xe = lerp(x0, x1, grow);
    c.save(); c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = lw || 3; c.lineCap = 'round';
    c.shadowColor = W5.rgba(col, 0.7); c.shadowBlur = 8;
    c.beginPath(); c.moveTo(x0, y - 8); c.lineTo(x0, y + 8); c.moveTo(x0, y); c.lineTo(xe, y); c.stroke();
    if (grow > 0.98) { c.beginPath(); c.moveTo(x1, y - 8); c.lineTo(x1, y + 8); c.stroke(); }
    c.restore();
  }
  /* 原長記號：彈簧軸上的白色短虛線（「不拉時會停在這裡」） */
  function ghostEnd(c, cm, a) {
    if (a <= 0.02) return;
    const x = xOf(cm);
    withA(c, a, () => {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, AY - AMP - 10); c.lineTo(x, BY + 8); c.stroke(); c.restore();
    });
  }

  /* ═══════════ 場景狀態 ═══════════ */
  /* 回傳：條數 n、滑入中那條的位移 slide（px）、每條長度 Lc（cm）、外力箭頭比例 fg */
  function bounce(La, Lb, t) {
    if (t <= 0) return La;
    return Lb - (Lb - La) * Math.exp(-3.0 * t) * Math.cos(5.2 * t);
  }
  function state(s) {
    const u = s.u;
    if (s.n === 1) {
      return { n: 1, slide: 0, Lc: bounce(L0, L0 + DX, u - 2.0), fg: ease(seg(u, 1.8, 2.4)) };
    }
    if (s.n === 2) {
      const rel = ease(seg(u, 0.1, 0.9));                       /* 先放手：彈簧縮回原長 */
      const Lc = u < 2.8 ? lerp(L0 + DX, L0, rel) : bounce(L0, L0 + DX, u - 2.8);
      const fg = u < 2.6 ? 1 - ease(seg(u, 0, 0.5)) : ease(seg(u, 2.6, 3.2));
      return { n: u < 0.8 ? 1 : 2, slide: (1 - ease(seg(u, 0.8, 2.2))) * 760, Lc, fg };
    }
    if (s.n === 3) return { n: 2, slide: 0, Lc: L0 + DX, fg: 1 };
    const rel = ease(seg(u, 0.1, 0.9));
    const Lc = u < 2.4 ? lerp(L0 + DX, L0, rel) : bounce(L0, L0 + DX, u - 2.4);
    const fg = u < 2.2 ? 1 - ease(seg(u, 0, 0.5)) : ease(seg(u, 2.2, 2.8));
    return { n: u < 0.8 ? 2 : 3, slide: (1 - ease(seg(u, 0.8, 2.0))) * 560, Lc, fg };
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = state(s);
    const a1 = s.n === 1 ? s.k : 1;
    const segPx = S.Lc * SC;

    floor(c, a1);

    /* ── 彈簧鏈：第 1 條固定在牆；新接上的那條從右邊滑進來 ── */
    const sliding = (s.n === 2 || s.n === 4) && s.u >= 0.8 && S.slide > 0.5;
    const fixedN = sliding ? S.n - 1 : S.n;
    const ends = [];                                 /* 每條 [xs, xe] */
    for (let i = 0; i < S.n; i++) ends.push([X0 + i * segPx, X0 + (i + 1) * segPx]);
    const chainEnd = X0 + fixedN * segPx;            /* 已連上的鏈末端 */

    /* 張力貫穿：沿軸線的黃色光帶（第 2 步出現，之後保留到第 4 步放手） */
    let bandA = 0, bandG = 1;
    if (s.n === 2) { bandA = fin(s, 2, 4.6, 0.4); bandG = ease(seg(s.u, 4.6, 5.4)); }
    else if (s.n === 3) bandA = 1;
    else if (s.n === 4) { bandA = fout(s, 4, 0, 0.5) + fin(s, 4, 4.0, 0.5); bandG = s.u < 1 ? 1 : ease(seg(s.u, 4.0, 4.8)); }
    if (bandA > 0.02) withA(c, Math.min(1, bandA) * 0.9, () => {
      const xR = X0 + S.n * segPx, xL = lerp(xR, X0, bandG);
      const g = c.createLinearGradient(0, AY - 30, 0, AY + 30);
      g.addColorStop(0, W5.rgba(T_COL, 0)); g.addColorStop(0.5, W5.rgba(T_COL, 0.28)); g.addColorStop(1, W5.rgba(T_COL, 0));
      c.fillStyle = g; c.fillRect(xL, AY - 30, xR - xL, 60);
    });

    wall(c, a1);
    ruler(c, a1);
    for (let i = 0; i < S.n; i++) {
      const dx = i >= fixedN && sliding ? S.slide : 0;
      const [xs, xe] = ends[i];
      spring(c, xs + dx, xe + dx, a1);
    }
    /* 接點：黃色小光點（張力貫穿） */
    const jointA = s.n === 2 ? fin(s, 2, 5.2, 0.4) : s.n === 3 ? 1 : 0;
    for (let i = 1; i < S.n; i++) {
      const ja = s.n === 4 ? fin(s, 4, 4.0, 0.5) : jointA;
      if (ja > 0.02) { W5.glow(c, ends[i][0], AY, 26, T_COL, 0.45 * ja); withA(c, ja, () => W5.ball(c, ends[i][0], AY, 6, T_COL)); }
    }
    /* 剛接上的白色閃光 */
    const flashT = s.n === 2 ? s.u - 2.2 : s.n === 4 ? s.u - 2.0 : -1;
    if (flashT > 0 && flashT < 0.8) W5.glow(c, chainEnd, AY, 40, WHITE, 0.6 * Math.sin(Math.PI * flashT / 0.8));

    /* 外力 F：接在已連上的鏈末端；新彈簧滑入時，把手跟著新彈簧右端走 */
    const handX = sliding ? ends[S.n - 1][1] + S.slide : ends[S.n - 1][1];
    puller(c, handX, S.fg, a1);
    const fLabA = S.fg > 0.6 ? ease((S.fg - 0.6) / 0.4) : 0;
    P(c, fLabA * a1, 'F = 30 gw', handX + 20 + FLEN / 2, TY + 6, F_COL, 22, 'center', true);

    /* ═══ 第 1 步：原長＋伸長 3 cm ═══ */
    if (s.n === 1 || s.n === 2) {
      const fa = s.n === 2 ? fout(s, 2, 0, 0.5) : 1;
      const oa = (s.n === 1 ? fin(s, 1, 0.8, 0.6) : 1) * fa;
      hBracket(c, xOf(0), xOf(L0), BY, WHITE, oa * 0.85, s.n === 1 ? ease(seg(s.u, 0.8, 1.4)) : 1, 2.5);
      T(c, oa, L('原長 10 cm', 'Original 10 cm'), xOf(4.8), BLY, WHITE, 22, 'center');
      const ta = (s.n === 1 ? fin(s, 1, 3.8, 0.4) : 1) * fa;
      drop(c, L0, ta * 0.7, WHITE, BY + 10);
      drop(c, L0 + DX, ta, X_COL);
      hBracket(c, xOf(L0), xOf(L0 + DX), BY, X_COL, ta, s.n === 1 ? ease(seg(s.u, 4.0, 4.6)) : 1);
      T(c, (s.n === 1 ? fin(s, 1, 4.6, 0.4) : 1) * fa, '3 cm', xOf(L0 + DX / 2) + 8, BLY, X_COL, 22, 'center', true);
      P(c, (s.n === 1 ? fin(s, 1, 5.0, 0.6) : 1) * fa, L('一條彈簧：拉力 30 gw，伸長 3 cm', 'One spring: pulled by 30 gw, it stretches 3 cm'), 480, CAPY, WHITE, 24, 'center');
    }

    /* ═══ 第 2 步：再串一條；每條都受 F；張力貫穿 ═══ */
    if (s.n === 2) {
      const ca = fin(s, 2, 0.6, 0.5) * fout(s, 2, 5.6, 0.4);
      P(c, ca, L('再串一條：頭尾相連', 'Add another: join end to end'), 480, CAPY, WHITE, 24, 'center');
      T(c, fin(s, 2, 2.2, 0.4) * fout(s, 2, 4.4, 0.4), L('頭尾相連', 'End to end'), xOf(L0), BLY - 18, WHITE, 22, 'center');
    }
    if (s.n === 2 || s.n === 3) {
      const ea = [s.n === 2 ? fin(s, 2, 5.6, 0.5) : 1, s.n === 2 ? fin(s, 2, 6.0, 0.5) : 1];
      for (let i = 0; i < Math.min(2, S.n); i++) eachForce(c, ends[i][0], ends[i][1], ea[i], s.n === 2 ? ea[i] : 1);
      if (s.n === 2 && S.n === 2) {
        P(c, fin(s, 2, 6.0, 0.5), L('每條都受 F = 30 gw', 'Each spring feels F = 30 gw'), 480, CAPY, T_COL, 24, 'center');
        P(c, fin(s, 2, 5.3, 0.5), L('張力貫穿', 'Tension runs through'), ends[1][0], BY + 6, T_COL, 22, 'center');
      }
    }

    /* ═══ 第 3 步：每條各伸長 3 cm → 直尺上 3 ＋ 3 → 總伸長 6 cm ═══ */
    if (s.n === 3) {
      P(c, fin(s, 3, 0.3, 0.5), L('每條各伸長 3 cm，總伸長量相加', 'Each stretches 3 cm, and the stretches add up'), 480, CAPY, X_COL, 24, 'center');
      const mv = ease(seg(s.u, 3.0, 4.4));
      for (let i = 0; i < 2; i++) {
        const st = ends[i][0] - X0;                       /* 這條的起點（px） */
        const gA = fin(s, 3, 0.8 + i * 0.3, 0.4) * (1 - ease(seg(s.u, 3.0, 3.6)));
        ghostEnd(c, (st / SC) + L0, gA);
        const bx0 = lerp(X0 + st + L0 * SC, xOf(2 * L0 + i * DX), mv), bx1 = bx0 + DX * SC;
        const by = lerp(BY, SY, mv);
        const t0 = 1.0 + i * 0.6;
        hBracket(c, bx0, bx1, by, X_COL, fin(s, 3, t0, 0.3), ease(seg(s.u, t0, t0 + 0.6)));
        T(c, fin(s, 3, t0 + 0.5, 0.3) * (1 - ease(seg(s.u, 3.0, 3.4))), '3 cm', (bx0 + bx1) / 2 + 8, BLY, X_COL, 22, 'center', true);
        T(c, fin(s, 3, 4.2 + i * 0.2, 0.3), '3', (bx0 + bx1) / 2, SLY, X_COL, 22, 'center', true);
      }
      drop(c, 2 * L0, fin(s, 3, 3.8, 0.4) * 0.7, WHITE, AY + AMP + 6);
      drop(c, 2 * (L0 + DX), fin(s, 3, 3.8, 0.4), X_COL);
      T(c, fin(s, 3, 4.4, 0.4), '+', xOf(2 * L0 + DX), SLY, X_COL, 22, 'center', true);
      hBracket(c, xOf(2 * L0), xOf(2 * L0 + 2 * DX), TOTY, X_COL, fin(s, 3, 4.8, 0.3), ease(seg(s.u, 4.8, 5.5)), 4);
      P(c, fin(s, 3, 5.5, 0.5), L('總伸長量 6 cm', 'Total stretch 6 cm'), xOf(2 * L0 + DX), TOTLY, X_COL, 22, 'center');
      const eA = fin(s, 3, 6.2, 0.6);
      if (eA > 0.02) W5.glow(c, 200, TOTLY, 140, X_COL, 0.10 * eA);
      P(c, eA, '3 + 3 = 6 cm', 200, TOTLY, X_COL, 24, 'center', true);
    }

    /* ═══ 第 4 步：串三條 ═══ */
    if (s.n === 4) {
      const oA = fout(s, 4, 0, 0.5);
      /* 第 3 步的脈絡先淡出 */
      if (oA > 0.02) {
        for (let i = 0; i < 2; i++) eachForce(c, X0 + i * (L0 + DX) * SC, X0 + (i + 1) * (L0 + DX) * SC, oA, 1);
        hBracket(c, xOf(20), xOf(26), TOTY, X_COL, oA, 1, 4);
        P(c, oA, '3 + 3 = 6 cm', 200, TOTLY, X_COL, 24, 'center', true);
      }
      const ca = fin(s, 4, 0.6, 0.5) * fout(s, 4, 4.0, 0.4);
      P(c, ca, L('再接一條：拉力仍是 F = 30 gw', 'One more: the pull is still F = 30 gw'), 480, CAPY, WHITE, 24, 'center');
      P(c, fin(s, 4, 4.4, 0.5), L('每條都受 F = 30 gw', 'Each spring feels F = 30 gw'), 480, CAPY, T_COL, 24, 'center');
      for (let i = 0; i < S.n; i++) {
        const t0 = 4.0 + i * 0.25, ea = fin(s, 4, t0, 0.4);
        eachForce(c, ends[i][0], ends[i][1], ea, ea);
      }
      const dA = fin(s, 4, 4.6, 0.4);
      drop(c, 3 * L0, dA * 0.7, WHITE, AY + AMP + 6);
      drop(c, 3 * (L0 + DX), dA, X_COL);
      for (let i = 0; i < 3; i++) {
        const t0 = 4.8 + i * 0.3, x0 = xOf(3 * L0 + i * DX);
        hBracket(c, x0, x0 + DX * SC, SY, X_COL, fin(s, 4, t0, 0.2), ease(seg(s.u, t0, t0 + 0.3)));
        T(c, fin(s, 4, t0 + 0.2, 0.3), '3', x0 + DX * SC / 2, SLY, X_COL, 22, 'center', true);
        if (i > 0) T(c, fin(s, 4, t0 + 0.2, 0.3), '+', x0, SLY, X_COL, 22, 'center', true);
      }
      hBracket(c, xOf(3 * L0), xOf(3 * L0 + 3 * DX), TOTY, X_COL, fin(s, 4, 5.9, 0.3), ease(seg(s.u, 5.9, 6.5)), 4);
      P(c, fin(s, 4, 6.3, 0.5), L('總伸長量 9 cm', 'Total stretch 9 cm'), xOf(3 * L0 + 1.5 * DX), TOTLY, X_COL, 22, 'center');
      const eA = fin(s, 4, 6.6, 0.6);
      if (eA > 0.02) W5.glow(c, 260, TOTLY, 160, X_COL, 0.10 * eA);
      P(c, eA, '3 + 3 + 3 = 9 cm', 260, TOTLY, X_COL, 24, 'center', true);
      T(c, fin(s, 4, 7.0, 0.6), L('串越多條，總伸長量越大，每條受力不變', 'More springs: more total stretch, same force on each'), 400, LINEY, WHITE, 24, 'center');
    }

    /* March：第 4 步結尾換成 victory */
    const vA = s.n === 4 ? fin(s, 4, 6.8, 0.6) : 0;
    march(c, 'touch_water', 196, a1 * (1 - vA));
    march(c, 'victory', 206, vA);
  }

  W5.register('series', { canvas: 'cvs-series', steps: DUR, draw });
})();
