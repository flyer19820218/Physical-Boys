/* electromagnetism_2_lab_solenoid_1105_v1.js — 「動手做：改電流、改匝數、轉著看」實驗台（#solenoidLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.solenoid = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 控制鈕由本檔建立在 #solenoidLabControls，說明字寫進 #solenoidLabResult。
 *
 * 座標約定（世界座標，px）：x 向右、y 向上、z 朝向觀看者；螺線管水平放置，軸沿 x，中心在原點，長度 SL 固定。
 *   導線參數 u（0 → N·2π），線圈上的點 (x, R cosθ, R sinθ)，θ = π − u：從底部 → 正面（z = +R）→ 頂部 → 背面。
 *   cur = +1：電流沿 u 遞增＝正面那一段電流「向上」→ 繞 −x 軸 → 內部 B 向左 → 左端 N、右端 S。
 *   cur = −1：正面電流向下 → 內部 B 向右 → 右端 N、左端 S。（簡報第 3 點；課本圖：正面電流向上、左 N 右 S。舊版畫反了，不照抄。）
 *   電池：電流從 + 極流出。cur = +1 時電流由左導線往上進線圈 → 電池 + 極在左。
 *   磁力線：把螺線管看成 60 個等距圓線圈（完全橢圓積分解析式），在「通過軸、正對觀看者」的平面上用 RK4 描線
 *   （磁場對軸旋轉對稱，任何通過軸的平面上磁力線都一樣；轉視角時就畫正對你的那一片，永遠看得清楚）。
 *   形狀不隨匝數、電流改變；強度 ∝ 匝數 × 電池數，用「磁力線條數（疏密）」與右側強度條表示。
 * 視角：仰角 e（斜視 14°／俯視 90°／側視 3°）＋水平拖曳繞鉛直軸 360° 轉（yaw）。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PURPLE = C.purple;
  const POLE_N = C.poleN, POLE_S = C.poleS;
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
    if (a <= 0.01) return null;
    size = fitSize(ctx, s, xMax - xMin - 24, size, 22);
    const w = textW(ctx, s, size) + 22;
    x = clamp(x, xMin + w / 2, xMax - w / 2);
    y = clamp(y, 64 + size * 0.78, 520 - size * 0.78);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 9); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
    return { x0: x - w / 2, x1: x + w / 2, y0: y - size * 0.78, y1: y + size * 0.78 };
  }
  // 頂端／底端字條（寬度限制在左邊的舞台區）
  function bar(ctx, s, y, color, size = 24, cx = W / 2, maxW = W - 60) {
    size = fitSize(ctx, s, maxW, size, 22);
    const w = textW(ctx, s, size) + 30;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, cx - w / 2, y - size * 0.8, w, size * 1.6, 10); ctx.fill(); ctx.stroke();
    label(ctx, s, cx, y + 1, color, 'center', size); ctx.restore();
  }
  function poleBadge(ctx, x, y, isN, a, r = 22) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 26);
  }
  const rgbaN = a => `rgba(255,111,118,${a})`, rgbaS = a => `rgba(114,185,255,${a})`;
  // 凸包（Andrew monotone chain）：管子的外形＝兩端圓環投影點的凸包，任何視角都正確
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }

  // ═════════ 立體投影（仰角 e、方位角 yaw；透視距離 D） ═════════
  function cam(cx, cy, e, yaw, s) {
    const c = { cx, cy, s, D: 2400, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(yaw), sp: Math.sin(yaw) };
    // 通過軸、正對觀看者的平面：徑向單位向量 r̂ = (0, ry, rz)（與視線、與軸都垂直）
    const ny = c.se, nz = c.cp * c.ce, nn = Math.hypot(ny, nz) || 1;
    c.ry = nz / nn; c.rz = -ny / nn;
    return c;
  }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f };
  }
  const PP = (c, x, rho) => P(c, x, rho * c.ry, rho * c.rz);     // 正對平面上的點 (x, ρ)
  const frontOf = (c, y, z) => y * c.se + z * c.cp * c.ce;      // > 0：圓筒上朝向觀看者的那一半

  // ═════════ 場景常數 ═════════
  const SW_X = 130, SW_GAP = 26;                                  // 開關（底部導線右側）
  const SL = 400, SR = 72, LEAD = 120, YB = -SR - LEAD, NU = 40;
  const TX0 = -SL / 2 - 8, TX1 = SL / 2 + 8, TR = SR - 5;
  const CX = 400, CY = 270;
  const NEEDLES = [[-SL / 4, SR + 60], [SL / 4, SR + 60], [0, -SR - 60], [-SL / 2 - 98, 0], [SL / 2 + 98, 0]];
  const NEEDLE_R = 22;
  const CARD = { x: 792, y: 66, w: 194, h: 436 };
  const TURNS = [4, 8, 12];
  const MAGNET_NP = 3;
  const linesFor = s => 1 + Math.ceil(Math.log2(s / 2));          // 每側磁力線條數：s＝匝數×電池（4～36）→ 2～6

  // ═════════ 磁場（60 個等距圓線圈，解析式；長度以 SR 為單位） ═════════
  function ellKE(m) {             // 第一、二類完全橢圓積分（AGM）
    let a = 1, b = Math.sqrt(1 - m), sum = 0.5 * m, pw = 0.5;
    for (let i = 0; i < 24; i++) { const cn = (a - b) / 2, an = (a + b) / 2; b = Math.sqrt(a * b); a = an; pw *= 2; sum += pw * cn * cn; if (cn < 1e-13) break; }
    const K = Math.PI / (2 * a); return [K, K * (1 - sum)];
  }
  function ringB(zeta, rho) {     // 半徑 1 的線圈，電流繞 +ζ 逆時針：回傳 [Bζ, Bρ]（比例常數省略）
    const ap = (1 + rho) * (1 + rho) + zeta * zeta, am = Math.max(1e-6, (1 - rho) * (1 - rho) + zeta * zeta);
    const [K, E] = ellKE(Math.min(4 * rho / ap, 1 - 1e-12)), sq = Math.sqrt(ap);
    const bz = (K + (1 - rho * rho - zeta * zeta) / am * E) / sq;
    const br = rho < 1e-9 ? 0 : zeta / (rho * sq) * (-K + (1 + rho * rho + zeta * zeta) / am * E);
    return [bz, br];
  }
  const NR = 60, RLEN = SL / SR, RXS = [];
  for (let i = 0; i < NR; i++) RXS.push(-RLEN / 2 + RLEN * (i + 0.5) / NR);
  function sheetB(x, y) {         // cur = +1（正面電流向上）：內部 B 向 −x
    const rho = Math.abs(y), sg = y < 0 ? -1 : 1; let bx = 0, by = 0;
    for (const xk of RXS) { const [bz, br] = ringB(x - xk, rho); bx += bz; by += br * sg; }
    return [-bx, -by];
  }
  function unitB(x, y) { const b = sheetB(x, y), m = Math.hypot(b[0], b[1]) || 1; return [b[0] / m, b[1] / m]; }
  function rk4(x, y, h) {
    const k1 = unitB(x, y), k2 = unitB(x + k1[0] * h / 2, y + k1[1] * h / 2), k3 = unitB(x + k2[0] * h / 2, y + k2[1] * h / 2), k4 = unitB(x + k3[0] * h, y + k3[1] * h);
    return [x + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, y + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
  }
  // 一條磁力線：從管內 (0, a) 出發，順著 B（cur = +1）描；繞回起點＝封閉。點列單位 px（平面座標 x, ρ）
  const LINE_CACHE = {};
  function fieldLine(a) {
    const key = a.toFixed(4);
    if (LINE_CACHE[key]) return LINE_CACHE[key];
    const h = 0.03, XB = 560 / SR, YBND = 340 / SR, out = (x, y) => Math.abs(x) > XB || Math.abs(y) > YBND;
    let pts, i0 = 0, closed = false;
    if (a < 1e-6) {               // 軸上那一條：直線
      pts = []; for (let i = 0; i <= 120; i++) pts.push([lerp(XB, -XB, i / 120), 0]); i0 = 60;
    } else {
      const fwd = [[0, a]]; let x = 0, y = a;
      for (let n = 0; n < 4000; n++) {
        const px = x; [x, y] = rk4(x, y, h);
        if (n > 20 && px > 0 && x <= 0 && Math.abs(y) < 1) { fwd.push([0, a]); closed = true; break; }
        fwd.push([x, y]); if (out(x, y)) break;
      }
      pts = fwd;
      if (!closed) {
        const back = []; x = 0; y = a;
        for (let n = 0; n < 4000; n++) { [x, y] = rk4(x, y, -h); back.push([x, y]); if (out(x, y)) break; }
        i0 = back.length; pts = back.reverse().concat(fwd);
      }
    }
    pts = pts.map(([px, py]) => [px * SR, py * SR]);
    const L = { closed, pts, i0, len: [0] };
    let s = 0;
    for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.len.push(s); }
    L.total = s; L.s0 = L.len[i0];
    const ar = [], st = 50 + (Math.round(a * 97) % 3) * 45;      // 相鄰線的箭頭錯開
    if (closed) for (let q = L.s0 + st; q < L.total - 20; q += 150) ar.push(q);
    else { for (let q = L.s0 + st; q < L.total; q += 150) ar.push(q); for (let q = L.s0 + st - 150; q > 0; q -= 150) ar.push(q); }
    L.arrows = ar;
    LINE_CACHE[key] = L;
    return L;
  }
  function pointAt(L, s) {
    s = clamp(s, 0, L.total);
    let lo = 0, hi = L.len.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L.len[m] <= s) lo = m; else hi = m; }
    const a = L.pts[lo], b = L.pts[hi], k = (s - L.len[lo]) / ((L.len[hi] - L.len[lo]) || 1);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), b[0] - a[0], b[1] - a[1]];
  }
  // 每側 np 條：起點高度 a = (i + 0.5) / np × 0.9（以 SR 為單位）；正負兩側＋軸上一條
  function seedsFor(np) { const o = [0]; for (let i = 0; i < np; i++) { const a = (i + 0.5) / np * 0.9; o.push(a, -a); } return o; }
  function lineFor(a) {
    if (a >= 0) return { L: fieldLine(a), sg: 1 };
    return { L: fieldLine(-a), sg: -1 };
  }
  // 空閒時把所有疏密會用到的磁力線先算好（第一次切換匝數／電池時就不會卡一下）
  let warmJob = 0;
  function warmLines() {
    const todo = [];
    for (let np = 2; np <= 6; np++) for (const a of seedsFor(np)) if (a > 0 && !LINE_CACHE[a.toFixed(4)]) todo.push(a);
    if (!todo.length) return;
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 60));
    const run = dl => { warmJob = 0; let n = 0; while (todo.length && (n === 0 || dl.timeRemaining() > 6)) { fieldLine(todo.shift()); n++; } if (todo.length && S.on) warmJob = idle(run); };
    if (!warmJob) warmJob = idle(run);
  }
  // 小磁針位置的 B（cur = +1，平面座標），一次算好
  const NEEDLE_B = NEEDLES.map(([x, r]) => { const b = sheetB(x / SR, r / SR), m = Math.hypot(b[0], b[1]) || 1; return [b[0] / m, b[1] / m]; });

  // ═════════ 右手圖（素材：右手握拳、拇指朝上；380×355 透明底。只旋轉／縮放／平移，絕不翻轉） ═════════
  // cur = +1：整張圖逆時針轉 90°（拇指朝左＝內部 B 向左；指背轉到下方，四指在正面由下往上彎＝正面電流向上）。
  // cur = −1：順時針轉 90°（拇指朝右；四指在正面由上往下彎＝正面電流向下）。兩者都是平面內旋轉，仍是右手。
  const HAND_IMG = new Image();
  const HIMG = { ax: 70, ay: 240, tip: [156, 4], finger: [62, 300], s: 0.78, hx: 50, dx: 18 };
  const handReady = () => HAND_IMG.complete && HAND_IMG.naturalWidth > 0;
  HAND_IMG.onload = () => { if (S.on && !S.raf) render(); };
  HAND_IMG.src = 'assets/electromagnetism_2/hand_right_thumbup_1105_v1.png';
  function handXf(c, sg) {
    const a = P(c, sg * HIMG.hx, 0, 0), o = { x: a.x + sg * HIMG.dx, y: a.y };
    const rot = sg > 0 ? -Math.PI / 2 : Math.PI / 2, sc = HIMG.s * c.s, cs = Math.cos(rot), sn = Math.sin(rot);
    return { o, sc, rot, pt: (ix, iy) => { const dx = (ix - HIMG.ax) * sc, dy = (iy - HIMG.ay) * sc; return { x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs }; } };
  }

  // ═════════ 狀態 ═════════
  const VIEWS = { oblique: { e: 14 * DEG, yaw: 22 * DEG }, top: { e: 90 * DEG, yaw: 0 }, side: { e: 3 * DEG, yaw: 0 } };
  const S = {
    cur: 1, lastDir: 1, turns: 8, bat: 1, view: 'oblique', hand: false, cmp: false,
    note: 'start',
    t: 0, last: 0, raf: 0, on: false, visible: true,
    cTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    nTw: { from: 8, to: 8, t0: 0, dur: 0.01 },
    sTw: { from: 8, to: 8, t0: 0, dur: 0.01 },          // 強度（匝數×電池）補間：強度條
    hTw: { from: 0, to: 0, t0: 0, dur: 0.01 },
    mTw: { from: 0, to: 0, t0: 0, dur: 0.01 },          // 對照磁鐵
    eTw: { from: VIEWS.oblique.e, to: VIEWS.oblique.e, t0: 0, dur: 0.01 },
    yawTw: null, yaw: VIEWS.oblique.yaw,
    vel: 0, velT0: 0,
    np: linesFor(8), npOld: linesFor(8), npT0: -9,      // 磁力線條數（新舊交叉淡入淡出）
    flow: 0, fph: 0,
    needles: NEEDLES.map(() => ({ b: Math.PI, v: 0 })), needlesInit: false,
    hintA: 1, dragged: false,
    actions: 0
  };
  const twVal = tw => lerp(tw.from, tw.to, easeIO((S.t - tw.t0) / tw.dur));
  const twDone = tw => S.t - tw.t0 >= tw.dur;
  function startTw(tw, to, dur) { tw.from = twVal(tw); tw.to = to; tw.t0 = S.t; tw.dur = dur; }
  const curNow = () => twVal(S.cTw), eNow = () => twVal(S.eTw);
  const turnsNow = () => { const tw = S.nTw; return lerp(tw.from, tw.to, clamp((S.t - tw.t0) / tw.dur, 0, 1)); };   // 線性：圈一圈一圈長出來
  function yawNow() { return S.yawTw ? twVal(S.yawTw) : S.yaw; }
  function settleYaw() { if (S.yawTw) { S.yaw = twVal(S.yawTw); S.yawTw = null; } }
  function tweenYaw(to, dur) {
    settleYaw();
    to = to + TAU * Math.round((S.yaw - to) / TAU);
    S.yawTw = { from: S.yaw, to, t0: S.t, dur };
  }
  const curSign = cur => cur > 0.001 ? 1 : cur < -0.001 ? -1 : 0;
  const strengthNow = () => S.cur ? S.turns * S.bat : 0;
  // 目前畫的磁場方向（+1：內部向左）；斷電但開著對照磁鐵時，畫磁鐵的磁場（極性＝上一次的電流方向）
  const fieldDir = () => S.cur || S.lastDir;

  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null;

  // ═════════ 線圈導線（一條連續的路徑：左導線↑ → 線圈 → 右導線↓ → 底部導線（經電池、開關）→ 回左導線） ═════════
  function wirePath(nf) {
    const pts = [], p = SL / Math.max(nf, 0.01);
    for (let i = 0; i <= 10; i++) pts.push({ x: -SL / 2, y: YB + (-SR - YB) * i / 10, z: 0, k: 'lead' });
    const n = Math.max(2, Math.ceil(nf * NU));
    for (let i = 1; i <= n; i++) {
      const u = nf * TAU * i / n, th = Math.PI - u;
      pts.push({ x: -SL / 2 + p * u / TAU, y: SR * Math.cos(th), z: SR * Math.sin(th), k: 'coil' });
    }
    const e = pts[pts.length - 1];
    for (let i = 1; i <= 10; i++) pts.push({ x: lerp(e.x, SL / 2, i / 10), y: lerp(e.y, YB, i / 10), z: lerp(e.z, 0, i / 10), k: 'lead' });
    // 底部導線：右 → 開關右接點 ‖ 開關左接點 → 左（開關那一小段另外畫成閘刀）
    const xs = [SL / 2]; for (let x = SL / 2 - 20; x > SW_X + SW_GAP / 2; x -= 20) xs.push(x); xs.push(SW_X + SW_GAP / 2);
    const xs2 = [SW_X - SW_GAP / 2]; for (let x = SW_X - SW_GAP / 2 - 20; x > -SL / 2; x -= 20) xs2.push(x); xs2.push(-SL / 2);
    xs.slice(1).forEach(x => pts.push({ x, y: YB, z: 0, k: 'base' }));
    xs2.forEach((x, i) => pts.push({ x, y: YB, z: 0, k: 'base', brk: i === 0 }));
    return pts;
  }
  function drawWire(c, pts, part, amp, dir) {
    const proj = pts.map(q => P(c, q.x, q.y, q.z)), cum = [0];
    for (let i = 1; i < proj.length; i++) cum.push(cum[i - 1] + Math.hypot(proj[i].x - proj[i - 1].x, proj[i].y - proj[i - 1].y));
    const isFront = q => q.k === 'coil' ? frontOf(c, q.y, q.z) >= 0 : false;
    const runs = []; let run = null;
    pts.forEach((q, i) => {
      const ok = part === 'front' ? isFront(q) : !isFront(q);
      if (q.brk && run) { runs.push(run); run = null; }                         // 開關的缺口：不連起來
      if (ok) { if (!run) { run = { i0: i > 0 && !q.brk ? i - 1 : i, p: [] }; if (i > 0 && !q.brk) run.p.push(proj[i - 1]); } run.p.push(proj[i]); }
      else if (run) { run.p.push(proj[i]); runs.push(run); run = null; }
    });
    if (run) runs.push(run);
    const w = 8 * c.s;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of runs) if (r.p.length > 1) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; polyline(ctx, r.p); ctx.stroke(); }
    for (const r of runs) if (r.p.length > 1) { ctx.strokeStyle = part === 'back' ? '#8a5a3a' : '#b4744a'; ctx.lineWidth = w; polyline(ctx, r.p); ctx.stroke(); }
    if (part === 'front') for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.4)'; ctx.lineWidth = w * 0.25; ctx.beginPath(); r.p.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    if (amp > 0.01) {
      ctx.globalAlpha = amp * (part === 'back' ? 0.6 : 1); ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
      ctx.setLineDash([12, 20]);
      for (const r of runs) if (r.p.length > 1) { ctx.lineDashOffset = cum[r.i0] - S.flow * dir; polyline(ctx, r.p); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // 正面每一圈最靠近觀看者的那一點畫電流箭頭
  function drawCurArrows(c, nf, dir, amp) {
    if (amp <= 0.05) return;
    const thStar = Math.atan2(c.cp * c.ce, c.se), p = SL / Math.max(nf, 0.01);
    ctx.save(); ctx.globalAlpha = amp;
    for (let k = 0; k < Math.ceil(nf - 0.05); k++) {
      const u = Math.PI - thStar + TAU * k;
      if (u > nf * TAU || u < 0) continue;
      const pt = u2 => { const th = Math.PI - u2; return P(c, -SL / 2 + p * u2 / TAU, SR * Math.cos(th), SR * Math.sin(th)); };
      const a = pt(u), b = pt(u + dir * 0.12);
      if (Math.hypot(b.x - a.x, b.y - a.y) < 1.5) continue;
      arrowHead(ctx, a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), ORANGE, 14);
    }
    ctx.restore();
  }
  // 底部：電池（串聯 n 顆，+ 極朝電流流出的那一邊）與開關
  function drawBattery(c, nBat, dir, on, alpha) {
    if (alpha <= 0.01) return;
    const a0 = P(c, -1, YB, 0), a1 = P(c, 1, YB, 0), ang = Math.atan2(a1.y - a0.y, a1.x - a0.x), ux = Math.hypot(a1.x - a0.x, a1.y - a0.y) / 2;
    const CW = 70, CH = 36;
    ctx.save(); ctx.globalAlpha = alpha;
    for (let i = 0; i < nBat; i++) {
      const xc = (i - (nBat - 1) / 2) * (CW + 6) - 40, p = P(c, xc, YB, 0);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.scale(Math.max(0.05, ux), p.f);
      const g = ctx.createLinearGradient(0, -CH / 2, 0, CH / 2);
      g.addColorStop(0, '#5d7c72'); g.addColorStop(0.45, '#2d4a41'); g.addColorStop(1, '#1b3029');
      ctx.fillStyle = g; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2;
      rrect(ctx, -CW / 2, -CH / 2, CW, CH, 6); ctx.fill(); ctx.stroke();
      // + 極端（橘）與 − 極端（藍）：dir = +1 時 + 在左
      const px = -dir * CW / 2;
      ctx.fillStyle = '#ff8040'; ctx.fillRect(px - (dir > 0 ? 7 : 0), -6, 7, 12);
      ctx.fillStyle = 'rgba(255,128,64,0.35)'; ctx.fillRect(dir > 0 ? -CW / 2 : 0, -CH / 2 + 3, CW / 2, CH - 6);
      ctx.restore();
      const pl = P(c, xc - dir * 15, YB, 0), pr = P(c, xc + dir * 15, YB, 0);
      if (ux > 0.7) { txt(ctx, '+', pl.x, pl.y, '#ffd2b8', alpha, 24); txt(ctx, '−', pr.x, pr.y, '#4dd2ff', alpha, 24); }
    }
    // 開關：左接點為支點，通電時壓平、關閉時翹起
    const sl = P(c, SW_X - SW_GAP / 2, YB, 0), sr = P(c, SW_X + SW_GAP / 2, YB, 0);
    const lift = on ? 0 : 38 * DEG, L = Math.hypot(sr.x - sl.x, sr.y - sl.y) + 6;
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 9 * c.s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sl.x, sl.y); ctx.lineTo(sl.x + Math.cos(ang - lift) * L, sl.y + Math.sin(ang - lift) * L); ctx.stroke();
    ctx.strokeStyle = '#e6d3b0'; ctx.lineWidth = 5 * c.s;
    ctx.beginPath(); ctx.moveTo(sl.x, sl.y); ctx.lineTo(sl.x + Math.cos(ang - lift) * L, sl.y + Math.sin(ang - lift) * L); ctx.stroke();
    ctx.fillStyle = CHALK;
    for (const q of [sl, sr]) { ctx.beginPath(); ctx.arc(q.x, q.y, 4.5 * c.s, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ═════════ 管子（半透明圓筒：兩端圓環的凸包） ═════════
  function ringScreen(c, x, r, n = 48) { const o = []; for (let i = 0; i < n; i++) { const th = i / n * TAU; o.push(P(c, x, r * Math.cos(th), r * Math.sin(th))); } return o; }
  function hullPath(c, x0, x1, r) {
    const h = hull(ringScreen(c, x0, r).concat(ringScreen(c, x1, r)));
    ctx.beginPath(); h.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  }
  function drawTube(c, tint, nLeft) {
    ctx.save();
    hullPath(c, TX0, TX1, TR);
    const top = P(c, 0, TR * c.ry, TR * c.rz), bot = P(c, 0, -TR * c.ry, -TR * c.rz);
    const g = ctx.createLinearGradient(top.x, top.y, bot.x + 0.01, bot.y + 0.01);
    g.addColorStop(0, 'rgba(190,225,235,0.22)'); g.addColorStop(0.45, 'rgba(150,195,210,0.1)'); g.addColorStop(1, 'rgba(110,150,170,0.18)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(242,236,217,0.3)'; ctx.lineWidth = 2; ctx.stroke();
    if (tint > 0.01) {
      hullPath(c, TX0, 0, TR); ctx.fillStyle = nLeft ? rgbaN(0.32 * tint) : rgbaS(0.32 * tint); ctx.fill();
      hullPath(c, 0, TX1, TR); ctx.fillStyle = nLeft ? rgbaS(0.32 * tint) : rgbaN(0.32 * tint); ctx.fill();
    }
    // 靠近觀看者那一端的管口
    const near = P(c, TX0, 0, 0).d > P(c, TX1, 0, 0).d ? TX0 : TX1, R = ringScreen(c, near, TR);
    polyline(ctx, R); ctx.closePath(); ctx.fillStyle = 'rgba(160,205,220,0.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(242,236,217,0.36)'; ctx.stroke();
    ctx.restore();
  }
  // 對照用的長條磁鐵輪廓（畫在正對平面上，與管子同位置）
  function drawMagnetOutline(c, a, nLeft) {
    if (a <= 0.01) return;
    const hb = SR * 0.86, q = (x, r) => PP(c, x, r);
    const quad = (x0, x1) => { const p = [q(x0, hb), q(x1, hb), q(x1, -hb), q(x0, -hb)]; polyline(ctx, p); ctx.closePath(); };
    ctx.save(); ctx.globalAlpha = a;
    quad(-SL / 2, 0); ctx.fillStyle = nLeft ? rgbaN(0.2) : rgbaS(0.2); ctx.fill();
    quad(0, SL / 2); ctx.fillStyle = nLeft ? rgbaS(0.2) : rgbaN(0.2); ctx.fill();
    ctx.setLineDash([10, 7]); ctx.strokeStyle = CHALK; ctx.lineWidth = 3; quad(-SL / 2, SL / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }

  // ═════════ 磁力線 ═════════
  function drawLines(c, seeds, alpha, dir, amp, strength) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 58, CARD.x - 10, 466); ctx.clip();
    ctx.globalAlpha = alpha; ctx.strokeStyle = PURPLE; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lines = seeds.map(lineFor);
    for (const { L, sg } of lines) { polyline(ctx, L.pts.map(([x, r]) => PP(c, x, sg * r))); ctx.stroke(); }
    if (amp > 0.01) {
      ctx.globalAlpha = alpha * amp;
      for (const { L, sg } of lines) {
        for (const qs of L.arrows) {
          const [x, r, dx, dr] = pointAt(L, qs), p = PP(c, x, sg * r), p2 = PP(c, x + dx * dir, sg * (r + dr * dir));
          if (p.y < 66 || p.y > 516 || p.x < 8 || p.x > CARD.x - 16 || Math.hypot(p2.x - p.x, p2.y - p.y) < 0.4) continue;
          arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), GREEN, 11);
        }
      }
      // 流動的小點（速度隨強度）
      ctx.fillStyle = '#f4e3ff'; ctx.shadowColor = PURPLE; ctx.shadowBlur = 8;
      const gap = 56;
      for (const { L, sg } of lines) {
        for (let s0 = ((dir * S.fph) % gap + gap) % gap; s0 < L.total; s0 += gap) {
          const [x, r] = pointAt(L, s0), p = PP(c, x, sg * r);
          ctx.beginPath(); ctx.arc(p.x, p.y, 3.1, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  // 小磁針（畫面角度 ang＝N 端指向）
  function needle2D(x, y, ang, r = NEEDLE_R) {
    ctx.save(); ctx.fillStyle = 'rgba(10,28,23,0.95)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    const L = r * 0.8, w = r * 0.25, ux = Math.cos(ang), uy = Math.sin(ang);
    ctx.fillStyle = POLE_N; ctx.beginPath(); ctx.moveTo(x + ux * L, y + uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = POLE_S; ctx.beginPath(); ctx.moveTo(x - ux * L, y - uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 小磁針的目標角度（畫面座標）：有磁場→沿 B；沒磁場→指北（北＝世界 −z）
  function needleTarget(c, i) {
    const [x, r] = NEEDLES[i], p = PP(c, x, r);
    let q;
    if (S.cur || S.cmp) { const d = fieldDir(), [bx, br] = NEEDLE_B[i]; q = PP(c, x + bx * d * 30, r + br * d * 30); }
    else q = P(c, x, r * c.ry, r * c.rz - 300);
    if (Math.hypot(q.x - p.x, q.y - p.y) < 1e-3) return -Math.PI / 2;
    return Math.atan2(q.y - p.y, q.x - p.x);
  }

  // 右側強度卡
  function drawMeter(sNow, amp) {
    const { x, y, w, h } = CARD;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = 'rgba(85,233,255,0.4)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const t1 = tr('內部', 'Field'), t2 = tr('磁場強度', 'inside');
    txt(ctx, t1, x + w / 2, y + 28, CHALK, 1, fitSize(ctx, t1, w - 20, 24, 22));
    txt(ctx, t2, x + w / 2, y + 58, CHALK, 1, fitSize(ctx, t2, w - 20, 24, 22));
    const bx = x + 26, bw = 50, top = y + 88, bot = y + 276, bh = bot - top, k = clamp(sNow / 36, 0, 1) * amp;
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.08)'; rrect(ctx, bx, top, bw, bh, 8); ctx.fill();
    if (k > 0.002) {
      const hh = bh * k, g = ctx.createLinearGradient(0, bot - hh, 0, bot);
      g.addColorStop(0, '#e2ffd2'); g.addColorStop(1, GREEN);
      ctx.fillStyle = g; ctx.shadowColor = GREEN; ctx.shadowBlur = 12 * k; rrect(ctx, bx, bot - hh, bw, hh, 8); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 2; rrect(ctx, bx, top, bw, bh, 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.setLineDash([4, 5]);           // 刻度：每 ×1（4 圈 1 顆）一格
    for (let v = 4; v < 36; v += 4) { const yy = bot - bh * v / 36; ctx.beginPath(); ctx.moveTo(bx + bw + 2, yy); ctx.lineTo(bx + bw + 10, yy); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
    const rel = S.cur ? (S.turns * S.bat / 4) : 0;
    txt(ctx, '×' + rel, bx + bw + 48, clamp(bot - bh * k, top + 18, bot - 18), YELLOW, 1, 32);
    const l1 = tr(`${S.turns} 圈`, `${S.turns} turns`), l2 = tr(`× ${S.bat} 顆電池`, S.bat > 1 ? `× ${S.bat} batteries` : '× 1 battery');
    txt(ctx, l1, x + w / 2, y + 308, CYAN, 1, fitSize(ctx, l1, w - 18, 24, 22));
    txt(ctx, l2, x + w / 2, y + 340, CYAN, 1, fitSize(ctx, l2, w - 18, 24, 22));
    const l3 = S.cur ? [tr('×1＝4 圈', '×1 = 4 turns'), tr('配 1 顆電池', 'with 1 battery')] : [tr('沒有電流', 'No current'), tr('強度＝0', 'field = 0')];
    l3.forEach((s, i) => txt(ctx, s, x + w / 2, y + 378 + i * 30, CHALK, 1, fitSize(ctx, s, w - 14, 22, 22)));
  }

  // ═════════ 畫一幀 ═════════
  function render() {
    if (!ctx) return;
    clear(ctx);
    const cur = curNow(), e = eNow(), yaw = yawNow(), nf = turnsNow();
    const amp = Math.abs(cur), sg = curSign(cur), dir = sg || fieldDir();
    const topK = seg(e, 30 * DEG, 90 * DEG);
    const c = cam(CX, CY, e, yaw, lerp(1, 0.9, topK));
    const axisK = seg(Math.abs(c.sp) * c.ce, 0.82, 0.96);           // 正對管口看的程度
    const cmpA = twVal(S.mTw), sNow = twVal(S.sTw);
    const bAlpha = Math.max(amp, S.cur ? 0 : cmpA * 0.75);           // 磁力線亮度：斷電時只剩對照磁鐵的
    const nLeft = dir > 0;

    // 1. 底部電路（電池、開關）與背面導線
    const path = wirePath(nf);
    drawWire(c, path, 'back', amp, sg || 1);
    drawBattery(c, S.bat, sg || S.lastDir, S.cur !== 0, 1 - 0.6 * topK);
    // 2. 管子 → 對照磁鐵 → 磁力線（正對平面，深度 0）→ 小磁針
    drawTube(c, cmpA, nLeft);
    drawMagnetOutline(c, cmpA, nLeft);
    const k = easeIO((S.t - S.npT0) / 0.45);
    if (!S.cur) drawLines(c, seedsFor(S.cmp ? MAGNET_NP : S.np), bAlpha, dir, amp || cmpA, sNow);   // 斷電：漸漸消失；開著對照時只剩磁鐵自己的磁場（固定疏密）
    else if (k < 1) { drawLines(c, seedsFor(S.npOld), bAlpha * (1 - k), dir, amp || cmpA, sNow); drawLines(c, seedsFor(S.np), bAlpha * k, dir, amp || cmpA, sNow); }
    else drawLines(c, seedsFor(S.np), bAlpha, dir, amp || cmpA, sNow);
    const wob = 1.5 * DEG;
    S.needles.forEach((nd, i) => { const p = PP(c, NEEDLES[i][0], NEEDLES[i][1]); needle2D(p.x, p.y, nd.b + wob * Math.sin(S.t * 1.9 + i * 1.3)); });
    // 3. 正面導線與電流箭頭
    drawWire(c, path, 'front', amp, sg || 1);
    drawCurArrows(c, nf, sg || 1, amp);
    // 4. 右手（選配；只在大致正面看時畫，俯視或轉到側邊就淡出）
    const handVis = S.hand ? twVal(S.hTw) * amp * (1 - seg(e, 45 * DEG, 65 * DEG)) * seg(c.cp, 0.72, 0.9) : 0;
    let tip = null;
    if (handVis > 0.01 && handReady() && sg) {
      const X = handXf(c, sg);
      ctx.save(); ctx.globalAlpha = handVis; ctx.translate(X.o.x, X.o.y); ctx.rotate(X.rot); ctx.scale(X.sc, X.sc);
      ctx.drawImage(HAND_IMG, -HIMG.ax, -HIMG.ay); ctx.restore();
      tip = X.pt(HIMG.tip[0], HIMG.tip[1]);
      const endX = P(c, sg > 0 ? TX0 - 34 : TX1 + 34, 0, 0).x;
      ctx.save(); ctx.globalAlpha = handVis; drawArrow3D(ctx, tip.x - sg * 6, tip.y, endX, tip.y, GREEN, 8, 18); ctx.restore();
    }
    // 5. 磁極章；正對管口時畫 ⊙／⊗
    const poleA = Math.max(amp, S.cur ? 0 : cmpA) * (1 - axisK);
    if (poleA > 0.01) {
      const pl = P(c, -SL / 2 - 42, 0, 0), pr = P(c, SL / 2 + 42, 0, 0);
      poleBadge(ctx, pl.x, pl.y, nLeft, poleA); poleBadge(ctx, pr.x, pr.y, !nLeft, poleA);
    }
    let symbol = null;
    if (axisK > 0.01) {
      const o = P(c, 0, 0, 0), r = 20;
      ctx.save(); ctx.globalAlpha = axisK; ctx.fillStyle = 'rgba(12,30,25,0.95)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, TAU); ctx.fill(); ctx.stroke();
      if (bAlpha > 0.05) {
        const toward = (P(c, -dir, 0, 0).d - o.d) > 0;      // 內部 B 沿 −x·dir
        symbol = toward ? 'dot' : 'cross';
        ctx.globalAlpha = axisK * bAlpha; ctx.fillStyle = GREEN;
        if (toward) { ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.32, 0, TAU); ctx.fill(); }
        else { const m = r * 0.55; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x - m, o.y - m); ctx.lineTo(o.x + m, o.y + m); ctx.moveTo(o.x + m, o.y - m); ctx.lineTo(o.x - m, o.y + m); ctx.stroke(); }
      }
      ctx.restore();
    }

    // ── 文字（最後畫） ──
    drawMeter(sNow, 1);
    const stageR = CARD.x - 10;
    if (tip && handVis > 0.3) {
      const s = tr('拇指＝內部 B ＝ N 極那一端', 'Thumb = B inside = the N end');
      tag(ctx, s, sg > 0 ? 165 : 600, sg > 0 ? 92 : 500, GREEN, handVis, 22, 6, stageR);
    }
    if (cmpA > 0.3) {
      tag(ctx, tr('長條磁鐵（對照）', 'Bar magnet (compare)'), 540, 96, CHALK, cmpA, 22, 6, stageR);
    }
    if (symbol) tag(ctx, symbol === 'dot' ? tr('⊙ 內部 B 朝向你', '⊙ B inside points at you') : tr('⊗ 內部 B 離開你', '⊗ B inside points away'), CX, CY - SR - 46, GREEN, axisK, 22, 6, stageR);

    let top, tc;
    if (S.cur > 0) { top = tr('正面電流向上 → 拇指朝左 → 左端 N、右端 S', 'Front current up → thumb left → N left, S right'); tc = ORANGE; }
    else if (S.cur < 0) { top = tr('正面電流向下 → 拇指朝右 → 右端 N、左端 S', 'Front current down → thumb right → N right, S left'); tc = ORANGE; }
    else if (S.cmp) { top = tr('斷電：螺線管沒有磁場，長條磁鐵的磁場還在', 'Off: the solenoid loses its field; the bar magnet keeps its own'); tc = CHALK; }
    else { top = tr('關閉電流：沒有磁場，也沒有 N、S 極', 'Current off: no field and no N or S pole'); tc = CHALK; }
    bar(ctx, top, 32, tc, 24, stageR / 2 + 2, stageR - 20);
    const [msg, mc] = S.hand && !tip && amp > 0.01 && handReady() && axisK < 0.5
      ? [tr('右手要從正面看：按「斜視」或「側視」', 'The hand shows from the front: try Angled or Side'), CHALK] : noteMsg(axisK, symbol);
    bar(ctx, msg, 546, mc, 24, W / 2, W - 30);
    if (S.hintA > 0.01) txt(ctx, tr('← 拖曳旋轉 →', '← Drag to rotate →'), W / 2, 584, CYAN, S.hintA, 22);
  }
  function noteMsg(axisK, symbol) {
    if (symbol && axisK > 0.5) return [tr('正對管口看：內部磁力線穿過管口，' + (symbol === 'dot' ? '朝向你' : '離開你'), 'Looking into the tube: the field lines inside run ' + (symbol === 'dot' ? 'toward you' : 'away from you')), GREEN];
    const n = S.note;
    if (!S.cur && (n === 'turnsUp' || n === 'turnsDown' || n === 'batUp' || n === 'batDown')) return [tr('沒通電：先選電流方向，才看得到磁場變化', 'No current: pick a current direction to see the field change'), CHALK];
    switch (n) {
      case 'turnsUp': return [tr('匝數變多：每一圈的磁場在內部疊加，更強', 'More turns: each turn adds its field inside, so it gets stronger'), YELLOW];
      case 'turnsDown': return [tr('匝數變少：疊加的圈數少，內部磁場變弱', 'Fewer turns: fewer fields add up, so it gets weaker'), YELLOW];
      case 'turnsSame': return [tr(`現在是 ${S.turns} 圈：長度不變，圈越多越密`, `${S.turns} turns now: same length, more turns are packed closer`), YELLOW];
      case 'batUp': return [tr('電池變多：電流變大，磁力線更密、磁場更強', 'More batteries: more current, denser lines, a stronger field'), YELLOW];
      case 'batDown': return [tr('電池變少：電流變小，磁力線變疏、磁場變弱', 'Fewer batteries: less current, sparser lines, a weaker field'), YELLOW];
      case 'batSame': return [tr(`現在是 ${S.bat} 顆電池串聯`, S.bat > 1 ? `${S.bat} batteries in series now` : 'One battery now'), YELLOW];
      case 'reverse': return [tr('電流反向：磁力線方向相反，N、S 對調', 'Current reversed: the field flips and N and S swap'), ORANGE];
      case 'off': if (S.cmp) return [tr('長條磁鐵不用通電就有磁場；螺線管要通電才有', 'A bar magnet needs no current; a solenoid needs current for its field'), YELLOW];
        return [tr('關閉電流：磁力線消失，小磁針回到指北', 'Current off: the field lines vanish and the compasses point north'), CHALK];
      case 'top': return [tr('俯視：內部磁力線一樣平行，由 S 指向 N', 'From above: the lines inside are still parallel, S to N'), GREEN];
      case 'side': return [tr('側視：和課本圖一樣，從正面看螺線管', 'Side view: facing the solenoid, like the textbook picture'), GREEN];
      case 'hand': return S.hand ? [tr('右手：四指順著電流彎，大拇指指向 N 極', 'Right hand: curl the fingers along the current; the thumb points to N'), GREEN]
        : [tr('內部磁力線平行、由 S 指向 N；外部由 N 繞回 S', 'Inside: parallel lines from S to N; outside they loop from N back to S'), GREEN];
      case 'magnet': return S.cmp ? (S.cur ? [tr('通電螺線管就像長條磁鐵：磁力線形狀幾乎一樣', 'A solenoid with current is like a bar magnet: almost the same field'), YELLOW]
        : [tr('長條磁鐵不用通電就有磁場；螺線管要通電才有', 'A bar magnet needs no current; a solenoid needs current for its field'), YELLOW])
        : [tr('內部磁力線平行、由 S 指向 N；外部由 N 繞回 S', 'Inside: parallel lines from S to N; outside they loop from N back to S'), GREEN];
      default:
        if (!S.cur && S.cmp) return [tr('長條磁鐵不用通電就有磁場；螺線管要通電才有', 'A bar magnet needs no current; a solenoid needs current for its field'), YELLOW];
        if (!S.cur) return [tr('關閉電流：磁力線消失，小磁針回到指北', 'Current off: the field lines vanish and the compasses point north'), CHALK];
        return [tr('內部磁力線平行、由 S 指向 N；外部由 N 繞回 S', 'Inside: parallel lines from S to N; outside they loop from N back to S'), GREEN];
    }
  }

  // ═════════ 動畫迴圈（單一 RAF；離開畫面就停） ═════════
  function stepNeedles(dt, c) {
    S.needles.forEach((nd, i) => {
      const tgt = needleTarget(c, i);
      if (!S.needlesInit) { nd.b = tgt; nd.v = 0; return; }
      let h = dt;
      while (h > 1e-6) {
        const k = Math.min(0.01, h); h -= k;
        const acc = 70 * wrapPI(tgt - nd.b) - 8.5 * nd.v;
        nd.v += acc * k; nd.b += nd.v * k;
      }
    });
    S.needlesInit = true;
  }
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const cur = curNow(), sNow = twVal(S.sTw);
    S.flow += dt * 60 * (0.7 + 0.3 * S.bat) * Math.abs(cur);
    S.fph += dt * (35 + 2.2 * sNow) * Math.max(Math.abs(cur), S.cur ? 0 : twVal(S.mTw) * 0.5);
    if (S.dragged && S.hintA > 0) S.hintA = Math.max(0, S.hintA - dt / 0.6);
    if (S.vel && !(ptr && ptr.mode === 'drag')) {
      S.yaw += S.vel * dt; S.vel *= Math.exp(-dt / 0.11);
      if (S.t - S.velT0 > 0.45 || Math.abs(S.vel) < 0.02) S.vel = 0;
    }
    if (S.yawTw && twDone(S.yawTw)) { S.yaw = S.yawTw.to; S.yawTw = null; }
    const e = eNow();
    stepNeedles(dt, cam(CX, CY, e, yawNow(), lerp(1, 0.9, seg(e, 30 * DEG, 90 * DEG))));
    render();
    sync();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ═════════ 操作 ═════════
  function setDensity() {
    const np = linesFor(Math.max(4, S.turns * S.bat));
    if (np !== S.np) {
      const k = easeIO((S.t - S.npT0) / 0.45);
      S.npOld = k < 0.5 ? S.npOld : S.np; S.np = np; S.npT0 = S.t;
    }
    startTw(S.sTw, strengthNow(), 0.45);
  }
  function setCur(v) {
    if (S.cur === v) return;
    const flip = S.cur && v && S.cur !== v;
    S.note = flip ? 'reverse' : v ? (S.note === 'off' ? 'start' : S.note) : 'off';
    S.cur = v; if (v) S.lastDir = v;
    startTw(S.cTw, v, flip ? 0.6 : 0.4);
    startTw(S.sTw, strengthNow(), 0.45);
  }
  function setTurns(n) {
    S.note = n > S.turns ? 'turnsUp' : n < S.turns ? 'turnsDown' : 'turnsSame';
    if (n !== S.turns) { S.nTw = { from: turnsNow(), to: n, t0: S.t, dur: 0.5 }; S.turns = n; }
    setDensity();
  }
  function setBat(n) {
    S.note = n > S.bat ? 'batUp' : n < S.bat ? 'batDown' : 'batSame';
    S.bat = n; setDensity();
  }
  function setView(v) {
    S.view = v; S.vel = 0; S.note = v === 'oblique' ? 'start' : v;
    startTw(S.eTw, VIEWS[v].e, 0.5);
    tweenYaw(VIEWS[v].yaw, 0.5);
  }
  function setHand(on) { S.hand = on; S.note = 'hand'; startTw(S.hTw, on ? 1 : 0, 0.35); }
  function setCmp(on) { S.cmp = on; S.note = 'magnet'; startTw(S.mTw, on ? 1 : 0, 0.5); }
  const ACTIONS = {
    up: () => setCur(1), down: () => setCur(-1), off: () => setCur(0),
    t4: () => setTurns(4), t8: () => setTurns(8), t12: () => setTurns(12),
    b1: () => setBat(1), b2: () => setBat(2), b3: () => setBat(3),
    oblique: () => setView('oblique'), top: () => setView('top'), side: () => setView('side'),
    hand: () => setHand(!S.hand), magnet: () => setCmp(!S.cmp)
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
      [tr('電流', 'Current'), [['up', tr('正面向上 ⬆', 'Front up ⬆')], ['down', tr('正面向下 ⬇', 'Front down ⬇')], ['off', tr('關閉 ○', 'Off ○')]]],
      [tr('匝數', 'Turns'), [['t4', tr('少 4 圈', 'Few: 4')], ['t8', tr('中 8 圈', 'Medium: 8')], ['t12', tr('多 12 圈', 'Many: 12')]]],
      [tr('電池', 'Batteries'), [['b1', tr('1 顆', '1')], ['b2', tr('2 顆', '2')], ['b3', tr('3 顆', '3')]]],
      [tr('視角', 'View'), [['oblique', tr('斜視', 'Angled')], ['top', tr('俯視', 'From above')], ['side', tr('側視', 'Side')]]],
      [tr('顯示', 'Show'), [['hand', ''], ['magnet', '']]]
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
        else if (k[0] === 't' && k !== 'top') on = S.turns === +k.slice(1);
        else if (k[0] === 'b') on = S.bat === +k.slice(1);
        else if (VIEWS[k]) on = S.view === k;
        else if (k === 'hand') { on = S.hand; b.textContent = S.hand ? tr('右手：開', 'Right hand: on') : tr('右手：關', 'Right hand: off'); }
        else if (k === 'magnet') { on = S.cmp; b.textContent = S.cmp ? tr('對照磁鐵：開', 'Bar magnet: on') : tr('對照磁鐵：關', 'Bar magnet: off'); }
        if (on !== null) { b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); }
      });
    }
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', tr('螺線管磁場的立體實驗台；按左右方向鍵旋轉視角', '3D bench: the magnetic field of a solenoid; use the left and right arrow keys to rotate'));
  }
  function resultHTML() {
    let main;
    if (S.cur > 0) main = tr('<strong class="accent-orange">正面電流向上</strong> → 右手四指順著電流彎，<strong class="accent-green">拇指朝左</strong> → <strong class="accent-red">左端 N</strong>、<strong class="accent-blue">右端 S</strong>。',
      '<strong class="accent-orange">Front current up</strong> → curl your right-hand fingers along the current, <strong class="accent-green">thumb points left</strong> → <strong class="accent-red">N on the left</strong>, <strong class="accent-blue">S on the right</strong>.');
    else if (S.cur < 0) main = tr('<strong class="accent-orange">正面電流向下</strong> → 右手四指順著電流彎，<strong class="accent-green">拇指朝右</strong> → <strong class="accent-red">右端 N</strong>、<strong class="accent-blue">左端 S</strong>：電流反向，N、S 對調。',
      '<strong class="accent-orange">Front current down</strong> → curl your right-hand fingers along the current, <strong class="accent-green">thumb points right</strong> → <strong class="accent-red">N on the right</strong>, <strong class="accent-blue">S on the left</strong>: reversing the current swaps N and S.');
    else main = tr('<strong class="accent-yellow">關閉</strong>：沒有電流就沒有磁場，螺線管沒有 N、S 極，小磁針回到指向北方。',
      '<strong class="accent-yellow">Off</strong>: no current, no magnetic field, so the solenoid has no N or S pole and the compasses point north again.');
    const rel = S.turns * S.bat / 4;
    const str = S.cur
      ? tr(`<strong class="accent-cyan">${S.turns} 圈 × ${S.bat} 顆電池</strong>：內部磁場是 4 圈 1 顆時的 <span class="nowrap"><strong class="accent-yellow">×${rel}</strong></span>。匝數越多（每一圈的磁場在內部疊加）、電流越大（電池串聯越多），磁力線越密、磁場越強。`,
        `<strong class="accent-cyan">${S.turns} turns × ${S.bat} ${S.bat > 1 ? 'batteries' : 'battery'}</strong>: the field inside is <span class="nowrap"><strong class="accent-yellow">×${rel}</strong></span> that of 4 turns with 1 battery. More turns (each turn's field adds up inside) and more current (more batteries in series) mean denser lines and a stronger field.`)
      : tr(`現在是 ${S.turns} 圈、${S.bat} 顆電池，但開關打開、沒有電流，所以磁場強度是 0。`, `${S.turns} turns and ${S.bat} ${S.bat > 1 ? 'batteries' : 'battery'}, but the switch is open and no current flows, so the field is 0.`);
    let extra;
    if (S.cmp) extra = S.cur ? tr('對照：通電螺線管就像一根長條磁鐵，磁力線形狀幾乎一樣；不同的是，螺線管可以用電流控制磁極與強弱。',
      'Compare: a solenoid with current acts like a bar magnet with almost the same field; the difference is that current controls its poles and strength.')
      : tr('對照：斷電後螺線管的磁場消失，長條磁鐵的磁場一直都在。', 'Compare: once the current stops the solenoid loses its field, but the bar magnet keeps its own.');
    else extra = tr('磁力線：內部平行、由 S 指向 N；外部由 N 繞回 S，連成封閉曲線。拖曳畫面可以 360° 轉著看。',
      'Field lines: parallel inside, from S to N; outside they loop from N back to S, forming closed curves. Drag to turn the view all the way around.');
    return `${main}<br>${str}<br><span class="accent-cyan">${extra}</span>`;
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
    cv = document.getElementById('solenoidLabCanvas');
    ctrl = document.getElementById('solenoidLabControls');
    res = document.getElementById('solenoidLabResult');
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
    warmLines();
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
    const cur = curNow(), e = eNow(), c = cam(CX, CY, e, yawNow(), 1);
    const err = S.needles.map((nd, i) => Math.abs(wrapPI(needleTarget(c, i) - nd.b)) / DEG);
    const d = fieldDir();
    return {
      cur: S.cur, curShown: +cur.toFixed(3), lastDir: S.lastDir,
      frontCurrent: S.cur > 0 ? 'up' : S.cur < 0 ? 'down' : 'off',
      bInside: S.cur ? (S.cur > 0 ? 'left' : 'right') : null,
      leftPole: S.cur ? (S.cur > 0 ? 'N' : 'S') : null, rightPole: S.cur ? (S.cur > 0 ? 'S' : 'N') : null,
      turns: S.turns, turnsShown: +turnsNow().toFixed(2), bat: S.bat,
      strength: strengthNow(), strengthShown: +twVal(S.sTw).toFixed(2), rel: S.cur ? S.turns * S.bat / 4 : 0,
      linesPerSide: S.cur ? S.np : S.cmp ? MAGNET_NP : 0, linesTotal: S.cur ? 2 * S.np + 1 : S.cmp ? 2 * MAGNET_NP + 1 : 0,
      batteryPlus: (S.cur || S.lastDir) > 0 ? 'left' : 'right',
      view: S.view, elevDeg: +(e / DEG).toFixed(1), yawDeg: +((((yawNow() / DEG) % 360) + 360) % 360).toFixed(1),
      hand: S.hand, handLoaded: handReady(), handRotDeg: S.cur ? (S.cur > 0 ? -90 : 90) : null,
      compare: S.cmp, magnetLeftPole: S.cmp ? (d > 0 ? 'N' : 'S') : null,
      needleDeg: S.needles.map(nd => +((((nd.b / DEG) % 360) + 360) % 360).toFixed(1)),
      needleMaxErrDeg: +Math.max(...err).toFixed(1),
      note: S.note, hintA: +S.hintA.toFixed(2), dragged: S.dragged, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  EmLab.solenoid = { activate, deactivate, relang, _state };
})();
