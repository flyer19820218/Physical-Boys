/* electric_energy_power_1_effects_1105_v1.js — 「電能三大效應」分頁動畫（#effectsAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.effects = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'effects'。畫布不綁任何事件；唯一控制是 #steps-effects 裡的 5 個步驟鈕；結果框 #effectsAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 電路（並聯三條支路）──────────────────────────────────────────────
 *   電池在左（+ 在上、− 在下），上幹線 TOP、下幹線 BOT；三條直立支路 x＝380／600／820，
 *   元件框置中在支路上：吹風機（電熱絲）、充電電池（+ 在上，接電源 +）、電磁鐵（線圈＋鐵芯，右邊鐵釘）。
 *   電子（藍球）從電池負極出發：往下 → 下幹線往右 → 支路往上穿過元件 → 上幹線往左 → 回正極。
 *   每顆電子在「離開負極到元件」之間帶一個黃色能量方塊（貼在導線外側），在元件座標（支路中點）被吃掉；
 *   之後空手回電池。電子的路徑位置 s(t)＝(相位＋v·t) mod L，離開負極的時間＝t − s/v，所以
 *   「哪些電子帶方塊」「元件已經吃了幾個」都是 t 的解析式。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 能量來源  8 s  t＝0 起從負極出發的電子才帶方塊 → 方塊從電池流出、沿線送到三個元件；元件略暗
 *   2 熱效應    8 s  吹風機亮、其他壓暗；電熱絲由暗紅變亮橘，噴口吹出橘紅熱風波紋
 *   3 化學效應  8 s  充電電池亮；綠色電量條上升、綠色氣泡圈（化學變化）
 *   4 磁效應    8 s  電磁鐵亮；紫色磁力線出現，1.5 s 起鐵釘被吸到鐵芯右端
 *   5 能量守恆 10 s  只放一批：每條支路恰好 4 個方塊；電池「送出 0→12」，三個元件上方各一排 4 格的收納列
 *                    逐格填滿（12 ＝ 4 ＋ 4 ＋ 4），效應強度跟著收到的方塊數長出來；約 7.7 s 收齊後停留
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 字級：畫布文字 22–26px（說明 24、標籤 22–24），Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', energy: '#fde047',
    heat: '#fb923c', heatHot: '#ff6a3d', chem: '#4ade80', mag: '#d99bff',
    panel: '#123029', panelEdge: '#55746a', copper: '#d08a4a', iron: '#8e9a95'
  };

  // ───────── 版面 ─────────
  const TOP = 140, BOT = 495, MID = 318;
  const BAT_X = 90, BAT_W = 64, BAT_H = 130, BAT_TOP = MID - BAT_H / 2, BAT_BOT = MID + BAT_H / 2;
  const BX = [380, 600, 820];                 // 三條支路
  const BW = 184, BH = 200, BOX_T = MID - BH / 2, BOX_B = MID + BH / 2;
  const V = 180;                              // 電子速率 px/s
  const PITCH = (BX[1] - BX[0]) / 3;          // 同一支路電子間距；支路間距的 1/3 → 三條支路的電子在共用幹線上均勻交錯
  const SQ = 13, OFF = 15;                    // 能量方塊邊長、離導線距離
  const DEV = [
    { key: 'dryer', name: ['吹風機', 'Hair dryer'], color: K.heat, tray: ['內能', 'Internal'] },
    { key: 'cell', name: ['充電電池', 'Rechargeable battery'], color: K.chem, tray: ['化學變化', 'Chem. change'] },
    { key: 'magnet', name: ['電磁鐵', 'Electromagnet'], color: K.mag, tray: ['磁場', 'Magnetic field'] }
  ];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const TAU = Math.PI * 2;

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = u; } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  // 依序試：24 一行 → 22 一行 → 24 換行 → 22 換行（最小 22，不再縮）
  function fit(ctx, s, maxW) {
    for (const z of [24, 22]) if (textW(ctx, s, z) <= maxW) return { lines: [s], size: z };
    for (const z of [24, 22]) { const ls = wrap(ctx, s, maxW, z); if (ls.every(l => textW(ctx, l, z) <= maxW)) return { lines: ls, size: z }; }
    return { lines: wrap(ctx, s, maxW, 22), size: 22 };
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }

  // ───────── 電子路徑 ─────────
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function at(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), dx: (b.x - a.x) / (d || 1), dy: (b.y - a.y) / (d || 1) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y, dx: 0, dy: 1 };
  }
  // 支路 k：電池中心 → 負極 → 下幹線 → 支路往上（經元件接腳）→ 上幹線 → 正極 → 電池中心（被電池蓋住）。
  // 總長補到 PITCH 的整數倍（多出的長度停在電池中心，看不到），所以每條支路間距都正好是 PITCH。
  // sDev＝元件下接腳（能量在這裡進入元件、被吃掉；用元件座標算）。
  const BR = BX.map((bx, k) => {
    const P = [{ x: BAT_X, y: MID }, { x: BAT_X, y: BAT_BOT }, { x: BAT_X, y: BOT }, { x: bx, y: BOT }, { x: bx, y: BOX_B },
      { x: bx, y: TOP }, { x: BAT_X, y: TOP }, { x: BAT_X, y: BAT_TOP }, { x: BAT_X, y: MID }];
    const Lg = polyLen(P), n = Math.ceil(Lg / PITCH - 1e-9), L = n * PITCH, sDev = polyLen(P.slice(0, 5));
    return { P, Lg, L, n, sDev, dt: PITCH / V, phi: k * PITCH / 3 };   // dt：同支路相鄰兩顆電子離開的時間差
  });

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['能量來源', 'Source'],
      cap: ['電池把能量送進電路', 'The battery sends energy into the circuit'],
      res: ['電池把能量送進電路。黃色小方塊是「能量」的教學符號，不代表實體粒子。',
        'The battery sends energy into the circuit. Yellow squares symbolize "energy packets", not actual particles.'] },
    { dur: 8, b: ['熱效應', 'Heat'], hi: 0,
      cap: ['吹風機：電能變成內能，吹出熱風', 'Hair dryer: electrical energy becomes heat'],
      res: ['吹風機的電熱絲把電能轉換成內能，產生熱風。', 'The hair dryer converts electrical energy into internal energy (heat).'] },
    { dur: 8, b: ['化學效應', 'Chemical'], hi: 1,
      cap: ['充電電池：電能推動化學變化', 'Charging: energy drives a chemical change'],
      res: ['充電時，電能推動化學反應，把能量儲存在電池內。', 'Electrical energy drives a chemical reaction to store energy in the battery.'] },
    { dur: 8, b: ['磁效應', 'Magnetic'], hi: 2,
      cap: ['電磁鐵：電流產生磁場，吸起鐵釘', 'Electromagnet: current makes a magnetic field'],
      res: ['電流通過線圈會產生磁場，使鐵芯成為電磁鐵。', 'Current through the coil generates a magnetic field, making it an electromagnet.'] },
    { dur: 10, b: ['能量守恆', 'Conserved'], batch: true,
      cap: ['能量總數不變：12 ＝ 4 ＋ 4 ＋ 4', 'Total energy stays the same: 12 = 4 + 4 + 4'],
      res: ['電能不會消失，只會轉換成別種形式的能量。（方塊數只是示意，各裝置實際用的電能並不相同。）', 'Electrical energy is not lost; it is only transformed into other forms of energy. (The number of squares is only illustrative; real devices use different amounts.)'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });
  const BATCH_T0 = STARTS[4] + 0.3;           // 第 5 步：這之後離開負極的前 4 顆（每條支路）才帶方塊
  const BATCH_N = 4;

  // 支路 k 第 i 次「有電子離開負極」的時間
  const depT = (k, i) => i * BR[k].dt - BR[k].phi / V;
  const depIdx = (k, T) => Math.round((T + BR[k].phi / V) / BR[k].dt);
  const batchI0 = k => Math.ceil((BATCH_T0 + BR[k].phi / V) / BR[k].dt - 1e-9);
  function carries(k, i, step) {
    if (step === 4) { const i0 = batchI0(k); return i >= i0 && i < i0 + BATCH_N; }
    return depT(k, i) >= -1e-9;                // 第 1～4 步：t＝0（接通）後出發的電子都帶能量
  }
  // 第 5 步：支路 k 到時間 T 已收到（吃掉）幾個；smooth 版每個用 0.4 s 長出來
  function batchEaten(k, T, smooth) {
    const i0 = batchI0(k); let n = 0;
    for (let i = i0; i < i0 + BATCH_N; i++) {
      const te = depT(k, i) + BR[k].sDev / V;
      n += smooth ? clamp((T - te) / 0.4, 0, 1) : (T >= te ? 1 : 0);
    }
    return n;
  }
  function batchSent(T) {
    let n = 0;
    for (let k = 0; k < 3; k++) { const i0 = batchI0(k); for (let i = i0; i < i0 + BATCH_N; i++) if (T >= depT(k, i)) n++; }
    return n;
  }

  // 各元件的亮度（壓暗）與效應強度
  function dimOf(step, d) { if (step === 0) return 0.55; if (step === 4) return 1; return STEPS[step].hi === d ? 1 : 0.25; }
  function effectOf(step, tl, T, d) {
    if (step === 4) return clamp(batchEaten(d, T, true) / BATCH_N, 0, 1);
    if (STEPS[step].hi === d) return ease((tl - 0.4) / 2.4);
    return 0;
  }
  function nailLift(step, tl, T) {
    if (step === 3) return ease((tl - 1.5) / 1.3);
    if (step === 4) return ease(batchEaten(2, T, true));
    return 0;
  }

  // ───────── 繪圖 ─────────
  function wirePath(ctx, pts, color, w, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function square(ctx, x, y, s, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill(); ctx.restore();
  }
  function electron(ctx, x, y, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.restore();
  }

  function drawWires(ctx, step) {
    // 幹線（共用）與電池引線
    wirePath(ctx, [[BAT_X, BAT_TOP], [BAT_X, TOP], [BX[2], TOP]], K.wire, 5, 1);
    wirePath(ctx, [[BAT_X, BAT_BOT], [BAT_X, BOT], [BX[2], BOT]], K.wire, 5, 1);
    // 支路（元件框會蓋住中段；導線畫到框的上下接腳）
    BX.forEach((bx, d) => {
      const a = Math.max(0.35, dimOf(step, d));
      wirePath(ctx, [[bx, TOP], [bx, BOX_T]], K.wire, 5, a);
      wirePath(ctx, [[bx, BOX_B], [bx, BOT]], K.wire, 5, a);
    });
  }

  function drawFlow(ctx, step, T) {
    for (let k = 0; k < 3; k++) {
      const br = BR[k], aDim = Math.max(0.35, dimOf(step, k));
      for (let j = 0; j < br.n; j++) {
        const s = ((j * br.L / br.n + V * T + br.phi) % br.L + br.L) % br.L;
        if (s > br.Lg) continue;                  // 停在電池內部
        const p = at(br.P, s);
        // 共用幹線上一律全亮；只有走進被壓暗的那條支路（直立段）才跟著壓暗
        const a = Math.abs(p.x - BX[k]) < 0.5 ? aDim : 1;
        if (s < br.sDev && s > BAT_H / 2 + 4) {   // 出了負極才看得到方塊
          const i = depIdx(k, T - s / V);
          if (carries(k, i, step)) square(ctx, p.x - p.dy * OFF, p.y + p.dx * OFF, SQ, a);   // 導線外側
        }
        electron(ctx, p.x, p.y, a);
      }
    }
  }

  function drawBattery(ctx, step, tl) {
    const x = BAT_X - BAT_W / 2;
    if (step === 0) {                                  // 第 1 步：電池外圈發亮
      ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * Math.sin(tl * 4) ** 2; ctx.shadowColor = K.energy; ctx.shadowBlur = 26;
      ctx.strokeStyle = K.energy; ctx.lineWidth = 4; rrect(ctx, x - 4, BAT_TOP - 4, BAT_W + 8, BAT_H + 8, 14); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = '#17392f'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x, BAT_TOP, BAT_W, BAT_H, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K.pos; ctx.fillRect(x + 12, BAT_TOP + 10, BAT_W - 24, 8);           // + 極板（橘）
    ctx.fillStyle = K.electron; ctx.fillRect(x + 12, BAT_BOT - 18, BAT_W - 24, 8);       // − 極板（藍）
    ctx.restore();
    text(ctx, '+', BAT_X, BAT_TOP + 40, K.pos, 26);
    text(ctx, '−', BAT_X, BAT_BOT - 40, K.electron, 26);
  }
  function drawBatteryLabel(ctx, step, T) {
    const x = BAT_X + BAT_W / 2 + 14, maxW = BX[0] - BW / 2 - 12 - x;
    const nm = fit(ctx, tr('電池', 'Battery'), maxW);
    const y0 = step === 4 ? MID - 22 : MID;
    nm.lines.forEach((l, i) => text(ctx, l, x, y0 + (i - (nm.lines.length - 1) / 2) * (nm.size + 6), K.white, nm.size, 'left'));
    if (step === 4) {
      const s = tr(`送出 ${batchSent(T)}`, `Sent ${batchSent(T)}`);
      text(ctx, s, x, MID + 22, K.yellow, 24, 'left');
    }
  }

  function devBox(ctx, d, alpha, glow) {
    const x = BX[d] - BW / 2;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (glow > 0) { ctx.shadowColor = DEV[d].color; ctx.shadowBlur = 22 * glow; }
    ctx.fillStyle = K.panel; ctx.strokeStyle = glow > 0 ? DEV[d].color : K.panelEdge; ctx.lineWidth = 3;
    rrect(ctx, x, BOX_T, BW, BH, 16); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    // 上下接腳（導線接到這兩點）
    ctx.fillStyle = K.wire; [BOX_T, BOX_B].forEach(y => { ctx.beginPath(); ctx.arc(BX[d], y, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
    const nm = fit(ctx, tr(DEV[d].name[0], DEV[d].name[1]), BW - 18);
    const lh = nm.size + 4, top = BOX_T + 14 + nm.size / 2;
    nm.lines.forEach((l, i) => text(ctx, l, BX[d], top + i * lh, K.white, nm.size, 'center', alpha));
    return BOX_T + 14 + nm.lines.length * lh;            // 名稱下緣
  }

  function drawDryer(ctx, alpha, e, T) {
    const cx = BX[0], hasHi = e > 0;
    devBox(ctx, 0, alpha, hasHi ? e : 0);
    ctx.save(); ctx.globalAlpha *= alpha;
    // 機身（橫放，噴口朝右）＋握把
    const bx0 = cx - 80, bx1 = cx + 26, by0 = 306, by1 = 354;
    ctx.fillStyle = '#2b4a41'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, cx - 58, by1 - 4, 26, 54, 8); ctx.fill(); ctx.stroke();
    rrect(ctx, bx0, by0, bx1 - bx0, by1 - by0, 22); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx1, by0 + 8); ctx.lineTo(bx1 + 18, by0 + 2); ctx.lineTo(bx1 + 18, by1 - 2); ctx.lineTo(bx1, by1 - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 電熱絲：鋸齒，暗紅 → 亮橘
    const hot = e;
    ctx.strokeStyle = hot > 0.02 ? `rgb(${Math.round(lerp(122, 255, hot))},${Math.round(lerp(64, 122, hot))},${Math.round(lerp(48, 61, hot))})` : '#7a4030';
    ctx.lineWidth = 4; if (hot > 0.02) { ctx.shadowColor = K.heatHot; ctx.shadowBlur = 16 * hot; }
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const x = bx0 + 16 + i * 7, y = (by0 + by1) / 2 + (i % 2 ? -11 : 11); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
    // 熱風：噴口吹出的橘紅波紋（往右飄，越熱越多、越亮）
    if (e > 0.02) {
      for (let r = 0; r < 3; r++) {
        const y0 = by0 + 12 + r * 13;
        const ph = (T * 0.9 + r * 0.33) % 1;
        ctx.save(); ctx.globalAlpha *= alpha * e * (1 - ph * 0.6);
        ctx.strokeStyle = r === 1 ? K.heatHot : K.heat; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath();
        const xs = bx1 + 22, len = 16 + 24 * ph;
        for (let q = 0; q <= 12; q++) { const x = xs + len * q / 12, y = y0 + Math.sin(q * 1.2 - T * 8 + r) * 4; q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
    }
  }

  function drawCell(ctx, alpha, e, T) {
    const cx = BX[1];
    devBox(ctx, 1, alpha, e > 0 ? e : 0);
    const x0 = cx - 34, x1 = cx + 34, y0 = 298, y1 = 410;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = K.white; ctx.fillRect(cx - 12, y0 - 7, 24, 7);                 // 正極凸頭
    ctx.fillStyle = '#16302a'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x0, y0, x1 - x0, y1 - y0, 8); ctx.fill(); ctx.stroke();
    // 電量（綠）：底部往上長
    const fy0 = 330, fy1 = 388, level = 0.15 + 0.7 * e;
    const fh = (fy1 - fy0) * level;
    ctx.fillStyle = K.chem; ctx.globalAlpha *= 0.85; ctx.fillRect(x0 + 7, fy1 - fh, x1 - x0 - 14, fh);
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.white; ctx.lineWidth = 2; ctx.strokeRect(x0 + 7, fy0, x1 - x0 - 14, fy1 - fy0); ctx.restore();
    // 化學變化：綠色空心氣泡往上冒（不是實心球，避免和電子混淆）
    if (e > 0.02) {
      for (let b = 0; b < 5; b++) {
        const ph = (T * 0.55 + b * 0.2) % 1;
        const by = fy1 - 4 - ph * (fh - 8), bxp = x0 + 14 + ((b * 37) % 40) + Math.sin(T * 3 + b) * 2;
        if (by < fy1 - fh + 4) continue;
        ctx.save(); ctx.globalAlpha *= alpha * e * (1 - ph * 0.5); ctx.strokeStyle = '#d8ffe4'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bxp, by, 3 + (b % 2), 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    text(ctx, '+', cx, 314, K.pos, 22, 'center', alpha);
    text(ctx, '−', cx, 399, K.electron, 22, 'center', alpha);
  }

  function drawMagnet(ctx, alpha, e, lift, T) {
    const cx = BX[2], cy = 340;
    devBox(ctx, 2, alpha, e > 0 ? e : 0);
    const c0 = cx - 72, c1 = cx + BW / 2 + 12;      // 鐵芯伸出框外一點（右端＝磁極）
    // 磁力線（紫、虛線）：在鐵芯／線圈後面
    if (e > 0.02) {
      ctx.save(); ctx.globalAlpha *= alpha * e; ctx.strokeStyle = K.mag; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -T * 30;
      [[70, 30], [96, 46]].forEach(([rx, ry]) => { ctx.beginPath(); ctx.ellipse(cx + 10, cy, rx, ry, 0, 0, TAU); ctx.stroke(); });
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = K.iron; ctx.strokeStyle = '#d6dfdb'; ctx.lineWidth = 2;
    rrect(ctx, c0, cy - 12, c1 - c0, 24, 5); ctx.fill(); ctx.stroke();
    // 線圈（銅）
    ctx.strokeStyle = K.copper; ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(c0 + 18 + i * 13, cy, 6, 22, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // 鐵釘：平躺在右下 → 被吸到鐵芯右端
    const restY = BOT - 20, y = lerp(restY, cy, lift), x = c1 + 3;
    const wob = lift > 0 && lift < 1 ? Math.sin(T * 18) * 0.06 * (1 - lift) : 0;
    ctx.save(); ctx.globalAlpha *= Math.max(alpha, 0.35);
    ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, restY + 9); ctx.lineTo(W - 8, restY + 9); ctx.stroke();  // 桌面
    ctx.translate(x, y); ctx.rotate(wob);
    ctx.fillStyle = '#c7d0cc'; ctx.fillRect(0, -8, 5, 16);                     // 釘頭（貼磁極）
    ctx.fillRect(5, -3, 50, 6);
    ctx.beginPath(); ctx.moveTo(55, -3); ctx.lineTo(66, 0); ctx.lineTo(55, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // 第 5 步：三個元件上方各一排 4 格收納列
  function drawTrays(ctx, T) {
    for (let d = 0; d < 3; d++) {
      const n = batchEaten(d, T, false), cx = BX[d];
      const lab = fit(ctx, tr(DEV[d].tray[0], DEV[d].tray[1]), 200);
      text(ctx, lab.lines[0], cx, 80, DEV[d].color, lab.size);
      const gap = 26, x0 = cx - gap * 1.5;
      for (let i = 0; i < BATCH_N; i++) {
        const x = x0 + i * gap, y = 112;
        ctx.save(); ctx.strokeStyle = DEV[d].color; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.strokeRect(x - 10, y - 10, 20, 20); ctx.restore();
        if (i < n) square(ctx, x, y, 15, 1);
      }
    }
  }

  function drawLegend(ctx) {
    const a = tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −');
    const b = tr('黃方塊＝能量（教學符號）', 'Yellow square = energy (symbol)');
    const z = 22, gapIcon = 26, gapItem = 40;
    const wa = gapIcon + textW(ctx, a, z), wb = gapIcon + textW(ctx, b, z);
    const items = wa + gapItem + wb <= W - 60 ? [[[a, 'e'], [b, 's']]] : [[[a, 'e']], [[b, 's']]];
    const ys = items.length === 1 ? [558] : [543, 576];
    items.forEach((row, r) => {
      const widths = row.map(([s]) => gapIcon + textW(ctx, s, z));
      let x = W / 2 - (widths.reduce((p, q) => p + q, 0) + gapItem * (row.length - 1)) / 2;
      row.forEach(([s, kind], i) => {
        if (kind === 'e') electron(ctx, x + 8, ys[r], 1); else square(ctx, x + 8, ys[r], SQ, 1);
        text(ctx, s, x + gapIcon, ys[r], K.white, z, 'left');
        x += widths[i] + gapItem;
      });
    });
  }

  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    const y0 = ls.length > 1 ? 30 : 40;
    ls.forEach((l, i) => text(ctx, l, W / 2, y0 + i * 30, K.yellow, 24));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar) { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }   // 共用：畫布內的粗進度條
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = K.bg; STARTS.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }

  function drawScene(ctx, step, tl, T) {
    drawWires(ctx, step);
    drawFlow(ctx, step, T);                 // 電子在元件之前畫
    drawBattery(ctx, step, tl);
    const e = [0, 1, 2].map(d => effectOf(step, tl, T, d));
    drawDryer(ctx, dimOf(step, 0), e[0], T);
    drawCell(ctx, dimOf(step, 1), e[1], T);
    drawMagnet(ctx, dimOf(step, 2), e[2], nailLift(step, tl, T), T);
    drawBatteryLabel(ctx, step, T);
    if (step === 4) drawTrays(ctx, T);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('effectsAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('effectsAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl, S.t);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-effects');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-effects'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const c = ctl();
    if (S.last && !(c && c.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    // 學生模式：以「正在播的步驟」為準，播到該步結尾就停在最後一幀；stepStop＝false 則連播到底
    let kk = S.step >= 0 ? S.step : stepAt(S.t);
    const end = stepStop ? (STARTS[kk + 1] !== undefined ? STARTS[kk + 1] : TOTAL) : TOTAL;
    if (S.t >= end) {
      S.t = end - 1e-3; render();
      if (!stepStop && !S.ended && c && typeof c.onEnd === 'function') { S.ended = true; c.onEnd(); }
      return;
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.on || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.on) start(); });

  window.EpAnim.effects = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-effects'); if (row) row.innerHTML = '';
      const r = document.getElementById('effectsAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { effects: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'effects' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
