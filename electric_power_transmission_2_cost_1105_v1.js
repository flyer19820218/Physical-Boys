/* electric_power_transmission_2_cost_1105_v1.js — 「一度電與電費」分頁動畫（#costAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.cost = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'cost'。畫布不綁任何事件；唯一控制是 #steps-cost 裡的 5 個步驟鈕；結果框 #costAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。第 1～4 步三欄：左＝電器（x 180）、中＝時鐘＋計時條（x 500；第 4 步換成電費單）、
 *   右＝瓦時計（電表，x 820，視窗內度數會累積）。欄名 y≈96、數值 y≈132。
 *   電線從瓦時計往下、沿 y=335 走到電器：藍色能量方塊（教學符號）沿線流進電器、在電器上被轉換（淡出）。
 *   方塊間距和功率成反比：2000 W 的方塊比 1000 W 密一倍。
 *   下方 y 405～500：本步計算；最下方 y≈562 圖例。
 *   第 5 步改成上下兩列（各自一台電器＋計時條＋瓦時計）：2000 W × 1 h 與 100 W × 20 h 同時到 2 度。
 *     100 W 那列的方塊稀 20 倍、但時間快轉 20 倍（跑得快 20 倍），所以每一秒流進的能量方塊一樣多。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 一度電   8 s  1000 W 電器開 1 h：時鐘分針轉一圈、計時條 0→1 h、瓦時計 0→1.00 度；1 度 = 1 kWh = 1000 W × 1 h
 *   2 換成焦耳 9 s  先以真實秒數播 4 s（每秒 1 格＝1000 J，+1000 J 閃字）；再快轉到 3600 s：E 累積到 3,600,000 J
 *   3 度數累積 9 s  冷氣機 2000 W = 2 kW 開 40 h：瓦時計 0→80.0 度；2 kW × 40 h = 80 度
 *   4 算電費   8 s  80 度排成 8 格（1 格 = 10 度），逐格 +40 元；電費單累積到 320 元（EN：NTD 320）
 *   5 功率與時間 9 s 冷氣機 2000 W × 1 h、燈泡 100 W × 20 h：兩個瓦時計同時到 2.0 度
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–30px，Noto Sans TC 900；寫字前一律 measureText（runs 放不下才微縮，最小 22）。
 * 顏色：能量＝電子藍方塊 #4dd2ff＋亮外框；度數／金額用白與黃重點字；冷氣出風用青色。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', dim: '#5f7a70', wire: '#7f978d',
    energy: '#4dd2ff', panel: '#123329', panel2: '#173f34', screen: '#081612'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const font = s => `900 ${s}px ${FONT}`;
  const isZh = () => tr('zh', 'en') === 'zh';
  const comma = n => Math.round(n).toLocaleString('en-US');

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(ctx, s, x, y, color, size, align, alpha, maxW) {
    if (alpha !== undefined && alpha <= 0.01) return;
    if (maxW) { while (size > 22 && textW(ctx, s, size) > maxW) size--; }
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 多段文字：segs = [[字, 顏色, 字級]]；align 'center' 以 x 為中心，'left' 從 x 起
  function runsW(ctx, segs) { return segs.reduce((a, g) => a + textW(ctx, g[0], g[2]), 0); }
  function runs(ctx, segs, x, y, align, alpha, maxW) {
    if (alpha !== undefined && alpha <= 0.01) return;
    let w = runsW(ctx, segs);
    if (maxW && w > maxW) {
      const k = maxW / w;
      segs = segs.map(g => [g[0], g[1], Math.max(22, Math.floor(g[2] * k))]);
      w = runsW(ctx, segs);
    }
    let cx = align === 'left' ? x : x - w / 2;
    segs.forEach(g => { text(ctx, g[0], cx, y, g[1], g[2], 'left', alpha); cx += textW(ctx, g[0], g[2]); });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // ───────── 符號 ─────────
  function square(ctx, x, y, alpha, scale) {
    if (alpha <= 0.01) return;
    const s = 13 * (scale || 1);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3 * Math.min(2, scale || 1)); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  // 折線路徑：長度與取點
  function pathLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function pathAt(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], l = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= l || i === P.length - 1) { const k = l ? clamp(s / l, 0, 1) : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
      s -= l;
    }
    return P[P.length - 1];
  }
  function wire(ctx, P) {
    ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  // 能量方塊沿路徑（起點＝瓦時計、終點＝電器）流動；方塊在 tau = 整數 × sp/v 時抵達終點；到終點淡出＝在電器被轉換
  function flow(ctx, P, sp, v, tau, alpha) {
    if (alpha <= 0.01) return;
    const L = pathLen(P);
    const off = (((L + v * tau) % sp) + sp) % sp;
    for (let s = off; s <= L; s += sp) {
      const f = clamp(Math.min(s / 18, (L - s) / 22), 0, 1);
      const p = pathAt(P, s); square(ctx, p.x, p.y, alpha * f, 1);
    }
  }

  // 一般電器（1000 W）：方盒＋電源符號
  function drawAppliance(ctx, cx, cy, on) {
    ctx.save();
    if (on > 0.01) { ctx.shadowColor = 'rgba(253,224,71,0.6)'; ctx.shadowBlur = 22 * on; }
    ctx.fillStyle = K.panel2; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx - 75, cy - 55, 150, 110, 14); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    // 散熱格
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - 52, cy + 14 + k * 9); ctx.lineTo(cx + 52, cy + 14 + k * 9); ctx.stroke(); }
    // 電源符號（亮＝開）
    const col = on > 0.5 ? K.yellow : K.muted;
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy - 18, 17, -Math.PI / 2 + 0.7, -Math.PI / 2 - 0.7 + TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy - 20); ctx.stroke();
    ctx.restore();
  }
  // 冷氣機（壁掛）：w×h 機身、百葉、出風（青）
  function drawAC(ctx, cx, cy, w, h, on, t) {
    ctx.save();
    if (on > 0.01) { ctx.shadowColor = 'rgba(85,233,255,0.55)'; ctx.shadowBlur = 20 * on; }
    ctx.fillStyle = '#e8e2cf'; ctx.strokeStyle = K.white; ctx.lineWidth = 2;
    rrect(ctx, cx - w / 2, cy - h / 2, w, h, 12); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#2b4a40'; rrect(ctx, cx - w / 2 + 12, cy + h / 2 - 16, w - 24, 9, 4); ctx.fill();
    ctx.fillStyle = on > 0.5 ? K.green : '#6b7f77'; ctx.beginPath(); ctx.arc(cx + w / 2 - 18, cy - h / 2 + 14, 4.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(43,74,64,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - w / 2 + 14, cy - 4); ctx.lineTo(cx + w / 2 - 14, cy - 4); ctx.stroke();
    if (on > 0.01) {
      ctx.strokeStyle = K.cyan; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const u = ((t * 0.9 + k * 0.25) % 1 + 1) % 1, x = cx - w / 2 + 30 + k * (w - 60) / 3;
        ctx.globalAlpha = on * (1 - u) * 0.9;
        ctx.beginPath();
        for (let s = 0; s <= 10; s++) { const yy = cy + h / 2 + 4 + u * 26 + s * 2; const xx = x + 4 * Math.sin(s / 10 * TAU + t * 4); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // 燈泡（100 W）
  function drawBulb(ctx, cx, cy, on) {
    ctx.save();
    if (on > 0.01) {
      const g = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy - 6, 50);
      g.addColorStop(0, `rgba(253,224,71,${0.55 * on})`); g.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy - 6, 50, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = on > 0.5 ? '#fff3b0' : 'rgba(242,236,217,0.18)'; ctx.strokeStyle = K.white; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy - 8, 20, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(cx + 9, cy + 16); ctx.lineTo(cx - 9, cy + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fb3aa'; rrect(ctx, cx - 10, cy + 16, 20, 12, 3); ctx.fill();
    ctx.restore();
  }
  // 瓦時計（電表）：外殼、數字視窗、轉盤
  function drawMeter(ctx, cx, cy, w, h, reading, disk, on, big) {
    ctx.save();
    ctx.fillStyle = K.panel2; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx - w / 2, cy - h / 2, w, h, 14); ctx.fill(); ctx.stroke();
    const wy = big ? cy - h / 2 + 14 : cy - h / 2 + 8, wh = big ? 50 : h - 16;
    ctx.fillStyle = K.screen; ctx.strokeStyle = 'rgba(159,179,170,0.7)'; ctx.lineWidth = 2;
    rrect(ctx, cx - w / 2 + 14, wy, w - 28, wh, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
    text(ctx, reading, cx, wy + wh / 2 + 1, K.white, big ? 30 : 26, 'center', 1, w - 40);
    if (big) {
      const dy = cy + h / 2 - 28;
      ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.8)'; ctx.lineWidth = 2; ctx.fillStyle = '#26473d';
      ctx.beginPath(); ctx.ellipse(cx, dy, 58, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
      const c = Math.cos(disk), x = cx + 56 * Math.sin(disk);
      if (c > 0) { ctx.fillStyle = on > 0.5 ? K.orange : '#7a5a40'; ctx.fillRect(x - 4, dy - 6, 8, 12); }
      ctx.restore();
    }
  }
  // 時鐘：分針 mA、時針 hA、秒針 sA（各自透明度）
  function drawClock(ctx, cx, cy, r, mA, hA, sA, mAl, sAl) {
    ctx.save();
    ctx.fillStyle = K.panel2; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU, r0 = k % 3 ? r - 9 : r - 14;
      ctx.beginPath(); ctx.moveTo(cx + r0 * Math.sin(a), cy - r0 * Math.cos(a)); ctx.lineTo(cx + (r - 4) * Math.sin(a), cy - (r - 4) * Math.cos(a)); ctx.stroke();
    }
    const hand = (a, len, wd, col, al) => {
      if (al <= 0.01) return;
      ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = wd;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + len * Math.sin(a), cy - len * Math.cos(a)); ctx.stroke(); ctx.globalAlpha = 1;
    };
    hand(hA, r * 0.5, 6, K.white, 1);
    hand(mA, r * 0.78, 4, K.yellow, mAl);
    hand(sA, r * 0.85, 2, K.orange, sAl);
    ctx.fillStyle = K.white; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 計時條
  function drawBar(ctx, x0, x1, y, frac, endLabel) {
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.12)'; rrect(ctx, x0, y - 7, x1 - x0, 14, 7); ctx.fill();
    ctx.fillStyle = K.yellow; rrect(ctx, x0, y - 7, Math.max(6, (x1 - x0) * clamp(frac, 0, 1)), 14, 7); ctx.fill();
    ctx.restore();
    text(ctx, '0', x0 - 12, y, K.muted, 22, 'right');
    text(ctx, endLabel, x1 + 12, y, K.muted, 22, 'left');
  }

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['一度電', '1 kWh'],
      cap: ['1 度電＝1000 W 的電器用 1 小時', '1 kWh = a 1000 W appliance used for 1 hour'],
      res: ['一度電是能量，不是功率：1 度 = 1 kWh = 1000 W × 1 h。', 'One "degree" is energy, not power: 1 kWh = 1000 W × 1 h.'] },
    { dur: 9, b: ['換成焦耳', 'In joules'],
      cap: ['1 度電換成焦耳是多少？', 'How many joules is 1 kWh?'],
      res: ['1 度 = 1000 × 60 × 60 J = 3.6 × 10⁶ J。', '1 kWh = 1000 × 60 × 60 J = 3.6 × 10⁶ J.'] },
    { dur: 9, b: ['度數累積', 'Adding up'],
      cap: ['冷氣機 2 kW 開 40 小時，用電 80 度', '2 kW air conditioner for 40 h: 80 kWh'],
      res: ['度數 = 功率（kW）× 時間（h）：2 kW × 40 h = 80 度。', 'kWh = power (kW) × time (h): 2 kW × 40 h = 80 kWh.'] },
    { dur: 8, b: ['算電費', 'The bill'],
      cap: ['每度 4 元，80 度要付 320 元', 'NTD 4 per kWh: 80 kWh costs NTD 320'],
      res: ['電費 = 度數 × 每度電價：80 × 4 = 320 元。', 'Bill = kWh × price per kWh: 80 × 4 = NTD 320.'] },
    { dur: 9, b: ['功率與時間', 'P and t'],
      cap: ['功率小、用得久，也能用掉 2 度', 'Low power for a long time: also 2 kWh'],
      res: ['用電度數要看「功率 × 時間」：功率小，但用得久，也可能用掉同樣多的電能。', 'kWh depends on power × time: a small power used for a long time can use just as much energy.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // 版面常數（第 1～4 步）
  const COL = [180, 500, 820], YN = 96, YV = 132, WY = 335, V = 90;
  const M = { x: 820, y: 228, w: 190, h: 124 };
  const unitKWh = () => tr('度', 'kWh');

  function header(ctx, x, name, val, valCol) {
    text(ctx, name, x, YN, K.white, 24, 'center', 1, 300);
    if (val) text(ctx, val, x, YV, valCol || K.yellow, 26, 'center', 1, 300);
  }
  function mainPath(port, bottom) { return [{ x: M.x, y: M.y + M.h / 2 }, { x: M.x, y: WY }, { x: port, y: WY }, { x: port, y: bottom }]; }
  const at = (tl, t0) => ease((tl - t0) / 0.6);
  const Wt = (s, z) => [s, K.white, z || 26], Yl = (s, z) => [s, K.yellow, z || 26];
  const LY = [405, 450, 495];

  // 第 1 步：1000 W × 1 h
  function step1(ctx, tl, t) {
    const on = ramp(tl, 1.0, 1.4) * (1 - ramp(tl, 5.4, 5.8));
    const h = ramp(tl, 1.4, 5.4);
    header(ctx, COL[0], tr('電器', 'Appliance'), 'P = 1000 W');
    header(ctx, COL[1], tr('時間', 'Time'), `t = ${h.toFixed(2)} h`);
    header(ctx, COL[2], tr('瓦時計（電表）', 'Watt-hour meter'));
    const P = mainPath(COL[0], 280); wire(ctx, P); flow(ctx, P, 90, V, tl, on);
    drawAppliance(ctx, COL[0], 225, on);
    drawClock(ctx, COL[1], 222, 56, h * TAU, h * TAU / 12, 0, 1, 0);
    drawBar(ctx, 400, 600, 304, h, '1 h');
    drawMeter(ctx, M.x, M.y, M.w, M.h, `${h.toFixed(2)} ${unitKWh()}`, h * 14, on, true);
    runs(ctx, [Yl(tr('1 度', '1 "degree"'), 30), Wt(' = 1 kWh', 30)], W / 2, LY[0], 'center', at(tl, 0.8));
    runs(ctx, [Wt('= 1000 W × 1 h', 30)], W / 2, LY[1], 'center', at(tl, 5.6));
    runs(ctx, [Wt(tr('度是', 'kWh is a unit of ')), Yl(tr('能量', 'energy')), Wt(tr('的單位，不是功率', ', not power'))], W / 2, LY[2], 'center', at(tl, 6.4), 940);
  }
  // 第 2 步：換成焦耳（真實秒數 4 s → 快轉到 3600 s）
  function step2(ctx, tl, t) {
    const on = ramp(tl, 0.2, 0.6) * (1 - ramp(tl, 7.2, 7.6));
    let sec;
    if (tl < 4.4) sec = clamp(Math.floor(tl), 0, 4);
    else { const k = ramp(tl, 4.4, 7.2); sec = Math.round(4 + 3596 * k * k * k); }
    header(ctx, COL[0], tr('電器', 'Appliance'), 'P = 1000 W');
    header(ctx, COL[1], tr('時間', 'Time'), `t = ${sec} s`);
    header(ctx, COL[2], tr('瓦時計（電表）', 'Watt-hour meter'), `E = ${comma(sec * 1000)} J`, K.white);
    const P = mainPath(COL[0], 280); wire(ctx, P); flow(ctx, P, 90, V, tl, on);
    drawAppliance(ctx, COL[0], 225, on);
    drawClock(ctx, COL[1], 222, 56, sec / 3600 * TAU, sec / 43200 * TAU, sec / 60 * TAU, 1, 1 - ramp(tl, 4.4, 4.9));
    drawBar(ctx, 400, 600, 304, sec / 3600, '3600 s');
    drawMeter(ctx, M.x, M.y, M.w, M.h, `${(sec / 3600).toFixed(2)} ${unitKWh()}`, tl * 5, on, true);
    // 每秒抵達 1 格 = 1000 J（只在真實秒數那段）
    for (let n = 1; n <= 4; n++) {
      const u = (tl - n) / 0.8;
      if (u >= 0 && u < 1) text(ctx, '+1000 J', 270, 205 - 16 * u, K.yellow, 24, 'left', 1 - u);
    }
    runs(ctx, [Wt('1 W = 1 J/s'), Wt(tr('：1000 W 每秒送出 ', ': 1000 W delivers ')), Yl('1000 J'), Wt(tr('', ' every second'))], W / 2, LY[0], 'center', at(tl, 0.8), 940);
    runs(ctx, [Wt('1 h = 60 × 60 s = '), Yl('3600 s')], W / 2, LY[1], 'center', at(tl, 4.4), 940);
    runs(ctx, [Wt(tr('1 度 = 1000 × 60 × 60 J = ', '1 kWh = 1000 × 60 × 60 J = '), 28), Yl('3.6 × 10⁶ J', 30)], W / 2, LY[2], 'center', at(tl, 7.2), 940);
  }
  // 第 3 步：冷氣機 2 kW × 40 h
  const AC = { x: 180, y: 205, w: 250, h: 76, port: 290 };
  function step3(ctx, tl, t) {
    const on = ramp(tl, 0.8, 1.2) * (1 - ramp(tl, 7.0, 7.4));
    const hrs = 40 * ramp(tl, 1.2, 7.0);
    header(ctx, COL[0], tr('冷氣機', 'Air conditioner'), 'P = 2000 W = 2 kW');
    header(ctx, COL[1], tr('時間', 'Time'), `t = ${Math.floor(hrs)} h`);
    header(ctx, COL[2], tr('瓦時計（電表）', 'Watt-hour meter'));
    const P = mainPath(AC.port, AC.y + AC.h / 2); wire(ctx, P); flow(ctx, P, 45, V, tl, on);
    drawAC(ctx, AC.x, AC.y, AC.w, AC.h, on, t);
    drawClock(ctx, COL[1], 222, 56, 0, hrs / 12 * TAU, 0, 1 - on, 0);
    drawBar(ctx, 400, 600, 304, hrs / 40, '40 h');
    drawMeter(ctx, M.x, M.y, M.w, M.h, `${(2 * hrs).toFixed(1)} ${unitKWh()}`, tl * 9, on, true);
    runs(ctx, [Wt(tr('度數 = 功率（kW）× 時間（h）', 'kWh = power (kW) × time (h)'))], W / 2, LY[0], 'center', at(tl, 0.4), 940);
    runs(ctx, [Wt('2000 W = '), Yl('2 kW')], W / 2, LY[1], 'center', at(tl, 1.4));
    runs(ctx, [Wt('2 kW × 40 h = ', 30), Yl(tr('80 度', '80 kWh'), 30)], W / 2, LY[2], 'center', at(tl, 7.1));
  }
  // 第 4 步：電費
  function step4(ctx, tl, t) {
    const NB = 8, bt = k => 1.2 + k * 0.6;                 // 第 k 格計費的時刻
    let billed = 0; for (let k = 0; k < NB; k++) if (tl >= bt(k)) billed = k + 1;
    const money = billed * 40;
    const yuan = n => tr(`${n} 元`, `NTD ${n}`);
    header(ctx, COL[0], tr('冷氣機', 'Air conditioner'), 'P = 2 kW');
    header(ctx, COL[1], tr('電費單', 'Electricity bill'));
    header(ctx, COL[2], tr('瓦時計（電表）', 'Watt-hour meter'));
    wire(ctx, mainPath(AC.port, AC.y + AC.h / 2));
    drawAC(ctx, AC.x, AC.y, AC.w, AC.h, 0, t);
    drawMeter(ctx, M.x, M.y, M.w, M.h, `80.0 ${unitKWh()}`, 0, 0, true);
    // 電費單
    ctx.save(); ctx.fillStyle = K.panel2; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, 405, 160, 190, 136, 12); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(420, 216); ctx.lineTo(580, 216); ctx.stroke(); ctx.restore();
    text(ctx, tr('每度 4 元', 'NTD 4 / kWh'), 500, 190, K.white, 24, 'center', 1, 170);
    text(ctx, tr('應付', 'Total'), 500, 240, K.muted, 22);
    const pop = billed ? 1 + 0.15 * (1 - ramp(tl, bt(billed - 1), bt(billed - 1) + 0.3)) : 1;
    text(ctx, yuan(money), 500, 273, K.yellow, Math.round(30 * pop), 'center', 1, 170);
    // 80 度 → 8 格（1 格 = 10 度），逐格 +40 元
    for (let k = 0; k < NB; k++) {
      const x = 500 + (k - 3.5) * 104, y = 405;
      const a = ease((tl - 0.4 - k * 0.05) / 0.5);
      square(ctx, x, y, a, 2.6);
      if (tl >= bt(k)) {
        const u = ramp(tl, bt(k), bt(k) + 0.4);
        ctx.save(); ctx.globalAlpha = 1 - u * 0.6; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3;
        rrect(ctx, x - 24, y - 24, 48, 48, 9); ctx.stroke(); ctx.restore();
        text(ctx, tr('+40 元', '+NTD 40'), x, 452, K.yellow, 22, 'center', u, 100);
      }
    }
    runs(ctx, [Wt(tr('80 度 × 4 元 = ', '80 kWh × NTD 4 = '), 30), Yl(yuan(320), 30)], W / 2, 500, 'center', at(tl, 6.3), 940);
  }
  // 第 5 步：兩列對照
  const ROWS = [
    { cy: 180, name: ['冷氣機 2000 W', 'Air conditioner 2000 W'], hrs: 1, sp: 24, v: 40, kind: 'ac' },
    { cy: 335, name: ['燈泡 100 W', 'Light bulb 100 W'], hrs: 20, sp: 480, v: 800, kind: 'bulb' }
  ];
  function step5(ctx, tl, t) {
    const on = ramp(tl, 0.8, 1.2) * (1 - ramp(tl, 7.0, 7.4));
    const k = ramp(tl, 1.2, 7.0);
    ROWS.forEach(R => {
      const cy = R.cy, h = R.hrs * k;
      text(ctx, tr(R.name[0], R.name[1]), 165, cy - 62, K.white, 24, 'center', 1, 300);
      text(ctx, `t = ${R.hrs === 1 ? h.toFixed(2) : h.toFixed(1)} h`, 480, cy - 62, K.yellow, 24, 'center', 1, 220);
      const port = R.kind === 'ac' ? 225 : 165, bottom = R.kind === 'ac' ? cy + 13 : cy + 28;
      const P = [{ x: 820, y: cy + 20 }, { x: 820, y: cy + 45 }, { x: port, y: cy + 45 }, { x: port, y: bottom }];
      wire(ctx, P); flow(ctx, P, R.sp, R.v, tl, on);
      if (R.kind === 'ac') drawAC(ctx, 165, cy - 10, 170, 46, on, t); else drawBulb(ctx, 165, cy - 12, on);
      drawBar(ctx, 370, 590, cy - 8, k, `${R.hrs} h`);
      drawMeter(ctx, 820, cy - 8, 180, 56, `${(2 * k).toFixed(1)} ${unitKWh()}`, 0, on, false);
    });
    runs(ctx, [Wt('2000 W × 1 h = 2 kW × 1 h = '), Yl(tr('2 度', '2 kWh'))], W / 2, 428, 'center', at(tl, 7.1), 940);
    runs(ctx, [Wt('100 W × 20 h = 0.1 kW × 20 h = '), Yl(tr('2 度', '2 kWh'))], W / 2, 470, 'center', at(tl, 7.5), 940);
    runs(ctx, [Wt(tr('度數 = ', 'kWh = ')), Yl(tr('功率 × 時間', 'power × time'))], W / 2, 512, 'center', at(tl, 8.0), 940);
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = [[tr('藍方塊＝能量（教學符號）', 'Blue square = energy (symbol)'), 's']];
    if (i === 3) items.push([tr('大方塊 1 格 = 10 度', 'Big square = 10 kWh'), 'S']);
    else items.push([tr('瓦時計：累計用了多少電能', 'Meter: adds up the energy used'), '']);
    const z = 22, gapItem = 40;
    const wid = items.map(([s, k]) => (k ? 30 : 0) + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 562;
    items.forEach(([s, kind], k) => {
      if (kind === 's') square(ctx, x + 10, y, 1, 1);
      if (kind === 'S') square(ctx, x + 10, y, 1, 1.5);
      text(ctx, s, x + (kind ? 30 : 0), y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }
  function drawCaption(ctx, cap) { text(ctx, cap, W / 2, 58, K.yellow, 26, 'center', 1, 940); }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  const SCENES = [step1, step2, step3, step4, step5];
  function drawScene(ctx, i, tl, t) { SCENES[i](ctx, tl, t); drawLegend(ctx, i); }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('costAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('costAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-cost');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-cost'); if (!row) return;
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

  window.EpAnim.cost = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-cost'); if (row) row.innerHTML = '';
      const r = document.getElementById('costAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { cost: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'cost' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
