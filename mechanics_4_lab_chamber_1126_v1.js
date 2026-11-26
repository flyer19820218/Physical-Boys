/* mechanics_4_lab_chamber_1126_v1.js — 「動手做｜3D 深海壓力艙」（#chamberLabCanvas，960×540）
 * 契約：window.W5Lab.chamber = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 引擎沿用舊版 mechanics_4.html 的「3D 深海壓力觀測艙」（投影、水桶環、空氣球、P–h 圖、拖曳操作、三個任務），
 * 數值一律不變：P ＝ 100 × h（gw/cm²，1 m 清水），空氣球體積比 ＝ 1033 ÷ (1033 ＋ P)，半徑 ＝ 體積比的立方根。
 * 這次只換版面：畫布 960×540、文字 22px 以上、結果框在畫布下、操作鈕縮小放最下面（AGENTS 3.5）。
 * 操作：抓空氣球上下拖＝改深度；拖空白處＝旋轉視角；滾輪＝縮放（觸控：拖球＝深度，拖空白＝旋轉）。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL } = M4Lab;
  const LW = 960, LH = 540;
  const CX = 300, CY = 285, SCALE = 180, BALL_R = 46;

  const TASK = {
    free: { tz: '自由探索｜先學會操作', te: 'Free Explore | Learn the controls', xz: '拖曳空氣球改變深度；拖曳水槽空白處旋轉視角。觀察壓力與球體積如何同步改變。', xe: 'Drag the air ball to change depth; drag empty space to orbit. Watch pressure and ball volume change together.' },
    depth: { tz: '任務一｜比較 10 m 與 30 m', te: 'Task 1 | Compare 10 m and 30 m', xz: '分別把球放到 10 m、30 m。哪個位置的水壓較大？球在哪裡較小？', xe: 'Place the ball at 10 m and 30 m. Where is water pressure greater, and where is the ball smaller?' },
    shape: { tz: '任務二｜只換容器形狀', te: 'Task 2 | Change only the container', xz: '固定深度 20 m，依序換成三種容器。記錄壓力，檢驗容器形狀會不會改變同深度的水壓。', xe: 'Keep the depth at 20 m and try all three containers. Record the pressure to test whether shape matters.' },
    compression: { tz: '任務三｜找出最大壓縮', te: 'Task 3 | Find maximum compression', xz: '先把球移到水面附近，再下潛到 40 m。比較球體積，找出被壓縮最多的位置。', xe: 'Move the ball near the surface, then dive to 40 m. Compare its volume and find maximum compression.' }
  };
  const SHAPES = { cylinder: ['圓筒', 'Cylinder'], wide: ['上寬下窄', 'Wide Top'], narrow: ['上窄下寬', 'Narrow Top'] };

  const L = {
    depth: 15, shape: 'cylinder', showField: true, yaw: -0.5, pitch: 0.16, zoom: 1, task: 'free', records: [], time: 0,
    dragMode: null, lastX: 0, lastY: 0, eventsReady: false, probeScreen: { x: CX, y: CY, r: 48 },
    depthSeen: new Set(), shapeSeen: new Set(), compressionSeen: new Set()
  };

  const pNow = () => L.depth * 100;
  const volRatio = () => 1033 / (1033 + pNow());
  const shapeName = s => T(...SHAPES[s || L.shape]);

  function setTask(t) { L.task = t; L.depthSeen.clear(); L.shapeSeen.clear(); L.compressionSeen.clear(); if (t === 'shape') L.depth = 20; touch(); }
  function setDepth(v) { L.depth = Math.max(0, Math.min(40, Math.round(Number(v) * 10) / 10)); touch(); }
  function setShape(s) { L.shape = s; touch(); }
  function resetView() { L.yaw = -0.5; L.pitch = 0.16; L.zoom = 1; }
  function record() {
    L.records.unshift({ shape: L.shape, depth: L.depth, pressure: pNow(), volume: volRatio() * 100 });
    L.records = L.records.slice(0, 4); touch();
  }
  function touch() {
    const d = L.depth;
    if (L.task === 'depth') { if (Math.abs(d - 10) <= 1) L.depthSeen.add(10); if (Math.abs(d - 30) <= 1) L.depthSeen.add(30); }
    else if (L.task === 'shape') { if (Math.abs(d - 20) <= 0.6) L.shapeSeen.add(L.shape); }
    else if (L.task === 'compression') { if (d <= 1) L.compressionSeen.add('surface'); if (d >= 39) L.compressionSeen.add('deep'); }
  }
  function feedback() {
    const d = L.depth;
    if (L.task === 'depth') return L.depthSeen.size === 2
      ? T('完成！30 m 的表壓是 10 m 的三倍，空氣球也更小。', 'Done! Gauge pressure at 30 m is three times that at 10 m, and the ball is smaller.')
      : T(`已找到 ${L.depthSeen.size}/2 個指定深度；把球拖到 10 m 與 30 m。`, `Found ${L.depthSeen.size}/2 target depths; drag to 10 m and 30 m.`);
    if (L.task === 'shape') return L.shapeSeen.size === 3
      ? T('完成！同一液體、同一深度，三種容器的壓力都相同。', 'Done! With the same liquid and depth, all three containers give the same pressure.')
      : T(`保持 20 m：已測 ${L.shapeSeen.size}/3 種容器。`, `Keep 20 m: tested ${L.shapeSeen.size}/3 containers.`);
    if (L.task === 'compression') return L.compressionSeen.size === 2
      ? T('完成！40 m 的球體積約剩 20.5%，半徑約為水面時的 59%。', 'Done! At 40 m the ball volume is about 20.5%, and its radius is about 59% of the surface value.')
      : T(`已完成 ${L.compressionSeen.size}/2 個位置；比較 0 m 與 40 m。`, `Completed ${L.compressionSeen.size}/2 positions; compare 0 m and 40 m.`);
    if (d > 32) return T('越深總壓力越大：柔軟空氣球被壓得很小，但水桶沒有變成一張平面。', 'Greater depth means greater total pressure: the flexible air ball compresses, while the tank remains a full volume of water.');
    return T('先隨意拖動柔軟空氣球。注意：壓力箭頭由四周朝內，球也會隨深度縮小。', 'Drag the flexible air ball. Notice that pressure arrows point inward and the ball shrinks with depth.');
  }
  const taskDone = () => (L.task === 'depth' && L.depthSeen.size === 2) || (L.task === 'shape' && L.shapeSeen.size === 3) || (L.task === 'compression' && L.compressionSeen.size === 2);

  /* ───────── 3D 引擎（沿用舊版） ───────── */
  function radiusAt(n) {
    if (L.shape === 'wide') return 0.94 - n * 0.34;
    if (L.shape === 'narrow') return 0.60 + n * 0.34;
    return 0.78;
  }
  function project(p) {
    const cy = Math.cos(L.yaw), sy = Math.sin(L.yaw), cp = Math.cos(L.pitch), sp = Math.sin(L.pitch);
    const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
    const y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
    const persp = 1 / Math.max(0.68, 1 + z2 * 0.18), scale = SCALE * L.zoom * persp;
    return { x: CX + x1 * scale, y: CY + y2 * scale, z: z2, scale };
  }
  function ring(depth, seg) {
    seg = seg || 48; const n = depth / 40, y = -0.92 + n * 1.84, r = radiusAt(n), pts = [];
    for (let i = 0; i <= seg; i++) { const a = Math.PI * 2 * i / seg; pts.push(project({ x: Math.cos(a) * r, y, z: Math.sin(a) * r })); }
    return pts;
  }
  function trace(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.closePath(); }
  function arrow(c, x0, y0, x1, y1, color, w) {
    const hl = w * 2, a = Math.atan2(y1 - y0, x1 - x0);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = w;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - hl * Math.cos(a - Math.PI / 6), y1 - hl * Math.sin(a - Math.PI / 6)); c.lineTo(x1 - hl * Math.cos(a + Math.PI / 6), y1 - hl * Math.sin(a + Math.PI / 6)); c.fill();
  }

  function drawBackdrop(c) {
    const g = c.createLinearGradient(0, 0, 0, LH); g.addColorStop(0, '#0d302a'); g.addColorStop(1, '#041713');
    c.fillStyle = g; c.fillRect(0, 0, LW, LH);
    c.strokeStyle = 'rgba(85,233,255,0.08)'; c.lineWidth = 1;
    for (let y = 50; y < LH; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(LW, y); c.stroke(); }
    for (let x = 0; x < LW; x += 50) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, LH); c.stroke(); }
  }
  function drawTank(c) {
    const seg = 36, top = ring(0, seg), bottom = ring(40, seg), panels = [];
    for (let i = 0; i < seg; i++) panels.push({ pts: [top[i], top[i + 1], bottom[i + 1], bottom[i]], z: (top[i].z + top[i + 1].z + bottom[i].z + bottom[i + 1].z) / 4 });
    panels.sort((a, b) => a.z - b.z).forEach((p, i) => {
      c.fillStyle = `rgba(15,169,225,${0.045 + i / panels.length * 0.055})`;
      c.beginPath(); p.pts.forEach((q, k) => (k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath(); c.fill();
    });
    trace(c, top);
    const sg = c.createRadialGradient(CX, CY - 150, 10, CX, CY - 110, 180);
    sg.addColorStop(0, 'rgba(125,241,255,0.48)'); sg.addColorStop(1, 'rgba(0,139,205,0.18)');
    c.fillStyle = sg; c.fill();
    [0, 10, 20, 30, 40].forEach(d => {
      const r = ring(d), edge = d === 0 || d === 40;
      c.strokeStyle = edge ? 'rgba(242,236,217,0.84)' : 'rgba(85,233,255,0.28)'; c.lineWidth = edge ? 4 : 2;
      trace(c, r); c.stroke();
      const lp = r.reduce((b, p) => (p.x < b.x ? p : b), r[0]);
      c.fillStyle = d === Math.round(L.depth / 10) * 10 ? '#FFFF00' : '#F2ECD9';
      c.font = '900 22px "JetBrains Mono", monospace'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
      c.fillText(d + ' m', lp.x - 10, lp.y + 7);
    });
    c.strokeStyle = 'rgba(242,236,217,0.75)'; c.lineWidth = 4;
    [0, Math.PI].forEach(a => {
      const t = project({ x: Math.cos(a) * radiusAt(0), y: -0.92, z: Math.sin(a) * radiusAt(0) });
      const b = project({ x: Math.cos(a) * radiusAt(1), y: 0.92, z: Math.sin(a) * radiusAt(1) });
      c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(b.x, b.y); c.stroke();
    });
  }
  function drawBall(c) {
    const y = -0.92 + (L.depth / 40) * 1.84, ctr = project({ x: 0, y, z: 0 });
    const r = BALL_R * L.zoom * Math.cbrt(volRatio());
    L.probeScreen = { x: ctr.x, y: ctr.y, r: Math.max(26, r) };
    if (L.showField) {
      const st = 0.55 + L.depth / 40 * 0.75;
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8 + L.time * 0.03, fd = r + 42 * st, td = r + 6;
        arrow(c, ctr.x + Math.cos(a) * fd, ctr.y + Math.sin(a) * fd, ctr.x + Math.cos(a) * td, ctr.y + Math.sin(a) * td, '#FFFF00', 4 + L.depth / 20);
      }
    }
    const gl = c.createRadialGradient(ctr.x - r * 0.28, ctr.y - r * 0.3, 3, ctr.x, ctr.y, r);
    gl.addColorStop(0, '#FFFFFF'); gl.addColorStop(0.18, '#7DF6FF'); gl.addColorStop(0.64, '#18BBD9'); gl.addColorStop(1, '#086575');
    c.fillStyle = gl; c.beginPath(); c.arc(ctr.x, ctr.y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#FF8C42'; c.lineWidth = 7; c.stroke();
  }
  function drawPanel(c) {
    const x = 620, w = 316;
    const rows = [
      [T('垂直深度 h', 'Depth h'), L.depth.toFixed(1) + ' m', '#FFFF00'],
      [T('空氣球體積', 'Ball volume'), (volRatio() * 100).toFixed(1) + '%', COL.teal],
      [T('水的表壓 P', 'Water gauge P'), pNow().toFixed(0) + ' gw/cm²', COL.coral],
      [T('容器形狀', 'Container'), shapeName(), COL.white]
    ];
    rows.forEach((r, i) => {
      const y = 56 + i * 52;
      c.fillStyle = 'rgba(5,24,20,0.85)'; c.strokeStyle = 'rgba(85,233,255,0.45)'; c.lineWidth = 2;
      c.fillRect(x, y, w, 44); c.strokeRect(x, y, w, 44);
      c.font = '700 22px "Noto Sans TC", sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = COL.white; c.fillText(r[0], x + 12, y + 23);
      c.font = '900 22px "JetBrains Mono", monospace'; c.textAlign = 'right'; c.fillStyle = r[2]; c.fillText(r[1], x + w - 12, y + 23);
    });
    /* P–h 圖 */
    const gy = 276, gh = 248;
    c.fillStyle = 'rgba(5,24,20,0.92)'; c.strokeStyle = 'rgba(85,233,255,0.7)'; c.lineWidth = 3; c.fillRect(x, gy, w, gh); c.strokeRect(x, gy, w, gh);
    c.fillStyle = '#FFFF00'; c.font = '900 22px "Noto Sans TC", sans-serif'; c.textAlign = 'center'; c.fillText(T('即時 P–h 軌跡', 'Live P–h graph'), x + w / 2, gy + 26);
    const left = x + 70, right = x + w - 24, top = gy + 56, bottom = gy + gh - 52;
    c.strokeStyle = '#F2ECD9'; c.lineWidth = 3; c.beginPath(); c.moveTo(left, top); c.lineTo(left, bottom); c.lineTo(right, bottom); c.stroke();
    c.strokeStyle = '#55E9FF'; c.lineWidth = 6; c.beginPath(); c.moveTo(left, bottom); c.lineTo(right, top); c.stroke();
    const ratio = L.depth / 40, px = left + (right - left) * ratio, py = bottom - (bottom - top) * ratio;
    c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,0,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(px, bottom); c.lineTo(px, py); c.lineTo(left, py); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#FFFF00'; c.beginPath(); c.arc(px, py, 10, 0, Math.PI * 2); c.fill();
    c.font = '900 22px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.fillText('h (m)', (left + right) / 2, gy + gh - 14);
    c.save(); c.translate(x + 22, (top + bottom) / 2); c.rotate(-Math.PI / 2); c.fillText('P', 0, 0); c.restore();
  }
  function draw(c) {
    drawBackdrop(c); drawTank(c); drawBall(c); drawPanel(c);
    c.fillStyle = '#55E9FF'; c.font = '900 22px "Noto Sans TC", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText(T('透明壓力艙｜箭頭尖端朝內', 'Transparent chamber | arrows point inward'), 22, 38);
    c.fillStyle = COL.dim; c.fillText(T('抓球上下拖＝深度　拖空白處＝旋轉', 'Drag ball = depth · Drag empty = orbit'), 22, 68);
  }

  function result() {
    const t = TASK[L.task];
    const recs = L.records.length
      ? '<div>' + T('記錄：', 'Samples: ') + L.records.map(r => `${shapeName(r.shape)} ${r.depth.toFixed(1)} m → ${r.pressure.toFixed(0)} gw/cm²、${r.volume.toFixed(1)}%`).join('　｜　') + '</div>' : '';
    return `<div><span class="lw-big ${taskDone() ? 'lw-c' : 'lw-y'}">${T(t.tz, t.te)}</span></div>` +
      `<div>${T(t.xz, t.xe)}</div>` +
      `<div><b class="lw-y">${feedback()}</b></div>` +
      `<div>${T('提醒：P 是水造成的表壓（1 m 清水 ≈ 100 gw/cm²）；算空氣球壓縮要用總壓力 1033 ＋ P。', 'Note: P is the water’s gauge pressure (1 m of water ≈ 100 gw/cm²); ball compression uses the total pressure 1033 + P.')}</div>` + recs;
  }

  function bindEvents() {
    if (L.eventsReady) return;
    const cv = document.getElementById('chamberLabCanvas'); if (!cv) return;
    L.eventsReady = true; cv.style.touchAction = 'none';
    const loc = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * LW / r.width, y: (e.clientY - r.top) * LH / r.height }; };
    const kick = () => { if (window.W5Lab.chamber) window.W5Lab.chamber.request(); };
    cv.addEventListener('pointerdown', e => {
      const p = loc(e), d = Math.hypot(p.x - L.probeScreen.x, p.y - L.probeScreen.y);
      L.dragMode = d <= L.probeScreen.r + 28 ? 'depth' : 'orbit'; L.lastX = p.x; L.lastY = p.y;
      cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!L.dragMode) return;
      const p = loc(e), dx = p.x - L.lastX, dy = p.y - L.lastY;
      if (L.dragMode === 'depth') setDepth(L.depth + dy * 40 / (SCALE * 1.84 * L.zoom));
      else { L.yaw += dx * 0.008; L.pitch = Math.max(-0.42, Math.min(0.42, L.pitch + dy * 0.004)); }
      L.lastX = p.x; L.lastY = p.y; e.preventDefault(); kick();
    });
    const fin = e => { L.dragMode = null; if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId); };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', e => { L.zoom = Math.max(0.72, Math.min(1.35, L.zoom * (e.deltaY > 0 ? 0.92 : 1.08))); e.preventDefault(); kick(); }, { passive: false });
  }

  const api = M4Lab.make({
    key: 'chamber', tab: 'tab5',
    titleZh: '動手做｜3D 深海壓力艙', titleEn: 'Try it | 3D Deep-Sea Pressure Chamber',
    subZh: '旋轉整桶水，抓住柔軟空氣球下潛到 40 m。看水從四面八方向內施壓，以及球內空氣如何被壓縮。', subEn: 'Rotate the full tank and drag the flexible air ball down to 40 m. Watch water press inward from every direction and compress the air inside.',
    tipZh: '手機／iPad：手指抓球上下拖＝改深度，拖空白處＝旋轉；也可以按下面的按鈕。', tipEn: 'On a tablet: drag the ball up/down for depth, drag empty space to orbit; or use the buttons below.',
    init: () => L,
    controls: () => [
      { kind: 'buttons', items: ['free', 'depth', 'shape', 'compression'].map((k, i) => ({
        id: 't' + k, zh: ['🧭 自由探索', '任務一｜深度', '任務二｜容器', '任務三｜壓縮'][i], en: ['🧭 Free Explore', 'Task 1 | Depth', 'Task 2 | Shape', 'Task 3 | Compression'][i],
        on: () => setTask(k), active: () => L.task === k })) },
      { kind: 'buttons', items: [
        { id: 'up', zh: '⬆ 球上升 5 m', en: '⬆ Ball up 5 m', on: () => setDepth(L.depth - 5) },
        { id: 'down', zh: '⬇ 球下潛 5 m', en: '⬇ Ball down 5 m', on: () => setDepth(L.depth + 5) },
        { id: 'field', zh: '👁 顯示壓力方向', en: '👁 Pressure arrows', on: () => { L.showField = !L.showField; }, active: () => L.showField },
        { id: 'view', zh: '🎥 重設視角', en: '🎥 Reset view', on: resetView },
        { id: 'rec', zh: '📝 記錄本次', en: '📝 Record', on: record }
      ] },
      { kind: 'buttons', items: ['cylinder', 'wide', 'narrow'].map(k => ({ id: 's' + k, zh: SHAPES[k][0], en: SHAPES[k][1], on: () => setShape(k), active: () => L.shape === k })) }
    ],
    step: (_, dt) => { L.time += dt * 60; return true; },
    draw, result,
    snapshot: s => ({ depth: s.depth, shape: s.shape, task: s.task, pressure: pNow(), volumePct: +(volRatio() * 100).toFixed(1), done: taskDone(), records: s.records.length })
  });
  const origAct = api.activate;
  api.activate = function () { bindEvents(); origAct(); };
  window.W5Lab.chamber.set = function (o) {
    if (o.task) setTask(o.task);
    if (o.shape) setShape(o.shape);
    if (o.depth != null) setDepth(o.depth);
    window.W5Lab.chamber.request();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(bindEvents, 0)); else setTimeout(bindEvents, 0);
})();
