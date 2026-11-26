/* mechanics_4_lab_leak_1126_v1.js — 「動手做｜水桶洞口實驗」（#leakLabCanvas，960×540）
 * 契約：window.W5Lab.leak = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理（清水 D＝1 gw/cm³，所以「深度 cm」＝「液體壓力 gw/cm²」）：
 *   水桶高 50 cm，側面 3 個小洞，離桶底 30、20、10 cm；桶放在 60 cm 高的支架上。水面高度 h（滑桿 5～40 cm，預設 40）。
 *   洞的深度 d ＝ h − 洞高（洞在水面上就不出水）。
 *   【開口】水面與洞外都是大氣壓，淨壓＝d；水龍頭持續補水，水面高度維持滑桿的值。
 *   【密閉】蓋上蓋子（不補水）：上方空氣等溫膨脹，P氣 ＝ 1033 × a0 ÷ a（a＝50 − h 為空氣柱高度，a0 為封蓋當下的空氣柱高度）；
 *     洞口淨壓 ＝ P氣 ＋ d − 1033；淨壓 ≤ 0 就不出水（洞很小，空氣進不去）；水面下降速率 ∝ Σ√(淨壓)。
 *   噴流初速 v ＝ √(2 g × 淨壓)（淨壓以「等效水深 cm」計），拋物線軌跡用真正的物理算（支架夠高，所以越深的洞噴得越遠）。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const SCL = 3.2, GY = 500, TB = 308, TX0 = 160, TX1 = 290, TH = 50, HEXT = 40;
  const HOLES = [30, 20, 10];
  const G = 980, P0 = 1033, FLOWC = 0.02;
  const yOf = hcm => TB - hcm * SCL;

  const S = { h: 40, sealed: false, a0: 10, time: 0, flowing: false };
  const pGas = () => (S.sealed ? P0 * S.a0 / (TH - S.h) : P0);
  const depthOf = i => S.h - HOLES[i];
  const netOf = i => { const d = depthOf(i); if (d <= 0) return 0; return Math.max(0, S.sealed ? pGas() + d - P0 : d); };
  const anyFlow = () => HOLES.some((_, i) => netOf(i) > 0.05);

  function setOpen() { S.sealed = false; }
  function setSealed() { if (S.sealed) return; S.sealed = true; S.a0 = TH - S.h; }
  function reset() { S.h = HEXT; S.sealed = false; }

  function step(_, dt) {
    S.time += dt;
    if (S.sealed) {
      let sum = 0; HOLES.forEach((_, i) => { sum += Math.sqrt(netOf(i)); });
      if (sum > 0.01) S.h = Math.max(HOLES[2] + 0.2, S.h - FLOWC * sum * dt);
    }
    S.flowing = anyFlow();
    return S.flowing || S.time < 0.3;
  }

  function jetPath(i) {
    const net = netOf(i), v = Math.sqrt(2 * G * net), yh = yOf(HOLES[i]);
    const tL = Math.sqrt(2 * (GY - yh) / SCL / G), pts = [];
    for (let k = 0; k <= 30; k++) { const t = tL * k / 30; pts.push([TX1 + v * t * SCL, yh + 0.5 * G * t * t * SCL]); }
    return pts;
  }

  function drawTank(c) {
    /* 支架與桌面 */
    c.fillStyle = '#5b4631'; c.fillRect(TX0 - 28, TB, TX1 - TX0 + 56, 14);
    c.fillStyle = '#463726'; c.fillRect(TX0 - 8, TB + 14, 14, GY - TB - 14); c.fillRect(TX1 - 6, TB + 14, 14, GY - TB - 14);
    c.fillStyle = 'rgba(246,243,234,0.10)'; c.fillRect(0, GY, 960, 40);
    c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
    /* 水 */
    const yw = yOf(S.h);
    U.waterRect(c, TX0 + 3, yw, TX1 - 3, TB - 2, { wob: 2.2, phase: S.time * 3 });
    /* 桶壁（玻璃） */
    c.save(); c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(TX0, TB - TH * SCL); c.lineTo(TX0, TB); c.lineTo(TX1, TB); c.lineTo(TX1, TB - TH * SCL); c.stroke(); c.restore();
    /* 洞 */
    HOLES.forEach((hh, i) => {
      const y = yOf(hh);
      c.fillStyle = COL.bg; c.fillRect(TX1 - 4, y - 5, 9, 10);
      U.label(c, String(i + 1), TX0 - 16, y, COL.yellow, 22);
    });
    /* 上方：蓋子或敞口 */
    const top = TB - TH * SCL;
    if (S.sealed) {
      c.fillStyle = '#8a95a0'; c.fillRect(TX0 - 8, top - 16, TX1 - TX0 + 16, 16);
      c.fillStyle = '#5c6670'; c.fillRect(TX0 - 8, top - 4, TX1 - TX0 + 16, 4);
      /* 空氣分子點（確定性） */
      const air = yw - top - 6;
      for (let i = 0; i < 26; i++) {
        const px = TX0 + 10 + ((i * 53.7) % (TX1 - TX0 - 20)), py = top + 6 + ((i * 37.1 + Math.sin(S.time * 2 + i) * 4) % Math.max(8, air));
        c.fillStyle = 'rgba(246,243,234,0.55)'; c.beginPath(); c.arc(px, py, 2.6, 0, 6.283); c.fill();
      }
    } else {
      /* 水龍頭：持續補水 */
      c.fillStyle = '#9aa6b0'; c.fillRect(TX0 + 20, top - 48, 70, 14); c.fillRect(TX0 + 20, top - 48, 14, 36);
      c.strokeStyle = COL.waterEdge; c.lineWidth = 4; c.setLineDash([8, 7]); c.lineDashOffset = -S.time * 60;
      c.beginPath(); c.moveTo(TX0 + 27, top - 12); c.lineTo(TX0 + 27, yw); c.stroke(); c.setLineDash([]);
    }
    /* 噴流 */
    HOLES.forEach((hh, i) => {
      if (netOf(i) <= 0.05) return;
      const pts = jetPath(i), tip = pts[pts.length - 1];
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(47,143,216,0.85)'; c.lineWidth = 6; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = 'rgba(190,230,255,0.95)'; c.lineWidth = 2.6; c.setLineDash([10, 12]); c.lineDashOffset = -S.time * 160;
      c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(124,201,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.ellipse(tip[0], GY - 1, 14 + (Math.sin(S.time * 8 + i) + 1) * 3, 4, 0, 0, 6.283); c.stroke();
      c.restore();
    });
    /* 壓力箭頭（珊瑚）：從水裡指向洞口，長度 ∝ 液體壓力 d */
    HOLES.forEach((hh, i) => {
      const d = depthOf(i), y = yOf(hh);
      if (d <= 0) { U.pill(c, T('露出水面', 'Above water'), TX1 + 70, y, COL.dim, 22); return; }
      const len = Math.min(104, d * 2.6);
      U.arrow(c, TX1 - 8 - len, y, TX1 - 6, y, COL.coral, 6);
    });
    /* 尺：從水面往下 */
    c.strokeStyle = COL.yellow; c.lineWidth = 2; c.setLineDash([6, 6]);
    c.beginPath(); c.moveTo(TX0 - 40, yw); c.lineTo(TX0 - 40, TB); c.stroke(); c.setLineDash([]);
    U.pill(c, (Math.round(S.h * 10) / 10) + ' cm', TX0 - 48, (yw + TB) / 2, COL.yellow, 22, 'right');
  }

  function draw(c) {
    drawTank(c);
    U.pill(c, S.sealed ? T('密閉加蓋（不補水）', 'Sealed lid (no refill)') : T('開口容器（水龍頭補水，水面不變）', 'Open top (tap refills, level holds)'), 300, 70, S.sealed ? COL.coral : COL.teal, 22);
    /* 右側資訊板 */
    const bx = 650, bw = 290;
    U.pill(c, T('每個洞的壓力', 'Pressure at each hole'), bx + bw / 2, 78, COL.white, 22);
    HOLES.forEach((hh, i) => {
      const y = 150 + i * 92, d = depthOf(i), net = netOf(i), on = net > 0.05, under = d > 0;
      U.rr(c, bx, y - 36, bw, 78, 10); c.fillStyle = on ? 'rgba(77,210,255,0.10)' : 'rgba(0,0,0,0.22)'; c.fill();
      c.strokeStyle = on ? COL.teal : 'rgba(246,243,234,0.25)'; c.lineWidth = on ? 3 : 2; c.stroke();
      U.label(c, T('洞 ', 'Hole ') + (i + 1) + ' · ' + (under ? Math.round(d * 10) / 10 + ' cm' : '—'), bx + 14, y - 12, COL.white, 22, 'left');
      U.label(c, under ? 'P = ' + (Math.round(d * 10) / 10) + ' gw/cm²' : T('露出水面', 'Above the water'), bx + 14, y + 22, under ? COL.coral : COL.dim, 22, 'left', true);
      U.label(c, on ? T('噴出', 'Flows') : T('不出水', 'No flow'), bx + bw - 14, y - 12, on ? COL.teal : COL.dim, 22, 'right');
    });
    /* 密閉：上方氣壓 */
    if (S.sealed) {
      const pg = pGas();
      U.rr(c, bx, 410, bw, 92, 10); c.fillStyle = 'rgba(255,128,64,0.10)'; c.fill(); c.strokeStyle = COL.coral; c.lineWidth = 3; c.stroke();
      U.label(c, T('上方氣壓 P氣', 'Air pressure above'), bx + 14, 436, COL.white, 22, 'left');
      U.label(c, '≈ ' + (Math.round(pg * 10) / 10) + ' gw/cm²', bx + 14, 470, COL.coral, 24, 'left', true);
    } else {
      U.pill(c, T('洞口外：大氣壓 1033', 'Outside: air 1033'), bx + bw / 2, 440, COL.dim, 22);
    }
  }

  function result() {
    if (!S.sealed) {
      return `<div><span class="lw-big lw-c">${T('開口：P ＝ h × D，h 越大，噴得越有力', 'Open: P = h × D; a bigger h means a stronger jet')}</span></div>` +
        `<div>${T('水面上方與洞口外都是大氣壓，互相抵消，只剩液體壓力把水推出去；水面高度 ', 'The air above and outside cancel, so only the liquid pressure pushes water out. Water level ')}<b class="lw-y">${Math.round(S.h * 10) / 10} cm</b>${T('。', '.')}</div>` +
        `<div>${T('洞 1、2、3 的壓力：', 'Holes 1, 2, 3: ')}${HOLES.map((hh, i) => { const d = depthOf(i); return d > 0 ? Math.round(d * 10) / 10 : '—'; }).join('、')} gw/cm²</div>`;
    }
    const pg = pGas(), anyIn = HOLES.some((_, i) => netOf(i) > 0.05);
    return `<div><span class="lw-big ${anyIn ? 'lw-c' : 'lw-bad'}">${anyIn ? T('密閉：水先流一點，上方氣壓正在降低…', 'Sealed: water flows a bit while the air pressure drops…') : T('密閉：水流停止，內外壓力平衡', 'Sealed: the flow has stopped, pressures balance')}</span></div>` +
      `<div>${T('上方氣壓 P氣 ≈ ', 'Air pressure above ≈ ')}<b class="lw-p">${Math.round(pg * 10) / 10} gw/cm²</b>${T('，比大氣壓 1033 小。', ', less than the 1033 outside.')}</div>` +
      `<div>${T('最深的洞：P氣 ＋ 液體壓力 ＝ ', 'Deepest hole: air + liquid = ')}${Math.round((pg + depthOf(2)) * 10) / 10}${T('，大氣壓 ＝ 1033', ', atmosphere = 1033')}${anyIn ? '' : T('（相等，不再出水）', ' (equal: no flow)')}</div>`;
  }

  M4Lab.make({
    key: 'leak', tab: 'tab2',
    titleZh: '動手做｜水桶洞口實驗', titleEn: 'Try it | Bucket-Hole Experiment',
    subZh: '拉動水面高度，看哪些洞出水、哪個噴得最遠；再按「密閉加蓋」，先預測：水會一直流、完全不流，還是只流一點就停？', subEn: 'Change the water level and see which holes flow and which jet goes farthest. Then seal the lid and predict: will it flow on, not at all, or just a little?',
    tipZh: '密閉加蓋後水面不能再調；按「開口容器」讓空氣進去，水又會繼續噴。', tipEn: 'With the lid sealed the level cannot be changed; press “Open top” to let air in and the water sprays again.',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'open', zh: '🪣 開口容器', en: '🪣 Open top', on: setOpen, active: () => !S.sealed },
        { id: 'seal', zh: '🔒 密閉加蓋', en: '🔒 Seal the lid', on: setSealed, active: () => S.sealed },
        { id: 'refill', zh: '↺ 重新補水到 40 cm', en: '↺ Refill to 40 cm', on: reset }
      ] },
      { kind: 'slider', id: 'h', zh: '水面高度 h', en: 'Water level h', min: 5, max: 40, step: 1, get: () => Math.round(S.h), set: v => { S.h = v; }, fmt: v => v + ' cm', disabled: () => S.sealed }
    ],
    step, draw, result,
    snapshot: s => ({ h: +s.h.toFixed(2), sealed: s.sealed, pGas: +pGas().toFixed(1), flowing: HOLES.map((_, i) => netOf(i) > 0.05), nets: HOLES.map((_, i) => +netOf(i).toFixed(2)) })
  });
  window.W5Lab.leak.set = (o) => { if (o.h != null) S.h = o.h; if (o.sealed === true) setSealed(); if (o.sealed === false) setOpen(); window.W5Lab.leak.request(); };
})();
