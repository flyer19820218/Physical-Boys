/* electromagnetism_2_solenoid_1104_v1.js — 「螺線管」分頁動畫（#solenoidCanvas，1000×600）
 *
 * 契約：window.EmAnim.solenoid = { activate(sceneId), deactivate(), relang(), ctl, _frameAt, _info, _state }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 立體投影、線圈、右手、小磁針、磁力線、長條磁鐵都在本檔自己畫。畫布不綁任何事件；唯一控制是 #steps-solenoid 的步驟鈕。
 *
 * 座標約定（世界座標，單位 px）：x 向右、y 向上、z 朝向觀看者；螺線管水平放置，軸沿 x，中心在原點。
 *   線圈上的點 (x, R cosθ, R sinθ)，導線參數 u 遞增時 θ = π − u 遞減：從底部 → 正面（z = +R）→ 頂部 → 背面。
 *   電流 dir = +1 沿 u 遞增：正面那一段電流「向上」→ 繞 −x 軸逆時針 → 內部 B 向左 → 左端 N、右端 S。
 *   dir = −1：正面電流向下 → 內部 B 向右 → 右端 N、左端 S。（與頁面上的課本圖一致；舊版畫反了，這裡依簡報重做。）
 *   磁力線：把螺線管看成 80 個等距圓線圈（完全橢圓積分的解析式），在通過軸、面向觀看者的 z = 0 平面上用 RK4 描線。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * sol-shape 什麼是螺線管，共 43 s
 *   1 一個線圈  8 s  一個通電圓線圈：中心 B 穿過圈面；轉到正面看：正面電流向上、中心 B 向左
 *   2 繞成管    9 s  線圈複製成一列（各自的 B 都向左）→ 連續繞成螺線管，接上導線
 *   3 同向疊加  9 s  每一圈在內部的 B 同向 → 疊加成平行、等距的磁力線：內部強而均勻
 *   4 右手      9 s  右手握住：四指順著正面電流（向上）彎，大拇指＝內部 B（向左）→ 左 N、右 S
 *   5 像磁鐵    8 s  管子染成左紅右藍：通電螺線管就像一根長條磁鐵；右側卡片對照
 * sol-field 疊加的強大磁場，共 42 s
 *   1 內部      8 s  內部磁力線平行均勻、由 S 指向 N
 *   2 外部繞回  9 s  磁力線從 N 端出來、在外面彎回 S 端；內外連成封閉曲線
 *   3 小磁針    8 s  小磁針（紅＝N）擺動後順著磁力線排列；外部 N→S，與內部相反
 *   4 反向      9 s  電流反向：磁力線形狀不變、方向相反，小磁針全部翻轉，右端變 N
 *   5 比一比    8 s  電流改回來；螺線管淡出換成長條磁鐵，磁力線幾乎一模一樣；再疊回螺線管
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
      else if (kind === 'B') { ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 12, y); ctx.stroke(); arrowHead(ctx, xx + gw - 12, y, 0, GREEN, 10); }
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
  // 磁極圓章（k：縮放，用在 N／S 對調時縮小再長回來）
  function poleBadge(ctx, x, y, isN, a, k = 1) {
    if (a <= 0.01 || k <= 0.05) return;
    const col = isN ? POLE_N : POLE_S, r = 22 * k;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    if (k > 0.85) txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 26);
  }
  const rgbaN = a => `rgba(255,111,118,${a})`, rgbaS = a => `rgba(114,185,255,${a})`;

  // ═════════ 立體投影 ═════════
  // e：俯角；phi：繞鉛直軸的方位角（> 0 時右端較靠近觀看者，看得到右端的管口）
  function cam(cx, cy, e, s = 1, D = 2400, phi = 0) { return { cx, cy, s, D, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(phi), sp: Math.sin(phi) }; }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f };
  }

  // ═════════ 螺線管幾何 ═════════
  const SR = 75, SL = 440, NT = 10, PITCH = SL / NT, NU = 56, LEAD = 70;
  const XK = k => -SL / 2 + PITCH * (k + 0.5);
  // 第 k 圈：xc 為這一圈的中心；m：0＝獨立的圓線圈 → 1＝螺旋（與相鄰的圈首尾相接）
  function turnPts(xc, m) {
    const out = [];
    for (let i = 0; i <= NU; i++) {
      const u = i / NU * TAU, th = Math.PI - u;
      out.push({ x: xc + m * PITCH * (u / TAU - 0.5), y: SR * Math.cos(th), z: SR * Math.sin(th) });
    }
    return out;
  }
  function leadPts(side) {      // 依電流 dir = +1 的流向排列：左導線由下往上、右導線由上往下
    const x = side < 0 ? -SL / 2 : SL / 2, a = [];
    for (let i = 0; i <= 8; i++) a.push({ x, y: -SR - LEAD * (1 - i / 8), z: 0 });
    return side < 0 ? a : a.reverse();
  }
  function screenLen(c, pts) { let s = 0, p0 = null; for (const q of pts) { const p = P(c, q.x, q.y, q.z); if (p0) s += Math.hypot(p.x - p0.x, p.y - p0.y); p0 = p; } return s; }
  // part：'all' | 'back'（z < 0）| 'front'；amp：電流亮度；off：這段在整條導線上的螢幕起點（讓流動虛線前後接得上）
  function drawWire(ctx, c, pts, o) {
    const part = o.part || 'all', al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01 || pts.length < 2) return;
    const proj = pts.map(q => P(c, q.x, q.y, q.z)), cum = [0];
    for (let i = 1; i < proj.length; i++) cum.push(cum[i - 1] + Math.hypot(proj[i].x - proj[i - 1].x, proj[i].y - proj[i - 1].y));
    const runs = []; let cur = null;
    pts.forEach((q, i) => {
      const ok = part === 'all' || (part === 'back' ? q.z < -0.5 : q.z >= -0.5);
      if (ok) { if (!cur) { cur = { i0: i > 0 ? i - 1 : i, p: [] }; if (i > 0) cur.p.push(proj[i - 1]); } cur.p.push(proj[i]); }
      else if (cur) { cur.p.push(proj[i]); runs.push(cur); cur = null; }
    });
    if (cur) runs.push(cur);
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const w = o.w || 8;
    for (const r of runs) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; polyline(ctx, r.p); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = part === 'back' ? '#8a5a3a' : '#b4744a'; ctx.lineWidth = w; polyline(ctx, r.p); ctx.stroke(); }
    if (part !== 'back') for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.4)'; ctx.lineWidth = w * 0.25; ctx.beginPath(); r.p.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    const amp = o.amp || 0;
    if (amp > 0.01) {
      ctx.globalAlpha = al * amp * (part === 'back' ? 0.55 : 1); ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
      ctx.setLineDash([12, 20]);
      for (const r of runs) { ctx.lineDashOffset = (o.off || 0) + cum[r.i0] - (o.dir || 1) * (o.t || 0) * 70; polyline(ctx, r.p); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // 整組線圈：turns[k] = { pts, a }；leads：導線透明度
  function coilModel(c, xcs, m, alphas, leadA) {
    const turns = xcs.map((xc, k) => ({ pts: turnPts(xc, m), a: alphas[k] }));
    const L0 = leadPts(-1), L1 = leadPts(1);
    const pieces = [{ pts: L0, a: leadA }].concat(turns).concat([{ pts: L1, a: leadA }]);
    let off = 0; pieces.forEach(p => { p.off = off; off += screenLen(c, p.pts); });
    return { turns, pieces };
  }
  function drawCoil(ctx, c, cm, part, o) {
    cm.pieces.forEach(p => drawWire(ctx, c, p.pts, { part, alpha: p.a * (o.alpha === undefined ? 1 : o.alpha), amp: o.amp, dir: o.dir, t: o.t, off: p.off }));
  }
  // 正面每一圈中段（u = π/2）與兩條導線上的電流箭頭
  function drawCurArrows(ctx, c, cm, dir, amp, alpha = 1) {
    if (amp <= 0.05 || alpha <= 0.01) return;
    const at = (pts, i, a) => {
      if (a <= 0.01) return;
      const q = pts[i], q2 = pts[clamp(i + dir, 0, pts.length - 1)], p = P(c, q.x, q.y, q.z), p2 = P(c, q2.x, q2.y, q2.z);
      ctx.save(); ctx.globalAlpha = a * amp * alpha; arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), ORANGE, 14); ctx.restore();
    };
    cm.turns.forEach(tn => at(tn.pts, NU / 4, tn.a));
    at(cm.pieces[0].pts, 4, cm.pieces[0].a);
    at(cm.pieces[cm.pieces.length - 1].pts, 4, cm.pieces[cm.pieces.length - 1].a);
  }

  // ═════════ 管子（半透明圓筒）與長條磁鐵 ═════════
  function ringScreen(c, x, r, n = 72) { const o = []; for (let i = 0; i < n; i++) { const th = i / n * TAU; o.push(P(c, x, r * Math.cos(th), r * Math.sin(th))); } return o; }
  function outerArc(R, wantMax) {          // 由最上點走到最下點、靠外側的那半圈
    let it = 0, ib = 0; R.forEach((p, i) => { if (p.y < R[it].y) it = i; if (p.y > R[ib].y) ib = i; });
    const n = R.length, a1 = [], a2 = [];
    for (let i = it; ; i = (i + 1) % n) { a1.push(R[i]); if (i === ib) break; }
    for (let i = it; ; i = (i - 1 + n) % n) { a2.push(R[i]); if (i === ib) break; }
    const mx = a => a.reduce((s, p) => s + p.x, 0) / a.length;
    return (wantMax ? mx(a1) >= mx(a2) : mx(a1) <= mx(a2)) ? a1 : a2;
  }
  function tubePath(ctx, c, r, x0, x1) {
    const A = ringScreen(c, x0, r), B = ringScreen(c, x1, r), aA = outerArc(A, false), aB = outerArc(B, true);
    ctx.beginPath(); ctx.moveTo(aA[0].x, aA[0].y); ctx.lineTo(aB[0].x, aB[0].y);
    aB.forEach(p => ctx.lineTo(p.x, p.y));
    for (let i = aA.length - 1; i >= 0; i--) ctx.lineTo(aA[i].x, aA[i].y);
    ctx.closePath();
    return B;
  }
  const TX0 = -SL / 2 - 10, TX1 = SL / 2 + 10, TR = SR - 5;
  function drawTube(ctx, c, a, tint = 0, nLeft = true) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const B = tubePath(ctx, c, TR, TX0, TX1);
    const top = P(c, 0, TR, 0), bot = P(c, 0, -TR, 0), g = ctx.createLinearGradient(0, top.y, 0, bot.y);
    g.addColorStop(0, 'rgba(190,225,235,0.24)'); g.addColorStop(0.4, 'rgba(150,195,210,0.12)'); g.addColorStop(1, 'rgba(110,150,170,0.2)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(242,236,217,0.32)'; ctx.lineWidth = 2; ctx.stroke();
    if (tint > 0.01) {
      tubePath(ctx, c, TR, TX0, 0); ctx.fillStyle = nLeft ? rgbaN(0.4 * tint) : rgbaS(0.4 * tint); ctx.fill();
      tubePath(ctx, c, TR, 0, TX1); ctx.fillStyle = nLeft ? rgbaS(0.4 * tint) : rgbaN(0.4 * tint); ctx.fill();
    }
    polyline(ctx, B); ctx.closePath(); ctx.fillStyle = 'rgba(160,205,220,0.12)'; ctx.fill(); ctx.strokeStyle = 'rgba(242,236,217,0.38)'; ctx.stroke();
    ctx.restore();
  }
  // 立體長條磁鐵（與管子同位置）：看得到正面、頂面、右端面
  function drawBar(ctx, c, a, nLeft = true) {
    if (a <= 0.01) return;
    const hb = SR * 0.8, x0 = -SL / 2, x1 = SL / 2;
    const quad = pts => { ctx.beginPath(); pts.forEach(([x, y, z], i) => { const p = P(c, x, y, z); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath(); };
    const shade = (isN, k) => { const b = isN ? [255, 111, 118] : [114, 185, 255]; return `rgb(${b.map(v => Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)).join(',')})`; };
    ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(242,236,217,0.6)'; ctx.lineWidth = 2;
    [[x0, 0, nLeft], [0, x1, !nLeft]].forEach(([xa, xb, isN]) => {
      quad([[xa, hb, hb], [xb, hb, hb], [xb, hb, -hb], [xa, hb, -hb]]); ctx.fillStyle = shade(isN, 1.25); ctx.fill(); ctx.stroke();
      quad([[xa, -hb, hb], [xb, -hb, hb], [xb, hb, hb], [xa, hb, hb]]); ctx.fillStyle = shade(isN, 0.92); ctx.fill(); ctx.stroke();
    });
    quad([[x1, -hb, hb], [x1, -hb, -hb], [x1, hb, -hb], [x1, hb, hb]]); ctx.fillStyle = shade(nLeft ? false : true, 0.62); ctx.fill(); ctx.stroke();
    ctx.restore();
    const pl = P(c, -SL / 4, 0, hb), pr = P(c, SL / 4, 0, hb);
    txt(ctx, nLeft ? 'N' : 'S', pl.x, pl.y, '#0c1e19', a, 40);
    txt(ctx, nLeft ? 'S' : 'N', pr.x, pr.y, '#0c1e19', a, 40);
  }

  // ═════════ 磁場（80 個等距圓線圈，解析式；長度以 R 為單位） ═════════
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
  const NR = 80, RLEN = SL / SR, RXS = [];
  for (let i = 0; i < NR; i++) RXS.push(-RLEN / 2 + RLEN * (i + 0.5) / NR);
  function sheetB(x, y) {         // dir = +1（正面電流向上）：內部 B 向 −x
    const rho = Math.abs(y), sg = y < 0 ? -1 : 1; let bx = 0, by = 0;
    for (const xk of RXS) { const [bz, br] = ringB(x - xk, rho); bx += bz; by += br * sg; }
    return [-bx, -by];
  }
  function unitB(x, y) { const b = sheetB(x, y), m = Math.hypot(b[0], b[1]) || 1; return [b[0] / m, b[1] / m]; }
  function rk4(x, y, h) {
    const k1 = unitB(x, y), k2 = unitB(x + k1[0] * h / 2, y + k1[1] * h / 2), k3 = unitB(x + k2[0] * h / 2, y + k2[1] * h / 2), k4 = unitB(x + k3[0] * h, y + k3[1] * h);
    return [x + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, y + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
  }
  // 磁力線：從管內 (0, a) 出發，順著 B（dir = +1）描；繞回起點＝封閉。點列單位為 px；s0＝出發點的弧長
  let FIELD = null;
  function field() {
    if (FIELD) return FIELD;
    const lines = [], h = 0.025, XB = 620 / SR, YB = 330 / SR;
    const out = (x, y) => Math.abs(x) > XB || Math.abs(y) > YB;
    for (const a of [0.24, 0.48, 0.7, 0.88]) {
      const fwd = [[0, a]]; let x = 0, y = a, closed = false;
      for (let n = 0; n < 5000; n++) {
        const px = x; [x, y] = rk4(x, y, h);
        if (n > 20 && px > 0 && x <= 0 && Math.abs(y) < 1) { fwd.push([0, a]); closed = true; break; }
        fwd.push([x, y]); if (out(x, y)) break;
      }
      let pts = fwd, i0 = 0;
      if (!closed) {
        const back = []; x = 0; y = a;
        for (let n = 0; n < 5000; n++) { [x, y] = rk4(x, y, -h); back.push([x, y]); if (out(x, y)) break; }
        i0 = back.length; pts = back.reverse().concat(fwd);
      }
      pts = pts.map(([px, py]) => [px * SR, py * SR]);
      lines.push({ closed, pts, i0 });
      lines.push({ closed, pts: pts.map(([px, py]) => [px, -py]), i0 });
    }
    const ax = []; for (let i = 0; i <= 120; i++) ax.push([lerp(XB, -XB, i / 120) * SR, 0]);
    lines.push({ closed: false, pts: ax, i0: 60 });
    lines.forEach((L, li) => {
      let s = 0; L.len = [0];
      for (let i = 1; i < L.pts.length; i++) { s += Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); L.len.push(s); }
      L.total = s; L.s0 = L.len[L.i0];
      L.ins = L.pts.map(([x, y]) => Math.abs(x) <= SL / 2 + 8 && Math.abs(y) < SR - 6);
      const ar = [], st = 40 + ((li >> 1) % 2) * 82;   // 相鄰兩條線的箭頭錯開，避免排成一直排
      if (L.closed) for (let q = L.s0 + st; q < L.total - 20; q += 165) ar.push(q);
      else { for (let q = L.s0 + st; q < L.total; q += 165) ar.push(q); for (let q = L.s0 + st - 165; q > 0; q -= 165) ar.push(q); }
      L.arrows = ar;
    });
    FIELD = lines;
    return lines;
  }
  function pointAt(L, s) {
    s = clamp(s, 0, L.total);
    let lo = 0, hi = L.len.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L.len[m] <= s) lo = m; else hi = m; }
    const a = L.pts[lo], b = L.pts[hi], k = (s - L.len[lo]) / ((L.len[hi] - L.len[lo]) || 1);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), b[0] - a[0], b[1] - a[1]];
  }
  const insideXY = (x, y) => Math.abs(x) <= SL / 2 + 8 && Math.abs(y) < SR - 6;
  // o: { alpha, dir, amp, t, fr（管外顯示比例 0～1）, xg（管內只顯示 x ≥ xg 的部分，預設全部）, dots }
  function drawField(ctx, c, o) {
    if (o.alpha <= 0.01) return;
    const lines = field(), fr = o.fr || 0, xg = o.xg === undefined ? -1e9 : o.xg, dir = o.dir || 1;
    const vis = (L, s, x, y) => {
      if (insideXY(x, y)) return x >= xg;
      if (fr <= 0) return false;
      return L.closed ? s <= fr * L.total : (s >= L.s0 - fr * L.s0 && s <= L.s0 + fr * (L.total - L.s0));
    };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 58, W, H - 102); ctx.clip();
    ctx.globalAlpha = o.alpha; ctx.strokeStyle = C.purple; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const L of lines) {
      let run = [];
      const flush = () => { if (run.length > 1) { polyline(ctx, run); ctx.stroke(); } run = []; };
      L.pts.forEach(([x, y], i) => { if (vis(L, L.len[i], x, y)) run.push(P(c, x, y, 0)); else flush(); });
      flush();
    }
    const amp = o.amp === undefined ? 1 : o.amp;
    if (amp > 0.01) {
      ctx.globalAlpha = o.alpha * amp;
      for (const L of lines) {
        for (const q of L.arrows) {
          const [x, y, dx, dy] = pointAt(L, q);
          if (!vis(L, q, x, y)) continue;
          const p = P(c, x, y, 0), p2 = P(c, x + dx * dir, y + dy * dir, 0);
          if (p.y < 70 || p.y > 545 || p.x < 8 || p.x > W - 8) continue;
          arrowHead(ctx, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), GREEN, 11);
        }
        if (o.dots) {
          ctx.fillStyle = '#f4e3ff'; ctx.shadowColor = C.purple; ctx.shadowBlur = 8;
          const gap = 52;
          for (let s0 = ((dir * 60 * (o.t || 0)) % gap + gap) % gap; s0 < L.total; s0 += gap) {
            const [x, y] = pointAt(L, s0);
            if (!vis(L, s0, x, y)) continue;
            const p = P(c, x, y, 0); ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, TAU); ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      }
    }
    ctx.restore();
  }
  // 小磁針：畫面角度 ang 為 N 端指向
  function needle2D(ctx, x, y, ang, a, r = 26) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,28,23,0.95)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    const L = r * 0.8, w = r * 0.24, ux = Math.cos(ang), uy = Math.sin(ang);
    ctx.fillStyle = POLE_N; ctx.beginPath(); ctx.moveTo(x + ux * L, y + uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = POLE_S; ctx.beginPath(); ctx.moveTo(x - ux * L, y - uy * L); ctx.lineTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function bAng(c, wx, wy, d) {
    const b = sheetB(wx / SR, wy / SR), m = Math.hypot(b[0], b[1]) || 1;
    const p = P(c, wx, wy, 0), q = P(c, wx + b[0] / m * d * 4, wy + b[1] / m * d * 4, 0);
    return Math.atan2(q.y - p.y, q.x - p.x);
  }
  const swing = u => u < 0 ? 0 : u > 30 ? 1 : 1 - Math.exp(-2.6 * u) * Math.cos(4.2 * u);   // 0 → 1，帶一點回擺

  // ═════════ 右手（四指繞著螺線管彎曲，大拇指沿著軸） ═════════
  // 手的局部座標：四指在 (x, z) 平面繞局部 y 軸彎（θ 遞減），大拇指沿 +y。
  // 映射到世界：X = hx − y·k、Y = x·k + lift、Z = z·k（行列式 +1，仍是右手）→ 大拇指指向 −x，四指在正面由下往上。
  const HK = 1.1, HRL = (SR + 13) / HK;
  const FING = { ys: [30, 9, -12, -33], spans: [5.1, 5.3, 5.15, 4.75], th: [21, 22, 21, 19] };
  function handGeom(curl) {
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const th0 = 0.35, L = FING.spans[i] * HRL, N = 44, ds = L / N;
      let x = HRL * Math.cos(th0), z = HRL * Math.sin(th0), g = th0 - Math.PI / 2;
      const pts = [[x, FING.ys[i], z]];
      for (let k = 0; k < N; k++) {
        g -= 0.5 * curl * ds / HRL; x += Math.cos(g) * ds; z += Math.sin(g) * ds; g -= 0.5 * curl * ds / HRL;
        pts.push([x, FING.ys[i], z]);
      }
      fingers.push({ pts, th: FING.th[i] });
    }
    return fingers;
  }
  function handXf(hs) { return (x, y, z) => [hs.hx - y * HK, x * HK + (hs.lift || 0), z * HK]; }
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
  function drawRightHand(ctx, c, hs, layer) {
    if (!hs || hs.alpha <= 0.01) return;
    const xf = handXf(hs), fingers = handGeom(hs.curl), K = HK;
    const order = [0, 1, 2, 3];      // 左邊（較遠）的手指先畫
    ctx.save(); ctx.globalAlpha = hs.alpha;
    if (layer === 'back') {
      for (const i of order) for (const run of fingerRuns(c, fingers[i], xf)) if (run.side === 'back') strokeLimb(ctx, run.pts, fingers[i].th * K * run.pts[0].f, SKIN_D, SKIN_E, null);
      ctx.restore(); return;
    }
    const proj = arr => arr.map(([x, y, z]) => { const w = xf(x, y, z); return P(c, w[0], w[1], w[2]); });
    const arm = proj([[HRL + 80, 26, 4], [HRL + 125, 24, 0], [HRL + 125, -40, 0], [HRL + 80, -44, 4]]);
    ctx.fillStyle = '#2b5f73'; ctx.strokeStyle = '#173847'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    polyline(ctx, arm); ctx.closePath(); ctx.fill(); ctx.stroke();
    const palm = proj([[HRL * 0.85, 44, 10], [HRL + 46, 50, 12], [HRL + 80, 32, 8], [HRL + 92, -4, 6], [HRL + 90, -44, 6], [HRL + 60, -52, 8], [HRL + 16, -50, 10], [HRL * 0.85, -44, 10]]);
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
    const th = proj(THUMB);
    strokeLimb(ctx, th, 24 * K * th[0].f, SKIN, SKIN_E, 'rgba(255,236,220,0.6)');
    const tip = th[2], pre = th[1], ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
    ctx.save(); ctx.translate(tip.x - Math.cos(ang) * 6, tip.y - Math.sin(ang) * 6); ctx.rotate(ang);
    ctx.fillStyle = '#ffe6d6'; ctx.strokeStyle = 'rgba(140,81,47,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 8 * K * tip.f, 7 * K * tip.f, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }
  const THUMB = [[HRL * Math.cos(0.62) + 2, 36, HRL * Math.sin(0.62) + 8], [HRL * Math.cos(0.5), 76, HRL * Math.sin(0.5) + 9], [HRL * Math.cos(0.42) - 1, 108, HRL * Math.sin(0.42) + 10]];
  function handWorld(hs, x, y, z) { return handXf(hs)(x, y, z); }

  // ═════════ 右手（圖片素材版） ═════════
  // 素材：右手、握拳、拇指朝上；指背朝左、手腕在右下（380×355，透明底）。只旋轉／等比縮放／平移，絕不翻轉。
  // 拇指朝左＝整張圖逆時針轉 90°（rotate(−π/2)，平面內旋轉，仍是右手）：指背轉到下方、手腕轉到右上。
  // 擺法：手放在螺線管上方偏前，四指由下往上蓋住正面的線圈段（＝正面電流向上），大拇指貼著管頂朝左指向 N 端。
  const HAND_IMG = new Image();
  const HAND_SRC = 'assets/electromagnetism_2/hand_right_thumbup_1105_v1.png';
  const HIMG = {
    ax: 70, ay: 240,          // 四指正面的中心（定位錨點），對到管軸在手的位置
    tip: [156, 4],            // 大拇指尖（給標籤與 B 箭頭）
    finger: [62, 300],        // 四指正面偏右下（給「四指」標籤的引線）
    s: 0.88,                  // 1 圖片像素＝0.88 畫面像素（四指蓋住正面大半段）
    dx: 18                    // 往右挪一點：大拇指尖到管子左端留出 B 箭頭的長度
  };
  const handImgReady = () => HAND_IMG.complete && HAND_IMG.naturalWidth > 0;
  HAND_IMG.onload = () => { if (S.scene && !S.raf) render(); };   // 暫停中載完也補畫一幀
  HAND_IMG.src = HAND_SRC;
  // 圖片座標 → 畫面座標
  function handImgXf(c, hs) {
    const a = P(c, hs.hx, 0, 0), o = { x: a.x + HIMG.dx, y: a.y - (hs.lift || 0) * c.ce };
    const open = 1 - clamp(((hs.curl === undefined ? 1 : hs.curl) - 0.55) / 0.45, 0, 1);   // 還沒握緊時大拇指微微翹起
    const rot = -Math.PI / 2 + open * 8 * DEG, sc = HIMG.s, cs = Math.cos(rot), sn = Math.sin(rot);
    return { o, sc, rot, pt: (ix, iy) => { const dx = (ix - HIMG.ax) * sc, dy = (iy - HIMG.ay) * sc; return { x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs }; } };
  }
  // 緊貼四指右側、繞著管子的彎箭頭（橘＝電流方向）：正面由下往上＝四指彎的方向。half：'back' | 'front'
  const CURL_R = SR + 18;
  function curlArrow(ctx, c, hs, half) {
    const a = hs.alpha * easeIO(seg(hs.curl === undefined ? 1 : hs.curl, 0.75, 1));
    if (a <= 0.01) return;
    const X = handImgXf(c, hs), edge = X.pt(HIMG.ax, 352);          // 指背最右緣
    let xw = hs.hx; for (let i = 0; i < 40; i++) { if (P(c, xw, 0, 0).x >= edge.x + 14) break; xw += 4; }
    const ring = (t0, t1) => { const o = []; for (let i = 0; i <= 30; i++) { const th = lerp(t0, t1, i / 30); o.push(P(c, xw, CURL_R * Math.cos(th), CURL_R * Math.sin(th))); } return o; };
    // 線圈點 (x, R cosθ, R sinθ)：θ = π 在底部、π/2 在正面、0 在頂部；正面電流向上＝θ 遞減
    const pts = half === 'front' ? ring(0.94 * Math.PI, 0.1 * Math.PI) : ring(-0.06 * Math.PI, -0.94 * Math.PI);
    ctx.save(); ctx.globalAlpha = a * (half === 'front' ? 1 : 0.5); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 8; polyline(ctx, pts); ctx.stroke();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 5; polyline(ctx, pts); ctx.stroke();
    if (half === 'front') { const e = pts[pts.length - 1], b = pts[pts.length - 3]; arrowHead(ctx, e.x, e.y, Math.atan2(e.y - b.y, e.x - b.x), ORANGE, 15); }
    ctx.restore();
  }
  // 手：圖片載好就用圖，沒載好退回程式畫法
  function drawHand(ctx, c, hs, layer) {
    if (!hs || hs.alpha <= 0.01) return;
    if (!handImgReady()) { drawRightHand(ctx, c, hs, layer); return; }
    if (layer === 'back') { curlArrow(ctx, c, hs, 'back'); return; }
    const X = handImgXf(c, hs);
    ctx.save(); ctx.globalAlpha = hs.alpha;
    ctx.translate(X.o.x, X.o.y); ctx.rotate(X.rot); ctx.scale(X.sc, X.sc);
    ctx.drawImage(HAND_IMG, -HIMG.ax, -HIMG.ay);
    ctx.restore();
    curlArrow(ctx, c, hs, 'front');
  }
  // 標籤用的點（畫面座標）：大拇指尖、四指
  function handTipPt(c, hs) {
    if (handImgReady()) return handImgXf(c, hs).pt(HIMG.tip[0], HIMG.tip[1]);
    const w = handWorld(hs, THUMB[2][0], THUMB[2][1], THUMB[2][2]); return P(c, w[0], w[1], w[2]);
  }
  function handFingerPt(c, hs) {
    if (handImgReady()) return handImgXf(c, hs).pt(HIMG.finger[0], HIMG.finger[1]);
    const w = handWorld(hs, HRL * Math.cos(-3.9), -12, HRL * Math.sin(-3.9)); return P(c, w[0], w[1], w[2]);
  }

  // ═════════ 場景 1：什麼是螺線管 ═════════
  const SH = { cx: 380, cy: 300, e: 10 * DEG, hx: 80 };
  function shapeState(step, t) {
    const s = { phi: 18 * DEG, sp: 1, solo: false, m: 1, amp: 1, leadA: 1, ringArr: 0, hl: 0, bigA: 0, inA: 0, grow: 1, tubeA: 1,
      hand: null, fingerTag: 0, thumbTag: 0, thumbArr: 0, poles: 0, tint: 0, cardA: 0, curTag: 0, bTag: 0, solTag: 0, unifTag: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.solo = true; s.sp = 0; s.m = 0; s.leadA = 0; s.tubeA = 0;
      s.phi = lerp(42, 18, easeIO(seg(t, 4.6, 7.2))) * DEG;
      s.amp = easeIO(seg(t, 0.3, 1.2)); s.bigA = easeIO(seg(t, 1.6, 2.6));
      s.curTag = easeIO(seg(t, 1.0, 1.6)); s.bTag = easeIO(seg(t, 2.6, 3.2));
      if (t < 4.6) { s.msg = tr('先看一個圓線圈：通電後，中心的磁場 B 穿過圈面', 'Start with one loop: with current, the field B passes through its center'); s.mc = GREEN; }
      else { s.msg = tr('轉到正面看：前面那段電流向上，中心的 B 向左', 'Turn to face it: the front current goes up, B at the center points left'); s.mc = ORANGE; }
    } else if (step === 1) {
      s.bigA = 1 - seg(t, 0, 0.8); s.sp = easeIO(seg(t, 0.4, 3.4)); s.m = easeIO(seg(t, 4.2, 6.8));
      s.leadA = seg(t, 6.4, 7.2); s.tubeA = easeIO(seg(t, 5.6, 7.0)); s.ringArr = easeIO(seg(t, 1.2, 2.2)); s.solTag = easeIO(seg(t, 7.2, 7.8));
      if (t < 4.2) { s.msg = tr('許多個圓線圈排成一列：每一圈中心的 B 都向左', 'Many loops in a row: B at the center of each one points left'); s.mc = GREEN; }
      else if (t < 7.0) { s.msg = tr('把導線一圈接一圈，連續繞下去……', 'Now wind one wire around, turn after turn...'); s.mc = CYAN; }
      else { s.msg = tr('密密纏繞成圓筒狀，就是螺線管', 'Wound tightly into a tube: that is a solenoid'); s.mc = YELLOW; }
    } else if (step === 2) {
      s.ringArr = 1 - easeIO(seg(t, 2.6, 3.6)); s.hl = easeIO(seg(t, 0.3, 1.2));
      s.inA = easeIO(seg(t, 2.4, 3.4)); s.grow = easeIO(seg(t, 2.4, 5.0)); s.unifTag = easeIO(seg(t, 5.6, 6.2));
      if (t < 2.4) { s.msg = tr('每一圈在螺線管內部產生的磁場，方向都向左', 'Inside the solenoid, the field from every turn points left'); s.mc = YELLOW; }
      else if (t < 5.6) { s.msg = tr('方向相同就疊加起來：內部的磁場變得很強', 'Same direction, so they add up: a strong field inside'); s.mc = GREEN; }
      else { s.msg = tr('內部磁力線互相平行、間隔相同：磁場均勻', 'Inside, the lines are parallel and evenly spaced: a uniform field'); s.mc = GREEN; }
    } else if (step === 3) {
      s.inA = 0.55;
      s.hand = { hx: SH.hx, alpha: seg(t, 0.2, 1.0), lift: 150 * (1 - easeIO(seg(t, 0.2, 2.0))), curl: 0.55 + 0.45 * easeIO(seg(t, 1.6, 3.2)) };
      s.fingerTag = easeIO(seg(t, 3.2, 3.8)); s.thumbTag = easeIO(seg(t, 5.0, 5.6)); s.thumbArr = easeIO(seg(t, 5.4, 6.4)); s.poles = easeIO(seg(t, 6.6, 7.4));
      if (t < 5.0) { s.msg = tr('右手握住螺線管：四指順著正面的電流（向上）彎', 'Grip it with your right hand: curl the fingers along the front current (up)'); s.mc = ORANGE; }
      else if (t < 6.6) { s.msg = tr('伸直的大拇指＝內部磁場 B 的方向（向左）', 'The outstretched thumb = the direction of B inside (left)'); s.mc = GREEN; }
      else { s.msg = tr('大拇指指的那一端就是 N 極：左端 N、右端 S', 'The thumb points to the N pole: N on the left, S on the right'); s.mc = POLE_N; }
    } else {
      s.inA = 0.55; s.poles = 1;
      s.hand = { hx: SH.hx, alpha: 1 - seg(t, 0, 0.9), lift: 0, curl: 1 };
      s.thumbArr = 1 - seg(t, 0, 0.6); s.tint = easeIO(seg(t, 0.6, 2.0)); s.cardA = easeIO(seg(t, 2.4, 3.2));
      if (t < 3.4) { s.msg = tr('通電的螺線管，就像一根長條磁鐵', 'A solenoid with current acts just like a bar magnet'); s.mc = YELLOW; }
      else { s.msg = tr('大拇指指的那一端是 N 極，另一端是 S 極', 'The end the thumb points to is N; the other end is S'); s.mc = POLE_N; }
    }
    return s;
  }
  function drawShape(ctx, step, t) {
    const s = shapeState(step, t), dir = 1;
    const c = cam(SH.cx, SH.cy, SH.e, 1, 2400, s.phi);
    const xcs = [], alphas = [];
    for (let k = 0; k < NT; k++) {
      xcs.push(s.solo ? 0 : lerp(0, XK(k), s.sp));
      alphas.push(s.solo ? (k === 4 ? 1 : 0) : (k === 4 ? 1 : clamp(s.sp * 6, 0, 1)));
    }
    const cm = coilModel(c, xcs, s.m, alphas, s.leadA);
    const hand = s.hand;
    // 後層：背面導線 → 手指背面 → 管子 → 內部磁力線 → 各圈的 B → 正面導線 → 手
    drawCoil(ctx, c, cm, 'back', { amp: s.amp, dir, t });
    drawHand(ctx, c, hand, 'back');
    drawTube(ctx, c, s.tubeA, s.tint, true);
    drawField(ctx, c, { alpha: s.inA, dir, amp: 1, t, fr: 0, xg: SL / 2 + 8 - s.grow * (SL + 16), dots: s.grow > 0.98 });
    if (s.ringArr > 0.01) {
      const col = s.hl > 0.5 ? YELLOW : GREEN, len = 13 + 3 * s.hl;
      cm.turns.forEach((tn, k) => {
        if (tn.a <= 0.01) return;
        const a = P(c, xcs[k] + len * dir, 0, 0), b = P(c, xcs[k] - len * dir, 0, 0);
        ctx.save(); ctx.globalAlpha = s.ringArr * tn.a; ctx.strokeStyle = col; ctx.lineWidth = 4 + s.hl; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); arrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), col, 11 + 3 * s.hl); ctx.restore();
      });
    }
    if (s.bigA > 0.01) {
      const a = P(c, 85, 0, 0), b = P(c, -105, 0, 0);
      ctx.save(); ctx.globalAlpha = s.bigA; drawArrow3D(ctx, a.x, a.y, b.x, b.y, GREEN, 9, 20); ctx.restore();
    }
    drawCoil(ctx, c, cm, 'front', { amp: s.amp, dir, t });
    drawCurArrows(ctx, c, cm, dir, s.amp);
    drawHand(ctx, c, hand, 'front');
    if (s.thumbArr > 0.01 && hand) {
      let a, b;
      if (handImgReady()) { const tp = handTipPt(c, hand); a = { x: tp.x - 6, y: tp.y }; b = { x: P(c, -SL / 2 + 6, SR, 0).x, y: tp.y }; }
      else { const tp = handWorld(hand, THUMB[2][0], THUMB[2][1], THUMB[2][2]); a = P(c, tp[0] - 8, tp[1], tp[2]); b = P(c, -SL / 2 + 6, tp[1], tp[2]); }
      ctx.save(); ctx.globalAlpha = s.thumbArr * hand.alpha; drawArrow3D(ctx, a.x, a.y, lerp(a.x, b.x, s.thumbArr), lerp(a.y, b.y, s.thumbArr), GREEN, 8, 18); ctx.restore();
    }
    // ── 標籤 ──
    if (s.poles > 0.01) {
      const pl = P(c, -SL / 2 - 46, 0, 0), pr = P(c, SL / 2 + 46, 0, 0);
      poleBadge(ctx, pl.x, pl.y, true, s.poles); poleBadge(ctx, pr.x, pr.y, false, s.poles);
    }
    if (s.curTag > 0.01) {
      const q = cm.turns[4].pts[NU / 4], p = P(c, q.x, q.y, q.z);
      leader(ctx, 230, 440, p.x - 6, p.y + 16, ORANGE, s.curTag);
      tag(ctx, tr('正面電流 I：向上', 'Front current I: up'), 230, 462, ORANGE, s.curTag);
    }
    if (s.bTag > 0.01) {
      const b = P(c, -105, 0, 0);
      tag(ctx, tr('中心的磁場 B', 'Field B at the center'), b.x - 40, b.y - 92, GREEN, s.bTag * s.bigA);
      leader(ctx, b.x - 40, b.y - 72, b.x + 6, b.y - 8, GREEN, s.bTag * s.bigA);
    }
    if (s.solTag > 0.01 && step === 1) {
      const p = P(c, 0, -SR - 40, 0);
      tag(ctx, tr('螺線管', 'Solenoid'), p.x, p.y + 8, YELLOW, s.solTag);
    }
    if (s.unifTag > 0.01) {
      const p = P(c, 40, -SR * 0.4, 0);
      leader(ctx, SH.cx + 40, 456, p.x, p.y + 6, GREEN, s.unifTag);
      tag(ctx, tr('內部：又強又均勻', 'Inside: strong and uniform'), SH.cx + 40, 470, GREEN, s.unifTag);
    }
    if (hand) {
      if (s.fingerTag > 0.01) {
        const fp = handFingerPt(c, hand);
        leader(ctx, 700, 452, fp.x + 4, fp.y + 4, ORANGE, s.fingerTag * hand.alpha);
        tag(ctx, tr('四指＝電流方向', 'Fingers = current'), 750, 474, ORANGE, s.fingerTag * hand.alpha);
      }
      if (s.thumbTag > 0.01) {
        const p = handTipPt(c, hand);
        leader(ctx, 250, 118, p.x - 10, p.y - 10, GREEN, s.thumbTag * hand.alpha);
        tag(ctx, tr('大拇指＝內部 B 的方向', 'Thumb = direction of B inside'), 250, 100, GREEN, s.thumbTag * hand.alpha);
      }
    }
    if (s.cardA > 0.01) {
      const a = s.cardA, X = 700, Wc = 284;
      card(ctx, X, 74, Wc, 300, a);
      const l0 = tr('長條磁鐵', 'Bar magnet');
      txt(ctx, l0, X + Wc / 2, 108, CHALK, a, fitSize(ctx, l0, Wc - 24, 26, 22));
      ctx.save(); ctx.globalAlpha = a;
      rrect(ctx, X + 32, 146, 220, 64, 10); ctx.save(); ctx.clip();
      ctx.fillStyle = POLE_N; ctx.fillRect(X + 32, 146, 110, 64);
      ctx.fillStyle = POLE_S; ctx.fillRect(X + 142, 146, 110, 64); ctx.restore();
      ctx.strokeStyle = CHALK; ctx.lineWidth = 2; rrect(ctx, X + 32, 146, 220, 64, 10); ctx.stroke();
      ctx.restore();
      txt(ctx, 'N', X + 87, 179, '#0c1e19', a, 36); txt(ctx, 'S', X + 197, 179, '#0c1e19', a, 36);
      const l1 = tr('通電螺線管', 'Solenoid with current'), l2 = tr('＝ 長條磁鐵', '= a bar magnet'), l3 = tr('左 N、右 S', 'N left, S right');
      txt(ctx, l1, X + Wc / 2, 254, ORANGE, a, fitSize(ctx, l1, Wc - 24, 24, 22));
      txt(ctx, l2, X + Wc / 2, 292, YELLOW, a, fitSize(ctx, l2, Wc - 24, 24, 22));
      txt(ctx, l3, X + Wc / 2, 338, POLE_N, a, fitSize(ctx, l3, Wc - 24, 24, 22));
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁場 B／磁力線', 'Field B / field lines'), 1]]);
  }

  // ═════════ 場景 2：疊加的強大磁場 ═════════
  const FS = { cx: 500, cy: 300, e: 12 * DEG, phi: 16 * DEG };
  const NEEDLES = [[-SL / 2 - 100, 0], [SL / 2 + 100, 0], [0, SR + 80], [-SL / 2 - 30, SR + 75], [SL / 2 + 30, SR + 75], [-SL / 2 - 48, -SR - 75], [SL / 2 + 48, -SR - 75]];
  const NOFF = [2.2, -1.9, 2.6, -2.4, 1.8, -2.0, 2.5];
  function fieldState(step, t) {
    const s = { cur: 1, inA: 1, fr: 1, poles: 1, needles: 0, nMode: 'off', nT: 0, magA: 0, solA: 1, curTag: 0, inTag: 0, outTag: 0, magTag: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.cur = seg(t, 0.1, 0.8); s.inA = easeIO(seg(t, 0.8, 2.2)); s.fr = 0; s.poles = easeIO(seg(t, 3.2, 4.0));
      s.curTag = easeIO(seg(t, 0.8, 1.4)); s.inTag = easeIO(seg(t, 4.4, 5.0));
      if (t < 3.2) { s.msg = tr('通電螺線管的內部：磁力線又直又平行', 'Inside a solenoid with current: straight, parallel field lines'); s.mc = GREEN; }
      else { s.msg = tr('內部的磁場由 S 極指向 N 極', 'Inside, the field points from the S pole to the N pole'); s.mc = CYAN; }
    } else if (step === 1) {
      s.fr = easeIO(seg(t, 0.4, 5.4)); s.outTag = easeIO(seg(t, 2.0, 2.6)) * (1 - seg(t, 8.2, 8.8));
      if (t < 5.4) { s.msg = tr('磁力線從 N 極出來，在外面彎回 S 極', 'Field lines leave the N pole and curve back to the S pole outside'); s.mc = PINK; }
      else { s.msg = tr('內外接起來：每一條磁力線都是封閉的曲線', 'Inside and outside join up: every field line is a closed loop'); s.mc = YELLOW; }
    } else if (step === 2) {
      s.needles = 1; s.nMode = 'settle'; s.nT = t;
      if (t < 3.8) { s.msg = tr('放上小磁針：紅色 N 端順著磁力線的方向', 'Place compasses: each red N end follows the field lines'); s.mc = CYAN; }
      else { s.msg = tr('外面由 N 指向 S，和內部的方向相反', 'Outside it runs from N to S, opposite to the inside'); s.mc = PINK; }
    } else if (step === 3) {
      s.cur = 1 - 2 * easeIO(seg(t, 1.4, 3.0)); s.needles = 1; s.nMode = 'flip'; s.nT = t - 2.2; s.curTag = 1;
      if (t < 1.4) { s.msg = tr('把電流反過來……', 'Now reverse the current...'); s.mc = ORANGE; }
      else if (t < 4.6) { s.msg = tr('磁力線方向相反，小磁針全部翻轉', 'The field lines reverse and every compass flips'); s.mc = YELLOW; }
      else { s.msg = tr('右端變成 N 極、左端變成 S 極', 'Now the right end is N and the left end is S'); s.mc = POLE_N; }
    } else {
      s.cur = -1 + 2 * easeIO(seg(t, 0.2, 1.4)); s.needles = 1 - seg(t, 1.6, 2.4); s.nMode = 'back'; s.nT = t - 0.8;
      s.magA = easeIO(seg(t, 2.2, 3.4)) * (1 - 0.65 * easeIO(seg(t, 5.6, 6.6)));
      s.solA = 1 - 0.85 * easeIO(seg(t, 2.2, 3.4)) + 0.85 * easeIO(seg(t, 5.6, 6.6));
      s.curTag = 1 - seg(t, 1.6, 2.2); s.magTag = easeIO(seg(t, 3.0, 3.6)) * (1 - seg(t, 5.6, 6.2));
      if (t < 2.2) { s.msg = tr('電流改回來，再和長條磁鐵比一比', 'Switch the current back and compare with a bar magnet'); s.mc = CYAN; }
      else if (t < 5.6) { s.msg = tr('換成長條磁鐵：磁力線的形狀幾乎一模一樣', 'Swap in a bar magnet: the field lines look almost the same'); s.mc = YELLOW; }
      else { s.msg = tr('通電的螺線管，就等於一根長條磁鐵', 'A solenoid with current is just like a bar magnet'); s.mc = YELLOW; }
    }
    return s;
  }
  function drawFieldScene(ctx, step, t) {
    const s = fieldState(step, t), c = cam(FS.cx, FS.cy, FS.e, 1, 2400, FS.phi);
    const d = s.cur >= 0 ? 1 : -1, amp = Math.abs(s.cur);
    const xcs = [], alphas = [];
    for (let k = 0; k < NT; k++) { xcs.push(XK(k)); alphas.push(1); }
    const cm = coilModel(c, xcs, 1, alphas, 1);
    drawCoil(ctx, c, cm, 'back', { amp, dir: d, t, alpha: s.solA });
    drawBar(ctx, c, s.magA, true);
    drawTube(ctx, c, s.solA);
    drawField(ctx, c, { alpha: s.inA, dir: d, amp, t, fr: s.fr, dots: true });
    // 小磁針
    if (s.needles > 0.01) {
      NEEDLES.forEach(([wx, wy], i) => {
        const p = P(c, wx, wy, 0), base = bAng(c, wx, wy, 1);
        let ang = base, a = s.needles;
        if (s.nMode === 'settle') {
          const t0 = 0.3 + 0.16 * i; a = easeIO(seg(s.nT, t0, t0 + 0.5));
          const u = Math.max(0, s.nT - (t0 + 0.4)); ang = base + NOFF[i] * Math.exp(-2.2 * u) * Math.cos(4.6 * u);
        } else if (s.nMode === 'flip') ang = base + Math.PI * swing(s.nT - 0.04 * i);
        else if (s.nMode === 'back') ang = base + Math.PI - Math.PI * swing(s.nT - 0.04 * i);
        needle2D(ctx, p.x, p.y, ang, a);
      });
    }
    drawCoil(ctx, c, cm, 'front', { amp, dir: d, t, alpha: s.solA });
    drawCurArrows(ctx, c, cm, d, amp, s.solA);
    // ── 標籤 ──
    const pl = P(c, -SL / 2 - 42, 0, 0), pr = P(c, SL / 2 + 42, 0, 0), kb = clamp(amp * 1.25, 0, 1);
    poleBadge(ctx, pl.x, pl.y, d > 0, s.poles, kb); poleBadge(ctx, pr.x, pr.y, d < 0, s.poles, kb);
    const pb = P(c, 0, -SR - 46, 0);
    if (s.curTag > 0.01 && amp > 0.3) tag(ctx, d > 0 ? tr('正面電流：向上', 'Front current: up') : tr('正面電流：向下', 'Front current: down'), pb.x, pb.y + 10, ORANGE, s.curTag * clamp((amp - 0.3) * 2, 0, 1));
    if (s.magTag > 0.01) tag(ctx, tr('長條磁鐵', 'Bar magnet'), pb.x, pb.y + 10, YELLOW, s.magTag);
    if (s.inTag > 0.01) {
      const p = P(c, 60, SR * 0.4, 0);
      leader(ctx, 560, 132, p.x, p.y, CYAN, s.inTag * (1 - seg(t, 7.4, 8)));
      tag(ctx, tr('內部：S → N', 'Inside: S → N'), 560, 112, CYAN, s.inTag * (1 - seg(t, 7.4, 8)));
    }
    if (s.outTag > 0.01) {
      const Lf = field().find(L => L.closed && L.pts[0][1] > 0.85 * SR) || field()[0];
      let best = Lf.pts[0]; for (const q of Lf.pts) if (q[1] < best[1] && Math.abs(q[0]) < 60) best = q;   // 管子下方那一圈的最低點
      const p = P(c, best[0], best[1], 0);
      leader(ctx, p.x, 504, p.x, p.y + 2, PINK, s.outTag);
      tag(ctx, tr('外部：N → S', 'Outside: N → S'), p.x, 522, PINK, s.outTag);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁力線（箭頭＝B）', 'Field lines (arrow = B)'), 1], ['compass', tr('小磁針（紅＝N）', 'Compass (red = N)'), s.needles]]);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'sol-shape': {
      draw: drawShape,
      steps: [
        { d: 8.0, b: ['一個線圈', 'One loop'],
          cap: ['先看一個<strong class="accent-cyan">圓形線圈</strong>：通電後，中心的<strong class="accent-green">磁場 B</strong> 穿過圈面。從正面看，前面那段電流<strong class="accent-orange">向上</strong>，中心的 B <strong class="accent-green">向左</strong>。',
                'Start with one <strong class="accent-cyan">circular loop</strong>: with current, the <strong class="accent-green">field B</strong> passes through its center. Seen from the front, the front current goes <strong class="accent-orange">up</strong> and B at the center points <strong class="accent-green">left</strong>.'] },
        { d: 9.0, b: ['繞成管', 'Wind'],
          cap: ['螺線管可以看作是許多個<strong class="accent-cyan">「圓形線圈」疊合</strong>在一起：把導線<strong class="accent-orange">密密地纏繞成圓筒狀</strong>，就是螺線管。',
                'A solenoid can be seen as many <strong class="accent-cyan">"circular coils" stacked together</strong>: wind a wire <strong class="accent-orange">tightly into a cylinder</strong> and you get a solenoid.'] },
        { d: 9.0, b: ['同向疊加', 'Add up'],
          cap: ['通電後，每一個線圈在內部產生的磁場<strong class="accent-green">方向都相同</strong>，互相<strong class="accent-yellow">疊加、增強</strong>：內部磁場又強又均勻。',
                'With current, the fields of all the coils inside <strong class="accent-green">point the same way</strong>, so they <strong class="accent-yellow">add up and get stronger</strong>: a strong, uniform field inside.'] },
        { d: 9.0, b: ['右手', 'Right hand'],
          cap: ['判斷極性用右手：<strong class="accent-orange">四指順著表面電流彎</strong>，<strong class="accent-green">大拇指即為 N 極</strong>（大拇指＝內部磁場的方向）。',
                'Use the right hand for polarity: <strong class="accent-orange">fingers curl along the surface current</strong>, <strong class="accent-green">thumb is the N pole</strong> (the thumb = the field direction inside).'] },
        { d: 8.0, b: ['像磁鐵', 'Bar magnet'],
          cap: ['通電的螺線管就像一根<strong class="accent-yellow">長條磁鐵</strong>：大拇指指的左端是 <strong class="accent-red">N 極</strong>，右端是 <strong class="accent-blue">S 極</strong>。',
                'A solenoid with current acts like a <strong class="accent-yellow">bar magnet</strong>: the left end, where the thumb points, is the <strong class="accent-red">N pole</strong>; the right end is the <strong class="accent-blue">S pole</strong>.'] }
      ]
    },
    'sol-field': {
      draw: drawFieldScene,
      steps: [
        { d: 8.0, b: ['內部', 'Inside'],
          cap: ['<strong class="accent-cyan">內部磁場：</strong>均勻、平行的強磁場，方向由 <strong class="accent-blue">S</strong> 指向 <strong class="accent-red">N</strong>。',
                '<strong class="accent-cyan">Inside:</strong> a uniform, parallel strong field pointing from <strong class="accent-blue">S</strong> to <strong class="accent-red">N</strong>.'] },
        { d: 9.0, b: ['外部繞回', 'Outside'],
          cap: ['<strong class="accent-pink">外部磁場：</strong>由 N 極出發，呈弧線彎曲回到 S 極；內外接起來，每一條磁力線都是<strong class="accent-yellow">封閉</strong>的。',
                '<strong class="accent-pink">Outside:</strong> field lines leave the N pole and curve back to the S pole; joined with the inside, every field line is a <strong class="accent-yellow">closed loop</strong>.'] },
        { d: 8.0, b: ['小磁針', 'Compass'],
          cap: ['用<strong class="accent-cyan">小磁針</strong>驗證：<strong class="accent-red">紅色 N 端</strong>順著磁力線的方向；外部由 N 指向 S，和內部方向相反。',
                'Check with <strong class="accent-cyan">compasses</strong>: each <strong class="accent-red">red N end</strong> follows the field lines; outside they run from N to S, opposite to the inside.'] },
        { d: 9.0, b: ['反向', 'Reverse'],
          cap: ['<strong class="accent-orange">電流反向</strong>：磁力線形狀不變、方向相反，小磁針全部翻轉，<strong class="accent-red">N</strong>、<strong class="accent-blue">S</strong> 極對調。',
                '<strong class="accent-orange">Reverse the current</strong>: the field lines keep their shape but reverse direction, every compass flips, and the <strong class="accent-red">N</strong> and <strong class="accent-blue">S</strong> poles swap.'] },
        { d: 8.0, b: ['比一比', 'Compare'],
          cap: ['螺線管的磁場和<strong class="accent-yellow">長條形磁鐵幾乎一模一樣</strong>，所以它同樣具備「同名極相斥、異名極相吸」的特性。',
                'The solenoid\'s field is <strong class="accent-yellow">almost exactly like a bar magnet\'s</strong>, so "like poles repel, opposite poles attract" applies to it too.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  // 老師講解模式（AGENTS 10.7）的播放設定：模組層級，activate() 換場景時不重設
  const CTL = { paused: false, loop: true, endFn: null, ended: false };

  function canvasCtx() { const c = document.getElementById('solenoidCanvas'); return c ? c.getContext('2d') : null; }
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
    const res = document.getElementById('solResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-solenoid');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-solenoid'); if (!row) return;
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

  function visible() { const c = document.getElementById('solenoidCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      if (CTL.loop) S.t = 0;
      else {                                   // 不循環：停在最後一幀，onEnd 只呼叫一次
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

  EmAnim.solenoid = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'sol-shape';
      stop(); field();            // 磁力線只算一次（約 0.1 秒），先算好，播到一半才不會卡一下
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; CTL.ended = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-solenoid'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 老師講解模式的播放控制（設定跨場景保留；學生模式＝預設 loop=true、不暫停）
    ctl: {
      pause() { CTL.paused = true; stop(); if (S.scene) render(); },
      resume() { CTL.paused = false; S.last = 0; start(); },
      paused() { return CTL.paused; },
      setLoop(v) { CTL.loop = !!v; if (CTL.loop) { CTL.ended = false; start(); } },
      onEnd(fn) { CTL.endFn = typeof fn === 'function' ? fn : null; },
      restart() { if (!S.scene) return; stop(); CTL.paused = false; CTL.ended = false; S.t = 0; S.step = -1; S.last = 0; render(); start(); },
      progress() { const sc = S.scene && SCENES[S.scene]; return { t: S.t, total: sc ? sc.total : 0, step: S.step, steps: sc ? sc.steps.length : 0 }; }
    },
    // 測試用：直接畫出某場景第 t 秒的畫面
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf, handImg: handImgReady() }; }
  };
})();
