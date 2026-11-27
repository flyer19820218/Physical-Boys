/* mechanics_5_lab_cao_1127_v1.js — 「動手做｜曹沖稱象」（#caoLabCanvas，960×540，掛在 tab3）
 * 契約：window.W5Lab.cao = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理（水 1000 kgw/m³）：
 *   船底面積 A ＝ 5 m × 2 m ＝ 10 m²，空船重 2000 kgw；船漂浮：浮力 ＝ 總重，排開水重 ＝ 1000 × A × d。
 *   吃水 d ＝ (2000 ＋ 載重) ÷ (1000 × 10) m；船高（到舷緣）0.64 m，吃水 ≥ 0.64 m 就沉。
 *   每籃石頭 500 kgw，最多 12 籃。大象（2000～3500、4000 kgw）不顯示重量，水線對齊紅線後才揭曉。
 *   對齊容許誤差 ±1 mm。畫面為剖面示意：船高方向放大（1 m ＝ 250 px），吃水用彈簧動畫連續變化。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;
  /* 英文版：把全形數學符號換成半形 */
  const fw = s => (T('0', '1') === '1' ? String(s).replace(/＝/g, '=').replace(/＋/g, '+').replace(/－/g, '−').replace(/＜/g, '<').replace(/＞/g, '>').replace(/，/g, ', ').replace(/；/g, '; ').replace(/：/g, ': ').replace(/（/g, ' (').replace(/）/g, ')') : s);

  const PXM = 250, YW = 300, HULL_H = 0.64, AREA = 10, EMPTY = 2000, BASKET = 500, NMAX = 12, TOL = 0.001;
  const ELE = [2000, 2500, 3000, 3500, 4000];
  const BL = 440, BR = 800, GROUND = 292, T_MOVE = 1.8;
  const ease = U.ease;

  const S = { E: 3000, n: 0, want: false, t: 0, mark: null, dd: 0.2, vd: 0, time: 0, ripple: 0 };
  S.dd = (EMPTY) / (1000 * AREA);

  const loaded = () => S.t >= 0.999;
  const settled = () => !S.want && S.t <= 0.001;
  const load = () => (loaded() ? S.E : 0) + S.n * BASKET;
  const dPhys = () => (EMPTY + load()) / (1000 * AREA);
  const mm = d => Math.round(d * 1000);
  const sunk = () => dPhys() >= HULL_H - 1e-9;
  const diff = () => (S.mark == null ? null : dPhys() - S.mark);
  const aligned = () => S.mark != null && settled() && S.n > 0 && Math.abs(diff()) <= TOL + 1e-9;
  const dTarget = () => (EMPTY + S.E * ease((S.t - 0.55) / 0.4) + S.n * BASKET) / (1000 * AREA);

  function board() { if (S.want || S.n > 0 || S.t > 0.001) return; S.want = true; }
  function leave() { S.want = false; }
  function markIt() { if (loaded()) S.mark = dPhys(); }
  function addStone() { if (!settled() || S.n >= NMAX) return; S.n++; S.ripple = Math.max(S.ripple, 1.4); }
  function removeStone() { if (!settled() || S.n <= 0) return; S.n--; S.ripple = Math.max(S.ripple, 1.2); }
  function newEle() {
    if (!settled()) return;
    const pool = ELE.filter(e => e !== S.E);
    S.E = pool[Math.floor(Math.random() * pool.length)];
    S.n = 0; S.mark = null;
  }
  function reset() { S.E = 3000; S.want = false; S.t = 0; S.n = 0; S.mark = null; S.ripple = 1; }

  function step(_, dt) {
    S.time += dt;
    const sp = dt / T_MOVE;
    const t0 = S.t;
    S.t = S.want ? Math.min(1, S.t + sp) : Math.max(0, S.t - sp);
    const target = dTarget(), h = dt / 4;
    for (let i = 0; i < 4; i++) { const a = 70 * (target - S.dd) - 9 * S.vd; S.vd += a * h; S.dd += S.vd * h; }
    S.ripple = Math.max(S.ripple * Math.exp(-1.6 * dt), Math.min(2.4, Math.abs(S.vd) * 14));
    if (S.ripple < 0.02) S.ripple = 0;
    return S.t !== t0 || Math.abs(target - S.dd) > 0.0004 || Math.abs(S.vd) > 0.004 || S.ripple > 0.08 || S.time < 0.3;
  }

  /* ── 畫法 ── */
  function elephant(c, cx, fy, walk) {
    c.save();
    const gray = '#9aa6b0', dark = '#7b8791', sw = walk ? Math.sin(S.time * 9) * 6 : 0;
    [[-40, 1], [-14, -1], [14, 1], [40, -1]].forEach(([dx, s], i) => {
      const x = cx + dx + s * sw;
      U.rr(c, x - 10, fy - 46, 20, 46, 6); c.fillStyle = i % 2 ? gray : dark; c.fill();
    });
    c.fillStyle = gray; c.beginPath(); c.ellipse(cx, fy - 74, 68, 40, 0, 0, 6.283); c.fill();
    c.beginPath(); c.arc(cx + 66, fy - 90, 28, 0, 6.283); c.fill();
    c.fillStyle = dark; c.beginPath(); c.ellipse(cx + 50, fy - 86, 15, 24, 0.2, 0, 6.283); c.fill();
    c.strokeStyle = gray; c.lineWidth = 15; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + 88, fy - 82); c.quadraticCurveTo(cx + 108, fy - 52, cx + 96, fy - 20); c.stroke();
    c.strokeStyle = '#f6f3ea'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx + 82, fy - 66); c.quadraticCurveTo(cx + 104, fy - 60, cx + 112, fy - 78); c.stroke();
    c.strokeStyle = dark; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 66, fy - 82); c.quadraticCurveTo(cx - 84, fy - 62, cx - 78, fy - 40); c.stroke();
    c.fillStyle = '#11261f'; c.beginPath(); c.arc(cx + 74, fy - 96, 4, 0, 6.283); c.fill();
    c.restore();
  }
  function basket(c, x, y) {
    c.save();
    c.fillStyle = '#9a6a35';
    c.beginPath(); c.moveTo(x - 22, y - 22); c.lineTo(x + 22, y - 22); c.lineTo(x + 17, y); c.lineTo(x - 17, y); c.closePath(); c.fill();
    c.strokeStyle = '#d6a864'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y - 12); c.lineTo(x + 20, y - 12); c.stroke();
    c.fillStyle = '#b4bec7';
    [[-10, -26], [4, -28], [13, -24]].forEach(p => { c.beginPath(); c.arc(x + p[0], y + p[1], 9, 0, 6.283); c.fill(); });
    c.restore();
  }
  function hullPath(c, bot) {
    const top = bot - HULL_H * PXM;
    c.beginPath(); c.moveTo(BL, top); c.lineTo(BL + 18, bot); c.lineTo(BR - 18, bot); c.lineTo(BR, top);
  }
  const wallX = (bot, y, left) => {
    const top = bot - HULL_H * PXM, k = U.clamp((y - top) / (bot - top), 0, 1);
    return left ? BL + 18 * k : BR - 18 * k;
  };

  function draw(c) {
    const bot = YW + S.dd * PXM, top = bot - HULL_H * PXM, floor = bot - 12;
    const isSunk = sunk();
    /* 岸 */
    c.fillStyle = '#2b4a36'; c.fillRect(0, GROUND, 400, 540 - GROUND);
    c.fillStyle = '#3f6b4a'; c.fillRect(0, GROUND, 400, 10);
    c.fillStyle = '#9aa6b0';
    [[300, 0, 16], [326, -4, 13], [352, 0, 17], [372, -6, 11], [338, -22, 12]].forEach(p => { c.beginPath(); c.arc(p[0], GROUND + p[1] - 2, p[2], 0, 6.283); c.fill(); });
    /* 船（後壁與底板） */
    hullPath(c, bot); c.closePath(); c.fillStyle = 'rgba(176,132,76,0.30)'; c.fill();
    U.rr(c, BL + 14, floor, BR - BL - 28, 12, 3); c.fillStyle = '#8b6b3f'; c.fill();
    /* 籃子 */
    for (let i = 0; i < S.n; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      basket(c, 620 - 144 + col * 48 + 24, floor - row * 40);
    }
    /* 大象 */
    const s = ease(S.t), ex = U.lerp(130, 600, s);
    const drop = ease((S.t - 0.55) / 0.3), hop = Math.sin(Math.PI * U.clamp((S.t - 0.45) / 0.4, 0, 1)) * 26;
    const ey = U.lerp(GROUND, floor, drop) - hop;
    elephant(c, ex, ey, S.t > 0.001 && S.t < 0.999);
    const known = aligned();
    U.pill(c, T('大象 ', 'Elephant ') + (known ? S.E + ' kgw' : '？ kgw'), ex + 14, ey - 128, known ? COL.green : COL.white, 22);
    /* 水 */
    c.save();
    if (!isSunk) { /* 船艙裡是空氣：水只在船外 */
      c.beginPath(); c.rect(400, YW - 20, 560, 540 - YW + 20);
      c.moveTo(BL, top); c.lineTo(BL + 18, floor); c.lineTo(BR - 18, floor); c.lineTo(BR, top); c.closePath(); c.clip('evenodd');
    }
    U.waterRect(c, 400, YW, 960, 540, { wob: S.ripple * 1.8, phase: S.time * 6 });
    c.restore();
    /* 船（前緣） */
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    hullPath(c, bot); c.strokeStyle = isSunk ? COL.coral : '#e0b878'; c.lineWidth = 7; c.stroke();
    c.restore();
    /* 紅色記號 */
    if (S.mark != null) {
      const my = bot - S.mark * PXM;
      c.save(); c.strokeStyle = 'rgba(255,77,77,0.65)'; c.lineWidth = 3; c.setLineDash([12, 9]);
      c.beginPath(); c.moveTo(wallX(bot, my, true), my); c.lineTo(wallX(bot, my, false), my); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#ff4d4d'; c.lineWidth = 7; c.lineCap = 'butt';
      c.beginPath(); c.moveTo(wallX(bot, my, true) - 16, my); c.lineTo(wallX(bot, my, true) + 14, my);
      c.moveTo(wallX(bot, my, false) - 14, my); c.lineTo(wallX(bot, my, false) + 16, my); c.stroke();
      c.restore();
      /* 右側兩個標籤：水面（黃）與紅線（紅） */
      let py = my;
      if (Math.abs(my - YW) < 46) py = YW + (my <= YW ? -46 : 46);
      if (aligned()) U.pill(c, T('水面＝紅線', 'Water = mark'), 945, YW, COL.green, 22, 'right');
      else { U.pill(c, T('水面', 'Water'), 945, YW, COL.teal, 22, 'right'); U.pill(c, T('紅線', 'Mark'), 945, py, '#ff6b6b', 22, 'right'); }
    } else U.pill(c, T('水面', 'Water'), 945, YW, COL.teal, 22, 'right');
    /* 左上：石頭；右上：吃水與紅線 */
    U.pill(c, T('石頭 ', 'Stones ') + S.n + T(' 籃 ＝ ', ' = ') + S.n * BASKET + ' kgw', 20, 40, COL.yellow, 22, 'left');
    U.pill(c, T('吃水 ', 'Draught ') + mm(dPhys()) + ' mm', 945, 40, COL.white, 22, 'right', true);
    U.pill(c, S.mark == null ? T('紅線：尚未標記', 'Mark: not set') : T('紅線 ', 'Mark ') + mm(S.mark) + ' mm', 945, 84, S.mark == null ? COL.dim : '#ff6b6b', 22, 'right', true);
    /* 狀態 */
    if (isSunk) U.pill(c, T('船沉了！拿出石頭', 'The boat sank! Take stones out'), 620, 130, COL.coral, 24);
    else if (aligned()) U.pill(c, T('水線對齊紅線！', 'Waterline matches the mark!'), 620, 130, COL.green, 24);
    /* 岸上說明 */
    U.pill(c, T('每籃石頭 500 kgw', 'Each basket 500 kgw'), 200, 396, COL.white, 22);
    U.pill(c, T('船底 10 m²　空船 2000 kgw', 'Hull 10 m²  empty 2000 kgw'), 200, 452, COL.dim, 22);
  }

  /* ── 結果框 ── */
  function resultRaw() {
    const d = dPhys(), dmm = mm(d), n = S.n, eleOn = loaded();
    const loadStr = eleOn ? T('大象', 'elephant') : (n ? n + ' × ' + BASKET : '0');
    const eq = `d ＝ (2000 ＋ ${loadStr}) ÷ (1000 × 10) ＝ <b class="lw-c">${d.toFixed(3)} m ＝ ${dmm} mm</b>`;
    const stones = `${T('石頭：', 'Stones: ')}${n} ${T('籃 ＝ ', 'baskets ＝ ')}${n} × ${BASKET} ＝ <b class="lw-y">${n * BASKET} kgw</b>`;
    const markLine = S.mark == null ? T('記號水線：<span class="lw-y">尚未標記</span>', 'Marked waterline: <span class="lw-y">not set yet</span>')
      : `${T('記號水線：', 'Marked waterline: ')}<b class="lw-p">${S.mark.toFixed(3)} m ＝ ${mm(S.mark)} mm</b>`;
    if (sunk()) {
      return `<div><span class="lw-big lw-bad">${T('船沉了！吃水 ≥ 船高 0.64 m', 'The boat sank! Draught ≥ the 0.64 m hull height')}</span></div>` +
        `<div>${eq}</div><div>${stones}</div><div>${T('按「拿出一籃」把石頭拿出來，船才浮得起來。', 'Press “Remove a basket” so the boat can float again.')}</div>`;
    }
    if (aligned()) {
      const df = diff() * 1000;
      return `<div><span class="lw-big lw-ok">${T('對齊了！大象 ＝ 石頭總重 ＝ ', 'Matched! Elephant ＝ total stones ＝ ')}${n} × ${BASKET} ＝ ${n * BASKET} kgw</span></div>` +
        `<div>${eq}；${markLine}</div>` +
        `<div>${T('差距：', 'Gap: ')}<b class="lw-ok">${T('對齊', 'aligned')}（${Math.abs(df) < 0.5 ? '0' : df.toFixed(0)} mm，${T('容許 ±1 mm', 'allowed ±1 mm')}）</b>　${stones}</div>` +
        `<div>${T('① 水線一樣高 → 排開的水一樣重', '① Same waterline → the same weight of water displaced')}</div>` +
        `<div>${T('② 排開的水一樣重 → 浮力一樣大', '② Same displaced water → the same buoyant force')}</div>` +
        `<div>${T('③ 船漂浮：浮力 ＝ 總重，所以大象 ＝ 石頭的總重 ＝ ', '③ A floating boat: buoyancy ＝ total weight, so elephant ＝ stones ＝ ')}<b class="lw-y">${n * BASKET} kgw</b></div>`;
    }
    let head, cls = 'lw-c';
    if (S.t > 0.001 && S.t < 0.999) head = T('大象走動中…', 'The elephant is moving…');
    else if (eleOn && S.mark == null) head = T('步驟 2：按「標記水線」，在船身畫上紅線', 'Step 2: press “Mark waterline” to draw the red line');
    else if (eleOn) head = T('步驟 3：按「大象下船」，船會浮起來', 'Step 3: press “Elephant off”; the boat rises');
    else if (S.mark == null) head = T('步驟 1：按「大象上船」，看船沉下去多少', 'Step 1: press “Elephant on” and see how deep the boat sinks');
    else head = T('步驟 4：放石頭，讓水面回到紅線', 'Step 4: add stones until the water reaches the red line');
    const df = diff();
    let gapLine;
    if (df == null) gapLine = T('差距：—（先標記水線）', 'Gap: — (mark the waterline first)');
    else if (eleOn) gapLine = T('差距：大象在船上，水面剛好在紅線上', 'Gap: the elephant is aboard, water sits on the mark');
    else if (n === 0 && S.t <= 0.001 && Math.abs(df) > TOL) gapLine = `${T('差距：水面', 'Gap: water ')}<b class="lw-bad">${T('低於', 'below')}</b>${T('紅線 ', ' the mark by ')}${Math.abs(df * 1000).toFixed(0)} mm ${T('（還太輕）', '(too light)')}`;
    else if (Math.abs(df) <= TOL + 1e-9) gapLine = `${T('差距：', 'Gap: ')}<b class="lw-ok">${T('對齊', 'aligned')}</b>`;
    else if (df > 0) gapLine = `${T('差距：水面', 'Gap: water ')}<b class="lw-bad">${T('高於', 'above')}</b>${T('紅線 ', ' the mark by ')}${(df * 1000).toFixed(0)} mm ${T('（太重，拿出一籃）', '(too heavy: remove a basket)')}`;
    else gapLine = `${T('差距：水面', 'Gap: water ')}<b class="lw-bad">${T('低於', 'below')}</b>${T('紅線 ', ' the mark by ')}${(-df * 1000).toFixed(0)} mm ${T('（還太輕，再放一籃）', '(too light: add a basket)')}`;
    return `<div><span class="lw-big ${cls}">${head}</span></div>` +
      `<div>${T('現在吃水 ', 'Draught now: ')}${eq}</div>` +
      `<div>${markLine}</div><div>${gapLine}</div><div>${stones}</div>`;
  }

  const result = () => fw(resultRaw());
  M4Lab.make({
    key: 'cao', tab: 'tab3',
    titleZh: '動手做｜曹沖稱象', titleEn: 'Try it | Weighing the Elephant',
    subZh: '大象太重，秤不了。讓大象上船、在水線畫記號，再用石頭換下大象，看看怎麼知道大象有多重。', subEn: 'The elephant is too heavy for any scale. Mark the waterline with the elephant aboard, then swap it for stones to find its weight.',
    tipZh: '先預測：要放幾籃石頭，水線才會回到紅線？石頭太多船會沉；大象在船上時不能加石頭。', tipEn: 'Predict first: how many baskets bring the water back to the red line? Too many stones sink the boat; no stones while the elephant is aboard.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'on', zh: '🐘 大象上船', en: '🐘 Elephant on', on: board, disabled: () => S.want || S.n > 0 || S.t > 0.001 },
        { id: 'off', zh: '大象下船', en: 'Elephant off', on: leave, disabled: () => !S.want },
        { id: 'mark', zh: '🔴 標記水線', en: '🔴 Mark waterline', on: markIt, disabled: () => !loaded() }
      ] },
      { kind: 'buttons', items: [
        { id: 'add', zh: '🪨 放一籃石頭', en: '🪨 Add a basket', on: addStone, disabled: () => !settled() || S.n >= NMAX },
        { id: 'rem', zh: '拿出一籃', en: 'Remove a basket', on: removeStone, disabled: () => !settled() || S.n <= 0 },
        { id: 'new', zh: '🔀 換一隻大象', en: '🔀 New elephant', on: newEle, disabled: () => !settled() },
        { id: 'reset', zh: '↺ 重來', en: '↺ Restart', on: reset }
      ] }
    ],
    step, draw, result,
    snapshot: s => ({
      E: s.E, n: s.n, want: s.want, t: +s.t.toFixed(3), loaded: loaded(), d: +dPhys().toFixed(4), dmm: mm(dPhys()), mark: s.mark == null ? null : +s.mark.toFixed(4),
      diffMm: diff() == null ? null : +(diff() * 1000).toFixed(2), aligned: aligned(), sunk: sunk(), dispD: +s.dd.toFixed(4)
    })
  });
  window.W5Lab.cao.set = function (o) {
    if (o.E != null) S.E = o.E;
    if (o.n != null) S.n = o.n;
    if (o.mark !== undefined) S.mark = o.mark;
    if (o.t != null) { S.t = o.t; S.want = o.t >= 0.5; }
    window.W5Lab.cao.request();
  };
})();
