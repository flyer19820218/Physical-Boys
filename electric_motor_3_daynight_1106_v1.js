/* electric_motor_3_daynight_1106_v1.js — 「開掌定則實例」分頁的第四個場景：補充——白天的極光去哪了？（共用 #forceExamplesCanvas，邏輯 1000×600）
 *
 * 接在「補充：美麗的極光」（electric_motor_3_aurora_1105_v1.js）後面。對象：高一資優生。
 * 重點：極光整天都在、固定朝著太陽；白天看不到是因為天空太亮；夜側特別亮是因為磁尾重連。
 * 重連用「有張力的橡皮筋」講：兩條方向相反的磁力線在交界處剪斷、交叉重接，新接的磁力線變短、彈開。
 *
 * 契約：window.MotorAnim.daynight = { activate('example-daynight'), deactivate(), relang(), _info(), _state(), _frameAt() }
 * 由 electric_motor_3_force_1104_v1.js 在收到場景 id 'example-daynight' 時轉交；步驟鈕寫進 #steps-force，說明寫進 #forceExampleResult。
 * 播放（AGENTS 10.6／10.7）：
 *   學生模式（MotorAnim.ctl.onEnd 不是函式）：進場播第 1 步，播到該步結尾停在最後一格（下一步開始前 1e-3 s）；按步驟鈕＝從該步開頭播、播完停住。
 *   老師模式（onEnd 是函式）：從頭連續播到總結尾，停住並通知 onEnd 一次。MotorAnim.ctl.paused 為 true 時時間凍結（兩種模式都一樣）。
 *   畫面是時間 t 的純函式；動畫迴圈只有一條，document.hidden 或畫布不可見就停，回來重啟。
 * 依賴頁面現成的：tr、C、TAU、clear、label、currentLang；進度條用 assets/anim_progress_bar_1105_v1.js 的 AnimBar.draw。
 * 地球影像：NASA Blue Marble Next Generation，assets/magnetism_1/earth_blue_marble_2048_v1.jpg，正射投影成北極上空視角
 *   （bakeGlobe 與俯視圖、極光橢圓的畫法由 electric_motor_3_aurora_1105_v1.js 第 5 步複製改用）。
 * 示意圖：比例、亮度都不是真的；畫面上的數字只有 0°、−12°、−18°、12°～18°、20–30 個地球半徑。
 *
 * ── 場景步驟表（共 66 s）────────────────────────────────────────
 *   1 整天發光 13 s 北極上空俯視：地球逆時針慢轉，極光橢圓環不動、略偏夜側，夜側較亮較粗
 *   2 地球自轉 13 s 同視角，地球加速轉（一天約 8 s）；高緯觀測者經過正午→日落→午夜→日出，夜側頭上有極光時「看得見」
 *   3 天空太亮 13 s 地面視角：太陽高度角由高往下掃到 −18°，天空漸暗；天空亮度 vs 極光亮度長條對照
 *   4 日側重連 13 s 正午—午夜子午面側視：朝南的太陽風磁場與朝北的地磁在向日面重連、彈開、被拖往夜側；粒子由極尖區灌入；小俯視圖日側偏紅
 *   5 夜側重連 14 s 鏡頭拉向夜側：磁尾拉長、磁能上升；磁尾 X 點重連，靠地球的磁力線彈回，粒子射向夜側極區；最後 3 秒因果鏈
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, ORANGE = C.orange, RED = C.poleN;
  const CHALK = '#f2ecd9', MUTED = C.muted;
  const EARTH_FILL = '#2f87a9', LAND = '#6a8f5d';
  const LINE_RGB = '85,233,255';                   // 地磁場線：青
  const IMF_RGB = '255,179,71';                    // 太陽風帶來的磁力線：橘（與「太陽風」標籤同色）
  const AUR = { r: '255,77,120', g: '93,255,150', b: '176,140,255' };
  const AUR_R = `rgb(${AUR.r})`, AUR_G = `rgb(${AUR.g})`;
  const PANEL = 'rgba(12,30,25,0.9)';

  // ───────── 小工具（同極光檔） ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const easeOut = k => { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const DEG = Math.PI / 180;
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
  function particle(ctx, x, y, a = 1, r = 5) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,243,106,0.3)'; ctx.beginPath(); ctx.arc(x, y, r * 2.3, 0, TAU); ctx.fill();
    ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function fadeIn(ctx, a) { if (a <= 0) return; ctx.save(); ctx.fillStyle = `rgba(12,30,25,${a})`; ctx.fillRect(0, 30, W, H - 30); ctx.restore(); }
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
  // 折線工具：累積長度、沿線取點
  function mkPoly(pts) {
    const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, s, len: s[s.length - 1] };
  }
  function polyAt(p, d) {
    d = clamp(d, 0, p.len); let i = 1; while (i < p.s.length - 1 && p.s[i] < d) i++;
    const a = p.pts[i - 1], b = p.pts[i], k = (d - p.s[i - 1]) / Math.max(1e-6, p.s[i] - p.s[i - 1]);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
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
  const mirrorY = (pts, cy) => pts.map(p => [p[0], 2 * cy - p[1]]);
  // 磁力線：線＋沿線箭頭（frac 處，dir=+1 沿點列方向，-1 反向）
  function fieldLine(ctx, pts, rgb, a, w = 3, arrows = [], dash = []) {
    if (a <= 0 || pts.length < 2) return;
    ctx.save(); ctx.globalAlpha = a; line(ctx, pts, `rgba(${rgb},0.9)`, w, dash);
    const p = mkPoly(pts);
    for (const [f, dir] of arrows) { const [x, y, ang] = polyAt(p, p.len * f); arrowHead(ctx, x, y, dir > 0 ? ang : ang + Math.PI, `rgb(${rgb})`, 10); }
    ctx.restore();
  }

  // ───────── 真實地球（NASA Blue Marble；同極光檔 bakeGlobe，一次烘焙）─────────
  const TOP = { x: 380, y: 300, r: 180 };                       // 第 1、2 步的俯視地球
  const OVC = { x: TOP.x + 22, y: TOP.y }, OVR = 78;            // 極光橢圓：中心比極點略偏夜側（右）
  const TEX = { ready: false, data: null, w: 2048, h: 1024, top: null };
  (function loadTex() {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = TEX.w; c.height = TEX.h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, TEX.w, TEX.h);
        TEX.data = x.getImageData(0, 0, TEX.w, TEX.h).data;
        TEX.top = bakeGlobe(TOP.r * 2, 90, 74);   // 北極上空視角
        TEX.data = null; TEX.ready = true;
        if (S.scene) render();
      } catch (e) { TEX.ready = false; }
    };
    im.src = 'assets/magnetism_1/earth_blue_marble_2048_v1.jpg';
  })();
  function bakeGlobe(r, lat0d, lon0d) {
    const SS = 2, N = r * SS, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), out = x.createImageData(N, N), o = out.data, d = TEX.data;
    const p0 = lat0d * Math.PI / 180, sp = Math.sin(p0), cp = Math.cos(p0), l0 = lon0d * Math.PI / 180;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const X = (i + 0.5) / N * 2 - 1, Y = 1 - (j + 0.5) / N * 2, rr = X * X + Y * Y;
      if (rr > 1) continue;
      const Z = Math.sqrt(1 - rr);
      const lat = Math.asin(Math.max(-1, Math.min(1, Y * cp + Z * sp)));
      let lon = l0 + Math.atan2(X, Z * cp - Y * sp);
      let u = (lon / Math.PI + 1) / 2; u -= Math.floor(u);
      const v = 0.5 - lat / Math.PI;
      const tx = Math.min(TEX.w - 1, Math.floor(u * TEX.w)), ty = Math.min(TEX.h - 1, Math.floor(v * TEX.h)), k = (ty * TEX.w + tx) * 4;
      const sh = 1.14 * (0.62 + 0.38 * Math.pow(Z, 0.55));
      const e = Math.sqrt(rr), a = e > 0.985 ? Math.max(0, (1 - e) / 0.015) : 1;
      const q = (j * N + i) * 4;
      o[q] = Math.min(255, d[k] * sh); o[q + 1] = Math.min(255, d[k + 1] * sh); o[q + 2] = Math.min(255, d[k + 2] * sh); o[q + 3] = 255 * a;
    }
    x.putImageData(out, 0, 0);
    return c;
  }
  // 俯視北極：地球圓盤（rot＝地球已轉的角度，俯視為逆時針，所以畫布上轉 -rot）、夜側加暗
  function topDisk(ctx, cx, cy, r, rot, night) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = EARTH_FILL; ctx.fill(); ctx.clip();
    if (TEX.ready) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-rot); ctx.drawImage(TEX.top, -r, -r, r * 2, r * 2); ctx.restore(); }
    const ng = ctx.createLinearGradient(cx - r * 0.07, 0, cx + r * 0.07, 0);           // 晨昏線（太陽在左，夜側在右）
    ng.addColorStop(0, 'rgba(8,20,30,0)'); ng.addColorStop(1, `rgba(8,20,30,${night})`);
    ctx.fillStyle = ng; ctx.fillRect(cx - r * 0.07, cy - r, r * 1.1, r * 2);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = CYAN; ctx.lineWidth = r > 100 ? 4 : 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 極光橢圓（同極光檔 auroraRing，改成：夜側較亮、較粗，日側較細；dayRed＝日側一段偏紅）
  const RING_N = 96;
  function ovalR(th, R, t) { return R * (1 + 0.035 * Math.sin(3 * th + t * 1.4) + 0.015 * Math.sin(5 * th - t * 2.1)); }
  function auroraRing(ctx, cx, cy, R, t, a, o = {}) {
    if (a <= 0) return;
    const k = o.scale || 1, dayRed = o.dayRed || 0, nightBoost = o.nightBoost || 0, dance = o.dance || 0;
    const P = [];
    for (let i = 0; i <= RING_N; i++) { const th = i / RING_N * TAU, r = ovalR(th, R, t); P.push([cx + r * Math.cos(th), cy + r * Math.sin(th), th, r]); }
    const nightW = th => 0.25 + 0.75 * Math.max(0, Math.cos(th));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.lineWidth = 3 * k;
    for (let i = 0; i < RING_N; i += 2) {
      const [x, y, th] = P[i], n = nightW(th);
      const len = (12 + 14 * (0.5 + 0.5 * Math.sin(i * 1.7 + t * 3))) * k * (0.5 + 0.6 * n);
      ctx.globalAlpha = a * 0.35 * n * (1 + nightBoost); ctx.strokeStyle = AUR_G;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(th) * len, y + Math.sin(th) * len); ctx.stroke();
    }
    const layers = [[40, 0.05, AUR_R], [30, 0.1, AUR_G], [16, 0.22, AUR_G], [7, 0.55, AUR_G], [2.5, 0.75, '#d9ffe6']];
    for (const [lw, la, col] of layers) {
      ctx.strokeStyle = col;
      for (let i = 0; i < RING_N; i++) {
        const n = nightW(P[i][2]);
        ctx.lineWidth = lw * k * (0.45 + 0.55 * n);
        ctx.globalAlpha = Math.min(1, a * la * n * (1 + nightBoost * n) * (0.85 + 0.15 * Math.sin(i * 0.7 - t * 2.5)));
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke();
      }
    }
    if (dayRed > 0) {                                  // 日側（左）一段：偏紅、較弱
      for (const [lw, la] of [[22, 0.25], [10, 0.5], [4, 0.8]]) {
        ctx.lineWidth = lw * k; ctx.strokeStyle = AUR_R;
        for (let i = 0; i < RING_N; i++) {
          const w = Math.max(0, -Math.cos(P[i][2]) - 0.55) / 0.45; if (w <= 0) continue;
          ctx.globalAlpha = dayRed * la * w * (0.8 + 0.2 * Math.sin(i * 0.9 + t * 2));
          ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke();
        }
      }
    }
    if (dance > 0) {                                   // 次暴：夜側出現跳動的亮弧
      for (let j = 0; j < 3; j++) {
        const off = (j - 1) * 7 * k, ph = t * (3 + j) + j * 2;
        ctx.strokeStyle = j === 1 ? '#e8fff0' : AUR_G; ctx.lineWidth = (j === 1 ? 4 : 6) * k;
        for (let i = 0; i < RING_N; i++) {
          const th = P[i][2], n = Math.max(0, Math.cos(th) - 0.3) / 0.7; if (n <= 0) continue;
          const flick = 0.5 + 0.5 * Math.sin(th * 9 + ph);
          ctx.globalAlpha = dance * n * flick * 0.8;
          const r0 = P[i][3] + off + 4 * k * Math.sin(th * 6 - ph), r1 = P[i + 1][3] + off + 4 * k * Math.sin(P[i + 1][2] * 6 - ph);
          ctx.beginPath(); ctx.moveTo(cx + r0 * Math.cos(th), cy + r0 * Math.sin(th));
          ctx.lineTo(cx + r1 * Math.cos(P[i + 1][2]), cy + r1 * Math.sin(P[i + 1][2])); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  function poleCross(ctx, x, y, s = 10) { line(ctx, [[x - s, y], [x + s, y]], CHALK, 3); line(ctx, [[x, y - s], [x, y + s]], CHALK, 3); }
  // 太陽（畫布左外）與陽光箭頭
  function drawSun(ctx, a, cy = 300) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(-150, cy, 60, -150, cy, 220);
    g.addColorStop(0, '#fff7c2'); g.addColorStop(0.75, '#ffcf4a'); g.addColorStop(0.88, 'rgba(255,170,60,0.55)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-150, cy, 220, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 小俯視圖（第 4、5 步左下角）
  const MINI = { x: 100, y: 442, r: 54 };
  function miniTop(ctx, t, o) {
    topDisk(ctx, MINI.x, MINI.y, MINI.r, 0.6, 0.55);
    auroraRing(ctx, MINI.x + 22 * MINI.r / TOP.r * 1.3, MINI.y, OVR * MINI.r / TOP.r * 1.3, t, o.base, { scale: 0.45, dayRed: o.dayRed, nightBoost: o.nightBoost, dance: o.dance });
    poleCross(ctx, MINI.x, MINI.y, 5);
    tag(ctx, tr('俯視', 'Top view'), MINI.x, MINI.y - MINI.r - 20, CHALK, 1, 22, 'center', false);
  }

  // ═════════ 第 1、2 步：北極上空俯視 ═════════
  const ROT1 = 0.09;                                  // 第 1 步自轉角速度（rad/s，示意）
  const ROT1_END = ROT1 * 13;
  const OBS_R = 100;                                  // 觀測者離極點的距離＝夜側橢圓環的位置
  function sunRays(ctx, a, ys) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    for (const y of ys) arrow(ctx, 22, y, 150, y, YELLOW, 4, 13);
    ctx.restore();
  }
  function spinArrow(ctx, a) {                        // 地球自轉方向（俯視逆時針）
    if (a <= 0) return;
    const R = TOP.r + 18, a0 = -0.12 * Math.PI, a1 = -0.40 * Math.PI;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = CHALK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(TOP.x, TOP.y, R, a0, a1 + 0.05, true); ctx.stroke();
    arrowHead(ctx, TOP.x + R * Math.cos(a1), TOP.y + R * Math.sin(a1), Math.atan2(-Math.cos(a1), Math.sin(a1)), CHALK, 13);
    ctx.restore();
  }
  function meridian(ctx, rot, a) {                     // 跟著地球轉的經線（讓學生看見地球在轉）
    if (a <= 0) return;
    const ang = 0.9 - rot;
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, [[TOP.x, TOP.y], [TOP.x + TOP.r * Math.cos(ang), TOP.y + TOP.r * Math.sin(ang)]], 'rgba(242,236,217,0.8)', 3, [10, 8]);
    ctx.restore();
  }
  function step1(ctx, tl) {
    const rot = ROT1 * tl;
    drawSun(ctx, 0.85);
    sunRays(ctx, seg(tl, 0.2, 0.8), [150, 220, 380, 450]);
    tag(ctx, tr('陽光 →', 'Sunlight →'), 92, 300, YELLOW, seg(tl, 0.3, 0.8), 22);
    topDisk(ctx, TOP.x, TOP.y, TOP.r, rot, 0.55);
    meridian(ctx, rot, seg(tl, 0.6, 1.2));
    auroraRing(ctx, OVC.x, OVC.y, OVR, tl, seg(tl, 0.8, 2.2));
    poleCross(ctx, TOP.x, TOP.y);
    spinArrow(ctx, seg(tl, 3.0, 3.6));
    tag(ctx, tr('日側', 'Dayside'), TOP.x - 105, TOP.y - 128, YELLOW, seg(tl, 1.2, 1.7), 24);
    tag(ctx, tr('夜側', 'Nightside'), TOP.x + 105, TOP.y - 128, CHALK, seg(tl, 1.2, 1.7), 24);
    // 右側說明
    const la = seg(tl, 2.2, 2.7);
    if (la > 0) {
      ctx.save(); ctx.globalAlpha = la;
      line(ctx, [[OVC.x + OVR * 0.72, OVC.y - OVR * 0.72], [636, 168]], 'rgba(93,255,150,0.8)', 2, [6, 5]);
      ctx.restore();
    }
    tag(ctx, tr('極光橢圓帶', 'Auroral oval'), 640, 168, AUR_G, la, 24, 'left');
    tag(ctx, tr('地球在轉', 'The Earth turns'), 640, 248, CHALK, seg(tl, 3.2, 3.7), 24, 'left', false);
    tag(ctx, tr('橢圓環不動', 'The oval stays put'), 640, 312, AUR_G, seg(tl, 4.4, 4.9), 24, 'left', false);
    tag(ctx, tr('夜側較亮、較粗', 'Night side: brighter, wider'), 640, 410, CHALK, seg(tl, 7.0, 7.5), 24, 'left', false);
    topMsg(ctx, tr('從北極上空往下看：極光橢圓環一直都在', 'Looking down on the North Pole: the auroral oval is always there'), CHALK);
    botMsg(ctx, tl < 6.8 ? tr('橢圓環固定朝著太陽，不跟著地球轉', 'The oval stays fixed toward the Sun; it does not turn with the Earth')
      : tr('夜側那一半比較亮、比較粗', 'The night half is brighter and wider'),
    tl < 6.8 ? YELLOW : AUR_G, tl < 6.8 ? seg(tl, 4.6, 5.1) : seg(tl, 6.8, 7.3));
  }
  // 第 2 步：地球轉一天半（約 8 s 一天），觀測者從正午出發、最後停在午夜（夜側極光帶下方）
  function obsAt(tl) {
    const f = easeIO(seg(tl, 1.0, 12.4));
    const turn = 1.5 * TAU * f;
    return { rot: ROT1_END + turn, ang: Math.PI - turn };
  }
  const LT = [[Math.PI, '正午', 'Noon'], [Math.PI / 2, '日落', 'Sunset'], [0, '午夜', 'Midnight'], [-Math.PI / 2, '日出', 'Sunrise']];
  function step2(ctx, tl) {
    const { rot, ang } = obsAt(tl);
    drawSun(ctx, 0.85);
    sunRays(ctx, 1, [150, 220, 380, 450]);
    topDisk(ctx, TOP.x, TOP.y, TOP.r, rot, lerp(0.55, 0.72, seg(tl, 0, 1)));
    meridian(ctx, rot, 1);
    auroraRing(ctx, OVC.x, OVC.y, OVR, tl + 13, 1);
    poleCross(ctx, TOP.x, TOP.y);
    spinArrow(ctx, 1);
    // 觀測者
    const ox = TOP.x + OBS_R * Math.cos(ang), oy = TOP.y + OBS_R * Math.sin(ang);
    const ca = Math.cos(ang), night = ca > 0.12;
    const thO = Math.atan2(oy - OVC.y, ox - OVC.x), dO = Math.hypot(ox - OVC.x, oy - OVC.y);
    const under = night && Math.abs(dO - ovalR(thO, OVR, tl + 13)) < 12;
    const oa = seg(tl, 0.2, 0.7);
    if (oa > 0) {
      ctx.save(); ctx.globalAlpha = oa;
      ctx.fillStyle = PANEL; ctx.beginPath(); ctx.arc(ox, oy, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = ORANGE; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ox, oy, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (under) glowRing(ctx, ox, oy, 20, AUR_G, 0.9);
    }
    // 本地時間（固定在「太陽—地球」方向上）
    let best = 0, bd = 9;
    LT.forEach(([a], k) => { const d = Math.abs(Math.atan2(Math.sin(ang - a), Math.cos(ang - a))); if (d < bd) { bd = d; best = k; } });
    const lta = seg(tl, 0.4, 0.9);
    const pos = [[150, TOP.y, 'center'], [TOP.x, TOP.y + TOP.r + 18, 'center'], [TOP.x + TOP.r + 14, TOP.y, 'left'], [TOP.x, TOP.y - TOP.r - 18, 'center']];
    LT.forEach(([, zh, en], k) => {
      const hot = k === best && bd < Math.PI / 4;
      tag(ctx, tr(zh, en), pos[k][0], pos[k][1], hot ? YELLOW : CHALK, lta * (hot ? 1 : 0.7), 22, pos[k][2], hot);
    });
    // 右側：觀測者、本地時間、天空狀態
    const pa = seg(tl, 0.4, 0.9);
    if (pa > 0) {
      ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = ORANGE; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(652, 140, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      tag(ctx, tr('觀測者（高緯度）', 'Observer (high latitude)'), 668, 140, ORANGE, pa, 22, 'left', false);
      const lt = LT[best];
      tag(ctx, tr('本地時間：', 'Local time: ') + tr(lt[1], lt[2]), 640, 200, CHALK, pa, 22, 'left', false);
    }
    const st = !night ? [tr('天空亮', 'Sky bright'), YELLOW] : under ? [tr('天空暗：看得見', 'Sky dark: visible!'), AUR_G] : [tr('天空暗', 'Sky dark'), CHALK];
    tag(ctx, st[0], 640, 418, st[1], seg(tl, 1.0, 1.4), 28, 'left');
    topMsg(ctx, tr('地球自轉：觀測者每天轉過夜側的極光帶一次', 'The Earth spins: the observer passes under the night-side oval daily'), CHALK);
    botMsg(ctx, tr('橢圓環不動，地球帶著觀測者在它下面轉', 'The oval stays put; the Earth carries the observer beneath it'), CYAN, seg(tl, 1.5, 2.0));
  }

  // ═════════ 第 3 步：地面視角，天空亮度 vs 極光亮度 ═════════
  const SKY = { x0: 30, x1: 600, y0: 92, h0: 290, y1: 505 }, KDEG = 6, AXX = 575;
  const elevAt = tl => lerp(30, -18, easeIO(seg(tl, 1.0, 11.0)));
  const elevY = e => SKY.h0 - e * KDEG;
  // 定性的「對數感」天空亮度（0..1，只用來畫長條；不是真實數值）
  function skyFrac(e) {
    const P = [[30, 0.97], [0, 0.86], [-6, 0.7], [-12, 0.47], [-18, 0.1]];
    if (e >= 30) return P[0][1];
    for (let i = 1; i < P.length; i++) if (e >= P[i][0]) { const k = (e - P[i][0]) / (P[i - 1][0] - P[i][0]); return lerp(P[i][1], P[i - 1][1], k); }
    return P[P.length - 1][1];
  }
  const AUR_FRAC = 0.42;
  function mixC(a, b, k) { return a.map((v, i) => Math.round(lerp(v, b[i], k))); }
  function skyCols(e) {   // [頂, 地平線]
    const K = [[30, [74, 150, 214], [168, 210, 236]], [6, [62, 128, 196], [196, 200, 190]], [0, [48, 92, 150], [232, 150, 92]],
      [-6, [30, 52, 96], [120, 84, 112]], [-12, [16, 30, 56], [40, 48, 78]], [-18, [10, 22, 34], [16, 30, 44]]];
    if (e >= K[0][0]) return [K[0][1], K[0][2]];
    for (let i = 1; i < K.length; i++) if (e >= K[i][0]) { const k = (e - K[i][0]) / (K[i - 1][0] - K[i][0]); return [mixC(K[i][1], K[i - 1][1], k), mixC(K[i][2], K[i - 1][2], k)]; }
    return [K[K.length - 1][1], K[K.length - 1][2]];
  }
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  function curtain(ctx, t, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (let x = 72; x <= 392; x += 4) {
      const u = (x - 72) / 320, side = Math.sin(Math.PI * u);
      const base = 262 + 10 * Math.sin(u * 7 + t * 0.9);
      const ray = 0.55 + 0.25 * Math.sin(x * 0.21 + 1.3) + 0.2 * Math.sin(x * 0.057 + t * 0.7);
      const top = base - (70 + 70 * ray) * (0.5 + 0.5 * side);
      const g = ctx.createLinearGradient(0, base, 0, top - 30);
      g.addColorStop(0, `rgba(${AUR.g},${0.95 * side})`); g.addColorStop(0.65, `rgba(${AUR.g},${0.45 * side})`);
      g.addColorStop(0.85, `rgba(${AUR.r},${0.3 * side})`); g.addColorStop(1, `rgba(${AUR.r},0)`);
      ctx.strokeStyle = g; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, top - 30); ctx.stroke();
    }
    ctx.restore();
  }
  function ground(ctx) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(SKY.x0, SKY.h0);
    for (let x = SKY.x0; x <= SKY.x1; x += 10) ctx.lineTo(x, SKY.h0 - 8 - 8 * Math.sin(x * 0.02) - 5 * Math.sin(x * 0.051 + 1));
    ctx.lineTo(SKY.x1, SKY.y1); ctx.lineTo(SKY.x0, SKY.y1); ctx.closePath();
    ctx.fillStyle = '#163328'; ctx.fill(); ctx.strokeStyle = LAND; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    // 觀測者（小人）
    const px = 110, py = SKY.h0 - 18;
    ctx.save(); ctx.strokeStyle = CHALK; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(px, py - 34, 6, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py - 28); ctx.lineTo(px, py - 10); ctx.moveTo(px, py - 10); ctx.lineTo(px - 7, py + 4);
    ctx.moveTo(px, py - 10); ctx.lineTo(px + 7, py + 4); ctx.moveTo(px, py - 22); ctx.lineTo(px + 10, py - 30); ctx.stroke(); ctx.restore();
  }
  function step3(ctx, tl) {
    const e = elevAt(tl), [cTop, cHor] = skyCols(e), sf = skyFrac(e);
    const af = AUR_FRAC * (1 + 0.03 * Math.sin(tl * 3.1));
    // 天空
    ctx.save(); rrect(ctx, SKY.x0, SKY.y0, SKY.x1 - SKY.x0, SKY.y1 - SKY.y0, 10); ctx.clip();
    const g = ctx.createLinearGradient(0, SKY.y0, 0, SKY.h0);
    g.addColorStop(0, rgb(cTop)); g.addColorStop(1, rgb(cHor));
    ctx.fillStyle = g; ctx.fillRect(SKY.x0, SKY.y0, SKY.x1 - SKY.x0, SKY.h0 - SKY.y0 + 4);
    // 極光：亮度固定，看不看得見由「極光比天空亮多少」決定
    const vis = clamp((af / sf - 0.75) / 0.55, 0, 1);
    curtain(ctx, tl, 0.06 + 0.94 * easeIO(vis));
    // 太陽
    const sx = lerp(430, 520, (30 - e) / 48), sy = elevY(e);
    if (e > -3) {
      const sg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 90);
      sg.addColorStop(0, 'rgba(255,247,194,0.9)'); sg.addColorStop(0.3, 'rgba(255,207,74,0.45)'); sg.addColorStop(1, 'rgba(255,207,74,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 90, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(sx, sy, 20, 0, TAU); ctx.fill();
    }
    ground(ctx);
    ctx.restore();
    if (e < 3) {                                                 // 地平線下：虛線圈標出太陽位置
      ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = YELLOW; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(sx, sy, 20, 0, TAU); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; rrect(ctx, SKY.x0, SKY.y0, SKY.x1 - SKY.x0, SKY.y1 - SKY.y0, 10); ctx.stroke(); ctx.restore();
    fadeIn(ctx, 1 - seg(tl, 0, 0.6));                            // 換場淡入：只淡天空畫面，文字不淡
    // 「極光還在」提示
    const ha = (1 - vis) * seg(tl, 2.0, 2.6);
    if (ha > 0.02) {
      ctx.save(); ctx.globalAlpha = ha * 0.8; ctx.strokeStyle = AUR_G; ctx.lineWidth = 2; ctx.setLineDash([8, 7]);
      rrect(ctx, 64, 112, 336, 168, 12); ctx.stroke(); ctx.restore();
      tag(ctx, tr('極光還在，只是被蓋掉', 'Still there, just drowned out'), 232, 196, AUR_G, ha, 22);
    }
    // 太陽高度角軸
    ctx.save(); line(ctx, [[AXX, elevY(30)], [AXX, elevY(-20)]], CHALK, 3);
    for (const d of [0, -12, -18]) {
      const y = elevY(d); line(ctx, [[AXX - 9, y], [AXX + 9, y]], CHALK, 3);
      label(ctx, d === 0 ? '0°' : `−${-d}°`, AXX + 14, y, d === 0 ? CHALK : CYAN, 'left', 22);
    }
    ctx.restore();
    arrowHead(ctx, AXX - 14, elevY(e), 0, YELLOW, 12);
    line(ctx, [[sx + 24, sy], [AXX - 24, elevY(e)]], 'rgba(255,243,106,0.7)', 2, [5, 6]);
    tag(ctx, tr('太陽高度角', 'Sun elevation'), AXX + 16, 450, YELLOW, 1, 22, 'right');
    tag(ctx, tr('地平線', 'Horizon'), 200, SKY.h0 + 30, CHALK, 1, 22, 'center', false);
    // 右側：天空亮度 vs 極光亮度（定性長條，不標數值）
    const BX = 660, BW = 320;
    label(ctx, tr('天空亮度', 'Sky brightness'), BX, 128, CYAN, 'left', 22);
    label(ctx, tr('極光亮度', 'Aurora brightness'), BX, 222, AUR_G, 'left', 22);
    ctx.save();
    ctx.fillStyle = 'rgba(242,236,217,0.12)'; rrect(ctx, BX, 146, BW, 30, 6); ctx.fill(); rrect(ctx, BX, 240, BW, 30, 6); ctx.fill();
    const sbg = ctx.createLinearGradient(BX, 0, BX + BW, 0); sbg.addColorStop(0, rgb(cTop)); sbg.addColorStop(1, rgb(mixC(cHor, [255, 255, 255], 0.25)));
    ctx.fillStyle = sbg; rrect(ctx, BX, 146, Math.max(8, BW * sf), 30, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = AUR_G; rrect(ctx, BX, 240, BW * af, 30, 6); ctx.fill();
    ctx.restore();
    line(ctx, [[BX + BW * af, 140], [BX + BW * af, 276]], 'rgba(242,236,217,0.85)', 2, [5, 5]);
    const seen = sf < af;
    tag(ctx, seen ? tr('看得見', 'Visible') : tr('看不見', 'Not visible'), BX, 330, seen ? AUR_G : RED, 1, 28, 'left');
    label(ctx, seen ? tr('天空比極光暗', 'Sky darker than aurora') : tr('天空比極光亮', 'Sky outshines aurora'), BX, 380, seen ? AUR_G : CHALK, 'left', 22);
    label(ctx, tr('太陽要在地平線下 12°～18°', 'Sun 12°–18° below horizon'), BX, 440, CYAN, 'left', 22);
    topMsg(ctx, tr('從地面看：天空夠暗，極光才露出來', 'From the ground: the aurora shows only when the sky is dark enough'), CHALK);
    const msg = tl < 4 ? [tr('太陽還在天上：天空比極光亮得多', 'The Sun is up: the sky is far brighter than the aurora'), YELLOW]
      : tl < 8.6 ? [tr('太陽落下，天空漸漸變暗', 'The Sun sets and the sky slowly darkens'), CHALK]
      : tl < 11.2 ? [tr('天空比極光暗了：極光露出來', 'Now the sky is darker than the aurora: it shows'), AUR_G]
      : [tr('極區夏天太陽落不夠深，所以極光季在秋、冬、春', 'Polar summer nights never get dark enough: aurora season is autumn to spring'), CYAN];
    botMsg(ctx, msg[0], msg[1], seg(tl, 0.8, 1.3));
  }

  // ═════════ 第 4、5 步：正午—午夜子午面側視 ═════════
  // 地球：北在上，太陽在左。赤道上的地磁場朝北（↑）。偶極磁力線 r = L·cos²λ。
  function dipPts(E, RE, L, side, l0, l1, n = 48, st) {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const lam = lerp(l0, l1, k / n) * DEG, c = Math.cos(lam);
      let x = RE * L * c * c * c, y = RE * L * c * c * Math.sin(lam);
      if (st) { x *= 1 + st.a * Math.pow(c, 6); y *= 1 - st.b; }
      out.push([E.x + side * x, E.y - y]);
    }
    return out;
  }
  const footLat = L => Math.acos(Math.sqrt(1 / L)) / DEG;
  function earthSide(ctx, E, RE, la = 1) {
    ctx.save();
    ctx.beginPath(); ctx.arc(E.x, E.y, RE, 0, TAU); ctx.fillStyle = EARTH_FILL; ctx.fill();
    ctx.beginPath(); ctx.arc(E.x, E.y, RE, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fillStyle = 'rgba(8,20,30,0.6)'; ctx.fill();   // 夜側
    ctx.beginPath(); ctx.arc(E.x, E.y, RE, 0, TAU); ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    if (la > 0) { ctx.save(); ctx.globalAlpha = la; label(ctx, tr('北', 'N'), E.x, E.y - RE * 0.45, CHALK, 'center', 22); ctx.restore(); }
  }
  const E4 = { x: 430, y: 310 }, RE4 = 46, NOSE = 262, RC = 150;
  const mpX = (y, E) => NOSE + (y - E.y) * (y - E.y) / (2 * RC);
  const LA = 3.5;                                        // 參與重連的最外圈日側磁力線
  const X0 = { x: 266, y: E4.y };
  // 北側被打開的磁力線上的「折角」沿這條路走：先沿磁層頂往上（橡皮筋彈開），再被太陽風拖過極區往夜側
  function kinkAt(v) {
    if (v <= 0.5) { const y = E4.y - 150 * (v / 0.5); return [mpX(y, E4) + 4, y]; }
    const k = (v - 0.5) / 0.5; return [lerp(mpX(E4.y - 150, E4) + 4, 720, k), lerp(E4.y - 150, E4.y - 160, k)];
  }
  function openLineN(tl) {
    const v = 0.5 * easeOut(seg(tl, 4.0, 6.6)) + 0.5 * easeIO(seg(tl, 6.6, 12.2));
    const K = kinkAt(v);
    const lf = footLat(LA), half = dipPts(E4, RE4, LA, -1, lf, 0, 40);
    const dx = K[0] - X0.x, dy = K[1] - X0.y;
    const a = half.map((p, i) => { const lam = lerp(lf, 0, i / 40), w = Math.pow(1 - lam / lf, 1.5); return [p[0] + w * dx, p[1] + w * dy]; });
    const T = [lerp(X0.x, 800, easeIO(seg(tl, 4.0, 12.6))), 135];
    const b = bez(K, [K[0], lerp(K[1], T[1], 0.5)], [lerp(K[0], T[0], 0.6), T[1]], T, 20);
    return { a, b, K, v, T };
  }
  function windArrows(ctx, a, ys, x0 = 30, x1 = 150, t = 0) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    for (const y of ys) { const o = ((t * 60) % 30); arrow(ctx, x0 + o * 0.3, y, x1 + o * 0.3, y, ORANGE, 4, 12); }
    ctx.restore();
  }
  function cuspFunnel(ctx, foot, a, flip = 1) {
    if (a <= 0) return;
    const a1 = -2.05, a2 = -2.75, L = 92;
    const p1 = [foot[0] + L * Math.cos(a1), foot[1] + flip * L * Math.sin(a1)], p2 = [foot[0] + L * Math.cos(a2), foot[1] + flip * L * Math.sin(a2)];
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(85,233,255,0.14)'; ctx.beginPath(); ctx.moveTo(foot[0], foot[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a; line(ctx, [p1, foot, p2], 'rgba(85,233,255,0.9)', 2, [6, 5]); ctx.restore();
  }
  function step4(ctx, tl, T) {
    const E = E4, RE = RE4;
    drawSun(ctx, 0.7);
    windArrows(ctx, seg(tl, 0.2, 0.7), [150, 225], 30, 150, tl);
    // 磁層頂
    const mp = []; for (let y = 140; y <= 500; y += 6) mp.push([mpX(y, E), y]);
    line(ctx, mp, 'rgba(242,236,217,0.45)', 2, [10, 8]);
    // 閉合磁力線
    for (const L of [1.6, 2.2, 2.9]) {
      const lf = footLat(L);
      fieldLine(ctx, dipPts(E, RE, L, -1, -lf, lf), LINE_RGB, 0.75, 3, [[0.5, 1]]);
    }
    for (const L of [1.6, 2.2, 2.9, 3.6]) {
      const lf = footLat(L);
      fieldLine(ctx, dipPts(E, RE, L, 1, -lf, lf, 48, { a: 0.25 * (L - 1.4), b: 0.05 * (L - 1.4) }), LINE_RGB, 0.75, 3, [[0.5, 1]]);
    }
    const lfA = footLat(LA);
    const footN = [E.x - RE * Math.cos(lfA * DEG), E.y - RE * Math.sin(lfA * DEG)], footS = [footN[0], 2 * E.y - footN[1]];
    const xi = lerp(185, 262, easeIO(seg(tl, 0.6, 3.2)));
    const cut = seg(tl, 3.6, 4.0);
    const imfA = seg(tl, 0.4, 0.9);
    if (tl < 4.0) {
      // 重連前：外圈閉合線 A（↑）＋太陽風磁力線（↓），在 X 點相遇；3.6–4.0 s 在 X 點剪斷
      const A = dipPts(E, RE, LA, -1, -lfA, lfA, 60);
      const gap = 14 * cut;
      const keep = p => Math.hypot(p[0] - X0.x, p[1] - X0.y) > gap;
      const An = A.filter((p, i) => i > 30 && keep(p)), As = A.filter((p, i) => i < 30 && keep(p));
      fieldLine(ctx, As, LINE_RGB, 0.95, 4, []); fieldLine(ctx, An, LINE_RGB, 0.95, 4, []);
      if (cut <= 0) arrowHead(ctx, A[30][0], A[30][1] - 4, -Math.PI / 2, CYAN, 13);
      const imfN = [[xi, 140], [xi, E.y - gap]], imfS = [[xi, E.y + gap], [xi, 500]];
      fieldLine(ctx, imfN, IMF_RGB, imfA, 4, [[0.55, 1]]); fieldLine(ctx, imfS, IMF_RGB, imfA, 4, [[0.45, 1]]);
      const near = seg(tl, 2.6, 3.2);
      if (near > 0) glowRing(ctx, X0.x, X0.y, 18 + 6 * Math.sin(T * 8), PINK, near * 0.9);
      tag(ctx, tr('方向相反', 'Opposite'), 205, E.y - 60, PINK, near * (1 - cut), 22, 'right');
    } else {
      // 重連後：交叉重接成兩條「打開」的磁力線（一端連地球、一端連太陽風）
      const o = openLineN(tl);
      const aS = mirrorY(o.a, E.y), bS = mirrorY(o.b, E.y);
      fieldLine(ctx, o.a, LINE_RGB, 0.95, 4, [[0.55, -1]]); fieldLine(ctx, o.b, IMF_RGB, 0.95, 4, [[0.5, -1]]);
      fieldLine(ctx, aS, LINE_RGB, 0.95, 4, [[0.55, 1]]); fieldLine(ctx, bS, IMF_RGB, 0.95, 4, [[0.5, 1]]);
      // 橡皮筋張力：折角往外彈開
      const snap = seg(tl, 4.0, 4.4) * (1 - seg(tl, 6.4, 7.0));
      if (snap > 0) {
        const K = o.K, ang = Math.atan2(kinkAt(Math.min(1, o.v + 0.03))[1] - K[1], kinkAt(Math.min(1, o.v + 0.03))[0] - K[0]);
        ctx.save(); ctx.globalAlpha = snap;
        arrow(ctx, K[0], K[1], K[0] + 46 * Math.cos(ang), K[1] + 46 * Math.sin(ang), PINK, 5, 14);
        arrow(ctx, K[0], 2 * E.y - K[1], K[0] + 46 * Math.cos(ang), 2 * E.y - (K[1] + 46 * Math.sin(ang)), PINK, 5, 14);
        ctx.restore();
      }
      glowRing(ctx, X0.x, X0.y, 18 + 20 * seg(tl, 4.0, 4.8), PINK, 1 - seg(tl, 4.0, 4.8));
      // 粒子沿打開的磁力線，由極尖區灌進高空
      const ca = seg(tl, 6.2, 6.8);
      cuspFunnel(ctx, footN, ca); cuspFunnel(ctx, footS, ca * 0.6, -1);
      if (tl > 6.6) {
        for (const pts of [o.a, mirrorY(o.a, E.y)]) {
          const p = mkPoly(pts.slice().reverse());
          for (let j = 0; j < 4; j++) {
            const ph = ((tl - 6.6) * 0.55 + j / 4) % 1;
            const [x, y] = polyAt(p, p.len * ph);
            particle(ctx, x, y, seg(ph, 0, 0.1) * (1 - seg(ph, 0.9, 1)), 4.5);
          }
        }
        const ra = seg(tl, 7.2, 8.2);
        softGlow(ctx, footN[0], footN[1], 26, AUR.r, ra * (0.55 + 0.1 * Math.sin(T * 5)));
        softGlow(ctx, footS[0], footS[1], 22, AUR.r, ra * 0.45);
      }
      tag(ctx, tr('極尖區', 'Polar cusp'), footN[0] - 92, footN[1] - 108, CYAN, ca, 22, 'right');
      tag(ctx, tr('剪斷、重接', 'Cut & rejoin'), 205, E.y, PINK, seg(tl, 3.8, 4.2) * (1 - seg(tl, 6.0, 6.5)), 22, 'right');
      tag(ctx, tr('變短、彈開', 'Shorter: snaps away'), 205, E.y - 44, PINK, seg(tl, 4.4, 4.8) * (1 - seg(tl, 6.5, 7.0)), 22, 'right');
      tag(ctx, tr('拖向夜側 →', 'Dragged to night side →'), 620, 182, ORANGE, seg(tl, 7.4, 7.9), 22, 'center');
    }
    earthSide(ctx, E, RE);
    if (tl < 4.0) tag(ctx, tr('重連 X 點', 'X point'), 205, E.y, PINK, seg(tl, 3.2, 3.6), 22, 'right');
    // 圖例列
    const la = seg(tl, 0.8, 1.3);
    if (la > 0) {
      ctx.save(); ctx.globalAlpha = la;
      line(ctx, [[22, 103], [52, 103]], `rgb(${IMF_RGB})`, 4); arrowHead(ctx, 37, 110, Math.PI / 2, ORANGE, 10);
      line(ctx, [[520, 103], [550, 103]], `rgb(${LINE_RGB})`, 4); arrowHead(ctx, 535, 96, -Math.PI / 2, CYAN, 10);
      ctx.restore();
      label(ctx, tr('太陽風磁場：朝南', 'Solar-wind field: southward'), 62, 103, ORANGE, 'left', 22);
      label(ctx, tr('地磁（赤道處）：朝北', 'Earth\'s field at equator: northward'), 560, 103, CYAN, 'left', 22);
    }
    tag(ctx, tr('太陽風 →', 'Solar wind →'), 90, 188, ORANGE, seg(tl, 0.3, 0.8), 22);
    miniTop(ctx, T, { base: 0.4, dayRed: seg(tl, 7.6, 8.6), nightBoost: 0 });
    tag(ctx, tr('日側極光：偏紅、較弱', 'Dayside aurora: reddish, weak'), 172, 474, AUR_R, seg(tl, 8.0, 8.5), 22, 'left');
    topMsg(ctx, tr('白天也有極光：向日面的磁場重連', 'Aurora by day too: reconnection on the Sun-facing side'), CHALK);
    const msg = tl < 3.4 ? [tr('太陽風磁場朝南，和朝北的地磁方向相反', 'The solar-wind field points south, opposite to Earth\'s'), ORANGE]
      : tl < 6.6 ? [tr('像橡皮筋：剪斷、交叉重接，新磁力線變短、彈開', 'Like rubber bands: cut, rejoined, the new lines snap away'), PINK]
      : tl < 9.0 ? [tr('打開的磁力線被太陽風拖過極區，往夜側去', 'The opened lines are dragged over the pole to the night side'), ORANGE]
      : [tr('粒子沿磁力線從極尖區灌進高空：日側極光', 'Particles pour in through the cusp: the dayside aurora'), AUR_R];
    botMsg(ctx, msg[0], msg[1], seg(tl, 0.6, 1.1));
  }

  // 第 5 步：磁尾
  const XT_X = 720;
  const LOBE = [[64, 52], [69, 74], [74, 96], [79, 118]];       // [北側足點磁緯, 磁尾中離中心面的高度]
  function lobePts(E, RE, lam, h, xEnd, dip, xt) {
    const f = [E.x + RE * Math.cos(lam * DEG), E.y - RE * Math.sin(lam * DEG)];
    const pts = bez(f, [f[0] + RE * 0.5, f[1] - RE * 1.2], [E.x + RE * 3.2, E.y - h], [xEnd, E.y - h], 50);
    if (dip > 0) for (const p of pts) p[1] += dip * h * Math.exp(-Math.pow((p[0] - xt) / 70, 2));
    return pts;
  }
  function step5(ctx, tl, T) {
    const pan = easeIO(seg(tl, 0, 1.6));
    const E = { x: lerp(E4.x, 230, pan), y: lerp(E4.y, 300, pan) }, RE = lerp(RE4, 44, pan);
    const stretch = 0.15 + 0.85 * easeIO(seg(tl, 1.2, 6.5));
    const relax = 0.45 * easeOut(seg(tl, 7.4, 10.4));
    const s = stretch - relax;
    const energy = stretch - 0.75 * easeOut(seg(tl, 7.4, 9.6));
    drawSun(ctx, 0.55 * (1 - pan) + 0.35);
    windArrows(ctx, 1, [150, 225], 20, 110, tl);
    // 日側閉合線
    for (const L of [1.6, 2.2, 2.9]) { const lf = footLat(L); fieldLine(ctx, dipPts(E, RE, L, -1, -lf, lf), LINE_RGB, 0.7, 3, [[0.5, 1]]); }
    // 夜側閉合線：被拉長
    const AS = { 1.6: [0.02, 0], 2.2: [0.15, 0.05], 2.9: [0.45, 0.15], 3.6: [0.95, 0.3], 4.4: [1.3, 0.45] };
    for (const L of [1.6, 2.2, 2.9, 3.6, 4.4]) {
      const lf = footLat(L), [a, b] = AS[L];
      fieldLine(ctx, dipPts(E, RE, L, 1, -lf, lf, 56, { a: a * s, b: b * s }), LINE_RGB, 0.7, 3, [[0.5, 1]]);
    }
    // 磁尾的開放磁力線（北瓣指向地球 ←，南瓣背離地球 →）
    const xEnd = lerp(E.x + RE * 5, 990, easeIO(seg(tl, 0.6, 5.5)));
    const lobeA = seg(tl, 0.4, 1.4);
    const pinch = easeIO(seg(tl, 6.4, 7.3));
    const done = tl >= 7.3;
    LOBE.forEach(([lam, h], j) => {
      if (j === 0 && done) return;
      const pts = lobePts(E, RE, lam, h, xEnd, j === 0 ? pinch : 0, XT_X);
      fieldLine(ctx, pts, LINE_RGB, 0.8 * lobeA, 3, [[0.75, -1]]);
      fieldLine(ctx, mirrorY(pts, E.y), LINE_RGB, 0.8 * lobeA, 3, [[0.75, 1]]);
    });
    tag(ctx, tr('磁尾', 'Magnetotail'), 900, 103, CYAN, seg(tl, 2.0, 2.5), 24);
    // 距離標示（示意）
    const da = seg(tl, 5.6, 6.2);
    if (da > 0) {
      ctx.save(); ctx.globalAlpha = da;
      line(ctx, [[E.x, 128], [XT_X, 128]], CHALK, 2); line(ctx, [[E.x, 120], [E.x, 136]], CHALK, 2); line(ctx, [[XT_X, 120], [XT_X, 136]], CHALK, 2);
      line(ctx, [[XT_X, 136], [XT_X, E.y - 24]], 'rgba(242,236,217,0.5)', 2, [4, 6]);
      ctx.restore();
      tag(ctx, tr('約 20–30 個地球半徑（示意）', '~20–30 Earth radii (schematic)'), (E.x + XT_X) / 2, 103, CHALK, da, 22, 'center', false);
    }
    // 磁尾重連
    if (!done) {
      if (pinch > 0.6) glowRing(ctx, XT_X, E.y, 16 + 5 * Math.sin(T * 9), PINK, (pinch - 0.6) / 0.4);
    } else {
      const q = easeOut(seg(tl, 7.4, 10.0));
      const lam = LOBE[0][0];
      const f = [E.x + RE * Math.cos(lam * DEG), E.y - RE * Math.sin(lam * DEG)];
      const xt = lerp(XT_X, E.x + RE * 4.9, q);
      const nb = bez(f, [f[0] + RE * lerp(0.5, 1.6, q), f[1] - RE * lerp(1.2, 1.0, q)], [xt - lerp(150, 0, q), E.y - lerp(58, 52, q)], [xt, E.y], 50);
      const full = nb.concat(mirrorY(nb, E.y).reverse());
      fieldLine(ctx, full, LINE_RGB, 1, 4.5, [[0.5, -1]]);
      // 被甩出去的那一段（往磁尾外飛走）
      const px = XT_X + 10 + 300 * Math.pow(seg(tl, 7.3, 8.6), 1.6), pa = 1 - seg(tl, 8.2, 8.6);
      if (pa > 0) {
        const tailN = [[px, E.y], [px + 60, E.y - 50], [px + 160, E.y - 60], [1010, E.y - 60]];
        fieldLine(ctx, tailN, LINE_RGB, pa, 3.5, []); fieldLine(ctx, mirrorY(tailN, E.y), LINE_RGB, pa, 3.5, []);
      }
      glowRing(ctx, XT_X, E.y, 18 + 26 * seg(tl, 7.3, 8.1), PINK, 1 - seg(tl, 7.3, 8.1));
      const snap = seg(tl, 7.4, 7.7) * (1 - seg(tl, 9.6, 10.2));
      if (snap > 0) { ctx.save(); ctx.globalAlpha = snap; arrow(ctx, xt + 8, E.y, xt - 50, E.y, PINK, 5, 14); ctx.restore(); }
      // 粒子被加速，沿磁力線射向夜側極區
      const fN = f, fS = [f[0], 2 * E.y - f[1]];
      if (tl > 7.6) {
        for (const pts of [nb, mirrorY(nb, E.y)]) {
          const p = mkPoly(pts.slice().reverse());
          for (let j = 0; j < 5; j++) {
            const ph = ((tl - 7.6) * 0.9 + j / 5) % 1;
            const [x, y] = polyAt(p, p.len * easeIO(ph));
            particle(ctx, x, y, seg(ph, 0, 0.08) * (1 - seg(ph, 0.92, 1)), 5);
          }
        }
        const ga = seg(tl, 8.0, 8.8);
        softGlow(ctx, fN[0], fN[1], 34, AUR.g, ga * (0.85 + 0.15 * Math.sin(T * 7)));
        softGlow(ctx, fS[0], fS[1], 30, AUR.g, ga * 0.8);
      }
      tag(ctx, tr('磁尾重連', 'Tail reconnection'), XT_X + 30, E.y, PINK, seg(tl, 8.6, 9.0) * (1 - seg(tl, 10.6, 11.0)), 22, 'left');
      tag(ctx, tr('彈回地球', 'Snaps back'), 560, E.y - 30, PINK, seg(tl, 7.6, 8.0) * (1 - seg(tl, 10.0, 10.5)), 22, 'center');
    }
    earthSide(ctx, E, RE, 1 - seg(tl, 10.8, 11.0));
    // 磁能儲存量表
    ctx.save();
    // 磁能＝粉紅（與彈力位能同色：都是「拉長的橡皮筋」存的能量）；黃色留給動能，全站同一物理量同一顏色
    label(ctx, tr('磁能儲存', 'Magnetic energy stored'), 660, 452, PINK, 'left', 22);
    ctx.fillStyle = 'rgba(242,236,217,0.14)'; rrect(ctx, 660, 472, 320, 22, 8); ctx.fill();
    const eg = ctx.createLinearGradient(660, 0, 980, 0); eg.addColorStop(0, 'rgba(255,120,183,0.6)'); eg.addColorStop(1, PINK);
    ctx.fillStyle = eg; rrect(ctx, 660, 472, Math.max(10, 320 * clamp(energy, 0, 1)), 22, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; rrect(ctx, 660, 472, 320, 22, 8); ctx.stroke();
    ctx.restore();
    const sub = seg(tl, 7.9, 8.8);
    miniTop(ctx, T, { base: 0.45 + 0.4 * sub, dayRed: 0.35, nightBoost: 1.4 * sub, dance: sub });
    tag(ctx, tr('夜側變亮', 'Night side flares'), 172, 474, AUR_G, sub, 22, 'left');
    topMsg(ctx, tr('晚上更亮：磁尾裡的磁場重連', 'Brighter at night: reconnection in the magnetotail'), CHALK);
    const msg = tl < 6.4 ? [tr('磁力線被拖成長長的磁尾，像拉長的橡皮筋存著能量', 'Field lines are dragged into a long tail, storing energy like stretched rubber bands'), CYAN]
      : tl < 7.6 ? [tr('磁尾裡方向相反的磁力線靠近、重連', 'Oppositely directed lines in the tail meet and reconnect'), PINK]
      : [tr('磁力線彈回地球，把粒子射向夜側極區：磁層次暴', 'The lines snap back and fire particles at the night-side pole: a substorm'), YELLOW];
    botMsg(ctx, msg[0], msg[1], seg(tl, 1.0, 1.5));
    // 最後 3 秒：因果鏈
    const ch = seg(tl, 11.0, 11.4);
    if (ch > 0) {
      ctx.save(); ctx.globalAlpha = 0.72 * ch; ctx.fillStyle = '#0c1e19'; ctx.fillRect(0, 84, W, 428); ctx.restore();
      const items = [[['日側重連'], ['Dayside', 'reconnection'], PINK], [['磁尾儲能'], ['Tail stores', 'energy'], CYAN],
        [['夜側重連'], ['Nightside', 'reconnection'], PINK], [['夜側極光最亮'], ['Night aurora', 'brightest'], AUR_G]];
      const bw = 206, gap = 40, x0 = (W - (4 * bw + 3 * gap)) / 2, by = 250, bh = 100;
      items.forEach(([zh, en, col], k) => {
        const a = seg(tl, 11.0 + k * 0.45, 11.4 + k * 0.45); if (a <= 0) return;
        const x = x0 + k * (bw + gap);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PANEL; rrect(ctx, x, by, bw, bh, 12); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        const ls = currentLang === 'en' ? en : zh;
        ctx.save(); ctx.globalAlpha = a;
        ls.forEach((s2, r) => label(ctx, s2, x + bw / 2, by + bh / 2 + (r - (ls.length - 1) / 2) * 30, col, 'center', 24));
        ctx.restore();
        if (k > 0) { ctx.save(); ctx.globalAlpha = a; arrow(ctx, x - gap + 6, by + bh / 2, x - 6, by + bh / 2, CHALK, 4, 12); ctx.restore(); }
      });
    }
  }

  function drawDayNight(ctx, step, tl, T) {
    if (step === 0) step1(ctx, tl);
    else if (step === 1) step2(ctx, tl);
    else if (step === 2) step3(ctx, tl);
    else if (step === 3) step4(ctx, tl, T);
    else step5(ctx, tl, T);
    schematicNote(ctx);
  }

  // ═════════ 場景表 ═════════
  const SCENES = {
    'example-daynight': {
      draw: drawDayNight,
      steps: [
        { d: 13.0, b: ['整天發光', 'Always glowing'],
          cap: ['<strong class="accent-green">極光整天都在發光：</strong>從北極上空往下看，綠色的極光橢圓環一直都在，而且<strong class="accent-yellow">固定朝著太陽</strong>，不會跟著地球轉；夜側那一半比較亮。',
                '<strong class="accent-green">The aurora glows all day:</strong> seen from above the North Pole, the green auroral oval is always there and stays <strong class="accent-yellow">fixed toward the Sun</strong> instead of turning with the Earth; the night half is brighter.'] },
        { d: 13.0, b: ['地球自轉', 'Earth spins'],
          cap: ['<strong class="accent-cyan">地球自轉，觀測者轉進夜側：</strong>橢圓環不動、地球在它下面轉；在極光帶緯度附近的觀測者，每天會轉過夜側的極光帶一次，那時他頭上是深夜。',
                '<strong class="accent-cyan">The Earth spins and carries the observer into the night side:</strong> the oval stays put while the Earth turns beneath it; an observer near the auroral zone passes under the night-side oval once a day, when it is the middle of the night overhead.'] },
        { d: 13.0, b: ['天空太亮', 'Sky too bright'],
          cap: ['<strong class="accent-yellow">白天看不到，是因為天空太亮：</strong>不是極光消失，而是大氣散射的陽光比極光亮得多，把它蓋過去。太陽要落到地平線下約 12°～18°，天空夠暗，極光才露出來；所以極區夏天整夜不夠暗，極光季在<strong class="accent-cyan">秋、冬、春</strong>。',
                '<strong class="accent-yellow">You can\'t see it by day because the sky is too bright:</strong> the aurora has not vanished; sunlight scattered by the atmosphere is simply far brighter and drowns it out. The Sun must sink about 12°–18° below the horizon before the sky is dark enough; that is why polar summer nights are never dark enough, and the aurora season is <strong class="accent-cyan">autumn, winter and spring</strong>.'] },
        { d: 13.0, b: ['日側重連', 'Dayside'],
          cap: ['<strong class="accent-red">白天其實也有極光：</strong>太陽風的磁場方向和地磁相反時，在向日面<strong class="accent-pink">重連</strong>，磁力線被打開；粒子沿著磁力線從<strong class="accent-cyan">極尖區</strong>灌進高空，形成日側極光（通常偏紅、比夜側弱）。',
                '<strong class="accent-red">There is aurora by day too:</strong> when the solar wind\'s magnetic field points opposite to Earth\'s, field lines <strong class="accent-pink">reconnect</strong> on the Sun-facing side and open up; particles pour down along them through the <strong class="accent-cyan">polar cusp</strong> and make the dayside aurora (usually reddish and weaker than the night side).'] },
        { d: 14.0, b: ['夜側重連', 'Nightside'],
          cap: ['<strong class="accent-pink">晚上更亮，因為磁尾重連：</strong>太陽風把磁力線拖到夜側，拉成長長的<strong class="accent-cyan">磁尾</strong>，像拉長的橡皮筋存著能量；磁尾裡方向相反的磁力線重連後彈回地球，把粒子加速射向夜側極區，這就是<strong class="accent-yellow">磁層次暴</strong>。',
                '<strong class="accent-pink">The night is brighter because of magnetotail reconnection:</strong> the solar wind drags field lines to the night side into a long <strong class="accent-cyan">magnetotail</strong> that stores energy like a stretched rubber band; oppositely directed lines in the tail reconnect and snap back toward Earth, accelerating particles toward the night-side polar region—a <strong class="accent-yellow">substorm</strong>.'] }
      ]
    }
  };

  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  // halted：學生模式播完一步、或老師模式播完全部後停住（不再跑迴圈；換語言只重畫）
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

  MA.daynight = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'example-daynight';
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
