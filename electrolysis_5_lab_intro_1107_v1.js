/* electrolysis_5_lab_intro_1107_v1.js — 「🔬 動手做：自己接一套，看電流通不通」學生實驗台（#introLabCanvas，邏輯 1000×600）
 *
 * 契約：window.ElLab.intro = { activate(), deactivate(), relang(), _state() }
 * 頁面膠水：切到「純水為什麼不導電？」分頁呼叫 activate()、離開呼叫 deactivate()、切語言呼叫 relang()；activate 前呼叫其他三個也安全。
 * 只依賴頁面的 tr()；按鈕建在 #introLabControls（.lab-row／.lab-name／.lab-btn，頁面 CSS），一句結果寫進 #introLabResult。
 * 畫布不綁事件（只用按鈕）。畫風、版面與工具函式沿用同系列 electrolysis_5_lab_plating（燒杯、碳棒、銅片、電池、開關缺口、
 * 白底安培計），離子、NaOH → Na⁺／OH⁻、Cu 原子離開銅片的畫法沿用同課動畫 electrolysis_5_intro。
 *
 * ── 學生決定兩件事，再通電 ─────────────────────────────────
 *   ① 電極：碳棒／銅片（兩極用同一種）   ② 液體：純水／糖水／NaOH 溶液   ③ 動作：通電／斷電／重來
 *   初始：碳棒、純水、斷電（讓學生可以直接試錯）。
 *   接線固定：左電極＝負極端（接電池負極）、右電極＝正極端（接電池正極）。
 *   任何配置變更都回到初始狀態（離子位置、Cu 原子、累計時間全部重置）；變更時若正在通電，先自動斷電。
 *   糖水是額外加的第三種液體：糖分子（灰白小圓，標「糖分子」）溶在水裡不產生離子，用來讓學生試錯；絕不畫成離子膠囊。
 *
 * ── 模型（畫面量只由「通電累計時間 tc」與配置決定；斷電時 tc 不走＝凍結） ───────────────
 *   tc：通電時累加（任何液體），斷電凍結，改配置／重來歸零。
 *   電流 cur（0～1，示意，不標安培數）：通電時以一階平滑趨近終值（NaOH 1、純水 0.04、糖水 0），約 10 秒內到終值後穩定；
 *     斷電時平滑回 0（約 1 秒）。安培計指針＝cur；右欄「電流」量表＝cur（電流紅）。
 *   NaOH：Na⁺ 4、OH⁻ 4（示意）。Na⁺ 往負極端、OH⁻ 往正極端以 11 px/s 漂移（位置＝tc 的函式），到電極附近停住微動。
 *   純水：只有水分子＋極少量 H⁺、OH⁻ 各 1 顆（淡淡的），通電後只微微移動；通電時電子被推到負極端碳棒就停住。
 *   糖水：水分子＋糖分子，沒有離子；通電時電子同樣停在負極端。
 *   NaOH＋銅片：正極端銅片表面 2 顆 Cu 原子依 tc（2.5、5.5 s）離開並淡出、留下虛線空位；溶液與離子數量不變。
 *     （照 intro 動畫第 5 步的畫法，只當預告，不畫 Cu²⁺、不畫其他產物。）
 *   電子：只在導線與電極裡，電池負極 → 導線 → 左電極；右電極 → 導線（經安培計、開關）→ 電池正極；位置＝tc 的函式，
 *     透明度＝cur 的函式（純水／糖水看不到電子流）。指針、紅叉、開關、檢查記號都用 dt 平滑，不會突變。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 0–30 不放東西。y≈58 狀態一句（黃，置中於 x 480，寬 ≤ 780，避開右上角 90px）。
 *   外導線 y=118：左電極 x=155 → 電池（短粗＝負極 x=222、長細＝正極 x=238）→ 開關 x 296–336 → 安培計（中心 x=430）→ 右電極 x=510。
 *   燒杯 x 75–590、杯口 240、液面 272、杯底 474；y=256 液體名稱（未通電）／離子移動方向「← Na⁺」「OH⁻ →」（NaOH 通電後）。
 *   右欄 x 670–960：兩個即時檢查（✓ 綠／✗ 紅，圖示裡有符號）、電流量表、電極變化（只在 NaOH 時）。
 *   y≈506–536 本次一句重點（黃）；y≈574 圖例（避開右下角 90px）。
 */
