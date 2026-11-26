/* mechanics_4_lab_vessel_1126_v1.js — 「動手做｜連通管」（#vesselLabCanvas，960×540）
 * 契約：window.W5Lab.vessel = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理：4 個形狀不同的容器底部用管子相連（2D 剖面，寬度 W_i(h) cm）。水量 v_i ＝ ∫W_i dh，總水量守恆。
 *   底部壓力 P ＝ h × D（D＝1 gw/cm³），液面高的那邊壓力大，把水推向液面低的那邊：
 *   dv_i/dt ＝ k × (平均液面 − h_i)，所有流量加起來為 0，所以水量守恆；流到所有 h_i 相等才停。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const BOT = 470, SY = 5, SX = 5, HMAX = 50;
  const CX = [120, 260, 400, 540];
  const NAME = [['細管', 'Thin tube'], ['粗桶', 'Wide tank'], ['漏斗', 'Funnel'], ['球形瓶', 'Bulb']];
  const W = [
    h => 4,
    h => 14,
    h => 6 + 0.25 * h,
    h => 4 + 12 * Math.exp(-Math.pow((h - 14) / 9, 2))
  ];
  const K = 28;

  function vol(i, h) { let v = 0; const n = Math.max(1, Math.ceil(h / 0.25)); const dx = h / n; for (let k = 0; k < n; k++) v += W[i]((k + 0.5) * dx) * dx; return v; }
  function hOf(i, v) { let lo = 0, hi = HMAX; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (vol(i, m) < v) lo = m; else hi = m; } return (lo + hi) / 2; }

  const S = { v: [0, 0, 0, 0], h: [20, 20, 20, 20], dir: [0, 0, 0, 0], time: 0, moving: false };
  function reset() { for (let i = 0; i < 4; i++) { S.v[i] = vol(i, 20); S.h[i] = 20; S.dir[i] = 0; } }
  reset();
  function addTo(i) { S.v[i] = Math.min(vol(i, HMAX - 1), S.v[i] + 60); refresh(); }
  function drain() { let m = 0; for (let i = 1; i < 4; i++) if (S.h[i] > S.h[m]) m = i; S.v[m] = Math.max(vol(m, 2), S.v[m] - 60); refresh(); }
  function refresh() { for (let i = 0; i < 4; i++) S.h[i] = hOf(i, S.v[i]); }
  const mean = () => (S.h[0] + S.h[1] + S.h[2] + S.h[3]) / 4;
  const spread = () => Math.max(...S.h) - Math.min(...S.h);

  function step(_, dt) {
    S.time += dt;
    const n = 4, d = dt / n;
    for (let s = 0; s < n; s++) {
      const hb = mean();
      for (let i = 0; i < 4; i++) { const dv = K * (hb - S.h[i]) * d; S.v[i] += dv; }
      refresh();
    }
    const hb = mean();
    for (let i = 0; i < 4; i++) S.dir[i] = Math.abs(hb - S.h[i]) < 0.04 ? 0 : (hb > S.h[i] ? 1 : -1);
    S.moving = spread() > 0.04;
    return S.moving || S.time < 0.3;
  }

  const yOf = h => BOT - h * SY;
  function outline(c, i) {
    c.beginPath();
    for (let h = 0; h <= HMAX; h += 1) { const x = CX[i] - W[i](h) / 2 * SX, y = yOf(h); if (h === 0) c.moveTo(x, y); else c.lineTo(x, y); }
    for (let h = HMAX; h >= 0; h -= 1) c.lineTo(CX[i] + W[i](h) / 2 * SX, yOf(h));
    c.closePath();
  }

  function draw(c) {
    /* 底管 */
    U.rr(c, CX[0] - 22, BOT - 6, CX[3] - CX[0] + 44, 30, 14);
    c.fillStyle = 'rgba(47,143,216,0.65)'; c.fill(); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 4; c.stroke();
    /* 容器 */
    for (let i = 0; i < 4; i++) {
      c.save(); outline(c, i); c.clip();
      U.waterRect(c, CX[i] - 100, yOf(S.h[i]), CX[i] + 100, BOT + 4, { wob: 1.6, phase: S.time * 3 + i });
      c.restore();
      outline(c, i); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
      c.fillStyle = COL.bg; c.fillRect(CX[i] - 14, BOT - 3, 28, 6);
      c.fillStyle = 'rgba(47,143,216,0.65)'; c.fillRect(CX[i] - 14, BOT - 3, 28, 6);
      U.label(c, T(NAME[i][0], NAME[i][1]), CX[i], BOT + 52, COL.white, 22, 'center');
    }
    /* 上下流向：用小箭頭表示進出該容器 */
    for (let i = 0; i < 4; i++) {
      if (!S.dir[i]) continue;
      const up = S.dir[i] > 0, y0 = up ? BOT - 10 : BOT - 54, y1 = up ? BOT - 54 : BOT - 10;
      U.arrow(c, CX[i] + 0, y0, CX[i], y1, COL.teal, 5);
    }
    /* 平均液面虛線 */
    const hb = mean();
    c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.setLineDash([10, 8]);
    c.beginPath(); c.moveTo(CX[0] - 78, yOf(hb)); c.lineTo(CX[3] + 78, yOf(hb)); c.stroke(); c.restore();
    /* 各容器水面高度（水面上方的小標） */
    for (let i = 0; i < 4; i++) U.label(c, (Math.round(S.h[i] * 10) / 10) + '', CX[i], Math.min(yOf(S.h[i]) - 34, BOT - 80), COL.yellow, 22, 'center', true);
    U.pill(c, T('四個容器的水面高度 h（cm）', 'Water level h of each vessel (cm)'), 330, 70, COL.yellow, 22);
    /* 右側：底部壓力 */
    const bx = 650, bw = 290;
    U.pill(c, T('各容器的底部壓力', 'Pressure at each bottom'), bx + bw / 2, 78, COL.white, 22);
    const mx = Math.max(40, ...S.h);
    for (let i = 0; i < 4; i++) {
      const y = 150 + i * 80;
      U.rr(c, bx, y - 30, bw, 68, 10); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill(); c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2; c.stroke();
      U.label(c, T(NAME[i][0], NAME[i][1]), bx + 14, y - 8, COL.white, 22, 'left');
      U.label(c, (Math.round(S.h[i] * 10) / 10) + ' gw/cm²', bx + bw - 14, y - 8, COL.coral, 22, 'right', true);
      U.rr(c, bx + 14, y + 12, (bw - 28) * S.h[i] / mx, 12, 6); c.fillStyle = COL.coral; c.fill();
    }
    U.pill(c, T('P ＝ h × D，與形狀無關', 'P = h × D, shape doesn’t matter'), bx + bw / 2, 490, COL.yellow, 22);
  }

  function result() {
    const hb = Math.round(mean() * 10) / 10;
    if (!S.moving) {
      return `<div><span class="lw-big lw-c">${T('連通管：液面等高！', 'Connected vessels: the levels are equal!')}</span></div>` +
        `<div>${T('四個容器的水面都在 ', 'All four levels sit at ')}<b class="lw-y">${hb} cm</b>${T('，不論形狀粗細。底部壓力 P ＝ h × D 一樣大，兩邊互相推成平衡。', ', whatever the shape. The bottom pressures P = h × D match, so they push back equally.')}</div>` +
        `<div>${T('試試：往不同容器加水，看水怎麼流、最後停在哪。', 'Try pouring water into different vessels and watch where it ends up.')}</div>`;
    }
    const hi = S.h.indexOf(Math.max(...S.h)), lo = S.h.indexOf(Math.min(...S.h));
    return `<div><span class="lw-big lw-bad">${T('水還在流動…', 'Water is still flowing…')}</span></div>` +
      `<div>${T(NAME[hi][0] + ' 的液面最高，底部壓力最大，把水推向 ' + NAME[lo][0] + '。', NAME[hi][1] + ' has the highest level and the biggest bottom pressure, pushing water toward ' + NAME[lo][1] + '.')}</div>` +
      `<div>${T('水流到所有液面等高，壓力相等才會停。', 'The flow stops only when every level is equal and the pressures match.')}</div>`;
  }

  M4Lab.make({
    key: 'vessel', tab: 'tab3',
    titleZh: '動手做｜連通管', titleEn: 'Try it | Connected Vessels',
    subZh: '四個形狀不同的容器底部相通。往其中一個加水，先猜：最後四個水面會一樣高嗎？', subEn: 'Four differently shaped vessels are joined at the bottom. Pour water into one and predict: will all four levels end up equal?',
    tipZh: '每按一次加水或排水，都是 60 cm² 的水量；容器形狀不同，水面升降的幅度也不同。', tipEn: 'Each press adds or removes the same 60 cm² of water; the level rises by different amounts in different shapes.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'a0', zh: '💧 加到細管', en: '💧 Add to tube', on: () => addTo(0) },
        { id: 'a1', zh: '💧 加到粗桶', en: '💧 Add to tank', on: () => addTo(1) },
        { id: 'a2', zh: '💧 加到漏斗', en: '💧 Add to funnel', on: () => addTo(2) },
        { id: 'a3', zh: '💧 加到球形瓶', en: '💧 Add to bulb', on: () => addTo(3) }
      ] },
      { kind: 'buttons', items: [
        { id: 'dr', zh: '🚰 排水', en: '🚰 Drain', on: drain },
        { id: 'rs', zh: '↺ 重設', en: '↺ Reset', on: reset }
      ] }
    ],
    step, draw, result,
    snapshot: s => ({ h: s.h.map(x => +x.toFixed(2)), spread: +spread().toFixed(3), moving: s.moving })
  });
  window.W5Lab.vessel.addTo = function (i) { addTo(i); window.W5Lab.vessel.request(); };
})();
