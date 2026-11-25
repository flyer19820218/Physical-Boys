/* mechanics_1_lab_spring_1125_v1.js — 「動手做｜虛擬彈簧與座標圖」實驗台（#springLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.spring = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab3 最後，並注入 <style id="lab-spring-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 規則：原長 10 cm；F ≤ 80 gw 時每 10 gw 伸長 1 cm；超過 80 gw 的部分每 10 gw 多伸長 3 cm
 *   （100 gw ＝ 8 ＋ 6 ＝ 14 cm）。曾超過限度後卸載，留下永久形變：
 *   永久形變 ＝（曾達到的最大伸長量 − 8 cm）× 2/3，四捨五入 0.1 cm（曾掛 100 gw → 4.0 cm）。
 *   此後原長 ＝ 10 ＋ 永久形變，限度內仍每 10 gw 伸長 1 cm；「更換新彈簧」才清除。
 * 互動：按鈕加掛／卸載／換新彈簧；縱軸切換 ΔX／總長度；鍵盤 ↑→ 加 10 gw、↓← 減 10 gw。
 * 動畫只在狀態變化時跑（彈簧阻尼彈跳、過勞變色），穩定後停止 RAF，不佔 CPU。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'spring', TAB = 'tab3';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };
  const LIMIT = 80, FMAX = 120, L0 = 10;

  /* ═════════ 物理 ═════════ */
  const ext = F => (F <= LIMIT ? F / 10 : 8 + (F - LIMIT) * 0.3);
  const permOf = mx => (mx > LIMIT ? Math.round((ext(mx) - 8) * 2 / 3 * 10) / 10 : 0);

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, t) { const p = hex2rgb(a), q = hex2rgb(b); return 'rgb(' + p.map((v, i) => Math.round(lerp(v, q[i], t))).join(',') + ')'; }
  function font(size) { return '700 ' + size + 'px "Noto Sans TC","JetBrains Mono",sans-serif'; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const TW = new Map();
  function tw(c, s, size) {
    const k = size + '|' + s; let w = TW.get(k);
    if (w === undefined) { c.save(); c.font = font(size); w = c.measureText(s).width; c.restore(); if (TW.size > 3000) TW.clear(); TW.set(k, w); }
    return w;
  }
  const fmt = n => String(Number((Math.round(n * 10) / 10).toFixed(1)));

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    F: 0, maxF: 0, N: L0,          /* 目前外力、曾達最大外力、目前原長（含永久形變） */
    Ld: L0, v: 0, D: 0,            /* 顯示用總長度、速度、過勞色 */
    axis: 'dx', hist: [], actions: 0, note: 'start', debug: false, boxes: [], idle: true
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  const curL = () => S.N + ext(S.F);
  const dmgTarget = () => (S.F > LIMIT ? 1 : (S.maxF > LIMIT ? 0.5 : 0));
  function rec() { S.hist.push({ F: S.F, dx: ext(S.F), L: curL(), down: false }); if (S.hist.length > 80) S.hist.shift(); }
  function resetSpring() {
    S.F = 0; S.maxF = 0; S.N = L0; S.hist = [{ F: 0, dx: 0, L: L0, down: false }];
  }

  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
  }
  function pill(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x0 + w / 2, y, color, size, 'center'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, x1: x0 + w };
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }
  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }

  /* ═════════ 左側：支架、彈簧、直尺、砝碼 ═════════ */
  const SX = 210, Y0 = 100, SC = 7;        /* 彈簧中心 x、掛點 y、每 cm 的像素 */
  const RX = 322, RW = 48;                  /* 直尺左緣與寬 */
  const yOf = L => Y0 + L * SC;

  function drawStand(c) {
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = steelV(c, 118, 136); c.fillRect(118, 0, 18, 76);
    c.fillStyle = steelH(c, 72, 96); rr(c, 100, 72, 276, 24, 8); c.fill(); c.restore();
    c.strokeStyle = '#55635f'; c.lineWidth = 2; rr(c, 100, 72, 276, 24, 8); c.stroke();
    c.fillStyle = '#d6dfdc'; c.beginPath(); c.arc(SX, 84, 6, 0, TAU); c.fill();
  }
  function drawRuler(c) {
    const h = 40 * SC + 14;
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    const g = c.createLinearGradient(RX, 0, RX + RW, 0);
    g.addColorStop(0, '#f4ecd0'); g.addColorStop(1, '#cfc298');
    c.fillStyle = g; rr(c, RX, 96, RW, h, 4); c.fill(); c.restore();
    c.strokeStyle = '#6b6240'; c.lineWidth = 2; rr(c, RX, 96, RW, h, 4); c.stroke();
    c.strokeStyle = '#3a361f';
    for (let k = 0; k <= 40; k++) {
      const y = yOf(k), big = k % 5 === 0;
      c.lineWidth = big ? 2.2 : 1.4;
      c.beginPath(); c.moveTo(RX, y); c.lineTo(RX + (big ? 16 : 9), y); c.stroke();
      if (big) label(c, String(k), RX + 33, y, '#f6f3ea', 20, 'center');
    }
    label(c, 'cm', RX + RW / 2, 56, COL.dim, 22);
  }
  function drawCoil(c, x, y0, y1, dmg) {
    const turns = 14, amp = 20, n = turns * 12;
    const f1 = mix('#e9f0ed', '#d8434a', dmg), f2 = mix('#a8b8b3', '#a3202b', dmg);
    const b1 = mix('#6f7f7b', '#6a1a22', dmg);
    if (dmg > 0.05) {                          /* 過勞暗紅光暈 */
      c.save(); c.strokeStyle = 'rgba(214,52,62,' + (0.22 * dmg) + ')'; c.lineWidth = 26; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.restore();
    }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const front = Math.cos((p0 + p1) / 2) > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? (Math.cos((p0 + p1) / 2) > 0.7 ? f1 : f2) : b1; c.lineWidth = front ? 4.2 : 3.4;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }
  function drawLeft(c) {
    drawStand(c); drawRuler(c);
    const yb = yOf(S.Ld), yN = yOf(S.N), n = Math.round(S.F / 10);
    /* 原長虛線與標籤 */
    c.save(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(163,184,176,0.7)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(168, yN); c.lineTo(RX, yN); c.stroke(); c.restore();
    pill(c, T('原長 ', 'Orig. ') + fmt(S.N) + ' cm', 162, yN, COL.dim, 22, 'right');
    /* 彈簧 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 4; c.beginPath(); c.moveTo(SX, 90); c.lineTo(SX, Y0); c.stroke();
    drawCoil(c, SX, Y0, yb, S.D);
    /* 掛鉤、桿、砝碼 */
    const plate0 = yb + 26, ph = 12;
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(SX, yb); c.lineTo(SX, plate0 + n * ph + 4); c.stroke();
    c.beginPath(); c.arc(SX, yb + 9, 7, 0, TAU); c.stroke();
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
    c.fillStyle = steelH(c, plate0 - 6, plate0 + 4); rr(c, SX - 24, plate0 - 8, 48, 8, 3); c.fill(); c.restore();
    for (let i = 0; i < n; i++) {
      const y = plate0 + i * ph, g = c.createLinearGradient(0, y, 0, y + ph);
      g.addColorStop(0, '#f9a3cf'); g.addColorStop(0.55, '#f472b6'); g.addColorStop(1, '#b8387f');
      c.fillStyle = g; rr(c, SX - 38, y, 76, ph - 1.5, 3); c.fill();
      c.strokeStyle = '#7d2358'; c.lineWidth = 1.6; rr(c, SX - 38, y, 76, ph - 1.5, 3); c.stroke();
    }
    c.fillStyle = '#d6dfdc'; rr(c, SX - 8, plate0 + n * ph + 1, 16, 7, 3); c.fill();
    /* 外力標籤 */
    if (S.F > 0) pill(c, 'F = ' + S.F + ' gw', 164, plate0 + 26 + (n * ph) / 2, COL.coral, 22, 'right');
    /* ΔX 括號 */
    const dxPx = yb - yN;
    if (dxPx > 3) {
      c.save(); c.strokeStyle = COL.teal; c.fillStyle = COL.teal; c.lineWidth = 3;
      c.shadowColor = rgba(COL.teal, 0.7); c.shadowBlur = 8;
      c.beginPath(); c.moveTo(262, yN); c.lineTo(262, yb); c.stroke();
      c.beginPath(); c.moveTo(256, yN); c.lineTo(268, yN); c.moveTo(256, yb); c.lineTo(268, yb); c.stroke();
      const a = Math.min(8, dxPx / 2);
      c.beginPath(); c.moveTo(262, yb); c.lineTo(257, yb - a); c.lineTo(267, yb - a); c.closePath(); c.fill();
      c.restore();
      label(c, 'ΔX', 292, (yN + yb) / 2, COL.teal, 22);
    }
    /* 直尺讀數 */
    c.save(); c.strokeStyle = COL.white; c.lineWidth = 2.5; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(SX + 24, yb); c.lineTo(RX + 6, yb); c.stroke(); c.restore();
    c.fillStyle = COL.coral; c.beginPath(); c.moveTo(RX + RW - 2, yb); c.lineTo(RX + RW + 12, yb - 9); c.lineTo(RX + RW + 12, yb + 9); c.closePath(); c.fill();
    pill(c, T('長度 ', 'L = ') + fmt(S.Ld) + ' cm', RX + RW + 14, yb, COL.white, 22, 'left');
  }

  /* ═════════ 右側：座標圖 ═════════ */
  const GX0 = 560, GX1 = 930, GY0 = 80, GY1 = 420;
  const gx = F => GX0 + F / FMAX * (GX1 - GX0);
  function drawGraph(c) {
    const dx = S.axis === 'dx', ymax = dx ? 25 : 40, ystep = dx ? 5 : 10;
    const gy = v => GY1 - v / ymax * (GY1 - GY0);
    const val = p => (dx ? p.dx : p.L);
    c.fillStyle = 'rgba(11,26,21,0.62)'; c.fillRect(GX0, GY0, GX1 - GX0, GY1 - GY0);
    c.fillStyle = 'rgba(214,52,62,0.13)'; c.fillRect(gx(LIMIT), GY0, GX1 - gx(LIMIT), GY1 - GY0);
    /* 格線與刻度 */
    c.lineWidth = 1.5;
    for (let F = 0; F <= FMAX; F += 20) {
      c.strokeStyle = 'rgba(163,184,176,0.2)'; c.beginPath(); c.moveTo(gx(F), GY0); c.lineTo(gx(F), GY1); c.stroke();
      label(c, String(F), gx(F), GY1 + 22, COL.white, 20);
    }
    for (let v = 0; v <= ymax; v += ystep) {
      c.strokeStyle = 'rgba(163,184,176,0.2)'; c.beginPath(); c.moveTo(GX0, gy(v)); c.lineTo(GX1, gy(v)); c.stroke();
      label(c, String(v), GX0 - 10, gy(v), COL.white, 20, 'right');
    }
    /* 座標軸 */
    c.strokeStyle = COL.white; c.fillStyle = COL.white; c.lineWidth = 3;
    c.beginPath(); c.moveTo(GX0, GY1); c.lineTo(GX1 + 14, GY1); c.moveTo(GX0, GY1); c.lineTo(GX0, GY0 - 14); c.stroke();
    c.beginPath(); c.moveTo(GX1 + 20, GY1); c.lineTo(GX1 + 8, GY1 - 6); c.lineTo(GX1 + 8, GY1 + 6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(GX0, GY0 - 20); c.lineTo(GX0 - 6, GY0 - 8); c.lineTo(GX0 + 6, GY0 - 8); c.closePath(); c.fill();
    label(c, T('外力 F（gw）', 'Force F (gw)'), (GX0 + GX1) / 2, 508, COL.coral, 22);
    label(c, dx ? T('伸長量 ΔX（cm）', 'Extension ΔX (cm)') : T('彈簧總長度 L（cm）', 'Spring length L (cm)'),
      GX0 - 50, 36, dx ? COL.teal : COL.white, 22, 'left');
    /* 彈性限度虛線 */
    c.save(); c.setLineDash([9, 7]); c.strokeStyle = COL.coral; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(gx(LIMIT), GY0); c.lineTo(gx(LIMIT), GY1); c.stroke(); c.restore();
    pill(c, T('彈性限度', 'Elastic limit'), gx(LIMIT), GY0 + 26, COL.coral, 22, 'center');
    /* 理想虎克線（目前這條彈簧的限度內直線，往回延伸到縱軸） */
    c.save(); c.setLineDash([3, 7]); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(gx(0), gy(dx ? 0 : S.N)); c.lineTo(gx(LIMIT), gy((dx ? 0 : S.N) + 8)); c.stroke(); c.restore();
    /* 軌跡 */
    const col = dx ? COL.teal : '#9fe3ff';
    c.save(); c.lineJoin = 'round'; c.lineWidth = 3;
    for (let i = 1; i < S.hist.length; i++) {
      const a = S.hist[i - 1], b = S.hist[i], down = b.F < a.F;
      c.setLineDash(down ? [3, 7] : []); c.strokeStyle = down ? '#ff6b6b' : rgba(col, 0.75);
      c.beginPath(); c.moveTo(gx(a.F), gy(val(a))); c.lineTo(gx(b.F), gy(val(b))); c.stroke();
    }
    c.restore();
    S.hist.forEach((p, i) => {
      c.fillStyle = (i > 0 && p.F < S.hist[i - 1].F) ? '#ff6b6b' : col;
      c.strokeStyle = COL.deep; c.lineWidth = 2;
      c.beginPath(); c.arc(gx(p.F), gy(val(p)), 6, 0, TAU); c.fill(); c.stroke();
    });
    /* 目前點 */
    const cx = gx(S.F), cy = gy(dx ? ext(S.F) : curL());
    c.save(); c.setLineDash([5, 5]); c.strokeStyle = 'rgba(255,128,64,0.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, GY1); c.moveTo(cx, cy); c.lineTo(GX0, cy); c.stroke(); c.restore();
    c.save(); c.shadowColor = rgba(COL.coral, 0.9); c.shadowBlur = 16;
    c.fillStyle = COL.coral; c.strokeStyle = COL.white; c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, 10, 0, TAU); c.fill(); c.stroke(); c.restore();
    /* 過不過原點 */
    const s1 = dx ? T('直線通過原點 (0, 0)', 'Line passes through (0, 0)')
      : T('F＝0 時 L＝', 'At F = 0, L = ') + fmt(S.N) + T(' cm，不過原點', ' cm: misses origin');
    label(c, s1, (GX0 + GX1) / 2 + 10, 472, dx ? COL.teal : COL.white, 22, 'center');
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(240, 250, 20, 240, 250, 380);
    gl.addColorStop(0, 'rgba(77,210,255,0.08)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 480, H);
    c.fillStyle = 'rgba(246,243,234,0.04)'; c.fillRect(0, 0, 500, H);
    drawLeft(c);
    drawGraph(c);
  }

  /* ═════════ 迴圈（只在有動作時跑，穩定就停） ═════════ */
  function settled() {
    return Math.abs(S.Ld - curL()) < 0.01 && Math.abs(S.v) < 0.06 && Math.abs(S.D - dmgTarget()) < 0.01;
  }
  function snap() { S.Ld = curL(); S.v = 0; S.D = dmgTarget(); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const acc = 95 * (curL() - S.Ld) - 5.2 * S.v;
    S.v += acc * dt; S.Ld += S.v * dt;
    S.D += (dmgTarget() - S.D) * (1 - Math.exp(-dt * 4));
    if (settled()) { snap(); S.idle = true; render(); return; }
    S.idle = false;
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !S.idle;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() { S.idle = false; sync(); if (!S.raf) render(); }

  /* ═════════ 操作 ═════════ */
  function addLoad(d) {
    if (d > 0) {
      const to = Math.min(FMAX, S.F + d);
      if (to === S.F) { S.note = 'max'; return; }
      while (S.F < to) { S.F += 10; S.maxF = Math.max(S.maxF, S.F); rec(); }
      S.note = 'add:' + d;
    } else if (S.F > 0) {                          /* 減載：結算永久形變 */
      S.F = Math.max(0, S.F + d); S.N = L0 + permOf(S.maxF);
      S.hist.push({ F: S.F, dx: ext(S.F), L: curL(), down: true });
      S.note = 'sub';
    }
  }
  function act(k) {
    if (k === 'a10') addLoad(10);
    else if (k === 'a20') addLoad(20);
    else if (k === 'a50') addLoad(50);
    else if (k === 'm10') addLoad(-10);
    else if (k === 'unload') { if (S.F > 0) { addLoad(-S.F); S.note = 'unload'; } }
    else if (k === 'new') { resetSpring(); S.note = 'new'; }
    else if (k === 'dx' || k === 'len') { S.axis = k === 'dx' ? 'dx' : 'len'; S.note = 'axis:' + S.axis; }
    else return;
    S.actions++; updateUI(); kick();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const rows = [
      [T('荷重', 'Load'), [['a10', '＋10 gw'], ['a20', '＋20 gw'], ['a50', '＋50 gw'], ['unload', T('全部取下（卸載）', 'Remove all (unload)')], ['new', T('更換新彈簧', 'New spring')]]],
      [T('縱軸', 'Y-axis'), [['dx', T('伸長量 ΔX', 'Extension ΔX')], ['len', T('彈簧總長度', 'Spring length')]]]
    ];
    for (const [name, btns] of rows) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [k, text] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = k; b.textContent = text;
        b.addEventListener('click', () => act(k));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act;
      if (k === 'dx' || k === 'len') {
        const on = (k === 'dx') === (S.axis === 'dx'); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
      } else b.disabled = (k === 'a10' || k === 'a20' || k === 'a50') ? S.F >= FMAX : (k === 'unload' ? S.F === 0 : false);
    });
    if (cv) cv.setAttribute('aria-label', T('虛擬彈簧與座標圖實驗台：按鈕加掛砝碼，方向鍵上右加 10 gw、下左減 10 gw',
      'Virtual spring and graph bench: use the buttons to hang weights; up/right arrows add 10 gw, down/left arrows remove 10 gw'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const F = S.F, d = ext(F), L = curL(), p = permOf(S.maxF);
    const l1 = T(`<b class="ls-f">外力 F ＝ ${F} gw</b>，<b class="ls-d">伸長 ΔX ＝ ${fmt(d)} cm</b>，彈簧總長 ${fmt(L)} cm`,
      `<b class="ls-f">Force F = ${F} gw</b>, <b class="ls-d">extension ΔX = ${fmt(d)} cm</b>, spring length ${fmt(L)} cm`);
    let l2;
    if (F === 0) l2 = T('掛上砝碼，算算 F ÷ ΔX 是多少？', 'Hang some weights: what is F ÷ ΔX?');
    else if (F <= LIMIT) l2 = T(`在彈性限度內：F ÷ ΔX ＝ ${F} ÷ ${fmt(d)} ＝ <b>10</b> gw/cm（定值）`,
      `Within the limit: F ÷ ΔX = ${F} ÷ ${fmt(d)} = <b>10</b> gw/cm (constant)`);
    else l2 = T(`超過限度：F ÷ ΔX ＝ ${F} ÷ ${fmt(d)} ＝ ${fmt(F / d)}，不再是 10`,
      `Past the limit: F ÷ ΔX = ${F} ÷ ${fmt(d)} = ${fmt(F / d)}, no longer 10`);
    let l3 = '';
    if (S.maxF > LIMIT) {
      l3 = T(`<div class="ls-w">彈性限度破壞！永久形變 ΔX ＝ ${p.toFixed(1)} cm${F > 0 && S.N === L0 ? '（卸載後留下）' : ''}</div>`,
        `<div class="ls-w">Elastic limit broken! Permanent set ΔX = ${p.toFixed(1)} cm${F > 0 && S.N === L0 ? ' (left after unloading)' : ''}</div>`);
    }
    const l4 = S.axis === 'dx'
      ? T('縱軸用 ΔX：F＝0 時 ΔX＝0，直線過原點，F 與 ΔX 成正比。', 'Y-axis ΔX: at F = 0, ΔX = 0, so the line passes the origin and F is proportional to ΔX.')
      : T(`縱軸用總長度：F＝0 時 L＝${fmt(S.N)} cm，直線不過原點，L 與 F 不成正比。`,
        `Y-axis length: at F = 0, L = ${fmt(S.N)} cm, so the line misses the origin and L is not proportional to F.`);
    res.innerHTML = `<div>${l1}</div><div>${l2}</div>${l3}<div class="ls-t">${l4}</div>`;
  }

  /* ═════════ 鍵盤 ═════════ */
  function onKey(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); act('a10'); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); act('m10'); }
  }
  const onVis = () => sync();

  /* ═════════ 介面契約 ═════════ */
  function bind() {
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    if (cv) ctx = cv.getContext('2d');
  }
  function activate() {
    if (S.on) deactivate();
    bind(); if (!cv) return;
    S.on = true; S.visible = true;
    buildControls(); updateUI();
    cv.addEventListener('keydown', onKey);
    cv.addEventListener('pointerdown', onFocus);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    render(); sync();
  }
  function onFocus() { cv.focus({ preventScroll: true }); }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (cv) { cv.removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onFocus); }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    return {
      F: S.F, maxF: S.maxF, natural: S.N, length: +curL().toFixed(2), shownLength: +S.Ld.toFixed(3), dx: +ext(S.F).toFixed(2),
      perm: permOf(S.maxF), axis: S.axis, points: S.hist.length, damage: +S.D.toFixed(3),
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-spring.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-spring .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-spring .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-spring .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-spring canvas{display:block;width:100%;height:auto;outline:none}
#lab-spring canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-spring .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-spring .result-box>div+div{margin-top:4px}
#lab-spring .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-spring .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:44px}
#lab-spring .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:2.8em}
#lab-spring .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-spring .lab-btn:hover{border-color:#ffe066}
#lab-spring .lab-btn:disabled{opacity:.4;cursor:default}
#lab-spring .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-spring .ls-f{color:#ff8040}#lab-spring .ls-d{color:#4dd2ff}
#lab-spring .ls-w{color:#ff8040;font-weight:700}
#lab-spring .ls-t{color:#a3b8b0}
@media (max-width:640px){#lab-spring.lab-desk{padding:12px 12px 14px}#lab-spring .lab-title{font-size:24px}#lab-spring .lab-name{min-width:0;width:100%}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜虛擬彈簧與座標圖', te = '🔧 Try it | Virtual spring and graph';
    const kz = '一次一次加掛砝碼，看彈簧伸長、座標圖上多一個點；超過 80 gw 會怎樣？再切換縱軸，親手檢查直線過不過原點。';
    const ke = 'Hang weights step by step and watch the spring stretch and the graph gain a point. What happens past 80 gw? Then switch the Y-axis and check whether the line passes through the origin.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    resetSpring();
    bind(); buildControls(); updateUI();
    snap(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
