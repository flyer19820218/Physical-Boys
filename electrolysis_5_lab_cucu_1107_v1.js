/* electrolysis_5_lab_cucu_1107_v1.js — 「🔬 動手做：自己選電極材質」學生實驗台（#cucuLabCanvas，邏輯 1000×600）
 *
 * 契約：window.ElLab.cucu = { activate(), deactivate(), relang(), _state() }
 * 頁面膠水：切到「藍色為什麼不變？」分頁呼叫 activate()、離開呼叫 deactivate()、切語言呼叫 relang()；activate 前呼叫其他三個也安全。
 * 只依賴頁面的 tr()；按鈕建在 #cucuLabControls（.lab-row／.lab-name／.lab-btn，頁面 CSS），一句結果寫進 #cucuLabResult。
 * 畫布不綁事件（只用按鈕）。版面與工具函式沿用同系列 electrolysis_5_lab_cuc（燒杯、電池在上方左負右正、開關缺口、
 * 白底安培計、右欄量表、快轉標示、重來時舊畫面淡出）；銅片（漸層、變薄虛線）、新析出的紅色銅（偏紅同色系）、
 * 正極端冒出的 Cu²⁺ 的畫法沿用同課動畫 electrolysis_5_cucu；碳棒、碳棒上的銅層、O₂ 氣泡、H⁺、藍色變淡（PALE＋BLUE 疊色：
 * 變淡是越來越接近無色的水，不是變暗）沿用 electrolysis_5_cuc。
 *
 * ── 學生自己選電極，再通電 ─────────────────────────────────
 *   ① 負極端電極：碳棒／銅片   ② 正極端電極：碳棒／銅片   ③ 動作：通電／斷電／快轉（切換開關，dt×6）／重來
 *   初始：碳棒＋碳棒（上一頁的裝置）、斷電。左＝負極端（接電池負極）、右＝正極端（接電池正極）。
 *   換電極：若正在通電先自動斷電；畫面重置（tc＝0，舊畫面 0.45 秒淡出），被換的那支閃一下黃色虛線框；快轉開關維持。
 *   重來：電極回到碳棒＋碳棒、斷電、快轉關、tc＝0；「已試過的接法」表保留（學習紀錄）。
 *   換分頁再回來：模組狀態留在記憶體，配置、進度、表都保留（看不見時 tc 不走）。
 *
 * ── 模型（全部只由「通電累計時間 tc」與兩極材質決定；斷電凍結；快轉時 tc 以 6 倍速累加） ─────────────
 *   p＝clamp(tc／14)：正常約 14 秒、快轉約 2.3 秒到終值。
 *   負極端一律：Cu²⁺ 得到電子析出銅，negCu＝p。碳棒＝先點狀再整層包住（同 cuc）；銅片＝外層長出新的紅色銅、變厚（同 cucu）。
 *   正極端＝碳棒：冒 O₂、產生 H⁺；blue＝1−0.76·p（終值 0.24 仍帶藍），ph（量表長度）＝1−0.65·p，posCu＝0（沒有銅）。
 *   正極端＝銅片：銅失去電子變成 Cu²⁺ 進入溶液，浸在溶液那段半寬 17→9（posCu＝1−8p／17，虛線＝原厚度）；blue＝1、ph＝1。
 *   已試過：該組 p 第一次 ≥ 0.5 時填入 tried[組]＝'fade'|'same'，「？」0.15 秒淡出後 ✓ 與文字 0.25 秒淡入；重來不清除。
 *   離子（示意數量）：Cu²⁺ 4 個，第 2、4 列在 p≈0.22、0.62 起靠近負極端表面、淡出（變成銅）；
 *     正極端碳棒：H⁺ 0 → 4（p≈0.14、0.38、0.62、0.86 淡入，原處水分子同時淡出），Cu²⁺ 4 → 2；
 *     正極端銅片：同一時刻在正極端旁淡入新的 Cu²⁺（與負極端用掉的那顆互補），Cu²⁺ 一直約 4 個。SO₄²⁻ 一直 4 個。
 *   電子：只在導線與電極裡；電池負極 → 導線 → 負極端；正極端 → 導線（經安培計、開關）→ 電池正極；位置＝tc 的函式。
 *   電子流透明度、指針、開關、O₂ 氣泡透明度、快轉標示用 dt 平滑（約 0.2～0.3 秒），不會突變。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 0–30 不放東西。y≈58 狀態一句（黃，置中於 x 480，寬 ≤ 780）。左半裝置與 lab_cuc 相同：
 *   外導線 y=118：負極端 x=155 → 電池（短粗 x=222、長細 x=238）→ 開關 x 296–336 → 安培計（中心 x=430）→ 正極端 x=510。
 *   燒杯 x 75–590、杯口 240、液面 272、杯底 474；y=256 溶液名稱（未通電）／兩極的變化（通電之後）。
 *   右欄 x 660–970：已試過的接法 2×2 表（y 102–294）、三條量表（藍色深淺／負極端的銅／正極端）＋ pH 一句（y 330–432）、
 *   快轉標示（y≈466）。y≈506–536 本組一句重點（黃）；y≈574 圖例（避開右下角 90px）。
 */
