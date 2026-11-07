/* electrolysis_5_intro_1107_v1.js — 「純水為什麼不導電？」分頁動畫（#introAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.ElAnim.intro = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'intro'。畫布不綁事件；唯一控制是 #steps-intro 的 5 個步驟鈕；結果框 #introAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的變數）。
 * 畫面是「場景時間 t 的純函式」：水分子、NaOH 顆粒、離子、電子、指針都只由 t 算出。
 * 畫風沿用 galvanic_batteries_4 的 redox／cell（黑板底、離子膠囊深色字、電子藍球、金屬漸層）。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步標題（黃）。燒杯 x 95–565，杯口 y=240、液面 y=272、杯底 y=474。
 *   兩支電極：負極端 x=170、正極端 x=490（寬 34，y 165–440）。
 *   外導線 y=118：負極端 → 電池（短粗＝負極 x=242、長細＝正極 x=258）→ 安培計（x=375）→ 正極端。
 *   右欄 x 650–980：本步重點與名詞；y≈506/536：本步一句（黃）；y≈574：圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只畫在導線與電極裡，從不進溶液；從電池負極出發 → 負極端；正極端 → 導線 → 電池正極。
 *   橘膠囊＝陽離子 Na⁺、紫膠囊＝陰離子 OH⁻，只在溶液裡。電極表面只標「會發生反應」，不畫任何產物或氣泡。
 *   第 5 步銅原子離開只是預告（示意），不演出完整反應。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 純水      8 s  電子被推到負極端碳棒就停住；水裡只有水分子；溶液中央紅叉「過不去」；安培計 0
 *   2 加電解質  9 s  （電路壓暗）NaOH 顆粒落入、解離成 Na⁺／OH⁻，自由游走；NaOH → Na⁺ ＋ OH⁻
 *   3 離子導電  9 s  通電：電子走導線、離子走溶液（Na⁺ 往負極端、OH⁻ 往正極端）；指針偏轉；電極表面發亮＋一句標示
 *   4 惰性電極  8 s  兩支碳棒外加虛線框：大小、顏色從頭到尾不變；只傳遞電子
 *   5 活性電極  8 s  正極端換成銅片；兩個銅原子示意離開；結尾帶出電解水、電解硫酸銅
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
    muted: '#9fb3aa', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const swing = u => (u <= 0 ? 0 : 1 - Math.exp(-u * 5) * Math.cos(u * 9));

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
  const BX0 = 95, BX1 = 565, BRIM = 240, BBOT = 474, LIQ = 272;
  const NX = 170, PX = 490, EW = 34, ETOP = 165, EBOT = 440;         // 負極端、正極端
  const NS = NX + EW / 2, PS = PX - EW / 2;                            // 面向溶液的表面 x
  const WY = 118;                                                      // 外導線
  const BN = 242, BP = 258, BATX = 250;                                // 電池：短粗＝負極、長細＝正極
  const MX = 375, MW = 110, MH = 64, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 32;   // 安培計
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 420 }]);    // 電池負極 → 負極端
  const E_R = mkPath([{ x: PX, y: 420 }, { x: PX, y: WY }, { x: BP, y: WY }]);    // 正極端 → 電池正極
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 650, RW = 330, RC = RX + RW / 2;                          // 右欄
  // 水分子（示意）
  const WATER = [{ x: 250, y: 300 }, { x: 124, y: 360 }, { x: 420, y: 322 }, { x: 300, y: 446 }, { x: 398, y: 420 },
    { x: 532, y: 300 }, { x: 534, y: 418 }, { x: 214, y: 400 }, { x: 124, y: 440 }];
  // NaOH：4 顆，每顆解離成一對 Na⁺（上）／OH⁻（下）
  const PAIRS = [{ x: 235, na: 304, oh: 350 }, { x: 300, na: 396, oh: 442 }, { x: 365, na: 304, oh: 350 }, { x: 430, na: 396, oh: 442 }];
  const CU_ATOMS = [{ y: 304, t0: 3.0 }, { y: 396, t0: 4.0 }];
  const ATOM_R = 19;

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['純水', 'Pure water'],
      cap: ['純水：電子到了負極端就過不去', 'Pure water: electrons reach the (−) side and stop'],
      bot: ['純水幾乎不解離，沒有自由離子，無法導電', 'Pure water barely dissociates: no free ions, no conduction'],
      res: ['純水幾乎不解離，沒有自由離子，無法導電：電子被電池推到負極端碳棒就停住，過不去，安培計指針停在 0。',
        'Pure water barely dissociates, so it has no free ions and cannot conduct: electrons pushed by the battery stop in the (−) side carbon rod, and the ammeter needle stays at 0.'] },
    { dur: 9, b: ['加電解質', 'Electrolyte'],
      cap: ['加入電解質：NaOH 解離成 Na⁺ 與 OH⁻', 'Add an electrolyte: NaOH dissociates into Na⁺ and OH⁻'],
      bot: ['電解質溶於水，解離出可以自由移動的陰陽離子', 'An electrolyte in water dissociates into freely moving ions'],
      res: ['電解質解離出自由離子：NaOH 溶在水裡，解離成陽離子 Na⁺ 與陰離子 OH⁻，它們可以在水裡自由移動。',
        'An electrolyte dissociates into free ions: NaOH dissolves in water and splits into cations Na⁺ and anions OH⁻, which move freely in the water.'] },
    { dur: 9, b: ['離子導電', 'Ions carry'],
      cap: ['通電：電子走導線，離子走溶液', 'Current on: electrons in the wire, ions in the solution'],
      bot: ['有能自由移動的陰陽離子，電流才能通過水溶液', 'Only with freely moving ions can current pass through a solution'],
      res: ['有能自由移動的陰陽離子，電流才能通過水溶液：電子走導線，離子走溶液，Na⁺ 往負極端、OH⁻ 往正極端移動，整圈迴路連通，安培計指針偏轉。',
        'Current can pass through a solution only when it has freely moving cations and anions: electrons travel in the wire, ions in the solution — Na⁺ toward the (−) side, OH⁻ toward the (+) side. The loop is complete and the ammeter needle swings.'] },
    { dur: 8, b: ['惰性電極', 'Inert'],
      cap: ['惰性電極：碳棒只負責傳遞電子', 'Inert electrodes: carbon rods only pass electrons along'],
      bot: ['惰性電極只傳遞電子，本身不參與反應', 'Inert electrodes only pass electrons; they take no part in the reaction'],
      res: ['碳棒、鉑是惰性電極：只負責傳遞電子，本身不參與反應，所以通電前後大小與顏色都不變。',
        'Carbon and platinum are inert electrodes: they only pass electrons along and do not take part in the reaction, so their size and colour stay the same.'] },
    { dur: 8, b: ['活性電極', 'Active'],
      cap: ['活性電極：銅片可能自己溶解', 'Active electrodes: a copper plate may dissolve'],
      bot: ['活性電極可能會自己溶解，參與化學反應！', 'An active electrode may dissolve and take part in the reaction!'],
      res: ['活性電極（如銅片、銀片）可能會自己溶解，參與化學反應！接下來的分頁看電解水、電解硫酸銅，電極到底怎麼反應。',
        'Active electrodes (e.g. copper, silver) may dissolve and take part in the reaction! In the next tabs — electrolysis of water and of copper sulfate — we see how the electrodes react.'] }
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
  function electrode(ctx, x, kind, al) {
    if (al <= 0.01) return;
    const x0 = x - EW / 2, h = EBOT - ETOP;
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.cHi, K.cMid, K.cLo];
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; rrect(ctx, x0, ETOP, EW, h, kind === 'cu' ? 3 : 8); ctx.fill();
    ctx.strokeStyle = kind === 'cu' ? 'rgba(12,30,25,0.7)' : 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 2, LIQ, EW + 4, EBOT - LIQ + 2); ctx.clip();
    ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, x0, ETOP, EW, h, 8); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }
  function outlineBox(ctx, x, al, color) {          // 第 4 步：電極外的虛線框（大小不變）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    rrect(ctx, x - EW / 2 - 6, ETOP - 6, EW + 12, EBOT - ETOP + 12, 10); ctx.stroke(); ctx.restore();
  }
  function surfGlow(ctx, x, dir, al) {              // 電極表面發亮（只表示「會發生反應」，不畫產物）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createLinearGradient(x, 0, x + dir * 16, 0);
    g.addColorStop(0, 'rgba(85,233,255,0.75)'); g.addColorStop(1, 'rgba(85,233,255,0)');
    ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + dir * 16), LIQ + 8, 16, EBOT - LIQ - 12);
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
  function pellet(ctx, x, y, al, sc) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = '#eef2ef'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(x, y, 13 * sc, 8 * sc, 0.2, 0, TAU); ctx.fill(); ctx.restore();
  }
  let HW = { 'Na⁺': 28, 'OH⁻': 28 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {        // kind 0＝陽離子（橘）、1＝陰離子（紫）
    if (al <= 0.01) return;
    const hw = HW[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
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
  function glowPath(ctx, P, al, color) {
    if (al <= 0.01) return;
    const pts = P.pts;
    ctx.save(); ctx.globalAlpha *= al * 0.4; ctx.strokeStyle = color; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.restore();
  }
  function battery(ctx, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 24); ctx.lineTo(BP, WY + 24); ctx.stroke();   // 長細＝正極
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 12); ctx.lineTo(BN, WY + 12); ctx.stroke();   // 短粗＝負極
    ctx.restore();
    text(ctx, '−', BN - 18, WY - 20, K.electron, 28, 'center', al);
    text(ctx, '+', BP + 18, WY - 20, K.pos, 28, 'center', al);
  }
  function meter(ctx, k, al) {
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(ctx, MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -60 * RAD, a1 = 60 * RAD, R = 38;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-56, 30, k) * RAD - Math.PI / 2;            // 零點在左，偏轉到右
    ctx.strokeStyle = k > 0.05 ? '#c0392b' : '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'A', MX + 42, WY + 17, '#1f2a26', 22, 'center', al, true);
  }
  function mark(ctx, kind, x, y, alpha) {           // kind：'ok' 綠勾、'no' 紅叉、'warn' 銅色驚嘆號
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
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

  // ───────── 依時間算出狀態（純函式） ─────────
  // cA：電路（導線、電池、安培計、導線電子）的透明度；needle：安培計 0～1；
  // stuck：第 1 步停在負極端的電子；flow：連續電子流；ions：離子；pel：NaOH 顆粒；swap：正極端 碳→銅
  function ionHome(p, kind) { return { x: PAIRS[p].x, y: kind ? PAIRS[p].oh : PAIRS[p].na }; }
  function driftMax(p, kind) {
    const h = ionHome(p, kind);
    return kind ? Math.min(60, (PS - HW['OH⁻'] - 4) - h.x) : Math.min(60, h.x - (NS + HW['Na⁺'] + 4));
  }
  const V_ION = 11, ION_T0 = 1.4;
  function ionArrive(p, kind) { return ION_T0 + driftMax(p, kind) / V_ION; }
  function state(i, tl) {
    const S = { cA: 1, needle: 0, stuck: [], flow: null, ions: [], pel: [], water: 0.85, h2oLbl: 0, xMark: 0,
      swap: 0, atoms: [], glow: 0, outline: 0, arrows: 0, rings: [], pathGlow: 0 };
    if (i === 0) {
      S.h2oLbl = ease((tl - 0.6) / 0.5);
      // 4 顆電子從電池負極被推進負極端碳棒，然後停住
      for (let k = 0; k < 4; k++) {
        const t0 = 1.0 + 0.5 * k, target = E_L.L - k * 36;
        if (tl < t0) continue;
        const s = Math.min(target, 120 * (tl - t0)), p = at(E_L, s), done = s >= target;
        const jig = done ? 1.6 * Math.sin(tl * 6 + k * 1.7) : 0;
        S.stuck.push({ x: p.x + jig, y: p.y, a: clamp((tl - t0) / 0.25, 0, 1) });
      }
      S.xMark = ease((tl - 4.8) / 0.5);
    } else if (i === 1) {
      S.cA = 0.35; S.water = 0.85 - 0.45 * ease(tl / 1.0); S.h2oLbl = 1 - ease(tl / 0.6);
      for (let k = 0; k < 4; k++) { const p = at(E_L, E_L.L - k * 36); S.stuck.push({ x: p.x, y: p.y, a: 1 }); }
      PAIRS.forEach((P, p) => {
        const Ti = 1.0 + 0.7 * p, ly = (P.na + P.oh) / 2;
        const fall = ease((tl - (Ti - 1.0)) / 1.0);
        const m = ease((tl - Ti - 0.4) / 1.0);                    // 解離進度
        if (tl > Ti - 1.0) S.pel.push({ x: P.x, y: lerp(222, ly, fall * fall), a: clamp((tl - Ti + 1.0) / 0.2, 0, 1) * (1 - m), sc: 1 - 0.5 * m });
        if (m <= 0) return;
        const wob = (k2, ph) => 9 * Math.sin(tl * 1.3 + p * 1.9 + ph) * m;
        [0, 1].forEach(kind => {
          const h = ionHome(p, kind);
          S.ions.push({ x: h.x + wob(kind, kind * 2.4), y: lerp(ly, h.y, m) + 3 * Math.sin(tl * 1.7 + p + kind * 3) * m,
            s: kind ? 'OH⁻' : 'Na⁺', kind, a: clamp((m - 0.5) / 0.3, 0, 1) });
        });
      });
    } else {
      S.water = 0.4;
      const T = i === 2 ? tl : 99;                                // 第 4、5 步＝第 3 步結束的狀態
      S.cA = i === 2 ? 0.35 + 0.65 * ease(tl / 0.8) : 1;
      if (i === 2) for (let k = 0; k < 4; k++) {
        const p = at(E_L, E_L.L - k * 36); S.stuck.push({ x: p.x, y: p.y, a: 1 - ease((tl - 1.0) / 0.6) });
      }
      S.flow = { t: tl, front: i === 2 ? 150 * (tl - 1.0) : 1e9, a: i === 2 ? ease((tl - 1.0) / 0.4) : 1 };
      S.needle = i === 2 ? 0.72 * swing(tl - 1.6) : 0.72;
      PAIRS.forEach((P, p) => [0, 1].forEach(kind => {
        const h = ionHome(p, kind), dm = driftMax(p, kind), d = Math.min(dm, V_ION * Math.max(0, T - ION_T0));
        const arrived = d >= dm - 0.01;
        const jx = arrived ? 1.2 * Math.sin(tl * 3 + p + kind) : 3 * Math.sin(tl * 1.3 + p * 1.9 + kind * 2.4);
        S.ions.push({ x: h.x + (kind ? d : -d) + jx, y: h.y + 3 * Math.sin(tl * 1.7 + p + kind * 3), s: kind ? 'OH⁻' : 'Na⁺', kind, a: 1 });
        if (i === 2) S.rings.push({ x: kind ? PS : NS, y: h.y, age: tl - ionArrive(p, kind), c: K.cyan, r: 10 });
      }));
      S.arrows = i === 2 ? ease((tl - 1.8) / 0.5) : 1;
      S.glow = i === 2 ? ease((tl - 2.6) / 0.6) * (0.65 + 0.35 * Math.sin(tl * 3.2)) : 0.45 + 0.2 * Math.sin(tl * 3.2);
      if (i === 3) { S.outline = ease((tl - 1.0) / 0.5); S.pathGlow = ease((tl - 1.6) / 0.4) * (1 - ease((tl - 3.6) / 0.5)); }
      if (i === 4) {
        S.swap = ease((tl - 0.6) / 1.2);
        CU_ATOMS.forEach((A, k) => {
          const go = ease((tl - A.t0) / 1.4), x0 = PS - 14;
          S.atoms.push({ x: x0 - 40 * go, y: A.y - 10 * go, a: S.swap * (1 - ease((tl - A.t0 - 0.6) / 0.8)), hole: S.swap * ease((tl - A.t0 - 0.3) / 0.6), hx: x0 });
        });
      }
    }
    return S;
  }

  // 連續電子流：E_L（電池負極 → 負極端，末端在碳棒裡淡出）、E_R（正極端 → 電池正極，起點在電極裡淡入）
  function flowE(ctx, f) {
    if (!f || f.a <= 0.01) return;
    const V = 110, sp = 52, d = V * f.t;
    [E_L, E_R].forEach(P => {
      const L = P.L;
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > L || s > f.front) continue;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 26, 0, 1) * clamp((f.front - s) / 20, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * f.a);
      }
    });
  }

  // ───────── 裝置畫面 ─────────
  function apparatus(ctx, i, tl, S) {
    beakerBack(ctx);
    electrode(ctx, NX, 'c', 1);
    electrode(ctx, PX, 'c', 1 - S.swap);
    electrode(ctx, PX, 'cu', S.swap);
    liquid(ctx);
    WATER.forEach((w, k) => waterMol(ctx, w.x + 3 * Math.sin(tl * 1.1 + k * 1.3), w.y + 2 * Math.sin(tl * 1.5 + k * 2.1), S.water));
    if (S.h2oLbl > 0.01) text(ctx, tr('水分子 H₂O', 'H₂O (water)'), WATER[0].x + 22, WATER[0].y, K.white, 22, 'left', S.h2oLbl);
    S.pel.forEach(p => pellet(ctx, p.x, p.y, p.a, p.sc));
    if (i === 1) text(ctx, tr('NaOH（固體）', 'NaOH (solid)'), 332, 208, K.white, 22, 'center', ease(tl / 0.4) * (1 - ease((tl - 3.4) / 0.5)));
    surfGlow(ctx, NS, 1, S.glow); surfGlow(ctx, PS, -1, S.glow * (1 - S.swap * 0.0));
    S.ions.forEach(o => ionPill(ctx, o.x, o.y, o.s, o.kind, o.a));
    S.atoms.forEach(A => { hole(ctx, A.hx, A.y, A.hole); atom(ctx, A.x, A.y, A.a); });
    beakerFront(ctx);
    outlineBox(ctx, NX, S.outline, K.yellow); outlineBox(ctx, PX, S.outline, K.yellow);
    S.rings.forEach(r => ring(ctx, r.x, r.y, r.age, r.c, r.r));
    // 紅叉：純水裡電流過不去
    bigX(ctx, 330, 362, S.xMark);
    text(ctx, tr('過不去', 'No way through'), 330, 404, K.red, 24, 'center', S.xMark);
    // 離子移動方向
    if (S.arrows > 0.01) {
      text(ctx, tr('← Na⁺', '← Na⁺'), 236, 256, K.pos, 22, 'center', S.arrows, true);
      text(ctx, tr('OH⁻ →', 'OH⁻ →'), 424, 256, K.neg, 22, 'center', S.arrows, true);
    }
    // 電路：導線 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w, S.cA));
    glowPath(ctx, E_L, S.pathGlow, K.electron); glowPath(ctx, E_R, S.pathGlow, K.electron);
    S.stuck.forEach(e => ball(ctx, e.x, e.y, 8, e.a * S.cA));
    if (S.flow) { ctx.save(); ctx.globalAlpha = S.cA; flowE(ctx, S.flow); ctx.restore(); }
    battery(ctx, S.cA);
    meter(ctx, S.needle, S.cA);
    text(ctx, tr('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center', S.cA);
    text(ctx, tr('安培計', 'Ammeter'), MX, WY + 56, K.white, 22, 'center', S.cA);
    // 電極標示
    text(ctx, tr('負極端', '(−) side'), NX - EW / 2 - 14, 182, K.electron, 24, 'right');
    text(ctx, tr('碳棒', 'Carbon'), NX - EW / 2 - 14, 212, K.muted, 22, 'right');
    text(ctx, tr('正極端', '(+) side'), PX + EW / 2 + 14, 182, K.pos, 24, 'left');
    text(ctx, tr('碳棒', 'Carbon'), PX + EW / 2 + 14, 212, K.muted, 22, 'left', clamp(1 - 2 * S.swap, 0, 1));
    text(ctx, tr('銅片', 'Copper'), PX + EW / 2 + 14, 212, K.cuHi, 22, 'left', clamp(2 * S.swap - 1, 0, 1));
  }

  // ───────── 右欄 ─────────
  function row(ctx, kind, s, y, color, al, size) {
    mark(ctx, kind, RX + 14, y, al);
    return block(ctx, s, RX + 40, y, RW - 40, color, size || 24, 'left', al);
  }
  function equation(ctx, terms, cx, y, size) {
    const ws = terms.map(g => textW(ctx, g[0], size, true)), tot = ws.reduce((a, b) => a + b, 0);
    let x = cx - tot / 2;
    terms.forEach((g, k) => { text(ctx, g[0], x, y, g[1], size, 'left', g[2], true); x += ws[k]; });
  }
  function pillRow(ctx, s, kind, label, y, al) {
    const hw = HW[s];
    ionPill(ctx, RX + hw, y, s, kind, al);
    return block(ctx, label, RX + 2 * hw + 14, y, RW - 2 * hw - 14, K.white, 22, 'left', al);
  }
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function notes(ctx, i, tl) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y;
    if (i === 0) {
      y = block(ctx, tr('純水 H₂O', 'Pure water H₂O'), RX, 110, RW, K.white, 30, 'left', a(0.4), 38);
      y = block(ctx, tr('幾乎不解離', 'barely dissociates'), RX, y, RW, K.cyan, 24, 'left', a(0.7));
      y = row(ctx, 'no', tr('沒有自由離子', 'No free ions'), y + 18, K.white, a(1.2));
      y = row(ctx, 'no', tr('電子到負極端就停住', 'Electrons stop at the (−) side'), y + 10, K.white, a(4.2));
      y = block(ctx, tr('安培計', 'Ammeter'), RX, y + 22, RW, K.white, 26, 'left', a(5.2), 34);
      y = block(ctx, tr('指示電路是否有電流通過', 'shows whether current flows in the circuit'), RX, y, RW, K.muted, 22, 'left', a(5.4));
      row(ctx, 'no', tr('指針停在 0：沒有電流', 'Needle at 0: no current'), y + 14, K.red, a(5.9));
    } else if (i === 1) {
      y = block(ctx, tr('加入電解質', 'Add an electrolyte'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = block(ctx, tr('例：氫氧化鈉 NaOH', 'e.g. sodium hydroxide, NaOH'), RX, y, RW, K.muted, 22, 'left', a(0.5));
      const T = [['NaOH', K.white, a(1.6)], [' → ', K.white, a(2.4)], ['Na⁺', K.pos, a(2.4)], [' + ', K.white, a(2.4)], ['OH⁻', K.neg, a(2.4)]];
      equation(ctx, T, RC, y + 28, 28);
      y = row(ctx, 'ok', tr('解離出自由離子', 'Dissociates into free ions'), y + 82, K.green, a(3.6));
      y = pillRow(ctx, 'Na⁺', 0, tr('陽離子', 'cation (+)'), y + 22, a(4.4));
      y = pillRow(ctx, 'OH⁻', 1, tr('陰離子', 'anion (−)'), y + 14, a(4.8));
      block(ctx, tr('在水裡自由游走', 'wander freely in the water'), RX, y + 18, RW, K.white, 24, 'left', a(5.4));
    } else if (i === 2) {
      y = block(ctx, tr('電子走導線', 'Electrons: in the wire'), RX, 110, RW, K.electron, 26, 'left', a(0.8), 34);
      y = block(ctx, tr('離子走溶液', 'Ions: in the solution'), RX, y, RW, K.white, 26, 'left', a(1.6), 34);
      y = pillRow(ctx, 'Na⁺', 0, tr('往負極端', 'toward the (−) side'), y + 24, a(1.9));
      y = pillRow(ctx, 'OH⁻', 1, tr('往正極端', 'toward the (+) side'), y + 14, a(2.1));
      y = row(ctx, 'ok', tr('迴路連通，安培計偏轉', 'Loop complete: the needle swings'), y + 22, K.green, a(2.4));
      y = block(ctx, tr('電極表面會發生反應', 'Reactions happen at the electrode surfaces'), RX, y + 22, RW, K.cyan, 24, 'left', a(3.4));
      block(ctx, tr('（後面分頁一個一個看）', '(the next tabs look at them one by one)'), RX, y, RW, K.muted, 22, 'left', a(3.6));
    } else if (i === 3) {
      y = block(ctx, tr('惰性電極', 'Inert electrodes'), RX, 110, RW, K.white, 30, 'left', a(0.4), 38);
      y = block(ctx, tr('碳棒、鉑 ＝ 惰性電極', 'carbon, platinum = inert'), RX, y, RW, K.muted, 24, 'left', a(0.7));
      y = row(ctx, 'ok', tr('只傳遞電子', 'Only pass electrons along'), y + 22, K.electron, a(1.6));
      y = row(ctx, 'ok', tr('本身不參與反應', 'Take no part in the reaction'), y + 10, K.white, a(3.0));
      row(ctx, 'ok', tr('大小、顏色都不變', 'Size and colour stay the same'), y + 10, K.yellow, a(4.2));
    } else {
      y = block(ctx, tr('活性電極', 'Active electrodes'), RX, 110, RW, K.cuHi, 30, 'left', a(0.4), 38);
      y = block(ctx, tr('（如銅片、銀片）', '(e.g. copper, silver)'), RX, y, RW, K.muted, 24, 'left', a(0.7));
      y = row(ctx, 'warn', tr('可能會自己溶解，參與化學反應！', 'May dissolve and take part in the reaction!'), y + 22, K.white, a(2.6));
      y = block(ctx, tr('（這裡只是預告）', '(just a preview here)'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(3.0));
      y = block(ctx, tr('接下來：電解水、電解硫酸銅', 'Next: electrolysis of water and of copper sulfate'), RX, y + 26, RW, K.cyan, 24, 'left', a(5.4));
      block(ctx, tr('看電極怎麼反應', 'see how the electrodes react'), RX, y, RW, K.cyan, 24, 'left', a(5.7));
    }
    const botT = [6.4, 6.6, 6.0, 5.4, 6.4][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), K.yellow, a(botT));
  }

  // ───────── 圖例、標題、進度條 ─────────
  function drawLegend(ctx) {
    const items = [[tr('藍球＝電子', 'Blue ball = electron'), 'b'], [tr('橘＝陽離子', 'Orange = cation'), 'p'], [tr('紫＝陰離子', 'Purple = anion'), 'n']];
    const z = 22, gapIcon = 30, gapItem = 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
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
    HW = { 'Na⁺': pillHalf(ctx, 'Na⁺'), 'OH⁻': pillHalf(ctx, 'OH⁻') };
    const S = state(i, tl);
    apparatus(ctx, i, tl, S);
    notes(ctx, i, tl);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('introAnimCanvas');
  const ctl = () => window.ElAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('introAnimResult'); if (el) el.innerHTML = html;
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
    const r = document.getElementById('steps-intro');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-intro'); if (!r) return;
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

  window.ElAnim.intro = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-intro'); if (r) r.innerHTML = '';
      const o = document.getElementById('introAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) { S.ended = false; start(); } },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { intro: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'intro' : null, t: S.t, running: !!(S.raf || S.timer), step: S.step }; }
  };
})();
