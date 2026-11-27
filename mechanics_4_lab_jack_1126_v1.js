/* mechanics_4_lab_jack_1126_v1.js — 「動手做｜液壓千斤頂」（#jackLabCanvas，960×540）
 * 契約：window.W5Lab.jack = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理（帕斯卡原理，不計摩擦與活塞重）：
 *   P ＝ F小 ÷ A小（gw/cm²，1 kgw ＝ 1000 gw），密閉液體各處壓力相同；F大 ＝ P × A大。
 *   重物 100 kgw：F大 ≥ 重物才舉得起。每壓一下小活塞下降 10 cm，擠出的水量 A小×10 使大活塞上升 10×A小÷A大 cm。
 *   功：F小×d小 ＝ F大×d大（能量守恆，省力不省功）。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const LOAD = 100, DSTROKE = 10, SC = 5, YTOP = 230, YBOT = 420, T_DOWN = 0.9, T_ALL = 1.5, LMAX = 12;
  const S = { as: 20, al: 200, f: 10, lift: 0, p: -1, lifted: false, time: 0, pressed: 0 };
  const P = () => S.f * 1000 / S.as;
  const FL = () => P() * S.al / 1000;
  const canLift = () => FL() >= LOAD - 1e-9;
  const dL = () => DSTROKE * S.as / S.al;
  const ease = t => t * t * (3 - 2 * t);

  function press() { if (S.p >= 0) return; S.p = 0; S.pressed++; }
  function reset() { S.lift = 0; S.p = -1; S.pressed = 0; }

  function step(_, dt) {
    S.time += dt;
    if (S.p >= 0) {
      const before = S.p; S.p += dt;
      if (before < T_DOWN && S.p >= T_DOWN && canLift()) S.lift = Math.min(LMAX, S.lift + dL());
      if (S.p >= T_ALL) S.p = -1;
    }
    return S.p >= 0 || S.time < 0.3;
  }

  const wS = () => Math.sqrt(S.as) * 14, wL = () => Math.sqrt(S.al) * 14;
  const CXS = 100, CXL = 380;

  function curTravel() { if (S.p < 0) return 0; return S.p < T_DOWN ? ease(S.p / T_DOWN) : 1 - ease((S.p - T_DOWN) / (T_ALL - T_DOWN)); }
  function curLift() {
    const base = S.lift;
    if (S.p >= 0 && S.p < T_DOWN && canLift()) return Math.min(LMAX, base + dL() * ease(S.p / T_DOWN));
    return base;
  }

  function draw(c) {
    const ws = wS(), wl = wL(), tr = curTravel() * DSTROKE, lf = curLift();
    const ySmall = YTOP + 20 + tr * SC, yLarge = YTOP + 110 - lf * SC;
    /* 底管與水 */
    c.fillStyle = 'rgba(47,143,216,0.6)';
    c.fillRect(CXS - ws / 2, ySmall + 14, ws, YBOT - ySmall - 14);
    c.fillRect(CXL - wl / 2, yLarge + 14, wl, YBOT - yLarge - 14);
    c.fillRect(CXS - ws / 2, YBOT, CXL - CXS + (wl + ws) / 2, 24);
    c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(CXS - ws / 2, YTOP); c.lineTo(CXS - ws / 2, YBOT + 24); c.lineTo(CXL + wl / 2, YBOT + 24); c.lineTo(CXL + wl / 2, YTOP); c.stroke();
    c.beginPath(); c.moveTo(CXS + ws / 2, YTOP); c.lineTo(CXS + ws / 2, YBOT); c.lineTo(CXL - wl / 2, YBOT); c.lineTo(CXL - wl / 2, YTOP); c.stroke();
    /* 活塞 */
    U.rr(c, CXS - ws / 2 + 3, ySmall, ws - 6, 14, 3); c.fillStyle = '#9aa6b0'; c.fill();
    c.fillRect(CXS - 5, ySmall - 70, 10, 72);
    U.rr(c, CXL - wl / 2 + 3, yLarge, wl - 6, 14, 3); c.fillStyle = '#9aa6b0'; c.fill();
    /* 大活塞上的平台與重物 */
    const pw = wl - 12;   /* 平台不可穿出管壁：比兩側管壁內側各窄 6 px */
    c.fillStyle = '#7b8791'; c.fillRect(CXL - pw / 2, yLarge - 16, pw, 14);
    c.fillStyle = '#9aa6b0'; c.fillRect(CXL - 6, yLarge - 2, 12, 4);
    const bw = Math.min(150, pw - 6), bh = 72;
    U.rr(c, CXL - bw / 2, yLarge - 16 - bh, bw, bh, 8); c.fillStyle = 'rgba(244,114,182,0.30)'; c.fill(); c.strokeStyle = COL.pink; c.lineWidth = 4; c.stroke();
    U.label(c, LOAD + ' kgw', CXL, yLarge - 16 - bh / 2, COL.pink, 22, 'center', true);
    /* 力的箭頭（青） */
    const fl = Math.min(70, 16 + S.f * 2.2);
    U.arrow(c, CXS, ySmall - 70 - fl, CXS, ySmall - 74, COL.teal, 7);
    U.label(c, T('F小 = ', 'F = ') + S.f + ' kgw', Math.max(CXS, 110), ySmall - 70 - fl - 24, COL.teal, 22, 'center', true);
    /* 大活塞往上的力（青） */
    const lfl = Math.min(70, 16 + FL() * 0.7);
    U.arrow(c, CXL, YBOT - 6 + 0, CXL, YBOT - 6 - lfl * 0.9, COL.teal, 7);
    /* 壓力（珊瑚）：在水裡的小箭頭 */
    /* 已舉高刻度 */
    const gx = CXL + wl / 2 + 28;
    c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx, YTOP + 110); c.lineTo(gx, YTOP + 110 - LMAX * SC); c.stroke();
    U.pill(c, T('已舉高 ', 'Lifted ') + (Math.round(S.lift * 100) / 100) + ' cm', gx + 16, YTOP + 110 - LMAX * SC - 22, COL.yellow, 22, 'center');
    c.strokeStyle = COL.yellow; c.lineWidth = 4; c.beginPath(); c.moveTo(gx - 8, YTOP + 110 - S.lift * SC); c.lineTo(gx + 8, YTOP + 110 - S.lift * SC); c.stroke();
    /* 活塞面積標籤 */
    U.label(c, 'A小 = ' + S.as + ' cm²', CXS, YBOT + 52, COL.white, 22, 'center');
    U.label(c, 'A大 = ' + S.al + ' cm²', CXL, YBOT + 52, COL.white, 22, 'center');
    if (!canLift()) U.pill(c, T('F大 < 重物，舉不起來', 'F big < load: cannot lift'), CXL, 90, COL.coral, 22);
    else U.pill(c, T('壓一下，大活塞就上升', 'Press: the big piston rises'), CXL, 90, COL.teal, 22);
    /* 右側資訊 */
    const bx = 640, bw2 = 300;
    const rows = [
      [T('小活塞', 'Small piston'), S.f + ' kgw ÷ ' + S.as + ' cm²', COL.teal],
      [T('壓力 P（處處相同）', 'Pressure P (everywhere)'), (Math.round(P() * 10) / 10) + ' gw/cm²', COL.coral],
      [T('大活塞 F大 ＝ P × A大', 'Big piston F = P × A'), (Math.round(FL() * 10) / 10) + ' kgw', canLift() ? COL.teal : COL.dim]
    ];
    rows.forEach((r, i) => {
      const y = 82 + i * 92;
      U.rr(c, bx, y, bw2, 80, 10); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill(); c.strokeStyle = r[2]; c.lineWidth = 2.5; c.stroke();
      U.label(c, r[0], bx + 14, y + 24, COL.white, 22, 'left');
      U.label(c, r[1], bx + 14, y + 58, r[2], 24, 'left', true);
    });
    U.rr(c, bx, 362, bw2, 130, 10); c.fillStyle = 'rgba(255,224,102,0.08)'; c.fill(); c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.stroke();
    U.label(c, T('做功（kgw·cm）', 'Work (kgw·cm)'), bx + 14, 388, COL.yellow, 22, 'left');
    U.label(c, S.f + ' × ' + DSTROKE + ' = ' + (S.f * DSTROKE), bx + 14, 424, COL.teal, 22, 'left', true);
    const dl = Math.round(dL() * 100) / 100, fl2 = Math.round(FL() * 10) / 10;
    U.label(c, canLift() ? fl2 + ' × ' + dl + ' = ' + Math.round(fl2 * dl * 10) / 10 : T('大活塞不動，做功 0', 'No lift: work 0'), bx + 14, 462, canLift() ? COL.teal : COL.dim, 22, 'left', true);
  }

  function result() {
    const f = Math.round(FL() * 10) / 10, dl = Math.round(dL() * 100) / 100;
    if (!canLift()) {
      return `<div><span class="lw-big lw-bad">${T('舉不起來：F大 < 重物', 'Cannot lift: F big < the load')}</span></div>` +
        `<div>${T('P ＝ ', 'P = ')}${S.f} kgw ÷ ${S.as} cm² ＝ <b class="lw-p">${Math.round(P() * 10) / 10} gw/cm²</b>${T('，F大 ＝ P × A大 ＝ ', ', F big = P × A big = ')}<b class="lw-y">${f} kgw</b>${T('，比重物 ', ', less than the ')}${LOAD}${T(' kgw 小。', ' kgw load.')}</div>` +
        `<div>${T('把 F小 調大，或把 A大 調大，再壓壓看。', 'Raise F small or A big, then press again.')}</div>`;
    }
    return `<div><span class="lw-big lw-c">${T('舉得起！省力的代價是移動距離變短', 'It lifts! The price of the saved effort is a shorter move')}</span></div>` +
      `<div>P ＝ ${S.f} kgw ÷ ${S.as} cm² ＝ <b class="lw-p">${Math.round(P() * 10) / 10} gw/cm²</b>${T('，F大 ＝ P × A大 ＝ ', ', F big = P × A big = ')}<b class="lw-y">${f} kgw</b></div>` +
      `<div>${T('小活塞下壓 ', 'Small piston down ')}${DSTROKE}${T(' cm，大活塞只升 ', ' cm; the big one rises only ')}<b class="lw-y">${dl} cm</b>${T('：F小 × d小 ＝ F大 × d大。', ': F small × d small = F big × d big.')}</div>`;
  }

  M4Lab.make({
    key: 'jack', tab: 'tab4',
    titleZh: '動手做｜液壓千斤頂', titleEn: 'Try it | Hydraulic Jack',
    subZh: '重物 100 kgw 壓在大活塞上。調整活塞面積與你的施力，按「壓一下」，看看舉不舉得起來？', subEn: 'A 100 kgw load sits on the big piston. Set the piston areas and your push, press, and see whether it lifts.',
    tipZh: '先預測：A大 是 A小 的幾倍，力就被放大幾倍；但大活塞只會升高幾分之一。', tipEn: 'Predict first: the force grows by the area ratio, but the big piston rises by the same fraction.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'press', zh: '👇 壓一下', en: '👇 Press once', on: press },
        { id: 'reset', zh: '↺ 重設高度', en: '↺ Reset height', on: reset }
      ] },
      { kind: 'slider', id: 'as', zh: '小活塞面積 A小', en: 'Small piston area', min: 10, max: 50, step: 5, get: () => S.as, set: v => { S.as = v; }, fmt: v => v + ' cm²' },
      { kind: 'slider', id: 'al', zh: '大活塞面積 A大', en: 'Big piston area', min: 100, max: 400, step: 50, get: () => S.al, set: v => { S.al = v; }, fmt: v => v + ' cm²' },
      { kind: 'slider', id: 'f', zh: '你的施力 F小', en: 'Your push F small', min: 1, max: 30, step: 1, get: () => S.f, set: v => { S.f = v; }, fmt: v => v + ' kgw' }
    ],
    step, draw, result,
    snapshot: s => ({ as: s.as, al: s.al, f: s.f, P: +P().toFixed(1), FL: +FL().toFixed(1), canLift: canLift(), lift: +s.lift.toFixed(2), pressing: s.p >= 0 })
  });
  window.W5Lab.jack.set = function (o) { Object.assign(S, o); window.W5Lab.jack.request(); };
  window.W5Lab.jack.press = function () { press(); window.W5Lab.jack.request(); };
})();
