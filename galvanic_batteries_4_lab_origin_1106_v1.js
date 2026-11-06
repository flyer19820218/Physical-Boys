/* galvanic_batteries_4_lab_origin_1106_v1.js — 「🔬 動手做：兩種金屬才能發電？」實驗台（#originLabCanvas，邏輯 1000×600）
 *
 * 契約：window.GbLab.origin = { activate(), deactivate(), relang(), _state() }
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰 GbAnim、ctl 或舊程式的全域）。
 * 控制鈕由本檔建立在 #originLabControls（沒有就建在畫布外框後面），說明字寫進 #originLabResult（只有文字改變時才寫）。
 * 畫風與同課 galvanic_batteries_4_lab_cell（鋅銅電池實驗台）、origin 教學動畫第 5 步一致：同一套燒杯、液面亮線、
 * 金屬漸層電極、倒 U 鹽橋、白底電壓表（只有刻度線、沒有數字）、電子藍球（成對）、杯內與鹽橋裡只畫 ± 小圓點、黃色虛線發亮提示。
 *
 * ── 實驗（學生自己改條件，立刻看到結果；按鈕＋點畫面上發亮的零件，兩種方式都能做）──
 *   左杯固定：鋅片＋硫酸鋅溶液。右杯電極〔鋅〕〔銅〕：選銅＝右杯換成硫酸銅溶液＋銅片，選鋅＝硫酸鋅溶液＋鋅片（換杯動畫）。
 *   〔拔掉導線／接上導線〕：右導線夾頭真的抬起留缺口。〔拿掉鹽橋／裝上鹽橋〕：鹽橋抬起放到桌邊，或從桌邊飛回、自己落下。
 *   右欄「電池的條件」即時打勾／打叉：兩種不同的金屬／電解質／兩極隔開（鹽橋連通）／閉合迴路；沒過的那一列（和裝置上對應的部位）發紅。
 *   一開始（activate）＝兩片鋅、導線接上、鹽橋裝上：指針不動，只有「兩種不同的金屬」打叉。
 *
 * ── 模型（只有「偏轉／不動」的質性區別，不寫任何數值；和 lab_cell 同一套）──
 *   drive ＝ 右杯是銅 ? 1 : 0；closed ＝ 導線接上、不在換杯途中。電荷失衡 q（0～1）：電流 f ＝ closed·drive·(1 − q)。
 *   沒有鹽橋時 dq/dt ＝ KQ·f（兩杯電荷失去平衡 → 指針擺一下就回到 0，和教學動畫一致）；有鹽橋時 dq/dt ＝ −KB·q；
 *   斷路（拔線、換杯）時 dq/dt ＝ −KR·q（回穩，所以沒鹽橋時每次重新接上都會再擺一下）。
 *   電壓表指針：阻尼彈簧追目標 f（ω＝9 rad/s、ζ＝0.5，零點有擋針）。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y≈58 一句提示（黃／青）。外導線 y=130；電壓表中心 (320,130)、124×74（電子從表後面通過）；y=104「外導線」「電壓表」。
 *   左杯 x 24–264、右杯 x 376–616；杯口 y=240、液面 y=300、杯底 y=470；電極 Zn x=70、右電極 x=570，y 190–445。
 *   鹽橋：倒 U，兩腳 x=236／404、外緣頂 y=181、管口 y=438；「鹽橋」寫在兩杯之間 y≈330。電極名稱 y=212、溶液名稱 y≈270。
 *   右欄 x 636–988、y 92–468：電池的條件（4 列）＋電壓表指針結果。桌面 y≈474；y 500–590 左下：拿掉的鹽橋放這裡；右邊圖例。
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
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 幾何 ─────────
  const CAP_Y = 58;
  const MX = 320, WY = 130, MW = 124, MH = 74, MPIV = { x: MX, y: WY + 22 }, NEEDLE = 40, MR = 46;
  const BRIM = 240, BBOT = 470, LIQ = 300, TABLE_Y = 474;
  const CUPF = [{ x0: 24, x1: 264, top: BRIM, bot: BBOT }, { x0: 376, x1: 616, top: BRIM, bot: BBOT }];
  const EX = [70, 570], EW = 36, ETOP = 190, EBOT = 445, EH = EBOT - ETOP;
  const BLX = 236, BRX = 404, BCY = 222, BR = 24, BBY = 438, T_OUT = 17, T_IN = 12, BTOP = BCY - BR - T_OUT, BMID = (BLX + BRX) / 2;
  const HOVER = -150;                                            // 鹽橋抬起：管口離開溶液（電壓表畫在它前面）
  const LIFT = 34;                                               // 拔線時導線夾頭抬起的高度（真的留缺口）
  const SINK = 30;                                               // 換杯：舊杯沉下淡出、新杯浮上淡入
  const TRAY_BRIDGE = { x: 72, y: 504, s: 0.3 };                 // 拿掉的鹽橋放在左下桌邊
  const PX = 636, PY = 92, PW = 352, PH = 376;                   // 右欄「電池的條件」
  const KQ = 7, KB = 2.5, KR = 1.5, V_F = 300, SP_F = 170, GAP = 24;
  // 杯內離子（± 小圓點，只在溶液裡擺動）；右杯以 x=320 鏡射
  const ION_L = [[112, 334, 0], [153, 334, 1], [194, 334, 0], [112, 376, 1], [194, 376, 1], [112, 418, 0], [153, 418, 1], [194, 418, 0]];
  const ION_R = ION_L.map(([x, y, k]) => [640 - x, y + (k ? 4 : -4), 1 - k]);

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
  // 窄空間的標籤：一行塞得下就一行，否則依字拆兩行（中心在 y）
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
  const EPATH = mkPath([{ x: EX[0], y: 284 }, { x: EX[0], y: WY }, { x: EX[1], y: WY }, { x: EX[1], y: 284 }]);
  const wirePts = (i, lift) => i === 0
    ? [{ x: MX - MW / 2, y: WY }, { x: EX[0], y: WY }, { x: EX[0], y: ETOP - 2 - lift }]
    : [{ x: MX + MW / 2, y: WY }, { x: EX[1], y: WY }, { x: EX[1], y: ETOP - 2 - lift }];

  // ───────── 狀態 ─────────
  // right／wire／bridge 是「學生選的設定」（按下就改）；畫面與電路由 tween 進度決定（換杯、拔線、鹽橋移動途中）。
  const S = {};
  function resetState() {
    Object.assign(S, { right: 'zn', wire: true, bridge: true, q: 0, f: 0, nk: 0, nv: 0, eD: 0, t: 0, bc: 1, tw: null, actions: 0 });
  }
  resetState();
  const R0 = { raf: 0, timer: 0, last: 0, on: false };
  let cv = null, ctrl = null, res = null, lastRes = '', ctrlSig = '', targetsNow = [];

  function twP() { return S.tw ? clamp((S.t - S.tw.t0) / S.tw.dur, 0, 1) : 1; }
  function twIs(k) { return !!(S.tw && S.tw.key === k); }
  const busy = () => !!S.tw;
  function conds() {
    return { metal: S.right === 'cu', electrolyte: true, apart: S.bridge, closed: S.wire };
  }
  function failList() { const c = conds(); return ['metal', 'electrolyte', 'apart', 'closed'].filter(k => !c[k]); }
  function isClosed() { return S.wire && !twIs('plug') && !twIs('swap'); }

  // ───────── 圖形：燒杯、溶液、電極（與 lab_cell 同一畫法） ─────────
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

  // ───────── 圖形：離子、電子、導線、電壓表 ─────────
  function ionDot(x, y, kind, al, r) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = kind ? K.neg : K.pos;
    ctx.beginPath(); ctx.arc(x, y, r || 5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function cupIons(i) {
    (i ? ION_R : ION_L).forEach(([x, y, kind], k) => {
      const j = k + i * 9;
      ionDot(x + 5 * Math.sin(S.t * 1.7 + j * 1.31), y + 4 * Math.sin(S.t * 2.3 + j * 2.07), kind, 1);
    });
  }
  function ball(x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function wireLine(pts) {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(pts); ctx.stroke(); });
    ctx.restore();
  }
  function wireEnd(x, y) {
    ctx.save(); ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(x - 7, y - 6, 14, 10, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function gapMark(x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function meter(k) {
    ctx.save();
    ctx.fillStyle = '#3a4a44';                                     // 兩側接線柱
    rrect(MX - MW / 2 - 8, WY - 7, 12, 14, 3); ctx.fill(); rrect(MX + MW / 2 - 4, WY - 7, 12, 14, 3); ctx.fill();
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -65 * RAD, a1 = 65 * RAD;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, MR, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? MR - 5 : MR - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + MR * Math.cos(a), MPIV.y + MR * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-58, 30, k) * RAD - Math.PI / 2;             // 零點在左，偏轉到右
    ctx.strokeStyle = '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text('V', MX + 44, WY + 22, '#2b3a34', 22, 'center', 1, true);
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

  // ───────── 鹽橋 ─────────
  function bridgeAt(tf, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.translate(tf.x, tf.y); ctx.scale(tf.s, tf.s); ctx.translate(-BMID, -BTOP);
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = T_OUT * 2 + 4; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.glass; ctx.lineWidth = T_OUT * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = K.bg; ctx.lineWidth = T_IN * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,238,242,0.13)'; ctx.lineWidth = T_IN * 2; strokePts(TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = 2; strokePts(lanePts(-T_IN + 3)); ctx.stroke();
    // 管內離子：± 小圓點，只原地擺動（不畫方向；鹽橋細節在下一分頁「鋅銅電池與鹽橋」）
    BRIDGE_IONS.forEach(([s0, kind], k) => {
      const p = at(TUBE_P, s0 + 3 * Math.sin(S.t * 2.1 + k * 1.7));
      ionDot(p.x, p.y, kind, clamp((TUBE_P.L - s0) / 14, 0, 1), 6);
    });
    ctx.restore();
  }
  const bridgeTf = dy => ({ x: BMID, y: BTOP + dy, s: 1 });
  function flyTf(a, b, k) { return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - 60 * Math.sin(Math.PI * k), s: lerp(a.s, b.s, k) }; }
  function ghostBridge(color, al, glow) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.lineJoin = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineDashOffset = -S.t * 24; }
    strokePts(lanePts(-T_OUT + 2)); ctx.stroke(); strokePts(lanePts(T_OUT - 2)); ctx.stroke();
    ctx.restore();
  }
  // 鹽橋在哪：dy＝相對定位的位移（null＝不在杯子上方）、fly＝飛行中的變換、bc＝管口泡進溶液的程度（0～1）
  function bridgeMotion() {
    const p = twP();
    let dy = null, fly = null;
    if (twIs('bridgeIn')) {
      if (p < 0.5) fly = flyTf(TRAY_BRIDGE, bridgeTf(HOVER), ease(p / 0.5));
      else { const u = clamp((p - 0.5) / 0.35, 0, 1); dy = HOVER * (1 - u * u); if (p > 0.85) dy = -6 * Math.sin(Math.PI * (p - 0.85) / 0.15); }
    } else if (twIs('bridgeOut')) {
      if (p < 0.6) dy = HOVER * ease(p / 0.6);
      else fly = flyTf(bridgeTf(HOVER), TRAY_BRIDGE, ease((p - 0.6) / 0.4));
    } else if (S.bridge) dy = 0;
    const settled = dy === 0 && !twIs('bridgeIn') && !twIs('bridgeOut');
    const bc = dy === null ? 0 : clamp((BBY + dy - LIQ) / (BBY - LIQ), 0, 1);
    return { dy, fly, bc, settled };
  }
  const bridgeParked = () => !S.bridge && !twIs('bridgeOut');

  // ───────── 右杯（換杯時：舊杯沉下淡出、新杯浮上淡入） ─────────
  function rightGroups() {
    if (!twIs('swap')) return [{ k: S.right, dy: 0, a: 1 }];
    const p = twP(), d = S.tw.data, u = ease(p / 0.45), v = ease((p - 0.55) / 0.45);
    return [{ k: d.from, dy: SINK * u, a: 1 - u }, { k: d.to, dy: SINK * (1 - v), a: v }].filter(g => g.a > 0.01);
  }
  function cupDo(i, fn) {                                         // 對第 i 杯的每一組（換杯時有兩組）各畫一次
    const G = i ? rightGroups() : [{ k: 'zn', dy: 0, a: 1 }];
    G.forEach(g => { ctx.save(); ctx.globalAlpha *= g.a; ctx.translate(0, g.dy); fn(g.k, g); ctx.restore(); });
  }
  function rightLift() {
    const p = twP();
    if (twIs('swap')) return S.wire ? LIFT * (p < 0.5 ? ease(p / 0.15) : 1 - ease((p - 0.85) / 0.15)) : LIFT;
    if (twIs('pull')) return LIFT * ease(p);
    if (twIs('plug')) return LIFT * (1 - ease(p));
    return S.wire ? 0 : LIFT;
  }

  // ───────── 可以點的目標（同時決定哪裡發亮；沒過的條件發紅） ─────────
  function computeTargets() {
    const out = [];
    if (busy()) return out;
    const c = conds(), lift = rightLift();
    out.push({ r: [EX[1] - 26, ETOP - 2 - lift - 22, EX[1] + 26, ETOP + 14], key: 'tWire', shape: 'wireEnd', bad: !c.closed });
    out.push({ r: [EX[1] - 28, ETOP + 18, EX[1] + 28, EBOT + 6], key: 'swapEl', shape: 'el', bad: !c.metal });
    if (S.bridge) out.push({ r: [BLX - 30, BTOP - 6, BRX + 30, BTOP + 56], key: 'tBridge', shape: 'tubeTop', bad: false });
    else {
      out.push({ r: [BLX - 30, BTOP - 6, BRX + 30, BBY + 6], key: 'tBridge', shape: 'ghost', bad: true });
      out.push({ r: [TRAY_BRIDGE.x - 40, TRAY_BRIDGE.y - 8, TRAY_BRIDGE.x + 40, TRAY_BRIDGE.y + 86], key: 'tBridge', shape: 'tray', bad: false });
    }
    return out;
  }
  function drawGlow(tg) {
    const color = tg.bad ? K.red : K.yellow;
    const pulse = tg.bad ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(S.t * 4.2)) : 0.32 + 0.12 * Math.sin(S.t * 3);
    if (tg.shape === 'ghost') { ghostBridge(color, pulse, true); return; }
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = color; ctx.shadowBlur = tg.bad ? 10 : 4; ctx.lineJoin = 'round';
    const [x0, y0, x1, y1] = tg.r, sh = tg.shape;
    if (sh === 'wireEnd') { ctx.beginPath(); ctx.arc(EX[1], ETOP - 4 - rightLift(), 19, 0, TAU); ctx.stroke(); }
    else if (sh === 'tubeTop') {
      const o = T_OUT + 6;
      ctx.beginPath(); ctx.moveTo(BLX - o, BCY + 20); ctx.lineTo(BLX - o, BCY);
      ctx.arc(BLX + BR, BCY, BR + o, Math.PI, Math.PI * 1.5); ctx.lineTo(BRX - BR, BTOP - 6); ctx.arc(BRX - BR, BCY, BR + o, -Math.PI / 2, 0); ctx.lineTo(BRX + o, BCY + 20); ctx.stroke();
    } else if (sh === 'el') { rrect(EX[1] - EW / 2 - 6, ETOP - 8, EW + 12, EH + 14, 8); ctx.stroke(); }
    else { rrect(x0, y0, x1 - x0, y1 - y0, 12); ctx.stroke(); }
    ctx.restore();
  }
  function badLeftElectrode() {                                   // 兩片相同金屬：左邊的鋅片也一起框紅
    if (busy() || conds().metal) return;
    ctx.save(); ctx.globalAlpha = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(S.t * 4.2)); ctx.strokeStyle = K.red; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = K.red; ctx.shadowBlur = 10;
    rrect(EX[0] - EW / 2 - 6, ETOP - 8, EW + 12, EH + 14, 8); ctx.stroke(); ctx.restore();
  }

  // ───────── 右欄：電池的條件 ─────────
  const COND_L = {
    metal: ['兩種不同的金屬', 'Two different metals'],
    electrolyte: ['電解質（兩杯溶液）', 'Electrolyte (both cups)'],
    apart: ['兩極隔開（鹽橋連通）', 'Kept apart (salt bridge)'],
    closed: ['閉合迴路（導線接上）', 'Closed circuit (wires on)']
  };
  function drawConds() {
    ctx.save(); ctx.fillStyle = 'rgba(18,51,41,0.72)'; ctx.strokeStyle = 'rgba(159,179,170,0.3)'; ctx.lineWidth = 2;
    rrect(PX, PY, PW, PH, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    text(T('電池的條件', 'What a battery needs'), PX + 18, PY + 28, K.yellow, 26, 'left');
    const c = conds(), keys = ['metal', 'electrolyte', 'apart', 'closed'], tx = PX + 50, maxW = PW - 50 - 12;
    const pend = twIs('swap');
    let z = 24, lh = 30, gap = 16;
    const lines = z0 => keys.map(k => wrap(T(COND_L[k][0], COND_L[k][1]), maxW, z0));
    let L = lines(z);
    const need = () => L.reduce((a, ls) => a + ls.length * lh, 0) + gap * 3;
    const nl = A => A.reduce((a, ls) => a + ls.length, 0), L22 = lines(22);
    if (need() > 216 || nl(L22) < nl(L)) { z = 22; lh = 27; L = L22; }   // 22px 能少換行就用 22px（不低於 22）
    if (need() > 216) gap = 8;
    let y = PY + 78;
    const blink = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(S.t * 4.2));
    keys.forEach((k, n) => {
      const ok = c[k], ls = L[n], hgt = ls.length * lh;
      if (!ok) {
        ctx.save(); ctx.globalAlpha = pend ? 0.4 : blink; ctx.fillStyle = 'rgba(255,107,90,0.12)'; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
        rrect(PX + 8, y - lh / 2 - 5, PW - 16, hgt + 10, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      mark(ok, PX + 30, y, pend && k === 'metal' ? 0.4 : 1);
      ls.forEach((l, j) => text(l, tx, y + j * lh, ok ? K.white : K.red, z, 'left', pend && k === 'metal' ? 0.5 : 1));
      y += hgt + gap;
    });
    // 結果：電壓表指針
    const yr = PY + PH - 62;
    ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PX + 16, yr - 22); ctx.lineTo(PX + PW - 16, yr - 22); ctx.stroke(); ctx.restore();
    const moving = S.nk > 0.06;
    const allOk = !failList().length && !busy();
    text(T('電壓表指針', 'Needle'), PX + 18, yr + 6, K.muted, 22, 'left');
    const rs = pend ? T('換杯中…', 'swapping…') : allOk ? T('偏轉', 'swings') : moving ? T('擺一下…', 'a little…') : T('不動', 'still');
    const rc = pend ? K.muted : allOk ? K.green : moving ? K.cyan : K.red;
    text(rs, PX + PW - 18, yr + 6, rc, 28, 'right');
  }

  // ───────── 圖例、拿掉的鹽橋、提示 ─────────
  function drawTable() {
    ctx.save();
    const g = ctx.createLinearGradient(0, TABLE_Y, 0, TABLE_Y + 12);
    g.addColorStop(0, '#3b5a4f'); g.addColorStop(1, '#1b332c');
    ctx.fillStyle = g; rrect(10, TABLE_Y, 620, 12, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, TABLE_Y + 0.5); ctx.lineTo(626, TABLE_Y + 0.5); ctx.stroke();
    ctx.restore();
  }
  function drawLegend() {
    const items = [[T('藍球 e⁻＝電子（只走金屬與導線）', 'Blue ball e⁻ = electron (metal and wire only)'), 'b', 522],
      [T('橘＝正離子、紫＝負離子（只在溶液與鹽橋）', 'Orange/purple = +/− ion (solution and bridge only)'), 'i', 564]];
    items.forEach(([s, kind, y]) => {
      const x = 270;
      if (kind === 'b') ball(x + 14, y, 7, 1);
      else { ctx.save(); ctx.fillStyle = K.pos; ctx.beginPath(); ctx.arc(x + 7, y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = K.neg; ctx.beginPath(); ctx.arc(x + 23, y, 6, 0, TAU); ctx.fill(); ctx.restore(); }
      text(s, x + 42, y, K.white, 22, 'left');
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
    if (twIs('swap')) return 'swap';
    if (twIs('bridgeIn') || twIs('bridgeOut')) return 'bridgeMove';
    const F = failList();
    if (!F.length) return 'ok';
    if (F.length > 1) return 'multi';
    if (F[0] === 'metal') return 'metal';
    if (F[0] === 'closed') return 'wire';
    return S.nk > 0.06 || S.f > 0.03 ? 'nob' : 'nob0';
  }
  const Y = s => `<span class="accent-yellow">${s}</span>`;
  const MSG = {
    ok: [['四個條件都有：電子從鋅經導線流到銅，指針偏轉！', 'All four conditions: e⁻ go from Zn through the wire to Cu, the needle swings!'],
      [`兩種不同的金屬、電解質、兩極隔開（鹽橋連通）、閉合迴路${Y('四個條件都有')}：電子從鋅經外導線流向銅，電壓表指針偏轉。`,
        `Two different metals, an electrolyte, electrodes kept apart (joined by a salt bridge) and a closed circuit — ${Y('all four')}: electrons flow from zinc through the outer wire to copper, and the needle swings.`]],
    metal: [['兩片相同的金屬：沒有足夠差異，指針不動', 'Two identical metals: not different enough, the needle stays still'],
      [`兩片相同的金屬：${Y('沒有足夠差異')}，無法維持持續電流，指針不動。`, `Two identical metals are ${Y('not different enough')} to keep a steady current, so the needle stays still.`]],
    wire: [['導線拔掉：迴路斷開，指針不動', 'Wire unplugged: the circuit is open, the needle stays still'],
      [`導線拔掉了：${Y('迴路斷開')}，電子沒有路走，指針不動。`, `The wire is unplugged: the ${Y('circuit is open')}, the electrons have no path, so the needle stays still.`]],
    nob: [['沒有鹽橋：兩杯不通，指針擺一下就回到 0', 'No salt bridge: the cups are not joined, the needle swings, then back to 0'],
      [`沒有鹽橋：兩杯之間沒有通路，兩杯電荷失去平衡、反應很快停止，指針${Y('擺一下就回到 0')}。`,
        `No salt bridge: there is no path between the cups, they lose charge balance and the reaction soon stops, so the needle ${Y('swings a little, then goes back to 0')}.`]],
    nob0: [['沒有鹽橋：兩杯不通，指針不動', 'No salt bridge: the cups are not joined, the needle stays still'],
      [`沒有鹽橋：兩杯之間${Y('沒有通路')}，電流很快就停了，指針不動。`, `No salt bridge: there is ${Y('no path')} between the cups, the current soon stops, so the needle stays still.`]],
    swap: [['換杯中…電極換了，溶液也跟著換', 'Swapping the cup… new electrode, matching solution'],
      ['換杯中……右杯的電極換了，溶液也跟著換成配套的。', 'Swapping… when the right electrode changes, its solution changes to match.']],
    bridgeMove: [['鹽橋移動中…', 'Moving the salt bridge…'], ['鹽橋移動中……看看指針。', 'Moving the salt bridge… watch the needle.']]
  };
  function multiText(cap) {
    const F = failList(), names = F.map(k => T(COND_L[k][0], COND_L[k][1]));
    const n = F.length;
    if (cap) return T(`還差 ${n} 個條件：指針不動`, `${n} conditions missing: the needle stays still`);
    return T(`還差 ${n} 個條件（${names.join('、')}）：指針不動。`, `${n} conditions are missing (${names.join('; ')}), so the needle stays still.`);
  }
  function caption() { const k = msgKey(); if (k === 'multi') return multiText(true); const m = MSG[k]; return T(m[0][0], m[0][1]); }
  function captionColor() { const k = msgKey(); return k === 'ok' ? K.yellow : k === 'swap' || k === 'bridgeMove' ? K.white : K.cyan; }
  function resultHTML() { const k = msgKey(); if (k === 'multi') return multiText(false); const m = MSG[k]; return T(m[1][0], m[1][1]); }
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
    drawTable();
    // 背景層：燒杯、電極、溶液、液面
    [0, 1].forEach(i => cupDo(i, kind => { beakerBack(CUPF[i]); electrode(EX[i], kind); liquid(CUPF[i], SOL[kind]); cupIons(i); surface(CUPF[i]); }));
    // 鹽橋（預留虛線／實體）
    const BM = bridgeMotion();
    if (BM.dy !== null) bridgeAt(bridgeTf(BM.dy), 1);
    [0, 1].forEach(i => cupDo(i, () => beakerFront(CUPF[i])));
    // 外導線、電子、電壓表
    const lift = rightLift();
    wireLine(wirePts(0, 0)); wireEnd(EX[0], ETOP - 2);
    const rp = wirePts(1, lift); wireLine(rp); wireEnd(rp[2].x, rp[2].y);
    const gapA = clamp((lift - 14) / 12, 0, 1) * (twIs('swap') ? 0 : 1);
    gapMark(EX[1], (rp[2].y + ETOP - 6) / 2, gapA);
    drawElectrons();
    meter(S.nk);
    // 標註
    text(T('外導線', 'Outer wire'), (EX[0] + MX - MW / 2) / 2, 104, K.white, 22);
    text(T('電壓表', 'Voltmeter'), (MX + MW / 2 + EX[1]) / 2, 104, K.white, 22);
    text(T('鋅 Zn', 'Zn plate'), EX[0] + EW / 2 + 12, 212, K.znHi, 22, 'left');
    cupDo(1, kind => text(kind === 'cu' ? T('銅 Cu', 'Cu plate') : T('鋅 Zn', 'Zn plate'), EX[1] - EW / 2 - 10, 212, kind === 'cu' ? K.cuHi : K.znHi, 22, 'right'));
    [0, 1].forEach(i => cupDo(i, kind => {
      const cx = i ? 487 : 153;
      label2(kind === 'cu' ? T('硫酸銅溶液', 'CuSO₄ solution') : T('硫酸鋅溶液', 'ZnSO₄ solution'), cx, 270, 124, kind === 'cu' ? K.cyan : K.muted, 1);
    }));
    if (gapA > 0.01) text(T('斷開', 'Open'), EX[1] - 24, 166, K.red, 22, 'right', gapA);
    if (BM.settled) label2(T('鹽橋', 'Salt bridge'), BMID, 330, 100, K.white, 1);
    else if (bridgeParked() && !twIs('bridgeIn')) label2(T('沒有鹽橋', 'No bridge'), BMID, 330, 100, K.red, 1);
    // 拿掉的鹽橋放在桌邊
    if (bridgeParked() && !twIs('bridgeIn')) {
      bridgeAt(TRAY_BRIDGE, 1);
      label2(T('拿掉的鹽橋', 'Removed bridge'), TRAY_BRIDGE.x + 44, 542, 140, K.muted, 1, 'left');
    }
    drawLegend();
    drawConds();
    if (BM.fly) bridgeAt(BM.fly, 1);                              // 飛行中的鹽橋畫在最上層
    badLeftElectrode();
    targetsNow = computeTargets();
    targetsNow.forEach(drawGlow);
    drawCaption(caption(), captionColor());
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
        ball(p.x, p.y, 7, fade * al);
      });
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt;
    const tw = S.tw;
    if (tw) {
      if (tw.key === 'swap' && twP() >= 0.5 && !tw.data.mid) { tw.data.mid = true; S.q = 0; }
      if (S.t - tw.t0 >= tw.dur) { S.tw = null; if (tw.done) tw.done(); refreshUI(); }
    }
    const closed = isClosed(), drive = S.right === 'cu' && !twIs('swap') ? 1 : 0;
    const bc = bridgeMotion().bc;
    const f = closed && drive ? clamp(1 - S.q, 0, 1) : 0;
    if (closed && drive) S.q = Math.min(1, S.q + KQ * f * (1 - bc) * dt);
    S.q = Math.max(0, S.q - S.q * KB * bc * dt);
    if (!closed) S.q = Math.max(0, S.q - S.q * KR * dt);           // 斷路時兩杯的電荷慢慢回穩（重新接上才會再擺一下）
    S.bc = bc;
    S.f = f < 1e-4 ? 0 : f;
    S.eD += V_F * S.f * dt;
    // 電壓表：阻尼彈簧（零點擋針）
    const om = 9, z = 0.5;
    let h = dt;
    while (h > 1e-6) {
      const q = Math.min(0.008, h); h -= q;
      S.nv += (om * om * (S.f - S.nk) - 2 * z * om * S.nv) * q; S.nk += S.nv * q;
      if (S.nk < -0.02) { S.nk = -0.02; if (S.nv < 0) S.nv = 0; }
    }
  }

  // ───────── 操作 ─────────
  function tween(key, dur, data, done) { S.tw = { key, t0: S.t, dur, data: data || {}, done }; refreshUI(); }
  function can(key) {
    if (key === 'reset') return true;
    if (busy()) return false;
    if (key === 'zn') return S.right !== 'zn';
    if (key === 'cu') return S.right !== 'cu';
    return key === 'tWire' || key === 'tBridge' || key === 'swapEl';
  }
  function act(key) {
    if (!can(key)) return;
    S.actions++;
    if (key === 'swapEl') key = S.right === 'cu' ? 'zn' : 'cu';
    switch (key) {
      case 'reset': resetState(); break;
      case 'zn': case 'cu': { const from = S.right; S.right = key; tween('swap', 1.8, { from, to: key }); break; }
      case 'tWire':
        if (S.wire) { S.wire = false; tween('pull', 0.35); }
        else { S.wire = true; tween('plug', 0.4); }
        break;
      case 'tBridge':
        if (S.bridge) { S.bridge = false; tween('bridgeOut', 2.4); }
        else { S.bridge = true; tween('bridgeIn', 1.7); }
        break;
    }
    refreshUI();
    if (!R0.raf) render();
  }

  // ───────── 控制鈕 ─────────
  function ctrlSpec() {
    return [
      [T('右杯電極', 'Right electrode'), [['zn', T('鋅', 'Zinc')], ['cu', T('銅', 'Copper')]]],
      [T('改條件', 'Change'), [
        ['tWire', S.wire ? T('拔掉導線', 'Unplug wire') : T('接上導線', 'Connect wire')],
        ['tBridge', S.bridge ? T('拿掉鹽橋', 'Remove bridge') : T('裝上鹽橋', 'Add bridge')],
        ['reset', T('重來', 'Start over')]]]
    ];
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
      const on = (k === 'zn' || k === 'cu') && S.right === k;
      b.disabled = !ok; b.style.opacity = ok || on ? '1' : '0.42'; b.style.cursor = ok ? 'pointer' : 'default';
      if (k === 'zn' || k === 'cu') { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('active', on); }
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', T('兩種金屬發電實驗台：選右杯電極、拔插導線、拿掉或裝上鹽橋，看電壓表與電池條件清單；目前：', 'Two-metal bench: choose the right electrode, unplug the wire or remove the salt bridge, and watch the voltmeter and the checklist. Now: ') + caption());
  }

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
    cv = document.getElementById('originLabCanvas');
    if (!cv) return;
    ctrl = document.getElementById('originLabControls');
    if (!ctrl) {
      ctrl = document.createElement('div'); ctrl.id = 'originLabControls'; ctrl.className = 'lab-controls';
      const host = cv.parentElement && cv.parentElement.classList.contains('canvas-wrap') ? cv.parentElement : cv;
      host.insertAdjacentElement('afterend', ctrl);
    }
    res = document.getElementById('originLabResult');
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
      right: S.right, wire: S.wire, bridge: S.bridge, conds: conds(), fails: failList(), sub: msgKey(),
      busy: busy(), tween: S.tw ? S.tw.key : null, closed: isClosed(), flow: +S.f.toFixed(3), imbalance: +S.q.toFixed(3),
      bridgeContact: +S.bc.toFixed(3), needle: +(S.nk * 88).toFixed(2), needleK: +S.nk.toFixed(3),
      targets: targetsNow.map(t => ({ key: t.key, shape: t.shape, bad: t.bad, r: t.r.map(v => Math.round(v)) })),
      caption: caption(), running: !!R0.raf, on: R0.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  window.GbLab.origin = { activate, deactivate, relang, _state };
})();
