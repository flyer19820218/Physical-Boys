/* electromagnetism_2_loop_1104_v1.js — 「圓線圈」分頁動畫（#loopCanvas，1000×600）
 *
 * 契約：window.EmAnim.loop = { activate(sceneId), deactivate(), relang(), ctl, _frameAt, _info, _state }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 立體投影、右手、小磁針、磁力線都在本檔自己畫。畫布不綁任何事件；唯一控制是 #steps-loop 的步驟鈕。
 *
 * 座標約定（世界座標）：x 向右、y 向上、z 朝向觀看者；線圈躺在水平面 y = 0，圓心在原點。
 *   從上往下看時 x 向右、z 向畫面下方；水平面上的點 (x, z) = (r cosθ, r sinθ)。
 *   電流「俯視逆時針」＝ θ 遞減（前緣 z = +R 處電流向 +x）→ 圓心 B 向上（+y）→ 上方為 N 極。
 *   每一小段導線（方向 u）的環形磁場：B = u × r̂；取 n = ŷ × u（指向圈內），圈內側 B = +ŷ、圈外側 B = −ŷ。
 *   磁力線用 Biot–Savart 數值積分（240 段）在通過圓心的鉛直面 z = 0 上描出，再依電流正負反轉方向。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * loop-shape 從直導線到線圈，共 42 s
 *   1 直導線   7 s   長直導線通電，沿線每一小段都有自己的環形磁場（箭頭＋流動亮點）
 *   2 彎成圓   9 s   導線一步步彎成圓圈，磁場環跟著導線繞進圈內
 *   3 同向疊加 10 s  每個環在圈內那一側的 B 都朝上 → 箭頭滑向圓心合成一支粗箭頭；俯視圖：圈內 •、圈外 ×
 *   4 內強外弱 8 s   環淡出，換成真正的磁力線：圓心最密＝最強，圈外分散＝較弱
 *   5 匝數     8 s   1 匝 → 2 匝 → 3 匝，圓心磁場 ×1 → ×2 → ×3
 * loop-rule 線圈的右手定則，共 43 s
 *   1 右手     9 s   俯視逆時針電流；右手四指順著電流彎曲，大拇指朝上
 *   2 上方 N   8 s   大拇指方向＝圓心 B（向上）→ 上方 N、下方 S；俯視小圖：逆時針、圓心 •
 *   3 反向     9 s   電流改成順時針；右手翻過來、大拇指朝下 → 下方 N
 *   4 小磁針   9 s   小磁針（紅＝N）順著 B 排列；電流再反向 → 小磁針全部翻轉，上方又變 N
 *   5 圓盤磁鐵 8 s   通電圓線圈＝薄圓盤磁鐵：上 N 下 S；右側對照兩種繞向
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.EmAnim = window.EmAnim || {};

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
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function font(size) { return `900 ${size}px ${FONT}`; }
  // 保守字寬：測試環境可能載不到 Noto Sans TC，中文每字以字級計、其餘字元實測後再留 15% 餘裕
  const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
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
  // 有底色的小標籤（避免字壓在線上）
  function tag(ctx, s, x, y, color, a = 1, size = 24, maxW = W - 40) {
    if (a <= 0.01) return;
    size = fitSize(ctx, s, maxW - 20, size, 22);
    const w = textW(ctx, s, size) + 20;
    x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.75, w, size * 1.5, 8); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
  }
  function txt(ctx, s, x, y, color, a = 1, size = 24, align = 'center') {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, x, y, color, align, size); ctx.restore();
  }
  function leader(ctx, x1, y1, x2, y2, color, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x2, y2, 4, 0, TAU); ctx.fill(); ctx.restore();
  }
  function topMsg(ctx, s, color, a = 1) {
    ctx.save(); ctx.fillStyle = PANEL; ctx.fillRect(0, 6, W, 52); ctx.restore();
    if (!s || a <= 0) return;
    const size = fitSize(ctx, s, W - 30, 26, 22);
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, W / 2, 33, color, 'center', size); ctx.restore();
  }
  // 右側說明卡底板
  function card(ctx, x, y, w, h, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = 'rgba(85,233,255,0.35)'; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // items: [kind, text, alpha]
  function legend(ctx, items) {
    items = items.filter(it => it[2] > 0.02);
    const size = 22, gap = 34, gw = 40;
    const ws = items.map(it => gw + 10 + textW(ctx, it[1], size));
    const tot = ws.reduce((s, w) => s + w, 0) + gap * Math.max(0, items.length - 1);
    const y = H - 22;
    ctx.save(); ctx.fillStyle = PANEL; ctx.fillRect(0, H - 44, W, 44); ctx.restore();
    let xx = (W - tot) / 2;
    items.forEach(([kind, s, a], k) => {
      ctx.save(); ctx.globalAlpha = a;
      if (kind === 'I') { ctx.strokeStyle = ORANGE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 12, y); ctx.stroke(); arrowHead(ctx, xx + gw - 12, y, 0, ORANGE, 11); }
      else if (kind === 'B') { ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 12, y); ctx.stroke(); arrowHead(ctx, xx + gw - 12, y, 0, GREEN, 10); }
      else if (kind === 'compass') {
        const cx = xx + gw / 2; ctx.fillStyle = 'rgba(12,30,25,1)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, y, 14, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = POLE_N; ctx.beginPath(); ctx.moveTo(cx, y - 11); ctx.lineTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.fill();
        ctx.fillStyle = POLE_S; ctx.beginPath(); ctx.moveTo(cx, y + 11); ctx.lineTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.fill();
      }
      ctx.restore();
      txt(ctx, s, xx + gw + 10, y, CHALK, a, size, 'left');
      xx += ws[k] + gap;
    });
  }
  // 磁極圓章
  function poleBadge(ctx, x, y, isN, a, r = 22) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = '#f2ecd9'; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 26);
  }

  // ═════════ 立體投影 ═════════
  // phi：繞鉛直軸轉動的方位角（只在直導線階段用來讓磁場環看得出是圓）
  function cam(cx, cy, e, s = 1, D = 2400, phi = 0) { return { cx, cy, s, D, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(phi), sp: Math.sin(phi) }; }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f };
  }

  // ═════════ 圓線圈的磁場（Biot–Savart，鉛直面 z = 0；R = 1、俯視逆時針） ═════════
  const NSEG = 240, SEGS = [];
  for (let i = 0; i < NSEG; i++) { const th = (i + 0.5) / NSEG * TAU; SEGS.push([Math.cos(th), Math.sin(th), Math.sin(th), -Math.cos(th)]); }
  function loopB(x, y) {      // 回傳 [Bx, By]（z = 0 面上 Bz = 0）
    let bx = 0, by = 0;
    for (const [cx, sz, dx, dz] of SEGS) {
      const rx = x - cx, ry = y, rz = -sz, d = Math.hypot(rx, ry, rz), d3 = d * d * d;
      bx += (0 * rz - dz * ry) / d3; by += (dz * rx - dx * rz) / d3;
    }
    return [bx * TAU / NSEG, by * TAU / NSEG];
  }
  function unitB(x, y) { const b = loopB(x, y), m = Math.hypot(b[0], b[1]) || 1; return [b[0] / m, b[1] / m]; }
  function rk4(x, y, h) {
    const k1 = unitB(x, y), k2 = unitB(x + k1[0] * h / 2, y + k1[1] * h / 2), k3 = unitB(x + k2[0] * h / 2, y + k2[1] * h / 2), k4 = unitB(x + k3[0] * h, y + k3[1] * h);
    return [x + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, y + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
  }
  // 磁力線（順著逆時針電流的 B 方向排列的點列）；圈內 5 條＋中心軸，左右鏡射
  const FIELD = (function () {
    const lines = [], h = 0.012, XB = 4.2, YB = 2.2;
    const out = (x, y) => Math.abs(x) > XB || Math.abs(y) > YB;
    for (const a of [0.22, 0.46, 0.66, 0.8, 0.91]) {
      const fwd = [[a, 0]]; let x = a, y = 0, closed = false;
      for (let n = 0; n < 3000; n++) {
        const py = y; [x, y] = rk4(x, y, h);
        if (n > 10 && py < 0 && y >= 0 && x < 1) { fwd.push([a, 0]); closed = true; break; }
        fwd.push([x, y]); if (out(x, y)) break;
      }
      let pts = fwd;
      if (!closed) {
        const back = []; x = a; y = 0;
        for (let n = 0; n < 3000; n++) { [x, y] = rk4(x, y, -h); back.push([x, y]); if (out(x, y)) break; }
        pts = back.reverse().concat(fwd);
      }
      lines.push({ a, closed, pts });
      lines.push({ a: -a, closed, pts: pts.map(([px, py]) => [-px, py]) });   // 左側：Bx 反號、By 相同
    }
    lines.push({ a: 0, closed: false, pts: [[0, -YB], [0, YB]] });
    lines.forEach(L => { let s = 0; L.len = [0]; for (let i = 1; i < L.pts.length; i++) { s += Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); L.len.push(s); } L.total = s; });
    return lines;
  })();
  function pointAt(L, s) {     // 沿磁力線弧長 s 的位置與切線
    s = clamp(s, 0, L.total);
    let lo = 0, hi = L.len.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L.len[m] <= s) lo = m; else hi = m; }
    const a = L.pts[lo], b = L.pts[hi], k = (s - L.len[lo]) / ((L.len[hi] - L.len[lo]) || 1);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), b[0] - a[0], b[1] - a[1]];
  }
  // o: { R, alpha, dir(+1 逆時針 / −1 順時針), amp, t, dots }
  function drawFieldLines(ctx, c, o) {
    if (o.alpha <= 0.01) return;
    const R = o.R, dir = o.dir || 1;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 58, W, H - 102); ctx.clip();
    ctx.globalAlpha = o.alpha; ctx.strokeStyle = C.purple; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const L of FIELD) { polyline(ctx, L.pts.map(([x, y]) => P(c, x * R, y * R, 0))); ctx.stroke(); }
    const amp = o.amp === undefined ? 1 : o.amp;
    if (amp > 0.01) {
      ctx.globalAlpha = o.alpha * amp;
      for (const L of FIELD) {
        const fr = L.a === 0 ? [0.38, 0.62] : L.closed ? [0.12, 0.62] : [0.3, 0.7];
        for (const q of fr) {
          const [x, y, dx, dy] = pointAt(L, q * L.total), p = P(c, x * R, y * R, 0), p2 = P(c, (x + dx * dir) * R, (y + dy * dir) * R, 0);
          arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), GREEN, 11);
        }
        if (o.dots) {
          ctx.fillStyle = '#f4e3ff'; ctx.shadowColor = C.purple; ctx.shadowBlur = 8;
          const sp = 0.9, gap = 0.75;
          for (let s0 = ((dir * sp * (o.t || 0)) % gap + gap) % gap; s0 < L.total; s0 += gap) {
            const [x, y] = pointAt(L, s0), p = P(c, x * R, y * R, 0);
            ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, TAU); ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      }
    }
    ctx.restore();
  }

  // ═════════ 導線（可由直線彎成圓） ═════════
  // k：0 直線（沿 x，位於 z = R）→ 1 圓（半徑 R，圓心在原點）。s 由 −L/2 到 L/2，前緣 s = 0 在 (0, y0, R)。
  function wireGeom(R, k, y0 = 0, n = 180, gap = 0.035) {
    const L = TAU * R * (1 - gap), kap = k / R, pts = [];
    for (let i = 0; i <= n; i++) {
      const s = -L / 2 + L * i / n;
      let x, z, ux, uz;
      if (kap < 1e-6) { x = s; z = R; ux = 1; uz = 0; }
      else { x = Math.sin(kap * s) / kap; z = R - (1 - Math.cos(kap * s)) / kap; ux = Math.cos(kap * s); uz = -Math.sin(kap * s); }
      pts.push({ x, y: y0, z, ux, uz, s });
    }
    return pts;
  }
  function wireAt(R, k, s, y0 = 0) {
    const kap = k / R;
    if (kap < 1e-6) return { x: s, y: y0, z: R, ux: 1, uz: 0 };
    return { x: Math.sin(kap * s) / kap, y: y0, z: R - (1 - Math.cos(kap * s)) / kap, ux: Math.cos(kap * s), uz: -Math.sin(kap * s) };
  }
  // part：'all' | 'back'（z < 0）| 'front'；cur：+1 逆時針（沿 s 遞增）、−1 順時針；amp：電流亮度
  function drawWire(ctx, c, pts, o) {
    const part = o.part || 'all', al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01) return;
    const runs = []; let cur = null;
    pts.forEach((q, i) => {
      const ok = part === 'all' || (part === 'back' ? q.z < 0 : q.z >= 0);
      const p = P(c, q.x, q.y, q.z);
      if (ok) { if (!cur) { cur = []; if (i > 0) { const r = pts[i - 1]; cur.push(P(c, r.x, r.y, r.z)); } } cur.push(p); }
      else if (cur) { cur.push(p); runs.push(cur); cur = null; }
    });
    if (cur) runs.push(cur);
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const w = o.w || 9;
    for (const r of runs) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; polyline(ctx, r); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = '#b4744a'; ctx.lineWidth = w; polyline(ctx, r); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.4)'; ctx.lineWidth = w * 0.25; ctx.beginPath(); r.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    const amp = o.amp || 0;
    if (amp > 0.01) {
      ctx.globalAlpha = al * amp; ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
      ctx.setLineDash([12, 20]); ctx.lineDashOffset = -(o.dir || 1) * (o.t || 0) * 70;
      for (const r of runs) { polyline(ctx, r); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      // 電流箭頭
      for (const sFrac of (o.arrows || [])) {
        const i = Math.round(sFrac * (pts.length - 1)), q = pts[clamp(i, 1, pts.length - 2)];
        const ok = part === 'all' || (part === 'back' ? q.z < 0 : q.z >= 0);
        if (!ok) continue;
        const dd = o.dir || 1, p = P(c, q.x, q.y, q.z), p2 = P(c, q.x + q.ux * dd * 6, q.y, q.z + q.uz * dd * 6);
        arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), ORANGE, 15);
      }
    }
    ctx.restore();
  }

  // 一小段導線的環形磁場（在垂直於導線的平面上）。φ = 0 為圈內側，B 沿 φ 遞增方向（俯視逆時針電流時）
  function ringPts(q, r, N = 40) {
    const n = [q.uz, 0, -q.ux];   // n = ŷ × u（指向圈內）；B = u × r̂ 沿 φ 遞增
    const out = [];
    for (let i = 0; i <= N; i++) {
      const ph = i / N * TAU, cph = Math.cos(ph), sph = Math.sin(ph);
      out.push({ x: q.x + r * cph * n[0], y: q.y + r * sph, z: q.z + r * cph * n[2], ph });
    }
    return out;
  }
  // layer：'back'（比導線點遠）| 'front'
  function drawRingAround(ctx, c, q, r, o, layer) {
    if (o.alpha <= 0.01) return;
    const pts = ringPts(q, r), d0 = P(c, q.x, q.y, q.z).d;
    const proj = pts.map(p => Object.assign(P(c, p.x, p.y, p.z), { ph: p.ph }));
    const want = p => layer === 'front' ? p.d >= d0 : p.d < d0;
    ctx.save(); ctx.globalAlpha = o.alpha; ctx.strokeStyle = o.color || GREEN; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    let run = [];
    const flush = () => { if (run.length > 1) { polyline(ctx, run); ctx.stroke(); } run = []; };
    proj.forEach((p, i) => { if (want(p)) { if (!run.length && i > 0) run.push(proj[i - 1]); run.push(p); } else if (run.length) { run.push(p); flush(); } });
    flush();
    // 箭頭：φ = 0（圈內側）與 φ = π（圈外側）
    const dir = o.dir || 1;
    for (const [ph, col, sz] of [[0, o.innerColor || GREEN, o.innerSize || 11], [Math.PI, GREEN, 11]]) {
      const n = [q.uz, 0, -q.ux];
      const a = { x: q.x + r * Math.cos(ph) * n[0], y: q.y + r * Math.sin(ph), z: q.z + r * Math.cos(ph) * n[2] };
      const ph2 = ph + dir * 0.15, b = { x: q.x + r * Math.cos(ph2) * n[0], y: q.y + r * Math.sin(ph2), z: q.z + r * Math.cos(ph2) * n[2] };
      const pa = P(c, a.x, a.y, a.z), pb = P(c, b.x, b.y, b.z);
      if (!want(pa)) continue;
      ctx.globalAlpha = o.alpha * (o.amp === undefined ? 1 : o.amp);
      arrowHead(ctx, pa.x, pa.y, Math.atan2(pb.y - pa.y, pb.x - pa.x), col, sz);
    }
    if (o.dots) {
      ctx.globalAlpha = o.alpha; ctx.fillStyle = '#eaffdf'; ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
      for (let k = 0; k < 2; k++) {
        const ph = k * Math.PI + dir * 2.2 * (o.t || 0);
        const n = [q.uz, 0, -q.ux], p = P(c, q.x + r * Math.cos(ph) * n[0], q.y + r * Math.sin(ph), q.z + r * Math.cos(ph) * n[2]);
        if (!want(p)) continue;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  // 俯視小圖：線圈（橘色電流箭頭）＋圓心符號。dir：+1 逆時針、−1 順時針；marks：圈內外的 •／×
  function topLoopInset(ctx, cx, cy, R, dir, a, o = {}) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(16,45,38,0.96)'; ctx.strokeStyle = 'rgba(85,233,255,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + (o.pad || 22), 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#b4744a'; ctx.lineWidth = 6; ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const th = -Math.PI / 2 + k * TAU / 4 + Math.PI / 4;
      arrowHead(ctx, cx + R * Math.cos(th), cy + R * Math.sin(th), th - dir * Math.PI / 2, ORANGE, 14);
    }
    const sym = (x, y, isDot, r, col) => {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      if (isDot) { ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, TAU); ctx.fill(); }
      else { const k = r * 0.55; ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); }
    };
    if (o.marks) {
      const inA = o.marks;
      ctx.globalAlpha = a * inA;
      [[0, 0], [-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]].forEach(([u, v]) => sym(cx + u * R, cy + v * R, dir > 0, 9, GREEN));
      for (let k = 0; k < 8; k++) { const th = k * TAU / 8 + Math.PI / 8; sym(cx + (R + 14) * Math.cos(th) * 1.0, cy + (R + 14) * Math.sin(th), dir < 0, 6, GREEN); }
    } else {
      sym(cx, cy, dir > 0, 15, GREEN);
    }
    ctx.restore();
  }

  // ═════════ 右手（四指繞著鉛直軸彎曲，大拇指沿軸） ═════════
  const HR = 24;
  const FING = { ys: [30, 9, -12, -33], spans: [5.1, 5.3, 5.15, 4.75], th: [21, 22, 21, 19] };
  function handGeom(curl) {
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const th0 = 0.35, L = FING.spans[i] * HR, N = 44, ds = L / N;
      let x = HR * Math.cos(th0), z = HR * Math.sin(th0), g = th0 - Math.PI / 2;
      const pts = [[x, FING.ys[i], z]];
      for (let k = 0; k < N; k++) {
        g -= 0.5 * curl * ds / HR; x += Math.cos(g) * ds; z += Math.sin(g) * ds; g -= 0.5 * curl * ds / HR;
        pts.push([x, FING.ys[i], z]);
      }
      fingers.push({ pts, th: FING.th[i] });
    }
    return fingers;
  }
  // hs: { sg(+1 大拇指向上／−1 向下：整隻右手繞 z 軸轉 180°，仍是右手), curl, slide, alpha, yc, k(縮放) }
  // sg = +1 時四指沿 θ 遞減彎曲＝俯視逆時針；sg = −1 時 (x, y) → (−x, −y)，四指變成俯視順時針。
  function handXf(hs) {
    const sg = hs.sg, k = hs.k, ox = sg * (hs.slide || 0);
    return (x, y, z) => [sg * x * k + ox, hs.yc + sg * y * k, z * k];
  }
  const SKIN = '#f3b88e', SKIN_D = '#c98a62', SKIN_E = '#8c512f';
  function strokeLimb(ctx, pts, w, body, edge, hi) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = edge; ctx.lineWidth = w + 4; polyline(ctx, pts); ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = w; polyline(ctx, pts); ctx.stroke();
    if (hi) {
      ctx.strokeStyle = hi; ctx.lineWidth = Math.max(2, w * 0.28);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x - w * 0.12, p.y - w * 0.22) : ctx.moveTo(p.x - w * 0.12, p.y - w * 0.22)); ctx.stroke();
    }
  }
  function fingerRuns(c, f, xf) {
    const runs = []; let cur = null, side = null;
    f.pts.forEach(q => {
      const [x, y, z] = xf(q[0], q[1], q[2]);
      const p = P(c, x, y, z), s = z >= 0 ? 'front' : 'back';
      if (s !== side) { if (cur) { cur.pts.push(p); runs.push(cur); } cur = { side: s, pts: cur ? [cur.pts[cur.pts.length - 1], p] : [p] }; side = s; }
      else cur.pts.push(p);
    });
    if (cur) runs.push(cur);
    return runs;
  }
  // ═════════ 右手（圖片素材版） ═════════
  // 素材：右手、握拳、拇指朝上；指背朝左、手腕在右下（380×355，透明底）。只旋轉／等比縮放／平移，絕不翻轉。
  // 拇指朝上＝0°；拇指朝下＝整張圖旋轉 180°（平面內旋轉，仍是右手）。
  // 圖上拳頭正面的四指由左（指節）往右（指尖）彎＝前緣往右＝俯視逆時針，與 sg = +1 一致；轉 180° 後成俯視順時針。
  // 手整隻放在圓心 B 箭頭的一側（拇指朝上在右、朝下在左），不遮住圓心的 B 箭頭與 N/S 標籤。
  const HAND_IMG = new Image();
  const HAND_SRC = 'assets/electromagnetism_2/hand_right_thumbup_1105_v1.png';
  const HIMG = {
    fist: [65, 245],          // 拳頭中心（旋轉、定位的錨點）
    tip: [156, 4],            // 大拇指尖（給標籤）
    finger: [40, 252],        // 四指正面（給「四指」標籤的引線）
    s: 0.5                    // 1 圖片像素＝0.5 畫面像素
  };
  const handImgReady = () => HAND_IMG.complete && HAND_IMG.naturalWidth > 0;
  HAND_IMG.onload = () => { if (S.scene && !S.raf) render(); };   // 暫停中載完也補畫一幀
  HAND_IMG.src = HAND_SRC;
  // 圖片座標 → 畫面座標（拳頭中心：拇指朝上時在圓心右上、朝下時在圓心左下）
  function handImgXf(hs) {
    const sg = hs.sg, F = sg > 0 ? [RU.cx + 72, RU.cy - 35] : [RU.cx - 76, RU.cy + 35];
    const o = { x: F[0] + sg * (hs.slide || 0), y: F[1] };
    const tilt = sg * (1 - clamp(hs.curl === undefined ? 1 : hs.curl, 0, 1)) * 10 * DEG;   // 還沒握緊時手微微張開
    const rot = (sg > 0 ? 0 : Math.PI) + tilt, sc = HIMG.s, cs = Math.cos(rot), sn = Math.sin(rot);
    return { o, sc, rot, pt: (ix, iy) => { const dx = (ix - HIMG.fist[0]) * sc, dy = (iy - HIMG.fist[1]) * sc; return { x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs }; } };
  }
  // 拳頭外圍的水平彎箭頭（橘＝電流方向）：提示四指順著電流彎。half：'back'（手後面那半圈）| 'front'
  function curlArrow(ctx, X, hs, half) {
    const a = hs.alpha * easeIO(seg(hs.curl === undefined ? 1 : hs.curl, 0.6, 1));
    if (a <= 0.01) return;
    const cx = X.o.x + hs.sg * 4, cy = X.o.y, rx = 60, ry = rx * Math.sin(RU.e);
    const dir = -hs.sg;     // 俯視逆時針：前緣（畫面下方）往右＝橢圓參數遞減
    const [a0, a1] = half === 'front' ? [0.12 * Math.PI, 0.88 * Math.PI] : [1.12 * Math.PI, 1.88 * Math.PI];
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, a1); ctx.stroke();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, a1); ctx.stroke();
    const ae = dir < 0 ? a0 : a1, px = cx + rx * Math.cos(ae), py = cy + ry * Math.sin(ae);
    arrowHead(ctx, px, py, Math.atan2(ry * Math.cos(ae) * dir, -rx * Math.sin(ae) * dir), ORANGE, 14);
    ctx.restore();
  }
  // 手：圖片載好就用圖，沒載好退回程式畫法
  function drawHand(ctx, c, hs, layer) {
    if (!hs || hs.alpha <= 0.01) return;
    if (!handImgReady()) { drawHandVec(ctx, c, hs, layer); return; }
    const X = handImgXf(hs);
    if (layer === 'back') { curlArrow(ctx, X, hs, 'back'); return; }
    ctx.save(); ctx.globalAlpha = hs.alpha;
    ctx.translate(X.o.x, X.o.y); ctx.rotate(X.rot); ctx.scale(X.sc, X.sc);
    ctx.drawImage(HAND_IMG, -HIMG.fist[0], -HIMG.fist[1]);
    ctx.restore();
    curlArrow(ctx, X, hs, 'front');
  }
  // 標籤用的點：大拇指尖、四指
  function handTipPt(c, hs) { return handImgReady() ? handImgXf(hs).pt(HIMG.tip[0], HIMG.tip[1]) : handPt(c, hs, HR * Math.cos(0.42), 108, HR * Math.sin(0.42) + 10); }
  function handFingerPt(c, hs) { return handImgReady() ? handImgXf(hs).pt(HIMG.finger[0], HIMG.finger[1]) : handPt(c, hs, HR * 1.2, 9, HR * 1.6); }
  // 舊的程式畫法（圖片載入前的後備）。layer: 'back' | 'front'
  function drawHandVec(ctx, c, hs, layer) {
    if (!hs || hs.alpha <= 0.01) return;
    const xf = handXf(hs), fingers = handGeom(hs.curl), K = hs.k;
    const order = hs.sg > 0 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    ctx.save(); ctx.globalAlpha = hs.alpha;
    if (layer === 'back') {
      for (const i of order) for (const run of fingerRuns(c, fingers[i], xf)) if (run.side === 'back') strokeLimb(ctx, run.pts, fingers[i].th * K * run.pts[0].f, SKIN_D, SKIN_E, null);
      ctx.restore(); return;
    }
    const proj = arr => arr.map(([x, y, z]) => { const w = xf(x, y, z); return P(c, w[0], w[1], w[2]); });
    const arm = proj([[HR + 80, 26, 4], [HR + 150, 24, 0], [HR + 150, -40, 0], [HR + 80, -44, 4]]);
    ctx.fillStyle = '#2b5f73'; ctx.strokeStyle = '#173847'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    polyline(ctx, arm); ctx.closePath(); ctx.fill(); ctx.stroke();
    const palm = proj([[HR * 0.85, 44, 10], [HR + 46, 50, 12], [HR + 80, 32, 8], [HR + 92, -4, 6], [HR + 90, -44, 6], [HR + 60, -52, 8], [HR + 16, -50, 10], [HR * 0.85, -44, 10]]);
    const g = ctx.createLinearGradient(palm[0].x, palm[0].y, palm[4].x, palm[4].y);
    g.addColorStop(0, '#ffd6b8'); g.addColorStop(0.55, SKIN); g.addColorStop(1, '#c47e55');
    ctx.fillStyle = g; ctx.strokeStyle = SKIN_E; ctx.lineWidth = 3.5;
    polyline(ctx, palm); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const i of order) {
      const f = fingers[i];
      for (const run of fingerRuns(c, f, xf)) if (run.side === 'front') strokeLimb(ctx, run.pts, f.th * K * run.pts[0].f, SKIN, SKIN_E, 'rgba(255,236,220,0.55)');
      const q = f.pts[f.pts.length - 1], q2 = f.pts[f.pts.length - 4];
      const [x, y, z] = xf(q[0], q[1], q[2]), [x2, y2, z2] = xf(q2[0], q2[1], q2[2]);
      if (z >= 0) {
        const a = P(c, x, y, z), b = P(c, x2, y2, z2), ang = Math.atan2(a.y - b.y, a.x - b.x);
        ctx.save(); ctx.translate(a.x - Math.cos(ang) * 5, a.y - Math.sin(ang) * 5); ctx.rotate(ang);
        ctx.fillStyle = '#ffe6d6'; ctx.strokeStyle = 'rgba(140,81,47,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 7 * K * a.f, 5.5 * K * a.f, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    const th = proj([[HR * Math.cos(0.62) + 2, 36, HR * Math.sin(0.62) + 8], [HR * Math.cos(0.5), 76, HR * Math.sin(0.5) + 9], [HR * Math.cos(0.42) - 1, 108, HR * Math.sin(0.42) + 10]]);
    strokeLimb(ctx, th, 24 * K * th[0].f, SKIN, SKIN_E, 'rgba(255,236,220,0.6)');
    const tip = th[2], pre = th[1], ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
    ctx.save(); ctx.translate(tip.x - Math.cos(ang) * 6, tip.y - Math.sin(ang) * 6); ctx.rotate(ang);
    ctx.fillStyle = '#ffe6d6'; ctx.strokeStyle = 'rgba(140,81,47,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 8 * K * tip.f, 7 * K * tip.f, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }
  function handPt(c, hs, x, y, z) { const w = handXf(hs)(x, y, z); return P(c, w[0], w[1], w[2]); }

  // 小磁針（畫在鉛直面上）：ang 為畫面角度（N 端指向）
  function needle2D(ctx, x, y, ang, a, r = 28) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,28,23,0.95)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    const L = r * 0.8, w = r * 0.24, ux = Math.cos(ang), uy = Math.sin(ang);
    ctx.fillStyle = POLE_N; ctx.beginPath(); ctx.moveTo(x + ux * L, y + uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = POLE_S; ctx.beginPath(); ctx.moveTo(x - ux * L, y - uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ═════════ 場景 1：從直導線到線圈 ═════════
  const SH = { cx: 430, cy: 330, e: 24 * DEG, R: 180, ringR: 42, nRing: 12 };
  function shapeState(step, t) {
    const s = { bend: 1, ringA: 1, ringAmp: 1, inner: 0, slide: -1, bigA: 0, inset: 0, marks: 0, fieldA: 0, tagIn: 0, tagOut: 0, turns: 1, turn2: 0, turn3: 0, meter: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.bend = 0; s.ringA = easeIO(seg(t, 0.6, 2.0)); s.ringAmp = seg(t, 1.4, 2.2);
      if (t < 3.2) { s.msg = tr('長直導線通電：周圍有一圈圈環形磁場', 'A current-carrying straight wire: rings of magnetic field around it'); s.mc = GREEN; }
      else { s.msg = tr('導線上的每一小段，都被自己的磁場環圍著', 'Every little piece of the wire is wrapped in its own field ring'); s.mc = CHALK; }
    } else if (step === 1) {
      s.bend = easeIO(seg(t, 0.8, 6.2));
      if (t < 3.2) { s.msg = tr('把這條導線彎成一個圓圈，會怎樣？', 'What if we bend this wire into a circle?'); s.mc = CYAN; }
      else if (t < 6.4) { s.msg = tr('磁場環跟著導線一起彎……', 'The field rings bend along with the wire...'); s.mc = CYAN; }
      else { s.msg = tr('每個環在圈內的那一側，全都擠到圓心附近', 'The inner side of every ring now crowds around the center'); s.mc = YELLOW; }
    } else if (step === 2) {
      s.inner = easeIO(seg(t, 0.3, 1.2)); s.ringA = 1 - 0.55 * easeIO(seg(t, 2.2, 3.2));
      s.slide = seg(t, 2.4, 5.0); s.bigA = easeIO(seg(t, 4.2, 5.4));
      s.inset = easeIO(seg(t, 6.0, 6.8)); s.marks = easeIO(seg(t, 6.8, 7.6));
      if (t < 2.4) { s.msg = tr('看圈內那一側：每一段的 B 都朝上', 'Look at the inner side: every piece gives B pointing up'); s.mc = YELLOW; }
      else if (t < 6.0) { s.msg = tr('方向相同，在圓心同向疊加，磁場變強', 'Same direction, so they add up at the center: a stronger field'); s.mc = GREEN; }
      else { s.msg = tr('從上往下看：圈內都是 •（向上），圈外是 ×（向下）', 'Seen from above: • (up) inside the loop, × (down) outside'); s.mc = GREEN; }
    } else if (step === 3) {
      s.ringA = 0.45 * (1 - easeIO(seg(t, 0.2, 1.6))); s.inner = 1 - seg(t, 0.2, 1.2); s.bigA = 1 - 0.5 * easeIO(seg(t, 0.8, 2.0));
      s.fieldA = easeIO(seg(t, 0.6, 2.2)); s.tagIn = easeIO(seg(t, 2.8, 3.4)); s.tagOut = easeIO(seg(t, 4.8, 5.4));
      if (t < 2.8) { s.msg = tr('真正的磁力線：從圓心穿過，再從外側繞回來', 'The real field lines: up through the center, back around the outside'); s.mc = GREEN; }
      else if (t < 4.8) { s.msg = tr('圓心的磁力線最密：磁場最強', 'The lines are densest at the center: the field is strongest there'); s.mc = YELLOW; }
      else { s.msg = tr('圈外的磁力線分散開：磁場較弱', 'Outside the loop the lines spread out: the field is weaker'); s.mc = PINK; }
    } else {
      s.ringA = 0; s.fieldA = 0.75; s.bigA = 1;
      s.turn2 = easeIO(seg(t, 1.0, 2.0)); s.turn3 = easeIO(seg(t, 4.0, 5.0)); s.meter = easeIO(seg(t, 0.2, 0.9));
      s.turns = 1 + s.turn2 + s.turn3;
      if (t < 1.0) { s.msg = tr('同樣的電流，再多繞幾圈……', 'Same current, but wind more turns...'); s.mc = CYAN; }
      else if (t < 4.0) { s.msg = tr('繞成 2 匝：圓心的磁場加倍', 'Two turns: the field at the center doubles'); s.mc = YELLOW; }
      else { s.msg = tr('匝數越多，圓心的磁場越強', 'More turns, a stronger field at the center'); s.mc = YELLOW; }
    }
    return s;
  }
  function drawShape(ctx, step, t) {
    const s = shapeState(step, t);
    const R = SH.R, k = s.bend;
    const c = cam(lerp(510, SH.cx, k), lerp(268, SH.cy, k), SH.e, 1, 2400, lerp(-34 * DEG, 0, easeIO(seg(k, 0, 0.7))));
    const Lw = TAU * R * (1 - 0.035);
    const ringQs = [];
    for (let i = 0; i < SH.nRing; i++) ringQs.push(wireAt(R, k, -Lw / 2 + Lw * (i + 0.5) / SH.nRing));
    const ro = { alpha: s.ringA, dir: 1, amp: s.ringAmp, t, dots: s.ringAmp > 0.5, innerColor: s.inner > 0.5 ? YELLOW : GREEN, innerSize: 11 + 5 * s.inner };
    // 多匝：上下疊放
    const nT = step === 4 ? 3 : 1, alphas = [1, s.turn2, s.turn3], ys = step === 4 ? [0, 16, -16] : [0];
    const wires = ys.map((y0, i) => ({ pts: wireGeom(R, k, y0), a: alphas[i] })).slice(0, nT);
    const wO = (part, a) => ({ part, amp: 1, dir: 1, t, alpha: a, arrows: [2 / 12, 5 / 12, 7 / 12, 10 / 12] });
    const fieldOn = s.fieldA > 0.01;
    // 後層
    if (fieldOn) wires.forEach(w => drawWire(ctx, c, w.pts, wO('back', w.a)));
    ringQs.forEach(q => drawRingAround(ctx, c, q, SH.ringR, ro, 'back'));
    drawFieldLines(ctx, c, { R, alpha: s.fieldA, dir: 1, amp: 1, t, dots: true });
    // 圓心的合成粗箭頭
    if (s.bigA > 0.01) {
      const len = 70 + 48 * (s.turns - 1), a = P(c, 0, -len, 0), b = P(c, 0, len + 10, 0);
      ctx.save(); ctx.globalAlpha = s.bigA; drawArrow3D(ctx, a.x, a.y, b.x, b.y, GREEN, 10 + 3 * (s.turns - 1), 22); ctx.restore();
    }
    if (!fieldOn) wires.forEach(w => drawWire(ctx, c, w.pts, wO('all', w.a)));
    else wires.forEach(w => drawWire(ctx, c, w.pts, wO('front', w.a)));
    ringQs.forEach(q => drawRingAround(ctx, c, q, SH.ringR, ro, 'front'));
    // 圈內側箭頭滑向圓心
    if (s.slide >= 0 && s.slide < 1) {
      ringQs.forEach((q, i) => {
        const u = easeIO(clamp(s.slide * 1.25 - (i % 4) * 0.06, 0, 1));
        const n = [q.uz, 0, -q.ux], ix = q.x + SH.ringR * n[0], iz = q.z + SH.ringR * n[2];
        const x = lerp(ix, 0, u), z = lerp(iz, 0, u), y = lerp(0, -20 + (i % 5) * 12, u);
        const p = P(c, x, y - 10, z), p2 = P(c, x, y + 10, z);
        ctx.save(); ctx.globalAlpha = 1 - seg(u, 0.85, 1); ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        arrowHead(ctx, p2.x, p2.y, -Math.PI / 2, YELLOW, 13); ctx.restore();
      });
    }
    // ── 標籤 ──
    if (k < 0.05) {
      const q = wireAt(R, 0, -Lw / 2 + Lw * 7 / 12), p = P(c, q.x, 0, q.z);
      txt(ctx, 'I', p.x + 16, p.y + 30, ORANGE, 1, 28);
      if (s.ringA > 0.5) { const q2 = ringQs[4], pr = P(c, q2.x, SH.ringR + 8, q2.z); tag(ctx, tr('環形磁場 B', 'Ring-shaped field B'), pr.x, pr.y - 30, GREEN, s.ringA); }
    }
    if (s.inner > 0.01 && step === 2) {
      const q = ringQs[6], n = [q.uz, 0, -q.ux], p = P(c, q.x + SH.ringR * n[0], 0, q.z + SH.ringR * n[2]);
      const ta = s.inner * (1 - seg(t, 3.0, 3.6));
      leader(ctx, 200, 160, p.x, p.y - 20, YELLOW, ta);
      tag(ctx, tr('圈內側：B 向上', 'Inner side: B up'), 160, 140, YELLOW, ta);
    }
    if (s.bigA > 0.01 && step === 2) {
      const b = P(c, 0, 80, 0);
      tag(ctx, tr('圓心：同向疊加', 'Center: all add up'), b.x - 6, b.y - 60, GREEN, s.bigA * (1 - s.inset));
    }
    if (s.inset > 0.01) {
      card(ctx, 690, 74, 290, 390, s.inset);
      txt(ctx, tr('從上往下看', 'Seen from above'), 835, 108, CHALK, s.inset, 24);
      topLoopInset(ctx, 835, 262, 88, 1, s.inset, { marks: s.marks, pad: 30 });
      const l1 = tr('• 圈內：B 向上', '• Inside: B up'), l2 = tr('× 圈外：B 向下', '× Outside: B down');
      txt(ctx, l1, 835, 400, GREEN, s.marks, fitSize(ctx, l1, 270, 24, 22));
      txt(ctx, l2, 835, 438, PINK, s.marks, fitSize(ctx, l2, 270, 24, 22));
    }
    if (s.tagIn > 0.01) {
      const p = P(c, 0, 40, 0);
      leader(ctx, 600, 104, p.x + 14, p.y, YELLOW, s.tagIn);
      tag(ctx, tr('圓心：最密、最強', 'Center: densest, strongest'), 760, 104, YELLOW, s.tagIn);
    }
    if (s.tagOut > 0.01) {
      const p = P(c, -R * 1.75, -R * 0.45, 0);
      leader(ctx, 150, 470, p.x, p.y, PINK, s.tagOut);
      tag(ctx, tr('圈外：分散、較弱', 'Outside: spread out, weaker'), 175, 498, PINK, s.tagOut);
    }
    if (s.meter > 0.01) {
      card(ctx, 760, 74, 220, 470, s.meter);
      const nm = Math.round(s.turns);
      const l0 = tr('圓心磁場', 'Center field');
      txt(ctx, l0, 870, 108, CHALK, s.meter, fitSize(ctx, l0, 200, 24, 22));
      const base = 470, unit = 100;
      ctx.save(); ctx.globalAlpha = s.meter;
      ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 2;
      for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(820, base - unit * j); ctx.lineTo(920, base - unit * j); ctx.stroke(); }
      const hgt = unit * s.turns, g = ctx.createLinearGradient(0, base - hgt, 0, base);
      g.addColorStop(0, '#d8ffc0'); g.addColorStop(1, GREEN);
      ctx.fillStyle = g; rrect(ctx, 840, base - hgt, 60, hgt, 8); ctx.fill();
      ctx.restore();
      for (let j = 1; j <= 3; j++) txt(ctx, '×' + j, 950, base - unit * j, j <= nm ? YELLOW : 'rgba(242,236,217,0.55)', s.meter, 22);
      const lt = tr(nm + ' 匝', nm + (nm > 1 ? ' turns' : ' turn'));
      txt(ctx, lt, 870, base + 34, ORANGE, s.meter, 26);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁場 B', 'Field B'), 1]]);
  }

  // ═════════ 場景 2：線圈的右手定則 ═════════
  const RU = { cx: 360, cy: 322, e: 24 * DEG, R: 165, hk: 1.15, hy: 95 };
  // 電流反轉（u：0→1），舊手離開、新手翻面回來
  function flipState(u, dFrom) {
    const dTo = -dFrom, o = { hands: [] };
    o.cur = u < 0.5 ? dFrom * (1 - easeIO(seg(u, 0.18, 0.36))) : dTo * easeIO(seg(u, 0.42, 0.6));
    const a1 = 1 - seg(u, 0.22, 0.38);
    if (a1 > 0) o.hands.push({ sg: dFrom, curl: 1 - 0.9 * easeIO(seg(u, 0, 0.2)), slide: 120 * easeIO(seg(u, 0.08, 0.36)), alpha: a1 });
    const a2 = seg(u, 0.42, 0.56);
    if (a2 > 0) o.hands.push({ sg: dTo, curl: 0.1 + 0.9 * easeIO(seg(u, 0.72, 0.96)), slide: 120 * (1 - easeIO(seg(u, 0.44, 0.72))), alpha: a2 });
    return o;
  }
  function ruleState(step, t) {
    const s = { cur: 1, hands: [], bA: 0, poles: 0, fieldA: 0, inset: 0, thumbTag: 0, fingerTag: 0, needles: 0, needleU: 99, flipAt: -1, disc: 0, cmp: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.cur = seg(t, 0.2, 1.0);
      s.hands = [{ sg: 1, curl: 0.1 + 0.9 * easeIO(seg(t, 2.6, 4.6)), slide: 130 * (1 - easeIO(seg(t, 1.0, 2.8))), alpha: seg(t, 0.8, 1.6) }];
      s.fingerTag = easeIO(seg(t, 4.6, 5.2)); s.thumbTag = easeIO(seg(t, 6.4, 7.0));
      if (t < 2.6) { s.msg = tr('圓線圈通電：從上往下看，電流逆時針流', 'Current in a loop: seen from above, it flows counter-clockwise'); s.mc = ORANGE; }
      else if (t < 6.4) { s.msg = tr('右手四指順著電流的方向彎曲', 'Curl the fingers of your right hand along the current'); s.mc = ORANGE; }
      else { s.msg = tr('伸直的大拇指＝圓心的磁場方向', 'The outstretched thumb = the field direction at the center'); s.mc = GREEN; }
    } else if (step === 1) {
      s.hands = [{ sg: 1, curl: 1, slide: 0, alpha: 1 - 0.6 * easeIO(seg(t, 0.8, 2.0)) }];
      s.thumbTag = 1 - seg(t, 0.4, 1.0); s.bA = easeIO(seg(t, 0.6, 1.8)); s.poles = easeIO(seg(t, 2.2, 3.0));
      s.fieldA = 0.55 * easeIO(seg(t, 3.0, 4.2)); s.inset = easeIO(seg(t, 4.4, 5.2));
      if (t < 2.2) { s.msg = tr('大拇指朝上：圓心的磁場 B 向上', 'Thumb up: the field B at the center points up'); s.mc = GREEN; }
      else { s.msg = tr('B 從上方出來：上方是 N 極、下方是 S 極', 'B comes out the top: the top is N, the bottom is S'); s.mc = POLE_N; }
    } else if (step === 2) {
      const f = flipState(seg(t, 0.2, 7.2), 1);
      s.cur = f.cur; s.hands = f.hands; s.bA = 1; s.poles = 1; s.fieldA = 0.55; s.inset = 1;
      if (s.hands.length === 1 && s.hands[0].sg < 0) s.hands[0].alpha *= 1 - 0.55 * easeIO(seg(t, 7.8, 8.6));
      s.thumbTag = easeIO(seg(t, 7.0, 7.6));
      if (t < 2.6) { s.msg = tr('把電流反過來：從上往下看變成順時針', 'Reverse the current: seen from above it is now clockwise'); s.mc = ORANGE; }
      else if (t < 6.4) { s.msg = tr('右手跟著翻過來，四指順著新的電流', 'Turn the right hand over so the fingers follow the new current'); s.mc = ORANGE; }
      else { s.msg = tr('大拇指朝下：B 向下，下方變成 N 極', 'Thumb down: B points down, so the bottom becomes N'); s.mc = POLE_N; }
    } else if (step === 3) {
      s.flipAt = 4.4;
      const u = seg(t, s.flipAt - 0.4, s.flipAt + 0.6);
      s.cur = u < 0.4 ? -(1 - seg(u, 0, 0.4)) : seg(u, 0.4, 1);
      s.hands = [{ sg: -1, curl: 1, slide: 0, alpha: 0.4 * (1 - seg(t, 0, 0.8)) }];
      s.bA = 0.35; s.poles = 1; s.fieldA = 0.6; s.inset = 1;
      s.needles = easeIO(seg(t, 0.4, 1.2)); s.needleU = t - (s.flipAt + 0.1);
      if (t < 2.4) { s.msg = tr('用小磁針驗證：紅色 N 端指向磁場 B 的方向', 'Check with compasses: the red N end points along B'); s.mc = CYAN; }
      else if (t < s.flipAt) { s.msg = tr('順時針：線圈內的小磁針 N 端朝下', 'Clockwise: the compass inside the loop points its N end down'); s.mc = CYAN; }
      else { s.msg = tr('電流再反向：小磁針全部翻轉，上方又變回 N 極', 'Reverse again: every needle flips, and the top is N once more'); s.mc = YELLOW; }
    } else {
      s.cur = 1; s.bA = 0.6; s.poles = 1; s.fieldA = 0.7; s.disc = easeIO(seg(t, 0.4, 2.0)); s.cmp = easeIO(seg(t, 2.4, 3.2));
      s.msg = tr('通電的圓線圈，就像一塊薄薄的圓盤磁鐵', 'A loop carrying current acts like a thin disc magnet'); s.mc = YELLOW;
    }
    return s;
  }
  // 小磁針指向（畫面角度）：依 Biot–Savart 的 B 方向，電流反向則轉 180°
  const NEEDLES = [[0, 0.95], [0, -0.95], [1.5, 0], [-1.5, 0], [0, 0]];
  function needleAng(c, R, nx, ny, d) {
    const b = unitB(nx, ny), p = P(c, nx * R, ny * R, 0), q = P(c, (nx + b[0] * d * 0.05) * R, (ny + b[1] * d * 0.05) * R, 0);
    return Math.atan2(q.y - p.y, q.x - p.x);
  }
  function drawRule(ctx, step, t) {
    const s = ruleState(step, t);
    const R = RU.R, c = cam(RU.cx, RU.cy, RU.e, 1, 2400);
    const d = s.cur >= 0 ? 1 : -1, amp = Math.abs(s.cur);
    const pts = wireGeom(R, 1, 0);
    const hands = s.hands.map(h => Object.assign({ yc: h.sg > 0 ? RU.hy : -RU.hy, k: RU.hk }, h));
    const wO = part => ({ part, amp, dir: d, t, arrows: [0.125, 0.375, 0.625, 0.875] });
    // 後層：後半圈導線 → 磁力線 → 圓盤 → 圓心 B → 手 → 前半圈導線
    drawWire(ctx, c, pts, wO('back'));
    drawFieldLines(ctx, c, { R, alpha: s.fieldA, dir: d, amp, t, dots: true });
    if (s.disc > 0.01) {
      const th = 12, a = s.disc;
      const ring = (y) => { const o = []; for (let i = 0; i <= 72; i++) { const q = i / 72 * TAU; o.push(P(c, R * 0.97 * Math.cos(q), y, R * 0.97 * Math.sin(q))); } return o; };
      const top = ring(th), mid = ring(0), bot = ring(-th);
      const nTop = d > 0;   // 逆時針：上 N
      ctx.save(); ctx.globalAlpha = a;
      // 側面（前半）：上半一色、下半一色
      const band = (A, B, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= 36; i++) { const p = A[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } for (let i = 36; i >= 0; i--) ctx.lineTo(B[i].x, B[i].y); ctx.closePath(); ctx.fill(); };
      band(mid, bot, nTop ? 'rgba(114,185,255,0.75)' : 'rgba(255,111,118,0.75)');
      band(top, mid, nTop ? 'rgba(255,111,118,0.75)' : 'rgba(114,185,255,0.75)');
      ctx.fillStyle = nTop ? 'rgba(255,111,118,0.32)' : 'rgba(114,185,255,0.32)';
      polyline(ctx, top); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(242,236,217,0.6)'; ctx.lineWidth = 2; polyline(ctx, top); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    if (s.bA > 0.01 && amp > 0.05) {
      const a = P(c, 0, -d * 185, 0), b = P(c, 0, d * 205, 0);
      ctx.save(); ctx.globalAlpha = s.bA * amp; drawArrow3D(ctx, a.x, a.y, b.x, b.y, GREEN, 9, 20); ctx.restore();
    }
    hands.forEach(h => drawHand(ctx, c, h, 'back'));
    hands.forEach(h => drawHand(ctx, c, h, 'front'));
    drawWire(ctx, c, pts, wO('front'));
    // 小磁針
    if (s.needles > 0.01) {
      NEEDLES.forEach(([nx, ny]) => {
        const p = P(c, nx * R, ny * R, 0);
        // 翻轉前：順時針（d = −1）的 B；翻轉後轉 180° 成逆時針的 B（含回擺）
        const aOld = needleAng(c, R, nx, ny, -1);
        const kk = s.needleU < 0 ? 0 : s.needleU > 30 ? 1 : 1 - Math.exp(-2.6 * s.needleU) * Math.cos(4.2 * s.needleU);
        const ang = aOld + Math.PI * kk;
        needle2D(ctx, p.x, p.y, ang, s.needles, nx === 0 && ny === 0 ? 24 : 28);
      });
    }
    // ── 標籤 ──
    const topP = P(c, 0, 250, 0), botP = P(c, 0, -228, 0);
    if (s.poles > 0.01) {
      const nUp = d > 0;
      poleBadge(ctx, topP.x, topP.y, nUp, s.poles);
      poleBadge(ctx, botP.x, botP.y, !nUp, s.poles);
      const lt = nUp ? tr('N 極', 'N pole') : tr('S 極', 'S pole'), lb = nUp ? tr('S 極', 'S pole') : tr('N 極', 'N pole');
      const wt = textW(ctx, lt, 24), wb = textW(ctx, lb, 24);
      tag(ctx, lt, topP.x + 44 + wt / 2, topP.y, nUp ? POLE_N : POLE_S, s.poles);
      tag(ctx, lb, botP.x + 44 + wb / 2, botP.y, nUp ? POLE_S : POLE_N, s.poles);
    }
    if (hands.length === 1) {
      const h = hands[0];
      if (s.fingerTag > 0.01) {
        const fp = handFingerPt(c, h);
        const tx = 160, ty = h.sg > 0 ? 150 : 470;
        leader(ctx, tx, ty + (h.sg > 0 ? 18 : -18), fp.x, fp.y, ORANGE, s.fingerTag * h.alpha);
        tag(ctx, tr('四指＝電流方向', 'Fingers = current'), tx, ty, ORANGE, s.fingerTag * h.alpha);
      }
      if (s.thumbTag > 0.01) {
        const tp = handTipPt(c, h), ta = s.thumbTag * Math.min(1, h.alpha / 0.4), lt = tr('大拇指＝圓心 B', 'Thumb = center B');
        if (handImgReady()) {
          // 圖片手：拇指朝上時標在拇指尖右側；朝下時標在拇指尖下方（手的左下、N/S 標籤的左邊）
          const w = textW(ctx, lt, 24) + 20;
          const tx = h.sg > 0 ? tp.x + 34 + w / 2 : 150, ty = h.sg > 0 ? tp.y + 6 : 516;
          if (h.sg > 0) leader(ctx, tx - w / 2, ty, tp.x + 8, tp.y + 2, GREEN, ta);
          else leader(ctx, Math.min(tx + w / 2 - 24, tp.x - 6), ty - 18, tp.x, tp.y + 6, GREEN, ta);
          tag(ctx, lt, tx, ty, GREEN, ta);
        } else {
          const tx = h.sg > 0 ? 590 : 545, ty = h.sg > 0 ? 120 : 452;
          leader(ctx, tx - 110, ty, tp.x + 10, tp.y, GREEN, ta);
          tag(ctx, lt, tx, ty, GREEN, ta);
        }
      }
    }
    if (s.needles > 0.01 && step === 3) {
      const p = P(c, 1.5 * R, 0, 0), ta = s.needles * seg(t, 1.6, 2.2);
      leader(ctx, 575, 404, p.x, p.y + 30, CYAN, ta);
      tag(ctx, tr('圈外：方向相反', 'Outside: opposite'), 560, 424, CYAN, ta, 22);
    }
    // 右側說明卡
    const panelA = s.inset * (1 - s.cmp);
    if (panelA > 0.01) {
      card(ctx, 690, 74, 290, 400, panelA);
      txt(ctx, tr('從上往下看', 'Seen from above'), 835, 108, CHALK, panelA, 24);
      topLoopInset(ctx, 835, 238, 80, d, panelA);
      const l1 = d > 0 ? tr('電流逆時針', 'Counter-clockwise') : tr('電流順時針', 'Clockwise');
      const l2 = d > 0 ? tr('圓心 B：• 向上', 'Center B: • up') : tr('圓心 B：× 向下', 'Center B: × down');
      const l3 = d > 0 ? tr('上方是 N 極', 'N pole on top') : tr('下方是 N 極', 'N pole at the bottom');
      txt(ctx, l1, 835, 368, ORANGE, panelA, fitSize(ctx, l1, 270, 24, 22));
      txt(ctx, l2, 835, 406, GREEN, panelA, fitSize(ctx, l2, 270, 24, 22));
      txt(ctx, l3, 835, 444, POLE_N, panelA, fitSize(ctx, l3, 270, 24, 22));
    }
    if (s.cmp > 0.01) {
      card(ctx, 690, 74, 290, 470, s.cmp);
      txt(ctx, tr('從上往下看', 'Seen from above'), 835, 104, CHALK, s.cmp, 24);
      [[1, 190], [-1, 395]].forEach(([dd, yy]) => {
        topLoopInset(ctx, 835, yy, 44, dd, s.cmp, { pad: 14 });
        const a = dd > 0 ? tr('逆時針', 'Counter-clockwise') : tr('順時針', 'Clockwise');
        const b = dd > 0 ? tr('→ 上 N、下 S', '→ N top, S bottom') : tr('→ 下 N、上 S', '→ N bottom, S top');
        txt(ctx, a, 835, yy + 78, ORANGE, s.cmp, fitSize(ctx, a, 270, 24, 22));
        txt(ctx, b, 835, yy + 114, POLE_N, s.cmp, fitSize(ctx, b, 270, 24, 22));
      });
    }
    if (s.disc > 0.01) {
      const p = P(c, -R * 0.97, 0, 0);
      tag(ctx, tr('薄圓盤磁鐵', 'Thin disc magnet'), p.x - 30, p.y + 62, YELLOW, s.disc);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁場 B', 'Field B'), 1], ['compass', tr('小磁針（紅＝N）', 'Compass (red = N)'), step === 3 ? 1 : 0]]);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'loop-shape': {
      draw: drawShape,
      steps: [
        { d: 7.0, b: ['直導線', 'Wire'],
          cap: ['長直導線通電時，周圍有<strong class="accent-green">環形磁場</strong>；導線上每一小段都被自己的磁場環圍著。',
                'A current-carrying straight wire is surrounded by <strong class="accent-green">ring-shaped fields</strong>; every little piece of wire has its own ring.'] },
        { d: 9.0, b: ['彎成圓', 'Bend'],
          cap: ['把長直導線彎成<strong class="accent-cyan">封閉的圓形線圈</strong>：磁場環跟著導線，<strong class="accent-orange">向圈內靠攏</strong>。',
                'Bend the wire into a <strong class="accent-cyan">closed circular coil</strong>: the field rings follow the wire and <strong class="accent-orange">squeeze inward</strong>.'] },
        { d: 10.0, b: ['同向疊加', 'Add up'],
          cap: ['在線圈的<strong class="accent-yellow">中心區域</strong>，每一段產生的磁場方向都相同，<strong class="accent-green">同向疊加</strong>成很強的磁場。',
                'In the <strong class="accent-yellow">center</strong> of the coil, every segment\'s field points the same way, so they <strong class="accent-green">add up</strong> to a strong field.'] },
        { d: 8.0, b: ['內強外弱', 'Strong core'],
          cap: ['磁力線從圓心穿過、再從外側繞回：<strong class="accent-yellow">圓心最密、最強</strong>，<strong class="accent-pink">圈外分散、較弱</strong>。線圈的磁場就是許多小段直導線磁場的加總。',
                'Field lines go up through the center and loop back outside: <strong class="accent-yellow">densest and strongest at the center</strong>, <strong class="accent-pink">spread out and weaker outside</strong>. The coil\'s field is the sum of many short straight-wire fields.'] },
        { d: 8.0, b: ['匝數', 'Turns'],
          cap: ['同樣的電流，<strong class="accent-orange">匝數</strong>越多，圓心的磁場越強：2 匝約是 1 匝的 2 倍。',
                'With the same current, more <strong class="accent-orange">turns</strong> give a stronger field at the center: 2 turns give about twice the field of 1.'] }
      ]
    },
    'loop-rule': {
      draw: drawRule,
      steps: [
        { d: 9.0, b: ['右手', 'Right hand'],
          cap: ['線圈的右手定則：讓<strong class="accent-orange">四指彎曲</strong>順著<strong class="accent-orange">電流環繞</strong>的方向，伸直的<strong class="accent-green">大拇指</strong>就是圓心的磁場方向。',
                'Right-hand rule for a coil: curl your <strong class="accent-orange">four fingers</strong> along the <strong class="accent-orange">circulating current</strong>; the outstretched <strong class="accent-green">thumb</strong> gives the field at the center.'] },
        { d: 8.0, b: ['上方 N', 'N on top'],
          cap: ['從上往下看電流<strong class="accent-orange">逆時針</strong>：大拇指朝上，圓心 B 向上，<strong class="accent-red">上方是 N 極</strong>、<strong class="accent-blue">下方是 S 極</strong>。',
                'Seen from above, the current is <strong class="accent-orange">counter-clockwise</strong>: thumb up, B up at the center, so the <strong class="accent-red">top is N</strong> and the <strong class="accent-blue">bottom is S</strong>.'] },
        { d: 9.0, b: ['反向', 'Reverse'],
          cap: ['電流改成<strong class="accent-orange">順時針</strong>：右手翻過來、大拇指朝下，圓心 B 向下，<strong class="accent-red">下方變成 N 極</strong>。',
                'Make the current <strong class="accent-orange">clockwise</strong>: turn the right hand over, thumb down, B points down, and the <strong class="accent-red">bottom becomes N</strong>.'] },
        { d: 9.0, b: ['小磁針', 'Compass'],
          cap: ['小磁針的<strong class="accent-red">紅色 N 端</strong>順著磁場 B 排列：線圈內與上下方同向，圈外方向相反。電流一反向，小磁針就全部翻轉。',
                'Each compass\'s <strong class="accent-red">red N end</strong> lines up with B: the same way inside and along the axis, the opposite way outside the loop. Reverse the current and every needle flips.'] },
        { d: 8.0, b: ['圓盤磁鐵', 'Disc magnet'],
          cap: ['通電的圓線圈就像一塊<strong class="accent-yellow">薄薄的圓盤磁鐵</strong>：<strong class="accent-orange">四指順著電流</strong>，<strong class="accent-green">大拇指指向 N 極</strong>。',
                'A loop carrying current acts like a <strong class="accent-yellow">thin disc magnet</strong>: <strong class="accent-orange">fingers follow the current</strong>, <strong class="accent-green">thumb points to the N pole</strong>.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  // 老師講解模式（AGENTS 10.7）的播放設定：模組層級，activate() 換場景時不重設
  const CTL = { paused: false, loop: true, endFn: null, ended: false };

  function canvasCtx() { const c = document.getElementById('loopCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = YELLOW; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t);
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i]);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('loopResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-loop');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-loop'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => { S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; CTL.ended = false; render(); start(); });
      row.appendChild(b);
    });
  }

  function visible() { const c = document.getElementById('loopCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      if (CTL.loop) S.t = 0;
      else {
        S.t = sc.total; render();
        if (!CTL.ended) { CTL.ended = true; if (typeof CTL.endFn === 'function') { try { CTL.endFn(S.scene); } catch (e) { console.error(e); } } }
        return;
      }
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden || CTL.paused) return;
    if (!CTL.loop && S.t >= SCENES[S.scene].total) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (S.scene) start();
  });

  EmAnim.loop = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'loop-shape';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; CTL.ended = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-loop'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    ctl: {
      pause() { CTL.paused = true; stop(); if (S.scene) render(); },
      resume() { CTL.paused = false; S.last = 0; start(); },
      paused() { return CTL.paused; },
      setLoop(v) { CTL.loop = !!v; if (CTL.loop) { CTL.ended = false; start(); } },
      onEnd(fn) { CTL.endFn = typeof fn === 'function' ? fn : null; },
      restart() { if (!S.scene) return; stop(); CTL.paused = false; CTL.ended = false; S.t = 0; S.step = -1; S.last = 0; render(); start(); },
      progress() { const sc = S.scene && SCENES[S.scene]; return { t: S.t, total: sc ? sc.total : 0, step: S.step, steps: sc ? sc.steps.length : 0 }; }
    },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf, handImg: handImgReady() }; }
  };
})();
