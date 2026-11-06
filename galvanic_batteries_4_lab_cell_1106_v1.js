/* galvanic_batteries_4_lab_cell_1106_v1.js — 「🔬 動手做：自己組一個鋅銅電池」實驗台（#cellLabCanvas，邏輯 1000×600）
 *
 * 契約：window.GbLab.cell = { activate(), deactivate(), relang(), _state() }
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰 GbAnim、ctl 或舊程式的全域）。
 * 控制鈕由本檔建立在 #cellLabControls（沒有就建在畫布外框後面），說明字寫進 #cellLabResult（只有文字改變時才寫）。
 * 畫風與同課教學動畫 galvanic_batteries_4_cell／origin 一致：同一套燒杯、液面亮線、金屬漸層電極、倒 U 鹽橋、
 * 白底電壓表（只有刻度線、沒有數字）、電子藍球（成對）、橘／紫離子膠囊、鹽橋內 ± 小圓、黃色虛線發亮提示。
 *
 * ── 實驗流程（每一步都要學生按按鈕或點畫面上發亮的零件才發生；只有目前能做的動作可以操作）──
 *   1 左半電池：放燒杯 → 倒入硫酸鋅溶液 → 放進鋅片
 *   2 右半電池：放燒杯 → 倒入硫酸銅溶液 → 放進銅片
 *   3 電壓表與導線：放上電壓表 → 兩條導線（先接哪條都可以）。兩杯不通：指針擺一下就回到 0（觀察約 2.5 秒後解鎖第 4 步）
 *   4 裝上鹽橋：鹽橋飛到兩杯上方、自己落下；兩端泡進溶液的那一刻起電流恢復、指針穩定偏轉
 *   5 觀察：電子 Zn → 導線 → 電壓表 → Cu；鹽橋 K⁺ 往右杯、NO₃⁻ 往左杯。「快轉觀察」3 秒把鋅片變細、銅片變粗演完並停住
 *   6 自己改條件：拿掉／裝回鹽橋、拔掉／接回一條導線、電極組合 鋅＋銅／鋅＋鋅／銅＋銅；「重新做一次」隨時可按
 *
 * ── 模型（只有「通／不通／斷」的質性區別，不寫任何數值）──
 *   drive ＝ 兩片電極不同金屬 ? 1 : 0；closed ＝ 電壓表＋兩條導線都接上＋沒有拔線＋兩片電極都在（換電極途中算斷）。
 *   電荷失衡 q（0～1）：電流 f ＝ closed·drive·(1 − q)。沒有鹽橋時 dq/dt ＝ KQ·f（兩杯電荷越來越不平衡 → 電流衰減到 0）；
 *   有鹽橋時 dq/dt ＝ −KB·q（離子經鹽橋補平 → 電流恢復並維持）。斷路時 q 不變。
 *   電壓表指針：阻尼彈簧追目標 f（ω＝9 rad/s、ζ＝0.5，零點有擋針）。拔線 → 目標立刻 0（彈簧約 0.5 s 回零）；
 *   拿掉鹽橋 → f 依 e^(−KQ·t) 慢慢降到 0；相同金屬 → f＝0，指針不動。
 *   電極磨耗 wear：有電流時鋅片（負極）浸在溶液的部分變細、銅片（正極）變粗；快轉 3 秒內補到 1 後停住，不循環。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 32–68 步驟清單 1～6（完成打勾、目前這步發亮）；y≈96 一句提示（黃）。
 *   外導線 y=160；電壓表中心 (500,160)、124×68（電子從表後面通過）；「電壓表」標在表右上 y=132。
 *   左杯 x 30–390（硫酸鋅、近無色；鋅片中心 x=76）、右杯 x 610–970（硫酸銅、深藍綠；銅片中心 x=924）；
 *   杯口 y=300、液面 y=340、杯底 y=478；桌面 y=480。電極 y 222–462；電極名稱 y≈190、磨耗標示 y≈262、溶液名稱 y≈318。
 *   鹽橋：倒 U，兩腳 x=350／650、外緣頂 y≈207、管口 y=452；名稱與離子方向寫在 U 內（y 290–398）。
 *   y 500–598 桌邊器材區（8 格：燒杯×2、硫酸鋅溶液、鋅片、硫酸銅溶液、銅片、電壓表、導線×2、鹽橋），用掉的器材就不在格子裡；
 *   兩條導線都接好後，左側換成圖例（y 528／566）。畫布最上方 0～30px 不放東西。
 */
