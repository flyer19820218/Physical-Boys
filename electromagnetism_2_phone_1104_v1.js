/* electromagnetism_2_phone_1104_v1.js — 「電話：聽筒與話筒」分頁動畫（#phoneCanvas，1000×600）
 *
 * 契約：window.EmAnim.phone = { activate(sceneId), deactivate(), relang(), ctl, _frameAt, _info, _state }
 * 依賴頁面現成的：tr、C、TAU、clear、label（直接呼叫，不複製、不修改）。
 * 人、話筒、電池、電線、聽筒、耳朵、微型揚聲器都在本檔自己畫。畫布不綁任何事件；唯一控制是 #steps-phone 的步驟鈕。
 * 畫面是「時間 t 的純函式」：聲音訊號、電流、膜片位置、電流虛線位移都只由場景時間 T 算出，跳步驟與真的播到那裡完全相同。
 *
 * 物理（簡報第 37 行）：話筒＝聲波使碳粉忽鬆忽緊 → 電阻改變 → 大小改變的電流（方向不變，只有大小在變）；
 *   聽筒內有電磁鐵，變動電流使磁力忽強忽弱 → 帶動金屬薄片同步振動 → 推動空氣發出聲波。
 *   現代手機聽筒是微型揚聲器，仍有「音圈＋永久磁鐵」。聲能 → 電能 → 磁能 → 聲能。
 * 電路：電池＋（左）→ 下方電線往左 → 話筒背板 → 碳粉 → 膜片 → 上方電線往右 → 聽筒線圈（由左往右繞）→ 下方電線 → 電池－。
 * 極性：聽筒線圈水平放置，正面那一段電流向下 → 鐵芯內 B 向右 → 右端（朝向薄片）N、左端 S（簡報第 35 行）。
 *   電流方向始終不變，只有大小在變，所以 N／S 不會對調，只是磁力忽強忽弱。
 * 動畫以「慢動作」呈現聲音（真實聲音每秒振動數百次），畫面右下角標示「慢動作示意」。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * tab-phone-main 聽筒與話筒，共 48 s
 *   1 說話   9 s  人開口說話，聲波（聲能）傳進話筒；標出話筒、膜片、碳粉、電池
 *   2 話筒  10 s  膜片壓碳粉：壓緊 → 電阻小 → 電流大；鬆開 → 電阻大 → 電流小（右上小波形圖）
 *   3 傳送   8 s  變動的電流沿電線傳到另一端；兩端電流表同步擺動（電線可以很長）
 *   4 聽筒  10 s  電磁鐵磁力隨電流忽強忽弱 → 吸動金屬薄片同步振動
 *   5 發聲  11 s  薄片推動空氣 → 聲波傳到耳朵；聲能→電能→磁能→聲能；補充：手機聽筒＝微型揚聲器（音圈＋永久磁鐵）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.EmAnim = window.EmAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, PURPLE = C.purple;
  const POLE_N = C.poleN, POLE_S = C.poleS;
  const CHALK = '#f2ecd9', MUTED = '#b9c7bf', PANEL = 'rgba(12,30,25,0.92)';
  const SCENE_ID = 'tab-phone-main';

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
  function poleBadge(ctx, x, y, isN, a, r = 15) {
    if (a <= 0.01) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 22);
  }

  // ═════════ 導線（含流動的電流虛線；與起重機檔同一套） ═════════
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
      ctx.globalAlpha = al * clamp(amp, 0, 1) * (part === 'back' ? 0.5 : 1); ctx.strokeStyle = ORANGE;
      ctx.lineWidth = Math.max(2.4, w * (o.dw || 0.62)); ctx.shadowColor = ORANGE; ctx.shadowBlur = o.glow || 8;
      ctx.setLineDash([10, 16]);
      for (const r of runs) { ctx.lineDashOffset = cum[r.i0] - (o.off || 0); polyline(ctx, r.p); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
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

  // ═════════ 聲音與電流（全部是場景時間 T 的函式） ═════════
  const V_SND = 70;                  // 聲波在畫面上的速度（px/s，慢動作）
  const MOUTH_X = 112, MIC_X = 180, REC_X = 808;
  const D_MIC = (MIC_X - MOUTH_X) / V_SND;
  const I0 = 0.6, IK = 0.32;         // 電流＝I0＋IK×q（q∈[-1,1]，電流方向始終不變）
  let TOTAL = 48;
  function envAt(T) { return easeIO(seg(T, 1.6, 2.6)) * (1 - easeIO(seg(T, TOTAL - 0.9, TOTAL - 0.1))); }
  // 說話的聲音（嘴巴這裡的聲壓，−1～1）
  function sig(T) {
    if (T <= 1.6) return 0;
    const v = 0.62 * Math.sin(TAU * 0.85 * (T - 1.6)) + 0.38 * Math.sin(TAU * 1.9 * (T - 1.6) + 0.7);
    return clamp(envAt(T) * (0.78 + 0.22 * Math.sin(TAU * 0.23 * T)) * v, -1, 1);
  }
  // q：話筒膜片的位置（＋＝被推向碳粉）＝ 電流的變化量（＋＝電流大）
  const qAt = T => sig(T - D_MIC);
  const IAt = T => I0 + IK * qAt(T);
  // 電流虛線的位移＝電流對時間的積分（預先算成表，仍是 T 的純函式）
  let ITAB = null; const DT = 0.01;
  function buildITab() { const n = Math.ceil((TOTAL + 1) / DT); ITAB = new Float32Array(n + 1); for (let k = 1; k <= n; k++) ITAB[k] = ITAB[k - 1] + IAt((k - 0.5) * DT) * DT; }
  function chargeAt(T) { const k = clamp(T / DT, 0, ITAB.length - 2), i = Math.floor(k); return lerp(ITAB[i], ITAB[i + 1], k - i); }

  // ═════════ 版面 ═════════
  const TOPW = 140, BOTW = 470;               // 上、下兩條電線的高度
  const MIC = { x0: 168, x1: 292, y0: 196, y1: 344, cx0: 186, back: 270, cy0: 214, cy1: 326 };
  const BAT = { x: 430, y: 456, w: 80, h: 28 };
  const GR = { x: 330, y: 170, w: 280, h: 180 };   // 電流小波形圖
  const RC = { x0: 640, x1: 830, y0: 176, y1: 364, core0: 660, core1: 782, cy: 270, coil0: 674, coil1: 766, ry: 40, rx: 9, turns: 6.5 };
  const EAR = { x: 952, y: 270 };

  // 顆粒的固定位置（話筒碳粉盒）
  const GRAINS = [];
  (function () {
    let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) GRAINS.push({ u: (c + 0.5 + (rnd() - 0.5) * 0.5) / 6, y: MIC.cy0 + 7 + r * 12.6 + (rnd() - 0.5) * 3, r: 4.2 + rnd() * 1.6, k: rnd() });
  })();

  // ── 說話的人（側面） ──
  function drawHead(ctx, T) {
    const cx = 64, cy = 262, open = 2 + 11 * Math.abs(sig(T));
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#1d3d34'; ctx.strokeStyle = CHALK; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 70);
    ctx.lineTo(cx - 6, cy + 40);
    ctx.bezierCurveTo(cx - 48, cy + 30, cx - 52, cy - 52, cx - 2, cy - 58);
    ctx.bezierCurveTo(cx + 30, cy - 60, cx + 44, cy - 34, cx + 40, cy - 12);
    ctx.lineTo(cx + 50, cy + 6); ctx.lineTo(cx + 40, cy + 10);
    ctx.lineTo(cx + 40, cy + 14);
    ctx.lineTo(cx + 44, cy + 16 + open * 0.5);
    ctx.lineTo(cx + 40, cy + 18 + open);
    ctx.lineTo(cx + 40, cy + 30 + open * 0.6);
    ctx.bezierCurveTo(cx + 34, cy + 42, cx + 20, cy + 44, cx + 12, cy + 44);
    ctx.lineTo(cx + 12, cy + 70);
    ctx.fill(); ctx.stroke();
    // 頭髮、眼睛、嘴
    ctx.fillStyle = '#4a3428';
    ctx.beginPath(); ctx.moveTo(cx - 44, cy - 6); ctx.bezierCurveTo(cx - 54, cy - 60, cx + 10, cy - 76, cx + 36, cy - 30); ctx.bezierCurveTo(cx + 10, cy - 46, cx - 18, cy - 36, cx - 30, cy - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(cx + 24, cy - 14, 3.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7d2f2f'; ctx.beginPath(); ctx.ellipse(cx + 41, cy + 16 + open * 0.5, 3.5, Math.max(1, open * 0.5), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // ── 聲波：在 [xa, xb] 之間依位置的聲壓畫弧線（只畫「被擠密」的地方） ──
  function soundWaves(ctx, ox, oy, xa, xb, pAt, a, color, rmax = 120) {
    if (a <= 0.01) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = color;
    for (let x = xa; x <= xb; x += 6) {
      const p = pAt(x); if (p <= 0.05) continue;
      const r = x - ox, ang = Math.min(0.75, 62 / Math.max(r, 20));
      ctx.globalAlpha = a * clamp(p, 0, 1) * 0.95; ctx.lineWidth = 2 + 2 * p;
      ctx.beginPath(); ctx.arc(ox, oy, r, -ang, ang); ctx.stroke();
    }
    ctx.restore();
  }
  // ── 話筒（剖面）：膜片＋碳粉盒＋背板 ──
  function drawMic(ctx, T, st) {
    const q = qAt(T), d = 12 * q, I = IAt(T);
    const front = MIC.cx0 + d, back = MIC.back;
    ctx.save();
    // 外殼（左側開口讓聲波進來）
    ctx.fillStyle = '#183a33'; ctx.strokeStyle = '#5b8c80'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(MIC.x0 + 8, MIC.y0); ctx.lineTo(MIC.x1 - 12, MIC.y0); ctx.quadraticCurveTo(MIC.x1, MIC.y0, MIC.x1, MIC.y0 + 12);
    ctx.lineTo(MIC.x1, MIC.y1 - 12); ctx.quadraticCurveTo(MIC.x1, MIC.y1, MIC.x1 - 12, MIC.y1); ctx.lineTo(MIC.x0 + 8, MIC.y1); ctx.stroke();
    ctx.globalAlpha = 0.8; ctx.fillRect(MIC.x0 + 8, MIC.y0 + 2, MIC.x1 - MIC.x0 - 10, MIC.y1 - MIC.y0 - 4); ctx.globalAlpha = 1;
    // 碳粉盒內：通電的光（電流越大越亮）
    const glow = st.chamberGlow * clamp((I - 0.2) / 0.8, 0, 1);
    if (glow > 0.01) { ctx.fillStyle = `rgba(255,179,71,${0.28 * glow})`; ctx.fillRect(front + 3, MIC.cy0, back - front - 3, MIC.cy1 - MIC.cy0); }
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(MIC.cx0 - 4, MIC.cy0); ctx.lineTo(back, MIC.cy0); ctx.moveTo(MIC.cx0 - 4, MIC.cy1); ctx.lineTo(back, MIC.cy1); ctx.stroke();
    // 碳粉：膜片推進來就擠密
    const span = back - front;
    GRAINS.forEach(g => {
      const x = back - (1 - g.u) * span * 0.96 - 2;
      ctx.fillStyle = g.k > 0.5 ? '#5d5a55' : '#77736c'; ctx.strokeStyle = '#2b2a27'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, g.y, g.r, 0, TAU); ctx.fill(); ctx.stroke();
    });
    // 背板（金屬）
    ctx.fillStyle = '#9aa6a1'; ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 2;
    rrect(ctx, back, MIC.y0 + 10, 10, MIC.y1 - MIC.y0 - 20, 2); ctx.fill(); ctx.stroke();
    // 膜片（金屬薄片，上下固定，中間被聲波推動）
    ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(MIC_X, MIC.y0 + 6); ctx.quadraticCurveTo(MIC_X + 2 * d, (MIC.y0 + MIC.y1) / 2, MIC_X, MIC.y1 - 6); ctx.stroke();
    ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(MIC_X, MIC.y0 + 6); ctx.quadraticCurveTo(MIC_X + 2 * d, (MIC.y0 + MIC.y1) / 2, MIC_X, MIC.y1 - 6); ctx.stroke();
    ctx.fillStyle = '#5b8c80'; ctx.fillRect(MIC_X - 6, MIC.y0 - 2, 12, 10); ctx.fillRect(MIC_X - 6, MIC.y1 - 8, 12, 10);
    ctx.restore();
  }
  // ── 聽筒線圈（水平螺旋，由左往右繞；正面那一段電流向下） ──
  function recCoil() {
    const n = RC.turns, N = Math.ceil(n * 40), out = [];
    for (let i = 0; i <= N; i++) {
      const u = n * i / N, th = TAU * u, z = Math.sin(th);
      out.push({ x: RC.coil0 + (RC.coil1 - RC.coil0) * u / n + RC.rx * z, y: RC.cy - RC.ry * Math.cos(th), f: z > -0.02 });
    }
    return out;
  }
  const COIL = recCoil();
  // 聽筒的磁力線：由右端 N 出來，經過薄片，從上下繞回左端 S（外部箭頭向左）
  function recField(ctx, a, dx) {
    if (a <= 0.01) return;
    ctx.save(); ctx.strokeStyle = PURPLE; ctx.lineCap = 'round';
    const bz = (q, a0, a1, a2, a3) => (1 - q) ** 3 * a0 + 3 * (1 - q) ** 2 * q * a1 + 3 * (1 - q) * q * q * a2 + q ** 3 * a3;
    for (const sd of [-1, 1]) for (const k of [0, 1]) {
      const p0 = { x: RC.core1, y: RC.cy + sd * (6 + 8 * k) }, p1 = { x: RC.core0 - 2, y: RC.cy + sd * (10 + 6 * k) };
      const c1 = { x: REC_X + dx * 0.6 + 16 + 10 * k, y: RC.cy + sd * (40 + 34 * k) }, c2 = { x: RC.core0 - 34 - 18 * k, y: RC.cy + sd * (92 + 24 * k) };
      ctx.globalAlpha = a * (k ? 0.7 : 0.95); ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p1.x, p1.y); ctx.stroke();
      const q0 = 0.5, mx = bz(q0, p0.x, c1.x, c2.x, p1.x), my = bz(q0, p0.y, c1.y, c2.y, p1.y), nx = bz(q0 + 0.03, p0.x, c1.x, c2.x, p1.x), ny = bz(q0 + 0.03, p0.y, c1.y, c2.y, p1.y);
      arrowHead(ctx, mx, my, Math.atan2(ny - my, nx - mx), GREEN, 11);
    }
    ctx.restore();
  }
  function drawReceiver(ctx, T, st, part) {
    const I = IAt(T), q = qAt(T), dx = -9 * q;     // 電流大 → 磁力強 → 薄片被吸向電磁鐵（向左）
    const off = chargeAt(T) * 110, amp = 1;
    const lead0 = [{ x: 600, y: TOPW }, { x: 652, y: TOPW }, { x: 652, y: RC.cy - RC.ry - 6 }, { x: RC.coil0, y: RC.cy - RC.ry }];
    const pts = lead0.concat(COIL).concat([{ x: RC.coil1, y: BOTW - 40 }, { x: RC.coil1, y: BOTW }, { x: 700, y: BOTW }]);
    const flow = { w: 4.5, amp, off, glow: 4 + 10 * I, dw: 0.4 + 0.45 * I };
    if (part === 'back') {
      // 外殼（右側開口，薄片夾在開口上）
      ctx.save();
      ctx.fillStyle = '#183a33'; ctx.strokeStyle = '#5b8c80'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(REC_X + 4, RC.y0); ctx.lineTo(RC.x0 + 12, RC.y0); ctx.quadraticCurveTo(RC.x0, RC.y0, RC.x0, RC.y0 + 12);
      ctx.lineTo(RC.x0, RC.y1 - 12); ctx.quadraticCurveTo(RC.x0, RC.y1, RC.x0 + 12, RC.y1); ctx.lineTo(REC_X + 4, RC.y1);
      ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      ctx.restore();
      recField(ctx, st.field * clamp((I - 0.15) / 0.85, 0, 1), dx);
      drawPath(ctx, pts, Object.assign({ part: 'back' }, flow));
      // 軟鐵芯：磁力越強，光越亮
      ctx.save();
      const g = ctx.createLinearGradient(0, RC.cy - 18, 0, RC.cy + 18);
      g.addColorStop(0, '#5f6a70'); g.addColorStop(0.45, '#c3ccd0'); g.addColorStop(1, '#5f6a70');
      const m = st.field * clamp((I - 0.2) / 0.75, 0, 1);
      if (m > 0.01) { ctx.shadowColor = PURPLE; ctx.shadowBlur = 24 * m; }
      ctx.fillStyle = g; ctx.strokeStyle = '#38423f'; ctx.lineWidth = 2;
      rrect(ctx, RC.core0, RC.cy - 18, RC.core1 - RC.core0, 36, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      if (m > 0.01) {
        const tg = ctx.createLinearGradient(RC.core0, 0, RC.core1, 0);
        tg.addColorStop(0, `rgba(114,185,255,${0.5 * m})`); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, `rgba(255,111,118,${0.5 * m})`);
        ctx.fillStyle = tg; rrect(ctx, RC.core0, RC.cy - 18, RC.core1 - RC.core0, 36, 4); ctx.fill();
      }
      ctx.restore();
    } else {
      drawPath(ctx, pts, Object.assign({ part: 'front' }, flow));
      // 正面每一圈中點的電流箭頭（向下）
      ctx.save(); ctx.globalAlpha = 0.95;
      for (let k = 0; k < Math.floor(RC.turns); k += 2) {
        const x = RC.coil0 + (RC.coil1 - RC.coil0) * (k + 0.25) / RC.turns + RC.rx;
        arrowHead(ctx, x, RC.cy + 4, Math.PI / 2, ORANGE, 9);
      }
      ctx.restore();
      // 金屬薄片（上下夾在外殼上，中間被電磁鐵吸動）
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(REC_X, RC.y0 + 8); ctx.quadraticCurveTo(REC_X + 2 * dx, RC.cy, REC_X, RC.y1 - 8); ctx.stroke();
      ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(REC_X, RC.y0 + 8); ctx.quadraticCurveTo(REC_X + 2 * dx, RC.cy, REC_X, RC.y1 - 8); ctx.stroke();
      ctx.fillStyle = '#5b8c80'; ctx.fillRect(REC_X - 7, RC.y0 - 2, 14, 12); ctx.fillRect(REC_X - 7, RC.y1 - 10, 14, 12);
      ctx.restore();
      const pa = st.poles * (0.6 + 0.4 * clamp((I - 0.2) / 0.75, 0, 1));
      poleBadge(ctx, RC.core1 + 6, RC.cy - 58, true, pa);
      poleBadge(ctx, RC.core0 - 6, RC.cy + 60, false, pa);
    }
  }
  function drawEar(ctx) {
    const x = EAR.x, y = EAR.y;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#1d3d34'; ctx.strokeStyle = CHALK; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 36, y - 62);
    ctx.bezierCurveTo(x - 30, y - 70, x - 40, y - 10, x - 22, y + 18);
    ctx.bezierCurveTo(x - 10, y + 40, x - 20, y + 64, x + 4, y + 70);
    ctx.lineTo(x + 36, y + 70); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(242,236,217,0.7)';
    ctx.beginPath(); ctx.moveTo(x + 16, y - 42); ctx.bezierCurveTo(x - 14, y - 44, x - 18, y - 6, x - 4, y + 10); ctx.bezierCurveTo(x + 4, y + 20, x - 2, y + 34, x + 10, y + 40); ctx.stroke();
    ctx.fillStyle = '#0c1e19'; ctx.beginPath(); ctx.ellipse(x + 6, y + 2, 5, 9, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // ── 電流小波形圖 ──
  function drawGraph(ctx, T, a) {
    if (a <= 0.01) return;
    card(ctx, GR.x, GR.y, GR.w, GR.h, a, 'rgba(255,179,71,0.5)');
    const x0 = GR.x + 22, x1 = GR.x + GR.w - 18, yb = GR.y + GR.h - 18, sc = 128, span = 3.2;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, GR.y + 50); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    arrowHead(ctx, x1 + 4, yb, 0, 'rgba(242,236,217,0.7)', 8);
    // 平均電流（虛線）
    ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,179,71,0.35)';
    ctx.beginPath(); ctx.moveTo(x0, yb - I0 * sc); ctx.lineTo(x1, yb - I0 * sc); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 3.5; ctx.shadowColor = ORANGE; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let k = 0; k <= 110; k++) {
      const u = k / 110, tt = T - span * (1 - u), x = lerp(x0 + 2, x1 - 8, u), y = yb - IAt(Math.max(0, tt)) * sc;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    const yn = yb - IAt(T) * sc;
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(x1 - 8, yn, 6, 0, TAU); ctx.fill();
    ctx.restore();
    const ttl = tr('電流 I（忽大忽小）', 'Current I (up and down)');
    txt(ctx, ttl, GR.x + GR.w / 2, GR.y + 26, ORANGE, a, fitSize(ctx, ttl, GR.w - 24, 22, 22));
  }
  // ── 電流表（第 3 步：兩端同步） ──
  function meter(ctx, x, y, I, a) {
    if (a <= 0.01) return;
    const r = 30, ang = -Math.PI / 2 + (I - I0) / IK * 0.9;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#e9e3cf'; ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5b6b66'; ctx.lineWidth = 2;
    for (let k = -3; k <= 3; k++) { const b = -Math.PI / 2 + k * 0.35; ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * (r - 4), y + Math.sin(b) * (r - 4)); ctx.lineTo(x + Math.cos(b) * (r - 10), y + Math.sin(b) * (r - 10)); ctx.stroke(); }
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + Math.cos(ang) * (r - 6), y + 12 + Math.sin(ang) * (r - 6) * 0.95); ctx.stroke();
    ctx.fillStyle = '#3c4744'; ctx.beginPath(); ctx.arc(x, y + 12, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // ── 兩列對照（目前符合的那一列亮起來） ──
  function rows(ctx, r1, r2, c1, c2, k, a) {
    if (a <= 0.01) return;
    const s1 = tr(r1[0], r1[1]), s2 = tr(r2[0], r2[1]), cx = 470, mw = 370;
    const a1 = a * lerp(0.35, 1, clamp(k, 0, 1)), a2 = a * lerp(0.35, 1, clamp(-k, 0, 1));
    tag(ctx, s1, cx, 394, c1, a1, 22, mw);
    tag(ctx, s2, cx, 432, c2, a2, 22, mw);
  }
  // ── 能量轉換列（底部） ──
  function energyStrip(ctx, lv) {
    ctx.save(); ctx.fillStyle = PANEL; ctx.fillRect(0, H - 44, W, 44); ctx.restore();
    const items = [[tr('聲能', 'Sound'), CYAN], [tr('電能', 'Electrical'), ORANGE], [tr('磁能', 'Magnetic'), GREEN], [tr('聲能', 'Sound'), CYAN]];
    const size = 22, gap = 46, ws = items.map(it => textW(ctx, it[0], size) + 18);
    const tot = ws.reduce((s, w) => s + w, 0) + gap * 3;
    let x = Math.min((W - tot) / 2, 760 - tot);
    const y = H - 22;
    items.forEach(([s, col], k) => {
      const a = lerp(0.3, 1, lv[k]);
      ctx.save(); ctx.globalAlpha = a * lv[k];
      ctx.strokeStyle = col; ctx.lineWidth = 2; rrect(ctx, x, y - 16, ws[k], 32, 8); ctx.stroke(); ctx.restore();
      txt(ctx, s, x + ws[k] / 2, y + 1, col, a, size);
      x += ws[k];
      if (k < 3) {
        const aa = lerp(0.3, 1, Math.min(lv[k], lv[k + 1]));
        ctx.save(); ctx.globalAlpha = aa; ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 9, y); ctx.lineTo(x + gap - 13, y); ctx.stroke(); arrowHead(ctx, x + gap - 12, y, 0, CHALK, 8); ctx.restore();
        x += gap;
      }
    });
    const sl = tr('慢動作示意', 'Slow motion');
    txt(ctx, sl, W - 14, y + 1, MUTED, 1, 22, 'right');
  }

  // ═════════ 每一步的狀態 ═════════
  function stateAt(step, t) {
    const s = { veil: 0, graph: 0, chamberGlow: 0.6, field: 1, poles: 0, tags: {}, rowsMic: 0, rowsRec: 0, meters: 0, longTag: 0, outWaves: 1, inWaves: 1, lv: [0, 0, 0, 0], sp: 0, heard: 0, msg: '', mc: CHALK };
    if (step === 0) {
      s.veil = 1; s.lv = [1, 0, 0, 0];
      const ap = (a, b) => easeIO(seg(t, a, b));
      s.tags = { snd: ap(2.6, 3.2), dia: ap(4.0, 4.6), carbon: ap(5.4, 6.0), batt: ap(6.6, 7.2) };
      if (t < 2.4) { s.msg = tr('電話的一端：有人準備對著話筒說話', 'One end of the phone: someone is about to speak'); s.mc = CHALK; }
      else if (t < 5.2) { s.msg = tr('說話時，聲波（聲能）傳進話筒，推動膜片前後振動', 'Speaking sends sound waves (sound energy) in, pushing the diaphragm back and forth'); s.mc = CYAN; }
      else { s.msg = tr('膜片後面是裝滿碳粉的小盒子，接著電池形成電路', 'Behind the diaphragm is a box of carbon granules, wired to a battery'); s.mc = CHALK; }
    } else if (step === 1) {
      s.veil = 1; s.graph = easeIO(seg(t, 0.4, 1.0)); s.chamberGlow = 1; s.rowsMic = easeIO(seg(t, 1.0, 1.6));
      s.tags = { carbon: 1 - easeIO(seg(t, 0, 0.5)) };
      s.lv = [1, easeIO(seg(t, 5.5, 6.3)), 0, 0];
      if (t < 3.6) { s.msg = tr('聲音推得用力：碳粉被壓緊 → 電阻變小 → 電流變大', 'A strong push packs the granules → less resistance → more current'); s.mc = YELLOW; }
      else if (t < 6.4) { s.msg = tr('膜片彈回：碳粉鬆開 → 電阻變大 → 電流變小', 'When it springs back they loosen → more resistance → less current'); s.mc = CYAN; }
      else { s.msg = tr('聲音就變成了「大小改變的電流」：聲能 → 電能', 'The sound becomes a varying current: sound energy → electrical energy'); s.mc = ORANGE; }
    } else if (step === 2) {
      s.veil = 1; s.graph = 1; s.meters = easeIO(seg(t, 0.4, 1.0)); s.longTag = easeIO(seg(t, 1.6, 2.2));
      s.lv = [0, 1, 0, 0];
      if (t < 3.6) { s.msg = tr('變動的電流沿著電線，傳到另一端的聽筒', 'The varying current travels along the wire to the receiver at the other end'); s.mc = ORANGE; }
      else { s.msg = tr('兩端的電流同步忽大忽小：電線再長，變化也幾乎同時到達', 'Both ends rise and fall together: even on a long wire, changes arrive almost at once'); s.mc = YELLOW; }
    } else if (step === 3) {
      s.veil = 1 - easeIO(seg(t, 0, 0.8)); s.graph = 1; s.poles = easeIO(seg(t, 2.2, 2.8)); s.rowsRec = easeIO(seg(t, 3.2, 3.8));
      s.tags = { em: easeIO(seg(t, 0.8, 1.4)), plate: easeIO(seg(t, 1.6, 2.2)) };
      s.lv = [0, 1, easeIO(seg(t, 1.0, 1.8)), 0];
      if (t < 3.0) { s.msg = tr('聽筒裡有電磁鐵：電流流過線圈，鐵芯被磁化（電能 → 磁能）', 'The receiver has an electromagnet: current magnetizes the core (electrical → magnetic)'); s.mc = GREEN; }
      else if (t < 6.6) { s.msg = tr('電流大 → 磁力強 → 薄片被吸近；電流小 → 磁力弱 → 薄片彈回', 'More current → stronger pull → plate drawn in; less → weaker → plate springs back'); s.mc = YELLOW; }
      else { s.msg = tr('所以金屬薄片跟著電流同步振動', 'So the metal plate vibrates in step with the current'); s.mc = PINK; }
    } else {
      s.graph = 1 - easeIO(seg(t, 4.6, 5.2)); s.heard = easeIO(seg(t, 1.6, 2.2));
      s.tags = { plate: 1 - easeIO(seg(t, 0, 0.4)) };
      s.lv = [0, 0, 1, easeIO(seg(t, 0.6, 1.4))];
      if (t >= 2.6) s.lv = [1, 1, 1, 1].map((v, k) => Math.max(s.lv[k], easeIO(seg(t, 2.6 + k * 0.3, 3.0 + k * 0.3))));
      s.sp = easeIO(seg(t, 5.0, 5.8));
      if (t < 2.6) { s.msg = tr('薄片推動空氣，又產生聲波（聲能），耳朵就聽到了', 'The plate pushes the air, making sound waves again, and the ear hears it'); s.mc = CYAN; }
      else if (t < 5.0) { s.msg = tr('聲能 → 電能 → 磁能 → 聲能：聲音沒有跑進電線，跑的是電流', 'Sound → electrical → magnetic → sound: the wire carries current, not sound'); s.mc = YELLOW; }
      else { s.msg = tr('補充：現代手機的聽筒是微型揚聲器', 'Extra: a modern phone receiver is a tiny speaker'); s.mc = PINK; }
    }
    return s;
  }

  // ═════════ 補充卡：微型揚聲器（音圈＋永久磁鐵） ═════════
  function drawSpeakerCard(ctx, T, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.canvas; ctx.fillRect(0, 58, W, H - 102); ctx.restore();
    const X = 70, Y = 82, Wc = 860, Hc = 450;
    card(ctx, X, Y, Wc, Hc, a, 'rgba(255,120,183,0.6)');
    ctx.save(); ctx.globalAlpha = a;
    const cx = 290, cy = 316, q = qAt(T), d = 7 * q;
    // 永久磁鐵（環形，剖面上下兩塊：左 S 右 N）＋中心極柱（軟鐵）
    [[-1], [1]].forEach(([sd]) => {
      const y0 = sd < 0 ? cy - 96 : cy + 34;
      ctx.fillStyle = POLE_S; ctx.fillRect(cx - 120, y0, 40, 62);
      ctx.fillStyle = POLE_N; ctx.fillRect(cx - 80, y0, 40, 62);
      ctx.strokeStyle = '#2b2a27'; ctx.lineWidth = 2; ctx.strokeRect(cx - 120, y0, 80, 62);
      ctx.fillStyle = '#9aa6a1'; ctx.fillRect(cx - 40, y0 + (sd < 0 ? 30 : 0), 22, 32); ctx.strokeRect(cx - 40, y0 + (sd < 0 ? 30 : 0), 22, 32);
    });
    ctx.fillStyle = '#9aa6a1'; ctx.strokeStyle = '#2b2a27'; ctx.lineWidth = 2;
    ctx.fillRect(cx - 140, cy - 96, 20, 192); ctx.strokeRect(cx - 140, cy - 96, 20, 192);
    ctx.fillRect(cx - 120, cy - 18, 102, 36); ctx.strokeRect(cx - 120, cy - 18, 102, 36);
    // 音圈（套在極柱上，連著振膜一起動）
    ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
    for (let k = 0; k < 4; k++) { [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(cx - 36 + k * 9 + d, cy + sd * 26, 4.2, 0, TAU); ctx.fill(); }); }
    ctx.shadowBlur = 0;
    // 振膜（錐盆）
    ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 6 + d, cy - 30); ctx.lineTo(cx + 80 + d * 1.2, cy - 130); ctx.moveTo(cx - 6 + d, cy + 30); ctx.lineTo(cx + 80 + d * 1.2, cy + 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 6 + d, cy - 30); ctx.lineTo(cx - 6 + d, cy + 30); ctx.stroke();
    ctx.restore();
    // 往外的聲波
    soundWaves(ctx, cx + 30, cy, cx + 110, cx + 190, x => -qAt(T - (x - cx - 90) / V_SND), a, CYAN, 140);
    // 標籤
    tag(ctx, tr('永久磁鐵', 'Permanent magnet'), cx - 80, cy + 128, CHALK, a, 22, 260);
    leader(ctx, cx - 80, cy + 112, cx - 80, cy + 96, CHALK, a);
    tag(ctx, tr('音圈', 'Voice coil'), cx - 30, cy - 132, ORANGE, a, 22, 200);
    leader(ctx, cx - 30, cy - 114, cx - 26, cy - 32, ORANGE, a);
    tag(ctx, tr('振膜', 'Diaphragm'), cx + 130, cy + 170, CHALK, a, 22, 200);
    leader(ctx, cx + 110, cy + 152, cx + 70, cy + 118, CHALK, a);
    // 右側說明
    const tx = 512, mw = W - 70 - tx - 24;
    const lines = [
      [tr('補充：手機聽筒＝微型揚聲器', 'Extra: a phone receiver'), PINK, 26],
      [tr('', 'is a tiny speaker'), PINK, 26],
      [tr('變動的電流流過「音圈」', 'A varying current flows'), CHALK, 22],
      [tr('音圈和「永久磁鐵」之間', 'through the voice coil,'), CHALK, 22],
      [tr('的磁力忽強忽弱', 'so the force between it and'), CHALK, 22],
      [tr('→ 推動振膜發聲', 'the permanent magnet varies'), CHALK, 22],
      [tr('', '→ the diaphragm makes sound'), CHALK, 22],
      [tr('原理相同：電 → 磁 → 聲', 'Same idea:'), YELLOW, 24],
      [tr('', 'electric → magnetic → sound'), YELLOW, 24]
    ].filter(l => l[0]);
    const gapY = lines.length > 8 ? 38 : 40, y0 = Y + Hc / 2 - (lines.length - 1) * gapY / 2;
    lines.forEach(([s, c, z], k) => txt(ctx, s, tx, y0 + k * gapY, c, a, fitSize(ctx, s, mw, z, 22), 'left'));
  }

  // ═════════ 主畫面 ═════════
  function drawMain(ctx, step, t) {
    const sc = SCENES[SCENE_ID], T = sc.starts[step] + t, s = stateAt(step, t);
    if (s.sp >= 0.999) { drawSpeakerCard(ctx, T, 1); topMsg(ctx, s.msg, s.mc); energyStrip(ctx, s.lv); return; }
    const I = IAt(T), off = chargeAt(T) * 110;
    const flow = { w: 4.5, amp: 1, off, glow: 4 + 10 * I, dw: 0.4 + 0.45 * I };
    // 說話的人與進入話筒的聲波
    soundWaves(ctx, MOUTH_X - 8, 278, MOUTH_X + 4, MIC_X - 6, x => sig(T - (x - MOUTH_X) / V_SND), 1, CYAN);
    drawHead(ctx, T);
    // 電路：電池＋ → 下方電線往左 → 話筒背板 …… 膜片 → 上方電線往右 → 聽筒
    const offA = off, lenA = (BAT.x - 5 - 275) + (BOTW - MIC.y1);
    drawPath(ctx, [{ x: BAT.x - 5, y: BOTW }, { x: 275, y: BOTW }, { x: 275, y: MIC.y1 - 6 }], Object.assign({}, flow, { off: offA }));
    drawPath(ctx, [{ x: MIC_X, y: MIC.y0 + 2 }, { x: MIC_X, y: TOPW }, { x: 600, y: TOPW }], Object.assign({}, flow, { off: offA - lenA - 120 }));
    drawPath(ctx, [{ x: 700, y: BOTW }, { x: BAT.x + BAT.w + 5, y: BOTW }], Object.assign({}, flow, { off: off - 900 }));
    // 電流方向的小箭頭
    arrowHead(ctx, 420, TOPW, 0, ORANGE, 11);
    arrowHead(ctx, 395, BOTW, Math.PI, ORANGE, 11);
    arrowHead(ctx, 600, BOTW, Math.PI, ORANGE, 11);
    cell(ctx, BAT.x, BAT.y, BAT.w, BAT.h, true);
    drawMic(ctx, T, s);
    // 聽筒
    drawReceiver(ctx, T, s, 'back');
    drawReceiver(ctx, T, s, 'front');
    soundWaves(ctx, REC_X - 30, RC.cy, REC_X + 14, EAR.x - 34, x => -qAt(T - (x - REC_X) / V_SND), s.outWaves, CYAN);
    drawEar(ctx);
    // 前三步：聽筒那一端先暗下來（還沒講到）
    if (s.veil > 0.01) { ctx.save(); ctx.globalAlpha = s.veil * 0.62; ctx.fillStyle = C.canvas; ctx.fillRect(626, 150, W - 626, 238); ctx.restore(); }
    // 小波形圖、電流表
    drawGraph(ctx, T, s.graph);
    meter(ctx, 330, BOTW, I, s.meters); meter(ctx, 615, BOTW, I, s.meters);
    if (s.meters > 0.01) {
      tag(ctx, tr('這一端', 'This end'), 330, 520, ORANGE, s.meters, 22, 200);
      tag(ctx, tr('另一端', 'Far end'), 615, 520, ORANGE, s.meters, 22, 200);
    }
    tag(ctx, tr('電線可以很長（好幾公里）', 'Wire may be km long'), 514, 104, YELLOW, s.longTag, 22, 300);
    // 固定標籤
    tag(ctx, tr('話筒（麥克風）', 'Transmitter (mic)'), 236, 104, CYAN, 1, 22, 240);
    tag(ctx, tr('聽筒', 'Receiver'), 735, 104, PINK, 1, 22, 220);
    if (s.meters < 0.5) tag(ctx, tr('電池', 'Battery'), 470, 516, ORANGE, 1, 22, 200);
    // 逐步標籤
    const Tg = s.tags;
    if (Tg.snd) { leader(ctx, 70, 422, 135, 300, CYAN, Tg.snd); tag(ctx, tr('聲波', 'Sound waves'), 70, 440, CYAN, Tg.snd, 22, 200); }
    if (Tg.dia) { leader(ctx, 186, 364, 181, 334, CHALK, Tg.dia); tag(ctx, tr('膜片', 'Diaphragm'), 190, 382, CHALK, Tg.dia, 22, 200); }
    if (Tg.carbon) { leader(ctx, 330, 270, 250, 270, MUTED, Tg.carbon); tag(ctx, tr('碳粉', 'Carbon granules'), 330 + textW(ctx, tr('碳粉', 'Carbon granules'), 22) / 2 + 10, 270, CHALK, Tg.carbon, 22, 300); }
    if (Tg.em) { tag(ctx, tr('電磁鐵', 'Electromagnet'), 752, 152, GREEN, Tg.em, 22, 200); }
    if (Tg.plate) { leader(ctx, 880, 396, REC_X + 2, 340, CHALK, Tg.plate); tag(ctx, tr('金屬薄片', 'Metal plate'), 900, 414, CHALK, Tg.plate, 22, 190); }
    if (s.heard > 0.01) tag(ctx, tr('聽到了！', 'Heard!'), EAR.x - 10, 380, CYAN, s.heard, 22, 150);
    // 對照列
    const q = qAt(T);
    rows(ctx, ['壓緊：電阻變小 → 電流變大', 'Packed: less R → more I'], ['鬆開：電阻變大 → 電流變小', 'Loose: more R → less I'], YELLOW, CYAN, q * 2.2, s.rowsMic);
    rows(ctx, ['電流大 → 磁力強 → 薄片被吸近', 'More I → stronger pull'], ['電流小 → 磁力弱 → 薄片彈回', 'Less I → weaker pull'], YELLOW, CYAN, q * 2.2, s.rowsRec);
    drawSpeakerCard(ctx, T, s.sp);
    topMsg(ctx, s.msg, s.mc);
    energyStrip(ctx, s.lv);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    [SCENE_ID]: {
      draw: drawMain,
      steps: [
        { d: 9.0, b: ['說話', 'Speak'],
          cap: ['<strong class="accent-cyan">說話：</strong>聲波（聲能）傳進<strong class="accent-cyan">話筒</strong>，推動前面的膜片前後振動；膜片後面是裝著碳粉的小盒子，和電池接成電路。',
                '<strong class="accent-cyan">Speak:</strong> sound waves (sound energy) enter the <strong class="accent-cyan">transmitter</strong> and push its diaphragm back and forth; behind it is a box of carbon granules, wired to a battery.'] },
        { d: 10.0, b: ['話筒', 'Mic'],
          cap: ['<strong class="accent-cyan">話筒：</strong>聲音使碳粉忽鬆忽緊。壓緊時電阻變小、電流變大；鬆開時電阻變大、電流變小，聲音就變成<strong class="accent-yellow">大小改變的電流</strong>（聲能 → 電能）。',
                '<strong class="accent-cyan">Transmitter:</strong> the sound packs and loosens the carbon granules. Packed means less resistance and more current; loose means more resistance and less current, so the sound becomes a <strong class="accent-yellow">varying current</strong> (sound → electrical energy).'] },
        { d: 8.0, b: ['傳送', 'Send'],
          cap: ['<strong class="accent-orange">傳送：</strong>變動的電流經過電線傳到另一端。聲音本身沒有跑進電線，跑的是「忽大忽小的電流」，兩端的變化幾乎同時發生。',
                '<strong class="accent-orange">Send:</strong> the varying current travels along the wire to the other end. The sound itself does not go into the wire; the rising and falling current does, and both ends change almost at the same moment.'] },
        { d: 10.0, b: ['聽筒', 'Receiver'],
          cap: ['<strong class="accent-pink">聽筒：</strong>裡面有電磁鐵。電流大時磁力強，把金屬薄片吸近；電流小時磁力弱，薄片彈回，所以薄片跟著電流<strong class="accent-green">同步振動</strong>（電能 → 磁能）。',
                '<strong class="accent-pink">Receiver:</strong> it contains an electromagnet. More current gives a stronger pull that draws the metal plate in; less current lets it spring back, so the plate <strong class="accent-green">vibrates in step</strong> with the current (electrical → magnetic energy).'] },
        { d: 11.0, b: ['發聲', 'Sound'],
          cap: ['<strong class="accent-cyan">發聲：</strong>薄片推動空氣，又變回聲波。<strong class="accent-yellow">聲能 → 電能 → 磁能 → 聲能</strong>。補充：現代手機的聽筒是微型揚聲器，裡面仍有「音圈＋永久磁鐵」。',
                '<strong class="accent-cyan">Sound:</strong> the plate pushes the air and makes sound waves again. <strong class="accent-yellow">Sound → electrical → magnetic → sound</strong>. Extra: a modern phone receiver is a tiny speaker that still has a voice coil and a permanent magnet.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });
  TOTAL = SCENES[SCENE_ID].total;
  buildITab();

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  // 老師講解模式（AGENTS 10.7）的播放設定：模組層級，activate() 換場景時不重設
  const CTL = { paused: false, loop: true, endFn: null, ended: false };

  function canvasCtx() { const c = document.getElementById('phoneCanvas'); return c ? c.getContext('2d') : null; }
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
    const res = document.getElementById('phoneResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-phone');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-phone'); if (!row) return;
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

  function visible() { const c = document.getElementById('phoneCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  EmAnim.phone = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = SCENE_ID;
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; CTL.ended = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-phone'); if (row) row.innerHTML = '';
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
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) sceneId = SCENE_ID; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
