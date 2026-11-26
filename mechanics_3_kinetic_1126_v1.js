/* ==================================================================
   mechanics_3 ｜ 動摩擦力（cvs-kinetic，960×540）
   四步：1 慢慢加大推力（0 → 60 gw）→ 2 突破：碰！（f 由 60 掉到 40 gw）→ 3 滑動中（推 60：合力 20 越滑越快；推 40：合力 0 等速）
         → 4 看折線圖（f–F 圖放大、衣櫃縮成左下角小圖、紅點沿折線掃一遍）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   版面與 static 相同：左半衣櫃（WD）＋ March（M3.marchPush）、右半 f–F 小圖（M3.fFGraph，預設 M3.FF_STD）。
   比例尺：K＝2 px／gw，整支不變；背景方格 1 格＝40 px＝20 gw；力箭頭每 10 gw 一道刻痕。
   數字（照簡報）：最大靜摩擦力 60 gw、動摩擦力 40 gw（固定）；第 3 步先推 60 gw（合力 20 gw），再推 40 gw（合力 0）。
   滑動：衣櫃的「世界位置」xw(s) 由分段的等加速度／等速公式算出（純函式）；畫面上衣櫃只往右漂一點（DRIFT），
         其餘用背景方格與地板接縫往左捲動（鏡頭跟著衣櫃走），所以可以一直滑下去不會撞到右邊的圖。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.fFGraph || !M3.marchPush) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = M3.FC.net;
  const DUR = [11, 11, 12, 11];      /* 總長 45 秒 */

  const K = 2, CELL = 40;            /* 2 px／gw；1 格＝20 gw */
  const GY = M3.GY;                  /* 地面線 455 */
  const FR_DY = 18;                  /* 摩擦力箭頭在地面線下 18 px */
  const WD = { cx: 245, w: 170, h: 250 };
  const SCENE_X = 235;               /* 左半場景的中線（結論字卡） */
  const NET = { x: 392, y: 500 };    /* 合力標籤（和摩擦力標籤同一列） */
  const DRIFT = 34;                  /* 衣櫃在畫面上最多往右漂多少 px，其餘由鏡頭捲動 */

  /* 時間點 */
  const R1 = [1.0, 8.0];             /* 第 1 步：推力 0 → 60 */
  const TB = 2.2;                    /* 第 2 步：碰！ */
  const R3 = [5.0, 6.5];             /* 第 3 步：推力 60 → 40 */
  const ZOOM = [0.3, 1.8];           /* 第 4 步：圖放大、衣櫃縮小 */
  const SWEEP = [2.6, 7.6];          /* 第 4 步：紅點掃過折線 */

  /* 運動學（px、秒）：碰的瞬間往前彈 JOLT，之後初速 V0、加速度 ACC（合力 20 gw） */
  const JOLT = 16, V0 = 24, ACC = 8;
  const T2 = DUR[1] - TB;            /* 第 2 步碰之後的時間 */
  const X2 = JOLT + V0 * T2 + 0.5 * ACC * T2 * T2, V2 = V0 + ACC * T2;
  const X3a = X2 + V2 * R3[0] + 0.5 * ACC * R3[0] * R3[0], V3a = V2 + ACC * R3[0];
  const TR3 = R3[1] - R3[0];
  const VC = V3a + ACC * TR3 / 2;    /* 推力由 60 線性減到 40：加速度線性歸零，末速＝等速 */
  const X3b = X3a + V3a * TR3 + ACC * (TR3 * TR3 / 2 - TR3 * TR3 / 6);
  const X3 = X3b + VC * (DUR[2] - R3[1]);

  M3.preload(['touch_ready']);

  /* ── 由 s 算出這一格的狀態（純函式） ── */
  function state(s) {
    const n = s.n, u = s.u;
    let F = 60, f = 60, xw = 0, v = 0, shake = 0;
    if (n === 1) {
      F = 60 * seg(u, R1[0], R1[1]); f = F;
      shake = 1.6 * ease(seg(u, 7.2, 8.4));
    } else if (n === 2) {
      shake = u < TB ? 1.6 + 1.6 * ease(seg(u, 0, TB)) : 4 * (1 - ease(seg(u, TB, TB + 0.5)));
      f = u < TB ? 60 : lerp(60, 40, ease(seg(u, TB, TB + 0.35)));
      if (u > TB) {
        const t = u - TB;
        xw = JOLT * (1 - Math.exp(-t / 0.07)) + V0 * t + 0.5 * ACC * t * t;
        v = V0 + ACC * t;
      }
    } else if (n === 3) {
      f = 40;
      if (u <= R3[0]) { xw = X2 + V2 * u + 0.5 * ACC * u * u; v = V2 + ACC * u; }
      else if (u <= R3[1]) {
        const t = u - R3[0];
        xw = X3a + V3a * t + ACC * (t * t / 2 - t * t * t / (6 * TR3)); v = V3a + ACC * (t - t * t / (2 * TR3));
      } else { xw = X3b + VC * (u - R3[1]); v = VC; }
      F = lerp(60, 40, seg(u, R3[0], R3[1]));
    } else {
      F = 40; f = 40; xw = X3 + VC * u; v = VC;
    }
    const drift = DRIFT * (1 - Math.exp(-xw / 90));
    return { F, f, xw, v, cam: xw - drift, drift, shake, sx: M3.shake(u, shake, 38, 1.3) };
  }

  /* ═══════════ 地板接縫（跟著鏡頭往左捲，讓滑動看得出來） ═══════════ */
  function floorSeams(c, cam) {
    const gap = 160;
    c.save(); c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 2;
    const k0 = Math.floor((cam - 40) / gap);
    for (let k = k0; k < k0 + 9; k++) {
      const x = k * gap - cam + 60;
      if (x < -20 || x > 980) continue;
      c.beginPath(); c.moveTo(x, GY + 4); c.lineTo(x - 26, 540); c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 碰！星芒＋震波圈 ═══════════ */
  function bang(c, x, y, t) {
    if (t < 0 || t > 1.4) return;
    const a = 1 - ease(seg(t, 0.35, 1.4));
    /* 震波圈 */
    withA(c, a * (1 - seg(t, 0, 0.7)), () => {
      c.save(); c.strokeStyle = '#fff3c4'; c.lineWidth = 4;
      [0, 0.12].forEach(d => { const r = 20 + 150 * ease(seg(t, d, d + 0.6)); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); });
      c.restore();
    });
    /* 放射短線 */
    withA(c, a, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 4; c.lineCap = 'round';
      const r0 = 40 + 50 * ease(seg(t, 0, 0.35)), r1 = r0 + 34;
      for (let i = 0; i < 10; i++) {
        const q = i / 10 * Math.PI * 2 + 0.2 * W5.hash(i + 5);
        c.beginPath(); c.moveTo(x + Math.cos(q) * r0, y + Math.sin(q) * r0); c.lineTo(x + Math.cos(q) * r1, y + Math.sin(q) * r1); c.stroke();
      }
      c.restore();
    });
    M3.flash(c, x, y, 46 * (0.6 + 0.4 * ease(seg(t, 0, 0.2))), YEL, a, t * 1.5);
  }

  /* ═══════════ 左半：衣櫃＋March＋力（labels＝false 時不寫字，給第 4 步縮圖用） ═══════════ */
  function scene(c, s, st, a, labels) {
    const n = s.n, u = s.u;
    const cx = WD.cx + st.drift + st.sx, face = cx - WD.w / 2;
    const la = labels ? 1 : 0;
    withA(c, a, () => {
      M3.wardrobe(c, cx, GY, WD.w, WD.h, { seed: 31, contact: st.f > 0.5 ? 0.9 : 0, contactCol: FR });
      /* 顫抖：衣櫃兩側的短弧線（碰之前） */
      const qa = (n === 1 || (n === 2 && u < TB + 0.2)) ? clamp01(st.shake / 2.2) : 0;
      if (qa > 0.05) withA(c, qa * (0.6 + 0.4 * Math.sin(u * 18)), () => {
        c.save(); c.strokeStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
        [-1, 1].forEach(sg => {
          const x = cx + sg * (WD.w / 2 + 14);
          [0, 1].forEach(i => { c.beginPath(); c.moveTo(x + sg * i * 10, GY - WD.h + 30 + i * 8); c.lineTo(x + sg * (i * 10 + 6), GY - WD.h + 48 + i * 8); c.stroke(); });
        });
        c.restore();
      });
      /* 滑動中：速度線（長短跟著速度） */
      const va = clamp01(st.v / 60);
      if (va > 0.02) {
        const len = 20 + 0.32 * st.v;
        M3.speedLines(c, face - 6, GY - 40, 50, len, va, -1);
      }
      const mp = M3.marchPush(c, face, GY, 'right', {});
      const hy = mp.hand ? mp.hand.y : GY - 150;
      /* 推力（青）：手掌出發，標籤放在衣櫃上方 */
      if (st.F > 0.3) M3.force(c, { x: face, y: hy, dir: 'right', val: st.F, k: K, tick: 10, col: PUSH, la,
        lab: labels ? 'above' : null, text: L('推力 ', 'Push ') + Math.round(st.F) + ' gw', dy: 176 - (hy - 31) });
      /* 摩擦力（珊瑚）：接觸處向左 */
      if (st.f > 0.3) M3.force(c, { x: cx, y: GY + FR_DY, dir: 'left', val: st.f, k: K, tick: 10, col: FR, la,
        lab: labels ? 'below' : null, text: L('摩擦力 ', 'Friction ') + Math.round(st.f) + ' gw', dx: -30, dy: -4 });
      /* 合力（黃）：第 3 步，畫在衣櫃中心往右 */
      const net = st.F - st.f;
      if (n >= 3 && net > 0.5) M3.force(c, { x: cx, y: GY - WD.h + 78, dir: 'right', val: net, k: K, tick: 10, col: YEL,
        a: fin(s, 3, 0.4, 0.5), grow: grow(s, 3, 0.4, 1.4), lab: null });
      /* 碰！ */
      if (n === 2) bang(c, cx + WD.w / 2 - 10, GY - 30, u - TB);
    });
  }

  /* ═══════════ 右半：f–F 圖 ═══════════ */
  const BIG = { x: 350, y: 430, w: 500, h: 290, panel: { x0: 176, y0: 90, x1: 934, y1: 522 } };
  const STD_PANEL = { x0: M3.FF_STD.x - 140, y0: M3.FF_STD.y - M3.FF_STD.h - 52, x1: M3.FF_STD.x + M3.FF_STD.w + 70, y1: M3.FF_STD.y + 86 };
  function graph(c, s, st, a) {
    const n = s.n, u = s.u;
    const z = n === 4 ? grow(s, 4, ZOOM[0], ZOOM[1]) : 0;
    const S = M3.FF_STD;
    const geo = {
      x: lerp(S.x, BIG.x, z), y: lerp(S.y, BIG.y, z), w: lerp(S.w, BIG.w, z), h: lerp(S.h, BIG.h, z),
      panel: { x0: lerp(STD_PANEL.x0, BIG.panel.x0, z), y0: lerp(STD_PANEL.y0, BIG.panel.y0, z), x1: lerp(STD_PANEL.x1, BIG.panel.x1, z), y1: lerp(STD_PANEL.y1, BIG.panel.y1, z) },
      size: z > 0.5 ? 24 : 20, tickSize: z > 0.5 ? 20 : 18
    };
    const sz = geo.size;
    let o;
    if (n === 1) {
      const Fs = Math.min(st.F, 60), r = Math.round(Fs), pk = ease(seg(u, 7.6, 8.4));
      o = { staticTo: Fs, dot: Fs > 0.3 ? { F: Fs, f: Fs } : null, markF: st.F, dotLabel: Fs > 0.3 ? '(' + r + ', ' + r + ')' : null,
        pulse: pk * (0.5 + 0.5 * Math.sin(u * 5)), maxLine: 0.45 + 0.55 * pk, maxLabel: fin(s, 1, 8.2, 0.6) };
    } else if (n === 2 || n === 3) {
      const dr = n === 2 ? ease(seg(u, TB, TB + 0.45)) : 1;
      const lab = n === 2 ? (dr < 0.5 ? '(60, 60)' : '(60, 40)') : null;
      o = { staticTo: 60, drop: dr, dot: { F: 60, f: lerp(60, 40, dr) }, markF: n === 3 ? null : 60, dotLabel: lab,
        pulse: n === 2 && u < TB ? 0.5 + 0.5 * Math.sin(u * 6) : 0, maxLine: 1, maxLabel: 1 };
    } else {
      const sw = seg(u, SWEEP[0], SWEEP[1]);
      const p = M3.fFPoint(sw);
      const dotA = u < 1.0 ? fout(s, 4, 0, 0.4) : fin(s, 4, 2.0, 0.4);
      const atPeak = Math.abs(p.F - 60) < 0.5 && p.f > 59 ? 1 : 0;
      o = { staticTo: 60, drop: 1, kinTo: lerp(60, 100, grow(s, 4, 1.8, 2.6)),
        dot: u < 1.0 ? { F: 60, f: 40 } : p, dotA, maxLine: 1, maxLabel: 1, kinLabel: 0,
        pulse: atPeak };
    }
    o.a = a; Object.assign(o, geo);
    const g = M3.fFGraph(c, o);
    /* 斜線的名字 */
    T(c, a, L('靜摩擦力 f ＝ F', 'Static: f = F'), g.X(29), g.Y(73), FR, sz);
    /* 掉下來！（第 2 步碰之後；第 4 步紅點經過時再出現一次） */
    const dropA = n === 2 ? fin(s, 2, TB + 0.4, 0.4) : n === 3 ? 1 : n === 4 ? (u < 1 ? fout(s, 4, 0, 0.3) : fin(s, 4, SWEEP[0] + 3.4, 0.4)) : 0;
    if (dropA > 0.02) {
      withA(c, a * dropA, () => {
        const bx = g.X(60) + 12;
        c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx, g.Y(60)); c.lineTo(bx + 7, g.Y(60)); c.lineTo(bx + 7, g.Y(40)); c.lineTo(bx, g.Y(40)); c.stroke();
        c.restore();
      });
      T(c, a * dropA, L('掉下來！', 'Drops!'), g.X(60) + 26, g.Y(52), YEL, sz, 'left');
    }
    /* 第 3 步：滑動中 f 固定 40 */
    if (n === 3) P(c, a * fin(s, 3, 1.6, 0.5), L('滑動中 f ＝ 40 gw', 'Sliding: f = 40 gw'), g.X(80), g.Y(26), FR, 20);
    /* 第 4 步：60 ＞ 40 */
    if (n === 4) {
      /* 動摩擦力的名字：紅點走到水平線時出現，寫在水平線下方 */
      T(c, a * fin(s, 4, SWEEP[0] + 4.0, 0.5), L('動摩擦力 40 gw（固定）', 'Kinetic friction 40 gw (fixed)'), g.X(81), g.Y(40) + 34, FR, sz);
      const ca = fin(s, 4, SWEEP[1] + 0.6, 0.5);
      if (ca > 0.02) W5.glow(c, g.X(82), g.Y(76), 110, YEL, 0.12 * ca);
      P(c, ca, '60 gw ＞ 40 gw', g.X(82), g.Y(76), YEL, 26);
    }
    return g;
  }

  /* ═══════════ 文字 ═══════════ */
  function texts(c, s, a) {
    const n = s.n, u = s.u;
    const swap = (str1, str2, t, col, x, y, size, isCap) => {
      const f1 = n === s.n ? fin(s, n, n === 1 ? 0.2 : 0.2, 0.5) * fout(s, n, t, 0.35) : 0, f2 = fin(s, n, t + 0.2, 0.45);
      if (isCap) { M3.caption(c, a * f1, str1, col, x, y, size); M3.caption(c, a * f2, str2, col, x, y, size); }
      else { P(c, a * f1, str1, x, y, col, size); P(c, a * f2, str2, x, y, col, size); }
    };
    /* 頂端步驟標題 */
    const KY = M3.KEY_Y;
    if (n === 1) P(c, a * fin(s, 1, 0.2, 0.5), L('慢慢加大推力', 'Push harder, slowly'), 480, KY, WHITE, 24);
    if (n === 2) P(c, fin(s, 2, 0.2, 0.5), L('突破：碰！', 'Breakthrough: bang!'), 480, KY, WHITE, 24);
    if (n === 3) swap(L('滑動中', 'Sliding'), L('只要推 40 gw 就能等速滑動 → 變輕鬆', 'Just 40 gw keeps it steady → easier'), 7.4, WHITE, 480, KY, 24, false);
    if (n === 4) swap(L('看折線圖', 'Read the graph'), L('最大靜摩擦力 ＞ 動摩擦力', 'Max static friction > kinetic friction'), SWEEP[1] + 0.4, WHITE, 480, KY, 24, false);
    /* 比例尺圖例（第 4 步淡出） */
    M3.legend(c, 28, KY, CELL, 20, a * (n === 4 ? fout(s, 4, 0, 0.3) : 1));

    /* 左半結論字卡 */
    const cy = M3.Q_Y + 6;
    if (n === 1) {
      M3.caption(c, a * fin(s, 1, 3.0, 0.5) * fout(s, 1, 8.2, 0.35), L('衣櫃不動：f ＝ 推力', 'No motion: f = push'), FR, SCENE_X, cy, 24);
      M3.caption(c, a * fin(s, 1, 8.4, 0.45), L('f 到達最大：60 gw', 'f hits its max: 60 gw'), FR, SCENE_X, cy, 24);
    }
    if (n === 2) {
      M3.caption(c, fin(s, 2, 0.4, 0.5) * fout(s, 2, TB, 0.25), L('推力一超過 60 gw……', 'Push just past 60 gw...'), FR, SCENE_X, cy, 24);
      M3.caption(c, fin(s, 2, TB + 1.0, 0.45), L('f 立刻掉到 40 gw', 'f drops to 40 gw at once'), FR, SCENE_X, cy, 24);
      /* 碰！大字 */
      const ba = fin(s, 2, TB, 0.12) * fout(s, 2, TB + 2.4, 0.5);
      const sc = 1 + 0.25 * (1 - ease(seg(u, TB, TB + 0.3)));
      if (ba > 0.02) W5.glow(c, 410, 250, 90, YEL, 0.25 * ba);
      P(c, ba, L('碰！', 'Bang!'), 410, 250, YEL, Math.round(40 * sc));
    }
    if (n === 3) {
      M3.caption(c, fin(s, 3, 0.6, 0.5) * fout(s, 3, R3[1] - 0.2, 0.35), L('合力 ＝ 60 − 40 ＝ 20 gw', 'Net = 60 − 40 = 20 gw'), YEL, SCENE_X, cy, 24);
      M3.caption(c, fin(s, 3, R3[1] + 0.1, 0.45), L('合力 ＝ 40 − 40 ＝ 0', 'Net = 40 − 40 = 0'), YEL, SCENE_X, cy, 24);
    }
    /* 合力（底部） */
    if (n === 1) {
      const na = a * fin(s, 1, 2.0, 0.5);
      if (na > 0.02) W5.glow(c, NET.x, NET.y, 80, YEL, 0.12 * na);
      P(c, na, L('合力 ＝ 0', 'Net force = 0'), NET.x, NET.y, YEL, 22);
    } else if (n === 2) {
      P(c, fout(s, 2, TB, 0.3), L('合力 ＝ 0', 'Net force = 0'), NET.x, NET.y, YEL, 22);
      const na = fin(s, 2, TB + 1.6, 0.5);
      if (na > 0.02) W5.glow(c, NET.x, NET.y, 80, YEL, 0.12 * na);
      P(c, na, L('滑出去了', 'It slides'), NET.x, NET.y, YEL, 22);
    } else if (n === 3) {
      const n1 = fin(s, 3, 1.4, 0.5) * fout(s, 3, R3[1] - 0.2, 0.35), n2 = fin(s, 3, R3[1] + 0.3, 0.45);
      if (n1 + n2 > 0.02) W5.glow(c, NET.x, NET.y, 80, YEL, 0.12 * (n1 + n2));
      P(c, n1, L('越滑越快', 'Speeding up'), NET.x, NET.y, YEL, 22);
      P(c, n2, L('等速滑動', 'Steady speed'), NET.x, NET.y, YEL, 22);
    }
  }

  /* ═══════════ 整個左半世界（背景＋地面＋場景） ═══════════ */
  function world(c, s, st, a, labels) {
    M3.backdrop(c, { gy: GY, cell: CELL, ox: WD.cx - WD.w / 2 - st.cam, glow: COL.teal, gx: 260 });
    M3.ground(c, GY);
    floorSeams(c, st.cam);
    scene(c, s, st, a, labels);
  }

  /* 第 4 步：左半縮成左下角小圖（來源區域 SRC → 目的 DST） */
  const SRC = { x: 30, y: 150, w: 460, h: 380 };
  const DST = { x: 12, y: 384, w: 156, h: 129 };

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a = s.n === 1 ? s.k : 1;   /* 每輪開頭淡入；之後同一個場景延續 */
    const st = state(s);
    if (s.n !== 4) {
      /* 碰的瞬間整個左半畫面震一下 */
      const bt = s.n === 2 ? s.u - TB : -1, bs = bt > 0 && bt < 0.35 ? 5 * (1 - bt / 0.35) : 0;
      c.save(); if (bs) c.translate(M3.shake(s.u, bs, 70, 0.4), M3.shake(s.u, bs * 0.6, 63, 2.1));
      world(c, s, st, a, true);
      c.restore();
    } else {
      const z = grow(s, 4, ZOOM[0], ZOOM[1]);
      const k1 = DST.w / SRC.w, k = lerp(1, k1, z);
      const tx = lerp(0, DST.x - SRC.x * k1, z), ty = lerp(0, DST.y - SRC.y * k1, z);
      const cr = { x: lerp(0, DST.x, z), y: lerp(32, DST.y, z), w: lerp(960, DST.w, z), h: lerp(508, DST.h, z) };
      M3.backdrop(c, { gy: GY, cell: CELL, glow: COL.teal, gx: 480 });
      M3.ground(c, GY);
      c.save();
      W5.rr(c, cr.x, cr.y, cr.w, cr.h, 12 * z); c.clip();
      c.fillStyle = COL.bg; c.fillRect(cr.x, cr.y, cr.w, cr.h);
      c.translate(tx, ty); c.scale(k, k);
      world(c, s, st, 1, false);
      c.restore();
      withA(c, z, () => {
        c.save(); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; W5.rr(c, cr.x, cr.y, cr.w, cr.h, 12); c.stroke(); c.restore();
      });
    }
    graph(c, s, st, a);
    texts(c, s, a);
  }

  W5.register('kinetic', { canvas: 'cvs-kinetic', steps: DUR, draw });
})();
