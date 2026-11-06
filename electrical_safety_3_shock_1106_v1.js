/* electrical_safety_3_shock_1106_v1.js — 「觸電安全」分頁動畫（#shockAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EsAnim.shock = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'shock'。畫布不綁任何事件；唯一控制是 #steps-shock 裡的 5 個步驟鈕；結果框 #shockAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。電源（電池）在 x=150：上長細＝正極（y=157）、下短粗＝負極（y=173）。
 *   負極 → 帶電導線 y=200 往右；回到電源的導線 y=130（接正極）。電源正極另有一條接地線 x=70 往下接到大地。
 *   大地＝地面 y=410 以下的土層（y 410～474），電子在土層 y=438 處流動。
 *   第 1～3 步：右端電燈（x=880，在兩條導線之間正中央）。第 1 步小鳥站在帶電導線 x=470。
 *   第 2～3 步：人（火柴人 x=560）手碰帶電導線破損處 x=616，腳踩地面 → 第二個迴路：
 *     負極 → 帶電導線 → 手 → 身體 → 腳 → 大地 → 接地線 → 正極（電子方向正好就是這個順序）。
 *   第 4 步：電燈換成「金屬外殼電器」（x 750～930），外殼以接地線 x=860 接大地；人（x=680）手碰外殼；
 *     漏電斷路器（x=300，盒子同時跨在兩條導線上）。漏電時電子經外殼 → 接地線 → 大地 → 正極，不經過人；
 *     斷路器比較「流出（帶電導線）」與「回來（回線）」不一樣多 → 跳到 OFF，兩條線都留出真正的缺口，電子全部停住。
 *   第 5 步：三列「發現有人觸電」的做法（圖示＋一句）。
 *   下方 y≈500/534：本步重點；最下方圖例。
 *   能量方塊：有電器（電燈／電器）的第 1～4 步才畫，在電燈、電器、人體（身體軀幹）處變暗；漏電路徑上沒有元件，方塊不變暗。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 小鳥      8 s  小鳥站在一條帶電導線上：只碰一條線、沒有通路，電子不經過小鳥
 *   2 碰到帶電  9 s  人手碰破損處、腳踩地面：經大地形成通路，電子通過人體
 *   3 潮濕      8 s  濕手（水滴）：通過人體的電子更多、更快（定性）；提醒不用濕手碰插頭
 *   4 保護措施  9 s  外殼接地：漏電改走接地線；漏電斷路器：流出≠回來 → 跳到 OFF、電子停止
 *   5 有人觸電  8 s  ① 不要徒手碰觸 ② 先切斷電源 ③ 立即呼叫成人與緊急救援
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EsAnim.ctl.onEnd。
 * EsAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–28px，Noto Sans TC 900（ON／OFF 用 JetBrains Mono）；寫字前一律 measureText。
 * 不寫任何電壓、電流、人體電阻數值；不畫受傷、痛苦、閃電爆炸，只用電子藍球通過身體與小標示表示。
 */
