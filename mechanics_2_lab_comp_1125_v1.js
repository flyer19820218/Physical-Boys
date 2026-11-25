/* mechanics_2_lab_comp_1125_v1.js — 「動手做｜分力掃描儀」實驗台（#compLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.comp = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab4 最後，並注入 <style id="lab-comp-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 物理：March 沿拉桿方向（與水平夾角 θ）施力 F（gw）拉行李箱。
 *   水平分力 Fx = F·cosθ（往前拉）、垂直分力 Fy = F·sinθ（往上提）——程式內計算，顯示四捨五入。
 *   示意因果：前進速度 ∝ Fx（地面刻度線往後捲、輪子轉動）；Fy 越大，箱子前端被提起一點點。
 * 畫面：箭頭長度 ＝ gw × PX_PER_GW（畫面左下有比例尺）；長條圖高度 ∝ gw，滿格 ＝ 滑桿的 F 最大值。
 * 版面備註：March 面向右、走在箱子前面，箱子拖在他身後（左側），所以 F 與 Fx 都指向右上／右方，
 *   「前進」方向和畫面右方一致；為了不讓箱子跑出畫面，改成「地面刻度往左捲」表現速度。
 * 動畫只在物體還在動時跑（Fx>0 時箱子一直在走；θ=90° 靜止就停 RAF）。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'comp', TAB = 'tab4';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* ═════════ 常數 ═════════ */
  const TH_MIN = 0, TH_MAX = 90, TH_DEF = 30;
  const F_MIN = 50, F_MAX = 150, F_DEF = 100;
  const PX_PER_GW = 1.5;                 /* 箭頭：1 gw ＝ 1.5 px */
  const SPEED_K = 2.2;                   /* 示意速度：每 gw 水平分力 2.2 px/s（Fx=150 → 330 px/s） */
  const MAX_LIFT = 0.105;                /* 垂直分力 150 gw 時，前端抬起約 6° */
  const GY = 440;                        /* 地面線 y */
  const BX = 150, BW = 130, BH = 96, WR = 13, BOX_TOP = 118; /* 行李箱：左緣、寬、高、輪半徑、拉桿座離地高 */
  const PIVOT = { x: BX + 22, y: GY };   /* 後輪著地點（抬頭時的轉軸） */
  const SPR = { s: 0.7, w: 357, h: 349, px: 275, py: 348, fx: 337, fy: 150 }; /* March running.png：著地腳、拳頭位置 */
  const HNAT = (SPR.py - SPR.fy) * SPR.s, VX = (SPR.fx - SPR.px) * SPR.s; /* 站直時拳頭離地高、離著地腳水平距 */
  const D_MAX = 180, D_MIN = 8;          /* 手握點離拉桿座的距離範圍（px） */
  const CARD = { x0: 770, x1: 950, y0: 20, y1: 522 };
  const BAR = { base: 400, h: 300, w: 56, cx: [815, 905] };  /* 長條圖：滿格 300 px ＝ F_MAX */
  const LIM = { x0: 8, x1: 758, y0: 8, y1: 436 };            /* 標籤可用範圍 */

  /* ═════════ 物理 ═════════ */
  const rad = d => d * Math.PI / 180;
  const calc = (th, F) => ({ Fx: F * Math.cos(rad(th)), Fy: F * Math.sin(rad(th)) });

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

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    theta: TH_DEF, F: F_DEF,
    v: 0, dist: 0, wheel: 0, lift: 0,          /* 顯示用：速度、地面捲動距離、輪角、抬頭角 */
    actions: 0, note: 'start', boxes: [], idle: true, geo: null
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;
  let sTheta = null, sF = null, vTheta = null, vF = null;
  const IMG = new Image();
  IMG.onload = () => { if (!S.raf) render(); };
  IMG.src = 'assets/characters/march/running.png';

  const speedTarget = () => calc(S.theta, S.F).Fx * SPEED_K;
  const liftTarget = () => calc(S.theta, S.F).Fy / F_MAX * MAX_LIFT;

  /* ═════════ 文字 ═════════ */
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save();
    c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    S.boxes.push({ s, str: s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
  }
  function pillRect(c, s, x, y, size, align) {
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    return { x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2 };
  }
  function drawPill(c, s, r, color, size) {
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, (r.y1 - r.y0) / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke();
    c.font = font(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
    c.fillText(s, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2); c.restore();
    S.boxes.push({ s, str: s, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, size });
  }

  /* ═════════ 標籤自動避讓：依序試候選位置，選第一個不壓線、不壓別的標籤、不出界的 ═════════ */
  function segHits(segs, r, pad) {
    let n = 0;
    for (const sg of segs) {
      const L = Math.hypot(sg[2] - sg[0], sg[3] - sg[1]), m = Math.max(1, Math.ceil(L / 5));
      for (let i = 0; i <= m; i++) {
        const x = sg[0] + (sg[2] - sg[0]) * i / m, y = sg[1] + (sg[3] - sg[1]) * i / m;
        if (x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad) { n++; break; }
      }
    }
    return n;
  }
  function overlapArea(a, b) {
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }
  function placePill(c, s, color, cands, placed, segs, rects) {
    const size = 22; let best = null, bestSc = Infinity;
    for (const cd of cands) {
      const r = pillRect(c, s, cd.x, cd.y, size, cd.align || 'left');
      let sc = 0;
      if (r.x0 < LIM.x0) sc += (LIM.x0 - r.x0) * 400;
      if (r.x1 > LIM.x1) sc += (r.x1 - LIM.x1) * 400;
      if (r.y0 < LIM.y0) sc += (LIM.y0 - r.y0) * 400;
      if (r.y1 > LIM.y1) sc += (r.y1 - LIM.y1) * 400;
      for (const p of placed) sc += overlapArea(r, p) * 20 + (overlapArea({ x0: r.x0 - 6, y0: r.y0 - 6, x1: r.x1 + 6, y1: r.y1 + 6 }, p) > 0 ? 50 : 0);
      for (const o of rects) sc += overlapArea(r, o) * 20;
      sc += segHits(segs, r, 4) * 3000;
      sc += cands.indexOf(cd) * 0.01;
      if (sc < bestSc) { bestSc = sc; best = r; }
      if (sc < 1) break;
    }
    placed.push(best); drawPill(c, s, best, color, size);
    return best;
  }

  /* ═════════ 幾何：行李箱抬頭、拉桿、手握點、March 姿勢 ═════════ */
  function rotBox(x, y, a) {            /* 繞後輪著地點，把前端抬起 a（弧度） */
    const dx = x - PIVOT.x, dy = y - PIVOT.y;
    return { x: PIVOT.x + dx * Math.cos(a) + dy * Math.sin(a), y: PIVOT.y - dx * Math.sin(a) + dy * Math.cos(a) };
  }
  const heightAt = phi => (HNAT * Math.cos(phi) - VX * Math.sin(phi));  /* 前傾 phi 後拳頭離地高 */
  function solveLean(target) {
    if (target >= HNAT) return { phi: 0, h: HNAT };
    const hi = 0.32;
    if (heightAt(hi) > target) return { phi: hi, h: heightAt(hi) };
    let lo = 0, up = hi;
    for (let i = 0; i < 30; i++) { const m = (lo + up) / 2; if (heightAt(m) > target) lo = m; else up = m; }
    return { phi: (lo + up) / 2, h: target };
  }
  function geom() {
    const th = rad(S.theta), ct = Math.cos(th), st = Math.sin(th);
    const A = rotBox(BX + BW - 18, GY - BOX_TOP, S.lift), hA = GY - A.y;
    let d = st > 1e-6 ? (HNAT - hA) / st : D_MAX;
    d = clamp(d, D_MIN, D_MAX);
    const G = { x: A.x + d * ct, y: A.y - d * st };       /* 手握點（作用點） */
    const E = { x: G.x + 22 * ct, y: G.y - 22 * st };     /* 拉桿末端（握把） */
    const hf = GY - G.y;                                  /* 手握點離地高 */
    const lean = solveLean(hf);
    const vxr = VX * Math.cos(lean.phi) + HNAT * Math.sin(lean.phi);
    const Fp = { x: G.x - vxr, y: G.y + lean.h };         /* March 著地腳位置 */
    const f = calc(S.theta, S.F);
    const T2 = { x: G.x + f.Fx * PX_PER_GW, y: G.y - f.Fy * PX_PER_GW };
    return {
      A, G, E, d, th, ct, st, lean, Fp, f, T: T2,
      Hx: { x: T2.x, y: G.y }, Vy: { x: G.x, y: T2.y }
    };
  }

  /* ═════════ 繪圖元件 ═════════ */
  function arrow(c, x0, y0, x1, y1, col, lw, glow) {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 3) return;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L, hl = Math.min(20, L * 0.55), hw = hl * 0.55;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
    if (glow) { c.shadowColor = rgba(col, 0.75); c.shadowBlur = 10; }
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * hl * 0.7, y1 - uy * hl * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * hl - uy * hw, y1 - uy * hl + ux * hw);
    c.lineTo(x1 - ux * hl + uy * hw, y1 - uy * hl - ux * hw); c.closePath(); c.fill();
    c.restore();
  }
  function dashed(c, x0, y0, x1, y1, col) {
    if (Math.hypot(x1 - x0, y1 - y0) < 3) return;
    c.save(); c.setLineDash([8, 7]); c.strokeStyle = rgba(col, 0.85); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
  }

  function drawBackdrop(c) {
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(330, 260, 20, 330, 260, 440);
    gl.addColorStop(0, 'rgba(77,210,255,0.07)'); gl.addColorStop(1, 'rgba(77,210,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
  }
  function drawGround(c) {
    c.fillStyle = '#14352b'; c.fillRect(0, GY, W, H - GY);
    c.fillStyle = 'rgba(246,243,234,0.55)'; c.fillRect(0, GY, W, 3);
    /* 地面刻度：往後（左）捲，速度越快捲越快 */
    const sp = 70, i0 = Math.floor(S.dist / sp) - 1;
    c.lineCap = 'butt';
    for (let i = i0; i < i0 + Math.ceil(W / sp) + 3; i++) {
      const x = i * sp - S.dist, big = ((i % 4) + 4) % 4 === 0;
      c.strokeStyle = big ? 'rgba(246,243,234,0.85)' : 'rgba(163,184,176,0.55)'; c.lineWidth = big ? 4 : 2.5;
      c.beginPath(); c.moveTo(x, GY + 8); c.lineTo(x, GY + (big ? 36 : 24)); c.stroke();
    }
  }
  function drawMarch(c, g) {
    if (!(IMG.complete && IMG.naturalWidth)) return;
    const bob = S.v > 1 ? -2.2 * Math.abs(Math.sin(Math.PI * S.dist / 70)) * Math.min(1, S.v / 150) : 0;
    c.save();
    c.translate(g.Fp.x, g.Fp.y + bob); c.rotate(g.lean.phi);
    c.drawImage(IMG, -SPR.px * SPR.s, -SPR.py * SPR.s, SPR.w * SPR.s, SPR.h * SPR.s);
    c.restore();
  }
  function drawSuitcase(c, g) {
    /* 速度線（在箱子後方） */
    if (S.v > 20) {
      const len = Math.min(78, S.v * 0.26);
      c.save(); c.lineCap = 'round'; c.strokeStyle = rgba(COL.teal, clamp(S.v / 260, 0.25, 0.8)); c.lineWidth = 4;
      [[GY - 28, 1], [GY - 56, 0.7], [GY - 84, 0.85]].forEach(([y, k]) => {
        c.beginPath(); c.moveTo(BX - 14, y); c.lineTo(BX - 14 - len * k, y); c.stroke();
      });
      c.restore();
    }
    c.save();
    c.translate(PIVOT.x, PIVOT.y); c.rotate(-S.lift); c.translate(-PIVOT.x, -PIVOT.y);
    /* 箱體 */
    const bx = BX, by = GY - 22 - BH;
    c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    const gr = c.createLinearGradient(0, by, 0, by + BH);
    gr.addColorStop(0, '#7aa0c0'); gr.addColorStop(1, '#46698a');
    c.fillStyle = gr; rr(c, bx, by, BW, BH, 12); c.fill(); c.restore();
    c.strokeStyle = '#1f3447'; c.lineWidth = 3; rr(c, bx, by, BW, BH, 12); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 3;
    for (let i = 1; i <= 4; i++) { const x = bx + i * BW / 5; c.beginPath(); c.moveTo(x, by + 12); c.lineTo(x, by + BH - 12); c.stroke(); }
    c.fillStyle = '#243d52'; rr(c, bx + BW - 36, by - 6, 34, 10, 4); c.fill();        /* 拉桿座 */
    c.fillStyle = '#243d52'; rr(c, bx + 10, by - 6, 22, 10, 4); c.fill();              /* 提把座 */
    c.fillStyle = '#d6dfdc'; rr(c, bx + 10, by + BH - 18, 20, 10, 3); c.fill();       /* 護角 */
    c.fillStyle = '#d6dfdc'; rr(c, bx + BW - 30, by + BH - 18, 20, 10, 3); c.fill();
    /* 輪子（會轉） */
    [BX + 22, BX + BW - 22].forEach(wx => {
      const wy = GY - WR;
      c.fillStyle = '#17231f'; c.beginPath(); c.arc(wx, wy, WR, 0, TAU); c.fill();
      c.strokeStyle = '#9fb3ae'; c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = '#cfdad6'; c.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) {
        const a = S.wheel + k * TAU / 3;
        c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * (WR - 3), wy + Math.sin(a) * (WR - 3)); c.stroke();
      }
      c.fillStyle = '#cfdad6'; c.beginPath(); c.arc(wx, wy, 3, 0, TAU); c.fill();
    });
    c.restore();
  }
  /* 拉桿後段（畫在 March 後面，所以斜拉時桿子會穿到他身後）：箱子拉桿座 → 手握點 */
  function drawPoleBack(c, g) {
    const A = g.A, G = g.G, mx = A.x + (G.x - A.x) * 0.55, my = A.y + (G.y - A.y) * 0.55;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 13; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(G.x, G.y); c.stroke();
    c.strokeStyle = '#aab6b3'; c.lineWidth = 9; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(mx, my); c.stroke();
    c.strokeStyle = '#eef4f1'; c.lineWidth = 6; c.beginPath(); c.moveTo(mx, my); c.lineTo(G.x, G.y); c.stroke();
    c.restore();
  }
  /* 拉桿前段與握把（畫在 March 前面）：手握點 → 握把 */
  function drawPoleFront(c, g) {
    const G = g.G, E = g.E, px = Math.sin(g.th), py = Math.cos(g.th);
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 13; c.beginPath(); c.moveTo(G.x, G.y); c.lineTo(E.x, E.y); c.stroke();
    c.strokeStyle = '#eef4f1'; c.lineWidth = 6; c.beginPath(); c.moveTo(G.x, G.y); c.lineTo(E.x, E.y); c.stroke();
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 13;
    c.beginPath(); c.moveTo(E.x - px * 14, E.y - py * 14); c.lineTo(E.x + px * 14, E.y + py * 14); c.stroke();
    c.strokeStyle = '#8fa39e'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(E.x - px * 14, E.y - py * 14); c.lineTo(E.x + px * 14, E.y + py * 14); c.stroke();
    c.restore();
  }

  function drawVectors(c, g, placed) {
    const G = g.G, T2 = g.T, Hx = g.Hx, Vy = g.Vy, f = g.f;
    const lenF = Math.hypot(f.Fx, f.Fy) * PX_PER_GW;
    /* 補成長方形 */
    c.save(); c.fillStyle = 'rgba(246,243,234,0.07)';
    c.beginPath(); c.moveTo(G.x, G.y); c.lineTo(Hx.x, Hx.y); c.lineTo(T2.x, T2.y); c.lineTo(Vy.x, Vy.y); c.closePath(); c.fill(); c.restore();
    dashed(c, Hx.x, Hx.y, T2.x, T2.y, COL.pink);
    dashed(c, Vy.x, Vy.y, T2.x, T2.y, COL.teal);
    /* 角度弧 */
    const r = Math.min(58, lenF * 0.62);
    if (S.theta > 0 && r > 12) {
      c.save(); c.strokeStyle = COL.white; c.lineWidth = 3.5; c.fillStyle = 'rgba(246,243,234,0.14)';
      c.beginPath(); c.moveTo(G.x, G.y); c.arc(G.x, G.y, r, -g.th, 0, false); c.closePath(); c.fill();
      c.beginPath(); c.arc(G.x, G.y, r, -g.th, 0, false); c.stroke(); c.restore();
    }
    /* 分力與總力 */
    arrow(c, G.x, G.y, Hx.x, Hx.y, COL.teal, 6, true);
    arrow(c, G.x, G.y, Vy.x, Vy.y, COL.pink, 6, true);
    arrow(c, G.x, G.y, T2.x, T2.y, COL.coral, 7, true);
    /* 作用點 */
    c.save(); c.fillStyle = COL.coral; c.strokeStyle = COL.white; c.lineWidth = 3;
    c.beginPath(); c.arc(G.x, G.y, 8, 0, TAU); c.fill(); c.stroke(); c.restore();

    /* 標籤（自動避讓） */
    const nF = Math.round(S.F), nX = Math.round(f.Fx), nY = Math.round(f.Fy);
    const segs = [
      [G.x, G.y, T2.x, T2.y], [G.x, G.y, Hx.x, Hx.y], [G.x, G.y, Vy.x, Vy.y],
      [Hx.x, Hx.y, T2.x, T2.y], [Vy.x, Vy.y, T2.x, T2.y], [g.A.x, g.A.y, g.E.x, g.E.y]
    ];
    const rects = [
      { x0: T2.x - 12, y0: T2.y - 12, x1: T2.x + 12, y1: T2.y + 12 },
      { x0: Hx.x - 12, y0: Hx.y - 12, x1: Hx.x + 12, y1: Hx.y + 12 },
      { x0: Vy.x - 12, y0: Vy.y - 12, x1: Vy.x + 12, y1: Vy.y + 12 },
      { x0: G.x - 16, y0: G.y - 16, x1: G.x + 16, y1: G.y + 16 },
      { x0: BX - 4, y0: GY - BOX_TOP - 10, x1: BX + BW + 4, y1: GY },
      { x0: 0, y0: 0, x1: 0, y1: 0 }
    ];
    if (r > 12 && S.theta > 0) rects.push({ x0: G.x, y0: G.y - r, x1: G.x + r, y1: G.y });
    const tF = 'F = ' + nF + ' gw';
    const tX = T('水平分力 = ', 'Horizontal = ') + nX + ' gw';
    const tY = T('垂直分力 = ', 'Vertical = ') + nY + ' gw';
    const tA = 'θ = ' + Math.round(S.theta) + '°';
    const L = 16;
    placePill(c, tF, COL.coral, [
      { x: T2.x + L, y: T2.y - 10 }, { x: T2.x + L, y: T2.y + 28 }, { x: T2.x + L, y: T2.y - 48 },
      { x: T2.x - 12, y: T2.y + 34, align: 'right' }, { x: T2.x - 12, y: T2.y - 46, align: 'right' }, { x: T2.x + L, y: T2.y + 66 }
    ], placed, segs, rects);
    placePill(c, tY, COL.pink, [
      { x: G.x + L, y: Vy.y - 30 }, { x: T2.x + L, y: (T2.y + G.y) / 2 }, { x: T2.x + L, y: G.y - 14 },
      { x: G.x + L, y: Vy.y - 68 }, { x: G.x + L, y: Vy.y - 106 }, { x: T2.x + L, y: T2.y + 66 }, { x: T2.x + L, y: T2.y + 104 }
    ], placed, segs, rects);
    const ra = r + 14, ha = g.th / 2;
    const rA = placePill(c, tA, COL.white, [
      { x: G.x + ra * Math.cos(ha) + 4, y: G.y - ra * Math.sin(ha) + 4 },
      { x: G.x + r + 12, y: G.y - 28 },
      { x: G.x + L, y: G.y + 35 },
      { x: G.x + L, y: G.y + 73 }, { x: G.x + L, y: G.y + 111 }, { x: G.x + L, y: G.y + 35 },
      { x: G.x + L, y: G.y + 149 }
    ], placed, segs, rects);
    placePill(c, tX, COL.teal, [
      { x: rA.x1 + 10, y: (rA.y0 + rA.y1) / 2 },
      { x: G.x + L, y: G.y + 35 }, { x: G.x + L, y: G.y + 73 }, { x: G.x + L, y: G.y + 111 }
    ], placed, segs, rects);
  }

  function drawCard(c) {
    const f = calc(S.theta, S.F);
    c.save(); c.fillStyle = 'rgba(11,26,21,0.96)'; rr(c, CARD.x0, CARD.y0, CARD.x1 - CARD.x0, CARD.y1 - CARD.y0, 14); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.stroke(); c.restore();
    label(c, T('分力大小', 'Components'), (CARD.x0 + CARD.x1) / 2, 46, COL.white, 22);
    const items = [
      { v: f.Fx, col: COL.teal, name: T('水平', 'Horiz.') },
      { v: f.Fy, col: COL.pink, name: T('垂直', 'Vert.') }
    ];
    items.forEach((it, i) => {
      const cx = BAR.cx[i], hh = it.v / F_MAX * BAR.h, x0 = cx - BAR.w / 2;
      c.fillStyle = 'rgba(246,243,234,0.07)'; rr(c, x0, BAR.base - BAR.h, BAR.w, BAR.h, 6); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.55)'; c.lineWidth = 2; rr(c, x0, BAR.base - BAR.h, BAR.w, BAR.h, 6); c.stroke();
      c.save(); c.setLineDash([5, 5]); c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0, BAR.base - BAR.h / 2); c.lineTo(x0 + BAR.w, BAR.base - BAR.h / 2); c.stroke(); c.restore();
      if (hh > 1) {
        const gr = c.createLinearGradient(0, BAR.base - hh, 0, BAR.base);
        gr.addColorStop(0, it.col); gr.addColorStop(1, rgba(it.col, 0.6));
        c.save(); c.shadowColor = rgba(it.col, 0.6); c.shadowBlur = 10;
        c.fillStyle = gr; rr(c, x0 + 3, BAR.base - hh, BAR.w - 6, hh, 4); c.fill(); c.restore();
      }
      label(c, Math.round(it.v) + ' gw', cx, BAR.base - BAR.h - 20, it.col, 22);
      label(c, it.name, cx, BAR.base + 32, it.col, 22);
    });
    label(c, T('滿格 = ', 'Full = ') + F_MAX + ' gw', (CARD.x0 + CARD.x1) / 2, 482, COL.dim, 22);
  }
  function drawScale(c) {
    const x0 = 30, y = 500, len = 50 * PX_PER_GW;
    c.save(); c.strokeStyle = COL.coral; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + len, y); c.moveTo(x0, y - 8); c.lineTo(x0, y + 8); c.moveTo(x0 + len, y - 8); c.lineTo(x0 + len, y + 8); c.stroke(); c.restore();
    label(c, T('= 50 gw（箭頭長度比例）', '= 50 gw (arrow scale)'), x0 + len + 14, y, COL.white, 22, 'left');
    label(c, T('前進速度 ∝ 水平分力', 'Speed ∝ horizontal'), 520, y, COL.teal, 22, 'left');
  }

  function render() {
    if (!ctx) return;
    const c = ctx;
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawBackdrop(c);
    const g = geom(); S.geo = g;
    drawGround(c);
    drawPoleBack(c, g);
    drawMarch(c, g);
    drawSuitcase(c, g);
    drawPoleFront(c, g);
    drawVectors(c, g, []);
    drawCard(c);
    drawScale(c);
  }

  /* ═════════ 迴圈（只在有動作時跑，靜止就停） ═════════ */
  function settled() {
    return Math.abs(S.v - speedTarget()) < 0.01 && speedTarget() < 0.01 && Math.abs(S.lift - liftTarget()) < 0.0004;
  }
  function snap() { S.v = speedTarget(); S.lift = liftTarget(); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const vt = speedTarget();
    S.v += (vt - S.v) * (1 - Math.exp(-dt * 5));
    if (Math.abs(S.v - vt) < 0.3) S.v = vt;
    S.dist = (S.dist + S.v * dt) % 70000;
    S.wheel = (S.wheel + S.v / WR * dt) % TAU;
    const lt = liftTarget();
    S.lift += (lt - S.lift) * (1 - Math.exp(-dt * 9));
    if (Math.abs(S.lift - lt) < 0.0004) S.lift = lt;
    S.idle = false;
    render();
    if (settled()) { snap(); S.idle = true; render(); return; }
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !S.idle;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }
  function kick() { S.idle = settled(); if (!S.idle) sync(); if (!S.raf) render(); }

  /* ═════════ 操作 ═════════ */
  function setVals(th, F, note) {
    S.theta = clamp(Math.round(th), TH_MIN, TH_MAX);
    S.F = clamp(Math.round(F / 10) * 10, F_MIN, F_MAX);
    S.note = note; S.actions++;
    updateUI(); kick();
  }
  function reset() { setVals(TH_DEF, F_DEF, 'reset'); }

  function mkSlider(name, min, max, step, onInput) {
    const row = document.createElement('div'); row.className = 'lab-row lab-slider';
    const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
    inp.setAttribute('aria-label', name);
    inp.addEventListener('input', () => onInput(+inp.value));
    row.appendChild(inp);
    const val = document.createElement('span'); val.className = 'lab-val'; row.appendChild(val);
    return { row, inp, val };
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const a = mkSlider(T('施力角度 θ', 'Pull angle θ'), TH_MIN, TH_MAX, 1, v => { S.theta = v; S.note = 'theta'; S.actions++; updateUI(); kick(); });
    const b = mkSlider(T('總施力 F', 'Total force F'), F_MIN, F_MAX, 10, v => { S.F = v; S.note = 'F'; S.actions++; updateUI(); kick(); });
    sTheta = a.inp; vTheta = a.val; sF = b.inp; vF = b.val;
    ctrl.appendChild(a.row); ctrl.appendChild(b.row);
    const row = document.createElement('div'); row.className = 'lab-row';
    [['low', T('壓低拉桿（15°）', 'Lower handle (15°)')], ['high', T('抬高拉桿（60°）', 'Raise handle (60°)')], ['reset', T('重設', 'Reset')]].forEach(([k, text]) => {
      const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'lab-btn'; bt.dataset.act = k; bt.textContent = text;
      bt.addEventListener('click', () => {
        if (k === 'low') setVals(15, S.F, 'low'); else if (k === 'high') setVals(60, S.F, 'high'); else reset();
      });
      row.appendChild(bt);
    });
    ctrl.appendChild(row);
  }
  function updateUI() {
    if (sTheta) { sTheta.value = S.theta; vTheta.textContent = S.theta + '°'; }
    if (sF) { sF.value = S.F; vF.textContent = S.F + ' gw'; }
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(bt => {
      const on = (bt.dataset.act === 'low' && S.theta === 15) || (bt.dataset.act === 'high' && S.theta === 60);
      bt.classList.toggle('active', on);
    });
    if (cv) cv.setAttribute('aria-label', T('分力掃描儀：調整施力角度與總施力，觀察水平分力與垂直分力', 'Component scanner: change the pull angle and total force to see the horizontal and vertical components'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const f = calc(S.theta, S.F), nX = Math.round(f.Fx), nY = Math.round(f.Fy), th = Math.round(S.theta);
    const l1 = T(`θ = ${th}°：<b class="lc-x">水平分力 ≈ ${nX} gw</b>（往前拉），<b class="lc-y">垂直分力 ≈ ${nY} gw</b>（往上提）`,
      `θ = ${th}°: <b class="lc-x">horizontal component ≈ ${nX} gw</b> (pulls forward), <b class="lc-y">vertical component ≈ ${nY} gw</b> (lifts up)`);
    let l2;
    if (th < 45) l2 = T('角度平緩：水平分力比較大，行李箱比較好拉', 'Shallow angle: the horizontal component is larger, so the suitcase is easier to pull');
    else if (th > 45) l2 = T('角度陡：垂直分力比較大，力氣多花在往上提', 'Steep angle: the vertical component is larger, so more effort goes into lifting');
    else l2 = T('兩個分力一樣大', 'The two components are equal');
    res.innerHTML = `<div>${l1}</div><div class="lc-t">${l2}</div>`;
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
    S.idle = settled(); render(); sync();
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
    const f = calc(S.theta, S.F);
    return {
      theta: S.theta, F: S.F, Fx: +f.Fx.toFixed(3), Fy: +f.Fy.toFixed(3), shownFx: Math.round(f.Fx), shownFy: Math.round(f.Fy),
      speed: +S.v.toFixed(2), speedTarget: +speedTarget().toFixed(2), lift: +S.lift.toFixed(4), dist: +S.dist.toFixed(1),
      hand: S.geo ? { x: +S.geo.G.x.toFixed(1), y: +S.geo.G.y.toFixed(1) } : null,
      feet: S.geo ? { x: +S.geo.Fp.x.toFixed(1), y: +S.geo.Fp.y.toFixed(1), lean: +S.geo.lean.phi.toFixed(3) } : null,
      running: !!S.raf, idle: S.idle, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-comp.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-comp .lab-title{order:0;font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-comp .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-comp .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-comp canvas{display:block;width:100%;height:auto;outline:none}
#lab-comp .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-comp .result-box>div+div{margin-top:4px}
#lab-comp .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-comp .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:44px}
#lab-comp .lab-row.lab-slider{flex-wrap:nowrap;min-height:36px;gap:12px}
#lab-comp .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:6.6em;white-space:nowrap}
#lab-comp .lab-slider input[type=range]{flex:1 1 200px;min-width:120px;max-width:520px;height:36px;margin:0;accent-color:#ffe066;cursor:pointer}
#lab-comp .lab-val{font-family:'JetBrains Mono','Noto Sans TC',monospace;font-size:22px;font-weight:700;color:#f6f3ea;min-width:4.6em;white-space:nowrap}
#lab-comp .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-comp .lab-btn:hover{border-color:#ffe066}
#lab-comp .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-comp .lc-x{color:#4dd2ff}#lab-comp .lc-y{color:#f472b6}
#lab-comp .lc-t{color:#a3b8b0}
@media (max-width:640px){#lab-comp.lab-desk{padding:12px 12px 14px}#lab-comp .lab-title{font-size:24px}#lab-comp .lab-row.lab-slider{flex-wrap:wrap;gap:4px 10px}#lab-comp .lab-name{min-width:0;width:100%}#lab-comp .lab-slider input[type=range]{min-width:0}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜分力掃描儀', te = '🔧 Try it | Component scanner';
    const kz = 'March 拉著行李箱。調整施力的角度，看水平分力與垂直分力怎麼此消彼長；角度壓低，行李箱真的跑得比較快嗎？';
    const ke = 'March is pulling a suitcase. Change the pulling angle and watch the horizontal and vertical components trade off. Does the suitcase really go faster when the angle is lower?';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI();
    snap(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug() { return S.boxes.slice(); } };
})();
