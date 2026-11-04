/* electric_motor_3_struct_1104_v1.js — 「電動機解剖室」分頁動畫（#motorStructCanvas，邏輯 1000×600）
 *
 * 契約：window.MotorAnim.struct = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 單場景 'motor-struct'（頁面沒有子分頁鈕）。結果框是頁面靜態文字，本檔不改。
 * 依賴頁面現成的（直接呼叫，不複製、不改）：tr、C、TAU、clear、label、drawFlatArrow、
 *   renderMotorAssembly（整台馬達，含場磁鐵、電樞、分裂環、電刷、電源與頁面原有標籤）、
 *   drawReferenceField（第 1 步把 B 畫亮）、structProject（只用來找零件位置，畫強調框與局部放大）。
 * 畫法：每格先把 renderMotorAssembly 畫進一張離屏畫布（同 2000×1200），再合成到 #motorStructCanvas：
 *   淡化層（整張圖 globalAlpha 0.28）→ 被強調的零件用 clip 以原亮度再貼一次 → 發光輪廓、引線、零件名稱。
 *   第 3、4 步另把離屏圖的局部放大貼到右側（小構造要局部放大）。馬達本身的幾何、轉向、電流、受力全照頁面函式。
 *   頂端 0–88 的橫帶改放本步說明（蓋掉頁面 y=64 的「固定磁場 B：N → S」，第 1 步改由本檔原句重畫）。
 * 轉角 a(t)：各步轉速不同（rad/s），由 t 純函式積分；第 5 步 0.72 rad/s ≈ 頁面原本每格 0.012 rad × 60 fps。
 *
 * ── 場景步驟表 motor-struct，共 38.5 s ─────────────────────────
 *   1 場磁鐵      7.5 s  0.30 rad/s  兩側 N／S 磁鐵發亮＋發光框；B 箭頭（drawReferenceField）亮起，綠點由 N 流向 S
 *   2 電樞        7.5 s  0.45 rad/s  showCurrent＋showForces：線圈發亮（電流、A–D、兩側 F 反向），其他淡化
 *   3 集電環      8.0 s  0.72 rad/s  showCurrent：分裂環發亮＋右側局部放大；頁面的電流順序標籤每半圈翻轉，
 *                                     絕緣縫經過電刷的瞬間放大框閃白（本步內切換兩次）
 *   4 電刷        7.5 s  0.50 rad/s  兩座電刷＋電源導線發亮；青點沿導線＋→右電刷、左電刷→−；右電刷接點局部放大，環面滑過電刷
 *   5 合起來轉動  8.0 s  0.72 rad/s  全亮（renderMotorAssembly turns 5、fieldStrength 3）；最後 3.5 s 頂端換成頁面重點句
 * 學生模式最後一步播完自動從第 1 步重播；老師模式（MotorAnim.ctl.onEnd 是函式）停在最後一格並通知一次。
 * 暫停（MotorAnim.ctl.paused）時不重畫（drawCurrentFlow 用 performance.now，重畫會讓電流繼續流）。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;

  const W = 1000, BAND = 88;
  const FONT = "'Noto Sans TC',sans-serif";
  const CHALK = '#f2ecd9';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pulse = (t, k) => 0.5 + 0.5 * Math.sin(t * (k || 4));
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');

  // ───────── 零件位置（與 renderMotorAssembly 內部相同的常數，只用來定位強調框） ─────────
  const RING = { x: 389, y: 415 };                        // structProject(0,0,-265) 附近：分裂環中心
  const INSET = { x: 600, y: 128, w: 364, h: 281 };       // 右側局部放大框
  const SRC_RING = { x: 320, y: 352, w: 140, h: 108 };    // 分裂環放大來源（不含頁面「分裂環」字）
  const SRC_BRUSH = { x: 360, y: 411, w: 116, h: 87 };    // 右電刷接點放大來源（避開「右電刷／Right brush」字）

  function coilCorners(a) {                               // 同頁面 corner3d：W=158、zFront=-188、zBack=208
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
    // 兩行時平均分配，避免第二行只剩一兩個字
    if (out.length === 2 && !wrapLines._inner) {
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
  function band(ctx, text, color, size) {                 // 頂端說明帶（最多兩行）
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, BAND); ctx.restore();
    size = size || 23;
    const lines = wrapLines(ctx, text, 690, size).slice(0, 2);   // 左上筆工具、右上語言鈕會浮在畫布角落：只用中間 x 155–845
    const ys = lines.length > 1 ? [32, 66] : [46];
    lines.forEach((s, k) => label(ctx, s, 500, ys[k], color || CHALK, 'center', size));
  }
  function leader(ctx, x1, y1, x2, y2, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(x2, y2, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function partName(ctx, text, x, y, alpha, size) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    label(ctx, text, x, y, C.yellow, 'center', size || 26);
    ctx.restore();
  }
  function glowPath(ctx, buildPath, col, tl, width) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = width || 4; ctx.lineJoin = 'round';
    ctx.shadowColor = col; ctx.shadowBlur = 10 + 14 * pulse(tl);
    ctx.globalAlpha = 0.55 + 0.45 * pulse(tl);
    ctx.beginPath(); buildPath(); ctx.stroke();
    ctx.restore();
  }

  // ───────── 離屏圖與合成 ─────────
  let off = null, offCtx = null;
  function renderOff(a, opts) {
    if (!off) { off = document.createElement('canvas'); off.width = 2000; off.height = 1200; offCtx = off.getContext('2d'); }
    offCtx.setTransform(2, 0, 0, 2, 0, 0);
    renderMotorAssembly(offCtx, a, Object.assign({ turns: 5, fieldStrength: 3 }, opts || {}));
  }
  function paste(ctx, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(off, 0, 0, 2000, 1200, 0, 0, W, 600); ctx.restore();
  }
  function pasteClip(ctx, buildPath, alpha) {
    ctx.save(); ctx.beginPath(); buildPath(); ctx.clip();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(off, 0, 0, 2000, 1200, 0, 0, W, 600); ctx.restore();
  }
  const rectPath = (ctx, x, y, w, h) => () => ctx.rect(x, y, w, h);
  const polyPath = (ctx, pts) => () => { pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };

  function dimBase(ctx) {
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, 600); ctx.restore();
    paste(ctx, 0.28);
  }
  // 局部放大：src（邏輯座標）→ INSET；flash 0..1 讓外框閃白
  function inset(ctx, src, tl, flash) {
    const I = INSET;
    ctx.save();
    // 來源框與兩條連線
    ctx.strokeStyle = 'rgba(255,243,106,.85)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.strokeRect(src.x, src.y, src.w, src.h);
    ctx.beginPath();
    ctx.moveTo(src.x + src.w, src.y); ctx.lineTo(I.x, I.y);
    ctx.moveTo(src.x + src.w, src.y + src.h); ctx.lineTo(I.x, I.y + I.h);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.canvas; ctx.beginPath(); ctx.roundRect(I.x - 4, I.y - 4, I.w + 8, I.h + 8, 14); ctx.fill();
    ctx.beginPath(); ctx.roundRect(I.x, I.y, I.w, I.h, 10); ctx.clip();
    ctx.drawImage(off, src.x * 2, src.y * 2, src.w * 2, src.h * 2, I.x, I.y, I.w, I.h);
    ctx.restore();
    ctx.save();
    const f = clamp(flash || 0, 0, 1);
    ctx.strokeStyle = f > 0 ? `rgba(255,255,255,${0.5 + 0.5 * f})` : C.yellow;
    ctx.lineWidth = 3 + 4 * f; ctx.shadowColor = f > 0 ? '#ffffff' : C.yellow; ctx.shadowBlur = 8 + 16 * f + 6 * pulse(tl);
    ctx.beginPath(); ctx.roundRect(I.x, I.y, I.w, I.h, 10); ctx.stroke();
    ctx.restore();
  }
  const toInset = (src, x, y) => ({ x: INSET.x + (x - src.x) * INSET.w / src.w, y: INSET.y + (y - src.y) * INSET.h / src.h });
  function insetCaption(ctx, lines, tl) {               // 放大框下方：零件名稱＋一句說明
    let y = INSET.y + INSET.h + 30;
    lines.forEach(([s, col, size]) => {
      wrapLines(ctx, s, INSET.w + 10, size).forEach(l => { label(ctx, l, INSET.x + INSET.w / 2, y, col, 'center', size); y += size * 1.35; });
    });
  }

  // ───────── 第 1 步：B 綠點由 N 流向 S ─────────
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
  // 第 4 步：外部電流沿電源導線（頁面同一組貝茲曲線）：＋→右電刷、左電刷→−
  function bez(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return { x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
             y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y };
  }
  function wireCurrent(ctx, t) {
    const zc = structProject(0, 0, -265);
    const cL = structProject(-52, 0, -265), cR = structProject(52, 0, -265);
    const tL = { x: cL.x - 72 - 10, y: 492 }, tR = { x: cR.x + 72 + 10, y: 492 };
    const neg = { x: 367, y: 536 }, pos = { x: 411, y: 536 };
    const pathR = u => bez(pos, { x: 480, y: 536 }, { x: 565, y: 516 }, tR, u);   // ＋ → 右電刷端子
    const pathL = u => bez(tL, { x: 270, y: 518 }, { x: 330, y: 536 }, neg, u);   // 左電刷端子 → −
    ctx.save(); ctx.fillStyle = C.cyan; ctx.shadowColor = C.cyan; ctx.shadowBlur = 12;
    for (let j = 0; j < 4; j++) {
      const u = ((t * 0.45) + j / 4) % 1;
      [pathR(u), pathL(u)].forEach(p => { ctx.globalAlpha = Math.min(1, u * 6, (1 - u) * 6); ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, TAU); ctx.fill(); });
    }
    ctx.restore();
    return { zc, cL, cR };
  }

  // ───────── 轉角 a(t) ─────────
  const A0 = 0.16;
  function angleAt(sc, t) {
    let a = A0, i = 0;
    while (i < sc.steps.length) {
      const st = sc.steps[i], s0 = sc.starts[i];
      if (t < s0 + st.d || i === sc.steps.length - 1) { a += st.w * clamp(t - s0, 0, st.d); break; }
      a += st.w * st.d; i++;
    }
    return a % TAU;
  }

  // ═════════ 場景 ═════════
  const SCENES = {
    'motor-struct': {
      steps: [
        { d: 7.5, w: 0.30, b: ['場磁鐵', 'Magnets'],
          draw(ctx, tl, a) {
            renderOff(a);
            dimBase(ctx);
            pasteClip(ctx, rectPath(ctx, 40, 112, 200, 345));
            pasteClip(ctx, rectPath(ctx, 785, 112, 200, 345));
            ctx.save(); ctx.beginPath(); ctx.rect(0, BAND, W, 600 - BAND); ctx.clip();
            drawReferenceField(ctx, 3);              // 它在 y=64 的標題落在說明帶內，被裁掉
            ctx.restore();
            fieldDots(ctx, tl);
            glowPath(ctx, () => { ctx.roundRect(55, 155, 145, 285, 12); ctx.roundRect(800, 155, 145, 285, 12); }, C.yellow, tl, 4);
            band(ctx, tr('1. 場磁鐵：固定在兩側的外加磁鐵，負責提供穩定、均勻的磁場 (B)。', '1. Field magnets: fixed magnets that provide a stable, uniform field B.'));
            const al = clamp(tl / 0.8, 0, 1);
            partName(ctx, tr('場磁鐵', 'Field magnets'), 140, 108, al);
            partName(ctx, tr('場磁鐵', 'Field magnets'), 870, 108, al);
          } },
        { d: 7.5, w: 0.45, b: ['電樞', 'Armature'],
          draw(ctx, tl, a) {
            renderOff(a, { showCurrent: true, showForces: true });
            dimBase(ctx);
            const q = coilCorners(a), qe = expand(q, 50);
            glowPath(ctx, polyPath(ctx, expand(q, 6)), C.yellow, tl, 14);
            pasteClip(ctx, polyPath(ctx, qe));
            q.forEach(p => {                                  // 頁面 A–D 角標（角點沿中心方向外推 28）
              const dx = p.x - 500, dy = p.y - 320, L = Math.hypot(dx, dy) || 1;
              pasteClip(ctx, () => ctx.arc(p.x + dx / L * 28, p.y + dy / L * 28, 24, 0, TAU));
            });
            // 兩側 F 箭頭與頁面「電流」標籤區也保持原亮度
            [[q[0], q[1]], [q[2], q[3]]].forEach(([p, r]) => {
              const m = { x: (p.x + r.x) / 2, y: (p.y + r.y) / 2 };
              pasteClip(ctx, rectPath(ctx, m.x - 24, m.y - 110, 80, 220));
            });
            pasteClip(ctx, rectPath(ctx, 250, 88, 500, 56));
            band(ctx, tr('2. 電樞 (線圈)：通電後左右兩邊會受到反向的磁力，產生旋轉力矩', '2. Armature (coil): opposite forces on its sides create torque'));
            const L = { x: 690, y: 505 };
            const tgt = q.slice().sort((u, v) => Math.hypot(u.x - L.x, u.y - L.y) - Math.hypot(v.x - L.x, v.y - L.y))[0];
            const al = clamp(tl / 0.8, 0, 1);
            leader(ctx, L.x - 10, L.y - 20, tgt.x, tgt.y, al);
            partName(ctx, tr('電樞 (線圈)', 'Armature (coil)'), L.x, L.y, al);
          } },
        { d: 8, w: 0.72, b: ['集電環', 'Commutator'],
          draw(ctx, tl, a) {
            renderOff(a, { showCurrent: true });
            dimBase(ctx);
            pasteClip(ctx, polyPath(ctx, expand(coilCorners(a), 50)), 0.5);
            pasteClip(ctx, () => ctx.arc(RING.x, RING.y - 6, 70, 0, TAU));
            pasteClip(ctx, rectPath(ctx, 250, 88, 500, 56));
            glowPath(ctx, () => ctx.arc(RING.x, RING.y - 6, 70, 0, TAU), C.orange, tl, 3);
            const flash = clamp(1 - Math.abs(Math.cos(a)) / 0.2, 0, 1);   // 絕緣縫經過電刷（|cos a| 小）
            inset(ctx, SRC_RING, tl, flash);
            band(ctx, tr('3. 集電環 (半圓形)：它隨線圈轉動，每半圈會切換一次輸入線圈的電流方向。', '3. Split-ring commutator: It rotates with the coil and reverses current every half-turn.'));
            insetCaption(ctx, [[tr('集電環 (半圓形)', 'Split-ring commutator'), C.yellow, 26],
                               ...(currentLang === 'en' ? [] : [['分裂環', C.orange, 23]])], tl);
          } },
        { d: 7.5, w: 0.50, b: ['電刷', 'Brushes'],
          draw(ctx, tl, a) {
            renderOff(a);
            dimBase(ctx);
            pasteClip(ctx, rectPath(ctx, 236, 385, 120, 123));
            pasteClip(ctx, rectPath(ctx, 425, 404, 116, 104));
            pasteClip(ctx, rectPath(ctx, 250, 506, 330, 52), 0.85);
            glowPath(ctx, () => { ctx.roundRect(236, 385, 120, 123, 10); ctx.roundRect(425, 404, 116, 104, 10); }, C.yellow, tl, 3);
            const P = wireCurrent(ctx, tl);
            // 放大框：右電刷接點，環面滑過電刷（短弧線沿旋轉方向移動）
            inset(ctx, SRC_BRUSH, tl, 0);
            const ci = toInset(SRC_BRUSH, P.cR.x, P.cR.y), cc = toInset(SRC_BRUSH, RING.x, RING.y);
            ctx.save();
            ctx.beginPath(); ctx.roundRect(INSET.x, INSET.y, INSET.w, INSET.h, 10); ctx.clip();
            const R = Math.hypot(ci.x - cc.x, ci.y - cc.y) - 8, base = Math.atan2(ci.y - cc.y, ci.x - cc.x);
            ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            for (let j = 0; j < 3; j++) {
              const ph = ((tl * 0.9 + j / 3) % 1);
              const ang = base + 0.9 - ph * 1.8;          // 逆時針（畫面上由下往上掠過接點）
              ctx.globalAlpha = Math.min(1, ph * 4, (1 - ph) * 4) * 0.8;
              ctx.beginPath(); ctx.arc(cc.x, cc.y, R, ang - 0.12, ang + 0.12); ctx.stroke();
            }
            ctx.globalAlpha = 0.6 + 0.4 * pulse(tl, 7);
            ctx.fillStyle = C.yellow; ctx.shadowColor = C.yellow; ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(ci.x, ci.y, 9, 0, TAU); ctx.fill();
            ctx.restore();
            band(ctx, tr('4. 電刷：固定不動的石墨塊，負責將外部電源的電流「輕輕刷」進旋轉中的集電環。', '4. Brushes: stationary graphite contacts that feed current into the rotating commutator.'));
            insetCaption(ctx, [[tr('電刷', 'Brushes'), C.yellow, 26],
                               [tr('固定不動的石墨塊', 'stationary graphite contacts'), CHALK, 23]], tl);
          } },
        { d: 8, w: 0.72, b: ['一起轉', 'Together'],
          draw(ctx, tl, a) {
            renderOff(a);
            ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, 600); ctx.restore();
            paste(ctx, 1);
            const al = clamp(tl / 0.8, 0, 1) * (tl < 4.5 ? 1 : clamp((5.1 - tl) / 0.6, 0, 1));
            if (al > 0) {
              partName(ctx, tr('場磁鐵', 'Field magnets'), 140, 108, al);
              partName(ctx, tr('場磁鐵', 'Field magnets'), 870, 108, al);
              const q = coilCorners(a), L = { x: 690, y: 505 };
              const tgt = q.slice().sort((u, v) => Math.hypot(u.x - L.x, u.y - L.y) - Math.hypot(v.x - L.x, v.y - L.y))[0];
              leader(ctx, L.x - 10, L.y - 20, tgt.x, tgt.y, al);
              partName(ctx, tr('電樞 (線圈)', 'Armature (coil)'), L.x, L.y, al);
            }
            if (tl < 4.5) {
              band(ctx, tr('馬達就是把「電能」轉換成「動能（旋轉）」的機器', 'A motor converts electrical energy into rotational kinetic energy.'));
            } else {
              const k = clamp((tl - 4.5) / 0.5, 0, 1);
              ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, BAND); ctx.restore();
              ctx.save(); ctx.globalAlpha = k;
              ctx.fillStyle = 'rgba(85,233,255,0.10)'; ctx.fillRect(140, 8, 720, BAND - 10);
              ctx.fillStyle = C.cyan; ctx.fillRect(140, 8, 6, BAND - 10);
              const s = tr('記住！如果沒有切成兩半的集電環，馬達轉了半圈就會卡死在原地來回震盪！', 'Without a split ring, the motor stalls and rocks back and forth after half a turn.');
              const lines = wrapLines(ctx, s, 690, 24).slice(0, 2), ys = lines.length > 1 ? [31, 63] : [47];
              lines.forEach((l, j) => label(ctx, l, 500, ys[j], C.white, 'center', 24));
              ctx.restore();
            }
          } }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false, drawn: false };

  function canvasCtx() { const c = document.getElementById('motorStructCanvas'); return c ? c.getContext('2d') : null; }
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
    st.draw(ctx, tl, angleAt(sc, S.t));
    drawProgress(ctx, sc, S.t);
    S.drawn = true;
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function updateUI() {
    const row = document.getElementById('steps-struct');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-struct'); if (!row) return;
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
  function visible() { const c = document.getElementById('motorStructCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  MA.struct = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'motor-struct';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false; S.drawn = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-struct'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
