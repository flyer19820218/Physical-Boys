/* electromagnetism_2_straight_1104_v1.js — 「直導線與右手」分頁動畫（#straightCanvas，1000×600）
 *
 * 契約：window.EmAnim.straight = { activate(sceneId), deactivate(), relang(), _frameAt, _info, _state }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 立體投影、右手、指南針、飛行的箭都在本檔自己畫。畫布不綁任何事件；唯一控制是 #steps-straight 的步驟鈕。
 *
 * 座標約定（世界座標）：x 向右、y 向上（導線方向）、z 朝向觀看者；水平面上的點用 θ 表示
 *   (x, z) = (r cosθ, r sinθ)。從上往下看時 x 向右、z 向畫面下方。
 *   電流向上（+y）→ B 方向 = ŷ × r̂ ＝ θ 遞減 ＝ 從上方俯視逆時針；電流向下 → 順時針。
 *   右手：大拇指 +y 時四指沿 θ 遞減彎曲；電流反向時把整隻右手繞 z 軸轉 180°（(x,y)→(−x,−y)，仍是右手）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * st-field 奧斯特的發現，共 39 s
 *   1 沒通電 6 s   開關打開，一圈 8 個指南針都指向北方
 *   2 通電   10 s  開關接通、電流向上流 → 指針同時偏轉（有回擺）→ 指針沿切線排成一圈，繞著導線
 *   3 同心圓 11 s  指南針淡出，同心圓磁力線由內往外浮現；流動點越近越快 → 內密外疏：越近越強
 *   4 垂直   12 s  鏡頭繞導線轉動；上下各一層同心圓（每個高度都有）；B 沿切線、與 I 成 90°
 * st-rule 安培右手定則，共 44 s
 *   1 握住   8 s   電流向上；右手由右側伸入、四指彎曲握住導線，大拇指沿電流方向
 *   2 逆時針 10 s  四指彎曲方向的綠箭頭 → 板上磁力線同向流動 → 右側俯視圖：逆時針
 *   3 反向   7 s   右手鬆開離開、電流反向，右手（大拇指朝下）由左側握回
 *   4 順時針 10 s  四指彎曲＝磁力線環繞方向；俯視圖：順時針
 *   5 對照   9 s   右側並列「I 向上→逆時針／I 向下→順時針」，主畫面再反轉一次回到向上
 * st-symbol × 與 • 立體符號，共 50 s
 *   1 一支箭 8 s   側面飛來的箭，標出箭尖與羽毛
 *   2 迎面   9 s   箭轉向朝你飛來 → 只看到箭尖 → •（指出紙面）
 *   3 背面   9 s   箭轉向離你而去 → 只看到箭尾羽毛 → ×（指入紙面）
 *   4 I×     12 s  導線電流向下（用橘色箭表示），右手大拇指朝下 → 鏡頭升到正上方：看到 ×、B 順時針
 *   5 I•     12 s  鏡頭降回、箭翻轉成向上 → 再升到正上方：看到 •、B 逆時針
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.EmAnim = window.EmAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink;
  const CHALK = '#f2ecd9';
  const DEG = Math.PI / 180;

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const wrapPI = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fitSize(ctx, s, maxW, size, min) { let z = size; while (z > min && textW(ctx, s, z) > maxW) z -= 1; return z; }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function polyline(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  // 有底色的小標籤（避免字壓在線上）
  function tag(ctx, s, x, y, color, a = 1, size = 24) {
    if (a <= 0.01) return;
    size = fitSize(ctx, s, W - 40, size, 22);
    const w = textW(ctx, s, size) + 20;
    x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.92)'; ctx.strokeStyle = color; ctx.lineWidth = 2;
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
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.92)'; ctx.fillRect(0, 6, W, 52); ctx.restore();
    if (!s || a <= 0) return;
    const size = fitSize(ctx, s, W - 30, 26, 22);
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, W / 2, 33, color, 'center', size); ctx.restore();
  }
  // items: [kind, text, alpha]
  function legend(ctx, items) {
    items = items.filter(it => it[2] > 0.02);
    const size = 22, gap = 34, gw = 40;
    const ws = items.map(it => gw + 10 + textW(ctx, it[1], size));
    const tot = ws.reduce((s, w) => s + w, 0) + gap * Math.max(0, items.length - 1);
    const y = H - 22;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.92)'; ctx.fillRect(0, H - 44, W, 44); ctx.restore();
    let xx = (W - tot) / 2;
    items.forEach(([kind, s, a], k) => {
      ctx.save(); ctx.globalAlpha = a;
      if (kind === 'I') { ctx.strokeStyle = ORANGE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 12, y); ctx.stroke(); arrowHead(ctx, xx + gw - 12, y, 0, ORANGE, 11); }
      else if (kind === 'B') { ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 12, y); ctx.stroke(); arrowHead(ctx, xx + gw - 12, y, 0, GREEN, 10); }
      else if (kind === 'compass') {
        const cx = xx + gw / 2; ctx.fillStyle = 'rgba(12,30,25,1)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, y, 14, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.poleN; ctx.beginPath(); ctx.moveTo(cx, y - 11); ctx.lineTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.fill();
        ctx.fillStyle = C.poleS; ctx.beginPath(); ctx.moveTo(cx, y + 11); ctx.lineTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.fill();
      }
      ctx.restore();
      txt(ctx, s, xx + gw + 10, y, CHALK, a, size, 'left');
      xx += ws[k] + gap;
    });
  }

  // ═════════ 立體投影 ═════════
  // e：俯角（0＝正視，90°＝正上方往下看）；phi：繞導線（y 軸）轉動的方位角；D：透視距離
  function cam(cx, cy, e, phi = 0, s = 1, D = 2400) {
    return { cx, cy, s, D, e, ce: Math.cos(e), se: Math.sin(e), cp: Math.cos(phi), sp: Math.sin(phi) };
  }
  function P(c, x, y, z) {
    const x1 = x * c.cp - z * c.sp, z1 = x * c.sp + z * c.cp;
    const depth = z1 * c.ce + y * c.se;
    const f = c.D / (c.D - depth) * c.s;
    return { x: c.cx + x1 * f, y: c.cy + (-y * c.ce + z1 * c.se) * f, d: depth, f, z1 };
  }
  const z1Of = (c, x, z) => x * c.sp + z * c.cp;

  // 水平同心圓磁力線：part = 'back' | 'front' | 'all'；d = 電流方向（+1 向上 → θ 遞減）
  function ringRuns(c, r, y, part) {
    const N = 96, runs = []; let cur = null, prev = null;
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU, x = r * Math.cos(th), z = r * Math.sin(th);
      const zz = z1Of(c, x, z);
      const ok = part === 'all' || (part === 'back' ? zz < 0 : zz >= 0);
      const pt = P(c, x, y, z);
      if (ok) { if (!cur) { cur = []; if (i > 0) cur.push(prev); } cur.push(pt); }
      else if (cur) { cur.push(pt); if (cur.length > 1) runs.push(cur); cur = null; }
      prev = pt;
    }
    if (cur && cur.length > 1) runs.push(cur);
    return runs;
  }
  function drawRing(ctx, c, r, y, o) {
    // o: { part, color, width, alpha, d, amp(箭頭/流動點強度), t, dots, arrowAt:[θ...], reveal(0–1 畫出比例) }
    if (o.alpha <= 0.01) return;
    const part = o.part || 'all';
    ctx.save(); ctx.globalAlpha = o.alpha; ctx.strokeStyle = o.color || GREEN; ctx.lineWidth = o.width || 2.6; ctx.lineCap = 'round';
    for (const run of ringRuns(c, r, y, part)) { polyline(ctx, run); ctx.stroke(); }
    ctx.restore();
    const amp = o.amp || 0, d = o.d || 0;
    if (amp <= 0.01 || !d) return;
    const inPart = th => { const zz = z1Of(c, r * Math.cos(th), r * Math.sin(th)); return part === 'all' || (part === 'back' ? zz < 0 : zz >= 0); };
    const tangent = th => {
      const a = P(c, r * Math.cos(th), y, r * Math.sin(th)), b = P(c, r * Math.cos(th - d * 0.03), y, r * Math.sin(th - d * 0.03));
      return [a, Math.atan2(b.y - a.y, b.x - a.x)];
    };
    ctx.save(); ctx.globalAlpha = o.alpha * amp;
    for (const th of (o.arrowAt || [])) {
      if (!inPart(th)) continue;
      const [p, ang] = tangent(th); arrowHead(ctx, p.x, p.y, ang, o.arrowColor || o.color || GREEN, o.head || 11);
    }
    if (o.dots) {
      const om = 9000 / (r * r);
      ctx.fillStyle = '#eaffdf'; ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
      for (let k = 0; k < 3; k++) {
        const th = (k / 3) * TAU + r * 0.013 - d * om * (o.t || 0);
        if (!inPart(wrapPI(th))) continue;
        const p = P(c, r * Math.cos(th), y, r * Math.sin(th));
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  // 導線（銅色圓柱）＋電流（橘色流動虛線）
  function drawWire(ctx, c, y0, y1, o) {
    const a = P(c, 0, y0, 0), b = P(c, 0, y1, 0);
    const w = 2 * (o.rw || 8) * (a.f + b.f) / 2;
    const al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'butt';
    if (Math.hypot(b.x - a.x, b.y - a.y) > 0.5) {
      ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = '#a8693f'; ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,0.45)'; ctx.lineWidth = w * 0.22;
      ctx.beginPath(); ctx.moveTo(a.x - w * 0.22, a.y); ctx.lineTo(b.x - w * 0.22, b.y); ctx.stroke();
      const amp = Math.abs(o.cur || 0);
      if (amp > 0.01) {
        const up = o.cur > 0;
        const s0 = up ? a : b, s1 = up ? b : a;          // 從電流的上游畫到下游
        ctx.globalAlpha = al * amp; ctx.strokeStyle = ORANGE; ctx.lineWidth = w * 0.5; ctx.lineCap = 'round';
        ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
        ctx.setLineDash([12, 20]); ctx.lineDashOffset = -(o.t || 0) * 80;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
  function drawWireCap(ctx, c, y, rw, alpha = 1) {
    const p = P(c, 0, y, 0), rx = rw * p.f, ry = rw * p.f * c.se;
    if (ry < 0.5) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#c98a5c'; ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // 水平壓克力板（半透明）＋中央穿孔
  function drawBoard(ctx, c, half, y, alpha = 1) {
    const pts = [[-half, -half], [half, -half], [half, half], [-half, half]].map(([x, z]) => P(c, x, y, z));
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, Math.min(...pts.map(p => p.y)), 0, Math.max(...pts.map(p => p.y)));
    g.addColorStop(0, 'rgba(85,233,255,0.04)'); g.addColorStop(1, 'rgba(85,233,255,0.12)');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(85,233,255,0.42)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    polyline(ctx, pts); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 板子前緣的厚度
    const f0 = P(c, -half, y - 10, half), f1 = P(c, half, y - 10, half);
    ctx.strokeStyle = 'rgba(85,233,255,0.22)'; ctx.beginPath(); ctx.moveTo(pts[3].x, pts[3].y); ctx.lineTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y); ctx.lineTo(pts[2].x, pts[2].y); ctx.stroke();
    const h = P(c, 0, y, 0);
    ctx.fillStyle = 'rgba(5,15,12,0.85)'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 14 * h.f, 14 * h.f * c.se, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ═════════ 右手（立體：四指真的繞著導線彎曲） ═════════
  const HR = 24;  // 四指中心線繞導線的半徑
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
      fingers.push({ pts, th: FING.th[i], head: g });
    }
    return fingers;
  }
  // hs: { sg(+1 大拇指向上 / −1 向下), curl, slide, alpha, yc }
  function handXf(hs) {
    const sg = hs.sg, ox = sg * (hs.slide || 0);
    return (x, y, z) => [sg * x + ox, hs.yc + sg * y, z];
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
      const p = P(c, x, y, z), s = z1Of(c, x, z) >= 0 ? 'front' : 'back';
      if (s !== side) { if (cur) { cur.pts.push(p); runs.push(cur); } cur = { side: s, pts: cur ? [cur.pts[cur.pts.length - 1], p] : [p] }; side = s; }
      else cur.pts.push(p);
    });
    if (cur) runs.push(cur);
    return runs;
  }
  // layer: 'back'（畫在導線之前）| 'front'（畫在導線之後）
  function drawHand(ctx, c, hs, layer) {
    if (!hs || hs.alpha <= 0.01) return;
    const xf = handXf(hs), fingers = handGeom(hs.curl);
    const order = hs.sg > 0 ? [3, 2, 1, 0] : [0, 1, 2, 3];   // 由下往上畫（上面的手指離鏡頭較近）
    ctx.save(); ctx.globalAlpha = hs.alpha;
    if (layer === 'back') {
      for (const i of order) for (const run of fingerRuns(c, fingers[i], xf)) if (run.side === 'back') strokeLimb(ctx, run.pts, fingers[i].th * run.pts[0].f, SKIN_D, SKIN_E, null);
      ctx.restore(); return;
    }
    // 手背＋前臂（在導線右側；大拇指朝下時翻到左側）
    const proj = arr => arr.map(([x, y, z]) => { const w = xf(x, y, z); return P(c, w[0], w[1], w[2]); });
    const arm = proj([[HR + 80, 26, 4], [HR + 150, 24, 0], [HR + 150, -40, 0], [HR + 80, -44, 4]]);
    ctx.fillStyle = '#2b5f73'; ctx.strokeStyle = '#173847'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    polyline(ctx, arm); ctx.closePath(); ctx.fill(); ctx.stroke();
    const palm = proj([[HR * 0.85, 44, 10], [HR + 46, 50, 12], [HR + 80, 32, 8], [HR + 92, -4, 6], [HR + 90, -44, 6], [HR + 60, -52, 8], [HR + 16, -50, 10], [HR * 0.85, -44, 10]]);
    const g = ctx.createLinearGradient(palm[0].x, palm[0].y, palm[4].x, palm[4].y);
    g.addColorStop(0, '#ffd6b8'); g.addColorStop(0.55, SKIN); g.addColorStop(1, '#c47e55');
    ctx.fillStyle = g; ctx.strokeStyle = SKIN_E; ctx.lineWidth = 3.5;
    polyline(ctx, palm); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 四指前段（含指尖與指甲）
    for (const i of order) {
      const f = fingers[i];
      for (const run of fingerRuns(c, f, xf)) if (run.side === 'front') strokeLimb(ctx, run.pts, f.th * run.pts[0].f, SKIN, SKIN_E, 'rgba(255,236,220,0.55)');
      const q = f.pts[f.pts.length - 1], q2 = f.pts[f.pts.length - 4];
      const [x, y, z] = xf(q[0], q[1], q[2]), [x2, y2, z2] = xf(q2[0], q2[1], q2[2]);
      if (z1Of(c, x, z) >= 0) {
        const a = P(c, x, y, z), b = P(c, x2, y2, z2), ang = Math.atan2(a.y - b.y, a.x - b.x);
        ctx.save(); ctx.translate(a.x - Math.cos(ang) * 5, a.y - Math.sin(ang) * 5); ctx.rotate(ang);
        ctx.fillStyle = '#ffe6d6'; ctx.strokeStyle = 'rgba(140,81,47,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 7 * a.f, 5.5 * a.f, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    // 大拇指：沿著導線、指向電流方向
    const th = proj([[HR * Math.cos(0.62) + 2, 36, HR * Math.sin(0.62) + 8], [HR * Math.cos(0.5), 76, HR * Math.sin(0.5) + 9], [HR * Math.cos(0.42) - 1, 108, HR * Math.sin(0.42) + 10]]);
    strokeLimb(ctx, th, 24 * th[0].f, SKIN, SKIN_E, 'rgba(255,236,220,0.6)');
    const tip = th[2], pre = th[1], ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
    ctx.save(); ctx.translate(tip.x - Math.cos(ang) * 6, tip.y - Math.sin(ang) * 6); ctx.rotate(ang);
    ctx.fillStyle = '#ffe6d6'; ctx.strokeStyle = 'rgba(140,81,47,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 8 * tip.f, 7 * tip.f, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }
  // 手的關鍵位置（給標籤用）
  function handPt(c, hs, x, y, z) { const w = handXf(hs)(x, y, z); return P(c, w[0], w[1], w[2]); }

  // 四指彎曲方向的綠色環狀箭頭（在拳頭下方／上方一圈）
  function drawCurlArrow(ctx, c, hs, layer, a, reveal = 1) {
    if (a <= 0.01) return;
    const yl = -64, r = 46, xf = handXf({ sg: hs.sg, slide: 0, yc: hs.yc });
    const th0 = 0.35 * hs.sg + (hs.sg > 0 ? 0 : Math.PI);     // 起點跟著手指根部
    const span = 5.2 * reveal, N = 70, dTh = -hs.sg;           // 向上：θ 遞減；向下：θ 遞增
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const th = th0 + dTh * span * i / N, x = r * Math.cos(th), z = r * Math.sin(th);
      const [wx, wy, wz] = xf(0, yl, 0);
      pts.push({ p: P(c, x + wx, wy, z), front: z1Of(c, x, z) >= 0 });
    }
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = GREEN; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.shadowColor = GREEN; ctx.shadowBlur = 10;
    let run = [];
    const flush = () => { if (run.length > 1) { polyline(ctx, run); ctx.stroke(); } run = []; };
    pts.forEach((q, i) => {
      const want = layer === 'front' ? q.front : !q.front;
      if (want) { if (!run.length && i > 0) run.push(pts[i - 1].p); run.push(q.p); } else if (run.length) { run.push(q.p); flush(); }
    });
    flush();
    const last = pts[N], prev = pts[N - 2];
    if ((layer === 'front') === last.front && reveal > 0.05) arrowHead(ctx, last.p.x, last.p.y, Math.atan2(last.p.y - prev.p.y, last.p.x - prev.p.x), GREEN, 16);
    ctx.restore();
  }

  // 俯視小圖：導線端面＋圓形磁力線箭頭（d = +1 逆時針、−1 順時針）
  function topInset(ctx, cx, cy, R, d, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(16,45,38,0.95)'; ctx.strokeStyle = 'rgba(85,233,255,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 22, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const th = -Math.PI / 2 + k * TAU / 3;
      const x = cx + R * Math.cos(th), y = cy + R * Math.sin(th);
      // 畫面角度：逆時針（d=+1）＝ 角度遞減
      const ang = th - d * Math.PI / 2;
      arrowHead(ctx, x, y, ang, GREEN, 13);
    }
    ctx.fillStyle = '#a8693f'; ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ═════════ 場景 1：奧斯特的發現 ═════════
  const F = { cx: 500, cy: 350, e: 38 * DEG, half: 300, rings: [70, 87.5, 109.4, 136.7, 170.9, 213.6, 267], compR: 136.7, nComp: 8, swY: 290 };
  function needleDraw(ctx, c, x, z, beta, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const ring = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * TAU; ring.push(P(c, x + 27 * Math.cos(t), 0, z + 27 * Math.sin(t))); }
    ctx.fillStyle = 'rgba(10,28,23,0.95)'; ctx.strokeStyle = '#9fb7ad'; ctx.lineWidth = 2.5;
    polyline(ctx, ring); ctx.closePath(); ctx.fill(); ctx.stroke();
    const ux = Math.cos(beta), uz = Math.sin(beta), L = 21, w = 6;
    const n = P(c, x + ux * L, 0, z + uz * L), s = P(c, x - ux * L, 0, z - uz * L);
    const l = P(c, x - uz * w, 0, z + ux * w), r = P(c, x + uz * w, 0, z - ux * w);
    ctx.fillStyle = C.poleN; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(l.x, l.y); ctx.lineTo(r.x, r.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.poleS; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(l.x, l.y); ctx.lineTo(r.x, r.y); ctx.closePath(); ctx.fill();
    const o = P(c, x, 0, z); ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(o.x, o.y, 2.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function fieldState(step, t) {
    const s = { sw: 1, cur: 1, needleU: 99, compA: 1, ringA: F.rings.map(() => 0), dots: 0, ringArrow: 0, northA: 0, circleA: 0,
      tags: 0, layerA: 0, phi: 0, e: F.e, perpA: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.sw = 0; s.cur = 0; s.needleU = -1; s.northA = easeIO(seg(t, 0.8, 1.8));
      if (t < 2.6) { s.msg = tr('一條直導線穿過板子，旁邊擺一圈指南針', 'A straight wire passes through a board ringed by compasses'); }
      else { s.msg = tr('還沒通電：每個指南針都指向北方', 'No current yet: every compass points north'); s.mc = CYAN; }
    } else if (step === 1) {
      s.sw = easeIO(seg(t, 0.4, 0.9)); s.cur = seg(t, 0.9, 1.4); s.needleU = t - 1.0;
      s.northA = 1 - seg(t, 4, 5);
      s.circleA = easeIO(seg(t, 5.2, 6.2));
      if (t < 1.0) { s.msg = tr('接通開關……', 'Close the switch...'); s.mc = CYAN; }
      else if (t < 5.2) { s.msg = tr('通電瞬間：指針全部偏轉了！', 'The moment current flows, every needle swings!'); s.mc = YELLOW; }
      else { s.msg = tr('指針沿著圓排成一圈：繞著導線轉', 'The needles line up around a circle: they circle the wire'); s.mc = GREEN; }
    } else if (step === 2) {
      s.compA = 1 - 0.8 * easeIO(seg(t, 0.2, 1.6));
      s.ringA = F.rings.map((r, i) => easeIO(seg(t, 0.8 + i * 0.45, 1.4 + i * 0.45)));
      s.ringArrow = easeIO(seg(t, 4.0, 4.8)); s.dots = easeIO(seg(t, 4.4, 5.2));
      s.tags = easeIO(seg(t, 6.8, 7.6));
      if (t < 4.4) { s.msg = tr('磁力線：以導線為圓心的同心圓', 'Field lines: concentric circles centered on the wire'); s.mc = GREEN; }
      else if (t < 6.8) { s.msg = tr('越靠近導線，磁力線越密、亮點跑得越快', 'Nearer the wire, the lines crowd together and the dots run faster'); s.mc = CYAN; }
      else { s.msg = tr('內密外疏：越靠近導線，磁場越強', 'Dense inside, sparse outside: the field is stronger near the wire'); s.mc = YELLOW; }
    } else {
      s.compA = 0.2 * (1 - seg(t, 0, 1)); s.ringA = F.rings.map(() => 1); s.ringArrow = 1; s.dots = 1;
      s.layerA = easeIO(seg(t, 0.4, 1.8));
      const orbit = easeIO(seg(t, 0.2, 2.0)) * (1 - easeIO(seg(t, 10.2, 12)));
      s.phi = 0.5 * Math.sin((t - 0.2) / 10 * TAU) * orbit;
      s.e = lerp(F.e, 26 * DEG, orbit);
      s.perpA = easeIO(seg(t, 3.2, 4.0));
      if (t < 3.2) { s.msg = tr('立體來看：每一個高度都有同心圓磁力線', 'In 3D: there are concentric circles at every height'); s.mc = GREEN; }
      else if (t < 7.2) { s.msg = tr('磁場 B 沿著圓的切線方向', 'The field B points along the circle\'s tangent'); s.mc = GREEN; }
      else { s.msg = tr('磁場 B 與電流 I 的方向互相垂直', 'The field B is perpendicular to the current I'); s.mc = PINK; }
    }
    return s;
  }
  function needleBeta(th, u) {
    const b0 = -Math.PI / 2;                 // 北方＝板子後方（−z）
    if (u < 0) return b0;
    const target = th - Math.PI / 2;         // 電流向上：B ＝ (sinθ, −cosθ)
    const dlt = wrapPI(target - b0);
    const k = u > 30 ? 1 : 1 - Math.exp(-2.6 * u) * Math.cos(4.2 * u);
    return b0 + dlt * k;
  }
  function drawField(ctx, step, t) {
    const s = fieldState(step, t);
    const c = cam(F.cx, F.cy, s.e, s.phi, 1, 2400);
    const d = 1, amp = s.cur;
    // 下層同心圓（板子下方）與導線下段
    F.rings.forEach((r, i) => drawRing(ctx, c, r, -140, { part: 'all', alpha: s.layerA * 0.35 * s.ringA[i], width: 2, d, amp: s.layerA, arrowAt: [Math.PI * (i % 2 ? 0.2 : 0.8)] }));
    drawWire(ctx, c, -230, 0, { cur: amp, t, alpha: 0.55 });
    drawBoard(ctx, c, F.half, 0);
    // 北方指示（板子左後角）
    if (s.northA > 0.01) {
      const a = P(c, -230, 0, -150), b = P(c, -230, 0, -250);
      ctx.save(); ctx.globalAlpha = s.northA; ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      arrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), CHALK, 12); ctx.restore();
    }
    // 板上的同心圓
    F.rings.forEach((r, i) => drawRing(ctx, c, r, 0, { part: 'all', alpha: s.ringA[i], width: 2.8, d, amp: s.ringArrow * amp, t, dots: s.dots > 0.5,
      arrowAt: [Math.PI * (i % 2 ? 0.3 : 0.7), Math.PI * (i % 2 ? 1.3 : 1.7)] }));
    // 指南針排成的那一圈（虛線＋方向）
    if (s.circleA > 0.01) {
      ctx.save(); ctx.setLineDash([8, 8]);
      drawRing(ctx, c, F.compR, 0, { part: 'all', alpha: s.circleA * 0.9, color: YELLOW, width: 3, d, amp: 1, arrowAt: [0.5 * Math.PI, 1.5 * Math.PI, 0, Math.PI], head: 13 });
      ctx.restore();
    }
    for (let k = 0; k < F.nComp; k++) {
      const th = (22.5 + 45 * k) * DEG;
      needleDraw(ctx, c, F.compR * Math.cos(th), F.compR * Math.sin(th), needleBeta(th, s.needleU), s.compA);
    }
    // 上層同心圓（後半）→ 導線上段 → 上層前半
    F.rings.forEach((r, i) => drawRing(ctx, c, r, 150, { part: 'back', alpha: s.layerA * 0.45, width: 2, d, amp: s.layerA * 0.8, arrowAt: [Math.PI * (i % 2 ? 1.2 : 1.8)] }));
    // 導線上段含開關（斷開時真的留缺口）
    drawWire(ctx, c, 0, F.swY - 40, { cur: amp, t });
    drawWire(ctx, c, F.swY, 400, { cur: amp, t });
    const pA = P(c, 0, F.swY - 40, 0), pB = P(c, 0, F.swY, 0);
    {
      const len = Math.hypot(pB.x - pA.x, pB.y - pA.y), open = (1 - s.sw) * 38 * DEG;
      const ang = -Math.PI / 2 + open;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pA.x + Math.cos(ang) * len, pA.y + Math.sin(ang) * len); ctx.stroke();
      ctx.strokeStyle = '#d8c9a8'; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = CHALK; [pA, pB].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.fill(); });
      ctx.restore();
    }
    F.rings.forEach((r, i) => drawRing(ctx, c, r, 150, { part: 'front', alpha: s.layerA * 0.45, width: 2, d, amp: s.layerA * 0.8, arrowAt: [Math.PI * (i % 2 ? 0.2 : 0.8)] }));
    // 電流箭頭（導線上）
    if (amp > 0.01) {
      const a = P(c, 0, 50, 0), b = P(c, 0, 140, 0);
      ctx.save(); ctx.globalAlpha = amp; drawArrow3D(ctx, a.x, a.y, b.x, b.y, ORANGE, 9, 16); ctx.restore();
    }
    // B ⊥ I 立體示意（板上一點）
    if (s.perpA > 0.01) {
      const th = 55 * DEG, r = F.rings[3], x = r * Math.cos(th), z = r * Math.sin(th);
      const bx = Math.sin(th), bz = -Math.cos(th);   // 電流向上時的 B 方向
      const o = P(c, x, 0, z), bt = P(c, x + bx * 80, 0, z + bz * 80), it = P(c, x, 95, z);
      const q1 = P(c, x + bx * 20, 0, z + bz * 20), q2 = P(c, x + bx * 20, 20, z + bz * 20), q3 = P(c, x, 20, z);
      ctx.save(); ctx.globalAlpha = s.perpA;
      ctx.strokeStyle = YELLOW; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.lineTo(q3.x, q3.y); ctx.stroke();
      ctx.setLineDash([7, 5]); ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(it.x, it.y); ctx.stroke(); ctx.setLineDash([]);
      arrowHead(ctx, it.x, it.y, Math.atan2(it.y - o.y, it.x - o.x), ORANGE, 14);
      drawArrow3D(ctx, o.x, o.y, bt.x, bt.y, GREEN, 6, 14);
      ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, TAU); ctx.fill();
      ctx.restore();
      s._perp = { o, bt, it };
    }
    // ── 標籤（最後畫，避免被蓋住）──
    if (s.northA > 0.01) { const b = P(c, -230, 0, -250); tag(ctx, tr('北', 'North'), b.x - 52, b.y + 4, CHALK, s.northA, 22); }
    {
      const p = P(c, 0, F.swY - 20, 0);
      tag(ctx, s.sw > 0.5 ? tr('開關：接通', 'Switch: closed') : tr('開關：打開', 'Switch: open'), p.x + 120, p.y, s.sw > 0.5 ? YELLOW : CHALK, step < 2 ? 1 : 0);
    }
    if (amp > 0.01) { const p = P(c, 0, 175, 0); txt(ctx, 'I', p.x + 28, p.y, ORANGE, amp, 28); }
    if (s.tags > 0.01) {
      const pin = P(c, -F.rings[0], 0, 0), pout = P(c, F.rings[6], 0, 0);
      leader(ctx, 230, 132, pin.x, pin.y, YELLOW, s.tags); leader(ctx, 790, 132, pout.x, pout.y, PINK, s.tags);
      tag(ctx, tr('內密：磁場強', 'Dense: strong'), 230, 112, YELLOW, s.tags);
      tag(ctx, tr('外疏：磁場弱', 'Sparse: weak'), 790, 112, PINK, s.tags);
    }
    if (s._perp) {
      const { bt, it } = s._perp;
      txt(ctx, 'B', bt.x + 20, bt.y + 4, GREEN, s.perpA, 28);
      tag(ctx, tr('I 的方向', 'Direction of I'), it.x + 78, it.y - 6, ORANGE, s.perpA, 22);
      { const o = s._perp.o, sx = bt.x > o.x ? -1 : 1; tag(ctx, '90°', o.x + sx * 44, o.y + 30, YELLOW, s.perpA * seg(t, 7.2, 7.8), 22); }
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['compass', tr('指南針（紅＝N 極）', 'Compass (red = N)'), step < 3 ? 1 : 0], ['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁力線 B', 'Field line B'), step >= 1 ? 1 : 0]]);
  }

  // ═════════ 場景 2：安培右手定則 ═════════
  const R2 = { cx: 320, cy: 440, e: 20 * DEG, s: 1.15, yc: 200, rings: [60, 78, 101, 132, 172, 224], half: 255 };
  function flipState(u, dFrom) {
    const dTo = -dFrom, o = { hands: [] };
    o.cur = u < 0.5 ? dFrom * (1 - easeIO(seg(u, 0.18, 0.36))) : dTo * easeIO(seg(u, 0.42, 0.6));
    const a1 = 1 - seg(u, 0.22, 0.38);
    if (a1 > 0) o.hands.push({ sg: dFrom, curl: 1 - 0.9 * easeIO(seg(u, 0, 0.2)), slide: 130 * easeIO(seg(u, 0.08, 0.36)), alpha: a1 });
    const a2 = seg(u, 0.42, 0.56);
    if (a2 > 0) o.hands.push({ sg: dTo, curl: 0.1 + 0.9 * easeIO(seg(u, 0.72, 0.96)), slide: 130 * (1 - easeIO(seg(u, 0.44, 0.72))), alpha: a2 });
    o.d = u < 0.5 ? dFrom : dTo;
    return o;
  }
  function ruleState(step, t) {
    const s = { cur: 1, hands: [], curlA: 0, curlRev: 1, ringAmp: 0, ringDots: 0, inset: 0, insetD: 1, cmp: 0, thumbTag: 0, fingerTag: 0, rows: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.cur = seg(t, 0.2, 1.0);
      s.hands = [{ sg: 1, curl: 0.1 + 0.9 * easeIO(seg(t, 3.0, 5.0)), slide: 140 * (1 - easeIO(seg(t, 1.0, 3.0))), alpha: seg(t, 0.8, 1.6) }];
      s.thumbTag = easeIO(seg(t, 5.4, 6.0));
      if (t < 1.4) { s.msg = tr('長直導線通電：電流向上', 'A straight wire carries current upward'); s.mc = ORANGE; }
      else if (t < 5.2) { s.msg = tr('伸出右手，握住導線', 'Reach out with your right hand and grip the wire'); }
      else { s.msg = tr('大拇指指向電流方向', 'Point your thumb along the current'); s.mc = ORANGE; }
    } else if (step === 1) {
      s.hands = [{ sg: 1, curl: 1, slide: 0, alpha: 1 }];
      s.thumbTag = 1; s.curlA = easeIO(seg(t, 0.3, 0.9)); s.curlRev = easeIO(seg(t, 0.3, 2.2)); s.fingerTag = easeIO(seg(t, 1.6, 2.2));
      s.ringAmp = easeIO(seg(t, 2.8, 3.6)); s.ringDots = seg(t, 3.0, 3.6);
      s.inset = easeIO(seg(t, 5.4, 6.2)); s.rows = s.inset;
      if (t < 2.8) { s.msg = tr('其餘四指彎曲的方向……', 'The way your other four fingers curl...'); s.mc = GREEN; }
      else if (t < 5.4) { s.msg = tr('……就是磁力線環繞導線的方向', '...is the way the field lines circle the wire'); s.mc = GREEN; }
      else { s.msg = tr('從上往下看：磁力線逆時針環繞', 'Seen from above: the field circles counter-clockwise'); s.mc = GREEN; }
    } else if (step === 2) {
      const f = flipState(t / 7, 1);
      s.cur = f.cur; s.hands = f.hands; s.ringAmp = 1; s.ringDots = 1; s.inset = 1; s.insetD = f.d; s.rows = 1;
      s.curlA = 1 - seg(t, 0, 0.6);
      if (t < 2.6) { s.msg = tr('把電流反過來：改成向下流', 'Now reverse the current: it flows downward'); s.mc = ORANGE; }
      else if (t < 5.0) { s.msg = tr('右手跟著翻過來：大拇指朝下', 'Turn the right hand over: thumb points down'); s.mc = ORANGE; }
      else { s.msg = tr('四指的彎曲方向也反過來了', 'The fingers now curl the other way'); s.mc = GREEN; }
    } else if (step === 3) {
      s.cur = -1; s.hands = [{ sg: -1, curl: 1, slide: 0, alpha: 1 }];
      s.thumbTag = easeIO(seg(t, 0.2, 0.8)); s.curlA = easeIO(seg(t, 0.4, 1.0)); s.curlRev = easeIO(seg(t, 0.4, 2.4)); s.fingerTag = easeIO(seg(t, 1.6, 2.2));
      s.ringAmp = 1; s.ringDots = 1; s.inset = 1; s.insetD = -1; s.rows = 1;
      if (t < 4.6) { s.msg = tr('四指彎曲＝磁力線環繞方向', 'Finger curl = direction the field lines circle'); s.mc = GREEN; }
      else { s.msg = tr('從上往下看：磁力線順時針環繞', 'Seen from above: the field circles clockwise'); s.mc = GREEN; }
    } else {
      s.cmp = easeIO(seg(t, 0.2, 1.0)); s.rows = 1;
      if (t < 2.6) { s.cur = -1; s.hands = [{ sg: -1, curl: 1, slide: 0, alpha: 1 }]; s.curlA = 1 - seg(t, 2.0, 2.6); }
      else { const f = flipState(seg(t, 2.6, 6.6), -1); s.cur = f.cur; s.hands = f.hands; s.curlA = easeIO(seg(t, 6.8, 7.4)); }
      s.ringAmp = 1; s.ringDots = 1;
      s.msg = tr('電流反向：大拇指、四指、磁力線一起反轉', 'Reverse the current: thumb, fingers and field all flip'); s.mc = YELLOW;
    }
    return s;
  }
  function drawRule(ctx, step, t) {
    const s = ruleState(step, t);
    const c = cam(R2.cx, R2.cy, R2.e, 0, R2.s, 2400);
    const d = s.cur >= 0 ? 1 : -1, amp = Math.abs(s.cur);
    const hands = s.hands.map(h => Object.assign({ yc: R2.yc }, h));
    const main = hands.length ? hands[hands.length - 1] : { sg: d, yc: R2.yc };
    const ringO = (i, part) => ({ part, alpha: 0.9, width: 2.6, d, amp: s.ringAmp * amp, t, dots: s.ringDots > 0.5, color: '#f2fbe9', arrowColor: GREEN, head: 13,
      arrowAt: [Math.PI * (i % 2 ? 0.28 : 0.72), Math.PI * (i % 2 ? 1.28 : 1.72)] });
    drawWire(ctx, c, -150, 0, { cur: s.cur, t, alpha: 0.5 });
    drawBoard(ctx, c, R2.half, 0);
    R2.rings.forEach((r, i) => drawRing(ctx, c, r, 0, ringO(i, 'all')));
    hands.forEach(h => drawHand(ctx, c, h, 'back'));
    drawCurlArrow(ctx, c, main, 'back', s.curlA, s.curlRev);
    drawWire(ctx, c, 0, 420, { cur: s.cur, t });
    hands.forEach(h => drawHand(ctx, c, h, 'front'));
    drawCurlArrow(ctx, c, main, 'front', s.curlA, s.curlRev);
    // 電流大箭頭（避開手）
    if (amp > 0.01) {
      const [y0, y1] = d > 0 ? [24, 112] : [78, 10];
      const a = P(c, 0, y0, 0), b = P(c, 0, y1, 0);
      ctx.save(); ctx.globalAlpha = amp; drawArrow3D(ctx, a.x, a.y, b.x, b.y, ORANGE, 9, 16); ctx.restore();
      txt(ctx, 'I', a.x + 28, (a.y + b.y) / 2, ORANGE, amp, 28);
    }
    // ── 標籤 ──
    if (s.thumbTag > 0.01 && hands.length === 1) {
      const h = hands[0], tp = handPt(c, h, HR * Math.cos(0.42), 100, HR * Math.sin(0.42) + 10);
      const tx = h.sg > 0 ? 500 : 160, ty = h.sg > 0 ? 112 : 392;
      leader(ctx, tx + (h.sg > 0 ? -90 : 80), ty, tp.x, tp.y, ORANGE, s.thumbTag);
      tag(ctx, tr('大拇指＝電流方向', 'Thumb = current'), tx, ty, ORANGE, s.thumbTag);
    }
    if (s.fingerTag > 0.01 && hands.length === 1) {
      const h = hands[0], yy = P(c, 0, h.yc - 64 * h.sg, 0).y;
      leader(ctx, 412, yy, R2.cx + 58, yy, GREEN, s.fingerTag * s.curlA);
      tag(ctx, tr('四指彎曲方向', 'Finger curl'), 500, yy, GREEN, s.fingerTag * s.curlA);
    }
    // 右側：俯視圖 或 對照
    const panelA = s.inset * (1 - s.cmp);
    if (panelA > 0.01) {
      txt(ctx, tr('從上往下看', 'Seen from above'), 815, 130, CHALK, panelA, 24);
      topInset(ctx, 815, 265, 80, s.insetD, panelA);
      txt(ctx, s.insetD > 0 ? tr('逆時針', 'Counter-clockwise') : tr('順時針', 'Clockwise'), 815, 400, GREEN, panelA, 26);
    }
    if (s.cmp > 0.01) {
      txt(ctx, tr('從上往下看', 'Seen from above'), 815, 86, CHALK, s.cmp, 24);
      [[1, 172], [-1, 330]].forEach(([dd, yy]) => {
        const on = d === dd ? 1 : 0.45;
        topInset(ctx, 815, yy, 40, dd, s.cmp * on);
        const a = dd > 0 ? tr('I 向上', 'I up') : tr('I 向下', 'I down'), w = dd > 0 ? tr('逆時針', 'counter-clockwise') : tr('順時針', 'clockwise');
        const sz = fitSize(ctx, a + ' → ' + w, 340, 24, 22), wa = textW(ctx, a + ' → ', sz), wt = wa + textW(ctx, w, sz), x0 = 815 - wt / 2;
        txt(ctx, a + ' →', x0, yy + 80, ORANGE, s.cmp * on, sz, 'left');
        txt(ctx, w, x0 + wa, yy + 80, GREEN, s.cmp * on, sz, 'left');
      });
    }
    if (s.rows > 0.01) {
      txt(ctx, tr('大拇指 → 電流 I', 'Thumb → current I'), 815, 462, ORANGE, s.rows, 24);
      txt(ctx, tr('四指 → 磁場 B', 'Fingers → field B'), 815, 504, GREEN, s.rows, 24);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁場 B（磁力線方向）', 'Field B (field-line direction)'), 1]]);
  }

  // ═════════ 場景 3：× 與 • ═════════
  // 立體箭：center、軸向 a、長度 L；ref 用來決定羽毛的方位（羽毛與畫面成 45°，從背後看成 ×）
  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  };
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  function drawFlyArrow(ctx, c, o) {
    // o: { ctr:[x,y,z], a:[..], ref:[..], L, rs, hl, hr, vl, vh, col:{shaft,head,vane}, alpha }
    if (o.alpha <= 0.01) return;
    const a = v3.norm(o.a);
    let p = v3.norm(v3.add(o.ref, v3.mul(a, -v3.dot(o.ref, a)))), q = v3.cross(a, p);
    const tail = v3.add(o.ctr, v3.mul(a, -o.L / 2)), headB = v3.add(o.ctr, v3.mul(a, o.L / 2 - o.hl)), apex = v3.add(o.ctr, v3.mul(a, o.L / 2));
    const PP = w => P(c, w[0], w[1], w[2]);
    const view = [0, c.se, c.ce];               // 指向鏡頭的方向
    const facing = v3.dot(a, view);             // >0：朝向觀看者
    const parts = [];
    // 箭身
    const t0 = PP(v3.add(tail, v3.mul(a, 6))), t1 = PP(headB);
    parts.push({ d: (t0.d + t1.d) / 2, fn: () => {
      const w = 2 * o.rs * (t0.f + t1.f) / 2;
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(20,12,6,0.85)'; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.stroke();
      ctx.strokeStyle = o.col.shaft; ctx.lineWidth = w; ctx.stroke();
    } });
    // 箭頭（圓錐）
    const base = []; for (let i = 0; i < 28; i++) { const t = i / 28 * TAU; base.push(PP(v3.add(headB, v3.add(v3.mul(p, Math.cos(t) * o.hr), v3.mul(q, Math.sin(t) * o.hr))))); }
    const ap = PP(apex), bc = PP(headB);
    parts.push({ d: facing > 0 ? ap.d + 1 : (ap.d + bc.d) / 2, fn: () => {
      const hl = hull(base.concat([ap]));
      const g = ctx.createRadialGradient(ap.x, ap.y, 2, bc.x, bc.y, o.hr * bc.f * 1.6);
      g.addColorStop(0, '#fff8d0'); g.addColorStop(0.35, o.col.head); g.addColorStop(1, o.col.headD || o.col.head);
      ctx.fillStyle = g; ctx.strokeStyle = 'rgba(30,18,6,0.9)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      polyline(ctx, hl); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (facing > 0.55) {   // 迎面：看到尖尖的那一點
        const k = seg(facing, 0.55, 0.95);
        ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.arc(ap.x, ap.y, 6 * ap.f, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(ap.x, ap.y, 3 * ap.f, 0, TAU); ctx.fill(); ctx.restore();
      }
    } });
    // 四片羽毛（在 p±q 的 45° 方向）
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([u, v]) => {
      const dir = v3.norm(v3.add(v3.mul(p, u), v3.mul(q, v)));
      const r0 = o.rs * 0.8, r1 = o.rs + o.vh;
      const c0 = v3.add(tail, v3.mul(dir, r0)), c1 = v3.add(v3.add(tail, v3.mul(a, o.vl)), v3.mul(dir, r0));
      const c2 = v3.add(v3.add(tail, v3.mul(a, o.vl * 0.72)), v3.mul(dir, r1)), c3 = v3.add(v3.add(tail, v3.mul(a, -6)), v3.mul(dir, r1));
      const pts = [c0, c1, c2, c3].map(PP);
      parts.push({ d: pts.reduce((s, z) => s + z.d, 0) / 4, fn: () => {
        ctx.fillStyle = o.col.vane; ctx.strokeStyle = o.col.vaneE; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
        polyline(ctx, pts); ctx.closePath(); ctx.fill(); ctx.stroke();
      } });
    });
    parts.sort((u, v) => u.d - v.d);
    ctx.save(); ctx.globalAlpha = o.alpha; parts.forEach(pt => pt.fn()); ctx.restore();
    return { ap, tail: PP(tail), facing };
  }
  function symbolDisc(ctx, x, y, R, kind, color, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(16,45,38,0.95)'; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round';
    if (kind === 'dot') { ctx.beginPath(); ctx.arc(x, y, R * 0.2, 0, TAU); ctx.fill(); }
    else { const k = R * 0.5; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); }
    ctx.restore();
  }
  const ARROW_GEN = { L: 340, rs: 6, hl: 70, hr: 27, vl: 82, vh: 38, col: { shaft: '#d9c7a0', head: YELLOW, headD: '#c9a930', vane: 'rgba(255,120,183,0.95)', vaneE: '#ffc2dd' } };
  const ARROW_I = { L: 170, rs: 5, hl: 50, hr: 22, vl: 56, vh: 30, col: { shaft: '#e8963c', head: ORANGE, headD: '#c47a20', vane: 'rgba(255,212,154,0.9)', vaneE: '#fff1d6' } };
  const SY = { e0: 30 * DEG, cx: 360, rings: [55, 71.5, 93, 121, 157, 204], ringY: -90, yc: 40 };

  function symbolState(step, t) {
    const s = { mode: 'fly', msg: '', mc: CHALK };
    if (step === 0) {
      s.psi = 0; s.z = 0; s.x = lerp(-760, 0, easeIO(seg(t, 0.2, 2.4))); s.y = 6 * Math.sin(t * 2.2);
      s.partTags = easeIO(seg(t, 2.8, 3.6));
      if (t < 2.8) { s.msg = tr('把「方向」想成一支正在飛的箭', 'Think of a direction as an arrow in flight'); s.mc = YELLOW; }
      else { s.msg = tr('前端是尖尖的箭頭，後端是羽毛', 'A sharp tip at the front, feathers at the back'); }
    } else if (step === 1) {
      s.psi = easeIO(seg(t, 0.3, 2.8)) * Math.PI / 2; s.z = 260 * easeIO(seg(t, 2.6, 4.2)); s.x = 0; s.y = 0;
      s.dotA = easeIO(seg(t, 4.6, 5.4));
      if (t < 4.4) { s.msg = tr('箭轉過來，朝著你飛來……', 'The arrow turns and flies straight at you...'); s.mc = CYAN; }
      else { s.msg = tr('只看到尖尖的箭頭：• ＝ 指出紙面', 'You see only the tip: • = out of the page'); s.mc = CYAN; }
    } else if (step === 2) {
      s.psi = Math.PI / 2 - easeIO(seg(t, 0.3, 3.3)) * Math.PI; s.z = lerp(260, -220, easeIO(seg(t, 0.6, 4.0))); s.x = 0; s.y = 0;
      s.dotA = 1; s.dotMove = easeIO(seg(t, 0.2, 1.4)); s.crossA = easeIO(seg(t, 4.6, 5.4));
      if (t < 4.4) { s.msg = tr('箭轉過去，離你而去……', 'The arrow turns and flies away from you...'); s.mc = PINK; }
      else { s.msg = tr('只看到箭尾的羽毛：× ＝ 指入紙面', 'You see only the feathers: × = into the page'); s.mc = PINK; }
    } else {
      s.mode = 'wire';
      const down = step === 3;
      if (down) {
        s.fade = seg(t, 0, 0.8); s.e = lerp(SY.e0, Math.PI / 2, easeIO(seg(t, 2.8, 6.2)));
        s.flip = 0; s.cur = -seg(t, 0.4, 1.2); s.ringAmp = easeIO(seg(t, 1.4, 2.2));
        s.hands = [{ sg: -1, curl: 0.1 + 0.9 * easeIO(seg(t, 0.4, 1.8)), slide: 0, alpha: seg(t, 0.2, 0.8) * (1 - seg(t, 3.0, 4.4)) }];
        s.symA = easeIO(seg(t, 6.4, 7.2)); s.cardA = easeIO(seg(t, 7.0, 7.8));
        if (t < 2.8) { s.msg = tr('電流向下流：右手大拇指朝下，四指繞著導線', 'Current flows down: right thumb down, fingers around the wire'); s.mc = ORANGE; }
        else if (t < 6.4) { s.msg = tr('把眼睛移到導線正上方，往下看……', 'Move your eye directly above the wire and look down...'); s.mc = CYAN; }
        else { s.msg = tr('電流離你而去：看到箭尾 ×，B 順時針', 'The current goes away from you: tail ×, B clockwise'); s.mc = GREEN; }
      } else {
        s.fade = 1;
        s.e = t < 4.2 ? lerp(Math.PI / 2, SY.e0, easeIO(seg(t, 0.2, 2.0))) : lerp(SY.e0, Math.PI / 2, easeIO(seg(t, 4.4, 7.6)));
        s.flip = easeIO(seg(t, 2.0, 3.6));
        s.cur = t < 2.8 ? -(1 - seg(t, 1.8, 2.6)) : seg(t, 3.0, 3.8);
        s.ringAmp = 1;
        s.hands = [{ sg: 1, curl: 0.1 + 0.9 * easeIO(seg(t, 3.4, 4.4)), slide: 0, alpha: seg(t, 3.0, 3.6) * (1 - seg(t, 4.6, 6.0)) }];
        s.symA = easeIO(seg(t, 7.8, 8.6)); s.cardA = easeIO(seg(t, 8.4, 9.2)); s.oldSym = 1 - seg(t, 0, 0.8);
        if (t < 2.0) { s.msg = tr('回到側面，把電流改成向上流', 'Back to the side: make the current flow up'); s.mc = ORANGE; }
        else if (t < 4.4) { s.msg = tr('箭翻過來朝上：右手大拇指朝上', 'The arrow turns to point up: right thumb up'); s.mc = ORANGE; }
        else if (t < 7.8) { s.msg = tr('再從正上方往下看……', 'Look down from directly above again...'); s.mc = CYAN; }
        else { s.msg = tr('電流朝你而來：看到箭尖 •，B 逆時針', 'The current comes at you: tip •, B counter-clockwise'); s.mc = GREEN; }
      }
    }
    return s;
  }
  function drawSymbol(ctx, step, t) {
    const s = symbolState(step, t);
    if (s.mode === 'fly') {
      const c = cam(500, 300, 0, 0, 1.25, 900);
      const ctr = [s.x, s.y, s.z], a = [Math.cos(s.psi), 0, Math.sin(s.psi)];
      const r = drawFlyArrow(ctx, c, Object.assign({ ctr, a, ref: [0, 1, 0], alpha: 1 }, ARROW_GEN));
      if (s.partTags > 0.01) {
        const tip = P(c, s.x + 170, s.y, 0), fe = P(c, s.x - 130, s.y + 20, 0);
        leader(ctx, tip.x - 10, 410, tip.x - 12, tip.y + 8, YELLOW, s.partTags); tag(ctx, tr('箭尖', 'Tip'), tip.x - 10, 420, YELLOW, s.partTags);
        leader(ctx, fe.x, 410, fe.x, fe.y + 22, PINK, s.partTags); tag(ctx, tr('羽毛（箭尾）', 'Feathers (tail)'), fe.x, 420, PINK, s.partTags);
        txt(ctx, tr('飛行方向 →', 'Direction of flight →'), 500, 170, CHALK, s.partTags, 24);
      }
      // 迎面的 •（第 3 步移到左側並淡一點）
      if (s.dotA > 0.01) {
        const mv = s.dotMove || 0, x = lerp(830, 165, mv), al = s.dotA * (1 - 0.4 * mv);
        symbolDisc(ctx, x, 300, 62, 'dot', CYAN, al);
        tag(ctx, tr('• 指出紙面', '• Out of the page'), x, 405, CYAN, al);
        txt(ctx, tr('（像迎面而來的箭尖）', '(an arrow tip coming at you)'), x, 450, CHALK, al * (1 - mv), 22);
      }
      if (s.crossA > 0.01) {
        symbolDisc(ctx, 830, 300, 62, 'cross', PINK, s.crossA);
        tag(ctx, tr('× 指入紙面', '× Into the page'), 830, 405, PINK, s.crossA);
        txt(ctx, tr('（像離去的箭尾羽毛）', '(the feathers going away)'), 830, 450, CHALK, s.crossA, 22);
      }
      if (step >= 1) {
        const v = r.facing > 0.9 ? tr('從你的位置看：箭尖朝你', 'From where you sit: the tip faces you') : r.facing < -0.9 ? tr('從你的位置看：箭尾朝你', 'From where you sit: the tail faces you') : '';
        txt(ctx, v, 500, 520, CHALK, v ? 1 : 0, 24);
      }
      topMsg(ctx, s.msg, s.mc);
      legend(ctx, [['B', tr('箭＝方向（可以代表 I，也可以代表 B）', 'Arrow = a direction (it can stand for I or B)'), 1]]);
      return;
    }
    // ── 導線＋俯視 ──
    const k = (s.e - SY.e0) / (Math.PI / 2 - SY.e0);
    const c = cam(SY.cx, lerp(362, 330, k), s.e, 0, 1, 2200);
    const cur = s.cur, d = cur >= 0 ? 1 : -1, amp = Math.abs(cur);
    const hands = s.hands.map(h => Object.assign({ yc: SY.yc }, h));
    ctx.save(); ctx.globalAlpha = s.fade;
    const ro = (i, part) => ({ part, alpha: 1, width: 2.8, d, amp: s.ringAmp * amp, t, dots: true, arrowAt: [Math.PI * (i % 2 ? 0.25 : 0.75), Math.PI * (i % 2 ? 1.25 : 1.75)], head: 12 });
    SY.rings.forEach((r, i) => drawRing(ctx, c, r, SY.ringY, ro(i, 'back')));
    hands.forEach(h => drawHand(ctx, c, h, 'back'));
    drawWire(ctx, c, -200, 125, { cur, t });
    drawWireCap(ctx, c, 125, 8);
    hands.forEach(h => drawHand(ctx, c, h, 'front'));
    SY.rings.forEach((r, i) => drawRing(ctx, c, r, SY.ringY, ro(i, 'front')));
    // 代表電流的橘色箭（沿導線、在導線上方）
    const om = s.flip * Math.PI;                     // 0：向下；π：向上（經過朝向鏡頭的一側翻轉）
    const ax = [0, -Math.cos(om), Math.sin(om) * 0.0001 + Math.sin(om)];
    const ar = drawFlyArrow(ctx, c, Object.assign({ ctr: [0, 222, 0], a: ax, ref: [1, 0, 0], alpha: 1 }, ARROW_I));
    ctx.restore();
    // 標籤
    const top = k > 0.98;
    const p0 = P(c, 0, 222, 0);
    if (!top) txt(ctx, 'I', p0.x + 46, p0.y, ORANGE, s.fade * (1 - k), 28);
    if (s.symA > 0.01) {
      ctx.save(); ctx.globalAlpha = s.symA; ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(ar.ap.x * 0 + p0.x, p0.y, 44, 0, TAU); ctx.stroke(); ctx.restore();
      txt(ctx, 'I', p0.x + 62, p0.y - 34, ORANGE, s.symA, 28);
      const rb = SY.rings[5], pb = P(c, rb * Math.cos(-0.25 * Math.PI), SY.ringY, rb * Math.sin(-0.25 * Math.PI));
      txt(ctx, 'B', pb.x + 26, pb.y - 14, GREEN, s.symA, 28);
    }
    if (s.cardA > 0.01) {
      const x = 815, isX = d < 0, col = isX ? PINK : CYAN;
      symbolDisc(ctx, x, 170, 44, isX ? 'cross' : 'dot', ORANGE, s.cardA);
      const l1 = isX ? tr('看到箭尾的羽毛', 'We see the feathers') : tr('看到迎面的箭尖', 'We see the tip');
      const l2 = isX ? tr('I×：電流流入紙面', 'I×: current into page') : tr('I•：電流流出紙面', 'I•: current out of page');
      const l3 = isX ? tr('B 順時針', 'B clockwise') : tr('B 逆時針', 'B counter-clockwise');
      txt(ctx, l1, x, 250, col, s.cardA, fitSize(ctx, l1, 330, 24, 22));
      txt(ctx, l2, x, 294, ORANGE, s.cardA, fitSize(ctx, l2, 330, 24, 22));
      txt(ctx, l3, x, 338, GREEN, s.cardA, fitSize(ctx, l3, 330, 26, 22));
      topInset(ctx, x, 440, 44, d, s.cardA);
    }
    if (s.oldSym > 0.01) {
      symbolDisc(ctx, 815, 170, 44, 'cross', ORANGE, s.oldSym);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I（橘色箭）', 'Current I (orange arrow)'), 1], ['B', tr('磁力線 B', 'Field line B'), 1]]);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'st-field': {
      draw: drawField,
      steps: [
        { d: 6.0, b: ['沒通電', 'No current'],
          cap: ['導線旁擺一圈指南針。<strong class="accent-cyan">還沒通電</strong>時，每個指南針都指向<strong class="accent-red">北方</strong>。',
                'A ring of compasses sits around the wire. With <strong class="accent-cyan">no current</strong>, every compass points <strong class="accent-red">north</strong>.'] },
        { d: 10.0, b: ['通電', 'Switch on'],
          cap: ['1820 年<strong class="accent-orange">奧斯特</strong>發現：導線一通電，旁邊的指南針就<strong class="accent-yellow">偏轉</strong>了！指針沿著圓排成一圈，繞著導線轉。',
                'In 1820 <strong class="accent-orange">Oersted</strong> found that when the wire carries current, nearby compasses <strong class="accent-yellow">deflect</strong>! The needles line up around a circle that wraps the wire.'] },
        { d: 11.0, b: ['同心圓', 'Circles'],
          cap: ['通電長直導線周圍的磁力線，是以導線為圓心的<strong class="accent-cyan">同心圓</strong>；越靠近導線越密，磁場越強（<strong class="accent-yellow">內密外疏</strong>）。',
                'Around a current-carrying straight wire, the field lines are <strong class="accent-cyan">concentric circles</strong> centered on the wire, denser and stronger near it (<strong class="accent-yellow">dense inside, sparse outside</strong>).'] },
        { d: 12.0, b: ['互相垂直', 'Perpendicular'],
          cap: ['每一個高度都有同心圓。磁場 <strong class="accent-green">B</strong> 沿著圓的切線方向，與電流 <strong class="accent-orange">I</strong> 的方向<strong class="accent-pink">互相垂直</strong>。',
                'There are circles at every height. The field <strong class="accent-green">B</strong> runs along each circle\'s tangent, <strong class="accent-pink">perpendicular</strong> to the current <strong class="accent-orange">I</strong>.'] }
      ]
    },
    'st-rule': {
      draw: drawRule,
      steps: [
        { d: 8.0, b: ['握住', 'Grip'],
          cap: ['伸出<strong class="accent-cyan">右手</strong>握住導線，<strong class="accent-orange">大拇指</strong>指向<strong class="accent-orange">電流方向</strong>（向上）。',
                'Grip the wire with your <strong class="accent-cyan">right hand</strong>, <strong class="accent-orange">thumb</strong> along the <strong class="accent-orange">current</strong> (upward).'] },
        { d: 10.0, b: ['逆時針', 'CCW'],
          cap: ['其餘<strong class="accent-green">四指彎曲</strong>的方向，就是<strong class="accent-green">磁力線</strong>環繞的方向：電流向上，從上往下看是<strong class="accent-green">逆時針</strong>。',
                'The way your <strong class="accent-green">four fingers curl</strong> is the way the <strong class="accent-green">field lines</strong> circle: current up, seen from above, <strong class="accent-green">counter-clockwise</strong>.'] },
        { d: 7.0, b: ['反向', 'Reverse'],
          cap: ['電流改成<strong class="accent-orange">向下</strong>：右手翻過來，大拇指朝下，四指的彎曲方向也跟著反轉。',
                'Make the current flow <strong class="accent-orange">down</strong>: turn the right hand over, thumb down, and the finger curl reverses too.'] },
        { d: 10.0, b: ['順時針', 'CW'],
          cap: ['大拇指朝下時，四指彎曲方向＝磁力線方向：從上往下看是<strong class="accent-green">順時針</strong>。',
                'With the thumb down, the finger curl = the field direction: seen from above, <strong class="accent-green">clockwise</strong>.'] },
        { d: 9.0, b: ['對照', 'Compare'],
          cap: ['電流反向時，<strong class="accent-orange">大拇指</strong>、<strong class="accent-green">四指</strong>與<strong class="accent-green">磁力線箭頭</strong>一起反轉：向上→逆時針，向下→順時針。',
                'When the current reverses, the <strong class="accent-orange">thumb</strong>, the <strong class="accent-green">fingers</strong> and the <strong class="accent-green">field arrows</strong> all flip: up → counter-clockwise, down → clockwise.'] }
      ]
    },
    'st-symbol': {
      draw: drawSymbol,
      steps: [
        { d: 8.0, b: ['一支箭', 'Arrow'],
          cap: ['紙面上畫不出「朝你」或「離你」的方向，就把方向想成一支<strong class="accent-yellow">飛行的箭</strong>：前面是箭尖，後面是羽毛。',
                'A flat page can\'t show "toward you" or "away from you", so picture the direction as an <strong class="accent-yellow">arrow in flight</strong>: tip in front, feathers behind.'] },
        { d: 9.0, b: ['迎面 •', 'Toward •'],
          cap: ['箭朝你飛來，只看得到尖尖的箭頭：<strong class="accent-cyan">• 代表指出紙面</strong>。',
                'An arrow flying at you shows only its tip: <strong class="accent-cyan">• means out of the page</strong>.'] },
        { d: 9.0, b: ['背面 ×', 'Away ×'],
          cap: ['箭離你而去，只看得到箭尾的羽毛：<strong class="accent-pink">× 代表指入紙面</strong>。符號只表示方向，旁邊標 <strong class="accent-orange">I</strong> 是電流、標 <strong class="accent-green">B</strong> 是磁場。',
                'An arrow flying away shows only its feathers: <strong class="accent-pink">× means into the page</strong>. The symbol only shows direction: next to <strong class="accent-orange">I</strong> it is current, next to <strong class="accent-green">B</strong> it is field.'] },
        { d: 12.0, b: ['I×', 'I×'],
          cap: ['電流向下流，從正上方往下看，看到的是箭尾：<strong class="accent-orange">I×</strong>（流入紙面）。右手大拇指朝下，周圍 <strong class="accent-green">B 為順時針</strong>。',
                'Current flows down; looking from directly above we see the tail: <strong class="accent-orange">I×</strong> (into the page). Right thumb down, so <strong class="accent-green">B circles clockwise</strong>.'] },
        { d: 12.0, b: ['I•', 'I•'],
          cap: ['電流改成向上，從正上方看到迎面的箭尖：<strong class="accent-orange">I•</strong>（流出紙面）。右手大拇指朝上，周圍 <strong class="accent-green">B 為逆時針</strong>。',
                'Make the current flow up; from directly above we see the tip: <strong class="accent-orange">I•</strong> (out of the page). Right thumb up, so <strong class="accent-green">B circles counter-clockwise</strong>.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  // 老師講解模式（AGENTS 10.7）的播放設定：模組層級，activate() 換場景時不重設
  const CTL = { paused: false, loop: true, endFn: null, ended: false };

  function canvasCtx() { const c = document.getElementById('straightCanvas'); return c ? c.getContext('2d') : null; }
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
    const res = document.getElementById('straightResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-straight');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-straight'); if (!row) return;
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

  function visible() { const c = document.getElementById('straightCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  EmAnim.straight = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'st-field';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; CTL.ended = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-straight'); if (row) row.innerHTML = '';
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
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
