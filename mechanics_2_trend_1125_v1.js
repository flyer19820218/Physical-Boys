/* ==================================================================
   mechanics_2 ｜ 角度與分力：此消彼長（cvs-trend，960×540）
   四步：1 角度平緩 → 2 角度變陡 → 3 一路掃描 → 4 壓低拉桿
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。
   場景語彙沿用 mechanics_2_rect（同一個行李箱、March 拔河全身圖、地面刻度、比例尺），圖表畫法沿用 mechanics_2_angle。

   比例：PX_PER_GW＝2.5（1 gw＝2.5 px，整支動畫不變，同 rect）；1 格＝10 gw＝25 px。
         第 1、2 步背景淡方格以作用點 H（March 的拳頭）為格點；第 3 步左邊方格、長條、曲線圖縱軸都是同一個 2.5 px/gw。
   力（gw，向量由程式算）：F＝100 gw，與水平夾 θ（珊瑚）；水平分力 Fx＝F·cosθ（青）；垂直分力 Fy＝F·sinθ（粉）。
         畫面上的數字一律 Math.round；箭頭長＝gw × PX_PER_GW。
         20° → 94／34；60° → 50／87；45° → 71／71；0° → 100／0；90° → 0／100。
   第 1、2 步（側視，同 rect）：地面線 GY＝450；March（tug_march_left 左右翻轉、裁掉繩頭）拳頭 H 固定在 (520, 310)，腳踩 GY。
         行李箱同 rect 的畫法；拉桿起點在箱子前上角（比拳頭低 48 px）。
         拳頭高度固定，所以角度變陡＝箱子靠近、拉桿縮短（伸縮拉桿）：箱子左緣 x0＝H.x − 48/tanθ − 146。
   第 3 步：抽象圖。左：方格板＋F 繞作用點 O 轉；中：兩根長條（青、粉）；右：Fx(θ)、Fy(θ) 曲線（θ 0～90°）。
         三者底線同一條 BASE＝430，長條與曲線的縱軸也用 2.5 px/gw，學生可以直接比較長度。
   第 4 步：上下兩條賽道。人物 0.3 倍、行李箱 0.6 倍（與 rect 的 0.5：1 同比例）。
         上：March 拉桿 20°；下：April（tug_april_right，裁掉繩頭）拉桿 60°。兩人都用 100 gw。
         只畫水平分力箭頭（從拳頭出發，2.5 px/gw）；位移 ∝ 水平分力（同一條時間曲線 × Fx），所以上面永遠走得比較遠。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const F_COL = COL.coral;           /* 被分解的原力 F：珊瑚 */
  const X_COL = COL.teal;            /* 水平分力：青 */
  const Y_COL = COL.pink;            /* 垂直分力：粉 */
  const WHITE = COL.white, DIM = COL.dim, INK = '#0b1a15', HI = COL.yellow;
  const DUR = [9, 9, 12, 10];        /* 總長 40 秒 */

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

  /* 跨步時間 */
  const since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  const fin = (s, n, t, d) => ease(clamp01(since(s, n, t) / (d || 0.5)));
  const fout = (s, n, t, d) => 1 - fin(s, n, t, d);

  /* ═══════════ 比例與向量 ═══════════ */
  const PX_PER_GW = 2.5;             /* 1 gw ＝ 2.5 px（整支動畫不變） */
  const CELL = 10 * PX_PER_GW;       /* 1 格 ＝ 10 gw ＝ 25 px */
  const F_GW = 100;
  const fOf = th => ({ x: F_GW * Math.cos(th * DEG), y: -F_GW * Math.sin(th * DEG) });   /* 畫面座標 y 向下 */
  const fxOf = th => ({ x: fOf(th).x, y: 0 });
  const fyOf = th => ({ x: 0, y: fOf(th).y });
  const mag = v => Math.hypot(v.x, v.y);
  const gwOf = v => Math.round(mag(v));
  const px = (o, v, g) => ({ x: o.x + v.x * PX_PER_GW * (g == null ? 1 : g), y: o.y + v.y * PX_PER_GW * (g == null ? 1 : g) });

  /* ═══════════ 版面（第 1、2 步，同 rect） ═══════════ */
  const GY = 450, KEY_Y = 62, BOT_Y = 500;
  const SC = 0.5;                    /* March 拔河圖縮放（原圖 352×572） */
  const IMG_FOOT = 565, IMG_HAND_Y = 285;
  const M_W = 352, M_HAND_X = 318, M_CLIP = 322;      /* March：拳頭 x、繩頭裁切（右側，翻轉後在左） */
  const A_W = 346, A_HAND_X = 40, A_CLIP = 36;        /* April：拳頭 x、繩頭裁切（左側） */
  const H = { x: 520, y: GY - (IMG_FOOT - IMG_HAND_Y) * SC };   /* 作用點：拳頭 (520, 310) */
  /* 行李箱（本機座標：左緣 x＝0、地面 y＝0；同 rect 的尺寸） */
  const BOX = { w: 150, h: 70 }, WHEEL_R = 14, WHEEL_INSET = 26, BOX_LIFT = WHEEL_R + 8;
  const ROD0 = { x: BOX.w - 4, y: -(BOX_LIFT + BOX.h) };        /* 拉桿起點（箱子前上角） */
  const TH1 = 20, TH2 = 60;
  /* 拳頭高度固定 → 箱子左緣隨角度移動（世界座標） */
  const boxX0 = (hand, gy, sc, th) => hand.x - ((gy + ROD0.y * sc) - hand.y) / Math.tan(th * DEG) - ROD0.x * sc;

  /* ═══════════ 角色圖 ═══════════ */
  const IMG = {};
  [['M', 'tug_march_left'], ['A', 'tug_april_right']].forEach(([k, n]) => { const im = new Image(); im.src = 'assets/characters/tug/' + n + '.png'; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth;
  function shadow(c, x, gy, w) {
    c.save(); c.globalAlpha *= 0.4; c.fillStyle = INK;
    c.beginPath(); c.ellipse(x, gy + 3, w, w * 0.1, 0, 0, TAU); c.fill(); c.restore();
  }
  /* March 左右翻轉：面向左、往右拉（拳頭 hand 在左側），腳踩 gy */
  function march(c, a, hand, gy, sc) {
    if (a <= 0.02 || !ok(IMG.M)) return;
    const left = hand.x - (M_W - M_HAND_X) * sc, top = gy - IMG_FOOT * sc;
    withA(c, a, () => {
      shadow(c, left + (M_W - 170) * sc, gy, 160 * sc);
      c.save(); c.translate(left + M_W * sc, top); c.scale(-1, 1);
      c.drawImage(IMG.M, 0, 0, M_CLIP, 572, 0, 0, M_CLIP * sc, 572 * sc);
      c.restore();
    });
  }
  /* April：原圖就是面向左、往右拉（拳頭在左側），裁掉左邊繩頭 */
  function april(c, a, hand, gy, sc) {
    if (a <= 0.02 || !ok(IMG.A)) return;
    const left = hand.x - A_HAND_X * sc, top = gy - IMG_FOOT * sc;
    withA(c, a, () => {
      shadow(c, left + 170 * sc, gy, 160 * sc);
      c.drawImage(IMG.A, A_CLIP, 0, A_W - A_CLIP, 572, left + A_CLIP * sc, top, (A_W - A_CLIP) * sc, 572 * sc);
    });
  }
  /* March 透明度：第 1 步箭頭出現時淡成 0.45（讓分力看得清楚）；第 2 步維持 */
  const marchA = s => (s.n === 1 ? s.k * lerp(1, 0.45, ease(seg(s.u, 1.0, 1.8))) : 0.45);

  /* ═══════════ 背景：淡方格（以 H 為格點）＋地面＋會後退的刻度（同 rect） ═══════════ */
  function backdrop(c) {
    const gl = c.createRadialGradient(560, 240, 30, 560, 240, 560);
    gl.addColorStop(0, 'rgba(255,128,64,0.05)'); gl.addColorStop(1, 'rgba(255,128,64,0)');
    c.fillStyle = gl; c.fillRect(0, 32, 960, GY - 32);
    c.strokeStyle = 'rgba(246,243,234,0.09)'; c.lineWidth = 1.2;
    for (let x = H.x - Math.floor(H.x / CELL) * CELL; x <= 960; x += CELL) { c.beginPath(); c.moveTo(x, 88); c.lineTo(x, GY); c.stroke(); }
    for (let y = H.y - Math.floor((H.y - 88) / CELL) * CELL; y <= GY; y += CELL) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
  }
  const TICK = 60;
  function ground(c, gy, y1, dist) {
    const g = c.createLinearGradient(0, gy, 0, y1);
    g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
    c.fillStyle = g; c.fillRect(0, gy, 960, y1 - gy);
    if (dist != null) {
      const off = ((dist % TICK) + TICK) % TICK;
      c.strokeStyle = 'rgba(246,243,234,0.28)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let x = -off; x < 970; x += TICK) { c.beginPath(); c.moveTo(x, gy + 6); c.lineTo(x - 10, gy + 18); c.stroke(); }
    }
    const e = c.createLinearGradient(0, 0, 960, 0);
    e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.30)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
    c.strokeStyle = e; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, gy); c.lineTo(960, gy); c.stroke();
  }
  function legend(c, a, x, y) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.28)'; c.fillRect(x, y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(x, y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 10 gw', '1 box = 10 gw'), x + CELL + 10, y, DIM, 22, 'left');
  }
  function glowBottom(c, a, str, col, x, y) {
    x = x == null ? 570 : x; y = y == null ? BOT_Y : y;
    if (a > 0.02) W5.glow(c, x, y, 200, col, 0.10 * a);
    P(c, a, str, x, y, col, 24, 'center');
  }

  /* ═══════════ 行李箱（同 rect 的畫法；x0＝左緣、gy＝地面、sc＝縮放） ═══════════ */
  function wheel(c, x, y, rot) {
    c.fillStyle = '#26302d'; c.beginPath(); c.arc(x, y, WHEEL_R, 0, TAU); c.fill();
    c.strokeStyle = '#0f1714'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#9aa6a2'; c.beginPath(); c.arc(x, y, WHEEL_R * 0.55, 0, TAU); c.fill();
    c.strokeStyle = '#4b5754'; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const a = rot + i * TAU / 3;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * WHEEL_R * 0.55, y + Math.sin(a) * WHEEL_R * 0.55); c.stroke();
    }
    c.fillStyle = '#d9e2dd'; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill();
  }
  /* travel：箱子相對地面走過的距離（給輪子轉）；sp：速度感 0..1；回傳拉桿起點（世界座標） */
  function suitcase(c, a, x0, gy, sc, travel, sp) {
    withA(c, a, () => {
      c.save(); c.translate(x0, gy); c.scale(sc, sc);
      /* 影子 */
      c.save(); c.globalAlpha *= 0.45; c.fillStyle = INK;
      c.beginPath(); c.ellipse(BOX.w / 2, 3, BOX.w * 0.58, 7, 0, 0, TAU); c.fill(); c.restore();
      /* 小風線（往後飄） */
      if (sp > 0.03) {
        c.strokeStyle = 'rgba(200,214,206,' + (0.45 * sp).toFixed(3) + ')'; c.lineWidth = 3; c.lineCap = 'round';
        [-40, -62, -84].forEach((dy, i) => {
          const x = -16 - 30 * W5.hash(i + 3);
          c.beginPath(); c.moveTo(x, dy); c.lineTo(x - 26 - 18 * sp, dy); c.stroke();
        });
      }
      const rot = travel / (WHEEL_R * sc);
      wheel(c, WHEEL_INSET, -WHEEL_R, rot);
      wheel(c, BOX.w - WHEEL_INSET, -WHEEL_R, rot);
      const x = 0, y = -(BOX_LIFT + BOX.h), w = BOX.w, h = BOX.h;
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      const g = c.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#5b8fd6'); g.addColorStop(1, '#2f5a99');
      c.fillStyle = g; W5.rr(c, x, y, w, h, 12); c.fill(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 10, y + 3); c.lineTo(x + w - 10, y + 3); c.stroke();
      c.strokeStyle = 'rgba(20,40,70,0.65)'; c.lineWidth = 2.5;
      for (let i = 1; i <= 3; i++) { const xx = x + i * w / 4; c.beginPath(); c.moveTo(xx, y + 8); c.lineTo(xx, y + h - 8); c.stroke(); }
      c.setLineDash([4, 4]); c.strokeStyle = 'rgba(230,236,240,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 8, y + h * 0.5); c.lineTo(x + w - 8, y + h * 0.5); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#23324a';
      [[x, y], [x + w - 14, y], [x, y + h - 14], [x + w - 14, y + h - 14]].forEach(([qx, qy]) => { W5.rr(c, qx, qy, 14, 14, 5); c.fill(); });
      c.strokeStyle = '#16243a'; c.lineWidth = 2; W5.rr(c, x, y, w, h, 12); c.stroke();
      c.fillStyle = '#4b5754'; W5.rr(c, ROD0.x - 10, ROD0.y - 6, 18, 12, 3); c.fill();
      c.restore();
    });
    return { x: x0 + ROD0.x * sc, y: gy + ROD0.y * sc };
  }
  /* 拉桿：從 A 到拳頭 hand（雙管＋伸縮接頭＋握把） */
  function rod(c, a, A, hand, sc) {
    withA(c, a, () => {
      const ang = Math.atan2(hand.y - A.y, hand.x - A.x), len = Math.hypot(hand.x - A.x, hand.y - A.y);
      c.save(); c.translate(A.x, A.y); c.rotate(ang); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 10 * sc; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
      c.strokeStyle = '#b8c4c0'; c.lineWidth = 6 * sc; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5 * sc; c.beginPath(); c.moveTo(2, -1.5 * sc); c.lineTo(len - 4, -1.5 * sc); c.stroke();
      c.fillStyle = '#6d7a76'; c.fillRect(len * 0.45 - 4 * sc, -5 * sc, 8 * sc, 10 * sc);
      c.strokeStyle = '#2b3330'; c.lineWidth = 9 * sc; c.beginPath(); c.moveTo(len, -11 * sc); c.lineTo(len, 11 * sc); c.stroke();
      c.restore();
    });
  }

  /* ═══════════ 力的箭頭（同 rect） ═══════════ */
  function fArrow(c, x0, y0, x1, y1, a, col, lw) {
    if (a <= 0.02 || Math.hypot(x1 - x0, y1 - y0) < 4) return;
    lw = lw || 7;
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, 26);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, 22);
    c.restore();
  }
  function vecArrow(c, o, v, g, a, col, lw) {
    if (g <= 0.01) return;
    const t = px(o, v, g);
    fArrow(c, o.x, o.y, t.x, t.y, a, col, lw);
  }
  function dashLine(c, x0, y0, x1, y1, col, a, lw) {
    withA(c, a, () => {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = col; c.lineWidth = lw || 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
    });
  }
  function apDot(c, o, a) {
    withA(c, a, () => {
      W5.glow(c, o.x, o.y, 26, F_COL, 0.5);
      c.fillStyle = INK; c.beginPath(); c.arc(o.x, o.y, 8, 0, TAU); c.fill();
      W5.ball(c, o.x, o.y, 6, WHITE);
    });
  }
  /* 長方形：F 尖端往下、往左兩條虛線＋淡填色＋直角記號＋落在軸上的兩邊 */
  function rectangle(c, o, th, gV, gH, gF) {
    const tip = px(o, fOf(th)), TXp = { x: tip.x, y: o.y }, TYp = { x: o.x, y: tip.y };
    withA(c, gF, () => {
      c.fillStyle = 'rgba(246,243,234,0.07)';
      c.fillRect(o.x, tip.y, tip.x - o.x, o.y - tip.y);
    });
    if (gV > 0.01) dashLine(c, tip.x, tip.y, tip.x, lerp(tip.y, o.y, gV), 'rgba(246,243,234,0.85)', 1, 3);
    if (gH > 0.01) dashLine(c, tip.x, tip.y, lerp(tip.x, o.x, gH), tip.y, 'rgba(246,243,234,0.85)', 1, 3);
    withA(c, gF, () => {
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 2;
      const q = 13;
      if (tip.x - o.x > 2 * q && o.y - tip.y > 2 * q) {
        c.beginPath(); c.moveTo(TXp.x - q, o.y); c.lineTo(TXp.x - q, o.y - q); c.lineTo(TXp.x, o.y - q); c.stroke();
        c.beginPath(); c.moveTo(o.x, TYp.y + q); c.lineTo(o.x + q, TYp.y + q); c.lineTo(o.x + q, TYp.y); c.stroke();
      }
    });
  }
  /* 角度弧＋「θ = …°」字（字在弧外、角平分線方向） */
  function angleMark(c, o, th, a, r, lr, withText) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      dashLine(c, o.x + 10, o.y, o.x + r + 60, o.y, 'rgba(246,243,234,0.45)', 1, 2);
      if (th > 0.5) { c.strokeStyle = WHITE; c.lineWidth = 2.5; c.beginPath(); c.arc(o.x, o.y, r, -th * DEG, 0); c.stroke(); }
    });
    if (withText) {
      const m = th / 2 * DEG;
      T(c, a, 'θ = ' + Math.round(th) + '°', o.x + lr * Math.cos(m), o.y - lr * Math.sin(m), WHITE, 24, 'left', true);
    }
  }

  /* ═══════════ 第 1、2 步：側視場景 ═══════════ */
  /* 角度：第 1 步 20°；第 2 步 0.8～3.6 秒 20° → 60° */
  const thOf = s => (s.n === 1 ? TH1 : lerp(TH1, TH2, ease(seg(s.u, 0.8, 3.6))));
  /* 鏡頭跟著箱子：地面刻度往後退的距離 */
  const D1 = 200, D2 = Math.round(D1 * Math.cos(TH2 * DEG) / Math.cos(TH1 * DEG));   /* 同樣時間，走的距離 ∝ 水平分力 */
  function distOf(s) {
    if (s.n === 1) return D1 * ease(seg(s.u, 2.0, 6.8));
    return D1 + D2 * ease(seg(s.u, 4.4, 7.2));
  }
  function speedOf(s) {
    const bell = (u, a, b) => { const t = seg(u, a, b); return t > 0 && t < 1 ? 4 * t * (1 - t) : 0; };
    if (s.n === 1) return bell(s.u, 2.0, 6.8);
    return bell(s.u, 4.4, 7.2) * D2 / D1;
  }
  function scene(c, s) {
    const th = thOf(s), dist = distOf(s);
    ground(c, GY, 540, dist);
    legend(c, 1, 22, BOT_Y);
    const k = s.n === 1 ? s.k : 1;
    const x0 = boxX0(H, GY, 1, th);
    const A = suitcase(c, k, x0, GY, 1, dist + (x0 - boxX0(H, GY, 1, TH1)), speedOf(s));
    rod(c, k, A, H, 1);
    march(c, marchA(s), H, GY, SC);
    return th;
  }
  /* 標籤（位置跟著 θ 走） */
  function fLabel(c, th, a) {
    const tip = px(H, fOf(th));
    P(c, a, 'F = ' + F_GW + ' gw', tip.x + 16, tip.y - 4, F_COL, 24, 'left', true);
  }
  function xLabel(c, th, a) {
    const tx = px(H, fxOf(th));
    P(c, a, L('水平分力 = ', 'Horizontal = ') + gwOf(fxOf(th)) + ' gw', Math.max((H.x + tx.x) / 2, H.x + 40), H.y + 36, X_COL, 22, 'center');
  }
  function yLabel(c, th, a) {
    const ty = px(H, fyOf(th));
    P(c, a, L('垂直分力 = ', 'Vertical = ') + gwOf(fyOf(th)) + ' gw', H.x - 18, (H.y + ty.y) / 2 - 4, Y_COL, 22, 'right');
  }
  function forces(c, s, th, gF, gR, gX, gY, aLab) {
    const tip = px(H, fOf(th));
    rectangle(c, H, th, gR[0], gR[1], gR[2]);
    angleMark(c, H, th, aLab[0], 60, 0, false);
    const m = th / 2 * DEG;
    T(c, aLab[0], 'θ', H.x + 84 * Math.cos(m), H.y - 84 * Math.sin(m) + 1, WHITE, 22, 'center', true);
    P(c, aLab[0], 'θ = ' + Math.round(th) + '°', 24, 122, WHITE, 24, 'left', true);
    vecArrow(c, H, fOf(th), gF, 1, F_COL, 8);
    vecArrow(c, H, fxOf(th), gX, 1, X_COL, 10);
    vecArrow(c, H, fyOf(th), gY, 1, Y_COL, 10);
    apDot(c, H, gF > 0.02 ? 1 : 0);
    fLabel(c, th, aLab[0]);
    xLabel(c, th, aLab[1]);
    yLabel(c, th, aLab[2]);
    return tip;
  }

  /* ── 第 1 步：角度平緩 ── */
  function step1(c, s) {
    const n = 1, u = s.u, th = scene(c, s);
    P(c, fin(s, n, 0.3, 0.5), L('角度平緩：往前的力大', 'Gentle angle: big forward part'), 480, KEY_Y, WHITE, 24);
    const gF = ease(seg(u, 0.8, 1.8));
    const gR = [ease(seg(u, 2.6, 3.2)), ease(seg(u, 3.0, 3.6)), ease(seg(u, 3.4, 3.8))];
    forces(c, s, th, gF, gR, ease(seg(u, 3.8, 4.6)), ease(seg(u, 4.8, 5.4)),
      [fin(s, n, 1.8, 0.4), fin(s, n, 4.6, 0.4), fin(s, n, 5.4, 0.4)]);
    glowBottom(c, fin(s, n, 6.2, 0.5), L('水平分力長、垂直分力短', 'Horizontal long, vertical short'), X_COL);
  }

  /* ── 第 2 步：角度變陡 ── */
  function step2(c, s) {
    const n = 2, u = s.u, th = scene(c, s);
    P(c, fin(s, n, 0.3, 0.5), L('角度變陡：往前的力變小', 'Steeper: less forward pull'), 480, KEY_Y, WHITE, 24);
    /* 20° 時的水平分力留一條青色虛線，跟現在的比 */
    const ghost = fin(s, n, 0.4, 0.4);
    const t20 = px(H, fxOf(TH1));
    withA(c, ghost * 0.9, () => {
      c.save(); c.setLineDash([8, 6]); c.strokeStyle = X_COL; c.lineWidth = 3;
      c.strokeRect(H.x, H.y - 7, t20.x - H.x, 14); c.restore();
    });
    T(c, ghost * fin(s, n, 3.6, 0.4), L('原本 ', 'was ') + gwOf(fxOf(TH1)), t20.x + 12, H.y, X_COL, 22, 'left', true);
    forces(c, s, th, 1, [1, 1, 1], 1, 1, [1, 1, 1]);
    glowBottom(c, fin(s, n, 4.2, 0.5), L('垂直分力變大，往前的力變小', 'Vertical grows, forward part shrinks'), Y_COL);
  }

  /* ═══════════ 第 3 步：一路掃描 ═══════════ */
  const BASE = 430;                                  /* 三塊共同的底線 */
  const PANEL = { y0: 92, y1: 470 };
  const MAT = { x0: 16, x1: 356 };
  const O = { x: 58, y: BASE };                      /* 第 3 步的作用點 */
  const BAR = { x0: 366, x1: 524, cx: [410, 482], w: 44 };
  const GRP = { x0: 534, x1: 948 }, GX0 = 594, PX_PER_DEG = 3.6;
  const gxOf = th => GX0 + th * PX_PER_DEG;
  const gyOf = v => BASE - v * PX_PER_GW;
  /* θ(u)：0～1.4 秒停 0°；1.4～4.6 掃到 45°；4.6～6.2 停；6.2～9.4 掃到 90°；之後停 */
  function sweepTh(s) {
    if (s.n < 3) return 0;
    if (s.n > 3) return 90;
    const u = s.u;
    if (u < 4.6) return 45 * ease(seg(u, 1.4, 4.6));
    return 45 + 45 * ease(seg(u, 6.2, 9.4));
  }
  function panel(c, x0, x1, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(11,26,21,0.55)'; W5.rr(c, x0, PANEL.y0, x1 - x0, PANEL.y1 - PANEL.y0, 16); c.fill();
      c.strokeStyle = 'rgba(163,184,176,0.35)'; c.lineWidth = 2; W5.rr(c, x0, PANEL.y0, x1 - x0, PANEL.y1 - PANEL.y0, 16); c.stroke();
    });
  }
  function matGrid(c, a) {
    panel(c, MAT.x0, MAT.x1, a);
    withA(c, a, () => {
      c.save(); W5.rr(c, MAT.x0, PANEL.y0, MAT.x1 - MAT.x0, PANEL.y1 - PANEL.y0, 16); c.clip();
      c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1.2;
      for (let x = O.x - Math.floor((O.x - MAT.x0) / CELL) * CELL; x <= MAT.x1; x += CELL) { c.beginPath(); c.moveTo(x, PANEL.y0); c.lineTo(x, PANEL.y1); c.stroke(); }
      for (let y = O.y - Math.floor((O.y - PANEL.y0) / CELL) * CELL; y <= PANEL.y1; y += CELL) { c.beginPath(); c.moveTo(MAT.x0, y); c.lineTo(MAT.x1, y); c.stroke(); }
      c.restore();
      c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(MAT.x0 + 8, BASE); c.lineTo(MAT.x1 - 8, BASE); c.stroke();
    });
  }
  function bars(c, th, a) {
    panel(c, BAR.x0, BAR.x1, a);
    const vals = [fxOf(th), fyOf(th)], cols = [X_COL, Y_COL];
    withA(c, a, () => {
      c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1.2;
      for (let v = 10; v <= 100; v += 10) { c.beginPath(); c.moveTo(BAR.x0 + 8, gyOf(v)); c.lineTo(BAR.x1 - 8, gyOf(v)); c.stroke(); }
      c.strokeStyle = 'rgba(246,243,234,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(BAR.x0 + 8, BASE); c.lineTo(BAR.x1 - 8, BASE); c.stroke();
      vals.forEach((v, i) => {
        const h = mag(v) * PX_PER_GW, x = BAR.cx[i] - BAR.w / 2;
        if (h < 0.5) return;
        c.save(); c.shadowColor = W5.rgba(cols[i], 0.7); c.shadowBlur = 12;
        const g = c.createLinearGradient(0, BASE - h, 0, BASE);
        g.addColorStop(0, cols[i]); g.addColorStop(1, W5.mix(cols[i], INK, 0.45));
        c.fillStyle = g; c.fillRect(x, BASE - h, BAR.w, h); c.restore();
        c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x, BASE - h, BAR.w, h);
      });
    });
    vals.forEach((v, i) => T(c, a, String(gwOf(v)), BAR.cx[i], BASE - mag(v) * PX_PER_GW - 20, cols[i], 24, 'center', true));
    T(c, a, L('水平', 'Horiz.'), BAR.cx[0], BASE + 22, X_COL, 22, 'center');
    T(c, a, L('垂直', 'Vert.'), BAR.cx[1], BASE + 22, Y_COL, 22, 'center');
  }
  function graph(c, s, th, a) {
    panel(c, GRP.x0, GRP.x1, a);
    withA(c, a, () => {
      c.strokeStyle = 'rgba(246,243,234,0.10)'; c.lineWidth = 1.2;
      for (let v = 10; v <= 100; v += 10) { c.beginPath(); c.moveTo(GX0, gyOf(v)); c.lineTo(gxOf(90), gyOf(v)); c.stroke(); }
      for (let d = 15; d <= 90; d += 15) { c.beginPath(); c.moveTo(gxOf(d), BASE); c.lineTo(gxOf(d), gyOf(100)); c.stroke(); }
      c.strokeStyle = WHITE; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(GX0, gyOf(104)); c.lineTo(GX0, BASE); c.lineTo(gxOf(93), BASE); c.stroke();
    });
    T(c, a, 'gw', GX0 - 12, gyOf(100) - 34, DIM, 22, 'right', true);
    [50, 100].forEach(v => T(c, a * 0.95, String(v), GX0 - 10, gyOf(v), DIM, 22, 'right', true));
    [0, 45, 90].forEach(d => T(c, a * 0.95, d + '°', gxOf(d), BASE + 22, DIM, 22, 'center', true));
    T(c, a, 'θ', gxOf(90) + 18, BASE - 26, WHITE, 22, 'center', true);
    /* 曲線：0 → θ */
    [[t => mag(fxOf(t)), X_COL], [t => mag(fyOf(t)), Y_COL]].forEach(([f, col]) => {
      withA(c, a, () => {
        c.strokeStyle = col; c.lineWidth = 4; c.lineJoin = 'round'; c.lineCap = 'round';
        c.shadowColor = W5.rgba(col, 0.6); c.shadowBlur = 8;
        c.beginPath();
        const N = Math.max(1, Math.ceil(th));
        for (let i = 0; i <= N; i++) { const t = th * i / N, x = gxOf(t), y = gyOf(f(t)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
        c.stroke();
      });
      const x = gxOf(th), y = gyOf(f(th));
      withA(c, a, () => { W5.glow(c, x, y, 20, col, 0.55); W5.ball(c, x, y, 8, col); });
    });
  }
  function step3(c, s) {
    const n = 3, u = s.u, th = sweepTh(s), a = s.k;
    P(c, fin(s, n, 0.3, 0.5), L('一路掃描：此消彼長', 'Sweep: one up, one down'), 480, KEY_Y, WHITE, 24);
    matGrid(c, a);
    bars(c, th, a);
    graph(c, s, th, a);
    /* 左：F 繞 O 轉 */
    rectangle(c, O, th, a, a, a);
    angleMark(c, O, th, a, 40, 0, false);
    if (th > 6) T(c, a, 'θ', O.x + 58 * Math.cos(th / 2 * DEG), O.y - 58 * Math.sin(th / 2 * DEG), WHITE, 24, 'center', true);
    vecArrow(c, O, fOf(th), 1, a, F_COL, 8);
    vecArrow(c, O, fxOf(th), 1, a, X_COL, 10);
    vecArrow(c, O, fyOf(th), 1, a, Y_COL, 10);
    apDot(c, O, a);
    P(c, a, 'θ = ' + Math.round(th) + '°', MAT.x0 + 14, PANEL.y0 + 30, WHITE, 24, 'left', true);
    P(c, a, 'F = ' + F_GW + ' gw', MAT.x1 - 14, PANEL.y0 + 30, F_COL, 22, 'right', true);
    /* 標註：0° 全是水平、45° 一樣大、90° 全是垂直 */
    const aH = fin(s, n, 0.9, 0.4);
    T(c, aH, L('全是水平', 'All horizontal'), GX0 + 14, gyOf(100) - 20, X_COL, 22, 'left');
    const aE = fin(s, n, 4.7, 0.4), xe = gxOf(45), ye = gyOf(mag(fxOf(45)));
    withA(c, aE, () => { W5.glow(c, xe, ye, 34, HI, 0.5); });
    dashLine(c, xe, ye + 12, xe, BASE - 50, 'rgba(255,224,102,0.7)', aE, 2);
    P(c, aE, L('兩個分力一樣大', 'Both parts equal'), xe, BASE - 30, HI, 22, 'center');
    T(c, fin(s, n, 9.4, 0.4), L('全是垂直', 'All vertical'), gxOf(90) - 6, gyOf(100) - 20, Y_COL, 22, 'right');
    glowBottom(c, fin(s, n, 9.9, 0.5), L('越平越往前，越陡越往上', 'Flatter = more forward, steeper = more up'), HI, 480, 505);
  }

  /* ═══════════ 第 4 步：壓低拉桿（兩條賽道） ═══════════ */
  const SR = 0.3, SB = SR * 2;                       /* 人物 0.3 倍、箱子 0.6 倍（同 rect 的比例） */
  const LANES = [
    { gy: 288, th: TH1, who: 'M', name: 'March' },
    { gy: 470, th: TH2, who: 'A', name: 'April' }
  ];
  const START_X = 130;                               /* 起點線＝箱子前緣 */
  const RACE = [1.6, 7.6];                           /* 比賽 6 秒 */
  const D_TOP = 320;                                 /* 上道 6 秒走的距離（px） */
  const K_V = D_TOP / mag(fxOf(TH1));                /* 位移 ∝ 水平分力：每 gw 幾 px */
  const travelOf = (s, lane) => K_V * mag(fxOf(lane.th)) * (s.n === 4 ? ease(seg(s.u, RACE[0], RACE[1])) : 0);
  const handOf = (lane, x0) => {
    const dy = (IMG_FOOT - IMG_HAND_Y) * SR + ROD0.y * SB;          /* 拳頭比拉桿起點高多少（px） */
    return { x: x0 + ROD0.x * SB + dy / Math.tan(lane.th * DEG), y: lane.gy - (IMG_FOOT - IMG_HAND_Y) * SR };
  };
  function poles(c, lane, a) {
    withA(c, a, () => {
      for (let i = 1; i <= 13; i++) {
        const x = START_X + i * 60, y = lane.gy;
        c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 18); c.stroke();
        c.fillStyle = i % 2 ? 'rgba(255,224,102,0.55)' : 'rgba(246,243,234,0.45)';
        c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x + 11, y - 14); c.lineTo(x, y - 10); c.closePath(); c.fill();
      }
      dashLine(c, START_X, lane.gy - 2, START_X, lane.gy - 76, 'rgba(246,243,234,0.6)', 1, 2.5);
    });
  }
  function laneDraw(c, s, lane, a) {
    const tr4 = travelOf(s, lane);
    const x0 = START_X - BOX.w * SB + tr4;
    const hand = handOf(lane, x0);
    const sp = s.n === 4 ? (() => { const t = seg(s.u, RACE[0], RACE[1]); return t > 0 && t < 1 ? 4 * t * (1 - t) : 0; })() * mag(fxOf(lane.th)) / 100 : 0;
    const A = suitcase(c, a, x0, lane.gy, SB, tr4, sp);
    rod(c, a, A, hand, SB);
    if (lane.who === 'M') march(c, a, hand, lane.gy, SR); else april(c, a, hand, lane.gy, SR);
    /* 只畫水平分力（從拳頭出發） */
    const fx = fxOf(lane.th), ga = ease(seg(s.u, 0.9, 1.5));
    vecArrow(c, hand, fx, ga, a, X_COL, 7);
    const tip = px(hand, fx);
    T(c, a * fin(s, 4, 1.4, 0.3), L('往前 ', 'fwd ') + gwOf(fx) + ' gw', tip.x + 12, hand.y, X_COL, 22, 'left', true);
    return { front: x0 + BOX.w * SB, top: lane.gy + ROD0.y * SB };
  }
  function step4(c, s) {
    const n = 4, a = s.k;
    P(c, fin(s, n, 0.3, 0.5), L('壓低拉桿：比一比', 'Lower the handle: race!'), 480, KEY_Y, WHITE, 24);
    ground(c, LANES[0].gy, LANES[0].gy + 20, null);
    ground(c, LANES[1].gy, 540, null);
    LANES.forEach(l => poles(c, l, a));
    const R = LANES.map(l => laneDraw(c, s, l, a));
    LANES.forEach((l, i) => {
      T(c, a, l.name, 30, l.gy - 128, i ? Y_COL : X_COL, 24, 'left');
      P(c, a, 'θ = ' + l.th + '°', 26, l.gy - 90, WHITE, 22, 'left', true);
    });
    /* 結尾：箱子位置差 */
    const g = fin(s, n, 7.8, 0.4), yb = LANES[0].gy + 20;
    dashLine(c, R[0].front, LANES[0].gy + 4, R[0].front, yb + 6, 'rgba(255,224,102,0.8)', g, 2.5);
    dashLine(c, R[1].front, R[1].top - 4, R[1].front, yb - 6, 'rgba(255,224,102,0.8)', g, 2.5);
    withA(c, g, () => {
      W5.arrow(c, R[1].front + 4, yb, R[0].front - 2, yb, HI, 3.5, 13);
      W5.arrow(c, R[0].front - 4, yb, R[1].front + 2, yb, HI, 3.5, 13);
    });
    T(c, g, L('上面領先', 'Top is ahead'), R[0].front + 14, yb, HI, 22, 'left');
    glowBottom(c, fin(s, n, 8.0, 0.5),
      L('壓低拉桿：往前的分力 ', 'Lower handle: forward part ') + gwOf(fxOf(TH1)) + ' gw > ' + gwOf(fxOf(TH2)) + L(' gw，更好拉', ' gw, easier pull'), HI, 480, 510);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    if (s.n <= 2) {
      backdrop(c);
      if (s.n === 1) step1(c, s); else step2(c, s);
    } else if (s.n === 3) step3(c, s);
    else step4(c, s);
  }

  W5.register('trend', { canvas: 'cvs-trend', steps: DUR, draw });
})();
