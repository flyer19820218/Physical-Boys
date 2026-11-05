/* electromagnetism_2_lab_crane_1105_v1.js — 「動手做：自己調出最強的電磁鐵」實驗台（#craneLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.crane = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、clear、label（直接呼叫，不複製、不修改）。
 * 控制鈕由本檔建立在 #craneLabControls，說明字寫進 #craneLabResult。
 *
 * 畫面（平面卡通視角，可切「斜視／側視」改變線圈與桌面的傾斜；不做拖曳旋轉——直立電磁鐵繞鉛直軸轉看起來都一樣）：
 *   鐵架吊著一支直立電磁鐵（鐵芯＋線圈），左邊桌上是串聯電池，上方導線有閘刀開關；下方桌上是一堆迴紋針與少許鐵屑。
 * 物理（簡報第 4 點）：軟鐵芯通電被磁化、斷電磁性立刻消失；鋼也會被磁化，但斷電後殘留磁性（不能當電磁鐵芯）；
 *   磁力隨電池串聯數（電流）、匝數（長度不變、越密）、插入鐵芯而增強。
 * 極性（與同課起重機動畫一致）：線圈正面那一段電流由左向右 → 從上方俯視為逆時針 → 鐵芯內 B 向上 → 上端 N、下端 S；
 *   外部磁力線由上端 N 繞到下端 S（箭頭向下）。畫面頂端字條寫出「俯視逆時針 → 上端 N」。
 *   電池 + 極在左：電流由 + 極 → 左導線往上 → 開關 → 線圈上端 → 線圈 → 右導線 → 桌前導線 → 電池 − 極。
 * 吸起數量（示意值，非實測）：n = ⌊電池數 × 匝數 ÷ 6 × 鐵芯係數⌋，鐵芯係數：沒有 0.34、軟鐵 1、鋼 0.8。
 *   範圍 0～15；吸起的迴紋針分三串掛在鐵芯下面（每串最多 5 個，彼此被磁化而串在一起）。
 *   鋼芯斷電殘留：斷電當下吸著 ≥ 6 個 → 留 2 個；1～5 個 → 留 1 個；0 個 → 0 個（仍有一點殘磁）。
 * 鍵盤（畫布聚焦）：↑／↓ 電池 ±1、←／→ 匝數 ±1 段、空白鍵或 Enter 切換通電／斷電；按鈕都可 Tab＋Enter。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PURPLE = C.purple;
  const POLE_N = C.poleN, POLE_S = C.poleS;
  const CHALK = '#f2ecd9', MUTED = '#b9c7bf', PANEL = 'rgba(12,30,25,0.92)';

  // ───────── 小工具（與同課其他檔同一套） ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
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
  // 有深色底的小標籤；xMin／xMax 限制左右範圍。回傳外框
  function tag(ctx, s, x, y, color, a = 1, size = 24, xMin = 6, xMax = STAGE_R) {
    if (a <= 0.01) return null;
    size = fitSize(ctx, s, xMax - xMin - 24, size, 22);
    const w = textW(ctx, s, size) + 22;
    x = clamp(x, xMin + w / 2, xMax - w / 2);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 9); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
    return { x0: x - w / 2, x1: x + w / 2, y0: y - size * 0.78, y1: y + size * 0.78 };
  }
  function bar(ctx, s, y, color, size = 24, cx = W / 2, maxW = W - 60) {
    size = fitSize(ctx, s, maxW, size, 22);
    const w = textW(ctx, s, size) + 30;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, cx - w / 2, y - size * 0.8, w, size * 1.6, 10); ctx.fill(); ctx.stroke();
    label(ctx, s, cx, y + 1, color, 'center', size); ctx.restore();
  }
  function leader(ctx, x1, y1, x2, y2, color, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x2, y2, 4, 0, TAU); ctx.fill(); ctx.restore();
  }
  function poleBadge(ctx, x, y, isN, a, r = 20) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 24);
  }

  // ═════════ 導線（含流動的電流虛線；與起重機動畫同一套畫法） ═════════
  function drawPath(ctx, pts, o) {
    const part = o.part || 'all';
    if (pts.length < 2) return;
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
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of runs) { ctx.strokeStyle = '#3a2416'; ctx.lineWidth = w + 3; polyline(ctx, r.p); ctx.stroke(); }
    for (const r of runs) { ctx.strokeStyle = part === 'back' ? '#7a4e32' : '#b4744a'; ctx.lineWidth = w; polyline(ctx, r.p); ctx.stroke(); }
    if (part !== 'back' && w >= 4) for (const r of runs) { ctx.strokeStyle = 'rgba(255,220,180,0.38)'; ctx.lineWidth = Math.max(1.2, w * 0.25); ctx.beginPath(); r.p.forEach((p, i) => i ? ctx.lineTo(p.x, p.y - w * 0.22) : ctx.moveTo(p.x, p.y - w * 0.22)); ctx.stroke(); }
    const amp = o.amp || 0;
    if (amp > 0.01) {
      ctx.globalAlpha = amp * (part === 'back' ? 0.5 : 1); ctx.strokeStyle = ORANGE; ctx.lineWidth = Math.max(2.4, w * 0.62); ctx.shadowColor = ORANGE; ctx.shadowBlur = o.glow || 8;
      ctx.setLineDash([10, 16]);
      for (const r of runs) { ctx.lineDashOffset = cum[r.i0] - (o.flow || 0); polyline(ctx, r.p); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // 直立線圈（螺旋）：從左端開始，正面（下半橢圓）由左往右，背面由右往左，一圈一圈往下；長度固定、n 越大越密
  function helix(cx, y0, y1, n, rx, ry) {
    const N = Math.max(8, Math.ceil(n * 40)), out = [];
    for (let i = 0; i <= N; i++) {
      const u = n * i / N, th = Math.PI - TAU * u, s = Math.sin(th);
      out.push({ x: cx + rx * Math.cos(th), y: y0 + (y1 - y0) * u / n + ry * s, f: s > -0.02 });
    }
    return out;
  }
  function coilArrows(ctx, cx, y0, y1, n, ry, amp, every) {
    if (amp <= 0.05) return;
    ctx.save(); ctx.globalAlpha = amp;
    for (let k = 0; k < Math.floor(n); k += every) {
      const y = y0 + (y1 - y0) * (k + 0.25) / n + ry;
      arrowHead(ctx, cx + 4, y, 0, ORANGE, 10);
    }
    ctx.restore();
  }
  // 閘刀開關：pivot → contact；sw：0＝斷開（刀片翹起、導線真的有缺口）→ 1＝接通
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
  // 乾電池（橫放，正極凸頭朝左）；+ 端橘、− 端藍（電學語意色）
  function cell(ctx, x, y, w, h, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5f8f9c'); g.addColorStop(0.45, '#2f5f6c'); g.addColorStop(1, '#1d3d47');
    ctx.fillStyle = g; ctx.strokeStyle = '#13282e'; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,128,64,0.8)'; ctx.fillRect(x + 3, y + 2, 6, h - 4);
    ctx.fillStyle = 'rgba(77,210,255,0.55)'; ctx.fillRect(x + w - 7, y + 2, 4, h - 4);
    ctx.fillStyle = '#c9d3d6'; ctx.fillRect(x - 5, y + h / 2 - 5, 5, 10);
    ctx.restore();
  }
  function rrectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function paperclip(ctx, x, y, ang, a = 1, glow = 0) {
    if (a <= 0.01) return;
    const path = () => {
      ctx.beginPath(); rrectPath(ctx, -6, -13, 12, 26, 6);
      ctx.moveTo(-3, 9); ctx.lineTo(-3, -7); ctx.arc(0, -7, 3, Math.PI, 0); ctx.lineTo(3, 5);
    };
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(10,26,22,0.9)'; ctx.lineWidth = 4.4; path(); ctx.stroke();
    if (glow > 0.01) { ctx.shadowColor = PURPLE; ctx.shadowBlur = 8 * glow; }
    ctx.strokeStyle = '#d3dcde'; ctx.lineWidth = 2.2; path(); ctx.stroke();
    ctx.restore();
  }

  // ═════════ 場景常數 ═════════
  const STAGE_R = 762;                       // 舞台右界（右邊是數量卡）
  const CX = 430;                            // 電磁鐵中心
  const CORE_T = 112, CORE_B = 318, CORE_HW = 16;
  const CY0 = 148, CY1 = 298, RX = 36;       // 線圈上下端（長度固定）、半徑
  const ARM_Y = 62, POST_X = 640;
  const SW0 = 150, SW1 = 208;                // 開關：支點、接點（在上方導線 y = CY0）
  const LW_X = 40;                           // 左導線
  const RW_X = CX + 100;                     // 右導線（往下接到桌前）
  const BANK_X = 64, CELL_W = 34, CELL_P = 36, CELL_Y = 462, CELL_H = 26;
  const TABLE_FRONT = 490, TABLE_BOT = 512, FRONT_WIRE_Y = 502;
  const CARD = { x: 776, y: 66, w: 212, h: 436 };
  const ROW = 24, STRAND = [-20, 0, 20], ANCHOR_Y = CORE_B + 15;
  const MAXN = 15, NPILE = 20;
  const CORES = { none: 0.34, soft: 1, steel: 0.8 };
  const TURNS = [6, 12, 18];
  const VIEWS = { oblique: { ry: 8, depth: 1 }, side: { ry: 2, depth: 0.32 } };
  const G = 1700;                            // 落下的重力加速度（px/s²，示意）

  // 桌上的迴紋針（固定亂數；越靠近中央的越先被吸起）
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const PILE = [];
  for (let i = 0; i < NPILE; i++) {
    const u = (rnd() - 0.5) * 2, x = CX + u * 78 + (rnd() - 0.5) * 10;
    PILE.push({ x, d: 0.25 + rnd() * 0.7, a: (rnd() - 0.5) * 3.6 + Math.PI / 2 * (rnd() > 0.5 ? 1 : 0) });
  }
  PILE.sort((p, q) => Math.abs(p.x - CX) - Math.abs(q.x - CX));
  const FILINGS = [];
  for (let i = 0; i < 46; i++) FILINGS.push({ x: CX + (rnd() - 0.5) * 250, d: rnd(), a: rnd() * Math.PI, l: 4 + rnd() * 4 });

  // ═════════ 狀態 ═════════
  const S = {
    bat: 1, turns: 12, core: 'soft', power: true, view: 'oblique',
    rem: 0, remMag: false,                  // 鋼芯殘留：吸住的個數、是否有殘磁
    note: 'start', noteN: 0,
    t: 0, last: 0, raf: 0, on: false, visible: true,
    ampTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    batTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    nTw: { from: 12, to: 12, t0: 0, dur: 0.01 },
    fTw: { from: 2, to: 2, t0: 0, dur: 0.01 },
    lnTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    ryTw: { from: 8, to: 8, t0: 0, dur: 0.01 },
    dpTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    swTw: { from: 1, to: 1, t0: 0, dur: 0.01 },
    coreA: { none: { from: 0, to: 0, t0: 0, dur: 0.01 }, soft: { from: 1, to: 1, t0: 0, dur: 0.01 }, steel: { from: 0, to: 0, t0: 0, dur: 0.01 } },
    clips: [], kick: [0, 0, 0], kickT: [0, 0, 0],
    flow: 0, fph: 0,
    actions: 0
  };
  const twVal = tw => lerp(tw.from, tw.to, easeIO((S.t - tw.t0) / tw.dur));
  const twLin = tw => lerp(tw.from, tw.to, clamp((S.t - tw.t0) / tw.dur, 0, 1));
  function startTw(tw, to, dur) { tw.from = twVal(tw); tw.to = to; tw.t0 = S.t; tw.dur = dur; }

  const coreK = () => CORES[S.core];
  const forceOn = () => S.bat * S.turns / 6 * coreK();
  const clipsFor = F => Math.min(MAXN, Math.floor(F + 1e-9));
  const forceNow = () => S.power ? forceOn() : (S.core === 'steel' && S.remMag ? S.rem + 0.5 : 0);
  const targetClips = () => S.power ? clipsFor(forceOn()) : (S.core === 'steel' ? S.rem : 0);
  const linesFor = F => F <= 0.01 ? 0 : clamp(1 + Math.floor(F / 4), 1, 4);
  const magnetized = () => forceNow() > 0.01;

  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  // ═════════ 迴紋針 ═════════
  // 每個迴紋針：mode 'pile'（桌上）| 'fly'（被吸上去）| 'hang'（掛著）| 'fall'（掉下）
  function initClips() {
    S.clips = PILE.map(() => ({ mode: 'pile', t0: 0, x0: 0, y0: 0, a0: 0 }));
    const n = targetClips();
    for (let k = 0; k < n; k++) S.clips[k].mode = 'hang';
  }
  const depth = () => twVal(S.dpTw);
  function homeOf(k) {
    const p = PILE[k], dp = depth();
    return { x: p.x, y: TABLE_FRONT - 6 - p.d * 18 * dp, a: p.a };
  }
  function strandAng(s) {
    const A = (2.2 + S.kick[s] * Math.exp(-(S.t - S.kickT[s]) / 1.4)) * Math.PI / 180;
    return A * Math.sin(2.6 * S.t + s * 2.1);
  }
  function slotOf(k) {
    const s = k % 3, r = Math.floor(k / 3), th = strandAng(s);
    const ax = CX + STRAND[s], ay = ANCHOR_Y, d = r * ROW;
    return { x: ax + Math.sin(th) * d, y: ay + Math.cos(th) * d, a: -th + (r % 2 ? 0.12 : -0.12) * (s === 1 ? -1 : 1) };
  }
  function clipPos(k) {
    const c = S.clips[k];
    if (c.mode === 'pile') return Object.assign(homeOf(k), { lifted: false });
    if (c.mode === 'hang') return Object.assign(slotOf(k), { lifted: true });
    if (c.mode === 'fly') {
      const h = { x: c.x0, y: c.y0, a: c.a0 };
      if (S.t < c.t0) return Object.assign(h, { lifted: false });
      const p = easeIO((S.t - c.t0) / 0.5), s = slotOf(k);
      if (p >= 1) { c.mode = 'hang'; return Object.assign(s, { lifted: true }); }
      return { x: lerp(h.x, s.x, p), y: lerp(h.y, s.y, p) - 30 * Math.sin(Math.PI * p), a: lerp(h.a, s.a, p), lifted: true };
    }
    // fall
    if (S.t < c.t0) return Object.assign(slotOf(k), { lifted: true });
    const h = homeOf(k), dt = S.t - c.t0, T = Math.sqrt(2 * Math.max(1, h.y - c.y0) / G);
    if (dt < T) {
      const k2 = dt / T;
      return { x: lerp(c.x0, h.x, k2), y: c.y0 + 0.5 * G * dt * dt, a: lerp(c.a0, h.a, k2) + 0.8 * Math.sin(k2 * Math.PI), lifted: false };
    }
    const b = dt - T;
    if (b < 0.35) return { x: h.x, y: h.y - 9 * Math.abs(Math.sin(b / 0.35 * Math.PI)) * (1 - b / 0.35), a: h.a, lifted: false };
    c.mode = 'pile'; return Object.assign(h, { lifted: false });
  }
  function syncClips(stagger) {
    const n = targetClips();
    let up = 0;
    for (let k = 0; k < S.clips.length; k++) {
      const c = S.clips[k];
      if (k < n && (c.mode === 'pile' || c.mode === 'fall')) {
        const p = clipPos(k), wasFall = c.mode === 'fall';       // 半空中的也接得住：從目前位置飛上去
        c.mode = 'fly'; c.x0 = p.x; c.y0 = p.y; c.a0 = p.a; c.t0 = S.t + (wasFall ? 0 : 0.08 + up * 0.07); up++;
      }
    }
    // 掉下：最下面一排先掉；斷電時全部同時掉
    const drops = [];
    for (let k = S.clips.length - 1; k >= n; k--) { const c = S.clips[k]; if (c.mode === 'hang' || c.mode === 'fly') drops.push(k); }
    drops.forEach((k, i) => {
      const c = S.clips[k], p = clipPos(k);
      if (!p.lifted && c.mode === 'fly') { c.mode = 'pile'; return; }
      c.mode = 'fall'; c.x0 = p.x; c.y0 = p.y; c.a0 = p.a; c.t0 = S.t + (stagger ? i * 0.05 : 0);
    });
    if (up || drops.length) for (let s = 0; s < 3; s++) { S.kick[s] = 5 + 2 * s; S.kickT[s] = S.t; }
  }
  const countHanging = () => S.clips.filter(c => c.mode === 'hang' || c.mode === 'fly').length;

  // ═════════ 畫一幀 ═════════
  function drawStand() {
    ctx.save();
    ctx.fillStyle = '#4f625b'; ctx.strokeStyle = '#26352f'; ctx.lineWidth = 2;
    ctx.fillRect(POST_X - 6, ARM_Y, 12, TABLE_FRONT - ARM_Y - 6); ctx.strokeRect(POST_X - 6, ARM_Y, 12, TABLE_FRONT - ARM_Y - 6);
    ctx.fillRect(CX - 24, ARM_Y, POST_X - CX + 30, 10); ctx.strokeRect(CX - 24, ARM_Y, POST_X - CX + 30, 10);
    rrect(ctx, POST_X - 26, TABLE_FRONT - 14, 52, 10, 3); ctx.fill(); ctx.stroke();
    // 吊桿
    ctx.fillStyle = '#6d7f78'; ctx.fillRect(CX - 4, ARM_Y + 10, 8, CORE_T - ARM_Y - 10); ctx.strokeRect(CX - 4, ARM_Y + 10, 8, CORE_T - ARM_Y - 10);
    ctx.restore();
  }
  function drawTable() {
    const dp = depth(), top = TABLE_FRONT - 28 * dp;
    ctx.save();
    ctx.fillStyle = '#3b2c1f'; ctx.strokeStyle = '#1f160e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(22 + 14 * dp, top); ctx.lineTo(STAGE_R - 14 - 14 * dp, top); ctx.lineTo(STAGE_R - 14, TABLE_FRONT); ctx.lineTo(22, TABLE_FRONT); ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, TABLE_FRONT); g.addColorStop(0, '#4a3826'); g.addColorStop(1, '#6a5038');
    ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4b3824'; ctx.fillRect(22, TABLE_FRONT, STAGE_R - 36, TABLE_BOT - TABLE_FRONT); ctx.strokeRect(22, TABLE_FRONT, STAGE_R - 36, TABLE_BOT - TABLE_FRONT);
    ctx.restore();
  }
  function drawFilings(F) {
    const dp = depth(), k = clamp(F / 6, 0, 1);
    ctx.save(); ctx.strokeStyle = '#8f9a98'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const f of FILINGS) {
      const y = TABLE_FRONT - 4 - f.d * 20 * dp;
      const tgt = Math.atan2(CORE_B - y, CX - f.x) + Math.PI;     // 指向鐵芯下端
      const a = lerp(f.a, tgt, k * (0.55 + 0.45 * (1 - Math.abs(f.x - CX) / 130))), lift = k * 2.5;
      ctx.beginPath(); ctx.moveTo(f.x - Math.cos(a) * f.l / 2, y - lift - Math.sin(a) * f.l / 2); ctx.lineTo(f.x + Math.cos(a) * f.l / 2, y - lift + Math.sin(a) * f.l / 2); ctx.stroke();
    }
    ctx.restore();
  }
  // 磁力線：由上端 N 往外繞到下端 S；條數隨磁力（1～4 條／側），流動小點速度隨磁力
  function drawField(lnShown, alpha) {
    if (alpha <= 0.01 || lnShown <= 0.01) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 60, STAGE_R, 420); ctx.clip();
    ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    const bz = (q, a0, a1, a2, a3) => (1 - q) ** 3 * a0 + 3 * (1 - q) ** 2 * q * a1 + 3 * (1 - q) * q * q * a2 + q ** 3 * a3;
    for (let j = 0; j < 4; j++) {
      const la = clamp(lnShown - j, 0, 1) * alpha;
      if (la <= 0.01) continue;
      for (const sd of [-1, 1]) {
        const r = 74 + 34 * j;
        const P0 = { x: CX + sd * 14, y: CORE_T + 4 }, P1 = { x: CX + sd * r, y: CORE_T - 34 - 8 * j }, P2 = { x: CX + sd * r, y: CORE_B + 34 + 10 * j }, P3 = { x: CX + sd * 18, y: CORE_B - 2 };
        ctx.globalAlpha = la * 0.9; ctx.strokeStyle = PURPLE;
        ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.bezierCurveTo(P1.x, P1.y, P2.x, P2.y, P3.x, P3.y); ctx.stroke();
        const pt = q => ({ x: bz(q, P0.x, P1.x, P2.x, P3.x), y: bz(q, P0.y, P1.y, P2.y, P3.y) });
        const m = pt(0.5), m2 = pt(0.53);
        arrowHead(ctx, m.x, m.y, Math.atan2(m2.y - m.y, m2.x - m.x), GREEN, 11);
        ctx.fillStyle = '#f4e3ff'; ctx.shadowColor = PURPLE; ctx.shadowBlur = 8;
        for (let q0 = 0; q0 < 1; q0 += 0.2) {
          const q = (q0 + S.fph + j * 0.07) % 1, p = pt(q);
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, TAU); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }
  function drawCore(mag) {
    const h = CORE_B - CORE_T, x = CX - CORE_HW, w = CORE_HW * 2;
    const aN = twVal(S.coreA.none), aS = twVal(S.coreA.soft), aT = twVal(S.coreA.steel);
    ctx.save();
    if (aN > 0.01) {
      ctx.globalAlpha = aN; ctx.fillStyle = 'rgba(242,236,217,0.08)'; ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      rrect(ctx, x, CORE_T, w, h, 4); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const [a, c0, c1, c2] of [[aS, '#68747a', '#c3ccd0', '#5f6a70'], [aT, '#3d4a57', '#8697a8', '#34404c']]) {
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c0); g.addColorStop(0.45, c1); g.addColorStop(1, c2);
      if (mag > 0.01) { ctx.shadowColor = PURPLE; ctx.shadowBlur = 22 * mag; }
      ctx.fillStyle = g; ctx.strokeStyle = '#38423f'; ctx.lineWidth = 2;
      rrect(ctx, x, CORE_T, w, h, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      if (c0 === '#3d4a57') {                 // 鋼：斜紋，和軟鐵分得出來
        ctx.save(); rrect(ctx, x, CORE_T, w, h, 4); ctx.clip(); ctx.strokeStyle = 'rgba(200,220,240,0.22)'; ctx.lineWidth = 2;
        for (let yy = CORE_T - 30; yy < CORE_B; yy += 14) { ctx.beginPath(); ctx.moveTo(x, yy + 30); ctx.lineTo(x + w, yy); ctx.stroke(); }
        ctx.restore();
      }
    }
    if (mag > 0.01) {
      ctx.globalAlpha = 1;
      const tg = ctx.createLinearGradient(0, CORE_T, 0, CORE_B);
      tg.addColorStop(0, `rgba(255,111,118,${0.55 * mag})`); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, `rgba(114,185,255,${0.6 * mag})`);
      ctx.fillStyle = tg; rrect(ctx, x, CORE_T, w, h, 4); ctx.fill();
    }
    ctx.restore();
  }
  function drawMeter(F, n) {
    const { x, y, w, h } = CARD;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = 'rgba(85,233,255,0.4)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const cx = x + w / 2;
    const l1 = tr('吸起', 'Picked up');
    txt(ctx, l1, cx, y + 30, CHALK, 1, fitSize(ctx, l1, w - 20, 26, 22));
    const big = tr(`${n} 個`, `${n}`);
    txt(ctx, big, cx, y + 86, YELLOW, 1, fitSize(ctx, big, w - 24, 64, 30));
    const l3 = tr('迴紋針', n === 1 ? 'paper clip' : 'paper clips');
    txt(ctx, l3, cx, y + 136, CHALK, 1, fitSize(ctx, l3, w - 20, 24, 22));
    const l4 = tr('磁力強度', 'Strength');
    txt(ctx, l4, cx, y + 180, CHALK, 1, fitSize(ctx, l4, w - 20, 22, 22));
    const bx = x + 16, bw = w - 32, by = y + 200, bh = 30, k = clamp(F / MAXN, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.08)'; rrect(ctx, bx, by, bw, bh, 8); ctx.fill();
    if (k > 0.003) {
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, GREEN); g.addColorStop(1, '#e2ffd2');
      ctx.fillStyle = g; ctx.shadowColor = GREEN; ctx.shadowBlur = 12 * k; rrect(ctx, bx, by, Math.max(10, bw * k), bh, 8); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 2; rrect(ctx, bx, by, bw, bh, 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.setLineDash([3, 4]);
    for (let v = 3; v < MAXN; v += 3) { const xx = bx + bw * v / MAXN; ctx.beginPath(); ctx.moveTo(xx, by + 2); ctx.lineTo(xx, by + bh - 2); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
    const coreName = { none: tr('沒有鐵芯', 'No core'), soft: tr('軟鐵芯', 'Soft iron core'), steel: tr('鋼芯', 'Steel core') }[S.core];
    const lines = [
      [tr(`電池 ${S.bat} 顆`, S.bat > 1 ? `${S.bat} batteries` : '1 battery'), YELLOW],
      [tr(`匝數 ${S.turns} 圈`, `${S.turns} turns`), CYAN],
      [coreName, ORANGE],
      [S.power ? tr('● 通電', '● Power on') : tr('○ 斷電', '○ Power off'), S.power ? ORANGE : MUTED]
    ];
    lines.forEach(([s, c], i) => txt(ctx, s, cx, y + 276 + i * 34, c, 1, fitSize(ctx, s, w - 18, 24, 22)));
    const note = tr('（示意值）', '(model values)');
    txt(ctx, note, cx, y + h - 22, MUTED, 1, fitSize(ctx, note, w - 18, 22, 22));
  }

  function render() {
    if (!ctx) return;
    clear(ctx);
    const amp = twVal(S.ampTw), batShown = twLin(S.batTw), nf = Math.max(0.5, twLin(S.nTw)), ry = twVal(S.ryTw);
    const F = Math.max(0, twVal(S.fTw)), lnShown = twVal(S.lnTw);
    const magK = F > 0.01 ? clamp(0.35 + F / MAXN, 0, 1) : 0;
    const remOnly = !S.power && S.remMag && S.core === 'steel';

    drawStand();
    drawField(lnShown, remOnly ? 0.55 : clamp(0.45 + F / 10, 0, 1));
    // 電路：+ 極 → 左導線 → 開關支點；開關接點 → 線圈 → 右導線 → 桌前 → − 極
    const xR = BANK_X + batShown * CELL_P - 2;
    const flowO = { w: 4, amp, flow: S.flow, glow: 4 + 2 * S.bat };
    drawPath(ctx, [{ x: BANK_X - 5, y: CELL_Y + CELL_H / 2 }, { x: LW_X, y: CELL_Y + CELL_H / 2 }, { x: LW_X, y: CY0 }, { x: SW0, y: CY0 }], flowO);
    const coil = helix(CX, CY0, CY1, nf, RX, ry), end = coil[coil.length - 1];
    const pts = [{ x: SW1, y: CY0 }, { x: CX - RX - 2, y: CY0 }].concat(coil)
      .concat([{ x: end.x + 6, y: end.y + 2 }, { x: RW_X, y: CY1 + 6 }, { x: RW_X, y: FRONT_WIRE_Y }, { x: xR + 14, y: FRONT_WIRE_Y }, { x: xR + 14, y: CELL_Y + CELL_H / 2 }, { x: xR + 1, y: CELL_Y + CELL_H / 2 }]);
    drawTable();
    drawFilings(F);
    // 桌上的迴紋針（在後）
    const pos = S.clips.map((c, k) => clipPos(k));
    pos.forEach((p, k) => { if (!p.lifted && S.clips[k].mode === 'pile') paperclip(ctx, p.x, p.y, p.a); });
    drawPath(ctx, pts, Object.assign({ part: 'back' }, flowO));
    drawCore(magK);
    drawPath(ctx, pts, Object.assign({ part: 'front' }, flowO));
    coilArrows(ctx, CX, CY0, CY1, nf, ry, amp, nf > 13 ? 3 : 2);
    knifeSwitch(ctx, SW0, CY0, SW1, twVal(S.swTw));
    for (let k = 0; k < 5; k++) cell(ctx, BANK_X + k * CELL_P, CELL_Y, CELL_W, CELL_H, clamp(batShown - k, 0, 1));
    // 掛著、飛上去、掉下來的迴紋針（在前）
    pos.forEach((p, k) => { if (p.lifted || S.clips[k].mode !== 'pile') paperclip(ctx, p.x, p.y, p.a, 1, p.lifted ? magK : 0); });
    // 磁極章
    const poleA = magK > 0.01 ? (remOnly ? 0.6 : 1) * clamp(F * 2, 0, 1) : 0;
    poleBadge(ctx, CX - 46, CORE_T + 6, true, poleA);
    poleBadge(ctx, CX - 62, CORE_B + 12, false, poleA);

    // ── 文字（最後畫） ──
    drawMeter(F, targetClips());
    const coreName = { none: tr('沒有鐵芯（空心）', 'No core (hollow)'), soft: tr('軟鐵芯', 'Soft iron core'), steel: tr('鋼芯', 'Steel core') }[S.core];
    tag(ctx, tr('開關', 'Switch'), (SW0 + SW1) / 2, 112, CHALK, 1, 22);
    const b2 = tag(ctx, coreName, 150, 232, ORANGE, 1, 22, 50, 300);
    if (b2) leader(ctx, b2.x1, 232, CX - CORE_HW - 2, 232, ORANGE, 1);
    const ct = tr(`線圈 ${S.turns} 圈`, `Coil: ${S.turns} turns`);
    const b3 = tag(ctx, ct, 150, 300, CYAN, 1, 22, 50, 300);
    if (b3) leader(ctx, b3.x1, 300, CX - RX - 4, 286, CYAN, 1);
    tag(ctx, tr(`電池 ${S.bat} 顆（串聯）`, S.bat > 1 ? `${S.bat} batteries in series` : '1 battery'), 160, 420, YELLOW, 1, 22, 50, 330);

    let top, tc;
    if (S.power) { top = tr('通電：俯視線圈電流逆時針 → 上端 N、下端 S', 'On: current counterclockwise seen from above → N on top, S below'); tc = ORANGE; }
    else if (remOnly) { top = tr('斷電：鋼芯還留著一點磁性（上 N 下 S）', 'Off: the steel core keeps some magnetism (N top, S below)'); tc = CHALK; }
    else { top = tr('斷電：沒有電流，就沒有磁性', 'Power off: no current, no magnetism'); tc = CHALK; }
    bar(ctx, top, 32, tc, 24, W / 2, W - 30);
    const [msg, mc] = noteMsg();
    bar(ctx, msg, 546, mc, 24, W / 2, W - 30);
    txt(ctx, tr('電流越大、匝數越多、插入軟鐵芯 → 磁力越強', 'More current, more turns, a soft iron core → a stronger magnet'), W / 2, 584, CYAN, 1, 22);
  }
  function noteMsg() {
    const n = targetClips(), off = !S.power;
    switch (S.note) {
      case 'batUp': case 'batDown': case 'turnsUp': case 'turnsDown':
        if (off) return [tr('沒通電：先按「通電」才看得到磁力變化', 'Power is off: press Power on to see the change'), CHALK];
    }
    switch (S.note) {
      case 'batUp': return [tr(`電池變多：電流變大，磁力變強（吸起 ${n} 個）`, `More batteries: more current, a stronger force (${n} picked up)`), YELLOW];
      case 'batDown': return [tr(`電池變少：電流變小，磁力變弱（吸起 ${n} 個）`, `Fewer batteries: less current, a weaker force (${n} picked up)`), YELLOW];
      case 'batSame': return [tr(`現在是 ${S.bat} 顆電池串聯`, S.bat > 1 ? `${S.bat} batteries in series now` : 'One battery now'), YELLOW];
      case 'turnsUp': return [tr(`匝數變多：每圈磁場疊加，磁力變強（吸起 ${n} 個）`, `More turns: each turn's field adds up, a stronger force (${n})`), CYAN];
      case 'turnsDown': return [tr(`匝數變少：疊加的圈數少，磁力變弱（吸起 ${n} 個）`, `Fewer turns: fewer fields add up, a weaker force (${n})`), CYAN];
      case 'turnsSame': return [tr(`現在是 ${S.turns} 圈：線圈長度不變，圈越多越密`, `${S.turns} turns now: same coil length, more turns are packed closer`), CYAN];
      case 'soft': return off ? [tr('換成軟鐵芯：沒通電，軟鐵沒有磁性', 'Soft iron core: with no current it has no magnetism'), CHALK]
        : [tr(`插入軟鐵芯：鐵芯被磁化，磁力大增（吸起 ${n} 個）`, `Soft iron core: it is magnetized and the force jumps (${n})`), ORANGE];
      case 'none': return off ? [tr('拿掉鐵芯：沒通電，也沒有磁性', 'Core removed: no current, no magnetism'), CHALK]
        : [tr(`拿掉鐵芯：只剩線圈的磁場，磁力弱很多（吸起 ${n} 個）`, `No core: only the coil's own field, much weaker (${n})`), ORANGE];
      case 'steel': return off ? [tr('換成鋼芯：還沒通電過的鋼沒有磁性', 'Steel core: steel that was never magnetized has no magnetism'), CHALK]
        : [tr(`鋼芯：通電也會被磁化（吸起 ${n} 個）；斷電試試看`, `Steel core: it is magnetized too (${n}); now try Power off`), ORANGE];
      case 'on': return [tr(`通電：電流流過線圈，鐵芯被磁化，吸起 ${n} 個`, `Power on: current flows, the core is magnetized, ${n} picked up`), ORANGE];
      case 'off':
        if (S.core === 'steel') return S.rem > 0
          ? [tr(`斷電：鋼芯殘留磁性，還吸住 ${S.rem} 個——鋼不能當電磁鐵的鐵芯`, `Off: steel stays magnetized and holds ${S.rem}, so it can't be an electromagnet core`), PURPLE]
          : [tr('斷電：鋼芯殘留一點磁性，只是太弱吸不住；多加電池再試', 'Off: the steel keeps a little magnetism, too weak here; add batteries and retry'), PURPLE];
        if (S.core === 'none') return [tr('斷電：線圈沒有電流，磁性消失，迴紋針掉下來', 'Power off: no current in the coil, the magnetism is gone and the clips drop'), CHALK];
        return [tr('斷電：軟鐵芯磁性消失，迴紋針掉下來', 'Power off: the soft iron loses its magnetism and the clips drop'), CHALK];
      case 'oblique': return [tr('斜視：看得到線圈一圈一圈繞在鐵芯上', 'Angled view: see each turn of the coil wrapped around the core'), GREEN];
      case 'side': return [tr('側視：和課本圖一樣，從正面看電磁鐵', 'Side view: facing the electromagnet, like the textbook picture'), GREEN];
      default:
        if (off) return [tr('斷電：按「通電」讓電磁鐵吸起迴紋針', 'Power off: press Power on to pick up paper clips'), CHALK];
        return [tr(`通電中：吸起 ${n} 個迴紋針——試試調出最強的電磁鐵！`, `Power on: ${n} picked up. Try to build the strongest electromagnet!`), YELLOW];
    }
  }

  // ═════════ 動畫迴圈（單一 RAF；離開畫面就停） ═════════
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const amp = twVal(S.ampTw), F = Math.max(0, twVal(S.fTw));
    S.flow += dt * 60 * (0.6 + 0.25 * S.bat) * amp;
    S.fph = (S.fph + dt * (0.12 + 0.025 * F)) % 1;
    render();
    sync();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ═════════ 操作 ═════════
  function refresh(stagger) {
    const F = forceNow();
    startTw(S.fTw, F, 0.45);
    startTw(S.lnTw, linesFor(F), 0.45);
    syncClips(stagger);
  }
  function setPower(on) {
    if (S.power === on) { S.note = on ? 'on' : 'off'; return; }
    if (!on && S.core === 'steel') {        // 斷電的那一刻決定鋼芯殘留多少
      const n = clipsFor(forceOn());
      S.rem = n >= 6 ? 2 : n >= 1 ? 1 : 0; S.remMag = true;
    }
    S.power = on; S.note = on ? 'on' : 'off';
    if (on) { S.rem = 0; }
    startTw(S.ampTw, on ? 1 : 0, 0.35);
    startTw(S.swTw, on ? 1 : 0, 0.3);
    refresh(false);
  }
  function setBat(n) {
    n = clamp(n, 1, 5);
    S.note = n > S.bat ? 'batUp' : n < S.bat ? 'batDown' : 'batSame';
    S.bat = n; S.batTw = { from: twLin(S.batTw), to: n, t0: S.t, dur: 0.4 };
    refresh(true);
  }
  function setTurns(n) {
    S.note = n > S.turns ? 'turnsUp' : n < S.turns ? 'turnsDown' : 'turnsSame';
    if (n !== S.turns) { S.nTw = { from: twLin(S.nTw), to: n, t0: S.t, dur: 0.5 }; S.turns = n; }
    refresh(true);
  }
  function setCore(c) {
    S.note = c;
    if (c !== S.core) {
      for (const k of Object.keys(S.coreA)) startTw(S.coreA[k], k === c ? 1 : 0, 0.4);
      S.core = c;
      if (!S.power) { S.rem = 0; S.remMag = false; }   // 斷電時換鐵芯：新換上的鐵芯沒有被磁化過
    }
    refresh(true);
  }
  function setView(v) {
    S.view = v; S.note = v;
    startTw(S.ryTw, VIEWS[v].ry, 0.45);
    startTw(S.dpTw, VIEWS[v].depth, 0.45);
  }
  const ACTIONS = {
    b1: () => setBat(1), b2: () => setBat(2), b3: () => setBat(3), b4: () => setBat(4), b5: () => setBat(5),
    t6: () => setTurns(6), t12: () => setTurns(12), t18: () => setTurns(18),
    none: () => setCore('none'), soft: () => setCore('soft'), steel: () => setCore('steel'),
    pon: () => setPower(true), poff: () => setPower(false),
    oblique: () => setView('oblique'), side: () => setView('side')
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
      [tr('電池', 'Batteries'), [1, 2, 3, 4, 5].map(n => ['b' + n, tr(`${n} 顆`, `${n}`)])],
      [tr('匝數', 'Turns'), [['t6', tr('少 6 圈', 'Few: 6')], ['t12', tr('中 12 圈', 'Medium: 12')], ['t18', tr('多 18 圈', 'Many: 18')]]],
      [tr('鐵芯', 'Core'), [['none', tr('沒有', 'None')], ['soft', tr('軟鐵', 'Soft iron')], ['steel', tr('鋼', 'Steel')]]],
      [tr('開關', 'Switch'), [['pon', tr('通電', 'Power on')], ['poff', tr('斷電', 'Power off')]]],
      [tr('視角', 'View'), [['oblique', tr('斜視', 'Angled')], ['side', tr('側視', 'Side')]]]
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
        let on = false;
        if (/^b\d$/.test(k)) on = S.bat === +k.slice(1);
        else if (/^t\d+$/.test(k)) on = S.turns === +k.slice(1);
        else if (CORES[k] !== undefined) on = S.core === k;
        else if (k === 'pon') on = S.power;
        else if (k === 'poff') on = !S.power;
        else if (VIEWS[k]) on = S.view === k;
        b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      });
    }
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', tr('電磁鐵實驗台：調電池、匝數、鐵芯，看吸起幾個迴紋針；方向鍵上下改電池、左右改匝數，空白鍵切換通電',
      'Electromagnet bench: change batteries, turns and core to see how many paper clips it picks up; up/down arrows change batteries, left/right change turns, space toggles power'));
  }
  function resultHTML() {
    const n = targetClips(), F = forceOn();
    const coreZh = { none: '沒有鐵芯', soft: '軟鐵芯', steel: '鋼芯' }[S.core], coreEn = { none: 'no core', soft: 'a soft iron core', steel: 'a steel core' }[S.core];
    let main;
    if (S.power) {
      const c = {
        soft: tr('<strong class="accent-orange">軟鐵芯</strong>被磁化成一根磁鐵，磁力大增。', 'The <strong class="accent-orange">soft iron core</strong> is magnetized into a magnet, so the force jumps.'),
        none: tr('<strong class="accent-orange">沒有鐵芯</strong>：只有線圈本身的磁場，磁力弱很多。', '<strong class="accent-orange">No core</strong>: only the coil\'s own field, so the force is much weaker.'),
        steel: tr('<strong class="accent-orange">鋼芯</strong>也會被磁化，但斷電後會留下磁性。', 'The <strong class="accent-orange">steel core</strong> is magnetized too, but it stays magnetized after the power is off.')
      }[S.core];
      main = tr(`<strong class="accent-orange">通電</strong>：電流流過線圈，從上方俯視是逆時針，所以<strong class="accent-red">上端 N</strong>、<strong class="accent-blue">下端 S</strong>。`,
        `<strong class="accent-orange">Power on</strong>: current flows through the coil, counterclockwise seen from above, so <strong class="accent-red">N is on top</strong> and <strong class="accent-blue">S below</strong>. `) + c;
    } else if (S.core === 'steel' && S.remMag) {
      main = tr(`<strong class="accent-yellow">斷電</strong>：鋼芯殘留磁性，還吸住 <strong class="accent-yellow">${S.rem}</strong> 個迴紋針。<strong class="accent-pink">鋼會留下磁性，不能當電磁鐵的鐵芯</strong>——電磁鐵要用軟鐵，才能隨開隨關。`,
        `<strong class="accent-yellow">Power off</strong>: the steel core stays magnetized and still holds <strong class="accent-yellow">${S.rem}</strong> ${S.rem === 1 ? 'clip' : 'clips'}. <strong class="accent-pink">Steel keeps its magnetism, so it can't be an electromagnet's core</strong>: soft iron lets you switch it on and off.`);
    } else if (S.core === 'soft') {
      main = tr('<strong class="accent-yellow">斷電</strong>：軟鐵芯的磁性立刻消失，迴紋針全部掉下來——所以電磁鐵可以隨開隨關。',
        '<strong class="accent-yellow">Power off</strong>: the soft iron core loses its magnetism at once and every clip drops, which is why an electromagnet can be switched on and off.');
    } else {
      main = tr('<strong class="accent-yellow">斷電</strong>：沒有電流就沒有磁場，迴紋針掉下來。', '<strong class="accent-yellow">Power off</strong>: no current, no magnetic field, so the clips drop.');
    }
    const fx = Math.round(F * 100) / 100;
    const calc = S.power
      ? tr(`<strong class="accent-cyan">電池 ${S.bat} 顆 × 匝數 ${S.turns} 圈 × ${coreZh}</strong> → 吸起 <span class="nowrap"><strong class="accent-yellow">${n} 個</strong></span>。（示意值：電池數 × 匝數 ÷ 6 × 鐵芯係數＝${fx}，取整數；鐵芯係數：沒有 0.34、軟鐵 1、鋼 0.8）`,
        `<strong class="accent-cyan">${S.bat} ${S.bat > 1 ? 'batteries' : 'battery'} × ${S.turns} turns × ${coreEn}</strong> → <span class="nowrap"><strong class="accent-yellow">${n} picked up</strong></span>. (Model value: batteries × turns ÷ 6 × core factor = ${fx}, rounded down; core factor: none 0.34, soft iron 1, steel 0.8)`)
      : tr(`現在是電池 ${S.bat} 顆、匝數 ${S.turns} 圈、${coreZh}，但開關斷開、沒有電流。`, `${S.bat} ${S.bat > 1 ? 'batteries' : 'battery'}, ${S.turns} turns, ${coreEn}, but the switch is open and no current flows.`);
    const sum = tr('收束：<strong>電流越大</strong>（電池串聯越多）、<strong>匝數越多</strong>（長度不變、越密）、<strong>插入軟鐵芯</strong> → 磁力越強。',
      'Wrap-up: <strong>more current</strong> (more batteries in series), <strong>more turns</strong> (same length, denser) and <strong>a soft iron core</strong> → a stronger magnet.');
    return `${main}<br>${calc}<br><span class="accent-cyan">${sum}</span>`;
  }

  // ═════════ 鍵盤（畫布聚焦時） ═════════
  function onKey(e) {
    let key = null;
    if (e.key === 'ArrowUp') key = 'b' + clamp(S.bat + 1, 1, 5);
    else if (e.key === 'ArrowDown') key = 'b' + clamp(S.bat - 1, 1, 5);
    else if (e.key === 'ArrowRight') key = 't' + TURNS[clamp(TURNS.indexOf(S.turns) + 1, 0, 2)];
    else if (e.key === 'ArrowLeft') key = 't' + TURNS[clamp(TURNS.indexOf(S.turns) - 1, 0, 2)];
    else if (e.key === ' ' || e.key === 'Enter') key = S.power ? 'poff' : 'pon';
    if (!key) return;
    e.preventDefault();
    act(key);
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  let inited = false;
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('craneLabCanvas');
    ctrl = document.getElementById('craneLabControls');
    res = document.getElementById('craneLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    if (!inited) { initClips(); inited = true; }
    S.on = true; S.visible = true;
    cv.style.cursor = 'default';            // 這個實驗台不用拖曳
    buildControls(); updateUI();
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
    if (cv) { cv.removeEventListener('keydown', onKey); cv.style.cursor = ''; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    buildControls(); updateUI();
    render();
  }
  function _state() {
    const mag = magnetized();
    return {
      bat: S.bat, turns: S.turns, core: S.core, power: S.power, view: S.view,
      force: +forceNow().toFixed(3), forceShown: +twVal(S.fTw).toFixed(3),
      clips: targetClips(), clipsHanging: countHanging(),
      clipsFalling: S.clips.filter(c => c.mode === 'fall').length,
      clipsOnTable: S.clips.filter(c => c.mode === 'pile').length,
      residual: !S.power && S.core === 'steel' ? S.rem : 0, remMag: S.remMag && S.core === 'steel' && !S.power,
      topPole: mag ? 'N' : null, bottomPole: mag ? 'S' : null,
      linesPerSide: linesFor(forceNow()),
      current: S.power ? 'on' : 'off', batteryPlus: 'left',
      coilRy: +twVal(S.ryTw).toFixed(2), turnsShown: +twLin(S.nTw).toFixed(2),
      note: S.note, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  EmLab.crane = { activate, deactivate, relang, _state };
})();
