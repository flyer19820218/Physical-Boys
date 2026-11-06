/* galvanic_batteries_4_galvani_1106_v1.js — 科學史「賈法尼蛙腿實驗」分頁動畫（#galvaniAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.galvani = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'galvani'。畫布不綁事件；唯一控制是 #steps-galvani 的 5 個步驟鈕；結果框 #galvaniAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的 C、label、line…）。
 * 畫面是「場景時間 t 的純函式」：刀的位置、蛙腿抽動（週期函式）、電子位置都只由 t 算出。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。鐵盤 x 200–890、上緣 y=440；蛙腿平躺在鐵盤上（髖部切口在 x≈522，腳尖朝右）；
 *   神經從髖部切口往左上拉出，末端 NT=(444,322)。銅製解剖刀（整支銅）自己移動：
 *   斷開＝刀尖、刀柄尾端都懸空；接通＝刀尖碰神經末端、刀柄尾端碰鐵盤 (300,440)。
 *   左欄 x≤300：刀與鐵盤的標註；右欄 x≥690、y≤270：本步狀態；下方 y≈506/536：本步一句；y≈574 圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只畫在金屬裡（鐵盤 → 接觸點 → 銅刀 → 刀尖），不進神經與蛙腿；
 *   神經與蛙腿裡畫的是「電刺激」（白色光點，刀尖 → 神經 → 蛙腿），不畫成電子。
 *   迴路順序：銅刀 → 神經 → 蛙腿 → 鐵盤 → 回到銅刀。不寫電壓數值、不寫年份數字。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 實驗裝置   8 s  刀懸空、迴路斷開、蛙腿不動
 *   2 金屬接通   9 s  刀落下碰到神經與鐵盤；電子在金屬流、電刺激進神經；蛙腿抽動數下
 *   3 動物電？   8 s  賈法尼的想法：蛙腿像小電池（金屬變暗、蛙腿發光，不畫電子）
 *   4 兩種金屬   9 s  只接上銅（刀柄抬起）→ 不抽動；銅＋鐵都接上 → 抽動；蛙腿是偵測者
 *   5 今天的理解 8 s  兩欄：生物確有電訊號｜不同金屬也能形成電位差；引出下一分頁「伏打電池」
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解），到底時呼叫一次 GbAnim.ctl.onEnd()。
 * GbAnim.ctl.paused 為真時時間凍住。進度條呼叫共用 window.AnimBar.draw（畫布頂端 y=8～24），沒載入時退回細線。
 */
