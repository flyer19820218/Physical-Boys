/* organics_1_lab_candle_1128_v1.js ｜ 動手做：燃燒檢驗有沒有碳、氫（tab3；樣品＝蒸發皿裡的酒精，不再用蠟燭，避免和上面的動畫重複）
 * 流程：點燃蒸發皿裡的酒精（乙醇）→ 倒扣沾石灰水的燒杯（石灰水變混濁＝有 CO₂＝含碳）→ 拿開燒杯 →
 *       倒扣乾燥的冷燒杯（內壁起霧、小水珠）→ 藍色氯化亞鈷試紙碰水珠（藍變粉紅＝有水＝含氫）。
 * 畫法：燒杯、夾子、分子、試紙用共用的 O1.candle（candle:0 不畫蠟燭）／O1.candlePts／O1.cocl（原寸，x 0、y 0、s 1）；
 *   樣品改成「鐵架環上的蒸發皿＋酒精＋藍色火焰」（本檔自己畫，皿口 y 334，火焰底與蠟燭版同高，所以燒杯位置不變）。
 * 契約：window.W5Lab.candle = { activate, deactivate, relang, _state, S }；S.run(名稱, instant)：
 *   'light'／'lime'／'away'／'cold'／'strip'；instant＝true 直接做到完成（跳句用）。
 * 版面（960×540）：桌面 y 452；樣品中線 x 300；燒杯待命位置 x 760（杯口朝上、離桌面浮在 y 230 左右）；火柴盒在 (850,430)；
 *   燒杯放好時杯口 y 256、中心 y 181，夾子往左伸（末端約 x 40）。不畫手：火柴、燒杯、試紙都自己移動。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined' || typeof O1 === 'undefined' || !O1.candle) return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U, clamp01 = W5.clamp01, ease = U.ease, lerp = U.lerp;
  const GY = 452, CX = 300, REST_X = 760;

  function blank() { return { a: 0, kind: 'lime', bx: REST_X, lift: -49, flip: 0, coat: 0, turb: 0, fog: 0, drops: 0, slide: 0, gas: 0, gasMol: 'CO2' }; }
  function init() {
    const S = { match: -1, lit: 0, lit_on: false, tl: 0, b: blank(), limeDone: false, awayDone: false, coldDone: false, stripDone: false,
                paper: { a: 0, x: 850, y: 270, k: 0 }, tt: 0, seq: M4Lab.Seq() };
    S.run = function (name, instant) { run(S, name, instant); };
    S.reset = function () { const n = init(); Object.keys(n).forEach(k => { if (k !== 'run' && k !== 'reset') S[k] = n[k]; }); };
    return S;
  }
  /* 把一杯「放進場景→翻轉→移到火焰上方→降下」做成分段；kind＝'lime'／'cold' */
  function bringBeaker(S, kind) {
    const b = S.b;
    return [
      { d: 0.1, s: () => { Object.assign(b, blank(), { kind, a: 0 }); }, u: p => { b.a = p; } },
      { d: 1.0, u: p => { b.a = 1; b.bx = lerp(REST_X + 60, REST_X - 60, ease(p)); b.coat = kind === 'lime' ? ease(p) : 0; } },
      { d: 1.0, u: p => { b.flip = ease(p); } },
      { d: 1.4, u: p => { const e = ease(p); b.bx = lerp(REST_X - 60, CX, e); b.lift = lerp(-49, 30, e); } },
      { d: 0.8, u: p => { b.lift = lerp(30, 0, ease(p)); } }];
  }
  function run(S, name, instant) {
    if (S.seq.busy) { if (!instant) return; finish(S); }
    const b = S.b;
    let list = null;
    if (name === 'light') {
      if (S.lit_on) return;
      list = [{ d: 2.6, u: p => { S.match = p; if (p > 0.6) S.lit = clamp01((p - 0.6) / 0.25); }, e: () => { S.match = -1; S.lit = 1; S.lit_on = true; } }];
    } else if (name === 'lime') {
      if (!S.lit_on || S.limeDone || b.a > 0.5) return;
      list = bringBeaker(S, 'lime').concat([{ d: 1.2, u: p => { b.gas = p; } }, { d: 4.0, u: p => { b.turb = p; } }, { d: 0.01, e: () => { S.limeDone = true; } }]);
    } else if (name === 'away') {
      if (b.a < 0.5) return;
      list = [{ d: 0.7, u: p => { b.lift = lerp(0, 30, ease(p)); b.gas = 1 - p; } }, { d: 1.2, u: p => { b.bx = lerp(CX, REST_X, ease(p)); b.lift = lerp(30, -49, ease(p)); } },
              { d: 0.4, u: p => { b.a = 1 - p; }, e: () => { Object.assign(b, blank()); S.awayDone = true; } }];
    } else if (name === 'cold') {
      if (!S.lit_on || S.coldDone || b.a > 0.5) return;
      list = bringBeaker(S, 'cold').concat([{ d: 1.0, u: p => { b.gasMol = 'H2O'; b.gas = p; } }, { d: 2.6, u: p => { b.fog = p; } }, { d: 2.4, u: p => { b.drops = p; } }, { d: 1.2, u: p => { b.slide = p; }, e: () => { S.coldDone = true; } }]);
    } else if (name === 'strip') {
      if (!S.coldDone || S.stripDone) return;
      const R = O1.candlePts({}), tip = R._d.dropSpot, pa = S.paper;
      list = [{ d: 0.4, u: p => { pa.a = p; pa.x = 850; pa.y = 270; pa.k = 0; } },
              { d: 1.6, s: () => { pa.fx = pa.x; pa.fy = pa.y; }, u: p => { const e = ease(p); pa.x = lerp(pa.fx, tip.x, e); pa.y = lerp(pa.fy, tip.y, e); } },
              { d: 1.8, u: p => { pa.k = p; }, e: () => { pa.k = 1; S.stripDone = true; } }];
    }
    if (!list) return;
    S.seq.run(list);
    if (instant) finish(S);
  }
  function finish(S) { let g = 0; while (S.seq.busy && g++ < 800) S.seq.step(0.1); }
  function step(S, dt) { S.tt += dt; if (S.lit_on) S.tl += dt; const mv = S.seq.step(dt); return mv || S.lit_on; }


  /* 樣品：鐵架環上的蒸發皿，皿裡是酒精（乙醇）；皿口 y 334、中線 x 300（火焰底在 y 331） */
  function drawSample(c, S, t) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    /* 鐵架：底座、立桿、橫臂、環 */
    c.fillStyle = '#4b5559'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; U.rr(c, 380, GY - 14, 130, 14, 4); c.fill(); c.stroke();
    c.fillStyle = '#8a969b'; U.rr(c, 438, 372, 12, GY - 14 - 372, 3); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(444, 372); c.lineTo(352, 366); c.stroke();
    c.strokeStyle = '#a2adb2'; c.lineWidth = 5; c.beginPath(); c.moveTo(444, 372); c.lineTo(352, 366); c.stroke();
    /* 蒸發皿（白色瓷碗）＋環 */
    const g = c.createLinearGradient(CX - 56, 0, CX + 56, 0); g.addColorStop(0, '#cfd6d8'); g.addColorStop(0.4, '#fbfbf6'); g.addColorStop(1, '#aab3b6');
    c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(CX - 56, 334); c.quadraticCurveTo(CX - 52, 372, CX, 374); c.quadraticCurveTo(CX + 52, 372, CX + 56, 334); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e4e8e8'; c.beginPath(); c.ellipse(CX, 334, 56, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    /* 酒精（透明、微藍）：燒的時候慢慢變少 */
    const lev = 1 - 0.35 * clamp01(S.tl / 60);
    c.fillStyle = 'rgba(170,215,245,0.55)'; c.beginPath(); c.ellipse(CX, 335 + 3 * (1 - lev) * 4, 46 * lev + 8, 4.6, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(60,70,76,0.9)'; c.lineWidth = 4; c.beginPath(); c.ellipse(CX, 362, 49, 6, 0, 0, Math.PI); c.stroke();
    c.restore();
    U.label(c, T('酒精（乙醇）', 'Ethanol'), CX + 70, 396, COL.white, 22, 'left');
  }

  function draw(c, S) {
    const t = S.tt, b = S.b;
    /* 桌面 */
    if (window.M3) { M3.ground(c, GY, {}); M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 9 }); }
    else { c.fillStyle = '#6b5a3c'; c.fillRect(0, GY, 960, 12); }
    /* 火柴盒 */
    c.save(); c.fillStyle = '#c0392b'; U.rr(c, 812, GY - 30, 74, 30, 4); c.fill(); c.fillStyle = '#f6f3ea'; c.fillRect(818, GY - 22, 62, 10); c.restore();
    const o = { t, burn: 0, lit: S.lit, candle: 0, beaker: b.a, kind: b.kind, bx: b.bx, lift: b.lift, flip: b.flip, coat: b.coat, turb: b.turb, fog: b.fog,
                drops: b.drops, dropSlide: b.slide, tongSide: -1, gas: b.gas, gasMol: b.gasMol, labels: false };
    if (S.paper.a > 0.02) o.paper = { x: S.paper.x, y: S.paper.y, ang: 0.25, len: 90, w: 16, k: S.paper.k, wet: S.paper.k > 0 ? 1 : 0, a: S.paper.a };
    drawSample(c, S, t);
    const R = O1.candle(c, o);
    if (S.lit > 0.02) O1.flame(c, CX, R.flameBase.y + 4, 62 * S.lit, t, { w: 14 * Math.max(0.45, S.lit), outer: 'rgba(90,150,255,0.92)' });
    /* 點燃的火柴 */
    if (S.match >= 0) {
      const p = S.match, go = ease(Math.min(1, p / 0.6)), back = ease(clamp01((p - 0.7) / 0.3));
      const x0 = 840, y0 = 330, x1 = R.flameBase.x + 18, y1 = R.flameBase.y - 6;
      const x = lerp(lerp(x0, x1, go), x0, back), y = lerp(lerp(y0, y1, go), y0 - 10, back);
      O1.match(c, x, y, Math.PI - 0.45, { lit: 1 - back, len: 62, t, burnt: back * 0.8, a: 1 - back * 0.7 });
    }
    /* 標籤 */
    const b2 = S.b.a > 0.5 && S.b.lift < 5 && S.b.flip > 0.95;
    if (b2 && b.kind === 'lime' && b.turb < 0.3 && b.gas > 0) U.pill(c, T('澄清石灰水', 'Clear limewater'), 410, 143, COL.cyan || '#4dd2ff', 22, 'left');
    if (b2 && b.kind === 'lime' && b.turb > 0.6) U.pill(c, T('變混濁：有 CO₂ → 含碳', 'Cloudy: CO₂ → carbon'), 410, 143, COL.yellow, 22, 'left');
    if (b2 && b.kind === 'cold' && b.fog > 0.3 && b.slide < 0.5) U.pill(c, T('內壁起霧、小水珠', 'Mist and droplets'), 410, 143, COL.white, 22, 'left');
    if (S.stripDone) U.pill(c, T('藍變粉紅：有水 → 含氫', 'Blue to pink: water → hydrogen'), 410, 143, COL.yellow, 22, 'left');
    if (!S.lit_on) U.label(c, T('先用火柴點燃蒸發皿裡的酒精', 'First light the ethanol in the dish with a match'), 480, 56, COL.yellow, 24, 'center');
  }

  function result(S) {
    let tip;
    if (!S.lit_on) tip = ['酒精（乙醇）是有機物。先用火柴<b>點燃蒸發皿裡的酒精</b>。', 'Ethanol is organic. <b>Light the ethanol in the dish</b> with a match first.'];
    else if (!S.limeDone && !S.coldDone) tip = ['先檢驗碳：把沾了<b>澄清石灰水</b>的燒杯倒扣在火焰上方（不要蓋住火焰）。', 'Test for carbon first: hold a beaker coated with <b>limewater</b> upside down over the flame (do not cover it).'];
    else if (S.limeDone && !S.awayDone && !S.coldDone) tip = ['石灰水變混濁了。把燒杯<b>拿開</b>，再檢驗氫。', 'The limewater turned cloudy. <b>Take the beaker away</b>, then test for hydrogen.'];
    else if (!S.coldDone) tip = ['檢驗氫：把<b>乾燥的冷燒杯</b>倒扣在火焰上方。', 'Test for hydrogen: hold a <b>dry cold beaker</b> upside down over the flame.'];
    else if (!S.stripDone) tip = ['用<b>藍色氯化亞鈷試紙</b>碰一碰內壁的小水珠。', 'Touch the <b>blue cobalt chloride paper</b> to the droplets on the wall.'];
    else tip = ['完成：<b>碳</b>用石灰水檢驗、<b>氫</b>用氯化亞鈷試紙檢驗。', 'Done: <b>carbon</b> is tested with limewater, <b>hydrogen</b> with cobalt chloride paper.'];
    let h = '<div>' + T(tip[0], tip[1]) + '</div>';
    if (S.limeDone) h += '<div><span class="lw-y">' + T('石灰水', 'Limewater') + '</span>：' + T('變<b>混濁</b>（生成白色碳酸鈣）→ 燃燒產生<b>二氧化碳</b> → 酒精含<b>碳</b>', 'Turns <b>cloudy</b> (white calcium carbonate) → <b>CO₂</b> formed → ethanol contains <b>carbon</b>') + '</div>';
    if (S.coldDone) h += '<div><span class="lw-y">' + T('冷燒杯', 'Cold beaker') + '</span>：' + T('內壁起<b>霧</b>、出現<b>小水珠</b>', 'The wall <b>mists up</b> with <b>droplets</b>') + '</div>';
    if (S.stripDone) h += '<div><span class="lw-y">' + T('試紙', 'Paper') + '</span>：' + T('<b>藍色</b>變<b>粉紅色</b> → 有<b>水</b> → 酒精含<b>氫</b>', '<b>Blue</b> turns <b>pink</b> → <b>water</b> → ethanol contains <b>hydrogen</b>') + '</div>';
    return h;
  }

  M4Lab.make({
    key: 'candle', tab: 'tab3',
    titleZh: '🧪 實驗台：燃燒檢驗有沒有碳和氫', titleEn: '🧪 Lab Bench: Does It Contain Carbon and Hydrogen?',
    subZh: '燃燒蒸發皿裡的酒精，用石灰水檢驗碳、用氯化亞鈷試紙檢驗氫。',
    subEn: 'Burn ethanol in a dish; test for carbon with limewater and for hydrogen with cobalt chloride paper.',
    tipZh: '依序：點燃酒精、石灰水燒杯、拿開、冷燒杯、試紙碰水珠。', tipEn: 'In order: light the ethanol, limewater beaker, take away, cold beaker, touch the paper.',
    init, step, draw, result,
    controls: S => {
      const idle = () => !S.seq.busy;
      return [{ kind: 'buttons', items: [
        { id: 'light', zh: '🔥 點燃酒精', en: '🔥 Light the ethanol', on: () => run(S, 'light'), active: () => S.lit_on, disabled: () => S.lit_on || !idle() },
        { id: 'lime', zh: '倒扣石灰水燒杯', en: 'Limewater beaker', on: () => run(S, 'lime'), active: () => S.limeDone, disabled: () => !S.lit_on || S.limeDone || S.b.a > 0.5 || !idle() },
        { id: 'away', zh: '拿開燒杯', en: 'Take the beaker away', on: () => run(S, 'away'), disabled: () => S.b.a < 0.5 || !idle() },
        { id: 'cold', zh: '倒扣冷燒杯', en: 'Cold beaker', on: () => run(S, 'cold'), active: () => S.coldDone, disabled: () => !S.lit_on || S.coldDone || S.b.a > 0.5 || !idle() },
        { id: 'strip', zh: '試紙碰水珠', en: 'Touch the paper to the droplets', on: () => run(S, 'strip'), active: () => S.stripDone, disabled: () => !S.coldDone || S.stripDone || !idle() },
        { id: 'reset', zh: '↺ 重來', en: '↺ Again', on: () => { S.seq.run([]); S.reset(); } }] }];
    },
    snapshot: S => ({ lit: S.lit_on, limeDone: S.limeDone, awayDone: S.awayDone, coldDone: S.coldDone, stripDone: S.stripDone, busy: S.seq.busy })
  });
})();
