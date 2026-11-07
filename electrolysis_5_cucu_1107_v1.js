/* electrolysis_5_cucu_1107_v1.js — 「藍色為什麼不變？」分頁動畫（#cucuAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.ElAnim.cucu = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'cucu'。畫布不綁事件；唯一控制是 #steps-cucu 的 5 個步驟鈕；結果框 #cucuAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（工具函式與裝置畫法沿用 electrolysis_5_cuc_1107_v1.js，
 * 燒杯、電池、開關、離子膠囊、圖例、版面都相同，讓兩頁形成「同樣裝置，換電極」的對照）。
 * 畫面是「場景時間 t 的純函式」：離子、電子、兩片銅片的厚度、計數箭頭都只由全域時間 T 算出（固定雜湊種子，
 * 不用 Math.random）；離子的增減一律淡入淡出；溶液藍色從頭到尾是同一個常數（第 5 步也不變）。
 *
 * ── 版面（與 cuc 相同） ─────────────────────────────────────────────
 *   y≈58 本步標題（黃）。燒杯 x 75–590，杯口 y=240、液面 y=272、杯底 y=474。
 *   兩片銅片（原寬 34，y 165–440）：負極端 x=155、正極端 x=510。
 *   外導線 y=118：負極端 → 電池（短粗＝負極 x=324、長細＝正極 x=340）→ 開關（x 400–440，第 1 步打開）→ 正極端。
 *   溶液裡 4 列（y 300/346/392/438）：每列左邊 Cu²⁺（橘）往負極端、右邊 SO₄²⁻（紫）往正極端；
 *   正極端新生成的 Cu²⁺ 出現在正極端旁 x≈460（第 1、3 列，正好補回第 3 步在負極端用掉的那兩列）。
 *   燒杯上方 y=256：第 1 步「硫酸銅溶液」、第 2 步離子方向、第 3 步起「析出紅色 Cu」、第 4 步起「銅片溶解」，
 *   第 5 步改成「變厚／變薄」。右欄 x 650–980：本步重點；y≈506/536：本步一句（黃）；y≈574：圖例。
 * ── 科學表示（依頁面原文，不加新主張） ─────────────────────────────
 *   藍球＝電子，只在導線與銅片裡：電池負極 → 負極端；正極端 → 導線 → 電池正極。從不進溶液。
 *   負極端：Cu²⁺ 靠近銅片表面、得到電子（2 顆藍球在銅片裡到表面）→ 變成銅原子 → 附著（先點狀、再一層），銅片變厚。
 *   正極端：銅片表面的 Cu 失去電子（2 顆藍球從表面往上走回導線）→ 變成 Cu²⁺ 離開銅片進入溶液，銅片變薄（虛線＝原本厚度）。
 *   示意數量：Cu²⁺ 4 → 2（第 3 步，負極端用掉 2 個）→ 4（第 4 步，正極端補回 2 個）；第 5 步維持 4 個；SO₄²⁻ 一直 4 個。
 *   第 3、4 步各只演一極，畫面註明「兩極同時進行」。第 5 步時間快轉：兩極同步閃動（同時用掉、同時補上），
 *   右欄兩條同速前進的箭頭表示速率相等；「一開始／現在」兩個色塊相同。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 裝置      8 s  藍色溶液、Cu²⁺／SO₄²⁻ 自由游走、兩片銅片（活性電極）、開關打開；右欄小圖：碳棒 → 銅片
 *   2 通電      8 s  開關閉合（T=8.5）、電子從電池負極出發（T=8.9）、Cu²⁺ 往負極端、SO₄²⁻ 往正極端（T=9.4 起）
 *   3 負極端    9 s  Cu²⁺ 靠近 → 得到電子 → 銅原子 → 點狀銅 → 一層銅（負極端變厚）
 *   4 正極端    9 s  銅片表面的 Cu → 失去電子 → Cu²⁺ 冒出進入溶液（正極端變薄）
 *   5 整體對照  9 s  時間快轉：負極端變厚、正極端變薄、藍色不變（色塊對照）、用掉＝補上；結論「銅從正極端搬到負極端」
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
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    nuHi: '#f39468', nu: '#d2653a', nuLo: '#93401d',          // 新析出的紅色銅（同色系、偏紅）
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const BLUE_A = 1;                                                     // 溶液濃度：從頭到尾不變
  const BLUE = a => `rgba(40,110,200,${(0.55 * a).toFixed(4)})`;     // 硫酸銅溶液：皇家藍半透明（同 cuc）
  const PALE = a => `rgba(205,228,232,${(0.10 + 0.14 * (1 - a)).toFixed(4)})`;
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

  // ───────── 幾何（與 cuc 相同） ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440, HW0 = EW / 2;   // 負極端、正極端（原本半寬 17）
  const NS = NX + HW0, PS = PX - HW0;                                   // 原本面向溶液的表面 x
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
  const CU_STOP = 222, SO_STOP = 374, SLOT_R = 460;                     // SLOT_R：正極端新生 Cu²⁺ 停的位置
  // 全域時間（秒）
  const T_SW = 8.5, T_FLOW = 8.9, T_ON = 9.4, V_ION = 10, T5 = 34;
  // 負極端事件：哪一列的 Cu²⁺、開始靠近 ta、得到電子變成銅 tc
  const CEV = [{ r: 1, ta: 17.6, tc: 19.2 }, { r: 3, ta: 20.4, tc: 22.0 }];
  // 正極端事件：哪一列、表面的 Cu 失去電子變成 Cu²⁺ 的時間 te（補回負極端用掉的那兩列）
  const AEV = [{ r: 1, te: 27.6 }, { r: 3, te: 30.6 }];
  // 第 5 步時間快轉：兩極同步閃動（同一瞬間負極端用掉一個、正極端補上一個）
  const PULSE = [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({ t: 35.0 + 1.0 * k, r: [0, 2, 1, 3][k % 4] }));
  // 負極端銅的點狀沉積（先一點點）：y、在哪一面（+1 朝溶液那面、−1 背面）、出現時間
  const SPOTS = [
    { y: 346, s: 1, t0: 19.9 }, { y: 318, s: 1, t0: 19.7 }, { y: 372, s: 1, t0: 20.1 }, { y: 296, s: 1, t0: 20.4 },
    { y: 404, s: 1, t0: 20.6 }, { y: 428, s: 1, t0: 20.9 }, { y: 330, s: -1, t0: 20.2 }, { y: 386, s: -1, t0: 20.7 },
    { y: 300, s: -1, t0: 21.0 }, { y: 420, s: -1, t0: 21.2 }
  ];
  // 兩片銅片的厚度（都只由 T 算出）：負極端外層新銅厚度、正極端浸在溶液那段的半寬
  const FF = T => ease((T - 34.4) / 6.6);
  const coatTh = T => T < 21.4 ? 0 : T < 24.4 ? 4.5 * ease((T - 21.4) / 3.0) : T < T5 ? 4.5 : 4.5 + 5 * FF(T);
  const coatA = T => ease((T - 21.4) / 1.6);
  const hwA = T => T < 27.8 ? HW0 : T < 32.8 ? HW0 - 2 * ease((T - 27.8) / 5.0) : T < T5 ? HW0 - 2 : HW0 - 2 - 6 * FF(T);
  const nSurf = T => NS + coatTh(T) * coatA(T);                         // 負極端目前表面
  const pSurf = T => PX - hwA(T);                                       // 正極端目前表面

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['裝置', 'Setup'],
      cap: ['電解硫酸銅溶液：兩極換成銅片', 'Electrolysing copper sulfate solution with copper plates'],
      bot: ['和上一頁同樣的裝置，只把碳棒換成銅片', 'Same setup as before, but the carbon rods become copper plates'],
      res: ['硫酸銅溶液，兩極都換成銅片（活性電極）。',
        'Copper sulfate solution, with both electrodes changed to copper plates (active electrodes).'] },
    { dur: 8, b: ['通電', 'Current on'],
      cap: ['通電：電子走導線，離子在溶液裡移動', 'Current on: electrons in the wire, ions in the solution'],
      bot: ['電子走導線，離子在溶液裡移動', 'Electrons travel in the wire; ions move in the solution'],
      res: ['電子走導線，離子在溶液裡移動：Cu²⁺ 往負極端、SO₄²⁻ 往正極端。',
        'Electrons travel in the wire and ions move in the solution: Cu²⁺ toward the (−) side, SO₄²⁻ toward the (+) side.'] },
    { dur: 9, b: ['負極端', '(−) side'],
      cap: ['負極端（Cu）：Cu²⁺ 得到電子，析出紅色 Cu', '(−) side (Cu): Cu²⁺ gains electrons and red Cu forms'],
      bot: ['Cu²⁺ 得到電子變成銅，負極端銅片變厚', 'Cu²⁺ gains electrons and becomes copper; the (−) plate gets thicker'],
      res: ['負極端（Cu）：水中的 Cu²⁺ 獲得電子，析出紅色的 Cu，銅片逐漸變厚。',
        '(−) side (Cu): Cu²⁺ in the water gains electrons and red copper (Cu) is deposited, so the plate gets thicker.'] },
    { dur: 9, b: ['正極端', '(+) side'],
      cap: ['正極端（Cu）：銅失去電子，變成 Cu²⁺ 進入水中', '(+) side (Cu): copper loses electrons and dissolves'],
      bot: ['銅失去電子變成 Cu²⁺ 進入溶液，正極端銅片變薄', 'Copper loses electrons and enters the solution as Cu²⁺; the (+) plate gets thinner'],
      res: ['正極端（Cu）：銅金屬失去電子，溶解變成 Cu²⁺ 進入水中，銅片逐漸變薄。',
        '(+) side (Cu): copper metal loses electrons and dissolves into the water as Cu²⁺, so the plate gets thinner.'] },
    { dur: 9, b: ['整體對照', 'Overall'],
      cap: ['時間快轉：銅從正極端搬到負極端', 'Fast-forward: copper moves from (+) to the (−) side'],
      bot: ['銅從正極端被搬到負極端（電鍍與金屬精煉的原理）', 'Copper is carried from the (+) side to the (−) side (the idea behind electroplating and refining)'],
      res: ['消耗的 Cu²⁺ 剛好由正極端補充，藍色完全不變！',
        'The Cu²⁺ used up is exactly replaced by the (+) side, so the blue does not change at all!'] }
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
  function cuFill(ctx, x0, x1, nu) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    if (nu) { g.addColorStop(0, K.nuLo); g.addColorStop(0.3, K.nuHi); g.addColorStop(0.65, K.nu); g.addColorStop(1, K.nuLo); }
    else { g.addColorStop(0, K.cuLo); g.addColorStop(0.3, K.cuHi); g.addColorStop(0.65, K.cu); g.addColorStop(1, K.cuLo); }
    return g;
  }
  // 銅片：液面以上維持原寬；浸在溶液裡那段的半寬 hw（正極端會變薄）
  const LOWY = LIQ + 6;
  function plate(ctx, x, hw) {
    ctx.save();
    if (hw >= HW0 - 0.01) {
      ctx.fillStyle = cuFill(ctx, x - HW0, x + HW0); rrect(ctx, x - HW0, ETOP, EW, EBOT - ETOP, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.fillStyle = cuFill(ctx, x - HW0, x + HW0); rrect(ctx, x - HW0, ETOP, EW, LOWY + 4 - ETOP, [6, 6, 2, 2]); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = cuFill(ctx, x - hw, x + hw); rrect(ctx, x - hw, LOWY, hw * 2, EBOT - LOWY, Math.min(6, hw)); ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a22'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }
  // 負極端外層的新銅：先點狀（SPOTS 與兩次事件的銅原子），再長成一整層（只畫外層，看得出「變厚」）
  function coat(ctx, T) {
    const th = coatTh(T), ca = coatA(T);
    ctx.save();
    SPOTS.concat(CEV.map(e => ({ y: ROWS[e.r], s: 1, t0: e.tc + 1.8 }))).forEach(p => {
      const a = ease((T - p.t0) / 0.35) * (1 - ca);
      if (a <= 0.01) return;
      const x = p.s > 0 ? NS : NX - HW0, r = 5.5 * a;
      ctx.fillStyle = K.nu; ctx.strokeStyle = K.nuLo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, p.y, r, p.s > 0 ? -Math.PI / 2 : Math.PI / 2, p.s > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    if (ca > 0.01) {
      const t = Math.max(2.2, th) * ca, x0 = NX - HW0 - t, x1 = NX + HW0 + t, y0 = LIQ + 8;
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x0, y0, x1 - x0, EBOT - y0 + t, 6 + t); ctx.roundRect(NX - HW0, y0, EW, EBOT - y0, 6); }
      else { ctx.rect(x0, y0, x1 - x0, EBOT - y0 + t); ctx.rect(NX - HW0, y0, EW, EBOT - y0); }
      ctx.fillStyle = cuFill(ctx, x0, x1, true); ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(255,176,128,0.9)'; ctx.lineWidth = 1.6;
      rrect(ctx, x0, y0, x1 - x0, EBOT - y0 + t, 6 + t); ctx.stroke();
      // 表面顆粒感（固定位置）
      ctx.fillStyle = 'rgba(255,200,150,0.45)';
      for (let k = 0; k < 9; k++) {
        const side = k % 2 ? x1 - t / 2 : x0 + t / 2;
        ctx.beginPath(); ctx.arc(side, LIQ + 22 + k * 17 + 6 * hash(k * 3.3), Math.min(1.8, t / 2), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function ghostOutline(ctx, al) {                  // 正極端原本的厚度（虛線）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(242,236,217,0.75)'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
    rrect(ctx, PX - HW0, LOWY, EW, EBOT - LOWY, 6); ctx.stroke(); ctx.restore();
  }

  // ───────── 圖形：離子、電子、元件 ─────────
  let HW = { 'Cu²⁺': 34, 'SO₄²⁻': 42 };
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
  function rowJitter(r, T) {                        // 同一列的離子共用 x 擺動，彼此不會碰到
    const amp = lerp(7, 1.5, ease((T - T_ON) / 1.5));
    return amp * Math.sin(T * 1.1 + r * 1.9);
  }
  function ions(T) {
    const out = [];
    const d = Math.max(0, T - T_ON) * V_ION;
    ROWS.forEach((y, r) => {
      const jx = rowJitter(r, T), jy = k => 3 * Math.sin(T * 1.7 + r * 2.3 + k * 2.9);
      // 原本的 Cu²⁺（往負極端）
      let x = CU_H[r] - Math.min(CU_H[r] - CU_STOP, d) + jx, a = 1;
      const ev = CEV.find(e => e.r === r);
      if (ev && T > ev.ta) {
        const u = ease((T - ev.ta) / 1.0);
        x = lerp(x, nSurf(T) + HW['Cu²⁺'] + 6, u);
        a = 1 - ease((T - ev.tc) / 0.35);
      }
      out.push({ x, y: y + jy(0) * (ev && T > ev.ta ? 1 - ease((T - ev.ta) / 1.0) : 1), s: 'Cu²⁺', kind: 0, a });
      // SO₄²⁻（一直都在）
      out.push({ x: SO_H[r] + Math.min(SO_STOP - SO_H[r], d) + jx, y: y + jy(1), s: 'SO₄²⁻', kind: 1, a: 1 });
    });
    AEV.forEach(e => {                               // 正極端新生的 Cu²⁺：從銅片表面淡入、往外移一點
      const u = (T - e.te - 0.1) / 0.4;
      if (u <= 0) return;
      const jx = rowJitter(e.r, T);
      out.push({ x: lerp(SLOT_R + 16, SLOT_R, ease((T - e.te - 0.1) / 0.8)) + jx, y: ROWS[e.r] + 3 * Math.sin(T * 1.7 + e.r * 2.3 + 5.8) * ease((T - e.te) / 1.2), s: 'Cu²⁺', kind: 0, a: ease(u) });
    });
    return out;
  }

  // 連續電子流：E_L 末端在銅片裡淡出、E_R 起點在銅片裡淡入
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
  // 反應用的電子（只在銅片裡）：負極端 2 顆往下走到 Cu²⁺ 那一列的表面；正極端 2 顆從表面往上走回導線
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

  // ───────── 裝置畫面 ─────────
  function apparatus(ctx, i, tl, T) {
    beakerBack(ctx);
    plate(ctx, NX, HW0); plate(ctx, PX, hwA(T));
    liquid(ctx, BLUE_A);
    // 銅片浸在溶液裡的那段：重畫在溶液之上（看得出是銅），再蓋一層淡藍表示泡在溶液裡
    ctx.save(); innerClip(ctx, LIQ + 1); ctx.clip();
    plate(ctx, NX, HW0); plate(ctx, PX, hwA(T));
    ctx.fillStyle = 'rgba(40,110,200,0.22)';
    [[NX, HW0], [PX, hwA(T)]].forEach(([x, hw]) => { rrect(ctx, x - hw, LIQ + 2, hw * 2, EBOT - LIQ - 2, Math.min(6, hw)); ctx.fill(); });
    ctx.restore();
    coat(ctx, T);
    ghostOutline(ctx, clamp((HW0 - hwA(T)) / 0.8, 0, 1));
    // 正極端表面要失去電子的那顆 Cu（一半嵌在銅片裡），失去電子後淡出
    AEV.forEach(e => {
      const y = ROWS[e.r], al = ease((T - (e.te - 1.4)) / 0.4) * (1 - ease((T - e.te) / 0.3));
      cuAtom(ctx, pSurf(T) + 5, y, 13, al, 1 - ease((T - e.te + 0.1) / 0.2));
    });
    ions(T).forEach(o => ionPill(ctx, o.x, o.y, o.s, o.kind, o.a));
    // 負極端：變成銅原子 → 附著到銅片表面
    CEV.forEach(e => {
      const y = ROWS[e.r], a = ease((T - e.tc - 0.1) / 0.4), m = ease((T - e.tc - 1.0) / 0.8);
      if (a <= 0.01 || m >= 0.999) return;
      const sx = nSurf(T);
      cuAtom(ctx, lerp(sx + 17, sx + 3, m), y, lerp(16, 5.5, m), a, ease((T - e.tc - 0.4) / 0.3) * (1 - ease(m / 0.4)));
    });
    beakerFront(ctx);
    CEV.forEach(e => ring(ctx, nSurf(T) + 4, ROWS[e.r], T - e.tc, K.cyan, 12));
    AEV.forEach(e => ring(ctx, pSurf(T) - 2, ROWS[e.r], T - e.te, K.cyan, 12));
    PULSE.forEach(p => { ring(ctx, nSurf(T) + 3, ROWS[p.r], T - p.t, K.cyan, 9); ring(ctx, pSurf(T) - 3, ROWS[p.r], T - p.t, K.cyan, 9); });
    // 燒杯上方的標示（y=256）
    const a1 = i === 0 ? ease((tl - 0.6) / 0.5) : i === 1 ? 1 - ease(tl / 0.5) : 0;
    text(ctx, tr('硫酸銅溶液（藍色）', 'CuSO₄ solution (blue)'), (BX0 + BX1) / 2, 256, K.white, 22, 'center', a1);
    const a2 = i === 1 ? ease((tl - 1.4) / 0.5) : 0;
    text(ctx, '← Cu²⁺', 250, 256, K.pos, 22, 'center', a2, true);
    text(ctx, 'SO₄²⁻ →', 420, 256, K.neg, 22, 'center', a2, true);
    const a3 = i === 2 ? ease((tl - 4.2) / 0.5) : i === 3 ? 1 : 0;
    text(ctx, tr('析出紅色 Cu', 'red Cu forms'), NS + 14, 256, K.cuText, 22, 'left', a3);
    const a4 = i === 3 ? ease((tl - 3.4) / 0.5) : 0;
    text(ctx, tr('銅片溶解', 'Cu dissolves'), PS - 6, 256, K.pos, 22, 'right', a4);
    const a5 = i === 4 ? ease((tl - 2.0) / 0.5) : 0;
    text(ctx, tr('銅片變厚', 'gets thicker'), NS + 14, 256, K.cuText, 22, 'left', a5);
    text(ctx, tr('銅片變薄', 'gets thinner'), PS - 6, 256, K.cuText, 22, 'right', a5);
    // 電路：導線 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w, 1));
    flowE(ctx, T);
    reactE(ctx, T);
    switchSym(ctx, ease((T - T_SW) / 0.4));
    battery(ctx);
    text(ctx, tr('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, tr('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, tr('負極端', '(−) side'), NX - HW0 - 14, 182, K.electron, 24, 'right');
    text(ctx, tr('銅片', 'Copper'), NX - HW0 - 14, 212, K.cuText, 22, 'right');
    text(ctx, tr('正極端', '(+) side'), PX + HW0 + 14, 182, K.pos, 24, 'left');
    text(ctx, tr('銅片', 'Copper'), PX + HW0 + 14, 212, K.cuText, 22, 'left');
  }

  // ───────── 右欄 ─────────
  function miniRod(ctx, x, y, cu, al) {             // 第 1 步的小對照圖：碳棒（深灰）／銅片（銅色）
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
    if (cu) { g.addColorStop(0, K.cuLo); g.addColorStop(0.35, K.cuHi); g.addColorStop(1, K.cuLo); }
    else { g.addColorStop(0, K.cLo); g.addColorStop(0.35, K.cHi); g.addColorStop(1, K.cLo); }
    ctx.fillStyle = g; rrect(ctx, x - 8, y - 24, 16, 48, 4); ctx.fill();
    ctx.strokeStyle = cu ? 'rgba(90,40,12,0.8)' : 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function arrowR(ctx, x0, x1, y, color, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 8, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 10, y - 7); ctx.lineTo(x1 - 10, y + 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function icon(ctx, kind, x, y, al) {
    if (kind === 'e') ball(ctx, x, y, 8, al);
    else if (kind === 'cu') cuAtom(ctx, x, y, 10, al, 0);
    else mark(ctx, kind, x, y, al);
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
  // 速率箭頭：一排同速往右走的箭頭（兩條速度完全相同＝速率相等；示意）
  function rateBar(ctx, x, y, w, T, al) {
    ctx.save(); ctx.globalAlpha *= al;
    rrect(ctx, x, y - 11, w, 22, 11); ctx.fillStyle = 'rgba(242,236,217,0.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); rrect(ctx, x + 1, y - 10, w - 2, 20, 10); ctx.clip();
    const sp = 24, off = (T * 30) % sp;
    ctx.fillStyle = K.pos;
    for (let px = x - sp + off; px < x + w + sp; px += sp) {
      ctx.beginPath(); ctx.moveTo(px, y - 7); ctx.lineTo(px + 9, y); ctx.lineTo(px, y + 7); ctx.lineTo(px + 5, y); ctx.closePath(); ctx.fill();
    }
    ctx.restore(); ctx.restore();
  }
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function simulNote(ctx, y, al) {                  // 第 3、4 步：兩極其實同時進行
    return block(ctx, tr('※ 兩極同時進行，這裡分開看', '※ Both plates react at once'), RX, y, RW, K.cyan, 22, 'left', al);
  }
  function notes(ctx, i, tl, T) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y;
    if (i === 0) {
      y = block(ctx, tr('電解硫酸銅溶液', 'Electrolysing CuSO₄'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = pillRow(ctx, 'Cu²⁺', 0, tr('銅離子', 'copper ion'), y + 18, a(0.9));
      y = pillRow(ctx, 'SO₄²⁻', 1, tr('硫酸根離子', 'sulfate ion'), y + 12, a(1.4));
      y = row(ctx, 'dot', tr('兩極都用銅片', 'Two copper plates'), y + 18, K.white, a(2.4));
      y = block(ctx, tr('銅片＝活性電極', 'copper = active electrode'), RX + 40, y, RW - 40, K.cyan, 22, 'left', a(2.8));
      // 小對照圖：上一頁的碳棒 → 這一頁的銅片
      const aC = a(3.8), cy = y + 46;
      miniRod(ctx, RX + 12, cy, false, aC);
      arrowR(ctx, RX + 28, RX + 58, cy, K.white, aC);
      miniRod(ctx, RX + 74, cy, true, aC);
      const ls = wrap(ctx, tr('和上一頁只差一件事：碳棒換成銅片', 'One change: carbon rods → copper plates'), RW - 100, 22);
      const lh = 29, y0 = cy - (ls.length - 1) * lh / 2;
      ls.forEach((l, k) => text(ctx, l, RX + 100, y0 + k * lh, K.yellow, 22, 'left', aC));
      y = Math.max(cy + 24, y0 + ls.length * lh - lh / 2);
      row(ctx, 'dot', tr('開關打開：還沒通電', 'Switch open: no current'), y + 22, K.white, a(4.8));
    } else if (i === 1) {
      y = block(ctx, tr('通電', 'Current on'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'e', tr('電子走導線', 'Electrons: in the wire'), y + 14, K.electron, a(0.9));
      y = block(ctx, tr('從電池負極出發', 'leaving the battery\'s (−) end'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(1.1));
      y = block(ctx, tr('離子在溶液裡移動', 'Ions: in the solution'), RX, y + 16, RW, K.white, 24, 'left', a(1.6));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('往負極端', 'toward the (−) side'), y + 18, a(2.0));
      y = pillRow(ctx, 'SO₄²⁻', 1, tr('往正極端', 'toward the (+) side'), y + 12, a(2.4));
      row(ctx, 'ok', tr('電子不進入溶液', 'Electrons never enter the solution'), y + 18, K.green, a(3.6));
    } else if (i === 2) {
      y = block(ctx, tr('負極端（Cu）', '(−) side (Cu)'), RX, 110, RW, K.electron, 30, 'left', a(0.3), 38);
      y = pillRow(ctx, 'Cu²⁺', 0, tr('靠近銅片表面', 'reaches the plate'), y + 18, a(0.8));
      y = row(ctx, 'e', tr('得到電子', 'gains electrons'), y + 12, K.electron, a(1.8));
      y = row(ctx, 'cu', tr('變成紅色的銅 Cu', 'becomes red copper, Cu'), y + 10, K.cuText, a(2.8));
      y = row(ctx, 'ok', tr('附著上去：銅片變厚', 'It sticks on: the plate gets thicker'), y + 16, K.white, a(4.6));
      simulNote(ctx, y + 22, a(5.4));
    } else if (i === 3) {
      y = block(ctx, tr('正極端（Cu）', '(+) side (Cu)'), RX, 110, RW, K.pos, 30, 'left', a(0.3), 38);
      y = row(ctx, 'cu', tr('銅片表面的銅 Cu', 'Cu on the surface'), y + 14, K.cuText, a(0.9));
      y = row(ctx, 'e', tr('失去電子，電子走導線', 'loses electrons'), y + 12, K.electron, a(2.0));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('變成 Cu²⁺ 進入溶液', 'enters the water'), y + 16, a(2.9));
      y = row(ctx, 'ok', tr('銅片溶解：銅片變薄', 'The plate gets thinner'), y + 16, K.white, a(4.6));
      simulNote(ctx, y + 22, a(5.4));
    } else {
      const aT = a(0.2);
      ffwd(ctx, RX + 4, 112, aT, tl);
      text(ctx, tr('時間快轉', 'Fast-forward'), RX + 46, 112, K.yellow, 30, 'left', aT);
      // 顏色對照：一開始 vs 現在（同一個顏色）
      const aS = a(0.6), sy = 146;
      swatch(ctx, RX, sy, 92, 44, 1, aS); swatch(ctx, RX + 170, sy, 92, 44, BLUE_A, aS);
      text(ctx, '→', RX + 131, sy + 22, K.white, 26, 'center', aS);
      text(ctx, tr('一開始', 'At first'), RX + 46, sy + 64, K.white, 22, 'center', aS);
      text(ctx, tr('現在', 'Now'), RX + 216, sy + 64, K.white, 22, 'center', aS);
      // Cu²⁺：一邊用掉、一邊補上（兩條同速箭頭）
      const aB = a(1.2), hw = HW['Cu²⁺'];
      ionPill(ctx, RX + hw, 262, 'Cu²⁺', 0, aB);
      y = block(ctx, tr('一邊用掉、一邊補上', 'used up = replaced'), RX + 2 * hw + 12, 262, RW - 2 * hw - 12, K.white, 22, 'left', aB);
      const L1 = tr('負極端用掉', '(−) uses'), L2 = tr('正極端補上', '(+) adds');
      const lw = Math.max(textW(ctx, L1, 22), textW(ctx, L2, 22)), bx = RX + lw + 12, bw = RW - lw - 12;
      const ry = Math.max(y, 280) + 18;
      text(ctx, L1, RX, ry, K.electron, 22, 'left', aB); rateBar(ctx, bx, ry, bw, T, aB);
      text(ctx, L2, RX, ry + 36, K.pos, 22, 'left', aB); rateBar(ctx, bx, ry + 36, bw, T, aB);
      y = block(ctx, tr('（速率相等，示意）', '(same rate; sketch)'), RX, ry + 70, RW, K.muted, 22, 'left', aB);
      y = row(ctx, 'ok', tr('藍色完全不變', 'Blue stays the same'), y + 12, K.white, a(2.6));
      row(ctx, 'ok', tr('負極端變厚、正極端變薄', '(−) thicker, (+) thinner'), y + 8, K.white, a(3.6));
    }
    const botT = [5.4, 5.6, 6.0, 6.0, 5.2][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), K.yellow, a(botT));
  }

  // ───────── 圖例、標題、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = [[tr('藍球＝電子', 'Blue = electron'), 'b'], [tr('橘＝陽離子', 'Orange = cation'), 'p'], [tr('紫＝陰離子', 'Purple = anion'), 'n'],
      [tr('紅棕＝銅', 'Brown = Cu'), 'c']];
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((960 - sum) / Math.max(1, items.length - 1), 18, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'c') { ctx.save(); ctx.fillStyle = cuFill(ctx, x, x + 22); rrect(ctx, x, y - 9, 22, 18, 4); ctx.fill(); ctx.restore(); }
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
    HW = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻') };
    const T = STARTS[i] + tl;
    apparatus(ctx, i, tl, T);
    notes(ctx, i, tl, T);
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('cucuAnimCanvas');
  const ctl = () => window.ElAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('cucuAnimResult'); if (el) el.innerHTML = html;
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
    const r = document.getElementById('steps-cucu');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-cucu'); if (!r) return;
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

  window.ElAnim.cucu = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-cucu'); if (r) r.innerHTML = '';
      const o = document.getElementById('cucuAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) { S.ended = false; start(); } },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { cucu: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'cucu' : null, t: S.t, running: !!(S.raf || S.timer), step: S.step }; }
  };
})();
