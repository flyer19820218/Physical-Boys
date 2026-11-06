/* electrical_safety_3_short_1106_v1.js — 「短路怎麼發生」分頁動畫（#shortAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EsAnim.short = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'short'。畫布不綁任何事件；唯一控制是 #steps-short 裡的 5 個步驟鈕；結果框 #shortAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。電路：左幹線 x=170（電池在 y=300：上長細＝正極、下短粗＝負極），
 *   上導線 y=150、下導線 y=450、右幹線 x=640，燈泡在右幹線正中央 (640,300)。
 *   跨接導線：節點 J1=(640,200)、J2=(640,400)，往左到 x=520 再垂直連接（與燈泡並聯，畫在燈泡左側）。
 *   電子由負極出發：往下 → 下導線往右 → 右幹線往上 → 上導線往左 → 回正極。
 *   能量方塊放在電子外側 18px，跟著電子走；正常迴路在燈泡（元件座標）處變暗。
 *   右側 x≥720：元件旁標註；下方 y≈492/522：本步算式或說明；最下方圖例。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 正常迴路  8 s  只有燈泡；能量在燈泡用掉、燈亮；I = V ÷ R（R＝燈泡電阻，大）
 *   2 接上旁路  8 s  跨接導線沿路徑畫出來；標「電阻很小」「電阻大」；兩條路（並聯）
 *   3 改走旁路  9 s  電子大多改走旁路（又密又快），燈泡支路只剩零星慢電子；R 很小 → I 很大；旁路發紅發熱
 *   4 燈泡熄滅  8 s  燈泡熄滅；燈泡前後方塊一樣多＝兩端電壓差 ≈ 0
 *   5 結論      9 s  兩欄對照（各附小電路）＋底部重點句
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EsAnim.ctl.onEnd。
 * EsAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–28px，Noto Sans TC 900（算式 JetBrains Mono）；寫字前一律 measureText。
 * 電子疏密只是定性表示，不照比例；不寫任何電流數值。
 */
