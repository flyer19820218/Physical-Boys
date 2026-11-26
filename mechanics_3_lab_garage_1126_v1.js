/* mechanics_3_lab_garage_1126_v1.js — 「動手做｜腳踏車改造車庫」實驗台（#garageLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.garage = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab4 最後（在所有 .sub-view 之後），並注入 <style id="lab-garage-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 玩法：一輛側視腳踏車（自己用幾何畫），四個可改造部位：
 *   tire  輪胎胎紋加深      → 【增加】摩擦力：增加接觸面的粗糙程度，防止騎乘時打滑摔車
 *   brake 換有紋路煞車皮    → 【增加】摩擦力：夾住輪圈時摩擦力大，才停得下來
 *   chain 鏈條上潤滑油      → 【減少】摩擦力：改變接觸面性質，變得更光滑，減少動能變熱能散失
 *   axle  輪軸軸承上潤滑油  → 【減少】摩擦力：讓轉動順暢、省力
 * 點車上標籤（或下方按鈕）選部位 → 放大鏡特寫＋小動畫 → 先判斷「增加」還是「減少」：
 *   選錯＝提示再選；選對＝綠色 ✅ 並展開目的說明，該部位按鈕打勾、車子上出現改造後的樣子。
 *   四個都答對 → 總結：要增加：防打滑、要停下來；要減少：省力、省能量。
 * 本實驗台沒有任何數值（不發明數字），只有定性說明。
 * 動畫只在「已選部位」時跑 RAF（放大鏡循環動畫），沒選、離開分頁、document.hidden、畫布不可見時停止。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'garage', TAB = 'tab4';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6'
  };

  /* ═════════ 腳踏車幾何（側視，邏輯座標） ═════════ */
  const R = { x: 170, y: 350 }, F = { x: 430, y: 350 };      /* 後輪、前輪軸心 */
  const WR = 85, RIM = 72;                                   /* 輪胎外半徑、輪圈半徑 */
  const BB = { x: 268, y: 352 };                             /* 五通（踏板軸心） */
  const ST = { x: 236, y: 232 }, HT = { x: 388, y: 226 }, HB = { x: 398, y: 258 };
  const GROUND = 435;
  const PAD_ANG = -118 * Math.PI / 180;
  const PAD = { x: F.x + 70 * Math.cos(PAD_ANG), y: F.y + 70 * Math.sin(PAD_ANG) };   /* 煞車皮位置 */
  const RING_R = 30, COG_R = 14;                             /* 前齒盤、後飛輪半徑 */
  const LX = 770, LY = 262, LR = 160;                        /* 放大鏡圓心、半徑 */

  /* ═════════ 四個部位 ═════════ */
  const PARTS = [
    { k: 'tire', btnZh: '🛞 加深胎紋', btnEn: '🛞 Tire tread', zh: '🛞 加深輪胎胎紋', en: '🛞 Deepen the tire tread',
      tagZh: '輪胎', tagEn: 'Tire', goal: 'inc', anchor: { x: F.x + 85 * Math.cos(0.7), y: F.y + 85 * Math.sin(0.7) },
      capZh: '胎紋咬住地面', capEn: 'Tread grips the ground',
      whyZh: '增加接觸面的粗糙程度，防止騎乘時打滑摔車。', whyEn: 'It makes the contact surface rougher, so the bike will not slip and crash.',
      hintZh: '想想看：輪胎在地上打滑會怎麼樣？', hintEn: 'Think: what happens if the tire slips on the ground?' },
    { k: 'brake', btnZh: '🛑 換煞車皮', btnEn: '🛑 Brake pads', zh: '🛑 換有紋路的煞車皮', en: '🛑 Fit grooved brake pads',
      tagZh: '煞車皮', tagEn: 'Brake pad', goal: 'inc', anchor: { x: PAD.x, y: PAD.y },
      capZh: '夾住輪圈、摩擦生熱', capEn: 'Pads grip and make heat',
      whyZh: '夾住輪圈時摩擦力大，才停得下來。', whyEn: 'Strong friction when gripping the rim is what lets the bike stop.',
      hintZh: '想想看：要讓轉動的輪子停下來，需要大一點還是小一點的摩擦力？', hintEn: 'Think: to stop a spinning wheel, do you need more or less friction?' },
    { k: 'chain', btnZh: '🛢️ 鏈條上油', btnEn: '🛢️ Oil the chain', zh: '🛢️ 鏈條上潤滑油', en: '🛢️ Oil the chain',
      tagZh: '鏈條', tagEn: 'Chain', goal: 'dec', anchor: { x: (R.x + BB.x) / 2, y: (R.y + BB.y) / 2 + 22 },
      capZh: '油讓鏈節更滑順', capEn: 'Oil smooths the links',
      whyZh: '改變接觸面性質，變得更光滑，減少動能變熱能散失。', whyEn: 'It makes the contact surfaces smoother, so less kinetic energy is lost as heat.',
      hintZh: '想想看：鏈條希望順順地轉，還是卡卡地轉？', hintEn: 'Think: should a chain run smoothly or catch and drag?' },
    { k: 'axle', btnZh: '⚙️ 軸承上油', btnEn: '⚙️ Oil the bearing', zh: '⚙️ 輪軸軸承塗潤滑油', en: '⚙️ Oil the axle bearing',
      tagZh: '輪軸', tagEn: 'Axle', goal: 'dec', anchor: { x: F.x, y: F.y },
      capZh: '滾珠轉得更順', capEn: 'Balls roll smoothly',
      whyZh: '讓轉動順暢、省力。', whyEn: 'It lets the wheel turn smoothly and saves effort.',
      hintZh: '想想看：輪子要轉得順，還是越轉越吃力？', hintEn: 'Think: should a wheel turn freely or get harder to turn?' }
  ];
  const BY = {}; PARTS.forEach(p => { BY[p.k] = p; });
  const GOAL = { inc: { zh: '增加', en: 'Increase' }, dec: { zh: '減少', en: 'Decrease' } };

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, visible: true, t0: 0, t: 0,
    sel: null,                 /* 目前選的部位 key */
    phase: 'idle',             /* idle（未選）｜ask（等判斷）｜wrong（選錯，請再選）｜right（答對） */
    done: { tire: false, brake: false, chain: false, axle: false },
    wrong: 0, actions: 0, note: 'start', debug: false, boxes: [], tagHits: []
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

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
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save(); c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  function pill(c, s, x, y, color, size, align, fill) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = fill || 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x0 + w / 2, y, color, size, 'center'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, x1: x0 + w, y0: y - h / 2, y1: y + h / 2 };
  }
  function line(c, x0, y0, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function arrowH(c, x0, y0, x1, y1, color, wd, head) {
    const a = Math.atan2(y1 - y0, x1 - x0); head = head || 14;
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = wd || 6; c.lineCap = 'round';
    line(c, x0, y0, x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - head * Math.cos(a - 0.5), y1 - head * Math.sin(a - 0.5));
    c.lineTo(x1 - head * Math.cos(a + 0.5), y1 - head * Math.sin(a + 0.5)); c.closePath(); c.fill(); c.restore();
  }

  /* ═════════ 場景：地面、腳踏車 ═════════ */
  function drawFloor(c) {
    const g = c.createLinearGradient(0, GROUND, 0, H);
    g.addColorStop(0, '#2d5044'); g.addColorStop(1, '#16332b');
    c.fillStyle = g; c.fillRect(0, GROUND, W, H - GROUND);
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 3; line(c, 0, GROUND, W, GROUND);
    c.strokeStyle = 'rgba(246,243,234,0.12)'; c.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 28) line(c, x, GROUND, x, H);
    const gl = c.createRadialGradient(300, 300, 20, 300, 300, 360);
    gl.addColorStop(0, 'rgba(255,224,102,0.07)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 600, GROUND);
  }
  function wheel(c, p, mods) {
    c.save();
    /* 影子 */
    c.globalAlpha = 0.35; c.fillStyle = COL.deep; c.beginPath(); c.ellipse(p.x, GROUND + 3, WR * 0.9, 7, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    /* 輪胎 */
    c.strokeStyle = '#2b3331'; c.lineWidth = 13; c.beginPath(); c.arc(p.x, p.y, WR - 6.5, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(246,243,234,0.14)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, WR - 11, 0, TAU); c.stroke();
    /* 胎紋：改造前淺淺的，加深後明顯 */
    const n = 48, deep = mods.tire;
    c.strokeStyle = deep ? 'rgba(246,243,234,0.78)' : 'rgba(246,243,234,0.2)'; c.lineWidth = deep ? 3 : 1.5;
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n, r0 = WR - (deep ? 12 : 4), r1 = WR - 0.5;
      line(c, p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0, p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
    }
    /* 輪圈 */
    c.strokeStyle = '#b9c4c0'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, RIM, 0, TAU); c.stroke();
    /* 輻條 */
    c.strokeStyle = 'rgba(185,196,192,0.55)'; c.lineWidth = 1.3;
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18 + 0.1; line(c, p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12, p.x + Math.cos(a) * (RIM - 2), p.y + Math.sin(a) * (RIM - 2)); }
    /* 輪軸花鼓 */
    c.fillStyle = '#8a9692'; c.beginPath(); c.arc(p.x, p.y, 13, 0, TAU); c.fill();
    c.strokeStyle = mods.axle ? COL.yellow : '#d6dfdc'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#d6dfdc'; c.beginPath(); c.arc(p.x, p.y, 5, 0, TAU); c.fill();
    c.restore();
  }
  function bike(c, mods) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    /* 後輪（在車架後面） */
    wheel(c, R, mods);
    /* 鏈條（在後輪與車架之間） */
    c.save();
    const chainCol = mods.chain ? '#e8c860' : '#9aa6a2';
    c.strokeStyle = '#4a5552'; c.lineWidth = 9;
    line(c, R.x, R.y - COG_R, BB.x, BB.y - RING_R); line(c, R.x, R.y + COG_R, BB.x, BB.y + RING_R);
    c.strokeStyle = chainCol; c.lineWidth = 6; c.setLineDash([7, 5]);
    line(c, R.x, R.y - COG_R, BB.x, BB.y - RING_R); line(c, R.x, R.y + COG_R, BB.x, BB.y + RING_R);
    c.setLineDash([]);
    if (mods.chain) { c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5; line(c, R.x + 8, R.y - COG_R - 2, BB.x - 8, BB.y - RING_R - 2); }
    /* 前齒盤與後飛輪 */
    c.strokeStyle = '#c9d3d0'; c.lineWidth = 5; c.beginPath(); c.arc(BB.x, BB.y, RING_R, 0, TAU); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(R.x, R.y, COG_R, 0, TAU); c.stroke();
    c.restore();
    /* 車架 */
    c.save();
    c.strokeStyle = '#f6f3ea'; c.lineWidth = 8;
    c.beginPath();
    c.moveTo(R.x, R.y); c.lineTo(BB.x, BB.y); c.lineTo(ST.x, ST.y); c.lineTo(R.x, R.y);
    c.moveTo(ST.x, ST.y); c.lineTo(HT.x, HT.y); c.lineTo(BB.x, BB.y);
    c.moveTo(HT.x, HT.y); c.lineTo(HB.x, HB.y); c.stroke();
    /* 前叉 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 7; line(c, HB.x, HB.y, F.x, F.y);
    /* 座管、座墊 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 6; line(c, ST.x, ST.y, ST.x - 6, ST.y - 24);
    c.fillStyle = '#d0693a'; rr(c, ST.x - 40, ST.y - 36, 62, 15, 7); c.fill();
    /* 把手 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 6; line(c, HT.x, HT.y, HT.x - 6, HT.y - 26);
    c.strokeStyle = '#3a4543'; c.lineWidth = 9; line(c, HT.x - 12, HT.y - 28, HT.x + 22, HT.y - 28);
    /* 曲柄與踏板 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 6; line(c, BB.x, BB.y, BB.x - 24, BB.y + 46);
    c.fillStyle = '#3a4543'; rr(c, BB.x - 44, BB.y + 42, 34, 9, 4); c.fill();
    c.fillStyle = '#8a9692'; c.beginPath(); c.arc(BB.x, BB.y, 8, 0, TAU); c.fill();
    c.restore();
    /* 前輪（在前叉後面疊上去，讓煞車皮貼在輪圈上） */
    wheel(c, F, mods);
    c.save();
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 7; c.lineCap = 'round'; line(c, HB.x, HB.y, HB.x + 10, HB.y + 28);
    /* 煞車臂與煞車皮 */
    c.strokeStyle = '#8a9692'; c.lineWidth = 5; line(c, HB.x + 10, HB.y + 24, PAD.x + 8, PAD.y - 4);
    c.translate(PAD.x, PAD.y); c.rotate(PAD_ANG + Math.PI / 2);
    c.fillStyle = mods.brake ? '#e9d9b0' : '#3a3f3d'; rr(c, -16, -7, 32, 14, 4); c.fill();
    c.strokeStyle = '#11261f'; c.lineWidth = 2; c.stroke();
    if (mods.brake) { c.strokeStyle = '#7a5a2a'; c.lineWidth = 2.5; for (let i = -10; i <= 10; i += 7) line(c, i, -5, i, 5); }
    c.restore();
  }

  /* ═════════ 標籤（也是點選區）與高亮 ═════════ */
  const TAGPOS = { tire: { x: 540, y: 470 }, brake: { x: 470, y: 150 }, chain: { x: 250, y: 478 }, axle: { x: 100, y: 215 } };
  function tags(c) {
    S.tagHits = [];
    PARTS.forEach(p => {
      const pos = TAGPOS[p.k], on = S.sel === p.k, ok = S.done[p.k];
      const col = ok ? COL.green : on ? COL.yellow : COL.white;
      c.save(); c.setLineDash([5, 6]); c.strokeStyle = rgba(col, 0.6); c.lineWidth = 2;
      const dy = pos.y > GROUND ? -18 : 18;
      line(c, pos.x, pos.y + dy, p.anchor.x, p.anchor.y); c.restore();
      c.fillStyle = col; c.beginPath(); c.arc(p.anchor.x, p.anchor.y, 6, 0, TAU); c.fill();
      const txt = (ok ? '✓ ' : '') + T(p.tagZh, p.tagEn);
      const b = pill(c, txt, pos.x, pos.y, col, 22, 'center', on ? 'rgba(255,224,102,0.18)' : undefined);
      S.tagHits.push({ k: p.k, x0: b.x0 - 6, y0: b.y0 - 6, x1: b.x1 + 6, y1: b.y1 + 6 });
    });
  }
  function highlight(c, tm) {
    if (!S.sel) return;
    const col = S.phase === 'right' ? COL.green : COL.yellow;
    const pulse = 0.55 + 0.45 * Math.sin(tm * 5);
    c.save(); c.strokeStyle = col; c.lineWidth = 5; c.globalAlpha = pulse; c.shadowColor = col; c.shadowBlur = 14;
    const k = S.sel;
    if (k === 'tire') { [R, F].forEach(p => { c.beginPath(); c.arc(p.x, p.y, WR + 7, 0, TAU); c.stroke(); }); }
    else if (k === 'brake') { c.beginPath(); c.arc(PAD.x, PAD.y, 26, 0, TAU); c.stroke(); }
    else if (k === 'chain') { c.lineWidth = 4; c.beginPath(); c.ellipse((R.x + BB.x) / 2, (R.y + BB.y) / 2, 62, 40, 0.03, 0, TAU); c.stroke(); }
    else { [R, F].forEach(p => { c.beginPath(); c.arc(p.x, p.y, 24, 0, TAU); c.stroke(); }); }
    c.restore();
  }
  function hitPart(x, y) {
    for (const h of S.tagHits) if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) return h.k;
    if (Math.hypot(x - PAD.x, y - PAD.y) < 28) return 'brake';
    if (Math.hypot(x - F.x, y - F.y) < 26 || Math.hypot(x - R.x, y - R.y) < 26) return 'axle';
    if (distSeg(x, y, R.x, R.y - COG_R, BB.x, BB.y - RING_R) < 16 || distSeg(x, y, R.x, R.y + COG_R, BB.x, BB.y + RING_R) < 16) return 'chain';
    const dF = Math.hypot(x - F.x, y - F.y), dR = Math.hypot(x - R.x, y - R.y);
    if ((dF > 60 && dF < WR + 12) || (dR > 60 && dR < WR + 12)) return 'tire';
    return null;
  }

  /* ═════════ 放大鏡：四個小動畫（座標以放大鏡圓心為原點，t 為秒） ═════════ */
  function oilDrop(c, x, y, s, a) {
    c.save(); c.globalAlpha = a; c.fillStyle = '#ffd24d'; c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y - 14 * s); c.quadraticCurveTo(x + 10 * s, y + 2 * s, x, y + 8 * s); c.quadraticCurveTo(x - 10 * s, y + 2 * s, x, y - 14 * s);
    c.fill(); c.stroke(); c.restore();
  }
  function animTire(c, t) {
    const off = 7 * Math.sin(t * 2.2);                          /* 輪胎微微前後蹭動 */
    const gy = 34;                                              /* 地面頂 */
    /* 地面：粗糙的碎石，凸起會卡進胎紋縫 */
    c.fillStyle = '#4a3b2b'; c.fillRect(-LR, gy, LR * 2, LR);
    c.fillStyle = '#6a5640';
    for (let x = -LR + 10; x < LR; x += 52) { c.beginPath(); c.moveTo(x - 14, gy + 1); c.lineTo(x, gy - 24); c.lineTo(x + 14, gy + 1); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 3; line(c, -LR, gy, LR, gy);
    /* 輪胎本體與深胎紋 */
    c.save(); c.translate(off, 0);
    c.fillStyle = '#2b3331'; c.fillRect(-LR, -LR, LR * 2, gy - 38 + LR);
    c.fillStyle = '#39433f';
    for (let x = -LR - 30; x < LR + 60; x += 52) { rr(c, x + 1, gy - 38, 36, 38 + 22, 5); c.fill(); }
    c.restore();
    /* 摩擦力箭頭：地面對輪胎向前（右），接觸面上咬住的地方 */
    const pul = 0.8 + 0.2 * Math.sin(t * 4);
    arrowH(c, -60, gy + 40, -60 + 110 * pul, gy + 40, COL.coral, 9, 22);
    label(c, T('摩擦力 f', 'Friction f'), 0, gy + 76, COL.coral, 22);
    label(c, T('胎紋與碎石互相咬住', 'Tread bites the grit'), 0, -100, COL.white, 22);
  }
  function animBrake(c, t) {
    const u = t % 4.2;
    const s = Math.min(Math.max(u - 0.8, 0), 1.7);
    const pos = (u < 0.8 ? u : 0.8 + s - s * s / 3.4) * 220;      /* 輪圈轉動 → 煞車後越轉越慢 */
    const braking = u > 0.8, stopped = u > 2.5;
    /* 輪圈（銀色豎條，上面的記號向下捲動） */
    c.fillStyle = '#9aa6a2'; c.fillRect(-90, -LR, 70, LR * 2);
    c.fillStyle = '#c9d3d0'; c.fillRect(-90, -LR, 10, LR * 2);
    c.fillStyle = '#5c6764';
    for (let y = -LR - 60; y < LR + 60; y += 44) { const yy = ((y + pos) % 352 + 352) % 352 - 176; c.fillRect(-72, yy, 40, 14); }
    /* 煞車皮：左右壓力 */
    const sq = braking ? 14 : 0;
    c.save(); c.translate(-20 - 0 + sq * 0, 0);
    c.restore();
    c.fillStyle = '#e9d9b0'; rr(c, -18 + (braking ? 0 : 22), -70, 70, 140, 8); c.fill();
    c.strokeStyle = '#7a5a2a'; c.lineWidth = 4;
    for (let y = -52; y <= 52; y += 26) line(c, -6 + (braking ? 0 : 22), y, 40 + (braking ? 0 : 22), y);
    c.strokeStyle = '#11261f'; c.lineWidth = 2; rr(c, -18 + (braking ? 0 : 22), -70, 70, 140, 8); c.stroke();
    if (braking) {
      /* 發熱 */
      const heat = stopped ? Math.max(0, 1 - (u - 2.5) / 1.5) * 0.7 : 0.85;
      const g = c.createRadialGradient(-20, 0, 4, -20, 0, 70);
      g.addColorStop(0, rgba(COL.coral, heat)); g.addColorStop(1, rgba(COL.coral, 0));
      c.fillStyle = g; c.fillRect(-90, -80, 140, 160);
      /* 夾緊力（青）與摩擦力（珊瑚） */
      arrowH(c, 120, -40, 56, -40, COL.teal, 8, 20);
      arrowH(c, 120, 40, 56, 40, COL.teal, 8, 20);
      if (!stopped) arrowH(c, -55, 96, -55, 28, COL.coral, 9, 22);
    }
    label(c, braking ? (stopped ? T('停下來了', 'Stopped') : T('夾住 → 越轉越慢', 'Grip → slows down')) : T('輪圈轉動中', 'Rim is spinning'), 0, -118, COL.white, 22);
    if (braking && !stopped) label(c, T('摩擦力 f', 'Friction f'), 70, 96, COL.coral, 22);
  }
  function animChain(c, t) {
    const u = t % 5.2, oiled = clamp((u - 1.2) / 0.8, 0, 1);
    const sp = (t * 70) % 56;
    /* 兩列鏈節：外板與內板交錯 */
    for (let i = -6; i < 7; i++) {
      const x = i * 56 + sp, y = 10;
      c.fillStyle = i % 2 ? '#8a9692' : '#b9c4c0'; rr(c, x - 36, y - 18, 72, 36, 16); c.fill();
      c.strokeStyle = '#3a4543'; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#d6dfdc'; [-24, 24].forEach(dx => { c.beginPath(); c.arc(x + dx, y, 8, 0, TAU); c.fill(); c.stroke(); });
      if (oiled > 0) { c.fillStyle = 'rgba(255,210,77,' + (0.4 * oiled) + ')'; rr(c, x - 36, y - 18, 72, 36, 16); c.fill(); c.fillStyle = 'rgba(255,255,255,' + (0.5 * oiled) + ')'; rr(c, x - 26, y - 13, 40, 6, 3); c.fill(); }
    }
    /* 油滴 */
    for (let k = 0; k < 3; k++) {
      const du = u - 0.2 - k * 0.3; if (du < 0 || du > 0.9) continue;
      oilDrop(c, -50 + k * 50, -120 + (du / 0.9) * 112, 1.3, 1);
    }
    /* 發熱：上油前接觸處冒熱氣，上油後消失 */
    const heat = 1 - oiled;
    if (heat > 0.02) {
      c.save(); c.globalAlpha = heat; c.strokeStyle = COL.coral; c.lineWidth = 4; c.lineCap = 'round';
      [-84, -28, 28, 84].forEach((x, i) => {
        c.beginPath(); for (let y = 0; y < 44; y += 4) { const xx = x + Math.sin(y * 0.3 + t * 8 + i) * 5; if (y === 0) c.moveTo(xx, -30 - y); else c.lineTo(xx, -30 - y); } c.stroke();
      });
      c.restore();
      label(c, T('摩擦生熱', 'Friction makes heat'), 0, 78, COL.coral, 22, 'center');
    } else label(c, T('更光滑，少發熱', 'Smoother, less heat'), 0, 78, COL.yellow, 22);
  }
  function animAxle(c, t) {
    const u = t % 5.2, oiled = clamp((u - 1.0) / 0.8, 0, 1);
    const ang = t * 1.4, N = 9, ro = 92, ri = 50, rb = (ro - ri) / 2, rm = (ro + ri) / 2;
    c.fillStyle = '#6f7b77'; c.beginPath(); c.arc(0, 0, ro + 14, 0, TAU); c.fill();
    c.fillStyle = '#26302d'; c.beginPath(); c.arc(0, 0, ro, 0, TAU); c.fill();
    c.fillStyle = '#9aa6a2'; c.beginPath(); c.arc(0, 0, ri, 0, TAU); c.fill();
    c.fillStyle = '#d6dfdc'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
    for (let i = 0; i < N; i++) {
      const a = ang + i * TAU / N, x = Math.cos(a) * rm, y = Math.sin(a) * rm;
      const g = c.createRadialGradient(x - 5, y - 5, 2, x, y, rb);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, oiled > 0.5 ? '#c9a63a' : '#7d8985');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rb - 2, 0, TAU); c.fill();
      c.strokeStyle = '#11261f'; c.lineWidth = 2; c.stroke();
    }
    if (oiled > 0) { c.strokeStyle = 'rgba(255,210,77,' + (0.7 * oiled) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, ro - 3, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, ri + 3, 0, TAU); c.stroke(); }
    const du = u - 0.1; if (du > 0 && du < 0.9) oilDrop(c, 0, -150 + (du / 0.9) * 110, 1.4, 1);
    label(c, oiled > 0.5 ? T('滾珠轉得順，省力', 'Smooth rolling, less effort') : T('轉動時有阻力', 'Some drag when turning'), 0, 128, oiled > 0.5 ? COL.yellow : COL.coral, 22);
  }
  function loupe(c, tm) {
    const col = S.phase === 'right' ? COL.green : COL.yellow;
    /* 連接線：從部位拉到放大鏡邊緣 */
    if (S.sel) {
      const a = BY[S.sel].anchor, ang = Math.atan2(a.y - LY, a.x - LX);
      c.save(); c.setLineDash([4, 7]); c.strokeStyle = rgba(col, 0.7); c.lineWidth = 3;
      line(c, a.x, a.y, LX + Math.cos(ang) * (LR + 4), LY + Math.sin(ang) * (LR + 4)); c.restore();
    }
    c.save(); c.beginPath(); c.arc(LX, LY, LR - 3, 0, TAU); c.clip();
    c.fillStyle = '#143128'; c.fillRect(LX - LR, LY - LR, LR * 2, LR * 2);
    c.translate(LX, LY);
    if (S.sel === 'tire') animTire(c, tm); else if (S.sel === 'brake') animBrake(c, tm);
    else if (S.sel === 'chain') animChain(c, tm); else if (S.sel === 'axle') animAxle(c, tm);
    else {
      c.strokeStyle = rgba(COL.white, 0.5); c.lineWidth = 10; c.beginPath(); c.arc(-14, -14, 44, 0, TAU); c.stroke(); line(c, 18, 18, 56, 56);
    }
    c.restore();
    if (!S.sel) { label(c, T('點一個部位', 'Pick a part'), LX, LY + 80, COL.white, 22); label(c, T('放大看看', 'to zoom in'), LX, LY + 110, COL.white, 22); }
    c.save(); c.strokeStyle = S.sel ? col : rgba(COL.white, 0.6); c.lineWidth = 8; c.beginPath(); c.arc(LX, LY, LR, 0, TAU); c.stroke(); c.restore();
    /* 放大鏡把手 */
    c.save(); c.strokeStyle = '#8a6b3d'; c.lineWidth = 16; c.lineCap = 'round'; line(c, LX + LR * 0.72, LY + LR * 0.72, LX + LR * 0.95, LY + LR * 0.95); c.restore();
    if (S.sel) {
      const p = BY[S.sel];
      pill(c, T(p.zh, p.en), LX, 62, col, 22, 'center');
      label(c, T(p.capZh, p.capEn), LX, 458, COL.white, 22);
      if (S.phase === 'right') pill(c, '✅', LX + LR * 0.74, LY - LR * 0.74, COL.green, 24, 'center');
      else label(c, '？', LX + LR * 0.74, LY - LR * 0.74, COL.yellow, 40);
    }
  }

  /* ═════════ 繪製 ═════════ */
  function nowT() { return S.sel ? (performance.now() - S.t0) / 1000 : 0; }
  function render() {
    if (!ctx) return;
    const c = ctx; S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    const tm = nowT(); S.t = tm;
    drawFloor(c);
    bike(c, S.done);
    highlight(c, tm);
    tags(c);
    loupe(c, tm);
    const n = PARTS.filter(p => S.done[p.k]).length;
    pill(c, T('已完成 ', 'Done ') + n + ' / 4', 20, 30, n === 4 ? COL.green : COL.dim, 22, 'left');
    if (n === 4) pill(c, T('全部答對 ✅', 'All correct ✅'), 20, 76, COL.green, 22, 'left');
  }
  function frame() {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible || !S.sel) return;
    render(); S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && !!S.sel;
    if (want && !S.raf) S.raf = requestAnimationFrame(frame);
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  /* ═════════ 操作 ═════════ */
  function pick(k) {
    if (!BY[k]) return;
    S.sel = k; S.phase = S.done[k] ? 'right' : 'ask'; S.t0 = performance.now(); S.actions++; S.note = 'pick:' + k;
    refresh();
  }
  function answer(g) {
    if (!S.sel || S.phase === 'right') return;
    const p = BY[S.sel]; S.actions++;
    if (g === p.goal) { S.phase = 'right'; S.done[p.k] = true; S.note = 'right:' + p.k; }
    else { S.phase = 'wrong'; S.wrong++; S.note = 'wrong:' + p.k; }
    refresh();
  }
  function reset() {
    S.sel = null; S.phase = 'idle'; S.wrong = 0; S.actions++; S.note = 'reset';
    PARTS.forEach(p => { S.done[p.k] = false; });
    refresh();
  }
  function refresh() { buildControls(); updateResult(); sync(); render(); }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const br = document.createElement('div'); br.className = 'lab-row lab-brow';
    PARTS.forEach(p => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn' + (S.sel === p.k ? ' on' : '') + (S.done[p.k] ? ' ok' : '');
      b.dataset.part = p.k; b.textContent = (S.done[p.k] ? '✔ ' : '') + T(p.btnZh, p.btnEn);
      b.addEventListener('click', () => pick(p.k)); br.appendChild(b);
    });
    const r = document.createElement('button'); r.type = 'button'; r.className = 'lab-btn'; r.dataset.act = 'reset'; r.textContent = T('重來', 'Start over');
    r.addEventListener('click', reset); br.appendChild(r);
    ctrl.appendChild(br);
  }
  function updateResult() {
    if (!res) return;
    const p = S.sel ? BY[S.sel] : null, n = PARTS.filter(q => S.done[q.k]).length;
    let h = '';
    if (!p) {
      h = '<div>' + T('點車上的標籤（或下方按鈕）選一個部位，放大看看它在做什麼。', 'Tap a label on the bike (or a button below) to zoom in on a part.') + '</div>' +
        '<div class="lg-t">' + T('先判斷：這個改造是要<b class="lg-y">增加</b>還是<b class="lg-y">減少</b>摩擦力？', 'First decide: does this mod <b class="lg-y">increase</b> or <b class="lg-y">decrease</b> friction?') + '</div>';
    } else if (S.phase === 'ask' || S.phase === 'wrong') {
      h = '<div><b class="lg-y">' + T(p.zh, p.en) + '</b>' + T('：這是增加還是減少摩擦力？', ': does this increase or decrease friction?') + '</div>';
      if (S.phase === 'wrong') h += '<div class="lg-w">❌ ' + T('再想一想。', 'Not quite. Try again.') + ' ' + T(p.hintZh, p.hintEn) + '</div>';
      h += '<div class="lg-ans"><button type="button" class="lab-btn lg-inc" data-ans="inc">' + T('增加摩擦力', 'Increase friction') + '</button>' +
        '<button type="button" class="lab-btn lg-dec" data-ans="dec">' + T('減少摩擦力', 'Decrease friction') + '</button></div>';
    } else {
      const g = GOAL[p.goal];
      h = '<div>✅ <b class="lg-g">' + T('答對了！', 'Correct!') + '</b> <b class="lg-y">' + T(p.zh, p.en) + '</b></div>' +
        '<div><b class="lg-c">' + T('目的：【' + g.zh + '】摩擦力', 'Goal: [' + g.en + '] friction') + '</b></div>' +
        '<div class="lg-t">' + T(p.whyZh, p.whyEn) + '</div>';
    }
    if (n === 4) h += '<div class="lg-sum">🎉 ' + T('總結：<b class="lg-y">要增加</b>：防打滑、要停下來；<b class="lg-y">要減少</b>：省力、省能量。', 'Summary: <b class="lg-y">increase</b> friction to prevent slipping and to stop; <b class="lg-y">decrease</b> it to save effort and energy.') + '</div>';
    res.innerHTML = h;
  }
  function updateUI() {
    if (cv) cv.setAttribute('aria-label', T('腳踏車改造車庫：點選輪胎、煞車皮、鏈條或輪軸，放大觀察並判斷是增加還是減少摩擦力',
      'Bike mod garage: pick the tire, brake pad, chain or axle, zoom in and decide whether it increases or decreases friction'));
    buildControls(); updateResult();
  }
  function onPointer(e) {
    if (!cv) return;
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const k = hitPart((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height);
    if (k) pick(k);
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
    S.on = true; S.visible = true; if (S.sel) S.t0 = performance.now();
    updateUI();
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
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); updateUI(); render();
  }
  function _state() {
    return {
      sel: S.sel, phase: S.phase, done: Object.assign({}, S.done), doneCount: PARTS.filter(p => S.done[p.k]).length,
      wrong: S.wrong, running: !!S.raf, on: S.on, actions: S.actions, note: S.note, t: +S.t.toFixed(2),
      tagHits: S.tagHits.slice(), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-garage.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ff8040;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column}
#lab-garage .lab-title{order:0;font-size:32px;font-weight:700;color:#4dd2ff;margin:0 0 6px;line-height:1.35}
#lab-garage .lab-task{order:1;font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-garage .canvas-wrap{order:2;background:#0d201a;border:2px solid #ff8040;border-radius:10px;overflow:hidden;position:relative}
#lab-garage canvas{display:block;width:100%;height:auto;outline:none;cursor:pointer}
#lab-garage .result-box{order:3;min-height:150px;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left;box-sizing:border-box}
#lab-garage .result-box>div+div{margin-top:4px}
#lab-garage .lab-controls{order:4;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-garage .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px}
#lab-garage .lab-brow{min-height:44px}
#lab-garage .lg-ans{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
#lab-garage .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer;touch-action:manipulation}
#lab-garage .lab-btn:hover{border-color:#ffe066}
#lab-garage .lab-btn.on{border-color:#ffe066;background:rgba(255,224,102,.16)}
#lab-garage .lab-btn.ok{border-color:#33cc99;color:#33cc99}
#lab-garage .lg-ans .lab-btn{min-width:200px}
#lab-garage .lg-y{color:#ffe066}#lab-garage .lg-g{color:#33cc99}#lab-garage .lg-c{color:#ff8040}
#lab-garage .lg-t{color:#a3b8b0}#lab-garage .lg-w{color:#ff8040}
#lab-garage .lg-sum{border-top:1px solid rgba(246,243,234,.25);padding-top:6px;color:#f6f3ea}
@media (max-width:640px){#lab-garage.lab-desk{padding:12px 12px 14px}#lab-garage .lab-title{font-size:28px}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '動手做｜腳踏車改造車庫', te = 'Try it | Bike mod garage';
    const kz = '點一個部位放大看看，再判斷：這個改造是要增加還是減少摩擦力？四個都答對，就完成改造！';
    const ke = 'Tap a part to zoom in, then decide: does this mod increase or decrease friction? Get all four right to finish the garage!';
    d.innerHTML =
      `<h2 class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</h2>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    bind();
    cv.addEventListener('pointerup', onPointer);
    res.addEventListener('click', e => { const b = e.target.closest('[data-ans]'); if (b) answer(b.getAttribute('data-ans')); });
    updateUI(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _pick: pick, _answer: answer, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
