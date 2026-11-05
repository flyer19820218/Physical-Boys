/* electromagnetism_2_crane_1104_v1.js — 「電磁鐵起重機」分頁動畫（#craneCanvas，1000×600）
 *
 * 契約：window.EmAnim.crane = { activate(sceneId), deactivate(), relang(), ctl, _frameAt, _info, _state }
 * 依賴頁面現成的：tr、C、TAU、clear、label、drawArrow3D（直接呼叫，不複製、不修改）。
 * 起重機、電磁鐵、廢車、電池、開關、迴紋針都在本檔自己畫。畫布不綁任何事件；唯一控制是 #steps-crane 的步驟鈕。
 * 畫面是「時間 t 的純函式」：每一幀只由（場景, 步驟, 步內秒數）決定，跳步驟與真的播到那裡完全相同。
 *
 * 物理（簡報第 36 行）：軟鐵芯通電時被磁化、斷電後磁性消失（鋼會殘留磁性，不能當鐵芯）；
 *   磁力隨電池串聯數（電流）、匝數（長度不變時越密越強）、插入鐵芯而增強。
 * 極性：電磁鐵鐵芯直立，正面那一段線圈電流向右 → 從上方俯視為逆時針 → 鐵芯內 B 向上 → 上端 N、下端 S（簡報第 34 行）。
 *   外部磁力線由上端 N 繞到下端 S，箭頭向下。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * crane-principle 電磁鐵的秘密，共 40 s
 *   1 起重機    7 s  回收場起重機下掛電磁鐵：標出電磁鐵、軟鐵芯、線圈、電池、開關（斷開）、鐵屑
 *   2 開關斷開  7 s  電磁鐵放到廢車上 → 吊起來，廢車不動：沒有電流就沒有磁性
 *   3 通電      9 s  再放下 → 開關接通、電流流過線圈 → 鐵芯磁化（上 N 下 S、磁力線）→ 鐵屑飛上來 → 吊起整輛廢車
 *   4 搬運      7 s  保持通電，台車把廢車移到回收區（吊掛輕微擺動）
 *   5 斷電     10 s  開關斷開 → 磁性立刻消失 → 廢車與鐵屑落下；卡片：軟鐵通電才有磁性／鋼會殘留磁性不能當鐵芯
 * crane-factors 增強磁力的三大要素，共 40 s（左右兩組同時接通，只改一個變因）
 *   1 電池數   10 s  1 顆 vs 3 顆串聯（匝數 10、有鐵芯）→ 吸起 2 vs 7 個迴紋針
 *   2 匝數     10 s  6 圈 vs 14 圈，線圈長度相同（2 顆電池、有鐵芯）→ 3 vs 7
 *   3 鐵芯     10 s  空心 vs 軟鐵芯（3 顆電池、匝數 10）→ 1 vs 7
 *   4 整理     10 s  三項整理：電流越大、匝數越多、插入軟鐵芯 → 磁力越強
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.EmAnim = window.EmAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink;
  const POLE_N = C.poleN, POLE_S = C.poleS;
  const CHALK = '#f2ecd9', MUTED = '#b9c7bf', PANEL = 'rgba(12,30,25,0.92)';

  // ───────── 小工具（與同課其他動畫檔同一套） ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
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
  function card(ctx, x, y, w, h, a, edge = 'rgba(85,233,255,0.35)') {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = edge; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
  }
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
      ctx.restore();
      txt(ctx, s, xx + gw + 10, y, CHALK, a, size, 'left');
      xx += ws[k] + gap;
    });
  }
  function poleBadge(ctx, x, y, isN, a, r = 17) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 24);
  }

  // ═════════ 導線（含流動的電流虛線） ═════════
  // pts: [{x,y,f}]，f＝false 表示在鐵芯後方（線圈的背面半圈）。part：'all' | 'back' | 'front'
  function drawPath(ctx, pts, o) {
    const part = o.part || 'all', al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01 || pts.length < 2) return;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const runs = []; let cur = null;
    pts.forEach((q, i) => {
      const ok = part === 'all' || (part === 'back' ? q.f === false : q.f !== false);
      if (ok) { if (!cur) { cur = { i0: i > 0 ? i - 1 : i, p: [] }; if (i > 0) cur.p.push(pts[i - 1]); } cur.p.push(q); }
      else if (cur) { cur.p.push(q); runs.push(cur); cur = null; }
    });
    if (cur) runs.push(cur);
    const w = o.w || 5;
    ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of runs) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 3; polyline(ctx, r.p); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = part === 'back' ? '#7a4e32' : '#b4744a'; ctx.lineWidth = w; polyline(ctx, r.p); ctx.stroke(); }
    if (part !== 'back' && w >= 4) for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.38)'; ctx.lineWidth = Math.max(1.2, w * 0.25); ctx.beginPath(); r.p.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    const amp = o.amp || 0;
    if (amp > 0.01) {
      ctx.globalAlpha = al * amp * (part === 'back' ? 0.5 : 1); ctx.strokeStyle = ORANGE; ctx.lineWidth = Math.max(2.4, w * 0.62); ctx.shadowColor = ORANGE; ctx.shadowBlur = o.glow || 8;
      ctx.setLineDash([10, 16]);
      for (const r of runs) { ctx.lineDashOffset = (o.off || 0) + cum[r.i0] - (o.t || 0) * (o.speed || 60); polyline(ctx, r.p); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // 直立線圈（螺旋）：從左端開始，正面（下半橢圓）由左往右，背面由右往左，一圈一圈往下
  function helix(cx, y0, y1, n, rx, ry) {
    const N = Math.ceil(n * 40), out = [];
    for (let i = 0; i <= N; i++) {
      const u = n * i / N, th = Math.PI - TAU * u, s = Math.sin(th);
      out.push({ x: cx + rx * Math.cos(th), y: y0 + (y1 - y0) * u / n + ry * s, f: s > -0.02 });
    }
    return out;
  }
  // 正面每一圈中點的電流箭頭（向右）
  function coilArrows(ctx, cx, y0, y1, n, ry, amp, every = 1) {
    if (amp <= 0.05) return;
    ctx.save(); ctx.globalAlpha = amp;
    for (let k = 0; k < Math.floor(n); k += every) {
      const y = y0 + (y1 - y0) * (k + 0.25) / n + ry;
      arrowHead(ctx, cx + 4, y, 0, ORANGE, 10);
    }
    ctx.restore();
  }
  // 開關（閘刀）：pivot → contact，sw：0＝斷開（刀片翹起、導線真的有缺口）→ 1＝接通
  function knifeSwitch(ctx, px, py, qx, sw) {
    const L = qx - px, a = -(1 - sw) * 0.62;
    ctx.save();
    ctx.fillStyle = '#4a5f58'; ctx.strokeStyle = '#22352f'; ctx.lineWidth = 2;
    rrect(ctx, px - 8, py + 2, L + 16, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9d3d6'; ctx.beginPath(); ctx.arc(qx, py, 5, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = '#22352f'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + L * Math.cos(a), py + L * Math.sin(a)); ctx.stroke();
    ctx.strokeStyle = '#dfe6e8'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + L * Math.cos(a), py + L * Math.sin(a)); ctx.stroke();
    ctx.fillStyle = '#e6c46a'; ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
    const hx = px + (L + 8) * Math.cos(a), hy = py + (L + 8) * Math.sin(a);
    ctx.fillStyle = '#7d2f2f'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 乾電池（橫放，正極凸頭朝 plusLeft 那一側）
  function cell(ctx, x, y, w, h, plusLeft) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5f8f9c'); g.addColorStop(0.45, '#2f5f6c'); g.addColorStop(1, '#1d3d47');
    ctx.fillStyle = g; ctx.strokeStyle = '#13282e'; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,179,71,0.75)';
    ctx.fillRect(plusLeft ? x + 3 : x + w - 9, y + 2, 6, h - 4);
    ctx.fillStyle = '#c9d3d6';
    if (plusLeft) ctx.fillRect(x - 5, y + h / 2 - 5, 5, 10); else ctx.fillRect(x + w, y + h / 2 - 5, 5, 10);
    ctx.restore();
  }

  // ═════════ 場景 1：起重機 ═════════
  const GY = 500, X0 = 500, X1 = 800, YUP = 150, YDN = 264, MAGH = 144, ROOF = 92, PIV = 118;
  const CRX = 54, CRY = 11, CTURN = 7.5;        // 線圈半徑、匝數（半圈結尾 → 尾端在右側）
  const BIN = { x0: 680, x1: 920, top: 454 };
  const CRANE = '#c2a04a', CRANE_D = '#6f5a24';
  const SCR = [
    { gx: -108, ga: 0.5, sx: -64, sy: 6, sa: 0.9, bx: -70, k: 0 },
    { gx: -130, ga: -0.6, sx: -50, sy: 14, sa: -0.4, bx: -36, k: 1 },
    { gx: -152, ga: 1.1, sx: -80, sy: 18, sa: 1.3, bx: 4, k: 2 },
    { gx: 108, ga: -0.3, sx: 52, sy: 6, sa: -0.8, bx: 36, k: 1 },
    { gx: 130, ga: 0.8, sx: 66, sy: 14, sa: 0.3, bx: 70, k: 0 },
    { gx: 152, ga: -1.2, sx: 80, sy: 20, sa: -1.1, bx: -92, k: 2 }
  ];
  const SHARD = [[[-10, -3], [6, -7], [11, 1], [-2, 6], [-9, 3]], [[-8, -6], [9, -4], [7, 5], [-6, 7]], [[-12, 0], [-2, -6], [12, -2], [4, 6]]];
  function scrap(ctx, x, y, ang, k, a = 1) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = k === 1 ? '#8a5a40' : '#8f9894'; ctx.strokeStyle = '#2c3a36'; ctx.lineWidth = 1.5;
    ctx.beginPath(); SHARD[k].forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawCar(ctx, cx, by) {
    ctx.save(); ctx.translate(cx, by); ctx.lineJoin = 'round';
    const body = [[-100, -22], [-100, -50], [-68, -58], [-50, -92], [45, -92], [64, -58], [100, -52], [100, -22]];
    const g = ctx.createLinearGradient(0, -92, 0, -22);
    g.addColorStop(0, '#a8613f'); g.addColorStop(1, '#6a3826');
    ctx.fillStyle = g; ctx.strokeStyle = '#3e2016'; ctx.lineWidth = 3;
    ctx.beginPath(); body.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2d4a52'; ctx.strokeStyle = '#3e2016'; ctx.lineWidth = 2;
    [[[-46, -86], [-6, -86], [-6, -62], [-62, -62]], [[2, -86], [40, -86], [56, -62], [2, -62]]].forEach(p => { ctx.beginPath(); p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(242,236,217,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(10, -84); ctx.lineTo(24, -70); ctx.lineTo(18, -64); ctx.moveTo(24, -70); ctx.lineTo(36, -74); ctx.stroke();
    ctx.fillStyle = 'rgba(70,30,18,0.55)';
    [[-80, -40, 14, 7], [30, -34, 18, 8], [72, -44, 10, 6], [-20, -50, 9, 5]].forEach(([x, y, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = 'rgba(40,18,10,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -58); ctx.lineTo(-4, -24); ctx.moveTo(-60, -44); ctx.lineTo(-48, -40); ctx.lineTo(-56, -32); ctx.stroke();
    [-62, 62].forEach(x => {
      ctx.fillStyle = '#25332f'; ctx.strokeStyle = '#5d6b66'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, -16, 16, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7e8b86'; ctx.beginPath(); ctx.arc(x, -16, 6, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function drawGround(ctx) {
    ctx.save();
    ctx.fillStyle = '#152c24'; ctx.fillRect(0, GY, W, H - GY);
    ctx.strokeStyle = '#33594a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.fillStyle = 'rgba(160,180,170,0.18)';
    for (let i = 0; i < 46; i++) { const x = (i * 97.3) % W, y = GY + 8 + (i * 37) % 40; ctx.fillRect(x, y, 4, 2); }
    ctx.restore();
  }
  function drawBinBack(ctx) {
    ctx.save();
    ctx.fillStyle = '#1b3434'; ctx.fillRect(BIN.x0 + 6, BIN.top - 14, BIN.x1 - BIN.x0 - 12, GY - BIN.top + 14);
    // 回收區裡的廢鐵堆
    ctx.fillStyle = '#4c4a42'; ctx.strokeStyle = '#2a2a24'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(BIN.x0 + 10, GY);
    [[700, 448], [730, 432], [760, 440], [790, 426], [826, 436], [860, 428], [892, 444], [912, 452]].forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(BIN.x1 - 10, GY); ctx.closePath(); ctx.fill(); ctx.stroke();
    [[722, 440, 0.4, 0], [770, 434, -0.7, 1], [842, 432, 1.0, 2], [884, 442, -0.2, 0]].forEach(([x, y, a, k]) => scrap(ctx, x, y, a, k));
    ctx.restore();
  }
  function drawBinFront(ctx) {
    ctx.save();
    const g = ctx.createLinearGradient(0, BIN.top, 0, GY);
    g.addColorStop(0, '#4d7d8a'); g.addColorStop(1, '#2c5260');
    ctx.fillStyle = g; ctx.strokeStyle = '#1b3640'; ctx.lineWidth = 3;
    ctx.fillRect(BIN.x0, BIN.top, BIN.x1 - BIN.x0, GY - BIN.top); ctx.strokeRect(BIN.x0, BIN.top, BIN.x1 - BIN.x0, GY - BIN.top);
    ctx.strokeStyle = 'rgba(12,30,25,0.45)'; ctx.lineWidth = 2;
    for (let x = BIN.x0 + 30; x < BIN.x1; x += 30) { ctx.beginPath(); ctx.moveTo(x, BIN.top + 4); ctx.lineTo(x, GY - 4); ctx.stroke(); }
    ctx.fillStyle = '#7fb0bd'; ctx.fillRect(BIN.x0 - 4, BIN.top - 4, BIN.x1 - BIN.x0 + 8, 6);
    ctx.restore();
  }
  function drawCrane(ctx, TX) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 平衡重
    ctx.fillStyle = '#56615d'; ctx.strokeStyle = '#2c3532'; ctx.lineWidth = 2;
    rrect(ctx, 34, 104, 56, 30, 4); ctx.fill(); ctx.stroke();
    const lattice = (pts, w) => { ctx.strokeStyle = CRANE_D; ctx.lineWidth = w + 3; polyline(ctx, pts); ctx.stroke(); ctx.strokeStyle = CRANE; ctx.lineWidth = w; polyline(ctx, pts); ctx.stroke(); };
    // 塔身
    lattice([{ x: 100, y: 86 }, { x: 100, y: GY }], 5); lattice([{ x: 140, y: 86 }, { x: 140, y: GY }], 5);
    const zz = []; for (let y = 104, k = 0; y <= GY; y += 36, k++) zz.push({ x: k % 2 ? 140 : 100, y });
    lattice(zz, 2.5);
    // 吊臂
    lattice([{ x: 40, y: 86 }, { x: 940, y: 86 }], 4); lattice([{ x: 40, y: 104 }, { x: 940, y: 104 }], 4);
    const zb = []; for (let x = 40, k = 0; x <= 940; x += 30, k++) zb.push({ x, y: k % 2 ? 86 : 104 });
    lattice(zb, 2);
    // 塔頂與拉索
    lattice([{ x: 100, y: 86 }, { x: 120, y: 66 }, { x: 140, y: 86 }], 3);
    ctx.strokeStyle = 'rgba(200,210,205,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(120, 66); ctx.lineTo(930, 86); ctx.moveTo(120, 66); ctx.lineTo(44, 86); ctx.stroke();
    // 台車
    ctx.fillStyle = '#56615d'; ctx.strokeStyle = '#2c3532'; ctx.lineWidth = 2;
    rrect(ctx, TX - 22, 104, 44, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa6a1'; [-12, 12].forEach(d => { ctx.beginPath(); ctx.arc(TX + d, 104, 4, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  // 控制室：電池＋開關（導線經塔身、吊臂、吊索通到電磁鐵）
  function drawBox(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = '#173a31'; ctx.strokeStyle = 'rgba(85,233,255,0.35)'; ctx.lineWidth = 2;
    rrect(ctx, 132, 360, 190, 132, 10); ctx.fill(); ctx.stroke();
    ctx.restore();
    const flow = { w: 4, amp: s.amp, t, speed: 70 };
    drawPath(ctx, [{ x: 288, y: 450 }, { x: 302, y: 450 }, { x: 302, y: 400 }, { x: 284, y: 400 }], flow);
    cell(ctx, 186, 436, 96, 28, false);
    knifeSwitch(ctx, 220, 400, 280, s.sw);
  }
  // 磁力線：由上端 N 往外繞到下端 S（外部箭頭向下）
  function magField(ctx, TX, yM, a) {
    if (a <= 0.01) return;
    const yT = yM + 16, yB = yM + MAGH - 2;
    ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = C.purple; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) for (const k of [0, 1]) {
      const r = 100 + 36 * k, p0 = { x: TX + sd * 20, y: yT }, c1 = { x: TX + sd * r, y: yT - 26 - 14 * k }, c2 = { x: TX + sd * r, y: yB + 4 }, p1 = { x: TX + sd * 22, y: yB };
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p1.x, p1.y); ctx.stroke();
      const bz = (q, a0, a1, a2, a3) => (1 - q) ** 3 * a0 + 3 * (1 - q) ** 2 * q * a1 + 3 * (1 - q) * q * q * a2 + q ** 3 * a3;
      const mx = bz(0.5, p0.x, c1.x, c2.x, p1.x), my = bz(0.5, p0.y, c1.y, c2.y, p1.y), nx = bz(0.53, p0.x, c1.x, c2.x, p1.x), ny = bz(0.53, p0.y, c1.y, c2.y, p1.y);
      arrowHead(ctx, mx, my, Math.atan2(ny - my, nx - mx), GREEN, 11);
    }
    ctx.restore();
  }
  function drawMagnet(ctx, TX, yM, s, t, part) {
    const y0 = yM + 32, y1 = yM + 118;
    const pts = [{ x: TX - 6, y: 132 }, { x: TX - 6, y: yM - 16 }, { x: TX - CRX - 4, y: y0 - 8 }].concat(helix(TX, y0, y1, CTURN, CRX, CRY))
      .concat([{ x: TX + CRX + 10, y: y1 - 2 }, { x: TX + CRX + 10, y: y0 - 8 }, { x: TX + 6, y: yM - 16 }, { x: TX + 6, y: 124 }]);
    const flow = { w: 5, amp: s.amp, t, speed: 70 };
    if (part === 'back') {
      // 吊索
      ctx.save(); ctx.strokeStyle = '#9aa6a1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(TX, 118); ctx.lineTo(TX, yM); ctx.stroke(); ctx.restore();
      drawPath(ctx, pts, Object.assign({ part: 'back' }, flow));
      // 鐵芯（軟鐵）：通電時上端偏紅（N）、下端偏藍（S）並發光
      ctx.save();
      ctx.strokeStyle = '#8b9692'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(TX, yM); ctx.lineTo(TX - 22, yM + 14); ctx.moveTo(TX, yM); ctx.lineTo(TX + 22, yM + 14); ctx.stroke();
      ctx.fillStyle = '#c9d3d6'; ctx.beginPath(); ctx.arc(TX, yM, 5, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(TX - 26, 0, TX + 26, 0);
      g.addColorStop(0, '#68747a'); g.addColorStop(0.45, '#c3ccd0'); g.addColorStop(1, '#5f6a70');
      if (s.mag > 0.01) { ctx.shadowColor = C.purple; ctx.shadowBlur = 22 * s.mag; }
      ctx.fillStyle = g; ctx.strokeStyle = '#38423f'; ctx.lineWidth = 2;
      rrect(ctx, TX - 26, yM + 14, 52, MAGH - 14, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      if (s.mag > 0.01) {
        const tg = ctx.createLinearGradient(0, yM + 14, 0, yM + MAGH);
        tg.addColorStop(0, `rgba(255,111,118,${0.5 * s.mag})`); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, `rgba(114,185,255,${0.55 * s.mag})`);
        ctx.fillStyle = tg; rrect(ctx, TX - 26, yM + 14, 52, MAGH - 14, 4); ctx.fill();
      }
      ctx.restore();
    } else {
      drawPath(ctx, pts, Object.assign({ part: 'front' }, flow));
      coilArrows(ctx, TX, y0, y1, CTURN, CRY, s.amp, 2);
    }
  }
  function prinState(step, t) {
    const s = { TX: X0, yM: YUP, sw: 0, amp: 0, mag: 0, swing: 0, car: 'ground', fall: -1, scrP: 0, scrFly: null, tags: {}, status: 1, fail: 0, magTag: 0, lifted: 0, cardA: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.status = 0; s.swing = 0.012 * Math.sin(t * 2.3);
      const ap = (a, b) => easeIO(seg(t, a, b));
      s.tags = { em: ap(0.4, 1.0), core: ap(1.4, 2.0), coil: ap(2.4, 3.0), batt: ap(3.4, 4.0), sw: ap(4.2, 4.8), scr: ap(5.0, 5.6) };
      if (t < 3.4) { s.msg = tr('資源回收場的起重機，下面掛著一個電磁鐵', 'A scrapyard crane with an electromagnet hanging from it'); s.mc = CYAN; }
      else { s.msg = tr('電磁鐵：軟鐵芯外面纏著線圈，接上電池和開關', 'Electromagnet: a coil around a soft iron core, with a battery and switch'); s.mc = ORANGE; }
    } else if (step === 1) {
      s.yM = lerp(YUP, YDN, easeIO(seg(t, 0.4, 2.2))) - (YDN - YUP) * easeIO(seg(t, 3.4, 5.4));
      s.fail = easeIO(seg(t, 4.6, 5.1));
      if (t < 2.2) { s.msg = tr('開關斷開：先把電磁鐵放到廢車上', 'Switch open: lower the electromagnet onto the car'); s.mc = PINK; }
      else if (t < 4.0) { s.msg = tr('碰到廢車了……把它吊起來試試', 'It touches the car... now try to lift'); s.mc = CHALK; }
      else { s.msg = tr('沒有電流 → 鐵芯沒有磁性 → 吸不起來', 'No current → no magnetism in the core → nothing is lifted'); s.mc = PINK; }
    } else if (step === 2) {
      s.yM = lerp(YUP, YDN, easeIO(seg(t, 0.2, 1.8)));
      s.sw = easeIO(seg(t, 2.0, 2.4)); s.amp = seg(t, 2.4, 2.7); s.mag = easeIO(seg(t, 2.6, 3.2));
      s.scrFly = SCR.map((_, i) => easeIO(seg(t, 3.2 + i * 0.15, 3.7 + i * 0.15)));
      const lift = easeIO(seg(t, 5.0, 7.2));
      if (t >= 5.0) { s.car = 'attached'; s.yM = YDN - (YDN - YUP) * lift; }
      s.magTag = easeIO(seg(t, 3.0, 3.6)); s.lifted = easeIO(seg(t, 7.0, 7.6));
      if (t < 2.0) { s.msg = tr('再放下一次……', 'Lower it once more...'); s.mc = CHALK; }
      else if (t < 4.8) { s.msg = tr('接通開關：電流流過線圈，軟鐵芯被磁化', 'Close the switch: current flows in the coil and the soft iron core is magnetized'); s.mc = GREEN; }
      else { s.msg = tr('磁力很強：整輛廢車連同鐵屑一起被吸起來！', 'A huge force: the whole car and the scraps are lifted!'); s.mc = YELLOW; }
    } else if (step === 3) {
      s.sw = 1; s.amp = 1; s.mag = 1; s.car = 'attached'; s.scrFly = SCR.map(() => 1);
      const k = seg(t, 0.6, 5.4);
      s.TX = lerp(X0, X1, easeIO(k));
      s.swing = t < 5.4 ? 0.035 * Math.sin(TAU * k) : -0.02 * Math.exp(-1.6 * (t - 5.4)) * Math.sin(3.4 * (t - 5.4));
      s.msg = tr('保持通電，電磁鐵一直有磁性：把廢車搬到回收區', 'Keep the current on and it stays magnetic: carry the car to the bin'); s.mc = GREEN;
    } else {
      s.TX = X1; s.sw = 1 - easeIO(seg(t, 0.8, 1.1)); s.amp = 1 - seg(t, 1.0, 1.15); s.mag = 1 - seg(t, 1.1, 1.3);
      s.scrFly = SCR.map(() => 1);
      if (t < 1.25) s.car = 'attached';
      else { s.car = 'fall'; s.fall = t - 1.25; }
      s.cardA = easeIO(seg(t, 3.4, 4.2));
      if (t < 1.25) { s.msg = tr('到了！現在切斷電源……', 'Here we are! Now cut the power...'); s.mc = CHALK; }
      else if (t < 3.4) { s.msg = tr('斷電：軟鐵芯的磁性立刻消失，廢車落下', 'Power off: the soft iron loses its magnetism at once, and the car drops'); s.mc = PINK; }
      else { s.msg = tr('所以鐵芯要用軟鐵：通電才有磁性，斷電就消失', 'So the core must be soft iron: magnetic only while the current flows'); s.mc = ORANGE; }
    }
    return s;
  }
  function fallY(y0, y1, tau) {
    const g = 1400, tl = Math.sqrt(2 * (y1 - y0) / g);
    if (tau < tl) return y0 + 0.5 * g * tau * tau;
    const u = tau - tl; return y1 - 9 * Math.exp(-6 * u) * Math.abs(Math.sin(9 * u));
  }
  function drawPrinciple(ctx, step, t) {
    const s = prinState(step, t), TX = s.TX, yM = s.yM, yB = yM + MAGH;
    drawGround(ctx); drawBinBack(ctx); drawCrane(ctx, TX);
    // 塔身、吊臂上的兩條導線（A：電池＋ → 開關 → 電磁鐵；B：電磁鐵 → 電池－）
    const flow = { w: 3.5, amp: s.amp, t, speed: 70 };
    drawPath(ctx, [{ x: 220, y: 400 }, { x: 154, y: 400 }, { x: 154, y: 132 }, { x: TX - 6, y: 132 }], flow);
    drawPath(ctx, [{ x: TX + 6, y: 124 }, { x: 146, y: 124 }, { x: 146, y: 450 }, { x: 186, y: 450 }], flow);
    drawBox(ctx, s, t);
    // 地上的廢車與鐵屑
    if (s.car === 'ground') drawCar(ctx, X0, GY);
    SCR.forEach((q, i) => { if (!s.scrFly || s.scrFly[i] <= 0) scrap(ctx, X0 + q.gx, GY - 5, q.ga, q.k); });
    // 吊掛的部分（台車下的吊索、電磁鐵、吸住的廢車與鐵屑）一起擺動
    ctx.save(); ctx.translate(TX, PIV); ctx.rotate(s.swing); ctx.translate(-TX, -PIV);
    magField(ctx, TX, yM, s.mag);
    if (s.car === 'attached') drawCar(ctx, TX, yB + ROOF);
    drawMagnet(ctx, TX, yM, s, t, 'back');
    drawMagnet(ctx, TX, yM, s, t, 'front');
    if (s.scrFly && s.car !== 'fall') SCR.forEach((q, i) => {
      const p = s.scrFly[i]; if (p <= 0) return;
      const x = lerp(X0 + q.gx, TX + q.sx, p), y = lerp(GY - 5, yB + q.sy, p) - 34 * Math.sin(Math.PI * p);
      scrap(ctx, x, y, lerp(q.ga, q.sa, p), q.k);
    });
    if (s.mag > 0.01) { poleBadge(ctx, TX + 92, yM + 24, true, s.mag); poleBadge(ctx, TX + 92, yB - 12, false, s.mag); }
    ctx.restore();
    // 斷電後落下
    if (s.car === 'fall') {
      const by = fallY(YUP + MAGH + ROOF, GY, s.fall);
      drawCar(ctx, X1, by);
      SCR.forEach(q => { const y = fallY(YUP + MAGH + q.sy, 486, s.fall * 0.96); scrap(ctx, lerp(X1 + q.sx, X1 + q.bx, seg(s.fall, 0, 0.5)), y, q.sa + s.fall * 2, q.k); });
    }
    drawBinFront(ctx);
    tag(ctx, tr('回收區', 'Scrap bin'), (BIN.x0 + BIN.x1) / 2, 478, MUTED, 1, 22);

    // ── 標籤 ──
    const T = s.tags;
    if (T.em) { leader(ctx, TX + 150, yM + 54, TX + 30, yM + 40, CYAN, T.em); tag(ctx, tr('電磁鐵', 'Electromagnet'), TX + 170, yM + 36, CYAN, T.em); }
    if (T.coil) { leader(ctx, TX + 150, yM + 112, TX + 30, yM + 100, ORANGE, T.coil); tag(ctx, tr('線圈', 'Coil'), TX + 170, yM + 112, ORANGE, T.coil); }
    if (T.core) { leader(ctx, TX - 120, yM + 132, TX - 18, yM + 132, MUTED, T.core); tag(ctx, tr('軟鐵芯', 'Soft iron core'), TX - 190, yM + 132, CHALK, T.core); }
    if (T.sw) { leader(ctx, 250, 340, 248, 386, PINK, T.sw); tag(ctx, tr('開關（斷開）', 'Switch (open)'), 250, 322, PINK, T.sw); }
    if (T.batt) { leader(ctx, 234, 514, 234, 466, ORANGE, T.batt); tag(ctx, tr('電池', 'Battery'), 234, 530, ORANGE, T.batt); }
    if (T.scr) { leader(ctx, 404, 514, X0 - 128, GY - 8, MUTED, T.scr); tag(ctx, tr('鐵屑', 'Iron scraps'), 404, 530, CHALK, T.scr); }
    if (s.status) {
      const on = s.sw > 0.5;
      tag(ctx, on ? tr('開關：接通', 'Switch: closed') : tr('開關：斷開', 'Switch: open'), 234, 530, on ? GREEN : PINK, s.status);
    }
    if (s.fail > 0.01) tag(ctx, tr('沒有磁性，吸不起來', 'No magnetism: it won\'t lift'), X0 + 40, 372, PINK, s.fail);
    if (s.magTag > 0.01) tag(ctx, tr('鐵芯被磁化', 'Magnetized!'), TX - 215, yM + 70, C.purple, s.magTag);
    if (s.lifted > 0.01) tag(ctx, tr('吸起整輛廢車！', 'It lifts the whole car!'), X0 + 20, 530, YELLOW, s.lifted);
    if (s.cardA > 0.01) {
      const a = s.cardA, X = 180, Wc = 480, Y = 138, Hc = 178, cw = Wc / 2;
      card(ctx, X, Y, Wc, Hc, a);
      ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X + cw, Y + 16); ctx.lineTo(X + cw, Y + Hc - 16); ctx.stroke(); ctx.restore();
      const col = (cx, lines, c0) => lines.forEach((ln, k) => { const sz = fitSize(ctx, ln, cw - 24, k ? 22 : 26, 22); txt(ctx, ln, cx, Y + 32 + k * 40, k === 0 ? c0 : (k === 3 ? c0 : CHALK), a, sz); });
      col(X + cw / 2, [tr('軟鐵', 'Soft iron'), tr('通電才有磁性', 'Magnetic only'), tr('斷電就消失', 'while it is on'), tr('適合當鐵芯', 'Good for a core')], GREEN);
      col(X + cw * 1.5, [tr('鋼', 'Steel'), tr('斷電後', 'Stays magnetic'), tr('仍殘留磁性', 'after power off'), tr('不能當鐵芯', 'Not for a core')], PINK);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [['I', tr('電流 I', 'Current I'), 1], ['B', tr('磁力線（箭頭＝B）', 'Field lines (arrow = B)'), s.mag]]);
  }

  // ═════════ 場景 2：三大要素（左右對照） ═════════
  const FX = [255, 745], TABLE = 490, CY0 = 185, CY1 = 305, ROD0 = 160, ROD1 = 330;
  const TRAY = [[-6, 480, 1.4], [16, 476, 1.7], [-28, 482, 1.2], [36, 477, 1.5], [-48, 480, 1.8], [56, 478, 1.3], [6, 474, 1.25], [-18, 483, 1.6], [26, 481, 1.9], [-60, 478, 1.45], [64, 481, 1.35], [-38, 476, 1.75]];
  const SLOT = k => { const r = Math.floor(k / 3), c = [0, -1, 1][k % 3]; return [c * 21, 346 + r * 26, c * 0.22]; };
  const FCFG = [
    { col: YELLOW, hl: 'batt', cst: ['匝數 10・有鐵芯', '10 turns · iron core'],
      P: [{ n: 1, turns: 10, core: true, clips: 2, h: ['1 顆電池', '1 battery'] }, { n: 3, turns: 10, core: true, clips: 7, h: ['3 顆電池（串聯）', '3 batteries in series'] }],
      m0: ['只改「電池數」：1 顆 vs 3 顆（匝數、鐵芯都一樣）', 'Change only the batteries: 1 vs 3 (same turns, same core)'],
      m2: ['電池越多 → 電流越大 → 吸起越多迴紋針', 'More batteries → more current → more clips picked up'] },
    { col: CYAN, hl: 'coil', cst: ['2 顆電池・有鐵芯', '2 batteries · iron core'],
      P: [{ n: 2, turns: 6, core: true, clips: 3, h: ['匝數 6', '6 turns'] }, { n: 2, turns: 14, core: true, clips: 7, h: ['匝數 14', '14 turns'] }],
      m0: ['只改「匝數」：6 圈 vs 14 圈，線圈長度相同', 'Change only the turns: 6 vs 14, same coil length'],
      m2: ['長度不變，匝數越多（越密）→ 磁力越強', 'Same length, more turns (denser) → a stronger force'] },
    { col: ORANGE, hl: 'core', cst: ['3 顆電池・匝數 10', '3 batteries · 10 turns'],
      P: [{ n: 3, turns: 10, core: false, clips: 1, h: ['沒有鐵芯（空心）', 'No core (hollow)'] }, { n: 3, turns: 10, core: true, clips: 7, h: ['插入軟鐵芯', 'Soft iron core'] }],
      m0: ['只改「鐵芯」：空心線圈 vs 插入軟鐵芯', 'Change only the core: hollow coil vs soft iron core'],
      m2: ['插入軟鐵芯 → 鐵芯被磁化，磁力大增', 'Add a soft iron core → it is magnetized and the force jumps'] }
  ];
  function paperclip(ctx, x, y, ang, a = 1) {
    if (a <= 0.01) return;
    const path = () => {
      ctx.beginPath(); rrectPath(ctx, -6, -13, 12, 26, 6);
      ctx.moveTo(-3, 9); ctx.lineTo(-3, -7); ctx.arc(0, -7, 3, Math.PI, 0); ctx.lineTo(3, 5);
    };
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(10,26,22,0.9)'; ctx.lineWidth = 4.4; path(); ctx.stroke();
    ctx.strokeStyle = '#d3dcde'; ctx.lineWidth = 2.2; path(); ctx.stroke();
    ctx.restore();
  }
  function rrectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function dashBox(ctx, x, y, w, h, color, a, t = 0) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 24;
    rrect(ctx, x, y, w, h, 8); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  function drawPanel(ctx, cx, P, cfg, st, t) {
    const n = P.n, xL = cx - 205, xR = xL + n * 36 - 2;
    // 鐵架
    ctx.save(); ctx.fillStyle = '#4f625b'; ctx.strokeStyle = '#26352f'; ctx.lineWidth = 2;
    ctx.fillRect(cx + 214, 150, 10, TABLE - 150); ctx.strokeRect(cx + 214, 150, 10, TABLE - 150);
    ctx.fillRect(cx - 6, 146, 230, 9); ctx.strokeRect(cx - 6, 146, 230, 9);
    rrect(ctx, cx + 199, TABLE - 10, 40, 10, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 盤子裡的迴紋針（盤子在後、迴紋針在上）
    ctx.save(); ctx.fillStyle = 'rgba(160,205,220,0.16)'; ctx.strokeStyle = 'rgba(190,225,235,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 80, 470); ctx.lineTo(cx + 80, 470); ctx.lineTo(cx + 72, TABLE); ctx.lineTo(cx - 72, TABLE); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    // 電路：A（電池＋ → 開關 → 線圈上端），線圈，B（線圈下端 → 電池－）
    const speed = 30 + 28 * n, amp = st.amp, glow = 4 + 4 * n;
    const coil = helix(cx, CY0, CY1, P.turns, 30, 7);
    drawPath(ctx, [{ x: xL - 5, y: 474 }, { x: cx - 222, y: 474 }, { x: cx - 222, y: CY0 }, { x: cx - 180, y: CY0 }], { w: 4, amp, t, speed, glow });
    const pts = [{ x: cx - 130, y: CY0 }].concat(coil).concat([{ x: cx - 90, y: CY1 }, { x: cx - 90, y: 474 }, { x: xR + 5, y: 474 }]);
    drawPath(ctx, pts, { part: 'back', w: 4, amp, t, speed, glow });
    // 鐵芯或空心管
    ctx.save();
    if (P.core) {
      const g = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
      g.addColorStop(0, '#68747a'); g.addColorStop(0.45, '#c3ccd0'); g.addColorStop(1, '#5f6a70');
      const glowK = amp * P.clips / 7;
      if (glowK > 0.01) { ctx.shadowColor = C.purple; ctx.shadowBlur = 20 * glowK; }
      ctx.fillStyle = g; ctx.strokeStyle = '#38423f'; ctx.lineWidth = 2;
      rrect(ctx, cx - 14, ROD0, 28, ROD1 - ROD0, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(242,236,217,0.08)'; ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      rrect(ctx, cx - 16, ROD0, 32, ROD1 - ROD0, 4); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#6d7f78'; ctx.strokeStyle = '#26352f'; ctx.lineWidth = 2;
    rrect(ctx, cx - 22, 146, 44, 22, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawPath(ctx, pts, { part: 'front', w: 4, amp, t, speed, glow });
    coilArrows(ctx, cx, CY0, CY1, P.turns, 7, amp, P.turns > 10 ? 3 : 2);
    knifeSwitch(ctx, cx - 180, CY0, cx - 130, st.sw);
    for (let k = 0; k < n; k++) cell(ctx, xL + k * 36, 461, 34, 26, true);
    // 迴紋針
    TRAY.forEach(([dx, y, a], k) => {
      const p = k < P.clips ? st.fly[k] : 0;
      if (p <= 0) { paperclip(ctx, cx + dx, y, a); return; }
      const [sx, sy, sa] = SLOT(k);
      paperclip(ctx, lerp(cx + dx, cx + sx, p), lerp(y, sy, p) - 26 * Math.sin(Math.PI * p), lerp(a, sa, p));
    });
    // 變因的提示框
    const hk = st.hl;
    if (cfg.hl === 'batt') dashBox(ctx, xL - 14, 452, xR - xL + 30, 44, cfg.col, hk, t);
    if (cfg.hl === 'coil') {
      dashBox(ctx, cx - 42, CY0 - 14, 84, CY1 - CY0 + 28, cfg.col, hk, t);
      ctx.save(); ctx.globalAlpha = st.lenA; ctx.strokeStyle = CYAN; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx + 50, CY0); ctx.lineTo(cx + 50, CY1); ctx.moveTo(cx + 44, CY0); ctx.lineTo(cx + 56, CY0); ctx.moveTo(cx + 44, CY1); ctx.lineTo(cx + 56, CY1); ctx.stroke(); ctx.restore();
      tag(ctx, tr('長度相同', 'Same length'), cx + 124, (CY0 + CY1) / 2, CYAN, st.lenA, 22);
    }
    if (cfg.hl === 'core') dashBox(ctx, cx - 24, ROD0 - 4, 48, ROD1 - ROD0 + 10, cfg.col, hk, t);
    // 標題與控制變因
    tag(ctx, tr(P.h[0], P.h[1]), cx, 88, cfg.col, 1, 24, 440);
    const cs = tr(cfg.cst[0], cfg.cst[1]);
    txt(ctx, cs, cx, 122, MUTED, 1, fitSize(ctx, cs, 440, 22, 22));
    // 吸起的數量
    if (st.countA > 0.01) tag(ctx, tr(`吸起 ${P.clips} 個`, `Picks up ${P.clips}`), cx, 540, YELLOW, st.countA, 26, 300);
  }
  function drawFactors(ctx, step, t) {
    if (step === 3) { drawSummary(ctx, t); return; }
    const cfg = FCFG[step];
    ctx.save(); ctx.fillStyle = '#5b4330'; ctx.fillRect(15, TABLE, W - 30, 20); ctx.fillStyle = '#8a6a4c'; ctx.fillRect(15, TABLE, W - 30, 3); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(500, 70); ctx.lineTo(500, TABLE - 6); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    const sw = easeIO(seg(t, 2.4, 2.8)), amp = seg(t, 2.8, 3.0), countA = easeIO(seg(t, 5.6, 6.1));
    const pulse = t < 2.4 ? 0.55 + 0.45 * Math.sin(t * 6) : 0.55;
    cfg.P.forEach((P, side) => {
      const fly = []; for (let k = 0; k < 12; k++) fly.push(easeIO(seg(t, 3.0 + k * 0.22, 3.5 + k * 0.22)));
      drawPanel(ctx, FX[side], P, cfg, { sw, amp, fly, countA, hl: easeIO(seg(t, 0.5, 1.0)) * pulse, lenA: easeIO(seg(t, 1.0, 1.5)) }, t);
    });
    if (countA > 0.01) txt(ctx, '<', 500, 540, YELLOW, countA, 44);
    const fade = 1 - easeIO(seg(t, 0, 0.5));
    if (fade > 0.01) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = C.canvas; ctx.fillRect(0, 58, W, H - 58); ctx.restore(); }
    let msg, mc;
    if (t < 2.4) { msg = tr(cfg.m0[0], cfg.m0[1]); mc = cfg.col; }
    else if (t < 5.8) { msg = tr('兩邊同時接通開關……看誰吸起比較多迴紋針？', 'Close both switches... which side picks up more paper clips?'); mc = CHALK; }
    else { msg = tr(cfg.m2[0], cfg.m2[1]); mc = GREEN; }
    topMsg(ctx, msg, mc);
  }
  function drawSummary(ctx, t) {
    const X = 50, Y = 74, Wc = 900, Hc = 470;
    card(ctx, X, Y, Wc, Hc, 1);
    const ttl = tr('三個變因：每次只改一個，其他都相同', 'Three variables: change one at a time, keep the rest the same');
    txt(ctx, ttl, W / 2, 112, CHALK, 1, fitSize(ctx, ttl, Wc - 40, 28, 22));
    const rows = [
      { c: YELLOW, a: ['電池越多（電流越大）', 'More batteries (more current)'], b: ['串聯 1 顆 → 3 顆', '1 → 3 in series'], r: [2, 7] },
      { c: CYAN, a: ['匝數越多（長度不變）', 'More turns (same length)'], b: ['6 圈 → 14 圈，繞得越密', '6 → 14 turns, wound denser'], r: [3, 7] },
      { c: ORANGE, a: ['插入軟鐵芯', 'Insert a soft iron core'], b: ['要用軟鐵，不能用鋼', 'Soft iron, never steel'], r: [1, 7] }
    ];
    rows.forEach((R, k) => {
      const a = easeIO(seg(t, 0.4 + k * 1.6, 1.0 + k * 1.6)), y = 178 + k * 100, dx = (1 - a) * 30;
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = R.c; ctx.beginPath(); ctx.arc(104 + dx, y + 14, 22, 0, TAU); ctx.fill(); ctx.restore();
      txt(ctx, String(k + 1), 104 + dx, y + 15, '#0c1e19', a, 26);
      const s1 = tr(R.a[0], R.a[1]), s2 = tr(R.b[0], R.b[1]);
      txt(ctx, s1, 142 + dx, y, R.c, a, fitSize(ctx, s1, 520, 28, 22), 'left');
      txt(ctx, s2, 142 + dx, y + 36, MUTED, a, fitSize(ctx, s2, 520, 22, 22), 'left');
      // 吸起數量的對照長條
      const bx = 690, bw = 26;
      ctx.save(); ctx.globalAlpha = a;
      R.r.forEach((v, j) => {
        const by = y - 6 + j * 30, len = v * bw * easeIO(seg(t, 0.8 + k * 1.6, 1.6 + k * 1.6));
        ctx.fillStyle = j ? R.c : 'rgba(242,236,217,0.35)'; rrect(ctx, bx, by - 9, Math.max(4, len), 18, 5); ctx.fill();
      });
      ctx.restore();
      txt(ctx, String(R.r[0]), 676, y - 6, MUTED, a, 22, 'right');
      txt(ctx, String(R.r[1]), 676, y + 24, R.c, a, 22, 'right');
    });
    const cap = tr('長條＝吸起的迴紋針數', 'Bars = paper clips picked up');
    txt(ctx, cap, 780, 148, MUTED, easeIO(seg(t, 0.8, 1.4)), fitSize(ctx, cap, 300, 22, 22));
    const fa = easeIO(seg(t, 5.6, 6.2));
    if (fa > 0.01) {
      const fin = tr('電流越大、匝數越多、插入軟鐵芯 → 磁力越強', 'More current, more turns, an iron core → a stronger magnet');
      const sz = fitSize(ctx, fin, Wc - 60, 28, 22), glow = t > 6.2 ? 0.5 + 0.5 * Math.sin((t - 6.2) * 3) : 0;
      ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = YELLOW; ctx.lineWidth = 2.5; ctx.shadowColor = YELLOW; ctx.shadowBlur = 6 + 14 * glow;
      rrect(ctx, X + 24, 470, Wc - 48, 54, 12); ctx.stroke(); ctx.restore();
      txt(ctx, fin, W / 2, 497, YELLOW, fa, sz);
    }
    topMsg(ctx, tr('整理：三個讓電磁鐵磁力更強的辦法', 'Summary: three ways to make an electromagnet stronger'), YELLOW);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'crane-principle': {
      draw: drawPrinciple,
      steps: [
        { d: 7.0, b: ['起重機', 'Crane'],
          cap: ['回收場起重機下面掛的是<strong class="accent-cyan">電磁鐵</strong>：在<strong class="accent-orange">軟鐵芯</strong>外面纏上線圈，再接上電池與開關。',
                'The scrapyard crane carries an <strong class="accent-cyan">electromagnet</strong>: a coil wound around a <strong class="accent-orange">soft iron core</strong>, connected to a battery and a switch.'] },
        { d: 7.0, b: ['斷開', 'Switch off'],
          cap: ['<strong class="accent-pink">開關斷開</strong>：線圈沒有電流，軟鐵芯沒有磁性，碰到廢車也吸不起來。',
                '<strong class="accent-pink">Switch open</strong>: no current in the coil, so the soft iron core has no magnetism and cannot lift the car.'] },
        { d: 9.0, b: ['通電', 'Power on'],
          cap: ['<strong class="accent-green">通電時：</strong>軟鐵芯瞬間被強烈「磁化」，與線圈磁場疊加，產生極大磁力，連整輛廢車和鐵屑都吸得起來。',
                '<strong class="accent-green">Power on:</strong> the soft iron core is instantly strongly "magnetized", adding to the coil\'s field for a huge force that lifts the whole car and the scraps.'] },
        { d: 7.0, b: ['搬運', 'Carry'],
          cap: ['只要保持通電，電磁鐵就一直有磁性，起重機可以把廢車<strong class="accent-yellow">搬到另一處</strong>。',
                'As long as the current stays on, it stays magnetic, so the crane can <strong class="accent-yellow">carry the car somewhere else</strong>.'] },
        { d: 10.0, b: ['斷電', 'Power off'],
          cap: ['<strong class="accent-pink">斷電時：</strong>軟鐵不保留磁性，磁力瞬間消失，廢車立刻落下。所以鐵芯要用<strong class="accent-orange">軟鐵</strong>；鋼斷電後仍會殘留磁性，不能當電磁鐵的鐵芯。',
                '<strong class="accent-pink">Power off:</strong> soft iron keeps no magnetism, so the force vanishes and the car drops at once. That is why the core is <strong class="accent-orange">soft iron</strong>; steel stays magnetized and cannot be used.'] }
      ]
    },
    'crane-factors': {
      draw: drawFactors,
      steps: [
        { d: 10.0, b: ['電池數', 'Batteries'],
          cap: ['<strong class="accent-yellow">電池數量：</strong>只改電池數（匝數、鐵芯都相同）。串聯 3 顆電池，電流較大，吸起的迴紋針比 1 顆多。',
                '<strong class="accent-yellow">Number of batteries:</strong> only the batteries change (same turns, same core). With 3 in series the current is larger and more clips are picked up.'] },
        { d: 10.0, b: ['匝數', 'Turns'],
          cap: ['<strong class="accent-cyan">纏繞匝數：</strong>線圈長度不變、電池相同，只改圈數。圈數越多（繞得越密），磁力越強。',
                '<strong class="accent-cyan">Number of turns:</strong> same coil length, same batteries, only the turns change. More turns (denser winding) give a stronger force.'] },
        { d: 10.0, b: ['鐵芯', 'Core'],
          cap: ['<strong class="accent-orange">插入鐵芯：</strong>電池、匝數相同。空心線圈只吸起很少；插入軟鐵芯後被磁化，磁力大增。',
                '<strong class="accent-orange">Insert an iron core:</strong> same batteries, same turns. The hollow coil picks up very little; with a soft iron core, magnetized by the coil, the force jumps.'] },
        { d: 10.0, b: ['整理', 'Summary'],
          cap: ['整理：<strong class="accent-yellow">電池越多</strong>（電流越大）、<strong class="accent-cyan">匝數越多</strong>、<strong class="accent-orange">插入軟鐵芯</strong>，電磁鐵的磁力就越強。',
                'Summary: <strong class="accent-yellow">more batteries</strong> (more current), <strong class="accent-cyan">more turns</strong> and <strong class="accent-orange">a soft iron core</strong> all make an electromagnet stronger.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  // 老師講解模式（AGENTS 10.7）的播放設定：模組層級，activate() 換場景時不重設
  const CTL = { paused: false, loop: true, endFn: null, ended: false };

  function canvasCtx() { const c = document.getElementById('craneCanvas'); return c ? c.getContext('2d') : null; }
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
    sc.draw(ctx, i, Math.min(S.t, sc.total - 1e-3) - sc.starts[i]);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('craneResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-crane');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-crane'); if (!row) return;
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

  function visible() { const c = document.getElementById('craneCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  EmAnim.crane = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'crane-principle';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; CTL.ended = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-crane'); if (row) row.innerHTML = '';
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
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
