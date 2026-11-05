/* electric_energy_power_1_voltage_1105_v1.js — 「電壓與能量」分頁動畫（#voltageAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.EpAnim.voltage = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'voltage'。畫布不綁任何事件；唯一控制是 #steps-voltage 裡的 5 個步驟鈕；結果框 #voltageAnimResult。
 * 只依賴頁面的 tr()；其餘常數與小工具都在本 IIFE 內（不用、不覆蓋舊程式的 C、clear、line、label…）。
 * 畫面是「場景時間 t 的純函式」，跳步、重播、換語言都和真的播到那裡一模一樣。
 *
 * ── 教學符號 ────────────────────────────────────────────────────────
 *   「1 C」＝一個藍色虛線圈裡放 4 顆藍球（電子），代表一大群電荷；圈外寫「1 C」。
 *   能量＝藍色小方塊，1 格＝1 J（1.5 J＝1 格＋半格）。方塊貼在電荷群的「迴路內側」。
 *   電壓一律講成「每 1 C 帶多少 J」，不畫水位、高度。
 *
 * ── 電路（單迴路；第 3 步是兩個迴路並排，版面另算）──────────────────────
 *   電池在左邊直立導線上（+ 在上、− 在下），燈泡在右邊直立導線正中央。
 *   電荷群從電池負極出發：往下 → 下導線往右 → 右導線往上穿過燈泡 → 上導線往左 → 回正極，
 *   在電池內部由上往下走回負極（被電池蓋住）。路徑參數 s：0＝負極接腳，Lpath＝正極接腳，
 *   Lc＝Lpath＋電池高度（s 取 mod Lc，所以 s<0 就是「還在電池裡、快從負極出來」）。
 *   裝能量：電荷群停在負極外，方塊從電池中心一格一格飛到電荷旁。
 *   用能量：電荷群停在燈泡下接腳外，方塊一格一格飛進燈泡中心（元件座標）後消失，燈泡依收到的 J 變亮。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 電荷繞一圈  8 s  1 C 帶 6 格出發 → 在燈泡放下 → 空手回到正極；走過的路徑留下淡藍軌跡
 *   2 電池給能量  8 s  1.5 V：電池給 1 C 一格＋半格（1.5 J）；中間讀數「每 1 C 帶 1.5 J」「1 V = 1 J / 1 C」
 *   3 電壓越大    8 s  1.5 V 與 9 V 兩個迴路並排，同時裝能量：1.5 格對 9 格，一起走到下導線中間停住
 *   4 電量也算    9 s  6 V：兩群 1 C 依序各裝 6 格；讀數 Q、E 跟著加；最後「E = QV = 2 × 6 = 12 J」
 *   5 在燈泡用完 10 s  6 V：1 C 帶 6 J 到燈泡放光（能量 6 → 0 J、電荷仍是 1 C）→ 回電池 → 再裝 6 J
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解用），到底時呼叫一次 EpAnim.ctl.onEnd。
 * EpAnim.ctl.paused 為真時時間凍住。
 *
 * 進度條：render() 畫完場景後呼叫共用的 window.AnimBar.draw（assets/anim_progress_bar_1105_v1.js，畫布頂端 y=8～24）；
 *   沒載入時退回細線備援。畫布最上方 0～30px 不放其他內容。
 * 字級：畫布文字 22–36px（說明 24、標籤 22–26、電壓大字 36），Noto Sans TC 900；寫字前一律 measureText。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', cyan: '#55e9ff', green: '#4ade80',
    orange: '#fb923c', pink: '#f472b6', muted: '#9fb3aa', wire: '#9fb3aa',
    electron: '#4dd2ff', pos: '#ff8040', energy: '#4dd2ff', panel: '#123029'
  };
  const RG = 22;           // 電荷群（1 C）虛線圈半徑
  const SQ = 13, PITCH = 17;   // 能量方塊邊長、格距
  const FLY = 0.38;        // 方塊飛行時間
  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const font = s => `900 ${s}px ${FONT}`;
  const fmt = x => (Math.round(x * 10) / 10).toString();

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
  // 依序試：想要的字級 → 縮到 22（最小 22，不再縮）
  function fitSize(ctx, s, maxW, want) {
    for (let z = want; z >= 22; z -= 2) if (textW(ctx, s, z) <= maxW) return z;
    return 22;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }

  // ───────── 迴路版面 ─────────
  function mkLoop(o) {
    const L = Object.assign({}, o);
    L.pinT = L.MID - L.batH / 2; L.pinB = L.MID + L.batH / 2;
    L.bulbT = L.MID - L.R - 8; L.bulbB = L.MID + L.R + 8;
    L.P = [{ x: L.LX, y: L.pinB }, { x: L.LX, y: L.BOT }, { x: L.RX, y: L.BOT }, { x: L.RX, y: L.bulbB },
      { x: L.RX, y: L.bulbT }, { x: L.RX, y: L.TOP }, { x: L.LX, y: L.TOP }, { x: L.LX, y: L.pinT }];
    L.Lpath = polyLen(L.P); L.Lc = L.Lpath + L.batH;
    L.sBottom = L.BOT - L.pinB;                                 // 走到左下角
    L.sRight = L.sBottom + (L.RX - L.LX);                       // 走到右下角
    L.sPark = L.sRight + (L.BOT - (L.bulbB + RG + 14));          // 燈泡下接腳外停住
    L.sLoad = RG + 14;                                          // 負極外停住裝能量
    L.sx = x => L.sBottom + (x - L.LX);                         // 下導線上 x 處的 s
    return L;
  }
  function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
  function atPoly(P, s) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (s <= d || i === P.length - 1) { const k = d ? clamp(s / d, 0, 1) : 0; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
      s -= d;
    }
    return { x: P[0].x, y: P[0].y };
  }
  // 位置：s mod Lc；Lpath 之後在電池內部由正極往下走到負極
  function posAt(L, s) {
    const sm = ((s % L.Lc) + L.Lc) % L.Lc;
    if (sm <= L.Lpath) return Object.assign(atPoly(L.P, sm), { sm, inBat: false });
    return { x: L.LX, y: L.pinT + (sm - L.Lpath), sm, inBat: true };
  }
  // 迴路內側法線（前後各取 18px 平滑，轉角處不會跳）
  function normalAt(L, s) {
    const sm = ((s % L.Lc) + L.Lc) % L.Lc;
    if (sm > L.Lpath) return { x: 1, y: 0 };
    const a = atPoly(L.P, clamp(sm - 18, 0, L.Lpath)), b = atPoly(L.P, clamp(sm + 18, 0, L.Lpath));
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let nx = dy, ny = -dx; const m = Math.hypot(nx, ny) || 1;
    return { x: nx / m, y: ny / m };
  }

  const ONE = mkLoop({ LX: 170, RX: 830, TOP: 120, BOT: 470, MID: 295, batW: 70, batH: 140, R: 42 });
  const PAIR = [
    mkLoop({ LX: 95, RX: 445, TOP: 150, BOT: 450, MID: 300, batW: 60, batH: 120, R: 36 }),
    mkLoop({ LX: 555, RX: 905, TOP: 150, BOT: 450, MID: 300, batW: 60, batH: 120, R: 36 })
  ];

  // ───────── 步驟 ─────────
  // group: { loop, J, keys:[[t,s]...], batches:[{ load, dtL, unload?, dtU? }] }
  const STEPS = [
    { dur: 8, b: ['電荷繞一圈', 'Loop'], loops: [ONE], batLabel: [['電池', 'Battery']], bulbLabel: true, trail: true,
      cap: ['電荷從電池出發，帶著能量繞一圈', 'Charges carry energy around the circuit'],
      res: ['電荷從電池出發，繞電路一圈；能量是被電荷「帶著走」的。',
        'Charges leave the battery and go around the circuit; energy is carried along by the charges.'],
      groups: [{ loop: 0, J: 6,
        keys: [[0, ONE.sLoad], [2.0, ONE.sLoad], [3.5, ONE.sPark], [5.0, ONE.sPark], [7.4, ONE.Lpath - RG - 6]],
        batches: [{ load: 0.5, dtL: 0.22, unload: 3.6, dtU: 0.2 }] }] },
    { dur: 8, b: ['電池給能量', 'Battery'], loops: [ONE], batLabel: [['1.5 V', '1.5 V']], bulbLabel: true, volt: [1.5],
      cap: ['1.5 V：每 1 C 帶走 1.5 J', '1.5 V: each 1 C carries 1.5 J'],
      res: ['電池給每 1 C 的電荷 1.5 J 的能量，這就是 1.5 V（1 V = 1 J／1 C）。',
        'The battery gives each 1 C of charge 1.5 J of energy: that is 1.5 V (1 V = 1 J / 1 C).'],
      groups: [{ loop: 0, J: 1.5,
        keys: [[0, ONE.sLoad], [2.6, ONE.sLoad], [5.0, ONE.sx(420)]],
        batches: [{ load: 0.8, dtL: 0.6 }] }] },
    { dur: 8, b: ['電壓越大', 'Higher V'], loops: PAIR, batLabel: [null, null], bulbLabel: false, volt: [1.5, 9],
      cap: ['電壓越大，每 1 C 帶的能量越多', 'Higher voltage: more energy for each 1 C'],
      res: ['電壓越大，每 1 C 的電荷帶走的能量越多。', 'The higher the voltage, the more energy each 1 C of charge carries.'],
      groups: [0, 1].map(k => ({ loop: k, J: k ? 9 : 1.5,
        keys: [[0, PAIR[k].sLoad], [3.3, PAIR[k].sLoad], [5.6, PAIR[k].sx((PAIR[k].LX + PAIR[k].RX) / 2)]],
        batches: [{ load: 0.6, dtL: 0.25 }] })) },
    { dur: 9, b: ['電量也算', 'Charge'], loops: [ONE], batLabel: [['6 V', '6 V']], bulbLabel: true, volt: [6],
      cap: ['2 C 各帶 6 J，共 12 J', '2 C carry 6 J each: 12 J in total'],
      res: ['6 V 給每 1 C 6 J；2 C 共得到 12 J，所以 E = QV。', '6 V gives each 1 C 6 J; 2 C gain 12 J in total, so E = QV.'],
      groups: [
        { loop: 0, J: 6, keys: [[0, ONE.sLoad], [2.1, ONE.sLoad], [3.6, ONE.sx(600)]],
          batches: [{ load: 0.4, dtL: 0.22 }] },
        { loop: 0, J: 6, keys: [[0, -60], [2.7, -60], [3.2, ONE.sLoad], [4.9, ONE.sLoad], [6.3, ONE.sx(370)]],
          batches: [{ load: 3.3, dtL: 0.22 }] }] },
    { dur: 10, b: ['在燈泡用完', 'Used up'], loops: [ONE], batLabel: [['6 V', '6 V']], bulbLabel: true, volt: [6],
      cap: ['能量在燈泡用完，電荷回電池再拿', 'Energy is used in the bulb; charges go back for more'],
      res: ['能量在燈泡被用掉，電荷沒有被用掉，回到電池再拿新的能量。',
        'The energy is used up in the bulb, but the charges are not; they return for more energy.'],
      groups: [{ loop: 0, J: 6,
        keys: [[0, ONE.sLoad], [1.9, ONE.sLoad], [3.3, ONE.sPark], [4.85, ONE.sPark], [6.9, ONE.Lpath],
          [7.4, ONE.Lc + ONE.sLoad - 4], [7.5, ONE.Lc + ONE.sLoad]],
        batches: [{ load: 0.4, dtL: 0.2, unload: 3.4, dtU: 0.2 }, { load: 7.7, dtL: 0.2 }] }] }
  ];
  // 結果框英文第 5 步照規格原句
  STEPS[4].res[1] = 'The energy is used up in the bulb, but the charges are not; they return to the battery for more energy.';
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 時間 → 狀態 ─────────
  function sOf(g, t) {
    const k = g.keys;
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
    return k[k.length - 1][1];
  }
  const sizes = J => { const a = []; let r = J; while (r > 1e-6) { a.push(Math.min(1, r)); r -= 1; } return a; };
  // 每格方塊的四個時間點
  function sqTimes(b, i) {
    const sL = b.load + i * b.dtL, aL = sL + FLY;
    const sU = b.unload !== undefined ? b.unload + i * b.dtU : Infinity, aU = sU + FLY;
    return { sL, aL, sU, aU };
  }
  // 目前「拿在手上」的能量（已到手、尚未送進燈泡）
  function heldJ(g, t) {
    let e = 0; const sz = sizes(g.J);
    g.batches.forEach(b => sz.forEach((z, i) => { const q = sqTimes(b, i); if (t >= q.aL && t < q.aU) e += z; }));
    return e;
  }
  function loadedJ(g, t) {   // 從電池拿到的總量
    let e = 0; const sz = sizes(g.J);
    g.batches.forEach(b => sz.forEach((z, i) => { if (t >= sqTimes(b, i).aL) e += z; }));
    return e;
  }
  function bulbGlow(step, li, t) {
    let g = 0;
    step.groups.forEach(gr => {
      if (gr.loop !== li) return; const sz = sizes(gr.J);
      gr.batches.forEach(b => sz.forEach((z, i) => {
        const q = sqTimes(b, i);
        if (t >= q.aU) g += z * 0.24 * Math.exp(-(t - q.aU) / 1.8);
        else if (t >= q.sU) g += z * 0.24 * (t - q.sU) / FLY * 0.5;
      }));
    });
    return clamp(g, 0, 1);
  }
  function loading(step, li, t) {
    return step.groups.some(gr => gr.loop === li && gr.batches.some(b => {
      const n = sizes(gr.J).length; return t >= b.load - 0.1 && t <= b.load + (n - 1) * b.dtL + FLY + 0.15;
    }));
  }

  // 方塊格位（貼在迴路內側）
  function slots(L, s, J) {
    const p = posAt(L, s), n = normalAt(L, s), sz = sizes(J), cnt = sz.length;
    const cols = Math.min(3, cnt), rows = Math.ceil(cnt / cols);
    const gw = cols * PITCH, gh = rows * PITCH;
    const ext = Math.abs(n.x) * gw / 2 + Math.abs(n.y) * gh / 2;
    const cx = p.x + n.x * (RG + 9 + ext), cy = p.y + n.y * (RG + 9 + ext);
    return sz.map((z, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return { x: cx + (c - (cols - 1) / 2) * PITCH, y: cy + (r - (rows - 1) / 2) * PITCH, z };
    });
  }

  // ───────── 繪圖 ─────────
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function wirePath(ctx, pts, color, w, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function square(ctx, x, y, z, alpha, scale) {
    const s = SQ * (scale || 1), w = s * z;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = K.energy; ctx.shadowBlur = 10; ctx.fillStyle = K.energy;
    rrect(ctx, x - s / 2, y - s / 2, w, s, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
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

  function drawWires(ctx, L) {
    wirePath(ctx, [{ x: L.LX, y: L.pinB }, { x: L.LX, y: L.BOT }, { x: L.RX, y: L.BOT }, { x: L.RX, y: L.bulbB }], K.wire, 5, 1);
    wirePath(ctx, [{ x: L.RX, y: L.bulbT }, { x: L.RX, y: L.TOP }, { x: L.LX, y: L.TOP }, { x: L.LX, y: L.pinT }], K.wire, 5, 1);
  }
  function drawTrail(ctx, L, s) {
    const end = clamp(s, 0, L.Lpath); if (end < 2) return;
    const pts = [L.P[0]]; let acc = 0;
    for (let i = 1; i < L.P.length; i++) {
      const d = Math.hypot(L.P[i].x - L.P[i - 1].x, L.P[i].y - L.P[i - 1].y);
      if (acc + d >= end) { pts.push(atPoly(L.P, end)); break; }
      pts.push(L.P[i]); acc += d;
    }
    wirePath(ctx, pts, K.electron, 9, 0.28);
  }
  function drawBattery(ctx, L, glow) {
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
  function drawBulb(ctx, L, g) {
    const cx = L.RX, cy = L.MID, R = L.R;
    if (g > 0.01) {
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.6);
      gr.addColorStop(0, `rgba(255,244,190,${0.55 * g})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 2.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,170,${0.85 * g})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + Math.PI / 8, r0 = R + 10, r1 = R + 10 + 16 * g;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = K.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, L.bulbB); ctx.lineTo(cx, cy + R); ctx.moveTo(cx, L.bulbT); ctx.lineTo(cx, cy - R); ctx.stroke();
    ctx.fillStyle = g > 0.01 ? `rgba(${Math.round(lerp(22, 92, g))},${Math.round(lerp(58, 84, g))},${Math.round(lerp(49, 40, g))},1)` : '#163a31';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    // 支柱＋燈絲（暗橘 → 亮白黃）
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

  // 電荷群本體與「在手上」的方塊（元件之前畫）
  function drawGroup(ctx, L, g, t) {
    const s = sOf(g, t), p = posAt(L, s);
    if (p.inBat && p.sm > L.Lpath + RG && p.sm < L.Lc - RG) return;   // 整個在電池裡
    groupIcon(ctx, p.x, p.y, RG, 1);
    const sl = slots(L, s, g.J);
    g.batches.forEach(b => sl.forEach((q, i) => {
      const tm = sqTimes(b, i);
      if (t >= tm.aL && t < tm.sU) square(ctx, q.x, q.y, q.z, 1);
    }));
  }
  // 飛行中的方塊（元件之後畫，才看得到從電池飛出、飛進燈泡）
  function drawFlights(ctx, L, g, t) {
    const s = sOf(g, t), sl = slots(L, s, g.J);
    g.batches.forEach(b => sl.forEach((q, i) => {
      const tm = sqTimes(b, i);
      if (t >= tm.sL && t < tm.aL) {
        const k = ease((t - tm.sL) / FLY);
        square(ctx, lerp(L.LX + L.batW * 0.1, q.x, k), lerp(L.MID, q.y, k), q.z, clamp(k * 3, 0, 1), lerp(0.6, 1, k));
      } else if (t >= tm.sU && t < tm.aU) {
        const k = ease((t - tm.sU) / FLY);
        square(ctx, lerp(q.x, L.RX, k), lerp(q.y, L.MID, k), q.z, 1 - k * 0.85, lerp(1, 0.5, k));
      }
    }));
  }
  function groupLabel(ctx, L, g, t) {
    const s = sOf(g, t), p = posAt(L, s);
    if (p.inBat || p.sm < RG * 0.6 || p.sm > L.Lpath - RG * 0.6) return;
    if (Math.abs(p.x - L.RX) < 1 && p.y > L.bulbT - RG && p.y < L.bulbB + RG) return;   // 正在燈泡後面
    const n = normalAt(L, s), hw = textW(ctx, '1 C', 22) / 2;
    const off = RG + 8 + Math.abs(n.x) * hw + Math.abs(n.y) * 12;
    text(ctx, '1 C', p.x - n.x * off, p.y - n.y * off, K.white, 22);
  }

  function drawLoopLabels(ctx, st, li, L) {
    const lab = st.batLabel[li];
    if (lab) {
      const s = tr(lab[0], lab[1]), isV = /V$/.test(s);
      const maxW = L.LX - L.batW / 2 - 14 - 8;
      const z = fitSize(ctx, s, maxW, 26);
      text(ctx, s, L.LX - L.batW / 2 - 14, L.MID, isV ? K.cyan : K.white, z, 'right');
    }
    if (st.bulbLabel) {
      const s = tr('燈泡', 'Bulb'), x = L.RX + L.R + 14;
      text(ctx, s, x, L.MID, K.white, fitSize(ctx, s, W - 8 - x, 24), 'left');
    }
  }

  // 迴路中間的讀數（只放數字與單位式，說明句只有頂端那一句）
  function panelLines(ctx, lines, cx, maxW) {
    lines.forEach(([s, y, color, want, a]) => {
      if (!s || a <= 0) return;
      text(ctx, s, cx, y, color, fitSize(ctx, s, maxW, want), 'center', a);
    });
  }
  const appear = (tl, t0) => clamp((tl - t0) / 0.4, 0, 1);
  function perC(x) { return tr(`每 1 C 帶 ${fmt(x)} J`, `${fmt(x)} J for each 1 C`); }
  function drawPanel(ctx, i, st, tl) {
    if (i === 1) {
      const g = st.groups[0];
      panelLines(ctx, [
        ['1.5 V', 215, K.cyan, 36, appear(tl, 0.3)],
        [perC(loadedJ(g, tl)), 272, K.yellow, 26, appear(tl, 0.9)],
        ['1 V = 1 J / 1 C', 328, K.white, 26, appear(tl, 5.2)]
      ], 500, 400);
    } else if (i === 2) {
      st.groups.forEach((g, k) => {
        const L = PAIR[k], cx = (L.LX + L.RX) / 2;
        panelLines(ctx, [
          [`${fmt(g.J)} V`, 240, K.cyan, 36, appear(tl, 0.3)],
          [perC(loadedJ(g, tl)), 296, K.yellow, 24, appear(tl, 0.7)]
        ], cx, 230);
      });
    } else if (i === 3) {
      const e = st.groups.reduce((a, g) => a + loadedJ(g, tl), 0);
      const q = st.groups.filter(g => loadedJ(g, tl) > 0).length;
      panelLines(ctx, [
        [perC(6), 215, K.yellow, 26, appear(tl, 0.3)],
        [`Q = ${q} C${tr('，', ', ')}E = ${fmt(e)} J`, 270, K.white, 26, appear(tl, 0.6)],
        ['E = QV = 2 × 6 = 12 J', 326, K.green, 26, appear(tl, 6.5)]
      ], 500, 420);
    } else if (i === 4) {
      const g = st.groups[0];
      panelLines(ctx, [
        [tr('電荷：1 C', 'Charge: 1 C'), 240, K.electron, 26, appear(tl, 0.3)],
        [tr(`能量：${fmt(heldJ(g, tl))} J`, `Energy: ${fmt(heldJ(g, tl))} J`), 296, K.yellow, 26, appear(tl, 0.3)]
      ], 500, 400);
    }
  }

  function drawLegend(ctx) {
    const items = [
      [tr('藍球＝電子，從負極出發', 'Blue ball = electron, starts from −'), 'e'],
      [tr('藍方塊＝能量（教學符號）', 'Blue square = energy (symbol)'), 's'],
      [tr('虛線圈＝1 C 電荷', 'Dashed ring = 1 C of charge'), 'g']
    ];
    const z = 22, gapIcon = 28, gapItem = 36, maxW = W - 60;
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
        if (kind === 'e') ball(ctx, x + 9, y, 7, 1);
        else if (kind === 's') square(ctx, x + 9, y, 1, 1);
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
  // 進度條：用全站共用的 AnimBar（畫布內 y=8～24，分段＋播放頭）；沒載入時才退回細線備援
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = K.bg; STARTS.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }

  function drawScene(ctx, i, tl) {
    const st = STEPS[i];
    st.loops.forEach(L => drawWires(ctx, L));
    if (st.trail) st.groups.forEach(g => drawTrail(ctx, st.loops[g.loop], sOf(g, tl)));
    st.groups.forEach(g => drawGroup(ctx, st.loops[g.loop], g, tl));        // 電荷在元件之前
    st.loops.forEach((L, li) => {
      drawBattery(ctx, L, loading(st, li, tl) ? 0.6 + 0.4 * Math.sin(tl * 7) ** 2 : 0);
      drawBulb(ctx, L, bulbGlow(st, li, tl));
    });
    st.groups.forEach(g => drawFlights(ctx, st.loops[g.loop], g, tl));
    st.loops.forEach((L, li) => drawLoopLabels(ctx, st, li, L));
    st.groups.forEach(g => groupLabel(ctx, st.loops[g.loop], g, tl));
    drawPanel(ctx, i, st, tl);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('voltageAnimCanvas');
  const ctl = () => window.EpAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('voltageAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-voltage');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-voltage'); if (!row) return;
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

  window.EpAnim.voltage = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-voltage'); if (row) row.innerHTML = '';
      const r = document.getElementById('voltageAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { voltage: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'voltage' : null, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
