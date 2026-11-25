/* ==================================================================
   mechanics_1 ｜ 接觸力與超距力（cvs-ftypes，960×540）
   四步：1 接觸力（踢球、拉彈簧）→ 2 磁力不用碰 → 3 地球引力 → 4 力不是物質
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全站）：外力 F／磁力＝珊瑚 COL.coral；重力（地球引力）＝粉 COL.pink；質量＝綠 COL.green。
   「接觸力／超距力」分類小標籤不另設新色：亮起＝白、未亮＝淡灰。
   步驟 1～3 底部固定一列分類標籤（接觸力｜超距力），逐步把例子填進去，保留脈絡。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   人物：March 圖（running＝踢球、touch_ready＝手抓彈簧、thinking＝站在實驗桌後想把力裝進瓶子）。
   亂數一律 W5.hash；文字一律 L('中文','English')；整檔包在 IIFE。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 外力 F、磁力：珊瑚 */
  const G_COL = COL.pink;            /* 重力（地球引力）：粉 */
  const M_COL = COL.green;           /* 質量：綠 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', PATCH = '#1f2d29';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── March 圖 ── */
  const MARCH = {};
  ['running', 'touch_ready', 'thinking'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  /* 左緣 x、腳底 gy、高 h；shadow=false 時不畫腳下影子（站在桌後） */
  function march(c, pose, x, gy, h, a, shadow) {
    const im = MARCH[pose];
    if (a <= 0.01 || !im || !im.complete || !im.naturalWidth) return null;
    const sc = h / im.naturalHeight, w = im.naturalWidth * sc;
    c.save(); c.globalAlpha *= a;
    if (shadow !== false) {
      c.save(); c.globalAlpha *= 0.35; c.fillStyle = INK;
      c.beginPath(); c.ellipse(x + w * 0.55, gy + 2, w * 0.42, 7, 0, 0, TAU); c.fill(); c.restore();
    }
    c.drawImage(im, x, gy - h, w, h);
    c.restore();
    return sc;
  }

  /* ── 文字：一律走 W5.label / W5.pill ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  /* 力箭頭（帶光暈） */
  function forceArrow(c, a, x1, y1, x2, y2, col, lw, head) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.45; W5.arrow(c, x1, y1, x2, y2, W5.rgba(col, 0.5), (lw || 6) + 8, (head || 20) + 4); c.restore();
    W5.arrow(c, x1, y1, x2, y2, col, lw || 6, head || 20);
    c.restore();
  }

  /* 接觸點：發亮圓圈（pulse 0..1 只在動作時有，停留畫面為 0） */
  function contactRing(c, a, x, y, r, pulse) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    W5.glow(c, x, y, r * 2.4, F_COL, 0.5);
    c.strokeStyle = 'rgba(255,224,170,0.95)'; c.lineWidth = 3.5;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    if (pulse > 0.01) {
      c.globalAlpha *= pulse; c.strokeStyle = W5.rgba(F_COL, 0.9); c.lineWidth = 2.5;
      c.beginPath(); c.arc(x, y, r * (1.2 + 0.6 * pulse), 0, TAU); c.stroke();
    }
    c.restore();
  }

  function panel(c, x, y, w, h, a, border) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(23,51,42,0.82)'; W5.rr(c, x, y, w, h, 18); c.fill();
      c.lineWidth = 2; c.strokeStyle = border || 'rgba(246,243,234,0.2)'; c.stroke();
    });
  }

  /* ── 草地（同 effects 畫風） ── */
  function grass(c, x0, x1, gy, a, depth) {
    withA(c, a, () => {
      const d = depth || 100;
      const g = c.createLinearGradient(0, gy, 0, gy + d);
      g.addColorStop(0, '#1c4a31'); g.addColorStop(1, '#10291f');
      c.fillStyle = g; c.fillRect(x0, gy, x1 - x0, d);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, gy); c.lineTo(x1, gy); c.stroke();
      c.strokeStyle = 'rgba(120,210,140,0.55)'; c.lineWidth = 2;
      for (let x = x0 + 6; x < x1 - 4; x += 13) {
        const h = 6 + 7 * hash(x * 0.37), lean = (hash(x * 1.3) - 0.5) * 6;
        c.beginPath(); c.moveTo(x, gy); c.lineTo(x + lean, gy - h); c.stroke();
      }
    });
  }

  /* ── 足球（簡化版，與 effects 同款） ── */
  function pentagon(c, cx, cy, R, ang) {
    c.beginPath();
    for (let i = 0; i < 5; i++) { const an = ang + i * TAU / 5; const px = cx + Math.cos(an) * R, py = cy + Math.sin(an) * R; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.closePath();
  }
  function soccer(c, x, y, r, rot, sx, a) {
    if (a <= 0.02) return;
    sx = sx || 1; const sy = 1 + (1 - sx) * 0.5;
    c.save(); c.globalAlpha *= a;
    c.save(); c.globalAlpha *= 0.3; c.fillStyle = INK; c.beginPath(); c.ellipse(x, y + r * sy + 3, r * sx * 0.9, r * 0.14 + 2, 0, 0, TAU); c.fill(); c.restore();
    c.translate(x, y); c.scale(sx, sy);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.save(); c.clip();
    c.fillStyle = '#f3f1ea'; c.fillRect(-r, -r, 2 * r, 2 * r);
    c.rotate(rot);
    c.strokeStyle = 'rgba(60,70,66,0.55)'; c.lineWidth = Math.max(1, r * 0.035);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + i * TAU / 5;
      c.beginPath(); c.moveTo(Math.cos(an) * r * 0.3, Math.sin(an) * r * 0.3); c.lineTo(Math.cos(an) * r * 0.62, Math.sin(an) * r * 0.62); c.stroke();
    }
    c.fillStyle = PATCH; pentagon(c, 0, 0, r * 0.3, -Math.PI / 2); c.fill();
    for (let i = 0; i < 5; i++) { const an = Math.PI / 2 + i * TAU / 5; pentagon(c, Math.cos(an) * r * 0.9, Math.sin(an) * r * 0.9, r * 0.3, an); c.fill(); }
    c.rotate(-rot);
    const g = c.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, -r * 0.2, -r * 0.2, r * 0.95);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(11,26,21,0.5)');
    c.fillStyle = g; c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    c.restore();
    c.strokeStyle = 'rgba(40,52,48,0.9)'; c.lineWidth = Math.max(1.5, r * 0.04); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.restore();
  }

  /* ── 彈簧（水平線圈，有前後線圈的立體感；x0 固定端、x1 拉的那端） ── */
  function springH(c, x0, x1, y, amp, coils, a) {
    if (a <= 0.02) return;
    const lead = 16, xa = x0 - lead * Math.sign(x0 - x1), xb = x1 + lead * Math.sign(x0 - x1);
    const n = coils * 28, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, th = t * coils * TAU;
      pts.push({ x: lerp(xa, xb, t) + Math.cos(th) * 3.5, y: y + Math.sin(th) * amp, front: Math.cos(th) > 0 });
    }
    c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
    /* 引線 */
    c.strokeStyle = '#c9d3d0'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(xa, y); c.moveTo(x1, y); c.lineTo(xb, y); c.stroke();
    /* 後面的線圈（暗） */
    c.strokeStyle = '#6f7f7a'; c.lineWidth = 4;
    c.beginPath();
    for (let i = 1; i <= n; i++) { if (!pts[i].front) { c.moveTo(pts[i - 1].x, pts[i - 1].y); c.lineTo(pts[i].x, pts[i].y); } }
    c.stroke();
    /* 前面的線圈（亮＋高光） */
    c.strokeStyle = '#dfe8e4'; c.lineWidth = 4.5;
    c.beginPath();
    for (let i = 1; i <= n; i++) { if (pts[i].front) { c.moveTo(pts[i - 1].x, pts[i - 1].y); c.lineTo(pts[i].x, pts[i].y); } }
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 1; i <= n; i++) { if (pts[i].front) { c.moveTo(pts[i - 1].x, pts[i - 1].y - 1.5); c.lineTo(pts[i].x, pts[i].y - 1.5); } }
    c.stroke();
    c.restore();
  }

  /* 牆（斜線剖面） */
  function wall(c, x, y0, y1, w, a) {
    withA(c, a, () => {
      const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#8fa39c'); g.addColorStop(1, '#5d6f69');
      c.fillStyle = g; c.fillRect(x, y0, w, y1 - y0);
      c.save(); c.beginPath(); c.rect(x, y0, w, y1 - y0); c.clip();
      c.strokeStyle = 'rgba(11,26,21,0.35)'; c.lineWidth = 2;
      for (let yy = y0 - w; yy < y1 + w; yy += 14) { c.beginPath(); c.moveTo(x, yy + w); c.lineTo(x + w, yy); c.stroke(); }
      c.restore();
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    });
  }

  /* 木桌（上緣 y、前板到 yb） */
  function bench(c, x0, x1, y, yb, a) {
    withA(c, a, () => {
      c.fillStyle = '#8a6040'; c.fillRect(x0, y - 12, x1 - x0, 12);
      c.fillStyle = 'rgba(255,220,170,0.28)'; c.fillRect(x0, y - 12, x1 - x0, 3);
      const g = c.createLinearGradient(0, y, 0, yb); g.addColorStop(0, '#5e3f26'); g.addColorStop(1, '#3d2816');
      c.fillStyle = g; c.fillRect(x0, y, x1 - x0, yb - y);
      c.strokeStyle = 'rgba(255,220,170,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const yy = y + 14 + i * 20; c.beginPath(); c.moveTo(x0, yy); c.bezierCurveTo(x0 + 200, yy - 4, x1 - 300, yy + 5, x1, yy); c.stroke(); }
      c.strokeStyle = '#2a1b0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    });
  }

  /* ── 底部分類列（步驟 1～3） ── */
  function classifyBar(c, s, ka) {
    const n = s.n, u = s.u;
    const fill = ease(seg(u, 5.6, 6.2));
    /* 接觸力 */
    const cA = n === 1 ? fill : 1;
    const cOn = L('接觸力：踢球、拉彈簧', 'Contact: kick, pull spring'), cOff = L('接觸力', 'Contact force');
    P(c, ka * (1 - cA), cOff, 250, 494, DIM, 22);
    P(c, ka * cA, cOn, 250, 494, WHITE, 22);
    /* 超距力 */
    const r0 = n === 1 ? L('超距力', 'Non-contact force') : n === 2 ? L('超距力', 'Non-contact force') : L('超距力：磁力', 'Non-contact: magnet');
    const r1 = n === 1 ? r0 : n === 2 ? L('超距力：磁力', 'Non-contact: magnet') : L('超距力：磁力、地球引力', 'Non-contact: magnet, gravity');
    const c0 = n === 3 ? WHITE : DIM;
    const rA = n === 1 ? 0 : fill;
    P(c, ka * (1 - rA), r0, 710, 494, c0, 22);
    P(c, ka * rA, r1, 710, 494, WHITE, 22);
  }

  /* 標題＋超距力標籤（標題中心 480；有 tag 就整組置中） */
  function titleRow(c, a, str, col, tag, tagA) {
    if (a <= 0.02) return;
    const size = 26, gap = 16;
    const w1 = W5.tw(c, str, size) + 28, w2 = tag ? W5.tw(c, tag, 22) + 28 : 0;
    const total = w1 + (tag ? gap + w2 : 0), x0 = 480 - total / 2;
    P(c, a, str, x0, 64, col, size, 'left');
    if (tag) P(c, a * tagA, tag, x0 + w1 + gap, 64, WHITE, 22, 'left');
  }

  /* ═══════════ 步驟 1：接觸力 ═══════════ */
  const GY1 = 420;
  const PL = { x: 24, y: 96, w: 440, h: 356 }, PR = { x: 496, y: 96, w: 440, h: 356 };
  const RUN_H = 210, RUN_SC = RUN_H / 349, TOE_X = 321 * RUN_SC, TOE_Y = (349 - 322) * RUN_SC, BR1 = 26;
  const TR_H = 240, TR_SC = TR_H / 472, HAND_X = 196 * TR_SC, HAND_Y = 180 * TR_SC;
  const WALL1 = 904, SPY = GY1 - TR_H + HAND_Y;

  function clipPanel(c, P0, fn) { c.save(); W5.rr(c, P0.x + 2, P0.y + 2, P0.w - 4, P0.h - 4, 16); c.clip(); fn(); c.restore(); }

  function draw1(c, s) {
    const u = s.u, k = s.k;
    panel(c, PL.x, PL.y, PL.w, PL.h, k);
    panel(c, PR.x, PR.y, PR.w, PR.h, k);

    /* ── 左：踢球 ── */
    const run = ease(seg(u, 0.3, 2.0)), push = ease(seg(u, 2.0, 2.5));
    const mx = lerp(-220, 70, run) + 14 * push;
    const ballX0 = 70 + TOE_X + BR1;
    const bx = ballX0 + 14 * push, by = GY1 - BR1;
    const sx = 1 - 0.12 * (u >= 2.0 ? Math.min(1, seg(u, 2.0, 2.3)) : 0);
    clipPanel(c, PL, () => {
      grass(c, PL.x, PL.x + PL.w, GY1, k);
      soccer(c, bx + (1 - sx) * BR1, by, BR1, 0.3, sx, k);
      march(c, 'running', mx, GY1, RUN_H, k);
    });
    const cx1 = mx + TOE_X + 2, cy1 = GY1 - TOE_Y - 4;
    const ring1 = ease(seg(u, 2.0, 2.4));
    contactRing(c, ring1 * k, cx1, cy1, 20, Math.sin(Math.PI * seg(u, 2.0, 3.6)));
    forceArrow(c, ease(seg(u, 2.1, 2.5)), cx1 + 6, cy1 - 10, cx1 + 86, cy1 - 52, F_COL, 6, 20);
    T(c, ease(seg(u, 2.1, 2.5)), 'F', cx1 + 104, cy1 - 70, F_COL, 26, 'center', true);
    T(c, ease(seg(u, 2.5, 3.0)), L('腳碰到球', 'Foot touches ball'), 300, 438, WHITE, 22);
    P(c, k, L('踢球', 'Kicking'), PL.x + 22, PL.y + 32, WHITE, 22, 'left');

    /* ── 右：拉彈簧 ── */
    const pull = ease(seg(u, 3.0, 4.8));
    const hx = lerp(700, 640, pull), mxR = hx - HAND_X;
    clipPanel(c, PR, () => {
      grass(c, PR.x, PR.x + PR.w, GY1, k);
      wall(c, WALL1, PR.y, GY1, 30, k);
      springH(c, WALL1, hx + 12, SPY, 15, 11, k);
      march(c, 'touch_ready', mxR, GY1, TR_H, k);
      /* 握把（壓在手上，看起來抓著） */
      withA(c, k, () => {
        c.strokeStyle = '#3d4c46'; c.lineWidth = 7; c.beginPath(); c.ellipse(hx + 4, SPY, 8, 15, 0, 0, TAU); c.stroke();
        c.strokeStyle = '#c9d3d0'; c.lineWidth = 3.5; c.beginPath(); c.ellipse(hx + 4, SPY, 8, 15, 0, 0, TAU); c.stroke();
      });
    });
    const ring2 = ease(seg(u, 3.0, 3.4));
    contactRing(c, ring2 * k, hx + 2, SPY, 22, Math.sin(Math.PI * seg(u, 3.0, 4.8)));
    /* 手拉彈簧的力 F：指向 March（往左），畫在手臂下方（不壓到臉） */
    const fl2 = 24 + 40 * pull;
    forceArrow(c, ease(seg(u, 3.1, 3.5)), hx - 6, SPY + 30, hx - 6 - fl2, SPY + 30, F_COL, 6, 20);
    T(c, ease(seg(u, 3.1, 3.5)), 'F', hx + 26, SPY + 36, F_COL, 26, 'center', true);
    T(c, ease(seg(u, 3.6, 4.1)), L('手碰到彈簧', 'Hand touches spring'), 760, 438, WHITE, 22);
    P(c, k, L('拉彈簧', 'Pulling a spring'), PR.x + 22, PR.y + 32, WHITE, 22, 'left');

    titleRow(c, ease(seg(u, 5.0, 5.6)), L('接觸力：要碰到才有作用', 'Contact force: works only by touching'), WHITE);
    classifyBar(c, s, k);
  }

  /* ═══════════ 步驟 2：磁力不用碰 ═══════════ */
  const TB2 = 382;                         /* 桌面 */
  const MAG_X = 380, MAG_YN = 282, MAG_YS = 360, MAG_ARC = 230;
  const NAIL0 = 566, NAIL1 = MAG_X + 2, NAIL_L = 116, NAIL_Y = 372;
  const N_T0 = 2.9, N_T1 = 3.8;

  function magnet(c, a) {
    withA(c, a, () => {
      const cy = (MAG_YN + MAG_YS) / 2, R = (MAG_YS - MAG_YN) / 2;
      const path = () => { c.beginPath(); c.moveTo(MAG_X, MAG_YN); c.lineTo(MAG_ARC, MAG_YN); c.arc(MAG_ARC, cy, R, -Math.PI / 2, Math.PI / 2, true); c.lineTo(MAG_X, MAG_YS); };
      c.lineCap = 'butt';
      /* 影子 */
      c.save(); c.globalAlpha *= 0.35; c.fillStyle = INK; c.beginPath(); c.ellipse(300, TB2 + 2, 120, 7, 0, 0, TAU); c.fill(); c.restore();
      /* 灰色本體 */
      path(); c.strokeStyle = '#4f5f5a'; c.lineWidth = 42; c.stroke();
      path(); c.strokeStyle = '#8fa39c'; c.lineWidth = 34; c.stroke();
      /* 兩極：N 紅、S 藍 */
      c.save(); c.beginPath(); c.rect(MAG_X - 62, 0, 64, 540); c.clip();
      c.beginPath(); c.moveTo(MAG_X - 62, MAG_YN); c.lineTo(MAG_X, MAG_YN); c.strokeStyle = '#a92f2f'; c.lineWidth = 42; c.stroke();
      c.beginPath(); c.moveTo(MAG_X - 62, MAG_YN); c.lineTo(MAG_X, MAG_YN); c.strokeStyle = '#ff4d4d'; c.lineWidth = 34; c.stroke();
      c.beginPath(); c.moveTo(MAG_X - 62, MAG_YS); c.lineTo(MAG_X, MAG_YS); c.strokeStyle = '#1f3f7a'; c.lineWidth = 42; c.stroke();
      c.beginPath(); c.moveTo(MAG_X - 62, MAG_YS); c.lineTo(MAG_X, MAG_YS); c.strokeStyle = '#3d7bd9'; c.lineWidth = 34; c.stroke();
      c.restore();
      /* 高光 */
      c.beginPath(); c.moveTo(MAG_X - 4, MAG_YN - 12); c.lineTo(MAG_ARC, MAG_YN - 12); c.arc(MAG_ARC, cy, R + 12, -Math.PI / 2, -Math.PI * 0.95, true);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 4; c.stroke();
      c.beginPath(); c.moveTo(MAG_X - 4, MAG_YS - 12); c.lineTo(MAG_ARC, MAG_YS - 12);
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.stroke();
    });
    T(c, a, 'N', MAG_X - 30, MAG_YN, WHITE, 22, 'center', true);
    T(c, a, 'S', MAG_X - 30, MAG_YS, WHITE, 22, 'center', true);
  }

  function nail(c, x, y, a) {          /* x：釘尖（朝左） */
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.3; c.fillStyle = INK; c.beginPath(); c.ellipse(x + NAIL_L / 2, TB2 + 1, NAIL_L / 2, 4, 0, 0, TAU); c.fill(); c.restore();
      const g = c.createLinearGradient(0, y - 5, 0, y + 5);
      g.addColorStop(0, '#e7eeeb'); g.addColorStop(0.45, '#9fb0aa'); g.addColorStop(1, '#55655f');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y - 4.5); c.lineTo(x + NAIL_L - 6, y - 4.5); c.lineTo(x + NAIL_L - 6, y + 4.5); c.lineTo(x + 18, y + 4.5); c.closePath(); c.fill();
      const g2 = c.createLinearGradient(0, y - 11, 0, y + 11);
      g2.addColorStop(0, '#eef3f1'); g2.addColorStop(1, '#5d6f69');
      c.fillStyle = g2; W5.rr(c, x + NAIL_L - 7, y - 10, 7, 20, 2); c.fill();
    });
  }
  function nailX(u) {
    if (u < N_T0) return NAIL0 + (u > 2.3 ? Math.sin((u - 2.3) * 40) * 1.6 * seg(u, 2.3, 2.6) : 0);
    const q = seg(u, N_T0, N_T1);
    return lerp(NAIL0, NAIL1, q * q);
  }

  function fieldLines(c, a, u) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.rect(0, 32, 960, TB2 - 32 - 2); c.clip();
    c.setLineDash([8, 9]); c.lineDashOffset = -Math.min(u, 7) * 18;
    c.lineWidth = 2.2; c.lineCap = 'round';
    [40, 90, 150, 215, 280].forEach((b, i) => {
      c.strokeStyle = 'rgba(246,243,234,' + (0.6 - i * 0.07) + ')';
      c.beginPath(); c.moveTo(MAG_X + 2, MAG_YN);
      c.bezierCurveTo(MAG_X + b * 1.33, MAG_YN - b * 0.32, MAG_X + b * 1.33, MAG_YS + b * 0.12, MAG_X + 2, MAG_YS);
      c.stroke();
    });
    c.restore();
  }

  function draw2(c, s) {
    const u = s.u, k = s.k;
    bench(c, 80, 880, TB2, 462, k);
    fieldLines(c, ease(seg(u, 0.8, 1.6)) * k, u);
    magnet(c, k);

    const nx = nailX(u);
    /* 原本位置的虛線殘影 */
    const moved = seg(u, N_T0, N_T0 + 0.3);
    withA(c, moved, () => {
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2;
      W5.rr(c, NAIL0, NAIL_Y - 10, NAIL_L, 20, 6); c.stroke(); c.restore();
    });
    /* 飛過去的殘影 */
    if (u > N_T0) {
      for (let i = 1; i < 8; i++) {
        const ti = N_T0 + i * 0.13; if (ti > Math.min(u, N_T1) - 0.04) break;
        c.save(); c.globalAlpha *= 0.28; nail(c, nailX(ti), NAIL_Y, 1); c.restore();
      }
    }
    nail(c, nx, NAIL_Y, k);
    /* 吸上去的瞬間 */
    const hit = Math.sin(Math.PI * seg(u, N_T1 - 0.05, N_T1 + 0.5));
    if (hit > 0) W5.glow(c, MAG_X + 4, NAIL_Y, 46, F_COL, 0.5 * hit);

    /* 間隔標示：沒有接觸 */
    const aGap = ease(seg(u, 1.4, 2.0));
    withA(c, aGap, () => {
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
      c.save(); c.setLineDash([4, 5]);
      c.beginPath(); c.moveTo(MAG_X, TB2 + 4); c.lineTo(MAG_X, TB2 + 30); c.moveTo(NAIL0, TB2 + 4); c.lineTo(NAIL0, TB2 + 30); c.stroke(); c.restore();
      W5.arrow(c, MAG_X + 30, TB2 + 22, MAG_X + 2, TB2 + 22, WHITE, 2.5, 11);
      W5.arrow(c, NAIL0 - 30, TB2 + 22, NAIL0 - 2, TB2 + 22, WHITE, 2.5, 11);
      c.beginPath(); c.moveTo(MAG_X + 28, TB2 + 22); c.lineTo(NAIL0 - 28, TB2 + 22); c.stroke();
    });
    T(c, ease(seg(u, 1.6, 2.2)), L('沒有接觸', 'Not touching'), (MAG_X + NAIL0) / 2, TB2 + 52, WHITE, 22);

    /* 磁力 F：一直作用在鐵釘上，指向磁鐵 */
    const aF = ease(seg(u, 2.2, 2.6));
    forceArrow(c, aF, nx + 92, NAIL_Y - 34, nx + 18, NAIL_Y - 34, F_COL, 6, 20);
    T(c, aF, L('磁力', 'Magnetic force'), nx + 110, NAIL_Y - 34, F_COL, 22, 'left');

    T(c, ease(seg(u, 0.8, 1.4)) * (1 - seg(u, N_T0 - 0.3, N_T0)), L('鐵釘', 'Iron nail'), NAIL0 + NAIL_L / 2, NAIL_Y - 70, DIM, 22);
    titleRow(c, ease(seg(u, 4.4, 5.0)), L('磁力：沒有接觸，也有作用', 'Magnetic force: acts without touching'), F_COL, L('超距力', 'Non-contact force'), ease(seg(u, 5.0, 5.5)));
    classifyBar(c, s, k);
  }

  /* ═══════════ 步驟 3：地球引力 ═══════════ */
  const ER = 1500, ECX = 480, SURF = 440, ECY = SURF + ER;
  const APX = 520, AP0 = 222, AR = 17, AP1 = SURF - AR - 1;
  const A_T0 = 2.4, A_T1 = 3.3;
  function surfY(x) { return ECY - Math.sqrt(ER * ER - (x - ECX) * (x - ECX)); }

  function earth(c, a) {
    withA(c, a, () => {
      /* 大氣光暈 */
      const ga = c.createRadialGradient(ECX, ECY, ER - 6, ECX, ECY, ER + 40);
      ga.addColorStop(0, 'rgba(127,200,255,0.45)'); ga.addColorStop(1, 'rgba(127,200,255,0)');
      c.fillStyle = ga; c.beginPath(); c.arc(ECX, ECY, ER + 40, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(ECX, ECY, ER, 0, TAU); c.clip();
      const g = c.createLinearGradient(0, SURF - 80, 0, 540);
      g.addColorStop(0, '#2a78c4'); g.addColorStop(1, '#0f2f5a');
      c.fillStyle = g; c.fillRect(0, SURF - 80, 960, 200);
      /* 陸地 */
      c.fillStyle = '#3f8f52';
      [[60, 40, 150], [300, 30, 230], [620, 46, 140], [860, 34, 170]].forEach(([x, d, w]) => {
        c.beginPath(); c.ellipse(x, surfY(x) + d, w, 30 + d * 0.4, 0.05, 0, TAU); c.fill();
      });
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, SURF - 80, 960, 200);
      /* 地表的草 */
      const gt = c.createLinearGradient(0, SURF - 10, 0, SURF + 26);
      gt.addColorStop(0, 'rgba(95,191,122,0.95)'); gt.addColorStop(1, 'rgba(95,191,122,0)');
      c.fillStyle = gt; c.beginPath(); c.arc(ECX, ECY, ER, 0, TAU); c.arc(ECX, ECY, ER - 26, 0, TAU, true); c.fill();
      c.restore();
      c.strokeStyle = '#8fe0a8'; c.lineWidth = 3; c.beginPath(); c.arc(ECX, ECY, ER, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4); c.stroke();
    });
  }

  function tree(c, a) {
    withA(c, a, () => {
      const tx = 300, by = surfY(tx) + 4;
      const g = c.createLinearGradient(tx - 22, 0, tx + 22, 0);
      g.addColorStop(0, '#4a2f1a'); g.addColorStop(0.5, '#8a5a35'); g.addColorStop(1, '#3d2614');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(tx - 24, by); c.quadraticCurveTo(tx - 14, 300, tx - 16, 190); c.lineTo(tx + 14, 190); c.quadraticCurveTo(tx + 12, 300, tx + 26, by); c.closePath(); c.fill();
      /* 往右的樹枝 */
      c.strokeStyle = '#6b4426'; c.lineCap = 'round'; c.lineWidth = 13;
      c.beginPath(); c.moveTo(tx + 6, 230); c.quadraticCurveTo(410, 196, 560, 196); c.stroke();
      c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(tx + 8, 226); c.quadraticCurveTo(410, 192, 556, 192); c.stroke();
      /* 樹冠 */
      const blobs = [[250, 130, 70], [320, 110, 74], [390, 140, 60], [200, 170, 54], [300, 170, 66], [470, 170, 50], [540, 178, 36]];
      blobs.forEach(([x, y, r], i) => {
        const gg = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        gg.addColorStop(0, '#5fbf7a'); gg.addColorStop(0.6, '#2f7a48'); gg.addColorStop(1, '#1c4a31');
        c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        void i;
      });
      c.fillStyle = 'rgba(11,26,21,0.25)'; c.beginPath(); c.ellipse(380, 205, 170, 14, 0, 0, TAU); c.fill();
    });
  }

  function apple(c, x, y, r, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    W5.ball(c, x, y, r, '#e0453a');
    c.strokeStyle = '#5a3a1e'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - r + 3); c.lineTo(x + 2, y - r - 6); c.stroke();
    c.fillStyle = '#5fbf7a'; c.beginPath(); c.ellipse(x + 8, y - r - 4, 7, 3.5, -0.5, 0, TAU); c.fill();
    c.restore();
  }
  function appleY(u) { const q = seg(u, A_T0, A_T1); return lerp(AP0, AP1, q * q); }

  function draw3(c, s) {
    const u = s.u, k = s.k;
    earth(c, k);
    tree(c, k);
    /* 果柄（掉下前） */
    withA(c, k * (1 - seg(u, A_T0, A_T0 + 0.05)), () => {
      c.strokeStyle = '#5a3a1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(APX, 198); c.lineTo(APX, AP0 - AR); c.stroke();
    });
    /* 頻閃殘影 */
    if (u > A_T0) {
      withA(c, 1, () => {
        c.save(); c.setLineDash([5, 8]); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(APX, AP0); c.lineTo(APX, appleY(u)); c.stroke(); c.restore();
      });
      for (let i = 0; i < 12; i++) {
        const ti = A_T0 + i * 0.15; if (ti > Math.min(u, A_T1) - 0.04) break;
        withA(c, 0.8, () => {
          c.fillStyle = 'rgba(244,114,182,0.16)'; c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2;
          c.beginPath(); c.arc(APX, appleY(ti), AR, 0, TAU); c.fill(); c.stroke();
        });
      }
    }
    const ay = appleY(u);
    apple(c, APX, ay, AR, k);
    const land = Math.sin(Math.PI * seg(u, A_T1 - 0.05, A_T1 + 0.45));
    if (land > 0) W5.glow(c, APX, SURF - 4, 40, WHITE, 0.35 * land);

    /* 落下時：蘋果上的小引力箭頭 */
    const fallA = seg(u, A_T0 - 0.6, A_T0 - 0.2) * (1 - seg(u, A_T1 - 0.1, A_T1 + 0.2));
    forceArrow(c, fallA, APX, ay + AR + 4, APX, ay + AR + 58, G_COL, 5, 18);

    /* 旁邊的大箭頭與說明 */
    const aBig = ease(seg(u, 3.6, 4.2));
    forceArrow(c, aBig, 612, 238, 612, 384, G_COL, 7, 22);
    T(c, aBig, L('地球引力', "Earth's gravity"), 640, 280, G_COL, 24, 'left');
    T(c, ease(seg(u, 4.2, 4.8)), L('沒有東西碰到蘋果', 'Nothing touches the apple'), 640, 340, WHITE, 22, 'left');
    T(c, ease(seg(u, 0.8, 1.4)), L('蘋果', 'Apple'), APX + 30, AP0, DIM, 22, 'left');

    titleRow(c, ease(seg(u, 4.8, 5.4)), L('地球引力：沒有接觸，也有作用', "Earth's gravity: acts without touching"), G_COL, L('超距力', 'Non-contact force'), ease(seg(u, 5.2, 5.6)));
    classifyBar(c, s, k);
  }

  /* ═══════════ 步驟 4：力不是物質 ═══════════ */
  const TB4 = 380, TH_H = 300, BOT_X = 560, MOUTH_Y = 186;
  const A_LEN = 104;
  /* 箭頭尖端路徑：從 March 頭旁 → 瓶口 → 在瓶口彈一下 → 滑過瓶口到右邊 */
  function tipAt(u) {
    const a = seg(u, 1.6, 3.0), b = seg(u, 3.0, 3.5), d = seg(u, 3.5, 4.6);
    if (u < 3.0) {
      const e = ease(a);
      return { x: lerp(318, BOT_X - 4, e), y: lerp(132, MOUTH_Y - 6, e) - Math.sin(Math.PI * e) * 26, ang: lerp(0.18, 0.62, e) };
    }
    if (u < 3.5) {
      const bump = Math.sin(Math.PI * b);
      return { x: BOT_X - 4 + 6 * b, y: MOUTH_Y - 6 + 8 * bump - 2 * b, ang: 0.62 - 0.4 * b };
    }
    const e = ease(d);
    return { x: lerp(BOT_X + 2, 770, e), y: lerp(MOUTH_Y - 8, 150, e) - Math.sin(Math.PI * e) * 22, ang: lerp(0.22, -0.12, e) };
  }

  function scale(c, a, glowA) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.35; c.fillStyle = INK; c.beginPath(); c.ellipse(BOT_X, TB4 - 10, 98, 6, 0, 0, TAU); c.fill(); c.restore();
      const g = c.createLinearGradient(0, 330, 0, TB4 - 12);
      g.addColorStop(0, '#dfe8e4'); g.addColorStop(1, '#7d8f89');
      c.fillStyle = g; W5.rr(c, BOT_X - 92, 334, 184, TB4 - 12 - 334, 10); c.fill();
      c.fillStyle = '#c9d3d0'; W5.rr(c, BOT_X - 80, 324, 160, 11, 4); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(BOT_X - 76, 325, 152, 2);
      c.fillStyle = '#0e2a20'; W5.rr(c, BOT_X - 58, 338, 116, 28, 6); c.fill();
      if (glowA > 0.01) { c.strokeStyle = W5.rgba(M_COL, glowA); c.lineWidth = 2.5; W5.rr(c, BOT_X - 58, 338, 116, 28, 6); c.stroke(); }
    });
  }
  function bottle(c, a, glowA) {
    withA(c, a, () => {
      const x0 = BOT_X - 36, x1 = BOT_X + 36, yb = 324, ys = 246, nk = 13;
      const path = () => {
        c.beginPath();
        c.moveTo(x0 + 12, yb); c.quadraticCurveTo(x0, yb, x0, yb - 12); c.lineTo(x0, ys);
        c.quadraticCurveTo(x0, ys - 24, BOT_X - nk, ys - 38); c.lineTo(BOT_X - nk, MOUTH_Y + 4);
        c.lineTo(BOT_X + nk, MOUTH_Y + 4); c.lineTo(BOT_X + nk, ys - 38);
        c.quadraticCurveTo(x1, ys - 24, x1, ys); c.lineTo(x1, yb - 12); c.quadraticCurveTo(x1, yb, x1 - 12, yb); c.closePath();
      };
      if (glowA > 0.01) { c.save(); c.globalAlpha *= glowA; W5.glow(c, BOT_X, 270, 90, WHITE, 0.25); c.restore(); }
      path(); c.fillStyle = 'rgba(190,235,255,0.13)'; c.fill();
      c.strokeStyle = 'rgba(220,245,255,0.85)'; c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0 + 10, ys + 2); c.lineTo(x0 + 10, yb - 18); c.stroke();
      /* 瓶口 */
      c.fillStyle = 'rgba(11,26,21,0.7)'; c.beginPath(); c.ellipse(BOT_X, MOUTH_Y + 2, nk + 2, 4.5, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(230,248,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.ellipse(BOT_X, MOUTH_Y + 2, nk + 3, 5, 0, 0, TAU); c.stroke();
    });
  }

  function draw4(c, s) {
    const u = s.u, k = s.k;
    /* March 站在實驗桌後（thinking 圖是半身，下半身由桌子擋住） */
    march(c, 'thinking', 40, TB4 + 64, TH_H, k, false);
    bench(c, 0, 960, TB4, 466, k);
    const glowM = ease(seg(u, 5.4, 5.9));
    scale(c, k, glowM);
    T(c, k, '0.25 kg', BOT_X, 352, M_COL, 22, 'center', true);
    const glowV = ease(seg(u, 4.7, 5.2));
    bottle(c, k, glowV);

    /* 力箭頭 F：想裝進瓶子，卻從瓶口滑過 */
    const aA = ease(seg(u, 1.0, 1.5));
    const tp = tipAt(u);
    if (u > 1.6) {
      withA(c, 0.45, () => {
        c.save(); c.setLineDash([5, 8]); c.strokeStyle = W5.rgba(F_COL, 0.8); c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i <= 40; i++) { const tt = lerp(1.6, Math.min(u, 4.6), i / 40), q = tipAt(tt); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }
        c.stroke(); c.restore();
      });
    }
    const tx = tp.x - Math.cos(tp.ang) * A_LEN, ty = tp.y - Math.sin(tp.ang) * A_LEN;
    forceArrow(c, aA, tx, ty, tp.x, tp.y, F_COL, 7, 22);
    T(c, aA, 'F', (tx + tp.x) / 2 + 6, (ty + tp.y) / 2 + 30, F_COL, 26, 'center', true);
    const bump = Math.sin(Math.PI * seg(u, 3.0, 3.5));
    if (bump > 0) W5.glow(c, BOT_X, MOUTH_Y, 40, F_COL, 0.45 * bump);

    P(c, ease(seg(u, 0.6, 1.2)), L('力可以裝進瓶子嗎？', 'Can a force go in a bottle?'), 420, 64, WHITE, 24);
    P(c, ease(seg(u, 4.7, 5.2)), L('沒有體積：裝不進瓶子', 'No volume: it won’t go in'), 760, 96, WHITE, 22);
    P(c, ease(seg(u, 5.4, 5.9)), L('沒有質量：秤的讀數不變', 'No mass: the reading stays'), BOT_X, 424, M_COL, 22);

    /* 最後的結論 */
    const aEnd = ease(seg(u, 6.3, 6.9));
    if (aEnd > 0.02) {
      const str = L('力不是物質', 'Force is not matter'), size = 26, w = W5.tw(c, str, size) + 60, h = 50;
      withA(c, aEnd, () => {
        c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, 480 - w / 2, 494 - h / 2, w, h, 18); c.fill();
        c.lineWidth = 2.5; c.strokeStyle = F_COL; c.stroke();
        W5.label(c, str, 480, 494, F_COL, size);
      });
    }
  }

  W5.register('ftypes', {
    canvas: 'cvs-ftypes',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) draw1(c, s);
      else if (s.n === 2) draw2(c, s);
      else if (s.n === 3) draw3(c, s);
      else draw4(c, s);
    }
  });
})();
