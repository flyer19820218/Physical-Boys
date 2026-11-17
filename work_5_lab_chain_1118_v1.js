/* work_5_lab_chain_1118_v1.js — 「動手做｜幫發電廠接能量轉換鏈」實驗台（#chainLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.chain = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab1 最後，並注入 <style id="lab-chain-css">；自給自足，不依賴 W5／EmLab。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * 內容（依課文）：
 *   火力（煤、天然氣）：燃燒化石燃料 化學能 → 熱能（鍋爐把水煮成水蒸氣）→ 動能（水蒸氣推動渦輪機扇葉）→ 電能（發電機）
 *   水力：高處的水往低處流，重力位能 → 動能（推動渦輪機）→ 電能
 *   風力：空氣流動的動能 → 電能（扇葉帶動發電機）
 *   太陽光電：光能 → 電能（光電板直接發電，沒有渦輪機、沒有發電機）
 *   非再生能源：煤、天然氣（蘊藏量有限，用了會變少）；再生能源：水、風、太陽（可以循環利用）
 * 互動：選能源（5 鈕）→ 能量方塊一格一格把鏈接起來，接著沿鏈流到燈泡；
 *   「渦輪機＋發電機：有用／沒有用」切換——需要渦輪機的電廠選「沒有用」會卡在動能；光電選「有用」會看到渦輪機閒置、用不到。
 *   非再生能源的存量條會隨發電慢慢變少，快用完時燈變暗、用完燈熄；再按一次同一個能源鈕＝重新開始。
 *   數值一律示意，畫面不標數字。
 * 操作：按鈕；畫布左右拖曳＝換上一個／下一個能源；畫布聚焦時 ←／→ 換能源、↑／↓／空白鍵 切換渦輪機、Enter 重新接一次。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'chain', TAB = 'tab1';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);
  const isEn = () => T('zh', 'en') === 'en';

  /* 黑板色票 */
  const COL = {
    bg: '#11261f', panel: '#1c3d34', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', red: '#ff4d4d',
    orange: '#fb923c', purple: '#c084fc', grey: '#6f8580'
  };

  /* 能量形式：名稱與顏色 */
  const FORM = {
    chem:  { zh: '化學能',   en: 'Chemical',  col: COL.purple },
    heat:  { zh: '熱能',     en: 'Thermal',   col: COL.red },
    kin:   { zh: '動能',     en: 'Kinetic',   col: COL.yellow },   /* 與力學單元一致：動能黃 */
    pot:   { zh: '重力位能', en: 'Potential', col: COL.orange },   /* 與力學單元一致：重力位能橘 */
    light: { zh: '光能',     en: 'Light',     col: COL.white },
    elec:  { zh: '電能',     en: 'Electric',  col: COL.teal }      /* 全站能量／電：電子藍 */
  };

  /* 五種電廠。links：[形式, 中文名(可空), 裝置中文, 裝置英文] */
  const SRC = {
    coal: {
      zh: '煤', en: 'Coal', plantZh: '燃煤電廠', plantEn: 'Coal power plant', renew: false, turbine: true,
      links: [['chem', '', '燃燒煤', 'Burning coal'], ['heat', '', '鍋爐把水煮沸', 'Boiler boils water'],
        ['kin', '蒸氣動能', '蒸氣推渦輪機', 'Steam spins turbine'], ['elec', '', '發電機發電', 'Generator']]
    },
    gas: {
      zh: '天然氣', en: 'Gas', plantZh: '燃氣電廠', plantEn: 'Natural gas power plant', renew: false, turbine: true,
      links: [['chem', '', '燃燒天然氣', 'Burning gas'], ['heat', '', '鍋爐把水煮沸', 'Boiler boils water'],
        ['kin', '蒸氣動能', '蒸氣推渦輪機', 'Steam spins turbine'], ['elec', '', '發電機發電', 'Generator']]
    },
    hydro: {
      zh: '水力', en: 'Hydro', plantZh: '水力電廠', plantEn: 'Hydroelectric plant', renew: true, turbine: true,
      links: [['pot', '', '高處水庫的水', 'Water held up high'], ['kin', '水流動能', '水往下衝推渦輪機', 'Falling water spins turbine'],
        ['elec', '', '發電機發電', 'Generator']]
    },
    wind: {
      zh: '風力', en: 'Wind', plantZh: '風力發電', plantEn: 'Wind power', renew: true, turbine: true,
      links: [['kin', '風的動能', '流動的空氣推動扇葉', 'Moving air turns the blades'], ['elec', '', '扇葉帶動發電機', 'Blades drive the generator']]
    },
    solar: {
      zh: '太陽光電', en: 'Solar PV', plantZh: '太陽能光電', plantEn: 'Solar photovoltaic', renew: true, turbine: false,
      links: [['light', '', '陽光照到光電板', 'Sunlight hits the panel'], ['elec', '', '光電板直接發電', 'Panel makes electricity directly']]
    }
  };
  const ORDER = ['coal', 'gas', 'hydro', 'wind', 'solar'];

  /* 版面（邏輯座標） */
  const LANE = 350, BOX_TOP = 212, BOX_BOT = 366, CH_X0 = 122, CH_X1 = 812, GAP = 50;
  const SRC_X = 62, SRC_Y = 282, OUT_X = 106;
  const BULB_X = 884, BULB_Y = 272, BULB_R = 34;
  const V = 220, SPAWN = 0.3, POP = 0.6, DEPLETE = 40;

  /* 小工具 */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k, 0, 1)))).join(',') + ')'; }
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
    if (w === undefined) { c.save(); c.font = font(size); w = c.measureText(s).width; c.restore(); if (TW.size > 4000) TW.clear(); TW.set(k, w); }
    return w;
  }
  function fit(c, s, maxW, size, min) { let z = size; while (z > min && tw(c, s, z) > maxW) z--; return z; }
  /* 換行：有空白就以字為單位，否則以字元為單位 */
  function wrap(c, s, maxW, size) {
    const toks = /\s/.test(s) && !/[\u3000-\u9fff\uff00-\uffef]/.test(s) ? s.split(/(\s+)/).filter(x => x.length) : Array.from(s);
    const lines = []; let cur = '';
    for (const t of toks) {
      const nx = cur + t;
      if (cur && tw(c, nx.trim(), size) > maxW) { lines.push(cur.trim()); cur = /\s/.test(t) ? '' : t; }
      else cur = nx;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  function wrapFit(c, s, maxW, size, min, maxLines) {
    let z = size, L = wrap(c, s, maxW, z);
    while (z > min && (L.length > maxLines || L.some(l => tw(c, l, z) > maxW))) { z--; L = wrap(c, s, maxW, z); }
    return { size: z, lines: L };
  }
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
  function pill(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    const w = tw(c, s, size) + 26, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false;
    label(c, s, x0 + w / 2, y, color, size, 'center');
    S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, x1: x0 + w };
  }
  function arrowHead(c, x, y, ang, color, s) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = color;
    c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.7, -s * 0.65); c.lineTo(-s * 0.7, s * 0.65); c.closePath(); c.fill(); c.restore();
  }

  /* ═════════ 狀態 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, t: 0, visible: true,
    src: 'coal', sel0: 0, turbineOn: true, togs: [{ t: -1e9, on: true }],
    bright: 0, rot: 0, actions: 0, note: 'start', debug: false, boxes: [],
    drag: null
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null;

  /* 版面計算 */
  function geom(key) {
    const L = SRC[key || S.src].links, N = L.length;
    const gp = N >= 4 ? 40 : GAP, w = Math.min(210, (CH_X1 - CH_X0 - (N - 1) * gp) / N);
    const total = N * w + (N - 1) * gp, x0 = CH_X0 + (CH_X1 - CH_X0 - total) / 2;
    const boxes = L.map((lk, i) => ({ x: x0 + i * (w + gp), w, form: lk[0], lk }));
    const tg = N >= 2 ? (boxes[N - 2].x + boxes[N - 2].w + boxes[N - 1].x) / 2 : boxes[0].x;   /* 渦輪機所在的那個間隙中點 */
    return { N, w, boxes, tgX: tg, len: BULB_X - OUT_X, breakS: tg - OUT_X };
  }
  const tPop = k => S.sel0 + 0.25 + k * POP;                         /* 第 k 格接上的時間 */
  const flowStart = () => tPop(SRC[S.src].links.length) + 0.3;
  function turbineAt(time) { let on = S.togs[0].on; for (const g of S.togs) { if (g.t <= time) on = g.on; else break; } return on; }
  function stockAt(time) {
    if (SRC[S.src].renew) return 1;
    return clamp(1 - (time - flowStart()) / DEPLETE, 0, 1);
  }
  const needsTurbine = () => SRC[S.src].turbine;
  const brokenNow = () => needsTurbine() && !S.turbineOn;

  /* 方塊 i 的狀態：s 沿路徑距離、alpha、是否卡住 */
  function block(i, g, t) {
    const sp = flowStart() + i * SPAWN;
    let s = (t - sp) * V;
    if (s < 0) return null;
    let stuck = false, a = 1;
    if (needsTurbine()) {
      const tReach = sp + g.breakS / V;
      if (t >= tReach && !turbineAt(tReach)) {
        stuck = true; const age = t - tReach;
        if (age > 0.9) return null;
        s = g.breakS - 4 + Math.sin(age * 40) * 2; a = 1 - age / 0.9;
      }
    }
    if (!stuck && s > g.len) { const age = (s - g.len) / V; if (age > 0.25) return null; a = 1 - age / 0.25; s = g.len; }
    return { s, a, stuck, sp };
  }
  function lastSpawnIndex() {
    if (SRC[S.src].renew) return Infinity;
    return Math.floor(DEPLETE / SPAWN);
  }
  /* 燈泡目標亮度：最近 0.5 秒內有方塊抵達燈泡 */
  function powerTarget(g, t) {
    const f0 = flowStart(); if (t < f0 + g.len / V) return 0;
    const iMax = Math.min(lastSpawnIndex(), Math.floor((t - f0 - g.len / V) / SPAWN));
    for (let i = iMax; i >= Math.max(0, iMax - 2); i--) {
      const arr = f0 + i * SPAWN + g.len / V;
      if (t - arr > 0.55) break;
      if (needsTurbine() && !turbineAt(f0 + i * SPAWN + g.breakS / V)) continue;
      const st = stockAt(f0 + i * SPAWN);
      return SRC[S.src].renew ? 1 : (st >= 0.3 ? 1 : clamp(0.12 + 0.88 * Math.pow(st / 0.3, 1.5), 0.12, 1));
    }
    return 0;
  }
  function phase() {
    const t = S.t, g = geom();
    if (t < flowStart()) return 'build';
    if (!SRC[S.src].renew && stockAt(t) <= 0) return S.bright > 0.02 ? 'dimming' : 'empty';
    if (brokenNow()) return 'broken';
    if (!SRC[S.src].renew && stockAt(t) < 0.3) return 'low';
    if (t < flowStart() + g.len / V) return 'flowing';
    return 'lit';
  }

  /* ═════════ 繪圖 ═════════ */
  function drawSource(c, t) {
    const key = S.src, st = stockAt(t), fl = t - S.sel0;
    c.save();
    c.fillStyle = 'rgba(11,26,21,0.7)'; c.strokeStyle = rgba(COL.yellow, 0.5); c.lineWidth = 2;
    rr(c, SRC_X - 48, SRC_Y - 62, 96, 124, 14); c.fill(); c.stroke();
    if (key === 'coal') {
      const n = Math.ceil(9 * st);
      const pos = [[-30, 40], [-10, 40], [10, 40], [30, 40], [-20, 22], [0, 22], [20, 22], [-10, 4], [10, 4]];
      for (let i = 0; i < n; i++) {
        const [dx, dy] = pos[i]; c.fillStyle = i % 2 ? '#2b2b2b' : '#3a3a3a'; c.strokeStyle = '#777'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(SRC_X + dx - 10, SRC_Y + dy + 8); c.lineTo(SRC_X + dx - 7, SRC_Y + dy - 8); c.lineTo(SRC_X + dx + 6, SRC_Y + dy - 9);
        c.lineTo(SRC_X + dx + 10, SRC_Y + dy + 6); c.closePath(); c.fill(); c.stroke();
      }
      if (st > 0 && fl > 0.2) flame(c, SRC_X, SRC_Y - 22, 0.8 * Math.min(1, st * 3), t);
    } else if (key === 'gas') {
      const h = 70 * st;
      c.fillStyle = '#2a4a40'; rr(c, SRC_X - 22, SRC_Y - 20, 44, 76, 12); c.fill();
      c.fillStyle = rgba(COL.teal, 0.45); rr(c, SRC_X - 22, SRC_Y + 56 - h, 44, h, 10); c.fill();
      c.strokeStyle = COL.dim; c.lineWidth = 2; rr(c, SRC_X - 22, SRC_Y - 20, 44, 76, 12); c.stroke();
      if (st > 0 && fl > 0.2) flame(c, SRC_X, SRC_Y - 34, 0.7 * Math.min(1, st * 3), t, true);
    } else if (key === 'hydro') {
      c.fillStyle = '#5a6b66'; c.beginPath(); c.moveTo(SRC_X + 4, SRC_Y - 50); c.lineTo(SRC_X + 22, SRC_Y - 50); c.lineTo(SRC_X + 34, SRC_Y + 56); c.lineTo(SRC_X + 4, SRC_Y + 56); c.closePath(); c.fill();
      c.fillStyle = rgba(COL.teal, 0.55); c.fillRect(SRC_X - 42, SRC_Y - 40, 46, 96);
      c.strokeStyle = rgba('#d9f6ff', 0.8); c.lineWidth = 2;
      for (let k = 0; k < 3; k++) { const y = SRC_Y - 34 + ((t * 30 + k * 32) % 90); c.beginPath(); c.moveTo(SRC_X - 36, y); c.lineTo(SRC_X - 6, y); c.stroke(); }
      c.strokeStyle = rgba(COL.teal, 0.9); c.lineWidth = 6; c.beginPath(); c.moveTo(SRC_X + 26, SRC_Y + 30); c.lineTo(SRC_X + 44, SRC_Y + 62); c.stroke();
    } else if (key === 'wind') {
      c.strokeStyle = rgba('#d9f6ff', 0.85); c.lineWidth = 3; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const y = SRC_Y - 42 + k * 28, x = SRC_X - 40 + ((t * 70 + k * 37) % 60);
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 14, y - 8, x + 26, y); c.stroke();
      }
    } else if (key === 'solar') {
      c.translate(SRC_X, SRC_Y - 10); c.rotate(t * 0.4);
      c.strokeStyle = COL.yellow; c.lineWidth = 3;
      for (let k = 0; k < 10; k++) { const a = k * TAU / 10; c.beginPath(); c.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); c.lineTo(Math.cos(a) * 38, Math.sin(a) * 38); c.stroke(); }
      c.fillStyle = COL.yellow; c.shadowColor = COL.yellow; c.shadowBlur = 16; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    }
    c.restore();
    label(c, T(SRC[key].zh, SRC[key].en), SRC_X, 372, COL.yellow, fit(c, T(SRC[key].zh, SRC[key].en), 104, 22, 20));
  }
  function flame(c, x, y, k, t, blue) {
    const f = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3);
    c.save(); c.translate(x, y); c.scale(k, k * f);
    c.fillStyle = blue ? '#4dd2ff' : '#ff8040'; c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(16, -4, 10, 10); c.quadraticCurveTo(0, 18, -10, 10); c.quadraticCurveTo(-16, -4, 0, -26); c.fill();
    c.fillStyle = blue ? '#c9f3ff' : '#ffe066'; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(8, 2, 4, 9); c.quadraticCurveTo(0, 13, -4, 9); c.quadraticCurveTo(-8, 2, 0, -12); c.fill();
    c.restore();
  }
  function drawBox(c, b, i, t, g) {
    const k = ease((t - tPop(i)) / 0.35);
    /* 還沒接上：虛線空格 */
    c.save(); c.setLineDash([7, 6]); c.strokeStyle = rgba(COL.white, 0.25 * (1 - k)); c.lineWidth = 2;
    rr(c, b.x, BOX_TOP, b.w, BOX_BOT - BOX_TOP, 12); c.stroke(); c.restore();
    if (k <= 0.01) return;
    const F = FORM[b.form];
    const dead = b.form === 'elec' && brokenNow();
    const sc = 0.85 + 0.15 * k;
    c.save(); c.globalAlpha = k * (dead ? 0.45 : 1);
    c.translate(b.x + b.w / 2, (BOX_TOP + BOX_BOT) / 2); c.scale(sc, sc); c.translate(-(b.x + b.w / 2), -(BOX_TOP + BOX_BOT) / 2);
    c.fillStyle = rgba(F.col, 0.13); c.strokeStyle = F.col; c.lineWidth = 3;
    rr(c, b.x, BOX_TOP, b.w, BOX_BOT - BOX_TOP, 12); c.fill(); c.stroke();
    c.fillStyle = 'rgba(11,26,21,0.55)'; rr(c, b.x + 5, LANE - 14, b.w - 10, 28, 8); c.fill();   /* 方塊跑道 */
    c.restore();
    if (k < 0.6) return;
    const a = (k - 0.6) / 0.4 * (dead ? 0.55 : 1), inner = b.w - 16;
    const nm = isEn() ? F.en : (b.lk[1] || F.zh);
    label(c, nm, b.x + b.w / 2, BOX_TOP + 26, F.col, fit(c, nm, inner, 24, 20), 'center', a);
    const dv = T(b.lk[2], b.lk[3]);
    const wf = wrapFit(c, dv, inner, 21, 20, 2);
    wf.lines.forEach((ln, j) => label(c, ln, b.x + b.w / 2, BOX_TOP + 60 + j * 26, COL.white, wf.size, 'center', a));
  }
  function drawLinks(c, g, t) {
    const pts = [OUT_X].concat(g.boxes.map(b => b.x)), ends = g.boxes.map(b => b.x + b.w);
    for (let i = 0; i < g.N; i++) {
      const xa = i === 0 ? OUT_X : ends[i - 1], xb = g.boxes[i].x;
      const k = ease((t - (tPop(i) - 0.3)) / 0.3);
      if (k <= 0) continue;
      const col = i === 0 ? FORM[g.boxes[0].form].col : FORM[g.boxes[i].form].col;
      const broken = needsTurbine() && !S.turbineOn && i === g.N - 1;
      c.save(); c.strokeStyle = rgba(col, 0.75); c.lineWidth = 6; c.lineCap = 'round';
      const xe = lerp(xa, xb - 8, k);
      if (broken) {
        const m = g.tgX;
        c.beginPath(); c.moveTo(xa, LANE); c.lineTo(Math.min(xe, m - 8), LANE); c.stroke();
        if (xe > m + 8) { c.beginPath(); c.moveTo(m + 8, LANE); c.lineTo(xe, LANE); c.stroke(); }
        c.strokeStyle = COL.red; c.lineWidth = 4;
        c.beginPath(); c.moveTo(m - 7, LANE - 7); c.lineTo(m + 7, LANE + 7); c.moveTo(m + 7, LANE - 7); c.lineTo(m - 7, LANE + 7); c.stroke();
      } else { c.beginPath(); c.moveTo(xa, LANE); c.lineTo(xe, LANE); c.stroke(); }
      if (k > 0.9) arrowHead(c, xb - 4, LANE, 0, rgba(col, 0.95), 10);
      c.restore();
    }
    /* 電能送到燈泡的導線 */
    const kw = ease((t - (tPop(g.N) - 0.3)) / 0.3);
    if (kw > 0) {
      const xa = ends[g.N - 1], xe = lerp(xa, BULB_X, kw);
      c.save(); c.strokeStyle = rgba(COL.teal, brokenNow() ? 0.3 : 0.75); c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(xa, LANE); c.lineTo(xe, LANE); if (kw >= 1) c.lineTo(BULB_X, BULB_Y + 48); c.stroke(); c.restore();
    }
  }
  function blockColor(g, s) {
    const x = OUT_X + s, B = g.boxes;
    if (x <= B[0].x + B[0].w) return FORM[B[0].form].col;
    for (let i = 1; i < g.N; i++) {
      const ga = B[i - 1].x + B[i - 1].w, gb = B[i].x;
      if (x < ga) return FORM[B[i - 1].form].col;
      if (x <= gb) return mix(FORM[B[i - 1].form].col, FORM[B[i].form].col, (x - ga) / (gb - ga));
      if (x <= gb + B[i].w) return FORM[B[i].form].col;
    }
    return FORM[B[g.N - 1].form].col;
  }
  function drawBlocks(c, g, t) {
    const f0 = flowStart(); if (t < f0) return;
    const iMax = Math.min(lastSpawnIndex(), Math.floor((t - f0) / SPAWN));
    const iMin = Math.max(0, Math.floor((t - f0 - g.len / V - 1.2) / SPAWN));
    for (let i = iMin; i <= iMax; i++) {
      const b = block(i, g, t); if (!b) continue;
      const x = OUT_X + b.s, col = b.stuck ? COL.red : blockColor(g, b.s);
      c.save(); c.globalAlpha = b.a * 0.35; c.fillStyle = col; rr(c, x - 11, LANE - 11, 22, 22, 6); c.fill();
      c.globalAlpha = b.a; rr(c, x - 8, LANE - 8, 16, 16, 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5; c.stroke(); c.restore();
    }
  }
  function drawTurbine(c, g, t) {
    const show = ease((t - (tPop(g.N - 1) - 0.2)) / 0.4);
    if (show <= 0.01) return;
    const cx = g.tgX, cy = 156, plant = needsTurbine(), on = S.turbineOn;
    c.save(); c.globalAlpha = show;
    if (plant && !on) {
      c.setLineDash([7, 6]); c.strokeStyle = rgba(COL.red, 0.85); c.lineWidth = 2.5;
      rr(c, cx - 66, cy - 30, 132, 60, 12); c.stroke(); c.setLineDash([]);
      c.restore();
      label(c, '？', cx, cy, COL.red, 30, 'center', show);
      label(c, T('少了渦輪機＋發電機', 'No turbine + generator'), cx, cy - 50, COL.red, fit(c, T('少了渦輪機＋發電機', 'No turbine + generator'), 300, 22, 20), 'center', show);
      return;
    }
    const idle = !plant;
    const tint = idle ? COL.grey : COL.white;
    /* 連到能量鏈的虛線（閒置的不連） */
    if (!idle) { c.setLineDash([5, 5]); c.strokeStyle = rgba(COL.yellow, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy + 30); c.lineTo(cx, LANE - 12); c.stroke(); c.setLineDash([]); }
    /* 渦輪（左） */
    const rx = cx - 34;
    c.fillStyle = 'rgba(11,26,21,0.85)'; c.strokeStyle = tint; c.lineWidth = 2.5;
    c.beginPath(); c.arc(rx, cy, 26, 0, TAU); c.fill(); c.stroke();
    c.save(); c.translate(rx, cy); c.rotate(S.rot);
    c.fillStyle = idle ? COL.grey : COL.yellow;
    for (let k = 0; k < 6; k++) { c.rotate(TAU / 6); c.beginPath(); c.ellipse(11, 0, 11, 4.5, 0.4, 0, TAU); c.fill(); }
    c.fillStyle = tint; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill(); c.restore();
    /* 轉軸＋發電機（右） */
    c.fillStyle = tint; c.fillRect(rx + 26, cy - 3, 16, 6);
    const gx = cx + 8;
    c.fillStyle = 'rgba(11,26,21,0.85)'; rr(c, gx, cy - 22, 56, 44, 8); c.fill(); c.strokeStyle = tint; c.stroke();
    c.strokeStyle = idle ? COL.grey : (S.bright > 0.05 ? COL.teal : rgba(COL.teal, 0.5)); c.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) { const x = gx + 12 + k * 10; c.beginPath(); c.moveTo(x, cy - 15); c.lineTo(x, cy + 15); c.stroke(); }
    c.restore();
    const lb = T('渦輪機＋發電機', 'Turbine + generator');
    label(c, lb, cx, cy - 50, idle ? COL.dim : COL.green, fit(c, lb, 260, 22, 20), 'center', show);
    if (idle) {
      c.save(); c.globalAlpha = show; c.strokeStyle = COL.coral; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cx - 62, cy - 26); c.lineTo(cx + 66, cy + 26); c.stroke(); c.restore();
      const u = T('用不到', 'Not used');
      pill(c, u, cx + 76, cy, COL.coral, 20, 'left');
    }
  }
  function drawBulb(c, t) {
    const b = S.bright;
    c.save();
    if (b > 0.02) {
      const gr = c.createRadialGradient(BULB_X, BULB_Y, 4, BULB_X, BULB_Y, 110);
      gr.addColorStop(0, 'rgba(255,230,120,' + (0.75 * b) + ')'); gr.addColorStop(1, 'rgba(255,230,120,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(BULB_X, BULB_Y, 110, 0, TAU); c.fill();
    }
    c.fillStyle = mix('#2a3b36', '#fff3b0', b); c.strokeStyle = COL.white; c.lineWidth = 2.5;
    c.beginPath(); c.arc(BULB_X, BULB_Y, BULB_R, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = mix('#7a6a4a', '#ff9a2e', b); c.lineWidth = 3;
    c.beginPath(); c.moveTo(BULB_X - 12, BULB_Y + 14); c.lineTo(BULB_X - 8, BULB_Y - 6); c.lineTo(BULB_X - 3, BULB_Y + 4); c.lineTo(BULB_X + 3, BULB_Y - 6); c.lineTo(BULB_X + 8, BULB_Y + 4); c.lineTo(BULB_X + 12, BULB_Y + 14); c.stroke();
    c.fillStyle = '#8c9a96'; rr(c, BULB_X - 15, BULB_Y + 30, 30, 18, 4); c.fill();
    c.strokeStyle = '#55635f'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(BULB_X - 15, BULB_Y + 35 + k * 5); c.lineTo(BULB_X + 15, BULB_Y + 35 + k * 5); c.stroke(); }
    c.restore();
    const w = b > 0.88 ? T('燈泡：很亮', 'Bulb: bright') : b > 0.3 ? T('燈泡：變暗', 'Bulb: dim') : b > 0.04 ? T('燈泡：微亮', 'Bulb: faint') : T('燈泡：不亮', 'Bulb: off');
    label(c, w, BULB_X, 376, b > 0.3 ? COL.yellow : COL.dim, fit(c, w, 150, 22, 20));
  }
  function drawHeader(c) {
    const sd = SRC[S.src];
    pill(c, T(sd.plantZh, sd.plantEn), 22, 50, COL.yellow, 24, 'left');
    const tag = sd.renew ? T('再生能源｜用不完', 'Renewable: won\'t run out') : T('非再生能源｜用了會變少', 'Non-renewable: runs low');
    pill(c, tag, W - 22, 50, sd.renew ? COL.green : COL.coral, fit(c, tag, 380, 24, 20), 'right');
  }
  function drawGauge(c, t) {
    const sd = SRC[S.src], st = stockAt(t), x0 = 30, x1 = 450, y0 = 440, y1 = 466;
    const lb = T('能源存量（示意）', 'Energy supply (model)');
    label(c, lb, x0, 418, COL.white, 22, 'left');
    c.save(); c.fillStyle = 'rgba(11,26,21,0.85)'; rr(c, x0, y0, x1 - x0, y1 - y0, 8); c.fill();
    const col = sd.renew ? COL.green : (st < 0.3 ? COL.red : COL.coral);
    if (st > 0) { c.fillStyle = col; rr(c, x0 + 3, y0 + 3, (x1 - x0 - 6) * st, y1 - y0 - 6, 6); c.fill(); }
    if (sd.renew) {   /* 一直補充：往左流動的亮紋 */
      c.save(); rr(c, x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6, 6); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 6;
      for (let x = x0 - 40 + ((t * 60) % 40); x < x1 + 20; x += 40) { c.beginPath(); c.moveTo(x, y1); c.lineTo(x + 14, y0); c.stroke(); }
      c.restore();
    }
    c.strokeStyle = COL.white; c.lineWidth = 2; rr(c, x0, y0, x1 - x0, y1 - y0, 8); c.stroke(); c.restore();
    let cap;
    if (sd.renew) cap = T('可再生：自然界一直補充，用不完', 'Renewable: nature keeps refilling it');
    else if (st <= 0) cap = T('用完了！短時間內無法再生成', 'Used up! It can\'t form again soon');
    else cap = T('不可再生：燒掉就沒了，越用越少', 'Non-renewable: once burned, it\'s gone');
    label(c, cap, x0, 496, sd.renew ? COL.green : (st <= 0 ? COL.red : COL.coral), fit(c, cap, x1 - x0, 22, 20), 'left');
  }
  function statusText() {
    const ph = phase(), sd = SRC[S.src];
    if (ph === 'build') return [T('正在把能量轉換鏈一格一格接起來…', 'Linking the energy chain step by step…'), COL.white];
    if (ph === 'broken') return [T('✗ 卡在動能：沒有渦輪機帶動發電機，變不出電能', '✗ Stuck at kinetic: without a turbine and generator, no electricity'), COL.red];
    if (ph === 'empty' || ph === 'dimming') return [T('燃料用完，燈熄了。再按一次能源鈕重新開始', 'Fuel used up, the bulb goes out. Press the source again to restart'), COL.red];
    if (ph === 'low') return [T('燃料快用完，送來的能量變少，燈變暗', 'Fuel is running low, less energy arrives, the bulb dims'), COL.coral];
    if (!sd.turbine && S.turbineOn) return [T('光電板沒有會轉的零件，渦輪機用不到；燈照樣亮', 'A solar panel has no moving parts, so the turbine is not used; the bulb still lights'), COL.coral];
    if (ph === 'flowing') return [T('能量方塊沿著鏈往前送…', 'Energy blocks travel along the chain…'), COL.white];
    return [T('✓ 能量變成電能送到燈泡，燈亮了', '✓ The energy becomes electricity and lights the bulb'), COL.green];
  }
  function drawStatus(c) {
    const [s, col] = statusText(), x0 = 492, x1 = W - 22, y0 = 410, y1 = 520;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.85)'; c.strokeStyle = col; c.lineWidth = 2; rr(c, x0, y0, x1 - x0, y1 - y0, 12); c.fill(); c.stroke(); c.restore();
    const wf = wrapFit(c, s, x1 - x0 - 28, 22, 20, 3);
    const lh = wf.size + 8, top = (y0 + y1) / 2 - (wf.lines.length - 1) * lh / 2;
    wf.lines.forEach((ln, j) => label(c, ln, (x0 + x1) / 2, top + j * lh, col, wf.size));
  }
  function render() {
    if (!ctx) return;
    const c = ctx, t = S.t, g = geom();
    S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    /* 淡淡的格線（黑板） */
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.04)'; c.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y <= H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore();
    drawHeader(c);
    drawSource(c, t);
    drawLinks(c, g, t);
    g.boxes.forEach((b, i) => drawBox(c, b, i, t, g));
    drawBlocks(c, g, t);
    drawTurbine(c, g, t);
    drawBulb(c, t);
    drawGauge(c, t);
    drawStatus(c);
  }

  /* ═════════ 迴圈 ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.25, Math.max(0, (now - S.last) / 1000)); S.last = now;
    S.t += dt;
    const g = geom();
    const target = powerTarget(g, S.t);
    S.bright += (target - S.bright) * Math.min(1, dt * 5);
    if (Math.abs(target - S.bright) < 0.002) S.bright = target;
    const spinning = needsTurbine() && S.turbineOn && S.t > flowStart() + g.breakS / V && stockAt(S.t - g.breakS / V) > 0;
    S.rot += dt * (spinning ? 7 : 0);
    render();
    if (res && S._ph !== phase()) { S._ph = phase(); updateResult(); }
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  /* ═════════ 操作 ═════════ */
  function setSource(key) {
    S.src = key; S.sel0 = S.t; S.bright = 0;
    S.togs = [{ t: -1e9, on: S.turbineOn }];
    S.note = key;
  }
  function setTurbine(on) {
    S.note = on ? 'turbineOn' : 'turbineOff';
    if (on === S.turbineOn) return;
    S.turbineOn = on; S.togs.push({ t: S.t, on });
  }
  const ACTIONS = {
    coal: () => setSource('coal'), gas: () => setSource('gas'), hydro: () => setSource('hydro'), wind: () => setSource('wind'), solar: () => setSource('solar'),
    ton: () => setTurbine(true), toff: () => setTurbine(false), again: () => setSource(S.src)
  };
  function act(k) {
    if (!ACTIONS[k]) return;
    S.actions++; ACTIONS[k](); updateUI();
    if (!S.raf) render();
  }
  function shiftSource(d) { const i = ORDER.indexOf(S.src); act(ORDER[(i + d + ORDER.length) % ORDER.length]); }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [T('選能源', 'Energy source'), ORDER.map(k => [k, T(SRC[k].zh, SRC[k].en)])],
      [T('渦輪機＋發電機', 'Turbine + generator'), [['ton', T('有用（會轉）', 'Used (spins)')], ['toff', T('沒有用', 'Not used')]]],
      [T('再試一次', 'Again'), [['again', T('↺ 重新接一次', '↺ Link again')]]]
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
      const on = SRC[k] ? S.src === k : k === 'ton' ? S.turbineOn : k === 'toff' ? !S.turbineOn : false;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    if (cv) cv.setAttribute('aria-label', T('能量轉換鏈實驗台：左右拖曳或方向鍵左右換能源，上下鍵或空白鍵切換渦輪機，Enter 重新接一次',
      'Energy chain bench: drag sideways or use left/right arrows to change the source, up/down or space toggles the turbine, Enter links again'));
    S._ph = phase();
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const sd = SRC[S.src], ph = phase();
    const chainZh = sd.links.map(l => FORM[l[0]].zh).join('→'), chainEn = sd.links.map(l => FORM[l[0]].en.toLowerCase()).join(' → ');
    const main = {
      coal: T(`<b class="lc-y">燃煤電廠（火力發電）</b>：燃燒煤，<b>化學能→熱能</b>，把鍋爐的水煮成高溫、高壓的水蒸氣；水蒸氣推動渦輪機的扇葉（<b>動能</b>），帶動發電機產生<b>電能</b>。`,
        `<b class="lc-y">Coal plant (thermal power)</b>: burning coal turns <b>chemical → thermal</b> energy and boils water into hot, high-pressure steam; the steam spins the turbine blades (<b>kinetic</b>), which drives the generator to make <b>electric</b> energy.`),
      gas: T(`<b class="lc-y">燃氣電廠（火力發電）</b>：燃燒天然氣，和燃煤一樣是 <b>化學能→熱能→動能→電能</b>。燃燒天然氣產生的懸浮微粒比燃煤少，但仍會排放二氧化碳。`,
        `<b class="lc-y">Gas plant (thermal power)</b>: burning natural gas follows the same <b>chemical → thermal → kinetic → electric</b> chain as coal. It makes fewer particles than coal but still releases carbon dioxide.`),
      hydro: T(`<b class="lc-y">水力發電</b>：高處的水往低處流，<b>重力位能→動能</b>；水流推動渦輪機，帶動發電機變成<b>電能</b>。`,
        `<b class="lc-y">Hydropower</b>: water flowing from high to low turns <b>gravitational potential → kinetic</b> energy; the water spins the turbine, which drives the generator to make <b>electric</b> energy.`),
      wind: T(`<b class="lc-y">風力發電</b>：流動的空氣有<b>動能</b>，推動扇葉轉動，帶動發電機變成<b>電能</b>。發電效率會受天候影響。`,
        `<b class="lc-y">Wind power</b>: moving air has <b>kinetic</b> energy; it turns the blades, which drive the generator to make <b>electric</b> energy. Output depends on the weather.`),
      solar: T(`<b class="lc-y">太陽能光電</b>：光電板把<b>光能直接轉成電能</b>，中間<b>沒有渦輪機、也沒有發電機</b>。發電時不會產生汙染，但夜間難以發電。`,
        `<b class="lc-y">Solar PV</b>: the panel turns <b>light directly into electric</b> energy, with <b>no turbine and no generator</b>. It makes no pollution while running, but it can't generate at night.`)
    }[S.src];
    let tb;
    if (sd.turbine && S.turbineOn) tb = T(`<b class="lc-g">✓ 渦輪機＋發電機：要用。</b>動能要先讓渦輪機轉起來，再由發電機變成電能。`, `<b class="lc-g">✓ Turbine + generator: needed.</b> Kinetic energy spins the turbine, and the generator turns it into electricity.`);
    else if (sd.turbine) tb = T(`<b class="lc-r">✗ 拿掉渦輪機＋發電機：</b>能量卡在動能，接不到電能，燈不亮。這種電廠一定要用渦輪機帶動發電機。`, `<b class="lc-r">✗ Without the turbine + generator</b> the energy is stuck as kinetic energy and never becomes electricity, so the bulb stays off. This kind of plant needs them.`);
    else if (S.turbineOn) tb = T(`<b class="lc-r">✗ 光電用不到渦輪機：</b>光電板沒有會轉的零件，光能直接變電能。把開關切到「沒有用」才對。`, `<b class="lc-r">✗ Solar PV doesn't use a turbine:</b> the panel has no moving parts and turns light straight into electricity. Switch to "Not used".`);
    else tb = T(`<b class="lc-g">✓ 沒有渦輪機也沒有發電機</b>，光能照樣直接變成電能。`, `<b class="lc-g">✓ No turbine and no generator</b>, yet light still becomes electricity directly.`);
    let rn = sd.renew
      ? T(`<b class="lc-g">再生能源</b>：可以循環利用，較無枯竭問題。`, `<b class="lc-g">Renewable</b>: it can be reused and won't run out.`)
      : T(`<b class="lc-o">非再生能源</b>：化石燃料蘊藏量有限，用了就變少，開採完很難在短時間內生成。`, `<b class="lc-o">Non-renewable</b>: fossil fuels are limited; using them leaves less, and they can't form again quickly.`);
    if (ph === 'empty' || ph === 'dimming') rn += T('（存量用完了，按一次能源鈕或「重新接一次」重新開始）', ' (Supply used up: press the source or "Link again" to restart.)');
    res.innerHTML = `<div>${T('能量轉換鏈：', 'Energy chain: ')}<b class="lc-c">${T(chainZh, chainEn)}</b></div><div>${main}</div><div>${tb}</div><div>${rn}</div>`;
  }

  /* ═════════ 拖曳與鍵盤 ═════════ */
  function lx(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
  function onDown(e) { if (e.button !== undefined && e.button !== 0) return; S.drag = { x: lx(e), id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } cv.focus({ preventScroll: true }); }
  function onUp(e) {
    if (!S.drag) return;
    const dx = lx(e) - S.drag.x; S.drag = null;
    if (Math.abs(dx) >= 60) shiftSource(dx < 0 ? 1 : -1);
  }
  function onCancel() { S.drag = null; }
  function onKey(e) {
    let k = null;
    if (e.key === 'ArrowRight') { e.preventDefault(); shiftSource(1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); shiftSource(-1); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') k = S.turbineOn ? 'toff' : 'ton';
    else if (e.key === 'Enter') k = 'again';
    if (!k) return;
    e.preventDefault(); act(k);
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
    const g = geom(), t = S.t;
    let shown = 0; for (let i = 0; i < g.N; i++) if (t >= tPop(i)) shown++;
    let blocks = 0, stuck = 0;
    const f0 = flowStart();
    if (t >= f0) {
      const iMax = Math.min(lastSpawnIndex(), Math.floor((t - f0) / SPAWN));
      for (let i = Math.max(0, iMax - 40); i <= iMax; i++) { const b = block(i, g, t); if (b) { blocks++; if (b.stuck) stuck++; } }
    }
    return {
      src: S.src, chain: SRC[S.src].links.map(l => l[0]), linksShown: shown, needsTurbine: needsTurbine(),
      turbineOn: S.turbineOn, broken: brokenNow(), renewable: SRC[S.src].renew, stock: +stockAt(t).toFixed(3),
      bright: +S.bright.toFixed(3), blocks, stuck, phase: phase(), note: S.note,
      running: !!S.raf, on: S.on, actions: S.actions, t: +t.toFixed(2), boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-chain.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box}
#lab-chain .lab-title{font-size:28px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-chain .lab-task{font-size:22px;line-height:1.55;margin:0 0 12px;color:#f6f3ea}
#lab-chain .canvas-wrap{background:#11261f;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-chain canvas{display:block;width:100%;height:auto;outline:none}
#lab-chain canvas:focus-visible{box-shadow:inset 0 0 0 3px #4dd2ff}
#lab-chain .lab-controls{display:flex;flex-direction:column;gap:10px;margin:14px 0 4px}
#lab-chain .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
#lab-chain .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:9.5em}
#lab-chain .lab-btn{font:inherit;font-size:22px;font-weight:700;min-height:48px;padding:6px 16px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-chain .lab-btn:hover{border-color:#ffe066}
#lab-chain .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-chain .result-box{border:2px dashed #ffe066;border-radius:10px;padding:14px 18px;margin-top:14px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.6;text-align:left}
#lab-chain .result-box>div+div{margin-top:6px}
#lab-chain .lc-y{color:#ffe066}#lab-chain .lc-g{color:#33cc99}#lab-chain .lc-r{color:#ff8080}#lab-chain .lc-o{color:#ff8040}#lab-chain .lc-c{color:#4dd2ff}
@media (max-width:640px){#lab-chain .lab-name{min-width:0;width:100%}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '🔧 動手做｜幫發電廠接能量轉換鏈', te = '🔧 Try it | Link the energy chain of a power plant';
    const kz = '選一種能源，看能量一格一格接到燈泡；再切換「渦輪機＋發電機」有沒有用，找出哪種電廠用不到它。畫布左右拖曳也能換能源。';
    const ke = 'Pick an energy source and watch the energy link up, step by step, to the bulb. Then switch the turbine + generator on or off to find the plant that does not need it. You can also drag the canvas sideways to change the source.';
    d.innerHTML =
      `<div class="lab-title" data-zh="${tz}" data-en="${te}">${T(tz, te)}</div>` +
      `<div class="lab-task" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI();
    S.sel0 = -10; S.t = 0;   /* 還沒 activate 時先畫一張已接好的靜態畫面 */
    render();
    S.sel0 = 0;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.on) { const k = S.sel0; S.sel0 = -10; render(); S.sel0 = k; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();
