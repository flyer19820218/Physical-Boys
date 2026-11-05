/* electric_energy_power_1_energy_1105_v1.js — 「電池輸出電能」分頁動畫（#energyAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.energy = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'energy'。畫布不綁任何事件；唯一控制是 #steps-energy 裡的 5 個步驟鈕；結果框 #energyAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 * 固定數值：V = 6 V、I = 2 A、t = 5 s（第 5 步另用規格給的串聯／並聯數值）。
 *
 * ── 教學符號 ────────────────────────────────────────────────────────
 *   「1 C」＝藍色虛線圈裡 4 顆藍球（電子），代表一大群電荷。能量＝藍色小方塊，第 1～4 步 1 格＝1 J，
 *   第 5 步 1 格＝20 J（圖例跟著改寫）。電壓一律講成「每 1 C 帶多少 J」，不畫水位、高度。
 *
 * ── 電路（左半，x 130～500）───────────────────────────────────────────
 *   電池在左邊直立導線（+ 上、− 下），燈泡在右邊直立導線正中央。電荷群從負極出發：往下 → 下導線往右 →
 *   右導線往上穿過燈泡 → 上導線往左 → 回正極。路徑參數 s：0＝負極接腳，Lpath＝正極接腳。
 *   第 2～4 步是穩定電流：一串 1 C 電荷群，間距 D、速率 V＝2D px/s → 每秒恰好 2 群（2 C）通過任一點。
 *   第 k 群的位置 s＝V·t＋φ－k·D，所以「誰帶著方塊」「何時通過計數點」「計數器幾格」都是 t 的解析式：
 *   方塊在 s＝SL0～SL0＋FL 間從電池飛上電荷群，在 s＝SU～SU＋FU 間飛進燈泡中心（元件座標）後消失。
 *   計時窗 [1, 1＋T] 內通過點 sX 的群數＝計數；φ 取成「通過時刻＝1.25＋0.5j」，窗內恰好 2 群／秒。
 *
 * ── 右側面板（x 610～980）＝讀數與計數器；第 5 步改成全寬的兩組柱狀對照 ─────────────
 *
 * ── 步驟表，共 41 s ─────────────────────────────────────────────
 *   1 電壓    8 s  一群 1 C 從負極出來，電池一格一格給 6 格（6 J）→ 走到燈泡放下 → 空手往上走；面板「V = 6 V」「每 1 C 帶 n J」
 *   2 電流    7 s  穩定電流；下導線中間有計數點，1～4 s 計時，每通過 1 C 面板加一圈（每秒一列 2 圈）→ Q = It = 6 C
 *   3 時間    7 s  穩定電流；面板碼錶 1～6 s 走一圈＝5 s，最後「t = 5 s」
 *   4 合起來  9 s  穩定電流；1～6 s 每群離開電池（帶 6 J）計數器加一列 6 格，每秒 2 列＝+12 J，共 60 J；
 *                  最後「E = IVt = 6 × 2 × 5 = 60 J」
 *   5 電阻吃多少 10 s  串聯（20 V、2 A、10 s）：4 Ω 160 J、6 Ω 240 J，總 400 J，「串聯找共同電流 E = I²Rt」；
 *                  並聯（12 V、5 s）：6 Ω 120 J、3 Ω 240 J，總 360 J，「並聯找共同電壓 E = V²t／R」；1 格＝20 J
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–36px（說明 24、標籤 22–26、大讀數 34–36），Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', current: '#ff4d4d', energy: '#4dd2ff', panel: '#123029'
  };
  const RG = 22;               // 電荷群（1 C）虛線圈半徑
  const SQ = 13, PITCH = 17;   // 能量方塊邊長、格距（電路上）
  const FLY = 0.38;            // 第 1 步方塊飛行時間
  const TAU = Math.PI * 2;
  const VS = 200, D = 100;     // 穩定電流：速率 px/s、群間距 → 每秒 2 群
  const SL0 = 110, FL = 60;    // 裝能量：電荷群轉進下導線後（s 從 SL0 到 SL0+FL）方塊從電池飛上來；轉角前不帶方塊，避免轉角處方塊互疊
  const FU = 70;               // 放能量：s 從 SU 到 SU+FU 方塊飛進燈泡中心
  const PX = 795;              // 右側面板中線

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const fmt1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const mod = (a, n) => ((a % n) + n) % n;

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
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // 量過再寫：放不下就縮到 22 為止
  function fitText(ctx, s, x, y, color, want, maxW, align, alpha) {
    text(ctx, s, x, y, color, fitSize(ctx, s, maxW, want), align, alpha);
  }

  // ───────── 迴路版面 ─────────
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function atPoly(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y };
  }
  const L = (function () {
    const o = { LX: 130, RX: 500, TOP: 110, BOT: 460, MID: 285, batW: 64, batH: 140, R: 40 };
    o.pinT = o.MID - o.batH / 2; o.pinB = o.MID + o.batH / 2;
    o.bulbT = o.MID - o.R - 8; o.bulbB = o.MID + o.R + 8;
    o.P = [{ x: o.LX, y: o.pinB }, { x: o.LX, y: o.BOT }, { x: o.RX, y: o.BOT }, { x: o.RX, y: o.bulbB },
      { x: o.RX, y: o.bulbT }, { x: o.RX, y: o.TOP }, { x: o.LX, y: o.TOP }, { x: o.LX, y: o.pinT }];
    o.Lpath = polyLen(o.P); o.Lc = o.Lpath + o.batH;
    o.sBottom = o.BOT - o.pinB;
    o.sRight = o.sBottom + (o.RX - o.LX);
    o.sBulbB = o.sRight + (o.BOT - o.bulbB);                 // 燈泡下接腳
    o.sPark = o.sBulbB - RG - 10;                            // 第 1 步：燈泡下接腳外停住放能量
    o.sU = o.sRight - 15;                                    // 穩定電流：右下轉角前開始把方塊送進燈泡（轉角內側不互疊）
    o.sLoad = RG + 14;                                       // 第 1 步：負極外停住裝能量
    o.sx = x => o.sBottom + (x - o.LX);                      // 下導線上 x 處的 s
    o.sAbove = o.sBulbB + (o.bulbB - o.bulbT) + 70;           // 燈泡上方的右導線（第 1 步終點）
    o.CX = (o.LX + o.RX) / 2;
    return o;
  })();
  function posAt(s) {
    const sm = mod(s, L.Lc);
    if (sm <= L.Lpath) return Object.assign(atPoly(L.P, sm), { sm, inBat: false });
    return { x: L.LX, y: L.pinT + (sm - L.Lpath), sm, inBat: true };
  }
  function normalAt(s) {   // 迴路內側法線（前後各取 18px 平滑）
    const sm = mod(s, L.Lc);
    if (sm > L.Lpath) return { x: 1, y: 0 };
    const a = atPoly(L.P, clamp(sm - 18, 0, L.Lpath)), b = atPoly(L.P, clamp(sm + 18, 0, L.Lpath));
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const nx = dy, ny = -dx, m = Math.hypot(nx, ny) || 1;
    return { x: nx / m, y: ny / m };
  }
  // 6 格方塊的格位（3×2，貼在迴路內側）
  function slots(s, n) {
    const p = posAt(s), nn = normalAt(s);
    const cols = Math.min(3, n), rows = Math.ceil(n / cols);
    const gw = cols * PITCH, gh = rows * PITCH;
    const ext = Math.abs(nn.x) * gw / 2 + Math.abs(nn.y) * gh / 2;
    const cx = p.x + nn.x * (RG + 9 + ext), cy = p.y + nn.y * (RG + 9 + ext);
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      out.push({ x: cx + (c - (cols - 1) / 2) * PITCH, y: cy + (r - (rows - 1) / 2) * PITCH });
    }
    return out;
  }

  // ───────── 步驟 ─────────
  const GATE_X = 315, SGATE = L.sx(GATE_X), SX_LOAD = SL0 + FL / 2;
  const STEPS = [
    { key: 'volt', dur: 8, b: ['電壓', 'Voltage'],
      cap: ['6 V：每 1 C 帶 6 J', '6 V: each 1 C carries 6 J'],
      res: ['電壓決定每 1 C 的能量：6 V → 每 1 C 帶 6 J。', 'Voltage sets the energy per 1 C: 6 V → 6 J for each 1 C.'] },
    { key: 'curr', dur: 7, b: ['電流', 'Current'], phi: SGATE - VS * 1.25, win: [1, 4],
      cap: ['2 A：每秒通過 2 C', '2 A: 2 C pass each second'],
      res: ['電流決定每秒通過的電量：2 A → 每秒通過 2 C（Q = It）。', 'Current sets the charge passing each second: 2 A → 2 C per second (Q = It).'] },
    { key: 'time', dur: 7, b: ['時間', 'Time'], phi: 0, win: [1, 6],
      cap: ['通電時間：計時 5 秒', 'Time: count 5 seconds'],
      res: ['時間決定累積多久：這裡取 5 秒。', 'Time sets how long it accumulates: 5 seconds here.'] },
    { key: 'all', dur: 9, b: ['合起來', 'Together'], phi: SX_LOAD - VS * 1.25, win: [1, 6],
      cap: ['每秒 2 C × 6 J＝12 J，5 秒共 60 J', '12 J each second, 60 J in 5 s'],
      res: ['E = QV = (It)V = IVt = 6 × 2 × 5 = 60 J。', 'E = QV = (It)V = IVt = 6 × 2 × 5 = 60 J.'] },
    { key: 'res', dur: 10, b: ['電阻吃多少', 'Resistors'],
      cap: ['串聯：大電阻轉換多；並聯：小電阻轉換多', 'Series: bigger R gets more; parallel: smaller R gets more'],
      res: ['串聯時電阻大的轉換較多電能；並聯時電阻小的轉換較多電能。',
        'In series the larger resistance transforms more energy; in parallel the smaller resistance transforms more energy.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // 計時窗內「第 j 次通過」的時刻＝win0＋0.25＋0.5j；回傳 tl 時已通過幾次（上限 2/秒 × 窗長）
  function passCount(st, tl) {
    const [a, b] = st.win, max = Math.round((b - a) * 2);
    if (tl < a + 0.25) return 0;
    return clamp(Math.floor((tl - a - 0.25) / 0.5) + 1, 0, max);
  }
  const passTime = (st, j) => st.win[0] + 0.25 + 0.5 * j;
  const clock = (st, tl) => clamp(tl - st.win[0], 0, st.win[1] - st.win[0]);

  // ───────── 繪圖小件 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function wirePath(ctx, pts, color, w, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function square(ctx, x, y, alpha, size) {
    const s = size || SQ;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  }
  function slotOutline(ctx, x, y, size, alpha) {
    const s = size || SQ;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.energy; ctx.lineWidth = 1.5;
    rrect(ctx, x - s / 2, y - s / 2, s, s, 3); ctx.stroke(); ctx.restore();
  }
  function ball(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function groupIcon(ctx, x, y, r, alpha) {     // 1 C：虛線圈＋4 顆電子
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = 'rgba(77,210,255,0.13)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = K.electron; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.restore();
    const d = r * 0.33, br = r * 0.25;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => ball(ctx, x + a * d, y + b * d, br, alpha));
  }
  function ringOutline(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.electron; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }

  function drawWires(ctx) {
    wirePath(ctx, [{ x: L.LX, y: L.pinB }, { x: L.LX, y: L.BOT }, { x: L.RX, y: L.BOT }, { x: L.RX, y: L.bulbB }], K.wire, 5, 1);
    wirePath(ctx, [{ x: L.RX, y: L.bulbT }, { x: L.RX, y: L.TOP }, { x: L.LX, y: L.TOP }, { x: L.LX, y: L.pinT }], K.wire, 5, 1);
  }
  function drawBattery(ctx, glow) {
    const x = L.LX - L.batW / 2, y = L.pinT;
    if (glow > 0) {
      ctx.save(); ctx.globalAlpha = 0.55 * glow; ctx.shadowColor = K.energy; ctx.shadowBlur = 24;
      ctx.strokeStyle = K.energy; ctx.lineWidth = 4; rrect(ctx, x - 5, y - 5, L.batW + 10, L.batH + 10, 14); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = '#17392f'; ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    rrect(ctx, x, y, L.batW, L.batH, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K.pos; ctx.fillRect(x + 11, y + 10, L.batW - 22, 8);
    ctx.fillStyle = K.electron; ctx.fillRect(x + 11, y + L.batH - 18, L.batW - 22, 8);
    ctx.fillStyle = K.wire; [L.pinT, L.pinB].forEach(py => { ctx.beginPath(); ctx.arc(L.LX, py, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
    text(ctx, '+', L.LX, y + 40, K.pos, 26);
    text(ctx, '−', L.LX, y + L.batH - 40, K.electron, 26);
  }
  function drawBulb(ctx, g) {
    const cx = L.RX, cy = L.MID, R = L.R;
    if (g > 0.01) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.4);
      gr.addColorStop(0, `rgba(255,244,190,${0.55 * g})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,170,${0.85 * g})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + Math.PI / 8, r0 = R + 10, r1 = R + 10 + 14 * g;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, L.bulbB); ctx.lineTo(cx, cy + R); ctx.moveTo(cx, L.bulbT); ctx.lineTo(cx, cy - R); ctx.stroke();
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
    ctx.fillStyle = K.wire; [L.bulbT, L.bulbB].forEach(py => { ctx.beginPath(); ctx.arc(cx, py, 5, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function circuitLabels(ctx) {
    const sV = '6 V', xr = L.LX - L.batW / 2 - 12;
    fitText(ctx, sV, xr, L.MID, K.cyan, 26, xr - 8, 'right');
    const sB = tr('燈泡', 'Bulb'), xb = L.RX + L.R + 12;
    fitText(ctx, sB, xb, L.MID, K.white, 24, 600 - xb, 'left');
  }
  const groupHidden = p => p.inBat && p.sm > L.Lpath + RG && p.sm < L.Lc - RG;

  // ───────── 第 1 步：單一群 1 C ─────────
  const ONE = { keys: [[0, -70], [0.9, L.sLoad], [3.6, L.sLoad], [5.0, L.sPark], [6.3, L.sPark], [7.6, L.sAbove]],
    load: 1.0, dtL: 0.35, unload: 5.1, dtU: 0.15, n: 6 };
  function sOne(tl) {
    const k = ONE.keys;
    if (tl <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (tl <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((tl - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
    return k[k.length - 1][1];
  }
  const oneT = i => ({ sL: ONE.load + i * ONE.dtL, aL: ONE.load + i * ONE.dtL + FLY, sU: ONE.unload + i * ONE.dtU, aU: ONE.unload + i * ONE.dtU + FLY });
  const oneLoaded = tl => { let n = 0; for (let i = 0; i < ONE.n; i++) if (tl >= oneT(i).aL) n++; return n; };
  function oneGlow(tl) {
    let g = 0;
    for (let i = 0; i < ONE.n; i++) {
      const q = oneT(i);
      if (tl >= q.aU) g += 0.2 * Math.exp(-(tl - q.aU) / 2.2);
      else if (tl >= q.sU) g += 0.1 * (tl - q.sU) / FLY;
    }
    return clamp(g, 0, 1);
  }
  function drawOne(ctx, tl, phase) {
    const s = sOne(tl), p = posAt(s), sl = slots(s, ONE.n);
    if (phase === 'body') {
      if (!groupHidden(p)) groupIcon(ctx, p.x, p.y, RG, 1);
      sl.forEach((q, i) => { const m = oneT(i); if (tl >= m.aL && tl < m.sU) square(ctx, q.x, q.y, 1); });
    } else if (phase === 'fly') {
      sl.forEach((q, i) => {
        const m = oneT(i);
        if (tl >= m.sL && tl < m.aL) {
          const k = ease((tl - m.sL) / FLY);
          square(ctx, lerp(L.LX + 8, q.x, k), lerp(L.MID, q.y, k), clamp(k * 3, 0, 1), SQ * lerp(0.6, 1, k));
        } else if (tl >= m.sU && tl < m.aU) {
          const k = ease((tl - m.sU) / FLY);
          square(ctx, lerp(q.x, L.RX, k), lerp(q.y, L.MID, k), 1 - k * 0.85, SQ * lerp(1, 0.5, k));
        }
      });
    } else if (phase === 'label') {
      if (p.inBat || p.sm < RG * 0.6 || p.sm > L.Lpath - RG * 0.6) return;
      if (Math.abs(p.x - L.RX) < 1 && p.y > L.bulbT - RG && p.y < L.bulbB + RG) return;
      const n = normalAt(s), hw = textW(ctx, '1 C', 22) / 2;
      const off = RG + 8 + Math.abs(n.x) * hw + Math.abs(n.y) * 12;
      text(ctx, '1 C', p.x - n.x * off, p.y - n.y * off, K.white, 22);
    }
  }

  // ───────── 第 2～4 步：穩定電流（一串 1 C） ─────────
  function streamS(st, tl) {
    const base = VS * tl + st.phi, out = [];
    const kmin = Math.ceil((base - (L.Lpath + RG)) / D), kmax = Math.floor((base + RG + 2) / D);
    for (let k = kmin; k <= kmax; k++) out.push(base - k * D);
    return out;
  }
  function drawStream(ctx, st, tl, phase) {
    streamS(st, tl).forEach(s => {
      const p = posAt(s);
      const kl = (s - SL0) / FL, ku = (s - L.sU) / FU;
      const sl = (kl > 0 && ku < 1) ? slots(s, 6) : null;
      if (phase === 'body') {
        if (!groupHidden(p)) groupIcon(ctx, p.x, p.y, RG, 1);
        if (sl && kl >= 1 && ku <= 0) sl.forEach(q => square(ctx, q.x, q.y, 1));
      } else if (sl) {
        if (kl < 1) {
          sl.forEach((q, i) => {
            const kk = ease(clamp(kl * 1.6 - i * 0.12, 0, 1));
            if (kk > 0) square(ctx, lerp(L.LX + 8, q.x, kk), lerp(L.MID + 20, q.y, kk), clamp(kk * 3, 0, 1), SQ * lerp(0.6, 1, kk));
          });
        } else if (ku > 0) {
          sl.forEach((q, i) => {
            const kk = ease(clamp(ku * 1.5 - i * 0.08, 0, 1));
            square(ctx, lerp(q.x, L.RX, kk), lerp(q.y, L.MID, kk), 1 - kk * 0.85, SQ * lerp(1, 0.5, kk));
          });
        }
      }
    });
  }
  // 距離上一次「s 經過 x」多少秒（穩定電流每 D 一次）
  const sinceCross = (st, tl, x) => mod(VS * tl + st.phi - x, D) / VS;
  const streamGlow = (st, tl) => 0.62 + 0.3 * Math.exp(-sinceCross(st, tl, L.sU + FU * 0.6) / 0.22);
  const streamBat = (st, tl) => 0.35 + 0.45 * Math.exp(-sinceCross(st, tl, SL0) / 0.18);

  function drawGate(ctx, st, tl) {
    const on = tl >= st.win[0] && tl <= st.win[1] + 0.3;
    const flash = on ? Math.exp(-sinceCross(st, tl, SGATE) / 0.18) : 0;
    ctx.save(); ctx.strokeStyle = K.cyan; ctx.lineWidth = 3 + 2 * flash; ctx.setLineDash([7, 6]);
    ctx.globalAlpha = 0.65 + 0.35 * flash; ctx.shadowColor = K.cyan; ctx.shadowBlur = 14 * flash;
    ctx.beginPath(); ctx.moveTo(GATE_X, L.BOT - 34); ctx.lineTo(GATE_X, L.BOT + 34); ctx.stroke(); ctx.restore();
    fitText(ctx, tr('計數點', 'Count here'), GATE_X, L.BOT + 52, K.cyan, 22, 200, 'center');
  }
  function loopTimer(ctx, st, tl) {
    const c = clock(st, tl), on = tl >= st.win[0];
    text(ctx, `t = ${fmt1(c)} s`, L.CX, L.MID, on ? K.white : K.muted, 30);
  }

  // ───────── 右側面板 ─────────
  const appear = (tl, t0) => clamp((tl - t0) / 0.4, 0, 1);
  const PW = 360;   // 面板可用寬度
  function panelVolt(ctx, tl) {
    const n = oneLoaded(tl);
    fitText(ctx, 'V = 6 V', PX, 110, K.cyan, 36, PW, 'center', appear(tl, 0.2));
    const a = appear(tl, 0.5);
    if (a > 0) {
      const sw = 6 * 22, lab = '1 C', lw = textW(ctx, lab, 24);
      const tot = 2 * RG + 8 + lw + 16 + 34 + 16 + sw;
      let x = PX - tot / 2;
      groupIcon(ctx, x + RG, 200, RG, a); x += 2 * RG + 8;
      text(ctx, lab, x, 200, K.white, 24, 'left', a); x += lw + 16;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x + 34, 200); ctx.moveTo(x + 26, 193); ctx.lineTo(x + 34, 200); ctx.lineTo(x + 26, 207); ctx.stroke(); ctx.restore();
      x += 34 + 16;
      for (let i = 0; i < 6; i++) {
        const cx = x + 11 + i * 22;
        if (i < n) square(ctx, cx, 200, a, 16); else slotOutline(ctx, cx, 200, 16, 0.35 * a);
      }
    }
    const s = tr(`每 1 C 帶 ${n} J`, `${n} J for each 1 C`);
    fitText(ctx, s, PX, 268, K.yellow, 28, PW, 'center', appear(tl, 0.7));
    if (tl >= 6.4) fitText(ctx, tr('6 J 在燈泡用掉', '6 J used in the bulb'), PX, 330, K.white, 24, PW, 'center', appear(tl, 6.4));
  }
  function panelCurr(ctx, st, tl) {
    const q = passCount(st, tl);
    fitText(ctx, 'I = 2 A', PX, 100, K.current, 34, PW, 'center', appear(tl, 0.2));
    fitText(ctx, `Q = ${q} C`, PX, 150, K.electron, 30, PW, 'center', appear(tl, 0.5));
    const base = 362, rowH = 50, xr = [PX - 22, PX + 22];
    for (let r = 0; r < 3; r++) {
      const y = base - r * rowH - rowH / 2;
      const lab = `${r + 1} s`, done = q >= 2 * (r + 1);
      text(ctx, lab, PX - 56, y, q > 2 * r ? K.white : K.muted, 22, 'right', appear(tl, 0.5));
      xr.forEach((x, c) => {
        const j = 2 * r + c;
        if (j < q) { const k = clamp((tl - passTime(st, j)) / 0.25, 0, 1); groupIcon(ctx, x, y, 15 * lerp(0.6, 1, k), k); }
        else ringOutline(ctx, x, y, 15, 0.35 * appear(tl, 0.5));
      });
      if (done) text(ctx, '+2 C', PX + 56, y, K.electron, 22, 'left', clamp((tl - passTime(st, 2 * r + 1)) / 0.3, 0, 1));
    }
    fitText(ctx, tr('每秒通過 2 C', '2 C pass each second'), PX, 408, K.white, 24, PW, 'center', appear(tl, 2.4));
    fitText(ctx, 'Q = It = 2 × 3 = 6 C', PX, 455, K.green, 26, PW, 'center', appear(tl, st.win[1] + 0.2));
  }
  function panelTime(ctx, st, tl) {
    const c = clock(st, tl), T = st.win[1] - st.win[0], cy = 285, R = 92;
    fitText(ctx, tr('通電時間 t', 'Time t'), PX, 100, K.white, 26, PW, 'center', appear(tl, 0.2));
    ctx.save();
    ctx.fillStyle = 'rgba(85,233,255,0.08)'; ctx.strokeStyle = K.white; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(PX, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    if (c > 0) {
      ctx.fillStyle = 'rgba(85,233,255,0.28)';
      ctx.beginPath(); ctx.moveTo(PX, cy); ctx.arc(PX, cy, R - 4, -Math.PI / 2, -Math.PI / 2 + TAU * c / T); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    for (let i = 0; i < T; i++) {
      const a = -Math.PI / 2 + TAU * i / T;
      ctx.beginPath(); ctx.moveTo(PX + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14)); ctx.lineTo(PX + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2)); ctx.stroke();
    }
    const ah = -Math.PI / 2 + TAU * c / T;
    ctx.strokeStyle = K.cyan; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(PX, cy); ctx.lineTo(PX + Math.cos(ah) * (R - 18), cy + Math.sin(ah) * (R - 18)); ctx.stroke();
    ctx.restore();
    for (let i = 1; i <= T; i++) {
      const a = -Math.PI / 2 + TAU * i / T;
      text(ctx, String(i), PX + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22), c >= i - 1e-6 ? K.cyan : K.muted, 22);
    }
    // 讀數放在碼錶下方（放圈內會被指針劃過）
    text(ctx, `${fmt1(c)} s`, PX, 420, K.white, 30);
    fitText(ctx, 't = 5 s', PX, 468, K.green, 32, PW, 'center', appear(tl, st.win[1] + 0.1));
  }
  function panelAll(ctx, st, tl) {
    const rows = passCount(st, tl), e = rows * 6;
    fitText(ctx, tr('電池輸出的電能', 'Energy from the battery'), PX, 92, K.white, 24, PW, 'center', appear(tl, 0.2));
    fitText(ctx, `E = ${e} J`, PX, 135, K.yellow, 34, PW, 'center', appear(tl, 0.3));
    const pitch = 18, gx0 = PX - 3 * pitch, base = 398, pairH = 44;
    const a0 = appear(tl, 0.4);
    for (let p = 0; p < 5; p++) {
      const yb = base - p * pairH;
      const filled = rows > 2 * p, done = rows >= 2 * p + 2;
      text(ctx, `${p + 1} s`, gx0 - 14, yb - pitch, filled ? K.white : K.muted, 22, 'right', a0);
      for (let r = 0; r < 2; r++) {
        const j = 2 * p + r, y = yb - r * pitch - pitch / 2;
        const k = j < rows ? clamp((tl - passTime(st, j)) / 0.3, 0, 1) : 0;
        for (let c = 0; c < 6; c++) {
          const x = gx0 + c * pitch + pitch / 2;
          if (k > 0) square(ctx, x, y, k, SQ * lerp(0.5, 1, k)); else slotOutline(ctx, x, y, SQ, 0.28 * a0);
        }
      }
      if (done) text(ctx, '+12 J', gx0 + 6 * pitch + 14, yb - pitch, K.yellow, 22, 'left', clamp((tl - passTime(st, 2 * p + 1)) / 0.3, 0, 1));
    }
    fitText(ctx, tr('每秒 2 C × 6 J = 12 J', '2 C × 6 J = 12 J each second'), PX, 434, K.white, 24, PW, 'center', appear(tl, 0.6));
    fitText(ctx, 'E = IVt = 6 × 2 × 5 = 60 J', PX, 476, K.green, 26, PW, 'center', appear(tl, st.win[1] + 0.3));
  }

  // ───────── 第 5 步：串聯／並聯柱狀對照（1 格＝20 J） ─────────
  const SER = { cx: 250, head: ['串聯：20 V、2 A、通電 10 s', 'Series: 20 V, 2 A, 10 s'],
    rule: ['串聯找共同電流 E = I²Rt', 'Series: common I → E = I²Rt'],
    bars: [{ r: '4 Ω', j: 160 }, { r: '6 Ω', j: 240 }], t0: 0.9, tot: 400 };
  const PAR = { cx: 750, head: ['並聯：12 V、通電 5 s', 'Parallel: 12 V, 5 s'],
    rule: ['並聯找共同電壓 E = V²t／R', 'Parallel: common V → E = V²t/R'],
    bars: [{ r: '6 Ω', j: 120 }, { r: '3 Ω', j: 240 }], t0: 4.6, tot: 360 };
  const BP = 32, BS = 26, BASE = 438, DT_SQ = 0.2;
  function zigzag(ctx, x, y, w, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.white; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, y); ctx.lineTo(x - w / 2, y);
    const n = 6;
    for (let i = 0; i < n; i++) ctx.lineTo(x - w / 2 + (i + 0.5) * w / n, y + (i % 2 ? 8 : -8));
    ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2 + 8, y); ctx.stroke(); ctx.restore();
  }
  function barGroup(ctx, G, tl) {
    const a = appear(tl, G.t0 - 0.5);
    fitText(ctx, tr(G.head[0], G.head[1]), G.cx, 100, K.white, 26, 450, 'center', a);
    fitText(ctx, tr(G.rule[0], G.rule[1]), G.cx, 140, K.green, 26, 450, 'center', a);
    const big = G.bars[0].j > G.bars[1].j ? 0 : 1;
    let allDone = 0;
    G.bars.forEach((b, bi) => {
      const x = G.cx + (bi ? 80 : -80), n = b.j / 20;
      const got = clamp(Math.floor((tl - G.t0) / DT_SQ) + 1, 0, n);
      const rows = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / 2), c = i % 2;
        const sx = x + (c ? BP / 2 : -BP / 2), sy = BASE - r * BP - BP / 2;
        if (i < got) { const k = clamp((tl - G.t0 - i * DT_SQ) / 0.2, 0, 1); square(ctx, sx, sy, k, BS * lerp(0.5, 1, k)); }
      }
      if (got > 0) {
        const topY = BASE - Math.ceil(got / 2) * BP;
        text(ctx, `${got * 20} J`, x, topY - 20, K.yellow, 24, 'center', a);
      }
      if (got >= n) allDone++;
      // 「轉換較多」的那一根：外框亮起
      const hk = appear(tl, G.t0 + 12 * DT_SQ + 1.0);
      if (bi === big && hk > 0) {
        ctx.save(); ctx.globalAlpha = hk; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.shadowColor = K.yellow; ctx.shadowBlur = 16;
        rrect(ctx, x - BP - 6, BASE - rows * BP - 6, 2 * BP + 12, rows * BP + 12, 8); ctx.stroke(); ctx.restore();
      }
      zigzag(ctx, x - 26, BASE + 26, 34, a);
      text(ctx, b.r, x + 4, BASE + 26, K.white, 24, 'left', a);
    });
    // 底線
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(G.cx - 160, BASE + 4); ctx.lineTo(G.cx + 160, BASE + 4); ctx.stroke(); ctx.restore();
    const ta = allDone === 2 ? appear(tl, G.t0 + 12 * DT_SQ + 0.4) : 0;
    if (ta > 0) fitText(ctx, tr(`總共 ${G.tot} J`, `Total ${G.tot} J`), G.cx, 494, K.yellow, 28, 450, 'center', ta);
  }
  function drawResistors(ctx, tl) {
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(W / 2, 82); ctx.lineTo(W / 2, 512); ctx.stroke(); ctx.restore();
    barGroup(ctx, SER, tl); barGroup(ctx, PAR, tl);
  }

  // ───────── 圖例 ─────────
  function drawLegend(ctx, i) {
    const items = i === 4
      ? [[tr('藍方塊＝能量，1 格＝20 J', 'Blue square = energy, 1 square = 20 J'), 's']]
      : [[tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −'), 'e'],
        [tr('藍方塊＝1 J 能量（教學符號）', 'Blue square = 1 J of energy (symbol)'), 's'],
        [tr('虛線圈＝1 C 電荷', 'Dashed ring = 1 C of charge'), 'g']];
    const z = 22, gapIcon = 28, gapItem = 36, maxW = W - 60;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const rows = []; let cur = [], cw = 0;
    items.forEach((it, k) => {
      const add = (cur.length ? gapItem : 0) + wid[k];
      if (cur.length && cw + add > maxW) { rows.push(cur); cur = []; cw = 0; }
      cur.push(k); cw += (cur.length > 1 ? gapItem : 0) + wid[k];
    });
    rows.push(cur);
    const ys = rows.length === 1 ? [560] : [546, 578];
    rows.forEach((row, r) => {
      const tot = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'e') ball(ctx, x + 9, y, 7, 1);
        else if (kind === 's') square(ctx, x + 9, y, 1);
        else groupIcon(ctx, x + 10, y, 12, 1);
        text(ctx, s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 24);
    const y0 = ls.length > 1 ? 50 : 54;          // 畫布最上方 0～30px 留給進度條
    ls.forEach((l, i) => text(ctx, l, W / 2, y0 + i * 30, K.yellow, 24));
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = K.bg; STARTS.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }

  function drawScene(ctx, i, tl) {
    const st = STEPS[i];
    if (st.key === 'res') { drawResistors(ctx, tl); drawLegend(ctx, i); return; }
    drawWires(ctx);
    if (st.key === 'volt') {
      drawOne(ctx, tl, 'body');                              // 電荷在元件之前
      drawBattery(ctx, tl >= ONE.load - 0.1 && tl <= ONE.load + 5 * ONE.dtL + FLY + 0.15 ? 0.6 + 0.4 * Math.sin(tl * 7) ** 2 : 0);
      drawBulb(ctx, oneGlow(tl));
      drawOne(ctx, tl, 'fly');
      circuitLabels(ctx);
      drawOne(ctx, tl, 'label');
      panelVolt(ctx, tl);
    } else {
      drawStream(ctx, st, tl, 'body');
      drawBattery(ctx, streamBat(st, tl));
      drawBulb(ctx, streamGlow(st, tl));
      drawStream(ctx, st, tl, 'fly');
      circuitLabels(ctx);
      if (st.key === 'curr') { drawGate(ctx, st, tl); loopTimer(ctx, st, tl); panelCurr(ctx, st, tl); }
      else if (st.key === 'time') panelTime(ctx, st, tl);
      else { loopTimer(ctx, st, tl); panelAll(ctx, st, tl); }
    }
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('energyAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('energyAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-energy');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-energy'); if (!row) return;
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

  window.EpAnim.energy = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-energy'); if (row) row.innerHTML = '';
      const r = document.getElementById('energyAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { energy: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'energy' : null, t: S.t, step: S.step, running: !!S.raf } }
  };
})();
