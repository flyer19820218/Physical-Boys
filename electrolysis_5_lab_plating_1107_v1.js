/* electrolysis_5_lab_plating_1107_v1.js — 「🔬 動手做：自己裝一套電鍍」學生實驗台（#platingLabCanvas，邏輯 1000×600）
 *
 * 契約：window.ElLab.plating = { activate(), deactivate(), relang(), _state() }
 * 頁面膠水：切到電鍍分頁呼叫 activate()、離開呼叫 deactivate()、切語言呼叫 relang()；activate 前呼叫其他三個也安全。
 * 只依賴頁面的 tr()；按鈕建在 #platingLabControls（.lab-row／.lab-name／.lab-btn，頁面 CSS），一句結果寫進 #platingLabResult。
 * 畫布不綁事件（只用按鈕）。畫風、色彩與工具函式沿用同課動畫 electrolysis_5_plating／cucu／cuc／intro：
 * 燒杯、液面亮線、鐵湯匙、銅片（漸層＋變薄虛線）、碳棒、新析出的紅色銅、橘／紫離子膠囊、電子藍球、O₂ 粉紅空心氣泡、
 * 電池（長細＝正極、短粗＝負極）、開關（打開時導線真的留缺口）、白底電流表（只有刻度、沒有數字）、水龍頭沖洗。
 *
 * ── 學生決定三件事，再通電 ─────────────────────────────────
 *   ① 湯匙接：負極端／正極端    ② 另一支電極：銅片／碳棒    ③ 電解液：硫酸銅溶液／純水
 *   ④ 動作：通電／斷電／取出、清水沖洗／重來
 *   初始：湯匙接正極端、銅片、純水、斷電（三大原則 0/3），讓學生可以直接試錯。
 *   接線固定：左邊夾子＝負極端（接電池負極）、右邊夾子＝正極端（接電池正極）。「湯匙接正極端」＝湯匙掛到右邊夾子、
 *   另一支電極換到左邊；兩支電極的名稱跟著移動，被換過的那支閃一下黃色虛線框。
 *   任何配置變更都回到未鍍狀態（鍍層、銅片、藍色、計時全部重置）；變更時若正在通電，先自動斷電。
 *
 * ── 模型（全部只由「通電累計時間 tc」與配置決定；斷電時 tc 不走＝凍結） ───────────────
 *   導電＝通電且電解液是硫酸銅；純水不導電（tc 不走、指針不動、沒有電子流、溶液中央紅叉）。
 *   prog＝clamp(tc／12)：約 12 秒滿格。
 *   湯匙在負極端＋硫酸銅：coat＝prog（由匙頭往上長，厚度 1.2→3.2）。
 *     另一支＝銅片（正確）：plateMass＝1−0.45·prog（正極端銅片變薄，虛線＝原厚度）、blue＝1（Cu²⁺ 從銅片補進來）。
 *     另一支＝碳棒：blue＝1−0.7·prog（藍色變淡），正極端碳棒冒 O₂ 小氣泡，Cu²⁺ 從溶液裡過來、越來越少。
 *   湯匙在正極端＋硫酸銅：銅鍍在左邊（負極端）那支電極上（otherCoat＝prog），湯匙不變；blue＝1−0.7·prog。
 *     （真實的鐵湯匙接正極端會溶解，這裡不畫，只在結果框小字提示。）
 *   離子：Cu²⁺ 兩列（y 300／392）各 2 顆，通電時往負極端移動、在表面淡出（附著）；正確配置時新的 Cu²⁺ 從正極端銅片表面淡入，
 *   其他配置從溶液裡淡入、數量隨 blue 減少。SO₄²⁻ 兩列（y 346／438）各 2 顆，通電後往正極端偏移一點。
 *   電子：只在導線與電極裡，電池負極 → 導線 → 左電極；右電極 → 導線（經電流表、開關）→ 電池正極；位置＝tc 的函式。
 *   電子流透明度、電流表指針、紅叉、氣泡透明度用 dt 平滑（約 0.3 秒），不會突變。
 *   取出、清水沖洗：先斷電，湯匙在燒杯裡抬起淡出（留虛線輪廓），右欄出現水龍頭沖洗（3.6 秒），之後 rinsed＝true。
 *   沖洗後按「通電」＝把湯匙放回去接著鍍。重來＝全部回初始。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   y 0–30 不放東西。y≈58 狀態一句（黃，置中於 x 480，寬 ≤ 800，避開右上角 90px）。
 *   外導線 y=118：左電極 x=155 → 電池（短粗＝負極 x=232、長細＝正極 x=248）→ 開關 x 300–340 → 電流表（中心 x=430）→ 右電極 x=510。
 *   燒杯 x 75–590、杯口 240、液面 272、杯底 474；y=256 液體名稱（未開始時）／兩極的變化標示（開始鍍之後）。
 *   右欄 x 670–960：三大原則檢查表（✓ 綠／✗ 紅，圖示裡有符號）、觀察量表（湯匙鍍層、銅片厚度、溶液藍色）或沖洗畫面。
 *   y≈506–536 本次一句重點（黃）；y≈574 圖例（x 40–900，避開右下角 90px）。
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
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    nuHi: '#f39468', nu: '#d2653a', nuLo: '#93401d',
    feHi: '#e3e8eb', fe: '#a9b2b9', feLo: '#6b767e', feText: '#cfd7dc',
    cHi: '#6b7370', cMid: '#454b49', cLo: '#2a2f2d',
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)',
    water: 'rgba(206,234,246,0.78)', o2: '#ff78b7'
  };
  const BLUE = a => `rgba(40,110,200,${(0.55 * a).toFixed(4)})`;
  const PALE = a => `rgba(205,228,232,${(0.10 + 0.14 * (1 - a)).toFixed(4)})`;
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const frac = v => v - Math.floor(v);
  const L = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

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

  // ───────── 幾何 ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272, LOWY = LIQ + 6;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440, HW0 = EW / 2, MIDX = (NX + PX) / 2;
  const SP_BY = 225, SP_RX = 28, SP_RY = 54, SP_HL = 192;
  const spoonR = ly => {
    let r = ly >= 0 && ly <= SP_HL ? 10 - 2 * ly / SP_HL : 0;
    const dy = (ly - SP_BY) / SP_RY;
    if (Math.abs(dy) < 1) r = Math.max(r, SP_RX * Math.sqrt(1 - dy * dy));
    return r;
  };
  const WY = 118, BN = 222, BP = 238, BATX = 230;
  const SW0 = 296, SW1 = 336;
  const MX = 430, MW = 110, MH = 64, MPIV = { x: MX, y: WY + 20 }, NEEDLE = 32;
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 380 }]);
  const E_R = mkPath([{ x: PX, y: 330 }, { x: PX, y: WY }, { x: BP, y: WY }]);
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 670, RW = 290;
  const CU_ROWS = [300, 392], SO_ROWS = [346, 438];
  const WATER = [{ x: 215, y: 300 }, { x: 300, y: 296 }, { x: 430, y: 306 }, { x: 200, y: 446 }, { x: 305, y: 450 },
    { x: 425, y: 442 }, { x: 455, y: 372 }, { x: 205, y: 372 }];
  const FULL_T = 12, RINSE_T = 3.6;

  // ───────── 狀態 ─────────
  const S = {};
  function initState() {
    Object.assign(S, {
      spoon: 'pos', other: 'cu', liquid: 'water', power: false,
      tc: 0, rinse: null, notice: 'init', flash: null,
      flowA: 0, needle: 0, xA: 0, wall: 0
    });
  }
  initState();
  const conducting = () => S.power && S.liquid === 'cuso4' && !S.rinse;
  const prog = () => clamp(S.tc / FULL_T, 0, 1);
  const principles = () => [S.spoon === 'neg', S.spoon === 'neg' && S.other === 'cu', S.liquid === 'cuso4'];
  const nOK = () => principles().filter(Boolean).length;
  function derived() {
    const p = prog(), cu = S.liquid === 'cuso4';
    const correct = cu && S.spoon === 'neg' && S.other === 'cu';
    return {
      coat: cu && S.spoon === 'neg' ? p : 0,
      otherCoat: cu && S.spoon === 'pos' ? p : 0,
      plateMass: S.other === 'cu' && correct ? 1 - 0.45 * p : 1,
      blue: !cu ? 0 : correct ? 1 : 1 - 0.7 * p
    };
  }
  function outcome() {
    if (S.rinse) return S.rinse.t < RINSE_T ? 'rinsing' : 'rinsed';
    if (!S.power) return prog() > 0 ? 'paused' : 'off';
    if (S.liquid === 'water') return 'water';
    if (S.spoon === 'pos') return 'spoonPos';
    if (S.other === 'c') return 'carbon';
    return 'ok';
  }
  const spoonX = () => (S.spoon === 'neg' ? NX : PX);
  const otherX = () => (S.spoon === 'neg' ? PX : NX);

  // ───────── 圖形：燒杯、溶液 ─────────
  function beakerPath(ctx) {
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
  function beakerBack(ctx) { ctx.save(); innerClip(ctx, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); ctx.restore(); }
  function liquid(ctx, blue) {
    ctx.save(); innerClip(ctx, LIQ); ctx.fillStyle = PALE(blue); ctx.fill();
    if (blue > 0.001) { ctx.fillStyle = BLUE(blue); ctx.fill(); }
    ctx.strokeStyle = 'rgba(205,240,250,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(BX0 + 2, LIQ); ctx.lineTo(BX1 - 2, LIQ); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(BX0 + 2, LIQ + 4); ctx.lineTo(BX1 - 2, LIQ + 4); ctx.stroke();
    ctx.restore();
  }
  function beakerFront(ctx) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    beakerPath(ctx); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    beakerPath(ctx); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  function cuFill(ctx, x0, x1, nu) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    if (nu) { g.addColorStop(0, K.nuLo); g.addColorStop(0.3, K.nuHi); g.addColorStop(0.65, K.nu); g.addColorStop(1, K.nuLo); }
    else { g.addColorStop(0, K.cuLo); g.addColorStop(0.3, K.cuHi); g.addColorStop(0.65, K.cu); g.addColorStop(1, K.cuLo); }
    return g;
  }
  function feFill(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, K.feLo); g.addColorStop(0.32, K.feHi); g.addColorStop(0.68, K.fe); g.addColorStop(1, K.feLo);
    return g;
  }

  // ───────── 圖形：銅片、碳棒、新析出的銅 ─────────
  const plateHW = pm => HW0 - 12 * (1 - pm);
  function plate(ctx, x, hw) {
    ctx.save();
    if (hw >= HW0 - 0.01) {
      ctx.fillStyle = cuFill(ctx, x - HW0, x + HW0); rrect(ctx, x - HW0, ETOP, EW, EBOT - ETOP, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.fillStyle = cuFill(ctx, x - HW0, x + HW0); rrect(ctx, x - HW0, ETOP, EW, LOWY + 4 - ETOP, [6, 6, 2, 2]); ctx.fill();
      ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = cuFill(ctx, x - hw, x + hw); rrect(ctx, x - hw, LOWY, hw * 2, EBOT - LOWY, Math.min(6, hw)); ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  function plateGhost(ctx, x, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(242,236,217,0.75)'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
    rrect(ctx, x - HW0, LOWY, EW, EBOT - LOWY, 6); ctx.stroke(); ctx.restore();
  }
  function rod(ctx, x) {
    const x0 = x - HW0;
    ctx.save();
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, K.cLo); g.addColorStop(0.3, K.cHi); g.addColorStop(0.65, K.cMid); g.addColorStop(1, K.cLo);
    ctx.fillStyle = g; rrect(ctx, x0, ETOP, EW, EBOT - ETOP, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(170,182,178,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function deposit(ctx, x, oc) {                    // 負極端電極（銅片或碳棒）上新析出的紅色銅
    if (oc <= 0.001) return;
    const th = 1 + 3 * oc, al = ease(oc / 0.08);
    ctx.save(); ctx.globalAlpha *= al;
    const x0 = x - HW0 - th, x1 = x + HW0 + th;
    ctx.fillStyle = cuFill(ctx, x0, x1, true); rrect(ctx, x0, LOWY, x1 - x0, EBOT - LOWY + th, 6 + th); ctx.fill();
    ctx.strokeStyle = 'rgba(90,40,12,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,205,160,0.45)';
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(lerp(x0 + 4, x1 - 4, hash(k * 3.3)), LOWY + 14 + k * 17, 1.7, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function clip(ctx, x) { ctx.save(); ctx.fillStyle = '#5a3a22'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill(); ctx.restore(); }

  // ───────── 圖形：湯匙（同 plating 動畫） ─────────
  function spoonPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-8, SP_HL); ctx.lineTo(-10, 10); ctx.quadraticCurveTo(-10, 0, 0, 0); ctx.quadraticCurveTo(10, 0, 10, 10);
    ctx.lineTo(8, SP_HL); ctx.closePath();
    ctx.moveTo(SP_RX, SP_BY); ctx.ellipse(0, SP_BY, SP_RX, SP_RY, 0, 0, TAU);
  }
  function spoon(ctx, o) {
    const al = o.alpha === undefined ? 1 : o.alpha;
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.translate(o.x, o.y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.s || 1, o.s || 1);
    ctx.lineJoin = 'round';
    if (o.ghost) {
      ctx.strokeStyle = 'rgba(242,236,217,0.7)'; ctx.lineWidth = 1.8 / (o.s || 1); ctx.setLineDash([6, 5]);
      ctx.save(); ctx.beginPath(); ctx.rect(-100, -100, 200, 500); ctx.ellipse(0, SP_BY, SP_RX, SP_RY, 0, 0, TAU); ctx.clip('evenodd');
      ctx.beginPath(); ctx.moveTo(-8, SP_HL); ctx.lineTo(-10, 10); ctx.quadraticCurveTo(-10, 0, 0, 0); ctx.quadraticCurveTo(10, 0, 10, 10); ctx.lineTo(8, SP_HL);
      ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, SP_BY, SP_RX, SP_RY, 0, 0, TAU); ctx.stroke(); ctx.restore(); return;
    }
    spoonPath(ctx); ctx.strokeStyle = 'rgba(30,38,42,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = feFill(ctx, -SP_RX, SP_RX); ctx.fill();
    ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-9, SP_BY - 14, 5, 22, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (o.tint) { spoonPath(ctx); ctx.fillStyle = o.tint; ctx.fill(); }
    if (o.coat > 0.001) { ctx.save(); ctx.globalAlpha *= ease(o.coat / 0.05); coatLayer(ctx, coatFront(o.coat), 1.2 + 2 * o.coat); ctx.restore(); }
    ctx.restore();
  }
  const coatFront = c => lerp(446, LIQ + 2, ease(c / 0.6)) - ETOP;      // 湯匙局部座標：鍍層由匙頭往上長到液面
  function coatLayer(ctx, front, th) {
    [[front, 400, 1], [front - 12, front, 0.4]].forEach(([y0, y1, a]) => {
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); ctx.rect(-60, y0, 120, y1 - y0); ctx.clip();
      spoonPath(ctx); ctx.strokeStyle = K.cuLo; ctx.lineWidth = th * 2; ctx.stroke();
      ctx.fillStyle = cuFill(ctx, -SP_RX - th, SP_RX + th); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,140,0.85)'; ctx.lineWidth = 1.4; spoonPath(ctx); ctx.stroke();
      if (a === 1) {
        ctx.fillStyle = 'rgba(255,205,160,0.5)';
        for (let k = 0; k < 10; k++) {
          const ly = SP_BY - 46 + k * 10 + 4 * hash(k * 3.3), r = spoonR(ly) - 3;
          if (ly < y0 || r <= 2) continue;
          ctx.beginPath(); ctx.arc((k % 2 ? 1 : -1) * r * 0.75, ly, 1.6, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  // ───────── 圖形：離子、電子、元件 ─────────
  let HWP = { 'Cu²⁺': 34, 'SO₄²⁻': 42 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {
    if (al <= 0.01) return;
    const hw = HWP[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
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
  function bubble(ctx, x, y, r, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.strokeStyle = K.o2; ctx.lineWidth = 2;
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
  function battery(ctx) {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 24); ctx.lineTo(BP, WY + 24); ctx.stroke();
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 12); ctx.lineTo(BN, WY + 12); ctx.stroke();
    ctx.restore();
    text(ctx, '−', BN - 18, WY - 20, K.electron, 28, 'center');
    text(ctx, '+', BP + 18, WY - 20, K.pos, 28, 'center');
  }
  function switchSym(ctx, k) {
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
  function meter(ctx, k) {
    ctx.save();
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(ctx, MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    const a0 = -60 * RAD, a1 = 60 * RAD, R = 38;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    const ang = lerp(-56, 30, k) * RAD - Math.PI / 2;
    ctx.strokeStyle = k > 0.05 ? '#c0392b' : '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'A', MX + 42, WY + 17, '#1f2a26', 22, 'center', 1, true);
  }
  function mark(ctx, ok, x, y) {                    // ✓ 綠勾／✗ 紅叉（圓框裡有符號，不只靠顏色）
    ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const c = ok ? K.green : K.red;
    ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
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
  function flashBox(ctx, x, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    rrect(ctx, x - 40, ETOP - 12, 80, EBOT - ETOP + 22, 12); ctx.stroke(); ctx.restore();
  }

  // ───────── 依 tc 算出的運動（純函式） ─────────
  // Cu²⁺：4 顆（每列 2 顆、相位差半圈）。通電時由正極端往負極端走，到負極端表面淡出（附著）。
  const CU_PH = [0.12, 0.62, 0.37, 0.87], CU_TH = [0.86, 0.68, 0.5, 0.0], V_CU = 40;
  function ions(ctx, d) {
    const tc = S.tc, xL0 = NX + 32, xR0 = PX - 32;
    const correct = S.spoon === 'neg' && S.other === 'cu';
    const hwC = HWP['Cu²⁺'], hwS = HWP['SO₄²⁻'];
    const xL = xL0 + hwC, xR = xR0 - hwC, xB = correct ? xR : xR - 58;    // 正確配置：從銅片表面生出；其他：從溶液裡過來
    for (let k = 0; k < 4; k++) {
      const y0 = CU_ROWS[k >> 1];
      const u = frac(CU_PH[k] + tc * V_CU / (xR - xL));
      let x, a;
      if (correct) { x = lerp(xR, xL, u); a = ease(u / 0.08) * (1 - ease((u - 0.9) / 0.1)); }
      else {
        x = lerp(xB, xL, u); a = ease(u / 0.12) * (1 - ease((u - 0.9) / 0.1));
        a *= clamp((d.blue - CU_TH[k]) / 0.08, 0, 1);  // 銅離子越用越少
      }
      if (tc <= 0) a = 1;                            // 還沒開始：離子都在溶液裡
      const jy = 3 * Math.sin(tc * 1.7 + k * 2.3);
      ionPill(ctx, x, y0 + jy, 'Cu²⁺', 0, a);
    }
    const SO_PH = [0.05, 0.75, 0.25, 0.95];
    const sx0 = xL0 + hwS, sx1 = xR0 - hwS - 40, shift = 36 * ease(Math.min(tc, 2.5) / 2.5);
    for (let k = 0; k < 4; k++) {
      const y0 = SO_ROWS[k >> 1], x = lerp(sx0, sx1, SO_PH[k]) + shift + 3 * Math.sin(tc * 1.1 + k * 1.9);
      ionPill(ctx, x, y0 + 3 * Math.sin(tc * 1.5 + k * 2.9), 'SO₄²⁻', 1, 1);
    }
  }
  function flowE(ctx) {
    const al = S.flowA;
    if (al <= 0.01) return;
    const V = 110, sp = 52, d = V * S.tc;
    [E_L, E_R].forEach(P => {
      for (let k = -1; k * sp < P.L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > P.L) continue;
        const p = at(P, s), fade = clamp(Math.min(s, P.L - s) / 26, 0, 1);
        ball(ctx, p.x, p.y, 8, fade * al);
      }
    });
  }
  function bubbles(ctx) {                           // 正極端碳棒表面的 O₂：每 0.3 s（tc）一顆，往上冒
    const al = S.flowA;
    if (al <= 0.01 || S.liquid !== 'cuso4' || S.spoon !== 'neg' || S.other !== 'c') return;
    const tc = S.tc, PS = PX - HW0, kHi = Math.floor(tc / 0.3), kLo = Math.max(0, Math.floor((tc - 3) / 0.3));
    for (let k = kLo; k <= kHi; k++) {
      const h1 = hash(k * 3.1 + 7), h2 = hash(k * 7.7 + 1.3), h3 = hash(k * 1.9 + 4.2);
      const age = tc - (k * 0.3 + h1 * 0.1);
      if (age < 0) continue;
      const r = 3.5 + h3 * 2.8, y = 296 + h2 * 140 - 78 * age * (0.85 + 0.3 * h3);
      if (y - r <= LIQ + 2) continue;
      const x = PS - r - 3 - Math.min(4, 10 * age) - 1.5 * Math.sin(age * 7 + k);
      bubble(ctx, x, y, r, al * clamp(age / 0.15, 0, 1) * clamp((y - r - LIQ - 2) / 10, 0, 1));
    }
  }

  // ───────── 裝置 ─────────
  function rinseK() { return S.rinse ? S.rinse.t : 0; }
  function electrodes(ctx, d, immersed) {
    const sx = spoonX(), ox = otherX(), rt = rinseK();
    const lift = S.rinse ? 30 * ease(rt / 0.8) : 0, sa = S.rinse ? 1 - ease((rt - 0.2) / 0.6) : 1;
    const tint = immersed ? (S.liquid === 'cuso4' ? `rgba(40,110,200,${(0.22 * Math.max(d.blue, 0.25)).toFixed(3)})` : 'rgba(205,228,232,0.12)') : null;
    spoon(ctx, { x: sx, y: ETOP - lift, alpha: sa, tint, coat: d.coat });
    if (S.other === 'cu') {
      const hw = plateHW(d.plateMass);
      plate(ctx, ox, hw);
      if (immersed) { ctx.save(); ctx.fillStyle = tint; rrect(ctx, ox - hw, LIQ + 2, hw * 2, EBOT - LIQ - 2, Math.min(6, hw)); ctx.fill(); ctx.restore(); }
    } else {
      rod(ctx, ox);
      if (immersed) { ctx.save(); ctx.fillStyle = 'rgba(16,58,72,0.30)'; rrect(ctx, ox - HW0, LIQ + 2, EW, EBOT - LIQ - 2, 8); ctx.fill(); ctx.restore(); }
    }
  }
  function apparatus(ctx, d) {
    const p = prog(), oc = outcome(), ox = otherX(), sx = spoonX(), rt = rinseK();
    beakerBack(ctx);
    electrodes(ctx, d, false);
    liquid(ctx, d.blue);
    ctx.save(); innerClip(ctx, LIQ + 1); ctx.clip(); electrodes(ctx, d, true); ctx.restore();
    if (S.other === 'cu') plateGhost(ctx, ox, clamp((HW0 - plateHW(d.plateMass)) / 0.8, 0, 1));
    if (S.spoon === 'pos') deposit(ctx, ox, d.otherCoat);
    if (S.rinse) spoon(ctx, { x: sx, y: ETOP, ghost: true, alpha: ease((rt - 0.6) / 0.5) });
    if (S.liquid === 'cuso4') ions(ctx, d);
    else WATER.forEach((w, k) => waterMol(ctx, w.x + 2 * Math.sin(k * 1.3), w.y + 2 * Math.sin(k * 2.1), 0.95));
    bubbles(ctx);
    beakerFront(ctx);
    if (S.flash) {
      const fa = S.flash.t < 0.9 ? 1 - ease((S.flash.t - 0.5) / 0.4) : 0;
      if (S.flash.slots.indexOf('L') >= 0) flashBox(ctx, NX, fa);
      if (S.flash.slots.indexOf('R') >= 0) flashBox(ctx, PX, fa);
    }
    // y=256：液體名稱（還沒開始鍍）→ 兩極的變化（開始鍍之後）
    const nameA = S.liquid === 'water' ? 1 : 1 - ease(p / 0.03);
    text(ctx, S.liquid === 'water' ? L('純水（幾乎沒有離子）', 'Pure water (almost no ions)') : L('硫酸銅溶液（含 Cu²⁺）', 'CuSO₄ solution (has Cu²⁺)'),
      MIDX, 256, K.white, 22, 'center', nameA);
    if (S.liquid === 'cuso4') {
      const ea = ease((p - 0.04) / 0.05);
      let l, r, rc = K.cuText;
      if (S.spoon === 'pos') { l = L('銅鍍到這裡', 'Cu goes here'); r = L('湯匙沒鍍上', 'no coat'); rc = K.feText; }
      else if (S.other === 'c') { l = L('鍍上紅色 Cu', 'Cu coats it'); r = L('O₂ 氣泡', 'O₂ bubbles'); rc = K.o2; }
      else { l = L('鍍上紅色 Cu', 'Cu coats it'); r = L('銅片變薄', 'thinner'); }
      if (S.rinse) l = '';
      text(ctx, l, NX + 34, 256, K.cuText, 22, 'left', ea);
      text(ctx, r, PX - HW0 - 10, 256, rc, 22, 'right', ea);
    }
    // 純水通電：溶液中央紅叉
    bigX(ctx, MIDX, 350, S.xA);
    text(ctx, L('沒有離子，不導電', 'No ions: no current'), MIDX, 398, K.red, 22, 'center', S.xA);
    // 電路：導線 → 夾子 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w));
    clip(ctx, NX); clip(ctx, PX);
    flowE(ctx);
    switchSym(ctx, S.swK);
    meter(ctx, S.needle);
    battery(ctx);
    text(ctx, L('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, L('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, L('電流表', 'Ammeter'), MX, WY + MH / 2 + 20, K.white, 22, 'center');
    text(ctx, L('負極端', '(−) side'), NX - 24, 182, K.electron, 24, 'right');
    text(ctx, L('正極端', '(+) side'), PX + HW0 + 14, 182, K.pos, 24, 'left');
    const nm = { spoon: L('鐵湯匙', 'Iron spoon'), cu: L('銅片', 'Copper'), c: L('碳棒', 'Carbon') };
    const sa = S.rinse ? 1 - ease((rt - 0.2) / 0.6) : 1;
    const leftKind = S.spoon === 'neg' ? 'spoon' : S.other, rightKind = S.spoon === 'neg' ? S.other : 'spoon';
    const lc = k => (k === 'spoon' ? K.feText : k === 'cu' ? K.cuText : K.muted);
    text(ctx, nm[leftKind], NX + 24, 206, lc(leftKind), 22, 'left', leftKind === 'spoon' ? sa : 1);
    text(ctx, nm[rightKind], PX + HW0 + 14, 212, lc(rightKind), 22, 'left', rightKind === 'spoon' ? sa : 1);
    void oc;
  }

  // ───────── 右欄：三大原則檢查表＋觀察量表／沖洗 ─────────
  function checklist(ctx) {
    const pr = principles(), n = nOK();
    const title = L('三大原則檢查表', 'Rule check');
    text(ctx, title, RX, 112, K.white, 26, 'left');
    text(ctx, `${n}/3`, RX + textW(ctx, title, 26) + 14, 112, n === 3 ? K.green : K.yellow, 26, 'left', 1, true);
    const rows = [L('被鍍物（湯匙）\n在負極端', 'Object (spoon) on the (−) side'),
      L('欲鍍金屬（銅片）\n在正極端', 'Plating metal (Cu) on the (+) side'),
      L('電解液含銅離子\n（硫酸銅）', 'Solution has Cu²⁺ (CuSO₄)')];
    let y = 154;
    rows.forEach((s, k) => {
      mark(ctx, pr[k], RX + 14, y);
      y = block(ctx, s, RX + 38, y, RW - 38, pr[k] ? K.white : K.feText, 22, 'left', 1, 28) + 10;
    });
    return y;
  }
  function gauges(ctx, y, d) {
    const labels = [L('湯匙鍍銅', 'Spoon coat'), L('銅片厚度', 'Cu plate'), L('溶液藍色', 'Blue color')];
    const lw = Math.max.apply(null, labels.map(s => textW(ctx, s, 22)));
    const bx = RX + lw + 14, bw = RX + RW - bx;
    const thick = S.other !== 'cu' ? null : S.spoon === 'neg' ? d.plateMass : 1 + 0.25 * d.otherCoat;
    const vals = [d.coat, thick === null ? null : thick / 1.25, d.blue];
    const fills = [cuFill(ctx, bx, bx + bw), cuFill(ctx, bx, bx + bw), 'rgba(60,130,225,0.95)'];
    labels.forEach((s, k) => {
      const yy = y + 18 + k * 38;
      text(ctx, s, RX, yy, K.white, 22, 'left');
      if (vals[k] === null) { text(ctx, L('（沒有銅片）', '(none)'), bx, yy, K.muted, 22, 'left'); return; }
      ctx.save();
      ctx.fillStyle = 'rgba(242,236,217,0.10)'; rrect(ctx, bx, yy - 9, bw, 18, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(242,236,217,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      const v = clamp(vals[k], 0, 1);
      if (v > 0.005) { ctx.fillStyle = fills[k]; rrect(ctx, bx, yy - 9, Math.max(bw * v, 4), 18, 9); ctx.fill(); }
      if (k === 1) {                                 // 原厚度刻度
        ctx.strokeStyle = K.white; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(bx + bw * 0.8, yy - 13); ctx.lineTo(bx + bw * 0.8, yy + 13); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function rinsePanel(ctx, y0, d) {
    const rt = rinseK(), al = ease((rt - 0.5) / 0.5);
    if (al <= 0.01) return;
    const bx = RX + 40, s = 0.5, sy = y0 + 84, bowlTop = sy - SP_RX * s, bowlBot = sy + SP_RX * s;
    const flow = ease((rt - 1.0) / 0.35) * (1 - ease((rt - 3.0) / 0.35));
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + 14);
    g.addColorStop(0, '#c3cbd0'); g.addColorStop(1, '#69747b');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(20,28,30,0.9)'; ctx.lineWidth = 2;
    rrect(ctx, RX + 4, y0, bx - RX + 6, 14, 5); ctx.fill(); ctx.stroke();
    rrect(ctx, bx - 8, y0 + 8, 16, 18, [0, 0, 4, 4]); ctx.fill(); ctx.stroke();
    rrect(ctx, RX + 14, y0 - 10, 10, 12, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (flow > 0.01) {
      const yA = y0 + 26, yB = bowlTop;
      ctx.save(); ctx.globalAlpha *= al * flow;
      ctx.fillStyle = K.water; rrect(ctx, bx - 4, yA, 8, yB - yA, 3); ctx.fill();
      ctx.save(); rrect(ctx, bx - 4, yA, 8, yB - yA, 3); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let k = 0; k < 6; k++) { const yy = yA + ((rt * 160 + k * 14) % 60); ctx.fillRect(bx - 1.5, yy, 3, 6); }
      ctx.restore(); ctx.restore();
    }
    spoon(ctx, { x: bx + 225 * s, y: sy, s, rot: Math.PI / 2, alpha: al, coat: d.coat });
    if (flow > 0.3) {
      ctx.save(); ctx.fillStyle = K.water;
      for (let k = 0; k < 4; k++) {
        const p = (rt * 1.8 + k / 4) % 1, dir = k % 2 ? 1 : -1;
        ctx.globalAlpha = al * flow * (1 - p);
        ctx.beginPath(); ctx.arc(bx + dir * (6 + 18 * p), bowlTop - 8 * Math.sin(p * Math.PI) - 1, 2.6, 0, TAU); ctx.fill();
      }
      for (let k = 0; k < 4; k++) {
        const p = (rt * 1.3 + k / 4) % 1, x = bx + (hash(k + 7) - 0.5) * 16;
        ctx.globalAlpha = al * flow * (1 - p) * 0.95;
        ctx.beginPath(); ctx.ellipse(x, bowlBot + 4 + 22 * p, 2.6, 4, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    const tx = RX + 74;
    block(ctx, L('取出湯匙，\n用清水沖洗', 'Spoon out, rinsed with water'), tx, y0 + 6, RX + RW - tx, K.white, 22, 'left', al, 28);
    const coated = d.coat >= 0.15, ta = ease((rt - 2.6) / 0.5);
    block(ctx, coated ? L('鍍上銅了 ✓', 'Copper-plated ✓') : L('還沒有鍍上銅', 'Not plated yet'), tx, sy + 40, RX + RW - tx,
      coated ? K.cuText : K.red, 22, 'left', ta, 28);
  }

  // ───────── 標題、重點、圖例 ─────────
  const CAP = {
    off: ['設定好三件事，再按「通電」', 'Set up three things, then press "Switch on"'],
    paused: ['已斷電：電鍍停在這裡', 'Switched off: plating stops here'],
    water: ['通電了，但電流表指針不動', 'Switched on, but the ammeter needle stays still'],
    spoonPos: ['湯匙在正極端：銅鍍到另一支電極上', 'Spoon on (+): the copper goes onto the other electrode'],
    carbon: ['鍍得上銅，但藍色越來越淡', 'Copper plates, but the blue keeps fading'],
    ok: ['電鍍中：湯匙漸漸變成銅色', 'Plating: the spoon slowly turns copper'],
    okFull: ['鍍好了！湯匙變成銅色', 'Done! The spoon is copper-colored'],
    rinsing: ['取出湯匙，用清水沖洗', 'Take out the spoon and rinse it with water'],
    rinsed: ['沖洗完成', 'Rinsed'],
    rinsedNo: ['還沒有鍍上銅喔', 'Not plated yet']
  };
  const BOT = {
    rule: ['三大原則：被鍍物接負極端、欲鍍金屬接正極端、電解液含欲鍍金屬的離子', 'Rules: object on the (−) side, plating metal on the (+) side, a solution with that metal\'s ions'],
    water: ['純水幾乎沒有離子，電流過不去', 'Pure water has almost no ions, so no current can flow'],
    spoonPos: ['要被鍍的東西必須接負極端', 'The object to be plated must be on the (−) side'],
    carbon: ['碳棒不供應銅離子：銅離子越用越少', 'Carbon supplies no Cu²⁺: the copper ions get used up'],
    ok: ['鍍上去的銅，來自正極端的銅片；藍色不變', 'The copper on the spoon comes from the (+) copper plate; the blue stays'],
    rinse: ['電鍍完畢後，用清水沖洗，減少殘留的電解質溶液', 'After plating, rinse with water to remove leftover electrolyte']
  };
  function capKey(oc, d) {
    if (oc === 'ok' && d.coat >= 1) return 'okFull';
    if (oc === 'rinsed' && d.coat < 0.15) return 'rinsedNo';
    return oc;
  }
  function botKey(oc) { return { off: 'rule', paused: 'rule', rinsing: 'rinse', rinsed: 'rinse' }[oc] || oc; }
  const CX = 480;
  function drawCaption(ctx, s) { text(ctx, wrap(ctx, s, 780, 26)[0], CX, 58, K.yellow, 26); }
  function bottomLines(ctx, s) {
    const ls = wrap(ctx, s, 840, 24);
    if (ls.length === 1) text(ctx, ls[0], CX, 521, K.yellow, 24, 'center');
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, CX, k ? 536 : 506, K.yellow, 24, 'center'));
  }
  function drawLegend(ctx) {
    const items = [[L('藍球＝電子', 'Blue = electron'), 'b'], [L('橘＝銅離子', 'Orange = Cu²⁺'), 'p'],
      [L('紫＝硫酸根', 'Purple = SO₄²⁻'), 'n'], [L('粉紅圈＝O₂', 'Pink ring = O₂'), 'o']];
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((850 - sum) / Math.max(1, items.length - 1), 14, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = 470 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'o') bubble(ctx, x + 10, y, 8, 1);
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
      text(ctx, s, x + gapIcon, y, K.white, z, 'left');
      x += wid[k] + gapItem;
    });
  }

  // ───────── 繪製 ─────────
  let cv = null, ctx = null, ctrl = null, res = null;
  function render() {
    if (!cv || !ctx || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    HWP = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻') };
    const d = derived(), oc = outcome();
    apparatus(ctx, d);
    const y = checklist(ctx);
    if (S.rinse) rinsePanel(ctx, y + 14, d); else gauges(ctx, y + 6, d);
    const ck = CAP[capKey(oc, d)], bk = BOT[botKey(oc)];
    drawCaption(ctx, L(ck[0], ck[1]));
    bottomLines(ctx, L(bk[0], bk[1]));
    drawLegend(ctx);
  }

  // ───────── 結果框 ─────────
  function resultHTML() {
    const oc = outcome(), d = derived(), n = nOK();
    const small = s => `<br><small style="font-size:.85em;opacity:.85">${s}</small>`;
    switch (oc) {
      case 'off':
      case 'paused':
        if (S.notice === 'autooff') return L(`更換配置前已自動斷電，鍍層重置（三大原則 ${n}/3）。按「通電」重新開始。`,
          `The power was switched off automatically before the change, and the coating was reset (rules met: ${n}/3). Press "Switch on" to start again.`);
        if (S.notice === 'changed') return L(`裝置改好了（三大原則 ${n}/3）。按「通電」看看鍍不鍍得上銅。`,
          `Setup changed (rules met: ${n}/3). Press "Switch on" to see whether copper plates.`);
        return L('未通電，電鍍不會進行。', 'No current: electroplating will not happen.') +
          (oc === 'paused' ? L('（目前的變化會保留，再按「通電」可以接著做。）', ' (What has happened so far is kept; press "Switch on" to continue.)') : '');
      case 'water':
        return L('純水幾乎沒有離子，不能通電，要先倒入含銅離子的電解液。', 'Pure water has almost no ions, so no current can flow. Pour in an electrolyte with copper ions first.');
      case 'spoonPos':
        return L(`湯匙接在正極端，鍍不上銅；要被鍍的東西必須接負極端。（銅鍍到了負極端的${S.other === 'cu' ? '銅片' : '碳棒'}上。）`,
          `The spoon is on the (+) side, so no copper plates on it; the object to be plated must be on the (−) side. (The copper went onto the ${S.other === 'cu' ? 'copper plate' : 'carbon rod'} on the (−) side.)`) +
          small(L('實際上鐵會被溶解，不要這樣接。', 'In reality the iron would dissolve, so do not connect it this way.'));
      case 'carbon':
        return L('鍍得上，但銅離子越用越少，藍色變淡（回想碳棒那一頁）；要持續電鍍，欲鍍金屬（銅片）要接正極端。',
          'It plates, but the copper ions get used up and the blue fades (remember the carbon-rod page); to keep plating, the plating metal (copper plate) must be on the (+) side.');
      case 'ok':
        return L('鍍上去的銅，來自正極端的銅片；藍色不變。', 'The copper on the spoon comes from the (+) copper plate; the blue stays the same.') +
          (d.coat >= 1 ? L('鍍好了！可以按「取出、清水沖洗」。', ' Done! Press "Take out & rinse".') : '');
      default:
        if (d.coat < 0.15) return L('還沒有鍍上銅喔！湯匙還是銀灰色；先把三大原則都做到，再通電試試。',
          'Not plated with copper yet! The spoon is still silver-gray; meet all three rules, then switch on and try again.');
        return L('電鍍完畢後，通常會以清水沖洗，減少殘留的酸性或電解質溶液。',
          'After electroplating, it is usually rinsed with clean water to reduce leftover acidic or electrolyte solution.');
    }
  }
  let lastRes = '';
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
    if (cv) {
      const ck = CAP[capKey(outcome(), derived())];
      const al = L('電鍍實驗台：', 'Electroplating bench: ') + L(ck[0], ck[1]);
      if (cv.getAttribute('aria-label') !== al) cv.setAttribute('aria-label', al);
    }
  }

  // ───────── 按鈕 ─────────
  function spec() {
    return [
      [L('① 湯匙接', '① Spoon to'), [['spoon:neg', L('負極端', '(−) side')], ['spoon:pos', L('正極端', '(+) side')]]],
      [L('② 另一支電極', '② Other electrode'), [['other:cu', L('銅片', 'Copper plate')], ['other:c', L('碳棒', 'Carbon rod')]]],
      [L('③ 電解液', '③ Solution'), [['liquid:cuso4', L('硫酸銅溶液', 'CuSO₄ solution')], ['liquid:water', L('純水', 'Pure water')]]],
      [L('④ 動作', '④ Action'), [['act:on', L('通電', 'Switch on')], ['act:off', L('斷電', 'Switch off')],
        ['act:rinse', L('取出、清水沖洗', 'Take out & rinse')], ['act:reset', L('重來', 'Start over')]]]
    ];
  }
  function buildControls() {
    if (!ctrl) return;
    const fk = document.activeElement && ctrl.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    spec().forEach(([name, btns]) => {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      btns.forEach(([key, label]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = label;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      });
      ctrl.appendChild(row);
    });
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b) b.focus(); }
  }
  function pressed(key) {
    const [g, v] = key.split(':');
    if (g === 'spoon') return S.spoon === v;
    if (g === 'other') return S.other === v;
    if (g === 'liquid') return S.liquid === v;
    if (v === 'on') return S.power;
    if (v === 'off') return !S.power;
    if (v === 'rinse') return !!S.rinse;
    return false;
  }
  function refreshUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const on = pressed(b.dataset.act);
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    writeResult();
  }
  function resetRun() { S.tc = 0; S.rinse = null; }
  function act(key) {
    const [g, v] = key.split(':');
    if (g === 'spoon' || g === 'other' || g === 'liquid') {
      if (S[g] === v) { refreshUI(); return; }
      const wasOn = S.power;
      S[g] = v; S.power = false; resetRun();
      S.notice = wasOn ? 'autooff' : 'changed';
      S.flash = g === 'liquid' ? null : { t: 0, slots: g === 'spoon' ? 'LR' : (S.spoon === 'neg' ? 'R' : 'L') };
    } else if (v === 'on') {
      if (S.rinse) S.rinse = null;                 // 沖洗過的湯匙放回去接著鍍
      S.power = true; S.notice = null;
    } else if (v === 'off') {
      S.power = false; S.notice = null;
    } else if (v === 'rinse') {
      if (!S.rinse) { S.power = false; S.notice = null; S.rinse = { t: 0 }; }
    } else if (v === 'reset') {
      const keep = { wall: S.wall }; initState(); S.wall = keep.wall;
    }
    refreshUI(); render();
  }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  const R0 = { on: false, raf: 0, timer: 0, last: 0 };
  S.swK = 0;
  function step(dt) {
    S.wall += dt;
    if (conducting()) S.tc += dt;
    const ap = (v, target, rate) => v + (target - v) * Math.min(1, dt * rate);
    S.flowA = ap(S.flowA, conducting() ? 1 : 0, 6);
    S.needle = ap(S.needle, conducting() ? 1 : 0, 5);
    S.xA = ap(S.xA, S.power && S.liquid === 'water' && !S.rinse ? 1 : 0, 6);
    S.swK = ap(S.swK, S.power ? 1 : 0, 9);
    if (S.flowA < 0.002) S.flowA = 0; if (S.needle < 0.002) S.needle = 0; if (S.xA < 0.002) S.xA = 0;
    if (S.rinse && S.rinse.t < RINSE_T) S.rinse.t = Math.min(RINSE_T, S.rinse.t + dt);
    if (S.flash) { S.flash.t += dt; if (S.flash.t > 1) S.flash = null; }
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
    cv = document.getElementById('platingLabCanvas');
    if (!cv || !cv.getContext) { cv = null; return; }
    ctx = cv.getContext('2d');
    ctrl = document.getElementById('platingLabControls');
    res = document.getElementById('platingLabResult');
    R0.on = true; lastRes = '';
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
    lastRes = '';
  }
  function relang() {
    if (!R0.on || !cv) return;
    lastRes = ''; buildControls(); refreshUI(); render();
  }
  function _state() {
    const d = derived();
    return {
      spoon: S.spoon, other: S.other, liquid: S.liquid, power: S.power,
      coat: +d.coat.toFixed(4), plateMass: +d.plateMass.toFixed(4), blue: +d.blue.toFixed(4),
      rinsed: !!(S.rinse && S.rinse.t >= RINSE_T), principles: principles(),
      otherCoat: +d.otherCoat.toFixed(4), rinsing: !!(S.rinse && S.rinse.t < RINSE_T), tc: +S.tc.toFixed(3),
      outcome: outcome(), needle: +S.needle.toFixed(3), flowA: +S.flowA.toFixed(3), running: !!R0.raf, on: R0.on
    };
  }

  window.ElLab.plating = { activate, deactivate, relang, _state };
})();
