/* electric_power_transmission_2_grid_1105_v1.js — 「電力輸送」分頁動畫（#gridAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.grid = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'grid'。畫布不綁任何事件；唯一控制是 #steps-grid 裡的 5 個步驟鈕；結果框 #gridAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   上排（電線 y=172）：由左到右六站 發電廠 → 一次變電所 → 二次變電所 → 配電變電所 → 桿上變壓器 → 住家
 *   （x 85～915，間距 166）。發電廠右邊電線上有一個橘色升壓變壓器符號（兩個相交圓）。
 *   每站下方：站名（英文分兩行）＋該站的電壓（345 kV／345→161 kV／66 kV／11.4 kV／降壓／110 V 與 220 V）。
 *   藍色能量方塊（教學符號，亮外框；和全站電子學單元的能量色統一）沿電線往右移動；「抵達前沿」逐步往右推進，方塊在站的圖示後面通過。
 *   下排（y≈430）：本步的「放大說明」：輸入電壓 → 變壓器 → 輸出電壓，變壓器旁標「電壓↑ 電流↓」或「電壓↓ 電流↑」。
 *   第 5 步下排改成：每一段電線下都畫同樣週期的小波形並標「60 Hz」，再加一行結論。
 *   最下方圖例：藍方塊＝電能（教學符號，不代表實體粒子）、橘＝升壓變壓器、綠＝降壓變壓器。
 *
 * ── 步驟表，共 41 s ─────────────────────────────────────────────
 *   1 發電升壓  8 s  發電廠 → 升壓變壓器 → 345 kV；能量方塊從發電廠送到一次變電所
 *   2 高壓輸電  8 s  345 kV 長途輸電到一次變電所，降為 161 kV，送到二次變電所
 *   3 逐級降壓  9 s  161 kV → 66 kV → 11.4 kV（兩個降壓變壓器，旁標「電壓↓ 電流↑」）；送到桿上變壓器
 *   4 進入住家  8 s  11.4 kV → 桿上變壓器 → 110 V 與 220 V；送進住家
 *   5 能量不斷  8 s  整條路徑同時亮、方塊連續流；每段都標 60 Hz；結論一行
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–26px（說明 24、標籤 22–24），Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', dim: '#5f7a70', wire: '#9fb3aa',
    energy: '#4dd2ff', panel: '#123329', iconBg: '#163a31'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = s => `900 ${s}px ${FONT}`;

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
  function textClamp(ctx, s, cx, y, color, size, lo, hi, alpha) {
    const w = textW(ctx, s, size);
    text(ctx, s, clamp(cx, lo + w / 2, hi - w / 2), y, color, size, 'center', alpha);
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // ───────── 上排：六站 ─────────
  const XS = [85, 251, 417, 583, 749, 915];
  const WY = 172;                       // 電線高度
  const TRX = 150;                      // 發電廠旁升壓變壓器
  const NAME_Y = [246, 272], VOLT_Y = [308, 334];
  const NAMES = [
    { zh: ['發電廠'], en: ['Power', 'Plant'], short: ['Power', 'Plant'] },
    { zh: ['一次變電所'], en: ['Primary', 'Substation'], short: ['Primary', 'Sub.'] },
    { zh: ['二次變電所'], en: ['Secondary', 'Substation'], short: ['Secondary', 'Sub.'] },
    { zh: ['配電變電所'], en: ['Distribution', 'Substation'], short: ['Dist.', 'Sub.'] },
    { zh: ['桿上變壓器'], en: ['Pole', 'Transformer'], short: ['Pole', 'Trans.'] },
    { zh: ['住家'], en: ['Home'], short: ['Home'] }
  ];
  const VOLTS = [
    { zh: ['345 kV'], en: ['345 kV'] },
    { zh: ['345→161 kV'], en: ['345→161 kV'] },
    { zh: ['66 kV'], en: ['66 kV'] },
    { zh: ['11.4 kV'], en: ['11.4 kV'] },
    { zh: ['降壓'], en: ['Step-down'] },
    { zh: ['110 V 與', '220 V'], en: ['110 V &', '220 V'] }
  ];
  const ICOL = [K.orange, K.cyan, K.cyan, K.cyan, K.green, K.white];
  const NAME_MAXW = 158;               // 站名一行最寬（間距 166 減留白）

  // ───────── 步驟 ─────────
  // fx0：本步能量前沿起點；fx1：本步前沿終點（停在站的圖示後面）；bright：本步亮的起點；focus：本步發光的站
  const STEPS = [
    { dur: 8, b: ['發電升壓', 'Step up'], fx0: 85, fx1: XS[1], bright: 85, focus: [0],
      cap: ['發電廠先把電壓升到 345 kV', 'The plant steps the voltage up to 345 kV'],
      res: ['發電廠先把電壓升高，準備長距離輸電。', 'The power plant steps the voltage up first, ready for long-distance transmission.'] },
    { dur: 8, b: ['高壓輸電', 'HV lines'], fx0: XS[1], fx1: XS[2], bright: 85, focus: [1],
      cap: ['345 kV 長途輸電，再降為 161 kV', 'Long distance at 345 kV, then 161 kV'],
      res: ['高壓區段使用 345 kV、161 kV 等電壓，目的在降低長距離輸電線損。', 'The high-voltage sections use 345 kV, 161 kV and so on, to reduce line loss over long distances.'] },
    { dur: 9, b: ['逐級降壓', 'Step down'], fx0: XS[2], fx1: XS[4], bright: XS[2], focus: [2, 3],
      cap: ['靠近用戶，一站一站降壓', 'Near users, step down station by station'],
      res: ['靠近用戶後，電壓依序降為 66 kV、11.4 kV，再由桿上變壓器降壓。', 'Near users the voltage steps down to 66 kV, then 11.4 kV, and a pole transformer steps it down again.'] },
    { dur: 8, b: ['進入住家', 'Into homes'], fx0: XS[4], fx1: XS[5], bright: XS[4], focus: [4, 5],
      cap: ['以 110 V 與 220 V 進入住家', 'Into homes at 110 V and 220 V'],
      res: ['最後以 110 V 與 220 V 配電進入住家，供不同額定電壓的電器使用。', 'Finally it enters homes as 110 V and 220 V for appliances with different rated voltages.'] },
    { dur: 8, b: ['能量不斷', 'Nonstop'], fx0: XS[5], fx1: XS[5], bright: 85, focus: [0, 1, 2, 3, 4, 5],
      cap: ['整條路徑：電能一路不斷送到家', 'The whole path: energy flows all the way home'],
      res: ['電能持續向前傳遞；變壓器改變的是電壓與電流，交流電的頻率仍維持 60 Hz。', 'Energy keeps moving forward; transformers change voltage and current, and the AC frequency stays at 60 Hz.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  const V = 80, SP = 36, T0 = 0.8;     // 方塊速度（px/s）、間距、每步延遲
  function frontOf(i, tl) {
    const st = STEPS[i];
    if (i === 4) return XS[5];
    return clamp(st.fx0 + V * Math.max(0, tl - T0), st.fx0, st.fx1);
  }
  const reached = (i, tl, k) => frontOf(i, tl) >= XS[k] - 2 || (k === 0);

  // ───────── 圖示 ─────────
  function glow(ctx, x, y, r, a) {
    if (a <= 0.01) return;
    ctx.save(); const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
    g.addColorStop(0, `rgba(253,224,71,${0.28 * a})`); g.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 變壓器符號：兩個相交的圓
  function trSym(ctx, x, y, r, color, lw) {
    ctx.save(); ctx.fillStyle = K.iconBg; ctx.strokeStyle = color; ctx.lineWidth = lw || 3;
    ctx.beginPath(); ctx.arc(x - r * 0.55, y, r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.55, y, r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.55, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.55, y, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function drawPlant(ctx, x, col, t) {
    const y = WY;
    // 煙
    for (let k = 0; k < 3; k++) {
      const u = ((t * 0.35 + k / 3) % 1);
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - u); ctx.fillStyle = '#c9d3cf';
      ctx.beginPath(); ctx.arc(x + 15 + 10 * u, y - 56 - 34 * u, 6 + 7 * u, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = K.iconBg; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.rect(x + 8, y - 52, 14, 30); ctx.fill(); ctx.stroke();       // 煙囪
    ctx.beginPath();
    ctx.moveTo(x - 38, y + 36); ctx.lineTo(x - 38, y - 10); ctx.lineTo(x - 22, y - 24); ctx.lineTo(x - 22, y - 10);
    ctx.lineTo(x - 6, y - 24); ctx.lineTo(x - 6, y - 10); ctx.lineTo(x + 26, y - 22); ctx.lineTo(x + 26, y + 36); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // 閃電
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x - 4, y - 4); ctx.lineTo(x - 14, y + 12); ctx.lineTo(x - 6, y + 12); ctx.lineTo(x - 10, y + 28);
    ctx.lineTo(x + 6, y + 8); ctx.lineTo(x - 2, y + 8); ctx.lineTo(x + 4, y - 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawSub(ctx, x, col) {
    const y = WY;
    ctx.save(); ctx.fillStyle = K.iconBg; ctx.strokeStyle = col; ctx.lineWidth = 3;
    rrect(ctx, x - 36, y - 32, 72, 64, 6); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2; ctx.globalAlpha = 0.6;                                   // 圍籬
    for (let k = 1; k < 6; k++) { const px = x - 36 + k * 12; ctx.beginPath(); ctx.moveTo(px, y - 32); ctx.lineTo(px, y - 22); ctx.moveTo(px, y + 22); ctx.lineTo(px, y + 32); ctx.stroke(); }
    ctx.restore();
    trSym(ctx, x, y, 13, col === K.dim ? K.dim : K.green, 3);
  }
  function drawPole(ctx, x, col) {
    const y = WY;
    ctx.save(); ctx.strokeStyle = col === K.dim ? K.dim : '#b08a62'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(x, y + 44); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 26, y - 46); ctx.lineTo(x + 26, y - 46); ctx.stroke();
    ctx.fillStyle = K.iconBg; ctx.strokeStyle = col; ctx.lineWidth = 3;
    rrect(ctx, x - 18, y - 22, 36, 44, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
    trSym(ctx, x, y, 8, col, 2.5);
  }
  function drawHome(ctx, x, col, lit) {
    const y = WY;
    ctx.save(); ctx.fillStyle = K.iconBg; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 40, y - 8); ctx.lineTo(x, y - 46); ctx.lineTo(x + 40, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 32, y - 8, 64, 48); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lit > 0.01 ? `rgba(253,224,71,${0.25 + 0.6 * lit})` : '#1d4a3e';
    ctx.fillRect(x - 24, y + 2, 18, 16); ctx.strokeRect(x - 24, y + 2, 18, 16);
    ctx.fillStyle = K.iconBg; ctx.fillRect(x + 6, y + 10, 16, 30); ctx.strokeRect(x + 6, y + 10, 16, 30);
    ctx.restore();
  }
  function square(ctx, x, y, alpha, scale) {
    if (alpha <= 0.01) return;
    const s = 12 * (scale || 1);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();   // 外圈亮＝有能量（電子是圓球、能量是方塊）
    ctx.restore();
  }

  function nameLines(ctx, k) {
    const n = NAMES[k];
    if (tr('zh', 'en') === 'zh') return n.zh;
    const ok = n.en.every(l => textW(ctx, l, 22) <= NAME_MAXW);
    return ok ? n.en : n.short;
  }

  function drawTop(ctx, i, tl, t) {
    const st = STEPS[i], front = frontOf(i, tl);
    // 電線底色＋已送達的亮段
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#2f4a42'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(XS[0], WY); ctx.lineTo(XS[5], WY); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.beginPath(); ctx.moveTo(XS[0], WY); ctx.lineTo(front, WY); ctx.stroke();
    if (front > st.bright) { ctx.strokeStyle = K.white; ctx.beginPath(); ctx.moveTo(st.bright, WY); ctx.lineTo(front, WY); ctx.stroke(); }
    ctx.restore();
    // 能量方塊（畫在圖示前面＝之後會被圖示蓋住）
    const L = XS[5] - XS[0];
    const n = Math.ceil(L / SP) + 1;
    for (let k = 0; k < n; k++) {
      const x = XS[0] + (((V * t + k * SP) % (n * SP)) + n * SP) % (n * SP);
      if (x > front || x > XS[5]) continue;
      const fade = clamp((front - x) / 6, 0, 1);
      const a = x >= st.bright ? 1 : 0.45;
      square(ctx, x, WY, a * fade, 1);
    }
    // 圖示
    STEPS[i].focus.forEach(k => glow(ctx, XS[k], WY, 70, i === 4 ? 0.8 + 0.2 * Math.sin(t * 4 + k) : 1));
    for (let k = 0; k < 6; k++) {
      const on = reached(i, tl, k), col = on ? ICOL[k] : K.dim, x = XS[k];
      if (k === 0) drawPlant(ctx, x, col, t);
      else if (k <= 3) drawSub(ctx, x, col);
      else if (k === 4) drawPole(ctx, x, col);
      else drawHome(ctx, x, col, on ? 1 : 0);
    }
    // 發電廠旁的升壓變壓器
    if (i === 0) glow(ctx, TRX, WY, 40, 0.8);
    trSym(ctx, TRX, WY, 12, K.orange, 3);
    textClamp(ctx, tr('升壓', 'Step-up'), TRX + 4, WY - 34, K.orange, 22, XS[0] + 30, XS[1] - 38);   // 不壓煙囪、不壓一次變電所
    // 站名＋電壓
    for (let k = 0; k < 6; k++) {
      const on = reached(i, tl, k);
      const nl = nameLines(ctx, k);
      nl.forEach((s, r) => textClamp(ctx, s, XS[k], NAME_Y[r] - (nl.length === 1 ? 0 : 0), on ? K.white : K.muted, 22, 4, 996));
      const vl = tr('zh', 'en') === 'zh' ? VOLTS[k].zh : VOLTS[k].en;
      const vy0 = nl.length > 1 ? VOLT_Y[0] : VOLT_Y[0] - 20;
      vl.forEach((s, r) => textClamp(ctx, s, XS[k], vy0 + r * 26, on ? K.cyan : K.dim, 22, 4, 996));
    }
  }

  // ───────── 下排：本步放大說明 ─────────
  const PY = 438;
  const LV = (s) => [s, s];
  const PANELS = [
    [{ k: 'box', s: ['發電廠', 'Power plant'], c: K.orange }, { k: 'tr', up: true, lab: ['升壓', 'Step-up'], tag: ['電壓↑ 電流↓', 'Voltage↑ Current↓'] }, { k: 'box', s: LV('345 kV') }],
    [{ k: 'box', s: LV('345 kV') }, { k: 'tr', up: false, lab: ['一次變電所', 'Primary sub.'], tag: null, gap: 300, wireLab: ['長途輸電', 'long distance'] }, { k: 'box', s: LV('161 kV') }],
    [{ k: 'box', s: LV('161 kV') }, { k: 'tr', up: false, lab: ['二次變電所', 'Secondary sub.'], tag: ['電壓↓ 電流↑', 'Voltage↓ Current↑'] }, { k: 'box', s: LV('66 kV') },
      { k: 'tr', up: false, lab: ['配電變電所', 'Distribution sub.'], tag: ['電壓↓ 電流↑', 'Voltage↓ Current↑'] }, { k: 'box', s: LV('11.4 kV') }],
    [{ k: 'box', s: LV('11.4 kV') }, { k: 'tr', up: false, lab: ['桿上變壓器', 'Pole transformer'], tag: ['電壓↓ 電流↑', 'Voltage↓ Current↑'] }, { k: 'box', s: ['110 V 與 220 V', '110 V & 220 V'] },
      { k: 'box', s: ['住家', 'Home'], c: K.white }]
  ];
  const GAP = 70, TRW = 64;
  function layoutPanel(ctx, nodes) {
    const ws = nodes.map(nd => nd.k === 'tr' ? TRW : Math.max(textW(ctx, tr(nd.s[0], nd.s[1]), 24) + 30, 104));
    const gaps = nodes.map((nd, j) => j === 0 ? 0 : (nd.gap || nodes[j - 1].gapAfter || GAP));
    // gap 放在 tr 節點上表示「進入此節點前的距離」
    const tot = ws.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
    let x = W / 2 - tot / 2; const out = [];
    nodes.forEach((nd, j) => { x += gaps[j]; out.push({ x0: x, x1: x + ws[j], cx: x + ws[j] / 2 }); x += ws[j]; });
    return out;
  }
  function drawPanel(ctx, i, tl, t) {
    const a = clamp((tl - 0.3) / 0.5, 0, 1);
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = K.panel; ctx.strokeStyle = 'rgba(159,179,170,0.45)'; ctx.lineWidth = 2;
    rrect(ctx, 40, 364, 920, 150, 16); ctx.fill(); ctx.stroke();
    const nodes = PANELS[i], L = layoutPanel(ctx, nodes);
    const xa = L[0].cx, xb = L[L.length - 1].cx;
    ctx.strokeStyle = K.white; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(xa, PY); ctx.lineTo(xb, PY); ctx.stroke();
    // 方塊
    const front = xa + V * 1.4 * Math.max(0, tl - 0.8);
    const n = Math.ceil((xb - xa) / SP) + 1;
    for (let k = 0; k < n; k++) {
      const x = xa + (((V * t + k * SP) % (n * SP)) + n * SP) % (n * SP);
      if (x > front || x > xb) continue;
      square(ctx, x, PY, clamp((front - x) / 6, 0, 1), 1);
    }
    // 節點
    nodes.forEach((nd, j) => {
      const p = L[j];
      if (nd.wireLab) text(ctx, tr(nd.wireLab[0], nd.wireLab[1]), (L[j - 1].x1 + p.x0) / 2, PY - 30, K.muted, 22);
      if (nd.k === 'tr') {
        const col = nd.up ? K.orange : K.green;
        const on = clamp((tl - 1.2 - j * 0.35) / 0.4, 0, 1);
        glow(ctx, p.cx, PY, 46, on * (0.7 + 0.3 * Math.sin(t * 4)));
        trSym(ctx, p.cx, PY, 17, col, 3.5);
        text(ctx, tr(nd.lab[0], nd.lab[1]), p.cx, PY + 46, col, 22);
        if (nd.tag) {
          const s = tr(nd.tag[0], nd.tag[1]);
          text(ctx, s, p.cx, PY - 48, K.yellow, 22, 'center', on);
        }
      } else {
        const s = tr(nd.s[0], nd.s[1]), c = nd.c || K.cyan;
        ctx.save(); ctx.fillStyle = K.iconBg; ctx.strokeStyle = c; ctx.lineWidth = 3;
        rrect(ctx, p.x0, PY - 25, p.x1 - p.x0, 50, 12); ctx.fill(); ctx.stroke(); ctx.restore();
        text(ctx, s, p.cx, PY + 1, nd.c ? K.white : K.cyan, 24);
      }
    });
    ctx.restore();
  }

  // 第 5 步：每段同樣週期的波形＋60 Hz＋結論
  function drawFinal(ctx, i, tl, t) {
    const a = clamp((tl - 0.4) / 0.6, 0, 1);
    if (a <= 0.01) return;
    const wy = 410, A = 11, lam = 30;
    for (let k = 0; k < 5; k++) {
      const x0 = XS[k] + 40, x1 = XS[k + 1] - 40, cx = (XS[k] + XS[k + 1]) / 2;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = x0, m = 0; x <= x1 + 0.01; x += 1, m++) {
        const y = wy - A * Math.sin(TAU * ((x - cx) / lam - t * 0.5));
        m ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      text(ctx, '60 Hz', cx, wy - 34, K.white, 22, 'center', a);
    }
    const b = clamp((tl - 1.6) / 0.6, 0, 1);
    if (b <= 0.01) return;
    const s = tr('電能持續傳遞；變壓器只改變電壓與電流，頻率仍是 60 Hz', 'Energy keeps moving; transformers change only voltage and current, and the frequency stays 60 Hz');
    const ls = wrap(ctx, s, 860, 24);
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = K.panel; ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5;
    rrect(ctx, 50, 448, 900, 74, 16); ctx.fill(); ctx.stroke(); ctx.restore();
    const y0 = ls.length > 1 ? 470 : 485;
    ls.forEach((l, k) => text(ctx, l, W / 2, y0 + k * 30, K.white, 24, 'center', b));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx) {
    const items = [
      [tr('藍方塊＝電能（教學符號，不代表實體粒子）', 'Blue square = energy (symbol, not a real particle)'), 's'],
      [tr('升壓變壓器', 'Step-up transformer'), 'u'],
      [tr('降壓變壓器', 'Step-down transformer'), 'd']
    ];
    const z = 22, gapIcon = 38, gapItem = 34, maxW = W - 60;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [560] : [546, 578];
    rows.forEach((row, r) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 's') square(ctx, x + 12, y, 1, 1);
        else trSym(ctx, x + 14, y, 8, kind === 'u' ? K.orange : K.green, 2.5);
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    const y0 = ls.length > 1 ? 48 : 56;
    ls.forEach((l, k) => text(ctx, l, W / 2, y0 + k * 30, K.yellow, 24));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl, t) {
    drawTop(ctx, i, tl, t);
    if (i < 4) drawPanel(ctx, i, tl, t); else drawFinal(ctx, i, tl, t);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('gridAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('gridAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl, S.t);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-grid');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-grid'); if (!row) return;
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

  window.EpAnim.grid = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-grid'); if (row) row.innerHTML = '';
      const r = document.getElementById('gridAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { grid: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'grid' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
