/* mechanics_5_lab_float_1127_v1.js — 「動手做｜沉浮實驗室」（#floatLabCanvas，960×540，掛在 tab4）
 * 契約：window.W5Lab.float = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理：物體是 100 cm³ 的方塊，W ＝ V × D物（gw，1 cm³ ＝ 1 單位，D 單位 gw/cm³）。
 *   D物 ＜ D液：浮，B ＝ W，V排 ＝ W ÷ D液，水下比例 ＝ D物 ÷ D液；
 *   D物 ＝ D液：懸浮（完全沒入，B ＝ W；畫面讓它停在水中間，水中任何深度都能停）；
 *   D物 ＞ D液：沉底，V排 ＝ V物 ＝ 100，B ＝ 100 × D液 ＜ W，杯底支持力 N ＝ W － B。
 *   B ＝ V排 × D液。畫面動力：a ＝ g × (W － B(y)) ÷ W，B 隨浸入深度連續變化，加上水的阻力，所以會上下晃動後停住。
 *   受力圖：W（橘）與 B（青）同比例，1 gw ＝ 0.3 px。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;
  /* 英文版：把全形數學符號換成半形 */
  const fw = s => (T('0', '1') === '1' ? String(s).replace(/＝/g, '=').replace(/＋/g, '+').replace(/－/g, '−').replace(/＜/g, '<').replace(/＞/g, '>').replace(/，/g, ', ').replace(/；/g, '; ').replace(/：/g, ': ').replace(/（/g, ' (').replace(/）/g, ')') : s);

  const V = 100, SIDE = 90, TX0 = 70, TX1 = 540, TTOP = 120, YB = 470, YS = 200, BX = 410;
  const MID = (YS + YB) / 2, G = 1200, Y0 = 60, GWPX = 0.3, PCX = 760, PCY = 230;
  const LIQ = { water: { d: 1.0, zh: '清水', en: 'Water' }, brine: { d: 1.2, zh: '濃鹽水', en: 'Brine' }, oil: { d: 0.8, zh: '食用油', en: 'Cooking oil' } };
  const PRE = { wood: { d: 0.6, zh: '木塊', en: 'Wood' }, ice: { d: 0.9, zh: '冰塊', en: 'Ice' }, iron: { d: 7.9, zh: '鐵塊', en: 'Iron' } };

  const S = { Do: 0.6, kind: 'wood', liq: 'water', Dl: 1.0, y: 0, v: 0, rest: true, time: 0, ripple: 0, dropAt: null, prevF: 0 };

  const iO = () => Math.round(S.Do * 10), iL = () => Math.round(S.Dl * 10);
  const mode = () => (iO() < iL() ? 'float' : iO() === iL() ? 'susp' : 'sink');
  const W = () => iO() * 10;
  const Vp = () => (mode() === 'float' ? iO() * 100 / iL() : V);
  const B = () => (mode() === 'float' ? W() : Vp() * iL() / 10);
  const frac = () => (mode() === 'float' ? iO() / iL() : 1);
  const fOf = y => U.clamp((y + SIDE / 2 - YS) / SIDE, 0, 1);
  function eqY() {
    const m = mode();
    if (m === 'float') return YS - (1 - frac()) * SIDE + SIDE / 2;
    if (m === 'susp') return MID;
    return YB - SIDE / 2;
  }
  function settle() { S.y = eqY(); S.v = 0; S.rest = true; S.prevF = fOf(S.y); }
  settle();

  function drop() { S.y = Y0; S.v = 0; S.rest = false; S.prevF = 0; }
  function preset(k) { S.kind = k; S.Do = PRE[k].d; S.dropAt = null; drop(); }
  function setLiq(k) { S.liq = k; S.Dl = LIQ[k].d; S.ripple = Math.max(S.ripple, 1.2); S.rest = false; }
  function setDo(v) { S.Do = Math.round(v * 10) / 10; S.kind = 'custom'; S.dropAt = S.time + 0.45; S.rest = false; }

  function step(_, dt) {
    S.time += dt;
    if (S.dropAt != null && S.time >= S.dropAt) { S.dropAt = null; drop(); }
    let moving = S.dropAt != null || S.ripple > 0.08;
    if (!S.rest) {
      moving = true;
      const n = 4, h = dt / n, m = mode(), Do = S.Do;
      for (let i = 0; i < n; i++) {
        const f = fOf(S.y);
        let a = G * (Do - S.Dl * f) / Do;
        if (f > 0.001) a -= 4 * S.v + 0.012 * Math.abs(S.v) * S.v;
        if (m === 'susp' && f > 0.99) a += 30 * (MID - S.y) - 4 * S.v;
        S.v += a * h; S.y += S.v * h;
        if (S.y + SIDE / 2 >= YB) { S.y = YB - SIDE / 2; S.v = S.v > 8 ? -0.1 * S.v : 0; }
        const f2 = fOf(S.y);
        if (S.prevF <= 0.001 && f2 > 0.001) S.ripple = Math.max(S.ripple, Math.min(4, Math.abs(S.v) / 110));
        S.prevF = f2;
      }
      if (fOf(S.y) > 0.001 && fOf(S.y) < 0.999) S.ripple = Math.max(S.ripple, Math.min(2.5, Math.abs(S.v) / 70));
      const eq = eqY();
      if (S.y > 0 && Math.abs(S.y - eq) < 0.4 && Math.abs(S.v) < 4 && S.time > 0) settle();
    }
    S.ripple *= Math.exp(-1.3 * dt); if (S.ripple < 0.02) S.ripple = 0;
    return moving || !S.rest;
  }

  /* ── 畫法 ── */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B2 = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B2[i] - v) * t)).join(',') + ')'; };
  function blockColor() {
    if (S.kind === 'wood') return '#c98f4f';
    if (S.kind === 'ice') return '#cfeaf7';
    if (S.kind === 'iron') return '#8e9aa6';
    return mix('#d6a566', '#8e9aa6', U.clamp((S.Do - 0.2) / 2.8, 0, 1));
  }
  function drawBlock(c, cx, cy, size, alpha) {
    c.save(); c.globalAlpha = alpha == null ? 1 : alpha;
    U.rr(c, cx - size / 2, cy - size / 2, size, size, 6); c.fillStyle = blockColor(); c.fill();
    c.lineWidth = 3; c.strokeStyle = 'rgba(246,243,234,0.85)'; c.stroke();
    if (S.kind === 'wood') {
      c.strokeStyle = 'rgba(120,76,30,0.55)'; c.lineWidth = 2;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cx - size / 2 + 6, cy - size / 2 + i * size / 4); c.quadraticCurveTo(cx, cy - size / 2 + i * size / 4 + (i % 2 ? 5 : -5), cx + size / 2 - 6, cy - size / 2 + i * size / 4); c.stroke(); }
    } else if (S.kind === 'iron') {
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(cx - size / 2 + 6, cy - size / 2 + 6, size - 12, 8);
    } else if (S.kind === 'ice') {
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - size / 2 + 10, cy - size / 2 + 22); c.lineTo(cx - size / 2 + 30, cy - size / 2 + 8); c.stroke();
    }
    c.restore();
  }
  function liquid(c) {
    const k = S.liq, wob = S.ripple * 1.8, ph = S.time * 7;
    if (k === 'water') { U.waterRect(c, TX0, YS, TX1, YB + 8, { wob, phase: ph }); return; }
    const col = k === 'brine' ? ['rgba(70,185,205,0.58)', 'rgba(24,120,150,0.78)', '#a8eef4'] : ['rgba(232,176,72,0.52)', 'rgba(176,118,36,0.74)', '#ffd88a'];
    const g = c.createLinearGradient(0, YS, 0, YB); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    c.fillStyle = g; c.fillRect(TX0, YS, TX1 - TX0, YB + 8 - YS);
    c.strokeStyle = col[2]; c.lineWidth = 3; c.beginPath();
    for (let x = TX0; x <= TX1; x += 6) { const y = YS + wob * Math.sin((x - TX0) * 0.09 + ph); if (x === TX0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  }

  function draw(c) {
    const m = mode(), w = W(), b = B();
    /* 水槽底座 */
    c.fillStyle = 'rgba(246,243,234,0.12)'; c.fillRect(TX0 - 8, YB, TX1 - TX0 + 16, 10);
    /* 物體 → 液體（水下部分被液體染色）→ 玻璃壁 */
    drawBlock(c, BX, S.y, SIDE, 1);
    c.save(); c.beginPath(); c.rect(TX0, TTOP, TX1 - TX0, YB + 8 - TTOP); c.clip(); liquid(c); c.restore();
    c.save(); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(TX0, TTOP); c.lineTo(TX0, YB + 8); c.lineTo(TX1, YB + 8); c.lineTo(TX1, TTOP); c.stroke(); c.restore();
    U.label(c, (S.Do).toFixed(1), BX, S.y, COL.white, 24, 'center', true);
    /* 液體名稱（左下） */
    const L = LIQ[S.liq];
    U.label(c, T('液體：', 'Liquid: ') + T(L.zh, L.en) + fw('　D ＝ ' + S.Dl.toFixed(1)), TX0 + 14, YB - 26, COL.white, 22, 'left');
    /* 水下比例 */
    if (m === 'float') U.pill(c, T('水下 ', 'Under ') + Math.round(frac() * 100) + '%', BX - SIDE / 2 - 14, S.y, COL.teal, 22, 'right');
    /* 狀態 */
    const st = m === 'float' ? [T('浮體：B ＝ W', 'Floating: B = W'), COL.teal] : m === 'susp' ? [T('懸浮：B ＝ W，完全沒入', 'Suspended: B = W, fully under'), COL.green] : [T('沉體：B ＜ W', 'Sinking: B < W'), COL.coral];
    U.pill(c, st[0], (TX0 + TX1) / 2, 512, st[1], 22);

    /* 右側受力圖（W 與 B 同比例） */
    U.pill(c, T('受力圖　1 gw ＝ 0.3 px', 'Forces  1 gw = 0.3 px'), PCX, 60, COL.white, 22);
    drawBlock(c, PCX, PCY, SIDE, 0.35);
    const lw = w * GWPX, lb = b * GWPX;
    U.arrow(c, PCX, PCY, PCX, PCY + lw, COL.coral, 8);
    U.arrow(c, PCX, PCY, PCX, PCY - lb, COL.teal, 8);
    U.pill(c, fw('W ＝ ' + w + ' gw'), PCX - 18, Math.max(PCY + 66, PCY + lw * 0.75), COL.coral, 22, 'right', true);
    U.pill(c, fw('B ＝ ' + fmt(b) + ' gw'), PCX - 18, PCY - Math.max(66, lb + 26), COL.teal, 22, 'right', true);
    const rel = m === 'float' ? '＜' : m === 'susp' ? '＝' : '＞';
    U.pill(c, fw('D' + T('物', ' obj') + ' ' + S.Do.toFixed(1) + ' ' + rel + ' D' + T('液', ' liq') + ' ' + S.Dl.toFixed(1)), PCX, 512, COL.yellow, 22, 'center', true);
  }

  const fmt = n => { const r = Math.round(n * 10) / 10; return String(r); };
  const isInt = n => Math.abs(n - Math.round(n * 10) / 10) < 1e-9;
  const EQ = n => (isInt(n) ? '＝ ' : '≈ ');

  function resultRaw() {
    const m = mode(), w = W(), vp = Vp(), b = B(), Do = S.Do.toFixed(1), Dl = S.Dl.toFixed(1);
    const rel = m === 'float' ? '＜' : m === 'susp' ? '＝' : '＞';
    const cmp = `D${T('物', ' obj')} ${Do} ${rel} D${T('液', ' liq')} ${Dl}`;
    const head = m === 'float'
      ? `<span class="lw-big lw-c">${T('浮體：B ＝ W，只有一部分在液體裡', 'Floating: B = W, only part of it is under')}</span>`
      : m === 'susp' ? `<span class="lw-big lw-ok">${T('懸浮：B ＝ W，完全沒入，可停在任何深度', 'Suspended: B = W, fully under, stays at any depth')}</span>`
        : `<span class="lw-big lw-bad">${T('沉體：B ＜ W，沉到底', 'Sinking: B < W, it falls to the bottom')}</span>`;
    const cmpTxt = m === 'float' ? T('物體比液體輕 → 浮', 'lighter than the liquid → floats') : m === 'susp' ? T('一樣重 → 懸浮', 'same density → suspended') : T('物體比液體重 → 沉', 'heavier than the liquid → sinks');
    const l1 = `<b class="lw-y">${cmp}</b>${T('，', ', ')}${cmpTxt}${T('；', '; ')}W ＝ V × D${T('物', ' obj')} ＝ ${V} × ${Do} ＝ <b class="lw-p">${w} gw</b>`;
    const l2 = m === 'float'
      ? `${T('V排：浮體 B ＝ W，V排 ＝ W ÷ D液 ＝ ', 'V disp: floating B = W, V = W ÷ D liq = ')}${w} ÷ ${Dl} ${EQ(vp)}<b class="lw-y">${fmt(vp)} cm³</b>${T('（水下 ', ' (under ')}${Do} ÷ ${Dl} ${isInt(frac() * 100) ? '＝' : '≈'} ${Math.round(frac() * 100)}%${T('）', ')')}`
      : `${T('V排：完全沒入，V排 ＝ V物 ＝ ', 'V disp: fully under, V = V obj = ')}<b class="lw-y">${V} cm³</b>`;
    const bEq = m === 'float' ? `${fmt(vp)} × ${Dl} ${isInt(vp) ? '＝' : '≈'} <b class="lw-c">${w} gw</b>` : `${V} × ${Dl} ＝ <b class="lw-c">${fmt(b)} gw</b>`;
    let l3 = `B ＝ V${T('排', ' disp')} × D${T('液', ' liq')} ＝ ${bEq}`;
    if (m === 'float') l3 += `${T('，B ＝ W', ', B = W')}`;
    else if (m === 'susp') l3 += `${T('，B ＝ W，完全沒入', ', B = W, fully under')}`;
    else l3 += `${T(' ＜ W ＝ ', ' < W = ')}${w}${T('；杯底托力 N ＝ W － B ＝ ', '; bottom pushes N = W − B = ')}<b class="lw-p">${fmt(w - b)} gw</b>`;
    return `<div>${head}</div><div>${l1}</div><div>${l2}</div><div>${l3}</div>`;
  }

  const result = () => fw(resultRaw());
  M4Lab.make({
    key: 'float', tab: 'tab4',
    titleZh: '動手做｜沉浮實驗室', titleEn: 'Try it | Sink-or-Float Lab',
    subZh: '選一個物體、選一種液體，先猜：它會浮、會沉，還是剛好懸在水中？再看浮力 B 和重力 W 誰大。', subEn: 'Pick an object and a liquid. Predict: float, sink, or hang in mid-liquid? Then compare the buoyant force B with the weight W.',
    tipZh: '方塊體積都是 100 cm³；W 與 B 的箭頭用同一個比例（1 gw ＝ 0.3 px）。選鐵塊時 D＝7.9，滑桿已超出 3.0，會停在最右邊。', tipEn: 'Every block is 100 cm³; W and B use the same scale (1 gw = 0.3 px). Iron is D = 7.9, beyond the slider\'s 3.0, so the knob rests at the far right.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: Object.keys(PRE).map(k => ({ id: k, zh: PRE[k].zh + ' D＝' + PRE[k].d, en: PRE[k].en + ' D = ' + PRE[k].d, on: () => preset(k), active: () => S.kind === k })) },
      { kind: 'slider', id: 'do', zh: '物體密度 D物', en: 'Object density', min: 0.2, max: 3.0, step: 0.1, get: () => S.Do, set: setDo, fmt: v => v.toFixed(1) + ' gw/cm³' },
      { kind: 'buttons', items: Object.keys(LIQ).map(k => ({ id: 'l_' + k, zh: LIQ[k].zh + ' D＝' + LIQ[k].d.toFixed(1), en: LIQ[k].en + ' D = ' + LIQ[k].d.toFixed(1), on: () => setLiq(k), active: () => S.liq === k })) }
    ],
    step, draw, result,
    snapshot: s => ({ Do: s.Do, Dl: s.Dl, kind: s.kind, liq: s.liq, mode: mode(), W: W(), Vp: +Vp().toFixed(2), B: +B().toFixed(2), frac: +frac().toFixed(3), y: +s.y.toFixed(1), eqY: +eqY().toFixed(1), rest: s.rest, ripple: +s.ripple.toFixed(2) })
  });
  window.W5Lab.float.set = function (o) {
    if (o.Do != null) { S.Do = o.Do; S.kind = o.kind || 'custom'; }
    if (o.liq) { S.liq = o.liq; S.Dl = LIQ[o.liq].d; }
    if (o.drop) drop(); else if (o.settle) settle(); else S.rest = false;
    window.W5Lab.float.request();
  };
})();
