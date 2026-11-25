/* mechanics_1_lab_planet_1125_v1.js — 「動手做｜星際體重計」實驗台（#planetLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.planet = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab2 最後，並注入 <style id="lab-planet-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 內容：同一塊鐵塊放在天平（比質量）與彈簧秤（比重量）上，換星球、換質量。
 *   質量（kg）不隨地點改變；重量（kgw）＝質量（kg）×該星球引力倍數（地球 1、月球 1/6）。
 * 互動：按鈕選星球（地球／月球）與質量（3／6／9 kg）；畫布左右拖曳＝換星球；畫布聚焦時 ←／→ 換星球、↑／↓ 換質量。
 * 動畫只在狀態變化時跑（彈簧阻尼、背景淡入淡出、引力箭頭伸縮），穩定後停止 RAF，不佔 CPU。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'planet', TAB = 'tab2';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#11261f', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };
  const PLANETS = {
    earth: { zh: '地球', en: 'Earth', gzh: '重力場 1G', gen: 'gravity 1G', g: 1, tip: '1G' },
    moon:  { zh: '月球', en: 'Moon',  gzh: '重力場 1/6 G', gen: 'gravity 1/6 G', g: 1 / 6, tip: '1/6 G' }
  };
  const ORDER = ['earth', 'moon'];
  const MASSES = [3, 6, 9];

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
  const TW = new Map();
  function tw(c, s, size) {
    const k = size + '|' + s; let w = TW.get(k);
    if (w === undefined) { c.save(); c.font = font(size); w = c.measureText(s).width; c.restore(); if (TW.size > 3000) TW.clear(); TW.set(k, w); }
    return w;
  }
  function fit(c, s, maxW, size, min) { let z = size; while (z > min && tw(c, s, z) > maxW) z--; return z; }
  const fmt = n => String(Number(n.toFixed(1)));

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    planet: 'earth', mass: 6,
    mD: 6, gD: 1, p: 0, x: 6, v: 0, wobT: -99,
    actions: 0, note: 'start', debug: false, boxes: [], drag: null, idle: true
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

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
  /* 單行膠囊 */
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
  /* 兩行圓角框：上行大、下行小 */
  function pill2(c, s1, s2, cx, cy, color, z1, z2, maxW) {
    z1 = fit(c, s1, maxW - 30, z1, 22); z2 = fit(c, s2, maxW - 30, z2, 22);
    const w = Math.max(tw(c, s1, z1), tw(c, s2, z2)) + 34, h = z1 + z2 + 32;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, cx - w / 2, cy - h / 2, w, h, 16); c.fill();
    c.lineWidth = 3; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false;
    label(c, s1, cx, cy - h / 2 + 14 + z1 / 2, color, z1, 'center');
    label(c, s2, cx, cy + h / 2 - 13 - z2 / 2, color, z2, 'center');
    S.debug = dbg;
    if (S.debug) S.boxes.push({ s: s1 + s2, x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, size: z2 });
  }

  /* 地面：極緩的弧（星球弧面） */
  const gy = x => 440 + Math.pow((x - 480) / 480, 2) * 24;

  /* ═════════ 背景 ═════════ */
  function groundPath(c) {
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, gy(0));
    c.quadraticCurveTo(480, 440 - 24, W, gy(W)); c.lineTo(W, H); c.closePath();
  }
  function bgEarth(c) {
    const sky = c.createLinearGradient(0, 0, 0, 450);
    sky.addColorStop(0, '#0d3a52'); sky.addColorStop(0.6, '#1f6f86'); sky.addColorStop(1, '#4fb0b0');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(480, 440, 20, 480, 440, 460);
    gl.addColorStop(0, 'rgba(160,255,235,0.28)'); gl.addColorStop(1, 'rgba(160,255,235,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(246,243,234,0.10)';
    [[150, 120, 90, 18], [190, 132, 60, 14], [830, 210, 100, 18], [790, 224, 60, 12], [520, 90, 80, 14], [560, 100, 50, 11]].forEach(a => {
      c.beginPath(); c.ellipse(a[0], a[1], a[2], a[3], 0, 0, TAU); c.fill();
    });
    groundPath(c);
    const g = c.createLinearGradient(0, 410, 0, H);
    g.addColorStop(0, '#2bb596'); g.addColorStop(0.35, '#17806b'); g.addColorStop(1, '#0c4a40');
    c.fillStyle = g; c.fill();
    c.save(); c.shadowColor = 'rgba(170,255,235,0.8)'; c.shadowBlur = 14;
    c.strokeStyle = 'rgba(190,255,240,0.8)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, gy(0)); c.quadraticCurveTo(480, 440 - 24, W, gy(W)); c.stroke(); c.restore();
  }
  let STARS = null;
  function stars() {
    if (STARS) return STARS;
    STARS = []; let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 80; i++) STARS.push([rnd() * W, rnd() * 420, 0.8 + rnd() * 1.4, 0.35 + rnd() * 0.55]);
    return STARS;
  }
  function bgMoon(c) {
    c.fillStyle = COL.deep; c.fillRect(0, 0, W, H);
    stars().forEach(a => { c.fillStyle = 'rgba(246,243,234,' + a[3] + ')'; c.beginPath(); c.arc(a[0], a[1], a[2], 0, TAU); c.fill(); });
    /* 天上的小地球 */
    const eg = c.createRadialGradient(868, 72, 4, 880, 84, 34);
    eg.addColorStop(0, '#7fe0d0'); eg.addColorStop(0.6, '#2a8fb0'); eg.addColorStop(1, '#14506a');
    c.save(); c.shadowColor = 'rgba(77,210,255,0.55)'; c.shadowBlur = 16;
    c.fillStyle = eg; c.beginPath(); c.arc(880, 84, 30, 0, TAU); c.fill(); c.restore();
    c.fillStyle = 'rgba(246,243,234,0.45)';
    c.beginPath(); c.ellipse(872, 78, 12, 5, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(890, 94, 9, 4, 0.3, 0, TAU); c.fill();
    groundPath(c);
    const g = c.createLinearGradient(0, 410, 0, H);
    g.addColorStop(0, '#aab4b1'); g.addColorStop(0.4, '#7c8784'); g.addColorStop(1, '#4b5654');
    c.fillStyle = g; c.fill();
    c.save(); groundPath(c); c.clip();
    [[70, 520, 52, 11], [430, 505, 40, 8], [610, 528, 60, 12], [880, 512, 46, 9], [300, 532, 36, 7], [760, 480, 30, 6], [150, 476, 28, 6]].forEach(a => {
      c.fillStyle = 'rgba(52,62,60,0.55)'; c.beginPath(); c.ellipse(a[0], a[1], a[2], a[3], 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(225,232,229,0.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(a[0], a[1] + 1.5, a[2], a[3], 0, 0.1, Math.PI - 0.1); c.stroke();
    });
    c.restore();
    c.save(); c.shadowColor = 'rgba(225,232,229,0.7)'; c.shadowBlur = 10;
    c.strokeStyle = 'rgba(225,232,229,0.75)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, gy(0)); c.quadraticCurveTo(480, 440 - 24, W, gy(W)); c.stroke(); c.restore();
  }

  /* ═════════ 器材 ═════════ */
  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }
  function drawIron(c, cx, bottom, m, alpha, ring) {
    const w = 52 + 4 * m, h = 48 + 3 * m, x = cx - w / 2, y = bottom - h;
    c.save(); c.globalAlpha = alpha;
    c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
    const g = c.createLinearGradient(0, y, 0, bottom);
    g.addColorStop(0, '#b4c0cb'); g.addColorStop(0.5, '#7d8b98'); g.addColorStop(1, '#55626e');
    c.fillStyle = g; rr(c, x, y, w, h, 7); c.fill(); c.restore();
    c.save(); c.globalAlpha = alpha;
    c.strokeStyle = '#38454f'; c.lineWidth = 2.5; rr(c, x, y, w, h, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.28)'; rr(c, x + 5, y + 4, w - 10, 8, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 6, y + 14, 6, h - 26);
    c.restore();
    label(c, T('鐵', 'Fe'), cx, y + h / 2 + 2, COL.white, 22, 'center', alpha);
    if (ring) {
      c.save(); c.globalAlpha = alpha; c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(cx, y - 8, 8, 0, TAU); c.stroke(); c.restore();
    }
  }
  function drawWeightPiece(c, cx, bottom, alpha, knob) {
    const w = 92, h = 30, x = cx - w / 2, y = bottom - h;
    c.save(); c.globalAlpha = alpha;
    const g = c.createLinearGradient(0, y, 0, bottom);
    g.addColorStop(0, '#63e8be'); g.addColorStop(0.5, '#33cc99'); g.addColorStop(1, '#1b8564');
    c.fillStyle = g; rr(c, x, y, w, h, 7); c.fill();
    c.strokeStyle = '#146048'; c.lineWidth = 2.5; rr(c, x, y, w, h, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.3)'; rr(c, x + 6, y + 3, w - 12, 5, 2.5); c.fill();
    if (knob) { c.fillStyle = g; rr(c, cx - 11, y - 10, 22, 12, 4); c.fill(); c.strokeStyle = '#146048'; c.lineWidth = 2; rr(c, cx - 11, y - 10, 22, 12, 4); c.stroke(); }
    c.restore();
    label(c, '3 kg', cx, y + h / 2 + 1, COL.white, 22, 'center', alpha);
  }

  function drawBalance(c) {
    const cx = 240, yb = gy(cx), py = 190, arm = 130;
    const dt = S.t - S.wobT;
    const a = dt < 3.5 ? 0.06 * Math.exp(-dt * 1.9) * Math.sin(dt * 9.5) : 0;
    /* 底座與立柱 */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, yb - 16, yb + 2); rr(c, cx - 84, yb - 16, 168, 18, 7); c.fill();
    c.fillStyle = steelH(c, yb - 30, yb - 14); rr(c, cx - 46, yb - 30, 92, 16, 6); c.fill(); c.restore();
    c.fillStyle = steelV(c, cx - 8, cx + 8); c.fillRect(cx - 8, py, 16, yb - 30 - py);
    /* 平衡指針（立柱前的小刻度） */
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, py - 52); c.lineTo(cx, py - 40); c.stroke();
    const bal = Math.abs(a) < 0.004;
    c.save(); c.strokeStyle = bal ? COL.green : COL.coral; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, py); c.lineTo(cx + Math.sin(a * 5) * 30, py - 40 * Math.cos(a * 5)); c.stroke(); c.restore();
    /* 橫樑 */
    c.save(); c.translate(cx, py); c.rotate(a);
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, -8, 8); rr(c, -arm - 10, -7, 2 * arm + 20, 14, 7); c.fill(); c.restore();
    c.strokeStyle = '#55635f'; c.lineWidth = 2; rr(c, -arm - 10, -7, 2 * arm + 20, 14, 7); c.stroke();
    c.restore();
    c.fillStyle = '#d6dfdc'; c.strokeStyle = '#55635f'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, py, 11, 0, TAU); c.fill(); c.stroke();
    /* 兩個秤盤 */
    [-1, 1].forEach(sg => {
      const ex = cx + sg * arm * Math.cos(a), ey = py + sg * arm * Math.sin(a), top = ey + 140;
      c.strokeStyle = 'rgba(214,223,220,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 64, top); c.moveTo(ex, ey); c.lineTo(ex + 64, top); c.stroke();
      c.fillStyle = '#d6dfdc'; c.beginPath(); c.arc(ex, ey, 5, 0, TAU); c.fill();
      const g = c.createLinearGradient(0, top, 0, top + 20);
      g.addColorStop(0, '#f0f5f3'); g.addColorStop(1, '#7f8e8a');
      c.save(); c.shadowColor = 'rgba(11,26,21,0.45)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = g; c.beginPath(); c.moveTo(ex - 74, top); c.lineTo(ex + 74, top);
      c.quadraticCurveTo(ex + 62, top + 22, ex, top + 22); c.quadraticCurveTo(ex - 62, top + 22, ex - 74, top); c.closePath(); c.fill(); c.restore();
      c.strokeStyle = '#55635f'; c.lineWidth = 2; c.stroke();
      if (sg < 0) {
        drawIron(c, ex, top, S.mD, 1, false);
      } else {
        const n = S.mD / 3;
        for (let i = 0; i < 3; i++) {
          const al = clamp(n - i, 0, 1); if (al <= 0.01) continue;
          const last = !(n - i - 1 > 0.01);
          drawWeightPiece(c, ex, top - i * 30, al, last);
        }
      }
    });
    label(c, T('天平', 'Balance'), cx, 36, COL.white, 24);
    label(c, bal ? T('平衡', 'Balanced') : T('…', '…'), cx, 100, bal ? COL.green : COL.coral, 22);
    pill2(c, T('質量 ＝ ', 'Mass = ') + fmt(S.mass) + ' kg', T('（不隨地點改變）', '(same on every planet)'),
      cx, 496, COL.green, 26, 22, 430);
  }

  function drawCoil(c, x, y0, y1) {
    const turns = 9, amp = 15, n = turns * 14;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const front = Math.cos((p0 + p1) / 2) > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? '#e9f0ed' : '#6f7f7b'; c.lineWidth = front ? 4 : 3.4;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }

  function drawScale(c) {
    const sx = 700, post = 640, yb = gy(sx), top0 = 130, K = 22;
    const w = Math.max(0, S.x), ypos = top0 + K * w;
    /* 底座、立柱、橫臂 */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, yb - 16, yb + 2); rr(c, post - 40, yb - 16, 80, 18, 7); c.fill(); c.restore();
    c.fillStyle = steelV(c, post - 8, post + 8); c.fillRect(post - 8, 62, 16, yb - 16 - 62);
    c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, 62, 76); rr(c, post - 8, 62, 168, 14, 7); c.fill(); c.restore();
    /* 標尺板 */
    c.fillStyle = '#d6dfdc'; c.fillRect(780, 76, 5, 44);
    c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, 752, 118, 62, 242, 8); c.fill();
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 2.5; rr(c, 752, 118, 62, 242, 8); c.stroke();
    c.fillStyle = rgba(COL.pink, 0.32); c.fillRect(753, ypos - 4, 60, 8);
    for (let k = 0; k <= 20; k++) {
      const y = top0 + K * k / 2, major = k % 2 === 0;
      c.strokeStyle = major ? COL.white : COL.dim; c.lineWidth = major ? 2.5 : 2;
      c.beginPath(); c.moveTo(753, y); c.lineTo(753 + (major ? 14 : 8), y); c.stroke();
    }
    for (let v = 0; v <= 10; v += 2) label(c, String(v), 791, top0 + K * v, COL.white, 20, 'center');
    label(c, 'kgw', 783, 98, COL.pink, 22);
    /* 彈簧與掛鉤 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, 76); c.lineTo(sx, 88); c.stroke();
    drawCoil(c, sx, 88, ypos);
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.beginPath(); c.arc(sx, ypos + 10, 8, 0, TAU); c.stroke();
    /* 指針 */
    c.save(); c.shadowColor = rgba(COL.pink, 0.8); c.shadowBlur = 10;
    c.fillStyle = COL.pink; c.strokeStyle = COL.pink; c.lineWidth = 4;
    c.beginPath(); c.moveTo(sx + 14, ypos); c.lineTo(728, ypos); c.stroke();
    c.beginPath(); c.moveTo(751, ypos); c.lineTo(727, ypos - 10); c.lineTo(727, ypos + 10); c.closePath(); c.fill(); c.restore();
    /* 鐵塊 */
    drawIron(c, sx, ypos + 18 + 48 + 3 * S.mD, S.mD, 1, false);
    /* 讀數 */
    const shown = (Math.abs(S.x - S.mD * PLANETS[S.planet].g) < 0.02 && S.mD === S.mass) ? S.mass * PLANETS[S.planet].g : S.x;
    c.strokeStyle = COL.pink; c.lineWidth = 3; c.beginPath(); c.moveTo(814, ypos); c.lineTo(830, ypos); c.stroke();
    pill(c, fmt(Math.max(0, shown)) + ' kgw', 830, ypos, COL.pink, 22, 'left');
    label(c, T('彈簧秤', 'Spring scale'), 716, 36, COL.white, 24);
    const wt = S.mass * PLANETS[S.planet].g;
    pill2(c, T('重量 ＝ ', 'Weight = ') + fmt(wt) + ' kgw', T('（隨重力場強弱改變）', '(changes with gravity)'),
      715, 496, COL.pink, 26, 22, 430);
  }

  function drawGravity(c) {
    const x = 534, y0 = 176, L = 200 * S.gD;
    label(c, T('引力', 'Gravity'), x, 140, COL.pink, 22);
    c.save(); c.shadowColor = rgba(COL.pink, 0.75); c.shadowBlur = 14;
    c.fillStyle = COL.pink; rr(c, x - 6, y0, 12, Math.max(4, L - 8), 5); c.fill();
    c.beginPath(); c.moveTo(x, y0 + L + 16); c.lineTo(x - 20, y0 + L - 14); c.lineTo(x + 20, y0 + L - 14); c.closePath(); c.fill(); c.restore();
    const tip = S.gD > 0.5 ? PLANETS.earth.tip : PLANETS.moon.tip;
    label(c, tip, x, y0 + L + 42, COL.pink, 22);
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    bgEarth(c);
    if (S.p > 0.003) { c.save(); c.globalAlpha = clamp(S.p, 0, 1); bgMoon(c); c.restore(); }
    const pl = PLANETS[S.planet];
    pill(c, T(pl.zh, pl.en) + T('（' + pl.gzh + '）', ' (' + pl.gen + ')'), 480, 34, COL.yellow, 24, 'center');
    drawGravity(c);
    drawBalance(c);
    drawScale(c);
  }

  /* ═════════ 迴圈（只在有動作時跑，穩定就停） ═════════ */
  function settled() {
    const gT = PLANETS[S.planet].g;
    return Math.abs(S.mD - S.mass) < 0.002 && Math.abs(S.gD - gT) < 0.0005 && Math.abs(S.p - (S.planet === 'moon' ? 1 : 0)) < 0.002 &&
      Math.abs(S.x - S.mass * gT) < 0.004 && Math.abs(S.v) < 0.02 && S.t - S.wobT >= 3.5;
  }
  function snap() {
    const gT = PLANETS[S.planet].g;
    S.mD = S.mass; S.gD = gT; S.p = S.planet === 'moon' ? 1 : 0; S.x = S.mass * gT; S.v = 0; S.wobT = -99;
  }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const gT = PLANETS[S.planet].g;
    S.mD += (S.mass - S.mD) * (1 - Math.exp(-dt * 8));
    S.gD += (gT - S.gD) * (1 - Math.exp(-dt * 3.2));
    S.p += ((S.planet === 'moon' ? 1 : 0) - S.p) * (1 - Math.exp(-dt * 3.5));
    const acc = 70 * (S.mD * S.gD - S.x) - 9 * S.v;
    S.v += acc * dt; S.x += S.v * dt;
    if (settled()) { S.t = Math.max(S.t, S.wobT + 3.6); snap(); S.idle = true; render(); return; }
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
  function setPlanet(k) { if (!PLANETS[k]) return; S.planet = k; S.note = 'planet:' + k; }
  function setMass(m) { if (m === S.mass) return; S.mass = m; S.wobT = S.t; S.note = 'mass:' + m; }
  function act(k) {
    if (PLANETS[k]) setPlanet(k);
    else if (k.charAt(0) === 'm') setMass(parseInt(k.slice(1), 10));
    else return;
    S.actions++; updateUI(); kick();
  }
  function shiftPlanet(d) { const i = ORDER.indexOf(S.planet); act(ORDER[clamp(i + d, 0, ORDER.length - 1)]); }
  function shiftMass(d) { const i = MASSES.indexOf(S.mass); act('m' + MASSES[clamp(i + d, 0, MASSES.length - 1)]); }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [T('星球', 'Planet'), ORDER.map(k => [k, T(PLANETS[k].zh, PLANETS[k].en) + T('（' + PLANETS[k].gzh + '）', ' (' + PLANETS[k].gen + ')')])],
      [T('質量', 'Mass'), MASSES.map(m => ['m' + m, m + ' kg'])]
    ];
    for (const [name, btns] of groups) {
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
      const on = PLANETS[k] ? S.planet === k : ('m' + S.mass) === k;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    if (cv) cv.setAttribute('aria-label', T('星際體重計實驗台：左右拖曳或按左右方向鍵換星球，上下方向鍵換質量',
      'Planet scale bench: drag sideways or press left/right arrows to change the planet, up/down arrows to change the mass'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const m = S.mass, g = PLANETS[S.planet].g, w = fmt(m * g), ms = fmt(m);
    const l1 = T(`<b class="lp-g">質量 ${ms} kg 不變</b>：天平兩邊一樣重，換到哪個星球都平衡。`,
      `<b class="lp-g">Mass stays ${ms} kg</b>: the balance stays level on every planet.`);
    const l2 = S.planet === 'earth'
      ? T(`<b class="lp-p">重量 ${w} kgw</b>：地球重力場 1G，${ms} kg × 1 ＝ ${w} kgw。換去月球看看！`,
        `<b class="lp-p">Weight ${w} kgw</b>: Earth's gravity is 1G, so ${ms} kg × 1 = ${w} kgw. Try the Moon!`)
      : T(`<b class="lp-p">重量 ${w} kgw</b>：月球重力場只有 1/6 G，${ms} kg × 1/6 ＝ ${w} kgw；變輕不是變瘦。`,
        `<b class="lp-p">Weight ${w} kgw</b>: the Moon's gravity is only 1/6 G, so ${ms} kg × 1/6 = ${w} kgw. Lighter, not slimmer.`);
    res.innerHTML = `<div>${l1}</div><div>${l2}</div>`;
  }

  /* ═════════ 拖曳與鍵盤 ═════════ */
  function lx(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
  function onDown(e) { if (e.button !== undefined && e.button !== 0) return; S.drag = { x: lx(e) }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } cv.focus({ preventScroll: true }); }
  function onUp(e) {
    if (!S.drag) return;
    const dx = lx(e) - S.drag.x; S.drag = null;
    if (Math.abs(dx) >= 60) shiftPlanet(dx < 0 ? 1 : -1);
  }
  function onCancel() { S.drag = null; }
  function onKey(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); shiftPlanet(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); shiftPlanet(-1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); shiftMass(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); shiftMass(-1); }
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
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onCancel);
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
    if (cv) {
      cv.removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onCancel);
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
    const g = PLANETS[S.planet].g;
    return {
      planet: S.planet, mass: S.mass, g, gravityRatio: +S.gD.toFixed(3),
      weight: +(S.mass * g).toFixed(3), pointer: +S.x.toFixed(3), balanced: true, bgMoon: +S.p.toFixed(3),
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-planet.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-planet .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-planet .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-planet .canvas-wrap{order:2;background:#11261f;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-planet canvas{display:block;width:100%;height:auto;outline:none}
#lab-planet canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-planet .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-planet .result-box>div+div{margin-top:4px}
#lab-planet .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-planet .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:44px}
#lab-planet .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:2.8em}
#lab-planet .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-planet .lab-btn:hover{border-color:#ffe066}
#lab-planet .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-planet .lp-g{color:#33cc99}#lab-planet .lp-p{color:#f472b6}
@media (max-width:640px){#lab-planet.lab-desk{padding:12px 12px 14px}#lab-planet .lab-title{font-size:24px}#lab-planet .lab-name{min-width:0;width:100%}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜星際體重計', te = '🔧 Try it | Planet weighing bench';
    const kz = '把同一塊鐵塊放到地球和月球，換不同質量：看天平（質量）有沒有變，彈簧秤（重量）又指到哪裡。畫布左右拖曳也能換星球。';
    const ke = 'Put the same iron block on Earth and on the Moon, and try different masses: does the balance (mass) change, and where does the spring scale (weight) point? You can also drag the canvas sideways to change the planet.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI();
    snap(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
