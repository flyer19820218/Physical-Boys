/* ==================================================================
   mechanics_3 ｜ 需要「減少」摩擦力：讓它順（cvs-less，960×540）
   四步：1 鏈條上潤滑油 → 2 軸承加潤滑 → 3 流線型設計 → 4 摩擦的代價
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。
   more（增加摩擦）的姊妹篇，畫法沿用 more：

   ・第 1 步：左邊腳踏車的飛輪＋大齒盤＋鏈條（M3.bikeChain，本檔新增在 common），乾鏈條轉得卡卡的；
     右邊放大鏡看「兩片金屬」的鋸齒（M3.teethPair）：乾的時候咬死、冒閃光；滴上潤滑油後，
     一層油膜（琥珀色）把上下鋸齒撐開隔開，上面的金屬就能順順滑過去。
   ・第 2 步：兩個軸承剖面（外圈、滾珠、內圈、輪軸）同時被轉一下：左邊乾磨，冒火星、發紅、很快停下；
     右邊滾珠泡在油膜裡，一直轉得很順。
   ・第 3 步：水裡兩個往右前進的物體（方塊 vs 魚形），畫面跟著物體走，所以水流線往左流；
     方塊後方亂流（漩渦），阻力箭頭長；流線型的水流順順合攏，阻力箭頭短（只比長短、不標數字）。
   ・第 4 步：腳踏車前輪（M3.bikeWheel／bikeFork／rimBrake，more 建立）捏煞車，煞車皮發燙、冒熱氣波紋；
     右邊能量長條：動能（黃）一路變成熱能（紅橘），熱能再從上方散失。搓手用「煞車皮發熱」代替，不畫手。
   ・March 只用半身表情圖，從畫布底邊升起。換步時前一步最後畫面淡出（0.6 秒）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.bikeChain || !M3.bikeWheel) return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = COL.yellow, GRN = COL.green;
  const HEAT = COL.red, OIL = '#f2b440';
  const DUR = [11, 11, 11, 11];      /* 總長 44 秒 */
  const frac = x => x - Math.floor(x);
  /* 兩個 #hex 色混合，回傳 #hex（W5.ball 要 hex 色） */
  const hexMix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(lerp(parseInt(a.substr(i, 2), 16), parseInt(b.substr(i, 2), 16), t)).toString(16).padStart(2, '0')).join('');
  const BUST = { r: 896, sc: 0.38 };

  M3.preload(['normal']);

  /* ═══════════ 小工具（同 more） ═══════════ */
  function bust(c, pose, x, a, flip) {
    if (a <= 0.02) return;
    const P0 = M3.MARCH[pose];
    M3.march(c, pose, x, 540 + P0.h * BUST.sc * (1 - a), { sc: BUST.sc, a: Math.min(1, a * 1.5), flip });
  }
  function lensPos(z, A, B) { return { x: lerp(A.x, B.x, z), y: lerp(A.y, B.y, z) - Math.sin(z * Math.PI) * 30, r: lerp(A.r, B.r, z) }; }
  function leader(c, lx, ly, r, tx, ty, a) {
    withA(c, a, () => {
      const d = Math.hypot(tx - lx, ty - ly) || 1, sx = lx + (tx - lx) / d * (r + 12), sy = ly + (ty - ly) / d * (r + 12);
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5; c.setLineDash([7, 6]);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
      c.fillStyle = YEL; c.beginPath(); c.arc(tx, ty, 5, 0, TAU); c.fill(); c.restore();
    });
  }
  /* 熱氣波紋：從 (x, y) 往上冒，k 強度、w 範圍寬 */
  function heatWaves(c, x, y, w, h, k, u, col) {
    if (k <= 0.02) return;
    c.save(); c.lineCap = 'round'; c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const bx = x + (i - 1) * w / 2.4, f = frac(u * 0.7 + i * 0.33);
      c.strokeStyle = W5.rgba(col || HEAT, (0.85 * k * Math.sin(f * Math.PI)).toFixed(3));
      c.beginPath();
      for (let t = 0; t <= 1.001; t += 0.05) {
        const yy = y - 6 - (h * 0.25 + h * 0.75 * f) * t, xx = bx + 6 * Math.sin(t * 9 - u * 6 + i * 2) * (0.4 + t);
        t ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 第 1 步：鏈條上潤滑油 ═══════════ */
  const CH = { x: 118, y: 300, dist: 296, nA: 13, nB: 32, pitch: 20 };
  const L1 = { x: 725, y: 246, r: 128 };
  const STEEL2 = { fill: ['#c3ccd2', '#6c7880'], edge: '#f4f7f8', tex: 'glint', ink: 'rgba(255,255,255,0.6)' };
  const MET = M3.teethPair(17, -170, 640, 50, { period: 44, amp: 38, jit: 0.65, bite: 1, clear: 4, dipMin: 0.15, dipMax: 0.35 });
  const MET_C = MET.contacts.filter(p => Math.abs(p.x) < 104);
  const GAP1 = 46;                           /* 油膜把上片撐高多少（大於齒高＝完全隔開） */
  const T_OIL = 4.0, T_LIFT = 5.0, T_SLIDE = 6.0;
  /* 鏈條走了多遠：乾的時候慢又一頓一頓，上油後加速、平順 */
  function chainPhase(u) {
    const t = u - 5.6, extra = t <= 0 ? 0 : t < 1.5 ? 100 * t * t / 3 : 75 + 100 * (t - 1.5);
    return 34 * u + 5 * Math.sin(u * 9) * (1 - seg(u, 5.0, 6.0)) + extra;
  }
  const slideX = u => { const t = u - T_SLIDE; return t <= 0 ? 0 : -(t < 1 ? 30 * t * t : 30 + 60 * (t - 1)); };
  /* 放大鏡裡：下片金屬（不動）＋油膜＋上片金屬 */
  function oilLens(c, s, lx, ly, r, oil, lift, dx, flashA) {
    M3.magnifier(c, lx, ly, r, {
      rim: 9, handle: -0.75, inner: cc => {
        const k = r / L1.r, lw = 1 / Math.max(0.3, k), dy = -GAP1 * lift;
        cc.save(); cc.translate(lx, ly); cc.scale(k, k);
        cc.fillStyle = '#16302a'; cc.fillRect(-140, -140, 280, 280);
        M3.teethFill(cc, MET.low, 170, 'metal', { seed: 4, lw });
        if (oil > 0.02) {
          cc.save(); cc.globalAlpha *= oil;
          cc.beginPath();
          MET.low.forEach((p, i) => (i ? cc.lineTo(p.x, p.y) : cc.moveTo(p.x, p.y)));
          for (let i = MET.up.length - 1; i >= 0; i--) cc.lineTo(MET.up[i].x + dx, MET.up[i].y + dy);
          cc.closePath();
          const g = cc.createLinearGradient(0, -20, 0, 50);
          g.addColorStop(0, 'rgba(255,214,110,0.85)'); g.addColorStop(1, 'rgba(214,140,30,0.85)');
          cc.fillStyle = g; cc.fill();
          cc.clip();
          /* 油在流：亮紋跟著上片慢慢往左拖 */
          cc.strokeStyle = 'rgba(255,245,200,0.55)'; cc.lineWidth = 3 * lw; cc.lineCap = 'round';
          for (let i = 0; i < 9; i++) {
            const yy = -24 + 64 * hash(i * 3.1 + 2), x0 = ((hash(i * 5.7) * 300 + dx * (0.3 + 0.4 * hash(i + 9))) % 300 + 300) % 300 - 150;
            cc.beginPath(); cc.moveTo(x0, yy); cc.lineTo(x0 + 26 + 20 * hash(i + 4), yy); cc.stroke();
          }
          cc.restore();
        }
        M3.teethFill(cc, MET.up, -220, STEEL2, { seed: 8, dx, dy, lw });
        if (flashA > 0.02) MET_C.forEach((p, i) => M3.flash(cc, p.x + dx, p.y + dy, 13, YEL, flashA * (0.65 + 0.35 * Math.sin(s.u * 7 + i * 1.7)), i));
        cc.restore();
      }
    });
  }
  /* 潤滑油瓶（尖嘴朝下）：tip＝嘴尖位置 */
  function oilBottle(c, tx, ty, a, squeeze) {
    withA(c, a, () => {
      c.save(); c.translate(tx, ty); c.rotate(0.35); c.lineJoin = 'round';
      /* 尖嘴 */
      c.fillStyle = '#e9edf0'; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-3, 0); c.lineTo(3, 0); c.lineTo(9, -34); c.lineTo(-9, -34); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d64b3a'; W5.rr(c, -15, -50, 30, 18, 4); c.fill(); c.stroke();
      /* 瓶身（捏的時候扁一點） */
      const w = 50 - 6 * squeeze;
      const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, '#f6c75c'); g.addColorStop(0.45, '#ffe7a3'); g.addColorStop(1, '#c98a1c');
      c.fillStyle = g; W5.rr(c, -w / 2, -128, w, 80, 12); c.fill(); c.stroke();
      c.fillStyle = 'rgba(11,26,21,0.75)'; W5.rr(c, -w / 2 + 7, -108, w - 14, 34, 4); c.fill();
      c.fillStyle = OIL; c.beginPath(); c.arc(0, -91, 9, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)'; W5.rr(c, -w / 2 + 5, -124, 6, 70, 3); c.fill();
      c.restore();
    });
  }
  function oilDrop(c, x, y, sc) {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    W5.glow(c, 0, 0, 14, OIL, 0.35);
    c.fillStyle = OIL; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(7, -1, 6, 3); c.arc(0, 3, 6, 0, Math.PI); c.quadraticCurveTo(-7, -1, 0, -11); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(-2, 2, 2, 0, TAU); c.fill();
    c.restore();
  }
  function step1(c, s) {
    const n = 1, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: COL.teal, gyGlow: 290 });
    const oil = ease(seg(u, T_OIL + 0.3, T_OIL + 1.6)), rust = 1 - 0.6 * oil, ph = chainPhase(u);
    /* 車架後下叉（兩齒盤中心連線） */
    const G0 = M3.bikeChain(c, Object.assign({ a: 0 }, CH));
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 18; c.beginPath(); c.moveTo(G0.A.x, G0.A.y); c.lineTo(G0.B.x, G0.B.y); c.stroke();
    c.strokeStyle = '#3f5f7a'; c.lineWidth = 13; c.beginPath(); c.moveTo(G0.A.x, G0.A.y); c.lineTo(G0.B.x, G0.B.y); c.stroke();
    c.restore();
    const G = M3.bikeChain(c, Object.assign({ phase: ph, rust, oil }, CH));
    /* 曲柄＋踏板（跟著大齒盤轉） */
    const qa = G.B.rot + 0.6, cl = 118, ex = G.B.x + Math.cos(qa) * cl, ey = G.B.y + Math.sin(qa) * cl;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 20; c.beginPath(); c.moveTo(G.B.x, G.B.y); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = '#2d3238'; c.lineWidth = 15; c.beginPath(); c.moveTo(G.B.x, G.B.y); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = '#20242a'; c.strokeStyle = 'rgba(160,170,185,0.7)'; c.lineWidth = 2; W5.rr(c, ex - 26, ey - 8, 52, 16, 4); c.fill(); c.stroke();
    c.fillStyle = '#8e9aa2'; c.beginPath(); c.arc(G.B.x, G.B.y, 9, 0, TAU); c.fill();
    c.restore();
    /* 乾鏈條：一頓一頓時，飛輪咬合處冒小閃光 */
    const dryA = fin(s, n, 0.8, 0.4) * (1 - oil);
    const cp = G.at(CH.dist * 0.02);
    M3.flash(c, cp.x, cp.y, 11, YEL, dryA * Math.max(0, Math.sin(u * 9)), u * 3);
    /* 滴潤滑油：上段鏈條 45% 處 */
    const tgt = { x: lerp(G.top.x0, G.top.x1, 0.42), y: lerp(G.top.y0, G.top.y1, 0.42) - 6 };
    const tip = { x: tgt.x + 4, y: tgt.y - 66 };
    const bA = fin(s, n, T_OIL - 0.6, 0.5) * fout(s, n, T_LIFT + 1.4, 0.5);
    for (let i = 0; i < 5; i++) {
      const t0 = T_OIL + i * 0.3, f = (u - t0) / 0.42;
      if (s.n === n && f > 0 && f < 1) oilDrop(c, tip.x, lerp(tip.y + 8, tgt.y, f * f), 0.9);
      const g = (u - t0 - 0.42) / 0.5;
      if (s.n === n && g > 0 && g < 1) withA(c, 1 - g, () => { c.save(); c.strokeStyle = OIL; c.lineWidth = 2.5; c.beginPath(); c.ellipse(tgt.x, tgt.y + 4, 6 + 18 * g, 3 + 5 * g, 0, 0, TAU); c.stroke(); c.restore(); });
    }
    const sq = s.n === n ? Math.max(0, Math.sin((u - T_OIL) * Math.PI / 0.3)) * seg(u, T_OIL - 0.1, T_OIL) * (1 - seg(u, T_OIL + 1.4, T_OIL + 1.6)) : 0;
    oilBottle(c, tip.x, tip.y - 32 * (1 - fin(s, n, T_OIL - 0.6, 0.5)), bA, sq);
    P(c, bA * fin(s, n, T_OIL - 0.3, 0.4), L('潤滑油', 'Oil'), tip.x - 70, tip.y - 70, OIL, 22);
    /* 放大鏡：從上段鏈條飛到右邊 */
    const z = ease(seg(u, 1.4, 2.4)), lp = lensPos(z, { x: tgt.x + 40, y: tgt.y + 6, r: 20 }, L1), lA = fin(s, n, 1.4, 0.3);
    leader(c, lp.x, lp.y, lp.r, lerp(G.top.x0, G.top.x1, 0.6), lerp(G.top.y0, G.top.y1, 0.6), lA * clamp01((z - 0.4) / 0.6));
    const lift = ease(seg(u, T_LIFT, T_LIFT + 0.9)), dx = slideX(u) + M3.shake(u, 3, 22) * seg(u, 2.6, 3.0) * (1 - seg(u, T_OIL, T_OIL + 0.5));
    if (lA > 0.02) withA(c, lA, () => oilLens(c, s, lp.x, lp.y, lp.r, ease(seg(u, T_OIL + 0.4, T_LIFT + 0.6)), lift, dx, fin(s, n, 2.6, 0.3) * (1 - lift)));
    const ia = fin(s, n, 2.6, 0.5);
    P(c, ia, L('金屬', 'Metal'), L1.x, L1.y - 74, WHITE, 20);
    P(c, ia, L('金屬', 'Metal'), L1.x, L1.y + 82, WHITE, 20);
    P(c, fin(s, n, T_LIFT + 0.6, 0.4), L('油膜', 'Oil film'), L1.x - 66, L1.y + 12, OIL, 20);
    P(c, fin(s, n, 2.9, 0.4) * fout(s, n, T_LIFT, 0.3), L('乾磨：鋸齒咬死', 'Dry: the teeth lock'), L1.x, 410, FR, 22);
    P(c, fin(s, n, T_SLIDE + 0.4, 0.5), L('油膜隔開鋸齒，滑順', 'Oil keeps teeth apart'), L1.x - 20, 410, YEL, 22);
    /* 狀態字 */
    P(c, fin(s, n, 0.6, 0.4) * fout(s, n, T_OIL - 0.4, 0.3), L('乾的鏈條：轉起來卡卡的', 'A dry chain turns roughly'), 480, M3.Q_Y, FR, 22);
    P(c, fin(s, n, T_OIL - 0.2, 0.3) * fout(s, n, T_SLIDE, 0.3), L('鏈條滴上潤滑油', 'Drip oil on the chain'), 520, M3.Q_Y, OIL, 22);
    P(c, fin(s, n, T_SLIDE + 0.2, 0.4), L('上油後：鏈條轉得很順', 'Oiled: the chain runs smoothly'), 520, M3.Q_Y, GRN, 22);
    bust(c, 'normal', BUST.r, fin(s, n, 7.2, 0.6));
    P(c, fin(s, n, 0.3, 0.5), L('鏈條上潤滑油', 'Oil the chain'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.2, 0.5), L('改變接觸面性質，變得更光滑', 'Oil changes the surface: smoother'), WHITE);
  }

  /* ═══════════ 第 2 步：軸承加潤滑 ═══════════ */
  const BR = { y: 268, R: 124, xl: 240, xr: 700 };
  const NB = 9;
  /* 乾磨：被轉一下後很快停（一頓一頓）；上油：一直轉得很順 */
  const T_SPIN = 1.2;
  function dryAng(u) { const t = Math.max(0, u - T_SPIN), T = 3.6; const tt = Math.min(t, T); return 3.2 * (tt - tt * tt / (2 * T)) + 0.04 * Math.sin(tt * 15) * (1 - tt / T); }
  const dryW = u => { const t = u - T_SPIN; return t < 0 ? 0 : Math.max(0, 1 - t / 3.6); };
  function oilAng(u) { const t = Math.max(0, u - T_SPIN); return 3.2 * (t < 0.3 ? t * t / 0.6 : t - 0.15); }
  /* 軸承剖面：外圈（跟著輪子轉）、滾珠、內圈（固定在輪軸上） */
  function bearing(c, cx, cy, R, ang, oil, heat, sparkA, u, seed) {
    const ro0 = R, ro1 = R * 0.78, ri1 = R * 0.46, ri0 = R * 0.33, rm = (ro1 + ri1) / 2, rb = (ro1 - ri1) / 2 * 0.94;
    c.save();
    /* 外圈 */
    const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#eef3f5'); g.addColorStop(1, '#6f7c84');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, ro0, 0, TAU); c.arc(cx, cy, ro1, 0, TAU, true); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, ro0, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, ro1, 0, TAU); c.stroke();
    /* 外圈上的記號（看得出轉了多少） */
    c.fillStyle = YEL;
    for (let i = 0; i < 2; i++) {
      const q = ang + i * Math.PI;
      c.save(); c.translate(cx + Math.cos(q) * (ro0 + ro1) / 2, cy + Math.sin(q) * (ro0 + ro1) / 2); c.rotate(q);
      W5.rr(c, -9, -4, 18, 8, 3); c.fill(); c.restore();
    }
    /* 發熱（乾磨） */
    if (heat > 0.02) {
      c.fillStyle = W5.rgba(HEAT, (0.45 * heat).toFixed(3));
      c.beginPath(); c.arc(cx, cy, ro0, 0, TAU); c.arc(cx, cy, ri0, 0, TAU, true); c.fill();
    }
    /* 滾道：油膜（琥珀）或乾的（深色） */
    c.fillStyle = '#0f221c'; c.beginPath(); c.arc(cx, cy, ro1, 0, TAU); c.arc(cx, cy, ri1, 0, TAU, true); c.fill();
    if (oil > 0.02) {
      c.fillStyle = W5.rgba(OIL, (0.6 * oil).toFixed(3)); c.beginPath(); c.arc(cx, cy, ro1, 0, TAU); c.arc(cx, cy, ri1, 0, TAU, true); c.fill();
      c.strokeStyle = 'rgba(255,240,190,' + (0.5 * oil).toFixed(3) + ')'; c.lineWidth = 2.5; c.setLineDash([16, 22]); c.lineDashOffset = -ang * rm * 0.5;
      c.beginPath(); c.arc(cx, cy, rm, 0, TAU); c.stroke(); c.setLineDash([]);
    }
    /* 滾珠（保持架轉速約外圈的一半；珠子自己也在轉） */
    const cage = ang * 0.5, spin = -ang * ro1 / rb * 0.5;
    for (let i = 0; i < NB; i++) {
      const q = cage + i * TAU / NB, bx = cx + Math.cos(q) * rm, by = cy + Math.sin(q) * rm;
      if (oil > 0.02) W5.glow(c, bx, by, rb * 1.5, OIL, 0.35 * oil);
      W5.ball(c, bx, by, rb, hexMix('#b9c4cb', '#ff8a6a', clamp01((heat - 0.3) * 0.9)));
      c.strokeStyle = 'rgba(40,50,56,0.6)'; c.lineWidth = 2; c.beginPath();
      c.moveTo(bx + Math.cos(spin + q) * rb * 0.75, by + Math.sin(spin + q) * rb * 0.75); c.lineTo(bx - Math.cos(spin + q) * rb * 0.75, by - Math.sin(spin + q) * rb * 0.75); c.stroke();
      if (oil > 0.02) { c.strokeStyle = 'rgba(255,226,150,' + (0.8 * oil).toFixed(3) + ')'; c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, rb + 2.5, 0, TAU); c.stroke(); }
    }
    /* 內圈＋輪軸（不動） */
    const gi = c.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.05, cx, cy, ri1);
    gi.addColorStop(0, '#e6edf1'); gi.addColorStop(1, '#7d8a92');
    c.fillStyle = gi; c.beginPath(); c.arc(cx, cy, ri1, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, ri1, 0, TAU); c.stroke();
    c.fillStyle = '#39444b'; c.beginPath(); c.arc(cx, cy, ri0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(160,170,180,0.35)'; c.lineWidth = 2;
    c.save(); c.beginPath(); c.arc(cx, cy, ri0, 0, TAU); c.clip();
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(cx + k * 12 - ri0, cy + ri0); c.lineTo(cx + k * 12 + ri0, cy - ri0); c.stroke(); }
    c.restore();
    c.restore();
    /* 乾磨火星：滾珠和外圈接觸的地方 */
    if (sparkA > 0.02) for (let i = 0; i < 4; i++) {
      const k = Math.floor(u * 7 + i * 2.3), q = cage + (Math.floor(hash(seed + k * 3.7 + i) * NB) + 0.0) * TAU / NB;
      const px = cx + Math.cos(q) * (rm + rb * 0.9), py = cy + Math.sin(q) * (rm + rb * 0.9);
      M3.flash(c, px, py, 13, YEL, sparkA * Math.sin(frac(u * 7 + i * 0.31) * Math.PI), k);
    }
  }
  /* 轉動方向（虛線弧＋箭頭），越慢越淡 */
  function spinHint(c, cx, cy, R, ang, a) {
    withA(c, a, () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 4; c.setLineDash([12, 9]); c.lineDashOffset = -ang * 30;
      c.beginPath(); c.arc(cx, cy, R + 18, -2.3, -0.9); c.stroke(); c.setLineDash([]);
      const q = -0.9, ex = cx + Math.cos(q) * (R + 18), ey = cy + Math.sin(q) * (R + 18);
      W5.arrow(c, ex + Math.sin(q) * 2, ey - Math.cos(q) * 2, ex - Math.sin(q) * 14, ey + Math.cos(q) * 14, 'rgba(246,243,234,0.9)', 4, 16);
      c.restore();
    });
  }
  function step2(c, s) {
    const n = 2, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: COL.teal, gyGlow: 270 });
    const ap = fin(s, n, 0.3, 0.6);
    const aD = dryAng(u), wD = dryW(u), aO = oilAng(u);
    const heat = clamp01(seg(u, T_SPIN + 0.3, T_SPIN + 3.0) * 0.9) * (1 - 0.3 * seg(u, 6.5, 11));
    withA(c, ap, () => {
      spinHint(c, BR.xl, BR.y, BR.R, aD, wD * fin(s, n, T_SPIN, 0.3));
      spinHint(c, BR.xr, BR.y, BR.R, aO, fin(s, n, T_SPIN, 0.3));
      if (heat > 0.02) W5.glow(c, BR.xl, BR.y, BR.R * 1.5, HEAT, 0.22 * heat);
      bearing(c, BR.xl, BR.y, BR.R, aD, 0, heat, wD * fin(s, n, T_SPIN + 0.2, 0.3), u, 3);
      bearing(c, BR.xr, BR.y, BR.R, aO, fin(s, n, 0.5, 0.6), 0, 0, u, 9);
      [-1, 1].forEach(sd => heatWaves(c, BR.xl + sd * BR.R * 0.8, BR.y - BR.R * 0.6, 50, 64, heat * seg(u, 2.5, 3.5), u + sd * 0.3, HEAT));
    });
    P(c, ap, L('沒有潤滑油', 'No oil'), BR.xl, 112, WHITE, 22);
    P(c, ap, L('加了潤滑油', 'With oil'), BR.xr, 112, WHITE, 22);
    /* 部件名稱（右邊軸承） */
    const na = fin(s, n, 2.0, 0.5);
    withA(c, na, () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 2;
      const rm = BR.R * 0.62, q = -0.55, px = BR.xr + Math.cos(q) * rm, py = BR.y + Math.sin(q) * rm;
      c.beginPath(); c.moveTo(px + 10, py - 6); c.lineTo(BR.xr + BR.R + 24, BR.y - 96); c.stroke();
      const q2 = 0.5, qx = BR.xr + Math.cos(q2) * rm, qy = BR.y + Math.sin(q2) * rm;
      c.beginPath(); c.moveTo(qx + 10, qy + 6); c.lineTo(BR.xr + BR.R + 24, BR.y + 90); c.stroke();
      c.restore();
    });
    P(c, na, L('滾珠', 'Balls'), BR.xr + BR.R + 24, BR.y - 96, WHITE, 20, 'left');
    P(c, fin(s, n, 2.4, 0.5), L('油膜', 'Oil film'), BR.xr + BR.R + 24, BR.y + 90, OIL, 20, 'left');
    P(c, na, L('輪軸', 'Axle'), BR.xl, BR.y, WHITE, 20);
    P(c, na, L('輪軸', 'Axle'), BR.xr, BR.y, WHITE, 20);
    /* 結果 */
    P(c, fin(s, n, 3.6, 0.4), L('乾磨：冒火星，很快停下', 'Dry: sparks, stops fast'), BR.xl, 440, FR, 22);
    P(c, fin(s, n, 4.6, 0.4), L('油膜包住滾珠：轉得順', 'Oiled balls roll smoothly'), BR.xr, 440, GRN, 22);
    P(c, fin(s, n, 0.3, 0.5), L('軸承加潤滑', 'Lubricate the bearing'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.0, 0.5), L('減少摩擦力，轉得更順', 'Less friction, smoother turning'), WHITE);
  }

  /* ═══════════ 第 3 步：流線型設計 ═══════════ */
  const LANE = [{ y: 190, kind: 'box' }, { y: 362, kind: 'fish' }];
  const OX = 430, BOX = { x0: 375, x1: 485, h: 55 }, FISH = { nose: 520, tail: 372, fin: 340, H: 40 };
  const OFFS = [-70, -46, -22, 22, 46, 70];
  /* 物體的半厚度（沿 x），再用高斯平滑當作水流繞開的「有效半厚」 */
  function smoothProfile(raw, sigma) {
    const out = [], N = raw.length, kr = Math.ceil(sigma * 2.5 / 4);
    for (let i = 0; i < N; i++) {
      let sw = 0, sv = 0;
      for (let j = -kr; j <= kr; j++) { const k = i + j; if (k < 0 || k >= N) continue; const w = Math.exp(-(j * 4) * (j * 4) / (2 * sigma * sigma)); sw += w; sv += w * raw[k]; }
      out.push(Math.max(raw[i], sv / sw));
    }
    return out;
  }
  const fishHB = x => { const t = (FISH.nose - x) / (FISH.nose - FISH.tail); return t < 0 || t > 1 ? 0 : FISH.H * 2.6 * Math.sqrt(t) * (1 - t); };
  const XS = []; for (let x = 0; x <= 960; x += 4) XS.push(x);
  const BOX_PROF = smoothProfile(XS.map(x => (x >= BOX.x0 && x <= BOX.x1 ? BOX.h + 6 : x > BOX.x1 && x < BOX.x1 + 50 ? BOX.h * Math.exp(-(x - BOX.x1) / 22) : x < BOX.x0 ? (BOX.h + 4) * Math.exp(-(BOX.x0 - x) / 230) : 0)), 14);
  const FISH_PROF = smoothProfile(XS.map(x => fishHB(x) + 5 * Math.exp(-((x - OX) / 80) * ((x - OX) / 80))), 26);
  /* 一條水流線（d＝離中線多遠；亂流在方塊後方加上會動的擺動） */
  function streamline(c, lane, d, u, a) {
    const prof = lane.kind === 'box' ? BOX_PROF : FISH_PROF;
    c.save(); c.globalAlpha *= a;
    W5.rr(c, 20, lane.y - 84, 920, 168, 14); c.clip();
    c.strokeStyle = 'rgba(160,220,240,0.6)'; c.lineWidth = 2.5; c.setLineDash([18, 12]); c.lineDashOffset = u * 90 + Math.abs(d);
    c.beginPath();
    XS.forEach((x, i) => {
      let dd = Math.sign(d) * Math.sqrt(d * d + prof[i] * prof[i]);
      if (lane.kind === 'box' && x < BOX.x0) {
        const env = Math.exp(-(BOX.x0 - x) / 260) * clamp01((BOX.x0 - x) / 40);
        dd += env * (9 * Math.sin(x * 0.045 + u * 5 + d * 0.13) + 5 * Math.sin(x * 0.09 - u * 7 + d));
      }
      const y = lane.y + dd;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.stroke(); c.setLineDash([]); c.restore();
  }
  /* 方塊後方的漩渦（亂流） */
  function eddies(c, lane, u, a) {
    if (a <= 0.02) return;
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const f = frac(u * 0.22 + i / 5), x = BOX.x0 - 30 - f * 250, y = lane.y + (i % 2 ? 1 : -1) * (18 + 10 * hash(i + 2)), sd = i % 2 ? 1 : -1;
      const rr = 14 + 12 * f, al = a * Math.sin(f * Math.PI);
      c.strokeStyle = 'rgba(190,235,250,' + (0.85 * al).toFixed(3) + ')'; c.lineWidth = 3;
      c.beginPath();
      for (let t = 0; t <= 1.001; t += 0.04) { const q = sd * (u * 5 + t * TAU * 1.6), r = rr * (0.2 + 0.8 * t); const px = x + Math.cos(q) * r, py = y + Math.sin(q) * r; t ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    }
    c.restore();
  }
  function boxShape(c, y, bob) {
    c.save();
    const y0 = y - BOX.h + bob, g = c.createLinearGradient(0, y0, 0, y0 + BOX.h * 2);
    g.addColorStop(0, '#9fb3c1'); g.addColorStop(1, '#55697a');
    c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 3;
    W5.rr(c, BOX.x0, y0, BOX.x1 - BOX.x0, BOX.h * 2, 6); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; W5.rr(c, BOX.x0 + 8, y0 + 8, BOX.x1 - BOX.x0 - 16, BOX.h * 2 - 16, 4); c.stroke();
    c.fillStyle = 'rgba(30,44,56,0.6)'; [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([fx, fy]) => { c.beginPath(); c.arc(BOX.x0 + (BOX.x1 - BOX.x0) * fx, y0 + BOX.h * 2 * fy, 4, 0, TAU); c.fill(); });
    c.restore();
  }
  function fishShape(c, y, u, bob) {
    c.save(); c.translate(0, bob); c.lineJoin = 'round';
    const wag = Math.sin(u * 7) * 8;
    /* 尾鰭 */
    c.fillStyle = '#5c86ad'; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(FISH.tail + 6, y); c.lineTo(FISH.fin, y - 30 + wag); c.quadraticCurveTo(FISH.fin + 10, y + wag * 0.5, FISH.fin, y + 30 + wag); c.closePath(); c.fill(); c.stroke();
    /* 身體 */
    const g = c.createLinearGradient(0, y - FISH.H, 0, y + FISH.H);
    g.addColorStop(0, '#5f8fbd'); g.addColorStop(0.55, '#a9c8e2'); g.addColorStop(1, '#e8f1f7');
    c.fillStyle = g;
    c.beginPath();
    for (let x = FISH.nose; x >= FISH.tail; x -= 3) c.lineTo(x, y - fishHB(x));
    for (let x = FISH.tail; x <= FISH.nose; x += 3) c.lineTo(x, y + fishHB(x));
    c.closePath(); c.fill(); c.stroke();
    /* 背鰭、胸鰭、鰓、眼睛 */
    c.fillStyle = '#4d77a0';
    c.beginPath(); c.moveTo(OX + 10, y - fishHB(OX + 10) + 2); c.quadraticCurveTo(OX - 20, y - FISH.H - 22, OX - 44, y - fishHB(OX - 44) + 2); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(OX + 22, y + 10); c.quadraticCurveTo(OX, y + 30, OX - 10, y + 22); c.quadraticCurveTo(OX + 4, y + 12, OX + 22, y + 10); c.fill();
    c.strokeStyle = 'rgba(40,70,100,0.7)'; c.lineWidth = 2.5; c.beginPath(); c.arc(OX + 44, y, 26, -0.9, 0.9); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(FISH.nose - 26, y - 8, 7, 0, TAU); c.fill();
    c.fillStyle = '#1b2633'; c.beginPath(); c.arc(FISH.nose - 24, y - 8, 3.6, 0, TAU); c.fill();
    c.restore();
  }
  function step3(c, s) {
    const n = 3, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: '#4dd2ff', gyGlow: 280 });
    /* 水 */
    LANE.forEach(ln => {
      c.save();
      const g = c.createLinearGradient(0, ln.y - 86, 0, ln.y + 86);
      g.addColorStop(0, 'rgba(60,150,190,0.10)'); g.addColorStop(0.5, 'rgba(60,150,190,0.20)'); g.addColorStop(1, 'rgba(60,150,190,0.10)');
      c.fillStyle = g; c.fillRect(20, ln.y - 84, 920, 168);
      c.strokeStyle = 'rgba(120,200,230,0.25)'; c.lineWidth = 1.5; W5.rr(c, 20, ln.y - 84, 920, 168, 14); c.stroke();
      c.restore();
    });
    const la = fin(s, n, 0.9, 0.8);
    OFFS.forEach((d, i) => { streamline(c, LANE[0], d, u, la); streamline(c, LANE[1], d, u, la); });
    eddies(c, LANE[0], u, fin(s, n, 2.2, 0.8));
    const ap = fin(s, n, 0.3, 0.5);
    withA(c, ap, () => { boxShape(c, LANE[0].y, Math.sin(u * 2.2) * 2 + M3.shake(u, 1.4, 18) * la); fishShape(c, LANE[1].y, u, Math.sin(u * 2.2 + 1) * 2); });
    /* 前進方向 */
    const fa = fin(s, n, 0.7, 0.4);
    LANE.forEach((ln, i) => {
      M3.dashArrow(c, 540, ln.y, 616, ln.y, WHITE, fa, u * 40);
      P(c, fa, L('前進', 'Forward'), 628, ln.y, WHITE, 20, 'left');
    });
    P(c, ap, L('方塊', 'Box'), 40, LANE[0].y - 58, WHITE, 22, 'left');
    P(c, ap, L('流線型（像魚）', 'Streamlined (fish)'), 40, LANE[1].y - 58, WHITE, 22, 'left');
    /* 阻力（與前進方向相反，畫在物體上；只比長短） */
    const g3 = grow(s, n, 3.6, 4.6);
    M3.force(c, { x: OX, y: LANE[0].y, dir: 'left', val: 175, k: 1, col: FR, grow: g3, lab: 'tip', name: L('阻力大', 'Big drag'), num: false, lw: 8 });
    M3.force(c, { x: OX, y: LANE[1].y, dir: 'left', val: 50, k: 1, col: FR, grow: g3, lab: null, lw: 8 });
    P(c, clamp01((g3 - 0.85) / 0.15), L('阻力小', 'Small drag'), 392, LANE[1].y + 64, FR, 22);
    P(c, fin(s, n, 5.2, 0.4), L('後方亂流', 'Messy wake'), 790, LANE[0].y - 58, FR, 22);
    P(c, fin(s, n, 5.8, 0.4), L('水流順順滑過', 'Water flows smoothly'), 790, LANE[1].y - 58, GRN, 22);
    bust(c, 'normal', BUST.r, fin(s, n, 7.0, 0.6));
    P(c, fin(s, n, 0.3, 0.5), L('流線型設計', 'Streamlined shape'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.0, 0.5), L('減少空氣或水的阻力', 'Less air or water resistance'), WHITE);
  }

  /* ═══════════ 第 4 步：摩擦的代價（煞車皮發熱） ═══════════ */
  const WC = { x: 262, y: 300, r: 150 };
  const W0 = 7, TB = 2.6, DB = 4.4;
  const wheelW = u => (u < TB ? W0 : W0 * Math.max(0, 1 - (u - TB) / DB));
  const wheelAng = u => { if (u < TB) return W0 * u; const t = Math.min(u - TB, DB); return W0 * TB + W0 * (t - t * t / (2 * DB)); };
  const EB = { kx: 640, hx: 850, bot: 392, h: 200, w: 70 };
  function bar(c, x, frac0, colTop, colBot, a) {
    withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(11,26,21,0.7)'; W5.rr(c, x - EB.w / 2, EB.bot - EB.h, EB.w, EB.h, 8); c.fill();
      const hh = EB.h * clamp01(frac0);
      if (hh > 1) {
        const g = c.createLinearGradient(0, EB.bot - EB.h, 0, EB.bot);
        g.addColorStop(0, colTop); g.addColorStop(1, colBot);
        c.fillStyle = g; W5.rr(c, x - EB.w / 2, EB.bot - hh, EB.w, hh, Math.min(8, hh / 2)); c.fill();
        W5.glow(c, x, EB.bot - hh, 40, colTop, 0.25);
      }
      c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2.5; W5.rr(c, x - EB.w / 2, EB.bot - EB.h, EB.w, EB.h, 8); c.stroke();
      c.restore();
    });
  }
  function step4(c, s) {
    const n = 4, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: COL.teal, gyGlow: 290 });
    const w = wheelW(u), ang = wheelAng(u), sq = ease(seg(u, TB - 0.3, TB + 0.1)), ke = (w / W0) * (w / W0);
    /* 熱：動能減少多少就變成多少熱；停下後慢慢散失 */
    const made = 1 - ke, heat = made * (1 - 0.45 * seg(u, TB + DB + 0.2, 11));
    withA(c, (w / W0) * fin(s, n, 0.4, 0.4), () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 4; c.setLineDash([12, 9]); c.lineDashOffset = -ang * 30;
      c.beginPath(); c.arc(WC.x, WC.y, WC.r + 24, 0.1, 0.95); c.stroke(); c.setLineDash([]);
      const q = 0.95, ex = WC.x + Math.cos(q) * (WC.r + 24), ey = WC.y + Math.sin(q) * (WC.r + 24);
      W5.arrow(c, ex + Math.sin(q) * 2, ey - Math.cos(q) * 2, ex - Math.sin(q) * 14, ey + Math.cos(q) * 14, 'rgba(246,243,234,0.9)', 4, 16);
      c.restore();
    });
    M3.bikeWheel(c, WC.x, WC.y, WC.r, { ang, tread: 'road', blur: 0.9 * w / W0 });
    M3.bikeFork(c, WC.x, WC.y, WC.r, { up: 30 });
    const bk = M3.rimBrake(c, WC.x, WC.y, WC.r, { squeeze: sq });
    /* 煞車皮發燙：紅光＋熱氣 */
    if (heat > 0.02) {
      W5.glow(c, bk.x, bk.y, 60, HEAT, 0.55 * heat);
      withA(c, heat, () => {
        c.save(); const pw = bk.x1 - bk.x0, g = c.createLinearGradient(bk.x0, 0, bk.x1, 0);
        g.addColorStop(0, 'rgba(255,77,77,0.55)'); g.addColorStop(0.5, 'rgba(255,170,70,0.75)'); g.addColorStop(1, 'rgba(255,77,77,0.55)');
        c.fillStyle = g; W5.rr(c, bk.x0, bk.top, pw, (bk.y - bk.top) * 2, 3); c.fill(); c.restore();
      });
    }
    heatWaves(c, (bk.x + bk.x1) / 2 + 6, bk.top - 8, 46, 70, heat * 1.1, u, HEAT);
    const rub = sq * (w / W0);
    for (let i = 0; i < 3; i++) M3.flash(c, lerp(bk.x0, bk.x1, frac(u * 1.7 + i * 0.37)), bk.y + 4, 10, YEL, rub * (0.5 + 0.5 * Math.sin(u * 13 + i * 2)), u * 2 + i);
    const fa = 1 - ease(seg(u, TB + DB, TB + DB + 0.6));
    M3.force(c, { x: bk.x0 - 2, y: bk.y, dir: 'left', val: 110, k: 1, col: FR, grow: grow(s, n, TB, TB + 0.8), a: fa, lab: 'below', name: L('摩擦力', 'Friction'), num: false, dy: 4, lw: 8 });
    /* 能量長條：動能 → 熱能 */
    const ea = fin(s, n, 0.8, 0.5);
    P(c, ea, L('動能', 'Motion energy'), EB.kx, EB.bot - EB.h - 30, YEL, 22);
    P(c, ea, L('熱能', 'Heat'), EB.hx, EB.bot - EB.h - 30, HEAT, 22);
    bar(c, EB.kx, ke, '#ffe066', '#e0a800', ea);
    bar(c, EB.hx, heat, '#ffb347', '#ff4d4d', ea);
    /* 能量流：從動能流向熱能（煞車時才流，越快流越多） */
    const pw = sq * (w / W0) * (u > TB && u < TB + DB ? 1 : 0), ay = EB.bot - EB.h / 2;
    withA(c, ea, () => {
      c.save();
      const g = c.createLinearGradient(EB.kx + 44, 0, EB.hx - 44, 0);
      g.addColorStop(0, 'rgba(255,224,102,0.9)'); g.addColorStop(1, 'rgba(255,77,77,0.9)');
      c.strokeStyle = g; c.fillStyle = 'rgba(255,77,77,0.9)'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(EB.kx + 46, ay); c.lineTo(EB.hx - 64, ay); c.stroke();
      c.beginPath(); c.moveTo(EB.hx - 44, ay); c.lineTo(EB.hx - 66, ay - 15); c.lineTo(EB.hx - 66, ay + 15); c.closePath(); c.fill();
      if (pw > 0.02) for (let i = 0; i < 6; i++) {
        const f = frac(u * 1.3 + i / 6), x = lerp(EB.kx + 50, EB.hx - 56, f);
        c.globalAlpha = ea * pw * Math.sin(f * Math.PI);
        W5.ball(c, x, ay, 7, hexMix('#ffe066', '#ff4d4d', f));
      }
      c.restore();
    });
    /* 熱能散失：熱能條上方冒熱氣 */
    heatWaves(c, EB.hx, EB.bot - EB.h - 52, 60, 50, heat * seg(u, TB + 1.0, TB + 2.0), u + 0.4, HEAT);
    P(c, fin(s, n, 5.0, 0.5), L('動能 → 熱能散失', 'Motion energy → heat, lost'), (EB.kx + EB.hx) / 2, 436, YEL, 22);
    /* 狀態字 */
    P(c, fin(s, n, 0.6, 0.4) * fout(s, n, TB - 0.2, 0.3), L('輪子帶著動能在轉', 'The spinning wheel has motion energy'), 520, M3.Q_Y, WHITE, 22);
    P(c, fin(s, n, TB, 0.4) * fout(s, n, TB + DB, 0.3), L('捏煞車：煞車皮摩擦輪圈', 'Brake: the pads rub the rim'), 520, M3.Q_Y, PUSH, 22);
    P(c, fin(s, n, TB + DB + 0.2, 0.4), L('輪子停了，煞車皮變燙', 'The wheel stops; the pads get hot'), 520, M3.Q_Y, HEAT, 22);
    P(c, fin(s, n, 0.3, 0.5), L('摩擦的代價', 'The cost of friction'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.2, 0.5), L('沒有潤滑，就浪費更多能量', 'No oil means more energy wasted'), WHITE);
  }

  /* ═══════════ draw ═══════════ */
  const STEPS = [step1, step2, step3, step4];
  function draw(c, s) {
    const cur = STEPS[s.n - 1] || step1;
    if (s.n > 1 && s.u < 0.6) {
      /* 換步：前一步的最後畫面淡出、這一步淡入（前一步的字不記進檢查框） */
      const f = ease(s.u / 0.6), dbg = W5.debug;
      W5.debug = false; STEPS[s.n - 2](c, { n: s.n - 1, u: DUR[s.n - 2] }); W5.debug = dbg;
      c.save(); c.globalAlpha = f; c.fillStyle = COL.bg; c.fillRect(0, 32, 960, 508); cur(c, s); c.restore();
    } else cur(c, s);
  }

  W5.register('less', { canvas: 'cvs-less', steps: DUR, draw });
})();
