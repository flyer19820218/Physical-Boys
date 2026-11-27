/* organics_1_lab_model_1127_v1.js ｜ 動手做：3D 分子模型台（tab4）
 * 同樣 9 顆原子（2 碳、6 氫、1 氧）：按「乙醇」「甲醚」讓原子飛到新位置、化學鍵重新接；拖曳畫面可轉動分子；右邊性質卡。
 * 座標與接法沿用舊版 organics_1 的分子模型台（ISO_POS／ISO_BONDS 一字不改），只改畫法與版面（960×540）。
 * 契約：window.W5Lab.model = { activate, deactivate, relang, _state }；_state 含 mode、done、yaw、pitch。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined') return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U;
  const EL = ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H'];
  const POS = {
    eth: [[-1.168, -0.4, 0], [0.207, 0.249, 0], [1.199, -0.769, 0], [-1.925, 0.382, 0], [-1.293, -1.023, 0.885], [-1.293, -1.023, -0.885], [0.334, 0.883, 0.884], [0.334, 0.883, -0.884], [2.064, -0.345, 0]],
    dme: [[-1.17, -0.2, 0], [1.17, -0.2, 0], [0, 0.59, 0], [-2.03, 0.47, 0], [-1.2, -0.84, 0.89], [-1.2, -0.84, -0.89], [1.2, -0.84, 0.89], [1.2, -0.84, -0.89], [2.03, 0.47, 0]],
    apart: [[-2.35, -1.25, 0], [-1.5, -1.25, 0], [-0.65, -1.25, 0], [0.12, -1.3, 0], [0.62, -1.3, 0], [1.12, -1.3, 0], [1.62, -1.3, 0], [2.12, -1.3, 0], [2.62, -1.3, 0]]
  };
  const BONDS = {
    eth: [[0, 1], [1, 2], [2, 8], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7]],
    dme: [[0, 2], [2, 1], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [1, 8]],
    apart: []
  };
  /* 化學鍵黃色提示：乙醇 C−O−H 的兩條鍵、甲醚 C−O−C 的兩條鍵 */
  const HILITE = { eth: [[1, 2], [2, 8]], dme: [[0, 2], [2, 1]] };
  const V = { CX: 305, CY: 262, S: 100, DUR: 1.4 };
  const RAD = { C: 0.36, O: 0.34, H: 0.23 };

  function init() { return { mode: 'apart', from: 'apart', p: 1, cur: null, yaw: 0.5, pitch: 0.25, drag: null, idle: 0, tt: 0 }; }

  function nowPos(S) {
    const B = POS[S.mode];
    if (S.p >= 1 || !S.cur) return B.map(a => a.slice());
    const e = U.ease(S.p);
    return S.cur.map((a, i) => { const b = B[i], lift = Math.sin(Math.PI * e) * (i > 2 ? 0.9 : 0.5); return [U.lerp(a[0], b[0], e), U.lerp(a[1], b[1], e) + lift, U.lerp(a[2], b[2], e)]; });
  }
  function build(S, m) {
    if (S.p < 1 || S.mode === m) return;
    S.cur = nowPos(S); S.from = S.mode; S.mode = m; S.p = 0;
  }
  function proj(S, p) {
    const cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    const x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
    const y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
    const f = 7 / (7 - z2);
    return { x: V.CX + x1 * V.S * f, y: V.CY - y2 * V.S * f, z: z2, f };
  }

  function step(S, dt) {
    S.tt += dt;
    if (S.p < 1) { S.p = Math.min(1, S.p + dt / V.DUR); if (S.p >= 1) S.cur = null; }
    S.idle += dt;
    if (S.mode === 'apart' && S.p >= 1) { if (!S.drag) { const ty = Math.round(S.yaw / (2 * Math.PI)) * 2 * Math.PI; S.yaw += (ty - S.yaw) * Math.min(1, dt * 4); S.pitch += (0 - S.pitch) * Math.min(1, dt * 4); } }
    else if (!S.drag && S.idle > 2.5) S.yaw += dt * 0.35;
    return true;
  }

  function pointer(S, type, x, y, e) {
    if (type === 'down') { if (x > 590) return false; S.drag = { x, y, yaw: S.yaw, pitch: S.pitch }; S.idle = 0; return true; }
    if (type === 'move') {
      if (!S.drag) return false;
      S.yaw = S.drag.yaw + (x - S.drag.x) * 0.0075; S.pitch = U.clamp(S.drag.pitch + (y - S.drag.y) * 0.0075, -1.25, 1.25); S.idle = 0; return true;
    }
    S.drag = null; return false;
  }

  function draw(c, S) {
    const P = nowPos(S).map(p => proj(S, p));
    const done = S.p >= 1;
    const bonds = done ? BONDS[S.mode] : (S.p < 0.35 ? BONDS[S.from] : S.p > 0.7 ? BONDS[S.mode] : []);
    const ba = done ? 1 : S.p < 0.35 ? 1 - S.p / 0.35 : S.p > 0.7 ? (S.p - 0.7) / 0.3 : 0;
    const hl = done && HILITE[S.mode] ? HILITE[S.mode] : [];
    const isHl = (a, b) => hl.some(h => (h[0] === a && h[1] === b) || (h[0] === b && h[1] === a));
    /* 地面的淡影 */
    c.save(); c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(V.CX, 470, 210, 22, 0, 0, Math.PI * 2); c.fill(); c.restore();

    const items = [];
    bonds.forEach(([a, b]) => items.push({ z: Math.min(P[a].z, P[b].z) - 0.01, draw: () => {
      const f = (P[a].f + P[b].f) / 2, y = isHl(a, b);
      c.save(); c.globalAlpha = ba; c.lineCap = 'round';
      c.strokeStyle = y ? '#ffe066' : '#b8c2c4'; c.lineWidth = 11 * f;
      c.beginPath(); c.moveTo(P[a].x, P[a].y); c.lineTo(P[b].x, P[b].y); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(P[a].x, P[a].y - 2); c.lineTo(P[b].x, P[b].y - 2); c.stroke();
      c.restore();
    } }));
    /* 字只標在看得到的原子上 */
    const lab = new Set(), spots = [];
    P.map((p, i) => i).sort((a, b) => P[b].z - P[a].z).forEach(i => {
      const p = P[i], r = RAD[EL[i]] * V.S * p.f;
      const hidden = P.some((q, j) => j !== i && q.z > p.z && Math.hypot(q.x - p.x, q.y - p.y) < RAD[EL[j]] * V.S * q.f * 0.95);
      if (!hidden && spots.every(s => Math.hypot(s.x - p.x, s.y - p.y) > Math.max(s.r, r) * 1.05)) { lab.add(i); spots.push({ x: p.x, y: p.y, r }); }
    });
    P.forEach((p, i) => items.push({ z: p.z, draw: () => {
      const el = EL[i], r = RAD[el] * V.S * p.f;
      O1.atom(c, p.x, p.y, el, r, { label: false });
      if (lab.has(i)) { c.save(); c.font = W5.font(Math.max(16, Math.round(r * 0.95)), true); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = O1.EL[el].txt; c.fillText(el, p.x, p.y + 1); c.restore(); }
    } }));
    items.sort((a, b) => a.z - b.z).forEach(it => it.draw());

    /* 左下：原子數 */
    c.save(); c.fillStyle = 'rgba(13,32,26,0.88)'; U.rr(c, 36, 478, 540, 48, 12); c.fill(); c.restore();
    [['C', 2, '#a9bbc6'], ['H', 6, '#f6f3ea'], ['O', 1, '#ff8a70']].forEach(([el, n, col], i) => U.label(c, el + ' × ' + n, 126 + i * 168, 502, col, 24, 'center', true));
    U.label(c, T('（拖曳可轉動）', '(drag to turn)'), 305, 52, COL.dim, 22, 'center');

    /* 右：性質卡 */
    const m = done ? S.mode : null, X = 604, Wd = 330;
    c.save(); c.fillStyle = 'rgba(13,32,26,0.92)'; U.rr(c, X, 36, Wd, 490, 14); c.fill(); c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; c.stroke(); c.restore();
    const name = m === 'eth' ? T('乙醇（酒精）', 'Ethanol') : m === 'dme' ? T('甲醚', 'Dimethyl ether') : m === 'apart' ? T('還沒接起來', 'Not joined yet') : T('重新接……', 'Rejoining…');
    U.label(c, name, X + Wd / 2, 76, COL.yellow, 26, 'center');
    O1.fx(c, m === 'eth' ? 'CH3CH2OH' : m === 'dme' ? 'CH3OCH3' : '—', X + Wd / 2, 122, COL.white, 26, 'center');
    U.label(c, T('分子式', 'Formula'), X + 24, 178, COL.dim, 22, 'left');
    O1.fx(c, 'C2H6O', X + Wd - 24, 178, '#4ade80', 24, 'right');
    const rows = [
      [T('常溫狀態', 'At 25 °C'), m === 'eth' ? T('液體', 'Liquid') : m === 'dme' ? T('氣體', 'Gas') : '—'],
      [T('沸點', 'Boiling pt.'), m === 'eth' ? '78 °C' : m === 'dme' ? '−24 °C' : '—'],
      [T('丟入鈉', 'Add sodium'), m === 'eth' ? T('反應、冒氣泡', 'Fizzes') : m === 'dme' ? T('不反應', 'No reaction') : '—']
    ];
    rows.forEach(([a, b], i) => {
      const y = 246 + i * 58;
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X + 18, y - 30); c.lineTo(X + Wd - 18, y - 30); c.stroke(); c.restore();
      U.label(c, a, X + 24, y, COL.dim, 22, 'left');
      U.label(c, b, X + Wd - 24, y, COL.white, 22, 'right');
    });
    /* 小圖：燒杯裡的液體／氣球裡的氣體 */
    const iy = 482, cx = X + Wd / 2;
    c.save();
    if (m === 'eth') {
      c.fillStyle = 'rgba(190,230,245,0.12)'; c.fillRect(cx - 40, iy - 86, 80, 90);
      c.fillStyle = 'rgba(160,210,255,0.38)'; c.fillRect(cx - 38, iy - 46, 76, 48);
      c.strokeStyle = 'rgba(220,240,255,0.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 40, iy - 86); c.lineTo(cx - 40, iy + 4); c.lineTo(cx + 40, iy + 4); c.lineTo(cx + 40, iy - 86); c.stroke();
    } else if (m === 'dme') {
      const bob = Math.sin(S.tt * 2) * 4;
      c.fillStyle = 'rgba(200,230,255,0.28)'; c.beginPath(); c.ellipse(cx, iy - 44 + bob, 40, 48, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(220,240,255,0.85)'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(cx, iy + 4 + bob); c.lineTo(cx, iy + 18); c.stroke();
    }
    c.restore();
  }

  function result(S) {
    const done = S.p >= 1;
    if (!done) return T('原子正在移動、重新接上化學鍵……', 'The atoms are moving and re-bonding…');
    if (S.mode === 'eth') return T('<div><span class="lw-big lw-y">乙醇</span>：氧接在碳和氫的中間（C−O−H）。數一數：每個碳接 <b>4</b> 條鍵、氧接 <b>2</b> 條、氫接 <b>1</b> 條。</div>',
      '<div><span class="lw-big lw-y">Ethanol</span>: the oxygen sits between a carbon and a hydrogen (C−O−H). Count: each carbon forms <b>4</b> bonds, oxygen <b>2</b>, hydrogen <b>1</b>.</div>');
    if (S.mode === 'dme') return T('<div><span class="lw-big lw-y">甲醚</span>：氧夾在兩個碳中間（C−O−C）。原子一顆沒多、一顆沒少，只是<b>接法不同</b>——這就是<b>同分異構物</b>。</div>',
      '<div><span class="lw-big lw-y">Dimethyl ether</span>: the oxygen sits between two carbons (C−O−C). Not one atom more or less, only a <b>different connection</b> — these are <b>isomers</b>.</div>');
    return T('<div>2 顆碳、6 顆氫、1 顆氧，一共 <b>9 顆原子</b>。按下面的按鈕把它們接起來。</div>', '<div>2 carbons, 6 hydrogens and 1 oxygen — <b>9 atoms</b> in all. Use the buttons below to join them up.</div>');
  }

  M4Lab.make({
    key: 'model', tab: 'tab4',
    titleZh: '🧩 分子模型台：同樣 9 顆原子，接成兩種分子', titleEn: '🧩 Molecule Bench: Nine Atoms, Two Molecules',
    subZh: '桌上有 2 顆碳、6 顆氫、1 顆氧。按「乙醇」或「甲醚」看原子怎麼接；用手指拖曳可以轉動分子，從不同角度看。',
    subEn: 'On the bench: 2 carbons, 6 hydrogens and 1 oxygen. Press “Ethanol” or “Dimethyl ether” to see how they join; drag to turn the molecule and look from any side.',
    tipZh: '黃色的鍵是氧的兩條鍵：乙醇的氧接在碳和氫之間，甲醚的氧夾在兩個碳之間。', tipEn: 'The yellow bonds are oxygen’s two bonds: in ethanol it joins a carbon and a hydrogen; in dimethyl ether it joins two carbons.'.replace('’', "'"),
    touchNone: true,
    init, step, draw, result, pointer,
    controls: S => [{ kind: 'buttons', items: [
      { id: 'eth', zh: '乙醇（C−O−H）', en: 'Ethanol (C−O−H)', on: () => build(S, 'eth'), active: () => S.mode === 'eth', disabled: () => S.p < 1 },
      { id: 'dme', zh: '甲醚（C−O−C）', en: 'Dimethyl ether (C−O−C)', on: () => build(S, 'dme'), active: () => S.mode === 'dme', disabled: () => S.p < 1 },
      { id: 'apart', zh: '拆開', en: 'Take apart', on: () => build(S, 'apart'), active: () => S.mode === 'apart', disabled: () => S.p < 1 }
    ] }],
    snapshot: S => ({ mode: S.mode, done: S.p >= 1, yaw: +S.yaw.toFixed(2), pitch: +S.pitch.toFixed(2) })
  });
})();
