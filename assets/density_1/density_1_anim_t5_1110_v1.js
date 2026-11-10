/* density_1_anim_t5_1110_v1.js — density_1「長度測量」分頁動畫：離群值與平均（畫布邏輯 1000×600）
 *
 * 契約：window.DenAnim.t5 = { start(canvas, lang), stop(), setLang(lang), goStep(i, stopAfter), setStopAfter(b),
 *                             pause(b), info(), onStep, onEnd, _frameAt(t), _texts(), _state() }
 * 畫面是「時間 t 的純函式」；每步播完停在最後一幀（stopAfter＝true），false 則連播到底。進度條用 window.AnimBar。
 * 數據（與原頁相同）：甲 19.13、乙 19.15、丙 19.17、丁 29.00、戊 19.18（cm）。
 *   剔除 29.00：19.13+19.15+19.17+19.18 = 76.63；76.63 ÷ 4 = 19.1575 → 19.16 cm
 *   沒剔除：(76.63 + 29.00) ÷ 5 = 105.63 ÷ 5 = 21.126 → 21.13 cm
 * 數線：寬視野 18～30 cm；窄視野 19.10～19.20 cm（步驟 3 連續放大、步驟 5 縮回）。
 * 步驟（共 52 s）：
 *   1 五筆數據 10 s  五個點依序落在數線上
 *   2 找離群   10 s  29.00 離其他點近 10 cm → 打叉、飛走
 *   3 剩四筆   10 s  數線放大到 19.10～19.20，四點散開
 *   4 算平均   11 s  76.63 ÷ 4 = 19.1575 ≈ 19.16 cm
 *   5 沒剔除   11 s  (76.63 + 29.00) ÷ 5 ≈ 21.13 cm，與 19.16 相差約 2 cm
 * 不畫手；畫布文字 ≥ 22px；文字全部 [zh, en] 配對。
 */
