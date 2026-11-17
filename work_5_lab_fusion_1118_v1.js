/* work_5_lab_fusion_1118_v1.js — 「動手做：要多熱，氫核才會融合？」實驗台（#fusionLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.fusion = { activate(), deactivate(), relang(), _state() }
 * 自給自足：本檔自己把實驗台 DOM 附加到 #tab3 最後、自己注入 CSS；只用頁面全域 tr()（沒有就用中文）。
 *
 * 畫面：左邊一團氫原子核（橘＋，帶正電）在「核心」裡亂跑；右邊是溫度、氫核動能 vs 融合門檻（示意）、放出能量（示意）；
 *   底部一條溫度軌（室溫／火焰／太陽表面／數百萬度／太陽核心等級，只寫示意文字，不標數字）。
 * 物理（全部示意，數值不代表真實）：
 *   溫度越高 → 氫核跑越快（動能越大）。兩核之間有電的排斥力（∝ 電量乘積／距離²），動能不夠就被推開；
 *   夠大才衝得夠近而融合。氫＋氫 → 融合中（1 質子＋1 中子），兩個融合中 → 氦核（2 質子＋2 中子），每次融合放出能量。
 *   （實際上要經過好幾步，4 個氫核才變成 1 個氦核；本檔只示意。）
 *   參數已調成：只有「太陽核心等級」附近才融合得了；數百萬度最快的一對迎面撞也撞不進門檻。
 *   課本依據：兩個較輕原子核在高溫下融合成較重原子核並放出大量能量；必須有夠大的動能才能克服庫侖排斥力；
 *   要在一千萬度以上進行（熱核反應）；核融合發電仍在研究實驗、尚未商業運轉。
 * 約束切換：太陽＝巨大重力把核心壓住（周圍畫向內的重力箭頭）；人造太陽（補充）＝強磁場把電漿懸空關在中間、不碰牆壁。
 * 互動：5 檔溫度鈕（平滑升降溫）、畫布左右拖曳（連續調溫；點底部溫度軌直接跳到該處）、
 *   鍵盤（畫布聚焦）：←／→ 降／升一檔、↑／↓ 微調、空白鍵切換「太陽／人造太陽」、Enter 重新開始。
 * 動畫：只在 activate()～deactivate() 之間跑一條 RAF；document.hidden 時停；其餘時間按鈕／語言只重畫一格。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'fusion', TAB = 'tab3';
  const W = 960, H = 540, TAU = Math.PI * 2, DPR = 2;
  const COL = Object.assign({
    bg: '#0d201a', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0', yellow: '#ffe066', teal: '#4dd2ff',
    pink: '#f472b6', orange: '#fb923c', red: '#ff4d4d', green: '#33cc99', proton: '#ff8040', neutron: '#d9e2dd', energy: '#ffe066'
  }, (window.W5 && window.W5.COL) || {});

  const T_ = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : (typeof tr === 'function' ? tr(zh, en) : zh));

  /* ───────── 溫度檔 ───────── */
  const LEVELS = [
    { zh: '室溫', en: 'Room temp', v: 22 },
    { zh: '火焰', en: 'Flame', v: 55 },
    { zh: '太陽表面', en: "Sun's surface", v: 110 },
    { zh: '數百萬度', en: 'Millions of degrees', v: 185 },
    { zh: '太陽核心等級', en: 'Sun-core level', v: 430 }
  ];
  const MODES = [
    { id: 'sun', zh: '太陽：重力把核心壓住', en: 'Sun: gravity squeezes the core' },
    { id: 'mag', zh: '人造太陽（補充）：磁場關住電漿', en: 'Artificial Sun (extra): magnetic cage' }
  ];

  /* ───────── 模擬參數（示意） ───────── */
  const CX = 300, CY = 245;          /* 核心中心 */
  const R_SOFT = 140;                /* 超過就被重力／磁場往內推 */
  const R_WALL = 165;                /* 粒子活動的硬邊界 */
  const KQ = 3.0e6, RC = 120;        /* 排斥力 F = KQ·q1q2·(1/r² − 1/RC²)，r<RC */
  const N_H = 10;
  const SPEC = {                      /* 種類：H 氫核、D 融合中、He 氦核 */
    H: { m: 1, q: 1, r: 13 },
    D: { m: 2, q: 1, r: 17 },
    He: { m: 4, q: 2, r: 21 }
  };
  const RF = { HH: 22, DD: 26 };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgba(h, a) { const [r, g, b] = hex2rgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; }

  /* ───────── 狀態 ───────── */
  const S = {
    T: 0, Tgoal: 0,          /* 溫度位置 0..1（0＝室溫，1＝太陽核心等級） */
    mode: 'sun',
    parts: [], fx: [], E: 0, fusions: 0, lastFusion: -99,
    time: 0, active: false, raf: 0, last: 0,
    boxes: [], drag: null, resultKey: ''
  };

  function speedAt(T) {
    const x = clamp(T, 0, 1) * 4, i = Math.min(3, Math.floor(x)), k = x - i;
    return lerp(LEVELS[i].v, LEVELS[i + 1].v, k);
  }
  const levelOf = T => Math.round(clamp(T, 0, 1) * 4);

  function makePart(kind, x, y, born) {
    const sp = SPEC[kind], a = rnd() * TAU, f = 0.85 + 0.3 * rnd();
    const v = speedAt(S.T) / Math.sqrt(sp.m) * f;
    return { kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, f, born: born || 0, dead: false, age: 0, trail: [] };
  }
  function freeSpot() {
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * (R_SOFT - 10);
      const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
      if (S.parts.every(p => Math.hypot(p.x - x, p.y - y) > 46)) return { x, y };
    }
    const a = rnd() * TAU; return { x: CX + Math.cos(a) * 60, y: CY + Math.sin(a) * 60 };
  }
  function reset() {
    seed = 12345; S.parts = []; S.fx = []; S.E = 0; S.fusions = 0; S.lastFusion = -99;
    for (let i = 0; i < N_H; i++) { const p = freeSpot(); S.parts.push(makePart('H', p.x, p.y, S.time - 5)); }
  }

  /* ───────── 物理一步 ───────── */
  function fuse(a, b, kind) {
    const sa = SPEC[a.kind], sb = SPEC[b.kind], m = sa.m + sb.m;
    const x = (a.x * sa.m + b.x * sb.m) / m, y = (a.y * sa.m + b.y * sb.m) / m;
    const n = { kind, x, y, vx: (a.vx * sa.m + b.vx * sb.m) / m, vy: (a.vy * sa.m + b.vy * sb.m) / m,
      f: 0.85 + 0.3 * rnd(), born: S.time, dead: false, age: 0, trail: [], ax: 0, ay: 0 };
    a.dead = b.dead = true; S.parts.push(n);
    S.fx.push({ x, y, t0: S.time, big: kind === 'He' });
    S.E = Math.min(1, S.E + (kind === 'He' ? 0.22 : 0.14));
    S.fusions++; S.lastFusion = S.time;
  }

  function step(dt) {
    S.time += dt;
    /* 溫度平滑走向目標 */
    S.T += (S.Tgoal - S.T) * Math.min(1, dt * 3.2);
    if (Math.abs(S.Tgoal - S.T) < 0.001) S.T = S.Tgoal;
    const vT = speedAt(S.T);
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    const P = S.parts;
    for (let sub = 0; sub < n; sub++) {
      for (const p of P) { p.ax = 0; p.ay = 0; }
      for (let i = 0; i < P.length; i++) {
        const a = P[i]; if (a.dead) continue;
        for (let j = i + 1; j < P.length; j++) {
          const b = P[j]; if (b.dead) continue;
          let dx = b.x - a.x, dy = b.y - a.y, r = Math.hypot(dx, dy);
          if (r >= RC) continue;
          /* 融合判斷：衝進門檻距離 */
          if (a.kind === 'H' && b.kind === 'H' && r < RF.HH) { fuse(a, b, 'D'); break; }
          if (a.kind === 'D' && b.kind === 'D' && r < RF.DD) { fuse(a, b, 'He'); break; }
          r = Math.max(r, 12); dx /= r; dy /= r;
          const F = KQ * SPEC[a.kind].q * SPEC[b.kind].q * (1 / (r * r) - 1 / (RC * RC));
          a.ax -= dx * F / SPEC[a.kind].m; a.ay -= dy * F / SPEC[a.kind].m;
          b.ax += dx * F / SPEC[b.kind].m; b.ay += dy * F / SPEC[b.kind].m;
        }
      }
      for (const p of P) {
        if (p.dead) continue;
        const sp = SPEC[p.kind];
        /* 約束：太陽＝重力往中心拉；人造太陽＝磁場把靠近牆的電漿彎回中間 */
        const ox = p.x - CX, oy = p.y - CY, d = Math.hypot(ox, oy) || 1;
        if (d > R_SOFT) {
          const k = (d - R_SOFT) * 90;
          p.ax -= ox / d * k; p.ay -= oy / d * k;
          /* 太陽＝重力把核心壓住；人造太陽＝磁場把電漿推回中間。兩者在這裡都用同一個「往中心推」示意，差別畫在畫面上 */
        }
        p.vx += p.ax * h; p.vy += p.ay * h;
        /* 恆溫：速度慢慢拉回這個溫度該有的大小 */
        const target = vT / Math.sqrt(sp.m) * p.f, v = Math.hypot(p.vx, p.vy) || 1e-6;
        const kT = Math.min(1, 2.6 * h);
        const sc = 1 + (target / v - 1) * kT;
        p.vx *= sc; p.vy *= sc;
        if (v < 1e-3) { const a = rnd() * TAU; p.vx = Math.cos(a) * target; p.vy = Math.sin(a) * target; }
        p.x += p.vx * h; p.y += p.vy * h;
        const ox2 = p.x - CX, oy2 = p.y - CY, d2 = Math.hypot(ox2, oy2);
        const lim = R_WALL - sp.r;
        if (d2 > lim) {
          const nx = ox2 / d2, ny = oy2 / d2; p.x = CX + nx * lim; p.y = CY + ny * lim;
          const vn = p.vx * nx + p.vy * ny; if (vn > 0) { p.vx -= 2 * vn * nx; p.vy -= 2 * vn * ny; }
        }
      }
      if (P.some(p => p.dead)) { S.parts = P.filter(p => !p.dead); return finishStep(dt); }
    }
    finishStep(dt);
  }
  function finishStep(dt) {
    for (const p of S.parts) {
      p.age += dt;
      p.trail.push(p.x, p.y); if (p.trail.length > 16) p.trail.splice(0, 2);
    }
    /* 氦核停留一會兒就淡出，補回 4 個新的氫核（示意：保持核心裡有燃料） */
    const now = S.time;
    for (const p of S.parts) if (p.kind === 'He' && now - p.born > 3.4) p.dead = true;
    const gone = S.parts.filter(p => p.dead).length;
    if (gone) {
      S.parts = S.parts.filter(p => !p.dead);
      for (let i = 0; i < gone * 4; i++) { const q = freeSpot(); S.parts.push(makePart('H', q.x, q.y, now)); }
    }
    S.fx = S.fx.filter(f => now - f.t0 < 1.4);
    S.E *= Math.exp(-dt * 0.28);
  }

  /* ───────── 繪圖小工具 ───────── */
  const FONT = '"Noto Sans TC","JetBrains Mono",sans-serif';
  function font(size) { return '700 ' + size + 'px ' + FONT; }
  function tw(c, s, size) { c.save(); c.font = font(size); const w = c.measureText(s).width; c.restore(); return w; }
  function fit(c, s, maxW, size, min) { while (size > min && tw(c, s, size) > maxW) size -= 1; return size; }
  function note(s, x0, y0, x1, y1, size) { S.boxes.push({ s, x0, y0, x1, y1, size }); }
  function text(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save(); c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(13,32,26,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const w = tw(c, s, size), x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    note(s, x0, y - size * 0.6, x0 + w, y + size * 0.6, size);
    return w;
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function pill(c, s, x, y, color, size, maxW) {
    size = fit(c, s, maxW - 28, size || 22, 20);
    const w = tw(c, s, size) + 28, h = size + 16, x0 = x;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2; c.strokeStyle = color; c.stroke();
    c.font = font(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, x0 + w / 2, y); c.restore();
    note(s, x0, y - h / 2, x0 + w, y + h / 2, size);
  }
  function wrap(c, s, maxW, size) {
    const out = []; let line = '';
    const tokens = /[㐀-鿿＀-￯　-〿]/.test(s) ? Array.from(s) : s.split(/(\s+)/);
    for (const t of tokens) {
      const tryL = line + t;
      if (line && tw(c, tryL.trim(), size) > maxW) { out.push(line.trim()); line = t.trim() ? t : ''; }
      else line = tryL;
    }
    if (line.trim()) out.push(line.trim());
    return out;
  }
  function ball(c, x, y, r, color, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.08, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.32, color); g.addColorStop(1, mix(color, '#0b1a15', 0.5));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  function plus(c, x, y, s, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = '#2a1206'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); c.restore();
  }
  function glow(c, x, y, r, color, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function arrow(c, x1, y1, x2, y2, color, lw, head) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    c.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    c.closePath(); c.fill(); c.restore();
  }
  function drawNucleus(c, p, a) {
    const sp = SPEC[p.kind];
    if (p.kind === 'H') { ball(c, p.x, p.y, sp.r, COL.proton, a); plus(c, p.x, p.y, 5.5, a); return; }
    const ang = (p.born * 1.7) % TAU, o = p.kind === 'D' ? 7.5 : 9.5;
    const pts = p.kind === 'D'
      ? [[COL.proton, 1], [COL.neutron, -1]].map(([col, s], i) => ({ col, x: p.x + Math.cos(ang) * o * s, y: p.y + Math.sin(ang) * o * s, pr: i === 0 }))
      : [0, 1, 2, 3].map(i => ({ col: i % 2 ? COL.neutron : COL.proton, x: p.x + Math.cos(ang + i * TAU / 4) * o, y: p.y + Math.sin(ang + i * TAU / 4) * o, pr: i % 2 === 0 }));
    for (const q of pts) { ball(c, q.x, q.y, 10.5, q.col, a); if (q.pr) plus(c, q.x, q.y, 4.2, a); }
    if (p.kind === 'He') text(c, 'He', p.x, p.y - 34, COL.yellow, 20);
  }

  /* ───────── 主繪圖 ───────── */
  let cvs = null, ctx = null;
  function draw() {
    if (!ctx) return;
    const c = ctx, T = S.T, lv = levelOf(T), now = S.time;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);

    /* 核心的熱度顏色：暗綠 → 暗紅 → 橘 → 亮黃白 */
    const heat = Math.pow(T, 0.8);
    const hotCol = T < 0.5 ? mix('#2a3b33', '#c2410c', T / 0.5) : mix('#c2410c', '#fff1b8', (T - 0.5) / 0.5);

    if (S.mode === 'sun') {
      glow(c, CX, CY, 250, '#fb923c', 0.18 + 0.22 * heat);
      c.save(); c.fillStyle = rgba('#7c2d12', 0.55); c.beginPath(); c.arc(CX, CY, 205, 0, TAU); c.fill(); c.restore();
      c.save(); c.fillStyle = hotCol; c.globalAlpha = 0.28 + 0.4 * heat; c.beginPath(); c.arc(CX, CY, R_WALL, 0, TAU); c.fill(); c.restore();
      c.save(); c.strokeStyle = rgba(COL.orange, 0.7); c.lineWidth = 2; c.setLineDash([7, 7]);
      c.beginPath(); c.arc(CX, CY, R_WALL, 0, TAU); c.stroke(); c.restore();
      /* 重力：外層向內壓的箭頭（會呼吸） */
      const pulse = 0.5 + 0.5 * Math.sin(now * 2.4);
      for (let i = 0; i < 8; i++) {
        const a = TAU * (i + 0.5) / 8, r1 = 222 - 4 * pulse, r2 = 178 - 4 * pulse;
        arrow(c, CX + Math.cos(a) * r1, CY + Math.sin(a) * r1, CX + Math.cos(a) * r2, CY + Math.sin(a) * r2, COL.yellow, 5, 15);
      }
    } else {
      /* 人造太陽：真空容器壁＋磁場線圈＋磁場線，電漿懸空不碰壁 */
      c.save(); c.strokeStyle = '#6b7f78'; c.lineWidth = 12; c.beginPath(); c.arc(CX, CY, 190, 0, TAU); c.stroke();
      c.strokeStyle = '#9fb3ab'; c.lineWidth = 2; c.beginPath(); c.arc(CX, CY, 184, 0, TAU); c.stroke(); c.restore();
      for (let i = 0; i < 12; i++) {
        const a = TAU * i / 12;
        c.save(); c.translate(CX + Math.cos(a) * 203, CY + Math.sin(a) * 203); c.rotate(a);
        c.fillStyle = '#b4744a'; rr(c, -8, -15, 16, 30, 5); c.fill();
        c.strokeStyle = '#3a2416'; c.lineWidth = 2; c.stroke(); c.restore();
      }
      c.save(); c.fillStyle = hotCol; c.globalAlpha = 0.18 + 0.4 * heat; c.beginPath(); c.arc(CX, CY, R_SOFT + 6, 0, TAU); c.fill(); c.restore();
      c.save(); c.strokeStyle = rgba(COL.pink, 0.75); c.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) {
        c.setLineDash([16, 12]); c.lineDashOffset = -now * (30 + 10 * k) * (k % 2 ? -1 : 1);
        c.beginPath(); c.arc(CX, CY, 150 + k * 10, 0, TAU); c.stroke();
      }
      c.restore();
    }

    /* 互斥：靠近的兩核之間畫往外推的小箭頭 */
    const P = S.parts;
    let shown = 0;
    for (let i = 0; i < P.length && shown < 8; i++) for (let j = i + 1; j < P.length && shown < 8; j++) {
      const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, r = Math.hypot(dx, dy);
      if (r > 70 || r < 1) continue;
      const k = clamp((70 - r) / 35, 0, 1), ux = dx / r, uy = dy / r, L = 10 + 12 * k;
      const ra = SPEC[a.kind].r + 3, rb = SPEC[b.kind].r + 3;
      c.save(); c.globalAlpha = 0.35 + 0.6 * k;
      arrow(c, a.x - ux * ra, a.y - uy * ra, a.x - ux * (ra + L), a.y - uy * (ra + L), COL.white, 3, 9);
      arrow(c, b.x + ux * rb, b.y + uy * rb, b.x + ux * (rb + L), b.y + uy * (rb + L), COL.white, 3, 9);
      c.restore(); shown++;
    }

    /* 速度拖影 */
    for (const p of P) {
      const tr_ = p.trail; if (tr_.length < 4) continue;
      c.save(); c.lineCap = 'round';
      for (let i = 2; i < tr_.length; i += 2) {
        c.globalAlpha = (i / tr_.length) * 0.45; c.strokeStyle = p.kind === 'H' ? COL.proton : COL.yellow; c.lineWidth = 6 * i / tr_.length;
        c.beginPath(); c.moveTo(tr_[i - 2], tr_[i - 1]); c.lineTo(tr_[i], tr_[i + 1]); c.stroke();
      }
      c.restore();
    }
    for (const p of P) {
      let a = clamp((now - p.born) / 0.5, 0, 1);
      if (p.kind === 'He') a *= clamp((3.4 - (now - p.born)) / 0.6, 0, 1);
      drawNucleus(c, p, a);
    }

    /* 融合閃光＋能量 */
    for (const f of S.fx) {
      const u = (now - f.t0) / 1.4;
      glow(c, f.x, f.y, 30 + 70 * u, COL.yellow, 0.85 * (1 - u));
      c.save(); c.strokeStyle = rgba(COL.yellow, 1 - u); c.lineWidth = 4;
      c.beginPath(); c.arc(f.x, f.y, 18 + 60 * u, 0, TAU); c.stroke();
      for (let i = 0; i < 6; i++) {
        const a = TAU * i / 6 + 0.3, r1 = 20 + 50 * u, r2 = r1 + 18;
        c.beginPath(); c.moveTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); c.lineTo(f.x + Math.cos(a) * r2, f.y + Math.sin(a) * r2); c.stroke();
      }
      c.restore();
    }
    if (S.fx.length) {
      const f = S.fx[S.fx.length - 1], u = (now - f.t0) / 1.4;
      c.save(); c.globalAlpha = clamp(1.6 * (1 - u), 0, 1);
      text(c, T_('融合！放出能量', 'Fusion! Energy out'), clamp(f.x, 120, 480), clamp(f.y - 48 - 20 * u, 40, 430), COL.yellow, 22);
      c.restore();
    }

    drawPanel(c, lv);
    drawTrack(c);
  }

  function drawPanel(c, lv) {
    const X = 552, PW = 392;
    const m = MODES.find(q => q.id === S.mode);
    pill(c, T_(m.zh, m.en), X, 44, S.mode === 'sun' ? COL.yellow : COL.pink, 22, PW);
    pill(c, T_('溫度：', 'Temperature: ') + T_(LEVELS[lv].zh, LEVELS[lv].en), X, 92, COL.white, 22, PW);

    /* 氫核動能 vs 門檻（示意） */
    const ke = Math.pow(speedAt(S.T) / LEVELS[4].v, 1.2), TH = 0.8;
    text(c, T_('氫核動能（示意）', 'Kinetic energy (sketch)'), X, 136, COL.white, 22, 'left');
    const bx = X, by = 152, bw = PW - 10, bh = 26;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, bx, by, bw, bh, 8); c.fill();
    const over = ke >= TH * 0.98;
    c.fillStyle = over ? COL.yellow : mix('#c2410c', COL.orange, ke / TH); rr(c, bx, by, Math.max(10, bw * ke), bh, 8); c.fill();
    c.strokeStyle = rgba(COL.white, 0.5); c.lineWidth = 2; rr(c, bx, by, bw, bh, 8); c.stroke();
    c.strokeStyle = COL.white; c.lineWidth = 3; c.setLineDash([6, 5]);
    c.beginPath(); c.moveTo(bx + bw * TH, by - 6); c.lineTo(bx + bw * TH, by + bh + 6); c.stroke(); c.restore();
    text(c, T_('▲ 融合門檻', '▲ Fusion threshold'), bx + bw * TH, by + bh + 22, COL.white, 20, 'center');

    /* 放出能量（示意） */
    text(c, T_('放出的能量（示意）', 'Energy released (sketch)'), X, 238, COL.white, 22, 'left');
    const ey = 254;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, bx, ey, bw, bh, 8); c.fill();
    if (S.E > 0.004) { c.fillStyle = COL.energy; c.shadowColor = COL.energy; c.shadowBlur = 14 * S.E; rr(c, bx, ey, Math.max(10, bw * S.E), bh, 8); c.fill(); }
    c.shadowBlur = 0; c.strokeStyle = rgba(COL.white, 0.5); c.lineWidth = 2; rr(c, bx, ey, bw, bh, 8); c.stroke(); c.restore();

    /* 狀態說明 */
    const msgs = [
      ['跑得慢：一靠近就被電的排斥力推開，完全碰不到。', 'Slow: pushed apart by electric repulsion long before they touch.'],
      ['快一點了，但離門檻還很遠，照樣被推開。', 'A bit faster, but far below the threshold. Still pushed apart.'],
      ['更快、靠更近，還是衝不過互斥。', 'Faster and closer, but still can’t beat the repulsion.'],
      ['很接近了，差一點點！幾乎都被推回去。', 'So close! Almost all are still pushed back.'],
      ['動能夠大，衝過互斥 → 融合成氦，放出大量能量！', 'Enough energy to beat the repulsion → fuse into helium, releasing lots of energy!']
    ];
    const msg = T_(msgs[lv][0], msgs[lv][1]);
    const sy = 312, sh = 112;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.85)'; rr(c, X, sy, PW - 10, sh, 12); c.fill();
    c.strokeStyle = lv === 4 ? COL.yellow : rgba(COL.white, 0.35); c.lineWidth = 2; c.stroke(); c.restore();
    let fs = 22, lines = wrap(c, msg, PW - 40, fs);
    if (lines.length > 3) { fs = 20; lines = wrap(c, msg, PW - 40, fs); }
    const lh = fs + 10, y0 = sy + sh / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((L, i) => text(c, L, X + 15, y0 + i * lh, lv === 4 ? COL.yellow : COL.white, fs, 'left'));

    /* 圖例 */
    const ly = 446;
    ball(c, X + 12, ly, 11, COL.proton); plus(c, X + 12, ly, 4.5);
    let x = X + 30 + text(c, T_('氫核（帶正電）', 'H nucleus (+)'), X + 30, ly, COL.white, 20, 'left') + 18;
    ball(c, x + 10, ly, 11, COL.neutron);
    text(c, T_('中子', 'Neutron'), x + 26, ly, COL.white, 20, 'left');
  }

  const TRK = { x0: 96, x1: 864, y: 482 };
  function drawTrack(c) {
    const { x0, x1, y } = TRK;
    c.save();
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#2a3b33'); g.addColorStop(0.45, '#c2410c'); g.addColorStop(0.75, '#fb923c'); g.addColorStop(1, '#fff1b8');
    c.fillStyle = g; rr(c, x0, y - 7, x1 - x0, 14, 7); c.fill(); c.restore();
    for (let i = 0; i < 5; i++) {
      const x = lerp(x0, x1, i / 4), on = levelOf(S.T) === i;
      c.save(); c.fillStyle = on ? COL.yellow : COL.dim; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.restore();
      const s = T_(LEVELS[i].zh, LEVELS[i].en), w = tw(c, s, 20);
      const cx = clamp(x, 8 + w / 2, W - 8 - w / 2);
      text(c, s, cx, y + 32, on ? COL.yellow : COL.dim, 20);
    }
    const kx = lerp(x0, x1, S.T);
    c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 12; c.fillStyle = COL.yellow;
    c.beginPath(); c.arc(kx, y, 13, 0, TAU); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = COL.deep; c.lineWidth = 3; c.stroke();
    c.fillStyle = COL.deep; c.beginPath(); c.moveTo(kx - 5, y); c.lineTo(kx - 1, y - 4); c.lineTo(kx - 1, y + 4); c.fill();
    c.beginPath(); c.moveTo(kx + 5, y); c.lineTo(kx + 1, y - 4); c.lineTo(kx + 1, y + 4); c.fill(); c.restore();
    text(c, T_('◀ 拖曳調溫度 ▶', '◀ drag to change temperature ▶'), 22, 20, COL.dim, 20, 'left');
  }

  /* ───────── DOM ───────── */
  const CSS = `
#lab-${KEY}{max-width:1080px;margin:28px auto 0;background:#1c3d34;border:2px solid #ffe066;border-radius:16px;padding:20px 22px;color:#f6f3ea;font-size:22px;box-sizing:border-box}
#lab-${KEY} .lab-title{font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-${KEY} .lab-task{font-size:22px;line-height:1.6;margin:0 0 14px;color:#f6f3ea}
#lab-${KEY} .canvas-wrap{background:#11261f;border:2px solid rgba(255,224,102,.45);border-radius:12px;overflow:hidden;line-height:0}
#lab-${KEY} canvas{display:block;width:100%;height:auto;cursor:ew-resize;outline:none}
#lab-${KEY} canvas:focus-visible{box-shadow:inset 0 0 0 3px #ffe066}
#lab-${KEY} .lab-controls{display:flex;flex-wrap:wrap;gap:12px 22px;margin:14px 0 0}
#lab-${KEY} .lab-group{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
#lab-${KEY} .lab-glabel{font-size:22px;font-weight:700;color:#a3b8b0;margin-right:2px}
#lab-${KEY} .lab-btn{font:inherit;font-size:22px;font-weight:700;min-height:48px;padding:6px 14px;border-radius:10px;border:2px solid rgba(255,224,102,.35);background:#11261f;color:#f6f3ea;cursor:pointer;line-height:1.25}
#lab-${KEY} .lab-btn:hover{border-color:#ffe066}
#lab-${KEY} .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-${KEY} .lab-btn:focus-visible{outline:3px solid #4dd2ff;outline-offset:2px}
#lab-${KEY} .result-box{margin-top:14px;background:#11261f;border-left:6px solid #ffe066;border-radius:10px;padding:14px 18px;font-size:22px;line-height:1.7}
#lab-${KEY} .result-box b{color:#ffe066}
#lab-${KEY} .result-box .extra{color:#f472b6}
#lab-${KEY} .result-box .small{color:#a3b8b0}
@media (max-width:620px){#lab-${KEY}{padding:14px}#lab-${KEY} .lab-title{font-size:24px}}
`;
  let built = false;
  const btns = { level: [], mode: [], reset: null };

  function mkBtn(zh, en, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lab-btn';
    b.setAttribute('data-zh', zh); b.setAttribute('data-en', en); b.textContent = T_(zh, en);
    b.addEventListener('click', onClick);
    return b;
  }
  function mkGroup(zh, en) {
    const g = document.createElement('div'); g.className = 'lab-group';
    const l = document.createElement('span'); l.className = 'lab-glabel';
    l.setAttribute('data-zh', zh); l.setAttribute('data-en', en); l.textContent = T_(zh, en);
    g.appendChild(l); return g;
  }

  function build() {
    if (built) return true;
    const panel = document.getElementById(TAB);
    if (!panel) return false;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    let box = document.getElementById('lab-' + KEY);
    if (!box) {
      box = document.createElement('div'); box.className = 'lab-desk'; box.id = 'lab-' + KEY;
      box.innerHTML =
        '<div class="lab-title" data-zh="🔧 動手做｜要多熱，氫核才會融合？" data-en="🔧 Hands-on | How hot before hydrogen nuclei fuse?">🔧 動手做｜要多熱，氫核才會融合？</div>' +
        '<div class="lab-task" data-zh="按溫度按鈕，或在畫面上左右拖曳調溫度：看帶正電、彼此互斥的氫原子核跑多快，能不能衝過互斥、融合成氦並放出能量。再切換「太陽／人造太陽」，比較兩種把它們關住的方法。" data-en="Press a temperature button or drag left/right on the picture. Watch how fast the positively charged, mutually repelling hydrogen nuclei move, and whether they can beat the repulsion and fuse into helium, releasing energy. Then switch between &quot;Sun&quot; and &quot;Artificial Sun&quot; to compare two ways of holding them in.">按溫度按鈕，或在畫面上左右拖曳調溫度：看帶正電、彼此互斥的氫原子核跑多快，能不能衝過互斥、融合成氦並放出能量。再切換「太陽／人造太陽」，比較兩種把它們關住的方法。</div>' +
        '<div class="canvas-wrap"><canvas id="' + KEY + 'LabCanvas" width="1920" height="1080" tabindex="0" style="touch-action:pan-y;width:100%" aria-label="核融合實驗台"></canvas></div>' +
        '<div class="lab-controls" id="' + KEY + 'LabControls"></div>' +
        '<div class="result-box" id="' + KEY + 'LabResult"></div>';
      panel.appendChild(box);
    }
    cvs = document.getElementById(KEY + 'LabCanvas');
    ctx = cvs.getContext('2d');
    const ctr = document.getElementById(KEY + 'LabControls'); ctr.innerHTML = '';
    const g1 = mkGroup('溫度', 'Temperature');
    btns.level = LEVELS.map((L, i) => { const b = mkBtn(L.zh, L.en, () => setLevel(i)); g1.appendChild(b); return b; });
    const g2 = mkGroup('怎麼關住', 'Held by');
    btns.mode = MODES.map(m => {
      const zh = m.id === 'sun' ? '太陽：重力' : '人造太陽（補充）：磁場', en = m.id === 'sun' ? 'Sun: gravity' : 'Artificial Sun (extra): magnets';
      const b = mkBtn(zh, en, () => setMode(m.id)); g2.appendChild(b); return b;
    });
    const g3 = mkGroup('', '');
    btns.reset = mkBtn('↺ 重新開始', '↺ Restart', () => { reset(); draw(); updateUI(true); });
    g3.appendChild(btns.reset);
    ctr.appendChild(g1); ctr.appendChild(g2); ctr.appendChild(g3);
    bindCanvas();
    built = true;
    reset(); updateUI(true); draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
    return true;
  }

  function setLevel(i) { S.Tgoal = clamp(i / 4, 0, 1); if (!S.active) { S.T = S.Tgoal; draw(); } updateUI(); }
  function setMode(id) { S.mode = id; if (!S.active) draw(); updateUI(); }

  function updateUI(force) {
    const lv = levelOf(S.Tgoal);
    btns.level.forEach((b, i) => { b.classList.toggle('active', i === lv); b.setAttribute('aria-pressed', String(i === lv)); });
    btns.mode.forEach((b, i) => { const on = MODES[i].id === S.mode; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    const lang = T_('zh', 'en'), key = lv + '|' + S.mode + '|' + lang;
    if (!force && key === S.resultKey) return;
    S.resultKey = key;
    const res = document.getElementById(KEY + 'LabResult'); if (!res) return;
    const lvTxt = [
      ['<b>室溫：</b>氫核跑得很慢，兩個帶正電的核一靠近就被電的排斥力推開，根本碰不到。', '<b>Room temperature:</b> the nuclei move slowly. Two positive nuclei are pushed apart by electric repulsion as soon as they get near, so they never touch.'],
      ['<b>火焰：</b>比室溫快一些，但動能離「融合門檻」還差得遠，照樣被推開。', '<b>Flame:</b> a little faster than room temperature, but the kinetic energy is still far below the fusion threshold. They are still pushed apart.'],
      ['<b>太陽表面：</b>跑得更快、靠得更近，但還是衝不過彼此的互斥。', "<b>Sun's surface:</b> faster and closer, but still unable to break through the repulsion."],
      ['<b>數百萬度：</b>很接近門檻了，可是幾乎都還是被推回去。', '<b>Millions of degrees:</b> very close to the threshold, yet almost all are still pushed back.'],
      ['<b>太陽核心等級：</b>動能夠大，終於衝過互斥、撞在一起融合，最後變成氦，並放出大量能量。核融合要在<b>一千萬度以上</b>的高溫才能進行，所以又叫「熱核反應」。', '<b>Sun-core level:</b> the kinetic energy is finally big enough to break through the repulsion. The nuclei collide and fuse, ending up as helium and releasing lots of energy. Fusion needs temperatures <b>above ten million degrees</b>, so it is also called a "thermonuclear reaction".']
    ][lv];
    const modeTxt = S.mode === 'sun'
      ? ['<b>太陽：</b>巨大的重力把核心的氫緊緊壓住、壓得又熱又密，所以核融合能一直維持下去。', "<b>The Sun:</b> its enormous gravity holds the hydrogen in the core, keeping it hot and dense, so fusion keeps going."]
      : ['<span class="extra"><b>人造太陽（補充）：</b></span>地球上沒有那麼大的重力，而且這麼熱的東西沒有材料碰得起。科學家用<b>強磁場</b>把高溫電漿懸空關在中間、不碰牆壁。核融合發電目前仍在研究和實驗階段，還沒有商業運轉。', '<span class="extra"><b>Artificial Sun (extra):</b></span> Earth has no such huge gravity, and no material can touch something this hot. Scientists use <b>strong magnetic fields</b> to hold the hot plasma floating in the middle, away from the walls. Fusion power is still being researched and tested and is not yet in commercial use.'];
    res.innerHTML = '<div>' + T_(lvTxt[0], lvTxt[1]) + '</div><div>' + T_(modeTxt[0], modeTxt[1]) + '</div>' +
      '<div class="small">' + T_('（畫面都是示意：為了看清楚只畫原子核、沒畫電子；實際上要經過好幾步，4 個氫核才會變成 1 個氦核。）',
        '(Everything here is a sketch: only nuclei are drawn, not electrons. In reality it takes several steps for 4 hydrogen nuclei to become 1 helium nucleus.)') + '</div>';
  }

  /* ───────── 輸入 ───────── */
  function toLogical(e) {
    const r = cvs.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function setT(v) { S.T = S.Tgoal = clamp(v, 0, 1); updateUI(); if (!S.active) draw(); }
  function bindCanvas() {
    cvs.addEventListener('pointerdown', e => {
      const p = toLogical(e);
      if (p.y > TRK.y - 30 && p.y < TRK.y + 26 && p.x > TRK.x0 - 30 && p.x < TRK.x1 + 30) setT((p.x - TRK.x0) / (TRK.x1 - TRK.x0));
      S.drag = { id: e.pointerId, x: p.x, y: p.y, moved: false };
      try { cvs.setPointerCapture(e.pointerId); } catch (_) { }
    });
    cvs.addEventListener('pointermove', e => {
      if (!S.drag || S.drag.id !== e.pointerId) return;
      const p = toLogical(e), dx = p.x - S.drag.x;
      if (Math.abs(dx) < 1) return;
      S.drag.x = p.x; S.drag.moved = true;
      setT(S.Tgoal + dx / (TRK.x1 - TRK.x0));
    });
    const end = e => { if (S.drag && S.drag.id === e.pointerId) S.drag = null; };
    cvs.addEventListener('pointerup', end); cvs.addEventListener('pointercancel', end);
    cvs.addEventListener('keydown', e => {
      const lv = levelOf(S.Tgoal);
      if (e.key === 'ArrowRight') setLevel(Math.min(4, lv + 1));
      else if (e.key === 'ArrowLeft') setLevel(Math.max(0, lv - 1));
      else if (e.key === 'ArrowUp') setT(S.Tgoal + 0.03);
      else if (e.key === 'ArrowDown') setT(S.Tgoal - 0.03);
      else if (e.key === ' ' || e.key === 'Spacebar') setMode(S.mode === 'sun' ? 'mag' : 'sun');
      else if (e.key === 'Enter') { reset(); draw(); }
      else return;
      e.preventDefault();
    });
  }

  /* ───────── 迴圈（一次一條 RAF） ───────── */
  function frame(ts) {
    S.raf = 0;
    if (!S.active || document.hidden) return;
    const dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 1 / 60;
    S.last = ts;
    step(dt); draw();
    const lv = levelOf(S.Tgoal); if (S.resultKey.split('|')[0] !== String(lv)) updateUI();
    S.raf = requestAnimationFrame(frame);
  }
  function kick() { if (S.active && !S.raf && !document.hidden) { S.last = 0; S.raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; } else kick();
  });

  /* 語言：頁面會呼叫 relang；另外掛在語言鈕上當保險（重複呼叫無害） */
  function hookLang() {
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => setTimeout(api.relang, 0)));
  }

  const api = {
    activate() { if (!build()) return; S.active = true; kick(); },
    deactivate() { S.active = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.drag = null; },
    relang() {
      if (!built) return;
      const box = document.getElementById('lab-' + KEY);
      if (box) box.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T_(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
      updateUI(true); draw();
    },
    _state() {
      return {
        T: S.T, Tgoal: S.Tgoal, level: levelOf(S.T), mode: S.mode, active: S.active, running: !!S.raf,
        counts: S.parts.reduce((o, p) => (o[p.kind] = (o[p.kind] || 0) + 1, o), {}),
        fusions: S.fusions, energy: S.E, boxes: S.boxes.slice(),
        _seedT(v) { S.T = S.Tgoal = v; }
      };
    },
    _sim(sec, mode) { if (mode) S.mode = mode; const f0 = S.fusions; for (let t = 0; t < sec; t += 1 / 60) step(1 / 60); return S.fusions - f0; },
    _reset() { reset(); }
  };
  window.W5Lab[KEY] = api;

  function init() { if (build()) hookLang(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
