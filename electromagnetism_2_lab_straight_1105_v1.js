/* electromagnetism_2_lab_straight_1105_v1.js — 「動手做：換電流方向、轉著看」實驗台（#straightLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.straight = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 控制鈕由本檔建立在 #straightLabControls，說明字寫進 #straightLabResult。
 *
 * 座標約定（世界座標）：x 向右、y 向上（導線方向）、z 朝向觀看者；水平板子在 y = 0。
 *   板上一點 (x, z) = (r cosθ, r sinθ)。電流向上（+y）時 B = ŷ × r̂ = (sinθ, 0, −cosθ) ＝ θ 遞減
 *   ＝ 從上往下看逆時針；電流向下 → 順時針（簡報第 1 點）。磁場大小 ∝ 1/r：內密外疏、越近越強。
 *   小磁針 N 端沿 B；沒電流時指北（北＝板子後方 −z）。
 *   右手圖：拇指朝上＝電流向上；電流向下時整張圖在畫面內旋轉 180°（仍是右手，不翻轉）。
 * 視角：仰角 e（斜視 24°／俯視 90°／側視 5°）＋水平拖曳繞鉛直軸 360° 轉（yaw）。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan;
  const CHALK = '#f2ecd9', PANEL = 'rgba(12,30,25,0.92)';
  const DEG = Math.PI / 180;

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const wrapPI = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  function font(size) { return `900 ${size}px ${FONT}`; }
  const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
  function textW(ctx, s, size) {
    ctx.save(); ctx.font = font(size);
    let cjk = 0, rest = '';
    for (const ch of String(s)) { if (CJK.test(ch)) cjk++; else rest += ch; }
    const w = Math.max(ctx.measureText(s).width, cjk * size + ctx.measureText(rest).width * 1.15);
    ctx.restore(); return w;
  }
  function fitSize(ctx, s, maxW, size, min) { let z = size; while (z > min && textW(ctx, s, z) > maxW) z -= 1; return z; }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function polyline(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  function txt(ctx, s, x, y, color, a = 1, size = 24, align = 'center') {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, x, y, color, align, size); ctx.restore();
  }
  // 有深色底的小標籤（避免字壓在線上）；xMin／xMax 限制標籤的左右範圍
  function tag(ctx, s, x, y, color, a = 1, size = 24, xMin = 6, xMax = W - 6) {
    if (a <= 0.01) return;
    size = fitSize(ctx, s, xMax - xMin - 24, size, 22);
    const w = textW(ctx, s, size) + 22;
    x = clamp(x, xMin + w / 2, xMax - w / 2);
    y = clamp(y, 64 + size * 0.78, 520 - size * 0.78);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 9); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
  }
  // 全寬的頂端／底端字條（不受 tag 的上下限制）
  function bar(ctx, s, y, color, size = 24) {
    size = fitSize(ctx, s, W - 60, size, 22);
    const w = textW(ctx, s, size) + 30;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, W / 2 - w / 2, y - size * 0.8, w, size * 1.6, 10); ctx.fill(); ctx.stroke();
    label(ctx, s, W / 2, y + 1, color, 'center', size); ctx.restore();
  }

  // ═════════ 立體投影（仰角 e、方位角 yaw；透視距離 D） ═════════
  function cam(cx, cy, e, yaw, s) { return { cx, cy, s, D: 2400, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(yaw), sp: Math.sin(yaw) }; }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f };
  }
  const z1Of = (c, x, z) => x * c.sp + z * c.cp;

  // ═════════ 場景常數 ═════════
  const RINGS = [52, 68, 89, 116, 151, 196, 255];        // 板上的同心圓：內密外疏
  const LAYER_R = [68, 116, 196];                         // 板子上下各一層（淡）：每個高度都有同心圓
  const LAYER_Y = [-125, 165];
  const HALF = 285, WIRE_BOT = -190, WIRE_TOP = 268, RW = 8;
  const NEEDLE_R = 134, NEEDLE_TH = [30, 90, 150, 210, 270, 330].map(d => d * DEG);
  const BAND_TH = 60 * DEG, BAND_R = [64, 120, 232];      // 距離示意：同一條半徑上三個點的 B
  const ARROW_HIGH = [210, 258], ARROW_LOW = [36, 90];    // 電流箭頭在導線上的高度範圍（ARROW_LOW：向下且畫手時）

  // ═════════ 右手圖（素材：右手握拳、拇指朝上；380×355 透明底。只旋轉／縮放／平移，絕不翻轉） ═════════
  const HAND_IMG = new Image();
  const HIMG = {
    ax: 92, ay: 237, k: 0.51, tip: [158, 14],
    top: [214, 151, 141, 136, 132, 130, 128, 128, 128, 129, 130, 131, 131],
    bot: [226, 279, 294, 314, 332, 339, 341, 340, 342, 345, 347, 346, 347]
  };
  const handReady = () => HAND_IMG.complete && HAND_IMG.naturalWidth > 0;
  HAND_IMG.onload = () => { if (S.on && !S.raf) render(); };
  HAND_IMG.src = 'assets/electromagnetism_2/hand_right_thumbup_1105_v1.png';
  function edgeAt(arr, ix) {
    const i = clamp(ix / 10, 0, arr.length - 1), i0 = Math.floor(i), i1 = Math.min(arr.length - 1, i0 + 1);
    return lerp(arr[i0], arr[i1], i - i0);
  }

  // ═════════ 狀態 ═════════
  const VIEWS = { oblique: { e: 24 * DEG, yaw: -25 * DEG }, top: { e: 90 * DEG, yaw: 0 }, side: { e: 5 * DEG, yaw: 0 } };
  const S = {
    cur: 1, view: 'oblique', hand: false,
    t: 0, last: 0, raf: 0, on: false, visible: true,
    cTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    hTw: { from: 0, to: 0, t0: 0, dur: 0.01 },
    eTw: { from: VIEWS.oblique.e, to: VIEWS.oblique.e, t0: 0, dur: 0.01 },
    yawTw: null, yaw: VIEWS.oblique.yaw,
    vel: 0, velT0: 0,
    flow: 0, rph: RINGS.map(() => 0), lph: 0,
    needles: NEEDLE_TH.map(th => ({ th, b: th - Math.PI / 2, v: 0 })),   // 一開始就沿 B（電流向上）
    hintA: 1, dragged: false,
    actions: 0
  };
  const twVal = tw => lerp(tw.from, tw.to, easeIO((S.t - tw.t0) / tw.dur));
  const twDone = tw => S.t - tw.t0 >= tw.dur;
  function startTw(tw, to, dur) { tw.from = twVal(tw); tw.to = to; tw.t0 = S.t; tw.dur = dur; }
  const curNow = () => twVal(S.cTw), eNow = () => twVal(S.eTw);
  function yawNow() { return S.yawTw ? twVal(S.yawTw) : S.yaw; }
  function settleYaw() { if (S.yawTw) { S.yaw = twVal(S.yawTw); S.yawTw = null; } }
  function tweenYaw(to, dur) {
    settleYaw();
    to = to + TAU * Math.round((S.yaw - to) / TAU);
    S.yawTw = { from: S.yaw, to, t0: S.t, dur };
  }
  // 電流方向的「顯示值」：反向時先淡到 0 再換邊（箭頭與手跟著換）
  const curSign = cur => cur > 0.001 ? 1 : cur < -0.001 ? -1 : 0;
  function needleTarget(th) {
    if (S.cur > 0) return th - Math.PI / 2;
    if (S.cur < 0) return th + Math.PI / 2;
    return -Math.PI / 2;                                  // 北方
  }

  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null;

  // ═════════ 繪圖元件 ═════════
  function ringRuns(c, r, y, part) {
    const N = 96, runs = []; let cur = null, prev = null;
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU, x = r * Math.cos(th), z = r * Math.sin(th);
      const zz = z1Of(c, x, z), ok = part === 'all' || (part === 'back' ? zz < 0 : zz >= 0);
      const pt = P(c, x, y, z);
      if (ok) { if (!cur) { cur = []; if (i > 0) cur.push(prev); } cur.push(pt); }
      else if (cur) { cur.push(pt); if (cur.length > 1) runs.push(cur); cur = null; }
      prev = pt;
    }
    if (cur && cur.length > 1) runs.push(cur);
    return runs;
  }
  // o: { part, alpha, width, d(+1/−1), amp, arrowAt:[θ], dotPh(null＝不畫亮點), head }
  function drawRing(c, r, y, o) {
    if (o.alpha <= 0.01) return;
    const part = o.part || 'all';
    ctx.save(); ctx.globalAlpha = o.alpha; ctx.strokeStyle = GREEN; ctx.lineWidth = o.width || 2.6; ctx.lineCap = 'round';
    for (const run of ringRuns(c, r, y, part)) { polyline(ctx, run); ctx.stroke(); }
    ctx.restore();
    const amp = o.amp || 0, d = o.d || 0;
    if (amp <= 0.01 || !d) return;
    const inPart = th => { const zz = z1Of(c, r * Math.cos(th), r * Math.sin(th)); return part === 'all' || (part === 'back' ? zz < 0 : zz >= 0); };
    ctx.save(); ctx.globalAlpha = o.alpha * amp;
    for (const th of (o.arrowAt || [])) {
      if (!inPart(th)) continue;
      const a = P(c, r * Math.cos(th), y, r * Math.sin(th)), b = P(c, r * Math.cos(th - d * 0.04), y, r * Math.sin(th - d * 0.04));
      if (Math.hypot(b.x - a.x, b.y - a.y) < 1.2) continue;      // 側視時環邊緣正對鏡頭，方向看不出來就不畫
      arrowHead(ctx, a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), GREEN, o.head || 11);
    }
    if (o.dotPh !== null && o.dotPh !== undefined) {
      ctx.fillStyle = '#eaffdf'; ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
      for (let k = 0; k < 3; k++) {
        const th = wrapPI(k / 3 * TAU + r * 0.013 - o.dotPh);
        if (!inPart(th)) continue;
        const p = P(c, r * Math.cos(th), y, r * Math.sin(th));
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawWire(c, y0, y1, o) {
    const a = P(c, 0, y0, 0), b = P(c, 0, y1, 0);
    const w = 2 * RW * (a.f + b.f) / 2, al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01 || Math.hypot(b.x - a.x, b.y - a.y) <= 0.5) return;
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'butt';
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = '#a8693f'; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,0.45)'; ctx.lineWidth = w * 0.22;
    ctx.beginPath(); ctx.moveTo(a.x - w * 0.22, a.y); ctx.lineTo(b.x - w * 0.22, b.y); ctx.stroke();
    const amp = Math.abs(o.cur || 0);
    if (amp > 0.01) {
      const up = o.cur > 0, s0 = up ? a : b, s1 = up ? b : a;     // 由電流上游畫到下游
      ctx.globalAlpha = al * amp; ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.lineCap = 'round';
      ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
      ctx.setLineDash([12, 20]); ctx.lineDashOffset = -S.flow;
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  function drawWireCap(c, y, alpha = 1) {
    const p = P(c, 0, y, 0), rx = RW * p.f, ry = RW * p.f * c.se;
    if (ry < 0.5) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#c98a5c'; ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawBoard(c) {
    const pts = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]].map(([x, z]) => P(c, x, 0, z));
    ctx.save();
    const g = ctx.createLinearGradient(0, Math.min(...pts.map(p => p.y)), 0, Math.max(...pts.map(p => p.y)) + 1);
    g.addColorStop(0, 'rgba(85,233,255,0.05)'); g.addColorStop(1, 'rgba(85,233,255,0.13)');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(85,233,255,0.42)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    polyline(ctx, pts); ctx.closePath(); ctx.fill(); ctx.stroke();
    const h = P(c, 0, 0, 0);
    ctx.fillStyle = 'rgba(5,15,12,0.85)'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 13 * h.f, Math.max(0.5, 13 * h.f * c.se), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawNeedle(c, x, z, beta) {
    ctx.save();
    const ring = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * TAU; ring.push(P(c, x + 25 * Math.cos(t), 0, z + 25 * Math.sin(t))); }
    ctx.fillStyle = 'rgba(10,28,23,0.95)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2.5;
    polyline(ctx, ring); ctx.closePath(); ctx.fill(); ctx.stroke();
    const ux = Math.cos(beta), uz = Math.sin(beta), L = 20, w = 6;
    const n = P(c, x + ux * L, 0, z + uz * L), s = P(c, x - ux * L, 0, z - uz * L);
    const l = P(c, x - uz * w, 0, z + ux * w), r = P(c, x + uz * w, 0, z - ux * w);
    ctx.fillStyle = C.poleN; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(l.x, l.y); ctx.lineTo(r.x, r.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.poleS; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(l.x, l.y); ctx.lineTo(r.x, r.y); ctx.closePath(); ctx.fill();
    const o = P(c, x, 0, z); ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(o.x, o.y, 2.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 右手（圖片）＋導線從拳頭上方穿出的那一小段
  function handXf(c, sg, yc) {
    const o = P(c, 0, yc, 0), up = P(c, 0, yc + 1, 0);
    const sc = Math.hypot(up.x - o.x, up.y - o.y) * HIMG.k, rot = sg > 0 ? 0 : Math.PI;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    return { o, sc, rot, pt: (ix, iy) => { const dx = (ix - HIMG.ax) * sc, dy = (iy - HIMG.ay) * sc; return { x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs }; } };
  }
  function drawHand(c, sg, yc, alpha, cur) {
    const X = handXf(c, sg, yc);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(X.o.x, X.o.y); ctx.rotate(X.rot); ctx.scale(X.sc, X.sc);
    ctx.drawImage(HAND_IMG, -HIMG.ax, -HIMG.ay);
    ctx.restore();
    const ix = HIMG.ax, edge = X.pt(ix, sg > 0 ? edgeAt(HIMG.top, ix) : edgeAt(HIMG.bot, ix)), yCut = edge.y + 7;
    const a = P(c, 0, yc, 0), b = P(c, 0, WIRE_TOP, 0), hw = RW * (a.f + b.f) / 2 + 3;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.rect(Math.min(a.x, b.x) - hw, 0, Math.abs(b.x - a.x) + 2 * hw, yCut); ctx.clip();
    drawWire(c, yc, WIRE_TOP, { cur });
    drawWireCap(c, WIRE_TOP);
    ctx.fillStyle = 'rgba(60,30,14,0.35)'; ctx.beginPath(); ctx.ellipse(a.x, yCut - 4, hw, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
    return X.pt(HIMG.tip[0], HIMG.tip[1]);
  }

  // ═════════ 畫一幀 ═════════
  function render() {
    if (!ctx) return;
    clear(ctx);
    const cur = curNow(), e = eNow(), yaw = yawNow();
    const amp = Math.abs(cur), sg = curSign(cur), d = sg || S.cur;
    const topK = seg(e, 30 * DEG, 90 * DEG);
    const c = cam(500, 330, e, yaw, lerp(1, 0.74, topK));
    const topA = seg(e, 62 * DEG, 82 * DEG);              // 俯視程度（顯示 ⊙／⊗）
    const ringO = (i, part, y) => ({ part, alpha: amp * (y ? 0.38 * (1 - topA) : 0.92), width: y ? 2 : 2.7, d, amp: 1,
      arrowAt: y ? [Math.PI * (i % 2 ? 0.3 : 0.75)] : [Math.PI * (i % 2 ? 0.3 : 0.72), Math.PI * (i % 2 ? 1.3 : 1.72)],
      dotPh: y ? null : S.rph[i], head: y ? 9 : 11 });

    // 1. 板子下方那一層＋導線下段
    LAYER_R.forEach((r, i) => drawRing(c, r, LAYER_Y[0], ringO(i, 'all', LAYER_Y[0])));
    drawWire(c, WIRE_BOT, 0, { cur, alpha: 0.55 });
    // 2. 板子＋板上的同心圓＋北方
    drawBoard(c);
    {
      const a = P(c, -232, 0, -150), b = P(c, -232, 0, -250);
      if (Math.hypot(b.x - a.x, b.y - a.y) > 6) {
        ctx.save(); ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        arrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), CHALK, 12); ctx.restore();
      }
    }
    RINGS.forEach((r, i) => drawRing(c, r, 0, ringO(i, 'all', 0)));
    // 距離示意：同一條半徑上，越近 B 越長
    const band = [];
    if (amp > 0.01) {
      const ux = Math.cos(BAND_TH), uz = Math.sin(BAND_TH), bx = Math.sin(BAND_TH) * d, bz = -Math.cos(BAND_TH) * d;
      const p0 = P(c, ux * 30, 0, uz * 30), p1 = P(c, ux * 262, 0, uz * 262);
      ctx.save(); ctx.globalAlpha = amp * 0.8; ctx.strokeStyle = YELLOW; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.restore();
      for (const r of BAND_R) {
        const L = 5200 / r, x = ux * r, z = uz * r;
        const a = P(c, x, 0, z), b = P(c, x + bx * L, 0, z + bz * L);
        ctx.save(); ctx.globalAlpha = amp;
        if (Math.hypot(b.x - a.x, b.y - a.y) > 6) drawArrow3D(ctx, a.x, a.y, b.x, b.y, GREEN, 3 + 12 / Math.sqrt(r / 30), 10 + 30 / Math.sqrt(r));
        ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, TAU); ctx.fill(); ctx.restore();
        band.push({ a, b });
      }
    }
    // 3. 小磁針
    const wob = 1.6 * DEG;
    S.needles.forEach((nd, k) => drawNeedle(c, NEEDLE_R * Math.cos(nd.th), NEEDLE_R * Math.sin(nd.th), nd.b + wob * Math.sin(S.t * 1.9 + k * 1.3)));
    // 4. 上層同心圓（後半）→ 導線上段 → 上層（前半）
    LAYER_R.forEach((r, i) => drawRing(c, r, LAYER_Y[1], ringO(i, 'back', LAYER_Y[1])));
    drawWire(c, 0, WIRE_TOP, { cur });
    drawWireCap(c, WIRE_TOP);
    LAYER_R.forEach((r, i) => drawRing(c, r, LAYER_Y[1], ringO(i, 'front', LAYER_Y[1])));
    // 5. 右手（選配；俯視時看不出握法就淡出）
    const handVis = S.hand ? twVal(S.hTw) * amp * (1 - seg(e, 52 * DEG, 72 * DEG)) : 0;
    let tip = null;
    if (handVis > 0.01 && handReady() && sg) tip = drawHand(c, sg, sg > 0 ? 105 : 150, handVis, cur);
    // 6. 電流箭頭（導線上段）
    const wTop = P(c, 0, WIRE_TOP, 0);
    const AR = sg < 0 && tip ? ARROW_LOW : ARROW_HIGH;   // 電流向下且有手：箭頭移到拳頭下方，避開手
    const ya = sg > 0 ? AR[0] : AR[1], yb = sg > 0 ? AR[1] : AR[0];
    const pa = P(c, 0, ya, 0), pb = P(c, 0, yb, 0);
    if (amp > 0.01 && Math.hypot(pb.x - pa.x, pb.y - pa.y) > 14) {
      ctx.save(); ctx.globalAlpha = amp; drawArrow3D(ctx, pa.x, pa.y, pb.x, pb.y, ORANGE, 9, 16); ctx.restore();
    }
    // 7. 俯視：導線截面 ⊙（電流朝你）／⊗（電流離開你）
    let symbol = null;
    if (topA > 0.01) {
      const r = 19;
      ctx.save(); ctx.globalAlpha = topA;
      ctx.fillStyle = 'rgba(12,30,25,0.95)'; ctx.strokeStyle = ORANGE; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(wTop.x, wTop.y, r, 0, TAU); ctx.fill(); ctx.stroke();
      if (amp > 0.01) {
        const toward = (P(c, 0, 1, 0).d - P(c, 0, 0, 0).d) * sg > 0;
        symbol = toward ? 'dot' : 'cross';
        ctx.globalAlpha = topA * amp; ctx.fillStyle = ORANGE;
        if (toward) { ctx.beginPath(); ctx.arc(wTop.x, wTop.y, r * 0.32, 0, TAU); ctx.fill(); }
        else { const m = r * 0.55; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wTop.x - m, wTop.y - m); ctx.lineTo(wTop.x + m, wTop.y + m); ctx.moveTo(wTop.x + m, wTop.y - m); ctx.lineTo(wTop.x - m, wTop.y + m); ctx.stroke(); }
      }
      ctx.restore();
    }

    // ── 文字（最後畫） ──
    { const b = P(c, -232, 0, -250); tag(ctx, tr('北', 'N'), b.x - 40, b.y - 4, CHALK, 1, 22); }
    if (amp > 0.01 && topA < 0.5) txt(ctx, 'I', (pa.x + pb.x) / 2 + (AR === ARROW_LOW ? 30 : -30), (pa.y + pb.y) / 2, ORANGE, amp * (1 - topA * 2), 30);
    if (band.length === 3) {
      const o = band[2].a, q = band[0].a, dx = o.x - q.x, dy = o.y - q.y, n = Math.hypot(dx, dy) || 1;
      const lx = o.x + dx / n * 30, ly = o.y + dy / n * 30 + 34;
      tag(ctx, tr('B：近強、遠弱', 'B: strong near, weak far'), lx + (dx >= 0 ? 60 : -60), ly, GREEN, amp, 22);
    }
    if (symbol) tag(ctx, symbol === 'dot' ? tr('⊙ 電流朝向你', '⊙ Current toward you') : tr('⊗ 電流離開你', '⊗ Current away from you'), wTop.x - 150, wTop.y - 62, ORANGE, topA * amp, 22);
    if (tip && handVis > 0.3) { const s = tr('拇指＝I、四指＝B', 'Thumb = I, fingers = B'), hw = textW(ctx, s, 22) / 2 + 30;
      tag(ctx, s, Math.max(tip.x, wTop.x + 14) + 26 + hw, tip.y, CHALK, handVis, 22); }   // 標籤放在導線右側，不蓋手也不蓋導線
    if (S.hand && !tip && amp > 0.01 && topA > 0.5) tag(ctx, tr('俯視看不到握法：換斜視看右手', 'From above the hand is hidden: try Angled'), 500, 94, CHALK, 1, 22);

    // 頂端：電流方向與結論；底端：此視角看什麼
    let top, tc;
    if (S.cur > 0) { top = tr('電流向上 ⬆：從上往下看，磁場逆時針 ↺', 'Current up ⬆: seen from above, B circles counterclockwise ↺'); tc = ORANGE; }
    else if (S.cur < 0) { top = tr('電流向下 ⬇：從上往下看，磁場順時針 ↻', 'Current down ⬇: seen from above, B circles clockwise ↻'); tc = ORANGE; }
    else { top = tr('沒電流，沒磁場：小磁針都指向北方', 'No current, no field: every needle points north'); tc = CHALK; }
    bar(ctx, top, 34, tc, 24);
    let msg, mc = GREEN;
    if (!S.cur) { msg = tr('關閉電流：磁力線消失，小磁針回到指北', 'Current off: the field lines vanish and the needles swing back north'); mc = CHALK; }
    else if (S.view === 'top') msg = S.cur > 0 ? tr('俯視 ⊙：磁力線逆時針環繞導線', 'From above ⊙: the field circles counterclockwise')
      : tr('俯視 ⊗：磁力線順時針環繞導線', 'From above ⊗: the field circles clockwise');
    else if (S.view === 'side') msg = tr('側視：一圈圈的磁力線看起來變成橫線', 'From the side: the field circles look like flat lines');
    else { msg = tr('離導線越近，磁力線越密、磁場越強', 'Closer to the wire: denser lines, stronger field'); mc = YELLOW; }
    bar(ctx, msg, 546, mc, 24);
    if (S.hintA > 0.01) txt(ctx, tr('← 拖曳旋轉 →', '← Drag to rotate →'), W / 2, 584, CYAN, S.hintA, 22);
  }

  // ═════════ 動畫迴圈（單一 RAF；離開畫面就停） ═════════
  function stepNeedles(dt) {
    for (const nd of S.needles) {
      const tgt = needleTarget(nd.th);
      let h = dt;
      while (h > 1e-6) {
        const k = Math.min(0.01, h); h -= k;
        const acc = 70 * wrapPI(tgt - nd.b) - 8.5 * nd.v;     // 阻尼彈簧：會甩過頭一點再回來
        nd.v += acc * k; nd.b += nd.v * k;
      }
    }
  }
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const cur = curNow();
    S.flow += dt * 70 * cur;
    RINGS.forEach((r, i) => { S.rph[i] += dt * cur * 9000 / (r * r); });
    stepNeedles(dt);
    if (S.dragged && S.hintA > 0) S.hintA = Math.max(0, S.hintA - dt / 0.6);
    if (S.vel && !(ptr && ptr.mode === 'drag')) {
      S.yaw += S.vel * dt; S.vel *= Math.exp(-dt / 0.11);
      if (S.t - S.velT0 > 0.45 || Math.abs(S.vel) < 0.02) S.vel = 0;
    }
    if (S.yawTw && twDone(S.yawTw)) { S.yaw = S.yawTw.to; S.yawTw = null; }
    render();
    sync();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ═════════ 操作 ═════════
  function setCur(v) {
    if (S.cur === v) return;
    const flip = S.cur && v && S.cur !== v;
    S.cur = v; startTw(S.cTw, v, flip ? 0.6 : 0.4);
  }
  function setView(v) {
    S.view = v; S.vel = 0;
    startTw(S.eTw, VIEWS[v].e, 0.5);
    tweenYaw(VIEWS[v].yaw, 0.5);
  }
  function setHand(on) { S.hand = on; startTw(S.hTw, on ? 1 : 0, 0.35); }
  const ACTIONS = {
    up: () => setCur(1), down: () => setCur(-1), off: () => setCur(0),
    oblique: () => setView('oblique'), top: () => setView('top'), side: () => setView('side'),
    hand: () => setHand(!S.hand)
  };
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++;
    ACTIONS[key]();
    updateUI();
    if (!S.raf) render();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [tr('電流', 'Current'), [['up', tr('向上 ⬆', 'Up ⬆')], ['down', tr('向下 ⬇', 'Down ⬇')], ['off', tr('關閉 ○', 'Off ○')]]],
      [tr('視角', 'View'), [['oblique', tr('斜視', 'Angled')], ['top', tr('俯視', 'From above')], ['side', tr('側視', 'From the side')]]],
      [tr('顯示', 'Show'), [['hand', '']]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, text] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = text;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function updateUI() {
    if (ctrl) {
      ctrl.querySelectorAll('.lab-btn').forEach(b => {
        const k = b.dataset.act;
        let on = null;
        if (k === 'up') on = S.cur > 0;
        else if (k === 'down') on = S.cur < 0;
        else if (k === 'off') on = S.cur === 0;
        else if (VIEWS[k]) on = S.view === k;
        else if (k === 'hand') { on = S.hand; b.textContent = S.hand ? tr('右手：開', 'Right hand: on') : tr('右手：關', 'Right hand: off'); }
        if (on !== null) { b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); }
      });
    }
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', tr('長直導線的磁場立體實驗台；按左右方向鍵旋轉視角', '3D bench: the magnetic field of a straight wire; use the left and right arrow keys to rotate'));
  }
  function resultHTML() {
    let main;
    if (S.cur > 0) main = tr('<strong class="accent-orange">電流向上</strong>：從上往下看，磁場<strong class="accent-green">逆時針</strong>環繞導線；小磁針的 N 極沿著圓的切線排成一圈。',
      '<strong class="accent-orange">Current up</strong>: seen from above, the field circles the wire <strong class="accent-green">counterclockwise</strong>; the compass needles line up along the circle, N end following B.');
    else if (S.cur < 0) main = tr('<strong class="accent-orange">電流向下</strong>：從上往下看，磁場<strong class="accent-green">順時針</strong>環繞導線；小磁針全部轉向反過來。',
      '<strong class="accent-orange">Current down</strong>: seen from above, the field circles the wire <strong class="accent-green">clockwise</strong>; every needle turns the other way.');
    else main = tr('<strong class="accent-yellow">關閉</strong>：沒有電流就沒有磁場，小磁針都回到指向北方。',
      '<strong class="accent-yellow">Off</strong>: no current, no magnetic field, so every needle points north again.');
    let view;
    if (S.view === 'top') view = S.cur > 0 ? tr('俯視時導線截面是 ⊙（電流朝向你）→ 逆時針。', 'From above, the wire shows ⊙ (current toward you), so the field is counterclockwise.')
      : S.cur < 0 ? tr('俯視時導線截面是 ⊗（電流離開你）→ 順時針。', 'From above, the wire shows ⊗ (current away from you), so the field is clockwise.')
      : tr('俯視時只看到導線截面，沒有磁力線。', 'From above you see only the end of the wire and no field lines.');
    else if (S.view === 'side') view = tr('側視時，水平的磁力線圈看起來變成一條條橫線；板子上下每個高度都有。', 'From the side, the flat field circles look like horizontal lines, at every height above and below the board.');
    else view = tr('拖曳畫面可以 360° 轉著看：不管從哪一邊看，磁場都繞著導線。', 'Drag to turn the view all the way around: from any side, the field circles the wire.');
    const rule = tr('右手定則：大拇指指電流 I，四指彎曲方向就是磁場 B；B 與 I 互相垂直。離導線越近，磁力線越密、磁場越強。',
      'Right-hand rule: thumb along the current I, curled fingers give the field B; B is perpendicular to I. Closer to the wire, the lines are denser and the field is stronger.');
    return `${main}<br>${view}<br><span class="accent-cyan">${rule}</span>`;
  }

  // ═════════ 拖曳旋轉（水平為主才接管；垂直滑動交給頁面捲動） ═════════
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), mode: 'pending', v: 0 };
    S.vel = 0;
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (ptr.mode === 'pending') {
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        ptr.mode = 'drag'; ptr.lx = e.clientX; ptr.lt = performance.now();
        try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 不支援就算了 */ }
        cv.classList.add('dragging'); settleYaw(); S.dragged = true;
      } else if (Math.abs(dy) > 8) { ptr = null; return; }
      else return;
    }
    const rect = cv.getBoundingClientRect(), k = 1000 / (rect.width || 1000);
    const now = performance.now(), ddx = (e.clientX - ptr.lx) * k, d = -ddx * 0.0105;
    S.yaw += d;
    const dt = Math.max(0.008, (now - ptr.lt) / 1000);
    ptr.v = lerp(ptr.v, d / dt, 0.5); ptr.lx = e.clientX; ptr.lt = now;
    if (e.cancelable) e.preventDefault();
    if (!S.raf) render();
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.mode === 'drag') {
      cv.classList.remove('dragging');
      try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 已釋放 */ }
      S.vel = performance.now() - ptr.lt > 90 ? 0 : clamp(ptr.v, -6, 6);
      S.velT0 = S.t;
    }
    ptr = null;
  }
  function onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    S.vel = 0;
    tweenYaw(yawNow() + (e.key === 'ArrowLeft' ? 1 : -1) * 15 * DEG, 0.3);
    if (!S.raf) render();
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('straightLabCanvas');
    ctrl = document.getElementById('straightLabControls');
    res = document.getElementById('straightLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.visible = true;
    buildControls(); updateUI();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    render();
    sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (cv) {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('keydown', onKey);
      cv.classList.remove('dragging');
    }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    ptr = null; S.vel = 0;
  }
  function relang() {
    buildControls(); updateUI();
    render();
  }
  function _state() {
    const cur = curNow(), e = eNow();
    const err = S.needles.map(nd => Math.abs(wrapPI(needleTarget(nd.th) - nd.b)) / DEG);
    return {
      cur: S.cur, curShown: +cur.toFixed(3),
      fromAbove: S.cur > 0 ? 'ccw' : S.cur < 0 ? 'cw' : 'none', field: S.cur !== 0,
      topSymbol: S.cur > 0 ? 'dot' : S.cur < 0 ? 'cross' : null,
      view: S.view, elevDeg: +(e / DEG).toFixed(1), yawDeg: +((((yawNow() / DEG) % 360) + 360) % 360).toFixed(1),
      hand: S.hand, handLoaded: handReady(),
      needleDeg: S.needles.map(nd => +((((nd.b / DEG) % 360) + 360) % 360).toFixed(1)),
      needleMaxErrDeg: +Math.max(...err).toFixed(1),
      hintA: +S.hintA.toFixed(2), dragged: S.dragged, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  EmLab.straight = { activate, deactivate, relang, _state };
})();