(function () {
  'use strict';
  window.DenAnim = window.DenAnim || {};

  // ───────── 共用小工具（每支檔各帶一份，檔案可獨立載入） ─────────
  const W = 1000, H = 600;
  const FONT = '"Noto Sans TC", "PingFang TC", sans-serif';
  const C = {
    bg: '#1c3d34', deep: '#11261f', white: '#f2ecd9', yel: '#fde047', cyan: '#55e9ff',
    green: '#4ade80', orange: '#fb923c', pink: '#f472b6', dim: 'rgba(242,236,217,0.45)'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (x) => x * x * (3 - 2 * x);
  const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);   // 線性 0→1
  const seg = (t, a, b) => ease(lin(t, a, b));               // 緩動 0→1

  let ctx = null, LANG = 'zh', TEXTS = [];
  const tr = (p) => (typeof p === 'string' ? p : (LANG === 'en' ? p[1] : p[0]));
  const fnt = (size, weight) => `${weight || 700} ${size}px ${FONT}`;

  // 畫一行字並記錄包圍盒（自測用）。o：{ align, a(透明度), w(字重) }。座標一律是畫布邏輯座標，不在旋轉座標系內呼叫。
  function txt(p, x, y, size, color, o) {
    o = o || {};
    const a = o.a === undefined ? 1 : o.a;
    if (a <= 0.02) return 0;
    const s = tr(p), align = o.align || 'center';
    ctx.save();
    ctx.globalAlpha = a; ctx.font = fnt(size, o.w); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width;
    ctx.restore();
    const left = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
    TEXTS.push({ s, size, x: left, y: y - size * 0.55, w, h: size * 1.1, a });
    return w;
  }
  function wrap(s, size, maxW, weight) {
    ctx.save(); ctx.font = fnt(size, weight);
    const out = [];
    s.split('\n').forEach((part) => {
      const toks = LANG === 'en' ? part.split(/(?<= )/) : (part.match(/[\x21-\x7e]+ ?|[^\x21-\x7e]/g) || []);
      let line = '';
      toks.forEach((tk) => {
        const noHead = /^[，。；：！？、）」]/.test(tk);
        if (line && !noHead && ctx.measureText((line + tk).trimEnd()).width > maxW) { out.push(line.trimEnd()); line = tk; }
        else line += tk;
      });
      if (line.trim()) out.push(line.trimEnd());
    });
    ctx.restore();
    return out;
  }
  // 多行字：o.align 預設置中；y 為第一行中心；回傳行數
  function para(p, x, y, size, color, maxW, o) {
    const lines = wrap(tr(p), size, maxW, o && o.w);
    lines.forEach((ln, i) => txt(ln, x, y + i * size * 1.4, size, color, o));
    return lines.length;
  }
  function title(p) { txt(p, W / 2, 64, 30, C.yel, { w: 900 }); }
  function caption(p) {
    ctx.save(); ctx.fillStyle = C.deep; ctx.globalAlpha = 0.85; rrect(20, 478, W - 40, 114, 14); ctx.fill(); ctx.restore();
    let lines = wrap(tr(p), 24, 910);
    if (lines.length > 1) {                          // 多行時把各行長度拉平，避免最後一行只剩幾個字
      for (let mw = 880; mw >= 460; mw -= 30) { const l2 = wrap(tr(p), 24, mw); if (l2.length !== lines.length) break; lines = l2; }
    }
    const y0 = 535 - (lines.length - 1) * 17;
    lines.forEach((ln, i) => txt(ln, W / 2, y0 + i * 34, 24, C.white));
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(x1, y1, x2, y2, color, lw, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 3; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function arrow(x1, y1, x2, y2, color, lw, dash) {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 6 + (lw || 3) * 2.2;
    line(x1, y1, x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6, color, lw, dash);
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * h, y2 - Math.sin(a - 0.45) * h);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * h, y2 - Math.sin(a + 0.45) * h);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 打叉／打勾（k：0→1 逐筆畫出）
  function cross(x, y, r, k, color, lw) {
    if (k <= 0) return;
    const k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    line(x - r, y - r, x - r + 2 * r * k1, y - r + 2 * r * k1, color || C.pink, lw || 7);
    if (k2 > 0) line(x + r, y - r, x + r - 2 * r * k2, y - r + 2 * r * k2, color || C.pink, lw || 7);
  }
  function check(x, y, r, k, color, lw) {
    if (k <= 0) return;
    const k1 = clamp(k * 2.5, 0, 1), k2 = clamp((k * 2.5 - 1) / 1.5, 0, 1);
    line(x - r, y, x - r + r * 0.7 * k1, y + r * 0.7 * k1, color || C.green, lw || 7);
    if (k2 > 0) line(x - r * 0.3, y + r * 0.7, x - r * 0.3 + r * 1.3 * k2, y + r * 0.7 - r * 1.5 * k2, color || C.green, lw || 7);
  }

  // ───────── t5 離群值與平均 ─────────
  const KEY = 't5';
  const DATA = [
    { n: ['甲', 'A'], v: 19.13 }, { n: ['乙', 'B'], v: 19.15 }, { n: ['丙', 'C'], v: 19.17 },
    { n: ['丁', 'D'], v: 29.00 }, { n: ['戊', 'E'], v: 19.18 }
  ];
  const KEEP = DATA.filter((d) => d.v < 25);
  const SUM4 = KEEP.reduce((s, d) => s + Math.round(d.v * 100), 0) / 100;        // 76.63
  const MEAN4 = SUM4 / 4, MEAN5 = (SUM4 + 29) / 5;                              // 19.1575、21.126
  const AY = 400, AX1 = 80, AX2 = 920, DOTY = AY - 14;
  const stackY = (j) => DOTY - 6 - j * 28;

  // 視野：z=0 寬（18～30）、z=1 窄（19.10～19.20）；以 19.155 為錨點連續縮放
  function view(z) {
    const half = Math.exp(lerp(Math.log(6), Math.log(0.05), z));
    const f = lerp((19.155 - 18) / 12, 0.55, z);
    const lo = 19.155 - f * 2 * half;
    return { lo, hi: lo + 2 * half, z };
  }
  const ax = (v, vw) => AX1 + (v - vw.lo) / (vw.hi - vw.lo) * (AX2 - AX1);
  function axis(vw) {
    line(AX1 - 30, AY, AX2 + 30, AY, C.white, 4);
    const span = vw.hi - vw.lo;
    ctx.save();
    if (span > 1.5) {
      ctx.globalAlpha = clamp((span - 1.5) / 3, 0, 1);
      for (let c = Math.ceil(vw.lo - 1e-9); c <= vw.hi + 1e-9; c++) line(ax(c, vw), AY - 10, ax(c, vw), AY + 10, C.white, 3);
    }
    if (span < 0.6) {
      ctx.globalAlpha = clamp((0.6 - span) / 0.4, 0, 1);
      for (let n = Math.ceil(vw.lo * 100 - 1e-6); n <= vw.hi * 100 + 1e-6; n++) line(ax(n / 100, vw), AY - (n % 5 === 0 ? 12 : 8), ax(n / 100, vw), AY + (n % 5 === 0 ? 12 : 8), C.white, n % 5 === 0 ? 3 : 2);
    }
    ctx.restore();
    if (vw.z <= 0.001) for (let c = 18; c <= 30; c += 2) txt(String(c), ax(c, vw), AY + 32, 22, C.white);
    if (vw.z >= 0.999) for (let n = 1910; n <= 1920; n += 2) txt((n / 100).toFixed(2), ax(n / 100, vw), AY + 32, 22, C.white);
    txt('cm', 968, AY + 32, 22, C.white);
  }
  function dot(x, y, col, a, r) {
    if (a <= 0.02 || x < AX1 - 40 || x > AX2 + 40) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = C.deep; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r || 11, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  const lab = (d) => [d.n[0] + ' ' + d.v.toFixed(2), d.n[1] + ' ' + d.v.toFixed(2)];
  // 寬視野下的四個點（疊成一疊）＋右側數值清單
  function stack(vw, la) {
    KEEP.forEach((d, j) => { dot(ax(d.v, vw), stackY(j), C.cyan, 1); txt(lab(d), 190, stackY(j), 22, C.cyan, { align: 'left', a: la }); });
  }
  const OUT = DATA[3], W0 = view(0), W1 = view(1);

  const STEPS = [
    { b: ['五筆數據', '5 readings'], dur: 10,
      title: ['五個人量課本的寬度', 'Five students measure the book'],
      cap: ['五位同學各量一次課本的寬度（cm），把五筆數據標在數線上。', 'Five students each measure the width of the textbook (cm). Plot the five readings on a number line.'],
      draw(tl) {
        axis(W0);
        let j = 0;
        DATA.forEach((d, i) => {
          const k = seg(tl, 0.8 + i * 1.4, 1.7 + i * 1.4), isOut = d === OUT;
          const y1 = isOut ? DOTY : stackY(j); if (!isOut) j++;
          if (k <= 0) return;
          const bounce = k < 1 ? 0 : Math.max(0, 1 - (tl - 1.7 - i * 1.4) * 3) * 6;
          dot(ax(d.v, W0), lerp(110, y1, k * k) - bounce, isOut ? C.orange : C.cyan, 1);
          if (isOut) txt(lab(d), ax(d.v, W0), 346, 22, C.orange, { a: seg(tl, 1.6 + i * 1.4, 2.0 + i * 1.4) });
          else txt(lab(d), 190, y1, 22, C.cyan, { align: 'left', a: seg(tl, 1.6 + i * 1.4, 2.0 + i * 1.4) });
        });
      } },
    { b: ['找離群', 'Outlier'], dur: 10,
      title: ['有一筆離得特別遠', 'One reading is far from the rest'],
      cap: ['四筆都在 19 cm 附近，只有 29.00 差了將近 10 cm，明顯是量錯或記錯。這種離群值要剔除。', 'Four readings are near 19 cm, but 29.00 is almost 10 cm away — clearly a mistake. Remove this outlier.'],
      draw(tl) {
        axis(W0); stack(W0, 1);
        const ox = ax(29, W0), fly = seg(tl, 6.2, 7.6);
        const a = seg(tl, 1.4, 2.2) * (1 - seg(tl, 6.0, 6.6));
        if (a > 0.02) { ctx.save(); ctx.globalAlpha = a; arrow(500, 250, 172, 250, C.pink, 4); arrow(500, 250, ox - 8, 250, C.pink, 4); ctx.restore(); }
        txt(['相差將近 10 cm', 'Almost 10 cm apart'], 510, 220, 26, C.pink, { a, w: 900 });
        const pulse = tl > 0.8 && tl < 4 ? 3 * Math.abs(Math.sin(tl * 4)) : 0;
        const dx = ox + fly * 40, dy = DOTY - fly * 250;
        dot(dx, dy, tl > 0.8 ? C.pink : C.orange, 1 - fly, 11 + pulse);
        ctx.save(); ctx.globalAlpha = 1 - fly; cross(dx, dy, 24, seg(tl, 4.0, 4.8), C.pink, 7); ctx.restore();
        txt(lab(OUT), ox, 346, 22, C.pink, { a: 1 - seg(tl, 5.8, 6.3) });
        txt(['離群值，剔除！', 'Outlier — remove it!'], 800, 160, 28, C.pink, { a: seg(tl, 4.4, 5.2), w: 900 });
      } },
    { b: ['剩四筆', '4 left'], dur: 10,
      title: ['剩下 4 筆，放大來看', 'Four readings left — zoom in'],
      cap: ['剩下 4 筆：19.13、19.15、19.17、19.18。把數線放大，它們彼此只差一點點。', 'Four readings remain: 19.13, 19.15, 19.17 and 19.18. Zoom in on the number line: they differ only slightly.'],
      draw(tl) {
        const z = seg(tl, 1.2, 4.6), vw = view(z);
        axis(vw);
        const la = 1 - seg(tl, 0.5, 1.1), lb = seg(tl, 4.7, 5.4);
        KEEP.forEach((d, j) => {
          const x = ax(d.v, vw);
          dot(x, lerp(stackY(j), DOTY, z), C.cyan, 1);
          txt(lab(d), 190, stackY(j), 22, C.cyan, { align: 'left', a: la });
          if (z >= 1) { txt(d.v.toFixed(2), x, 350, 24, C.cyan, { a: lb, w: 900 }); txt(d.n, x, 316, 24, C.white, { a: lb }); }
        });
        txt(['4 筆很接近：最多只差 0.05 cm', 'All four are close: at most 0.05 cm apart'], 500, 170, 28, C.green, { a: seg(tl, 6.0, 6.8), w: 900 });
      } },
    { b: ['算平均', 'Mean'], dur: 11,
      title: ['4 筆數據求平均', 'Average the four readings'],
      cap: ['4 筆相加是 76.63，除以 4 得 19.1575，四捨五入到小數第二位：平均 19.16 cm。', 'The four add up to 76.63. Divide by 4 to get 19.1575, then round to two decimal places: the mean is 19.16 cm.'],
      draw(tl) {
        axis(W1);
        KEEP.forEach((d) => { const x = ax(d.v, W1); dot(x, DOTY, C.cyan, 1); txt(d.v.toFixed(2), x, 350, 24, C.cyan, { w: 900 }); });
        txt(KEEP.map((d) => d.v.toFixed(2)).join(' ＋ ') + ' ＝ ' + SUM4.toFixed(2), 500, 118, 28, C.white, { a: seg(tl, 0.6, 1.4) });
        txt(SUM4.toFixed(2) + ' ÷ 4 ＝ ' + MEAN4.toFixed(4), 500, 168, 28, C.white, { a: seg(tl, 3.0, 3.8) });
        txt(['平均 ≈ ' + MEAN4.toFixed(2) + ' cm', 'Mean ≈ ' + MEAN4.toFixed(2) + ' cm'], 500, 230, 40, C.green, { a: seg(tl, 5.4, 6.2), w: 900 });
        const m = seg(tl, 6.6, 7.6), mx = ax(MEAN4, W1);
        if (m > 0) {
          line(mx, AY, mx, lerp(AY, 300, m), C.green, 4);
          ctx.save(); ctx.globalAlpha = m; ctx.fillStyle = C.green; ctx.beginPath(); ctx.moveTo(mx, AY - 12); ctx.lineTo(mx + 10, AY); ctx.lineTo(mx, AY + 12); ctx.lineTo(mx - 10, AY); ctx.closePath(); ctx.fill(); ctx.restore();
          txt(['平均', 'mean'], mx, 284, 24, C.green, { a: m, w: 900 });
        }
      } },
    { b: ['沒剔除', 'If kept'], dur: 11,
      title: ['如果沒剔除離群值？', 'What if the outlier is kept?'],
      cap: ['如果沒剔除 29.00：(76.63 ＋ 29.00) ÷ 5 ≈ 21.13 cm，比 19.16 cm 多了約 2 cm，誤差很大。', 'If 29.00 is kept: (76.63 + 29.00) ÷ 5 ≈ 21.13 cm — about 2 cm more than 19.16 cm. That is a large error.'],
      draw(tl) {
        const z = 1 - seg(tl, 0.5, 3.0), vw = view(z);
        axis(vw);
        KEEP.forEach((d) => dot(ax(d.v, vw), DOTY, C.cyan, 1));
        if (z > 0) return;
        const o = seg(tl, 3.0, 3.8), ox = ax(29, W0);
        dot(ox, DOTY, C.pink, o); txt('29.00', ox, 350, 24, C.pink, { a: o, w: 900 });
        txt('(' + SUM4.toFixed(2) + ' ＋ 29.00) ÷ 5 ＝ ' + MEAN5.toFixed(3), 500, 118, 28, C.white, { a: seg(tl, 3.6, 4.4) });
        txt(['沒剔除的平均 ≈ ' + MEAN5.toFixed(2) + ' cm', 'Mean with the outlier ≈ ' + MEAN5.toFixed(2) + ' cm'], 500, 176, 34, C.pink, { a: seg(tl, 5.4, 6.2), w: 900 });
        const g = seg(tl, 3.0, 3.6), gx = ax(MEAN4, W0), p = seg(tl, 6.2, 7.0), pxx = ax(MEAN5, W0);
        if (g > 0) line(gx, AY, gx, lerp(AY, 366, g), C.green, 4);
        txt(MEAN4.toFixed(2), gx, 350, 24, C.green, { a: g, w: 900 });
        if (p > 0) { line(pxx, AY, pxx, lerp(AY, 366, p), C.pink, 4); ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(pxx, AY - 12); ctx.lineTo(pxx + 10, AY); ctx.lineTo(pxx, AY + 12); ctx.lineTo(pxx - 10, AY); ctx.closePath(); ctx.fill(); ctx.restore(); }
        txt(MEAN5.toFixed(2), pxx, 350, 24, C.pink, { a: p, w: 900 });
        const e = seg(tl, 7.6, 8.4);
        if (e > 0.02) { ctx.save(); ctx.globalAlpha = e; arrow(230, 310, gx + 4, 310, C.orange, 4); arrow(230, 310, pxx - 4, 310, C.orange, 4); ctx.restore(); }
        txt(['差了約 2 cm', 'About 2 cm off'], 230, 280, 26, C.orange, { a: e, w: 900 });
      } }
  ];

  // ───────── 播放引擎（畫面＝時間 t 的純函式；RAF 只有一條） ─────────
  const STARTS = []; let TOTAL = 0;
  STEPS.forEach((s) => { STARTS.push(TOTAL); TOTAL += s.dur; });
  const S = { canvas: null, ctx: null, t: 0, step: -1, raf: 0, last: 0, paused: false, stopAfter: true, ended: false, active: false };
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }

  function render() {
    if (!S.ctx) return;
    ctx = S.ctx;
    const cv = S.canvas;
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.globalAlpha = 1; ctx.setLineDash([]);
    TEXTS = [];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const t = clamp(S.t, 0, TOTAL);
    const i = stepAt(t), st = STEPS[i], tl = t - STARTS[i];
    ctx.save(); st.draw(tl, st.dur); ctx.restore();
    const fade = clamp(1 - tl / 0.35, 0, 1);              // 每步開頭淡入
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = C.bg; ctx.fillRect(0, 30, W, H - 30); ctx.restore();
      TEXTS = TEXTS.filter(() => fade < 0.5);
    }
    title(st.title);
    caption(typeof st.cap === 'function' ? st.cap(tl) : st.cap);
    if (window.AnimBar) window.AnimBar.draw(ctx, W, STARTS, TOTAL, t);
    if (i !== S.step) { S.step = i; if (typeof api.onStep === 'function') api.onStep(i); }
  }
  function frame(ts) {
    S.raf = 0;
    if (!S.active || S.paused || document.hidden) return;
    const k = stepAt(S.t);
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const end = S.stopAfter && k + 1 < STARTS.length ? STARTS[k + 1] : TOTAL;
    if (S.t >= end) {                                     // 播完這一步（或整段）：停在最後一幀
      S.t = end - 1e-3; render();
      if (end >= TOTAL && !S.ended) { S.ended = true; if (typeof api.onEnd === 'function') api.onEnd(); }
      return;
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function run() {
    if (!S.active || S.raf || S.paused || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function halt() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); else run(); });

  const api = {
    onStep: null, onEnd: null,
    start(canvas, lang) {
      halt();
      S.canvas = canvas; S.ctx = canvas.getContext('2d');
      LANG = lang === 'en' ? 'en' : 'zh';
      S.t = 0; S.step = -1; S.ended = false; S.paused = false; S.active = true;
      render(); run();
    },
    stop() { halt(); S.active = false; },
    setLang(lang) { LANG = lang === 'en' ? 'en' : 'zh'; render(); run(); },
    goStep(i, stopAfter) {
      i = clamp(i | 0, 0, STEPS.length - 1);
      if (stopAfter !== undefined) S.stopAfter = !!stopAfter;
      halt();
      S.t = STARTS[i] + 1e-4; S.step = -1; S.ended = false; S.active = !!S.ctx;
      render(); run();
    },
    setStopAfter(b) { S.stopAfter = !!b; run(); },
    pause(b) { S.paused = !!b; if (S.paused) halt(); else run(); },
    info() { return { steps: STEPS.map((s) => ({ zh: s.b[0], en: s.b[1] })), starts: STARTS.slice(), total: TOTAL }; },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL); render(); return TOTAL; },
    _texts() { return TEXTS.map((o) => Object.assign({}, o)); },
    _state() { return { t: S.t, step: S.step, running: !!S.raf, paused: S.paused, stopAfter: S.stopAfter, ended: S.ended, lang: LANG }; }
  };
  window.DenAnim[KEY] = api;
})();
