/* galvanic_batteries_4_redox_1106_v1.js — 「氧化與還原」分頁動畫（#redoxAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.redox = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'redox'。畫布不綁事件；唯一控制是 #steps-redox 的 5 個步驟鈕；結果框 #redoxAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的 C、label、line…）。
 * 畫面是「場景時間 t 的純函式」：原子、離子、電子位置都只由 t 算出。
 * 畫風、金屬用色、字級與版面沿用同課的 galvani／volta／origin 三支（離子＝橘色膠囊、深色字）。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。左右兩個燒杯（簡化示意）：左杯 x 40–270（近無色溶液、鋅片 x 100–140），
 *   右杯 x 370–600（深藍綠溶液、銅片 x 530–570）；杯口 y=250、杯底 y=470、液面 y=290；電極 y 175–445。
 *   外導線（第 3 步起）：鋅片頂 → y=140 → 銅片頂。兩杯之間第 3 步起畫虛線「？」：分開的兩杯還缺一樣東西（下個分頁）。
 *   鋅原子在鋅片右側表面 (162,375)，離開後成為 Zn²⁺ 停在 (215,375)；Cu²⁺ 由 (420,375) 靠近銅片，成為銅原子貼在 (508,375)。
 *   右欄 x 640–980：本步重點（反應式、標註）；下方 y≈506/536：本步一句；y≈560/586：圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只畫在金屬（鋅片、銅片、原子交界）與外導線裡，從不進溶液：鋅原子在鋅片表面把電子留在鋅片，
 *   銅離子要碰到銅片表面才接收電子。橘色膠囊＝正離子（Zn²⁺、Cu²⁺），只在溶液裡。
 *   數字只用 2；不寫電壓、電位；不出現「氧化劑／還原劑」。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 氧化      9 s  鋅原子在鋅片表面留下 2 顆電子、離開成為 Zn²⁺；反應式 Zn → Zn²⁺ + 2e⁻ 逐項出現，框出右邊的 2e⁻＝送出
 *   2 還原      9 s  2 顆電子進到銅片；Cu²⁺ 靠近銅片接收電子，成為銅原子貼在銅片上；Cu²⁺ + 2e⁻ → Cu，框出左邊的 2e⁻＝接收
 *   3 電子路徑  8 s  外導線接上；一對一對電子由鋅片經外導線走到銅片；標「來源」「去處」；電子只走金屬與導線
 *   4 守恆      8 s  兩片電極各 2 個電子槽：鋅片的 2 個電子經導線搬到銅片；右欄同步：一邊少兩個、另一邊多兩個
 *   5 同時發生  8 s  氧化與還原一定同時發生；只有失去沒有得到，電子沒地方去；兩杯間的「？」發亮，帶出下個分頁
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解），到底時呼叫一次 GbAnim.ctl.onEnd()。
 * GbAnim.ctl.paused 為真時時間凍住。分頁被隱藏（canvas offsetWidth＝0）時不跑 rAF，每 250ms 檢查一次。
 * 進度條呼叫共用 window.AnimBar.draw（畫布頂端 y=8～24），沒載入時退回細線。
 */
