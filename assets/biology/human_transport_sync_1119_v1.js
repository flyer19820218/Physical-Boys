/* biology_human_transport：畫面跟上字幕（2026-11-19，老師授權；外層加法）
 * 只包裝 LivingBook.modules.human 的 heart／vessels／lymph 三個分頁的 draw／act／explain：
 *   ・原本的繪圖函式照常先畫，本檔只在「新狀態」時疊加，原有座標、演算法一行不改。
 *   ・heart：part='septum' 時，在課本原圖標出心臟中隔、在剖面標「中隔：血液不穿過」。
 *   ・vessels：新狀態 pulm='artery'|'vein'（只由教學步驟設定）＝肺循環專頁：
 *       左＝課本心臟原圖（上半部放大）標出肺動脈或肺靜脈；右＝心臟 ↔ 肺的流向示意。
 *       學生按任何原本的控制鈕（view／vessel／circuit／squeeze）就清掉 pulm，回到原畫面。
 *   ・lymph：movement='active' 且在回程畫面（lymphStep=3）時，空白處加一個放大窗：
 *       骨骼肌收縮擠壓淋巴管 → 前方瓣膜開、淋巴往前；放鬆 → 瓣膜關、淋巴暫停不倒流。
 *       節奏與原圖的瓣膜開關同一個公式（PULSE 3.2 秒、開 55%），兩者同步。
 * 載入順序：human_transport_1008_v1.js 之後（register 已完成）。
 */