(function () {
  'use strict';
  window.EsAnim = window.EsAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', muted: '#9fb3aa', dim: '#5f7a70', wire: '#9fb3aa',
    electron: '#4dd2ff', energy: '#4dd2ff', energyDim: '#1d5466', heat: '#ff5a3c', panel: '#123329',
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
  // 多行文字：自動換行，回傳行數；lines 置中於 y
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
    let cx = align === 'left' ? x : x - w / 2;
    segs.forEach(g => { text(ctx, g[0], cx, y + (g[3] || 0), g[1], g[2], 'left', alpha, g[4]); cx += textW(ctx, g[0], g[2], g[4]); });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

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
  const LX = 170, RX = 640, TOP = 150, BOT = 450, MID = 300;
  const BAT_P = MID - 8, BAT_N = MID + 8;          // 正極板（上，長細）、負極板（下，短粗）
  const J1 = 200, J2 = 400, JX = 520;              // 跨接導線節點與垂直段
  const BULB_R = 30;

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
  // 正常迴路（經燈泡）：從負極出發，最後一小段是電池內部（隱藏）
  const LOOP_N = mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]);
  // 短路迴路（經跨接導線）
  const LOOP_S = mkPath([{ x: LX, y: BAT_N }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: J2 }, { x: JX, y: J2 }, { x: JX, y: J1 },
    { x: RX, y: J1 }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: BAT_P }, { x: LX, y: BAT_N }]);
  const BR_B = mkPath([{ x: RX, y: J2 }, { x: RX, y: J1 }]);                     // 燈泡支路
  const JUMP = mkPath([{ x: RX, y: J1 }, { x: JX, y: J1 }, { x: JX, y: J2 }, { x: RX, y: J2 }]);   // 跨接導線（畫線用）
  const HIDE_N = LOOP_N.L - (BAT_N - BAT_P), HIDE_S = LOOP_S.L - (BAT_N - BAT_P);
  const S_BULB = sOf(LOOP_N, RX, MID);             // 能量在燈泡（元件座標）用掉
  const S_BULB_B = sOf(BR_B, RX, MID);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['正常迴路', 'Normal'],
      cap: ['正常迴路：電子繞一圈，能量在燈泡用掉', 'Normal circuit: the bulb uses the energy'],
      res: ['電子從負極出發繞一圈，能量在燈泡轉換成光和熱，所以燈泡發亮。', 'Electrons leave the − end and go around; the bulb turns their energy into light and heat, so it glows.'] },
    { dur: 8, b: ['接上旁路', 'Add wire'],
      cap: ['一條導線跨接在燈泡兩端', 'A wire is connected across the bulb'],
      res: ['跨接導線把燈泡兩端接在一起，和燈泡並聯：導線電阻很小，燈泡電阻大。', 'The wire joins the two ends of the bulb, in parallel with it: the wire has very small resistance, the bulb has large resistance.'] },
    { dur: 9, b: ['改走旁路', 'Detour'],
      cap: ['電子大多改走電阻很小的旁路', 'Most electrons take the low-resistance bypass'],
      res: ['旁路電阻很小，電流很大，電子大多改走旁路；能量沒有在燈泡用掉，旁路導線開始發熱。', 'The bypass has very small resistance, so the current is very large and most electrons go that way; the energy is not used in the bulb, and the bypass wire heats up.'] },
    { dur: 8, b: ['燈泡熄滅', 'Bulb out'],
      cap: ['燈泡熄滅：燈泡兩端幾乎沒有電壓差', 'The bulb goes out: almost no voltage across it'],
      res: ['旁路把燈泡兩端連在一起，燈泡兩端幾乎沒有電壓差，所以幾乎沒有電流通過燈泡。', 'The bypass connects the two ends of the bulb, so there is almost no voltage across it and almost no current through it.'] },
    { dur: 9, b: ['結論', 'Summary'],
      cap: ['正常迴路 vs 短路', 'Normal circuit vs short circuit'],
      res: ['短路不是電流消失，而是電流大多改走低電阻旁路，導線可能急速發熱，所以線路上要有保護裝置。動畫僅示意｜不可實驗。',
        'A short circuit does not make the current disappear: most of it takes the low-resistance bypass, and the wires may heat up very fast, so circuits need protective devices. Animation is only a model | Do not try this.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const T3 = STARTS[2];
  const V_N = 70, SP_N = 46;                        // 正常：速度 px/s、間距
  const V_S0 = 70, V_S1 = 230;                      // 短路：速度由 70 漸增到 230
  const RAMP = 1.6;
  function distS(t) {                               // 短路迴路電子走過的距離（速度的積分，解析式）
    const u = Math.max(0, t - T3);
    if (u <= RAMP) {                                // ∫ ease(x/RAMP) dx = RAMP·(k³ − k⁴/2)
      const k = u / RAMP; return V_S0 * u + (V_S1 - V_S0) * RAMP * (k * k * k - k * k * k * k / 2);
    }
    return V_S0 * RAMP + (V_S1 - V_S0) * RAMP * 0.5 + V_S1 * (u - RAMP);
  }
  function state(i, tl) {
    const st = { jump: 0, aN: 0, aS: 0, aDense: 0, bulb: 1, heat: 0, nodes: 0 };
    if (i === 0) { st.aN = 1; }
    else if (i === 1) { st.aN = 1; st.jump = ease((tl - 0.6) / 2.6); st.nodes = st.jump >= 1 ? 1 : 0; }
    else if (i === 2) {
      st.jump = 1; st.nodes = 1;
      st.aN = 1 - ease(tl / 1.0); st.aS = ease(tl / 1.0); st.aDense = ease((tl - 0.6) / 1.4);
      st.bulb = 1 - 0.6 * ease((tl - 0.6) / 2.4);
      st.heat = ease((tl - 2.2) / 1.6);
    } else if (i === 3) {
      st.jump = 1; st.nodes = 1; st.aS = 1; st.aDense = 1; st.heat = 1;
      st.bulb = 0.4 * (1 - ease((tl - 0.3) / 1.5));
    } else { st.jump = 1; st.nodes = 1; st.aS = 1; st.aDense = 1; st.heat = 1; st.bulb = 0; }
    return st;
  }

  // ───────── 畫電路（只畫圖形，不寫字；標註另外寫） ─────────
  function wirePath(ctx, pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  function strokePartial(ctx, P, len) {
    if (len <= 0) return;
    ctx.beginPath(); ctx.moveTo(P.pts[0].x, P.pts[0].y);
    for (const q of P.seg) {
      if (len >= q.s0 + q.len) ctx.lineTo(q.b.x, q.b.y);
      else { const u = len - q.s0; ctx.lineTo(q.a.x + q.dx * u, q.a.y + q.dy * u); break; }
    }
    ctx.stroke();
  }
  function bulbGlow(ctx, b, t) {
    if (b <= 0.02) return;
    ctx.save();
    const g = ctx.createRadialGradient(RX, MID, BULB_R * 0.6, RX, MID, BULB_R + 58);
    g.addColorStop(0, `rgba(255,243,196,${0.55 * b})`); g.addColorStop(1, 'rgba(255,243,196,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(RX, MID, BULB_R + 58, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,243,196,${0.85 * b})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.39, r0 = BULB_R + 10, r1 = BULB_R + 22 + 4 * Math.sin(t * 4 + k);
      if (Math.abs(Math.cos(a)) < 0.25) continue;            // 上下兩條是導線方向，不畫光芒
      ctx.beginPath(); ctx.moveTo(RX + r0 * Math.cos(a), MID + r0 * Math.sin(a));
      ctx.lineTo(RX + r1 * Math.cos(a), MID + r1 * Math.sin(a)); ctx.stroke();
    }
    ctx.restore();
  }
  function bulbBody(ctx, b) {
    ctx.save();
    ctx.fillStyle = b > 0.02 ? mix('#1b3a31', '#fff3c4', 0.85 * b) : '#1b3a31';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(RX, MID, BULB_R, 0, TAU); ctx.fill(); ctx.stroke();
    // 燈絲（上下接腳＋中間鋸齒）
    ctx.strokeStyle = b > 0.02 ? mix('#9fb3aa', '#ff9a3c', b) : '#9fb3aa'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(RX, MID + BULB_R); ctx.lineTo(RX, MID + 12);
    for (let k = 0; k <= 6; k++) ctx.lineTo(RX + (k % 2 ? 9 : -9), MID + 12 - k * 4);
    ctx.lineTo(RX, MID - 12); ctx.lineTo(RX, MID - BULB_R); ctx.stroke();
    ctx.restore();
  }
  function battery(ctx) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineCap = 'butt';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LX - 36, BAT_P); ctx.lineTo(LX + 36, BAT_P); ctx.stroke();   // 正極：長細
    ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(LX - 18, BAT_N + 3); ctx.lineTo(LX + 18, BAT_N + 3); ctx.stroke();   // 負極：短粗
    ctx.restore();
  }
  function heatWaves(ctx, h, t) {
    if (h <= 0.05) return;
    for (let k = 0; k < 6; k++) {
      const u = ((t * 0.6 + k * 0.29) % 1 + 1) % 1, y0 = J2 - 14 - k * 32 - 20 * u;
      ctx.save(); ctx.globalAlpha = h * (1 - 0.6 * u); ctx.strokeStyle = K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.shadowColor = K.heat; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let s = 0; s <= 20; s++) { const yy = y0 - s; const xx = JX - 26 + 5 * Math.sin(s / 20 * TAU + t * 3 + k); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
    }
  }
  // 沿迴路放電子（＋能量方塊）；drops＝能量用掉的弧長；sets＝每段間距內的電子組數
  function flow(ctx, P, hide, d, sp, alpha, opt) {
    if (alpha <= 0.01) return;
    const n = Math.max(1, Math.round(P.L / sp)), gap = P.L / n;
    const sets = opt.sets || 1;
    for (let j = 0; j < sets; j++) {
      const aj = alpha * (j === 0 ? 1 : opt.aDense);
      if (aj <= 0.01) continue;
      for (let k = 0; k < n; k++) {
        const s = ((k * gap + j * gap / sets + d) % P.L + P.L) % P.L;
        if (s > hide - 2) continue;                       // 電池內部不畫
        const p = at(P, s);
        const fade = clamp(Math.min(s, hide - s) / 10, 0, 1);
        if (opt.squares && j === 0) {
          const full = opt.dropAt === undefined ? true : s < opt.dropAt;
          square(ctx, p.x + p.nx * 18, p.y + p.ny * 18, aj * fade * opt.sqA, full);   // 跨接導線那段落在框內側，熱紋在外側
        }
        ball(ctx, p.x, p.y, opt.r || 6, aj * fade);
      }
    }
  }
  function drawCircuit(ctx, st, t, opt) {
    opt = opt || {};
    const sqA = opt.squares === false ? 0 : 1;
    bulbGlow(ctx, st.bulb, t);
    // 導線
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = K.wire; ctx.lineWidth = 6;
    wirePath(ctx, [{ x: LX, y: BAT_P }, { x: LX, y: TOP }, { x: RX, y: TOP }, { x: RX, y: BOT }, { x: LX, y: BOT }, { x: LX, y: BAT_N }]); ctx.stroke();
    if (st.jump > 0) {
      const h = st.heat * (0.85 + 0.15 * Math.sin(t * 5));
      if (h > 0.02) {
        ctx.save(); ctx.shadowColor = `rgba(255,90,60,${h})`; ctx.shadowBlur = 24 * h;
        ctx.strokeStyle = `rgba(255,90,60,${0.55 * h})`; ctx.lineWidth = 6 + 14 * h;
        strokePartial(ctx, JUMP, JUMP.L); ctx.restore();
      }
      ctx.strokeStyle = mix('#9fb3aa', '#ff7a4d', clamp(st.heat, 0, 1)); ctx.lineWidth = 6;
      strokePartial(ctx, JUMP, JUMP.L * st.jump);
      if (st.jump < 1) {                                  // 正在接上的導線頭
        const p = at(JUMP, JUMP.L * st.jump);
        ctx.fillStyle = K.white; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    // 電子（＋能量方塊）
    flow(ctx, LOOP_N, HIDE_N, V_N * t, SP_N, st.aN, { squares: true, dropAt: S_BULB, sqA });
    flow(ctx, LOOP_S, HIDE_S, distS(t), SP_N, st.aS, { squares: true, sets: 3, aDense: st.aDense, sqA });
    if (st.aS > 0.01) {                                   // 燈泡支路：零星、很慢
      const L = BR_B.L, sp = 120, d = 14 * Math.max(0, t - T3);
      for (let k = 0; k < 2; k++) {
        const s = ((k * sp + 40 + d) % (2 * sp) + 2 * sp) % (2 * sp);
        if (s > L) continue;
        const p = at(BR_B, s), fade = clamp(Math.min(s, L - s) / 12, 0, 1) * st.aS;
        if (sqA) square(ctx, p.x + 18, p.y, fade, true);   // 燈泡沒有拿走能量
        ball(ctx, p.x, p.y, 6, fade);
      }
    }
    heatWaves(ctx, st.heat * (opt.waves === false ? 0 : 1), t);
    // 元件（最後畫）
    bulbBody(ctx, st.bulb);
    battery(ctx);
    if (st.nodes) {
      ctx.save(); ctx.fillStyle = K.white;
      [J1, J2].forEach(y => { ctx.beginPath(); ctx.arc(RX, y, 7, 0, TAU); ctx.fill(); });
      ctx.restore();
    }
  }
  function circuitLabels(ctx) {
    text(ctx, '+', LX + 50, BAT_P - 12, K.pos, 28, 'center', 1, true);
    text(ctx, '−', LX + 34, BAT_N + 16, K.electron, 28, 'center', 1, true);
    para(ctx, tr('電源', 'Power source'), LX - 48, MID, 100, K.white, 22, 'right');
  }

  // ───────── 各步驟的標註 ─────────
  const BY1 = 492, BY2 = 524;
  const SX = 722, SW = 262;                       // 右側標註區
  const IX = JX - 44, IW = 230;                  // 跨接導線左側的標註（靠右對齊，讓開熱紋）
  const Wt = (s, z) => [s, K.white, z || 24, 0], Yl = (s, z) => [s, K.yellow, z || 24, 0], Mo = (s, c, z) => [s, c || K.white, z || 24, 0, true];
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function drawNotes(ctx, i, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    if (i === 0) {
      para(ctx, tr('燈泡發光、發熱', 'Bulb gives off light and heat'), SX, MID, SW, K.white, 22, 'left', a(1.2));
      runs(ctx, [Mo('I = V ÷ R', K.white, 26), Wt(tr('　R＝燈泡的電阻（大）', '   R = the bulb\'s resistance (large)'))], W / 2, (BY1 + BY2) / 2, 'center', a(2.4));
    } else if (i === 1) {
      const al = a(3.2);
      para(ctx, tr('跨接導線', 'Jumper wire'), IX, MID - 18, IW, K.white, 24, 'right', al);
      para(ctx, tr('電阻很小', 'Very small R'), IX, MID + 18, IW, K.yellow, 24, 'right', al);
      para(ctx, tr('燈泡', 'Bulb'), SX, MID - 18, SW, K.white, 24, 'left', a(3.8));
      para(ctx, tr('電阻大', 'Large R'), SX, MID + 18, SW, K.yellow, 24, 'left', a(3.8));
      bottomLines(ctx, tr('兩條路可走：跨接導線和燈泡並聯', 'Two paths: the wire and the bulb are in parallel'), K.white, a(4.6));
    } else if (i === 2) {
      para(ctx, tr('旁路沒有電器', 'No device on the bypass'), IX, MID, IW, K.white, 24, 'right', a(1.2));
      para(ctx, tr('燈泡這條：只剩零星電子', 'Bulb path: only a few electrons'), SX, MID, SW, K.white, 22, 'left', a(1.8));
      const R = tr(' R 很小 → I 很大', ' R very small → I very large');
      runs(ctx, [Mo('I = V ÷ R', K.white, 26), Wt(tr('：', ':')), Yl(R)], W / 2, BY1, 'center', a(2.6));
      const s2 = tr('電流很大，P = I²R 仍然很大，導線發熱', 'Large current: P = I²R is still large, the wire heats up');
      text(ctx, s2, W / 2, BY2, K.orange, 24, 'center', a(3.6));
    } else if (i === 3) {
      const al = a(1.6), sq = (y) => { for (let k = 0; k < 3; k++) square(ctx, SX + 8 + k * 20, y, al, true); };
      const lb1 = tr('出燈泡後', 'After bulb'), lb2 = tr('進燈泡前', 'Before bulb');
      sq(J1 + 4); text(ctx, lb1, SX + 70, J1 + 4, K.white, 22, 'left', al);
      sq(J2 - 4); text(ctx, lb2, SX + 70, J2 - 4, K.white, 22, 'left', al);
      para(ctx, tr('燈泡兩端', 'Voltage across'), SX, MID - 18, SW, K.white, 24, 'left', a(2.6));
      runs(ctx, isZhT() ? [Wt('電壓差 '), Mo('≈ 0', K.yellow, 26)] : [Wt('the bulb '), Mo('≈ 0', K.yellow, 26)], SX, MID + 18, 'left', a(2.6));
      bottomLines(ctx, tr('旁路把燈泡兩端連在一起，燈泡兩端幾乎沒有電壓差，所以幾乎沒有電流', 'The bypass joins the bulb\'s two ends: almost no voltage across the bulb, so almost no current through it'), K.white, a(3.4));
    }
  }
  const isZhT = () => tr('zh', 'en') === 'zh';

  // ───────── 第 5 步：兩欄對照 ─────────
  const PANELS = [
    { x: 30, title: ['正常迴路', 'Normal circuit'], col: K.green,
      body: ['電流通過燈泡，燈亮', 'Current flows through the bulb, so it lights up'] },
    { x: 510, title: ['短路', 'Short circuit'], col: K.orange,
      body: ['電流繞過燈泡走低電阻旁路，\n電流很大，導線急速發熱', 'Current bypasses the bulb through a low-resistance path: very large current, the wire heats up fast'] }
  ];
  const PW = 460, PY = 82, PH = 380, MS = 0.62;
  function drawSummary(ctx, tl, t) {
    PANELS.forEach((pn, k) => {
      const al = ease((tl - 0.3 - k * 0.9) / 0.7);
      if (al <= 0.01) return;
      ctx.save(); ctx.globalAlpha = al;
      ctx.fillStyle = K.panel; ctx.strokeStyle = pn.col; ctx.lineWidth = 2.5;
      rrect(ctx, pn.x, PY, PW, PH, 16); ctx.fill(); ctx.stroke();
      // 小電路（縮小版；只畫圖形）
      const cx = pn.x + PW / 2, cy = PY + 172;
      const ox = (LX - 50 + RX + 60) / 2, oy = MID;
      ctx.save();
      ctx.beginPath(); ctx.rect(pn.x + 10, PY + 54, PW - 20, 238); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(MS, MS); ctx.translate(-ox, -oy);
      const st = k === 0 ? { jump: 0, aN: 1, aS: 0, aDense: 0, bulb: 1, heat: 0, nodes: 0 }
        : { jump: 1, aN: 0, aS: 1, aDense: 1, bulb: 0, heat: 1, nodes: 1 };
      const tt = k === 0 ? t : Math.max(t, T3 + 3);
      drawCircuit(ctx, st, tt, { squares: false, waves: false });
      ctx.restore();
      ctx.restore();
      text(ctx, tr(pn.title[0], pn.title[1]), cx, PY + 30, pn.col, 28, 'center', al);
      para(ctx, tr(pn.body[0], pn.body[1]), cx, PY + 330, PW - 40, K.white, 22, 'center', ease((tl - 0.8 - k * 0.9) / 0.7), 30);
    });
    bottomLines(ctx, tr('短路不是電流消失，是電流改走不該走的低電阻路徑', 'A short circuit is not current disappearing: the current takes a wrong, low-resistance path'), K.yellow, ease((tl - 3.0) / 0.7));
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
          ctx.save(); ctx.shadowColor = K.heat; ctx.shadowBlur = 10; ctx.strokeStyle = '#ff7a4d'; ctx.lineWidth = 7; ctx.lineCap = 'round';
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
      drawCircuit(ctx, state(i, tl), t);
      circuitLabels(ctx);
      drawNotes(ctx, i, tl);
    } else drawSummary(ctx, tl, t);
    drawLegend(ctx, i >= 2);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('shortAnimCanvas');
  const ctl = () => window.EsAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('shortAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-short');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-short'); if (!row) return;
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

  window.EsAnim.short = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-short'); if (row) row.innerHTML = '';
      const r = document.getElementById('shortAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { short: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'short' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
