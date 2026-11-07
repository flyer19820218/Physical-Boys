/* electrolysis_5_cuc_1107_v1.js — 「藍色為什麼變淡？」分頁動畫（#cucAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.ElAnim.cuc = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'cuc'。畫布不綁事件；唯一控制是 #steps-cuc 的 5 個步驟鈕；結果框 #cucAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（工具函式複製自 electrolysis_5_intro / water_1107_v1.js，畫法一致）。
 * 畫面是「場景時間 t 的純函式」：離子、電子、銅層厚度、氣泡（固定雜湊種子，不用 Math.random）、溶液藍色深淺、
 * 計數條都只由全域時間 T 算出；離子的增減一律淡入淡出。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步標題（黃）。燒杯 x 75–590，杯口 y=240、液面 y=272、杯底 y=474（沿用 intro 的燒杯畫法，加寬讓離子排得下）。
 *   兩支碳棒（寬 34，y 165–440）：負極端 x=155、正極端 x=510。
 *   外導線 y=118：負極端 → 電池（短粗＝負極 x=324、長細＝正極 x=340）→ 開關（x 400–440，第 1 步打開）→ 正極端。
 *   溶液裡 4 列（y 300/346/392/438）：每列左邊 Cu²⁺（橘）往負極端、右邊 SO₄²⁻（紫）往正極端；
 *   H⁺（橘）在正極端旁 x≈448 出現；O₂ 氣泡在正極端表面 x≈477–491 往上冒。
 *   燒杯上方 y=256：第 1 步「硫酸銅溶液」、第 2 步離子方向、第 3 步起「析出紅色 Cu」「O₂ 氣泡」。
 *   右欄 x 650–980：本步重點；y≈506/536：本步一句（黃）；y≈574：圖例。
 * ── 科學表示（依頁面原文，不加新主張） ─────────────────────────────
 *   藍球＝電子，只在導線與碳棒裡：電池負極 → 負極端；正極端 → 導線 → 電池正極。從不進溶液。
 *   負極端：Cu²⁺ 靠近碳棒表面、得到電子（2 顆藍球在碳棒裡到表面）→ 變成銅原子 → 附著成紅棕色銅層（先點狀、再一層）。
 *   正極端：碳棒外觀不變；水分子到表面反應 → O₂ 氣泡（空心圓，外框粉紅，與電解水分頁一致）＋ H⁺ 淡入；
 *          電子從表面進入碳棒往上走。
 *   示意數量：Cu²⁺ 4 → 3（第 3 步）→ 2（第 5 步）；H⁺ 0 → 2（第 4 步）→ 4（第 5 步）；SO₄²⁻ 一直 4 個（電荷平衡）。
 *   溶液藍色：皇家藍半透明 rgba(40,110,200,0.55×濃度)，第 3 步起緩慢變淡，第 5 步「時間快轉」大幅變淡，
 *   右欄並排「一開始」色塊對照；Cu²⁺／H⁺ 兩條計數條為示意，不標數值。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 裝置      8 s  藍色溶液、Cu²⁺／SO₄²⁻ 自由游走、兩支碳棒、開關打開（尚未通電）
 *   2 通電      9 s  開關閉合（T=8.5）、電子從電池負極出發（T=8.9）、Cu²⁺ 往負極端、SO₄²⁻ 往正極端（T=9.4 起）
 *   3 負極端    9 s  Cu²⁺ 靠近 → 得到電子 → 銅原子 → 點狀銅 → 一層銅
 *   4 正極端    9 s  碳棒虛線框（外觀不變）；水反應：O₂ 冒泡、H⁺ 出現
 *   5 溶液變化  8 s  時間快轉：藍色變淡（與一開始的色塊對照）、Cu²⁺ 計數條下降、H⁺ 計數條上升（pH 下降）
 * 播放規則（AGENTS 10.6）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停，到底時呼叫一次 ElAnim.ctl.onEnd()。
 * ElAnim.ctl.paused 為真時時間凍住。分頁被隱藏（canvas offsetWidth＝0）時不跑 rAF，每 250ms 檢查一次。
 * 進度條呼叫共用 window.AnimBar.draw（畫布頂端 y=8～24），沒載入時退回細線。
 */
