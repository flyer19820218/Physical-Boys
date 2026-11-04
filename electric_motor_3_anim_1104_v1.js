/* electric_motor_3_anim_1104_v1.js — 「馬達慢動作運轉」分頁動畫（#motorAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.MotorAnim.anim = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 兩個場景（子分頁）：'anim-torque' 轉動的秘密、'anim-gap' 無電流的死角。
 * 依賴頁面現成的（直接呼叫，不複製、不改）：tr、C、TAU、label、drawFlatArrow、structProject（只用來定位強調）、
 *   renderMotorAssembly（showCurrent／showForces＝頁面 drawMotorLessonCanvas 的同一組參數；
 *   斷電判斷、電流方向、電流順序 sequence 都由它的 onStatus 回傳，本檔不自己推導）。
 * 畫法：每格把 renderMotorAssembly 畫進離屏畫布（2000×1200），再合成到 #motorAnimCanvas：
 *   發光輪廓（銅線本身貼回發光之上）、電流 I 小箭頭、力矩弧箭頭、電刷＋缺口局部放大（左上）。
 *   頂端橫帶放本步說明（一行蓋 0–50、兩行蓋 0–74，並蓋掉頁面 y=64 的「固定磁場 B：N → S」）。
 * 轉角 a(t)：每步一個純函式 a(tl)（相鄰步驟首尾相接）；全速＝頁面原慢動作 0.04 rad/幀 × 60 fps = 2.4 rad/s。
 * 結果框 #motorAnimResult：依步驟換句（沿用頁面原句與 EN；第 5 步用頁面「端點電流：…」句，隨 sequence 即時更新）。
 *
 * ── 場景步驟表 anim-torque「轉動的秘密」，共 38 s ─────────────────
 *   1 水平      6.5 s  a = 0          線圈發亮外框；綠點沿 B 由 N 流向 S；顯示電流（不畫 F）
 *   2 右側受力  7.5 s  a = 0          右側邊（A–B）發光＋青色 I 箭頭沿邊指向「朝內」；頁面 F 箭頭
 *   3 左側受力  7.5 s  a = 0          左側邊（C–D）發光＋青色 I 箭頭指向「朝外」；頁面 F 箭頭
 *   4 力矩      7.5 s  a: 0 → 0.32    兩側 F 一上一下；黃色逆時針力矩弧箭頭；線圈由靜止慢慢起轉
 *   5 連續轉動  9.0 s  2.5 s 內加速到 2.4 rad/s 後等速轉（約 2.5 圈）；頁面電流順序標籤每半圈翻轉
 * ── 場景步驟表 anim-gap「無電流的死角」，共 40 s ──────────────────
 *   1 轉向垂直  7 s    a: 0.80 → 1.30 垂直虛線參考；線圈轉向垂直面
 *   2 缺口      8 s    a: 1.30 → 1.493 左上局部放大右電刷＋集電環缺口（標「缺口」「右電刷」）
 *   3 斷電      8 s    a: 1.493 → 1.60 進入頁面斷電區（|cos a| < .075）：F 消失、頁面「瞬間斷電」；
 *                                      頂端閃爍紅字「⚠️ 缺口斷電：靠慣性轉過！」；放大框閃白
 *   4 慣性      7 s    a: 1.60 → 1.80 黃色逆時針弧箭頭（慣性）；約 1.6 s 時離開缺口、F 恢復
 *   5 換向      10 s   前 4.5 s a: 1.80 → 2.16（放大框顯示電刷改接另一半環，之後淡出），
 *                      再 2 s 加速到 2.4 rad/s 等速轉；電流順序變成另一向，F 方向不變
 * 學生模式最後一步播完自動從第 1 步重播；老師模式（MotorAnim.ctl.onEnd 是函式）停在最後一格並通知一次。
 * 暫停（MotorAnim.ctl.paused）時不重畫（drawCurrentFlow 用 performance.now，重畫會讓電流繼續流）。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;

  const W = 1000;
  const FONT = "'Noto Sans TC',sans-serif";
  const CHALK = '#f2ecd9';
  const FULL = 2.4;                                  // rad/s ＝ 頁面原慢動作 0.04 rad/幀 × 60
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pulse = (t, k) => 0.5 + 0.5 * Math.sin(t * (k || 4));
  const lerp = (a, b, u) => a + (b - a) * u;
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');

  // ───────── 定位用（與 renderMotorAssembly 內部相同的常數，只用來畫強調） ─────────
  const INSET = { x: 20, y: 140, w: 312, h: 240 };          // 左上局部放大框
  const SRC = { x: 362, y: 410, w: 114, h: 88 };           // 右電刷接點＋集電環右緣（避開「右電刷」字）
  function coilCorners(a) {                                 // A, B, C, D（同頁面 corner3d：W=158、zFront=-188、zBack=208）
    const c = Math.cos(a), s = Math.sin(a), Wc = 158;
    return [[Wc * c, Wc * s, -188], [Wc * c, Wc * s, 208], [-Wc * c, -Wc * s, 208], [-Wc * c, -Wc * s, -188]]
      .map(p => structProject(p[0], p[1], p[2]));
  }
  function expand(pts, d) {
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    return pts.map(p => { const dx = p.x - cx, dy = p.y - cy, L = Math.hypot(dx, dy) || 1; return { x: p.x + dx / L * d, y: p.y + dy / L * d }; });
  }

  // ───────── 文字工具 ─────────
  function wrapLines(ctx, text, maxW, size) {
    ctx.save(); ctx.font = `900 ${size}px ${FONT}`;
    const out = []; let line = '';
    const toks = currentLang === 'en' ? text.split(/(\s+)/) : Array.from(text);
    toks.forEach(tk => {
      const test = line + tk;
      if (line && ctx.measureText(test.trim()).width > maxW) { out.push(line.trim()); line = tk.trimStart(); }
      else line = test;
    });
    if (line.trim()) out.push(line.trim());
    if (out.length === 2 && !wrapLines._inner) {           // 兩行時平均分配
      const total = ctx.measureText(text).width;
      wrapLines._inner = true;
      const bal = wrapLines(ctx, text, Math.min(maxW, total / 2 + size * 1.6), size);
      wrapLines._inner = false;
      ctx.restore();
      return bal.length === 2 ? bal : out;
    }
    ctx.restore();
    return out;
  }
  // 頂端說明帶：一行時只蓋 0–50，兩行蓋 0–74；另外一定蓋掉頁面 y=64 的「固定磁場 B：N → S」。
  // 不蓋滿 0–88：線圈轉到接近垂直時，頁面的角標 B／C 會到 y≈84，留給它。
  function bandBg(ctx, two) {
    ctx.save(); ctx.fillStyle = C.canvas;
    ctx.fillRect(0, 0, W, two ? 74 : 50); ctx.fillRect(355, 48, 290, 26);
    ctx.restore();
  }
  function band(ctx, text, color, size) {                 // 最多兩行；只用中間 x 155–845（左上筆工具、右上語言鈕）
    size = size || 23;
    const lines = wrapLines(ctx, text, 690, size).slice(0, 2);
    bandBg(ctx, lines.length > 1);
    const ys = lines.length > 1 ? [26, 60] : [30];
    lines.forEach((s, k) => label(ctx, s, 500, ys[k], color || CHALK, 'center', size));
  }
  function glowPath(ctx, buildPath, col, tl, width) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = width || 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = col; ctx.shadowBlur = 10 + 14 * pulse(tl);
    ctx.globalAlpha = 0.55 + 0.45 * pulse(tl);
    ctx.beginPath(); buildPath(); ctx.stroke();
    ctx.restore();
  }

  // ───────── 離屏圖與合成 ─────────
  let off = null, offCtx = null, status = { disconnected: false, direction: 1, sequence: '' };
  function renderOff(a, forces) {
    if (!off) { off = document.createElement('canvas'); off.width = 2000; off.height = 1200; offCtx = off.getContext('2d'); }
    offCtx.setTransform(2, 0, 0, 2, 0, 0);
    renderMotorAssembly(offCtx, a, {                       // 與頁面 drawMotorLessonCanvas 同一組參數
      turns: 5, fieldStrength: 3, showCurrent: true, showForces: forces !== false, currentStrength: 2,
      onStatus: s => { status = s; }
    });
  }
  function paste(ctx, alpha) {
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, 600);
    ctx.globalAlpha = alpha; ctx.drawImage(off, 0, 0, 2000, 1200, 0, 0, W, 600); ctx.restore();
  }
  function pasteClip(ctx, buildPath, alpha) {
    ctx.save(); ctx.beginPath(); buildPath(); ctx.clip();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(off, 0, 0, 2000, 1200, 0, 0, W, 600); ctx.restore();
  }
  const rectPath = (ctx, x, y, w, h) => () => ctx.rect(x, y, w, h);
  const polyPath = (ctx, pts) => () => { pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };

  // 一條邊（p→q）周圍的四邊形
  function sideQuad(p, q, r) {
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L * r, ny = dx / L * r, ex = dx / L * r * 0.6, ey = dy / L * r * 0.6;
    return [{ x: p.x - ex + nx, y: p.y - ey + ny }, { x: q.x + ex + nx, y: q.y + ey + ny }, { x: q.x + ex - nx, y: q.y + ey - ny }, { x: p.x - ex - nx, y: p.y - ey - ny }];
  }
  // 強調一側：沿這一邊畫發光帶，再把銅線本身（離屏圖同一塊）貼回發光之上；不淡化其他部位（避免貼回的硬邊）
  function focusSide(ctx, p, q, tl) {
    paste(ctx, 1);
    glowPath(ctx, polyPath(ctx, sideQuad(p, q, 22)), C.yellow, tl, 6);
    pasteClip(ctx, polyPath(ctx, sideQuad(p, q, 14)));
  }
  // 沿邊畫電流 I 小箭頭（from→to＝電流方向，由頁面 sequence 決定），向外側偏移
  function currentArrow(ctx, from, to, side, tl) {
    const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if ((side > 0 && nx < 0) || (side < 0 && nx > 0)) { nx = -nx; ny = -ny; }
    const off1 = 38, sh = 0.08 * Math.sin(tl * 2.2);
    const a = { x: lerp(from.x, to.x, 0.22 + sh) + nx * off1, y: lerp(from.y, to.y, 0.22 + sh) + ny * off1 };
    const b = { x: lerp(from.x, to.x, 0.72 + sh) + nx * off1, y: lerp(from.y, to.y, 0.72 + sh) + ny * off1 };
    drawFlatArrow(ctx, a.x, a.y, b.x, b.y, C.cyan, 6, 17);
    label(ctx, 'I', (a.x + b.x) / 2 + nx * 30, (a.y + b.y) / 2 + ny * 30, C.cyan, 'center', 28);
  }
  // 逆時針弧箭頭（畫在電樞旋轉平面 z=0、半徑 215 的上半部；角度遞增＝頁面轉向）
  function torqueArc(ctx, tl, alpha, tEnd) {
    if (alpha <= 0) return;
    const R = 215, t0 = 0.75, t1 = tEnd || 2.72, n = 40, pts = [];
    for (let i = 0; i <= n; i++) { const th = lerp(t0, t1, i / n); pts.push(structProject(R * Math.cos(th), R * Math.sin(th), 0)); }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = C.yellow; ctx.shadowBlur = 8 + 10 * pulse(tl, 3);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    const e = pts[n], d = pts[n - 2], ang = Math.atan2(e.y - d.y, e.x - d.x);
    ctx.translate(e.x, e.y); ctx.rotate(ang); ctx.fillStyle = C.yellow;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -13); ctx.lineTo(-12, 13); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 沿弧移動的亮點：顯示轉動方向
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#ffffff'; ctx.shadowColor = C.yellow; ctx.shadowBlur = 14;
    for (let j = 0; j < 2; j++) {
      const u = (tl * 0.35 + j / 2) % 1, p = pts[Math.round(u * (n - 3))];
      ctx.globalAlpha = alpha * Math.min(1, u * 5, (1 - u) * 5);
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // 綠點沿 B 由 N（右）流向 S（左）：與頁面 drawReferenceField 的五條箭頭同高
  function fieldDots(ctx, t) {
    ctx.save(); ctx.fillStyle = C.green; ctx.shadowColor = C.green; ctx.shadowBlur = 10;
    const span = 560;
    [220, 270, 320, 370, 420].forEach((y, k) => {
      for (let j = 0; j < 4; j++) {
        const s = (t * 110 + j * span / 4 + k * 37) % span;
        ctx.globalAlpha = 0.95 * Math.min(1, s / 40, (span - s) / 40);
        ctx.beginPath(); ctx.arc(785 - s, y, 5, 0, TAU); ctx.fill();
      }
    });
    ctx.restore();
  }

  // ───────── 局部放大：右電刷＋集電環缺口（左上） ─────────
  const toInset = (x, y) => ({ x: INSET.x + (x - SRC.x) * INSET.w / SRC.w, y: INSET.y + (y - SRC.y) * INSET.h / SRC.h });
  function inset(ctx, a, tl, alpha, title, flash) {
    if (alpha <= 0) return;
    const I = INSET;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,243,106,.85)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.strokeRect(SRC.x, SRC.y, SRC.w, SRC.h);
    ctx.beginPath();
    ctx.moveTo(SRC.x, SRC.y); ctx.lineTo(I.x + I.w, I.y);
    ctx.moveTo(SRC.x, SRC.y + SRC.h); ctx.lineTo(I.x + I.w, I.y + I.h);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.canvas; ctx.beginPath(); ctx.roundRect(I.x - 8, I.y - 44, I.w + 16, I.h + 52, 14); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(I.x, I.y, I.w, I.h, 10); ctx.clip();
    ctx.drawImage(off, SRC.x * 2, SRC.y * 2, SRC.w * 2, SRC.h * 2, I.x, I.y, I.w, I.h);
    // 缺口標記：靠右電刷那一道絕緣縫（同頁面 ringPhase = a − π/2、兩道縫在 ringPhase 與 ringPhase+π）
    const rp = a - Math.PI / 2, g = Math.cos(rp) >= 0 ? rp : rp + Math.PI;
    const gw = structProject(48 * Math.cos(g), 48 * Math.sin(g), -282), gp = toInset(gw.x, gw.y);
    const inside = gp.x > I.x + 6 && gp.x < I.x + I.w - 6 && gp.y > I.y + 6 && gp.y < I.y + I.h - 6 && Math.cos(g) > 0.2;
    const gl = { x: I.x + 92, y: I.y + 186 }, bl = { x: I.x + 226, y: I.y + 220 };
    if (inside) {
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(gl.x, gl.y - 18); ctx.lineTo(gp.x, gp.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 3.5; ctx.shadowColor = C.yellow; ctx.shadowBlur = 10 + 8 * pulse(tl, 6);
      ctx.beginPath(); ctx.arc(gp.x, gp.y, 13, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
    }
    const cw = structProject(52, 0, -265), cp = toInset(cw.x, cw.y);
    ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(bl.x, bl.y - 18); ctx.lineTo(cp.x + 10, cp.y + 30); ctx.stroke(); ctx.setLineDash([]);
    if (inside) label(ctx, tr('缺口', 'insulating gap'), gl.x, gl.y, C.yellow, 'center', 24);
    label(ctx, '右電刷', bl.x, bl.y, CHALK, 'center', 24);
    ctx.restore();
    const f = clamp(flash || 0, 0, 1);
    ctx.strokeStyle = f > 0 ? `rgba(255,255,255,${0.5 + 0.5 * f})` : C.yellow;
    ctx.lineWidth = 3 + 4 * f; ctx.shadowColor = f > 0 ? '#ffffff' : C.yellow; ctx.shadowBlur = 8 + 16 * f + 6 * pulse(tl);
    ctx.beginPath(); ctx.roundRect(I.x, I.y, I.w, I.h, 10); ctx.stroke();
    ctx.shadowBlur = 0;
    label(ctx, title, I.x + I.w / 2, I.y - 22, C.yellow, 'center', 24);
    ctx.restore();
  }

  // ───────── 結果框 ─────────
  let lastResult = '';
  function setResult(html) {
    if (html === lastResult) return;
    lastResult = html;
    const el = document.getElementById('motorAnimResult'); if (el) el.innerHTML = html;
  }
  function pageStatusResult() {                          // 頁面 drawMotorLessonCanvas 原句
    const { disconnected, sequence } = status;
    return disconnected
      ? (currentLang === 'en'
        ? `<strong class="accent-pink">Power briefly off:</strong> the insulating gap reaches the brushes and inertia carries the armature across.`
        : `<strong class="accent-pink">瞬間斷電：</strong>絕緣縫通過電刷，電樞靠慣性越過死角。`)
      : (currentLang === 'en'
        ? `Terminal current: <strong class="accent-cyan">${sequence}</strong>; the commutator reverses it after each half-turn.`
        : `端點電流：<strong class="accent-cyan">${sequence}</strong>；轉過半圈後，集電環自動換向。`);
  }

  // ───────── 轉角工具 ─────────
  // 由 a0、初速 w0 起，ramp 秒內線性加速到 FULL，之後等速
  function spinUp(a0, w0, ramp, tl) {
    const tr1 = Math.min(tl, ramp), k = (FULL - w0) / ramp;
    return a0 + w0 * tr1 + 0.5 * k * tr1 * tr1 + FULL * Math.max(0, tl - ramp);
  }

  // ═════════ 場景 ═════════
  const SCENES = {
    'anim-torque': {
      steps: [
        { d: 6.5, b: ['水平', 'Horizontal'], ang: () => 0,
          res: () => tr(`線圈呈<strong class="accent-yellow">水平</strong>，<strong class="accent-green">磁場 B</strong> 由 N 極指向 S 極。`,
                        `The coil is <strong class="accent-yellow">horizontal</strong>; <strong class="accent-green">field B</strong> points from N to S.`),
          draw(ctx, tl, a) {
            renderOff(a, false); paste(ctx, 1);
            fieldDots(ctx, tl);
            glowPath(ctx, polyPath(ctx, expand(coilCorners(a), 8)), C.yellow, tl, 5);
            band(ctx, tr('1. 線圈呈水平：固定磁場 B 由 N 極指向 S 極', '1. The coil is horizontal; fixed field B points from N to S'));
          } },
        { d: 7.5, b: ['右側受力', 'Right side'], ang: () => 0,
          res: () => tr(`右側線圈電流<strong class="accent-cyan">朝內</strong>，依右手開掌定則受到<strong class="accent-pink">磁力 F</strong>。`,
                        `Right side: I is <strong class="accent-cyan">inward</strong>, so by the right-hand rule it feels <strong class="accent-pink">force F</strong>.`),
          draw(ctx, tl, a) {
            renderOff(a);
            const q = coilCorners(a);
            focusSide(ctx, q[0], q[1], tl);
            const fwd = status.direction > 0;                 // 頁面：direction>0 ⇒ A→B→C→D
            currentArrow(ctx, fwd ? q[0] : q[1], fwd ? q[1] : q[0], +1, tl);
            band(ctx, tr('2. 右側線圈電流朝內，受到磁力 F（右手開掌定則）', '2. Right side: I is inward, so it feels force F (right-hand rule)'));
          } },
        { d: 7.5, b: ['左側受力', 'Left side'], ang: () => 0,
          res: () => tr(`左側線圈電流<strong class="accent-cyan">朝外</strong>，受力方向與右側<strong class="accent-pink">相反</strong>。`,
                        `Left side: I is <strong class="accent-cyan">outward</strong>, so its force is <strong class="accent-pink">opposite</strong>.`),
          draw(ctx, tl, a) {
            renderOff(a);
            const q = coilCorners(a);
            focusSide(ctx, q[2], q[3], tl);
            const fwd = status.direction > 0;
            currentArrow(ctx, fwd ? q[2] : q[3], fwd ? q[3] : q[2], -1, tl);
            band(ctx, tr('3. 左側線圈電流朝外，受力方向與右側相反', '3. Left side: I is outward, so its force F is opposite'));
          } },
        { d: 7.5, b: ['力矩', 'Torque'], ang: tl => 0.32 * Math.pow(tl / 7.5, 2),
          res: () => tr(`一上一下的力，完美形成了讓線圈<strong class="accent-cyan">逆時針旋轉</strong>的力矩！`,
                        `The force pair creates torque for <strong class="accent-cyan">counterclockwise rotation</strong>!`),
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            torqueArc(ctx, tl, clamp(tl / 0.8, 0, 1));
            band(ctx, tr('4. 一上一下的力，完美形成了讓線圈逆時針旋轉的力矩！', '4. The force pair creates torque for counterclockwise rotation!'));
          } },
        { d: 9, b: ['連續轉動', 'Spin'], ang: tl => spinUp(0.32, 0.64 / 7.5, 2.5, tl),
          res: pageStatusResult,
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            torqueArc(ctx, tl, clamp(1 - tl / 1.5, 0, 1));
            band(ctx, tr('5. 連續轉動：轉過半圈後，集電環自動換向', '5. Continuous rotation: the commutator reverses the current after each half-turn'));
          } }
      ]
    },
    'anim-gap': {
      steps: [
        { d: 7, b: ['轉向垂直', 'Vertical'], ang: tl => lerp(0.80, 1.30, tl / 7),
          res: () => tr(`注意觀察線圈轉至<strong class="accent-yellow">垂直</strong>時，畫面上閃爍的紅字提示！`,
                        `Watch the red warning when the coil reaches <strong class="accent-yellow">vertical</strong>.`),
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            const top = structProject(0, 205, 0), bot = structProject(0, -190, 0);
            ctx.save(); ctx.globalAlpha = clamp(tl / 0.8, 0, 1) * (0.6 + 0.4 * pulse(tl, 3));
            ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
            ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke(); ctx.setLineDash([]);
            label(ctx, tr('垂直', 'vertical'), top.x - 14, top.y - 10, C.yellow, 'right', 24);
            ctx.restore();
            band(ctx, tr('1. 注意看！線圈正轉向垂直面', '1. Watch: the coil turns toward the vertical position'));
          } },
        { d: 8, b: ['缺口', 'Gap'], ang: tl => lerp(1.30, 1.493, tl / 8),
          res: () => tr(`此時電刷剛好接觸到集電環的<strong class="accent-orange">缺口</strong>。`,
                        `The brushes meet the commutator <strong class="accent-orange">insulating gap</strong>.`),
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            inset(ctx, a, tl, clamp(tl / 0.6, 0, 1), tr('局部放大', 'Close-up'), 0);
            band(ctx, tr('2. 此時電刷剛好接觸到集電環的缺口', '2. The brushes meet the commutator insulating gap'));
          } },
        { d: 8, b: ['斷電', 'Power off'], ang: tl => lerp(1.493, 1.60, tl / 8),
          res: pageStatusResult,
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            const off_ = status.disconnected;
            inset(ctx, a, tl, 1, tr('局部放大', 'Close-up'), off_ ? 0.5 + 0.5 * pulse(tl, 9) : 0);
            bandBg(ctx, true);
            if (off_ && (tl % 0.7) < 0.46) label(ctx, '⚠️ 缺口斷電：靠慣性轉過！', 500, 25, C.red, 'center', 28);
            label(ctx, tr('3. 線圈瞬間斷電，受力為零！', '3. The coil is briefly disconnected, so F = 0!'), 500, 61, CHALK, 'center', 23);
          } },
        { d: 7, b: ['慣性', 'Inertia'], ang: tl => lerp(1.60, 1.80, tl / 7),
          res: () => tr(`但因為線圈已經在轉了，它會靠著<strong class="accent-cyan">慣性</strong>衝過這個死角。`,
                        `The moving coil crosses the dead spot by <strong class="accent-cyan">inertia</strong>.`),
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            inset(ctx, a, tl, 1, tr('局部放大', 'Close-up'), status.disconnected ? 0.5 + 0.5 * pulse(tl, 9) : 0);
            torqueArc(ctx, tl, clamp(tl / 0.6, 0, 1), 2.35);   // 收短：不伸進左上放大框
            band(ctx, tr('4. 線圈已經在轉了，靠著慣性衝過這個死角', '4. The moving coil crosses the dead spot by inertia'));
          } },
        { d: 10, b: ['換向', 'Reversal'],
          ang: tl => tl < 4.5 ? lerp(1.80, 2.16, tl / 4.5) : spinUp(2.16, 0.08, 2, tl - 4.5),
          res: pageStatusResult,
          draw(ctx, tl, a) {
            renderOff(a); paste(ctx, 1);
            inset(ctx, a, tl, clamp((4.5 - tl) / 1, 0, 1), tr('集電環左右半部交換', 'Commutator halves swap'), 0);
            band(ctx, tr('5. 衝過後，集電環的左右半部剛好交換，電流反向輸入，受力方向維持不變', '5. After the gap, the commutator halves swap and the current reverses, so the force keeps its direction'));
          } }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false, drawn: false };

  function canvasCtx() { const c = document.getElementById('motorAnimCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }
  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t), st = sc.steps[i], tl = S.t - sc.starts[i];
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    st.draw(ctx, tl, st.ang(tl) % TAU);
    drawProgress(ctx, sc, S.t);
    S.drawn = true;
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(st.res());
  }
  function updateUI() {
    const row = document.getElementById('steps-anim');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-anim'); if (!row) return;
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
  function visible() { const c = document.getElementById('motorAnimCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const paused = !!(MA.ctl && MA.ctl.paused);
    if (S.last && !paused) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    let frozen = paused;
    if (S.t >= sc.total) {
      if (teacher()) { S.t = sc.total - 1e-3; frozen = frozen || S.endFired; if (!S.endFired) { S.endFired = true; MA.ctl.onEnd(); } }
      else { S.t = 0; }
    }
    if (!(frozen && S.drawn)) render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.scene) start(); });

  MA.anim = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'anim-torque';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false; S.drawn = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-anim'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      lastResult = '';
      buildButtons(); S.step = -1; render(); start();
    },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf, status: Object.assign({}, status) }; }
  };
})();
