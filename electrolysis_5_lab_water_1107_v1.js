/* electrolysis_5_lab_water_1107_v1.js — 「🔬 動手做：自己電解水」學生實驗台（#waterLabCanvas，邏輯 1000×600）
 *
 * 契約：window.ElLab.water = { activate(), deactivate(), relang(), _state() }
 * 頁面膠水：切到「水也能被電拆開？」分頁呼叫 activate()、離開呼叫 deactivate()、切語言呼叫 relang()；activate 前呼叫其他三個也安全。
 * 只依賴頁面的 tr()；按鈕建在 #waterLabControls（.lab-row／.lab-name／.lab-btn，頁面 CSS），一句結果寫進 #waterLabResult。
 * 畫布不綁事件（只用按鈕）。工具函式與版面沿用同系列 electrolysis_5_lab_plating／lab_intro；水槽、倒立集氣管（刻度格）、
 * 碳棒由槽底穿出、H⁺／SO₄²⁻ 膠囊、H₂ 淡黃空心氣泡／O₂ 粉紅空心氣泡、火柴與帶火星木條的畫法沿用同課動畫 electrolysis_5_water。
 *
 * ══ 兩階段 ═══════════════════════════════════════════════
 * 【階段一：組裝器材】第一次進分頁＝空桌子＋右欄「組裝進度」①～⑤＋右下「器材架」。只顯示目前這一步的按鈕列（不能跳關）：
 *   ① 容器 [水槽][小量筒]：水槽 ✓ 飛上桌；小量筒 ✗ 提示「太窄了…」，器材架上的量筒閃一下（紅框＋紅叉＋輕晃），不上桌。
 *   ② 倒入溶液 [純水][加稀硫酸 H₂SO₄]：小燒杯倒入，液面從槽底升到水位線（就是原本的「溶液」選擇，實驗階段仍可再改）。
 *   ③ 電極材料 [碳棒][塑膠棒]＋電極距離 [近][中][遠]：碳棒 ✓ 從器材架移到槽底下方、再由槽底穿入；塑膠棒 ✗ 提示「塑膠不導電…」。
 *   ④ 試管 [把兩支試管裝滿水][倒立套在電極上]：先裝水（器材架上兩支試管水位升滿），再倒立（翻轉、移到電極上方、降下套住）；
 *      沒裝水就按倒立 ✗ 提示「試管要先裝滿水…」。
 *   ⑤ 電池負極接哪一支電極？ [左邊電極][右邊電極]：電池與開關飛到槽下、導線一段段接上；開關斷開（導線在開關處留缺口）。
 *      選的那支＝負極端（集 H₂），另一支＝正極端（集 O₂）。負極在右時整組電路左右對稱翻過來（電池翻面：短粗負極在右），
 *      導線不交叉；標籤、氣泡、離子漂移方向、H₂／O₂ 管、檢驗按鈕上的（左／右）都跟著換。
 *   錯誤提示與下一步指引同時寫在畫布上方黃字（最多 2 行）與 #waterLabResult；畫布下方黃字是這一步的科學理由。
 *   每個器材的動畫＝「該步完成後經過的時間」的連續函數（線性進度 G.* 每秒加 1/DUR，畫面用 ease）；
 *   前一件還沒放好時下一件會等（例：水槽還在飛，溶液不會先倒），所以連按也不會穿幫。
 *   ⑤ 的動畫播完＝組裝完成：畫布上方綠勾「組裝完成，開始實驗」約 2.5 秒（學生先按實驗按鈕就提早淡出），
 *   右欄「組裝進度＋器材架」淡出、換回原本的讀數與檢驗區；按鈕列換成階段二。
 * 【階段二：做實驗】下面原本的實驗台整套不變（只多了 [重新組裝]，放在③動作列第 4 顆）。
 *   [重新組裝]：若在通電先自動斷電、氣體歸零（同原本的重置），整套裝置 0.5 秒淡出、器材在器材架上淡入＝回到空桌子；
 *   保留溶液與距離作為預設（②仍要按一次才會倒）。
 * 離開分頁再回來：組裝進度、配置、氣體全部保留（狀態在模組內，activate 只重建按鈕）。
 *
 * ── 實驗（階段二，與原本相同）─────────────────────────────
 *   ① 溶液：純水／加稀硫酸 H₂SO₄    ② 電極距離：近／中／遠（速率 1.5×／1.0×／0.6×，示意）
 *   ③ 動作：通電／斷電／重來／重新組裝
 *   ④ 檢驗：取哪一支試管（負極端／正極端）＋用什麼檢驗（火柴／帶火星木條）→「檢驗」
 *   按鈕排成 3 列：〔①＋②〕5 顆、〔③〕4 顆、〔④〕5 顆。
 *   改溶液或距離＝新的一次實驗：若正在通電先自動斷電，累計時間歸零，氣體在 0.6 秒內平滑歸零（管內重新裝滿水）。
 *   距離改變時兩支碳棒（連同集氣管、離子）平滑滑到新位置。
 *
 * ── 模型（畫面量只由「通電累計時間 tc」與配置決定；斷電時 tc 不走＝凍結） ───────────────
 *   純水：幾乎沒有離子 → 不導電：電子被推到負極端碳棒就停住、沒有電子流、不冒泡、氣體 0 格；
 *     溶液上方紅叉「幾乎沒有離子」。只畫極少量 H⁺、OH⁻ 各 1 顆（淡淡的），通電後只微微移動。
 *   稀硫酸：H⁺ 4、SO₄²⁻ 2（示意）；通電後 H⁺ 往負極端、SO₄²⁻ 往正極端漂一小段（位置＝tc 的函式）。
 *     離子排列以「負極在左」的座標算，負極在右時對中線鏡射（接線時 0.6 秒內先淡出再淡入，不突變）。
 *     H₂ 格數 h2＝min(6, R·(tc − T0·(1 − e^(−tc/T0))))，R＝0.4 格/s × 速率（近 1.5、中 1.0、遠 0.6），T0＝0.8 s。
 *     O₂ 格數＝h2 ÷ 2（任何時刻都是 2：1）。h2 到 6 格（O₂ 3 格）＝試管滿了：自動斷電並提示；再按通電不會再收集。
 *   氣泡：第 k 顆在 tc＝k·Δ 從碳棒表面冒出、上升到氣液界面就併入；斷電時隨電流透明度 flowA 淡出。
 *   電子：只在導線與碳棒裡，電池負極 → 導線 → 負極端碳棒；正極端碳棒 → 導線（經開關）→ 電池正極。
 *   檢驗：先斷電（若在通電），把選的那支試管「取出」畫在右欄下方；動畫約 2.5 s（檢驗開始後經過時間的純函式）；
 *     1.2 s 時：火柴＋H₂＝噗一聲；木條＋O₂＝復燃；火柴＋O₂＝照常燃燒；木條＋H₂＝火星熄滅。檢驗不消耗氣體；需至少 1 格。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 0–30 不放東西。y≈58 狀態一句（黃，階段一可 2 行：y 46／78，寬 ≤ 860，x 40–900，避開右上角 90px）。
 *   水槽 x 60–600、槽口 232、液面 252、槽底 396；碳棒 y 284–410（由槽底穿出）；集氣管內頂 92、管口 352，1 格＝30px。
 *   導線 y=436：負極在左時 負極端碳棒 → 電池（短粗負極 x=272、長細正極 x=288）→ 開關 x 350–390 → 正極端碳棒；
 *   負極在右時以 x=330 鏡射（電池 372／388、開關 270–310）。y=470「負極端／電池／開關／正極端」、y=496「碳棒」。
 *   階段一：桌面 y=510（x 30–630）；右欄 x 650–950：「組裝進度」y 112、①～⑤ y 150＋34k；「器材架」y 324、上層板 y 422、下層板 y 502。
 *   階段二右欄：溶液、距離、速率、H₂／O₂ 格數、比例；下方 y 290–480 檢驗區。
 *   y≈520–548 一句重點（黃）；y≈582 圖例（避開右下角 90px）。
 */
