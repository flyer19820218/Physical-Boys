/* mechanics_5_lab_ice_1127_v1.js — 「動手做｜冰塊融化實驗台」（#iceLabCanvas，960×540，掛在 tab5）
 * 契約：window.W5Lab.ice = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理：量杯底面積 100 cm²，液體 400 cm³（不含冰），一塊冰 90 gw、體積 100 cm³（D冰 ＝ 0.9）。
 *   融化程度 f（0～1）：冰剩 m ＝ 90 × (1 － f) gw，冰體積 100 × (1 － f) cm³；
 *   V排 ＝ min(冰體積, m ÷ D液)（D液 ≥ 0.9 冰漂浮，V排 ＝ m ÷ D液；食用油 D＝0.8 冰沉底，V排 ＝ 冰體積）；
 *   融出的水 V融化 ＝ 90 × f（淡水 D＝1.0，與液體體積相加，忽略混合體積變化）；
 *   液面高度 ＝ (400 ＋ V排 ＋ V融化) ÷ 100 cm；相對原來液面：Δh ＝ (V排(f) ＋ V融化(f) － V排(0)) ÷ 100 cm。
 *   D液 ＝ 1.0：Δh 恆為 0；D液 ＝ 1.2：融完升 0.15 cm；食用油：融完降 1 cm。
 *   右側「放大 20 倍」液面窗：1 mm ＝ 4 px（量杯畫面）× 20 ＝ 80 px。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;
  /* 英文版：把全形數學符號換成半形 */
  const fw = s => (T('0', '1') === '1' ? String(s).replace(/＝/g, '=').replace(/＋/g, '+').replace(/－/g, '−').replace(/＜/g, '<').replace(/＞/g, '>').replace(/，/g, ', ').replace(/；/g, '; ').replace(/：/g, ': ').replace(/（/g, ' (').replace(/）/g, ')') : s);

  const SC = 40, BX0 = 160, BX1 = 560, YB = 496, BTOP = 216, ICX = 340, ICE_V = 100, ICE_W = 90, LIQ_V = 400, AREA = 100;
  const WX0 = 620, WX1 = 940, WY0 = 100, WY1 = 480, YC = 290, MAG = 20, PXMM = SC / 10 * MAG;
  const DURATION = 10;

  const S = { f: 0, fd: 0, Dl: 1.0, oil: false, auto: false, time: 0, ripple: 0, act: 0 };

  const vice = f => ICE_V * (1 - f);
  const vp = (D, f) => Math.min(vice(f), ICE_W * (1 - f) / D);
  const vm = f => ICE_W * f;
  const dhCm = (D, f) => (vp(D, f) + vm(f) - vp(D, 0)) / AREA;
  const hCm = (D, f) => (LIQ_V + vp(D, f) + vm(f)) / AREA;
  const sinks = () => S.Dl < 0.9 - 1e-9;

  function setLiq(k) { S.oil = k === 'oil'; S.Dl = k === 'oil' ? 0.8 : k === 'brine' ? 1.2 : 1.0; S.act = 1; }
  function setSalt(v) { S.oil = false; S.Dl = Math.round(v * 100) / 100; S.act = 1; }
  function setMelt(v) { S.f = U.clamp(v / 100, 0, 1); S.auto = false; S.act = 1; }
  function autoMelt() { if (S.auto) { S.auto = false; return; } if (S.f >= 0.999) S.f = 0; S.auto = true; }
  function reset() { S.f = 0; S.auto = false; S.Dl = 1.0; S.oil = false; S.fd = 0; S.act = 0; S.ripple = 0; }

  function step(_, dt) {
    S.time += dt;
    if (S.auto) { S.f = Math.min(1, S.f + dt / DURATION); S.act = 1; if (S.f >= 1) S.auto = false; }
    const gap = S.f - S.fd;
    S.fd += gap * (1 - Math.exp(-12 * dt));
    if (Math.abs(S.f - S.fd) < 0.0004) S.fd = S.f;
    S.ripple = Math.max(S.ripple * Math.exp(-1.6 * dt), Math.min(1.6, Math.abs(gap) * 14));
    if (S.ripple < 0.03) S.ripple = 0;
    S.act = Math.max(0, S.act - dt * 0.9);
    return S.auto || Math.abs(S.f - S.fd) > 0.0004 || S.ripple > 0.05 || S.act > 0.05 || S.time < 0.3;
  }

  /* ── 畫法 ── */
  const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function liqRGB() {
    if (S.oil) return { top: 'rgba(232,176,72,0.52)', bot: 'rgba(176,118,36,0.74)', edge: '#ffd88a' };
    const t = U.clamp((S.Dl - 1.0) / 0.3, 0, 1), a = mixc([47, 143, 216], [60, 190, 205], t), b = mixc([26, 96, 168], [22, 126, 150], t);
    return { top: `rgba(${a},0.55)`, bot: `rgba(${b},0.74)`, edge: t > 0.4 ? '#a8eef4' : COL.waterEdge };
  }
  function fillLiquid(c, x0, x1, ys, yb, wob, ph) {
    const L = liqRGB(), g = c.createLinearGradient(0, ys, 0, yb);
    g.addColorStop(0, L.top); g.addColorStop(1, L.bot);
    c.fillStyle = g; c.fillRect(x0, ys, x1 - x0, yb - ys);
    c.strokeStyle = L.edge; c.lineWidth = 3; c.beginPath();
    for (let x = x0; x <= x1; x += 6) { const y = ys + wob * Math.sin((x - x0) * 0.09 + ph); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  }
  const fmtN = (n, d) => { let s = (Math.round(n * Math.pow(10, d || 2)) / Math.pow(10, d || 2)).toString(); if (s === '-0') s = '0'; return s.replace('-', '−'); };
  const exact = n => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
  const sgnMm = mm => (Math.abs(mm) < 0.005 ? '0' : (mm > 0 ? '+' : '−') + fmtN(Math.abs(mm), 2));

  function draw(c) {
    const f = S.fd, h = hCm(S.Dl, f), ys = YB - h * SC, y0 = YB - hCm(S.Dl, 0) * SC;
    const wob = S.ripple * 1.5, ph = S.time * 7;
    const layer = S.oil ? vm(f) / AREA * SC : 0;
    const side = Math.cbrt(vice(f)) * SC;
    /* 量杯底座 */
    c.fillStyle = 'rgba(246,243,234,0.12)'; c.fillRect(BX0 - 10, YB, BX1 - BX0 + 20, 10);
    /* 冰（先畫，液體疊在上面染色） */
    let iceTop = 0, iceBot = 0;
    if (f < 0.995) {
      const draft = sinks() ? side : vp(S.Dl, f) / vice(f) * side;
      iceBot = sinks() ? YB - layer : ys + draft; iceTop = iceBot - side;
      U.rr(c, ICX - side / 2, iceTop, side, side, Math.min(8, side / 3)); c.fillStyle = 'rgba(214,240,250,0.92)'; c.fill();
      c.lineWidth = 3; c.strokeStyle = 'rgba(246,243,234,0.9)'; c.stroke();
      if (side > 60) { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ICX - side / 2 + 14, iceTop + 30); c.lineTo(ICX - side / 2 + 36, iceTop + 12); c.stroke(); }
    }
    /* 液體 */
    c.save(); c.beginPath(); c.rect(BX0, BTOP, BX1 - BX0, YB + 8 - BTOP); c.clip();
    if (S.oil) {
      fillLiquid(c, BX0, BX1, ys, YB - layer, wob, ph);
      if (layer > 0.5) { c.fillStyle = 'rgba(100,185,235,0.75)'; c.fillRect(BX0, YB - layer, BX1 - BX0, layer + 8); }
    } else fillLiquid(c, BX0, BX1, ys, YB + 8, wob, ph);
    c.restore();
    /* 融化的水滴 */
    if (S.act > 0.2 && f > 0.001 && f < 0.995) {
      for (let k = 0; k < 3; k++) {
        const p = (S.time * 1.4 + k / 3) % 1, dx = (k - 1) * side * 0.28;
        c.fillStyle = 'rgba(190,235,255,' + (0.9 * (1 - p)).toFixed(2) + ')';
        c.beginPath(); c.arc(ICX + dx, iceBot + 6 + p * 38, 5, 0, 6.283); c.fill();
      }
    }
    /* 原來液面（虛線） */
    c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.setLineDash([10, 8]);
    c.beginPath(); c.moveTo(BX0, y0); c.lineTo(BX1, y0); c.stroke(); c.restore();
    U.label(c, T('原來液面', 'Start level'), BX0 - 12, y0, COL.yellow, 22, 'right');
    /* 玻璃杯 */
    c.save(); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(BX0, BTOP); c.lineTo(BX0, YB + 8); c.lineTo(BX1, YB + 8); c.lineTo(BX1, BTOP); c.stroke(); c.restore();
    /* 放大鏡取景框與連線 */
    const rx0 = 466, rx1 = 552, rh = 12;
    c.save(); c.strokeStyle = COL.teal; c.lineWidth = 2.5; c.strokeRect(rx0, y0 - rh, rx1 - rx0, 2 * rh);
    c.setLineDash([6, 6]); c.globalAlpha = 0.7; c.beginPath(); c.moveTo(rx1, y0 - rh); c.lineTo(WX0, WY0); c.moveTo(rx1, y0 + rh); c.lineTo(WX0, WY1); c.stroke(); c.restore();
    /* 杯上文字 */
    U.pill(c, T('冰融化 ', 'Ice melted ') + Math.round(S.f * 100) + '%', ICX, 176, COL.teal, 22);
    U.pill(c, T('杯底面積 100 cm²　液體 400 cm³（不含冰）', 'Base 100 cm²   liquid 400 cm³ (no ice)'), 20, 40, COL.white, 22, 'left');
    U.pill(c, T('冰塊 90 gw　體積 100 cm³', 'Ice 90 gw   volume 100 cm³'), 20, 84, COL.dim, 22, 'left');
    U.label(c, T('液體：', 'Liquid: ') + liqName() + fw('　D ＝ ' + S.Dl.toFixed(2)), (BX0 + BX1) / 2, 524, COL.white, 22, 'center');

    /* 放大窗（放大 20 倍） */
    const dMm = dhCm(S.Dl, f) * 10, raw = YC - dMm * PXMM;
    const out = raw < WY0 + 6 ? -1 : raw > WY1 - 6 ? 1 : 0;
    const sy = U.clamp(raw, WY0 + 6, WY1 - 6);
    c.save(); U.rr(c, WX0, WY0, WX1 - WX0, WY1 - WY0, 12); c.clip();
    c.fillStyle = '#0b1a15'; c.fillRect(WX0, WY0, WX1 - WX0, WY1 - WY0);
    fillLiquid(c, WX0, WX1, sy, WY1, S.ripple * 2.2, ph);
    for (let k = -2; k <= 2; k++) {
      if (!k) continue;
      const ty = YC - k * PXMM;
      if (ty < WY0 + 14 || ty > WY1 - 14) continue;
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(WX0, ty); c.lineTo(WX0 + 26, ty); c.stroke();
      U.label(c, (k > 0 ? '+' : '−') + Math.abs(k) + ' mm', WX0 + 34, ty, COL.white, 22, 'left', true);
    }
    c.strokeStyle = COL.yellow; c.lineWidth = 3; c.setLineDash([12, 9]); c.beginPath(); c.moveTo(WX0, YC); c.lineTo(WX1, YC); c.stroke(); c.setLineDash([]);
    c.restore();
    c.save(); U.rr(c, WX0, WY0, WX1 - WX0, WY1 - WY0, 12); c.lineWidth = 4; c.strokeStyle = COL.teal; c.stroke(); c.restore();
    U.label(c, T('原來液面', 'Start level'), WX1 - 12, YC - 22, COL.yellow, 22, 'right');
    if (out) U.pill(c, out < 0 ? T('↑ 液面在窗外', '↑ level above window') : T('↓ 液面在窗外', '↓ level below window'), (WX0 + WX1) / 2, out < 0 ? WY0 + 34 : WY1 - 34, COL.coral, 22);
    U.pill(c, T('放大 20 倍', 'Magnified ×20'), (WX0 + WX1) / 2, 70, COL.teal, 22);
    const col = Math.abs(dMm) < 0.005 ? COL.green : dMm > 0 ? COL.coral : COL.teal;
    U.pill(c, T('液面 Δh ＝ ', 'Level Δh = ') + sgnMm(dMm) + ' mm', (WX0 + WX1) / 2, 512, col, 22, 'center', true);
  }

  function liqName() {
    if (S.oil) return T('食用油', 'Cooking oil');
    if (Math.abs(S.Dl - 1.0) < 1e-9) return T('清水', 'Water');
    if (Math.abs(S.Dl - 1.2) < 1e-9) return T('濃鹽水', 'Brine');
    return T('鹽水', 'Salt water');
  }

  /* ── 結果框 ── */
  function resultRaw() {
    const f = Math.round(S.f * 100) / 100, D = S.Dl, m = ICE_W * (1 - f), v = vp(D, f), v0 = vp(D, 0), vmx = vm(f), dc = dhCm(D, f), dmm = dc * 10;
    const pct = Math.round(f * 100), fs = f.toFixed(2), Ds = D.toFixed(2);
    const ap = n => (exact(n) ? '＝' : '≈');
    let head;
    if (f < 0.001) head = `<span class="lw-big lw-c">${T('還沒融化：先猜，冰融完後液面會升、降，還是不變？', 'Nothing melted yet: predict whether the level rises, falls or stays?')}</span>`;
    else if (Math.abs(dmm) < 0.005) head = `<span class="lw-big lw-ok">${T('液面不變：Δh ＝ 0', 'Level unchanged: Δh = 0')}</span>`;
    else if (dmm > 0) head = `<span class="lw-big lw-bad">${T('液面上升 ', 'Level rises ')}${fmtN(dmm, 2)} mm</span>`;
    else head = `<span class="lw-big lw-c">${T('液面下降 ', 'Level falls ')}${fmtN(-dmm, 2)} mm</span>`;
    const o0 = fmtN(v0), o1 = fmtN(v), o2 = fmtN(vmx);
    const vLine = sinks()
      ? `${T('冰沉在杯底：V排 ＝ 冰體積 ＝ 100 × (1 － ', 'Ice sits on the bottom: V disp = ice volume = 100 × (1 − ')}${fs}) ＝ <b class="lw-y">${o1} cm³</b>${T('（原本 ', ' (start ')}${o0})`
      : `${T('冰剩 m ＝ 90 × (1 － ', 'Ice left m = 90 × (1 − ')}${fs}) ＝ ${fmtN(m)} gw；V${T('排', ' disp')} ＝ m ÷ D${T('液', ' liq')} ＝ ${fmtN(m)} ÷ ${Ds} ${ap(v)} <b class="lw-y">${o1} cm³</b>${T('（原本 ', ' (start ')}${o0})`;
    const mLine = `V${T('融化', ' melt')} ＝ 90 × ${fs} ＝ <b class="lw-c">${o2} cm³</b>${T('（淡水，D＝1.0）', ' (fresh water, D = 1.0)')}`;
    const lost = v0 - v;
    let cmpTxt;
    if (f < 0.001) cmpTxt = T('還沒融，兩邊都是 0。', 'nothing melted: both are 0.');
    else if (Math.abs(vmx - lost) < 1e-6) cmpTxt = `<b class="lw-ok">${o2} ＝ ${fmtN(lost)}</b>${T('，融水剛好補回，液面不變', ': just refilled, level stays')}`;
    else if (vmx > lost) cmpTxt = `<b class="lw-bad">${o2} ＞ ${fmtN(lost)}</b>${T('，融水比少排開的多，液面上升', ': more melt water, level rises')}`;
    else cmpTxt = `<b class="lw-c">${o2} ＜ ${fmtN(lost)}</b>${T('，融水比少排開的少，液面下降', ': less melt water, level falls')}`;
    const cmpLine = `${T('比較：少排開 ', 'Compare: displacement lost ')}${o0} － ${o1} ＝ ${fmtN(lost)} cm³；V${T('融化', ' melt')} ＝ ${o2} → ${cmpTxt}`;
    const dLine = `Δh ＝ (V${T('排', ' disp')} ＋ V${T('融化', ' melt')} － V${T('排原本', ' start')}) ÷ 100 ＝ (${o1} ＋ ${o2} － ${o0}) ÷ 100 ${ap(dc)} ${fmtN(dc, 3)} cm ${ap(dmm)} <b class="lw-p">${fmtN(dmm, 2)} mm</b>${T('（放大窗 × 20 ＝ ', ' (×20 window: ')}${fmtN(dmm * MAG, 1)} mm${T('）', ')')}`;
    return `<div>${head}</div><div>${vLine}</div><div>${mLine}</div><div>${cmpLine}</div><div>${dLine}</div>`;
  }

  const result = () => fw(resultRaw());
  M4Lab.make({
    key: 'ice', tab: 'tab5',
    titleZh: '動手做｜冰塊融化實驗台', titleEn: 'Try it | Melting-Ice Lab',
    subZh: '一塊冰漂在量杯裡。換不同的液體、拉動「融化程度」，右邊的放大窗會告訴你：冰融完，液面比原來高、低，還是一樣？', subEn: 'An ice cube floats in a beaker. Change the liquid and drag the melting slider; the magnified window shows whether the level ends up higher, lower, or the same.',
    tipZh: '液面變化很小，所以右邊用放大 20 倍的窗口來看；黃色虛線是冰還沒融時的液面。食用油比冰輕，冰會沉在杯底（進階題）。', tipEn: 'The change is tiny, so the window on the right magnifies it 20 times; the yellow dashed line is the level before melting. Oil is lighter than ice, so the ice sinks (extension).',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'water', zh: '清水 D＝1.0', en: 'Water D = 1.0', on: () => setLiq('water'), active: () => !S.oil && Math.abs(S.Dl - 1.0) < 1e-9 },
        { id: 'brine', zh: '濃鹽水 D＝1.2', en: 'Brine D = 1.2', on: () => setLiq('brine'), active: () => !S.oil && Math.abs(S.Dl - 1.2) < 1e-9 },
        { id: 'oil', zh: '食用油 D＝0.8（進階）', en: 'Oil D = 0.8 (extension)', on: () => setLiq('oil'), active: () => S.oil }
      ] },
      { kind: 'slider', id: 'salt', zh: '鹽度（液體密度 D）', en: 'Salinity (liquid D)', min: 1.0, max: 1.3, step: 0.05, get: () => S.Dl, set: setSalt, fmt: v => fw('D＝' + v.toFixed(2)), disabled: () => S.oil },
      { kind: 'slider', id: 'melt', zh: '融化程度', en: 'Melted', min: 0, max: 100, step: 1, get: () => Math.round(S.f * 100), set: setMelt, fmt: v => v + '%' },
      { kind: 'buttons', items: [
        { id: 'auto', zh: '▶ 自動融化', en: '▶ Auto melt', on: autoMelt, active: () => S.auto },
        { id: 'reset', zh: '↺ 重來', en: '↺ Restart', on: reset }
      ] }
    ],
    step, draw, result,
    snapshot: s => ({ f: +s.f.toFixed(3), fd: +s.fd.toFixed(3), D: s.Dl, oil: s.oil, auto: s.auto, Vp: +vp(s.Dl, s.f).toFixed(2), Vp0: +vp(s.Dl, 0).toFixed(2), Vmelt: +vm(s.f).toFixed(2), dhMm: +(dhCm(s.Dl, s.f) * 10).toFixed(3), h: +hCm(s.Dl, s.f).toFixed(3) })
  });
  window.W5Lab.ice.set = function (o) {
    if (o.f != null) { S.f = o.f; S.fd = o.f; S.auto = false; }
    if (o.D != null) { S.oil = o.D < 0.9; S.Dl = o.D; }
    window.W5Lab.ice.request();
  };
})();
