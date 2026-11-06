/* electric_power_transmission_2_socket_1105_v1.js — 「插座與接地安全」子分頁動畫（#socketAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.socket = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'socket'（分頁 tab-wiring → 子分頁 wiring-sockets）。畫布不綁任何事件；唯一控制是 #steps-socket 裡的 5 個步驟鈕；
 * 結果框 #socketAnimResult。只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。結構與播放迴圈沿用 wiring／phase 模組。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   第 1 步：三個插座面板並排（cx＝180／500／820），簡單圓角方形面板＋孔位（不畫任何品牌外觀）：
 *     110 V 二孔：窄孔 L（粉紅）、寬孔 N（青），沒有接地孔；110 V 接地三孔：多一個圓形 PE 孔（綠）；額定 125 V・15 A；
 *     220 V 專用：L1 橫孔、L2 直孔，兩孔夾 90°（台灣規格，110 V 平行插頭插不進去；都是活線，粉紅），加圓形 PE；額定 250 V・20 A。
 *   第 2～4 步：左欄＝這一步用的插座（cx=185）；右側＝電路示意：
 *     交流電源（x=440）→ 火線 L（粉紅，y=180，中途有斷路器符號 x 530～580）→ 金屬外殼電器（x 680～900，y 140～390，
 *     內有電熱元件 x=860）→ 中性線 N（青，y=340）回電源；接地線 PE（綠）從外殼右下角 (900,390) 往下接大地符號。
 *     藍球＝電子：交流沒有固定負極，電子在導線裡「來回振動」（沿線位移 A·sin ωt），圖例寫清楚；
 *     紅箭頭＝電流方向（與電子運動相反，跟著交流來回翻轉）；紅色虛線＝故障電流路徑（虛線往大地方向流動）。
 *   第 5 步：三張提醒卡（全幅）。
 *   本動畫不畫能量方塊。電壓不用任何水位類比。
 *
 * ── 步驟表，共 40 s ─────────────────────────────────────────────
 *   1 三種插座 8 s  三個插座依序出現並標孔位與額定
 *   2 正常迴路 8 s  110 V 三孔：電子在 L、N 迴路來回振動，電熱元件發熱；PE 接外殼，綠線旁標「沒有工作電流」
 *   3 外殼漏電 8 s  1.4 s 火線碰外殼（紅虛線＋火花）→ 故障電流沿外殼與綠色接地線流入大地 → 4.2 s 斷路器跳開（導線留缺口），
 *                   電子停住、元件不再發熱
 *   4 沒有接地 8 s  110 V 二孔：同樣漏電，沒有接地線（虛線＋叉）→ 外殼變紅閃爍 → 3.4 s 手形靠近外殼 → 驚嘆號警示「危險」
 *   5 安全提醒 8 s  三張提醒卡依序出現：接地線不是第二條中性線／不可折斷接地腳／不可自行拆接插座
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–30px，Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', metal: '#c9d3cf',
    electron: '#4dd2ff', current: '#ff4d4d'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const fade = (tl, t0, d) => clamp((tl - t0) / (d || 0.5), 0, 1);

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = u; } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function fitSize(ctx, s, maxW, want) {
    for (let z = want; z >= 22; z -= 2) if (textW(ctx, s, z) <= maxW) return z;
    return 22;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 置中寫字，量過後夾在 [lo, hi] 內，太寬就縮（最小 22）
  function textFit(ctx, s, cx, y, color, want, lo, hi, alpha) {
    const z = fitSize(ctx, s, hi - lo, want), w = textW(ctx, s, z);
    text(ctx, s, clamp(cx, lo + w / 2, hi - w / 2), y, color, z, 'center', alpha);
  }

  // ───────── 繪圖小工具 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function poly(ctx, pts, color, w, alpha, dash, dashOff) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = dashOff || 0; ctx.lineCap = 'butt'; }
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function wire(ctx, pts, color, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 6; poly(ctx, pts, color, 6, alpha); ctx.restore();
  }
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function polyAt(P, s) {                       // 折線上距起點 s 的點與方向
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), dx: (b.x - a.x) / (d || 1), dy: (b.y - a.y) / (d || 1) }; }
      s -= d;
    }
    return P[0];
  }
  function dot(ctx, x, y, r, color, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function ball(ctx, x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 紅色電流箭頭：中心 (x,y)，方向 (dx,dy)
  function arrow(ctx, x, y, dx, dy, alpha, len) {
    if (alpha <= 0.01) return;
    const L = len || 56, hd = 15, hw = 10, x0 = x - dx * L / 2, y0 = y - dy * L / 2, x1 = x + dx * L / 2, y1 = y + dy * L / 2;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.current; ctx.fillStyle = K.current; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.shadowColor = K.current; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - dx * hd * 0.8, y1 - dy * hd * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - dx * hd - dy * hw, y1 - dy * hd + dx * hw); ctx.lineTo(x1 - dx * hd + dy * hw, y1 - dy * hd - dx * hw); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function noSign(ctx, x, y, r, alpha) {         // 紅色禁止符號（圓圈＋斜線）
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.current; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    const d = r * Math.SQRT1_2; ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.stroke(); ctx.restore();
  }
  function cross(ctx, x, y, r, color, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); ctx.restore();
  }

  // ───────── 插座面板 ─────────
  // type：'two'｜'three'｜'220'；hl：{ L, N, PE }＝孔的發光強度（0～1）
  const FACE = 190;
  function slot(ctx, x, y, w, h, color, glow) {
    ctx.save();
    if (glow > 0.01) { ctx.shadowColor = color; ctx.shadowBlur = 18 * glow; }
    ctx.fillStyle = '#06110e'; ctx.strokeStyle = color; ctx.lineWidth = 3 + 2 * glow;
    rrect(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function roundHole(ctx, x, y, r, color, glow) {
    ctx.save();
    if (glow > 0.01) { ctx.shadowColor = color; ctx.shadowBlur = 18 * glow; }
    ctx.fillStyle = '#06110e'; ctx.strokeStyle = color; ctx.lineWidth = 3 + 2 * glow;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawSocket(ctx, cx, cy, type, hl, alpha) {
    if (alpha <= 0.01) return;
    hl = hl || {};
    ctx.save(); ctx.globalAlpha *= alpha;
    const s = FACE;
    ctx.fillStyle = '#e9e4d3'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx - s / 2, cy - s / 2, s, s, 26); ctx.fillStyle = '#1d3a33'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 2;
    rrect(ctx, cx - s / 2 + 14, cy - s / 2 + 14, s - 28, s - 28, 18); ctx.stroke();
    if (type === '220') {
      // 台灣 220 V 插座：L1 橫孔（左下）、L2 直孔（右上），兩孔夾 90°，平行腳的 110 V 插頭插不進去
      slot(ctx, cx - 34, cy - 4, 46, 14, K.pink, hl.L || 0);
      slot(ctx, cx + 38, cy - 26, 14, 46, K.pink, hl.L || 0);
      roundHole(ctx, cx, cy + 42, 13, K.green, hl.PE || 0);
      text(ctx, 'L1', cx - 34, cy - 32, K.pink, 24);
      text(ctx, 'L2', cx + 38, cy - 66, K.pink, 24);
      text(ctx, 'PE', cx + 22, cy + 42, K.green, 22, 'left');
    } else {
      slot(ctx, cx - 36, cy - 22, 10, 50, K.pink, hl.L || 0);
      slot(ctx, cx + 36, cy - 22, 18, 50, K.cyan, hl.N || 0);
      text(ctx, 'L', cx - 64, cy - 22, K.pink, 24);
      text(ctx, 'N', cx + 66, cy - 22, K.cyan, 24);
      if (type === 'three') { roundHole(ctx, cx, cy + 42, 13, K.green, hl.PE || 0); text(ctx, 'PE', cx + 22, cy + 42, K.green, 22, 'left'); }
    }
    ctx.restore();
  }

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['三種插座', '3 sockets'],
      cap: ['插孔不同，功能也不同', 'Different holes, different jobs'],
      res: ['插孔不同，功能也不同：二孔沒有接地；三孔多一個接地孔 PE；220 V 專用插座用 L1、L2 與 PE。台灣的 220 V 插座兩孔呈 90° 夾角，110 V 的平行插頭插不進去，避免誤插。',
        'Different sockets, different functions: 2-prong has no ground; 3-prong adds a ground pin (PE); the 220 V socket uses L1, L2 and PE. Taiwan\'s 220 V sockets set the two slots at 90°, so a 110 V plug cannot fit—this prevents mix-ups.'] },
    { dur: 8, b: ['正常迴路', 'Normal'],
      cap: ['正常：電流走 L、N，PE 沒有電流', 'Normal: current in L and N, none in PE'],
      res: ['正常使用時，火線 L 送電、中性線 N 讓電流回到電源；接地線 PE 連接金屬外殼，不承擔工作電流。',
        'In normal use L carries the energy and N returns the current; the ground wire PE bonds the metal case and carries no working current.'] },
    { dur: 8, b: ['外殼漏電', 'Leakage'],
      cap: ['漏電經接地線入地，斷路器跳開', 'Leak goes to earth; breaker trips'],
      res: ['外殼漏電時，接地線提供安全路徑，協助保護裝置切斷電源。',
        'When the case leaks, the ground wire gives the fault current a safe path and helps the protective device cut the power.'] },
    { dur: 8, b: ['沒有接地', 'No ground'],
      cap: ['沒有接地：外殼帶電，碰到危險', 'No ground: the case is live, danger'],
      res: ['沒有接地保護時，外殼可能帶電，碰觸有危險。',
        'Without a ground wire the case may become live, and touching it is dangerous.'] },
    { dur: 8, b: ['安全提醒', 'Safety'],
      cap: ['三個安全提醒', 'Three safety reminders'],
      res: ['接地線不是第二條中性線。不可折斷接地腳，也不要自行拆接插座。',
        'The ground wire is not a second neutral. Never break off the ground pin or rewire a socket yourself.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 第 1 步：三種插座 ─────────
  const SOCK3 = [
    { cx: 180, type: 'two', title: ['110 V 二孔', '110 V 2-prong'], l1: ['窄孔 L・寬孔 N', 'Narrow L · Wide N'], l2: ['沒有接地孔', 'No ground hole'], rate: '125 V・15 A', c2: K.orange },
    { cx: 500, type: 'three', title: ['110 V 接地三孔', '110 V 3-prong'], l1: ['窄孔 L・寬孔 N', 'Narrow L · Wide N'], l2: ['＋圓孔 PE（接地）', '+ round PE (ground)'], rate: '125 V・15 A', c2: K.green },
    { cx: 820, type: '220', title: ['220 V 專用', '220 V dedicated'], l1: ['L1、L2 都是活線', 'L1, L2: both live'], l2: ['兩孔夾 90°（台灣規格）', 'Slots at 90° (Taiwan)'], rate: '250 V・20 A', c2: K.pink }
  ];
  function drawThree(ctx, tl) {
    SOCK3.forEach((s, k) => {
      const a = fade(tl, 0.4 + k * 2.3, 0.6), lo = s.cx - 155, hi = s.cx + 155;
      if (a <= 0) return;
      const dy = (1 - ease(a)) * 16;
      textFit(ctx, tr(s.title[0], s.title[1]), s.cx, 112 + dy, K.yellow, 28, lo, hi, a);
      drawSocket(ctx, s.cx, 238 + dy, s.type, { L: 0.4, N: 0.4, PE: 0.4 }, a);
      textFit(ctx, tr(s.l1[0], s.l1[1]), s.cx, 368 + dy, K.white, 24, lo, hi, a);
      textFit(ctx, tr(s.l2[0], s.l2[1]), s.cx, 404 + dy, s.c2, 24, lo, hi, a);
      textFit(ctx, tr('額定 ', 'Rated ') + s.rate, s.cx, 446 + dy, s.type === '220' ? K.orange : K.yellow, 24, lo, hi, a);
    });
  }

  // ───────── 第 2～4 步：電路示意 ─────────
  const SRC = { x: 440, y: 270, r: 34 };
  const YL = 180, YN = 340, BK0 = 530, BK1 = 580;
  const CASE = { x0: 680, y0: 140, x1: 900, y1: 390 };
  const LOAD = { x: 860, y0: 215, y1: 305 };
  const GND = { x: 900, y: 470 };
  // 工作電流迴路（電子沿這條折線來回振動）
  const LOOP = [{ x: SRC.x, y: SRC.y - SRC.r }, { x: SRC.x, y: YL }, { x: LOAD.x, y: YL }, { x: LOAD.x, y: YN },
    { x: SRC.x, y: YN }, { x: SRC.x, y: SRC.y + SRC.r }];
  const LOOP_LEN = polyLen(LOOP);
  // 故障電流路徑：火線碰外殼 → 外殼右壁 → 接地線 → 大地
  const FAULT = [{ x: LOAD.x, y: YL }, { x: CASE.x1, y: 204 }, { x: CASE.x1, y: CASE.y1 }, { x: GND.x, y: GND.y - 4 }];
  const FAULT_LEN = polyLen(FAULT);
  const OMEGA = TAU * 0.7, AMP = 15;              // 振動頻率（示意，放慢）與沿線振幅（px）
  const T_LEAK = 1.4, T_TRIP = 4.2, T_HAND = 3.4;

  function drawSource(ctx) {
    ctx.save(); ctx.fillStyle = '#163a31'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(SRC.x, SRC.y, SRC.r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.beginPath();
    for (let k = 0; k <= 24; k++) { const x = SRC.x - 18 + 36 * k / 24, y = SRC.y - 10 * Math.sin(TAU * k / 24); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    text(ctx, tr('交流電源', 'AC source'), SRC.x + SRC.r + 12, SRC.y - 12, K.white, 22, 'left');
    text(ctx, '110 V', SRC.x + SRC.r + 12, SRC.y + 18, K.yellow, 22, 'left');
  }
  function drawCase(ctx, warn) {
    ctx.save();
    rrect(ctx, CASE.x0, CASE.y0, CASE.x1 - CASE.x0, CASE.y1 - CASE.y0, 12);
    ctx.fillStyle = warn > 0.01 ? `rgba(255,77,77,${0.12 + 0.3 * warn})` : 'rgba(201,211,207,0.08)'; ctx.fill();
    ctx.strokeStyle = warn > 0.01 ? K.current : K.metal; ctx.lineWidth = 5;
    if (warn > 0.01) { ctx.shadowColor = K.current; ctx.shadowBlur = 20 * warn; }
    ctx.stroke(); ctx.restore();
  }
  function drawLoad(ctx, heat) {
    ctx.save(); ctx.fillStyle = '#163a31'; ctx.fillRect(LOAD.x - 16, LOAD.y0, 32, LOAD.y1 - LOAD.y0);
    const col = heat > 0.01 ? `rgb(${Math.round(lerp(201, 255, heat))},${Math.round(lerp(211, 150, heat))},${Math.round(lerp(207, 60, heat))})` : K.metal;
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    if (heat > 0.01) { ctx.shadowColor = K.orange; ctx.shadowBlur = 16 * heat; }
    ctx.beginPath(); const n = 8;
    for (let k = 0; k <= n; k++) { const y = lerp(LOAD.y0, LOAD.y1, k / n), x = LOAD.x + (k === 0 || k === n ? 0 : (k % 2 ? -12 : 12)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function drawBreaker(ctx, open) {               // open：0＝閉合、1＝跳開
    const ang = -0.65 * ease(open), L = BK1 - BK0;
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(BK0, YL); ctx.lineTo(BK0 + L * Math.cos(ang), YL + L * Math.sin(ang)); ctx.stroke(); ctx.restore();
    dot(ctx, BK0, YL, 7, K.white); dot(ctx, BK1, YL, 7, K.white);
    text(ctx, tr('斷路器', 'Breaker'), (BK0 + BK1) / 2, YL - 56, K.white, 22);
  }
  function drawGround(ctx, alpha, dashed) {
    if (alpha <= 0.01) return;
    if (dashed) poly(ctx, [{ x: GND.x, y: CASE.y1 }, { x: GND.x, y: GND.y }], K.muted, 4, alpha, [8, 8]);
    else wire(ctx, [{ x: GND.x, y: CASE.y1 }, { x: GND.x, y: GND.y }], K.green, alpha);
    const c = dashed ? K.muted : K.green;
    [[25, 0], [16, 10], [7, 20]].forEach(([w, d]) => poly(ctx, [{ x: GND.x - w, y: GND.y + d }, { x: GND.x + w, y: GND.y + d }], c, 4, alpha));
    text(ctx, tr('大地', 'Earth'), GND.x + 34, GND.y + 10, c, 22, 'left', alpha);
  }
  // 沿折線等距排的電子，整體沿線位移 disp（px）；skip(p) 為真的點不畫
  function electrons(ctx, P, len, gap, disp, alpha, skip) {
    for (let s0 = gap / 2; s0 < len; s0 += gap) {
      const s = s0 + disp; if (s < 0 || s > len) continue;
      const p = polyAt(P, s); if (skip && skip(p)) continue;
      ball(ctx, p.x, p.y, alpha);
    }
  }
  const inSource = p => Math.hypot(p.x - SRC.x, p.y - SRC.y) < SRC.r + 4;

  function drawLeftSocket(ctx, i, tl) {
    const cx = 185, lo = 30, hi = 345;
    const type = i === 3 ? 'two' : 'three';
    textFit(ctx, tr(i === 3 ? '這次用：110 V 二孔' : '這次用：110 V 接地三孔', i === 3 ? 'Using: 110 V 2-prong' : 'Using: 110 V 3-prong'), cx, 126, K.yellow, 24, lo, hi);
    const pulse = 0.5 + 0.5 * Math.sin(tl * 5);
    const hl = i === 1 ? { L: 0.8, N: 0.8, PE: 0 } : i === 2 ? { L: 0.3, N: 0.3, PE: tl > T_LEAK && tl < T_TRIP + 0.5 ? 0.5 + 0.5 * pulse : 0.3 } : { L: 0.5, N: 0.5 };
    drawSocket(ctx, cx, 258, type, hl, 1);
    textFit(ctx, tr('額定 ', 'Rated ') + '125 V・15 A', cx, 388, K.white, 22, lo, hi);
    const notes = [null, ['L、N 有工作電流', 'Current flows in L and N'], ['PE 接到金屬外殼', 'PE is bonded to the case'], ['沒有接地孔', 'No ground hole']];
    const nc = [null, K.white, K.green, K.current][i];
    textFit(ctx, tr(notes[i][0], notes[i][1]), cx, 424, nc, 24, lo, hi, fade(tl, 0.8));
  }

  function drawCircuit(ctx, i, tl) {
    const leak = i >= 2 ? fade(tl, T_LEAK, 0.4) : 0;
    const open = i === 2 ? fade(tl, T_TRIP, 0.35) : 0;
    const tripped = open > 0;
    const tEff = i === 2 ? Math.min(tl, T_TRIP) : tl;          // 跳開後電子停住
    const flow = i === 2 ? 1 - fade(tl, T_TRIP, 0.6) : 1;      // 有沒有電流（1＝有）
    const disp = AMP * Math.sin(OMEGA * tEff);
    const vel = Math.cos(OMEGA * tEff);                        // 電子沿迴路的速度方向
    const warn = i === 3 ? leak * (0.55 + 0.45 * Math.sin(tl * 7)) : 0;

    drawCase(ctx, warn);
    // 導線（斷路器兩側分開畫，跳開時中間真的留缺口）
    wire(ctx, [LOOP[0], LOOP[1], { x: BK0, y: YL }], K.pink);
    wire(ctx, [{ x: BK1, y: YL }, { x: LOAD.x, y: YL }, { x: LOAD.x, y: LOAD.y0 }], K.pink);
    wire(ctx, [{ x: LOAD.x, y: LOAD.y1 }, { x: LOAD.x, y: YN }, LOOP[4], LOOP[5]], K.cyan);
    text(ctx, tr('火線 L', 'Live L'), 640, YL - 24, K.pink, 22);
    text(ctx, tr('中性線 N', 'Neutral N'), 560, YN + 26, K.cyan, 22);
    // 接地線
    if (i === 3) {
      drawGround(ctx, 0.75, true);
      cross(ctx, GND.x, 430, 11, K.current, fade(tl, 0.8));
      text(ctx, tr('沒有接地線', 'No ground wire'), GND.x - 24, 430, K.current, 22, 'right', fade(tl, 0.8));
    } else {
      drawGround(ctx, 1, false);
      dot(ctx, CASE.x1, CASE.y1, 7, K.green);
      text(ctx, tr('接地線 PE', 'Ground PE'), GND.x - 16, 424, K.green, 22, 'right');
      if (i === 1) text(ctx, tr('沒有工作電流', 'No working current'), GND.x - 16, 456, K.green, 22, 'right', fade(tl, 1.6));
    }
    // 漏電：火線碰外殼
    if (leak > 0) {
      const fa = i === 2 ? leak * (tripped ? lerp(1, 0.35, open) : 1) : leak;
      if (i === 2) {
        // 故障電流路徑：紅色虛線沿外殼與綠線往大地流
        const off = -tEff * 40;
        ctx.save(); ctx.shadowColor = K.current; ctx.shadowBlur = 10;
        poly(ctx, FAULT, K.current, 6, fa, [14, 10], off); ctx.restore();
      } else {
        poly(ctx, FAULT.slice(0, 2), K.current, 6, leak, [14, 10], -tl * 40);
      }
      spark(ctx, CASE.x1, 204, leak, tl);
      text(ctx, tr('火線碰外殼', 'L touches the case'), 850, 112, K.current, 22, 'center', leak);
    }
    // 電子（在元件之前畫）
    const ea = (i === 1 ? fade(tl, 0.6) : 1) * lerp(0.3, 1, flow);
    electrons(ctx, LOOP, LOOP_LEN, 44, disp, ea, inSource);
    if (i === 2 && leak > 0) electrons(ctx, FAULT, FAULT_LEN, 40, disp * 0.9, leak * lerp(0.3, 1, flow));
    // 元件
    drawSource(ctx);
    drawLoad(ctx, (i === 1 ? fade(tl, 0.9, 0.8) : 1) * flow * 0.9);
    drawBreaker(ctx, open);
    text(ctx, tr('電器', 'Appliance'), 770, 232, K.white, 22);
    if (i === 3 && leak > 0) text(ctx, tr('外殼帶電！', 'Case is live!'), 770, 272, K.current, 24, 'center', leak);
    else text(ctx, tr('金屬外殼', 'Metal case'), 770, 272, K.metal, 22);
    // 電流箭頭：和電子運動方向相反，跟著交流翻轉
    const aa = (i === 1 ? fade(tl, 1.0) : 1) * flow * clamp(Math.abs(vel) * 1.6, 0, 1);
    arrow(ctx, 640, YL + 26, vel > 0 ? -1 : 1, 0, aa, 54);
    if (i === 2 && tripped) {
      textFit(ctx, tr('跳開！切斷電源', 'Tripped! Power cut'), (BK0 + BK1) / 2, YL + 30, K.yellow, 24, SRC.x + 12, CASE.x0 - 4, open);
    }
    if (i === 3) {
      const ha = fade(tl, T_HAND, 0.6);
      hand(ctx, CASE.x1 + 6 + (1 - ease(ha)) * 50, 300, ha);
      const wa = fade(tl, T_HAND + 0.9, 0.4);
      warnSign(ctx, 946, 226, wa * (0.7 + 0.3 * Math.sin(tl * 7)));
      text(ctx, tr('危險', 'Danger'), 946, 364, K.current, 24, 'center', wa);
    }
  }
  function spark(ctx, x, y, a, tl) {
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 12;
    const r = 13 + 3 * Math.sin(tl * 12);
    for (let k = 0; k < 6; k++) { const ang = k * TAU / 6 + 0.3; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 5, y + Math.sin(ang) * 5); ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); ctx.stroke(); }
    ctx.restore();
  }
  function hand(ctx, x, y, a) {                   // 簡單手形：手掌在右、四指朝左，指尖 x
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#e8c9a8'; ctx.strokeStyle = K.white; ctx.lineWidth = 2.5;
    rrect(ctx, x + 34, y - 26, 44, 56, 14); ctx.fill(); ctx.stroke();
    [-20, -7, 6, 19].forEach((d, k) => { const len = k === 0 || k === 3 ? 32 : 38; rrect(ctx, x + 40 - len, y + d - 5, len + 4, 11, 5.5); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function warnSign(ctx, x, y, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.yellow; ctx.strokeStyle = K.current; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 30, y + 24); ctx.lineTo(x - 30, y + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b0a0a'; ctx.fillRect(x - 3.5, y - 14, 7, 22); ctx.beginPath(); ctx.arc(x, y + 15, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ───────── 第 5 步：三張提醒卡 ─────────
  const TIPS = [
    ['接地線不是第二條中性線', 'Ground is not a second neutral'],
    ['不可折斷接地腳', 'Never break off the ground pin'],
    ['不可自行拆接插座', 'Never rewire a socket yourself']
  ];
  function drawTips(ctx, tl) {
    TIPS.forEach((tp, k) => {
      const a = fade(tl, 0.4 + k * 1.8, 0.6); if (a <= 0) return;
      const cy = 170 + k * 140, dx = (1 - ease(a)) * 30;
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(242,236,217,0.06)'; ctx.strokeStyle = 'rgba(242,236,217,0.4)'; ctx.lineWidth = 2;
      rrect(ctx, 110 + dx, cy - 54, 780, 108, 16); ctx.fill(); ctx.stroke(); ctx.restore();
      const ix = 205 + dx;
      if (k === 0) {
        text(ctx, 'PE', ix - 36, cy, K.green, 30, 'center', a);
        text(ctx, '≠', ix, cy, K.white, 30, 'center', a);
        text(ctx, 'N', ix + 34, cy, K.cyan, 30, 'center', a);
      } else if (k === 1) {
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#1d3a33'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
        rrect(ctx, ix - 26, cy - 34, 52, 40, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = K.metal; ctx.fillRect(ix - 17, cy + 6, 6, 22); ctx.fillRect(ix + 11, cy + 6, 6, 22);
        ctx.fillStyle = K.green; ctx.beginPath(); ctx.moveTo(ix - 4, cy + 6); ctx.lineTo(ix + 4, cy + 6); ctx.lineTo(ix + 4, cy + 14); ctx.lineTo(ix - 4, cy + 18); ctx.closePath(); ctx.fill();
        ctx.restore();
        noSign(ctx, ix, cy, 44, a);
      } else {
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#1d3a33'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
        rrect(ctx, ix - 28, cy - 28, 56, 56, 10); ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha *= a;
        slot(ctx, ix - 11, cy - 6, 5, 20, K.pink, 0); slot(ctx, ix + 11, cy - 6, 8, 20, K.cyan, 0); roundHole(ctx, ix, cy + 14, 5, K.green, 0);
        ctx.restore();
        noSign(ctx, ix, cy, 44, a);
      }
      const s = tr(tp[0], tp[1]), z = fitSize(ctx, s, 560, 30);
      const num = `${k + 1}.`;
      text(ctx, num, 280 + dx, cy, K.yellow, 30, 'left', a);
      text(ctx, s, 280 + dx + textW(ctx, num, 30) + 12, cy, K.white, z, 'left', a);
    });
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i) {
    let items;
    if (i === 0) items = [[tr('粉紅＝活線（L、L1、L2）', 'Pink = live (L, L1, L2)'), 'l', K.pink], [tr('青＝中性線 N', 'Cyan = neutral N'), 'l', K.cyan], [tr('綠＝接地 PE', 'Green = ground PE'), 'l', K.green]];
    else if (i === 4) return;
    else {
      items = [[tr('藍球＝電子（交流：來回振動）', 'Blue = electrons (AC: back and forth)'), 'b'], [tr('紅箭頭＝電流', 'Red arrow = current'), 'a']];
      if (i >= 2) items.push([tr('紅虛線＝漏電', 'Red dashes = leakage'), 'd']);
    }
    const z = 22, gapIcon = 40, gapItem = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    // 一行放不下就分兩行
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => { const w = wid[k] + (cur.length ? gapItem : 0); if (cw + w > 960 && cur.length) { rows.push([cur, cw]); cur = []; cw = 0; } cur.push([it, wid[k]]); cw += wid[k] + (cur.length > 1 ? gapItem : 0); });
    rows.push([cur, cw]);
    rows.forEach(([r, tot], ri) => {
      const y = 576 - (rows.length - 1 - ri) * 34; let x = W / 2 - tot / 2;
      r.forEach(([[s, kind, c], w]) => {
        if (kind === 'l') poly(ctx, [{ x: x + 2, y }, { x: x + 28, y }], c, 5);
        else if (kind === 'b') ball(ctx, x + 14, y, 1);
        else if (kind === 'a') arrow(ctx, x + 15, y, 1, 0, 1, 28);
        else poly(ctx, [{ x: x, y }, { x: x + 30, y }], K.current, 5, 1, [8, 6]);
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += w + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 26);
    text(ctx, ls[0], W / 2, 58, K.yellow, 26);
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    if (i === 0) drawThree(ctx, tl);
    else if (i === 4) drawTips(ctx, tl);
    else { drawLeftSocket(ctx, i, tl); drawCircuit(ctx, i, tl); }
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('socketAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('socketAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-socket');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-socket'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const c = ctl();
    if (S.last && !(c && c.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const kk = S.step >= 0 ? S.step : stepAt(S.t);
    const end = stepStop ? (STARTS[kk + 1] !== undefined ? STARTS[kk + 1] : TOTAL) : TOTAL;
    if (S.t >= end) {
      S.t = end - 1e-3; render();
      if (!stepStop && !S.ended && c && typeof c.onEnd === 'function') { S.ended = true; c.onEnd(); }
      return;
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.on || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.on) start(); });

  window.EpAnim.socket = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-socket'); if (row) row.innerHTML = '';
      const r = document.getElementById('socketAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { socket: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'socket' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