(function () {
  'use strict';
  window.ElAnim = window.ElAnim || {};
  window.ElAnim.ctl = window.ElAnim.ctl || { paused: false, onEnd: null };

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)',
    o2: '#ff78b7'
  };
  const BLUE = a => `rgba(40,110,200,${(0.55 * a).toFixed(4)})`;     // 硫酸銅溶液：皇家藍半透明（濃度 a：1＝一開始）
  const PALE = a => `rgba(205,228,232,${(0.10 + 0.14 * (1 - a)).toFixed(4)})`;   // 水本身的淡色：藍色越淡越接近無色的水
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 固定種子

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

  // ───────── 幾何 ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440;          // 負極端、正極端
  const NS = NX + EW / 2, PS = PX - EW / 2;                             // 面向溶液的表面 x
  const WY = 118, BN = 324, BP = 340, BATX = 332;                       // 導線、電池（短粗＝負極、長細＝正極）
  const SW0 = 400, SW1 = 440;                                           // 開關：支點、接點（右側導線上）
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 300 }]);   // 電池負極 → 負極端
  const E_R = mkPath([{ x: PX, y: 300 }, { x: PX, y: WY }, { x: BP, y: WY }]);   // 正極端 → 電池正極
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 650, RW = 330;                                             // 右欄
  // 離子：4 列，每列左 Cu²⁺、右 SO₄²⁻（漂移方向相反，永遠不會互撞）
  const ROWS = [300, 346, 392, 438];
  const CU_H = [262, 286, 250, 276], SO_H = [350, 368, 334, 356];
  const CU_STOP = 222, SO_STOP = 374, HX = 448;
  // 全域時間（秒）
  const T_SW = 8.5, T_FLOW = 8.9, T_ON = 9.4, V_ION = 10, T5 = 35;
  // 負極端事件：哪一列的 Cu²⁺、開始靠近 ta、得到電子變成銅 tc
  const CEV = [{ r: 1, ta: 17.8, tc: 19.5 }, { r: 3, ta: 36.2, tc: 37.7 }];
  // 正極端事件：哪一列的水分子反應、產生 O₂ 氣泡與 H⁺ 的時間
  const AEV = [{ r: 1, te: 28.0 }, { r: 2, te: 30.0 }, { r: 0, te: 37.0 }, { r: 3, te: 38.6 }];
  // 銅的點狀沉積（先一點點）：y、在哪一面（+1 朝溶液那面、−1 背面）、出現時間
  const SPOTS = [
    { y: 346, s: 1, t0: 21.3 }, { y: 318, s: 1, t0: 21.0 }, { y: 372, s: 1, t0: 21.5 }, { y: 296, s: 1, t0: 21.8 },
    { y: 404, s: 1, t0: 22.0 }, { y: 428, s: 1, t0: 22.3 }, { y: 330, s: -1, t0: 21.6 }, { y: 386, s: -1, t0: 22.1 },
    { y: 300, s: -1, t0: 22.4 }, { y: 420, s: -1, t0: 22.6 }
  ];
  // 濃度、H⁺、銅層厚度（都只由 T 算出）
  const blue = T => T < 19.5 ? 1 : T < T5 ? 1 - 0.12 * (T - 19.5) / 15.5 : 0.88 - 0.64 * ease((T - 35.4) / 6.0);
  const hLevel = T => T < 28 ? 0 : T < T5 ? 0.16 * (T - 28) / 7 : 0.16 + 0.84 * ease((T - 35.4) / 6.0);
  const coatTh = T => T < 22.6 ? 0 : T < 25.6 ? 3 * ease((T - 22.6) / 3.0) : T < T5 ? 3 + (T - 25.6) / 9.4 : 4 + 4 * ease((T - 35.4) / 6.0);
  const coatA = T => ease((T - 22.6) / 1.6);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['裝置', 'Setup'],
      cap: ['電解硫酸銅溶液：兩極都用碳棒', 'Electrolysis of copper sulfate solution with carbon rods'],
      bot: ['硫酸銅溶液含有 Cu²⁺ 與 SO₄²⁻，兩極都用碳棒', 'Copper sulfate solution contains Cu²⁺ and SO₄²⁻; both electrodes are carbon rods'],
      res: ['硫酸銅溶液含有 Cu²⁺ 與 SO₄²⁻，兩極都用碳棒（惰性電極）。',
        'Copper sulfate solution contains Cu²⁺ and SO₄²⁻; both electrodes are carbon rods (inert electrodes).'] },
    { dur: 9, b: ['通電', 'Current on'],
      cap: ['通電：電子走導線，離子在溶液裡移動', 'Current on: electrons in the wire, ions in the solution'],
      bot: ['電子走導線，離子在溶液裡移動', 'Electrons travel in the wire; ions move in the solution'],
      res: ['電子走導線，離子在溶液裡移動：Cu²⁺ 往負極端、SO₄²⁻ 往正極端。',
        'Electrons travel in the wire and ions move in the solution: Cu²⁺ toward the (−) side, SO₄²⁻ toward the (+) side.'] },
    { dur: 9, b: ['負極端', '(−) side'],
      cap: ['負極端（C）：Cu²⁺ 得到電子，析出紅色 Cu', '(−) side (C): Cu²⁺ gains electrons and red Cu forms'],
      bot: ['Cu²⁺ 得到電子變成銅，附著在碳棒上', 'Cu²⁺ gains electrons and becomes copper on the carbon rod'],
      res: ['負極端（C）：溶液中的 Cu²⁺ 得到電子，析出紅色的 Cu，附著在碳棒表面。',
        '(−) side (C): Cu²⁺ in the solution gains electrons and red copper (Cu) forms on the carbon rod.'] },
    { dur: 9, b: ['正極端', '(+) side'],
      cap: ['正極端（C）：碳棒不反應，水反應產生 O₂', '(+) side (C): the rod stays the same; water gives O₂'],
      bot: ['碳棒不反應，水發生反應，產生氧氣 O₂ 並冒泡', 'The rod does not react; water reacts, giving O₂ bubbles'],
      res: ['正極端碳棒不反應，水發生反應，產生氧氣 O₂ 並冒泡。',
        'At the (+) side the carbon rod does not react; water reacts instead, producing oxygen gas (O₂), which bubbles out.'] },
    { dur: 8, b: ['溶液變化', 'Solution'],
      cap: ['時間快轉：藍色變淡，溶液變酸', 'Fast-forward: the blue fades and the solution turns acidic'],
      bot: ['Cu²⁺ 一直被消耗，藍色變淡；產生 H⁺，溶液變酸', 'Cu²⁺ is used up, so the blue fades; H⁺ forms, so it turns acidic'],
      res: ['Cu²⁺ 一直被消耗，藍色逐漸變淡；產生 H⁺，溶液變酸（pH 值下降）。',
        'Cu²⁺ is used up continuously, so the blue gradually fades; H⁺ forms, so the solution turns acidic (pH falls).'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 圖形：燒杯、溶液、電極 ─────────
  function beakerPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(BX0 - 8, BRIM - 6); ctx.quadraticCurveTo(BX0, BRIM - 4, BX0, BRIM + 8);
    ctx.lineTo(BX0, BBOT - 16); ctx.quadraticCurveTo(BX0, BBOT, BX0 + 16, BBOT);
    ctx.lineTo(BX1 - 16, BBOT); ctx.quadraticCurveTo(BX1, BBOT, BX1, BBOT - 16);
    ctx.lineTo(BX1, BRIM + 8); ctx.quadraticCurveTo(BX1, BRIM - 4, BX1 + 8, BRIM - 6);
  }
  function innerClip(ctx, yTop) {
    ctx.beginPath();
    ctx.moveTo(BX0 + 2, yTop); ctx.lineTo(BX0 + 2, BBOT - 16); ctx.quadraticCurveTo(BX0 + 2, BBOT - 2, BX0 + 16, BBOT - 2);
    ctx.lineTo(BX1 - 16, BBOT - 2); ctx.quadraticCurveTo(BX1 - 2, BBOT - 2, BX1 - 2, BBOT - 16); ctx.lineTo(BX1 - 2, yTop); ctx.closePath();
  }
  function beakerBack(ctx) { ctx.save(); innerClip(ctx, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore(); }
  function liquid(ctx, b) {
    ctx.save(); innerClip(ctx, LIQ); ctx.fillStyle = PALE(b); ctx.fill();
    ctx.fillStyle = BLUE(b); ctx.fill();
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(BX0 + 2, LIQ); ctx.lineTo(BX1 - 2, LIQ); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(BX0 + 2, LIQ + 4); ctx.lineTo(BX1 - 2, LIQ + 4); ctx.stroke();
    ctx.restore();
  }
  function beakerFront(ctx) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(ctx); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(ctx); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function electrode(ctx, x) {
    const x0 = x - EW / 2, h = EBOT - ETOP;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ETOP, EW, h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }
  function cuFill(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, K.cuLo); g.addColorStop(0.3, K.cuHi); g.addColorStop(0.65, K.cu); g.addColorStop(1, K.cuLo);
    return g;
  }
  // 負極端碳棒上的銅：先點狀（SPOTS 與兩次事件的銅原子），再長成一整層（厚度 coatTh(T)）
  function coat(ctx, T) {
    const th = coatTh(T), ca = coatA(T);
    ctx.save();
    SPOTS.concat(CEV.map(e => ({ y: ROWS[e.r], s: 1, t0: e.tc + 1.8 }))).forEach(p => {
      const a = ease((T - p.t0) / 0.35);
      if (a <= 0.01) return;
      const x = p.s > 0 ? NS : NX - EW / 2, r = 5.5 * a;
      ctx.fillStyle = K.cu; ctx.strokeStyle = K.cuLo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, p.y, r, p.s > 0 ? -Math.PI / 2 : Math.PI / 2, p.s > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    if (ca > 0.01) {
      ctx.globalAlpha *= ca;
      const x0 = NX - EW / 2 - th, x1 = NX + EW / 2 + th;
      ctx.fillStyle = cuFill(ctx, x0, x1);
      rrect(ctx, x0, LIQ + 8, x1 - x0, EBOT - LIQ - 8 + th, 6 + th); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      // 表面顆粒感（固定位置）
      ctx.fillStyle = 'rgba(255,200,150,0.35)';
      for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(lerp(x0 + 4, x1 - 4, hash(k * 3.3)), LIQ + 20 + k * 17, 1.8, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  function outlineBox(ctx, x, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    rrect(ctx, x - EW / 2 - 6, ETOP - 6, EW + 12, EBOT - ETOP + 12, 10); ctx.stroke(); ctx.restore();
  }

  // ───────── 圖形：分子、離子、電子、元件 ─────────
  function waterMol(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e6eeec'; ctx.beginPath(); ctx.arc(x - 9, y + 7, 5, 0, TAU); ctx.arc(x + 9, y + 7, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b9c9c5'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  let HW = { 'Cu²⁺': 34, 'SO₄²⁻': 42, 'H⁺': 22 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {        // kind 0＝陽離子（橘）、1＝陰離子（紫）
    if (al <= 0.01) return;
    const hw = HW[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function cuAtom(ctx, x, y, r, al, lbl) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r);
    g.addColorStop(0, K.cuHi); g.addColorStop(0.55, K.cu); g.addColorStop(1, K.cuLo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    if (lbl > 0.01) text(ctx, 'Cu', x, y + 1, K.ink, 22, 'center', al * lbl, true);
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function bubble(ctx, x, y, r, color, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function ring(ctx, x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function wireLine(ctx, pts, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function battery(ctx) {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 24); ctx.lineTo(BP, WY + 24); ctx.stroke();   // 長細＝正極
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 12); ctx.lineTo(BN, WY + 12); ctx.stroke();   // 短粗＝負極
    ctx.restore();
    text(ctx, '−', BN - 18, WY - 20, K.electron, 28, 'center');
    text(ctx, '+', BP + 18, WY - 20, K.pos, 28, 'center');
  }
  function switchSym(ctx, k) {                      // k：0＝打開、1＝閉合；導線在 SW0～SW1 之間真的留缺口
    const a = lerp(32, 0, k) * RAD, L = SW1 - SW0;
    ctx.save(); ctx.lineCap = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(SW0, WY);
      ctx.lineTo(SW0 + L * Math.cos(a), WY - L * Math.sin(a)); ctx.stroke();
    });
    ctx.fillStyle = K.white; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 2;
    [SW0, SW1].forEach(x => { ctx.beginPath(); ctx.arc(x, WY, 5, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function mark(ctx, kind, x, y, alpha) {           // 'ok' 綠勾、'dot' 黃點
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'dot') { ctx.fillStyle = K.yellow; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.restore(); return; }
    ctx.strokeStyle = K.green; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); ctx.stroke();
    ctx.restore();
  }
  function ffwd(ctx, x, y, al, ph) {                // 時間快轉的雙三角（畫的，不靠字型）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = K.yellow;
    [0, 16].forEach((dx, k) => {
      ctx.globalAlpha = al * (0.55 + 0.45 * Math.max(0, Math.sin(ph * 6 - k * 1.2)));
      ctx.beginPath(); ctx.moveTo(x + dx, y - 11); ctx.lineTo(x + dx + 15, y); ctx.lineTo(x + dx, y + 11); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  // ───────── 依全域時間 T 算出的狀態（純函式） ─────────
  function rowJitter(r, T) {                        // 同一列的 Cu²⁺／SO₄²⁻ 共用 x 擺動，兩者不會互相碰到
    const amp = lerp(7, 1.5, ease((T - T_ON) / 1.5));
    return amp * Math.sin(T * 1.1 + r * 1.9);
  }
  function ions(T) {
    const out = [];
    const d = Math.max(0, T - T_ON) * V_ION;
    ROWS.forEach((y, r) => {
      const jx = rowJitter(r, T), jy = k => 3 * Math.sin(T * 1.7 + r * 2.3 + k * 2.9);
      // Cu²⁺
      let x = CU_H[r] - Math.min(CU_H[r] - CU_STOP, d) + jx, a = 1;
      const ev = CEV.find(e => e.r === r);
      if (ev && T > ev.ta) {
        const u = ease((T - ev.ta) / 1.0);
        x = lerp(x, NS + HW['Cu²⁺'] + 6, u);
        a = 1 - ease((T - ev.tc) / 0.35);
      }
      out.push({ x, y: y + jy(0) * (ev && T > ev.ta ? 1 - ease((T - ev.ta) / 1.0) : 1), s: 'Cu²⁺', kind: 0, a });
      // SO₄²⁻（一直都在）
      out.push({ x: SO_H[r] + Math.min(SO_STOP - SO_H[r], d) + jx, y: y + jy(1), s: 'SO₄²⁻', kind: 1, a: 1 });
    });
    AEV.forEach(e => {                               // H⁺：在正極端旁淡入
      const u = (T - e.te) / 0.5;
      if (u <= 0) return;
      out.push({ x: lerp(466, HX, ease((T - e.te) / 0.8)) + 1.5 * Math.sin(T * 2.1 + e.r), y: ROWS[e.r] + 2 * Math.sin(T * 1.6 + e.r * 1.3), s: 'H⁺', kind: 0, a: ease(u) });
    });
    return out;
  }

  // 連續電子流：E_L 末端在碳棒裡淡出、E_R 起點在碳棒裡淡入
  function flowE(ctx, T) {
    if (T < T_FLOW) return;
    const V = 110, sp = 52, d = V * T, front = 150 * (T - T_FLOW), al = clamp((T - T_FLOW) / 0.3, 0, 1);
    [E_L, E_R].forEach(P => {
      const L = P.L;
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > L || s > front) continue;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 26, 0, 1) * clamp((front - s) / 20, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * al);
      }
    });
  }
  // 反應用的電子（只在碳棒裡）：負極端 2 顆往下走到 Cu²⁺ 那一列的表面；正極端 2 顆從表面往上走回導線
  function reactE(ctx, T) {
    CEV.forEach(e => {
      const y = ROWS[e.r], u = ease((T - (e.tc - 0.9)) / 0.9);
      const a = clamp((T - (e.tc - 0.9)) / 0.15, 0, 1) * (1 - ease((T - e.tc) / 0.25));
      if (a <= 0.01) return;
      ball(ctx, lerp(NX + 2, NX + 7, u), lerp(y - 58, y - 9, u), 7, a);
      ball(ctx, lerp(NX + 2, NX + 7, u), lerp(y - 40, y + 9, u), 7, a);
    });
    AEV.forEach(e => {
      const y = ROWS[e.r], u = ease((T - e.te) / 1.0);
      const a = clamp((T - e.te) / 0.15, 0, 1) * (1 - ease((T - e.te - 0.7) / 0.3));
      if (a <= 0.01) return;
      ball(ctx, lerp(PX - 7, PX - 2, u), lerp(y - 9, y - 64, u), 7, a);
      ball(ctx, lerp(PX - 7, PX - 2, u), lerp(y + 9, y - 46, u), 7, a);
    });
  }
  // O₂ 氣泡：連續產生（第 4 步每 0.30 s 一顆，第 5 步時間快轉每 0.12 s 一顆）＋每次正極端事件一顆
  const T_B = 27.0, DT1 = 0.30, DT2 = 0.12, N1 = (T5 - T_B) / DT1;
  const prod = T => T < T_B ? 0 : T < T5 ? (T - T_B) / DT1 : N1 + (T - T5) / DT2;
  const born = k => k < N1 ? T_B + k * DT1 : T5 + (k - N1) * DT2;
  function oneBubble(ctx, T, t0, y0, h3, k) {
    const age = T - t0;
    if (age < 0) return;
    const r = 3.5 + h3 * 2.8, y = y0 - 78 * age * (0.85 + 0.3 * h3);
    if (y - r <= LIQ + 2) return;
    const x = PS - r - 3 - Math.min(4, 10 * age) - 1.5 * Math.sin(age * 7 + k);
    bubble(ctx, x, y, r, K.o2, clamp(age / 0.15, 0, 1) * clamp((y - r - LIQ - 2) / 10, 0, 1));
  }
  function bubbles(ctx, T) {
    const kHi = Math.floor(prod(T)), kLo = Math.max(0, Math.floor(prod(T - 3.0)));
    for (let k = kLo; k <= kHi; k++) {
      const h1 = hash(k * 3.1 + 7), h2 = hash(k * 7.7 + 1.3), h3 = hash(k * 1.9 + 4.2);
      oneBubble(ctx, T, born(k) + h1 * 0.1, 296 + h2 * 140, h3, k);
    }
    AEV.forEach((e, n) => oneBubble(ctx, T, e.te, ROWS[e.r], 0.9, n));
  }

  // ───────── 裝置畫面 ─────────
  function apparatus(ctx, i, tl, T) {
    beakerBack(ctx);
    electrode(ctx, NX); electrode(ctx, PX);
    liquid(ctx, blue(T));
    // 碳棒浸在溶液裡的那段稍微壓暗（同 intro）
    ctx.save(); ctx.fillStyle = 'rgba(16,58,72,0.30)';
    [NX, PX].forEach(x => { rrect(ctx, x - EW / 2, LIQ + 2, EW, EBOT - LIQ - 2, 8); ctx.fill(); });
    ctx.restore();
    coat(ctx, T);
    // 正極端旁的水分子：反應前靠近表面，然後消失（變成 O₂ 與 H⁺）
    AEV.forEach(e => {
      const y = ROWS[e.r], u = ease((T - (e.te - 0.6)) / 0.6);
      waterMol(ctx, lerp(452, 474, u) + 1.5 * Math.sin(T * 1.4 + e.r), y + 2 * Math.sin(T * 1.9 + e.r * 2), 0.95 * (1 - ease((T - e.te + 0.1) / 0.35)));
    });
    ions(T).forEach(o => ionPill(ctx, o.x, o.y, o.s, o.kind, o.a));
    // 變成銅原子 → 附著到碳棒表面
    CEV.forEach(e => {
      const y = ROWS[e.r], a = ease((T - e.tc - 0.1) / 0.4), m = ease((T - e.tc - 1.0) / 0.8);
      if (a <= 0.01 || m >= 0.999) return;
      cuAtom(ctx, lerp(NS + 17, NS + 3, m), y, lerp(16, 5.5, m), a, ease((T - e.tc - 0.4) / 0.3) * (1 - ease(m / 0.4)));
    });
    bubbles(ctx, T);
    beakerFront(ctx);
    outlineBox(ctx, PX, i === 3 ? ease((tl - 0.8) / 0.5) : 0, K.yellow);
    CEV.forEach(e => ring(ctx, NS + 4, ROWS[e.r], T - e.tc, K.cyan, 12));
    AEV.forEach(e => ring(ctx, PS - 4, ROWS[e.r], T - e.te, K.cyan, 10));
    // 燒杯上方的標示（y=256）
    const a1 = i === 0 ? ease((tl - 0.6) / 0.5) : i === 1 ? 1 - ease(tl / 0.5) : 0;
    text(ctx, tr('硫酸銅溶液（藍色）', 'CuSO₄ solution (blue)'), (BX0 + BX1) / 2, 256, K.white, 22, 'center', a1);
    const a2 = i === 1 ? ease((tl - 1.4) / 0.5) : 0;
    text(ctx, '← Cu²⁺', 250, 256, K.pos, 22, 'center', a2, true);
    text(ctx, 'SO₄²⁻ →', 420, 256, K.neg, 22, 'center', a2, true);
    const a3 = i === 2 ? ease((tl - 4.2) / 0.5) : i > 2 ? 1 : 0;
    text(ctx, tr('析出紅色 Cu', 'red Cu forms'), NS + 8, 256, K.cuText, 22, 'left', a3);
    const a4 = i === 3 ? ease((tl - 1.6) / 0.5) : i > 3 ? 1 : 0;
    text(ctx, tr('O₂ 氣泡', 'O₂ bubbles'), PS - 6, 256, K.o2, 22, 'right', a4);
    // 電路：導線 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w, 1));
    flowE(ctx, T);
    reactE(ctx, T);
    switchSym(ctx, ease((T - T_SW) / 0.4));
    battery(ctx);
    text(ctx, tr('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, tr('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, tr('負極端', '(−) side'), NX - EW / 2 - 14, 182, K.electron, 24, 'right');
    text(ctx, tr('碳棒', 'Carbon'), NX - EW / 2 - 14, 212, K.muted, 22, 'right');
    text(ctx, tr('正極端', '(+) side'), PX + EW / 2 + 14, 182, K.pos, 24, 'left');
    text(ctx, tr('碳棒', 'Carbon'), PX + EW / 2 + 14, 212, K.muted, 22, 'left');
  }

  // ───────── 右欄 ─────────
  function icon(ctx, kind, x, y, al) {
    if (kind === 'e') ball(ctx, x, y, 8, al);
    else if (kind === 'cu') cuAtom(ctx, x, y, 10, al, 0);
    else if (kind === 'o2') bubble(ctx, x, y, 9, K.o2, al);
    else if (kind === 'h2o') waterMol(ctx, x, y - 3, al);
    else if (kind === 'box') {
      if (al <= 0.01) return;
      ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      rrect(ctx, x - 9, y - 13, 18, 26, 4); ctx.stroke(); ctx.restore();
    } else mark(ctx, kind, x, y, al);
  }
  function row(ctx, kind, s, y, color, al, size) {
    icon(ctx, kind, RX + 14, y, al);
    return block(ctx, s, RX + 40, y, RW - 40, color, size || 24, 'left', al);
  }
  function pillRow(ctx, s, kind, label, y, al) {
    const hw = HW[s];
    ionPill(ctx, RX + hw, y, s, kind, al);
    return block(ctx, label, RX + 2 * hw + 14, y, RW - 2 * hw - 14, K.white, 22, 'left', al);
  }
  function swatch(ctx, x, y, w, h, b, al) {         // 與燒杯裡同樣的疊色，方便對照
    ctx.save(); ctx.globalAlpha *= al;
    rrect(ctx, x, y, w, h, 8); ctx.fillStyle = K.bg; ctx.fill();
    ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill();
    ctx.fillStyle = PALE(b); ctx.fill();
    ctx.fillStyle = BLUE(b); ctx.fill();
    ctx.strokeStyle = K.glass; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function meterBar(ctx, x, y, w, v, al) {          // 示意計數條（不標數值）
    ctx.save(); ctx.globalAlpha *= al;
    rrect(ctx, x, y - 10, w, 20, 10); ctx.fillStyle = 'rgba(242,236,217,0.12)'; ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (v > 0.005) { rrect(ctx, x, y - 10, Math.max(20, w * v), 20, 10); ctx.fillStyle = K.pos; ctx.shadowColor = K.pos; ctx.shadowBlur = 6; ctx.fill(); }
    ctx.restore();
  }
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function notes(ctx, i, tl, T) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y;
    if (i === 0) {
      y = block(ctx, tr('電解硫酸銅溶液', 'Electrolysing CuSO₄'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'dot', tr('硫酸銅溶液是藍色的', 'The solution is blue'), y + 12, K.white, a(0.8));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('銅離子', 'copper ion'), y + 20, a(1.5));
      y = pillRow(ctx, 'SO₄²⁻', 1, tr('硫酸根離子', 'sulfate ion'), y + 12, a(2.0));
      y = block(ctx, tr('（在溶液裡自由游走）', '(moving freely)'), RX, y + 6, RW, K.muted, 22, 'left', a(2.4));
      y = row(ctx, 'dot', tr('兩極都用碳棒', 'Two carbon rods'), y + 14, K.white, a(3.4));
      y = block(ctx, tr('碳棒＝惰性電極', 'carbon = inert electrode'), RX + 40, y, RW - 40, K.cyan, 22, 'left', a(3.8));
      row(ctx, 'dot', tr('開關打開：還沒通電', 'Switch open: no current'), y + 12, K.white, a(4.8));
    } else if (i === 1) {
      y = block(ctx, tr('通電', 'Current on'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'e', tr('電子走導線', 'Electrons: in the wire'), y + 14, K.electron, a(0.9));
      y = block(ctx, tr('從電池負極出發', 'leaving the battery\'s (−) end'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(1.1));
      y = block(ctx, tr('離子在溶液裡移動', 'Ions: in the solution'), RX, y + 16, RW, K.white, 24, 'left', a(1.6));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('往負極端', 'toward the (−) side'), y + 18, a(2.0));
      y = pillRow(ctx, 'SO₄²⁻', 1, tr('往正極端', 'toward the (+) side'), y + 12, a(2.4));
      row(ctx, 'ok', tr('電子不進入溶液', 'Electrons never enter the solution'), y + 18, K.green, a(3.6));
    } else if (i === 2) {
      y = block(ctx, tr('負極端（C）', '(−) side (C)'), RX, 110, RW, K.electron, 30, 'left', a(0.3), 38);
      y = pillRow(ctx, 'Cu²⁺', 0, tr('靠近碳棒表面', 'reaches the rod surface'), y + 18, a(0.8));
      y = row(ctx, 'e', tr('得到電子', 'gains electrons'), y + 12, K.electron, a(1.8));
      y = row(ctx, 'cu', tr('變成紅色的銅 Cu', 'becomes red copper, Cu'), y + 10, K.cuText, a(2.8));
      y = row(ctx, 'ok', tr('附著在碳棒上：先一點點，再一層', 'It sticks to the rod: a few spots, then a layer'), y + 16, K.white, a(4.6));
    } else if (i === 3) {
      y = block(ctx, tr('正極端（C）', '(+) side (C)'), RX, 110, RW, K.pos, 30, 'left', a(0.3), 38);
      y = row(ctx, 'box', tr('碳棒不反應（外觀不變）', 'The carbon rod does not react (looks the same)'), y + 14, K.white, a(0.9));
      y = row(ctx, 'h2o', tr('水發生反應', 'Water reacts instead'), y + 12, K.white, a(1.6));
      y = row(ctx, 'o2', tr('產生氧氣 O₂，冒泡', 'Oxygen gas O₂ forms and bubbles'), y + 10, K.o2, a(2.2));
      pillRow(ctx, 'H⁺', 0, tr('溶液中出現 H⁺', 'H⁺ appears in the solution'), y + 18, a(2.6));
    } else {
      const aT = a(0.2);
      ffwd(ctx, RX + 4, 112, aT, tl);
      text(ctx, tr('時間快轉', 'Fast-forward'), RX + 46, 112, K.yellow, 30, 'left', aT);
      // 顏色對照：一開始 vs 現在
      const aS = a(0.6), sy = 150;
      swatch(ctx, RX, sy, 92, 44, 1, aS); swatch(ctx, RX + 170, sy, 92, 44, blue(T), aS);
      text(ctx, '→', RX + 131, sy + 22, K.white, 26, 'center', aS);
      text(ctx, tr('一開始', 'At first'), RX + 46, sy + 66, K.white, 22, 'center', aS);
      text(ctx, tr('現在', 'Now'), RX + 216, sy + 66, K.white, 22, 'center', aS);
      // 示意計數條
      const aB = a(1.0), bx = RX + 2 * HW['Cu²⁺'] + 12, bw = 118;
      ionPill(ctx, RX + HW['Cu²⁺'], 268, 'Cu²⁺', 0, aB);
      meterBar(ctx, bx, 268, bw, blue(T), aB);
      text(ctx, tr('減少', 'fewer'), bx + bw + 12, 268, K.white, 22, 'left', aB);
      ionPill(ctx, RX + HW['Cu²⁺'], 310, 'H⁺', 0, aB);
      meterBar(ctx, bx, 310, bw, hLevel(T), aB);
      text(ctx, tr('增加', 'more'), bx + bw + 12, 310, K.white, 22, 'left', aB);
      y = block(ctx, tr('（示意，不是真實數量）', '(sketch, not real amounts)'), RX, 344, RW, K.muted, 22, 'left', aB);
      y = row(ctx, 'ok', tr('藍色逐漸變淡', 'The blue fades'), y + 12, K.white, a(2.4));
      row(ctx, 'ok', tr('溶液變酸（pH 值下降）', 'The solution turns acidic (pH falls)'), y + 8, K.white, a(4.0));
    }
    const botT = [5.6, 5.6, 6.0, 6.0, 5.8][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), K.yellow, a(botT));
  }

  // ───────── 圖例、標題、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = [[tr('藍球＝電子', 'Blue = electron'), 'b'], [tr('橘＝陽離子', 'Orange = cation'), 'p'], [tr('紫＝陰離子', 'Purple = anion'), 'n']];
    if (i >= 2) items.push([tr('紅棕＝銅', 'Brown = Cu'), 'c']);
    if (i >= 3) items.push([tr('空心圈＝O₂', 'Ring = O₂'), 'r']);
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((960 - sum) / Math.max(1, items.length - 1), 18, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'c') { ctx.save(); ctx.fillStyle = cuFill(ctx, x, x + 22); rrect(ctx, x, y - 9, 22, 18, 4); ctx.fill(); ctx.restore(); }
      else if (kind === 'r') bubble(ctx, x + 11, y, 8, K.o2, 1);
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }
  function drawCaption(ctx, cap) { text(ctx, wrap(ctx, cap, 940, 26)[0], W / 2, 58, K.yellow, 26); }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    HW = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻'), 'H⁺': pillHalf(ctx, 'H⁺') };
    const T = STARTS[i] + tl;
    apparatus(ctx, i, tl, T);
    notes(ctx, i, tl, T);
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('cucAnimCanvas');
  const ctl = () => window.ElAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('cucAnimResult'); if (el) el.innerHTML = html;
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
    const r = document.getElementById('steps-cuc');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-cuc'); if (!r) return;
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

  window.ElAnim.cuc = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-cuc'); if (r) r.innerHTML = '';
      const o = document.getElementById('cucAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) { S.ended = false; start(); } },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { cuc: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'cuc' : null, t: S.t, running: !!(S.raf || S.timer), step: S.step }; }
  };
})();
