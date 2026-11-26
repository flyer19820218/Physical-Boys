/* ==================================================================
   mechanics_3 ｜ 靜摩擦力（cvs-static，960×540）
   四步：1 推 10 gw → 2 推 30 gw → 3 推到 60 gw → 4 超過極限（推 65 gw）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   版面（下一支 kinetic 沿用同樣的版面與比例）：
   ・左半：衣櫃 M3.wardrobe（中線 WD.cx、寬 WD.w、高 WD.h，放在地面線 GY＝455）＋ March（M3.marchPush，手貼衣櫃左面往右推）。
   ・右半：f–F 小圖 M3.fFGraph(c, {...})，位置大小用預設 M3.FF_STD（原點 (610,420)、兩軸 260 px、0～100 gw）。
       用法：M3.fFGraph(c, { staticTo: 斜線畫到 F, dot: {F,f}, markF: 目前推力, dotLabel: '(30, 30)',
                             maxLine: 虛線透明度, maxLabel: 「最大靜摩擦力 60 gw」透明度,
                             drop / kinTo / kinLabel: 動摩擦力那段（kinetic 才用） })
       回傳 { X(F), Y(f) } 可在圖上加自己的標示（本檔第 4 步的「f ＝ ？」就是這樣加的）。
   比例尺：K＝2 px／gw（100 gw＝200 px 放得下），整支不變；背景方格 1 格＝40 px＝20 gw；力箭頭每 10 gw 一道刻痕。
   數字（照簡報）：推力 10 → 30 → 60 gw，靜摩擦力＝推力（合力 ＝ 0）；最大靜摩擦力 60 gw；第 4 步推 65 gw，
       衣櫃開始往右滑，摩擦力箭頭開始縮短但不標數字（不在這一步講 40 gw）。
   作用點：推力從 March 的手掌（衣櫃左面）出發；摩擦力畫在衣櫃底面與地面接觸處（地面線下 18 px，標籤在下方）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.fFGraph || !M3.marchPush) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = COL.yellow;
  const DUR = [11, 11, 12, 11];      /* 總長 45 秒 */

  const K = 2, CELL = 40;            /* 2 px／gw；1 格＝20 gw */
  const GY = M3.GY;                  /* 地面線 455 */
  const FR_DY = 18;                  /* 摩擦力箭頭在地面線下 18 px */
  const WD = { cx: 245, w: 170, h: 250 };
  const SCENE_X = 235;               /* 左半場景的中線（結論字卡） */
  const NET = { x: 398, y: 500 };    /* 合力標籤（和摩擦力標籤同一列） */
  const SLIDE = 46;                  /* 第 4 步衣櫃滑出去的距離 px */
  const F_END = [10, 30, 60, 65];    /* 每一步結束時的推力 */
  const RAMP = [[1.4, 3.4], [1.0, 4.0], [1.0, 5.6], [0.8, 2.0]];   /* 每一步推力變化的起訖秒 */
  const SLIDE_T = [2.4, 9.5];        /* 第 4 步滑動的起訖秒 */

  M3.preload(['touch_ready']);

  /* ── 由 s 算出這一格的狀態（純函式） ── */
  function state(s) {
    const n = s.n, u = s.u, r = RAMP[n - 1];
    const F0 = n === 1 ? 0 : F_END[n - 2];
    const F = lerp(F0, F_END[n - 1], ease(seg(u, r[0], r[1])));
    let f = Math.min(F, 60), dx = 0, shake = 0;
    if (n === 3) shake = 2.2 * ease(seg(u, 5.2, 6.2));
    if (n === 4) {
      const sl = seg(u, SLIDE_T[0], SLIDE_T[1]);
      dx = SLIDE * sl * sl;                                  /* 由靜止開始加速 */
      shake = 2.8 * (1 - ease(seg(u, SLIDE_T[0], SLIDE_T[0] + 0.6))) * (0.6 + 0.4 * ease(seg(u, 0, 1.5)));
      f = lerp(60, 46, ease(seg(u, SLIDE_T[0] + 0.2, 5.0)));  /* 開始縮短（不標數字） */
    }
    const sx = M3.shake(u, shake, 38, 1.3);
    return { F, f, dx, sx, shake };
  }

  /* ═══════════ 左半：衣櫃＋March＋力 ═══════════ */
  function scene(c, s, st, a) {
    const n = s.n, u = s.u;
    const cx = WD.cx + st.dx + st.sx, face = cx - WD.w / 2;
    withA(c, a, () => {
      M3.wardrobe(c, cx, GY, WD.w, WD.h, { seed: 31, contact: st.f > 0.5 ? 0.9 : 0, contactCol: FR });
      /* 顫抖：衣櫃兩側的短弧線 */
      const qa = clamp01(st.shake / 2.2);
      if (qa > 0.05) withA(c, qa * (0.6 + 0.4 * Math.sin(u * 18)), () => {
        c.save(); c.strokeStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
        [-1, 1].forEach(sg => {
          const x = cx + sg * (WD.w / 2 + 14);
          [0, 1].forEach(i => { c.beginPath(); c.moveTo(x + sg * i * 10, GY - WD.h + 30 + i * 8); c.lineTo(x + sg * (i * 10 + 6), GY - WD.h + 48 + i * 8); c.stroke(); });
        });
        c.restore();
      });
      /* 滑動中：速度線 */
      if (n === 4) M3.speedLines(c, face - 6, GY - 40, 50, 36, fin(s, 4, SLIDE_T[0] + 0.8, 0.5), -1);
      const mp = M3.marchPush(c, face, GY, 'right', {});
      const hy = mp.hand ? mp.hand.y : GY - 150;
      /* 推力（青）：手掌出發，標籤放在衣櫃上方 */
      if (st.F > 0.3) M3.force(c, { x: face, y: hy, dir: 'right', val: st.F, k: K, tick: 10, col: PUSH, la: 1,
        text: L('推力 ', 'Push ') + Math.round(st.F) + ' gw', lab: 'above', dy: 176 - (hy - 31) });
      /* 摩擦力（珊瑚）：接觸處向左 */
      if (st.f > 0.3) {
        const unknown = n === 4 && u > SLIDE_T[0] + 0.2;
        M3.force(c, { x: cx, y: GY + FR_DY, dir: 'left', val: st.f, k: K, tick: 10, col: FR, la: 1,
          text: unknown ? L('摩擦力 ？', 'Friction ?') : L('摩擦力 ', 'Friction ') + Math.round(st.f) + ' gw', lab: 'below', dx: -20, dy: -4 });
      }
    });
  }

  /* ═══════════ 右半：f–F 圖 ═══════════ */
  function graph(c, s, st, a) {
    const n = s.n, u = s.u, Fs = Math.min(st.F, 60), r = Math.round(Fs);
    const atPeak = n === 3 ? ease(seg(u, 5.4, 6.0)) : n === 4 ? 1 : 0;
    const g = M3.fFGraph(c, {
      a, staticTo: Fs, dot: Fs > 0.3 ? { F: Fs, f: Fs } : null, markF: st.F,
      dotLabel: n < 4 && Fs > 0.3 ? '(' + r + ', ' + r + ')' : null,
      pulse: atPeak * (0.5 + 0.5 * Math.sin(u * 5)),
      maxLine: 0.45 + 0.55 * atPeak, maxLabel: n === 3 ? fin(s, 3, 6.0, 0.6) : n === 4 ? 1 : 0
    });
    /* 斜線的名字（第 2 步起） */
    T(c, a * (n === 1 ? 0 : n === 2 ? fin(s, 2, 4.4, 0.6) : 1), L('靜摩擦力 f ＝ F', 'Static: f = F'), 685, g.Y(73), FR, 20);
    /* 第 4 步：超過 60 之後 f 會怎樣？ */
    if (n === 4) {
      const qa = fin(s, 4, 3.4, 0.6);
      withA(c, qa, () => M3.dashArrow(c, g.X(65), g.Y(60) + 14, g.X(65), g.Y(40), FR, 1, u * 20, { lw: 3, head: 12 }));
      P(c, a * qa, L('f ＝ ？', 'f = ?'), g.X(87), g.Y(42), FR, 22);
    }
    return g;
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('推 10 gw', 'Push 10 gw'),
    () => L('推 30 gw', 'Push 30 gw'),
    () => L('推到 60 gw', 'Push to 60 gw'),
    () => L('超過極限：推 65 gw', 'Past the limit: push 65 gw')
  ];
  function texts(c, s, a) {
    const n = s.n, u = s.u;
    /* 頂端步驟標題 */
    if (n === 3) {
      P(c, a * fout(s, 3, 6.0, 0.4), TITLES[2](), 480, M3.KEY_Y, WHITE, 24);
      P(c, a * fin(s, 3, 6.2, 0.4), L('推到 60 gw：快動了！', 'Push to 60 gw: about to move!'), 480, M3.KEY_Y, WHITE, 24);
    } else P(c, a * fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 28, M3.KEY_Y, CELL, 20, a);
    /* 左半結論字卡 */
    const cy = M3.Q_Y + 6;
    if (n === 1) M3.caption(c, a * fin(s, 1, 4.2, 0.5), L('衣櫃不動 → f ＝ 推力 ＝ 10 gw', 'No motion → f = push = 10 gw'), FR, SCENE_X, cy, 24);
    if (n === 2) M3.caption(c, fin(s, 2, 4.6, 0.5), L('推力變大，f 跟著變大：30 gw', 'Push more, f grows too: 30 gw'), FR, SCENE_X, cy, 24);
    if (n === 3) M3.caption(c, fin(s, 3, 6.4, 0.5), L('到達極限：f ＝ 60 gw', 'At the limit: f = 60 gw'), FR, SCENE_X, cy, 24);
    if (n === 4) M3.caption(c, fin(s, 4, 3.6, 0.5), L('超過 60 gw：撐不住了', 'Over 60 gw: it gives way'), FR, SCENE_X, cy, 24);
    /* 合力 */
    if (n < 4) {
      const na = a * fin(s, n, RAMP[n - 1][1] + 0.4, 0.5);
      if (na > 0.02) W5.glow(c, NET.x, NET.y, 80, YEL, 0.12 * na);
      P(c, na, L('合力 ＝ 0', 'Net force = 0'), NET.x, NET.y, YEL, 22);
    } else {
      P(c, fout(s, 4, 1.6, 0.4), L('合力 ＝ 0', 'Net force = 0'), NET.x, NET.y, YEL, 22);
      const na = fin(s, 4, SLIDE_T[0] + 0.6, 0.5);
      if (na > 0.02) W5.glow(c, NET.x, NET.y, 80, YEL, 0.12 * na);
      P(c, na, L('合力 ≠ 0 → 滑動', 'Net ≠ 0 → slides'), NET.x, NET.y, YEL, 22);
    }
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a = s.n === 1 ? s.k : 1;   /* 每輪開頭淡入；之後同一個場景延續 */
    M3.backdrop(c, { gy: GY, cell: CELL, ox: WD.cx - WD.w / 2, glow: COL.teal, gx: 260 });
    M3.ground(c, GY);
    const st = state(s);
    scene(c, s, st, a);
    graph(c, s, st, a);
    texts(c, s, a);
  }

  W5.register('static', { canvas: 'cvs-static', steps: DUR, draw });
})();