(function () {
  'use strict';
  window.GbAnim = window.GbAnim || {};
  window.GbAnim.ctl = window.GbAnim.ctl || { paused: false, onEnd: null };

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    zn: '#b9c6cc', znHi: '#e4ecef', znLo: '#7b8a91',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    if (s.indexOf('\n') >= 0) return s.split('\n').reduce((a, part) => a.concat(wrap(ctx, part, maxW, size)), []);
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
  function text(ctx, s, x, y, color, size, align, alpha, m) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size, m); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 由上往下排的段落：第一行中心在 y，回傳下一段可用的 y
  function block(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(ctx, l, x, y + k * h, color, size, align, alpha));
    return y + ls.length * h;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  // ───────── 路徑工具 ─────────
  function mkPath(pts) {
    const seg = []; let L = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1e-6) continue;
      seg.push({ a, b, len, s0: L, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }); L += len;
    }
    return { pts, seg, L };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u };
  }
  function partial(pts, k) {                    // 沿折線畫到比例 k
    const P = mkPath(pts), len = P.L * clamp(k, 0, 1), out = [pts[0]];
    if (len <= 0) return [];
    for (const q of P.seg) {
      if (len >= q.s0 + q.len) out.push(q.b);
      else { out.push(at(P, len)); break; }
    }
    return out;
  }

  // ───────── 幾何 ─────────
  const BRIM = 250, BBOT = 470, LIQ = 290;
  const CUPS = [{ x0: 40, x1: 270, sol: 'rgba(205,228,232,0.10)' },       // 左：近無色
    { x0: 370, x1: 600, sol: 'rgba(28,128,140,0.46)' }];                    // 右：深藍綠
  const ZX = 120, CX = 550, EW = 40, ETOP = 175, EBOT = 445;              // 電極中心 x、寬、上下
  const WY = 140;                                                          // 外導線高度
  const AY = 375;                                                          // 原子／離子所在高度
  const ZN_ATOM = { x: ZX + EW / 2 + 22, y: AY }, ZN_ION = { x: 215, y: AY };
  const CU_ION0 = { x: 420, y: AY }, CU_ATOM = { x: CX - EW / 2 - 22, y: AY };
  const ATOM_R = 22;
  const E_PATH = mkPath([{ x: ZX, y: 385 }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: 385 }]);
  const WIRE = [{ x: ZX, y: ETOP - 2 }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: ETOP - 2 }];
  const SLOT_Y = [205, 252];                                               // 第 4 步：電極上的電子槽
  const BR = { x0: 245, x1: 395, top: 205, bot: 330 };                     // 兩杯之間的「？」虛線
  const RX = 640, RW = 340, RC = RX + RW / 2;                              // 右欄

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 9, b: ['氧化', 'Oxidation'],
      cap: ['氧化：鋅原子失去 2 個電子，成為鋅離子', 'Oxidation: a Zn atom loses 2 electrons and becomes Zn²⁺'],
      res: ['氧化＝失去電子：鋅片表面的鋅原子失去 2 個電子，成為鋅離子 Zn²⁺。反應式 Zn → Zn²⁺ ＋ 2e⁻ 裡，電子寫在箭頭右邊，表示「送出 2 個電子」。',
        'Oxidation = losing electrons: a zinc atom on the plate surface loses 2 electrons and becomes a zinc ion, Zn²⁺. In Zn → Zn²⁺ + 2e⁻ the electrons are on the right of the arrow: it releases 2 electrons.'] },
    { dur: 9, b: ['還原', 'Reduction'],
      cap: ['還原：銅離子得到 2 個電子，成為銅原子', 'Reduction: a Cu²⁺ ion gains 2 electrons and becomes a Cu atom'],
      res: ['還原＝得到電子：銅離子 Cu²⁺ 靠近銅片，得到 2 個電子，成為銅原子，貼在銅片上。反應式 Cu²⁺ ＋ 2e⁻ → Cu 裡，電子寫在箭頭左邊，表示「接收 2 個電子」。',
        'Reduction = gaining electrons: a Cu²⁺ ion reaches the copper plate, gains 2 electrons and becomes a copper atom on the plate. In Cu²⁺ + 2e⁻ → Cu the electrons are on the left of the arrow: it gains 2 electrons.'] },
    { dur: 8, b: ['電子路徑', 'e⁻ path'],
      cap: ['電子的路徑：從鋅片經外導線走到銅片', 'The electrons\' path: from the Zn plate through the wire to the Cu plate'],
      res: ['鋅片送出的電子，經外導線走到銅片：鋅片是電子的來源，銅片是電子的去處。電子只在金屬與導線裡走，不進溶液。',
        'Electrons released at the zinc plate travel through the outer wire to the copper plate: zinc is where they come from, copper is where they go. Electrons travel only in metal and wire, never into the solution.'] },
    { dur: 8, b: ['守恆', 'Conserve'],
      cap: ['電子數守恆：失去 2 個＝得到 2 個', 'Electron conservation: lost 2 = gained 2'],
      res: ['電子數守恆：鋅失去 2 個電子，銅離子就得到 2 個電子。一邊少兩個，另一邊就多兩個，電子不會憑空出現或消失。',
        'Electron conservation: zinc loses 2 electrons and the copper ion gains 2. One side has two fewer, the other has two more — electrons never appear or vanish out of nowhere.'] },
    { dur: 8, b: ['同時發生', 'Together'],
      cap: ['氧化與還原一定同時發生', 'Oxidation and reduction always happen together'],
      res: ['氧化與還原一定同時發生：只有失去、沒有得到，電子就沒地方去。下一個分頁「鋅銅電池與鹽橋」：兩邊放在不同燒杯時，需要什麼讓溶液維持電中性？',
        'Oxidation and reduction always happen together: losing without gaining would leave the electrons nowhere to go. Next tab, Zn-Cu cell & bridge: when the two sides sit in separate beakers, what keeps each solution electrically neutral?'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 圖形：燒杯、溶液、電極 ─────────
  function beakerPath(ctx, c) {
    const x0 = c.x0, x1 = c.x1;
    ctx.beginPath();
    ctx.moveTo(x0 - 8, BRIM - 6); ctx.quadraticCurveTo(x0, BRIM - 4, x0, BRIM + 8);
    ctx.lineTo(x0, BBOT - 16); ctx.quadraticCurveTo(x0, BBOT, x0 + 16, BBOT);
    ctx.lineTo(x1 - 16, BBOT); ctx.quadraticCurveTo(x1, BBOT, x1, BBOT - 16);
    ctx.lineTo(x1, BRIM + 8); ctx.quadraticCurveTo(x1, BRIM - 4, x1 + 8, BRIM - 6);
  }
  function innerClip(ctx, c, yTop) {
    const x0 = c.x0, x1 = c.x1;
    ctx.beginPath();
    ctx.moveTo(x0 + 2, yTop); ctx.lineTo(x0 + 2, BBOT - 16); ctx.quadraticCurveTo(x0 + 2, BBOT - 2, x0 + 16, BBOT - 2);
    ctx.lineTo(x1 - 16, BBOT - 2); ctx.quadraticCurveTo(x1 - 2, BBOT - 2, x1 - 2, BBOT - 16); ctx.lineTo(x1 - 2, yTop); ctx.closePath();
  }
  function beakerBack(ctx, c) {
    ctx.save(); innerClip(ctx, c, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore();
  }
  function liquid(ctx, c) {
    ctx.save(); innerClip(ctx, c, LIQ); ctx.fillStyle = c.sol; ctx.fill();
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ); ctx.lineTo(c.x1 - 2, LIQ); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ + 4); ctx.lineTo(c.x1 - 2, LIQ + 4); ctx.stroke();
    ctx.restore();
  }
  function beakerFront(ctx, c) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(ctx, c); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(ctx, c); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function metalGrad(ctx, kind, x0, w) {
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    return g;
  }
  function electrode(ctx, x, kind) {
    const x0 = x - EW / 2, h = EBOT - ETOP;
    ctx.save();
    ctx.fillStyle = metalGrad(ctx, kind, x0, EW); rrect(ctx, x0, ETOP, EW, h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 2, LIQ, EW + 4, EBOT - LIQ + 2); ctx.clip();   // 泡在溶液裡的部分壓暗
    ctx.fillStyle = 'rgba(16,58,72,0.42)'; rrect(ctx, x0, ETOP, EW, h, 4); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill();          // 接線端子
    ctx.restore();
  }

  // ───────── 圖形：原子、離子、電子 ─────────
  function atom(ctx, x, y, kind, al) {
    if (al <= 0.01) return;
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - 7, y - 8, 3, x, y, ATOM_R);
    g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, ATOM_R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, kind === 'cu' ? 'Cu' : 'Zn', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 10; }
  function ionPill(ctx, x, y, s, al) {           // 正離子：橘色膠囊＋深色字（同 volta 的畫法）
    if (al <= 0.01) return;
    const hw = pillHalf(ctx, s);
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.pos; ctx.shadowColor = K.pos; ctx.shadowBlur = 8;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function slot(ctx, x, y, al) {                 // 電子槽（空的）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(214,246,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.fillStyle = 'rgba(12,30,25,0.55)';
    ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function ring(ctx, x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function wireLine(ctx, pts) {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function glowPath(ctx, pts, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al * 0.4; ctx.strokeStyle = color; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.restore();
  }
  function bridgeQ(ctx, al, hot) {               // 兩杯之間的「？」：分開的兩杯還缺一樣東西（下個分頁）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (hot > 0.01) { ctx.shadowColor = K.cyan; ctx.shadowBlur = 14 * hot; }
    ctx.strokeStyle = hot > 0.01 ? K.cyan : K.muted; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(BR.x0, BR.bot); ctx.lineTo(BR.x0, BR.top + 14); ctx.quadraticCurveTo(BR.x0, BR.top, BR.x0 + 14, BR.top);
    ctx.lineTo(BR.x1 - 14, BR.top); ctx.quadraticCurveTo(BR.x1, BR.top, BR.x1, BR.top + 14); ctx.lineTo(BR.x1, BR.bot); ctx.stroke();
    ctx.restore();
    text(ctx, '？', (BR.x0 + BR.x1) / 2, 236, hot > 0.01 ? K.cyan : K.muted, 30, 'center', al);
  }
  function mark(ctx, ok, x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function arrowR(ctx, x0, x1, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.white; ctx.fillStyle = K.white; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 13, y - 8); ctx.lineTo(x1 - 13, y + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ───────── 依時間算出狀態（純函式） ─────────
  // zn：鋅原子 → 鋅離子的進度；cu：銅離子 → 銅原子的進度；eL / eR：電極裡的電子（{x,y,a}）
  function state(i, tl) {
    const S = { znAtom: null, znIon: null, cuIon: null, cuAtom: null, eL: [], eR: [], wire: 0, flow: null,
      dimL: 0, dimR: 0, slots: 0, xfer: -1, bridge: 0, hot: 0, rings: [] };
    if (i === 0) {
      S.dimR = ease(tl / 0.8) * 0.62;
      const leave = ease((tl - 2.6) / 1.0), morph = ease((tl - 2.8) / 0.8);
      const p = { x: lerp(ZN_ATOM.x, ZN_ION.x, leave), y: AY };
      S.znAtom = { x: p.x, y: p.y, a: 1 - morph }; S.znIon = { x: p.x, y: p.y + (tl > 3.6 ? 4 * Math.sin((tl - 3.6) * 1.8) : 0), a: morph };
      const split = ease((tl - 1.9) / 0.9);
      if (tl > 1.9) [352, 400].forEach((ty, k) => {
        const jig = tl > 2.8 ? 1.5 * Math.sin(tl * 5 + k * 2) : 0;
        S.eL.push({ x: lerp(ZX + EW / 2 - 2, ZX, split) + jig, y: lerp(AY, ty, split), a: ease((tl - 1.9) / 0.3) });
      });
      S.rings.push({ x: ZN_ATOM.x, y: AY, age: tl - 1.0, c: K.white, r: ATOM_R }, { x: ZN_ATOM.x, y: AY, age: tl - 1.4, c: K.white, r: ATOM_R });
      S.cuIon = { x: CU_ION0.x, y: AY, a: 1 };
    } else if (i === 1) {
      S.dimL = 0.62; S.dimR = 0.62 * (1 - ease(tl / 0.6));
      S.znIon = { x: ZN_ION.x, y: AY, a: 1 };
      const go = ease((tl - 0.8) / 1.8), morph = ease((tl - 3.0) / 0.8);
      const ip = { x: lerp(CU_ION0.x, CX - EW / 2 - pillHalfC, go), y: AY };
      S.cuIon = { x: lerp(ip.x, CU_ATOM.x, morph), y: AY + (tl < 0.8 ? 3 * Math.sin(tl * 2) : 0), a: 1 - morph };
      S.cuAtom = { x: lerp(ip.x, CU_ATOM.x, morph), y: AY, a: morph };
      [352, 400].forEach((ty, k) => {
        const dn = ease((tl - 0.6 - k * 0.3) / 1.3), toS = ease((tl - 2.8) / 0.7);
        if (tl < 0.6 + k * 0.3) return;
        const y0 = lerp(ETOP + 6, ty, dn), jig = tl > 2.2 && tl < 2.8 ? 1.5 * Math.sin(tl * 5 + k * 2) : 0;
        S.eR.push({ x: lerp(CX, CX - EW / 2 + 2, toS) + jig, y: lerp(y0, AY, toS), a: clamp((tl - 0.6 - k * 0.3) / 0.3, 0, 1) * (1 - ease((tl - 3.4) / 0.4)) });
      });
      S.rings.push({ x: CX - EW / 2, y: AY, age: tl - 3.5, c: K.electron, r: 10 });
    } else {
      S.znIon = { x: ZN_ION.x, y: AY + 4 * Math.sin(tl * 1.8), a: 1 };
      S.cuAtom = { x: CU_ATOM.x, y: AY, a: 1 };
      S.bridge = i === 2 ? ease((tl - 1.6) / 0.6) : 1;
      S.wire = i === 2 ? ease((tl - 0.4) / 1.2) : 1;
      if (i === 2) S.flow = { front: 130 * (tl - 1.6), t: tl };
      if (i === 4) S.flow = { front: 1e9, t: tl + 8 };
      if (i === 3) { S.slots = ease((tl - 0.5) / 0.5); S.xfer = ease((tl - 2.2) / 3.0); }
      if (i === 4) S.hot = ease((tl - 4.6) / 0.5);
    }
    return S;
  }
  let pillHalfC = 37;                              // Cu²⁺ 膠囊半寬（render 時量一次）

  // 連續電子流：一對一對沿 E_PATH 走；front＝前緣（從來源出發）
  function flowE(ctx, f) {
    if (!f) return;
    const V = 130, sp = 150, gap = 26, L = E_PATH.L, d = V * f.t;
    for (let k = -1; k * sp < L + sp; k++) {
      const s0 = k * sp + (d % sp);
      [0, -gap].forEach(off => {
        const s = s0 + off;
        if (s < 0 || s > L || s > f.front) return;
        const p = at(E_PATH, s), fade = clamp(Math.min(s, L - s) / 22, 0, 1) * clamp((f.front - s) / 20, 0, 1);
        ball(ctx, p.x, p.y, 8, fade);
      });
    }
  }
  // 第 4 步：鋅片兩個槽的電子經導線搬到銅片兩個槽
  const XF = SLOT_Y.map(y => mkPath([{ x: ZX, y }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y }]));
  function xferE(ctx, S, tl) {
    if (S.slots <= 0.01) return;
    SLOT_Y.forEach(y => { slot(ctx, ZX, y, S.slots); slot(ctx, CX, y, S.slots); });
    XF.forEach((P, k) => {
      const kk = clamp(S.xfer, 0, 1), p = at(P, P.L * kk);
      const jig = (kk <= 0 || kk >= 1) ? 1.2 * Math.sin(tl * 5 + k * 2) : 0;
      ball(ctx, p.x + jig, p.y, 8, S.slots);
    });
    if (S.xfer >= 1) SLOT_Y.forEach((y, k) => ring(ctx, CX, y, tl - 5.2 - k * 0.1, K.electron, 12));
  }

  // ───────── 共同的裝置畫面 ─────────
  function apparatus(ctx, i, tl, S) {
    CUPS.forEach(c => beakerBack(ctx, c));
    electrode(ctx, ZX, 'zn'); electrode(ctx, CX, 'cu');
    CUPS.forEach(c => liquid(ctx, c));
    // 原子、離子（溶液裡／電極表面）
    if (S.znAtom) atom(ctx, S.znAtom.x, S.znAtom.y, 'zn', S.znAtom.a);
    if (S.znIon) ionPill(ctx, S.znIon.x, S.znIon.y, 'Zn²⁺', S.znIon.a);
    if (S.cuIon) ionPill(ctx, S.cuIon.x, S.cuIon.y, 'Cu²⁺', S.cuIon.a);
    if (S.cuAtom) atom(ctx, S.cuAtom.x, S.cuAtom.y, 'cu', S.cuAtom.a);
    CUPS.forEach(c => beakerFront(ctx, c));
    bridgeQ(ctx, S.bridge, S.hot * (0.6 + 0.4 * Math.sin(tl * 4)));
    // 外導線（第 3 步起）
    if (S.wire > 0) {
      if (i === 2) glowPath(ctx, WIRE, ease((tl - 3.0) / 0.5) * (1 - ease((tl - 4.8) / 0.5)), K.electron);
      wireLine(ctx, partial(WIRE, S.wire));
    }
    // 電子（最後畫，在金屬與導線上）
    S.eL.forEach(e => ball(ctx, e.x, e.y, 8, e.a));
    S.eR.forEach(e => ball(ctx, e.x, e.y, 8, e.a));
    flowE(ctx, S.flow);
    if (i === 3) xferE(ctx, S, tl);
    S.rings.forEach(r => ring(ctx, r.x, r.y, r.age, r.c, r.r));
    // 標註
    text(ctx, tr('鋅片 Zn', 'Zinc (Zn)'), ZX + EW / 2 + 12, 182, K.znHi, 24, 'left');
    text(ctx, tr('銅片 Cu', 'Copper (Cu)'), CX - EW / 2 - 12, 182, K.cuHi, 24, 'right');
  }
  function dimSide(ctx, x0, x1, k) {
    if (k <= 0.01) return;
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = K.bg; ctx.fillRect(x0, 80, x1 - x0, 410); ctx.restore();
  }

  // ───────── 右欄：反應式 ─────────
  // terms = [[字, 顏色, 透明度]]；以全部項目的總寬置中（項目逐一出現時位置不跳），回傳每項的 [x0, x1]
  function equation(ctx, terms, cx, y, size) {
    const ws = terms.map(g => textW(ctx, g[0], size, true)), tot = ws.reduce((a, b) => a + b, 0);
    let x = cx - tot / 2; const box = [];
    terms.forEach((g, k) => { text(ctx, g[0], x, y, g[1], size, 'left', g[2], true); box.push([x, x + ws[k]]); x += ws[k]; });
    return box;
  }
  function eqSize(ctx, terms) {                  // 30px 起，放不下才往下降，不低於 24px
    const s = terms.map(g => g[0]).join('');
    for (let z = 30; z > 24; z--) if (textW(ctx, s, z, true) <= RW - 10) return z;
    return 24;
  }
  function hiBox(ctx, b, y, size, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.shadowColor = K.yellow; ctx.shadowBlur = 8;
    rrect(ctx, b[0] - 7, y - size * 0.7, b[1] - b[0] + 14, size * 1.4, 8); ctx.stroke(); ctx.restore();
  }
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function row(ctx, ok, s, y, color, al, size) {
    mark(ctx, ok, RX + 16, y, al);
    return block(ctx, s, RX + 42, y, RW - 42, color, size || 24, 'left', al);
  }

  // ───────── 各步右欄 ─────────
  function notes1(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y = block(ctx, tr('氧化', 'Oxidation'), RX, 112, RW, K.white, 30, 'left', a(0.4), 38);
    block(ctx, tr('＝失去電子', '= losing electrons'), RX, y, RW, K.electron, 26, 'left', a(0.7));
    const T = [['Zn', K.znHi, a(1.0)], [' → ', K.white, a(3.0)], ['Zn²⁺', K.pos, a(3.0)], [' + ', K.white, a(3.8)], ['2e⁻', K.electron, a(3.8)]];
    const z = eqSize(ctx, T), ey = 222, box = equation(ctx, T, RC, ey, z);
    hiBox(ctx, box[4], ey, z, a(4.6));
    y = block(ctx, tr('電子在式子右邊', 'e⁻ on the right side'), RX, 274, RW, K.white, 24, 'left', a(4.8));
    y = block(ctx, tr('＝送出 2 個電子', '= gives out 2 electrons'), RX, y, RW, K.electron, 24, 'left', a(5.1));
    // 鋅原子 → 鋅離子
    const iy = y + 40, al = a(5.8), hw = pillHalf(ctx, 'Zn²⁺');
    atom(ctx, RX + 26, iy, 'zn', al); arrowR(ctx, RX + 58, RX + 108, iy, al); ionPill(ctx, RX + 120 + hw, iy, 'Zn²⁺', al);
    block(ctx, tr('鋅原子 → 鋅離子', 'Zn atom → Zn²⁺ ion'), RX, iy + 44, RW, K.white, 22, 'left', al);
    bottomLines(ctx, tr('先看清楚電子在反應式哪一邊：電子在右邊＝送出', 'Check which side the electrons are on: on the right = given out'), K.yellow, a(6.6));
  }
  function notes2(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y = block(ctx, tr('還原', 'Reduction'), RX, 112, RW, K.white, 30, 'left', a(0.4), 38);
    block(ctx, tr('＝得到電子', '= gaining electrons'), RX, y, RW, K.electron, 26, 'left', a(0.7));
    const T = [['Cu²⁺', K.pos, a(1.0)], [' + ', K.white, a(2.0)], ['2e⁻', K.electron, a(2.0)], [' → ', K.white, a(3.8)], ['Cu', K.cuHi, a(3.8)]];
    const z = eqSize(ctx, T), ey = 222, box = equation(ctx, T, RC, ey, z);
    hiBox(ctx, box[2], ey, z, a(4.6));
    y = block(ctx, tr('電子在式子左邊', 'e⁻ on the left side'), RX, 274, RW, K.white, 24, 'left', a(4.8));
    y = block(ctx, tr('＝接收 2 個電子', '= takes in 2 electrons'), RX, y, RW, K.electron, 24, 'left', a(5.1));
    const iy = y + 40, al = a(5.8), hw = pillHalf(ctx, 'Cu²⁺');
    ionPill(ctx, RX + 4 + hw, iy, 'Cu²⁺', al); arrowR(ctx, RX + 18 + 2 * hw, RX + 68 + 2 * hw, iy, al); atom(ctx, RX + 102 + 2 * hw, iy, 'cu', al);
    block(ctx, tr('銅離子 → 銅原子', 'Cu²⁺ ion → Cu atom'), RX, iy + 44, RW, K.white, 22, 'left', al);
    bottomLines(ctx, tr('電子在反應式左邊＝接收。這 2 個電子從哪裡來？看下一步', 'Electrons on the left = taken in. Where do these 2 electrons come from? See the next step'), K.yellow, a(6.6));
  }
  function notes3(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.5);
    text(ctx, tr('來源', 'Source'), ZX, 106, K.yellow, 26, 'center', a(2.0));
    text(ctx, tr('去處', 'Destination'), CX, 106, K.yellow, 26, 'center', a(2.8));
    let y = block(ctx, tr('來源：鋅片', 'Source: Zn plate'), RX, 116, RW, K.znHi, 26, 'left', a(2.0), 34);
    y = block(ctx, tr('氧化，送出電子', 'oxidation, gives out e⁻'), RX, y, RW, K.white, 22, 'left', a(2.2));
    y = block(ctx, tr('去處：銅片', 'Destination: Cu plate'), RX, y + 14, RW, K.cuHi, 26, 'left', a(2.8), 34);
    y = block(ctx, tr('還原，接收電子', 'reduction, takes in e⁻'), RX, y, RW, K.white, 22, 'left', a(3.0));
    y = row(ctx, true, tr('電子只走金屬與導線', 'Electrons travel only in metal and wire'), y + 24, K.electron, a(3.6));
    block(ctx, tr('（不進溶液）', '(never into the solution)'), RX + 42, y, RW - 42, K.muted, 22, 'left', a(4.0));
    bottomLines(ctx, tr('鋅片送出的電子，經外導線走到銅片', 'Electrons released at the Zn plate travel through the outer wire to the Cu plate'), K.yellow, a(5.0));
  }
  function notes4(ctx, tl, S) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y = block(ctx, tr('電子數守恆', 'Electron conservation'), RX, 116, RW, K.green, 28, 'left', a(0.4), 36);
    const l1 = tr('鋅片：失去', 'Zn plate: loses'), l2 = tr('銅片：得到', 'Cu plate: gains');
    const sx = RX + Math.max(textW(ctx, l1, 24), textW(ctx, l2, 24)) + 30;
    const y1 = y + 18, y2 = y1 + 50, gone = S.xfer > 0.02, came = S.xfer >= 1;
    text(ctx, l1, RX, y1, K.znHi, 24, 'left', a(1.0));
    text(ctx, l2, RX, y2, K.cuHi, 24, 'left', a(1.4));
    [0, 1].forEach(k => {
      const x = sx + 12 + k * 34;
      slot(ctx, x, y1, a(1.0)); if (!gone) ball(ctx, x, y1, 8, a(1.0));
      slot(ctx, x, y2, a(1.4)); if (came) ball(ctx, x, y2, 8, 1);
    });
    if (came) [0, 1].forEach(k => ring(ctx, sx + 12 + k * 34, y2, tl - 5.2 - k * 0.1, K.electron, 12));
    y = block(ctx, tr('失去 2 個＝得到 2 個', 'Lost 2 = gained 2'), RX, y2 + 56, RW, K.green, 26, 'left', a(5.6), 34);
    y = block(ctx, tr('一邊少兩個，', 'One side has two fewer,'), RX, y + 10, RW, K.white, 24, 'left', a(6.0));
    block(ctx, tr('另一邊就多兩個', 'the other has two more'), RX, y, RW, K.white, 24, 'left', a(6.0));
    bottomLines(ctx, tr('電子不會憑空出現，也不會憑空消失', 'Electrons never appear out of nowhere, and never vanish'), K.yellow, a(6.6));
  }
  function notes5(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y = block(ctx, tr('氧化與還原一定同時發生', 'Oxidation and reduction always happen together'), RX, 116, RW, K.yellow, 26, 'left', a(0.4), 34);
    y = row(ctx, true, tr('鋅失去電子（氧化）', 'Zn loses e⁻ (oxidation)'), y + 16, K.white, a(1.0));
    y = row(ctx, true, tr('銅離子得到電子（還原）', 'Cu²⁺ gains e⁻ (reduction)'), y + 10, K.white, a(1.8));
    y = row(ctx, false, tr('只有失去、沒有得到', 'Losing without gaining:'), y + 22, K.white, a(3.0));
    block(ctx, tr('電子沒地方去', 'the electrons have nowhere to go'), RX + 42, y, RW - 42, K.muted, 22, 'left', a(3.3));
    bottomLines(ctx, tr('下一個分頁「鋅銅電池與鹽橋」：兩邊放在不同燒杯時，需要什麼讓溶液維持電中性？',
      'Next tab, Zn-Cu cell & bridge: with the two sides in separate beakers, what keeps each solution electrically neutral?'), K.cyan, a(5.0));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx) {
    const items = [[tr('藍球＝電子（只在金屬與導線裡）', 'Blue ball = electron (metal and wire only)'), 'b'],
      [tr('橘＝正離子（只在溶液裡）', 'Orange = positive ion (solution only)'), 'i']];
    const z = 22, gapIcon = 30, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    const rows = tot <= maxW ? [items.map((_, k) => k)] : items.map((_, k) => [k]);
    const ys = rows.length === 1 ? [574] : [560, 586];
    rows.forEach((rw, r) => {
      const tw = rw.reduce((a, k) => a + wid[k], 0) + gapItem * (rw.length - 1);
      let x = W / 2 - tw / 2;
      rw.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
        else { ctx.save(); ctx.fillStyle = K.pos; rrect(ctx, x, y - 8, 20, 16, 8); ctx.fill(); ctx.restore(); }
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 26);
    text(ctx, ls[0], W / 2, 58, K.yellow, 26);
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    pillHalfC = pillHalf(ctx, 'Cu²⁺');
    const S = state(i, tl);
    apparatus(ctx, i, tl, S);
    dimSide(ctx, 20, 318, S.dimL);
    dimSide(ctx, 322, 624, S.dimR);
    if (i === 3) notes4(ctx, tl, S); else [notes1, notes2, notes3, null, notes5][i](ctx, tl);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('redoxAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('redoxAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c || !c.width) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const r = document.getElementById('steps-redox');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-redox'); if (!r) return;
    r.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      r.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.offsetWidth > 0 && c.getClientRects().length); }
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

  window.GbAnim.redox = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-redox'); if (r) r.innerHTML = '';
      const o = document.getElementById('redoxAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { redox: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() {
      const i = stepAt(S.t), st = state(i, S.t - STARTS[i]);
      return { scene: S.on ? 'redox' : null, t: S.t, step: S.step, running: !!S.raf, wire: +st.wire.toFixed(3), xfer: +st.xfer.toFixed(3) };
    }
  };
})();
