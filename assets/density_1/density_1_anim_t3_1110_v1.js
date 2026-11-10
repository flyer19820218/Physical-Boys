/* density_1_anim_t3_1110_v1.js — density_1「長度測量」分頁動畫：最後一位要估計（畫布邏輯 1000×600）
 *
 * 契約：window.DenAnim.t3 = { start(canvas, lang), stop(), setLang(lang), goStep(i, stopAfter), setStopAfter(b),
 *                             pause(b), info(), onStep, onEnd, _frameAt(t), _texts(), _state() }
 * 畫面是「時間 t 的純函式」；每步播完停在最後一幀（stopAfter＝true），false 則連播到底。進度條用 window.AnimBar。
 * 幾何：刻度尺 0～10 cm，80 px/cm（0 在 x=100），最小刻度 0.1 cm＝8 px；鋼釘釘頭在 0、尖端在 8.69 cm（x=795.2）。
 * 步驟（共 50 s）：
 *   1 放鋼釘    9 s  鋼釘滑到尺旁、釘頭對齊 0
 *   2 找尖端   10 s  從 8 數 6 小格 → 超過 8.6、不到 8.7
 *   3 放大估計 11 s  放大 8.6～8.7，分 10 等分，尖端在第 9 格
 *   4 準確估計 10 s  準確值 8.6 cm ＋ 估計值 0.09 cm
 *   5 記錄     10 s  8.69 cm（數字＋單位）
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

  // ───────── t3 最後一位要估計 ─────────
  const KEY = 't3';
  const X0 = 100, PX = 80, RY = 370, NY = 345, LEN = 8.69;
  const cmx = (v) => X0 + v * PX, TIP = cmx(LEN);
  const STEEL = '#c9d3d6';

  function ruler(hi) {                              // hi：亮起的小格數（8.1 起算），hi7：8.7 那一格亮橘色
    ctx.save(); ctx.fillStyle = 'rgba(253,224,71,0.14)'; ctx.strokeStyle = C.yel; ctx.lineWidth = 3;
    rrect(X0 - 22, RY, 10 * PX + 44, 72, 6); ctx.fill(); ctx.stroke(); ctx.restore();
    for (let m = 0; m <= 100; m++) {
      const x = X0 + m * 8, big = m % 10 === 0, mid = m % 5 === 0;
      let col = C.yel, lw = big ? 3 : 2;
      if (hi && m > 80 && m <= 80 + hi.n) { col = C.green; lw = 3; }
      if (hi && hi.next && m === 87) { col = C.orange; lw = 3; }
      line(x, RY, x, RY + (big ? 26 : mid ? 18 : 11), col, lw);
    }
    for (let c = 0; c <= 10; c++) txt(String(c), cmx(c), RY + 50, 22, hi && hi.eight && c === 8 ? C.green : C.yel, { w: hi && hi.eight && c === 8 ? 900 : 700 });
    txt('cm', 955, RY + 50, 22, C.yel);
  }
  function nail(dx, dy) {
    ctx.save(); ctx.translate(dx || 0, dy || 0);
    ctx.fillStyle = STEEL; ctx.strokeStyle = C.white; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X0 + 8, NY - 6); ctx.lineTo(TIP - 46, NY - 6); ctx.lineTo(TIP, NY); ctx.lineTo(TIP - 46, NY + 6); ctx.lineTo(X0 + 8, NY + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    rrect(X0, NY - 17, 9, 34, 2); ctx.fill(); ctx.stroke();
    line(X0 + 40, NY - 2, TIP - 80, NY - 2, 'rgba(255,255,255,0.6)', 2);
    ctx.restore();
  }
  function tipLine(k, col) { if (k > 0) line(TIP, NY, TIP, lerp(NY, RY + 26, k), col || C.pink, 2.5, [5, 4]); }
  function base(hi) { ruler(hi); nail(); }

  const STEPS = [
    { b: ['放鋼釘', 'Place'], dur: 9,
      title: ['鋼釘放在刻度尺旁', 'Put the nail beside the ruler'],
      cap: ['把鋼釘平放在刻度尺旁，釘頭對齊 0，再看尖端落在哪裡。', 'Lay the steel nail beside the ruler with its head at 0, then see where the tip lands.'],
      draw(tl) {
        ruler();
        const k = seg(tl, 0.6, 3.0);
        nail(lerp(-260, 0, k), lerp(-170, 0, k) - Math.sin(k * Math.PI) * 30);
        const g = seg(tl, 3.3, 4.0);
        if (g > 0) line(X0, NY - 60 * g, X0, RY + 26, C.green, 3, [6, 5]);
        txt(['釘頭對齊 0', 'Head at 0'], 110, 262, 24, C.green, { a: g });
        const q = seg(tl, 5.0, 5.8);
        tipLine(q);
        if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.strokeStyle = C.pink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(TIP - 3, RY - 4, 30 + 4 * Math.sin(tl * 4), 0, TAU); ctx.stroke(); ctx.restore(); }
        txt(['尖端在哪裡？', 'Where is the tip?'], TIP - 3, 262, 26, C.pink, { a: q, w: 900 });
        txt(['鋼釘', 'Steel nail'], 450, 300, 24, C.white, { a: seg(tl, 3.0, 3.6) });
      } },
    { b: ['找尖端', 'Find tip'], dur: 10,
      title: ['尖端落在哪兩格之間？', 'Between which two marks?'],
      cap: ['這把尺的最小刻度是 0.1 cm。從 8 往右數 6 小格，尖端超過 8.6，還不到 8.7。', 'The smallest division is 0.1 cm. Count 6 marks past 8: the tip is beyond 8.6 but short of 8.7.'],
      draw(tl) {
        const n = Math.floor(clamp((tl - 2.0) / 0.55, 0, 6));
        base({ n, eight: tl > 1.0, next: tl > 6.0 });
        tipLine(1);
        const a = seg(tl, 1.0, 1.6);
        txt((8 + n / 10).toFixed(1) + ' cm', 500, 170, 52, C.green, { a, w: 900 });
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; arrow(cmx(8), 292, cmx(8), 330, C.green, 4); ctx.restore(); }
        const b = seg(tl, 6.0, 6.8);
        txt(['超過 8.6，還不到 8.7', 'Past 8.6, not yet 8.7'], 500, 240, 28, C.orange, { a: b, w: 900 });
        if (b > 0) { ctx.save(); ctx.globalAlpha = b; ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(TIP - 3, RY + 2, 26 + 3 * Math.sin(tl * 4), 0, TAU); ctx.stroke(); ctx.restore(); }
      } },
    { b: ['放大估計', 'Zoom in'], dur: 11,
      title: ['放大，再分成 10 等分', 'Zoom in and split into 10'],
      cap: ['把 8.6 到 8.7 這一小格放大，在心裡再分成 10 等分，尖端大約落在第 9 格。', 'Zoom in on the gap from 8.6 to 8.7 and imagine 10 equal parts. The tip is at about the 9th part.'],
      draw(tl) {
        base({ n: 6, eight: true, next: true });
        const z = seg(tl, 0.5, 2.0);
        const px = lerp(TIP - 30, 150, z), py = lerp(RY - 30, 98, z), pw = lerp(60, 700, z), ph = lerp(60, 196, z);
        ctx.save(); ctx.globalAlpha = 0.5 * z; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cmx(8.6), RY); ctx.lineTo(px + pw * 0.72, py + ph); ctx.moveTo(cmx(8.7), RY); ctx.lineTo(px + pw, py + ph - 8); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.fillStyle = C.deep; ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; rrect(px, py, pw, ph, 14); ctx.fill(); ctx.stroke(); ctx.restore();
        if (z >= 1) {
          const BX = 250, STEP = 50, BY = 212;
          const inn = seg(tl, 2.0, 2.6);
          ctx.save(); ctx.globalAlpha = inn;
          ctx.fillStyle = STEEL; ctx.strokeStyle = C.white; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(153, 142); ctx.lineTo(560, 142); ctx.lineTo(BX + 9 * STEP, 166); ctx.lineTo(560, 190); ctx.lineTo(153, 190); ctx.closePath(); ctx.fill(); ctx.stroke();
          line(180, 206, 820, 206, C.yel, 3);
          line(BX, 206, BX, 240, C.yel, 4); line(BX + 500, 206, BX + 500, 240, C.yel, 4);
          ctx.restore();
          txt('8.6', BX, 264, 26, C.yel, { a: inn, w: 900 }); txt('8.7', BX + 500, 264, 26, C.yel, { a: inn, w: 900 });
          txt(['1 小格再分 10 等分', 'Split 1 division into 10'], 500, 120, 22, C.cyan, { a: seg(tl, 2.6, 3.2) });
          for (let i = 1; i <= 9; i++) {
            const k = seg(tl, 2.8 + i * 0.3, 3.1 + i * 0.3); if (k <= 0) continue;
            const hot = i === 9 && tl > 6.6, x = BX + i * STEP;
            line(x, 206, x, 206 + 20 * k, hot ? C.orange : C.white, hot ? 4 : 2);
            txt(String(i), x, 250 + (hot ? Math.sin(tl * 5) * 2 : 0), hot ? 28 : 22, hot ? C.orange : C.dim, { a: k, w: hot ? 900 : 700 });
          }
          const tp = seg(tl, 6.2, 6.8);
          if (tp > 0) line(BX + 9 * STEP, 166, BX + 9 * STEP, lerp(166, 226, tp), C.pink, 3, [5, 4]);
        }
        tipLine(1);
      } },
    { b: ['準確估計', 'Two parts'], dur: 10,
      title: ['準確值＋估計值', 'Exact part + estimated part'],
      cap: ['刻度直接讀到的是準確值 8.6 cm；最小刻度的下一位用估計，是估計值 0.09 cm。', 'The marks give the exact part, 8.6 cm. One more digit is estimated by eye: 0.09 cm.'],
      draw(tl) {
        base({ n: 6, eight: true, next: false });
        tipLine(1);
        const a = seg(tl, 0.6, 1.4), b = seg(tl, 4.0, 4.8);
        if (a > 0) line(X0, RY - 5, lerp(X0, cmx(8.6), seg(tl, 0.8, 3.0)), RY - 5, C.green, 6);
        if (b > 0) { ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = C.orange; ctx.fillRect(cmx(8.6), RY - 9, TIP - cmx(8.6), 8); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(TIP - 3, RY - 5, 22 + 3 * Math.sin(tl * 4), 0, TAU); ctx.stroke(); ctx.restore(); }
        txt(['準確值', 'Exact part'], 290, 122, 28, C.green, { a, w: 900 });
        txt('8.6 cm', 290, 186, 52, C.green, { a, w: 900 });
        txt(['刻度上直接讀到', 'Read straight off the marks'], 290, 248, 22, C.white, { a: seg(tl, 1.6, 2.4) });
        txt('＋', 500, 186, 44, C.white, { a: b, w: 900 });
        txt(['估計值', 'Estimated part'], 710, 122, 28, C.orange, { a: b, w: 900 });
        txt('0.09 cm', 710, 186, 52, C.orange, { a: b, w: 900 });
        txt(['最小刻度的下一位', 'One digit past the marks'], 710, 248, 22, C.white, { a: seg(tl, 5.0, 5.8) });
      } },
    { b: ['記錄', 'Record'], dur: 10,
      title: ['記錄：數字＋單位', 'Record: number + unit'],
      cap: ['測量結果＝準確值＋一位估計值，寫成 8.69 cm。數字後面一定要寫單位。', 'Result = exact part + one estimated digit: 8.69 cm. A number must always come with its unit.'],
      draw(tl) {
        base({ n: 6, eight: true, next: false });
        tipLine(1);
        line(X0, RY - 5, cmx(8.6), RY - 5, C.green, 6);
        ctx.fillStyle = C.orange; ctx.fillRect(cmx(8.6), RY - 9, TIP - cmx(8.6), 8);
        const a = seg(tl, 0.5, 1.2), m = seg(tl, 2.0, 3.2), r = seg(tl, 3.0, 3.8);
        const yy = lerp(186, 120, m), sz = Math.round(lerp(52, 30, m));
        txt('8.6 cm', lerp(290, 400, m), yy, sz, C.green, { a, w: 900 });
        txt('＋', 500, yy, Math.round(lerp(44, 28, m)), C.white, { a, w: 900 });
        txt('0.09 cm', lerp(710, 608, m), yy, sz, C.orange, { a, w: 900 });
        txt('8.69', 520, 206, 68, C.yel, { a: r, w: 900, align: 'right' });
        txt('cm', 544, 206, 68, C.cyan, { a: r, w: 900, align: 'left' });
        const u = seg(tl, 5.0, 5.8);
        if (u > 0) { ctx.save(); ctx.globalAlpha = u; line(368, 252, 520, 252, C.yel, 4); line(544, 252, 644, 252, C.cyan, 4); ctx.restore(); }
        txt(['數字', 'Number'], 444, 282, 24, C.yel, { a: u }); txt(['單位', 'Unit'], 594, 282, 24, C.cyan, { a: u });
        check(700, 200, 24, seg(tl, 6.4, 7.2), C.green, 9);
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
