/* electrolysis_5_water_1107_v1.js — 「水也能被電拆開？」分頁動畫（#waterAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.ElAnim.water = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'water'。畫布不綁事件；唯一控制是 #steps-water 的 5 個步驟鈕；結果框 #waterAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（工具函式複製自 electrolysis_5_intro_1107_v1.js，畫法一致）。
 * 畫面是「場景時間 t 的純函式」：電子、離子、氣泡（固定雜湊種子，不用 Math.random）、集氣管水位、火柴與木條都只由 t 算出。
 *
 * ── 版面（第 1～3 步：裝置） ─────────────────────────────────────
 *   y≈58 本步標題（黃）。水槽 x 60–600，槽口 y=258、液面 y=280、槽底 y=456。
 *   兩支碳棒由槽底穿出（y 300–472）：負極端 x=190、正極端 x=470。
 *   碳棒上方各倒置一支集氣管（內寬 58，管內頂 y=100，管口 y=392），刻度 1 格＝40px：
 *     H₂ 收集 4 格 → 氣液界面 y=260；O₂ 收集 2 格 → y=180（兩者都在槽內液面 y=280 之上）。
 *   導線 y=496：電池（短粗＝負極 x=322、長細＝正極 x=338）在兩支碳棒中間的下方。
 *   右欄 x 640–980：本步重點；右欄底部（最後一行 y=540）：本步一句（黃）；y≈574：圖例。
 * ── 第 4 步：檢驗氣體（取出的兩支管）；第 5 步：粒子層級 2H₂O → 2H₂ + O₂（產物上 H₂、中 O₂、下 H₂） ──────────
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只在導線與碳棒裡：電池負極 → 負極端碳棒；正極端碳棒 → 導線 → 電池正極。從不進溶液。
 *   電解質以少量硫酸為例：橘膠囊 H⁺（往負極端）、紫膠囊 SO₄²⁻（往正極端），數量少、示意。
 *   氣泡＝空心圓：H₂ 外框淡黃 #ffe45c、O₂ 外框粉紅 #ff78b7（與實心離子膠囊以形狀＋標籤區分）。
 *   氣體量（格）＝全域時間 T 的線性函式，H₂ 產生速率固定是 O₂ 的 2 倍；第 3 步結束時正好 4 格：2 格。
 *   能量一律畫成電子藍方塊（第 5 步「電能 → 化學能」）。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 裝置      8 s  水槽＋少量電解質、碳棒、倒置集氣管（裝滿水）、電池；電子從電池負極出發（T=5.0 起），第 2 步一開始兩極開始冒泡（T=8.1）
 *   2 通電冒泡  9 s  兩極冒泡升進集氣管、把水往下擠；電子走導線、H⁺ 往負極端、SO₄²⁻ 往正極端
 *   3 體積比    9 s  H₂ 水位下降速度是 O₂ 的 2 倍；結束時 H₂ 4 格、O₂ 2 格；「H₂：O₂ ＝ 2：1」
 *   4 檢驗氣體  8 s  H₂ 管口靠近火柴：噗（可燃性）；O₂ 管放入帶火星的木條：復燃（助燃性）
 *   5 總反應    8 s  2 個 H₂O → 2 個 H₂ ＋ 1 個 O₂（原子守恆 H 4、O 2）；反應式逐項出現；電能 → 化學能
 * 播放規則（AGENTS 10.6）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停，到底時呼叫一次 ElAnim.ctl.onEnd()。
 * ElAnim.ctl.paused 為真時時間凍住。分頁被隱藏（canvas offsetWidth＝0）時不跑 rAF，每 250ms 檢查一次。
 * 進度條呼叫共用 window.AnimBar.draw（畫布頂端 y=8～24），沒載入時退回細線。
 */
