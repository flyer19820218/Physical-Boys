/* electrolysis_5_plating_1107_v1.js — 「湯匙怎麼變銅色？」分頁動畫（#platingAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.ElAnim.plating = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'plating'。畫布不綁事件；唯一控制是 #steps-plating 的 5 個步驟鈕；結果框 #platingAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（工具函式與裝置畫法沿用 electrolysis_5_cucu_1107_v1.js：
 * 燒杯、電池、開關、離子膠囊、圖例、版面都相同；只把負極端那片銅換成鐵湯匙）。
 * 畫面是「場景時間 t 的純函式」：離子、電子、銅片厚度、湯匙鍍層的範圍與厚度、取出湯匙、沖洗的水流與水滴，
 * 全部只由全域時間 T 算出（固定雜湊種子，不用 Math.random，沒有任何累積狀態）；離子的增減一律淡入淡出。
 *
 * ── 版面（與 cucu 相同的配置：電池在上方，負極端在左、正極端在右） ─────────────
 *   y≈58 本步標題（黃）。燒杯 x 75–590，杯口 y=240、液面 y=272、杯底 y=474。
 *   負極端（左，x=155）：鐵湯匙，匙柄頂 y=165、匙頭橢圓中心 y=390（rx 28、ry 54），匙頭與匙柄下段浸在溶液裡。
 *   正極端（右，x=510）：銅片（原寬 34，y 165–440）。
 *   外導線 y=118：負極端 → 電池（短粗＝負極 x=324、長細＝正極 x=340）→ 開關（x 400–440，第 1、5 步打開，導線真的留缺口）→ 正極端。
 *   溶液裡 4 列（y 300/346/392/438）：每列左邊 Cu²⁺（橘）往負極端、右邊 SO₄²⁻（紫）往正極端。
 *   燒杯上方 y=256 是狀態標示列；右欄 x 650–980：本步重點；y≈506/536：本步一句（黃）；y≈574：圖例。
 * ── 科學表示（依頁面原文，不加新主張） ─────────────────────────────
 *   三大原則：①被鍍物（鐵湯匙）接負極端 ②欲鍍金屬（銅片）接正極端 ③電解液含欲鍍金屬離子（硫酸銅，Cu²⁺）。
 *   藍球＝電子，只在導線與金屬裡：電池負極 → 導線 → 鐵湯匙；銅片 → 導線 → 電池正極。從不進溶液。
 *   正極端（第 3 步）：銅片表面的 Cu 失去電子（2 顆藍球往上走回導線）→ Cu²⁺ 進入溶液，銅片變薄（虛線＝原厚度）。
 *   負極端（第 4 步）：Cu²⁺ 靠近湯匙表面、得到電子 → 變成紅色 Cu 附著；湯匙浸在溶液裡的部分由匙頭往上漸漸鍍上銅色
 *   （液面以上的匙柄沒有泡到溶液，維持銀灰）。示意數量：Cu²⁺ 4 → 6（第 3 步正極端補進 2 個）→ 4（第 4 步負極端用掉 2 個）。
 *   第 3、4 步各只演一極，右欄註明「兩極同時進行，這裡分開看」。
 *   第 5 步：開關打開（斷電），導線裡的電子球停在原地不再流動；湯匙取出（燒杯裡留虛線輪廓），
 *   右欄示意在水龍頭下用清水沖洗（水流、水滴都是 T 的週期函式），下方並排「鍍前：銀灰／鍍後：銅色」小湯匙。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 裝置      8 s  藍色溶液、離子自由游走、鐵湯匙（負極端）＋銅片（正極端）、開關打開；三大原則 ①②③ 標籤
 *   2 通電      8 s  開關閉合（T=8.5）、電子從電池負極出發（T=8.9）、Cu²⁺ 往負極端、SO₄²⁻ 往正極端（T=9.4 起）
 *   3 正極端    9 s  銅片表面 Cu → 失去電子 → Cu²⁺ 進入溶液（銅片變薄，提供金屬）
 *   4 負極端    9 s  Cu²⁺ 靠近湯匙 → 得到電子 → 紅色 Cu 附著；湯匙由匙頭開始變銅色
 *   5 完成沖洗  9 s  斷電（T=34.4，電子停）→ 取出湯匙（T≈35.6–36.3）→ 清水沖洗 → 鍍前／鍍後對照
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
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20', cuText: '#e0915a',
    nuHi: '#f39468', nu: '#d2653a', nuLo: '#93401d',          // 新析出的紅色銅（同色系、偏紅）
    feHi: '#e3e8eb', fe: '#a9b2b9', feLo: '#6b767e', feText: '#cfd7dc',   // 鐵湯匙：銀灰
    wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)',
    water: 'rgba(206,234,246,0.78)'                            // 清水（淡白，不是電子藍）
  };
  const BLUE = a => `rgba(40,110,200,${(0.55 * a).toFixed(4)})`;     // 硫酸銅溶液：皇家藍半透明（同 cuc／cucu）
  const PALE = a => `rgba(205,228,232,${(0.10 + 0.14 * (1 - a)).toFixed(4)})`;
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
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

  // ───────── 幾何（與 cucu 相同；負極端換成湯匙） ─────────
  const BX0 = 75, BX1 = 590, BRIM = 240, BBOT = 474, LIQ = 272;
  const NX = 155, PX = 510, EW = 34, ETOP = 165, EBOT = 440, HW0 = EW / 2;
  const PS = PX - HW0;
  // 湯匙（局部座標：原點＝匙柄頂端中央，往下為 +y）：匙柄 y 0–192（半寬 10 → 8），匙頭橢圓中心 y=225、rx 28、ry 54
  const SP_BY = 225, SP_RX = 28, SP_RY = 54, SP_HL = 192;
  const spoonR = ly => {                                             // 局部 y 處湯匙右緣到中線的距離
    let r = ly >= 0 && ly <= SP_HL ? 10 - 2 * ly / SP_HL : 0;
    const dy = (ly - SP_BY) / SP_RY;
    if (Math.abs(dy) < 1) r = Math.max(r, SP_RX * Math.sqrt(1 - dy * dy));
    return r;
  };
  const WY = 118, BN = 324, BP = 340, BATX = 332;                       // 導線、電池（短粗＝負極、長細＝正極）
  const SW0 = 400, SW1 = 440;                                           // 開關：支點、接點（右側導線上）
  const E_L = mkPath([{ x: BN, y: WY }, { x: NX, y: WY }, { x: NX, y: 362 }]);   // 電池負極 → 鐵湯匙（走到匙頭）
  const E_R = mkPath([{ x: PX, y: 300 }, { x: PX, y: WY }, { x: BP, y: WY }]);   // 正極端 → 電池正極
  const S_SPOON = (BN - NX) + (ETOP - WY);                              // E_L 上進入湯匙的位置
  const WIRES = [[{ x: NX, y: ETOP - 4 }, { x: NX, y: WY }, { x: BN, y: WY }],
    [{ x: BP, y: WY }, { x: SW0, y: WY }],
    [{ x: SW1, y: WY }, { x: PX, y: WY }, { x: PX, y: ETOP - 4 }]];
  const RX = 650, RW = 330;                                             // 右欄
  // 離子：4 列，每列左 Cu²⁺、右 SO₄²⁻（漂移方向相反，永遠不會互撞）
  const ROWS = [300, 346, 392, 438];
  const CU_H = [262, 290, 256, 280], SO_H = [350, 368, 334, 356];
  const CU_STOP = 232, SO_STOP = 374, SLOT_R = 456;                     // SLOT_R：正極端新生 Cu²⁺ 停的位置
  // 全域時間（秒）
  const T_SW = 8.5, T_FLOW = 8.9, T_ON = 9.4, V_ION = 10, T_OFF = 34.4;
  // 正極端事件（第 3 步）：哪一列、表面的 Cu 失去電子變成 Cu²⁺ 的時間 te
  const AEV = [{ r: 1, te: 18.6 }, { r: 3, te: 21.6 }];
  // 負極端事件（第 4 步）：哪一列的 Cu²⁺、開始靠近 ta、得到電子變成銅 tc；e＝兩顆反應電子在匙頭裡的終點
  const CEV = [{ r: 3, ta: 26.6, tc: 28.2, e: [[NX + 3, 422], [NX + 3, 435]] },
    { r: 2, ta: 29.6, tc: 31.2, e: [[NX + 11, 383], [NX + 11, 401]] }];
  // 湯匙鍍層：由匙頭（y 446）往上長到液面（y 274），厚度 1.2 → 3.2（都只由 T 算出）
  const FRONT0 = 446, FRONT1 = LIQ + 2, T_CT0 = 29.0, T_CT1 = 33.6;
  const coatK = T => ease((T - T_CT0) / (T_CT1 - T_CT0));
  const coatOn = T => T > T_CT0;
  const frontY = T => lerp(FRONT0, FRONT1, coatK(T));
  const coatTh = T => 1.2 + 2 * coatK(T);
  const nSurf = (y, T) => NX + spoonR(y - ETOP) + (coatOn(T) && y >= frontY(T) ? coatTh(T) : 0);
  // 正極端銅片浸在溶液那段的半寬（第 3 步變薄）
  const hwA = T => T < 18.8 ? HW0 : HW0 - 3.5 * ease((T - 18.8) / 5.0);
  const pSurf = T => PX - hwA(T);
  // 第 5 步：取出湯匙（抬起一點並淡出；燒杯裡留虛線輪廓）
  const spoonA = T => 1 - ease((T - 35.8) / 0.7);
  const spoonLift = T => 24 * ease((T - 35.6) / 0.9);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['裝置', 'Setup'],
      cap: ['電鍍裝置：在鐵湯匙上鍍銅', 'Electroplating: putting copper on an iron spoon'],
      bot: ['被鍍物接負極端、欲鍍金屬接正極端、溶液含欲鍍金屬的離子', 'Object on the (−) side, plating metal on the (+) side, solution with that metal\'s ions'],
      res: ['電鍍三大原則：鐵湯匙（被鍍物）接負極端、銅片（欲鍍金屬）接正極端、溶液含 Cu²⁺（硫酸銅）。',
        'Three rules of electroplating: the iron spoon (object to plate) on the (−) side, the copper plate (plating metal) on the (+) side, and a solution containing Cu²⁺ (CuSO₄).'] },
    { dur: 8, b: ['通電', 'Current on'],
      cap: ['通電：電子走導線，離子在溶液裡移動', 'Current on: electrons in the wire, ions in the solution'],
      bot: ['電子走導線到鐵湯匙；Cu²⁺ 往湯匙、SO₄²⁻ 往銅片移動', 'Electrons go along the wire to the spoon; ions move in the solution'],
      res: ['電子由電池負極經導線流到鐵湯匙，再由銅片經導線回到電池正極；溶液裡 Cu²⁺ 往負極端、SO₄²⁻ 往正極端移動。',
        'Electrons flow from the battery\'s (−) end through the wire to the iron spoon, and from the copper plate back to the (+) end; in the solution Cu²⁺ moves toward the (−) side and SO₄²⁻ toward the (+) side.'] },
    { dur: 9, b: ['正極端', '(+) side'],
      cap: ['正極端（銅片）：銅失去電子，變成 Cu²⁺ 進入溶液', '(+) side (copper): copper loses electrons and dissolves'],
      bot: ['正極端的銅片溶解成 Cu²⁺，提供要鍍上去的銅', 'The (+) copper plate dissolves into Cu²⁺, supplying the copper to be plated'],
      res: ['正極端（銅片）：銅失去電子，溶解成 Cu²⁺ 進入溶液，銅片逐漸變薄——提供要鍍的金屬。',
        '(+) side (copper plate): copper loses electrons and dissolves into the solution as Cu²⁺, so the plate gets thinner — it supplies the plating metal.'] },
    { dur: 9, b: ['負極端', '(−) side'],
      cap: ['負極端（鐵湯匙）：Cu²⁺ 得到電子，鍍上紅色 Cu', '(−) side (spoon): Cu²⁺ gains electrons and copper coats it'],
      bot: ['Cu²⁺ 在湯匙表面得到電子，鍍上一層銅', 'Cu²⁺ gains electrons at the spoon\'s surface and a layer of copper forms'],
      res: ['負極端（鐵湯匙）：Cu²⁺ 在湯匙表面得到電子，變成紅色的 Cu 附著上去，湯匙鍍上一層銅。',
        '(−) side (iron spoon): Cu²⁺ gains electrons at the spoon\'s surface and sticks on as red copper (Cu), so the spoon gets a copper coat.'] },
    { dur: 9, b: ['完成沖洗', 'Rinse'],
      cap: ['完成：斷電、取出湯匙，用清水沖洗', 'Done: switch off, take out the spoon, rinse it'],
      bot: ['電鍍完畢後通常以清水沖洗，減少殘留的酸性或電解質溶液', 'After plating, it is usually rinsed with clean water to reduce leftover acidic or electrolyte solution'],
      res: ['斷電後取出湯匙。電鍍完畢後，通常會以清水沖洗，減少殘留的酸性或電解質溶液。',
        'Switch off and take out the spoon. After electroplating, it is usually rinsed with clean water to reduce leftover acidic or electrolyte solution.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

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
  function liquid(ctx) {
    ctx.save(); innerClip(ctx, LIQ); ctx.fillStyle = PALE(1); ctx.fill();
    ctx.fillStyle = BLUE(1); ctx.fill();
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

  // ───────── 圖形：銅片（正極端） ─────────
  const LOWY = LIQ + 6;
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
  function ghostOutline(ctx, al) {                  // 正極端原本的厚度（虛線）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = 'rgba(242,236,217,0.75)'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
    rrect(ctx, PX - HW0, LOWY, EW, EBOT - LOWY, 6); ctx.stroke(); ctx.restore();
  }
  function clip(ctx, x) { ctx.save(); ctx.fillStyle = '#5a3a22'; rrect(ctx, x - 7, ETOP - 6, 14, 8, 2); ctx.fill(); ctx.restore(); }

  // ───────── 圖形：湯匙（簡單的匙頭橢圓＋匙柄，沒有任何花紋或標誌） ─────────
  function spoonPath(ctx) {                         // 局部座標；匙柄與匙頭同向，nonzero 填色＝聯集
    ctx.beginPath();
    ctx.moveTo(-8, SP_HL); ctx.lineTo(-10, 10); ctx.quadraticCurveTo(-10, 0, 0, 0); ctx.quadraticCurveTo(10, 0, 10, 10);
    ctx.lineTo(8, SP_HL); ctx.closePath();
    ctx.moveTo(SP_RX, SP_BY); ctx.ellipse(0, SP_BY, SP_RX, SP_RY, 0, 0, TAU);
  }
  // o：{ x, y, s, rot, alpha, front（局部 y，以下鍍銅；Infinity＝沒鍍）, th, tint, ghost }
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
      ctx.stroke(); ctx.restore();                   // 虛線只描外輪廓：匙柄在匙頭裡的那段不畫
      ctx.beginPath(); ctx.ellipse(0, SP_BY, SP_RX, SP_RY, 0, 0, TAU); ctx.stroke(); ctx.restore(); return;
    }
    spoonPath(ctx); ctx.strokeStyle = 'rgba(30,38,42,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = feFill(ctx, -SP_RX, SP_RX); ctx.fill();
    // 匙頭上一道柔和反光（固定）
    ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-9, SP_BY - 14, 5, 22, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (o.tint) { spoonPath(ctx); ctx.fillStyle = 'rgba(40,110,200,0.22)'; ctx.fill(); }
    if (o.front !== undefined && o.front < 400) coatLayer(ctx, o.front, o.th || 2.5);
    ctx.restore();
  }
  function coatLayer(ctx, front, th) {              // 鍍層：front 以下整片銅色，front 上方 12px 淡淡的過渡
    [[front, 400, 1], [front - 12, front, 0.4]].forEach(([y0, y1, a]) => {
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); ctx.rect(-60, y0, 120, y1 - y0); ctx.clip();
      spoonPath(ctx); ctx.strokeStyle = K.cuLo; ctx.lineWidth = th * 2; ctx.stroke();
      ctx.fillStyle = cuFill(ctx, -SP_RX - th, SP_RX + th); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,140,0.85)'; ctx.lineWidth = 1.4; spoonPath(ctx); ctx.stroke();
      if (a === 1) {                                 // 表面顆粒感（固定位置）
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
  let HW = { 'Cu²⁺': 34, 'SO₄²⁻': 42 };
  function pillHalf(ctx, s) { return textW(ctx, s, 22, true) / 2 + 8; }
  function ionPill(ctx, x, y, s, kind, al) {        // kind 0＝陽離子（橘）、1＝陰離子（紫）
    if (al <= 0.01) return;
    const hw = HW[s] || pillHalf(ctx, s), c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 7;
    rrect(ctx, x - hw, y - 16, hw * 2, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, s, x, y + 1, K.ink, 22, 'center', al, true);
  }
  function cuAtom(ctx, x, y, r, al, lbl) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r);
    g.addColorStop(0, K.cuHi); g.addColorStop(0.55, K.cu); g.addColorStop(1, K.cuLo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    if (lbl > 0.01) text(ctx, 'Cu', x, y + 1, K.ink, 22, 'center', al * lbl, true);
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
  function wireLine(ctx, pts, al) {
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function battery(ctx) {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = K.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BP, WY - 24); ctx.lineTo(BP, WY + 24); ctx.stroke();   // 長細＝正極
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(BN, WY - 12); ctx.lineTo(BN, WY + 12); ctx.stroke();   // 短粗＝負極
    ctx.restore();
    text(ctx, '−', BN - 18, WY - 20, K.electron, 28, 'center');
    text(ctx, '+', BP + 18, WY - 20, K.pos, 28, 'center');
  }
  function switchSym(ctx, k) {                      // k：0＝打開、1＝閉合；導線在 SW0～SW1 之間真的留缺口
    const a = lerp(32, 0, k) * RAD, L = SW1 - SW0;
    ctx.save(); ctx.lineCap = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(SW0, WY);
      ctx.lineTo(SW0 + L * Math.cos(a), WY - L * Math.sin(a)); ctx.stroke();
    });
    ctx.fillStyle = K.white; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 2;
    [SW0, SW1].forEach(x => { ctx.beginPath(); ctx.arc(x, WY, 5, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function mark(ctx, kind, x, y, alpha) {           // 'ok' 綠勾、'dot' 黃點
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'dot') { ctx.fillStyle = K.yellow; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.restore(); return; }
    ctx.strokeStyle = K.green; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); ctx.stroke();
    ctx.restore();
  }
  function badge(ctx, n, x, y, al) {                // 三大原則的編號標籤（黃底圓＋深色數字）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.yellow; ctx.shadowColor = K.yellow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill(); ctx.restore();
    text(ctx, String(n), x, y + 1, K.ink, 22, 'center', al);
  }

  // ───────── 依全域時間 T 算出的狀態（純函式） ─────────
  function rowJitter(r, T) {                        // 同一列的離子共用 x 擺動，彼此不會碰到
    const amp = lerp(7, 1.5, ease((T - T_ON) / 1.5));
    return amp * Math.sin(T * 1.1 + r * 1.9);
  }
  function ions(T) {
    const out = [];
    const d = Math.max(0, Math.min(T, T_OFF) - T_ON) * V_ION;
    ROWS.forEach((y, r) => {
      const jx = rowJitter(r, T), jy = k => 3 * Math.sin(T * 1.7 + r * 2.3 + k * 2.9);
      // 原本的 Cu²⁺（往負極端）
      let x = CU_H[r] - Math.min(CU_H[r] - CU_STOP, d) + jx, a = 1, damp = 1;
      const ev = CEV.find(e => e.r === r);
      if (ev && T > ev.ta) {
        const u = ease((T - ev.ta) / 1.0);
        x = lerp(x, nSurf(y, T) + HW['Cu²⁺'] + 6, u);
        a = 1 - ease((T - ev.tc) / 0.35);
        damp = 1 - u;
      }
      out.push({ x, y: y + jy(0) * damp, s: 'Cu²⁺', kind: 0, a });
      // SO₄²⁻（一直都在）
      out.push({ x: SO_H[r] + Math.min(SO_STOP - SO_H[r], d) + jx, y: y + jy(1), s: 'SO₄²⁻', kind: 1, a: 1 });
    });
    AEV.forEach(e => {                               // 正極端新生的 Cu²⁺：從銅片表面淡入、往外移一點
      const u = (T - e.te - 0.1) / 0.4;
      if (u <= 0) return;
      const jx = rowJitter(e.r, T);
      out.push({ x: lerp(SLOT_R + 16, SLOT_R, ease((T - e.te - 0.1) / 0.8)) + jx, y: ROWS[e.r] + 3 * Math.sin(T * 1.7 + e.r * 2.3 + 5.8) * ease((T - e.te) / 1.2), s: 'Cu²⁺', kind: 0, a: ease(u) });
    });
    return out;
  }

  // 連續電子流：斷電（T_OFF）後位置凍結＝電子停住；E_L 進入湯匙的那段跟著湯匙一起被取出（淡出）
  function flowE(ctx, T) {
    if (T < T_FLOW) return;
    const Tf = Math.min(T, T_OFF);
    const V = 110, sp = 52, d = V * Tf, front = 150 * (Tf - T_FLOW), al = clamp((Tf - T_FLOW) / 0.3, 0, 1);
    const sa = spoonA(T), lift = spoonLift(T);
    const swK = T < T_OFF ? 1 : 1 - ease((T - T_OFF) / 0.4);         // 開關打開時，停在缺口附近的電子球淡出（缺口裡沒有導線）
    [E_L, E_R].forEach(P => {
      const L = P.L;
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (d % sp);
        if (s < 0 || s > L || s > front) continue;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 26, 0, 1) * clamp((front - s) / 20, 0, 1);
        const inSpoon = P === E_L && s > S_SPOON + 6;
        const inGap = P === E_R && p.y === WY && p.x > SW0 - 12 && p.x < SW1 + 12;
        ball(ctx, p.x, p.y - (inSpoon ? lift : 0), 8, fade * al * (inSpoon ? sa : 1) * (inGap ? swK : 1));
      }
    });
  }
  // 反應用的電子（只在金屬裡）：正極端 2 顆從表面往上走回導線；負極端 2 顆在湯匙裡往下走到 Cu²⁺ 那一列的表面
  function reactE(ctx, T) {
    AEV.forEach(e => {
      const y = ROWS[e.r], u = ease((T - e.te) / 1.0);
      const a = clamp((T - e.te) / 0.15, 0, 1) * (1 - ease((T - e.te - 0.7) / 0.3));
      if (a <= 0.01) return;
      ball(ctx, lerp(PX - 7, PX - 2, u), lerp(y - 9, y - 64, u), 7, a);
      ball(ctx, lerp(PX - 7, PX - 2, u), lerp(y + 9, y - 46, u), 7, a);
    });
    CEV.forEach(e => {
      const u = ease((T - (e.tc - 0.9)) / 0.9);
      const a = clamp((T - (e.tc - 0.9)) / 0.15, 0, 1) * (1 - ease((T - e.tc) / 0.25));
      if (a <= 0.01) return;
      e.e.forEach(([ex, ey], k) => ball(ctx, lerp(NX, ex, u), lerp(ey - 62 + k * 4, ey, u), 7, a));
    });
  }

  // ───────── 裝置畫面 ─────────
  function bigSpoon(ctx, T, tint) {
    const on = coatOn(T);
    return {
      x: NX, y: ETOP - spoonLift(T), s: 1, alpha: spoonA(T), tint,
      front: on ? frontY(T) - ETOP : Infinity, th: coatTh(T)
    };
  }
  function apparatus(ctx, i, tl, T) {
    beakerBack(ctx);
    spoon(ctx, bigSpoon(ctx, T, false));
    plate(ctx, PX, hwA(T));
    liquid(ctx);
    // 浸在溶液裡的那段：重畫在溶液之上，再蓋一層淡藍表示泡在溶液裡（鍍層畫在淡藍之上，看得出是銅色）
    ctx.save(); innerClip(ctx, LIQ + 1); ctx.clip();
    spoon(ctx, bigSpoon(ctx, T, true));
    plate(ctx, PX, hwA(T));
    ctx.fillStyle = 'rgba(40,110,200,0.22)';
    rrect(ctx, PX - hwA(T), LIQ + 2, hwA(T) * 2, EBOT - LIQ - 2, Math.min(6, hwA(T))); ctx.fill();
    ctx.restore();
    ghostOutline(ctx, clamp((HW0 - hwA(T)) / 0.8, 0, 1));
    spoon(ctx, { x: NX, y: ETOP, s: 1, ghost: true, alpha: ease((T - 36.2) / 0.5) });   // 取出後留下的虛線輪廓
    // 正極端表面要失去電子的那顆 Cu（一半嵌在銅片裡），失去電子後淡出
    AEV.forEach(e => {
      const y = ROWS[e.r], al = ease((T - (e.te - 1.4)) / 0.4) * (1 - ease((T - e.te) / 0.3));
      cuAtom(ctx, pSurf(T) + 5, y, 13, al, 1 - ease((T - e.te + 0.1) / 0.2));
    });
    ions(T).forEach(o => ionPill(ctx, o.x, o.y, o.s, o.kind, o.a));
    // 負極端：變成銅原子 → 附著到湯匙表面
    CEV.forEach(e => {
      const y = ROWS[e.r], a = ease((T - e.tc - 0.1) / 0.4), m = ease((T - e.tc - 1.0) / 0.8);
      if (a <= 0.01 || m >= 0.999) return;
      const sx = nSurf(y, T);
      cuAtom(ctx, lerp(sx + 17, sx + 3, m), y, lerp(16, 5.5, m), a, ease((T - e.tc - 0.4) / 0.3) * (1 - ease(m / 0.4)));
    });
    beakerFront(ctx);
    AEV.forEach(e => ring(ctx, pSurf(T) - 2, ROWS[e.r], T - e.te, K.cyan, 12));
    CEV.forEach(e => ring(ctx, nSurf(ROWS[e.r], T) + 4, ROWS[e.r], T - e.tc, K.cyan, 12));
    // 燒杯上方的標示列（y=256）
    const a1 = i === 0 ? ease((tl - 0.6) / 0.5) : 0;
    {
      const s = tr('硫酸銅溶液（含 Cu²⁺）', 'CuSO₄ solution (has Cu²⁺)'), w = textW(ctx, s, 22);
      const gx = (NX + 24 + PS - 10) / 2 - (w + 40) / 2;
      text(ctx, s, gx, 256, K.white, 22, 'left', a1);
      badge(ctx, 3, gx + w + 24, 256, i === 0 ? ease((tl - 3.0) / 0.4) : 0);
    }
    const a2 = i === 1 ? ease((tl - 1.4) / 0.5) : 0;
    text(ctx, '← Cu²⁺', 262, 256, K.pos, 22, 'center', a2, true);
    text(ctx, 'SO₄²⁻ →', 420, 256, K.neg, 22, 'center', a2, true);
    const a3 = i === 2 ? ease((tl - 3.4) / 0.5) : i === 3 ? 1 : 0;
    text(ctx, tr('銅片溶解', 'Cu dissolves'), PS - 6, 256, K.pos, 22, 'right', a3);
    const a4 = i === 3 ? ease((tl - 4.2) / 0.5) : 0;
    text(ctx, tr('鍍上紅色 Cu', 'Cu coats it'), NX + 24, 256, K.cuText, 22, 'left', a4);
    const a5 = i === 4 ? ease((tl - 2.2) / 0.5) : 0;
    text(ctx, tr('湯匙已取出', 'spoon taken out'), NX + 24, 256, K.white, 22, 'left', a5);
    text(ctx, tr('銅片變薄', 'thinner'), PS - 6, 256, K.cuText, 22, 'right', i === 4 ? ease((tl - 1.0) / 0.5) : 0);
    // 電路：導線 → 夾子 → 電子 → 元件
    WIRES.forEach(w => wireLine(ctx, w, 1));
    clip(ctx, NX); clip(ctx, PX);
    flowE(ctx, T);
    reactE(ctx, T);
    const sw = T < T_OFF ? ease((T - T_SW) / 0.4) : 1 - ease((T - T_OFF) / 0.4);
    switchSym(ctx, sw);
    battery(ctx);
    text(ctx, tr('電池', 'Battery'), BATX, WY + 44, K.white, 22, 'center');
    text(ctx, tr('開關', 'Switch'), (SW0 + SW1) / 2, WY + 34, K.white, 22, 'center');
    text(ctx, tr('負極端', '(−) side'), NX - 24, 182, K.electron, 24, 'right');
    const spLbl = tr('鐵湯匙', 'Iron spoon');
    text(ctx, spLbl, NX + 24, 200, K.feText, 22, 'left');
    badge(ctx, 1, NX + 24 + textW(ctx, spLbl, 22) + 24, 200, i === 0 ? ease((tl - 1.6) / 0.4) : 0);
    text(ctx, tr('正極端', '(+) side'), PX + HW0 + 14, 182, K.pos, 24, 'left');
    text(ctx, tr('銅片', 'Copper'), PX + HW0 + 14, 212, K.cuText, 22, 'left');
    badge(ctx, 2, PX - HW0 - 26, 200, i === 0 ? ease((tl - 2.3) / 0.4) : 0);
  }

  // ───────── 右欄 ─────────
  function icon(ctx, kind, x, y, al) {
    if (kind === 'e') ball(ctx, x, y, 8, al);
    else if (kind === 'cu') cuAtom(ctx, x, y, 10, al, 0);
    else if (typeof kind === 'number') badge(ctx, kind, x, y, al);
    else mark(ctx, kind, x, y, al);
  }
  function row(ctx, kind, s, y, color, al, size) {
    icon(ctx, kind, RX + 14, y, al);
    return block(ctx, s, RX + 40, y, RW - 40, color, size || 24, 'left', al);
  }
  function pillRow(ctx, s, kind, label, y, al) {
    const hw = HW[s];
    ionPill(ctx, RX + hw, y, s, kind, al);
    return block(ctx, label, RX + 2 * hw + 14, y, RW - 2 * hw - 14, K.white, 22, 'left', al);
  }
  function simulNote(ctx, y, al) {                  // 第 3、4 步：兩極其實同時進行
    return block(ctx, tr('※ 兩極同時進行，這裡分開看', '※ Both sides react at once; shown separately here'), RX, y, RW, K.cyan, 22, 'left', al);
  }
  // 第 5 步：水龍頭下沖洗（水流、水滴都是 T 的週期函式）
  function rinse(ctx, y0, T, al) {
    if (al <= 0.01) return;
    const bx = RX + 52, sy = y0 + 84, s = 0.55, bowlTop = sy - SP_RX * s, bowlBot = sy + SP_RX * s;
    const flow = ease((T - 36.9) / 0.35);
    ctx.save(); ctx.globalAlpha *= al;
    // 水龍頭（畫的，不靠字型）
    const g = ctx.createLinearGradient(0, y0, 0, y0 + 14);
    g.addColorStop(0, '#c3cbd0'); g.addColorStop(1, '#69747b');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(20,28,30,0.9)'; ctx.lineWidth = 2;
    rrect(ctx, RX + 4, y0, bx - RX + 6, 14, 5); ctx.fill(); ctx.stroke();
    rrect(ctx, bx - 8, y0 + 8, 16, 18, [0, 0, 4, 4]); ctx.fill(); ctx.stroke();
    rrect(ctx, RX + 18, y0 - 10, 10, 12, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 水流：從水龍頭到匙頭，裡面有往下流動的亮紋
    if (flow > 0.01) {
      const yA = y0 + 26, yB = lerp(yA, bowlTop, flow);
      ctx.save(); ctx.globalAlpha *= al;
      ctx.fillStyle = K.water; rrect(ctx, bx - 4, yA, 8, yB - yA, 3); ctx.fill();
      ctx.save(); rrect(ctx, bx - 4, yA, 8, yB - yA, 3); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let k = 0; k < 6; k++) { const yy = yA + ((T * 160 + k * 14) % 84); ctx.fillRect(bx - 1.5, yy, 3, 6); }
      ctx.restore(); ctx.restore();
    }
    spoon(ctx, { x: bx + 225 * s, y: sy, s, rot: Math.PI / 2, alpha: al, front: 107, th: 3.2 });
    if (flow > 0.6) {
      ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = K.water;
      // 濺起的小水花（左右對稱、週期）
      for (let k = 0; k < 4; k++) {
        const p = (T * 1.8 + k / 4) % 1, dir = k % 2 ? 1 : -1;
        ctx.globalAlpha = al * (1 - p);
        ctx.beginPath(); ctx.arc(bx + dir * (6 + 22 * p), bowlTop - 10 * Math.sin(p * Math.PI) - 1, 2.6, 0, TAU); ctx.fill();
      }
      // 從匙頭滴下的水滴
      for (let k = 0; k < 5; k++) {
        const p = (T * 1.3 + k / 5) % 1, x = bx + (hash(k + 7) - 0.5) * 20;
        ctx.globalAlpha = al * (1 - p) * 0.95;
        ctx.beginPath(); ctx.ellipse(x, bowlBot + 4 + 42 * p, 2.6, 4, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
  function notes(ctx, i, tl, T) {
    const a = t0 => ease((tl - t0) / 0.5);
    let y;
    if (i === 0) {
      y = block(ctx, tr('電鍍三大原則', 'Three rules of plating'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 1, tr('鐵湯匙（被鍍物）接負極端', 'Iron spoon (object to plate) on the (−) side'), y + 16, K.white, a(1.6), 22);
      y = row(ctx, 2, tr('銅片（欲鍍金屬）接正極端', 'Copper plate (plating metal) on the (+) side'), y + 12, K.white, a(2.3), 22);
      y = row(ctx, 3, tr('溶液含 Cu²⁺（硫酸銅）', 'Solution contains Cu²⁺ (CuSO₄)'), y + 12, K.white, a(3.0), 22);
      row(ctx, 'dot', tr('開關打開：還沒通電', 'Switch open: no current'), y + 22, K.white, a(4.6));
    } else if (i === 1) {
      y = block(ctx, tr('通電', 'Current on'), RX, 110, RW, K.white, 30, 'left', a(0.3), 38);
      y = row(ctx, 'e', tr('電子走導線', 'Electrons: in the wire'), y + 14, K.electron, a(0.9));
      y = block(ctx, tr('從電池負極出發，流到鐵湯匙', 'from the battery\'s (−) end to the iron spoon'), RX + 40, y, RW - 40, K.muted, 22, 'left', a(1.1));
      y = block(ctx, tr('離子在溶液裡移動', 'Ions: in the solution'), RX, y + 16, RW, K.white, 24, 'left', a(1.6));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('往負極端（湯匙）', 'to the spoon, (−)'), y + 18, a(2.0));
      y = pillRow(ctx, 'SO₄²⁻', 1, tr('往正極端（銅片）', 'to the copper, (+)'), y + 12, a(2.4));
      row(ctx, 'ok', tr('電子不進入溶液', 'Electrons never enter the solution'), y + 18, K.green, a(3.6));
    } else if (i === 2) {
      y = block(ctx, tr('正極端（銅片）', '(+) side (copper)'), RX, 110, RW, K.pos, 30, 'left', a(0.3), 38);
      y = row(ctx, 'cu', tr('銅片表面的銅 Cu', 'Cu on the surface'), y + 14, K.cuText, a(0.9));
      y = row(ctx, 'e', tr('失去電子，電子走導線', 'loses electrons to the wire'), y + 12, K.electron, a(2.0));
      y = pillRow(ctx, 'Cu²⁺', 0, tr('變成 Cu²⁺ 進入溶液', 'enters the solution'), y + 16, a(2.9));
      y = row(ctx, 'ok', tr('提供金屬：銅片變薄', 'Supplies the metal: the plate gets thinner'), y + 16, K.white, a(4.6));
      simulNote(ctx, y + 18, a(5.4));
    } else if (i === 3) {
      y = block(ctx, tr('負極端（鐵湯匙）', '(−) side (iron spoon)'), RX, 110, RW, K.electron, 30, 'left', a(0.3), 38);
      y = pillRow(ctx, 'Cu²⁺', 0, tr('靠近湯匙表面', 'reaches the spoon'), y + 18, a(0.8));
      y = row(ctx, 'e', tr('得到電子', 'gains electrons'), y + 12, K.electron, a(1.8));
      y = row(ctx, 'cu', tr('變成紅色的銅 Cu', 'becomes red copper, Cu'), y + 10, K.cuText, a(2.8));
      y = row(ctx, 'ok', tr('附著上去：湯匙變銅色', 'It sticks on: the spoon turns copper'), y + 16, K.white, a(4.6));
      simulNote(ctx, y + 18, a(5.4));
    } else {
      y = block(ctx, tr('完成與沖洗', 'Done and rinse'), RX, 110, RW, K.white, 30, 'left', a(0.2), 38);
      y = row(ctx, 'dot', tr('斷電：電子停止流動', 'Switch off: electrons stop'), y + 12, K.white, a(0.6));
      const y0 = y + 6, aR = a(2.5);
      rinse(ctx, y0, T, aR);
      block(ctx, tr('取出湯匙，用清水沖洗', 'Take it out and rinse with water'), RX + 84, y0 + 30, RW - 84, K.white, 22, 'left', a(3.0));
      // 鍍前／鍍後：並排的小湯匙（同一支湯匙的縮圖：鍍前全銀灰；鍍後泡過溶液的部分是銅色）
      const aC = a(4.2), s = 0.3, cy1 = y0 + 160, cy2 = cy1 + 40;
      spoon(ctx, { x: RX + 4 + (225 + SP_RY) * s, y: cy1, s, rot: Math.PI / 2, alpha: aC });
      spoon(ctx, { x: RX + 4 + (225 + SP_RY) * s, y: cy2, s, rot: Math.PI / 2, alpha: aC, front: 107, th: 3.2 });
      const lx = RX + 4 + (225 + SP_RY) * s + 16;
      text(ctx, tr('鍍前：銀灰', 'Before: silver'), lx, cy1, K.feText, 22, 'left', aC);
      text(ctx, tr('鍍後：銅色', 'After: copper'), lx, cy2, K.cuText, 22, 'left', aC);
    }
    const botT = [5.4, 5.6, 6.0, 6.0, 5.6][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), K.yellow, a(botT));
  }
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }

  // ───────── 圖例、標題、進度條 ─────────
  function drawLegend(ctx) {
    const items = [[tr('藍球＝電子', 'Blue = electron'), 'b'], [tr('橘＝陽離子', 'Orange = cation'), 'p'], [tr('紫＝陰離子', 'Purple = anion'), 'n'],
      [tr('紅棕＝銅', 'Brown = Cu'), 'c'], [tr('銀灰＝鐵', 'Gray = Fe'), 'f']];
    const z = 22, gapIcon = 30;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const sum = wid.reduce((a, b) => a + b, 0);
    const gapItem = clamp((960 - sum) / Math.max(1, items.length - 1), 14, 40);
    const tot = sum + gapItem * (items.length - 1);
    let x = W / 2 - tot / 2; const y = 574;
    items.forEach(([s, kind], k) => {
      if (kind === 'b') ball(ctx, x + 10, y, 7, 1);
      else if (kind === 'c' || kind === 'f') { ctx.save(); ctx.fillStyle = kind === 'c' ? cuFill(ctx, x, x + 22) : feFill(ctx, x, x + 22); rrect(ctx, x, y - 9, 22, 18, 4); ctx.fill(); ctx.restore(); }
      else { ctx.save(); ctx.fillStyle = kind === 'p' ? K.pos : K.neg; rrect(ctx, x, y - 8, 22, 16, 8); ctx.fill(); ctx.restore(); }
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
    HW = { 'Cu²⁺': pillHalf(ctx, 'Cu²⁺'), 'SO₄²⁻': pillHalf(ctx, 'SO₄²⁻') };
    const T = STARTS[i] + tl;
    apparatus(ctx, i, tl, T);
    notes(ctx, i, tl, T);
    drawLegend(ctx);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('platingAnimCanvas');
  const ctl = () => window.ElAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('platingAnimResult'); if (el) el.innerHTML = html;
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
    const r = document.getElementById('steps-plating');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-plating'); if (!r) return;
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

  window.ElAnim.plating = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-plating'); if (r) r.innerHTML = '';
      const o = document.getElementById('platingAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) { S.ended = false; start(); } },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { plating: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'plating' : null, t: S.t, running: !!(S.raf || S.timer), step: S.step }; }
  };
})();
