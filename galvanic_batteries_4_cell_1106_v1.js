/* galvanic_batteries_4_cell_1106_v1.js — 「鋅銅電池與鹽橋」分頁動畫（#cellAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.cell = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'cell'。畫布不綁事件；唯一控制是 #steps-cell 的 5 個步驟鈕；結果框 #cellAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的 C、label、line…，也不用 origin／redox 的內部函式）。
 * 畫面是「場景時間 t 的純函式」：電極厚薄、離子位置、鹽橋高度、指針角度、電子位置都只由 t 算出。
 * 畫風、金屬用色、離子膠囊、字級沿用同課的 origin／redox 兩支（正離子＝橘膠囊、負離子＝紫膠囊、深色字）。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。外導線 y=112：鋅片頂 → 電壓表（中心 500,112，電子從表後面通過）→ 銅片頂。
 *   左杯 x 20–400（硫酸鋅溶液，近無色；鋅片中心 x=64）；右杯 x 600–980（硫酸銅溶液，深藍綠；銅片中心 x=936）。
 *   杯口 y=244、液面 y=284、杯底 y=470。杯內離子排在 3 欄×4 列的位置（左欄 132/216/300、右欄 868/784/700；列 312–432）。
 *   電極標註 y=142（導線下方）；兩杯上方 y≈190/224：反應式、變輕／變重、「＋偏多／−偏多／電中性」標示。
 *   溶液名稱寫在杯內液面上方 y=264。兩杯之間 x 410–590：鹽橋名稱（y 246/274）＋「電子流」量表（y 316–380）。
 *   鹽橋：倒 U 形玻璃管，兩腳 x=366／634、頂 y=200、管口 y=440；管內兩條離子道（K⁺ 內道、NO₃⁻ 外道），
 *   離子在管內只畫成帶「＋／−」的小圓（圖例＋管上方箭頭標明 K⁺、NO₃⁻），出管口後變成膠囊游進杯內。
 *   下方 y≈506/536：本步一句；y≈574（或 560/586 兩列）：圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只在金屬（電極）與外導線裡，成對（一次 2 個）走；不進溶液。離子只在溶液與鹽橋裡，不進導線。
 *   鋅片浸在溶液的部分每反應一次變薄一點、銅片變厚一點（純幾何，不寫數字）。
 *   沒有鹽橋：左杯 Zn²⁺ 2→4（SO₄²⁻ 2）、右杯 Cu²⁺ 3→1（SO₄²⁻ 3）；第二對電子走得越來越慢（流量平滑降到 0），指針回零。
 *   裝上鹽橋：4 個 NO₃⁻ 游進左杯、4 個 K⁺ 游進右杯（電荷剛好補平），電子恢復持續流動。
 *   不寫電壓、電位數值；不出現「氧化劑／還原劑」；不寫年份。
 *
 * ── 步驟表，共 44 s ─────────────────────────────────────────────
 *   1 組裝       8 s  兩杯、電極、離子、外導線、電壓表（指針在零）依序出現；標「負極 Zn」「正極 Cu」；鹽橋虛線「先不接」
 *   2 電子流動   9 s  鋅原子變 Zn²⁺ 進左杯、留下 2 個電子；電子成對沿導線到銅片；Cu²⁺ 在銅片得到電子變成銅；指針偏轉
 *   3 沒有鹽橋  10 s  再一次反應，但電子越走越慢；左杯「＋偏多」、右杯「−偏多」；量表降到 0、指針回零
 *   4 裝上鹽橋   9 s  鹽橋從上方落下；NO₃⁻ 游向左杯、K⁺ 游向右杯；兩杯回到電中性；電子恢復流動、指針偏轉
 *   5 兩條路     8 s  電子路徑（外導線，藍光）與離子路徑（溶液＋鹽橋，橘／紫虛線）分開標示；「閉合迴路：兩條路都要通」
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解），到底時呼叫一次 GbAnim.ctl.onEnd()。
 * GbAnim.ctl.paused 為真時時間凍住。分頁被隱藏（canvas offsetWidth＝0）時不跑 rAF，每 250ms 檢查一次。
 * 進度條呼叫共用 window.AnimBar.draw（畫布頂端 y=8～24），沒載入時退回細線。
 */
