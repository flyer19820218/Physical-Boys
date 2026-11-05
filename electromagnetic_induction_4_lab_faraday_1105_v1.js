/* electromagnetic_induction_4_lab_faraday_1105_v1.js — 「🔬 動手做：自己推拉磁鐵」法拉第實驗台（#faradayLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.faraday = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、label（直接呼叫，不複製）。其餘小工具在本檔內。
 * 控制鈕由本檔建立在 #faradayLabControls，說明字寫進 #faradayLabResult（只有文字改變時才寫）。
 *
 * ── 互動 ──────────────────────────────────────────────
 *   水平拖曳（畫布任何位置，Pointer Events）：磁鐵沿中心軸左右移動，範圍「很遠」FAR ～「貼住線圈近端」NEAR，不穿過線圈。
 *     拖得越快電流越大；停住，電流平滑地回到 0。方向鍵 ←／→ 也可以推拉（每按一下 40 px）。
 *   按鈕：①磁極朝線圈 N／S（磁鐵左右翻面，N、S 色塊對調） ②線圈匝數 4／8／16（畫面上的圈數跟著變）
 *         ③磁鐵強度 弱／強（×1／×2；磁力線 7 條／13 條） ④模式 自己拉／自動來回（磁鐵自己正弦往返；一拖就切回自己拉）
 *   怎麼玩提示（24px）在第一次拖曳或按方向鍵後淡出。
 *
 * ── 公式與簡化 ─────────────────────────────────────────
 *   d ＝ 線圈近端 x0 − 磁鐵近端 face（30 ～ 287 px）。f(d) ＝ 1 / (1 + (d/a)²)^1.5，a ＝ 150 px（磁偶極軸上場的形狀）。
 *   Φx ＝ 極性 pol（N 朝線圈 ＋1、S 朝線圈 −1）× 強度 str（1／2）× f(d)；Φx 以 +x（磁鐵 → 線圈）為正。
 *   感應電動勢 ε ＝ −N·dΦx/dt（以繞 +x 的右手方向為正）。本檔定義「I > 0」＝ 安培計向右 ＝ 從磁鐵這側看逆時針，
 *     這正是 ε 的反方向，所以 I ＝ K·(N/8)·dΦx/dt（相對值，K ＝ 0.6）。
 *   dΦx/dt ＝ pol·str·f′(d)·dd/dt ＝ pol·str·(−f′(d))·v，v ＝ 磁鐵速度（靠近線圈為正）。
 *   v 由「每幀磁鐵位移 / 時間」算出，再做一階低通（τ ＝ 0.07 s）避免抖動；停住時 v → 0，I 跟著平滑回 0。
 *   安培計：指針目標角 ＝ 1.25·tanh(I/1.6)（有上限），以阻尼彈簧（ω ＝ 16 rad/s、ζ ＝ 0.75）追上去。
 *   不模擬線圈電阻、自感與磁鐵受力；「翻面換極」視為換一塊磁鐵，不計翻面瞬間的通量變化。
 *   穿過線圈的磁力線：第 i 條（i ＝ −n…n）在線圈近端離軸 i·s(d)，s ＝ R /((n+0.5)·f(d)/f(dmin))，所以穿過的條數隨 f(d) 遞減。
 *
 * ── 方向表（磁鐵在左、線圈在右；與本課動畫 electromagnetic_induction_4_faraday_1105_v1.js 檔頭相同）──
 *   情況     穿過線圈的 B  通量變化  Bᵢ（線圈內）  近端極性  從磁鐵側看電流  線圈前側導線  安培計
 *   N 靠近   →（+x）       增加      ←（反抗）      N         逆時針          向上          向右
 *   N 遠離   →（+x）       減少      →              S         順時針          向下          向左
 *   S 靠近   ←（−x）       增加      →（反抗）      S         順時針          向下          向左
 *   S 遠離   ←（−x）       減少      ←              N         逆時針          向上          向右
 *   靜止 → I ＝ 0（不論磁鐵多近、磁場多強）。
 *   推導：I > 0 ⇔ Bᵢ 指 −x ⇔ 近端 N ⇔ 從磁鐵側看逆時針 ⇔ 電流從線圈左端流出，沿左引線往下、由左往右通過安培計 ⇔ 指針向右。
 *   線圈螺旋 θ：y ＝ AX − R cosθ、z ＝ R sinθ（z 朝螢幕外，sinθ > 0 為前側），I > 0 時電流沿 θ 減少方向 ⇒ 前側導線向上。
 *   畫面（安培計、近端色塊、Bᵢ 紫箭頭、線圈與引線上的紅色電流記號、左下「從磁鐵這側看」小圖）、畫布頂端字、說明框都由同一個 I 決定。
 *
 * 字級：畫布文字 22–34px（頂端說明 24、標籤 22、數值 26、磁極 34），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const AX = 250;                                  // 中心軸 y
  const X0 = 505, CL = 240, CR = 85, KZ = 0.28;     // 線圈近端 x、長、半徑、斜視係數
  const MW = 200, MH = 84;                          // 磁鐵
  const FAR = 218, NEAR = X0 - 30;                  // 磁鐵近端 face 的範圍
  const A_F = 150;                                  // f(d) 的長度尺度
  const MY = 490, MRAD = 56, MX = X0 + CL / 2;      // 安培計
  const PX = 790, PW = 196;                         // 右側讀數欄
  const KI = 0.6;
  const COPPER = '#d08a4a', COPPER_BACK = '#7a4e2c', WIRE = '#9fb3aa';
  const PANEL = 'rgba(12,30,25,0.92)';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = s => `900 ${s}px ${FONT}`;

  // ───────── 物理 ─────────
  const fd = d => Math.pow(1 + (d / A_F) * (d / A_F), -1.5);
  const dfd = d => { const u = d / A_F; return -3 * u / A_F * Math.pow(1 + u * u, -2.5); };   // f′(d)
  const F_MAX = fd(X0 - NEAR);
  const needleTarget = I => 1.25 * Math.tanh(I / 1.6);

  // ───────── 狀態 ─────────
  const S = {
    pol: 1, turns: 8, str: 1, mode: 'manual',
    face: NEAR - 120, target: NEAR - 120, prevFace: NEAR - 120, tau: 0.03,
    v: 0, I: 0, ang: 0, angV: 0,
    flowCoil: 0, flowLead: 0, fieldPh: 0, t: 0, autoT: 0,
    flip: 1, flipT: -9,                              // 翻面動畫（scaleX）
    hintA: 1, dragged: false,
    motion: 'idle', stillT: 0, moved: false, over: null, overT: -99,
    raf: 0, last: 0, on: false, visible: true, timer: 0, actions: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null, lastRes = '';

  // ───────── 文字工具 ─────────
  function textW(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function wrap(s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : Array.from(s), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = latin ? u : u.trimStart(); } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // 有深色外框的箭頭
  function arr(x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2 || alpha <= 0.01) return;
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

  // ───────── 線圈 ─────────
  function helixPt(N, th) {
    const frac = (th - Math.PI) / (TAU * N);
    return { x: X0 + CL * frac + KZ * CR * Math.sin(th), y: AX - CR * Math.cos(th) };
  }
  function drawCoilHalf(N, front) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const steps = 48 * N, thick = N > 10 ? 6 : 8;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath(); let on = false;
      for (let j = 0; j <= steps; j++) {
        const th = Math.PI + TAU * N * j / steps, s = Math.sin(th), p = helixPt(N, th);
        if (front ? s >= -0.02 : s <= 0.02) { if (!on) { ctx.moveTo(p.x, p.y); on = true; } else ctx.lineTo(p.x, p.y); }
        else on = false;
      }
      if (front) { ctx.strokeStyle = pass ? '#ffd29a' : COPPER; ctx.lineWidth = pass ? 2.2 : thick + 1; }
      else { ctx.strokeStyle = COPPER_BACK; ctx.lineWidth = thick; if (pass) break; }
      ctx.stroke();
    }
    ctx.restore();
  }
  // 沿線圈流動的紅色電流記號：每匝兩個（相隔半圈），位置隨 flowCoil 移動；I>0 沿 θ 減少方向
  function drawCoilCurrent(N, I, a, front) {
    if (a < 0.04) return;
    const sgn = I > 0 ? -1 : 1, every = N > 10 ? 2 : 1, hl = N > 10 ? 11 : 14;
    const ph = ((S.flowCoil % TAU) + TAU) % TAU;
    for (let n = 0; n < N; n += every) {
      for (const off of [0, Math.PI]) {
        const th = Math.PI + TAU * n + ph + off;
        if (th > Math.PI + TAU * N - 0.3 || th < Math.PI + 0.3) continue;
        const s = Math.sin(th);
        if (front ? s < 0.25 : s > -0.25) continue;
        const p = helixPt(N, th);
        let dx = CL / (TAU * N) + KZ * CR * Math.cos(th), dy = CR * Math.sin(th);
        const L = Math.hypot(dx, dy); dx = dx / L * sgn; dy = dy / L * sgn;
        const vis = clamp((Math.abs(s) - 0.25) / 0.35, 0, 1);
        arr(p.x - dx * hl, p.y - dy * hl, p.x + dx * hl, p.y + dy * hl, C.current, front ? 5 : 4, 13, a * vis * (front ? 1 : 0.5));
      }
    }
  }
  // 引線：線圈左端 → 安培計左；安培計右 → 線圈右端
  const LEAD_A = [[X0, AX + CR], [X0, MY], [MX - MRAD, MY]];
  const LEAD_B = [[MX + MRAD, MY], [X0 + CL, MY], [X0 + CL, AX + CR]];
  function drawLeads() {
    ctx.save(); ctx.strokeStyle = WIRE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [LEAD_A, LEAD_B].forEach(p => { ctx.beginPath(); p.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
    ctx.restore();
  }
  function polyLen(p) { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); return L; }
  function polyAt(p, s) {
    for (let k = 1; k < p.length; k++) {
      const l = Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
      if (s <= l || k === p.length - 1) { const u = clamp(s / l, 0, 1); return { x: lerp(p[k - 1][0], p[k][0], u), y: lerp(p[k - 1][1], p[k][1], u), dx: (p[k][0] - p[k - 1][0]) / l, dy: (p[k][1] - p[k - 1][1]) / l }; }
      s -= l;
    }
  }
  // I>0：左引線往下 → 經安培計往右 → 右引線往上
  function drawLeadFlow(I, a) {
    if (a < 0.04) return;
    const sgn = I > 0 ? 1 : -1, gap = 46;
    [LEAD_A, LEAD_B].forEach(p => {
      const L = polyLen(p);
      for (let s = ((S.flowLead % gap) + gap) % gap; s < L; s += gap) {
        if (s < 14 || s > L - 14) continue;
        const q = polyAt(p, s);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.dy * sgn, q.dx * sgn));
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath();
        ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
      }
    });
  }

  // ───────── 磁鐵與磁力線 ─────────
  function drawMagnet() {
    const x = S.face - MW, y = AX - MH / 2, cx = S.face - MW / 2;
    // 翻面動畫：scaleX 由 1 → 0 → 1，過一半時顏色已換成新的極性
    const k = clamp((S.t - S.flipT) / 0.4, 0, 1), sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * k)));
    const pol = k < 0.5 ? -S.pol : S.pol;
    const near = pol > 0 ? 'N' : 'S', far = pol > 0 ? 'S' : 'N', col = p => p === 'N' ? C.poleN : C.poleS;
    ctx.save(); ctx.translate(cx, 0); ctx.scale(sx, 1); ctx.translate(-cx, 0);
    ctx.fillStyle = col(far); rrect(x, y, MW / 2 + 6, MH, 10); ctx.fill();
    ctx.fillStyle = col(near); rrect(x + MW / 2, y, MW / 2, MH, 10); ctx.fill();
    ctx.fillRect(x + MW / 2, y, 12, MH);
    ctx.strokeStyle = S.str > 1 ? C.yellow : 'rgba(255,255,255,.55)'; ctx.lineWidth = S.str > 1 ? 5 : 3; rrect(x, y, MW, MH, 10); ctx.stroke();
    ctx.restore();
    if (sx > 0.5) {
      text(far, cx - MW / 4 * sx, AX, C.white, 34);
      text(near, cx + MW / 4 * sx, AX, C.white, 34);
    }
  }
  function fieldGeom() {
    const n = S.str > 1 ? 6 : 3, sp = S.str > 1 ? 6.5 : 12;
    const fn = fd(X0 - S.face) / F_MAX;
    const s = CR / ((n + 0.5) * Math.max(0.02, fn));
    return { n, sp, s };
  }
  function countThrough() { const g = fieldGeom(); let c = 0; for (let i = -g.n; i <= g.n; i++) if (Math.abs(i * g.s) < CR) c++; return c; }
  function drawFieldLines(inside) {
    const g = fieldGeom(), dir = S.pol;            // N 朝線圈：磁力線離開磁鐵（+x）
    for (let i = -g.n; i <= g.n; i++) {
      const y0 = AX + i * g.sp, ye = i * g.s, isIn = Math.abs(ye) < CR;
      if (isIn !== inside) continue;
      const shimmer = 0.82 + 0.18 * Math.sin(S.fieldPh * 2.1 + i * 1.3);
      ctx.save(); ctx.lineCap = 'round';
      if (isIn) {
        const xout = X0 + CL + 16, yout = AX + ye * 0.82;
        ctx.globalAlpha = shimmer; ctx.strokeStyle = C.green; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(S.face, y0); ctx.lineTo(X0, AX + ye);
        ctx.quadraticCurveTo(X0 + CL * 0.5, AX + ye * 0.95, xout, yout); ctx.stroke(); ctx.restore();
        // 沿線緩慢移動的小箭頭（閒置時的動態；方向＝磁場方向）
        const u = ((S.fieldPh * 0.09 * dir + i * 0.137) % 1 + 1) % 1;
        const ax = lerp(S.face + 12, X0 - 8, u), ay = lerp(y0, AX + ye, (ax - S.face) / Math.max(1, X0 - S.face));
        const ang = Math.atan2(AX + ye - y0, X0 - S.face) + (dir > 0 ? 0 : Math.PI);
        if (X0 - S.face > 50) arr(ax - Math.cos(ang) * 8, ay - Math.sin(ang) * 8, ax + Math.cos(ang) * 8, ay + Math.sin(ang) * 8, C.green, 3, 12, shimmer, false);
        if (dir > 0) arr(xout - 18, yout, xout + 6, yout, C.green, 3.2, 13, shimmer, false);
        else arr(xout + 6, yout, xout - 18, yout, C.green, 3.2, 13, shimmer, false);
      } else {
        let ang = Math.atan2(ye - i * g.sp, X0 - S.face);
        ang = clamp(ang, -0.8, 0.8);
        const len = clamp(X0 - S.face - 10, 60, 165) * (1 - 0.06 * Math.abs(i));
        const x1 = S.face + len * Math.cos(ang), y1 = y0 + len * Math.sin(ang);
        const gr = ctx.createLinearGradient(S.face, y0, x1, y1);
        gr.addColorStop(0, 'rgba(154,240,111,.6)'); gr.addColorStop(1, 'rgba(154,240,111,0)');
        ctx.globalAlpha = shimmer; ctx.strokeStyle = gr; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(S.face, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
      }
    }
  }

  // ───────── 安培計 ─────────
  function drawMeter(I) {
    const ang = S.ang;
    ctx.save();
    ctx.fillStyle = '#16302a'; ctx.beginPath(); ctx.arc(MX, MY, MRAD, 0, TAU); ctx.fill();
    ctx.strokeStyle = Math.abs(I) > 0.06 ? C.current : C.muted; ctx.lineWidth = 6; ctx.stroke();
    ctx.translate(MX, MY + 24);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 54, -Math.PI / 2 - 1.25, -Math.PI / 2 + 1.25); ctx.stroke();
    for (let k = -4; k <= 4; k++) {
      const q = -Math.PI / 2 + k * 0.3; ctx.lineWidth = k === 0 ? 4 : 2; ctx.strokeStyle = k === 0 ? C.white : C.muted;
      ctx.beginPath(); ctx.moveTo(Math.cos(q) * 48, Math.sin(q) * 48); ctx.lineTo(Math.cos(q) * 60, Math.sin(q) * 60); ctx.stroke();
    }
    ctx.rotate(ang);
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -58); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.restore();
    text('A', MX, MY + 34, C.white, 22);
    if (Math.abs(I) < 0.06) {                       // 閒置：外圈呼吸光暈，提示「指針停在 0」
      ctx.save(); ctx.globalAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(S.t * 3.2));
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -S.t * 30;
      ctx.beginPath(); ctx.arc(MX, MY, MRAD + 11, 0, TAU); ctx.stroke(); ctx.restore();
    }
    const lx = X0 + CL + 22;
    text(tr('安培計 A', 'Ammeter A'), lx, MY - 16, C.white, 22, 'left');
    const side = meterSide();
    text(side === 'right' ? tr('指針向右 →', 'Needle right →') : side === 'left' ? tr('← 指針向左', '← Needle left') : 'I＝0',
      lx, MY + 18, side ? C.current : C.muted, 22, 'left');
  }
  const meterSide = () => S.ang > 0.05 ? 'right' : S.ang < -0.05 ? 'left' : null;

  // 近端磁極色塊（Bᵢ 決定）
  function drawNearPole(I, a) {
    text(tr('線圈近端', 'Near end'), X0, 92, C.white, 22, 'center');
    if (a < 0.04) {
      ctx.save(); ctx.globalAlpha = 0.6; ctx.setLineDash([6, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
      rrect(X0 - 20, 112, 40, 40, 8); ctx.stroke(); ctx.restore(); return;
    }
    const n = I > 0;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = n ? C.poleN : C.poleS; rrect(X0 - 20, 112, 40, 40, 8); ctx.fill(); ctx.restore();
    text(n ? 'N' : 'S', X0, 132, C.white, 28, 'center', a);
  }
  // 感應磁場 Bᵢ（線圈內，紫）：I>0 → 指 −x
  function drawBi(I, a) {
    if (a < 0.04) return;
    const y = AX + 44, cx = X0 + CL / 2, s = I > 0 ? -1 : 1, L = 40 + 55 * a;
    arr(cx - L * s, y, cx + L * s, y, C.indPurple, 9, 26, Math.min(1, a * 1.3));
  }

  // ───────── 右側讀數 ─────────
  function bar(y, val, max, color) {
    const x = PX, w = PW, h = 22, mid = x + w / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; rrect(x, y - h / 2, w, h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(184,201,193,0.5)'; ctx.lineWidth = 2; rrect(x, y - h / 2, w, h, 6); ctx.stroke();
    const k = clamp(val / max, -1, 1), bw = k * (w / 2 - 3);
    if (Math.abs(bw) > 0.5) { ctx.fillStyle = color; ctx.fillRect(Math.min(mid, mid + bw), y - h / 2 + 3, Math.abs(bw), h - 6); }
    ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mid, y - h / 2 - 4); ctx.lineTo(mid, y + h / 2 + 4); ctx.stroke();
    ctx.restore();
  }
  const fmt = v => (v >= 0.05 ? '+' : v <= -0.05 ? '−' : '') + Math.abs(v).toFixed(1);
  function drawReadouts() {
    const phi = S.pol * S.str * fd(X0 - S.face);
    text(tr('磁通量 Φ', 'Flux Φ'), PX, 104, C.green, 22, 'left');
    text(fmt(phi), PX + PW, 104, C.green, 22, 'right');
    bar(136, phi, 2 * F_MAX, C.green);
    const vr = S.v / 300;
    text(tr('磁鐵速度', 'Magnet speed'), PX, 190, C.white, 22, 'left');
    bar(222, vr, 4, C.white);
    const vs = Math.abs(S.v) < 15 ? tr('靜止', 'still') : S.v > 0 ? tr('→ 靠近', '→ toward') : tr('← 遠離', '← away');
    text(vs, PX, 256, C.muted, 22, 'left');
    text(fmt(vr), PX + PW, 256, C.white, 22, 'right');
    text(tr('電流 I', 'Current I'), PX, 306, C.current, 22, 'left');
    text(fmt(S.I), PX + PW, 306, C.current, 26, 'right');
    bar(338, S.I, 4, C.current);
    text(tr('（相對值）', '(relative)'), PX + PW / 2, 372, C.muted, 22, 'center');
  }

  // ───────── 左下：圖例＋從磁鐵這側看 ─────────
  function drawLegend(I, a) {
    text(tr('綠線＝磁力線', 'Green = field lines'), 20, 420, C.green, 22, 'left');
    text(tr('紫箭頭＝感應磁場 Bᵢ', 'Purple = induced field Bᵢ'), 20, 452, C.indPurple, 22, 'left');
    const cx = 58, cy = 528, r = 32;
    ctx.save(); ctx.strokeStyle = COPPER; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.restore();
    const lx = 106;
    text(tr('從磁鐵這側看線圈', 'Coil seen from the magnet'), lx, 510, C.white, 22, 'left');
    if (a < 0.04) { text('I＝0', lx, 544, C.muted, 22, 'left'); return; }
    const ccw = I > 0, a0 = S.flowCoil * 0.6, span = 4.2;   // 隨電流轉動的弧（I>0 時 flowCoil 遞減＝畫面上逆時針轉）
    const aEnd = ccw ? a0 - span : a0 + span;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.current; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, aEnd, ccw); ctx.stroke(); ctx.restore();
    const ex = cx + r * Math.cos(aEnd), ey = cy + r * Math.sin(aEnd);
    const tx = ccw ? Math.sin(aEnd) : -Math.sin(aEnd), ty = ccw ? -Math.cos(aEnd) : Math.cos(aEnd);
    arr(ex - tx * 14, ey - ty * 14, ex + tx * 6, ey + ty * 6, C.current, 5, 16, a);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.indPurple; ctx.fillStyle = C.indPurple; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, TAU); ctx.stroke();
    if (ccw) { ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke(); }
    ctx.restore();
    text(ccw ? tr('逆時針 ↺', 'counterclockwise ↺') : tr('順時針 ↻', 'clockwise ↻'), lx, 544, C.current, 22, 'left', Math.max(0.5, a));
  }

  // ───────── 訊息（畫布頂端＋說明框，同一個狀態） ─────────
  function msgKey() {
    if (S.motion !== 'idle' && S.motion !== 'stopped') return S.motion;
    if (S.over && S.t - S.overT < 4.5) return S.over;
    return S.motion;
  }
  function caption() {
    const k = msgKey(), A = Math.abs(S.I);
    if (/^[NS](In|Out)$/.test(k) && A < 0.1 && X0 - S.face > 200) return tr('磁鐵離線圈太遠：磁通量幾乎不變，電流很小', 'Too far from the coil: the flux hardly changes, so the current is tiny');
    switch (k) {
      case 'NIn': return tr('N 極靠近：感應磁場反抗，近端成 N 極，安培計向右', 'N approaches: Bᵢ opposes, near end becomes N, needle swings right');
      case 'NOut': return tr('N 極遠離：近端成 S 極，安培計向左', 'N leaves: near end becomes S, needle swings left');
      case 'SIn': return tr('S 極靠近：方向反過來，近端成 S 極，安培計向左', 'S approaches: reversed, near end becomes S, needle swings left');
      case 'SOut': return tr('S 極遠離：近端成 N 極，安培計向右', 'S leaves: near end becomes N, needle swings right');
      case 'stopped': return tr('停下來，電流回到 0——磁場強不等於有電流', 'Stop, and the current returns to 0 — a strong field is not a current');
      case 'pole': return S.pol > 0 ? tr('N 極朝線圈：靠近向右、遠離向左', 'N toward the coil: approach → right, leave → left')
        : tr('換成 S 極：方向反過來——靠近向左、遠離向右', 'Switched to S: directions reverse — approach → left, leave → right');
      case 'turns': return S.turns === 16 ? tr('線圈 16 匝：匝數越多，電流越大', '16 turns: more turns, larger current')
        : S.turns === 4 ? tr('線圈 4 匝：匝數少，電流變小', '4 turns: fewer turns, smaller current')
          : tr('線圈 8 匝：匝數越多，電流越大', '8 turns: more turns, larger current');
      case 'str': return S.str > 1 ? tr('強磁鐵（×2）：磁通量加倍，電流也加倍', 'Strong magnet (×2): double the flux, double the current')
        : tr('弱磁鐵（×1）：磁通量較小，電流較小', 'Weak magnet (×1): less flux, smaller current');
      case 'auto': return tr('自動來回：磁鐵自己來回，指針左右擺', 'Auto: the magnet moves back and forth, the needle swings both ways');
      case 'manual': return tr('自己拉：換你拖曳磁鐵', 'By hand: your turn to drag the magnet');
      default: return tr('拖曳磁鐵靠近、遠離線圈，看安培計怎麼動', 'Drag the magnet toward or away from the coil and watch the ammeter');
    }
  }
  function captionColor() {
    const k = msgKey();
    if (/^[NS](In|Out)$/.test(k)) return Math.abs(S.I) < 0.1 && X0 - S.face > 200 ? C.muted : C.yellow;
    return k === 'stopped' ? C.cyan : C.yellow;
  }
  function setupLine() {
    return tr(`目前：<strong class="${S.pol > 0 ? 'red' : 'cyan'}">${S.pol > 0 ? 'N' : 'S'} 極</strong>朝線圈｜線圈 <strong class="yellow">${S.turns} 匝</strong>｜${S.str > 1 ? '強磁鐵 ×2' : '弱磁鐵 ×1'}｜${S.mode === 'auto' ? '自動來回' : '自己拉'}`,
      `Now: <strong class="${S.pol > 0 ? 'red' : 'cyan'}">${S.pol > 0 ? 'N' : 'S'} pole</strong> toward the coil | <strong class="yellow">${S.turns} turns</strong> | ${S.str > 1 ? 'strong magnet ×2' : 'weak magnet ×1'} | ${S.mode === 'auto' ? 'auto' : 'by hand'}`);
  }
  function resultHTML() {
    const k = msgKey();
    let main;
    switch (k) {
      case 'NIn': main = tr('<strong class="red">N 極靠近</strong>：穿過線圈的磁力線變多，感應磁場 Bᵢ <strong class="pink">反抗</strong>這個增加——線圈近端變成 <strong class="red">N 極</strong>；從磁鐵這側看電流<strong class="yellow">逆時針</strong>，安培計<strong class="yellow">向右</strong>。',
        '<strong class="red">N pole approaches</strong>: more field lines pass through the coil; the induced field Bᵢ <strong class="pink">opposes</strong> the increase — the near end becomes <strong class="red">N</strong>. Seen from the magnet the current is <strong class="yellow">counterclockwise</strong>; the needle swings <strong class="yellow">right</strong>.'); break;
      case 'NOut': main = tr('<strong class="red">N 極遠離</strong>：穿過線圈的磁力線變少，Bᵢ 與原磁場同向、阻礙減少——近端變成 <strong class="cyan">S 極</strong>；從磁鐵這側看<strong class="yellow">順時針</strong>，安培計<strong class="yellow">向左</strong>。',
        '<strong class="red">N pole leaves</strong>: fewer lines pass through; Bᵢ points along the original field to resist the decrease — the near end becomes <strong class="cyan">S</strong>. Seen from the magnet it is <strong class="yellow">clockwise</strong>; the needle swings <strong class="yellow">left</strong>.'); break;
      case 'SIn': main = tr('<strong class="cyan">S 極靠近</strong>：方向和 N 極相反。Bᵢ 反抗增加，近端變成 <strong class="cyan">S 極</strong>；從磁鐵這側看<strong class="yellow">順時針</strong>，安培計<strong class="yellow">向左</strong>。',
        '<strong class="cyan">S pole approaches</strong>: the opposite of N. Bᵢ opposes the increase and the near end becomes <strong class="cyan">S</strong>; seen from the magnet it is <strong class="yellow">clockwise</strong>, and the needle swings <strong class="yellow">left</strong>.'); break;
      case 'SOut': main = tr('<strong class="cyan">S 極遠離</strong>：Bᵢ 阻礙減少，近端變成 <strong class="red">N 極</strong>；從磁鐵這側看<strong class="yellow">逆時針</strong>，安培計<strong class="yellow">向右</strong>。',
        '<strong class="cyan">S pole leaves</strong>: Bᵢ resists the decrease and the near end becomes <strong class="red">N</strong>; seen from the magnet it is <strong class="yellow">counterclockwise</strong>, and the needle swings <strong class="yellow">right</strong>.'); break;
      case 'stopped': main = tr('磁鐵停住：就算磁鐵就在線圈旁邊，磁通量<strong class="yellow">沒有改變</strong>，電流就回到 0——<strong class="yellow">磁場強不等於有電流</strong>。',
        'Magnet stopped: even right next to the coil, the flux is <strong class="yellow">not changing</strong>, so the current returns to 0 — <strong class="yellow">a strong field is not the same as a current</strong>.'); break;
      case 'pole': main = S.pol > 0 ? tr('<strong class="red">N 極朝線圈</strong>：靠近時安培計向右、遠離時向左。', '<strong class="red">N pole toward the coil</strong>: the needle swings right on approach and left on leaving.')
        : tr('<strong class="cyan">換成 S 極</strong>：方向反過來——靠近時安培計向左、遠離時向右。', '<strong class="cyan">Switched to S</strong>: the directions reverse — left on approach, right on leaving.'); break;
      case 'turns': main = tr(`線圈換成 <strong class="yellow">${S.turns} 匝</strong>：同樣的拖法，<strong class="yellow">匝數越多，電流越大</strong>（感應電壓和匝數成正比）。`,
        `The coil now has <strong class="yellow">${S.turns} turns</strong>: drag the same way — <strong class="yellow">more turns, larger current</strong> (the induced voltage is proportional to the number of turns).`); break;
      case 'str': main = S.str > 1 ? tr('<strong class="yellow">強磁鐵 ×2</strong>：磁力線更密、磁通量加倍；同樣的拖法，電流也加倍。', '<strong class="yellow">Strong magnet ×2</strong>: denser field lines and double the flux; drag the same way and the current doubles.')
        : tr('<strong class="yellow">弱磁鐵 ×1</strong>：磁通量較小，同樣的拖法電流較小。', '<strong class="yellow">Weak magnet ×1</strong>: less flux, so the same drag gives a smaller current.'); break;
      case 'auto': main = tr('<strong class="yellow">自動來回</strong>：磁鐵自己靠近、遠離，安培計跟著左右擺；拖一下就換回自己拉。', '<strong class="yellow">Auto</strong>: the magnet moves in and out by itself and the needle swings left and right; drag it to take over.'); break;
      case 'manual': main = tr('<strong class="yellow">自己拉</strong>：左右拖曳磁鐵，看安培計怎麼動。', '<strong class="yellow">By hand</strong>: drag the magnet left and right and watch the ammeter.'); break;
      default: main = tr('磁鐵停著：磁通量不變，<strong class="yellow">安培計停在 0</strong>。拖曳磁鐵靠近或遠離線圈，看看會發生什麼。', 'The magnet is still: the flux is constant and <strong class="yellow">the ammeter reads 0</strong>. Drag the magnet toward or away from the coil and see what happens.');
    }
    let tip;
    const moving = /^[NS](In|Out)$/.test(k);
    if (moving && Math.abs(S.I) < 0.1 && X0 - S.face > 200) tip = tr('磁鐵離線圈太遠時，磁通量幾乎不變，電流很小；靠近一點再拖。', 'Far from the coil the flux barely changes, so the current is tiny; come closer and drag again.');
    else if (moving && Math.abs(S.v) > 450) tip = tr('<strong class="yellow">拖得越快，電流越大！</strong>磁通量變得越快，感應電流越大。', '<strong class="yellow">The faster you drag, the larger the current!</strong> A faster flux change gives a larger induced current.');
    else if (moving) tip = tr('拖快一點試試：<strong class="yellow">拖得越快，電流越大</strong>。', 'Try dragging faster: <strong class="yellow">the faster you drag, the larger the current</strong>.');
    else tip = tr('拖得越快、匝數越多、磁鐵越強 → 電流越大。', 'Faster drag, more turns, stronger magnet → larger current.');
    return `${main}<br>${tip}<br><span class="green">${setupLine()}</span>`;
  }
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const I = S.I, a = clamp((Math.abs(I) - 0.04) / 0.3, 0, 1);   // |I| < 0.05（讀數顯示 0.0）時所有方向記號都不畫
    drawCoilHalf(S.turns, false);
    drawCoilCurrent(S.turns, I, a, false);
    drawFieldLines(true);
    drawCoilHalf(S.turns, true);
    drawBi(I, a);                                    // 畫在前側導線之上：16 匝時也看得清楚
    drawCoilCurrent(S.turns, I, a, true);
    drawFieldLines(false);
    drawMagnet();
    drawLeads();
    drawLeadFlow(I, a);
    drawMeter(I);
    drawNearPole(I, a);
    text(tr(`線圈 ${S.turns} 匝`, `Coil: ${S.turns} turns`), X0 + CL / 2 + 20, 132, S.turns > 8 ? C.yellow : COPPER, 22);
    text(tr('感應電流 I', 'Induced current'), MX, 384, C.current, 22, 'center', Math.max(0.45, a));
    drawReadouts();
    drawLegend(I, a);
    // 磁鐵運動箭頭
    if (Math.abs(S.v) > 30) {
      const cx = S.face - MW / 2, s = Math.sign(S.v);
      arr(cx - 46 * s, AX + MH / 2 + 28, cx + 46 * s, AX + MH / 2 + 28, C.white, 5, 16, clamp(Math.abs(S.v) / 120, 0, 1));
    }
    // 頂端說明（量寬換行）
    const ls = wrap(caption(), 950, 24), y0 = ls.length > 1 ? 24 : 36;
    ls.forEach((s, i) => text(s, W / 2, y0 + i * 30, captionColor(), 24));
    // 怎麼玩提示
    if (S.hintA > 0.01) {
      const s = tr('👆 左右拖曳磁鐵：靠近、遠離線圈', '👆 Drag the magnet left or right'), w = textW(s, 24) + 28;
      const cx = clamp(S.face - MW / 2, 10 + w / 2, X0 - 12 - w / 2), y = 352;
      const pulse = 0.75 + 0.25 * Math.sin(S.t * 4);
      ctx.save(); ctx.globalAlpha = S.hintA; ctx.fillStyle = PANEL; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
      rrect(cx - w / 2, y - 19, w, 38, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      text(s, cx, y + 1, C.cyan, 24, 'center', S.hintA * pulse);
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt; S.fieldPh += dt;
    if (S.mode === 'auto' && !(ptr && ptr.mode === 'drag')) {
      S.autoT += dt;
      const mid = (FAR + NEAR) / 2, amp = (NEAR - FAR) / 2 * 0.98, w = TAU / 2.6;
      S.face = mid - amp * Math.cos(w * S.autoT);
      S.target = S.face;
    } else {
      S.target = clamp(S.target, FAR, NEAR);
      S.face += (S.target - S.face) * (1 - Math.exp(-dt / S.tau));
      if (Math.abs(S.target - S.face) < 0.05) S.face = S.target;
    }
    S.face = clamp(S.face, FAR, NEAR);
    const vRaw = dt > 0 ? (S.face - S.prevFace) / dt : 0;
    S.prevFace = S.face;
    S.v += (vRaw - S.v) * (1 - Math.exp(-dt / 0.07));
    if (Math.abs(S.v) < 0.5 && vRaw === 0) S.v = 0;
    const d = X0 - S.face;
    const dPhi = S.pol * S.str * (-dfd(d)) * S.v;           // dΦx/dt
    S.I = KI * (S.turns / 8) * dPhi;
    if (Math.abs(S.I) < 1e-4) S.I = 0;
    // 安培計阻尼彈簧
    const tgt = needleTarget(S.I), om = 16, z = 0.75;
    let h = dt;
    while (h > 1e-6) { const q = Math.min(0.008, h); h -= q; S.angV += (om * om * (tgt - S.ang) - 2 * z * om * S.angV) * q; S.ang += S.angV * q; }
    S.flowCoil += -S.I * dt * 3.2;                     // I>0：沿 θ 減少方向
    S.flowLead += S.I * dt * 90;
    // 運動狀態（有遲滯，避免說明字閃爍）
    const sp = Math.abs(S.v);
    if (sp > 35) {
      S.stillT = 0; S.moved = true;
      const m = (S.pol > 0 ? 'N' : 'S') + (S.v > 0 ? 'In' : 'Out');
      if (S.motion !== m) { S.motion = m; S.over = null; }
    } else if (sp < 12) {
      S.stillT += dt;
      if (S.moved && S.stillT > 0.3 && S.motion !== 'stopped' && S.motion !== 'idle') S.motion = 'stopped';
    }
    if (S.dragged && S.hintA > 0) S.hintA = Math.max(0, S.hintA - dt / 0.6);
  }

  // ───────── 動畫迴圈（單一 RAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.getClientRects().length && cv.getBoundingClientRect().width > 0); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visibleNow() || !S.visible) { poll(); return; }
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    step(dt);
    render();
    writeResult();
    S.raf = requestAnimationFrame(frame);
  }
  function poll() {
    if (S.timer || !S.on) return;
    S.timer = setTimeout(() => { S.timer = 0; sync(); }, 300);
  }
  function sync() {
    const want = S.on && !document.hidden;
    if (want && !S.raf && !S.timer) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want) { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; if (S.timer) clearTimeout(S.timer); S.timer = 0; }
  }

  // ───────── 操作 ─────────
  function override(k) { S.over = k; S.overT = S.t; if (S.motion !== 'stopped') S.motion = S.moved ? 'stopped' : 'idle'; }
  const ACTIONS = {
    N: () => { if (S.pol !== 1) { S.pol = 1; S.flipT = S.t; } override('pole'); },
    S: () => { if (S.pol !== -1) { S.pol = -1; S.flipT = S.t; } override('pole'); },
    t4: () => { S.turns = 4; override('turns'); }, t8: () => { S.turns = 8; override('turns'); }, t16: () => { S.turns = 16; override('turns'); },
    weak: () => { S.str = 1; override('str'); }, strong: () => { S.str = 2; override('str'); },
    manual: () => { setMode('manual'); override('manual'); }, auto: () => { setMode('auto'); override('auto'); }
  };
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    if (m === 'auto') {                                // 從目前位置接上正弦（不跳）
      const mid = (FAR + NEAR) / 2, amp = (NEAR - FAR) / 2 * 0.98;
      S.autoT = Math.acos(clamp((mid - S.face) / amp, -1, 1)) / (TAU / 2.6);
    } else { S.target = S.face; S.tau = 0.03; }
  }
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++; ACTIONS[key](); updateUI();
    if (!S.raf) render();
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [tr('磁極朝線圈', 'Pole toward coil'), [['N', tr('N 極', 'N pole')], ['S', tr('S 極', 'S pole')]]],
      [tr('線圈匝數', 'Coil turns'), [['t4', tr('4 匝', '4 turns')], ['t8', tr('8 匝', '8 turns')], ['t16', tr('16 匝', '16 turns')]]],
      [tr('磁鐵強度', 'Magnet strength'), [['weak', tr('弱 ×1', 'Weak ×1')], ['strong', tr('強 ×2', 'Strong ×2')]]],
      [tr('模式', 'Mode'), [['manual', tr('自己拉', 'By hand')], ['auto', tr('自動來回', 'Auto back-and-forth')]]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, t] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = t;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act;
      const on = k === 'N' ? S.pol > 0 : k === 'S' ? S.pol < 0 : k === 't4' ? S.turns === 4 : k === 't8' ? S.turns === 8 : k === 't16' ? S.turns === 16
        : k === 'weak' ? S.str === 1 : k === 'strong' ? S.str === 2 : k === 'manual' ? S.mode === 'manual' : S.mode === 'auto';
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', tr('法拉第實驗台：左右拖曳磁鐵（或按左右方向鍵）靠近、遠離線圈，看安培計',
      'Faraday bench: drag the magnet left or right (or use the arrow keys) toward or away from the coil and watch the ammeter'));
  }

  // ───────── 拖曳（水平為主才接管；垂直滑動交給頁面捲動） ─────────
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, mode: 'pending' };
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (ptr.mode === 'pending') {
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        ptr.mode = 'drag'; ptr.lx = e.clientX;
        try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 不支援就算了 */ }
        cv.classList.add('dragging'); S.dragged = true;
        if (S.mode === 'auto') { setMode('manual'); updateUI(); }
        S.target = S.face; S.tau = 0.03;
      } else if (Math.abs(dy) > 8) { ptr = null; return; }
      else return;
    }
    const rect = cv.getBoundingClientRect(), k = W / (rect.width || W);
    S.target = clamp(S.target + (e.clientX - ptr.lx) * k, FAR, NEAR);
    ptr.lx = e.clientX;
    if (e.cancelable) e.preventDefault();
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.mode === 'drag') {
      cv.classList.remove('dragging');
      try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 已釋放 */ }
    }
    ptr = null;
  }
  function onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (S.mode === 'auto') { setMode('manual'); updateUI(); }
    S.dragged = true; S.tau = 0.12;
    S.target = clamp(S.target + (e.key === 'ArrowRight' ? 40 : -40), FAR, NEAR);
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('faradayLabCanvas');
    ctrl = document.getElementById('faradayLabControls');
    res = document.getElementById('faradayLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.visible = true; lastRes = '';
    S.prevFace = S.face; S.v = 0;
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
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (S.timer) { clearTimeout(S.timer); S.timer = 0; }
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
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ptr = null;
    S.target = S.face; S.v = 0; S.I = 0;
  }
  function relang() { if (!S.on) return; lastRes = ''; buildControls(); updateUI(); render(); }
  function _state() {
    const d = X0 - S.face;
    return {
      pol: S.pol > 0 ? 'N' : 'S', turns: S.turns, strength: S.str, mode: S.mode,
      face: +S.face.toFixed(1), d: +d.toFixed(1), atNear: S.face >= NEAR - 0.5, atFar: S.face <= FAR + 0.5,
      phi: +(S.pol * S.str * fd(d)).toFixed(4), linesThrough: countThrough(),
      v: +S.v.toFixed(1), I: +S.I.toFixed(3), needleDeg: +(S.ang * 180 / Math.PI).toFixed(1), meter: meterSide(),
      nearPole: Math.abs(S.I) >= 0.05 ? (S.I > 0 ? 'N' : 'S') : null,
      fromMagnet: Math.abs(S.I) >= 0.05 ? (S.I > 0 ? 'ccw' : 'cw') : null,
      Bi: Math.abs(S.I) >= 0.05 ? (S.I > 0 ? '-x' : '+x') : null,
      motion: S.motion, msg: msgKey(), caption: caption(),
      hintA: +S.hintA.toFixed(2), dragged: S.dragged, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  EmLab.faraday = { activate, deactivate, relang, _state };
})();