(function (root) {
  'use strict';
  var LB = root.LivingBook, C = root.HumanTransportCutaways, J = root.HumanTransportLymphJourney;
  if (!LB || !LB.modules || !LB.modules.human || !C || !J) return;
  var tabs = LB.modules.human.tabs;
  var find = function (id) { return tabs.filter(function (t) { return t.id === id; })[0]; };
  var P = function (a, b) { return [a, b]; };
  var INK = '#f2ecd9', YELLOW = '#fde047', MUTED = '#b9cbbd', GREEN = '#a6df80', BG = '#11261f';
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var smooth = function (u) { u = clamp(u); return u * u * (3 - 2 * u); };
  var mod = function (n, d) { d = d || 1; return ((n % d) + d) % d; };
  var font = function (size) { return '700 ' + size + 'px "Noto Sans TC", "JetBrains Mono", sans-serif'; };
  function text(ctx, D, p, x, y, size, color, align) {
    ctx.save(); ctx.font = font(size || 22); ctx.fillStyle = color || INK; ctx.textAlign = align || 'left';
    ctx.fillText(D.tr(p), x, y); ctx.restore();
  }
  function wrap(ctx, D, p, x, y, w, size, color) {
    ctx.save(); ctx.font = font(size || 22);
    var str = D.tr(p), units = /\s/.test(str) ? str.split(/\s+/).map(function (a) { return a + ' '; }) : Array.from(str), rows = [], row = '';
    units.forEach(function (u) { if (row && ctx.measureText(row + u).width > w) { rows.push(row.trim()); row = u; } else row += u; });
    if (row) rows.push(row.trim()); ctx.restore();
    rows.forEach(function (r, i) { text(ctx, D, [r, r], x, y + i * ((size || 22) + 7), size, color); });
    return rows.length;
  }
  function poly(ctx, pts, color, width, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach(function (p, i) { ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); ctx.stroke(); ctx.restore();
  }
  function head(ctx, a, b, color, size) {
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]); size = size || 10;
    ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(size * .9, 0); ctx.lineTo(-size * .7, -size * .75); ctx.lineTo(-size * .7, size * .75); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function pointOn(pts, u) {
    var L = [], tot = 0, i;
    for (i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
    var d = clamp(u) * tot; i = 0;
    while (i < L.length - 1 && d > L[i]) d -= L[i++];
    var a = pts[i], b = pts[i + 1], f = L[i] ? d / L[i] : 0;
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  // 課本心臟原圖 heart.png（801×1127）在剖面頁的位置＝C.original(…,24,62,430,490)：內縮 6px 後等比置中
  function heartFit(x, y, w, h) {
    var k = Math.min((w - 12) / 801, (h - 12) / 1127), ww = 801 * k, hh = 1127 * k;
    return { x: x + 6 + (w - 12 - ww) / 2, y: y + 6 + (h - 12 - hh) / 2, w: ww, h: hh };
  }
  var map = function (f, u, v) { return [f.x + u * f.w, f.y + v * f.h]; };

  /* ── 1. 心臟中隔 ─────────────────────────────────────────── */
  // 原圖上心室中隔的肌肉帶（量 heart.png：上端在房室瓣下方，往下右斜到心尖）
  var SEPTUM_IMG = [[.505, .49], [.53, .60], [.56, .70], [.585, .80], [.60, .86], [.65, .86], [.665, .78], [.635, .70], [.60, .60], [.555, .49]];
  // 剖面模型：左右兩半之間的中隔（座標量自 heartHalf(696,-1)／heartHalf(710,1) 的畫面）
  var SEPTUM_CUT = { top: [703, 290], bottom: [710, 425] };
  var heart = find('heart');
  if (heart) {
    var heartDraw = heart.draw;
    heart.draw = function (ctx, s, t, D) {
      var q = heartDraw(ctx, s, t, D);
      if (s.part === 'septum' && s.view !== 'medical' && s.view !== 'body') septumOverlay(ctx, s, t, D);
      return q;
    };
  }
  function septumOverlay(ctx, s, t, D) {
    var f = heartFit(24, 62, 430, 490), glow = .55 + .25 * Math.sin(t * 3);
    var pts = SEPTUM_IMG.map(function (p) { return map(f, p[0], p[1]); });
    ctx.save(); ctx.beginPath(); pts.forEach(function (p, i) { ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); ctx.closePath();
    ctx.fillStyle = 'rgba(253,224,71,' + (.18 + .14 * glow).toFixed(3) + ')'; ctx.fill();
    ctx.setLineDash([6, 4]); ctx.strokeStyle = YELLOW; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
    // 原圖標籤：在心臟右下外側，引線指到中隔中段
    // 標籤放在原圖下方黑板上（不壓白底原圖），引線指到中隔中段
    // 標籤：原圖右下角空白處放一塊黑板色小牌（不蓋到心臟），引線指到中隔下段
    var mid = map(f, .615, .80), cw = 104, chx = f.x + f.w - cw - 2, chy = f.y + f.h - 36;
    poly(ctx, [[chx + cw / 2, chy], mid], YELLOW, 2);
    D.round(ctx, chx, chy, cw, 34, 8, BG, YELLOW);
    text(ctx, D, P('心臟中隔', 'Septum'), chx + cw / 2, chy + 25, 22, YELLOW, 'center');
    // 剖面：中隔亮帶＋「✕ 血液不穿過」
    var a = SEPTUM_CUT.top, b = SEPTUM_CUT.bottom;
    poly(ctx, [a, b], 'rgba(253,224,71,' + (.45 + .3 * glow).toFixed(3) + ')', 9);
    poly(ctx, [a, b], YELLOW, 2, [6, 5]);
    var cy = 372, x0 = 655, x1 = 760;
    poly(ctx, [[x0, cy], [x1, cy]], '#f2ecd9cc', 3, [5, 5]);
    head(ctx, [x1 - 10, cy], [x1, cy], '#f2ecd9cc', 9); head(ctx, [x0 + 10, cy], [x0, cy], '#f2ecd9cc', 9);
    var cx = (a[0] + b[0]) / 2 + 2;
    ctx.save(); ctx.fillStyle = BG; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke(); ctx.restore();
    text(ctx, D, P('心臟中隔', 'Septum'), 703, 255, 24, YELLOW, 'center');
    poly(ctx, [[703, 262], [a[0], a[1] - 4]], YELLOW, 2);
    text(ctx, D, P('左右心分開：血液不穿過中隔', 'Two sides kept apart: blood does not cross'), 703, 464, 22, YELLOW, 'center');
    if (D.status) D.status(P('心臟中隔把左右心分開；正常心臟的血液不會穿過中隔。', 'The septum separates the two sides; in a normal heart blood does not cross it.'));
  }

  /* ── 4. 肺循環：肺動脈 → 肺靜脈 ──────────────────────────── */
  // heart.png 上半部（0～66%）放大；路徑量自原圖：深色主幹＝肺動脈（左右分支），紅色短管＝肺靜脈接左心房
  var CROP_V = .66;
  var PA_PATHS = [
    [[.47, .31], [.49, .24], [.56, .205], [.70, .19], [.90, .19]],
    [[.70, .205], [.80, .235], [.87, .275]],
    [[.21, .215], [.09, .20]],
    [[.21, .235], [.09, .25]]
  ];
  var PV_PATHS = [
    [[.88, .31], [.79, .33]],
    [[.91, .355], [.82, .372]],
    [[.12, .31], [.21, .325]],
    [[.09, .365], [.19, .375]]
  ];
  var PA_BOX = [.06, .165, .90, .16], PV_BOXES = [[.76, .29, .18, .105], [.07, .29, .17, .105]];
  var vessels = find('vessels');
  if (vessels) {
    var vDraw = vessels.draw, vExplain = vessels.explain, vAct = vessels.act;
    vessels.act = function (s, k, v) {
      if (k === 'pulm') { s.pulm = v; s.running = true; return; }
      if (k === 'view' || k === 'vessel' || k === 'circuit' || k === 'squeeze') s.pulm = null;
      if (vAct) vAct(s, k, v); else s[k] = v;
    };
    vessels.draw = function (ctx, s, t, D) {
      if ((s.pulm === 'artery' || s.pulm === 'vein') && s.view === 'atlas') return pulmDraw(ctx, s, t, D);
      return vDraw(ctx, s, t, D);
    };
    vessels.explain = function (s) {
      if (s.pulm === 'artery' && s.view === 'atlas') return {
        title: P('肺動脈：離開心臟，送往肺', 'Pulmonary artery: away from the heart, to the lungs'),
        text: P('肺動脈由右心室出發，把血液送到肺。它離開心臟，所以叫動脈；但裡面的血剛從全身回來，含氧較少。\n\n動脈、靜脈的名稱看「流向」，不看含氧量。左圖是課本原圖（上半部放大），右圖是流向示意。',
          'The pulmonary artery leaves the right ventricle and carries blood to the lungs. It is an artery because it leads away from the heart, yet its blood has just returned from the body and is oxygen-poor.\n\nArtery and vein are named by direction, not by oxygen content. Left: textbook figure (upper part enlarged); right: flow diagram.') };
      if (s.pulm === 'vein' && s.view === 'atlas') return {
        title: P('肺靜脈：從肺回到心臟', 'Pulmonary veins: from the lungs back to the heart'),
        text: P('肺靜脈把血液從肺送回左心房。它回到心臟，所以叫靜脈；血液在肺部補充了氧氣，是富氧血。\n\n肺循環剛好和體循環相反：肺動脈含氧較少、肺靜脈富氧。',
          'The pulmonary veins return blood from the lungs to the left atrium. They are veins because they lead back to the heart; the blood has picked up oxygen in the lungs and is oxygen-rich.\n\nThe pulmonary circuit is the reverse of the systemic one: oxygen-poor pulmonary artery, oxygen-rich pulmonary veins.') };
      return vExplain(s);
    };
  }
  function tube(ctx, pts, color, w) { poly(ctx, pts, '#0b1a15', w + 6); poly(ctx, pts, '#ead0a0', w + 3); poly(ctx, pts, color, w); }
  function flowCells(ctx, pts, t, oxygen, n, r, rate) {
    var len = 0; for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    n = n || Math.max(3, Math.round(len / 26));
    for (var j = 0; j < n; j++) {
      var u = mod(t * (rate || 40) / len + j / n), p = pointOn(pts, u);
      ctx.save(); ctx.globalAlpha = Math.min(1, u * 8, (1 - u) * 8); C.render.rbc(ctx, p.x, p.y, r || 7, oxygen, p.angle + Math.PI / 2); ctx.restore();
    }
  }
  function lungsIcon(ctx, x, y, size) {
    var im = lungsIcon.im;
    if (!im && typeof Image !== 'undefined') { im = lungsIcon.im = new Image(); im.onload = function () { LB.draw(); }; im.src = 'assets/biology/human_transport_media_1012_v1/organ_atlas.png'; }
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 512, 0, 512, 500, x, y, size, size * 500 / 512);   // 底部 12px 不取：避開下一格小腸圖的邊
  }
  function pulmDraw(ctx, s, t, D) {
    var artery = s.pulm === 'artery', vein = !artery;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, 960, 600);
    text(ctx, D, P('肺循環：肺動脈與肺靜脈', 'Pulmonary circuit: arteries and veins'), 24, 35, 26, YELLOW);
    // 左：課本原圖上半部放大
    var dest = [24, 62, 430, 400], f = D.focus(ctx, 'heart.png', [0, 0, 1, CROP_V], dest);
    wrap(ctx, D, artery ? P('課本原圖（上半部放大）：黃虛線＝肺動脈', 'Textbook figure: dashes = pulmonary arteries')
      : P('課本原圖（上半部放大）：黃虛線＝肺靜脈', 'Textbook figure: dashes = pulmonary veins'), 24, 492, 430, 22, YELLOW);
    if (f) {
      var M = function (u, v) { return [f.x + u * f.w, f.y + v / CROP_V * f.h]; };
      var box = function (b) { var p = M(b[0], b[1]), q = M(b[0] + b[2], b[1] + b[3]); ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = YELLOW; ctx.lineWidth = 2.5; ctx.strokeRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); ctx.restore(); };
      var mark = function (paths, color, oxygen) {
        paths.forEach(function (pp) {
          var pts = pp.map(function (p) { return M(p[0], p[1]); });
          poly(ctx, pts, 'rgba(17,38,31,.55)', 9); poly(ctx, pts, color, 4, [10, 8]);
          var dash = mod(t * 1.2); var p0 = pointOn(pts, dash);
          ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p0.x, p0.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          head(ctx, pts[pts.length - 2], pts[pts.length - 1], color, 11);
        });
      };
      if (artery) { box(PA_BOX); mark(PA_PATHS, YELLOW); }
      else { PV_BOXES.forEach(box); mark(PV_PATHS, YELLOW); }
    }
    // 右：心臟 ↔ 肺 流向示意（器官圖為透明底 AI 插圖；血球顏色＝含氧量，同全課）
    var X0 = 470;
    text(ctx, D, P('流向示意', 'Flow diagram'), X0 + 6, 78, 22, MUTED);
    lungsIcon(ctx, 600, 70, 210);
    text(ctx, D, P('肺', 'Lungs'), 705, 300, 22, INK, 'center');
    D.round(ctx, 477, 470, 176, 54, 12, '#4a2a3a', artery ? YELLOW : '#8a6a7a');
    text(ctx, D, P('右心室', 'Right ventricle'), 565, 505, 22, INK, 'center');
    D.round(ctx, 760, 470, 176, 54, 12, '#7a2f36', vein ? YELLOW : '#a8706e');
    text(ctx, D, P('左心房', 'Left atrium'), 848, 505, 22, INK, 'center');
    var PA = [[565, 468], [565, 330], [640, 250]], PV = [[770, 250], [851, 330], [851, 468]];
    ctx.save(); ctx.globalAlpha = artery ? 1 : .32; tube(ctx, PA, '#6c1d2a', 18); flowCells(ctx, PA, t, .25, 0, 6.5, 42); ctx.restore();
    ctx.save(); ctx.globalAlpha = vein ? 1 : .32; tube(ctx, PV, '#b3212d', 18); flowCells(ctx, PV, t, 1, 0, 6.5, 42); ctx.restore();
    head(ctx, [604, 290], [622, 271], artery ? INK : 'rgba(242,236,217,.35)', 12);
    head(ctx, [851, 400], [851, 425], vein ? INK : 'rgba(242,236,217,.35)', 12);
    // 標籤（目前那一條亮黃，另一條淡）
    text(ctx, D, P('肺動脈', 'Pulmonary artery'), 590, 345, 24, artery ? YELLOW : 'rgba(185,203,189,.55)', 'left');
    text(ctx, D, P('離開心臟・含氧較少', 'Leaves heart · O₂-poor'), 590, 374, 22, artery ? INK : 'rgba(185,203,189,.45)', 'left');
    text(ctx, D, P('肺靜脈', 'Pulmonary veins'), 830, 418, 24, vein ? YELLOW : 'rgba(185,203,189,.55)', 'right');
    text(ctx, D, P('回到心臟・富氧', 'Back to heart · O₂-rich'), 830, 447, 22, vein ? INK : 'rgba(185,203,189,.45)', 'right');
    wrap(ctx, D, artery ? P('肺動脈：從右心室離開心臟、送往肺，血液含氧較少——動脈看流向，不看含氧量。', 'Pulmonary artery: leaves the right ventricle for the lungs carrying oxygen-poor blood — arteries are named by direction, not oxygen.')
      : P('肺靜脈：從肺回到左心房，血液已在肺補充氧氣，是富氧血。', 'Pulmonary veins: return from the lungs to the left atrium with blood that picked up oxygen — oxygen-rich.'), 24, 556, 912, 22, INK);
    if (D.status) D.status(artery ? P('肺動脈：離開心臟往肺｜含氧較少', 'Pulmonary artery: heart → lungs | O₂-poor') : P('肺靜脈：從肺回心臟｜富氧', 'Pulmonary veins: lungs → heart | O₂-rich'));
  }

  /* ── 2. 淋巴：肌肉活動協助回流 ───────────────────────────── */
  // 與 human_transport_lymph_journey_1013_v1.js 的瓣膜節奏相同（PULSE、OPEN_END、aperture、openTime；唯讀複製）
  var PULSE = 3.2, OPEN_END = .55;
  var aperture = function (u) { return u < OPEN_END ? smooth(u / .08) * smooth((OPEN_END - u) / .08) : 0; };
  var OPEN_TABLE = (function () { var n = 320, c = [0]; for (var i = 1; i <= n; i++) c.push(c[i - 1] + (aperture((i - 1) / n) + aperture(i / n)) / 2 / n); return c; })();
  function openTime(t) { var k = Math.floor(t / PULSE), u = mod(t / PULSE) * 320, i = Math.min(319, Math.floor(u)); return (k * OPEN_TABLE[320] + OPEN_TABLE[i] + (OPEN_TABLE[i + 1] - OPEN_TABLE[i]) * (u - i)) * PULSE; }
  var lymph = find('lymph');
  if (lymph) {
    var lDraw = lymph.draw, lExplain = lymph.explain;
    var active = function (s) { return s.movement === 'active' && Number(s.lymphStep) === 3; };
    lymph.draw = function (ctx, s, t, D) {
      var r = lDraw(ctx, s, t, D);
      if (active(s)) muscleInset(ctx, s, t, D);
      return r;
    };
    lymph.explain = function (s) {
      if (active(s)) return {
        title: P('肌肉活動：擠一下，淋巴往前一段', 'Muscle activity: each squeeze moves lymph on'),
        text: P('右上放大窗：骨骼肌收縮時擠壓淋巴管，前方的瓣膜被推開，淋巴往心臟方向前進；後方的瓣膜闔上，不讓淋巴往回擠。肌肉放鬆時，前方瓣膜關閉，淋巴暫停，不會倒流。\n\n所以運動時肌肉一縮一放，回流的幫助比安靜時明顯；靜脈回流也是同樣的道理。呼吸與淋巴管本身的收縮也會幫忙。',
          'Close-up, top: when skeletal muscle contracts it squeezes the lymphatic; the valve ahead is pushed open and lymph moves toward the heart, while the valve behind closes so lymph is not squeezed backward. When the muscle relaxes the valve ahead closes and the lymph pauses instead of flowing back.\n\nDuring exercise muscles keep contracting and relaxing, so return is helped more than at rest; veins work the same way. Breathing and the lymphatics\' own contractions also help.') };
      return lExplain(s);
    };
  }
  function muscleInset(ctx, s, t, D) {
    var bx = 326, by = 60, bw = 256, bh = 238, cy = 176, xL = 340, xR = 568, vU = 372, vD = 538, mx = 455;
    var c = aperture(mod(t / PULSE)), squeeze = c > .5;
    // 放大窗與連到主圖淋巴管（d≈120～200 那一段）的虛線
    ctx.save(); ctx.fillStyle = 'rgba(11,26,21,.92)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill();
    ctx.strokeStyle = YELLOW; ctx.lineWidth = 2; ctx.setLineDash([7, 5]); ctx.stroke();
    ctx.strokeRect(398, 344, 84, 40);
    ctx.beginPath(); ctx.moveTo(420, 344); ctx.lineTo(420, by + bh); ctx.stroke(); ctx.restore();
    text(ctx, D, P('放大：肌肉擠壓淋巴管', 'Zoom: muscle pump'), bx + 12, by + 30, 22, YELLOW);
    // 淋巴管：中段被肌肉擠窄（同主圖配色）
    var R = function (x) { return 20 - 7 * c * Math.exp(-Math.pow((x - mx) / 48, 2)); };
    var edge = function (sign, extra) { var pts = []; for (var x = xL; x <= xR; x += 4) pts.push([x, cy + sign * (R(x) + extra)]); return pts; };
    var band = function (extra, fill) { var a = edge(-1, extra), b = edge(1, extra).reverse(); ctx.beginPath(); a.concat(b).forEach(function (p, i) { ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    band(8, '#3f6b35'); band(6, '#8cbb6b'); band(0, '#e4eab9');
    // 骨骼肌（與靜脈「肌肉擠壓」同色系）：收縮時往管子壓近、變短變厚
    [-1, 1].forEach(function (sign) {
      var y = cy + sign * (20 + 8 + 19 - 8 * c);
      ctx.save(); ctx.beginPath(); ctx.ellipse(mx, y, 64 - 8 * c, 18 + 3 * c, 0, 0, Math.PI * 2); ctx.fillStyle = '#753f49'; ctx.fill(); ctx.strokeStyle = '#b77a7a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.clip(); for (var k = -3; k <= 3; k++) poly(ctx, [[mx - 70, y + k * 5 - 2], [mx + 70, y + k * 5 + 2]], '#cf8d8860', 1); ctx.restore();
      if (squeeze) { var ay = cy + sign * 74; poly(ctx, [[mx, ay], [mx, ay - sign * 14]], YELLOW, 3); head(ctx, [mx, ay], [mx, ay - sign * 16], YELLOW, 8); }
    });
        // 淋巴（水分子放大符號）：只在擠壓時往前，放鬆時停住
    var sp = 38, sTravel = 46 * openTime(t), L = vD + 26 - (vU + 6);
    ctx.save(); ctx.beginPath(); band(0, 'rgba(0,0,0,0)'); ctx.clip();
    for (var i = 0; i < 5; i++) {
      var x = vU + 6 + mod(i * sp + sTravel, L), a = Math.min(1, (x - vU - 6) / 14, (xR - x) / 14);
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; D.water(ctx, x, cy + (i % 2 ? 4 : -4), 6); ctx.restore(); }
    }
    D.water(ctx, 352, cy - 3, 6);
    ctx.restore();
    // 瓣膜：前方（靠心端）擠壓時開；後方擠壓時關；放鬆時前方關（不倒流）
    function valve(x, open) {   // 葉片固定在管壁，游離端朝下游；open 0＝闔上、1＝全開（畫法比照原圖 lymphValves）
      var r = R(x);
      [-1, 1].forEach(function (sign) {
        poly(ctx, [[x - 12, cy + sign * r], [x, cy + sign * (r * .5 + r * .45 * open)], [x + 14, cy + sign * (1 + (r * .85 - 1) * open)]], '#2f5a2a', 4);
      });
    }
    var dOpen = c, uOpen = 1 - c;
    valve(vU, uOpen); valve(vD, dOpen);
    text(ctx, D, P('瓣膜', 'Valve'), vD, cy - 34, 22, GREEN, 'center');
    // 方向提示
    if (squeeze) { poly(ctx, [[vD + 8, cy], [vD + 26, cy]], YELLOW, 3); head(ctx, [vD + 8, cy], [vD + 28, cy], YELLOW, 8); }
    else {
      var xx = vD - 30; poly(ctx, [[xx + 16, cy], [xx - 4, cy]], '#ff6b6b', 3); head(ctx, [xx + 16, cy], [xx - 6, cy], '#ff6b6b', 8);
      ctx.save(); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx - 2, cy - 9); ctx.lineTo(xx + 14, cy + 9); ctx.moveTo(xx + 14, cy - 9); ctx.lineTo(xx - 2, cy + 9); ctx.stroke(); ctx.restore();
    }
    text(ctx, D, squeeze ? P('收縮→瓣膜開、往前', 'Squeeze → lymph on') : P('放鬆→瓣膜關、不倒流', 'Relax → no backflow'), bx + bw / 2, by + bh - 14, 22, squeeze ? '#4ade80' : INK, 'center');
  }
})(globalThis);
