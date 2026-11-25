/* mechanics_1_lab_force_1125_v1.js — 「動手做｜力的觀測站」實驗台（#forceLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.force = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab1 最後，並注入 <style id="lab-force-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 內容：三個小站——①足球（踢球：球先被壓扁，再飛出去＝改變形狀＋改變運動）②黏土（壓扁後保持形狀＝改變形狀）
 *       ③磁鐵與兩根鐵釘（超距力：磁鐵可拖曳，靠近到吸力範圍內鐵釘才被吸過去，吸力隨距離變強，沒碰到也會動）。
 * 操作：按鈕「踢球／壓扁／磁鐵吸鐵釘／重設」；畫布內磁鐵可用手指或滑鼠拖曳；畫布聚焦時 1／2／3 觸發、R 重設、方向鍵移動磁鐵。
 * 數值一律示意（吸力範圍 190 px 為畫面單位，不標物理量）。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'force', TAB = 'tab1';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* 版面 */
  const GY = 410;                                         /* 地面線 */
  const Z = [[12, 352], [362, 602], [612, 948]];          /* 三個站的左右界 */
  const BALL_R = 36, BALL_X0 = 140, BALL_MAXX = Z[0][1] - 14 - BALL_R;
  const HIP_X = BALL_X0 - 99, HIP_Y = GY - 197, LEG = 190, TH_C = 0.22;
  const CLAY_X = 482, CLAY_H0 = 118, CLAY_W0 = 104, CLAY_HF = 46, CLAY_WF = 196;
  const M0 = { x: 700, y: 175 }, M_X = [652, 912], M_Y = [120, 315];
  const NAIL0 = [{ x: 800, y: GY - 5 }, { x: 860, y: GY - 5 }];
  const R_MAG = 190, A_MAX = 3600, GRAV = 650, NAIL_L = 56;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const easeIn = k => { k = clamp(k, 0, 1); return k * k * k; };
  const easeOut = k => { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3); };
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
  function label(c, s, x, y, color, size, align, alpha) {
    size = size || 22; align = align || 'center';
    if (alpha !== undefined && alpha <= 0.01) return;
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
  }
  function arrow(c, x0, y0, x1, y1, color, lw) {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hs = Math.min(15, L * 0.6);
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw || 6; c.lineCap = 'round';
    c.shadowColor = rgba(color, 0.6); c.shadowBlur = 10;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * hs * 0.6, y1 - Math.sin(a) * hs * 0.6); c.stroke();
    c.translate(x1, y1); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-hs * 1.3, -hs * 0.8); c.lineTo(-hs * 1.3, hs * 0.8); c.closePath(); c.fill(); c.restore();
  }
  function pentagon(c, x, y, s, rot) {
    c.beginPath();
    for (let k = 0; k < 5; k++) { const a = rot + k * TAU / 5 - Math.PI / 2; const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.closePath();
  }

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true, debug: false, boxes: [], actions: 0, note: 'idle',
    ball: { x: BALL_X0, v: 0, ang: 0, sq: 0, f: 0 }, kick: null,
    clay: { d: 0 }, press: null,
    mag: { x: M0.x, y: M0.y }, nails: [], auto: null, drag: null, hover: false, maxF: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  function resetNails() {
    S.nails = NAIL0.map(p => ({ x: p.x, y: p.y, vx: 0, vy: 0, stuck: -1, F: 0, dir: [0, -1], flash: 0 }));
  }
  function resetAll() {
    S.ball = { x: BALL_X0, v: 0, ang: 0, sq: 0, f: 0 }; S.kick = null;
    S.clay = { d: 0 }; S.press = null;
    S.mag = { x: M0.x, y: M0.y }; S.auto = null; S.drag = null; resetNails();
  }
  resetNails();

  const poles = () => [{ x: S.mag.x - 28, y: S.mag.y + 34 }, { x: S.mag.x + 28, y: S.mag.y + 34 }];

  /* ═════════ 物理／時間軸 ═════════ */
  /* 踢球時間軸（秒）：back 0.5（需要時）→ 蓄力 0.5 → 揮出 0.18 → 壓扁 0.12 → 隨follow 0.4 → 淡出 0.4 */
  const K_BACK = 0.5, K_WIND = 0.5, K_SWING = 0.18, K_COMP = 0.12, K_FOLLOW = 0.4, K_FADE = 0.4;
  function legTheta(k) {
    const t = k.t;
    if (t < K_WIND) return lerp(0, -0.85, ease(t / K_WIND));
    if (t < K_WIND + K_SWING) return lerp(-0.85, TH_C, easeIn((t - K_WIND) / K_SWING));
    const t2 = t - K_WIND - K_SWING;
    if (t2 < K_COMP) return lerp(TH_C, TH_C + 0.07, t2 / K_COMP);
    const t3 = t2 - K_COMP;
    return lerp(TH_C + 0.07, TH_C + 0.3, easeOut(t3 / K_FOLLOW));
  }
  function legAlpha(k) {
    const end = K_WIND + K_SWING + K_COMP + K_FOLLOW;
    if (k.t < 0.2) return k.t / 0.2;
    if (k.t > end) return clamp(1 - (k.t - end) / K_FADE, 0, 1);
    return 1;
  }
  function stepKick(dt) {
    const k = S.kick, b = S.ball; if (!k) return;
    if (k.phase === 'back') {
      k.bt += dt; const u = ease(k.bt / K_BACK), nx = lerp(k.bx, BALL_X0, u);
      b.ang += (nx - b.x) / BALL_R; b.x = nx; b.v = 0; b.sq = 0;
      if (k.bt >= K_BACK) { k.phase = 'go'; k.t = 0; b.x = BALL_X0; }
      return;
    }
    const prev = k.t; k.t += dt;
    const tc = K_WIND + K_SWING;
    if (k.t >= tc && k.t < tc + K_COMP) {
      const tau = (k.t - tc) / K_COMP;
      b.sq = Math.pow(Math.sin(Math.PI * tau), 0.9);
      if (!k.launched && tau >= 0.55) { k.launched = true; b.v = 290; }
    } else if (k.t >= tc + K_COMP && b.sq > 0) b.sq = 0;
    b.f = (k.t >= tc - 0.02 && k.t < tc + K_COMP + 0.2) ? clamp(1 - Math.max(0, k.t - (tc + K_COMP * 0.7)) / 0.3, 0, 1) : 0;
    if (k.t > K_WIND + K_SWING + K_COMP + K_FOLLOW + K_FADE) { S.kick = null; b.f = 0; }
    void prev;
  }
  function stepBall(dt) {
    const b = S.ball;
    if (b.v > 0) {
      b.v = Math.max(0, b.v - 270 * dt);
      const dx = b.v * dt; b.x += dx; b.ang += dx / BALL_R;
      if (b.x > BALL_MAXX) { b.x = BALL_MAXX; b.v = 0; }
    }
  }
  /* 壓扁時間軸：下壓 0.7 → 停 0.3 → 回升 0.7 */
  const P_DOWN = 0.7, P_HOLD = 0.3, P_UP = 0.7, PLATE_TOP = GY - 250, PLATE_BOT = GY - CLAY_HF;
  function plateBottom() {
    const p = S.press; if (!p) return PLATE_TOP;
    if (p.t < P_DOWN) return lerp(PLATE_TOP, PLATE_BOT, easeIn(p.t / P_DOWN));
    if (p.t < P_DOWN + P_HOLD) return PLATE_BOT;
    return lerp(PLATE_BOT, PLATE_TOP, ease((p.t - P_DOWN - P_HOLD) / P_UP));
  }
  function stepPress(dt) {
    const p = S.press; if (!p) return;
    p.t += dt;
    const pb = plateBottom(), h = clamp(GY - pb, CLAY_HF, CLAY_H0);
    const d = (CLAY_H0 - h) / (CLAY_H0 - CLAY_HF);
    if (p.t < P_DOWN + P_HOLD) S.clay.d = Math.max(S.clay.d, d);
    if (p.t > P_DOWN + P_HOLD + P_UP) S.press = null;
  }
  function stepAuto(dt) {
    const a = S.auto; if (!a) return;
    a.t += dt;
    if (a.t < 0.8) { const u = ease(a.t / 0.8); S.mag.x = lerp(a.fx, 830, u); S.mag.y = lerp(a.fy, 150, u); }
    else if (a.t < 2.0) { const u = ease((a.t - 0.8) / 1.2); S.mag.x = 830; S.mag.y = lerp(150, 248, u); }
    else S.auto = null;
  }
  function stepNails(dt) {
    const P = poles(); S.maxF = 0;
    S.nails.forEach((n, i) => {
      n.flash = Math.max(0, n.flash - dt * 2.5);
      if (n.stuck >= 0) { const p = P[n.stuck]; n.x = p.x; n.y = p.y + 28; n.F = 0; return; }
      /* 找最近、還沒被別根釘住的磁極 */
      let best = -1, bd = 1e9;
      P.forEach((p, j) => {
        if (S.nails.some(o => o !== n && o.stuck === j)) return;
        const d = Math.hypot(p.x - n.x, p.y + 28 - n.y); if (d < bd) { bd = d; best = j; }
      });
      let ax = 0, ay = GRAV; n.F = 0;
      if (best >= 0 && bd < R_MAG) {
        const p = P[best], dx = p.x - n.x, dy = p.y + 28 - n.y, m = A_MAX * Math.pow(1 - bd / R_MAG, 2);
        ax = m * dx / bd; ay += m * dy / bd; n.F = m; n.dir = [dx / bd, dy / bd]; n.pole = best;
        S.maxF = Math.max(S.maxF, m);
      }
      const ground = GY - 5, onG = n.y >= ground - 0.01;
      if (onG) {
        if (Math.abs(ax) < 300 && ay >= 0) { n.vx = 0; ax = 0; }
        else if (n.vx !== 0) { const fr = 240 * dt * Math.sign(n.vx); if (Math.abs(fr) >= Math.abs(n.vx) && Math.abs(ax) < 300) n.vx = 0; else n.vx -= fr; }
      }
      n.vx += ax * dt; n.vy += ay * dt;
      const damp = Math.exp(-(bd < 70 && n.F > 0 ? 4.5 : 0.8) * dt); n.vx *= damp; n.vy *= damp;
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.y > ground) { n.y = ground; if (n.vy > 0) n.vy = 0; }
      n.x = clamp(n.x, Z[2][0] + 20, Z[2][1] - 20);
      if (best >= 0 && Math.hypot(P[best].x - n.x, P[best].y + 28 - n.y) < 12) {
        n.stuck = best; n.vx = n.vy = 0; n.flash = 1; n.F = 0;
      }
      if (n.F > 6 && S.drag && S.note !== 'magnet') { S.note = 'magnet'; updateResult(); updateUI(); }
    });
  }
  function simulate(dt) {
    S.t += dt;
    stepKick(dt); stepBall(dt); stepPress(dt); stepAuto(dt);
    const sub = 4; for (let i = 0; i < sub; i++) stepNails(dt / sub);
  }

  /* ═════════ 繪圖 ═════════ */
  function drawBackdrop(c) {
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gr = c.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, '#0f2a22'); gr.addColorStop(1, '#0d201a');
    c.fillStyle = gr; c.fillRect(0, 0, W, GY);
    /* 站的外框 */
    Z.forEach(([x0, x1]) => {
      c.save(); c.fillStyle = 'rgba(246,243,234,0.03)'; rr(c, x0, 12, x1 - x0, H - 24, 14); c.fill();
      c.setLineDash([8, 7]); c.strokeStyle = 'rgba(246,243,234,0.2)'; c.lineWidth = 2; c.stroke(); c.restore();
    });
    /* 地面 */
    const fl = c.createLinearGradient(0, GY, 0, H); fl.addColorStop(0, '#1d4236'); fl.addColorStop(1, '#12291f');
    c.save(); c.beginPath(); Z.forEach(([x0, x1]) => rr(c, x0, 12, x1 - x0, H - 24, 14));
    c.restore();
    Z.forEach(([x0, x1]) => {
      c.save(); rr(c, x0, 12, x1 - x0, H - 24, 14); c.clip();
      c.fillStyle = fl; c.fillRect(x0, GY, x1 - x0, H - GY);
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(x0, GY, x1 - x0, 2.5);
      c.restore();
    });
  }
  function shadow(c, x, w, a) {
    c.save(); const g = c.createRadialGradient(x, GY + 3, 2, x, GY + 3, w);
    g.addColorStop(0, 'rgba(5,12,9,' + (0.55 * a) + ')'); g.addColorStop(1, 'rgba(5,12,9,0)');
    c.fillStyle = g; c.translate(x, GY + 3); c.scale(1, 0.22); c.translate(-x, -(GY + 3));
    c.beginPath(); c.arc(x, GY + 3, w, 0, TAU); c.fill(); c.restore();
  }

  function drawBall(c) {
    const b = S.ball, r = BALL_R, sq = b.sq;
    const sx = 1 - 0.3 * sq, sy = 1 + 0.12 * sq;
    shadow(c, b.x + r * (1 - sx), r * (1.15 + 0.4 * sq), 1);
    c.save();
    c.translate(b.x + r * (1 - sx), GY); c.scale(sx, sy); c.translate(0, -r);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.save(); c.clip();
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#e9eeea'); g.addColorStop(1, '#a9b8b2');
    c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r);
    c.fillStyle = '#1f332c'; c.strokeStyle = '#1f332c'; c.lineWidth = 1.5;
    pentagon(c, Math.cos(b.ang) * 0.06 * r, Math.sin(b.ang) * 0.06 * r, r * 0.3, b.ang); c.fill();
    for (let k = 0; k < 5; k++) {
      const a = b.ang + k * TAU / 5 + 0.3;
      pentagon(c, Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.3, a + Math.PI / 2); c.fill();
      c.beginPath(); c.moveTo(Math.cos(b.ang + k * TAU / 5 - Math.PI / 2 + 0.3) * r * 0.3, Math.sin(b.ang + k * TAU / 5 - Math.PI / 2 + 0.3) * r * 0.3);
      c.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); c.lineWidth = 2; c.stroke();
    }
    const sh = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.4, 0, 0, r * 1.05);
    sh.addColorStop(0, 'rgba(11,26,21,0)'); sh.addColorStop(1, 'rgba(11,26,21,0.5)');
    c.fillStyle = sh; c.fillRect(-r, -r, 2 * r, 2 * r);
    c.restore();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.lineWidth = 2; c.strokeStyle = 'rgba(11,26,21,0.7)'; c.stroke();
    c.restore();
  }
  function drawLeg(c) {
    const k = S.kick; if (!k || k.phase !== 'go') return;
    const a = legAlpha(k); if (a <= 0.01) return;
    const th = legTheta(k), dx = Math.sin(th), dy = Math.cos(th);
    const Fx = HIP_X + LEG * dx, Fy = HIP_Y + LEG * dy;
    const Ax = HIP_X - dx * 90, Ay = HIP_Y - dy * 90, Bx = Fx - dx * 6, By = Fy - dy * 6;
    const nx = dy, ny = -dx;
    c.save(); c.globalAlpha = a;
    /* 腿 */
    const g = c.createLinearGradient(Ax, Ay, Bx, By); g.addColorStop(0, '#e2b98c'); g.addColorStop(1, '#f0cfa6');
    const w0 = 24, w1 = 10;
    c.fillStyle = g; c.beginPath();
    c.moveTo(Ax + nx * w0, Ay + ny * w0); c.lineTo(Bx + nx * w1, By + ny * w1); c.lineTo(Bx - nx * w1, By - ny * w1); c.lineTo(Ax - nx * w0, Ay - ny * w0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 2; c.stroke();
    /* 襪子 */
    const sx0 = Bx - dx * 40, sy0 = By - dy * 40;
    c.fillStyle = '#f6f3ea'; c.beginPath();
    c.moveTo(sx0 + nx * 13, sy0 + ny * 13); c.lineTo(Bx + nx * 13, By + ny * 13); c.lineTo(Bx - nx * 13, By - ny * 13); c.lineTo(sx0 - nx * 13, sy0 - ny * 13); c.closePath(); c.fill();
    c.fillStyle = '#4a74a8'; c.beginPath();
    c.moveTo(sx0 + nx * 13, sy0 + ny * 13); c.lineTo(sx0 + nx * 13 + dx * 9, sy0 + ny * 13 + dy * 9);
    c.lineTo(sx0 - nx * 13 + dx * 9, sy0 - ny * 13 + dy * 9); c.lineTo(sx0 - nx * 13, sy0 - ny * 13); c.closePath(); c.fill();
    /* 球鞋 */
    c.translate(Fx, Fy); c.rotate(th * 0.6);
    const sg = c.createLinearGradient(0, -14, 0, 14); sg.addColorStop(0, '#46689b'); sg.addColorStop(1, '#2b4468');
    c.fillStyle = sg; c.beginPath();
    c.moveTo(-15, -10); c.lineTo(8, -10); c.quadraticCurveTo(26, -8, 33, 4); c.lineTo(33, 8); c.lineTo(-17, 8); c.quadraticCurveTo(-20, -2, -15, -10); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#f6f3ea'; rr(c, -18, 7, 53, 7, 3.5); c.fill(); c.stroke();
    c.strokeStyle = '#f6f3ea'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(6, -9); c.lineTo(14, -1); c.moveTo(0, -9); c.lineTo(8, -1); c.stroke();
    c.restore();
  }
  function drawKickFX(c) {
    const b = S.ball;
    if (b.f > 0.02) {
      const len = 50 + 40 * Math.max(b.sq, 0.4);
      c.save(); c.globalAlpha = b.f;
      arrow(c, b.x - 52, GY - 2 * BALL_R - 40, b.x - 52 + len, GY - 2 * BALL_R - 40, COL.coral, 7); c.restore();
      label(c, T('力 F', 'Force F'), b.x - 52 + len / 2, GY - 2 * BALL_R - 72, COL.coral, 22, 'center', b.f);
    }
    if (b.v > 8) {
      const len = clamp(b.v / 290 * 70, 12, 70), x0 = b.x + BALL_R + 14, y0 = GY - BALL_R - 56;
      c.save(); c.setLineDash([9, 6]); arrow(c, x0, y0, x0 + len, y0, COL.dim, 5); c.restore();
      label(c, T('速度 v', 'Speed v'), x0 + len / 2 - 6, y0 - 28, COL.dim, 22, 'center', clamp(b.v / 80, 0, 1));
    }
  }

  function clayPath(c, d) {
    const h = lerp(CLAY_H0, CLAY_HF, d), w = lerp(CLAY_W0, CLAY_WF, d), p = lerp(0.72, 0.26, d), n = 40;
    c.beginPath(); c.moveTo(CLAY_X - w / 2, GY);
    for (let i = 0; i <= n; i++) {
      const a = Math.PI - i * Math.PI / n, s = Math.pow(Math.max(0, Math.sin(a)), p);
      const bulge = 1 + 0.06 * Math.sin(a * 3 + 0.6) * (0.4 + d);
      c.lineTo(CLAY_X + Math.cos(a) * w / 2 * bulge, GY - h * s);
    }
    c.lineTo(CLAY_X + w / 2, GY); c.closePath();
    return { h, w };
  }
  function drawClay(c) {
    const d = S.press ? clamp(Math.max(S.clay.d, (CLAY_H0 - clamp(GY - plateBottom(), CLAY_HF, CLAY_H0)) / (CLAY_H0 - CLAY_HF)), 0, 1) : S.clay.d;
    const sh = lerp(CLAY_W0, CLAY_WF, d) / 2 + 24; shadow(c, CLAY_X, sh, 1);
    const { h, w } = clayPath(c, d);
    const g = c.createLinearGradient(CLAY_X - w / 2, GY - h, CLAY_X + w / 2, GY);
    g.addColorStop(0, '#dcb68a'); g.addColorStop(0.55, '#c39a6c'); g.addColorStop(1, '#8f6c48');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 2.5; c.stroke();
    c.save(); clayPath(c, d); c.clip();
    const hl = c.createRadialGradient(CLAY_X - w * 0.18, GY - h * 0.78, 2, CLAY_X - w * 0.18, GY - h * 0.78, w * 0.35);
    hl.addColorStop(0, 'rgba(255,240,215,0.55)'); hl.addColorStop(1, 'rgba(255,240,215,0)');
    c.fillStyle = hl; c.fillRect(CLAY_X - w / 2, GY - h - 4, w, h + 4);
    c.strokeStyle = 'rgba(89,62,36,0.35)'; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(CLAY_X + (k - 1) * w * 0.22, GY - h * 0.35, 6 + k * 2, 0.2, 2.6); c.stroke(); }
    c.restore();
  }
  function drawPress(c) {
    const pb = plateBottom(), pw = 170, ph = 34, top = pb - ph;
    c.save();
    /* 連桿（從站頂垂下來） */
    const rg = c.createLinearGradient(CLAY_X - 11, 0, CLAY_X + 11, 0); rg.addColorStop(0, '#9fb3bb'); rg.addColorStop(0.5, '#d4e0e4'); rg.addColorStop(1, '#6c8490');
    c.fillStyle = rg; c.fillRect(CLAY_X - 10, 68, 20, top - 68);
    c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 2; c.strokeRect(CLAY_X - 10, 68, 20, top - 68);
    c.fillStyle = '#6c8490'; rr(c, CLAY_X - 22, 62, 44, 12, 5); c.fill(); c.stroke();
    const pg = c.createLinearGradient(0, top, 0, pb); pg.addColorStop(0, '#b9cbd2'); pg.addColorStop(0.5, '#8aa3ad'); pg.addColorStop(1, '#5e7882');
    c.fillStyle = pg; rr(c, CLAY_X - pw / 2, top, pw, ph, 8); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; rr(c, CLAY_X - pw / 2 + 8, top + 5, pw - 16, 6, 3); c.fill();
    c.restore();
    /* 向下的力 */
    if (S.press && S.press.t > 0.3 && S.press.t < P_DOWN + P_HOLD) {
      const u = S.press.t < P_DOWN ? clamp((S.press.t - 0.3) / 0.4, 0, 1) : 1;
      const x = CLAY_X + 62, y1 = top + 6;
      c.save(); c.globalAlpha = u; arrow(c, x, y1 - 66, x, y1, COL.coral, 7); c.restore();
      label(c, T('力 F', 'Force F'), x, y1 - 84, COL.coral, 22, 'center', u);
    }
  }

  /* 磁鐵與鐵釘 */
  function drawNail(c, n) {
    const s = (GY - 5) - n.y, th = (Math.PI / 2) * clamp(s / 28, 0, 1);
    c.save(); c.translate(n.x, n.y); c.rotate(n.stuck >= 0 ? Math.PI / 2 : th);
    const L = NAIL_L / 2;
    const g = c.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#e6eef0'); g.addColorStop(0.5, '#a9bbc2'); g.addColorStop(1, '#6a808a');
    c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-L, 0); c.lineTo(-L + 10, -4.5); c.lineTo(L - 4, -4.5); c.lineTo(L - 4, 4.5); c.lineTo(-L + 10, 4.5); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(L - 2, 0, 5, 11, 0, 0, TAU); c.fill(); c.stroke();
    c.restore();
    if (n.flash > 0.01) {
      c.save(); c.strokeStyle = rgba(COL.yellow, n.flash); c.lineWidth = 4;
      c.beginPath(); c.arc(n.x, n.y - (n.stuck >= 0 ? 28 : 0), 14 + (1 - n.flash) * 34, 0, TAU); c.stroke(); c.restore();
    }
  }
  function drawMagnet(c) {
    const { x: mx, y: my } = S.mag, act = S.maxF > 6;
    const P = poles();
    /* 吸力範圍（虛線圈＋柔光） */
    P.forEach(p => {
      const cx = p.x, cy = p.y + 28;
      const g = c.createRadialGradient(cx, cy, 6, cx, cy, R_MAG);
      g.addColorStop(0, rgba(COL.coral, act ? 0.17 : 0.1)); g.addColorStop(1, rgba(COL.coral, 0));
      c.save(); c.beginPath(); c.rect(Z[2][0], 12, Z[2][1] - Z[2][0], GY - 12); c.clip();
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R_MAG, 0, TAU); c.fill();
      c.setLineDash([7, 9]); c.lineWidth = 2; c.strokeStyle = rgba(COL.coral, act ? 0.5 : 0.32); c.stroke();
      c.restore();
    });
    c.save();
    c.lineJoin = 'round';
    const path = () => { c.beginPath(); c.moveTo(mx - 28, my + 34); c.lineTo(mx - 28, my - 4); c.arc(mx, my - 4, 28, Math.PI, 0); c.lineTo(mx + 28, my + 34); };
    c.lineCap = 'butt';
    path(); c.lineWidth = 28; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.stroke();
    path(); c.lineWidth = 22; c.strokeStyle = '#d9473f'; c.stroke();
    path(); c.lineWidth = 6; c.strokeStyle = 'rgba(255,200,190,0.55)';
    c.save(); c.translate(-5, -3); c.stroke(); c.restore();
    [-28, 28].forEach(dx => {
      c.beginPath(); c.moveTo(mx + dx, my + 17); c.lineTo(mx + dx, my + 34); c.lineWidth = 22; c.strokeStyle = '#d6dfe2'; c.stroke();
      c.beginPath(); c.moveTo(mx + dx - 5, my + 17); c.lineTo(mx + dx - 5, my + 34); c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
      c.beginPath(); c.moveTo(mx + dx - 11, my + 17); c.lineTo(mx + dx + 11, my + 17); c.lineWidth = 2; c.strokeStyle = 'rgba(11,26,21,0.7)'; c.stroke();
    });
    c.restore();
    if (!S.drag && !S.auto && S.hover) { /* 抓取提示 */
      c.save(); c.strokeStyle = rgba(COL.yellow, 0.7); c.lineWidth = 2; c.setLineDash([5, 5]); rr(c, mx - 50, my - 46, 100, 100, 14); c.stroke(); c.restore();
    }
  }
  function drawMagForces(c) {
    let top = null;
    S.nails.forEach(n => {
      if (n.stuck >= 0 || n.F < 6) return;
      const len = 16 + 84 * Math.pow(n.F / A_MAX, 0.55);
      const x0 = n.x + n.dir[0] * 16, y0 = n.y - 4 + n.dir[1] * 16;
      arrow(c, x0, y0, x0 + n.dir[0] * len, y0 + n.dir[1] * len, COL.coral, 6);
      if (!top || n.F > top.F) top = { n, F: n.F, len, x0, y0 };
    });
    if (top) {
      const n = top.n, ex = top.x0 + n.dir[0] * top.len, ey = top.y0 + n.dir[1] * top.len;
      const lx = clamp(ex + (n.dir[0] >= 0 ? -34 : 34), Z[2][0] + 56, Z[2][1] - 56);
      label(c, T('磁力 F', 'Magnetic F'), lx, clamp(ey - 8, 70, GY - 40), COL.coral, 22);
    }
  }

  function statusLines() {
    const b = S.ball, kicking = !!S.kick && S.kick.phase === 'go' && S.kick.t > K_WIND + K_SWING - 0.02;
    const moved = b.x > BALL_X0 + 6 || b.v > 0;
    const sq = b.sq > 0.05;
    const z1a = b.v > 8 ? [T('運動：向右飛，有速度', 'Motion: moving'), COL.yellow] : moved ? [T('運動：已被踢出，停下了', 'Motion: stopped'), COL.white] : [T('運動：靜止', 'Motion: at rest'), COL.dim];
    const z1b = sq ? [T('形狀：被壓扁了！', 'Shape: squashed'), COL.yellow] : [T('形狀：圓形', 'Shape: round'), COL.dim];
    void kicking;
    const flat = S.clay.d > 0.5;
    const z2a = flat ? [T('形狀：被壓扁，保持住', 'Shape: flattened'), COL.yellow] : [T('形狀：原本的圓丘', 'Shape: lump'), COL.dim];
    const z2b = flat ? [T('運動：沒有改變', 'Motion: same'), COL.dim] : [T('運動：靜止', 'Motion: at rest'), COL.dim];
    const stuckN = S.nails.filter(n => n.stuck >= 0).length, moving = S.maxF > 6;
    const z3a = stuckN === 2 ? [T('鐵釘：被磁鐵吸住了', 'Nails: held'), COL.yellow]
      : stuckN === 1 ? [T('鐵釘：吸住一根', 'Nails: one held'), COL.yellow]
        : moving ? [T('鐵釘：被吸過來（沒碰到）', 'Nails: pulled!'), COL.yellow] : [T('鐵釘：沒被吸', 'Nails: not pulled'), COL.dim];
    const z3b = [T('拖曳磁鐵；虛線圈＝吸力範圍', 'Drag it; ring = range'), COL.dim];
    return [[z1a, z1b], [z2a, z2b], [z3a, z3b]];
  }
  function drawHeaders(c) {
    const H3 = [
      [T('① 踢球｜接觸力', '① Kick | contact'), COL.coral],
      [T('② 壓黏土｜接觸力', '② Clay | contact'), COL.coral],
      [T('③ 磁鐵｜超距力', '③ Magnet | distance'), COL.coral]
    ];
    H3.forEach(([s, col], i) => {
      const [x0, x1] = Z[i], cx = (x0 + x1) / 2;
      label(c, s, cx, 42, col, fit(c, s, x1 - x0 - 24, 24, 22));
    });
    const L = statusLines();
    L.forEach((rows, i) => {
      const [x0, x1] = Z[i], cx = (x0 + x1) / 2;
      rows.forEach(([s, col], j) => label(c, s, cx, GY + 46 + j * 44, col, fit(c, s, x1 - x0 - 20, 22, 22)));
    });
  }

  function render() {
    if (!ctx) return;
    const c = ctx; S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawBackdrop(c);
    drawHeaders(c);
    drawClay(c); drawPress(c);
    drawBall(c); drawLeg(c); drawKickFX(c);
    drawMagnet(c);
    S.nails.forEach(n => drawNail(c, n));
    /* 吸住的釘子要壓在磁鐵上 */
    drawMagForces(c);
  }

  /* ═════════ 迴圈 ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    simulate(dt);
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  /* ═════════ 操作 ═════════ */
  const ACTIONS = {
    kick() {
      S.note = 'kick';
      const b = S.ball, moved = Math.abs(b.x - BALL_X0) > 2 || b.v > 0;
      b.v = 0; b.sq = 0; b.f = 0;
      S.kick = { phase: moved ? 'back' : 'go', bt: 0, t: 0, bx: b.x, launched: false };
    },
    press() {
      S.note = 'press'; S.press = { t: 0 };
    },
    magnet() {
      S.note = 'magnet'; S.drag = null;
      if (S.nails.some(n => n.stuck >= 0) || S.nails.some(n => Math.abs(n.x - NAIL0[0].x) > 80 && false)) resetNails();
      resetNails();
      S.auto = { t: 0, fx: S.mag.x, fy: S.mag.y };
    },
    reset() { S.note = 'idle'; resetAll(); }
  };
  function act(k) {
    if (!ACTIONS[k]) return;
    S.actions++; ACTIONS[k](); updateUI();
    if (!S.raf) render();
  }

  const BTNS = [['kick', '踢球（改變運動）', 'Kick (changes motion)'], ['press', '壓扁（改變形狀）', 'Squash (changes shape)'],
    ['magnet', '磁鐵吸鐵釘（超距力）', 'Magnet pulls nails (distance force)'], ['reset', '↺ 重設', '↺ Reset']];
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    for (const [k, zh, en] of BTNS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = k;
      b.setAttribute('data-zh', zh); b.setAttribute('data-en', en); b.textContent = T(zh, en);
      b.addEventListener('click', () => act(k));
      ctrl.appendChild(b);
    }
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act, on = k === S.note;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    if (cv) cv.setAttribute('aria-label', T('力的觀測站：用按鈕踢球、壓黏土、讓磁鐵吸鐵釘；也可以拖曳磁鐵靠近鐵釘。鍵盤 1、2、3 觸發，R 重設，方向鍵移動磁鐵',
      'Force observatory: use the buttons to kick the ball, squash the clay or let the magnet pull the nails; you can also drag the magnet near the nails. Keys 1, 2, 3 trigger, R resets, arrows move the magnet'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const M = {
      idle: [T('請選擇下方按鈕進行力學觀測', 'Choose a button below to start observing forces'), '', ''],
      kick: [T('【接觸力】改變運動狀態（產生速度）', '[Contact force] Changes the state of motion (the ball gains speed)'),
        T('腳碰到球，球才踢得動；同時球也被壓扁了一下，形狀也變了。', 'The foot must touch the ball. The ball also squashes for a moment, so its shape changes too.'), ''],
      press: [T('【接觸力】改變物體形狀（形變）', '[Contact force] Changes the shape of the object (deformation)'),
        T('壓板碰到黏土，黏土被壓扁；壓板拿開後，形狀還是保持。', 'The plate touches the clay and flattens it. After the plate lifts away, the shape stays.'), ''],
      magnet: [T('【超距力】不需接觸即可施力', '[Action-at-a-distance force] Acts without touching'),
        T('磁鐵沒有碰到鐵釘，鐵釘就被吸過去；越近吸力越大（箭頭越長）。', 'The magnet never touches the nails, yet they are pulled. The closer, the stronger the pull (longer arrow).'), '']
    }[S.note] || ['', '', ''];
    res.innerHTML = `<div class="lf-main${S.note === 'idle' ? ' lf-idle' : ''}">${M[0]}</div>` + (M[1] ? `<div class="lf-sub">${M[1]}</div>` : '');
  }

  /* ═════════ 拖曳與鍵盤 ═════════ */
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  const hitMag = (x, y) => Math.abs(x - S.mag.x) < 64 && y > S.mag.y - 58 && y < S.mag.y + 62;
  function moveMag(x, y) { S.mag.x = clamp(x, M_X[0], M_X[1]); S.mag.y = clamp(y, M_Y[0], M_Y[1]); }
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const [x, y] = pos(e); cv.focus({ preventScroll: true });
    if (!hitMag(x, y)) return;
    S.auto = null; S.drag = { dx: S.mag.x - x, dy: S.mag.y - y, id: e.pointerId };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    e.preventDefault(); if (!S.raf) render();
  }
  function onMove(e) {
    const [x, y] = pos(e);
    if (S.drag) { moveMag(x + S.drag.dx, y + S.drag.dy); e.preventDefault(); if (!S.raf) render(); return; }
    const h = hitMag(x, y); if (h !== S.hover) { S.hover = h; cv.style.cursor = h ? 'grab' : 'default'; }
  }
  function onUp() { if (S.drag) { S.drag = null; } }
  function onTouchStart(e) { const t = e.touches[0]; if (!t) return; const [x, y] = pos(t); if (hitMag(x, y) && e.cancelable) e.preventDefault(); }
  function onTouchMove(e) { if (S.drag && e.cancelable) e.preventDefault(); }
  function onKey(e) {
    const k = e.key;
    if (k === '1') { e.preventDefault(); act('kick'); }
    else if (k === '2') { e.preventDefault(); act('press'); }
    else if (k === '3') { e.preventDefault(); act('magnet'); }
    else if (k === 'r' || k === 'R') { e.preventDefault(); act('reset'); }
    else if (k.startsWith('Arrow')) {
      e.preventDefault(); S.auto = null;
      moveMag(S.mag.x + (k === 'ArrowRight' ? 16 : k === 'ArrowLeft' ? -16 : 0), S.mag.y + (k === 'ArrowDown' ? 16 : k === 'ArrowUp' ? -16 : 0));
      if (!S.raf) render();
    }
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
    cv.addEventListener('touchstart', onTouchStart, { passive: false });
    cv.addEventListener('touchmove', onTouchMove, { passive: false });
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
      cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('touchstart', onTouchStart); cv.removeEventListener('touchmove', onTouchMove);
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
    return {
      note: S.note, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2),
      ball: { x: +S.ball.x.toFixed(1), v: +S.ball.v.toFixed(1), sq: +S.ball.sq.toFixed(2) }, kick: S.kick ? { phase: S.kick.phase, t: +S.kick.t.toFixed(2) } : null,
      clay: +S.clay.d.toFixed(2), pressing: !!S.press,
      mag: { x: +S.mag.x.toFixed(1), y: +S.mag.y.toFixed(1) }, dragging: !!S.drag, auto: !!S.auto,
      nails: S.nails.map(n => ({ x: +n.x.toFixed(1), y: +n.y.toFixed(1), stuck: n.stuck, F: +n.F.toFixed(1) })), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-force.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-force .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-force .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-force .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-force canvas{display:block;width:100%;height:auto;outline:none;touch-action:pan-y}
#lab-force canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-force .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left;min-height:108px;box-sizing:border-box}
#lab-force .lf-main{font-size:22px;font-weight:700;color:#ff8040}
#lab-force .lf-main.lf-idle{color:#f6f3ea}
#lab-force .lf-sub{font-size:22px;color:#f6f3ea;margin-top:4px}
#lab-force .lab-controls{order:4;display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 2px}
#lab-force .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 16px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-force .lab-btn:hover{border-color:#ffe066}
#lab-force .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜力的觀測站', te = '🔧 Try it | The force observatory';
    const kz = '按下方按鈕，觀察力的兩種效應與兩種力；也可以直接用手指拖曳畫面裡的磁鐵，慢慢靠近鐵釘，看看鐵釘什麼時候被吸過去。';
    const ke = 'Use the buttons below to see the two effects of a force and two kinds of force. You can also drag the magnet in the picture slowly toward the nails and see when they get pulled.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.on) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _step(dt) { simulate(dt); render(); },
    _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
