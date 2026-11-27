/* organics_1_lab_wood_1127_v1.js ｜ 動手做：竹筷乾餾實驗台（tab2）
 * 流程：戴護目鏡 → 點燃酒精燈 → 來回移動預熱 → 集中加熱竹筷（冒白煙、竹筷變黑、氣體／液體／焦油出現）
 *       → 點燃導管口氣體 → 檢驗液體（藍色石蕊試紙變紅）→ 看固體（黑色木炭＝碳）→ 蓋上燈帽熄火。
 * 畫法：整組裝置用共用的 O1.rig（鐵架、硬質試管、竹筷、塞子、導管、收集管、冷水燒杯、出氣導管、酒精燈）。
 * 契約：window.W5Lab.wood = { activate, deactivate, relang, _state }；S.run(name, instant)：
 *   'gog'／'light'／'preheat'／'heat'／'ignite'／'litmus'／'solid'／'cap'；instant＝true 時直接做到完成（跳句用）。
 * 版面（960×540）：O1.rig 以 x 10、y 30、s 1 放在左側（桌面 y 482）；右側 x 776～945 放石蕊試紙小桌（培養皿 (810,468)、藍色石蕊試紙 (905,470)）。
 * 不畫手：玻璃棒、火柴都是自己移動的器材。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined' || typeof O1 === 'undefined') return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U, mix = W5.mix, clamp01 = W5.clamp01;
  const RO = { x: 10, y: 30, s: 1 };            // O1.rig 的放法
  const LAMP0 = 193 + 0;                         // 酒精燈預設位置（設計座標，約在竹筷正下方）
  const DISH = { x: 810, y: 470 }, PAPER = { x: 905, y: 472 };
  const GYC = O1.RIG.GY + RO.y;                  // 桌面（畫布座標）
  const ROD_REST = { x: 842, y: 312 };           // 玻璃棒休息時的棒尖

  function init() {
    const S = { gogOn: false, gog: 0, match: -1, lampOn: false, lampX: LAMP0, preheat: 0, preDone: false, heat: 0, heatDone: false,
                ign: 0, ignMatch: -1, ignDone: false, lit: 0, litDone: false, drops: 0, dish: 0, rod: { x: ROD_REST.x, y: ROD_REST.y, w: 0 }, paper: 0,
                solid: 0, solidDone: false, cap: 0, capDone: false, tt: 0, seq: M4Lab.Seq() };
    S.run = function (name, instant) { run(S, name, instant); };
    S.reset = function () { const n = init(); Object.keys(n).forEach(k => { if (k !== 'run' && k !== 'reset') S[k] = n[k]; }); };
    return S;
  }
  const R0 = () => O1.rigPts({ x: RO.x, y: RO.y, s: RO.s });

  function run(S, name, instant) {
    if (S.seq.busy) { if (!instant) return; finish(S); }
    const R = R0();
    let list = null;
    if (name === 'gog') list = [{ d: 0.8, u: p => { S.gog = p; }, e: () => { S.gogOn = true; S.gog = 1; } }];
    else if (name === 'light') {
      if (!S.gogOn) return;
      list = [{ d: 1.6, u: p => { S.match = p; if (p > 0.62) S.lampOn = true; }, e: () => { S.match = -1; S.lampOn = true; } }];
    } else if (name === 'preheat') {
      if (!S.lampOn) return;
      list = [{ d: 4.2, u: p => { S.preheat = p; const ph = p * 2; const k = ph < 1 ? ph : 2 - ph; S.lampX = LAMP0 + (323 - LAMP0) * U.ease(Math.min(1, k * 1.0)); if (p > 0.97) S.lampX = LAMP0; }, e: () => { S.preDone = true; S.lampX = LAMP0; } }];
    } else if (name === 'heat') {
      if (!S.preDone) return;
      list = [{ d: 7.5, u: p => { S.heat = p; }, e: () => { S.heat = 1; S.heatDone = true; } }];
    } else if (name === 'ignite') {
      if (!S.heatDone || S.ignDone) return;
      list = [{ d: 2.2, u: p => { S.ignMatch = p; if (p > 0.55) S.ign = Math.min(1, (p - 0.55) / 0.3); }, e: () => { S.ignMatch = -1; S.ign = 1; S.ignDone = true; } }];
    } else if (name === 'litmus') {
      if (!S.heatDone || S.litDone) return;
      list = [{ d: 1.8, u: p => { S.drops = p; }, e: () => { S.dish = 1; } },
              { d: 1.2, u: p => { S.rod.x = U.lerp(ROD_REST.x, DISH.x + 6, U.ease(p)); S.rod.y = U.lerp(ROD_REST.y, DISH.y - 12, U.ease(p)); } },
              { d: 0.5, u: p => { S.rod.w = p; } },
              { d: 1.2, u: p => { S.rod.x = U.lerp(DISH.x + 6, PAPER.x - 8, U.ease(p)); S.rod.y = U.lerp(DISH.y - 12, PAPER.y - 8, U.ease(p)) - Math.sin(Math.PI * p) * 26; } },
              { d: 1.2, u: p => { S.paper = p; S.rod.w = 1 - p * 0.7; } },
              { d: 0.8, u: p => { S.rod.x = U.lerp(PAPER.x - 8, ROD_REST.x, U.ease(p)); S.rod.y = U.lerp(PAPER.y - 8, ROD_REST.y, U.ease(p)); }, e: () => { S.litDone = true; S.paper = 1; S.rod.w = 0; } }];
    } else if (name === 'solid') {
      if (!S.heatDone || S.solidDone) return;
      list = [{ d: 1.2, u: p => { S.solid = p; }, e: () => { S.solid = 1; S.solidDone = true; } }];
    } else if (name === 'cap') {
      if (!S.heatDone || S.capDone) return;
      list = [{ d: 1.6, u: p => { S.cap = p; }, e: () => { S.cap = 1; S.capDone = true; S.lampOn = false; } }];
    }
    if (!list) return;
    S.seq.run(list);
    if (instant) finish(S);
  }
  function finish(S) { let g = 0; while (S.seq.busy && g++ < 600) S.seq.step(0.1); }
  function step(S, dt) {
    S.tt += dt; const mv = S.seq.step(dt);
    return mv || S.lampOn || (S.heatDone && S.cap < 1) || S.ign > 0;
  }

  /* ── 畫法 ── */
  function gasFlow(S) { return S.cap > 0 ? Math.max(0, 1 - S.cap * 1.0) * (S.heat > 0 ? 1 : 0) : clamp01((S.heat - 0.3) / 0.35); }
  function draw(c, S) {
    const t = S.tt, h = S.heat;
    const gas = S.heat > 0 ? (S.capDone ? Math.max(0, 1 - S.cap) * 0 + 0 : (S.cap > 0 ? 1 - S.cap : clamp01((h - 0.28) / 0.3))) : 0;
    const smoke = S.heat > 0 ? (S.cap > 0 ? (1 - S.cap) * 0.5 : Math.min(1, h * 3) * (h > 0.97 ? 0.55 : 1)) : 0;
    const ro = {
      x: RO.x, y: RO.y, s: RO.s, t, bench: true, lampX: S.lampX, lampOn: S.lampOn ? (S.capDone ? 0 : 1) : false,
      lampFlameH: 100, chipsDarkness: clamp01(h * 1.15), heat: S.lampOn && !S.capDone ? (S.preheat > 0 || S.heat > 0 ? 0.8 : 0.3) : 0,
      smokeAmt: smoke, gasAmt: gas, liquidAmt: clamp01(h * 1.05) * 0.85, tarAmt: clamp01((h - 0.25) / 0.6), drip: h > 0.12 && h < 0.97 ? 1 : 0,
      labels: false, dew: 0.6, dewSlide: 1
    };
    if (S.cap > 0 && S.cap < 1) ro.lampOn = clamp01(1 - S.cap * 1.5);
    const R = O1.rig(c, ro);
    /* 氣體：導管口一直冒；點燃後變火焰 */
    if (S.ign > 0 && gas > 0.05) {
      O1.flame(c, R.outlet.x, R.outlet.y + 2, 38 * S.ign * (0.7 + 0.3 * gas), t, { w: 12 * S.ign });
    }
    /* 護目鏡 */
    O1.goggles(c, 100, 58, { s: 0.9, a: 0.35 + 0.65 * S.gog, col: S.gogOn ? COL.yellow : COL.white });
    U.label(c, T(S.gogOn ? '護目鏡：戴好了' : '護目鏡', S.gogOn ? 'Goggles on' : 'Goggles'), 100, 100, S.gogOn ? COL.yellow : COL.dim, 22, 'center');
    /* 火柴盒與點燈用的火柴 */
    c.save(); c.fillStyle = '#c0392b'; U.rr(c, 42, GYC - 30, 74, 30, 4); c.fill(); c.fillStyle = '#f6f3ea'; c.fillRect(48, GYC - 22, 62, 10); c.restore();
    if (S.match >= 0) {
      const p = S.match, k = U.ease(Math.min(1, p / 0.6));
      const mx = U.lerp(100, R.wick.x + 6, k), my = U.lerp(GYC - 36, R.wick.y - 4, k) - Math.sin(Math.PI * Math.min(1, p / 0.6)) * 34;
      O1.match(c, mx, my, Math.PI * 0.82, { lit: p > 0.15 ? 1 : 0, len: 58, t });
    }
    /* 點氣體的火柴：從右上方移到導管口 */
    if (S.ignMatch >= 0) {
      const p = S.ignMatch, k = U.ease(Math.min(1, p / 0.55));
      const mx = U.lerp(R.outlet.x + 90, R.outlet.x + 4, k), my = U.lerp(R.outlet.y - 70, R.outlet.y + 6, k);
      O1.match(c, mx, my, Math.PI * 0.2, { lit: 1, len: 58, t, burnt: p > 0.8 ? 0.5 : 0 });
    }
    /* 燈帽 */
    if (S.cap > 0) {
      const k = U.ease(Math.min(1, S.cap)), s = O1.RIG.LAMP_S * RO.s;
      O1.lampCap(c, R.lamp.x, R.lamp.y - 44 * s - (1 - k) * 90, s, { a: Math.min(1, S.cap * 4) });
    }
    /* 氣體標籤（可燃） */
    if (S.ign > 0.6 && gas > 0.05) U.pill(c, T('可燃性氣體', 'Flammable gas'), R.outlet.x - 22, R.outlet.y - 40, COL.yellow, 22, 'right');
    /* 石蕊試紙小桌 */
    drawLitmus(c, S, R);
    /* 固體聚光 */
    if (S.solid > 0) {
      const a = U.ease(S.solid);
      O1.spot(c, [{ x: R.chips.x, y: R.chips.y, r: 86 }], { a: 0.55 * a });
      c.save(); c.globalAlpha = a; c.strokeStyle = COL.yellow; c.lineWidth = 4; c.beginPath(); c.arc(R.chips.x, R.chips.y, 80, 0, Math.PI * 2); c.stroke(); c.restore();
      c.save(); c.globalAlpha = a; U.pill(c, T('黑色固體：木炭＝碳', 'Black solid: charcoal = carbon'), R.chips.x, R.chips.y - 112, COL.yellow, 22, 'center'); c.restore();
    }
    /* 狀態標籤 */
    if (S.heatDone && !S.solid) {
      U.pill(c, T('液體', 'Liquid'), R.colTop.x - 36, R.colTop.y - 56, COL.white, 22, 'right');
    }
    if (!S.gogOn && !S.lampOn) U.label(c, T('先戴護目鏡，再點燃酒精燈', 'Goggles first, then light the lamp'), 480, 56, COL.yellow, 24, 'center');
  }
  function drawLitmus(c, S, R) {
    c.save();
    /* 小桌面上的培養皿與試紙 */
    c.fillStyle = 'rgba(220,240,250,0.16)'; c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(DISH.x, DISH.y, 36, 9, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    if (S.dish > 0 || S.drops > 0.5) {
      const f = S.dish ? 1 : clamp01((S.drops - 0.5) * 2);
      c.fillStyle = 'rgba(214,160,74,' + (0.8 * f).toFixed(2) + ')'; c.beginPath(); c.ellipse(DISH.x, DISH.y, 28 * f, 5.5 * f, 0, 0, Math.PI * 2); c.fill();
    }
    const col = mix('#3d78ff', '#ff4d4d', U.ease(S.paper));
    c.fillStyle = col; U.rr(c, PAPER.x - 38, PAPER.y - 8, 76, 16, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
    U.label(c, T('石蕊試紙', 'Litmus'), PAPER.x, PAPER.y + 32, COL.white, 22, 'center');
    /* 液滴：從收集管液面飛到培養皿（沒有手） */
    if (S.drops > 0 && S.drops < 1 && !S.dish) {
      const a0 = R.liquidTop, a1 = { x: DISH.x, y: DISH.y - 6 };
      for (let i = 0; i < 3; i++) {
        const p = clamp01(S.drops * 1.5 - i * 0.18); if (p <= 0 || p >= 1) continue;
        const x = U.lerp(a0.x, a1.x, p), y = U.lerp(a0.y, a1.y, p) - Math.sin(Math.PI * p) * 110;
        c.save(); c.fillStyle = 'rgba(214,160,74,0.95)'; c.strokeStyle = 'rgba(60,36,16,0.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 5, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
      }
    }
    /* 玻璃棒（斜放，棒尖在 S.rod.x/y；握把朝左上；沒有手） */
    if (S.dish || S.rod.x !== ROD_REST.x || S.rod.y !== ROD_REST.y || S.litDone || S.drops >= 1) {
      const tx = S.rod.x, ty = S.rod.y, hx = tx - 78, hy = ty - 100;
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 9; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke();
      c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke();
      if (S.rod.w > 0.05) { c.fillStyle = 'rgba(214,160,74,' + S.rod.w.toFixed(2) + ')'; c.beginPath(); c.arc(tx, ty + 1, 4.5, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
    if (S.heatDone && S.paper > 0.5) U.pill(c, T('變紅：酸性', 'Turns red: acidic'), 950, PAPER.y - 44, COL.yellow, 22, 'right');
  }

  function result(S) {
    let tip;
    if (!S.gogOn) tip = ['加熱時玻璃管可能破裂，先<b>戴上護目鏡</b>。', 'The glass may crack when heated — <b>put on your goggles</b> first.'];
    else if (!S.lampOn) tip = ['用<b>火柴</b>點燃酒精燈。', 'Light the alcohol lamp with a <b>match</b>.'];
    else if (!S.preDone) tip = ['先按「來回預熱」：移動酒精燈，讓試管<b>均勻受熱</b>，避免破裂。', 'Press “Preheat”: sweep the lamp back and forth so the tube heats <b>evenly</b>.'];
    else if (!S.heatDone) tip = ['按「集中加熱」：把火停在<b>竹筷</b>的位置。', 'Press “Heat”: hold the flame under the <b>bamboo pieces</b>.'];
    else if (!S.capDone) tip = ['乾餾完成！去找三處產物：<b>氣體</b>（點燃導管口）、<b>液體</b>（檢驗酸性）、<b>固體</b>（看試管底）。', 'Done! Look for the three products: <b>gas</b> (light the tube end), <b>liquid</b> (test acidity), <b>solid</b> (look at the tube bottom).'];
    else tip = ['結束了：蓋上燈帽讓火熄滅，不可以用嘴吹。', 'All done: put the cap on to put the flame out — never blow it out.'];
    let h = '<div>' + T(tip[0], tip[1]) + '</div>';
    if (S.heat > 0.3) h += '<div><span class="lw-y">' + T('試管', 'Tube') + '</span>：' + T('冒出<b>白煙</b>，竹筷慢慢變<b>黑</b>', '<b>White smoke</b> appears and the bamboo turns <b>black</b>') + '</div>';
    if (S.ignDone) h += '<div><span class="lw-y">' + T('氣體', 'Gas') + '</span>：' + T('導管口<b>燒起來</b>了——有<b>可燃性氣體</b>（CO、CH₄、H₂）', 'The tube end <b>burns</b> — <b>flammable gas</b> (CO, CH₄, H₂)') + '</div>';
    if (S.litDone) h += '<div><span class="lw-y">' + T('液體', 'Liquid') + '</span>：' + T('有深色黏稠的<b>焦油</b>和透明的<b>醋酸</b>；藍色石蕊試紙<b>變紅</b>', 'Dark sticky <b>tar</b> and clear <b>acetic acid</b>; blue litmus <b>turns red</b>') + '</div>';
    if (S.solidDone) h += '<div><span class="lw-y">' + T('固體', 'Solid') + '</span>：' + T('黑色的<b>木炭</b>，成分就是<b>碳</b>', 'Black <b>charcoal</b> — it is <b>carbon</b>') + '</div>';
    return h;
  }

  M4Lab.make({
    key: 'wood', tab: 'tab2',
    titleZh: '🎋 實驗台：竹筷乾餾', titleEn: '🎋 Lab Bench: Dry Distillation of Bamboo',
    subZh: '把竹筷碎片隔絕空氣加熱，看看氣體、液體、固體三種產物。',
    subEn: 'Heat bamboo pieces without air and look for the three products: gas, liquid and solid.',
    tipZh: '依序：護目鏡、點燈、預熱、集中加熱；完成後再去找三處產物。', tipEn: 'In order: goggles, light, preheat, heat; then hunt for the three products.',
    init, step, draw, result,
    controls: S => {
      const idle = () => !S.seq.busy;
      return [
        { kind: 'buttons', items: [
          { id: 'gog', zh: '🥽 戴上護目鏡', en: '🥽 Goggles on', on: () => run(S, 'gog'), active: () => S.gogOn, disabled: () => S.gogOn || !idle() },
          { id: 'light', zh: '🔥 點燃酒精燈', en: '🔥 Light the lamp', on: () => run(S, 'light'), active: () => S.lampOn, disabled: () => !S.gogOn || S.lampOn || !idle() },
          { id: 'preheat', zh: '↔ 來回預熱', en: '↔ Preheat', on: () => run(S, 'preheat'), active: () => S.preDone, disabled: () => !S.lampOn || S.preDone || !idle() },
          { id: 'heat', zh: '集中加熱竹筷', en: 'Heat the bamboo', on: () => run(S, 'heat'), active: () => S.heatDone, disabled: () => !S.preDone || S.heatDone || !idle() }] },
        { kind: 'buttons', items: [
          { id: 'ignite', zh: '點燃導管口氣體', en: 'Light the gas', on: () => run(S, 'ignite'), active: () => S.ignDone, disabled: () => !S.heatDone || S.ignDone || !idle() },
          { id: 'litmus', zh: '檢驗液體（石蕊試紙）', en: 'Test the liquid (litmus)', on: () => run(S, 'litmus'), active: () => S.litDone, disabled: () => !S.heatDone || S.litDone || !idle() },
          { id: 'solid', zh: '看固體', en: 'Look at the solid', on: () => run(S, 'solid'), active: () => S.solidDone, disabled: () => !S.heatDone || S.solidDone || !idle() },
          { id: 'cap', zh: '蓋上燈帽熄火', en: 'Cap the lamp', on: () => run(S, 'cap'), active: () => S.capDone, disabled: () => !S.heatDone || S.capDone || !idle() },
          { id: 'reset', zh: '↺ 重來', en: '↺ Again', on: () => { S.seq.run([]); S.reset(); } }] }
      ];
    },
    snapshot: S => ({ gogOn: S.gogOn, lampOn: S.lampOn, preDone: S.preDone, heatDone: S.heatDone, ignDone: S.ignDone, litDone: S.litDone, solidDone: S.solidDone, capDone: S.capDone, busy: S.seq.busy })
  });
})();
