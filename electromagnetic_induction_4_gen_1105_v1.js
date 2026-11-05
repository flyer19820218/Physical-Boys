/* electromagnetic_induction_4_gen_1105_v1.js — 「發電機」分頁動畫
 *   #genModelCanvas（邏輯 1000×600）：發電機立體構造＋外電路＋右下「從前方看」小圖
 *   #genWaveCanvas （邏輯 1000×360）：輸出波形（橫軸＝線圈轉過的角度 0°～720°，移動標記與轉角同步）
 *
 * 契約：window.EmiAnim.gen = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 兩個場景：'dc-motor-review' 直流發電機（分裂環）、'ac-generator-model' 交流發電機（兩個滑環）。
 * 依賴頁面現成的（直接呼叫，不複製）：tr、C、TAU。其餘小工具在本檔內。
 * 畫布不綁任何事件；唯一控制是 #steps-gen 裡的步驟鈕（每場景 5 個）。
 * 畫面是「場景時間 t 的純函式」：每步 tl → 轉過角度 p＝ω·tl → 轉角 a＝φ0＋s·p（s＝−1 正轉、＋1 反轉），
 *   感應電動勢、電刷極性、指針、波形軌跡、電流記號位移（＝∫I dt 的解析式）全由 a、p 算出，不累積狀態。
 *
 * ── 場景步驟表 dc-motor-review「直流發電機」，共 39.0 s ─────────────────────
 *   1 構造      7.0 s  慢轉（8 s／圈）；依序強調 場磁鐵 → 電樞線圈 → 分裂環 → 電刷 → 外電路（名稱標籤）
 *   2 切割      8.0 s  4 s／圈；線圈邊速度（白）、感應電流（紅，右手定則）、外電路電流、左下方向面板
 *   3 換接      8.0 s  8 s／圈慢動作；起點線圈 ∥ B；tl＝2 s、6 s 線圈 ⊥ B（ε＝0）時分裂環換接電刷，
 *                       面板顯示「線圈內電流反向、外電路方向不變、左電刷改貼另一片」
 *   4 波形      7.0 s  4 s／圈；波形填色＋「全部在 0 以上」
 *   5 反轉      9.0 s  反向旋轉 4 s／圈；負向脈衝（整條在 0 以下），最後停留後停住
 * ── 場景步驟表 ac-generator-model「交流發電機」，共 40.0 s ──────────────────
 *   1 構造      7.0 s  慢轉；強調 場磁鐵 → 電樞線圈 → 兩個滑環 → 電刷 → 外電路
 *   2 最大與零  8.0 s  8 s／圈慢動作；∥ B 時標「ε 最大」、⊥ B 時標「ε＝0」（機器旁＋小圖）
 *   3 極性交換  8.0 s  4 s／圈；電刷 +／− 標記每半圈交換、外電路電流記號來回反向、面板「滑環不換接」
 *   4 波形      7.0 s  4 s／圈；正負半週填色＋標籤
 *   5 直流對照 10.0 s  4 s／圈；波形圖疊上分裂環（直流，粉虛線）對照；「動能 → 電能」收尾
 * 每步 tl 從 0 開始、轉角從該步 φ0 重新起算（每步開頭 0.35 s 淡入，看不到跳動）。
 *
 * ── 座標與方向約定 ───────────────────────────────────────────────
 *   機器座標：x 向右（S → N 方向）、y 向上、z 沿轉軸「往畫面裡面」；觀看者在前方（z 負的一側）。
 *   注意 (x 右, y 上, z 往裡) 在畫面上是左手系；物理用右手系 (x, y, w＝−z 朝觀看者) 計算。
 *   場磁鐵：N 在右（x>0）、S 在左；B 沿 −x（N → S）。
 *   線圈：四角 A（AB 邊前端）、B（AB 邊後端）、C（CD 邊後端）、D（CD 邊前端）；
 *   AB 邊在 R(cos a, sin a)，CD 邊在 −R(cos a, sin a)；a＝線圈平面與 B 的夾角（a＝0 平行 B）。
 *   A 端接橘色（分裂環橘片／內側橘滑環）、D 端接粉色（分裂環粉片／外側粉滑環）。
 *   分裂環：橘片中心在角度 a（與 AB 邊同側）、粉片中心在 a＋π；兩電刷固定在角度 0（右）與 π（左）。
 *   AC 滑環：左電刷永遠貼粉環（D）、右電刷永遠貼橘環（A）。
 *   旋轉：a＝φ0＋s·p。正轉 s＝−1＝從前方看順時針；反轉 s＝＋1。
 *   AB 邊速度 v ∝ s(−sin a, cos a, 0)；v × B（右手系，B＝−x̂）＝ s·cos a · ŵ（ŵ 朝觀看者＝−z）。
 *   ⇒ 沿 A→B（往裡、+z）的感應電動勢 e＝−s·cos a；e>0：電流 A→B→C→D，從 D 端流出線圈。
 *   輸出正向定義：電流從「左電刷」流出 → 外電路由左往右經檢流計 → 回右電刷（左電刷為 +，指針偏右）。
 *   AC：V＝e＝−s·cos a；正轉 φ0＝π/2 時 V＝sin p（從 0 開始的正弦）。
 *   DC：V＝−s·|cos a|（正轉恆 ≥0、反轉恆 ≤0）；換接發生在 cos a＝0（線圈 ⊥ B、中性面、e＝0）。
 *
 * ── 方向表（正轉 s＝−1，從前方看順時針；φ0＝π/2，p＝轉過角度）───────────────
 *   p          線圈位置          靠 N（右）的邊  靠 S（左）的邊  線圈內電流      流出線圈的端→接點→電刷   外電路       波形
 *   0°         ⊥B（AB 在上）     —（水平移動，不切割）           0              （DC 換接瞬間）            0            0
 *   0°–180°    AB 在右、CD 在左  AB 往下 → 往裡  CD 往上 → 往外  A→B→C→D        D → 粉片 → 左電刷（+）     左→右，指針右  +
 *   180°       ⊥B（AB 在下）     不切割                          0              DC：粉片／橘片交換電刷       0            0
 *   180°–360°  AB 在左、CD 在右  CD 往下 → 往裡  AB 往上 → 往外  D→C→B→A（反向） DC：A → 橘片 → 左電刷（+）  DC 仍左→右   DC +
 *                                                                               AC：A → 橘環 → 右電刷（+）  AC 右→左     AC −
 *   通則：靠 N 那條邊（往下切）電流往裡、靠 S 那條邊（往上切）電流往外；往外的那端就是流出線圈的端。
 *   DC：流出端所連的換向片永遠在左邊 → 永遠接左電刷 → 左電刷恆為 +，外電路恆左→右（|cos|）。
 *   AC：流出端每半圈在 D、A 間交換，而滑環固定接電刷 → 左、右電刷極性每半圈交換（cos）。
 *   反轉（DC 第 5 步，s＝＋1）：靠 N 的邊往上切 → 全部反向 → 右電刷恆為 +，外電路右→左，波形整條 ≤0。
 *   畫面的紅箭頭（線圈邊）、⊗／⊙（小圖）、電流記號（外電路）、+／− 標籤、檢流計指針、波形、
 *   方向面板與結果框，全由同一個 e、V 的正負決定，不另外寫死。
 *
 * 字級：畫布文字 20–34px（說明 24、標籤 22、次要 20），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmiAnim = window.EmiAnim || {};

  const W = 1000, H = 600, WH = 360;
  const FONT = "'Noto Sans TC',sans-serif";
  const CX = 535, CY = 262, K = 0.9;                  // 斜投影中心與縮放
  const R = 132, ZF = -125, ZB = 150;                 // 線圈半寬、前端 z、後端 z
  const MAGX0 = 205, MAGX1 = 285, MAGY = 108, MAGZ0 = -120, MAGZ1 = 140;
  const RING_R = 40;
  const DCZ = [-410, -370];                           // 分裂環 z 範圍
  const ACZ_A = [-385, -360], ACZ_D = [-448, -423];   // 橘環（A）、粉環（D）
  const BRUSH_Y = 470, LOOP_Y = 548, MR = 36;         // 電刷底座端子 y、外電路底線 y、檢流計半徑
  const COPPER = '#d08a4a', COPPER_DK = '#5a3418', WIRE = '#9fb3aa', CHG_POS = '#ff8040';
  const BRUSH_COL = { L: '#55e9ff', R: '#dd8cff' };   // 左電刷青、右電刷紫

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;

  // 斜投影
  function P(x, y, z) { return { x: CX + K * (0.90 * x + 0.42 * z), y: CY + K * (0.18 * x - 0.85 * y - 0.36 * z) }; }

  // ───────── 文字工具（量寬換行，不縮字） ─────────
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = latin ? u : u.trimStart(); } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function lines(ctx, arr, x, y, color, size, lh, align, alpha) { arr.forEach((s, k) => text(ctx, s, x, y + k * lh, color, size, align, alpha)); }

  function arr(ctx, x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(head, L * 0.7);
    const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7); };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline !== false) { ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  function polyLen(p) { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y); return L; }
  function polyAt(p, s) {
    for (let k = 1; k < p.length; k++) {
      const l = Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y);
      if (s <= l || k === p.length - 1) { const u = clamp(s / l, 0, 1); return { x: p[k - 1].x + (p[k].x - p[k - 1].x) * u, y: p[k - 1].y + (p[k].y - p[k - 1].y) * u, dx: (p[k].x - p[k - 1].x) / l, dy: (p[k].y - p[k - 1].y) / l }; }
      s -= l;
    }
  }
  // 沿路徑流動的紅色電流記號：offset＝∫I（純函式），sgn＝目前電流方向，a＝透明度
  function flowMarks(ctx, path, offset, sgn, a, gap, size) {
    if (a < 0.05) return;
    gap = gap || 44; size = size || 1;
    const L = polyLen(path);
    for (let s = ((offset % gap) + gap) % gap; s < L; s += gap) {
      if (s < 10 || s > L - 10) continue;
      const q = polyAt(path, s);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.dy * sgn, q.dx * sgn)); ctx.scale(size, size);
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath();
      ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
    }
  }

  // ───────── 物理（全部是 a、p 的解析式） ─────────
  // ∫|cos a| da 的連續原函數
  function absCosInt(a) { const n = Math.floor((a + Math.PI / 2) / Math.PI); return 2 * n + (n % 2 === 0 ? 1 : -1) * Math.sin(a); }
  function physics(mode, a, s) {
    const c = Math.cos(a);
    const e = -s * c;                                       // 沿 A→B 的感應電動勢（相對值）
    const V = mode === 'dc' ? -s * Math.abs(c) : e;         // 輸出（左電刷 + 為正）
    return {
      a, s, c, e, V,
      qCoil: -Math.sin(a),                                  // ∫e dp
      qExt: mode === 'dc' ? -absCosInt(a) : -Math.sin(a)    // ∫V dp
    };
  }
  const outV = (mode, a, s) => mode === 'dc' ? -s * Math.abs(Math.cos(a)) : -s * Math.cos(a);

  // ───────── 場磁鐵與磁場 ─────────
  function face(ctx, pts, fill, alpha) {
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; poly(ctx, pts); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }
  function drawMagnet(ctx, side, hl) {
    const x0 = side > 0 ? MAGX0 : -MAGX1, x1 = side > 0 ? MAGX1 : -MAGX0;
    const col = side > 0 ? C.poleN : C.poleS, y0 = -MAGY, y1 = MAGY, z0 = MAGZ0, z1 = MAGZ1;
    // 看得到的面：前（z0）、上（y1）、+x 面
    face(ctx, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], shade(col, 0.82));
    face(ctx, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], shade(col, 0.62));
    face(ctx, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], col);
    const c = P((x0 + x1) / 2, 0, z0);
    text(ctx, side > 0 ? 'N' : 'S', c.x, c.y, C.white, 34);
    if (hl > 0.02) {
      ctx.save(); ctx.globalAlpha = hl; ctx.strokeStyle = C.yellow; ctx.lineWidth = 5;
      poly(ctx, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y1, z0)]); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
  }
  function drawField(ctx, hl) {
    const zs = [10], ys = [-80, -40, 0, 40, 80];
    zs.forEach(z => ys.forEach(y => {
      const a = P(MAGX0 - 2, y, z), b = P(-MAGX0 + 2, y, z);
      ctx.save(); ctx.globalAlpha = 0.55 + 0.4 * hl; ctx.strokeStyle = C.green; ctx.lineWidth = y === 0 ? 4 : 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
      [0.18, 0.82].forEach(u => {
        const m = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }, L = Math.hypot(b.x - a.x, b.y - a.y);
        const dx = (b.x - a.x) / L, dy = (b.y - a.y) / L;
        arr(ctx, m.x - dx * 10, m.y - dy * 10, m.x + dx * 10, m.y + dy * 10, C.green, 3, 15, 0.7 + 0.3 * hl, false);
      });
    }));
  }

  // ───────── 線圈、轉軸、換向器／滑環、電刷 ─────────
  function coilCorners(a, r, zf, zb) {
    const c = Math.cos(a), s = Math.sin(a);
    return { A: [r * c, r * s, zf], B: [r * c, r * s, zb], Cc: [-r * c, -r * s, zb], D: [-r * c, -r * s, zf] };
  }
  const PP = v => P(v[0], v[1], v[2]);
  function strokePath3(ctx, pts, color, w) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    poly(ctx, pts.map(PP)); ctx.stroke(); ctx.restore();
  }
  function drawAxle(ctx) {
    const a = P(0, 0, -470), b = P(0, 0, 205);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#5f726b'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = '#b8c9c1'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  }
  function coilWinding(a) {
    const pts = [], N = 3;
    for (let i = 0; i < N; i++) {
      const k = coilCorners(a, R - i * 7, ZF + i * 4, ZB - i * 4);
      if (i === 0) pts.push(k.A); else pts.push(k.A);
      pts.push(k.B, k.Cc, k.D);
    }
    return pts;
  }
  function drawCoil(ctx, a, hl) {
    const pts = coilWinding(a);
    if (hl > 0.02) { ctx.save(); ctx.globalAlpha = hl; strokePath3(ctx, pts, C.yellow, 18); ctx.restore(); }
    strokePath3(ctx, pts, COPPER_DK, 12);
    strokePath3(ctx, pts, COPPER, 7);
    strokePath3(ctx, pts, '#ffd29a', 2);
  }
  // 引線：A → 橘、D → 粉
  function drawLeads(ctx, mode, a) {
    const c = Math.cos(a), s = Math.sin(a), k = coilCorners(a, R - 14, ZF + 8, ZB);
    const zA = mode === 'dc' ? DCZ[1] : ACZ_A[1], zD = mode === 'dc' ? DCZ[1] : ACZ_D[1];
    const rA = mode === 'dc' ? 30 : 30, rD = mode === 'dc' ? 30 : 22;
    const la = [k.A, [rA * c, rA * s, ZF - 30], [rA * c, rA * s, zA]];
    const ld = [k.D, [-rD * c, -rD * s, ZF - 30], [-rD * c, -rD * s, zD]];
    [[la, C.orange], [ld, C.pink]].forEach(([p, col]) => { strokePath3(ctx, p, '#2a1a10', 9); strokePath3(ctx, p, col, 5); });
  }
  // 圓柱片（分裂環半片或完整滑環）：由後往前疊切片
  function cylSlices(z0, z1) { const out = []; const n = 9; for (let i = 0; i <= n; i++) out.push(z1 + (z0 - z1) * i / n); return out; }
  function arcPts(r, t0, t1, z) { const p = []; const n = Math.max(6, Math.ceil(Math.abs(t1 - t0) / 0.12)); for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; p.push(P(r * Math.cos(t), r * Math.sin(t), z)); } return p; }
  function drawSegments(ctx, a, hl) {
    const gap = 0.14, sl = cylSlices(DCZ[0], DCZ[1]);
    const halves = [{ m: a, col: C.orange }, { m: a + Math.PI, col: C.pink }];
    sl.forEach((z, i) => {
      const last = i === sl.length - 1, k = last ? 1 : 0.55 + 0.3 * i / sl.length;
      halves.forEach(h => {
        const pts = arcPts(RING_R, h.m - Math.PI / 2 + gap, h.m + Math.PI / 2 - gap, z);
        ctx.save(); poly(ctx, pts); ctx.closePath(); ctx.fillStyle = shade(h.col === C.orange ? '#ffb347' : '#ff78b7', k); ctx.fill();
        if (last) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.restore();
      });
    });
    const hub = P(0, 0, DCZ[0]);
    ctx.save(); ctx.fillStyle = '#5f726b'; ctx.beginPath(); ctx.ellipse(hub.x, hub.y, 9, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (hl > 0.02) ringHL(ctx, DCZ, hl);
  }
  function ringHL(ctx, zr, hl) {
    const p0 = arcPts(RING_R + 10, 0, TAU, zr[0]);
    ctx.save(); ctx.globalAlpha = hl; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); poly(ctx, p0); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  function drawSlipRing(ctx, zr, col) {
    const sl = cylSlices(zr[0], zr[1]);
    sl.forEach((z, i) => {
      const last = i === sl.length - 1, k = last ? 1 : 0.55 + 0.3 * i / sl.length;
      const outer = arcPts(RING_R, 0, TAU, z);
      ctx.save(); poly(ctx, outer); ctx.closePath(); ctx.fillStyle = shade(col, k); ctx.fill();
      if (last) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
    });
    const hub = P(0, 0, zr[0]);
    ctx.save(); ctx.fillStyle = '#5f726b'; ctx.beginPath(); ctx.ellipse(hub.x, hub.y, 9, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 電刷：side −1 左、+1 右；回傳端子座標
  function brushGeom(mode, side) {
    const z = mode === 'dc' ? (DCZ[0] + DCZ[1]) / 2 : side < 0 ? (ACZ_D[0] + ACZ_D[1]) / 2 : (ACZ_A[0] + ACZ_A[1]) / 2;
    const c = P(side * (RING_R + 2), 0, z);
    const bx = c.x + side * 14;                     // 碳刷中心
    const post = bx + side * 34;                    // 支架立柱 x
    return { c, bx, by: c.y, post, term: { x: post, y: BRUSH_Y } };
  }
  function drawBrush(ctx, mode, side, hl, pol, polA) {
    const g = brushGeom(mode, side), col = side < 0 ? BRUSH_COL.L : BRUSH_COL.R;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 支架：碳刷 → 水平臂 → 立柱 → 端子
    ctx.strokeStyle = '#2b3a36'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(g.bx, g.by); ctx.lineTo(g.post, g.by); ctx.lineTo(g.post, BRUSH_Y); ctx.stroke();
    ctx.strokeStyle = '#a9bab4'; ctx.lineWidth = 6; ctx.stroke();
    // 碳刷本體
    ctx.fillStyle = '#4f5d59'; ctx.strokeStyle = col; ctx.lineWidth = 3;
    rrect(ctx, g.bx - 12, g.by - 14, 24, 28, 5); ctx.fill(); ctx.stroke();
    // 端子
    ctx.fillStyle = '#859691'; ctx.strokeStyle = C.white; ctx.lineWidth = 2;
    rrect(ctx, g.post - 16, BRUSH_Y - 10, 32, 20, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(g.post, BRUSH_Y, 6, 0, TAU); ctx.fill();
    ctx.restore();
    if (hl > 0.02) {
      ctx.save(); ctx.globalAlpha = hl; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(g.bx, g.by, 24, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // +／− 標記（端子外側）
    if (polA > 0.05) {
      const x = g.post + side * 34, y = BRUSH_Y - 2;
      ctx.save(); ctx.globalAlpha = polA; ctx.fillStyle = C.bg; ctx.strokeStyle = pol > 0 ? CHG_POS : C.electron; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, pol > 0 ? '+' : '−', x, y - 1, pol > 0 ? CHG_POS : C.electron, 30, 'center', polA);
    }
  }
  // 外電路：左端子 → 下 → 檢流計左；檢流計右 → 右端子
  function extGeom(mode) {
    const L = brushGeom(mode, -1).term, Rr = brushGeom(mode, 1).term, mx = (L.x + Rr.x) / 2;
    return {
      mx, L, R: Rr,
      a: [{ x: L.x, y: L.y + 10 }, { x: L.x, y: LOOP_Y }, { x: mx - MR, y: LOOP_Y }],
      b: [{ x: mx + MR, y: LOOP_Y }, { x: Rr.x, y: LOOP_Y }, { x: Rr.x, y: Rr.y + 10 }]
    };
  }
  function drawExt(ctx, mode, ph, curA, hl) {
    const g = extGeom(mode);
    if (hl > 0.02) {
      ctx.save(); ctx.globalAlpha = hl; ctx.strokeStyle = C.yellow; ctx.lineWidth = 13; ctx.lineJoin = 'round';
      [g.a, g.b].forEach(p => { poly(ctx, p); ctx.stroke(); }); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = WIRE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [g.a, g.b].forEach(p => { poly(ctx, p); ctx.stroke(); }); ctx.restore();
    const sg = ph.V >= 0 ? 1 : -1, al = curA * clamp(Math.abs(ph.V) / 0.35, 0, 1);
    const off = ph.qExt * 62;
    flowMarks(ctx, g.a, off, sg, al);
    flowMarks(ctx, g.b, off - polyLen(g.a) - 2 * MR, sg, al);
    // 檢流計（中央零點，左電刷 + 時指針偏右）
    const mx = g.mx, my = LOOP_Y, ang = 1.05 * clamp(ph.V, -1, 1);
    ctx.save();
    ctx.fillStyle = '#16302a'; ctx.beginPath(); ctx.arc(mx, my, MR, 0, TAU); ctx.fill();
    ctx.strokeStyle = Math.abs(ph.V) > 0.12 && curA > 0.5 ? C.current : C.muted; ctx.lineWidth = 5; ctx.stroke();
    ctx.translate(mx, my + 14);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
    for (let k = -3; k <= 3; k++) {
      const q = -Math.PI / 2 + k * 0.35; ctx.lineWidth = k === 0 ? 3.5 : 2; ctx.strokeStyle = k === 0 ? C.white : C.muted;
      ctx.beginPath(); ctx.moveTo(Math.cos(q) * 30, Math.sin(q) * 30); ctx.lineTo(Math.cos(q) * 38, Math.sin(q) * 38); ctx.stroke();
    }
    ctx.rotate(ang); ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -38); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'G', mx, my + 22, C.white, 20);
    return g;
  }
  // 線圈裡的電流：有效邊紅箭頭＋沿外圈流動記號
  function drawCoilCurrent(ctx, ph, curA) {
    const al = curA * clamp(Math.abs(ph.e) / 0.3, 0, 1);
    if (al < 0.05) return;
    const k = coilCorners(ph.a, R, ZF, ZB), sg = ph.e > 0 ? 1 : -1;
    const loop = [k.A, k.B, k.Cc, k.D].map(PP);
    flowMarks(ctx, loop, ph.qCoil * 62, sg, al * 0.9, 40, 0.9);
    // 有效邊中段的大箭頭
    [[k.A, k.B], [k.Cc, k.D]].forEach(([u, v]) => {
      let p0 = P(u[0], u[1], u[2] + (v[2] - u[2]) * 0.35), p1 = P(u[0], u[1], u[2] + (v[2] - u[2]) * 0.65);
      if (sg < 0) { const t = p0; p0 = p1; p1 = t; }
      arr(ctx, p0.x, p0.y, p1.x, p1.y, C.current, 7, 22, al);
    });
  }
  // 線圈邊速度（白）
  function drawVelocity(ctx, ph, alpha) {
    if (alpha < 0.05) return;
    const k = coilCorners(ph.a, R, ZF, ZB), sn = Math.sin(ph.a), cs = Math.cos(ph.a);
    const vx = ph.s * -sn, vy = ph.s * cs, L = 46;
    [[k.A, k.B, 1], [k.D, k.Cc, -1]].forEach(([u, v, sgn]) => {
      const m = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2];
      const p0 = PP(m), p1 = P(m[0] + sgn * vx * L, m[1] + sgn * vy * L, m[2]);
      arr(ctx, p0.x, p0.y, p1.x, p1.y, C.white, 5, 15, alpha);
    });
  }
  function drawCornerLetters(ctx, a, alpha) {
    const k = coilCorners(a, R + 20, ZF - 18, ZB + 6);
    [['A', k.A], ['B', k.B], ['C', k.Cc], ['D', k.D]].forEach(([n, v]) => { const p = PP(v); text(ctx, n, p.x, p.y, C.white, 22, 'center', alpha); });
  }
  // 外力轉動的彎箭頭（線圈上方）
  function drawSpinArrow(ctx, s, alpha) {
    const r = 172, z = 10, t0 = s < 0 ? 2.25 : 0.89, t1 = s < 0 ? 0.89 : 2.25;
    const pts = []; for (let i = 0; i <= 24; i++) { const t = t0 + (t1 - t0) * i / 24; pts.push(P(r * Math.cos(t), r * Math.sin(t), z)); }
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.bg; ctx.lineWidth = 11; ctx.lineCap = 'round'; poly(ctx, pts.slice(0, -2)); ctx.stroke();
    ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    const a = pts[pts.length - 3], b = pts[pts.length - 1];
    arr(ctx, a.x, a.y, b.x, b.y, C.white, 6, 22, alpha);
    const m = pts[12];
    // 標籤放左側空白處：線圈角標 A–D 轉到最高點時會掃過弧形箭頭右側（x≈650–720、y≈85–150）
    void m;
    text(ctx, tr('↻ 外力轉動', '↻ Turned by'), 24, 140, C.white, 22, 'left', alpha);
    if (tr('', 'x') !== '') text(ctx, 'an outside force', 24, 170, C.white, 22, 'left', alpha);
  }

  // ───────── 右下「從前方看」小圖 ─────────
  const IX = 790, IY = 372, IW = 200, IH = 222;
  function drawInset(ctx, mode, ph, opt) {
    const cx = IX + IW / 2, cy = IY + 112, Ri = 50;
    ctx.save(); ctx.fillStyle = 'rgba(16,45,38,.92)'; ctx.strokeStyle = opt.hl ? C.yellow : '#58736a'; ctx.lineWidth = opt.hl ? 4 : 2;
    rrect(ctx, IX, IY, IW, IH, 12); ctx.fill(); ctx.stroke(); ctx.restore();
    const head = wrap(ctx, tr('從前方看', 'Front view'), IW - 20, 20);
    lines(ctx, head, cx, IY + 16, C.white, 20, 24);
    // 磁極與 B
    text(ctx, 'S', IX + 14, cy, C.poleS, 22, 'center'); text(ctx, 'N', IX + IW - 14, cy, C.poleN, 22, 'center');
    [-46, 0, 46].forEach(dy => arr(ctx, cx + 76, cy + dy, cx - 76, cy + dy, 'rgba(154,240,111,.6)', 2.5, 12, 1, false));
    // 線圈（截面線）
    const ex = Math.cos(ph.a), ey = -Math.sin(ph.a);
    ctx.save(); ctx.strokeStyle = COPPER; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - ex * Ri, cy - ey * Ri); ctx.lineTo(cx + ex * Ri, cy + ey * Ri); ctx.stroke(); ctx.restore();
    // 中央：DC 分裂環＋電刷；AC 只畫轉軸
    if (mode === 'dc') {
      const rr = 20, gap = 0.18;
      [[ph.a, C.orange], [ph.a + Math.PI, C.pink]].forEach(([m, col]) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.beginPath();
        ctx.arc(cx, cy, rr, -(m + Math.PI / 2 - gap), -(m - Math.PI / 2 + gap)); ctx.stroke(); ctx.restore();
      });
      [-1, 1].forEach(sd => {
        ctx.save(); ctx.fillStyle = '#4f5d59'; ctx.strokeStyle = sd < 0 ? BRUSH_COL.L : BRUSH_COL.R; ctx.lineWidth = 2.5;
        rrect(ctx, cx + sd * 31 - 7, cy - 8, 14, 16, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      });
    } else {
      ctx.save(); ctx.fillStyle = '#b8c9c1'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill(); ctx.restore();
    }
    // 兩條有效邊：⊗（往裡）／⊙（往外）
    const al = clamp(Math.abs(ph.e) / 0.25, 0, 1);
    [[1, 'AB', ph.e > 0], [-1, 'CD', ph.e < 0]].forEach(([sg, nm, into]) => {
      const x = cx + sg * ex * Ri, y = cy + sg * ey * Ri;
      ctx.save(); ctx.fillStyle = '#3a2412'; ctx.strokeStyle = COPPER; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.stroke();
      if (al > 0.05) {
        ctx.globalAlpha = al; ctx.strokeStyle = C.current; ctx.fillStyle = C.current; ctx.lineWidth = 3.5;
        if (into) { ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      // 速度
      const vx = ph.s * -Math.sin(ph.a) * sg, vy = -(ph.s * Math.cos(ph.a) * sg);
      if (opt.vel) arr(ctx, x + vx * 16, y + vy * 16, x + vx * 40, y + vy * 40, C.white, 3.5, 11, 0.9);
      // 標籤放在速度的反側（不壓速度箭頭、不碰 S／N 字）
      const vl = Math.hypot(vx, vy) || 1, lx = x - vx / vl * 27, ly = y - vy / vl * 27 + (Math.abs(vy) > 0.5 ? 0 : 0);
      text(ctx, nm, lx, ly, C.white, 20, 'center', 0.9);
    });
    // 狀態字
    const cs = Math.abs(ph.c);
    let msg = null, col = C.white;
    if (cs > 0.94) { msg = tr('∥B：ε 最大', '∥B: ε max'); col = C.yellow; }
    else if (cs < 0.2) { msg = mode === 'dc' && opt.swap ? tr('⊥B：ε＝0，換接', '⊥B: ε = 0, swap') : tr('⊥B：ε＝0', '⊥B: ε = 0'); col = C.cyan; }
    if (msg) text(ctx, msg, cx, IY + IH - 14, col, 20);
  }

  // ───────── 左下方向面板 ─────────
  function drawPanel(ctx, mode, ph, rows) {
    const x = 16, maxW = 222;
    let y = 392;
    text(ctx, tr('電流方向', 'Current direction'), x, y, C.white, 22, 'left'); y += 36;
    const zero = Math.abs(ph.e) < 0.08;
    rows.forEach(r => {
      let s, col = C.current;
      if (r === 'coil') s = zero ? tr('線圈內：0', 'In coil: 0') : ph.e > 0 ? tr('線圈內：A→B→C→D', 'In coil: A→B→C→D') : tr('線圈內：D→C→B→A', 'In coil: D→C→B→A');
      if (r === 'ext') s = Math.abs(ph.V) < 0.08 ? tr('外電路：0', 'Outside: 0') : ph.V > 0 ? tr('外電路：左 → 右', 'Outside: left → right') : tr('外電路：右 → 左', 'Outside: right → left');
      if (r === 'brush') {
        // 左電刷貼著哪一片（DC：換向片隨轉；AC：永遠粉環）
        if (mode === 'dc') { const pinkLeft = Math.cos(ph.a) > 0; s = pinkLeft ? tr('左電刷貼：粉片（D）', 'Left brush: pink (D)') : tr('左電刷貼：橘片（A）', 'Left brush: orange (A)'); col = pinkLeft ? C.pink : C.orange; }
        else { s = tr('左電刷貼：粉環（D）不換', 'Left brush: pink ring (D), fixed'); col = C.pink; }
      }
      if (r === 'pol') {
        if (Math.abs(ph.V) < 0.08) { s = tr('兩電刷：0', 'Brushes: 0'); col = C.muted; }
        else { s = ph.V > 0 ? tr('左電刷 ＋、右電刷 −', 'Left +, right −') : tr('左電刷 −、右電刷 ＋', 'Left −, right +'); col = C.white; }
      }
      const ls = wrap(ctx, s, maxW, 22);
      lines(ctx, ls, x, y, col, 22, 28, 'left'); y += ls.length * 28 + 10;
    });
  }

  // ───────── 構造名稱標籤 ─────────
  function leader(ctx, x1, y1, x2, y2, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(x2, y2, 4.5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function partLabels(ctx, mode, hlIdx) {
    const al = i => hlIdx === i ? 1 : 0.85, col = i => hlIdx === i ? C.yellow : C.white;
    // 0 場磁鐵
    const sTop = P(-245, MAGY, MAGZ0), nTop = P(245, MAGY, MAGZ1);
    text(ctx, tr('場磁鐵', 'Field magnet'), 150, 112, col(0), 22, 'center', al(0)); leader(ctx, 150, 128, sTop.x - 10, sTop.y + 30, al(0));
    text(ctx, tr('場磁鐵', 'Field magnet'), 905, 230, col(0), 22, 'center', al(0)); leader(ctx, 905, 246, P(285, 40, 0).x + 4, P(285, 40, 0).y, al(0));
    // 1 電樞（線圈）
    const ax = P(0, 0, ZB + 30);
    const t1 = tr('電樞（線圈）', 'Armature (coil)');
    text(ctx, t1, 330, 92, col(1), 22, 'center', al(1));
    leader(ctx, 360, 108, P(-60, 95, ZB).x, P(-60, 95, ZB).y, al(1));
    void ax;
    // 2 分裂環／滑環
    const ringC = mode === 'dc' ? P(-RING_R, -RING_R, DCZ[0]) : P(-RING_R, -RING_R, ACZ_D[0]);
    const t2 = mode === 'dc' ? tr('分裂環（換向器）', 'Split ring (commutator)') : tr('兩個滑環', 'Two slip rings');
    const ls2 = wrap(ctx, t2, 230, 22);
    lines(ctx, ls2, 130, 300, col(2), 22, 28, 'center', al(2));
    leader(ctx, 150, 300 + ls2.length * 28 - 8, ringC.x - 6, ringC.y + 4, al(2));
    // 3 電刷
    const bl = brushGeom(mode, -1), br = brushGeom(mode, 1);
    text(ctx, tr('電刷', 'Brush'), 220, 470, col(3), 22, 'center', al(3)); leader(ctx, 250, 470, bl.bx - 14, bl.by + 8, al(3));
    text(ctx, tr('電刷', 'Brush'), 640, 440, col(3), 22, 'center', al(3)); leader(ctx, 610, 440, br.bx + 14, br.by + 8, al(3));
    // 4 外電路
    const g = extGeom(mode);
    text(ctx, tr('外電路（檢流計 G）', 'External circuit (meter G)'), g.R.x + 30, LOOP_Y + 4, col(4), 22, 'left', al(4));
  }

  // ───────── 步驟資料 ─────────
  const T_SLOW = 8, T_MID = 4;
  const om = T => TAU / T;
  const HL_T = 1.3;                              // 構造步驟每個零件強調 1.3 s
  const DC_STEPS = [
    { dur: 7, b: ['構造', 'Parts'], T: T_SLOW, s: -1, phi0: Math.PI / 2, parts: true,
      cap: ['直流發電機：場磁鐵固定、電樞線圈和分裂環一起轉、電刷固定', 'DC generator: fixed field magnets; the coil and split ring turn together; brushes stay put'],
      res: ['外力轉動電樞（線圈），<strong class="yellow">動能轉換成電能</strong>；場磁鐵固定提供穩定磁場，分裂環跟著線圈一起轉。', 'An outside force turns the armature (coil): <strong class="yellow">kinetic energy becomes electrical energy</strong>. The fixed field magnets give a steady field; the split ring turns with the coil.'] },
    { dur: 8, b: ['切割磁力線', 'Cutting'], T: T_MID, s: -1, phi0: Math.PI / 2, vel: true, panel: ['coil', 'ext'],
      cap: ['線圈邊上下切割磁力線 → 右手定則：感應電流（紅）', 'Coil sides cut the field lines → right-hand rule gives the induced current (red)'],
      res: ['線圈邊<strong class="yellow">切割磁力線</strong>產生感應電流：線圈平面與 B 平行時切割最快、電流最大；與 B 垂直時不切割、電流為 0。', 'The coil sides <strong class="yellow">cut the field lines</strong>: fastest (largest current) when the coil plane is parallel to B, zero when it is perpendicular.'] },
    { dur: 8, b: ['換接', 'Commutate'], T: T_SLOW, s: -1, phi0: Math.PI, vel: true, swap: true, panel: ['coil', 'brush', 'ext'],
      cap: ['線圈與 B 垂直（ε＝0）時，分裂環換接電刷 → 外電路電流方向不變', 'At ⊥B (ε = 0) the split ring swaps brushes → the outside current keeps its direction'],
      res: ['分裂環每半圈交換接點：線圈裡的電流反向了，但換接後流出左電刷的方向不變，外電路電流<strong class="pink">永遠同一個方向</strong>。', 'The split ring swaps contacts every half-turn: the current in the coil reverses, but after the swap it still leaves through the left brush, so the outside current <strong class="pink">always flows one way</strong>.'] },
    { dur: 7, b: ['波形', 'Waveform'], T: T_MID, s: -1, phi0: Math.PI / 2, wave: true, panel: ['pol', 'ext'],
      cap: ['輸出波形：全部在 0 以上的脈動直流', 'Output: pulsing DC, entirely above 0'],
      res: ['分裂環讓輸出的電流方向永遠保持一致（正向或負向）。', 'The split ring keeps the output current in one direction (all positive or all negative).'] },
    { dur: 9, b: ['反轉', 'Reverse'], T: T_MID, s: 1, phi0: Math.PI / 2, wave: true, vel: true, panel: ['pol', 'ext'],
      cap: ['反向轉動 → 整流出方向相反的負向脈衝（整條在 0 以下）', 'Turn it backward → rectified pulses in the opposite direction (all below 0)'],
      res: ['反轉發電機，整流出方向相反的負向脈衝！', 'Reverse the generator and it rectifies into negative pulses in the opposite direction!'] }
  ];
  const AC_STEPS = [
    { dur: 7, b: ['構造', 'Parts'], T: T_SLOW, s: -1, phi0: Math.PI / 2, parts: true,
      cap: ['交流發電機：分裂環換成兩個一前一後的完整滑環，各接一個電刷', 'AC generator: the split ring becomes two full slip rings, one behind the other, each with its own brush'],
      res: ['同一部機器，把分裂環改成<strong class="cyan">兩個完整的滑環</strong>：A 端接橘環、D 端接粉環，各自一直貼著同一個電刷。', 'Same machine, but the split ring is replaced by <strong class="cyan">two full slip rings</strong>: end A to the orange ring, end D to the pink ring, each always touching the same brush.'] },
    { dur: 8, b: ['最大與零', 'Max & zero'], T: T_SLOW, s: -1, phi0: Math.PI, vel: true, maxzero: true,
      cap: ['線圈平面 ∥ B：切割最快，ε 最大；⊥ B（中性面）：不切割，ε＝0', 'Coil plane ∥ B: fastest cutting, ε max; ⊥ B (neutral plane): no cutting, ε = 0'],
      res: ['線圈平面與 B <strong class="yellow">平行</strong>時，線圈邊垂直切割磁力線，感應電動勢最大；與 B <strong class="cyan">垂直</strong>時沿著磁力線移動，感應電動勢為 0。', 'When the coil plane is <strong class="yellow">parallel</strong> to B the sides cut straight across the field lines: maximum emf. When it is <strong class="cyan">perpendicular</strong> they slide along the lines: zero emf.'] },
    { dur: 8, b: ['極性交換', 'Polarity flips'], T: T_MID, s: -1, phi0: Math.PI / 2, vel: true, panel: ['coil', 'pol', 'ext'],
      cap: ['每轉半圈，線圈邊切割方向相反 → 兩電刷極性交換、外電路電流反向', 'Every half-turn the sides cut the other way → the brushes swap polarity and the outside current reverses'],
      res: ['滑環<strong class="cyan">不換接</strong>：是線圈邊切割磁力線的方向每半圈相反，所以兩個電刷的正負極自然交換，外電路電流跟著反向。', 'The slip rings <strong class="cyan">never swap</strong>: the sides cut the field the other way every half-turn, so the two brushes naturally swap + and − and the outside current reverses.'] },
    { dur: 7, b: ['波形', 'Waveform'], T: T_MID, s: -1, phi0: Math.PI / 2, wave: true, panel: ['pol', 'ext'],
      cap: ['輸出波形：在 0 的上下交替——交流電', 'Output: swings above and below 0 — alternating current'],
      res: ['波形在 0 的上下交替：正半週、負半週輪流出現，這就是交流電。', 'The waveform swings above and below 0: positive and negative half-cycles take turns. That is AC.'] },
    { dur: 10, b: ['直流對照', 'vs DC'], T: T_MID, s: -1, phi0: Math.PI / 2, wave: true, compare: true,
      cap: ['分裂環 → 直流；滑環 → 交流。兩者都是外力轉動：動能 → 電能', 'Split ring → DC; slip rings → AC. Both are turned by a force: kinetic → electrical energy'],
      res: ['分裂環每半圈換接，輸出單一方向的直流；滑環不換接，輸出正負交替的交流。兩者都把<strong class="yellow">動能</strong>轉換成<strong class="cyan">電能</strong>。', 'The split ring swaps every half-turn and gives one-way DC; slip rings never swap and give alternating AC. Both convert <strong class="yellow">kinetic</strong> into <strong class="cyan">electrical energy</strong>.'] }
  ];

  function stepState(st, tl) {
    const p = om(st.T) * tl, a = st.phi0 + st.s * p;
    return { p, a };
  }

  // ───────── 主圖 ─────────
  function drawModel(ctx, mode, st, tl) {
    const { p, a } = stepState(st, tl), ph = physics(mode, a, st.s);
    const hlIdx = st.parts ? Math.floor(tl / HL_T) % 5 : -1;
    const hlA = i => hlIdx === i ? 0.55 + 0.45 * Math.sin(tl * 6) ** 2 : 0;
    // 由後往前：磁鐵、磁場、轉軸、線圈、引線、換向器／滑環（z 小＝離觀眾近：先畫橘環 A，再畫粉環 D 蓋在前面）、電刷、外電路
    drawMagnet(ctx, -1, hlA(0));
    drawField(ctx, st.maxzero ? 0.4 : 0);           // 磁力線從 N 內側面出發，被 N 的前面擋住
    drawMagnet(ctx, 1, hlA(0));
    drawAxle(ctx);
    drawCoil(ctx, a, hlA(1));
    drawCoilCurrent(ctx, ph, st.parts ? 0.55 : 1);
    if (st.vel) drawVelocity(ctx, ph, 1);
    drawLeads(ctx, mode, a);
    // 2026-11-05 老師指出：視角在右前方，左電刷貼在換向器／滑環「背面」那一側，要先畫（被環蓋住）；右電刷在正面，最後畫。
    const polA = st.parts ? 0 : clamp(Math.abs(ph.V) / 0.12, 0, 1);
    const swapGlow = st.swap ? clamp(1 - Math.abs(ph.c) / 0.3, 0, 1) : 0;
    drawBrush(ctx, mode, -1, hlA(3) || swapGlow, ph.V, polA);
    if (mode === 'dc') drawSegments(ctx, a, hlA(2) || (st.swap ? 0.35 + 0.65 * clamp(1 - Math.abs(ph.c) / 0.3, 0, 1) : 0));
    else { drawSlipRing(ctx, ACZ_A, '#ffb347'); drawSlipRing(ctx, ACZ_D, '#ff78b7'); if (hlA(2)) { ringHL(ctx, ACZ_A, hlA(2)); ringHL(ctx, ACZ_D, hlA(2)); } }
    drawBrush(ctx, mode, 1, hlA(3) || swapGlow, -ph.V, polA);
    drawExt(ctx, mode, ph, st.parts ? 0.55 : 1, hlA(4));
    drawSpinArrow(ctx, st.s, 0.95);
    drawCornerLetters(ctx, a, st.parts ? 0.9 : 0.8);
    if (st.parts) partLabels(ctx, mode, hlIdx);
    else drawInset(ctx, mode, ph, { vel: !!st.vel, swap: !!st.swap, hl: !!(st.swap || st.maxzero) });
    if (st.panel) drawPanel(ctx, mode, ph, st.panel);
    if (st.swap && Math.abs(ph.c) < 0.22) {
      const g = brushGeom(mode, -1), al = clamp(1 - Math.abs(ph.c) / 0.22, 0, 1);
      text(ctx, tr('換接！', 'Swap!'), g.post - 70, g.by - 40, C.yellow, 28, 'center', al);
    }
    if (st.maxzero) drawMaxZero(ctx, ph);
    if (st.compare) drawCompareBox(ctx);
    return { ph, p };
  }
  // AC 第 2 步：線圈旁的狀態標籤
  function drawMaxZero(ctx, ph) {
    const cs = Math.abs(ph.c);
    const x = 16, y = 420, maxW = 236;
    text(ctx, tr('現在的線圈', 'The coil now'), x, y, C.white, 22, 'left');
    let s, col;
    if (cs > 0.9) { s = tr('∥ B → ε 最大', '∥ B → ε max'); col = C.yellow; }
    else if (cs < 0.25) { s = tr('⊥ B → ε＝0', '⊥ B → ε = 0'); col = C.cyan; }
    else { s = tr('斜切 → ε 介於中間', 'At a slant → ε in between'); col = C.muted; }
    lines(ctx, wrap(ctx, s, maxW, 26), x, y + 40, col, 26, 32, 'left');
    const bar = clamp(cs, 0, 1);
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,.12)'; rrect(ctx, x, y + 84, 220, 22, 6); ctx.fill();
    ctx.fillStyle = C.yellow; rrect(ctx, x, y + 84, Math.max(6, 220 * bar), 22, 6); ctx.fill(); ctx.restore();
    text(ctx, tr('|ε| 大小', '|ε| size'), x, y + 130, C.white, 20, 'left');
  }
  function drawCompareBox(ctx) {
    const x = 16, y = 392, maxW = 222;
    const rows = [
      [tr('分裂環：每半圈換接', 'Split ring: swaps each half-turn'), C.pink],
      [tr('→ 直流（單一方向）', '→ DC (one way)'), C.pink],
      [tr('滑環：不換接', 'Slip rings: never swap'), C.yellow],
      [tr('→ 交流（正負交替）', '→ AC (alternating)'), C.yellow],
      [tr('動能 → 電能', 'Kinetic → electrical'), C.cyan]
    ];
    let yy = y;
    rows.forEach(([s, col], k) => { const ls = wrap(ctx, s, maxW, 22); lines(ctx, ls, x, yy, col, 22, 28, 'left'); yy += ls.length * 28 + (k % 2 === 1 ? 12 : 4); });
  }

  // ───────── 波形圖 ─────────
  const GX = 112, GW = 846, GT = 66, GB = 278, Y0 = (GT + GB) / 2, AMP = 92, PMAX = 4 * Math.PI;
  const px = p => GX + GW * p / PMAX;
  function curve(ctx, mode, st, p0, p1, color, w, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    const n = Math.max(2, Math.ceil((p1 - p0) / 0.03));
    for (let i = 0; i <= n; i++) { const p = p0 + (p1 - p0) * i / n, v = outV(mode, st.phi0 + st.s * p, st.s); const x = px(p), y = Y0 - v * AMP; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function fillArea(ctx, mode, st, p0, p1, color) {
    if (p1 <= p0) return;
    ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(px(p0), Y0);
    const n = Math.max(2, Math.ceil((p1 - p0) / 0.03));
    for (let i = 0; i <= n; i++) { const p = p0 + (p1 - p0) * i / n; ctx.lineTo(px(p), Y0 - outV(mode, st.phi0 + st.s * p, st.s) * AMP); }
    ctx.lineTo(px(p1), Y0); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawWave(ctx, mode, st, tl, p) {
    const col = mode === 'dc' ? C.pink : C.yellow;
    // 標題
    let title;
    if (mode === 'dc') title = st.s > 0 ? tr('輸出：直流電（負向脈衝）', 'Output: DC (negative pulses)') : tr('輸出：直流電（正向脈衝）', 'Output: DC (positive pulses)');
    else title = tr('輸出：交流電（正負交替）', 'Output: AC (alternating ±)');
    text(ctx, title, GX, 32, col, 24, 'left');
    if (st.compare) {
      const lx = GX + GW;
      text(ctx, tr('粉虛線＝分裂環（直流）', 'Pink dashed = split ring (DC)'), lx, 32, C.pink, 20, 'right');
    } else {
      const sub = tr('輸出電流（左電刷 ＋ 為正）', 'Output current (+ = left brush +)');
      if (textW(ctx, title, 24) + textW(ctx, sub, 20) + 40 < GW) text(ctx, sub, GX + GW, 32, C.muted, 20, 'right');
    }
    // 格線與軸
    ctx.save(); ctx.strokeStyle = 'rgba(85,233,255,.16)'; ctx.lineWidth = 2;
    for (let k = 0; k <= 8; k++) { const x = GX + GW * k / 8; ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke(); }
    [Y0 - AMP, Y0 + AMP].forEach(y => { ctx.beginPath(); ctx.moveTo(GX, y); ctx.lineTo(GX + GW, y); ctx.stroke(); });
    ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3; ctx.strokeRect(GX, GT, GW, GB - GT);
    ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(GX, Y0); ctx.lineTo(GX + GW, Y0); ctx.stroke();
    ctx.restore();
    text(ctx, '+', GX - 22, Y0 - AMP, C.white, 26); text(ctx, '0', GX - 22, Y0, C.white, 22); text(ctx, '−', GX - 22, Y0 + AMP, C.white, 26);
    // 刻度：轉過角度＋線圈方向小圖示
    text(ctx, tr('轉角', 'Turned'), GX - 14, 306, C.muted, 20, 'right');
    text(ctx, tr('線圈', 'Coil'), GX - 14, 338, C.muted, 20, 'right');
    for (let k = 0; k <= 8; k++) {
      const pp = k * Math.PI / 2, x = px(pp);
      text(ctx, `${k * 90}°`, clamp(x, GX + 24, GX + GW - 24), 306, C.muted, 20);
      const a = st.phi0 + st.s * pp, ix = clamp(x, GX + 18, GX + GW - 18), iy = 338;
      const perp = Math.abs(Math.cos(a)) < 0.01;
      ctx.save(); ctx.strokeStyle = perp ? C.cyan : C.yellow; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ix - 13 * Math.cos(a), iy + 13 * Math.sin(a)); ctx.lineTo(ix + 13 * Math.cos(a), iy - 13 * Math.sin(a)); ctx.stroke();
      ctx.fillStyle = '#b8c9c1'; ctx.beginPath(); ctx.arc(ix, iy, 3, 0, TAU); ctx.fill(); ctx.restore();
    }
    // 軌跡：以 720° 為一個視窗，超過就從頭重畫（純函式）
    const win = Math.floor(p / PMAX), p0 = win * PMAX, pc = p - p0;
    const stShift = Object.assign({}, st, { phi0: st.phi0 + st.s * p0 });
    if (st.wave) {
      fillArea(ctx, mode, stShift, 0, pc, mode === 'dc' ? 'rgba(255,120,183,.22)' : 'rgba(255,243,106,.18)');
      curve(ctx, mode, stShift, 0, PMAX, col, 3, [4, 8]);       // 預告整段（淡虛線）
    }
    if (st.compare) curve(ctx, 'dc', stShift, 0, PMAX, C.pink, 4, [12, 9]);
    curve(ctx, mode, stShift, 0, pc, col, 6);
    // 正負半週標籤（AC 波形步）
    if (st.wave && mode === 'ac' && !st.compare) {
      for (let k = 0; k < 4; k++) {
        const pm = (k + 0.5) * Math.PI; if (pc < pm + 0.6) continue;
        const v = outV(mode, stShift.phi0 + stShift.s * pm, st.s);
        text(ctx, v > 0 ? tr('正半週', '+ half') : tr('負半週', '− half'), px(pm), Y0 - Math.sign(v) * 34, v > 0 ? C.yellow : C.yellow, 20);
      }
    }
    if (st.wave && mode === 'dc' && pc > Math.PI * 1.2) {
      const s = st.s > 0 ? tr('整條在 0 以下', 'All below 0') : tr('全部在 0 以上', 'All above 0');
      const pm = 1.5 * Math.PI; text(ctx, s, px(pm), Y0 + (st.s > 0 ? 34 : -34), C.pink, 20);
    }
    // 移動標記
    const v = outV(mode, stShift.phi0 + stShift.s * pc, st.s), x = px(pc), y = Y0 - v * AMP;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = C.white; ctx.strokeStyle = C.bg; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 950, 24);
    lines(ctx, ls, W / 2, ls.length > 1 ? 24 : 34, C.yellow, 24, 28, 'center');
  }

  // ───────── 場景表 ─────────
  function mk(mode, steps) { const starts = []; let s = 0; steps.forEach(x => { starts.push(s); s += x.dur; }); return { mode, steps, starts, total: s }; }
  const SCENES = { 'dc-motor-review': mk('dc', DC_STEPS), 'ac-generator-model': mk('ac', AC_STEPS) };

  // ───────── 播放迴圈（單一 RAF，同時畫兩張畫布） ─────────
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  let lastResult = '';
  const cvM = () => document.getElementById('genModelCanvas');
  const cvW = () => document.getElementById('genWaveCanvas');
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('generatorResult'); if (el) el.innerHTML = html;
  }
  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.bg; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }
  function prep(c, h) {
    const ctx = c.getContext('2d'), k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, h); return ctx;
  }
  function fade(ctx, h, tl) {
    const f = clamp(1 - tl / 0.35, 0, 1);
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, h); ctx.restore(); }
  }
  function render() {
    const cm = cvM(), cw = cvW(); if (!cm || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t), st = sc.steps[i], tl = S.t - sc.starts[i];
    const ctx = prep(cm, H);
    const r = drawModel(ctx, sc.mode, st, tl);
    fade(ctx, H, tl);
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, sc, S.t);
    if (cw) { const w = prep(cw, WH); drawWave(w, sc.mode, st, tl, r.p); fade(w, WH, tl); }
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-gen');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-gen'); if (!row) return;
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
  let stepStop = true;
  function visible() { const c = cvM(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    // 老師講解的暫停：EmiAnim.ctl.paused 為真時時間凍住（畫面是 t 的純函式，所以畫面也凍住）
    if (S.last && !(window.EmiAnim.ctl && window.EmiAnim.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    // AGENTS 10.6（2026-11-05）：學生模式一次只播一個步驟，播完停在該步最後一幀（不循環、不自動接下一步）。
    // setStepStop(false)＝步驟間不停、連播到底再停住（老師講解用；本頁未做老師模式）。
    {
      // 以「上一幀正在播的步驟」為準；剛跳步或重畫（S.step＝-1）時才由 t 推算
      let kk = S.step >= 0 ? S.step : 0;
      if (S.step < 0) while (kk + 1 < sc.starts.length && S.t >= sc.starts[kk + 1]) kk++;
      const end = stepStop ? (sc.starts[kk + 1] !== undefined ? sc.starts[kk + 1] : sc.total) : sc.total;
      if (S.t >= end) {
        S.t = end - 1e-3; render();
        // 老師講解（stepStop＝false）連播到整段結尾：通知一次，讓外層接力下一個場景或標示播完
        const ctl = window.EmiAnim.ctl;
        if (!stepStop && !S.ended && ctl && typeof ctl.onEnd === 'function') { S.ended = true; ctl.onEnd(); }
        return;
      }
    }
    render();
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

  window.EmiAnim.gen = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'dc-motor-review';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.scene = null; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-gen'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      lastResult = ''; S.step = -1;
      buildButtons(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.scene) start(); },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; stop(); S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
