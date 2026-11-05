/* electric_power_transmission_2_phase_1105_v1.js — 「220 V 怎麼來？」子分頁動畫（#phaseAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.phase = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'phase'（分頁 tab-wiring → 子分頁 wiring-advanced）。畫布不綁事件；唯一控制是 #steps-phase 的 5 個步驟鈕；
 * 結果框 #phaseAnimResult。只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內。結構與配色沿用 wiring 模組
 * （A 粉紅 #f472b6、B 青 #55e9ff、兩端差橘 #fb923c）。畫面是場景時間 t 的純函式。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   左欄：垂直數線（x=230），刻度 +110 V／0／−110 V；A 點（粉紅）、B 點（青）在數線上反向運動，兩點之間的橘線＝兩端距離。
 *         下方同一比例的「兩端差」縱軸（0、+220 V）。
 *   右側：上方 A、B 波形（零線 y=190）＋同步游標，游標點用虛線拉到數線上同高的點；下方「兩端差（A − B）」波形（零線 y=432，
 *         同比例，振幅為兩倍）。數值只用比例值 110、220、−110（等比例示意，不引入瞬時值）。不畫電子、電流與能量方塊。
 *
 * ── 步驟表，共 41 s ─────────────────────────────────────────────
 *   1 方向相反 8 s  波形與數線登場，游標掃過，A、B 兩點沿數線反向運動（小箭頭標方向）
 *   2 兩端相距 8 s  游標走到 A 最高點定格：A＝+110 V、B＝−110 V；括號分兩半各 110，「110 + 110 = 220 V」
 *   3 交換位置 8 s  游標走半個週期（上方括號「半個週期」）：A＝−110 V、B＝+110 V，仍差 220 V
 *   4 量兩線   8 s  兩點繼續擺動，電表（V）兩支表筆接 A、B，讀數 220 V；「從 −110 V 到 +110 V：相隔 220 V」
 *   5 差值波形 9 s  游標畫出橘色兩端差波形；虛線＝單一條 A（同比例）對照；雙頭箭頭標「兩倍」
 * 播放規則（AGENTS 10.6）：activate() 播第 1 步，每步播完停在最後一幀；按步驟鈕＝從該步開頭播；setStepStop(false)＝連播到底，
 * 到底呼叫一次 EpAnim.ctl.onEnd；EpAnim.ctl.paused 為真時時間凍住。進度條用共用 window.AnimBar.draw（頂端 y=8～24）。
 * 字級：畫布文字 22–28px，Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
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
  function fitSize(ctx, s, maxW, want) {
    for (let z = want; z >= 22; z -= 2) if (textW(ctx, s, z) <= maxW) return z;
    return 22;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function textClamp(ctx, s, cx, y, color, size, lo, hi, alpha) {
    const w = textW(ctx, s, size);
    const x = clamp(cx, lo + w / 2, hi - w / 2);
    text(ctx, s, x, y, color, size, 'center', alpha);
  }

  // ───────── 版面常數 ─────────
  // 同一個比例尺：U px ＝ 110（比例值）；上方 A、B 波形與左側數線共用這個比例，所以點和波形一樣高
  const U = 58;
  const NX = 230;                                     // 垂直數線 x
  const TY = 190;                                     // 上方波形零線（＝數線的 0）
  const DY = 432;                                     // 下方「兩端差」波形零線
  const GX0 = 380, GX1 = 950;                         // 波形區
  const PER = 285;                                    // 一個週期的寬度（px），畫 2 個週期
  const BRX = 272;                                    // 數線右邊的括號
  const NOTE_Y = 286;                                 // 註記那一行
  const fA = x => Math.sin(TAU * (x - GX0) / PER);
  const fB = x => -fA(x);
  const XPEAK_A = GX0 + PER / 4, XPEAK_B = GX0 + PER * 3 / 4;
  const yOf = (v, y0) => y0 - U * v;                  // v＝比例（1 代表 110）

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['方向相反', 'Opposite'],
      cap: ['A 在上時，B 正好在下', 'When A is high, B is low'],
      res: ['A 線和 B 線像兩個方向相反的盪鞦韆：A 在上方時，B 正好在下方。', 'Wire A and wire B swing in opposite directions: when A is high, B is low.'] },
    { dur: 8, b: ['兩端相距', 'The gap'],
      cap: ['A＝＋110 V，B＝−110 V', 'A = +110 V, B = −110 V'],
      res: ['A 在上方 ＋110 V，B 在下方 −110 V，兩端相距 110 + 110 = 220 V。', 'A is at +110 V and B at −110 V: they are 110 + 110 = 220 V apart.'] },
    { dur: 8, b: ['交換位置', 'Swap'],
      cap: ['半個週期後交換位置', 'Half a cycle later they swap'],
      res: ['半個週期後兩者交換位置，兩端仍然相距 220 V。', 'Half a cycle later they swap places, and the gap is still 220 V.'] },
    { dur: 8, b: ['量兩線', 'Measure'],
      cap: ['量 A、B：看兩端相隔多遠', 'Measuring A–B: how far apart?'],
      res: ['不要只背 110 + 110：量 A、B 兩線，就是看兩端相隔多遠。', "Don't just memorize 110 + 110: measuring A and B means checking how far apart the two ends are."] },
    { dur: 9, b: ['差值波形', 'Difference'],
      cap: ['兩端差的波形是兩倍大', 'The difference wave is twice as big'],
      res: ['兩端差的波形是單一條線的兩倍，所以 A、B 之間是 220 V。', "The difference wave is twice as large as a single wire's wave, so A–B is 220 V."] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 繪圖小工具 ─────────
  function poly(ctx, pts, color, w, alpha, dash) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function dot(ctx, x, y, r, color, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function dblArrowV(ctx, x, y0, y1, color, alpha, lw) {
    if (alpha <= 0.01) return;
    const hd = 13, hw = 9;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y0 + hd * 0.8); ctx.lineTo(x, y1 - hd * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - hw, y0 + hd); ctx.lineTo(x + hw, y0 + hd); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - hw, y1 - hd); ctx.lineTo(x + hw, y1 - hd); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 垂直括號（開口朝左），中間一個小刻痕
  function bracketV(ctx, x, y0, y1, color, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 10, y0); ctx.lineTo(x, y0); ctx.lineTo(x, y1); ctx.lineTo(x - 10, y1);
    const ym = (y0 + y1) / 2; ctx.moveTo(x, ym); ctx.lineTo(x - 7, ym); ctx.stroke(); ctx.restore();
  }
  function bracketH(ctx, x0, x1, y, color, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y + 10); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 10); ctx.stroke(); ctx.restore();
  }

  // ───────── 游標位置（純函式） ─────────
  const SWEEP = 6;
  const sweepX = tl => GX0 + ((Math.max(0, tl - 1.0) / SWEEP) % 1) * (GX1 - 6 - GX0);
  function cursorX(i, tl) {
    if (i === 0 || i === 3) return sweepX(tl);
    if (i === 1) return lerp(GX0, XPEAK_A, ease((tl - 0.8) / 2.0));
    if (i === 2) return lerp(XPEAK_A, XPEAK_B, ease((tl - 1.0) / 3.0));
    return lerp(GX0, GX1 - 6, clamp((tl - 0.8) / 4.0, 0, 1));
  }
  // 兩點停在兩端（±110）的程度：第 2 步定格後、第 3 步換完位後
  function endsOn(i, tl) {
    if (i === 1) return clamp((tl - 2.9) / 0.5, 0, 1);
    if (i === 2) return Math.max(clamp(1 - (tl - 0.8) / 0.4, 0, 1), clamp((tl - 4.1) / 0.5, 0, 1));
    if (i === 3) return 1;
    return 0;
  }

  // ───────── 波形 ─────────
  function axis(ctx, y0, lab, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.white; ctx.fillStyle = K.white; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(GX0, y0); ctx.lineTo(GX1, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GX1 + 10, y0); ctx.lineTo(GX1 - 4, y0 - 8); ctx.lineTo(GX1 - 4, y0 + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    text(ctx, 't', GX1 + 16, y0, K.white, 24, 'left', alpha);
  }
  function wave(ctx, f, y0, amp, color, lw, alpha, x1, dash) {
    if (alpha <= 0.01) return;
    const xe = x1 === undefined ? GX1 - 6 : Math.min(x1, GX1 - 6);
    if (xe <= GX0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash); else { ctx.shadowColor = color; ctx.shadowBlur = 6; }
    ctx.beginPath();
    for (let x = GX0, k = 0; x <= xe + 1e-6; x += 2, k++) { const y = y0 - amp * f(x); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function cursorDot(ctx, x, y, color, alpha, r) {
    r = r || 8;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = K.white; ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function cursorLine(ctx, x, y0, y1, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.restore();
  }

  // ───────── 數線（−110 到 ＋110）與兩個動點 ─────────
  function drawNumberLine(ctx, i, tl, x) {
    const ap = i === 0 ? clamp((tl - 0.3) / 0.6, 0, 1) : 1;
    const yT = yOf(1, TY), yB = yOf(-1, TY);
    poly(ctx, [{ x: NX, y: yT - 16 }, { x: NX, y: yB + 16 }], K.white, 3, ap);
    [[1, '+110 V'], [0, '0'], [-1, '−110 V']].forEach(([v, s]) => {
      const y = yOf(v, TY);
      poly(ctx, [{ x: NX - 9, y }, { x: NX + 9, y }], K.white, 3, ap);
      text(ctx, s, NX - 20, y, v ? K.white : K.muted, 24, 'right', ap);
    });
    const va = fA(x), vb = fB(x);
    const ya = yOf(va, TY), yb = yOf(vb, TY);
    const da = i === 0 ? clamp((tl - 0.6) / 0.6, 0, 1) : 1;
    // 兩點之間的距離（橘）
    const gapA = i === 0 ? 0 : (i === 4 ? 0.5 : 0.85);
    if (gapA > 0) poly(ctx, [{ x: NX, y: ya }, { x: NX, y: yb }], K.orange, 9, gapA * (Math.abs(ya - yb) > 4 ? 1 : 0));
    // 從波形上的游標點拉到數線的虛線（同高）
    poly(ctx, [{ x: NX + 12, y: ya }, { x: x, y: ya }], K.pink, 2, 0.45 * da, [5, 7]);
    poly(ctx, [{ x: NX + 12, y: yb }, { x: x, y: yb }], K.cyan, 2, 0.45 * da, [5, 7]);
    cursorDot(ctx, NX, ya, K.pink, da, 11);
    cursorDot(ctx, NX, yb, K.cyan, da, 11);
    dot(ctx, NX, ya, 6, K.pink, da); dot(ctx, NX, yb, 6, K.cyan, da);
    // 點的名稱：兩點靠太近時淡出，避免疊字
    const sep = clamp((Math.abs(ya - yb) - 22) / 14, 0, 1) * da;
    text(ctx, 'A', NX + 18, ya, K.pink, 24, 'left', sep);
    text(ctx, 'B', NX + 18, yb, K.cyan, 24, 'left', sep);
    // 第 1 步：方向箭頭（一上一下）
    if (i === 0 && tl > 1.0) {
      const dA = Math.cos(TAU * (x - GX0) / PER);           // A 的變化方向
      const k = clamp(Math.abs(dA) * 3 - 0.4, 0, 1) * clamp((tl - 1.0) / 0.4, 0, 1);
      arrowSmall(ctx, NX - 30, ya, dA > 0 ? -1 : 1, K.pink, k);
      arrowSmall(ctx, NX - 30, yb, dA > 0 ? 1 : -1, K.cyan, k);
    }
    return { ya, yb };
  }
  function arrowSmall(ctx, x, y, dir, color, alpha) {
    if (alpha <= 0.01) return;
    // 放在點名稱（A／B）右邊；dir −1＝往上
    x = NX + 52;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y + dir * 16); ctx.lineTo(x - 7, y + dir * 4); ctx.lineTo(x + 7, y + dir * 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 括號：+110 到 −110，分兩半各 110
  function drawGap(ctx, i, tl, e) {
    if (i === 0 || i === 4) return;
    const yT = yOf(1, TY), yB = yOf(-1, TY);
    const a = i === 3 ? 1 : e;
    bracketV(ctx, BRX, yT, yB, K.orange, Math.max(a, i === 2 ? 0.25 : 0));
    const la = i === 3 ? 0 : a;                          // 第 4 步那裡放電表，不寫 110
    text(ctx, '110', BRX + 10, (yT + TY) / 2, K.yellow, 24, 'left', la);
    text(ctx, '110', BRX + 10, (yB + TY) / 2, K.yellow, 24, 'left', la);
  }

  // ───────── 電表（第 4 步） ─────────
  function drawMeter(ctx, tl, ya, yb) {
    const a = clamp((tl - 0.6) / 0.6, 0, 1); if (a <= 0) return;
    const mx = 334, my = TY, r = 24;
    // 兩條表筆：一條接 A 點、一條接 B 點
    poly(ctx, [{ x: mx - r * 0.7, y: my - r * 0.7 }, { x: (mx + NX) / 2 + 10, y: (my + ya) / 2 - 6 }, { x: NX + 8, y: ya }], K.pink, 3, a);
    poly(ctx, [{ x: mx - r * 0.7, y: my + r * 0.7 }, { x: (mx + NX) / 2 + 10, y: (my + yb) / 2 + 6 }, { x: NX + 8, y: yb }], K.cyan, 3, a);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#163a31'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    text(ctx, 'V', mx, my + 1, K.white, 26, 'center', a);
  }

  // ───────── 場景 ─────────
  function drawScene(ctx, i, tl) {
    const x = cursorX(i, tl);
    const wa = i === 0 ? clamp((tl - 0.4) / 0.6, 0, 1) : 1;
    // 上方 A、B 波形
    axis(ctx, TY, '', wa);
    wave(ctx, fA, TY, U, K.pink, 4, wa);
    wave(ctx, fB, TY, U, K.cyan, 4, wa);
    // 下方「兩端差」波形：第 1～4 步淡淡的預告，第 5 步亮起並由游標畫出
    const dA = i === 4 ? 1 : 0.55;
    axis(ctx, DY, '', dA);
    text(ctx, '0', NX - 20, DY, K.muted, 24, 'right', dA);
    poly(ctx, [{ x: NX - 9, y: DY }, { x: NX + 9, y: DY }], K.white, 3, dA);
    poly(ctx, [{ x: NX, y: yOf(2, DY) - 10 }, { x: NX, y: yOf(-2, DY) + 10 }], K.white, 3, dA);
    poly(ctx, [{ x: NX - 9, y: yOf(2, DY) }, { x: NX + 9, y: yOf(2, DY) }], K.white, 3, dA);
    text(ctx, '+220 V', NX - 20, yOf(2, DY), K.orange, 24, 'right', dA);
    textClamp(ctx, tr('兩端差（A − B）', 'Gap (A − B)'), GX1 - textW(ctx, tr('兩端差（A − B）', 'Gap (A − B)'), 24) / 2, DY - 2 * U - 2, K.orange, 24, 30, 970, dA);
    const fd = xx => fA(xx) - fB(xx);
    if (i === 4) {
      wave(ctx, fA, DY, U, K.pink, 3, 0.55, undefined, [6, 7]);           // 單一條 A（同比例）對照
      wave(ctx, fd, DY, U, K.orange, 5, 1, x);
    } else wave(ctx, fd, DY, U, K.orange, 3, 0.22 * wa);
    // 游標
    const ca = i === 0 ? clamp((tl - 1.0) / 0.4, 0, 1) : 1;
    if (ca > 0) {
      cursorLine(ctx, x, TY - U - 14, DY + 2 * U + 6, ca);
      cursorDot(ctx, x, yOf(fA(x), TY), K.pink, ca);
      cursorDot(ctx, x, yOf(fB(x), TY), K.cyan, ca);
      cursorDot(ctx, x, yOf(fd(x), DY), K.orange, ca * (i === 4 ? 1 : 0.5));
    }
    const e = endsOn(i, tl);
    const P = drawNumberLine(ctx, i, tl, x);
    drawGap(ctx, i, tl, e);
    if (i === 3) drawMeter(ctx, tl, P.ya, P.yb);
    // 註記（每步一句）
    const na = clamp((tl - 1.2) / 0.5, 0, 1);
    if (i === 0) textClamp(ctx, tr('一個往上，另一個就往下', 'One goes up, the other goes down'), 580, NOTE_Y, K.white, 24, 380, 970, na);
    if (i === 1) textClamp(ctx, tr('兩端相距 110 + 110 = 220 V', 'Gap: 110 + 110 = 220 V'), 580, NOTE_Y, K.orange, 26, 380, 970, e);
    if (i === 2) {
      const h = clamp((tl - 4.1) / 0.5, 0, 1);
      bracketH(ctx, XPEAK_A, XPEAK_B, TY - U - 16, K.yellow, clamp((tl - 0.8) / 0.4, 0, 1));
      textClamp(ctx, tr('半個週期', 'half a cycle'), (XPEAK_A + XPEAK_B) / 2, TY - U - 34, K.yellow, 24, 300, 970, clamp((tl - 0.8) / 0.4, 0, 1));
      textClamp(ctx, tr('A＝−110 V，B＝＋110 V：仍差 220 V', 'A = −110 V, B = +110 V: still 220 V'), 580, NOTE_Y, K.orange, 24, 380, 970, h);
    }
    if (i === 3) {
      textClamp(ctx, '220 V', 334, TY - 52, K.orange, 28, 290, 372, clamp((tl - 1.0) / 0.5, 0, 1));
      textClamp(ctx, tr('從 −110 V 到 ＋110 V：相隔 220 V', 'From −110 V to +110 V: 220 V apart'), 580, NOTE_Y, K.orange, 24, 380, 970, na);
    }
    if (i === 4) {
      const m = clamp((tl - 5.0) / 0.5, 0, 1);
      dblArrowV(ctx, XPEAK_A + 30, DY, yOf(2, DY), K.orange, m, 4);
      text(ctx, tr('兩倍', '×2'), XPEAK_A + 48, yOf(1.2, DY), K.orange, 26, 'left', m);
      textClamp(ctx, tr('虛線＝單一條 A（同比例）', 'Dashed = wire A alone (same scale)'), 580, NOTE_Y, K.pink, 24, 380, 970, na);
    }
    drawLegend(ctx, i);
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = [[tr('A 線', 'Wire A'), K.pink], [tr('B 線', 'Wire B'), K.cyan], [tr('兩端差', 'Gap A − B'), K.orange],
      [tr('（比例示意）', '(to scale, sketch)'), null]];
    const z = 22, gapIcon = 40, gapItem = 30;
    const wid = items.map(([s, c]) => (c ? gapIcon : 0) + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = 600 - tot / 2; const y = 582;
    items.forEach(([s, c], k) => {
      if (c) poly(ctx, [{ x: x + 2, y }, { x: x + 28, y }], c, 5);
      text(ctx, s, x + (c ? gapIcon : 0), y, c ? K.white : K.muted, z, 'left');
      x += wid[k] + gapItem;
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

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('phaseAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('phaseAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
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
    const row = document.getElementById('steps-phase');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-phase'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
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

  window.EpAnim.phase = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-phase'); if (row) row.innerHTML = '';
      const r = document.getElementById('phaseAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { phase: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'phase' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