(function () {
  'use strict';
  window.GbAnim = window.GbAnim || {};
  window.GbAnim.ctl = window.GbAnim.ctl || { paused: false, onEnd: null };

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff', pos: '#ff8040',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    fe: '#8d969b', feHi: '#b3bbbf', feLo: '#5a6266',
    skin: '#6f9f55', skinHi: '#93c172', skinLo: '#3c6630', spot: '#3f5f2c', cut: '#e6a5a0',
    nerve: '#f3e7c8', pulse: '#fff7de', red: '#ff6b5a'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpP = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const frac = x => x - Math.floor(x);

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
  // 由上往下排的段落：第一行中心在 y，回傳下一段可用的 y
  function block(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(ctx, l, x, y + k * h, color, size, align, alpha));
    return y + ls.length * h;
  }
  // 置中於 y 的多行文字
  function para(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(ctx, l, x, y + (k - (ls.length - 1) / 2) * h, color, size, align, alpha));
    return ls.length;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  // ───────── 幾何 ─────────
  const PL = { x0: 200, x1: 890, top: 440, th: 24 };            // 鐵盤
  const HIP = { x: 522, y: 414 }, KNEE = { x: 655, y: 417 };     // 蛙腿關節（靜止）
  const N0 = { x: 514, y: 400 }, NC = { x: 486, y: 332 }, NT = { x: 444, y: 322 };   // 神經：髖部切口 → 末端
  const POSE = {                                                  // 銅刀：{tip, butt}
    open: { tip: { x: 424, y: 268 }, butt: { x: 282, y: 392 } },
    closed: { tip: NT, butt: { x: 300, y: PL.top } },
    lifted: { tip: NT, butt: { x: 269, y: 386 } }
  };
  function mixPose(a, b, k) { return { tip: lerpP(a.tip, b.tip, k), butt: lerpP(a.butt, b.butt, k) }; }

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
  function quadPts(a, c, b, n) {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const u = k / n, v = 1 - u;
      out.push({ x: v * v * a.x + 2 * u * v * c.x + u * u * b.x, y: v * v * a.y + 2 * u * v * c.y + u * u * b.y });
    }
    return out;
  }
  // 電子路徑（只在金屬裡）：蛙腿下方的鐵盤 → 刀柄尾端的接觸點 → 沿銅刀 → 刀尖
  const PLATE_Y = PL.top + PL.th / 2;
  const E_PATH = mkPath([{ x: 600, y: PLATE_Y }, { x: 300, y: PLATE_Y }, POSE.closed.butt, POSE.closed.tip]);
  // 電刺激路徑：刀尖 → 神經 → 髖部 → 大腿裡
  const P_PATH = mkPath(quadPts(NT, NC, N0, 16).concat([{ x: 560, y: 414 }, { x: 640, y: 416 }]));

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['實驗裝置', 'Setup'],
      cap: ['實驗裝置：銅製解剖刀還沒碰到，迴路斷開', 'Setup: the copper scalpel is not touching yet — circuit open'],
      res: ['十八世紀末，賈法尼把青蛙放在鐵盤上。銅製解剖刀還沒碰到：沒有電流通過神經，蛙腿不收縮。',
        'Late 18th century: Galvani placed a frog on an iron plate. The copper scalpel is not touching yet: no current flows through the nerve, so the leg does not contract.'] },
    { dur: 9, b: ['金屬接通', 'Contact'],
      cap: ['銅刀碰到神經和鐵盤：兩金屬接觸，蛙腿收縮', 'The scalpel touches the nerve and the iron plate: the leg contracts'],
      res: ['銅製解剖刀碰觸神經，也碰到鐵盤；兩金屬接觸後，迴路接通，蛙腿收縮。',
        'The copper scalpel touches the nerve and also the iron plate; once the two metals touch, the circuit is closed and the leg contracts.'] },
    { dur: 8, b: ['動物電？', 'Animal elec.?'],
      cap: ['賈法尼的想法：動物體內具有「動物電」', "Galvani's idea: animals possess 'animal electricity'"],
      res: ['賈法尼的想法：動物體內具有「動物電」，蛙腿就像一顆小電池。',
        "Galvani's idea: animals possess 'animal electricity' — the frog leg works like a tiny battery."] },
    { dur: 9, b: ['兩種金屬', 'Two metals'],
      cap: ['另一個可能：電來自兩種不同金屬', 'Another possibility: the two different metals make the electricity'],
      res: ['另一個可能：電來自兩種不同金屬，蛙腿只是偵測者。只接上一種金屬，蛙腿不抽動；兩種金屬都接上才抽動。',
        'Another possibility: the electricity comes from the two different metals, and the leg is only a detector. With only one metal, no twitch; with both metals connected, it twitches.'] },
    { dur: 8, b: ['今天的理解', 'Today'],
      cap: ['今天的理解：兩種想法都有道理', "Today's understanding: both ideas make sense"],
      res: ['今天的理解：生物確有電訊號；不同金屬也能形成電位差。蛙腿是偵測者，不是持續電源。下一個分頁：不用蛙腿，能不能得到電？',
        "Today's understanding: living things do have electrical signals, and different metals can also create a potential difference. The leg is a detector, not a lasting power source. Next tab: can we get electricity without a frog leg?"] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const C2 = 2.2, C4 = 4.6;               // 第 2 步、第 4 步「刀柄碰到鐵盤」的步內時間
  const TWP = 1.5;                         // 抽動週期（秒）
  function kickAt(t, t0) {                 // 抽動：快速收縮、較慢放鬆；t0 之前為 0
    const u = t - t0; if (u < 0) return 0;
    const p = frac(u / TWP);
    if (p < 0.16) return ease(p / 0.16);
    return 1 - ease((p - 0.16) / 0.5);
  }
  function state(i, tl, t) {
    const st = { pose: POSE.open, contact: 0, tc: 0, kick: 0, eA: 0, pA: 0, metalA: 1, battery: 0, tipTouch: 0 };
    if (i === 0) return st;
    if (i === 1) {
      st.pose = mixPose(POSE.open, POSE.closed, ease((tl - 0.6) / (C2 - 0.6)));
      if (tl >= C2) {
        st.contact = 1; st.tc = STARTS[1] + C2; st.tipTouch = 1;
        st.eA = ease((tl - C2) / 0.5); st.pA = st.eA;
        st.kick = kickAt(t, STARTS[1] + C2 + 0.35);
      }
      return st;
    }
    if (i === 2) {
      st.pose = POSE.closed; st.contact = 1; st.tipTouch = 1; st.tc = STARTS[2];
      st.metalA = 1 - 0.5 * ease(tl / 0.8); st.battery = ease((tl - 0.6) / 0.8);
      return st;
    }
    if (i === 3) {
      st.tipTouch = 1;
      if (tl < C4 - 0.8) st.pose = mixPose(POSE.closed, POSE.lifted, ease(tl / 0.9));
      else st.pose = mixPose(POSE.lifted, POSE.closed, ease((tl - (C4 - 0.8)) / 0.8));
      if (tl >= C4) {
        st.contact = 1; st.tc = STARTS[3] + C4;
        st.eA = ease((tl - C4) / 0.5); st.pA = st.eA;
        st.kick = kickAt(t, STARTS[3] + C4 + 0.35);
      }
      return st;
    }
    return st;
  }

  // ───────── 圖形 ─────────
  function plate(ctx, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createLinearGradient(0, PL.top, 0, PL.top + PL.th);
    g.addColorStop(0, K.feHi); g.addColorStop(0.25, K.fe); g.addColorStop(1, K.feLo);
    ctx.fillStyle = g; rrect(ctx, PL.x0, PL.top, PL.x1 - PL.x0, PL.th, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(220,228,232,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PL.x0 + 6, PL.top + 1.5); ctx.lineTo(PL.x1 - 6, PL.top + 1.5); ctx.stroke();
    ctx.strokeStyle = '#3f474b'; ctx.lineWidth = 1.5; rrect(ctx, PL.x0, PL.top, PL.x1 - PL.x0, PL.th, 6); ctx.stroke();
    ctx.restore();
  }
  // 錐形肢段（兩端圓），w1→w2，bulge＝肌肉隆起
  function limb(ctx, P, Q, w1, w2, bulge, fill, stroke) {
    const dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const an = Math.atan2(ny, nx), M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 }, mid = (w1 + w2) / 4;
    ctx.beginPath();
    ctx.moveTo(P.x + nx * w1 / 2, P.y + ny * w1 / 2);
    ctx.quadraticCurveTo(M.x + nx * (mid + bulge), M.y + ny * (mid + bulge), Q.x + nx * w2 / 2, Q.y + ny * w2 / 2);
    ctx.arc(Q.x, Q.y, w2 / 2, an, an - Math.PI, true);
    ctx.quadraticCurveTo(M.x - nx * (mid + bulge * 0.5), M.y - ny * (mid + bulge * 0.5), P.x - nx * w1 / 2, P.y - ny * w1 / 2);
    ctx.arc(P.x, P.y, w1 / 2, an + Math.PI, an, true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke();
  }
  function legJoints(kick) {
    const a = 7 * RAD - 30 * RAD * kick;
    const A = { x: KNEE.x + 118 * Math.cos(a), y: KNEE.y + 118 * Math.sin(a) };
    const f = a - 6 * RAD - 22 * RAD * kick;
    const TB = { x: A.x + 38 * Math.cos(f), y: A.y + 38 * Math.sin(f) };
    return { A, f, TB };
  }
  function leg(ctx, kick, glow) {
    const { A, f, TB } = legJoints(kick);
    if (glow > 0.01) {                                  // 第 3 步：蛙腿發光（像電池）
      ctx.save();
      const g = ctx.createRadialGradient(590, 414, 10, 590, 414, 150);
      g.addColorStop(0, `rgba(74,222,128,${0.42 * glow})`); g.addColorStop(1, 'rgba(74,222,128,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(590, 414, 150, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.lineJoin = 'round';
    // 腳掌與蹼
    const toes = [[-0.36, 50], [-0.13, 64], [0.09, 62], [0.30, 48]].map(([da, l]) => {
      const ang = f + da; return { x: TB.x + l * Math.cos(ang), y: TB.y + l * Math.sin(ang) };
    });
    ctx.fillStyle = 'rgba(111,159,85,0.8)'; ctx.strokeStyle = K.skinLo; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(TB.x, TB.y);
    toes.forEach((p, k) => { if (k) { const q = toes[k - 1]; ctx.quadraticCurveTo((p.x + q.x) / 2 * 0.8 + TB.x * 0.2, (p.y + q.y) / 2 * 0.8 + TB.y * 0.2, p.x, p.y); } else ctx.lineTo(p.x, p.y); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    toes.forEach(p => limb(ctx, TB, p, 9, 6, 0, K.skin, K.skinLo));
    ctx.fillStyle = K.skinHi; toes.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); });
    limb(ctx, A, TB, 15, 11, 0, K.skin, K.skinLo);
    // 小腿、大腿
    limb(ctx, KNEE, A, 30, 15, 5, K.skin, K.skinLo);
    limb(ctx, HIP, KNEE, 50, 30, 7, K.skin, K.skinLo);
    // 高光與斑點
    ctx.strokeStyle = 'rgba(170,215,140,0.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(HIP.x + 18, HIP.y - 16); ctx.quadraticCurveTo(590, HIP.y - 28, KNEE.x - 14, KNEE.y - 11); ctx.stroke();
    const a = Math.atan2(A.y - KNEE.y, A.x - KNEE.x);
    ctx.beginPath(); ctx.moveTo(KNEE.x + 14 * Math.cos(a) + 8 * Math.sin(a), KNEE.y + 14 * Math.sin(a) - 8 * Math.cos(a));
    ctx.lineTo(KNEE.x + 80 * Math.cos(a) + 5 * Math.sin(a), KNEE.y + 80 * Math.sin(a) - 5 * Math.cos(a)); ctx.stroke();
    ctx.fillStyle = K.spot;
    [[560, 410, 7, 4], [598, 420, 6, 3.5], [625, 408, 5, 3]].forEach(([x, y, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); });
    [0.35, 0.65].forEach(u => { ctx.beginPath(); ctx.ellipse(lerp(KNEE.x, A.x, u), lerp(KNEE.y, A.y, u) + 2, 4.5, 3, a, 0, TAU); ctx.fill(); });
    // 髖部切口
    ctx.fillStyle = K.cut; ctx.strokeStyle = '#b06f6a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(HIP.x - 14, HIP.y, 10, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function nerve(ctx) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(60,50,30,0.6)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(N0.x, N0.y); ctx.quadraticCurveTo(NC.x, NC.y, NT.x, NT.y); ctx.stroke();
    ctx.strokeStyle = K.nerve; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(N0.x, N0.y); ctx.quadraticCurveTo(NC.x, NC.y, NT.x, NT.y); ctx.stroke();
    ctx.restore();
  }
  function knife(ctx, pose, alpha) {
    const B = pose.butt, T = pose.tip;
    const dx = T.x - B.x, dy = T.y - B.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const P = (s, o) => ({ x: B.x + ux * s + nx * o, y: B.y + uy * s + ny * o });
    const hL = L * 0.58;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(B.x + nx * 9, B.y + ny * 9, B.x - nx * 9, B.y - ny * 9);
    g.addColorStop(0, K.cuHi); g.addColorStop(0.45, K.cu); g.addColorStop(1, K.cuLo);
    // 刀柄（圓角長條）
    ctx.fillStyle = g; ctx.strokeStyle = '#5e3215'; ctx.lineWidth = 1.8;
    const q = [P(0, 9), P(hL, 8), P(hL, -8), P(0, -9)];
    ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); ctx.lineTo(q[1].x, q[1].y); ctx.lineTo(q[2].x, q[2].y); ctx.lineTo(q[3].x, q[3].y);
    ctx.arc(B.x, B.y, 9, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 刀柄紋路
    ctx.strokeStyle = 'rgba(94,50,21,0.65)'; ctx.lineWidth = 1.5;
    for (let k = 1; k <= 4; k++) { const a = P(hL * k / 6, 6.5), b = P(hL * k / 6, -6.5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    // 護環
    const r0 = P(hL - 2, 11), r1 = P(hL + 6, 11), r2 = P(hL + 6, -11), r3 = P(hL - 2, -11);
    ctx.fillStyle = K.cuLo; ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.closePath(); ctx.fill();
    // 刀身：刀背直、刀刃彎到刀尖
    const s0 = hL + 6, bl = L - s0;
    const a0 = P(s0, 6), c = P(s0 + bl * 0.5, -16), e0 = P(s0, -10);
    ctx.fillStyle = g; ctx.strokeStyle = '#5e3215'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(T.x, T.y); ctx.quadraticCurveTo(c.x, c.y, e0.x, e0.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,170,0.7)'; ctx.lineWidth = 1.5;
    const h0 = P(s0 + 4, 3), h1 = P(L - 10, 1);
    ctx.beginPath(); ctx.moveTo(h0.x, h0.y); ctx.lineTo(h1.x, h1.y); ctx.stroke();
    ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function pulseDot(ctx, x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, 'rgba(255,247,222,1)'); g.addColorStop(0.35, 'rgba(255,247,222,0.75)'); g.addColorStop(1, 'rgba(255,247,222,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.restore();
  }
  function electrons(ctx, t, tc, alpha) {
    if (alpha <= 0.01) return;
    const sp = 34, d = 70 * Math.max(0, t - tc), L = E_PATH.L;
    for (let k = -1; k * sp < L + sp; k++) {
      const s = k * sp + (d % sp);
      if (s < 0 || s > L) continue;
      const p = at(E_PATH, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1);
      ball(ctx, p.x, p.y, 6, alpha * fade);
    }
  }
  function pulses(ctx, t, tc, alpha) {
    if (alpha <= 0.01) return;
    const per = 0.75, L = P_PATH.L, v = 260;
    for (let k = 0; k < 3; k++) {
      const age = frac((t - tc) / per - k / 3) * per * 3;     // 每顆光點走一趟約 3×per
      const s = age * v / 2.2;
      if (s > L) continue;
      const p = at(P_PATH, s), fade = clamp(Math.min(s / 12, (L - s) / 40), 0, 1);
      pulseDot(ctx, p.x, p.y, alpha * fade);
    }
  }
  function ring(ctx, x, y, age, color) {                 // 接觸瞬間的光環
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 8 + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function contactDot(ctx, x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function gapMark(ctx, x, y, alpha) {                   // 還沒接觸的位置：虛線小圈
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function batteryOverlay(ctx, k, t) {
    if (k <= 0.01) return;
    const pul = 0.75 + 0.25 * Math.sin(t * 4);
    ctx.save(); ctx.globalAlpha = k;
    ctx.shadowColor = K.green; ctx.shadowBlur = 14 * pul;
    ctx.strokeStyle = K.green; ctx.lineWidth = 3.5; ctx.setLineDash([10, 6]);
    rrect(ctx, 504, 386, 166, 56, 12); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = K.green;
    rrect(ctx, 670, 402, 10, 24, 3); ctx.fill();          // 電池正極凸點
    ctx.restore();
  }

  // ───────── 標註 ─────────
  const RX = 690, RW = 290;                               // 右欄
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function partLabels(ctx, i, tl, metalA) {
    const a = t0 => ease((tl - t0) / 0.6);
    const mA = metalA;
    para(ctx, tr('銅製解剖刀', 'Copper scalpel'), 318, 292, 290, K.cu, 24, 'right', mA * (i === 0 ? a(0.5) : 1));
    para(ctx, tr('鐵盤', 'Iron plate'), PL.x0 - 14, PL.top + PL.th / 2, 180, K.feHi, 24, 'right', mA * (i === 0 ? a(0.9) : 1));
    text(ctx, tr('神經', 'Nerve'), 515, 300, K.nerve, 24, 'center', i === 0 ? a(1.3) : 1);
    if (i !== 2) text(ctx, tr('蛙腿', 'Frog leg'), 640, 348, K.skinHi, 24, 'center', i === 0 ? a(1.7) : 1);
  }
  function mark(ctx, ok, x, y, alpha) {                   // ✓／✗ 圖示（自己畫，不靠字型）
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function drawNotes(ctx, i, tl, st) {
    const a = t0 => ease((tl - t0) / 0.6);
    if (i === 0) {
      text(ctx, tr('十八世紀末', 'Late 18th century'), 30, 110, K.muted, 24, 'left', a(0.3));
      text(ctx, tr('未接觸', 'No contact'), 262, 425, K.muted, 22, 'right', a(2.2));
      let y = block(ctx, tr('迴路斷開', 'Circuit open'), RX, 112, RW, K.muted, 28, 'left', a(2.6), 38);
      y = block(ctx, tr('沒有電流通過神經', 'No current flows through the nerve'), RX, y + 4, RW, K.white, 24, 'left', a(3.2));
      block(ctx, tr('蛙腿不收縮', 'The leg does not contract'), RX, y + 4, RW, K.white, 24, 'left', a(3.8));
      bottomLines(ctx, tr('銅刀、神經、蛙腿、鐵盤還沒有連成一圈', 'The scalpel, nerve, leg and plate are not yet joined in a loop'), K.white, a(4.6));
    } else if (i === 1) {
      text(ctx, tr('十八世紀末', 'Late 18th century'), 30, 110, K.muted, 24, 'left');
      text(ctx, tr('未接觸', 'No contact'), 262, 425, K.muted, 22, 'right', 1 - a(0.3));
      text(ctx, tr('金屬接觸', 'Metals touch'), 284, 412, K.white, 22, 'right', a(C2 + 0.2));
      let y = block(ctx, tr('迴路接通', 'Circuit closed'), RX, 112, RW, K.green, 28, 'left', a(C2 + 0.3), 38);
      block(ctx, tr('兩金屬接觸後，蛙腿收縮', 'Once the two metals touch, the leg contracts'), RX, y + 4, RW, K.white, 24, 'left', a(C2 + 0.9));
      bottomLines(ctx, tr('迴路：銅刀 → 神經 → 蛙腿 → 鐵盤 → 回到銅刀', 'Loop: scalpel → nerve → leg → iron plate → back to scalpel'), K.yellow, a(C2 + 2.0));
    } else if (i === 2) {
      text(ctx, tr('動物電？', 'Animal electricity?'), 632, 360, K.green, 24, 'center', a(1.2));
      let y = block(ctx, tr('賈法尼的想法', "Galvani's idea"), RX, 112, RW, K.green, 28, 'left', a(0.6), 38);
      block(ctx, tr('動物體內具有「動物電」', "Animals possess 'animal electricity'"), RX, y + 4, RW, K.white, 24, 'left', a(1.6));
      bottomLines(ctx, tr('蛙腿像一顆小電池？電是從青蛙身體裡來的？', 'Is the leg like a tiny battery? Does the electricity come from the frog?'), K.yellow, a(2.8));
    } else if (i === 3) {
      text(ctx, tr('未接觸', 'No contact'), 255, 420, K.muted, 22, 'right', a(1.0) * (1 - a(C4 - 0.8)));
      text(ctx, tr('金屬接觸', 'Metals touch'), 284, 412, K.white, 22, 'right', a(C4 + 0.1));
      // 右欄：兩列對照
      const r1 = a(1.3), r2 = a(C4 + 0.3);
      mark(ctx, false, RX + 14, 116, r1);
      let y = block(ctx, tr('只接上銅', 'Copper only'), RX + 40, 116, RW - 40, K.white, 24, 'left', r1);
      y = block(ctx, tr('蛙腿不抽動', 'No twitch'), RX + 40, y, RW - 40, K.red, 24, 'left', r1);
      mark(ctx, true, RX + 14, y + 16, r2);
      y = block(ctx, tr('銅＋鐵都接上', 'Copper + iron'), RX + 40, y + 16, RW - 40, K.white, 24, 'left', r2);
      block(ctx, tr('蛙腿抽動', 'It twitches'), RX + 40, y, RW - 40, K.green, 24, 'left', r2);
      bottomLines(ctx, tr('電可能來自兩種不同金屬，蛙腿只是偵測者', 'The electricity may come from the two different metals; the leg is only a detector'), K.yellow, a(C4 + 1.4));
    }
  }

  // ───────── 第 5 步：兩欄對照 ─────────
  const PW = 450, PY = 84, PH = 300;
  const PANELS = [
    { x: 40, col: K.green, title: ['生物確有電訊號', 'Living things do have electrical signals'], body: ['賈法尼的想法：有道理', "Galvani's idea makes sense"] },
    { x: 510, col: K.cyan, title: ['不同金屬也能形成電位差', 'Different metals can also create a potential difference'], body: ['兩種金屬的想法：也有道理', 'The metal idea also makes sense'] }
  ];
  function miniLeg(ctx, cx, cy, sc, t) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-650, -380);
    leg(ctx, kickAt(t, STARTS[4] + 0.6), 0);
    nerve(ctx);
    pulses(ctx, t, STARTS[4], 1);
    ctx.restore();
  }
  function strip(ctx, x, y, w, h, hi, mid, lo) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, hi); g.addColorStop(0.4, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; rrect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function drawSummary(ctx, tl, t) {
    PANELS.forEach((pn, k) => {
      const al = ease((tl - 0.3 - k * 0.9) / 0.7);
      if (al <= 0.01) return;
      const cx = pn.x + PW / 2;
      ctx.save(); ctx.globalAlpha = al;
      ctx.fillStyle = K.panel; ctx.strokeStyle = pn.col; ctx.lineWidth = 2.5;
      rrect(ctx, pn.x, PY, PW, PH, 16); ctx.fill(); ctx.stroke();
      ctx.restore();
      block(ctx, tr(pn.title[0], pn.title[1]), cx, PY + 32, PW - 40, pn.col, 26, 'center', al, 32);
      ctx.save(); ctx.globalAlpha = al;
      if (k === 0) {
        ctx.beginPath(); ctx.rect(pn.x + 8, PY + 70, PW - 16, 160); ctx.clip();
        miniLeg(ctx, cx + 4, PY + 156, 0.82, t);
      } else {
        const y0 = PY + 92, hh = 96;
        strip(ctx, cx - 120, y0, 40, hh, K.cuHi, K.cu, K.cuLo);
        strip(ctx, cx + 80, y0, 40, hh, K.feHi, K.fe, K.feLo);
        const pul = 0.6 + 0.4 * Math.sin(t * 3);
        ctx.strokeStyle = `rgba(242,236,217,${0.55 + 0.45 * pul})`; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(cx - 72, y0 + 30); ctx.lineTo(cx + 72, y0 + 30); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = K.white;
        [[-74, 1], [74, -1]].forEach(([dx, s]) => {
          ctx.beginPath(); ctx.moveTo(cx + dx, y0 + 30); ctx.lineTo(cx + dx + 12 * s, y0 + 22); ctx.lineTo(cx + dx + 12 * s, y0 + 38); ctx.closePath(); ctx.fill();
        });
      }
      ctx.restore();
      if (k === 1) {
        text(ctx, tr('銅', 'Cu'), cx - 100, PY + 214, K.cu, 24, 'center', al);
        text(ctx, tr('鐵', 'Fe'), cx + 100, PY + 214, K.feHi, 24, 'center', al);
        block(ctx, tr('電位差', 'Potential difference'), cx, PY + 160, 140, K.white, 22, 'center', al, 26);
      }
      para(ctx, tr(pn.body[0], pn.body[1]), cx, PY + 262, PW - 40, K.white, 24, 'center', ease((tl - 0.9 - k * 0.9) / 0.7), 30);
    });
    text(ctx, tr('蛙腿是偵測者，不是持續電源', 'The frog leg is a detector, not a lasting power source'), W / 2, 420, K.white, 24, 'center', ease((tl - 2.6) / 0.7));
    text(ctx, tr('能不能不用蛙腿，也得到電？', 'Can we get electricity without a frog leg?'), W / 2, 466, K.yellow, 28, 'center', ease((tl - 3.6) / 0.7));
    text(ctx, tr('→ 下一個分頁：伏打電池', '→ Next tab: the voltaic pile'), W / 2, 512, K.cyan, 24, 'center', ease((tl - 4.4) / 0.7));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx) {
    const items = [
      [tr('藍球 e⁻＝電子（只在金屬裡移動）', 'Blue ball e⁻ = electron (moves in the metals)'), 'b'],
      [tr('白光＝電刺激', 'White glow = electric stimulus'), 'p']
    ];
    const z = 22, gapIcon = 28, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem;
    const rows = tot <= maxW ? [[0, 1]] : [[0], [1]];
    const ys = rows.length === 1 ? [574] : [560, 586];
    rows.forEach((row, r) => {
      const tw = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tw / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'b') ball(ctx, x + 10, y, 6, 1); else pulseDot(ctx, x + 10, y, 1);
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
    if (i === 4) { drawSummary(ctx, tl, t); return; }
    const st = state(i, tl, t);
    plate(ctx, st.metalA);
    leg(ctx, st.kick, i === 2 ? st.battery * (0.7 + 0.3 * Math.sin(t * 4)) : 0);
    nerve(ctx);
    knife(ctx, st.pose, st.metalA);
    batteryOverlay(ctx, st.battery, t);
    // 接觸點
    if (i === 0) { gapMark(ctx, POSE.closed.butt.x, POSE.closed.butt.y, ease((tl - 2.2) / 0.6)); gapMark(ctx, NT.x, NT.y, ease((tl - 2.2) / 0.6)); }
    if (i === 3 && !st.contact) gapMark(ctx, POSE.closed.butt.x, POSE.closed.butt.y, ease((tl - 1.0) / 0.5) * (1 - ease((tl - (C4 - 0.8)) / 0.4)));
    if (st.contact) {
      const age = t - st.tc;
      if (i !== 2) { ring(ctx, POSE.closed.butt.x, POSE.closed.butt.y, age, '#ffffff'); ring(ctx, NT.x, NT.y, age, '#ffffff'); }
      contactDot(ctx, POSE.closed.butt.x, POSE.closed.butt.y, st.metalA);
    }
    if (st.tipTouch && (i !== 0)) contactDot(ctx, NT.x, NT.y, i === 1 ? (st.contact ? 1 : 0) : 1);
    electrons(ctx, t, st.tc, st.eA);
    pulses(ctx, t, st.tc, st.pA);
    partLabels(ctx, i, tl, st.metalA);
    drawNotes(ctx, i, tl, st);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('galvaniAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('galvaniAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-galvani');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-galvani'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
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

  window.GbAnim.galvani = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-galvani'); if (row) row.innerHTML = '';
      const r = document.getElementById('galvaniAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { galvani: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'galvani' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
