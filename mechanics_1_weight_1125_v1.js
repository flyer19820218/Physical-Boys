/* ==================================================================
   mechanics_1 ｜ 重量：被星球拉的力（cvs-weight，960×540）
   四步：1 重量是超距力 → 2 彈簧秤量重量 → 3 月球只有 1/6 → 4 質量 vs 重量
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全站）：質量＝綠 COL.green（鐵塊上的 kg、質量欄）；重量／重力＝粉 COL.pink
   （引力箭頭、彈簧秤指針與讀數、kgw、重量欄）。鐵塊＝深灰鋼色（與 mass 同款立方體）。
   引力箭頭一律 18 px／kgw：地球 6 kgw＝108 px、月球 1 kgw＝18 px（長度剛好 1/6）。
   彈簧秤刻度 26 px／kgw；第 3 步保留地球 6 kgw 的虛線箭頭與刻度記號當脈絡。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   人物：March 圖（thinking＝月球上躲在大石頭後想、explaining＝講台後講解）；
   兩張都是半身圖，下半身由石頭／講台擋住，石頭與講台都立在地面線上。
   亂數一律 W5.hash；文字一律 L('中文','English')；整檔包在 IIFE。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const M_COL = COL.green;           /* 質量：綠 */
  const W_COL = COL.pink;            /* 重量：粉 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', SPACE = '#0b1a15';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */
  const PX_KGW = 18;                 /* 引力箭頭：每 kgw 幾 px */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── March 圖 ── */
  const MARCH = {};
  ['thinking', 'explaining'].forEach(p => { const im = new Image(); im.src = 'assets/characters/march/' + p + '.png'; MARCH[p] = im; });
  /* 左緣 x、圖底 yb、高 h（半身圖：圖底要被前景擋住） */
  function march(c, pose, x, yb, h, a, rot) {
    const im = MARCH[pose];
    if (a <= 0.01 || !im || !im.complete || !im.naturalWidth) return;
    const w = im.naturalWidth * h / im.naturalHeight;
    c.save(); c.globalAlpha *= a;
    c.translate(x + w / 2, yb); if (rot) c.rotate(rot);
    c.drawImage(im, -w / 2, -h, w, h);
    c.restore();
  }

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫 ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
  function subtitle(c, a, str, border, col, yc) {
    if (a <= 0.02) return;
    yc = yc || 494;
    const size = 22, w = W5.tw(c, str, size) + 48, h = 46, y0 = yc - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    W5.label(c, str, 480, yc, col || WHITE, size);
    c.restore();
  }

  /* ── 鐵塊（與 mass 同款立方體）：cx 正面中心 x、top 正面頂 y ── */
  const BW = 84, BH = 62, BD = 20;
  function ironBlock(c, cx, top, a) {
    if (a <= 0.02) return;
    const x = cx - BW / 2, yb = top + BH, w = BW, h = BH, dx = BD, dy = -BD * 0.8;
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.moveTo(x + w, yb); c.lineTo(x + w + dx, yb + dy); c.lineTo(x + w + dx, top + dy); c.lineTo(x + w, top); c.closePath();
    const gs = c.createLinearGradient(x + w, 0, x + w + dx, 0); gs.addColorStop(0, '#46514f'); gs.addColorStop(1, '#2f3937');
    c.fillStyle = gs; c.fill();
    c.beginPath(); c.moveTo(x, top); c.lineTo(x + dx, top + dy); c.lineTo(x + w + dx, top + dy); c.lineTo(x + w, top); c.closePath();
    const gt = c.createLinearGradient(0, top + dy, 0, top); gt.addColorStop(0, '#c3cdca'); gt.addColorStop(1, '#93a09c');
    c.fillStyle = gt; c.fill();
    const gf = c.createLinearGradient(0, top, 0, yb); gf.addColorStop(0, '#83908d'); gf.addColorStop(1, '#4a5553');
    c.fillStyle = gf; c.fillRect(x, top, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
    for (let i = 0; i < h / 5; i++) {
      const yy = top + 3 + i * 5 + hash(i * 3.1 + 7) * 2;
      c.beginPath(); c.moveTo(x + 2, yy); c.lineTo(x + w - 2, yy); c.stroke();
    }
    c.strokeStyle = 'rgba(20,30,28,0.9)'; c.lineWidth = 1.5; c.strokeRect(x, top, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 1, top + 1); c.lineTo(x + w - 1, top + 1); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.beginPath(); c.moveTo(x + w, top); c.lineTo(x + w + dx, top + dy); c.stroke();
    c.restore();
    T(c, a, '6 kg', cx, top + h / 2 + 1, M_COL, 22, 'center', true);
  }

  /* ── 引力箭頭（粉，帶光暈）：從 (x,y0) 往下 len px ── */
  function gArrow(c, x, y0, len, a) {
    if (a <= 0.02 || len < 1) return;
    const head = Math.min(18, Math.max(10, len * 0.55)), lw = 7;
    c.save(); c.globalAlpha *= a;
    c.shadowColor = W5.rgba(W_COL, 0.8); c.shadowBlur = 14;
    c.fillStyle = W_COL;
    const shaft = Math.max(0, len - head);
    if (shaft > 0) { W5.rr(c, x - lw / 2, y0, lw, shaft + 2, 3); c.fill(); }
    c.beginPath(); c.moveTo(x, y0 + len); c.lineTo(x - head * 0.75, y0 + len - head); c.lineTo(x + head * 0.75, y0 + len - head); c.closePath(); c.fill();
    c.restore();
  }
  function ghostArrow(c, x, y0, len, a) {
    if (a <= 0.02) return;
    const head = 18;
    c.save(); c.globalAlpha *= a; c.setLineDash([6, 6]);
    c.strokeStyle = W5.rgba(W_COL, 0.6); c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - 3.5, y0); c.lineTo(x - 3.5, y0 + len - head); c.lineTo(x - head * 0.75, y0 + len - head);
    c.lineTo(x, y0 + len); c.lineTo(x + head * 0.75, y0 + len - head); c.lineTo(x + 3.5, y0 + len - head); c.lineTo(x + 3.5, y0);
    c.stroke(); c.restore();
  }

  function stars(c, n, x0, x1, y0, y1, seed) {
    for (let i = 0; i < n; i++) {
      const x = x0 + hash(i * 7.3 + seed) * (x1 - x0), y = y0 + hash(i * 3.9 + 1 + seed) * (y1 - y0), r = 0.8 + hash(i * 1.7 + seed) * 1.6;
      c.fillStyle = 'rgba(246,243,234,' + (0.2 + 0.5 * hash(i * 9.1 + seed)) + ')';
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  }

  /* ═══════════ 步驟 1：重量是超距力 ═══════════ */
  const EC = { x: 480, y: 1260, r: 820 };                 /* 大地球（只露出上緣） */
  const surfY = x => EC.y - Math.sqrt(EC.r * EC.r - (x - EC.x) * (x - EC.x));
  const B1 = { cx: 470, top: 168 };                       /* 懸空的鐵塊 */
  const B1_BOT = B1.top + BH;                             /* 230 */

  function bigEarth(c, a) {
    withA(c, a, () => {
      const sky = c.createLinearGradient(0, 32, 0, 460);
      sky.addColorStop(0, SPACE); sky.addColorStop(1, '#10261f');
      c.fillStyle = sky; c.fillRect(0, 32, 960, 508);
      stars(c, 50, 10, 950, 40, 380, 3);
      /* 大氣光暈 */
      c.save();
      const ga = c.createRadialGradient(EC.x, EC.y, EC.r - 10, EC.x, EC.y, EC.r + 70);
      ga.addColorStop(0, 'rgba(127,200,255,0.45)'); ga.addColorStop(1, 'rgba(127,200,255,0)');
      c.fillStyle = ga; c.beginPath(); c.arc(EC.x, EC.y, EC.r + 70, 0, TAU); c.fill();
      c.restore();
      /* 星球本體 */
      c.save(); c.beginPath(); c.arc(EC.x, EC.y, EC.r, 0, TAU); c.clip();
      const go = c.createLinearGradient(0, EC.y - EC.r, 0, EC.y - EC.r + 120);
      go.addColorStop(0, '#3d95dc'); go.addColorStop(1, '#14457a');
      c.fillStyle = go; c.fillRect(0, EC.y - EC.r, 960, 200);
      c.fillStyle = '#3f9a5a';
      [[90, 470, 90, 26, 0.08], [300, 500, 120, 34, -0.05], [610, 478, 70, 20, 0.1], [820, 505, 110, 30, -0.1], [470, 540, 60, 16, 0]].forEach(([x, y, rx, ry, rot]) => {
        c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill();
      });
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 5; c.lineCap = 'round';
      [[150, 452, 90], [520, 462, 120], [760, 470, 70]].forEach(([x, y, l]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + 3); c.stroke(); });
      const sh = c.createLinearGradient(0, 440, 0, 540);
      sh.addColorStop(0, 'rgba(11,26,21,0)'); sh.addColorStop(1, 'rgba(11,26,21,0.55)');
      c.fillStyle = sh; c.fillRect(0, 430, 960, 110);
      c.restore();
      c.strokeStyle = 'rgba(160,220,255,0.75)'; c.lineWidth = 2.5; c.beginPath(); c.arc(EC.x, EC.y, EC.r, 0, TAU); c.stroke();
    });
  }

  function draw1(c, s) {
    const u = s.u, k = s.k;
    bigEarth(c, k);
    T(c, k, L('地球', 'Earth'), 140, 512, WHITE, 24);

    /* 引力場線：從鐵塊指向地心的虛線，粉色光點沿線往下流（6.6 秒後停住） */
    const aF = ease(seg(u, 2.4, 3.0));
    const flow = Math.min(u, 6.6);
    withA(c, aF, () => {
      [-60, -30, 30, 60].forEach((dx, j) => {
        const x0 = B1.cx + dx, y0 = B1_BOT - 10;
        const ang = Math.atan2(EC.y - y0, EC.x - x0);
        const y1 = surfY(x0) - 4, len = (y1 - y0) / Math.sin(ang);
        const x1 = x0 + Math.cos(ang) * len;
        c.save(); c.setLineDash([5, 9]); c.lineDashOffset = -flow * 26 - j * 4;
        c.strokeStyle = W5.rgba(W_COL, 0.42); c.lineWidth = 2;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
        const live = 1 - ease(seg(u, 6.0, 6.6));
        if (live > 0.02) {
          for (let q = 0; q < 2; q++) {
            const f = ((flow * 0.45 + q * 0.5 + j * 0.17) % 1);
            const px = lerp(x0, x1, f), py = lerp(y0, y1, f);
            c.save(); c.globalAlpha *= live * Math.sin(Math.PI * f);
            W5.glow(c, px, py, 10, W_COL, 0.8); c.restore();
          }
        }
      });
    });

    /* 鐵塊：從上方滑入，懸在空中 */
    const aB = ease(seg(u, 0.3, 1.2));
    c.save(); c.translate(0, -(1 - aB) * 40);
    W5.glow(c, B1.cx + BD / 2, B1.top + BH / 2 - 6, 90, '#9fb0ac', 0.12 * aB);
    ironBlock(c, B1.cx, B1.top, aB);
    c.restore();

    /* 引力箭頭（從鐵塊底往下，長度＝6 kgw） */
    const grow = ease(seg(u, 1.4, 2.3));
    gArrow(c, B1.cx, B1_BOT, 6 * PX_KGW * grow, ease(seg(u, 1.4, 1.6)));
    P(c, ease(seg(u, 2.1, 2.6)), '6 kgw', B1.cx - 24, B1_BOT + 60, W_COL, 22, 'right', true);

    /* 沒有接觸：鐵塊底到地表的距離標示 */
    const gx = 640, gy0 = B1_BOT, gy1 = surfY(gx) - 6;
    const aG = ease(seg(u, 3.4, 4.0));
    withA(c, aG, () => {
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1.5; c.setLineDash([4, 6]);
      c.beginPath(); c.moveTo(B1.cx + BW / 2 + BD + 8, gy0); c.lineTo(gx + 14, gy0); c.stroke();
      c.setLineDash([]);
      W5.arrow(c, gx, (gy0 + gy1) / 2, gx, gy0 + 2, DIM, 2.5, 11);
      W5.arrow(c, gx, (gy0 + gy1) / 2, gx, gy1, DIM, 2.5, 11);
    });
    T(c, aG, L('沒有接觸', 'No contact'), gx + 18, (gy0 + gy1) / 2 - 22, WHITE, 24, 'left');
    P(c, ease(seg(u, 4.2, 4.7)), L('超距力', 'Non-contact force'), gx + 18, (gy0 + gy1) / 2 + 26, W_COL, 24, 'left');

    P(c, ease(seg(u, 4.9, 5.4)), L('重量＝地球拉物體的力', 'Weight = the pull of Earth on an object'), 480, 66, W_COL, 26);
    subtitle(c, ease(seg(u, 5.8, 6.4)), L('地球不用碰到鐵塊，也能把它往下拉', 'Earth pulls the block down without touching it'), null, WHITE);
  }

  /* ═══════════ 步驟 2、3：彈簧秤 ═══════════ */
  const GY = 480;                                         /* 地面／月面 */
  const SX = 420, ARM_Y = 60, SP_TOP = 74, L0 = 44, KS = 26; /* 彈簧：頂、原長、每 kgw 伸長 */
  const ZERO = SP_TOP + L0;                               /* 讀數 0 的位置 118 */
  const RUL = { x: 494, w: 50, y0: 92, y1: ZERO + KS * 7 + 16 };
  const POST = 250;
  const TITLE_X = 940;                                    /* 步驟 2、3 標題：靠右，不壓架子橫臂 */
  const yOf = r => ZERO + KS * r;                         /* 讀數 r 時彈簧下端 */

  function settle(x) {
    if (x <= 0) return 0;
    if (x >= 1.6) return 1;
    return 1 - Math.exp(-5 * x) * Math.cos(9 * x);
  }

  function steelV(c, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#7f8e8a'); g.addColorStop(0.35, '#e6eeeb'); g.addColorStop(1, '#6d7c78'); return g;
  }
  function steelH(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eef4f1'); g.addColorStop(1, '#7f8e8a'); return g;
  }
  /* 線圈：前後兩層，伸長時圈距自然變大 */
  function coil(c, x, y0, y1) {
    const turns = 10, amp = 15, n = turns * 14;
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, p0 = s0 * turns * TAU, p1 = s1 * turns * TAU;
        const front = Math.cos((p0 + p1) / 2) > 0;
        if ((pass === 1) !== front) continue;
        c.strokeStyle = front ? '#e9f0ed' : '#6f7f7b'; c.lineWidth = front ? 4 : 3.4;
        c.beginPath(); c.moveTo(x + amp * Math.sin(p0), lerp(y0, y1, s0)); c.lineTo(x + amp * Math.sin(p1), lerp(y0, y1, s1)); c.stroke();
      }
    }
    c.restore();
  }

  /* 彈簧秤（架子＋彈簧＋直尺刻度＋指針）；r＝讀數、blockA＝鐵塊透明度、ghost＝地球 6 kgw 記號 */
  function springScale(c, r, blockA, ghost) {
    const end = yOf(r);
    /* 架子 */
    c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, GY - 16, GY + 2); W5.rr(c, POST - 46, GY - 16, 92, 18, 7); c.fill(); c.restore();
    c.fillStyle = steelV(c, POST - 8, POST + 8); c.fillRect(POST - 8, ARM_Y, 16, GY - 16 - ARM_Y);
    c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    c.fillStyle = steelH(c, ARM_Y, ARM_Y + 14); W5.rr(c, POST - 10, ARM_Y, RUL.x + RUL.w + 14 - (POST - 10), 14, 7); c.fill(); c.restore();
    /* 直尺 */
    c.fillStyle = '#d6dfdc'; c.fillRect(RUL.x + RUL.w / 2 - 3, ARM_Y + 14, 6, RUL.y0 - ARM_Y - 14);
    c.fillStyle = 'rgba(11,26,21,0.94)'; W5.rr(c, RUL.x, RUL.y0, RUL.w, RUL.y1 - RUL.y0, 8); c.fill();
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 2.5; W5.rr(c, RUL.x, RUL.y0, RUL.w, RUL.y1 - RUL.y0, 8); c.stroke();
    if (ghost > 0.02) {
      c.save(); c.globalAlpha *= ghost; c.setLineDash([4, 4]); c.strokeStyle = W5.rgba(W_COL, 0.75); c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(RUL.x - 26, yOf(6)); c.lineTo(RUL.x + RUL.w, yOf(6)); c.stroke(); c.restore();
    }
    c.fillStyle = W5.rgba(W_COL, 0.3); c.fillRect(RUL.x + 1, end - 4, RUL.w - 2, 8);
    for (let i = 0; i <= 14; i++) {
      const y = ZERO + KS * i / 2, major = i % 2 === 0;
      c.strokeStyle = major ? WHITE : DIM; c.lineWidth = major ? 2.5 : 2;
      c.beginPath(); c.moveTo(RUL.x + 1, y); c.lineTo(RUL.x + (major ? 14 : 8), y); c.stroke();
    }
    for (let v = 0; v <= 7; v++) W5.label(c, String(v), RUL.x + 33, ZERO + KS * v, WHITE, 20, 'center', true);
    W5.label(c, 'kgw', RUL.x + RUL.w / 2, RUL.y1 + 22, W_COL, 22, 'center', true);
    /* 彈簧與掛鉤 */
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 4; c.beginPath(); c.moveTo(SX, ARM_Y + 14); c.lineTo(SX, SP_TOP + 4); c.stroke();
    coil(c, SX, SP_TOP + 4, end);
    c.strokeStyle = '#d6dfdc'; c.lineWidth = 3.5; c.beginPath(); c.arc(SX, end + 8, 7, -Math.PI / 2, Math.PI * 1.35); c.stroke();
    /* 指針 */
    c.save(); c.shadowColor = W5.rgba(W_COL, 0.8); c.shadowBlur = 10;
    c.fillStyle = W_COL; c.strokeStyle = W_COL; c.lineWidth = 4;
    c.beginPath(); c.moveTo(SX + 15, end); c.lineTo(RUL.x - 14, end); c.stroke();
    c.beginPath(); c.moveTo(RUL.x - 1, end); c.lineTo(RUL.x - 16, end - 8); c.lineTo(RUL.x - 16, end + 8); c.closePath(); c.fill();
    c.restore();
    /* 鐵塊（掛線＋鐵塊） */
    const top = end + 28;
    withA(c, blockA, () => {
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(SX, end + 15); c.lineTo(SX, top - 6); c.stroke();
      c.beginPath(); c.moveTo(SX - 16, top - 5); c.lineTo(SX, top - 12); c.lineTo(SX + 16, top - 5); c.stroke();
    });
    ironBlock(c, SX, top, blockA);
    return { end, bot: top + BH };
  }

  function earthGround(c, a) {
    withA(c, a, () => {
      const sky = c.createLinearGradient(0, 32, 0, GY);
      sky.addColorStop(0, '#0c1f19'); sky.addColorStop(1, '#16392e');
      c.fillStyle = sky; c.fillRect(0, 32, 960, GY - 32);
      c.fillStyle = 'rgba(246,243,234,0.06)';
      [[150, 150, 90, 16], [190, 162, 60, 12], [800, 120, 100, 18], [760, 134, 60, 12]].forEach(e => { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[3], 0, 0, TAU); c.fill(); });
      /* 遠山 */
      c.fillStyle = '#143128';
      c.beginPath(); c.moveTo(0, GY);
      for (let x = 0; x <= 960; x += 40) c.lineTo(x, GY - 40 - 30 * Math.sin(x * 0.011) - 16 * hash(x * 0.3));
      c.lineTo(960, GY); c.closePath(); c.fill();
      const g = c.createLinearGradient(0, GY, 0, 540);
      g.addColorStop(0, '#1c4a31'); g.addColorStop(1, '#10291f');
      c.fillStyle = g; c.fillRect(0, GY, 960, 60);
      c.strokeStyle = '#5fbf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
      c.strokeStyle = 'rgba(120,210,140,0.55)'; c.lineWidth = 2;
      for (let x = 6; x < 956; x += 13) {
        const h = 6 + 7 * hash(x * 0.37), lean = (hash(x * 1.3) - 0.5) * 6;
        c.beginPath(); c.moveTo(x, GY); c.lineTo(x + lean, GY - h); c.stroke();
      }
    });
  }
  function moonGround(c, a) {
    withA(c, a, () => {
      c.fillStyle = SPACE; c.fillRect(0, 32, 960, GY - 32 + 10);
      stars(c, 70, 10, 950, 44, 420, 11);
      /* 天上的小地球 */
      const ex = 892, ey = 170, er = 30;
      W5.glow(c, ex, ey, er * 1.8, '#7fc8ff', 0.3);
      c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip();
      const eg = c.createRadialGradient(ex - 10, ey - 12, 3, ex, ey, er);
      eg.addColorStop(0, '#6cb8f0'); eg.addColorStop(1, '#14457a');
      c.fillStyle = eg; c.fillRect(ex - er, ey - er, er * 2, er * 2);
      c.fillStyle = '#3f9a5a';
      c.beginPath(); c.ellipse(ex - 8, ey - 6, 12, 8, 0.4, 0, TAU); c.ellipse(ex + 10, ey + 10, 9, 6, -0.3, 0, TAU); c.fill();
      c.restore();
      /* 月面 */
      const g = c.createLinearGradient(0, GY - 10, 0, 540);
      g.addColorStop(0, '#a3aaa7'); g.addColorStop(1, '#4f5654');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, GY + 4);
      for (let x = 0; x <= 960; x += 20) c.lineTo(x, GY + 2 * Math.sin(x * 0.05) + (hash(x) - 0.5) * 2);
      c.lineTo(960, 540); c.lineTo(0, 540); c.closePath(); c.fill();
      c.strokeStyle = '#cfd6d3'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
      [[70, 512, 30], [200, 528, 22], [560, 520, 34], [700, 508, 18], [900, 524, 26]].forEach(([x, y, r]) => {
        c.fillStyle = 'rgba(60,66,64,0.55)'; c.beginPath(); c.ellipse(x, y, r, r * 0.3, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(220,226,223,0.45)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 1.5, r, r * 0.3, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      });
    });
  }
  /* 月球大石頭（立在月面上，擋住 March 的下半身） */
  function boulder(c, cx, a) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK; c.beginPath(); c.ellipse(cx, GY + 3, 104, 8, 0, 0, TAU); c.fill(); c.restore();
      c.beginPath();
      c.moveTo(cx - 100, GY + 2);
      c.bezierCurveTo(cx - 108, GY - 40, cx - 80, GY - 74, cx - 30, GY - 80);
      c.bezierCurveTo(cx + 10, GY - 92, cx + 70, GY - 80, cx + 92, GY - 48);
      c.bezierCurveTo(cx + 108, GY - 24, cx + 104, GY - 4, cx + 98, GY + 2);
      c.closePath();
      const g = c.createLinearGradient(cx - 60, GY - 90, cx + 60, GY);
      g.addColorStop(0, '#b9c0bd'); g.addColorStop(0.55, '#7d8683'); g.addColorStop(1, '#4b5351');
      c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(30,40,38,0.6)'; c.lineWidth = 1.5; c.stroke();
      [[-40, -40, 12], [30, -30, 9], [60, -56, 6], [-10, -14, 7]].forEach(([dx, dy, r]) => {
        c.fillStyle = 'rgba(60,66,64,0.5)'; c.beginPath(); c.ellipse(cx + dx, GY + dy, r, r * 0.6, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(220,226,223,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx + dx, GY + dy + 1, r, r * 0.6, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      });
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - 70, GY - 60); c.quadraticCurveTo(cx - 30, GY - 84, cx + 20, GY - 84); c.stroke();
    });
  }

  /* ── 步驟 2：地球上量 6 kgw ── */
  const R2_T = 1.5;
  const r2 = u => 6 * settle((u - R2_T) * 0.9);

  function draw2(c, s) {
    const u = s.u, k = s.k;
    earthGround(c, k);
    P(c, k, L('地球', 'Earth'), 24, 66, WHITE, 26, 'left');
    const r = r2(u);
    withA(c, k, () => {
      const blockA = ease(seg(u, 0.7, 1.3));
      c.save();
      const S = springScale(c, r, blockA, 0);
      c.restore();
      gArrow(c, SX, S.bot, r * PX_KGW, ease(seg(u, R2_T, R2_T + 0.3)));
    });
    const aR = ease(seg(u, 3.6, 4.1)), end = yOf(r);
    P(c, aR, '6 kgw', RUL.x + RUL.w + 16, end, W_COL, 24, 'left', true);
    P(c, ease(seg(u, 3.9, 4.4)), L('重量 6 kgw', 'Weight 6 kgw'), SX + 22, yOf(6) + 28 + BH + 66, W_COL, 22, 'left');
    P(c, ease(seg(u, 0.4, 0.9)), L('彈簧秤：測量重量', 'Spring scale reads weight'), TITLE_X, 66, W_COL, 26, 'right');
    /* 右側說明 */
    const aN = ease(seg(u, 4.6, 5.1));
    T(c, aN, L('彈簧伸長越多', 'More stretch'), 760, 236, WHITE, 24);
    withA(c, aN, () => W5.arrow(c, 760, 258, 760, 292, DIM, 3, 12));
    T(c, aN, L('重量越大', 'More weight'), 760, 314, W_COL, 24);
    subtitle(c, ease(seg(u, 5.4, 6.0)), L('地球上：6 kg 的鐵塊重 6 kgw', 'On Earth: a 6 kg block weighs 6 kgw'), W_COL, WHITE);
  }

  /* ── 步驟 3：月球上只剩 1 kgw ── */
  const R3_T = 1.6;
  const r3 = u => 6 - 5 * settle((u - R3_T) * 0.8);
  const BOULDER_X = 800;

  function draw3(c, s) {
    const u = s.u, k = s.k;
    /* 地球 → 月球：背景交叉淡入，彈簧秤不動 */
    earthGround(c, 1 - k);
    moonGround(c, k);
    P(c, k, L('月球', 'Moon'), 24, 66, WHITE, 26, 'left');
    const r = r3(u);
    const ghost = ease(seg(u, 1.4, 2.0));
    const S = springScale(c, r, 1, ghost);
    ghostArrow(c, SX, S.bot, 6 * PX_KGW, ghost * 0.9);
    gArrow(c, SX, S.bot, r * PX_KGW, 1);
    /* 地球時的讀數：淡出；地球記號：淡入 */
    P(c, 1 - ease(seg(u, 0.9, 1.35)), '6 kgw', RUL.x + RUL.w + 16, yOf(r), W_COL, 24, 'left', true);
    P(c, ghost, L('地球 6 kgw', 'Earth 6 kgw'), RUL.x + RUL.w + 16, yOf(6), DIM, 22, 'left');
    P(c, ease(seg(u, 4.0, 4.5)), L('重量 1 kgw', 'Weight 1 kgw'), RUL.x + RUL.w + 16, yOf(1), W_COL, 24, 'left');
    P(c, ease(seg(u, 4.2, 4.7)), '1 kgw', SX - 24, S.bot + 10, W_COL, 22, 'right', true);

    /* March 在大石頭後面想 */
    const aM = ease(seg(u, 0.6, 1.4));
    march(c, 'thinking', BOULDER_X - 74, GY - 40 + (1 - aM) * 30, 176, aM);
    boulder(c, BOULDER_X, k);

    P(c, ease(seg(u, 0.5, 1.0)), L('月球引力＝地球的 1/6', "Moon's pull = 1/6 Earth's"), TITLE_X, 66, W_COL, 26, 'right');
    subtitle(c, ease(seg(u, 5.0, 5.6)), L('鐵塊沒變，是月球拉它的力變小了', 'Same block: the Moon just pulls it less'), W_COL, WHITE);
  }

  /* ═══════════ 步驟 4：質量 vs 重量 ═══════════ */
  const CARD_L = { x: 40, w: 340 }, CARD_R = { x: 400, w: 340 };
  const C_TOP = 100, C_BOT = 444, FLOOR = 462;

  function planetIcon(c, x, y, moon, a) {
    withA(c, a, () => {
      if (moon) {
        W5.ball(c, x, y, 13, '#b9c0bd');
        c.fillStyle = 'rgba(70,78,75,0.6)';
        c.beginPath(); c.arc(x - 4, y - 2, 3.5, 0, TAU); c.arc(x + 5, y + 4, 2.5, 0, TAU); c.fill();
      } else {
        W5.ball(c, x, y, 13, '#3f8fd6');
        c.fillStyle = 'rgba(63,154,90,0.9)';
        c.beginPath(); c.ellipse(x - 3, y - 2, 6, 4, 0.4, 0, TAU); c.ellipse(x + 5, y + 5, 4, 3, 0, 0, TAU); c.fill();
      }
    });
  }
  function card(c, C, col, a, hi) {
    withA(c, a, () => {
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 16; c.shadowOffsetY = 4;
      c.fillStyle = 'rgba(23,51,42,0.96)'; W5.rr(c, C.x, C_TOP, C.w, C_BOT - C_TOP, 16); c.fill(); c.restore();
      c.fillStyle = W5.rgba(col, 0.14); W5.rr(c, C.x, C_TOP, C.w, 60, 16); c.fill();
      c.fillRect(C.x, C_TOP + 40, C.w, 20);
      c.strokeStyle = W5.rgba(col, 0.55 + 0.45 * (hi || 0)); c.lineWidth = 2.5; W5.rr(c, C.x, C_TOP, C.w, C_BOT - C_TOP, 16); c.stroke();
      c.strokeStyle = W5.rgba(col, 0.5); c.lineWidth = 2; c.beginPath(); c.moveTo(C.x, C_TOP + 60); c.lineTo(C.x + C.w, C_TOP + 60); c.stroke();
    });
  }
  function valueRow(c, C, a, y, moon, place, val, col, hi) {
    if (a <= 0.02) return;
    if (hi > 0.02) withA(c, a * hi, () => { c.fillStyle = W5.rgba(col, 0.14); W5.rr(c, C.x + 14, y - 20, C.w - 28, 40, 10); c.fill(); });
    planetIcon(c, C.x + 36, y, moon, a);
    T(c, a, place, C.x + 60, y, DIM, 22, 'left');
    T(c, a, val, C.x + C.w - 26, y, col, 26, 'right', true);
  }
  function miniBalance(c, x, y, a) {
    withA(c, a, () => {
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x, y + 20); c.moveTo(x - 16, y + 22); c.lineTo(x + 16, y + 22);
      c.moveTo(x - 26, y - 20); c.lineTo(x + 26, y - 20); c.stroke();
      c.lineWidth = 1.8;
      [-26, 26].forEach(d => {
        c.beginPath(); c.moveTo(x + d, y - 20); c.lineTo(x + d - 10, y + 2); c.moveTo(x + d, y - 20); c.lineTo(x + d + 10, y + 2); c.stroke();
        c.beginPath(); c.moveTo(x + d - 12, y + 2); c.quadraticCurveTo(x + d, y + 10, x + d + 12, y + 2); c.closePath();
        c.fillStyle = '#b9c4c1'; c.fill();
      });
      W5.ball(c, x, y - 21, 4, '#dfe8e4');
    });
  }
  function miniScale(c, x, y, a) {
    withA(c, a, () => {
      c.strokeStyle = '#d6dfdc'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 16, y - 28); c.lineTo(x + 16, y - 28); c.moveTo(x, y - 28); c.lineTo(x, y - 22); c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i <= 40; i++) { const t = i / 40; const yy = y - 22 + t * 30, xx = x + 7 * Math.sin(t * 6 * TAU); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
      c.strokeStyle = W_COL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 8, y + 2); c.lineTo(x + 18, y + 2); c.stroke();
      c.fillStyle = '#83908d'; c.fillRect(x - 11, y + 10, 22, 16);
      c.strokeStyle = '#c9d3d0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x, y + 10); c.stroke();
    });
  }
  function podium(c, cx, a) {
    withA(c, a, () => {
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK; c.beginPath(); c.ellipse(cx, FLOOR + 3, 74, 7, 0, 0, TAU); c.fill(); c.restore();
      const top = FLOOR - 112;
      const g = c.createLinearGradient(cx - 60, 0, cx + 60, 0);
      g.addColorStop(0, '#4a3220'); g.addColorStop(0.4, '#7a5636'); g.addColorStop(1, '#3d2816');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(cx - 58, top + 12); c.lineTo(cx + 58, top + 12); c.lineTo(cx + 50, FLOOR); c.lineTo(cx - 50, FLOOR); c.closePath(); c.fill();
      c.fillStyle = '#8a6040'; W5.rr(c, cx - 70, top, 140, 14, 4); c.fill();
      c.fillStyle = 'rgba(255,220,170,0.3)'; c.fillRect(cx - 68, top + 1, 136, 3);
      c.strokeStyle = 'rgba(255,220,170,0.18)'; c.lineWidth = 2;
      W5.rr(c, cx - 34, top + 34, 68, 46, 6); c.stroke();
    });
  }

  function draw4(c, s) {
    const u = s.u, k = s.k;
    /* 地板線 */
    withA(c, k, () => {
      const g = c.createLinearGradient(0, FLOOR, 0, 540);
      g.addColorStop(0, '#17332a'); g.addColorStop(1, '#0d201a');
      c.fillStyle = g; c.fillRect(0, FLOOR, 960, 540 - FLOOR);
      c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(960, FLOOR); c.stroke();
    });
    const aL = ease(seg(u, 0.2, 0.9)), aR = ease(seg(u, 0.5, 1.2));
    const hiV = ease(seg(u, 3.8, 4.3));
    c.save(); c.translate(-(1 - aL) * 30, 0); card(c, CARD_L, M_COL, aL, hiV); c.restore();
    c.save(); c.translate((1 - aR) * 30, 0); card(c, CARD_R, W_COL, aR, hiV); c.restore();
    T(c, aL, L('質量', 'Mass'), CARD_L.x + CARD_L.w / 2, C_TOP + 30, M_COL, 28);
    T(c, aR, L('重量', 'Weight'), CARD_R.x + CARD_R.w / 2, C_TOP + 30, W_COL, 28);

    /* 地球、月球的數值 */
    const aE = ease(seg(u, 1.2, 1.7)), aMn = ease(seg(u, 2.0, 2.5));
    const hiM = ease(seg(u, 2.0, 2.5));
    valueRow(c, CARD_L, aE, 200, false, L('在地球', 'On Earth'), '6 kg', M_COL, 0);
    valueRow(c, CARD_L, aMn, 248, true, L('在月球', 'On the Moon'), '6 kg', M_COL, 0);
    valueRow(c, CARD_R, aE, 200, false, L('在地球', 'On Earth'), '6 kgw', W_COL, 0);
    valueRow(c, CARD_R, aMn, 248, true, L('在月球', 'On the Moon'), '1 kgw', W_COL, hiM);

    /* 工具 */
    const aT = ease(seg(u, 2.8, 3.3));
    withA(c, aT, () => {
      c.strokeStyle = 'rgba(246,243,234,0.15)'; c.lineWidth = 1.5;
      [CARD_L, CARD_R].forEach(C => { c.beginPath(); c.moveTo(C.x + 20, 282); c.lineTo(C.x + C.w - 20, 282); c.stroke(); });
    });
    miniBalance(c, CARD_L.x + 50, 322, aT);
    miniScale(c, CARD_R.x + 50, 322, aT);
    T(c, aT, L('工具：天平', 'Tool: balance'), CARD_L.x + 92, 322, WHITE, 24, 'left');
    T(c, aT, L('工具：彈簧秤', 'Tool: spring scale'), CARD_R.x + 92, 322, WHITE, 24, 'left');

    /* 結論 */
    withA(c, hiV, () => { W5.glow(c, CARD_L.x + CARD_L.w / 2, 398, 80, M_COL, 0.18); W5.glow(c, CARD_R.x + CARD_R.w / 2, 398, 80, W_COL, 0.18); });
    P(c, hiV, L('不變', 'Stays the same'), CARD_L.x + CARD_L.w / 2, 398, M_COL, 28);
    P(c, hiV, L('會變', 'Changes'), CARD_R.x + CARD_R.w / 2, 398, W_COL, 28);

    /* March 在講台後講解 */
    const aM = ease(seg(u, 0.4, 1.2));
    const pX = 852;
    const sway = 0.03 * Math.sin((u - 1.2) * 4) * (1 - ease(seg(u, 5.6, 6.4))) * ease(seg(u, 1.2, 1.6));
    march(c, 'explaining', pX - 100, FLOOR - 72, 220, aM, sway);
    podium(c, pX, k);

    P(c, k, L('質量 vs 重量', 'Mass vs weight'), 390, 60, WHITE, 26);
    subtitle(c, ease(seg(u, 5.0, 5.6)), L('到月球：變輕，不是變瘦', 'On the Moon: lighter, not thinner'), W_COL, WHITE);
  }

  W5.register('weight', {
    canvas: 'cvs-weight',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) draw1(c, s);
      else if (s.n === 2) draw2(c, s);
      else if (s.n === 3) draw3(c, s);
      else draw4(c, s);
    }
  });
})();
