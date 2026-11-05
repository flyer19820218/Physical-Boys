/* electromagnetic_induction_4_lab_gen_1105_v1.js — 「🔬 動手做：自己轉線圈」發電機實驗台（#genLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.gen = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU（直接呼叫，不複製）。其餘小工具在本檔內。
 * 控制鈕由本檔建立在 #genLabControls，說明字寫進 #genLabResult（只有文字改變時才寫）。
 *
 * ── 互動 ──────────────────────────────────────────────
 *   水平拖曳（畫布任何位置，Pointer Events）＝用手轉線圈：拖多少轉多少，500 px（半個畫布寬）＝一圈，可連續轉很多圈。
 *     往右拖＝從前方看順時針（本課動畫的「正轉」）；往左拖＝反轉。放手線圈就停（不慣性滑行）。方向鍵 ←／→ 每按一下轉 30°。
 *   按鈕：①換向裝置 分裂環（直流）／滑環（交流）——中央小圖真的換成分裂環＋兩電刷／兩個滑環＋兩電刷
 *         ②磁鐵強度 弱 ×1／強 ×2（磁力線 5 條／9 條，磁鐵標 ×1／×2）③線圈匝數 1／3／6
 *         ④模式 自己轉／自動慢轉（0.5 圈/秒）／自動快轉（1.2 圈/秒）；一拖曳就切回自己轉
 *   預設：分裂環、弱 ×1、3 匝、自動慢轉（一進來就有動態）。怎麼玩提示（24px）在第一次拖曳或按方向鍵後淡出。
 *
 * ── 公式與簡化 ─────────────────────────────────────────
 *   θ＝線圈從「中性面」（線圈面 ⊥B，AB 在正上方）起算、正轉方向的轉角；與本課動畫的 a（線圈面與 B 的夾角）關係：a＝π/2 − θ。
 *   ω＝dθ/dt（圈/秒，有正負）：線圈角以 τ＝0.05 s 跟上拖曳位置（方向鍵 0.15 s），每幀 (θ−θ前)/dt，再一階低通 τ＝0.08 s；停住 → ω、ε 平滑回 0。
 *   ε＝N·B·A·ω·sinθ（相對值，A 取 1）＝沿 A→B 的感應電動勢；ε>0 ⇔ AB 邊電流往裡（⊗）。
 *   外電路輸出 V（＝外電路電流 I，外電阻固定、相對值）：滑環 V＝ε；分裂環 V＝N·B·ω·|sinθ|（正轉恆 ≥0、反轉恆 ≤0）。
 *   V 的正向＝電流從左電刷流出（左電刷 ＋）＝檢流計指針向右，與本課動畫相同。
 *   刻度：波形與檢流計滿格 FS＝5（例：3 匝×弱×1.67 圈/秒）；超過就頂在邊上並標「超出刻度」。
 *   檢流計：指針目標角＝1.1·clamp(V/FS, ±1.15)，阻尼彈簧（ω₀＝14 rad/s、ζ＝0.7）。波形：最近 4 秒的 V，橫軸時間。
 *   不模擬線圈電阻、自感、外力矩與轉動慣量（拖多少轉多少）。
 *
 * ── 方向表（從前方〔換向裝置那端〕看；S 左、N 右，B 水平向左；與 electromagnetic_induction_4_gen_1105_v1.js 檔頭相同）──
 *   AB 邊位置：(sinθ, −cosθ)×R（畫面座標，y 向下）；θ＝0 在上、90° 在右（靠 N）、180° 在下、270° 在左（靠 S）。
 *   正轉（ω>0，順時針）：
 *   θ          線圈       AB      CD      線圈內電流     流出線圈的端→接點          滑環外電路（左電刷）  分裂環外電路（左電刷）
 *   0°         ⊥B 中性面   —       —       0             （分裂環換向瞬間）           0                    0
 *   0°–180°    AB 在右    ⊗ 往裡  ⊙ 往外  A→B→C→D       D → 粉環／粉片              ＋（指針右、V>0）     ＋（粉片在左）
 *   90°        ∥B         ε 最大（切割最快）
 *   180°       ⊥B 中性面   —       —       0             分裂環：粉片／橘片交換電刷    0                    0
 *   180°–360°  AB 在左    ⊙ 往外  ⊗ 往裡  D→C→B→A       A → 橘環／橘片              −（指針左、V<0）      ＋（橘片換到左邊）
 *   270°       ∥B         |ε| 最大
 *   反轉（ω<0）：AB、CD 的 ⊙／⊗ 全部對調；滑環仍每半圈翻轉；分裂環輸出恆為 −（右電刷 ＋、指針左、波形整條 ≤0）。
 *   推導：AB 在右（靠 N）正轉時往下，v＝−ŷ，B＝−x̂，F∝v×B＝−ŵ（ŵ 朝觀看者）→ 往裡 ⊗，與動畫 e＝−s·cos a（s＝−1）一致。
 *   分裂環：橘片（A）中心在 AB 方向、粉片（D）在對面；兩電刷固定在左、右。流出端的那一片在正轉時永遠在左 → 左電刷恆 ＋。
 *   滑環：左電刷永遠貼粉環（D），右電刷永遠貼橘環（A）。端視圖把兩個一前一後的滑環畫成同心圓：粉環在前（小圈）、橘環在後（大圈）。
 *   畫面（⊙／⊗、電刷 ＋／−、檢流計、波形、中性面／平行 B 標示）與說明框都由同一個 θ、ω 算出。
 *
 * 字級：畫布文字 20–34px（頂端說明 24、標籤／讀數 22、軸註 20、磁極 34），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  // 端視圖
  const CX = 245, CY = 292, RR = 100, CR = 17;               // 轉軸中心、線圈半長、導線剖面半徑
  const MS = [14, 60], MN = [430, 476], MY0 = 132, MY1 = 452; // S、N 磁鐵 x 範圍與 y 範圍
  const PX_PER_TURN = 500;                                    // 拖曳 500 px＝一圈
  // 右側
  const GXc = 590, GYc = 178, GR = 64;                        // 檢流計
  const RX0 = 690, RX1 = 988;                                 // 讀數欄
  const WX = 548, WW = 438, WT = 322, WB = 550, WY0 = (WT + WB) / 2, AMP = 100, WIN = 4; // 波形
  const FS = 5;                                               // 滿格
  const AUTO = { slow: 0.5, fast: 1.2 };                      // 圈/秒
  const COPPER = '#d08a4a', COPPER_DK = '#5a3418', CHG_POS = '#ff8040';
  const BRUSH_COL = { L: '#55e9ff', R: '#dd8cff' };           // 左電刷青、右電刷紫（同本課動畫）
  const PANEL = 'rgba(12,30,25,0.92)';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;
  const sgn = v => v > 0 ? 1 : v < 0 ? -1 : 0;

  // ───────── 狀態 ─────────
  const S = {
    dev: 'dc', str: 1, turns: 3, mode: 'slow',
    th: 0, target: 0, prevTh: 0, tau: 0.05, w: 0, wAuto: 0,      // θ（rad，不取模）、ω（rad/s）
    eps: 0, V: 0, ang: 0, angV: 0,
    wave: [], t: 0, fieldPh: 0, swapT: -9, lastSide: 1, tagSide: -1,
    hintA: 1, dragged: false, fast: false,
    motion: 'idle', stillT: 0, moved: false, over: null, overT: -99,
    raf: 0, last: 0, on: false, visible: true, timer: 0, actions: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null, lastRes = '';

  // ───────── 文字與圖形小工具 ─────────
  function textW(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function wrap(s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    // 中文句子：逐字斷行，但連在一起的英數符號（sinθ、ε、0.5）不拆開
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : s.match(/[A-Za-z0-9θεωΦ.]+|./gu), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = latin ? u : u.trimStart(); } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function arr(x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2 || alpha <= 0.01) return;
    const h = Math.min(head, L * 0.7);
    const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7); };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline !== false) { ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }

  // ───────── 物理 ─────────
  const wTurns = () => S.w / TAU;                               // 圈/秒（有正負）
  const sinT = () => Math.sin(S.th);
  const thetaDeg = () => { const d = (S.th * 180 / Math.PI) % 360; return d < 0 ? d + 360 : d; };
  function abPos() { const s = Math.sin(S.th), c = Math.cos(S.th); return { x: CX + RR * s, y: CY - RR * c, tx: c, ty: s }; }  // tx,ty＝正轉切線
  const leftPlus = () => Math.abs(S.V) < 0.05 ? null : S.V > 0;          // 左電刷是不是 ＋
  const meterSide = () => S.ang > 0.05 ? 'right' : S.ang < -0.05 ? 'left' : null;
  const clipped = () => Math.abs(S.V) > FS * 1.001;

  // ───────── 端視圖：磁鐵、磁力線、中性面／平行 B 標示 ─────────
  function drawMagnets() {
    [[MS, C.poleS, 'S'], [MN, C.poleN, 'N']].forEach(([xr, col, nm]) => {
      ctx.save();
      const g = ctx.createLinearGradient(xr[0], 0, xr[1], 0);
      g.addColorStop(0, shade(col, nm === 'S' ? 0.7 : 1)); g.addColorStop(1, shade(col, nm === 'S' ? 1 : 0.7));
      ctx.fillStyle = g; rrect(xr[0], MY0, xr[1] - xr[0], MY1 - MY0, 8); ctx.fill();
      ctx.strokeStyle = S.str > 1 ? C.yellow : 'rgba(255,255,255,.55)'; ctx.lineWidth = S.str > 1 ? 5 : 3; ctx.stroke();
      ctx.restore();
      const mx = (xr[0] + xr[1]) / 2;
      text(nm, mx, CY, C.white, 34);
      text(S.str > 1 ? '×2' : '×1', mx, MY1 - 30, S.str > 1 ? C.yellow : C.white, 22);
    });
  }
  function fieldYs() { const n = S.str > 1 ? 9 : 5, out = []; for (let i = 0; i < n; i++) out.push(CY - 112 + 224 * i / (n - 1)); return out; }
  function drawField() {
    fieldYs().forEach((y, i) => {
      const sh = 0.5 + 0.18 * Math.sin(S.fieldPh * 2 + i * 1.3);
      ctx.save(); ctx.globalAlpha = sh; ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(MN[0] - 2, y); ctx.lineTo(MS[1] + 2, y); ctx.stroke(); ctx.restore();
      // 沿線緩慢往左（N → S）移動的小箭頭：閒置時的動態，方向＝B
      const L = MN[0] - MS[1] - 30;
      for (const off of [0, 0.5]) {
        const u = ((S.fieldPh * 0.06 + off + i * 0.137) % 1 + 1) % 1, x = MN[0] - 15 - u * L;
        arr(x + 9, y, x - 9, y, C.green, 3, 13, sh + 0.2, false);
      }
    });
  }
  function glowNeutral() { return clamp(1 - Math.abs(sinT()) / 0.17, 0, 1); }
  function glowParallel() { return clamp((Math.abs(sinT()) - 0.96) / 0.04, 0, 1); }
  function drawPlanes() {
    const gn = glowNeutral(), gp = glowParallel();
    ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([9, 9]);
    ctx.strokeStyle = C.cyan; ctx.globalAlpha = 0.35 + 0.5 * gn;
    ctx.beginPath(); ctx.moveTo(CX, CY - RR - 30); ctx.lineTo(CX, CY + RR + 30); ctx.stroke();
    ctx.strokeStyle = C.yellow; ctx.globalAlpha = 0.3 + 0.55 * gp;
    ctx.beginPath(); ctx.moveTo(CX - RR - 26, CY); ctx.lineTo(CX + RR + 26, CY); ctx.stroke();
    ctx.restore();
    // 轉動軌跡圓
    ctx.save(); ctx.strokeStyle = 'rgba(184,201,193,.28)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.arc(CX, CY, RR, 0, TAU); ctx.stroke(); ctx.restore();
    // 標籤：亮起時加光暈底
    const nl = tr('中性面 ⊥B', 'Neutral plane ⊥B'), pl = tr('平行 B', '∥ B');
    [[nl, CX, CY - RR - 40, gn, C.cyan], [nl, CX, CY + RR + 40, gn, C.cyan],
     [pl, (MN[0] + CX + RR + CR) / 2 + 1, CY - 36, gp, C.yellow], [pl, (MS[1] + CX - RR - CR) / 2, CY - 36, gp, C.yellow]].forEach(([s, x, y, g, col]) => {
      if (g > 0.02) {
        const w = textW(s, 22) + 18;
        ctx.save(); ctx.globalAlpha = g * 0.9; ctx.fillStyle = col === C.cyan ? 'rgba(85,233,255,.22)' : 'rgba(253,224,71,.24)';
        ctx.strokeStyle = col; ctx.lineWidth = 2; rrect(x - w / 2, y - 16, w, 32, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      text(s, x, y, col, 22, 'center', 0.55 + 0.45 * g);
    });
  }

  // ───────── 端視圖：線圈、導線剖面、換向裝置 ─────────
  function drawCoil() {
    const p = abPos(), q = { x: 2 * CX - p.x, y: 2 * CY - p.y };
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = COPPER_DK; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.strokeStyle = COPPER; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#ffd29a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function drawRotArrow() {
    const wt = wTurns(), a = clamp((Math.abs(wt) - 0.03) / 0.15, 0, 1);
    if (a < 0.02) return;
    const r = RR + 30, a0 = 2.09, a1 = 2.79;                    // 左下方 120°～160°
    const from = wt > 0 ? a0 : a1, to = wt > 0 ? a1 : a0, n = 16, pts = [];
    for (let i = 0; i <= n; i++) { const t = from + (to - from) * i / n; pts.push([CX + r * Math.cos(t), CY + r * Math.sin(t)]); }
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.strokeStyle = C.bg; ctx.lineWidth = 10; ctx.beginPath(); pts.slice(0, -2).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.strokeStyle = C.white; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    const u = pts[n - 2], v = pts[n];
    arr(u[0], u[1], v[0], v[1], C.white, 5, 18, a);
  }
  function drawConductors() {
    const p = abPos(), e = S.eps, al = clamp((Math.abs(e) - 0.03) / 0.3, 0, 1), wt = wTurns();
    const va = clamp((Math.abs(wt) - 0.03) / 0.12, 0, 1), vl = 16 + Math.min(26, Math.abs(wt) * 18);
    if (Math.abs(wt) > 0.03) S.tagSide = -sgn(wt);              // 標籤放在運動方向的反側（有遲滯）
    [[1, 'AB', C.orange, e > 0], [-1, 'CD', C.pink, e < 0]].forEach(([k, nm, ring, into]) => {
      const x = CX + k * (p.x - CX), y = CY + k * (p.y - CY), tx = k * p.tx, ty = k * p.ty;   // tx,ty＝這條邊正轉時的切線
      // 速度（白，切線方向）
      if (va > 0.02) { const d = sgn(wt); arr(x + tx * d * (CR + 4), y + ty * d * (CR + 4), x + tx * d * (CR + 4 + vl), y + ty * d * (CR + 4 + vl), C.white, 4, 13, va * 0.9); }
      ctx.save(); ctx.fillStyle = '#3a2412'; ctx.strokeStyle = ring; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, CR, 0, TAU); ctx.fill(); ctx.stroke();
      if (al > 0.03) {
        ctx.globalAlpha = al; ctx.strokeStyle = C.current; ctx.fillStyle = C.current; ctx.lineWidth = 4; ctx.lineCap = 'round';
        if (into) { ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      const rx = (x - CX) / RR, ry = (y - CY) / RR, d = S.tagSide;
      text(nm, x + tx * d * 34 - rx * 8, y + ty * d * 34 - ry * 8, C.white, 22, 'center', 0.95);
    });
  }
  function brush(side, xIn) {                                  // side −1 左、+1 右；xIn＝貼著的環外緣到中心的距離
    const w = 26, h = 32, x0 = side < 0 ? CX - xIn - 2 - w : CX + xIn + 2, col = side < 0 ? BRUSH_COL.L : BRUSH_COL.R;
    ctx.save(); ctx.fillStyle = '#2b3a36'; ctx.strokeStyle = col; ctx.lineWidth = 3.5;
    rrect(x0, CY - h / 2, w, h, 5); ctx.fill(); ctx.stroke(); ctx.restore();
    const lp = leftPlus();
    if (lp !== null) {
      const plus = side < 0 ? lp : !lp;
      text(plus ? '+' : '−', x0 + w / 2, CY - 1, plus ? CHG_POS : C.electron, 26, 'center');
    }
  }
  function drawCommutator() {
    const phi = Math.atan2(-Math.cos(S.th), Math.sin(S.th));    // AB 方向（畫布角）
    if (S.dev === 'dc') {
      const r = 28, gap = 0.2;
      [[phi, C.orange], [phi + Math.PI, C.pink]].forEach(([m, col]) => {
        ctx.save(); ctx.strokeStyle = C.bg; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(CX, CY, r, m - Math.PI / 2 + gap, m + Math.PI / 2 - gap); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 11; ctx.stroke(); ctx.restore();
      });
      const k = clamp(1 - (S.t - S.swapT) / 0.5, 0, 1);         // 換向瞬間閃一下
      if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX, CY, r + 13, 0, TAU); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = '#5f726b'; ctx.beginPath(); ctx.arc(CX, CY, 9, 0, TAU); ctx.fill(); ctx.restore();
      brush(-1, r + 5.5); brush(1, r + 5.5);
    } else {
      // 兩個一前一後的滑環：粉環（D，前）小圈、橘環（A，後）大圈
      ctx.save();
      ctx.strokeStyle = C.bg; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(CX, CY, 38, 0, TAU); ctx.stroke();
      ctx.strokeStyle = shade('#ffb347', 0.9); ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = C.bg; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(CX, CY, 23, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ff78b7'; ctx.lineWidth = 9; ctx.stroke();
      // 轉動記號（環上的小亮點，跟著線圈轉）
      [[38, '#ffe0b0'], [23, '#ffd0e6']].forEach(([r, col]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(CX + r * Math.cos(phi), CY + r * Math.sin(phi), 2.6, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#5f726b'; ctx.beginPath(); ctx.arc(CX, CY, 8, 0, TAU); ctx.fill();
      ctx.restore();
      brush(-1, 27.5); brush(1, 42.5);
    }
  }

  // ───────── 右側：檢流計、讀數、波形 ─────────
  function drawMeter() {
    text(tr('檢流計 G', 'Galvanometer G'), GXc, GYc - GR - 22, C.white, 22);
    ctx.save();
    ctx.fillStyle = '#16302a'; ctx.beginPath(); ctx.arc(GXc, GYc, GR, 0, TAU); ctx.fill();
    ctx.strokeStyle = clipped() ? C.current : Math.abs(S.V) > 0.1 ? C.white : C.muted; ctx.lineWidth = 6; ctx.stroke();
    ctx.translate(GXc, GYc + 26);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 60, -Math.PI / 2 - 1.15, -Math.PI / 2 + 1.15); ctx.stroke();
    for (let k = -4; k <= 4; k++) {
      const q = -Math.PI / 2 + k * 0.275; ctx.lineWidth = k === 0 ? 4 : 2; ctx.strokeStyle = k === 0 ? C.white : C.muted;
      ctx.beginPath(); ctx.moveTo(Math.cos(q) * 52, Math.sin(q) * 52); ctx.lineTo(Math.cos(q) * 66, Math.sin(q) * 66); ctx.stroke();
    }
    ctx.rotate(S.ang);
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -62); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.restore();
    text('G', GXc, GYc + 42, C.white, 22);
    if (Math.abs(S.V) < 0.05) {                                // 閒置：外圈呼吸光暈
      ctx.save(); ctx.globalAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(S.t * 3.2));
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -S.t * 30;
      ctx.beginPath(); ctx.arc(GXc, GYc, GR + 11, 0, TAU); ctx.stroke(); ctx.restore();
    }
    const side = meterSide();
    const s = clipped() ? tr('超出刻度！', 'Off scale!') : side === 'right' ? tr('指針向右 →', 'Needle right →') : side === 'left' ? tr('← 指針向左', '← Needle left') : 'I＝0';
    text(s, GXc, GYc + GR + 26, clipped() ? C.current : side ? C.white : C.muted, 22);
  }
  function drawReadouts() {
    const rows = [
      [tr('換向裝置', 'Device'), S.dev === 'dc' ? tr('分裂環（直流）', 'Split ring (DC)') : tr('滑環（交流）', 'Slip rings (AC)'), S.dev === 'dc' ? C.pink : C.yellow],
      [tr('轉速', 'Speed'), (Math.abs(wTurns()) < 0.005 ? '' : wTurns() > 0 ? '↻ ' : '↺ ') + Math.abs(wTurns()).toFixed(2) + tr(' 圈/秒', ' turns/s'), C.white],
      [tr('角度 θ', 'Angle θ'), Math.round(thetaDeg()) % 360 + '°', C.white],
      [tr('倍率 N×B', 'Factor N×B'), `${S.turns}×${S.str}＝×${S.turns * S.str}`, C.yellow],
      [tr('電壓 ε', 'Voltage ε'), (S.eps >= 0.05 ? '+' : S.eps <= -0.05 ? '−' : '') + Math.abs(S.eps).toFixed(1), C.current]
    ];
    rows.forEach(([k, v, col], i) => {
      const y = 98 + i * 34;
      text(k, RX0, y, C.muted, 22, 'left');
      text(v, RX1, y, col, 22, 'right');
    });
    text('ε ＝ N·B·A·ω·sinθ', (RX0 + RX1) / 2, 268, C.cyan, 22);
  }
  function drawWave() {
    const col = S.dev === 'dc' ? C.pink : C.yellow;
    text(tr('輸出電流 I（最近 4 秒）', 'Output current I (last 4 s)'), 520, 300, col, 22, 'left');
    text(clipped() ? tr('超出刻度！', 'Off scale!') : S.dev === 'dc' ? tr('粉線＝直流', 'Pink = DC') : tr('黃線＝交流', 'Yellow = AC'),
      WX + WW, 300, clipped() ? C.current : col, 22, 'right');
    ctx.save();
    ctx.fillStyle = 'rgba(16,45,38,.6)'; ctx.fillRect(WX, WT, WW, WB - WT);
    ctx.strokeStyle = 'rgba(85,233,255,.16)'; ctx.lineWidth = 2;
    for (let k = Math.ceil(S.t - WIN); k <= S.t; k += 0.5) {     // 每 0.5 秒一條、跟著時間往左捲
      const x = WX + WW - (S.t - k) / WIN * WW;
      if (x <= WX + 1) continue;
      ctx.beginPath(); ctx.moveTo(x, WT); ctx.lineTo(x, WB); ctx.stroke();
    }
    [WY0 - AMP, WY0 + AMP].forEach(y => { ctx.beginPath(); ctx.moveTo(WX, y); ctx.lineTo(WX + WW, y); ctx.stroke(); });
    ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3; ctx.strokeRect(WX, WT, WW, WB - WT);
    ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(WX, WY0); ctx.lineTo(WX + WW, WY0); ctx.stroke();
    ctx.restore();
    text('+', WX - 20, WY0 - AMP, C.white, 26); text('0', WX - 20, WY0, C.white, 22); text('−', WX - 20, WY0 + AMP, C.white, 26);
    text(tr('← 4 秒前', '← 4 s ago'), WX, 576, C.muted, 20, 'left');
    text(tr('現在', 'now'), WX + WW, 576, C.muted, 20, 'right');
    // 軌跡（每段依當時的換向裝置著色：直流粉、交流黃）
    const yv = v => WY0 - clamp(v / FS, -1.08, 1.08) * AMP, xt = t => WX + WW - (S.t - t) / WIN * WW;
    const wv = S.wave;
    ctx.save(); ctx.beginPath(); ctx.rect(WX + 1, WT - 12, WW - 1, WB - WT + 24); ctx.clip();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = 1; i < wv.length; i++) {
      const a = wv[i - 1], b = wv[i];
      ctx.strokeStyle = b.dc ? C.pink : C.yellow;
      ctx.beginPath(); ctx.moveTo(xt(a.t), yv(a.v)); ctx.lineTo(xt(b.t), yv(b.v)); ctx.stroke();
    }
    ctx.restore();
    // 最右端的移動圓點
    const y = yv(S.V);
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = C.bg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(WX + WW, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // ───────── 提示條：轉到哪裡電壓最大？ ─────────
  function stripInfo() {
    const s = Math.abs(sinT()), still = Math.abs(wTurns()) < 0.03;
    if (s < 0.2) return [still ? tr('中性面（線圈面 ⊥B）：就算轉起來，導線也是順著磁力線走、不切割 → ε＝0', 'Neutral plane (coil ⊥ B): even when turning, the wires move along the field lines without cutting them → ε = 0')
      : S.dev === 'dc' ? tr('中性面（線圈面 ⊥B）：導線順著磁力線走、不切割 → ε＝0；分裂環在這裡換向', 'Neutral plane (coil ⊥ B): the wires move along the field lines, no cutting → ε = 0; the split ring swaps here')
        : tr('中性面（線圈面 ⊥B）：導線順著磁力線走、不切割 → ε＝0', 'Neutral plane (coil ⊥ B): the wires move along the field lines, no cutting → ε = 0'), C.cyan, 'neutral'];
    if (s > 0.93) return [still ? tr('線圈面平行 B：這裡最會發電——但要轉起來才有 ε', 'Coil parallel to B: the best spot for voltage — but only while it turns')
      : tr('線圈面平行 B：導線垂直切割磁力線、切得最快 → ε 最大', 'Coil parallel to B: the wires cut straight across the field lines, fastest → ε is largest'), C.yellow, 'parallel'];
    return [tr('轉到哪裡電壓最大？θ 從中性面算起，ε 跟著 sinθ 變', 'Where is the voltage largest? θ is measured from the neutral plane; ε follows sinθ'), C.white, 'between'];
  }
  function drawStrip() {
    const [s, col] = stripInfo(), x0 = 10, w = 482, y0 = 462;
    const ls = wrap(s, w - 24, 22).slice(0, 3), h = ls.length * 27 + 16;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = col; ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    rrect(x0, y0, w, h, 10); ctx.fill(); ctx.globalAlpha = 0.6; ctx.stroke(); ctx.restore();
    ls.forEach((t, i) => text(t, x0 + 12, y0 + 21 + i * 27, col, 22, 'left'));
    return y0 + h;
  }

  // ───────── 訊息（畫布頂端＋說明框，同一個狀態） ─────────
  function msgKey() {
    if (S.over && S.t - S.overT < 3.5) return S.over;
    return S.motion;
  }
  function caption() {
    const k = msgKey();
    switch (k) {
      case 'fast': return tr('轉得越快，電壓越大！波形又高又密', 'The faster you turn, the bigger the voltage! Taller, denser waves');
      case 'ac': return tr('滑環：電流方向每半圈翻轉＝交流', 'Slip rings: the current flips every half turn = AC');
      case 'dc': return tr('分裂環：每半圈換向，外電路永遠同方向＝直流', 'Split ring: swaps every half turn, so the outside current keeps one direction = DC');
      case 'dcRev': return tr('反過來轉：還是直流，但方向整個反過來', 'Turning backward: still DC, but the whole direction reverses');
      case 'stopped': return tr('停下來，電壓回到 0', 'Stop, and the voltage returns to 0');
      case 'dev': return S.dev === 'dc' ? tr('換成分裂環：輸出變成直流（全在 0 以上）', 'Split ring: the output becomes DC (all above 0)')
        : tr('換成滑環：輸出變成交流（正負交替）', 'Slip rings: the output becomes AC (alternating ±)');
      case 'turns': return tr(`線圈 ${S.turns} 匝：匝數越多、磁鐵越強，電壓越大`, `${S.turns} turn${S.turns > 1 ? 's' : ''}: more turns, stronger magnet → bigger voltage`);
      case 'str': return S.str > 1 ? tr('強磁鐵 ×2：同樣的轉法，電壓加倍', 'Strong magnet ×2: same turning, double the voltage')
        : tr('弱磁鐵 ×1：磁場較弱，電壓較小', 'Weak magnet ×1: weaker field, smaller voltage');
      case 'slow': return tr('自動慢轉：每秒半圈', 'Auto slow: half a turn per second');
      case 'fastAuto': return tr('自動快轉：轉得越快，波形又高又密', 'Auto fast: faster turning, taller and denser waves');
      case 'manual': return tr('自己轉：換你左右拖曳線圈', 'By hand: your turn — drag left or right');
      default: return tr('左右拖曳，用手轉線圈，看檢流計和波形', 'Drag left or right to turn the coil; watch the meter and the wave');
    }
  }
  const captionColor = () => msgKey() === 'stopped' ? C.cyan : msgKey() === 'dc' || msgKey() === 'dcRev' ? C.pink : C.yellow;
  function setupLine() {
    const m = { manual: tr('自己轉', 'by hand'), slow: tr('自動慢轉', 'auto slow'), fast: tr('自動快轉', 'auto fast') }[S.mode];
    return tr(`目前：<strong class="${S.dev === 'dc' ? 'pink' : 'yellow'}">${S.dev === 'dc' ? '分裂環（直流）' : '滑環（交流）'}</strong>｜${S.str > 1 ? '強磁鐵 ×2' : '弱磁鐵 ×1'}｜線圈 <strong class="yellow">${S.turns} 匝</strong>｜${m}`,
      `Now: <strong class="${S.dev === 'dc' ? 'pink' : 'yellow'}">${S.dev === 'dc' ? 'split ring (DC)' : 'slip rings (AC)'}</strong> | ${S.str > 1 ? 'strong magnet ×2' : 'weak magnet ×1'} | <strong class="yellow">${S.turns} turn${S.turns > 1 ? 's' : ''}</strong> | ${m}`);
  }
  function resultHTML() {
    const k = msgKey();
    let main;
    switch (k) {
      case 'fast': main = tr('<strong class="yellow">轉得越快，電壓越大</strong>：ε＝N·B·A·ω·sinθ，轉速 ω 變大，波形變<strong class="yellow">高</strong>；一秒內轉的圈數變多，波形也變<strong class="yellow">密</strong>。',
        '<strong class="yellow">The faster you turn, the bigger the voltage</strong>: ε = N·B·A·ω·sinθ. A larger ω makes the wave <strong class="yellow">taller</strong>, and more turns per second make it <strong class="yellow">denser</strong>.'); break;
      case 'ac': main = tr('<strong class="yellow">滑環</strong>：兩個電刷各自永遠貼著同一個環。線圈每轉半圈，線圈裡的電流反向，外電路也跟著反向——<strong class="yellow">電流方向每半圈翻轉＝交流</strong>，波形正負交替。',
        '<strong class="yellow">Slip rings</strong>: each brush always touches the same ring. Every half turn the current in the coil reverses, and so does the outside current — <strong class="yellow">the direction flips every half turn = AC</strong>; the wave alternates + and −.'); break;
      case 'dc': main = tr('<strong class="pink">分裂環</strong>：每到中性面（ε＝0），兩片換向片就交換電刷。線圈裡的電流反向的同時，接點也對調，所以<strong class="pink">外電路永遠同方向＝直流</strong>，波形是全在 0 以上的駝峰。',
        '<strong class="pink">Split ring</strong>: at each neutral plane (ε = 0) the two segments swap brushes. The coil current reverses just as the contacts swap, so <strong class="pink">the outside current keeps one direction = DC</strong>: humps that stay above 0.'); break;
      case 'dcRev': main = tr('<strong class="pink">反過來轉</strong>：分裂環還是每半圈換向，所以輸出仍是直流；但線圈裡的電流整個反過來，變成<strong class="pink">右電刷 ＋</strong>，波形全在 0 以下。',
        '<strong class="pink">Turning backward</strong>: the split ring still swaps every half turn, so the output is still DC — but every current reverses: now the <strong class="pink">right brush is +</strong> and the wave stays below 0.'); break;
      case 'stopped': main = tr('<strong class="cyan">停下來，電壓回到 0</strong>：線圈不轉，導線就不切割磁力線——磁鐵再強、線圈停在哪個角度，都沒有感應電流。',
        '<strong class="cyan">Stop, and the voltage returns to 0</strong>: a still coil cuts no field lines — however strong the magnet or wherever the coil stops, there is no induced current.'); break;
      case 'dev': main = S.dev === 'dc' ? tr('換成<strong class="pink">分裂環</strong>：每半圈換向，外電路永遠同方向＝<strong class="pink">直流</strong>（粉色波形全在 0 以上）。',
        'Switched to the <strong class="pink">split ring</strong>: it swaps every half turn, so the outside current keeps one direction = <strong class="pink">DC</strong> (pink humps above 0).')
        : tr('換成<strong class="yellow">滑環</strong>：不換向，電流方向每半圈翻轉＝<strong class="yellow">交流</strong>（黃色波形正負交替）。',
          'Switched to <strong class="yellow">slip rings</strong>: no swapping, so the current flips every half turn = <strong class="yellow">AC</strong> (yellow wave alternating ±).'); break;
      case 'turns': case 'str': main = tr(`<strong class="yellow">匝數越多、磁鐵越強，電壓越大</strong>：ε 和 N、B 都成正比。現在 N×B＝${S.turns}×${S.str}＝<strong class="yellow">×${S.turns * S.str}</strong>（和 1 匝、弱磁鐵比）。`,
        `<strong class="yellow">More turns and a stronger magnet give a bigger voltage</strong>: ε is proportional to both N and B. Now N×B = ${S.turns}×${S.str} = <strong class="yellow">×${S.turns * S.str}</strong> (compared with 1 turn, weak magnet).`); break;
      case 'slow': main = tr('<strong class="yellow">自動慢轉</strong>：每秒半圈。拖一下就換回自己轉。', '<strong class="yellow">Auto slow</strong>: half a turn per second. Drag to take over.'); break;
      case 'fastAuto': main = tr('<strong class="yellow">自動快轉</strong>：每秒 1.2 圈，比慢轉快 2.4 倍——波形也高 2.4 倍、更密。拖一下就換回自己轉。', '<strong class="yellow">Auto fast</strong>: 1.2 turns per second, 2.4× the slow speed — the wave is 2.4× taller and denser. Drag to take over.'); break;
      case 'manual': main = tr('<strong class="yellow">自己轉</strong>：左右拖曳畫布轉線圈（往右＝順時針），看檢流計和波形。', '<strong class="yellow">By hand</strong>: drag left or right to turn the coil (right = clockwise) and watch the meter and the wave.'); break;
      default: main = tr('線圈停著：沒有切割磁力線，<strong class="yellow">電壓＝0</strong>。左右拖曳畫布，用手轉線圈看看。', 'The coil is still: no field lines are cut, so <strong class="yellow">the voltage is 0</strong>. Drag left or right to turn it by hand.');
    }
    const tip = tr('轉到<strong class="yellow">線圈面平行 B</strong>時 ε 最大；轉到<strong class="cyan">中性面（⊥B）</strong>時 ε＝0。檢流計指針向右＝左電刷 ＋。',
      'ε is largest when the <strong class="yellow">coil is parallel to B</strong> and 0 at the <strong class="cyan">neutral plane (⊥ B)</strong>. Needle right = left brush +.');
    return `${main}<br>${tip}<br><span class="green">${setupLine()}</span>`;
  }
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawField();
    drawMagnets();
    drawPlanes();
    drawRotArrow();
    drawCoil();
    drawCommutator();
    drawConductors();
    drawMeter();
    drawReadouts();
    drawWave();
    const sb = drawStrip();
    // 頂端說明（量寬換行）
    const ls = wrap(caption(), 950, 24), y0 = ls.length > 1 ? 22 : 34;
    ls.forEach((s, i) => text(s, W / 2, y0 + i * 30, captionColor(), 24));
    // 怎麼玩提示
    if (S.hintA > 0.01) {
      const s = tr('👆 左右拖曳，用手轉線圈', '👆 Drag left or right to turn the coil'), w = textW(s, 24) + 28, cx = CX, y = Math.min(Math.max(sb + 28, 568), 576);   // 英文說明框會變 3 行：提示框不可被擠出畫布底邊
      const pulse = 0.75 + 0.25 * Math.sin(S.t * 4);
      ctx.save(); ctx.globalAlpha = S.hintA; ctx.fillStyle = PANEL; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
      rrect(cx - w / 2, y - 19, w, 38, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      text(s, cx, y + 1, C.cyan, 24, 'center', S.hintA * pulse);
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt; S.fieldPh += dt;
    const dragging = ptr && ptr.mode === 'drag';
    if (S.mode !== 'manual' && !dragging) {
      const wt = AUTO[S.mode] * TAU;
      S.wAuto += (wt - S.wAuto) * (1 - Math.exp(-dt / 0.35));
      S.th += S.wAuto * dt; S.target = S.th;
    } else {
      S.th += (S.target - S.th) * (1 - Math.exp(-dt / S.tau));
      if (Math.abs(S.target - S.th) < 1e-4) S.th = S.target;
    }
    const raw = dt > 0 ? (S.th - S.prevTh) / dt : 0;
    S.prevTh = S.th;
    S.w += (raw - S.w) * (1 - Math.exp(-dt / 0.08));
    if (raw === 0 && Math.abs(S.w) < 0.003) S.w = 0;
    const wt = wTurns(), s = sinT(), NB = S.turns * S.str;
    S.eps = NB * wt * s;
    S.V = S.dev === 'dc' ? NB * wt * Math.abs(s) : S.eps;
    if (Math.abs(S.eps) < 1e-4) S.eps = 0;
    if (Math.abs(S.V) < 1e-4) S.V = 0;
    // 分裂環換向（過中性面）
    const side = s >= 0 ? 1 : -1;
    if (side !== S.lastSide) { S.lastSide = side; if (S.dev === 'dc' && Math.abs(wt) > 0.02) S.swapT = S.t; }
    // 檢流計阻尼彈簧
    const tgt = 1.1 * clamp(S.V / FS, -1.15, 1.15), om = 14, z = 0.7;
    let h = dt;
    while (h > 1e-6) { const q = Math.min(0.008, h); h -= q; S.angV += (om * om * (tgt - S.ang) - 2 * z * om * S.angV) * q; S.ang += S.angV * q; }
    // 波形紀錄
    S.wave.push({ t: S.t, v: S.V, dc: S.dev === 'dc' });
    while (S.wave.length > 2 && S.wave[1].t < S.t - WIN - 0.1) S.wave.shift();
    // 運動狀態（有遲滯，避免說明字閃爍）
    const sp = Math.abs(wt);
    if (sp > 1.3) S.fast = true; else if (sp < 1.0) S.fast = false;
    if (sp > 0.06) {
      S.stillT = 0; S.moved = true;
      // 自動轉時固定講換向裝置；自己轉得快才講「越快越大」
      S.motion = S.dev === 'dc' && wt < 0 ? 'dcRev' : (S.mode === 'manual' && S.fast) ? 'fast' : S.dev;
    } else if (sp < 0.02) {
      S.stillT += dt;
      if (S.moved && S.stillT > 0.3 && S.motion !== 'stopped') S.motion = 'stopped';
    }
    if (S.dragged && S.hintA > 0) S.hintA = Math.max(0, S.hintA - dt / 0.6);
  }

  // ───────── 動畫迴圈（單一 RAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.getClientRects().length && cv.getBoundingClientRect().width > 0); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visibleNow() || !S.visible) { poll(); return; }
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    step(dt);
    render();
    writeResult();
    S.raf = requestAnimationFrame(frame);
  }
  function poll() {
    if (S.timer || !S.on) return;
    S.timer = setTimeout(() => { S.timer = 0; sync(); }, 300);
  }
  function sync() {
    const want = S.on && !document.hidden;
    if (want && !S.raf && !S.timer) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want) { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; if (S.timer) clearTimeout(S.timer); S.timer = 0; }
  }

  // ───────── 操作 ─────────
  function override(k) { S.over = k; S.overT = S.t; }
  function setMode(m) {
    if (S.mode === m) return;
    if (m !== 'manual' && S.mode === 'manual') S.wAuto = S.w;   // 從目前轉速接上（不跳）
    S.mode = m;
    if (m === 'manual') { S.target = S.th; S.tau = 0.05; }
  }
  const ACTIONS = {
    dc: () => { S.dev = 'dc'; override('dev'); }, ac: () => { S.dev = 'ac'; override('dev'); },
    weak: () => { S.str = 1; override('str'); }, strong: () => { S.str = 2; override('str'); },
    n1: () => { S.turns = 1; override('turns'); }, n3: () => { S.turns = 3; override('turns'); }, n6: () => { S.turns = 6; override('turns'); },
    manual: () => { setMode('manual'); override('manual'); }, slow: () => { setMode('slow'); override('slow'); }, fast: () => { setMode('fast'); override('fastAuto'); }
  };
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++; ACTIONS[key](); updateUI();
    if (!S.raf) render();
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [tr('換向裝置', 'Commutator'), [['dc', tr('分裂環（直流）', 'Split ring (DC)')], ['ac', tr('滑環（交流）', 'Slip rings (AC)')]]],
      [tr('磁鐵強度', 'Magnet strength'), [['weak', tr('弱 ×1', 'Weak ×1')], ['strong', tr('強 ×2', 'Strong ×2')]]],
      [tr('線圈匝數', 'Coil turns'), [['n1', tr('1 匝', '1 turn')], ['n3', tr('3 匝', '3 turns')], ['n6', tr('6 匝', '6 turns')]]],
      [tr('模式', 'Mode'), [['manual', tr('自己轉', 'By hand')], ['slow', tr('自動慢轉', 'Auto slow')], ['fast', tr('自動快轉', 'Auto fast')]]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, t] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = t;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act;
      const on = k === 'dc' || k === 'ac' ? S.dev === k : k === 'weak' ? S.str === 1 : k === 'strong' ? S.str === 2
        : k[0] === 'n' ? S.turns === +k.slice(1) : S.mode === k;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', tr('發電機實驗台：左右拖曳（或按左右方向鍵）轉動線圈，看檢流計與輸出波形',
      'Generator bench: drag left or right (or use the arrow keys) to turn the coil and watch the galvanometer and the output wave'));
  }

  // ───────── 拖曳（水平為主才接管；垂直滑動交給頁面捲動） ─────────
  function takeOver() {
    S.dragged = true; S.over = null;            // 一動手，說明就跟著轉動狀態走
    if (S.mode !== 'manual') { setMode('manual'); updateUI(); }
  }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, mode: 'pending' };
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (ptr.mode === 'pending') {
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        ptr.mode = 'drag'; ptr.lx = ptr.x;              // 從按下的點起算：判斷門檻那幾 px 也算進轉角
        try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 不支援就算了 */ }
        cv.classList.add('dragging');
        takeOver(); S.target = S.th; S.tau = 0.05;
      } else if (Math.abs(dy) > 8) { ptr = null; return; }
      else return;
    }
    const rect = cv.getBoundingClientRect(), k = W / (rect.width || W);
    S.target += (e.clientX - ptr.lx) * k * TAU / PX_PER_TURN;
    ptr.lx = e.clientX;
    if (e.cancelable) e.preventDefault();
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.mode === 'drag') {
      cv.classList.remove('dragging');
      try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 已釋放 */ }
    }
    ptr = null;
  }
  function onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    takeOver(); S.tau = 0.15;
    S.target += (e.key === 'ArrowRight' ? 1 : -1) * Math.PI / 6;
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('genLabCanvas');
    ctrl = document.getElementById('genLabControls');
    res = document.getElementById('genLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.visible = true; lastRes = '';
    S.prevTh = S.th; S.target = S.th; S.w = 0; S.wAuto = 0; S.wave = [];
    buildControls(); updateUI();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (S.timer) { clearTimeout(S.timer); S.timer = 0; }
    if (cv) {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('keydown', onKey);
      cv.classList.remove('dragging');
    }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ptr = null;
    S.target = S.th; S.w = 0; S.eps = 0; S.V = 0;
  }
  function relang() { if (!S.on) return; lastRes = ''; buildControls(); updateUI(); render(); }
  function _state() {
    const e = S.eps, lp = leftPlus(), on = Math.abs(e) >= 0.05;
    return {
      dev: S.dev, strength: S.str, turns: S.turns, mode: S.mode,
      thetaDeg: +thetaDeg().toFixed(1), turnsDone: +(S.th / TAU).toFixed(3), omega: +wTurns().toFixed(3),
      eps: +e.toFixed(3), V: +S.V.toFixed(3), needleDeg: +(S.ang * 180 / Math.PI).toFixed(1), meter: meterSide(), clipped: clipped(),
      AB: on ? (e > 0 ? 'in' : 'out') : null, CD: on ? (e > 0 ? 'out' : 'in') : null,
      leftBrush: lp === null ? null : lp ? '+' : '−', rightBrush: lp === null ? null : lp ? '−' : '+',
      leftContact: S.dev === 'ac' ? 'pink' : (sinT() > 0 ? 'pink' : 'orange'),
      strip: stripInfo()[2], neutralGlow: +glowNeutral().toFixed(2), parallelGlow: +glowParallel().toFixed(2),
      motion: S.motion, msg: msgKey(), caption: caption(), waveN: S.wave.length,
      hintA: +S.hintA.toFixed(2), dragged: S.dragged, running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }
  // 測試用：直接設定角度（不經拖曳，ω 保持 0）
  function _setTheta(deg) { S.th = S.target = S.prevTh = deg * Math.PI / 180; }

  EmLab.gen = { activate, deactivate, relang, _state, _setTheta };
})();
