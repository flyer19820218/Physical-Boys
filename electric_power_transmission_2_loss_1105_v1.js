/* electric_power_transmission_2_loss_1105_v1.js — 「高壓為何省電」分頁動畫（#lossAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.loss = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'loss'。畫布不綁任何事件；唯一控制是 #steps-loss 裡的 5 個步驟鈕；結果框 #lossAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈56  本步一句說明（黃）；y≈100 已知條件 P = 1000 kW、R = 1 Ω。
 *   兩條輸電線（上 y=190：低壓 10 kV；下 y=330：高壓 100 kV），導線 x 200～600：
 *     藍色能量方塊（教學符號）在導線上方往右走，兩條線方塊一樣多＝每秒送的電能相同；
 *     電子藍球在導線裡來回振動（交流），數量 30：3＝電流 10：1；電流大的線畫粗，並泛橘紅光、冒熱紋。
 *   每條線右側面板（x 640～970）：V、I、損失（依步驟出現）。左側：線名＋電壓。
 *   下方區（y 405～525）：本步的計算或柱狀圖；最下方圖例。
 *
 * ── 步驟表，共 41 s ─────────────────────────────────────────────
 *   1 同樣 1000 kW  8 s  兩條線同樣的能量方塊流；P = 1000 kW = 1,000,000 W；R = 1 Ω
 *   2 電壓高電流小  8 s  I = P ÷ V：100 A 與 10 A；電子球 30：3 浮現
 *   3 線上損失      9 s  P損失 = I²R：10 kW 與 100 W；低壓線發熱泛紅
 *   4 差一百倍      8 s  電壓 ×10 → 電流 ÷10 → 損失 ÷100；兩根橫向柱狀圖 10 kW 與 0.1 kW
 *   5 損失比例      8 s  10 kW ÷ 1000 kW = 1%；100 W ÷ 1,000,000 W = 0.01%
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–30px，Noto Sans TC 900；寫字前一律 measureText。電壓／電流數字用黃色重點字，損失用橘色。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', dim: '#5f7a70', wire: '#9fb3aa',
    electron: '#4dd2ff', energy: '#4dd2ff', heat: '#ff5a3c', panel: '#123329'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const isZh = () => tr('zh', 'en') === 'zh';

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
  function text(ctx, s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 多段文字（不同顏色／下標）：segs = [[字, 顏色, 字級, 下移]]；align 'center' 以 x 為中心，'left' 從 x 起
  function runsW(ctx, segs) { return segs.reduce((a, g) => a + textW(ctx, g[0], g[2]), 0); }
  function runs(ctx, segs, x, y, align, alpha, maxW) {
    if (alpha !== undefined && alpha <= 0.01) return;
    let w = runsW(ctx, segs);
    if (maxW && w > maxW) {           // 放不下才微縮（最小 22）
      const k = maxW / w;
      segs = segs.map(g => [g[0], g[1], Math.max(22, Math.floor(g[2] * k)), g[3]]);
      w = runsW(ctx, segs);
    }
    let cx = align === 'left' ? x : x - w / 2;
    segs.forEach(g => { text(ctx, g[0], cx, y + (g[3] || 0), g[1], g[2], 'left', alpha); cx += textW(ctx, g[0], g[2]); });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // ───────── 符號 ─────────
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 6; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function square(ctx, x, y, alpha, scale) {
    if (alpha <= 0.01) return;
    const s = 13 * (scale || 1);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();   // 亮外框＝有能量
    ctx.restore();
  }
  const mix = (a, b, k) => {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',') + ')';
  };

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['同功率', 'Same P'],
      cap: ['兩條線都送 1000 kW，電阻都是 1 Ω', 'Both lines send 1000 kW through 1 Ω'],
      res: ['兩條線都要輸送 1000 kW，輸電線的總電阻都是 1 Ω。', 'Both lines deliver 1000 kW, and each has a total resistance of 1 Ω.'] },
    { dur: 8, b: ['電壓高電流小', 'High V, low I'],
      cap: ['電壓高 10 倍，電流只要十分之一', '10× the voltage needs only 1/10 the current'],
      res: ['輸送功率相同時，電壓越高，電流越小：10 kV 需要 100 A，100 kV 只要 10 A。', 'For the same power, higher voltage means less current: 100 A at 10 kV, only 10 A at 100 kV.'] },
    { dur: 9, b: ['線上損失', 'Line loss'],
      cap: ['電流大的線，發熱損失大', 'More current, more energy lost as heat'],
      res: ['電流通過有電阻的輸電線會損失電能，損失功率 P<sub>損失</sub> = I²R。', 'Current through a resistive line wastes energy: P<sub>loss</sub> = I²R.'] },
    { dur: 8, b: ['差一百倍', '100× less'],
      cap: ['電壓 ×10，損失 ÷100', 'Voltage ×10, line loss ÷100'],
      res: ['電壓變成 10 倍，電流變成 1/10，線路損失變成 1/100。', 'Voltage ×10 → current ÷10 → line loss ÷100.'] },
    { dur: 8, b: ['損失比例', 'Loss share'],
      cap: ['高壓輸電：損失只剩 0.01%', 'High voltage: only 0.01% is lost'],
      res: ['所以長距離輸電要先升高電壓，才能把線路損失降到很小。', 'That is why the voltage is stepped up for long-distance transmission: to make line loss very small.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 兩條線 ─────────
  const X0 = 200, X1 = 600;
  const LINES = [
    { y: 190, kv: 10, name: ['低壓輸電', 'Low voltage'], nE: 30, heat: 1,
      I: '100 A', loss: ['10 kW', '10 kW', '10 kW（1%）', '10 kW (1%)'] },
    { y: 330, kv: 100, name: ['高壓輸電', 'High voltage'], nE: 3, heat: 0.06,
      I: '10 A', loss: ['100 W', '0.1 kW', '100 W（0.01%）', '100 W (0.01%)'] }
  ];
  // 依步驟算出各元素的顯示程度（純函式）
  function vis(i, tl) {
    const at = (k, t0) => i > k ? 1 : i < k ? 0 : ease((tl - t0) / 0.8);
    return { elec: at(1, 1.0), thick: at(1, 2.0), I: at(1, 3.0), heat: at(2, 1.0), loss: at(2, 3.2) };
  }

  function drawLine(ctx, L, i, tl, t, v) {
    const y = L.y;
    const thick = 6 + (L.nE > 5 ? 8 : 0) * v.thick;
    const h = v.heat * L.heat * (0.85 + 0.15 * Math.sin(t * 5 + y));
    // 左：線名＋電壓
    const nm = tr(L.name[0], L.name[1]);
    text(ctx, textW(ctx, nm, 22) <= 160 ? nm : (L.kv === 10 ? 'Low V' : 'High V'), 105, y - 18, K.white, 22);
    text(ctx, `${L.kv} kV`, 105, y + 16, K.yellow, 26);
    // 導線（發熱：橘紅光）
    ctx.save(); ctx.lineCap = 'round';
    if (h > 0.02) {
      ctx.shadowColor = `rgba(255,90,60,${clamp(h, 0, 1)})`; ctx.shadowBlur = 26 * h;
      ctx.strokeStyle = `rgba(255,90,60,${0.55 * h})`; ctx.lineWidth = thick + 14 * h;
      ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = mix('#5f7a70', '#ff7a4d', clamp(h, 0, 1)); ctx.lineWidth = thick;
    ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
    ctx.restore();
    // 端點
    ctx.save(); ctx.fillStyle = '#163a31'; ctx.strokeStyle = K.muted; ctx.lineWidth = 2.5;
    [X0, X1].forEach(x => { rrect(ctx, x - 9, y - 16, 18, 32, 4); ctx.fill(); ctx.stroke(); });
    ctx.restore();
    // 熱紋
    if (h > 0.05) {
      for (let k = 0; k < 8; k++) {
        const u = ((t * 0.55 + k * 0.37) % 1 + 1) % 1, x = 228 + k * 49, y0 = y - 30 - 34 * u;
        ctx.save(); ctx.globalAlpha = h * (1 - u) * 0.9; ctx.strokeStyle = K.heat; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let s = 0; s <= 16; s++) { const yy = y0 - s; const xx = x + 4 * Math.sin(s / 16 * TAU + t * 3); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke(); ctx.restore();
      }
    }
    // 電子（交流：在導線裡來回振動；數量＝電流大小）
    if (v.elec > 0.01) {
      const sp = (X1 - X0 - 30) / L.nE;
      for (let k = 0; k < L.nE; k++) {
        const x = X0 + 15 + sp * (k + 0.5) + 5 * Math.sin(TAU * 0.8 * t);
        ball(ctx, x, y, 4.5, v.elec);
      }
    }
    // 能量方塊（兩條線一樣多、一樣快＝每秒送的電能相同）
    const SP = 50, V = 50, n = Math.round((X1 - X0) / SP);
    for (let k = 0; k < n; k++) {
      const x = X0 + ((V * t + k * SP) % (n * SP) + n * SP) % (n * SP);
      const fade = clamp(Math.min(x - X0 - 12, X1 - 12 - x) / 14, 0, 1);
      square(ctx, x, y - 22, fade, 1);
    }
    // R 標示
    text(ctx, 'R = 1 Ω', (X0 + X1) / 2, y + 36, K.muted, 22);
    // 右側面板
    ctx.save(); ctx.fillStyle = K.panel; ctx.strokeStyle = 'rgba(159,179,170,0.45)'; ctx.lineWidth = 2;
    rrect(ctx, 640, y - 58, 330, 116, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const lab = (s, val, yy, a, col) => runs(ctx, [[s, K.white, 24, 0], [val, col || K.yellow, 24, 0]], 662, yy, 'left', a, 290);
    lab('V = ', `${L.kv} kV`, y - 34, 1);
    lab('I = ', L.I, y, v.I);
    const ls = i <= 2 ? L.loss[0] : i === 3 ? L.loss[1] : L.loss[isZh() ? 2 : 3];
    lab(tr('損失 ', 'Loss '), ls, y + 34, v.loss, K.orange);
  }

  // ───────── 下方區：本步計算 ─────────
  const BY = [430, 468, 506];
  const pl = (sz) => [['P', K.white, sz, 0], [tr('損失', 'loss'), K.white, 22, 6]];
  function drawBottom(ctx, i, tl) {
    const a = k => ease((tl - 0.8 - k * 1.2) / 0.6);
    const Y = s => [s, K.yellow, 26, 0], Wt = s => [s, K.white, 26, 0], O = s => [s, K.orange, 26, 0];
    const lo = tr('低壓：', 'Low: '), hi = tr('高壓：', 'High: ');
    if (i === 0) {
      runs(ctx, [['P = ', K.white, 30, 0], ['1000 kW', K.yellow, 30, 0], [' = ', K.white, 30, 0], ['1,000,000 W', K.yellow, 30, 0]], W / 2, 445, 'center', a(0));
      runs(ctx, [Wt(tr('輸電線總電阻 ', 'Total line resistance ')), ['R = ', K.white, 26, 0], Y('1 Ω')], W / 2, 495, 'center', a(1));
    } else if (i === 1) {
      runs(ctx, [Wt('I = P ÷ V'), Wt(tr('　電子球 ', '   electrons ')), Y('10 : 1')], W / 2, BY[0], 'center', a(0));
      runs(ctx, [Wt(lo + '1,000,000 W ÷ 10,000 V = '), Y('100 A')], W / 2, BY[1], 'center', a(1), 940);
      runs(ctx, [Wt(hi + '1,000,000 W ÷ 100,000 V = '), Y('10 A')], W / 2, BY[2], 'center', a(2), 940);
    } else if (i === 2) {
      runs(ctx, [...pl(26), Wt(' = I²R')], W / 2, BY[0], 'center', a(0));
      runs(ctx, [Wt(lo + '100² × 1 = 10,000 W = '), O('10 kW')], W / 2, BY[1], 'center', a(1), 940);
      runs(ctx, [Wt(hi + '10² × 1 = '), O('100 W')], W / 2, BY[2], 'center', a(2), 940);
    } else if (i === 3) {
      runs(ctx, [Wt(tr('電壓 ', 'Voltage ')), Y('×10'), Wt(tr(' → 電流 ', ' → current ')), Y('÷10'), Wt(tr(' → 損失 ', ' → loss ')), O('÷100')], W / 2, BY[0] - 6, 'center', a(0), 940);
      const g = ease((tl - 2.0) / 1.6), MAX = 560, bx = 230;
      [[LINES[0], 1, '10 kW'], [LINES[1], 0.01, tr('0.1 kW（100 W）', '0.1 kW (100 W)')]].forEach(([L, f, s], r) => {
        const y = BY[1] + 4 + r * 40;
        const al = ease((tl - 1.6) / 0.5);
        text(ctx, `${L.kv} kV`, bx - 16, y, K.yellow, 24, 'right', al);
        const w = Math.max(3, MAX * f * g);
        if (al > 0.01) {
          ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = 'rgba(242,236,217,0.08)'; rrect(ctx, bx, y - 13, MAX, 26, 6); ctx.fill();
          ctx.fillStyle = K.heat; ctx.shadowColor = K.heat; ctx.shadowBlur = 10; rrect(ctx, bx, y - 13, w, 26, 6); ctx.fill(); ctx.restore();
        }
        text(ctx, s, bx + (r === 0 ? MAX : w) + 14, y, K.orange, 24, 'left', ease((tl - 3.4) / 0.5));
      });
    } else {
      runs(ctx, [Wt(tr('損失比例 = ', 'Loss share = ')), ...pl(26), Wt(' ÷ P')], W / 2, BY[0], 'center', a(0));
      runs(ctx, [Wt(lo + '10 kW ÷ 1000 kW = '), O('1%')], W / 2, BY[1], 'center', a(1), 940);
      runs(ctx, [Wt(hi + '100 W ÷ 1,000,000 W = '), O('0.01%')], W / 2, BY[2], 'center', a(2), 940);
    }
  }

  // ───────── 已知條件、圖例、說明句、進度條 ─────────
  function drawHeader(ctx) {
    runs(ctx, [['P = ', K.white, 24, 0], ['1000 kW', K.yellow, 24, 0], ['　　R = ', K.white, 24, 0], ['1 Ω', K.yellow, 24, 0]], W / 2, 100, 'center', 1);
  }
  function drawLegend(ctx) {
    const items = [
      [tr('藍方塊＝能量（教學符號）', 'Blue square = energy (symbol)'), 's'],
      [tr('藍球＝電子（越多＝電流越大）', 'Blue ball = electron (more = larger current)'), 'b'],
      [tr('橘紅光＝導線發熱', 'Orange-red glow = wire heating'), 'h']
    ];
    const z = 22, gapIcon = 30, gapItem = 30, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [562] : [550, 580];
    rows.forEach((row, r) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 's') square(ctx, x + 10, y, 1, 1);
        else if (kind === 'b') ball(ctx, x + 10, y, 6, 1);
        else {
          ctx.save(); ctx.shadowColor = K.heat; ctx.shadowBlur = 10; ctx.strokeStyle = '#ff7a4d'; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 19, y); ctx.stroke(); ctx.restore();
        }
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    ls.slice(0, 1).forEach(l => text(ctx, l, W / 2, 58, K.yellow, 26));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl, t) {
    const v = vis(i, tl);
    drawHeader(ctx);
    LINES.forEach(L => drawLine(ctx, L, i, tl, t, v));
    drawBottom(ctx, i, tl);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('lossAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('lossAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-loss');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-loss'); if (!row) return;
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

  window.EpAnim.loss = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-loss'); if (row) row.innerHTML = '';
      const r = document.getElementById('lossAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { loss: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'loss' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
