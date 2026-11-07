/* electrolysis_5_lab_cuc_1107_v1.js — 「🔬 動手做：先預測，藍色會怎麼變？」學生實驗台（#cucLabCanvas，邏輯 1000×600）
 *
 * 契約：window.ElLab.cuc = { activate(), deactivate(), relang(), _state() }
 * 頁面膠水：切到「藍色為什麼變淡？」分頁呼叫 activate()、離開呼叫 deactivate()、切語言呼叫 relang()；activate 前呼叫其他三個也安全。
 * 只依賴頁面的 tr()；按鈕建在 #cucLabControls（.lab-row／.lab-name／.lab-btn，頁面 CSS），一句結果寫進 #cucLabResult。
 * 畫布不綁事件（只用按鈕）。版面與工具函式沿用同系列 electrolysis_5_lab_plating（燒杯、碳棒、電池在上方左負右正、
 * 開關缺口、白底安培計、右欄量表）；離子、析出的銅、O₂ 氣泡、H⁺、藍色變淡（PALE＋BLUE 疊色：變淡是越來越接近無色的水，
 * 不是變暗）的畫法與用語沿用同課動畫 electrolysis_5_cuc。
 *
 * ── 學生先預測，再通電 ─────────────────────────────────
 *   ① 預測：變淡／不變／變深（必選才能通電；未選時「通電」鈕 aria-disabled 外觀變淡，按下去結果框提示「先預測，再通電」）
 *   ② 動作：通電／斷電／快轉（切換開關，dt×6）／重來
 *   第一次通電後預測鈕鎖定（disabled），避免事後改答案；「重來」才解鎖並清空預測、關掉快轉、全部回初始（舊畫面 0.45 秒淡出）。
 *   兩極固定都是碳棒：左＝負極端（接電池負極）、右＝正極端（接電池正極）。
 *
 * ── 模型（全部只由「通電累計時間 tc」決定；斷電時 tc 不走＝凍結；快轉時 tc 以 6 倍速累加） ───────────────
 *   p＝clamp(tc／14)：正常約 14 秒、快轉約 2.3 秒到終值。
 *   blue＝1−0.76·p（終值 0.24＝動畫第 5 步的淡藍，仍看得到藍調）；cu＝p（負極端銅層）；ph＝1−0.65·p（pH 量表長度，越短 pH 越低）。
 *   判定：p ≥ 0.5（藍色變化達一半）時 judged＝(guess＝＝'fade')，之後保留到「重來」；✓／✗ 記號淡入。
 *   離子（示意數量）：Cu²⁺ 4 → 2（第 2、4 列的 Cu²⁺ 在 p≈0.22、0.62 起靠近負極端表面、淡出，變成銅）；
 *     H⁺ 0 → 4（p≈0.14、0.38、0.62、0.86 在正極端旁淡入，原處的水分子同時淡出）；SO₄²⁻ 一直 4 個。
 *     通電後 Cu²⁺ 往負極端、SO₄²⁻ 往正極端漂移（10 px／tc 秒，有上限），位置與微動都是 tc 的函式。
 *   電子：只在導線與碳棒裡，電池負極 → 導線 → 負極端碳棒；正極端碳棒 → 導線（經安培計、開關）→ 電池正極；位置＝tc 的函式。
 *   電子流透明度、安培計指針、開關、O₂ 氣泡透明度、快轉標示用 dt 平滑（約 0.2～0.3 秒），不會突變。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 0–30 不放東西。y≈58 狀態一句（黃，置中於 x 480，寬 ≤ 780，避開右上角 90px）。
 *   外導線 y=118：負極端 x=155 → 電池（短粗＝負極 x=222、長細＝正極 x=238）→ 開關 x 296–336 → 安培計（中心 x=430）→ 正極端 x=510。
 *   燒杯 x 75–590、杯口 240、液面 272、杯底 474；y=256 溶液名稱（未通電）／「析出紅色 Cu」「O₂ 氣泡」（通電之後）。
 *   右欄 x 670–960：你的預測（＋✓／✗）、三條量表（藍色深淺、負極端銅層、pH 值：下降）、示意註記、快轉標示（y≈452）。
 *   y≈506–536 本次一句重點（黃）；y≈574 圖例（避開右下角 90px）。
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
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
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

  // ───────── 幾何（同 plating 實驗台） ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440, HW0 = EW / 2, MIDX = (NX + PX) / 2;
  const NS = NX + HW0, PS = PX - HW0;                                    // 面向溶液的表面 x
  const WY = 118, BN = 222, BP = 238, BATX = 230;
  const SW0 = 296, SW1 = 336;
  const MX = 430, MW = 110, MH = 64, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 32;
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 380 }]);
  const E_R = mkPath([{ x: PX, y: 330 }, { x: PX, y: WY }, { x: BP, y: WY }]);
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 670, RW = 290;
  // 離子（同 cuc 動畫）：4 列，每列左 Cu²⁺ 往負極端、右 SO₄²⁻ 往正極端；H⁺ 在正極端旁 x≈448
  const ROWS = [300, 346, 392, 438];
  const CU_H = [262, 286, 250, 276], SO_H = [350, 368, 334, 356];
  const CU_STOP = 222, SO_STOP = 374, HX = 448, V_ION = 10;
  const CU_EAT = { 1: 0.22, 3: 0.62 };                                   // 被消耗的 Cu²⁺：開始靠近表面的 p
  const H_IN = [{ r: 1, p: 0.14 }, { r: 2, p: 0.38 }, { r: 0, p: 0.62 }, { r: 3, p: 0.86 }];
  const SPOTS = [{ y: 346, s: 1, c: 0.02 }, { y: 318, s: 1, c: 0.035 }, { y: 372, s: 1, c: 0.05 }, { y: 296, s: 1, c: 0.065 },
    { y: 404, s: 1, c: 0.08 }, { y: 428, s: 1, c: 0.095 }, { y: 330, s: -1, c: 0.045 }, { y: 386, s: -1, c: 0.075 },
    { y: 300, s: -1, c: 0.1 }, { y: 420, s: -1, c: 0.11 }];
  const FULL_T = 14, FAST = 6, XF_T = 0.45;

  // ───────── 狀態 ─────────
  const S = {};
  function initState() {
    Object.assign(S, {
      guess: null, power: false, fast: false, locked: false, tc: 0, notice: 'init', gT: 1, hint: 9,
      flowA: 0, needle: 0, swK: 0, fastA: 0, wall: 0
    });
  }
  initState();
  const prog = () => clamp(S.tc / FULL_T, 0, 1);
  function derived() {
    const p = prog();
    return { p, blue: 1 - 0.76 * p, cu: p, ph: 1 - 0.65 * p, judged: p >= 0.5 && S.guess ? S.guess === 'fade' : null };
  }
  function outcome() {
    const d = derived();
    if (!S.power) return S.tc > 0 ? 'paused' : (S.guess ? 'ready' : 'noGuess');
    if (d.p >= 1) return 'full';
    return d.judged === null ? 'run' : 'judged';
  }
  const GNAME = { fade: ['變淡', 'Fade'], same: ['不變', 'No change'], deeper: ['變深', 'Deeper'] };

  // ───────── 圖形：燒杯、溶液、碳棒、析出的銅 ─────────
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
  function cuFill(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, K.cuLo); g.addColorStop(0.3, K.cuHi); g.addColorStop(0.65, K.cu); g.addColorStop(1, K.cuLo);
    return g;
  }
  function rod(ctx, x) {
    const x0 = x - HW0;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ETOP, EW, EBOT - ETOP, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function clip(ctx, x) { ctx.save(); ctx.fillStyle = '#5a3a22'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill(); ctx.restore(); }
  // 負極端碳棒上的銅：先點狀，再長成一整層（同 cuc 動畫；厚度與透明度只由 cu 決定）
  function coat(ctx, cu) {
    if (cu <= 0.001) return;
    const spots = SPOTS.concat(Object.keys(CU_EAT).map(r => ({ y: ROWS[r], s: 1, c: CU_EAT[r] + 0.12 })));
    ctx.save();
    spots.forEach(o => {
      const a = ease((cu - o.c) / 0.03);
      if (a <= 0.01) return;
      const x = o.s > 0 ? NS : NX - HW0, r = 5.5 * a;
      ctx.fillStyle = K.cu; ctx.strokeStyle = K.cuLo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, o.y, r, o.s > 0 ? -Math.PI / 2 : Math.PI / 2, o.s > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    const ca = ease((cu - 0.1) / 0.15), th = lerp(1.5, 6, ease(cu));
    if (ca > 0.01) {
      ctx.globalAlpha *= ca;
      const x0 = NX - HW0 - th, x1 = NX + HW0 + th;
      ctx.fillStyle = cuFill(ctx, x0, x1);
      rrect(ctx, x0, LIQ + 8, x1 - x0, EBOT - LIQ - 8 + th, 6 + th); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,150,0.35)';
      for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(lerp(x0 + 4, x1 - 4, hash(k * 3.3)), LIQ + 20 + k * 17, 1.8, 0, TAU); ctx.fill(); }
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
  function mark(ctx, ok, x, y, al) {                // ✓ 綠勾／✗ 紅叉（圓框裡有符號，不只靠顏色）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
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
    const tc = S.tc, d = tc * V_ION, amp = lerp(7, 1.5, ease(tc / 1.5));
    ROWS.forEach((y, r) => {
      const jx = amp * Math.sin(tc * 1.1 + r * 1.9), jy = k => 3 * Math.sin(tc * 1.7 + r * 2.3 + k * 2.9);
      let x = CU_H[r] - Math.min(CU_H[r] - CU_STOP, d) + jx, a = 1, yy = y + jy(0);
      const e = CU_EAT[r];
      if (e !== undefined) {                         // 靠近負極端表面 → 淡出（得到電子變成銅）
        const u = ease((p - e) / 0.08);
        x = lerp(x, NS + HWP['Cu²⁺'] + 6, u); yy = lerp(yy, y, u);
        a = 1 - ease((p - e - 0.09) / 0.05);
      }
      ionPill(ctx, x, yy, 'Cu²⁺', 0, a);
      ionPill(ctx, SO_H[r] + Math.min(SO_STOP - SO_H[r], d) + jx, y + jy(1), 'SO₄²⁻', 1, 1);
    });
    H_IN.forEach(e => {                              // 正極端：水分子靠近表面、淡出；H⁺ 淡入
      const y = ROWS[e.r];
      waterMol(ctx, lerp(452, 474, ease((p - e.p + 0.05) / 0.05)) + 1.5 * Math.sin(tc * 1.4 + e.r), y + 2 * Math.sin(tc * 1.9 + e.r * 2),
        0.95 * (1 - ease((p - e.p + 0.01) / 0.035)));
      const a = ease((p - e.p) / 0.05);
      ionPill(ctx, lerp(466, HX, ease((p - e.p) / 0.08)) + 1.5 * Math.sin(tc * 2.1 + e.r), y + 2 * Math.sin(tc * 1.6 + e.r * 1.3), 'H⁺', 0, a);
    });
  }
  function ionCounts(p) {
    const cu = 4 - Object.keys(CU_EAT).reduce((s, r) => s + ease((p - CU_EAT[r] - 0.09) / 0.05), 0);
    const h = H_IN.reduce((s, e) => s + ease((p - e.p) / 0.05), 0);
    return { cu2: +cu.toFixed(3), h: +h.toFixed(3), so4: 4 };
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
    if (al <= 0.01) return;
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
    rod(ctx, NX); rod(ctx, PX);
    liquid(ctx, d.blue);
    ctx.save(); ctx.fillStyle = 'rgba(16,58,72,0.30)';          // 碳棒浸在溶液裡的那段稍微壓暗（同動畫）
    [NX, PX].forEach(x => { rrect(ctx, x - HW0, LIQ + 2, EW, EBOT - LIQ - 2, 8); ctx.fill(); });
    ctx.restore();
    coat(ctx, d.cu);
    ions(ctx, p);
    bubbles(ctx);
    beakerFront(ctx);
    // y=256：溶液名稱（還沒開始）→ 兩極的變化（開始之後）
    text(ctx, L('硫酸銅溶液（藍色）', 'CuSO₄ solution (blue)'), MIDX, 256, K.white, 22, 'center', 1 - ease(p / 0.03));
    const ea = ease((p - 0.04) / 0.05);
    text(ctx, L('析出紅色 Cu', 'red Cu forms'), NS + 14, 256, K.cuText, 22, 'left', ea);
    text(ctx, L('O₂ 氣泡', 'O₂ bubbles'), PS - 6, 256, K.o2, 22, 'right', ea);
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
    text(ctx, L('碳棒', 'Carbon'), NX + 24, 206, K.muted, 22, 'left');
    text(ctx, L('碳棒', 'Carbon'), PX + HW0 + 14, 212, K.muted, 22, 'left');
  }

  // ───────── 右欄：你的預測＋三條量表＋快轉標示 ─────────
  function gaugeBar(ctx, y, v, fill) {
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.10)'; rrect(ctx, RX, y - 9, RW, 18, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    v = clamp(v, 0, 1);
    if (v > 0.005) { ctx.fillStyle = fill; rrect(ctx, RX, y - 9, Math.max(RW * v, 4), 18, 9); ctx.fill(); }
    ctx.restore();
  }
  function hintBox(ctx) {                          // 沒預測就按「通電」：預測區閃一下黃色虛線框（淡入、停留、淡出）
    const t = S.hint, al = t < 1.6 ? ease(t / 0.15) * (1 - ease((t - 1.1) / 0.5)) : 0;
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    rrect(ctx, RX - 12, 88, RW + 20, 76, 12); ctx.stroke(); ctx.restore();
  }
  function panel(ctx, d) {
    hintBox(ctx);
    text(ctx, L('你的預測', 'Your prediction'), RX, 108, K.white, 24, 'left');
    const ga = ease(S.gT / 0.3);
    if (S.guess) {
      const nm = L(GNAME[S.guess][0], GNAME[S.guess][1]), w = textW(ctx, nm, 26);
      text(ctx, nm, RX, 144, K.yellow, 26, 'left', ga);
      const ja = d.judged === null ? 0 : ease((d.p - 0.5) / 0.05);
      const ok = S.guess === 'fade';
      mark(ctx, ok, RX + w + 26, 144, ja);
      text(ctx, ok ? L('答對了！', 'Correct!') : L('這次猜錯了', 'Not this time'), RX, 178, ok ? K.green : K.red, 22, 'left', ja);
    } else {
      text(ctx, L('還沒選：先預測', 'Not chosen yet'), RX, 144, K.muted, 22, 'left', ga);
    }
    // 三條量表（示意，不標數值）
    const pa = ease((d.p - 0.03) / 0.05);
    text(ctx, L('藍色深淺', 'Blue color'), RX, 220, K.white, 22, 'left');
    gaugeBar(ctx, 248, d.blue, 'rgba(60,130,225,0.95)');
    text(ctx, L('負極端銅層', 'Cu on the (−) rod'), RX, 286, K.white, 22, 'left');
    gaugeBar(ctx, 314, d.cu, cuFill(ctx, RX, RX + RW));
    const phL = L('pH 值', 'pH value');
    text(ctx, phL, RX, 352, K.white, 22, 'left');
    text(ctx, L('：下降 ↓', ': falling ↓'), RX + textW(ctx, phL, 22), 352, K.white, 22, 'left', pa);
    gaugeBar(ctx, 380, d.ph, 'rgba(242,236,217,0.85)');
    block(ctx, L('（示意，不是真實數值）', '(sketch, not real values)'), RX, 414, RW, K.muted, 22, 'left', 1, 28);
    // 快轉標示
    ffwd(ctx, RX + 4, 456, S.fastA, S.tc);
    text(ctx, L('快轉 ×6', 'Fast-forward ×6'), RX + 46, 456, K.yellow, 26, 'left', S.fastA);
  }

  // ───────── 標題、重點、圖例 ─────────
  const CAP = {
    noGuess: ['先預測：通電後，藍色會怎麼變？', 'Predict first: how will the blue change?'],
    ready: ['預測好了，按「通電」', 'Prediction set: press "Switch on"'],
    paused: ['已斷電：溶液停在這裡', 'Switched off: the solution stops changing'],
    run: ['通電中：仔細看溶液的藍色', 'Current on: watch the blue of the solution'],
    judged: ['藍色越來越淡了', 'The blue keeps fading'],
    full: ['藍色變得很淡（仍帶一點藍）', 'The blue is now pale (still a little blue)']
  };
  const BOT = {
    before: ['先預測，再通電：看負極端、正極端和溶液的變化', 'Predict, then switch on: watch both rods and the solution'],
    run: ['負極端析出紅色的 Cu，正極端冒出 O₂ 氣泡', 'Red Cu forms on the (−) rod; O₂ bubbles rise at the (+) rod'],
    after: ['Cu²⁺ 一直被消耗，藍色變淡；產生 H⁺，溶液變酸', 'Cu²⁺ is used up, so the blue fades; H⁺ forms, so it turns acidic']
  };
  function botKey(oc, d) { return d.judged !== null ? 'after' : (oc === 'run' || (oc === 'paused')) ? 'run' : 'before'; }
  const CX = 480;
  function drawCaption(ctx, s) { text(ctx, wrap(ctx, s, 780, 26)[0], CX, 58, K.yellow, 26); }
  function bottomLines(ctx, s) {
    const ls = wrap(ctx, s, 840, 24);
    if (ls.length === 1) text(ctx, ls[0], CX, 521, K.yellow, 24, 'center');
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, CX, k ? 536 : 506, K.yellow, 24, 'center'));
  }
  function drawLegend(ctx) {
    const items = [[L('藍球＝電子', 'Blue = electron'), 'b'], [L('橘＝陽離子', 'Orange = cation'), 'p'],
      [L('紫＝陰離子', 'Purple = anion'), 'n'], [L('粉紅圈＝O₂', 'Pink ring = O₂'), 'o']]   // 銅已在燒杯上方直接標「析出紅色 Cu」;
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
  let cv = null, ctx = null, ctrl = null, res = null, XF = null;   // XF：「重來」時舊畫面的快照（淡出）
  function render() {
    if (!cv || !ctx || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    HWP = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻'), 'H⁺': pillHalf(ctx, 'H⁺') };
    const d = derived(), oc = outcome();
    apparatus(ctx, d);
    panel(ctx, d);
    const ck = CAP[oc], bk = BOT[botKey(oc, d)];
    drawCaption(ctx, L(ck[0], ck[1]));
    bottomLines(ctx, L(bk[0], bk[1]));
    drawLegend(ctx);
    if (XF && XF.t < XF_T) {
      ctx.save(); ctx.globalAlpha = 1 - ease(XF.t / XF_T);
      ctx.drawImage(XF.img, 0, 0, W, H); ctx.restore();
    }
  }

  // ───────── 結果框 ─────────
  function verdictHTML(d) {
    const fade = L('Cu²⁺ 一直被消耗，藍色逐漸變淡；產生 H⁺，溶液變酸（pH 值下降）。',
      'Cu²⁺ is used up continuously, so the blue gradually fades; H⁺ forms, so the solution turns acidic (pH falls).');
    if (d.judged) return '✓ ' + L('答對了：', 'Correct: ') + fade;
    const lead = S.guess === 'same' ? L('不是喔，藍色沒有維持不變。', 'Not quite: the blue did not stay the same.')
      : L('不是喔，藍色沒有變深。', 'Not quite: the blue did not get deeper.');
    return '✗ ' + lead + L('這次猜錯了，看看右邊：Cu²⁺ 被用掉，藍色變淡；產生 H⁺，溶液變酸（pH 值下降）。按「重來」可以再預測一次。',
      ' This time the guess was off. Look at the right: Cu²⁺ gets used up, so the blue fades; H⁺ forms, so the solution turns acidic (pH falls). Press "Start over" to predict again.');
  }
  function resultHTML() {
    const oc = outcome(), d = derived();
    const small = s => `<br><small style="font-size:.85em;opacity:.85">${s}</small>`;
    const fastNote = S.notice === 'fastOn' ? small(L('快轉開啟：時間加快 6 倍，約 2.5 秒就到終點。', 'Fast-forward on: time runs 6 times faster, reaching the end in about 2.5 s.'))
      : S.notice === 'fastOff' ? small(L('快轉關閉：回到正常速度。', 'Fast-forward off: back to normal speed.')) : '';
    const gname = S.guess ? L(GNAME[S.guess][0], GNAME[S.guess][1]) : '';
    if (S.notice === 'needGuess' && !S.guess) return L('先預測，再通電：藍色會變淡、不變，還是變深？選一個再按「通電」。',
      'Predict first, then switch on: will the blue fade, stay the same or get deeper? Pick one, then press "Switch on".');
    if (!S.power) {
      if (oc === 'noGuess') {
        if (S.notice === 'off') return L('未通電，溶液不會改變。先預測，再通電。', 'No current, so the solution does not change. Predict first, then switch on.') + fastNote;
        return L('先預測：通電後，藍色會變淡、不變，還是變深？', 'Predict first: after switching on, will the blue fade, stay the same or get deeper?') + fastNote;
      }
      if (oc === 'ready') {
        if (S.notice === 'off') return L('未通電，溶液不會改變。', 'No current, so the solution does not change.') + fastNote;
        return L(`你預測「${gname}」。按「通電」看看藍色怎麼變。`, `Your prediction: "${gname}". Press "Switch on" and watch the blue.`) + fastNote;
      }
      return L('未通電，溶液不會改變。', 'No current, so the solution does not change.') +
        (d.judged !== null ? '<br>' + verdictHTML(d) : L('（目前的變化會保留，再按「通電」可以接著做。）', ' (What has happened so far is kept; press "Switch on" to continue.)')) + fastNote;
    }
    if (d.judged === null) return L('通電中：負極端析出紅色的銅，正極端冒出 O₂ 氣泡。看看溶液的藍色怎麼變！',
      'Current on: red copper forms on the (−) rod and O₂ bubbles rise at the (+) rod. Watch how the blue changes!') + fastNote;
    return verdictHTML(d) + (d.p >= 1 ? small(L('藍色已經很淡，但還看得到一點藍。', 'The blue is now pale, but a little blue is still visible.')) : '') + fastNote;
  }
  let lastRes = '';
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
    if (cv) {
      const ck = CAP[outcome()];
      const al = L('硫酸銅電解實驗台：', 'CuSO₄ electrolysis bench: ') + L(ck[0], ck[1]);
      if (cv.getAttribute('aria-label') !== al) cv.setAttribute('aria-label', al);
    }
  }

  // ───────── 按鈕 ─────────
  function spec() {
    return [
      [L('① 預測：藍色會…', '① Predict: the blue will…'), [['g:fade', L('變淡', 'Fade')], ['g:same', L('不變', 'Stay the same')], ['g:deeper', L('變深', 'Get deeper')]]],
      [L('② 動作', '② Action'), [['act:on', L('通電', 'Switch on')], ['act:off', L('斷電', 'Switch off')],
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
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b && !b.disabled) b.focus(); }
  }
  function pressed(key) {
    const [g, v] = key.split(':');
    if (g === 'g') return S.guess === v;
    if (v === 'on') return S.power;
    if (v === 'off') return !S.power;
    if (v === 'fast') return S.fast;
    return false;
  }
  function refreshUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act, on = pressed(k);
      b.classList.toggle('active', on);
      if (b.getAttribute('aria-pressed') !== (on ? 'true' : 'false')) b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (k.startsWith('g:')) { if (b.disabled !== S.locked) b.disabled = S.locked; }
      if (k === 'act:on') {                         // 沒預測：外觀 disabled，但仍可按（按了給提示）
        const dis = !S.guess;
        if ((b.getAttribute('aria-disabled') === 'true') !== dis) {
          if (dis) { b.setAttribute('aria-disabled', 'true'); b.style.opacity = '.45'; b.style.cursor = 'default'; }
          else { b.removeAttribute('aria-disabled'); b.style.opacity = ''; b.style.cursor = ''; }
        }
      }
    });
    writeResult();
  }
  function act(key) {
    const [g, v] = key.split(':');
    if (g === 'g') {
      if (S.locked || S.guess === v) { refreshUI(); return; }
      S.guess = v; S.notice = 'guess'; S.gT = 0;
    } else if (v === 'on') {
      if (!S.guess) { S.notice = 'needGuess'; S.hint = 0; }
      else if (!S.power) { S.power = true; S.locked = true; S.notice = null; }
    } else if (v === 'off') {
      S.power = false; S.notice = 'off';
    } else if (v === 'fast') {
      S.fast = !S.fast; S.notice = S.fast ? 'fastOn' : 'fastOff';
    } else if (v === 'reset') {
      if (cv && cv.width) {                         // 舊畫面淡出，不突變
        const img = document.createElement('canvas'); img.width = cv.width; img.height = cv.height;
        img.getContext('2d').drawImage(cv, 0, 0); XF = { img, t: 0 };
      }
      const keep = S.wall; initState(); S.wall = keep;
    }
    refreshUI(); render();
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  const R0 = { on: false, raf: 0, timer: 0, last: 0 };
  function step(dt) {
    S.wall += dt;
    if (S.power) S.tc += dt * (S.fast ? FAST : 1);
    const ap = (v, target, rate) => v + (target - v) * Math.min(1, dt * rate);
    S.flowA = ap(S.flowA, S.power ? 1 : 0, 6);
    S.needle = ap(S.needle, S.power ? 1 : 0, 5);
    S.swK = ap(S.swK, S.power ? 1 : 0, 9);
    S.fastA = ap(S.fastA, S.fast ? 1 : 0, 8);
    ['flowA', 'needle', 'swK', 'fastA'].forEach(n => { if (S[n] < 0.002) S[n] = 0; if (S[n] > 0.998) S[n] = 1; });
    if (S.gT < 1) S.gT = Math.min(1, S.gT + dt);
    if (S.hint < 9) S.hint = Math.min(9, S.hint + dt);
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
    cv = document.getElementById('cucLabCanvas');
    if (!cv || !cv.getContext) { cv = null; return; }
    ctx = cv.getContext('2d');
    ctrl = document.getElementById('cucLabControls');
    res = document.getElementById('cucLabResult');
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
      guess: S.guess, power: S.power, fast: S.fast, progress: +d.p.toFixed(4),
      blue: +d.blue.toFixed(4), cu: +d.cu.toFixed(4), ph: +d.ph.toFixed(4), judged: d.judged,
      locked: S.locked, tc: +S.tc.toFixed(3), outcome: outcome(), ions: ionCounts(d.p),
      needle: +S.needle.toFixed(3), flowA: +S.flowA.toFixed(3), fastA: +S.fastA.toFixed(3), running: !!R0.raf, on: R0.on
    };
  }

  window.ElLab.cuc = { activate, deactivate, relang, _state };
})();
