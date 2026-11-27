/* ==================================================================
   mechanics_5 ｜ 國王的難題：不破壞皇冠怎麼驗真假（cvs-crown，960×540）
   四步：1 同重的兩件物品 → 2 浸入同樣的水 → 3 比較排出的水 → 4 比密度
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption／eqRow／flash、M4.L／T／P／withA／fin／fout／grow、
        M5.img／overflowCan／spill／cylinder（這四個由本檔新增到 M5，archi、cao 沿用）。
   素材：assets/mechanics_5/archimedes_crown.webp（560×373 透明背景；有效範圍 x 16～543、y 5～345）；
        圖還沒載入完時改畫程式版皇冠（不畫空框）。

   數字（照簡報）：兩件都是 1930 gw；純金塊體積 100 cm³（D ＝ 1930 ÷ 100 ＝ 19.3 gw/cm³）；
     皇冠體積 125 cm³（D ＝ 1930 ÷ 125 ＝ 15.44，畫面標「≈ 15.4」）；皇冠多排出 25 mL；1 mL ＝ 1 cm³。
   比例尺：
     天平、金塊、皇冠、溢水杯：示意，不依比例（金塊邊長 64 px、皇冠寬 110 px）。
     量筒：第 2 步 1 mL ＝ 1.0 px（0～150 mL 高 150 px）；第 3 步 u 0～2.2 放大成 1 mL ＝ 2.0 px（150 mL ＝ 300 px）。
     量筒裡的水量 ＝ 物體「沒入水中的高度比例 × 體積」（皇冠形狀不規則，用高度比例近似；完全沒入時剛好 100／125 mL），
       比物體入水慢 0.35 s（水流過出水管的時間）。
     第 4 步密度橫條：1 gw/cm³ ＝ 20 px（19.3 → 386 px、15.4 → 308 px）。
   第 1 步（11 s）：天平；u 0.4～1.6 金塊放上左盤 → 天平往左傾（阻尼）；u 2.4～3.6 皇冠放上右盤 → 天平回到水平（指針指正中）；
     「1930 gw」u 4.2；右側「不能敲／切／熔」三個被劃掉的圖示 u 5.2、5.8、6.4；字卡 u 7.6。
   第 2 步（11 s）：天平淡出、兩個一樣的溢水杯（裝滿到出水管）＋量筒淡入（u 0～0.9）；金塊與皇冠用細線吊著，
     u 1.2～7.5 同時慢慢往下放，直到完全沒入；水從出水管流進各自的量筒（最後 100 mL、125 mL）；字卡 u 8.2。
   第 3 步（11 s）：溢水杯淡出，兩支量筒移到中間並放大（u 0～2.2），刻度 0～150 mL；「純金塊 100 mL」「皇冠 125 mL」u 2.4；
     100 mL 的黃虛線由左量筒拉到右量筒 u 3.6～4.4；右量筒 100～125 mL 那段水塗亮 u 4.4；「多 25 mL」u 4.8；「1 mL ＝ 1 cm³」u 5.6；字卡 u 7.0。
   第 4 步（12 s）：量筒淡出；「D ＝ M ÷ V」u 0.5；金塊列 1930 ÷ 100 ＝ 19.3（u 1.0～2.6）；皇冠列 1930 ÷ 125 ≈ 15.4（u 2.8～4.4）；
     兩條密度橫條 u 4.8～6.4 長出（數值字一律寫在純金橫條末端右邊 x 572；皇冠比純金少的那段畫珊瑚色虛線框）；蓋章「15.4 ＜ 19.3／不是純金」u 6.8；字卡 u 8.0。
   版面：桌面 GY 468。天平：支柱 x 370、支點 y 175、橫梁半長 160、秤盤吊在梁端下方 130 px；圖示欄 x 700（字 x 752 起）。
     溢水杯 A 內壁 x 120～290、B 480～650，內底 455、杯口 190、出水管中心 y 214（水面 219）；量筒（第 2 步）中線 380／740、內底 455；
     量筒（第 3 步）中線 330／630、內底 420、內半寬 34；刻度數字：左量筒寫在左邊、右量筒寫在右邊（中間留給 100 mL 虛線）。
     第 4 步：算式列 y 200／270（左緣 x 140）、橫條 y 350／402（左端 x 170）、印章中心 (790, 250)。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.overflowCan) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, RED = COL.red, CORAL = COL.coral;
  const GOLD = '#f2c94c', GOLD_HI = '#fff1b0', GOLD_DK = '#9a6a12';
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */
  const CROWN_SRC = 'assets/mechanics_5/archimedes_crown.webp';
  M5.img(CROWN_SRC);                                    /* 預載 */

  /* ── 版面 ── */
  const GY = 468;
  const BX = 370, PY = 175, BL = 160, HANG = 130;       /* 天平 */
  const CUBE_A = 64, CUBE_D = 18, CUBE_H = CUBE_A + CUBE_D * 0.7;   /* 金塊：正面邊長、斜面深度、總高 */
  const CROWN_W = 110, CROWN_H = CROWN_W * 340 / 527;               /* 皇冠（圖的有效範圍 527×340） */
  const CAN = [{ x0: 120, x1: 290, ox: 205 }, { x0: 480, x1: 650, ox: 565 }];
  const CBOT = 455, CRIM = 190, SPY = 214, SPR = 5, LV = SPY + SPR;
  const CYL2 = [380, 740], CYL3 = [330, 630];
  const VOL = [100, 125], OBJ_H = [CUBE_H, CROWN_H];

  /* ═══════════ 物件 ═══════════ */
  /* 金塊：cx＝整塊中線、by＝底面 y */
  function goldCube(c, cx, by, a, sc) {
    sc = sc || 1; const A = CUBE_A * sc, D = CUBE_D * sc, x0 = cx - (A + D) / 2, x1 = x0 + A, y0 = by - A, dy = D * 0.7;
    withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      c.fillStyle = 'rgba(11,26,21,0.3)'; c.beginPath(); c.ellipse(cx, by + 2, (A + D) / 2 + 4, 4, 0, 0, TAU); c.fill();
      let g = c.createLinearGradient(x0, y0, x1, by); g.addColorStop(0, GOLD_HI); g.addColorStop(0.45, GOLD); g.addColorStop(1, '#c7921e');
      c.fillStyle = g; c.fillRect(x0, y0, A, A);
      c.fillStyle = '#fff4c4'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + D, y0 - dy); c.lineTo(x1 + D, y0 - dy); c.lineTo(x1, y0); c.closePath(); c.fill();
      g = c.createLinearGradient(x1, 0, x1 + D, 0); g.addColorStop(0, '#c48c1a'); g.addColorStop(1, GOLD_DK);
      c.fillStyle = g; c.beginPath(); c.moveTo(x1, y0); c.lineTo(x1 + D, y0 - dy); c.lineTo(x1 + D, by - dy); c.lineTo(x1, by); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,58,8,0.9)'; c.lineWidth = 1.6;
      c.strokeRect(x0, y0, A, A);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + D, y0 - dy); c.lineTo(x1 + D, y0 - dy); c.lineTo(x1 + D, by - dy); c.lineTo(x1, by); c.moveTo(x1, y0); c.lineTo(x1 + D, y0 - dy); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 6, y0 + A * 0.75); c.lineTo(x0 + 6, y0 + 6); c.lineTo(x0 + A * 0.5, y0 + 6); c.stroke();
      c.restore();
    });
    return { top: by - A - dy, cx: cx };
  }
  /* 皇冠：cx＝中線、by＝底面 y、w＝寬 */
  function crown(c, cx, by, a, w) {
    w = w || CROWN_W; const h = w * 340 / 527;
    withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(11,26,21,0.3)'; c.beginPath(); c.ellipse(cx, by + 2, w * 0.46, 4, 0, 0, TAU); c.fill();
      const im = M5.img(CROWN_SRC);
      if (im) c.drawImage(im, 16, 5, 527, 340, cx - w / 2, by - h, w, h);
      else {                                           /* 程式版（圖載入前） */
        const x0 = cx - w / 2, x1 = cx + w / 2, bt = by - h * 0.32;
        const g = c.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, GOLD_HI); g.addColorStop(0.5, GOLD); g.addColorStop(1, GOLD_DK);
        c.fillStyle = g; c.beginPath(); c.moveTo(x0 + 4, by);
        c.lineTo(x0, bt); for (let i = 0; i < 5; i++) { const xa = lerp(x0, x1, (i + 0.5) / 5); c.lineTo(xa, by - h + (i % 2 ? 10 : 0)); c.lineTo(lerp(x0, x1, (i + 1) / 5), bt); }
        c.lineTo(x1 - 4, by); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(90,58,8,0.9)'; c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#c0283c'; c.beginPath(); c.arc(cx, by - h * 0.18, 5, 0, TAU); c.fill();
      }
      c.restore();
    });
    return { top: by - h, cx };
  }
  function thread(c, x, y1, a) {
    withA(c, a, () => {
      c.save(); const g = c.createLinearGradient(0, 34, 0, 80); g.addColorStop(0, 'rgba(230,236,233,0)'); g.addColorStop(1, 'rgba(230,236,233,0.85)');
      c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, 34); c.lineTo(x, y1); c.stroke(); c.restore();
    });
  }

  /* ═══════════ 第 1 步：天平 ═══════════ */
  function beamAng(s) {
    if (s.n !== 1) return 0;
    const u = s.u, th1 = tau => -0.13 * (1 - Math.exp(-2.2 * tau) * Math.cos(5 * tau));
    if (u < 1.6) return 0;
    if (u < 3.6) return th1(u - 1.6);
    const t2 = u - 3.6; return th1(2.0) * Math.exp(-2.2 * t2) * Math.cos(5 * t2);
  }
  function balance(c, s) {
    const a = s.n === 1 ? fin(s, 1, 0, 0.4) : s.n === 2 ? fout(s, 2, 0, 0.6) : 0; if (a <= 0.02) return;
    const th = beamAng(s), cs = Math.cos(th), sn = Math.sin(th);
    const ends = [[BX - BL * cs, PY - BL * sn], [BX + BL * cs, PY + BL * sn]];
    const pans = ends.map(e => [e[0], e[1] + HANG]);
    withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      /* 底座＋支柱 */
      const mg = c.createLinearGradient(BX - 70, 0, BX + 70, 0); mg.addColorStop(0, '#d9b36a'); mg.addColorStop(0.5, '#f4dc9c'); mg.addColorStop(1, '#a07a35');
      c.fillStyle = mg; c.beginPath(); c.moveTo(BX - 74, GY); c.lineTo(BX + 74, GY); c.lineTo(BX + 46, GY - 20); c.lineTo(BX - 46, GY - 20); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,46,10,0.85)'; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = mg; c.fillRect(BX - 7, PY, 14, GY - 20 - PY); c.strokeRect(BX - 7, PY, 14, GY - 20 - PY);
      /* 指針刻度弧（支點上方）＋指針 */
      c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 2;
      c.beginPath(); c.arc(BX, PY, 62, -Math.PI / 2 - 0.35, -Math.PI / 2 + 0.35); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(BX, PY - 56); c.lineTo(BX, PY - 68); c.stroke();
      c.strokeStyle = CORAL; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(BX, PY); c.lineTo(BX + Math.sin(th) * 58, PY - Math.cos(th) * 58); c.stroke();
      /* 橫梁 */
      c.save(); c.translate(BX, PY); c.rotate(th);
      const bg = c.createLinearGradient(0, -6, 0, 6); bg.addColorStop(0, '#f8e6b0'); bg.addColorStop(1, '#a8803a');
      c.fillStyle = bg; W5.rr(c, -BL - 6, -5, 2 * BL + 12, 10, 5); c.fill(); c.strokeStyle = 'rgba(70,46,10,0.85)'; c.lineWidth = 1.4; c.stroke();
      c.restore();
      c.fillStyle = '#6b4c1c'; c.beginPath(); c.arc(BX, PY, 8, 0, TAU); c.fill();
      c.fillStyle = '#f4dc9c'; c.beginPath(); c.arc(BX, PY, 4, 0, TAU); c.fill();
      /* 吊繩＋秤盤 */
      ends.forEach((e, i) => {
        const p = pans[i];
        c.strokeStyle = 'rgba(230,236,233,0.85)'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(p[0] - 66, p[1]); c.moveTo(e[0], e[1]); c.lineTo(p[0] + 66, p[1]); c.stroke();
        c.fillStyle = '#6b4c1c'; c.beginPath(); c.arc(e[0], e[1], 4, 0, TAU); c.fill();
        const pg = c.createLinearGradient(0, p[1], 0, p[1] + 16); pg.addColorStop(0, '#f4dc9c'); pg.addColorStop(1, '#8a6626');
        c.fillStyle = pg; c.beginPath(); c.moveTo(p[0] - 72, p[1]); c.quadraticCurveTo(p[0], p[1] + 30, p[0] + 72, p[1]); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(70,46,10,0.85)'; c.lineWidth = 1.6; c.stroke();
      });
      c.restore();
    });
    /* 放上去的東西 */
    const drop = (t0) => (s.n === 1 ? 1 - ease(clamp01((s.u - t0) / 1.2)) : 0);
    const aCube = s.n === 1 ? fin(s, 1, 0.4, 0.4) : 1, aCrown = s.n === 1 ? fin(s, 1, 2.4, 0.4) : 1;
    goldCube(c, pans[0][0], pans[0][1] + 7 - 70 * drop(0.4), a * aCube);
    crown(c, pans[1][0], pans[1][1] + 7 - 70 * drop(2.4), a * aCrown);
    const la = a * fin(s, 1, 4.2, 0.5);
    pans.forEach(p => P(c, la, '1930 gw', p[0], p[1] + 48, YEL, 22, 'center', true));
  }

  /* 三個被劃掉的圖示：敲、切、熔 */
  function noIcons(c, s) {
    const a0 = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (a0 <= 0.02) return;
    const R = 32, X = 700;
    const items = [
      [170, 5.2, L('不能敲', 'No hitting'), 'hammer'],
      [270, 5.8, L('不能切', 'No cutting'), 'knife'],
      [370, 6.4, L('不能熔', 'No melting'), 'fire']
    ];
    items.forEach(([y, t0, lab, kind], i) => {
      const a = a0 * (s.n === 1 ? fin(s, 1, t0, 0.4) : 1); if (a <= 0.02) return;
      withA(c, a, () => {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        c.fillStyle = 'rgba(11,26,21,0.85)'; c.beginPath(); c.arc(X, y, R, 0, TAU); c.fill();
        c.translate(X, y);
        if (kind === 'hammer') {
          c.strokeStyle = '#b07a46'; c.lineWidth = 6; c.beginPath(); c.moveTo(-12, 16); c.lineTo(8, -6); c.stroke();
          c.save(); c.rotate(-0.85); c.fillStyle = '#c9d3d8'; c.fillRect(-2, -26, 14, 30); c.restore();
        } else if (kind === 'knife') {
          c.fillStyle = '#e3eaee'; c.beginPath(); c.moveTo(-16, 14); c.lineTo(12, -14); c.quadraticCurveTo(16, -10, 2, 8); c.closePath(); c.fill();
          c.strokeStyle = '#6b4c1c'; c.lineWidth = 6; c.beginPath(); c.moveTo(-14, 12); c.lineTo(-22, 20); c.stroke();
        } else {
          const fl = 1 + 0.08 * Math.sin(s.t * 9);
          c.fillStyle = '#ff8040'; c.beginPath(); c.moveTo(0, -20 * fl); c.quadraticCurveTo(16, -2, 10, 12); c.quadraticCurveTo(0, 20, -10, 12); c.quadraticCurveTo(-16, -2, 0, -20 * fl); c.fill();
          c.fillStyle = '#ffe066'; c.beginPath(); c.moveTo(0, -6 * fl); c.quadraticCurveTo(8, 4, 4, 12); c.quadraticCurveTo(0, 15, -4, 12); c.quadraticCurveTo(-8, 4, 0, -6 * fl); c.fill();
        }
        /* 紅圈＋斜線（斜線由左上畫到右下） */
        const g = s.n === 1 ? ease(clamp01((s.u - t0 - 0.2) / 0.4)) : 1, pulse = 0.75 + 0.25 * Math.sin(s.t * 4 + i * 1.3);
        c.shadowColor = RED; c.shadowBlur = 10 * pulse;
        c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        const k = R * 0.72; c.beginPath(); c.moveTo(-k, -k); c.lineTo(lerp(-k, k, g), lerp(-k, k, g)); c.stroke();
        c.restore();
      });
      T(c, a, lab, X + 50, y, WHITE, 22, 'left');
    });
  }

  /* ═══════════ 第 2 步：溢水杯 ═══════════ */
  const lowerB = s => (s.n < 2 ? 150 : s.n > 2 ? 330 : lerp(150, 330, ease(clamp01((s.u - 1.2) / 6.3))));
  const lowerAt = (s, du) => (s.n !== 2 ? lowerB(s) : lerp(150, 330, ease(clamp01((s.u - du - 1.2) / 6.3))));
  const subFrac = (b, i) => clamp01((b - LV) / OBJ_H[i]);
  function spilled(s, i) {                              /* 量筒裡的水（mL） */
    if (s.n < 2) return 0; if (s.n > 2) return VOL[i];
    return VOL[i] * subFrac(lowerAt(s, 0.35), i);
  }
  function cans(c, s) {
    const a = s.n === 2 ? fin(s, 2, 0.2, 0.7) : s.n === 3 ? fout(s, 3, 0, 0.7) : 0; if (a <= 0.02) return;
    const b = lowerB(s), objA = s.n === 2 ? fin(s, 2, 0.3, 0.6) : 1;
    CAN.forEach((K, i) => {
      const flowNow = s.n === 2 ? clamp01((VOL[i] * subFrac(b, i) - spilled(s, i)) / 4) : 0;
      const can = M5.overflowCan(c, {
        x0: K.x0, x1: K.x1, bot: CBOT, rim: CRIM, spY: SPY, spR: SPR, t: s.t + i * 0.7, a, flow: flowNow,
        front: cc => {
          const top = b - OBJ_H[i] - 6;
          thread(cc, K.ox, top, objA);
          if (i === 0) goldCube(cc, K.ox, b, objA); else crown(cc, K.ox, b, objA);
        }
      });
      const cx = s.n === 2 ? CYL2[i] : lerp(CYL2[i], CYL3[i], cylZ(s));
      const cy = cylNow(s, i);
      M5.spill(c, { x: can.lip[0], y: can.lip[1], dx: cx - can.lip[0], landY: cy.y(spilled(s, i)) - 2, f: flowNow, t: s.t, a });
    });
    T(c, a * fin(s, 2, 0.6, 0.5), L('純金塊', 'Gold block'), CAN[0].ox + 46, 110, GOLD, 22, 'left');
    T(c, a * fin(s, 2, 0.6, 0.5), L('皇冠', 'Crown'), CAN[1].ox + 64, 110, GOLD, 22, 'left');
  }

  /* ═══════════ 量筒（第 2 步小、第 3 步放大） ═══════════ */
  const cylZ = s => (s.n < 3 ? 0 : s.n > 3 ? 1 : ease(clamp01(s.u / 2.2)));
  function cylGeom(s, i) {
    const z = cylZ(s);
    return { cx: lerp(CYL2[i], CYL3[i], z), bot: lerp(CBOT, 420, z), k: lerp(1.0, 2.0, z), hw: lerp(20, 34, z) };
  }
  const cylNow = (s, i) => { const g = cylGeom(s, i); return { y: v => g.bot - v * g.k, g }; };
  function cylinders(c, s) {
    const a = s.n === 2 ? fin(s, 2, 0.2, 0.7) : s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.6) : 0; if (a <= 0.02) return;
    const hiA = s.n === 3 ? fin(s, 3, 4.4, 0.5) : s.n === 4 ? 1 : 0;
    const res = [0, 1].map(i => {
      const g = cylGeom(s, i);
      return M5.cylinder(c, { cx: g.cx, bot: g.bot, hw: g.hw, k: g.k, max: 150, vol: spilled(s, i), t: s.t + i, a, hi: i === 1 ? [100, 125] : null, hiA });
    });
    /* 刻度數字（第 3 步放大後）：左量筒寫左邊、右量筒寫右邊 */
    const la = a * (s.n === 3 ? fin(s, 3, 2.0, 0.5) : s.n > 3 ? 1 : 0);
    if (la > 0.02) {
      [0, 50, 100, 150].forEach(v => {
        const str = v === 150 ? '150 mL' : String(v);
        T(c, la, str, res[0].x0 - 16, res[0].y(v), DIM, 22, 'right', true);
        T(c, la, str, res[1].outR + 12, res[1].y(v), DIM, 22, 'left', true);
      });
      /* 125 的刻度另外標（右量筒） */
    }
    if (s.n < 3) return;
    const a3 = s.n === 3 ? 1 : fout(s, 4, 0, 0.6);
    P(c, a3 * fin(s, 3, 2.4, 0.5), L('純金塊 100 mL', 'Gold 100 mL'), CYL3[0], 458, GOLD, 22, 'center', true);
    P(c, a3 * fin(s, 3, 2.4, 0.5), L('皇冠 125 mL', 'Crown 125 mL'), CYL3[1], 458, GOLD, 22, 'center', true);
    /* 100 mL 的虛線：左量筒 → 右量筒 */
    const g = s.n === 3 ? grow(s, 3, 3.6, 4.4) : 1, y100 = res[0].y(100);
    if (g > 0.01) withA(c, a3, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([10, 7]); c.lineDashOffset = -s.t * 14;
      const xa = res[0].outR + 4, xb = res[1].x0 - 8;
      c.beginPath(); c.moveTo(xa, y100); c.lineTo(lerp(xa, xb, g), y100); c.stroke(); c.setLineDash([]); c.restore();
    });
    /* 多 25 mL：右量筒右側的括號 */
    const ba = a3 * fin(s, 3, 4.8, 0.5);
    if (ba > 0.02) {
      const y0 = res[1].y(100), y1 = res[1].y(125), bx = res[1].outR + 70;
      withA(c, ba, () => {
        c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx - 8, y0); c.lineTo(bx, y0); c.lineTo(bx, y1); c.lineTo(bx - 8, y1); c.stroke(); c.restore();
      });
      P(c, ba, L('多 25 mL', '25 mL more'), bx + 14, (y0 + y1) / 2, YEL, 22, 'left', true);
    }
    T(c, a3 * fin(s, 3, 5.6, 0.5), '1 mL ＝ 1 cm³', 830, 330, DIM, 22, 'center', true);
  }

  /* ═══════════ 第 4 步：比密度 ═══════════ */
  function density(c, s) {
    if (s.n !== 4) return;
    P(c, fin(s, 4, 0.5, 0.5), 'D ＝ M ÷ V', 480, 122, YEL, 28, 'center', true);
    const rows = [
      { y: 200, t0: 1.0, icon: 0, toks: [{ t: L('金塊', 'Gold'), col: GOLD }, { t: '1930 ÷ 100', col: WHITE }, { t: '＝', col: WHITE }, { t: '19.3', col: YEL, pill: true }] },
      { y: 272, t0: 2.8, icon: 1, toks: [{ t: L('皇冠', 'Crown'), col: GOLD }, { t: '1930 ÷ 125', col: WHITE }, { t: '≈', col: WHITE }, { t: '15.4', col: CORAL, pill: true }] }
    ];
    rows.forEach(r => {
      const ia = fin(s, 4, r.t0 - 0.3, 0.4);
      if (r.icon === 0) goldCube(c, 86, r.y + 26, ia, 0.62); else crown(c, 86, r.y + 22, ia, 76);
      M3.eqRow(c, { x: 140, y: r.y, align: 'left', size: 28, mono: true, show: clamp01((s.u - r.t0) / 1.6) * r.toks.length, tokens: r.toks });
    });
    /* 橫條：1 gw/cm³ ＝ 20 px */
    const X0 = 170, K = 20, bars = [[350, 19.3, GOLD, '19.3'], [402, 15.4, '#d9a54a', '15.4']];
    const g = grow(s, 4, 4.8, 6.4), ba = fin(s, 4, 4.6, 0.4);
    if (ba > 0.02) {
      bars.forEach(([y, v, col, str], i) => {
        const w = v * K * g;
        withA(c, ba, () => {
          c.save();
          const gr = c.createLinearGradient(0, y - 13, 0, y + 13); gr.addColorStop(0, W5.mix(col, '#ffffff', 0.35)); gr.addColorStop(1, W5.mix(col, '#0b1a15', 0.25));
          c.fillStyle = gr; W5.rr(c, X0, y - 13, Math.max(2, w), 26, 6); c.fill();
          c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; c.stroke();
          /* 亮光掃過 */
          if (w > 30) {
            c.save(); W5.rr(c, X0, y - 13, w, 26, 6); c.clip();
            const sx = X0 + ((s.t * 120 + i * 140) % (w + 160)) - 80, sg = c.createLinearGradient(sx - 40, 0, sx + 40, 0);
            sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = sg; c.fillRect(sx - 40, y - 13, 80, 26); c.restore();
          }
          c.restore();
        });
        if (i === 0) goldCube(c, 136, y + 13, ba, 0.38); else crown(c, 136, y + 12, ba, 52);
        T(c, ba * clamp01((g - 0.85) / 0.15), str + ' gw/cm³', X0 + 19.3 * K + 16, y, i === 0 ? YEL : CORAL, 22, 'left', true);
        if (i === 1) withA(c, ba * clamp01((g - 0.9) / 0.1), () => {   /* 比純金少的那一段：珊瑚色虛線框 */
          c.save(); c.strokeStyle = CORAL; c.lineWidth = 2.5; c.setLineDash([7, 5]); c.lineDashOffset = -s.t * 10;
          W5.rr(c, X0 + w + 3, y - 12, 19.3 * K - w - 3, 24, 6); c.stroke(); c.restore();
        });
      });
      /* 純金的位置：虛線 */
      const da = ba * clamp01((g - 0.9) / 0.1);
      withA(c, da, () => {
        c.save(); c.strokeStyle = W5.rgba(YEL, 0.85); c.lineWidth = 2; c.setLineDash([6, 6]);
        c.beginPath(); c.moveTo(X0 + 19.3 * K, 330); c.lineTo(X0 + 19.3 * K, 422); c.stroke(); c.restore();
      });
    }
    stamp(c, s);
  }
  function stamp(c, s) {
    const a = fin(s, 4, 6.8, 0.3); if (a <= 0.02) return;
    const k = 1 + 0.5 * (1 - ease(clamp01((s.u - 6.8) / 0.35))), cx = 790, cy = 250, w = 224 * k, h = 112 * k;
    const pulse = 0.6 + 0.4 * Math.sin(s.t * 3.5);
    withA(c, a, () => {
      c.save();
      W5.glow(c, cx, cy, 150, RED, 0.16 * pulse);
      c.fillStyle = 'rgba(40,10,10,0.55)'; W5.rr(c, cx - w / 2, cy - h / 2, w, h, 14); c.fill();
      c.strokeStyle = RED; c.lineWidth = 5; c.shadowColor = RED; c.shadowBlur = 8 + 8 * pulse; c.stroke();
      c.shadowBlur = 0; c.lineWidth = 2; W5.rr(c, cx - w / 2 + 8, cy - h / 2 + 8, w - 16, h - 16, 10); c.stroke();
      c.restore();
    });
    T(c, a, '15.4 ＜ 19.3', cx, cy - 22 * k, WHITE, Math.round(26 * k), 'center', true);
    T(c, a, L('不是純金', 'Not pure gold'), cx, cy + 22 * k, RED, Math.round(28 * k), 'center');
    if (s.u < 7.6) M3.flash(c, cx + 100, cy - 48, 26, YEL, a * (1 - clamp01((s.u - 6.9) / 0.7)), s.u * 2);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('同重的兩件物品', 'Two items, same weight'),
    () => L('浸入同樣的水', 'Into the same water'),
    () => L('比較排出的水', 'Compare the spilled water'),
    () => L('比密度', 'Compare densities')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.6, 0.6) * fout(s, 2, 0, 0.4), L('同樣重，但不能破壞', 'Same weight, but no damage allowed'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.2, 0.6) * fout(s, 3, 0, 0.4), L('完全沒入：排開的水 ＝ 物體的體積', 'Fully under: water pushed out = object\'s volume'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * fout(s, 4, 0, 0.4), L('皇冠排出較多的水 → 體積較大', 'The crown spills more water → bigger volume'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.0, 0.6), L('同樣重，體積大的密度小', 'Same weight, bigger volume → smaller density'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40, glow: COL.yellow });
    M3.ground(c, GY);
    balance(c, s);
    noIcons(c, s);
    cans(c, s);
    cylinders(c, s);
    density(c, s);
    texts(c, s);
  }

  W5.register('crown', { canvas: 'cvs-crown', steps: DUR, draw });
})();
