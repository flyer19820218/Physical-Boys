/* ==================================================================
   mechanics_4 ｜ 連通管的生活應用（cvs-app，960×540）
   四步：1 熱水瓶水位窗 → 2 茶壺 → 3 水塔供水 → 4 水塔太低
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3 與 M4
   （沿用 M4.connected／M4.faucet／M4.tank／M4.pour／M4.trough；M4.pipe／M4.levelDash／M4.okMark 由本檔新增）。

   這支每一步是不同的生活場景 → 換場用 crossfade：第 1、2、3 步開頭 XF 秒內，上一步「結尾畫面」淡出、本步場景淡入
   （第 4 步承接第 3 步同一場景，不換場；第 1 步接第 4 步結尾）。各步的文字在該步結尾前先淡出，換場時只有圖在交疊。
   每個場景都用「同一水平的水藍虛線（M4.levelDash）＋兩邊水面」突顯連通管原理。數字：簡報沒有數字 → 畫面不標數值。

   第 1 步 熱水瓶（GY 452）：外殼 296～544、內膽內壁 332～488（金屬）、水位窗細管中線 512（玻璃）；
       內膽與細管由底部的管（管內 414～428）相通（M4.connected）；水面 236 → 356（3.0～8.6 秒連續下降），兩邊同一個水面。
   第 2 步 茶壺（GY 430）：兩把玻璃茶壺（同一壺身），中線 230／690；左壺嘴口 212（高於壺口 240）、右壺嘴口 300（低於壺口）；
       兩個水龍頭同時注水（水面 380 → 262 等速上升，1.5～7.0 秒）；右壺水面到嘴口 300 就停住、水從壺嘴溢出到桌上。
   第 3、4 步 水塔（GY 430）：水塔內壁 54～190、底 238；地下水管 y 466；三棟房子的水龍頭出水口：
       低（平房）395、中（三層）282、最高（五層）186；水塔水面第 3 步 118（高於三個水龍頭）→ 第 4 步 1.0～6.0 秒降到 214
       （低於最高那棟的水龍頭、仍高於另外兩棟）。出水柱寬 ∝ √（水面到水龍頭本體的落差），水面低於水龍頭本體就不出水；
       最高那棟的立管裡水面跟水塔一樣高（連通管），上面是空氣。
   版面：步驟標題 KEY_Y 62；結論字卡 BOT_Y 505；標籤 22px、標題／字卡 24px。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || !M4.connected || !M4.pipe) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, EDGE = M4.PC.waterEdge;
  const DUR = [11, 11, 11, 12];        /* 總長 45 秒 */
  const XF = 0.9;                      /* crossfade 秒數 */
  const TAU = Math.PI * 2;

  /* 小工具：引線（線＋小圓點） */
  function leader(c, a, x0, y0, x1, y1, col) {
    withA(c, a, () => {
      c.save(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(x1, y1, 3.5, 0, TAU); c.fill(); c.restore();
    });
  }
  /* 文字淡出：該步結尾前 0.6 秒（換場前先收字） */
  const textOut = s => (s.n === 3 ? 1 : 1 - ease(clamp01((s.u - (s.d - 0.7)) / 0.5)));

  /* ═══════════ 第 1 步：熱水瓶 ═══════════ */
  const T1 = { GY: 452, SX0: 296, SX1: 562, STOP: 176, SBOT: 444, LX0: 332, LX1: 488, LTOP: 200, TX: 532, TR: 6, PT: 414, FL: 428, LV0: 236, LV1: 356, D0: 3.0, D1: 8.6 };
  const lv1 = s => lerp(T1.LV0, T1.LV1, ease(seg(s.u, T1.D0, T1.D1)));

  function thermos(c, s) {
    const g = T1, t = s.t, lv = lv1(s);
    M3.backdrop(c, { gy: g.GY, cell: 40 }); M3.ground(c, g.GY);
    c.save(); c.lineJoin = 'round';
    /* 影子、底座 */
    c.fillStyle = 'rgba(11,26,21,0.4)'; c.beginPath(); c.ellipse(429, g.GY + 2, 148, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#9a917f'; W5.rr(c, 308, g.SBOT - 4, 242, g.GY - g.SBOT + 4, 5); c.fill();
    /* 外殼（剖面）：奶油色塑膠 */
    const sg = c.createLinearGradient(g.SX0, 0, g.SX1, 0);
    sg.addColorStop(0, '#f2ead8'); sg.addColorStop(0.5, '#e3d9c2'); sg.addColorStop(1, '#bfb49c');
    c.fillStyle = sg; W5.rr(c, g.SX0, g.STOP, g.SX1 - g.SX0, g.SBOT - g.STOP, 16); c.fill();
    c.strokeStyle = 'rgba(255,250,235,0.7)'; c.lineWidth = 1.5; c.stroke();
    /* 剖開的內部（隔熱空間） */
    c.fillStyle = '#0f2620'; W5.rr(c, g.SX0 + 14, g.STOP + 12, g.SX1 - g.SX0 - 28, g.SBOT - g.STOP - 20, 8); c.fill();
    /* 右側外殼上的透明視窗 */
    c.fillStyle = 'rgba(190,230,245,0.22)'; c.fillRect(g.SX1 - 14, 206, 14, 214);
    c.strokeStyle = 'rgba(232,246,255,0.8)'; c.lineWidth = 1.5; c.strokeRect(g.SX1 - 14, 206, 14, 214);
    /* 出水口（左上）：從殼伸出、口朝下 */
    c.fillStyle = '#cfc5ae'; c.strokeStyle = 'rgba(11,26,21,0.5)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(g.SX0 + 2, 192); c.lineTo(262, 192); c.quadraticCurveTo(252, 192, 252, 202); c.lineTo(252, 226); c.lineTo(266, 226); c.lineTo(266, 206); c.lineTo(g.SX0 + 2, 206); c.closePath(); c.fill(); c.stroke();
    /* 蓋子（圓頂）＋按壓鈕＋提把 */
    c.strokeStyle = '#9a917f'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(330, 168); c.bezierCurveTo(330, 96, 528, 96, 528, 168); c.stroke();
    const lg = c.createLinearGradient(0, 138, 0, 178); lg.addColorStop(0, '#f6f0e2'); lg.addColorStop(1, '#cbbfa5');
    c.fillStyle = lg; c.strokeStyle = 'rgba(11,26,21,0.45)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(g.SX0 - 4, g.STOP + 4); c.quadraticCurveTo(g.SX0, 138, 429, 136); c.quadraticCurveTo(g.SX1, 138, g.SX1 + 4, g.STOP + 4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5d6f96'; W5.rr(c, 407, 122, 44, 16, 6); c.fill();
    c.restore();

    /* 內膽＋水位窗細管：底部相通（M4.connected） */
    const pg = fin(s, 1, 1.8, 0.6) * (1 - 0.7 * fin(s, 1, 5.8, 1.0));
    const res = M4.connected(c, {
      floor: g.FL, pipeTop: g.PT, px0: g.LX0, px1: g.TX + g.TR, wall: 6, t, glow: 0.35, pipeGlow: pg,
      vessels: [{ pts: [[g.PT, g.LX0, g.LX1], [g.LTOP, g.LX0, g.LX1]], level: lv },
        { pts: [[g.PT, g.TX - g.TR, g.TX + g.TR], [g.LTOP + 4, g.TX - g.TR, g.TX + g.TR]], level: lv }]
    });
    /* 內膽是不鏽鋼：把內膽的壁改畫成金屬 */
    c.save();
    const mg = c.createLinearGradient(0, g.LTOP, 0, g.FL); mg.addColorStop(0, '#e6edf1'); mg.addColorStop(1, '#93a2ac');
    c.fillStyle = mg;
    c.fillRect(g.LX0 - 6, g.LTOP - 2, 6, g.FL - g.LTOP + 8);
    c.fillRect(g.LX1, g.LTOP - 2, 6, g.PT - g.LTOP - 4);
    c.fillRect(g.LX0 - 6, g.FL, g.LX1 - g.LX0 + 12, 6);
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(g.LX0 - 5, g.LTOP); c.lineTo(g.LX0 - 5, g.FL + 5); c.stroke();
    c.restore();
    /* 細管裡的水太細看不清：再疊一層較濃的水色 */
    c.save(); c.fillStyle = W5.rgba(M4.PC.water, 0.55); c.fillRect(g.TX - g.TR, lv, 2 * g.TR, g.FL - lv); c.restore();
    /* 管裡流動的亮點（強調「通」） */
    if (pg > 0.02) withA(c, pg, () => {
      c.save(); c.strokeStyle = 'rgba(205,236,255,0.9)'; c.lineWidth = 3; c.lineCap = 'round';
      c.setLineDash([10, 14]); c.lineDashOffset = -(s.u * 50) % 24;
      c.beginPath(); c.moveTo(g.LX0 + 8, (g.FL + g.PT) / 2); c.lineTo(g.TX, (g.FL + g.PT) / 2); c.stroke(); c.restore();
    });

    /* 同一水平虛線：從內膽穿過細管 */
    const ly = res.vessels[0].level;
    M4.levelDash(c, g.LX0 - 16, 680, ly, { g: grow(s, 1, 2.4, 3.8) });
    /* 水面下降（運動）：虛線箭頭 */
    const ma = fin(s, 1, g.D0 + 0.2, 0.5) * fout(s, 1, g.D1 - 0.5, 0.5);
    M3.dashArrow(c, 410, ly + 12, 410, ly + 56, WHITE, ma * 0.9, s.t * 40, { lw: 3, head: 12, dash: [8, 7] });
    M3.dashArrow(c, 596, ly + 12, 596, ly + 56, WHITE, ma * 0.9, s.t * 40, { lw: 3, head: 12, dash: [8, 7] });

    /* 標籤 */
    const ta = textOut(s);
    const la = fin(s, 1, 1.0, 0.5) * ta;
    const w1 = T(c, la, L('內膽', 'Inner pot'), 272, 322, WHITE, 22, 'right');
    leader(c, la, 280, 322, g.LX0 - 8, 322, WHITE);
    T(c, la, L('水位窗', 'Gauge tube'), 612, 400, EDGE, 22, 'left');
    leader(c, la, 604, 400, g.TX + g.TR + 4, 400, EDGE);
    const pa = fin(s, 1, 1.8, 0.5) * fout(s, 1, 5.6, 0.5);
    if (pa > 0.02) {
      withA(c, pa, () => W5.arrow(c, 429, 468, 429, g.FL + 2, EDGE, 2.5, 10));
      P(c, pa, L('底部相通', 'Joined at the bottom'), 429, 488, EDGE, 22);
    }
    return w1;
  }

  /* ═══════════ 第 2 步：茶壺 ═══════════ */
  const T2 = { GY: 430, FL: 418, PT: 402, TOP: 240, CX: [230, 690], TIP: [212, 300], LV0: 380, LV1: 262, F0: 1.5, F1: 7.0, OUT_Y: 170 };
  const potPts = cx => [[T2.PT, cx - 74, cx + 74], [T2.PT - 30, cx - 90, cx + 90], [T2.PT - 100, cx - 90, cx + 90], [T2.PT - 150, cx - 66, cx + 66], [T2.TOP, cx - 50, cx + 50]];
  const spoutPts = (cx, tip) => {
    const top = [tip, cx + 108 + (T2.PT - 40 - tip) * 0.38 - 7, cx + 108 + (T2.PT - 40 - tip) * 0.38 + 7];
    return [[T2.PT, cx + 98, cx + 118], [T2.PT - 40, cx + 108, cx + 126], top];
  };
  const fill2 = s => lerp(T2.LV0, T2.LV1, seg(s.u, T2.F0, T2.F1));       /* 等速注水 */
  const SPILL0 = T2.F0 + (T2.F1 - T2.F0) * (T2.LV0 - T2.TIP[1]) / (T2.LV0 - T2.LV1);  /* 右壺水面到嘴口的時刻 */

  function teapot(c, s, i) {
    const cx = T2.CX[i], tip = T2.TIP[i], t = s.t;
    const want = fill2(s), lv = Math.max(want, tip);
    const sp = spoutPts(cx, tip);
    /* 把手（左側）與底座 */
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(169,198,211,0.9)'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(cx - 92, 268); c.bezierCurveTo(cx - 160, 262, cx - 160, 372, cx - 94, 370); c.stroke();
    c.strokeStyle = 'rgba(240,250,255,0.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - 92, 264); c.bezierCurveTo(cx - 162, 256, cx - 162, 376, cx - 94, 375); c.stroke();
    c.fillStyle = '#a9c6d3'; W5.rr(c, cx - 70, T2.FL + 6, 140, T2.GY - T2.FL - 6, 3); c.fill();
    c.fillStyle = 'rgba(11,26,21,0.4)'; c.beginPath(); c.ellipse(cx + 10, T2.GY + 2, 150, 5, 0, 0, TAU); c.fill();
    c.restore();
    const res = M4.connected(c, {
      floor: T2.FL, pipeTop: T2.PT, px0: cx - 74, px1: cx + 118, wall: 6, t: t + i * 0.37, glow: 0.3,
      wob: 1.4 + 1.0 * clamp01((s.u - T2.F0) / 0.4) * (1 - clamp01((s.u - T2.F1) / 1.5)),
      vessels: [{ pts: potPts(cx), level: lv }, { pts: sp, level: lv }]
    });
    /* 同一水平虛線（穿過壺身與壺嘴） */
    M4.levelDash(c, cx - 112, cx + 212, res.vessels[0].level, { g: grow(s, 2, 1.6, 3.0) });
    return { lv: res.vessels[0].level, sp };
  }
  function teapots(c, s) {
    const g = T2;
    M3.backdrop(c, { gy: g.GY, cell: 40 }); M3.ground(c, g.GY);
    /* 右壺：溢出的水落到桌上（在壺之前畫，水柱從嘴口外側落下） */
    const cx = g.CX[1], tipX = cx + 108 + (g.PT - 40 - g.TIP[1]) * 0.38 + 7;
    const spillOn = seg(s.u, SPILL0, SPILL0 + 0.3) * (1 - seg(s.u, g.F1 + 0.1, g.F1 + 0.6));
    const puddle = ease(seg(s.u, SPILL0 + 0.3, g.F1 + 0.6));
    if (puddle > 0.02) withA(c, 1, () => {
      c.save(); c.fillStyle = W5.rgba(M4.PC.water, 0.55); c.beginPath(); c.ellipse(tipX + 22, g.GY + 1, 14 + 34 * puddle, 3 + 2 * puddle, 0, 0, TAU); c.fill();
      c.strokeStyle = W5.rgba(EDGE, 0.8); c.lineWidth = 1.5; c.stroke(); c.restore();
    });
    teapot(c, s, 0);
    teapot(c, s, 1);
    if (spillOn > 0.02) {
      withA(c, spillOn, () => {
        c.save(); c.strokeStyle = W5.rgba(M4.PC.water, 0.9); c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(tipX - 6, g.TIP[1] - 2); c.quadraticCurveTo(tipX + 14, g.TIP[1] - 6, tipX + 20, g.TIP[1] + 20); c.stroke();
        c.restore();
      });
      M4.pour(c, tipX + 21, g.TIP[1] + 18, g.GY - 2, { t: s.t, w: 7, a: spillOn, rw: 16 });
    }
    /* 注水：兩個水龍頭 */
    const open = ease(seg(s.u, g.F0 - 0.5, g.F0 - 0.1)) * (1 - ease(seg(s.u, g.F1 - 0.2, g.F1 + 0.2)));
    g.CX.forEach((cx2, i) => {
      const x = cx2 - 12;
      M4.faucet(c, x, g.OUT_Y, { dir: -1, len: 100, open });
      const yHit = Math.max(fill2(s), g.TIP[i]);
      const head = lerp(g.OUT_Y, yHit, clamp01((s.u - g.F0) / 0.2));
      const tail = lerp(g.OUT_Y, yHit, clamp01((s.u - g.F1) / 0.2));
      if (s.u > g.F0 && head - tail > 2) M4.pour(c, x, tail, head, { t: s.t + i * 0.3, w: 8, splash: s.u > g.F0 + 0.2, rw: 14 });
    });
    /* 標籤 */
    const ta = textOut(s);
    const sa = fin(s, 2, SPILL0 + 0.4, 0.5) * ta;
    T(c, sa, L('溢出來了！', 'It spills!'), tipX + 18, g.TIP[1] - 40, EDGE, 22);
    T(c, fin(s, 2, 7.4, 0.5) * ta, L('壺嘴夠高：裝得滿', 'Spout high: fills up'), g.CX[0] + 20, 466, WHITE, 22);
    T(c, fin(s, 2, 7.4, 0.5) * ta, L('壺嘴太低：裝不滿', 'Spout low: can’t fill'), g.CX[1] + 20, 466, WHITE, 22);
  }

  /* ═══════════ 第 3、4 步：水塔 ═══════════ */
  const T3 = { GY: 430, PY: 466, TX0: 54, TX1: 190, TBOT: 238, TTOP: 100, OX: 122, LV3: 118, LV4: 214, D0: 1.0, D1: 6.0 };
  /* 三棟：x0,x1 外牆、層數、層高、立管 x、出水口 (fx, fy)、出水口直管長 drop */
  const HOUSES = [
    { x0: 280, x1: 410, n: 1, fh: 80, roof: 'gable', rx: 300, fx: 362, fy: 395, drop: 26 },
    { x0: 452, x1: 600, n: 3, fh: 60, roof: 'flat', rx: 472, fx: 534, fy: 282, drop: 20 },
    { x0: 672, x1: 830, n: 5, fh: 56, roof: 'flat', rx: 692, fx: 754, fy: 186, drop: 16 }
  ];
  const lv3 = s => (s.n === 4 ? lerp(T3.LV3, T3.LV4, ease(seg(s.u, T3.D0, T3.D1))) : T3.LV3);
  const flowOf = (h, lv) => { const head = (h.fy - h.drop) - lv; return head > 0 ? Math.sqrt(head) : 0; };

  function house(c, h) {
    const gy = T3.GY, top = gy - h.n * h.fh;
    c.save(); c.lineJoin = 'round';
    /* 剖面：外牆＋內部 */
    c.fillStyle = '#8d9aa0'; c.fillRect(h.x0, top, h.x1 - h.x0, gy - top);
    c.fillStyle = '#132c25'; c.fillRect(h.x0 + 6, top + 6, h.x1 - h.x0 - 12, gy - top - 6);
    /* 後牆上的窗（淡） */
    for (let k = 0; k < h.n; k++) {
      const fy0 = gy - (k + 1) * h.fh;
      c.fillStyle = 'rgba(255,224,102,0.10)'; c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 1.5;
      const wx = h.x1 - 42, wy = fy0 + h.fh * 0.25;
      c.fillRect(wx, wy, 26, h.fh * 0.4); c.strokeRect(wx, wy, 26, h.fh * 0.4);
      /* 樓板 */
      if (k > 0) { c.fillStyle = '#8d9aa0'; c.fillRect(h.x0 + 6, gy - k * h.fh - 3, h.x1 - h.x0 - 12, 6); }
    }
    /* 屋頂 */
    if (h.roof === 'gable') {
      c.fillStyle = '#b5604a'; c.strokeStyle = 'rgba(11,26,21,0.5)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(h.x0 - 12, top + 2); c.lineTo((h.x0 + h.x1) / 2, top - 38); c.lineTo(h.x1 + 12, top + 2); c.closePath(); c.fill(); c.stroke();
    } else {
      c.fillStyle = '#a7b3b8'; c.fillRect(h.x0 - 4, top - 6, h.x1 - h.x0 + 8, 8);
    }
    c.restore();
  }
  function tower(c, s, lv) {
    const g = T3;
    /* 支架 */
    c.save(); c.strokeStyle = '#6d7a80'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(66, g.TBOT + 6); c.lineTo(48, g.GY); c.moveTo(178, g.TBOT + 6); c.lineTo(196, g.GY); c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#5b676c';
    c.beginPath();
    [[g.TBOT + 6, 300], [300, 365], [365, g.GY]].forEach(([ya, yb]) => {
      const xa = lerp(66, 48, (ya - g.TBOT - 6) / (g.GY - g.TBOT - 6)), xb = lerp(178, 196, (yb - g.TBOT - 6) / (g.GY - g.TBOT - 6));
      const xa2 = lerp(66, 48, (yb - g.TBOT - 6) / (g.GY - g.TBOT - 6)), xb2 = lerp(178, 196, (ya - g.TBOT - 6) / (g.GY - g.TBOT - 6));
      c.moveTo(xa, ya); c.lineTo(xb, yb); c.moveTo(xb2, ya); c.lineTo(xa2, yb);
      c.moveTo(xa2, yb); c.lineTo(xb, yb);
    });
    c.stroke(); c.restore();
    /* 水塔（剖面）＋屋頂 */
    M4.tank(c, { x0: g.TX0, x1: g.TX1, bot: g.TBOT, top: g.TTOP, level: lv, t: s.t, glow: 0.4 });
    c.save(); c.fillStyle = '#8b99a3'; c.strokeStyle = 'rgba(11,26,21,0.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(g.TX0 - 16, g.TTOP - 2); c.lineTo((g.TX0 + g.TX1) / 2, g.TTOP - 30); c.lineTo(g.TX1 + 16, g.TTOP - 2); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  function towerScene(c, s) {
    const g = T3, lv = lv3(s), t = s.t;
    M3.backdrop(c, { gy: g.GY, cell: 40 }); M3.ground(c, g.GY);
    HOUSES.forEach(h => house(c, h));
    /* 接水槽（每個水龍頭下面，在該層樓板上） */
    HOUSES.forEach(h => M4.trough(c, h.fx - 26, h.fx + 26, g.GY - (h.n - 1) * h.fh - (h.n > 1 ? 3 : 0), { h: 18 }));
    tower(c, s, lv);
    /* 水管網：水塔 → 地下 → 三支立管；最高那棟的立管水面＝水塔水面 */
    const opened = s.n === 4 ? 1 : seg(s.u, 0.9, 1.3);
    const flows = HOUSES.map(h => flowOf(h, lv));
    const lines = [{ pts: [[g.OX, g.TBOT + 4], [g.OX, g.PY], [HOUSES[2].rx, g.PY]], flow: opened > 0.5 }];
    HOUSES.forEach((h, i) => {
      const bodyY = h.fy - h.drop;
      lines.push({ pts: [[h.rx, g.PY], [h.rx, bodyY]], wetTop: lv > bodyY ? lv : null, flow: opened > 0.5 && flows[i] > 0.6 });
    });
    M4.pipe(c, lines, { r: 5, wall: 4, t });
    /* 水塔出水口與管的接縫補水色 */
    c.save(); c.fillStyle = W5.rgba(M4.PC.water, 0.85); c.fillRect(g.OX - 5, g.TBOT - 2, 10, 14); c.restore();
    /* 最高那棟：立管上段的空氣 */
    const h2 = HOUSES[2], b2 = h2.fy - h2.drop;
    if (lv > b2 + 6) M4.airDots(c, h2.rx - 3, b2 + 6, h2.rx + 3, lv - 4, { n: Math.max(1, Math.floor((lv - b2) / 12)), cols: 1, r: 2.2, t, seed: 31 });

    /* 水龍頭＋出水 */
    HOUSES.forEach((h, i) => {
      const open = s.n === 4 ? 1 : ease(seg(s.u, 0.6, 1.0));
      M4.faucet(c, h.fx, h.fy, { dir: -1, len: h.fx - h.rx + 9, open, drop: h.drop });
      const f = flows[i], floorY = g.GY - (h.n - 1) * h.fh - (h.n > 1 ? 3 : 0) - 8;
      const on = (s.n === 4 ? 1 : clamp01((s.u - 1.1 - 0.15 * i) / 0.2)) * clamp01(f / 2.5);
      if (on > 0.02) M4.pour(c, h.fx, h.fy, floorY, { t: t + i * 0.4, w: Math.max(3, 0.55 * f), a: on, rw: 12 });
    });
    /* 水塔水位的水平虛線＋標籤 */
    M4.levelDash(c, g.TX0, 900, lv, { g: grow(s, 3, 2.0, 4.0) });
    const la = fin(s, 3, 3.6, 0.5) * textOut(s);
    T(c, la, L('水塔水位', 'Tower level'), 206, lv - 20, EDGE, 22, 'left');
    /* 打勾：出水口在虛線以下 → 有水 */
    HOUSES.forEach((h, i) => {
      const ma = fin(s, 3, 4.4 + 0.4 * i, 0.4);
      const ok = flows[i] > 0.6;
      M4.okMark(c, h.fx + 44, h.fy + 2, ok, { a: ma });
    });
    /* 第 4 步：最高那棟沒水 */
    const na = s.n === 4 ? seg(s.u, 4.4, 4.9) * (1 - ease(clamp01((s.u - (s.d - 0.7)) / 0.5))) : 0;
    T(c, na, L('沒水', 'No water'), h2.x1 + 14, h2.fy - 30, COL.red, 22, 'left');
  }

  /* ═══════════ 場景表、文字 ═══════════ */
  const SCENES = [thermos, teapots, towerScene, towerScene];
  const TITLES = [
    () => L('熱水瓶的水位窗', 'The water gauge on a thermos'),
    () => L('茶壺：壺嘴要多高？', 'Teapots: how high is the spout?'),
    () => L('水塔供水', 'A water tower supplies the homes'),
    () => L('水塔的水位太低了', 'The tower’s water runs low')
  ];
  function texts(c, s) {
    const n = s.n, ta = textOut(s);
    P(c, fin(s, n, 0.3, 0.5) * (n === 3 ? 1 - ease(clamp01((s.u - (s.d - 0.5)) / 0.4)) : ta), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 6.6, 0.6) * ta * (s.n === 1 ? 1 : 0), L('視窗水位 ＝ 瓶內水位', 'Level in the tube = level in the pot'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * ta * (s.n === 2 ? 1 : 0), L('壺嘴不能比水面低', 'The spout can’t be lower than the water'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 6.4, 0.6) * fout(s, 4, 0, 0.5), L('水塔水位 ＞ 水龍頭高度 → 出水', 'Tower level > tap height → water flows'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 6.8, 0.6) * ta * (s.n === 4 ? 1 : 0), L('水塔比水龍頭低 → 沒水', 'Tower lower than the tap → no water'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const n = s.n;
    if (n !== 4 && s.u < XF) {
      /* crossfade：上一步的結尾畫面（不含字）淡出 */
      const pn = s.prev, pd = DUR[pn - 1];
      const ps = { n: pn, N: s.N, t: s.t, u: pd, d: pd, p: 1, k: 1, prev: pn === 1 ? s.N : pn - 1 };
      const e = ease(s.u / XF);
      withA(c, 1 - e, () => SCENES[pn - 1](c, ps));
      withA(c, e, () => SCENES[n - 1](c, s));
    } else SCENES[n - 1](c, s);
    texts(c, s);
  }

  W5.register('app', { canvas: 'cvs-app', steps: DUR, draw });
})();