(function () {
  'use strict';
  window.ElLab = window.ElLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', electron: '#4dd2ff', red: '#ff6b5a',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    nuHi: '#f39468', nu: '#d2653a', nuLo: '#93401d',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d', cText: '#b3c0bb',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)', o2: '#ff78b7'
  };
  const BLUE = a => `rgba(40,110,200,${(0.55 * a).toFixed(4)})`;                    // 硫酸銅溶液：皇家藍半透明
  const PALE = a => `rgba(205,228,232,${(0.10 + 0.14 * (1 - a)).toFixed(4)})`;     // 水本身的淡色：藍色越淡越接近無色的水
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const L = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    if (s.indexOf('\n') >= 0) return s.split('\n').reduce((a, part) => a.concat(wrap(ctx, part, maxW, size)), []);
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : (s.match(/[A-Za-z0-9⁺⁻₀-₉²³]+[）)、，。：]?|./gu) || []);   // 中文：化學式不從中間斷開
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
    const seg = []; let len = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 1e-6) continue;
      seg.push({ a, b, len: d, s0: len, dx: (b.x - a.x) / d, dy: (b.y - a.y) / d }); len += d;
    }
    return { pts, seg, L: len };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u };
  }

  // ───────── 幾何（同 lab_cuc） ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272, LOWY = LIQ + 6;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440, HW0 = EW / 2, MIDX = (NX + PX) / 2;
  const NS = NX + HW0, PS = PX - HW0;                                    // 原本面向溶液的表面 x
  const WY = 118, BN = 222, BP = 238, BATX = 230;
  const SW0 = 296, SW1 = 336;
  const MX = 430, MW = 110, MH = 64, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 32;
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 380 }]);
  const E_R = mkPath([{ x: PX, y: 330 }, { x: PX, y: WY }, { x: BP, y: WY }]);
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 660, RW = 310;
  // 離子（同 cuc／cucu 動畫）：4 列，每列左 Cu²⁺ 往負極端、右 SO₄²⁻ 往正極端
  const ROWS = [300, 346, 392, 438];
  const CU_H = [262, 286, 250, 276], SO_H = [350, 368, 334, 356];
  const CU_STOP = 222, SO_STOP = 374, HX = 448, SLOT_R = 460, V_ION = 10;
  const CU_EAT = { 1: 0.22, 3: 0.62 };                                   // 被消耗的 Cu²⁺：開始靠近表面的 p
  const H_IN = [{ r: 1, p: 0.14 }, { r: 2, p: 0.38 }, { r: 0, p: 0.62 }, { r: 3, p: 0.86 }];
  const SPOTS = [{ y: 346, s: 1, c: 0.02 }, { y: 318, s: 1, c: 0.035 }, { y: 372, s: 1, c: 0.05 }, { y: 296, s: 1, c: 0.065 },
    { y: 404, s: 1, c: 0.08 }, { y: 428, s: 1, c: 0.095 }, { y: 330, s: -1, c: 0.045 }, { y: 386, s: -1, c: 0.075 },
    { y: 300, s: -1, c: 0.1 }, { y: 420, s: -1, c: 0.11 }];
  const FULL_T = 14, FAST = 6, XF_T = 0.45, HALF = 0.5;
  const COMBOS = ['cc', 'ccu', 'cuc', 'cucu'];

  // ───────── 狀態 ─────────
  const S = {};
  const tried = { cc: null, ccu: null, cuc: null, cucu: null };        // 學習紀錄：重來不清除
  const triedT = { cc: 9, ccu: 9, cuc: 9, cucu: 9 };                    // 填入後的淡入計時
  function initState() {
    Object.assign(S, {
      neg: 'c', pos: 'c', power: false, fast: false, tc: 0, notice: 'init', recJust: null, flash: null,
      flowA: 0, needle: 0, swK: 0, fastA: 0, wall: S.wall || 0
    });
  }
  initState();
  const combo = () => S.neg + S.pos;
  const prog = () => clamp(S.tc / FULL_T, 0, 1);
  const posC = () => S.pos === 'c';
  const resKind = () => (posC() ? 'fade' : 'same');
  const posHW = p => HW0 - 8 * p;                                       // 正極端銅片浸在溶液那段的半寬
  const coatTh = p => (S.neg === 'cu' ? lerp(2.2, 9, ease(p)) : lerp(1.5, 6, ease(p)));
  const coatA = p => ease((p - 0.1) / 0.15);
  const nSurf = p => NS + coatTh(p) * coatA(p);
  function derived() {
    const p = prog(), c = posC();
    return {
      p, blue: c ? 1 - 0.76 * p : 1, ph: c ? 1 - 0.65 * p : 1, negCu: p,
      posCu: c ? 0 : posHW(p) / HW0, half: p >= HALF
    };
  }
  function outcome() {
    const d = derived();
    if (!S.power) return S.tc > 0 ? 'paused' : (S.notice === 'autooff' ? 'autooff' : 'ready');
    if (d.p >= 1) return 'full';
    return d.half ? 'judged' : 'run';
  }
  const MAT = { c: ['碳棒', 'Carbon rod'], cu: ['銅片', 'Copper plate'] };
  const MATS = { c: ['碳棒', 'Carbon'], cu: ['銅片', 'Copper'] };       // 畫布上的短名稱
  const matColor = m => (m === 'cu' ? K.cuText : K.cText);

  // ───────── 圖形：燒杯、溶液 ─────────
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

  // ───────── 圖形：碳棒、銅片、析出的銅 ─────────
  function rod(ctx, x) {
    const x0 = x - HW0;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ETOP, EW, EBOT - ETOP, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function plate(ctx, x, hw) {                      // 銅片：液面以上維持原寬；浸在溶液裡那段半寬 hw（同 cucu）
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
    ctx.restore();
  }
  function plateGhost(ctx, x, al) {                 // 正極端銅片原本的厚度（虛線）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(242,236,217,0.75)'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
    rrect(ctx, x - HW0, LOWY, EW, EBOT - LOWY, 6); ctx.stroke(); ctx.restore();
  }
  function clip(ctx, x) { ctx.save(); ctx.fillStyle = '#5a3a22'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill(); ctx.restore(); }
  function electrode(ctx, side, inLiquid, d) {
    const x = side === 'neg' ? NX : PX, m = S[side];
    if (m === 'c') {
      if (!inLiquid) rod(ctx, x);
      else { ctx.save(); ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, x - HW0, LIQ + 2, EW, EBOT - LIQ - 2, 8); ctx.fill(); ctx.restore(); }
      return;
    }
    const hw = side === 'pos' ? posHW(d.p) : HW0;
    if (!inLiquid) { plate(ctx, x, hw); return; }
    ctx.save(); innerClip(ctx, LIQ + 1); ctx.clip();                 // 浸在溶液裡那段：重畫在溶液之上，再蓋一層淡藍
    plate(ctx, x, hw);
    ctx.fillStyle = 'rgba(40,110,200,0.22)'; rrect(ctx, x - hw, LIQ + 2, hw * 2, EBOT - LIQ - 2, Math.min(6, hw)); ctx.fill();
    ctx.restore();
  }
  // 負極端析出的銅：先點狀，再長成一整層（碳棒＝cuc 的銅層包住碳棒；銅片＝cucu 的紅色新銅外層，看得出變厚）
  function coat(ctx, cu) {
    if (cu <= 0.001) return;
    const onCu = S.neg === 'cu';
    const spots = SPOTS.concat(Object.keys(CU_EAT).map(r => ({ y: ROWS[r], s: 1, c: CU_EAT[r] + 0.12 })));
    const ca = coatA(cu), th = coatTh(cu);
    ctx.save();
    spots.forEach(o => {
      const a = ease((cu - o.c) / 0.03) * (onCu ? 1 - ca : 1);
      if (a <= 0.01) return;
      const x = o.s > 0 ? NS : NX - HW0, r = 5.5 * a;
      ctx.fillStyle = onCu ? K.nu : K.cu; ctx.strokeStyle = onCu ? K.nuLo : K.cuLo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, o.y, r, o.s > 0 ? -Math.PI / 2 : Math.PI / 2, o.s > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    if (ca > 0.01) {
      if (onCu) {
        const t = th * ca, x0 = NX - HW0 - t, x1 = NX + HW0 + t, y0 = LIQ + 8;
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(x0, y0, x1 - x0, EBOT - y0 + t, 6 + t); ctx.roundRect(NX - HW0, y0, EW, EBOT - y0, 6); }
        else { ctx.rect(x0, y0, x1 - x0, EBOT - y0 + t); ctx.rect(NX - HW0, y0, EW, EBOT - y0); }
        ctx.fillStyle = cuFill(ctx, x0, x1, true); ctx.fill('evenodd');
        ctx.strokeStyle = 'rgba(255,176,128,0.9)'; ctx.lineWidth = 1.6;
        rrect(ctx, x0, y0, x1 - x0, EBOT - y0 + t, 6 + t); ctx.stroke();
        ctx.fillStyle = 'rgba(255,200,150,0.45)';
        for (let k = 0; k < 9; k++) {
          const side = k % 2 ? x1 - t / 2 : x0 + t / 2;
          ctx.beginPath(); ctx.arc(side, LIQ + 22 + k * 17 + 6 * hash(k * 3.3), Math.min(1.8, t / 2), 0, TAU); ctx.fill();
        }
      } else {
        ctx.globalAlpha *= ca;
        const x0 = NX - HW0 - th, x1 = NX + HW0 + th;
        ctx.fillStyle = cuFill(ctx, x0, x1);
        rrect(ctx, x0, LIQ + 8, x1 - x0, EBOT - LIQ - 8 + th, 6 + th); ctx.fill();
        ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,200,150,0.35)';
        for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(lerp(x0 + 4, x1 - 4, hash(k * 3.3)), LIQ + 20 + k * 17, 1.8, 0, TAU); ctx.fill(); }
      }
    }
    ctx.restore();
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
  let HWP = { 'Cu²⁺': 34, 'SO₄²⁻': 42, 'H⁺': 22 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {        // kind 0＝陽離子（橘）、1＝陰離子（紫）
    if (al <= 0.01) return;
    const hw = HWP[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
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
  function bubble(ctx, x, y, r, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.strokeStyle = K.o2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function wireLine(ctx, pts) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
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
  function switchSym(ctx, k) {                      // k：0＝打開（導線在 SW0～SW1 真的留缺口）、1＝閉合
    const a = lerp(32, 0, k) * RAD, len = SW1 - SW0;
    ctx.save(); ctx.lineCap = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(SW0, WY);
      ctx.lineTo(SW0 + len * Math.cos(a), WY - len * Math.sin(a)); ctx.stroke();
    });
    ctx.fillStyle = K.white; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 2;
    [SW0, SW1].forEach(x => { ctx.beginPath(); ctx.arc(x, WY, 5, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function meter(ctx, k) {
    ctx.save();
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(ctx, MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -60 * RAD, a1 = 60 * RAD, R = 38;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-56, 30, k) * RAD - Math.PI / 2;
    ctx.strokeStyle = k > 0.05 ? '#c0392b' : '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'A', MX + 42, WY + 17, '#1f2a26', 22, 'center', 1, true);
  }
  function check(ctx, x, y, r, al) {                // ✓ 綠勾（圓框裡有符號，不只靠顏色）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(12,30,25,0.55)'; ctx.strokeStyle = K.green;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    const s = r / 13;
    ctx.beginPath(); ctx.moveTo(x - 6 * s, y + 1 * s); ctx.lineTo(x - 1 * s, y + 6 * s); ctx.lineTo(x + 7 * s, y - 5 * s); ctx.stroke();
    ctx.restore();
  }
  function flashBox(ctx, x, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    rrect(ctx, x - 40, ETOP - 12, 80, EBOT - ETOP + 22, 12); ctx.stroke(); ctx.restore();
  }
  function ffwd(ctx, x, y, al, ph) {                // 快轉的雙三角（畫的，不靠字型）
    if (al <= 0.01) return;
    ctx.save(); ctx.fillStyle = K.yellow;
    [0, 16].forEach((dx, k) => {
      ctx.globalAlpha = al * (0.55 + 0.45 * Math.max(0, Math.sin(ph * 6 - k * 1.2)));
      ctx.beginPath(); ctx.moveTo(x + dx, y - 11); ctx.lineTo(x + dx + 15, y); ctx.lineTo(x + dx, y + 11); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  // ───────── 依 tc／p 算出的運動（純函式） ─────────
  function ions(ctx, p) {
    const tc = S.tc, d = tc * V_ION, amp = lerp(7, 1.5, ease(tc / 1.5)), c = posC();
    ROWS.forEach((y, r) => {
      const jx = amp * Math.sin(tc * 1.1 + r * 1.9), jy = k => 3 * Math.sin(tc * 1.7 + r * 2.3 + k * 2.9);
      let x = CU_H[r] - Math.min(CU_H[r] - CU_STOP, d) + jx, a = 1, yy = y + jy(0);
      const e = CU_EAT[r];
      if (e !== undefined) {                         // 靠近負極端表面 → 淡出（得到電子變成銅）
        const u = ease((p - e) / 0.08);
        x = lerp(x, nSurf(p) + HWP['Cu²⁺'] + 6, u); yy = lerp(yy, y, u);
        a = 1 - ease((p - e - 0.09) / 0.05);
        if (!c) {                                    // 正極端銅片：同一時刻在正極端旁補上一個 Cu²⁺（互補淡入）
          const b = ease((p - e - 0.09) / 0.05);
          ionPill(ctx, lerp(SLOT_R + 16, SLOT_R, ease((p - e - 0.09) / 0.1)) + jx, y + jy(2) * b, 'Cu²⁺', 0, b);
        }
      }
      ionPill(ctx, x, yy, 'Cu²⁺', 0, a);
      ionPill(ctx, SO_H[r] + Math.min(SO_STOP - SO_H[r], d) + jx, y + jy(1), 'SO₄²⁻', 1, 1);
    });
    if (c) H_IN.forEach(e => {                       // 正極端碳棒：水分子靠近表面、淡出；H⁺ 淡入
      const y = ROWS[e.r];
      waterMol(ctx, lerp(452, 474, ease((p - e.p + 0.05) / 0.05)) + 1.5 * Math.sin(tc * 1.4 + e.r), y + 2 * Math.sin(tc * 1.9 + e.r * 2),
        0.95 * (1 - ease((p - e.p + 0.01) / 0.035)));
      const a = ease((p - e.p) / 0.05);
      ionPill(ctx, lerp(466, HX, ease((p - e.p) / 0.08)) + 1.5 * Math.sin(tc * 2.1 + e.r), y + 2 * Math.sin(tc * 1.6 + e.r * 1.3), 'H⁺', 0, a);
    });
  }
  function ionCounts(p) {
    const eaten = Object.keys(CU_EAT).reduce((s, r) => s + ease((p - CU_EAT[r] - 0.09) / 0.05), 0);
    const h = posC() ? H_IN.reduce((s, e) => s + ease((p - e.p) / 0.05), 0) : 0;
    return { cu2: +(posC() ? 4 - eaten : 4).toFixed(3), h: +h.toFixed(3), so4: 4 };
  }
  function flowE(ctx) {
    const al = S.flowA;
    if (al <= 0.01) return;
    const V = 110, sp = 52, d = V * S.tc;
    [E_L, E_R].forEach(P => {
      for (let k = -1; k * sp < P.L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > P.L) continue;
        const pt = at(P, s), fade = clamp(Math.min(s, P.L - s) / 26, 0, 1);
        ball(ctx, pt.x, pt.y, 8, fade * al);
      }
    });
  }
  function bubbles(ctx) {                           // 正極端碳棒表面的 O₂：每 0.3 s（tc）一顆，往上冒
    const al = S.flowA;
    if (al <= 0.01 || !posC()) return;
    const tc = S.tc, kHi = Math.floor(tc / 0.3), kLo = Math.max(0, Math.floor((tc - 3) / 0.3));
    for (let k = kLo; k <= kHi; k++) {
      const h1 = hash(k * 3.1 + 7), h2 = hash(k * 7.7 + 1.3), h3 = hash(k * 1.9 + 4.2);
      const age = tc - (k * 0.3 + h1 * 0.1);
      if (age < 0) continue;
      const r = 3.5 + h3 * 2.8, y = 296 + h2 * 140 - 78 * age * (0.85 + 0.3 * h3);
      if (y - r <= LIQ + 2) continue;
      const x = PS - r - 3 - Math.min(4, 10 * age) - 1.5 * Math.sin(age * 7 + k);
      bubble(ctx, x, y, r, al * clamp(age / 0.15, 0, 1) * clamp((y - r - LIQ - 2) / 10, 0, 1));
    }
  }

  // ───────── 裝置 ─────────
  function apparatus(ctx, d) {
    const p = d.p;
    beakerBack(ctx);
    electrode(ctx, 'neg', false, d); electrode(ctx, 'pos', false, d);
    liquid(ctx, d.blue);
    electrode(ctx, 'neg', true, d); electrode(ctx, 'pos', true, d);
    coat(ctx, d.negCu);
    if (S.pos === 'cu') plateGhost(ctx, PX, clamp((HW0 - posHW(p)) / 0.8, 0, 1));
    ions(ctx, p);
    bubbles(ctx);
    beakerFront(ctx);
    if (S.flash) {
      const fa = S.flash.t < 0.9 ? 1 - ease((S.flash.t - 0.5) / 0.4) : 0;
      if (S.flash.slots.indexOf('L') >= 0) flashBox(ctx, NX, fa);
      if (S.flash.slots.indexOf('R') >= 0) flashBox(ctx, PX, fa);
    }
    // y=256：溶液名稱（還沒開始）→ 兩極的變化（開始之後）
    text(ctx, L('硫酸銅溶液（藍色）', 'CuSO₄ solution (blue)'), MIDX, 256, K.white, 22, 'center', 1 - ease(p / 0.03));
    const ea = ease((p - 0.04) / 0.05);
    text(ctx, S.neg === 'cu' ? L('銅片變厚', 'gets thicker') : L('析出紅色 Cu', 'red Cu forms'), NS + 14, 256, K.cuText, 22, 'left', ea);
    if (posC()) text(ctx, L('O₂ 氣泡', 'O₂ bubbles'), PS - 6, 256, K.o2, 22, 'right', ea);
    else text(ctx, L('銅片變薄', 'gets thinner'), PS - 6, 256, K.cuText, 22, 'right', ea);
    // 電路：導線 → 夾子 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w));
    clip(ctx, NX); clip(ctx, PX);
    flowE(ctx);
    switchSym(ctx, S.swK);
    meter(ctx, S.needle);
    battery(ctx);
    text(ctx, L('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, L('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, L('安培計', 'Ammeter'), MX, WY + MH / 2 + 20, K.white, 22, 'center');
    text(ctx, L('負極端', '(−) side'), NX - 24, 182, K.electron, 24, 'right');
    text(ctx, L('正極端', '(+) side'), PX + HW0 + 14, 182, K.pos, 24, 'left');
    text(ctx, L(MATS[S.neg][0], MATS[S.neg][1]), NX + 24, 206, matColor(S.neg), 22, 'left');
    text(ctx, L(MATS[S.pos][0], MATS[S.pos][1]), PX + HW0 + 14, 212, matColor(S.pos), 22, 'left');
  }

  // ───────── 右欄：已試過的接法（2×2）＋三條量表＋快轉標示 ─────────
  const TX = RX + 88, CW = 111, RH = 48, TY = 176;
  function triedTable(ctx) {
    text(ctx, L('已試過的接法', 'Setups tried'), RX, 102, K.white, 24, 'left');
    text(ctx, L('負極端 ↓', '(−) side ↓'), RX, 136, K.electron, 22, 'left');
    text(ctx, L('正極端 →', '(+) side →'), TX + CW, 136, K.pos, 22, 'center');
    ['c', 'cu'].forEach((m, j) => text(ctx, L(MATS[m][0], MATS[m][1]), TX + CW * j + CW / 2, 164, matColor(m), 22, 'center'));
    ['c', 'cu'].forEach((n, i) => {
      const cy = TY + RH * i + RH / 2;
      text(ctx, L(MATS[n][0], MATS[n][1]), RX, cy, matColor(n), 22, 'left');
      ['c', 'cu'].forEach((m, j) => {
        const key = n + m, x0 = TX + CW * j + 3, y0 = TY + RH * i + 3, w = CW - 6, h = RH - 6, cx = x0 + w / 2;
        const r = tried[key], qa = r ? 1 - ease(triedT[key] / 0.15) : 1, al = r ? ease((triedT[key] - 0.15) / 0.25) : 0;   // 「？」先淡出，結果再淡入
        ctx.save();
        rrect(ctx, x0, y0, w, h, 8); ctx.fillStyle = 'rgba(242,236,217,0.06)'; ctx.fill();
        if (al > 0.01) {                             // 格子底色＝該組最後的溶液顏色（外加 ✓ 與文字，不只靠顏色）
          const b = r === 'fade' ? 0.24 : 1;
          ctx.globalAlpha = al; ctx.fillStyle = PALE(b); ctx.fill(); ctx.fillStyle = BLUE(b); ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = 'rgba(242,236,217,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
        text(ctx, '？', cx, y0 + h / 2 + 1, K.muted, 24, 'center', qa);
        if (al > 0.01) {
          const s = r === 'fade' ? L('變淡', 'Fades') : L('不變', 'Same');
          const tw = textW(ctx, s, 22), gx = cx - (tw + 30) / 2;
          check(ctx, gx + 11, y0 + h / 2, 11, al);
          text(ctx, s, gx + 30, y0 + h / 2 + 1, K.white, 22, 'left', al);
        }
        if (key === combo()) {                       // 目前的接法：黃色虛線框
          ctx.save(); ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
          rrect(ctx, x0 - 1.5, y0 - 1.5, w + 3, h + 3, 9); ctx.stroke(); ctx.restore();
        }
      });
    });
    block(ctx, L('格子裡：藍色怎麼變', 'Box: what the blue did'), RX, 294, RW, K.muted, 22, 'left', 1, 26);
  }
  function gauges(ctx, d) {
    const c = posC();
    const labels = [L('藍色深淺', 'Blue color'), L('負極端的銅', 'Cu on (−)'), c ? L('正極端 O₂', '(+) O₂') : L('正極端銅片', '(+) Cu plate')];
    const lw = Math.max.apply(null, labels.map(s => textW(ctx, s, 22)));
    const bx = RX + lw + 14, bw = RX + RW - bx;
    const vals = [d.blue, d.negCu, c ? d.p : d.posCu];
    const fills = [
      'rgba(60,130,225,0.95)',
      cuFill(ctx, bx, bx + bw, S.neg === 'cu'),
      c ? 'rgba(255,120,183,0.85)' : cuFill(ctx, bx, bx + bw)];
    labels.forEach((s, k) => {
      const yy = 330 + k * 34;
      text(ctx, s, RX, yy, k === 2 && c ? K.o2 : K.white, 22, 'left');
      ctx.save();
      ctx.fillStyle = 'rgba(242,236,217,0.10)'; rrect(ctx, bx, yy - 9, bw, 18, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      const v = clamp(vals[k], 0, 1);
      if (v > 0.005) { ctx.fillStyle = fills[k]; rrect(ctx, bx, yy - 9, Math.max(bw * v, 4), 18, 9); ctx.fill(); }
      ctx.restore();
    });
    const pa = ease((d.p - 0.03) / 0.05), phL = L('pH 值：', 'pH: ');
    text(ctx, phL, RX, 432, K.white, 22, 'left');
    text(ctx, c ? L('下降 ↓（H⁺ 增加）', 'falling ↓ (more H⁺)') : L('不變', 'no change'), RX + textW(ctx, phL, 22), 432, K.white, 22, 'left', pa);
  }
  function panel(ctx, d) {
    triedTable(ctx);
    gauges(ctx, d);
    ffwd(ctx, RX + 4, 468, S.fastA, S.tc);
    text(ctx, L('快轉 ×6', 'Fast-forward ×6'), RX + 46, 468, K.yellow, 26, 'left', S.fastA);
  }

  // ───────── 標題、重點、圖例 ─────────
  const CAP = {
    ready: ['選好兩極的電極，再按「通電」', 'Choose both electrodes, then press "Switch on"'],
    autooff: ['換了電極：已自動斷電，重新開始', 'Electrode changed: power off, starting over'],
    paused: ['已斷電：溶液停在這裡', 'Switched off: the solution stops changing'],
    run: ['通電中：看兩極和溶液的藍色', 'Current on: watch both electrodes and the blue'],
    judgedfade: ['藍色越來越淡了', 'The blue keeps fading'],
    judgedsame: ['藍色沒有變', 'The blue is not changing'],
    fullfade: ['藍色變得很淡（仍帶一點藍）', 'The blue is now pale (still a little blue)'],
    fullsame: ['藍色一直沒有變', 'The blue has not changed at all']
  };
  function capKey(oc) { return oc === 'judged' || oc === 'full' ? oc + resKind() : oc; }
  const BOT = {
    before: ['換換看：兩極各用碳棒或銅片，通電後比一比溶液的藍色', 'Try carbon or copper on each side, then compare the blue after switching on'],
    cc: ['負極端：Cu²⁺ 變成銅；正極端：產生 O₂ 和 H⁺，沒有補上 Cu²⁺', '(−) side: Cu²⁺ becomes copper; (+) side: O₂ and H⁺ form, no Cu²⁺ is added back'],
    cuc: ['負極端：Cu²⁺ 變成銅，銅片變厚；正極端：產生 O₂ 和 H⁺', '(−) side: Cu²⁺ becomes copper, the plate gets thicker; (+) side: O₂ and H⁺ form'],
    ccu: ['負極端：Cu²⁺ 變成銅；正極端：銅片溶解，補上 Cu²⁺', '(−) side: Cu²⁺ becomes copper; (+) side: the copper plate dissolves and adds Cu²⁺'],
    cucu: ['負極端：銅片變厚；正極端：銅片溶解變薄，補上 Cu²⁺', '(−) side: the plate gets thicker; (+) side: the plate dissolves, adding Cu²⁺']
  };
  const CX = 480;
  function drawCaption(ctx, s) { text(ctx, wrap(ctx, s, 780, 26)[0], CX, 58, K.yellow, 26); }
  function bottomLines(ctx, s) {
    const ls = wrap(ctx, s, 840, 24);
    if (ls.length === 1) text(ctx, ls[0], CX, 521, K.yellow, 24, 'center');
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, CX, k ? 536 : 506, K.yellow, 24, 'center'));
  }
  function drawLegend(ctx) {
    const items = [[L('藍球＝電子', 'Blue = electron'), 'b'], [L('橘＝陽離子', 'Orange = cation'), 'p'],
      [L('紫＝陰離子', 'Purple = anion'), 'n'], [L('粉紅圈＝O₂', 'Pink ring = O₂'), 'o']];
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((850 - sum) / Math.max(1, items.length - 1), 14, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = clamp(470 - tot / 2, 30, 900 - tot); const y = 574;          // 右端不進右下角 90px
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'o') bubble(ctx, x + 10, y, 8, 1);
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }

  // ───────── 繪製 ─────────
  let cv = null, ctx = null, ctrl = null, res = null, XF = null;   // XF：換電極／重來時舊畫面的快照（淡出）
  function render() {
    if (!cv || !ctx || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    HWP = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻'), 'H⁺': pillHalf(ctx, 'H⁺') };
    const d = derived(), oc = outcome();
    apparatus(ctx, d);
    panel(ctx, d);
    const ck = CAP[capKey(oc)], bk = BOT[S.tc > 0 ? combo() : 'before'];
    drawCaption(ctx, L(ck[0], ck[1]));
    bottomLines(ctx, L(bk[0], bk[1]));
    drawLegend(ctx);
    if (XF && XF.t < XF_T) {
      ctx.save(); ctx.globalAlpha = 1 - ease(XF.t / XF_T);
      ctx.drawImage(XF.img, 0, 0, W, H); ctx.restore();
    }
  }
  function snapshot() {
    if (!cv || !cv.width) return;
    const img = document.createElement('canvas'); img.width = cv.width; img.height = cv.height;
    img.getContext('2d').drawImage(cv, 0, 0); XF = { img, t: 0 };
  }

  // ───────── 結果框（只說「這一組發生了什麼、為什麼」） ─────────
  function setupName() {
    return L(`負極端${MAT[S.neg][0]}、正極端${MAT[S.pos][0]}`, `(−) ${MAT[S.neg][1].toLowerCase()}, (+) ${MAT[S.pos][1].toLowerCase()}`);
  }
  const RUN = {
    cc: ['通電中：負極端碳棒漸漸被紅色的銅包住，正極端碳棒冒出 O₂ 氣泡。看看藍色怎麼變！',
      'Current on: red copper slowly covers the (−) carbon rod, and O₂ bubbles rise at the (+) carbon rod. Watch the blue!'],
    cuc: ['通電中：負極端銅片長出新的銅、漸漸變厚，正極端碳棒冒出 O₂ 氣泡。看看藍色怎麼變！',
      'Current on: new copper grows on the (−) copper plate, and O₂ bubbles rise at the (+) carbon rod. Watch the blue!'],
    ccu: ['通電中：負極端碳棒漸漸被紅色的銅包住，正極端銅片慢慢溶解。看看藍色怎麼變！',
      'Current on: red copper slowly covers the (−) carbon rod, and the (+) copper plate slowly dissolves. Watch the blue!'],
    cucu: ['通電中：負極端銅片長出新的銅，正極端銅片慢慢溶解。看看藍色怎麼變！',
      'Current on: new copper grows on the (−) copper plate, and the (+) copper plate slowly dissolves. Watch the blue!']
  };
  const VERD = {
    cc: ['碳棒＋碳棒：負極端碳棒被銅層包住，正極端冒 O₂。溶液裡的 Cu²⁺ 一直被用掉、沒有東西補上，所以藍色變淡；同時產生 H⁺，溶液變酸（pH 值下降）。',
      'Carbon + carbon: a copper layer covers the (−) rod and O₂ forms at the (+) rod. Cu²⁺ keeps being used up and nothing replaces it, so the blue fades; H⁺ also forms, so the solution turns acidic (pH falls).'],
    cuc: ['負極端銅片、正極端碳棒：負極端銅片長出新的銅、變厚，正極端碳棒冒 O₂。Cu²⁺ 被用掉卻沒有補充，所以藍色變淡；產生 H⁺，溶液變酸（pH 值下降）。',
      '(−) copper, (+) carbon: new copper makes the (−) plate thicker and O₂ forms at the (+) rod. Cu²⁺ is used up but not replaced, so the blue fades; H⁺ forms, so the solution turns acidic (pH falls).'],
    ccu: ['負極端碳棒、正極端銅片：負極端碳棒被銅層包住，正極端銅片變薄。正極端的銅溶解成 Cu²⁺ 補進溶液，用掉多少就補回多少，所以藍色不變、pH 值不變。',
      '(−) carbon, (+) copper: a copper layer covers the (−) rod and the (+) plate gets thinner. Copper from the (+) plate dissolves as Cu²⁺, replacing what is used up, so the blue and the pH stay the same.'],
    cucu: ['銅片＋銅片：負極端銅片變厚，正極端銅片變薄。正極端的銅溶解成 Cu²⁺ 補進溶液，用掉多少就補回多少，所以藍色不變、pH 值不變。',
      'Copper + copper: the (−) plate gets thicker and the (+) plate gets thinner. Copper from the (+) plate dissolves as Cu²⁺, replacing what is used up, so the blue and the pH stay the same.']
  };
  const nTried = () => COMBOS.filter(k => tried[k]).length;
  function resultHTML() {
    const oc = outcome(), d = derived(), key = combo();
    const small = s => `<br><small style="font-size:.85em;opacity:.85">${s}</small>`;
    const fastNote = S.notice === 'fastOn' ? small(L('快轉開啟：時間加快 6 倍，約 2.5 秒就到終點。', 'Fast-forward on: time runs 6 times faster, reaching the end in about 2.5 s.'))
      : S.notice === 'fastOff' ? small(L('快轉關閉：回到正常速度。', 'Fast-forward off: back to normal speed.')) : '';
    const n = nTried();
    const recNote = S.recJust === key ? small(L(`已記在右邊的表 ✓（已試 ${n}／4 種接法）`, `Recorded in the table on the right ✓ (${n} of 4 setups tried)`) +
      (n === 4 ? '<br>' + L('四種都試過了：比一比表上藍色變淡的那兩組，正極端用的是什麼？', 'All four tried: compare the two setups where the blue faded. What is on the (+) side?') : '')) : '';
    const v = VERD[key];
    if (!S.power) {
      if (oc === 'autooff') return L(`換電極前已自動斷電，畫面重新開始。現在：${setupName()}。按「通電」看看。`,
        `The power was switched off automatically before the change, and the bench started over. Now: ${setupName()}. Press "Switch on" to see.`) +
        small(L('「已試過的接法」表會保留。', 'The "Setups tried" table is kept.')) + fastNote;
      if (oc === 'ready') {
        if (S.notice === 'reset') return L('重來：電極回到碳棒＋碳棒，畫面回到開始。', 'Start over: both electrodes are carbon rods again, and the bench is back to the start.') +
          small(L(`「已試過的接法」表會保留（已試 ${n}／4 種）。`, `The "Setups tried" table is kept (${n} of 4 tried).`)) + fastNote;
        if (S.notice === 'off') return L('未通電，溶液不會改變。', 'No current, so the solution does not change.') + fastNote;
        if (S.notice === 'sel') return L(`現在：${setupName()}。按「通電」看看藍色怎麼變。`, `Now: ${setupName()}. Press "Switch on" and watch the blue.`) + fastNote;
        return L(`先選兩極的電極（現在：${setupName()}），再按「通電」。`, `First choose both electrodes (now: ${setupName()}), then press "Switch on".`) + fastNote;
      }
      return L('未通電，溶液不會改變。', 'No current, so the solution does not change.') +
        (d.half ? '<br>' + L(v[0], v[1]) : L('（目前的變化會保留，再按「通電」可以接著做。）', ' (What has happened so far is kept; press "Switch on" to continue.)')) + recNote + fastNote;
    }
    if (!d.half) return L(RUN[key][0], RUN[key][1]) + fastNote;
    return L(v[0], v[1]) + (d.p >= 1 ? small(posC() ? L('藍色已經很淡，但還看得到一點藍。', 'The blue is now pale, but a little blue is still visible.')
      : L('通電了這麼久，藍色還是一樣。', 'Even after all this time, the blue is the same.')) : '') + recNote + fastNote;
  }
  let lastRes = '';
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
    if (cv) {
      const ck = CAP[capKey(outcome())];
      const al = L('選電極實驗台：', 'Electrode bench: ') + setupName() + L('。', '. ') + L(ck[0], ck[1]);
      if (cv.getAttribute('aria-label') !== al) cv.setAttribute('aria-label', al);
    }
  }

  // ───────── 按鈕 ─────────
  function spec() {
    return [
      [L('① 負極端電極', '① (−) electrode'), [['neg:c', L('碳棒', 'Carbon rod')], ['neg:cu', L('銅片', 'Copper plate')]]],
      [L('② 正極端電極', '② (+) electrode'), [['pos:c', L('碳棒', 'Carbon rod')], ['pos:cu', L('銅片', 'Copper plate')]]],
      [L('③ 動作', '③ Action'), [['act:on', L('通電', 'Switch on')], ['act:off', L('斷電', 'Switch off')],
        ['act:fast', L('快轉', 'Fast-forward')], ['act:reset', L('重來', 'Start over')]]]
    ];
  }
  function buildControls() {
    if (!ctrl) return;
    const fk = document.activeElement && ctrl.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    ctrl.style.touchAction = 'pan-y';
    spec().forEach(([name, btns]) => {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      btns.forEach(([key, label]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = label;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      });
      ctrl.appendChild(row);
    });
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b) b.focus(); }
  }
  function pressed(key) {
    const [g, v] = key.split(':');
    if (g === 'neg' || g === 'pos') return S[g] === v;
    if (v === 'on') return S.power;
    if (v === 'off') return !S.power;
    if (v === 'fast') return S.fast;
    return false;
  }
  function refreshUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const on = pressed(b.dataset.act);
      b.classList.toggle('active', on);
      if (b.getAttribute('aria-pressed') !== (on ? 'true' : 'false')) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    writeResult();
  }
  function act(key) {
    const [g, v] = key.split(':');
    if (g === 'neg' || g === 'pos') {
      if (S[g] === v) { refreshUI(); return; }
      const wasOn = S.power;
      snapshot();
      S[g] = v; S.power = false; S.tc = 0; S.flowA = 0; S.needle = 0; S.swK = 0; S.recJust = null;
      S.notice = wasOn ? 'autooff' : 'sel';
      S.flash = { t: 0, slots: g === 'neg' ? 'L' : 'R' };
    } else if (v === 'on') {
      if (!S.power) { S.power = true; S.notice = null; S.recJust = null; }
    } else if (v === 'off') {
      if (S.power) { S.power = false; S.notice = S.tc > 0 ? null : 'off'; }
      else if (S.tc <= 0) S.notice = 'off';
    } else if (v === 'fast') {
      S.fast = !S.fast; S.notice = S.fast ? 'fastOn' : 'fastOff';
    } else if (v === 'reset') {
      snapshot();
      initState(); S.notice = 'reset';
    }
    refreshUI(); render();
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  const R0 = { on: false, raf: 0, timer: 0, last: 0 };
  function step(dt) {
    S.wall += dt;
    if (S.power) S.tc += dt * (S.fast ? FAST : 1);
    const key = combo();
    if (prog() >= HALF && !tried[key]) { tried[key] = resKind(); triedT[key] = 0; S.recJust = key; }
    COMBOS.forEach(k => { if (triedT[k] < 9) triedT[k] = Math.min(9, triedT[k] + dt); });
    const ap = (v, target, rate) => v + (target - v) * Math.min(1, dt * rate);
    S.flowA = ap(S.flowA, S.power ? 1 : 0, 6);
    S.needle = ap(S.needle, S.power ? 1 : 0, 5);
    S.swK = ap(S.swK, S.power ? 1 : 0, 9);
    S.fastA = ap(S.fastA, S.fast ? 1 : 0, 8);
    ['flowA', 'needle', 'swK', 'fastA'].forEach(n => { if (S[n] < 0.002) S[n] = 0; if (S[n] > 0.998) S[n] = 1; });
    if (S.flash) { S.flash.t += dt; if (S.flash.t > 1) S.flash = null; }
    if (XF) { XF.t += dt; if (XF.t >= XF_T) XF = null; }
  }
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.1, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt); render(); refreshUI();
    R0.raf = requestAnimationFrame(frame);
  }
  function poll() { if (R0.timer || !R0.on) return; R0.timer = setTimeout(() => { R0.timer = 0; sync(); }, 300); }
  function sync() {
    const want = R0.on && !document.hidden;
    if (want && !R0.raf && !R0.timer) { R0.last = 0; R0.raf = requestAnimationFrame(frame); }
    else if (!want) { if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0; if (R0.timer) clearTimeout(R0.timer); R0.timer = 0; }
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (R0.on) deactivate();
    cv = document.getElementById('cucuLabCanvas');
    if (!cv || !cv.getContext) { cv = null; return; }
    ctx = cv.getContext('2d');
    ctrl = document.getElementById('cucuLabControls');
    res = document.getElementById('cucuLabResult');
    R0.on = true; lastRes = ''; XF = null;
    document.addEventListener('visibilitychange', onVis);
    buildControls(); refreshUI(); render(); sync();
  }
  function deactivate() {
    R0.on = false;
    if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0;
    if (R0.timer) clearTimeout(R0.timer); R0.timer = 0;
    document.removeEventListener('visibilitychange', onVis);
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; XF = null;
  }
  function relang() {
    if (!R0.on || !cv) return;
    lastRes = ''; buildControls(); refreshUI(); render();
  }
  function _state() {
    const d = derived();
    return {
      neg: S.neg, pos: S.pos, combo: combo(), power: S.power, fast: S.fast, progress: +d.p.toFixed(4),
      blue: +d.blue.toFixed(4), negCu: +d.negCu.toFixed(4), posCu: +d.posCu.toFixed(4), ph: +d.ph.toFixed(4),
      o2: posC() && S.power, tried: Object.assign({}, tried), triedCount: nTried(),
      tc: +S.tc.toFixed(3), outcome: outcome(), ions: ionCounts(d.p),
      needle: +S.needle.toFixed(3), flowA: +S.flowA.toFixed(3), fastA: +S.fastA.toFixed(3), running: !!R0.raf, on: R0.on
    };
  }

  window.ElLab.cucu = { activate, deactivate, relang, _state };
})();
