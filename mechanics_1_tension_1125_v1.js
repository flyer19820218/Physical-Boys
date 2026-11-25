/* ==================================================================
   mechanics_1 ｜ 張力：處處相同（cvs-tension，960×540）
   四步：1 向外拉開的力 → 2 切開看每一段 → 3 三個彈簧秤 → 4 處處相同
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   數字（任務指定，不可改）：每端拉力 F＝30 gw。
   語意色（全站）：外力 F＝珊瑚 COL.coral；張力＝黃 COL.yellow。
   版面：地面線 GY；March（左）與 April（右）同一張拔河圖（assets/characters/tug/，老師用 Gemini 生成）
         切成左右兩半，中間的繩用 tug_rope_strip.png 平鋪拉長（可隨 gl、gr 變長，也能下垂）；
         兩端珊瑚箭頭畫在頭頂上方；中段上方留給放大圓圈與說明字。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const T_COL = COL.yellow;          /* 張力：黃 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [8, 10, 9, 9];         /* 總長 36 秒 */

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
  const GY = 460;                    /* 地面線 */
  const SC = 0.56;                   /* 拔河圖縮放（原圖 1024×572） */
  const IMG_ROPE_Y = 285, IMG_FOOT = 565, CUT_L = 352, CUT_R = 678;   /* 原圖：繩高、腳底、左右切線 */
  const ROPE_Y = Math.round(GY - (IMG_FOOT - IMG_ROPE_Y) * SC);     /* ≈ 303 */
  const GL = 200, GR = 760;          /* 兩端握點 x（站定後） */
  const PTS = [330, 480, 630];       /* 張力標示點（第 1 步小箭頭、第 4 步 A B C） */
  const SCL = [322, 480, 638];       /* 三支彈簧秤中心 x */
  const ARR_Y = 122;                 /* 珊瑚外力箭頭高度（頭頂上方） */
  const CIR = [{ cut: 395, cx: 348 }, { cut: 565, cx: 612 }];   /* 第 2 步兩個放大圓 */
  const CY = 170, CR = 90;

  /* ═══════════ 拔河圖（March 左、April 右） ═══════════ */
  const IMG = {};
  [['L', 'tug_march_left'], ['R', 'tug_april_right'], ['S', 'tug_rope_strip']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/tug/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;

  /* 麻繩：用原圖的繩子切片平鋪；x0..x1、y（繩中心）、sc 縮放、sag 中央下垂 */
  function ropeStrip(c, x0, x1, y, sc, sag) {
    const im = IMG.S; if (!ok(im)) return;
    const sh = im.naturalHeight, sw = im.naturalWidth, dh = sh * sc, step = 3;
    const len = x1 - x0, tw = sw * sc;
    for (let x = 0; x < len; x += step) {
      const w = Math.min(step, len - x), t = (x + w / 2) / len;
      const u = ((x % tw) / sc), uw = Math.min(w / sc, sw - u);
      c.drawImage(im, u, 0, Math.max(0.5, uw), sh, x0 + x, y - dh / 2 + 4 * (sag || 0) * t * (1 - t), w + 0.6, dh);
    }
  }

  /* 兩人＋中間的繩：gl、gr＝兩人握點（原圖切線處）的 x；sag＝繩下垂量 */
  function pair(c, gl, gr, sag, a) {
    const L = IMG.L, R = IMG.R;
    if (a <= 0.02 || !ok(L) || !ok(R) || !ok(IMG.S)) return;
    const hh = L.naturalHeight * SC, top = GY - IMG_FOOT * SC;
    c.save(); c.globalAlpha *= a;
    /* 腳下影子 */
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
    c.beginPath(); c.ellipse(gl - CUT_L * SC + 205 * SC, GY + 3, 120 * SC, 8, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(gr + (835 - CUT_R) * SC, GY + 3, 130 * SC, 8, 0, 0, TAU); c.fill(); c.restore();
    ropeStrip(c, gl - 2, gr + 2, ROPE_Y, SC, sag);
    c.drawImage(L, gl - L.naturalWidth * SC, top, L.naturalWidth * SC, hh);
    c.drawImage(R, gr, top, R.naturalWidth * SC, hh);
    c.restore();
  }

  /* ═══════════ 地面 ═══════════ */
  function floor(c, a) {
    withA(c, a, () => {
      const gl = c.createRadialGradient(480, 300, 30, 480, 300, 460);
      gl.addColorStop(0, 'rgba(255,224,102,0.06)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
      const g = c.createLinearGradient(0, GY, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
      const e = c.createLinearGradient(0, 0, 960, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
    });
  }

  /* ═══════════ 繩子（麻繩：深色外框＋本色＋高光＋斜紋） ═══════════ */
  /* x0..x1、y：兩端；sag：中央下垂量；wd：粗細 */
  function rope(c, x0, x1, y, sag, wd) {
    wd = wd || 10;
    const N = 60, P = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      P.push([lerp(x0, x1, t), y + 4 * sag * t * (1 - t)]);
    }
    const path = () => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i <= N; i++) c.lineTo(P[i][0], P[i][1]); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
    path(); c.strokeStyle = '#4a361e'; c.lineWidth = wd + 4; c.stroke();
    c.shadowColor = 'transparent';
    path(); c.strokeStyle = '#c9a46a'; c.lineWidth = wd; c.stroke();
    c.save(); c.translate(0, -wd * 0.22);
    path(); c.strokeStyle = 'rgba(244,224,178,0.75)'; c.lineWidth = wd * 0.28; c.stroke(); c.restore();
    /* 斜紋 */
    c.strokeStyle = 'rgba(90,64,32,0.75)'; c.lineWidth = Math.max(1.5, wd * 0.16);
    const len = Math.abs(x1 - x0), step = wd * 0.95, cnt = Math.floor(len / step);
    for (let j = 1; j < cnt; j++) {
      const t = j / cnt, x = lerp(x0, x1, t), yy = y + 4 * sag * t * (1 - t);
      const dydx = 4 * sag * (1 - 2 * t) / (x1 - x0 || 1), ang = Math.atan(dydx);
      const ca = Math.cos(ang), sa = Math.sin(ang), hw = wd * 0.42;
      /* 斜線：沿切線偏 0.35wd、沿法線 ±hw */
      c.beginPath();
      c.moveTo(x - ca * wd * 0.25 + sa * hw, yy - sa * wd * 0.25 - ca * hw);
      c.lineTo(x + ca * wd * 0.25 - sa * hw, yy + sa * wd * 0.25 + ca * hw);
      c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 箭頭 ═══════════ */
  /* 珊瑚外力箭頭（水平、帶光暈）：從 x0 指向 x1 */
  function forceArrow(c, x0, x1, y, a) {
    const len = Math.abs(x1 - x0);
    if (a <= 0.02 || len < 4) return;
    const dir = Math.sign(x1 - x0), head = Math.min(22, Math.max(10, len * 0.35)), lw = 8;
    c.save(); c.globalAlpha *= a;
    c.shadowColor = W5.rgba(F_COL, 0.8); c.shadowBlur = 14; c.fillStyle = F_COL;
    const shaftEnd = x1 - dir * head;
    const xa = Math.min(x0, shaftEnd), xb = Math.max(x0, shaftEnd);
    if (xb - xa > 0) { W5.rr(c, xa, y - lw / 2, xb - xa + 2, lw, 3); c.fill(); }
    c.beginPath(); c.moveTo(x1, y); c.lineTo(x1 - dir * head, y - head * 0.75); c.lineTo(x1 - dir * head, y + head * 0.75); c.closePath(); c.fill();
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

  /* 一個點上「向兩側拉開」的一對黃箭頭；grow 0..1 */
  /* 點畫在繩上（y），箭頭畫在繩的正上方（y − 24），中間一條短虛線連到點 */
  function tPair(c, x, y, len, a, grow) {
    if (a <= 0.02) return;
    const g = grow == null ? 1 : grow, Lg = len * g, ay = y - 24;
    withA(c, a, () => {
      c.save(); c.strokeStyle = W5.rgba(T_COL, 0.7); c.lineWidth = 2; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, ay + 6); c.stroke(); c.restore();
    });
    tArrow(c, x - 5, ay, x - 5 - Lg, ay, a, 5.5, 15);
    tArrow(c, x + 5, ay, x + 5 + Lg, ay, a, 5.5, 15);
    withA(c, a, () => {
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill();
      W5.ball(c, x, y, 7, T_COL);
    });
  }

  /* ═══════════ 彈簧秤（水平） ═══════════ */
  /* 細小水平線圈：x0..x1、y、圈數、振幅 */
  function hcoil(c, x0, x1, y, turns, amp) {
    const n = turns * 12;
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const cm = Math.cos((p0 + p1) / 2), front = cm > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (cm > 0.7 ? '#eef4f1' : '#a8b8b3') : '#5f6f6b'; c.lineWidth = front ? 2.4 : 1.8;
        c.beginPath(); c.moveTo(lerp(x0, x1, s0), y + amp * Math.sin(p0)); c.lineTo(lerp(x0, x1, s1), y + amp * Math.sin(p1)); c.stroke();
      }
    }
    c.restore();
  }

  const SB = { w: 116, h: 50 };       /* 秤身 */
  /* reading：0..50 gw 刻度上的讀數 */
  function springScale(c, cx, y, reading, a) {
    if (a <= 0.02) return;
    const x0 = cx - SB.w / 2, x1 = cx + SB.w / 2, top = y - SB.h / 2;
    const sx0 = cx - 42, sx1 = cx + 42;                 /* 刻度 0 與 50 的 x */
    const px = lerp(sx0, sx1, clamp01(reading / 50));
    withA(c, a, () => {
      /* 兩端：左環、右桿＋掛鉤 */
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.arc(x0 - 9, y, 7, 0, TAU); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(x1 - 4, y); c.lineTo(x1 + 12, y); c.stroke();
      c.lineWidth = 3.5; c.beginPath(); c.arc(x1 + 18, y, 6, Math.PI * 1.0, Math.PI * 2.6); c.stroke();
      /* 秤身 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(0, top, 0, top + SB.h);
      g.addColorStop(0, '#f4f7f3'); g.addColorStop(0.55, '#cfd9d4'); g.addColorStop(1, '#8d9c97');
      c.fillStyle = g; W5.rr(c, x0, top, SB.w, SB.h, 12); c.fill(); c.restore();
      c.strokeStyle = '#4f5d59'; c.lineWidth = 2; W5.rr(c, x0, top, SB.w, SB.h, 12); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0 + 10, top + 2.5); c.lineTo(x1 - 10, top + 2.5); c.stroke();
      /* 刻度（上半部） */
      c.strokeStyle = '#2b3834'; c.lineCap = 'butt';
      for (let v = 0; v <= 50; v += 5) {
        const x = lerp(sx0, sx1, v / 50), big = v % 10 === 0;
        c.lineWidth = big ? 2 : 1.2;
        c.beginPath(); c.moveTo(x, top + 6); c.lineTo(x, top + (big ? 18 : 13)); c.stroke();
      }
      /* 30 gw 刻度加黃底 */
      const x30 = lerp(sx0, sx1, 0.6);
      c.fillStyle = W5.rgba(T_COL, 0.55); c.fillRect(x30 - 3, top + 5, 6, 15);
      /* 視窗槽＋內部彈簧 */
      c.fillStyle = '#16271f'; W5.rr(c, sx0 - 6, y + 2, sx1 - sx0 + 12, 16, 6); c.fill();
      hcoil(c, sx0 - 4, px - 3, y + 10, 7, 5);
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(px, y + 10); c.lineTo(sx1 + 4, y + 10); c.stroke();
      /* 指針 */
      c.save(); c.shadowColor = W5.rgba(T_COL, 0.9); c.shadowBlur = 8;
      c.fillStyle = T_COL; c.strokeStyle = INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px, top + 20); c.lineTo(px - 6, y + 4); c.lineTo(px - 2, y + 4); c.lineTo(px - 2, y + 17);
      c.lineTo(px + 2, y + 17); c.lineTo(px + 2, y + 4); c.lineTo(px + 6, y + 4); c.closePath(); c.fill(); c.stroke();
      c.restore();
    });
  }

  /* ═══════════ 第 2 步：放大圓圈 ═══════════ */
  /* t：此圓開始後幾秒；alpha：整體淡出 */
  function zoomCircle(c, Z, t, alpha) {
    if (t <= 0 || alpha <= 0.02) return;
    const pop = ease(seg(t, 0, 0.5));
    const cutA = ease(seg(t, 0.4, 0.7)) * (1 - ease(seg(t, 1.0, 1.4)));
    const gap = 26 * ease(seg(t, 0.7, 1.2));
    const arrG = ease(seg(t, 1.0, 1.5)), labA = ease(seg(t, 1.3, 1.7));
    const cx = Z.cx, cy = CY, r = CR * lerp(0.6, 1, pop);
    withA(c, alpha * pop, () => {
      /* 繩上的取樣環＋引導線 */
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2; c.setLineDash([5, 5]);
      /* 從繩上切點拉到圓周的兩條切線 */
      const dx = Z.cut - cx, dy = ROPE_Y - cy, d = Math.hypot(dx, dy), base = Math.atan2(dy, dx);
      const phi = Math.acos(Math.min(1, r / d));
      [phi, -phi].forEach(ph => {
        const ang = base + ph;
        c.beginPath(); c.moveTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang)); c.lineTo(Z.cut, ROPE_Y); c.stroke();
      });
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(Z.cut, ROPE_Y, 15, 0, TAU); c.stroke();

      /* 圓內 */
      c.save();
      c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
      const bg = c.createRadialGradient(cx, cy - r * 0.3, 10, cx, cy, r);
      bg.addColorStop(0, '#1f4136'); bg.addColorStop(1, '#0f231c');
      c.fillStyle = bg; c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const ry = cy + 26, ay = cy - 14;
      ropeStrip(c, cx - r - 20, cx - gap / 2, ry, 2.3, 0);
      ropeStrip(c, cx + gap / 2, cx + r + 20, ry, 2.3, 0);
      /* 切口光 */
      if (cutA > 0.02) {
        c.save(); c.globalAlpha *= cutA; c.strokeStyle = WHITE; c.lineWidth = 3; c.setLineDash([6, 5]);
        c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = 10;
        c.beginPath(); c.moveTo(cx, ry - 30); c.lineTo(cx, ry + 30); c.stroke(); c.restore();
      }
      /* 左段被右段往右拉、右段被左段往左拉 */
      const AL = 58 * arrG;
      tArrow(c, cx - gap / 2 - 4 - AL, ay, cx - gap / 2 - 4, ay, arrG, 6, 17);
      tArrow(c, cx + gap / 2 + 4 + AL, ay, cx + gap / 2 + 4, ay, arrG, 6, 17);
      c.restore();
      /* 圓框 */
      c.save(); c.shadowColor = 'rgba(246,243,234,0.35)'; c.shadowBlur = 12;
      c.strokeStyle = '#e6eeeb'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); c.restore();
    });
    T(c, alpha * labA, 'F', cx - 42, CY - 50, T_COL, 28, 'center', true);
    T(c, alpha * labA, 'F', cx + 42, CY - 50, T_COL, 28, 'center', true);
  }

  /* ═══════════ 場景狀態 ═══════════ */
  function pullState(s) {
    /* 第 1 步：繩由鬆變緊、兩人往外退；之後都是緊的 */
    const tau = s.n === 1 ? ease(seg(s.u, 0.4, 1.8)) : 1;
    const off = (1 - tau) * 26;
    const sag = (1 - tau) * 34;
    /* 外力箭頭長度比例：第 1 步長出；第 3 步先放鬆再一起拉 */
    let fg = 1;
    if (s.n === 1) fg = ease(seg(s.u, 1.2, 2.2));
    if (s.n === 3) fg = lerp(1, 0, ease(seg(s.u, 0.3, 0.9))) + ease(seg(s.u, 1.8, 3.2));
    return { off, sag, fg: clamp01(fg) };
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = pullState(s);
    const a1 = s.n === 1 ? s.k : 1;
    floor(c, a1);

    const gl = GL + S.off, gr = GR - S.off;

        pair(c, gl, gr, S.sag, a1);

    /* 第 3 步：彈簧秤（掉進繩上）；第 4 步開頭拿走 */
    const scA = s.n === 3 ? ease(seg(s.u, 0.5, 1.3)) : (s.n === 4 ? fout(s, 4, 0, 0.6) : 0);
    const scDy = s.n === 3 ? (1 - ease(seg(s.u, 0.5, 1.4))) * -46 : 0;
    const reading = s.n === 3 ? 30 * ease(seg(s.u, 1.8, 3.2)) : 30;
    if (scA > 0.02) SCL.forEach(x => {
      c.save(); c.translate(0, scDy);
      /* 掉下來時秤身下方先遮住一段繩（秤身不透明） */
      springScale(c, x, ROPE_Y, reading, scA);
      c.restore();
    });


    /* 外力箭頭（頭頂上方） */
    const fLen = 170 * S.fg, fA = a1;
    forceArrow(c, gl + 40, gl + 40 - fLen, ARR_Y, fA);
    forceArrow(c, gr - 40, gr - 40 + fLen, ARR_Y, fA);
    const fLabA = (s.n === 1 ? fin(s, 1, 1.8, 0.5) : 1) * ease(clamp01((S.fg - 0.6) / 0.4));
    P(c, fLabA, 'F = 30 gw', gl - 45, ARR_Y - 40, F_COL, 22, 'center', true);
    P(c, fLabA, 'F = 30 gw', gr + 45, ARR_Y - 40, F_COL, 22, 'center', true);

    /* ── 第 1 步：繩上一對對向外的黃箭頭＋定義 ── */
    const s1A = s.n === 1 ? 1 : (s.n === 2 ? fout(s, 2, 0, 0.5) : 0);
    if (s1A > 0.02) {
      [[1, 2.6], [0, 3.0], [2, 3.0]].forEach(([i, t]) => {
        const g = s.n === 1 ? ease(seg(s.u, t, t + 0.6)) : 1;
        tPair(c, PTS[i], ROPE_Y, 46, s1A * Math.min(1, g * 3), g);
      });
      P(c, s1A * (s.n === 1 ? fin(s, 1, 4.0, 0.6) : 1), L('張力：向外側拉開的力', 'Tension: a force that pulls outward'), 480, 236, T_COL, 24, 'center');
    }

    /* ── 第 2 步：切開看每一段 ── */
    const s2A = s.n === 2 ? 1 : (s.n === 3 ? fout(s, 3, 0, 0.5) : 0);
    if (s2A > 0.02) {
      zoomCircle(c, CIR[0], s.n === 2 ? s.u - 0.5 : 9, s2A);
      zoomCircle(c, CIR[1], s.n === 2 ? s.u - 4.2 : 9, s2A);
      P(c, s2A * (s.n === 2 ? fin(s, 2, 2.4, 0.6) : 1), L('任何一個位置切開，兩邊都是 F', 'Cut it anywhere: both sides feel F'), 480, 62, T_COL, 24, 'center');
    }

    /* ── 第 3 步：三支彈簧秤讀數 ── */
    if (s.n === 3 || s.n === 4) {
      const fa = s.n === 4 ? fout(s, 4, 0, 0.5) : 1;
      SCL.forEach((x, i) => {
        const a = (s.n === 3 ? fin(s, 3, 3.3 + i * 0.25, 0.4) : 1) * fa;
        P(c, a, '30 gw', x, ROPE_Y - 60 + scDy, T_COL, 22, 'center', true);
      });
      T(c, (s.n === 3 ? fin(s, 3, 4.6, 0.6) : 1) * fa, L('三支彈簧秤，讀數都一樣', 'All three scales read the same'), 480, 172, WHITE, 24, 'center');
    }

    /* ── 第 4 步：A、B、C 處處相同 ── */
    if (s.n === 4) {
      ['A', 'B', 'C'].forEach((nm, i) => {
        const t0 = 1.0 + i * 0.8, g = ease(seg(s.u, t0, t0 + 0.6));
        const x = PTS[i];
        tPair(c, x, ROPE_Y, 46, Math.min(1, g * 3), g);
        T(c, fin(s, 4, t0, 0.4), nm, x, ROPE_Y + 40, WHITE, 26, 'center', true);
        P(c, fin(s, 4, t0 + 0.4, 0.4), '30 gw', x, ROPE_Y - 66, T_COL, 22, 'center', true);
      });
      const pA = fin(s, 4, 4.0, 0.6);
      if (pA > 0.02) {
        W5.glow(c, 480, 505, 200, T_COL, 0.10 * pA);
        P(c, pA, L('同一條線上，張力處處相同', 'Along one line, tension is the same everywhere'), 480, 505, T_COL, 24, 'center');
      }
    }
  }

  W5.register('tension', { canvas: 'cvs-tension', steps: DUR, draw });
})();
