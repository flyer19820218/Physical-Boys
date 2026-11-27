/* ==================================================================
   mechanics_5 ｜ 沉體與浮體：密度的對決（cvs-sinkfloat，960×540）
   四步：1 沉體 → 2 浮體 → 3 浮體：B ＝ W → 4 同一木塊換液體
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／caption／force／block／eqRow、M4.L／T／P／withA／fin／fout／grow／okMark、
        M5.trough（透明水槽，col 換成水／濃鹽水）、M5.dimV。

   數字（照簡報）：物體都是 100 cm³ 的方塊；清水 D＝1、濃鹽水 D＝1.2。
     鐵塊 D＝7.9、W＝790 gw；沉到底，V排 ＝ V物 ＝ 100 cm³，B ＝ 100 gw ＜ W ＝ 790 gw。
     木塊 D＝0.6、W＝60 gw；清水中浸入 60 cm³（60％），B ＝ W ＝ 60 gw；排開的水 60 cm³ ＝ 60 gw。
     濃鹽水中浸入 50 cm³，B ＝ 50 × 1.2 ＝ 60 gw（與清水中一樣大）。
   物理：浮體靜止 B ＝ W；沉體完全沒入 V排 ＝ V物。方塊放進水槽，水面會跟著上升（剖面圖：上升量 ＝ 方塊寬 × 浸入深度 ÷ 槽寬，
     例 70 × 42 ÷ 360 ≈ 8 px），木塊浸入深度一律量到「上升後」的水面。木塊落水後做阻尼上下晃，停在平衡浸入深度。
   比例尺：方塊邊長 70 px ＝ 100 cm³（示意）→ 浸入 60 cm³ ＝ 42 px、50 cm³ ＝ 35 px（體積 ∝ 浸入深度，照比例）。
     力的箭頭「同一幕同一比例尺」：
       第 1 步（鐵塊）1 gw ＝ 0.3 px（照簡報）：B 100 gw ＝ 30 px、W 790 gw ＝ 237 px；畫在右側受力圖，全長畫出、不用截斷。
       第 3、4 步（木塊）1 gw ＝ 1.5 px：B、W 60 gw ＝ 90 px（0.3 px/gw 只有 18 px，看不出等長，所以木塊幕另用一個比例尺）。
       每一幕左下角畫比例尺條：30 px 長的白條＝100 gw（第 1 步）／＝20 gw（第 3、4 步）。
   第 1 步（11 s）：鐵塊 u 0.3 出現在水槽上方、u 0.8～1.3 落到水面、u 1.3～3.6 沉到槽底（水面上升 13.6 px）；
     u 3.8 淡藍虛影（同形方塊＝排開的水）由鐵塊浮出、u 4.2～5.4 滑到右側；「V排 ＝ V物」「＝ 100 cm³」u 5.5；
     受力圖 B 長出 u 6.0～6.5、W 長出 u 6.5～7.4；「B ＜ W」u 7.6；「沉體：D物 ＞ D液」「7.9 ＞ 1」u 8.2；字卡 u 9.0。
   第 2 步（11 s）：鐵塊、右側淡出（u 0～0.6，水面降回）；木塊 u 0.6 出現、u 1.2～1.6 落水，阻尼晃動後停在浸入 42 px；
     右側「木塊 100 cm³」u 1.0；水下部分畫淡藍虛線框＋尺寸標「浸入 60 cm³」u 4.4；「水面下 60％」u 5.0；
     「浮體：D物 ＜ D液」「0.6 ＜ 1」u 6.2；字卡 u 8.0。
   第 3 步（11 s）：B 長出 u 0.6～1.2、W 長出 u 1.2～1.8（各 90 px，等長）；水下部分的淡藍虛影 u 2.0 亮起、u 2.4～4.0 被「取出」、
     放到右側天平左盤（天平往左傾）；u 4.6 「同一塊木塊」出現在右盤上方、u 5.0～5.5 落到右盤，天平回到水平；綠勾「平衡」u 6.6；
     「B ＝ W ＝ 60 gw」u 7.2；字卡 u 8.2。
   第 4 步（12 s）：單槽淡出（u 0～0.7）、左清水／右濃鹽水兩槽淡入（u 0.5～1.1）；兩塊木塊 u 1.3 出現、u 1.8～2.2 同時落水，
     晃動後停在左 42 px（60 cm³）、右 35 px（50 cm³）；尺寸標 u 5.0；B、W 長出 u 5.8～7.0（四支都 90 px）；
     「60 × 1 ＝ 60 gw」「50 × 1.2 ＝ 60 gw」u 7.6；字卡 u 9.0。
   版面：第 1～3 步單槽 內壁 x 90～450、槽口 y 130、內底 450、原水面 200；方塊中線 x 210、邊長 70。
     右側：虛影目標 (600, 215)；受力圖 x 770（圖示方塊 40 px，中心 y 150）；天平支點 (715, 228)、半臂 125、盤吊繩 70。
     第 4 步雙槽：左 內壁 x 30～410、右 550～930；槽口 140、內底 420、原水面 210；木塊中線 x 170／720；液體名 y 395；算式 y 462。
     步驟標題 KEY_Y 62、字卡 BOT_Y 505、比例尺條 (30, 505)。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.trough || !M5.dimV) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, WE = M4.PC.waterEdge;
  const FW = COL.pink, FB = COL.teal, GHOST = '#bfe6ff', BRINE = '#56c6c2', BRINE_E = '#a8f0e6';
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const BS = 70;                                        /* 方塊邊長 ＝ 100 cm³ */
  const PXCC = BS / 100;                                /* 浸入深度 px ／ cm³ */
  const K1 = 0.3, K2 = 1.5;                             /* 力的比例尺 px/gw：鐵塊幕、木塊幕 */
  const TK = { x0: 90, x1: 450, top: 130, bot: 450, lv: 200 }, CX = 210;
  const TA = { x0: 30, x1: 410, top: 140, bot: 420, lv: 210 }, CA = 170;
  const TB = { x0: 550, x1: 930, top: 140, bot: 420, lv: 210 }, CB = 720;
  const GX = 600, GY0 = 215;                            /* 虛影目標 */
  const FX = 770, FY = 150, FI = 40;                    /* 受力圖 */
  const BAL = { x: 715, y: 228, arm: 125, rope: 70 };

  /* ── 物理小函式 ── */
  const rise = (tk, d) => BS * d / (tk.x1 - tk.x0);     /* 浸入 d px → 水面上升 */
  /* 落水後的阻尼晃動：τ 秒、平衡浸入 D px；入水速度 150 px/s（示意：水的阻力讓它先減速） */
  function bob(tau, D) {
    if (tau <= 0) return 0;
    const g = 2.2, w = 5, Bc = (150 - D * g) / w, e = Math.exp(-g * tau);
    return Math.max(0, Math.min(BS - 4, D * (1 - e * Math.cos(w * tau)) + Bc * e * Math.sin(w * tau)));
  }
  /* 木塊在某水槽：浸入 d → { top, level } */
  function floatPos(tk, d) { const lv = tk.lv - rise(tk, d); return { level: lv, top: lv + d - BS }; }
  /* 木塊懸在上方 → 落到水面（等加速）→ 晃動；t0＝開始落下的 u */
  function woodState(tk, u, t0, D) {
    const hang = tk.lv - BS - 46;
    if (u < t0) return { top: hang, level: tk.lv, d: 0 };
    if (u < t0 + 0.4) { const q = (u - t0) / 0.4; return { top: hang + 46 * q * q, level: tk.lv, d: 0 }; }
    const d = bob(u - t0 - 0.4, D), f = floatPos(tk, d); return { top: f.top, level: f.level, d };
  }

  /* 鐵塊（第 1 步）：top、水面 */
  function ironState(s) {
    const hang = 84, contact = TK.lv - BS, floor = TK.bot - BS;
    let top = hang;
    if (s.n === 1) {
      const u = s.u;
      if (u >= 0.8 && u < 1.3) { const q = (u - 0.8) / 0.5; top = hang + (contact - hang) * q * q; }
      else if (u >= 1.3) { const p = clamp01((u - 1.3) / 2.3); top = contact + (floor - contact) * (1 - Math.pow(1 - p, 1.4)); }
    } else top = floor;
    const W = TK.x1 - TK.x0;
    const d = Math.max(0, Math.min(BS, (top + BS - TK.lv) / (1 - BS / W)));
    return { top, d, level: TK.lv - rise(TK, d) };
  }

  /* ═══════════ 畫法 ═══════════ */
  function iron(c, x, top, side, a) {
    withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(x - side / 2, top, x + side / 2, top + side);
      g.addColorStop(0, '#c3ccd3'); g.addColorStop(0.5, '#8d98a1'); g.addColorStop(1, '#5d6871');
      c.fillStyle = g; c.fillRect(x - side / 2, top, side, side);
      c.strokeStyle = 'rgba(20,28,34,0.9)'; c.lineWidth = 2; c.strokeRect(x - side / 2, top, side, side);
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - side / 2 + 5, top + side * 0.7); c.lineTo(x - side / 2 + 5, top + 5); c.lineTo(x + side * 0.1, top + 5); c.stroke();
      c.restore();
    });
  }
  function wood(c, x, top, side, a) { M3.block(c, x, top + side, side, side, { a, mat: 'lightwood', shadow: false, seed: 5 }); }
  /* 淡藍虛影（排開的水）：中心 (x, y)、寬 w、高 h */
  function ghost(c, x, y, w, h, a, t, glow) {
    withA(c, a, () => {
      c.save();
      if (glow) { c.shadowColor = GHOST; c.shadowBlur = 14 * glow; }
      c.fillStyle = W5.rgba(GHOST, 0.38); c.fillRect(x - w / 2, y - h / 2, w, h);
      c.shadowBlur = 0;
      c.strokeStyle = GHOST; c.lineWidth = 2.5; c.setLineDash([8, 6]); c.lineDashOffset = -t * 14;
      c.strokeRect(x - w / 2, y - h / 2, w, h); c.restore();
    });
  }
  /* 物體泡在水裡的部分：畫在水槽之後，蓋一層半透明液體色＋水面亮線（M5.trough 的液體不透明，物體要畫在前面） */
  function wetCover(c, cx, top, level, t, brine, a) {
    const bot = top + BS, y0 = Math.max(top, level); if (bot <= y0 + 0.5 || a <= 0.02) return;
    withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, y0, 0, bot);
      g.addColorStop(0, W5.rgba(brine ? BRINE : M4.PC.water, 0.38)); g.addColorStop(1, W5.rgba(brine ? '#1f7f86' : '#1a60a8', 0.5));
      c.fillStyle = g; c.fillRect(cx - BS / 2 - 1, y0, BS + 2, bot - y0);
      if (level > top) {
        c.strokeStyle = brine ? BRINE_E : WE; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx - BS / 2 - 1, level + 1.3 * Math.sin(t * 3.1)); c.lineTo(cx + BS / 2 + 1, level + 1.3 * Math.sin(t * 3.1 + 0.6)); c.stroke();
      }
      c.restore();
    });
  }
  function tank(c, tk, level, t, a, brine) {
    return M5.trough(c, { x0: tk.x0, x1: tk.x1, bot: tk.bot, top: tk.top, level, wall: 6, col: brine ? BRINE : M4.PC.water, edge: brine ? BRINE_E : WE, t, wob: 1.3, a });
  }
  /* 比例尺條：30 px 白條＝ val gw */
  function scaleBar(c, a, val) {
    withA(c, a, () => {
      c.save(); c.strokeStyle = WHITE; c.lineWidth = 6; c.lineCap = 'butt';
      c.beginPath(); c.moveTo(30, 505); c.lineTo(60, 505); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(30, 496); c.lineTo(30, 514); c.moveTo(60, 496); c.lineTo(60, 514); c.stroke(); c.restore();
    });
    T(c, a, '＝ ' + val + ' gw', 70, 505, DIM, 22, 'left', true);
  }
  /* 尺寸標（浸入深度）＋文字（右側） */
  function immersed(c, a, cx, level, d, text) {
    if (a <= 0.02 || d < 3) return;
    const x = cx + BS / 2 + 14;
    M5.dimV(c, x, level, level + d, null, { a, col: GHOST, lw: 3 });
    T(c, a, text, x + 14, level + d / 2, GHOST, 22, 'left');
  }
  /* 天平：θ＞0 左盤下沉。回傳兩盤盤面中心 */
  function balance(c, a, th) {
    const { x, y, arm, rope } = BAL, cs = Math.cos(th), sn = Math.sin(th);
    const eL = [x - arm * cs, y + arm * sn], eR = [x + arm * cs, y - arm * sn];
    const pL = [eL[0], eL[1] + rope], pR = [eR[0], eR[1] + rope];
    if (a > 0.02) withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      /* 底座＋立柱 */
      c.fillStyle = '#5f6b72'; W5.rr(c, x - 60, 396, 120, 14, 4); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
      const rg = c.createLinearGradient(x - 5, 0, x + 5, 0); rg.addColorStop(0, '#e6ecef'); rg.addColorStop(1, '#7d8a92');
      c.fillStyle = rg; c.fillRect(x - 5, y, 10, 396 - y);
      /* 指針（跟著橫桿轉） */
      c.strokeStyle = YEL; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 46 * Math.sin(th), y + 46 * Math.cos(th)); c.stroke();
      c.strokeStyle = 'rgba(246,243,234,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 10, y + 50); c.lineTo(x + 10, y + 50); c.stroke();
      /* 吊繩＋盤 */
      [[eL, pL], [eR, pR]].forEach(([e, p]) => {
        c.strokeStyle = 'rgba(230,236,233,0.8)'; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(p[0] - 50, p[1]); c.moveTo(e[0], e[1]); c.lineTo(p[0] + 50, p[1]); c.stroke();
        const pg = c.createLinearGradient(0, p[1], 0, p[1] + 10); pg.addColorStop(0, '#f2f5f6'); pg.addColorStop(1, '#8e9ba3');
        c.fillStyle = pg; c.beginPath(); c.moveTo(p[0] - 56, p[1]); c.lineTo(p[0] + 56, p[1]); c.lineTo(p[0] + 44, p[1] + 10); c.lineTo(p[0] - 44, p[1] + 10); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.4; c.stroke();
      });
      /* 橫桿 */
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 9; c.beginPath(); c.moveTo(eL[0], eL[1]); c.lineTo(eR[0], eR[1]); c.stroke();
      c.strokeStyle = '#cfd8dc'; c.lineWidth = 6; c.stroke();
      c.fillStyle = '#3d4a52'; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
      c.restore();
    });
    return { pL, pR };
  }
  /* 天平角度（第 3 步）：u 4.0 左盤放上虛影 → 往左傾；u 5.5 右盤放上木塊 → 回到水平 */
  function beamAng(s) {
    if (s.n < 3) return 0; if (s.n > 3) return 0;
    const u = s.u, TH = 0.15;
    if (u < 4.0) return 0;
    const th = tau => TH * (1 - Math.exp(-3 * tau) * Math.cos(5 * tau));
    if (u < 5.5) return th(u - 4.0);
    const th0 = th(1.5), q = u - 5.5;
    return th0 * Math.exp(-2.6 * q) * Math.cos(4.2 * q);
  }

  /* ═══════════ 第 1～3 步：單槽 ═══════════ */
  function single(c, s) {
    const a = s.n === 4 ? fout(s, 4, 0, 0.7) : 1; if (a <= 0.02) return;
    const t = s.t;
    /* 鐵塊（第 1 步；第 2 步淡出、水面降回） */
    const ir = ironState(s), ia = s.n === 1 ? fin(s, 1, 0.3, 0.4) : s.n === 2 ? fout(s, 2, 0, 0.6) : 0;
    /* 木塊（第 2 步起） */
    const ws = s.n === 2 ? woodState(TK, s.u, 1.2, 42 * 1) : s.n >= 3 ? Object.assign({ d: 42 }, floatPos(TK, 42)) : null;
    const wa = s.n === 2 ? fin(s, 2, 0.6, 0.4) : s.n >= 3 ? 1 : 0;
    /* 水面：原水面 － 鐵塊造成的上升（淡出時跟著降回）－ 木塊造成的上升 */
    let level = TK.lv - rise(TK, ir.d) * ia;
    if (ws && wa > 0.02) level -= TK.lv - ws.level;
    withA(c, a, () => {
      /* 先畫水槽，再畫物體＋泡水的半透明液體色 */
      tank(c, TK, level, t, 1, false);
      if (ia > 0.02) { iron(c, CX, ir.top, BS, ia); wetCover(c, CX, ir.top, level, t, false, ia); }
      if (ws && wa > 0.02) { wood(c, CX, ws.top, BS, wa); wetCover(c, CX, ws.top, level, t, false, wa); }
    });
    /* 第 1 步：虛影＋受力圖 */
    if (s.n <= 2) step1Panel(c, s, ir, a * (s.n === 2 ? fout(s, 2, 0, 0.5) : 1));
    if (s.n === 2) step2Panel(c, s, ws);
    if (s.n === 3 || (s.n === 4 && a > 0.02)) step3(c, s, a);
  }

  function step1Panel(c, s, ir, a) {
    if (a <= 0.02) return;
    const t = s.t;
    T(c, a * fin(s, 1, 0.5, 0.5) * fout(s, 1, 3.8, 0.4), L('鐵塊 100 cm³', 'Iron block, 100 cm³'), CX + BS / 2 + 14, 112, WHITE, 22, 'left');
    /* 虛影：由鐵塊浮出 → 滑到右側 */
    const ga = fin(s, 1, 3.8, 0.4);
    if (ga > 0.02) {
      const q = ease(clamp01((s.u - 4.2) / 1.2)) * (s.n > 1 ? 1 : 1), x0 = CX, y0 = ir.top + BS / 2;
      const qq = s.n > 1 ? 1 : q;
      const x = lerp(x0, GX, qq), y = lerp(y0, GY0, qq) - 70 * Math.sin(Math.PI * qq);
      ghost(c, x, y, BS, BS, a * ga, t, qq > 0.98 ? 0.6 + 0.4 * Math.sin(t * 3) : 0.5);
      T(c, a * ga, L('排開的水', 'Water pushed aside'), x, y - BS / 2 - 20, GHOST, 22, 'center');
    }
    const va = a * fin(s, 1, 5.5, 0.5);
    T(c, va, L('V排 ＝ V物', 'V(displaced) = V(object)'), GX, 286, GHOST, 22, 'center');
    P(c, va, '＝ 100 cm³', GX, 326, GHOST, 24, 'center', true);
    /* 受力圖（1 gw ＝ 0.3 px） */
    const fa = a * fin(s, 1, 5.9, 0.4);
    if (fa > 0.02) {
      iron(c, FX, FY - FI / 2, FI, fa);
      M3.force(c, { x: FX, y: FY - FI / 2, dir: 'up', val: 100, k: K1, col: FB, a: fa, grow: grow(s, 1, 6.0, 6.5), text: 'B ＝ 100 gw', lab: 'right', lw: 6 });
      M3.force(c, { x: FX, y: FY + FI / 2, dir: 'down', val: 790, k: K1, col: FW, a: fa, grow: grow(s, 1, 6.5, 7.4), text: 'W ＝ 790 gw', lab: 'right', lw: 6 });
    }
    P(c, a * fin(s, 1, 7.6, 0.4), 'B ＜ W', FX + 80, 430, YEL, 24, 'center', true);
    const da = a * fin(s, 1, 8.2, 0.5);
    P(c, da, L('沉體：D物 ＞ D液', 'Sinks: D(obj) > D(liq)'), GX, 390, YEL, 24, 'center');
    T(c, da, L('鐵 7.9 ＞ 水 1', 'iron 7.9 > water 1'), GX, 434, WHITE, 22, 'center');
    scaleBar(c, a * fin(s, 1, 5.9, 0.4), 100);
  }

  function step2Panel(c, s, ws) {
    const t = s.t;
    T(c, fin(s, 2, 1.0, 0.5) * fout(s, 2, 4.2, 0.4), L('木塊 100 cm³', 'Wood block, 100 cm³'), CX + BS / 2 + 14, 112, WHITE, 22, 'left');
    /* 水下部分：淡藍虛線框＋尺寸標 */
    const ia = fin(s, 2, 4.4, 0.5);
    if (ia > 0.02) {
      ghost(c, CX, ws.level + ws.d / 2, BS, ws.d, ia * 0.8, t, 0);
      immersed(c, ia, CX, ws.level, ws.d, L('浸入 60 cm³', '60 cm³ under'));
    }
    const pa = fin(s, 2, 5.0, 0.5);
    T(c, pa, L('在水面下', 'Below the surface'), 690, 170, DIM, 22, 'center');
    P(c, pa, '60％', 690, 216, GHOST, 28, 'center', true);
    const da = fin(s, 2, 6.2, 0.5);
    P(c, da, L('浮體：D物 ＜ D液', 'Floats: D(obj) < D(liq)'), 690, 320, YEL, 24, 'center');
    T(c, da, L('木 0.6 ＜ 水 1', 'wood 0.6 < water 1'), 690, 364, WHITE, 22, 'center');
  }

  function step3(c, s, a0) {
    const t = s.t, ws = floatPos(TK, 42), cy = ws.top + BS / 2;
    /* 受力：B、W 各 60 gw（1 gw ＝ 1.5 px） */
    const fa = a0;
    M3.force(c, { x: CX, y: cy, dir: 'up', val: 60, k: K2, col: FB, a: fa, grow: grow(s, 3, 0.6, 1.2), text: 'B ＝ 60 gw', lab: 'tip' });
    M3.force(c, { x: CX, y: cy, dir: 'down', val: 60, k: K2, col: FW, a: fa, grow: grow(s, 3, 1.2, 1.8), text: 'W ＝ 60 gw', lab: 'tip' });
    scaleBar(c, a0 * fin(s, 3, 0.6, 0.4), 20);
    /* 天平 */
    const ba = a0 * fin(s, 3, 1.6, 0.5), th = beamAng(s), pans = balance(c, ba, th);
    /* 虛影：水下部分 → 左盤 */
    const ga = fin(s, 3, 2.0, 0.4) * a0;
    if (ga > 0.02) {
      const q = s.n > 3 ? 1 : ease(clamp01((s.u - 2.4) / 1.6));
      const x0 = CX, y0 = ws.level + 21, x1 = pans.pL[0], y1 = pans.pL[1] - 21;
      const x = lerp(x0, x1, q), y = lerp(y0, y1, q) - 110 * Math.sin(Math.PI * q);
      if (q < 0.99) ghost(c, CX, ws.level + 21, BS, 42, ga * 0.35, t, 0);   /* 原位置留淡淡的框 */
      ghost(c, x, y, BS, 42, ga, t, 0.6);
      T(c, ga * clamp01((q - 0.9) / 0.1), L('排開的水', 'Displaced water'), x1, pans.pL[1] + 34, GHOST, 22, 'center');
      P(c, ga * clamp01((q - 0.9) / 0.1), '60 cm³ ＝ 60 gw', x1, pans.pL[1] + 74, GHOST, 22, 'center', true);
    }
    /* 同一塊木塊 → 右盤 */
    const wa = fin(s, 3, 4.6, 0.4) * a0;
    if (wa > 0.02) {
      const q = s.n > 3 ? 1 : clamp01((s.u - 5.0) / 0.5), y1 = pans.pR[1] - BS, y0 = 104;
      wood(c, pans.pR[0], lerp(y0, y1, q * q), BS, wa);
      T(c, wa, L('同一塊木塊', 'The same wood'), pans.pR[0], pans.pR[1] + 34, WHITE, 22, 'center');
      P(c, wa, '60 gw', pans.pR[0], pans.pR[1] + 74, FW, 22, 'center', true);
    }
    M4.okMark(c, BAL.x, BAL.y - 30, true, { a: a0 * fin(s, 3, 6.6, 0.4), r: 15 });
    T(c, a0 * fin(s, 3, 6.6, 0.4), L('平衡', 'Balanced'), BAL.x + 24, BAL.y - 30, COL.green, 22, 'left');
    P(c, a0 * fin(s, 3, 7.2, 0.5), 'B ＝ W ＝ 60 gw', BAL.x, 452, YEL, 24, 'center', true);
  }

  /* ═══════════ 第 4 步：清水 vs 濃鹽水 ═══════════ */
  function step4(c, s) {
    if (s.n !== 4) return;
    const a = fin(s, 4, 0.5, 0.6); if (a <= 0.02) return;
    const t = s.t, u = s.u;
    const ba = fin(s, 4, 1.3, 0.4);
    const A = woodState(TA, u, 1.8, 60 * PXCC / 1), B = woodState(TB, u, 1.8, 60 * PXCC / 1.2);
    withA(c, a, () => {
      tank(c, TA, A.level, t, 1, false); wood(c, CA, A.top, BS, ba); wetCover(c, CA, A.top, A.level, t, false, ba);
      tank(c, TB, B.level, t + 0.7, 1, true); wood(c, CB, B.top, BS, ba); wetCover(c, CB, B.top, B.level, t, true, ba);
    });
    T(c, a, L('清水  D ＝ 1', 'Water  D = 1'), (TA.x0 + TA.x1) / 2 + 30, 395, WE, 22, 'center');
    T(c, a, L('濃鹽水  D ＝ 1.2', 'Brine  D = 1.2'), (TB.x0 + TB.x1) / 2 + 30, 395, BRINE_E, 22, 'center');
    const ia = fin(s, 4, 5.0, 0.5);
    immersed(c, ia, CA, A.level, A.d, L('浸入 60 cm³', '60 cm³ under'));
    immersed(c, ia, CB, B.level, B.d, L('浸入 50 cm³', '50 cm³ under'));
    [[CA, A], [CB, B]].forEach(([x, st], i) => {
      const cy = st.top + BS / 2;
      M3.force(c, { x, y: cy, dir: 'up', val: 60, k: K2, col: FB, a, grow: grow(s, 4, 5.8 + 0.1 * i, 6.4 + 0.1 * i), text: 'B ＝ 60 gw', lab: 'tip' });
      M3.force(c, { x, y: cy, dir: 'down', val: 60, k: K2, col: FW, a, grow: grow(s, 4, 6.4 + 0.1 * i, 7.0 + 0.1 * i), text: 'W ＝ 60 gw', lab: 'tip' });
    });
    const ea = fin(s, 4, 7.6, 0.5);
    P(c, ea, '60 × 1 ＝ 60 gw', (TA.x0 + TA.x1) / 2, 462, FB, 24, 'center', true);
    P(c, ea, '50 × 1.2 ＝ 60 gw', (TB.x0 + TB.x1) / 2, 462, FB, 24, 'center', true);
    scaleBar(c, fin(s, 4, 5.8, 0.4), 20);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('沉體：鐵塊', 'A sinker: iron'),
    () => L('浮體：木塊', 'A floater: wood'),
    () => L('浮體：B ＝ W', 'Floater: B = W'),
    () => L('同一木塊換液體', 'Same wood, new liquid')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 9.0, 0.6) * fout(s, 2, 0, 0.4), L('浮力比重量小，鐵塊沉到底', 'Buoyancy < weight: the iron sinks'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('木塊浮在水面，只有一部分在水下', 'The wood floats, only part of it under water'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('排開的水重 ＝ 木塊重 ＝ 浮力', 'Displaced water = wood\'s weight = buoyancy'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.0, 0.6), L('浮力一樣大，排開的體積不一樣', 'Same buoyancy, different displaced volume'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 540, cell: 40 });
    single(c, s);
    step4(c, s);
    texts(c, s);
  }

  W5.register('sinkfloat', { canvas: 'cvs-sinkfloat', steps: DUR, draw });
})();
