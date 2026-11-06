/* electrical_safety_3_heat_1106_v1.js — 「導線為何變熱」分頁動畫（#heatAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EsAnim.heat = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'heat'。畫布不綁任何事件；唯一控制是 #steps-heat 裡的 5 個步驟鈕；結果框 #heatAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）；下方 y≈492/524 本步重點；最下方圖例。
 *   第 1 步電路：左幹線 x=130（電池在 y=245：上長細＝正極、下短粗＝負極），上導線 y=120、下導線 y=370、右幹線 x=560；
 *     「導線段」（當元件看，標「導線（有電阻）」）畫在下導線正中央 x 255～435；電器方塊在右幹線正中央 (560,245)。
 *     電子由負極出發：往下 → 下導線往右（穿過導線段）→ 右幹線往上（經過電器）→ 上導線往左 → 回正極。
 *     能量方塊在電子外側 22px：經過導線段少掉一點（變熱）、經過電器才用掉大部分（元件座標算落點）。
 *     右側放大鏡 (800,250) r=120：銅原子格點、電子往右穿過時碰撞，原子閃橘紅＝發熱。
 *   第 2、3 步：左右兩欄（x 80～440、560～920）各一段導線，同長度；電子疏密＝電流大小（定性）；
 *     橘紅光暈強弱與熱紋條數＝發熱多寡（第 2 步 2 條 vs 8 條＝×4）。
 *   第 4 步：左欄插頭鬆動／接點氧化（接點熱點）；右欄延長線捲起來＋被物品蓋住（熱被一圈虛線圈住、散不出去）。
 *   第 5 步：三列重點（圖示＋文字），一次出現一列。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 導線電阻  8 s  電路＋放大鏡；導線段微微泛橘；P = I²R
 *   2 電流加倍  9 s  同一段導線：電流 1 倍 vs 2 倍；發熱 ×1 vs ×4；(2I)²R = 4 I²R
 *   3 線的粗細  9 s  長度、電流相同：細線（一列、熱光強）vs 粗線（三列、熱光弱）；R = ρL ÷ A
 *   4 易過熱處  8 s  接點熱點；捲起／被蓋住熱散不出去（不畫起火冒煙）
 *   5 結論      8 s  三個重點
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EsAnim.ctl.onEnd。
 * EsAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–28px，Noto Sans TC 900（算式 JetBrains Mono）；寫字前一律 measureText。
 * 電流大小只用「1 倍／2 倍」與電子疏密（定性）；數值只用教材既有的 15 A、110 V、1650 W（第 5 步）。
 */
