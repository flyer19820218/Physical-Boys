/* ==================================================================
   mechanics_4 ｜ 磚塊翻轉：面積換了，壓力就換（cvs-brick，960×540）
   四步：1 平放 → 2 側放（抬起、翻轉、放下）→ 3 立放（再翻一次）→ 4 比一比（三種放法縮小並排＋壓力長條）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4（M4.box3／M4.obl／M4.rot3 由本檔新增）。

   數字（照簡報）：磚 20 × 10 × 5 cm、重 1200 gw（F 不變）。
       平放 A ＝ 20 × 10 ＝ 200 cm² → P ＝ 6 gw/cm²；側放 20 × 5 ＝ 100 → 12；立放 10 × 5 ＝ 50 → 24。
   立體：斜視投影（x 右、y 上、z 往後＝往右上 0.5／0.34），1 cm ＝ 11 px；世界座標原點＝軟墊頂面前緣中點。
       磚塊 body 軸：x＝長 20、y＝高 5、z＝寬 10；平放＝不轉、側放＝繞 x 轉 90°、立放＝再繞 z 轉 90°。
       磚塊正面永遠貼齊軟墊正面（z＝0），所以軟墊正面就是穿過磚塊的剖面：看得到凹陷的輪廓。
   比例尺（誠實）：重量箭頭每步一樣長（90 px）；軟墊凹陷 1.5 px／(gw/cm²)＝9：18：36（相對示意，畫面標註）；
       壓力小箭頭 2.5 px／(gw/cm²)＝15：30：60；第 4 步長條 4 px／(gw/cm²)＝24：48：96。
   版面：場景中線 CX＝270、地面 GY＝455；右欄 RX＝745（重量、接觸面積、壓力 pill、步驟結論）。
       第 4 步：主場景（立放）縮成 0.55 倍移到第三格，平放、側放在第一、二格淡入。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.box3) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PINK = M4.PC.weight, PR = M4.PC.pressure;
  const DUR = [11, 12, 12, 12];        /* 總長 47 秒 */
  const HPI = Math.PI / 2;

  /* ── 場景尺寸（世界座標 px，k＝1） ── */
  const CX = 270, GY = 455, RX = 745;
  const PW = 380, PD = 150, PT = 75;   /* 軟墊：寬、深、厚 */
  const HALF = [110, 27.5, 55];        /* 磚塊半邊長：長 20、高 5、寬 10 cm（11 px／cm） */
  const LIFT = 42;                     /* 翻轉時磚塊底部離開軟墊的高度 */
  const WLEN = 90;                     /* 重量箭頭長（每步一樣） */
  const DENT_K = 1.5, ARR_K = 2.5, BAR_K = 4;
  const F = 1200;
  const POSES = [
    { b: 0, g: 0, l: 20, w: 10, A: 200, P: 6, zh: '平放', en: 'Flat' },
    { b: HPI, g: 0, l: 20, w: 5, A: 100, P: 12, zh: '側放', en: 'On its side' },
    { b: HPI, g: HPI, l: 10, w: 5, A: 50, P: 24, zh: '立放', en: 'Upright' }
  ];
  POSES.forEach(p => { p.zc = M4.box3.extent(M4.rot3(p.b, p.g), HALF).z[1]; p.dent = DENT_K * p.P; });
  const SLOT = [175, 480, 785], MINI_K = 0.55;
  const BAR_BASE = 262, AREA_Y = 286;

  /* ── 每步的時間點 ── */
  const T_LAND = [1.8, 3.6, 3.6];      /* 磚塊落定 */
  const tA = n => T_LAND[n - 1] + 1.4; /* 接觸面＋面積 */
  const tP = n => tA(n) + 1.6;         /* 壓力 pill＋壓力箭頭 */
  const tC = n => tP(n) + 1.6;         /* 步驟結論（2、3 步） */

  /* 第 n 步（1..3）出現、下一步開頭 0.4 秒淡出的透明度 */
  function stepA(s, n, t, d) {
    if (s.n === n) return fin(s, n, t, d || 0.5);
    if (s.n === n + 1) return fout(s, n + 1, 0, 0.4);
    return 0;
  }

  /* ── 磚塊姿勢（純函式）：{ b, g 轉角, zc 中心 z, bottom 底部高度（負＝壓進軟墊）, pi 目前姿勢編號, still 是否靜止 } ── */
  function brickState(s) {
    const n = s.n, u = s.u;
    if (n === 1) {
      const p = POSES[0], q = ease(seg(u, 0.4, T_LAND[0]));
      return { b: p.b, g: p.g, zc: p.zc, bottom: lerp(LIFT, -p.dent, q), pi: 0, still: q >= 1 };
    }
    if (n === 4) { const p = POSES[2]; return { b: p.b, g: p.g, zc: p.zc, bottom: -p.dent, pi: 2, still: true }; }
    const A = POSES[n - 2], B = POSES[n - 1];
    const f = seg(u, 0.6, T_LAND[n - 1]);
    const up = ease(seg(f, 0, 0.28)), down = ease(seg(f, 0.72, 1)), r = ease(seg(f, 0.18, 0.82));
    const bottom = f < 0.72 ? lerp(-A.dent, LIFT, up) : lerp(LIFT, -B.dent, down);
    return { b: lerp(A.b, B.b, r), g: lerp(A.g, B.g, r), zc: lerp(A.zc, B.zc, r), bottom, pi: r < 0.5 ? n - 2 : n - 1, still: f <= 0 || f >= 1 };
  }

  /* ═══════════ 軟墊＋磚塊（同一個畫法給主場景與第 4 步的小場景用） ═══════════ */
  function sceneGeom(st) {
    const R = M4.rot3(st.b, st.g), ext = M4.box3.extent(R, HALF);
    const cy = st.bottom - ext.y[0], h = Math.max(0, -st.bottom);
    return { R, ext, cy, h, a: ext.x[0], b: ext.x[1], d1: st.zc + ext.z[1], sh: 8 + h * 1.1 };
  }
  function profile(g, x) {
    const h = g.h; if (h <= 0.01) return 0;
    if (x >= g.a && x <= g.b) return -h;
    if (x < g.a - g.sh || x > g.b + g.sh) return 0;
    const t = x < g.a ? (x - (g.a - g.sh)) / g.sh : ((g.b + g.sh) - x) / g.sh;
    return -h * ease(t);
  }
  function frontEdge(g, x0, x1) {
    const xs = [];
    for (let x = x0; x < x1; x += 3) xs.push(x);
    [g.a - g.sh, g.a, g.b, g.b + g.sh].forEach(x => { if (x > x0 && x < x1) xs.push(x); });
    xs.push(x1); xs.sort((p, q) => p - q);
    return xs.map(x => [x, profile(g, x)]);
  }
  function poly(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function topGrad(c, pj) {
    const g = c.createLinearGradient(0, pj(0, 0, PD)[1], 0, pj(0, 0, 0)[1]);
    g.addColorStop(0, '#f3dc8e'); g.addColorStop(1, '#e6c25c'); return g;
  }

  function padBack(c, pj, g) {
    const X0 = -PW / 2, X1 = PW / 2;
    /* 地面上的影子 */
    c.save(); c.fillStyle = 'rgba(11,26,21,0.45)';
    const s0 = pj(X0, -PT, 0), s1 = pj(X1, -PT, PD);
    c.beginPath(); c.ellipse((s0[0] + s1[0]) / 2 + 6 * pj.k, s0[1] + 2, (s1[0] - s0[0]) / 2 + 14 * pj.k, 7 * pj.k, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    /* 右側面 */
    c.fillStyle = '#a7801f';
    poly(c, [pj(X1, 0, 0), pj(X1, 0, PD), pj(X1, -PT, PD), pj(X1, -PT, 0)]); c.fill();
    /* 頂面（前緣跟著凹陷輪廓） */
    c.fillStyle = topGrad(c, pj);
    poly(c, frontEdge(g, X0, X1).map(p => pj(p[0], p[1], 0)).concat([pj(X1, 0, PD), pj(X0, 0, PD)])); c.fill();
    c.strokeStyle = 'rgba(255,244,200,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(...pj(X0, 0, PD)); c.lineTo(...pj(X1, 0, PD)); c.lineTo(...pj(X1, 0, 0)); c.stroke();
    /* 頂面的氣孔（淡） */
    c.fillStyle = 'rgba(150,110,20,0.22)';
    for (let i = 0; i < 30; i++) {
      const x = X0 + 10 + hash(i + 3) * (PW - 20), z = 12 + hash(i + 40) * (PD - 20);
      if (g.h > 0 && x > g.a - g.sh && x < g.b + g.sh && z < g.d1 + g.sh) continue;
      const p = pj(x, 0, z); c.beginPath(); c.ellipse(p[0], p[1], (1.6 + 1.6 * hash(i + 70)) * pj.k, (1 + hash(i + 70)) * pj.k, 0, 0, Math.PI * 2); c.fill();
    }
    /* 凹陷四周的陰影（左、後兩側；右側在磚塊之後再補） */
    if (g.h > 0.5) {
      const al = Math.min(1, g.h / 24);
      c.fillStyle = 'rgba(120,82,10,' + (0.38 * al) + ')';
      poly(c, [pj(g.a - g.sh, 0, 0), pj(g.a, -g.h, 0), pj(g.a, -g.h, g.d1), pj(g.b, -g.h, g.d1), pj(g.b + g.sh, 0, g.d1 + g.sh), pj(g.a - g.sh, 0, g.d1 + g.sh)]); c.fill();
    }
  }
  function padFrontRight(c, pj, g) {
    const X0 = -PW / 2, X1 = PW / 2;
    /* 磚塊右邊那一片頂面（蓋住磚塊壓進軟墊、不該看到的部分） */
    if (g.h > 0.5) {
      c.fillStyle = topGrad(c, pj);
      poly(c, frontEdge(g, g.b, X1).map(p => pj(p[0], p[1], 0))
        .concat([pj(X1, 0, PD), pj(g.b, 0, PD), pj(g.b, 0, g.d1 + g.sh), pj(g.b, -g.h, g.d1), pj(g.b, -g.h, 0)])); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = 1.2; c.stroke();   /* 蓋掉兩片頂面之間的接縫 */
      const al = Math.min(1, g.h / 24);
      c.fillStyle = 'rgba(120,82,10,' + (0.42 * al) + ')';
      poly(c, [pj(g.b, -g.h, 0), pj(g.b + g.sh, 0, 0), pj(g.b + g.sh, 0, g.d1 + g.sh), pj(g.b, -g.h, g.d1)]); c.fill();
    }
    /* 正面（剖面）：上緣是凹陷輪廓 */
    const edge = frontEdge(g, X0, X1);
    const pts = [pj(X0, -PT, 0)].concat(edge.map(p => pj(p[0], p[1], 0))).concat([pj(X1, -PT, 0)]);
    c.save();
    poly(c, pts);
    const fg = c.createLinearGradient(0, pj(0, 0, 0)[1], 0, pj(0, -PT, 0)[1]);
    fg.addColorStop(0, '#e9c45c'); fg.addColorStop(1, '#b68e2a');
    c.fillStyle = fg; c.fill();
    c.clip();
    /* 被壓緊的區域（磚塊正下方顏色較深） */
    if (g.h > 0.5) {
      /* 橢圓形漸層：中間最深、往外淡掉（被壓緊的海綿） */
      const p0 = pj(g.a, -g.h, 0), p1 = pj(g.b, -g.h, 0), rx = (p1[0] - p0[0]) / 2 + g.sh * 0.6 * pj.k, ry = (g.h * 1.8 + 10) * pj.k;
      c.save(); c.translate((p0[0] + p1[0]) / 2, p0[1]); c.scale(1, ry / rx);
      const cg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      cg.addColorStop(0, 'rgba(130,88,8,' + Math.min(0.5, 0.18 + g.h / 70) + ')'); cg.addColorStop(1, 'rgba(130,88,8,0)');
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill(); c.restore();
    }
    /* 氣孔：跟著上緣一起被壓扁 */
    c.fillStyle = 'rgba(115,78,8,0.32)';
    for (let i = 0; i < 46; i++) {
      const x = X0 + 10 + hash(i + 101) * (PW - 20), y0 = -PT + 8 + hash(i + 151) * (PT - 14);
      const top = profile(g, x), sq = (PT + top) / PT, y = -PT + (y0 + PT) * sq;
      const p = pj(x, y, 0), r = (2 + 2.2 * hash(i + 201)) * pj.k;
      c.beginPath(); c.ellipse(p[0], p[1], r, Math.max(0.6, r * sq * sq), 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    /* 上緣亮線 */
    c.strokeStyle = '#f8e7a8'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); edge.forEach((p, i) => { const q = pj(p[0], p[1], 0); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
  }

  /* 一整個場景：o：{ pj, st, a, hl 接觸面, arr 壓力箭頭 0..1, wA 重量箭頭, eA 邊長標籤, name 軟墊上的名稱, nameA } → { g, res, top(px), cx(px) } */
  function scene(c, o) {
    const pj = o.pj, st = o.st, g = sceneGeom(st), k = pj.k, pose = POSES[st.pi];
    let res = null;
    withA(c, o.a == null ? 1 : o.a, () => {
      c.save(); c.lineJoin = 'round';
      padBack(c, pj, g);
      res = M4.box3(c, { pj, R: g.R, half: HALF, ctr: [0, g.cy, st.zc], col: '#c4624a', pits: 10, seed: 4 });
      padFrontRight(c, pj, g);
      if (o.name) T(c, o.nameA == null ? 1 : o.nameA, o.name, pj(0, -PT * 0.5, 0)[0], pj(0, -PT * 0.5, 0)[1], WHITE, 22);
      /* 接觸面（半透明亮黃，透過磚塊看見） */
      const hl = o.hl || 0;
      if (hl > 0.02 && g.h > 0.5) {
        const q = [pj(g.a, -g.h, 0), pj(g.b, -g.h, 0), pj(g.b, -g.h, g.d1), pj(g.a, -g.h, g.d1)];
        withA(c, hl, () => {
          c.save();
          poly(c, q); c.fillStyle = 'rgba(255,224,102,0.38)'; c.shadowColor = YEL; c.shadowBlur = 14; c.fill();
          c.shadowBlur = 0; c.setLineDash([7, 5]); c.lineWidth = 2.5; c.strokeStyle = YEL; c.stroke();
          c.restore();
        });
      }
      /* 壓力小箭頭：尖端在接觸面前緣（壓向軟墊），長度 ∝ P */
      if ((o.arr || 0) > 0.01 && g.h > 0.5) {
        const nA = 2 * Math.max(1, Math.round((g.b - g.a) / 80)), len = ARR_K * pose.P * k * ease(o.arr);
        for (let i = 0; i < nA; i++) {
          const x = g.a + (g.b - g.a) * (i + 0.5) / nA, tip = pj(x, -g.h, 0);
          M4.pArrow(c, tip[0], tip[1] - 1, len, { a: clamp01(o.arr * 3), lw: 4 });
        }
      }
      /* 重量箭頭：從重心向下，每步一樣長 */
      const wA = o.wA || 0;
      if (wA > 0.02) {
        const cm = pj(0, g.cy, st.zc);
        M3.arrowFx(c, cm[0], cm[1], cm[0], cm[1] + WLEN * k * ease(clamp01(wA * 1.2)), PINK, wA, 7 * Math.max(0.75, k), 0);
        withA(c, wA, () => { c.fillStyle = PINK; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.5;
          c.beginPath(); c.arc(cm[0], cm[1], 5.5 * Math.max(0.8, k), 0, Math.PI * 2); c.fill(); c.stroke(); });
      }
      /* 三個邊長（各取最上面那條輪廓邊，字放在邊的外側） */
      if ((o.eA || 0) > 0.02) edgeLabels(c, res, pj(0, g.cy, st.zc), o.eA);
      c.restore();
    });
    if (!res) res = M4.box3(c, { pj, R: g.R, half: HALF, ctr: [0, g.cy, st.zc], a: 0 });
    const topY = Math.min(...res.S.map(p => p[1]));
    return { g, res, top: topY, cx: pj(0, 0, st.zc)[0] };
  }
  function edgeLabels(c, res, ctr, a) {
    ['20 cm', '5 cm', '10 cm'].forEach((str, ax) => {
      const es = res.edges(ax).filter(e => e.sil);
      if (!es.length) return;
      let best = null, bs = -1e9;
      es.forEach(e => { const my = (res.S[e.i][1] + res.S[e.j][1]) / 2; if (-my > bs) { bs = -my; best = e; } });
      const A = res.S[best.i], B = res.S[best.j], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      const ex = B[0] - A[0], ey = B[1] - A[1], el = Math.hypot(ex, ey) || 1;
      let px = -ey / el, py = ex / el;
      if (px * (mx - ctr[0]) + py * (my - ctr[1]) < 0) { px = -px; py = -py; }
      const w = W5.tw(c, str, 22), dist = 10 + Math.abs(px) * w / 2 + Math.abs(py) * 14;
      T(c, a, str, mx + px * dist, my + py * dist, WHITE, 22);
    });
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [() => L('平放', 'Flat'), () => L('側放', 'On its side'), () => L('立放', 'Upright'), () => L('比一比', 'Compare')];
  function rightColumn(c, s, a1) {
    const n = s.n;
    /* 重量：第 1 步出現，1～3 步都在 */
    const wA = n === 1 ? fin(s, 1, T_LAND[0] + 0.6, 0.5) * a1 : n < 4 ? 1 : fout(s, 4, 0, 0.5);
    P(c, wA, L('重量 F ＝ 1200 gw', 'Weight F = 1200 gw'), RX, 176, PINK, 22);
    for (let m = 1; m <= 3; m++) {
      const p = POSES[m - 1];
      const aA = stepA(s, m, tA(m) + 0.4, 0.5), aP = stepA(s, m, tP(m), 0.5);
      T(c, aA, L('接觸面積', 'Contact area'), RX, 240, YEL, 22);
      P(c, aA, 'A ＝ ' + p.l + ' × ' + p.w + ' ＝ ' + p.A + ' cm²', RX, 278, YEL, 22);
      M4.pPill(c, aP, 'P ＝ ' + F + ' ÷ ' + p.A + ' ＝ ' + p.P + ' gw/cm²', RX, 352, 24);
      if (m > 1) M3.caption(c, stepA(s, m, tC(m), 0.6), L('面積 ÷ 2 → 壓力 × 2', 'Area ÷ 2 → pressure × 2'), YEL, RX, 432, 24);
    }
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const n = s.n, a1 = n === 1 ? s.k : 1;
    M3.backdrop(c, { gy: GY, cell: 40, ox: 0, glow: COL.teal, a: a1 });
    M3.ground(c, GY, { a: a1 });

    /* 主場景：第 4 步縮小移到第三格 */
    const tm = n === 4 ? ease(seg(s.u, 0.5, 2.3)) : 0;
    const k = lerp(1, MINI_K, tm), cx = lerp(CX, SLOT[2], tm);
    const pj = M4.obl(cx, GY - PT * k, k);
    const st = brickState(s);
    const m = st.pi + 1;                                    /* 目前姿勢對應的步驟 */
    const landed = n === 1 ? fin(s, 1, T_LAND[0] + 0.2, 0.5) : n < 4 ? fin(s, n, T_LAND[n - 1] + 0.2, 0.5) : 1;
    const preFlip = n > 1 && n < 4 ? fout(s, n, 0, 0.4) : 0;   /* 翻轉前把上一步的標示收掉 */
    const still = n === 1 || n === 4 || st.still;
    const eA = n === 4 ? fout(s, 4, 0, 0.4) : (s.u < 0.6 && n > 1 ? preFlip : (still ? landed : 0));
    let wA = n === 4 ? (tm < 0.02 ? fout(s, 4, 0, 0.3) : fin(s, 4, 2.6, 0.6)) : (s.u < 0.6 && n > 1 ? preFlip : (still ? fin(s, n, T_LAND[n - 1] + 0.4, 0.6) : 0));
    const hl = stepA(s, m, tA(m), 0.6);
    const arr = n === 4 ? 0 : (s.n === m ? clamp01(seg(s.u, tP(m), tP(m) + 0.8)) : stepA(s, m, 0, 0.1));
    const main = scene(c, { pj, st, a: a1, hl, arr, wA: wA * a1, eA: eA * a1 });

    /* 第 4 步：平放、側放在第一、二格 */
    if (n === 4) {
      const ma = fin(s, 4, 1.6, 0.8), mw = fin(s, 4, 2.6, 0.6);
      const minis = [0, 1].map(i => {
        const p = POSES[i];
        return scene(c, { pj: M4.obl(SLOT[i], GY - PT * MINI_K, MINI_K), st: { b: p.b, g: p.g, zc: p.zc, bottom: -p.dent, pi: i }, a: ma, wA: mw });
      });
      minis.push(main);
      compare(c, s, minis);
    }

    /* 文字 */
    P(c, a1 * fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    T(c, a1 * 0.9, L('軟墊壓痕為相對示意', 'Dent depth is relative'), 940, M3.KEY_Y, DIM, 22, 'right');
    rightColumn(c, s, a1);
  }

  /* 第 4 步：重量都一樣、三條壓力長條、面積、結論 */
  function compare(c, s, sc) {
    P(c, fin(s, 4, 3.0, 0.6), L('重量都是 1200 gw', 'Same weight: 1200 gw'), 480, M3.Q_Y, PINK, 22);
    /* 基準線 */
    withA(c, fin(s, 4, 4.0, 0.5), () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 2; c.setLineDash([8, 6]);
      c.beginPath(); c.moveTo(70, BAR_BASE); c.lineTo(900, BAR_BASE); c.stroke(); c.restore();
    });
    sc.forEach((o, i) => {
      const p = POSES[i], x = o.cx;
      T(c, fin(s, 4, 3.6 + i * 0.2, 0.5), L(p.zh + '  A ＝ ', p.en + '  A = ') + p.A + ' cm²', x, AREA_Y, WHITE, 22);
      const g = ease(seg(s.u, 4.4 + i * 0.5, 5.2 + i * 0.5)), hgt = BAR_K * p.P * g;
      if (g > 0.01) {
        withA(c, 1, () => {
          c.save();
          W5.glow(c, x, BAR_BASE - hgt / 2, 40 + hgt * 0.4, PR, 0.12 + (i === 2 ? 0.1 * fin(s, 4, 7.0, 0.6) : 0));
          const bg = c.createLinearGradient(0, BAR_BASE - hgt, 0, BAR_BASE);
          bg.addColorStop(0, '#ffa070'); bg.addColorStop(1, PR);
          c.fillStyle = bg; W5.rr(c, x - 24, BAR_BASE - hgt, 48, hgt, 5); c.fill();
          c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; c.stroke();
          c.restore();
        });
      }
      T(c, clamp01((g - 0.7) / 0.3), p.P + ' gw/cm²', x, BAR_BASE - hgt - 18, PR, 22);
    });
    M3.caption(c, fin(s, 4, 7.0, 0.6), L('最大壓力：最小的面著地', 'Largest pressure: smallest face down'), YEL, 480, M3.BOT_Y, 24);
  }

  W5.register('brick', { canvas: 'cvs-brick', steps: DUR, draw });
})();
