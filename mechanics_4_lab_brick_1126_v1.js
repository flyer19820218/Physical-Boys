/* mechanics_4_lab_brick_1126_v1.js — 「動手做｜磚塊壓力實驗台」（#brickLabCanvas，960×540）
 * 契約：window.W5Lab.brick = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理：磚塊 長 20 × 寬 10 × 高 5 cm，重量 F（滑桿 400～2000 gw，預設 1200 gw）。
 *   平放接觸面 20×10＝200 cm²；側放 20×5＝100 cm²；立放 10×5＝50 cm²；P ＝ F ÷ A（gw/cm²）。
 *   預設 1200 gw：6／12／24 gw/cm²（與動畫 brick 一致）。軟墊凹陷深度 ∝ P（相對示意）。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const DIMS = { flat: { w: 20, d: 10, h: 5 }, side: { w: 20, d: 5, h: 10 }, up: { w: 10, d: 5, h: 20 } };
  const ORI = [['flat', '平放', 'Flat'], ['side', '側放', 'On its side'], ['up', '立放', 'Upright']];
  const SC = 10;                       /* px／cm */
  const PAD = { x0: 60, x1: 550, top: 400, th: 80 };
  const CX = 305;
  const DENT_PX = 1.9, DENT_MAX = 62;  /* 凹陷 px／(gw/cm²) */
  const area = o => { const d = DIMS[o]; return d.w * d.d; };

  const S = {
    ori: 'flat', F: 1200,
    cur: { w: 20, d: 10, h: 5 }, from: null, to: null, t: 1, dent: 0
  };

  function press(o, F) { return F / area(o); }
  function startMove(o) {
    if (o === S.ori && S.t >= 1) return;
    S.from = { w: S.cur.w, d: S.cur.d, h: S.cur.h }; S.to = DIMS[o]; S.ori = o; S.t = 0;
  }

  function step(_, dt) {
    let moving = false;
    if (S.t < 1) { S.t = Math.min(1, S.t + dt / 0.95); const e = U.ease(S.t); ['w', 'd', 'h'].forEach(k => { S.cur[k] = U.lerp(S.from[k], S.to[k], e); }); moving = true; }
    else { const d = DIMS[S.ori]; S.cur.w = d.w; S.cur.d = d.d; S.cur.h = d.h; }
    const target = Math.min(DENT_MAX, press(S.ori, S.F) * DENT_PX) * (S.t >= 1 ? 1 : U.ease(Math.max(0, (S.t - 0.7) / 0.3)));
    const k = 1 - Math.pow(0.001, dt);
    S.dent += (target - S.dent) * k; if (Math.abs(target - S.dent) > 0.2) moving = true; else S.dent = target;
    return moving;
  }

  /* ── 畫磚塊（斜視：正面＋上面＋右側面）；bx 中線、by 底面前緣 y ── */
  function brick(c, bx, by, w, d, h) {
    const W = w * SC, D = d * SC, Hh = h * SC, ox = D * 0.5, oy = D * 0.34;
    const x0 = bx - W / 2 - ox / 2, yb = by;
    c.save();
    c.lineJoin = 'round';
    /* 右側面 */
    c.fillStyle = '#7e3b2b'; c.beginPath(); c.moveTo(x0 + W, yb); c.lineTo(x0 + W + ox, yb - oy); c.lineTo(x0 + W + ox, yb - oy - Hh); c.lineTo(x0 + W, yb - Hh); c.closePath(); c.fill();
    /* 上面 */
    c.fillStyle = '#d98366'; c.beginPath(); c.moveTo(x0, yb - Hh); c.lineTo(x0 + ox, yb - Hh - oy); c.lineTo(x0 + W + ox, yb - Hh - oy); c.lineTo(x0 + W, yb - Hh); c.closePath(); c.fill();
    /* 正面 */
    const g = c.createLinearGradient(0, yb - Hh, 0, yb); g.addColorStop(0, '#c4624a'); g.addColorStop(1, '#a24630');
    c.fillStyle = g; c.fillRect(x0, yb - Hh, W, Hh);
    c.strokeStyle = 'rgba(60,24,16,0.85)'; c.lineWidth = 2.5;
    c.strokeRect(x0, yb - Hh, W, Hh);
    c.beginPath(); c.moveTo(x0, yb - Hh); c.lineTo(x0 + ox, yb - Hh - oy); c.lineTo(x0 + W + ox, yb - Hh - oy); c.lineTo(x0 + W + ox, yb - oy); c.lineTo(x0 + W, yb); c.moveTo(x0 + W, yb - Hh); c.lineTo(x0 + W + ox, yb - Hh - oy); c.stroke();
    /* 磚紋：正面幾條淡線 */
    c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const yy = yb - Hh + Hh * i / 4; c.beginPath(); c.moveTo(x0 + 4, yy); c.lineTo(x0 + W - 4, yy); c.stroke(); }
    c.restore();
    return { x0, x1: x0 + W, yb, topY: yb - Hh - oy };
  }

  /* ── 軟墊：剖面＋表面凹陷（凹陷寬度 ≈ 磚寬） ── */
  function pad(c, dent, wpx) {
    const { x0, x1, top, th } = PAD, a = CX - wpx / 2, b = CX + wpx / 2, sh = 22;
    c.save();
    const g = c.createLinearGradient(0, top, 0, top + th); g.addColorStop(0, '#e8c25a'); g.addColorStop(1, '#b8902a');
    c.fillStyle = g; c.beginPath(); c.moveTo(x0, top + th);
    c.lineTo(x0, top); c.lineTo(Math.max(x0, a - sh), top);
    c.quadraticCurveTo(a - 2, top, a + 4, top + dent * 0.9); c.lineTo(b - 4, top + dent * 0.9);
    c.quadraticCurveTo(b + 2, top, Math.min(x1, b + sh), top); c.lineTo(x1, top); c.lineTo(x1, top + th); c.closePath(); c.fill();
    c.strokeStyle = '#f6e19a'; c.lineWidth = 3; c.stroke();
    /* 海綿氣孔 */
    c.fillStyle = 'rgba(120,80,10,0.28)';
    for (let i = 0; i < 46; i++) { const px = x0 + 14 + (i * 97.3) % (x1 - x0 - 28), py = top + 28 + ((i * 53.7) % (th - 38)); c.beginPath(); c.arc(px, py, 2 + (i % 3), 0, 6.283); c.fill(); }
    c.restore();
    return top + dent * 0.9;
  }

  function draw(c) {
    const cur = S.cur, wpx = cur.w * SC;
    /* 地板與標題 */
    U.pill(c, T('軟墊壓痕為相對示意', 'Dent depth is relative'), 300, 72, COL.dim, 22);
    const lift = Math.sin(Math.PI * Math.min(1, S.t)) * 95 * (S.t < 1 ? 1 : 0);
    const seat = pad(c, S.dent, wpx + cur.d * SC * 0.5 + 30);
    const bb = brick(c, CX, seat - lift, cur.w, cur.d, cur.h);
    /* 重量箭頭（粉）：在磚塊上方 */
    const fx = CX, ftop = Math.max(98, bb.topY - 96), fbot = bb.topY - 8;
    if (S.t >= 1) {
      U.arrow(c, fx, ftop, fx, fbot, COL.pink, 8);
      U.pill(c, T('重量 F ＝ ' + S.F + ' gw', 'Weight F = ' + S.F + ' gw'), fx + 30, ftop + 8, COL.pink, 22, 'left');
    }
    /* 接觸面強調（珊瑚）：磚塊底面前緣 */
    if (S.t >= 1) {
      c.save(); c.strokeStyle = COL.coral; c.lineWidth = 6; c.lineCap = 'round'; c.shadowColor = COL.coral; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(bb.x0 + 3, bb.yb + 1); c.lineTo(bb.x1 - 3, bb.yb + 1); c.stroke(); c.restore();
      U.pill(c, T('接觸面 ' + DIMS[S.ori].w + ' × ' + DIMS[S.ori].d + ' cm', 'Contact ' + DIMS[S.ori].w + ' × ' + DIMS[S.ori].d + ' cm'), CX, PAD.top + PAD.th + 20, COL.coral, 22);
    }
    /* 右側資訊板：三種放法的壓力 */
    const bx = 600, bw = 330;
    U.pill(c, T('同一塊磚、同樣重 F', 'Same brick, same weight F'), bx + bw / 2, 78, COL.white, 22);
    const maxP = 40;
    ORI.forEach(([o, zh, en], i) => {
      const y = 140 + i * 92, P = press(o, S.F), on = o === S.ori;
      U.rr(c, bx, y - 34, bw, 76, 10); c.fillStyle = on ? 'rgba(255,224,102,0.12)' : 'rgba(0,0,0,0.22)'; c.fill();
      c.strokeStyle = on ? COL.yellow : 'rgba(246,243,234,0.25)'; c.lineWidth = on ? 3 : 2; c.stroke();
      U.label(c, T(zh, en) + '  ' + DIMS[o].w + '×' + DIMS[o].d + ' = ' + area(o) + ' cm²', bx + 14, y - 12, on ? COL.yellow : COL.white, 22, 'left');
      U.label(c, 'P = ' + (Math.round(P * 10) / 10) + ' gw/cm²', bx + 14, y + 22, COL.coral, 22, 'left', true);
      const bl = Math.min(1, P / maxP) * 100;
      c.fillStyle = 'rgba(255,128,64,0.22)'; c.fillRect(bx + bw - 114, y + 8, 100, 16);
      c.fillStyle = COL.coral; c.fillRect(bx + bw - 114, y + 8, bl, 16);
    });
    /* 最大／最小標記 */
    const Pmax = press('up', S.F), Pmin = press('flat', S.F);
    U.pill(c, T('最大壓力：最小的面著地', 'Largest P: smallest face down'), bx + bw / 2, 432, COL.coral, 22);
    U.pill(c, T('最小壓力：最大的面著地', 'Smallest P: largest face down'), bx + bw / 2, 478, COL.teal, 22);
    void Pmax; void Pmin;
  }

  function result() {
    const P = press(S.ori, S.F), a = DIMS[S.ori], name = ORI.find(o => o[0] === S.ori);
    const r = Math.round(P * 10) / 10;
    return `<div><span class="lw-big lw-p">${T('P ＝ F ÷ A ＝ ' + S.F + ' ÷ ' + area(S.ori) + ' ＝ ' + r + ' gw/cm²', 'P = F ÷ A = ' + S.F + ' ÷ ' + area(S.ori) + ' = ' + r + ' gw/cm²')}</span></div>` +
      `<div>${T('目前：', 'Now: ')}<b class="lw-y">${T(name[1], name[2])}</b>${T('，著地面積 ', ', contact area ')}${a.w} × ${a.d} ＝ ${area(S.ori)} cm²${T('（重量 ', ' (weight ')}${S.F} gw${T('）', ')')}</div>` +
      `<div>${T('三種放法：平放 ', 'Three ways: flat ')}${Math.round(press('flat', S.F) * 10) / 10}${T('、側放 ', ', side ')}${Math.round(press('side', S.F) * 10) / 10}${T('、立放 ', ', upright ')}${Math.round(press('up', S.F) * 10) / 10} gw/cm²</div>`;
  }

  M4Lab.make({
    key: 'brick', tab: 'tab1',
    titleZh: '動手做｜磚塊壓力實驗台', titleEn: 'Try it | Brick Pressure Bench',
    subZh: '把同一塊磚平放、側放、立放，再調整它的重量。先猜猜看：哪一種放法壓力最大？', subEn: 'Lay the same brick flat, on its side or upright, then change its weight. First guess which way gives the largest pressure.',
    tipZh: '軟墊凹得越深，壓力越大。重量調大，三種放法的壓力都會跟著變大，但大小順序不變。', tipEn: 'The deeper the dent, the bigger the pressure. A heavier brick raises all three pressures, but their order stays the same.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: ORI.map(([o, zh, en]) => ({ id: o, zh: '🧱 ' + zh, en: '🧱 ' + en, on: () => startMove(o), active: () => S.ori === o })) },
      { kind: 'slider', id: 'F', zh: '磚塊重量 F', en: 'Brick weight F', min: 400, max: 2000, step: 100, get: () => S.F, set: v => { S.F = v; }, fmt: v => v + ' gw' }
    ],
    step, draw, result,
    snapshot: s => ({ ori: s.ori, F: s.F, area: area(s.ori), P: press(s.ori, s.F), dent: +s.dent.toFixed(1), moving: s.t < 1 })
  });
  /* 供有聲播放器 / 檢查程式直接設定 */
  window.W5Lab.brick.set = (o, F) => { if (F != null) S.F = F; if (o) startMove(o); window.W5Lab.brick.request(); };
})();
