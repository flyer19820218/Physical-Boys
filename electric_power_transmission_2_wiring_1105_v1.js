/* electric_power_transmission_2_wiring_1105_v1.js — 「家庭三線配電」子分頁動畫（#wiringAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.wiring = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'wiring'（分頁 tab-wiring → 子分頁 wiring-basic）。畫布不綁任何事件；唯一控制是 #steps-wiring 裡的 5 個步驟鈕；
 * 結果框 #wiringAnimResult。只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   上半：三條平行導線（x 210～640），由上到下 活線 A（粉紅，y=115）、中性線 C（白，y=205）、活線 B（青，y=295），
 *   線名寫在左側。右側一盞燈（x=820，直立）用兩條接線接到被選的兩條線，兩條接線之間有雙頭箭頭，燈右邊標電壓
 *   （110 V 黃、220 V 橘，和頁面靜態文字同色）。
 *   下半：波形區（x 210～950，零線 y=445 標「C」＝以中性線為基準）。A＝粉紅、B＝青（與 A 差半個週期）、A－B 的差＝橘
 *   （振幅為單一條的兩倍，比例示意）。波形只畫形狀與相位，不標數值；不出現峰值、√2、有效值。
 *   波形上方一行（y=345）放本步的波形註記；最下方圖例。
 *   本支以「配線與電壓差」為主，不畫電子、電流與能量方塊。
 *
 * ── 步驟表，共 41 s ─────────────────────────────────────────────
 *   1 三條線   7 s  三條線依序由左畫到右並標名；波形區只有零線
 *   2 A－C     8 s  燈接 A、C，燈亮，標 110 V；波形只亮 A（B 很淡），游標掃過
 *   3 B－C     8 s  燈改接 B、C，標 110 V；波形亮 B，A 變淡留著對照，註記「和 A 差半個週期」
 *   4 A－B     9 s  燈接 A、B，標 220 V；A、B 都亮，2.5 s 起畫出橘色 A－B 差的波形（兩倍振幅）
 *   5 半個週期 9 s  游標移到 A 最高點停住：A 點、B 點、兩點間橘色雙頭箭頭；「半個週期」括號（A 峰到 B 峰）；
 *                   導線旁標「此刻 A 為正 +」「此刻 B 為負 −」；下方「一正一負：差最大」
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–36px（說明 26、線名 24、標籤 22–24、電壓 36），Noto Sans TC 900；寫字前一律 measureText。
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
  const WX0 = 210, WX1 = 640;                         // 三條導線
  const WY = { a: 115, c: 205, b: 295 };
  const WCOL = { a: K.pink, c: K.white, b: K.cyan };
  const LPX = 820, LR = 28;                           // 燈
  const ARX = 730;                                    // 兩接線間的雙頭箭頭
  const GX0 = 210, GX1 = 950, GY = 445, GA = 34;      // 波形區；GA＝單一條的振幅（比例示意）
  const PER = 370;                                    // 波形一個週期的寬度（px），畫 2 個週期
  const NOTE_Y = 345;                                 // 波形註記那一行
  const fA = x => Math.sin(TAU * (x - GX0) / PER);
  const fB = x => -fA(x);
  const XPEAK_A = GX0 + PER / 4, XPEAK_B = GX0 + PER * 3 / 4;

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 7, b: ['三條線', 'Three wires'], pair: null,
      cap: ['家庭配電有三條線', 'Home wiring uses three wires'],
      res: ['家庭配電有三條線：活線 A、活線 B 和中性線 C。', 'Home wiring has three wires: live A, live B and neutral C.'] },
    { dur: 8, b: ['A－C', 'A–C'], pair: ['a', 'c'], volt: '110 V',
      cap: ['燈接 A 與 C：110 V', 'Lamp across A and C: 110 V'],
      res: ['活線 A 與中性線 C 之間是 110 V。', 'Between live A and neutral C: 110 V.'] },
    { dur: 8, b: ['B－C', 'B–C'], pair: ['b', 'c'], volt: '110 V',
      cap: ['燈改接 B 與 C：也是 110 V', 'Lamp across B and C: also 110 V'],
      res: ['活線 B 與中性線 C 之間也是 110 V。', 'Between live B and neutral C: also 110 V.'] },
    { dur: 9, b: ['A－B', 'A–B'], pair: ['a', 'b'], volt: '220 V',
      cap: ['燈接 A 與 B：220 V', 'Lamp across A and B: 220 V'],
      res: ['活線 A 與活線 B 之間是 220 V。', 'Between live A and live B: 220 V.'] },
    { dur: 9, b: ['半個週期', 'Half cycle'], pair: ['a', 'b'], volt: '220 V',
      cap: ['A、B 相差半個週期', 'A and B are half a cycle apart'],
      res: ['活線 A 與 B 的交流變化相差半個週期；一正一負時，兩線間的電壓差最大。',
        'Live A and B are half a cycle out of phase; when one is positive and the other negative, the voltage difference is largest.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 繪圖小工具 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function poly(ctx, pts, color, w, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function polyPart(P, k) {                     // 取折線的前 k（0～1）段
    let s = polyLen(P) * clamp(k, 0, 1); const out = [P[0]];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s >= d) { out.push(b); s -= d; } else { if (d) out.push({ x: lerp(a.x, b.x, s / d), y: lerp(a.y, b.y, s / d) }); break; }
    }
    return out;
  }
  function dot(ctx, x, y, r, color, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 垂直雙頭箭頭
  function dblArrowV(ctx, x, y0, y1, color, alpha, lw) {
    if (alpha <= 0.01) return;
    const hd = 13, hw = 9;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y0 + hd * 0.8); ctx.lineTo(x, y1 - hd * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - hw, y0 + hd); ctx.lineTo(x + hw, y0 + hd); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - hw, y1 - hd); ctx.lineTo(x + hw, y1 - hd); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function bracket(ctx, x0, x1, y, legDown, color, alpha) {
    if (alpha <= 0.01) return;
    const d = legDown ? 10 : -10;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y + d); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + d); ctx.stroke();
    ctx.restore();
  }

  // ───────── 三條線 ─────────
  const WNAME = { a: ['活線 A', 'Live A'], c: ['中性線 C', 'Neutral C'], b: ['活線 B', 'Live B'] };
  function drawWires(ctx, i, tl) {
    ['a', 'c', 'b'].forEach((w, k) => {
      // 第 1 步依序由左畫到右；其餘步驟直接完整
      const g = i === 0 ? ease((tl - 0.4 - k * 0.9) / 1.0) : 1;
      if (g <= 0) return;
      const y = WY[w], xe = lerp(WX0, WX1, g);
      ctx.save(); ctx.strokeStyle = WCOL[w]; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.shadowColor = WCOL[w]; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(WX0, y); ctx.lineTo(xe, y); ctx.stroke(); ctx.restore();
      dot(ctx, WX0, y, 6, WCOL[w]);
      if (g >= 1) dot(ctx, WX1, y, 6, WCOL[w]);
      const a = i === 0 ? clamp((tl - 0.7 - k * 0.9) / 0.5, 0, 1) : 1;
      text(ctx, tr(WNAME[w][0], WNAME[w][1]), WX0 - 18, y, WCOL[w], fitSize(ctx, tr(WNAME[w][0], WNAME[w][1]), 170, 24), 'right', a);
    });
  }

  // ───────── 燈與接線 ─────────
  function drawLamp(ctx, cx, cy, g) {
    const R = LR;
    if (g > 0.01) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.4);
      gr.addColorStop(0, `rgba(255,244,190,${0.55 * g})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,170,${0.85 * g})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 0; k < 8; k++) {
        const a = k * TAU / 8 + Math.PI / 8, r0 = R + 8, r1 = R + 8 + 14 * g;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = g > 0.01 ? `rgb(${Math.round(lerp(22, 92, g))},${Math.round(lerp(58, 84, g))},${Math.round(lerp(49, 40, g))})` : '#163a31';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9d3cf'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + R); ctx.lineTo(cx, cy + R * 0.45); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy - R * 0.45); ctx.stroke();
    ctx.strokeStyle = g > 0.01 ? `rgb(${Math.round(lerp(150, 255, g))},${Math.round(lerp(96, 246, g))},${Math.round(lerp(60, 200, g))})` : '#8a5a36';
    ctx.lineWidth = 3.5; if (g > 0.01) { ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 16 * g; }
    ctx.beginPath();
    const n = 6, y0 = cy + R * 0.45, y1 = cy - R * 0.45;
    for (let k = 0; k <= n; k++) { const y = lerp(y0, y1, k / n), x = cx + (k === 0 || k === n ? 0 : (k % 2 ? -1 : 1) * R * 0.3); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function drawHookup(ctx, i, tl) {
    const st = STEPS[i]; if (!st.pair) return;
    const [p, q] = st.pair, y1 = WY[p], y2 = WY[q], cy = (y1 + y2) / 2;
    const top = [{ x: WX1, y: y1 }, { x: LPX, y: y1 }, { x: LPX, y: cy - LR }];
    const bot = [{ x: WX1, y: y2 }, { x: LPX, y: y2 }, { x: LPX, y: cy + LR }];
    const g = i === 4 ? 1 : ease((tl - 0.4) / 0.9);
    poly(ctx, polyPart(top, g), WCOL[p], 5);
    poly(ctx, polyPart(bot, g), WCOL[q], 5);
    dot(ctx, WX1, y1, 8, WCOL[p]); dot(ctx, WX1, y2, 8, WCOL[q]);
    const lit = i === 4 ? 1 : clamp((tl - 1.3) / 0.5, 0, 1);
    drawLamp(ctx, LPX, cy, 0.85 * lit);
    const va = i === 4 ? 1 : clamp((tl - 1.7) / 0.5, 0, 1);
    const vc = st.volt === '220 V' ? K.orange : K.yellow;
    dblArrowV(ctx, ARX, y1 + 8, y2 - 8, vc, va);
    text(ctx, st.volt, LPX + LR + 46, cy, vc, 36, 'left', va);
  }

  // ───────── 波形區 ─────────
  function drawAxis(ctx, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.white; ctx.fillStyle = K.white; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(GX0, GY); ctx.lineTo(GX1, GY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GX1 + 10, GY); ctx.lineTo(GX1 - 4, GY - 8); ctx.lineTo(GX1 - 4, GY + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    text(ctx, 'C', GX0 - 16, GY, K.white, 24, 'right', alpha);
    text(ctx, 't', GX1 + 16, GY, K.white, 24, 'left', alpha);
  }
  function wave(ctx, f, amp, color, lw, alpha, x1) {
    if (alpha <= 0.01) return;
    const xe = x1 === undefined ? GX1 - 6 : x1;
    if (xe <= GX0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.beginPath();
    for (let x = GX0, k = 0; x <= xe + 1e-6; x += 2, k++) { const y = GY - amp * f(x); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function cursorLine(ctx, x, alpha, half) {
    const h = half || 2 * GA + 14;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x, GY - h); ctx.lineTo(x, GY + h); ctx.stroke(); ctx.restore();
  }
  function cursorDot(ctx, x, y, color, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = K.white; ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.stroke(); ctx.restore();
  }
  const SWEEP = 6;                               // 游標掃過整個波形區所需秒數
  const sweepX = tl => GX0 + ((Math.max(0, tl - 1.0) / SWEEP) % 1) * (GX1 - 6 - GX0);

  function drawWaves(ctx, i, tl) {
    drawAxis(ctx, i === 0 ? 0.45 * clamp((tl - 3.4) / 0.6, 0, 1) : 1);
    if (i === 0) return;
    const wa = clamp((tl - 0.6) / 0.6, 0, 1);
    if (i === 4) { drawHalf(ctx, tl); return; }
    // 本步亮哪幾條
    const aOn = i === 1 || i === 3, bOn = i === 2 || i === 3;
    wave(ctx, fA, GA, K.pink, aOn ? 4 : 3, wa * (aOn ? 1 : (i === 2 ? 0.3 : 0.14)));
    wave(ctx, fB, GA, K.cyan, bOn ? 4 : 3, wa * (bOn ? 1 : 0.14));
    let da = 0;
    if (i === 3) { da = clamp((tl - 2.5) / 0.6, 0, 1); wave(ctx, x => fA(x) - fB(x), GA, K.orange, 4.5, da); }
    // 游標
    const ca = clamp((tl - 1.0) / 0.4, 0, 1), x = sweepX(tl);
    if (ca > 0) {
      cursorLine(ctx, x, ca);
      if (aOn) cursorDot(ctx, x, GY - GA * fA(x), K.pink, ca);
      if (bOn) cursorDot(ctx, x, GY - GA * fB(x), K.cyan, ca);
      if (da > 0) cursorDot(ctx, x, GY - GA * (fA(x) - fB(x)), K.orange, ca * da);
    }
    // 註記
    const na = clamp((tl - 1.2) / 0.5, 0, 1);
    if (i === 1) textClamp(ctx, tr('A 對 C 的變化', 'A compared with C'), 580, NOTE_Y, K.pink, 24, 30, 970, na);
    if (i === 2) textClamp(ctx, tr('B 對 C：和 A 差半個週期', 'B vs C: half a cycle behind A'), 580, NOTE_Y, K.cyan, 24, 30, 970, na);
    if (i === 3) textClamp(ctx, tr('A 與 B 的差：兩倍大（比例示意）', 'A minus B: twice as big (to scale)'), 580, NOTE_Y, K.orange, 24, 30, 970, da);
  }
  // 第 5 步：游標移到 A 最高點停住，標出一正一負與半個週期
  function drawHalf(ctx, tl) {
    wave(ctx, fA, GA, K.pink, 4, 1);
    wave(ctx, fB, GA, K.cyan, 4, 1);
    wave(ctx, x => fA(x) - fB(x), GA, K.orange, 3, 0.22);
    const x = lerp(GX0, XPEAK_A, ease((tl - 0.6) / 2.0));
    cursorLine(ctx, x, 1, GA + 18);
    const ya = GY - GA * fA(x), yb = GY - GA * fB(x);
    cursorDot(ctx, x, ya, K.pink, 1); cursorDot(ctx, x, yb, K.cyan, 1);
    const m = clamp((tl - 2.8) / 0.5, 0, 1);
    dblArrowV(ctx, XPEAK_A + 26, GY - GA, GY + GA, K.orange, m, 4);
    textClamp(ctx, tr('一正一負：差最大', 'One +, one −: largest gap'), XPEAK_A + 26, GY + 2 * GA + 16, K.orange, 24, 30, 970, m);
    // 半個週期：A 的最高點 → B 的最高點
    const h = clamp((tl - 4.4) / 0.5, 0, 1);
    if (h > 0) {
      dot(ctx, XPEAK_B, GY - GA, 7, K.cyan, h);
      bracket(ctx, XPEAK_A, XPEAK_B, GY - 2 * GA - 6, true, K.yellow, h);
      textClamp(ctx, tr('半個週期', 'half a cycle'), (XPEAK_A + XPEAK_B) / 2, NOTE_Y - 2, K.yellow, 24, 30, 970, h);
    }
  }
  // 第 5 步：導線上也標「A＋、B−」
  function drawSigns(ctx, i, tl) {
    if (i !== 4) return;
    const m = clamp((tl - 2.8) / 0.5, 0, 1);
    text(ctx, tr('此刻 A 為正 +', 'A is + now'), 425, WY.a + 30, K.pink, 22, 'center', m);
    text(ctx, tr('此刻 B 為負 −', 'B is − now'), 425, WY.b - 30, K.cyan, 22, 'center', m);
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = i === 0
      ? [[tr('粉紅＝活線 A', 'Pink = live A'), K.pink], [tr('白＝中性線 C', 'White = neutral C'), K.white], [tr('青＝活線 B', 'Cyan = live B'), K.cyan]]
      : [[tr('A 的波形', 'Wave of A'), K.pink], [tr('B 的波形', 'Wave of B'), K.cyan]];
    if (i >= 3) items.push([tr('A 與 B 的差', 'A minus B'), K.orange]);
    if (i >= 1) items.push([tr('（只示意形狀與相位）', '(shape and phase only)'), null]);
    const z = 22, gapIcon = 40, gapItem = 30;
    const wid = items.map(([s, c]) => (c ? gapIcon : 0) + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
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
  function drawScene(ctx, i, tl) {
    drawWaves(ctx, i, tl);
    drawHookup(ctx, i, tl);
    drawWires(ctx, i, tl);
    drawSigns(ctx, i, tl);
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('wiringAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('wiringAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-wiring');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-wiring'); if (!row) return;
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

  window.EpAnim.wiring = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-wiring'); if (row) row.innerHTML = '';
      const r = document.getElementById('wiringAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { wiring: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'wiring' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
