/* ==================================================================
   mechanics_3 ｜ 接觸面積（cvs-area，960×540）
   四步：1 大面朝下（峰值 70 gw）→ 2 中面朝下（70 gw）→ 3 小面朝下（70 gw）→ 4 三次一樣（等高長條）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   場景：沿用 M3.pullScene（同 surface）——桌上鋪木板、木塊 200 gw、0 顆砝碼，March 用彈簧秤水平往右拉；
         讀數升到峰值 → 木塊滑動、讀數掉下來（預設 0.72 倍，不寫數字）→ 秤上與曲線圖保留「峰值 70 gw」。
   木塊三種擺法（側視，木塊尺寸 180 × 112 × 78）：
         大面朝下：正面 180 寬 × 78 高（接觸面 180 × 112）
         中面朝下：正面 180 寬 × 112 高（接觸面 180 × 78）——由大面「往前滾」90°（側視輪廓高 78cosθ＋112sinθ）
         小面朝下：正面 112 寬 × 180 高（接觸面 112 × 78）——由中面在畫面內轉 90°（立起來）
         木塊右面（掛鉤）固定在 x 290，所以彈簧秤與 March 不會跟著擺法亂跑；掛鉤高度固定在桌面上 39 px。
         接觸面：木塊底邊用黃色粗線＋光暈標出，桌下 pill 標「接觸面：大面／中面／小面」。
   右上角小窗：斜上方看的立體木塊，木塊微微抬起、下方的黃色面＝接觸面（三種大小明顯不同）。
   左上：步驟標題；中上：讀數–時間曲線（前幾次的曲線淡虛線疊在一起＝一樣）。
   第 4 步：場景淡出，三條 70 gw 長條等高並排，上面放三種擺法的立體縮圖；黃色虛線連起三條頂端；
         黃色結論「接觸面積不同，峰值都是 70 gw」＋小字「（一般乾摩擦的簡化模型）」。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.pullScene) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = M3.FC.net;
  const DUR = [11, 11, 11, 11];      /* 總長 44 秒 */

  const GY = M3.GY, TOP = M3.PULL.top, PEAK = 70;
  const HOOK_X = 290;                /* 木塊右面（掛鉤）固定的 x */
  /* 三種擺法：w 正面寬、h 正面高、d 往畫面裡的深度（接觸面 ＝ w × d） */
  const FACES = [
    { w: 180, h: 78,  d: 112, zh: '大面', en: 'large face',  En: 'Large face' },
    { w: 180, h: 112, d: 78,  zh: '中面', en: 'medium face', En: 'Medium face' },
    { w: 112, h: 180, d: 78,  zh: '小面', en: 'small face',  En: 'Small face' }
  ];
  const PULL_T = [[1.4, 9.2], [2.6, 9.6], [2.6, 9.6]];   /* 各步拉動進度 t 0→1 的起訖秒 */
  const RET = [0.1, 0.9];            /* 第 2、3 步：木塊拉回原位 */
  const FLIP = [1.0, 2.2];           /* 第 2、3 步：翻面 */
  const GRAPH = { x0: 296, y0: 40, x1: 584, y1: 200 };
  const INSET = { x0: 752, y0: 40, x1: 944, y1: 318, base: 250 };
  const CAP = { x: 700, y: 500 };
  const TAG_Y = [496, 526];
  /* 第 4 步 */
  const BAR = { base: 440, k: 1.5, w: 100, xs: [300, 480, 660], axisX: 210 };

  M3.preload(['tug', 'explaining']);

  /* ═══════════ 立體木塊（斜上方看）：微微抬起，下方黃色面＝接觸面 ═══════════
     x0 正面左下角 x、base 地面 y；F 擺法；s 縮放；o：{ lift 抬起 px, a, glow 接觸面亮度 } */
  const VX = 0.55, VY = -0.42;       /* 每單位深度往右上 */
  function block3d(c, x0, base, F, s, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const W = F.w * s, H = F.h * s, dx = F.d * s * VX, dy = F.d * s * VY, lift = o.lift || 0, gl = o.glow == null ? 1 : o.glow;
    const poly = (pts, fill, stroke, lw) => {
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.lineJoin = 'round'; c.stroke(); }
    };
    withA(c, a, () => {
      /* 地面上的接觸面（黃） */
      const fp = [[x0, base], [x0 + W, base], [x0 + W + dx, base + dy], [x0 + dx, base + dy]];
      withA(c, gl, () => {
        W5.glow(c, x0 + (W + dx) / 2, base + dy / 2, (W + dx) * 0.7, YEL, 0.28);
        c.save(); c.shadowColor = YEL; c.shadowBlur = 14;
        poly(fp, W5.rgba(YEL, 0.55), YEL, 3); c.restore();
      });
      /* 抬起的虛線（底面四角往下） */
      if (lift > 1) {
        c.save(); c.setLineDash([4, 4]); c.strokeStyle = W5.rgba(YEL, 0.8 * gl); c.lineWidth = 1.6;
        fp.forEach(p => { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - lift); c.stroke(); });
        c.restore();
      }
      const b = base - lift, ink = 'rgba(70,48,24,0.9)';
      /* 正面、右側面、頂面 */
      const gF = c.createLinearGradient(0, b - H, 0, b); gF.addColorStop(0, '#f4ecd8'); gF.addColorStop(1, '#d6c29a');
      poly([[x0, b], [x0 + W, b], [x0 + W, b - H], [x0, b - H]], gF, ink, 2);
      poly([[x0 + W, b], [x0 + W + dx, b + dy], [x0 + W + dx, b + dy - H], [x0 + W, b - H]], '#b89f72', ink, 2);
      poly([[x0, b - H], [x0 + W, b - H], [x0 + W + dx, b + dy - H], [x0 + dx, b + dy - H]], '#fff6e2', ink, 2);
      /* 木紋幾條 */
      c.save(); c.beginPath(); c.rect(x0, b - H, W, H); c.clip();
      c.strokeStyle = 'rgba(150,108,58,0.35)'; c.lineWidth = 1.4;
      for (let i = 1; i < 5; i++) { const yy = b - H * i / 5; c.beginPath(); c.moveTo(x0, yy); c.bezierCurveTo(x0 + W * 0.3, yy - 3, x0 + W * 0.6, yy + 3, x0 + W, yy - 1); c.stroke(); }
      c.restore();
    });
  }
  /* 立體木塊的外框寬（置中用） */
  const w3d = (F, s) => F.w * s + F.d * s * VX;

  /* ═══════════ 側視木塊（含翻面過程） ═══════════
     n 第幾種擺法（0..2）；f 從上一種翻過來的進度（1＝已翻好）
     回傳 { hw 輪廓半寬, draw(c, cx, top) } */
  function sideBlock(n, f, contact) {
    if (n === 0 || f >= 1) {
      const F = FACES[n];
      return { hw: F.w / 2, draw: (c, cx, top) => M3.block(c, cx, top, F.w, F.h, { seed: 9, contact }) };
    }
    const q = ease(f), th = q * Math.PI / 2;
    if (n === 1) {
      /* 大面 → 中面：往前滾 90°，看到舊正面（78 cosθ）＋舊頂面（112 sinθ）兩條 */
      const h1 = 78 * Math.cos(th), h2 = 112 * Math.sin(th);
      return { hw: 90, draw: (c, cx, top) => {
        const H = h1 + h2;
        M3.block(c, cx, top, 180, H, { seed: 9, shadow: false });
        c.save(); W5.rr(c, cx - 90, top - H, 180, H, 6); c.clip();
        /* 下面那條＝舊正面轉走（偏暗）；上面那條＝舊頂面轉過來（偏亮） */
        c.fillStyle = 'rgba(60,40,20,' + (0.22 * Math.min(1, q * 3)).toFixed(3) + ')'; c.fillRect(cx - 90, top - h1, 180, h1);
        c.fillStyle = 'rgba(255,255,255,' + (0.22 * (1 - q)).toFixed(3) + ')'; c.fillRect(cx - 90, top - H, 180, h2);
        c.restore();
        c.save(); c.strokeStyle = 'rgba(70,48,24,0.85)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx - 90, top - h1); c.lineTo(cx + 90, top - h1); c.stroke(); c.restore();
      } };
    }
    /* 中面 → 小面：在畫面內轉 90°（右端往上），輪廓最低點貼桌面 */
    const cs = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
    const hw = (180 * cs + 112 * sn) / 2, hh = (180 * sn + 112 * cs) / 2;
    return { hw, draw: (c, cx, top) => {
      c.save(); c.translate(cx, top - hh); c.rotate(-th);
      M3.block(c, 0, 56, 180, 112, { seed: 9, shadow: false });
      c.restore();
    } };
  }

  /* ═══════════ 第 1～3 步：拉木塊 ═══════════ */
  function pullStep(c, s, a) {
    const n = Math.min(s.n, 3) - 1, u = s.n <= 3 ? s.u : 99, F = FACES[n];
    const pt = PULL_T[n];
    const t = s.n <= 3 ? seg(u, pt[0], pt[1]) : 1;
    const ret = n > 0 && s.n <= 3 ? ease(seg(u, RET[0], RET[1])) : 1;
    const flip = n > 0 && s.n <= 3 ? seg(u, FLIP[0], FLIP[1]) : 1;
    const flipping = n > 0 && flip < 1;
    /* 翻面前（拉回原位這段）還是上一種擺法 */
    const bn = n > 0 && flip <= 0 ? n - 1 : n;
    const cOn = n === 0 ? fin(s, 1, 0.5, 0.6) : (s.n <= 3 ? ease(seg(u, FLIP[1], FLIP[1] + 0.5)) : 1);
    const contact = flipping || bn !== n ? 1 : cOn;
    const SB = sideBlock(bn, bn === n ? flip : 1, contact);
    const res = M3.pullScene(c, {
      a, t, peak: PEAK, mat: 'wood', sheet: 10,
      block: { w: SB.hw * 2, h: 78 }, blockCx: HOOK_X - SB.hw,
      shift: (1 - ret) * M3.PULL.slide,
      drawBlock: (cc, cx, top) => SB.draw(cc, cx, top),
      graph: { panel: GRAPH, ghosts: FACES.slice(0, n).map(() => ({ peak: PEAK, a: 0.5 })) }
    });
    /* 接觸面標籤（桌面下方、跟著木塊走） */
    const la = a * (flipping ? 0 : contact) * (bn === n ? 1 : 0);
    const FB = FACES[bn];
    if (bn !== n) P(c, a * (1 - seg(u, FLIP[0] - 0.3, FLIP[0])), L('接觸面：' + FB.zh, 'Contact: ' + FB.en), res.block.cx, TOP + 50, YEL, 20);
    else P(c, la, L('接觸面：' + F.zh, 'Contact: ' + F.en), res.block.cx, TOP + 50, YEL, 20);

    /* 右上角：立體小窗 */
    inset(c, s, n, a);
    /* 左上：步驟標題 */
    const titleA = a * (s.n === 1 ? fin(s, 1, 0.2, 0.5) : 1);
    P(c, titleA, L('第 ' + (n + 1) + ' 次：' + F.zh + '朝下', 'Test ' + (n + 1) + ': ' + F.en), 24, M3.KEY_Y, WHITE, 24, 'left');
    /* 結論字卡：滑動後 */
    const tc = pt[0] + (M3.PULL.TSLIP + 0.04) * (pt[1] - pt[0]);
    const ca = s.n <= 3 ? fin(s, n + 1, tc, 0.5) : 1;
    M3.caption(c, a * ca, L('最大靜摩擦力 ＝ ' + PEAK + ' gw', 'Max static friction = ' + PEAK + ' gw'), FR, CAP.x, CAP.y, 24);
  }

  /* 右上角小窗：斜上方看的木塊＋黃色接觸面 */
  function inset(c, s, n, a) {
    if (a <= 0.02) return;
    const I = INSET, cx = (I.x0 + I.x1) / 2, sc = 0.55;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0, 14); c.stroke(); c.restore();
      /* 地面線 */
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(I.x0 + 14, I.base + 4); c.lineTo(I.x1 - 14, I.base + 4); c.stroke(); c.restore();
    });
    T(c, a, L('黃色 ＝ 接觸面', 'Yellow = contact'), cx, I.y0 + 26, YEL, 20);
    const u = s.n <= 3 ? s.u : 99;
    const draw1 = (k, al, lift, gl) => {
      const F = FACES[k], x0 = cx - w3d(F, sc) / 2;
      block3d(c, x0, I.base, F, sc, { a: a * al, lift, glow: gl });
    };
    if (n === 0) {
      const e = s.n === 1 ? ease(seg(u, 0.5, 1.3)) : 1;
      draw1(0, 1, 22 * e, e);
    } else {
      const outA = s.n <= 3 ? 1 - ease(seg(u, FLIP[0], FLIP[0] + 0.5)) : 0;
      const inA = s.n <= 3 ? ease(seg(u, FLIP[0] + 0.3, FLIP[1] - 0.2)) : 1;
      const e = s.n <= 3 ? ease(seg(u, FLIP[1], FLIP[1] + 0.8)) : 1;
      if (outA > 0.02) draw1(n - 1, outA, 22, 1);
      draw1(n, inA, 22 * e, e);
    }
    /* 擺法名稱 */
    const nameN = n > 0 && s.n <= 3 && u < FLIP[0] + 0.5 ? n - 1 : n;
    P(c, a, L(FACES[nameN].zh + '朝下', FACES[nameN].En + ' down'), cx, I.y1 - 34, WHITE, 20);
  }

  /* ═══════════ 第 4 步：三次一樣 ═══════════ */
  function bars(c, s, a) {
    if (a <= 0.02) return;
    const u = s.u, hiA = ease(seg(u, 5.0, 5.7)), h = PEAK * BAR.k;
    withA(c, a, () => {
      W5.arrow(c, BAR.axisX, BAR.base, BAR.axisX, BAR.base - 80 * BAR.k - 26, WHITE, 2.5, 11);
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(BAR.axisX, BAR.base); c.lineTo(BAR.xs[2] + 80, BAR.base); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.08)'; c.lineWidth = 1.2;
      [40, 80].forEach(v => { const y = BAR.base - v * BAR.k; c.beginPath(); c.moveTo(BAR.axisX, y); c.lineTo(BAR.xs[2] + 80, y); c.stroke(); });
      c.restore();
      [0, 40, 80].forEach(v => T(c, 1, String(v), BAR.axisX - 10, BAR.base - v * BAR.k, COL.dim, 18, 'right', true));
    });
    FACES.forEach((F, i) => {
      const g = ease(seg(u, 1.0 + i * 1.1, 2.0 + i * 1.1)), x = BAR.xs[i];
      const ia = a * fin(s, 4, 0.8 + i * 1.1, 0.4);
      const col = W5.mix(FR, YEL, hiA), hh = h * g;
      withA(c, ia, () => {
        if (hh > 1) {
          if (hiA > 0.02) W5.glow(c, x, BAR.base - hh / 2, 110, YEL, 0.12 * hiA);
          const gr = c.createLinearGradient(0, BAR.base - hh, 0, BAR.base);
          gr.addColorStop(0, 'rgba(11,26,21,0)'); gr.addColorStop(1, 'rgba(11,26,21,0.45)');
          c.save(); W5.rr(c, x - BAR.w / 2, BAR.base - hh, BAR.w, hh, 6); c.fillStyle = col; c.fill(); c.fillStyle = gr; c.fill();
          c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2; c.stroke(); c.restore();
          T(c, 1, Math.round(PEAK * g) + ' gw', x, BAR.base - hh - 22, hiA > 0.5 ? YEL : FR, 22, 'center', true);
        }
        /* 長條上方：擺法縮圖（立體、黃色接觸面） */
        const sc = 0.42, F3 = FACES[i];
        block3d(c, x - w3d(F3, sc) / 2, BAR.base - h - 52, F3, sc, { lift: 12, glow: 1 });
        T(c, 1, L(F.zh, F.En), x, BAR.base + 28, WHITE, 20);
      });
    });
    /* 三條頂端的黃色虛線：一樣高 */
    const dl = ease(seg(u, 4.4, 5.2));
    if (dl > 0.02) withA(c, a, () => {
      const y = BAR.base - h, x0 = BAR.xs[0] - BAR.w / 2 - 14, x1 = lerp(x0, BAR.xs[2] + BAR.w / 2 + 14, dl);
      c.save(); c.setLineDash([10, 7]); c.strokeStyle = YEL; c.lineWidth = 3; c.shadowColor = YEL; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.restore();
    });
    M3.caption(c, a * fin(s, 4, 5.6, 0.6), L('接觸面積不同，峰值都是 70 gw', 'Different contact areas, same peak: 70 gw'), YEL, 480, M3.Q_Y, 24);
    T(c, a * fin(s, 4, 6.3, 0.6), L('（一般乾摩擦的簡化模型）', '(simple dry-friction model)'), 480, M3.Q_Y + 38, COL.dim, 20);
    M3.march(c, 'explaining', 862, 540, { sc: 0.56, a: a * fin(s, 4, 6.6, 0.6) });
  }

  /* ═══════════ 固定的角落標籤 ═══════════ */
  function tags(c, a) {
    T(c, a, L('木塊 200 gw・木板・0 顆砝碼（不變）', 'Block 200 gw · wood board · no masses'), 24, TAG_Y[0], COL.dim, 20, 'left');
    T(c, a, L('只改朝下的那一面', 'Only the face touching the board changes'), 24, TAG_Y[1], PUSH, 20, 'left');
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a0 = s.n === 1 ? s.k : 1;
    M3.backdrop(c, { gy: GY, cell: 40, glow: COL.teal, gx: 320 });
    M3.ground(c, GY);
    if (s.n <= 3) pullStep(c, s, a0);
    else {
      pullStep(c, s, fout(s, 4, 0.0, 0.45));
      P(c, fin(s, 4, 0.5, 0.5), L('三次一樣', 'All three are equal'), 480, M3.KEY_Y, WHITE, 24);
      bars(c, s, fin(s, 4, 0.5, 0.6));
    }
    tags(c, a0);
  }

  W5.register('area', { canvas: 'cvs-area', steps: DUR, draw });
})();
