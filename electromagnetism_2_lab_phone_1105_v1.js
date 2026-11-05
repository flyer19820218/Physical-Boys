/* electromagnetism_2_lab_phone_1105_v1.js — 「動手做：對著話筒說話」實驗台（#phoneLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.phone = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU、clear、label（直接呼叫，不複製、不修改）。
 * 控制鈕由本檔建立在 #phoneLabControls，說明字寫進 #phoneLabResult。
 *
 * 畫面（平面剖面，不做 3D、不做拖曳）：左＝說話的人＋話筒（膜片、碳粉盒、背板）、下方電池；
 *   中＝上下兩條電線（流動的電流虛線）＋小波形圖（上線＝聲音、下線＝電流）；右＝聽筒＋耳朵。
 *   頂端一排因果鏈：聲能 → 電阻變 → 電流變 → 磁力變 → 薄片振動 → 聲能。
 * 物理（簡報第 5 點）：碳粉壓緊 → 電阻小 → 電流大；鬆開 → 電阻大 → 電流小。電流＝I0＋IK·q（q∈[−1,1]），
 *   始終為正：只改變大小、不改變方向 → 聽筒電磁鐵的 N（右，朝薄片）／S（左）不對調，只有強弱改變。
 *   電路：電池＋（左）→ 下方電線往左 → 話筒背板 → 碳粉 → 膜片 → 上方電線往右 → 聽筒線圈 → 下方電線 → 電池－。
 *   聽筒線圈正面那一段電流向下 → 鐵芯內 B 向右 → 右端 N（與同課電話動畫一致）。
 *   微型揚聲器：環形永久磁鐵（後 S 前 N）＋中心極柱，音圈在縫隙中受力（方向固定、大小隨電流），推動振膜。
 * 聲音以「慢動作」呈現（真實聲音每秒振動數百次），畫面底部標示。
 * 時間：嘴巴的聲音訊號每幀記錄進歷史表；空氣中的聲波、話筒膜片、電流、聽筒都由歷史表依「位置／延遲」查出。
 * 鍵盤（畫布聚焦）：↑／↓ 音量、←／→ 音高、空白鍵切換說話／停止；按鈕都可 Tab＋Enter。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const ORANGE = C.orange, GREEN = C.green, YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, PURPLE = C.purple;
  const POLE_N = C.poleN, POLE_S = C.poleS;
  const CHALK = '#f2ecd9', MUTED = '#b9c7bf', PANEL = 'rgba(12,30,25,0.92)';

  // ───────── 小工具（與同課其他檔同一套） ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
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
  // 自動換行：英文以單字為單位、中文以字為單位；句讀不放行首
  function wrap(ctx, s, maxW, size) {
    const toks = String(s).match(/[A-Za-z0-9'’.,;:!?()\-+=×%/\u00A0]+|[ \t]+|./gu) || [];
    const out = []; let line = '';
    for (const tk of toks) {
      const nx = line + tk;
      if (line.trim() && textW(ctx, nx.trim(), size) > maxW && !/^[，。、；：！？）」\s]/.test(tk)) { out.push(line.trim()); line = tk.trim() ? tk : ''; }
      else line = nx;
    }
    if (line.trim()) out.push(line.trim());
    return out;
  }
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
  function tag(ctx, s, x, y, color, a = 1, size = 24, xMin = 6, xMax = W - 6, glow = 0) {
    if (a <= 0.01) return null;
    size = fitSize(ctx, s, xMax - xMin - 24, size, 22);
    const w = textW(ctx, s, size) + 22;
    x = clamp(x, xMin + w / 2, xMax - w / 2);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2 + glow;
    if (glow > 0.01) { ctx.shadowColor = color; ctx.shadowBlur = 16 * glow; }
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 9); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
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
  // 舞台放大時，這一點在畫布上看得到嗎（看不到就不畫字）
  function onCanvas(ctx, x, y) { const m = ctx.getTransform(), X = (m.a * x + m.c * y + m.e) / 2, Y = (m.b * x + m.d * y + m.f) / 2; return X > 12 && X < W - 12 && Y > STAGE.y0 + 12 && Y < STAGE.y1 - 12; }
  function poleBadge(ctx, x, y, isN, a, r = 15) {
    if (a <= 0.01 || !onCanvas(ctx, x, y)) return;
    const col = isN ? POLE_N : POLE_S;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; ctx.shadowColor = col; ctx.shadowBlur = 6 + 12 * a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
    txt(ctx, isN ? 'N' : 'S', x, y + 1, '#0c1e19', a, 22);
  }

  // ═════════ 導線（含流動的電流虛線；與同課電話動畫同一套畫法） ═════════
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
    ctx.globalAlpha = part === 'back' ? 0.5 : 1; ctx.strokeStyle = ORANGE;
    ctx.lineWidth = Math.max(2.4, w * (o.dw || 0.62)); ctx.shadowColor = ORANGE; ctx.shadowBlur = o.glow || 8;
    ctx.setLineDash([10, 16]);
    for (const r of runs) { ctx.lineDashOffset = cum[r.i0] - (o.off || 0); polyline(ctx, r.p); ctx.stroke(); }
    ctx.setLineDash([]); ctx.shadowBlur = 0;
    ctx.restore();
  }
  // 乾電池（橫放，正極凸頭朝左）；+ 端橘、− 端藍
  function cell(ctx, x, y, w, h) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5f8f9c'); g.addColorStop(0.45, '#2f5f6c'); g.addColorStop(1, '#1d3d47');
    ctx.fillStyle = g; ctx.strokeStyle = '#13282e'; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,128,64,0.8)'; ctx.fillRect(x + 3, y + 2, 6, h - 4);
    ctx.fillStyle = 'rgba(77,210,255,0.55)'; ctx.fillRect(x + w - 7, y + 2, 4, h - 4);
    ctx.fillStyle = '#c9d3d6'; ctx.fillRect(x - 5, y + h / 2 - 5, 5, 10);
    ctx.restore();
  }

  // ═════════ 聲音模型 ═════════
  const VOLS = { soft: 0.35, normal: 0.65, loud: 1 };
  const VOL_KEYS = ['soft', 'normal', 'loud'];
  const PITCH = { low: 0.75, high: 1.7 };            // 慢動作頻率（Hz）
  const V_SND = 90;                                  // 聲波在畫面上的速度（px/s，慢動作）
  const MOUTH_X = 112, MOUTH_Y = 316, MIC_X = 180, REC_X = 808;
  const D_MIC = (MIC_X - MOUTH_X) / V_SND;           // 嘴巴 → 話筒膜片的延遲
  const I0 = 0.6, IK = 0.36;                         // 電流＝I0＋IK×q，q∈[−1,1] → 0.24～0.96，永遠為正

  // ═════════ 版面 ═════════
  const TOPW = 160, BOTW = 468;                      // 上、下兩條電線
  const MIC = { x0: 168, x1: 292, y0: 234, y1: 382, cx0: 186, back: 270, cy0: 252, cy1: 364 };
  const BAT = { x: 430, y: 454, w: 80, h: 28 };
  const GR = { x: 326, y: 224, w: 282, h: 224 };     // 小波形圖
  const RC = { x0: 640, x1: 830, y0: 214, y1: 402, core0: 660, core1: 782, cy: 308, coil0: 674, coil1: 766, ry: 40, rx: 9, turns: 6.5 };
  const LEAD_X = 620, RET_X = 650, RET_Y = 397;
  const EAR = { x: 952, y: 308 };
  const STAGE = { y0: 112, y1: 516 };
  const CAMS = {
    all: { fx: 500, fy: 316, tx: 500, ty: 316, s: 1 },
    mic: { fx: 215, fy: 308, tx: 240, ty: 316, s: 1.7 },
    rec: { fx: 780, fy: 308, tx: 735, ty: 316, s: 1.7 }
  };
  const PANELS = { mic: { x: 470, y: 122, w: 520, h: 392 }, rec: { x: 10, y: 122, w: 476, h: 392 } };

  const GRAINS = [];
  (function () {
    let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) GRAINS.push({ u: (c + 0.5 + (rnd() - 0.5) * 0.5) / 6, y: MIC.cy0 + 7 + r * 12.6 + (rnd() - 0.5) * 3, r: 4.2 + rnd() * 1.6, k: rnd() });
  })();
  function recCoil() {
    const n = RC.turns, N = Math.ceil(n * 40), out = [];
    for (let i = 0; i <= N; i++) {
      const u = n * i / N, th = TAU * u, z = Math.sin(th);
      out.push({ x: RC.coil0 + (RC.coil1 - RC.coil0) * u / n + RC.rx * z, y: RC.cy - RC.ry * Math.cos(th), f: z > -0.02 });
    }
    return out;
  }
  const COIL = recCoil();

  // ═════════ 狀態 ═════════
  const S = {
    vol: 'normal', pitch: 'low', talk: true, rec: 'em', view: 'all',
    note: 'start',
    t: 0, last: 0, raf: 0, on: false, visible: true,
    ampTw: { from: VOLS.normal, to: VOLS.normal, t0: 0, dur: 0.01 },
    envTw: { from: 0, to: 1, t0: 0, dur: 0.4 },
    fTw: { from: PITCH.low, to: PITCH.low, t0: 0, dur: 0.01 },
    recTw: { from: 'em', to: 'em', t0: -9, dur: 0.5 },
    vTw: { from: 'all', to: 'all', t0: -9, dur: 0.6 },
    phase: 0, flow: 0,
    hT: [0], hV: [0],
    actions: 0
  };
  const twVal = tw => lerp(tw.from, tw.to, easeIO((S.t - tw.t0) / tw.dur));
  function startTw(tw, to, dur) { tw.from = twVal(tw); tw.to = to; tw.t0 = S.t; tw.dur = dur; }

  // 嘴巴的聲音訊號（歷史表查詢；線性內插）
  function sAt(tq) {
    const T = S.hT, n = T.length;
    if (!n) return 0;
    if (tq <= T[0]) return S.hV[0];
    if (tq >= T[n - 1]) return S.hV[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= tq) lo = m; else hi = m; }
    const k = (tq - T[lo]) / ((T[hi] - T[lo]) || 1);
    return lerp(S.hV[lo], S.hV[hi], k);
  }
  function mouthNow() {
    const env = twVal(S.envTw), A = twVal(S.ampTw);
    const ph = S.phase, v = 0.72 * Math.sin(ph) + 0.28 * Math.sin(2 * ph + 0.7);
    return clamp(env * A * (0.82 + 0.18 * Math.sin(TAU * 0.23 * S.t)) * v, -1, 1);
  }
  const qAt = t => sAt(t - D_MIC);                   // 話筒膜片位置（＋＝壓向碳粉）＝電流變化量
  const IAt = t => I0 + IK * qAt(t);
  // 聽筒振動體的位移（＋＝向耳朵）：電磁鐵式電流大 → 薄片被吸向電磁鐵（向左）；揚聲器式電流大 → 音圈被推向外
  const recSign = k => k === 'spk' ? 1 : -1;

  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  // ═════════ 畫面元件 ═════════
  function drawHead(open) {
    const cx = 64, cy = 300;
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
    ctx.fillStyle = '#4a3428';
    ctx.beginPath(); ctx.moveTo(cx - 44, cy - 6); ctx.bezierCurveTo(cx - 54, cy - 60, cx + 10, cy - 76, cx + 36, cy - 30); ctx.bezierCurveTo(cx + 10, cy - 46, cx - 18, cy - 36, cx - 30, cy - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(cx + 24, cy - 14, 3.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7d2f2f'; ctx.beginPath(); ctx.ellipse(cx + 41, cy + 16 + open * 0.5, 3.5, Math.max(1, open * 0.5), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 聲波：依位置的聲壓畫弧線（只畫被擠密的地方；越大聲越粗越亮）
  function soundWaves(ox, oy, xa, xb, pAt) {
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = CYAN;
    for (let x = xa; x <= xb; x += 6) {
      const p = pAt(x); if (p <= 0.05) continue;
      const r = x - ox, ang = Math.min(0.75, 62 / Math.max(r, 20));
      ctx.globalAlpha = clamp(p * 1.25, 0, 1) * 0.95; ctx.lineWidth = 2 + 2.6 * p;
      ctx.beginPath(); ctx.arc(ox, oy, r, -ang, ang); ctx.stroke();
    }
    ctx.restore();
  }
  function drawMic(q, I) {
    const d = 12 * q, front = MIC.cx0 + d, back = MIC.back;
    ctx.save();
    ctx.fillStyle = '#183a33'; ctx.strokeStyle = '#5b8c80'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(MIC.x0 + 8, MIC.y0); ctx.lineTo(MIC.x1 - 12, MIC.y0); ctx.quadraticCurveTo(MIC.x1, MIC.y0, MIC.x1, MIC.y0 + 12);
    ctx.lineTo(MIC.x1, MIC.y1 - 12); ctx.quadraticCurveTo(MIC.x1, MIC.y1, MIC.x1 - 12, MIC.y1); ctx.lineTo(MIC.x0 + 8, MIC.y1); ctx.stroke();
    ctx.globalAlpha = 0.8; ctx.fillRect(MIC.x0 + 8, MIC.y0 + 2, MIC.x1 - MIC.x0 - 10, MIC.y1 - MIC.y0 - 4); ctx.globalAlpha = 1;
    const glow = clamp((I - 0.2) / 0.8, 0, 1);
    ctx.fillStyle = `rgba(255,179,71,${0.3 * glow})`; ctx.fillRect(front + 3, MIC.cy0, back - front - 3, MIC.cy1 - MIC.cy0);
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(MIC.cx0 - 4, MIC.cy0); ctx.lineTo(back, MIC.cy0); ctx.moveTo(MIC.cx0 - 4, MIC.cy1); ctx.lineTo(back, MIC.cy1); ctx.stroke();
    const span = back - front;
    GRAINS.forEach(g => {
      const x = back - (1 - g.u) * span * 0.96 - 2;
      ctx.fillStyle = g.k > 0.5 ? '#5d5a55' : '#77736c'; ctx.strokeStyle = '#2b2a27'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, g.y, g.r, 0, TAU); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#9aa6a1'; ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 2;
    rrect(ctx, back, MIC.y0 + 10, 10, MIC.y1 - MIC.y0 - 20, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(MIC_X, MIC.y0 + 6); ctx.quadraticCurveTo(MIC_X + 2 * d, (MIC.y0 + MIC.y1) / 2, MIC_X, MIC.y1 - 6); ctx.stroke();
    ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(MIC_X, MIC.y0 + 6); ctx.quadraticCurveTo(MIC_X + 2 * d, (MIC.y0 + MIC.y1) / 2, MIC_X, MIC.y1 - 6); ctx.stroke();
    ctx.fillStyle = '#5b8c80'; ctx.fillRect(MIC_X - 6, MIC.y0 - 2, 12, 10); ctx.fillRect(MIC_X - 6, MIC.y1 - 8, 12, 10);
    ctx.restore();
  }
  function recCase() {
    ctx.save();
    ctx.fillStyle = '#183a33'; ctx.strokeStyle = '#5b8c80'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(REC_X + 4, RC.y0); ctx.lineTo(RC.x0 + 12, RC.y0); ctx.quadraticCurveTo(RC.x0, RC.y0, RC.x0, RC.y0 + 12);
    ctx.lineTo(RC.x0, RC.y1 - 12); ctx.quadraticCurveTo(RC.x0, RC.y1, RC.x0 + 12, RC.y1); ctx.lineTo(REC_X + 4, RC.y1);
    ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    ctx.restore();
  }
  // 電磁鐵式聽筒的磁力線：由右端 N 出來，經過薄片，從上下繞回左端 S
  function recField(a, dx) {
    if (a <= 0.01) return;
    ctx.save(); ctx.strokeStyle = PURPLE; ctx.lineCap = 'round';
    const bz = (q, a0, a1, a2, a3) => (1 - q) ** 3 * a0 + 3 * (1 - q) ** 2 * q * a1 + 3 * (1 - q) * q * q * a2 + q ** 3 * a3;
    for (const sd of [-1, 1]) for (const k of [0, 1]) {
      const p0 = { x: RC.core1, y: RC.cy + sd * (6 + 8 * k) }, p1 = { x: RC.core0 - 2, y: RC.cy + sd * (10 + 6 * k) };
      const c1 = { x: REC_X + dx * 0.6 + 16 + 10 * k, y: RC.cy + sd * (40 + 34 * k) }, c2 = { x: RC.core0 - 30 - 10 * k, y: RC.cy + sd * (92 + 4 * k) };
      ctx.globalAlpha = a * (k ? 0.7 : 0.95); ctx.lineWidth = 1.6 + 2 * a;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p1.x, p1.y); ctx.stroke();
      const q0 = 0.5, mx = bz(q0, p0.x, c1.x, c2.x, p1.x), my = bz(q0, p0.y, c1.y, c2.y, p1.y), nx = bz(q0 + 0.03, p0.x, c1.x, c2.x, p1.x), ny = bz(q0 + 0.03, p0.y, c1.y, c2.y, p1.y);
      arrowHead(ctx, mx, my, Math.atan2(ny - my, nx - mx), GREEN, 11);
    }
    ctx.restore();
  }
  function flowOpt(I) { return { w: 4.5, off: S.flow, glow: 4 + 10 * I, dw: 0.4 + 0.45 * I }; }
  function drawRecEM(q, I) {
    const dx = 12 * recSign('em') * q, m = clamp((I - 0.2) / 0.75, 0, 1);
    const pts = [{ x: 600, y: TOPW }, { x: LEAD_X, y: TOPW }, { x: LEAD_X, y: RC.cy - RC.ry - 6 }, { x: RC.coil0, y: RC.cy - RC.ry }]
      .concat(COIL).concat([{ x: RC.coil1, y: RET_Y }, { x: RET_X, y: RET_Y }, { x: RET_X, y: BOTW }, { x: 600, y: BOTW }]);
    const flow = flowOpt(I);
    recCase();
    recField(m, dx);
    drawPath(ctx, pts, Object.assign({ part: 'back' }, flow));
    ctx.save();
    const g = ctx.createLinearGradient(0, RC.cy - 18, 0, RC.cy + 18);
    g.addColorStop(0, '#5f6a70'); g.addColorStop(0.45, '#c3ccd0'); g.addColorStop(1, '#5f6a70');
    ctx.shadowColor = PURPLE; ctx.shadowBlur = 4 + 24 * m;
    ctx.fillStyle = g; ctx.strokeStyle = '#38423f'; ctx.lineWidth = 2;
    rrect(ctx, RC.core0, RC.cy - 18, RC.core1 - RC.core0, 36, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    const tg = ctx.createLinearGradient(RC.core0, 0, RC.core1, 0);
    tg.addColorStop(0, `rgba(114,185,255,${0.55 * m})`); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, `rgba(255,111,118,${0.55 * m})`);
    ctx.fillStyle = tg; rrect(ctx, RC.core0, RC.cy - 18, RC.core1 - RC.core0, 36, 4); ctx.fill();
    ctx.restore();
    drawPath(ctx, pts, Object.assign({ part: 'front' }, flow));
    ctx.save();
    for (let k = 0; k < Math.floor(RC.turns); k += 2) {
      const x = RC.coil0 + (RC.coil1 - RC.coil0) * (k + 0.25) / RC.turns + RC.rx;
      arrowHead(ctx, x, RC.cy + 4, Math.PI / 2, ORANGE, 9);
    }
    ctx.restore();
    // 金屬薄片
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#3c4744'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(REC_X, RC.y0 + 8); ctx.quadraticCurveTo(REC_X + 2 * dx, RC.cy, REC_X, RC.y1 - 8); ctx.stroke();
    ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(REC_X, RC.y0 + 8); ctx.quadraticCurveTo(REC_X + 2 * dx, RC.cy, REC_X, RC.y1 - 8); ctx.stroke();
    ctx.fillStyle = '#5b8c80'; ctx.fillRect(REC_X - 7, RC.y0 - 2, 14, 12); ctx.fillRect(REC_X - 7, RC.y1 - 10, 14, 12);
    ctx.restore();
    // 磁極：電流方向不變 → 右 N 左 S 永遠不對調；電流大時更亮更大
    const pa = 0.55 + 0.45 * m, pr = 13 + 4 * m;
    poleBadge(ctx, RC.core1 + 6, RC.cy - 58, true, pa, pr);
    poleBadge(ctx, RC.core0 + 8, RC.cy + 62, false, pa, pr);
  }
  // 微型揚聲器（剖面）：後板＋環形永久磁鐵（後 S 前 N）＋前板＋中心極柱；音圈套在極柱外的縫隙裡，連著振膜
  const SPK = { cx: 712, back0: 650, mag0: 664, mag1: 710, fp1: 722, pole1: 728 };
  function drawRecSpk(q, I) {
    const cy = RC.cy, d = 10 * recSign('spk') * q, m = clamp((I - 0.2) / 0.75, 0, 1);
    const coilX = 718 + d, apex = 742 + d, rim = REC_X - 2 + d * 0.25;
    const pts = [{ x: 600, y: TOPW }, { x: LEAD_X, y: TOPW }, { x: LEAD_X, y: 218 }, { x: 764, y: 218 }, { x: apex - 2, y: cy - 23 }]
      .concat([{ x: apex - 2, y: cy + 23 }, { x: 764, y: RET_Y }, { x: RET_X, y: RET_Y }, { x: RET_X, y: BOTW }, { x: 600, y: BOTW }]);
    recCase();
    const flow = flowOpt(I);
    drawPath(ctx, pts, flow);
    ctx.save();
    const steel = '#9aa6a1', edge = '#2b2a27';
    ctx.lineWidth = 2; ctx.strokeStyle = edge;
    ctx.fillStyle = steel; ctx.fillRect(SPK.back0, cy - 84, SPK.mag0 - SPK.back0, 168); ctx.strokeRect(SPK.back0, cy - 84, SPK.mag0 - SPK.back0, 168);
    ctx.fillRect(SPK.mag0, cy - 16, SPK.pole1 - SPK.mag0, 32); ctx.strokeRect(SPK.mag0, cy - 16, SPK.pole1 - SPK.mag0, 32);
    for (const sd of [-1, 1]) {
      const y0 = sd < 0 ? cy - 84 : cy + 40, mid = (SPK.mag0 + SPK.mag1) / 2;
      ctx.fillStyle = POLE_S; ctx.fillRect(SPK.mag0, y0, mid - SPK.mag0, 44);
      ctx.fillStyle = POLE_N; ctx.fillRect(mid, y0, SPK.mag1 - mid, 44);
      ctx.strokeRect(SPK.mag0, y0, SPK.mag1 - SPK.mag0, 44);
      ctx.fillStyle = steel; const fy = sd < 0 ? cy - 84 : cy + 30;
      ctx.fillRect(SPK.mag1, fy, SPK.fp1 - SPK.mag1, 54); ctx.strokeRect(SPK.mag1, fy, SPK.fp1 - SPK.mag1, 54);
    }
    // 音圈骨架（連著振膜）
    ctx.strokeStyle = '#c9b38a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(coilX - 8, cy - 23); ctx.lineTo(apex, cy - 23); ctx.moveTo(coilX - 8, cy + 23); ctx.lineTo(apex, cy + 23); ctx.stroke();
    // 振膜（錐盆）
    ctx.strokeStyle = '#d6dee0'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(apex, cy - 23); ctx.lineTo(rim, cy - 88); ctx.moveTo(apex, cy + 23); ctx.lineTo(rim, cy + 88);
    ctx.moveTo(apex, cy - 23); ctx.lineTo(apex, cy + 23); ctx.stroke();
    ctx.strokeStyle = '#7f8c88'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rim, cy - 88); ctx.quadraticCurveTo(rim + 6, cy - 94, REC_X + 2, RC.y0 + 10); ctx.moveTo(rim, cy + 88); ctx.quadraticCurveTo(rim + 6, cy + 94, REC_X + 2, RC.y1 - 10); ctx.stroke();
    // 音圈（剖面上下各 4 圈；電流越大越亮）
    ctx.fillStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.shadowBlur = 4 + 12 * m;
    for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(coilX - 6 + k * 5, cy + sd * 23, 3.4, 0, TAU); ctx.fill(); }
    ctx.shadowBlur = 0;
    ctx.restore();
    for (const yy of [cy - 62, cy + 62]) {
      const xs = (SPK.mag0 * 3 + SPK.mag1) / 4, xn = (SPK.mag0 + SPK.mag1 * 3) / 4;
      if (onCanvas(ctx, xs, yy)) txt(ctx, 'S', xs, yy, '#0c1e19', 1, 22);
      if (onCanvas(ctx, xn, yy)) txt(ctx, 'N', xn, yy, '#0c1e19', 1, 22);
    }
  }
  function drawEar() {
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
  // 小波形圖：上線＝聲音（話筒膜片）、下線＝電路電流（始終在 0 以上）
  const GSPAN = 3.0;
  const G_SND = GR.y + 62, G_ZERO = GR.y + GR.h - 14, G_SC = 80;
  function drawGraph(a) {
    if (a <= 0.01) return;
    const { x, y, w, h } = GR;
    ctx.save(); ctx.globalAlpha = a;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = 'rgba(255,179,71,0.5)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const x0 = x + 34, x1 = x + w - 16, t = S.t;
    ctx.save();
    ctx.strokeStyle = 'rgba(242,236,217,0.18)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, G_SND); ctx.lineTo(x1, G_SND); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, G_ZERO - 84); ctx.lineTo(x0, G_ZERO); ctx.lineTo(x1, G_ZERO); ctx.stroke();
    arrowHead(ctx, x1 + 4, G_ZERO, 0, 'rgba(242,236,217,0.7)', 8);
    ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,179,71,0.4)';
    ctx.beginPath(); ctx.moveTo(x0, G_ZERO - I0 * G_SC); ctx.lineTo(x1, G_ZERO - I0 * G_SC); ctx.stroke(); ctx.setLineDash([]);
    const N = 120;
    ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.shadowColor = CYAN; ctx.shadowBlur = 5;
    ctx.beginPath();
    for (let k = 0; k <= N; k++) { const u = k / N, tt = t - GSPAN * (1 - u), xx = lerp(x0 + 2, x1 - 8, u), yy = G_SND - 28 * qAt(tt); k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    ctx.strokeStyle = ORANGE; ctx.shadowColor = ORANGE; ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let k = 0; k <= N; k++) { const u = k / N, tt = t - GSPAN * (1 - u), xx = lerp(x0 + 2, x1 - 8, u), yy = G_ZERO - IAt(tt) * G_SC; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = CYAN; ctx.beginPath(); ctx.arc(x1 - 8, G_SND - 28 * qAt(t), 5, 0, TAU); ctx.fill();
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(x1 - 8, G_ZERO - IAt(t) * G_SC, 6, 0, TAU); ctx.fill();
    ctx.restore();
    const ls = tr('聲音', 'Sound'), li = tr('電流 I（只變大小）', 'Current I (size only)');
    txt(ctx, ls, x + 14, y + 20, CYAN, a, fitSize(ctx, ls, w - 28, 22, 22), 'left');
    txt(ctx, li, x + 14, G_ZERO - 98, ORANGE, a, fitSize(ctx, li, w - 28, 22, 22), 'left');
    txt(ctx, '0', x0 - 12, G_ZERO, MUTED, a, 22, 'center');
    ctx.restore();
  }
  // 因果鏈（頂端）：依波形順序一格一格亮起
  function chainItems() {
    return [
      [tr('聲能', 'Sound'), CYAN], [tr('電阻變', 'Resistance'), YELLOW], [tr('電流變', 'Current'), ORANGE],
      [tr('磁力變', 'Magnetism'), GREEN], [S.rec === 'spk' ? tr('振膜振動', 'Cone moves') : tr('薄片振動', 'Plate moves'), PINK], [tr('聲能', 'Sound'), CYAN]
    ];
  }
  function chainLit() {
    const env = Math.max(twVal(S.envTw), 0), out = [];
    for (let k = 0; k < 6; k++) out.push(clamp(Math.abs(sAt(S.t - D_MIC + 0.12 - k * 0.12)) / 0.45, 0, 1) * clamp(env * 3, 0, 1));
    return out;
  }
  function drawChain() {
    const items = chainItems(), lit = chainLit(), y = 88;
    let size = 24, gap = 34;
    const tot = () => items.reduce((s, it) => s + textW(ctx, it[0], size) + 22, 0) + gap * 5;
    while (tot() > W - 24 && size > 22) size--;
    while (tot() > W - 24 && gap > 22) gap--;
    let x = (W - tot()) / 2;
    items.forEach(([s, col], k) => {
      const w = textW(ctx, s, size) + 22, g = lit[k];
      tag(ctx, s, x + w / 2, y, col, 0.62 + 0.38 * g, size, x - 2, x + w + 2, g);
      x += w;
      if (k < 5) {
        const ga = 0.45 + 0.55 * Math.min(lit[k], lit[k + 1]);
        ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + gap - 10, y); ctx.stroke(); arrowHead(ctx, x + gap - 9, y, 0, CHALK, 8); ctx.restore();
        x += gap;
      }
    });
  }
  // 觀察放大時的說明卡
  function panelLines(v) {
    const talking = S.talk;
    if (v === 'mic') return {
      title: [tr('話筒：聲能 → 電能', 'Transmitter: sound → electrical'), CYAN],
      body: [tr('聲波推動膜片前後振動，膜片後面是裝滿碳粉的小盒子，接在電路裡。', 'Sound waves push the diaphragm back and forth. Behind it is a box of carbon granules in the circuit.')],
      rows: talking ? [[tr('膜片壓過來：碳粉壓緊 → 電阻小 → 電流大', 'Pushed in: granules packed → less\u00A0R → more\u00A0I'), YELLOW, 1],
        [tr('膜片彈回去：碳粉鬆開 → 電阻大 → 電流小', 'Springs back: granules loose → more\u00A0R → less\u00A0I'), CYAN, -1]]
        : [[tr('沒有聲音：碳粉不動 → 電阻不變 → 電流不變', 'No sound: granules still → steady R → steady I'), CHALK, 0]]
    };
    if (S.rec === 'spk') return {
      title: [tr('手機聽筒（微型揚聲器）', 'Phone receiver (tiny speaker)'), PINK],
      body: [tr('變動的電流流過音圈，音圈和永久磁鐵之間的磁力忽強忽弱，推動振膜。', 'The varying current flows through the voice coil, so the force between it and the permanent magnet rises and falls and moves the diaphragm.'),
        tr('原理相同：電流變化 → 磁力變化 → 振膜振動。', 'Same idea: current changes → force changes → diaphragm vibrates.')],
      rows: talking ? [[tr('電流大 → 磁力推得強', 'More I → stronger push'), YELLOW, 1], [tr('電流小 → 推得弱', 'Less I → weaker push'), CYAN, -1]]
        : [[tr('電流不變 → 磁力不變 → 振膜不動', 'Steady I → steady force → diaphragm still'), CHALK, 0]]
    };
    return {
      title: [tr('聽筒（電磁鐵式）：電能 → 磁能 → 聲能', 'Receiver: electrical → magnetic → sound'), PINK],
      body: [tr('電流流過線圈，鐵芯變成電磁鐵（右 N、左 S）。', 'Current in the coil makes the iron core an electromagnet (N right, S left).'),
        tr('電流只變大小、不變方向，所以 N、S 不對調，只有強弱改變。', 'The current changes size, never direction: N and S never swap, only the strength changes.')],
      rows: talking ? [[tr('電流大 → 磁力強 → 薄片被吸近', 'More I → stronger pull'), YELLOW, 1], [tr('電流小 → 磁力弱 → 薄片彈回', 'Less I → weaker pull'), CYAN, -1]]
        : [[tr('電流不變 → 磁力不變 → 薄片不動', 'Steady I → steady pull → plate still'), CHALK, 0]]
    };
  }
  function drawPanel(v, a) {
    if (a <= 0.01) return;
    const P = PANELS[v], L = panelLines(v), q = qAt(S.t), pad = 22, mw = P.w - pad * 2;
    // 放大時畫布邊緣還露出的舞台先蓋掉
    ctx.save(); ctx.globalAlpha = a * 0.92; ctx.fillStyle = C.canvas;
    if (v === 'mic') ctx.fillRect(P.x - 8, STAGE.y0, W - P.x + 8, STAGE.y1 - STAGE.y0); else ctx.fillRect(0, STAGE.y0, P.x + P.w + 8, STAGE.y1 - STAGE.y0);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0e231d'; ctx.strokeStyle = v === 'mic' ? 'rgba(85,233,255,0.55)' : 'rgba(255,120,183,0.6)'; ctx.lineWidth = 2;
    rrect(ctx, P.x, P.y, P.w, P.h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    // 先排版，放不下就把行距縮小（字級不縮）
    const title = wrap(ctx, L.title[0], mw, 26), body = L.body.map(para => wrap(ctx, para, mw, 22)), rows = L.rows.map(([s, col, sg]) => [wrap(ctx, s, mw - 24, 22), col, sg]);
    const need = k => title.length * 34 * k + 8 + body.reduce((h, ls) => h + ls.length * 30 * k + 8 * k, 0) + 8 + rows.reduce((h, [ls]) => h + ls.length * 28 + 12 + 10 * k, 0);
    let k = 1; while (k > 0.9 && need(k) > P.h - 34) k -= 0.02;
    let y = P.y + 34;
    for (const ln of title) { txt(ctx, ln, P.x + pad, y, L.title[1], a, fitSize(ctx, ln, mw, 26, 22), 'left'); y += 34 * k; }
    y += 8;
    for (const ls of body) { for (const ln of ls) { txt(ctx, ln, P.x + pad, y, CHALK, a, 22, 'left'); y += 30 * k; } y += 8 * k; }
    y += 8 + 4;
    for (const [lines, col, sg] of rows) {
      const lit = sg ? clamp(sg * q / 0.3, 0, 1) : 1, hh = lines.length * 28 + 12;
      ctx.save(); ctx.globalAlpha = a * (0.55 + 0.45 * lit); ctx.fillStyle = PANEL; ctx.strokeStyle = col; ctx.lineWidth = 2 + 1.5 * lit;
      if (lit > 0.01) { ctx.shadowColor = col; ctx.shadowBlur = 14 * lit; }
      rrect(ctx, P.x + pad - 6, y - 20, mw + 12, hh, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      lines.forEach((ln, i) => txt(ctx, ln, P.x + pad + 6, y - 1 + i * 28, col, a * (0.55 + 0.45 * lit), 22, 'left'));
      y += hh + 10 * k;
    }
  }

  // ═════════ 畫一幀 ═════════
  function camNow() {
    const tw = S.vTw, k = easeIO((S.t - tw.t0) / tw.dur), A = CAMS[tw.from], B = CAMS[tw.to];
    const o = {}; for (const key of ['fx', 'fy', 'tx', 'ty', 's']) o[key] = lerp(A[key], B[key], k);
    o.k = k; return o;
  }
  function render() {
    if (!ctx) return;
    clear(ctx);
    const t = S.t, q = qAt(t), I = IAt(t), cam = camNow();
    const zoomK = clamp((cam.s - 1) / 0.7, 0, 1), inA = 1 - seg(zoomK, 0.1, 0.6);
    const rtw = S.recTw, rk = clamp((t - rtw.t0) / rtw.dur, 0, 1), recShown = rk < 0.5 ? rtw.from : rtw.to, veil = 1 - Math.abs(1 - 2 * rk);
    const sg = recSign(recShown);

    // ── 舞台（可放大） ──
    ctx.save();
    ctx.beginPath(); ctx.rect(0, STAGE.y0, W, STAGE.y1 - STAGE.y0); ctx.clip();
    ctx.translate(cam.tx, cam.ty); ctx.scale(cam.s, cam.s); ctx.translate(-cam.fx, -cam.fy);
    soundWaves(MOUTH_X - 8, MOUTH_Y, MOUTH_X + 4, MIC_X - 6, x => sAt(t - (x - MOUTH_X) / V_SND));
    drawHead(2 + 12 * Math.abs(sAt(t)));
    const flow = flowOpt(I);
    drawPath(ctx, [{ x: BAT.x - 5, y: BOTW }, { x: 275, y: BOTW }, { x: 275, y: MIC.y1 - 6 }], flow);
    drawPath(ctx, [{ x: MIC_X, y: MIC.y0 + 2 }, { x: MIC_X, y: TOPW }, { x: 600, y: TOPW }], flow);
    drawPath(ctx, [{ x: 600, y: BOTW }, { x: BAT.x + BAT.w + 5, y: BOTW }], flow);
    arrowHead(ctx, 300, TOPW, 0, ORANGE, 11);
    arrowHead(ctx, 395, BOTW, Math.PI, ORANGE, 11);
    arrowHead(ctx, 580, BOTW, Math.PI, ORANGE, 11);
    cell(ctx, BAT.x, BAT.y, BAT.w, BAT.h);
    drawMic(q, I);
    if (recShown === 'spk') drawRecSpk(q, I); else drawRecEM(q, I);
    soundWaves(REC_X - 30, RC.cy, REC_X + 16, EAR.x - 34, x => sg * qAt(t - (x - REC_X) / V_SND));
    drawEar();
    if (veil > 0.01) { ctx.save(); ctx.globalAlpha = veil * 0.85; ctx.fillStyle = C.canvas; ctx.fillRect(612, STAGE.y0, W - 612, STAGE.y1 - STAGE.y0); ctx.restore(); }
    drawGraph(inA);
    ctx.restore();

    // ── 舞台上的標籤（放大時淡出） ──
    if (inA > 0.01) {
      const spk = recShown === 'spk';
      tag(ctx, tr('話筒（碳粉式）', 'Transmitter (carbon mic)'), 230, 132, CYAN, inA, 22, 6, 470);
      tag(ctx, spk ? tr('聽筒（微型揚聲器）', 'Receiver (tiny speaker)') : tr('聽筒（電磁鐵式）', 'Receiver (electromagnet)'), 800, 132, PINK, inA, 22, 630, 994);
      tag(ctx, tr('電池', 'Battery'), 470, 500, ORANGE, inA, 22, 290, 600);
      const b1 = tag(ctx, tr('聲波', 'Sound waves'), 130, 205, CYAN, inA, 22, 6, 300);
      if (b1) leader(ctx, 145, b1.y1, 148, 288, CYAN, inA);
      const b2 = tag(ctx, tr('膜片', 'Diaphragm'), 105, 412, CHALK, inA, 22, 6, 268);
      if (b2) leader(ctx, Math.min(b2.x1 - 8, 160), b2.y0, 181, 366, CHALK, inA);
      const b3 = tag(ctx, spk ? tr('音圈＋永久磁鐵', 'Voice coil + magnet') : tr('電磁鐵', 'Electromagnet'), 735, 190, GREEN, inA, 22, 628, 994);
      if (b3) leader(ctx, spk ? 700 : 730, b3.y1, spk ? 690 : 722, spk ? 252 : 290, GREEN, inA);
      const b4 = tag(ctx, spk ? tr('振膜', 'Diaphragm') : tr('金屬薄片', 'Metal plate'), 905, 412, CHALK, inA, 22, 836, 994);
      if (b4) leader(ctx, b4.x0 + 10, b4.y0, REC_X + 3, 372, CHALK, inA);
      // 即時狀態（依膜片位置亮起；停止時固定一句）
      if (S.talk || Math.abs(q) > 0.03) {
        const kP = clamp(q / 0.25, 0, 1), kL = clamp(-q / 0.25, 0, 1);
        tag(ctx, tr('碳粉壓緊 → 電阻小', 'Packed → less R'), 138, 470, YELLOW, inA * kP, 22, 6, 268);
        tag(ctx, tr('碳粉鬆開 → 電阻大', 'Loose → more R'), 138, 470, CYAN, inA * kL, 22, 6, 268);
        const r1 = spk ? tr('電流大 → 推力強', 'More I → stronger push') : tr('電流大 → 磁力強，吸近', 'More I → stronger pull');
        const r2 = spk ? tr('電流小 → 推力弱', 'Less I → weaker push') : tr('電流小 → 磁力弱，彈回', 'Less I → weaker pull');
        tag(ctx, r1, 826, 470, YELLOW, inA * kP, 22, 660, 994);
        tag(ctx, r2, 826, 470, CYAN, inA * kL, 22, 660, 994);
      } else {
        tag(ctx, tr('碳粉不動 → 電阻不變', 'Still → steady R'), 138, 470, CHALK, inA, 22, 6, 268);
        tag(ctx, spk ? tr('電流不變 → 振膜不動', 'Steady I → cone still') : tr('電流不變 → 薄片不動', 'Steady I → plate still'), 826, 470, CHALK, inA, 22, 660, 994);
      }
    }
    // ── 觀察說明卡 ──
    const vt = S.vTw;
    const vFrom = vt.from === '_cur' ? vt.prev : vt.from;
    if (vFrom !== 'all' && vt.to !== 'all' && vFrom !== vt.to) drawPanel(cam.k < 0.5 ? vFrom : vt.to, Math.abs(1 - 2 * cam.k));
    else { const pv = vt.to === 'all' ? vFrom : vt.to; if (pv !== 'all') drawPanel(pv, seg(zoomK, 0.4, 0.9)); }

    // ── 固定文字 ──
    drawChain();
    let top, tc;
    if (S.talk) { top = tr('說話中：聲音 → 電流大小改變（方向不變）→ 聽筒振動 → 聲音', 'Speaking: sound → current changes size (not direction) → receiver vibrates → sound'); tc = ORANGE; }
    else { top = tr('沒有聲音，電流不變，薄片不動', 'No sound: the current stays steady and the plate stays still'); tc = CHALK; }
    if (!S.talk && recShown === 'spk') top = tr('沒有聲音，電流不變，振膜不動', 'No sound: the current stays steady and the diaphragm stays still');
    bar(ctx, top, 32, tc, 24, W / 2, W - 30);
    const [msg, mc] = noteMsg();
    bar(ctx, msg, 546, mc, 24, W / 2, W - 30);
    txt(ctx, tr('慢動作示意：真實聲音每秒振動數百次', 'Slow motion: real sound vibrates hundreds of times a second'), W / 2, 584, MUTED, 1, 22);
  }
  function noteMsg() {
    const n = S.note, off = !S.talk;
    if (off && /^(soft|normal|loud|low|high)$/.test(n)) return [tr('沒有說話：先按「說話中」才看得到變化', 'Not speaking: press Speaking to see the change'), CHALK];
    switch (n) {
      case 'soft': return [tr('輕聲：碳粉鬆緊變化小，電流變化小，薄片振動小，聲音小', 'Soft: a small squeeze, a small current change, a small vibration'), CYAN];
      case 'normal': return [tr('普通音量：電流忽大忽小，聽筒跟著振動', 'Normal: the current rises and falls and the receiver follows'), CYAN];
      case 'loud': return [tr('大聲：碳粉被壓得更緊更鬆，電流變化更大，薄片振動更大，聲音更大', 'Loud: a bigger squeeze, a bigger current change, a bigger vibration'), CYAN];
      case 'low': return [tr('低音：振動較慢，電流變化較慢，波形較疏', 'Low pitch: slower vibration, slower current changes, wider waves'), YELLOW];
      case 'high': return [tr('高音：振動較快，電流變化更快，波形較密', 'High pitch: faster vibration, faster current changes, tighter waves'), YELLOW];
      case 'talk': return [tr('說話：聲能變成電流的變化，到聽筒再變回聲能', 'Speaking: sound becomes a changing current, then sound again'), ORANGE];
      case 'stop': return [tr('停止說話：電流固定，沒有變化的磁力，薄片不動，沒有聲音', 'Stopped: steady current, no changing force, still plate, no sound'), CHALK];
      case 'em': return [tr('電磁鐵式：電流變化 → 磁力忽強忽弱 → 吸動金屬薄片', 'Electromagnet: changing current → changing pull on the iron plate'), PINK];
      case 'spk': return [tr('手機聽筒仍是：電流變化 → 磁力變化 → 振膜振動', 'Phones too: changing current → changing force → diaphragm moves'), PINK];
      case 'vmic': return [tr('看話筒：碳粉壓緊電流大、鬆開電流小', 'Transmitter: packed granules, more current; loose, less'), CYAN];
      case 'vrec': return [tr('看聽筒：電流的大小變化，變成振動', 'Receiver: changes in current become vibration'), PINK];
      case 'vall': return [tr('全部：聲能 → 電能 → 磁能 → 聲能', 'Whole phone: sound → electrical → magnetic → sound'), GREEN];
      default:
        if (off) return [tr('停止說話：電流固定，沒有變化的磁力，薄片不動，沒有聲音', 'Stopped: steady current, no changing force, still plate, no sound'), CHALK];
        return [tr('試試看：改音量、改音高、停止說話，看電流怎麼變', 'Try it: change the volume or pitch, or stop, and watch the current'), YELLOW];
    }
  }

  // ═════════ 動畫迴圈（單一 RAF；離開畫面就停） ═════════
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    S.phase = (S.phase + TAU * twVal(S.fTw) * dt) % (TAU * 1000);
    S.hT.push(S.t); S.hV.push(mouthNow());
    while (S.hT.length > 2 && S.hT[1] < S.t - 8) { S.hT.shift(); S.hV.shift(); }
    S.flow += dt * 110 * IAt(S.t);
    render();
    sync();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ═════════ 操作 ═════════
  function setVol(v) { S.note = v; if (v !== S.vol) { S.vol = v; startTw(S.ampTw, VOLS[v], 0.45); } }
  function setPitch(p) { S.note = p; if (p !== S.pitch) { S.pitch = p; startTw(S.fTw, PITCH[p], 0.4); } }
  function setTalk(on) { S.note = on ? 'talk' : 'stop'; if (on !== S.talk) { S.talk = on; startTw(S.envTw, on ? 1 : 0, 0.4); } }
  function setRec(r) {
    S.note = r;
    if (r === S.rec) return;
    const tw = S.recTw, k = clamp((S.t - tw.t0) / tw.dur, 0, 1), shown = k < 0.5 ? tw.from : tw.to;
    S.rec = r; S.recTw = { from: shown, to: r, t0: S.t, dur: shown === r ? 0.01 : 0.5 };
  }
  function setView(v) {
    S.note = 'v' + v;
    if (v === S.view) return;
    const c = camNow(), tw = S.vTw;
    // 補間中途再切換：從目前的鏡頭位置接著走
    if (c.k < 0.999) { CAMS._cur = { fx: c.fx, fy: c.fy, tx: c.tx, ty: c.ty, s: c.s }; S.vTw = { from: '_cur', to: v, t0: S.t, dur: 0.6, prev: c.k < 0.5 ? (tw.from === '_cur' ? tw.prev : tw.from) : tw.to }; }
    else S.vTw = { from: S.view, to: v, t0: S.t, dur: 0.6 };
    S.view = v;
  }
  const ACTIONS = {
    soft: () => setVol('soft'), normal: () => setVol('normal'), loud: () => setVol('loud'),
    low: () => setPitch('low'), high: () => setPitch('high'),
    talk: () => setTalk(true), stop: () => setTalk(false),
    em: () => setRec('em'), spk: () => setRec('spk'),
    vall: () => setView('all'), vmic: () => setView('mic'), vrec: () => setView('rec')
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
      [tr('音量', 'Volume'), [['soft', tr('輕聲', 'Soft')], ['normal', tr('普通', 'Normal')], ['loud', tr('大聲', 'Loud')]]],
      [tr('音高', 'Pitch'), [['low', tr('低音', 'Low')], ['high', tr('高音', 'High')]]],
      [tr('說話', 'Voice'), [['talk', tr('說話中', 'Speaking')], ['stop', tr('停止', 'Stop')]]],
      [tr('聽筒', 'Receiver'), [['em', tr('電磁鐵式（早期電話）', 'Electromagnet (early phones)')], ['spk', tr('微型揚聲器（手機）', 'Tiny speaker (mobile phones)')]]],
      [tr('觀察', 'Look at'), [['vall', tr('全部', 'Whole phone')], ['vmic', tr('看話筒', 'Transmitter')], ['vrec', tr('看聽筒', 'Receiver')]]]
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
        if (VOLS[k] !== undefined) on = S.vol === k;
        else if (PITCH[k] !== undefined) on = S.pitch === k;
        else if (k === 'talk') on = S.talk;
        else if (k === 'stop') on = !S.talk;
        else if (k === 'em' || k === 'spk') on = S.rec === k;
        else if (k[0] === 'v') on = S.view === k.slice(1);
        b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      });
    }
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', tr('電話實驗台：對著話筒說話，看電流與聽筒怎麼變；方向鍵上下改音量、左右改音高，空白鍵切換說話／停止',
      'Telephone bench: speak into the transmitter and watch the current and receiver; up/down arrows change volume, left/right change pitch, space toggles speaking'));
  }
  function resultHTML() {
    let main;
    if (!S.talk) {
      main = S.rec === 'spk'
        ? tr('<strong class="accent-yellow">停止說話</strong>：電池仍送出<strong class="accent-orange">穩定的電流</strong>，但電流固定，沒有變化的磁力，振膜不動，沒有聲音。',
          '<strong class="accent-yellow">Stopped</strong>: the battery still drives a <strong class="accent-orange">steady current</strong>, but a fixed current gives no changing force, so the diaphragm stays still and there is no sound.')
        : tr('<strong class="accent-yellow">停止說話</strong>：電池仍送出<strong class="accent-orange">穩定的電流</strong>，但電流固定，沒有變化的磁力，薄片不動，沒有聲音。',
          '<strong class="accent-yellow">Stopped</strong>: the battery still drives a <strong class="accent-orange">steady current</strong>, but a fixed current gives no changing magnetic force, so the plate stays still and there is no sound.');
    } else {
      const v = {
        soft: tr('<strong class="accent-cyan">輕聲</strong>：碳粉只被壓得稍緊稍鬆，電流變化小，聽筒磁力變化小，薄片振動小，聲音小。',
          '<strong class="accent-cyan">Soft</strong>: the granules are squeezed only a little, so the current changes a little, the magnetic force changes a little, the plate vibrates a little and the sound is quiet.'),
        normal: tr('<strong class="accent-cyan">普通音量</strong>：碳粉忽鬆忽緊，電流跟著忽大忽小，聽筒磁力忽強忽弱，薄片跟著振動。',
          '<strong class="accent-cyan">Normal</strong>: the granules loosen and tighten, the current rises and falls, the receiver\'s magnetic force strengthens and weakens, and the plate vibrates along.'),
        loud: tr('<strong class="accent-cyan">大聲</strong>：碳粉被壓得更緊更鬆，電流變化更大，薄片振動更大，聲音更大。',
          '<strong class="accent-cyan">Loud</strong>: the granules are packed tighter and loosened more, so the current changes more, the plate vibrates more and the sound is louder.')
      }[S.vol];
      const p = S.pitch === 'high'
        ? tr('<strong class="accent-yellow">高音</strong>：膜片振動更快，電流變化更快，聽筒也振動得更快（波形更密）。',
          '<strong class="accent-yellow">High pitch</strong>: the diaphragm vibrates faster, so the current changes faster and the receiver vibrates faster too (tighter waves).')
        : tr('<strong class="accent-yellow">低音</strong>：振動較慢，電流變化較慢，波形較疏。',
          '<strong class="accent-yellow">Low pitch</strong>: slower vibration, so the current changes more slowly and the waves are wider.');
      main = v + '<br>' + p;
    }
    const rec = S.rec === 'spk'
      ? tr('<strong class="accent-pink">微型揚聲器（手機）</strong>：變動的電流流過<strong>音圈</strong>，音圈和<strong>永久磁鐵</strong>之間的磁力忽強忽弱，推動振膜發聲。現代手機聽筒仍是<strong class="accent-yellow">電流變化 → 磁力變化 → 振膜振動</strong>。',
        '<strong class="accent-pink">Tiny speaker (mobile phone)</strong>: the varying current flows through the <strong>voice coil</strong>, so the force between the coil and the <strong>permanent magnet</strong> rises and falls and moves the diaphragm. A modern phone receiver still works by <strong class="accent-yellow">current changes → magnetic force changes → diaphragm vibrates</strong>.')
      : tr('<strong class="accent-pink">電磁鐵式聽筒（早期電話）</strong>：電流流過線圈，鐵芯變成電磁鐵，磁力隨電流忽強忽弱，吸動前面的<strong>金屬薄片</strong>振動發聲。',
        '<strong class="accent-pink">Electromagnet receiver (early phones)</strong>: current in the coil makes the iron core an electromagnet; its pull rises and falls with the current and makes the <strong>metal plate</strong> in front vibrate and sound.');
    const sum = S.rec === 'spk'
      ? tr('電流只改變<strong>大小</strong>、不改變<strong>方向</strong>：碳粉壓緊 → 電阻小 → 電流大；鬆開 → 電阻大 → 電流小。音圈受力的方向不變，只有大小改變。<strong class="accent-yellow">聲能 → 電能 → 磁能 → 聲能</strong>。',
        'The current changes in <strong>size</strong>, never in <strong>direction</strong>: packed granules → less resistance → more current; loose → more resistance → less current. The force on the coil keeps its direction and only changes in size. <strong class="accent-yellow">Sound → electrical → magnetic → sound</strong>.')
      : tr('電流只改變<strong>大小</strong>、不改變<strong>方向</strong>：碳粉壓緊 → 電阻小 → 電流大；鬆開 → 電阻大 → 電流小。所以聽筒電磁鐵的 N、S 不會對調，只是忽強忽弱。<strong class="accent-yellow">聲能 → 電能 → 磁能 → 聲能</strong>。',
        'The current changes in <strong>size</strong>, never in <strong>direction</strong>: packed granules → less resistance → more current; loose → more resistance → less current. So the electromagnet\'s N and S never swap; it just gets stronger and weaker. <strong class="accent-yellow">Sound → electrical → magnetic → sound</strong>.');
    const slow = tr('（畫面是慢動作示意：真實聲音每秒振動數百次。）', '(Slow-motion model: real sound vibrates hundreds of times a second.)');
    return `${main}<br>${rec}<br><span class="accent-cyan">${sum}</span> ${slow}`;
  }

  // ═════════ 鍵盤（畫布聚焦時） ═════════
  function onKey(e) {
    let key = null;
    const vi = VOL_KEYS.indexOf(S.vol);
    if (e.key === 'ArrowUp') key = VOL_KEYS[clamp(vi + 1, 0, 2)];
    else if (e.key === 'ArrowDown') key = VOL_KEYS[clamp(vi - 1, 0, 2)];
    else if (e.key === 'ArrowRight') key = 'high';
    else if (e.key === 'ArrowLeft') key = 'low';
    else if (e.key === ' ' || e.key === 'Spacebar') key = S.talk ? 'stop' : 'talk';
    if (!key) return;
    e.preventDefault();
    act(key);
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('phoneLabCanvas');
    ctrl = document.getElementById('phoneLabControls');
    res = document.getElementById('phoneLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
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
    const t = S.t, q = qAt(t);
    let iMin = Infinity, iMax = -Infinity;
    for (let k = 0; k <= 150; k++) { const v = IAt(t - k * 0.02); iMin = Math.min(iMin, v); iMax = Math.max(iMax, v); }
    const rtw = S.recTw, rk = clamp((t - rtw.t0) / rtw.dur, 0, 1);
    return {
      volume: S.vol, pitch: S.pitch, talking: S.talk, receiver: S.rec, view: S.view,
      receiverShown: rk < 0.5 ? rtw.from : rtw.to,
      amp: +twVal(S.ampTw).toFixed(3), freq: +twVal(S.fTw).toFixed(3), env: +twVal(S.envTw).toFixed(3),
      mouth: +sAt(t).toFixed(3), q: +q.toFixed(3), current: +IAt(t).toFixed(3),
      currentMin: +iMin.toFixed(3), currentMax: +iMax.toFixed(3), currentSwing: +(iMax - iMin).toFixed(3),
      currentAlwaysPositive: iMin > 0, currentSteady: I0,
      diaphragm: +(12 * q).toFixed(2), plate: +(12 * recSign(S.rec) * q).toFixed(2),
      poleRight: S.rec === 'em' ? 'N' : null, poleLeft: S.rec === 'em' ? 'S' : null, batteryPlus: 'left',
      chainLit: chainLit().map(v => +v.toFixed(2)),
      camScale: +camNow().s.toFixed(3),
      note: S.note, running: !!S.raf, on: S.on, actions: S.actions, t: +t.toFixed(2)
    };
  }

  EmLab.phone = { activate, deactivate, relang, _state };
})();
