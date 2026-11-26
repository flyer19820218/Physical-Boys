/* mechanics_3_lab_probe_1126_v1.js — 「動手做｜微觀接觸面探測儀」實驗台（#probeLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.probe = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab1 最後（所有 .sub-view 之後），並注入 <style id="lab-probe-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 畫面：左半＝木塊在桌面上（巨觀），右半＝放大鏡圓窗（放大 1000 倍）看接觸面兩排鋸齒。
 * 物理（以規格為準，不自己發明）：
 *   滑桿「向右施力 F」0～100 gw，步進 1。
 *   木板：最大靜摩擦力 60 gw、動摩擦力 40 gw；冰面 30／20；粗糙地面 90／60。
 *   F ≤ 最大靜摩擦力：木塊不動，靜摩擦力 f ＝ F（珊瑚箭頭向左，與推力等長），合力 ＝ 0。
 *   F ＞ 最大靜摩擦力：木塊滑動，f 掉到動摩擦力，合力 ＝ F － 動摩擦力 ＞ 0。
 * 微觀示意：上排（木塊底面）與下排（桌面）鋸齒同形、互相咬合；
 *   靜止時上排隨 F 沿接觸斜面略微被推高、鋸齒略微歪斜、咬合點亮起；
 *   滑動時上排整排向右「拖過去」，沿斜面爬上去再掉進下一格（跳過鋸齒）。
 * 木塊示意：滑動速度 ∝ 合力；撞到右端就停在擋塊邊界上，停一下後回到左邊再滑（循環）。
 * 動畫只在需要時跑 RAF（木塊在滑、或形變／歸位動畫還沒結束），靜止就停。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'probe', TAB = 'tab1';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* ═════════ 常數 ═════════ */
  const FMAX = 100;
  const MATS = [
    { id: 'ice', zh: '冰面', en: 'Ice', icon: '🧊', fs: 30, fk: 20, P: 34, h: 11, top: '#7cc4e4', bot: '#2c6a85', edge: '#d8f3ff', tab: '#4f8ea8', tab2: '#2f6177' },
    { id: 'wood', zh: '木板', en: 'Wood board', icon: '🪵', fs: 60, fk: 40, P: 56, h: 30, top: '#76461f', bot: '#3a2210', edge: '#e0b27a', tab: '#7a4a22', tab2: '#5a3516' },
    { id: 'rough', zh: '粗糙地面', en: 'Rough ground', icon: '🪨', fs: 90, fk: 60, P: 78, h: 54, top: '#6c685f', bot: '#38352f', edge: '#c9c3b6', tab: '#5d5951', tab2: '#3f3c36' }
  ];
  const DEF_MAT = 1;

  /* 巨觀（左半） */
  const PXG = 1.4;                                /* 箭頭 px／gw */
  const TBL_X0 = 12, TBL_X1 = 498, TBL_Y = 400, TBL_B = 452;
  const BW = 120, BH = 96;                        /* 木塊 */
  const X_START = 140, X_END = 350;               /* 木塊中心起點與終點（終點右緣貼擋塊） */
  const KV = 3.4;                                 /* 滑動速度 px/s ＝ KV × 合力(gw) */
  const Y_PUSH = 262, Y_PUSH_LBL = 230, Y_FR = 428, Y_FR_LBL = 484;
  /* 微觀（右半放大鏡） */
  const MC = { x: 722, y: 322 }, MR = 182, YB = MC.y + 40;
  const GAP = 2.5;                                /* 兩排鋸齒之間的細縫（px） */
  const MICRO_K = 0.8;                            /* 微觀拖動速度 ＝ 木塊速度 × MICRO_K */

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  /* 字寬超過 maxW 就縮字（最小 minSize），回傳實際字級 */
  function fitSize(c, s, size, maxW, minSize) {
    let z = size;
    while (z > minSize && tw(c, s, z) > maxW) z -= 1;
    return z;
  }

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    F: 0, mat: DEF_MAT,
    x: X_START, v: 0, hold: 0, fade: 1,      /* 木塊中心 x、速度 px/s、到頭停留秒數、回到起點後的淡入 */
    Xb: 0, sD: 0,                             /* 微觀：整排拖動位移、咬合形變程度（0～1，平滑） */
    idle: true, debug: false, boxes: [], actions: 0, note: 'start'
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;
  const M = () => MATS[S.mat];
  const moving = () => S.F > M().fs;
  const fricNow = () => (moving() ? M().fk : S.F);

  /* ═════════ 文字 ═════════ */
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save();
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  function pill(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x0 + w / 2, y, color, size, 'center'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
  }

  /* ═════════ 箭頭（長度 px，水平） ═════════ */
  function arrow(c, x0, y, dir, len, color, shaft, headL, headH, glow) {
    c.save();
    if (len > 0.5) {
      const hl = Math.min(headL, len), xe = x0 + dir * len, xs = xe - dir * hl;
      if (glow) { c.shadowColor = rgba(color, 0.85); c.shadowBlur = 14; }
      c.fillStyle = color;
      if (len > hl) c.fillRect(Math.min(x0, xs), y - shaft / 2, Math.abs(xs - x0), shaft);
      c.beginPath(); c.moveTo(xe, y); c.lineTo(xs, y - headH); c.lineTo(xs, y + headH); c.closePath(); c.fill();
      c.shadowColor = 'transparent';
    }
    c.fillStyle = color; c.strokeStyle = COL.deep; c.lineWidth = 2.5;
    c.beginPath(); c.arc(x0, y, 7, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  function leader(c, x, y0, y1, color) {
    c.save(); c.setLineDash([5, 6]); c.strokeStyle = rgba(color, 0.5); c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.restore();
  }

  /* ═════════ 巨觀：桌面、木塊 ═════════ */
  function drawTable(c) {
    const m = M();
    const g = c.createLinearGradient(0, TBL_Y, 0, TBL_B);
    g.addColorStop(0, m.tab); g.addColorStop(1, m.tab2);
    c.fillStyle = g; c.fillRect(TBL_X0, TBL_Y, TBL_X1 - TBL_X0, TBL_B - TBL_Y);
    c.fillStyle = 'rgba(246,243,234,0.08)'; c.fillRect(TBL_X0, TBL_B, TBL_X1 - TBL_X0, 8);
    /* 桌面上的刻度記號（固定不動，木塊相對它滑，才看得出在動） */
    c.strokeStyle = 'rgba(246,243,234,0.28)'; c.lineWidth = 2;
    for (let x = TBL_X0 + 24; x < TBL_X1; x += 30) { c.beginPath(); c.moveTo(x, TBL_Y + 1); c.lineTo(x, TBL_Y + 9); c.stroke(); }
    c.strokeStyle = m.edge; c.lineWidth = 4;
    c.beginPath(); c.moveTo(TBL_X0, TBL_Y); c.lineTo(TBL_X1, TBL_Y); c.stroke();
    /* 右端擋塊（紅白條紋） */
    const bx = X_END + BW / 2 + 8, bw = 14, bh = 58, by = TBL_Y - bh;
    c.save(); c.fillStyle = '#e8e2d2'; rr(c, bx, by, bw, bh, 4); c.fill();
    c.beginPath(); rr(c, bx, by, bw, bh, 4); c.clip();
    c.fillStyle = '#d6454a';
    for (let k = 0; k < 4; k++) c.fillRect(bx - 2, by + 6 + k * 14, bw + 4, 7);
    c.restore();
    c.strokeStyle = '#6b2326'; c.lineWidth = 2; rr(c, bx, by, bw, bh, 4); c.stroke();
  }
  function drawBlock(c, cx) {
    const x = cx - BW / 2, y = TBL_Y - BH;
    /* 速度線（動得快才畫，畫在木塊後方） */
    if (S.v > 25) {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 3; c.lineCap = 'round';
      [-30, 0, 30].forEach((dy, i) => {
        const len = 16 + Math.min(36, S.v * 0.12) - i % 2 * 7;
        c.beginPath(); c.moveTo(x - 8, y + BH / 2 + dy); c.lineTo(x - 8 - len, y + BH / 2 + dy); c.stroke();
      });
      c.restore();
    }
    c.save();
    const g = c.createLinearGradient(0, y, 0, y + BH);
    g.addColorStop(0, '#d49a5a'); g.addColorStop(1, '#a8703a');
    c.fillStyle = g; rr(c, x, y, BW, BH, 6); c.fill();
    c.beginPath(); rr(c, x + 1, y + 1, BW - 2, BH - 2, 6); c.clip();
    c.strokeStyle = 'rgba(90,52,22,0.45)'; c.lineWidth = 1.6;
    for (let k = 0; k < 7; k++) {
      const gy = y + 12 + k * 12;
      c.beginPath();
      for (let gx = 0; gx <= BW; gx += 6) {
        const yy = gy + Math.sin(gx * 0.08 + k * 1.7) * 2;
        if (gx === 0) c.moveTo(x + gx, yy); else c.lineTo(x + gx, yy);
      }
      c.stroke();
    }
    c.strokeStyle = '#7a4a22'; c.lineWidth = 10; c.strokeRect(x + 5, y + 5, BW - 10, BH - 10);
    c.restore();
    c.strokeStyle = '#4a2c12'; c.lineWidth = 3; rr(c, x, y, BW, BH, 6); c.stroke();
    label(c, T('木塊', 'Block'), cx, y + BH / 2, COL.white, 24);
  }

  /* 放大鏡圈與兩條切線（從木塊底面接觸處連到放大鏡圓窗） */
  function drawLinks(c, cx) {
    const px = cx, py = TBL_Y, dx = MC.x - px, dy = MC.y - py, d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx), al = Math.asin(MR / d), tl = Math.sqrt(d * d - MR * MR);
    c.save(); c.setLineDash([9, 8]); c.strokeStyle = 'rgba(246,243,234,0.38)'; c.lineWidth = 3;
    [ang - al, ang + al].forEach(th => {
      c.beginPath(); c.moveTo(px + 22 * Math.cos(th), py + 22 * Math.sin(th)); c.lineTo(px + tl * Math.cos(th), py + tl * Math.sin(th)); c.stroke();
    });
    c.restore();
  }
  function drawRing(c, cx) {
    c.save(); c.lineWidth = 4; c.strokeStyle = COL.yellow; c.fillStyle = 'rgba(255,224,102,0.12)';
    c.beginPath(); c.arc(cx, TBL_Y, 20, 0, TAU); c.fill(); c.stroke(); c.restore();
  }

  function drawMacroForces(c, cx) {
    const F = S.F, f = fricNow();
    const lp = F * PXG, lf = f * PXG;
    /* 推力（青，向右）：從木塊上緣引線到箭頭 */
    if (F > 0) leader(c, cx, TBL_Y - BH, Y_PUSH, COL.teal);
    arrow(c, cx, Y_PUSH, 1, lp, COL.teal, 12, 24, 15, false);
    const t1 = T('推力 F = ', 'Push F = ') + F + ' gw';
    const w1 = tw(c, t1, 22);
    label(c, t1, clamp(cx + lp / 2, 12 + w1 / 2, 496 - w1 / 2), Y_PUSH_LBL, COL.teal, 22, 'center');
    /* 摩擦力（珊瑚，向左）：從接觸面引線到桌面內的箭頭（與推力同比例，等長就看得出平衡） */
    if (f > 0) leader(c, cx, TBL_Y, Y_FR, COL.coral);
    arrow(c, cx, Y_FR, -1, lf, COL.coral, 12, 24, 15, true);
    const t2 = (moving() ? T('動摩擦力 f = ', 'Kinetic f = ') : T('靜摩擦力 f = ', 'Static f = ')) + f + ' gw';
    const w2 = tw(c, t2, 22);
    label(c, t2, clamp(cx - lf / 2, 12 + w2 / 2, 496 - w2 / 2), Y_FR_LBL, COL.coral, 22, 'center');
  }

  function drawMacroInfo(c) {
    const m = M();
    label(c, T('接觸面：', 'Surface: ') + T(m.zh, m.en), 16, 28, COL.white, 22, 'left');
    const s2 = T('最大靜摩擦力 ' + m.fs + ' gw｜動摩擦力 ' + m.fk + ' gw', 'Max static ' + m.fs + ' gw | Kinetic ' + m.fk + ' gw');
    const z = fitSize(c, s2, 22, 462, 20);
    label(c, s2, 16, 60, COL.dim, z, 'left');
    let txt, col;
    if (moving()) {
      if (S.hold > 0) { txt = T('滑到頭了，回到起點再滑', 'Reached the end, back to the start'); col = COL.coral; }
      else { txt = T('滑動中：鋸齒被拖過去', 'Sliding: teeth dragged over'); col = COL.yellow; }
    } else if (S.F > 0) { txt = T('靜止：鋸齒卡住了', 'At rest: teeth locked'); col = COL.green; }
    else { txt = T('靜止：還沒有施力', 'At rest: no push yet'); col = COL.green; }
    pill(c, txt, 16, 104, col, 22, 'left');
  }

  /* ═════════ 微觀：兩排鋸齒（放大鏡圓窗） ═════════ */
  /* 下排（桌面）鋸齒高度函式：谷 0，峰 h；峰向右歪 a（受力形變）。週期 P。 */
  function Lh(u, P, h, pk) {
    u = ((u % P) + P) % P;
    return u < pk ? h * u / pk : h * (P - u) / (P - pk);
  }
  function microGeom() {
    const m = M(), P = m.P, h = m.h;
    const a = 0.07 * P * S.sD, pk = P / 2 + a;
    const X = S.Xb + 0.09 * P * S.sD;                 /* 上排相對下排的水平位移 */
    /* 上排要抬高多少才不穿進下排：分段線性，最大值一定出現在頂點 */
    let lift = 0;
    [0, pk, X, pk + X].forEach(x => { lift = Math.max(lift, Lh(x, P, h, pk) - Lh(x - X, P, h, pk)); });
    return { m, P, h, a, pk, X, lift };
  }
  function drawMicro(c) {
    const g = microGeom(), m = g.m, P = g.P, h = g.h, pk = g.pk, X = g.X, lift = g.lift;
    const sliding = moving();
    c.save();
    c.beginPath(); c.arc(MC.x, MC.y, MR, 0, TAU); c.clip();
    const bgG = c.createRadialGradient(MC.x, MC.y, 20, MC.x, MC.y, MR);
    bgG.addColorStop(0, '#16342b'); bgG.addColorStop(1, '#0b1a15');
    c.fillStyle = bgG; c.fillRect(MC.x - MR, MC.y - MR, MR * 2, MR * 2);

    const xL = MC.x - MR - 2 * P, xR = MC.x + MR + 2 * P;
    const yBot = MC.y + MR + 4, yTop = MC.y - MR - 4;

    /* 下排（桌面） */
    const low = [];
    for (let i = Math.floor(xL / P); i <= Math.ceil(xR / P); i++) { low.push([i * P, YB]); low.push([i * P + pk, YB - h]); }
    c.beginPath(); c.moveTo(low[0][0], yBot);
    low.forEach(p => c.lineTo(p[0], p[1]));
    c.lineTo(low[low.length - 1][0], yBot); c.closePath();
    const lg = c.createLinearGradient(0, YB - h, 0, yBot);
    lg.addColorStop(0, m.top); lg.addColorStop(1, m.bot);
    c.fillStyle = lg; c.fill();
    c.save(); c.clip();
    /* 桌面材質紋理 */
    if (m.id === 'wood') {
      c.strokeStyle = 'rgba(40,20,6,0.35)'; c.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const yy = YB + 18 + k * 22; c.beginPath(); for (let x = xL; x <= xR; x += 12) { const y2 = yy + Math.sin(x * 0.03 + k) * 3; if (x === xL) c.moveTo(x, y2); else c.lineTo(x, y2); } c.stroke(); }
    } else if (m.id === 'rough') {
      for (let k = 0; k < 90; k++) {
        const rx = xL + ((k * 97) % 523) / 523 * (xR - xL), ry = YB + 8 + ((k * 61) % 211) / 211 * (yBot - YB);
        c.fillStyle = k % 3 ? 'rgba(20,18,14,0.35)' : 'rgba(246,243,234,0.18)';
        c.beginPath(); c.arc(rx, ry, 2 + (k % 4), 0, TAU); c.fill();
      }
    } else {
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
      for (let k = 0; k < 12; k++) { const rx = xL + ((k * 131) % 497) / 497 * (xR - xL), ry = YB + 14 + ((k * 53) % 157) / 157 * 120; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 24, ry - 14); c.stroke(); }
    }
    c.restore();
    c.strokeStyle = m.edge; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath(); low.forEach((p, i) => { if (i === 0) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }); c.stroke();

    /* 上排（木塊底面）：同形的鋸齒平移 (X, −lift−GAP) */
    const up = [], dy = lift + GAP;
    for (let i = Math.floor((xL - X) / P); i <= Math.ceil((xR - X) / P); i++) { up.push([i * P + X, YB - dy]); up.push([i * P + pk + X, YB - h - dy]); }
    c.beginPath(); c.moveTo(up[0][0], yTop);
    up.forEach(p => c.lineTo(p[0], p[1]));
    c.lineTo(up[up.length - 1][0], yTop); c.closePath();
    const ug = c.createLinearGradient(0, yTop, 0, YB);
    ug.addColorStop(0, '#b87d42'); ug.addColorStop(1, '#d9a266');
    c.fillStyle = ug; c.fill();
    c.save(); c.clip();
    c.strokeStyle = 'rgba(90,52,22,0.35)'; c.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const yy = YB - dy - h - 18 - k * 22; c.beginPath(); for (let x = xL; x <= xR; x += 12) { const y2 = yy + Math.sin(x * 0.025 + k * 1.3) * 3; if (x === xL) c.moveTo(x, y2); else c.lineTo(x, y2); } c.stroke(); }
    c.restore();
    c.strokeStyle = '#f2d2a4'; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath(); up.forEach((p, i) => { if (i === 0) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }); c.stroke();

    /* 咬合點：上下排貼在一起的那段斜面亮起（珊瑚）；靜止時隨 F 越來越亮，滑動時一直亮並冒火花 */
    const inten = sliding ? 1 : clamp(0.2 + 0.8 * S.sD, 0, 1) * (S.F > 0 ? 1 : 0);
    if (inten > 0.01) {
      const flick = sliding ? 0.82 + 0.18 * Math.sin(S.t * 38) : 1;
      let seg = [], clusters = [];
      const flush = () => { if (seg.length) { clusters.push(seg); seg = []; } };
      for (let x = MC.x - MR - 4; x <= MC.x + MR + 4; x += 0.5) {
        const diff = Lh(x, P, h, pk) - Lh(x - X, P, h, pk);
        if (diff >= lift - 0.7) seg.push(x); else flush();
      }
      flush();
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = rgba(COL.coral, 0.9 * inten); c.shadowBlur = 14 * inten;
      c.strokeStyle = rgba(COL.coral, clamp(inten * flick, 0, 1)); c.lineWidth = 3 + 4 * inten;
      clusters.forEach(cl => {
        c.beginPath();
        cl.forEach((x, i) => { const y = YB - Lh(x, P, h, pk) - GAP / 2; if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); });
        c.stroke();
      });
      c.shadowColor = 'transparent';
      clusters.forEach((cl, k) => {
        const xm = cl[Math.floor(cl.length / 2)], ym = YB - Lh(xm, P, h, pk) - GAP / 2;
        c.fillStyle = rgba('#fff0b0', clamp(inten, 0.3, 1)); c.strokeStyle = COL.coral; c.lineWidth = 3;
        c.beginPath(); c.arc(xm, ym, 3 + h * 0.06 + 3 * inten, 0, TAU); c.fill(); c.stroke();
        if (sliding && S.v > 3) {                      /* 摩擦生熱的小火花 */
          c.strokeStyle = rgba(COL.yellow, 0.9); c.lineWidth = 2.5;
          for (let s = 0; s < 3; s++) {
            const ph = (S.t * 5 + k * 0.37 + s * 0.33) % 1, ang = -Math.PI / 2 - 0.2 - s * 0.55 + Math.sin(k + s) * 0.2, r0 = 8 + ph * 16;
            c.globalAlpha = 1 - ph;
            c.beginPath(); c.moveTo(xm - Math.cos(ang) * 0 + Math.cos(ang) * r0, ym + Math.sin(ang) * r0);
            c.lineTo(xm + Math.cos(ang) * (r0 + 7), ym + Math.sin(ang) * (r0 + 7)); c.stroke();
          }
          c.globalAlpha = 1;
        }
      });
      c.restore();
    }
    c.restore();

    /* 放大鏡外框與握把 */
    c.save();
    c.lineCap = 'round';
    const hx0 = MC.x + MR * 0.72, hy0 = MC.y + MR * 0.72;
    c.strokeStyle = '#46310f'; c.lineWidth = 26; c.beginPath(); c.moveTo(hx0, hy0); c.lineTo(hx0 + 46, hy0 + 46); c.stroke();
    c.strokeStyle = '#a8703a'; c.lineWidth = 18; c.beginPath(); c.moveTo(hx0, hy0); c.lineTo(hx0 + 46, hy0 + 46); c.stroke();
    c.lineWidth = 9; c.strokeStyle = sliding ? COL.coral : COL.white;
    c.beginPath(); c.arc(MC.x, MC.y, MR, 0, TAU); c.stroke();
    c.lineWidth = 3; c.strokeStyle = 'rgba(11,26,21,0.7)';
    c.beginPath(); c.arc(MC.x, MC.y, MR + 5, 0, TAU); c.stroke();
    c.restore();

    /* 圓窗內的標示：木塊底面、推力小箭頭、桌面材質 */
    label(c, T('木塊底面', 'Block bottom'), MC.x, MC.y - 142, COL.white, 22, 'center');
    const lenF = S.F * 0.9;
    label(c, 'F', MC.x - 84, MC.y - 100, COL.teal, 24, 'center');
    arrow(c, MC.x - 62, MC.y - 100, 1, lenF, COL.teal, 9, 18, 12, false);
    label(c, T(m.zh, m.en), MC.x, MC.y + 140, COL.white, 22, 'center');
  }

  function drawTopText(c) {
    const l1 = T('放大 1000 倍：', '1000x zoom:');
    const l2 = T('鋸齒互相卡住產生阻力！', 'teeth lock together and resist!');
    const z = fitSize(c, l2, 22, 448, 20);
    label(c, l1, 948, 26, COL.yellow, 22, 'right');
    label(c, l2, 948, 56, COL.yellow, z, 'right');
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(250, 300, 20, 250, 300, 380);
    gl.addColorStop(0, 'rgba(255,224,102,0.05)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 500, H);
    drawTable(c);
    const cx = S.x;
    drawLinks(c, cx);
    c.save(); c.globalAlpha = clamp(S.fade, 0, 1);
    drawBlock(c, cx);
    drawRing(c, cx);
    drawMacroForces(c, cx);
    c.restore();
    drawMicro(c);
    drawMacroInfo(c);
    drawTopText(c);
  }

  /* ═════════ 迴圈（還有東西在動才跑） ═════════ */
  function sTarget() { return moving() ? 0 : clamp(S.F / M().fs, 0, 1); }
  function xbTarget() { const P = M().P; return Math.round(S.Xb / P) * P; }
  function needRun() {
    if (moving()) return true;
    return Math.abs(S.v) > 0.5 || S.hold > 0 || S.fade < 1 || Math.abs(S.sD - sTarget()) > 0.002 || Math.abs(S.Xb - xbTarget()) > 0.05;
  }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const m = M();
    if (moving()) {
      if (S.hold > 0) {
        S.v = 0; S.hold -= dt;
        if (S.hold <= 0) { S.hold = 0; S.x = X_START; S.fade = 0; }
      } else {
        const vt = KV * (S.F - m.fk);
        S.v += (vt - S.v) * (1 - Math.exp(-dt * 7));
        S.x += S.v * dt;
        if (S.x >= X_END) { S.x = X_END; S.v = 0; S.hold = 0.6; }
      }
      S.Xb += S.v * MICRO_K * dt;
      if (S.Xb > 1e6) S.Xb -= Math.floor(S.Xb / m.P) * m.P;
    } else {
      S.hold = 0;
      S.v *= Math.exp(-dt * 12); if (Math.abs(S.v) < 0.5) S.v = 0;
      S.x = clamp(S.x + S.v * dt, X_START, X_END);
      S.Xb += (xbTarget() - S.Xb) * (1 - Math.exp(-dt * 10));
      if (Math.abs(S.Xb - xbTarget()) < 0.02) S.Xb = xbTarget();
    }
    S.sD += (sTarget() - S.sD) * (1 - Math.exp(-dt * 10));
    if (Math.abs(S.sD - sTarget()) < 0.001) S.sD = sTarget();
    if (S.fade < 1) S.fade = Math.min(1, S.fade + dt / 0.35);
    render();
    if (needRun()) S.raf = requestAnimationFrame(frame); else S.idle = true;
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !S.idle;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() {
    S.idle = !needRun();
    sync(); if (!S.raf) render();
  }

  /* ═════════ 操作 ═════════ */
  function setF(v, note) {
    S.F = clamp(Math.round(v), 0, FMAX);
    S.note = note || 'F'; S.actions++;
    syncSliders(); updateResult(); kick();
  }
  function setMat(i) {
    if (i === S.mat) return;
    S.mat = clamp(i, 0, MATS.length - 1);
    S.Xb = 0; S.note = 'mat:' + MATS[S.mat].id; S.actions++;
    syncMatBtns(); updateResult(); kick();
  }
  function resetF() {
    S.F = 0; S.v = 0; S.hold = 0; S.fade = 1; S.x = X_START; S.note = 'zero'; S.actions++;
    syncSliders(); updateResult(); kick();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const row = document.createElement('div'); row.className = 'lab-row lab-srow';
    const nm = document.createElement('span'); nm.className = 'lab-name'; nm.style.color = COL.teal; nm.textContent = T('向右施力 F', 'Push right F');
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = FMAX; inp.step = 1; inp.value = S.F;
    inp.id = KEY + 'Slider'; inp.setAttribute('aria-label', T('向右施力 F（gw）', 'Push to the right F (gw)'));
    const val = document.createElement('span'); val.className = 'lab-val'; val.id = KEY + 'Val'; val.textContent = S.F + ' gw';
    inp.addEventListener('input', () => { const v = clamp(+inp.value, 0, FMAX); S.F = v; val.textContent = v + ' gw'; S.note = 'slider'; S.actions++; updateResult(); kick(); });
    row.append(nm, inp, val); ctrl.appendChild(row);

    const br = document.createElement('div'); br.className = 'lab-row lab-brow';
    const bl = document.createElement('span'); bl.className = 'lab-bl'; bl.textContent = T('接觸面：', 'Surface:'); br.appendChild(bl);
    MATS.forEach((m, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.mat = m.id;
      b.textContent = m.icon + ' ' + T(m.zh, m.en);
      b.addEventListener('click', () => setMat(i)); br.appendChild(b);
    });
    const z = document.createElement('button'); z.type = 'button'; z.className = 'lab-btn lab-zero'; z.dataset.act = 'zero';
    z.textContent = T('施力歸零', 'Release push'); z.addEventListener('click', resetF); br.appendChild(z);
    ctrl.appendChild(br);
    syncMatBtns();
  }
  function syncSliders() {
    const inp = document.getElementById(KEY + 'Slider'), val = document.getElementById(KEY + 'Val');
    if (inp) inp.value = S.F; if (val) val.textContent = S.F + ' gw';
  }
  function syncMatBtns() {
    if (!ctrl) return;
    ctrl.querySelectorAll('.lab-btn[data-mat]').forEach(b => {
      const on = b.dataset.mat === M().id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function updateUI() {
    if (cv) cv.setAttribute('aria-label', T('微觀接觸面探測儀：用滑桿調整向右的推力，觀察木塊與放大 1000 倍的兩排鋸齒',
      'Microscopic contact probe: use the slider to set the rightward push and watch the block and the two rows of teeth at 1000x'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const m = M(), F = S.F;
    let l1, l2;
    if (F > m.fs) {
      const net = F - m.fk;
      l1 = T(`<b class="lt-r">合力 ＝ ${F} − ${m.fk} ＝ ${net} gw ＞ 0，突破極限，滑動中！</b>`,
        `<b class="lt-r">Net force = ${F} − ${m.fk} = ${net} gw &gt; 0, limit broken, it slides!</b>`);
      l2 = T(`推力 F ＝ ${F} gw 超過最大靜摩擦力 ${m.fs} gw，摩擦力掉到動摩擦力 ${m.fk} gw。`,
        `Push F = ${F} gw is above the max static friction of ${m.fs} gw, so friction drops to the kinetic value of ${m.fk} gw.`);
    } else {
      l1 = T('<b class="lt-g">合力 ＝ 0，推不動（靜止狀態）</b>', '<b class="lt-g">Net force = 0, it will not budge (at rest)</b>');
      if (F === 0) l2 = T(`還沒有施力，摩擦力 f ＝ 0；最大靜摩擦力 ${m.fs} gw。`, `No push yet, so friction f = 0; max static friction is ${m.fs} gw.`);
      else if (F === m.fs) l2 = T(`推力 F ＝ ${F} gw，靜摩擦力 f ＝ ${F} gw，剛好到達最大靜摩擦力，再多一點就滑動。`,
        `Push F = ${F} gw, static friction f = ${F} gw: right at the max static friction, any more and it slides.`);
      else l2 = T(`推力 F ＝ ${F} gw，靜摩擦力 f ＝ ${F} gw（和推力一樣大、方向相反）；離最大靜摩擦力 ${m.fs} gw 還差 ${m.fs - F} gw。`,
        `Push F = ${F} gw, static friction f = ${F} gw (same size, opposite direction); ${m.fs - F} gw to go before the max static friction of ${m.fs} gw.`);
    }
    res.innerHTML = `<div>${l1}</div><div class="lt-t">${l2}</div>`;
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
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    S.idle = !needRun();
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    const m = M();
    return {
      F: S.F, mat: m.id, fs: m.fs, fk: m.fk, f: fricNow(), net: moving() ? S.F - m.fk : 0, moving: moving(),
      x: +S.x.toFixed(2), v: +S.v.toFixed(2), hold: +S.hold.toFixed(2), Xb: +S.Xb.toFixed(2), sD: +S.sD.toFixed(3),
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-probe.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column;width:100%}
#lab-probe h2{order:0;font-size:32px;font-weight:700;color:#4dd2ff;margin:0 0 4px;line-height:1.35}
#lab-probe .lab-sub{order:1;font-size:22px;line-height:1.5;margin:0 0 12px;color:#f6f3ea}
#lab-probe .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-probe canvas{display:block;width:100%;height:auto;outline:none}
#lab-probe .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-probe .result-box>div+div{margin-top:4px}
#lab-probe .lab-tip{order:4;font-size:22px;line-height:1.5;margin:8px 0 0;color:#a3b8b0}
#lab-probe .lab-controls{order:5;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-probe .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-probe .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-probe .lab-brow{min-height:44px;margin-top:2px}
#lab-probe .lab-name{font-size:22px;font-weight:700;min-width:7.2em}
#lab-probe .lab-bl{font-size:22px;font-weight:700;color:#a3b8b0}
#lab-probe .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;min-width:4.8em;text-align:right;color:#f6f3ea}
#lab-probe input[type=range]{flex:1 1 auto;min-width:0;height:36px;margin:0;background:transparent;cursor:pointer;touch-action:none;-webkit-appearance:none;appearance:none}
#lab-probe input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-probe input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-probe input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:34px;height:34px;margin-top:-12px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-probe input[type=range]::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-probe .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-probe .lab-btn:hover{border-color:#ffe066}
#lab-probe .lab-btn.on{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-probe .lt-r{color:#ffe066}#lab-probe .lt-g{color:#33cc99}
#lab-probe .lt-t{color:#a3b8b0}
@media (max-width:640px){#lab-probe.lab-desk{padding:12px 12px 14px}#lab-probe h2{font-size:26px}#lab-probe .lab-srow{flex-wrap:wrap}#lab-probe .lab-name{min-width:0;width:100%}#lab-probe input[type=range]{flex:1 1 150px}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '動手做｜微觀接觸面探測儀', te = 'Try it | Microscopic Contact Probe';
    const sz = '一點一點加大推力，看木塊什麼時候才被推動，鋸齒又發生了什麼事。', se = 'Slowly raise the push. When does the block finally move, and what happens to the teeth?';
    const kz = '再換一種接觸面試試：鋸齒越粗，要推開它越費力。', ke = 'Then switch the surface: the coarser the teeth, the harder the push needed.';
    d.innerHTML =
      `<h2 data-zh="${tz}" data-en="${te}">${T(tz, te)}</h2>` +
      `<div class="lab-sub" data-zh="${sz}" data-en="${se}">${T(sz, se)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-tip" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
