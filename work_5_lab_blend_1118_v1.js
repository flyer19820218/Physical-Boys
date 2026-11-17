/* work_5_lab_blend_1118_v1.js — 「動手做｜你來配電力：沒有十全十美」實驗台（#blendLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.blend = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab5 最後（<div class="lab-desk" id="lab-blend">），CSS 也自己注入（#lab-blend-css）。
 * 依賴頁面的全域 tr('中文','English')；沒有時退回中文。語言切換：頁面呼叫 relang()；另外監看 <html lang> 自動重畫。
 *
 * 內容（依課文「非再生能源與再生能源優缺點」）：
 *   火力（化石燃料）：供電穩定｜蘊藏有限、排放大量二氧化碳→全球暖化、硫氧化物與氮氧化物→酸雨、煤灰→空氣汙染
 *   核能（核燃料）　：供電穩定、碳排放幾乎為零｜蘊藏有限、熱廢水影響水域生態、用過的核燃料有放射性要封存
 *   再生能源　　　　：可循環使用、碳排放幾乎為零｜供電不穩定（要搭配儲電設備）、設備占地影響生態與環境
 * 儀表一律只示意高低（低／中／高），沒有任何實際數字；比例是學生自己配的。
 *   碳排放＝火力×1＋核能×0.04＋再生×0.06；供電穩定＝火力×0.95＋核能×0.95＋再生×0.15；
 *   其他代價三條＝空氣汙染（火力占比）、核廢料（核能占比）、占地與生態（再生占比）。
 * 互動：5 個配方鈕（偏火力／偏核能／偏再生／均衡／自訂微調）、三組 −／＋（每次 5%）、
 *   畫布水平拖曳長條上的兩條分界線（吸附 5%）；鍵盤（畫布聚焦）：←／→ 移動選取的分界線、
 *   ↑／↓ 換配方、空白鍵或 Enter 切換選取的分界線。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'blend', TAB = 'tab5';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const FONT = "'Noto Sans TC',sans-serif";
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const C = {
    bg: '#11261f', panel: '#1c3d34', deep: '#0d201a', chalk: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', green: '#33cc99', coral: '#ff8040', red: '#ff5a5a', teal: '#4dd2ff'
  };
  // 三種來源（顏色與同課「發電結構比一比」一致：天然氣橘、核能紫、再生綠）
  const SRC = [
    { k: 'fossil', zh: '火力', en: 'Fossil', col: '#ff8040' },
    { k: 'nuclear', zh: '核能', en: 'Nuclear', col: '#b58cff' },
    { k: 'renew', zh: '再生能源', en: 'Renewables', col: '#33cc99' }
  ];
  const PRESETS = {
    fossil: { zh: '偏火力', en: 'Mostly fossil', mix: [80, 10, 10] },
    nuclear: { zh: '偏核能', en: 'Mostly nuclear', mix: [20, 70, 10] },
    renew: { zh: '偏再生', en: 'Mostly renewable', mix: [10, 10, 80] },
    balanced: { zh: '均衡', en: 'Balanced', mix: [35, 30, 35] }
  };
  const PRESET_ORDER = ['fossil', 'nuclear', 'renew', 'balanced'];
  const STEP = 5;

  // ───────── 版面常數（邏輯座標） ─────────
  const BAR = { x0: 40, x1: 920, y0: 52, y1: 118 };
  const BW = BAR.x1 - BAR.x0;
  const PANEL_Y0 = 162, PANEL_Y1 = 404, PANEL_W = 290, PANEL_X = [22, 335, 648];
  const ROW_Y = { pros: 428, cons: 467, think: 509 };

  // ───────── 狀態 ─────────
  const S = {
    mix: [35, 30, 35],          // 目標比例（整數、合計 100）
    shown: [35, 30, 35],        // 畫面上緩動中的比例
    preset: 'balanced',         // fossil／nuclear／renew／balanced／custom
    sel: 0,                     // 鍵盤選取的分界線 0 或 1
    drag: null,                 // { which, pending, x0 }
    hover: -1,
    on: false, visible: true, raf: 0, last: 0, t: 0, actions: 0, note: 'balanced',
    boxes: []
  };
  let desk = null, cv = null, ctx = null, ctrl = null, res = null, io = null, mo = null;

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = size => `700 ${size}px ${FONT}`;
  function textW(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fitSize(s, maxW, size, min) { let z = size; while (z > min && textW(s, z) > maxW) z -= 1; return z; }
  function rrect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  // 寫字並登記外框（給版面檢查用）
  function text(s, x, y, color, size = 22, align = 'center') {
    ctx.save(); ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    S.boxes.push({ str: s, x0, x1: x0 + w, y0: y - size * 0.6, y1: y + size * 0.6, size });
    return w;
  }
  function boundaries(m) { return [BAR.x0 + BW * m[0] / 100, BAR.x0 + BW * (m[0] + m[1]) / 100]; }

  // ───────── 示意模型 ─────────
  function model(m) {
    const f = m[0] / 100, n = m[1] / 100, r = m[2] / 100;
    return {
      carbon: clamp(f * 1 + n * 0.04 + r * 0.06, 0, 1),
      stable: clamp(f * 0.95 + n * 0.95 + r * 0.15, 0, 1),
      air: f, waste: n, land: r, limited: f + n
    };
  }
  const lvGauge = v => (v < 0.35 ? 0 : v < 0.7 ? 1 : 2);
  const lvCost = v => (v < 0.2 ? 0 : v < 0.5 ? 1 : 2);
  const lvWord = l => [T('低', 'Low'), T('中', 'Medium'), T('高', 'High')][l];

  function prosCons(m) {
    const M = model(m), f = m[0] / 100, n = m[1] / 100, r = m[2] / 100;
    const pros = [], cons = [];
    if (lvGauge(M.carbon) === 0) pros.push(T('碳排放低', 'low carbon emissions'));
    if (lvGauge(M.stable) === 2) pros.push(T('供電穩定', 'steady supply'));
    if (r >= 0.5) pros.push(T('能源可循環使用', 'the energy can be reused'));
    if (!pros.length) pros.push(T('碳排放和供電穩定都在中間，沒有哪一項特別差', 'carbon and steadiness are both in the middle, nothing is extreme'));
    if (lvGauge(M.carbon) === 2) cons.push(T('排放大量二氧化碳→全球暖化', 'lots of CO₂ → global warming'));
    else if (lvGauge(M.carbon) === 1) cons.push(T('仍會排放不少二氧化碳', 'still a fair amount of CO₂'));
    if (lvGauge(M.stable) === 0) cons.push(T('供電不穩定，要搭配儲電設備', 'unsteady supply, needs energy storage'));
    if (f >= 0.5) cons.push(T('酸雨與空氣汙染', 'acid rain and air pollution'));
    if (n >= 0.2) cons.push(T('用過的核燃料有放射性，要封存', 'used nuclear fuel is radioactive and must be sealed away'));
    if (n >= 0.5) cons.push(T('熱廢水影響水域生態', 'warm waste water harms aquatic life'));
    if (r >= 0.3) cons.push(T('設備占地，可能影響生態', 'equipment takes up land and can harm ecosystems'));
    if (M.limited >= 0.6) cons.push(T('燃料蘊藏量有限', 'fuel reserves are limited'));
    if (lvGauge(M.stable) === 1 && r >= 0.3) cons.push(T('再生能源受天氣影響，供電會起伏', 'renewables depend on the weather, so output varies'));
    return { pros, cons };
  }

  // ───────── 圖示（畫在長條的各段裡；clip 在段內） ─────────
  function iconFossil(cx, cy, s, t) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.fillStyle = '#3b2a20'; ctx.fillRect(-26, -2, 40, 24);           // 廠房
    ctx.fillRect(4, -26, 10, 26);                                          // 煙囪
    ctx.fillStyle = '#5a4030'; ctx.fillRect(-20, 6, 8, 8); ctx.fillRect(-6, 6, 8, 8);
    for (let i = 0; i < 4; i++) {                                          // 煙
      const p = ((t * 0.45 + i / 4) % 1);
      ctx.globalAlpha = 0.75 * (1 - p); ctx.fillStyle = '#d8d0c8';
      ctx.beginPath(); ctx.arc(9 + p * 18, -30 - p * 26, 5 + p * 7, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function iconNuclear(cx, cy, s, t) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.fillStyle = '#3a2d55';
    ctx.beginPath(); ctx.moveTo(-20, 24); ctx.quadraticCurveTo(-8, 0, -14, -22); ctx.lineTo(14, -22); ctx.quadraticCurveTo(8, 0, 20, 24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) {                                          // 水蒸氣
      const p = ((t * 0.35 + i / 3) % 1);
      ctx.globalAlpha = 0.7 * (1 - p); ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-4 + Math.sin(p * 5 + i) * 5, -26 - p * 22, 6 + p * 6, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function iconRenew(cx, cy, s, t) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.strokeStyle = '#e8fff6'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 26); ctx.lineTo(-6, -10); ctx.stroke(); // 塔
    ctx.save(); ctx.translate(-6, -10); ctx.rotate(t * 2.2);
    ctx.fillStyle = '#e8fff6';
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(0, -11, 3, 11, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(20, -16, 7, 0, TAU); ctx.fill();   // 太陽
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 0.4; ctx.beginPath(); ctx.moveTo(20 + Math.cos(a) * 10, -16 + Math.sin(a) * 10); ctx.lineTo(20 + Math.cos(a) * 14, -16 + Math.sin(a) * 14); ctx.stroke(); }
    ctx.fillStyle = '#1d5a8a'; ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 1.5;               // 太陽能板
    ctx.beginPath(); ctx.moveTo(6, 26); ctx.lineTo(12, 10); ctx.lineTo(32, 10); ctx.lineTo(26, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  const ICONS = [iconFossil, iconNuclear, iconRenew];

  // ───────── 繪圖 ─────────
  function drawBar() {
    const m = S.shown, b = boundaries(m), xs = [BAR.x0, b[0], b[1], BAR.x1];
    const custom = S.preset === 'custom';
    // 頂部說明列
    const pname = custom ? T('自訂', 'Custom') : T(PRESETS[S.preset].zh, PRESETS[S.preset].en);
    text(T('目前配方：', 'Current mix: ') + pname, BAR.x0, 26, C.yellow, 24, 'left');
    text(T('儀表只示意高低，不是實際數據', 'Meters show high/low only, not real data'), BAR.x1, 26, C.dim, 20, 'right');
    // 底框
    ctx.save(); rrect(BAR.x0 - 3, BAR.y0 - 3, BW + 6, BAR.y1 - BAR.y0 + 6, 12); ctx.fillStyle = C.deep; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,224,102,0.45)'; ctx.stroke(); ctx.restore();
    ctx.save(); rrect(BAR.x0, BAR.y0, BW, BAR.y1 - BAR.y0, 10); ctx.clip();
    for (let i = 0; i < 3; i++) {
      const a = xs[i], z = xs[i + 1], w = z - a;
      if (w <= 0.5) continue;
      const g = ctx.createLinearGradient(0, BAR.y0, 0, BAR.y1);
      g.addColorStop(0, SRC[i].col); g.addColorStop(1, shade(SRC[i].col, 0.62));
      ctx.fillStyle = g; ctx.fillRect(a, BAR.y0, w, BAR.y1 - BAR.y0);
      if (w >= 44) {
        ctx.save(); ctx.beginPath(); ctx.rect(a, BAR.y0, w, BAR.y1 - BAR.y0); ctx.clip();
        ICONS[i]((a + z) / 2, (BAR.y0 + BAR.y1) / 2 + 6, clamp(w / 130, 0.55, 1), S.t);
        ctx.restore();
      }
    }
    ctx.restore();
    // 分界線把手
    for (let j = 0; j < 2; j++) {
      const x = b[j], hot = S.sel === j || S.hover === j || (S.drag && S.drag.which === j);
      ctx.save();
      ctx.strokeStyle = hot ? C.yellow : C.chalk; ctx.lineWidth = hot ? 4 : 3;
      if (hot) { ctx.shadowColor = C.yellow; ctx.shadowBlur = custom ? 10 + 6 * Math.sin(S.t * 5) : 8; }
      ctx.beginPath(); ctx.moveTo(x, BAR.y0 - 8); ctx.lineTo(x, BAR.y1 + 8); ctx.stroke();
      ctx.fillStyle = hot ? C.yellow : C.chalk; ctx.shadowBlur = 0;
      const ky = (BAR.y0 + BAR.y1) / 2;
      rrect(x - 11, ky - 17, 22, 34, 8); ctx.fill();
      ctx.fillStyle = C.deep;
      ctx.beginPath(); ctx.moveTo(x - 7, ky); ctx.lineTo(x - 2, ky - 6); ctx.lineTo(x - 2, ky + 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 7, ky); ctx.lineTo(x + 2, ky - 6); ctx.lineTo(x + 2, ky + 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // 圖例＋比例
    const ly = 142, cxs = [170, 480, 790];
    for (let i = 0; i < 3; i++) {
      const s = `${T(SRC[i].zh, SRC[i].en)} ${Math.round(S.mix[i])}%`;
      const w = textW(s, 22) + 26;
      ctx.save(); ctx.fillStyle = SRC[i].col; rrect(cxs[i] - w / 2, ly - 9, 18, 18, 4); ctx.fill(); ctx.restore();
      text(s, cxs[i] - w / 2 + 26, ly, C.chalk, 22, 'left');
    }
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }
  function panelBox(i, title, sub) {
    const x = PANEL_X[i];
    ctx.save(); rrect(x, PANEL_Y0, PANEL_W, PANEL_Y1 - PANEL_Y0, 14); ctx.fillStyle = C.panel; ctx.fill();
    ctx.strokeStyle = 'rgba(255,224,102,0.55)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const cx = x + PANEL_W / 2;
    text(title, cx, PANEL_Y0 + 24, C.yellow, fitSize(title, PANEL_W - 20, 24, 20));
    text(sub, cx, PANEL_Y0 + 52, C.dim, 20);
    return cx;
  }
  // 半圓儀表：v 0..1；good＝'low' 代表越低越好
  function gauge(i, title, sub, v, good) {
    const cx = panelBox(i, title, sub), cy = 350, R = 100;
    const zones = good === 'low' ? [C.green, C.yellow, C.red] : [C.red, C.yellow, C.green];
    const cuts = [0, 0.35, 0.7, 1];
    ctx.save(); ctx.lineWidth = 18; ctx.lineCap = 'butt';
    for (let z = 0; z < 3; z++) {
      ctx.strokeStyle = zones[z]; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI + cuts[z] * Math.PI + 0.01, Math.PI + cuts[z + 1] * Math.PI - 0.01); ctx.stroke();
    }
    ctx.restore();
    text(T('低', 'Low'), cx - R, cy + 24, C.dim, 20);
    text(T('高', 'High'), cx + R, cy + 24, C.dim, 20);
    const a = Math.PI + clamp(v, 0, 1) * Math.PI;
    ctx.save(); ctx.strokeStyle = C.chalk; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - 18), cy + Math.sin(a) * (R - 18)); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill(); ctx.restore();
    const l = lvGauge(v);
    text(lvWord(l), cx, cy + 36, zones[l], 26);
  }
  function costPanel(M) {
    const cx = panelBox(2, T('其他代價', 'Other costs'), T('越低越好', 'Lower is better'));
    const x0 = PANEL_X[2] + 16, x1 = PANEL_X[2] + PANEL_W - 16;
    const rows = [
      [T('空氣汙染、酸雨', 'Air pollution, acid rain'), M.air, SRC[0].col],
      [T('核廢料（放射性）', 'Radioactive waste'), M.waste, SRC[1].col],
      [T('占地、影響生態', 'Land use, ecosystems'), M.land, SRC[2].col]
    ];
    rows.forEach((r, k) => {
      const y = 240 + k * 56, l = lvCost(r[1]);
      const word = lvWord(l), ww = textW(word, 22);
      text(r[0], x0, y, C.chalk, fitSize(r[0], x1 - x0, 22, 20), 'left');
      const by = y + 28, bw = x1 - x0 - ww - 12;              // 下一行：長條＋高低字
      text(word, x1, by, [C.green, C.yellow, C.red][l], 22, 'right');
      ctx.save(); rrect(x0, by - 6, bw, 12, 6); ctx.fillStyle = C.deep; ctx.fill();
      if (r[1] > 0.004) { rrect(x0, by - 6, Math.max(8, bw * clamp(r[1], 0, 1)), 12, 6); ctx.fillStyle = r[2]; ctx.fill(); } ctx.restore();
    });
    void cx;
  }
  // 底部一列（左邊色標，文字自動縮到放得下；放不下就少列一項）
  function strip(y, head, items, col, sep) {
    const x0 = 22, x1 = W - 22, h = 36;
    ctx.save(); rrect(x0, y - h / 2, x1 - x0, h, 10); ctx.fillStyle = 'rgba(13,32,26,0.95)'; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = col; rrect(x0, y - h / 2, 8, h, 4); ctx.fill(); ctx.restore();
    const hw = text(head, x0 + 18, y, col, 22, 'left');
    const room = x1 - (x0 + 18 + hw) - 14;
    let list = items.slice(), s = list.join(sep), z = 22;
    while (true) {
      z = fitSize(s, room, 22, 20);
      if (textW(s, z) <= room || list.length <= 1) break;
      list.pop(); s = list.join(sep);
    }
    text(s, x0 + 18 + hw + 4, y, C.chalk, z, 'left');
  }
  function render() {
    if (!ctx) return;
    S.boxes = [];
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawBar();
    const M = model(S.shown);
    gauge(0, T('碳排放', 'Carbon emissions'), T('越低越好', 'Lower is better'), M.carbon, 'low');
    gauge(1, T('供電穩定', 'Supply steadiness'), T('越高越好', 'Higher is better'), M.stable, 'high');
    costPanel(M);
    const pc = prosCons(S.mix);
    strip(ROW_Y.pros, T('優點：', 'Upsides: '), pc.pros, C.green, T('、', '; '));
    strip(ROW_Y.cons, T('代價：', 'Costs: '), pc.cons, C.coral, T('、', '; '));
    strip(ROW_Y.think, T('想一想：', 'Think: '),
      [T('每一種組合都有優點，也有代價——沒有十全十美的能源，你會怎麼取捨？', 'every mix has upsides and costs. No source is perfect: what would you choose?')],
      C.yellow, '');
  }

  // ───────── 迴圈（一次一條 RAF；只在 activate～deactivate、頁面可見時跑） ─────────
  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 0.016;
    S.last = ts; S.t += dt;
    const k = S.drag ? 1 : 1 - Math.exp(-dt * 9);
    for (let i = 0; i < 3; i++) S.shown[i] += (S.mix[i] - S.shown[i]) * k;
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && !document.hidden && S.visible;
    if (want && !S.raf) { S.last = 0; S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ───────── 改比例 ─────────
  function setMix(m, preset, note) {
    S.mix = m.slice(); S.preset = preset; S.note = note || preset;
    updateUI();
    if (!S.raf) { S.shown = S.mix.slice(); render(); }
  }
  function nudge(i, d) {                      // d＝+1／−1，每次 5%
    const m = S.mix.slice(), o = [0, 1, 2].filter(j => j !== i);
    if (d > 0) {
      if (m[i] >= 100) { S.note = 'max'; return setMix(m, 'custom', 'max'); }
      const from = m[o[0]] >= m[o[1]] ? o[0] : o[1];   // 從比例大的那一項挪過來
      m[from] -= STEP; m[i] += STEP;
    } else {
      if (m[i] <= 0) return setMix(m, 'custom', 'min');
      const to = m[o[0]] <= m[o[1]] ? o[0] : o[1];     // 讓給比例小的那一項
      m[to] += STEP; m[i] -= STEP;
    }
    setMix(m, 'custom', (d > 0 ? 'up-' : 'down-') + SRC[i].k);
  }
  function moveDivider(j, pct) {              // 分界線 j 移到 pct（0..100，吸附 5%）
    pct = Math.round(pct / STEP) * STEP;
    const m = S.mix.slice();
    if (j === 0) { const b2 = m[0] + m[1]; pct = clamp(pct, 0, b2); m[0] = pct; m[1] = b2 - pct; }
    else { pct = clamp(pct, m[0], 100); m[1] = pct - m[0]; m[2] = 100 - pct; }
    if (m.join() !== S.mix.join() || S.preset !== 'custom') setMix(m, 'custom', 'drag');
  }
  const ACTIONS = {
    fossil: () => setMix(PRESETS.fossil.mix, 'fossil'),
    nuclear: () => setMix(PRESETS.nuclear.mix, 'nuclear'),
    renew: () => setMix(PRESETS.renew.mix, 'renew'),
    balanced: () => setMix(PRESETS.balanced.mix, 'balanced'),
    custom: () => setMix(S.mix, 'custom', 'custom'),
    'f-': () => nudge(0, -1), 'f+': () => nudge(0, 1),
    'n-': () => nudge(1, -1), 'n+': () => nudge(1, 1),
    'r-': () => nudge(2, -1), 'r+': () => nudge(2, 1)
  };
  function act(key) { if (!ACTIONS[key]) return; S.actions++; ACTIONS[key](); }

  // ───────── 畫布拖曳 ─────────
  function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  function nearest(x) {
    const b = boundaries(S.mix), d0 = Math.abs(x - b[0]), d1 = Math.abs(x - b[1]);
    if (Math.abs(b[0] - b[1]) < 2) return { which: -1, d: d0 };   // 兩條重疊：看拖的方向再決定
    return d0 <= d1 ? { which: 0, d: d0 } : { which: 1, d: d1 };
  }
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const p = toLogical(e), nb = nearest(p.x);
    if (p.y > PANEL_Y0 - 4) return;           // 只在上方長條區拖曳
    S.drag = { which: nb.which, x0: p.x, id: e.pointerId };
    if (nb.which >= 0) S.sel = nb.which;
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
    if (nb.which >= 0) { S.actions++; moveDivider(nb.which, (p.x - BAR.x0) / BW * 100); }
    cv.focus({ preventScroll: true });
    e.preventDefault();
  }
  function onMove(e) {
    const p = toLogical(e);
    if (!S.drag) {
      const nb = nearest(p.x);
      S.hover = p.y < PANEL_Y0 - 4 && nb.d < 40 ? (nb.which < 0 ? 0 : nb.which) : -1;
      cv.style.cursor = p.y < PANEL_Y0 - 4 ? 'ew-resize' : 'default';
      return;
    }
    if (S.drag.which < 0) {
      if (Math.abs(p.x - S.drag.x0) < 3) return;
      S.drag.which = p.x > S.drag.x0 ? 1 : 0; S.sel = S.drag.which; S.actions++;
    }
    moveDivider(S.drag.which, (p.x - BAR.x0) / BW * 100);
  }
  function onUp(e) {
    if (!S.drag) return;
    try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
    S.drag = null; updateUI();
  }
  function onLeave() { if (!S.drag) S.hover = -1; }

  // ───────── 鍵盤 ─────────
  function onKey(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      const b = [S.mix[0], S.mix[0] + S.mix[1]][S.sel];
      S.actions++; moveDivider(S.sel, b + (k === 'ArrowRight' ? STEP : -STEP));
    } else if (k === 'ArrowUp' || k === 'ArrowDown') {
      let i = PRESET_ORDER.indexOf(S.preset);
      if (i < 0) i = k === 'ArrowDown' ? -1 : PRESET_ORDER.length;
      i = (i + (k === 'ArrowDown' ? 1 : -1) + PRESET_ORDER.length) % PRESET_ORDER.length;
      act(PRESET_ORDER[i]);
    } else if (k === ' ' || k === 'Enter') {
      S.sel = 1 - S.sel; S.actions++; S.note = 'sel' + S.sel;
      if (!S.raf) render();
    } else return;
    e.preventDefault();
  }

  // ───────── DOM（自己注入） ─────────
  const CSS = `
#lab-${KEY}{max-width:1080px;margin:28px auto 8px;background:#11261f;border:2px solid #ffe066;border-radius:18px;padding:16px 18px 18px;color:#f6f3ea;font-family:'Noto Sans TC',sans-serif;box-sizing:border-box}
#lab-${KEY} *{box-sizing:border-box}
#lab-${KEY} .lab-title{font-size:30px;font-weight:700;color:#ffe066;margin:0 0 6px;line-height:1.35}
#lab-${KEY} .lab-task{font-size:22px;line-height:1.55;color:#f6f3ea;margin:0 0 12px}
#lab-${KEY} .canvas-wrap{background:#11261f;border:2px solid rgba(255,224,102,.45);border-radius:14px;overflow:hidden;line-height:0}
#lab-${KEY} canvas{display:block;width:100%;height:auto;aspect-ratio:16/9;outline:none}
#lab-${KEY} canvas:focus-visible{box-shadow:inset 0 0 0 4px rgba(255,224,102,.85)}
#lab-${KEY} .lab-controls{display:flex;flex-direction:column;gap:10px;margin-top:14px}
#lab-${KEY} .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px}
#lab-${KEY} .lab-grp{display:inline-flex;align-items:center;gap:8px;background:#1c3d34;border-radius:12px;padding:4px 8px}
#lab-${KEY} .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:2.6em}
#lab-${KEY} .lab-btn{min-height:48px;font-size:22px;font-weight:700;font-family:inherit;color:#f6f3ea;background:#1c3d34;border:2px solid rgba(255,224,102,.55);border-radius:12px;padding:4px 16px;cursor:pointer;line-height:1.2}
#lab-${KEY} .lab-grp .lab-btn{min-width:48px;padding:4px 12px;background:#11261f}
#lab-${KEY} .lab-btn:hover{border-color:#ffe066}
#lab-${KEY} .lab-btn:focus-visible{outline:3px solid #ffe066;outline-offset:2px}
#lab-${KEY} .lab-btn.active{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-${KEY} .result-box{margin-top:14px;background:#1c3d34;border-left:6px solid #ffe066;border-radius:12px;padding:12px 16px;font-size:22px;line-height:1.65}
#lab-${KEY} .result-box b{color:#ffe066}
#lab-${KEY} .result-box .ok{color:#33cc99;font-weight:700}
#lab-${KEY} .result-box .bad{color:#ff8040;font-weight:700}
#lab-${KEY} .result-box .think{color:#ffe066;font-weight:700}
#lab-${KEY} .result-box .muted{color:#a3b8b0}
@media (max-width:640px){#lab-${KEY}{padding:12px}#lab-${KEY} .lab-title{font-size:26px}}
`;
  function injectDOM() {
    if (document.getElementById('lab-' + KEY)) { desk = document.getElementById('lab-' + KEY); return true; }
    const tab = document.getElementById(TAB);
    if (!tab) return false;
    if (!document.getElementById(`lab-${KEY}-css`)) {
      const st = document.createElement('style'); st.id = `lab-${KEY}-css`; st.textContent = CSS; document.head.appendChild(st);
    }
    desk = document.createElement('div');
    desk.className = 'lab-desk'; desk.id = 'lab-' + KEY;
    desk.innerHTML =
      `<div class="lab-title" data-zh="🔧 動手做｜你來配電力：沒有十全十美" data-en="🔧 Hands-on | Mix the power yourself: nothing is perfect"></div>` +
      `<div class="lab-task" data-zh="按一個配方，或在長條上左右拖曳兩條分界線（也可按 ＋／−）自己調比例，看三個儀表和優點、代價怎麼變。" data-en="Pick a mix, or drag the two dividers on the bar left and right (or press + / −) to set the shares yourself, and watch how the three meters, upsides and costs change."></div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%" role="img"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult" aria-live="polite"></div>`;
    tab.appendChild(desk);
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('keydown', onKey);
    // 頁面切語言時 <html lang> 會變：自動跟著重畫（頁面另外呼叫 relang 也沒關係）
    if ('MutationObserver' in window) {
      mo = new MutationObserver(() => relang());
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    relang();
    return true;
  }
  function staticText() {
    if (!desk) return;
    const en = T('zh', 'en') === 'en';
    desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = el.getAttribute(en ? 'data-en' : 'data-zh'); });
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const mk = (key, label, aria) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = label;
      if (aria) b.setAttribute('aria-label', aria);
      b.addEventListener('click', () => act(key));
      return b;
    };
    const row1 = document.createElement('div'); row1.className = 'lab-row';
    const n1 = document.createElement('span'); n1.className = 'lab-name'; n1.textContent = T('配方', 'Mix'); row1.appendChild(n1);
    PRESET_ORDER.forEach(k => row1.appendChild(mk(k, T(PRESETS[k].zh, PRESETS[k].en))));
    row1.appendChild(mk('custom', T('自訂微調', 'Fine-tune')));
    ctrl.appendChild(row1);
    const row2 = document.createElement('div'); row2.className = 'lab-row';
    const n2 = document.createElement('span'); n2.className = 'lab-name'; n2.textContent = T('微調', 'Adjust'); row2.appendChild(n2);
    [['f', 0], ['n', 1], ['r', 2]].forEach(([p, i]) => {
      const g = document.createElement('div'); g.className = 'lab-grp';
      const nm = document.createElement('span'); nm.className = 'lab-name'; nm.style.minWidth = '0';
      nm.textContent = T(SRC[i].zh, SRC[i].en); nm.style.color = SRC[i].col;
      g.appendChild(mk(p + '-', '−', T(`${SRC[i].zh}減少 5%`, `${SRC[i].en} down 5%`)));
      g.appendChild(nm);
      g.appendChild(mk(p + '+', '＋', T(`${SRC[i].zh}增加 5%`, `${SRC[i].en} up 5%`)));
      row2.appendChild(g);
    });
    ctrl.appendChild(row2);
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act;
      const on = PRESETS[k] ? S.preset === k : k === 'custom' ? S.preset === 'custom' : false;
      b.classList.toggle('active', on);
      if (PRESETS[k] || k === 'custom') b.setAttribute('aria-pressed', String(on));
    });
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', T('電力配方實驗台：調整火力、核能、再生能源的比例，看碳排放、供電穩定和其他代價的高低。方向鍵左右移動分界線、上下換配方、空白鍵切換分界線。',
      'Power mix bench: set the shares of fossil, nuclear and renewable power and see how carbon, supply steadiness and other costs rise or fall. Left/right arrows move a divider, up/down change the mix, space switches divider.'));
  }
  function resultHTML() {
    const m = S.mix, M = model(m), pc = prosCons(m);
    const name = S.preset === 'custom' ? T('自訂', 'Custom') : T(PRESETS[S.preset].zh, PRESETS[S.preset].en);
    const share = SRC.map((s, i) => `${T(s.zh, s.en)} ${m[i]}%`).join(T('、', ', '));
    const lv = (l, goodLow) => { const cls = (goodLow ? l === 0 : l === 2) ? 'ok' : (goodLow ? l === 2 : l === 0) ? 'bad' : ''; return `<span class="${cls}">${lvWord(l)}</span>`; };
    const line1 = T(`<b>配方：${name}</b>（${share}）`, `<b>Mix: ${name}</b> (${share})`);
    const line2 = T(`碳排放 ${lv(lvGauge(M.carbon), true)}｜供電穩定 ${lv(lvGauge(M.stable), false)}｜空氣汙染 ${lv(lvCost(M.air), true)}、核廢料 ${lv(lvCost(M.waste), true)}、占地與生態 ${lv(lvCost(M.land), true)}`,
      `Carbon ${lv(lvGauge(M.carbon), true)} | Steadiness ${lv(lvGauge(M.stable), false)} | Air pollution ${lv(lvCost(M.air), true)}, nuclear waste ${lv(lvCost(M.waste), true)}, land &amp; ecosystems ${lv(lvCost(M.land), true)}`);
    const line3 = `<span class="ok">${T('優點：', 'Upsides: ')}</span>${pc.pros.join(T('、', '; '))}`;
    const line4 = `<span class="bad">${T('代價：', 'Costs: ')}</span>${pc.cons.join(T('、', '; '))}`;
    const line5 = `<span class="think">${T('想一想：', 'Think: ')}</span>` + T('火力供電穩定，但二氧化碳多、會造成酸雨與空氣汙染；核能供電穩定、碳排放幾乎為零，但用過的核燃料有放射性；再生能源可循環、碳排放幾乎為零，但供電不穩定、設備占地。<b>每一種組合都有優點，也有代價——沒有十全十美的能源</b>，發展任何能源都要審慎評估。',
      'Fossil power is steady but emits lots of CO₂ and causes acid rain and air pollution; nuclear is steady with almost zero carbon, but used fuel is radioactive; renewables can be reused with almost zero carbon, but are unsteady and take up land. <b>Every mix has upsides and costs: no energy source is perfect</b>, so any choice must be weighed carefully.');
    const note = `<span class="muted">${T('（儀表只表示高低，是教學示意，不是實際數據。）', '(The meters only show high or low; they are a teaching model, not real data.)')}</span>`;
    return [line1, line2, line3, line4, line5, note].join('<br>');
  }

  // ───────── 介面契約 ─────────
  const onVis = () => sync();
  function activate() {
    if (!desk && !injectDOM()) return;
    if (S.on) deactivate();
    S.on = true; S.visible = true;
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    updateUI(); render(); sync();
  }
  function deactivate() {
    S.on = false; S.drag = null;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    if (!desk) return;
    staticText(); buildControls(); updateUI(); render();
  }
  function _state() {
    const M = model(S.mix);
    return {
      preset: S.preset, mix: { fossil: S.mix[0], nuclear: S.mix[1], renew: S.mix[2] },
      shown: S.shown.map(v => +v.toFixed(2)),
      levels: { carbon: lvGauge(M.carbon), stable: lvGauge(M.stable), air: lvCost(M.air), waste: lvCost(M.waste), land: lvCost(M.land) },
      pros: prosCons(S.mix).pros, cons: prosCons(S.mix).cons,
      sel: S.sel, dragging: !!S.drag, note: S.note,
      running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2),
      boxes: S.boxes.map(b => ({ ...b }))
    };
  }

  W5Lab[KEY] = { activate, deactivate, relang, _state };

  if (!injectDOM()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectDOM, { once: true });
  }
})();
