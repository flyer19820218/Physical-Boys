/* ==================================================================
   mechanics_2 ｜ 三力平衡：任意兩力的合力，與第三力成二力平衡（cvs-threef，960×540）
   四步：1 三力拉小環 → 2 先合成兩力 → 3 合力對上第三力 → 4 任選兩力都行
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_fdraw／online／twof。

   比例：PX_PER_GW＝2.4（1 gw＝2.4 px，整支動畫不變，同 twof）；比例尺 1 格＝10 gw＝24 px。
         桌面上畫淡格線（以小環為原點、每格 24 px），30 gw＝3 格、40 gw＝4 格、50 gw＝5 格。
   力（畫面座標，y 向下；單位 gw）：F₁＝(30, 0) 向右、F₂＝(0, −40) 向上、F₃＝(−30, 40) 朝左下（233.13°）。
         三力和＝0。合力一律由向量相加：R₁₂＝F₁＋F₂、R₂₃＝F₂＋F₃、R₁₃＝F₁＋F₃；
         畫面上的 gw 數一律由向量長度 Math.round(Math.hypot(x, y)) 算出來。
   語意色：F₁＝青、F₂＝粉、F₃＝珊瑚、合力＝黃；小環平衡時發綠光。
   場景（俯視力桌）：左側圓形桌面（深綠、桌緣刻度、格線）；中央金色小環；三條繩拉向桌緣三個滑輪，
         滑輪外掛砝碼（每顆 10 gw：F₁ 3 顆、F₂ 4 顆、F₃ 5 顆）。第 1 步先用插銷固定小環，三力都掛好再拔掉 → 小環不動。
         右側一塊說明面板（x 470～832）；地面線 GY 上站著 March（touch_ready.png 左右翻轉，面向桌子）。
   第 3 步：面板上一把 5 格的尺，把 R₁₂ 與 F₃ 複製一份飛過來並排量；三個檢核依序打勾。
   第 4 步：先合成 F₂＋F₃ → R₂₃ 對上 F₁；再合成 F₁＋F₃ → R₁₃ 對上 F₂；最後三個結論並列成一張小卡。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = [COL.teal, COL.pink, COL.coral], R_COL = COL.yellow, OK_COL = COL.green;
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15';
  const DUR = [9, 10, 10, 10];       /* 總長 39 秒 */
  const DIMA = 0.22;                 /* 淡化時的透明度 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size || 22, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size || 22, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
  /* 固定寬度內的字：先量再縮，最小 22px */
  function fit(c, str, maxW, size, mono) { let z = size; while (z > 22 && W5.tw(c, str, z, mono) > maxW) z--; return z; }

  /* 跨步時間 */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);
  const grow = (s, n, a, b) => (s.n > n ? 1 : s.n < n ? 0 : ease(seg(s.u, a, b)));

  /* ═══════════ 比例與幾何 ═══════════ */
  const PX_PER_GW = 2.4;             /* 1 gw ＝ 2.4 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 比例尺 1 格 ＝ 10 gw ＝ 24 px */
  const CX = 248, CY = 290, RR = 166;              /* 力桌圓心（＝小環）、半徑 */
  const GY = 490;                    /* 地面線（March 站的地方） */
  const KEY_Y = 62, BOT_Y = 515;
  const PX0 = 470, PW = 362, PY0 = 100;            /* 右側說明面板 */
  const MX = 884, SCM = 0.4;         /* March 中心 x、縮放 */

  /* 力（gw，畫面座標 y 向下） */
  const F = [{ x: 30, y: 0 }, { x: 0, y: -40 }, { x: -30, y: 40 }];
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const R12 = add(F[0], F[1]), R23 = add(F[1], F[2]), R13 = add(F[0], F[2]);
  const gwOf = v => Math.round(Math.hypot(v.x, v.y));
  const tip = v => ({ x: CX + v.x * PX_PER_GW, y: CY + v.y * PX_PER_GW });
  const NCHIP = F.map(v => gwOf(v) / 10);          /* 每顆砝碼 10 gw → 3、4、5 顆 */
  const SUB = ['₁', '₂', '₃'];

  /* ═══════════ March（全身圖，左右翻轉面向桌子） ═══════════ */
  const IMG = new Image(); IMG.src = 'assets/characters/march/touch_ready.png';
  const ok = im => im && im.complete && im.naturalWidth;
  const SOLE = 471;                  /* 原圖鞋底所在列 */
  function march(c, a) {
    if (a <= 0.02 || !ok(IMG)) return;
    const w = IMG.naturalWidth * SCM, h = IMG.naturalHeight * SCM, top = GY - SOLE * SCM;
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK; c.beginPath(); c.ellipse(MX, GY + 3, 50, 7, 0, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(MX + w / 2, top); c.scale(-1, 1); c.drawImage(IMG, 0, 0, w, h); c.restore();
    });
  }
  const M_TOP = GY - SOLE * SCM;
  function bubble(c, a, str, col) {
    if (a <= 0.02) return;
    /* 放在 March 左邊（面板下方），尾巴指向 March 的嘴 */
    const w = W5.tw(c, str, 24) + 28, xr = MX - 40, cx = xr - w / 2, cy = M_TOP + 70;
    const mx = MX - 30, my = M_TOP + 42;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath(); c.moveTo(xr - 24, cy - 18); c.lineTo(mx, my); c.lineTo(xr - 6, cy - 10); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(xr - 24, cy - 20); c.lineTo(mx, my); c.lineTo(xr - 4, cy - 12); c.stroke();
    });
    P(c, a, str, cx, cy, col, 24, 'center');
  }

  /* ═══════════ 地面（同 twof） ═══════════ */
  function floor(c, a) {
    withA(c, a, () => {
      const gl = c.createRadialGradient(CX, CY, 30, CX, CY, 520);
      gl.addColorStop(0, 'rgba(255,224,102,0.05)'); gl.addColorStop(1, 'rgba(255,224,102,0)');
      c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
      const g = c.createLinearGradient(0, GY, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(0, GY, 960, 540 - GY);
      const e = c.createLinearGradient(0, 0, 960, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
    });
  }

  /* ═══════════ 力桌（俯視） ═══════════ */
  const pulley = v => { const m = Math.hypot(v.x, v.y); return { x: CX + RR * v.x / m, y: CY + RR * v.y / m, ux: v.x / m, uy: v.y / m }; };
  const PUL = F.map(pulley);
  function tableTop(c) {
    c.save();
    c.shadowColor = 'rgba(11,26,21,0.7)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
    const g = c.createRadialGradient(CX - 40, CY - 50, 20, CX, CY, RR + 14);
    g.addColorStop(0, '#2a5c52'); g.addColorStop(1, '#173a32');
    c.fillStyle = g; c.beginPath(); c.arc(CX, CY, RR + 10, 0, TAU); c.fill();
    c.restore();
    c.save(); c.lineWidth = 5; c.strokeStyle = '#7fa396'; c.beginPath(); c.arc(CX, CY, RR + 10, 0, TAU); c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(11,26,21,0.6)'; c.beginPath(); c.arc(CX, CY, RR + 13, 0, TAU); c.stroke(); c.restore();
    /* 格線：以小環為原點，每格 10 gw */
    c.save(); c.beginPath(); c.arc(CX, CY, RR - 30, 0, TAU); c.clip();
    c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1.2;
    for (let k = -7; k <= 7; k++) {
      c.beginPath(); c.moveTo(CX + k * CELL, CY - RR); c.lineTo(CX + k * CELL, CY + RR); c.stroke();
      c.beginPath(); c.moveTo(CX - RR, CY + k * CELL); c.lineTo(CX + RR, CY + k * CELL); c.stroke();
    }
    c.restore();
    /* 桌緣刻度 */
    c.save(); c.lineCap = 'round';
    for (let d = 0; d < 360; d += 10) {
      const big = d % 30 === 0, r = d * Math.PI / 180, r0 = RR - (big ? 24 : 13), r1 = RR - 3;
      c.strokeStyle = big ? 'rgba(246,243,234,0.4)' : 'rgba(246,243,234,0.2)'; c.lineWidth = big ? 2.5 : 1.5;
      c.beginPath(); c.moveTo(CX + r0 * Math.cos(r), CY - r0 * Math.sin(r)); c.lineTo(CX + r1 * Math.cos(r), CY - r1 * Math.sin(r)); c.stroke();
    }
    c.restore();
  }
  /* 砝碼串：滑輪外，沿拉線方向排一列小方塊 */
  function chips(c, i, a) {
    if (a <= 0.02) return;
    const p = PUL[i], n = NCHIP[i], col = F_COL[i];
    const cols = Math.abs(p.ux) > 0.9 ? 1 : Math.min(n, 3), rows = Math.ceil(n / cols), cw = cols * 23 - 3, ch = rows * 17 - 3;
    const d = 24 + Math.abs(p.ux) * cw / 2 + Math.abs(p.uy) * ch / 2;
    const ccx = p.x + p.ux * d, ccy = p.y + p.uy * d;
    withA(c, a, () => {
      c.strokeStyle = '#d9c9a3'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(ccx, ccy); c.stroke();
      for (let k = 0; k < n; k++) {
        const row = Math.floor(k / cols), cl = k % cols, cnt = Math.min(cols, n - row * cols);
        const x = ccx - (cnt * 23 - 3) / 2 + cl * 23, y = ccy - ch / 2 + row * 17;
        chip(c, x, y, col);
      }
    });
  }
  function chip(c, x, y, col) {
    const g = c.createLinearGradient(0, y, 0, y + 14);
    g.addColorStop(0, W5.mix(col, '#ffffff', 0.45)); g.addColorStop(1, W5.mix(col, '#0b1a15', 0.25));
    c.fillStyle = g; W5.rr(c, x, y, 20, 14, 3); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.6; W5.rr(c, x, y, 20, 14, 3); c.stroke();
  }
  /* 繩子＋滑輪 */
  function rope(c, i, a) {
    if (a <= 0.02) return;
    const p = PUL[i], col = F_COL[i];
    withA(c, a, () => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 6; c.beginPath(); c.moveTo(CX, CY); c.lineTo(p.x, p.y); c.stroke();
      c.strokeStyle = '#d9c9a3'; c.lineWidth = 3; c.beginPath(); c.moveTo(CX, CY); c.lineTo(p.x, p.y); c.stroke();
    });
    withA(c, Math.max(a, 0.5), () => {
      c.fillStyle = '#11261f'; c.strokeStyle = col; c.lineWidth = 4.5; c.beginPath(); c.arc(p.x, p.y, 12, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fill();
    });
  }
  /* 金色小環（glow：平衡的綠光） */
  function ring(c, glow) {
    if (glow > 0.02) W5.glow(c, CX, CY, 64, OK_COL, 0.55 * glow);
    c.save(); c.shadowColor = W5.rgba(R_COL, 0.7); c.shadowBlur = 10;
    c.strokeStyle = '#f2c94c'; c.lineWidth = 7; c.beginPath(); c.arc(CX, CY, 12, 0, TAU); c.stroke(); c.restore();
    c.save(); c.strokeStyle = '#8a6a10'; c.lineWidth = 1.5; c.beginPath(); c.arc(CX, CY, 15.5, 0, TAU); c.stroke(); c.beginPath(); c.arc(CX, CY, 8.5, 0, TAU); c.stroke(); c.restore();
  }
  /* 插銷（第 1 步）：off 0..1 拔出 */
  function pin(c, off) {
    const a = 1 - off; if (a <= 0.02) return;
    const x = CX + 26 * off, y = CY - 40 * off;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; c.beginPath(); c.arc(x + 3, y + 4, 10, 0, TAU); c.fill();
      W5.ball(c, x, y, 9, '#c9d4d0');
      c.strokeStyle = '#4b5754'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke();
    });
  }

  /* ═══════════ 力的箭頭（深色描邊＋光暈，同 twof） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  /* 從小環出發的力：向量 v（gw），長出比例 g */
  function vecArrow(c, v, g, a, col, lw) {
    if (g <= 0.01) return;
    fArrow(c, CX, CY, CX + v.x * PX_PER_GW * g, CY + v.y * PX_PER_GW * g, a, col, lw);
  }
  /* 平行四邊形的兩條虛線：從 a 尖端沿 b、從 b 尖端沿 a */
  function para(c, va, vb, g1, g2, a) {
    if (a <= 0.02) return;
    const A = tip(va), B = tip(vb);
    withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5;
      if (g1 > 0.01) { c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(A.x + vb.x * PX_PER_GW * g1, A.y + vb.y * PX_PER_GW * g1); c.stroke(); }
      if (g2 > 0.01) { c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(B.x + va.x * PX_PER_GW * g2, B.y + va.y * PX_PER_GW * g2); c.stroke(); }
      c.restore();
    });
  }
  /* 箭頭尖的脈衝圈 */
  function pulse(c, x, y, col, a, u0, u) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      W5.glow(c, x, y, 26, col, 0.5);
      if (u >= u0 && u < u0 + 1.6) { const ph = ((u - u0) % 0.8) / 0.8; c.strokeStyle = W5.rgba(col, 0.9 * (1 - ph)); c.lineWidth = 3; c.beginPath(); c.arc(x, y, 10 + 22 * ph, 0, TAU); c.stroke(); }
    });
  }

  /* 打勾（自己畫，不靠字型，同 twof） */
  function check(c, x, y, r, g, a) {
    if (g <= 0.01) return;
    withA(c, a, () => {
      c.strokeStyle = OK_COL; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = W5.rgba(OK_COL, 0.7); c.shadowBlur = 10;
      const p1 = [x - r, y], p2 = [x - r * 0.3, y + r * 0.7], p3 = [x + r, y - r * 0.8];
      const g1 = clamp01(g * 2.5), g2 = clamp01(g * 2.5 - 1);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(lerp(p1[0], p2[0], g1), lerp(p1[1], p2[1], g1));
      if (g > 0.4) c.lineTo(lerp(p2[0], p3[0], g2), lerp(p2[1], p3[1], g2));
      c.stroke();
    });
  }
  /* 雙向箭頭（↔，自己畫） */
  function dblArrow(c, x0, x1, y, a, col) {
    withA(c, a, () => { W5.arrow(c, (x0 + x1) / 2, y, x1, y, col, 3, 11); W5.arrow(c, (x0 + x1) / 2, y, x0, y, col, 3, 11); });
  }

  /* 右側面板底板 */
  function panel(c, a, y1) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, PX0, PY0, PW, y1 - PY0, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, PX0, PY0, PW, y1 - PY0, 16); c.stroke();
    });
  }
  /* 比例尺小圖例（左下角地面上） */
  function legend(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(22, BOT_Y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(22, BOT_Y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), 22 + CELL + 10, BOT_Y, DIM, 22, 'left');
  }
  function glowBottom(c, a, str, col) {
    col = col || R_COL;
    if (a > 0.02) W5.glow(c, 520, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 520, BOT_Y, col, 24, 'center');
  }

  /* ═══════════ 力的標籤位置（避開繩子、平行四邊形與彼此） ═══════════ */
  const FLAB = [
    { x: CX + 60, y: CY + 44, al: 'left' },    /* F₁：箭頭下方偏右（避開 R₁₃ 的平行四邊形） */
    { x: CX - 16, y: CY - 116, al: 'right' },  /* F₂：箭頭尖左側 */
    { x: CX - 80, y: CY + 78, al: 'right' }    /* F₃：箭頭尖左上 */
  ];
  function fLabel(c, i, a) {
    const q = FLAB[i];
    P(c, a, 'F' + SUB[i] + ' = ' + gwOf(F[i]) + ' gw', q.x, q.y, F_COL[i], 22, q.al, true);
  }

  /* ═══════════ 每一步的場景狀態（跳步進來也成立） ═══════════ */
  function stateOf(s) {
    const S = { rope: [1, 1, 1], g: [1, 1, 1], a: [1, 1, 1], lab: [1, 1, 1], pin: 1, glow: 0,
      r12: 0, r12a: 0, p12: [0, 0], p12a: 0, r23: 0, p23: [0, 0], cA: 0, r13: 0, p13: [0, 0], cB: 0 };
    const n = s.n, u = s.u;
    if (n === 1) {
      const T0 = [0.8, 2.3, 3.8];
      for (let i = 0; i < 3; i++) {
        S.rope[i] = ease(seg(u, T0[i], T0[i] + 0.5));
        S.g[i] = ease(seg(u, T0[i] + 0.5, T0[i] + 1.2));
        S.lab[i] = ease(seg(u, T0[i] + 1.2, T0[i] + 1.6));
      }
      S.pin = 1 - ease(seg(u, 5.6, 6.2));
      S.glow = ease(seg(u, 6.2, 6.8));
    } else if (n === 2) {
      S.pin = 0; S.glow = 1 - ease(seg(u, 0, 0.6));
      S.a[2] = lerp(1, DIMA, ease(seg(u, 0.2, 0.8))); S.lab[2] = S.a[2];
      S.p12 = [ease(seg(u, 1.0, 1.8)), ease(seg(u, 1.6, 2.4))]; S.p12a = 1;
      S.r12 = ease(seg(u, 2.6, 3.6)); S.r12a = 1;
    } else if (n === 3) {
      S.pin = 0;
      const d = ease(seg(u, 0.2, 0.8));
      S.a[0] = S.a[1] = lerp(1, DIMA, d); S.lab[0] = S.lab[1] = S.a[0];
      S.a[2] = S.lab[2] = lerp(DIMA, 1, d);
      S.p12 = [1, 1]; S.p12a = lerp(1, 0.3, d); S.r12 = 1; S.r12a = 1;
      S.glow = ease(seg(u, 7.8, 8.4));
    } else {
      S.pin = 0;
      const o = ease(seg(u, 0, 0.5));                    /* 收掉第 3 步的 R₁₂ */
      S.r12 = 1; S.r12a = 1 - o; S.p12 = [1, 1]; S.p12a = 0.3 * (1 - o);
      /* A：F₂＋F₃ → R₂₃（對上 F₁） */
      const A1 = ease(seg(u, 2.8, 3.2)), A2 = ease(seg(u, 4.2, 4.6));
      S.p23 = [ease(seg(u, 0.8, 1.6)), ease(seg(u, 0.8, 1.6))]; S.r23 = ease(seg(u, 1.6, 2.4));
      S.cA = ease(seg(u, 0.6, 1.0)) * (1 - A2);
      /* B：F₁＋F₃ → R₁₃（對上 F₂） */
      const B1 = ease(seg(u, 6.8, 7.2)), B2 = ease(seg(u, 8.0, 8.5));
      S.p13 = [ease(seg(u, 4.8, 5.6)), ease(seg(u, 4.8, 5.6))]; S.r13 = ease(seg(u, 5.6, 6.4));
      S.cB = ease(seg(u, 4.6, 5.0)) * (1 - B2);
      let a1, a2, a3;
      if (u < 4.2) {
        a1 = lerp(DIMA, 1, A1);
        a2 = lerp(lerp(DIMA, 1, ease(seg(u, 0.2, 0.7))), 0.35, A1);
        a3 = lerp(1, 0.35, A1);
      } else if (u < 6.8) {
        a1 = 1; a2 = lerp(0.35, DIMA, A2); a3 = lerp(0.35, 1, A2);
      } else {
        a1 = lerp(lerp(1, 0.35, B1), 1, B2); a2 = lerp(lerp(DIMA, 1, B1), 1, B2); a3 = lerp(lerp(1, 0.35, B1), 1, B2);
      }
      S.a = [a1, a2, a3]; S.lab = [a1, a2, a3];
      S.glow = B2;
    }
    return S;
  }

  /* ═══════════ 力桌主場景 ═══════════ */
  function scene(c, s, S) {
    tableTop(c);
    for (let i = 0; i < 3; i++) { rope(c, i, S.rope[i]); chips(c, i, S.rope[i]); }
    ring(c, S.glow);
    /* 平行四邊形虛線（在箭頭下面） */
    para(c, F[0], F[1], S.p12[0], S.p12[1], S.p12a);
    para(c, F[1], F[2], S.p23[0], S.p23[1], S.cA);
    para(c, F[0], F[2], S.p13[0], S.p13[1], S.cB);
    for (let i = 0; i < 3; i++) vecArrow(c, F[i], S.g[i], S.a[i], F_COL[i]);
    vecArrow(c, R12, S.r12, S.r12a, R_COL, 8);
    vecArrow(c, R23, S.r23, S.cA, R_COL, 8);
    vecArrow(c, R13, S.r13, S.cB, R_COL, 8);
    pin(c, 1 - S.pin);                                   /* 插銷蓋在箭頭尾巴上，看得見 */
    for (let i = 0; i < 3; i++) fLabel(c, i, S.lab[i] * (S.g[i] > 0.98 ? 1 : 0));
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const S = stateOf(s);
    floor(c, 1);
    withA(c, s.n === 1 ? s.k : 1, () => scene(c, s, S));
    legend(c, s.n === 1 ? s.k : 1);
    march(c, s.n === 1 ? s.k : 1);
    if (s.n === 1) step1(c, s, S);
    if (s.n === 2) step2(c, s, S);
    if (s.n === 3) step3(c, s, S);
    if (s.n === 4) step4(c, s, S);
  }

  /* ── 第 1 步：三力拉小環 ── */
  function step1(c, s, S) {
    const n = 1;
    P(c, fin(s, n, 0.3, 0.5), L('三個力一起拉小環', 'Three forces pull one ring'), 480, KEY_Y, WHITE, 24);
    /* 插銷說明（拔掉時淡出） */
    T(c, fin(s, n, 0.5, 0.4) * fout(s, n, 5.4, 0.4), L('插銷固定小環', 'Pinned'), CX + 30, CY - 44, DIM, 22, 'left');
    /* 面板：砝碼換算成力 */
    const pa = fin(s, n, 0.6, 0.5), y1 = 334;
    panel(c, pa, y1);
    T(c, pa, L('每顆砝碼 ＝ 10 gw', 'Each weight = 10 gw'), PX0 + PW / 2, PY0 + 30, WHITE, 22);
    const T0 = [0.8, 2.3, 3.8];
    for (let i = 0; i < 3; i++) {
      const a = S.rope[i], y = PY0 + 84 + i * 64;
      withA(c, a, () => { for (let k = 0; k < NCHIP[i]; k++) chip(c, PX0 + 24 + k * 23, y - 7, F_COL[i]); });
      T(c, S.lab[i], 'F' + SUB[i] + ' = ' + (NCHIP[i] * 10) + ' gw', PX0 + 176, y, F_COL[i], 24, 'left', true);
    }
    /* 拔插銷：小環還是不動 */
    bubble(c, fin(s, n, 6.4, 0.4), L('拔掉插銷，小環不動！', 'Pin out, ring stays!'), OK_COL);
    glowBottom(c, fin(s, n, 6.8, 0.6), L('合力 ＝ 0：小環不動', 'Net force = 0: the ring stays'), OK_COL);
  }

  /* ── 第 2 步：先合成兩力 ── */
  function step2(c, s, S) {
    const n = 2;
    P(c, fin(s, n, 0.3, 0.5), L('先把 F₁、F₂ 合成', 'First combine F₁ and F₂'), 480, KEY_Y, R_COL, 24);
    /* R₁₂ 的標示與量格 */
    const Rt = tip(R12), m = gwOf(R12), cells = Math.round(m * PX_PER_GW / CELL);
    T(c, fin(s, n, 3.6, 0.4), 'R₁₂', Rt.x + 18, Rt.y + 14, R_COL, 24, 'left', true);
    /* 沿 R₁₂ 一格一格的刻度 */
    const ux = R12.x / m, uy = R12.y / m;
    for (let k = 1; k <= cells; k++) {
      const a = fin(s, n, 4.6 + k * 0.22, 0.2);
      const px = CX + ux * k * CELL, py = CY + uy * k * CELL;
      withA(c, a, () => {
        c.strokeStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(px - uy * 11, py + ux * 11); c.lineTo(px + uy * 11, py - ux * 11); c.stroke();
      });
    }
    /* 面板 */
    const pa = fin(s, n, 0.6, 0.5), y1 = 436;
    panel(c, pa, y1);
    T(c, fin(s, n, 3.8, 0.4), L('對角線就是合力', 'The diagonal is the sum'), PX0 + PW / 2, PY0 + 32, WHITE, 22);
    const str = L('F₁、F₂ 的合力 = ', 'Sum of F₁, F₂ = ') + m + ' gw';
    P(c, fin(s, n, 4.3, 0.5), str, PX0 + PW / 2, PY0 + 90, R_COL, fit(c, str, PW - 60, 24), 'center');
    T(c, fin(s, n, 5.9, 0.4), L('量一量：' + cells + ' 格 = ' + m + ' gw', 'Measure: ' + cells + ' boxes = ' + m + ' gw'), PX0 + PW / 2, PY0 + 150, WHITE, 22);
    /* 小提醒：不是直接相加 */
    T(c, fin(s, n, 6.4, 0.4), L('（不是 30 + 40 = 70）', '(not 30 + 40 = 70)'), PX0 + PW / 2, PY0 + 196, DIM, 22);
    withA(c, fin(s, n, 6.8, 0.4), () => {
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(PX0 + 24, PY0 + 250); c.lineTo(PX0 + PW - 24, PY0 + 250); c.stroke();
    });
    T(c, fin(s, n, 6.8, 0.4), L('合成方法：下一頁詳細學', 'How to combine: next page'), PX0 + PW / 2, PY0 + 290, COL.teal, 22);
    glowBottom(c, fin(s, n, 7.4, 0.6), L('F₁、F₂ 可以用一個力 R₁₂ 代替', 'R₁₂ can replace F₁ and F₂'));
  }

  /* ── 第 3 步：合力對上第三力 ── */
  const RUL_X0 = PX0 + 100, RUL_Y = PY0 + 92;          /* 面板上的 5 格尺 */
  function step3(c, s, S) {
    const n = 3, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('R₁₂ 對上第三個力 F₃', 'R₁₂ meets the third force F₃'), 480, KEY_Y, R_COL, 24);
    T(c, 1, 'R₁₂', tip(R12).x + 18, tip(R12).y + 14, R_COL, 24, 'left', true);
    const pa = fin(s, n, 0.6, 0.5), y1 = 436;
    panel(c, pa, y1);
    /* 尺：5 格 */
    const m12 = gwOf(R12), m3 = gwOf(F[2]), cells = Math.round(m12 * PX_PER_GW / CELL);
    withA(c, fin(s, n, 0.8, 0.5), () => {
      for (let i = 0; i < cells; i++) {
        c.fillStyle = i % 2 ? 'rgba(246,243,234,0.14)' : 'rgba(246,243,234,0.30)';
        c.fillRect(RUL_X0 + i * CELL, RUL_Y - 8, CELL, 16);
      }
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(RUL_X0, RUL_Y - 8, cells * CELL, 16);
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = 'rgba(163,184,176,0.45)'; c.lineWidth = 1.5;
      for (let i = 0; i <= cells; i++) { c.beginPath(); c.moveTo(RUL_X0 + i * CELL, RUL_Y - 50); c.lineTo(RUL_X0 + i * CELL, RUL_Y + 50); c.stroke(); }
      c.restore();
    });
    T(c, fin(s, n, 0.8, 0.5), L('並排量一量', 'Side by side'), PX0 + PW / 2, PY0 + 26, WHITE, 22);
    /* R₁₂ 與 F₃ 的複製品飛到尺的上下（長度不變、方向轉成水平） */
    const f = ease(seg(u, 1.0, 2.0));
    if (u >= 1.0) {
      const fly = (v, x0, y0, ang1, col) => {
        const len = Math.hypot(v.x, v.y) * PX_PER_GW, ang0 = Math.atan2(v.y, v.x);
        let da = ang1 - ang0; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        const an = ang0 + da * f, sx = lerp(CX, x0, f), sy = lerp(CY, y0, f);
        fArrow(c, sx, sy, sx + Math.cos(an) * len, sy + Math.sin(an) * len, 0.4 + 0.6 * f, col, 6);
        return len;
      };
      const lr = fly(R12, RUL_X0, RUL_Y - 30, 0, R_COL);
      const l3 = fly(F[2], RUL_X0 + cells * CELL, RUL_Y + 30, Math.PI, F_COL[2]);
      const la = fin(s, n, 2.0, 0.4);
      T(c, la, 'R₁₂', RUL_X0 - 12, RUL_Y - 30, R_COL, 22, 'right', true);
      T(c, la, 'F₃', RUL_X0 - 12, RUL_Y + 30, F_COL[2], 22, 'right', true);
      T(c, la, Math.round(lr / PX_PER_GW) + ' gw', RUL_X0 + cells * CELL + 12, RUL_Y - 30, R_COL, 22, 'left', true);
      T(c, la, Math.round(l3 / PX_PER_GW) + ' gw', RUL_X0 + cells * CELL + 12, RUL_Y + 30, F_COL[2], 22, 'left', true);
    }
    /* 三個檢核（由向量算） */
    const eqSize = m12 === m3;
    const dot = R12.x * F[2].x + R12.y * F[2].y, opp = Math.abs(dot + m12 * m3) < 1e-6;
    const cross = R12.x * F[2].y - R12.y * F[2].x, same = Math.abs(cross) < 1e-6;   /* 都從小環出發且共線 */
    const rows = [
      [L('大小相等：都 ', 'Equal size: both ') + m12 + ' gw', eqSize, 2.4, 2.8],
      [L('方向相反', 'Opposite directions'), opp, 3.8, 5.0],
      [L('同一直線', 'On the same line'), same, 6.0, 7.0]
    ];
    const zs = Math.min.apply(null, rows.map(r => fit(c, r[0], PW - 96, 24)));
    rows.forEach((r, i) => {
      const y = PY0 + 186 + i * 56, lit = fin(s, n, r[2], 0.4), a = pa;
      withA(c, a, () => {
        c.fillStyle = lit > 0.02 ? W5.rgba(R_COL, 0.06 + 0.08 * lit) : 'rgba(11,26,21,0.35)';
        W5.rr(c, PX0 + 14, y - 24, PW - 28, 48, 12); c.fill();
        c.strokeStyle = lit > 0.02 ? W5.rgba(R_COL, 0.3 + 0.5 * lit) : 'rgba(163,184,176,0.3)'; c.lineWidth = 2;
        W5.rr(c, PX0 + 14, y - 24, PW - 28, 48, 12); c.stroke();
        c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2; W5.rr(c, PX0 + 28, y - 15, 30, 30, 7); c.stroke();
      });
      check(c, PX0 + 43, y, 11, r[1] ? ease(seg(s.u, r[3], r[3] + 0.6)) : 0, a);
      T(c, a, r[0], PX0 + 72, y, lit > 0.02 ? WHITE : DIM, zs, 'left');
    });
    /* ② 方向相反：兩支箭頭尖亮圈 */
    const da = fin(s, n, 3.8, 0.4) * fout(s, n, 5.8, 0.4);
    pulse(c, tip(R12).x, tip(R12).y, R_COL, da, 3.8, u);
    pulse(c, tip(F[2]).x, tip(F[2]).y, F_COL[2], da, 3.8, u);
    /* ③ 同一直線：一條虛線穿過小環與兩支箭頭 */
    const lg = ease(seg(u, 6.0, 6.8));
    if (lg > 0.01) {
      const ext = 1.55, A = { x: CX + R12.x * PX_PER_GW * ext, y: CY + R12.y * PX_PER_GW * ext }, B = { x: CX + F[2].x * PX_PER_GW * ext, y: CY + F[2].y * PX_PER_GW * ext };
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      withA(c, 1, () => {
        c.save(); c.setLineDash([8, 6]); c.strokeStyle = W5.rgba(WHITE, 0.85); c.lineWidth = 2.5;
        c.shadowColor = 'rgba(255,255,255,0.7)'; c.shadowBlur = 8;
        c.beginPath(); c.moveTo(lerp(mx, A.x, lg), lerp(my, A.y, lg)); c.lineTo(lerp(mx, B.x, lg), lerp(my, B.y, lg)); c.stroke();
        c.restore();
      });
    }
    glowBottom(c, fin(s, n, 7.8, 0.6), L('R₁₂ 與 F₃ 兩力平衡', 'R₁₂ and F₃ balance'), OK_COL);
  }

  /* ── 第 4 步：任選兩力都行 ── */
  function step4(c, s, S) {
    const n = 4, u = s.u;
    P(c, fin(s, n, 0.3, 0.5), L('換一對來合成也成立', 'Any pair works the same'), 480, KEY_Y, R_COL, 24);
    /* 桌上的合力標示 */
    const t23 = tip(R23), t13 = tip(R13);
    P(c, S.cA * fin(s, n, 2.4, 0.4), 'R₂₃ = ' + gwOf(R23) + ' gw', t23.x - 72, t23.y - 40, R_COL, 22, 'center', true);   /* 左上，避開平行四邊形 */
    P(c, S.cB * fin(s, n, 6.4, 0.4), 'R₁₃ = ' + gwOf(R13) + ' gw', t13.x + 18, t13.y + 20, R_COL, 22, 'left', true);
    /* 合力與對手：尖端亮圈 */
    const pA = fin(s, n, 2.8, 0.4) * fout(s, n, 4.2, 0.4), pB = fin(s, n, 6.8, 0.4) * fout(s, n, 8.0, 0.4);
    pulse(c, t23.x, t23.y, R_COL, pA, 2.8, u); pulse(c, tip(F[0]).x, tip(F[0]).y, F_COL[0], pA, 2.8, u);
    pulse(c, t13.x, t13.y, R_COL, pB, 6.8, u); pulse(c, tip(F[1]).x, tip(F[1]).y, F_COL[1], pB, 6.8, u);

    /* 小卡：三個結論 */
    const y1 = 436;
    panel(c, 1, y1);
    T(c, 1, L('兩力的合力 ⟷ 第三力', 'Sum of two ⟷ the third'), PX0 + PW / 2, PY0 + 30, WHITE, 22);
    const R = [[R12, '₁₂', 2], [R23, '₂₃', 0], [R13, '₁₃', 1]];
    const lit = [1, fin(s, n, 1.6, 0.4), fin(s, n, 5.6, 0.4)];
    const hot = [fout(s, n, 0.6, 0.5), fin(s, n, 2.8, 0.4) * fout(s, n, 4.2, 0.4), fin(s, n, 6.8, 0.4) * fout(s, n, 8.0, 0.4)];
    const oks = [1, ease(seg(u, 3.2, 3.8)), ease(seg(u, 7.2, 7.8))];
    R.forEach(([v, sb, j], i) => {
      const y = PY0 + 96 + i * 88, a = lit[i];
      if (a <= 0.02) return;
      withA(c, a, () => {
        c.fillStyle = W5.rgba(R_COL, 0.05 + 0.10 * hot[i]); W5.rr(c, PX0 + 14, y - 34, PW - 28, 68, 12); c.fill();
        c.strokeStyle = W5.rgba(R_COL, 0.3 + 0.6 * hot[i]); c.lineWidth = 2 + hot[i]; W5.rr(c, PX0 + 14, y - 34, PW - 28, 68, 12); c.stroke();
      });
      /* 一列：勾 ＋ 合力 ⟷ 第三力，整列量寬後置中 */
      const sR = 'R' + sb + ' ' + gwOf(v) + ' gw', sF = 'F' + SUB[j] + ' ' + gwOf(F[j]) + ' gw';
      const wR = W5.tw(c, sR, 22, true), wF = W5.tw(c, sF, 22, true), tot = 26 + 12 + wR + 8 + 26 + 8 + wF;
      const x0 = PX0 + PW / 2 - tot / 2;
      check(c, x0 + 11, y - 2, 11, oks[i], a);
      T(c, a, sR, x0 + 38, y - 2, R_COL, 22, 'left', true);
      const xa = x0 + 38 + wR + 8;
      dblArrow(c, xa, xa + 26, y - 2, a, WHITE);
      T(c, a, sF, xa + 34, y - 2, F_COL[j], 22, 'left', true);
    });
    glowBottom(c, fin(s, n, 8.3, 0.6), L('任兩力的合力，都與第三力平衡', 'Any two together balance the third'), OK_COL);
  }

  W5.register('threef', { canvas: 'cvs-threef', steps: DUR, draw });
})();
