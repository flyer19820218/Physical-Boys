/* electric_power_transmission_2_current_1105_v1.js — 「直流與交流」分頁動畫（#currentAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.current = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'current'。畫布不綁任何事件；唯一控制是 #steps-current 裡的 5 個步驟鈕；結果框 #currentAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   左半（x 90～390）：單迴路。電源在左邊直立導線正中央（第 1 步電池：+ 上、− 下；第 2～5 步交流電源：圓圈裡 ~，
 *   沒有固定正負極），燈泡在右邊直立導線正中央。上下兩條導線各一個紅色電流箭頭，旁邊寫「流入／流出燈泡」。
 *   右半（x 560～960）：「電流－時間」圖，橫軸時間、縱軸電流（上＝正向、下＝反向），掃描游標跟著時間走。
 *   第 4 步右半改成「1 秒計時條＋密集波（60 個週期示意）＋放大其中 1 個週期（1/60 秒）」。
 *
 * ── 方向約定 ────────────────────────────────────────────────────────
 *   正向電流＝順時針：上導線往右流入燈泡、下導線往左流出。電子沿反方向（逆時針）走：
 *   路徑參數 s（0＝電源中心，往下 → 下導線往右 → 右導線往上穿過燈泡 → 上導線往左 → 回電源），
 *   電子速度＝v·I(t)／I0，所以直流 s＝v·t（從電池負極出來往下走）；
 *   交流 I＝sin(2πτ/T)，s 位移＝v·T/(2π)·(1－cos 2πτ/T)，電子在原地附近來回。
 *   動畫裡的交流是放慢的（T＝4 s）；第 4 步才講真實的 60 Hz。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 直流電    8 s  電池；電子從負極出發朝同一方向繞；紅箭頭固定；I-t 圖＝正向水平線
 *   2 交流電    8 s  交流電源 ~；電子來回、紅箭頭每半週期翻轉（接近 0 時淡出）；上下導線「流入／流出」對調；I-t 正弦波（2 個週期）
 *   3 一個週期  9 s  游標畫第 1 個週期時依序出現「正向半週期」「反向半週期」括號；走完一個週期後該週期高亮＋「一個週期」括號
 *   4 60 Hz     9 s  1 秒計時條填滿時，密集波畫滿 60 個週期、計數到 60；之後放大其中 1 個週期標「1/60 秒」；
 *                    電路裡電子快速小幅抖動、紅色雙頭箭頭表示方向快速來回
 *   5 燈仍會亮  8 s  交流；藍色能量方塊（教學符號）由電源沿上下導線送進燈泡後被轉換（燈絲發光，標「熱與光」）；
 *                    I-t 圖上正、反向每個半週期旁都亮一顆小燈泡
 * 不出現 √2、峰值、有效值。
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–36px（說明 24、標籤 22–26、「60 Hz」36），Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', current: '#ff4d4d', energy: '#4dd2ff'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;

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
  function fitSize(ctx, s, maxW, want) {
    for (let z = want; z >= 22; z -= 2) if (textW(ctx, s, z) <= maxW) return z;
    return 22;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 置中寫字，但左右不超出 [lo, hi]
  function textClamp(ctx, s, cx, y, color, size, lo, hi, alpha) {
    const w = textW(ctx, s, size);
    const x = clamp(cx, lo + w / 2, hi - w / 2);
    text(ctx, s, x, y, color, size, 'center', alpha);
  }

  // ───────── 迴路版面 ─────────
  const LX = 90, RX = 390, TOP = 135, BOT = 465, MID = 300, BR = 38;   // BR＝燈泡半徑
  const BAT = { w: 60, h: 110 }, ACR = 36;
  const bulbT = MID - BR - 8, bulbB = MID + BR + 8;
  const LOOP = [{ x: LX, y: MID }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: MID }];
  const LC = polyLen(LOOP);
  const NE = 24;                 // 電子數
  const VE = 40;                 // 電子漂移速率（px/s，示意）
  const TAC = 4;                 // 放慢的交流週期（s）

  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function atPoly(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y };
  }

  // ───────── 右側 I-t 圖 ─────────
  const GX0 = 560, GX1 = 950, GY = 300, GA = 110, GT = 130, GB = 470;
  const GWIN = 8;                // 圖上時間窗（s）
  const gx = tau => GX0 + clamp(tau / GWIN, 0, 1) * (GX1 - GX0);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['直流電', 'DC'], ac: false,
      cap: ['直流電：電流方向固定', 'DC: the current keeps one direction'],
      res: ['直流電 DC：電流方向固定，電池供應的電流屬於直流電。', 'DC: the current keeps one fixed direction. A battery supplies direct current.'] },
    { dur: 8, b: ['交流電', 'AC'], ac: true,
      cap: ['交流電：電流方向來回改變', 'AC: the current direction keeps reversing'],
      res: ['交流電 AC：電流方向週期性改變；上下兩條導線都有電流，同一時刻一條流入燈泡、另一條流出，方向每半週期一起反轉。',
        'AC: the current direction changes periodically. Both wires carry current; one flows into the lamp while the other flows out, and both reverse every half cycle.'] },
    { dur: 9, b: ['一個週期', 'One cycle'], ac: true,
      cap: ['正向一次＋反向一次＝一個週期', 'Forward once + reverse once = one cycle'],
      res: ['電流正向一次、反向一次，回到原來的狀態，就是一個週期。', 'One forward half and one reverse half, back to the starting state: that is one cycle.'] },
    { dur: 9, b: ['60 Hz', '60 Hz'], ac: true,
      cap: ['台灣市電 60 Hz：每秒 60 個週期', 'Taiwan mains, 60 Hz: 60 cycles every second'],
      res: ['60 Hz 表示每秒完成 60 個週期；每個週期需時 1/60 秒。前面的動畫是放慢的，實際變化快得多。',
        '60 Hz means 60 cycles every second; each cycle takes 1/60 s. The earlier animations were slowed down; the real change is much faster.'] },
    { dur: 8, b: ['燈仍會亮', 'Still lit'], ac: true,
      cap: ['方向一直變，燈泡照樣亮', 'The direction keeps changing, yet the lamp stays lit'],
      res: ['電流不論往哪個方向通過燈絲，都會把電能轉換成熱與光，所以交流電也能讓燈泡持續發亮。',
        'Current in either direction passes through the filament and transforms electrical energy into heat and light, so an AC lamp stays lit.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 時間 → 物理量 ─────────
  // 第 i 步、步內時間 tl：電流（正向＝1）、電子位移、圖上時間 τ
  const T3_0 = 0.5;              // 第 3 步：游標 0.5 s 後才開始走
  function tauOf(i, tl) { return i === 2 ? clamp(tl - T3_0, 0, GWIN) : clamp(tl, 0, GWIN); }
  function curI(i, tl) {
    if (i === 0) return 1;
    if (i === 3) return Math.sin(TAU * tl / 0.4);
    return Math.sin(TAU * tauOf(i, tl) / TAC);
  }
  function shiftOf(i, tl) {
    if (i === 0) return VE * tl;
    if (i === 3) return 5 * (1 - Math.cos(TAU * tl / 0.4));
    const tau = tauOf(i, tl);
    return VE * TAC / TAU * (1 - Math.cos(TAU * tau / TAC));
  }

  // ───────── 繪圖小工具 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function wirePath(ctx, pts, color, w, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function square(ctx, x, y, alpha, scale) {
    const s = 13 * (scale || 1);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  }
  // 紅色電流箭頭：中心 (x,y)，dir＝+1 往右、−1 往左；dbl＝雙頭
  function arrowH(ctx, x, y, dir, alpha, len, dbl) {
    if (alpha <= 0.01) return;
    const L = len || 60, hd = 16, hw = 11;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = K.current; ctx.fillStyle = K.current; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.shadowColor = K.current; ctx.shadowBlur = 10;
    const x0 = x - dir * L / 2, x1 = x + dir * L / 2;
    ctx.beginPath(); ctx.moveTo(dbl ? x0 + dir * hd * 0.8 : x0, y); ctx.lineTo(x1 - dir * hd * 0.8, y); ctx.stroke();
    const head = (xt, d) => { ctx.beginPath(); ctx.moveTo(xt, y); ctx.lineTo(xt - d * hd, y - hw); ctx.lineTo(xt - d * hd, y + hw); ctx.closePath(); ctx.fill(); };
    head(x1, dir); if (dbl) head(x0, -dir);
    ctx.restore();
  }

  // ───────── 電路 ─────────
  function drawWires(ctx, ac) {
    const h = ac ? ACR : BAT.h / 2;
    wirePath(ctx, [{ x: LX, y: MID + h }, { x: LX, y: BOT }, { x: RX, y: BOT }, { x: RX, y: bulbB }], K.wire, 5);
    wirePath(ctx, [{ x: RX, y: bulbT }, { x: RX, y: TOP }, { x: LX, y: TOP }, { x: LX, y: MID - h }], K.wire, 5);
  }
  function drawElectrons(ctx, shift) {
    for (let k = 0; k < NE; k++) {
      const s = (((k * LC / NE + shift) % LC) + LC) % LC;
      const p = atPoly(LOOP, s);
      ball(ctx, p.x, p.y, 7, 1);
    }
  }
  function drawBattery(ctx) {
    const x = LX - BAT.w / 2, y = MID - BAT.h / 2;
    ctx.save(); ctx.fillStyle = '#17392f'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x, y, BAT.w, BAT.h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K.pos; ctx.fillRect(x + 10, y + 9, BAT.w - 20, 7);
    ctx.fillStyle = K.electron; ctx.fillRect(x + 10, y + BAT.h - 16, BAT.w - 20, 7);
    ctx.fillStyle = K.wire; [y, y + BAT.h].forEach(py => { ctx.beginPath(); ctx.arc(LX, py, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
    text(ctx, '+', LX, y + 34, K.pos, 26);
    text(ctx, '−', LX, y + BAT.h - 34, K.electron, 26);
  }
  function drawACSource(ctx) {
    ctx.save(); ctx.fillStyle = '#17392f'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(LX, MID, ACR, 0, TAU); ctx.fill(); ctx.stroke();
    // ~ 正弦符號（畫的，不是字）
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = LX - 20 + 40 * u, y = MID - 9 * Math.sin(TAU * u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = K.wire; [MID - ACR, MID + ACR].forEach(py => { ctx.beginPath(); ctx.arc(LX, py, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function drawBulb(ctx, g) {
    const cx = RX, cy = MID, R = BR;
    if (g > 0.01) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.4);
      gr.addColorStop(0, `rgba(255,244,190,${0.55 * g})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,170,${0.85 * g})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + Math.PI / 8, r0 = R + 10, r1 = R + 10 + 16 * g;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, bulbB); ctx.lineTo(cx, cy + R); ctx.moveTo(cx, bulbT); ctx.lineTo(cx, cy - R); ctx.stroke();
    ctx.fillStyle = g > 0.01 ? `rgba(${Math.round(lerp(22, 92, g))},${Math.round(lerp(58, 84, g))},${Math.round(lerp(49, 40, g))},1)` : '#163a31';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9d3cf'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + R); ctx.lineTo(cx, cy + R * 0.45); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy - R * 0.45); ctx.stroke();
    ctx.strokeStyle = g > 0.01 ? `rgb(${Math.round(lerp(150, 255, g))},${Math.round(lerp(96, 246, g))},${Math.round(lerp(60, 200, g))})` : '#8a5a36';
    ctx.lineWidth = 3.5; if (g > 0.01) { ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 18 * g; }
    ctx.beginPath();
    const n = 8, y0 = cy + R * 0.45, y1 = cy - R * 0.45;
    for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), x = cx + (i === 0 || i === n ? 0 : (i % 2 ? -1 : 1) * R * 0.28); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = K.wire; [bulbT, bulbB].forEach(py => { ctx.beginPath(); ctx.arc(cx, py, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function miniBulb(ctx, x, y, a) {          // I-t 圖上的小燈泡（亮）
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a;
    const gr = ctx.createRadialGradient(x, y, 3, x, y, 26);
    gr.addColorStop(0, 'rgba(255,244,190,0.75)'); gr.addColorStop(1, 'rgba(255,244,190,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.strokeStyle = K.white; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // 能量方塊（第 5 步）：從電源沿上下導線內側送進燈泡中心，在燈泡被轉換（消失）
  const EPATH = [
    [{ x: LX + 20, y: MID - 44 }, { x: LX + 20, y: TOP + 18 }, { x: RX - 20, y: TOP + 18 }, { x: RX - 20, y: MID - 50 }, { x: RX, y: MID }],
    [{ x: LX + 20, y: MID + 44 }, { x: LX + 20, y: BOT - 18 }, { x: RX - 20, y: BOT - 18 }, { x: RX - 20, y: MID + 50 }, { x: RX, y: MID }]
  ];
  const ELEN = polyLen(EPATH[0]), ESP = 62, EV = 110;
  function drawEnergy(ctx, tl) {
    const appear = clamp((tl - 0.4) / 0.5, 0, 1);
    if (appear <= 0) return;
    EPATH.forEach((P, side) => {
      const n = Math.ceil(ELEN / ESP);
      for (let k = 0; k < n; k++) {
        const s = ((EV * tl + k * ESP + side * ESP / 2) % ELEN + ELEN) % ELEN;
        if (tl - s / EV < 0.4) continue;                              // 0.4 s 之後才開始從電源送出
        const p = atPoly(P, s), toEnd = ELEN - s;
        const fadeIn = clamp(s / 30, 0, 1), fadeOut = clamp(toEnd / 50, 0, 1);
        square(ctx, p.x, p.y, appear * fadeIn * (0.25 + 0.75 * fadeOut), lerp(0.55, 1, fadeOut));
      }
    });
  }

  function drawCircuit(ctx, i, tl) {
    const st = STEPS[i], ac = st.ac;
    drawWires(ctx, ac);
    drawElectrons(ctx, shiftOf(i, tl));            // 電子在元件之前畫
    if (ac) drawACSource(ctx); else drawBattery(ctx);
    const glow = i === 4 ? 0.95 + 0.05 * Math.sin(tl * 9) : 0.82;
    drawBulb(ctx, glow);
    if (i === 4) drawEnergy(ctx, tl);
    // 電流箭頭（上導線、下導線）＋「流入／流出燈泡」
    const ax = (LX + RX) / 2;
    if (i === 3) {
      arrowH(ctx, ax, TOP, 1, 0.95, 70, true); arrowH(ctx, ax, BOT, 1, 0.95, 70, true);
    } else {
      const I = curI(i, tl), dir = I >= 0 ? 1 : -1, a = ac ? clamp(Math.abs(I) * 1.6, 0, 1) : 1;
      arrowH(ctx, ax, TOP, dir, a, 60); arrowH(ctx, ax, BOT, -dir, a, 60);
      const inS = tr('流入燈泡', 'into the lamp'), outS = tr('流出燈泡', 'out of the lamp');
      text(ctx, dir > 0 ? inS : outS, ax, TOP - 28, K.current, fitSize(ctx, inS, 330, 22), 'center', a);
      text(ctx, dir > 0 ? outS : inS, ax, BOT + 28, K.current, fitSize(ctx, inS, 330, 22), 'center', a);
    }
    // 元件名稱（迴路內側，不壓元件）
    const src = ac ? tr('交流電源', 'AC source') : tr('電池', 'Battery');
    text(ctx, src, LX + 50, MID, K.white, 22, 'left');
    const bl = tr('燈泡', 'Lamp');
    text(ctx, bl, RX - BR - 16, MID, K.white, 22, 'right');
    if (i === 4) text(ctx, tr('熱與光', 'heat + light'), RX - BR - 16, MID + 36, K.orange, 22, 'right', clamp((tl - 1.2) / 0.5, 0, 1));
    if (i === 3) text(ctx, '60 Hz', (LX + RX) / 2 + 10, MID - 72, K.cyan, 36, 'center');
  }

  // ───────── I-t 圖 ─────────
  function drawAxes(ctx, tag) {
    ctx.save(); ctx.strokeStyle = K.white; ctx.fillStyle = K.white; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(GX0, GB); ctx.lineTo(GX0, GT + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GX0, GT); ctx.lineTo(GX0 - 8, GT + 14); ctx.lineTo(GX0 + 8, GT + 14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(GX0, GY); ctx.lineTo(GX1 + 10, GY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GX1 + 18, GY); ctx.lineTo(GX1 + 4, GY - 8); ctx.lineTo(GX1 + 4, GY + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    text(ctx, tr('電流 I', 'Current I'), GX0 + 12, GT - 16, K.white, 22, 'left');
    text(ctx, tr('時間 t', 'Time t'), GX1 + 18, GY - 22, K.white, 22, 'right');
    const fw = tr('正向', 'forward'), rv = tr('反向', 'reverse');
    text(ctx, fw, GX0 - 12, GY - GA, K.white, 22, 'right');
    text(ctx, rv, GX0 - 12, GY + GA, K.white, 22, 'right');
    // 正反向的小刻度
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineWidth = 2;
    [GY - GA, GY + GA].forEach(y => { ctx.beginPath(); ctx.moveTo(GX0 - 6, y); ctx.lineTo(GX0 + 6, y); ctx.stroke(); });
    ctx.restore();
    if (tag) text(ctx, tag, GX1 + 18, GT - 16, K.yellow, 22, 'right');
  }
  function curve(ctx, f, tau0, tau1, color, lw, alpha) {
    if (tau1 <= tau0) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.beginPath();
    const n = Math.max(2, Math.ceil((gx(tau1) - gx(tau0)) / 2));
    for (let k = 0; k <= n; k++) { const tau = lerp(tau0, tau1, k / n), x = gx(tau), y = GY - GA * f(tau); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function cursor(ctx, tau, I) {
    const x = gx(tau), y = GY - GA * I;
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x, GT + 18); ctx.lineTo(x, GB); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = K.white; ctx.shadowColor = K.current; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 水平括號：x0..x1，在 y；up＝true 時兩端腳往下（括號在曲線上方）
  function bracket(ctx, x0, x1, y, legDown, color, alpha) {
    if (alpha <= 0.01) return;
    const d = legDown ? 10 : -10;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0 + 2, y + d); ctx.lineTo(x0 + 2, y); ctx.lineTo(x1 - 2, y); ctx.lineTo(x1 - 2, y + d); ctx.stroke();
    ctx.restore();
  }
  const sinT = tau => Math.sin(TAU * tau / TAC);

  function drawGraph(ctx, i, tl) {
    if (i === 3) { drawSixty(ctx, tl); return; }
    const tau = tauOf(i, tl);
    if (i === 0) {
      drawAxes(ctx, tr('直流 DC', 'DC'));
      curve(ctx, () => 0.8, 0, tau, K.current, 4);
      cursor(ctx, tau, 0.8);
      return;
    }
    drawAxes(ctx, tr('交流 AC', 'AC'));
    if (i === 2) {
      // 第 1 個週期：先畫正向、反向半週期的著色，再畫曲線
      const done = clamp((tau - TAC) / 0.6, 0, 1);              // 走完一個週期後高亮
      const pulse = done > 0 ? 0.75 + 0.25 * Math.sin(tl * 5) : 1;
      const shade = (t0, t1, col, a) => {
        if (a <= 0.01 || t1 <= t0) return;
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(gx(t0), GY);
        const n = 60; for (let k = 0; k <= n; k++) { const u = lerp(t0, t1, k / n); ctx.lineTo(gx(u), GY - GA * sinT(u)); }
        ctx.lineTo(gx(t1), GY); ctx.closePath(); ctx.fill(); ctx.restore();
      };
      shade(0, Math.min(tau, TAC / 2), 'rgba(255,77,77,0.18)', 1);
      shade(TAC / 2, Math.min(tau, TAC), 'rgba(85,233,255,0.16)', 1);
      if (done > 0) {
        ctx.save(); ctx.globalAlpha = 0.16 * done * pulse; ctx.fillStyle = K.yellow;
        ctx.fillRect(gx(0) + 2, GY - GA - 8, gx(TAC) - gx(0) - 2, 2 * GA + 16); ctx.restore();
      }
      curve(ctx, sinT, 0, Math.min(tau, TAC), done > 0 ? K.yellow : K.current, done > 0 ? 5 : 4);
      curve(ctx, sinT, TAC, tau, K.current, 4);
      // 括號
      const aF = clamp((tau - TAC / 2) / 0.4, 0, 1), aR = clamp((tau - TAC) / 0.4, 0, 1);
      bracket(ctx, gx(0), gx(TAC / 2), GY - GA - 18, true, K.current, aF);
      textClamp(ctx, tr('正向半週期', 'forward half'), (gx(0) + gx(TAC / 2)) / 2, GY - GA - 40, K.current, 22, GX0 + 6, 990, aF);
      bracket(ctx, gx(TAC / 2), gx(TAC), GY + GA + 18, false, K.cyan, aR);
      textClamp(ctx, tr('反向半週期', 'reverse half'), (gx(TAC / 2) + gx(TAC)) / 2, GY + GA + 40, K.cyan, 22, GX0 + 6, 990, aR);
      bracket(ctx, gx(0), gx(TAC), GB + 6, false, K.yellow, done);
      textClamp(ctx, tr('一個週期', 'one cycle'), (gx(0) + gx(TAC)) / 2, GB + 28, K.yellow, 22, GX0 + 6, 990, done);
      cursor(ctx, tau, sinT(tau));
      return;
    }
    curve(ctx, sinT, 0, tau, K.current, 4);
    if (i === 4) {             // 每個半週期都亮
      for (let k = 0; k < 4; k++) {
        const tp = TAC / 4 + k * TAC / 2, up = k % 2 === 0;
        miniBulb(ctx, gx(tp), up ? GY - GA - 30 : GY + GA + 30, clamp((tau - tp) / 0.4, 0, 1));
      }
    }
    cursor(ctx, tau, sinT(tau));
  }

  // 第 4 步：1 秒計時條＋60 個週期的密集波＋放大 1 個週期
  const SX0 = 560, SX1 = 960, SY = 232, SA = 44, NC = 60, ZK = 30;   // ZK＝放大第幾個週期
  const BOX = { x: 600, y: 330, w: 320, h: 170 };
  function drawSixty(ctx, tl) {
    const prog = clamp((tl - 0.5) / 5, 0, 1);
    // 計時條
    const by = 112, bh = 16;
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; rrect(ctx, SX0, by, SX1 - SX0, bh, 8); ctx.fill();
    if (prog > 0) { ctx.fillStyle = K.green; rrect(ctx, SX0, by, Math.max(bh, (SX1 - SX0) * prog), bh, 8); ctx.fill(); }
    ctx.strokeStyle = K.green; ctx.lineWidth = 2; rrect(ctx, SX0, by, SX1 - SX0, bh, 8); ctx.stroke(); ctx.restore();
    text(ctx, tr('0 秒', '0 s'), SX0, by + 36, K.white, 22, 'left');
    text(ctx, tr('1 秒', '1 s'), SX1, by + 36, K.green, 22, 'right');
    const n = Math.floor(NC * prog + 1e-6);
    const cnt = tr(`完成 ${n} 個週期`, `${n} cycles done`);
    text(ctx, cnt, (SX0 + SX1) / 2, by + 36, n >= NC ? K.yellow : K.white, 24, 'center');
    // 密集波
    text(ctx, tr('電流', 'current'), SX0 - 12, SY, K.white, 22, 'right');
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SX0, SY); ctx.lineTo(SX1, SY); ctx.stroke(); ctx.restore();
    const xe = SX0 + (SX1 - SX0) * prog;
    if (prog > 0) {
      ctx.save(); ctx.strokeStyle = K.current; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = SX0, k = 0; x <= xe + 1e-6; x += 0.5, k++) {
        const u = (x - SX0) / (SX1 - SX0) * NC, y = SY - SA * Math.sin(TAU * u);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = K.white; ctx.shadowColor = K.current; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(xe, SY - SA * Math.sin(TAU * prog * NC), 6, 0, TAU); ctx.fill(); ctx.restore();
    }
    // 放大其中 1 個週期
    const za = clamp((tl - 6.0) / 0.6, 0, 1);
    if (za > 0) {
      const cx0 = SX0 + (SX1 - SX0) * (ZK - 1) / NC, cx1 = SX0 + (SX1 - SX0) * ZK / NC;
      ctx.save(); ctx.globalAlpha = za;
      ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5; ctx.strokeRect(cx0 - 2, SY - SA - 8, cx1 - cx0 + 4, 2 * SA + 16);
      ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(253,224,71,0.7)';
      ctx.beginPath(); ctx.moveTo(cx0 - 2, SY + SA + 8); ctx.lineTo(BOX.x, BOX.y); ctx.moveTo(cx1 + 2, SY + SA + 8); ctx.lineTo(BOX.x + BOX.w, BOX.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(18,48,41,0.92)'; rrect(ctx, BOX.x, BOX.y, BOX.w, BOX.h, 12); ctx.fill();
      ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5; rrect(ctx, BOX.x, BOX.y, BOX.w, BOX.h, 12); ctx.stroke();
      // 放大的一個週期
      const zx0 = BOX.x + 40, zx1 = BOX.x + BOX.w - 40, zy = BOX.y + 66, zA = 44;
      ctx.strokeStyle = 'rgba(242,236,217,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(zx0 - 14, zy); ctx.lineTo(zx1 + 14, zy); ctx.stroke();
      ctx.strokeStyle = K.current; ctx.lineWidth = 4; ctx.shadowColor = K.current; ctx.shadowBlur = 6; ctx.beginPath();
      for (let k = 0; k <= 80; k++) { const u = k / 80, x = lerp(zx0, zx1, u), y = zy - zA * Math.sin(TAU * u); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      const u = ((tl - 6.0) / 1.6) % 1;
      ctx.fillStyle = K.white; ctx.shadowColor = K.current; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(lerp(zx0, zx1, u), zy - zA * Math.sin(TAU * u), 7, 0, TAU); ctx.fill();
      ctx.restore();
      bracket(ctx, zx0, zx1, zy + zA + 14, false, K.yellow, za);
      text(ctx, tr('1/60 秒', '1/60 s'), (zx0 + zx1) / 2, zy + zA + 38, K.yellow, 24, 'center', za);
    }
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = [
      [i === 0 ? tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −') : tr('藍球＝電子，在導線裡來回', 'Blue ball = electron, moves back and forth'), 'e'],
      [tr('紅箭頭＝電流方向', 'Red arrow = current direction'), 'a']
    ];
    if (i === 4) items.push([tr('藍方塊＝能量（教學符號）', 'Blue square = energy (symbol)'), 's']);
    const z = 22, gapIcon = 34, gapItem = 36, maxW = W - 60;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [560] : [544, 577];
    rows.forEach((row, r) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'e') ball(ctx, x + 10, y, 7, 1);
        else if (kind === 's') square(ctx, x + 10, y, 1, 1);
        else arrowH(ctx, x + 12, y, 1, 1, 26);
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    const y0 = ls.length > 1 ? 50 : 56;          // 畫布最上方 0～30px 留給進度條
    ls.forEach((l, k) => text(ctx, l, W / 2, y0 + k * 30, K.yellow, 24));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    drawCircuit(ctx, i, tl);
    drawGraph(ctx, i, tl);
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('currentAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('currentAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c) return;
    const ctx = c.getContext('2d'), i = stepAt(S.t), st = STEPS[i], tl = S.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    drawScene(ctx, i, tl);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-current');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-current'); if (!row) return;
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
    const kk = S.step >= 0 ? S.step : stepAt(S.t);
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

  window.EpAnim.current = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-current'); if (row) row.innerHTML = '';
      const r = document.getElementById('currentAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { current: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'current' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