(function () {
  'use strict';
  window.EsAnim = window.EsAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', muted: '#9fb3aa', dim: '#5f7a70', wire: '#9fb3aa',
    electron: '#4dd2ff', energy: '#4dd2ff', energyDim: '#1d5466', hot: '#ff7a4d', panel: '#123329',
    pos: '#ff8040', copper: '#c98b55', metal: '#b8c4c0', soil: '#3a2f22', soilLine: '#8a7356', water: '#bfe9ff'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
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
  // 單行重點：24px 放不下就 22px（英文不縮到 22 以下，也不換行壓到下一列）
  function line1(ctx, s, y, color, alpha) {
    const z = textW(ctx, s, 24) <= 960 ? 24 : 22;
    text(ctx, s, W / 2, y, color, z, 'center', alpha);
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
  function stroke(ctx, pts, color, w, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    wirePath(ctx, pts); ctx.stroke(); ctx.restore();
  }
  function earthSym(ctx, x, y, alpha) {          // 接地符號：三條由長到短的橫線
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.strokeStyle = K.white; ctx.lineCap = 'round'; ctx.lineWidth = 4;
    [[22, 0], [14, 8], [6, 16]].forEach(([hw, dy]) => { ctx.beginPath(); ctx.moveTo(x - hw, y + dy); ctx.lineTo(x + hw, y + dy); ctx.stroke(); });
    ctx.restore();
  }

  // ───────── 幾何 ─────────
  const LX = 150, RET = 130, LIVE = 200, BP = 157, BN = 173, EX = 70;
  const GY = 410, GP = 438, GB = 474;               // 地面、土層中電子路徑、土層底
  const LAMPX = 880, BIRDX = 470;
  const PX = 560, BX = 616;                         // 第 2～3 步：人、破損處
  const SH = 270, HIP = 338, HEAD = 240;            // 肩、臀、頭心的 y
  const HAND_T = { x: 614, y: 204 }, HAND_R = { x: 590, y: 326 };
  const P4 = 680, CASE = { x0: 750, x1: 930, y0: 96, y1: 340 }, FLT = 790, GWX = 860, ELX = 850, HAND4 = { x: 750, y: 288 };
  const GX = 300, GFW = 100, GF_Y0 = 108, GF_Y1 = 222;   // 漏電斷路器盒

  function mkPath(pts, side) {
    const seg = []; let L = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      seg.push({ a, b, len, s0: L, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }); L += len;
    }
    return { pts, seg, L, side: side || 1, hide: L - (BN - BP) };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u, nx: -g.dy * P.side, ny: g.dx * P.side };
  }
  function sOf(P, x, y) {                          // 元件座標 → 路徑上的弧長
    for (const q of P.seg) {
      const u = (x - q.a.x) * q.dx + (y - q.a.y) * q.dy;
      const px = q.a.x + q.dx * u, py = q.a.y + q.dy * u;
      if (u >= -0.5 && u <= q.len + 0.5 && Math.hypot(px - x, py - y) < 0.5) return q.s0 + u;
    }
    return 0;
  }
  const v = (x, y) => ({ x, y });
  // 每條路徑都從負極出發、回到正極（最後一段是電池內部，不畫）
  const LAMP = mkPath([v(LX, BN), v(LX, LIVE), v(LAMPX, LIVE), v(LAMPX, RET), v(LX, RET), v(LX, BP), v(LX, BN)], 1);
  const BODY = mkPath([v(LX, BN), v(LX, LIVE), v(BX, LIVE), v(PX, SH), v(PX, HIP), v(PX + 18, GY), v(PX + 18, GP),
    v(EX, GP), v(EX, RET), v(LX, RET), v(LX, BP), v(LX, BN)], -1);
  const NORM4 = mkPath([v(LX, BN), v(LX, LIVE), v(ELX, LIVE), v(ELX, RET), v(LX, RET), v(LX, BP), v(LX, BN)], 1);
  const LEAK = mkPath([v(LX, BN), v(LX, LIVE), v(FLT, LIVE), v(FLT, CASE.y1), v(GWX, CASE.y1), v(GWX, GP),
    v(EX, GP), v(EX, RET), v(LX, RET), v(LX, BP), v(LX, BN)], 1);
  const DROP_LAMP = sOf(LAMP, LAMPX, (RET + LIVE) / 2);
  const DROP_BODY = sOf(BODY, PX, 305);             // 人體（軀幹）也像元件一樣用掉能量
  const DROP_N4 = sOf(NORM4, ELX, (RET + LIVE) / 2);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['小鳥', 'Bird'],
      cap: ['小鳥站在電線上，為什麼沒事？', 'Why is a bird on a power line safe?'],
      res: ['小鳥兩隻腳站在同一條帶電導線上，身體沒有接到另一條回到電源的路，沒有形成通路；電子沿著導線流過，不會通過小鳥。',
        'The bird stands with both feet on the same live wire. Its body is not connected to another path back to the source, so there is no closed path: electrons flow along the wire, not through the bird.'] },
    { dur: 9, b: ['碰到帶電', 'Touch'],
      cap: ['人碰到帶電處，腳又踩在地上', 'A person touches a live spot while standing on the ground'],
      res: ['手碰到導線破損、裸露的帶電處，腳又踩在地面上；大地會連回電源，於是導線、手、身體、腳、大地形成通路，電流可能通過人體。',
        'A hand touches a damaged, bare live spot while the feet stand on the ground. The ground connects back to the source, so the wire, hand, body, feet and ground form a closed path: current may pass through the body.'] },
    { dur: 8, b: ['潮濕', 'Wet'],
      cap: ['濕手更危險', 'Wet hands are more dangerous'],
      res: ['潮濕會讓皮膚與接觸處的電阻變小，通過人體的電流變大，危險增加。不要用濕手碰插頭、開關，積水的地方不要使用電器。',
        'Water lowers the resistance of the skin and the contact point, so a larger current can pass through the body: more danger. Never touch plugs or switches with wet hands, and do not use devices near standing water.'] },
    { dur: 9, b: ['保護措施', 'Protect'],
      cap: ['外殼接地＋漏電斷路器', 'Earthed metal case + earth-leakage breaker'],
      res: ['電器的金屬外殼接地：漏電時，電流改走接地線回到大地，不走人體；漏電斷路器發現「流出的電流和回來的電流不一樣多」，就快速切斷電源。這些是保護措施，不能取代正確使用。',
        'With the metal case earthed, leaking current takes the earth wire to the ground instead of the body. An earth-leakage breaker notices that the current going out and the current coming back are not equal, and cuts the power fast. These are protections; they never replace safe use.'] },
    { dur: 8, b: ['有人觸電', 'Help'],
      cap: ['發現有人觸電，怎麼做？', 'If someone gets an electric shock'],
      res: ['電流只在形成通路時才流動；發現有人觸電，不要徒手碰觸，先切斷電源並立即呼叫成人與緊急救援。動畫僅示意｜不可實驗。',
        'Current flows only through a closed path. If someone gets an electric shock, do not touch them with bare hands; cut off the power first and call an adult and emergency services at once. Animation is only a model | Do not try this.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const V = 60, V_WET = 104;                         // 電子速度 px/s（定性）
  const TOUCH = 2.0;                                 // 第 2 步：手碰到破損處
  const WET0 = 1.4, WET1 = 2.6;                      // 第 3 步：潮濕 → 通過人體的電子更多、更快
  const FAULT = 1.6, TRIP = 5.0;                     // 第 4 步：漏電、跳脫
  function speed(i, path, tl) {
    if (i === 2 && path === 'body') return V + (V_WET - V) * ease((tl - WET0) / (WET1 - WET0));
    if (i === 3) return V * (1 - ease((tl - TRIP) / 0.4));
    return V;
  }
  function dist(i, path, tl) {                       // 位移＝速度對時間積分（停住就真的不動）
    let d = 0; const dt = 0.01;
    for (let s = 0; s < tl; s += dt) { const h = Math.min(dt, tl - s); d += speed(i, path, s + h / 2) * h; }
    return d;
  }

  // ───────── 電子流 ─────────
  // sp＝電子間距；oddA＝奇數號電子的透明度（第 3 步「更多」＝奇數號淡入，不跳動）
  function flow(ctx, P, d, sp, alpha, dropAt, oddA, squares) {
    if (alpha <= 0.01) return;
    const n = Math.max(2, 2 * Math.round(P.L / sp / 2)), gap = P.L / n;
    for (let k = 0; k < n; k++) {
      const a = alpha * (k % 2 ? (oddA === undefined ? 1 : oddA) : 1);
      if (a <= 0.01) continue;
      const s = ((k * gap + d) % P.L + P.L) % P.L;
      if (s > P.hide - 2) continue;                         // 電池內部不畫
      const p = at(P, s);
      const fade = clamp(Math.min(s, P.hide - s) / 10, 0, 1);
      if (squares) square(ctx, p.x + p.nx * 18, p.y + p.ny * 18, a * fade, s < dropAt);
      ball(ctx, p.x, p.y, 6, a * fade);
    }
  }

  // ───────── 畫物件 ─────────
  function ground(ctx) {
    ctx.save();
    ctx.fillStyle = K.soil; ctx.fillRect(30, GY, 940, GB - GY);
    ctx.strokeStyle = 'rgba(138,115,86,0.45)'; ctx.lineWidth = 2;
    for (let x = 40; x < 970; x += 26) { ctx.beginPath(); ctx.moveTo(x, GB - 4); ctx.lineTo(x + 14, GY + 8); ctx.stroke(); }
    ctx.strokeStyle = K.soilLine; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, GY); ctx.lineTo(970, GY); ctx.stroke();
    ctx.restore();
  }
  function battery(ctx) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LX - 36, BP); ctx.lineTo(LX + 36, BP); ctx.stroke();   // 正極：長細
    ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(LX - 18, BN + 3); ctx.lineTo(LX + 18, BN + 3); ctx.stroke();   // 負極：短粗
    ctx.restore();
  }
  function lampBox(ctx, on) {
    const w = 104, h = 50, y = (RET + LIVE) / 2;
    ctx.save();
    if (on > 0.02) { ctx.shadowColor = `rgba(242,236,217,${0.7 * on})`; ctx.shadowBlur = 18 * on; }
    ctx.fillStyle = mix('#0f2620', '#2a7a63', on); ctx.strokeStyle = mix('#5f7a70', '#f2ecd9', 0.4 + 0.6 * on); ctx.lineWidth = 3;
    rrect(ctx, LAMPX - w / 2, y - h / 2, w, h, 10); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
    const s = tr('電燈', 'Lamp');
    text(ctx, s, LAMPX, y, mix('#9fb3aa', '#f2ecd9', on), 22);
  }
  function bareSpot(ctx, alpha) {                  // 破損處：絕緣皮剝開、露出銅芯
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = K.bg; ctx.fillRect(BX - 18, LIVE - 5, 36, 10);
    ctx.strokeStyle = K.copper; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(BX - 20, LIVE); ctx.lineTo(BX + 20, LIVE); ctx.stroke();
    ctx.strokeStyle = K.wire; ctx.lineWidth = 2;
    [-18, 18].forEach(dx => { const sg = Math.sign(dx); ctx.beginPath(); ctx.moveTo(BX + dx, LIVE - 4); ctx.lineTo(BX + dx + 4 * sg, LIVE - 8); ctx.moveTo(BX + dx, LIVE + 4); ctx.lineTo(BX + dx + 4 * sg, LIVE + 8); ctx.stroke(); });
    ctx.restore();
  }
  function bird(ctx, x, dy, alpha) {
    if (alpha <= 0.01) return;
    const y = LIVE + dy;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = '#d9d4c4'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 6, y - 12); ctx.lineTo(x - 7, y - 1); ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 7, y - 1); ctx.stroke();   // 兩隻腳都在同一條線上
    ctx.fillStyle = '#d9d4c4';
    ctx.beginPath(); ctx.moveTo(x - 18, y - 22); ctx.lineTo(x - 40, y - 30); ctx.lineTo(x - 38, y - 16); ctx.closePath(); ctx.fill();   // 尾
    ctx.beginPath(); ctx.ellipse(x, y - 22, 21, 13, -0.08, 0, TAU); ctx.fill();                                                    // 身體
    ctx.beginPath(); ctx.arc(x + 17, y - 36, 10, 0, TAU); ctx.fill();                                                               // 頭
    ctx.fillStyle = K.orange; ctx.beginPath(); ctx.moveTo(x + 26, y - 39); ctx.lineTo(x + 36, y - 35); ctx.lineTo(x + 26, y - 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8f8a7c'; ctx.beginPath(); ctx.ellipse(x - 4, y - 23, 12, 6, -0.25, 0, TAU); ctx.fill();                     // 翅膀
    ctx.fillStyle = K.bg; ctx.beginPath(); ctx.arc(x + 20, y - 38, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function person(ctx, x, hand, alpha) {           // 簡單火柴人
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = K.white; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, HEAD + 17); ctx.lineTo(x, HIP);                                   // 身體
    ctx.moveTo(x, SH); ctx.lineTo(hand.x, hand.y);                                  // 伸出的手
    ctx.moveTo(x, SH); ctx.lineTo(x - 30, 322);                                     // 另一隻手
    ctx.moveTo(x, HIP); ctx.lineTo(x - 18, GY); ctx.moveTo(x, HIP); ctx.lineTo(x + 18, GY);   // 兩腳踩地
    ctx.stroke();
    ctx.fillStyle = K.bg; ctx.beginPath(); ctx.arc(x, HEAD, 17, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drops(ctx, tl, alpha) {                 // 濕手：水滴（淺色空心水滴，形狀和電子圓球不同）
    if (alpha <= 0.01) return;
    const base = [[30, 18], [18, 40], [42, 44]];
    base.forEach(([dx, dy], k) => {
      const u = ((tl * 0.5 + k * 0.37) % 1 + 1) % 1;
      const x = HAND_T.x + dx, y = HAND_T.y + dy + 10 * u, r = 7;
      ctx.save(); ctx.globalAlpha *= alpha * (1 - 0.5 * u);
      ctx.fillStyle = 'rgba(191,233,255,0.28)'; ctx.strokeStyle = K.water; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x + r, y - r * 0.4, x + r, y); ctx.arc(x, y, r, 0, Math.PI); ctx.quadraticCurveTo(x - r, y - r * 0.4, x, y - r * 2);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
  }
  function bodyFrame(ctx, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(77,210,255,0.55)'; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(77,210,255,0.06)';
    rrect(ctx, 510, 214, 140, 202, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // 金屬外殼電器（第 4 步）
  function caseBody(ctx) {
    ctx.save(); ctx.fillStyle = '#1a2f2a'; ctx.strokeStyle = K.metal; ctx.lineWidth = 6;
    rrect(ctx, CASE.x0, CASE.y0, CASE.x1 - CASE.x0, CASE.y1 - CASE.y0, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function element(ctx, on) {
    const w = 96, h = 36, y = (RET + LIVE) / 2;
    ctx.save();
    if (on > 0.02) { ctx.shadowColor = `rgba(242,236,217,${0.7 * on})`; ctx.shadowBlur = 16 * on; }
    ctx.fillStyle = mix('#0f2620', '#2a7a63', on); ctx.strokeStyle = mix('#5f7a70', '#f2ecd9', 0.4 + 0.6 * on); ctx.lineWidth = 3;
    rrect(ctx, ELX - w / 2, y - h / 2, w, h, 8); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
    text(ctx, tr('電器', 'Device'), ELX, y, mix('#9fb3aa', '#f2ecd9', on), 22);
  }
  function faultMark(ctx, a) {                     // 漏電：帶電導線碰到外殼（橘色接觸點，不畫火花）
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = K.hot; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(FLT, LIVE + 4);
    for (let k = 1; k <= 6; k++) ctx.lineTo(FLT + (k % 2 ? 6 : -6), LIVE + 4 + k * 8);
    ctx.stroke();
    ctx.fillStyle = K.hot; ctx.beginPath(); ctx.arc(FLT, LIVE, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 漏電斷路器：一個盒子同時跨在兩條導線上；c＝接點 0 開～1 合；盒頂搖桿（合＝ON 往右、開＝OFF 往左）
  function gfci(ctx, c) {
    const x0 = GX - GFW / 2, x1 = GX + GFW / 2;
    ctx.save();
    const a = (-35 + 70 * c) * Math.PI / 180, L = 30;
    ctx.strokeStyle = K.white; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(GX, GF_Y0); ctx.lineTo(GX + L * Math.sin(a), GF_Y0 - L * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = c > 0.5 ? K.green : K.hot;
    ctx.beginPath(); ctx.arc(GX + L * Math.sin(a), GF_Y0 - L * Math.cos(a), 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0f2a22'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x0, GF_Y0, GFW, GF_Y1 - GF_Y0, 10); ctx.fill(); ctx.stroke();
    const X1 = 24, b = (1 - c) * 34 * Math.PI / 180, BL = 2 * X1;
    [RET, LIVE].forEach(y => {
      ctx.strokeStyle = K.wire; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(GX - X1, y); ctx.moveTo(GX + X1, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.strokeStyle = K.white; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(GX + X1, y); ctx.lineTo(GX + X1 - BL * Math.cos(b), y - BL * Math.sin(b)); ctx.stroke();
      ctx.fillStyle = K.white;
      [-X1, X1].forEach(dx => { ctx.beginPath(); ctx.arc(GX + dx, y, 5, 0, TAU); ctx.fill(); });
    });
    // 兩條線一起穿過的感測環（示意「比較流出和回來」）
    ctx.strokeStyle = K.cyan; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
    rrect(ctx, x0 + 10, RET - 14, 22, LIVE - RET + 28, 8); ctx.stroke();
    ctx.restore();
  }

  // ───────── 第 1～4 步的電路場景 ─────────
  function drawCircuit(ctx, i, tl, t) {
    const s4 = i === 3;
    ground(ctx);
    // ── 導線（先畫） ──
    const wireCol = K.wire;
    stroke(ctx, [v(LX, BN), v(LX, LIVE)], wireCol, 6);
    stroke(ctx, [v(LX, BP), v(LX, RET), v(EX, RET), v(EX, GP - 6)], wireCol, 6);   // 正極 → 接地線 → 大地
    if (!s4) {
      stroke(ctx, [v(LX, LIVE), v(LAMPX, LIVE), v(LAMPX, RET), v(LX, RET)], wireCol, 6);
    } else {
      stroke(ctx, [v(LX, LIVE), v(GX - GFW / 2, LIVE)], wireCol, 6);
      stroke(ctx, [v(LX, RET), v(GX - GFW / 2, RET)], wireCol, 6);
      stroke(ctx, [v(GX + GFW / 2, LIVE), v(CASE.x0, LIVE)], wireCol, 6);
      stroke(ctx, [v(GX + GFW / 2, RET), v(CASE.x0, RET)], wireCol, 6);
      stroke(ctx, [v(GWX, CASE.y1), v(GWX, GP - 6)], K.green, 6);                        // 外殼接地線（綠）
    }
    earthSym(ctx, EX, GY - 22);
    if (s4) earthSym(ctx, GWX, GY - 22);
    if (i === 1 || i === 2) bareSpot(ctx, i === 1 ? ease((tl - 0.3) / 0.5) : 1);
    if (s4) {
      caseBody(ctx);
      stroke(ctx, [v(CASE.x0, LIVE), v(ELX, LIVE)], wireCol, 6);
      stroke(ctx, [v(CASE.x0, RET), v(ELX, RET)], wireCol, 6);
    }
    // ── 人（第 2～4 步，是電子可能經過的「路」，先畫，電子疊在上面） ──
    if (i === 1) {
      const a = ease((tl - 0.3) / 0.6), r = ease((tl - 1.0) / (TOUCH - 1.0));
      bodyFrame(ctx, ease((tl - 2.4) / 0.6));
      person(ctx, PX, { x: lerp(HAND_R.x, HAND_T.x, r), y: lerp(HAND_R.y, HAND_T.y, r) }, a);
    } else if (i === 2) {
      bodyFrame(ctx, 1);
      person(ctx, PX, HAND_T, 1);
    } else if (s4) {
      person(ctx, P4, HAND4, ease((tl - 0.3) / 0.6));
    }
    // ── 電子（＋能量方塊） ──
    if (!s4) {
      flow(ctx, LAMP, dist(i, 'lamp', tl) + i * 29, 60, 1, DROP_LAMP, 1, true);
      if (i === 1) flow(ctx, BODY, dist(i, 'body', tl), 36, ease((tl - TOUCH) / 0.6), DROP_BODY, 0, true);
      if (i === 2) flow(ctx, BODY, dist(i, 'body', tl) + 17, 36, 1, DROP_BODY, ease((tl - WET0) / (WET1 - WET0)), true);
    } else {
      flow(ctx, NORM4, dist(i, 'n4', tl), 60, 1, DROP_N4, 1, true);
      flow(ctx, LEAK, dist(i, 'leak', tl) + 11, 50, ease((tl - FAULT - 0.2) / 0.8), LEAK.L + 1, 1, true);
    }
    // ── 元件（最後畫） ──
    battery(ctx);
    if (!s4) lampBox(ctx, 1);
    else {
      const on = speed(3, 'n4', tl) / V;
      element(ctx, on);
      faultMark(ctx, ease((tl - FAULT) / 0.3));
      gfci(ctx, 1 - ease((tl - TRIP) / 0.2));
    }
    if (i === 0) bird(ctx, BIRDX, -40 * (1 - ease((tl - 0.5) / 0.8)), ease((tl - 0.5) / 0.5));
    if (i === 2) drops(ctx, tl, ease((tl - 0.4) / 0.6));
  }

  function circuitLabels(ctx, i, tl) {
    text(ctx, '+', LX + 50, BP - 12, K.pos, 28, 'center', 1, true);
    text(ctx, '−', LX - 38, BN + 11, K.electron, 28, 'center', 1, true);   // 負極記號放左邊，避開導線上方的能量方塊
    para(ctx, tr('電源', 'Power source'), LX, 250, 110, K.white, 22, 'center', 1, 26);
    text(ctx, tr('帶電導線', 'Live wire'), i === 3 ? 560 : 320, 156, K.muted, 22);
    text(ctx, tr('大地', 'Ground'), 920, 456, '#d8c3a0', 22);
    if (i === 0) {
      text(ctx, tr('兩腳站在同一條線上', 'Both feet on one wire'), BIRDX, 262, K.cyan, 22, 'center', ease((tl - 1.8) / 0.6));
    } else if (i === 1 || i === 2) {
      text(ctx, tr('破損處', 'Damaged spot'), BX + 28, 163, K.orange, 22, 'left', i === 1 ? ease((tl - 0.5) / 0.6) : 1);
      if (i === 1) para(ctx, tr('電流通過人體', 'Current through the body'), 668, 318, 300, K.cyan, 22, 'left', ease((tl - 3.0) / 0.6), 28);
      else {
        const k = ease((tl - WET0 - 0.2) / 0.5);
        para(ctx, tr('電流通過人體', 'Current through the body'), 668, 318, 300, K.cyan, 22, 'left', 1 - k, 28);
        para(ctx, tr('通過人體的電子：更多、更快', 'Through the body: more, faster electrons'), 668, 318, 300, K.cyan, 22, 'left', k, 28);
        text(ctx, tr('濕手', 'Wet hand'), 672, 236, K.water, 22, 'left', ease((tl - 0.8) / 0.5));
      }
    } else {
      const off = ease((tl - TRIP) / 0.2);
      text(ctx, 'OFF', GX - 56, 88, off > 0.5 ? K.hot : K.dim, 24, 'center', 1, true);
      text(ctx, 'ON', GX + 54, 88, off <= 0.5 ? K.green : K.dim, 24, 'center', 1, true);
      para(ctx, tr('漏電斷路器', 'Earth-leakage breaker'), GX, 290, 260, K.white, 22, 'center', ease((tl - 0.5) / 0.5), 28);
      text(ctx, tr('流出 ≠ 回來', 'Out ≠ back'), GX, 326, K.orange, 22, 'center', ease((tl - 3.6) / 0.5));
      para(ctx, tr('金屬外殼', 'Metal case'), 872, 285, 104, K.white, 22, 'center', 1, 28);
      text(ctx, tr('漏電', 'Leak'), FLT + 14, 248, K.hot, 22, 'left', ease((tl - FAULT - 0.1) / 0.4));
      para(ctx, tr('接地線', 'Earth wire'), GWX + 16, 364, 1000 - GWX - 24, K.green, 22, 'left', ease((tl - 0.6) / 0.5), 28);
      text(ctx, tr('不走人體', 'Not through the body'), 640, 236, K.green, 22, 'right', ease((tl - 2.6) / 0.5));
    }
  }

  // ───────── 各步驟的標註（下方兩行） ─────────
  const BY1 = 500, BY2 = 534;
  const N = {
    0: [[3.0, ['只碰一條線，沒有通路：不會電流通過身體', 'Touching only one wire, no closed path: no current through the body'], K.yellow, 1],
        [4.6, ['電子沿著導線流過，不經過小鳥', 'Electrons flow along the wire, not through the bird'], K.white, 2]],
    1: [[3.6, ['碰到帶電處，又經地面形成通路：電流可能通過人體', 'Live spot + ground make a closed path: current may pass through the body'], K.yellow, 1],
        [5.2, ['通路：導線 → 手 → 身體 → 腳 → 大地 → 電源', 'Path: wire → hand → body → feet → ground → source'], K.white, 2]],
    2: [[2.8, ['潮濕：皮膚與接觸處的電阻變小，危險增加', 'Wet: lower resistance at the skin and contact, more danger'], K.yellow, 1],
        [4.4, ['提醒：不用濕手碰插頭、積水處不用電器', 'Tip: no wet hands on plugs; no devices near standing water'], K.cyan, 2]]
  };
  const N4 = [[0.6, ['電器的金屬外殼接上接地線', 'The metal case is connected to an earth wire'], K.white],
              [FAULT + 0.3, ['漏電：電流改走接地線回到大地，不走人體', 'Leak: current takes the earth wire to the ground, not the body'], K.green],
              [3.6, ['漏電斷路器發現：流出和回來的電流不一樣多', 'The breaker senses: current out ≠ current back'], K.white],
              [TRIP, ['→ 快速切斷電源，電子停止', '→ It cuts the power fast; electrons stop'], K.hot]];
  function crossfade(list, tl, draw) {                // list = [[開始秒, 內容]]，新的淡入、前一個淡出
    let k = 0; while (k + 1 < list.length && tl >= list[k + 1][0]) k++;
    const a = k === 0 ? 1 : ease((tl - list[k][0]) / 0.3);
    if (k > 0 && a < 1) draw(list[k - 1][1], 1 - a);
    draw(list[k][1], a);
  }
  function drawNotes(ctx, i, tl) {
    if (N[i]) N[i].forEach(([t0, s, c, row]) => line1(ctx, T(s), row === 1 ? BY1 : BY2, c, ease((tl - t0) / 0.6)));
    else if (i === 3) {
      if (tl >= N4[0][0]) crossfade(N4.map(n => [n[0], n]), tl, (n, a) => line1(ctx, T(n[1]), BY1, n[2], a * ease((tl - N4[0][0]) / 0.3)));
      line1(ctx, tr('接地＋漏電斷路器是保護措施，不能取代正確使用', 'Earthing + leakage breakers protect, but never replace safe use'), BY2, K.yellow, ease((tl - 6.3) / 0.6));
    }
  }

  // ───────── 第 5 步：發現有人觸電（三列，一次一句） ─────────
  const ROWS = [
    ['① 不要徒手碰觸', '① Do not touch them with bare hands'],
    ['② 先切斷電源', '② Cut off the power first'],
    ['③ 立即呼叫成人與緊急救援', '③ Call an adult and emergency help at once']
  ];
  const RY = [135, 245, 355], RH = 96;
  function handIcon(ctx, x, y) {                     // 張開的手＋叉
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.18)'; ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    [-15, -5, 5, 15].forEach((dx, k) => { rrect(ctx, x + dx - 4.5, y - 34 + (k === 0 || k === 3 ? 6 : 0), 9, 30, 4.5); ctx.fill(); ctx.stroke(); });
    ctx.save(); ctx.translate(x - 24, y + 4); ctx.rotate(-0.7); rrect(ctx, -4.5, -18, 9, 24, 4.5); ctx.fill(); ctx.stroke(); ctx.restore();
    rrect(ctx, x - 21, y - 10, 42, 38, 10); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K.hot; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 34, y - 38); ctx.lineTo(x + 34, y + 36); ctx.moveTo(x + 34, y - 38); ctx.lineTo(x - 34, y + 36); ctx.stroke();
    ctx.restore();
  }
  function switchIcon(ctx, x, y) {                   // 開關推到 OFF：搖桿往左、接片抬起（缺口）
    const bw = 80, bh = 46;
    ctx.save();
    const a = -35 * Math.PI / 180, L = 26;
    ctx.strokeStyle = K.white; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - bh / 2 + 6); ctx.lineTo(x + L * Math.sin(a), y - bh / 2 + 6 - L * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = K.hot; ctx.beginPath(); ctx.arc(x + L * Math.sin(a), y - bh / 2 + 6 - L * Math.cos(a), 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0f2a22'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x - bw / 2, y - bh / 2 + 6, bw, bh, 9); ctx.fill(); ctx.stroke();
    const cy = y + 12, X1 = 20;
    ctx.strokeStyle = K.wire; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - bw / 2, cy); ctx.lineTo(x - X1, cy); ctx.moveTo(x + X1, cy); ctx.lineTo(x + bw / 2, cy); ctx.stroke();
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; const b = 34 * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(x + X1, cy); ctx.lineTo(x + X1 - 2 * X1 * Math.cos(b), cy - 2 * X1 * Math.sin(b)); ctx.stroke();
    ctx.fillStyle = K.white; [-X1, X1].forEach(dx => { ctx.beginPath(); ctx.arc(x + dx, cy, 4, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function phoneIcon(ctx, x, y, t) {                 // 手機＋發出訊號
    ctx.save(); ctx.fillStyle = '#0f2a22'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x - 24, y - 38, 48, 76, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(85,233,255,0.25)'; rrect(ctx, x - 17, y - 28, 34, 50, 4); ctx.fill();
    ctx.fillStyle = K.white; ctx.beginPath(); ctx.arc(x, y + 30, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = K.green; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const pulse = 0.4 + 0.6 * ((Math.sin(t * 4 - k * 0.9) + 1) / 2);
      ctx.globalAlpha = pulse; ctx.beginPath(); ctx.arc(x + 20, y - 26, 14 + k * 10, -0.95, 0.15); ctx.stroke();
    }
    ctx.restore();
  }
  function drawSummary(ctx, tl, t) {
    ROWS.forEach((r, k) => {
      const al = ease((tl - 0.3 - k * 1.5) / 0.6);
      if (al <= 0.01) return;
      const y = RY[k];
      ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
      rrect(ctx, 30, y - RH / 2, 940, RH, 14); ctx.fill(); ctx.stroke();
      if (k === 0) handIcon(ctx, 120, y);
      else if (k === 1) switchIcon(ctx, 120, y);
      else phoneIcon(ctx, 110, y, t);
      ctx.restore();
      if (k === 1) text(ctx, 'OFF', 205, y + 12, K.hot, 24, 'center', al, true);
      if (k === 2) text(ctx, tr('求救', 'SOS'), 200, y + 4, K.green, 24, 'center', al);
      const z = isZh() ? 28 : 26;
      para(ctx, T(r), 270, y, 680, k === 0 ? K.yellow : K.white, z, 'left', al, z * 1.3);
    });
    para(ctx, tr('電流只在形成通路時才流動', 'Current flows only through a closed path'), W / 2, 462, 940, K.cyan, 24, 'center', ease((tl - 4.8) / 0.6), 30);
    text(ctx, tr('動畫僅示意｜不可實驗', 'Animation is only a model | Do not try this'), W / 2, 506, K.muted, 22, 'center', ease((tl - 5.4) / 0.6));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, showEnergy) {
    const items = [[tr('藍球＝電子，從負極出發', 'Blue ball = electron, from − end'), 'b']];
    if (showEnergy) items.push([tr('藍方塊＝能量（教學符號）', 'Blue square = energy'), 's']);
    const z = 22, gapIcon = 28, gapItem = 36;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 570;
    items.forEach(([s, kind], k) => {
      if (kind === 's') square(ctx, x + 10, y, 1, true); else ball(ctx, x + 10, y, 6, 1);
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
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
  function drawScene(ctx, i, tl, t) {
    if (i < 4) {
      drawCircuit(ctx, i, tl, t);
      circuitLabels(ctx, i, tl);
      drawNotes(ctx, i, tl);
    } else drawSummary(ctx, tl, t);
    drawLegend(ctx, i < 4);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('shockAnimCanvas');
  const ctl = () => window.EsAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('shockAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-shock');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-shock'); if (!row) return;
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

  window.EsAnim.shock = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-shock'); if (row) row.innerHTML = '';
      const r = document.getElementById('shockAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { shock: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'shock' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