(function () {
  'use strict';
  window.ElAnim = window.ElAnim || {};
  window.ElAnim.ctl = window.ElAnim.ctl || { paused: false, onEnd: null };

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)',
    h2: '#ffe45c', o2: '#ff78b7', flame: '#ffb347', wood: '#c89b6a'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 固定種子

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    if (s.indexOf('\n') >= 0) return s.split('\n').reduce((a, part) => a.concat(wrap(ctx, part, maxW, size)), []);
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
  function text(ctx, s, x, y, color, size, align, alpha, m) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size, m); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function block(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(ctx, l, x, y + k * h, color, size, align, alpha));
    return y + ls.length * h;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  // ───────── 路徑工具 ─────────
  function mkPath(pts) {
    const seg = []; let L = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1e-6) continue;
      seg.push({ a, b, len, s0: L, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }); L += len;
    }
    return { pts, seg, L };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u };
  }

  // ───────── 幾何（第 1～3 步） ─────────
  const BX0 = 60, BX1 = 600, BRIM = 258, BBOT = 456, LIQ = 280;          // 水槽
  const NX = 190, PX = 470, RW2 = 11, ROD_TOP = 300, ROD_BOT = 472;       // 碳棒（半寬 11）
  const TIW = 29, TIN = 100, TMOUTH = 392, GRID = 40;                     // 集氣管：內半寬、管內頂、管口、1 格
  const WY = 496, BN = 322, BP = 338, BATX = 330;                         // 導線、電池
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: ROD_TOP + 12 }]);   // 電池負極 → 負極端
  const E_R = mkPath([{ x: PX, y: ROD_TOP + 12 }, { x: PX, y: WY }, { x: BP, y: WY }]);   // 正極端 → 電池正極
  const WIRES = [[{ x: NX, y: ROD_BOT }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: PX, y: WY }, { x: PX, y: ROD_BOT }]];
  const RX = 640, RW = 340;                                               // 右欄
  // 時間（全域 T）：電子出發、開始冒泡、氣體開始累積／累積完成、停止產生新氣泡
  const T_FLOW = 5.0, T_ON = 8.1, T_G0 = 9.1, T_G1 = 25.6, T_OFF = 24.9;
  const gasH = T => 4 * clamp((T - T_G0) / (T_G1 - T_G0), 0, 1);         // 氫氣格數（O₂ ＝ 一半）
  const yIf = g => TIN + GRID * g;                                        // 氣液界面
  // 離子（少量硫酸，示意）：home、往哪支碳棒漂（dir：+1 右、−1 左）、最多漂多遠
  const IONS = [
    { x: 270, y: 380, s: 'H⁺', k: 0, dir: -1, max: 24 },
    { x: 395, y: 380, s: 'H⁺', k: 0, dir: -1, max: 40 },
    { x: 110, y: 428, s: 'H⁺', k: 0, dir: 1, max: 40 },
    { x: 262, y: 428, s: 'H⁺', k: 0, dir: -1, max: 30 },
    { x: 352, y: 428, s: 'SO₄²⁻', k: 1, dir: 1, max: 54 },
    { x: 548, y: 428, s: 'SO₄²⁻', k: 1, dir: -1, max: 18 }
  ];
  const V_ION = 9;

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['裝置', 'Setup'],
      cap: ['電解水的裝置：碳棒、電解質、集氣管', 'The setup: carbon rods, electrolyte, gas tubes'],
      bot: ['電解水要加少量電解質，兩極用碳棒', 'Add a little electrolyte; use carbon rods'],
      res: ['電解水要在水裡加少量電解質，兩極用碳棒（惰性電極）。',
        'To electrolyse water, add a little electrolyte to the water and use carbon rods (inert electrodes) for both electrodes.'] },
    { dur: 9, b: ['通電冒泡', 'Bubbles'],
      cap: ['通電：兩極都冒出氣泡', 'Current on: bubbles at both electrodes'],
      bot: ['負極端產生氫氣 H₂，正極端產生氧氣 O₂', 'H₂ forms at the (−) side, O₂ at the (+) side'],
      res: ['負極端產生氫氣 H₂，正極端產生氧氣 O₂。',
        'Hydrogen gas (H₂) forms at the (−) side and oxygen gas (O₂) at the (+) side.'] },
    { dur: 9, b: ['體積比', 'Volume'],
      cap: ['收集的氣體：氫氣是氧氣的 2 倍', 'Gas collected: twice as much H₂ as O₂'],
      bot: ['體積比 氫氣：氧氣 ＝ 2：1', 'Volume ratio H₂ : O₂ = 2 : 1'],
      res: ['體積比 氫氣：氧氣 ＝ 2：1。', 'Volume ratio hydrogen : oxygen = 2 : 1.'] },
    { dur: 8, b: ['檢驗氣體', 'Test'],
      cap: ['檢驗氣體：氫氣可燃、氧氣助燃', 'Testing the gases: H₂ burns, O₂ supports burning'],
      bot: ['氫氣具有可燃性；氧氣具有助燃性', 'H₂ is flammable; O₂ supports burning'],
      res: ['氫氣具有可燃性；氧氣具有助燃性。', 'Hydrogen is flammable; oxygen supports burning.'] },
    { dur: 8, b: ['總反應', 'Overall'],
      cap: ['總反應：水被拆成氫和氧', 'Overall: water splits into H₂ and O₂'],
      bot: ['外加電能，把水拆成氫和氧', 'Electrical energy splits water into H₂ and O₂'],
      res: ['總反應 2H₂O ⟶ 2H₂ + O₂：外加電能，把水拆成氫和氧。',
        'Overall reaction 2H₂O ⟶ 2H₂ + O₂: supplied electrical energy splits water into hydrogen and oxygen.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 圖形：水槽、碳棒、集氣管 ─────────
  function troughPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(BX0 - 8, BRIM - 6); ctx.quadraticCurveTo(BX0, BRIM - 4, BX0, BRIM + 8);
    ctx.lineTo(BX0, BBOT - 16); ctx.quadraticCurveTo(BX0, BBOT, BX0 + 16, BBOT);
    ctx.lineTo(BX1 - 16, BBOT); ctx.quadraticCurveTo(BX1, BBOT, BX1, BBOT - 16);
    ctx.lineTo(BX1, BRIM + 8); ctx.quadraticCurveTo(BX1, BRIM - 4, BX1 + 8, BRIM - 6);
  }
  function innerClip(ctx, yTop) {
    ctx.beginPath();
    ctx.moveTo(BX0 + 2, yTop); ctx.lineTo(BX0 + 2, BBOT - 16); ctx.quadraticCurveTo(BX0 + 2, BBOT - 2, BX0 + 16, BBOT - 2);
    ctx.lineTo(BX1 - 16, BBOT - 2); ctx.quadraticCurveTo(BX1 - 2, BBOT - 2, BX1 - 2, BBOT - 16); ctx.lineTo(BX1 - 2, yTop); ctx.closePath();
  }
  function troughBack(ctx) { ctx.save(); innerClip(ctx, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore(); }
  function liquid(ctx) {
    ctx.save(); innerClip(ctx, LIQ); ctx.fillStyle = 'rgba(205,228,232,0.10)'; ctx.fill(); ctx.restore();
    // 液面線：管內那一段不畫（管內的水一直連到界面）
    const segs = [[BX0 + 2, NX - TIW - 3], [NX + TIW + 3, PX - TIW - 3], [PX + TIW + 3, BX1 - 2]];
    ctx.save();
    segs.forEach(([a, b]) => {
      ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a, LIQ); ctx.lineTo(b, LIQ); ctx.stroke();
      ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a, LIQ + 4); ctx.lineTo(b, LIQ + 4); ctx.stroke();
    });
    ctx.restore();
  }
  function troughFront(ctx) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    troughPath(ctx); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    troughPath(ctx); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function rod(ctx, x) {
    const x0 = x - RW2, w = RW2 * 2, h = ROD_BOT - ROD_TOP;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ROD_TOP, w, h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, x0, ROD_TOP, w, BBOT - ROD_TOP, 6); ctx.fill();
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 17, BBOT - 6, 34, 14, 3); ctx.fill();          // 槽底的橡皮塞
    ctx.restore();
  }
  function tubeInnerPath(ctx, x, yTop, yBot) {
    ctx.beginPath(); ctx.moveTo(x - TIW, yBot); ctx.lineTo(x - TIW, yTop + 8); ctx.quadraticCurveTo(x - TIW, yTop, x - TIW + 8, yTop);
    ctx.lineTo(x + TIW - 8, yTop); ctx.quadraticCurveTo(x + TIW, yTop, x + TIW, yTop + 8); ctx.lineTo(x + TIW, yBot); ctx.closePath();
  }
  // 集氣管內容：氣體（上）＋水（界面到槽內液面；液面以下由水槽的水負責）
  function tubeContent(ctx, x, g, gasColor) {
    const yi = yIf(g);
    ctx.save();
    if (g > 0.001) {
      tubeInnerPath(ctx, x, TIN, yi);
      const c = gasColor === K.h2 ? 'rgba(255,228,92,0.16)' : 'rgba(255,120,183,0.16)';
      ctx.fillStyle = c; ctx.fill();
    }
    ctx.beginPath(); ctx.rect(x - TIW, yi, TIW * 2, LIQ - yi); ctx.fillStyle = 'rgba(205,228,232,0.10)'; ctx.fill();
    if (g > 0.001) {                                                     // 氣液界面
      ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - TIW, yi); ctx.lineTo(x + TIW, yi); ctx.stroke();
    }
    ctx.restore();
  }
  function tubeGlass(ctx, x) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = () => {
      const o = TIW + 2, top = TIN - 3;
      ctx.beginPath(); ctx.moveTo(x - o - 5, TMOUTH + 3); ctx.lineTo(x - o, TMOUTH - 4); ctx.lineTo(x - o, top + 10);
      ctx.quadraticCurveTo(x - o, top, x - o + 10, top); ctx.lineTo(x + o - 10, top); ctx.quadraticCurveTo(x + o, top, x + o, top + 10);
      ctx.lineTo(x + o, TMOUTH - 4); ctx.lineTo(x + o + 5, TMOUTH + 3);
    };
    path(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    path(); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(214,236,242,0.75)'; ctx.lineWidth = 2;               // 刻度（1 格＝GRID）
    for (let k = 1; k <= 7; k++) {
      const y = TIN + GRID * k, len = k <= 4 ? 12 : 8;
      ctx.beginPath(); ctx.moveTo(x - TIW, y); ctx.lineTo(x - TIW + len, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ───────── 圖形：離子、電子、氣泡、元件 ─────────
  let HW = { 'H⁺': 22, 'SO₄²⁻': 42 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {
    if (al <= 0.01) return;
    const hw = HW[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function bubble(ctx, x, y, r, color, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function energySq(ctx, x, y, s, al) {             // 能量＝電子藍方塊＋亮外框
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = K.electron; ctx.shadowColor = K.electron; ctx.shadowBlur = 8;
    ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 2; ctx.strokeRect(x - s / 2, y - s / 2, s, s); ctx.restore();
  }
  function ring(ctx, x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function wireLine(ctx, pts, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function battery(ctx, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 24); ctx.lineTo(BP, WY + 24); ctx.stroke();   // 長細＝正極
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 12); ctx.lineTo(BN, WY + 12); ctx.stroke();   // 短粗＝負極
    ctx.restore();
    text(ctx, '−', BN - 18, WY - 20, K.electron, 28, 'center', al);
    text(ctx, '+', BP + 18, WY - 20, K.pos, 28, 'center', al);
  }
  function mark(ctx, kind, x, y, alpha) {           // 'ok' 綠勾、'dot' 黃點
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'dot') { ctx.fillStyle = K.yellow; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.restore(); return; }
    ctx.strokeStyle = K.green; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); ctx.stroke();
    ctx.restore();
  }
  function arrowLine(ctx, x0, y0, x1, y1, color, al, lw) {
    if (al <= 0.01) return;
    const a = Math.atan2(y1 - y0, x1 - x0), h = 11;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * h * 0.6, y1 - Math.sin(a) * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - h * Math.cos(a - 0.45), y1 - h * Math.sin(a - 0.45));
    ctx.lineTo(x1 - h * Math.cos(a + 0.45), y1 - h * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function chevron(ctx, x, y, al) {                 // 向下箭頭（水位下降）
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.white; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x, y + 5); ctx.lineTo(x + 9, y - 4); ctx.stroke(); ctx.restore();
  }

  // ───────── 第 1～3 步：依全域時間 T 算出的狀態（純函式） ─────────
  function flowE(ctx, T, al) {
    if (T < T_FLOW || al <= 0.01) return;
    const V = 110, sp = 52, d = V * T, front = 150 * (T - T_FLOW);
    [E_L, E_R].forEach(P => {
      const L = P.L;
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > L || s > front) continue;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 26, 0, 1) * clamp((front - s) / 20, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * al);
      }
    });
  }
  // 氣泡：第 k 顆在 t0 從碳棒表面冒出，往上升到界面就併入氣體。H₂ 的間隔是 O₂ 的一半（產生速率 2 倍）。
  function bubbles(ctx, T, x, dt, g, color, seed) {
    const yi = yIf(g), VB = 88, tEnd = Math.min(T, T_OFF);
    if (tEnd < T_ON) return;
    const kHi = Math.floor((tEnd - T_ON) / dt), kLo = Math.max(0, Math.floor((T - T_ON - 4.0) / dt));
    for (let k = kLo; k <= kHi; k++) {
      const h1 = hash(seed + k * 3.1), h2 = hash(seed + k * 7.7 + 1.3), h3 = hash(seed + k * 1.9 + 4.2);
      const t0 = T_ON + k * dt + h1 * dt * 0.6, age = T - t0;
      if (age < 0) continue;
      const side = k % 2 ? 1 : -1, r = 3.5 + h3 * 3;
      const y0 = ROD_TOP + 8 + h2 * (TMOUTH - ROD_TOP - 14), y = y0 - VB * age * (0.85 + 0.3 * h3);
      if (y - r <= yi + 1) continue;
      const bx = x + side * (RW2 + r + 1 + Math.min(6, 12 * age)) + 1.8 * Math.sin(age * 7 + k);
      bubble(ctx, clamp(bx, x - TIW + r + 2, x + TIW - r - 2), y, r, color, clamp(age / 0.15, 0, 1));
    }
  }
  function apparatus(ctx, i, tl, T) {
    const gH = gasH(T), gO = gH / 2;
    troughBack(ctx);
    tubeContent(ctx, NX, gH, K.h2); tubeContent(ctx, PX, gO, K.o2);
    rod(ctx, NX); rod(ctx, PX);
    liquid(ctx);
    // 離子：通電後各自往電極漂
    IONS.forEach((o, n) => {
      const d = Math.min(o.max, V_ION * Math.max(0, T - T_ON)), arrived = d >= o.max - 0.01;
      const jx = arrived ? 1.2 * Math.sin(T * 3 + n) : 3 * Math.sin(T * 1.3 + n * 1.9);
      ionPill(ctx, o.x + o.dir * d + jx, o.y + 3 * Math.sin(T * 1.7 + n * 2.3), o.s, o.k, 1);
    });
    bubbles(ctx, T, NX, 0.11, gH, K.h2, 11);
    bubbles(ctx, T, PX, 0.22, gO, K.o2, 53);
    tubeGlass(ctx, NX); tubeGlass(ctx, PX);
    troughFront(ctx);
    // 刻度數字（管外側）
    for (let k = 1; k <= 4; k++) {
      text(ctx, String(k), NX - TIW - 12, TIN + GRID * k, K.white, 22, 'right', 0.9, true);
      text(ctx, String(k), PX + TIW + 12, TIN + GRID * k, K.white, 22, 'left', 0.9, true);
    }
    // 氣體標示
    const aB = i === 0 ? 0 : ease(i === 1 ? (tl - 0.8) / 0.5 : 1);
    text(ctx, 'H₂', NX - TIW - 12, 346, K.h2, 24, 'right', aB, true);
    text(ctx, 'O₂', PX + TIW + 12, 346, K.o2, 24, 'left', aB, true);
    if (gH > 0.9) text(ctx, 'H₂', NX, TIN + GRID * gH / 2, K.h2, 24, 'center', ease((gH - 0.9) / 0.3), true);
    if (gO > 0.9) text(ctx, 'O₂', PX, TIN + GRID * gO / 2, K.o2, 24, 'center', ease((gO - 0.9) / 0.3), true);
    // 第 1 步：電解質、集氣管說明
    const aE = i === 0 ? ease((tl - 0.8) / 0.5) : i === 1 ? 1 - ease(tl / 0.6) : 0;
    block(ctx, tr('加少量電解質\n水才導電', 'Add a little\nelectrolyte so\nwater conducts'), 330, 294, 190, K.cyan, 22, 'center', aE, 26);
    const aT = i === 0 ? ease((tl - 2.0) / 0.5) : i === 1 ? 1 - ease(tl / 0.6) : 0;
    block(ctx, tr('集氣管\n（裝滿水）', 'Gas tubes\n(full of water)'), 330, 132, 190, K.white, 22, 'center', aT, 28);
    arrowLine(ctx, 252, 182, 227, 204, K.white, aT, 2.5); arrowLine(ctx, 408, 182, 433, 204, K.white, aT, 2.5);
    // 第 2、3 步：離子移動方向
    const aI = i === 1 ? ease((tl - 1.2) / 0.5) : i === 2 ? 1 : 0;
    text(ctx, '← H⁺', 278, 316, K.pos, 22, 'center', aI, true);
    text(ctx, 'SO₄²⁻ →', 386, 316, K.neg, 22, 'center', aI, true);
    // 第 3 步：水位下降箭頭（H₂ 兩個＝2 倍快）與體積比
    if (i === 2) {
      const aC = ease(tl / 0.5) * (T < T_G1 ? 1 : 0);
      if (aC > 0.01) {
        const yh = yIf(gH), yo = yIf(gO);
        chevron(ctx, NX, yh + 14, aC); chevron(ctx, NX, yh + 26, aC);
        chevron(ctx, PX, yo + 14, aC);
      }
      const aR = ease((tl - 2.5) / 0.5);
      equation(ctx, [['H₂', K.h2, aR], ['：', K.white, aR], ['O₂', K.o2, aR]], 330, 130, 30);
      equation(ctx, [['＝ 2：1', K.white, aR]], 330, 170, 30);
    }
    // 電路：導線 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w, 1));
    flowE(ctx, T, clamp((T - T_FLOW) / 0.3, 0, 1));
    battery(ctx, 1);
    text(ctx, tr('電池', 'Battery'), BATX, 536, K.white, 22, 'center');
    text(ctx, tr('負極端', '(−) side'), NX - 18, 478, K.electron, 24, 'right');
    text(ctx, tr('碳棒', 'Carbon'), NX - 18, 508, K.muted, 22, 'right');
    text(ctx, tr('正極端', '(+) side'), PX + 18, 478, K.pos, 24, 'left');
    text(ctx, tr('碳棒', 'Carbon'), PX + 18, 508, K.muted, 22, 'left');
  }

  // ───────── 第 4 步：檢驗氣體 ─────────
  const HT = { x: 190, top: 130, mouth: 330 }, OT = { x: 450, top: 230, bot: 450 };
  function testTube(ctx, x, yTop, yBot, mouthUp, tint) {
    ctx.save();
    const o = TIW + 2;
    const inner = () => {
      ctx.beginPath();
      if (mouthUp) { ctx.moveTo(x - TIW, yTop); ctx.lineTo(x - TIW, yBot - TIW); ctx.arc(x, yBot - TIW, TIW, Math.PI, 0, true); ctx.lineTo(x + TIW, yTop); }
      else { ctx.moveTo(x - TIW, yBot); ctx.lineTo(x - TIW, yTop + TIW); ctx.arc(x, yTop + TIW, TIW, Math.PI, 0); ctx.lineTo(x + TIW, yBot); }
      ctx.closePath();
    };
    inner(); ctx.fillStyle = tint; ctx.fill();
    const glass = () => {
      ctx.beginPath();
      if (mouthUp) { ctx.moveTo(x - o - 5, yTop - 4); ctx.lineTo(x - o, yTop + 3); ctx.lineTo(x - o, yBot - o); ctx.arc(x, yBot - o, o, Math.PI, 0, true); ctx.lineTo(x + o, yTop + 3); ctx.lineTo(x + o + 5, yTop - 4); }
      else { ctx.moveTo(x - o - 5, yBot + 4); ctx.lineTo(x - o, yBot - 3); ctx.lineTo(x - o, yTop + o); ctx.arc(x, yTop + o, o, Math.PI, 0); ctx.lineTo(x + o, yBot - 3); ctx.lineTo(x + o + 5, yBot + 4); }
    };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    glass(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    glass(); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function flameShape(ctx, x, y, h, w, al, flick) {  // 尖端朝上的火焰，(x,y)＝火焰底部
    if (al <= 0.01 || h < 1) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.shadowColor = K.flame; ctx.shadowBlur = 14;
    const tipX = x + flick;
    [[1, '#ff8a2a'], [0.55, '#ffe08a']].forEach(([s, c]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(tipX, y - h * s);
      ctx.quadraticCurveTo(x + w * s, y - h * s * 0.35, x, y + w * s * 0.4);
      ctx.quadraticCurveTo(x - w * s, y - h * s * 0.35, tipX, y - h * s); ctx.fill();
    });
    ctx.restore();
  }
  function stick(ctx, x0, y0, x1, y1, w, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
  }
  const POP = 2.8, RELIGHT = 5.8;
  function testScene(ctx, tl) {
    const a0 = ease(tl / 0.4);
    ctx.save(); ctx.globalAlpha *= a0;
    // 氫氣管：管口朝下（從負極端取出）
    testTube(ctx, HT.x, HT.top, HT.mouth, false, 'rgba(255,228,92,0.16)');
    if (tl > POP && tl < POP + 0.6) {                                   // 噗：管口一閃
      const k = (tl - POP) / 0.6;
      ctx.save(); ctx.globalAlpha *= (1 - k); const g = ctx.createRadialGradient(HT.x, HT.mouth, 4, HT.x, HT.mouth, 70);
      g.addColorStop(0, 'rgba(255,224,138,0.9)'); g.addColorStop(1, 'rgba(255,138,42,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(HT.x, HT.mouth, 70, 0, TAU); ctx.fill(); ctx.restore();
    }
    ring(ctx, HT.x, HT.mouth, tl - POP, K.flame, 14); ring(ctx, HT.x, HT.mouth, tl - POP - 0.15, K.h2, 10);
    // 火柴：從右下靠近管口
    const m = ease((tl - 0.6) / 2.0), tx = lerp(330, HT.x + 8, m), ty = lerp(462, HT.mouth + 20, m);
    stick(ctx, tx, ty, tx + 48, ty + 64, 5, K.wood);
    ctx.save(); ctx.fillStyle = '#8c2f1e'; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, TAU); ctx.fill(); ctx.restore();
    const burst = tl > POP ? 1 + 1.2 * Math.exp(-(tl - POP) * 6) : 1;
    flameShape(ctx, tx, ty - 2, 20 * burst, 8 * burst, 1, 1.5 * Math.sin(tl * 19));
    // 氧氣管：管口朝上（從正極端取出），放入帶火星的木條
    testTube(ctx, OT.x, OT.top, OT.bot, true, 'rgba(255,120,183,0.16)');
    const s1 = ease((tl - 3.8) / 0.9), s2 = ease((tl - 4.7) / 1.0);
    const sx = lerp(lerp(548, OT.x - 3, s1), OT.x - 3, s2), sy = lerp(lerp(262, OT.top - 18, s1), OT.bot - 70, s2);
    stick(ctx, sx, sy, sx + 18, sy - 112, 7, K.wood);
    const lit = ease((tl - RELIGHT) / 0.5);
    ctx.save(); ctx.shadowColor = K.flame; ctx.shadowBlur = 12 + 6 * Math.sin(tl * 7);
    ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.arc(sx, sy, 5 + 1.2 * Math.sin(tl * 7), 0, TAU); ctx.fill(); ctx.restore();
    flameShape(ctx, sx, sy - 2, 34 * lit, 11 * lit, lit, 2 * Math.sin(tl * 17));
    ctx.restore();
    // 標示
    text(ctx, tr('氫氣 H₂', 'H₂ gas'), HT.x + 46, 170, K.h2, 24, 'left', a0);
    text(ctx, tr('（負極端）', '(−) side'), HT.x + 46, 200, K.muted, 22, 'left', a0);
    text(ctx, tr('氧氣 O₂', 'O₂ gas'), OT.x + 44, 300, K.o2, 24, 'left', a0);
    text(ctx, tr('（正極端）', '(+) side'), OT.x + 44, 330, K.muted, 22, 'left', a0);
    text(ctx, tr('噗！', 'Pop!'), HT.x - 66, HT.mouth + 26, K.yellow, 30, 'center', ease((tl - POP) / 0.2));
    text(ctx, tr('可燃性', 'Flammable'), HT.x, 516, K.green, 30, 'center', ease((tl - POP - 0.4) / 0.4));
    text(ctx, tr('復燃！', 'Relit!'), OT.x - 92, OT.bot - 96, K.yellow, 30, 'center', ease((tl - RELIGHT - 0.2) / 0.3));
    text(ctx, tr('助燃性', 'Supports burning'), OT.x, 516, K.green, 30, 'center', ease((tl - RELIGHT - 0.5) / 0.4));
  }

  // ───────── 第 5 步：粒子層級 2H₂O → 2H₂ + O₂ ─────────
  const RH = 17, RO = 22;
  // 每個原子：起點（水分子）→ 終點（產物）。上面的水分子 H 朝上、下面的 H 朝下，上下順序不變，路徑不交叉：
  // 上分子的 2 個 H → 上面的 H₂；下分子的 2 個 H → 下面的 H₂；2 個 O → 中間的 O₂
  const ATOMS = [
    { e: 'O', a: { x: 180, y: 182 }, b: { x: 449, y: 236 }, sp: { x: 0, y: 10 } },
    { e: 'H', a: { x: 154, y: 160 }, b: { x: 453, y: 132 }, sp: { x: -16, y: -6 } },
    { e: 'H', a: { x: 206, y: 160 }, b: { x: 487, y: 132 }, sp: { x: 16, y: -6 } },
    { e: 'O', a: { x: 180, y: 290 }, b: { x: 493, y: 236 }, sp: { x: 0, y: -10 } },
    { e: 'H', a: { x: 154, y: 312 }, b: { x: 453, y: 340 }, sp: { x: -16, y: 6 } },
    { e: 'H', a: { x: 206, y: 312 }, b: { x: 487, y: 340 }, sp: { x: 16, y: 6 } }
  ];
  function atomBall(ctx, e, x, y, al) {
    if (al <= 0.01) return;
    const r = e === 'O' ? RO : RH;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r);
    if (e === 'O') { g.addColorStop(0, '#ffb0a6'); g.addColorStop(0.55, K.red); g.addColorStop(1, '#b8382c'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#e6eeec'); g.addColorStop(1, '#a9b8b4'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, e, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function particleScene(ctx, tl) {
    const app = ease(tl / 0.5), sp = ease((tl - 1.9) / 0.6), mvO = ease((tl - 3.0) / 1.4), mvH = mvO;
    // 電能輸入：3 個藍方塊飛向水分子、被吸收
    for (let k = 0; k < 3; k++) {
      const u = ease((tl - 1.2 - 0.12 * k) / 0.8), x = lerp(84 + 26 * k, 180, u), y = lerp(452, 232, u);
      energySq(ctx, x, y, 18, clamp((tl - 0.9) / 0.3, 0, 1) * (1 - ease((tl - 2.0 - 0.12 * k) / 0.3)));
    }
    // 原子：先在分子裡，拆開（往外彈一點），再移到產物位置重組；先畫 H 再畫 O，讓 O 在上層
    const pos = A => { const u = A.e === 'O' ? mvO : mvH; return { x: lerp(A.a.x + A.sp.x * sp, A.b.x, u), y: lerp(A.a.y + A.sp.y * sp, A.b.y, u) }; };
    ATOMS.filter(A => A.e === 'H').forEach(A => { const p = pos(A); atomBall(ctx, 'H', p.x, p.y, app); });
    ATOMS.filter(A => A.e === 'O').forEach(A => { const p = pos(A); atomBall(ctx, 'O', p.x, p.y, app); });
    if (tl > 1.9 && tl < 3.2) {                                          // 拆開的瞬間：小閃光
      ring(ctx, 180, 172, tl - 1.9, K.electron, 26); ring(ctx, 180, 300, tl - 1.9, K.electron, 26);
    }
    // 標示
    const RY = 396;                                                       // 底下一列：2H₂O ⟶ 2H₂ + O₂
    text(ctx, '2H₂O', 180, RY, K.white, 28, 'center', ease((tl - 0.6) / 0.4), true);
    arrowLine(ctx, 262, RY, 352, RY, K.white, ease((tl - 3.0) / 0.4), 4);
    equation(ctx, [['2H₂', K.h2, ease((tl - 4.7) / 0.4)], [' + ', K.white, ease((tl - 4.9) / 0.4)], ['O₂', K.o2, ease((tl - 4.9) / 0.4)]], 470, RY, 28);
    text(ctx, 'H₂', 546, 132, K.h2, 28, 'center', ease((tl - 4.7) / 0.4), true);
    text(ctx, 'H₂', 546, 340, K.h2, 28, 'center', ease((tl - 4.7) / 0.4), true);
    text(ctx, 'O₂', 556, 236, K.o2, 28, 'center', ease((tl - 4.9) / 0.4), true);
    // 角落：電能 → 化學能
    const aEn = ease((tl - 6.0) / 0.5);
    for (let k = 0; k < 3; k++) energySq(ctx, 84 + 26 * k, 452, 18, aEn);
    text(ctx, tr('電能 → 化學能', 'Electrical → chemical energy'), 160, 452, K.electron, 24, 'left', aEn);
  }

  // ───────── 右欄 ─────────
  function row(ctx, kind, s, y, color, al, size) {
    if (kind === 'e') ball(ctx, RX + 14, y, 8, al);
    else if (kind === 'h2' || kind === 'o2') bubble(ctx, RX + 14, y, 9, kind === 'h2' ? K.h2 : K.o2, al);
    else mark(ctx, kind, RX + 14, y, al);
    return block(ctx, s, RX + 40, y, RW - 40, color, size || 24, 'left', al);
  }
  function equation(ctx, terms, cx, y, size) {
    const ws = terms.map(g => textW(ctx, g[0], size, true)), tot = ws.reduce((a, b) => a + b, 0);
    let x = cx - tot / 2;
    terms.forEach((g, k) => { text(ctx, g[0], x, y, g[1], size, 'left', g[2], true); x += ws[k]; });
  }
  function pillRow(ctx, s, kind, label, y, al) {
    const hw = HW[s];
    ionPill(ctx, RX + hw, y, s, kind, al);
    return block(ctx, label, RX + 2 * hw + 14, y, RW - 2 * hw - 14, K.white, 22, 'left', al);
  }
  const KEY_LAST = 540, KEY_LH = 31;
  function keyLines(ctx, s, alpha) {               // 本步一句：右欄底部，最後一行固定在 y=540
    const ls = wrap(ctx, s, RW, 24), y0 = KEY_LAST - (ls.length - 1) * KEY_LH;
    ls.forEach((l, k) => text(ctx, l, RX, y0 + k * KEY_LH, K.yellow, 24, 'left', alpha));
  }
  const fmt = (g, done) => (done || g <= 0.001 ? String(Math.round(g)) : g.toFixed(1));
  function notes(ctx, i, tl, T) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y;
    if (i === 0) {
      y = block(ctx, tr('電解水的裝置', 'Setting up'), RX, 106, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'dot', tr('水＋少量電解質', 'Water + a little electrolyte'), y + 12, K.white, a(0.8));
      y = block(ctx, tr('（例：硫酸 H₂SO₄）', '(e.g. sulfuric acid H₂SO₄)'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(1.0));
      y = row(ctx, 'dot', tr('碳棒＝惰性電極', 'Carbon rods = inert electrodes'), y + 12, K.white, a(1.6));
      y = row(ctx, 'dot', tr('集氣管倒置、裝滿水', 'Gas tubes upside down, full of water'), y + 12, K.white, a(2.4));
      y = block(ctx, tr('（管上有刻度）', '(with a scale)'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(2.6));
      row(ctx, 'e', tr('電子從電池負極出發', 'Electrons leave the battery\'s (−) end'), y + 12, K.electron, a(4.8));
    } else if (i === 1) {
      y = block(ctx, tr('通電：兩極都冒泡', 'Both electrodes bubble'), RX, 106, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'h2', tr('負極端：氫氣 H₂', '(−) side: hydrogen H₂'), y + 14, K.h2, a(1.0));
      y = row(ctx, 'o2', tr('正極端：氧氣 O₂', '(+) side: oxygen O₂'), y + 8, K.o2, a(1.6));
      y = block(ctx, tr('氣體把管內的水往下擠', 'The gas pushes the water in the tube down'), RX, y + 12, RW, K.white, 24, 'left', a(3.0));
      y = block(ctx, tr('溶液中：', 'In the solution:'), RX, y + 12, RW, K.muted, 22, 'left', a(4.0));
      y = pillRow(ctx, 'H⁺', 0, tr('往負極端', 'toward the (−) side'), y + 14, a(4.2));
      pillRow(ctx, 'SO₄²⁻', 1, tr('往正極端', 'toward the (+) side'), y + 12, a(4.5));
    } else if (i === 2) {
      y = block(ctx, tr('收集到的氣體', 'Gas collected'), RX, 106, RW, K.white, 30, 'left', a(0.3), 38);
      const gH = gasH(T), done = gH >= 3.999;
      y = row(ctx, 'h2', tr(`氫氣 H₂：${fmt(gH, done)} 格`, `H₂: ${fmt(gH, done)} units`), y + 14, K.h2, a(0.6));
      y = row(ctx, 'o2', tr(`氧氣 O₂：${fmt(gH / 2, done)} 格`, `O₂: ${fmt(gH / 2, done)} units`), y + 8, K.o2, a(0.8));
      y = block(ctx, tr('H₂ 水位下降速度是 O₂ 的 2 倍', 'The H₂ water level falls twice as fast as O₂'), RX, y + 14, RW, K.white, 24, 'left', a(1.6));
      row(ctx, 'ok', tr('任何時刻 H₂ 都是 O₂ 的 2 倍', 'At every moment H₂ is twice O₂'), y + 16, K.green, a(3.2));
    } else if (i === 3) {
      y = block(ctx, tr('檢驗氣體', 'Testing the gases'), RX, 106, RW, K.white, 30, 'left', a(0.3), 38);
      y = block(ctx, tr('負極端的 H₂', 'H₂ from the (−) side'), RX, y + 12, RW, K.h2, 24, 'left', a(0.6));
      y = block(ctx, tr('管口靠近火柴 → 噗一聲燃燒', 'Bring a lit match to the mouth → it burns with a pop'), RX, y, RW, K.white, 22, 'left', a(1.0));
      y = row(ctx, 'ok', tr('可燃性', 'Flammable'), y + 14, K.green, a(POP + 0.4));
      y = block(ctx, tr('正極端的 O₂', 'O₂ from the (+) side'), RX, y + 18, RW, K.o2, 24, 'left', a(3.6));
      y = block(ctx, tr('放入帶火星的木條 → 復燃', 'Put in a glowing splint → it bursts into flame'), RX, y, RW, K.white, 22, 'left', a(4.0));
      row(ctx, 'ok', tr('助燃性', 'Supports burning'), y + 14, K.green, a(RELIGHT + 0.5));
    } else {
      y = block(ctx, tr('總反應', 'Overall reaction'), RX, 106, RW, K.white, 30, 'left', a(0.3), 38);
      const ey = y + 26;
      equation(ctx, [['2H₂O', K.white, a(0.8)], [' ⟶ ', K.white, a(3.0)], ['2H₂', K.h2, a(4.7)], [' + ', K.white, a(4.9)], ['O₂', K.o2, a(4.9)]], RX + RW / 2, ey, 28);
      y = ey + 40;
      y = block(ctx, tr('原子拆開再重組', 'Atoms split apart and regroup'), RX, y, RW, K.white, 24, 'left', a(3.2));
      y = row(ctx, 'ok', tr('H：4 個 → 4 個', 'H: 4 atoms → 4 atoms'), y + 12, K.white, a(5.4));
      y = row(ctx, 'ok', tr('O：2 個 → 2 個', 'O: 2 atoms → 2 atoms'), y + 6, K.white, a(5.7));
      block(ctx, tr('原子數守恆', 'The number of atoms is conserved'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(5.9));
    }
    const botT = [6.0, 6.4, 7.6, 6.6, 6.6][i];
    keyLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), a(botT));
  }

  // ───────── 圖例、標題、進度條 ─────────
  function drawLegend(ctx, i) {
    const items = i <= 2
      ? [[tr('藍球＝電子', 'Blue = electron'), 'b'], [tr('橘＝陽離子', 'Orange = cation'), 'p'], [tr('紫＝陰離子', 'Purple = anion'), 'n'], [tr('空心圈＝氣泡', 'Ring = bubble'), 'r']]
      : i === 3
        ? [[tr('淡黃＝氫氣 H₂', 'Yellow = H₂ gas'), 'gh'], [tr('粉紅＝氧氣 O₂', 'Pink = O₂ gas'), 'go']]
        : [[tr('藍方塊＝能量（教學符號）', 'Blue square = energy (symbol)'), 'sq'], [tr('白球＝氫原子 H', 'White = H atom'), 'ah'], [tr('紅球＝氧原子 O', 'Red = O atom'), 'ao']];
    const z = 22, gapIcon = 32, gapItem = 36;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'p' || kind === 'n') { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      else if (kind === 'r') { bubble(ctx, x + 6, y, 6, K.h2, 1); bubble(ctx, x + 19, y, 6, K.o2, 1); }
      else if (kind === 'gh' || kind === 'go') {
        ctx.save(); ctx.fillStyle = kind === 'gh' ? 'rgba(255,228,92,0.35)' : 'rgba(255,120,183,0.35)';
        ctx.strokeStyle = kind === 'gh' ? K.h2 : K.o2; ctx.lineWidth = 2; rrect(ctx, x, y - 9, 22, 18, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      else if (kind === 'sq') energySq(ctx, x + 10, y, 16, 1);
      else { const r = 9; ctx.save(); ctx.fillStyle = kind === 'ah' ? '#e6eeec' : K.red; ctx.beginPath(); ctx.arc(x + 10, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }
  function drawCaption(ctx, cap) { text(ctx, wrap(ctx, cap, 940, 26)[0], W / 2, 58, K.yellow, 26); }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl) {
    HW = { 'H⁺': pillHalf(ctx, 'H⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻') };
    const T = STARTS[i] + tl;
    if (i <= 2) apparatus(ctx, i, tl, T);
    else if (i === 3) testScene(ctx, tl);
    else particleScene(ctx, tl);
    notes(ctx, i, tl, T);
    drawLegend(ctx, i);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('waterAnimCanvas');
  const ctl = () => window.ElAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('waterAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c || !c.width) return;
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
    const r = document.getElementById('steps-water');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-water'); if (!r) return;
    r.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      r.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.offsetWidth > 0 && c.getClientRects().length); }
  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const c = ctl();
    if (S.last && !(c && c.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
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

  window.ElAnim.water = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-water'); if (r) r.innerHTML = '';
      const o = document.getElementById('waterAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) { S.ended = false; start(); } },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { water: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'water' : null, t: S.t, running: !!(S.raf || S.timer), step: S.step }; }
  };
})();
