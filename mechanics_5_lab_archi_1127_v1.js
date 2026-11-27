/* mechanics_5_lab_archi_1127_v1.js — 「動手做｜阿基米德溢水台」（#archiLabCanvas，960×540，掛在 #tab3）
 * 契約：window.W5Lab.archi = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理（密度單位 gw/cm³，1 cm³ 清水重 1 gw）：
 *   物體（方塊）：①鐵塊 150 gw／30 cm³　②同重大塊 150 gw／60 cm³　③木塊 30 gw／50 cm³。
 *   液體：清水 D＝1.0、濃鹽水 D＝1.2、食用油 D＝0.8。
 *   浸入體積 V浸 ＝ 深度% × V；木塊在 B ＝ W 時漂浮：V排 ＝ min(V浸, W ÷ D)，彈簧秤讀數 0、繩鬆。
 *   浮力 B ＝ V排 × D液；彈簧秤讀數 ＝ max(0, W − B)；溢出的液重 ＝ V排 × D液 ＝ B（接水杯收到）。
 * 溢水杯一開始裝滿到出水口：V排 變大才會溢出；若把物體再提高，杯裡液面會低於出水口，
 *   先前溢出的液體留在接水杯（累計溢出體積 ＝ 曾經最大的 V排）；「重來」＝拉出物體並把液體倒回。
 * 會動的東西：指針彈簧阻尼、液面波動、溢出的水流與接水杯／磅秤數字慢慢上升、木塊漂浮時上下晃。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const OBJ = {
    fe: { zh: '鐵塊', en: 'Iron block', W: 150, V: 30, c0: '#a9b4bf', c1: '#6f7b87', tag: ['鐵', 'Fe'] },
    big: { zh: '同重大塊', en: 'Big block', W: 150, V: 60, c0: '#b7bfc7', c1: '#7c8791', tag: ['大塊', 'Big'] },
    wood: { zh: '木塊', en: 'Wooden block', W: 30, V: 50, c0: '#d3a468', c1: '#a8763d', tag: ['木', 'Wood'] }
  };
  const LQ = {
    w: { zh: '清水', en: 'Water', D: 1.0, c0: 'rgba(47,143,216,0.55)', c1: 'rgba(26,96,168,0.72)', edge: '#7cc9ff' },
    b: { zh: '濃鹽水', en: 'Brine', D: 1.2, c0: 'rgba(80,200,190,0.55)', c1: 'rgba(30,140,140,0.75)', edge: '#9ff0e2' },
    o: { zh: '食用油', en: 'Cooking oil', D: 0.8, c0: 'rgba(236,184,80,0.55)', c1: 'rgba(196,132,40,0.72)', edge: '#ffd98a' }
  };
  const PXCM = 24, A_CAN = 54, A_CUP = 30;
  const BRIM = 360, CX0 = 150, CX1 = 350, GY = 505, SX = 250, SY0 = 50, SK = 0.6;
  const S = { obj: 'fe', liq: 'w', f: 0, maxV: 0, recvD: 0, lvlD: 0, faD: 0, faPrev: 0, readD: 150, readV: 0, wob: 0, bobA: 0, wasFloat: false, time: 0 };

  function model() {
    const o = OBJ[S.obj], D = LQ[S.liq].D, Vcmd = S.f * o.V, Vfl = o.W / D < o.V ? o.W / D : Infinity;
    const floating = Vcmd >= Vfl - 1e-9 && Vcmd > 0;
    const Vsub = floating ? Vfl : Vcmd, B = Vsub * D;
    return { o, D, Vsub, B, floating, read: floating ? 0 : Math.max(0, o.W - B), Vfl };
  }
  const r1 = v => (Math.round(v * 10) / 10);
  const f1 = v => { const x = r1(v); return Number.isInteger(x) ? String(x) : x.toFixed(1); };

  function clear() { S.f = 0; S.maxV = 0; S.recvD = 0; S.lvlD = 0; S.faD = 0; S.faPrev = 0; S.readD = OBJ[S.obj].W; S.readV = 0; S.wob = 0; S.bobA = 0; S.wasFloat = false; }
  function pickObj(k) { S.obj = k; clear(); }
  function pickLiq(k) { S.liq = k; clear(); }

  function step(_, dt) {
    S.time += dt;
    const m = model(), V = m.o.V;
    if (m.Vsub > S.maxV) S.maxV = m.Vsub;
    const faT = m.Vsub / V;
    S.faD += (faT - S.faD) * Math.min(1, dt * 14); if (Math.abs(faT - S.faD) < 1e-4) S.faD = faT;
    S.wob = S.wob * Math.exp(-3 * dt) + Math.abs(faT - S.faPrev) * 40; S.faPrev = faT; S.wob = Math.min(3.2, S.wob); if (S.wob < 0.02) S.wob = 0;
    if (m.floating && !S.wasFloat) S.bobA = 7; S.wasFloat = m.floating;
    S.bobA *= Math.exp(-1.8 * dt); if (S.bobA < 0.15) S.bobA = 0;
    /* 彈簧秤指針：彈簧阻尼 */
    const sub = 3, d = dt / sub;
    for (let i = 0; i < sub; i++) { S.readV += (-196 * (S.readD - m.read) - 2 * 0.45 * 14 * S.readV) * d; S.readD += S.readV * d; }
    const readSettled = Math.abs(S.readD - m.read) < 0.05 && Math.abs(S.readV) < 0.3; if (readSettled) { S.readD = m.read; S.readV = 0; }
    /* 接水杯：溢出的液體慢慢流進去 */
    const rt = S.maxV * m.D, dr = rt - S.recvD;
    if (Math.abs(dr) > 0.02) S.recvD += Math.sign(dr) * Math.min(Math.abs(dr), Math.max(18, Math.abs(dr) * 2.2) * dt); else S.recvD = rt;
    /* 溢水杯液面：提高物體後會低於出水口 */
    const lt = Math.max(0, S.maxV - m.Vsub) / A_CAN, dl = lt - S.lvlD;
    S.lvlD += dl * Math.min(1, dt * 8); if (Math.abs(lt - S.lvlD) < 1e-3) S.lvlD = lt;
    return !readSettled || Math.abs(dr) > 0.02 || S.faD !== faT || S.wob > 0 || S.bobA > 0 || S.lvlD !== lt || S.time < 0.3;
  }

  function liquidFill(c, L, x0, y0, x1, y1, wob, ph) {
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, L.c0); g.addColorStop(1, L.c1);
    c.fillStyle = g; c.beginPath();
    for (let x = x0; x <= x1; x += 6) { const y = y0 + wob * Math.sin((x - x0) * 0.09 + ph); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath(); c.fill();
    c.strokeStyle = L.edge; c.lineWidth = 3; c.beginPath();
    for (let x = x0; x <= x1; x += 6) { const y = y0 + wob * Math.sin((x - x0) * 0.09 + ph); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  }

  function card(c, y, title, val, col) {
    U.rr(c, 620, y, 320, 80, 10); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill(); c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
    U.label(c, title, 634, y + 24, COL.white, 22, 'left');
    U.label(c, val, 634, y + 58, col, 24, 'left', true);
  }

  function draw(c) {
    const m = model(), o = m.o, L = LQ[S.liq], side = PXCM * Math.cbrt(o.V), lvlY = BRIM + S.lvlD * PXCM;
    const bob = Math.sin(S.time * 6) * S.bobA;
    const bottom = lvlY + S.faD * side + bob, top = bottom - side;

    /* 地面、立柱與橫臂 */
    c.fillStyle = 'rgba(246,243,234,0.10)'; c.fillRect(0, GY, 960, 40);
    c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
    c.fillStyle = '#6b7882'; c.fillRect(34, 14, 12, GY - 14); c.fillStyle = '#8a95a0'; c.fillRect(14, GY - 10, 52, 10);

    /* 降下彈簧秤：繩長固定，橫臂、彈簧秤、吊環一起沿立柱往下移，物體才會跟著放進液體 */
    const dy = Math.max(0, top - (BRIM - side)), ringY = 260 + dy;
    c.save(); c.translate(0, dy);
    c.fillStyle = '#6b7882'; c.fillRect(34, 14, SX + 6, 14);
    c.fillStyle = '#4a565e'; c.fillRect(28, 10, 24, 22); c.strokeStyle = '#2a3a42'; c.lineWidth = 2; c.strokeRect(28, 10, 24, 22);

    /* 彈簧秤 */
    U.rr(c, 220, 28, 60, 214, 10); c.fillStyle = '#cfd6dc'; c.fill(); c.strokeStyle = '#6b7882'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#10211b'; c.fillRect(241, 44, 18, 192);
    for (let v = 0; v <= 300; v += 50) {
      const y = SY0 + v * SK, major = v % 100 === 0;
      c.strokeStyle = '#3b4a52'; c.lineWidth = major ? 3 : 2; c.beginPath(); c.moveTo(major ? 226 : 232, y); c.lineTo(241, y); c.stroke();
      if (major) U.label(c, String(v), 212, y, COL.white, 22, 'right', true);
    }
    const py = SY0 + Math.max(0, Math.min(300, S.readD)) * SK;
    c.fillStyle = COL.coral; c.fillRect(238, py - 2.5, 24, 5);
    c.beginPath(); c.moveTo(266, py); c.lineTo(282, py - 8); c.lineTo(282, py + 8); c.closePath(); c.fill();
    c.strokeStyle = '#c0c8d0'; c.lineWidth = 4; c.beginPath(); c.arc(SX, 252, 8, 0, 6.2832); c.stroke();
    c.restore();

    /* 溢水杯（液體、物體、玻璃） */
    liquidFill(c, L, CX0 + 3, lvlY, CX1 - 3, GY - 2, 1.6 + S.wob, S.time * 3);
    /* 繩子 */
    c.strokeStyle = '#e8d9b0'; c.lineWidth = 3; c.beginPath(); c.moveTo(SX, ringY);
    if (m.floating) c.bezierCurveTo(SX + 40, ringY + (top - ringY) * 0.35, SX - 40, ringY + (top - ringY) * 0.7, SX, top); else c.lineTo(SX, top);
    c.stroke();
    /* 物體 */
    const bx = SX - side / 2;
    const bg = c.createLinearGradient(bx, top, bx + side, bottom); bg.addColorStop(0, o.c0); bg.addColorStop(1, o.c1);
    U.rr(c, bx, top, side, side, 6); c.fillStyle = bg; c.fill(); c.strokeStyle = '#2a3a42'; c.lineWidth = 3; c.stroke();
    if (S.obj === 'wood') { c.strokeStyle = 'rgba(90,55,20,0.35)'; c.lineWidth = 2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(bx + 6, top + side * k / 4); c.lineTo(bx + side - 6, top + side * k / 4 + 4); c.stroke(); } }
    /* 浸在液體中的部分蓋上一層液色 */
    if (bottom > lvlY) {
      c.save(); c.beginPath(); c.rect(bx - 2, lvlY, side + 4, bottom - lvlY + 2); c.clip();
      c.fillStyle = L.c0; U.rr(c, bx, top, side, side, 6); c.fill(); c.restore();
      c.strokeStyle = L.edge; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 8, lvlY); c.lineTo(bx + side + 8, lvlY); c.stroke();
    }
    U.label(c, T(o.tag[0], o.tag[1]) + ' ' + o.W, SX, top + side * 0.3, COL.white, 22, 'center', true);
    /* 玻璃杯壁與出水口 */
    c.save(); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(CX0, BRIM - 14); c.lineTo(CX0, GY); c.lineTo(CX1, GY); c.lineTo(CX1, BRIM - 14); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(CX1, BRIM - 2); c.lineTo(420, BRIM + 16); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(CX1, BRIM + 14); c.lineTo(414, BRIM + 30); c.stroke();
    c.restore();
    if (S.lvlD > 0.02) { c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2; c.setLineDash([6, 7]); c.beginPath(); c.moveTo(CX0 + 4, BRIM); c.lineTo(CX1 - 4, BRIM); c.stroke(); c.restore(); }
    U.label(c, T('出水口', 'Spout'), 440, BRIM - 4, COL.dim, 22, 'left');

    /* 接水杯與磅秤 */
    U.rr(c, 372, 480, 228, 40, 8); c.fillStyle = '#3b4a52'; c.fill(); c.strokeStyle = '#8a95a0'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#8a95a0'; c.fillRect(380, 474, 100, 8);
    const cupTop = 395, cupBot = 474, cvol = S.recvD / m.D, ch = Math.min(70, cvol / A_CUP * PXCM), liqY = cupBot - ch;
    if (ch > 0.5) { c.save(); c.beginPath(); c.moveTo(385, cupTop); c.lineTo(392, cupBot); c.lineTo(458, cupBot); c.lineTo(465, cupTop); c.closePath(); c.clip(); liquidFill(c, L, 380, liqY, 470, cupBot, 1.2, S.time * 4); c.restore(); }
    c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); c.moveTo(385, cupTop); c.lineTo(392, cupBot); c.lineTo(458, cupBot); c.lineTo(465, cupTop); c.stroke();
    if (Math.abs(S.maxV * m.D - S.recvD) > 0.02 && S.recvD <= S.maxV * m.D) {
      c.save(); c.strokeStyle = L.edge; c.lineWidth = 5; c.lineCap = 'round'; c.setLineDash([9, 8]); c.lineDashOffset = -S.time * 90;
      c.beginPath(); c.moveTo(418, BRIM + 22); c.lineTo(418, Math.min(cupBot - ch, 470)); c.stroke(); c.restore();
    }
    c.fillStyle = '#cfe8d8'; U.rr(c, 486, 484, 106, 32, 5); c.fill();
    c.save(); c.font = '700 22px "JetBrains Mono","Noto Sans TC",monospace'; c.fillStyle = '#0f2a1f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(r1(S.recvD).toFixed(1) + ' gw', 539, 501); c.restore();
    U.pill(c, T('接到液重', 'Caught'), 478, 450, COL.yellow, 22, 'left');

    /* 上方資訊 */
    U.pill(c, T('物體：' + o.zh + '　W ＝ ' + o.W + ' gw　V ＝ ' + o.V + ' cm³', 'Object: ' + o.en + '  W = ' + o.W + ' gw  V = ' + o.V + ' cm³'), 300, 52, COL.white, 22, 'left');
    U.pill(c, T('液體：' + L.zh + '　D ＝ ' + L.D.toFixed(1) + ' gw/cm³', 'Liquid: ' + L.en + '  D = ' + L.D.toFixed(1) + ' gw/cm³'), 300, 102, COL.white, 22, 'left');
    U.pill(c, T('彈簧秤讀數 ＝ ', 'Scale reads ') + r1(S.readD).toFixed(1) + ' gw', 300, 152, COL.teal, 22, 'left', true);
    if (m.floating) U.pill(c, T('漂浮！B ＝ W，繩子鬆了', 'Floating! B = W, string slack'), 312, 252, COL.green, 22, 'left');

    /* 右側算式卡 */
    card(c, 205, T('彈簧秤讀數 ＝ W − B', 'Reading = W − B'), o.W + ' − ' + f1(m.B) + ' = ' + f1(m.read) + ' gw', COL.teal);
    card(c, 295, T('浮力 B ＝ V排 × D液', 'B = V displaced × D'), f1(m.Vsub) + ' × ' + L.D.toFixed(1) + ' = ' + f1(m.B) + ' gw', COL.coral);
    card(c, 385, T('溢出的液重（接水杯）', 'Overflowed liquid (cup)'), '＝ ' + f1(S.maxV * m.D) + ' gw', COL.yellow);
  }

  function result() {
    const m = model(), o = m.o, L = LQ[S.liq], B = m.B, Vs = m.Vsub, lost = o.W - m.read, rec = S.maxV * m.D;
    let head;
    if (S.f <= 0.0001) head = `<span class="lw-big lw-c">${T('物體還在空氣中：讀數 ＝ W ＝ ' + o.W + ' gw', 'Still in the air: reading = W = ' + o.W + ' gw')}</span>`;
    else if (m.floating) head = `<span class="lw-big lw-ok">${T('漂浮了：浮力 B ＝ 重量 W，彈簧秤讀數 0，繩子鬆了', 'Floating: B = W, the scale reads 0 and the string goes slack')}</span>`;
    else head = `<span class="lw-big lw-c">${T('放進液體：彈簧秤讀數變小了，水溢出來了', 'In the liquid: the reading drops and liquid spills over')}</span>`;
    const same = Math.abs(rec - B) < 0.05;
    const cmp = `${T('少掉的讀數 ', 'lost reading ')}<b class="lw-y">${f1(lost)} gw</b> ＝ ${T('浮力 ', 'buoyancy ')}<b class="lw-p">${f1(B)} gw</b> ＝ ${T('溢出液重 ', 'overflow ')}<b class="lw-c">${f1(rec)} gw</b>`;
    const lines = [
      `<div>${head}</div>`,
      `<div>${T('空氣中 W ＝ ', 'W in air = ')}<b class="lw-y">${o.W} gw</b>${T('；現在讀數 ＝ ', '; reading now = ')}<b class="lw-c">${f1(m.read)} gw</b>${T('；少了 ', '; lost ')}${o.W} − ${f1(m.read)} ＝ <b class="lw-y">${f1(lost)} gw</b></div>`,
      `<div>${T('浮力 B ＝ V排 × D液 ＝ ', 'Buoyancy B = V displaced × D = ')}${f1(Vs)} × ${L.D.toFixed(1)} ＝ <b class="lw-p">${f1(B)} gw</b>${m.floating ? T('（漂浮：V排 ＝ W ÷ D ＝ ' + f1(Vs) + ' cm³）', ' (floating: V displaced = W ÷ D = ' + f1(Vs) + ' cm³)') : T('（V排 ＝ 浸入的體積 ＝ ' + f1(Vs) + ' cm³）', ' (V displaced = immersed volume = ' + f1(Vs) + ' cm³)')}</div>`,
      `<div>${T('接到的液重 ＝ ', 'Liquid caught = ')}<b class="lw-c">${f1(rec)} gw</b></div>`
    ];
    if (S.f <= 0.0001 && S.maxV === 0) lines.push(`<div>${T('等號比較：把物體慢慢放下去，看「少掉的讀數」、「浮力」、「溢出液重」是不是一樣大。', 'Compare: lower the object slowly and see whether the lost reading, the buoyancy and the overflow weight match.')}</div>`);
    else if (same) lines.push(`<div>${T('等號比較：', 'Compare: ')}${cmp}　<b class="lw-ok">${T('三者相等！', 'all equal!')}</b></div>`);
    else lines.push(`<div>${T('杯裡液面低於出水口（物體提高了），接水杯裡是先前溢出的 ' + f1(rec) + ' gw；少掉的讀數 ' + f1(lost) + ' gw ＝ 浮力 ' + f1(B) + ' gw。想重做就按「重來」。', 'The level fell below the spout (the object was raised); the cup still holds the earlier ' + f1(rec) + ' gw. The lost reading ' + f1(lost) + ' gw = buoyancy ' + f1(B) + ' gw. Press “Restart” to redo.')}</div>`);
    return lines.join('');
  }

  M4Lab.make({
    key: 'archi', tab: 'tab3',
    titleZh: '動手做｜阿基米德溢水台', titleEn: 'Try it | Archimedes\' Overflow Bench',
    subZh: '彈簧秤吊著物體，慢慢放進裝滿液體的溢水杯。先預測：讀數少了多少？溢出來的液體有多重？', subEn: 'Lower an object hanging from a spring scale into a brim-full overflow can. Predict: how much does the reading drop, and how heavy is the overflow?',
    tipZh: '換物體或換液體會把液體倒回、物體拉出；木塊會漂起來，漂浮時彈簧秤讀數是 0。', tipEn: 'Changing the object or liquid pours the liquid back and lifts the object out; the wooden block floats, and a floating block reads 0.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'fe', zh: '🔩 鐵塊 150 gw／30 cm³', en: '🔩 Iron 150 gw / 30 cm³', on: () => pickObj('fe'), active: () => S.obj === 'fe' },
        { id: 'big', zh: '🔩 同重大塊 150 gw／60 cm³', en: '🔩 Big 150 gw / 60 cm³', on: () => pickObj('big'), active: () => S.obj === 'big' },
        { id: 'wood', zh: '🪵 木塊 30 gw／50 cm³', en: '🪵 Wood 30 gw / 50 cm³', on: () => pickObj('wood'), active: () => S.obj === 'wood' }
      ] },
      { kind: 'buttons', items: [
        { id: 'w', zh: '💧 清水 D＝1.0', en: '💧 Water D=1.0', on: () => pickLiq('w'), active: () => S.liq === 'w' },
        { id: 'b', zh: '🧂 濃鹽水 D＝1.2', en: '🧂 Brine D=1.2', on: () => pickLiq('b'), active: () => S.liq === 'b' },
        { id: 'o', zh: '🫗 食用油 D＝0.8', en: '🫗 Oil D=0.8', on: () => pickLiq('o'), active: () => S.liq === 'o' }
      ] },
      { kind: 'slider', id: 'depth', zh: '放入深度', en: 'Depth lowered', min: 0, max: 100, step: 1, get: () => Math.round(S.f * 100), set: v => { S.f = v / 100; }, fmt: v => v + '%' },
      { kind: 'buttons', items: [ { id: 'reset', zh: '↺ 重來（拉出並倒回）', en: '↺ Restart (lift out, pour back)', on: () => clear() } ] }
    ],
    step, draw, result,
    snapshot: s => { const m = model(); return { obj: s.obj, liq: s.liq, f: +s.f.toFixed(3), W: m.o.W, V: m.o.V, Vsub: +m.Vsub.toFixed(2), B: +m.B.toFixed(2), read: +m.read.toFixed(2), readD: +s.readD.toFixed(2), recv: +(s.maxV * m.D).toFixed(2), recvD: +s.recvD.toFixed(2), floating: m.floating, lvl: +s.lvlD.toFixed(3) }; }
  });
  window.W5Lab.archi.set = function (o) { if (o.obj) pickObj(o.obj); if (o.liq) pickLiq(o.liq); if (o.f != null) S.f = o.f; window.W5Lab.archi.request(); };
})();
