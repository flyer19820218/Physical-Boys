/* ==================================================================
   mechanics_4 ｜ 帕斯卡原理：壓力大小不變地傳遞（cvs-transmit，960×540）
   四步：1 密閉容器 → 2 活塞下壓 → 3 每處一樣大 → 4 傳的是壓力
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （沿用 M4.gauge／M4.hand／M4.pArrow／M4.pPill；M4.piston／M4.gaugeLink／M4.pWaves 由本檔新增）。

   數字（照簡報）：小活塞 A ＝ 10 cm²，施力 F ＝ 100 gw → P ＝ 100 ÷ 10 ＝ 10 gw/cm²；
     容器內每一點的壓力「增加」10 gw/cm²（壓力計只顯示增加量 ＋10，不顯示總壓）。
     右壁 3 個堵頭：F ＝ P × A → 10 cm² 100 gw、20 cm² 200 gw、50 cm² 500 gw。
   場景（側視剖面、整支同一個場景）：
     密閉容器內部 x 120～400、y 160～400，壁厚 8；容器裝滿水（沒有自由液面）。
     左上小活塞筒：中線 NX＝200，筒口在頂壁內面 y 160，筒長 50（筒口 → y 110）；活塞內面起初在 y 132，第 2 步下移 4 px（液體幾乎不可壓縮）。
     壓力計（M4.gauge，0～20，每 5 一格；指針 0 → 10 ＝ 增加 10）：左壁下方 (64,350)、底部中央 (260,448)、右壁上方 (456,190)，r 28。
     堵頭（第 4 步）：右壁 y 240／292／360；剖面看到的是直徑，直徑 ∝ √面積：10 cm² → 28 px、20 → 39.6 px、50 → 62.6 px（小活塞也是 28 px）。
   比例尺（整支固定）：
     力（青，M3.force）0.45 px／gw：100 gw ＝ 45 px（手推小活塞、10 cm² 堵頭一樣長）、200 gw ＝ 90 px、500 gw ＝ 225 px。
     壓力（珊瑚，M4.pArrow）4 px／(gw/cm²)：10 gw/cm² ＝ 40 px；壁上的箭頭尖端在被壓的面、朝外；活塞底面的箭頭由底面往下。
   版面：步驟標題 KEY_Y 62；第 1 步名稱／第 2 步起 P 公式 pill 在 (620,108)；結論字卡 BOT_Y 505；標籤 22px、標題／字卡／公式 24px。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.gauge || !M4.piston) return;

  const COL = W5.COL, lerp = W5.lerp;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow, since = M4.since;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PUSH = M4.PC.force, PR = M4.PC.pressure;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */

  /* ── 場景 ── */
  const X0 = 120, X1 = 400, Y0 = 160, Y1 = 400, WL = 8;
  const NX = 200, D10 = 28, NECK = 50, FACE0 = 28, PUSHPX = 4;
  const dia = A => D10 * Math.sqrt(A / 10);
  const GR = 28;
  const GAUGES = [
    { cx: 64, cy: 350, port: [X0 - WL, 350], lab: [64, 404, 'center'] },     /* 左壁下方 */
    { cx: 260, cy: 448, port: [260, Y1 + WL], lab: [300, 448, 'left'] },     /* 底部中央 */
    { cx: 456, cy: 190, port: [X1 + WL, 190], lab: [500, 190, 'left'] }      /* 右壁上方 */
  ];
  const PLUGS = [{ A: 10, y: 240 }, { A: 20, y: 292 }, { A: 50, y: 360 }];
  const PLUG_TH = 18, PLUG_LEN = 22;
  const FK = 0.45, F_PUSH = 100, PRESS = 10, PK = 4;
  const FX = X1 + PLUG_TH + 2;                       /* 堵頭受力箭頭起點 x（堵頭外面） */
  const FORM_X = 620, FORM_Y = M3.Q_Y;

  /* ── 狀態（純函式） ── */
  const sceneA = s => (s.n === 1 ? fin(s, 1, 0.2, 1.0) : 1);
  const pushK = s => grow(s, 2, 1.6, 2.2);                    /* 活塞下移 0..1 */
  const faceY = s => Y0 - FACE0 + PUSHPX * pushK(s);
  const needle = s => grow(s, 3, 0.6, 2.2);                   /* 壓力計 0 → 1（＝＋10） */
  const plugA = s => (s.n === 4 ? fin(s, 4, 0.3, 0.8) : 0);

  /* 容器內部（含小活塞筒裡的水）當成剪裁路徑 */
  function interior(c, s) {
    c.rect(X0, Y0, X1 - X0, Y1 - Y0);
    const fy = faceY(s); c.rect(NX - D10 / 2, fy, D10, Y0 - fy + 1);
  }

  /* ═══════════ 容器 ═══════════ */
  function container(c, s, a) {
    withA(c, a, () => {
      c.save();
      /* 水（裝滿） */
      const g = c.createLinearGradient(0, Y0, 0, Y1);
      g.addColorStop(0, W5.rgba(M4.PC.water, 0.42)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
      c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      /* 器壁（外框 − 內框） */
      const wg = c.createLinearGradient(0, Y0 - WL, 0, Y1 + WL);
      wg.addColorStop(0, '#cfd8de'); wg.addColorStop(1, '#8b99a3');
      c.fillStyle = wg; c.beginPath();
      W5.rr(c, X0 - WL, Y0 - WL, X1 - X0 + 2 * WL, Y1 - Y0 + 2 * WL, 6);
      c.rect(X0, Y0, X1 - X0, Y1 - Y0);
      c.fill('evenodd');
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
      c.strokeRect(X0 - 0.5, Y0 - 0.5, X1 - X0 + 1, Y1 - Y0 + 1);
      /* 開口：小活塞筒、壓力計接口（壁裡也是水） */
      c.fillStyle = W5.rgba(M4.PC.water, 0.5);
      c.fillRect(NX - D10 / 2, Y0 - WL - 1, D10, WL + 2);
      GAUGES.forEach(G => {
        const [px, py] = G.port;
        if (py === Y1 + WL) c.fillRect(px - 3, Y1, 6, WL); else c.fillRect(px > X1 ? X1 : X0 - WL, py - 3, WL, 6);
      });
      c.restore();
    });
  }

  /* 小活塞（＋第 2 步起的手與施力箭頭） */
  function smallPiston(c, s, a) {
    const pos = FACE0 - PUSHPX * pushK(s);
    const r = M4.piston(c, NX, Y0, { dir: 'up', w: D10, len: NECK, pos, th: 14, rod: 22, handle: 64, wall: 6, a });
    const palm = r.out[1];
    /* 手：第 2 步淡入、從上方 40 px 降下來貼住把手，之後一直壓著 */
    const ha = s.n === 1 ? 0 : s.n === 2 ? fin(s, 2, 0.2, 0.6) : 1;
    const gap = 40 * (1 - grow(s, 2, 0.6, 1.6));
    M4.hand(c, NX, palm - gap, { dir: 'right', armTop: 32, a: ha });
    /* 施力 100 gw（青，尖端在掌心＝把手頂面） */
    const fg = grow(s, 2, 1.6, 2.4);
    if (fg > 0.005) M3.forceInto(c, { x: NX, y: palm, dir: 'down', val: F_PUSH, k: FK, col: PUSH, grow: fg, lw: 7,
      text: L('F ＝ 100 gw', 'F = 100 gw'), lab: 'left', la: fin(s, 2, 2.2, 0.5), dx: -18 });
    /* 小活塞面積標籤 */
    T(c, fin(s, 1, 1.8, 0.5), L('小活塞 10 cm²', 'Small piston 10 cm²'), NX + D10 / 2 + 22, Y0 - FACE0 - 6, WHITE, 22, 'left');
    return r;
  }

  /* 三個壓力計（＋導管、讀數） */
  function gauges(c, s) {
    const a = s.n === 1 ? fin(s, 1, 1.0, 0.8) : 1;
    const v = PRESS * needle(s);
    const hg = s.n === 3 ? fin(s, 3, 0.4, 0.4) * fout(s, 3, 3.2, 1.0) : 0;
    GAUGES.forEach(G => {
      const [px, py] = G.port;
      if (py === Y1 + WL) M4.gaugeLink(c, px, py, G.cx, G.cy - GR - 4, { a });
      else M4.gaugeLink(c, px, py, G.cx + (px < G.cx ? -GR - 4 : GR + 4), G.cy, { a });
      if (hg * a > 0.02) W5.glow(c, G.cx, G.cy, 80, PR, 0.22 * hg * a);
      M4.gauge(c, G.cx, G.cy, GR, { min: 0, max: 20, val: v, ticks: 5, a });
      const [lx, ly, al] = G.lab;
      T(c, a * fin(s, 1, 2.2, 0.5) * fout(s, 3, 1.4, 0.4), '0', lx + (al === 'left' ? 8 : 0), ly, WHITE, 22, al, true);
      M4.pPill(c, fin(s, 3, 1.9, 0.5), '＋10', lx, ly, 22, al);
    });
    /* 「壓力計」名稱（第 1、2 步） */
    T(c, fin(s, 1, 2.2, 0.5) * fout(s, 3, 0, 0.5), L('壓力計', 'Gauge'), GAUGES[0].cx, GAUGES[0].cy - GR - 22, DIM, 22);
  }

  /* 第 2 步：壓力從活塞底面一圈一圈往外擴散 */
  function waves(c, s) {
    if (s.n !== 2) return;
    const fy = faceY(s);
    M4.pWaves(c, NX, fy, since(s, 2, 2.6), { clip: cc => interior(cc, s), dur: 4.0, gap: 0.55, speed: 170, rMax: 420,
      ang: [-0.3, Math.PI + 0.3], n: 9, len: 18, a: fout(s, 2, 9.6, 0.8) });
  }

  /* 壓力箭頭（珊瑚，10 gw/cm² ＝ 40 px） */
  function pressureArrows(c, s) {
    const L10 = PRESS * PK;
    /* 每個壁面一支、等長、尖端朝外（第 3 步） */
    const wg = grow(s, 3, 2.6, 3.6), dim = s.n === 4 ? lerp(1, 0.45, fin(s, 4, 0.4, 0.6)) : 1;
    if (wg > 0.01) {
      M4.pArrow(c, X0, 262, L10 * wg, { dir: 'left', lw: 6, a: dim });
      M4.pArrow(c, 320, Y0, L10 * wg, { dir: 'up', lw: 6, a: dim });
      M4.pArrow(c, 190, Y1, L10 * wg, { dir: 'down', lw: 6, a: dim });
      M4.pArrow(c, X1, PLUGS[1].y, L10 * wg, { dir: 'right', lw: 6 });
    }
    /* 第 4 步：另外兩個堵頭內面也各一支（20 cm² 那支就是第 3 步右壁那支） */
    const pg = grow(s, 4, 1.0, 1.8);
    if (pg > 0.01) [PLUGS[0], PLUGS[2]].forEach(p => M4.pArrow(c, X1, p.y, L10 * pg, { dir: 'right', lw: 6 }));
  }

  /* 活塞底面 → 水（第 2 步起；畫在活塞筒之後，筒裡的水才不會蓋住箭身） */
  function faceArrow(c, s) {
    const L10 = PRESS * PK, fg = grow(s, 2, 2.2, 2.8);
    if (fg > 0.01) M4.pArrow(c, NX, faceY(s) + L10 * fg, L10 * fg, { dir: 'down', lw: 6 });
  }

  /* 第 4 步：右壁 3 個堵頭＋受力 F ＝ P × A */
  function plugs(c, s) {
    const a = plugA(s); if (a <= 0.02) return;
    PLUGS.forEach(p => {
      const d = dia(p.A);
      /* 壁上開洞（水接到堵頭內面） */
      withA(c, a, () => { c.save(); c.fillStyle = W5.rgba(M4.PC.water, 0.5); c.fillRect(X1, p.y - d / 2, WL, d); c.restore(); });
      M4.piston(c, X1, p.y, { dir: 'right', w: d, len: PLUG_LEN, pos: 0, th: PLUG_TH, wall: 6, a });
    });
    const la = fin(s, 4, 1.6, 0.5);
    PLUGS.forEach(p => T(c, la, p.A + ' cm²', X1 - PRESS * PK - 10, p.y, WHITE, 22, 'right'));
    const T0 = [2.6, 3.6, 4.6];
    PLUGS.forEach((p, i) => {
      const F = PRESS * p.A, g = grow(s, 4, T0[i], T0[i] + 0.6 + 0.3 * i);
      if (g <= 0.005) return;
      M3.force(c, { x: FX, y: p.y, dir: 'right', val: F, k: FK, col: PUSH, grow: g, lw: 7,
        text: 'F ＝ 10 × ' + p.A + ' ＝ ' + F + ' gw', lab: 'tip', la: fin(s, 4, T0[i] + 0.7 + 0.3 * i, 0.4) });
    });
    P(c, fin(s, 4, 2.0, 0.5), 'F ＝ P × A', 770, 190, YEL, 24);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('密閉容器', 'A sealed container'),
    () => L('活塞下壓', 'Push the piston'),
    () => L('每處一樣大', 'Equal everywhere'),
    () => L('傳的是壓力', 'Pressure, not force')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    T(c, fin(s, 1, 2.6, 0.6) * fout(s, 2, 0, 0.5), L('密閉容器（裝滿液體）', 'Sealed container (full of liquid)'), 670, FORM_Y, WHITE, 24);
    const fa = fin(s, 2, 4.0, 0.6);
    if (fa > 0.02) W5.glow(c, FORM_X, FORM_Y, 180, YEL, 0.10 * fa);
    P(c, fa, 'P ＝ 100 ÷ 10 ＝ 10 gw/cm²', FORM_X, FORM_Y, YEL, 24);
    M3.caption(c, fin(s, 3, 4.4, 0.6) * fout(s, 4, 0, 0.4), L('壓力大小不變地傳到每一個角落', 'Pressure reaches every corner, undiminished'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 6.6, 0.6), L('傳遞的是壓力，不是力：面積越大，力越大', 'Pressure passes on, not force: bigger area, bigger force'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a = sceneA(s);
    M3.backdrop(c, { gy: 532, cell: 40 });
    gauges(c, s);
    container(c, s, a);
    waves(c, s);
    pressureArrows(c, s);
    plugs(c, s);
    smallPiston(c, s, a);
    faceArrow(c, s);
    texts(c, s);
  }

  W5.register('transmit', { canvas: 'cvs-transmit', steps: DUR, draw });
})();
