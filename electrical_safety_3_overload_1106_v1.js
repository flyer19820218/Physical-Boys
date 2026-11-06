/* electrical_safety_3_overload_1106_v1.js — 「並聯與過載」分頁動畫（#overloadAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EsAnim.overload = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'overload'。畫布不綁任何事件；唯一控制是 #steps-overload 裡的 5 個步驟鈕；結果框 #overloadAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。電路：左幹線 x=140（電池在 y=260：上長細＝正極、下短粗＝負極），
 *   上導線 y=130、下導線 y=390；三條並聯支路 x=380（檯燈）、510（吹風機）、640（電鍋），電器畫在支路正中央 y=260。
 *   「幹線」＝電源到第一條支路那段（左幹線＋上下導線 x 140～380）；第 4 步只有這段發熱。
 *   未接上的支路淡出，支路上端 y 158～194 留真正的缺口（刀形開關打開）；接上＝刀片轉回、缺口閉合。
 *   每條支路一個電子迴路：負極 → 下導線 → 該支路往上 → 上導線往左 → 正極；幹線上幾個迴路疊在一起＝電子變密。
 *   能量方塊在電子外側 18px，跟著電子走，在該支路的電器（元件座標）處變暗。
 *   右側 x 760～980：總電流表（橫條 0～22 A，10 px/A，15 A 上限線）；下方 y≈492/524：本步算式；最下方圖例。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 並聯供電  8 s  只接檯燈；I總 = I₁ = 100 ÷ 110 ≈ 0.9 A；各支路電壓相同 110 V
 *   2 接吹風機  8 s  吹風機支路接上；檯燈支路不變；幹線變密；I總 ≈ 0.9 + 10.9 = 11.8 A（綠，在上限內）
 *   3 接電鍋    9 s  電鍋支路接上；I總 ≈ 0.9 + 10.9 + 9.1 = 20.9 A，越過 15 A 上限線、條變橘紅
 *   4 幹線發熱  8 s  三個電器照常（支路電流與第 3 步相同）；只有幹線發橘紅光、冒熱紋
 *   5 結論      9 s  兩欄對照：短路 vs 過載（各附小電路）＋底部重點句
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EsAnim.ctl.onEnd。
 * EsAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–28px，Noto Sans TC 900（算式 JetBrains Mono）；寫字前一律 measureText。
 * 電子疏密只是定性表示，不照比例。數值只用教材既有的：110 V、15 A、100／1200／1000 W、0.9／10.9／9.1 A。
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
    pos: '#ff8040', light: '#fff3c4'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const mix = (a, b, k) => {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',') + ')';
  };

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
  function square(ctx, x, y, alpha, full) {
    if (alpha <= 0.01) return;
    const s = 12;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (full) { ctx.shadowColor = K.energy; ctx.shadowBlur = 8; }
    ctx.fillStyle = full ? K.energy : K.energyDim;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill();
    ctx.shadowBlur = 0;
    if (full) { ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke(); }   // 亮外框＝有能量
    ctx.restore();
  }

  // ───────── 電路幾何 ─────────
  const LX = 140, TOP = 130, BOT = 390, MID = 260;
  const BAT_P = MID - 8, BAT_N = MID + 8;          // 正極板（上，長細）、負極板（下，短粗）
  const XS = [380, 510, 640];                      // 檯燈、吹風機、電鍋
  const GAP0 = TOP + 28, GAP1 = TOP + 64;          // 支路上端缺口（開關）
  const BULB_R = 26, BOX_W = 116;
  const DEV = [
    { name: ['檯燈', 'Desk lamp'], p: '100 W', i: '0.9 A', sub: '₁', sp: 120 },
    { name: ['吹風機', 'Hair dryer'], p: '1200 W', i: '10.9 A', sub: '₂', sp: 40 },
    { name: ['電鍋', 'Rice cooker'], p: '1000 W', i: '9.1 A', sub: '₃', sp: 46 }
  ];

  function mkPath(pts) {
    const seg = []; let L = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      seg.push({ a, b, len, s0: L, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }); L += len;
    }
    return { pts, seg, L };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u, nx: -g.dy, ny: g.dx };   // n＝逆時針迴路的外側
  }
  function sOf(P, x, y) {                          // 元件座標 → 路徑上的弧長
    for (const q of P.seg) {
      const u = (x - q.a.x) * q.dx + (y - q.a.y) * q.dy;
      const px = q.a.x + q.dx * u, py = q.a.y + q.dy * u;
      if (u >= -0.5 && u <= q.len + 0.5 && Math.hypot(px - x, py - y) < 0.5) return q.s0 + u;
    }
    return 0;
  }
  // 每條支路一個迴路（從負極出發，最後一小段是電池內部，隱藏）
  const LOOPS = XS.map(x => mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x, y: BOT }, { x, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]));
  const HIDES = LOOPS.map(P => P.L - (BAT_N - BAT_P));
  const DROPS = LOOPS.map((P, k) => sOf(P, XS[k], MID));   // 能量在該支路電器（元件座標）用掉
  // 短路小圖用：沒有電器、導線直接把電源兩端接起來
  const LOOP_SC = mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: XS[1], y: BOT }, { x: XS[1], y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]);
  const HIDE_SC = LOOP_SC.L - (BAT_N - BAT_P);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['並聯供電', 'Parallel'],
      cap: ['只接檯燈：電子繞一圈，能量在檯燈用掉', 'Only the lamp: electrons go around, the lamp uses the energy'],
      res: ['只接檯燈：電子從負極出發繞一圈，能量在檯燈轉換成光和熱。並聯時各支路電壓相同，都是 110 V；I<sub>1</sub> = 100 ÷ 110 ≈ 0.9 A。',
        'Only the lamp: electrons leave the − end and go around; the lamp turns their energy into light and heat. In parallel every branch gets the same 110 V; I<sub>1</sub> = 100 ÷ 110 ≈ 0.9 A.'] },
    { dur: 8, b: ['接吹風機', 'Dryer'],
      cap: ['再接上吹風機：多一條並聯支路', 'Plug in the hair dryer: one more parallel branch'],
      res: ['再接上吹風機：多一條並聯支路，檯燈那條的電流不變；兩條支路的電流在幹線匯合，I<sub>總</sub> = I<sub>1</sub> + I<sub>2</sub> ≈ 0.9 + 10.9 = 11.8 A，還在 15 A 以內。',
        'Plug in the hair dryer: one more parallel branch, and the lamp branch does not change. The two branch currents join in the main wire: I<sub>total</sub> = I<sub>1</sub> + I<sub>2</sub> ≈ 0.9 + 10.9 = 11.8 A, still within 15 A.'] },
    { dur: 9, b: ['接電鍋', 'Cooker'],
      cap: ['再接上電鍋：總電流超過 15 A 上限', 'Plug in the rice cooker: total current passes 15 A'],
      res: ['再接上電鍋：I<sub>總</sub> = I<sub>1</sub> + I<sub>2</sub> + I<sub>3</sub> ≈ 0.9 + 10.9 + 9.1 = 20.9 A，超過這條分路 15 A 的上限。',
        'Plug in the rice cooker: I<sub>total</sub> = I<sub>1</sub> + I<sub>2</sub> + I<sub>3</sub> ≈ 0.9 + 10.9 + 9.1 = 20.9 A, over the 15 A limit of this circuit.'] },
    { dur: 8, b: ['幹線發熱', 'Hot wire'],
      cap: ['幹線發熱：電器都正常，總電流太大', 'The main wire heats up: devices fine, current too big'],
      res: ['三個電器都照常工作，每條支路的電流都沒有變；但所有支路的電流都要流過幹線，幹線承受的總電流太大而發熱。',
        'All three devices work normally and no branch current has changed; but every branch current must flow through the main wire, so it carries too much total current and heats up.'] },
    { dur: 9, b: ['結論', 'Summary'],
      cap: ['短路 vs 過載', 'Short circuit vs overload'],
      res: ['過載不是電器壞了，而是並聯的電器接太多，總電流超過線路能安全承受的範圍，幹線會發熱，所以線路上要有保護裝置。動畫僅示意｜不可實驗。',
        'Overload does not mean a device is broken: too many devices are connected in parallel, so the total current is more than the wiring can safely carry and the main wire heats up. That is why circuits need protective devices. Animation is only a model | Do not try this.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const V_E = 70;                                   // 電子速度 px/s（各支路相同，只用疏密表示電流大小）
  const SW_A = 1.0, SW_B = 2.4, FL_B = 3.2;         // 接上：開關 1.0～2.4 s 閉合，2.4～3.2 s 電子流進來
  const ITOT = [0.9, 11.8, 20.9, 20.9];
  function state(i, tl) {
    const st = { vis: [1, 0.28, 0.28], c: [1, 0, 0], f: [1, 0, 0], heat: 0 };
    const connect = k => {
      st.vis[k] = 0.28 + 0.72 * ease((tl - 0.3) / 0.6);
      st.c[k] = ease((tl - SW_A) / (SW_B - SW_A));
      st.f[k] = ease((tl - SW_B) / (FL_B - SW_B));
    };
    const on = k => { st.vis[k] = 1; st.c[k] = 1; st.f[k] = 1; };
    if (i === 1) connect(1);
    else if (i === 2) { on(1); connect(2); }
    else if (i >= 3) { on(1); on(2); st.heat = i === 3 ? ease((tl - 0.6) / 1.6) : 1; }
    st.amp = 0.9 * st.f[0] + 10.9 * st.f[1] + 9.1 * st.f[2];
    return st;
  }

  // ───────── 畫電路（只畫圖形；電器方塊裡的名稱另由 opt.text 控制） ─────────
  function wirePath(ctx, pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  const TRUNK = [[{ x: XS[0], y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }], [{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: XS[0], y: BOT }]];
  function trunkGlow(ctx, h) {
    if (h <= 0.02) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = `rgba(255,90,60,${h})`; ctx.shadowBlur = 24 * h;
    ctx.strokeStyle = `rgba(255,90,60,${0.55 * h})`; ctx.lineWidth = 6 + 14 * h;
    TRUNK.forEach(p => { wirePath(ctx, p); ctx.stroke(); });
    ctx.restore();
  }
  function heatWaves(ctx, h, t) {
    if (h <= 0.05) return;
    for (let k = 0; k < 6; k++) {
      const u = ((t * 0.6 + k * 0.29) % 1 + 1) % 1, x0 = LX + 36 + k * 36, y0 = TOP - 20 - 12 * u;
      ctx.save(); ctx.globalAlpha = h * (1 - 0.6 * u); ctx.strokeStyle = K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.shadowColor = K.heat; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let s = 0; s <= 16; s++) { const yy = y0 - s; const xx = x0 + 5 * Math.sin(s / 16 * TAU + t * 3 + k); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
    }
  }
  function bulbGlow(ctx, b, t) {
    if (b <= 0.02) return;
    const X = XS[0];
    ctx.save();
    const g = ctx.createRadialGradient(X, MID, BULB_R * 0.6, X, MID, BULB_R + 44);
    g.addColorStop(0, `rgba(255,243,196,${0.55 * b})`); g.addColorStop(1, 'rgba(255,243,196,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, MID, BULB_R + 44, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,243,196,${0.85 * b})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.39, r0 = BULB_R + 9, r1 = BULB_R + 19 + 3 * Math.sin(t * 4 + k);
      if (Math.abs(Math.cos(a)) < 0.25) continue;             // 上下是導線方向，不畫光芒
      ctx.beginPath(); ctx.moveTo(X + r0 * Math.cos(a), MID + r0 * Math.sin(a));
      ctx.lineTo(X + r1 * Math.cos(a), MID + r1 * Math.sin(a)); ctx.stroke();
    }
    ctx.restore();
  }
  function bulbBody(ctx, b) {
    const X = XS[0];
    ctx.save();
    ctx.fillStyle = b > 0.02 ? mix('#1b3a31', '#fff3c4', 0.85 * b) : '#1b3a31';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(X, MID, BULB_R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = b > 0.02 ? mix('#9fb3aa', '#ff9a3c', b) : '#9fb3aa'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(X, MID + BULB_R); ctx.lineTo(X, MID + 12);
    for (let k = 0; k <= 6; k++) ctx.lineTo(X + (k % 2 ? 8 : -8), MID + 12 - k * 4);
    ctx.lineTo(X, MID - 12); ctx.lineTo(X, MID - BULB_R); ctx.stroke();
    ctx.restore();
  }
  function devBox(ctx, k, on, withText) {
    const d = DEV[k], X = XS[k];
    const ls = withText ? wrap(ctx, tr(d.name[0], d.name[1]), BOX_W - 20, 22) : ['', ''];
    const h = (ls.length + 1) * 28 + 14;
    ctx.save();
    ctx.fillStyle = mix('#123329', '#1f5a49', on); ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, X - BOX_W / 2, MID - h / 2, BOX_W, h, 10); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!withText) return;
    const y0 = MID - h / 2 + 7 + 14;
    ls.forEach((l, j) => text(ctx, l, X, y0 + j * 28, K.white, 22));
    text(ctx, d.p, X, y0 + ls.length * 28, K.white, 22, 'center', 1, true);
  }
  function battery(ctx) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LX - 36, BAT_P); ctx.lineTo(LX + 36, BAT_P); ctx.stroke();   // 正極：長細
    ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(LX - 18, BAT_N + 3); ctx.lineTo(LX + 18, BAT_N + 3); ctx.stroke();   // 負極：短粗
    ctx.restore();
  }
  // 支路開關：下接點 (X, GAP1) 為轉軸，刀片長 GAP1−GAP0；c=0 張開 38°（往右），c=1 閉合
  function switchBlade(ctx, X, c) {
    const L = GAP1 - GAP0, a = (1 - c) * 38 * Math.PI / 180;
    ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X, GAP1); ctx.lineTo(X + L * Math.sin(a), GAP1 - L * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = K.white;
    [GAP0, GAP1].forEach(y => { ctx.beginPath(); ctx.arc(X, y, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  // 沿迴路放電子（＋能量方塊）
  function flow(ctx, P, hide, d, sp, alpha, dropAt, sqA) {
    if (alpha <= 0.01) return;
    const n = Math.max(1, Math.round(P.L / sp)), gap = P.L / n;
    for (let k = 0; k < n; k++) {
      const s = ((k * gap + d) % P.L + P.L) % P.L;
      if (s > hide - 2) continue;                         // 電池內部不畫
      const p = at(P, s);
      const fade = clamp(Math.min(s, hide - s) / 10, 0, 1);
      if (sqA > 0) square(ctx, p.x + p.nx * 18, p.y + p.ny * 18, alpha * fade * sqA, dropAt === undefined ? true : s < dropAt);
      ball(ctx, p.x, p.y, 6, alpha * fade);
    }
  }
  function drawCircuit(ctx, st, t, opt) {
    opt = opt || {};
    const sqA = opt.squares === false ? 0 : 1, withText = opt.text !== false;
    bulbGlow(ctx, st.f[0], t);
    trunkGlow(ctx, st.heat * (0.85 + 0.15 * Math.sin(t * 5)));
    // 導線：幹線＋檯燈支路
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
    ctx.strokeStyle = mix('#9fb3aa', '#ff7a4d', clamp(st.heat, 0, 1));
    TRUNK.forEach(p => { wirePath(ctx, p); ctx.stroke(); });
    ctx.strokeStyle = K.wire;
    wirePath(ctx, [{ x: XS[0], y: TOP }, { x: XS[0], y: BOT }]); ctx.stroke();
    // 吹風機、電鍋支路：上下導線延伸＋支路（上端留缺口給開關）
    for (let k = 1; k < 3; k++) {
      ctx.save(); ctx.globalAlpha *= st.vis[k];
      wirePath(ctx, [{ x: XS[k - 1], y: TOP }, { x: XS[k], y: TOP }, { x: XS[k], y: GAP0 }]); ctx.stroke();
      wirePath(ctx, [{ x: XS[k - 1], y: BOT }, { x: XS[k], y: BOT }, { x: XS[k], y: GAP1 }]); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // 電子（＋能量方塊）
    for (let k = 0; k < 3; k++) flow(ctx, LOOPS[k], HIDES[k], V_E * t + k * 13, DEV[k].sp, st.f[k], DROPS[k], sqA);
    heatWaves(ctx, st.heat * (opt.waves === false ? 0 : 1), t);
    // 元件（最後畫）
    for (let k = 1; k < 3; k++) {
      ctx.save(); ctx.globalAlpha *= st.vis[k];
      switchBlade(ctx, XS[k], st.c[k]);
      devBox(ctx, k, st.f[k], withText);
      ctx.restore();
    }
    bulbBody(ctx, st.f[0]);
    battery(ctx);
    // 並聯節點
    ctx.save(); ctx.fillStyle = K.white;
    for (let k = 0; k < 2; k++) {
      const a = st.c[k + 1] >= 1 ? 1 : 0;
      if (!a) continue;
      [TOP, BOT].forEach(y => { ctx.beginPath(); ctx.arc(XS[k], y, 7, 0, TAU); ctx.fill(); });
    }
    ctx.restore();
  }
  function circuitLabels(ctx, st) {
    text(ctx, '+', LX + 50, BAT_P - 12, K.pos, 28, 'center', 1, true);
    text(ctx, '−', LX + 34, BAT_N + 16, K.electron, 28, 'center', 1, true);
    para(ctx, tr('電源', 'Power source'), LX - 48, MID - 16, 86, K.white, 22, 'right');
    text(ctx, '110 V', LX - 48, MID + (isZh() ? 16 : 30), K.white, 22, 'right', 1, true);
    // 檯燈名稱（燈泡左側）
    text(ctx, tr(DEV[0].name[0], DEV[0].name[1]), XS[0] - 60, MID - 14, K.white, 22, 'right');
    text(ctx, DEV[0].p, XS[0] - 60, MID + 14, K.white, 22, 'right', 1, true);
    // 各支路電流（支路左側）
    for (let k = 0; k < 3; k++) {
      const a = st.f[k];
      runs(ctx, [['I' + DEV[k].sub + ' ≈', K.white, 22, 0, true]], XS[k] - 12, TOP + 30, 'right', a);
      text(ctx, DEV[k].i, XS[k] - 12, TOP + 58, K.white, 22, 'right', a, true);
    }
    // 幹線
    const hot = st.heat;
    const lb = hot > 0.5 ? tr('幹線發熱', 'Main wire heats up') : tr('幹線', 'Main wire');
    text(ctx, lb, (LX + XS[0]) / 2, BOT + 42, hot > 0.5 ? K.hot : K.white, 24, 'center');
  }

  // ───────── 總電流表（右側橫條） ─────────
  const MX = 760, MW = 220, PPA = 10, LIM = MX + 15 * PPA, MY = 236, MH = 30;
  const Itot = (c, z) => [['I', c, z || 28, 0, true], [tr('總', 'total'), c, 22, 7]];
  function meter(ctx, st, i, tl) {
    const cx = MX + MW / 2;
    text(ctx, tr('總電流表', 'Total current'), cx, 160, K.white, 24);
    // 數值：只顯示定值（長條在變的時候不寫中間數字）
    let aOld = 0, aNew = 1;
    if (i === 0) aNew = ease((tl - 1.0) / 0.5);
    else if (i === 1 || i === 2) { aOld = 1 - ease((tl - 2.1) / 0.3); aNew = ease((tl - 3.4) / 0.4); }
    const val = (v, a) => {
      const c = v > 15 ? K.hot : K.green;
      runs(ctx, Itot(c).concat([[' ≈ ' + v.toFixed(1) + ' A', c, 28, 0, true]]), cx, 200, 'center', a);
    };
    if (aOld > 0.01) val(ITOT[i - 1], aOld);
    val(ITOT[Math.min(i, 3)], aNew);
    // 橫條
    ctx.save();
    ctx.fillStyle = '#0a1713'; ctx.strokeStyle = K.muted; ctx.lineWidth = 2;
    rrect(ctx, MX, MY, MW, MH, 6); ctx.fill(); ctx.stroke();
    const w = Math.min(MW, st.amp * PPA);
    if (w > 0.5) {
      const over = clamp((st.amp - 15) / 0.8, 0, 1);
      ctx.fillStyle = mix('#4ade80', '#ff5a3c', over);
      if (over > 0) { ctx.shadowColor = `rgba(255,90,60,${0.8 * over})`; ctx.shadowBlur = 14 * over; }
      rrect(ctx, MX + 2, MY + 2, Math.max(4, w - 4), MH - 4, 4); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // 15 A 上限線
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(LIM, MY - 12); ctx.lineTo(LIM, MY + MH + 12); ctx.stroke();
    ctx.restore();
    text(ctx, '0', MX, MY + MH + 30, K.muted, 22, 'center', 1, true);
    runs(ctx, [['15 A', K.white, 22, 0, true], [tr(' 上限', ' limit'), K.white, 22, 0]], LIM, MY + MH + 30, 'center');
  }

  // ───────── 各步驟的標註（下方兩行） ─────────
  const BY1 = 492, BY2 = 524;
  const Wt = (s, c, z) => [s, c || K.white, z || 24, 0], Mo = (s, c, z) => [s, c || K.white, z || 26, 0, true];
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function drawNotes(ctx, i, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    const I = c => Itot(c || K.white, 26);
    if (i === 0) {
      runs(ctx, I().concat([Mo(' = I₁ = P ÷ V = 100 ÷ 110 ≈ '), Mo('0.9 A', K.green)]), W / 2, BY1, 'center', a(1.6));
      runs(ctx, [Wt(tr('各支路電壓相同：', 'Every branch has the same voltage: ')), Mo('110 V', K.yellow)], W / 2, BY2, 'center', a(2.8));
    } else if (i === 1) {
      runs(ctx, I().concat([Mo(' = I₁ + I₂ ≈ 0.9 + 10.9 = '), Mo('11.8 A', K.green)]), W / 2, BY1, 'center', a(3.8));
      text(ctx, tr('檯燈那條不變；兩條支路的電流在幹線匯合', 'The lamp branch is unchanged; both currents join in the main wire'), W / 2, BY2, K.white, 24, 'center', a(4.8));
    } else if (i === 2) {
      runs(ctx, I().concat([Mo(' = I₁ + I₂ + I₃ ≈ 0.9 + 10.9 + 9.1 = '), Mo('20.9 A', K.hot)]), W / 2, BY1, 'center', a(3.8));
      text(ctx, tr('總電流超過 15 A 上限', 'The total current is over the 15 A limit'), W / 2, BY2, K.hot, 24, 'center', a(4.8));
    } else if (i === 3) {
      text(ctx, tr('每個電器都正常，是幹線承受的總電流太大', 'Every device works normally; the main wire carries too much current'), W / 2, BY1, K.yellow, 24, 'center', a(2.0));
      runs(ctx, [Wt(tr('所有支路的電流都流過幹線：', 'All branch currents flow through the main wire: '))].concat(I(K.hot), [Mo(' ≈ 20.9 A', K.hot)]), W / 2, BY2, 'center', a(3.2));
    }
  }

  // ───────── 第 5 步：兩欄對照 ─────────
  const PANELS = [
    { x: 30, title: ['短路', 'Short circuit'], col: K.orange,
      body: ['導線把電源兩端幾乎直接連起來\n（電阻很小）→ 電流很大', 'A wire joins the two ends of the source almost directly (very small resistance) → very large current'] },
    { x: 510, title: ['過載', 'Overload'], col: K.cyan,
      body: ['電器都正常，接太多並聯支路\n→ 總電流太大', 'The devices are fine, but too many parallel branches → total current too large'] }
  ];
  const PW = 460, PY = 82, PH = 384, MS = 0.6;
  function drawSummary(ctx, tl, t) {
    PANELS.forEach((pn, k) => {
      const al = ease((tl - 0.3 - k * 0.9) / 0.7);
      if (al <= 0.01) return;
      ctx.save(); ctx.globalAlpha = al;
      ctx.fillStyle = K.panel; ctx.strokeStyle = pn.col; ctx.lineWidth = 2.5;
      rrect(ctx, pn.x, PY, PW, PH, 16); ctx.fill(); ctx.stroke();
      // 小電路（縮小版；只畫圖形，不寫字）
      const cx = pn.x + PW / 2, cy = PY + 162;
      ctx.save();
      ctx.beginPath(); ctx.rect(pn.x + 10, PY + 54, PW - 20, 222); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(MS, MS);
      if (k === 0) {
        ctx.translate(-(LX + XS[1]) / 2, -MID);
        const h = 0.85 + 0.15 * Math.sin(t * 5);
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = `rgba(255,90,60,${h})`; ctx.shadowBlur = 24 * h;
        ctx.strokeStyle = `rgba(255,90,60,${0.55 * h})`; ctx.lineWidth = 20;
        wirePath(ctx, LOOP_SC.pts.slice(0, 6)); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = K.hot; ctx.lineWidth = 6;
        wirePath(ctx, LOOP_SC.pts.slice(0, 6)); ctx.stroke();
        ctx.restore();
        flow(ctx, LOOP_SC, HIDE_SC, 230 * t, 20, 1, undefined, 0);
        battery(ctx);
      } else {
        ctx.translate(-(LX - 40 + XS[2] + 60) / 2, -MID);
        const st = { vis: [1, 1, 1], c: [1, 1, 1], f: [1, 1, 1], heat: 1, amp: 20.9 };
        drawCircuit(ctx, st, t, { squares: false, waves: false, text: false });
      }
      ctx.restore();
      ctx.restore();
      text(ctx, tr(pn.title[0], pn.title[1]), cx, PY + 30, pn.col, 28, 'center', al);
      para(ctx, tr(pn.body[0], pn.body[1]), cx, PY + 326, PW - 40, K.white, 22, 'center', ease((tl - 0.8 - k * 0.9) / 0.7), 30);
    });
    bottomLines(ctx, tr('過載不是電器壞掉，是接得太多，總電流超過線路能承受', 'Overload is not a broken device: too many are connected, and the total current is more than the wiring can carry'), K.yellow, ease((tl - 3.0) / 0.7));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, showHeat) {
    const items = [
      [tr('藍球＝電子，從負極出發', 'Blue ball = electron, from − end'), 'b'],
      [tr('藍方塊＝能量（教學符號）', 'Blue square = energy'), 's']
    ];
    if (showHeat) items.push([tr('橘紅光＝導線發熱', 'Orange glow = heat'), 'h']);
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
        if (kind === 's') square(ctx, x + 10, y, 1, true);
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
    if (i < 4) {
      const st = state(i, tl);
      drawCircuit(ctx, st, t);
      circuitLabels(ctx, st);
      meter(ctx, st, i, tl);
      drawNotes(ctx, i, tl);
    } else drawSummary(ctx, tl, t);
    drawLegend(ctx, i >= 3);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('overloadAnimCanvas');
  const ctl = () => window.EsAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('overloadAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-overload');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-overload'); if (!row) return;
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

  window.EsAnim.overload = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-overload'); if (row) row.innerHTML = '';
      const r = document.getElementById('overloadAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { overload: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'overload' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
