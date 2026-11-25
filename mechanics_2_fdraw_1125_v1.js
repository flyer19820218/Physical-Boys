/* ==================================================================
   mechanics_2 ｜ 力的圖示：作用點、方向、大小（cvs-fdraw，960×540）
   四步：1 作用點 → 2 方向 → 3 大小 → 4 完整的力圖
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   比例：PX_PER_GW＝4（1 gw＝4 px）；比例尺 1 格＝10 gw＝40 px。
         30 gw＝120 px＝3 格；60 gw＝240 px＝6 格。畫面上的 gw 數一律由箭頭向量長度算出來。
   語意色：March 的拉力 F＝青 COL.teal（本動畫只有這一個力）。
   場景：地面線 GY；左邊木箱（canvas 自畫），右邊 March（拔河圖 tug_march_left.png 左右翻轉，
         原圖手裡伸出的繩頭裁掉，改由本檔從拳頭畫繩子到木箱右側的鐵環＝作用點）。
         March 拳頭離腳底 HAND_H，繩子平拉時鐵環就在同一高度。
         第 2 步：March 走上 90 px 高的台階，繩子變成斜向上（dx 120、dy 90 → 3-4-5，約 37°）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.teal;            /* March 的拉力：青 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', BAD = COL.red;
  const DUR = [8, 9, 10, 9];         /* 總長 36 秒 */

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

  /* 跨步時間 */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);

  /* ═══════════ 比例與幾何 ═══════════ */
  const PX_PER_GW = 4;               /* 1 gw ＝ 4 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 比例尺 1 格 ＝ 10 gw ＝ 40 px */
  const GY = 460;                    /* 地面線 */
  const SC = 0.44;                   /* March 拔河圖縮放（原圖 352×572） */
  const IMG_W = 352, IMG_FOOT = 565, IMG_HAND_X = 318, IMG_HAND_Y = 285, IMG_CLIP = 322;
  const HAND_H = (IMG_FOOT - IMG_HAND_Y) * SC;   /* 拳頭離腳底 ≈ 123 px */
  const BOX_W = 130, BOX_H = 150;    /* 木箱 */
  const STEP_H = 90;                 /* 第 2 步台階高 */
  const ROPE1 = 315, ROPE3 = 290;    /* 平拉時繩長（第 1、2 步／第 3、4 步） */

  /* ═══════════ March（拔河圖，左右翻轉） ═══════════ */
  const IMG = new Image(); IMG.src = 'assets/characters/tug/tug_march_left.png';
  const ok = im => im && im.complete && im.naturalWidth;

  /* fx, fy：拳頭（繩子進手）位置；footY：腳底 */
  function march(c, fx, footY, a) {
    if (a <= 0.02 || !ok(IMG)) return;
    const left = fx - (IMG_W - IMG_HAND_X) * SC, top = footY - IMG_FOOT * SC;
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
      c.beginPath(); c.ellipse(left + 82, footY + 3, 76, 8, 0, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(left + IMG_W * SC, top); c.scale(-1, 1);
      c.drawImage(IMG, 0, 0, IMG_CLIP, 572, 0, 0, IMG_CLIP * SC, 572 * SC);
      c.restore();
    });
  }

  /* ═══════════ 地面 ═══════════ */
  function floor(c) {
    const gl = c.createRadialGradient(480, 300, 30, 480, 300, 460);
    gl.addColorStop(0, 'rgba(77,210,255,0.05)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    const g = c.createLinearGradient(0, GY, 0, 540);
    g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
    c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
    const e = c.createLinearGradient(0, 0, 960, 0);
    e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
    c.strokeStyle = e; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
  }

  /* ═══════════ 木箱 ═══════════ */
  /* xr：木箱右側面的 x（作用點所在面） */
  function crate(c, xr, a) {
    if (a <= 0.02) return;
    const x = xr - BOX_W, y = GY - BOX_H, w = BOX_W, h = BOX_H, fr = 13;
    withA(c, a, () => {
      /* 影子 */
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
      c.beginPath(); c.ellipse(x + w / 2, GY + 3, w * 0.6, 8, 0, 0, TAU); c.fill(); c.restore();
      /* 底板 */
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#c58d52'); g.addColorStop(1, '#8f5c2f');
      c.fillStyle = g; W5.rr(c, x, y, w, h, 6); c.fill(); c.restore();
      /* 內板：橫向木板＋木紋 */
      c.save(); W5.rr(c, x, y, w, h, 6); c.clip();
      c.strokeStyle = 'rgba(70,40,16,0.55)'; c.lineWidth = 2;
      for (let yy = y + fr + 31; yy < y + h - fr; yy += 31) { c.beginPath(); c.moveTo(x + fr, yy); c.lineTo(x + w - fr, yy); c.stroke(); }
      c.strokeStyle = 'rgba(90,54,22,0.35)'; c.lineWidth = 1.3;
      for (let i = 0; i < 9; i++) {
        const yy = y + fr + 8 + i * 14 + W5.hash(i) * 6, amp = 2 + W5.hash(i + 20) * 3, ph = W5.hash(i + 40) * 6;
        c.beginPath();
        for (let xx = x + fr; xx <= x + w - fr; xx += 6) {
          const py = yy + amp * Math.sin((xx - x) / 18 + ph);
          if (xx === x + fr) c.moveTo(xx, py); else c.lineTo(xx, py);
        }
        c.stroke();
      }
      c.restore();
      /* 外框與斜撐 */
      c.fillStyle = '#7a4a22';
      c.fillRect(x, y, w, fr); c.fillRect(x, y + h - fr, w, fr); c.fillRect(x, y, fr, h); c.fillRect(x + w - fr, y, fr, h);
      c.save(); c.beginPath(); c.rect(x + fr, y + fr, w - 2 * fr, h - 2 * fr); c.clip();
      c.strokeStyle = '#7a4a22'; c.lineWidth = 14; c.lineCap = 'butt';
      c.beginPath(); c.moveTo(x + fr - 4, y + h - fr + 4); c.lineTo(x + w - fr + 4, y + fr - 4); c.stroke();
      c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + fr - 4, y + h - fr - 4); c.lineTo(x + w - fr - 4, y + fr - 4); c.stroke();
      c.restore();
      /* 框的高光、釘子 */
      c.strokeStyle = 'rgba(255,226,180,0.45)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, y + 2.5); c.lineTo(x + w - 6, y + 2.5); c.stroke();
      c.fillStyle = '#3d2a18';
      [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 2.6, 0, TAU); c.fill(); });
      c.strokeStyle = '#3a2412'; c.lineWidth = 2; W5.rr(c, x, y, w, h, 6); c.stroke();
    });
  }

  /* 木箱右側的鐵環（繩子綁在這裡） */
  function eyeBolt(c, xr, a) {
    withA(c, a, () => {
      const y = GY - HAND_H;
      c.fillStyle = '#5b6662'; c.fillRect(xr - 3, y - 7, 5, 14);
      c.strokeStyle = '#c7d2ce'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(xr + 7, y, 7, 0, TAU); c.stroke();
    });
  }

  /* 滑動時的塵土（確定性）：x,y 木箱後下角；v 0..1 速度感；t 秒 */
  function dust(c, x, y, v, t) {
    if (v <= 0.03) return;
    for (let i = 0; i < 4; i++) {
      const ph = ((t * 1.7 + i / 4) % 1 + 1) % 1;
      const px = x - 4 - ph * 34, py = y - 5 - ph * 16 + W5.hash(i) * 4, r = 5 + ph * 11;
      c.fillStyle = 'rgba(200,214,206,' + (0.32 * (1 - ph) * Math.min(1, v)).toFixed(3) + ')';
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    }
  }

  /* ═══════════ 台階（第 2 步） ═══════════ */
  function stepBlock(c, bl, br, a) {
    if (a <= 0.02) return;
    const top = GY - STEP_H;
    withA(c, a, () => {
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      const g = c.createLinearGradient(0, top, 0, GY);
      g.addColorStop(0, '#7d8a85'); g.addColorStop(1, '#4b5853');
      c.fillStyle = g; W5.rr(c, bl, top, br - bl, STEP_H + 4, 5); c.fill(); c.restore();
      c.save(); W5.rr(c, bl, top, br - bl, STEP_H + 4, 5); c.clip();
      c.strokeStyle = 'rgba(30,42,38,0.55)'; c.lineWidth = 2;
      for (let r = 1; r < 3; r++) { const yy = top + r * 30; c.beginPath(); c.moveTo(bl, yy); c.lineTo(br, yy); c.stroke(); }
      for (let r = 0; r < 3; r++) for (let xx = bl + (r % 2 ? 24 : 52); xx < br; xx += 56) {
        c.beginPath(); c.moveTo(xx, top + r * 30); c.lineTo(xx, top + r * 30 + 30); c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(bl + 4, top + 1.5); c.lineTo(br - 4, top + 1.5); c.stroke();
      c.strokeStyle = '#26332f'; c.lineWidth = 2; W5.rr(c, bl, top, br - bl, STEP_H + 4, 5); c.stroke();
    });
  }

  /* ═══════════ 繩子（麻繩，可斜） ═══════════ */
  function rope(c, x0, y0, x1, y1, wd) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 2) return;
    wd = wd || 9;
    c.save(); c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0));
    c.lineCap = 'round';
    c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.strokeStyle = '#4a361e'; c.lineWidth = wd + 4; c.stroke();
    c.shadowColor = 'transparent';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.strokeStyle = '#c9a46a'; c.lineWidth = wd; c.stroke();
    c.beginPath(); c.moveTo(0, -wd * 0.22); c.lineTo(len, -wd * 0.22); c.strokeStyle = 'rgba(244,224,178,0.75)'; c.lineWidth = wd * 0.28; c.stroke();
    c.strokeStyle = 'rgba(90,64,32,0.75)'; c.lineWidth = Math.max(1.5, wd * 0.16);
    const hw = wd * 0.42;
    for (let x = wd; x < len - 2; x += wd * 0.95) {
      c.beginPath(); c.moveTo(x - wd * 0.25, -hw); c.lineTo(x + wd * 0.25, hw); c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 力的箭頭（青，深色描邊＋光暈，粗細一致） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    col = col || F_COL;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', 11, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, 7, 22);
    c.restore();
  }
  /* 由起點、角度、gw 畫箭頭；回傳尖端 */
  function fArrowGW(c, x0, y0, ang, gw, a, col) {
    const len = gw * PX_PER_GW, x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    fArrow(c, x0, y0, x1, y1, a, col);
    return { x: x1, y: y1 };
  }
  /* 虛線殘影箭頭 */
  function ghostArrow(c, x0, y0, x1, y1, a) {
    withA(c, a, () => {
      c.save(); c.setLineDash([8, 7]); c.strokeStyle = W5.rgba(F_COL, 0.6); c.lineWidth = 3;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(ang) * 14, y1 - Math.sin(ang) * 14); c.stroke();
      c.setLineDash([]);
      c.beginPath(); c.moveTo(x1, y1);
      c.lineTo(x1 - Math.cos(ang - 0.45) * 18, y1 - Math.sin(ang - 0.45) * 18);
      c.moveTo(x1, y1);
      c.lineTo(x1 - Math.cos(ang + 0.45) * 18, y1 - Math.sin(ang + 0.45) * 18); c.stroke();
      c.restore();
    });
  }

  /* 作用點：白色小球＋青光；pulse 0..1 時多一圈擴散環 */
  function apDot(c, x, y, a, pulse) {
    withA(c, a, () => {
      W5.glow(c, x, y, 30, F_COL, 0.55);
      if (pulse > 0 && pulse < 1) {
        c.strokeStyle = W5.rgba(F_COL, 0.9 * (1 - pulse)); c.lineWidth = 3;
        c.beginPath(); c.arc(x, y, 8 + 26 * pulse, 0, TAU); c.stroke();
      }
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, 10, 0, TAU); c.fill();
      W5.ball(c, x, y, 8, WHITE);
    });
  }

  /* 引出線：從 (tx,ty) 拉到標籤 (px,py)；目標端一個小點 */
  function leader(c, a, tx, ty, px, py, col) {
    withA(c, a, () => {
      c.strokeStyle = W5.rgba(col, 0.85); c.lineWidth = 2.5; c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(px, py); c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.beginPath(); c.arc(tx, ty, 3.5, 0, TAU); c.fill();
    });
  }

  /* 打叉／打勾（自己畫，不靠字型） */
  function cross(c, x, y, r, g, a) {
    withA(c, a, () => {
      c.strokeStyle = BAD; c.lineWidth = 7; c.lineCap = 'round';
      c.shadowColor = W5.rgba(BAD, 0.7); c.shadowBlur = 10;
      const g1 = clamp01(g * 2), g2 = clamp01(g * 2 - 1);
      c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x - r + 2 * r * g1, y - r + 2 * r * g1); c.stroke();
      if (g2 > 0) { c.beginPath(); c.moveTo(x + r, y - r); c.lineTo(x + r - 2 * r * g2, y - r + 2 * r * g2); c.stroke(); }
    });
  }
  function check(c, x, y, r, a) {
    withA(c, a, () => {
      c.strokeStyle = COL.green; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = W5.rgba(COL.green, 0.7); c.shadowBlur = 10;
      c.beginPath(); c.moveTo(x - r, y); c.lineTo(x - r * 0.3, y + r * 0.7); c.lineTo(x + r, y - r * 0.8); c.stroke();
    });
  }

  /* 一段滑動：u 在 [a,b] 內滑 dist；回傳位移與速度感 0..1 */
  function slide(u, a, b, dist) {
    const t = seg(u, a, b), x = dist * ease(t);
    const v = (t > 0 && t < 1) ? 6 * t * (1 - t) / 1.5 * (dist / (b - a)) / 20 : 0;
    return { x, v };
  }

  /* ═══════════ 比例尺面板（第 3 步） ═══════════ */
  const RX = 300, ROW1 = 120, ROW2 = 158, RULER_Y = 192;
  function rulerPanel(c, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, RX - 200, 94, 664, 120, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, RX - 200, 94, 664, 120, 16); c.stroke();
      /* 每格一條直虛線，向上穿過兩列箭頭 */
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = 'rgba(163,184,176,0.45)'; c.lineWidth = 1.5;
      for (let i = 0; i <= 6; i++) { const x = RX + i * CELL; c.beginPath(); c.moveTo(x, 102); c.lineTo(x, RULER_Y - 9); c.stroke(); }
      c.restore();
      /* 尺：6 格，深淺交錯 */
      for (let i = 0; i < 6; i++) {
        c.fillStyle = i % 2 ? 'rgba(77,210,255,0.16)' : 'rgba(77,210,255,0.34)';
        c.fillRect(RX + i * CELL, RULER_Y - 9, CELL, 18);
      }
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(RX, RULER_Y - 9, 6 * CELL, 18);
      for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(RX + i * CELL, RULER_Y - 9); c.lineTo(RX + i * CELL, RULER_Y + 9); c.stroke(); }
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), RX - 16, RULER_Y, WHITE, 22, 'right');
  }

  /* ═══════════ 場景狀態（每一步自己算，跳步進來也成立） ═══════════ */
  function sceneOf(s) {
    const u = s.u, AY = GY - HAND_H;
    const S = { xr: 0, fx: 0, fy: AY, foot: GY, v: 0, gw: 30, grow: 1, stepA: 0, alpha: 1 };
    if (s.n === 1) {
      const m = slide(u, 3.6, 5.8, 18);
      S.xr = 202 + m.x; S.v = m.v; S.fx = S.xr + ROPE1;
      S.grow = ease(seg(u, 2.4, 3.2)); S.alpha = s.k;
    } else if (s.n === 2) {
      /* A 平拉滑 36 → B 走上台階 → C 斜拉滑 20 */
      const A = slide(u, 1.4, 3.4, 36), C = slide(u, 5.4, 7.2, 20);
      const XA = 256;                              /* A 結束時木箱右側 */
      const fGround = 220 + A.x + ROPE1, fStep = XA + 120;
      const h = ease(seg(u, 3.8, 5.0));
      S.xr = 220 + A.x + C.x;
      S.fx = lerp(fGround, fStep, h) + C.x;
      S.foot = GY - STEP_H * h - 18 * Math.sin(Math.PI * h);
      S.fy = S.foot - HAND_H;
      S.v = Math.max(A.v, C.v * 0.6);
      S.grow = ease(seg(u, 0.6, 1.3)); S.stepA = 1;
    } else if (s.n === 3) {
      const A = slide(u, 1.4, 4.4, 25), B = slide(u, 5.4, 8.2, 70);
      S.xr = 170 + A.x + B.x; S.fx = S.xr + ROPE3;
      S.v = Math.max(A.v, B.v);
      S.grow = ease(seg(u, 0.6, 1.3));
      S.gw = 30 + 30 * ease(seg(u, 4.6, 5.4));
      S.alpha = s.k;
    } else {
      S.xr = 265; S.fx = S.xr + ROPE3;
      S.grow = ease(seg(u, 0.8, 1.6));
    }
    return S;
  }

  /* 台階位置（第 2 步固定） */
  const STEP_L = 362, STEP_R = 520;

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    floor(c);
    const S = sceneOf(s), AY = GY - HAND_H, xr = S.xr;
    const sa = S.alpha;

    /* 場景：台階 → 木箱 → 繩 → March */
    if (s.n === 2) stepBlock(c, STEP_L, STEP_R, s.k);
    withA(c, sa, () => {
      crate(c, xr, 1);
      withA(c, 1, () => dust(c, xr - BOX_W, GY, S.v, s.t));
      rope(c, xr + 9, AY, S.fx, S.fy, 9);
      eyeBolt(c, xr, 1);
      march(c, S.fx, S.foot, 1);
    });

    const ang = Math.atan2(S.fy - AY, S.fx - (xr));
    const tipOf = gw => ({ x: xr + Math.cos(ang) * gw * PX_PER_GW, y: AY + Math.sin(ang) * gw * PX_PER_GW });

    /* ── 第 1 步：作用點 ── */
    if (s.n === 1) {
      P(c, fin(s, 1, 0.3, 0.5), L('箭頭的起點＝作用點', 'The arrow starts at the point of action'), 480, 62, F_COL, 24);
      const dA = fin(s, 1, 0.8, 0.4), pulse = (s.u - 0.8) % 1.2 / 1.2;
      fArrowGW(c, xr, AY, ang, 30 * S.grow, sa);
      apDot(c, xr, AY, dA * sa, s.u < 4.4 ? pulse : 0);
      const la = fin(s, 1, 1.6, 0.5);
      leader(c, la, xr + 6, AY + 8, xr + 62, AY + 46, WHITE);
      P(c, la, L('作用點', 'Point of action'), xr + 72, AY + 62, WHITE, 22, 'left');
      check(c, xr + 150, AY - 30, 14, fin(s, 1, 3.4, 0.4));
      P(c, fin(s, 1, 3.4, 0.6), L('箭頭從作用點畫出來', 'Draw the arrow from the point of action'), 480, 505, F_COL, 24);
      /* 錯誤示範：箭頭懸在空中 */
      const wA = fin(s, 1, 4.6, 0.6);
      const wx = 330, wy = 200;
      withA(c, 0.5 * wA, () => fArrow(c, wx, wy, wx + 30 * PX_PER_GW, wy, 1));
      cross(c, wx + 60, wy, 22, ease(seg(s.u, 5.3, 5.9)), wA);
      T(c, fin(s, 1, 5.6, 0.5), L('起點沒貼在物體上', 'Not starting on the object'), wx + 60, wy - 48, BAD, 22);
    }

    /* ── 第 2 步：方向 ── */
    if (s.n === 2) {
      P(c, fin(s, 2, 0.3, 0.5), L('箭頭指的方向＝力的方向', 'The arrow points the way the force acts'), 480, 62, F_COL, 24);
      /* 平拉的殘影（走上台階後） */
      const gA = fin(s, 2, 5.0, 0.5);
      ghostArrow(c, xr, AY, xr + 30 * PX_PER_GW, AY, gA * 0.8);
      const tip = fArrowGW(c, xr, AY, ang, 30 * S.grow, 1);
      apDot(c, xr, AY, 1, 0);
      const gwNow = Math.round(Math.hypot(tip.x - xr, tip.y - AY) / PX_PER_GW);
      /* 箭頭旁的方向小膠囊：A 向右（箭頭上方）、C 斜向上（箭頭左上） */
      P(c, fin(s, 2, 1.6, 0.5) * fout(s, 2, 3.7, 0.4), L('向右', 'Right'), xr + 60, AY - 48, F_COL, 22);
      P(c, fin(s, 2, 5.2, 0.5), L('斜向上', 'Up-right'), tip.x - 58, tip.y - 40, F_COL, 22, 'right');
      /* 右上的比較卡：F 都是 30 gw；平拉滑得快、斜拉滑得慢 */
      const kA = fin(s, 2, 0.9, 0.5);
      withA(c, kA, () => {
        c.fillStyle = 'rgba(11,26,21,0.6)'; W5.rr(c, 676, 100, 272, 132, 16); c.fill();
        c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, 676, 100, 272, 132, 16); c.stroke();
      });
      T(c, kA, 'F = ' + gwNow + ' gw', 812, 128, F_COL, 22, 'center', true);
      const r1 = fin(s, 2, 3.0, 0.5), r2 = fin(s, 2, 6.6, 0.5);
      withA(c, r1, () => W5.arrow(c, 700, 172, 740, 172, DIM, 3.5, 12));
      T(c, r1, L('平拉：滑得快', 'Flat: faster'), 756, 172, WHITE, 22, 'left');
      withA(c, r2, () => W5.arrow(c, 704, 220, 736, 196, DIM, 3.5, 12));
      T(c, r2, L('斜拉：滑得慢', 'Slant: slower'), 756, 208, WHITE, 22, 'left');
      P(c, fin(s, 2, 2.0, 0.5) * fout(s, 2, 6.6, 0.4), L('方向：箭頭指的方向', 'Direction: where the arrow points'), 480, 505, F_COL, 24);
      P(c, fin(s, 2, 7.0, 0.5), L('同樣 30 gw，方向不同，效果不同', 'Same 30 gw, new direction, different effect'), 480, 505, F_COL, 24);
    }

    /* ── 第 3 步：大小 ── */
    if (s.n === 3) {
      P(c, fin(s, 3, 0.3, 0.5), L('線段越長，力越大', 'Longer arrow, bigger force'), 480, 62, F_COL, 24);
      rulerPanel(c, fin(s, 3, 1.0, 0.8));
      const tip = fArrowGW(c, xr, AY, ang, S.gw * S.grow, sa);
      apDot(c, xr, AY, sa, 0);
      const gwNow = Math.round(Math.hypot(tip.x - xr, tip.y - AY) / PX_PER_GW);
      P(c, fin(s, 3, 1.0, 0.4), 'F = ' + gwNow + ' gw', (xr + tip.x) / 2 + 8, AY - 46, F_COL, 22, 'center', true);
      /* 複製一支飛到比例尺上 */
      [[30, 2.2, ROW1], [60, 5.8, ROW2]].forEach(([gw, t0, ry]) => {
        const f = ease(clamp01(since(s, 3, t0) / 0.9));
        if (since(s, 3, t0) < 0) return;
        const x0 = lerp(xr, RX, f), y0 = lerp(AY, ry, f);
        fArrow(c, x0, y0, x0 + gw * PX_PER_GW, y0, 0.4 + 0.6 * f);
        withA(c, f, () => { c.fillStyle = WHITE; c.beginPath(); c.arc(x0, y0, 5, 0, TAU); c.fill(); });
        const n = Math.round(gw * PX_PER_GW / CELL);
        T(c, fin(s, 3, t0 + 0.9, 0.4), L(gw + ' gw ＝ ' + n + ' 格', gw + ' gw = ' + n + ' boxes'), RX + gw * PX_PER_GW + 16, ry, F_COL, 22, 'left');
      });
      T(c, fin(s, 3, 4.6, 0.4) * fout(s, 3, 8.0, 0.4), L('用力拉！', 'Pull harder!'), S.fx + 175, AY - 100, WHITE, 22);
      P(c, fin(s, 3, 7.2, 0.6), L('長度 ∝ 大小：越長，力越大', 'Length ∝ size: longer arrow, bigger force'), 480, 505, F_COL, 24);
    }

    /* ── 第 4 步：完整的力圖 ── */
    if (s.n === 4) {
      P(c, fin(s, 4, 0.3, 0.5), L('一支箭頭，三個要素', 'One arrow, three elements'), 480, 62, F_COL, 24);
      /* 箭頭下方 3 格刻度 */
      const gA = fin(s, 4, 0.8, 0.6), gy = AY + 22;
      withA(c, gA, () => {
        for (let i = 0; i < 3; i++) {
          c.fillStyle = i % 2 ? 'rgba(77,210,255,0.16)' : 'rgba(77,210,255,0.34)';
          c.fillRect(xr + i * CELL, gy - 7, CELL, 14);
        }
        c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(xr, gy - 7, 3 * CELL, 14);
        for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(xr + i * CELL, gy - 7); c.lineTo(xr + i * CELL, gy + 7); c.stroke(); }
      });
      P(c, gA, L('比例尺：1 格 ＝ 10 gw', 'Scale: 1 box = 10 gw'), 480, 140, WHITE, 22);
      const tip = fArrowGW(c, xr, AY, ang, 30 * S.grow, 1);
      apDot(c, xr, AY, fin(s, 4, 0.6, 0.4), 0);
      const gwNow = Math.round(Math.hypot(tip.x - xr, tip.y - AY) / PX_PER_GW);
      const nCell = Math.round(gwNow * PX_PER_GW / CELL);
      /* 三個標籤 */
      const a1 = fin(s, 4, 2.0, 0.5), a2 = fin(s, 4, 3.2, 0.5), a3 = fin(s, 4, 4.4, 0.5);
      leader(c, a1, xr - 4, AY - 6, xr - 62, AY - 68, WHITE);
      P(c, a1, L('作用點', 'Point of action'), xr - 70, AY - 86, WHITE, 22, 'right');
      leader(c, a2, tip.x + 4, tip.y - 8, tip.x + 52, AY - 68, WHITE);
      P(c, a2, L('方向', 'Direction'), tip.x + 40, AY - 86, WHITE, 22, 'left');
      leader(c, a3, xr + 60, gy + 8, xr + 70, AY + 66, WHITE);
      P(c, a3, L('大小：' + nCell + ' 格 ＝ ' + gwNow + ' gw', 'Size: ' + nCell + ' boxes = ' + gwNow + ' gw'), xr + 30, AY + 84, WHITE, 22, 'left');
      const pA = fin(s, 4, 5.8, 0.6);
      if (pA > 0.02) W5.glow(c, 480, 505, 200, F_COL, 0.10 * pA);
      P(c, pA, L('作用點＋方向＋大小＝完整的力圖', 'Point + direction + size = a full force arrow'), 480, 505, F_COL, 24);
    }
  }

  W5.register('fdraw', { canvas: 'cvs-fdraw', steps: DUR, draw });
})();
