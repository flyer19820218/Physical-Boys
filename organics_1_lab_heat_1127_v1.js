/* organics_1_lab_heat_1127_v1.js ｜ 動手做：砂糖、麵粉、食鹽加熱台（tab2）
 * 流程：戴護目鏡 → 點燃酒精燈 →（先猜）→ 加熱砂糖／麵粉／食鹽 → 比一比。
 * 燃燒匙放在外焰上加熱：砂糖熔化→褐→冒煙→黑；麵粉白→黃→褐→冒煙→黑；食鹽劈啪跳動、一直是白色。
 * 契約：window.W5Lab.heat = { activate, deactivate, relang, _state }；S.run(name) 供有聲講解：'gog'／'light'／'sugar'／'flour'／'salt'／'cmp'。
 * 版面（960×540）：桌面 y 478；酒精燈 x 230（放大 1.5 倍，燈芯頂 y≈388）；加熱位置＝燃燒匙碗心 (230,338)；三支匙休息位置 x 470／620／770、碗心 y 392。
 * 比一比：三支匙並排後，上方標「有機物（含碳）」「有機物（含碳）」「不含碳」。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined') return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U, mix = W5.mix;
  const GY = 478, LAMP = { x: 230, s: 1.5 }, HEATPT = { x: 230, y: 338 };
  const REST = [{ x: 470, y: 392 }, { x: 620, y: 392 }, { x: 770, y: 392 }];
  const KIND = ['sugar', 'flour', 'salt'];
  const NAME = [['砂糖', 'Sugar'], ['麵粉', 'Flour'], ['食鹽', 'Salt']];

  function init() {
    const S = { gogOn: false, gog: 0, lampOn: false, match: -1, h: [0, 0, 0], done: [false, false, false], seen: [false, false, false],
                sp: REST.map(r => ({ x: r.x, y: r.y })), active: -1, cmp: 0, cmpDone: false, guess: null, tt: 0, seq: M4Lab.Seq() };
    S.run = function (name) { run(S, name); };
    S.reset = function () { const n = init(); Object.keys(n).forEach(k => { if (k !== 'run' && k !== 'reset') S[k] = n[k]; }); };
    return S;
  }
  const mv = (o, to, d, lift) => { let f; return { d, s: () => { f = { x: o.x, y: o.y }; }, u: p => { const e = U.ease(p); o.x = U.lerp(f.x, to.x, e); o.y = U.lerp(f.y, to.y, e) - Math.sin(Math.PI * p) * (lift || 0); } }; };
  function run(S, name) {
    if (S.seq.busy) return;
    if (name === 'gog') S.seq.run([{ d: 0.8, u: p => { S.gog = p; }, e: () => { S.gogOn = true; } }]);
    else if (name === 'light') S.seq.run([{ d: 1.6, u: p => { S.match = p; if (p > 0.62) S.lampOn = true; }, e: () => { S.match = -1; S.lampOn = true; } }]);
    else if (name === 'cmp') S.seq.run([{ d: 1.0, u: p => { S.cmp = p; }, e: () => { S.cmpDone = true; } }]);
    else {
      const k = KIND.indexOf(name); if (k < 0 || S.done[k]) return;
      const sp = S.sp[k], rest = REST[k], up = { x: rest.x, y: rest.y - 50 };
      S.seq.run([mv(sp, up, 0.5), mv(sp, HEATPT, 1.1, 50), { d: 4.6, u: p => { S.h[k] = p; S.active = k; } }, { e: () => { S.done[k] = true; S.seen[k] = true; } },
                 mv(sp, up, 1.0, 50), mv(sp, rest, 0.5), { e: () => { S.active = -1; } }]);
    }
  }
  function step(S, dt) { S.tt += dt; const mvg = S.seq.step(dt); return mvg || S.lampOn || S.match >= 0; }

  /* ── 畫法 ── */
  function sample(c, k, h, x, y, t) {
    const w = 15; let col, dome = 4;
    if (k === 0) {
      if (h < 0.25) col = '#f5f3ee';
      else if (h < 0.45) { col = mix('#f5f3ee', '#efcf73', (h - 0.25) / 0.2); dome = 4 - 2.5 * (h - 0.25) / 0.2; }
      else if (h < 0.72) { col = mix('#c07a26', '#4a2a10', (h - 0.45) / 0.27); dome = 1.5 + (h - 0.45) * 1.4 * 9; }
      else { col = mix('#3a2410', '#1b1917', (h - 0.72) / 0.28); dome = 1.5 + (0.4 + (h - 0.72) * 1.6) * 9; }
    } else if (k === 1) {
      col = h < 0.3 ? mix('#f3efe4', '#e7d49d', h / 0.3) : h < 0.6 ? mix('#e7d49d', '#8a5a2b', (h - 0.3) / 0.3) : mix('#8a5a2b', '#211c18', (h - 0.6) / 0.4);
      dome = 4 + (h > 0.6 ? (h - 0.6) * 3 : 0);
    } else col = '#f4f3ee';
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, w, dome, 0, Math.PI, 0); c.arc(x, y, w, 0, Math.PI); c.closePath(); c.fill();
    if (k === 0 && h > 0.25 && h < 0.5) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - 5, y - dome * 0.6, 4, 1.5, 0, 0, Math.PI * 2); c.fill(); }
    if (k === 2 || (k === 0 && h < 0.25)) { c.fillStyle = 'rgba(255,255,255,0.95)'; for (let i = 0; i < 5; i++) c.fillRect(x - 9 + i * 4.5, y - dome * (0.35 + 0.35 * ((i * 3) % 2)), 2, 2); }
  }
  function spoon(c, S, k) {
    const sp = S.sp[k], x = sp.x, y = sp.y, hot = S.active === k ? Math.min(1, S.h[k] * 3) : 0;
    c.save();
    c.strokeStyle = '#9aa7ad'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 18, y + 2); c.lineTo(x + 78, y - 52); c.stroke();                      /* 匙桿 */
    c.fillStyle = '#c9d3d7'; c.beginPath(); c.arc(x + 82, y - 56, 7, 0, Math.PI * 2); c.fill();         /* 把手 */
    const g = c.createLinearGradient(0, y, 0, y + 18); g.addColorStop(0, '#b9c4c8'); g.addColorStop(1, hot ? mix('#7d8a8f', '#ff8a3c', hot * 0.7) : '#7d8a8f');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 20, y); c.quadraticCurveTo(x - 18, y + 22, x, y + 22); c.quadraticCurveTo(x + 18, y + 22, x + 20, y); c.closePath(); c.fill();
    c.strokeStyle = '#4b565b'; c.lineWidth = 2; c.stroke();
    c.restore();
    sample(c, k, S.h[k], x, y + 3, S.tt);
    if (k === 2 && S.active === 2) {                                                                  /* 食鹽劈啪跳 */
      c.save(); c.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) { const ph = (S.tt * 3 + i * 0.37) % 1, up = Math.max(0, Math.sin(ph * Math.PI)) * (14 + (i % 3) * 8); if (ph < 0.8) c.fillRect(x - 12 + i * 5, y - 4 - up, 3, 3); }
      c.restore();
    }
  }
  function stand(c, x, y) {                                                                           /* 燃燒匙休息時的小支架 */
    c.save(); c.strokeStyle = '#6f7b80'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 40, GY); c.lineTo(x + 40, GY); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(x + 4, GY); c.lineTo(x + 4, y + 30); c.stroke();
    c.strokeStyle = '#aab6ba'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 24, y + 28); c.lineTo(x + 28, y + 28); c.stroke();
    c.restore();
  }
  function goggles(c, S) {
    const a = 0.35 + 0.65 * S.gog, x = 110, y = 118;
    c.save(); c.globalAlpha = a; c.strokeStyle = S.gogOn ? COL.yellow : COL.white; c.lineWidth = 4; c.fillStyle = S.gogOn ? 'rgba(255,224,102,0.25)' : 'rgba(77,210,255,0.12)';
    [-34, 34].forEach(dx => { c.beginPath(); c.ellipse(x + dx, y, 28, 22, 0, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x - 62, y); c.lineTo(x - 80, y - 8); c.moveTo(x + 62, y); c.lineTo(x + 80, y - 8); c.stroke();
    c.restore();
    U.label(c, T(S.gogOn ? '護目鏡：戴好了' : '護目鏡', S.gogOn ? 'Goggles on' : 'Goggles'), x, y + 46, S.gogOn ? COL.yellow : COL.dim, 22, 'center');
  }
  function draw(c, S) {
    /* 桌面 */
    c.fillStyle = '#1a3a30'; c.fillRect(0, GY, 960, 540 - GY); c.fillStyle = '#6b5a3c'; c.fillRect(0, GY, 960, 10);
    REST.forEach(r => stand(c, r.x, r.y));
    /* 火柴盒與火柴 */
    c.save(); c.fillStyle = '#c0392b'; U.rr(c, 70, GY - 30, 74, 30, 4); c.fill(); c.fillStyle = '#f6f3ea'; c.fillRect(76, GY - 22, 62, 10); c.restore();
    const lampLit = S.lampOn;
    /* 酒精燈與火焰 */
    if (lampLit) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(LAMP.x, 330, 0, LAMP.x, 330, 190); g.addColorStop(0, 'rgba(255,150,60,0.16)'); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fillRect(LAMP.x - 200, 140, 400, 340); c.restore(); }
    O1.lamp(c, LAMP.x, GY, { on: lampLit, s: LAMP.s, t: S.tt, fh: 62 });
    if (S.match >= 0) {
      const p = S.match, mx = U.lerp(110, LAMP.x + 6, U.ease(Math.min(1, p / 0.6))), my = U.lerp(GY - 34, 392, U.ease(Math.min(1, p / 0.6))) - Math.sin(Math.PI * Math.min(1, p / 0.6)) * 40;
      c.save(); c.strokeStyle = '#d9b36a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(mx - 28, my + 18); c.lineTo(mx, my); c.stroke();
      c.fillStyle = '#c0392b'; c.beginPath(); c.arc(mx, my, 5, 0, Math.PI * 2); c.fill(); c.restore();
      if (p > 0.15) O1.flame(c, mx, my - 3, 20, S.tt, { w: 7 });
    }
    if (lampLit) {
      const zy = 330;
      U.label(c, T('外焰：溫度最高', 'Outer flame: hottest'), LAMP.x + 130, zy - 30, COL.yellow, 22, 'left');
      c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(LAMP.x + 124, zy - 30); c.lineTo(LAMP.x + 40, zy + 6); c.stroke(); c.setLineDash([]); c.restore();
    }
    goggles(c, S);
    /* 三支燃燒匙＋名稱 */
    for (let k = 0; k < 3; k++) {
      const label = T(NAME[k][0], NAME[k][1]);
      const sp = S.sp[k], showY = GY + 30;
      if (S.active !== k) U.label(c, label, REST[k].x, showY, COL.white, 22, 'center');
      else U.label(c, label, REST[k].x, showY, COL.yellow, 22, 'center');
    }
    /* 比一比：先畫三支匙，之後在頂端加標籤 */
    for (let k = 0; k < 3; k++) {
      spoon(c, S, k);
      if (S.active === k && k < 2 && S.h[k] > 0.45) O1.smoke(c, S.sp[k].x - 2, S.sp[k].y - 14, S.tt, { n: 12, h: 120, col: S.h[k] > 0.72 ? '#9aa0a3' : '#e8eef0', a: Math.min(1, (S.h[k] - 0.45) * 5) * (S.h[k] > 0.97 ? 0.5 : 1), spread: 22, seed: k * 5 });
    }
    if (S.cmp > 0) {
      const a = U.ease(S.cmp);
      [['有機物（含碳）', 'Organic (has C)', '#33cc99'], ['有機物（含碳）', 'Organic (has C)', '#33cc99'], ['不含碳', 'No carbon', '#ff8040']].forEach(([zh, en, col], k) => {
        c.save(); c.globalAlpha = a; U.pill(c, T(zh, en), REST[k].x + 6, 250, col, 22, 'center'); c.restore();
      });
    }
    if (!S.gogOn && !S.lampOn && S.h.every(v => v === 0)) U.label(c, T('先戴護目鏡，再點燃酒精燈', 'Goggles first, then light the lamp'), 480, 56, COL.yellow, 24, 'center');
  }

  function result(S) {
    const lines = []; const k = S.seq.busy;
    const obs = [['先熔化成液體，變褐色、冒煙，最後變成<b>黑色</b>', 'Melts, turns brown and smokes, ends up <b>black</b>'], ['由白變黃、變褐、冒煙，最後<b>變黑</b>', 'White → yellow → brown with smoke, finally <b>black</b>'], ['劈啪跳動，但<b>一直是白色</b>，不會變黑', 'Crackles and jumps, but <b>stays white</b>']];
    let tip;
    if (!S.gogOn) tip = ['加熱時粉末可能會噴濺，先<b>戴上護目鏡</b>。', 'Powders can spit when heated — <b>put on your goggles</b> first.'];
    else if (!S.lampOn) tip = ['用<b>火柴</b>點燃酒精燈。', 'Light the alcohol lamp with a <b>match</b>.'];
    else if (!S.done.some(Boolean) && !S.seq.busy) tip = ['三支燃燒匙分別裝了<b>砂糖、麵粉、食鹽</b>。先猜猜看哪些會<b>變黑</b>，再一支一支放到<b>外焰</b>上加熱。', 'The spoons hold <b>sugar, flour and salt</b>. Guess which will <b>turn black</b>, then heat them one by one in the <b>outer flame</b>.'];
    else if (S.cmpDone) tip = ['會變黑的是<b>含碳的有機物</b>（受熱分解後留下碳）；食鹽（NaCl）不含碳，所以不會變黑。', 'The ones that blacken are <b>carbon-containing organics</b> (heat breaks them down and leaves carbon); salt (NaCl) has no carbon.'];
    else if (S.done.every(Boolean)) tip = ['三支燃燒匙都放回架上了，按「比一比」。', 'All three spoons are back on their stands — press “Compare”.'];
    else tip = null;
    let h = tip ? '<div>' + T(tip[0], tip[1]) + '</div>' : '';
    KIND.forEach((kd, i) => { if (S.seen[i]) h += '<div><span class="lw-y">' + T(NAME[i][0], NAME[i][1]) + '</span>：' + T(obs[i][0], obs[i][1]) + '</div>'; });
    if (S.guess && S.cmpDone) h += '<div class="' + (S.guess === 'two' ? 'lw-ok' : 'lw-bad') + '">' + T(S.guess === 'two' ? '你猜對了：砂糖和麵粉會變黑！' : '正確答案是砂糖和麵粉會變黑、食鹽不會。', S.guess === 'two' ? 'You guessed right: sugar and flour blacken!' : 'The answer: sugar and flour blacken, salt does not.') + '</div>';
    return h;
  }

  M4Lab.make({
    key: 'heat', tab: 'tab2',
    titleZh: '🔥 實驗台：哪些是有機物？加熱看看', titleEn: '🔥 Lab Bench: Which Are Organic? Heat Them',
    subZh: '三支燃燒匙分別裝了砂糖、麵粉、食鹽。先猜哪些會變黑，再一支一支放到酒精燈的外焰上加熱。',
    subEn: 'Three burning spoons hold sugar, flour and salt. Guess which will turn black, then heat them one by one in the outer flame.',
    tipZh: '先戴護目鏡、點燃酒精燈，再依序加熱；全部加熱完按「比一比」。', tipEn: 'Put on goggles and light the lamp, heat each spoon in turn, then press “Compare”.',
    init, step, draw, result,
    controls: S => {
      const ready = () => S.gogOn && S.lampOn && !S.seq.busy;
      return [
        { kind: 'buttons', items: [
          { id: 'g_two', zh: '我猜：砂糖、麵粉變黑', en: 'I guess: sugar, flour', on: () => { S.guess = 'two'; }, active: () => S.guess === 'two', disabled: () => S.done.some(Boolean) },
          { id: 'g_all', zh: '我猜：三種都變黑', en: 'I guess: all three', on: () => { S.guess = 'all'; }, active: () => S.guess === 'all', disabled: () => S.done.some(Boolean) },
          { id: 'g_none', zh: '我猜：都不變黑', en: 'I guess: none', on: () => { S.guess = 'none'; }, active: () => S.guess === 'none', disabled: () => S.done.some(Boolean) }] },
        { kind: 'buttons', items: [
          { id: 'gog', zh: '🥽 戴上護目鏡', en: '🥽 Goggles on', on: () => run(S, 'gog'), active: () => S.gogOn, disabled: () => S.gogOn || S.seq.busy },
          { id: 'light', zh: '🔥 點燃酒精燈', en: '🔥 Light the lamp', on: () => run(S, 'light'), active: () => S.lampOn, disabled: () => !S.gogOn || S.lampOn || S.seq.busy },
          { id: 'sugar', zh: '加熱砂糖', en: 'Heat sugar', on: () => run(S, 'sugar'), disabled: () => !ready() || S.done[0] },
          { id: 'flour', zh: '加熱麵粉', en: 'Heat flour', on: () => run(S, 'flour'), disabled: () => !ready() || S.done[1] },
          { id: 'salt', zh: '加熱食鹽', en: 'Heat salt', on: () => run(S, 'salt'), disabled: () => !ready() || S.done[2] },
          { id: 'cmp', zh: '🔍 比一比', en: '🔍 Compare', on: () => run(S, 'cmp'), disabled: () => !S.done.every(Boolean) || S.cmpDone || S.seq.busy },
          { id: 'reset', zh: '↺ 重來', en: '↺ Again', on: () => { S.seq.run([]); S.reset(); } }] }
      ];
    },
    snapshot: S => ({ gogOn: S.gogOn, lampOn: S.lampOn, done: S.done.slice(), cmpDone: S.cmpDone, busy: S.seq.busy })
  });
})();
