/* organics_1_lab_sort_1127_v1.js ｜ 動手做：烏拉的分類盲盒（tab1）
 * 把 6 個化學式拖進「有機物（含碳）」或「無機物（例外）」。拖錯會彈回並說明原因；全對有收束。
 * 契約：window.W5Lab.sort = { activate, deactivate, relang, _state }；S.place(id) 供有聲講解示範（自動放對一個）。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined') return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U;
  const CW = 190, CH = 58;
  /* org：true＝有機物。fz/fe：分類說明（中／英） */
  const ITEMS = [
    { id: 'urea', txt: null, nz: '尿素', ne: 'Urea', f: 'CO(NH2)2', org: true,
      fz: '尿素 CO(NH₂)₂ 含碳，是烏拉用無機物加熱人工合成出來的有機物。', fe: 'Urea, CO(NH₂)₂, contains carbon. It is the organic compound Wöhler made from inorganic matter.' },
    { id: 'ch4', f: 'CH4', org: true,
      fz: '甲烷 CH₄ 含碳，是最簡單的有機物。', fe: 'Methane, CH₄, contains carbon and is the simplest organic compound.' },
    { id: 'etoh', f: 'C2H5OH', org: true,
      fz: '乙醇（酒精）C₂H₅OH 含碳，是有機物。', fe: 'Ethanol (alcohol), C₂H₅OH, contains carbon and is organic.' },
    { id: 'co2', f: 'CO2', org: false,
      fz: 'CO₂ 雖然含碳，但屬於「碳的氧化物」，是四大例外之一，算無機物。', fe: 'CO₂ contains carbon, but it is an oxide of carbon, one of the four exceptions, so it is inorganic.' },
    { id: 'caco3', f: 'CaCO3', org: false,
      fz: 'CaCO₃（碳酸鈣）是「碳酸鹽類」，四大例外之一，算無機物。', fe: 'CaCO₃ (calcium carbonate) is a carbonate, one of the four exceptions, so it is inorganic.' },
    { id: 'kcn', f: 'KCN', org: false,
      fz: 'KCN（氰化鉀）是「氰化物」，四大例外之一，算無機物。', fe: 'KCN (potassium cyanide) is a cyanide, one of the four exceptions, so it is inorganic.' }
  ];
  const HOME = [[190, 128], [480, 128], [770, 128], [190, 208], [480, 208], [770, 208]];
  const BIN = { org: { x: 40, y: 262, w: 420, h: 258 }, inorg: { x: 500, y: 262, w: 420, h: 258 } };
  const SLOT = bin => { const b = BIN[bin]; return [[b.x + 112, b.y + 108], [b.x + 312, b.y + 108], [b.x + 112, b.y + 184], [b.x + 312, b.y + 184], [b.x + 112, b.y + 260], [b.x + 312, b.y + 260]]; };

  function init() {
    const S = { chips: ITEMS.map((it, i) => ({ it, x: HOME[i][0], y: HOME[i][1], hx: HOME[i][0], hy: HOME[i][1], st: 'home', bin: null, shake: 0 })),
                drag: null, msg: null, tries: 0, wrong: 0, nOrg: 0, nIn: 0, tt: 0 };
    S.place = function (id) {       /* 供有聲講解：自動把某一個放進正確的分類 */
      const ch = S.chips.find(c => c.it.id === id && c.st !== 'placed'); if (!ch) return;
      drop(S, ch, ch.it.org ? 'org' : 'inorg');
    };
    S.reset = function () { const n = init(); Object.keys(n).forEach(k => { if (k !== 'place' && k !== 'reset') S[k] = n[k]; }); };
    return S;
  }
  function binAt(x, y) { for (const k in BIN) { const b = BIN[k]; if (x >= b.x && x <= b.x + b.w && y >= b.y - 10 && y <= b.y + b.h) return k; } return null; }
  function drop(S, ch, bin) {
    S.tries++;
    const good = (bin === 'org') === ch.it.org;
    if (good) {
      const slots = SLOT(bin), n = S.chips.filter(c => c.st === 'placed' && c.bin === bin).length;
      ch.st = 'placed'; ch.bin = bin; ch.tx = slots[n][0]; ch.ty = slots[n][1];
      S.msg = { ok: true, id: ch.it.id };
    } else { ch.st = 'back'; ch.shake = 1; S.wrong++; S.msg = { ok: false, id: ch.it.id, bin }; }
  }
  function pointer(S, type, x, y) {
    if (type === 'down') {
      for (let i = S.chips.length - 1; i >= 0; i--) {
        const ch = S.chips[i];
        if (ch.st === 'placed' || ch.st === 'back') continue;
        if (Math.abs(x - ch.x) <= CW / 2 && Math.abs(y - ch.y) <= CH / 2) { S.drag = { ch, dx: x - ch.x, dy: y - ch.y }; ch.st = 'drag'; S.chips.push(S.chips.splice(i, 1)[0]); return true; }
      }
      return false;
    }
    if (type === 'move') { if (!S.drag) return false; const ch = S.drag.ch; ch.x = U.clamp(x - S.drag.dx, CW / 2, 960 - CW / 2); ch.y = U.clamp(y - S.drag.dy, 40 + CH / 2, 540 - CH / 2); return true; }
    if (S.drag) {
      const ch = S.drag.ch; S.drag = null;
      const bin = binAt(ch.x, ch.y);
      if (bin) drop(S, ch, bin); else { ch.st = 'back'; }
      return true;
    }
    return false;
  }
  function step(S, dt) {
    S.tt += dt; let moving = false;
    S.chips.forEach(ch => {
      if (ch.st === 'back') { const k = Math.min(1, dt * 9); ch.x += (ch.hx - ch.x) * k; ch.y += (ch.hy - ch.y) * k; if (Math.hypot(ch.hx - ch.x, ch.hy - ch.y) < 1.5) { ch.x = ch.hx; ch.y = ch.hy; ch.st = 'home'; } moving = true; }
      if (ch.st === 'placed') { const k = Math.min(1, dt * 12); ch.x += (ch.tx - ch.x) * k; ch.y += (ch.ty - ch.y) * k; if (Math.hypot(ch.tx - ch.x, ch.ty - ch.y) > 0.6) moving = true; }
      if (ch.shake > 0) { ch.shake = Math.max(0, ch.shake - dt * 2.2); moving = true; }
    });
    return moving;
  }
  function drawChip(c, ch, S) {
    const it = ch.it, placed = ch.st === 'placed', dragging = ch.st === 'drag';
    const col = placed ? (ch.bin === 'org' ? '#33cc99' : '#ff8040') : dragging ? COL.yellow : COL.white;
    const sx = ch.shake > 0 ? Math.sin(ch.shake * 40) * 8 * ch.shake : 0;
    const lift = dragging ? 6 : 0;
    c.save(); c.translate(ch.x + sx, ch.y - lift);
    c.fillStyle = 'rgba(0,0,0,0.3)'; U.rr(c, -CW / 2 + 3, -CH / 2 + 7, CW, CH, 14); c.fill();
    c.fillStyle = placed ? 'rgba(13,32,26,0.96)' : '#1f4236'; U.rr(c, -CW / 2, -CH / 2, CW, CH, 14); c.fill();
    c.lineWidth = placed || dragging ? 3 : 2; c.strokeStyle = placed || dragging ? col : '#a3b8b0'; c.stroke();
    if (it.nz) U.label(c, T(it.nz, it.ne), 0, 1, col, 26, 'center');
    else O1.fx(c, it.f, 0, 1, col, 28, 'center');
    c.restore();
  }
  function draw(c, S) {
    U.label(c, T('把化學式拖進正確的分類', 'Drag each formula into the right group'), 480, 56, COL.yellow, 26, 'center');
    /* 兩個分類區 */
    [['org', '有機物（含碳）', 'Organic (has carbon)', '#33cc99'], ['inorg', '無機物（例外）', 'Inorganic (exception)', '#ff8040']].forEach(([k, zh, en, col]) => {
      const b = BIN[k];
      c.save(); c.fillStyle = W5.rgba(col, 0.1); U.rr(c, b.x, b.y, b.w, b.h, 16); c.fill();
      c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); c.setLineDash([]); c.restore();
      U.label(c, T(zh, en), b.x + b.w / 2, b.y + 30, col, 26, 'center');
    });
    /* 先畫已放好的、再畫待拖的 */
    S.chips.filter(ch => ch.st === 'placed').forEach(ch => drawChip(c, ch, S));
    S.chips.filter(ch => ch.st !== 'placed').forEach(ch => drawChip(c, ch, S));
    /* 答對提示：放好的化學式旁不另外寫字（說明放在結果框） */
  }
  function result(S) {
    const done = S.chips.every(c => c.st === 'placed');
    const n = S.chips.filter(c => c.st === 'placed').length;
    let h = '<div><span class="lw-big lw-y">' + T('已分對 ', 'Sorted ') + n + ' / 6</span>' + (S.wrong ? T('　（拖錯 ', '  (wrong drops: ') + S.wrong + T(' 次）', ')') : '') + '</div>';
    if (S.msg) {
      const it = ITEMS.find(i => i.id === S.msg.id);
      if (S.msg.ok) h += '<div class="lw-ok">' + T('✔ ', '✔ ') + T(it.fz, it.fe) + '</div>';
      else h += '<div class="lw-bad">' + T('✘ 再想想：', '✘ Think again: ') + T(it.fz, it.fe) + '</div>';
    } else h += '<div>' + T('用手指把上面的化學式拖到下面的分類區。', 'Drag a formula from the top into one of the two groups below.') + '</div>';
    if (done) h += '<div class="lw-ok">' + T('全部分對了！含碳的化合物是有機物，但碳的氧化物、碳酸鹽類、氰化物、碳化物是四大例外。', 'All sorted! Carbon compounds are organic — except oxides of carbon, carbonates, cyanides and carbides.') + '</div>';
    return h;
  }

  M4Lab.make({
    key: 'sort', tab: 'tab1',
    titleZh: '🎲 烏拉的分類盲盒', titleEn: '🎲 Wöhler’s Sorting Box'.replace('’', "'"),
    subZh: '請將下方的化學式，用手指拖曳到正確的分類區！', subEn: 'Drag each formula below into the right group with your finger!',
    tipZh: '提示：看看它含不含碳，再想想它是不是四大例外。', tipEn: 'Hint: check whether it contains carbon, then ask whether it is one of the four exceptions.',
    touchNone: true,
    init, step, draw, result, pointer,
    controls: S => [{ kind: 'buttons', items: [
      { id: 'reset', zh: '↺ 再玩一次', en: '↺ Play again', on: () => S.reset() }
    ] }],
    snapshot: S => ({ placed: S.chips.filter(c => c.st === 'placed').length, wrong: S.wrong })
  });
})();
