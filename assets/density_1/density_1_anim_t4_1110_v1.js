/* density_1_anim_t4_1110_v1.js — density_1「長度測量」分頁動畫：刻度愈密愈準（畫布邏輯 1000×600）
 *
 * 契約：window.DenAnim.t4 = { start(canvas, lang), stop(), setLang(lang), goStep(i, stopAfter), setStopAfter(b),
 *                             pause(b), info(), onStep, onEnd, _frameAt(t), _texts(), _state() }
 * 畫面是「時間 t 的純函式」；每步播完停在最後一幀（stopAfter＝true），false 則連播到底。進度條用 window.AnimBar。
 * 幾何：120 px/cm，0 在 x=130；黃色鉛筆長 5.75 cm（筆尖 x=820）。尺 A 最小刻度 1 cm（黃），尺 B 最小刻度 0.1 cm（青）。
 * 步驟（共 50 s）：
 *   1 尺 A     9 s  鉛筆＋尺 A，筆尾對齊 0
 *   2 讀尺 A  10 s  筆尖在 5 與 6 之間 → 5.8 cm
 *   3 換尺 B   9 s  尺 A 退場、尺 B 進場（每 1 cm 分 10 小格）
 *   4 讀尺 B  11 s  放大 5.7～5.8 → 5.75 cm
 *   5 比一比  11 s  兩把尺並排：5.8 cm 對 5.75 cm，刻度愈密愈準確
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

  // ───────── t4 刻度愈密愈準 ─────────
  const KEY = 't4';
  const X0 = 130, PX = 120, LEN = 5.75;
  const cmx = (v) => X0 + v * PX, TIP = cmx(LEN);
  const PY = 300, RY = 330;                          // 鉛筆中心 y、尺上緣 y

  // kind 'A'（只有公分線）／'B'（毫米線）；o：{ hi:[亮起的公分數], est:假想等分透明度, est8:第 8 等分亮, sweep:掃過的毫米位置, mmHi:[亮起的毫米] }
  function ruler(kind, y, a, o) {
    if (a <= 0.02) return;
    o = o || {};
    const col = kind === 'A' ? C.yel : C.cyan;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = kind === 'A' ? 'rgba(253,224,71,0.14)' : 'rgba(85,233,255,0.12)'; ctx.strokeStyle = col; ctx.lineWidth = 3;
    rrect(X0 - 16, y, 7 * PX + 32, 70, 6); ctx.fill(); ctx.stroke();
    for (let m = 0; m <= 70; m++) {
      const big = m % 10 === 0;
      if (kind === 'A' && !big) continue;
      const x = X0 + m * 12, hot = (o.mmHi && o.mmHi.indexOf(m) >= 0) || (o.hi && big && o.hi.indexOf(m / 10) >= 0);
      const glint = o.sweep !== undefined && Math.abs(m - o.sweep) < 2.5 && !big;
      line(x, y, x, y + (big ? 26 : m % 5 === 0 ? 18 : 11), hot ? C.green : glint ? C.white : col, big || hot || glint ? 3 : 2);
    }
    if (o.est) for (let i = 1; i <= 9; i++) { ctx.globalAlpha = a * o.est * (o.est8 && i === 8 ? 1 : 0.55); line(cmx(5) + i * 12, y, cmx(5) + i * 12, y + 12, o.est8 && i === 8 ? C.orange : C.white, o.est8 && i === 8 ? 3 : 1.5, [3, 3]); }
    ctx.restore();
    for (let c = 0; c <= 7; c++) { const hot = o.hi && o.hi.indexOf(c) >= 0; txt(String(c), cmx(c), y + 50, 22, hot ? C.green : col, { a, w: hot ? 900 : 700 }); }
  }
  function pencil(dx, dy) {
    ctx.save(); ctx.translate(dx || 0, dy || 0);
    const y1 = PY - 13, h = 26;
    ctx.fillStyle = C.pink; rrect(X0, y1, 22, h, 5); ctx.fill();
    ctx.fillStyle = '#c9d3d6'; ctx.fillRect(X0 + 20, y1, 14, h);
    ctx.fillStyle = C.yel; ctx.fillRect(X0 + 34, y1, TIP - 62 - X0 - 34, h);
    ctx.fillStyle = 'rgba(180,140,20,0.55)'; ctx.fillRect(X0 + 34, PY + 4, TIP - 62 - X0 - 34, 4);
    ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.moveTo(TIP - 62, y1); ctx.lineTo(TIP - 16, PY - 3.4); ctx.lineTo(TIP - 16, PY + 3.4); ctx.lineTo(TIP - 62, y1 + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4b5563'; ctx.beginPath(); ctx.moveTo(TIP - 16, PY - 3.4); ctx.lineTo(TIP, PY); ctx.lineTo(TIP - 16, PY + 3.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function tipLine(k, y1, y2) { if (k > 0) line(TIP, y1, TIP, lerp(y1, y2, k), C.pink, 2.5, [5, 4]); }
  const TAG_A = ['尺 A：最小刻度 1 cm', 'Ruler A: smallest division 1 cm'], TAG_B = ['尺 B：最小刻度 0.1 cm', 'Ruler B: smallest division 0.1 cm'];

  const STEPS = [
    { b: ['尺 A', 'Ruler A'], dur: 9,
      title: ['先用尺 A 量鉛筆', 'Measure the pencil with ruler A'],
      cap: ['一枝黃色鉛筆，先用尺 A 來量。尺 A 每隔 1 cm 才有一條刻度線。', 'A yellow pencil, measured first with ruler A. Ruler A has a mark only every 1 cm.'],
      draw(tl) {
        const r = seg(tl, 0.4, 1.4);
        ruler('A', RY + (1 - r) * 30, r);
        const k = seg(tl, 1.4, 3.4);
        pencil(lerp(-760, 0, k), 0);
        txt(TAG_A, 500, 130, 28, C.yel, { a: seg(tl, 3.4, 4.2), w: 900 });
        const g = seg(tl, 4.6, 5.3);
        if (g > 0) line(X0, PY - 60 * g, X0, RY + 26, C.green, 3, [6, 5]);
        txt(['筆尾對齊 0', 'End at 0'], 130, 218, 24, C.green, { a: g });
        const q = seg(tl, 6.2, 7.0);
        tipLine(q, PY, RY + 26);
        txt(['筆尖在哪裡？', 'Where is the tip?'], TIP, 218, 26, C.pink, { a: q, w: 900 });
      } },
    { b: ['讀尺 A', 'Read A'], dur: 10,
      title: ['尺 A 的讀數', 'Reading ruler A'],
      cap: ['筆尖落在 5 和 6 之間。5 是準確值，再估一位大約 0.8，記成 5.8 cm。', 'The tip lies between 5 and 6. The 5 is exact; estimate one more digit, about 0.8, and record 5.8 cm.'],
      draw(tl) {
        ruler('A', RY, 1, { hi: tl > 1 ? [5, 6] : null, est: seg(tl, 2.6, 3.6), est8: tl > 4.6 });
        pencil(); tipLine(1, PY, RY + 26);
        txt(TAG_A, 500, 120, 28, C.yel, { w: 900 });
        const a = seg(tl, 1.0, 1.7);
        txt(tl < 5 ? '5.? cm' : '5.8 cm', 500, 190, 52, tl < 5 ? C.white : C.yel, { a, w: 900 });
        txt(['準確值 5 ＋ 估計值 0.8', 'Exact 5 + estimated 0.8'], 500, 248, 24, C.white, { a: seg(tl, 5.4, 6.2) });
      } },
    { b: ['換尺 B', 'Ruler B'], dur: 9,
      title: ['換一把刻度更密的尺 B', 'Switch to the finer ruler B'],
      cap: ['換成尺 B。尺 B 把每 1 cm 再分成 10 小格，最小刻度是 0.1 cm。', 'Switch to ruler B. It divides each centimetre into 10 parts, so its smallest division is 0.1 cm.'],
      draw(tl) {
        const o = seg(tl, 0.4, 1.4), i = seg(tl, 1.7, 2.8);
        ruler('A', RY + o * 30, 1 - o);
        ruler('B', RY + (1 - i) * 30, i, { sweep: tl > 3.4 && tl < 7.4 ? (tl - 3.4) / 4 * 74 - 2 : undefined });
        pencil(); if (i >= 1) tipLine(1, PY, RY + 26);
        txt(TAG_A, 500, 120, 28, C.yel, { a: 1 - seg(tl, 0.4, 1.2), w: 900 });
        txt(TAG_B, 500, 120, 28, C.cyan, { a: seg(tl, 1.9, 2.7), w: 900 });
        txt(['每 1 cm 再分成 10 小格', 'Each 1 cm is split into 10 parts'], 500, 195, 26, C.white, { a: seg(tl, 3.6, 4.4) });
      } },
    { b: ['讀尺 B', 'Read B'], dur: 11,
      title: ['尺 B 的讀數', 'Reading ruler B'],
      cap: ['筆尖落在 5.7 和 5.8 之間。5.7 是準確值，再估一位 0.05，記成 5.75 cm。', 'The tip lies between 5.7 and 5.8. The 5.7 is exact; estimate one more digit, 0.05, and record 5.75 cm.'],
      draw(tl) {
        ruler('B', RY, 1, { hi: [5], mmHi: tl > 1 ? [57, 58] : null });
        pencil(); tipLine(1, PY, RY + 26);
        txt(TAG_B, 500, 116, 28, C.cyan, { w: 900 });
        const z = seg(tl, 1.4, 2.6);
        if (z > 0) {
          const px = lerp(TIP - 30, 250, z), py = lerp(RY - 20, 146, z), pw = lerp(60, 500, z), ph = lerp(50, 132, z);
          ctx.save(); ctx.globalAlpha = 0.5 * z; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cmx(5.7), RY); ctx.lineTo(px + pw * 0.8, py + ph); ctx.moveTo(cmx(5.8), RY); ctx.lineTo(px + pw, py + ph - 8); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.fillStyle = C.deep; ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; rrect(px, py, pw, ph, 14); ctx.fill(); ctx.stroke(); ctx.restore();
        }
        if (z >= 1) {
          const inn = seg(tl, 2.6, 3.2);
          ctx.save(); ctx.globalAlpha = inn;
          ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.moveTo(253, 152); ctx.lineTo(400, 172); ctx.lineTo(400, 196); ctx.lineTo(253, 216); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#4b5563'; ctx.beginPath(); ctx.moveTo(400, 172); ctx.lineTo(500, 184); ctx.lineTo(400, 196); ctx.closePath(); ctx.fill();
          line(270, 224, 730, 224, C.cyan, 3); line(350, 224, 350, 246, C.green, 4); line(650, 224, 650, 246, C.green, 4);
          ctx.restore();
          txt('5.7', 350, 262, 24, C.green, { a: inn, w: 900 }); txt('5.8', 650, 262, 24, C.green, { a: inn, w: 900 });
          const e = seg(tl, 4.4, 5.2);
          if (e > 0) { ctx.save(); ctx.globalAlpha = e; for (let i = 1; i <= 9; i++) line(350 + i * 30, 224, 350 + i * 30, i === 5 ? 244 : 236, i === 5 ? C.orange : C.white, i === 5 ? 4 : 1.5); ctx.restore(); line(500, 184, 500, 224, C.pink, 3, [5, 4]); }
          txt('5', 500, 262, 24, C.orange, { a: e, w: 900 });
        }
        para(['準確值 5.7\n估計值 0.05', 'Exact 5.7\nEstimated 0.05'], 36, 196, 24, C.white, 205, { align: 'left', a: seg(tl, 5.6, 6.4) });
        txt('5.75 cm', 872, 212, 44, C.yel, { a: seg(tl, 7.0, 7.8), w: 900 });
      } },
    { b: ['比一比', 'Compare'], dur: 11,
      title: ['刻度愈密，量得愈準', 'Finer marks, better precision'],
      cap: ['同一枝鉛筆，尺 A 只能記到 5.8 cm，尺 B 可以記到 5.75 cm。刻度愈密，讀數的位數愈多、愈準確。', 'Same pencil: ruler A gives 5.8 cm, ruler B gives 5.75 cm. Finer marks give more digits and a more precise reading.'],
      draw(tl) {
        const m = seg(tl, 0.4, 1.6), a = seg(tl, 1.4, 2.4);
        ruler('B', RY, 1, { hi: [5], mmHi: [57, 58] });
        ruler('A', lerp(RY, 245, m) , a, { hi: [5, 6] });
        pencil(0, lerp(0, -85, m));
        tipLine(1, PY - 85 * m, RY + 26);
        txt('A', 78, 280, 30, C.yel, { a, w: 900 }); txt('B', 78, 365, 30, C.cyan, { a: seg(tl, 1.6, 2.4), w: 900 });
        const ra = seg(tl, 3.0, 3.8), rb = seg(tl, 5.0, 5.8);
        txt(['尺 A → 5.8 cm', 'Ruler A → 5.8 cm'], 270, 116, 30, C.yel, { a: ra, w: 900 });
        txt(['只能估到 0.1 cm', 'estimate to 0.1 cm'], 270, 160, 24, C.white, { a: ra });
        txt(['尺 B → 5.75 cm', 'Ruler B → 5.75 cm'], 730, 116, 30, C.cyan, { a: rb, w: 900 });
        txt(['可以估到 0.01 cm', 'estimate to 0.01 cm'], 730, 160, 24, C.white, { a: rb });
        txt(['刻度愈密 → 位數愈多 → 愈準確', 'Finer marks → more digits → more precise'], 500, 440, 28, C.green, { a: seg(tl, 7.2, 8.0), w: 900 });
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
