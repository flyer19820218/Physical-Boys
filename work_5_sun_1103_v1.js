/* ==================================================================
   work_5 ｜ 核融合＝太陽的反應：從太陽誕生說起（cvs-sun，960×540）
   五步自動循環：1 星雲塌縮 → 2 越壓越熱 → 3 點火 → 4 氫變氦 → 5 穩定發光
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（比照 fission / plant）：質子＝橘 COL.proton、中子＝淺灰白 COL.neutron、
   能量＝黃 COL.energy、熱＝橘紅 HEAT。另加兩個本動畫專用色：
   重力＝淡紫 GRAV（不借用電子藍、彈力粉紅）、壓力（熱氣體向外推）＝橘紅 HEAT。
   星雲裡的氫＝淡灰白小點、氦＝淡杏色小點（是「原子／氣體」，不是質子，所以不用質子橘）。
   本動畫沒有電子、沒有電流；正電子只用文字提到，不畫成粒子。
   全片不把核融合說成「燃燒」。

   純函式作法：
   - 第 1、2 步的星雲粒子位置＝f(第 1 步開始後的秒數 T)，每顆粒子半徑按 r0·f_i(T) 縮小、
     角速度隨半徑變小而變快（角動量守恆的示意），兩步之間無縫接續；亂數一律 W5.hash。
   - 第 3 步的質子對用解析式算距離；第 5 步的光子走走停停路徑在載入時一次算好成常數表。

   教學簡化（畫面上有註明的以「」標）：
   - 星雲大小、原恆星大小都不按比例；塌縮實際花了數千萬年，畫面只用十幾秒。
   - 第 4 步把質子—質子鏈濃縮成：4 個質子 →（其中 2 個變成中子，放出正電子與微中子）→ 氦-4 ＋ γ 能量，
     畫面標「教學簡化：省略中間步驟」；質量差 0.7% 太小看不到，長條的差距「放大示意」。
   - 太陽剖面的層厚約依真實比例（核心約 0.25 R、輻射層到約 0.7 R）。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const PRO = COL.proton, NEU = COL.neutron, ENE = COL.energy, WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const HEAT = '#ff6a3d';            /* 熱：橘紅（同 fission / plant） */
  const GRAV = '#b9a6ff';            /* 重力：淡紫 */
  const H_GAS = '#d6dcef', HE_GAS = '#f5c9a0';   /* 星雲裡的氫、氦（氣體小點） */
  const EARTH = '#5ab8e8';
  const DUR = [7.5, 7.5, 8.5, 10, 8];            /* 總長 41.5 秒 */

  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), B = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const isZh = () => L('a', 'b') === 'a';

  /* ── 文字（同 fission / plant）：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  const NOHEAD = /^[，、。：；）」！？]/;
  function wrap(c, str, size, maxW) {
    if (str.indexOf('\n') >= 0) return str.split('\n');
    const toks = str.match(/[⺀-鿿　-〿＀-￯]|[^\s⺀-鿿　-〿＀-￯]+\s*|\s+/g) || [];
    const lines = []; let cur = '';
    for (const t of toks) {
      const test = cur + t;
      if (cur && W5.tw(c, test.trim(), size) > maxW && !NOHEAD.test(t)) { lines.push(cur.trim()); cur = t.trimStart(); }
      else cur = test;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  /* 底部字幕（同 plant）；結論用綠框 */
  function subtitle(c, a, str, border) {
    if (a <= 0.02) return;
    const size = 22, lh = 31, lines = wrap(c, str, size, 860);
    let w = 0; lines.forEach(l => { w = Math.max(w, W5.tw(c, l, size)); });
    w += 48; const h = lines.length * lh + 18, y0 = 490 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.84)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    lines.forEach((l, i) => W5.label(c, l, 480, y0 + 9 + lh * (i + 0.5), WHITE, size));
    c.restore();
  }
  function panelBox(c, a, x, y, w, h, col) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, x, y, w, h, 16); c.fill();
    c.lineWidth = 2; c.strokeStyle = W5.rgba(col, 0.55); c.stroke();
    c.restore();
  }
  /* 箭頭加深色描邊：壓在太陽的橘色上也看得見 */
  function arrowO(c, x1, y1, x2, y2, col, lw, head) {
    W5.arrow(c, x1, y1, x2, y2, 'rgba(11,26,21,0.85)', lw + 4, head + 4);
    W5.arrow(c, x1, y1, x2, y2, col, lw, head);
  }

  /* 小球（質子／中子）：比照 fission 的 nball；plus＝在球上寫「+」（20px，粒子內標籤） */
  function nball(c, x, y, r, col, plus) {
    W5.ball(c, x, y, r, col);
    c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    if (plus > 0.02) { c.save(); c.globalAlpha *= plus; W5.label(c, '+', x, y + 1, '#ffffff', 20, 'center', true); c.restore(); }
  }
  function legend(c, a, items) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    items.forEach((it, i) => {
      const y = 30 + i * 30;
      if (it.gas) { c.fillStyle = it.col; c.beginPath(); c.arc(28, y, it.r, 0, TAU); c.fill(); }
      else nball(c, 28, y, 9, it.col, 0);
      W5.label(c, it.txt, 44, y, it.col, 20, 'left');
    });
    c.restore();
  }
  function flash(c, x, y, dt, big) {
    if (dt < 0 || dt > 1.6) return;
    const R = big || 60;
    W5.glow(c, x, y, R * (1 + dt * 0.8), HEAT, 0.85 * Math.exp(-dt * 3));
    W5.glow(c, x, y, R * 0.45, ENE, 0.9 * Math.exp(-dt * 6));
  }

  /* 恆星顏色：暗紅 → 橘 → 黃白（h 0..1） */
  const HSTOP = [[0, '#5a1810'], [0.3, '#b8321a'], [0.55, '#ff7a26'], [0.8, '#ffc46a'], [1, '#fff1cf']];
  function heatCol(h) {
    h = clamp01(h);
    for (let i = 1; i < HSTOP.length; i++) if (h <= HSTOP[i][0]) return mixHex(HSTOP[i - 1][1], HSTOP[i][1], (h - HSTOP[i - 1][0]) / (HSTOP[i][0] - HSTOP[i - 1][0]));
    return HSTOP[HSTOP.length - 1][1];
  }
  /* 溫度數字：取 3 位有效數字、加千分位（不用 toLocaleString，避免各地格式不同） */
  function fmtT(v) {
    const e = Math.floor(Math.log10(v)), p = Math.pow(10, Math.max(0, e - 2));
    const n = String(Math.round(v / p) * p);
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' °C';
  }

  /* 恆星本體：h 顏色、ign 點火程度（0..1）、t 動畫時間 */
  function star(c, x, y, R, h, ign, t, a) {
    if (a <= 0.02 || R < 1) return;
    c.save(); c.globalAlpha *= a;
    const col = heatCol(h), pulse = 0.5 + 0.5 * Math.sin(t * 2.3);
    W5.glow(c, x, y, R * (1.7 + 0.15 * pulse), col, 0.28 + 0.1 * h);
    if (ign > 0.02) {
      W5.glow(c, x, y, R * (2.0 + 0.9 * ign), ENE, 0.42 * ign);
      /* 光芒：慢慢轉、長短起伏 */
      c.save(); c.lineCap = 'round';
      for (let j = 0; j < 16; j++) {
        const an = j / 16 * TAU + t * 0.12, len = R * (0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 3 + j * 1.7))) * ign;
        c.strokeStyle = W5.rgba(ENE, 0.55 * ign); c.lineWidth = 4;
        c.beginPath(); c.moveTo(x + Math.cos(an) * R * 1.08, y + Math.sin(an) * R * 1.08);
        c.lineTo(x + Math.cos(an) * (R * 1.08 + len), y + Math.sin(an) * (R * 1.08 + len)); c.stroke();
      }
      c.restore();
    }
    const g = c.createRadialGradient(x - R * 0.2, y - R * 0.2, R * 0.05, x, y, R);
    g.addColorStop(0, mixHex(col, '#ffffff', 0.45 + 0.4 * ign)); g.addColorStop(0.65, mixHex(col, '#fff1cf', 0.5 * ign));
    g.addColorStop(1, mixHex(col, '#5a1810', 0.35 * (1 - ign)));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    /* 表面翻滾的亮斑（一直在動） */
    c.save(); c.beginPath(); c.arc(x, y, R, 0, TAU); c.clip();
    for (let i = 0; i < 12; i++) {
      const an = hash(i * 3 + 900) * TAU + t * (0.25 + 0.2 * hash(i + 910)), rr = R * (0.35 + 0.55 * hash(i * 3 + 901));
      const sx = x + Math.cos(an) * rr, sy = y + Math.sin(an) * rr;
      W5.glow(c, sx, sy, R * (0.16 + 0.06 * Math.sin(t * 2 + i)), mixHex(col, '#ffffff', 0.5), 0.35);
    }
    c.restore();
    /* 點火後核心的融合閃光 */
    if (ign > 0.02) {
      const PER = 0.12, i0 = Math.floor(t / PER);
      for (let j = i0 - 5; j <= i0; j++) {
        const age = t - j * PER; if (age < 0 || age > 0.6) continue;
        const an = hash(j * 5 + 7) * TAU, rr = R * 0.28 * Math.sqrt(hash(j * 5 + 8)), kk = 1 - age / 0.6;
        W5.glow(c, x + Math.cos(an) * rr, y + Math.sin(an) * rr, 6 + 12 * kk, '#ffffff', 0.8 * kk * ign);
      }
    }
    c.restore();
  }

  /* ═════════════════ 第 1、2 步：星雲粒子 ═════════════════ */
  const CX0 = 450, CY0 = 262, NP = 320;
  const GAS = (function () {
    const out = [];
    for (let i = 0; i < NP; i++) {
      const r0 = 400 * Math.pow(0.12 + 0.88 * hash(i * 7 + 1), 0.8);
      out.push({ r0, a0: hash(i * 7 + 2) * TAU, he: hash(i * 5 + 3) < 0.09, sp: 0.88 + 0.24 * hash(i * 11 + 5), ph: hash(i * 13 + 6) * TAU });
    }
    return out;
  })();
  const gasF = (p, T) => Math.max(0.04, 1 - 0.96 * Math.pow(seg(T * p.sp, 0, 12), 1.5));
  const starR2 = T => 88 * ease(seg(T, 7.2, 12.5));
  const cloudF = T => Math.max(0.04, 1 - 0.96 * Math.pow(seg(T, 0, 12), 1.5));

  function drawGas(c, T, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const fm = cloudF(T), Rs = starR2(T);
    /* 星雲的霧：跟著縮小 */
    c.save(); c.translate(CX0, CY0); c.scale(1, lerp(1, 0.55, fm));
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 430 * fm + 20);
    g.addColorStop(0, 'rgba(150,130,190,0.20)'); g.addColorStop(0.6, 'rgba(120,110,170,0.10)'); g.addColorStop(1, 'rgba(120,110,170,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 430 * fm + 20, 0, TAU); c.fill(); c.restore();
    /* 中心開始變熱的微光（第 1 步尾端出現） */
    W5.glow(c, CX0, CY0, 40 + 60 * (1 - fm), '#b8321a', 0.5 * seg(T, 4.5, 8.5));
    GAS.forEach((p, i) => {
      const f = gasF(p, T), rr = p.r0 * f;
      if (rr < Rs * 0.95) return;
      const an = p.a0 + 0.2 * (1 / f - 1) + 0.04 * T, ys = lerp(1, 0.55, f);
      const x = CX0 + rr * Math.cos(an) + 1.5 * Math.sin(T * 2.1 + p.ph), y = CY0 + rr * Math.sin(an) * ys + 1.5 * Math.cos(T * 1.8 + p.ph);
      const near = Rs > 0 ? clamp01((rr - Rs) / 60) : 1;
      c.fillStyle = W5.rgba(p.he ? HE_GAS : H_GAS, (0.5 + 0.35 * hash(i + 77)) * (0.35 + 0.65 * near));
      c.beginPath(); c.arc(x, y, p.he ? 3.4 : 2.6, 0, TAU); c.fill();
    });
    c.restore();
  }
  /* 重力箭頭：指向中心，沿著箭頭方向一直往內滑（表示一直在拉） */
  function gravArrows(c, a, cx, cy, rx, ry, angs, t, len) {
    if (a <= 0.02) return;
    const ph = (t * 0.9) % 1;
    angs.forEach(dg => {
      const an = dg * Math.PI / 180, ux = Math.cos(an), uy = Math.sin(an);
      const sl = ph * 14, al = a * (ph < 0.8 ? 1 : (1 - ph) / 0.2) * 0.6 + a * 0.4;
      const x1 = cx + ux * rx - ux * sl, y1 = cy + uy * ry - uy * sl * (ry / rx);
      const x2 = x1 - ux * len, y2 = y1 - uy * len * (ry / rx);
      c.save(); c.globalAlpha *= al; arrowO(c, x1, y1, x2, y2, GRAV, 4, 14); c.restore();
    });
  }

  /* ═════════════════ 第 1 步 ═════════════════ */
  function step1(c, s) {
    const tt = s.u, k = s.k, fm = cloudF(tt);
    c.save(); c.globalAlpha = k;
    drawGas(c, tt, 1);
    const rx = 400 * fm + 26, ry = 400 * fm * lerp(1, 0.55, fm) + 26;
    gravArrows(c, seg(tt, 0.8, 1.5), CX0, CY0, rx, ry, [0, 35, 145, 180, 215, 325], tt, 48);
    c.restore();
    legend(c, k, [{ gas: 1, col: H_GAS, r: 3.5, txt: L('氫', 'hydrogen') }, { gas: 1, col: HE_GAS, r: 4.2, txt: L('氦', 'helium') }]);
    P(c, k, L('約 46 億年前：星雲塌縮', '4.6 billion years ago: a cloud collapses'), 480, 38, WHITE, 22);
    T(c, k, L('冷的氣體星雲（主要是氫和氦）', 'A cold gas cloud (mostly hydrogen and helium)'), 480, 92, WHITE, 20);
    /* 「重力」標在左邊箭頭旁，跟著星雲縮進來 */
    const gx = CX0 - rx - 24;
    T(c, seg(tt, 1.0, 1.6), L('重力', 'gravity'), Math.max(gx, 60), CY0 - 34, GRAV, 22);
    T(c, seg(tt, 2.0, 2.6), L('塌縮中慢慢轉了起來', 'It slowly starts to spin'), 480, 418, DIM, 20);
    subtitle(c, k * (1 - seg(tt, s.d - 3.2, s.d - 2.9)), L('一大團冷的氫、氦氣體，因為自身的重力向中心塌縮',
      'A huge cold cloud of hydrogen and helium collapses toward its center under its own gravity.'));
    subtitle(c, seg(tt, s.d - 2.9, s.d - 2.6), L('結論：重力把星雲往中心拉——太陽的故事從這裡開始',
      'Conclusion: gravity pulls the cloud inward. The Sun\'s story begins here.'), GOOD);
  }

  /* ═════════════════ 第 2 步：越壓越熱（原恆星） ═════════════════ */
  const TH = { x: 912, top: 128, bot: 410 };            /* 溫度計（對數刻度 10^3 … 10^7.4） */
  const thY = lg => lerp(TH.bot, TH.top, (lg - 3) / 4.4);
  const logT2 = u => lerp(3.5, 7.02, ease(seg(u, 0.4, 4.5)));
  const h2 = u => 0.05 + 0.73 * ease(seg(u, 0.2, 4.5));

  function thermometer(c, a, lg, col) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = '#0b1a15'; W5.rr(c, TH.x - 9, TH.top - 10, 18, TH.bot - TH.top + 20, 9); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2; c.stroke();
    const y = thY(lg);
    c.fillStyle = col; W5.rr(c, TH.x - 5, y, 10, TH.bot + 14 - y, 5); c.fill();
    c.beginPath(); c.arc(TH.x, TH.bot + 22, 15, 0, TAU); c.fillStyle = col; c.fill(); c.stroke();
    /* 刻度：每 10 倍一格 */
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5;
    for (let e = 3; e <= 7; e++) { const yy = thY(e); c.beginPath(); c.moveTo(TH.x - 16, yy); c.lineTo(TH.x - 10, yy); c.stroke(); }
    /* 1000 萬度門檻線 */
    const yt = thY(7);
    c.strokeStyle = ENE; c.lineWidth = 2.5; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(TH.x - 26, yt); c.lineTo(TH.x + 14, yt); c.stroke(); c.setLineDash([]);
    c.restore();
  }

  function step2(c, s) {
    const u = s.u, T2 = s.since(1), lg = logT2(u), hc = heatCol(h2(u));
    drawGas(c, T2, 1);
    const Rs = starR2(T2);
    /* 外圍的氣體繼續往星上掉（吸積），越靠近掉得越快 */
    const aa = seg(u, 0.3, 1.2);
    if (aa > 0.02) {
      c.save(); c.globalAlpha *= aa;
      for (let i = 0; i < 72; i++) {
        const per = 2.0 + 0.8 * hash(i + 1200), x = ((s.t / per) + hash(i + 1210)) % 1;
        const r = Rs + (290 - Rs) * (1 - Math.pow(x, 1.7)), an = hash(i + 1220) * TAU + 0.9 * x;
        c.fillStyle = W5.rgba(hash(i + 1230) < 0.1 ? HE_GAS : H_GAS, 0.75 * Math.min(1, x * 5) * (1 - Math.pow(x, 8)));
        c.beginPath(); c.arc(CX0 + Math.cos(an) * r, CY0 + Math.sin(an) * r, 3.2, 0, TAU); c.fill();
      }
      c.restore();
    }
    star(c, CX0, CY0, Rs, h2(u), 0, s.t, 1);
    /* 擠壓：星的外圈畫幾圈往內縮的淡紫線 */
    gravArrows(c, 1, CX0, CY0, Math.max(Rs, 30) + 78, Math.max(Rs, 30) + 78, [0, 50, 130, 180, 230, 310], s.t, 44);
    thermometer(c, s.k, lg, hc);
    legend(c, 1, [{ gas: 1, col: H_GAS, r: 3.5, txt: L('氫', 'hydrogen') }, { gas: 1, col: HE_GAS, r: 4.2, txt: L('氦', 'helium') }]);
    P(c, 1, L('越壓越熱：原恆星', 'Squeezed and heated: a protostar'), 480, 38, WHITE, 22);
    P(c, seg(u, 0.5, 0.9), L('重力位能 → 熱能', 'Gravitational energy → heat'), CX0, 96, HEAT, 22);
    T(c, 1, L('重力', 'gravity'), CX0 - Math.max(Rs, 30) - 108, CY0 - 30, GRAV, 22);
    /* 溫度讀數與門檻 */
    T(c, s.k, L('中心溫度', 'Core temperature'), 790, 300, DIM, 20);
    T(c, s.k, fmtT(Math.pow(10, lg)), 790, 334, hc, 26, 'center', true);
    T(c, s.k, L('1000 萬度', '10 million °C'), 880, thY(7) - 2, ENE, 20, 'right');
    T(c, s.k, L('核融合門檻', 'fusion threshold'), 880, thY(7) + 26, ENE, 20, 'right');
    T(c, seg(u, 1.6, 2.1), L('原恆星', 'protostar'), CX0, CY0 + Rs + 30, WHITE, 22);
    T(c, seg(u, 2.6, 3.1), L('還沒有核融合', 'No fusion yet'), CX0, CY0 + Rs + 62, DIM, 20);
    subtitle(c, 1 - seg(u, s.d - 3.2, s.d - 2.9), L('重力位能變成熱能：中心越壓越密、越來越熱，顏色由暗紅變橘、變黃白',
      'Gravitational potential energy turns into heat: the center gets denser and hotter, glowing dark red, then orange, then yellow-white.'));
    subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L('結論：這時還沒有核融合，只是一顆被重力壓熱的原恆星',
      'Conclusion: no fusion yet. It is only a protostar heated by gravity.'), GOOD);
  }

  /* ═════════════════ 第 3 步：點火 ═════════════════ */
  const PN3 = { x: 410, y: 72, w: 526, h: 370 }, PCX3 = PN3.x + PN3.w / 2;
  const ROW1 = 184, ROW2 = 322, RPZ = 20, D0 = 400;
  const SLOW0 = 0.4, SLOWC = 1.1, FAST0 = 2.6, FAST1 = 3.9, CYC = 1.5;
  const logT3 = u => lerp(7.02, 7.18, ease(seg(u, 0.2, 5.2)));
  const ign3 = u => ease(seg(u, 4.1, 5.2));
  /* 慢的一對：越靠近越慢、在 dmin 處停下再被推回去 */
  function dSlow(u) {
    const t = clamp01((u - SLOW0) / (2 * SLOWC)) * 2 * SLOWC, x = (t - SLOWC) / SLOWC;
    return 120 + (D0 - 120) * x * x;
  }
  /* 快的一對：會變慢一點，但仍撞在一起（d＝2r） */
  function dFastX(x) { x = clamp01(x); return D0 - (D0 - 2 * RPZ) * (0.55 * (2 * x - x * x) + 0.45 * x); }

  function pair(c, cy, d, a, plusA) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const x1 = PCX3 - d / 2, x2 = PCX3 + d / 2;
    /* 電斥力箭頭：越近越長，指向遠離對方 */
    const Lr = Math.min(62, 2600 / Math.max(d, 1));
    if (Lr > 9) {
      W5.arrow(c, x1 - RPZ - 2, cy, x1 - RPZ - 2 - Lr, cy, WHITE, 3, 11);
      W5.arrow(c, x2 + RPZ + 2, cy, x2 + RPZ + 2 + Lr, cy, WHITE, 3, 11);
    }
    nball(c, x1, cy, RPZ, PRO, plusA); nball(c, x2, cy, RPZ, PRO, plusA);
    c.restore();
  }
  function streak(c, cy, dA, dB, a) {   /* 運動殘影：兩個時刻之間畫淡淡的拖尾 */
    if (a <= 0.02 || Math.abs(dA - dB) < 3) return;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    [-1, 1].forEach(sd => {
      const xa = PCX3 + sd * dA / 2, xb = PCX3 + sd * dB / 2;
      const g = c.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, W5.rgba(PRO, 0)); g.addColorStop(1, W5.rgba(PRO, 0.5));
      c.strokeStyle = g; c.lineWidth = RPZ * 1.4; c.beginPath(); c.moveTo(xa, cy); c.lineTo(xb, cy); c.stroke();
    });
    c.restore();
  }

  function step3(c, s) {
    const u = s.u, k = s.k, ign = ign3(u), lg = logT3(u);
    const sx = lerp(CX0, 190, k), sy = CY0;
    star(c, sx, sy, 88, lerp(0.78, 1, ign), ign, s.t, 1);
    /* 放大來源：核心 → 放大板 */
    c.save(); c.globalAlpha *= k * 0.8; c.strokeStyle = ENE; c.lineWidth = 1.5; c.setLineDash([5, 5]);
    c.strokeRect(sx - 18, sy - 18, 36, 36);
    c.beginPath(); c.moveTo(sx + 18, sy - 18); c.lineTo(PN3.x, PN3.y + 16); c.moveTo(sx + 18, sy + 18); c.lineTo(PN3.x, PN3.y + PN3.h - 16); c.stroke();
    c.restore();
    panelBox(c, k, PN3.x, PN3.y, PN3.w, PN3.h, ENE);
    c.save(); c.globalAlpha *= k;
    /* 慢的一對 */
    const ds = dSlow(u), dsP = dSlow(u - 0.12);
    streak(c, ROW1, dsP, ds, 1);
    pair(c, ROW1, ds, 1, 1);
    /* 快的一對：第一次撞上 → 閃光；之後每 1.5 秒再來一對（中心一直在融合） */
    if (u < FAST1) {
      const x = seg(u, FAST0, FAST1), xp = seg(u - 0.12, FAST0, FAST1);
      streak(c, ROW2, dFastX(xp), dFastX(x), 1);
      pair(c, ROW2, dFastX(x), 1, 1);
    } else {
      flash(c, PCX3, ROW2, u - FAST1, 70);
      const m = Math.floor((u - FAST1 - 0.6) / CYC), ph = u - FAST1 - 0.6 - m * CYC;
      if (u - FAST1 >= 0.6) {
        if (ph < 1.0) {
          const x = ph / 1.0, xp = Math.max(0, ph - 0.12) / 1.0;
          streak(c, ROW2, dFastX(xp), dFastX(x), seg(ph, 0, 0.25));
          pair(c, ROW2, dFastX(x), seg(ph, 0, 0.25), 1);
        } else flash(c, PCX3, ROW2, ph - 1.0, 54);
      }
    }
    c.restore();

    legend(c, k, [{ col: PRO, txt: L('質子（氫原子核）', 'proton (H nucleus)') }]);
    P(c, k, L('點火：中心超過約 1000 萬度', 'Ignition: the core passes ~10 million °C'), 480, 38, WHITE, 22);
    T(c, k, L('放大：太陽中心的質子', 'Zoom: protons in the core'), PCX3, 104, WHITE, 20);
    T(c, k * seg(u, SLOW0 + 0.6, SLOW0 + 1.0), L('電斥力（同性電荷相斥）', 'electric repulsion (like charges repel)'), PCX3, ROW1 - 46, WHITE, 20);
    T(c, k * seg(u, SLOW0 + 1.6, SLOW0 + 2.0), L('速度慢：被電斥力推開', 'Too slow: pushed apart'), PCX3, ROW1 + 50, DIM, 22);
    T(c, k * seg(u, FAST1 - 0.1, FAST1 + 0.2), L('速度夠快：撞在一起 → 核融合！', 'Fast enough: they collide → fusion!'), PCX3, ROW2 + 50, ENE, 22);
    /* 溫度讀數 */
    T(c, k, L('中心溫度', 'Core temperature'), sx, 382, DIM, 20);
    T(c, k, fmtT(Math.pow(10, lg)), sx, 414, heatCol(lerp(0.78, 1, ign)), 24, 'center', true);
    P(c, ign, L('核融合開始，星星亮了！', 'Fusion begins: the star lights up!'), sx, 124, ENE, 22);
    subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L('質子都帶正電、互相排斥；溫度夠高、跑得夠快，才撞得在一起',
      'Protons are all positive and repel each other. Only when it is hot enough and they move fast enough can they collide.'));
    subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L('結論：質子撞在一起發生核融合，整顆星亮了起來——太陽誕生！',
      'Conclusion: protons fuse and the whole star lights up. The Sun is born!'), GOOD);
  }

  /* ═════════════════ 第 4 步：氫變氦 ═════════════════ */
  const C4 = { x: 290, y: 250 }, R4 = 22;
  const DIR4 = [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].map(d => { const n = Math.hypot(d[0], d[1]); return { x: d[0] / n, y: d[1] / n }; });
  const CONV = [null, 1.6, 2.1, null];          /* 第 2、3 顆（右上、左下）變成中子的時刻 */
  const FORM = 3.5;                              /* 組成氦核的時刻 */
  function pos4(i, u) {
    const d = DIR4[i], a = ease(seg(u, 0.2, 1.4)), b = ease(seg(u, FORM - 0.7, FORM));
    const r = lerp(190, 62, a);
    const mx = C4.x + d.x * r, my = C4.y + d.y * r;
    const fx = C4.x + Math.sign(d.x) * 18, fy = C4.y + Math.sign(d.y) * 18;
    const amp = u > FORM ? 1.2 : 2;
    return { x: lerp(mx, fx, b) + amp * Math.sin(u * 7 + i * 2.1), y: lerp(my, fy, b) + amp * Math.cos(u * 6.3 + i * 1.7) };
  }
  const MP = { x: 560, y: 84, w: 376, h: 350 };
  const GAP = 0.08;                              /* 質量差「放大示意」：畫成 8%（真實 0.7%） */

  function step4(c, s) {
    const u = s.u, k = s.k;
    c.save(); c.globalAlpha = k;
    /* γ 能量：組成氦核後，黃色波一圈圈往外 */
    if (u > FORM) {
      const e = seg(u, FORM, FORM + 0.3);
      c.save(); c.lineWidth = 3; c.lineCap = 'round';
      for (let j = 0; j < 8; j++) {
        const an = (j + 0.5) / 8 * TAU, ux = Math.cos(an), uy = Math.sin(an);
        for (let m = 0; m < 2; m++) {
          const r = 46 + (((u - FORM) * 150 + m * 110 + j * 9) % 220);
          if (r > 250) continue;
          c.strokeStyle = W5.rgba(ENE, 0.9 * e * (1 - (r - 46) / 220));
          c.beginPath();
          for (let q = 0; q <= 14; q++) {
            const rr = r + q * 3, w = 5 * Math.sin(q * 0.9 - u * 10);
            const x = C4.x + ux * rr - uy * w, y = C4.y + uy * rr + ux * w;
            if (q === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.stroke();
        }
      }
      c.restore();
    }
    /* 微中子：變成中子的瞬間沿對角線飛走（淡灰虛線拖尾） */
    [1, 2].forEach(i => {
      const dt = u - CONV[i]; if (dt < 0 || dt > 2.2) return;
      const p0 = pos4(i, CONV[i]), d = DIR4[i], r = 26 + 300 * dt;
      const hx = p0.x + d.x * r, hy = p0.y + d.y * r;
      c.save(); c.setLineDash([4, 6]); c.strokeStyle = 'rgba(217,226,221,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p0.x + d.x * 26, p0.y + d.y * 26); c.lineTo(hx, hy); c.stroke(); c.restore();
      W5.glow(c, hx, hy, 12, '#ffffff', 0.5); c.fillStyle = '#eef3f0'; c.beginPath(); c.arc(hx, hy, 4, 0, TAU); c.fill();
    });
    /* 4 顆核子 */
    for (let i = 0; i < 4; i++) {
      const p = pos4(i, u), cv = CONV[i] == null ? 0 : ease(seg(u, CONV[i], CONV[i] + 0.35));
      if (CONV[i] != null) { const dt = u - CONV[i]; if (dt > 0 && dt < 0.8) W5.glow(c, p.x, p.y, 44, '#ffffff', 0.7 * (1 - dt / 0.8)); }
      nball(c, p.x, p.y, R4, mixHex(PRO, NEU, cv), 1 - cv);
    }
    flash(c, C4.x, C4.y, u - FORM, 90);
    c.restore();

    legend(c, k, [{ col: PRO, txt: L('質子', 'proton') }, { col: NEU, txt: L('中子', 'neutron') }]);
    P(c, k, L('氫變氦：4 個氫核 → 1 個氦核 ＋ 能量', 'H → He: 4 hydrogen nuclei → 1 helium nucleus + energy'), 480, 38, WHITE, 22);
    const aA = k * seg(u, 0.6, 1.0) * (1 - seg(u, 2.6, 2.9));
    T(c, aA, L('4 個氫核（質子）', '4 hydrogen nuclei (protons)'), C4.x, 98, PRO, 22);
    T(c, seg(u, FORM + 0.1, FORM + 0.4), L('能量（γ 光子）', 'energy (γ photons)'), C4.x, 98, ENE, 22);
    T(c, seg(u, CONV[2], CONV[2] + 0.3) * (1 - seg(u, CONV[2] + 2.0, CONV[2] + 2.3)), L('微中子 ν', 'neutrino ν'), 110, 300, NEU, 20);
    const aB = seg(u, CONV[1] - 0.1, CONV[1] + 0.2) * (1 - seg(u, FORM - 0.2, FORM + 0.1));
    T(c, aB, L('2 個質子變成 2 個中子', '2 protons turn into 2 neutrons'), C4.x, 392, NEU, 22);
    T(c, aB, L('（同時放出正電子 e⁺ 和微中子 ν）', '(releasing positrons e⁺ and neutrinos ν)'), C4.x, 424, DIM, 20);
    const aC = seg(u, FORM + 0.2, FORM + 0.5);
    T(c, aC, L('氦-4 原子核：2 個質子＋2 個中子', 'Helium-4 nucleus: 2 protons + 2 neutrons'), C4.x, 392, WHITE, 22);
    T(c, aC, L('教學簡化：省略中間步驟', 'Simplified: middle steps skipped'), C4.x, 424, DIM, 20);

    /* 右板：質量比一比、太陽每秒 */
    const pa = seg(u, 3.7, 4.1);
    panelBox(c, pa, MP.x, MP.y, MP.w, MP.h, ENE);
    T(c, pa, L('質量比一比', 'Compare the mass'), MP.x + MP.w / 2, 112, ENE, 22);
    const bx = MP.x + 20, bw = MP.w - 40, bh = 22;
    T(c, pa, L('反應前：4 個氫核', 'Before: 4 hydrogen nuclei'), bx, 148, WHITE, 20, 'left');
    const g1 = ease(seg(u, 4.0, 4.6)), g2 = ease(seg(u, 4.5, 5.1)), sl = seg(u, 5.1, 5.5);
    if (pa > 0.02) {
      c.save(); c.globalAlpha *= pa;
      c.fillStyle = '#0b1a15'; W5.rr(c, bx, 166, bw, bh, 7); c.fill(); W5.rr(c, bx, 234, bw, bh, 7); c.fill();
      c.fillStyle = PRO; W5.rr(c, bx, 166, Math.max(1, bw * g1), bh, 7); c.fill();
      c.fillStyle = mixHex(PRO, NEU, 0.5); W5.rr(c, bx, 234, Math.max(1, bw * (1 - GAP) * g2), bh, 7); c.fill();
      if (sl > 0.02) {
        c.save(); c.globalAlpha *= sl; W5.glow(c, bx + bw * (1 - GAP / 2), 245, 30, ENE, 0.5 + 0.2 * Math.sin(u * 6));
        c.fillStyle = ENE; W5.rr(c, bx + bw * (1 - GAP) + 2, 234, bw * GAP - 2, bh, 6); c.fill(); c.restore();
      }
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1.5; W5.rr(c, bx, 166, bw, bh, 7); c.stroke(); W5.rr(c, bx, 234, bw, bh, 7); c.stroke();
      c.restore();
    }
    T(c, pa, L('反應後：1 個氦核', 'After: 1 helium nucleus'), bx, 216, WHITE, 20, 'left');
    T(c, sl, L('少了約 0.7% → 變成能量', 'About 0.7% lost → energy'), MP.x + MP.w / 2, 284, ENE, 22);
    T(c, sl, L('（差距放大示意）', '(gap enlarged to show it)'), MP.x + MP.w / 2, 312, DIM, 20);
    const fa = seg(u, 5.7, 6.2);
    T(c, fa, L('太陽每秒：', 'Every second, the Sun:'), bx, 350, WHITE, 20, 'left');
    T(c, fa, L('約 6 億公噸氫 → 氦', '~600 million t of H → He'), bx, 378, PRO, 20, 'left');
    T(c, fa, L('約 400 萬公噸質量 → 能量', '~4 million t of mass → energy'), bx, 406, ENE, 20, 'left');

    subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L('4 個質子經過幾步融合，其中 2 個變成中子，最後組成 1 個氦-4 原子核',
      'Four protons fuse in several steps; two of them become neutrons, and together they form one helium-4 nucleus.'));
    subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L('結論：融合後質量少了約 0.7%，少掉的質量變成能量（E = mc²）',
      'Conclusion: about 0.7% of the mass disappears and becomes energy (E = mc²).'), GOOD);
  }

  /* ═════════════════ 第 5 步：穩定發光（太陽剖面） ═════════════════ */
  const SUN = { x: 250, y: 262, R: 170 };
  const RC = 0.25, RR = 0.7;                     /* 核心、輻射層外緣（以 R 為單位） */
  const EA = { x: 884, y: 380 };                 /* 地球 */
  /* 光子在輻射層走走停停：載入時算好的折線（往右上方慢慢擴散） */
  const WALK = (function () {
    const pts = [], base = -0.42; let r = RC * SUN.R, an = base, sd = 501;
    pts.push({ x: SUN.x + Math.cos(an) * r, y: SUN.y + Math.sin(an) * r });
    let x = pts[0].x, y = pts[0].y;
    for (let i = 0; i < 60 && Math.hypot(x - SUN.x, y - SUN.y) < RR * SUN.R - 6; i++) {
      const th = base + (hash(sd++) - 0.5) * 3.4, st = 12 + 8 * hash(sd++);
      let nx = x + Math.cos(th) * st, ny = y + Math.sin(th) * st;
      const rn = Math.hypot(nx - SUN.x, ny - SUN.y);
      if (rn < RC * SUN.R + 4) continue;
      if (rn > RR * SUN.R) { const f = (RR * SUN.R) / rn; nx = SUN.x + (nx - SUN.x) * f; ny = SUN.y + (ny - SUN.y) * f; }
      x = nx; y = ny; pts.push({ x, y });
    }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return { pts, cum, len: cum[cum.length - 1] };
  })();
  function walkAt(d) {
    d = Math.max(0, Math.min(WALK.len, d));
    for (let i = 1; i < WALK.pts.length; i++) if (d <= WALK.cum[i]) { const f = (d - WALK.cum[i - 1]) / ((WALK.cum[i] - WALK.cum[i - 1]) || 1); return { x: lerp(WALK.pts[i - 1].x, WALK.pts[i].x, f), y: lerp(WALK.pts[i - 1].y, WALK.pts[i].y, f) }; }
    const n = WALK.pts.length - 1; return { x: WALK.pts[n].x, y: WALK.pts[n].y };
  }

  function sunSection(c, t) {
    const X = SUN.x, Y = SUN.y, R = SUN.R;
    W5.glow(c, X, Y, R * 1.7, ENE, 0.30 + 0.04 * Math.sin(t * 2));
    W5.glow(c, X, Y, R * 1.25, '#ff9a3c', 0.35);
    /* 對流層 */
    let g = c.createRadialGradient(X, Y, R * RR, X, Y, R);
    g.addColorStop(0, '#f2742a'); g.addColorStop(1, '#d9541c');
    c.fillStyle = g; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fill();
    /* 對流胞：一圈小迴圈，熱氣體上升、冷的下沉（亮點沿迴圈跑） */
    const rm = (RR + 1) / 2 * R, rc = (1 - RR) / 2 * R * 0.78;
    for (let j = 0; j < 14; j++) {
      const an = j / 14 * TAU, cx = X + Math.cos(an) * rm, cy = Y + Math.sin(an) * rm, dir = j % 2 ? 1 : -1;
      c.strokeStyle = 'rgba(255,214,150,0.35)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, cy, rc, rc * 0.8, an, 0, TAU); c.stroke();
      for (let m = 0; m < 2; m++) {
        const ph = dir * t * 1.6 + m * Math.PI + j;
        const lx = Math.cos(ph) * rc, ly = Math.sin(ph) * rc * 0.8;
        const px = cx + lx * Math.cos(an) - ly * Math.sin(an), py = cy + lx * Math.sin(an) + ly * Math.cos(an);
        W5.glow(c, px, py, 7, '#fff1cf', 0.8);
      }
    }
    /* 輻射層 */
    g = c.createRadialGradient(X, Y, R * RC, X, Y, R * RR);
    g.addColorStop(0, '#ffcf73'); g.addColorStop(1, '#ffa94a');
    c.fillStyle = g; c.beginPath(); c.arc(X, Y, R * RR, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,24,16,0.45)'; c.lineWidth = 2; c.beginPath(); c.arc(X, Y, R * RR, 0, TAU); c.stroke();
    /* 核心 */
    W5.glow(c, X, Y, R * RC * 1.9, '#ffffff', 0.55 + 0.1 * Math.sin(t * 3));
    g = c.createRadialGradient(X, Y, 0, X, Y, R * RC);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#fff1cf');
    c.fillStyle = g; c.beginPath(); c.arc(X, Y, R * RC, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,24,16,0.35)'; c.lineWidth = 2; c.stroke();
    const PER = 0.1, i0 = Math.floor(t / PER);   /* 核心的融合閃光 */
    for (let j = i0 - 5; j <= i0; j++) {
      const age = t - j * PER; if (age < 0 || age > 0.5) continue;
      const an = hash(j * 5 + 31) * TAU, rr = R * RC * 0.85 * Math.sqrt(hash(j * 5 + 32)), kk = 1 - age / 0.5;
      W5.glow(c, X + Math.cos(an) * rr, Y + Math.sin(an) * rr, 5 + 9 * kk, ENE, 0.9 * kk);
    }
    /* 表面邊緣 */
    c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.stroke();
    /* 光子的走走停停（黃色，一段一段往外） */
    const PERW = 3.2, d = ((t % PERW) / PERW) * WALK.len;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(122,40,12,0.55)'; c.lineWidth = 2.5; c.beginPath();
    WALK.pts.forEach((p, i) => { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); }); c.stroke();
    for (let m = 9; m >= 0; m--) { const q = walkAt(d - m * 5); c.fillStyle = W5.rgba(m ? '#fff6c8' : '#ffffff', 0.95 * (1 - m / 10)); c.strokeStyle = W5.rgba('#7a280c', 0.8 * (1 - m / 10)); c.lineWidth = 1.5; c.beginPath(); c.arc(q.x, q.y, 5 - m * 0.35, 0, TAU); c.fill(); c.stroke(); }
    const q = walkAt(d); W5.glow(c, q.x, q.y, 16, '#ffffff', 0.9);
    c.restore();
  }

  function earthRays(c, t, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    [16, 24, 32].forEach((dg, i) => {
      const an = dg * Math.PI / 180, x0 = SUN.x + Math.cos(an) * (SUN.R + 6), y0 = SUN.y + Math.sin(an) * (SUN.R + 6);
      const x1 = EA.x - 22, y1 = EA.y + (i - 1) * 7, len = Math.hypot(x1 - x0, y1 - y0);
      c.strokeStyle = W5.rgba(ENE, 0.18); c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      const off = (t * 140 + i * 23) % 46;
      c.strokeStyle = W5.rgba(ENE, 0.85); c.lineWidth = 3; c.lineCap = 'round';
      for (let dd = off; dd < len; dd += 46) {
        const f0 = dd / len, f1 = Math.min(1, (dd + 18) / len);
        c.beginPath(); c.moveTo(lerp(x0, x1, f0), lerp(y0, y1, f0)); c.lineTo(lerp(x0, x1, f1), lerp(y0, y1, f1)); c.stroke();
      }
    });
    /* 地球：藍色小球＋一點綠 */
    W5.glow(c, EA.x, EA.y, 30, ENE, 0.25);
    W5.ball(c, EA.x, EA.y, 15, EARTH);
    c.fillStyle = 'rgba(51,204,153,0.75)'; c.beginPath(); c.ellipse(EA.x - 3, EA.y - 3, 6, 4, 0.6, 0, TAU); c.fill();
    c.restore();
  }

  function balance(c, a, t) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const R = SUN.R, L5 = 0.30 * R, pulse = 1 + 0.04 * Math.sin(t * 3);
    [180, 135, 225, 110, 250].forEach(dg => {
      const an = dg * Math.PI / 180, ux = Math.cos(an), uy = Math.sin(an), px = -uy * 8, py = ux * 8;
      const o0 = 0.38 * R, i0 = 1.06 * R;
      arrowO(c, SUN.x + ux * o0 + px, SUN.y + uy * o0 + py, SUN.x + ux * (o0 + L5 * pulse) + px, SUN.y + uy * (o0 + L5 * pulse) + py, HEAT, 4, 13);
      arrowO(c, SUN.x + ux * i0 - px, SUN.y + uy * i0 - py, SUN.x + ux * (i0 - L5 * pulse) - px, SUN.y + uy * (i0 - L5 * pulse) - py, GRAV, 4, 13);
    });
    c.restore();
  }

  function step5(c, s) {
    const u = s.u, k = s.k, t = s.t;
    c.save(); c.globalAlpha = k;
    earthRays(c, t, seg(u, 0.4, 1.0));
    sunSection(c, t);
    c.restore();
    const ba = k * seg(u, 0.6, 1.3);
    balance(c, ba, t);
    /* 剖面各層標示：引線 */
    const la = k * seg(u, 1.2, 1.8), R = SUN.R;
    const LB = [
      { r: 1.0, dg: -55, y: 120, txt: L('表面 → 發光', 'Surface → light'), col: '#ffd27a' },
      { r: 0.85, dg: -33, y: 172, txt: L('對流層', 'Convective zone'), col: '#ffb27a' },
      { r: 0.5, dg: -8, y: 230, txt: L('輻射層', 'Radiative zone'), col: '#ffcf73' },
      { r: 0.12, dg: 20, y: 296, txt: L('核心（核融合）', 'Core (fusion)'), col: '#fff1cf' }
    ];
    if (la > 0.02) {
      c.save(); c.globalAlpha *= la; c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 1.5;
      LB.forEach(b => {
        const an = b.dg * Math.PI / 180, x0 = SUN.x + Math.cos(an) * b.r * R, y0 = SUN.y + Math.sin(an) * b.r * R;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(436, b.y); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x0, y0, 3, 0, TAU); c.fill();
      });
      c.restore();
    }
    LB.forEach(b => T(c, la, b.txt, 442, b.y, b.col, 20, 'left'));
    T(c, ba, L('壓力', 'pressure'), 160, 228, HEAT, 22);
    T(c, ba, L('重力', 'gravity'), 52, 300, GRAV, 22);
    P(c, k * seg(u, 1.4, 2.0), L('重力 ＝ 壓力 → 平衡', 'gravity = pressure → balance'), 792, 262, GOOD, 20);
    T(c, k * seg(u, 0.8, 1.3), L('地球', 'Earth'), EA.x, EA.y + 34, EARTH, 20);
    T(c, k * seg(u, 1.0, 1.5), L('陽光約 8 分鐘到地球', 'Sunlight reaches Earth in ~8 min'), 650, 406, ENE, 20);
    /* 壽命時間軸 */
    const ta = k * seg(u, 2.2, 3.0), bx = 650, bw = 280, by = 126;
    T(c, ta, L('總壽命約 100 億年', 'Lifetime: ~10 billion years'), bx + bw / 2, 98, WHITE, 20);
    if (ta > 0.02) {
      c.save(); c.globalAlpha *= ta;
      c.fillStyle = '#0b1a15'; W5.rr(c, bx, by, bw, 16, 8); c.fill();
      c.fillStyle = ENE; W5.rr(c, bx, by, bw * 0.46 * ease(seg(u, 2.4, 3.2)), 16, 8); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 1.5; W5.rr(c, bx, by, bw, 16, 8); c.stroke();
      const mx = bx + bw * 0.46;  /* 「現在」的位置 */
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(mx, by - 2); c.lineTo(mx - 7, by - 12); c.lineTo(mx + 7, by - 12); c.closePath(); c.fill();
      c.fillStyle = ENE; W5.rr(c, bx, 158, 22, 12, 4); c.fill();
      c.fillStyle = '#0b1a15'; W5.rr(c, bx, 186, 22, 12, 4); c.fill(); c.strokeStyle = 'rgba(246,243,234,0.5)'; c.stroke();
      c.restore();
    }
    T(c, ta, L('已亮約 46 億年（現在）', '~4.6 billion years so far'), bx + 32, 164, ENE, 20, 'left');
    T(c, ta, L('還能亮約 50 億年', '~5 billion years to go'), bx + 32, 192, WHITE, 20, 'left');

    P(c, k, L('穩定發光：重力與壓力平衡', 'Shining steadily: gravity balances pressure'), 480, 38, WHITE, 22);
    subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L('核心的能量經過輻射層、對流層傳到表面，再以光的形式抵達地球',
      'Energy from the core passes through the radiative and convective zones to the surface, then reaches Earth as light.'));
    subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L('結論：太陽發光靠的是核融合，不是燃燒；總壽命約 100 億年',
      'Conclusion: the Sun shines by nuclear fusion, not by burning. Its lifetime is about 10 billion years.'), GOOD);
  }

  W5.register('sun', {
    canvas: 'cvs-sun',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) step1(c, s);
      else if (s.n === 2) step2(c, s);
      else if (s.n === 3) step3(c, s);
      else if (s.n === 4) step4(c, s);
      else step5(c, s);
    }
  });
})();