(function () {
  'use strict';
  window.GbLab = window.GbLab || {};

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
  const SOL = { zn: 'rgba(205,228,232,0.10)', cu: 'rgba(28,128,140,0.46)' };
  const STREAM = { zn: 'rgba(205,228,232,0.55)', cu: 'rgba(40,160,172,0.85)' };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 幾何 ─────────
  const CHIP_Y = 50, CAP_Y = 96;
  const MX = 500, WY = 160, MW = 124, MH = 68, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 34;
  const BRIM = 300, BBOT = 478, LIQ = 340, TABLE_Y = 480;
  const CUPF = [{ x0: 30, x1: 390, top: BRIM, bot: BBOT }, { x0: 610, x1: 970, top: BRIM, bot: BBOT }];
  const EX = [76, 924], EW = 40, ETOP = 222, EBOT = 462, DWEAR = 16, EH = EBOT - ETOP;
  const ROWS = [374, 414], NEAR_ROW = 450, COLS = [[160, 255], [840, 745]];
  const BLX = 350, BRX = 650, BCY = 262, BBY = 452, TUBE_IN = 21, TUBE_OUT = 25, BTOP = BCY - 30 - TUBE_OUT;
  const HOVER = -170;                                            // 鹽橋落下前懸在上方的位移（管口仍在杯口上方）
  const LIFT = 34;                                               // 拔線時導線夾頭抬起的高度（真的留缺口）
  const SLOT = k => 70 + k * 123, TRAY_CY = 530, TRAY_LY = 578;  // 器材格
  const TRAY_BEAKER = [{ x0: 26, x1: 66, top: 512, bot: 550 }, { x0: 74, x1: 114, top: 512, bot: 550 }];
  const TRAY_BRIDGE = { x: SLOT(7), y: 507, s: 0.18 };
  const KQ = 7, KB = 2.5, V_F = 340, SP_F = 180, GAP = 26, V_B = 60, WEAR_RATE = 0.004;

  // ───────── 文字工具（先量再寫） ─────────
  let ctx = null;
  function textW(s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : Array.from(s), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = u; } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function text(s, x, y, color, size, align, alpha, m) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size, m); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function fitSize(s, maxW, z0, m) { for (let z = z0; z > 22; z--) if (textW(s, z, m) <= maxW) return z; return 22; }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
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
  function partial(pts, k) {
    const P = mkPath(pts), len = P.L * clamp(k, 0, 1), out = [pts[0]];
    if (len <= 0) return [];
    for (const q of P.seg) {
      if (len >= q.s0 + q.len) out.push(q.b);
      else { out.push(at(P, len)); break; }
    }
    return out;
  }
  function strokePts(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); }
  function lanePts(o) {
    const R = 30 + o, pts = [{ x: BLX - o, y: BBY }, { x: BLX - o, y: BCY }];
    for (let j = 1; j <= 8; j++) { const a = Math.PI + j / 8 * Math.PI / 2; pts.push({ x: BLX + 30 + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + j / 8 * Math.PI / 2; pts.push({ x: BRX - 30 + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    pts.push({ x: BRX + o, y: BBY });
    return pts;
  }
  const TUBE = lanePts(0), LANE_K = mkPath(lanePts(-10)), LANE_N = mkPath(lanePts(10));
  const EPATH = mkPath([{ x: EX[0], y: 400 }, { x: EX[0], y: WY }, { x: EX[1], y: WY }, { x: EX[1], y: 400 }]);
  const wirePts = (i, lift) => i === 0
    ? [{ x: MX - MW / 2, y: WY }, { x: EX[0], y: WY }, { x: EX[0], y: ETOP - 2 - lift }]
    : [{ x: MX + MW / 2, y: WY }, { x: EX[1], y: WY }, { x: EX[1], y: ETOP - 2 - lift }];

  // ───────── 狀態 ─────────
  const S = {};
  function resetState() {
    Object.assign(S, {
      stage: 1, cup: [false, false], sol: [null, null], el: [null, null], meter: false, wire: [false, false],
      bridge: false, pulled: false, used: {}, wear: [0, 0], xfer: [0, 0],
      q: 0, f: 0, nk: 0, nv: 0, eD: 0, ionD: 0, t: 0,
      tw: null, observing: false, obsT: 0, last: 'init', tried: { b: false, w: false, c: false }, actions: 0
    });
  }
  resetState();
  const R0 = { raf: 0, timer: 0, last: 0, on: false };
  let cv = null, ctrl = null, res = null, lastRes = '', ctrlSig = '', targetsNow = [];

  function twP() { return S.tw ? clamp((S.t - S.tw.t0) / S.tw.dur, 0, 1) : 1; }
  function twIs(k) { return !!(S.tw && S.tw.key === k); }
  const busy = () => !!S.tw || S.observing;
  const combo = () => (S.el[0] || '?') + (S.el[1] || '?');
  function isClosed() {
    return S.meter && S.wire[0] && S.wire[1] && !S.pulled && !!S.el[0] && !!S.el[1] && !twIs('swap');
  }

  // ───────── 圖形：燒杯、溶液、電極（與教學動畫同一畫法） ─────────
  function beakerPath(c) {
    const { x0, x1, top, bot } = c, r = Math.min(16, (bot - top) / 3), lip = Math.min(8, (x1 - x0) / 12);
    ctx.beginPath();
    ctx.moveTo(x0 - lip, top - lip * 0.75); ctx.quadraticCurveTo(x0, top - lip / 2, x0, top + lip);
    ctx.lineTo(x0, bot - r); ctx.quadraticCurveTo(x0, bot, x0 + r, bot);
    ctx.lineTo(x1 - r, bot); ctx.quadraticCurveTo(x1, bot, x1, bot - r);
    ctx.lineTo(x1, top + lip); ctx.quadraticCurveTo(x1, top - lip / 2, x1 + lip, top - lip * 0.75);
  }
  function innerClip(c, yTop) {
    const { x0, x1, bot } = c, r = Math.min(16, (bot - c.top) / 3);
    ctx.beginPath();
    ctx.moveTo(x0 + 2, yTop); ctx.lineTo(x0 + 2, bot - r); ctx.quadraticCurveTo(x0 + 2, bot - 2, x0 + r, bot - 2);
    ctx.lineTo(x1 - r, bot - 2); ctx.quadraticCurveTo(x1 - 2, bot - 2, x1 - 2, bot - r); ctx.lineTo(x1 - 2, yTop); ctx.closePath();
  }
  function beakerBack(c, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; innerClip(c, c.top); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore();
  }
  function beakerFront(c, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(c); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(c); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function liquid(c, level, color, al) {
    if (al <= 0.01 || level >= c.bot - 3) return;
    ctx.save(); ctx.globalAlpha *= al;
    innerClip(c, level); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function surface(c, level, al) {
    if (al <= 0.01 || level >= c.bot - 4) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, level); ctx.lineTo(c.x1 - 2, level); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, level + 4); ctx.lineTo(c.x1 - 2, level + 4); ctx.stroke();
    ctx.restore();
  }
  function metalGrad(kind, x0, w) {
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    return g;
  }
  // 電極：液面以上固定寬 EW，泡在溶液裡的部分寬 wSub（鋅變細、銅變粗）
  function electrode(x, kind, wSub, top, al, w0, h0) {
    if (al <= 0.01) return;
    const ew = w0 || EW, eh = h0 || EH, bot = top + eh, yl = clamp(h0 ? 1e9 : LIQ, top, bot);
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5;
    if (yl > top) { ctx.fillStyle = metalGrad(kind, x - ew / 2, ew); rrect(x - ew / 2, top, ew, yl - top + 1, Math.min(4, ew / 3)); ctx.fill(); ctx.stroke(); }
    if (bot > yl + 1) {
      ctx.fillStyle = metalGrad(kind, x - wSub / 2, wSub); rrect(x - wSub / 2, yl - 1, wSub, bot - yl + 1, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(16,58,72,0.42)'; rrect(x - wSub / 2, yl - 1, wSub, bot - yl + 1, 3); ctx.fill();
    }
    if (!h0) { ctx.fillStyle = '#3a4a44'; rrect(x - 7, top - 6, 14, 8, 2); ctx.fill(); }
    ctx.restore();
  }
  const subW = (kind, w) => EW + (kind === 'cu' ? DWEAR : -DWEAR) * w;

  // ───────── 圖形：離子、電子、導線、電壓表 ─────────
  function pillHalf(s) { return textW(s, 22, true) / 2 + 6; }
  function ionPill(x, y, s, kind, al) {
    if (al <= 0.01) return;
    const hw = pillHalf(s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 6;
    rrect(x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ionBadge(x, y, kind, al) {
    if (al <= 0.01) return;
    const c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); ctx.restore();
    text(kind ? '−' : '+', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ionDot(x, y, kind, al, r) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = kind ? K.neg : K.pos;
    ctx.beginPath(); ctx.arc(x, y, r || 5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function ball(x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function wireLine(pts, al) {
    if (pts.length < 2 || al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(pts); ctx.stroke(); });
    ctx.restore();
  }
  function wireEnd(x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(x - 7, y - 6, 14, 10, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function gapMark(x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function meter(k, al, showV) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#3a4a44';                                     // 兩側接線柱
    rrect(MX - MW / 2 - 8, WY - 7, 12, 14, 3); ctx.fill(); rrect(MX + MW / 2 - 4, WY - 7, 12, 14, 3); ctx.fill();
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -65 * RAD, a1 = 65 * RAD, R = 40;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-58, 30, k) * RAD - Math.PI / 2;             // 零點在左，偏轉到右
    ctx.strokeStyle = '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    if (showV) text('V', MX + 44, WY + 19, '#2b3a34', 22, 'center', al, true);
  }
  function mark(x, y, color, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5.5, y + 1); ctx.lineTo(x - 1, y + 5.5); ctx.lineTo(x + 6.5, y - 4.5); ctx.stroke(); ctx.restore();
  }
  function arrowH(x0, x1, y, color, al) {
    if (al <= 0.01) return;
    const d = Math.sign(x1 - x0);
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - d * 10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - d * 13, y - 8); ctx.lineTo(x1 - d * 13, y + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 試劑瓶（局部座標，原點在瓶身中心；瓶口在 (0,−48)）
  function bottle(x, y, s, rot, kind, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.lineJoin = 'round';
    rrect(-28, -24, 56, 60, 10); ctx.fillStyle = 'rgba(200,230,240,0.06)'; ctx.fill();
    ctx.save(); rrect(-28, -24, 56, 60, 10); ctx.clip(); ctx.fillStyle = kind === 'cu' ? 'rgba(28,128,140,0.75)' : 'rgba(205,228,232,0.22)';
    ctx.fillRect(-30, -8, 60, 46); ctx.strokeStyle = 'rgba(205,240,250,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(28, -8); ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(200,230,240,0.08)'; rrect(-10, -42, 20, 20, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 5; rrect(-28, -24, 56, 60, 10); ctx.stroke(); rrect(-10, -42, 20, 20, 3); ctx.stroke();
    ctx.strokeStyle = K.glass; ctx.lineWidth = 2.5; rrect(-28, -24, 56, 60, 10); ctx.stroke(); rrect(-10, -42, 20, 20, 3); ctx.stroke();
    ctx.restore();
  }
  function coil(x, y, al) {                                     // 器材格裡的一捲導線
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round';
    [[7, 'rgba(12,30,25,0.8)'], [4, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      for (let j = 0; j <= 60; j++) { const a = j / 60 * TAU * 2.2, px = x - 16 + j * 0.5 + 9 * Math.cos(a), py = y + 12 * Math.sin(a); if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
    });
    ctx.restore();
    wireEnd(x - 22, y + 15, al); wireEnd(x + 22, y - 13, al);
  }

  // ───────── 鹽橋 ─────────
  function bridgeAt(tf, full, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.translate(tf.x, tf.y); ctx.scale(tf.s, tf.s); ctx.translate(-500, -BTOP);
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = TUBE_OUT * 2 + 4; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.glass; ctx.lineWidth = TUBE_OUT * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.bg; ctx.lineWidth = TUBE_IN * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,238,242,0.13)'; ctx.lineWidth = TUBE_IN * 2; strokePts(TUBE); ctx.stroke();   // 飽和 KNO₃
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = 2; strokePts(lanePts(-TUBE_IN + 4)); ctx.stroke();
    // 管內離子：K⁺ 走內道往右口、NO₃⁻ 走外道往左口；靜止時只原地小幅擺動
    const n = 7, flow = full ? S.ionD : 0;
    for (let k = 0; k < n; k++) {
      [[LANE_K, 0, 1], [LANE_N, 1, -1]].forEach(([P, kind, dir]) => {
        const L = P.L, base = (k + (kind ? 0.5 : 0)) / n * L;
        const s = (((base + dir * flow + 3 * Math.sin(S.t * 2.1 + k * 1.7 + kind)) % L) + L) % L;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1);
        if (full) ionBadge(p.x, p.y, kind, fade);
        else ionDot(p.x, p.y, kind, fade, 7);
      });
    }
    ctx.restore();
  }
  function bridgeTf(dy) { return { x: 500, y: BTOP + dy, s: 1 }; }
  function ghostBridge(color, al, glow) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.lineJoin = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineDashOffset = -S.t * 24; }
    strokePts(lanePts(-TUBE_OUT + 2)); ctx.stroke(); strokePts(lanePts(TUBE_OUT - 2)); ctx.stroke();
    ctx.restore();
  }

  // 鹽橋現在在哪：dy＝相對定位的位移（null＝不在杯子上方）、fly＝飛行中的變換、bc＝管口泡進溶液的程度（0～1）
  function bridgeMotion() {
    const p = twP();
    let dy = null, fly = null;
    if (twIs('bridgeIn')) {
      if (p < 0.5) fly = flyTf(TRAY_BRIDGE, bridgeTf(HOVER), ease(p / 0.5));
      else { const u = clamp((p - 0.5) / 0.35, 0, 1); dy = HOVER * (1 - u * u); if (p > 0.85) dy = -6 * Math.sin(Math.PI * (p - 0.85) / 0.15); }
    } else if (twIs('bridgeOut')) {
      if (p < 0.6) dy = HOVER * ease(p / 0.6);                    // 慢慢拿起來：管口離開溶液前，通路一點一點變窄
      else fly = flyTf(bridgeTf(HOVER), TRAY_BRIDGE, ease((p - 0.6) / 0.4));
    } else if (S.bridge) dy = 0;
    const settled = dy === 0 && !twIs('bridgeIn') && !twIs('bridgeOut');
    const bc = dy === null ? 0 : clamp((BBY + dy - LIQ) / (BBY - LIQ), 0, 1);
    return { dy, fly, bc, settled };
  }

  // ───────── 每一側（左杯／右杯）的畫面資料 ─────────
  function sideView(i) {
    const tw = S.tw, p = twP(), v = { cup: S.cup[i] ? CUPF[i] : null, level: BBOT, sols: [], els: [], lift: 0 };
    const sk = i ? 'solR' : 'solL', ek = i ? 'elR' : 'elL';
    if (S.sol[i]) { v.level = LIQ; v.sols.push({ k: S.sol[i], a: 1 }); }
    if (tw && tw.key === sk) { v.level = lerp(BBOT, LIQ, ease((p - 0.42) / 0.43)); v.sols = [{ k: tw.data.kind, a: 1 }]; }
    if (S.el[i]) v.els.push({ k: S.el[i], dy: 0, a: 1, w: S.wear[i] });
    if (tw && tw.key === ek && p >= 0.55) v.els.push({ k: tw.data.kind, dy: -120 * (1 - ease((p - 0.55) / 0.45)), a: 1, w: 0 });
    if (tw && tw.key === 'swap' && tw.data.ch[i]) {
      const d = tw.data, m = ease((p - 0.3) / 0.4);
      v.sols = [{ k: d.from[i], a: 1 - m }, { k: d.to[i], a: m }];
      v.els = [{ k: d.from[i], dy: -22 * ease((p - 0.15) / 0.3), a: 1 - ease((p - 0.15) / 0.3), w: d.w0[i] },
        { k: d.to[i], dy: -22 * (1 - ease((p - 0.55) / 0.3)), a: ease((p - 0.55) / 0.3), w: 0 }];
      v.lift = LIFT * (p < 0.5 ? ease(p / 0.15) : 1 - ease((p - 0.85) / 0.15));
    }
    if (i === 1) {
      const pl = twIs('pull') ? ease(p) : twIs('plug') ? 1 - ease(p) : S.pulled ? 1 : 0;
      v.lift = Math.max(v.lift, LIFT * pl);
    }
    return v;
  }

  // ───────── 可以點的目標（同時決定哪裡發亮） ─────────
  function slotRect(k) { return [SLOT(k) - 54, 502, SLOT(k) + 54, 594]; }
  function computeTargets() {
    const out = [];
    if (busy()) return out;
    const add = (r, key, shape, faint) => out.push({ r, key, shape, faint: !!faint });
    const st = S.stage;
    const side = st === 1 ? 0 : 1;
    if (st === 1 || st === 2) {
      const ck = side ? 'cupR' : 'cupL', sk = side ? 'solR' : 'solL', ek = side ? 'elR' : 'elL', c = CUPF[side];
      if (!S.cup[side]) { add(slotRect(0), ck, 'slot'); add([c.x0 - 8, c.top - 10, c.x1 + 8, c.bot + 4], ck, 'cup' + side); }
      else if (!S.sol[side]) { add(slotRect(side ? 3 : 1), sk, 'slot'); add([c.x0, LIQ - 6, c.x1, c.bot], sk, 'liq' + side); }
      else { add(slotRect(side ? 4 : 2), ek, 'slot'); add([EX[side] - 28, ETOP - 14, EX[side] + 28, EBOT + 6], ek, 'el' + side); }
    } else if (st === 3) {
      if (!S.meter) { add(slotRect(5), 'meter', 'slot'); add([MX - MW / 2 - 14, WY - MH / 2 - 10, MX + MW / 2 + 14, WY + MH / 2 + 10], 'meter', 'meterDst'); }
      else {
        if (!S.wire[0] || !S.wire[1]) add(slotRect(6), 'wireNext', 'slot');
        if (!S.wire[0]) add([EX[0] - 26, ETOP - 30, EX[0] + 26, ETOP + 18], 'wireL', 'top0');
        if (!S.wire[1]) add([EX[1] - 26, ETOP - 30, EX[1] + 26, ETOP + 18], 'wireR', 'top1');
      }
    } else if (st === 4) {
      add(slotRect(7), 'bridge', 'slot'); add([BLX - 30, BTOP - 6, BRX + 30, BBY + 6], 'bridge', 'ghost');
    } else if (st === 5) {
      add([EX[0] - 30, ETOP - 14, EX[0] + 30, EBOT + 8], 'ff', 'el0'); add([EX[1] - 30, ETOP - 14, EX[1] + 30, EBOT + 8], 'ff', 'el1');
    } else if (st === 6) {
      if (S.bridge) add([BLX - 30, BTOP - 6, BRX + 30, BTOP + 60], 'tBridge', 'tubeTop', true);
      else { add(slotRect(7), 'tBridge', 'slot', true); add([BLX - 30, BTOP - 6, BRX + 30, BBY + 6], 'tBridge', 'ghost', true); }
      add([EX[1] - 26, ETOP - 2 - LIFT - 18, EX[1] + 26, ETOP + 14], 'tWire', 'top1', true);
    }
    return out;
  }
  function drawGlow(tg) {
    const pulse = tg.faint ? 0.32 + 0.12 * Math.sin(S.t * 3) : 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(S.t * 4.2));
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = K.yellow; ctx.shadowBlur = tg.faint ? 4 : 12; ctx.lineJoin = 'round';
    const [x0, y0, x1, y1] = tg.r, sh = tg.shape;
    if (sh === 'cup0' || sh === 'cup1') beakerPath(CUPF[+sh[3]]), ctx.stroke();
    else if (sh === 'liq0' || sh === 'liq1') { innerClip(CUPF[+sh[3]], LIQ); ctx.stroke(); }
    else if (sh === 'top0' || sh === 'top1') {
      const i = +sh[3], y = i === 1 && S.stage === 6 ? ETOP - 2 - sideView(1).lift : ETOP - 4;
      ctx.beginPath(); ctx.arc(EX[i], y, 19, 0, TAU); ctx.stroke();
      if (S.stage === 3) { ctx.globalAlpha = pulse * 0.45; ctx.lineWidth = 2; strokePts(wirePts(i, 0)); ctx.stroke(); }
    } else if (sh === 'ghost') { ctx.restore(); ghostBridge(K.yellow, pulse, true); return; }
    else if (sh === 'tubeTop') { ctx.beginPath(); ctx.moveTo(BLX - TUBE_OUT - 6, BCY + 20); ctx.lineTo(BLX - TUBE_OUT - 6, BCY);
      ctx.arc(BLX + 30, BCY, 30 + TUBE_OUT + 6, Math.PI, Math.PI * 1.5); ctx.lineTo(BRX - 30, BTOP - 6); ctx.arc(BRX - 30, BCY, 30 + TUBE_OUT + 6, -Math.PI / 2, 0); ctx.lineTo(BRX + TUBE_OUT + 6, BCY + 20); ctx.stroke(); }
    else { rrect(x0, y0, x1 - x0, y1 - y0, 12); ctx.stroke(); }
    ctx.restore();
  }

  // ───────── 步驟清單、提示、器材格、圖例 ─────────
  const STEP_L = [['左半電池', 'Left cell'], ['右半電池', 'Right cell'], ['接電壓表', 'Wire up'], ['裝鹽橋', 'Bridge'], ['觀察', 'Watch'], ['改條件', 'Explore']];
  function stepDone(n) { return n < S.stage || (n === 6 && S.tried.b && S.tried.w && S.tried.c); }
  function drawChecklist() {
    const z = 22, labels = STEP_L.map(s => T(s[0], s[1])), gap = 10;
    let ws = labels.map(l => 12 + 26 + 8 + textW(l, z) + 14), tot = ws.reduce((a, b) => a + b, 0) + gap * 5;
    let compact = false;
    if (tot > 960) { compact = true; ws = labels.map((l, k) => k + 1 === S.stage ? 12 + 26 + 8 + textW(l, z) + 14 : 52); tot = ws.reduce((a, b) => a + b, 0) + gap * 5; }
    let x = W / 2 - tot / 2;
    const glow = 0.5 + 0.5 * Math.sin(S.t * 4);
    labels.forEach((l, k) => {
      const n = k + 1, done = stepDone(n), cur = n === S.stage && !done, w = ws[k], y0 = CHIP_Y - 18;
      ctx.save();
      ctx.fillStyle = cur ? 'rgba(253,224,71,0.16)' : done ? 'rgba(74,222,128,0.10)' : 'rgba(18,51,41,0.7)';
      ctx.strokeStyle = cur ? K.yellow : done ? K.green : 'rgba(95,122,112,0.8)'; ctx.lineWidth = cur ? 3 : 2;
      if (cur) { ctx.shadowColor = K.yellow; ctx.shadowBlur = 6 + 10 * glow; }
      rrect(x, y0, w, 36, 18); ctx.fill(); ctx.stroke(); ctx.restore();
      const cx = x + 12 + 13;
      if (done) mark(cx, CHIP_Y, K.green, 1);
      else {
        ctx.save(); ctx.fillStyle = cur ? K.yellow : 'transparent'; ctx.strokeStyle = cur ? K.yellow : K.dim; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, CHIP_Y, 13, 0, TAU); if (cur) ctx.fill(); ctx.stroke(); ctx.restore();
        text(String(n), cx, CHIP_Y + 1, cur ? K.ink : K.muted, 22, 'center', 1, true);
      }
      if (!compact || n === S.stage) text(l, x + 12 + 26 + 8, CHIP_Y + 1, cur ? K.yellow : done ? K.green : K.muted, z, 'left');
      x += w + gap;
    });
  }
  function drawCaption(s, color) {
    const z = fitSize(s, 960, 24);
    const ls = wrap(s, 960, z);
    const bw = Math.max(...ls.map(l => textW(l, ls.length > 1 ? 22 : z))) + 28, bh = ls.length > 1 ? 56 : 34;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.82)'; rrect(W / 2 - bw / 2, CAP_Y - bh / 2, bw, bh, 10); ctx.fill(); ctx.restore();
    if (ls.length === 1) text(ls[0], W / 2, CAP_Y, color, z);
    else ls.slice(0, 2).forEach((l, k) => text(l, W / 2, CAP_Y - 12 + k * 26, color, 22));
  }
  const TRAY_L = [['燒杯', 'Beakers'], ['硫酸鋅溶液', 'ZnSO₄'], ['鋅片', 'Zn plate'], ['硫酸銅溶液', 'CuSO₄'], ['銅片', 'Cu plate'], ['電壓表', 'Voltmeter'], ['導線', 'Wires'], ['鹽橋', 'Bridge']];
  function trayHas(k) {
    const u = S.used;
    switch (k) {
      case 0: return (u.beakerA ? 0 : 1) + (u.beakerB ? 0 : 1);
      case 1: return u.znsol ? 0 : 1;
      case 2: return u.zn ? 0 : 1;
      case 3: return u.cusol ? 0 : 1;
      case 4: return u.cu ? 0 : 1;
      case 5: return u.meter ? 0 : 1;
      case 6: return (u.wire1 ? 0 : 1) + (u.wire2 ? 0 : 1);
      case 7: return !S.bridge && !twIs('bridgeIn') && !twIs('bridgeOut') ? 1 : 0;
    }
    return 0;
  }
  function drawTray() {
    ctx.save();
    const g = ctx.createLinearGradient(0, TABLE_Y, 0, TABLE_Y + 12);
    g.addColorStop(0, '#3b5a4f'); g.addColorStop(1, '#1b332c');
    ctx.fillStyle = g; rrect(10, TABLE_Y, 980, 12, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, TABLE_Y + 0.5); ctx.lineTo(986, TABLE_Y + 0.5); ctx.stroke();
    ctx.fillStyle = 'rgba(18,51,41,0.55)'; ctx.strokeStyle = 'rgba(159,179,170,0.22)'; ctx.lineWidth = 2;
    rrect(10, 498, 980, 100, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 8; k++) {
      const n = trayHas(k), x = SLOT(k);
      if (!n) continue;
      if (k === 0) { if (!S.used.beakerA) { beakerBack(TRAY_BEAKER[0], 1); beakerFront(TRAY_BEAKER[0], 1); } if (!S.used.beakerB) { beakerBack(TRAY_BEAKER[1], 1); beakerFront(TRAY_BEAKER[1], 1); } }
      if (k === 1 || k === 3) bottle(x, TRAY_CY + 4, 0.6, 0, k === 1 ? 'zn' : 'cu', 1);
      if (k === 2 || k === 4) electrode(x, k === 2 ? 'zn' : 'cu', 10, TRAY_CY - 26, 1, 10, 52);
      if (k === 5) { ctx.save(); ctx.translate(x, TRAY_CY); ctx.scale(0.55, 0.55); ctx.translate(-MX, -WY); meter(0, 1, false); ctx.restore(); }
      if (k === 6) { if (n >= 1) coil(x - (n > 1 ? 22 : 0), TRAY_CY, 1); if (n > 1) coil(x + 22, TRAY_CY, 1); }
      if (k === 7) bridgeAt(TRAY_BRIDGE, false, 1);
      text(T(TRAY_L[k][0], TRAY_L[k][1]), x, TRAY_LY, K.white, 22, 'center', 0.92);
    }
  }
  function drawLegend(al) {
    if (al <= 0.01) return;
    const items = [[T('藍球 e⁻＝電子（只走金屬與導線）', 'Blue ball e⁻ = electron (metal and wire only)'), 'b', 528],
      [T('橘＝正離子、紫＝負離子（只在溶液與鹽橋）', 'Orange / purple = + / − ion (solution and bridge only)'), 'i', 566]];
    items.forEach(([s, kind, y]) => {
      const x = 28;
      ctx.save(); ctx.globalAlpha = al;
      if (kind === 'b') ball(x + 14, y, 7, 1);
      else { ctx.fillStyle = K.pos; rrect(x, y - 7, 14, 14, 7); ctx.fill(); ctx.fillStyle = K.neg; rrect(x + 17, y - 7, 14, 14, 7); ctx.fill(); }
      ctx.restore();
      text(s, x + 42, y, K.white, 22, 'left', al);
    });
  }

  // ───────── 訊息（畫布提示＋說明框，同一個狀態） ─────────
  function msgKey() {
    const st = S.stage;
    if (st === 1 || st === 2) { const i = st - 1; return st + (!S.cup[i] ? 'a' : !S.sol[i] ? 'b' : 'c'); }
    if (st === 3) { if (!S.meter) return '3a'; if (S.observing) return '3obs'; return (S.wire[0] ? 1 : 0) + (S.wire[1] ? 1 : 0) ? '3c' : '3b'; }
    if (st === 4) return '4';
    if (st === 5) return twIs('ff') ? '5ff' : '5';
    if (twIs('swap')) return '6swap';
    if (S.pulled || twIs('plug')) return '6pull';
    if (S.el[0] === S.el[1]) return S.el[0] === 'zn' ? '6zz' : '6cc';
    if (!S.bridge || twIs('bridgeIn')) return S.f > 0.03 ? '6nob' : '6nob0';
    return { init: '6done', bridge: '6bridge', wire: '6wire', combo: '6zncu' }[S.last] || '6ok';
  }
  const Y = s => `<span class="accent-yellow">${s}</span>`, Cn = s => `<span class="accent-cyan">${s}</span>`;
  const MSG = {
    '1a': [['步驟 1：點亮著的燒杯，把它放到桌上', 'Step 1: tap the glowing beaker to put it on the table'],
      [`先做${Y('左半電池')}：點亮著的燒杯（或按「放燒杯」），它會自己放到桌子左邊。`, `First, the ${Y('left half-cell')}: tap the glowing beaker (or press “Place beaker”) and it moves to the left side of the table.`]],
    '1b': [['倒入硫酸鋅溶液（幾乎無色）', 'Pour in zinc sulfate solution (almost colorless)'],
      [`燒杯放好了！接著點亮著的${Y('硫酸鋅溶液')}，倒進燒杯。它幾乎是無色的喔。`, `Beaker ready! Now tap the glowing ${Y('zinc sulfate solution')} to pour it in. It is almost colorless.`]],
    '1c': [['放進鋅片：一種金屬泡在它自己的鹽類溶液', 'Add the zinc plate: a metal in a solution of its own salt'],
      [`把${Y('鋅片')}放進硫酸鋅溶液。一個杯子裡一種金屬泡在它自己的鹽類溶液，就是一個${Y('半電池')}。`, `Put the ${Y('zinc plate')} into the zinc sulfate solution. One metal in a solution of its own salt, in one cup, is a ${Y('half-cell')}.`]],
    '2a': [['步驟 2：再拿一個燒杯，做右半電池', 'Step 2: take the other beaker for the right half-cell'],
      [`左半電池完成 ✓ 接著做${Y('右半電池')}：點亮著的燒杯，放到桌子右邊。`, `Left half-cell done ✓ Now the ${Y('right half-cell')}: tap the glowing beaker to put it on the right.`]],
    '2b': [['倒入硫酸銅溶液（藍綠色）', 'Pour in copper sulfate solution (blue-green)'],
      [`倒入${Y('硫酸銅溶液')}，看，它是藍綠色的。`, `Pour in the ${Y('copper sulfate solution')} — see, it is blue-green.`]],
    '2c': [['放進銅片：右半電池就完成了', 'Add the copper plate to finish the right half-cell'],
      [`把${Y('銅片')}放進硫酸銅溶液，右半電池就完成了。`, `Put the ${Y('copper plate')} into the copper sulfate solution to finish the right half-cell.`]],
    '3a': [['步驟 3：把電壓表放到兩杯中間上方', 'Step 3: put the voltmeter above, between the cups'],
      [`兩個半電池都好了！點亮著的${Y('電壓表')}，放到兩杯中間的上方。`, `Both half-cells are ready! Tap the glowing ${Y('voltmeter')} to put it above, between the cups.`]],
    '3b': [['用導線接鋅片、銅片（先接哪條都可以）', 'Wire the Zn and Cu plates to the meter (either one first)'],
      [`用${Y('導線')}把鋅片、銅片接到電壓表。先接哪一條都可以，點亮著的地方就好。`, `Use the ${Y('wires')} to join the zinc and copper plates to the voltmeter. Either one first — tap a glowing spot.`]],
    '3c': [['再接另一條導線', 'Now connect the other wire'],
      [`接好一條了，再接${Y('另一條導線')}。注意看電壓表的指針！`, `One wire done. Connect the ${Y('other wire')} — and watch the needle!`]],
    '3obs': [['兩杯之間沒有通路，電子走一下就停了', 'No path between the cups: the e⁻ move a little, then stop'],
      [`指針${Y('輕輕擺一下就回到 0')}！兩杯之間沒有通路，兩杯電荷失去平衡，反應很快就停了——電子走一下就停了。`, `The needle ${Y('swings a little, then goes back to 0')}! There is no path between the cups, so they lose charge balance and the reaction soon stops — the e⁻ move a little, then stop.`]],
    '4': [['步驟 4：裝上鹽橋，把兩杯連起來', 'Step 4: add the salt bridge to join the cups'],
      [`兩杯之間需要一條讓離子走的路。點亮著的${Y('鹽橋')}，讓它落進兩杯溶液裡。`, `The cups need a path for ions. Tap the glowing ${Y('salt bridge')} and let it drop into both solutions.`]],
    '5': [['指針穩定偏轉！電子從鋅經導線走到銅', 'A steady swing! e⁻ go from Zn through the wire to Cu'],
      [`裝上鹽橋，指針${Y('偏轉而且一直維持')}！電子從鋅片（負極）經導線、電壓表走到銅片（正極）；鹽橋裡 K⁺ 往右杯、NO₃⁻ 往左杯，讓兩杯維持電中性。按「快轉觀察」，看兩片金屬會怎樣。`,
        `With the salt bridge, the needle ${Y('swings and stays there')}! Electrons go from the zinc plate (negative) through the wire and voltmeter to the copper plate (positive); in the bridge, K⁺ move to the right cup and NO₃⁻ to the left, keeping both cups neutral. Press “Fast-forward” to see what happens to the two metals.`]],
    '5ff': [['快轉中：鋅片變細、銅片變粗', 'Fast-forward: Zn gets thinner, Cu gets thicker'],
      [`快轉中……盯著兩片金屬泡在溶液裡的部分！`, `Fast-forwarding… watch the parts of the plates in the solutions!`]],
    '6done': [['實驗完成！換你改條件，看電壓表怎麼變', 'Done! Now change things and watch the voltmeter'],
      [`看到了嗎？${Y('負極鋅變輕')}（變細）、${Y('正極銅變重')}（變粗）。實驗完成！現在自己改條件：拿掉鹽橋、拔掉導線、換電極，看電壓表怎麼變。`,
        `See? The ${Y('negative zinc gets lighter')} (thinner) and the ${Y('positive copper gets heavier')} (thicker). Experiment done! Now change things yourself — remove the bridge, unplug a wire, swap electrodes — and watch the voltmeter.`]],
    '6pull': [['拔掉導線：迴路斷開，指針立刻回到 0', 'Wire unplugged: the loop is broken, the needle drops to 0'],
      [`一拔掉導線，迴路就斷開，電子沒有路走，指針${Y('立刻')}回到 0。按「接回導線」試試。`, `Unplug a wire and the loop is broken — the electrons have no path, so the needle drops to 0 ${Y('at once')}. Press “Reconnect wire” to try again.`]],
    '6zz': [['兩片鋅：相同金屬，指針不動', 'Two zinc plates: same metal, the needle stays still'],
      [`兩杯都是${Y('鋅片＋硫酸鋅溶液')}：兩片相同金屬沒有足夠差異，無法維持持續電流，指針不動。`, `Both cups are ${Y('zinc in zinc sulfate')}: two identical metals are not different enough to keep a steady current, so the needle stays still.`]],
    '6cc': [['兩片銅：相同金屬，指針不動', 'Two copper plates: same metal, the needle stays still'],
      [`兩杯都是${Y('銅片＋硫酸銅溶液')}：兩片相同金屬沒有足夠差異，無法維持持續電流，指針不動。`, `Both cups are ${Y('copper in copper sulfate')}: two identical metals are not different enough to keep a steady current, so the needle stays still.`]],
    '6nob': [['拿掉鹽橋：指針慢慢回到 0', 'Bridge removed: the needle slowly returns to 0'],
      [`鹽橋拿掉了：兩杯之間沒有通路，電荷慢慢失去平衡，指針${Y('慢慢')}回到 0。`, `The bridge is out: there is no path between the cups, the charges slowly lose balance, and the needle ${Y('slowly')} returns to 0.`]],
    '6nob0': [['沒有鹽橋：兩杯不通，指針停在 0', 'No salt bridge: the cups are not joined, needle at 0'],
      [`沒有鹽橋，兩杯不通，指針停在 0。按「裝回鹽橋」試試。`, `Without the salt bridge the cups are not joined, so the needle stays at 0. Press “Put bridge back” to try.`]],
    '6bridge': [['裝回鹽橋：指針又偏轉了', 'Bridge back: the needle swings again'],
      [`鹽橋裝回去，離子又有路走，兩杯維持電中性，指針${Y('又偏轉')}了。`, `With the bridge back, the ions have a path again, both cups stay neutral, and the needle ${Y('swings again')}.`]],
    '6wire': [['接回導線：電子又能流動，指針偏轉', 'Wire reconnected: e⁻ flow again, the needle swings'],
      [`導線接回去，迴路又閉合了，電子又從鋅經導線走到銅，指針偏轉。`, `With the wire back, the loop is closed again: electrons go from zinc through the wire to copper, and the needle swings.`]],
    '6zncu': [['換回鋅＋銅：指針偏轉', 'Back to Zn + Cu: the needle swings'],
      [`換回${Y('鋅＋銅')}：兩片不同的金屬，導線和鹽橋都接好，指針偏轉。`, `Back to ${Y('Zn + Cu')}: two different metals, wire and bridge connected — the needle swings.`]],
    '6ok': [['電路接通：指針偏轉', 'Circuit complete: the needle swings'],
      [`鋅＋銅、導線接好、鹽橋裝上：兩條路都通，指針偏轉。`, `Zn + Cu, wires on, bridge in: both paths are open, so the needle swings.`]],
    '6swap': [['換電極中…', 'Swapping electrodes…'], [`換電極中……換好之後看看指針。`, `Swapping electrodes… then watch the needle.`]]
  };
  function caption() { const m = MSG[msgKey()]; return T(m[0][0], m[0][1]); }
  function captionColor() { const k = msgKey(); return /^(3obs|6pull|6zz|6cc|6nob|6nob0)$/.test(k) ? K.cyan : K.yellow; }
  function resultHTML() {
    const m = MSG[msgKey()];
    let h = T(m[1][0], m[1][1]);
    if (S.stage === 6) {
      const c = combo(), cs = c === 'zncu' ? T('鋅＋銅', 'Zn + Cu') : c === 'znzn' ? T('鋅＋鋅', 'Zn + Zn') : T('銅＋銅', 'Cu + Cu');
      h += `<br>${Cn(T(`目前：${cs}｜鹽橋${S.bridge ? '裝上' : '拿掉'}｜導線${S.pulled ? '拔掉一條' : '都接上'}`,
        `Now: ${cs} | bridge ${S.bridge ? 'in' : 'out'} | wires ${S.pulled ? 'one unplugged' : 'both on'}`))}`;
    }
    return h;
  }
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx || !cv || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    const tw = S.tw, p = twP();
    const V = [sideView(0), sideView(1)];
    drawTray();
    // 背景層：燒杯、電極、溶液
    V.forEach(v => { if (v.cup) beakerBack(v.cup, 1); });
    V.forEach((v, i) => v.els.forEach(e => electrode(EX[i], e.k, subW(e.k, e.w), ETOP + e.dy, e.a)));
    V.forEach(v => { if (!v.cup) return; v.sols.forEach(s => liquid(v.cup, v.level, SOL[s.k], s.a)); if (v.sols.length) surface(v.cup, v.level, 1); });
    // 鹽橋（預留虛線／實體）
    const showGhost = (S.stage === 3 && S.observing) || (S.stage === 6 && !S.bridge && !twIs('bridgeIn'));
    if (showGhost) ghostBridge(S.stage === 3 ? K.red : K.muted, 0.85, false);
    const BM = bridgeMotion(), bridgeTop = BM.fly;                // 飛行中的鹽橋畫在最上層
    if (BM.dy !== null) bridgeAt(bridgeTf(BM.dy), BM.settled, 1);   // 移動中只畫小圓點（不寫 ±，避免壓到上方文字）
    // 杯內離子
    V.forEach((v, i) => {
      if (!v.cup || !v.sols.length) return;
      const C = COLS[i];
      const swapping = v.sols.length > 1;
      v.sols.forEach((s, si) => {
        const sa = swapping ? (si ? clamp(2 * s.a - 1, 0, 1) : clamp(2 * s.a - 1, 0, 1)) : s.a;
        const cat = s.k === 'cu' ? 'Cu²⁺' : 'Zn²⁺';
        [[C[0], ROWS[0], cat, 0], [C[1], ROWS[0], 'SO₄²⁻', 1], [C[0], ROWS[1], 'SO₄²⁻', 1], [C[1], ROWS[1], cat, 0]].forEach(([x, y, lab, kind], n) => {
          const vis = clamp((y - 18 - v.level) / 20, 0, 1);
          const j = n + i * 7;
          ionPill(x + 2 * Math.sin(S.t * 1.7 + j * 1.31), y + 2 * Math.sin(S.t * 2.3 + j * 2.07), lab, kind, vis * sa);
        });
      });
      const xa = S.xfer[i];
      if (xa > 0.01) ionPill(C[1] + 2 * Math.sin(S.t * 1.9 + i), NEAR_ROW + 2 * Math.sin(S.t * 2.2 + i), i ? 'K⁺' : 'NO₃⁻', i ? 0 : 1, xa);
    });
    V.forEach(v => { if (v.cup) beakerFront(v.cup, 1); });
    // 外導線、電子、電壓表
    [0, 1].forEach(i => {
      const grow = twIs(i ? 'wireR' : 'wireL') ? ease(p) : S.wire[i] ? 1 : 0;
      if (grow <= 0) return;
      const pts = partial(wirePts(i, V[i].lift), grow);
      wireLine(pts, 1);
      const e = pts[pts.length - 1];
      wireEnd(e.x, e.y, 1);
      if (V[i].lift > 14 && S.wire[i]) gapMark(EX[i], (e.y + ETOP - 6) / 2, clamp((V[i].lift - 14) / 12, 0, 1));
    });
    drawElectrons();
    if (S.meter) meter(S.nk, 1, true);
    // 標註
    V.forEach((v, i) => {
      const e = v.els.length ? v.els[v.els.length - 1] : null;
      if (e && (S.el[i] || twIs('swap'))) {
        const pole = S.el[0] && S.el[1] && S.el[0] !== S.el[1] && !twIs('swap');
        const kk = twIs('swap') && S.tw.data.ch[i] ? S.tw.data.to[i] : S.el[i];
        const lab = kk === 'cu' ? (pole ? T('正極 Cu', 'Cu (positive)') : T('銅片 Cu', 'Cu plate')) : (pole ? T('負極 Zn', 'Zn (negative)') : T('鋅片 Zn', 'Zn plate'));
        text(lab, i ? EX[1] - 30 : EX[0] + 30, 190, kk === 'cu' ? K.cuHi : K.znHi, 24, i ? 'right' : 'left');
      }
      if (v.cup && v.sols.length && v.level < BBOT - 100) {
        const s = v.sols[v.sols.length - 1].k, cx = (v.cup.x0 + v.cup.x1) / 2 - (i ? -20 : 20);
        text(s === 'cu' ? T('硫酸銅溶液', 'CuSO₄ solution') : T('硫酸鋅溶液', 'ZnSO₄ solution'), cx, 318, s === 'cu' ? K.cyan : K.muted, 22, 'center', clamp((BBOT - v.level - 100) / 38, 0, 1));
      }
      const w = S.wear[i];
      if (S.el[i] && w > 0.15 && !twIs('swap')) {
        const s = S.el[i] === 'cu' ? T('變粗（變重）', 'thicker, heavier') : T('變細（變輕）', 'thinner, lighter');
        text(s, i ? EX[1] - 30 : EX[0] + 30, 262, K.white, 22, i ? 'right' : 'left', clamp((w - 0.15) / 0.3, 0, 1));
      }
    });
    if (S.meter) text(T('電壓表', 'Voltmeter'), MX + MW / 2 + 14, 132, K.white, 22, 'left');
    if (BM.settled) {
      text(T('鹽橋', 'Salt bridge'), MX, 290, K.white, 22);
      text(T('飽和 KNO₃', 'sat. KNO₃'), MX, 322, K.white, 22);
      const ar = clamp(S.f * 3, 0, 1);
      arrowH(470, 394, 362, K.neg, ar); text('NO₃⁻', 482, 362, K.neg, 22, 'left', ar, true);
      text('K⁺', 518, 398, K.pos, 22, 'right', ar, true); arrowH(530, 606, 398, K.pos, ar);
    } else if (showGhost) text(T('沒有鹽橋', 'No bridge'), MX, 300, S.stage === 3 ? K.red : K.muted, 24);
    // 最上層：正在移動的器材
    if (tw) drawFlying(tw, p);
    if (bridgeTop) bridgeAt(bridgeTop, false, 1);
    targetsNow = computeTargets();
    targetsNow.forEach(drawGlow);
    drawLegend(S.wire[0] && S.wire[1] ? 1 : twIs('wireL') || twIs('wireR') ? (S.wire[0] || S.wire[1] ? ease(p) : 0) : 0);
    drawChecklist();                                               // 清單與提示畫在最上面：器材飛過時字仍看得清楚
    drawCaption(caption(), captionColor());
  }
  function flyTf(a, b, k) {                                      // 器材「自己飛過去」：中間抬高一點
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - 60 * Math.sin(Math.PI * k), s: lerp(a.s, b.s, k) };
  }
  function drawElectrons() {
    const al = clamp(S.f / 0.12, 0, 1);
    if (al <= 0.01) return;
    const L = EPATH.L, d = S.eD;
    for (let k = -1; k * SP_F < L + SP_F; k++) {
      const s0 = k * SP_F + (d % SP_F);
      [0, -GAP].forEach(off => {
        const s = s0 + off;
        if (s < 0 || s > L) return;
        const p = at(EPATH, s), fade = clamp(Math.min(s, L - s) / 22, 0, 1);
        ball(p.x, p.y, 8, fade * al);
      });
    }
  }
  function drawFlying(tw, p) {
    const k = tw.key;
    if (k === 'cupL' || k === 'cupR') {
      const i = k === 'cupR' ? 1 : 0, a = TRAY_BEAKER[i], b = CUPF[i], u = ease(p), lift = 70 * Math.sin(Math.PI * u);
      const c = { x0: lerp(a.x0, b.x0, u), x1: lerp(a.x1, b.x1, u), top: lerp(a.top, b.top, u) - lift, bot: lerp(a.bot, b.bot, u) - lift };
      beakerBack(c, 1); beakerFront(c, 1);
    } else if (k === 'solL' || k === 'solR') {
      const i = k === 'solR' ? 1 : 0, cx = (CUPF[i].x0 + CUPF[i].x1) / 2 + (i ? 20 : -20), home = { x: SLOT(i ? 3 : 1), y: TRAY_CY + 4, s: 0.6 };
      const dst = { x: cx, y: 215, s: 1 }, sg = i ? -1 : 1;
      let pos, rot = 0, al = 1;
      if (p < 0.3) pos = flyTf(home, dst, ease(p / 0.3));
      else { pos = dst; rot = sg * 120 * RAD * (p < 0.85 ? ease((p - 0.3) / 0.12) : 1 - ease((p - 0.85) / 0.15)); al = p < 0.85 ? 1 : 1 - ease((p - 0.88) / 0.12); }
      if (p > 0.42 && p < 0.86) {                                 // 液柱：從瓶口落到液面
        const mx = pos.x + 48 * Math.sin(rot), my = pos.y - 48 * Math.cos(rot), lvl = sideView(i).level;
        ctx.save(); ctx.fillStyle = STREAM[tw.data.kind]; ctx.globalAlpha = Math.min(ease((p - 0.42) / 0.05), 1 - ease((p - 0.8) / 0.06));
        rrect(mx - 4, my, 8, Math.max(0, lvl - my), 4); ctx.fill(); ctx.restore();
      }
      bottle(pos.x, pos.y, pos.s, rot, tw.data.kind, al);
    } else if ((k === 'elL' || k === 'elR') && p < 0.55) {
      const i = k === 'elR' ? 1 : 0, u = ease(p / 0.55), lift = 50 * Math.sin(Math.PI * u);
      const x = lerp(SLOT(i ? 4 : 2), EX[i], u), top = lerp(TRAY_CY - 26, ETOP - 120, u) - lift;
      electrode(x, tw.data.kind, lerp(10, EW, u), top, 1, lerp(10, EW, u), lerp(52, EH, u));
    } else if (k === 'meter') {
      const tf = flyTf({ x: SLOT(5), y: TRAY_CY, s: 0.55 }, { x: MX, y: WY, s: 1 }, ease(p));
      ctx.save(); ctx.translate(tf.x, tf.y); ctx.scale(tf.s, tf.s); ctx.translate(-MX, -WY); meter(0, 1, false); ctx.restore();
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt;
    const tw = S.tw;
    if (tw) {
      const p = twP();
      if (tw.key === 'swap' && p >= 0.5 && !tw.data.mid) {
        tw.data.mid = true;
        [0, 1].forEach(i => { if (tw.data.ch[i]) { S.el[i] = tw.data.to[i]; S.sol[i] = tw.data.to[i]; S.wear[i] = 0; S.xfer[i] = 0; } });
        S.q = 0;
      }
      if (tw.key === 'ff') { const u = ease(p); [0, 1].forEach(i => { S.wear[i] = lerp(tw.data.w0[i], 1, u); }); }
      if (S.t - tw.t0 >= tw.dur) { S.tw = null; if (tw.done) tw.done(); refreshUI(); }
    }
    // 電路
    const closed = isClosed(), drive = S.el[0] && S.el[1] && S.el[0] !== S.el[1] ? 1 : 0;
    const bc = bridgeMotion().bc;                                 // 鹽橋泡進溶液的程度：拿起來時通路慢慢變窄
    const f = closed && drive ? clamp(1 - S.q, 0, 1) : 0;
    if (closed && drive) S.q = Math.min(1, S.q + KQ * f * (1 - bc) * dt);
    S.q = Math.max(0, S.q - S.q * KB * bc * dt);
    S.bc = bc;
    S.f = f < 1e-4 ? 0 : f;
    const mul = twIs('ff') ? 4 : 1;
    S.eD += V_F * S.f * dt * mul;
    if (bc > 0) { S.ionD += V_B * S.f * dt * mul; [0, 1].forEach(i => { S.xfer[i] = Math.min(1, S.xfer[i] + S.f * dt * 0.5 * mul); }); }
    if (S.f > 0 && !twIs('ff')) [0, 1].forEach(i => { S.wear[i] = Math.min(1, S.wear[i] + WEAR_RATE * S.f * dt); });
    // 電壓表：阻尼彈簧（零點擋針）
    const om = 9, z = 0.5;
    let h = dt;
    while (h > 1e-6) {
      const q = Math.min(0.008, h); h -= q;
      S.nv += (om * om * (S.f - S.nk) - 2 * z * om * S.nv) * q; S.nk += S.nv * q;
      if (S.nk < -0.02) { S.nk = -0.02; if (S.nv < 0) S.nv = 0; }
    }
    // 第 3 步：接通後觀察指針擺一下再回零，才解鎖第 4 步
    if (S.observing) {
      const el = S.t - S.obsT;
      if ((el > 2.4 && Math.abs(S.nk) < 0.03 && Math.abs(S.nv) < 0.15) || el > 6) { S.observing = false; S.stage = 4; refreshUI(); }
    }
  }

  // ───────── 操作 ─────────
  function tween(key, dur, data, done) { S.tw = { key, t0: S.t, dur, data: data || {}, done }; refreshUI(); }
  function can(key) {
    if (key === 'reset') return true;
    if (busy()) return false;
    const st = S.stage;
    switch (key) {
      case 'cupL': return st === 1 && !S.cup[0];
      case 'solL': return st === 1 && S.cup[0] && !S.sol[0];
      case 'elL': return st === 1 && !!S.sol[0] && !S.el[0];
      case 'cupR': return st === 2 && !S.cup[1];
      case 'solR': return st === 2 && S.cup[1] && !S.sol[1];
      case 'elR': return st === 2 && !!S.sol[1] && !S.el[1];
      case 'meter': return st === 3 && !S.meter;
      case 'wireL': return st === 3 && S.meter && !S.wire[0];
      case 'wireR': return st === 3 && S.meter && !S.wire[1];
      case 'wireNext': return st === 3 && S.meter && (!S.wire[0] || !S.wire[1]);
      case 'bridge': return st === 4 && !S.bridge;
      case 'ff': return st === 5;
      case 'tBridge': case 'tWire': return st === 6;
      case 'zncu': return st === 6 && combo() !== 'zncu';
      case 'znzn': return st === 6 && combo() !== 'znzn';
      case 'cucu': return st === 6 && combo() !== 'cucu';
    }
    return false;
  }
  function wireDone(i) {
    S.wire[i] = true;
    if (S.wire[0] && S.wire[1]) { S.observing = true; S.obsT = S.t; }
  }
  function act(key) {
    if (!can(key)) return;
    S.actions++;
    if (key === 'wireNext') key = S.wire[0] ? 'wireR' : 'wireL';
    switch (key) {
      case 'reset': resetState(); refreshUI(); break;
      case 'cupL': S.used.beakerA = true; tween('cupL', 1.1, null, () => { S.cup[0] = true; }); break;
      case 'cupR': S.used.beakerB = true; tween('cupR', 1.1, null, () => { S.cup[1] = true; }); break;
      case 'solL': S.used.znsol = true; tween('solL', 2.6, { kind: 'zn' }, () => { S.sol[0] = 'zn'; }); break;
      case 'solR': S.used.cusol = true; tween('solR', 2.6, { kind: 'cu' }, () => { S.sol[1] = 'cu'; }); break;
      case 'elL': S.used.zn = true; tween('elL', 1.5, { kind: 'zn' }, () => { S.el[0] = 'zn'; S.stage = 2; }); break;
      case 'elR': S.used.cu = true; tween('elR', 1.5, { kind: 'cu' }, () => { S.el[1] = 'cu'; S.stage = 3; }); break;
      case 'meter': S.used.meter = true; tween('meter', 1.1, null, () => { S.meter = true; }); break;
      case 'wireL': case 'wireR': {
        const i = key === 'wireR' ? 1 : 0;
        if (!S.used.wire1) S.used.wire1 = true; else S.used.wire2 = true;
        tween(key, 0.9, null, () => wireDone(i)); break;
      }
      case 'bridge': tween('bridgeIn', 1.7, null, () => { S.bridge = true; S.stage = 5; }); break;
      case 'ff': tween('ff', 3, { w0: S.wear.slice() }, () => { S.stage = 6; S.last = 'init'; }); break;
      case 'tBridge':
        S.tried.b = true; S.last = 'bridge';
        if (S.bridge) { S.bridge = false; tween('bridgeOut', 2.8); }
        else tween('bridgeIn', 1.7, null, () => { S.bridge = true; });
        break;
      case 'tWire':
        S.tried.w = true; S.last = 'wire';
        if (S.pulled) tween('plug', 0.4, null, () => { S.pulled = false; });
        else { S.pulled = true; tween('pull', 0.35); }
        break;
      case 'zncu': case 'znzn': case 'cucu': {
        const to = key === 'zncu' ? ['zn', 'cu'] : key === 'znzn' ? ['zn', 'zn'] : ['cu', 'cu'];
        S.tried.c = true; S.last = 'combo';
        tween('swap', 1.8, { from: S.el.slice(), to, ch: [S.el[0] !== to[0], S.el[1] !== to[1]], w0: S.wear.slice() });
        break;
      }
    }
    refreshUI();
    if (!R0.raf) render();
  }

  // ───────── 控制鈕 ─────────
  function ctrlSpec() {
    const st = S.stage, rows = [];
    const A = {
      1: [['cupL', T('放燒杯', 'Place beaker')], ['solL', T('倒入硫酸鋅溶液', 'Pour ZnSO₄')], ['elL', T('放進鋅片', 'Add Zn plate')]],
      2: [['cupR', T('放燒杯', 'Place beaker')], ['solR', T('倒入硫酸銅溶液', 'Pour CuSO₄')], ['elR', T('放進銅片', 'Add Cu plate')]],
      3: [['meter', T('放上電壓表', 'Place voltmeter')], ['wireL', T('接鋅片導線', 'Wire to Zn')], ['wireR', T('接銅片導線', 'Wire to Cu')]],
      4: [['bridge', T('裝上鹽橋', 'Add salt bridge')]],
      5: [['ff', T('快轉觀察', 'Fast-forward')]],
      6: []
    }[st].slice();
    A.push(['reset', T('重新做一次', 'Start over')]);
    rows.push([st < 6 ? T(`步驟 ${st}`, `Step ${st}`) : T('完成！', 'Done!'), A]);
    const lock = st < 6 ? '🔒 ' : '';
    rows.push([lock + T('改條件', 'Change'), [
      ['tBridge', S.bridge || st < 6 ? T('拿掉鹽橋', 'Remove bridge') : T('裝回鹽橋', 'Put bridge back')],
      ['tWire', S.pulled ? T('接回導線', 'Reconnect wire') : T('拔掉一條導線', 'Unplug a wire')]]]);
    rows.push([lock + T('電極組合', 'Electrodes'), [['zncu', T('鋅＋銅', 'Zn + Cu')], ['znzn', T('鋅＋鋅', 'Zn + Zn')], ['cucu', T('銅＋銅', 'Cu + Cu')]]]);
    return rows;
  }
  function buildControls() {
    if (!ctrl) return;
    const rows = ctrlSpec(), sig = JSON.stringify(rows);
    if (sig === ctrlSig) return;
    ctrlSig = sig;
    const fk = document.activeElement && ctrl.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    ctrl.style.display = 'flex'; ctrl.style.flexDirection = 'column'; ctrl.style.gap = '10px';
    for (const [name, btns] of rows) {
      const row = document.createElement('div'); row.className = 'lab-row';
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name;
      sp.style.cssText = 'font-size:22px;font-weight:900;color:#b8c9c1;margin-right:4px;';
      row.appendChild(sp);
      for (const [key, label] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'action-btn lab-btn'; b.dataset.act = key; b.textContent = label;
        b.style.cssText = 'font-size:22px;min-height:56px;padding:10px 18px;font-weight:900;touch-action:manipulation;';
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b && !b.disabled) b.focus(); }
  }
  function refreshUI() {
    buildControls();
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act, ok = can(k);
      b.disabled = !ok; b.style.opacity = ok ? '1' : '0.42'; b.style.cursor = ok ? 'pointer' : 'default';
      if (k === 'zncu' || k === 'znzn' || k === 'cucu') {
        const on = S.stage === 6 && combo() === k;
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('active', on);
      }
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', T('鋅銅電池實驗台：點畫面上發亮的器材，或按下方按鈕，一步一步組裝電池；目前：', 'Zn-Cu cell bench: tap the glowing part or use the buttons below to build the cell step by step. Now: ') + caption());
  }

  // ───────── 點畫面（只認目前發亮的目標） ─────────
  function onClick(e) {
    if (!cv) return;
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    const hit = targetsNow.find(tg => x >= tg.r[0] - 8 && x <= tg.r[2] + 8 && y >= tg.r[1] - 8 && y <= tg.r[3] + 8);
    if (hit) act(hit.key);
  }
  function onMove(e) {
    if (!cv || e.pointerType !== 'mouse') return;
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    cv.style.cursor = targetsNow.some(tg => x >= tg.r[0] - 8 && x <= tg.r[2] + 8 && y >= tg.r[1] - 8 && y <= tg.r[3] + 8) ? 'pointer' : 'default';
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.05, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt); render(); writeResult();
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
    cv = document.getElementById('cellLabCanvas');
    if (!cv) return;
    ctrl = document.getElementById('cellLabControls');
    if (!ctrl) {                                                  // 頁面沒放容器就自己建在畫布外框後面
      ctrl = document.createElement('div'); ctrl.id = 'cellLabControls'; ctrl.className = 'lab-controls';
      const host = cv.parentElement && cv.parentElement.classList.contains('canvas-wrap') ? cv.parentElement : cv;
      host.insertAdjacentElement('afterend', ctrl);
    }
    res = document.getElementById('cellLabResult');
    ctx = cv.getContext('2d');
    resetState();
    R0.on = true; lastRes = ''; ctrlSig = '';
    cv.addEventListener('click', onClick);
    cv.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVis);
    refreshUI(); render(); sync();
  }
  function deactivate() {
    R0.on = false;
    if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0;
    if (R0.timer) clearTimeout(R0.timer); R0.timer = 0;
    if (cv) { cv.removeEventListener('click', onClick); cv.removeEventListener('pointermove', onMove); }
    document.removeEventListener('visibilitychange', onVis);
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ctrlSig = '';
  }
  function relang() { if (!R0.on) return; lastRes = ''; ctrlSig = ''; refreshUI(); render(); }
  function _state() {
    return {
      stage: S.stage, sub: msgKey(), busy: busy(), observing: S.observing, tween: S.tw ? S.tw.key : null,
      parts: { cupL: S.cup[0], cupR: S.cup[1], solL: S.sol[0], solR: S.sol[1], elL: S.el[0], elR: S.el[1],
        meter: S.meter, wireL: S.wire[0], wireR: S.wire[1], bridge: S.bridge, wirePulled: S.pulled },
      combo: combo(), closed: isClosed(), flow: +S.f.toFixed(3), imbalance: +S.q.toFixed(3),
      needle: +(S.nk * 88).toFixed(2), needleK: +S.nk.toFixed(3),
      zincW: S.el[0] ? +subW(S.el[0], S.wear[0]).toFixed(1) : null, copperW: S.el[1] ? +subW(S.el[1], S.wear[1]).toFixed(1) : null,
      wear: S.wear.map(w => +w.toFixed(3)), tried: Object.assign({}, S.tried),
      targets: targetsNow.map(t => ({ key: t.key, r: t.r.map(v => Math.round(v)) })),
      caption: caption(), running: !!R0.raf, on: R0.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  window.GbLab.cell = { activate, deactivate, relang, _state };
})();
