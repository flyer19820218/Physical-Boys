/* magnetism_1_compass_1104_v1.js — 「磁場與指南針」分頁動畫（#compassCanvas，1000×600）
 *
 * 契約：window.MagAnim.compass = { activate(sceneId), deactivate(), relang() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、line、drawMagnet、drawCompass、getBField、
 * drawSymmetricFieldLines、compassPoles（直接呼叫，不複製、不修改；compassPoles 若不存在則用同值備援）。
 * 磁針角度一律 = atan2(getBField().by, bx)，即 N 極指向磁場方向（磁力線切線方向）。
 * 磁力線用 drawSymmetricFieldLines 錄成路徑一次（快取成 Path2D），播放時只重畫路徑。
 * 注意：drawSymmetricFieldLines 內部會讀頁面的 lineState.type；本檔建快取時暫設為 'single'，畫完立即還原。
 * 畫布不綁任何事件；唯一控制是 #steps-compass 裡的步驟鈕（每場景 ≤5 個）。
 * 磁鐵：drawMagnet(ctx,350,270,300,60,true) → 左半 N（紅，磁極 x=370）、右半 S（藍，磁極 x=630）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * compass-tangent 磁力線切線方向，共 48.0 s
 *   1 放進磁場 9.0 s  磁針放在磁鐵上方，從兩個不同角度擺盪後都停在同一方向 → 該點磁場方向（青箭頭）
 *   2 沿線移動 12.0 s 磁力線出現；磁針沿一條磁力線由 N 側走到 S 側，黃色虛線切線始終與 N 極同向
 *   3 切線     13.0 s 小球沿磁力線跑，某一刻「放手」沿切線直直飛出；在放手點放上磁針，方向相同（兩次）
 *   4 其他位置 14.0 s 磁鐵側面、上方、下方、磁極附近共 6 處磁針逐一出現，都對齊切線（含停留）
 * compass-space 空間中的指向，共 52.0 s
 *   1 異名相吸 11.0 s 磁針靠近 S 極端：N 極被 S 極吸引；再靠近 N 極端：S 極被 N 極吸引
 *   2 環繞擺放 11.0 s 8 根磁針一根根出現在磁鐵四周，各自轉到正確方向
 *   3 磁力線   11.0 s 畫出帶箭頭的磁力線；逐一標出每根磁針的切線（黃），N 極順著箭頭
 *   4 考題     19.0 s 輪播三個考試位置：磁鐵上方、N 極外側、磁鐵正下方，先問後答（含停留）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.MagAnim = window.MagAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, GREEN = C.green, RED = C.poleN;
  const CHALK = '#f2ecd9';
  const LINE_COLOR = 'rgba(85,233,255,0.82)';   // 磁力線：青色（與本頁其他分頁一致）
  const POLES = (typeof compassPoles !== 'undefined' && compassPoles) ? compassPoles
    : [{ x: 370, y: 300, m: 80000 }, { x: 630, y: 300, m: -80000 }];
  const MX = 350, MY = 270, MWID = 300, MHT = 60;  // 磁鐵（與頁面相同）
  const R = 40;                                   // 磁針半徑（與頁面相同）

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  function fang(x, y) { const B = getBField(x, y, POLES); return Math.atan2(B.by, B.bx); }
  // 擺盪：由 start 角度開始，阻尼振盪後停在 target（τ<0 時維持 start）
  function swing(target, start, tau) {
    if (tau <= 0) return start;
    return target + wrapA(start - target) * Math.exp(-1.7 * tau) * Math.cos(6 * tau);
  }
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fit(ctx, s, size, maxW) { while (size > 22 && textW(ctx, s, size) > maxW) size--; return size; }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, w = 4, a = 1, dash) {
    if (a <= 0) return;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, [[x1, y1], [x2 - Math.cos(ang) * 10, y2 - Math.sin(ang) * 10]], color, w, dash || []);
    arrowHead(ctx, x2 - Math.cos(ang) * 6, y2 - Math.sin(ang) * 6, ang, color, 13);
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function glowRing(ctx, x, y, r, color, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 有底色的小標籤（避免字壓在磁力線上）
  function tag(ctx, s, x, y, color, a = 1, size = 24) {
    if (a <= 0 || !s) return;
    size = fit(ctx, s, size, W - 60);
    const w = textW(ctx, s, size) + 22;
    x = clamp(x, w / 2 + 8, W - w / 2 - 8);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.92)'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.78, w, size * 1.56, 8); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
  }
  function topMsg(ctx, s, color, a = 1) {
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, 6, W, 52); ctx.restore();
    if (!s || a <= 0) return;
    const size = fit(ctx, s, 26, W - 40);
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, W / 2, 33, color, 'center', size); ctx.restore();
  }
  function botMsg(ctx, s, color, a = 1) {
    if (!s || a <= 0) return;
    const size = fit(ctx, s, 24, W - 40);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, 550, W, 46);
    label(ctx, s, W / 2, 573, color, 'center', size); ctx.restore();
  }
  function compass(ctx, x, y, ang, a = 1) {
    if (a <= 0) return;
    if (a >= 1) { drawCompass(ctx, x, y, ang, R); return; }
    ctx.save(); ctx.globalAlpha = a; drawCompass(ctx, x, y, ang, R); ctx.restore();
  }
  // 黃色虛線切線（穿過磁針中心）
  function tangent(ctx, x, y, ang, half, a) {
    if (a <= 0) return;
    const c = Math.cos(ang), s = Math.sin(ang);
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, [[x - c * half, y - s * half], [x + c * half, y + s * half]], YELLOW, 3.5, [11, 8]);
    ctx.restore();
  }
  function magnet(ctx) { drawMagnet(ctx, MX, MY, MWID, MHT, true); }
  function clearOfMagnet(x, y, m) {
    const dx = Math.max(MX - x, 0, x - (MX + MWID)), dy = Math.max(MY - y, 0, y - (MY + MHT));
    return Math.hypot(dx, dy) >= m;
  }

  // ───────── 磁力線快取：把 drawSymmetricFieldLines 的輸出「錄下來」 ─────────
  function recorder() {
    const paths = [], arrows = []; let cur = null, tf = [0, 0, 0], stack = [];
    return {
      paths, arrows, lineWidth: 1, lineCap: 'butt', strokeStyle: '', fillStyle: '',
      save() { stack.push(tf.slice()); }, restore() { if (stack.length) tf = stack.pop(); },
      beginPath() { cur = []; }, moveTo(x, y) { if (!cur) cur = []; cur.push(x, y); }, lineTo(x, y) { if (!cur) cur = []; cur.push(x, y); },
      stroke() { if (cur && cur.length >= 4 && tf[0] === 0 && tf[1] === 0 && tf[2] === 0) paths.push(cur); cur = null; },
      translate(x, y) { tf[0] += x; tf[1] += y; }, rotate(a) { tf[2] += a; },
      fill() { if (tf[0] || tf[1]) arrows.push([tf[0], tf[1], tf[2]]); cur = null; },
      setLineDash() {}, closePath() {}
    };
  }
  let LC = null;
  const TRACK_NEAR = { x: 500, y: 140 };   // 第 2、3 步使用「通過磁鐵上方這一點附近」的那條磁力線
  function buildLines() {
    if (LC) return LC;
    const rec = recorder();
    const hasLS = typeof lineState !== 'undefined' && lineState;
    const saved = hasLS ? lineState.type : null;
    try {
      if (hasLS) lineState.type = 'single';
      drawSymmetricFieldLines(rec, POLES, 14, 2, LINE_COLOR, true);
    } finally { if (hasLS) lineState.type = saved; }
    const runs = [];
    for (const pts of rec.paths) {
      const xs = [], ys = [];
      for (let i = 0; i < pts.length; i += 2) { xs.push(pts[i]); ys.push(pts[i + 1]); }
      const B = getBField(xs[0], ys[0], POLES);
      if (B.bx * (xs[1] - xs[0]) + B.by * (ys[1] - ys[0]) < 0) { xs.reverse(); ys.reverse(); }  // 點序 = 磁場方向
      let run = null;
      for (let i = 0; i < xs.length; i++) {
        const inside = xs[i] > -30 && xs[i] < W + 30 && ys[i] > -30 && ys[i] < H + 30;
        if (inside) { if (!run) run = { x: [], y: [] }; run.x.push(xs[i]); run.y.push(ys[i]); }
        else if (run) { if (run.x.length > 1) runs.push(run); run = null; }
      }
      if (run && run.x.length > 1) runs.push(run);
    }
    const all = new Path2D();
    for (const r of runs) { all.moveTo(r.x[0], r.y[0]); for (let i = 1; i < r.x.length; i++) all.lineTo(r.x[i], r.y[i]); }
    const heads = new Path2D();
    for (const [x, y, a] of rec.arrows) {
      const c = Math.cos(a), s = Math.sin(a);
      heads.moveTo(x - s * -8, y + c * -8); heads.lineTo(x + c * 14, y + s * 14); heads.lineTo(x - s * 8, y + c * 8); heads.closePath();
    }
    // 軌道：最接近 TRACK_NEAR 的那條磁力線；可走的段落 = 離磁鐵夠遠、且在畫面安全區內的連續段
    let best = null, bd = 1e9;
    for (const r of runs) for (let i = 0; i < r.x.length; i++) {
      const d = Math.hypot(r.x[i] - TRACK_NEAR.x, r.y[i] - TRACK_NEAR.y); if (d < bd) { bd = d; best = [r, i]; }
    }
    const [tr0, i0] = best;
    const ok = i => clearOfMagnet(tr0.x[i], tr0.y[i], 64) && tr0.y[i] >= 100 && tr0.y[i] <= 530 && tr0.x[i] >= 60 && tr0.x[i] <= 940;
    let a = i0, b = i0;
    while (a > 0 && ok(a - 1)) a--;
    while (b < tr0.x.length - 1 && ok(b + 1)) b++;
    const track = { x: [], y: [], s: [], len: 0 };
    for (let i = a; i <= b; i++) {
      const n = track.x.length;
      track.s.push(n ? track.s[n - 1] + Math.hypot(tr0.x[i] - track.x[n - 1], tr0.y[i] - track.y[n - 1]) : 0);
      track.x.push(tr0.x[i]); track.y.push(tr0.y[i]);
    }
    track.len = track.s[track.s.length - 1];
    const hl = new Path2D(); hl.moveTo(tr0.x[0], tr0.y[0]); for (let i = 1; i < tr0.x.length; i++) hl.lineTo(tr0.x[i], tr0.y[i]);
    return (LC = { all, heads, track, hl });
  }
  function trackAt(s) {
    const T = buildLines().track; s = clamp(s, 0, T.len);
    let lo = 0, hi = T.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T.s[m] <= s) lo = m; else hi = m; }
    const k = T.s[hi] > T.s[lo] ? (s - T.s[lo]) / (T.s[hi] - T.s[lo]) : 0;
    return { x: lerp(T.x[lo], T.x[hi], k), y: lerp(T.y[lo], T.y[hi], k) };
  }
  function drawLines(ctx, a, hlA = 0) {
    if (a <= 0 && hlA <= 0) return;
    const L = buildLines();
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (a > 0) {
      ctx.globalAlpha = a; ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 2.5; ctx.stroke(L.all);
      ctx.fillStyle = LINE_COLOR; ctx.fill(L.heads);
    }
    if (hlA > 0) {
      ctx.globalAlpha = hlA; ctx.strokeStyle = CYAN; ctx.lineWidth = 5; ctx.shadowColor = CYAN; ctx.shadowBlur = 10; ctx.stroke(L.hl);
    }
    ctx.restore();
  }

  // ═════════ 場景 1：磁力線切線方向 ═════════
  const P0 = { x: 500, y: 150 };
  const OTHER = [[185, 300, 0.5], [325, 168, 2.2], [675, 168, -2.6], [815, 300, 1.4], [660, 452, -1.0], [340, 452, 2.8]];
  function drawTangent(ctx, step, t) {
    if (step === 0) {
      magnet(ctx);
      const target = fang(P0.x, P0.y);
      const second = t >= 4.6;
      const tau = second ? t - 5.0 : t - 0.9;
      const ang = swing(target, second ? -2.1 : 2.4, tau);
      const al = second ? seg(t, 4.6, 5.0) : seg(t, 0.2, 0.7) * (1 - seg(t, 4.2, 4.6));
      const arrA = second ? seg(t, 7.6, 8.1) : seg(t, 3.5, 4.0) * (1 - seg(t, 4.2, 4.4));
      const c = Math.cos(target), s = Math.sin(target);
      arrow(ctx, P0.x + c * (R + 8), P0.y + s * (R + 8), P0.x + c * (R + 120), P0.y + s * (R + 120), CYAN, 5, arrA);
      compass(ctx, P0.x, P0.y, ang, al);
      tag(ctx, tr('該點的磁場方向', 'Field direction here'), P0.x + c * (R + 120) + 140, P0.y, CYAN, arrA);
      tag(ctx, second ? tr('換個角度再放一次', 'Start it at another angle') : tr('放進磁場，讓它自由轉動', 'Let it turn freely in the field'),
        P0.x, 222, CHALK, second ? seg(t, 4.6, 5.0) * (1 - seg(t, 6.8, 7.2)) : seg(t, 0.4, 0.8) * (1 - seg(t, 3.0, 3.4)), 22);
      topMsg(ctx, tr('小磁針靜止後，N 極所指 = 該點的磁場方向', 'At rest, the N pole shows the field direction there'), CHALK);
      botMsg(ctx, tr('不論一開始朝哪裡，靜止後都指向同一方向', 'Whatever way it starts, it settles the same way'), YELLOW, seg(t, 7.8, 8.3));
    } else if (step === 1) {
      const la = 0.55 * easeIO(seg(t, 0, 1.0)), hl = easeIO(seg(t, 0.6, 1.4));
      drawLines(ctx, la, hl);
      magnet(ctx);
      const T = buildLines().track;
      const f = easeIO(seg(t, 1.6, 10.6));
      const p = trackAt(f * T.len), ang = fang(p.x, p.y);
      tangent(ctx, p.x, p.y, ang, 92, seg(t, 1.0, 1.6));
      compass(ctx, p.x, p.y, ang, seg(t, 0.8, 1.4));
      topMsg(ctx, tr('磁針沿著磁力線移動：N 極永遠指著切線方向', 'Move the needle along a field line'), CHALK);
      botMsg(ctx, tr('磁力線切線方向 = 磁針 N 極方向', 'Tangent of the field line = direction of the N pole'), YELLOW, seg(t, 1.4, 2.0));
    } else if (step === 2) {
      drawLines(ctx, 0.35, 1);
      magnet(ctx);
      const T = buildLines().track;
      const runs = [[0.5, 3.5, 0.26], [6.6, 9.6, 0.62]];   // [出發, 放手, 放手點(軌道比例)]
      let phase = 0;
      runs.forEach(([t0, t1, fr], k) => {
        if (t < t0) return;
        const sR = fr * T.len, v = sR / (t1 - t0);
        const A = trackAt(sR), dA = fang(A.x, A.y), c = Math.cos(dA), s = Math.sin(dA);
        const done = k === 0 ? 1 - seg(t, 6.2, 6.6) : 1;
        if (t >= t1) {
          const u = t - t1;
          tangent(ctx, A.x, A.y, dA, 150, seg(u, 0, 0.4) * done);
          compass(ctx, A.x, A.y, dA, seg(u, 1.4, 2.0) * done);
          const bx = A.x + c * v * u, by = A.y + s * v * u, ba = 1 - seg(u, 1.6, 2.2);
          if (ba > 0) ball(ctx, bx, by, ba);
          phase = u < 1.4 ? 2 : 3;
        } else {
          const p = trackAt(v * (t - t0));
          ball(ctx, p.x, p.y, seg(t, t0, t0 + 0.3));
          phase = 1;
        }
      });
      topMsg(ctx, tr('切線：沿曲線運動的物體，瞬間「飛出去」的方向', 'Tangent: the way an object flies off a curve'), CHALK);
      const bm = [null,
        [tr('小球沿著磁力線（曲線）跑……', 'A ball runs along the curved field line...'), CHALK],
        [tr('放手！它沿著切線直直飛出去', 'Let go! It flies straight off along the tangent'), GREEN],
        [tr('在放手點放磁針：N 極 = 切線方向', 'A needle there: N pole = tangent direction'), YELLOW]][phase];
      if (bm) botMsg(ctx, bm[0], bm[1]);
    } else {
      drawLines(ctx, 0.6, 0);
      magnet(ctx);
      OTHER.forEach(([x, y, a0], k) => {
        const t0 = 0.6 + 1.5 * k, target = fang(x, y);
        if (t < t0) return;
        tangent(ctx, x, y, target, 74, seg(t, t0 + 1.3, t0 + 1.7));
        compass(ctx, x, y, swing(target, a0, t - t0 - 0.3), seg(t, t0, t0 + 0.35));
      });
      topMsg(ctx, tr('換到磁鐵周圍其他位置，結論都一樣', 'Other spots around the magnet: same result'), CHALK);
      botMsg(ctx, tr('N 極所指 = 磁力線切線方向 = 磁場方向', 'N-pole direction = tangent of field line = field direction'), YELLOW, seg(t, 10.2, 10.8));
    }
  }
  function ball(ctx, x, y, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = GREEN; ctx.shadowColor = GREEN; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.restore();
  }

  // ═════════ 場景 2：空間中的指向 ═════════
  const RING = [];
  for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4; RING.push([500 + 300 * Math.cos(a), 300 + 190 * Math.sin(a)]); }
  const EXAM = [
    { x: 500, y: 150, tag: [500, 224], q: [552, 104], ans: ['N 極指向右 →', 'N points right →'], a0: 2.2 },
    { x: 170, y: 300, tag: [170, 376], q: [222, 254], ans: ['N 極指向左 ←', 'N points left ←'], a0: -1.2 },
    { x: 500, y: 455, tag: [500, 528], q: [552, 409], ans: ['N 極指向右 →', 'N points right →'], a0: -2.0 }
  ];
  function drawSpace(ctx, step, t) {
    if (step === 0) {
      magnet(ctx);
      // 右側：磁針 N 極被磁鐵 S 極吸引
      const pR = { x: lerp(930, 790, easeIO(seg(t, 0.4, 2.4))), y: lerp(130, 300, easeIO(seg(t, 0.4, 2.4))) };
      const aR = swing(fang(pR.x, pR.y), -Math.PI / 2, t - 0.4);
      const kA = seg(t, 3.0, 3.5);
      if (kA > 0) {
        ctx.save(); ctx.globalAlpha = kA; line(ctx, [[MX + MWID + 8, 300], [pR.x - R * 0.75 - 8, 300]], PINK, 3, [8, 7]); ctx.restore();
        arrowHead(ctx, pR.x - R * 0.75 - 18, 300, Math.PI, PINK, 11);
      }
      compass(ctx, pR.x, pR.y, aR, seg(t, 0.2, 0.6));
      tag(ctx, tr('N 吸 S：異名相吸', 'N is pulled to S'), 812, 378, PINK, kA);
      // 左側：磁針 S 極被磁鐵 N 極吸引
      const pL = { x: lerp(70, 210, easeIO(seg(t, 5.4, 7.4))), y: lerp(130, 300, easeIO(seg(t, 5.4, 7.4))) };
      const aL = swing(fang(pL.x, pL.y), -Math.PI / 2, t - 5.4);
      const kB = seg(t, 8.0, 8.5);
      if (kB > 0) {
        ctx.save(); ctx.globalAlpha = kB; line(ctx, [[MX - 8, 300], [pL.x + R * 0.75 + 8, 300]], PINK, 3, [8, 7]); ctx.restore();
        arrowHead(ctx, pL.x + R * 0.75 + 18, 300, 0, PINK, 11);
      }
      compass(ctx, pL.x, pL.y, aL, seg(t, 5.2, 5.6));
      tag(ctx, tr('S 吸 N：異名相吸', 'S is pulled to N'), 188, 378, PINK, kB);
      topMsg(ctx, t < 5.2 ? tr('磁針的 N 極會被磁鐵的 S 極吸引', "The needle's N pole is pulled to the magnet's S pole")
        : tr('另一端：磁針的 S 極被磁鐵的 N 極吸引', "Other end: the needle's S pole is pulled to N"), CHALK);
    } else if (step === 1) {
      magnet(ctx);
      RING.forEach(([x, y], k) => {
        const t0 = 0.5 + 1.0 * k; if (t < t0) return;
        compass(ctx, x, y, swing(fang(x, y), -Math.PI / 2, t - t0 - 0.3), seg(t, t0, t0 + 0.35));
      });
      topMsg(ctx, tr('在磁鐵四周放許多磁針，每根各自轉向', 'Many needles around the magnet: each turns its own way'), CHALK);
      botMsg(ctx, tr('方向不是亂的──它們跟著什麼排？', 'Not random: what are they following?'), YELLOW, seg(t, 9.0, 9.5));
    } else if (step === 2) {
      drawLines(ctx, 0.75 * easeIO(seg(t, 0.3, 1.8)), 0);
      magnet(ctx);
      RING.forEach(([x, y], k) => {
        const a = fang(x, y), t0 = 2.2 + 0.9 * k;
        tangent(ctx, x, y, a, 78, seg(t, t0, t0 + 0.4));
        glowRing(ctx, x, y, R + 7, YELLOW, seg(t, t0, t0 + 0.3) * (1 - seg(t, t0 + 0.9, t0 + 1.3)));
        compass(ctx, x, y, a, 1);
      });
      topMsg(ctx, tr('畫出磁力線：N 極都順著箭頭的切線方向', 'Draw the lines: every N pole follows the arrows'), CHALK);
      botMsg(ctx, tr('磁鐵外部：磁力線由 N 極出發，回到 S 極', 'Outside the magnet: field lines go from N to S'), CYAN, seg(t, 1.0, 1.5));
    } else {
      drawLines(ctx, 0.7, 0);
      magnet(ctx);
      const k = Math.min(2, Math.floor(t / 5.6)), u = t - k * 5.6, E = EXAM[k];
      const fade = k < 2 ? 1 - seg(u, 5.3, 5.6) : 1;
      const target = fang(E.x, E.y);
      // Q 點
      ctx.save(); ctx.globalAlpha = fade * (1 - seg(u, 1.6, 2.0));
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(E.x, E.y, 7, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = fade; label(ctx, 'Q', E.q[0], E.q[1], '#ffffff', 'center', 28); ctx.restore();
      glowRing(ctx, E.x, E.y, R + 9, '#ffffff', fade * seg(u, 0.2, 0.6) * (1 - seg(u, 1.6, 2.0)));
      tangent(ctx, E.x, E.y, target, 90, fade * seg(u, 3.2, 3.6));
      compass(ctx, E.x, E.y, swing(target, E.a0, u - 1.8), fade * seg(u, 1.6, 2.0));
      tag(ctx, tr(E.ans[0], E.ans[1]), E.tag[0], E.tag[1], RED, fade * seg(u, 3.4, 3.8));
      topMsg(ctx, u < 3.2 ? tr('考題：放在 Q 點的磁針，N 極指向哪裡？', 'Exam: at Q, which way does the N pole point?')
        : tr('沿磁力線箭頭的切線方向指過去', 'Along the tangent, following the arrow'), u < 3.2 ? CHALK : YELLOW, fade);
    }
  }

  // ═════════ 場景表 ═════════
  const SCENES = {
    'compass-tangent': {
      draw: drawTangent,
      steps: [
        { d: 9.0, b: ['放進磁場', 'Place it'],
          cap: ['把小磁針放進磁鐵的磁場，等它<strong class="accent-yellow">靜止</strong>：<strong class="accent-red">N 極</strong>所指的方向，就定義為<strong class="accent-cyan">該點的磁場方向</strong>。不論一開始朝哪裡，最後都停在同一方向。',
                'Put a small compass in the magnet\'s field and let it <strong class="accent-yellow">settle</strong>: the direction its <strong class="accent-red">N pole</strong> points is defined as <strong class="accent-cyan">the field direction at that point</strong>. Whatever way it starts, it ends up the same way.'] },
        { d: 12.0, b: ['沿線移動', 'Follow a line'],
          cap: ['讓磁針沿著一條<strong class="accent-cyan">磁力線</strong>移動：走到哪裡，<strong class="accent-red">N 極</strong>都指著磁力線在那一點的<strong class="accent-yellow">切線方向</strong>。',
                'Move the compass along one <strong class="accent-cyan">field line</strong>: wherever it goes, the <strong class="accent-red">N pole</strong> points along the line\'s <strong class="accent-yellow">tangent</strong> at that point.'] },
        { d: 13.0, b: ['切線', 'Tangent'],
          cap: ['<strong class="accent-yellow">切線</strong>是什麼？物體沿曲線運動時，若在某一瞬間「放手」，它會沿一條直線飛出去，這條直線就是那一點的切線方向。',
                'What is a <strong class="accent-yellow">tangent</strong>? If an object moving along a curve is let go at some instant, it flies off in a straight line: that line is the tangent at that point.'] },
        { d: 14.0, b: ['其他位置', 'Elsewhere'],
          cap: ['換到磁鐵側面、上方、下方、磁極附近……每一點都成立：<strong class="accent-red">N 極</strong>所指 = <strong class="accent-yellow">磁力線切線方向</strong> = <strong class="accent-cyan">磁場方向</strong>。',
                'Beside, above, below, near the poles... it holds everywhere: <strong class="accent-red">N-pole direction</strong> = <strong class="accent-yellow">tangent of the field line</strong> = <strong class="accent-cyan">field direction</strong>.'] }
      ]
    },
    'compass-space': {
      draw: drawSpace,
      steps: [
        { d: 11.0, b: ['異名相吸', 'Opposites'],
          cap: ['觀察：磁針的 <strong class="accent-red">N 極</strong>被磁鐵的 <strong class="accent-blue">S 極</strong>吸引；磁針的 <strong class="accent-blue">S 極</strong>則被磁鐵的 <strong class="accent-red">N 極</strong>吸引（異名相吸）。',
                'Watch: the compass <strong class="accent-red">N pole</strong> is pulled toward the magnet\'s <strong class="accent-blue">S pole</strong>, and its <strong class="accent-blue">S pole</strong> toward the magnet\'s <strong class="accent-red">N pole</strong> (opposites attract).'] },
        { d: 11.0, b: ['環繞擺放', 'Ring'],
          cap: ['在磁鐵四周擺許多磁針，每根都轉到不同方向。想一想：這些方向有什麼規律？',
                'Place many compasses around the magnet. Each turns a different way. Think: what pattern do they follow?'] },
        { d: 11.0, b: ['磁力線', 'Field lines'],
          cap: ['畫出<strong class="accent-cyan">磁力線</strong>（磁鐵外部由 N 極到 S 極）：每根磁針的 <strong class="accent-red">N 極</strong>都順著箭頭的<strong class="accent-yellow">切線方向</strong>指過去。',
                'Draw the <strong class="accent-cyan">field lines</strong> (outside the magnet, from N to S): every compass <strong class="accent-red">N pole</strong> points along the <strong class="accent-yellow">tangent</strong>, following the arrows.'] },
        { d: 19.0, b: ['考題', 'Exam'],
          cap: ['考試技巧：先找出該點的<strong class="accent-cyan">磁力線與箭頭</strong>，<strong class="accent-red">N 極</strong>就沿<strong class="accent-yellow">切線</strong>、順著箭頭指過去。本圖中磁鐵上方與正下方都指向右（朝 S 極那側），N 極外側則指向左。',
                'Exam tip: find the <strong class="accent-cyan">field line and its arrow</strong> at that point; the <strong class="accent-red">N pole</strong> points along the <strong class="accent-yellow">tangent</strong>, with the arrow. Here, above and below the magnet it points right (toward the S end); beyond the N end it points left.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  function canvasCtx() { const c = document.getElementById('compassCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }
  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = YELLOW; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }
  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t);
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i]);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('compassResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-compass');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function buildButtons() {
    const row = document.getElementById('steps-compass'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => { S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false; render(); start(); });
      row.appendChild(b);
    });
  }
  function visible() { const c = document.getElementById('compassCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last && !(MagAnim.ctl && MagAnim.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      // 老師講解模式（MagAnim.ctl.onEnd 有設定）：停在最後一格並通知一次；學生模式照舊循環
      if (MagAnim.ctl && MagAnim.ctl.onEnd) { S.t = sc.total - 1e-3; if (!S.endFired) { S.endFired = true; MagAnim.ctl.onEnd(); } } else S.t = 0;
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (S.scene) start();
  });

  MagAnim.compass = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'compass-tangent';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      buildLines();                       // 切入時一次建好磁力線快取
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-compass'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 測試用：直接畫出某場景第 t 秒的畫面
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
