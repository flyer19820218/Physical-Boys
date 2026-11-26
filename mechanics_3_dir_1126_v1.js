/* ==================================================================
   mechanics_3 ｜ 摩擦力的方向（cvs-dir，960×540）
   四步：1 往右推 → 2 往左推 → 3 推不動：運動趨勢 → 4 方向口訣
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   比例尺：K＝3 px／gw（整支動畫不變）；背景方格 1 格＝30 px＝10 gw，力箭頭每 10 gw 一道刻痕。
   數字（照簡報）：第 1、2 步 推力 50 gw、摩擦力 40 gw；第 3 步 推力 30 gw、摩擦力 30 gw（等長）。
   作用點：推力從 March 的手掌（木箱側面）出發；摩擦力畫在木箱底面與地面的接觸處（地面線下 18 px，標籤在下方）。
   場景：
   ・第 1 步：木箱 CX_L → CX_R 往右滑（起步加速、之後等速），March（touch_ready）在左邊跟著推。
   ・第 2 步：木箱留在 CX_R，March 換到右邊（鏡像），把木箱推回 CX_L。
   ・第 3 步：木箱淡出、衣櫃（M3.wardrobe）放在 WX；推力與摩擦力一起從 0 數到 30 gw；右邊半透明虛線外框＝「想去的位置」。
   ・第 4 步：三張小圖（往右滑／往左滑／靜止想往右）；小圖裡的木箱不動、地面刻痕往後捲動＝在滑。箭頭比例尺照舊，不標數字。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.marchPush) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, DIM = COL.dim, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = COL.yellow;
  const DUR = [11, 11, 12, 11];      /* 總長 45 秒 */

  const K = 3, CELL = 30;            /* 3 px／gw；1 格＝10 gw */
  const GY = M3.GY;                  /* 地面線 455 */
  const FR_DY = 18;                  /* 摩擦力箭頭畫在地面線下 18 px */
  const CR = { w: 190, h: 190 };     /* 木箱 */
  const CX_L = 290, CX_R = 570;      /* 木箱滑動的兩端（中線） */
  const MOT_Y = 186;                 /* 「運動方向」虛線箭頭的高度 */
  const WD = { x: 380, w: 200, h: 260 };   /* 第 3 步衣櫃 */
  const GHOST_DX = 230;              /* 想去的位置：衣櫃右邊 */

  M3.preload(['touch_ready']);

  /* 起步加速、之後等速：t 0..1 → 0..1（前 a 段加速） */
  function slideF(t, a) {
    t = clamp01(t); a = a || 0.18;
    return (t < a ? t * t / (2 * a) : t - a / 2) / (1 - a / 2);
  }

  function backdrop(c) {
    M3.backdrop(c, { gy: GY, cell: CELL, ox: CX_L, glow: COL.teal });
    M3.ground(c, GY);
  }

  /* ═══════════ 第 1、2 步的場景：木箱＋March＋力 ═══════════
     o：{ cx 木箱中線, dir 'right'|'left'（推的方向＝運動方向）, a 整體, ma March 透明度, pg 推力長出, fg 摩擦力長出,
          ma2 運動箭頭透明度, la 速度線透明度, ph 虛線流動 } */
  function slideScene(c, o) {
    const sg = o.dir === 'right' ? 1 : -1, cx = o.cx, a = o.a == null ? 1 : o.a;
    withA(c, a, () => {
      M3.crate(c, cx, GY, CR.w, CR.h, { seed: 21, contact: o.fg * 0.9, contactCol: FR });
      /* 速度線：拖在木箱後面、March 手臂下方與腿之間 */
      M3.speedLines(c, cx - sg * (CR.w / 2 + 8), GY - 78, 64, 40, o.la || 0, -sg);
      const face = cx - sg * CR.w / 2;
      const mp = M3.marchPush(c, face, GY, o.dir, { a: o.ma == null ? 1 : o.ma });
      /* 運動方向（虛線，白） */
      const mx0 = cx - sg * 70, mx1 = cx + sg * 80;
      M3.dashArrow(c, mx0, MOT_Y, mx1, MOT_Y, WHITE, o.ma2 || 0, o.ph || 0, { lw: 4, head: 16 });
      T(c, o.ma2 || 0, L('運動方向', 'Motion'), mx0 - sg * 14, MOT_Y, WHITE, 22, sg > 0 ? 'right' : 'left');
      /* 推力（青）：從手掌出發 */
      const hy = mp.hand ? mp.hand.y : GY - 150;
      M3.force(c, { x: face, y: hy, dir: o.dir, val: 50, k: K, tick: 10, col: PUSH, grow: o.pg, name: L('推力', 'Push'), lab: 'above', dy: -36 });
      /* 摩擦力（珊瑚）：接觸處，方向相反 */
      M3.force(c, { x: cx, y: GY + FR_DY, dir: sg > 0 ? 'left' : 'right', val: 40, k: K, tick: 10, col: FR, grow: o.fg, name: L('摩擦力', 'Friction'), lab: 'below', dy: -4 });
    });
  }

  /* ═══════════ 第 1 步：往右推 ═══════════ */
  function step1(c, s) {
    const n = 1, u = s.u;
    const t0 = 1.0;
    const cx = lerp(CX_L, CX_R, slideF(seg(u, t0, s.d)));
    slideScene(c, {
      cx, dir: 'right', a: s.k, ma: 1,
      pg: grow(s, n, t0, t0 + 1.0), fg: grow(s, n, 2.4, 3.4),
      ma2: fin(s, n, 3.9, 0.5), la: fin(s, n, 1.6, 0.5), ph: u * 30
    });
    P(c, fin(s, n, 0.3, 0.5), L('往右推', 'Push right'), 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 770, M3.KEY_Y, CELL, 10, fin(s, n, 0.3, 0.5));
    M3.caption(c, fin(s, n, 5.4, 0.5), L('運動向右 → 摩擦力向左', 'Moving right → friction points left'), FR, 480, M3.Q_Y + 6, 24);
  }

  /* ═══════════ 第 2 步：往左推（鏡像） ═══════════ */
  function step2(c, s) {
    const n = 2, u = s.u, t0 = 1.6;
    const out = fout(s, n, 0, 0.6);
    const cx = lerp(CX_R, CX_L, slideF(seg(u, t0, s.d)));
    backdrop(c);
    /* 上一步的樣子（March 在左、力向右推）淡出 */
    if (out > 0.02) {
      withA(c, out, () => {
        const face = CX_R - CR.w / 2;
        M3.marchPush(c, face, GY, 'right', { a: 1 });
        const hy = GY - 150;
        M3.force(c, { x: face, y: hy, dir: 'right', val: 50, k: K, tick: 10, col: PUSH, name: L('推力', 'Push'), lab: 'above', dy: -36 });
        M3.force(c, { x: CX_R, y: GY + FR_DY, dir: 'left', val: 40, k: K, tick: 10, col: FR, name: L('摩擦力', 'Friction'), lab: 'below', dy: -4 });
      });
    }
    slideScene(c, {
      cx, dir: 'left', a: 1, ma: fin(s, n, 0.5, 0.7),
      pg: grow(s, n, t0, t0 + 1.0), fg: grow(s, n, 3.0, 4.0),
      ma2: fin(s, n, 4.4, 0.5), la: fin(s, n, 2.2, 0.5), ph: u * 30
    });
    P(c, 1, L('往左推', 'Push left'), 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 770, M3.KEY_Y, CELL, 10, 1);
    M3.caption(c, fout(s, n, 0, 0.4), L('運動向右 → 摩擦力向左', 'Moving right → friction points left'), FR, 480, M3.Q_Y + 6, 24);
    M3.caption(c, fin(s, n, 5.8, 0.5), L('運動向左 → 摩擦力向右', 'Moving left → friction points right'), FR, 480, M3.Q_Y + 6, 24);
  }

  /* backdrop 只畫一次：第 1 步在這裡補畫 */
  function step1Wrap(c, s) { backdrop(c); step1(c, s); }

  /* ═══════════ 第 3 步：推不動，運動趨勢 ═══════════ */
  function wardrobeScene(c, s, a) {
    const n = 3, u = s.u;
    const g = grow(s, n, 1.8, 5.0), v = Math.round(30 * g);
    const face = WD.x - WD.w / 2;
    withA(c, a, () => {
      const drop = 1 - ease(seg(u, 0.3, 1.0));
      M3.wardrobe(c, WD.x, GY - 10 * drop, WD.w, WD.h, { a: s.n === 3 ? 1 - drop : 1, seed: 31, contact: g * 0.9, contactCol: FR, shadow: drop < 0.05 });
      const mp = M3.marchPush(c, face, GY, 'right', { a: fin(s, n, 0.9, 0.6) });
      /* 想去的位置 + 運動趨勢 */
      const ga = fin(s, n, 5.4, 0.6), gx0 = WD.x - WD.w / 2 + GHOST_DX, gy0 = GY - WD.h;
      const pulse = 0.75 + 0.25 * Math.sin(u * 3.2);
      M3.ghostBox(c, gx0, gy0, WD.w, WD.h, WHITE, ga * pulse, u * 24, 0.07);
      T(c, ga, L('想去的位置', 'Wants to be here'), gx0 + WD.w / 2, gy0 + 60, WHITE, 20);
      const ay = GY - 120;
      M3.dashArrow(c, face + WD.w + 10, ay, gx0 + 96, ay, WHITE, ga, u * 30, { lw: 4, head: 16 });
      T(c, ga, L('運動趨勢（想往右動）', 'Tendency: wants to move right'), gx0 + WD.w / 2, gy0 - 26, WHITE, 22);
      /* 推力 30 → 、摩擦力 30 ←（等長，一起長） */
      const hy = mp.hand ? mp.hand.y : GY - 150;
      if (v > 0) {
        M3.force(c, { x: face, y: hy, dir: 'right', val: v, k: K, tick: 10, col: PUSH, name: L('推力', 'Push'), lab: 'above', la: 1, dy: gy0 - 26 - hy + 31 });
        M3.force(c, { x: WD.x, y: GY + FR_DY, dir: 'left', val: v, k: K, tick: 10, col: FR, name: L('摩擦力', 'Friction'), lab: 'below', la: 1, dy: -4 });
      }
    });
  }
  function step3(c, s) {
    const n = 3;
    backdrop(c);
    const out = fout(s, n, 0, 0.7);
    if (out > 0.02) slideScene(c, { cx: CX_L, dir: 'left', a: out, ma: 1, pg: 1, fg: 1, ma2: 1, la: 0, ph: 0 });
    wardrobeScene(c, s, 1);
    P(c, 1, L('推不動：運動趨勢', 'Not moving: tendency'), 480, M3.KEY_Y, WHITE, 24);
    M3.legend(c, 770, M3.KEY_Y, CELL, 10, 1);
    M3.caption(c, fout(s, n, 0, 0.4), L('運動向左 → 摩擦力向右', 'Moving left → friction points right'), FR, 480, M3.Q_Y + 6, 24);
    M3.caption(c, fin(s, n, 7.0, 0.5), L('沒動，但有往右的運動趨勢 → 摩擦力向左', 'Not moving, but tends to move right → friction left'), FR, 480, M3.Q_Y + 6, 24);
    /* 合力 ＝ 0 */
    const na = fin(s, n, 8.4, 0.5);
    if (na > 0.02) W5.glow(c, 860, GY - 150, 90, YEL, 0.12 * na);
    P(c, na, L('合力 ＝ 0', 'Net force = 0'), 860, GY - 150, YEL, 24);
  }

  /* ═══════════ 第 4 步：方向口訣 ═══════════ */
  const PAN = { cx: [165, 480, 795], w: 290, top: 128, bot: 392, gy: 322, box: 80, motY: 222, frY: 338 };
  /* 一張小圖：kind 0 往右滑、1 往左滑、2 靜止想往右；a 透明度；dy 進場位移 */
  function panel(c, s, kind, a, dy) {
    const pc = PAN.cx[kind], x0 = pc - PAN.w / 2, u = s.u;
    withA(c, a, () => {
      c.save(); c.translate(0, dy);
      /* 底板 */
      c.fillStyle = 'rgba(23,51,42,0.92)'; W5.rr(c, x0, PAN.top, PAN.w, PAN.bot - PAN.top, 16); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, x0, PAN.top, PAN.w, PAN.bot - PAN.top, 16); c.stroke();
      /* 地面＋捲動的刻痕（往右滑＝刻痕往左跑） */
      c.save(); W5.rr(c, x0, PAN.top, PAN.w, PAN.bot - PAN.top, 16); c.clip();
      c.fillStyle = '#21463b'; c.fillRect(x0, PAN.gy, PAN.w, PAN.bot - PAN.gy);
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, PAN.gy); c.lineTo(x0 + PAN.w, PAN.gy); c.stroke();
      const v = kind === 0 ? -1 : kind === 1 ? 1 : 0, off = ((u * 70 * v) % 40 + 40) % 40;
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 3;
      for (let x = x0 - 40 + off; x < x0 + PAN.w + 40; x += 40) { c.beginPath(); c.moveTo(x, PAN.gy + 6); c.lineTo(x - 10, PAN.gy + 18); c.stroke(); }
      c.restore();
      /* 物體 */
      const bx = kind === 2 ? pc - 48 : pc, by = PAN.gy;
      M3.crate(c, bx, by, PAN.box, PAN.box, { seed: 21 + kind, contact: 0.8, contactCol: FR });
      if (v !== 0) M3.speedLines(c, bx - v * -1 * (PAN.box / 2 + 6), by - PAN.box / 2, 40, 30, 1, v);
      /* 運動（或運動趨勢）箭頭：白虛線 */
      if (kind === 2) {
        M3.ghostBox(c, bx + PAN.box / 2 + 14, by - PAN.box, PAN.box, PAN.box, WHITE, 0.7 + 0.3 * Math.sin(u * 3.2), u * 24, 0.07);
        M3.dashArrow(c, bx - 20, PAN.motY, bx + 110, PAN.motY, WHITE, 1, u * 30, { lw: 4, head: 14 });
      } else {
        const sg = kind === 0 ? 1 : -1;
        M3.dashArrow(c, bx - sg * 55, PAN.motY, bx + sg * 65, PAN.motY, WHITE, 1, u * 30, { lw: 4, head: 14 });
      }
      c.restore();
    });
    /* 摩擦力（比例尺照舊：40 gw、40 gw、30 gw），不標數字 */
    const bx = kind === 2 ? pc - 48 : pc;
    const fd = kind === 1 ? 'right' : 'left', fv = kind === 2 ? 30 : 40;
    const fg = grow(s, 4, 1.4 + kind * 0.8, 2.2 + kind * 0.8);
    M3.force(c, { x: bx, y: PAN.frY + dy, dir: fd, val: fv, k: K, col: FR, grow: fg, a, lab: null, lw: 6 });
  }
  function step4(c, s) {
    const n = 4, u = s.u;
    backdrop(c);
    const out = fout(s, n, 0, 0.8);
    if (out > 0.02) withA(c, out, () => wardrobeScene(c, { n: 3, u: 12, d: 12 }, 1));
    const titles = [L('往右滑', 'Slides right'), L('往左滑', 'Slides left'), L('靜止，想往右', 'At rest, wants right')];
    const concl = [L('摩擦力向左', 'Friction: left'), L('摩擦力向右', 'Friction: right'), L('摩擦力向左', 'Friction: left')];
    for (let i = 0; i < 3; i++) {
      const pa = fin(s, n, 0.6 + i * 0.8, 0.6), dy = 24 * (1 - pa);
      if (pa <= 0.02) continue;
      panel(c, s, i, pa, dy);
      T(c, pa, titles[i], PAN.cx[i], PAN.top + 30 + dy, WHITE, 22);
      P(c, fin(s, n, 3.4 + i * 0.7, 0.5), concl[i], PAN.cx[i], PAN.bot + 40, FR, 22);
    }
    /* 小圖的圖例 */
    const ga = fin(s, n, 3.0, 0.5);
    withA(c, ga, () => {
      M3.dashArrow(c, 250, M3.BOT_Y + 4, 300, M3.BOT_Y + 4, WHITE, 1, u * 30, { lw: 4, head: 12 });
      M3.arrowFx(c, 560, M3.BOT_Y + 4, 610, M3.BOT_Y + 4, FR, 1, 6);
    });
    T(c, ga, L('運動（或運動趨勢）', 'Motion (or tendency)'), 312, M3.BOT_Y + 4, WHITE, 20, 'left');
    T(c, ga, L('摩擦力', 'Friction'), 622, M3.BOT_Y + 4, FR, 20, 'left');
    /* 最上面：黃色大字 */
    const ka = fin(s, n, 5.6, 0.6);
    if (ka > 0.02) W5.glow(c, 480, 74, 300, YEL, 0.10 * ka);
    P(c, ka, L('摩擦力方向 ＝ 運動（或運動趨勢）的相反方向', 'Friction is opposite to the motion (or its tendency)'), 480, 74, YEL, 28);
    P(c, fout(s, n, 5.2, 0.5) * fin(s, n, 0.2, 0.5), L('方向口訣', 'The rule'), 480, 74, WHITE, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    if (s.n === 1) step1Wrap(c, s);
    else if (s.n === 2) step2(c, s);
    else if (s.n === 3) step3(c, s);
    else step4(c, s);
  }

  W5.register('dir', { canvas: 'cvs-dir', steps: DUR, draw });
})();