(function () {
  'use strict';
  window.ElLab = window.ElLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', electron: '#4dd2ff', red: '#ff6b5a',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)',
    h2: '#ffe45c', o2: '#ff78b7', flame: '#ffb347', wood: '#c89b6a', shelf: '#5b4a39'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 固定種子
  const L = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size) {
    if (s.indexOf('\n') >= 0) return s.split('\n').reduce((a, part) => a.concat(wrap(ctx, part, maxW, size)), []);
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : (s.match(/[A-Za-z0-9⁺⁻₀-₉²³.×]+[）)、，。：]?|./gu) || []);   // 中文：化學式、數字不從中間斷開
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
    const seg = []; let len = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 1e-6) continue;
      seg.push({ a, b, len: d, s0: len, dx: (b.x - a.x) / d, dy: (b.y - a.y) / d }); len += d;
    }
    return { pts, seg, L: len };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u };
  }
  function partPts(pts, f) {                        // 折線只取前 f（0～1）的長度：導線一段段接上
    if (f >= 1) return pts;
    const P = mkPath(pts), s = P.L * f, out = [pts[0]];
    for (const q of P.seg) {
      if (s >= q.s0 + q.len) out.push(q.b);
      else { out.push({ x: q.a.x + q.dx * (s - q.s0), y: q.a.y + q.dy * (s - q.s0) }); break; }
    }
    return out;
  }

  // ───────── 幾何 ─────────
  const BX0 = 60, BX1 = 600, BRIM = 232, LIQ = 252, BBOT = 396;            // 水槽
  const RW2 = 11, ROD_TOP = 284, ROD_BOT = 410;                             // 碳棒（半寬 11，由槽底穿出）
  const TIW = 29, TIN = 92, TMOUTH = 352, GRID = 30, GMAX = 6;              // 集氣管：內半寬、管內頂、管口、1 格、最多 6 格
  const MIDX = 330;
  const DIST = { near: 105, mid: 140, far: 180 };                           // 兩支碳棒到中線的距離
  const RF = { near: 1.5, mid: 1.0, far: 0.6 };                             // 速率（示意）
  const WY = 436, BN = 272, BP = 288, BATX = 280, SW0 = 350, SW1 = 390;     // 導線、電池、開關（負極在左的座標）
  const SWX = (SW0 + SW1) / 2;
  const LAB1 = 470, LAB2 = 496;
  const RX = 650, RW = 300;
  const R_BASE = 0.4, T0 = 0.8, EV = 1.2, TEST_T = 2.5, FO = 0.3, FI = 0.3;
  const yIf = g => TIN + GRID * g;                                          // 氣液界面
  // 階段一：桌面、器材架（器材「在架上」的錨點與縮放；器材本身都用實驗台上的座標畫，靠變換搬過去）
  const DESK_Y = 510, RACK_T = 324, SH1 = 422, SH2 = 502;
  const RK = {
    trough: { x: 702, y: 420, s: 0.16 },                                    // 錨點：水槽底中央 (MIDX, BBOT)
    rods: [{ x: 822, y: 420 }, { x: 842, y: 420 }], rs: 0.5,                // 錨點：碳棒底 (x, ROD_BOT)
    plastic: [884, 904], cyl: 776,
    tubes: [{ x: 676, y: 427 }, { x: 704, y: 427 }], ts: 0.28,              // 錨點：管口 (x, TMOUTH)；架上管口朝上
    batt: { x: 760, y: 480, s: 0.8 }, sw: { x: 822, y: 480, s: 0.8 }, coil: { x: 890, y: 478 }
  };
  const DUR = { trough: 0.9, pour: 1.0, rods: 1.0, fill: 0.8, mount: 1.1, wire: 1.4, done: 0.6 };

  // ───────── 狀態 ─────────
  const S = {};
  function initState() {
    Object.assign(S, {
      liquid: 'water', dist: 'mid', power: false, tube: 'neg', tool: 'match',
      tc: 0, notice: 'init', test: null, testOld: null, lastTest: '', drain: null,
      flowA: 0, xA: 0, swK: 0, acidK: 0, wall: 0
    });
  }
  initState();
  S.lx = MIDX - DIST.mid; S.rx = MIDX + DIST.mid;                           // 左、右碳棒的 x（距離改變時平滑移動）
  S.mirK = 0; S.flash = null; S.wipe = null; S.bn = null;
  S.gh = { trough: 0, rods: 0, tubes: 0, wires: 0 };
  // 組裝狀態 A 與各器材的動畫進度 G（線性 0～1）
  let A = null;
  function newAsm(hint) {
    return { step: 0, done: false, container: null, rod: null, filled: false, mounted: false, neg: null, hint: hint || 'start', redoOff: false };
  }
  A = newAsm();
  const G = { trough: 0, pour: 0, rods: 0, fill: 0, mount: 0, wire: 0, done: 0 };

  const acid = () => S.liquid === 'acid';
  const rate = () => (acid() ? RF[S.dist] : 0);
  const gasAt = t => R_BASE * rate() * (t - T0 * (1 - Math.exp(-t / T0)));
  function tFull() {
    if (!acid()) return Infinity;
    let a = 0, b = 200;
    for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (gasAt(m) >= GMAX) b = m; else a = m; }
    return b;
  }
  let TF = tFull();
  const h2Run = () => (acid() ? Math.min(GMAX, gasAt(S.tc)) : 0);
  const drainV = () => (S.drain ? S.drain.v * (1 - ease(S.drain.t / 0.6)) : 0);
  const h2 = () => Math.max(h2Run(), drainV());
  const o2 = () => h2() / 2;
  const isFull = () => acid() && S.tc >= TF - 1e-6;
  const gasOf = tube => (tube === 'neg' ? h2Run() : h2Run() / 2);           // 檢驗看真正收集到的氣體（不含歸零中的淡出）
  const testKey = T => (T.tube === 'neg' ? (T.tool === 'match' ? 'pop' : 'out') : (T.tool === 'match' ? 'burn' : 'relight'));
  const negR = () => A.neg === 'right';
  const negX = () => (negR() ? S.rx : S.lx), posX = () => (negR() ? S.lx : S.rx);
  function outcome() {
    if (S.notice === 'nogas' && gasOf(S.tube) < 1) return 'nogas';
    if (S.power) return acid() ? 'acid' : 'water';
    if (S.test) return 'test';
    if (isFull()) return 'full';
    return S.tc > 0 ? 'paused' : 'off';
  }

  // ───────── 圖形：水槽、碳棒、集氣管 ─────────
  function troughPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(BX0 - 8, BRIM - 6); ctx.quadraticCurveTo(BX0, BRIM - 4, BX0, BRIM + 8);
    ctx.lineTo(BX0, BBOT - 16); ctx.quadraticCurveTo(BX0, BBOT, BX0 + 16, BBOT);
    ctx.lineTo(BX1 - 16, BBOT); ctx.quadraticCurveTo(BX1, BBOT, BX1, BBOT - 16);
    ctx.lineTo(BX1, BRIM + 8); ctx.quadraticCurveTo(BX1, BRIM - 4, BX1 + 8, BRIM - 6);
  }
  function innerPath(ctx, yTop) {
    ctx.moveTo(BX0 + 2, yTop); ctx.lineTo(BX0 + 2, BBOT - 16); ctx.quadraticCurveTo(BX0 + 2, BBOT - 2, BX0 + 16, BBOT - 2);
    ctx.lineTo(BX1 - 16, BBOT - 2); ctx.quadraticCurveTo(BX1 - 2, BBOT - 2, BX1 - 2, BBOT - 16); ctx.lineTo(BX1 - 2, yTop); ctx.closePath();
  }
  function troughBack(ctx) { ctx.save(); ctx.beginPath(); innerPath(ctx, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore(); }
  // 槽內的水；lvl＝液面（倒入時由槽底往上升），kCut＝集氣管套好的程度（1＝管內由 tubeContent 自己畫，與原本相同）
  function liquid(ctx, lvl, kCut) {
    const lx = S.lx, rx = S.rx;
    ctx.save(); ctx.beginPath(); innerPath(ctx, lvl);
    if (kCut > 0) [lx, rx].forEach(x => ctx.rect(x - TIW, TIN, TIW * 2, TMOUTH - TIN));
    ctx.fillStyle = 'rgba(205,228,232,0.10)'; ctx.fill('evenodd'); ctx.restore();
    if (kCut > 0 && kCut < 1) {                     // 試管正在降下：管內的水慢慢交給 tubeContent
      ctx.save(); ctx.beginPath(); innerPath(ctx, LIQ); ctx.clip();
      ctx.beginPath(); [lx, rx].forEach(x => ctx.rect(x - TIW, LIQ, TIW * 2, TMOUTH - LIQ));
      ctx.fillStyle = `rgba(205,228,232,${(0.10 * (1 - kCut)).toFixed(4)})`; ctx.fill(); ctx.restore();
    }
    const segs = [[BX0 + 2, lx - TIW - 3, 1], [lx - TIW - 3, lx + TIW + 3, 1 - kCut], [lx + TIW + 3, rx - TIW - 3, 1],
      [rx - TIW - 3, rx + TIW + 3, 1 - kCut], [rx + TIW + 3, BX1 - 2, 1]];
    ctx.save();
    segs.forEach(([a, b, al]) => {
      if (b - a < 1 || al <= 0.01) return;
      ctx.save(); ctx.globalAlpha *= al;
      ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a, lvl); ctx.lineTo(b, lvl); ctx.stroke();
      ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a, lvl + 4); ctx.lineTo(b, lvl + 4); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
  function troughFront(ctx) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    troughPath(ctx); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    troughPath(ctx); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function rod(ctx, x, wet) {                       // wet＝泡在水裡那段的暗色（在器材架上時為 0）
    const x0 = x - RW2, w = RW2 * 2, h = ROD_BOT - ROD_TOP;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ROD_TOP, w, h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (wet > 0.01) { ctx.save(); ctx.globalAlpha *= wet; ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, x0, ROD_TOP, w, BBOT - ROD_TOP, 6); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#3a4a44'; rrect(ctx, x - 17, BBOT - 6, 34, 14, 3); ctx.fill();          // 槽底的橡皮塞
    ctx.restore();
  }
  function tubeInnerPath(ctx, x, yTop, yBot) {
    ctx.beginPath(); ctx.moveTo(x - TIW, yBot); ctx.lineTo(x - TIW, yTop + 8); ctx.quadraticCurveTo(x - TIW, yTop, x - TIW + 8, yTop);
    ctx.lineTo(x + TIW - 8, yTop); ctx.quadraticCurveTo(x + TIW, yTop, x + TIW, yTop + 8); ctx.lineTo(x + TIW, yBot); ctx.closePath();
  }
  // 氣體（上）＋管內的水（界面到 f 的位置；f＝1 到管口）；wa＝水的透明度（實驗台上 0.10，器材架上濃一點才看得見）
  function tubeContent(ctx, x, g, kind, f, wa) {
    const yi = yIf(g), yw = TIN + (TMOUTH - TIN) * f;
    ctx.save();
    if (g > 0.001) { tubeInnerPath(ctx, x, TIN, yi); ctx.fillStyle = kind ? 'rgba(255,120,183,0.16)' : 'rgba(255,228,92,0.16)'; ctx.fill(); }
    if (yw > yi + 0.01) { ctx.beginPath(); ctx.rect(x - TIW, yi, TIW * 2, yw - yi); ctx.fillStyle = wa >= 0.0999 ? 'rgba(205,228,232,0.10)' : `rgba(205,228,232,${wa.toFixed(3)})`; ctx.fill(); }
    if (g > 0.001) {
      ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - TIW, yi); ctx.lineTo(x + TIW, yi); ctx.stroke();
    } else if (f > 0.02 && f < 0.995) {             // 器材架上裝水中：水面
      ctx.strokeStyle = 'rgba(205,240,250,0.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - TIW, yw); ctx.lineTo(x + TIW, yw); ctx.stroke();
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
    for (let k = 1; k <= GMAX; k++) {
      const y = TIN + GRID * k;
      ctx.beginPath(); ctx.moveTo(x - TIW, y); ctx.lineTo(x - TIW + 12, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ───────── 圖形：分子、離子、電子、氣泡、元件 ─────────
  let HW = {};
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {
    if (al <= 0.01) return;
    const hw = HW[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function waterMol(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e6eeec'; ctx.beginPath(); ctx.arc(x - 9, y + 7, 5, 0, TAU); ctx.arc(x + 9, y + 7, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b9c9c5'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
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
  function wireLine(ctx, pts) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function batteryPlates(ctx) {                     // 負極在左的座標；負極在右時由外面的變換左右翻面
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 20); ctx.lineTo(BP, WY + 20); ctx.stroke();   // 長細＝正極
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 10); ctx.lineTo(BN, WY + 10); ctx.stroke();   // 短粗＝負極
    ctx.restore();
  }
  function switchSym(ctx, k) {                      // k＝0 打開（導線留缺口）、1 閉合；負極在左的座標
    const a = lerp(32, 0, k) * RAD, len = SW1 - SW0;
    ctx.save(); ctx.lineCap = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(SW0, WY);
      ctx.lineTo(SW0 + len * Math.cos(a), WY - len * Math.sin(a)); ctx.stroke();
    });
    ctx.fillStyle = K.white; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 2;
    [SW0, SW1].forEach(x => { ctx.beginPath(); ctx.arc(x, WY, 5, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function mark(ctx, kind, x, y, al) {              // 'ok' 綠勾、'no' 紅叉（圓框裡有符號，不只靠顏色）
    if (al !== undefined && al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al === undefined ? 1 : al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const c = kind === 'ok' ? K.green : K.red;
    ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (kind === 'ok') { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function bigX(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.shadowColor = K.red; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y + 16); ctx.moveTo(x + 16, y - 16); ctx.lineTo(x - 16, y + 16); ctx.stroke();
    ctx.restore();
  }
  function ring(ctx, x, y, age, color, r0) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha *= 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, (r0 || 8) + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }

  // ───────── 依 tc 與碳棒位置算出的粒子（純函式） ─────────
  // 以「負極在左」的座標算（左碳棒 lx＝負極端）；負極在右時對兩棒中線鏡射。drift＝通電後往電極漂移的最大距離
  function ionList() {
    const nx = S.lx, px = S.rx, g = px - nx, M = (nx + px) / 2;
    const hH = HW['H⁺'], hS = HW['SO₄²⁻'];
    const outL = (BX0 + 2 + nx - TIW - 3) / 2, outR = (px + TIW + 3 + BX1 - 2) / 2;
    const mk = (s, k, x, y, dir, lim) => ({ s, k, x, y, dir, max: Math.max(0, Math.min(0.12 * g, 30, dir < 0 ? x - lim : lim - x)) });
    return [
      mk('H⁺', 0, M + 0.12 * g, 292, -1, nx + TIW + 3 + hH + 4),
      mk('SO₄²⁻', 1, M - 0.12 * g, 334, 1, px - TIW - 3 - hS - 4),
      mk('H⁺', 0, M - 0.25 * g, 375, -1, nx + RW2 + hH + 4),
      mk('SO₄²⁻', 1, M + 0.2 * g, 375, 1, px - RW2 - hS - 4),
      mk('H⁺', 0, outL, 322, -1, BX0 + 2 + hH + 4),
      mk('H⁺', 0, outR, 322, -1, px + TIW + 3 + hH + 4)
    ];
  }
  function waterList() {
    const nx = S.lx, px = S.rx, g = px - nx, M = (nx + px) / 2;
    const outL = (BX0 + 2 + nx - TIW - 3) / 2, outR = (px + TIW + 3 + BX1 - 2) / 2;
    return [
      { x: M - 0.22 * g, y: 290, both: 1 }, { x: outL, y: 370, both: 1 }, { x: outR, y: 370, both: 1 },
      { x: M + 0.18 * g, y: 312 }, { x: M - 0.05 * g, y: 330 }, { x: M + 0.25 * g, y: 378 }, { x: M - 0.25 * g, y: 378 }
    ];
  }
  function particles(ctx, al, mir) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const tc = S.tc, aK = S.acidK, nx = S.lx, px = S.rx, M = (nx + px) / 2, outL = (BX0 + 2 + nx - TIW - 3) / 2;
    const wob = k => ({ x: 2.5 * Math.sin(S.wall * 1.1 + k * 1.3), y: 2 * Math.sin(S.wall * 1.5 + k * 2.1) });
    waterList().forEach((w, k) => {
      const o = wob(k), al2 = w.both ? lerp(0.95, 0.45, aK) : 0.95 * (1 - aK);
      waterMol(ctx, w.x + o.x, w.y + o.y, al2);
    });
    [0, 1].forEach(fr => {                          // fr＝1：負極在右（鏡射）；接線時先淡出、再淡入
      const fa = fr ? clamp(2 * mir - 1, 0, 1) : clamp(1 - 2 * mir, 0, 1);
      if (fa <= 0.01) return;
      const mx = x => (fr ? nx + px - x : x);
      // 純水：極少量 H⁺、OH⁻（淡淡的），通電後只微微移動
      const tw = clamp(1 - 2 * aK, 0, 1), ia = clamp(2 * aK - 1, 0, 1);        // 換溶液：先淡出、再淡入
      if (tw > 0.01) {
        const d = acid() ? 0 : Math.min(8, 1.2 * tc);
        ionPill(ctx, mx(outL - d + 2 * Math.sin(S.wall * 1.2)), 322 + 2 * Math.sin(S.wall * 1.6), 'H⁺', 0, 0.45 * tw * fa);
        ionPill(ctx, mx(M + d + 2 * Math.sin(S.wall * 1.2 + 2)), 378 + 2 * Math.sin(S.wall * 1.6 + 1), 'OH⁻', 1, 0.45 * tw * fa);
      }
      // 稀硫酸：H⁺ 4、SO₄²⁻ 2；通電後各往電極漂一小段（位置＝tc 的函式）
      if (ia > 0.01) {
        const tcI = acid() ? tc : 0;
        ionList().forEach((o, n) => {
          const d = Math.min(o.max, 9 * rate() * tcI), arr = o.max > 0 ? ease((d - (o.max - 3)) / 3) : 1;
          const jx = lerp(3 * Math.sin(S.wall * 1.3 + n * 1.9), 1.2 * Math.sin(S.wall * 3 + n), arr);
          ionPill(ctx, mx(o.x + o.dir * d + jx), o.y + 3 * Math.sin(S.wall * 1.7 + n * 2.3), o.s, o.k, ia * fa);
        });
      }
    });
    ctx.restore();
  }
  // 氣泡：第 k 顆在 tc＝k·Δ（加一點固定雜湊）從碳棒表面冒出，往上升到界面就併入氣體
  function bubbles(ctx, x, dt, g, color, seed) {
    const al = S.flowA;
    if (al <= 0.01 || !acid()) return;
    const tc = S.tc, yi = yIf(g), VB = 88;
    const kHi = Math.floor(tc / dt), kLo = Math.max(0, Math.floor((tc - 3.4) / dt));
    for (let k = kLo; k <= kHi; k++) {
      const h1 = hash(seed + k * 3.1), h2v = hash(seed + k * 7.7 + 1.3), h3 = hash(seed + k * 1.9 + 4.2);
      const t0 = k * dt + h1 * dt * 0.6, age = tc - t0;
      if (age < 0) continue;
      const side = k % 2 ? 1 : -1, r = 3.5 + h3 * 3;
      const y0 = ROD_TOP + 8 + h2v * (TMOUTH - ROD_TOP - 14), y = y0 - VB * age * (0.85 + 0.3 * h3);
      if (y - r <= yi + 1) continue;
      const bx = x + side * (RW2 + r + 1 + Math.min(6, 12 * age)) + 1.8 * Math.sin(age * 7 + k);
      bubble(ctx, clamp(bx, x - TIW + r + 2, x + TIW - r - 2), y, r, color, al * clamp(age / 0.15, 0, 1));
    }
  }
  function paths(nx, px, mxf) {
    return {
      L: mkPath([{ x: mxf(BN), y: WY }, { x: nx, y: WY }, { x: nx, y: ROD_TOP + 14 }]),
      R: mkPath([{ x: px, y: ROD_TOP + 14 }, { x: px, y: WY }, { x: mxf(BP), y: WY }])
    };
  }
  function flowE(ctx, P) {
    const al = S.flowA;
    if (al <= 0.01) return;
    const sp = 52, d = 110 * Math.max(rate(), 0.6) * S.tc;
    [P.L, P.R].forEach(Q => {
      for (let k = -1; k * sp < Q.L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > Q.L) continue;
        const p = at(Q, s), fade = clamp(Math.min(s, Q.L - s) / 26, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * al);
      }
    });
  }
  function stuckE(ctx, P) {                         // 純水通電：電子被電池推到負極端碳棒就停住
    const al = S.xA;
    if (al <= 0.01 || acid()) return;
    for (let k = 0; k < 4; k++) {
      const t0 = 0.3 + 0.4 * k, target = P.L.L - k * 36;
      if (S.tc <= t0) continue;
      const s = Math.min(target, 120 * (S.tc - t0)), p = at(P.L, s), done = s >= target;
      ball(ctx, p.x + (done ? 1.6 * Math.sin(S.wall * 6 + k * 1.7) : 0), p.y, 8, al * clamp((S.tc - t0) / 0.25, 0, 1));
    }
  }

  // ───────── 器材搬移（器材架 → 實驗台；u＝線性進度 0～1，畫面用 ease） ─────────
  function withXf(ctx, hx, hy, p, al, fn) {         // 把以實驗台座標畫的器材搬到 p＝{x,y,s,rot,fx}
    if (al !== undefined && al <= 0.01) return;
    ctx.save(); if (al !== undefined) ctx.globalAlpha *= al;
    if (p) { ctx.translate(p.x, p.y); if (p.rot) ctx.rotate(p.rot); ctx.scale(p.s * (p.fx === undefined ? 1 : p.fx), p.s); ctx.translate(-hx, -hy); }
    fn(); ctx.restore();
  }
  const shakeX = item => (S.flash && S.flash.item === item ? 5 * Math.sin(S.flash.t * 40) * (1 - ease(S.flash.t / 0.5)) : 0);
  function troughPose(u) {
    if (u >= 1) return null;
    const e = ease(u), r = RK.trough;
    return { x: lerp(r.x, MIDX, e), y: lerp(r.y, BBOT, e) - 60 * Math.sin(Math.PI * e), s: lerp(r.s, 1, e) };
  }
  function rodPose(i, u) {                          // 先移到槽底正下方，再由槽底往上穿入
    if (u >= 1) return null;
    const hx = i ? S.rx : S.lx, r = RK.rods[i], by = ROD_BOT + 90;
    if (u < 0.55) { const e = ease(u / 0.55); return { x: lerp(r.x, hx, e), y: lerp(r.y, by, e), s: lerp(RK.rs, 1, e) }; }
    return { x: hx, y: lerp(by, ROD_BOT, ease((u - 0.55) / 0.45)), s: 1 };
  }
  function tubePose(i, u) {                         // 翻轉（架上管口朝上 → 倒立）並移到電極上方，再降下套住
    if (u >= 1) return null;
    const hx = i ? S.rx : S.lx, r = RK.tubes[i], up = TMOUTH - 75;
    if (u < 0.6) { const e = ease(u / 0.6); return { x: lerp(r.x + shakeX('tubes'), hx, e), y: lerp(r.y, up, e), s: lerp(RK.ts, 1, e), rot: Math.PI * (1 - e) }; }
    return { x: hx, y: lerp(up, TMOUTH, ease((u - 0.6) / 0.4)), s: 1, rot: 0 };
  }
  function partPose(r, hx, u, fx) {                 // 電池、開關：拋物線飛過去
    if (u >= 1 && fx === 1) return null;
    const e = ease(u);
    return { x: lerp(r.x, hx, e), y: lerp(r.y, WY, e) - 60 * Math.sin(Math.PI * e), s: lerp(r.s, 1, e), fx };
  }

  // ───────── 實驗台（P＝各器材進度；snap＝重新組裝時正在淡出的舊裝置，只畫已放上桌的） ─────────
  function bench(ctx, P) {
    const lx = S.lx, rx = S.rx, M = (lx + rx) / 2, nr = P.neg === 'right';
    const nx = nr ? rx : lx, px = nr ? lx : rx, mxf = x => (nr ? 2 * MIDX - x : x);
    const ra = P.rackA || (() => 1), on = u => !P.snap || u > 0, mir = P.mir === undefined ? S.mirK : P.mir;
    const ready = P.tr >= 1 && P.po >= 1 && P.ro >= 1 && P.mo >= 1 && P.wi >= 1;
    const gH = ready ? h2() : 0, gO = gH / 2, rf = Math.max(rate(), 0.6);
    const eP = ease(P.po), lvl = lerp(BBOT - 2, LIQ, eP), kCut = ease((P.mo - 0.85) / 0.15), eM = ease(P.mo);
    const tw = P.wi * DUR.wire, uB = ease(tw / 0.7), uW = ease((tw - 0.5) / 0.7), labA = ease((tw - 1.1) / 0.3);
    const flip = nr ? lerp(1, -1, ease(tw / 0.5)) : 1;
    const isNegTube = i => (i === 1) === nr;
    // 水槽（後）＋溶液（＋倒入的小燒杯）
    if (on(P.tr)) withXf(ctx, MIDX, BBOT, troughPose(P.tr), ra('trough'), () => troughBack(ctx));
    if (P.po > 0) { liquid(ctx, lvl, kCut); pourFx(ctx, P.po, lvl); }
    // 集氣管內容（氣體＋水）
    if (on(P.mo)) [0, 1].forEach(i => {
      const hx = i ? rx : lx, neg = isNegTube(i);
      withXf(ctx, hx, TMOUTH, tubePose(i, P.mo), ra('tubes'),
        () => tubeContent(ctx, hx, neg ? gH : gO, neg ? 0 : 1, P.mo > 0 ? 1 : ease(P.fi), lerp(0.35, 0.10, eM)));
    });
    // 碳棒
    if (on(P.ro)) [0, 1].forEach(i => { const hx = i ? rx : lx; withXf(ctx, hx, ROD_BOT, rodPose(i, P.ro), ra('rods'), () => rod(ctx, hx, ease((P.ro - 0.7) / 0.3))); });
    if (P.po > 0 && P.po < 1) { ctx.save(); ctx.beginPath(); innerPath(ctx, lvl); ctx.clip(); particles(ctx, eP, mir); ctx.restore(); }   // 倒入中：粒子只在水裡
    else particles(ctx, eP, mir);
    if (ready) {
      bubbles(ctx, nx, 0.16 / rf, gH, K.h2, 11);
      bubbles(ctx, px, 0.32 / rf, gO, K.o2, 53);
    }
    if (on(P.mo)) [0, 1].forEach(i => { const hx = i ? rx : lx; withXf(ctx, hx, TMOUTH, tubePose(i, P.mo), ra('tubes'), () => tubeGlass(ctx, hx)); });
    if (on(P.tr)) withXf(ctx, MIDX, BBOT, troughPose(P.tr), ra('trough'), () => troughFront(ctx));
    const nA = 0.9 * ease((P.mo - 0.8) / 0.2);
    for (let k = 1; k <= GMAX; k++) {                // 刻度數字（管外側）
      text(ctx, String(k), lx - TIW - 12, TIN + GRID * k, K.white, 22, 'right', nA, true);
      text(ctx, String(k), rx + TIW + 12, TIN + GRID * k, K.white, 22, 'left', nA, true);
    }
    text(ctx, 'H₂', nx, TIN + GRID * gH / 2, K.h2, 24, 'center', ease((gH - 1.0) / 0.3), true);
    text(ctx, 'O₂', px, TIN + GRID * gO / 2, K.o2, 24, 'center', ease((gO - 1.0) / 0.3), true);
    // 兩支集氣管之間、液面上方：液體名稱 → 離子移動方向（稀硫酸通電）／紅叉（純水通電）
    const rdy = ready ? 1 : 0, arrV = S.acidK * S.flowA * rdy, arrA = clamp(2 * arrV - 1, 0, 1), xA = clamp(2 * S.xA * rdy - 1, 0, 1);   // 先讓名稱淡出，再淡入（裝置齊了才有）
    const nameA = clamp(1 - 2 * Math.max(S.xA * rdy, arrV), 0, 1) * eP;
    const gapW = rx - lx - 2 * (TIW + 8);
    const nm = acid() ? L('水＋稀硫酸', 'Water +\ndilute H₂SO₄') : L('純水', 'Pure water');
    block(ctx, nm, M, 236 - 26 * (wrap(ctx, nm, gapW, 22).length - 1), gapW, K.white, 22, 'center', nameA, 26);   // 最後一行固定在液面上方
    if (!nr) {
      text(ctx, '← H⁺', nx + TIW + 10, 184, K.pos, 22, 'left', arrA, true);
      text(ctx, 'SO₄²⁻ →', px - TIW - 10, 220, K.neg, 22, 'right', arrA, true);
    } else {
      text(ctx, 'H⁺ →', nx - TIW - 10, 184, K.pos, 22, 'right', arrA, true);
      text(ctx, '← SO₄²⁻', px + TIW + 10, 220, K.neg, 22, 'left', arrA, true);
    }
    bigX(ctx, M, 150, xA);
    block(ctx, L('幾乎沒有\n離子', 'Almost\nno ions'), M, 190, gapW, K.red, 22, 'center', xA, 26);
    // 電路：導線（一段段接上）→ 電子 → 元件（元件畫在電子之後）
    if (on(P.wi) && uW > 0) {
      wireLine(ctx, partPts([{ x: nx, y: ROD_BOT }, { x: nx, y: WY }, { x: mxf(BN), y: WY }], uW));
      wireLine(ctx, partPts([{ x: mxf(BP), y: WY }, { x: mxf(SW0), y: WY }], uW));
      wireLine(ctx, partPts([{ x: px, y: ROD_BOT }, { x: px, y: WY }, { x: mxf(SW1), y: WY }], uW));
    }
    if (ready) { const Pth = paths(nx, px, mxf); flowE(ctx, Pth); stuckE(ctx, Pth); }
    if (P.wi <= 0) coil(ctx, RK.coil.x, RK.coil.y, ra('coil'));
    else if (!P.snap) coil(ctx, RK.coil.x, RK.coil.y, 1 - uW);
    if (on(P.wi)) {
      withXf(ctx, SWX, WY, partPose(RK.sw, mxf(SWX), uB, flip), ra('sw'), () => switchSym(ctx, S.swK));
      withXf(ctx, BATX, WY, partPose(RK.batt, mxf(BATX), uB, flip), ra('batt'), () => batteryPlates(ctx));
    }
    text(ctx, '−', mxf(BN - 16), WY - 18, K.electron, 28, 'center', labA);
    text(ctx, '+', mxf(BP + 16), WY - 18, K.pos, 28, 'center', labA);
    text(ctx, L('電池', 'Battery'), mxf(BATX), LAB1, K.white, 22, 'center', labA);
    text(ctx, L('開關', 'Switch'), mxf(SWX), LAB1, K.white, 22, 'center', labA);
    text(ctx, nr ? L('正極端', '(+) side') : L('負極端', '(−) side'), lx - 16, LAB1, nr ? K.pos : K.electron, 24, 'right', labA);
    text(ctx, nr ? L('負極端', '(−) side') : L('正極端', '(+) side'), rx + 16, LAB1, nr ? K.electron : K.pos, 24, 'left', labA);
    const rodA = ease((P.ro - 0.75) / 0.25);
    text(ctx, L('碳棒', 'Carbon'), lx - 16, LAB2, K.muted, 22, 'right', rodA);
    text(ctx, L('碳棒', 'Carbon'), rx + 16, LAB2, K.muted, 22, 'left', rodA);
  }
  function pourFx(ctx, u, lvl) {                    // 倒溶液：小燒杯傾斜、水柱落到液面（只在倒的那 1 秒）
    const a = ease(u / 0.12) * (1 - ease((u - 0.82) / 0.18));
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.save(); ctx.translate(110, 160); ctx.rotate(0.9);
    ctx.fillStyle = 'rgba(205,228,232,0.22)'; ctx.fillRect(-14, -4, 28, 24);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bk = () => { ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(-16, 22); ctx.lineTo(16, 22); ctx.lineTo(16, -22); ctx.lineTo(20, -26); };
    bk(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    bk(); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(205,240,250,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(140, 164); ctx.lineTo(140, lvl - 2); ctx.stroke();
    ctx.restore();
  }
  function coil(ctx, x, y, al) {                    // 器材架上的一捆導線
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round';
    [[7, 'rgba(12,30,25,0.8)'], [3.5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      [-6, 0, 6].forEach(d => { ctx.beginPath(); ctx.ellipse(x + d * 0.6, y + d, 18, 8, 0, 0, TAU); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(x + 16, y + 9); ctx.lineTo(x + 26, y + 20); ctx.stroke();
    });
    ctx.restore();
  }

  // ───────── 階段一：桌面、器材架、虛線目標、錯誤閃一下、組裝進度 ─────────
  function desk(ctx, al) {
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(120,96,70,0.55)'; rrect(ctx, 30, DESK_Y, 600, 5, 2.5); ctx.fill();
    ctx.restore();
  }
  function rackFrame(ctx, al) {
    ctx.save(); ctx.globalAlpha *= al;
    text(ctx, L('器材架', 'Equipment rack'), RX, RACK_T, K.muted, 22, 'left');
    [SH1, SH2].forEach(y => { ctx.fillStyle = K.shelf; rrect(ctx, 652, y, 296, 6, 3); ctx.fill(); });
    // 小量筒（只留在架上）
    const cx = RK.cyl + shakeX('cyl');
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const cyl = () => { ctx.beginPath(); ctx.moveTo(cx - 10, 346); ctx.lineTo(cx - 7, 350); ctx.lineTo(cx - 7, 414); ctx.moveTo(cx + 7, 350); ctx.lineTo(cx + 7, 414); };
    cyl(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 5; ctx.stroke();
    cyl(); ctx.strokeStyle = K.glass; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(214,236,242,0.7)'; rrect(ctx, cx - 15, 413, 30, 7, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(214,236,242,0.7)'; ctx.lineWidth = 1.5;
    for (let y = 362; y <= 406; y += 9) { ctx.beginPath(); ctx.moveTo(cx - 7, y); ctx.lineTo(cx - 2, y); ctx.stroke(); }
    // 塑膠棒（只留在架上）
    RK.plastic.forEach(x0 => {
      const x = x0 + shakeX('plastic'), w = RW2 * 2 * RK.rs, h = (ROD_BOT - ROD_TOP) * RK.rs;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, '#bdb6a6'); g.addColorStop(0.35, '#f4f1e8'); g.addColorStop(1, '#c9c2b2');
      ctx.fillStyle = g; rrect(ctx, x - w / 2, 420 - h, w, h, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.restore();
  }
  function ghosts(ctx, al) {                        // 下一件器材要放的位置（黃色虛線）
    if (al <= 0.01) return;
    const g = S.gh, lx = S.lx, rx = S.rx;
    const dash = (a, fn) => { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a * al * 0.6; ctx.setLineDash([9, 7]); ctx.strokeStyle = K.yellow; ctx.lineWidth = 2; ctx.lineJoin = 'round'; fn(); ctx.stroke(); ctx.restore(); };
    dash(g.trough * (1 - ease(G.trough)), () => troughPath(ctx));
    dash(g.rods * (1 - ease(G.rods)), () => { ctx.beginPath(); [lx, rx].forEach(x => ctx.rect(x - RW2, ROD_TOP, RW2 * 2, ROD_BOT - ROD_TOP)); });
    dash(g.tubes * (1 - ease(G.mount)), () => { ctx.beginPath(); [lx, rx].forEach(x => ctx.rect(x - TIW - 2, TIN - 3, (TIW + 2) * 2, TMOUTH - TIN + 3)); });
    dash(g.wires * (1 - ease((G.wire * DUR.wire - 0.5) / 0.7)), () => { ctx.beginPath(); ctx.moveTo(lx, ROD_BOT); ctx.lineTo(lx, WY); ctx.lineTo(rx, WY); ctx.lineTo(rx, ROD_BOT); });
  }
  const FLASH_BOX = { cyl: [758, 342, 36, 84], plastic: [868, 348, 52, 78], tubes: [660, 418, 60, 90] };
  function flashFx(ctx) {                           // 選錯：器材架上那件器材紅框＋紅叉閃一下
    const F = S.flash;
    if (!F) return;
    const a = ease(F.t / 0.1) * (1 - ease((F.t - 0.5) / 0.4));
    if (a <= 0.01) return;
    const [x, y, w, h] = FLASH_BOX[F.item];
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = K.red; ctx.lineWidth = 3.5; ctx.shadowColor = K.red; ctx.shadowBlur = 10;
    rrect(ctx, x, y, w, h, 8); ctx.stroke(); ctx.restore();
    mark(ctx, 'no', x + w + 4, y + h / 2, a);
  }
  function checklist(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    text(ctx, L('組裝進度', 'Assembly progress'), RX, 112, K.white, 22, 'left');
    const lq = acid() ? L('加稀硫酸', 'dilute H₂SO₄') : L('純水', 'pure water');
    const items = [
      [L('① 容器', '① Container'), L('水槽', 'trough')],
      [L('② 倒入溶液', '② Pour in liquid'), lq],
      [L('③ 放電極', '③ Electrodes'), L('碳棒', 'carbon')],
      [L('④ 試管', '④ Test tubes'), A.mounted ? L('倒立集氣', 'upside down') : L('已裝滿水', 'filled')],
      [L('⑤ 接導線', '⑤ Wires'), A.neg === 'right' ? L('負極接右', '(−) to right') : L('負極接左', '(−) to left')]
    ];
    items.forEach(([nm, val], i) => {
      const y = 150 + 34 * i, done = A.step > i, cur = A.step === i, part = i === 3 && cur && A.filled;
      if (cur) { ctx.save(); ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5; rrect(ctx, RX - 6, y - 16, RW + 6, 32, 8); ctx.stroke(); ctx.restore(); }
      if (done) mark(ctx, 'ok', RX + 12, y);
      else { ctx.save(); ctx.strokeStyle = cur ? K.yellow : K.muted; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(RX + 12, y, 11, 0, TAU); ctx.stroke(); ctx.restore(); }
      const full = nm + L('：', ': ') + val, s = (done || part) && textW(ctx, full, 22) <= RW - 40 ? full : nm;
      text(ctx, s, RX + 34, y, done ? K.green : cur ? K.yellow : K.muted, 22, 'left');
    });
    ctx.restore();
  }

  // ───────── 右欄：讀數 ─────────
  const fmt = g => (Math.abs(g - Math.round(g)) < 0.005 ? String(Math.round(g)) : g.toFixed(1));
  function cells(ctx, x, y, n, v, kind) {           // n 格，填 v 格（連續）
    const cw = 22, ch = 20, gap = 2;
    ctx.save();
    for (let k = 0; k < n; k++) {
      const x0 = x + k * (cw + gap), f = clamp(v - k, 0, 1);
      ctx.fillStyle = 'rgba(242,236,217,0.08)'; ctx.fillRect(x0, y - ch / 2, cw, ch);
      if (f > 0.004) { ctx.fillStyle = kind ? 'rgba(255,120,183,0.85)' : 'rgba(255,228,92,0.85)'; ctx.fillRect(x0, y - ch / 2, cw * f, ch); }
      ctx.strokeStyle = kind ? K.o2 : K.h2; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 0.75, y - ch / 2 + 0.75, cw - 1.5, ch - 1.5);
    }
    ctx.restore();
  }
  function readouts(ctx) {
    const lq = acid() ? L('加稀硫酸', 'dilute H₂SO₄') : L('純水', 'pure water');
    const dn = { near: L('近', 'near'), mid: L('中', 'middle'), far: L('遠', 'far') }[S.dist];
    let y = block(ctx, L(`溶液：${lq}`, `Liquid: ${lq}`), RX, 108, RW, K.white, 22, 'left', 1, 28);
    y = block(ctx, L(`電極距離：${dn}`, `Electrode gap: ${dn}`), RX, y + 2, RW, K.white, 22, 'left', 1, 28);
    const rs = acid() ? L(`速率 ${RF[S.dist].toFixed(1)}×（示意）`, `Rate ${RF[S.dist].toFixed(1)}× (sketch)`)
      : L('速率 ≈ 0（純水不導電）', 'Rate ≈ 0 (pure water)');
    y = block(ctx, rs, RX, y + 2, RW, acid() ? K.cyan : K.red, 22, 'left', 1, 28);
    const gH = h2(), gO = gH / 2;
    const lab = (f, v) => (f ? L(`O₂ ${v} 格`, `O₂ ${v} units`) : L(`H₂ ${v} 格`, `H₂ ${v} units`));
    const cx = Math.max(RX + 150, RX + 28 + Math.max(textW(ctx, lab(0, '6.0'), 22), textW(ctx, lab(1, '3.0'), 22)) + 12);   // 格子放在最長字串之後
    const yH = y + 14, yO = yH + 34;
    bubble(ctx, RX + 10, yH, 9, K.h2, 1);
    text(ctx, lab(0, fmt(gH)), RX + 28, yH, K.h2, 22, 'left');
    cells(ctx, cx, yH, 6, gH, 0);
    bubble(ctx, RX + 10, yO, 9, K.o2, 1);
    text(ctx, lab(1, fmt(gO)), RX + 28, yO, K.o2, 22, 'left');
    cells(ctx, cx, yO, 3, gO, 1);
    const ra = ease(gO / 0.08);
    mark(ctx, 'ok', RX + 12, yO + 34, ra);
    text(ctx, L('比例 H₂：O₂ 約 2：1', 'H₂ : O₂ is about 2 : 1'), RX + 32, yO + 34, K.green, 22, 'left', ra);
  }

  // ───────── 右欄下方：檢驗（試管取出來檢驗；純函式於檢驗開始後經過的時間 t） ─────────
  const TX = 700, TW = 18, TXT = 772, TXW = 950 - TXT;
  const H2T = { top: 300, mouth: 410 }, O2T = { mouth: 370, bot: 480 };
  function smallTube(ctx, tube) {
    const o = TW + 2, neg = tube === 'neg';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    if (neg) { ctx.moveTo(TX - TW, H2T.mouth); ctx.lineTo(TX - TW, H2T.top + TW); ctx.arc(TX, H2T.top + TW, TW, Math.PI, 0); ctx.lineTo(TX + TW, H2T.mouth); }
    else { ctx.moveTo(TX - TW, O2T.mouth); ctx.lineTo(TX - TW, O2T.bot - TW); ctx.arc(TX, O2T.bot - TW, TW, Math.PI, 0, true); ctx.lineTo(TX + TW, O2T.mouth); }
    ctx.closePath(); ctx.fillStyle = neg ? 'rgba(255,228,92,0.18)' : 'rgba(255,120,183,0.18)'; ctx.fill();
    const glass = () => {
      ctx.beginPath();
      if (neg) { ctx.moveTo(TX - o - 4, H2T.mouth + 4); ctx.lineTo(TX - o, H2T.mouth - 2); ctx.lineTo(TX - o, H2T.top + o); ctx.arc(TX, H2T.top + o, o, Math.PI, 0); ctx.lineTo(TX + o, H2T.mouth - 2); ctx.lineTo(TX + o + 4, H2T.mouth + 4); }
      else { ctx.moveTo(TX - o - 4, O2T.mouth - 4); ctx.lineTo(TX - o, O2T.mouth + 2); ctx.lineTo(TX - o, O2T.bot - o); ctx.arc(TX, O2T.bot - o, o, Math.PI, 0, true); ctx.lineTo(TX + o, O2T.mouth + 2); ctx.lineTo(TX + o + 4, O2T.mouth - 4); }
    };
    glass(); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    glass(); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    text(ctx, neg ? 'H₂' : 'O₂', TX, neg ? H2T.top + 34 : O2T.bot - 30, neg ? K.h2 : K.o2, 22, 'center', 1, true);
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
  const pp = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
  function toolPos(T, t) {
    const neg = T.tube === 'neg';
    if (T.tool === 'match') {
      const u = ease((t - 0.15) / 0.95);
      return neg ? pp({ x: 748, y: 448 }, { x: 706, y: 424 }, u) : pp({ x: 748, y: 340 }, { x: 706, y: 358 }, u);
    }
    const u1 = ease((t - 0.15) / 0.6), u2 = ease((t - 0.75) / 0.45);
    return neg ? pp(pp({ x: 752, y: 420 }, { x: 702, y: 422 }, u1), { x: 700, y: 344 }, u2)
      : pp(pp({ x: 752, y: 352 }, { x: 702, y: 352 }, u1), { x: 700, y: 440 }, u2);
  }
  function testScene(ctx, T, al) {
    if (al <= 0.01) return;
    const t = T.t, key = testKey(T), neg = T.tube === 'neg', ev = t - EV, p = toolPos(T, t);
    ctx.save(); ctx.globalAlpha *= al;
    smallTube(ctx, T.tube);
    if (key === 'pop' && ev > 0 && ev < 0.6) {       // 噗：管口一閃
      const k = ev / 0.6;
      ctx.save(); ctx.globalAlpha *= (1 - k); const g = ctx.createRadialGradient(TX, H2T.mouth, 4, TX, H2T.mouth, 56);
      g.addColorStop(0, 'rgba(255,224,138,0.9)'); g.addColorStop(1, 'rgba(255,138,42,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(TX, H2T.mouth, 56, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (key === 'pop') { ring(ctx, TX, H2T.mouth, ev, K.flame, 12); ring(ctx, TX, H2T.mouth, ev - 0.15, K.h2, 8); }
    if (T.tool === 'match') {
      if (neg) stick(ctx, p.x, p.y, p.x + 22, p.y + 44, 5, K.wood); else stick(ctx, p.x, p.y, p.x - 22, p.y - 44, 5, K.wood);
      ctx.save(); ctx.fillStyle = '#8c2f1e'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.fill(); ctx.restore();
      const burst = key === 'pop' && ev > 0 ? 1 + 1.2 * Math.exp(-ev * 6) : 1;
      flameShape(ctx, p.x, p.y - 2, 20 * burst, 8 * burst, 1, 1.5 * Math.sin(t * 19));
    } else {
      if (neg) stick(ctx, p.x, p.y, p.x + 6, p.y + 72, 7, K.wood); else stick(ctx, p.x, p.y, p.x + 6, p.y - 72, 7, K.wood);
      const glow = key === 'out' ? 1 - ease(ev / 0.7) : 1, lit = key === 'relight' ? ease(ev / 0.5) : 0;
      ctx.save(); ctx.fillStyle = '#3b3430'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill(); ctx.restore();   // 燒黑的木條頭
      if (glow > 0.01) {
        ctx.save(); ctx.globalAlpha *= glow; ctx.shadowColor = K.flame; ctx.shadowBlur = 12 + 6 * Math.sin(t * 7);
        ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.arc(p.x, p.y, 5 + 1.2 * Math.sin(t * 7), 0, TAU); ctx.fill(); ctx.restore();
      }
      flameShape(ctx, p.x, p.y - 2, 30 * lit, 10 * lit, lit, 2 * Math.sin(t * 17));
      if (key === 'out' && ev > 0) {                 // 熄滅後一點灰煙
        for (let k = 0; k < 3; k++) {
          const a = ev - 0.2 - 0.25 * k; if (a < 0 || a > 1.4) continue;
          ctx.save(); ctx.globalAlpha *= 0.5 * (1 - a / 1.4); ctx.fillStyle = '#9aa3a0';
          ctx.beginPath(); ctx.arc(p.x + 4 * Math.sin(a * 5 + k), p.y - 10 - 26 * a, 4 + 4 * a, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
    }
    ctx.restore();
    // 文字欄：哪一支、用什麼 → 結果
    let y = block(ctx, neg ? L('負極端試管', '(−) side tube') : L('正極端試管', '(+) side tube'), TXT, 308, TXW, neg ? K.h2 : K.o2, 22, 'left', al, 27);
    y = block(ctx, T.tool === 'match' ? L('＋ 火柴', '+ lit match') : L('＋ 帶火星木條', '+ glowing splint'), TXT, y, TXW, K.white, 22, 'left', al, 27);
    const R = {
      pop: [L('噗！', 'Pop!'), K.yellow, L('可燃性', 'Flammable'), K.green],
      relight: [L('復燃！', 'Relit!'), K.yellow, L('助燃性', 'Supports burning'), K.green],
      burn: [L('照常燃燒', 'Burns as usual'), K.white, L('沒有噗聲', 'No pop'), K.muted],
      out: [L('火星熄滅', 'Glow goes out'), K.white, L('不會復燃', 'Not relit'), K.muted]
    }[key];
    const ra = al * ease(ev / 0.3);
    y = block(ctx, R[0], TXT, y + 20, TXW, R[1], 26, 'left', ra, 32);
    block(ctx, R[2], TXT, y + 4, TXW, R[3], 22, 'left', al * ease((ev - 0.3) / 0.4), 27);
  }
  // 試管在哪一邊（跟著接線走）
  const sideOf = tube => ((tube === 'neg') !== negR() ? 'left' : 'right');
  const sideZh = tube => (sideOf(tube) === 'left' ? '左' : '右');
  function testPanel(ctx) {
    const T = S.test, O = S.testOld;                // 淡入淡出依序進行：舊的（或提示）先淡出 FO 秒，新的再淡入 FI 秒
    const hintA = T ? (O ? 0 : 1 - ease(T.t / FO)) : (O ? ease((O.k - FO) / FI) : 1);
    if (O) testScene(ctx, O.test, 1 - ease(O.k / FO));
    if (T) testScene(ctx, T, ease((T.t - FO) / FI));
    const ng = outcome() === 'nogas';
    const y = block(ctx, ng ? L('還沒有收集到氣體：先通電，收集至少 1 格', 'No gas yet: switch on and collect at least 1 unit')
      : L('④ 收集到 1 格以上的氣體，就能取出試管檢驗', '④ Once a tube has 1 unit of gas or more, take it out and test it'),
    RX, 322, RW, ng ? K.red : K.muted, 22, 'left', hintA, 30);
    // 目前選的試管＋工具（按「檢驗」就用這一組）；試管後面標出它在左邊還是右邊
    const sel = (S.tube === 'neg' ? L('負極端試管', '(−) side tube') : L('正極端試管', '(+) side tube')) + L('＋', ' + ') +
      (S.tool === 'match' ? L('火柴', 'lit match') : L('帶火星木條', 'glowing splint'));
    const sd = L(`（${sideZh(S.tube)}邊那一支）`, `(the ${sideOf(S.tube)} tube)`);
    block(ctx, L(`目前選：${sel}\n${sd}`, `Selected: ${sel}\n${sd}`), RX, y + 14, RW, K.cyan, 22, 'left', hintA, 30);
  }

  // ───────── 標題、重點、圖例 ─────────
  const CAP = {
    off: ['選好溶液和電極距離，再按「通電」', 'Choose the liquid and the gap, then press "Switch on"'],
    paused: ['已斷電：氣體停止產生', 'Switched off: no more gas forms'],
    water: ['通電了，但幾乎不冒泡', 'Switched on, but there are almost no bubbles'],
    acid: ['通電中：兩極冒泡，收集氣體', 'Current on: both electrodes bubble'],
    full: ['試管滿了！已自動斷電', 'The tube is full! The power is switched off'],
    nogas: ['還沒有收集到氣體', 'No gas collected yet'],
    testing: ['檢驗中…', 'Testing…'],
    pop: ['噗！負極端的氣體會燒', 'Pop! The gas from the (−) side burns'],
    relight: ['木條復燃！正極端的氣體幫助燃燒', 'The splint relights! The (+) side gas helps burning'],
    burn: ['火柴照常燃燒，沒有噗聲', 'The match just burns: no pop'],
    out: ['火星熄滅，木條沒有復燃', 'The glow goes out: the splint does not relight']
  };
  const THINK = ['想一想：哪一個氣體會燒、哪一個幫助燃燒？', 'Think: which gas burns, and which one helps burning?'];
  const BOT = {
    off: ['水裡要有能自由移動的離子，電流才通得過', 'Water needs freely moving ions before a current can flow'],
    water: ['純水幾乎沒有離子，要加入一點稀硫酸', 'Pure water has almost no ions: add a little dilute sulfuric acid'],
    acid: ['負極端產生 H₂、正極端產生 O₂，體積比 2：1', 'H₂ forms at the (−) side and O₂ at the (+) side: volume ratio 2 : 1'],
    think: THINK,
    nogas: ['先通電收集至少 1 格氣體，再檢驗', 'Switch on and collect at least 1 unit of gas, then test it'],
    pop: ['氫氣具有可燃性：點火會「噗」一聲', 'Hydrogen is flammable: it burns with a pop'],
    relight: ['氧氣具有助燃性：帶火星的木條會復燃', 'Oxygen supports burning: a glowing splint bursts into flame'],
    burn: ['想一想：哪一個氣體會燒？用火柴試試另一支試管', 'Think: which gas burns? Try the match on the other tube'],
    out: ['想一想：哪一個氣體幫助燃燒？用木條試試另一支試管', 'Think: which gas helps burning? Try the splint on the other tube']
  };
  // 階段一：每一步下方的科學理由
  const ABOT = [
    ['組裝順序：容器 → 溶液 → 電極 → 試管 → 導線', 'Order: container → liquid → electrodes → tubes → wires'],
    ['先選一種溶液，做實驗時還可以再換', 'Pick one now: you can still change it during the experiment'],
    ['電極要能導電，又不能參與反應', 'Electrodes must conduct electricity and must not react'],
    ['排水集氣：氣體上升，把試管裡的水擠下去', 'Collecting over water: the gas rises and pushes the water down'],
    ['接電池負極的電極＝負極端，接正極的＝正極端', 'The electrode joined to the (−) terminal is the (−) side']
  ];
  // 階段一的提示（錯誤或下一步指引）：畫布上方黃字＝結果框
  function hintPair(key) {
    const dn = { near: ['近', 'near'], mid: ['中', 'middle'], far: ['遠', 'far'] }[S.dist];
    const sd = A.neg === 'right' ? ['右', 'right'] : ['左', 'left'];
    switch (key) {
      case 'redo': return ['回到空桌子了。① 選容器：哪一個放得下兩支倒立的試管？', 'Back to an empty bench. ① Choose a container that can hold two upside-down test tubes'];
      case 'cylinder': return ['太窄了，放不下兩支倒立的試管，換個寬一點的容器', 'Too narrow: two upside-down test tubes will not fit. Choose a wider container'];
      case 'trough': return ['水槽放好了。② 倒入溶液：純水，還是加稀硫酸？', 'The trough is in place. ② Pour in a liquid: pure water, or add dilute H₂SO₄?'];
      case 'poured': return acid() ? ['倒入加稀硫酸的水了。③ 放電極：選電極材料（也可以先調距離）', 'Water with dilute H₂SO₄ is poured in. ③ Add the electrodes: choose the material (you can set the gap too)']
        : ['倒入純水了。③ 放電極：選電極材料（也可以先調距離）', 'Pure water is poured in. ③ Add the electrodes: choose the material (you can set the gap too)'];
      case 'gap': return [`電極距離選「${dn[0]}」。再選電極材料：碳棒還是塑膠棒？`, `Electrode gap: ${dn[1]}. Now choose the electrode material: carbon or plastic?`];
      case 'plastic': return ['塑膠不導電，電極要用能導電、又不會參與反應的碳棒（惰性電極）', 'Plastic does not conduct. Use carbon rods: they conduct and do not react (inert electrodes)'];
      case 'rods': return ['碳棒裝好了。④ 先把兩支試管裝滿水', 'The carbon rods are in. ④ First, fill both test tubes with water'];
      case 'notfilled': return ['試管要先裝滿水，倒立後才能用排水集氣，不會混進空氣', 'Fill the tubes with water first: upside down, the gas pushes the water out and no air gets in'];
      case 'filled': return ['試管裝滿水了。④ 再把試管倒立，套在電極上', 'The tubes are full of water. ④ Now turn them upside down over the electrodes'];
      case 'mounted': return ['⑤ 接導線：電池負極要接哪一支電極？', '⑤ Connect the wires: which electrode goes to the (−) terminal of the battery?'];
      case 'wired': return [`導線接好了：${sd[0]}邊電極接電池負極（負極端），開關先保持斷開`, `Wired: the ${sd[1]} electrode is joined to the (−) terminal (the (−) side). The switch stays open for now`];
      case 'done': return ['組裝完成！接下來決定溶液和電極距離，再按通電。', 'Assembly complete! Now decide the liquid and the electrode gap, then press "Switch on".'];
      default: return ['① 選容器：哪一個放得下兩支倒立的試管？', '① Choose a container that can hold two upside-down test tubes'];
    }
  }
  const hintText = key => { const p = hintPair(key); return L(p[0], p[1]); };
  function capKey(oc) {
    if (oc === 'test') return S.test.t < EV ? 'testing' : testKey(S.test);
    return oc;
  }
  function botKey(oc) {
    if (oc === 'test') return S.test.t < EV ? 'think' : testKey(S.test);
    if (oc === 'paused') return h2Run() >= 1 ? 'think' : acid() ? 'acid' : 'off';
    if (oc === 'full') return 'think';
    return oc;
  }
  const CX = 480;
  function drawCaption(ctx, s, al) { text(ctx, wrap(ctx, s, 780, 26)[0], CX, 58, K.yellow, 26, 'center', al); }
  function drawCaption2(ctx, s, al) {               // 階段一：最多 2 行（x 40–900）
    const ls = wrap(ctx, s, 860, 26);
    if (ls.length === 1) text(ctx, ls[0], 470, 58, K.yellow, 26, 'center', al);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, 470, k ? 78 : 46, K.yellow, 26, 'center', al));
  }
  function banner(ctx, al) {                        // ✅ 組裝完成，開始實驗（綠勾＋字）
    if (al <= 0.01) return;
    const s = L('組裝完成，開始實驗', 'Assembly complete: start the experiment'), w = textW(ctx, s, 26), x0 = CX - (w + 36) / 2;
    mark(ctx, 'ok', x0 + 13, 58, al);
    text(ctx, s, x0 + 36, 58, K.green, 26, 'left', al);
  }
  function bottomLines(ctx, s, al) {
    const ls = wrap(ctx, s, 840, 24);
    if (ls.length === 1) text(ctx, ls[0], CX, 534, K.yellow, 24, 'center', al);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, CX, k ? 548 : 520, K.yellow, 24, 'center', al));
  }
  function drawLegend(ctx) {
    const items = [[L('藍球＝電子', 'Blue = electron'), 'b'], [L('橘＝陽離子', 'Orange = cation'), 'p'],
      [L('紫＝陰離子', 'Purple = anion'), 'n'], [L('空心圈＝氣泡', 'Ring = gas bubble'), 'r']];
    const z = 22, gapIcon = 32;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((850 - sum) / Math.max(1, items.length - 1), 14, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = 470 - tot / 2; const y = 582;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'r') { bubble(ctx, x + 6, y, 6, K.h2, 1); bubble(ctx, x + 19, y, 6, K.o2, 1); }
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }

  // ───────── 繪製 ─────────
  let cv = null, ctx = null, ctrl = null, res = null;
  function liveP() {
    const W0 = S.wipe;
    const rackA = W0 ? (item => {                   // 重新組裝：舊裝置淡出時，器材在器材架上淡入
      const k = { trough: 'tr', rods: 'ro', tubes: 'mo', batt: 'wi', sw: 'wi', coil: 'wi' }[item];
      return W0.P[k] > 0 ? ease(W0.t / 0.5) : 1;
    }) : null;
    return { tr: G.trough, po: G.pour, ro: G.rods, fi: G.fill, mo: G.mount, wi: G.wire, neg: A.neg, rackA };
  }
  function render() {
    if (!cv || !ctx || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    HW = { 'H⁺': pillHalf(ctx, 'H⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻'), 'OH⁻': pillHalf(ctx, 'OH⁻') };
    const oc = outcome(), eD = ease(G.done), a1 = clamp(1 - 2 * eD, 0, 1), a2 = clamp(2 * eD - 1, 0, 1);
    if (a1 > 0.01) { desk(ctx, a1); rackFrame(ctx, a1); }
    ghosts(ctx, a1);
    if (S.wipe) { ctx.save(); ctx.globalAlpha *= 1 - ease(S.wipe.t / 0.5); bench(ctx, S.wipe.P); ctx.restore(); }
    bench(ctx, liveP());
    flashFx(ctx);
    if (a2 > 0.01) { ctx.save(); ctx.globalAlpha *= a2; testPanel(ctx); readouts(ctx); ctx.restore(); }
    checklist(ctx, a1);
    // 上方黃字：階段一＝提示；完成＝綠勾橫幅（約 2.5 秒）→ 原本的實驗提示
    const B = S.bn;
    const hA = A.done ? (B ? 1 - ease(B.t / 0.3) : 0) : 1;
    drawCaption2(ctx, hintText(A.done ? 'wired' : A.hint), hA);
    if (A.done && B) {
      banner(ctx, ease((B.t - 0.3) / 0.3) * (B.out === null ? 1 : 1 - ease(B.out / 0.3)));
      const ck = CAP[capKey(oc)];
      drawCaption(ctx, L(ck[0], ck[1]), B.out === null ? 0 : ease((B.out - 0.3) / 0.3));
    }
    const ab = ABOT[Math.min(A.step, 4)], bk = BOT[botKey(oc)];
    bottomLines(ctx, L(ab[0], ab[1]), a1);
    bottomLines(ctx, L(bk[0], bk[1]), a2);
    drawLegend(ctx);
  }

  // ───────── 結果框 ─────────
  function cfgName() {
    const q = acid() ? L('加稀硫酸', 'dilute sulfuric acid') : L('純水', 'pure water');
    const d = { near: L('近', 'near'), mid: L('中', 'middle'), far: L('遠', 'far') }[S.dist];
    return L(`${q}、電極距離${d}`, `${q}, ${d} gap`);
  }
  function resultHTML() {
    const oc = outcome(), small = s => `<br><small style="font-size:.85em;opacity:.85">${s}</small>`;
    const tubeN = t => (t === 'neg' ? L('負極端', '(−) side') : L('正極端', '(+) side'));
    if (!A.done) return hintText(A.hint) + (A.hint === 'redo' && A.redoOff
      ? small(L('通電中按了重新組裝：已先自動斷電，收集的氣體歸零。', 'You pressed Reassemble while the current was on: the power was switched off first and the gas was reset.')) : '');
    switch (oc) {
      case 'off':
        if (S.notice === 'assembled') return hintText('done');
        if (S.notice === 'autooff') return L(`更換前已自動斷電，氣體歸零（${cfgName()}）。按「通電」重新收集。`,
          `The power was switched off automatically before the change, and the gas was reset (${cfgName()}). Press "Switch on" to collect again.`);
        if (S.notice === 'changed') return L(`裝置改好了（${cfgName()}）。按「通電」看看兩極會不會冒泡。`,
          `Setup changed (${cfgName()}). Press "Switch on" to see whether the electrodes bubble.`);
        return L('選好溶液和電極距離，按「通電」開始收集氣體。', 'Choose the liquid and the electrode gap, then press "Switch on" to collect gas.');
      case 'paused':
        return L(`已斷電，氣體停止產生（H₂ ${fmt(h2Run())} 格、O₂ ${fmt(h2Run() / 2)} 格會保留）。`, `Switched off: no more gas forms (H₂ ${fmt(h2Run())} units and O₂ ${fmt(h2Run() / 2)} units are kept).`) +
          (h2Run() >= 1 ? small(L('可以取出試管檢驗，或再按「通電」接著收集。', 'You can take out a tube and test it, or press "Switch on" to keep collecting.')) : '');
      case 'water':
        return L('純水幾乎沒有離子，電流極小，幾乎不冒泡；要加入一點稀硫酸。', 'Pure water has almost no ions, so the current is tiny and there are almost no bubbles; add a little dilute sulfuric acid.');
      case 'acid':
        return L(`加了稀硫酸，水裡有離子，電流通過：負極端（${sideZh('neg')}邊）收集到氫氣 H₂、正極端（${sideZh('pos')}邊）收集到氧氣 O₂，H₂：O₂ 約 2：1。`,
          `With dilute sulfuric acid the water has ions, so the current flows: hydrogen (H₂) collects at the (−) side (${sideOf('neg')}) and oxygen (O₂) at the (+) side (${sideOf('pos')}), about 2 : 1.`) +
          small(L(`電極距離${{ near: '近', mid: '中', far: '遠' }[S.dist]}，速率 ${RF[S.dist].toFixed(1)}×：電極愈近，電流愈強，產生愈快。`,
            `Gap ${{ near: 'near', mid: 'middle', far: 'far' }[S.dist]}, rate ${RF[S.dist].toFixed(1)}×: the closer the electrodes, the stronger the current and the faster the gas forms.`));
      case 'full':
        if (S.notice === 'fullTry') return L('試管滿了，不能再收集；可以取出試管檢驗，或按「重來」。', 'The tube is full, so no more gas can be collected; test the gas, or press "Start over".');
        return L('試管滿了，已自動斷電：H₂ 6 格、O₂ 3 格，正好 2：1。現在可以取出試管檢驗。', 'The tube is full and the power was switched off: H₂ 6 units, O₂ 3 units, exactly 2 : 1. Now take out a tube and test it.');
      case 'nogas':
        return L(`還沒有收集到氣體：${tubeN(S.tube)}試管要有至少 1 格氣體才能檢驗。`, `No gas collected yet: the ${tubeN(S.tube)} tube needs at least 1 unit of gas before you can test it.`) +
          (acid() ? '' : small(L('純水幾乎不產生氣體，先加稀硫酸再通電。', 'Pure water gives almost no gas; add dilute sulfuric acid, then switch on.')));
      default: {
        const T = S.test, pre = T.off ? L('（已先斷電，取出試管。）', ' (The power was switched off first, then the tube was taken out.)') : '';
        if (T.t < EV) return (T.tool === 'match' ? L(`把點燃的火柴靠近${tubeN(T.tube)}試管口……`, `Bringing a lit match to the mouth of the ${tubeN(T.tube)} tube…`)
          : L(`把帶火星的木條伸進${tubeN(T.tube)}試管……`, `Putting a glowing splint into the ${tubeN(T.tube)} tube…`)) + pre;
        const th = small(L(THINK[0], THINK[1]));
        switch (testKey(T)) {
          case 'pop': return L('火柴靠近負極端試管口：「噗」一聲、火焰一閃——這是氫氣，具有可燃性。', 'A lit match at the mouth of the (−) side tube: a "pop" and a flash — this is hydrogen, which is flammable.') + pre + th;
          case 'relight': return L('帶火星的木條伸進正極端試管：木條復燃——這是氧氣，具有助燃性。', 'A glowing splint in the (+) side tube bursts into flame — this is oxygen, which supports burning.') + pre + th;
          case 'burn': return L('火柴靠近正極端試管：火柴照常燃燒，沒有噗聲——這支不是氫氣。', 'A lit match at the (+) side tube just keeps burning, with no pop — this is not hydrogen.') + pre + th;
          default: return L('帶火星的木條伸進負極端試管：火星熄滅、不會復燃——這支不是氧氣。', 'A glowing splint in the (−) side tube goes out and does not relight — this is not oxygen.') + pre + th;
        }
      }
    }
  }
  let lastRes = '';
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
    if (cv) {
      const ck = CAP[capKey(outcome())];
      const al = L('電解水實驗台：', 'Water electrolysis bench: ') + (A.done ? L(ck[0], ck[1]) : hintText(A.hint));
      if (cv.getAttribute('aria-label') !== al) cv.setAttribute('aria-label', al);
    }
  }

  // ───────── 按鈕 ─────────
  // 階段一：只有目前這一步的一列；階段二：原本 3 列（〔①＋②〕5 顆、〔③〕4 顆含重新組裝、〔④〕5 顆）
  function spec() {
    if (!A.done) {
      switch (Math.min(A.step, 4)) {
        case 0: return [[[L('① 容器', '① Container'), [['asm:trough', L('水槽', 'Trough')], ['asm:cylinder', L('小量筒', 'Small measuring cylinder')]]]]];
        case 1: return [[[L('② 倒入溶液', '② Pour in'), [['asm:water', L('純水', 'Pure water')], ['asm:acid', L('加稀硫酸 H₂SO₄', 'Add dilute H₂SO₄')]]]]];
        case 2: return [[[L('③ 電極材料', '③ Electrode material'), [['asm:carbon', L('碳棒', 'Carbon rods')], ['asm:plastic', L('塑膠棒', 'Plastic rods')]]],
          [L('電極距離', 'Electrode gap'), [['dist:near', L('近', 'Near')], ['dist:mid', L('中', 'Middle')], ['dist:far', L('遠', 'Far')]]]]];
        case 3: return [[[L('④ 試管', '④ Test tubes'), [['asm:fill', L('把兩支試管裝滿水', 'Fill both tubes with water')], ['asm:mount', L('倒立套在電極上', 'Turn them upside down over the electrodes')]]]]];
        default: return [[[L('⑤ 電池負極接哪一支電極？', '⑤ Which electrode goes to the (−) terminal?'), [['asm:left', L('左邊電極', 'Left electrode')], ['asm:right', L('右邊電極', 'Right electrode')]]]]];
      }
    }
    return [
      [[L('① 溶液', '① Liquid'), [['liquid:water', L('純水', 'Pure water')], ['liquid:acid', L('加稀硫酸 H₂SO₄', 'Add dilute H₂SO₄')]]],
        [L('② 電極距離', '② Electrode gap'), [['dist:near', L('近', 'Near')], ['dist:mid', L('中', 'Middle')], ['dist:far', L('遠', 'Far')]]]],
      [[L('③ 動作', '③ Action'), [['act:on', L('通電', 'Switch on')], ['act:off', L('斷電', 'Switch off')], ['act:reset', L('重來', 'Start over')], ['asm:redo', L('重新組裝', 'Reassemble')]]]],
      [[L('④ 檢驗：取哪一支試管', '④ Test: which tube'), [['tube:neg', L(`負極端（${sideZh('neg')}）`, `(−) side (${sideOf('neg')})`)], ['tube:pos', L(`正極端（${sideZh('pos')}）`, `(+) side (${sideOf('pos')})`)]]],
        [L('用什麼檢驗', 'with'), [['tool:match', L('火柴', 'Lit match')], ['tool:splint', L('帶火星木條', 'Glowing splint')]]],
        [null, [['act:test', L('檢驗', 'Test it')]]]]
    ];
  }
  const ctrlKey = () => (A.done ? 'p2' : 'p1:' + Math.min(A.step, 4));
  let builtKey = '';
  function buildControls() {
    if (!ctrl) return;
    const hadFocus = !!(document.activeElement && ctrl.contains(document.activeElement));
    const fk = hadFocus ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    ctrl.style.touchAction = 'pan-y';
    spec().forEach(groups => {
      const row = document.createElement('div'); row.className = 'lab-row';
      groups.forEach(([name, btns], gi) => {          // 每一組自成一個可換行的小群組（窄螢幕換行時不會多出縮排）
        const grp = document.createElement('span');
        grp.style.cssText = 'display:inline-flex;flex-wrap:wrap;gap:8px;align-items:center;max-width:100%' + (gi < groups.length - 1 ? ';margin-right:10px' : '');
        if (name) { const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; grp.appendChild(sp); }
        btns.forEach(([key, label]) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = label;
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => act(key));
          grp.appendChild(b);
        });
        row.appendChild(grp);
      });
      ctrl.appendChild(row);
    });
    builtKey = ctrlKey();
    if (hadFocus) {                                  // 換了一組按鈕：焦點移到新一組的第一顆
      const b = (fk && ctrl.querySelector(`[data-act="${fk}"]`)) || ctrl.querySelector('.lab-btn');
      if (b) b.focus();
    }
  }
  const testing = () => !!(S.test && S.test.t < TEST_T);
  function pressed(key) {
    const [g, v] = key.split(':');
    if (g === 'asm') {
      if (v === 'trough' || v === 'cylinder') return A.container === v;
      if (v === 'water' || v === 'acid') return A.step > 1 && S.liquid === v;
      if (v === 'carbon' || v === 'plastic') return A.rod === v;
      if (v === 'fill') return A.filled;
      if (v === 'mount') return A.mounted;
      if (v === 'left' || v === 'right') return A.neg === v;
      return false;
    }
    if (g === 'liquid') return S.liquid === v;
    if (g === 'dist') return S.dist === v;
    if (g === 'tube') return S.tube === v;
    if (g === 'tool') return S.tool === v;
    if (v === 'on') return S.power;
    if (v === 'off') return !S.power;
    if (v === 'test') return testing();
    return false;
  }
  function refreshUI() {
    if (ctrl && builtKey !== ctrlKey()) buildControls();
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const on = pressed(b.dataset.act);
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    writeResult();
  }
  function clearTest() { if (S.test) { S.testOld = { test: S.test, k: 0 }; S.test = null; } }
  function resetRun() {                             // 新的一次實驗：累計時間歸零，氣體平滑歸零，檢驗淡出
    const v = h2();
    S.drain = v > 0.001 ? { v, t: 0 } : null;
    S.tc = 0; clearTest();
  }
  function asmAct(v) {                              // 階段一的按鈕（不能跳關：不是這一步的按鈕不做事）
    const st = A.step;
    if (v === 'trough' && st === 0) { A.container = 'trough'; A.step = 1; A.hint = 'trough'; }
    else if (v === 'cylinder' && st === 0) { A.container = 'cylinder'; A.hint = 'cylinder'; S.flash = { item: 'cyl', t: 0 }; }
    else if ((v === 'water' || v === 'acid') && st === 1) { S.liquid = v; TF = tFull(); A.step = 2; A.hint = 'poured'; }
    else if (v === 'carbon' && st === 2) { A.rod = 'carbon'; A.step = 3; A.hint = 'rods'; }
    else if (v === 'plastic' && st === 2) { A.rod = 'plastic'; A.hint = 'plastic'; S.flash = { item: 'plastic', t: 0 }; }
    else if (v === 'fill' && st === 3) { if (!A.filled) { A.filled = true; A.hint = 'filled'; } }
    else if (v === 'mount' && st === 3) {
      if (!A.filled) { A.hint = 'notfilled'; S.flash = { item: 'tubes', t: 0 }; }
      else { A.mounted = true; A.step = 4; A.hint = 'mounted'; }
    } else if ((v === 'left' || v === 'right') && st === 4) { A.neg = v; A.step = 5; A.hint = 'wired'; }
  }
  function reassemble() {                           // 回到空桌子：通電中先自動斷電、氣體歸零；保留溶液與距離
    const wasOn = S.power;
    S.power = false; resetRun();
    S.wipe = { t: 0, P: { tr: G.trough, po: G.pour, ro: G.rods, fi: G.fill, mo: G.mount, wi: G.wire, neg: A.neg, snap: true } };
    ['trough', 'pour', 'rods', 'fill', 'mount', 'wire'].forEach(k => { G[k] = 0; });
    A = newAsm('redo'); A.redoOff = wasOn;
    S.notice = null; S.bn = null; S.flash = null; TF = tFull();
  }
  function act(key) {
    const [g, v] = key.split(':');
    if (g === 'asm' && v === 'redo') { if (A.done) reassemble(); refreshUI(); render(); return; }
    if (!A.done) {                                  // 階段一
      if (g === 'asm') asmAct(v);
      else if (g === 'dist' && A.step === 2) { S.dist = v; TF = tFull(); A.hint = 'gap'; }
      refreshUI(); render(); return;
    }
    if (S.bn && S.bn.out === null) S.bn.out = 0;     // 學生開始做實驗：綠勾橫幅提早淡出
    if (g === 'liquid' || g === 'dist') {
      if (S[g] === v) { refreshUI(); return; }
      const wasOn = S.power;
      resetRun();
      S[g] = v; S.power = false; TF = tFull();
      S.notice = wasOn ? 'autooff' : 'changed';
    } else if (g === 'tube' || g === 'tool') {
      S[g] = v; if (S.notice === 'nogas') S.notice = null;
    } else if (v === 'on') {
      if (isFull()) S.notice = 'fullTry';
      else { S.power = true; S.notice = null; clearTest(); }
    } else if (v === 'off') {
      S.power = false; if (S.notice !== 'fullTry') S.notice = null;
    } else if (v === 'reset') {
      resetRun();
      const keep = { wall: S.wall, lx: S.lx, rx: S.rx, drain: S.drain, testOld: S.testOld, xA: S.xA, flowA: S.flowA, swK: S.swK, acidK: S.acidK };
      initState(); Object.assign(S, keep); TF = tFull();
    } else if (v === 'test') {
      if (gasOf(S.tube) < 1 - 1e-6) S.notice = 'nogas';
      else {
        const off = S.power; S.power = false; S.notice = null;
        if (S.test) S.testOld = { test: S.test, k: 0 };
        S.test = { tube: S.tube, tool: S.tool, t: 0, off };
      }
    }
    refreshUI(); render();
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  const R0 = { on: false, raf: 0, timer: 0, last: 0 };
  function step(dt) {
    S.wall += dt;
    if (S.power) {
      S.tc += dt;
      if (acid() && S.tc >= TF) { S.tc = TF; S.power = false; S.notice = 'full'; }
    }
    const ap = (v, target, r) => v + (target - v) * Math.min(1, dt * r);
    S.flowA = ap(S.flowA, S.power && acid() ? 1 : 0, 6);
    S.xA = ap(S.xA, S.power && !acid() ? 1 : 0, 6);
    S.swK = ap(S.swK, S.power ? 1 : 0, 9);
    S.acidK = ap(S.acidK, acid() ? 1 : 0, 5);
    ['flowA', 'xA', 'swK', 'acidK'].forEach(n => { if (S[n] < 0.002) S[n] = 0; if (S[n] > 0.998) S[n] = 1; });
    const tlx = MIDX - DIST[S.dist], trx = MIDX + DIST[S.dist];
    S.lx = ap(S.lx, tlx, 7); S.rx = ap(S.rx, trx, 7);
    if (Math.abs(S.lx - tlx) < 0.05) S.lx = tlx; if (Math.abs(S.rx - trx) < 0.05) S.rx = trx;
    if (S.drain) { S.drain.t += dt; if (S.drain.t >= 0.6) S.drain = null; }
    if (S.test) {
      const before = S.test.t; S.test.t += dt;
      if (before < EV && S.test.t >= EV) S.lastTest = testKey(S.test);
    }
    if (S.testOld) { S.testOld.k += dt; if (S.testOld.k >= FO + FI) S.testOld = null; }
    if (S.notice === 'nogas' && gasOf(S.tube) >= 1) S.notice = null;
    // 組裝：各器材的線性進度（前一件放好了下一件才開始動）
    const adv = (k, ok) => { if (ok && G[k] < 1) G[k] = Math.min(1, G[k] + dt / DUR[k]); };
    adv('trough', A.container === 'trough' && A.step >= 1);
    adv('pour', A.step >= 2 && G.trough >= 1);
    adv('rods', A.rod === 'carbon' && A.step >= 3 && G.trough >= 1);
    adv('fill', A.filled);
    adv('mount', A.mounted && G.rods >= 1 && G.pour >= 1 && G.fill >= 1);
    adv('wire', !!A.neg && G.mount >= 1);
    if (A.step === 5 && !A.done && G.wire >= 1) { A.done = true; A.hint = 'done'; S.notice = 'assembled'; S.bn = { t: 0, out: null }; }
    G.done = clamp(G.done + (A.done ? dt : -dt) / DUR.done, 0, 1);
    if (S.bn) { S.bn.t += dt; if (S.bn.out !== null) S.bn.out += dt; else if (S.bn.t >= 2.8) S.bn.out = 0; }
    if (S.wipe) { S.wipe.t += dt; if (S.wipe.t >= 0.5) S.wipe = null; }
    if (S.flash) { S.flash.t += dt; if (S.flash.t >= 0.9) S.flash = null; }
    S.mirK = clamp(S.mirK + (negR() ? dt : -dt) / 0.6, 0, 1);
    const gt = { trough: A.step === 0, rods: A.step === 2, tubes: A.step === 3, wires: A.step === 4 };
    Object.keys(S.gh).forEach(n => { S.gh[n] = ap(S.gh[n], gt[n] ? 1 : 0, 8); if (S.gh[n] < 0.002) S.gh[n] = 0; if (S.gh[n] > 0.998) S.gh[n] = 1; });
  }
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.1, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt); render(); refreshUI();
    R0.raf = requestAnimationFrame(frame);
  }
  function poll() { if (R0.timer || !R0.on) return; R0.timer = setTimeout(() => { R0.timer = 0; sync(); }, 300); }
  function sync() {
    const want = R0.on && !document.hidden;
    if (want && !R0.raf && !R0.timer) { R0.last = 0; R0.raf = requestAnimationFrame(frame); }
    else if (!want) { if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0; if (R0.timer) clearTimeout(R0.timer); R0.timer = 0; }
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (R0.on) deactivate();
    cv = document.getElementById('waterLabCanvas');
    if (!cv || !cv.getContext) { cv = null; return; }
    ctx = cv.getContext('2d');
    ctrl = document.getElementById('waterLabControls');
    res = document.getElementById('waterLabResult');
    R0.on = true; lastRes = ''; builtKey = '';
    document.addEventListener('visibilitychange', onVis);
    buildControls(); refreshUI(); render(); sync();
  }
  function deactivate() {
    R0.on = false;
    if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0;
    if (R0.timer) clearTimeout(R0.timer); R0.timer = 0;
    document.removeEventListener('visibilitychange', onVis);
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; builtKey = '';
  }
  function relang() {
    if (!R0.on || !cv) return;
    lastRes = ''; buildControls(); refreshUI(); render();
  }
  function _state() {
    const T = testing() ? { tube: S.test.tube, tool: S.test.tool } : null;
    return {
      liquid: S.liquid, dist: S.dist, power: S.power,
      h2: +h2().toFixed(4), o2: +o2().toFixed(4), rate: rate(),
      testing: T, lastTest: S.lastTest,
      tube: S.tube, tool: S.tool, full: isFull(), tc: +S.tc.toFixed(3), outcome: outcome(), notice: S.notice,
      shownTest: S.test ? testKey(S.test) : null, testT: S.test ? +S.test.t.toFixed(3) : null,
      flowA: +S.flowA.toFixed(3), nx: +negX().toFixed(2), px: +posX().toFixed(2), running: !!R0.raf, on: R0.on,
      asm: { step: A.step, done: A.done, container: A.container, liquid: S.liquid, rod: A.rod, dist: S.dist,
        filled: A.filled, mounted: A.mounted, negSide: A.neg, hint: A.hint },
      phase: A.done ? 2 : 1, hintText: A.done ? '' : hintText(A.hint),
      anim: { trough: +G.trough.toFixed(3), pour: +G.pour.toFixed(3), rods: +G.rods.toFixed(3), fill: +G.fill.toFixed(3),
        mount: +G.mount.toFixed(3), wire: +G.wire.toFixed(3), done: +G.done.toFixed(3), wipe: !!S.wipe, flash: S.flash ? S.flash.item : null }
    };
  }

  window.ElLab.water = { activate, deactivate, relang, _state };
})();
