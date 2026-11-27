/* mechanics_5_lab_torr_1127_v1.js — 「動手做｜托里切利實驗台」（#torrLabCanvas，960×540，掛在 #tab2）
 * 契約：window.W5Lab.torr = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理：
 *   大氣壓 P氣（gw/cm²）＝ 1033.6 × exp(−海拔 ÷ 8400)；0 m＝1033.6，3000 m ≈ 723 ≈ 53.2 cmHg。
 *   液柱垂直高度 h ＝ (P氣 − P管頂) ÷ D（水銀 D＝13.6、清水 D＝1.0）。
 *   管頂空氣（混入次數 a＝0～3）：波以耳定律 P管頂 × L空 ＝ k × a，L空 ＝ 管總長 − h（管總長 水銀 100 cm、清水 1100 cm）。
 *     k：水銀管 960 gw·cm（＝ 40 gw/cm² × 24 cm，混入一次先取 40 起），清水管依管長放大為 10560（＝ 960 × 11），
 *     這是「示意」：每次混入同樣比例的一小團空氣。h 由二分法解 P氣 − k·a ÷ (L總 − h) − D·h ＝ 0。
 *   傾斜角 θ（離鉛直）：管內液柱長度 ＝ h ÷ cosθ，垂直高度 h 不變；管粗細只改畫面。
 * 畫面比例：水銀 1 cm ＝ 3.6 px；清水拉遠成 1 m ＝ 40 px（1 cm ＝ 0.4 px）。
 * 會動的東西：換液體／重來＝管子裝滿倒插，液柱掉下來（彈簧阻尼，有過衝）；海拔、空氣改變時液柱即時升降；傾斜時管子慢慢轉。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const LIQ = {
    hg: { zh: '水銀', en: 'Mercury', D: 13.6, LT: 100, s: 3.6, k: 960 },
    w: { zh: '清水', en: 'Water', D: 1.0, LT: 1100, s: 0.4, k: 10560 }
  };
  const Y0 = 492, PX = 190, RX = 70, DEP = 22;
  const S = { liq: 'hg', thick: 0, th: 0, alt: 0, a: 0, hd: 100, hv: 0, thD: 0, thickD: 20, time: 0 };

  const Patm = alt => 1033.6 * Math.exp(-alt / 8400);
  function solve() {
    const L = LIQ[S.liq], P = Patm(S.alt);
    if (S.a === 0) return { P, Ptop: 0, h: P / L.D };
    let lo = 0, hi = Math.min(L.LT - 1e-6, P / L.D);
    const g = h => P - L.k * S.a / (L.LT - h) - L.D * h;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; }
    const h = (lo + hi) / 2; return { P, Ptop: L.k * S.a / (L.LT - h), h };
  }
  const cosT = () => Math.cos(S.th * Math.PI / 180);

  function refill() { S.hd = LIQ[S.liq].LT; S.hv = 0; }
  function setLiq(k) { if (S.liq === k) return; S.liq = k; S.a = 0; refill(); }
  function reset() { S.liq = 'hg'; S.thick = 0; S.th = 0; S.alt = 0; S.a = 0; S.thD = 0; refill(); }
  function addAir() { if (S.a < 3) S.a++; }

  function step(_, dt) {
    S.time += dt;
    const L = LIQ[S.liq], tg = solve().h, n = 3, d = dt / n;
    for (let i = 0; i < n; i++) {
      const acc = -81 * (S.hd - tg) - 2 * 0.4 * 9 * S.hv;
      S.hv += acc * d; S.hd += S.hv * d;
      if (S.hd > L.LT) { S.hd = L.LT; S.hv = Math.min(0, S.hv); }
      if (S.hd < 0) { S.hd = 0; S.hv = Math.max(0, S.hv); }
    }
    const settled = Math.abs(S.hd - tg) < L.LT * 2e-5 && Math.abs(S.hv) < L.LT * 5e-4;
    if (settled) { S.hd = tg; S.hv = 0; }
    const k = Math.min(1, dt * 10);
    S.thD += (S.th - S.thD) * k; if (Math.abs(S.th - S.thD) < 0.02) S.thD = S.th;
    const tw = S.thick ? 40 : 20; S.thickD += (tw - S.thickD) * k; if (Math.abs(tw - S.thickD) < 0.1) S.thickD = tw;
    return !settled || S.thD !== S.th || S.thickD !== tw || S.time < 0.3;
  }

  const meas = (c, str) => { c.save(); c.font = '700 22px "Noto Sans TC","JetBrains Mono",sans-serif'; const w = c.measureText(str).width + 28; c.restore(); return w; };

  function ruler(c, L) {
    const s = L.s, water = S.liq === 'w', unit = water ? 100 : 10, top = water ? 11 : 100;
    c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(RX, Y0); c.lineTo(RX, Y0 - top * (water ? 100 : 1) * s); c.stroke();
    for (let v = 0; v <= top * (water ? 100 : 1); v += unit / 2) {
      const major = v % unit === 0, y = Y0 - v * s;
      c.lineWidth = major ? 3 : 2; c.beginPath(); c.moveTo(RX, y); c.lineTo(RX + (major ? 16 : 9), y); c.stroke();
      if (major) U.label(c, String(water ? v / 100 : v), RX - 10, y, COL.white, 22, 'right', true);
    }
    U.label(c, water ? 'm' : 'cm', RX, Y0 - top * (water ? 100 : 1) * s - 26, COL.dim, 22, 'center', true);
  }

  function draw(c) {
    const L = LIQ[S.liq], s = L.s, water = S.liq === 'w', th = S.thD * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    const sol = solve(), hd = S.hd, w = S.thickD;
    const Lc = hd / cs, Lair = Math.max(0, L.LT - hd), Lt = Lc + Lair;     /* 管內液柱長、管頂空氣長、管總長（cm，沿管） */
    const Lcp = Lc * s, Ltp = Lt * s;

    /* 垂直尺 */
    ruler(c, L);
    /* 水槽 */
    const tx0 = 100, tx1 = 340, ty1 = 530;
    const g = c.createLinearGradient(0, Y0, 0, ty1);
    if (water) { g.addColorStop(0, 'rgba(47,143,216,0.55)'); g.addColorStop(1, 'rgba(26,96,168,0.72)'); } else { g.addColorStop(0, '#b8c4cc'); g.addColorStop(1, '#7d8a94'); }
    c.fillStyle = g; c.fillRect(tx0 + 3, Y0, tx1 - tx0 - 6, ty1 - Y0 - 2);
    c.strokeStyle = water ? COL.waterEdge : '#e4eaee'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx0 + 3, Y0); c.lineTo(tx1 - 3, Y0); c.stroke();
    c.strokeStyle = 'rgba(190,230,255,0.9)'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(tx0, Y0 - 14); c.lineTo(tx0, ty1); c.lineTo(tx1, ty1); c.lineTo(tx1, Y0 - 14); c.stroke();

    /* 大氣壓往下壓水槽液面（箭頭長度 ∝ P氣） */
    const alen = 14 + 46 * sol.P / 1033.6;
    [118, 150].forEach(x => U.arrow(c, x, Y0 - 6 - alen, x, Y0 - 6, COL.coral, 6));

    /* 管子 */
    c.save(); c.translate(PX, Y0); c.rotate(th);
    c.fillStyle = 'rgba(190,230,255,0.10)'; c.fillRect(-w / 2, -Ltp, w, Ltp + DEP);
    /* 液柱 */
    const cg = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    if (water) { cg.addColorStop(0, 'rgba(60,150,225,0.80)'); cg.addColorStop(1, 'rgba(30,100,175,0.85)'); } else { cg.addColorStop(0, '#e4eaee'); cg.addColorStop(0.5, '#aab6bf'); cg.addColorStop(1, '#808d97'); }
    /* 液柱：液面一律水平（傾斜時不是垂直管軸）→ 先用世界座標的「y ≥ 液面」半平面裁切，再畫在管內 */
    const yLv = Y0 - hd * s, tn = Math.abs(Math.tan(th)), Ltop = Math.min(Ltp, Lcp + (w / 2) * tn + 3);
    c.save(); c.rotate(-th); c.translate(-PX, -Y0);
    c.beginPath(); c.rect(-200, yLv, 1600, 1200); c.clip();
    c.translate(PX, Y0); c.rotate(th);
    c.fillStyle = cg; c.fillRect(-w / 2 + 2, -Ltop, w - 4, Ltop + DEP);
    c.restore();
    c.save(); c.rotate(-th); c.translate(-PX, -Y0);
    const hx = PX + hd * s * Math.tan(th), hh = (w / 2 - 2) / cs;
    c.strokeStyle = water ? COL.waterEdge : '#f6f3ea'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - hh, yLv); c.lineTo(hx + hh, yLv); c.stroke();
    c.restore();
    /* 管頂空氣分子 */
    if (S.a > 0 && Lair * s > 14) {
      c.fillStyle = 'rgba(246,243,234,0.9)';
      for (let k = 0; k < 5 * S.a; k++) {
        const u = ((k * 0.6180339 + 0.13) % 1), v = ((k * 0.7548777 + 0.31) % 1);
        const px = (v - 0.5) * (w - 10) + Math.sin(S.time * 4 + k) * 2, py = -Lcp - 6 - u * Math.max(0, Lair * s - 12) + Math.cos(S.time * 3 + k * 1.3) * 2;
        if (Y0 + px * sn + py * cs > yLv - 6) continue;          /* 液面是水平的：落到液面下的分子不畫 */
        c.beginPath(); c.arc(px, py, 3, 0, 6.2832); c.fill();
      }
    }
    /* 玻璃管外框 */
    c.strokeStyle = 'rgba(190,230,255,0.95)'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-w / 2, DEP); c.lineTo(-w / 2, -Ltp + w / 2); c.arc(0, -Ltp + w / 2, w / 2, Math.PI, 2 * Math.PI); c.lineTo(w / 2, DEP); c.stroke();
    c.restore();

    /* 頂端虛線與 h 標示 */
    const yTop = Y0 - hd * s, xTop = PX + hd * s * Math.tan(th);
    c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.setLineDash([10, 8]);
    c.beginPath(); c.moveTo(RX, yTop); c.lineTo(xTop, yTop); c.stroke(); c.restore();
    c.fillStyle = COL.yellow; c.beginPath(); c.moveTo(RX - 2, yTop); c.lineTo(RX - 16, yTop - 9); c.lineTo(RX - 16, yTop + 9); c.closePath(); c.fill();
    const hs = T('h ＝ ', 'h = ') + (water ? (hd / 100).toFixed(2) + ' m' : hd.toFixed(1) + ' cm');
    const hw = meas(c, hs);
    /* 管頂標示（真空／空氣）：放在管子頂端上方 */
    const ex = PX + Ltp * sn, ey = Y0 - Ltp * cs;
    const vs = S.a ? T('管頂：空氣 × ' + S.a, 'Top: air × ' + S.a) : T('管頂：真空', 'Top: vacuum');
    const vw = meas(c, vs), vx = Math.max(120, Math.min(ex, 960 - vw / 2 - 8)), vy = ey - 30;
    /* h 標籤：依序試幾個位置，挑第一個不壓到管子、資訊框與真空標籤的 */
    const hit = (x, y) => {                       /* 矩形（左 x、中線 y）是否壓到管子（軸線 ± 半寬）、右下資訊框、真空標籤、箭頭 */
      const x1 = x + hw, y0 = y - 19, y1 = y + 19;
      for (let px = x; px <= x1; px += 12) for (let py = y0; py <= y1; py += 12) {
        const dx = px - PX, dy = Y0 - py, t = Math.max(0, Math.min(Ltp, dx * sn + dy * cs)), d = Math.hypot(dx - t * sn, dy - t * cs);
        if (d < w / 2 + 8) return true;
      }
      if (x1 > 955 || x < 96) return true;
      if (x1 > 556 && y1 > 322) return true;
      if (x1 > vx - vw / 2 - 4 && x < vx + vw / 2 + 4 && y1 > vy - 19 && y0 < vy + 19) return true;
      return false;
    };
    const cands = [[xTop + 50, yTop], [100, yTop - 30], [xTop + 36, yTop + 32], [xTop + 50, yTop - 34], [100, yTop + 32]];
    let pos = cands.find(p => !hit(p[0], p[1])) || cands[0];
    U.pill(c, hs, pos[0], pos[1], COL.yellow, 22, 'left', true);
    U.pill(c, vs, vx, vy, S.a ? COL.coral : COL.teal, 22);

    /* 右下資訊 */
    const bx = 940;
    U.pill(c, T('海拔 ', 'Altitude ') + S.alt + ' m', bx, 345, COL.white, 22, 'right', true);
    U.pill(c, T('P氣 ＝ ', 'P air = ') + sol.P.toFixed(1) + ' gw/cm²', bx, 392, COL.coral, 22, 'right', true);
    U.pill(c, S.a ? T('P管頂 ＝ ', 'P top = ') + sol.Ptop.toFixed(1) + ' gw/cm²' : T('P管頂 ＝ 0（真空）', 'P top = 0 (vacuum)'), bx, 439, S.a ? COL.coral : COL.teal, 22, 'right', true);
    const len = sol.h / cosT();
    U.pill(c, T('管內長度 ＝ ', 'Tube length = ') + (water ? (len / 100).toFixed(2) + ' m' : len.toFixed(1) + ' cm'), bx, 486, COL.white, 22, 'right', true);
  }

  function result() {
    const L = LIQ[S.liq], sol = solve(), water = S.liq === 'w', h = sol.h, len = h / cosT();
    const f1 = v => v.toFixed(1), fh = v => water ? f1(v) + ' cm（＝ ' + (v / 100).toFixed(2) + ' m）' : f1(v) + ' cm', fhe = v => water ? f1(v) + ' cm (= ' + (v / 100).toFixed(2) + ' m)' : f1(v) + ' cm';
    const cmHg = (sol.P / 13.6).toFixed(1);
    const l1 = `<div><span class="lw-big lw-p">${T('大氣壓 P氣 ＝ ', 'Air pressure P = ')}${f1(sol.P)} gw/cm²</span>` +
      `${T('（海拔 ' + S.alt + ' m；水銀柱換算 ＝ ' + f1(sol.P) + ' ÷ 13.6 ＝ ' + cmHg + ' cmHg）', ' (altitude ' + S.alt + ' m; in mercury terms = ' + f1(sol.P) + ' ÷ 13.6 = ' + cmHg + ' cmHg)')}</div>`;
    const top = S.a
      ? `${T('管頂空氣：混入 ' + S.a + ' 次，P管頂 ＝ ', 'Air at the top: mixed in ' + S.a + ' time(s), P top = ')}<b class="lw-p">${f1(sol.Ptop)} gw/cm²</b>${T('（波以耳定律，示意）', ' (Boyle\'s law, schematic)')}`
      : `${T('管頂是真空：P管頂 ＝ ', 'Vacuum at the top: P top = ')}<b class="lw-c">0</b>`;
    const l2 = `<div>${T('液柱垂直高度 h ＝ (P氣 − P管頂) ÷ D ＝ (' + f1(sol.P) + ' − ' + f1(sol.Ptop) + ') ÷ ' + L.D + ' ＝ ', 'Vertical height h = (P − P top) ÷ D = (' + f1(sol.P) + ' − ' + f1(sol.Ptop) + ') ÷ ' + L.D + ' = ')}<b class="lw-y">${T(fh(h), fhe(h))}</b></div>`;
    const l3 = `<div>${T('管內長度 ＝ h ÷ cosθ ＝ ' + f1(h) + ' ÷ cos ' + S.th + '° ＝ ', 'Length in the tube = h ÷ cosθ = ' + f1(h) + ' ÷ cos ' + S.th + '° = ')}<b class="lw-c">${T(water ? f1(len) + ' cm（＝ ' + (len / 100).toFixed(2) + ' m）' : f1(len) + ' cm', water ? f1(len) + ' cm (= ' + (len / 100).toFixed(2) + ' m)' : f1(len) + ' cm')}</b></div>`;
    return l1 + `<div>${top}</div>` + l2 + l3 +
      `<div style="color:#a3b8b0">${T('傾斜、粗細都不改變 h；有空氣或海拔高，h 變低。', 'Tilting or a wider tube does not change h; air in the tube or a higher altitude lowers h.')}${S.a ? T('（空氣量為示意值）', ' (the amount of air is schematic)') : ''}</div>`;
  }

  M4Lab.make({
    key: 'torr', tab: 'tab2',
    titleZh: '動手做｜托里切利實驗台', titleEn: 'Try it | Torricelli\'s Lab Bench',
    subZh: '管子裝滿液體倒插進槽裡，液柱會掉到某個高度停住。換液體、傾斜、換粗細、爬高山、混入空氣，先預測 h 會怎麼變。', subEn: 'Fill the tube, flip it into the trough, and the column drops to a height and stops. Change the liquid, tilt, width, altitude or air, and predict what h does.',
    tipZh: '「重來」或換液體會讓管子重新裝滿倒插；選清水時畫面拉遠（1 m ＝ 40 px）。', tipEn: '“Restart” or a new liquid refills and flips the tube again; with water the view zooms out (1 m = 40 px).',
    init: () => S,
    controls: () => [
      { kind: 'buttons', items: [
        { id: 'hg', zh: '水銀', en: 'Mercury', on: () => setLiq('hg'), active: () => S.liq === 'hg' },
        { id: 'w', zh: '清水', en: 'Water', on: () => setLiq('w'), active: () => S.liq === 'w' },
        { id: 'thin', zh: '細管', en: 'Thin tube', on: () => { S.thick = 0; }, active: () => !S.thick },
        { id: 'thick', zh: '粗管', en: 'Wide tube', on: () => { S.thick = 1; }, active: () => !!S.thick }
      ] },
      { kind: 'slider', id: 'th', zh: '傾斜角 θ', en: 'Tilt θ', min: 0, max: 60, step: 1, get: () => S.th, set: v => { S.th = v; }, fmt: v => v + '°' },
      { kind: 'slider', id: 'alt', zh: '海拔高度', en: 'Altitude', min: 0, max: 4000, step: 100, get: () => S.alt, set: v => { S.alt = v; }, fmt: v => v + ' m' },
      { kind: 'buttons', items: [
        { id: 'air', zh: '🫧 混入空氣（最多 3 次）', en: '🫧 Let air in (up to 3)', on: addAir, disabled: () => S.a >= 3 },
        { id: 'reset', zh: '↺ 重來', en: '↺ Restart', on: reset }
      ] }
    ],
    step, draw, result,
    snapshot: s => { const o = solve(); return { liq: s.liq, thick: s.thick, th: s.th, alt: s.alt, a: s.a, P: +o.P.toFixed(2), Ptop: +o.Ptop.toFixed(2), h: +o.h.toFixed(2), hd: +s.hd.toFixed(2), len: +(o.h / cosT()).toFixed(2), settled: Math.abs(s.hd - o.h) < 1e-6 }; }
  });
  window.W5Lab.torr.set = function (o) {
    if (o.liq) setLiq(o.liq); if (o.th != null) S.th = o.th; if (o.alt != null) S.alt = o.alt; if (o.a != null) S.a = o.a; if (o.thick != null) S.thick = o.thick;
    window.W5Lab.torr.request();
  };
})();
