/* electric_motor_3_energy_1106_v1.js — 「開掌定則實例」分頁的第五個場景：補充——粒子的能量從哪來？（共用 #forceExamplesCanvas，邏輯 1000×600）
 *
 * 接在「補充：白天的極光去哪了？」（electric_motor_3_daynight_1106_v1.js）後面。對象：高一資優生。
 * 要解的疑問：磁力不做功，極光粒子的能量從哪來？
 *   能量存在磁場本身（磁能，能量密度 u = B²／2μ₀，像彈力位能）→ 太陽風拖長磁力線做功存成磁能 →
 *   重連時磁能釋放，磁場快速改變感應出電場（電磁感應），做功的是電場；磁場只負責轉彎、導向極區。
 *
 * 顏色（AGENTS 1.1／2.2.1，同一物理量同一色）：動能 K＝黃 C.yellow；磁能＝粉紅 C.pink（與彈力位能同色）；
 *   守恆總和＝綠；電子＝藍 #4dd2ff；電場 E＝紫 C.purple；磁力線＝青 85,233,255；⊗ 均勻磁場＝沿用頁面 drawUniformField3D 的綠 ⊗；
 *   速度 v＝粉筆白；力 F＝橘（「電子進入磁場」原用粉紅畫 F，但本頁粉紅是磁能，為免混淆改橘，回報已註明）。
 *
 * 契約、播放規則、檢查方式同 daynight 檔：
 *   window.MotorAnim.energy = { activate('example-energy'), deactivate(), relang(), _info(), _state(), _frameAt() }
 *   學生模式播完一步停在該步最後一格（下一步開始前 1e-3 s）；老師模式（ctl.onEnd 為函式）連播到總結尾、通知一次；ctl.paused 凍結。
 *   畫面是時間 t 的純函式；單一 RAF；document.hidden／畫布不可見就停，回來重啟。進度條用 AnimBar.draw。
 * 依賴頁面現成的：tr、C、TAU、clear、label、currentLang。
 * 畫面上的數字只有「約幾 keV」；格數、量表長短都是示意。
 *
 * ── 場景步驟表（共 66 s）────────────────────────────────────────
 *   1 磁力不做功 13 s ⊗ 均勻磁場中電子圓周運動，v、F 互相垂直，動能量表不動、W = 0 → 換到極區：電子撞進大氣、約幾 keV、「能量從哪來？」
 *   2 磁能儲存   13 s 左：彈簧被拉長（彈力位能）；右：太陽風拖長磁尾磁力線（磁能）；兩個粉紅量表一起上升；u = B² / 2μ₀
 *   3 重連釋能   13 s 電流片近照：反向磁力線被流入的電漿擠在一起 → 剪斷重接成髮夾形短磁力線彈開、兩側噴流；磁能↓、動能↑
 *   4 誰做功     13 s 電磁感應小圖（B 變化 → 感應 E）；電子在電流片被 E 加速（受力與 E 反向，W = qE·d）；離開後沿磁力線螺旋、動能不變
 *   5 能量守恆   14 s 四格接力：太陽風動能 → 磁能 → 粒子動能＋其他 → 光與熱；每階段格數總和不變（示意）
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, ORANGE = C.orange, PURPLE = C.purple;
  const CHALK = '#f2ecd9', MUTED = C.muted, GREEN = '#4ade80';
  const ELEC = '#4dd2ff';                          // 電子：藍（AGENTS 2.2.1）
  const OTHER = '#cfd8d3';                         // 其他（加熱、被甩出的電漿）：灰白
  const LINE_RGB = '85,233,255';                   // 磁力線：青
  const BMARK = 'rgba(154,240,111,.57)';           // ⊗：與頁面 drawUniformField3D 相同
  const AUR_RGB = '93,255,150';
  const PANEL = 'rgba(12,30,25,0.9)';

  // ───────── 小工具（同 daynight 檔） ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const easeOut = k => { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fit(ctx, s, size, maxW) { while (size > 22 && textW(ctx, s, size) > maxW) size--; return size; }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function line(ctx, pts, color = C.white, width = 4, dash = []) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
  }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function arrow(ctx, x0, y0, x1, y1, color, w = 4, s = 12) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    line(ctx, [[x0, y0], [x1 - Math.cos(a) * s * 0.6, y1 - Math.sin(a) * s * 0.6]], color, w);
    arrowHead(ctx, x1, y1, a, color, s);
  }
  function glowRing(ctx, x, y, r, color, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function softGlow(ctx, x, y, r, rgb, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${0.9 * a})`); g.addColorStop(0.35, `rgba(${rgb},${0.45 * a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 電子（藍）：與「電子進入磁場」同一畫法（光暈＋實心圓），只換成電子藍
  function electron(ctx, x, y, a = 1, r = 9, withLabel = false) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r * 2.2);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, ELEC); g.addColorStop(1, 'rgba(77,210,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = ELEC; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
    if (withLabel) { ctx.save(); ctx.globalAlpha = a; label(ctx, 'e⁻', x + r + 10, y - r - 10, ELEC, 'left', 22); ctx.restore(); }
  }
  function bMark(ctx, x, y, a = 1) {               // ⊗：與頁面 drawUniformField3D 同一畫法
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = BMARK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
    ctx.restore();
  }
  // 有底色的小標籤；anchor: 'center' | 'left'（x 為左緣）| 'right'（x 為右緣）
  function tag(ctx, s, x, y, color, a = 1, size = 24, anchor = 'center', border = true) {
    if (a <= 0 || !s) return;
    size = fit(ctx, s, size, W - 60);
    const w = textW(ctx, s, size) + 22;
    let cx = anchor === 'left' ? x + w / 2 : anchor === 'right' ? x - w / 2 : x;
    cx = clamp(cx, w / 2 + 8, W - w / 2 - 8);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL;
    rrect(ctx, cx - w / 2, y - size * 0.78, w, size * 1.56, 8); ctx.fill();
    if (border) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); }
    label(ctx, s, cx, y + 1, color, 'center', size); ctx.restore();
  }
  function txt(ctx, s, x, y, color, a = 1, size = 22, align = 'left') {
    if (a <= 0 || !s) return;
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, x, y, color, align, size); ctx.restore();
  }
  // 頂端標題列（避開進度條 y<30）
  function topMsg(ctx, s, color) {
    ctx.save(); ctx.fillStyle = PANEL; ctx.fillRect(0, 32, W, 46); ctx.restore();
    if (!s) return;
    label(ctx, s, W / 2, 55, color, 'center', fit(ctx, s, 26, W - 40));
  }
  function botMsg(ctx, s, color, a = 1) {
    if (!s || a <= 0) return;
    const size = fit(ctx, s, 24, W - 40);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; ctx.fillRect(0, 516, W, 40);
    label(ctx, s, W / 2, 536, color, 'center', size); ctx.restore();
  }
  function schematicNote(ctx) {
    label(ctx, tr('示意圖，比例不是真的', 'Schematic, not to scale'), W - 14, 580, MUTED, 'right', 22);
  }
  // 橫向量表：名稱在上（y），長條在下（y+16..y+42）
  function meter(ctx, x, y, w, frac, color, name, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    label(ctx, name, x, y, color, 'left', 22);
    ctx.fillStyle = 'rgba(242,236,217,0.12)'; rrect(ctx, x, y + 16, w, 26, 7); ctx.fill();
    ctx.fillStyle = color; rrect(ctx, x, y + 16, Math.max(8, w * clamp(frac, 0, 1)), 26, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; rrect(ctx, x, y + 16, w, 26, 7); ctx.stroke();
    ctx.restore();
  }
  function bez(p0, p1, p2, p3, n = 40) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
                v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]);
    }
    return out;
  }
  function mkPoly(pts) {
    const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, s, len: s[s.length - 1] };
  }
  function polyAt(p, d) {
    d = clamp(d, 0, p.len); let i = 1; while (i < p.s.length - 1 && p.s[i] < d) i++;
    const a = p.pts[i - 1], b = p.pts[i], k = (d - p.s[i - 1]) / Math.max(1e-6, p.s[i] - p.s[i - 1]);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  // 磁力線：線＋沿線箭頭（frac 處，dir=+1 沿點列方向，-1 反向）
  function fieldLine(ctx, pts, a, w = 3, arrows = [], rgb = LINE_RGB) {
    if (a <= 0 || pts.length < 2) return;
    ctx.save(); ctx.globalAlpha = a; line(ctx, pts, `rgba(${rgb},0.9)`, w);
    const p = mkPoly(pts);
    for (const [f, dir] of arrows) { const [x, y, ang] = polyAt(p, p.len * f); arrowHead(ctx, x, y, dir > 0 ? ang : ang + Math.PI, `rgb(${rgb})`, 10); }
    ctx.restore();
  }

  // ═════════ 第 1 步：磁力不做功 ═════════
  const ORB = { x: 300, y: 300, r: 130, w: 1.1 };         // 圓周：俯視 ⊗ 磁場中，電子順時針（畫布座標角度遞增）
  const BOX1 = { x0: 40, y0: 92, x1: 560, y1: 505 };
  function step1(ctx, tl) {
    const aA = 1 - seg(tl, 6.8, 7.6), aB = seg(tl, 7.2, 8.0);
    if (aA > 0) {
      ctx.save(); ctx.globalAlpha = aA;
      ctx.fillStyle = 'rgba(154,240,111,.035)'; ctx.strokeStyle = 'rgba(85,233,255,.26)'; ctx.lineWidth = 2;
      ctx.fillRect(BOX1.x0, BOX1.y0, BOX1.x1 - BOX1.x0, BOX1.y1 - BOX1.y0); ctx.strokeRect(BOX1.x0, BOX1.y0, BOX1.x1 - BOX1.x0, BOX1.y1 - BOX1.y0);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) bMark(ctx, 90 + c * 84, 130 + r * 85, 1);
      ctx.strokeStyle = 'rgba(77,210,255,.45)'; ctx.lineWidth = 4; ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.arc(ORB.x, ORB.y, ORB.r, 0, TAU); ctx.stroke();
      ctx.restore();
      const th = -Math.PI / 2 + ORB.w * tl;
      const ex = ORB.x + ORB.r * Math.cos(th), ey = ORB.y + ORB.r * Math.sin(th);
      const tx = -Math.sin(th), ty = Math.cos(th);           // 速度方向（順時針）
      const nx = -Math.cos(th), ny = -Math.sin(th);          // 指向圓心
      const va = seg(tl, 0.6, 1.1) * aA, fa = seg(tl, 1.4, 1.9) * aA;
      ctx.save(); ctx.globalAlpha = va; arrow(ctx, ex, ey, ex + tx * 78, ey + ty * 78, CHALK, 5, 14); ctx.restore();
      ctx.save(); ctx.globalAlpha = fa; arrow(ctx, ex, ey, ex + nx * 62, ey + ny * 62, ORANGE, 5, 14);
      // 直角記號
      const q = 14; ctx.strokeStyle = CHALK; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(ex + tx * q, ey + ty * q); ctx.lineTo(ex + tx * q + nx * q, ey + ty * q + ny * q); ctx.lineTo(ex + nx * q, ey + ny * q); ctx.stroke();
      ctx.restore();
      electron(ctx, ex, ey, aA, 9);
      txt(ctx, 'v', ex + tx * 96, ey + ty * 96, CHALK, va, 26, 'center');
      txt(ctx, 'F', ex + nx * 82 + tx * 2, ey + ny * 82 + ty * 2, ORANGE, fa, 26, 'center');
      tag(ctx, 'B ⊗', 96, 470, '#9af06f', aA, 24);
      // 右欄
      tag(ctx, 'F ⊥ v', 600, 130, ORANGE, seg(tl, 1.8, 2.3) * aA, 28, 'left');
      meter(ctx, 600, 210, 360, 0.55, YELLOW, tr('動能 K', 'Kinetic energy K'), seg(tl, 2.6, 3.1) * aA);
      tag(ctx, tr('速率不變', 'Speed stays the same'), 600, 310, YELLOW, seg(tl, 3.6, 4.1) * aA, 24, 'left', false);
      tag(ctx, tr('磁力做功 W = 0', 'Magnetic work W = 0'), 600, 380, CHALK, seg(tl, 4.6, 5.1) * aA, 28, 'left');
    }
    if (aB > 0) {
      ctx.save(); ctx.globalAlpha = aB;
      const g = ctx.createLinearGradient(0, 92, 0, 470);
      g.addColorStop(0, '#0e2131'); g.addColorStop(0.75, '#14303a'); g.addColorStop(1, '#1d4a4a');
      ctx.fillStyle = g; rrect(ctx, 30, 92, 600, 413, 10); ctx.fill();
      ctx.fillStyle = '#163328'; ctx.fillRect(30, 470, 600, 35);
      ctx.strokeStyle = '#6a8f5d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, 470); ctx.lineTo(630, 470); ctx.stroke();
      ctx.restore();
      const XS = [110, 210, 330, 450, 550];
      const ga = seg(tl, 8.6, 10.0);
      // 極光光幕（越來越亮）
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let x = 70; x <= 590; x += 5) {
        const u = (x - 70) / 520, side = Math.sin(Math.PI * u);
        const top = 250 - 70 * side * (0.6 + 0.4 * Math.sin(x * 0.07 + tl));
        const gg = ctx.createLinearGradient(0, 440, 0, top);
        gg.addColorStop(0, `rgba(${AUR_RGB},${0.7 * side * ga * aB})`); gg.addColorStop(1, `rgba(${AUR_RGB},0)`);
        ctx.strokeStyle = gg; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 440); ctx.lineTo(x, top); ctx.stroke();
      }
      ctx.restore();
      for (const x of XS) line(ctx, [[x, 100], [x, 462]], `rgba(${LINE_RGB},${0.5 * aB})`, 2);
      XS.forEach((x, k) => {
        const per = 2.2, ph = ((tl - 7.4 + k * 0.53) % per + per) % per;
        if (tl < 7.4 + 0 * k) return;
        const yy = 110 + ph / 1.4 * 320;
        if (ph < 1.4) electron(ctx, x, yy, aB, 8, k === 2);
        else softGlow(ctx, x, 432, 40, AUR_RGB, aB * (1 - (ph - 1.4) / 0.8));
      });
      tag(ctx, tr('約幾 keV', 'about a few keV'), currentLang === 'en' ? 370 : 400, 160, YELLOW, seg(tl, 8.2, 8.7) * aB, 26, 'left');
      tag(ctx, tr('大氣', 'Atmosphere'), 330, 488, CHALK, aB, 22, 'center', false);
      const qa = seg(tl, 9.4, 10.2) * aB;
      txt(ctx, '?', 810, 250, YELLOW, qa, 140, 'center');
      const ql = currentLang === 'en' ? ['Where does the', 'energy come from?'] : ['能量從哪來？'];
      ql.forEach((s2, r) => txt(ctx, s2, 810, 400 + r * 34, YELLOW, qa, 26, 'center'));
    }
    topMsg(ctx, tl < 7.2 ? tr('磁力永遠垂直於速度：只轉彎，不改變速率', 'Magnetic force is always ⊥ v: it turns, never speeds up')
      : tr('可是極光粒子撞進大氣時，帶著不小的動能', 'Yet auroral particles hit the air with plenty of kinetic energy'), CHALK);
    botMsg(ctx, tl < 7.2 ? tr('動能量表一動也不動：磁力做的功 W = 0', 'The kinetic-energy meter never moves: magnetic work W = 0')
      : tr('磁力不做功，那這份動能是誰給的？', 'If magnetic force does no work, who gave them this energy?'),
    tl < 7.2 ? YELLOW : CHALK, tl < 7.2 ? seg(tl, 5.2, 5.7) : seg(tl, 8.0, 8.5));
  }

  // ═════════ 第 2 步：磁能儲存（彈簧 vs 磁尾） ═════════
  function spring(ctx, x0, x1, y, amp = 18, n = 14) {
    const pts = [[x0, y]], L = x1 - x0;
    for (let i = 1; i < n * 2; i++) pts.push([x0 + 12 + (L - 24) * i / (n * 2), y + (i % 2 ? -amp : amp)]);
    pts.push([x1, y]);
    line(ctx, pts, CHALK, 3);
  }
  const E2 = { x: 640, y: 250, r: 38 };
  function earthDot(ctx, E, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(E.x, E.y, r, 0, TAU); ctx.fillStyle = '#2f87a9'; ctx.fill();
    ctx.beginPath(); ctx.arc(E.x, E.y, r, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fillStyle = 'rgba(8,20,30,0.6)'; ctx.fill();
    ctx.beginPath(); ctx.arc(E.x, E.y, r, 0, TAU); ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function tailLines(ctx, E, r, xEnd, a, hs = [16, 34, 52]) {
    hs.forEach((h, j) => {
      const lam = 55 + 10 * j, f = [E.x + r * Math.cos(lam * Math.PI / 180), E.y - r * Math.sin(lam * Math.PI / 180)];
      const pts = bez(f, [f[0] + r * 0.6, f[1] - r * 0.9], [E.x + r * 2.6, E.y - h], [xEnd, E.y - h], 40);
      fieldLine(ctx, pts, a, 3, [[0.8, -1]]);
      fieldLine(ctx, pts.map(p => [p[0], 2 * E.y - p[1]]), a, 3, [[0.8, 1]]);
    });
    // 日側閉合線
    for (const L of [1.5, 2.2]) {
      const pts = []; const lf = Math.acos(Math.sqrt(1 / L));
      for (let k = 0; k <= 30; k++) { const lam = lerp(-lf, lf, k / 30), c = Math.cos(lam); pts.push([E.x - r * L * c * c * c, E.y - r * L * c * c * Math.sin(lam)]); }
      fieldLine(ctx, pts, a * 0.8, 2.5, [[0.5, -1]]);
    }
  }
  function step2(ctx, tl) {
    const st = easeIO(seg(tl, 1.2, 8.0));
    const frac = 0.12 + 0.75 * st;
    // 左：彈簧
    txt(ctx, tr('拉長的彈簧', 'A stretched spring'), 235, 112, CHALK, 1, 24, 'center');
    ctx.save(); ctx.fillStyle = '#1b3d31'; ctx.fillRect(40, 160, 18, 110); ctx.strokeStyle = CHALK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(58, 160); ctx.lineTo(58, 270); ctx.stroke(); ctx.restore();
    const xe = lerp(160, 262, st);
    spring(ctx, 58, xe, 215, lerp(26, 14, st), 12);
    ctx.save(); ctx.fillStyle = '#3b5a52'; rrect(ctx, xe, 188, 46, 54, 6); ctx.fill(); ctx.strokeStyle = CHALK; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const pa = seg(tl, 0.8, 1.3), pf = pa * (0.55 + 0.45 * (1 - seg(tl, 8.0, 8.6)));
    ctx.save(); ctx.globalAlpha = pf; arrow(ctx, xe + 56, 215, xe + 120, 215, ORANGE, 5, 14); ctx.restore();
    tag(ctx, tr('拉力做功', 'Pull does work'), xe + 70, 272, ORANGE, pa, 22, 'center', false);
    meter(ctx, 50, 340, 380, frac, PINK, tr('彈力位能', 'Elastic potential energy'), seg(tl, 0.4, 0.9));
    // 中間「類比」
    txt(ctx, '≈', 470, 225, CHALK, seg(tl, 2.0, 2.5), 48, 'center');
    // 右：磁尾
    txt(ctx, tr('被拖長的磁力線', 'Stretched field lines'), 760, 112, CHALK, 1, 24, 'center');
    const xEnd = lerp(790, 975, st);
    tailLines(ctx, E2, E2.r, xEnd, 1);
    earthDot(ctx, E2, E2.r);
    const wa = seg(tl, 0.8, 1.3);
    ctx.save(); ctx.globalAlpha = wa;
    for (const y of [150, 350]) { const o = (tl * 40) % 40; arrow(ctx, 520 + o, y, 600 + o, y, ORANGE, 4, 12); }
    ctx.restore();
    tag(ctx, tr('太陽風做功 →', 'Solar wind does work →'), 820, 150, ORANGE, wa, 22, 'center');
    meter(ctx, 560, 400, 400, frac, PINK, tr('磁能', 'Magnetic energy'), seg(tl, 0.4, 0.9));
    // 公式
    const fa = seg(tl, 8.4, 9.0);
    tag(ctx, 'u = B² / 2μ₀', 250, 430, PINK, fa, 32);
    txt(ctx, tr('磁能的能量密度', 'Magnetic energy density'), 250, 482, CHALK, fa, 22, 'center');
    topMsg(ctx, tr('能量存在磁場裡：磁能', 'Energy is stored in the field: magnetic energy'), CHALK);
    botMsg(ctx, tl < 8.2 ? tr('太陽風把磁力線拖長，就像用力把彈簧拉長', 'The solar wind stretches field lines, like pulling a spring')
      : tr('做的功存進磁場：拉得越長，磁能越多', 'The work is stored in the field: the longer the stretch, the more energy'),
    tl < 8.2 ? ORANGE : PINK, tl < 8.2 ? seg(tl, 1.4, 1.9) : seg(tl, 8.2, 8.7));
  }

  // ═════════ 第 3 步：重連釋能（電流片近照） ═════════
  const XC = 330, YC = 300, XL = 40, XR = 620;
  const relax3 = tl => easeOut(seg(tl, 4.6, 9.4));
  function sheetLine(h, dip, sign) {             // sign=-1 上方（y<YC），+1 下方
    const pts = [];
    for (let x = XL; x <= XR; x += 6) pts.push([x, YC + sign * h * (1 - dip * Math.exp(-Math.pow((x - XC) / 80, 2)))]);
    return pts;
  }
  // 重連後新接出來的 U 形線要在最內側的外圈線（高度 44～54）的「裡面」：起點高度 hr 一定要小於它，否則會和外圈線交叉（磁力線不會交叉，除了 X 點）
  function hairpin(k, side) {                    // side=-1 左、+1 右；回傳 [上半, 下半]（都由外緣往折角）
    const xk = XC + side * lerp(0, 190, k), hr = lerp(14, 34, k), x0 = side < 0 ? XL : XR;
    const top = bez([x0, YC - hr], [lerp(xk, x0, 0.25) , YC - hr], [xk, YC - hr * lerp(0.05, 0.75, k)], [xk, YC], 30);
    return [top, top.map(p => [p[0], 2 * YC - p[1]])];
  }
  function step3(ctx, tl) {
    const pinch = easeIO(seg(tl, 1.0, 4.0)), cut = tl >= 4.6, k = relax3(tl);
    // 電流片
    ctx.save(); ctx.globalAlpha = 0.5 * (1 - 0.6 * k); ctx.fillStyle = 'rgba(221,140,255,0.18)'; ctx.fillRect(XL, YC - 14, XR - XL, 28); ctx.restore();
    // 外圈磁力線（上 →、下 ←），慢慢往中間靠
    const outer = [62, 106, 150].map(h => h - 18 * pinch + 10 * k);
    outer.forEach(h => {
      fieldLine(ctx, sheetLine(h, 0.15 * pinch, -1), 0.85, 3, [[0.22, 1], [0.8, 1]]);
      fieldLine(ctx, sheetLine(h, 0.15 * pinch, 1), 0.85, 3, [[0.22, -1], [0.8, -1]]);
    });
    if (!cut) {
      const h = lerp(30, 18, pinch), dip = lerp(0.1, 0.92, pinch) * (tl < 4.2 ? 1 : 1);
      const gap = 10 * seg(tl, 4.2, 4.6);
      const keep = p => Math.abs(p[0] - XC) > gap;
      fieldLine(ctx, sheetLine(h, dip, -1).filter(keep), 1, 4, [[0.12, 1], [0.88, 1]]);
      fieldLine(ctx, sheetLine(h, dip, 1).filter(keep), 1, 4, [[0.12, -1], [0.88, -1]]);
      glowRing(ctx, XC, YC, 16 + 4 * Math.sin(tl * 9), PINK, seg(tl, 3.2, 3.8));
    } else {
      for (const side of [-1, 1]) {
        const [top, bot] = hairpin(k, side);
        // 上半：B 向右；下半：B 向左
        fieldLine(ctx, top, 1, 4, [[0.45, side < 0 ? 1 : -1]]);
        fieldLine(ctx, bot, 1, 4, [[0.45, side < 0 ? -1 : 1]]);
        const sa = (1 - seg(tl, 9.0, 9.6)) * seg(tl, 4.6, 4.9);
        if (sa > 0) { const xk = XC + side * lerp(0, 190, k); ctx.save(); ctx.globalAlpha = sa; arrow(ctx, xk + side * 6, YC, xk + side * 62, YC, PINK, 5, 14); ctx.restore(); }
      }
      glowRing(ctx, XC, YC, 16 + 24 * seg(tl, 4.6, 5.4), PINK, 1 - seg(tl, 4.6, 5.4));
    }
    // 電漿流入（上下）與噴流（左右）
    const ia = seg(tl, 0.4, 0.9);
    for (let j = 0; j < 6; j++) {
      const ph = ((tl * 0.35 + j / 6) % 1);
      const y = lerp(96, YC - 26, ph), x = XC + (j % 3 - 1) * 46;
      ctx.save(); ctx.globalAlpha = ia * (1 - ph * 0.6); ctx.fillStyle = CHALK;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, 2 * YC - y, 4, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = ia; arrow(ctx, XC, 104, XC, 168, CHALK, 4, 12); arrow(ctx, XC, 496, XC, 432, CHALK, 4, 12); ctx.restore();
    tag(ctx, tr('電漿流入', 'Plasma flows in'), XC + 34, 124, CHALK, ia, 22, 'left', false);
    if (cut) {
      const ja = seg(tl, 5.0, 5.6);
      for (let j = 0; j < 10; j++) {
        const ph = (((tl - 5.0) * 0.55 + j / 10) % 1 + 1) % 1, dy = ((j * 7) % 5 - 2) * 6;
        const d = lerp(10, 280, easeIO(ph));
        for (const side of [-1, 1]) {
          const x = XC + side * d;
          if (x < XL + 4 || x > XR - 4) continue;
          ctx.save(); ctx.globalAlpha = ja * (1 - seg(ph, 0.85, 1)); ctx.fillStyle = YELLOW;
          ctx.beginPath(); ctx.arc(x, YC + dy, 5, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      tag(ctx, tr('← 噴流', '← Jet'), 110, 390, YELLOW, ja, 22, 'center', false);
      tag(ctx, tr('噴流 →', 'Jet →'), 550, 390, YELLOW, ja, 22, 'center', false);
    }
    tag(ctx, tr('方向相反', 'Opposite directions'), XC, 210, PINK, seg(tl, 1.4, 1.9) * (1 - seg(tl, 4.2, 4.6)), 22);
    tag(ctx, tr('剪斷、重接', 'Cut & rejoin'), XC, 210, PINK, seg(tl, 4.6, 5.0) * (1 - seg(tl, 6.6, 7.0)), 22);
    tag(ctx, tr('變短、彈開', 'Shorter: springs back'), XC, 210, PINK, seg(tl, 7.0, 7.4), 22);
    // 量表
    const um = lerp(0.85, 0.3, easeIO(seg(tl, 4.8, 9.4))), kk = lerp(0.1, 0.65, easeIO(seg(tl, 4.8, 9.4)));
    meter(ctx, 660, 130, 320, um, PINK, tr('磁能', 'Magnetic energy'), 1);
    meter(ctx, 660, 230, 320, kk, YELLOW, tr('電漿動能', 'Plasma kinetic energy'), 1);
    const da = seg(tl, 6.0, 6.5);
    ctx.save(); ctx.globalAlpha = da;
    arrowHead(ctx, 660 + 320 * um + 18, 159, Math.PI, PINK, 12); arrowHead(ctx, 660 + 320 * kk + 18, 259, 0, YELLOW, 12);
    ctx.restore();
    tag(ctx, tr('磁能減少', 'Magnetic energy ↓'), 660, 340, PINK, seg(tl, 9.4, 9.9), 26, 'left', false);
    tag(ctx, tr('＝ 動能增加', '= Kinetic energy ↑'), 660, 396, YELLOW, seg(tl, 9.9, 10.4), 26, 'left', false);
    topMsg(ctx, tr('重連把磁能放出來', 'Reconnection releases the magnetic energy'), CHALK);
    const msg = tl < 4.4 ? [tr('兩側流入的電漿把方向相反的磁力線擠在一起', 'Inflowing plasma pushes oppositely directed lines together'), CHALK]
      : tl < 9.4 ? [tr('剪斷、交叉重接：新的短磁力線像橡皮筋彈開，把電漿甩出去', 'Cut and rejoined: the short new lines spring back and fling the plasma out'), PINK]
      : [tr('磁能減少的部分，變成電漿的動能', 'The magnetic energy lost becomes the plasma\'s kinetic energy'), YELLOW];
    botMsg(ctx, msg[0], msg[1], seg(tl, 0.8, 1.3));
  }

  // ═════════ 第 4 步：誰做功 ═════════
  const SH = { x0: 50, x1: 420, y: 285 };
  const ACC0 = 4.4, ACC1 = 8.4, FREE1 = 12.6;
  const exitPath = mkPoly(bez([SH.x1, SH.y], [540, SH.y], [600, 340], [606, 490], 40));
  function step4(ctx, tl) {
    // 電磁感應小圖
    const ia = seg(tl, 0.2, 0.7);
    if (ia > 0) {
      ctx.save(); ctx.globalAlpha = ia;
      const cx = 104, cy = 162, pulse = 0.5 + 0.5 * Math.sin(tl * 4);
      ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 58, 46, 0, 0, TAU); ctx.stroke();
      for (const [dx, dy] of [[-22, -14], [22, -14], [0, 16]]) bMark(ctx, cx + dx, cy + dy, 0.35 + 0.65 * pulse);
      // 感應電場（沿環繞行的紫色箭頭）
      const ea = seg(tl, 1.4, 1.9);
      if (ea > 0) {
        ctx.globalAlpha = ia * ea; ctx.strokeStyle = PURPLE; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(cx, cy, 72, 60, 0, -0.3, 2.4); ctx.stroke();
        const a = 2.4; arrowHead(ctx, cx + 72 * Math.cos(a), cy + 60 * Math.sin(a), a + Math.PI / 2, PURPLE, 13);
        ctx.beginPath(); ctx.ellipse(cx, cy, 72, 60, 0, 2.84, 5.54); ctx.stroke();
        const b = 5.54; arrowHead(ctx, cx + 72 * Math.cos(b), cy + 60 * Math.sin(b), b + Math.PI / 2, PURPLE, 13);
      }
      ctx.restore();
      txt(ctx, tr('磁場變化 ΔB', 'Changing field ΔB'), 196, 128, '#9af06f', ia, 22);
      txt(ctx, tr('→ 感應出電場 E', '→ induces an electric field E'), 196, 164, PURPLE, seg(tl, 1.4, 1.9), 22);
      txt(ctx, tr('（電磁感應）', '(electromagnetic induction)'), 196, 200, CHALK, seg(tl, 2.2, 2.7), 22);
    }
    // 電流片與電場
    const sa = seg(tl, 2.8, 3.4);
    ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = 'rgba(221,140,255,0.14)'; rrect(ctx, SH.x0, SH.y - 26, SH.x1 - SH.x0, 52, 8); ctx.fill();
    for (let x = SH.x0 + 70; x < SH.x1; x += 110) { arrow(ctx, x + 36, SH.y - 14, x - 30, SH.y - 14, PURPLE, 3, 10); }
    ctx.restore();
    txt(ctx, 'E', SH.x1 + 14, SH.y - 14, PURPLE, sa, 24);
    // 電子：先在電流片被加速，再沿磁力線螺旋前進
    const ka = seg(tl, 3.4, 3.9);
    let ex, ey, K;
    const kAcc = seg(tl, ACC0, ACC1);
    if (tl < ACC1) { ex = lerp(SH.x0 + 30, SH.x1, kAcc * kAcc); ey = SH.y + 10; K = lerp(0.12, 0.78, kAcc * kAcc); }
    else {
      const u = seg(tl, ACC1, FREE1), d = exitPath.len * u;
      const [x, y, ang] = polyAt(exitPath, d), amp = 9 * Math.sin(d * 0.22);
      ex = x - Math.sin(ang) * amp; ey = y + Math.cos(ang) * amp; K = 0.78;
    }
    const la = seg(tl, ACC1 - 0.2, ACC1 + 0.4);
    ctx.save(); ctx.globalAlpha = la; line(ctx, exitPath.pts, `rgba(${LINE_RGB},0.85)`, 3); ctx.restore();
    if (la > 0) { const [x, y, a] = polyAt(exitPath, exitPath.len * 0.55); ctx.save(); ctx.globalAlpha = la; arrowHead(ctx, x, y, a, CYAN, 11); ctx.restore(); }
    if (tl >= ACC0 && tl < ACC1) {                      // 電子受力 F 與 E 反向（E 向左 → F 向右）
      ctx.save(); ctx.globalAlpha = seg(tl, ACC0, ACC0 + 0.3); arrow(ctx, ex + 14, ey + 26, ex + 74, ey + 26, ORANGE, 4, 12); ctx.restore();
      txt(ctx, 'F', ex + 84, ey + 26, ORANGE, seg(tl, ACC0, ACC0 + 0.3), 24);
    }
    electron(ctx, ex, ey, ka, 9, false);
    txt(ctx, 'e⁻', tl < ACC1 ? ex - 26 : ex + 22, tl < ACC1 ? ey + 2 : ey - 20, ELEC, ka, 22, tl < ACC1 ? 'right' : 'left');
    // d 與 W
    const wa = seg(tl, 6.0, 6.5);
    ctx.save(); ctx.globalAlpha = wa; line(ctx, [[SH.x0 + 30, 348], [SH.x1, 348]], CHALK, 2);
    line(ctx, [[SH.x0 + 30, 340], [SH.x0 + 30, 356]], CHALK, 2); line(ctx, [[SH.x1, 340], [SH.x1, 356]], CHALK, 2); ctx.restore();
    txt(ctx, 'd', SH.x1 + 16, 348, CHALK, wa, 24, 'left');
    txt(ctx, tr('電子帶負電：受力 F 與 E 反向', 'Electron is negative: F is opposite to E'), SH.x0, 388, ORANGE, seg(tl, ACC0 + 0.4, ACC0 + 0.9), 22);
    tag(ctx, 'W = qE·d', SH.x0, 436, YELLOW, wa, 28, 'left');
    tag(ctx, tr('磁場 B：不做功，只改變方向', 'Field B: no work, only turns it'), SH.x0, 482, CYAN, seg(tl, ACC1 + 0.6, ACC1 + 1.1), 22, 'left');
    // 右欄
    meter(ctx, 660, 104, 320, K, YELLOW, tr('電子動能 K', 'Electron kinetic energy K'), seg(tl, 3.4, 3.9));
    const ta = seg(tl, 9.4, 9.9), tb = seg(tl, 10.4, 10.9);
    function card(y, col, rows, a) {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; rrect(ctx, 660, y, 320, 34 * rows.length + 22, 10); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      rows.forEach(([s, c], r) => txt(ctx, s, 676, y + 28 + r * 34, c, a, 22));
    }
    card(178, PURPLE, [[tr('電場 E', 'Electric field E'), PURPLE], [tr('→ 做功', '→ does work'), CHALK], [tr('→ 動能 ↑', '→ kinetic energy ↑'), YELLOW]], ta);
    card(330, CYAN, [[tr('磁場 B', 'Magnetic field B'), CYAN], [tr('→ 不做功', '→ does no work'), CHALK], [tr('→ 只轉彎、導向極區', '→ turns it, guides it'), '#9af06f']], tb);
    topMsg(ctx, tr('做功的是電場，不是磁力', 'The electric field does the work, not the magnetic force'), CHALK);
    const msg = tl < ACC0 ? [tr('重連時磁場快速改變，感應出電場（電磁感應）', 'Reconnection changes B fast, inducing an electric field'), PURPLE]
      : tl < ACC1 ? [tr('電場對電子做功：電子越跑越快，動能上升', 'The electric field does work: the electron speeds up'), YELLOW]
      : [tr('離開電流片後沿磁力線螺旋前進：動能不變', 'Out of the sheet it spirals along B: kinetic energy unchanged'), CYAN];
    botMsg(ctx, msg[0], msg[1], seg(tl, 0.8, 1.3));
  }

  // ═════════ 第 5 步：能量守恆（格數接力） ═════════
  const COLW = 210, COLG = 40, COLX0 = (W - (4 * COLW + 3 * COLG)) / 2, CELL = 40, CG = 6, GRID_Y = 196, NCELL = 12;
  const colX = c => COLX0 + c * (COLW + COLG);
  function cellPos(c, j) { const gx = colX(c) + (COLW - (3 * CELL + 2 * CG)) / 2; return [gx + (j % 3) * (CELL + CG), GRID_Y + Math.floor(j / 3) * (CELL + CG)]; }
  const STAGE_COL = [
    () => YELLOW,
    () => PINK,
    j => (j < 6 ? YELLOW : OTHER),
    j => (j < 6 ? '#5dff96' : OTHER)
  ];
  const T5 = [[0.8, 2.2], [3.0, 5.2], [5.8, 8.0], [8.6, 10.8]];
  function cellRect(x, y, col, a) {
    if (a <= 0) return;
    ctx5.save(); ctx5.globalAlpha = a; ctx5.fillStyle = col; rrect(ctx5, x, y, CELL, CELL, 6); ctx5.fill();
    ctx5.strokeStyle = 'rgba(242,236,217,0.6)'; ctx5.lineWidth = 1.5; ctx5.stroke(); ctx5.restore();
  }
  let ctx5 = null;
  function step5(ctx, tl) {
    ctx5 = ctx;
    const heads = [[['太陽風動能'], ['Solar wind', 'kinetic energy'], YELLOW], [['磁能'], ['Magnetic', 'energy'], PINK],
      [['粒子動能', '＋其他'], ['Particle KE', '+ other'], YELLOW], [['光與熱'], ['Light', 'and heat'], '#5dff96']];
    heads.forEach(([zh, en, col], c) => {
      const a = seg(tl, T5[c][0] - 0.6, T5[c][0]); if (a <= 0) return;
      const x = colX(c);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; rrect(ctx, x, 94, COLW, 84, 12); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      const ls = currentLang === 'en' ? en : zh;
      ls.forEach((s, r) => txt(ctx, s, x + COLW / 2, 136 + (r - (ls.length - 1) / 2) * 28, col, a, 24, 'center'));
      if (c > 0) { ctx.save(); ctx.globalAlpha = a; arrow(ctx, x - COLG + 6, 136, x - 6, 136, CHALK, 4, 12); ctx.restore(); }
    });
    // 第 1 欄：逐格出現；之後每一欄：格子從前一欄飛過來、換顏色
    for (let j = 0; j < NCELL; j++) {
      const [x, y] = cellPos(0, j);
      cellRect(x, y, YELLOW, seg(tl, T5[0][0] + j * 0.1, T5[0][0] + j * 0.1 + 0.3));
    }
    for (let c = 1; c < 4; c++) {
      const [t0, t1] = T5[c];
      for (let j = 0; j < NCELL; j++) {
        const s0 = t0 + j * (t1 - t0 - 0.8) / NCELL, u = easeIO(seg(tl, s0, s0 + 0.8));
        if (u <= 0) continue;
        const [xa, ya] = cellPos(c - 1, j), [xb, yb] = cellPos(c, j);
        const x = lerp(xa, xb, u), y = lerp(ya, yb, u) - 40 * Math.sin(Math.PI * u);
        cellRect(x, y, u < 0.5 ? STAGE_COL[c - 1](j) : STAGE_COL[c](j), 1);
      }
    }
    // 守恆：每一欄總和不變
    const ga = seg(tl, 11.0, 11.5);
    if (ga > 0) {
      ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
      for (let c = 0; c < 4; c++) { const x = colX(c) + 20, w = COLW - 40; ctx.beginPath(); ctx.moveTo(x, 384); ctx.lineTo(x, 394); ctx.lineTo(x + w, 394); ctx.lineTo(x + w, 384); ctx.stroke(); }
      ctx.restore();
      txt(ctx, tr('每一階段的格數總和不變（能量守恆）', 'The total number of cells never changes (energy is conserved)'), W / 2, 420, GREEN, ga, 24, 'center');
    }
    tag(ctx, tr('灰＝加熱、被甩出的電漿', 'Grey = heating, plasma flung away'), colX(2) - 10, 464, OTHER, seg(tl, 6.6, 7.1), 22, 'left', false);
    tag(ctx, tr('格數只是示意，不是真實比例', 'Cells are schematic, not real proportions'), 30, 464, MUTED, seg(tl, 1.4, 1.9), 22, 'left', false);
    topMsg(ctx, tr('能量守恆：能量只是一路換形式', 'Energy is conserved: it only changes form'), CHALK);
    const msg = tl < 2.8 ? [tr('太陽風帶著動能吹向地球', 'The solar wind carries kinetic energy toward Earth'), YELLOW]
      : tl < 5.6 ? [tr('拖長磁力線，存成磁能', 'Stretching field lines stores it as magnetic energy'), PINK]
      : tl < 8.4 ? [tr('重連釋放：一部分變成粒子動能，其他變成加熱與被甩出的電漿', 'Reconnection: part becomes particle KE, the rest heating and ejected plasma'), YELLOW]
      : [tr('粒子撞上大氣變成光與熱：只有一部分成為極光', 'Particles hit the air as light and heat: only part becomes aurora'), '#5dff96'];
    botMsg(ctx, msg[0], msg[1], seg(tl, 0.6, 1.1));
  }

  function drawEnergy(ctx, step, tl, T) {
    if (step === 0) step1(ctx, tl);
    else if (step === 1) step2(ctx, tl);
    else if (step === 2) step3(ctx, tl);
    else if (step === 3) step4(ctx, tl);
    else step5(ctx, tl);
    schematicNote(ctx);
  }

  // ═════════ 場景表 ═════════
  const SCENES = {
    'example-energy': {
      draw: drawEnergy,
      steps: [
        { d: 13.0, b: ['磁力不做功', 'B does no work'],
          cap: ['<strong class="accent-yellow">磁力不做功：</strong>磁力永遠垂直於速度（F ⊥ v），只會讓粒子轉彎，不會讓它變快或變慢。可是極光粒子撞進大氣時帶著約幾 keV 的動能，這份能量從哪來？',
                '<strong class="accent-yellow">Magnetic force does no work:</strong> it is always perpendicular to the velocity (F ⊥ v), so it only turns a particle and never speeds it up or slows it down. Yet auroral particles hit the atmosphere with a kinetic energy of about a few keV. Where does that energy come from?'] },
        { d: 13.0, b: ['磁能儲存', 'Stored energy'],
          cap: ['<strong class="accent-pink">能量存在磁場裡：</strong>磁力線像有張力的橡皮筋。太陽風把磁力線拖長、壓緊，做的功就存進磁場，這就是<strong class="accent-pink">磁能</strong>，能量密度 B<sup>2</sup>/2μ<sub>0</sub>，像拉長的彈簧存的彈力位能。',
                '<strong class="accent-pink">Energy is stored in the field:</strong> field lines act like rubber bands under tension. When the solar wind stretches and squeezes them, the work done is stored in the field as <strong class="accent-pink">magnetic energy</strong>, with energy density B<sup>2</sup>/2μ<sub>0</sub>, just like the elastic energy of a stretched spring.'] },
        { d: 13.0, b: ['重連釋能', 'Release'],
          cap: ['<strong class="accent-pink">重連把磁能放出來：</strong>方向相反的磁力線被擠在一起，剪斷、交叉重接成較短的磁力線；繃緊的橡皮筋彈開，磁能減少，電漿被甩出去、動能增加。',
                '<strong class="accent-pink">Reconnection releases the magnetic energy:</strong> oppositely directed field lines are pushed together, cut and rejoined crosswise into shorter lines; like a stretched rubber band springing back, the magnetic energy drops while the plasma is flung outward and gains kinetic energy.'] },
        { d: 13.0, b: ['誰做功', 'Who does work'],
          cap: ['<strong class="accent-yellow">做功的是電場，不是磁力：</strong>重連時磁場快速改變，感應出<strong class="accent-purple">電場</strong>（電磁感應）；電場對帶電粒子做功，讓它變快。磁場只負責轉彎，把粒子<strong class="accent-green">導向極區</strong>。',
                '<strong class="accent-yellow">The electric field does the work, not the magnetic force:</strong> when the magnetic field changes rapidly it induces an <strong class="accent-purple">electric field</strong> (electromagnetic induction); that field does work on charged particles and speeds them up. The magnetic field only turns them and <strong class="accent-green">guides them to the poles</strong>.'] },
        { d: 14.0, b: ['能量守恆', 'Conservation'],
          cap: ['<strong class="accent-green">能量守恆：</strong>太陽風的動能 → 拖長磁力線，存成磁能 → 重連釋放，變成粒子動能 → 撞上大氣，變成光與熱。能量沒有憑空出現，只是一路換形式；只有一部分最後變成極光。',
                '<strong class="accent-green">Energy is conserved:</strong> the solar wind\'s kinetic energy → stretches the field lines and is stored as magnetic energy → is released by reconnection as particle kinetic energy → hits the atmosphere and becomes light and heat. Energy never appears from nothing; it changes form all the way, and only part of it ends up as aurora.'] }
      ]
    }
  };

  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF；同 daynight 檔） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false, halted: false };
  function canvasCtx() { const c = document.getElementById('forceExamplesCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }
  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t);
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);          // 本頁畫布 2000×1200，邏輯座標 1000×600
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i], S.t);
    if (window.AnimBar) window.AnimBar.draw(ctx, W, sc.starts, sc.total, S.t);
    ctx.restore();
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('forceExampleResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-force');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    stop();
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false; S.halted = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-force'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = document.getElementById('forceExamplesCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  // 這一次播放的終點：老師模式＝總結尾；學生模式＝目前這一步的結尾（都停在終點前 1e-3 s）
  function endOf(sc) {
    if (teacher()) return sc.total - 1e-3;
    const i = stepAt(sc, S.t);
    return (i + 1 < sc.starts.length ? sc.starts[i + 1] : sc.total) - 1e-3;
  }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden || S.halted) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const sc = SCENES[S.scene], end = endOf(sc);
    if (S.last && !(MA.ctl && MA.ctl.paused)) S.t = Math.min(end, S.t + Math.min(0.1, (ts - S.last) / 1000));
    S.last = ts;
    render();
    if (S.t >= end) {
      S.halted = true;
      if (teacher() && !S.endFired) { S.endFired = true; MA.ctl.onEnd(); }
      return;
    }
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden || S.halted) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.scene) start(); });

  MA.energy = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'example-energy';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false; S.halted = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1; S.halted = false;
      const row = document.getElementById('steps-force'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();   // 停住的（halted）start() 不會動
    },
    // 測試用：畫指定時間的那一格並停住
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; stop(); S.scene = sceneId; S.t = t; S.halted = true; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!(S.raf || S.timer), halted: S.halted }; }
  };
})();