(function () {
  'use strict';
  window.GbAnim = window.GbAnim || {};
  window.GbAnim.ctl = window.GbAnim.ctl || { paused: false, onEnd: null };

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    zn: '#b9c6cc', znHi: '#e4ecef', znLo: '#7b8a91',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const swapOut = m => clamp(1 - 2 * m, 0, 1), swapIn = m => clamp(2 * m - 1, 0, 1);   // 先淡出再淡入（字不交疊）
  function swing(u) { return u <= 0 ? 0 : 1 - Math.exp(-u * 5) * Math.cos(u * 9); }

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
  function fitSize(ctx, s, maxW, z0, m) {        // 從 z0 往下找放得下的字級，不低於 22px
    for (let z = z0; z > 22; z--) if (textW(ctx, s, z, m) <= maxW) return z;
    return 22;
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
  function partial(pts, k) {
    const P = mkPath(pts), len = P.L * clamp(k, 0, 1), out = [pts[0]];
    if (len <= 0) return [];
    for (const q of P.seg) {
      if (len >= q.s0 + q.len) out.push(q.b);
      else { out.push(at(P, len)); break; }
    }
    return out;
  }
  function strokePts(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
  }

  // ───────── 幾何 ─────────
  const BRIM = 244, BBOT = 470, LIQ = 284;
  const CUPS = [{ x0: 20, x1: 400, sol: 'rgba(205,228,232,0.10)' },        // 左：硫酸鋅（近無色）
    { x0: 600, x1: 980, sol: 'rgba(28,128,140,0.46)' }];                   // 右：硫酸銅（深藍綠）
  const ZX = 64, CX = 936, EW = 40, DW = 6, ETOP = 168, EBOT = 452;       // 電極中心、寬、每次反應的厚度變化、上下
  const WY = 112, MX = 500, MW = 124, MH = 68;                            // 外導線、電壓表
  const MPIV = { x: MX, y: WY + 20 }, NEEDLE = 34;
  const RY = [312, 352, 392, 432];                                         // 杯內離子列
  const LC = [132, 216, 300], RC = [868, 784, 700];                        // 左杯欄（近鋅片→近鹽橋）、右杯欄（近銅片→近鹽橋）
  const WIRE = [{ x: ZX, y: ETOP - 2 }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: ETOP - 2 }];
  // 鹽橋：倒 U 形，中心線 左腳 x=366、頂 y=200、右腳 x=634、管口 y=440；轉角半徑 30
  const BLX = 366, BRX = 634, BCY = 230, BBY = 440, TUBE_IN = 21, TUBE_OUT = 25;
  function lanePts(o) {
    const R = 30 + o, pts = [{ x: BLX - o, y: BBY }, { x: BLX - o, y: BCY }];
    for (let j = 1; j <= 8; j++) { const a = Math.PI + j / 8 * Math.PI / 2; pts.push({ x: BLX + 30 + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + j / 8 * Math.PI / 2; pts.push({ x: BRX - 30 + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    pts.push({ x: BRX + o, y: BBY });
    return pts;
  }
  const TUBE = lanePts(0);
  const LANE_K = mkPath(lanePts(-10)), LANE_N = mkPath(lanePts(10));      // K⁺ 走內道（往右口）、NO₃⁻ 走外道（往左口）
  const SP_B = 90, V_B = 90, D_MAX = 330;                                  // 管內離子間距、游動速度、補平所需的位移
  const K_S0 = [], N_S0 = [];
  for (let k = 0; k < 8; k++) { K_S0.push(LANE_K.L - 20 - SP_B * k); N_S0.push(20 + SP_B * k); }   // 前 4 個會出管口
  const T_EXIT = 1.3, T_LAND = 2.0;
  const exitT = k => T_LAND + (20 + SP_B * k) / V_B;                     // 第 k 個離子抵達管口的時間（第 4 步）
  const T_NEUTRAL = exitT(3) + T_EXIT;                                     // 最後一個游到位置＝兩杯回到電中性
  // 電子路徑（成對反應用；流動用）
  const GAP = 26;
  const EP1 = mkPath([{ x: ZX, y: RY[1] }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: RY[1] }]);
  const EP2 = mkPath([{ x: ZX, y: RY[2] }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: RY[2] }]);
  const EPF = mkPath([{ x: ZX, y: 330 }, { x: ZX, y: WY }, { x: CX, y: WY }, { x: CX, y: 330 }]);
  const V_E = 385, V_F = 340, SP_F = 180;
  // 第 2 步的反應（等速）與第 3 步的反應（流量 f＝1−smoothstep，平滑降到 0）
  const Fd = u => u - u * u * u + u * u * u * u / 2;                     // ∫(1−smoothstep)
  const T3 = 7.5;
  const RX1 = { ta: 0.6, ts: 1.4, t0: 2.4, tc0: 3.4, row: RY[1], P: EP1 };
  RX1.tArr = RX1.t0 + (EP1.L - GAP) / V_E;
  RX1.s = tl => clamp(V_E * (tl - RX1.t0), 0, EP1.L - GAP);
  const RX2 = { ta: 0.0, ts: 0.4, t0: 1.0, tc0: 2.8, row: RY[2], P: EP2 };
  RX2.tArr = RX2.t0 + 0.8 * T3;
  const V3 = (EP2.L - GAP) / (T3 * Fd(0.8));
  RX2.s = tl => clamp(V3 * T3 * Fd(clamp((tl - RX2.t0) / T3, 0, 1)), 0, EP2.L - GAP);
  const flow3 = tl => tl < RX2.t0 ? 1 : 1 - ease((tl - RX2.t0) / T3);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['組裝', 'Set up'],
      cap: ['鋅銅電池：兩杯溶液、兩片電極、外導線與電壓表', 'The Zn-Cu cell: two cups, two electrodes, a wire, a voltmeter'],
      bot: ['負極 Zn 浸在硫酸鋅溶液，正極 Cu 浸在硫酸銅溶液；先不接鹽橋', 'Negative Zn in ZnSO₄, positive Cu in CuSO₄; no salt bridge yet'],
      res: ['鋅銅電池：左杯的鋅片浸在硫酸鋅溶液（Zn²⁺、SO₄²⁻），是負極；右杯的銅片浸在藍綠色的硫酸銅溶液（Cu²⁺、SO₄²⁻），是正極。兩片電極用外導線連到電壓表，指針在零；先不接鹽橋。',
        'The Zn-Cu cell: in the left cup a zinc plate sits in zinc sulfate solution (Zn²⁺, SO₄²⁻) — the negative electrode; in the right cup a copper plate sits in blue-green copper sulfate solution (Cu²⁺, SO₄²⁻) — the positive electrode. An outer wire joins them through a voltmeter, needle at zero. No salt bridge yet.'] },
    { dur: 9, b: ['電子流動', 'e⁻ flow'],
      cap: ['接通：電子成對地從鋅片經外導線走到銅片', 'Connected: e⁻ go in pairs from Zn through the wire to Cu'],
      bot: ['鋅片變輕、送出電子；銅片變重、接收電子；電壓表指針偏轉', 'Zn gets lighter and gives e⁻; Cu gets heavier and takes e⁻; the needle swings'],
      res: ['鋅片上的鋅原子變成 Zn²⁺ 進入左杯，留下 2 個電子（Zn → Zn²⁺ ＋ 2e⁻）。電子成對地只走外電路，到了銅片，右杯的 Cu²⁺ 在銅片上接收 2 個電子變成銅（Cu²⁺ ＋ 2e⁻ → Cu）。鋅片變輕、銅片變重，電壓表指針偏轉。',
        'A zinc atom on the plate becomes Zn²⁺ and enters the left cup, leaving 2 electrons behind (Zn → Zn²⁺ + 2e⁻). The electrons travel in pairs, only through the outer circuit, to the copper plate, where a Cu²⁺ ion from the right cup takes 2 electrons and becomes copper (Cu²⁺ + 2e⁻ → Cu). Zinc gets lighter, copper gets heavier, and the needle swings.'] },
    { dur: 10, b: ['沒有鹽橋', 'No bridge'],
      cap: ['沒有鹽橋：兩杯電荷失去平衡，反應很快停止', 'No salt bridge: the cups lose charge balance, and it stops'],
      bot: ['電子流越來越小，最後停住，電壓表指針回到零', 'The e⁻ flow shrinks, then stops; the needle returns to zero'],
      res: ['沒有鹽橋時，左杯 Zn²⁺ 越來越多、右杯 Cu²⁺ 越來越少，兩杯各自的電荷失去平衡：左杯正電荷偏多，右杯負電荷偏多。電子流越來越小，反應很快停止，電壓表指針回到零。',
        'Without a salt bridge, Zn²⁺ builds up in the left cup while Cu²⁺ runs low in the right cup, so each cup loses its charge balance: too much positive on the left, too much negative on the right. The electron flow dies away, the reaction soon stops, and the needle returns to zero.'] },
    { dur: 9, b: ['裝上鹽橋', 'Add bridge'],
      cap: ['裝上鹽橋：NO₃⁻ 游向左杯、K⁺ 游向右杯', 'Add the salt bridge: NO₃⁻ swim to the left cup, K⁺ to the right'],
      bot: ['兩杯回到電中性，電子又持續流動，指針偏轉', 'Both cups neutral again: e⁻ keep flowing, the needle swings'],
      res: ['裝上鹽橋（飽和 KNO₃）：NO₃⁻ 游向 Zn²⁺ 變多的左杯，K⁺ 游向 Cu²⁺ 變少的右杯，兩杯都維持電中性。電子又能持續流動，電池能持續供電。',
        'Add the salt bridge (saturated KNO₃): NO₃⁻ swim into the left cup, where Zn²⁺ is building up, and K⁺ swim into the right cup, where Cu²⁺ is running low, so both cups stay electrically neutral. Electrons can keep flowing, and the cell keeps supplying power.'] },
    { dur: 8, b: ['兩條路', 'Two paths'],
      cap: ['電子走導線、離子走溶液與鹽橋：兩條路都要通', 'e⁻ use the wire, ions use solution and bridge: both must be open'],
      bot: ['閉合迴路：電子不進溶液，離子不進導線，兩條路都要通', 'Closed loop: e⁻ stay out of the solution, ions stay out of the wire'],
      res: ['閉合迴路要兩條路都通：電子走外導線（鋅片 → 導線 → 銅片），離子走溶液與鹽橋。電子不進溶液，離子不進導線；少了鹽橋，迴路就斷了。',
        'A closed loop needs both paths open: electrons use the outer wire (Zn plate → wire → Cu plate), and ions use the solutions and the salt bridge. Electrons never enter the solution and ions never enter the wire; without the salt bridge, the loop is broken.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  // 一次「成對電子」反應：鋅原子 → Zn²⁺ ＋ 2e⁻；電子沿 R.P 走；Cu²⁺ ＋ 2e⁻ → Cu（貼進銅片）
  function reaction(S, R, tl, nZ0, nC0, slotL, slotR) {
    const zEdge = ZX + (EW - DW * nZ0) / 2, cEdge = CX - (EW + DW * nC0) / 2, row = R.row;
    const ax = zEdge + 10, mz = ease((tl - R.ts) / 0.7);
    S.atoms.push({ x: ax, y: row, kind: 'zn', a: ease((tl - R.ta) / 0.4) * swapOut(mz) });
    S.left.push({ x: lerp(ax, slotL.x, ease((tl - R.ts - 0.35) / 0.6)), y: row + (slotL.y - row) * ease((tl - R.ts - 0.35) / 0.6), s: 'Zn²⁺', k: 0, a: swapIn(mz), j: 0 });
    S.rings.push({ x: ax, y: row, age: tl - R.ta - 0.2, c: K.white, r: 20 });
    const dz = ease((tl - R.ts) / 0.7);
    // 電子
    const s = R.s(tl), L = R.P.L;
    if (tl >= R.ts) {
      if (tl < R.t0) {
        const k = ease((tl - R.ts) / (R.t0 - R.ts)), al = ease((tl - R.ts) / 0.25);
        S.balls.push({ x: lerp(ax, ZX, k), y: lerp(row, row - GAP, k), a: al }, { x: lerp(ax, ZX, k), y: row, a: al });
      } else if (tl < R.tArr) {
        const A = at(R.P, s + GAP), B = at(R.P, s);
        S.balls.push({ x: A.x, y: A.y, a: 1 }, { x: B.x, y: B.y, a: 1 });
        if (Math.abs(A.y - WY) < 1 && Math.abs(B.y - WY) < 1) S.pairLabel = { x: (A.x + B.x) / 2, a: 1 };
      } else {
        const k = ease((tl - R.tArr) / 0.3), al = 1 - ease((tl - R.tArr - 0.3) / 0.4);
        S.balls.push({ x: lerp(CX, cEdge - 2, k), y: lerp(row, row - 6, k), a: al }, { x: lerp(CX, cEdge - 2, k), y: lerp(row - GAP, row + 6, k), a: al });
      }
    }
    // Cu²⁺ 靠近銅片，接到電子後變成銅原子，再併進銅片
    const hw = pillHalf(S.ctx, 'Cu²⁺'), go = ease((tl - R.tc0) / 1.2), mc = ease((tl - R.tArr - 0.3) / 0.6);
    S.right.push({ x: lerp(slotR.x, cEdge - hw - 2, go), y: slotR.y, s: 'Cu²⁺', k: 0, a: swapOut(mc), j: 1 - go, hot: go * (1 - mc) });
    S.atoms.push({ x: cEdge - 10, y: row, kind: 'cu', a: swapIn(mc) * (1 - ease((tl - R.tArr - 1.0) / 0.5)) });
    S.rings.push({ x: cEdge - 6, y: row, age: tl - R.tArr - 0.3, c: K.electron, r: 12 });
    const dc = ease((tl - R.tArr - 1.0) / 0.5);
    return { dz, dc, flowOn: tl >= R.t0 && tl < R.tArr };
  }

  function state(i, tl, T, ctx) {
    const S = { ctx, left: [], right: [], atoms: [], balls: [], rings: [], pairLabel: null,
      nZ: 0, nC: 0, f: 0, needle: 0, flowD: null, bridge: null, ghost: 0, imbL: 0, imbR: 0, neutral: 0, more: 0,
      build: i === 0 ? tl : 99, nIn: 0 };
    const jig = (k) => ({ x: 2 * Math.sin(T * 1.7 + k * 1.31), y: 2 * Math.sin(T * 2.3 + k * 2.07) });
    const ionA = k => (i === 0 ? ease((tl - 2.9 - k * 0.06) / 0.5) : 1);
    // 一開始就在杯內的離子
    [[1, 0, 'SO₄²⁻', 1], [1, 1, 'Zn²⁺', 0], [1, 2, 'SO₄²⁻', 1], [1, 3, 'Zn²⁺', 0]].forEach(([c, r, s, kk], n) =>
      S.left.push({ x: LC[c], y: RY[r], s, k: kk, a: ionA(n), j: 1 }));
    [[1, 0, 'SO₄²⁻', 1], [1, 1, 'Cu²⁺', 0], [1, 2, 'SO₄²⁻', 1], [1, 3, 'SO₄²⁻', 1]].forEach(([c, r, s, kk], n) =>
      S.right.push({ x: RC[c], y: RY[r], s, k: kk, a: ionA(n + 4), j: 1 }));
    // 兩次反應用到的離子
    const zSlot = [{ x: LC[0], y: RY[1] }, { x: LC[0], y: RY[2] }], cSlot = [{ x: RC[0], y: RY[1] }, { x: RC[0], y: RY[2] }];
    if (i === 0) cSlot.forEach((p, n) => S.right.push({ x: p.x, y: p.y, s: 'Cu²⁺', k: 0, a: ionA(8 + n), j: 1 }));
    if (i === 1) {
      const r1 = reaction(S, RX1, tl, 0, 0, zSlot[0], cSlot[0]);
      S.right.push({ x: cSlot[1].x, y: cSlot[1].y, s: 'Cu²⁺', k: 0, a: 1, j: 1 });
      S.nZ = r1.dz; S.nC = r1.dc;
      S.f = ease((tl - RX1.t0) / 0.4); S.needle = swing(tl - RX1.t0);
    }
    if (i >= 2) S.left.push({ x: zSlot[0].x, y: zSlot[0].y, s: 'Zn²⁺', k: 0, a: 1, j: 1 });
    if (i === 2) {
      const r2 = reaction(S, RX2, tl, 1, 1, zSlot[1], cSlot[1]);
      S.nZ = 1 + r2.dz; S.nC = 1 + r2.dc;
      S.f = flow3(tl); S.needle = S.f;
      S.more = ease((tl - 1.0) / 0.6);
      const k2 = ease((tl - RX2.ts) / 0.7) * 0.5 + 0.5 * ease((tl - RX2.tArr - 0.3) / 0.6);
      S.imbL = S.more * (0.55 + 0.45 * k2); S.imbR = S.imbL;
      S.ghost = ease((tl - 8.0) / 0.6);
    }
    if (i >= 3) { S.left.push({ x: zSlot[1].x, y: zSlot[1].y, s: 'Zn²⁺', k: 0, a: 1, j: 1 }); S.nZ = 2; S.nC = 2; }
    if (i === 0) { S.neutral = ease((tl - 5.6) / 0.6) * 0.75; S.ghost = ease((tl - 6.0) / 0.6); }
    // 鹽橋
    if (i >= 3) {
      const B = { dy: 0, D: 0, exitK: [], exitN: [] };
      if (i === 3) {
        const p = clamp((tl - 0.3) / 1.4, 0, 1);
        B.dy = -330 * (1 - p * p);
        if (tl > 1.7 && tl < 2.1) B.dy = -7 * Math.sin(Math.PI * (tl - 1.7) / 0.4);
        B.contact = tl - (0.3 + 1.4 * Math.sqrt(1 - (BBY - LIQ) / 330));
        B.D = V_B * clamp(tl - T_LAND, 0, D_MAX / V_B) + 3 * Math.max(0, tl - T_LAND - D_MAX / V_B);
        B.p = [0, 1, 2, 3].map(k => clamp((tl - exitT(k)) / T_EXIT, 0, 1));
        B.started = [0, 1, 2, 3].map(k => tl >= exitT(k));
        B.label = ease((tl - 2.0) / 0.5);
        B.arrows = ease((tl - 2.3) / 0.5);
        S.f = ease((tl - 2.4) / 1.2); S.needle = swing(tl - 2.6);
        const a = 2.4, b = 3.6;
        if (tl > a) { const u = clamp((tl - a) / (b - a), 0, 1); S.flowD = V_F * (b - a) * (u * u * u - u * u * u * u / 2) + V_F * Math.max(0, tl - b); }
        const landed = B.p.reduce((s, q) => s + ease((q - 0.55) / 0.45), 0);
        S.nIn = landed;
        S.more = 1; S.imbL = S.imbR = (4 - landed) / 4;
        S.swapN = ease((tl - T_NEUTRAL) / 0.6);
      } else {
        B.D = D_MAX + 3 * (STEPS[3].dur - T_LAND - D_MAX / V_B + tl);
        B.p = [1, 1, 1, 1]; B.started = [true, true, true, true]; B.label = 1; B.arrows = 1;
        S.f = 1; S.needle = 1; S.nIn = 4; S.swapN = 1;
        const a = 2.4, b = 3.6, d4 = V_F * (b - a) / 2 + V_F * (STEPS[3].dur - b);
        S.flowD = d4 + V_F * tl;
      }
      S.bridge = B;
      // 出管口的離子 → 杯內膠囊
      B.p.forEach((q, k) => {
        if (!B.started[k]) return;
        const m = ease(q / 0.45), e = ease(q);
        const n0 = at(LANE_N, 0), k0 = at(LANE_K, LANE_K.L);
        const nT = { x: LC[2], y: RY[k] }, kT = { x: RC[2], y: RY[k] };
        const bz = (P0, P2, u) => { const P1 = { x: P0.x + (P2.x - P0.x) * 0.6, y: P0.y + 16 }; return { x: (1 - u) * (1 - u) * P0.x + 2 * u * (1 - u) * P1.x + u * u * P2.x, y: (1 - u) * (1 - u) * P0.y + 2 * u * (1 - u) * P1.y + u * u * P2.y }; };
        const pn = bz(n0, nT, e), pk = bz(k0, kT, e);
        B.exitN.push({ x: pn.x, y: pn.y, a: swapOut(m) });
        B.exitK.push({ x: pk.x, y: pk.y, a: swapOut(m) });
        S.left.push({ x: pn.x, y: pn.y, s: 'NO₃⁻', k: 1, a: swapIn(m), j: e });
        S.right.push({ x: pk.x, y: pk.y, s: 'K⁺', k: 0, a: swapIn(m), j: e });
      });
    }
    // 中性／偏多標示的切換
    if (i === 3) S.neutral = S.swapN;
    if (i === 4) S.neutral = 1;
    S.jig = jig;
    return S;
  }

  // ───────── 圖形：燒杯、溶液、電極 ─────────
  function beakerPath(ctx, c) {
    const x0 = c.x0, x1 = c.x1;
    ctx.beginPath();
    ctx.moveTo(x0 - 8, BRIM - 6); ctx.quadraticCurveTo(x0, BRIM - 4, x0, BRIM + 8);
    ctx.lineTo(x0, BBOT - 16); ctx.quadraticCurveTo(x0, BBOT, x0 + 16, BBOT);
    ctx.lineTo(x1 - 16, BBOT); ctx.quadraticCurveTo(x1, BBOT, x1, BBOT - 16);
    ctx.lineTo(x1, BRIM + 8); ctx.quadraticCurveTo(x1, BRIM - 4, x1 + 8, BRIM - 6);
  }
  function innerClip(ctx, c, yTop) {
    const x0 = c.x0, x1 = c.x1;
    ctx.beginPath();
    ctx.moveTo(x0 + 2, yTop); ctx.lineTo(x0 + 2, BBOT - 16); ctx.quadraticCurveTo(x0 + 2, BBOT - 2, x0 + 16, BBOT - 2);
    ctx.lineTo(x1 - 16, BBOT - 2); ctx.quadraticCurveTo(x1 - 2, BBOT - 2, x1 - 2, BBOT - 16); ctx.lineTo(x1 - 2, yTop); ctx.closePath();
  }
  function beakerBack(ctx, c, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; innerClip(ctx, c, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore();
  }
  function liquid(ctx, c, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    innerClip(ctx, c, LIQ); ctx.fillStyle = c.sol; ctx.fill();
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ); ctx.lineTo(c.x1 - 2, LIQ); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, LIQ + 4); ctx.lineTo(c.x1 - 2, LIQ + 4); ctx.stroke();
    ctx.restore();
  }
  function liquidEdge(ctx, c, color, al, dash, off) {   // 溶液外框發光（電荷失衡、離子路徑）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = dash ? 5 : 4; ctx.shadowColor = color; ctx.shadowBlur = 14;
    if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = off || 0; }
    innerClip(ctx, c, LIQ + 3); ctx.stroke(); ctx.restore();
  }
  function beakerFront(ctx, c, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(ctx, c); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(ctx, c); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function metalGrad(ctx, kind, x0, w) {
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    return g;
  }
  // 電極：液面以上固定寬 EW，泡在溶液裡的部分寬 wSub（鋅變薄、銅變厚）
  function electrode(ctx, x, kind, wSub, dy, al) {
    if (al <= 0.01) return;
    const top = ETOP + dy, liq = LIQ + dy, bot = EBOT + dy;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = metalGrad(ctx, kind, x - EW / 2, EW);
    rrect(ctx, x - EW / 2, top, EW, liq - top + 1, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = metalGrad(ctx, kind, x - wSub / 2, wSub);
    rrect(ctx, x - wSub / 2, liq - 1, wSub, bot - liq + 1, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(16,58,72,0.42)'; rrect(ctx, x - wSub / 2, liq - 1, wSub, bot - liq + 1, 3); ctx.fill();
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 7, top - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }

  // ───────── 圖形：原子、離子、電子 ─────────
  function atom(ctx, x, y, kind, al) {
    if (al <= 0.01) return;
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - 6, y - 7, 3, x, y, 20);
    g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, kind === 'cu' ? 'Cu' : 'Zn', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 6; }
  function ionPill(ctx, x, y, s, kind, al, hot) {   // kind 0＝正離子（橘）、1＝負離子（紫）
    if (al <= 0.01) return;
    const hw = pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = hot ? K.white : c; ctx.shadowBlur = hot ? 8 + 10 * hot : 6;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill();
    if (hot) { ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,255,255,${0.9 * hot})`; ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ionBadge(ctx, x, y, kind, al) {        // 鹽橋管內：小圓＋「＋／−」
    if (al <= 0.01) return;
    const c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); ctx.restore();
    text(ctx, kind ? '−' : '+', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ball(ctx, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function ring(ctx, x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function wireLine(ctx, pts) {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(ctx, pts); ctx.stroke(); });
    ctx.restore();
  }
  function glowPath(ctx, pts, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al * 0.45; ctx.strokeStyle = color; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 18; strokePts(ctx, pts); ctx.stroke(); ctx.restore();
  }
  function meter(ctx, k, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(ctx, MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -65 * RAD, a1 = 65 * RAD, R = 40;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-58, 30, k) * RAD - Math.PI / 2;             // 零點在左，偏轉到右
    ctx.strokeStyle = '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function mark(ctx, ok, x, y, alpha, color) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color || (ok ? K.green : K.red); ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 5.5, y + 1); ctx.lineTo(x - 1, y + 5.5); ctx.lineTo(x + 6.5, y - 4.5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function warnIcon(ctx, x, y, color, al) {        // 小三角形驚嘆號（純圖形）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 13, y + 10); ctx.lineTo(x - 13, y + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 2); ctx.stroke();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(x, y + 6.5, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function arrowH(ctx, x0, x1, y, color, al) {    // 由 x0 指向 x1 的短箭頭
    if (al <= 0.01) return;
    const d = Math.sign(x1 - x0);
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - d * 10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - d * 13, y - 8); ctx.lineTo(x1 - d * 13, y + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ───────── 鹽橋 ─────────
  function ghostBridge(ctx, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.lineJoin = 'round';
    strokePts(ctx, lanePts(-TUBE_OUT + 2)); ctx.stroke();
    strokePts(ctx, lanePts(TUBE_OUT - 2)); ctx.stroke();
    ctx.restore();
  }
  function drawBridge(ctx, B, T, glowA) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 78, W, H - 78); ctx.clip();            // 落下時從說明句下方出現（不畫進最上方進度條與說明句）
    ctx.translate(0, B.dy);
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = TUBE_OUT * 2 + 4; strokePts(ctx, TUBE); ctx.stroke();
    ctx.strokeStyle = K.glass; ctx.lineWidth = TUBE_OUT * 2; strokePts(ctx, TUBE); ctx.stroke();
    ctx.strokeStyle = K.bg; ctx.lineWidth = TUBE_IN * 2; strokePts(ctx, TUBE); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,238,242,0.13)'; ctx.lineWidth = TUBE_IN * 2; strokePts(ctx, TUBE); ctx.stroke();   // 飽和 KNO₃
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = 2; strokePts(ctx, lanePts(-TUBE_IN + 4)); ctx.stroke(); // 玻璃反光
    if (glowA > 0.01) {                                                 // 第 5 步：離子路徑（橘紫交錯虛線）
      ctx.save(); ctx.globalAlpha *= glowA; ctx.lineWidth = 5; ctx.setLineDash([14, 14]);
      ctx.strokeStyle = K.pos; ctx.lineDashOffset = -T * 30; ctx.shadowColor = K.pos; ctx.shadowBlur = 10; strokePts(ctx, TUBE); ctx.stroke();
      ctx.strokeStyle = K.neg; ctx.lineDashOffset = -T * 30 + 14; ctx.shadowColor = K.neg; strokePts(ctx, TUBE); ctx.stroke();
      ctx.restore();
    }
    // 管內離子：K⁺ 往右口、NO₃⁻ 往左口；前 4 個出管口後改由杯內膠囊接手
    K_S0.forEach((s0, k) => {
      if (k < 4 && B.started && B.started[k]) return;
      const s = s0 + B.D + 3 * Math.sin(T * 2.1 + k * 1.7);
      if (s > LANE_K.L) return;
      const p = at(LANE_K, s); ionBadge(ctx, p.x, p.y, 0, clamp((LANE_K.L - s) / 14, 0, 1));
    });
    N_S0.forEach((s0, k) => {
      if (k < 4 && B.started && B.started[k]) return;
      const s = s0 - B.D + 3 * Math.sin(T * 1.9 + k * 2.3);
      if (s < 0) return;
      const p = at(LANE_N, s); ionBadge(ctx, p.x, p.y, 1, clamp(s / 14, 0, 1));
    });
    ctx.restore();
    // 剛出管口、還沒變成膠囊的小圓
    (B.exitN || []).forEach(e => ionBadge(ctx, e.x, e.y, 1, e.a));
    (B.exitK || []).forEach(e => ionBadge(ctx, e.x, e.y, 0, e.a));
  }

  // ───────── 電子流（第 4、5 步）：一對一對沿 EPF 走 ─────────
  function flowE(ctx, d) {
    if (d === null || d <= 0) return;
    const L = EPF.L;
    for (let k = -1; k * SP_F < L + SP_F; k++) {
      const s0 = k * SP_F + (d % SP_F);
      [0, -GAP].forEach(off => {
        const s = s0 + off;
        if (s < 0 || s > L || s > d) return;
        const p = at(EPF, s), fade = clamp(Math.min(s, L - s) / 22, 0, 1) * clamp((d - s) / 20, 0, 1);
        ball(ctx, p.x, p.y, 8, fade);
      });
    }
  }

  // ───────── 標示：偏多／電中性、量表 ─────────
  function tagBox(ctx, x, y, s, color, al, icon, glow) {
    if (al <= 0.01) return;
    const z = 24, tw = textW(ctx, s, z), iw = icon ? 34 : 0, w = tw + iw + 26, x0 = x - w / 2;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    rrect(ctx, x0, y - 20, w, 40, 12); ctx.fill(); ctx.stroke(); ctx.restore();
    if (icon === 'warn') warnIcon(ctx, x0 + 13 + 13, y, color, al);
    if (icon === 'ok') mark(ctx, true, x0 + 13 + 13, y, al, color);
    text(ctx, s, x0 + 13 + iw + tw / 2, y + 1, color, z, 'center', al);
  }
  const TAG_Y = 206, LTX = 216, RTX = 784;
  function gauge(ctx, f, status, al) {
    if (al <= 0.01) return;
    text(ctx, tr('電子流', 'e⁻ flow'), MX, 316, K.electron, 22, 'center', al);
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(77,210,255,0.14)'; rrect(ctx, MX - 70, 339, 140, 16, 8); ctx.fill();
    if (f > 0.005) { ctx.fillStyle = K.electron; ctx.shadowColor = K.electron; ctx.shadowBlur = 8; rrect(ctx, MX - 70, 339, Math.max(16, 140 * f), 16, 8); ctx.fill(); }
    ctx.restore();
    status.forEach(([s, c, a]) => text(ctx, s, MX, 382, c, 22, 'center', al * a));
  }

  // ───────── 說明句、圖例、進度條 ─────────
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function drawLegend(ctx, al) {
    const items = [[tr('藍球 e⁻＝電子（只走金屬與導線）', 'Blue ball e⁻ = electron (metal and wire only)'), 'b'],
      [tr('橘＝正離子、紫＝負離子（只在溶液與鹽橋）', 'Orange = positive ion, purple = negative ion (solution and bridge only)'), 'i']];
    const z = 22, gapIcon = 40, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    const rows = tot <= maxW ? [items.map((_, k) => k)] : items.map((_, k) => [k]);
    const ys = rows.length === 1 ? [574] : [560, 586];
    rows.forEach((rw, r) => {
      const tw = rw.reduce((a, k) => a + wid[k], 0) + gapItem * (rw.length - 1);
      let x = W / 2 - tw / 2;
      rw.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        ctx.save(); ctx.globalAlpha = al;
        if (kind === 'b') ball(ctx, x + 14, y, 7, 1);
        else { ctx.fillStyle = K.pos; rrect(ctx, x, y - 7, 14, 14, 7); ctx.fill(); ctx.fillStyle = K.neg; rrect(ctx, x + 17, y - 7, 14, 14, 7); ctx.fill(); }
        ctx.restore();
        text(ctx, s, x + gapIcon, y, K.white, z, 'left', al);
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const z = fitSize(ctx, cap, 950, 26);
    text(ctx, wrap(ctx, cap, 950, z)[0], W / 2, 58, K.yellow, z);
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function equation(ctx, terms, cx, y, maxW) {
    const str = terms.map(g => g[0]).join(''), z = fitSize(ctx, str, maxW, 26, true);
    const ws = terms.map(g => textW(ctx, g[0], z, true)), tot = ws.reduce((a, b) => a + b, 0);
    let x = cx - tot / 2;
    terms.forEach((g, k) => { text(ctx, g[0], x, y, g[1], z, 'left', g[2], true); x += ws[k]; });
  }

  // ───────── 整個畫面 ─────────
  function drawScene(ctx, i, tl, T) {
    const S = state(i, tl, T, ctx);
    const b = S.build, A = t0 => ease((b - t0) / 0.6);
    const a = t0 => ease((tl - t0) / 0.5);
    const cupA = A(0.1), liqA = A(0.7);
    // 背景層：燒杯、電極、溶液
    CUPS.forEach(c => beakerBack(ctx, c, cupA));
    const zW = EW - DW * S.nZ, cW = EW + DW * S.nC;
    electrode(ctx, ZX, 'zn', zW, i === 0 ? -50 * (1 - A(1.4)) : 0, A(1.4));
    electrode(ctx, CX, 'cu', cW, i === 0 ? -50 * (1 - A(1.7)) : 0, A(1.7));
    CUPS.forEach(c => liquid(ctx, c, liqA));
    // 電荷失衡：左杯外框橘光、右杯外框紫光；第 5 步：離子路徑虛線
    const pulse = 0.75 + 0.25 * Math.sin(T * 5);
    liquidEdge(ctx, CUPS[0], K.pos, S.imbL * pulse * (i === 3 ? 1 : 1), null);
    liquidEdge(ctx, CUPS[1], K.neg, S.imbR * pulse, null);
    const ionGlow = i === 4 ? a(1.6) : 0;
    liquidEdge(ctx, CUPS[0], K.pos, ionGlow * 0.9, [14, 14], -T * 30);
    liquidEdge(ctx, CUPS[0], K.neg, ionGlow * 0.9, [14, 14], -T * 30 + 14);
    liquidEdge(ctx, CUPS[1], K.pos, ionGlow * 0.9, [14, 14], -T * 30);
    liquidEdge(ctx, CUPS[1], K.neg, ionGlow * 0.9, [14, 14], -T * 30 + 14);
    // 鹽橋（虛線預留位置／實體）
    ghostBridge(ctx, S.ghost * (i === 0 ? 0.8 : 1), i === 2 ? K.red : K.muted);
    if (S.bridge) drawBridge(ctx, S.bridge, T, ionGlow);
    if (S.bridge && i === 3) { ring(ctx, BLX, LIQ, S.bridge.contact, K.white, 14); ring(ctx, BRX, LIQ, S.bridge.contact, K.white, 14); }
    // 杯內離子、原子
    const jg = (o, k) => { const q = S.jig(k); return { x: o.x + q.x * (o.j || 0), y: o.y + q.y * (o.j || 0) }; };
    S.left.forEach((o, k) => { const p = jg(o, k); ionPill(ctx, p.x, p.y, o.s, o.k, o.a, o.hot); });
    S.right.forEach((o, k) => { const p = jg(o, k + 20); ionPill(ctx, p.x, p.y, o.s, o.k, o.a, o.hot); });
    S.atoms.forEach(o => atom(ctx, o.x, o.y, o.kind, o.a));
    CUPS.forEach(c => beakerFront(ctx, c, cupA));
    // 外導線、電子、電壓表
    const wk = i === 0 ? ease((b - 4.0) / 1.4) : 1;
    if (i === 4) glowPath(ctx, WIRE, a(0.5), K.electron);
    wireLine(ctx, partial(WIRE, wk));
    S.balls.forEach(e => ball(ctx, e.x, e.y, 8, e.a));
    flowE(ctx, S.flowD);
    meter(ctx, S.needle, A(4.4));
    if (S.pairLabel && Math.abs(S.pairLabel.x - MX) > 100) text(ctx, '2e⁻', S.pairLabel.x, 88, K.electron, 22, 'center', 1, true);
    S.rings.forEach(r => ring(ctx, r.x, r.y, r.age, r.c, r.r));
    // 標註：電極、溶液、電壓表
    text(ctx, tr('負極 Zn', 'Zn (negative)'), ZX + 20, 142, K.znHi, 26, 'left', A(2.4));
    text(ctx, tr('正極 Cu', 'Cu (positive)'), CX - 20, 142, K.cuHi, 26, 'right', A(2.7));
    text(ctx, tr('硫酸鋅溶液', 'ZnSO₄ solution'), LTX, 264, K.muted, 22, 'center', A(3.4));
    text(ctx, tr('硫酸銅溶液', 'CuSO₄ solution'), RTX, 264, K.cyan, 22, 'center', A(3.6));
    if (i <= 2) text(ctx, tr('電壓表', 'Voltmeter'), MX, 166, K.white, 22, 'center', A(5.0));
    // 中間欄：鹽橋名稱／預留位置
    if (i === 0) {
      text(ctx, tr('鹽橋', 'Salt bridge'), MX, 246, K.muted, 22, 'center', S.ghost);
      text(ctx, tr('（先不接）', '(not yet)'), MX, 274, K.muted, 22, 'center', S.ghost);
    }
    if (i === 2) text(ctx, tr('沒有鹽橋', 'No bridge'), MX, 260, K.red, 24, 'center', S.ghost);
    if (S.bridge) {
      const la = S.bridge.label;
      text(ctx, tr('鹽橋', 'Salt bridge'), MX, 246, K.white, 22, 'center', la);
      text(ctx, tr('飽和 KNO₃', 'sat. KNO₃'), MX, 274, K.white, 22, 'center', la);
      // 管上方：NO₃⁻ 往左、K⁺ 往右
      const ar = S.bridge.arrows, nw = textW(ctx, 'NO₃⁻', 22, true);
      arrowH(ctx, 412, 372, 164, K.neg, ar); text(ctx, 'NO₃⁻', 418 + nw / 2, 164, K.neg, 22, 'center', ar, true);
      const kw = textW(ctx, 'K⁺', 22, true);
      arrowH(ctx, 588, 628, 164, K.pos, ar); text(ctx, 'K⁺', 582 - kw / 2, 164, K.pos, 22, 'center', ar, true);
    }
    // 各步的上方說明（兩杯上方）與量表
    if (i === 0) {
      tagBox(ctx, LTX, TAG_Y, tr('電中性', 'neutral'), K.green, S.neutral, 'ok');
      tagBox(ctx, RTX, TAG_Y, tr('電中性', 'neutral'), K.green, S.neutral, 'ok');
    }
    if (i === 1) {
      equation(ctx, [['Zn', K.znHi, a(1.6)], [' → ', K.white, a(1.9)], ['Zn²⁺', K.pos, a(1.9)], [' + ', K.white, a(2.3)], ['2e⁻', K.electron, a(2.3)]], LTX, 188, 236);
      equation(ctx, [['Cu²⁺', K.pos, a(RX1.tArr)], [' + ', K.white, a(RX1.tArr)], ['2e⁻', K.electron, a(RX1.tArr)], [' → ', K.white, a(RX1.tArr + 0.5)], ['Cu', K.cuHi, a(RX1.tArr + 0.5)]], RTX, 188, 236);
      text(ctx, tr('變輕，送出 e⁻', 'lighter, gives e⁻'), LTX, 224, K.white, 22, 'center', a(6.9));
      text(ctx, tr('變重，接收 e⁻', 'heavier, takes e⁻'), RTX, 224, K.white, 22, 'center', a(7.1));
    }
    if (i === 2 || i === 3) {
      const g = 6 + 10 * pulse * S.more, mOut = i === 3 ? swapOut(S.swapN) : 1;
      tagBox(ctx, LTX, TAG_Y, tr('＋偏多', 'more +'), K.pos, S.more * mOut, 'warn', g);
      tagBox(ctx, RTX, TAG_Y, tr('−偏多', 'more −'), K.neg, S.more * mOut, 'warn', g);
      if (i === 3) {
        tagBox(ctx, LTX, TAG_Y, tr('電中性', 'neutral'), K.green, swapIn(S.swapN), 'ok');
        tagBox(ctx, RTX, TAG_Y, tr('電中性', 'neutral'), K.green, swapIn(S.swapN), 'ok');
      }
    }
    if (i === 4) {
      tagBox(ctx, LTX, TAG_Y, tr('電中性', 'neutral'), K.green, 1, 'ok');
      tagBox(ctx, RTX, TAG_Y, tr('電中性', 'neutral'), K.green, 1, 'ok');
    }
    if (i === 1) gauge(ctx, S.f, [[tr('流動中', 'flowing'), K.electron, a(RX1.t0)]], a(0.4));
    if (i === 2) gauge(ctx, S.f, [[tr('變小…', 'slowing…'), K.yellow, clamp((S.f - 0.06) / 0.06, 0, 1) * a(1.4)],
      [tr('停止', 'stopped'), K.red, clamp((0.04 - S.f) / 0.04, 0, 1)]], 1);
    if (i === 3) gauge(ctx, S.f, [[tr('停止', 'stopped'), K.red, clamp((0.04 - S.f) / 0.04, 0, 1)],
      [tr('恢復流動', 'flowing again'), K.electron, clamp((S.f - 0.06) / 0.06, 0, 1)]], 1);
    if (i === 4) {
      text(ctx, tr('電子：只走外導線', 'Electrons: outer wire only'), 250, 88, K.electron, 22, 'center', a(0.8));
      text(ctx, tr('閉合迴路', 'Closed loop'), MX, 318, K.yellow, 24, 'center', a(2.4));
      const r1 = tr('電子路徑', 'e⁻ path'), r2 = tr('離子路徑', 'Ion path');
      const rw = Math.max(textW(ctx, r1, 22), textW(ctx, r2, 22)) + 32, rx = MX - rw / 2;
      mark(ctx, true, rx + 12, 356, a(3.0), K.electron); text(ctx, r1, rx + 32, 356, K.electron, 22, 'left', a(3.0));
      mark(ctx, true, rx + 12, 392, a(3.6), K.pos); text(ctx, r2, rx + 32, 392, K.pos, 22, 'left', a(3.6));
    }
    // 下方一句
    const botAt = [6.4, 7.3, 7.2, 6.8, 4.4][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), i === 4 ? K.yellow : K.yellow, a(botAt));
    drawLegend(ctx, i === 0 ? A(3.0) : 1);
    return S;
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const P = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true, lastS = null;
  const canvas = () => document.getElementById('cellAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('cellAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c || !c.width) return;
    const ctx = c.getContext('2d'), i = stepAt(P.t), st = STEPS[i], tl = P.t - STARTS[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    lastS = drawScene(ctx, i, tl, P.t);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, P.t);
    if (i !== P.step) { P.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const r = document.getElementById('steps-cell');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === P.step));
  }
  function jumpTo(k) {
    if (!P.on) return;
    P.t = STARTS[k] + 1e-4; P.step = -1; P.last = 0; P.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-cell'); if (!r) return;
    r.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(P.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      r.appendChild(b);
    });
  }
  function visible() { const c = canvas(); return !!(c && c.offsetWidth > 0 && c.getClientRects().length); }
  function frame(ts) {
    P.raf = 0;
    if (!P.on || document.hidden) return;
    if (!visible()) { P.last = 0; P.timer = setTimeout(() => { P.timer = 0; start(); }, 250); return; }
    const c = ctl();
    if (P.last && !(c && c.paused)) P.t += Math.min(0.1, (ts - P.last) / 1000);
    P.last = ts;
    const kk = P.step >= 0 ? P.step : stepAt(P.t);
    const end = stepStop ? (STARTS[kk + 1] !== undefined ? STARTS[kk + 1] : TOTAL) : TOTAL;
    if (P.t >= end) {
      P.t = end - 1e-3; render();
      if (!stepStop && !P.ended && c && typeof c.onEnd === 'function') { P.ended = true; c.onEnd(); }
      return;
    }
    render();
    P.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!P.on || P.raf || P.timer || document.hidden) return;
    P.last = 0; P.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (P.raf) cancelAnimationFrame(P.raf); P.raf = 0;
    if (P.timer) clearTimeout(P.timer); P.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (P.on) start(); });

  window.GbAnim.cell = {
    activate() {
      stop();
      P.on = true; P.t = 0; P.step = -1; P.last = 0; P.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      P.on = false; P.step = -1; lastResult = '';
      const r = document.getElementById('steps-cell'); if (r) r.innerHTML = '';
      const o = document.getElementById('cellAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!P.on) return;
      const k = stepAt(P.t);
      lastResult = ''; buildButtons(); P.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (P.on) start(); },
    _frameAt(t) { P.t = clamp(t, 0, TOTAL - 1e-3); P.step = -1; render(); return TOTAL; },
    _info() { return { cell: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() {
      const S = lastS;
      return { scene: P.on ? 'cell' : null, t: P.t, step: P.step, running: !!P.raf,
        needle: S ? +S.needle.toFixed(3) : 0, flow: S ? +S.f.toFixed(3) : 0,
        bridgeDy: S && S.bridge ? +S.bridge.dy.toFixed(1) : null, ionsIn: S ? +S.nIn.toFixed(2) : 0,
        zincW: S ? +(EW - DW * S.nZ).toFixed(1) : EW, copperW: S ? +(EW + DW * S.nC).toFixed(1) : EW };
    }
  };
})();
