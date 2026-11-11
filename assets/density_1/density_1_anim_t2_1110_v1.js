/* density_1_anim_t2_1110_v1.js — density_1「長度測量」分頁動畫：眼見真能為憑嗎？（畫布邏輯 1000×600）
 *
 * 契約：window.DenAnim.t2 = { start(canvas, lang), stop(), setLang(lang), goStep(i, stopAfter), setStopAfter(b),
 *                             pause(b), info(), onStep, onEnd, _frameAt(t), _texts(), _state() }
 * 畫面是「時間 t 的純函式」；每步播完停在最後一幀（stopAfter＝true），false 則連播到底。進度條用 window.AnimBar。
 * 線條幾何沿用原頁 illusionCanvas（700 寬）：甲、乙都從 x=200 到 x=500，箭頭 ±40／±30；本檔以 X=45+1.3x 等比放大。
 * 步驟（共 49 s）：
 *   1 猜猜看  9 s   畫出甲（箭頭向外）、乙（箭頭向內），輪流閃亮＋問號
 *   2 量甲線 10 s   直尺滑到甲線下，0 → 300 掃過
 *   3 量乙線 10 s   直尺下移到乙線，0 → 300 掃過
 *   4 一樣長 10 s   兩端對齊虛線、箭頭淡出再回來
 *   5 小結   10 s   只憑感覺 ✗／刻度＋統一單位 ✓
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

  // ───────── t2 眼見真能為憑嗎？ ─────────
  const KEY = 't2';
  const K = 1.3, X = (x) => 45 + K * x;             // 原頁 700 寬座標 → 本畫布
  const XA = X(200), XB = X(500), FX = 40 * K, FY = 30 * K;   // 305、695；箭頭 52×39
  const YA = 160, YB = 340, PX = (XB - XA) / 300;   // 每 1 單位的像素

  // 一條線：dir=+1 箭頭向外張（甲）、−1 向內（乙）；k 線段畫出比例；fa 箭頭透明度
  function mline(y, dir, k, fa, col) {
    if (k <= 0) return;
    ctx.save(); ctx.strokeStyle = col || C.white; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(XA, y); ctx.lineTo(lerp(XA, XB, clamp(k, 0, 1)), y); ctx.stroke();
    const f = clamp(k - 1, 0, 1);
    if (f > 0 && fa > 0) {
      ctx.globalAlpha = fa;
      ctx.beginPath(); ctx.moveTo(XA - dir * FX * f, y - FY * f); ctx.lineTo(XA, y); ctx.lineTo(XA - dir * FX * f, y + FY * f); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(XB + dir * FX * f, y - FY * f); ctx.lineTo(XB, y); ctx.lineTo(XB + dir * FX * f, y + FY * f); ctx.stroke();
    }
    ctx.restore();
  }
  function names(a) {
    txt(['甲', 'A'], 130, YA, 32, C.yel, { a, w: 900 });
    txt(['乙', 'B'], 130, YB, 32, C.yel, { a, w: 900 });
  }
  function both(fa) { mline(YA, 1, 2, fa); mline(YB, -1, 2, fa); names(1); }
  function ruler(x0, y) {                           // x0＝刻度 0 的 x；y＝尺的上緣
    ctx.save();
    ctx.fillStyle = 'rgba(253,224,71,0.16)'; ctx.strokeStyle = C.yel; ctx.lineWidth = 3;
    rrect(x0 - 28, y, 390 + 56, 54, 6); ctx.fill(); ctx.stroke();
    for (let u = 0; u <= 300; u += 10) line(x0 + u * PX, y, x0 + u * PX, y + (u % 50 === 0 ? 18 : 10), C.yel, u % 50 === 0 ? 3 : 2);
    ctx.restore();
    for (let u = 0; u <= 300; u += 100) if (x0 + u * PX < 955) txt(String(u), x0 + u * PX, y + 37, 22, C.yel);
  }
  // 量測：兩端對齊虛線＋綠色掃描＋讀數
  function measure(y, ry, tl, name) {
    const g = seg(tl, 2.7, 3.4), k = seg(tl, 3.8, 7.0);
    if (g > 0) { line(XA, y, XA, lerp(y, ry, g), C.green, 3, [7, 7]); }
    if (k > 0) {
      line(XA, y, lerp(XA, XB, k), y, C.green, 7);
      line(lerp(XA, XB, k), y, lerp(XA, XB, k), ry, C.green, 3, [7, 7]);
      result(y, name, Math.round(300 * k / 10) * 10, k >= 1 ? C.green : C.white);
    }
  }
  function result(y, name, v, col) { txt([name[0] + ' ＝ ' + v, name[1] + ' = ' + v], 870, y, 30, col || C.green, { w: 900 }); }
  const NA = ['甲', 'A'], NB = ['乙', 'B'];

  function card(x, col, k) {
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = C.deep; ctx.strokeStyle = col; ctx.lineWidth = 3;
    rrect(x, 105, 410, 350, 18); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  const STEPS = [
    { b: ['猜猜看', 'Guess'], dur: 9,
      title: ['哪一條比較長？', 'Which line is longer?'],
      cap: ['兩條粉筆線，兩端的箭頭方向不同。先用眼睛猜：甲和乙哪一條比較長？', 'Two chalk lines with different arrowheads. Guess by eye first: which is longer, A or B?'],
      draw(tl) {
        const hl = tl > 5.2 ? Math.sin((tl - 5.2) * 2.2) : 0, on = seg(tl, 5.2, 5.8);
        mline(YA, 1, lin(tl, 0.4, 1.8) + lin(tl, 1.8, 2.4), 1, hl > 0.3 && on ? C.yel : C.white);
        mline(YB, -1, lin(tl, 2.6, 4.0) + lin(tl, 4.0, 4.6), 1, hl < -0.3 && on ? C.yel : C.white);
        txt(['甲', 'A'], 130, YA, 32, C.yel, { a: seg(tl, 0.2, 0.7), w: 900 });
        txt(['乙', 'B'], 130, YB, 32, C.yel, { a: seg(tl, 2.4, 2.9), w: 900 });
        txt('？', 870, 250, Math.round(84 + 10 * Math.sin(tl * 3)), C.pink, { a: on, w: 900 });
      } },
    { b: ['量甲線', 'Measure A'], dur: 10,
      title: ['用直尺量甲線', 'Measure line A with a ruler'],
      cap: ['把直尺靠在甲線旁，一端對準 0，另一端剛好落在 300。', 'Lay the ruler along line A. One end sits at 0, and the other end lands exactly on 300.'],
      draw(tl) {
        both(1);
        ruler(lerp(1080, XA, seg(tl, 0.5, 2.4)), 215);
        measure(YA, 215, tl, NA);
      } },
    { b: ['量乙線', 'Measure B'], dur: 10,
      title: ['直尺移到乙線', 'Move the ruler to line B'],
      cap: ['直尺移到乙線，同樣從 0 量起，另一端也落在 300。', 'Move the ruler to line B and start from 0 again. The other end also lands on 300.'],
      draw(tl) {
        both(1);
        result(YA, NA, 300);
        ruler(XA, lerp(215, 395, seg(tl, 0.5, 2.4)));
        measure(YB, 395, tl, NB);
      } },
    { b: ['一樣長', 'Same'], dur: 10,
      title: ['其實一樣長', 'They are the same length'],
      cap: ['兩條線其實一樣長！向外張開的箭頭讓甲看起來比較長，這是視覺上的錯覺。', 'The two lines are exactly the same length! The outward arrowheads make A look longer — an optical illusion.'],
      draw(tl) {
        const out = seg(tl, 0.3, 1.5);
        if (out < 1) ruler(XA + out * 800, 395);
        const g = seg(tl, 1.5, 3.0);
        if (g > 0) { line(XA, 108, XA, lerp(108, 400, g), C.green, 3, [8, 8]); line(XB, 108, XB, lerp(108, 400, g), C.green, 3, [8, 8]); }
        both(1 - 0.88 * (seg(tl, 3.4, 4.6) - seg(tl, 7.4, 8.6)));
        result(YA, NA, 300); result(YB, NB, 300);
        txt(['一樣長！', 'Same length!'], 500, 250, 32, C.pink, { a: seg(tl, 4.6, 5.3), w: 900 });
      } },
    { b: ['小結', 'Summary'], dur: 10,
      title: ['眼睛會騙人，刻度不會', 'Eyes can be fooled; a scale cannot'],
      cap: ['眼睛會騙人。要比較長短，就用有刻度的工具，再配上大家統一的單位。', 'Our eyes can be fooled. To compare lengths, use a tool with a scale and a unit that everyone agrees on.'],
      draw(tl) {
        const k1 = seg(tl, 0.4, 1.2), k2 = seg(tl, 4.2, 5.0);
        card(60, C.pink, k1);
        if (k1 > 0.02) {
          ctx.save(); ctx.globalAlpha = k1; ctx.strokeStyle = C.white; ctx.lineWidth = 5; ctx.lineJoin = 'round';
          const ex = 265 + Math.sin(tl * 1.6) * 10;
          ctx.beginPath(); ctx.moveTo(185, 200); ctx.quadraticCurveTo(265, 140, 345, 200); ctx.quadraticCurveTo(265, 260, 185, 200); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(ex, 200, 24, 0, TAU); ctx.fill();
          ctx.fillStyle = C.deep; ctx.beginPath(); ctx.arc(ex, 200, 10, 0, TAU); ctx.fill();
          ctx.restore();
          cross(265, 200, 46, seg(tl, 2.2, 3.0), C.pink, 9);
          txt(['只憑感覺', 'By eye only'], 265, 300, 28, C.pink, { a: k1, w: 900 });
          para(['甲看起來比較長\n每個人猜的都不同', 'A just looks longer\nEveryone guesses differently'], 265, 356, 24, C.white, 370, { a: seg(tl, 1.4, 2.2) });
        }
        card(530, C.green, k2);
        if (k2 > 0.02) {
          ctx.save(); ctx.globalAlpha = k2; ctx.fillStyle = 'rgba(253,224,71,0.16)'; ctx.strokeStyle = C.yel; ctx.lineWidth = 3;
          rrect(605, 176, 260, 48, 6); ctx.fill(); ctx.stroke();
          for (let i = 0; i <= 24; i++) line(617 + i * 9.8, 176, 617 + i * 9.8, 176 + (i % 4 === 0 ? 18 : 10), C.yel, 2);
          ctx.restore();
          const sx = 617 + 235 * (0.5 + 0.5 * Math.sin(tl * 1.6));
          ctx.save(); ctx.globalAlpha = k2; line(sx, 150, sx, 176, C.green, 4); ctx.restore();
          check(890, 196, 22, seg(tl, 6.2, 7.0), C.green, 8);
          txt(['刻度＋統一單位', 'Scale + shared unit'], 735, 300, 28, C.green, { a: k2, w: 900 });
          para(['甲 ＝ 300，乙 ＝ 300\n誰來量結果都一樣', 'A = 300, B = 300\nSame result for everyone'], 735, 356, 24, C.white, 370, { a: seg(tl, 5.2, 6.0) });
        }
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
