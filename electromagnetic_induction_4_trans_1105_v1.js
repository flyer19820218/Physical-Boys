/* electromagnetic_induction_4_trans_1105_v1.js — 「變壓器」分頁動畫（#transformerCanvas，邏輯 1000×600）
 *
 * 契約：window.EmiAnim.trans = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 一個場景：'transformer'。
 * 依賴頁面現成的（直接呼叫，不複製）：tr、C、TAU。其餘小工具（換行、外框箭頭、流動記號）在本檔內。
 * 畫布不綁任何事件；唯一控制是 #steps-trans 裡的 5 個步驟鈕。
 * 畫面是「場景時間 t 的純函式」：每步 tl 從 0 起算；交流相位 ph＝ω·tl（T＝3.5 s，慢動作），
 *   Φ、Iₚ、Vₛ、Iₛ、Bᵢ、波形軌跡、電流記號位移（＝∫I dt 的解析式）、直流開關事件全由 tl 算出，不累積狀態。
 *
 * ── 步驟表（共 39.0 s）──────────────────────────────────────────
 *   1 磁場來回   7.0 s  [0.0]  Nₚ＝5、Nₛ＝5（二次側淡化）；交流電源 → Iₚ＝sin ph；鐵芯四邊紫色 B 箭頭同步變大變小、
 *                              反向（沿鐵芯繞行）；右上圖：Φ 與 Iₚ 兩條軌跡同相（兩個週期＝7 s）
 *   2 感應電壓   7.0 s  [7.0]  二次側亮起：Vₛ＝−cos ph（接近電阻負載，Iₛ 與 Vₛ 同相）、Bᵢ（亮紫）反抗 Φ 的變化；
 *                              右上圖：Φ 與 Vₛ 對照，Φ 最大處畫導引線（Vₛ＝0），標出「¼T」錯開；右側狀態列即時顯示
 *                              「Φ 最大 → Vₛ＝0／Φ＝0 → |Vₛ| 最大」與「Φ 增加 → Bᵢ 反向／Φ 減少 → Bᵢ 同向」
 *   3 升壓       8.0 s  [14.0] Nₚ＝5、Nₛ＝8 → 110 V × 8/5＝176 V；右欄每匝電壓方塊（每匝 22 V）；
 *                              電流帶粗細 Iₚ：Iₛ＝1：5/8（Vₚ·Iₚ≈Vₛ·Iₛ）
 *   4 降壓       8.0 s  [22.0] Nₚ＝8、Nₛ＝4 → 110 V × 4/8＝55 V；每匝 13.75 V；電流帶 Iₚ：Iₛ＝1：2
 *   5 直流電     9.0 s  [30.0] 電池（上端＋）＋開關：tl＝1.5 s 接通、5.5 s 切斷；Φ 指數上升／下降（τ＝0.35／0.28 s），
 *                              Vₛ＝−K·dΦ/dt → 接通負脈衝、切斷正脈衝，其餘時間 Vₛ＝0；右上圖橫軸＝時間 0–9 s。
 *                              切斷後停留約 2.5 s，停在最後一幀。
 * 每步開頭 0.35 s 淡入；右下角註明「真實市電 60 Hz，這裡放慢」（交流步驟）。
 *
 * ── 幾何與符號約定 ────────────────────────────────────────────
 *   物理座標：x 向右、y 向上、z 朝觀看者（畫面為正面略俯視，線圈前半圈 z>0 畫在鐵芯前方）。
 *   兩組線圈繞法相同：螺旋參數 g 增加 ＝ 由上往下前進；位置 (cx＋r cos g, z＝r sin g)。
 *     前半圈（sin g>0）沿 +g 走時 x 由 cx＋r → cx−r，即「前側導線向左」。
 *     沿 +g 的電流繞 −ŷ 方向右手旋轉（x̂→ẑ 的轉向 x̂×ẑ＝−ŷ）⇒ 線圈內磁場向下。
 *   一次線圈 g 由 π 起（引線在外側左邊），二次線圈 g 由 0 起（引線在外側右邊）；兩者都是上端引線先進入線圈。
 *   Φ＞0 定義：鐵芯磁場逆時針繞行（畫面上：左柱向下、下樑向右、右柱向上、上樑向左）。
 *   Iₚ＞0：電流由電源上端流出 → 上引線 → 一次線圈沿 +g → 左柱 B 向下 ⇒ Φ＞0（Iₚ 與 Φ 同相，課本模型）。
 *   Vₛ＞0：二次線圈上端為＋，負載電流由上往下（二次線圈內沿 −g）。法拉第：Vₛ＝−N dΦ/dt（正向參考
 *     ＝右手繞 Φ 方向），所以 Φ＝sin ph ⇒ Vₛ＝−cos ph；Bᵢ（右柱向上為正）＝Vₛ。
 *
 * ── 方向表 ─────────────────────────────────────────────────
 *   交流 ph       Φ（右柱）     |Φ|    Iₚ（一次前側導線）  Bᵢ（右柱）  Iₛ（二次前側導線／負載）   Vₛ  圖上
 *   0→90°         向上、＋      增加   向左（＋）          向下（反向）  向左／負載由下往上、上端−  −   Vₛ 在 0 以下
 *   90°→180°      向上、＋      減少   向左（＋）          向上（同向）  向右／負載由上往下、上端＋  ＋   Vₛ 在 0 以上
 *   180°→270°     向下、−      增加   向右（−）          向上（反向）  向右／負載由上往下、上端＋  ＋   Vₛ 在 0 以上
 *   270°→360°     向下、−      減少   向右（−）          向下（同向）  向左／負載由下往上、上端−  −   Vₛ 在 0 以下
 *   ph＝90°、270°：|Φ| 最大、dΦ/dt＝0 ⇒ Vₛ＝0、Bᵢ＝0；ph＝0°、180°：Φ＝0、斜率最大 ⇒ |Vₛ| 最大。
 *   直流 接通（電池上端＋，Iₚ 沿 +g）：Φ 由 0 增加（右柱向上變強）→ Bᵢ 向下（反向）→ Iₛ 前側向左、
 *                                      負載由下往上、上端 − → Vₛ 負脈衝（圖上往下）。
 *   直流 穩定：Φ 不變 → Vₛ＝0、Bᵢ＝0、Iₛ＝0（一次側電流仍在流）。
 *   直流 切斷：Iₚ＝0，Φ 減少 → Bᵢ 向上（同向，想維持）→ Iₛ 前側向右、負載由上往下、上端 ＋ → Vₛ 正脈衝（圖上往上）。
 *   畫面的紫 B 箭頭、亮紫 Bᵢ 箭頭、紅色電流帶／流動記號／前側導線箭頭、負載旁 ＋／− 記號、右上軌跡、
 *   狀態列文字與結果框，全由同一組 Φ、Iₚ、Vₛ 的正負決定，不另外寫死。
 *
 * 字級：畫布文字 20–24px（說明 24、標籤 22、次要 20），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmiAnim = window.EmiAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const T_AC = 3.5, OM = TAU / T_AC;
  const CORE = { x0: 185, x1: 525, y0: 105, y1: 485, th: 66 };
  const LCX = 218, RCX = 492;                         // 左柱、右柱中心
  const COIL_R = 50, COIL_RY = 13, COIL_T = 200, COIL_B = 400, AXY = 300;
  const SRC_X = 60, SRC_Y = 300, SRC_R = 28;
  const LOAD_X = 620, LOAD_T = 250, LOAD_B = 350;
  const SW_A = 92, SW_B = 140;                        // 開關兩接點 x（一次側上導線）
  const RX = 680, RW = 305;                           // 右欄
  const WIRE = '#9fb3aa', CHG_POS = '#ff8040';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;

  // ───────── 文字工具（量寬換行，不縮字） ─────────
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) {
        // 避頭：標點不放行首，連同前一個字一起換到下一行
        if (!latin && /^[，。、：；）」！？]/.test(u) && cur.length > 1) { const a = Array.from(cur), last = a.pop(); out.push(a.join('')); cur = last + u; }
        else { out.push(cur); cur = latin ? u : u.trimStart(); }
      } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function lines(ctx, arr, x, y, color, size, lh, align, alpha) { arr.forEach((s, k) => text(ctx, s, x, y + k * lh, color, size, align, alpha)); }
  // 換行後畫出，回傳佔用高度
  function para(ctx, s, x, y, maxW, color, size, lh, align, alpha) {
    const ls = wrap(ctx, s, maxW, size); lines(ctx, ls, x, y, color, size, lh, align, alpha); return ls.length * lh;
  }

  function arr(ctx, x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(head, L * 0.7);
    const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7); };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline !== false) { ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  function polyLen(p) { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y); return L; }
  function polyAt(p, s) {
    for (let k = 1; k < p.length; k++) {
      const l = Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y);
      if (s <= l || k === p.length - 1) { const u = clamp(s / l, 0, 1); return { x: p[k - 1].x + (p[k].x - p[k - 1].x) * u, y: p[k - 1].y + (p[k].y - p[k - 1].y) * u, dx: (p[k].x - p[k - 1].x) / l, dy: (p[k].y - p[k - 1].y) / l }; }
      s -= l;
    }
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }
  // 沿路徑流動的紅色電流記號：offset＝∫I（純函式），sgn＝目前電流方向
  function flowMarks(ctx, path, offset, sgn, a, size) {
    if (a < 0.05) return;
    const gap = 40, L = polyLen(path);
    for (let s = ((offset % gap) + gap) % gap; s < L; s += gap) {
      if (s < 6 || s > L - 6) continue;
      const q = polyAt(path, s);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.dy * sgn, q.dx * sgn)); ctx.scale(size, size);
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath();
      ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
    }
  }

  // ───────── 物理（全部是 tl 的解析式） ─────────
  const DC = { t1: 1.5, t2: 5.5, tOn: 0.35, tOff: 0.28, K: 0.28 };
  const DC_PHI2 = 1 - Math.exp(-(DC.t2 - DC.t1) / DC.tOn);
  function dcPhi(t) {
    if (t < DC.t1) return 0;
    if (t < DC.t2) return 1 - Math.exp(-(t - DC.t1) / DC.tOn);
    return DC_PHI2 * Math.exp(-(t - DC.t2) / DC.tOff);
  }
  function dcDPhi(t) {
    if (t < DC.t1) return 0;
    if (t < DC.t2) return Math.exp(-(t - DC.t1) / DC.tOn) / DC.tOn;
    return -DC_PHI2 * Math.exp(-(t - DC.t2) / DC.tOff) / DC.tOff;
  }
  const dcVs = t => -DC.K * dcDPhi(t);
  // ∫Iₚ dt（開關接通期間 Iₚ＝Φ）
  function dcIntIp(t) {
    const f = u => (u - DC.t1) - DC.tOn * (1 - Math.exp(-(u - DC.t1) / DC.tOn));
    if (t < DC.t1) return 0;
    return f(Math.min(t, DC.t2));
  }
  function physics(st, tl) {
    if (st.dc) {
      const closed = tl >= DC.t1 && tl < DC.t2, phi = dcPhi(tl), vs = dcVs(tl);
      return { phi, ip: closed ? phi : 0, vs, dphi: dcDPhi(tl), closed, qp: 60 * dcIntIp(tl), qs: -150 * DC.K * phi };
    }
    const ph = OM * tl, phi = Math.sin(ph), vs = -Math.cos(ph);
    return { ph, phi, ip: phi, vs, dphi: Math.cos(ph), qp: -34 * Math.cos(ph), qs: -34 * Math.sin(ph) };
  }

  // ───────── 鐵芯 ─────────
  function drawCore(ctx) {
    const { x0, x1, y0, y1, th } = CORE;
    ctx.save();
    const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#9aa6a3'); g.addColorStop(1, '#6f7c79');
    ctx.fillStyle = g; ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.rect(x0 + th, y0 + th, x1 - x0 - 2 * th, y1 - y0 - 2 * th);
    ctx.fill('evenodd');
    // 疊片紋路
    ctx.strokeStyle = 'rgba(40,55,52,.28)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 6; k++) {
      const d = th * k / 6;
      ctx.strokeRect(x0 + d, y0 + d, x1 - x0 - 2 * d, y1 - y0 - 2 * d);
    }
    ctx.strokeStyle = '#3f524d'; ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.strokeRect(x0 + th, y0 + th, x1 - x0 - 2 * th, y1 - y0 - 2 * th);
    ctx.restore();
  }
  // 鐵芯中心線（磁場路徑，紫虛線）
  function drawCorePath(ctx, a) {
    const h = CORE.th / 2;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
    rrect(ctx, CORE.x0 + h, CORE.y0 + h, CORE.x1 - CORE.x0 - 2 * h, CORE.y1 - CORE.y0 - 2 * h, 24); ctx.stroke(); ctx.restore();
  }
  // 鐵芯磁場 B：Φ＞0 逆時針（左柱下、下樑右、右柱上、上樑左）
  function drawB(ctx, phi, rightX) {
    const m = Math.abs(phi); if (m < 0.04) return;
    const s = phi > 0 ? 1 : -1, al = 0.45 + 0.55 * m, col = C.purple;
    const Lv = 165 * m, Lh = 150 * m, hy = CORE.th / 2;
    const cyT = CORE.y0 + hy, cyB = CORE.y1 - hy, cxm = (CORE.x0 + CORE.x1) / 2;
    arr(ctx, LCX, AXY - s * Lv / 2, LCX, AXY + s * Lv / 2, col, 12, 26, al);
    arr(ctx, cxm - s * Lh / 2, cyB, cxm + s * Lh / 2, cyB, col, 12, 26, al);
    arr(ctx, rightX, AXY + s * Lv / 2, rightX, AXY - s * Lv / 2, col, 12, 26, al);
    arr(ctx, cxm + s * Lh / 2, cyT, cxm - s * Lh / 2, cyT, col, 12, 26, al);
  }
  // 二次感應磁場 Bᵢ（右柱向上為正）
  function drawBi(ctx, bi, a) {
    const m = Math.abs(bi); if (m < 0.04 || a < 0.05) return;
    const L = 160 * Math.min(1, m), x = RCX + 16;
    arr(ctx, x, AXY + Math.sign(bi) * L / 2, x, AXY - Math.sign(bi) * L / 2, C.indPurple, 10, 22, a * (0.5 + 0.5 * Math.min(1, m)));
  }

  // ───────── 線圈 ─────────
  function helix(cx, n, g0) {
    const pts = [], tot = n * TAU, steps = n * 48;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, g = g0 + u * tot;
      pts.push({ x: cx + COIL_R * Math.cos(g), y: COIL_T + u * (COIL_B - COIL_T) + COIL_RY * Math.sin(g), front: Math.sin(g) > 0 });
    }
    return pts;
  }
  function strands(pts, front) {
    const out = []; let cur = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], inn = front ? p.front : !p.front;
      if (inn) { if (!cur) { cur = []; if (i) cur.push(pts[i - 1]); out.push(cur); } cur.push(p); }
      else if (cur) { cur.push(p); cur = null; }
    }
    return out;
  }
  function strokeStrands(ctx, segs, col, w, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    segs.forEach(s => { poly(ctx, s); ctx.strokeStyle = C.bg; ctx.lineWidth = w + 4; ctx.stroke(); });
    segs.forEach(s => { poly(ctx, s); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); });
    ctx.restore();
  }
  function coilBack(ctx, cx, n, g0, col, alpha) { strokeStrands(ctx, strands(helix(cx, n, g0), false), shade(col, 0.5), 6, alpha); }
  function coilFront(ctx, cx, n, g0, col, alpha) { strokeStrands(ctx, strands(helix(cx, n, g0), true), col, 8, alpha); }
  // 前側導線中點的電流箭頭：I＞0（沿 +g）→ 向左
  function coilCurrentHeads(ctx, cx, n, g0, I, alpha) {
    const a = alpha * clamp(Math.abs(I) / 0.25, 0, 1); if (a < 0.05) return;
    const pitch = (COIL_B - COIL_T) / n, sgn = I > 0 ? 1 : -1;
    for (let k = 0; k < n; k++) {
      const g = (g0 === 0 ? Math.PI / 2 : 2.5 * Math.PI) + k * TAU;
      const y = COIL_T + (g - g0) / (n * TAU) * (COIL_B - COIL_T) + COIL_RY;
      const dx = -COIL_R * sgn, dy = pitch / TAU * sgn, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, y); ctx.rotate(Math.atan2(uy, ux));
      ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath();
      ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
    }
  }

  // ───────── 外電路 ─────────
  const PX = LCX - COIL_R, SX = RCX + COIL_R;
  function priPaths(dc) {
    return {
      a: [{ x: SRC_X, y: SRC_Y - (dc ? 26 : SRC_R) }, { x: SRC_X, y: COIL_T }, { x: PX, y: COIL_T }],
      b: [{ x: PX, y: COIL_B }, { x: SRC_X, y: COIL_B }, { x: SRC_X, y: SRC_Y + (dc ? 26 : SRC_R) }]
    };
  }
  function secPaths() {
    return {
      a: [{ x: SX, y: COIL_T }, { x: LOAD_X, y: COIL_T }, { x: LOAD_X, y: LOAD_T }],
      b: [{ x: LOAD_X, y: LOAD_B }, { x: LOAD_X, y: COIL_B }, { x: SX, y: COIL_B }]
    };
  }
  function wire(ctx, p, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = WIRE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    poly(ctx, p); ctx.stroke(); ctx.restore();
  }
  // 電流帶：寬度 ∝ 振幅×|I|（示意電流大小）
  function band(ctx, paths, amp, I, alpha) {
    const m = amp * Math.abs(I); if (m < 0.03 || alpha < 0.05) return;
    ctx.save(); ctx.globalAlpha = alpha * 0.38; ctx.strokeStyle = C.current; ctx.lineWidth = 4 + 16 * m; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    paths.forEach(p => { poly(ctx, p); ctx.stroke(); }); ctx.restore();
  }
  function flowPaths(ctx, paths, q, I, amp, alpha) {
    const a = alpha * clamp((Math.abs(I) - 0.05) / 0.15, 0, 1), sg = I >= 0 ? 1 : -1, size = 0.7 + 0.6 * amp;
    flowMarks(ctx, paths.a, q, sg, a, size);
    flowMarks(ctx, paths.b, q - polyLen(paths.a), sg, a, size);
  }
  function drawACSource(ctx) {
    ctx.save(); ctx.fillStyle = '#16302a'; ctx.strokeStyle = C.orange; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(SRC_X, SRC_Y, SRC_R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = C.white;
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = SRC_X - 16 + 32 * u, y = SRC_Y - 9 * Math.sin(u * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  // 電池：上端長細線＝正極、下端短粗線＝負極
  function drawBattery(ctx) {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = WIRE; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(SRC_X, SRC_Y - 26); ctx.lineTo(SRC_X, SRC_Y - 8); ctx.moveTo(SRC_X, SRC_Y + 8); ctx.lineTo(SRC_X, SRC_Y + 26); ctx.stroke();
    ctx.strokeStyle = CHG_POS; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SRC_X - 26, SRC_Y - 8); ctx.lineTo(SRC_X + 26, SRC_Y - 8); ctx.stroke();
    ctx.strokeStyle = C.electron; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(SRC_X - 14, SRC_Y + 8); ctx.lineTo(SRC_X + 14, SRC_Y + 8); ctx.stroke();
    ctx.restore();
    text(ctx, '+', SRC_X - 30, SRC_Y - 26, CHG_POS, 24); text(ctx, '−', SRC_X - 30, SRC_Y + 26, C.electron, 24);
  }
  function drawSwitch(ctx, closed) {
    ctx.save(); ctx.fillStyle = C.white;
    [SW_A, SW_B].forEach(x => { ctx.beginPath(); ctx.arc(x, COIL_T, 6, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = closed ? C.yellow : C.white; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const ang = closed ? 0 : -0.62, L = SW_B - SW_A;
    ctx.beginPath(); ctx.moveTo(SW_A, COIL_T); ctx.lineTo(SW_A + L * Math.cos(ang), COIL_T + L * Math.sin(ang)); ctx.stroke();
    ctx.restore();
  }
  function drawLoad(ctx, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(LOAD_X, LOAD_T);
    const n = 6, h = (LOAD_B - LOAD_T - 20) / n;
    ctx.lineTo(LOAD_X, LOAD_T + 10);
    for (let k = 0; k < n; k++) ctx.lineTo(LOAD_X + (k % 2 ? -14 : 14), LOAD_T + 10 + (k + 0.5) * h);
    ctx.lineTo(LOAD_X, LOAD_B - 10); ctx.lineTo(LOAD_X, LOAD_B); ctx.stroke(); ctx.restore();
  }
  // 負載兩端的 ＋／−（Vₛ＞0：上端＋）
  function drawLoadPolarity(ctx, vs, alpha) {
    const a = alpha * clamp((Math.abs(vs) - 0.12) / 0.2, 0, 1); if (a < 0.05) return;
    const top = vs > 0 ? '+' : '−', bot = vs > 0 ? '−' : '+';
    [[LOAD_T + 8, top], [LOAD_B - 8, bot]].forEach(([y, s]) => {
      const col = s === '+' ? CHG_POS : C.electron, x = LOAD_X + 34;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.bg; ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, s, x, y - 1, col, 24, 'center', a);
    });
  }

  // ───────── 步驟資料 ─────────
  const STEPS = [
    { dur: 7, b: ['磁場來回', 'Field'], np: 5, ns: 5, secDim: true, ampP: 1, ampS: 0, graph: 'ip',
      cap: ['一次線圈接交流電 → Iₚ 來回改變，鐵芯裡的磁場 B 跟著同步來回', 'AC in the primary → Iₚ swings back and forth, and the core field B swings with it'],
      res: ['一次線圈接交流電，電流 Iₚ 的大小與方向不斷改變；<strong class="green">軟鐵芯容易被磁化</strong>，鐵芯裡的磁場 B 跟著 Iₚ 同步變大、變小、反向。', 'AC in the primary keeps changing the size and direction of Iₚ. The <strong class="green">soft-iron core is easily magnetized</strong>, so the field B in the core grows, shrinks, and reverses in step with Iₚ.'] },
    { dur: 7, b: ['感應電壓', 'Induction'], np: 5, ns: 5, ampP: 1, ampS: 1, graph: 'vs',
      cap: ['軟鐵芯把磁場引導進二次線圈 → 磁通量 Φ 改變 → 感應出電壓 Vₛ', 'The core guides B into the secondary → its flux Φ changes → a voltage Vₛ is induced'],
      res: ['磁場沿軟鐵芯進入二次線圈，二次線圈的磁通量 Φ 不斷改變而感應出交流電壓；Bᵢ 反抗 Φ 的變化（冷次定律）。Φ 最大時 Vₛ＝0、Φ 為 0 時 Vₛ 最大：錯開 ¼ 週期是變化率的關係，<strong class="yellow">不是磁場傳得慢</strong>。', 'B travels through the core into the secondary, whose changing flux Φ induces an AC voltage; Bᵢ opposes the change in Φ (Lenz’s law). When Φ is largest Vₛ = 0, and when Φ = 0 Vₛ is largest: the quarter-cycle offset comes from the rate of change, <strong class="yellow">not from a slow field</strong>.'] },
    { dur: 8, b: ['升壓', 'Step-up'], np: 5, ns: 8, ampP: 1, ampS: 0.625, blocks: true,
      cap: ['升壓：Nₛ＞Nₚ，每一匝感應的電壓相同，圈數多總電壓就大', 'Step-up: Nₛ > Nₚ; every turn gets the same voltage, so more turns add up to more'],
      res: ['匝數比＝8：5，輸出約 <strong class="cyan">176 V</strong>（升壓）；每一匝都感應 22 V，二次 8 匝串起來就比較大。功率近似守恆，升壓時二次電流變小。', 'Turns ratio = 8:5; output ≈ <strong class="cyan">176 V</strong> (step-up). Every turn gets 22 V, so 8 secondary turns add up to more. Power is about the same on both sides, so the secondary current is smaller.'] },
    { dur: 8, b: ['降壓', 'Step-down'], np: 8, ns: 4, ampP: 0.5, ampS: 1, blocks: true,
      cap: ['降壓：Nₛ＜Nₚ，二次電壓變小、電流變大', 'Step-down: Nₛ < Nₚ; the secondary voltage drops and its current grows'],
      res: ['匝數比＝4：8，輸出約 <strong class="cyan">55 V</strong>（降壓）；每一匝感應 13.75 V。功率近似守恆，降壓時二次電流變大。', 'Turns ratio = 4:8; output ≈ <strong class="cyan">55 V</strong> (step-down). Every turn gets 13.75 V. Power is about the same on both sides, so the secondary current is larger.'] },
    { dur: 9, b: ['直流電', 'DC'], np: 5, ns: 5, ampP: 1, ampS: 1, dc: true, graph: 'dc',
      cap: ['直流電：只有接通、切斷的瞬間 Φ 改變，二次側才有感應電壓', 'DC: only switching on or off changes Φ, so only then is a voltage induced'],
      res: ['直流電只在<strong class="pink">接通、切斷瞬間</strong>有磁場變化，二次側只出現短暫電壓；電流穩定後磁通量不變，Vₛ＝0，<strong class="pink">無法持續變壓</strong>。', 'DC changes the field only at <strong class="pink">switch-on and switch-off</strong>, so the secondary gets only brief pulses. Once the current is steady the flux stays constant and Vₛ = 0, so DC <strong class="pink">cannot be transformed continuously</strong>.'] }
  ];
  const starts = []; let TOTAL = 0; STEPS.forEach(s => { starts.push(TOTAL); TOTAL += s.dur; });
  const VP = 110;

  // ───────── 主圖 ─────────
  function drawMachine(ctx, st, tl, ph) {
    const secA = st.secDim ? 0.35 : 1;
    const gP = Math.PI, gS = 0;
    // 1 背後的線圈
    coilBack(ctx, LCX, st.np, gP, C.orange, 1);
    coilBack(ctx, RCX, st.ns, gS, C.cyan, secA);
    // 2 鐵芯＋磁場路徑＋B、Bᵢ
    drawCore(ctx);
    drawCorePath(ctx, 0.45);
    drawB(ctx, ph.phi, st.secDim ? RCX : RCX - 14);
    if (!st.secDim) drawBi(ctx, ph.vs, 1);
    // 3 前側線圈＋線圈內電流箭頭
    coilFront(ctx, LCX, st.np, gP, C.orange, 1);
    coilFront(ctx, RCX, st.ns, gS, C.cyan, secA);
    coilCurrentHeads(ctx, LCX, st.np, gP, ph.ip, 1);
    if (!st.secDim) coilCurrentHeads(ctx, RCX, st.ns, gS, -ph.vs, 1);
    // 4 外電路
    const pp = priPaths(st.dc), sp = secPaths();
    band(ctx, [pp.a, pp.b], st.ampP, ph.ip, 1);
    if (st.dc) {
      wire(ctx, [pp.a[0], pp.a[1], { x: SW_A, y: COIL_T }], 1); wire(ctx, [{ x: SW_B, y: COIL_T }, pp.a[2]], 1);
    } else wire(ctx, pp.a, 1);
    wire(ctx, pp.b, 1);
    flowPaths(ctx, pp, ph.qp, ph.ip, st.ampP, 1);
    if (st.dc) { drawBattery(ctx); drawSwitch(ctx, ph.closed); } else drawACSource(ctx);
    if (!st.secDim) band(ctx, [sp.a, sp.b], st.ampS, ph.vs, 1);
    wire(ctx, sp.a, secA); wire(ctx, sp.b, secA);
    if (!st.secDim) flowPaths(ctx, sp, ph.qs, ph.vs, st.ampS, 1);
    drawLoad(ctx, secA);
    if (!st.secDim) drawLoadPolarity(ctx, ph.vs, 1);
    // 5 標籤
    text(ctx, tr('一次線圈', 'Primary coil'), LCX, 84, C.orange, 22);
    text(ctx, tr('二次線圈', 'Secondary coil'), RCX, 84, C.cyan, 22, 'center', st.secDim ? 0.6 : 1);
    const wx = (CORE.x0 + CORE.x1) / 2, ww = CORE.x1 - CORE.x0 - 2 * CORE.th - 18;
    text(ctx, tr('B（鐵芯磁場）', 'B (core field)'), wx, 200, C.purple, 22);
    text(ctx, tr('軟鐵芯', 'Soft-iron core'), wx, 290, C.white, 22);
    para(ctx, tr('增強並引導磁場', 'Strengthens and guides B'), wx, 322, ww, C.muted, 20, 24, 'center');
    if (!st.secDim) text(ctx, 'Bᵢ', SX + 22, AXY, C.indPurple, 24);
    // 電源／電池標籤
    if (st.dc) {
      text(ctx, tr('電池', 'Battery'), 118, 342, C.white, 22);
      text(ctx, tr('開關', 'Switch'), (SW_A + SW_B) / 2, 166, ph.closed ? C.yellow : C.white, 22);
    } else {
      text(ctx, tr('交流電', 'AC'), 122, 285, C.white, 22);
      text(ctx, `${VP} V`, 122, 316, C.orange, 22);
    }
    text(ctx, 'Iₚ', 114, 426, C.current, 24);
    if (!st.secDim) text(ctx, 'Iₛ', 580, 176, C.current, 24);
    text(ctx, tr('電阻負載', 'Load R'), 600, 428, C.white, 22, 'center', secA);
    // 匝數與電壓（由匝數比算出）
    const vs = VP * st.ns / st.np, fmt = v => (Math.round(v * 100) / 100).toString();
    text(ctx, tr(`Nₚ＝${st.np} 匝`, `Nₚ = ${st.np} turns`), LCX, 514, C.orange, 22);
    text(ctx, tr(`Nₛ＝${st.ns} 匝`, `Nₛ = ${st.ns} turns`), RCX, 514, C.cyan, 22, 'center', st.secDim ? 0.6 : 1);
    if (st.dc) {
      text(ctx, tr('Vₚ：直流', 'Vₚ: DC'), LCX, 548, C.orange, 22);
      const pulse = Math.abs(ph.vs) > 0.12;
      text(ctx, pulse ? tr('Vₛ：瞬間脈衝', 'Vₛ: brief pulse') : tr('Vₛ＝0', 'Vₛ = 0'), RCX, 548, pulse ? C.yellow : C.cyan, 22);
    } else {
      text(ctx, tr(`Vₚ＝${VP} V`, `Vₚ = ${VP} V`), LCX, 548, C.orange, 22);
      if (!st.secDim) text(ctx, tr(`Vₛ＝${fmt(vs)} V`, `Vₛ = ${fmt(vs)} V`), RCX, 548, C.cyan, 22);
    }
  }

  // ───────── 右上：Φ 與 Iₚ／Vₛ 軌跡 ─────────
  const GX = 712, GW = 268, GT = 150, GB = 300, Y0 = 225, AMP = 60;
  function drawGraph(ctx, st, tl) {
    const dc = st.graph === 'dc';
    const span = dc ? st.dur : 2 * T_AC;
    const xOf = t => GX + GW * t / span;
    const fPhi = t => dc ? dcPhi(t) : Math.sin(OM * t);
    const f2 = st.graph === 'ip' ? (t => 0.75 * Math.sin(OM * t)) : dc ? dcVs : (t => -Math.cos(OM * t));
    const c2 = st.graph === 'ip' ? C.orange : C.cyan;
    // 圖例
    const n2 = st.graph === 'ip' ? 'Iₚ' : tr('Vₛ 二次電壓', 'Vₛ secondary');
    const lx = RX;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 5;
    ctx.strokeStyle = C.purple; ctx.beginPath(); ctx.moveTo(lx, 100); ctx.lineTo(lx + 24, 100); ctx.stroke(); ctx.restore();
    const n1 = tr('Φ 磁通量', 'Φ flux');
    text(ctx, n1, lx + 32, 100, C.purple, 22, 'left');
    ctx.save(); ctx.font = font(22); const w1 = ctx.measureText(n1).width; ctx.restore();
    const lx2 = lx + 32 + w1 + 26;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = c2; ctx.beginPath(); ctx.moveTo(lx2, 100); ctx.lineTo(lx2 + 24, 100); ctx.stroke(); ctx.restore();
    text(ctx, n2, lx2 + 32, 100, c2, 22, 'left');
    // 框、格線
    ctx.save(); ctx.strokeStyle = 'rgba(85,233,255,.14)'; ctx.lineWidth = 2;
    const nq = dc ? 9 : 8;
    for (let k = 1; k < nq; k++) { const x = GX + GW * k / nq; ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke(); }
    ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3; ctx.strokeRect(GX, GT, GW, GB - GT);
    ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(GX, Y0); ctx.lineTo(GX + GW, Y0); ctx.stroke();
    ctx.restore();
    text(ctx, '+', GX - 16, Y0 - AMP, C.white, 24); text(ctx, '0', GX - 16, Y0, C.white, 22); text(ctx, '−', GX - 16, Y0 + AMP, C.white, 24);
    // 橫軸標記
    if (dc) {
      text(ctx, tr('接通', 'On'), xOf(DC.t1), GB + 20, C.yellow, 20);
      text(ctx, tr('切斷', 'Off'), xOf(DC.t2), GB + 20, C.yellow, 20);
      ctx.save(); ctx.strokeStyle = 'rgba(255,243,106,.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      [DC.t1, DC.t2].forEach(t => { ctx.beginPath(); ctx.moveTo(xOf(t), GT); ctx.lineTo(xOf(t), GB); ctx.stroke(); }); ctx.restore();
    } else {
      text(ctx, '0', GX, GB + 20, C.muted, 20); text(ctx, 'T', xOf(T_AC), GB + 20, C.muted, 20); text(ctx, '2T', GX + GW - 6, GB + 20, C.muted, 20);
    }
    const tc = clamp(tl, 0, span);
    const curve = (f, t0, t1, col, w, dash) => {
      if (t1 <= t0) return;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); const n = Math.max(2, Math.ceil((t1 - t0) / 0.02));
      for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, x = xOf(t), y = Y0 - clamp(f(t), -1.15, 1.15) * AMP; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    };
    if (!dc) { curve(fPhi, 0, span, 'rgba(221,140,255,.35)', 2.5, [4, 7]); curve(f2, 0, span, st.graph === 'ip' ? 'rgba(255,179,71,.35)' : 'rgba(85,233,255,.35)', 2.5, [4, 7]); }
    // 第 2 步：Φ 最大處導引線（Vₛ＝0）與 ¼T 錯開
    if (st.graph === 'vs') {
      [0.25, 0.75, 1.25, 1.75].forEach(k => {
        const t = k * T_AC; if (tc < t) return;
        const x = xOf(t);
        ctx.save(); ctx.strokeStyle = 'rgba(255,243,106,.75)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(x, GT + 4); ctx.lineTo(x, GB - 4); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(x, Y0, 6, 0, TAU); ctx.fill(); ctx.restore();
      });
      if (tc >= 0.5 * T_AC) {
        const xa = xOf(0.25 * T_AC), xb = xOf(0.5 * T_AC), y = GT - 8;
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(xa, y + 7); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y + 7); ctx.stroke(); ctx.restore();
        text(ctx, '¼T', (xa + xb) / 2, y - 16, C.yellow, 20);
      }
    }
    curve(fPhi, 0, tc, C.purple, 5);
    curve(f2, 0, tc, c2, 5);
    // 移動標記
    const x = xOf(tc);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke(); ctx.restore();
    [[fPhi(tc), C.purple], [f2(tc), c2]].forEach(([v, col]) => {
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = C.bg; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, Y0 - clamp(v, -1.15, 1.15) * AMP, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    });
  }

  // 右欄狀態列（圖的下方）
  function drawStatus(ctx, st, tl, ph) {
    let y = 362; const x = RX;
    const row = (s, col, size) => { y += para(ctx, s, x, y, RW, col, size || 22, size === 20 ? 25 : 28, 'left') + 8; };
    if (st.graph === 'ip') {
      row(tr('Iₚ 與 B 同步變大、變小、反向', 'Iₚ and B move together: they grow, shrink, and reverse together'), C.white);
      const growing = ph.phi * ph.dphi > 0;
      row(growing ? tr('現在：B 增強中', 'Now: B is getting stronger') : tr('現在：B 減弱中', 'Now: B is getting weaker'), C.purple);
    } else if (st.graph === 'vs') {
      const s = Math.abs(ph.phi);
      if (s > 0.92) row(tr('Φ 最大 → Vₛ＝0', 'Φ largest → Vₛ = 0'), C.yellow);
      else if (s < 0.3) row(tr('Φ＝0 → |Vₛ| 最大', 'Φ = 0 → |Vₛ| largest'), C.cyan);
      else row(tr('Φ 與 Vₛ 錯開 ¼ 週期', 'Φ and Vₛ are ¼ cycle apart'), C.muted);
      const inc = ph.phi * ph.dphi > 0;
      row(inc ? tr('B 增強 → Bᵢ 與 B 反向', 'B growing → Bᵢ opposes B') : tr('B 減弱 → Bᵢ 與 B 同向', 'B fading → Bᵢ along B'), C.indPurple);
      row(tr('不是磁場傳得慢，是變化率的關係', 'Not a slow field: it is the rate of change'), C.muted, 20);
    } else if (st.graph === 'dc') {
      let s, col;
      if (tl < DC.t1) { s = tr('開關打開：沒有電流，Φ＝0、Vₛ＝0', 'Switch open: no current, Φ = 0, Vₛ = 0'); col = C.white; }
      else if (tl < DC.t1 + 1.2) { s = tr('接通瞬間：Φ 增加 → 短暫感應（Bᵢ 與 B 反向）', 'Switch on: Φ rises → a brief pulse (Bᵢ opposes B)'); col = C.yellow; }
      else if (tl < DC.t2) { s = tr('電流穩定：Φ 不變 → Vₛ＝0', 'Steady current: Φ constant → Vₛ = 0'); col = C.cyan; }
      else if (tl < DC.t2 + 1.2) { s = tr('切斷瞬間：Φ 減少 → 反向的短暫電壓（Bᵢ 與 B 同向）', 'Switch off: Φ falls → a reversed pulse (Bᵢ along B)'); col = C.yellow; }
      else { s = tr('直流電無法持續變壓', 'DC cannot be transformed continuously'); col = C.pink; }
      row(s, col);
      row(tr('只有 Φ 改變，才有感應電壓', 'Only a changing Φ induces a voltage'), C.muted, 20);
    }
  }

  // 右欄：每匝電壓方塊（第 3、4 步）
  function drawBlocks(ctx, st, ph) {
    const per = VP / st.np, vs = VP * st.ns / st.np, fmt = v => (Math.round(v * 100) / 100).toString();
    para(ctx, tr('每一匝感應的電壓都一樣', 'Same voltage in every turn'), RX + RW / 2, 96, RW, C.white, 22, 26, 'center');
    const glow = 0.25 + 0.55 * Math.abs(ph.vs);
    const bh = 28, gap = 3, bottom = 384, bw = 112;
    [[RX + 70, st.np, C.orange, tr(`一次 ${st.np} 匝`, `Primary ${st.np}`), VP], [RX + RW - 70, st.ns, C.cyan, tr(`二次 ${st.ns} 匝`, `Secondary ${st.ns}`), vs]].forEach(([cx, n, col, name, tot]) => {
      for (let k = 0; k < n; k++) {
        const y = bottom - (k + 1) * (bh + gap);
        ctx.save(); ctx.globalAlpha = glow; ctx.fillStyle = col; rrect(ctx, cx - bw / 2, y, bw, bh, 6); ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; rrect(ctx, cx - bw / 2, y, bw, bh, 6); ctx.stroke(); ctx.restore();
        text(ctx, `${fmt(per)} V`, cx, y + bh / 2 + 1, C.white, 20);
      }
      text(ctx, name, cx, bottom + 22, col, 22);
      text(ctx, tr(`＝${fmt(tot)} V`, `= ${fmt(tot)} V`), cx, bottom + 50, col, 22);
    });
    // 功率近似守恆
    let y = 474;
    y += para(ctx, 'Vₚ·Iₚ ≈ Vₛ·Iₛ', RX + RW / 2, y, RW, C.white, 22, 28, 'center') + 4;
    const s = st.ns > st.np ? tr('升壓 → Iₛ 變小（約 5/8 倍 Iₚ）', 'Step-up → Iₛ smaller (about 5/8 of Iₚ)') : tr('降壓 → Iₛ 變大（約 2 倍 Iₚ）', 'Step-down → Iₛ larger (about 2 × Iₚ)');
    para(ctx, s, RX + RW / 2, y, RW, C.current, 22, 28, 'center');
  }

  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 950, 24);
    lines(ctx, ls, W / 2, ls.length > 1 ? 24 : 36, C.yellow, 24, 28, 'center');
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const SC_ID = 'transformer';
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  let lastResult = '';
  const cv = () => document.getElementById('transformerCanvas');
  function stepAt(t) { let i = 0; while (i + 1 < starts.length && t >= starts[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('transformerResult'); if (el) el.innerHTML = html;
  }
  function drawProgress(ctx, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = C.bg; starts.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }
  function render() {
    const c = cv(); if (!c || !S.scene) return;
    const i = stepAt(S.t), st = STEPS[i], tl = S.t - starts[i];
    const ctx = c.getContext('2d'), k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const ph = physics(st, tl);
    drawMachine(ctx, st, tl, ph);
    if (st.blocks) drawBlocks(ctx, st, ph);
    else { drawGraph(ctx, st, tl); drawStatus(ctx, st, tl, ph); }
    if (!st.dc) para(ctx, tr('真實市電 60 Hz，這裡放慢', 'Real mains is 60 Hz; slowed down here'), W - 12, 582, 560, C.muted, 20, 24, 'right');
    const f = clamp(1 - tl / 0.35, 0, 1);
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-trans');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.scene) return;
    S.t = starts[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-trans'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  let stepStop = true;
  function visible() { const c = cv(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    // 老師講解的暫停：EmiAnim.ctl.paused 為真時時間凍住（畫面是 t 的純函式，所以畫面也凍住）
    if (S.last && !(window.EmiAnim.ctl && window.EmiAnim.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    // AGENTS 10.6（2026-11-05）：學生模式一次只播一個步驟，播完停在該步最後一幀（不循環、不自動接下一步）。
    // setStepStop(false)＝步驟間不停、連播到底再停住（老師講解用；本頁未做老師模式）。
    {
      // 以「上一幀正在播的步驟」為準；剛跳步或重畫（S.step＝-1）時才由 t 推算
      let kk = S.step >= 0 ? S.step : 0;
      if (S.step < 0) while (kk + 1 < starts.length && S.t >= starts[kk + 1]) kk++;
      const end = stepStop ? (starts[kk + 1] !== undefined ? starts[kk + 1] : TOTAL) : TOTAL;
      if (S.t >= end) {
        S.t = end - 1e-3; render();
        // 老師講解（stepStop＝false）連播到整段結尾：通知一次，讓外層接力下一個場景或標示播完
        const ctl = window.EmiAnim.ctl;
        if (!stepStop && !S.ended && ctl && typeof ctl.onEnd === 'function') { S.ended = true; ctl.onEnd(); }
        return;
      }
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.scene) start(); });

  window.EmiAnim.trans = {
    activate(sceneId) {
      void sceneId;
      stop();
      S.scene = SC_ID; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.scene = null; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-trans'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      lastResult = ''; S.step = -1;
      buildButtons(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.scene) start(); },
    _frameAt(sceneId, t) { void sceneId; stop(); S.scene = SC_ID; S.t = t; render(); return TOTAL; },
    _info() { return { transformer: { total: TOTAL, starts: starts.slice() } }; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