(function () {
  'use strict';
  window.ElLab = window.ElLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', electron: '#4dd2ff', red: '#ff6b5a', current: '#ff4d4d',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    sugar: '#e4e6df', sugarLo: '#a9aea6',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
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
  const NS = NX + HW0, PS = PX - HW0;                                   // 面向溶液的表面 x
  const WY = 118, BN = 222, BP = 238, BATX = 230;
  const SW0 = 296, SW1 = 336;
  const MX = 430, MW = 110, MH = 64, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 32;
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 380 }]);
  const E_R = mkPath([{ x: PX, y: 330 }, { x: PX, y: WY }, { x: BP, y: WY }]);
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 670, RW = 290;
  // 水分子（示意）：純水用 8 顆；糖水、NaOH 用其中幾顆並調淡
  const WATER = [{ x: 215, y: 300 }, { x: 300, y: 296 }, { x: 430, y: 306 }, { x: 200, y: 446 }, { x: 305, y: 450 },
    { x: 425, y: 442 }, { x: 455, y: 372 }, { x: 205, y: 372 }];
  const WATER_NAOH = [{ x: 106, y: 322 }, { x: 108, y: 432 }, { x: 557, y: 330 }, { x: 555, y: 440 }, { x: 200, y: 448 }];
  const WATER_SUGAR = [{ x: 335, y: 300 }, { x: 455, y: 380 }, { x: 205, y: 372 }, { x: 310, y: 450 }];
  const SUGAR = [{ x: 225, y: 318 }, { x: 405, y: 296 }, { x: 460, y: 438 }, { x: 215, y: 438 }, { x: 395, y: 446 }];
  const SUGAR_R = 13;
  // 純水裡極少量的 H⁺／OH⁻（淡淡的，示意）
  const TRACE = [{ s: 'H⁺', kind: 0, x: 248, y: 330 }, { s: 'OH⁻', kind: 1, x: 405, y: 336 }];
  const TRACE_A = 0.45;
  // NaOH：4 對 Na⁺（上）／OH⁻（下），同 intro 動畫的排法
  const PAIRS = [{ x: 240, na: 304, oh: 350 }, { x: 300, na: 396, oh: 442 }, { x: 360, na: 304, oh: 350 }, { x: 420, na: 396, oh: 442 }];
  const V_ION = 11;
  // NaOH＋銅片：正極端銅片表面 2 顆 Cu 原子依序離開（同 intro 動畫第 5 步，排在 OH⁻ 兩列之間）
  const CU_ATOMS = [{ y: 304, t0: 2.5 }, { y: 396, t0: 5.5 }];
  const ATOM_R = 19;
  const CUR_END = { naoh: 1, water: 0.04, sugar: 0 };

  // ───────── 狀態 ─────────
  const S = {};
  function initState() {
    Object.assign(S, {
      electrode: 'c', liquid: 'water', power: false,
      tc: 0, notice: 'init', flash: null,
      cur: 0, powK: 0, xA: 0, swK: 0, wall: 0
    });
  }
  initState();
  const curTarget = () => (S.power ? CUR_END[S.liquid] : 0);
  const flowA = () => clamp((S.cur - 0.05) / 0.25, 0, 1);
  const ionCount = () => (S.liquid === 'naoh' ? 8 : S.liquid === 'water' ? 2 : 0);
  function outcome() {
    if (!S.power) return S.tc > 0 ? 'paused' : 'off';
    if (S.liquid === 'water') return 'water';
    if (S.liquid === 'sugar') return 'sugar';
    return S.electrode === 'cu' ? 'naohCu' : 'naohC';
  }
  function atomGo(A) { return ease((S.tc - A.t0) / 1.4); }
  function cuOut() {                                // 已離開的 Cu 原子數（連續）
    if (S.liquid !== 'naoh' || S.electrode !== 'cu') return 0;
    return CU_ATOMS.reduce((a, A) => a + atomGo(A), 0);   // 0～2
  }

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
  function liquid(ctx) {
    ctx.save(); innerClip(ctx, LIQ); ctx.fillStyle = 'rgba(205,228,232,0.10)'; ctx.fill();
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

  // ───────── 圖形：電極（同 plating 實驗台的銅片、碳棒） ─────────
  function cuFill(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, K.cuLo); g.addColorStop(0.3, K.cuHi); g.addColorStop(0.65, K.cu); g.addColorStop(1, K.cuLo);
    return g;
  }
  function plate(ctx, x) {
    ctx.save();
    ctx.fillStyle = cuFill(ctx, x - HW0, x + HW0); rrect(ctx, x - HW0, ETOP, EW, EBOT - ETOP, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
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
  function electrodes(ctx, immersed) {
    [NX, PX].forEach(x => {
      if (S.electrode === 'cu') {
        plate(ctx, x);
        if (immersed) { ctx.save(); ctx.fillStyle = 'rgba(205,228,232,0.12)'; rrect(ctx, x - HW0, LIQ + 2, EW, EBOT - LIQ - 2, 6); ctx.fill(); ctx.restore(); }
      } else {
        rod(ctx, x);
        if (immersed) { ctx.save(); ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, x - HW0, LIQ + 2, EW, EBOT - LIQ - 2, 8); ctx.fill(); ctx.restore(); }
      }
    });
  }

  // ───────── 圖形：分子、離子、原子、電子、元件 ─────────
  function waterMol(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e6eeec'; ctx.beginPath(); ctx.arc(x - 9, y + 7, 5, 0, TAU); ctx.arc(x + 9, y + 7, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b9c9c5'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function sugarMol(ctx, x, y, al) {                // 糖分子：灰白小圓（中性分子，不是離子膠囊、沒有電荷符號）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, SUGAR_R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, K.sugar); g.addColorStop(1, K.sugarLo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, SUGAR_R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  let HWP = {};
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {        // kind 0＝陽離子（橘）、1＝陰離子（紫）
    if (al <= 0.01) return;
    const hw = HWP[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function atom(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - 6, y - 7, 3, x, y, ATOM_R);
    g.addColorStop(0, K.cuHi); g.addColorStop(0.55, K.cu); g.addColorStop(1, K.cuLo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, ATOM_R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, 'Cu', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function hole(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.cuHi; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(x, y, ATOM_R - 2, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
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
  function switchSym(ctx, k) {                      // k＝0 打開（導線留缺口）、1 閉合
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
    const ang = lerp(-56, 30, k) * RAD - Math.PI / 2;             // 零點在左，偏轉到右
    ctx.strokeStyle = k > 0.05 ? '#c0392b' : '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'A', MX + 42, WY + 17, '#1f2a26', 22, 'center', 1, true);
  }
  function mark(ctx, kind, x, y, al) {              // 'ok' 綠勾、'no' 紅叉、'warn' 銅色驚嘆號（圓框裡有符號，不只靠顏色）
    if (al !== undefined && al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al === undefined ? 1 : al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const c = kind === 'ok' ? K.green : kind === 'no' ? K.red : K.cuHi;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (kind === 'ok') { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); ctx.stroke(); }
    else if (kind === 'no') { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); }
    else { ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 7, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function bigX(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.shadowColor = K.red; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y + 16); ctx.moveTo(x + 16, y - 16); ctx.lineTo(x - 16, y + 16); ctx.stroke();
    ctx.restore();
  }
  function flashBox(ctx, x, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    rrect(ctx, x - 40, ETOP - 12, 80, EBOT - ETOP + 22, 12); ctx.stroke(); ctx.restore();
  }

  // ───────── 依 tc 算出的運動（純函式） ─────────
  function ionHome(p, kind) { return { x: PAIRS[p].x, y: kind ? PAIRS[p].oh : PAIRS[p].na }; }
  function driftMax(p, kind) {
    const h = ionHome(p, kind);
    return kind ? Math.min(60, (PS - HWP['OH⁻'] - 6) - h.x) : Math.min(60, h.x - (NS + HWP['Na⁺'] + 6));
  }
  function ionsNaOH(ctx) {
    const tc = S.tc;
    PAIRS.forEach((P, p) => [0, 1].forEach(kind => {
      const h = ionHome(p, kind), dm = driftMax(p, kind), d = Math.min(dm, V_ION * tc);
      const arr = ease((d - (dm - 4)) / 4);          // 靠近電極後，晃動平滑變小
      const jx = lerp(3 * Math.sin(tc * 1.3 + p * 1.9 + kind * 2.4), 1.2 * Math.sin(tc * 3 + p + kind), arr);
      ionPill(ctx, h.x + (kind ? d : -d) + jx, h.y + 3 * Math.sin(tc * 1.7 + p + kind * 3), kind ? 'OH⁻' : 'Na⁺', kind, 1);
    }));
  }
  function traceIons(ctx) {                         // 純水：極少量 H⁺／OH⁻，通電後只微微移動
    const tc = S.tc, d = Math.min(14, 1.2 * tc);
    TRACE.forEach((o, k) => ionPill(ctx, o.x + (o.kind ? d : -d) + 2 * Math.sin(tc * 1.2 + k * 2), o.y + 2 * Math.sin(tc * 1.6 + k), o.s, o.kind, TRACE_A));
  }
  function cuAtoms(ctx) {                           // 正極端銅片表面的 Cu 原子：依 tc 離開、淡出，留下虛線空位
    if (S.liquid !== 'naoh' || S.electrode !== 'cu') return;
    const x0 = PS - 14;
    CU_ATOMS.forEach(A => {
      const go = atomGo(A);
      hole(ctx, x0, A.y, ease((S.tc - A.t0 - 0.3) / 0.6));
      atom(ctx, x0 - 40 * go, A.y - 10 * go, 1 - ease((S.tc - A.t0 - 0.6) / 0.8));
    });
  }
  const STUCK_N = 4;
  function stuckE(ctx) {                            // 純水、糖水通電：電子被電池推到負極端電極就停住
    const al = S.powK * (1 - flowA());
    if (al <= 0.01 || S.liquid === 'naoh') return;
    for (let k = 0; k < STUCK_N; k++) {
      const t0 = 0.3 + 0.4 * k, target = E_L.L - k * 36;
      if (S.tc <= t0) continue;
      const s = Math.min(target, 120 * (S.tc - t0)), p = at(E_L, s), done = s >= target;
      ball(ctx, p.x + (done ? 1.6 * Math.sin(S.tc * 6 + k * 1.7) : 0), p.y, 8, al * clamp((S.tc - t0) / 0.25, 0, 1));
    }
  }
  function flowE(ctx) {
    const al = flowA();
    if (al <= 0.01) return;
    const V = 110, sp = 52, d = V * S.tc;
    [E_L, E_R].forEach(P => {
      for (let k = -1; k * sp < P.L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > P.L) continue;
        const p = at(P, s), fade = clamp(Math.min(s, P.L - s) / 26, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * al);
      }
    });
  }

  // ───────── 裝置 ─────────
  function apparatus(ctx) {
    const tc = S.tc, lq = S.liquid;
    beakerBack(ctx);
    electrodes(ctx, false);
    liquid(ctx);
    ctx.save(); innerClip(ctx, LIQ + 1); ctx.clip(); electrodes(ctx, true); ctx.restore();
    cuAtoms(ctx);
    const wob = k => ({ x: 2.5 * Math.sin(tc * 1.1 + k * 1.3), y: 2 * Math.sin(tc * 1.5 + k * 2.1) });
    if (lq === 'water') {
      WATER.forEach((w, k) => { const o = wob(k); waterMol(ctx, w.x + o.x, w.y + o.y, 0.95); });
      traceIons(ctx);
    } else if (lq === 'sugar') {
      WATER_SUGAR.forEach((w, k) => { const o = wob(k); waterMol(ctx, w.x + o.x, w.y + o.y, 0.6); });
      SUGAR.forEach((m, k) => { const o = wob(k + 5); sugarMol(ctx, m.x + o.x, m.y + o.y, 1); });
      const m0 = SUGAR[0], o0 = wob(5);
      text(ctx, L('糖分子', 'Sugar'), m0.x + o0.x + SUGAR_R + 8, m0.y + o0.y, K.white, 22, 'left');
    } else {
      WATER_NAOH.forEach((w, k) => { const o = wob(k); waterMol(ctx, w.x + o.x, w.y + o.y, 0.5); });
      ionsNaOH(ctx);
    }
    beakerFront(ctx);
    if (S.flash) { const fa = S.flash.t < 0.9 ? 1 - ease((S.flash.t - 0.5) / 0.4) : 0; flashBox(ctx, NX, fa); flashBox(ctx, PX, fa); }
    // y=256：液體名稱（未通電）→ 離子移動方向（NaOH 通電後）
    const naoh = lq === 'naoh', nameA = naoh ? 1 - ease(tc / 0.4) : 1, arrA = naoh ? ease((tc - 0.5) / 0.5) : 0;
    const nm = { water: L('純水', 'Pure water'), sugar: L('糖水', 'Sugar water'), naoh: L('NaOH 溶液', 'NaOH solution') };
    text(ctx, nm[lq], MIDX, 256, K.white, 22, 'center', nameA);
    text(ctx, '← Na⁺', NS + 14, 256, K.pos, 22, 'left', arrA, true);
    text(ctx, 'OH⁻ →', PS - 14, 256, K.neg, 22, 'right', arrA, true);
    // 純水、糖水通電：溶液中央紅叉
    bigX(ctx, MIDX, 362, S.xA);
    text(ctx, lq === 'water' ? L('幾乎沒有離子', 'Almost no ions') : L('沒有離子', 'No ions'), MIDX, 404, K.red, 22, 'center', S.xA);
    // 電路：導線 → 夾子 → 電子 → 元件（元件畫在電子之後）
    WIRES.forEach(w => wireLine(ctx, w));
    clip(ctx, NX); clip(ctx, PX);
    flowE(ctx); stuckE(ctx);
    switchSym(ctx, S.swK);
    meter(ctx, S.cur);
    battery(ctx);
    text(ctx, L('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, L('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, L('安培計', 'Ammeter'), MX, WY + MH / 2 + 20, K.white, 22, 'center');
    text(ctx, L('負極端', '(−) side'), NX - 24, 182, K.electron, 24, 'right');
    text(ctx, L('正極端', '(+) side'), PX + HW0 + 14, 182, K.pos, 24, 'left');
    const en = S.electrode === 'cu' ? L('銅片', 'Copper') : L('碳棒', 'Carbon'), ec = S.electrode === 'cu' ? K.cuText : K.muted;
    text(ctx, en, NX + 24, 206, ec, 22, 'left');
    text(ctx, en, PX + HW0 + 14, 212, ec, 22, 'left');
  }

  // ───────── 右欄：兩個即時檢查＋電流量表＋電極變化 ─────────
  function ansRow(ctx, items, y) {                  // items：[{kind, s, a}]，同一位置依序淡出淡入；高度取最多行的那一個
    let yEnd = y;
    items.forEach(o => {
      mark(ctx, o.kind, RX + 14, y, o.a);
      const ls = wrap(ctx, o.s, RW - 38, 22);
      ls.forEach((l, k) => text(ctx, l, RX + 38, y + k * 28, o.kind === 'ok' ? K.green : K.white, 22, 'left', o.a));
      yEnd = Math.max(yEnd, y + ls.length * 28);
    });
    return yEnd;
  }
  function panel(ctx) {
    const lq = S.liquid;
    let y = block(ctx, L('即時檢查', 'Live check'), RX, 108, RW, K.white, 26, 'left', 1, 34) + 8;
    // ① 有沒有能自由移動的離子？（由液體決定）
    y = block(ctx, L('有沒有能自由移動的離子？', 'Any freely moving ions?'), RX, y, RW, K.cyan, 22, 'left', 1, 28) + 6;
    const a1 = lq === 'naoh' ? { kind: 'ok', s: L('有：Na⁺、OH⁻', 'Yes: Na⁺ and OH⁻') }
      : lq === 'water' ? { kind: 'no', s: L('幾乎沒有：\n只有極少量 H⁺、OH⁻', 'Almost none (a trace of H⁺, OH⁻)') }
        : { kind: 'no', s: L('沒有：糖分子不是離子', 'No: sugar molecules are not ions') };
    a1.a = 1;
    y = ansRow(ctx, [a1], y + 4) + 10;
    // ② 安培計有沒有讀數？（由即時電流決定，平滑換答案）
    y = block(ctx, L('安培計有沒有讀數？', 'Does the ammeter show a reading?'), RX, y, RW, K.cyan, 22, 'left', 1, 28) + 6;
    const hi = clamp((S.cur - 0.13) / 0.08, 0, 1), lo = 1 - clamp((S.cur - 0.05) / 0.08, 0, 1);
    const w = lq === 'water' ? S.powK : 0;
    y = ansRow(ctx, [
      { kind: 'no', s: L('沒有：指針停在 0', 'No: the needle stays at 0'), a: lo * clamp(1 - 2 * w, 0, 1) },
      { kind: 'no', s: L('幾乎沒有：指針幾乎不動', 'Almost none: the needle barely moves'), a: lo * clamp(2 * w - 1, 0, 1) },
      { kind: 'ok', s: L('有：指針偏轉', 'Yes: the needle swings'), a: hi }
    ], y + 4) + 14;
    // 電流量表（示意，不標數值；電流紅）
    const lab = L('電流', 'Current'), lw = textW(ctx, lab, 22), bx = RX + lw + 14, bw = RX + RW - bx;
    text(ctx, lab, RX, y, K.white, 22, 'left');
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.10)'; rrect(ctx, bx, y - 10, bw, 20, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    const v = clamp(S.cur, 0, 1);
    if (v > 0.004) { ctx.fillStyle = K.current; ctx.shadowColor = K.current; ctx.shadowBlur = 8; rrect(ctx, bx, y - 10, Math.max(bw * v, 6), 20, 10); ctx.fill(); }
    ctx.restore();
    y += 34;
    y = block(ctx, L('（示意，不是真實數值）', '(sketch, not a real value)'), RX, y, RW, K.muted, 22, 'left', 1, 28) + 12;
    // 電極變化（只在 NaOH 溶液、通電之後）
    if (lq === 'naoh') {
      if (S.electrode === 'cu') {
        const a = ease((S.tc - CU_ATOMS[0].t0) / 0.6);
        mark(ctx, 'warn', RX + 14, y, a);
        block(ctx, L('正極端銅片：\nCu 原子離開', '(+) copper plate: Cu atoms leave'), RX + 38, y, RW - 38, K.cuText, 22, 'left', a, 28);
      } else {
        const a = ease((S.tc - 1.0) / 0.6);
        mark(ctx, 'ok', RX + 14, y, a);
        block(ctx, L('碳棒本身不變', 'The carbon rods do not change'), RX + 38, y, RW - 38, K.white, 22, 'left', a, 28);
      }
    }
  }

  // ───────── 標題、重點、圖例 ─────────
  const CAP = {
    off: ['選好電極和液體，再按「通電」', 'Pick electrodes and a liquid, then press "Switch on"'],
    paused: ['已斷電：安培計回到 0', 'Switched off: the ammeter goes back to 0'],
    water: ['通電了，但安培計幾乎不動', 'Switched on, but the ammeter barely moves'],
    sugar: ['通電了，但安培計不動', 'Switched on, but the ammeter does not move'],
    naohC: ['電流通了！離子在溶液裡移動', 'Current flows! The ions move through the solution'],
    naohCu: ['電流通了！正極端的銅片也有變化', 'Current flows! The (+) copper plate changes too']
  };
  const BOT = {
    off: ['想一想：哪一種液體能讓電流通過？', 'Think: which liquid lets the current through?'],
    water: ['純水幾乎沒有離子，電流幾乎是 0', 'Pure water has almost no ions, so the current is almost 0'],
    sugar: ['糖分子不會變成離子，所以糖水也不導電', 'Sugar molecules do not become ions, so sugar water does not conduct either'],
    naohC: ['有能自由移動的離子，電流才通', 'Only with freely moving ions can the current flow'],
    naohCu: ['銅片是活性電極，自己也會參與反應（下一頁會看到）', 'Copper is an active electrode: it takes part in the reaction too (see the next tabs)']
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
      [L('紫＝陰離子', 'Purple = anion'), 'n'], [L('灰白圓＝糖分子', 'Gray-white = sugar'), 's']];
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((850 - sum) / Math.max(1, items.length - 1), 14, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = 470 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 's') { ctx.save(); ctx.fillStyle = K.sugar; ctx.strokeStyle = 'rgba(12,30,25,0.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 10, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }

  // ───────── 繪製 ─────────
  let cv = null, ctx = null, ctrl = null, res = null;
  function render() {
    if (!cv || !ctx || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    HWP = { 'Na⁺': pillHalf(ctx, 'Na⁺'), 'OH⁻': pillHalf(ctx, 'OH⁻'), 'H⁺': pillHalf(ctx, 'H⁺') };
    const oc = outcome();
    apparatus(ctx);
    panel(ctx);
    const ck = CAP[oc], bk = BOT[oc === 'paused' ? 'off' : oc];
    drawCaption(ctx, L(ck[0], ck[1]));
    bottomLines(ctx, L(bk[0], bk[1]));
    drawLegend(ctx);
  }

  // ───────── 結果框 ─────────
  function cfgName() {
    const e = S.electrode === 'cu' ? L('銅片', 'copper plates') : L('碳棒', 'carbon rods');
    const q = { water: L('純水', 'pure water'), sugar: L('糖水', 'sugar water'), naoh: L('NaOH 溶液', 'NaOH solution') }[S.liquid];
    return L(`${e}＋${q}`, `${e} + ${q}`);
  }
  function resultHTML() {
    const oc = outcome();
    switch (oc) {
      case 'off':
      case 'paused':
        if (S.notice === 'autooff') return L(`更換前已自動斷電，重新開始（${cfgName()}）。未通電，沒有電流。`,
          `The power was switched off automatically before the change, and everything restarted (${cfgName()}). No power, so no current.`);
        if (S.notice === 'changed') return L(`裝置改好了（${cfgName()}）。未通電，沒有電流；按「通電」看看電流通不通。`,
          `Setup changed (${cfgName()}). No power, so no current; press "Switch on" to see whether current flows.`);
        return L('未通電，沒有電流。', 'No power, so no current.');
      case 'water':
        return L('純水幾乎沒有離子，電流幾乎是 0。', 'Pure water has almost no ions, so the current is almost 0.');
      case 'sugar':
        return L('糖分子不會變成離子，所以糖水也不導電。', 'Sugar molecules do not become ions, so sugar water does not conduct either.');
      case 'naohC':
        return L('有能自由移動的離子，電流才通。Na⁺ 往負極端、OH⁻ 往正極端移動，安培計有讀數；碳棒本身不變。',
          'Current flows only when there are freely moving ions. Na⁺ moves toward the (−) side and OH⁻ toward the (+) side, and the ammeter shows a reading; the carbon rods themselves do not change.');
      default:
        return L('有能自由移動的離子，電流才通。Na⁺ 往負極端、OH⁻ 往正極端移動，安培計有讀數。銅片是活性電極，自己也會參與反應（下一頁會看到）。',
          'Current flows only when there are freely moving ions. Na⁺ moves toward the (−) side and OH⁻ toward the (+) side, and the ammeter shows a reading. Copper is an active electrode, so it takes part in the reaction too (you will see it in the next tabs).');
    }
  }
  let lastRes = '';
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
    if (cv) {
      const ck = CAP[outcome()];
      const al = L('導電實驗台：', 'Conductivity bench: ') + L(ck[0], ck[1]);
      if (cv.getAttribute('aria-label') !== al) cv.setAttribute('aria-label', al);
    }
  }

  // ───────── 按鈕 ─────────
  function spec() {
    return [
      [L('① 電極（兩極同一種）', '① Electrodes (both the same)'), [['el:c', L('碳棒', 'Carbon rods')], ['el:cu', L('銅片', 'Copper plates')]]],
      [L('② 液體', '② Liquid'), [['liquid:water', L('純水', 'Pure water')], ['liquid:sugar', L('糖水', 'Sugar water')], ['liquid:naoh', L('NaOH 溶液', 'NaOH solution')]]],
      [L('③ 動作', '③ Action'), [['act:on', L('通電', 'Switch on')], ['act:off', L('斷電', 'Switch off')], ['act:reset', L('重來', 'Start over')]]]
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
    if (g === 'el') return S.electrode === v;
    if (g === 'liquid') return S.liquid === v;
    if (v === 'on') return S.power;
    if (v === 'off') return !S.power;
    return false;
  }
  function refreshUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const on = pressed(b.dataset.act);
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    writeResult();
  }
  function act(key) {
    const [g, v] = key.split(':');
    if (g === 'el' || g === 'liquid') {
      const f = g === 'el' ? 'electrode' : 'liquid';
      if (S[f] === v) { refreshUI(); return; }
      const wasOn = S.power;
      S[f] = v; S.power = false; S.tc = 0;
      S.notice = wasOn ? 'autooff' : 'changed';
      S.flash = g === 'el' ? { t: 0 } : null;
    } else if (v === 'on') {
      S.power = true; S.notice = null;
    } else if (v === 'off') {
      S.power = false; S.notice = null;
    } else if (v === 'reset') {
      const keep = S.wall; initState(); S.wall = keep;
    }
    refreshUI(); render();
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  const R0 = { on: false, raf: 0, timer: 0, last: 0 };
  function step(dt) {
    S.wall += dt;
    if (S.power) S.tc += dt;
    const ap = (v, target, rate) => v + (target - v) * Math.min(1, dt * rate);
    const tg = curTarget();
    S.cur = ap(S.cur, tg, tg > S.cur ? 0.45 : 4);  // 上升：約 10 秒內到終值（10 s 時 99%）；斷電：約 1 秒回 0
    if (Math.abs(S.cur - tg) < 0.0005) S.cur = tg;
    S.powK = ap(S.powK, S.power ? 1 : 0, 6);
    S.xA = ap(S.xA, S.power && S.liquid !== 'naoh' ? 1 : 0, 6);
    S.swK = ap(S.swK, S.power ? 1 : 0, 9);
    ['powK', 'xA', 'swK'].forEach(n => { if (S[n] < 0.002) S[n] = 0; if (S[n] > 0.998) S[n] = 1; });
    if (S.flash) { S.flash.t += dt; if (S.flash.t > 1) S.flash = null; }
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
    cv = document.getElementById('introLabCanvas');
    if (!cv || !cv.getContext) { cv = null; return; }
    ctx = cv.getContext('2d');
    ctrl = document.getElementById('introLabControls');
    res = document.getElementById('introLabResult');
    R0.on = true; lastRes = '';
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
    lastRes = '';
  }
  function relang() {
    if (!R0.on || !cv) return;
    lastRes = ''; buildControls(); refreshUI(); render();
  }
  function _state() {
    return {
      electrode: S.electrode, liquid: S.liquid, power: S.power,
      current: +S.cur.toFixed(4), ions: ionCount(),
      tc: +S.tc.toFixed(3), outcome: outcome(), cuOut: +cuOut().toFixed(3), flowA: +flowA().toFixed(3),
      running: !!R0.raf, on: R0.on
    };
  }

  window.ElLab.intro = { activate, deactivate, relang, _state };
})();
