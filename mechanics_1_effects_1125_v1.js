/* ==================================================================
   mechanics_1 ｜ 力的兩種效應（cvs-effects，960×540）
   四步：1 踢球：運動改變 → 2 受力：形狀改變（慢動作特寫）→ 3 拉弓、捏黏土 → 4 兩種效應整合
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全站）：外力 F＝珊瑚 COL.coral。
   本頁兩種效應的標示色（只用在標籤）：運動狀態改變＝淡紫 MOT、形狀改變＝萊姆 SHP。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   人物：March 圖（running＝踢球、touch_ready＝伸手壓黏土），腳一律踩在地面線上。
   亂數一律 W5.hash；文字一律 L('中文','English')；整檔包在 IIFE。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F：珊瑚 */
  const MOT = '#b4a7ff';             /* 運動狀態改變：淡紫 */
  const SHP = '#c6f06a';             /* 形狀改變：萊姆 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const PATCH = '#1f2d29';           /* 足球黑塊（不用純黑） */
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── March 圖 ── */
  const MARCH = {};
  ['running', 'touch_ready'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  /* 左緣 x、腳底 gy、高 h；回傳縮放比（圖還沒載入時回傳 null） */
  function march(c, pose, x, gy, h, a) {
    const im = MARCH[pose];
    if (a <= 0.01 || !im || !im.complete || !im.naturalWidth) return null;
    const sc = h / im.naturalHeight, w = im.naturalWidth * sc;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.35; c.fillStyle = INK;           /* 腳下影子 */
    c.beginPath(); c.ellipse(x + w * 0.55, gy + 2, w * 0.42, 7, 0, 0, TAU); c.fill(); c.restore();
    c.drawImage(im, x, gy - h, w, h);
    c.restore();
    return sc;
  }

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（也不記進 W5.boxes） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  function subtitle(c, a, str, border) {
    if (a <= 0.02) return;
    const size = 22, w = W5.tw(c, str, size) + 48, h = 46, y0 = 494 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.88)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    W5.label(c, str, 480, 494, WHITE, size);
    c.restore();
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  function qpt(p0, p1, p2, f) {
    const g = 1 - f;
    return { x: g * g * p0[0] + 2 * g * f * p1[0] + f * f * p2[0], y: g * g * p0[1] + 2 * g * f * p1[1] + f * f * p2[1] };
  }
  function dashedQ(c, p0, p1, p2, f1, col, lw) {
    c.save(); c.setLineDash([7, 9]); c.strokeStyle = col; c.lineWidth = lw || 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= 30; i++) { const q = qpt(p0, p1, p2, f1 * i / 30); c.lineTo(q.x, q.y); }
    c.stroke(); c.restore();
  }

  /* 力箭頭 F（珊瑚＋光暈） */
  function forceArrow(c, a, x1, y1, x2, y2, lw, lab, lx, ly) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.45; W5.arrow(c, x1, y1, x2, y2, W5.rgba(F_COL, 0.5), (lw || 6) + 8, 24); c.restore();
    W5.arrow(c, x1, y1, x2, y2, F_COL, lw || 6, 20);
    c.restore();
    if (lab) T(c, a, 'F', lx, ly, F_COL, 26, 'center', true);
  }

  /* ── 地面：草地 ── */
  function grass(c, x0, x1, gy, a) {
    withA(c, a, () => {
      const g = c.createLinearGradient(0, gy, 0, gy + 100);
      g.addColorStop(0, '#1c4a31'); g.addColorStop(1, '#10291f');
      c.fillStyle = g; c.fillRect(x0, gy, x1 - x0, 100);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, gy); c.lineTo(x1, gy); c.stroke();
      c.strokeStyle = 'rgba(120,210,140,0.55)'; c.lineWidth = 2;
      for (let x = x0 + 6; x < x1 - 4; x += 13) {
        const h = 6 + 7 * hash(x * 0.37), lean = (hash(x * 1.3) - 0.5) * 6;
        c.beginPath(); c.moveTo(x, gy); c.lineTo(x + lean, gy - h); c.stroke();
      }
    });
  }

  /* ── 足球：可壓扁（sx,sy）、左側壓平（flat：壓平處距中心，以 r 為單位，≥1 表示沒有壓平） ── */
  function blobPath(c, x, y, rx, ry, flatL, flatR, flatB) {
    c.beginPath();
    for (let i = 0; i <= 72; i++) {
      const an = i / 72 * TAU;
      let px = Math.cos(an) * rx, py = Math.sin(an) * ry;
      if (flatL != null) px = Math.max(px, -flatL);
      if (flatR != null) px = Math.min(px, flatR);
      if (flatB != null) py = Math.min(py, flatB);
      if (i) c.lineTo(x + px, y + py); else c.moveTo(x + px, y + py);
    }
    c.closePath();
  }
  function pentagon(c, cx, cy, R, ang) {
    c.beginPath();
    for (let i = 0; i < 5; i++) { const an = ang + i * TAU / 5; const px = cx + Math.cos(an) * R, py = cy + Math.sin(an) * R; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.closePath();
  }
  function soccer(c, x, y, r, rot, sx, sy, flat, a) {
    if (a <= 0.02) return;
    sx = sx || 1; sy = sy || 1;
    const fl = flat == null ? null : flat * r;
    c.save(); c.globalAlpha *= a;
    /* 影子 */
    c.save(); c.globalAlpha *= 0.3; c.fillStyle = INK; c.beginPath(); c.ellipse(x, y + r * sy + 3, r * sx * 0.9, r * 0.14 + 2, 0, 0, TAU); c.fill(); c.restore();
    blobPath(c, x, y, r * sx, r * sy, fl, null, null);
    c.save(); c.clip();
    c.fillStyle = '#f3f1ea'; c.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
    c.translate(x, y); c.scale(sx, sy); c.rotate(rot);
    /* 縫線 */
    c.strokeStyle = 'rgba(60,70,66,0.55)'; c.lineWidth = Math.max(1, r * 0.035);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + i * TAU / 5;
      c.beginPath(); c.moveTo(Math.cos(an) * r * 0.3, Math.sin(an) * r * 0.3); c.lineTo(Math.cos(an) * r * 0.62, Math.sin(an) * r * 0.62); c.stroke();
    }
    c.fillStyle = PATCH;
    pentagon(c, 0, 0, r * 0.3, -Math.PI / 2); c.fill();
    for (let i = 0; i < 5; i++) {
      const an = Math.PI / 2 + i * TAU / 5;
      pentagon(c, Math.cos(an) * r * 0.9, Math.sin(an) * r * 0.9, r * 0.3, an); c.fill();
    }
    /* 立體：高光＋邊緣暗 */
    let g = c.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, -r * 0.2, -r * 0.2, r * 0.9);
    c.rotate(-rot);
    g = c.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, -r * 0.2, -r * 0.2, r * 0.95);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(11,26,21,0.5)');
    c.fillStyle = g; c.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
    c.restore();
    blobPath(c, x, y, r * sx, r * sy, fl, null, null);
    c.strokeStyle = 'rgba(40,52,48,0.9)'; c.lineWidth = Math.max(1.5, r * 0.04); c.stroke();
    c.restore();
  }
  function ghostBall(c, x, y, r, a, col) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = W5.rgba(col || WHITE, 0.25); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = W5.rgba(col || WHITE, 0.7); c.lineWidth = 2; c.stroke();
    c.restore();
  }
  function speedLines(c, x, y, vx, vy, r, a) {
    if (a <= 0.02) return;
    const m = Math.hypot(vx, vy) || 1, ux = vx / m, uy = vy / m, nx = -uy, ny = ux;
    c.save(); c.globalAlpha *= a; c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineCap = 'round'; c.lineWidth = 3;
    [-0.6, 0, 0.6].forEach((o, i) => {
      const sx = x - ux * r * 1.3 + nx * o * r, sy = y - uy * r * 1.3 + ny * o * r, len = r * (1.4 + 0.5 * (i === 1));
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - ux * len, sy - uy * len); c.stroke();
    });
    c.restore();
  }

  /* ── 球鞋＋小腿（鞋尖在 tx,ty，朝右；s 縮放） ── */
  function shoe(c, tx, ty, s, a, leg) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(tx, ty); c.scale(s, s);
    /* 小腿（襪子＋皮膚），往左上延伸 */
    const ax1 = -118, ay1 = -58, ax2 = -172, ay2 = -54, dx = -0.42 * 420 * (leg || 1), dy = -1 * 420 * (leg || 1);
    let g = c.createLinearGradient(ax2, ay2, ax1, ay1);
    g.addColorStop(0, '#d8d2c2'); g.addColorStop(0.5, '#f6f1e4'); g.addColorStop(1, '#cfc8b6');
    c.fillStyle = g; c.beginPath(); c.moveTo(ax1, ay1); c.lineTo(ax2, ay2); c.lineTo(ax2 + dx * 0.45, ay2 + dy * 0.45); c.lineTo(ax1 + dx * 0.45, ay1 + dy * 0.45); c.closePath(); c.fill();
    c.strokeStyle = '#3d7bd9'; c.lineWidth = 7;
    [0.2, 0.3].forEach(f => { c.beginPath(); c.moveTo(ax1 + dx * f, ay1 + dy * f); c.lineTo(ax2 + dx * f, ay2 + dy * f); c.stroke(); });
    g = c.createLinearGradient(ax2, ay2, ax1, ay1);
    g.addColorStop(0, '#c98d63'); g.addColorStop(0.5, '#f0c39c'); g.addColorStop(1, '#c98d63');
    c.fillStyle = g; c.beginPath();
    c.moveTo(ax1 + dx * 0.45, ay1 + dy * 0.45); c.lineTo(ax2 + dx * 0.45, ay2 + dy * 0.45); c.lineTo(ax2 + dx, ay2 + dy); c.lineTo(ax1 + dx, ay1 + dy); c.closePath(); c.fill();
    /* 鞋身 */
    c.beginPath();
    c.moveTo(-165, 26); c.lineTo(-12, 26);
    c.quadraticCurveTo(10, 26, 8, 4); c.quadraticCurveTo(4, -18, -32, -24);
    c.lineTo(-92, -36); c.lineTo(-118, -62); c.lineTo(-174, -58);
    c.quadraticCurveTo(-186, -18, -165, 26); c.closePath();
    g = c.createLinearGradient(0, -60, 0, 28);
    g.addColorStop(0, '#4d78c9'); g.addColorStop(0.6, '#26468a'); g.addColorStop(1, '#1b3366');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#0f1f3f'; c.lineWidth = 3; c.stroke();
    /* 鞋側亮條 */
    c.strokeStyle = SHP; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-150, 6); c.quadraticCurveTo(-90, -2, -30, -12); c.stroke();
    /* 鞋帶 */
    c.strokeStyle = '#f6f3ea'; c.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) { const x = -48 - i * 15, y = -28 - i * 3.2; c.beginPath(); c.moveTo(x - 6, y - 5); c.lineTo(x + 6, y + 5); c.stroke(); }
    /* 鞋底＋鞋釘 */
    c.fillStyle = '#d5dcd8'; W5.rr(c, -168, 22, 172, 9, 4); c.fill();
    c.fillStyle = '#9aa6a1';
    [-150, -122, -58, -30].forEach(x => { W5.rr(c, x, 30, 12, 9, 3); c.fill(); });
    /* 高光 */
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(-60, -14, 34, 7, -0.15, 0, TAU); c.fill();
    c.restore();
  }

  /* ── 足球門（側視） ── */
  function goal(c, x, gy, a) {
    withA(c, a, () => {
      const top = gy - 128, bx = x + 82;
      c.strokeStyle = 'rgba(246,243,234,0.28)'; c.lineWidth = 1.5;
      for (let i = 1; i < 7; i++) { const f = i / 7; c.beginPath(); c.moveTo(x, top + f * 128); c.lineTo(lerp(x + 34, bx, f), top + 8 + f * 120); c.stroke(); }
      for (let i = 1; i < 5; i++) { const f = i / 5; c.beginPath(); c.moveTo(x + f * 34, top + f * 8); c.lineTo(x + f * 82, gy); c.stroke(); }
      c.strokeStyle = '#e9eee9'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, gy); c.lineTo(x, top); c.lineTo(x + 34, top + 8); c.lineTo(bx, gy); c.stroke();
    });
  }

  /* ── 球棒、棒球 ── */
  function bat(c, px, py, ang, len, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(px, py); c.rotate(ang);
    const g = c.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#f0c98a'); g.addColorStop(0.5, '#c98d4a'); g.addColorStop(1, '#8a5a2b');
    c.fillStyle = g; c.beginPath();
    c.moveTo(-4, -3.5); c.lineTo(len * 0.45, -4.5); c.quadraticCurveTo(len * 0.75, -9, len, -9);
    c.arc(len, 0, 9, -Math.PI / 2, Math.PI / 2); c.quadraticCurveTo(len * 0.75, 9, len * 0.45, 4.5); c.lineTo(-4, 3.5); c.closePath(); c.fill();
    c.fillStyle = '#3a2a1c'; W5.rr(c, -8, -6, 7, 12, 3); c.fill();
    c.restore();
  }
  function baseball(c, x, y, r, rot, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    W5.ball(c, x, y, r, '#eeeae0');
    c.translate(x, y); c.rotate(rot); c.strokeStyle = '#ff4d4d'; c.lineWidth = 1.8;
    c.beginPath(); c.arc(-r * 1.25, 0, r * 0.85, -0.75, 0.75); c.stroke();
    c.beginPath(); c.arc(r * 1.25, 0, r * 0.85, Math.PI - 0.75, Math.PI + 0.75); c.stroke();
    c.restore();
  }

  /* ── 面板 ── */
  function panel(c, x, y, w, h, a, border) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(23,51,42,0.82)'; W5.rr(c, x, y, w, h, 18); c.fill();
      c.lineWidth = 2; c.strokeStyle = border || 'rgba(246,243,234,0.2)'; c.stroke();
    });
  }

  /* ═══════════ 步驟 1：踢球 → 運動狀態改變 ═══════════ */
  const GY1 = 440, MH1 = 230, MX1 = 40;
  const B0 = [276, 416], BR1 = 24, B_CTRL = [440, 250], B_END = [620, 372], B_REST = [640, 416];
  const KT = 2.0, FL0 = 2.25, FL1 = 3.55;
  function kickBall(u) {
    if (u < FL0) {
      const sq = Math.sin(Math.PI * seg(u, KT, FL0));
      return { x: B0[0] + 4 * sq, y: B0[1], rot: 0, sq, vx: 0, vy: 0 };
    }
    if (u < FL1) {
      const q = seg(u, FL0, FL1), f = 1 - Math.pow(1 - q, 1.6), p = qpt(B0, B_CTRL, B_END, f);
      const p2 = qpt(B0, B_CTRL, B_END, Math.min(1, f + 0.02));
      return { x: p.x, y: p.y, rot: f * 9, sq: 0, vx: p2.x - p.x, vy: p2.y - p.y };
    }
    const d = ease(seg(u, FL1, FL1 + 0.45));
    return { x: lerp(B_END[0], B_REST[0], d), y: lerp(B_END[1], B_REST[1], d * d), rot: 9 + d * 0.8, sq: 0, vx: 0, vy: 0 };
  }
  function ballAtTime(t) { return kickBall(t); }

  function draw1(c, s) {
    const u = s.u, k = s.k;
    grass(c, 0, 960, GY1, 1);
    goal(c, 600, GY1, k);
    /* 跑過來踢 */
    const run = ease(seg(u, 0.4, KT));
    march(c, 'running', MX1 + lerp(-120, 0, run), GY1, MH1, k);

    const b = kickBall(u);
    /* 靜止時的標籤 */
    const aRest = seg(u, 0.5, 1.2) * (1 - seg(u, KT + 0.2, KT + 0.6));
    T(c, aRest, L('靜止', 'At rest'), B0[0], B0[1] - 62, DIM, 22);

    /* 頻閃殘影＋虛線軌跡 */
    if (u >= FL0) {
      const fNow = 1 - Math.pow(1 - seg(u, FL0, FL1), 1.6);
      dashedQ(c, B0, B_CTRL, B_END, fNow, 'rgba(246,243,234,0.35)', 2);
      for (let i = 0; ; i++) {
        const ti = FL0 + i * 0.16; if (ti > Math.min(u, FL1) - 0.05) break;
        const g = ballAtTime(ti); ghostBall(c, g.x, g.y, BR1, 0.75, WHITE);
      }
    }
    /* 衝擊光 */
    const imp = Math.sin(Math.PI * seg(u, KT - 0.05, KT + 0.5));
    if (imp > 0) W5.glow(c, B0[0] - 8, B0[1], 60, F_COL, 0.55 * imp);
    if (u > FL0 && u < FL1 + 0.1) speedLines(c, b.x, b.y, b.vx, b.vy, BR1, 1 - seg(u, FL1 - 0.2, FL1 + 0.1));
    soccer(c, b.x, b.y, BR1, b.rot, 1 - 0.22 * b.sq, 1 + 0.12 * b.sq, 1 - 0.5 * b.sq, k);
    /* 力 F（碰到的瞬間出現，之後留在原處當脈絡） */
    const gF = ease(seg(u, KT - 0.05, KT + 0.35));
    forceArrow(c, gF, B0[0] - 6, B0[1] - 4, B0[0] - 6 + 74 * gF, B0[1] - 4 - 34 * gF, 6, true, B0[0] + 52, B0[1] - 58);

    /* 結論標籤 */
    P(c, ease(seg(u, FL1, FL1 + 0.5)), L('靜止  →  運動', 'At rest  →  moving'), 440, 222, WHITE, 24);
    P(c, ease(seg(u, FL1 + 0.5, FL1 + 1.0)), L('運動狀態改變', 'Motion changes'), 440, 166, MOT, 26);

    /* 第二個例子：全壘打（小框） */
    const aP = ease(seg(u, 4.6, 5.3));
    if (aP > 0.02) {
      const px = 700, py = 96, pw = 240, ph = 270, gy = py + ph - 34;
      panel(c, px, py, pw, ph, aP, W5.rgba(MOT, 0.55));
      T(c, aP, L('例：全壘打', 'e.g. Home run'), px + pw / 2, py + 28, WHITE, 22);
      withA(c, aP, () => {
        c.save(); W5.rr(c, px + 2, py + 2, pw - 4, ph - 4, 16); c.clip();
        c.fillStyle = 'rgba(30,74,49,0.9)'; c.fillRect(px, gy, pw, ph);
        c.strokeStyle = '#5fbf7a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px, gy); c.lineTo(px + pw, gy); c.stroke();
        /* 打擊座 */
        const tx = 800, ballY = gy - 46, BR = 11;
        c.fillStyle = '#2c3a35'; W5.rr(c, tx - 4, gy - 34, 8, 34, 3); c.fill();
        c.fillStyle = '#3d4c46'; c.beginPath(); c.ellipse(tx, gy - 2, 18, 5, 0, 0, TAU); c.fill();
        /* 揮棒 */
        const sw = ease(seg(u, 5.4, 6.0)), ang = lerp(1.75, -0.45, sw), pvx = 748, pvy = ballY;
        const HT = 5.4 + 0.6 * 0.71;
        if (sw > 0.05 && sw < 0.98) {
          c.save(); c.globalAlpha *= 0.3 * Math.sin(Math.PI * sw); c.strokeStyle = WHITE; c.lineWidth = 16;
          c.beginPath(); c.arc(pvx, pvy, 58, ang, Math.min(1.75, ang + 0.9)); c.stroke(); c.restore();
        }
        bat(c, pvx, pvy, ang, 74, 1);
        /* 棒球飛出 */
        const q = seg(u, HT, HT + 0.85), f = 1 - Math.pow(1 - q, 1.5);
        const S0 = [tx, ballY], S1 = [860, 176], S2 = [912, 150];
        if (q > 0) {
          dashedQ(c, S0, S1, S2, f, 'rgba(246,243,234,0.35)', 2);
          for (let i = 0; ; i++) {
            const ti = HT + i * 0.14; if (ti > Math.min(u, HT + 0.85) - 0.05) break;
            const qq = seg(ti, HT, HT + 0.85), g = qpt(S0, S1, S2, 1 - Math.pow(1 - qq, 1.5));
            ghostBall(c, g.x, g.y, BR, 0.8, WHITE);
          }
        }
        const bp = qpt(S0, S1, S2, f);
        baseball(c, bp.x, bp.y, BR, f * 8, 1);
        c.restore();
        const gA = ease(seg(u, HT - 0.05, HT + 0.3));
        forceArrow(c, gA, tx - 4, ballY + 6, tx - 4 + 46 * gA, ballY + 6 - 24 * gA, 5, true, tx + 32, ballY + 34);
      });
    }
    subtitle(c, ease(seg(u, 4.2, 4.9)), L('球本來靜止，被踢一腳就飛出去：運動狀態改變了', 'The ball was at rest; one kick sends it flying: its motion changed'));
  }

  /* ═══════════ 步驟 2：慢動作特寫 → 形狀改變 ═══════════ */
  const CP = { x: 30, y: 46, w: 548, h: 412 };      /* 特寫框 */
  const GY2 = 404, R2 = 104, X2 = 384;               /* 球的原位：圓心 (X2, GY2-R2) */
  /* q：壓扁程度 0..1 → 球形與鞋尖位置 */
  function squashGeom(q, x0, gy, r) {
    const sx = 1 - 0.2 * q, sy = 1 + 0.1 * q;
    const cx = x0 + r - r * sx;                      /* 右緣不動 */
    const cy = gy - r * sy;
    const flat = sx * (1 - 0.2 * q);                /* 左側壓平處（以 r 為單位） */
    return { cx, cy, sx, sy, flat, toe: cx - flat * r };
  }
  function frameThumb(c, i, x, y, w, h, lit, a, u) {
    if (a <= 0.02) return;
    const on = lit;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.78)'; W5.rr(c, x, y, w, h, 14); c.fill();
      c.lineWidth = on ? 3 : 1.5; c.strokeStyle = on ? (i === 1 ? SHP : 'rgba(246,243,234,0.6)') : 'rgba(246,243,234,0.2)'; c.stroke();
      c.save(); W5.rr(c, x + 2, y + 2, w - 4, h - 4, 12); c.clip();
      const gy = y + h - 16, r = 32, x0 = x + 104;
      c.fillStyle = 'rgba(30,74,49,0.9)'; c.fillRect(x, gy, w, 20);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w, gy); c.stroke();
      if (i === 0) {
        soccer(c, x0, gy - r, r, 0.2, 1, 1, null, 1);
        shoe(c, x0 - r - 26, gy - r + 4, 0.3, 1);
      } else if (i === 1) {
        const G = squashGeom(1, x0, gy, r);
        soccer(c, G.cx, G.cy, r, 0.2, G.sx, G.sy, G.flat, 1);
        shoe(c, G.toe, G.cy + 4, 0.3, 1);
      } else {
        soccer(c, x0 + 44, gy - r - 10, r, 0.9, 1, 1, null, 1);
        speedLines(c, x0 + 44, gy - r - 10, 1, -0.1, r * 0.8, 0.9);
        shoe(c, x0 - r + 8, gy - r + 4, 0.3, 1);
      }
      c.restore();
      const names = [L('接觸前', 'Before'), L('壓扁', 'Squashed'), L('回彈', 'Rebound')];
      T(c, 1, (i + 1) + ' ' + names[i], x + w - 18, y + h / 2 - 6, on ? (i === 1 ? SHP : WHITE) : DIM, 22, 'right');
    });
  }
  function draw2(c, s) {
    const u = s.u, k = s.k;
    /* 特寫框 */
    panel(c, CP.x, CP.y, CP.w, CP.h, k, 'rgba(246,243,234,0.28)');
    withA(c, k, () => {
      c.save(); W5.rr(c, CP.x + 2, CP.y + 2, CP.w - 4, CP.h - 4, 16); c.clip();
      const g = c.createLinearGradient(0, GY2, 0, CP.y + CP.h);
      g.addColorStop(0, '#1f5235'); g.addColorStop(1, '#123222');
      c.fillStyle = g; c.fillRect(CP.x, GY2, CP.w, CP.h);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(CP.x, GY2); c.lineTo(CP.x + CP.w, GY2); c.stroke();
      c.strokeStyle = 'rgba(120,210,140,0.5)'; c.lineWidth = 2.5;
      for (let x = CP.x + 8; x < CP.x + CP.w; x += 16) { const h = 8 + 10 * hash(x * 0.71); c.beginPath(); c.moveTo(x, GY2); c.lineTo(x + (hash(x) - 0.5) * 8, GY2 - h); c.stroke(); }

      const app = ease(seg(u, 0.5, 2.2)), q = ease(seg(u, 2.2, 3.6));
      const G = squashGeom(q, X2, GY2, R2);
      /* 原本的形狀（虛線） */
      const aG = seg(u, 2.9, 3.5);
      if (aG > 0) {
        c.save(); c.globalAlpha *= aG; c.setLineDash([9, 9]); c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(X2, GY2 - R2, R2, 0, TAU); c.stroke(); c.restore();
      }
      soccer(c, G.cx, G.cy, R2, 0.25, G.sx, G.sy, G.flat, 1);
      /* 鞋：從左邊進來，碰到球後繼續推 */
      const toeX = q > 0 ? G.toe : lerp(CP.x - 40, X2 - R2, app);
      shoe(c, toeX, G.cy + 8, 1, 1);
      /* 接觸處的壓力光 */
      if (q > 0) W5.glow(c, toeX + 6, G.cy, 70, F_COL, 0.4 * q);
      c.restore();
      /* 力 F：從接觸面指向球內 */
      if (q > 0.02) {
        const len = 30 + 80 * q;
        forceArrow(c, clamp01(q * 3), toeX + 10, G.cy + 6, toeX + 10 + len, G.cy + 6, 7, true, toeX + 10 + len / 2, G.cy - 26);
      }
      T(c, aG, L('虛線：原本的圓', 'Dashed: original round shape'), CP.x + CP.w / 2, 432, DIM, 22);
    });
    /* 慢動作標記 */
    withA(c, k, () => {
      const r = P(c, 1, L('慢動作特寫', 'Slow-motion close-up'), CP.x + 18, CP.y + 30, WHITE, 22, 'left');
      if (r) {
        const blink = 0.55 + 0.45 * Math.cos(Math.min(u, 3.6) * 5);
        c.save(); c.globalAlpha *= blink; W5.glow(c, r.x + r.w + 18, CP.y + 30, 14, '#ff4d4d', 0.8);
        c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(r.x + r.w + 18, CP.y + 30, 6, 0, TAU); c.fill(); c.restore();
      }
    });
    P(c, ease(seg(u, 3.9, 4.5)), L('形狀改變（形變）', 'Shape changes (deformation)'), CP.x + CP.w - 18, 136, SHP, 26, 'right');

    /* 右側三格 */
    const fx = 600, fw = 334, fh = 112, fy = [62, 186, 310];
    for (let i = 0; i < 3; i++) {
      const t0 = [0.9, 3.5, 4.6][i];
      const a = ease(seg(u, t0, t0 + 0.6));
      const lit = i === 1 ? u >= 3.5 : (u >= t0 && u < t0 + 1.2) || false;
      frameThumb(c, i, fx, fy[i], fw, fh, i === 1 ? lit : lit, Math.max(0.25 * k, a), u);
    }
    withA(c, ease(seg(u, 3.5, 4.1)), () => {
      c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 2;
      [0, 1].forEach(i => W5.arrow(c, fx + fw / 2, fy[i] + fh + 2, fx + fw / 2, fy[i + 1] - 2, 'rgba(246,243,234,0.5)', 2.5, 10));
    });
    subtitle(c, ease(seg(u, 4.8, 5.5)), L('腳碰到球的一瞬間，球先被壓扁：形狀改變了', 'The instant the foot hits, the ball squashes first: its shape changed'));
  }

  /* ═══════════ 步驟 3：拉弓、捏黏土 ═══════════ */
  function bowShape(b) {
    const RX = 270, MY = 284;
    const Tx = lerp(250, 222, b), Ty = lerp(150, 166, b);
    return { RX, MY, T: [Tx, Ty], B: [Tx, 2 * MY - Ty], C: [2 * RX - Tx, MY], N: [lerp(Tx, 130, b), MY] };
  }
  function drawBow(c, b, ghost) {
    const S = bowShape(b);
    if (ghost) {
      c.save(); c.setLineDash([8, 8]); c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(S.T[0], S.T[1]); c.quadraticCurveTo(S.C[0], S.C[1], S.B[0], S.B[1]); c.stroke();
      c.beginPath(); c.moveTo(S.T[0], S.T[1]); c.lineTo(S.B[0], S.B[1]); c.stroke();
      c.restore(); return;
    }
    /* 弦 */
    c.strokeStyle = '#e8e2cf'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(S.T[0], S.T[1]); c.lineTo(S.N[0], S.N[1]); c.lineTo(S.B[0], S.B[1]); c.stroke();
    /* 弓臂 */
    c.lineCap = 'round';
    c.strokeStyle = '#5a3a1e'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(S.T[0], S.T[1]); c.quadraticCurveTo(S.C[0], S.C[1], S.B[0], S.B[1]); c.stroke();
    c.strokeStyle = '#b97b3f'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(S.T[0], S.T[1]); c.quadraticCurveTo(S.C[0], S.C[1], S.B[0], S.B[1]); c.stroke();
    c.strokeStyle = 'rgba(255,226,170,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(S.T[0] - 2, S.T[1]); c.quadraticCurveTo(S.C[0] - 3, S.C[1], S.B[0] - 2, S.B[1]); c.stroke();
    /* 握把 */
    c.fillStyle = '#2f2a3a'; W5.rr(c, S.RX - 9, S.MY - 26, 20, 52, 7); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(S.RX - 8, S.MY - 20 + i * 10); c.lineTo(S.RX + 10, S.MY - 16 + i * 10); c.stroke(); }
    /* 箭（還沒射出） */
    const nx = S.N[0], len = 178, hx = nx + len;
    c.strokeStyle = '#d9c7a0'; c.lineWidth = 4; c.beginPath(); c.moveTo(nx, S.MY); c.lineTo(hx - 12, S.MY); c.stroke();
    c.fillStyle = '#c9d3d0'; c.beginPath(); c.moveTo(hx + 8, S.MY); c.lineTo(hx - 14, S.MY - 9); c.lineTo(hx - 14, S.MY + 9); c.closePath(); c.fill();
    c.fillStyle = '#ff4d4d';
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(nx + 4, S.MY); c.lineTo(nx + 30, S.MY); c.lineTo(nx + 18, S.MY + d * 11); c.lineTo(nx - 2, S.MY + d * 11); c.closePath(); c.fill(); });
  }
  const GY3 = 440, CLAY_R = 34, WALL_X = 868, TABLE_Y = 300, MH3 = 270;
  function draw3(c, s) {
    const u = s.u, k = s.k;
    /* 分隔線 */
    withA(c, k, () => {
      c.save(); c.setLineDash([6, 10]); c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(480, 50); c.lineTo(480, 450); c.stroke(); c.restore();
    });
    P(c, k, L('拉弓', 'Drawing a bow'), 240, 66, WHITE, 24);
    P(c, k, L('捏黏土', 'Squeezing clay'), 720, 66, WHITE, 24);

    /* ── 左：拉弓 ── */
    const b = ease(seg(u, 1.2, 3.4));
    withA(c, k, () => {
      if (b > 0.05) { c.save(); c.globalAlpha *= seg(u, 2.6, 3.2); drawBow(c, 0, true); c.restore(); }
      drawBow(c, b, false);
    });
    const S = bowShape(b);
    forceArrow(c, clamp01(b * 2.5) * k, S.N[0] - 4, S.MY, S.N[0] - 4 - 88 * b, S.MY, 6, true, S.N[0] - 4 - 44 * b, S.MY - 30);
    T(c, seg(u, 3.4, 4.0), L('箭還沒射出', 'Arrow not shot yet'), 364, 440, DIM, 22);
    P(c, ease(seg(u, 3.6, 4.2)), L('形狀改變', 'Shape changes'), 240, 126, SHP, 24);

    /* ── 右：捏黏土 ── */
    grass(c, 492, 960, GY3, k);
    withA(c, k, () => {
      /* 桌子 */
      const tx0 = 748, tx1 = 900;
      c.fillStyle = '#6b4a2e'; W5.rr(c, tx0, TABLE_Y, tx1 - tx0, 14, 4); c.fill();
      c.fillStyle = 'rgba(255,220,170,0.25)'; c.fillRect(tx0 + 4, TABLE_Y + 2, tx1 - tx0 - 8, 3);
      c.fillStyle = '#54391f'; c.fillRect(tx0 + 12, TABLE_Y + 14, 10, GY3 - TABLE_Y - 14); c.fillRect(tx1 - 22, TABLE_Y + 14, 10, GY3 - TABLE_Y - 14);
      /* 擋板 */
      const g = c.createLinearGradient(WALL_X, 0, WALL_X + 18, 0); g.addColorStop(0, '#8fa39c'); g.addColorStop(1, '#5d6f69');
      c.fillStyle = g; W5.rr(c, WALL_X, TABLE_Y - 150, 18, 150, 4); c.fill();
    });
    /* 黏土：寬度由手掌位置決定 */
    const walk = ease(seg(u, 1.0, 2.4)), push = ease(seg(u, 2.4, 4.2));
    const palm0 = WALL_X - 2 * CLAY_R;                 /* 剛碰到黏土的手掌 x */
    const palm = lerp(palm0 - 70, palm0, walk) + 30 * push;
    const w = WALL_X - Math.max(palm, palm0) ;         /* 黏土寬 */
    const sx = w / (2 * CLAY_R), sy = Math.pow(1 / sx, 0.85);
    const ccx = WALL_X - w / 2, rx = CLAY_R * sx * (1 + 0.12 * push), ry = CLAY_R * sy, ccy = TABLE_Y - ry;
    withA(c, k, () => {
      if (push > 0.05) {
        c.save(); c.globalAlpha *= seg(u, 3.0, 3.6); c.setLineDash([7, 7]); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(WALL_X - CLAY_R, TABLE_Y - CLAY_R, CLAY_R, 0, TAU); c.stroke(); c.restore();
      }
      blobPath(c, ccx, ccy, rx, ry, w / 2, w / 2, ry);
      const g = c.createRadialGradient(ccx - rx * 0.3, ccy - ry * 0.4, 2, ccx, ccy, Math.max(rx, ry) * 1.1);
      g.addColorStop(0, '#f2b38f'); g.addColorStop(0.45, '#c0684a'); g.addColorStop(1, '#7a3b28');
      c.fillStyle = g; c.fill(); c.strokeStyle = '#5a2a1c'; c.lineWidth = 2; c.stroke();
    });
    /* March：手掌尖在圖上 (207,180)／(208×472) */
    const sc = MH3 / 472, mx = palm - 205 * sc;
    march(c, 'touch_ready', mx, GY3, MH3, k);
    forceArrow(c, clamp01(push * 2.5) * k, palm - 52, TABLE_Y - 27, palm + 22, TABLE_Y - 27, 6, true, palm - 14, TABLE_Y - 58);
    P(c, ease(seg(u, 4.4, 5.0)), L('形狀改變', 'Shape changes'), 720, 126, SHP, 24);

    subtitle(c, ease(seg(u, 5.0, 5.7)), L('拉弓、捏黏土：力讓物體的形狀改變', 'Bow and clay: a force changes an object’s shape'));
  }

  /* ═══════════ 步驟 4：兩種效應整合 ═══════════ */
  const GY4 = 352, R4 = 46, X4 = 300;
  const F4 = [[X4, GY4 - R4], [560, 150], [868, 196]];
  function draw4(c, s) {
    const u = s.u, k = s.k;
    withA(c, k, () => {
      c.save(); c.setLineDash([6, 10]); c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(480, 104); c.lineTo(480, 340); c.stroke(); c.restore();
    });
    grass(c, 0, 960, GY4, k);
    /* 兩個標題：發生時亮起 */
    const litL = ease(seg(u, 2.2, 2.7)), litR = ease(seg(u, 3.9, 4.4));
    P(c, k * (0.4 + 0.6 * litL), L('① 形狀改變（壓扁）', '① Shape changes (squash)'), 240, 72, litL > 0.5 ? SHP : DIM, 24);
    P(c, k * (0.4 + 0.6 * litR), L('② 運動狀態改變（飛出去）', '② Motion changes (flies off)'), 720, 72, litR > 0.5 ? MOT : DIM, 24);

    const app = ease(seg(u, 0.6, 1.6)), q = ease(seg(u, 1.6, 2.3)) * (1 - ease(seg(u, 2.5, 2.85)));
    const fly = seg(u, 2.7, 4.1), f = 1 - Math.pow(1 - fly, 1.5);
    const G = squashGeom(q, X4, GY4, R4);
    /* 壓扁的定格（萊姆框） */
    const aFreeze = seg(u, 2.6, 3.0);
    if (aFreeze > 0) {
      const Gm = squashGeom(1, X4, GY4, R4);
      c.save(); c.globalAlpha *= 0.55 * aFreeze;
      soccer(c, Gm.cx, Gm.cy, R4, 0.3, Gm.sx, Gm.sy, Gm.flat, 1); c.restore();
      withA(c, aFreeze, () => {
        c.save(); c.setLineDash([6, 6]); c.strokeStyle = SHP; c.lineWidth = 2.5;
        W5.rr(c, Gm.cx - R4 * 1.0, Gm.cy - R4 * Gm.sy - 12, R4 * 2.0, R4 * Gm.sy * 2 + 20, 12); c.stroke(); c.restore();
      });
    }
    /* 飛行：殘影＋軌跡 */
    if (fly > 0) {
      dashedQ(c, F4[0], F4[1], F4[2], f, 'rgba(180,167,255,0.6)', 2.5);
      for (let i = 1; ; i++) {
        const ti = 2.7 + i * 0.2; if (ti > Math.min(u, 4.1) - 0.05) break;
        const qq = seg(ti, 2.7, 4.1), g = qpt(F4[0], F4[1], F4[2], 1 - Math.pow(1 - qq, 1.5));
        ghostBall(c, g.x, g.y, R4 * 0.8, 0.8, MOT);
      }
    }
    /* 鞋 */
    const toeX = q > 0 ? G.toe : lerp(60, X4 - R4, app);
    const toeAfter = fly > 0 ? lerp(G.toe, X4 - R4 + 8, ease(seg(u, 2.5, 3.0))) : toeX;
    /* 球 */
    if (fly <= 0) {
      soccer(c, G.cx, G.cy, R4, 0.3, G.sx, G.sy, G.flat, k);
      if (q > 0) W5.glow(c, toeX + 4, G.cy, 50, F_COL, 0.4 * q);
    } else {
      const p = qpt(F4[0], F4[1], F4[2], f), p2 = qpt(F4[0], F4[1], F4[2], Math.min(1, f + 0.02));
      if (fly < 1) speedLines(c, p.x, p.y, p2.x - p.x, p2.y - p.y, R4, 1);
      soccer(c, p.x, p.y, R4, 0.3 + f * 8, 1, 1, null, 1);
    }
    shoe(c, fly > 0 ? toeAfter : toeX, GY4 - R4 + 6, 0.55, k, 0.62);
    /* F */
    const aF = ease(seg(u, 1.6, 1.9));
    forceArrow(c, aF, X4 - R4 + 4, GY4 - R4 - 70, X4 - R4 + 4 + 76, GY4 - R4 - 70, 6, true, X4 - R4 - 20, GY4 - R4 - 70);

    /* 時間軸 */
    withA(c, k, () => {
      const y = 412;
      W5.arrow(c, 70, y, 900, y, 'rgba(246,243,234,0.7)', 3, 16);
      const ticks = [[150, L('接觸', 'Contact'), 0.8, WHITE], [330, L('先壓扁', 'Squash first'), 2.2, SHP], [700, L('再飛出去', 'Then fly off'), 3.9, MOT]];
      ticks.forEach(([x, str, t0, col]) => {
        const on = ease(seg(u, t0, t0 + 0.4));
        c.fillStyle = on > 0.5 ? col : 'rgba(246,243,234,0.4)'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
        T(c, 0.35 + 0.65 * on, str, x, y - 30, on > 0.5 ? col : DIM, 22);
      });
      T(c, 1, L('時間', 'Time'), 916, y - 30, DIM, 22, 'right');
    });
    subtitle(c, ease(seg(u, 5.0, 5.7)), L('看不見的力，從這兩種效應抓到它', 'An invisible force is caught through these two effects'), F_COL);
  }

  W5.register('effects', {
    canvas: 'cvs-effects',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) draw1(c, s);
      else if (s.n === 2) draw2(c, s);
      else if (s.n === 3) draw3(c, s);
      else draw4(c, s);
    }
  });
})();
