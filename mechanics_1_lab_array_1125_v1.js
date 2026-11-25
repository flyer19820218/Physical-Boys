/* mechanics_1_lab_array_1125_v1.js — 「動手做｜彈簧陣列拉力賽」實驗台（#arrayLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.array = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab5 最後，並注入 <style id="lab-array-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 內容：同一個總拉力 F 同時拉三組相同的彈簧（k＝10 gw/cm、原長 10 cm）：單條、兩條串聯、兩條並聯。
 *   單條：受力 F、伸長 F/10。串聯：每條受力 F、各伸長 F/10、總伸長 2F/10。並聯：每條受力 F/2、各伸長 F/20、總伸長 F/20。
 * 互動：滑桿（0～80 gw，步進 10）、快選鈕 F＝0／30／60、畫布左右拖曳改 F、畫布聚焦時 ←／→ 改 F。
 * 動畫只在 F 改變時跑（帶一點阻尼的彈簧伸縮），穩定後停止 RAF，不佔 CPU。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'array', TAB = 'tab5';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };
  const FMAX = 80, FSTEP = 10, PX = 7;         /* 1 cm ＝ 7 px（彈簧長度）*/
  const TOP = 94, BARPX = 16;                  /* 天花板下緣；底部長條 1 cm ＝ 16 px */
  const CX = [174, 487, 800];

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function font(size) { return '700 ' + size + 'px "Noto Sans TC","JetBrains Mono",sans-serif'; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const fmt = n => String(Number(n.toFixed(2)));

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    F: 60, d: 60, v: 0,           /* 目標拉力、畫面上的拉力（帶阻尼追過去）、速度 */
    actions: 0, note: 'start', debug: false, boxes: [], drag: null, idle: true
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, slider = null, sval = null;

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

  /* ═════════ 器材繪圖 ═════════ */
  function drawBackground(c) {
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(480, 250, 40, 480, 250, 560);
    gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
    /* 三欄的淡色底板與分隔 */
    CX.forEach(cx => {
      c.fillStyle = 'rgba(246,243,234,0.035)'; rr(c, cx - 150, 74, 300, 462 - 74 + 70, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 2; rr(c, cx - 150, 74, 300, 462 - 74 + 70, 14); c.stroke();
    });
  }

  function drawCeiling(c, cx) {
    const x0 = cx - 128, w = 256;
    c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    const g = c.createLinearGradient(0, TOP - 14, 0, TOP);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a');
    c.fillStyle = g; rr(c, x0, TOP - 14, w, 14, 5); c.fill(); c.restore();
    c.strokeStyle = '#55635f'; c.lineWidth = 2; rr(c, x0, TOP - 14, w, 14, 5); c.stroke();
    c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 2; c.beginPath();
    for (let x = x0 + 10; x < x0 + w - 6; x += 16) { c.moveTo(x, TOP - 14); c.lineTo(x - 8, TOP - 24); }
    c.stroke();
  }

  /* 立體線圈彈簧；stress(0~1) 讓它越拉越帶一點黃光 */
  function drawCoil(c, x, y0, y1, amp, stress) {
    const lead = 7, turns = 11, n = turns * 12;
    const a0 = y0 + lead, a1 = y1 - lead;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (stress > 0.02) {
      c.shadowColor = rgba(COL.yellow, 0.75 * stress); c.shadowBlur = 14 * stress;
      c.strokeStyle = rgba(COL.yellow, 0.18 * stress); c.lineWidth = 9;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.shadowBlur = 0;
    }
    c.strokeStyle = '#e9f0ed'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, a0); c.moveTo(x, a1); c.lineTo(x, y1); c.stroke();
    for (let pass = 0; pass < 2; pass++) {
      const front = pass === 1;
      c.strokeStyle = front ? '#e9f0ed' : '#6f7f7b'; c.lineWidth = front ? 4 : 3.2;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        if ((Math.cos((p0 + p1) / 2) > 0) !== front) continue;
        c.moveTo(x + amp * Math.sin(p0), lerp(a0, a1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(a0, a1, s1));
      }
      c.stroke();
    }
    c.restore();
  }
  function ring(c, x, y) {
    c.save(); c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.stroke(); c.restore();
  }

  /* 尺寸線：上下兩端的橫短線＋垂直線 */
  function dimLine(c, x, ya, yb, color, dashed) {
    c.save(); c.strokeStyle = color; c.lineWidth = 3; c.lineCap = 'round';
    if (dashed) c.setLineDash([5, 5]);
    c.beginPath(); c.moveTo(x, ya); c.lineTo(x, yb); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(x - 6, ya); c.lineTo(x + 6, ya); c.moveTo(x - 6, yb); c.lineTo(x + 6, yb); c.stroke(); c.restore();
  }
  function ghost(c, x0, x1, y) {
    c.save(); c.strokeStyle = 'rgba(163,184,176,0.55)'; c.lineWidth = 2; c.setLineDash([6, 6]);
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
  }

  function drawArrow(c, x, y0, F, d) {
    const len = 14 + d * 0.72;
    if (F <= 0.01 && d < 0.5) return len;
    c.save(); c.shadowColor = rgba(COL.coral, 0.8); c.shadowBlur = 14; c.fillStyle = COL.coral;
    rr(c, x - 5, y0, 10, Math.max(4, len - 14), 4); c.fill();
    c.beginPath(); c.moveTo(x, y0 + len + 6); c.lineTo(x - 17, y0 + len - 14); c.lineTo(x + 17, y0 + len - 14); c.closePath(); c.fill();
    c.restore();
    return len;
  }

  function groupTitle(c, i, zh, en) { label(c, T(zh, en), CX[i], 23, COL.white, 24); }

  /* 每條受力＋伸長的標示（兩行：黃、青） */
  function tags(c, x, y, align, force, ext) {
    label(c, fmt(force) + ' gw', x, y - 14, COL.yellow, 22, align);
    label(c, fmt(ext) + ' cm', x, y + 14, COL.teal, 22, align);
  }

  function drawSingle(c) {
    const gx = CX[0], cx = gx + 20, F = S.F, d = S.d;
    const e = d / 10, L = (10 + e) * PX, yb = TOP + L;
    drawCeiling(c, gx);
    drawCoil(c, cx, TOP, yb, 14, d / FMAX);
    ring(c, cx, yb + 6);
    const nat = TOP + 10 * PX;
    ghost(c, cx - 48, cx + 48, nat);
    dimLine(c, cx - 40, TOP, nat, COL.dim, false);
    label(c, T('原長 10 cm', 'Rest 10 cm'), cx - 48, TOP + 35, COL.dim, 22, 'right');
    if (yb - nat > 3) dimLine(c, cx - 40, nat, yb, COL.teal, false);
    tags(c, cx + 28, (TOP + yb) / 2, 'left', F, F / 10);
    const al = drawArrow(c, cx, yb + 14, F, d);
    label(c, T('F＝', 'F = ') + fmt(F) + ' gw', cx - 24, yb + 14 + Math.max(16, al / 2), COL.coral, 22, 'right');
    return { total: F / 10, disp: d / 10 };
  }

  function drawSeries(c) {
    const cx = CX[1], F = S.F, d = S.d;
    const e = d / 10, L = (10 + e) * PX, y1 = TOP + L, y2 = y1 + L;
    drawCeiling(c, cx);
    drawCoil(c, cx, TOP, y1, 14, d / FMAX);
    ring(c, cx, y1);
    drawCoil(c, cx, y1, y2, 14, d / FMAX);
    ring(c, cx, y2 + 6);
    const nat = TOP + 20 * PX;
    ghost(c, cx - 48, cx + 48, nat);
    dimLine(c, cx - 40, TOP, nat, COL.dim, false);
    label(c, T('原長 20 cm', 'Rest 20 cm'), cx - 48, TOP + 70, COL.dim, 22, 'right');
    if (y2 - nat > 3) dimLine(c, cx - 40, nat, y2, COL.teal, false);
    tags(c, cx + 28, (TOP + y1) / 2, 'left', F, F / 10);
    tags(c, cx + 28, (y1 + y2) / 2, 'left', F, F / 10);
    const al = drawArrow(c, cx, y2 + 14, F, d);
    label(c, T('F＝', 'F = ') + fmt(F) + ' gw', cx - 24, y2 + 14 + Math.max(16, al / 2), COL.coral, 22, 'right');
    return { total: 2 * F / 10, disp: 2 * d / 10 };
  }

  function drawParallel(c) {
    const cx = CX[2], F = S.F, d = S.d, dx = 50;
    const e = d / 20, L = (10 + e) * PX, yb = TOP + L;
    drawCeiling(c, cx);
    drawCoil(c, cx - dx, TOP, yb, 12, d / FMAX / 2);
    drawCoil(c, cx + dx, TOP, yb, 12, d / FMAX / 2);
    /* 底部橫桿 */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    const g = c.createLinearGradient(0, yb, 0, yb + 12);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a');
    c.fillStyle = g; rr(c, cx - dx - 18, yb, 2 * dx + 36, 12, 5); c.fill(); c.restore();
    c.strokeStyle = '#55635f'; c.lineWidth = 2; rr(c, cx - dx - 18, yb, 2 * dx + 36, 12, 5); c.stroke();
    const nat = TOP + 10 * PX;
    ghost(c, cx - dx - 18, cx + dx + 18, nat);
    dimLine(c, cx, TOP, nat, COL.dim, false);
    if (yb - nat > 3) dimLine(c, cx, nat, yb, COL.teal, false);
    tags(c, cx - dx - 24, (TOP + yb) / 2, 'right', F / 2, F / 20);
    tags(c, cx + dx + 24, (TOP + yb) / 2, 'left', F / 2, F / 20);
    const al = drawArrow(c, cx, yb + 16, F, d);
    label(c, T('F＝', 'F = ') + fmt(F) + ' gw', cx - 24, yb + 16 + Math.max(16, al / 2), COL.coral, 22, 'right');
    return { total: F / 20, disp: d / 20 };
  }

  /* 底部三條青色長條：同一條基準線、同一比例尺 */
  function drawBars(c, info) {
    const names = [['單條', 'Single'], ['串聯', 'Series'], ['並聯', 'Parallel']];
    const y = 484, bh = 20;
    CX.forEach((cx, i) => {
      const x0 = cx - 140, tot = info[i].total, len = info[i].disp * BARPX;
      label(c, T('總伸長量 ', 'Total stretch ') + fmt(tot) + ' cm', x0, y - 28, COL.teal, 22, 'left');
      c.fillStyle = 'rgba(77,210,255,0.10)'; rr(c, x0, y - bh / 2, 16 * BARPX, bh, 6); c.fill();
      if (len > 1) {
        c.save(); c.shadowColor = rgba(COL.teal, 0.7); c.shadowBlur = 10;
        const g = c.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
        g.addColorStop(0, '#a6ecff'); g.addColorStop(0.5, COL.teal); g.addColorStop(1, '#2a93b3');
        c.fillStyle = g; rr(c, x0, y - bh / 2, Math.max(len, 8), bh, 6); c.fill(); c.restore();
      }
      c.strokeStyle = COL.white; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y - bh / 2 - 6); c.lineTo(x0, y + bh / 2 + 6); c.stroke();
    });
    label(c, T('三條長條用同一比例尺', 'Same scale for all three bars'), 480, 520, COL.dim, 22, 'center');
  }

  function drawLegend(c) {
    const items = [[T('黃：每條受力', 'Yellow: force on each'), COL.yellow], [T('青：伸長量', 'Cyan: stretch'), COL.teal], [T('珊瑚：總拉力 F', 'Coral: total pull F'), COL.coral]];
    c.save(); c.font = font(22); const gap = 34;
    const ws = items.map(it => c.measureText(it[0]).width); c.restore();
    let x = 480 - (ws.reduce((a, b) => a + b, 0) + gap * 2) / 2;
    items.forEach((it, k) => { label(c, it[0], x, 55, it[1], 22, 'left'); x += ws[k] + gap; });
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawBackground(c);
    groupTitle(c, 0, '單條彈簧', 'One spring');
    groupTitle(c, 1, '兩條串聯', 'Two in series');
    groupTitle(c, 2, '兩條並聯', 'Two in parallel');
    drawLegend(c);
    const a = drawSingle(c), b = drawSeries(c), p = drawParallel(c);
    drawBars(c, [a, b, p]);
  }

  /* ═════════ 迴圈（只在有動作時跑，穩定就停） ═════════ */
  function settled() { return Math.abs(S.d - S.F) < 0.05 && Math.abs(S.v) < 0.3; }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const acc = 130 * (S.F - S.d) - 15 * S.v;
    S.v += acc * dt; S.d += S.v * dt;
    if (S.d < 0) { S.d = 0; S.v = Math.max(0, S.v); }
    if (settled()) { S.d = S.F; S.v = 0; S.idle = true; render(); return; }
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
  function setF(f) {
    f = clamp(Math.round(f / FSTEP) * FSTEP, 0, FMAX);
    if (f === S.F) { updateUI(); return; }
    S.F = f; S.actions++; S.note = 'F:' + f;
    updateUI(); kick();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const row = document.createElement('div'); row.className = 'lab-row lab-slide';
    const nm = document.createElement('span'); nm.className = 'lab-name';
    nm.setAttribute('data-zh', '總拉力 F'); nm.setAttribute('data-en', 'Total pull F'); nm.textContent = T('總拉力 F', 'Total pull F');
    slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = FMAX; slider.step = FSTEP; slider.value = S.F;
    slider.className = 'lab-slider'; slider.id = KEY + 'LabSlider';
    slider.setAttribute('aria-label', T('總拉力 F（gw）', 'Total pull F (gw)'));
    slider.addEventListener('input', () => setF(parseFloat(slider.value)));
    sval = document.createElement('span'); sval.className = 'lab-val';
    row.appendChild(nm); row.appendChild(slider); row.appendChild(sval);
    ctrl.appendChild(row);
    const row2 = document.createElement('div'); row2.className = 'lab-row';
    [0, 30, 60].forEach(f => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.f = f;
      b.textContent = T('F＝', 'F = ') + f; b.addEventListener('click', () => setF(f));
      row2.appendChild(b);
    });
    ctrl.appendChild(row2);
  }
  function updateUI() {
    if (slider) slider.value = S.F;
    if (sval) sval.textContent = S.F + ' gw';
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const on = parseInt(b.dataset.f, 10) === S.F;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    if (cv) cv.setAttribute('aria-label', T('彈簧陣列拉力賽實驗台：左右拖曳或按左右方向鍵改變總拉力',
      'Spring array bench: drag sideways or press left/right arrows to change the total pull'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const F = S.F, f1 = fmt(F), f2 = fmt(F / 2), e1 = fmt(F / 10), e2 = fmt(2 * F / 10), e3 = fmt(F / 20);
    const l1 = T(
      `<b class="la-f">F＝${f1} gw</b>：單條伸長 <b class="la-e">${e1} cm</b>；串聯每條受力 <b class="la-y">${f1} gw</b>、總伸長 <b class="la-e">${e2} cm</b>；並聯每條只受 <b class="la-y">${f2} gw</b>、總伸長 <b class="la-e">${e3} cm</b>`,
      `<b class="la-f">F = ${f1} gw</b>: one spring stretches <b class="la-e">${e1} cm</b>; in series each carries <b class="la-y">${f1} gw</b>, total <b class="la-e">${e2} cm</b>; in parallel each carries only <b class="la-y">${f2} gw</b>, total <b class="la-e">${e3} cm</b>`);
    const l2 = T('串聯：張力貫穿，伸長相加；並聯：力量分工，伸長減半。', 'Series: the tension runs through, stretches add up. Parallel: the load is shared, the stretch is halved.');
    res.innerHTML = `<div>${l1}</div><div>${l2}</div>`;
  }

  /* ═════════ 拖曳與鍵盤 ═════════ */
  function lx(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    S.drag = { x: lx(e), f0: S.F, moved: false, id: e.pointerId };
    cv.focus({ preventScroll: true });
  }
  function onMove(e) {
    if (!S.drag) return;
    const dx = lx(e) - S.drag.x;
    if (!S.drag.moved && Math.abs(dx) < 10) return;
    if (!S.drag.moved) { S.drag.moved = true; try { cv.setPointerCapture(S.drag.id); } catch (_) { } }
    setF(S.drag.f0 + dx / 5);
  }
  function onUp() { S.drag = null; }
  function onKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setF(S.F + FSTEP); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setF(S.F - FSTEP); }
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
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    S.idle = settled(); render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (cv) {
      cv.removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
    }
    S.drag = null;
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    const F = S.F;
    return {
      F, shown: +S.d.toFixed(2), single: { force: F, ext: F / 10 }, series: { force: F, ext: F / 10, total: 2 * F / 10 },
      parallel: { force: F / 2, ext: F / 20, total: F / 20 },
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-array.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-array .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-array .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-array .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-array canvas{display:block;width:100%;height:auto;outline:none}
#lab-array canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-array .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-array .result-box>div+div{margin-top:4px}
#lab-array .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-array .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:44px}
#lab-array .lab-slide{min-height:36px;flex-wrap:nowrap}
#lab-array .lab-name{font-size:22px;font-weight:700;color:#ff8040;white-space:nowrap}
#lab-array .lab-val{font-size:22px;font-weight:700;color:#ff8040;min-width:4.2em;text-align:right;white-space:nowrap;font-family:"JetBrains Mono","Noto Sans TC",monospace}
#lab-array .lab-slider{flex:1 1 auto;min-width:120px;height:36px;accent-color:#ff8040;cursor:pointer}
#lab-array .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 16px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-array .lab-btn:hover{border-color:#ffe066}
#lab-array .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-array .la-f{color:#ff8040}#lab-array .la-y{color:#ffe066}#lab-array .la-e{color:#4dd2ff}
@media (max-width:640px){#lab-array.lab-desk{padding:12px 12px 14px}#lab-array .lab-title{font-size:24px}#lab-array .lab-slide{flex-wrap:wrap}#lab-array .lab-slider{flex-basis:100%;order:3}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜彈簧陣列拉力賽', te = '🔧 Try it | Spring array pulling race';
    const kz = '三組相同的彈簧（原長 10 cm、每 10 gw 伸長 1 cm）受同一個總拉力 F：拉動滑桿，比一比誰伸得最多、誰伸得最少。畫布左右拖曳也能改 F。';
    const ke = 'Three sets of identical springs (rest length 10 cm, 1 cm of stretch per 10 gw) share the same total pull F. Move the slider and see which stretches most and which least. You can also drag the canvas sideways.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI();
    S.d = S.F; S.v = 0; render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
