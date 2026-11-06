/* galvanic_batteries_4_lab_redox_1106_v1.js — 「🔬 動手做：數一數電子」實驗台（#redoxLabCanvas，邏輯 1000×600）
 *
 * 契約：window.GbLab.redox = { activate(), deactivate(), relang(), _state() }
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰 GbAnim、ctl 或舊程式的全域）。
 * 控制鈕由本檔建立在 #redoxLabControls（沒有就建在畫布外框後面），說明字寫進 #redoxLabResult（只有文字改變時才寫）。
 * 畫風與同課 lab_cell／lab_origin 實驗台、redox 教學動畫一致：同一套燒杯、液面亮線、金屬漸層電極、倒 U 鹽橋、
 * 電子藍球、橘色離子膠囊（深色字）、金屬漸層原子球、電子槽（虛線圈）、黃色虛線發亮提示。
 *
 * ── 實驗（學生自己數電子；按鈕＋點畫面上發亮的零件，兩種方式都能做）──
 *   〔鋅送出 1 個電子〕（或點發亮的鋅片）：鋅片表面那個鋅原子的電子，從鋅片經外導線走到銅片那一端，停在導線上「在路上」。
 *     一個鋅原子要送出 2 個電子才成為 Zn²⁺（Zn → Zn²⁺ ＋ 2e⁻），所以第 2 次送出時，鋅原子變成鋅離子、離開鋅片進入溶液。
 *   〔銅離子接收 1 個電子〕（或點發亮的銅離子）：導線上最前面那個電子進銅片；第 1 次 Cu²⁺ 先靠到銅片上，
 *     第 2 個電子到了，Cu²⁺ 變成銅原子貼在銅片上（Cu²⁺ ＋ 2e⁻ → Cu）。只有導線上有電子在等時才能接收。
 *   記分板「送出 ＿ 個／接收 ＿ 個」：相等打勾（2＝2 時「電子數守恆：失去 2 個＝得到 2 個」），不相等打叉「還有電子在路上」。
 *   檢視〔只看氧化〕〔只看還原〕〔合併觀看〕（舊內容）：另一半畫面與反應式壓暗；只看氧化時不能接收、只看還原時不能送出
 *   （→「電子一定有來源，也一定有去處」）。〔重做〕回到 0／0（檢視模式不變）；activate() 一律回到 0／0、合併觀看。
 *
 * ── 科學表示 ───────────────────────────────────────────
 *   電子只在金屬（鋅片、銅片）與外導線裡；離子（Zn²⁺、Cu²⁺）只在溶液裡，原子只貼在電極表面。數字只用 1、2。
 *   不寫電壓、電流、電位；不用國中沒教的術語。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y≈58 一句提示。外導線 y=130（Zn 片頂 → Cu 片頂）；y=104「外導線」與「在路上」。
 *   左杯 x 24–264、右杯 x 376–616；杯口 y=240、液面 y=300、杯底 y=470；電極 Zn x=70、Cu x=570，y 190–445（同 lab_origin）。
 *   電子槽：兩片電極各 2 個（y=352／400）；鋅原子 (110,375) → Zn²⁺ (172,375)；Cu²⁺ (478,375) → 靠到銅片 → 銅原子 (530,375)。
 *   鹽橋：倒 U，兩腳 x=236／404（同 lab_origin），「鹽橋」寫在兩杯之間 y≈330。杯底 y≈440「氧化」「還原」。
 *   右欄 x 636–988、y 88–470：數電子記分板＋守恆判斷＋兩條反應式。y≈506 舊標題「電子一定有來源，也一定有去處」，y 548／580 圖例。
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
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 幾何（杯、電極、鹽橋與 lab_origin 相同） ─────────
  const CAP_Y = 58, WY = 130;
  const BRIM = 240, BBOT = 470, LIQ = 300, TABLE_Y = 474;
  const CUPF = [{ x0: 24, x1: 264, top: BRIM, bot: BBOT }, { x0: 376, x1: 616, top: BRIM, bot: BBOT }];
  const EX = [70, 570], EW = 36, ETOP = 190, EBOT = 445, EH = EBOT - ETOP;
  const BLX = 236, BRX = 404, BCY = 222, BR = 24, BBY = 438, T_OUT = 17, T_IN = 12, BTOP = BCY - BR - T_OUT, BMID = (BLX + BRX) / 2;
  const PX = 636, PY = 88, PW = 352, PH = 382;
  const AY = 375, ATOM_R = 22;
  const SLOT_Y = [352, 400];                                     // 兩片電極上的電子槽
  const ZN_ATOM = { x: EX[0] + EW / 2 + ATOM_R, y: AY }, ZN_ION = { x: 172, y: AY };
  const CU_ION0 = { x: 478, y: AY }, CU_ATOM = { x: EX[1] - EW / 2 - ATOM_R, y: AY };
  const V_E = 430;                                               // 電子沿路徑的速度（px/s）
  const WIRE = [{ x: EX[0], y: ETOP - 2 }, { x: EX[0], y: WY }, { x: EX[1], y: WY }, { x: EX[1], y: ETOP - 2 }];

  // ───────── 文字工具（先量再寫） ─────────
  let ctx = null;
  function textW(s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(s, maxW, size) {
    if (s.indexOf('\n') >= 0) {                                  // 預定斷點：整句塞得下就一行，否則先在斷點分行
      const one = s.replace(/\n/g, '');
      if (textW(one, size) <= maxW) return [one];
      return s.split('\n').reduce((a, part) => a.concat(wrap(part, maxW, size)), []);
    }
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
  function label2(s, x, y, maxW, color, al, align) {
    const ls = textW(s, 22) <= maxW ? [s] : wrap(s, maxW, 22).slice(0, 2);
    ls.forEach((l, k) => text(l, x, y + (k - (ls.length - 1) / 2) * 26, color, 22, align || 'center', al));
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
  function strokePts(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); }
  function lanePts(o) {
    const R = BR + o, pts = [{ x: BLX - o, y: BBY }, { x: BLX - o, y: BCY }];
    for (let j = 1; j <= 8; j++) { const a = Math.PI + j / 8 * Math.PI / 2; pts.push({ x: BLX + BR + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + j / 8 * Math.PI / 2; pts.push({ x: BRX - BR + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    pts.push({ x: BRX + o, y: BBY });
    return pts;
  }
  const TUBE = lanePts(0), TUBE_P = mkPath(TUBE);
  const BRIDGE_IONS = [];
  for (let k = 0; k * 36 + 22 < TUBE_P.L - 10; k++) BRIDGE_IONS.push([k * 36 + 22, k % 2]);
  // 第 j 個電子：鋅片槽 j → 鋅片頂 → 外導線 → 銅片頂 → 銅片槽 j（全程在金屬與導線裡）
  const EP = SLOT_Y.map(y => mkPath([{ x: EX[0], y }, { x: EX[0], y: WY }, { x: EX[1], y: WY }, { x: EX[1], y }]));
  const CORNER = SLOT_Y.map(y => (y - WY) + (EX[1] - EX[0]));      // 到右上角 (570,130) 的路徑長
  const waitS = (j, q) => CORNER[j] + 30 - 36 * q;                 // 在導線上等：q=0 最前面（銅片正上方）

  // ───────── 狀態 ─────────
  const S = {};
  function resetCount() {
    Object.assign(S, { sent: 0, recv: 0, es: [0, 0], arrived: [false, false], znM: 0, cuA: 0, cuM: 0, rings: [], flash: { ox: -9, red: -9 } });
  }
  function resetState() { S.t = 0; S.mode = 'both'; S.actions = 0; resetCount(); }
  resetState();
  const R0 = { raf: 0, timer: 0, last: 0, on: false };
  let cv = null, ctrl = null, res = null, lastRes = '', ctrlSig = '', targetsNow = [];

  const waiting = () => S.sent - S.recv;
  function eTarget(j) { return j < S.recv ? EP[j].L : j < S.sent ? waitS(j, j - S.recv) : 0; }
  function busy() {
    for (let j = 0; j < 2; j++) if (Math.abs(S.es[j] - eTarget(j)) > 0.5) return true;
    if (Math.abs(S.znM - (S.sent >= 2 ? 1 : 0)) > 1e-3) return true;
    if (Math.abs(S.cuA - (S.recv >= 1 ? 1 : 0)) > 1e-3) return true;
    if (Math.abs(S.cuM - cuMTarget()) > 1e-3) return true;
    return false;
  }
  const cuMTarget = () => (S.recv >= 2 && S.arrived[1] ? 1 : 0);
  const showOx = () => S.mode !== 'red', showRed = () => S.mode !== 'ox';

  // ───────── 圖形：燒杯、溶液、電極（與 lab_origin 同一畫法） ─────────
  function beakerPath(c) {
    const { x0, x1, top, bot } = c, r = 16, lip = 8;
    ctx.beginPath();
    ctx.moveTo(x0 - lip, top - lip * 0.75); ctx.quadraticCurveTo(x0, top - lip / 2, x0, top + lip);
    ctx.lineTo(x0, bot - r); ctx.quadraticCurveTo(x0, bot, x0 + r, bot);
    ctx.lineTo(x1 - r, bot); ctx.quadraticCurveTo(x1, bot, x1, bot - r);
    ctx.lineTo(x1, top + lip); ctx.quadraticCurveTo(x1, top - lip / 2, x1 + lip, top - lip * 0.75);
  }
  function innerClip(c, yTop) {
    const { x0, x1, bot } = c, r = 16;
    ctx.beginPath();
    ctx.moveTo(x0 + 2, yTop); ctx.lineTo(x0 + 2, bot - r); ctx.quadraticCurveTo(x0 + 2, bot - 2, x0 + r, bot - 2);
    ctx.lineTo(x1 - r, bot - 2); ctx.quadraticCurveTo(x1 - 2, bot - 2, x1 - 2, bot - r); ctx.lineTo(x1 - 2, yTop); ctx.closePath();
  }
  function beakerBack(c) { ctx.save(); innerClip(c, c.top); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore(); }
  function beakerFront(c) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(c); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(c); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function liquid(c, color) { ctx.save(); innerClip(c, LIQ); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }
  function surface(c) {
    ctx.save();
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ); ctx.lineTo(c.x1 - 2, LIQ); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ + 4); ctx.lineTo(c.x1 - 2, LIQ + 4); ctx.stroke();
    ctx.restore();
  }
  function metalGrad(kind, x0, w) {
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    return g;
  }
  function electrode(x, kind) {
    ctx.save(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5;
    ctx.fillStyle = metalGrad(kind, x - EW / 2, EW); rrect(x - EW / 2, ETOP, EW, EH, 4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x - EW / 2 - 2, LIQ, EW + 4, EBOT - LIQ + 2); ctx.clip();
    ctx.fillStyle = 'rgba(16,58,72,0.42)'; rrect(x - EW / 2, ETOP, EW, EH, 4); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#3a4a44'; rrect(x - 7, ETOP - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }

  // ───────── 圖形：原子、離子、電子、導線 ─────────
  function ionDot(x, y, kind, al, r) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = kind ? K.neg : K.pos;
    ctx.beginPath(); ctx.arc(x, y, r || 5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function atom(x, y, kind, al) {
    if (al <= 0.01) return;
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - 7, y - 8, 3, x, y, ATOM_R);
    g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, ATOM_R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(kind === 'cu' ? 'Cu' : 'Zn', x, y + 1, K.ink, 22, 'center', al, true);
  }
  const pillHalf = s => textW(s, 22, true) / 2 + 10;
  function ionPill(x, y, s, al) {
    if (al <= 0.01) return;
    const hw = pillHalf(s);
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.pos; ctx.shadowColor = K.pos; ctx.shadowBlur = 8;
    rrect(x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ball(x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function slot(x, y, al, r) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.electron; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]);
    ctx.fillStyle = 'rgba(12,30,25,0.88)';
    ctx.beginPath(); ctx.arc(x, y, r || 11, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function ring(x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function wireLine(pts) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(pts); ctx.stroke(); });
    ctx.restore();
  }
  function wireEnd(x, y) {
    ctx.save(); ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(x - 7, y - 6, 14, 10, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function mark(ok, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function bridge() {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = T_OUT * 2 + 4; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.glass; ctx.lineWidth = T_OUT * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.bg; ctx.lineWidth = T_IN * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,238,242,0.13)'; ctx.lineWidth = T_IN * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = 2; strokePts(lanePts(-T_IN + 3)); ctx.stroke();
    BRIDGE_IONS.forEach(([s0, kind], k) => {
      const p = at(TUBE_P, s0 + 3 * Math.sin(S.t * 2.1 + k * 1.7));
      ionDot(p.x, p.y, kind, clamp((TUBE_P.L - s0) / 14, 0, 1), 6);
    });
    ctx.restore();
  }
  function dimSide(x0, x1) { ctx.save(); ctx.globalAlpha = 0.62; ctx.fillStyle = K.bg; ctx.fillRect(x0, 84, x1 - x0, 392); ctx.restore(); }
  function drawTable() {
    ctx.save();
    const g = ctx.createLinearGradient(0, TABLE_Y, 0, TABLE_Y + 12);
    g.addColorStop(0, '#3b5a4f'); g.addColorStop(1, '#1b332c');
    ctx.fillStyle = g; rrect(10, TABLE_Y, 620, 12, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, TABLE_Y + 0.5); ctx.lineTo(626, TABLE_Y + 0.5); ctx.stroke();
    ctx.restore();
  }

  // ───────── 原子／離子／電子的目前位置 ─────────
  function ePos(j) {
    const p = at(EP[j], S.es[j]);
    const still = Math.abs(S.es[j] - eTarget(j)) <= 0.5;
    if (still) p.x += 1.4 * Math.sin(S.t * 5 + j * 2);              // 停著的電子輕輕抖動（還在那裡）
    return p;
  }
  function znAtomPos() { const m = ease(S.znM); return { x: lerp(ZN_ATOM.x, ZN_ION.x, m), y: AY + (m >= 1 ? 4 * Math.sin(S.t * 1.8) : 0) }; }
  function cuIonPos() {
    const hw = pillHalf('Cu²⁺'), a = ease(S.cuA), m = ease(S.cuM);
    const x = lerp(lerp(CU_ION0.x, EX[1] - EW / 2 - hw, a), CU_ATOM.x, m);
    return { x, y: AY + (a <= 0 ? 4 * Math.sin(S.t * 1.6 + 1) : 0) };
  }

  // ───────── 可以點的目標 ─────────
  function computeTargets() {
    const out = [];
    if (can('ox')) out.push({ r: [EX[0] - EW / 2 - 8, ETOP - 8, ZN_ATOM.x + ATOM_R + 8, EBOT + 6], key: 'ox', shape: 'zn' });
    if (can('red')) { const p = cuIonPos(), hw = pillHalf('Cu²⁺'); out.push({ r: [p.x - hw - 8, AY - 26, EX[1] + EW / 2 + 8, AY + 26], key: 'red', shape: 'cu' }); }
    return out;
  }
  function drawGlow(tg) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(S.t * 3.4); ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = K.yellow; ctx.shadowBlur = 6; ctx.lineJoin = 'round';
    if (tg.shape === 'zn') { rrect(EX[0] - EW / 2 - 6, ETOP - 8, EW + 12, EH + 14, 8); ctx.stroke(); ctx.beginPath(); ctx.arc(ZN_ATOM.x, AY, ATOM_R + 7, 0, TAU); ctx.stroke(); }
    else { const p = cuIonPos(), hw = pillHalf('Cu²⁺'); rrect(p.x - hw - 7, AY - 23, hw * 2 + 14, 46, 23); ctx.stroke(); }
    ctx.restore();
  }

  // ───────── 右欄：數電子 ─────────
  function drawPanel() {
    ctx.save(); ctx.fillStyle = 'rgba(18,51,41,0.72)'; ctx.strokeStyle = 'rgba(159,179,170,0.3)'; ctx.lineWidth = 2;
    rrect(PX, PY, PW, PH, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    text(T('數電子', 'Count the electrons'), PX + 18, PY + 26, K.yellow, 26, 'left');
    // 記分板：送出 ＿ 個／接收 ＿ 個
    const rows = [[T('鋅送出', 'Zn gives out'), S.sent, K.znHi, showOx()], [T('銅離子接收', 'Cu²⁺ takes in'), S.recv, K.cuHi, showRed()]];
    const lz = Math.min(...rows.map(r => fitSize(r[0], 170, 24))), lw = Math.max(...rows.map(r => textW(r[0], lz)));
    rows.forEach(([lab, n, col, on], k) => {
      const y = PY + 72 + k * 44, al = on ? 1 : 0.35;
      text(lab, PX + 18, y, col, lz, 'left', al);
      const bx = PX + 18 + lw + 26;
      [0, 1].forEach(j => { slot(bx + j * 30, y, al, 10); if (j < n) ball(bx + j * 30, y, 8, al); });
      text(T(`${n} 個`, `${n}`), PX + PW - 18, y, K.white, 28, 'right', al);
    });
    // 守恆判斷
    const w = waiting(), ys = PY + 162;
    let ok = null, s, col;
    if (S.sent === 0) { s = T('還沒有電子移動', 'No electron has moved yet'); col = K.muted; }
    else if (w === 0 && S.sent === 2) { ok = true; s = T('電子數守恆：\n失去 2 個＝得到 2 個', 'Conserved:\nlost 2 = gained 2'); col = K.green; }
    else if (w === 0) { ok = true; s = T(`送出 ${S.sent} 個＝接收 ${S.recv} 個`, `Given ${S.sent} = taken ${S.recv}`); col = K.green; }
    else { ok = false; s = T(`還有 ${w} 個電子在路上`, `${w} electron${w > 1 ? 's' : ''} still on the way`); col = K.red; }
    const tx = ok === null ? PX + 18 : PX + 50, maxW = PX + PW - 14 - tx;
    let z = 24, ls = wrap(s, maxW, 24);
    if (ls.length > 1) { const l22 = wrap(s, maxW, 22); if (l22.length < ls.length || l22.length <= 2) { z = 22; ls = l22; } }
    ls = ls.slice(0, 2);
    const lh = z + 4, y0 = ys - (ls.length - 1) * lh / 2;
    if (ok !== null) {
      ctx.save(); ctx.fillStyle = ok ? 'rgba(74,222,128,0.10)' : 'rgba(255,107,90,0.12)'; ctx.strokeStyle = ok ? K.green : K.red; ctx.lineWidth = 2; ctx.setLineDash(ok ? [] : [8, 6]);
      rrect(PX + 8, ys - 30, PW - 16, 60, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      mark(ok, PX + 30, ys, 1);
    }
    ls.forEach((l, k) => text(l, tx, y0 + k * lh, col, z, 'left'));
    // 反應式（隨檢視模式亮暗）
    ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PX + 16, PY + 210); ctx.lineTo(PX + PW - 16, PY + 210); ctx.stroke(); ctx.restore();
    eqBlock(T('氧化＝失去電子', 'Oxidation = losing e⁻'), [['Zn', K.znHi], [' → ', K.white], ['Zn²⁺', K.pos], [' + ', K.white], ['2e⁻', K.electron]], 4,
      PY + 236, showOx(), S.sent >= 2, S.flash.ox);
    eqBlock(T('還原＝得到電子', 'Reduction = gaining e⁻'), [['Cu²⁺', K.pos], [' + ', K.white], ['2e⁻', K.electron], [' → ', K.white], ['Cu', K.cuHi]], 2,
      PY + 312, showRed(), S.recv >= 2, S.flash.red);
  }
  function eqBlock(head, terms, hi, y, on, done, flashT) {
    const al = on ? 1 : 0.3;
    text(head, PX + 18, y, on ? K.white : K.muted, fitSize(head, PW - 36, 24), 'left', al);
    const str = terms.map(g => g[0]).join(''), z = fitSize(str, PW - 40, 28, true);
    const ws = terms.map(g => textW(g[0], z, true)), tot = ws.reduce((a, b) => a + b, 0);
    let x = PX + PW / 2 - tot / 2; const ey = y + 36, box = [];
    terms.forEach((g, k) => { text(g[0], x, ey, g[1], z, 'left', al, true); box.push([x, x + ws[k]]); x += ws[k]; });
    if (done && on) {
      const b = box[hi], pulse = clamp(1 - (S.t - flashT) / 1.2, 0, 1);
      ctx.save(); ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.shadowColor = K.yellow; ctx.shadowBlur = 8 + 10 * pulse;
      rrect(b[0] - 7, ey - z * 0.7, b[1] - b[0] + 14, z * 1.4, 8); ctx.stroke(); ctx.restore();
    }
  }

  // ───────── 圖例、提示 ─────────
  function drawLegend() {
    const items = [[T('藍球 e⁻＝電子（只走金屬與導線）', 'Blue ball e⁻ = electron (metal and wire only)'), 'b'],
      [T('橘＝正離子、紫＝負離子（只在溶液與鹽橋）', 'Orange/purple = +/− ion (solution and bridge only)'), 'i']];
    const gi = 42, gap = 34, wid = items.map(([s]) => gi + textW(s, 22));
    const one = wid[0] + wid[1] + gap <= W - 40;
    const rows = one ? [[0, 1]] : [[0], [1]], ys = one ? [560] : [548, 580];
    rows.forEach((rw, r) => {
      const tw = rw.reduce((a, k) => a + wid[k], 0) + gap * (rw.length - 1);
      let x = W / 2 - tw / 2;
      rw.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'b') ball(x + 14, y, 7, 1);
        else { ctx.save(); ctx.fillStyle = K.pos; ctx.beginPath(); ctx.arc(x + 7, y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = K.neg; ctx.beginPath(); ctx.arc(x + 23, y, 6, 0, TAU); ctx.fill(); ctx.restore(); }
        text(s, x + gi, y, K.white, 22, 'left');
        x += wid[k] + gap;
      });
    });
  }
  function drawCaption(s, color) {
    const z = fitSize(s, 960, 26);
    const ls = wrap(s, 960, z);
    const bw = Math.max(...ls.map(l => textW(l, ls.length > 1 ? 22 : z))) + 28, bh = ls.length > 1 ? 56 : 36;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.82)'; rrect(W / 2 - bw / 2, CAP_Y - bh / 2, bw, bh, 10); ctx.fill(); ctx.restore();
    if (ls.length === 1) text(ls[0], W / 2, CAP_Y, color, z);
    else ls.slice(0, 2).forEach((l, k) => text(l, W / 2, CAP_Y - 13 + k * 26, color, 22));
  }

  // ───────── 訊息（畫布提示＋說明框，同一個狀態） ─────────
  function msgKey() {
    const w = waiting();
    if (S.mode === 'red' && w === 0 && S.recv < 2) return 'noSource';
    if (S.mode === 'ox' && w > 0) return 'noDest';
    if (S.sent === 0) return S.mode === 'ox' ? 'startOx' : 'start';
    if (w > 0) return 'onWay';
    if (S.sent === 2) return S.mode === 'ox' ? 'doneOx' : S.mode === 'red' ? 'doneRed' : 'done';
    return 'half';
  }
  const Y = s => `<span class="accent-yellow">${s}</span>`;
  function msg(cap) {
    const k = msgKey(), w = waiting(), n = S.sent, r = S.recv;
    switch (k) {
      case 'start': return cap ? T('按〔鋅送出 1 個電子〕，或點發亮的鋅片', 'Press “Zn gives out 1 e⁻”, or tap the glowing zinc plate')
        : T(`${Y('電子一定有來源，也一定有去處。')}先讓鋅片送出 1 個電子，看它走到哪裡。`,
          `${Y('Electrons must come from somewhere and go somewhere.')} Let the zinc plate give out 1 electron and see where it goes.`);
      case 'startOx': return cap ? T('只看氧化：按〔鋅送出 1 個電子〕', 'Oxidation only: press “Zn gives out 1 e⁻”')
        : T(`只看氧化：${Y('氧化＝失去電子')}。Zn → Zn²⁺ ＋ 2e⁻：鋅原子失去電子，成為鋅離子。按〔鋅送出 1 個電子〕數數看。`,
          `Oxidation only: ${Y('oxidation = losing electrons')}. Zn → Zn²⁺ + 2e⁻: a zinc atom loses electrons and becomes a zinc ion. Press “Zn gives out 1 e⁻” and count.`);
      case 'onWay': {
        const head = n === 2 ? T('氧化：鋅原子失去 2 個電子，成為鋅離子 Zn²⁺。', 'Oxidation: the zinc atom has lost 2 electrons and become a zinc ion, Zn²⁺. ')
          : T('鋅原子送出 1 個電子，還有 1 個要送。', 'The zinc atom has given out 1 electron, with 1 more to go. ');
        return cap ? T(`還有 ${w} 個電子在路上：按〔銅離子接收 1 個電子〕`, `${w} e⁻ still on the way: press “Cu²⁺ takes in 1 e⁻”`)
          : head + T(`送出 ${n} 個、接收 ${r} 個：${Y(`還有 ${w} 個電子在路上`)}，還沒有去處。電子不會憑空出現或消失——點發亮的銅離子，讓它接收。`,
            `Given out ${n}, taken in ${r}: ${Y(`${w} electron${w > 1 ? 's are' : ' is'} still on the way`)}, with nowhere to go yet. Electrons never appear or vanish out of nowhere — tap the glowing copper ion to take one in.`);
      }
      case 'half': return cap ? T('送出 1 個＝接收 1 個：鋅原子還要再送出 1 個', 'Given 1 = taken 1: the zinc atom still has 1 more to give')
        : T(`送出 1 個、接收 1 個，${Y('兩邊相等')}。可是 Zn → Zn²⁺ ＋ 2e⁻：一個鋅原子要送出 2 個電子才成為鋅離子，銅離子也要得到 2 個電子才成為銅原子。再按一次〔鋅送出 1 個電子〕。`,
          `Given out 1, taken in 1: ${Y('both sides match')}. But Zn → Zn²⁺ + 2e⁻: a zinc atom must give out 2 electrons to become a zinc ion, and a copper ion must gain 2 to become a copper atom. Press “Zn gives out 1 e⁻” once more.`);
      case 'done': return cap ? T('電子數守恆：失去 2 個＝得到 2 個', 'Electron conservation: lost 2 = gained 2')
        : T(`氧化：鋅原子失去電子，成為鋅離子。還原：銅離子得到電子，成為銅原子。${Y('鋅失去電子；銅離子得到相同數量的電子。')}電子不會憑空出現或消失。`,
          `Oxidation: the Zn atom loses electrons and becomes Zn²⁺. Reduction: Cu²⁺ gains electrons and becomes a Cu atom. ${Y('Zinc loses electrons; the copper ion gains the same number.')} Electrons never appear or vanish out of nowhere.`);
      case 'doneOx': return cap ? T('氧化：鋅原子失去電子，成為鋅離子', 'Oxidation: the Zn atom loses electrons and becomes Zn²⁺')
        : T(`氧化：鋅原子失去電子，成為鋅離子。Zn → Zn²⁺ ＋ 2e⁻：電子寫在箭頭右邊＝${Y('送出 2 個電子')}。`,
          `Oxidation: the Zn atom loses electrons and becomes Zn²⁺. In Zn → Zn²⁺ + 2e⁻ the electrons are on the right of the arrow: it ${Y('releases 2 electrons')}.`);
      case 'doneRed': return cap ? T('還原：銅離子得到電子，成為銅原子', 'Reduction: Cu²⁺ gains electrons and becomes a Cu atom')
        : T(`還原：銅離子得到電子，成為銅原子。Cu²⁺ ＋ 2e⁻ → Cu：電子寫在箭頭左邊＝${Y('接收 2 個電子')}。`,
          `Reduction: Cu²⁺ gains electrons and becomes a Cu atom. In Cu²⁺ + 2e⁻ → Cu the electrons are on the left of the arrow: it ${Y('gains 2 electrons')}.`);
      case 'noDest': return cap ? T('只看氧化：送出的電子停在導線上，沒有去處', 'Oxidation only: the electrons wait on the wire with nowhere to go')
        : T(`只看氧化：鋅送出 ${n} 個電子，它們停在導線上，還沒有去處。${Y('電子一定有來源，也一定有去處')}——按〔合併觀看〕，讓銅離子接收。`,
          `Oxidation only: zinc has given out ${n} electron${n > 1 ? 's' : ''}; they wait on the wire with nowhere to go. ${Y('Electrons must come from somewhere and go somewhere')} — press “View both” to let the copper ion take them in.`);
      case 'noSource': return cap ? T('只看還原：沒有電子送過來，銅離子接收不到', 'Reduction only: no electron is coming, Cu²⁺ cannot take one in')
        : T(`只看還原：${Y('還原＝得到電子')}，Cu²⁺ ＋ 2e⁻ → Cu。可是導線上沒有電子：${Y('電子一定有來源')}——按〔合併觀看〕，先讓鋅送出電子。`,
          `Reduction only: ${Y('reduction = gaining electrons')}, Cu²⁺ + 2e⁻ → Cu. But there is no electron on the wire: ${Y('electrons must come from somewhere')} — press “View both” and let zinc give one out first.`);
    }
    return '';
  }
  function captionColor() { const k = msgKey(); return k === 'done' || k === 'doneOx' || k === 'doneRed' ? K.yellow : k === 'noDest' || k === 'noSource' ? K.red : K.cyan; }
  function writeResult() {
    if (!res) return;
    const h = msg(false);
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx || !cv || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawTable();
    CUPF.forEach(c => beakerBack(c));
    electrode(EX[0], 'zn'); electrode(EX[1], 'cu');
    liquid(CUPF[0], SOL.zn); liquid(CUPF[1], SOL.cu);
    CUPF.forEach(c => surface(c));
    // 原子、離子（電極表面／溶液裡）
    const zp = znAtomPos(), zm = ease(S.znM);
    atom(zp.x, zp.y, 'zn', clamp(1 - 2 * zm, 0, 1)); ionPill(zp.x, zp.y, 'Zn²⁺', clamp(2 * zm - 1, 0, 1));
    const cp = cuIonPos(), cm = ease(S.cuM);
    ionPill(cp.x, cp.y, 'Cu²⁺', clamp(1 - 2 * cm, 0, 1)); atom(cp.x, cp.y, 'cu', clamp(2 * cm - 1, 0, 1));
    bridge();
    CUPF.forEach(c => beakerFront(c));
    // 標註
    text(T('鋅片 Zn', 'Zn plate'), EX[0] + EW / 2 + 12, 212, K.znHi, 22, 'left');
    text(T('銅片 Cu', 'Cu plate'), EX[1] - EW / 2 - 10, 212, K.cuHi, 22, 'right');
    label2(T('硫酸鋅溶液', 'ZnSO₄ solution'), 153, 270, 124, K.muted, 1);
    label2(T('硫酸銅溶液', 'CuSO₄ solution'), 487, 270, 124, K.cyan, 1);
    text(T('氧化', 'Oxidation'), 153, 440, K.white, 22, 'center', 1);
    text(T('還原', 'Reduction'), 487, 440, K.white, 22, 'center', 1);
    if (!showRed()) dimSide(BMID, 632);
    if (!showOx()) dimSide(8, BMID);
    label2(T('鹽橋', 'Salt bridge'), BMID, 330, 100, K.white, 1);   // 鹽橋屬於兩邊：畫在壓暗之後
    // 外導線、電子槽、電子（電子只在金屬與導線）
    wireLine(WIRE); wireEnd(EX[0], ETOP - 2); wireEnd(EX[1], ETOP - 2);
    SLOT_Y.forEach(y => { slot(EX[0], y, showOx() ? 1 : 0.4); slot(EX[1], y, showRed() ? 1 : 0.4); });
    for (let j = 0; j < 2; j++) {
      const p = ePos(j), onL = S.es[j] < 1, onR = S.es[j] > EP[j].L - 1;
      ball(p.x, p.y, 8, (onL && !showOx()) || (onR && !showRed()) ? 0.45 : 1);
    }
    S.rings = S.rings.filter(r => S.t - r.t0 < 0.8);
    S.rings.forEach(r => ring(r.x, r.y, S.t - r.t0, r.c, r.r));
    text(T('外導線', 'Outer wire'), 200, 104, K.white, 22);
    const w = waiting();
    if (w > 0) text(T(`在路上 ×${w}`, `On the way ×${w}`), 508, 104, K.cyan, 22, 'center', 0.75 + 0.25 * Math.sin(S.t * 4));
    drawPanel();
    text(T('電子一定有來源，也一定有去處', 'Electrons must come from somewhere and go somewhere'), W / 2, 506,
      K.yellow, fitSize(T('電子一定有來源，也一定有去處', 'Electrons must come from somewhere and go somewhere'), 960, 24));
    drawLegend();
    targetsNow = computeTargets();
    targetsNow.forEach(drawGlow);
    drawCaption(msg(true), captionColor());
  }

  // ───────── 步進 ─────────
  function approach(v, tgt, rate, dt) { return v < tgt ? Math.min(tgt, v + rate * dt) : Math.max(tgt, v - rate * dt); }
  function step(dt) {
    S.t += dt;
    for (let j = 0; j < 2; j++) {
      const tg = eTarget(j), was = S.es[j];
      S.es[j] = approach(was, tg, V_E, dt);
      if (!S.arrived[j] && j < S.recv && S.es[j] >= EP[j].L - 0.01) {
        S.arrived[j] = true; S.rings.push({ x: EX[1], y: SLOT_Y[j], t0: S.t, c: K.electron, r: 11 });
        if (j === 1) S.flash.red = S.t + 0.8;
      }
    }
    S.znM = approach(S.znM, S.sent >= 2 ? 1 : 0, 1 / 1.1, dt);
    S.cuA = approach(S.cuA, S.recv >= 1 ? 1 : 0, 1 / 0.8, dt);
    S.cuM = approach(S.cuM, cuMTarget(), 1 / 0.8, dt);
  }

  // ───────── 操作 ─────────
  function can(key) {
    if (key === 'reset' || VIEW[key]) return true;
    if (busy()) return false;
    if (key === 'ox') return showOx() && S.sent < 2;
    if (key === 'red') return showRed() && waiting() > 0;
    return false;
  }
  function act(key) {
    if (!can(key)) return;
    S.actions++;
    switch (key) {
      case 'reset': resetCount(); break;
      case 'oxView': S.mode = 'ox'; break;
      case 'redView': S.mode = 'red'; break;
      case 'bothView': S.mode = 'both'; break;
      case 'ox':
        S.sent++; S.rings.push({ x: ZN_ATOM.x, y: AY, t0: S.t, c: K.white, r: ATOM_R });
        if (S.sent === 2) S.flash.ox = S.t;
        break;
      case 'red': S.recv++; break;
    }
    refreshUI();
    if (!R0.raf) render();
  }

  // ───────── 控制鈕 ─────────
  function ctrlSpec() {
    return [
      [T('數電子', 'Count e⁻'), [['ox', T('鋅送出 1 個電子', 'Zn gives out 1 e⁻')], ['red', T('銅離子接收 1 個電子', 'Cu²⁺ takes in 1 e⁻')], ['reset', T('重做', 'Redo')]]],
      [T('檢視', 'View'), [['oxView', T('只看氧化', 'Oxidation only')], ['redView', T('只看還原', 'Reduction only')], ['bothView', T('合併觀看', 'View both')]]]
    ];
  }
  const VIEW = { oxView: 'ox', redView: 'red', bothView: 'both' };
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
  let uiSig = '';
  function refreshUI() {
    buildControls();
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act, ok = can(k), on = VIEW[k] === S.mode;
      b.disabled = !ok; b.style.opacity = ok ? '1' : '0.42'; b.style.cursor = ok ? 'pointer' : 'default';
      if (VIEW[k]) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('active', on); }
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', T('數一數電子實驗台：按鋅送出電子、銅離子接收電子，看送出與接收的電子數是否相等；目前：', 'Electron-counting bench: let zinc give out electrons and the copper ion take them in, and check whether the counts match. Now: ') + msg(true));
    uiSig = sigNow();
  }
  const sigNow = () => [busy(), S.sent, S.recv, S.mode].join();

  // ───────── 點畫面（只認目前發亮的目標） ─────────
  function hitAt(e) {
    const r = cv.getBoundingClientRect(); if (!r.width) return null;
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    return targetsNow.find(tg => x >= tg.r[0] - 6 && x <= tg.r[2] + 6 && y >= tg.r[1] - 6 && y <= tg.r[3] + 6) || null;
  }
  function onClick(e) { if (!cv) return; const hit = hitAt(e); if (hit) act(hit.key); }
  function onMove(e) { if (!cv || e.pointerType !== 'mouse') return; cv.style.cursor = hitAt(e) ? 'pointer' : 'default'; }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.05, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt);
    if (sigNow() !== uiSig) refreshUI();                              // 動作做完 → 解鎖按鈕
    render(); writeResult();
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
    cv = document.getElementById('redoxLabCanvas');
    if (!cv) return;
    ctrl = document.getElementById('redoxLabControls');
    if (!ctrl) {
      ctrl = document.createElement('div'); ctrl.id = 'redoxLabControls'; ctrl.className = 'lab-controls';
      const host = cv.parentElement && cv.parentElement.classList.contains('canvas-wrap') ? cv.parentElement : cv;
      host.insertAdjacentElement('afterend', ctrl);
    }
    res = document.getElementById('redoxLabResult');
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
  function where(p) {
    const inPlate = i => Math.abs(p.x - EX[i]) <= EW / 2 && p.y >= ETOP - 8 && p.y <= EBOT;
    if (inPlate(0)) return 'znPlate';
    if (inPlate(1)) return 'cuPlate';
    const onSeg = (a, b) => Math.abs(a.x - b.x) < 1 ? Math.abs(p.x - a.x) <= 3 && p.y >= Math.min(a.y, b.y) - 1 && p.y <= Math.max(a.y, b.y) + 1
      : Math.abs(p.y - a.y) <= 3 && p.x >= Math.min(a.x, b.x) - 1 && p.x <= Math.max(a.x, b.x) + 1;
    for (let k = 0; k + 1 < WIRE.length; k++) if (onSeg(WIRE[k], WIRE[k + 1])) return 'wire';
    return 'OTHER';
  }
  function _state() {
    return {
      mode: S.mode, sent: S.sent, recv: S.recv, waiting: waiting(), busy: busy(), sub: msgKey(),
      electrons: [0, 1].map(j => { const p = at(EP[j], S.es[j]); return { s: +S.es[j].toFixed(1), x: Math.round(p.x), y: Math.round(p.y), where: where(p) }; }),
      znIon: +S.znM.toFixed(3), cuNear: +S.cuA.toFixed(3), cuAtom: +S.cuM.toFixed(3),
      ions: { zn: znAtomPos(), cu: cuIonPos() },
      targets: targetsNow.map(t => ({ key: t.key, shape: t.shape, r: t.r.map(v => Math.round(v)) })),
      caption: msg(true), running: !!R0.raf, on: R0.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  window.GbLab.redox = { activate, deactivate, relang, _state };
})();
