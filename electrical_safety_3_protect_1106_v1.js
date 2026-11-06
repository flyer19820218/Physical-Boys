/* electrical_safety_3_protect_1106_v1.js — 「保護裝置」分頁動畫（#protectAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EsAnim.protect = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'protect'。畫布不綁任何事件；唯一控制是 #steps-protect 裡的 5 個步驟鈕；結果框 #protectAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。電路：左幹線 x=140（電池在 y=275：上長細＝正極、下短粗＝負極），
 *   上導線 y=150、下導線 y=400；並聯支路 x=420（電燈）、550（電扇）、680（電暖器，第 2 步才接上），電器畫在支路正中央。
 *   保護裝置畫在上導線 x=280（電源與第一條支路之間＝幹線正中央），所有支路的電子都一定經過它。
 *   上導線在裝置兩端（x 232／328）斷開，由裝置本身接通：保險絲＝玻璃管＋細金屬絲；熔斷＝金屬絲中間留出真正的缺口。
 *   斷路器＝開關盒，盒內兩個接點＋活動接片（跳脫＝接片抬起、留出缺口），盒頂搖桿指向 OFF／ON。
 *   電器支路 3 上端 y 178～214 留缺口給刀形開關（接上／拔掉），沿用過載那支的畫法。
 *   每條支路一個電子迴路：負極 → 下導線 → 該支路往上 → 上導線往左（經過保護裝置）→ 正極；幹線上迴路疊在一起＝電子變密。
 *   電子的位移＝速度對時間的積分（純函式）：迴路切開時速度降到 0，所有電子停住。能量方塊在電子外側 18px，在電器處變暗。
 *   右側 x 770～970：第 1 步＝淡色虛線小圖「若只裝在一條支路」；第 2～4 步＝「幹線電流：正常／過大／停止」（不寫數值）。
 *   下方 y≈458/492：本步重點；最下方圖例。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 裝在哪裡  8 s  保險絲串聯在幹線；電流正常；右側淡色提示：只串聯在一條支路就只管得到那一條（打叉）
 *   2 電流變大  8 s  接上電暖器；幹線電子變密變快；保險絲金屬絲發橘紅光（熱）
 *   3 熔斷      8 s  金屬絲熔斷、留缺口；電子全部停住、電器熄滅；小字：要換合規格新品
 *   4 斷路器    9 s  換成無熔絲開關：過大 → 跳到 OFF、停止 → 排除原因（拔掉電暖器）→ 推回 ON、恢復
 *   5 結論      9 s  三列重點＋漏電斷路器一行小字
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EsAnim.ctl.onEnd。
 * EsAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–28px，Noto Sans TC 900（ON／OFF 用 JetBrains Mono）；寫字前一律 measureText。
 * 不寫任何電流數值，只用「正常／過大／停止」。電子疏密與快慢只是定性表示。
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
    pos: '#ff8040', copper: '#c98b55', glass: '#cfe8ef', metal: '#b8c4c0'
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
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  const isZh = () => tr('zh', 'en') === 'zh';
  const T = p => tr(p[0], p[1]);

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
  function wirePath(ctx, pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }

  // 保險絲（橫放，中心 0,0，長 FW）：h＝發熱 0～1，g＝熔斷缺口寬（px）
  const FW = 96, FH = 26, CAP = 12;
  function fuseBody(ctx, cx, cy, s, rot, h, g) {
    ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot); ctx.scale(s, s);
    // 玻璃管（半透明，看得到裡面的金屬絲與電子）
    ctx.fillStyle = 'rgba(207,232,239,0.10)'; ctx.strokeStyle = K.glass; ctx.lineWidth = 2.5;
    rrect(ctx, -FW / 2 + CAP - 2, -FH / 2, FW - 2 * CAP + 4, FH, 9); ctx.fill(); ctx.stroke();
    // 細金屬絲
    const x0 = -FW / 2 + CAP, x1 = FW / 2 - CAP;
    ctx.strokeStyle = h > 0.02 ? mix('#e8e2cf', '#ff7a4d', h) : '#e8e2cf'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (h > 0.02) { ctx.shadowColor = K.heat; ctx.shadowBlur = 14 * h; }
    if (g <= 0.5) { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke(); }
    else {
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(-g / 2, 0); ctx.moveTo(g / 2, 0); ctx.lineTo(x1, 0); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      [-g / 2, g / 2].forEach(x => { ctx.beginPath(); ctx.arc(x, 0, 4, 0, TAU); ctx.fill(); });   // 熔化後縮成小珠
    }
    ctx.shadowBlur = 0;
    // 金屬端蓋
    ctx.fillStyle = K.metal;
    rrect(ctx, -FW / 2, -FH / 2 - 3, CAP, FH + 6, 3); ctx.fill();
    rrect(ctx, FW / 2 - CAP, -FH / 2 - 3, CAP, FH + 6, 3); ctx.fill();
    ctx.restore();
  }
  function fuseGlow(ctx, cx, cy, s, h) {
    if (h <= 0.02) return;
    ctx.save();
    const r = 74 * s, g = ctx.createRadialGradient(cx, cy, 6 * s, cx, cy, r);
    g.addColorStop(0, `rgba(255,90,60,${0.6 * h})`); g.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 斷路器（開關盒，中心 0,0）：c＝接點 0 開～1 合；搖桿跟著接點（合＝ON 往右、開＝OFF 往左）
  const BW = 96, BH = 64;
  function breakerBody(ctx, cx, cy, s, c) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    // 搖桿（盒頂中央為轉軸）
    const a = (-35 + 70 * c) * Math.PI / 180, L = 32;
    ctx.strokeStyle = K.white; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -BH / 2); ctx.lineTo(L * Math.sin(a), -BH / 2 - L * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = c > 0.5 ? K.green : K.hot;
    ctx.beginPath(); ctx.arc(L * Math.sin(a), -BH / 2 - L * Math.cos(a), 7, 0, TAU); ctx.fill();
    // 盒子
    ctx.fillStyle = '#0f2a22'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, -BW / 2, -BH / 2, BW, BH, 10); ctx.fill(); ctx.stroke();
    // 盒內導線＋接點＋活動接片（以右接點為轉軸）
    const X1 = 26;
    ctx.strokeStyle = K.wire; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-BW / 2, 0); ctx.lineTo(-X1, 0); ctx.moveTo(X1, 0); ctx.lineTo(BW / 2, 0); ctx.stroke();
    const b = (1 - c) * 34 * Math.PI / 180, BL = 2 * X1;
    ctx.strokeStyle = K.white; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(X1, 0); ctx.lineTo(X1 - BL * Math.cos(b), -BL * Math.sin(b)); ctx.stroke();
    ctx.fillStyle = K.white;
    [-X1, X1].forEach(x => { ctx.beginPath(); ctx.arc(x, 0, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }

  // ───────── 電路幾何 ─────────
  const LX = 140, TOP = 150, BOT = 400, MID = 275;
  const BAT_P = MID - 8, BAT_N = MID + 8;          // 正極板（上，長細）、負極板（下，短粗）
  const FX = 280;                                  // 保護裝置：幹線（電源 → 第一條支路）正中央
  const XS = [420, 550, 680];
  const GAP0 = TOP + 28, GAP1 = TOP + 64;          // 支路 3 上端缺口（刀形開關）
  const BOX_W = 110;
  const DEV = [{ name: ['電燈', 'Lamp'], sp: 64 }, { name: ['電扇', 'Fan'], sp: 64 }, { name: ['電暖器', 'Heater'], sp: 64 }];

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
  const LOOPS = XS.map(x => mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x, y: BOT }, { x, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]));
  const HIDES = LOOPS.map(P => P.L - (BAT_N - BAT_P));
  const DROPS = LOOPS.map((P, k) => sOf(P, XS[k], MID));   // 能量在該支路電器（元件座標）用掉

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['裝在哪裡', 'Where'],
      cap: ['保險絲串聯在幹線上：電流正常', 'The fuse is in series on the main wire: normal current'],
      res: ['保險絲串聯在幹線上，所有支路的電流都一定經過它；電流正常時，電子順暢通過，電器正常工作。若只串聯在某一條支路，就只管得到那一條。',
        'The fuse is in series on the main wire, so the current of every branch must pass through it. With a normal current, electrons pass smoothly and the devices work. A fuse in only one branch would guard only that branch.'] },
    { dur: 8, b: ['電流變大', 'Too big'],
      cap: ['多接一個電器：電流太大，保險絲發熱', 'One more device: the current is too large, the fuse heats up'],
      res: ['再接上電暖器，幹線的電子變密、變快，電流變大；電流太大時，保險絲的細金屬絲發熱、發出橘紅光。',
        'Plugging in the heater makes the electrons in the main wire denser and faster: the current grows. When it is too large, the thin metal wire in the fuse heats up and glows orange-red.'] },
    { dur: 8, b: ['熔斷', 'Melts'],
      cap: ['保險絲熔斷：迴路切開，電流停止', 'The fuse melts: the circuit opens, the current stops'],
      res: ['保險絲是低熔點合金，電流過大時受熱熔斷，中間出現缺口，迴路被切開，電子全部停住，電器都停了。熔斷後要先排除原因，再換合規格的新品。',
        'A fuse is a low-melting-point alloy. When the current is too large it heats up and melts, leaving a gap; the circuit opens, all electrons stop and every device goes off. Fix the cause, then replace it with a new fuse of the right rating.'] },
    { dur: 9, b: ['斷路器', 'Breaker'],
      cap: ['無熔絲開關（斷路器）：跳脫後可復歸', 'Circuit breaker: it trips, then it can be reset'],
      res: ['無熔絲開關（斷路器）偵測到電流過大就自動跳脫到 OFF，迴路切開、電流停止；排除原因（拔掉多接的電器）後，把開關推回 ON 就能復歸，電流恢復。',
        'A circuit breaker senses a current that is too large and trips to OFF by itself: the circuit opens and the current stops. After fixing the cause (unplugging the extra device), push it back to ON to reset it and the current flows again.'] },
    { dur: 9, b: ['結論', 'Summary'],
      cap: ['重點整理', 'Key points'],
      res: ['保護裝置要串聯在幹線上，電流過大時切開迴路；保險絲熔斷要換合規格新品，斷路器要先排除原因才能復歸；絕對不能用銅線代替。動畫僅示意｜不可實驗。',
        'A protective device must be in series on the main wire and opens the circuit when the current is too large. A blown fuse must be replaced with a new one of the right rating; a breaker can be reset only after the cause is fixed. Never use copper wire instead. Animation is only a model | Do not try this.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const V_N = 70, V_H = 112;                         // 電子速度 px/s：正常／過大（定性）
  const MELT = 1.8, TRIP = 2.0, UNPLUG = 3.2, RESET = 5.0, RESUME = 5.4;
  function vAt(i, tl) {
    if (i === 0) return V_N;
    if (i === 1) return V_N + (V_H - V_N) * ease((tl - 2.0) / 1.0);
    if (i === 2) return V_H * (1 - ease((tl - MELT) / 0.6));
    if (i === 3) return tl < RESUME ? V_H * (1 - ease((tl - TRIP) / 0.5)) : V_N * ease((tl - RESUME) / 0.6);
    return V_N;
  }
  function dist(i, tl) {                             // 位移＝速度對時間積分（停住就真的不動）
    let d = 0; const dt = 0.01;
    for (let s = 0; s < tl; s += dt) { const h = Math.min(dt, tl - s); d += vAt(i, s + h / 2) * h; }
    return d;
  }
  function state(i, tl) {
    const st = { vis: [1, 1, 0], c: [1, 1, 0], f: [1, 1, 0], heat: 0, gap: 0, spark: 0, brk: 1, dev: 'fuse', cur: 1 };
    if (i === 1) {
      st.vis[2] = ease((tl - 0.3) / 0.6);
      st.c[2] = ease((tl - 1.0) / 1.0);
      st.f[2] = ease((tl - 2.0) / 0.6);
      st.heat = ease((tl - 2.8) / 2.0);
    } else if (i === 2) {
      st.vis[2] = 1; st.c[2] = 1; st.f[2] = 1;
      st.heat = tl < MELT ? 1 : 1 - ease((tl - MELT) / 2.0);
      st.gap = 30 * ease((tl - MELT) / 0.25);
      st.spark = tl >= MELT ? clamp(1 - (tl - MELT) / 0.6, 0, 1) : 0;
      st.cur = 1 - ease((tl - MELT) / 0.5);
    } else if (i === 3) {
      st.dev = 'breaker';
      st.vis[2] = 1 - 0.65 * ease((tl - UNPLUG) / 0.8);
      st.c[2] = 1 - ease((tl - UNPLUG) / 0.8);
      st.f[2] = 1 - ease((tl - UNPLUG) / 0.4);
      st.brk = tl < 3.5 ? 1 - ease((tl - TRIP) / 0.2) : ease((tl - RESET) / 0.3);
      st.cur = tl < RESUME ? 1 - ease((tl - TRIP) / 0.5) : ease((tl - RESUME) / 0.6);
    }
    st.d = dist(i, tl) + STARTS[i] * V_N;
    return st;
  }

  // ───────── 畫電路 ─────────
  function devBox(ctx, k, on, alpha) {
    const X = XS[k], ls = wrap(ctx, T(DEV[k].name), BOX_W - 20, 22);
    const h = ls.length * 28 + 30;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (on > 0.02) { ctx.shadowColor = `rgba(242,236,217,${0.7 * on})`; ctx.shadowBlur = 18 * on; }
    ctx.fillStyle = mix('#0f2620', '#2a7a63', on); ctx.strokeStyle = mix('#5f7a70', '#f2ecd9', 0.4 + 0.6 * on); ctx.lineWidth = 3;
    rrect(ctx, X - BOX_W / 2, MID - h / 2, BOX_W, h, 10); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
    const col = mix('#9fb3aa', '#f2ecd9', on);
    ls.forEach((l, j) => text(ctx, l, X, MID + (j - (ls.length - 1) / 2) * 28, col, 22, 'center', alpha));
  }
  function battery(ctx) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LX - 36, BAT_P); ctx.lineTo(LX + 36, BAT_P); ctx.stroke();   // 正極：長細
    ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(LX - 18, BAT_N + 3); ctx.lineTo(LX + 18, BAT_N + 3); ctx.stroke();   // 負極：短粗
    ctx.restore();
  }
  function switchBlade(ctx, X, c) {               // 下接點 (X, GAP1) 為轉軸；c=0 張開 38°（往右），c=1 閉合
    const L = GAP1 - GAP0, a = (1 - c) * 38 * Math.PI / 180;
    ctx.save(); ctx.strokeStyle = K.wire; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X, GAP1); ctx.lineTo(X + L * Math.sin(a), GAP1 - L * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = K.white;
    [GAP0, GAP1].forEach(y => { ctx.beginPath(); ctx.arc(X, y, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function heatWaves(ctx, cx, y0, h, t) {
    if (h <= 0.05) return;
    for (let k = 0; k < 3; k++) {
      const u = ((t * 0.6 + k * 0.33) % 1 + 1) % 1, x0 = cx - 26 + k * 26, yb = y0 - 10 * u;
      ctx.save(); ctx.globalAlpha = h * (1 - 0.6 * u); ctx.strokeStyle = K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.shadowColor = K.heat; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let s = 0; s <= 16; s++) { const yy = yb - s; const xx = x0 + 5 * Math.sin(s / 16 * TAU + t * 3 + k); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
    }
  }
  function flow(ctx, P, hide, d, sp, alpha, dropAt, skip) {
    if (alpha <= 0.01) return;
    const n = Math.max(1, Math.round(P.L / sp)), gap = P.L / n;
    for (let k = 0; k < n; k++) {
      const s = ((k * gap + d) % P.L + P.L) % P.L;
      if (s > hide - 2) continue;                         // 電池內部不畫
      const p = at(P, s);
      if (skip && skip(p)) continue;
      const fade = clamp(Math.min(s, hide - s) / 10, 0, 1);
      square(ctx, p.x + p.nx * 18, p.y + p.ny * 18, alpha * fade, s < dropAt);
      ball(ctx, p.x, p.y, 6, alpha * fade);
    }
  }
  function drawCircuit(ctx, st, t) {
    const h = st.heat * (0.85 + 0.15 * Math.sin(t * 5));
    if (st.dev === 'fuse') fuseGlow(ctx, FX, TOP, 1, h);
    // 導線（上導線在保護裝置兩端斷開，由裝置接通）
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = K.wire;
    wirePath(ctx, [{ x: FX - FW / 2, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }]); ctx.stroke();
    wirePath(ctx, [{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: XS[1], y: BOT }, { x: XS[1], y: TOP }, { x: FX + FW / 2, y: TOP }]); ctx.stroke();
    wirePath(ctx, [{ x: XS[0], y: TOP }, { x: XS[0], y: BOT }]); ctx.stroke();
    if (st.vis[2] > 0.01) {
      ctx.save(); ctx.globalAlpha *= st.vis[2];
      wirePath(ctx, [{ x: XS[1], y: TOP }, { x: XS[2], y: TOP }, { x: XS[2], y: GAP0 }]); ctx.stroke();
      wirePath(ctx, [{ x: XS[1], y: BOT }, { x: XS[2], y: BOT }, { x: XS[2], y: GAP1 }]); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // 電子（＋能量方塊）；熔斷缺口裡不放電子
    const skip = st.gap > 0.5 ? p => Math.abs(p.y - TOP) < 1 && Math.abs(p.x - FX) < st.gap / 2 + 8 : null;
    for (let k = 0; k < 3; k++) flow(ctx, LOOPS[k], HIDES[k], st.d + k * 21, DEV[k].sp, st.f[k], DROPS[k], skip);
    // 元件（最後畫）
    if (st.vis[2] > 0.01) { ctx.save(); ctx.globalAlpha *= st.vis[2]; switchBlade(ctx, XS[2], st.c[2]); ctx.restore(); }
    for (let k = 0; k < 3; k++) if (st.vis[k] > 0.01) devBox(ctx, k, st.cur * st.f[k], st.vis[k]);
    battery(ctx);
    if (st.dev === 'fuse') {
      fuseBody(ctx, FX, TOP, 1, 0, h, st.gap);
      heatWaves(ctx, FX, TOP - 24, st.heat, t);
      if (st.spark > 0.01) {
        ctx.save(); const g = ctx.createRadialGradient(FX, TOP, 2, FX, TOP, 46);
        g.addColorStop(0, `rgba(255,230,200,${st.spark})`); g.addColorStop(0.4, `rgba(255,90,60,${0.8 * st.spark})`); g.addColorStop(1, 'rgba(255,90,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(FX, TOP, 46, 0, TAU); ctx.fill(); ctx.restore();
      }
    } else breakerBody(ctx, FX, TOP, 1, st.brk);
    // 並聯節點
    ctx.save(); ctx.fillStyle = K.white;
    [TOP, BOT].forEach(y => { ctx.beginPath(); ctx.arc(XS[0], y, 7, 0, TAU); ctx.fill(); });
    ctx.globalAlpha *= st.c[2] >= 1 ? 1 : 0;
    [TOP, BOT].forEach(y => { ctx.beginPath(); ctx.arc(XS[1], y, 7, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function circuitLabels(ctx, st, i, tl) {
    text(ctx, '+', LX + 50, BAT_P - 12, K.pos, 28, 'center', 1, true);
    text(ctx, '−', LX + 34, BAT_N + 16, K.electron, 28, 'center', 1, true);
    para(ctx, tr('電源', 'Power source'), LX - 48, MID, 86, K.white, 22, 'right');
    // 保護裝置名稱（下方）
    if (st.dev === 'fuse') {
      text(ctx, tr('保險絲', 'Fuse'), FX, TOP + 44, K.white, 22);
      const melted = ease((tl - MELT - 0.2) / 0.4) * (i === 2 ? 1 : 0);
      text(ctx, tr('串聯在幹線', 'In series, main wire'), FX, TOP + 74, K.cyan, 22, 'center', 1 - melted);
      text(ctx, tr('已熔斷：留下缺口', 'Melted: a gap'), FX, TOP + 74, K.hot, 22, 'center', melted);
    } else {
      para(ctx, tr('無熔絲開關\n（斷路器）', 'Circuit breaker'), FX, TOP + 70, 220, K.white, 22, 'center', 1, 28);
      const on = st.brk;
      text(ctx, 'OFF', FX - 52, TOP - 58, on < 0.5 ? K.hot : K.dim, 24, 'center', 1, true);
      text(ctx, 'ON', FX + 50, TOP - 58, on >= 0.5 ? K.green : K.dim, 24, 'center', 1, true);
    }
  }

  // ───────── 右側：幹線電流狀態（第 2～4 步，不寫數值） ─────────
  const SX = 870;
  const STATUS = { ok: [['正常', 'Normal'], K.green], big: [['過大', 'Too large'], K.hot], stop: [['停止', 'Stopped'], K.muted] };
  const PHASES = { 1: [[0, 'ok'], [2.6, 'big']], 2: [[0, 'big'], [1.9, 'stop']], 3: [[0, 'big'], [2.1, 'stop'], [5.5, 'ok']] };
  function crossfade(list, tl, draw) {                // list = [[開始秒, 內容]]，新的淡入、前一個淡出
    let k = 0; while (k + 1 < list.length && tl >= list[k + 1][0]) k++;
    const a = k === 0 ? 1 : ease((tl - list[k][0]) / 0.3);
    if (k > 0 && a < 1) draw(list[k - 1][1], 1 - a);
    draw(list[k][1], a);
  }
  function statusPanel(ctx, i, tl) {
    const al = i === 1 ? ease((tl - 0.4) / 0.5) : 1;
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
    rrect(ctx, 770, 200, 200, 150, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    para(ctx, tr('幹線電流', 'Main-wire current'), SX, 240, 180, K.white, 22, 'center', al, 28);
    crossfade(PHASES[i], tl, (key, a) => text(ctx, T(STATUS[key][0]), SX, 305, STATUS[key][1], 28, 'center', a * al));
  }

  // ───────── 右側：第 1 步淡色虛線提示（只串聯在一條支路） ─────────
  function insetHint(ctx, tl) {
    const al = 0.85 * ease((tl - 3.6) / 0.7);
    if (al <= 0.01) return;
    const x0 = 735, x1 = 985, y0 = 100, y1 = 430;
    ctx.save(); ctx.globalAlpha = al;
    ctx.setLineDash([8, 6]); ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
    rrect(ctx, x0, y0, x1 - x0, y1 - y0, 14); ctx.stroke();
    // 小電路（虛線）：電源在左，兩條支路；保險絲只串聯在左邊那條
    const L = 770, Tt = 215, B = 345, XA = 860, XB = 945, M = 280;
    ctx.strokeStyle = K.wire; ctx.lineWidth = 4; ctx.setLineDash([7, 5]); ctx.lineCap = 'round';
    wirePath(ctx, [{ x: XB, y: Tt }, { x: L, y: Tt }, { x: L, y: M - 6 }]); ctx.stroke();
    wirePath(ctx, [{ x: L, y: M + 6 }, { x: L, y: B }, { x: XB, y: B }, { x: XB, y: Tt }]); ctx.stroke();
    wirePath(ctx, [{ x: XA, y: Tt }, { x: XA, y: B }]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L - 20, M - 6); ctx.lineTo(L + 20, M - 6); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(L - 10, M + 7); ctx.lineTo(L + 10, M + 7); ctx.stroke();
    [[XA, 305], [XB, M]].forEach(([x, y]) => {
      ctx.fillStyle = '#1f5a49'; ctx.strokeStyle = K.white; ctx.lineWidth = 2;
      rrect(ctx, x - 17, y - 15, 34, 30, 6); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = al; fuseBody(ctx, XA, 248, 0.5, Math.PI / 2, 0, 0); ctx.restore();
    // 淡色打叉
    ctx.save(); ctx.globalAlpha = al * 0.55; ctx.strokeStyle = K.orange; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(800, 228); ctx.lineTo(920, 332); ctx.moveTo(920, 228); ctx.lineTo(800, 332); ctx.stroke();
    ctx.restore();
    para(ctx, tr('若只裝在一條支路', 'If it is only on one branch'), (x0 + x1) / 2, 140, 224, K.muted, 22, 'center', al / 0.85, 28);
    para(ctx, tr('只管得到這一條', 'It guards only that branch'), (x0 + x1) / 2, 390, 224, K.muted, 22, 'center', al / 0.85, 28);
  }

  // ───────── 各步驟的標註（下方兩行） ─────────
  const BY1 = 458, BY2 = 492;
  const N = {
    0: [[1.4, ['串聯在幹線：所有電流都一定經過它', 'In series on the main wire: all the current must pass it'], K.yellow, 1],
        [2.6, ['電流正常：電子順暢通過，電器正常工作', 'Normal current: electrons pass smoothly, the devices work'], K.white, 2]],
    1: [[1.2, ['多接一個電器：幹線的電子變密、變快', 'One more device: denser, faster electrons in the main wire'], K.white, 1],
        [3.4, ['電流太大，保險絲發熱', 'Current too large: the fuse heats up'], K.hot, 2]],
    2: [[2.4, ['熔斷：迴路切開，電流停止', 'Melted: the circuit opens, the current stops'], K.yellow, 1],
        [3.6, ['熔斷後要換合規格新品', 'After it melts, use a new fuse of the right rating'], K.muted, 2]]
  };
  const N4 = [[0.6, ['電流仍然過大：斷路器偵測到', 'The current is still too large: the breaker senses it'], K.white],
              [TRIP + 0.2, ['電流過大 → 自動跳到 OFF，迴路切開', 'Current too large → it trips to OFF, the circuit opens'], K.hot],
              [UNPLUG, ['排除原因：拔掉多接的電器', 'Fix the cause: unplug the extra device'], K.white],
              [RESET, ['推回 ON：復歸，電流恢復', 'Push back to ON: reset, the current flows again'], K.green]];
  function drawNotes(ctx, i, tl) {
    if (N[i]) N[i].forEach(([t0, s, c, row]) => text(ctx, T(s), W / 2, row === 1 ? BY1 : BY2, c, row === 2 && i === 2 ? 22 : 24, 'center', ease((tl - t0) / 0.6)));
    else if (i === 3) {
      if (tl >= N4[0][0]) crossfade(N4.map(n => [n[0], n]), tl, (n, a) => text(ctx, T(n[1]), W / 2, BY1, n[2], 24, 'center', a * ease((tl - N4[0][0]) / 0.3)));
      text(ctx, tr('跳脫後可復歸（要先排除原因）', 'After tripping it can be reset (fix the cause first)'), W / 2, BY2, K.yellow, 24, 'center', ease((tl - 6.3) / 0.6));
    }
  }

  // ───────── 第 5 步：三列重點 ─────────
  const ROWS = [
    ['保護裝置必須串聯在幹線', 'A protective device must be in series on the main wire'],
    ['保險絲熔斷要換新品；斷路器跳脫排除原因後復歸', 'A blown fuse needs a new one; a tripped breaker is reset after the cause is fixed'],
    ['不可用銅線代替保險絲：它不會及時熔斷，失去保護', 'Never use copper wire instead of a fuse: it will not melt in time, so there is no protection']
  ];
  const RY = [135, 250, 365], RH = 100;
  function drawSummary(ctx, tl, t) {
    ROWS.forEach((r, k) => {
      const al = ease((tl - 0.3 - k * 1.2) / 0.6);
      if (al <= 0.01) return;
      const y = RY[k];
      ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
      rrect(ctx, 30, y - RH / 2, 940, RH, 14); ctx.fill(); ctx.stroke();
      if (k === 0) {                                   // 幹線上的保險絲，電子穿過
        ctx.strokeStyle = K.wire; ctx.lineWidth = 6; ctx.lineCap = 'round';
        wirePath(ctx, [{ x: 55, y }, { x: 117, y }]); ctx.stroke();
        wirePath(ctx, [{ x: 193, y }, { x: 255, y }]); ctx.stroke();
        for (let j = 0; j < 5; j++) { const x = 255 - ((t * 60 + j * 42) % 210); ball(ctx, x, y, 6, clamp(Math.min(x - 50, 260 - x) / 10, 0, 1)); }
        fuseBody(ctx, 155, y, 0.8, 0, 0, 0);
      } else if (k === 1) {                            // 熔斷的保險絲｜跳脫的斷路器
        fuseBody(ctx, 95, y, 0.8, 0, 0, 22);
        breakerBody(ctx, 215, y + 12, 0.62, 0);
      } else {                                          // 銅線（打叉）｜保險絲
        ctx.strokeStyle = K.copper; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(55, y); ctx.lineTo(140, y); ctx.stroke();
        ctx.globalAlpha = al * 0.8; ctx.strokeStyle = K.white; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(72, y - 28); ctx.lineTo(124, y + 28); ctx.moveTo(124, y - 28); ctx.lineTo(72, y + 28); ctx.stroke();
        ctx.globalAlpha = al;
        fuseBody(ctx, 215, y, 0.8, 0, 0, 0);
      }
      ctx.restore();
      const z = isZh() ? 24 : 22;
      para(ctx, T(r), 290, y, 660, k === 2 ? K.yellow : K.white, z, 'left', al, z * 1.3);
    });
    para(ctx, tr('補充｜漏電斷路器：發現電流漏往其他路徑時，快速切斷電源', 'Earth-leakage breaker: cuts the power fast if current leaks into another path'),
      W / 2, 478, 940, K.cyan, 22, 'center', ease((tl - 4.2) / 0.6), 28);
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, showHeat) {
    const items = [
      [tr('藍球＝電子，從負極出發', 'Blue ball = electron, from − end'), 'b'],
      [tr('藍方塊＝能量（教學符號）', 'Blue square = energy'), 's']
    ];
    if (showHeat) items.push([tr('橘紅光＝發熱', 'Orange glow = heat'), 'h']);
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
      circuitLabels(ctx, st, i, tl);
      if (i === 0) insetHint(ctx, tl); else statusPanel(ctx, i, tl);
      drawNotes(ctx, i, tl);
    } else drawSummary(ctx, tl, t);
    drawLegend(ctx, i === 1 || i === 2);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('protectAnimCanvas');
  const ctl = () => window.EsAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('protectAnimResult'); if (el) el.innerHTML = html;
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
    drawCaption(ctx, T(st.cap));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(T(st.res));
  }
  function updateUI() {
    const row = document.getElementById('steps-protect');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-protect'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${T(st.b)}`;
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

  window.EsAnim.protect = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-protect'); if (row) row.innerHTML = '';
      const r = document.getElementById('protectAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { protect: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'protect' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
