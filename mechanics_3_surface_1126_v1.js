/* ==================================================================
   mechanics_3 ｜ 材質（cvs-surface，960×540）
   四步：1 光滑塑膠（峰值 40 gw）→ 2 木板（70 gw）→ 3 粗砂紙（110 gw）→ 4 比較三次（長條圖）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   場景：M3.pullScene（本支新增到 common，area、normal 沿用）——桌上鋪材質板、木塊 200 gw（大面朝下、0 顆砝碼），
         March 用彈簧秤水平往右拉；讀數升到峰值 → 木塊滑動、讀數掉下來 → 秤上與左上曲線圖都保留「峰值」標籤。
         第 2、3 步開頭：材質板換新（淡入淡出）、木塊被拉回原位；曲線圖保留前幾次的淡色虛線，方便比較。
   右上角：放大鏡看材質紋理（塑膠光滑、木紋起伏、砂粒粗糙）。左下角固定標「木塊 200 gw・大面・0 顆砝碼（不變）」「只改桌面材質」。
   第 4 步：場景淡出，換成三條長條（40／70／110 gw，比例尺 1.9 px／gw），各長條下方放材質小圖；最大那條轉黃色強調；
         頂端黃色結論「越粗糙，最大靜摩擦力越大」。
   數字（照簡報）：峰值 40／70／110 gw；滑動後的讀數只畫出「掉下來」，不寫數字。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.pullScene) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout;
  const WHITE = COL.white, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = M3.FC.net;
  const TAU = Math.PI * 2;
  const DUR = [11, 11, 11, 11];      /* 總長 44 秒 */

  const GY = M3.GY;
  const MATS = [
    { key: 'plastic',   peak: 40,  zh: '光滑塑膠', en: 'Smooth plastic' },
    { key: 'wood',      peak: 70,  zh: '木板',     en: 'Wooden board' },
    { key: 'sandpaper', peak: 110, zh: '粗砂紙',   en: 'Coarse sandpaper', enShort: 'Sandpaper' }
  ];
  const PULL_T = [1.4, 9.2];         /* 第 1～3 步：拉動進度 t 0→1 的起訖秒 */
  const INTRO = [0.1, 1.2];          /* 第 2、3 步：換材質板、木塊拉回原位 */
  const LENS = { x: 852, y: 138, r: 72 };
  const CAP = { x: 700, y: 500 };    /* 第 1～3 步的結論字卡 */
  const TAG_Y = [496, 526];          /* 左下角固定標籤 */
  /* 第 4 步長條圖 */
  const BAR = { base: 404, k: 1.9, w: 100, xs: [300, 480, 660], axisX: 200 };

  M3.preload(['tug', 'explaining']);

  /* ═══════════ 放大鏡裡的材質剖面 ═══════════ */
  const PROF = {
    plastic:   M3.teethPair(4, -100, 100, 0, { period: 46, amp: 2, jit: 0.3, bite: 0 }).low,
    wood:      M3.teethPair(8, -100, 100, 0, { period: 30, amp: 10, jit: 0.8, bite: 0 }).low,
    sandpaper: M3.teethPair(12, -100, 100, 0, { period: 22, amp: 5, jit: 0.8, bite: 0 }).low
  };
  function lensInner(c, key, cx, cy, r) {
    const g = c.createRadialGradient(cx, cy - r * 0.3, 10, cx, cy, r * 1.2);
    g.addColorStop(0, '#1d3d33'); g.addColorStop(1, '#0f241d');
    c.fillStyle = g; c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    const base = cy + 14;
    const pts = PROF[key].map(p => ({ x: cx + p.x, y: base + p.y }));
    M3.teethFill(c, pts, cy + r + 10, key, { lw: 0.9, seed: 7, glow: 0.5 });
    if (key === 'sandpaper') {
      /* 一顆顆砂粒（大小不一、尖角） */
      for (let i = 0, x = cx - r - 6; x < cx + r + 8; i++) {
        const rr = 7 + 6 * hash(i * 3.3 + 1), y = base - rr * 0.55 + 3 * hash(i * 7.1);
        const gg = c.createRadialGradient(x - rr * 0.35, y - rr * 0.4, 1, x, y, rr);
        gg.addColorStop(0, '#f7e2b5'); gg.addColorStop(0.45, '#c89a5c'); gg.addColorStop(1, '#6e4f27');
        c.fillStyle = gg; c.strokeStyle = 'rgba(60,38,14,0.8)'; c.lineWidth = 1.5;
        c.beginPath();
        const nv = 6;
        for (let k = 0; k < nv; k++) { const q = k / nv * TAU + hash(i + k * 1.9), rk = rr * (0.75 + 0.35 * hash(i * 5 + k)); c.lineTo(x + Math.cos(q) * rk, y + Math.sin(q) * rk); }
        c.closePath(); c.fill(); c.stroke();
        x += rr * 1.45;
      }
    }
    if (key === 'plastic') {
      /* 光滑表面的反光 */
      c.save(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - 40, base + 10); c.lineTo(cx + 6, base + 10); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 18, base + 18); c.lineTo(cx + 44, base + 18); c.stroke();
      c.restore();
    }
  }
  function lens(c, key, keyPrev, swap, a) {
    if (a <= 0.02) return;
    M3.magnifier(c, LENS.x, LENS.y, LENS.r, { a, handle: 2.35, len: 44, inner: cc => {
      if (keyPrev && swap < 1) lensInner(cc, keyPrev, LENS.x, LENS.y, LENS.r);
      if (!keyPrev || swap >= 1) lensInner(cc, key, LENS.x, LENS.y, LENS.r);
      else withA(cc, swap, () => lensInner(cc, key, LENS.x, LENS.y, LENS.r));
    } });
  }

  /* ═══════════ 第 1～3 步：拉木塊 ═══════════ */
  function pullStep(c, s, a) {
    const n = Math.min(s.n, 3), u = s.n <= 3 ? s.u : 99, M = MATS[n - 1], Mp = n > 1 ? MATS[n - 2] : null;
    const t = s.n <= 3 ? seg(u, PULL_T[0], PULL_T[1]) : 1;
    const ret = Mp && s.n <= 3 ? ease(seg(u, INTRO[0], INTRO[1])) : 1;
    const swap = Mp && s.n <= 3 ? ease(seg(u, INTRO[0], INTRO[1] - 0.2)) : 1;
    M3.pullScene(c, {
      a, t, peak: M.peak, mat: M.key, matPrev: Mp ? Mp.key : null, swap,
      shift: (1 - ret) * M3.PULL.slide, sheet: 10,
      graph: { ghosts: MATS.slice(0, n - 1).map(m => ({ peak: m.peak })) }
    });
    /* 右上角：放大鏡＋材質名稱 */
    lens(c, M.key, Mp ? Mp.key : null, swap, a);
    P(c, a, L(M.zh, M.enShort || M.en), LENS.x, LENS.y + LENS.r + 30, WHITE, 22);
    /* 頂端步驟標題 */
    const titleA = a * (s.n === 1 ? fin(s, 1, 0.2, 0.5) : 1);
    P(c, titleA, L('第 ' + n + ' 次：' + M.zh, 'Test ' + n + ': ' + M.en.toLowerCase()), 590, M3.KEY_Y, WHITE, 24);
    /* 結論字卡：滑動後 */
    const tc = PULL_T[0] + (M3.PULL.TSLIP + 0.04) * (PULL_T[1] - PULL_T[0]);
    const ca = s.n <= 3 ? fin(s, n, tc, 0.5) : 1;
    M3.caption(c, a * ca, L('最大靜摩擦力 ＝ ' + M.peak + ' gw', 'Max static friction = ' + M.peak + ' gw'), FR, CAP.x, CAP.y, 24);
  }

  /* ═══════════ 第 4 步：長條圖 ═══════════ */
  function swatch(c, key, cx, y, a) {
    M3.slab(c, cx - 56, y, cx + 56, y + 26, key, { a, seed: 5, r: 4 });
  }
  function bars(c, s, a) {
    if (a <= 0.02) return;
    const u = s.u, hiA = ease(seg(u, 5.2, 5.9));
    withA(c, a, () => {
      /* 軸 */
      W5.arrow(c, BAR.axisX, BAR.base, BAR.axisX, BAR.base - 120 * BAR.k - 16, WHITE, 2.5, 11);
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(BAR.axisX, BAR.base); c.lineTo(BAR.xs[2] + 90, BAR.base); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.08)'; c.lineWidth = 1.2;
      [40, 80, 120].forEach(v => { const y = BAR.base - v * BAR.k; c.beginPath(); c.moveTo(BAR.axisX, y); c.lineTo(BAR.xs[2] + 90, y); c.stroke(); });
      c.restore();
      [0, 40, 80, 120].forEach(v => T(c, 1, String(v), BAR.axisX - 10, BAR.base - v * BAR.k, COL.dim, 18, 'right', true));
      T(c, 1, L('最大靜摩擦力（gw）', 'Max static friction (gw)'), BAR.axisX + 14, BAR.base - 120 * BAR.k - 4, FR, 20, 'left');
    });
    MATS.forEach((m, i) => {
      const g = ease(seg(u, 1.0 + i * 1.2, 2.1 + i * 1.2)), x = BAR.xs[i];
      const ia = a * fin(s, 4, 0.8 + i * 1.2, 0.4);
      const top = m.peak === 110;
      const col = W5.mix(FR, YEL, top ? hiA : 0);
      const h = m.peak * BAR.k * g;
      withA(c, ia, () => {
        if (h > 1) {
          if (top && hiA > 0.02) W5.glow(c, x, BAR.base - h / 2, 150, YEL, 0.18 * hiA);
          const gr = c.createLinearGradient(0, BAR.base - h, 0, BAR.base);
          gr.addColorStop(0, 'rgba(11,26,21,0)'); gr.addColorStop(1, 'rgba(11,26,21,0.45)');
          c.save(); W5.rr(c, x - BAR.w / 2, BAR.base - h, BAR.w, h, 6); c.fillStyle = col; c.fill(); c.fillStyle = gr; c.fill();
          c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2; c.stroke(); c.restore();
          /* 數到 peak 的數字 */
          T(c, 1, Math.round(m.peak * g) + ' gw', x, BAR.base - h - 22, top && hiA > 0.5 ? YEL : FR, 22, 'center', true);
        }
        swatch(c, m.key, x, BAR.base + 14, 1);
        T(c, 1, L(m.zh, m.en), x, BAR.base + 64, WHITE, 20);
      });
    });
    /* 結論 */
    M3.caption(c, a * fin(s, 4, 6.0, 0.6), L('越粗糙，最大靜摩擦力越大', 'Rougher surface → larger max static friction'), YEL, 480, 112, 24);
    /* March 在右下角講解 */
    M3.march(c, 'explaining', 862, 540, { sc: 0.56, a: a * fin(s, 4, 6.4, 0.6) });
  }

  /* ═══════════ 固定的角落標籤 ═══════════ */
  function tags(c, a) {
    T(c, a, L('木塊 200 gw・大面・0 顆砝碼（不變）', 'Block 200 gw · large face · 0 masses (unchanged)'), 24, TAG_Y[0], COL.dim, 20, 'left');
    T(c, a, L('只改桌面材質', 'Only the surface material changes'), 24, TAG_Y[1], PUSH, 20, 'left');
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const a0 = s.n === 1 ? s.k : 1;
    M3.backdrop(c, { gy: GY, cell: 40, glow: COL.teal, gx: 320 });
    M3.ground(c, GY);
    if (s.n <= 3) pullStep(c, s, a0);
    else {
      pullStep(c, s, fout(s, 4, 0.0, 0.7));
      P(c, fin(s, 4, 0.5, 0.5), L('比較三次', 'Compare all three'), 480, M3.KEY_Y, WHITE, 24);
      bars(c, s, fin(s, 4, 0.5, 0.6));
    }
    tags(c, a0);
  }

  W5.register('surface', { canvas: 'cvs-surface', steps: DUR, draw });
})();