(function () {
  'use strict';
  window.EsAnim = window.EsAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', muted: '#9fb3aa', dim: '#5f7a70', wire: '#9fb3aa',
    electron: '#4dd2ff', energy: '#4dd2ff', energyDim: '#1d5466', heat: '#ff5a3c', hot: '#ff7a4d', panel: '#123329',
    pos: '#ff8040', copper: '#6b4d36', copperEdge: '#d6a676'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const mix = (a, b, k) => {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k, 0, 1))).join(',') + ')';
  };
  const heatRGBA = a => `rgba(255,90,60,${clamp(a, 0, 1)})`;

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
  function para(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || size * 1.32;
    ls.forEach((l, k) => text(ctx, l, x, y + (k - (ls.length - 1) / 2) * h, color, size, align, alpha));
    return ls.length;
  }
  // 多段文字：segs = [[字, 顏色, 字級, 下移, 等寬?]]
  function runsW(ctx, segs) { return segs.reduce((a, g) => a + textW(ctx, g[0], g[2], g[4]), 0); }
  function runs(ctx, segs, x, y, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    const w = runsW(ctx, segs);
    let cx = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    segs.forEach(g => { text(ctx, g[0], cx, y + (g[3] || 0), g[1], g[2], 'left', alpha, g[4]); cx += textW(ctx, g[0], g[2], g[4]); });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  const isZh = () => tr('zh', 'en') === 'zh';

  // ───────── 符號 ─────────
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 6; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 能量方塊：e＝剩下的能量 0～1（同色深淺；有能量才有亮外框）
  function square(ctx, x, y, alpha, e) {
    if (alpha <= 0.01) return;
    const s = 12;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (e > 0.9) { ctx.shadowColor = K.energy; ctx.shadowBlur = 8; }
    ctx.fillStyle = mix(K.energyDim, K.energy, e);
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill();
    ctx.shadowBlur = 0;
    if (e > 0.3) { ctx.strokeStyle = `rgba(214,246,255,${0.95 * e})`; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.restore();
  }
  // 熱紋：在 (x, y0) 往上冒的波浪線
  function wave(ctx, x, y0, h, t, k, len) {
    if (h <= 0.03) return;
    len = len || 18;
    const u = ((t * 0.6 + k * 0.37) % 1 + 1) % 1, yb = y0 - 14 * u;
    ctx.save(); ctx.globalAlpha *= h * (1 - 0.6 * u); ctx.strokeStyle = K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.shadowColor = K.heat; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let s = 0; s <= 16; s++) { const yy = yb - s * len / 16, xx = x + 5 * Math.sin(s / 16 * TAU + t * 3 + k); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke(); ctx.restore();
  }
  function wavesAbove(ctx, x0, x1, y0, n, h, t, seed) {   // h＝熱紋透明度（多寡用條數 n 表示）
    for (let k = 0; k < n; k++) wave(ctx, x0 + (x1 - x0) * (k + 0.5) / n, y0, h, t, k + (seed || 0));
  }
  // 導線段（當元件看）：先 barBody（光暈＋銅芯），畫完電子再 barEdge（外框）
  function barBody(ctx, x0, x1, y, hh, heat) {
    ctx.save();
    if (heat > 0.02) {
      const g = 4 + 10 * heat;
      ctx.shadowColor = heatRGBA(heat); ctx.shadowBlur = 34 * heat;
      ctx.fillStyle = heatRGBA(0.5 * heat);
      rrect(ctx, x0 - g, y - hh / 2 - g, x1 - x0 + 2 * g, hh + 2 * g, hh / 2 + g); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = mix(K.copper, '#c8452c', 0.8 * heat);
    rrect(ctx, x0, y - hh / 2, x1 - x0, hh, Math.min(8, hh / 2)); ctx.fill();
    ctx.restore();
  }
  function barEdge(ctx, x0, x1, y, hh, heat) {
    ctx.save(); ctx.strokeStyle = mix(K.copperEdge, '#ffb08a', heat); ctx.lineWidth = 2.5;
    rrect(ctx, x0, y - hh / 2, x1 - x0, hh, Math.min(8, hh / 2)); ctx.stroke();
    // 截面（左端畫一個橢圓，看得出粗細）
    const rx = Math.max(3, hh * 0.22);
    ctx.fillStyle = mix('#8a6446', '#e0704f', 0.7 * heat);
    ctx.beginPath(); ctx.ellipse(x0, y, rx, hh / 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function wireLine(ctx, pts, color, lw) {
    ctx.save(); ctx.strokeStyle = color || K.wire; ctx.lineWidth = lw || 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  // 直線上往右流的電子
  function lineFlow(ctx, x0, x1, y, sp, d, r, alpha) {
    if (alpha <= 0.01) return;
    const L = x1 - x0, n = Math.max(1, Math.round(L / sp)), gap = L / n;
    for (let k = 0; k < n; k++) {
      const s = ((k * gap + d) % L + L) % L;
      ball(ctx, x0 + s, y, r, alpha * clamp(Math.min(s, L - s) / 14, 0, 1));
    }
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
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u, nx: -g.dy, ny: g.dx };
  }
  function sOf(P, x, y) {
    for (const q of P.seg) {
      const u = (x - q.a.x) * q.dx + (y - q.a.y) * q.dy;
      const px = q.a.x + q.dx * u, py = q.a.y + q.dy * u;
      if (u >= -0.5 && u <= q.len + 0.5 && Math.hypot(px - x, py - y) < 0.5) return q.s0 + u;
    }
    return 0;
  }

  // ───────── 第 1 步：電路幾何 ─────────
  const LX = 130, RX = 560, TOP = 120, BOT = 370, MID = 245;
  const BAT_P = MID - 8, BAT_N = MID + 8;
  const SEG0 = 255, SEG1 = 435, SEGX = (SEG0 + SEG1) / 2, SEG_H = 22;
  const DEV_W = 140, DEV_H = 70;
  const LOOP = mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]);
  const HIDE = LOOP.L - (BAT_N - BAT_P);
  const S_SEG = sOf(LOOP, SEGX, BOT), S_DEV = sOf(LOOP, RX, MID);
  const E_AFTER_WIRE = 0.7;                        // 經過導線段：少掉一點（變熱）
  const MG = { x: 800, y: 250, r: 120 };           // 放大鏡

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['導線電阻', 'Resistance'],
      cap: ['導線也有電阻：電流通過時會發熱', 'Wires have resistance too: current makes them warm'],
      res: ['導線也有電阻。電子通過導線時會和銅原子碰撞，一部分電能轉換成內能（熱），所以導線會變熱：P = I²R。能量大部分仍在電器用掉。',
        'Wires have resistance too. Electrons moving through the wire bump into copper atoms, so part of the electrical energy becomes internal energy (heat) and the wire warms up: P = I²R. Most of the energy is still used in the appliance.'] },
    { dur: 9, b: ['電流加倍', 'Double I'],
      cap: ['同一段導線，電流加倍', 'Same wire, double the current'],
      res: ['同一段導線（電阻 R 相同），電流變成 2 倍時，發熱功率變成 4 倍：(2I)²R = 4 I²R。',
        'In the same wire (same resistance R), when the current doubles, the heating power becomes 4 times: (2I)²R = 4 I²R.'] },
    { dur: 9, b: ['線的粗細', 'Thickness'],
      cap: ['長度、電流都相同：細線 vs 粗線', 'Same length, same current: thin vs thick wire'],
      res: ['長度相同、電流相同時，截面積 A 越大，電阻越小（R = ρL ÷ A，L 是長度），所以粗線發熱較少、細線發熱較多。',
        'With the same length and the same current, a larger cross-sectional area A means a smaller resistance (R = ρL ÷ A, L is the length), so a thick wire heats up less than a thin one.'] },
    { dur: 8, b: ['易過熱處', 'Hot spots'],
      cap: ['這些情況更容易過熱', 'These make overheating more likely'],
      res: ['插頭鬆動或接點氧化，會讓接點的電阻變大，造成局部過熱；延長線捲著用或被物品蓋住，熱散不出去，溫度會越來越高。',
        'A loose plug or an oxidized contact makes the resistance at the contact larger, so that spot overheats. A coiled or covered extension cord cannot get rid of its heat, so its temperature keeps rising.'] },
    { dur: 8, b: ['結論', 'Summary'],
      cap: ['重點整理', 'Key points'],
      res: ['導線也有電阻，電流越大、線越細、接點越差，發熱越多；額定電流是安全上限，發燙或有焦味要立刻停用。動畫僅示意｜不可實驗。',
        'Wires have resistance too: the larger the current, the thinner the wire and the poorer the contact, the more heat. The rated current is the safety limit; if a cord gets hot or smells burnt, stop using it at once. Animation is only a model | Do not try this.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  const V_E = 70;                                   // 電子速度 px/s（只用疏密表示電流大小）

  // ───────── 第 1 步 ─────────
  function battery(ctx) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LX - 36, BAT_P); ctx.lineTo(LX + 36, BAT_P); ctx.stroke();
    ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(LX - 18, BAT_N + 3); ctx.lineTo(LX + 18, BAT_N + 3); ctx.stroke();
    ctx.restore();
  }
  function scene1(ctx, tl, t) {
    const hz = 0.42 * ease((tl - 2.2) / 1.6) * (0.9 + 0.1 * Math.sin(t * 4));   // 微微泛橘
    const mgA = ease((tl - 1.2) / 0.8);
    // 導線
    wireLine(ctx, [{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }]);
    barBody(ctx, SEG0, SEG1, BOT, SEG_H, hz);
    // 電子＋能量方塊
    const n = Math.round(LOOP.L / 58), gap = LOOP.L / n, d = V_E * t;
    for (let k = 0; k < n; k++) {
      const s = ((k * gap + d) % LOOP.L + LOOP.L) % LOOP.L;
      if (s > HIDE - 2) continue;
      const p = at(LOOP, s), fade = clamp(Math.min(s, HIDE - s) / 10, 0, 1);
      const e = s < S_SEG ? 1 : s < S_DEV ? E_AFTER_WIRE : 0;
      square(ctx, p.x + p.nx * 22, p.y + p.ny * 22, fade, e);
      ball(ctx, p.x, p.y, 6, fade);
    }
    barEdge(ctx, SEG0, SEG1, BOT, SEG_H, hz);
    wavesAbove(ctx, SEG0 + 20, SEG1 - 20, BOT - 20, 3, hz * 1.6, t);
    // 電器
    ctx.save(); ctx.fillStyle = '#1f5a49'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, RX - DEV_W / 2, MID - DEV_H / 2, DEV_W, DEV_H, 10); ctx.fill(); ctx.stroke(); ctx.restore();
    text(ctx, tr('電器', 'Appliance'), RX, MID, K.white, 22);
    battery(ctx);
    // 小放大鏡（套在導線段上）
    ctx.save(); ctx.globalAlpha = mgA; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(SEGX, BOT, 36, 0, TAU); ctx.stroke();
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(SEGX + 25, BOT - 25); ctx.lineTo(SEGX + 46, BOT - 46); ctx.stroke();
    ctx.restore();
    // 標籤
    text(ctx, '+', LX + 50, BAT_P - 12, K.pos, 28, 'center', 1, true);
    text(ctx, '−', LX + 34, BAT_N + 16, K.electron, 28, 'center', 1, true);
    para(ctx, tr('電源', 'Power source'), LX - 48, MID, 80, K.white, 22, 'right');
    text(ctx, tr('導線（有電阻）', 'Wire (has resistance)'), SEGX, BOT + 62, K.white, 22);
    magnifier(ctx, tl, t, mgA, hz);
    // 下方重點
    runs(ctx, [[tr('導線也有電阻，電流通過會發熱：', 'Wires have resistance; current makes heat: '), K.white, 24, 0], ['P = I²R', K.yellow, 26, 0, true]],
      W / 2, BY1, 'center', ease((tl - 3.2) / 0.6));
    text(ctx, tr('能量大多在電器用掉，導線上只有少部分變成熱', 'Most energy is used in the appliance; only a little turns to heat in the wire'),
      W / 2, BY2, K.white, 22, 'center', ease((tl - 4.6) / 0.6));
  }
  function magnifier(ctx, tl, t, a, hz) {
    if (a <= 0.01) return;
    const { x: cx, y: cy, r } = MG;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = '#0a1915'; ctx.fill();
    ctx.save(); ctx.clip();
    const hh = clamp(hz / 0.42, 0, 1);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    g.addColorStop(0, heatRGBA(0.32 * hh)); g.addColorStop(1, heatRGBA(0.08 * hh));
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    // 電子（往右，走在原子列之間並上下晃，會撞到原子）
    const lanes = [-46, 0, 46], es = [];
    lanes.forEach((ly, j) => {
      for (let k = 0; k < 5; k++) {
        const u = ((t * 55 + k * 62 + j * 23) % 310 + 310) % 310;
        const x = cx - 155 + u, y = cy + ly + 15 * Math.sin(u / 23 + j);
        es.push({ x, y });
      }
    });
    // 銅原子格點
    for (let row = -2; row <= 1; row++) for (let col = -3; col <= 3; col++) {
      const ax0 = cx + col * 46 + (row % 2 ? 23 : 0), ay0 = cy + (row + 0.5) * 46;
      const jig = (1 + 2.5 * hh), ax = ax0 + jig * Math.sin(t * 19 + row * 3 + col * 7), ay = ay0 + jig * Math.cos(t * 23 + col * 5 + row);
      let near = 0; es.forEach(e => { near = Math.max(near, 1 - Math.hypot(e.x - ax, e.y - ay) / 26); });
      if (near > 0 && hh > 0.05) {
        ctx.save(); ctx.shadowColor = K.heat; ctx.shadowBlur = 16; ctx.fillStyle = heatRGBA(0.75 * near * hh);
        ctx.beginPath(); ctx.arc(ax, ay, 17, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#9a6a45'; ctx.strokeStyle = K.copperEdge; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ax, ay, 10, 0, TAU); ctx.fill(); ctx.stroke();
    }
    es.forEach(e => ball(ctx, e.x, e.y, 6, 1));
    ctx.restore();
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.restore();
    text(ctx, tr('放大看導線裡面', 'Inside the wire (zoomed in)'), cx, cy - r - 26, K.white, 22, 'center', a);
    para(ctx, tr('電子撞到銅原子 → 發熱', 'Electrons bump into copper atoms → heat'), cx, cy + r + 40, 330, K.hot, 22, 'center', ease((tl - 2.6) / 0.6), 28);
  }

  // ───────── 第 2、3 步：左右對照 ─────────
  const COLS = [{ x0: 80, x1: 440 }, { x0: 560, x1: 920 }];
  const LEAD = 30;
  function sideWire(ctx, c, y, hh, heat, rows, sp, t, r, nWaves, alpha, wA) {
    const xa = c.x0 - LEAD, xb = c.x1 + LEAD;
    ctx.save(); ctx.globalAlpha *= alpha;
    wireLine(ctx, [{ x: xa, y }, { x: c.x0, y }]); wireLine(ctx, [{ x: c.x1, y }, { x: xb, y }]);
    barBody(ctx, c.x0, c.x1, y, hh, heat);
    // 中間那列走完整條（含引線）；其他列只在導線段裡（引線很細，擠回一列）
    rows.forEach((dy, j) => dy ? lineFlow(ctx, c.x0 + 4, c.x1 - 4, y + dy, sp, V_E * t + j * sp * 0.37, r, 1) : lineFlow(ctx, xa, xb, y, sp, V_E * t, r, 1));
    if (rows.length > 1) { lineFlow(ctx, xa, c.x0 + 6, y, sp / rows.length, V_E * t, r, 1); lineFlow(ctx, c.x1 - 6, xb, y, sp / rows.length, V_E * t, r, 1); }
    barEdge(ctx, c.x0, c.x1, y, hh, heat);
    wavesAbove(ctx, c.x0 + 10, c.x1 - 10, y - hh / 2 - 16, nWaves, wA, t, c.x0);
    ctx.restore();
  }
  function scene2(ctx, tl, t) {
    const a = ease((tl - 0.3) / 0.6), hA = ease((tl - 1.6) / 1.6);
    const Y = 280;
    text(ctx, tr('同一段導線（電阻 R 相同）', 'The same wire (same resistance R)'), W / 2, 110, K.white, 24, 'center', a);
    const cfg = [
      { lab: ['電流 1 倍', 'Current × 1'], sp: 64, heat: 0.3, nw: 2, out: ['發熱 ×1', 'Heat × 1'] },
      { lab: ['電流 2 倍', 'Current × 2'], sp: 32, heat: 1.0, nw: 8, out: ['發熱 ×4', 'Heat × 4'] }
    ];
    cfg.forEach((g, k) => {
      const c = COLS[k], cx = (c.x0 + c.x1) / 2;
      text(ctx, tr(g.lab[0], g.lab[1]), cx, 165, K.white, 26, 'center', a);
      sideWire(ctx, c, Y, 24, g.heat * hA * (0.9 + 0.1 * Math.sin(t * 5 + k)), [0], g.sp, t, 6, g.nw, a, hA);
      text(ctx, tr(g.out[0], g.out[1]), cx, Y + 62, K.hot, 26, 'center', hA);
    });
    // 中間分隔
    ctx.save(); ctx.globalAlpha = 0.35 * a; ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(W / 2, 150); ctx.lineTo(W / 2, 400); ctx.stroke(); ctx.restore();
    text(ctx, tr('熱紋條數＝發熱多寡：2 條 vs 8 條', 'Count the heat waves: 2 vs 8'), W / 2, 420, K.muted, 22, 'center', ease((tl - 3.0) / 0.6));
    text(ctx, tr('電流 ×2 → 發熱 ×4', 'Current × 2 → heat × 4'), W / 2, BY1, K.yellow, 26, 'center', ease((tl - 3.8) / 0.6));
    runs(ctx, [['P = (2I)²R = 4 I²R', K.white, 26, 0, true]], W / 2, BY2, 'center', ease((tl - 5.0) / 0.6));
  }
  function scene3(ctx, tl, t) {
    const a = ease((tl - 0.3) / 0.6), hA = ease((tl - 1.6) / 1.6);
    const Y = 285;
    text(ctx, tr('長度相同、電流相同', 'Same length, same current'), W / 2, 104, K.white, 24, 'center', a);
    const cfg = [
      { t: ['細線', 'Thin wire'], s: ['截面積小 → 電阻大', 'Small area → large R'], hh: 14, rows: [0], sp: 22, r: 5, heat: 1.0, nw: 8,
        out: ['發熱多', 'More heat'], oc: K.hot },
      { t: ['粗線', 'Thick wire'], s: ['截面積大 → 電阻小', 'Large area → small R'], hh: 66, rows: [-20, 0, 20], sp: 66, r: 6, heat: 0.3, nw: 2,
        out: ['發熱少', 'Less heat'], oc: K.muted }
    ];
    cfg.forEach((g, k) => {
      const c = COLS[k], cx = (c.x0 + c.x1) / 2;
      text(ctx, tr(g.t[0], g.t[1]), cx, 150, K.white, 26, 'center', a);
      text(ctx, tr(g.s[0], g.s[1]), cx, 184, K.cyan, 22, 'center', ease((tl - 1.0) / 0.6));
      sideWire(ctx, c, Y, g.hh, g.heat * hA * (0.9 + 0.1 * Math.sin(t * 5 + k)), g.rows, g.sp, t, g.r, g.nw, a, hA);
      // 長度 L 尺標
      const yL = 352;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c.x0, yL - 8); ctx.lineTo(c.x0, yL + 8); ctx.moveTo(c.x1, yL - 8); ctx.lineTo(c.x1, yL + 8);
      ctx.moveTo(c.x0, yL); ctx.lineTo(cx - 20, yL); ctx.moveTo(cx + 20, yL); ctx.lineTo(c.x1, yL); ctx.stroke(); ctx.restore();
      text(ctx, 'L', cx, yL, K.white, 24, 'center', a, true);
      text(ctx, tr(g.out[0], g.out[1]), cx, 400, g.oc, 26, 'center', hA);
    });
    ctx.save(); ctx.globalAlpha = 0.35 * a; ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(W / 2, 135); ctx.lineTo(W / 2, 420); ctx.stroke(); ctx.restore();
    runs(ctx, [[tr('截面積 A 越大，電阻 R 越小：', 'Larger area A, smaller resistance R: '), K.white, 24, 0], ['R = ρL ÷ A', K.yellow, 26, 0, true]],
      W / 2, BY1, 'center', ease((tl - 3.6) / 0.6));
    text(ctx, tr('同樣電流，粗線發熱較少', 'Same current: the thick wire heats up less'), W / 2, BY2, K.yellow, 24, 'center', ease((tl - 4.8) / 0.6));
  }

  // ───────── 第 4 步：易過熱的情況 ─────────
  const P4 = [{ x: 30, cx: 260 }, { x: 510, cx: 740 }], PW = 460, PY = 88, PH = 374, CY4 = 285;
  // 延長線捲起來：側看的線圈（θ 從 π 到 9π，4 圈）
  const COIL = (() => {
    const k = 4.5, rx = 24, ry = 42, cx = P4[1].cx, a0 = cx - k * 5 * Math.PI, pts = [{ x: cx - 135, y: CY4 + ry }];
    for (let th = Math.PI; th <= 9 * Math.PI + 1e-6; th += 0.12) pts.push({ x: a0 + k * th + rx * Math.sin(th), y: CY4 - ry * Math.cos(th) });
    pts.push({ x: cx + 135, y: CY4 + ry });
    return mkPath(pts);
  })();
  function panel(ctx, p, col, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K.panel; ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    rrect(ctx, p.x, PY, PW, PH, 16); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function scene4(ctx, tl, t) {
    const a1 = ease((tl - 0.3) / 0.6), a2 = ease((tl - 3.0) / 0.6);
    // ① 插頭鬆動／接點氧化
    if (a1 > 0.01) {
      const p = P4[0], cy = CY4, h1 = ease((tl - 1.0) / 1.4) * (0.85 + 0.15 * Math.sin(t * 6));
      panel(ctx, p, K.orange, a1);
      ctx.save(); ctx.globalAlpha = a1;
      const PX0 = 196, PX1 = 258, SX0 = 300, SX1 = 396, PR = [cy - 12, cy + 12];
      // 熱點光暈（接點）
      if (h1 > 0.02) {
        const g = ctx.createRadialGradient(SX0, cy, 4, SX0, cy, 74);
        g.addColorStop(0, heatRGBA(0.95 * h1)); g.addColorStop(0.45, heatRGBA(0.45 * h1)); g.addColorStop(1, heatRGBA(0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SX0, cy, 74, 0, TAU); ctx.fill();
      }
      wireLine(ctx, [{ x: 66, y: cy }, { x: PX0, y: cy }], K.wire, 14);
      wireLine(ctx, [{ x: SX1, y: cy }, { x: 470, y: cy }], K.wire, 14);
      // 電子：線 → 插頭 → 插腳（只有一點點插進插座）→ 插座 → 線
      const path = [{ x: 66, y: cy }, { x: 226, y: cy }, { x: 226, y: PR[0] }, { x: 340, y: PR[0] }, { x: 340, y: cy }, { x: 470, y: cy }];
      const P = mkPath(path), n = Math.round(P.L / 40), gap = P.L / n;
      // 插腳（金屬）
      ctx.save(); ctx.lineCap = 'butt';
      PR.forEach(y => { ctx.strokeStyle = mix('#c9ced1', '#ff9a7a', h1); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(PX1, y); ctx.lineTo(SX0 + 12, y); ctx.stroke(); });
      ctx.restore();
      for (let k = 0; k < n; k++) {
        const s = ((k * gap + V_E * t) % P.L + P.L) % P.L, q = at(P, s);
        ball(ctx, q.x, q.y, 5, clamp(Math.min(s, P.L - s) / 14, 0, 1));
      }
      // 氧化斑點（插腳上）
      ctx.fillStyle = '#4a3322';
      PR.forEach(y => [[270, -2], [281, 2], [291, -1]].forEach(([x, dy]) => { ctx.beginPath(); ctx.arc(x, y + dy, 2.6, 0, TAU); ctx.fill(); }));
      // 插頭本體、插座（最後畫）
      ctx.fillStyle = '#2a3d36'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
      rrect(ctx, PX0, cy - 34, PX1 - PX0, 68, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1b2e28'; ctx.strokeStyle = K.muted;
      rrect(ctx, SX0, cy - 46, SX1 - SX0, 92, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
      text(ctx, tr('① 插頭鬆動／接點氧化', '① Loose plug / oxidized contact'), p.cx, 124, K.orange, 24, 'center', a1);
      text(ctx, tr('插頭', 'Plug'), (PX0 + PX1) / 2, cy + 62, K.white, 22, 'center', a1);
      text(ctx, tr('插座', 'Socket'), (SX0 + SX1) / 2, cy + 74, K.muted, 22, 'center', a1);
      text(ctx, tr('熱點', 'Hot spot'), SX0, cy - 92, K.hot, 22, 'center', ease((tl - 1.6) / 0.6));
      para(ctx, tr('接點電阻變大，局部過熱', 'Higher contact resistance →\nlocal overheating'), p.cx, 422, PW - 40, K.hot, 22, 'center', ease((tl - 1.8) / 0.6), 28);
    }
    // ② 延長線捲起來／被蓋住
    if (a2 > 0.01) {
      const p = P4[1], cx = p.cx, cy = CY4, R = 112, h2 = ease((tl - 3.6) / 2.8);
      panel(ctx, p, K.orange, a2);
      ctx.save(); ctx.globalAlpha = a2;
      // 累積的熱（圈內越來越亮）
      if (h2 > 0.02) {
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
        g.addColorStop(0, heatRGBA(0.55 * h2)); g.addColorStop(0.8, heatRGBA(0.3 * h2)); g.addColorStop(1, heatRGBA(0.1 * h2));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      }
      ctx.save(); ctx.strokeStyle = mix('#9fb3aa', '#ff8a66', h2); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); COIL.pts.forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); ctx.restore();
      const n = Math.round(COIL.L / 42), gap = COIL.L / n;
      for (let k = 0; k < n; k++) {
        const s = ((k * gap + V_E * t) % COIL.L + COIL.L) % COIL.L, q = at(COIL, s);
        ball(ctx, q.x, q.y, 5, clamp(Math.min(s, COIL.L - s) / 14, 0, 1));
      }
      // 往外冒的熱紋，碰到圈就消失（散不出去）
      for (let k = 0; k < 8; k++) {
        const ang = k / 8 * TAU + 0.2, u = ((t * 0.5 + k * 0.27) % 1 + 1) % 1, d0 = 52 + 44 * u;
        const dx = Math.cos(ang), dy = Math.sin(ang);
        ctx.save(); ctx.globalAlpha *= h2 * (1 - u) * 0.9 + 0.1 * h2; ctx.strokeStyle = K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.shadowColor = K.heat; ctx.shadowBlur = 6; ctx.beginPath();
        for (let s = 0; s <= 10; s++) { const rr = d0 + s * 1.6, w = 4 * Math.sin(s / 10 * TAU + t * 3 + k); const x = cx + dx * rr - dy * w, y = cy + dy * rr + dx * w; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
      // 擋住熱的圈
      ctx.save(); ctx.strokeStyle = heatRGBA(0.5 + 0.5 * h2); ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.shadowColor = K.heat; ctx.shadowBlur = 10 * h2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.restore();
      // 蓋在上面的物品
      ctx.fillStyle = '#3a4a44'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
      rrect(ctx, cx - 70, cy - 74, 140, 44, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
      text(ctx, tr('物品', 'Cover'), cx, cy - 52, K.white, 22, 'center', a2);
      text(ctx, tr('② 延長線捲著用／被蓋住', '② Coiled or covered cord'), cx, 124, K.orange, 24, 'center', a2);
      text(ctx, tr('熱散不出去', 'The heat cannot escape'), cx, 422, K.hot, 22, 'center', ease((tl - 4.2) / 0.6));
    }
    bottomOne(ctx, tr('電阻大的地方、散熱差的地方，溫度越升越高', 'Where resistance is high or heat cannot escape, the temperature keeps rising'), K.yellow, ease((tl - 5.4) / 0.6));
  }
  function bottomOne(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }

  // ───────── 第 5 步：三個重點 ─────────
  const ROWS5 = [
    { y: 140, s: ['電流越大，發熱越多（I²）', 'Larger current → more heat (I²)'] },
    { y: 266, s: ['線越細、接點越差，電阻越大，發熱越多', 'Thinner wire, poorer contact → larger R → more heat'] },
    { y: 400, s: ['額定電流是安全上限（例：15 A，110 V → 1650 W）\n電線發燙、有焦味就停止使用',
      'Rated current is the safety limit (e.g. 15 A, 110 V → 1650 W)\nIf a cord gets hot or smells burnt, stop using it.'] }
  ];
  function scene5(ctx, tl, t) {
    ROWS5.forEach((r, k) => {
      const a = ease((tl - 0.3 - k * 2.0) / 0.6);
      if (a <= 0.01) return;
      const cy = r.y, ix = 150;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
      rrect(ctx, 40, cy - 54, 920, 108, 14); ctx.fill(); ctx.stroke();
      if (k === 0) {
        const hz = 0.9 + 0.1 * Math.sin(t * 5);
        barBody(ctx, 90, 210, cy, 18, hz);
        lineFlow(ctx, 70, 230, cy, 16, V_E * t, 5, 1);
        barEdge(ctx, 90, 210, cy, 18, hz);
        wavesAbove(ctx, 92, 208, cy - 14, 4, hz, t);
      } else if (k === 1) {
        const hz = 0.9 + 0.1 * Math.sin(t * 5);
        barBody(ctx, 90, 210, cy + 6, 8, 0.6);
        lineFlow(ctx, 70, 230, cy + 6, 18, V_E * t, 4, 1);
        barEdge(ctx, 90, 210, cy + 6, 8, 0.6);
        const g = ctx.createRadialGradient(ix, cy + 6, 2, ix, cy + 6, 34);
        g.addColorStop(0, heatRGBA(0.95 * hz)); g.addColorStop(1, heatRGBA(0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, cy + 6, 34, 0, TAU); ctx.fill();
        wavesAbove(ctx, 120, 180, cy - 4, 2, hz, t, 3);
      } else {
        ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.fillStyle = '#0a1915';
        rrect(ctx, ix - 58, cy - 28, 116, 56, 10); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      if (k === 2) text(ctx, '15 A', ix, cy, K.yellow, 26, 'center', a, true);
      para(ctx, tr(r.s[0], r.s[1]), 260, cy, 670, K.white, 24, 'left', a, 32);
    });
  }

  // ───────── 圖例、說明句、進度條 ─────────
  const BY1 = 492, BY2 = 524;
  function drawLegend(ctx, showEnergy) {
    const items = [[tr('藍球＝電子，從負極出發', 'Blue ball = electron, from − end'), 'b']];
    if (showEnergy) items.push([tr('藍方塊＝能量（教學符號）', 'Blue square = energy'), 's']);
    items.push([tr('橘紅光＝導線發熱', 'Orange glow = wire heating'), 'h']);
    const z = 22, gapIcon = 28, gapItem = 30, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [568] : [551, 579];
    rows.forEach((row, r) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 's') square(ctx, x + 10, y, 1, 1);
        else if (kind === 'b') ball(ctx, x + 10, y, 6, 1);
        else {
          ctx.save(); ctx.shadowColor = K.heat; ctx.shadowBlur = 10; ctx.strokeStyle = K.hot; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 19, y); ctx.stroke(); ctx.restore();
        }
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
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
  function drawScene(ctx, i, tl, t) {
    [scene1, scene2, scene3, scene4, scene5][i](ctx, tl, t);
    drawLegend(ctx, i === 0);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('heatAnimCanvas');
  const ctl = () => window.EsAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('heatAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl, S.t);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-heat');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-heat'); if (!row) return;
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

  window.EsAnim.heat = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-heat'); if (row) row.innerHTML = '';
      const r = document.getElementById('heatAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { heat: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'heat' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
