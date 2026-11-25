/* ==================================================================
   mechanics_2 ｜ 二力平衡：重力與支撐力（cvs-twof，960×540）
   四步：1 書受到重力 → 2 桌面往上推 → 3 三個條件 → 4 缺一不可
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。風格沿用 mechanics_2_fdraw／online。

   比例：PX_PER_GW＝2.4（1 gw＝2.4 px，整支動畫不變）；比例尺 1 格＝10 gw＝24 px。
         50 gw＝120 px＝5 格；30 gw＝72 px＝3 格。畫面上的 gw 數一律由箭頭向量長度算出來。
   語意色：重力 W＝珊瑚 COL.coral；支撐力 N＝綠 COL.green；合力＝黃 COL.yellow。
   場景（側視）：地面線 GY；桌子（桌面上緣 TY、厚 TOP_H、兩支桌腳）在中間；桌上一本藍色硬皮書
         （正面＝書頁＋上下封面＋左側書脊，上面一條斜的封面頂面，寫「理化課本」，字放在箭頭左邊不壓線）。
         W 從書正面中心（重心）向下；N 從書與桌面的接觸中心向上；兩者都在 x＝TX 這條直線上。
         March（全身圖 touch_ready.png 左右翻轉、shocked_full.png）站右側地面上當觀察員（第 1、2 步）。
   第 3 步：左側三張條件卡；右側一把直立的尺（5 格）並排量兩支箭頭。
   第 4 步：三個小場景並排（同一比例）：(a) N＝30 gw 書加速下沉；(b) N 偏在書的一端，書繞支點轉動；
         (c) 三個都滿足，書靜止。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const W_COL = COL.coral, N_COL = COL.green, R_COL = COL.yellow;
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', BAD = COL.red;
  const DUR = [8, 9, 10, 9];         /* 總長 36 秒 */

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

  /* ═══════════ 比例與幾何 ═══════════ */
  const PX_PER_GW = 2.4;             /* 1 gw ＝ 2.4 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 比例尺 1 格 ＝ 10 gw ＝ 24 px */
  const GW = 50;                     /* W ＝ N ＝ 50 gw */
  const GY = 470;                    /* 地面線 */
  const TX = 500, TY = 300, TOP_H = 22;               /* 桌子中心 x、桌面上緣、桌面厚 */
  const TABLE_L = 330, TABLE_R = 670, LEG_W = 22;     /* 桌面左右、桌腳寬 */
  const BOOK_W = 240, BOOK_H = 40, BK_DX = 16, BK_DY = -20;   /* 書：正面寬高、頂面斜深 */
  const KEY_Y = 62, BOT_Y = 505;
  const MX = 850, SCM = 0.6;         /* March 中心 x、縮放 */
  const RUL_X = 820, RUL_TOP = 172;  /* 第 3 步直立尺 */
  const CARD_X = 14, CARD_W = 300, CARD_H = 82, CARD_Y = [112, 212, 312];
  const ZM = { cx: 168, cy: 222, r: 88, tx: 418, ty: TY };   /* 第 2 步放大圓：圓心、半徑、取樣點 */

  /* ═══════════ March（全身圖） ═══════════ */
  const IMG = {};
  [['ready', 'touch_ready'], ['shock', 'shocked_full']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/march/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;
  const SOLE = { ready: 466, shock: 484 };            /* 原圖鞋底所在列 */

  function march(c, key, a, flip) {
    const im = IMG[key];
    if (a <= 0.02 || !ok(im)) return;
    const w = im.naturalWidth * SCM, h = im.naturalHeight * SCM, top = GY - SOLE[key] * SCM;
    withA(c, a, () => {
      if (flip) { c.save(); c.translate(MX + w / 2, top); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); }
      else c.drawImage(im, MX - w / 2, top, w, h);
    });
  }
  function marchShadow(c, a) {
    withA(c, a * 0.4, () => { c.fillStyle = INK; c.beginPath(); c.ellipse(MX, GY + 3, 66, 8, 0, 0, TAU); c.fill(); });
  }
  /* 說話氣泡：膠囊＋尾巴指向 March 頭 */
  function bubble(c, a, str, col) {
    if (a <= 0.02) return;
    const w = W5.tw(c, str, 24) + 28, cx = Math.min(944 - w / 2, MX - 20), cy = 110;
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath(); c.moveTo(MX - 14, cy + 18); c.lineTo(MX + 2, cy + 46); c.lineTo(MX + 10, cy + 18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(MX - 14, cy + 20); c.lineTo(MX + 2, cy + 46); c.lineTo(MX + 10, cy + 20); c.stroke();
    });
    P(c, a, str, cx, cy, col, 24, 'center');
  }

  /* ═══════════ 地面（同 fdraw） ═══════════ */
  function floor(c, a) {
    withA(c, a, () => {
      const gl = c.createRadialGradient(480, 300, 30, 480, 300, 460);
      gl.addColorStop(0, 'rgba(51,204,153,0.05)'); gl.addColorStop(1, 'rgba(51,204,153,0)');
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

  /* ═══════════ 桌子 ═══════════ */
  /* 桌面上緣在書底下的凹陷：x 的位置、凹深 d（誇大示意） */
  const DENT_L = TX - BOOK_W / 2 - 14, DENT_R = TX + BOOK_W / 2 + 14;
  function dentAt(x, d) {
    if (d <= 0 || x <= DENT_L || x >= DENT_R) return 0;
    return d * 0.5 * (1 - Math.cos(TAU * (x - DENT_L) / (DENT_R - DENT_L)));
  }
  function woodFill(c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#c58d52'); g.addColorStop(1, '#8f5c2f');
    return g;
  }
  function table(c, d) {
    const y1 = TY + TOP_H;
    /* 影子 */
    c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
    c.beginPath(); c.ellipse(TX, GY + 3, (TABLE_R - TABLE_L) * 0.55, 9, 0, 0, TAU); c.fill(); c.restore();
    /* 桌腳＋橫撐 */
    [TABLE_L + 15, TABLE_R - 15 - LEG_W].forEach(x => {
      const g = c.createLinearGradient(x, 0, x + LEG_W, 0);
      g.addColorStop(0, '#a46c3a'); g.addColorStop(1, '#6f4321');
      c.fillStyle = g; c.fillRect(x, y1, LEG_W, GY - y1);
      c.strokeStyle = '#3a2412'; c.lineWidth = 2; c.strokeRect(x, y1, LEG_W, GY - y1);
    });
    c.fillStyle = '#7a4a22'; c.fillRect(TABLE_L + 15, y1, TABLE_R - TABLE_L - 30, 16);
    c.strokeStyle = '#3a2412'; c.lineWidth = 2; c.strokeRect(TABLE_L + 15, y1, TABLE_R - TABLE_L - 30, 16);
    /* 桌面（上緣可凹） */
    const path = () => {
      c.beginPath(); c.moveTo(TABLE_L, TY);
      for (let x = TABLE_L; x <= TABLE_R; x += 4) c.lineTo(x, TY + dentAt(x, d));
      c.lineTo(TABLE_R, y1); c.lineTo(TABLE_L, y1); c.closePath();
    };
    c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    path(); c.fillStyle = woodFill(c, TABLE_L, TY, TABLE_R, y1); c.fill(); c.restore();
    c.save(); path(); c.clip();
    c.strokeStyle = 'rgba(90,54,22,0.4)'; c.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const yy = TY + 6 + i * 6, ph = W5.hash(i + 3) * 6;
      c.beginPath();
      for (let x = TABLE_L; x <= TABLE_R; x += 6) { const py = yy + 1.5 * Math.sin(x / 23 + ph) + dentAt(x, d); if (x === TABLE_L) c.moveTo(x, py); else c.lineTo(x, py); }
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(255,226,180,0.55)'; c.lineWidth = 2;
    c.beginPath(); for (let x = TABLE_L + 4; x <= TABLE_R - 4; x += 4) { const py = TY + 1.5 + dentAt(x, d); if (x === TABLE_L + 4) c.moveTo(x, py); else c.lineTo(x, py); } c.stroke();
    path(); c.strokeStyle = '#3a2412'; c.lineWidth = 2; c.stroke();
  }

  /* ═══════════ 書（藍色硬皮書） ═══════════ */
  /* x0：正面左緣、yb：正面底、w/h：正面寬高、dx/dy：頂面斜深；title：書名（畫在左側） */
  function book(c, x0, yb, w, h, dx, dy, title) {
    const yt = yb - h, cv = Math.max(4, h * 0.17), sp = Math.max(8, h * 0.32);
    /* 頂面（封面） */
    c.beginPath(); c.moveTo(x0 + sp * 0.4, yt); c.lineTo(x0 + w, yt); c.lineTo(x0 + w + dx, yt + dy); c.lineTo(x0 + sp * 0.4 + dx, yt + dy); c.closePath();
    const gt = c.createLinearGradient(0, yt + dy, 0, yt);
    gt.addColorStop(0, '#5b95ef'); gt.addColorStop(1, '#3b74d4');
    c.fillStyle = gt; c.fill(); c.strokeStyle = '#173a78'; c.lineWidth = 2; c.stroke();
    /* 右側面（書頁的斜面） */
    c.beginPath(); c.moveTo(x0 + w, yt); c.lineTo(x0 + w + dx, yt + dy); c.lineTo(x0 + w + dx, yb + dy); c.lineTo(x0 + w, yb); c.closePath();
    c.fillStyle = '#c9c2ad'; c.fill(); c.stroke();
    /* 正面：上下封面＋書頁 */
    c.fillStyle = '#efe8d4'; c.fillRect(x0 + sp * 0.5, yt + cv, w - sp * 0.5, h - 2 * cv);
    c.strokeStyle = 'rgba(120,110,90,0.55)'; c.lineWidth = 1;
    for (let yy = yt + cv + 3; yy < yb - cv - 1; yy += 3) { c.beginPath(); c.moveTo(x0 + sp * 0.6, yy); c.lineTo(x0 + w - 2, yy); c.stroke(); }
    const gc = c.createLinearGradient(0, yt, 0, yb);
    gc.addColorStop(0, '#3f7ad8'); gc.addColorStop(1, '#22509f');
    c.fillStyle = gc;
    c.fillRect(x0 + sp * 0.4, yt, w - sp * 0.4 + 2, cv); c.fillRect(x0 + sp * 0.4, yb - cv, w - sp * 0.4 + 2, cv);
    /* 書脊（左端圓弧） */
    c.beginPath(); c.moveTo(x0 + sp, yt); c.quadraticCurveTo(x0 - sp * 0.4, yt + h / 2, x0 + sp, yb); c.lineTo(x0 + sp * 0.4, yb); c.lineTo(x0 + sp * 0.4, yt); c.closePath();
    c.fillStyle = '#2c5fb8'; c.fill();
    c.strokeStyle = '#173a78'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x0 + sp, yt); c.quadraticCurveTo(x0 - sp * 0.4, yt + h / 2, x0 + sp, yb); c.stroke();
    c.strokeRect(x0 + sp * 0.4, yt, w - sp * 0.4, h);
    /* 封面上的金色細線 */
    c.strokeStyle = 'rgba(255,224,102,0.75)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x0 + sp + 4 + dx * 0.5, yt + dy * 0.5); c.lineTo(x0 + w - 6 + dx * 0.5, yt + dy * 0.5); c.stroke();
    if (title) T(c, 1, title, x0 + w - 12, yt + h / 2, '#fff6d6', 22, 'right');   /* 書名在右半邊，離開力的作用線 */
  }

  /* ═══════════ 力的箭頭（深色描邊＋光暈，同 fdraw） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  /* 垂直力：起點 (x, y0)、帶正負的 gw（向下為正）；回傳尖端 y */
  function vArrowGW(c, x, y0, gw, a, col, lw) {
    const y1 = y0 + gw * PX_PER_GW;
    fArrow(c, x, y0, x, y1, a, col, lw);
    return y1;
  }
  const gwOf = (y0, y1) => Math.round(Math.abs(y1 - y0) / PX_PER_GW);

  /* 作用點：白色小球 */
  function apDot(c, x, y, a, col, r) {
    r = r || 6;
    withA(c, a, () => {
      W5.glow(c, x, y, r * 3.6, col, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 2, 0, TAU); c.fill();
      W5.ball(c, x, y, r, WHITE);
    });
  }

  /* 打叉／打勾（自己畫，不靠字型，同 fdraw） */
  function cross(c, x, y, r, g, a) {
    withA(c, a, () => {
      c.strokeStyle = BAD; c.lineWidth = 6; c.lineCap = 'round';
      c.shadowColor = W5.rgba(BAD, 0.7); c.shadowBlur = 10;
      const g1 = clamp01(g * 2), g2 = clamp01(g * 2 - 1);
      c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x - r + 2 * r * g1, y - r + 2 * r * g1); c.stroke();
      if (g2 > 0) { c.beginPath(); c.moveTo(x + r, y - r); c.lineTo(x + r - 2 * r * g2, y - r + 2 * r * g2); c.stroke(); }
    });
  }
  function check(c, x, y, r, g, a) {
    withA(c, a, () => {
      c.strokeStyle = COL.green; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = W5.rgba(COL.green, 0.7); c.shadowBlur = 10;
      const p1 = [x - r, y], p2 = [x - r * 0.3, y + r * 0.7], p3 = [x + r, y - r * 0.8];
      const g1 = clamp01(g * 2.5), g2 = clamp01(g * 2.5 - 1) / 1.5 * 1.5;
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(lerp(p1[0], p2[0], g1), lerp(p1[1], p2[1], g1));
      if (g > 0.4) c.lineTo(lerp(p2[0], p3[0], clamp01(g2)), lerp(p2[1], p3[1], clamp01(g2)));
      c.stroke();
    });
  }

  /* 加速後緩停（同 online）：回傳位移比例 0..1 */
  function accel(u, a, b) {
    const t = seg(u, a, b), A = 1 / 0.375;
    let x;
    if (t <= 0.75) x = 0.5 * A * t * t;
    else { const d = t - 0.75; x = 0.5 * A * 0.5625 + 0.75 * A * d - 1.5 * A * d * d; }
    return Math.min(1, x);
  }

  /* 比例尺小圖例（左下角）：1 格 */
  function legend(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(22, BOT_Y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(22, BOT_Y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), 22 + CELL + 10, BOT_Y, DIM, 22, 'left');
  }
  function glowBottom(c, a, str, col) {
    col = col || R_COL;
    if (a > 0.02) W5.glow(c, 480, BOT_Y, 200, col, 0.10 * a);
    P(c, a, str, 480, BOT_Y, col, 24, 'center');
  }

  /* ═══════════ 第 2 步：放大圓（桌面被壓凹一點點） ═══════════ */
  function zoomCircle(c, a, g) {
    if (a <= 0.02) return;
    const { cx, cy, r, tx, ty } = ZM;
    withA(c, a, () => {
      /* 取樣環＋兩條切線 */
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2; c.setLineDash([5, 5]);
      const dx = tx - cx, dy = ty - cy, dd = Math.hypot(dx, dy), base = Math.atan2(dy, dx), phi = Math.acos(Math.min(1, r / dd));
      [phi, -phi].forEach(ph => { const an = base + ph; c.beginPath(); c.moveTo(cx + r * Math.cos(an), cy + r * Math.sin(an)); c.lineTo(tx, ty); c.stroke(); });
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.arc(tx, ty, 14, 0, TAU); c.stroke();
      /* 圓內：書底壓進桌面 */
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
      const bg = c.createRadialGradient(cx, cy - r * 0.3, 10, cx, cy, r);
      bg.addColorStop(0, '#1f4136'); bg.addColorStop(1, '#0f231c');
      c.fillStyle = bg; c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const sy = cy + 6, dep = 16 * g, bl = cx - 46, br = cx + r + 10;
      const surf = x => sy + (x < bl - 30 ? 0 : x < bl ? dep * ease((x - bl + 30) / 30) : dep);
      /* 桌面木頭 */
      c.beginPath(); c.moveTo(cx - r, surf(cx - r));
      for (let x = cx - r; x <= cx + r; x += 3) c.lineTo(x, surf(x));
      c.lineTo(cx + r, cy + r); c.lineTo(cx - r, cy + r); c.closePath();
      const gw = c.createLinearGradient(0, sy, 0, cy + r); gw.addColorStop(0, '#c58d52'); gw.addColorStop(1, '#8f5c2f');
      c.fillStyle = gw; c.fill();
      c.strokeStyle = 'rgba(90,54,22,0.45)'; c.lineWidth = 2;
      for (let i = 1; i < 5; i++) { c.beginPath(); for (let x = cx - r; x <= cx + r; x += 4) { const py = surf(x) + i * 14 * (1 - 0.35 * (dep / 16) * (x > bl ? 1 - i / 6 : 0)) + 2 * Math.sin(x / 15 + i); if (x === cx - r) c.moveTo(x, py); else c.lineTo(x, py); } c.stroke(); }
      c.strokeStyle = '#3a2412'; c.lineWidth = 2.5;
      c.beginPath(); for (let x = cx - r; x <= cx + r; x += 3) { if (x === cx - r) c.moveTo(x, surf(x)); else c.lineTo(x, surf(x)); } c.stroke();
      /* 書底（封面＋書頁），底邊貼著凹下去的桌面 */
      const yb = sy + dep;
      c.fillStyle = '#efe8d4'; c.fillRect(bl, cy - r, br - bl, yb - 14 - (cy - r));
      c.strokeStyle = 'rgba(120,110,90,0.6)'; c.lineWidth = 1.5;
      for (let yy = yb - 20; yy > cy - r; yy -= 7) { c.beginPath(); c.moveTo(bl + 4, yy); c.lineTo(br, yy); c.stroke(); }
      const gc = c.createLinearGradient(0, yb - 14, 0, yb); gc.addColorStop(0, '#3f7ad8'); gc.addColorStop(1, '#22509f');
      c.fillStyle = gc; c.fillRect(bl, yb - 14, br - bl, 14);
      c.strokeStyle = '#173a78'; c.lineWidth = 2; c.strokeRect(bl, cy - r - 2, br - bl, yb - (cy - r) + 2);
      /* 凹陷處的亮線 */
      if (g > 0.05) {
        c.save(); c.globalAlpha *= g; c.strokeStyle = R_COL; c.lineWidth = 3; c.setLineDash([5, 4]);
        c.beginPath(); c.moveTo(bl - 34, sy); c.lineTo(cx + r, sy); c.stroke(); c.restore();
      }
      c.restore();
      c.save(); c.shadowColor = 'rgba(246,243,234,0.35)'; c.shadowBlur = 12;
      c.strokeStyle = '#e6eeeb'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); c.restore();
    });
  }

  /* ═══════════ 第 3 步：條件卡 ═══════════ */
  function card(c, i, a, lit, ok_) {
    if (a <= 0.02) return;
    const y = CARD_Y[i], x = CARD_X, cy = y + CARD_H / 2;
    const all = [L('大小相等', 'Equal size'), L('方向相反', 'Opposite ways'), L('同一直線', 'Same line')], txt = all[i];
    withA(c, a, () => {
      c.fillStyle = lit > 0.02 ? 'rgba(255,224,102,' + (0.06 + 0.10 * lit).toFixed(3) + ')' : 'rgba(11,26,21,0.55)';
      W5.rr(c, x, y, CARD_W, CARD_H, 14); c.fill();
      c.fillStyle = 'rgba(11,26,21,0.45)'; W5.rr(c, x, y, CARD_W, CARD_H, 14); c.fill();
      c.strokeStyle = lit > 0.02 ? W5.rgba(R_COL, 0.35 + 0.6 * lit) : 'rgba(163,184,176,0.35)'; c.lineWidth = 2 + lit;
      W5.rr(c, x, y, CARD_W, CARD_H, 14); c.stroke();
      /* 編號圓 */
      c.fillStyle = INK; c.beginPath(); c.arc(x + 34, cy, 18, 0, TAU); c.fill();
      c.strokeStyle = lit > 0.02 ? R_COL : 'rgba(163,184,176,0.6)'; c.lineWidth = 2.5; c.stroke();
      /* 打勾框 */
      c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2; W5.rr(c, x + CARD_W - 52, cy - 18, 36, 36, 8); c.stroke();
    });
    T(c, a, String(i + 1), x + 34, cy + 1, lit > 0.02 ? R_COL : DIM, 22, 'center', true);
    const z = Math.min.apply(null, all.map(t => fit(c, t, CARD_W - 140, 26)));   /* 三張卡同字級 */
    T(c, a, txt, x + 66, cy, lit > 0.02 ? WHITE : DIM, z, 'left');
    check(c, x + CARD_W - 34, cy, 13, ok_, a);
  }

  /* 第 3 步右側：直立的尺（5 格）＋兩支箭頭並排量 */
  function rulerV(c, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = 'rgba(163,184,176,0.45)'; c.lineWidth = 1.5;
      for (let i = 0; i <= 5; i++) { const y = RUL_TOP + i * CELL; c.beginPath(); c.moveTo(RUL_X - 62, y); c.lineTo(RUL_X + 62, y); c.stroke(); }
      c.restore();
      for (let i = 0; i < 5; i++) {
        c.fillStyle = i % 2 ? 'rgba(246,243,234,0.14)' : 'rgba(246,243,234,0.30)';
        c.fillRect(RUL_X - 9, RUL_TOP + i * CELL, 18, CELL);
      }
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(RUL_X - 9, RUL_TOP, 18, 5 * CELL);
      for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(RUL_X - 9, RUL_TOP + i * CELL); c.lineTo(RUL_X + 9, RUL_TOP + i * CELL); c.stroke(); }
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), RUL_X, RUL_TOP - 30, WHITE, 22);
  }

  /* ═══════════ 第 4 步：三個小場景 ═══════════ */
  const PAN = [165, 480, 795], PAN_W = 296, PAN_T = 92, PAN_B = 482;
  const MB_W = 120, MB_H = 26, MB_YB = 290, SHELF_Y = 336;   /* 小書寬高、書底、架子 */
  function panelBox(c, cx, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, cx - PAN_W / 2, PAN_T, PAN_W, PAN_B - PAN_T, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, cx - PAN_W / 2, PAN_T, PAN_W, PAN_B - PAN_T, 16); c.stroke();
      /* 小架子 */
      c.fillStyle = '#7d8a85'; c.fillRect(cx - 90, SHELF_Y, 180, 10);
      c.strokeStyle = '#26332f'; c.lineWidth = 2; c.strokeRect(cx - 90, SHELF_Y, 180, 10);
    });
  }
  /* 海綿墊：x0..x1、上緣 yt、下緣 SHELF_Y */
  function sponge(c, x0, x1, yt) {
    const h = SHELF_Y - yt;
    c.fillStyle = '#e8c95a'; W5.rr(c, x0, yt, x1 - x0, h, 5); c.fill();
    c.strokeStyle = '#8a6d1d'; c.lineWidth = 2; W5.rr(c, x0, yt, x1 - x0, h, 5); c.stroke();
    c.fillStyle = 'rgba(138,109,29,0.55)';
    for (let i = 0; i < 9; i++) {
      const px = x0 + 8 + W5.hash(i + 7) * (x1 - x0 - 16), py = yt + 4 + W5.hash(i + 17) * Math.max(1, h - 8);
      c.beginPath(); c.ellipse(px, py, 3, Math.max(1, 2.5 * h / 46), 0, 0, TAU); c.fill();
    }
  }
  function verdict(c, cx, a, g, good, str) {
    const y = 448, w = W5.tw(c, str, 24), x0 = cx - (w + 40) / 2;
    if (good) check(c, x0 + 12, y, 12, g, a); else cross(c, x0 + 12, y, 11, g, a);
    T(c, a, str, x0 + 40, y, good ? COL.green : BAD, 24, 'left');
  }
  function miniLabels(c, a, xN, yN0, yN1, xW, yW0, yW1, sideN) {
    /* 標示放在箭頭尖附近，避開書與架子 */
    T(c, a, 'N ' + gwOf(yN0, yN1) + ' gw', xN + sideN * 16, yN1 + 14, N_COL, 22, sideN < 0 ? 'right' : 'left', true);
    T(c, a, 'W ' + gwOf(yW0, yW1) + ' gw', xW + 16, yW1 - 16, W_COL, 22, 'left', true);
  }

  function step4(c, s) {
    const n = 4, pa = fin(s, n, 0.4, 0.6);
    P(c, fin(s, n, 0.3, 0.5), L('三個條件，缺一不可', 'All three are needed'), 480, KEY_Y, R_COL, 24);
    const g = ease(seg(s.u, 1.0, 1.8)), ga = pa;
    const titles = [L('(a) 支撐力太小', '(a) N too small'), L('(b) N 偏到一端', '(b) N off to one end'), L('(c) 三個都滿足', '(c) All three met')];
    PAN.forEach((cx, i) => { panelBox(c, cx, pa); P(c, pa, titles[i], cx, 118, WHITE, 22, 'center'); });

    /* (a) N＝30 gw < W：合力向下 → 書加速下沉（海綿被壓扁） */
    {
      const cx = PAN[0], sink = 24 * accel(s.u, 2.2, 4.2), yb = MB_YB + sink;
      withA(c, pa, () => { sponge(c, cx - 56, cx + 56, yb); book(c, cx - MB_W / 2, yb, MB_W, MB_H, 8, -12, null); });
      const yc = yb - MB_H / 2;
      const yW = vArrowGW(c, cx, yc, GW * g, ga, W_COL), yN = vArrowGW(c, cx, yb, -30 * g, ga, N_COL);
      apDot(c, cx, yc, ga, W_COL, 5); apDot(c, cx, yb, ga, N_COL, 5);
      miniLabels(c, fin(s, n, 1.8, 0.4), cx, yb, yN, cx, yc, yW, -1);
      /* 往下的運動提示 */
      const ma = fin(s, n, 2.4, 0.4);
      withA(c, ma, () => { W5.arrow(c, cx + 96, 250, cx + 96, 300, WHITE, 4, 13); });
      T(c, ma, L('下沉', 'Sinks'), cx + 96, 228, WHITE, 22);
      verdict(c, cx, fin(s, n, 3.6, 0.4), ease(seg(s.u, 3.6, 4.2)), false, L('大小不等', 'Not equal'));
    }
    /* (b) N 在書的右端（支點）、W 在中心：不在同一直線 → 書繞支點轉動 */
    {
      const cx = PAN[1], px = cx + MB_W / 2 - 28, py = MB_YB;   /* 支點＝書的右端（整組往左挪 20，讓標示留在框內） */
      const th = -0.26 * accel(s.u, 2.2, 4.4);
      withA(c, pa, () => {
        c.fillStyle = '#7d8a85'; c.fillRect(px - 7, py, 14, SHELF_Y - py);
        c.strokeStyle = '#26332f'; c.lineWidth = 2; c.strokeRect(px - 7, py, 14, SHELF_Y - py);
        c.save(); c.translate(px, py); c.rotate(th);
        book(c, -(MB_W - 8), 0, MB_W, MB_H, 8, -12, null);
        c.restore();
      });
      /* 重心（書正面中心）隨書轉動 */
      const lx = -(MB_W / 2 - 8), ly = -MB_H / 2;
      const gx = px + lx * Math.cos(th) - ly * Math.sin(th), gy = py + lx * Math.sin(th) + ly * Math.cos(th);
      const la = fin(s, n, 4.6, 0.5);
      withA(c, la, () => {
        c.save(); c.setLineDash([6, 6]); c.lineWidth = 2;
        c.strokeStyle = W5.rgba(W_COL, 0.7); c.beginPath(); c.moveTo(gx, 150); c.lineTo(gx, 420); c.stroke();
        c.strokeStyle = W5.rgba(N_COL, 0.7); c.beginPath(); c.moveTo(px, 150); c.lineTo(px, 420); c.stroke();
        c.restore();
      });
      const yW = vArrowGW(c, gx, gy, GW * g, ga, W_COL), yN = vArrowGW(c, px, py, -GW * g, ga, N_COL);
      apDot(c, gx, gy, ga, W_COL, 5); apDot(c, px, py, ga, N_COL, 5);
      T(c, fin(s, n, 1.8, 0.4), 'N ' + gwOf(py, yN) + ' gw', px + 16, yN + 14, N_COL, 22, 'left', true);
      T(c, fin(s, n, 1.8, 0.4), 'W ' + gwOf(gy, yW) + ' gw', gx - 16, yW - 16, W_COL, 22, 'right', true);
      /* 轉動提示：書左端的彎箭頭 */
      const ma = fin(s, n, 2.6, 0.4);
      withA(c, ma, () => {
        c.strokeStyle = WHITE; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.arc(px, py, 150, Math.PI * 1.06, Math.PI * 1.2); c.stroke();
        const ang = Math.PI * 1.06, ex = px + 150 * Math.cos(ang), ey = py + 150 * Math.sin(ang);
        W5.arrow(c, ex + 4 * Math.sin(ang), ey - 4 * Math.cos(ang), ex, ey, WHITE, 4, 13);
      });
      T(c, ma, L('轉動', 'Turns'), px - 132, 178, WHITE, 22);
      verdict(c, cx, fin(s, n, 4.4, 0.4), ease(seg(s.u, 4.4, 5.0)), false, L('不在同一直線', 'Not on one line'));
    }
    /* (c) 三個條件都滿足：書靜止 */
    {
      const cx = PAN[2], yb = MB_YB;
      withA(c, pa, () => { sponge(c, cx - 56, cx + 56, yb); book(c, cx - MB_W / 2, yb, MB_W, MB_H, 8, -12, null); });
      const yc = yb - MB_H / 2;
      const yW = vArrowGW(c, cx, yc, GW * g, ga, W_COL), yN = vArrowGW(c, cx, yb, -GW * g, ga, N_COL);
      apDot(c, cx, yc, ga, W_COL, 5); apDot(c, cx, yb, ga, N_COL, 5);
      miniLabels(c, fin(s, n, 1.8, 0.4), cx, yb, yN, cx, yc, yW, -1);
      T(c, fin(s, n, 4.6, 0.4), L('靜止', 'Still'), cx + 96, 228, WHITE, 22);
      verdict(c, cx, fin(s, n, 5.2, 0.4), ease(seg(s.u, 5.2, 5.8)), true, L('平衡', 'Balanced'));
    }
    glowBottom(c, fin(s, n, 6.2, 0.6), L('三個都滿足，書才會靜止', 'Only with all three does it stay still'));
  }

  /* ═══════════ 主場景狀態（每一步自己算，跳步進來也成立） ═══════════ */
  function sceneOf(s) {
    const S = { drop: 0, dent: 0, wG: 1, nG: 1, alpha: 1, mA: 1 };
    if (s.n === 1) {
      S.alpha = s.k;
      S.drop = 70 * (1 - ease(seg(s.u, 0.6, 1.4)));      /* 書放上桌面 */
      S.wG = ease(seg(s.u, 2.0, 2.8)); S.nG = 0;
    } else if (s.n === 2) {
      S.dent = 3 * ease(seg(s.u, 0.8, 1.6)); S.nG = ease(seg(s.u, 3.0, 3.8));
    } else if (s.n === 3) {
      S.dent = 3; S.mA = fout(s, 3, 0, 0.6);
    } else {
      S.dent = 3; S.alpha = fout(s, 4, 0, 0.6); S.mA = 0;
    }
    return S;
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    floor(c, s.n === 1 ? s.k : 1);
    if (s.n === 4) {
      legend(c, 1);
      const S = sceneOf(s);
      if (S.alpha > 0.02) withA(c, S.alpha, () => mainScene(c, s, S));
      step4(c, s);
      return;
    }
    const S = sceneOf(s);
    withA(c, S.alpha, () => mainScene(c, s, S));
    legend(c, s.n === 3 ? fout(s, 3, 0, 0.5) : (s.n === 1 ? s.k : 1));

    if (s.n === 1) step1(c, s, S);
    if (s.n === 2) step2(c, s, S);
    if (s.n === 3) step3(c, s, S);
  }

  /* 主場景：桌子、書、兩支力（依 S.wG、S.nG 長出）、March */
  function mainScene(c, s, S) {
    const yb = TY + S.dent - S.drop, yc = yb - BOOK_H / 2;
    table(c, S.dent);
    book(c, TX - BOOK_W / 2, yb, BOOK_W, BOOK_H, BK_DX, BK_DY, L('理化課本', 'Science'));
    /* W（重心向下）先畫、N（接觸面向上）後畫：同一條直線 x＝TX */
    const yW = vArrowGW(c, TX, yc, GW * S.wG, 1, W_COL);
    const yN = vArrowGW(c, TX, TY + S.dent, -GW * S.nG, 1, N_COL);
    apDot(c, TX, yc, s.n === 1 ? fin(s, 1, 1.6, 0.4) : 1, W_COL);
    if (S.nG > 0.02) apDot(c, TX, TY + S.dent, Math.min(1, S.nG * 3), N_COL);
    const wl = s.n === 1 ? fin(s, 1, 2.8, 0.4) : 1;
    P(c, wl, L('重力 W = ', 'Gravity W = ') + gwOf(yc, yW) + ' gw', TX, 428, W_COL, 22, 'center');
    const nl = s.n === 2 ? fin(s, 2, 3.8, 0.4) : (s.n > 2 ? 1 : 0);
    P(c, nl, L('支撐力 N = ', 'Support N = ') + gwOf(TY + S.dent, yN) + ' gw', TX, 150, N_COL, 22, 'center');
    /* March（第 1、2 步；第 3 步開頭淡出） */
    if (S.mA > 0.02) {
      const shockA = s.n === 2 ? fin(s, 2, 1.8, 0.3) * fout(s, 2, 4.6, 0.3) : 0;
      withA(c, S.mA, () => {
        marchShadow(c, 1);
        march(c, 'ready', 1 - shockA, true);
        march(c, 'shock', shockA, false);
      });
    }
  }

  /* ── 第 1 步：書受到重力 ── */
  function step1(c, s, S) {
    P(c, fin(s, 1, 0.3, 0.5), L('地球拉書：重力 W', 'Earth pulls the book: gravity W'), 480, KEY_Y, W_COL, 24);
    T(c, fin(s, 1, 1.8, 0.4), L('重心', 'Center'), TX - BOOK_W / 2 - 14, TY - BOOK_H / 2, W_COL, 22, 'right');
    withA(c, fin(s, 1, 1.8, 0.4), () => {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = W5.rgba(W_COL, 0.7); c.lineWidth = 2;
      c.beginPath(); c.moveTo(TX - BOOK_W / 2 - 8, TY - BOOK_H / 2); c.lineTo(TX - 12, TY - BOOK_H / 2); c.stroke(); c.restore();
    });
    bubble(c, fin(s, 1, 4.0, 0.5), L('書為什麼沒掉下去？', "Why doesn't it fall?"), WHITE);
    glowBottom(c, fin(s, 1, 5.2, 0.6), L('書受重力，卻沒有往下掉', 'Gravity pulls, yet the book stays'), W_COL);
  }

  /* ── 第 2 步：桌面往上推 ── */
  function step2(c, s, S) {
    P(c, fin(s, 2, 0.3, 0.5), L('桌面往上推：支撐力 N', 'The table pushes up: support N'), 480, KEY_Y, N_COL, 24);
    const za = fin(s, 2, 1.4, 0.6);
    zoomCircle(c, za, ease(seg(s.u, 1.6, 2.6)));
    const cap = fin(s, 2, 2.4, 0.5);
    T(c, cap, L('桌面其實被壓凹了一點點', 'The top dents a tiny bit'), ZM.cx, ZM.cy + ZM.r + 26, WHITE, 22);
    T(c, cap, L('（誇大示意）', '(exaggerated)'), ZM.cx, ZM.cy + ZM.r + 56, DIM, 22);
    bubble(c, fin(s, 2, 1.8, 0.3) * fout(s, 2, 4.6, 0.3), L('桌子被壓凹了！', 'The table dented!'), WHITE);
    bubble(c, fin(s, 2, 5.0, 0.4), L('桌子在往上推！', 'The table pushes up!'), N_COL);
    /* 同一直線的淡虛線 */
    withA(c, fin(s, 2, 4.2, 0.5), () => {
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(TX, 172); c.lineTo(TX, 408); c.stroke(); c.restore();
    });
    glowBottom(c, fin(s, 2, 5.6, 0.6), L('W 與 N 互相抵銷：合力 = 0', 'W and N cancel: net force = 0'));
  }

  /* ── 第 3 步：三個條件 ── */
  function step3(c, s, S) {
    const n = 3, yb = TY + S.dent, yc = yb - BOOK_H / 2;
    P(c, fin(s, n, 0.3, 0.5), L('二力平衡的三個條件', 'Three conditions for balance'), 480, KEY_Y, R_COL, 24);
    const ca = fin(s, n, 0.5, 0.5);
    const lit = [fin(s, n, 1.0, 0.4), fin(s, n, 3.8, 0.4), fin(s, n, 6.0, 0.4)];
    const oks = [ease(seg(s.u, 3.0, 3.6)), ease(seg(s.u, 5.4, 6.0)), ease(seg(s.u, 7.6, 8.2))];
    [0, 1, 2].forEach(i => card(c, i, ca, lit[i], oks[i]));

    /* ① 大小相等：兩支箭頭複製一份，飛到右邊的尺旁並排量 */
    rulerV(c, fin(s, n, 1.2, 0.5));
    const f = ease(clamp01(since(s, n, 1.5) / 0.9));
    if (since(s, n, 1.5) >= 0) {
      const nx = lerp(TX, RUL_X - 38, f), ny0 = lerp(yb, RUL_TOP + 5 * CELL, f);
      const wx = lerp(TX, RUL_X + 38, f), wy0 = lerp(yc, RUL_TOP, f);
      const yN = vArrowGW(c, nx, ny0, -GW, 0.35 + 0.65 * f, N_COL);
      const yW = vArrowGW(c, wx, wy0, GW, 0.35 + 0.65 * f, W_COL);
      const la = fin(s, n, 2.4, 0.4);
      T(c, la, 'N', RUL_X - 38, RUL_TOP + 5 * CELL + 26, N_COL, 24, 'center', true);
      T(c, la, 'W', RUL_X + 38, RUL_TOP + 5 * CELL + 26, W_COL, 24, 'center', true);
      const cn = Math.round(gwOf(ny0, yN) * PX_PER_GW / CELL), cw = Math.round(gwOf(wy0, yW) * PX_PER_GW / CELL);
      const same = cn === cw ? cn : cn + ' / ' + cw;
      P(c, fin(s, n, 2.6, 0.5), L('都是 ' + same + ' 格 = ' + gwOf(ny0, yN) + ' gw', 'Both ' + same + ' boxes = ' + gwOf(ny0, yN) + ' gw'), RUL_X, RUL_TOP + 5 * CELL + 70, WHITE, 22);
    }

    /* ② 方向相反：箭頭尖亮圈＋「向上／向下」 */
    const da = fin(s, n, 4.0, 0.5);
    const yNtip = yb - GW * PX_PER_GW, yWtip = yc + GW * PX_PER_GW;
    if (da > 0.02) {
      const pulse = s.u > 4.0 && s.u < 5.6 ? ((s.u - 4.0) % 0.8) / 0.8 : 0;
      [[yNtip, N_COL], [yWtip, W_COL]].forEach(([y, col]) => {
        withA(c, da, () => {
          W5.glow(c, TX, y, 26, col, 0.55);
          if (pulse > 0) { c.strokeStyle = W5.rgba(col, 0.9 * (1 - pulse)); c.lineWidth = 3; c.beginPath(); c.arc(TX, y, 10 + 22 * pulse, 0, TAU); c.stroke(); }
        });
      });
      T(c, fin(s, n, 4.3, 0.4), L('向上', 'Up'), TX + 26, yNtip + 26, N_COL, 22, 'left');
      T(c, fin(s, n, 4.7, 0.4), L('向下', 'Down'), TX + 26, yWtip - 24, W_COL, 22, 'left');
    }

    /* ③ 同一直線：一條虛線穿過兩支箭頭 */
    const lg = ease(seg(s.u, 6.2, 7.0));
    if (lg > 0.01) {
      const y0 = 104, y1 = 456;
      withA(c, 1, () => {
        c.save(); c.setLineDash([8, 6]); c.strokeStyle = W5.rgba(WHITE, 0.85); c.lineWidth = 2.5;
        c.shadowColor = 'rgba(255,255,255,0.7)'; c.shadowBlur = 8;
        /* 遇到 N、W 標示膠囊就跳過，不壓字 */
        const yE = lerp(y0, y1, lg), gaps = [[129, 171], [407, 449]];
        let ya = y0;
        gaps.concat([[yE, 9999]]).forEach(([g0, g1]) => {
          const yb2 = Math.min(g0, yE);
          if (yb2 > ya) { c.beginPath(); c.moveTo(TX, ya); c.lineTo(TX, yb2); c.stroke(); }
          ya = Math.max(ya, g1);
        });
        c.restore();
      });
      T(c, fin(s, n, 7.0, 0.4), L('同一直線', 'Same line'), TX + 16, 106, WHITE, 22, 'left');
    }
    glowBottom(c, fin(s, n, 8.0, 0.6), L('三個條件同時成立：二力平衡', 'All three hold: the forces balance'));
  }

  W5.register('twof', { canvas: 'cvs-twof', steps: DUR, draw });
})();
