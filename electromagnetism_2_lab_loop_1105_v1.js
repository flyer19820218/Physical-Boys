/* electromagnetism_2_lab_loop_1105_v1.js — 「動手做：把直導線彎成圓圈」實驗台（#loopLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.loop = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 控制鈕由本檔建立在 #loopLabControls，說明字寫進 #loopLabResult。
 *
 * 座標約定（世界座標）：x 向右、y 向上、z 朝向觀看者；導線躺在水平面 y = 0，彎好的圓心在原點。
 *   導線以弧長 s ∈ [−L/2, L/2] 參數化，曲率 k / R（k：0 直線 → 1 圓）。前緣 s = 0 永遠在 (0, 0, R)。
 *   cur = +1：電流沿 s 遞增（前緣向 +x）＝彎好後「從上往下看逆時針」→ 圓心 B 向上（+y）→ 上方 N。
 *   cur = −1：反過來，俯視順時針 → 圓心 B 向下 → 下方 N。（簡報第 2 點）
 *   每一小段導線（方向 u）的環形磁場：B = u × r̂。取 n = ŷ × u（指向圈內），
 *   環上 φ = 0 為圈內側，該處 B = cur·ŷ；B 沿 φ 遞增方向（cur = +1）。
 *   圓心（原點）的磁場強度以 Biot–Savart 數值積分（直導線→圓線圈 101 格）預先算好，畫成強度條。
 * 視角：仰角 e（斜視 22°／俯視 90°／側視 5°）＋水平拖曳繞鉛直軸 360° 轉（yaw）。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink;
  const POLE_N = C.poleN, POLE_S = C.poleS;
  const CHALK = '#f2ecd9', PANEL = 'rgba(12,30,25,0.92)';
  const DEG = Math.PI / 180;

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  function font(size) { return `900 ${size}px ${FONT}`; }
  // 保守字寬：中文每字以字級計，其餘字元實測後再留 15% 餘裕
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
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 9); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
  }
  function poleBadge(ctx, x, y, isN, a, r = 21) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 26);
  }

  // ═════════ 立體投影（仰角 e、方位角 yaw；透視距離 D） ═════════
  function cam(cx, cy, e, yaw, s) { return { cx, cy, s, D: 2400, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(yaw), sp: Math.sin(yaw) }; }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f };
  }

  // ═════════ 導線幾何（k：0 直線 → 1 圓；後方留一小缺口接電源） ═════════
  const R = 120, RING_R = 34, NRING = 10, GAP = 0.035, LW = TAU * R * (1 - GAP);
  function wireAt(k, s) {
    const kap = k / R;
    if (kap < 1e-6) return { x: s, y: 0, z: R, ux: 1, uz: 0 };
    return { x: Math.sin(kap * s) / kap, y: 0, z: R - (1 - Math.cos(kap * s)) / kap, ux: Math.cos(kap * s), uz: -Math.sin(kap * s) };
  }
  const RING_S = []; for (let i = 0; i < NRING; i++) RING_S.push(-LW / 2 + LW * (i + 0.5) / NRING);

  // 原點（將來的圓心）的磁場 By：cur = +1，彎曲程度 k 由 0 到 1 共 101 格
  const STR = (function () {
    const out = [], n = 400;
    for (let j = 0; j <= 100; j++) {
      let b = 0;
      for (let i = 0; i < n; i++) {
        const q = wireAt(j / 100, -LW / 2 + LW * (i + 0.5) / n), rx = -q.x, rz = -q.z, d = Math.hypot(rx, rz);
        b += (q.uz * rx - q.ux * rz) / (d * d * d);
      }
      out.push(b);
    }
    const top = out[100];
    return out.map(b => b / top);
  })();
  function strength(k) { const u = clamp(k, 0, 1) * 100, i = Math.min(99, Math.floor(u)); return lerp(STR[i], STR[i + 1], u - i); }
  const ratioAt = k => strength(k) / STR[0];

  // ═════════ 狀態 ═════════
  const VIEWS = { oblique: { e: 22 * DEG, yaw: -30 * DEG }, top: { e: 90 * DEG, yaw: 0 }, side: { e: 5 * DEG, yaw: 0 } };
  const S = {
    step: 0, cur: 1, view: 'oblique',
    t: 0, last: 0, raf: 0, on: false, visible: true,
    kTw: { from: 0, to: 0, t0: 0, dur: 0.01 },
    cTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    eTw: { from: VIEWS.oblique.e, to: VIEWS.oblique.e, t0: 0, dur: 0.01 },
    yawTw: null, yaw: VIEWS.oblique.yaw,
    vel: 0, velT0: 0,
    flow: 0, ph: 0,                 // 電流點與磁場環上亮點的相位（跟著電流方向累積）
    hintA: 1, dragged: false,
    actions: 0                      // 按鈕實際處理的次數（測試用：確認沒有重複綁定）
  };
  const twVal = tw => lerp(tw.from, tw.to, easeIO((S.t - tw.t0) / tw.dur));
  const twDone = tw => S.t - tw.t0 >= tw.dur;
  function startTw(tw, to, dur) { tw.from = twVal(tw); tw.to = to; tw.t0 = S.t; tw.dur = dur; }
  const kNow = () => twVal(S.kTw), curNow = () => twVal(S.cTw), eNow = () => twVal(S.eTw);
  function yawNow() { return S.yawTw ? twVal(S.yawTw) : S.yaw; }
  function settleYaw() { if (S.yawTw) { S.yaw = twVal(S.yawTw); S.yawTw = null; } }
  function tweenYaw(to, dur) {
    settleYaw();
    to = to + TAU * Math.round((S.yaw - to) / TAU);          // 走最短的那一邊
    S.yawTw = { from: S.yaw, to, t0: S.t, dur };
  }

  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null;

  // ═════════ 繪圖 ═════════
  // 一小段導線的磁場環：中心 q、圈內方向 n、半徑 r；回傳 φ 處的世界座標
  function ringPt(q, r, ph) {
    const nx = q.uz, nz = -q.ux, c = Math.cos(ph), s = Math.sin(ph);
    return { x: q.x + r * c * nx, y: r * s, z: q.z + r * c * nz };
  }
  // half：'back'（比環中心遠）| 'front'
  function drawRing(c, q, r, o, half) {
    const N = 44, d0 = P(c, q.x, q.y, q.z).d, want = p => half === 'front' ? p.d >= d0 : p.d < d0;
    const proj = []; for (let i = 0; i <= N; i++) proj.push(P(c, ...Object.values(ringPt(q, r, i / N * TAU))));
    ctx.save(); ctx.strokeStyle = GREEN; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.globalAlpha = 0.85;
    let run = [];
    const flush = () => { if (run.length > 1) { polyline(ctx, run); ctx.stroke(); } run = []; };
    proj.forEach((p, i) => { if (want(p)) { if (!run.length && i > 0) run.push(proj[i - 1]); run.push(p); } else if (run.length) { run.push(p); flush(); } });
    flush();
    // 箭頭：圈內側（φ = 0）與圈外側（φ = π）
    const sg = o.cur >= 0 ? 1 : -1, aA = Math.abs(o.cur);
    for (const [ph, col, sz] of [[0, o.innerCol, o.innerSize], [Math.PI, GREEN, 11]]) {
      const a = P(c, ...Object.values(ringPt(q, r, ph))), b = P(c, ...Object.values(ringPt(q, r, ph + sg * 0.15)));
      if (!want(a) || Math.hypot(b.x - a.x, b.y - a.y) < 2.5) continue;   // 環側對著鏡頭時箭頭方向看不出來，就不畫
      ctx.globalAlpha = aA; arrowHead(ctx, a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), col, sz);
    }
    // 環上流動的亮點（磁場環緩緩轉動）
    ctx.globalAlpha = 0.95; ctx.fillStyle = '#eaffdf'; ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
    for (let j = 0; j < 3; j++) {
      const p = P(c, ...Object.values(ringPt(q, r, S.ph + j * TAU / 3)));
      if (!want(p)) continue;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // 圈內側的 B 小箭頭（黃）：彎起來之後一起指向同一邊
  function innerTick(c, q, a, cur) {
    if (a <= 0.01) return;
    const base = ringPt(q, RING_R, 0), sg = cur >= 0 ? 1 : -1;
    const p1 = P(c, base.x, -sg * 12, base.z), p2 = P(c, base.x, sg * 22, base.z);
    if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 8) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = YELLOW; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    arrowHead(ctx, p2.x, p2.y, Math.atan2(p2.y - p1.y, p2.x - p1.x), YELLOW, 10);
    ctx.restore();
  }
  // 導線：part 'back'（depth < 0）| 'front'
  function drawWire(c, k, cur, part) {
    const n = 160, pts = [];
    for (let i = 0; i <= n; i++) { const q = wireAt(k, -LW / 2 + LW * i / n); pts.push(Object.assign(P(c, q.x, q.y, q.z), { q })); }
    const ok = p => part === 'front' ? p.d >= 0 : p.d < 0;
    const runs = []; let run = null;
    pts.forEach((p, i) => {
      if (ok(p)) { if (!run) { run = []; if (i > 0) run.push(pts[i - 1]); } run.push(p); }
      else if (run) { run.push(p); runs.push(run); run = null; }
    });
    if (run) runs.push(run);
    if (!runs.length) return;
    const w = 9 * c.s;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of runs) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; polyline(ctx, r); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = '#b4744a'; ctx.lineWidth = w; polyline(ctx, r); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.4)'; ctx.lineWidth = w * 0.25; ctx.beginPath(); r.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    // 電流小點（橘）：沿電流方向流動
    ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
    ctx.setLineDash([12, 20]); ctx.lineDashOffset = -S.flow;
    for (const r of runs) { polyline(ctx, r); ctx.stroke(); }
    ctx.setLineDash([]); ctx.shadowBlur = 0;
    // 電流箭頭
    const sg = cur >= 0 ? 1 : -1;
    ctx.globalAlpha = Math.abs(cur);
    for (const fr of [0.14, 0.38, 0.62, 0.86]) {
      const q = wireAt(k, -LW / 2 + LW * fr), p = P(c, q.x, q.y, q.z);
      if (!ok(p)) continue;
      const p2 = P(c, q.x + q.ux * sg * 6, q.y, q.z + q.uz * sg * 6);
      if (Math.hypot(p2.x - p.x, p2.y - p.y) < 0.5) continue;
      arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), ORANGE, 16);
    }
    ctx.restore();
  }
  // 原點：黃色十字（量磁場的位置）＋ 綠色 B 箭頭（粗細隨強度）
  function drawCenter(c, k, cur) {
    const o = P(c, 0, 0, 0), str = strength(k), sg = cur >= 0 ? 1 : -1, aA = Math.abs(cur);
    const u1 = P(c, 0, 1, 0), unit = Math.max(1e-3, Math.hypot(u1.x - o.x, u1.y - o.y));   // 鉛直 1 單位在畫面上的長度
    const len = Math.min(26 + 92 * str, 195 / unit - 34), wd = 3 + 9 * Math.pow(str, 1.3), hd = 10 + 12 * str;   // N／S 圓章保持在 y 90～480
    const a = P(c, 0, -sg * len, 0), b = P(c, 0, sg * len, 0);
    const big = Math.hypot(b.x - a.x, b.y - a.y) > 30;
    // 黃十字
    ctx.save(); ctx.strokeStyle = YELLOW; ctx.lineWidth = 3; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(o.x - 10, o.y); ctx.lineTo(o.x + 10, o.y); ctx.moveTo(o.x, o.y - 10); ctx.lineTo(o.x, o.y + 10); ctx.stroke();
    ctx.restore();
    const res = { big, a, b, len, o };
    if (aA < 0.02) return res;
    ctx.save(); ctx.globalAlpha = aA;
    if (big) drawArrow3D(ctx, a.x, a.y, b.x, b.y, GREEN, wd, hd);
    else {                         // 俯視：B 垂直畫面 → ⊙（朝向你）／⊗（背向你）
      const toward = (P(c, 0, 1, 0).d - P(c, 0, 0, 0).d) * sg > 0;   // B 的方向是否朝向觀看者
      const r = 11 + 9 * str;
      ctx.strokeStyle = GREEN; ctx.fillStyle = GREEN; ctx.lineWidth = 3 + 2 * str; ctx.shadowColor = GREEN; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, TAU); ctx.stroke();
      if (toward) { ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.3, 0, TAU); ctx.fill(); }
      else { const m = r * 0.55; ctx.beginPath(); ctx.moveTo(o.x - m, o.y - m); ctx.lineTo(o.x + m, o.y + m); ctx.moveTo(o.x + m, o.y - m); ctx.lineTo(o.x - m, o.y + m); ctx.stroke(); }
      res.toward = toward;
    }
    ctx.restore();
    return res;
  }

  // 右側強度卡
  const CARD = { x: 785, y: 66, w: 200, h: 430 };
  function drawMeter(k) {
    const { x, y, w, h } = CARD, str = strength(k);
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = 'rgba(85,233,255,0.4)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const t1 = tr('圓心', 'Field at'), t2 = tr('磁場強度', 'the center');
    txt(ctx, t1, x + w / 2, y + 30, CHALK, 1, fitSize(ctx, t1, w - 20, 24, 22));
    txt(ctx, t2, x + w / 2, y + 60, CHALK, 1, fitSize(ctx, t2, w - 20, 24, 22));
    const bx = x + 22, bw = 46, top = y + 100, bot = y + 330, bh = bot - top;
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.08)'; rrect(ctx, bx, top, bw, bh, 8); ctx.fill();
    const hh = bh * str, g = ctx.createLinearGradient(0, bot - hh, 0, bot);
    g.addColorStop(0, '#e2ffd2'); g.addColorStop(1, GREEN);
    ctx.fillStyle = g; ctx.shadowColor = GREEN; ctx.shadowBlur = 10 * str; rrect(ctx, bx, bot - hh, bw, hh, 8); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 2; rrect(ctx, bx, top, bw, bh, 8); ctx.stroke();
    // 刻度：直導線、圓線圈
    ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(242,236,217,0.7)';
    for (const v of [STR[0], 1]) { const yy = bot - bh * v; ctx.beginPath(); ctx.moveTo(bx - 4, yy); ctx.lineTo(bx + bw + 8, yy); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
    const lx = bx + bw + 14, lw = x + w - 8 - lx;
    const s1 = tr('圓線圈', 'Loop'), s0 = tr('直導線', 'Straight');
    txt(ctx, s1, lx, top + 2, k > 0.97 ? YELLOW : CHALK, 1, fitSize(ctx, s1, lw, 22, 22), 'left');
    txt(ctx, s0, lx, bot - bh * STR[0], k < 0.03 ? YELLOW : CHALK, 1, fitSize(ctx, s0, lw, 22, 22), 'left');
    const r = ratioAt(k);
    txt(ctx, '×' + r.toFixed(1), x + w / 2, y + 368, YELLOW, 1, 30);
    const s2 = tr('（與直導線比）', 'vs. straight');
    txt(ctx, s2, x + w / 2, y + 404, CHALK, 1, fitSize(ctx, s2, w - 16, 22, 22));
  }

  function render() {
    if (!ctx) return;
    clear(ctx);
    const k = kNow(), cur = curNow(), e = eNow(), yaw = yawNow();
    const sc = lerp(0.95, 1.38, easeIO(k));
    const c = cam(390, 285, e, yaw, sc);
    const qs = RING_S.map(s => wireAt(k, s));
    const innerA = seg(k, 0.12, 0.45);
    const ro = { cur, innerCol: innerA > 0.5 ? YELLOW : GREEN, innerSize: 11 + 4 * innerA };
    const back = [], front = [];
    qs.forEach(q => (P(c, q.x, q.y, q.z).d < 0 ? back : front).push(q));
    // 遠的那一組環 → 導線後段 → 圓心箭頭 → 近的那一組環 → 導線前段
    back.forEach(q => drawRing(c, q, RING_R, ro, 'back'));
    drawWire(c, k, cur, 'back');
    back.forEach(q => drawRing(c, q, RING_R, ro, 'front'));
    back.forEach(q => innerTick(c, q, innerA * Math.abs(cur), cur));
    const ctr = drawCenter(c, k, cur);
    front.forEach(q => drawRing(c, q, RING_R, ro, 'back'));
    drawWire(c, k, cur, 'front');
    front.forEach(q => drawRing(c, q, RING_R, ro, 'front'));
    front.forEach(q => innerTick(c, q, innerA * Math.abs(cur), cur));
    // N／S（彎成圓圈之後）
    const poleA = seg(k, 0.9, 1) * Math.abs(cur);
    if (ctr.big && poleA > 0.01) {
      const sg = cur >= 0 ? 1 : -1, off = ctr.len + 34;
      const pu = P(c, 0, off, 0), pd = P(c, 0, -off, 0);
      poleBadge(ctx, pu.x, pu.y, sg > 0, poleA);
      poleBadge(ctx, pd.x, pd.y, sg < 0, poleA);
    }
    // 電流符號 I（前緣下方）
    { const q = wireAt(k, 0), p = P(c, q.x, q.y, q.z); tag(ctx, 'I', p.x + 26, p.y + 40, ORANGE, 1, 24, 6, 775); }
    // ── 文字 ──
    const st = Math.round(S.step);
    tag(ctx, tr(`彎曲 ${st} / 10`, `Bend ${st} / 10`), 110, 34, CYAN, 1, 24, 6, 380);
    const dirTxt = cur >= 0 ? tr('電流 ↺ 逆時針（俯視）', 'Current ↺ CCW (from above)') : tr('電流 ↻ 順時針（俯視）', 'Current ↻ CW (from above)');
    tag(ctx, dirTxt, 590, 34, ORANGE, 1, 22, 400, 775);
    drawMeter(k);
    let msg, mc;
    if (k < 0.05) { msg = tr('直導線：磁場只繞著導線轉', 'Straight wire: the field just circles the wire'); mc = GREEN; }
    else if (k < 0.95) { msg = tr('圈內 B 同向疊加（黃）｜圈外 B 分散', 'Inside: B adds up (yellow) | Outside: B spreads out'); mc = YELLOW; }
    else if (!ctr.big) {
      msg = cur >= 0 ? tr('從上往下看：B 朝向你 ⊙ → 上方是 N 極', 'From above: B points at you ⊙, so the top is N')
                     : tr('從上往下看：B 背向你 ⊗ → 下方是 N 極', 'From above: B points away ⊗, so the bottom is N');
      mc = GREEN;
    } else { msg = cur >= 0 ? tr('圓心 B 最強：向上 → 上方 N、下方 S', 'Strongest B at the center: up, so N on top, S below') : tr('圓心 B 最強：向下 → 下方 N、上方 S', 'Strongest B at the center: down, so N below, S on top'); mc = GREEN; }
    tag(ctx, msg, 390, 528, mc, 1, 24, 6, 775);
    if (S.hintA > 0.01) txt(ctx, tr('← 拖曳旋轉 →', '← Drag to rotate →'), 390, 576, CYAN, S.hintA, 22);
  }

  // ═════════ 動畫迴圈（單一 RAF；離開畫面就停） ═════════
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const cur = curNow();
    S.flow += dt * 70 * cur;
    S.ph += dt * 1.3 * cur;
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
  function setStep(n, dur) {
    n = clamp(Math.round(n), 0, 10);
    const d = Math.abs(n - S.step);
    S.step = n;
    startTw(S.kTw, n / 10, dur || clamp(0.35 + 0.12 * d, 0.35, 1.6));
  }
  function setCur(sg) { if (S.cur === sg) return; S.cur = sg; startTw(S.cTw, sg, 0.45); }
  function setView(v) {
    S.view = v; S.vel = 0;
    startTw(S.eTw, VIEWS[v].e, 0.5);
    tweenYaw(VIEWS[v].yaw, 0.5);
  }
  const ACTIONS = {
    plus: () => setStep(S.step + 1),
    minus: () => setStep(S.step - 1),
    all: () => setStep(10, 1.6),
    reset: () => { setStep(0, clamp(0.35 + 0.1 * S.step, 0.35, 1.2)); setView('oblique'); },
    ccw: () => setCur(1), cw: () => setCur(-1),
    oblique: () => setView('oblique'), top: () => setView('top'), side: () => setView('side')
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
      [tr('彎曲', 'Bend'), [['plus', tr('彎一點 ＋', 'Bend more ＋')], ['minus', tr('彎回去 −', 'Unbend −')], ['all', tr('一次彎到底', 'Bend all the way')], ['reset', tr('重置', 'Reset')]]],
      [tr('電流（從上往下看）', 'Current (seen from above)'), [['ccw', tr('逆時針 ↺', 'Counterclockwise ↺')], ['cw', tr('順時針 ↻', 'Clockwise ↻')]]],
      [tr('視角', 'View'), [['oblique', tr('斜視', 'Angled')], ['top', tr('俯視', 'From above')], ['side', tr('側視', 'From the side')]]]
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
        if (k === 'plus' || k === 'all') b.disabled = S.step >= 10;
        if (k === 'minus') b.disabled = S.step <= 0;
        if (k === 'ccw') { b.classList.toggle('active', S.cur > 0); b.setAttribute('aria-pressed', S.cur > 0); }
        if (k === 'cw') { b.classList.toggle('active', S.cur < 0); b.setAttribute('aria-pressed', S.cur < 0); }
        if (VIEWS[k]) { b.classList.toggle('active', S.view === k); b.setAttribute('aria-pressed', S.view === k); }
      });
    }
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', tr('把直導線彎成圓圈的立體實驗台；按左右方向鍵旋轉視角', '3D bench: bending a straight wire into a loop; use the left and right arrow keys to rotate'));
  }
  function resultHTML() {
    const n = S.step, ccw = S.cur > 0;
    const up = ccw ? tr('朝上', 'up') : tr('朝下', 'down');
    let main;
    if (n === 0) main = tr('導線是直的：磁場只繞著導線轉。每一小段導線都被自己的一圈磁場環圍住，黃色 ＋ 處（將來的圓心）磁場很弱。',
      'The wire is straight: the field just circles around the wire. Each little piece is wrapped in its own field ring, and the field at the yellow + (the future center) is weak.');
    else if (n <= 3) main = tr(`導線開始彎了：磁場環跟著導線一起移動，每個環在圈內那一側的 B 都${up}。`,
      `The wire starts to bend: the field rings move along with it, and on the inner side of every ring B points ${up}.`);
    else if (n <= 6) main = tr(`導線漸漸彎起來，圈內的磁力線往中間靠攏：圈內的 B 都${up}、同向疊加；圈外的 B 則分散開。`,
      `As the wire bends, the field lines inside crowd toward the middle: inside, every B points ${up} and they add up; outside, B spreads out.`);
    else if (n <= 9) main = tr('快圍成一圈了：圈內的 B 擠在一起、同向疊加，圓心的磁場越來越強。',
      'Almost a full circle: the B on the inside crowd together and add up, so the field at the center keeps getting stronger.');
    else main = tr('圓心的磁場方向一致、疊加變強；右手四指順電流彎，拇指指向 N 極。',
      'At the center all the fields point the same way and add up; curl your right-hand fingers along the current, and your thumb points to the N pole.');
    let rule = '';
    if (n === 10) rule = ccw
      ? tr('電流俯視<strong class="accent-orange">逆時針</strong> → 圓心 <strong class="accent-green">B 向上</strong> → <strong class="accent-red">上方 N</strong>、<strong class="accent-blue">下方 S</strong>。',
        'Current <strong class="accent-orange">counterclockwise</strong> from above → <strong class="accent-green">B up</strong> at the center → <strong class="accent-red">N on top</strong>, <strong class="accent-blue">S below</strong>.')
      : tr('電流俯視<strong class="accent-orange">順時針</strong> → 圓心 <strong class="accent-green">B 向下</strong> → <strong class="accent-red">下方 N</strong>、<strong class="accent-blue">上方 S</strong>。',
        'Current <strong class="accent-orange">clockwise</strong> from above → <strong class="accent-green">B down</strong> at the center → <strong class="accent-red">N below</strong>, <strong class="accent-blue">S on top</strong>.');
    const r = ratioAt(n / 10).toFixed(1);
    const meter = tr(`圓心磁場：直導線時的 <span class="nowrap">×${r}</span>`, `Field at the center: <span class="nowrap">×${r}</span> the straight wire`);
    return `<strong class="accent-yellow">${tr(`第 ${n}／10 階`, `Step ${n} / 10`)}</strong>　${main}` +
      (rule ? `<br>${rule}` : '') + `<br><span class="accent-cyan">${meter}</span>`;
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
    cv = document.getElementById('loopLabCanvas');
    ctrl = document.getElementById('loopLabControls');
    res = document.getElementById('loopLabResult');
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
    const k = kNow(), cur = curNow();
    return {
      step: S.step, k: +k.toFixed(3), cur: S.cur, curShown: +cur.toFixed(3),
      ccw: S.cur > 0, northOnTop: S.cur > 0,
      view: S.view, elevDeg: +(eNow() / DEG).toFixed(1), yawDeg: +((((yawNow() / DEG) % 360) + 360) % 360).toFixed(1),
      strength: +strength(k).toFixed(3), ratio: +ratioAt(k).toFixed(2),
      hintA: +S.hintA.toFixed(2), dragged: S.dragged, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  EmLab.loop = { activate, deactivate, relang, _state };
})();
