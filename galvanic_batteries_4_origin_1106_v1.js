/* galvanic_batteries_4_origin_1106_v1.js — 「兩種金屬發電」分頁動畫（#originAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.origin = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'origin'。畫布不綁事件；唯一控制是 #steps-origin 的 5 個步驟鈕；結果框 #originAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的 C、label、line…）。
 * 畫面是「場景時間 t 的純函式」：電極位置、導線接點、指針角度、離子擺動、電子位置都只由 t 算出。
 * 畫風、金屬用色、字級與版面沿用同課的 galvani／volta 兩支；兩杯＋U 形鹽橋的畫法沿用 cell 那支
 * （鋅杯＝硫酸鋅溶液、近無色；銅杯＝硫酸銅溶液、深藍綠半透明；鹽橋裡的離子只畫 ± 小圓點）。
 *
 * 2026-11-06 科學修正（老師）：兩極必須隔開（分成兩杯），電子才被迫走外導線、才有外電流；
 *   泡在同一杯直接接觸，鋅會直接反應，沒有外電流。所以 5 步全部改成「兩杯隔開＋鹽橋」，
 *   刪掉舊版「單杯、不用鹽橋」的錯誤說法。鹽橋細節留給下一分頁「鋅銅電池與鹽橋」。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。左杯 x 24–274、右杯 x 356–606；杯口 y=240、液面 y=300、杯底 y=470。
 *   左電極 Zn 中心 x=70、右電極（Zn 或 Cu）中心 x=560，寬 36、y 190–445。
 *   鹽橋：倒 U 形玻璃管，兩腳 x=244／386（各在杯內）、頂端外緣 y≈181、管口 y=438；「鹽橋」寫在兩杯之間 y≈330。
 *   外導線：電極頂 → 上導線 y=130 → 電壓表（中心 315,130，電子從表後面通過）。
 *   右導線末端可升降：斷開時懸在電極上方（真的留缺口），接上時碰到電極頂。
 *   標註：y=104「外導線」「電壓表」（導線上方）；y=170「斷開」；y=212 電極名稱（電極旁、杯口上方）；
 *   杯內液面上方 y≈270 溶液名稱。右欄 x 630–980：本步重點。
 *   下方 y≈506/536：本步一句；y≈574（或 560/586 兩列）：圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只畫在液面以上的電極與外導線裡（Zn → 外導線 → 電壓表 → Cu），不進溶液。
 *   橘＝正離子、紫＝負離子，只在兩杯溶液與鹽橋裡小幅擺動，不進導線；不指定是哪一種離子、不畫移動方向。
 *   兩片鋅：只標示結果（指針不動、沒有持續電子流、兩片金屬一樣），不編機制。
 *   不寫反應式（下一分頁才講）、不寫電壓數值、不寫年份數字。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 換成兩杯   8 s  蛙腿縮圖（金屬＋濕潤的組織）→ 兩杯電解質、兩片鋅、鹽橋、電壓表、導線；右導線還沒接上（斷開），指針不動
 *   2 兩片鋅     8 s  兩杯都是鋅片＋硫酸鋅溶液；右導線落下接上（閉合迴路），指針不動、沒有電子流；右欄「Zn＝Zn」
 *   3 鋅＋銅     9 s  右導線抬起、右鋅片升起淡出、右杯換成硫酸銅溶液、銅片降下；接上 → 指針偏轉，電子從 Zn 經外導線流向 Cu
 *   4 分工       9 s  外導線發亮＝電子走這裡；兩杯溶液＋鹽橋發亮＝離子在這裡（離子變成帶 ＋／− 的小圓）；
 *                    「兩極隔開：電子只能走外導線，才有外電流」＋對照句「同一杯、直接接觸：鋅直接反應，沒有外電流」（只用文字＋✗）
 *   5 條件整理   8 s  四個條件依序打勾（不同金屬／電解質／兩極隔開（鹽橋連通）／閉合迴路，對應部位發亮），
 *                    對照兩片鋅為什麼不行；帶出下一分頁「氧化與還原」
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
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    zn: '#b9c6cc', znHi: '#e4ecef', znLo: '#7b8a91',
    skin: '#6f9f55', skinHi: '#93c172', skinLo: '#3c6630', spot: '#3f5f2c', cut: '#e6a5a0',
    fe: '#8d969b', feHi: '#b3bbbf', feLo: '#5a6266',
    red: '#ff6b5a', wire: '#c9d3d6', glass: 'rgba(214,236,242,0.85)'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;

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
  // 由上往下排的段落：第一行中心在 y，回傳下一段可用的 y
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

  // ───────── 幾何 ─────────
  const BRIM = 240, BBOT = 470, LIQ = 300;                        // 杯口、杯底、液面
  const CUPS = [{ x0: 24, x1: 274 }, { x0: 356, x1: 606 }];       // 左杯、右杯（隔開）
  const SOL_ZN = [205, 228, 232, 0.10], SOL_CU = [28, 128, 140, 0.46];   // 硫酸鋅（近無色）、硫酸銅（深藍綠，同 cell）
  const XL = 70, XR = 560, EW = 36, ETOP = 190, EBOT = 445;       // 電極
  const WY = 130, MX = 315, MW = 124, MH = 74;                    // 上導線、電壓表
  const MPIV = { x: MX, y: WY + 22 }, NEEDLE = 40;
  const OPEN_Y = ETOP - 30;                                       // 右導線斷開時末端高度
  const E_PATH = mkPath([{ x: XL, y: 270 }, { x: XL, y: WY }, { x: XR, y: WY }, { x: XR, y: 270 }]);
  const RX = 630, RW = 350;                                       // 右欄
  const FT = { x: 660, y: 96, w: 300, h: 132 };                   // 蛙腿縮圖框
  // 鹽橋：倒 U 形，中心線 左腳 x=244、右腳 x=386、轉角圓心 y=222、半徑 24、管口 y=438
  const BLX = 244, BRX = 386, BCY = 222, BR = 24, BBY = 438, T_OUT = 17, T_IN = 12;
  function lanePts(o) {
    const R = BR + o, pts = [{ x: BLX - o, y: BBY }, { x: BLX - o, y: BCY }];
    for (let j = 1; j <= 8; j++) { const a = Math.PI + j / 8 * Math.PI / 2; pts.push({ x: BLX + BR + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + j / 8 * Math.PI / 2; pts.push({ x: BRX - BR + R * Math.cos(a), y: BCY + R * Math.sin(a) }); }
    pts.push({ x: BRX + o, y: BBY });
    return pts;
  }
  const TUBE = lanePts(0), TUBE_P = mkPath(TUBE);
  const BRIDGE_IONS = [];                                          // 鹽橋裡的離子：沿管子等距排，只原地擺動
  for (let k = 0; k * 40 + 22 < TUBE_P.L - 10; k++) BRIDGE_IONS.push([k * 40 + 22, k % 2]);
  // 杯內離子（避開電極與鹽橋腳）；kind 0＝正離子 1＝負離子；右杯以兩杯中線 x=315 鏡射
  const ION_L = [[118, 334, 0], [160, 334, 1], [202, 334, 0], [118, 376, 1], [202, 376, 1], [118, 418, 0], [160, 418, 1], [202, 418, 0]];
  const ION_R = ION_L.map(([x, y, k]) => [630 - x, y + (k ? 4 : -4), 1 - k]);

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['換成兩杯', 'Two cups'],
      cap: ['換成兩杯電解質：兩片電極、鹽橋、電壓表', 'Two cups of electrolyte: electrodes, salt bridge, meter'],
      res: ['把蛙腿實驗裡的「金屬＋濕潤的組織」換成兩杯電解質：兩片電極各泡在一杯裡，兩杯用鹽橋連通，再接上外導線和電壓表。右邊的導線還沒接上，迴路斷開，電壓表指針不動。',
        'Replace the "metals + moist tissue" of the frog-leg experiment with two cups of electrolyte: each electrode sits in its own cup, the cups are joined by a salt bridge, and outer wires lead to a voltmeter. The right wire is not connected yet — the circuit is open and the needle does not move.'] },
    { dur: 8, b: ['兩片鋅', 'Two Zn'],
      cap: ['先試兩片鋅：接成閉合迴路，指針不動', 'Try two zinc plates: circuit closed, needle still'],
      res: ['兩杯都是鋅片泡在硫酸鋅溶液，接成閉合迴路，電壓表指針還是不動，也沒有持續的電子流。兩片相同金屬沒有足夠差異，無法維持持續電流。',
        'Both cups hold a zinc plate in zinc sulfate solution. In a closed circuit the needle still does not move, and there is no steady electron flow. Two identical metals lack enough difference to keep a current going.'] },
    { dur: 9, b: ['鋅＋銅', 'Zn + Cu'],
      cap: ['換成鋅＋銅：指針偏轉，電子由鋅流向銅', 'Switch to Zn + Cu: the needle swings, e⁻ go Zn → Cu'],
      res: ['把右杯換成銅片泡在硫酸銅溶液，再接成閉合迴路：鋅較活潑，送出電子；銅較不活潑，接收電子。電子由鋅經外導線流向銅，電壓表指針偏轉。',
        'Change the right cup to a copper plate in copper sulfate solution and close the circuit: zinc is more active and gives electrons; copper is less active and receives them. Electrons flow from Zn through the outer wire to Cu, and the needle swings.'] },
    { dur: 9, b: ['電子與離子', 'e⁻ & ions'],
      cap: ['看清楚分工：電子走外導線，離子在溶液和鹽橋', 'Who goes where: e⁻ in the wire, ions in solution and bridge'],
      res: ['電子只在金屬和外導線裡走，不進溶液；離子只在兩杯溶液和鹽橋裡，不進導線。兩極要隔開（分成兩杯）：電子只能走外導線，才有外電流；如果泡在同一杯、直接接觸，鋅會直接反應，沒有外電流。',
        'Electrons travel only in the metals and the outer wire, never into the solution; ions stay in the two solutions and the salt bridge, never in the wire. The electrodes must be kept apart (two cups): then electrons can only take the outer wire, giving an outer current. If both sit in the same cup in direct contact, zinc reacts directly and there is no outer current.'] },
    { dur: 8, b: ['電池條件', 'Conditions'],
      cap: ['電池的條件：不同金屬＋電解質＋兩極隔開＋閉合迴路', 'Battery needs: 2 metals + electrolyte + kept apart + closed loop'],
      res: ['化學電池的條件：兩種不同的金屬、電解質、兩極隔開（用鹽橋連通）、接成閉合迴路。兩片鋅沒有足夠差異，所以不行。下一個分頁「氧化與還原」：電子到底從哪來、到哪去？',
        'A chemical battery needs two different metals, an electrolyte, electrodes kept apart (joined by a salt bridge), and a closed circuit. Two zinc plates lack enough difference, so they fail. Next tab, Oxidation & Reduction: where do the electrons come from, and where do they go?'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  // els：要畫的電極 [{x, kind, dy, a}]；conn：右導線接上程度 0..1；needle：指針 0..1；eFront：電子前緣距離（null＝沒有電子）
  // cuSol：右杯溶液由硫酸鋅換成硫酸銅的程度 0..1
  function swing(u) { return u <= 0 ? 0 : 1 - Math.exp(-u * 5) * Math.cos(u * 9); }
  function state(i, tl, t) {
    const S = { build: 1, els: [], conn: 1, needle: 0, eFront: null, contactAge: -1, open: 0, cuSol: i >= 2 ? 1 : 0 };
    const left = { x: XL, kind: 'zn', dy: 0, a: 1 };
    if (i === 0) {
      S.build = tl;
      const k = ease((tl - 2.8) / 0.8), k2 = ease((tl - 3.1) / 0.8);
      left.dy = -60 * (1 - k); left.a = k;
      S.els = [left, { x: XR, kind: 'zn', dy: -60 * (1 - k2), a: k2 }];
      S.conn = 0; S.open = 1;
    } else if (i === 1) {
      S.els = [left, { x: XR, kind: 'zn', dy: 0, a: 1 }];
      S.conn = ease((tl - 0.8) / 0.8); S.contactAge = tl - 1.6;
      S.open = 1 - S.conn;
    } else if (i === 2) {
      const up = ease((tl - 0.9) / 0.9), dn = ease((tl - 1.9) / 0.9);
      S.els = [left];
      if (up < 1) S.els.push({ x: XR, kind: 'zn', dy: -36 * up, a: 1 - up });
      if (tl > 1.9) S.els.push({ x: XR, kind: 'cu', dy: -36 * (1 - dn), a: dn });
      S.cuSol = (tl - 1.9) / 0.9;                       // 右杯溶液跟著銅片一起換（線性，下面再 clamp）
      S.cuSol = clamp(S.cuSol, 0, 1);
      const open = ease((tl - 0.2) / 0.5), close = ease((tl - 3.0) / 0.6);
      S.conn = tl < 3.0 ? 1 - open : close;
      S.retract = tl < 3.0 ? open : 1 - close;        // 抬得比平常斷開更高，讓電極有空間升起
      S.contactAge = tl - 3.6;
      S.needle = swing(tl - 3.6);
      if (tl > 3.8) S.eFront = 70 * (tl - 3.8);
      S.open = 0;
    } else {
      S.els = [left, { x: XR, kind: 'cu', dy: 0, a: 1 }];
      S.needle = 1; S.eFront = 1e9;
    }
    return S;
  }

  // ───────── 圖形：燒杯、電極、液體、離子、鹽橋 ─────────
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
  function beakerBack(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    CUPS.forEach(c => { innerClip(ctx, c, BRIM); ctx.fillStyle = 'rgba(200,230,240,0.05)'; ctx.fill(); });
    ctx.restore();
  }
  function beakerFront(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    CUPS.forEach(c => {
      beakerPath(ctx, c); ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 6; ctx.stroke();
      beakerPath(ctx, c); ctx.strokeStyle = K.glass; ctx.lineWidth = 3; ctx.stroke();
    });
    ctx.restore();
  }
  function solColor(k) {
    const c = SOL_ZN.map((v, j) => lerp(v, SOL_CU[j], clamp(k, 0, 1)));
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`;
  }
  function liquid(ctx, c, level, color, al) {
    if (al <= 0.01 || level >= BBOT - 2) return;
    ctx.save(); ctx.globalAlpha *= al;
    innerClip(ctx, c, level); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }
  function surface(ctx, c, level, al) {        // 液面亮線（橫過電極，看得出液面上、液面下的分界）
    if (al <= 0.01 || level >= BBOT - 4) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.strokeStyle = 'rgba(205,240,250,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, level); ctx.lineTo(c.x1 - 2, level); ctx.stroke();
    ctx.strokeStyle = 'rgba(205,240,250,0.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c.x0 + 2, level + 4); ctx.lineTo(c.x1 - 2, level + 4); ctx.stroke();
    ctx.restore();
  }
  function electrode(ctx, e, level) {
    if (e.a <= 0.01) return;
    const x0 = e.x - EW / 2, y0 = ETOP + e.dy, h = EBOT - ETOP;
    const [hi, mid, lo] = e.kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    ctx.save(); ctx.globalAlpha *= e.a;
    const g = ctx.createLinearGradient(x0, 0, x0 + EW, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; rrect(ctx, x0, y0, EW, h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    // 液面下的部分壓暗（泡在溶液裡）
    if (level < y0 + h) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 2, Math.max(level, y0), EW + 4, y0 + h - Math.max(level, y0) + 2); ctx.clip();
      ctx.fillStyle = 'rgba(16,58,72,0.42)'; rrect(ctx, x0, y0, EW, h, 4); ctx.fill();
      ctx.restore();
    }
    // 接線端子
    ctx.fillStyle = '#3a4a44'; rrect(ctx, e.x - 7, y0 - 6, 14, 8, 2); ctx.fill();
    ctx.restore();
  }
  function ionDot(ctx, x, y, kind, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = kind ? K.neg : K.pos;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function ionBadge(ctx, x, y, kind, al, r) {
    if (al <= 0.01) return;
    const c = kind ? K.neg : K.pos;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(x, y, r || 13, 0, TAU); ctx.fill(); ctx.restore();
    text(ctx, kind ? '−' : '+', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function ions(ctx, t, level, al, badgeK) {
    if (al <= 0.01) return;
    [ION_L, ION_R].forEach((list, side) => list.forEach(([x, y, kind], k) => {
      if (y < level + 18) return;
      const j = k + side * 9;
      const ox = 5 * Math.sin(t * 1.7 + j * 1.31), oy = 4 * Math.sin(t * 2.3 + j * 2.07);
      ionDot(ctx, x + ox, y + oy, kind, al * (1 - badgeK));
      ionBadge(ctx, x + ox, y + oy, kind, al * badgeK);
    }));
  }
  // 鹽橋：玻璃管＋管內溶液＋只原地擺動的 ± 離子（不畫移動方向；細節留給下一分頁）
  function bridge(ctx, t, dy, al, badgeK) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(0, dy);
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    const st = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(TUBE[0].x, TUBE[0].y); TUBE.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); };
    st(T_OUT * 2 + 4, 'rgba(12,30,25,0.7)');
    st(T_OUT * 2, K.glass);
    st(T_IN * 2, K.bg);
    st(T_IN * 2, 'rgba(225,238,242,0.13)');
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = 2;                 // 玻璃反光
    const hl = lanePts(-T_IN + 3); ctx.beginPath(); ctx.moveTo(hl[0].x, hl[0].y); hl.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.restore();
    BRIDGE_IONS.forEach(([s0, kind], k) => {
      const p = at(TUBE_P, s0 + 3 * Math.sin(t * 2.1 + k * 1.7));
      const a = al * clamp((TUBE_P.L - s0) / 14, 0, 1);
      ionDot(ctx, p.x, p.y + dy, kind, a * (1 - badgeK));
      ionBadge(ctx, p.x, p.y + dy, kind, a * badgeK, 10);
    });
  }

  // ───────── 圖形：導線、電壓表、電子 ─────────
  function wireLine(ctx, pts, al) {
    if (al <= 0.01 || pts.length < 2) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function partial(pts, k) {                    // 沿折線畫到比例 k
    const P = mkPath(pts), len = P.L * clamp(k, 0, 1), out = [pts[0]];
    if (len <= 0) return [];
    for (const q of P.seg) {
      if (len >= q.s0 + q.len) out.push(q.b);
      else { out.push(at(P, len)); break; }
    }
    return out;
  }
  function wireEnd(ctx, x, y, al) {             // 導線末端的金屬夾頭
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(ctx, x - 7, y - 6, 14, 10, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function gapMark(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function ring(ctx, x, y, age, color) {
    if (age < 0 || age > 0.8) return;
    ctx.save(); ctx.globalAlpha = 1 - age / 0.8; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 8 + 30 * age, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function meter(ctx, k, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#e8eee6'; ctx.strokeStyle = '#2b3a34'; ctx.lineWidth = 3;
    rrect(ctx, MX - MW / 2, WY - MH / 2, MW, MH, 12); ctx.fill(); ctx.stroke();
    // 刻度弧
    const a0 = -65 * RAD, a1 = 65 * RAD, R = 46;
    ctx.strokeStyle = '#4b5a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.stroke();
    for (let j = 0; j <= 6; j++) {
      const a = lerp(a0, a1, j / 6) - Math.PI / 2, r0 = j % 3 ? R - 5 : R - 9;
      ctx.beginPath(); ctx.moveTo(MPIV.x + r0 * Math.cos(a), MPIV.y + r0 * Math.sin(a)); ctx.lineTo(MPIV.x + R * Math.cos(a), MPIV.y + R * Math.sin(a)); ctx.stroke();
    }
    // 指針：零點在左，偏轉到右
    const ang = lerp(-58, 30, k) * RAD - Math.PI / 2;
    ctx.strokeStyle = '#1f2a26'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MPIV.x, MPIV.y); ctx.lineTo(MPIV.x + NEEDLE * Math.cos(ang), MPIV.y + NEEDLE * Math.sin(ang)); ctx.stroke();
    ctx.fillStyle = '#1f2a26'; ctx.beginPath(); ctx.arc(MPIV.x, MPIV.y, 5, 0, TAU); ctx.fill();
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
  function electrons(ctx, t, front) {
    if (front === null) return;
    const sp = 34, d = 70 * t, L = E_PATH.L;
    for (let k = -1; k * sp < L + sp; k++) {
      const s = k * sp + (d % sp);
      if (s < 0 || s > L || s > front) continue;
      const p = at(E_PATH, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1) * clamp((front - s) / 20, 0, 1);
      ball(ctx, p.x, p.y, 6, fade);
    }
  }
  function glowPath(ctx, pts, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.globalAlpha *= 0.4;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.restore();
  }
  function glowLiquid(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    CUPS.forEach(c => { innerClip(ctx, c, LIQ + 4); ctx.stroke(); });
    ctx.restore();
  }
  function glowBridge(ctx, al) {                // 沿鹽橋兩側外緣的黃虛線
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineJoin = 'round';
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    [-(T_OUT + 5), T_OUT + 5].forEach(o => {
      const p = lanePts(o); ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); p.slice(1).forEach(q => ctx.lineTo(q.x, q.y)); ctx.stroke();
    });
    ctx.restore();
  }
  function glowElectrodes(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.shadowColor = K.yellow; ctx.shadowBlur = 10;
    [XL, XR].forEach(x => { rrect(ctx, x - EW / 2 - 7, ETOP - 10, EW + 14, EBOT - ETOP + 16, 8); ctx.stroke(); });
    ctx.restore();
  }
  function mark(ctx, ok, x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function miniPlate(ctx, x, y, kind, al) {       // 右欄的小金屬片
    if (al <= 0.01) return;
    const [hi, mid, lo] = kind === 'cu' ? [K.cuHi, K.cu, K.cuLo] : [K.znHi, K.zn, K.znLo];
    ctx.save(); ctx.globalAlpha *= al;
    const g = ctx.createLinearGradient(x - 11, 0, x + 11, 0);
    g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.65, mid); g.addColorStop(1, lo);
    ctx.fillStyle = g; rrect(ctx, x - 11, y - 24, 22, 48, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }

  // ───────── 圖形：蛙腿縮圖（同 galvani 檔的畫法） ─────────
  const HIP = { x: 522, y: 414 }, KNEE = { x: 655, y: 417 };
  function limb(ctx, P, Q, w1, w2, bulge, fill, stroke) {
    const dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const an = Math.atan2(ny, nx), M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 }, mid = (w1 + w2) / 4;
    ctx.beginPath();
    ctx.moveTo(P.x + nx * w1 / 2, P.y + ny * w1 / 2);
    ctx.quadraticCurveTo(M.x + nx * (mid + bulge), M.y + ny * (mid + bulge), Q.x + nx * w2 / 2, Q.y + ny * w2 / 2);
    ctx.arc(Q.x, Q.y, w2 / 2, an, an - Math.PI, true);
    ctx.quadraticCurveTo(M.x - nx * (mid + bulge * 0.5), M.y - ny * (mid + bulge * 0.5), P.x - nx * w1 / 2, P.y - ny * w1 / 2);
    ctx.arc(P.x, P.y, w1 / 2, an + Math.PI, an, true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke();
  }
  function leg(ctx) {
    const a = 7 * RAD, A = { x: KNEE.x + 118 * Math.cos(a), y: KNEE.y + 118 * Math.sin(a) };
    const f = a - 6 * RAD, TB = { x: A.x + 38 * Math.cos(f), y: A.y + 38 * Math.sin(f) };
    ctx.save(); ctx.lineJoin = 'round';
    const toes = [[-0.36, 50], [-0.13, 64], [0.09, 62], [0.30, 48]].map(([da, l]) => {
      const ang = f + da; return { x: TB.x + l * Math.cos(ang), y: TB.y + l * Math.sin(ang) };
    });
    ctx.fillStyle = 'rgba(111,159,85,0.8)'; ctx.strokeStyle = K.skinLo; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(TB.x, TB.y);
    toes.forEach((p, k) => { if (k) { const q = toes[k - 1]; ctx.quadraticCurveTo((p.x + q.x) / 2 * 0.8 + TB.x * 0.2, (p.y + q.y) / 2 * 0.8 + TB.y * 0.2, p.x, p.y); } else ctx.lineTo(p.x, p.y); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    toes.forEach(p => limb(ctx, TB, p, 9, 6, 0, K.skin, K.skinLo));
    ctx.fillStyle = K.skinHi; toes.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); });
    limb(ctx, A, TB, 15, 11, 0, K.skin, K.skinLo);
    limb(ctx, KNEE, A, 30, 15, 5, K.skin, K.skinLo);
    limb(ctx, HIP, KNEE, 50, 30, 7, K.skin, K.skinLo);
    ctx.fillStyle = K.spot;
    [[560, 410, 7, 4], [598, 420, 6, 3.5], [625, 408, 5, 3]].forEach(([x, y, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); });
    ctx.fillStyle = K.cut; ctx.strokeStyle = '#b06f6a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(HIP.x - 14, HIP.y, 10, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function frogThumb(ctx, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
    rrect(ctx, FT.x, FT.y, FT.w, FT.h, 14); ctx.fill(); ctx.stroke();
    ctx.save(); rrect(ctx, FT.x + 4, FT.y + 4, FT.w - 8, FT.h - 8, 12); ctx.clip();
    ctx.translate(FT.x + FT.w / 2, FT.y + FT.h / 2 - 4); ctx.scale(0.6, 0.6); ctx.translate(-686, -420);
    // 鐵盤（金屬）在蛙腿下面、銅刀（金屬）碰著蛙腿
    const g = ctx.createLinearGradient(0, 452, 0, 470);
    g.addColorStop(0, K.feHi); g.addColorStop(1, K.feLo);
    ctx.fillStyle = g; rrect(ctx, 440, 452, 480, 18, 5); ctx.fill();
    leg(ctx);
    const kg = ctx.createLinearGradient(0, 330, 0, 350);
    kg.addColorStop(0, K.cuHi); kg.addColorStop(1, K.cuLo);
    ctx.save(); ctx.translate(470, 380); ctx.rotate(-38 * RAD);
    ctx.fillStyle = kg; rrect(ctx, -10, -9, 120, 18, 8); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }
  function arrowLeft(ctx, x0, x1, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.fillStyle = K.yellow; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 + 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + 16, y - 10); ctx.lineTo(x1 + 16, y + 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ───────── 標註 ─────────
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  // 一列：圖示＋文字段落，回傳下一列 y
  function row(ctx, ok, s, y, color, al, size) {
    mark(ctx, ok, RX + 16, y, al);
    return block(ctx, s, RX + 42, y, RW - 42, color, size || 24, 'left', al);
  }
  // 杯內液面上方的溶液名稱（中文一行；英文太長就拆兩行）
  function solLabel(ctx, s, cx, maxW, color, al) {
    if (al <= 0.01) return;
    const ls = wrap(ctx, s, maxW, 22);
    if (ls.length === 1) text(ctx, ls[0], cx, 270, color, 22, 'center', al);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, cx, k ? 282 : 256, color, 22, 'center', al));
  }

  // ───────── 共同的裝置畫面 ─────────
  function apparatus(ctx, i, tl, t, S) {
    const b = S.build, A = t0 => (i === 0 ? ease((b - t0) / 0.6) : 1);
    const level = i === 0 ? lerp(BBOT, LIQ, ease((b - 2.0) / 1.0)) : LIQ;
    const liqA = A(1.9);
    beakerBack(ctx, A(1.6));
    S.els.forEach(e => electrode(ctx, e, level));
    liquid(ctx, CUPS[0], level, solColor(0), liqA);
    liquid(ctx, CUPS[1], level, solColor(S.cuSol), liqA);
    const badgeK = i === 3 ? ease((tl - 2.6) / 0.6) : (i === 4 ? 1 : 0);
    ions(ctx, t, level, i === 0 ? ease((b - 3.0) / 0.6) : 1, badgeK);
    CUPS.forEach(c => surface(ctx, c, level, liqA));
    // 鹽橋：第 1 步從上方輕輕放下
    const bk = i === 0 ? ease((b - 3.9) / 0.6) : 1;
    bridge(ctx, t, -30 * (1 - bk), bk, badgeK);
    beakerFront(ctx, A(1.6));
    // 導線：左邊一直接著；右邊末端依 conn 升降（斷開時真的留缺口）
    const wl = i === 0 ? ease((b - 4.9) / 0.6) : 1, wr = i === 0 ? ease((b - 5.2) / 0.6) : 1;
    const lPts = [{ x: XL, y: ETOP - 2 }, { x: XL, y: WY }, { x: MX - MW / 2, y: WY }];
    const ry = lerp(S.retract ? lerp(OPEN_Y, WY + 12, S.retract) : OPEN_Y, ETOP - 2, S.conn);
    const rPts = [{ x: MX + MW / 2, y: WY }, { x: XR, y: WY }, { x: XR, y: ry }];
    wireLine(ctx, partial(lPts, wl), 1);
    wireLine(ctx, partial(rPts, wr), 1);
    if (wr > 0.98) wireEnd(ctx, XR, ry, 1);
    // 斷開標示
    const openA = i === 0 ? ease((b - 5.7) / 0.5) : (i === 1 ? 1 - ease((tl - 0.8) / 0.4) : 0);
    gapMark(ctx, XR, (ry + ETOP) / 2 + 2, openA);
    text(ctx, tr('斷開', 'Open'), XR - 20, 170, K.muted, 22, 'right', openA);
    if (S.contactAge >= 0) ring(ctx, XR, ETOP - 2, S.contactAge, K.white);
    // 電子（先畫）→ 電壓表（後畫，電子從表後面通過）
    electrons(ctx, t, S.eFront);
    meter(ctx, S.needle, A(4.6));
    // 部件標註
    text(ctx, tr('電壓表', 'Voltmeter'), (MX + MW / 2 + XR) / 2, 104, K.white, 22, 'center', A(4.7));
    text(ctx, tr('外導線', 'Outer wire'), (XL + MX - MW / 2) / 2, 104, K.white, 22, 'center', A(5.3));
    text(ctx, tr('鋅 Zn', 'Zinc (Zn)'), XL + EW / 2 + 10, 212, K.znHi, 22, 'left', A(3.4));
    S.els.filter(e => e.x === XR).forEach(e => {
      if (e.kind === 'cu') text(ctx, tr('銅 Cu', 'Copper (Cu)'), XR - EW / 2 - 8, 212, K.cuHi, 22, 'right', e.a * A(3.6));
      else text(ctx, tr('鋅 Zn', 'Zinc (Zn)'), XR - EW / 2 - 8, 212, K.znHi, 22, 'right', e.a * A(3.6));
    });
    // 溶液名稱（右杯在第 3 步跟著換：先淡出再淡入，字不交疊）
    const solA = A(2.6), lcx = (XL + EW / 2 + BLX - T_OUT) / 2, rcx = (BRX + T_OUT + XR - EW / 2) / 2, sw = BLX - T_OUT - (XL + EW / 2) - 16;
    solLabel(ctx, tr('硫酸鋅溶液', 'ZnSO₄ solution'), lcx, sw, K.muted, solA);
    const m = i === 2 ? clamp((tl - 1.9) / 0.9, 0, 1) : S.cuSol;
    solLabel(ctx, tr('硫酸鋅溶液', 'ZnSO₄ solution'), rcx, sw, K.muted, solA * clamp(1 - 2 * m, 0, 1));
    solLabel(ctx, tr('硫酸銅溶液', 'CuSO₄ solution'), rcx, sw, K.cyan, solA * clamp(2 * m - 1, 0, 1));
    // 鹽橋名稱：寫在兩杯之間、拱形下方
    block(ctx, tr('鹽橋', 'Salt bridge'), MX, 322, CUPS[1].x0 - CUPS[0].x1 - 10, K.white, 22, 'center', bk * (i === 0 ? ease((b - 4.3) / 0.6) : 1), 26);
  }

  // ───────── 各步右欄 ─────────
  function notes1(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    frogThumb(ctx, a(0.2));
    let y = block(ctx, tr('蛙腿：金屬＋濕潤的組織', 'Frog leg: metals + moist tissue'), FT.x + FT.w / 2, 258, RW, K.white, 24, 'center', a(0.8));
    arrowLeft(ctx, FT.x - 12, 594, 164, a(1.4));
    text(ctx, tr('換成', 'Swap'), 624, 138, K.yellow, 22, 'center', a(1.4));
    y = Math.max(y, 300) + 30;
    y = row(ctx, false, tr('右邊的導線還沒接上', 'The right wire is not connected'), y, K.white, a(5.9));
    row(ctx, false, tr('迴路斷開：指針不動', 'Circuit open: the needle stays still'), y + 12, K.white, a(6.4));
    bottomLines(ctx, tr('兩片電極分在兩杯電解質、用鹽橋連通；導線還沒接上，指針不動', 'Electrodes in two cups joined by a salt bridge; wire not connected, needle still'), K.yellow, a(6.9));
  }
  function notes2(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    let y = block(ctx, tr('兩片一樣的金屬', 'Two identical metals'), RX, 120, RW, K.white, 26, 'left', a(0.2), 34);
    const my = y + 28;
    miniPlate(ctx, RX + 30, my, 'zn', a(0.4));
    text(ctx, '＝', RX + 72, my, K.white, 28, 'center', a(0.4));
    miniPlate(ctx, RX + 114, my, 'zn', a(0.4));
    text(ctx, 'Zn', RX + 150, my, K.znHi, 24, 'left', a(0.4), true);
    y = my + 54;
    y = row(ctx, true, tr('接成閉合迴路', 'Circuit closed'), y, K.white, a(1.8));
    y = row(ctx, false, tr('指針不動', 'Needle does not move'), y + 12, K.white, a(2.8));
    y = row(ctx, false, tr('沒有持續的電子流', 'No steady electron flow'), y + 12, K.white, a(3.6));
    // 指針旁的提示圈
    const hA = a(2.8) * (0.6 + 0.4 * Math.sin(t * 4));
    if (hA > 0.01) { ctx.save(); ctx.globalAlpha = hA; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]); rrect(ctx, MX - MW / 2 - 8, WY - MH / 2 - 8, MW + 16, MH + 16, 16); ctx.stroke(); ctx.restore(); }
    bottomLines(ctx, tr('兩片相同金屬沒有足夠差異，無法維持持續電流', 'Two identical metals lack enough difference to keep a current going'), K.yellow, a(5.2));
  }
  function notes3(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    let y = block(ctx, tr('鋅 Zn：較活潑', 'Zinc (Zn): more active'), RX, 120, RW, K.znHi, 26, 'left', a(4.0), 34);
    y = block(ctx, tr('送出電子', 'gives electrons'), RX, y, RW, K.white, 24, 'left', a(4.3));
    y = block(ctx, tr('銅 Cu：較不活潑', 'Copper (Cu): less active'), RX, y + 16, RW, K.cuHi, 26, 'left', a(5.0), 34);
    y = block(ctx, tr('接收電子', 'receives electrons'), RX, y, RW, K.white, 24, 'left', a(5.3));
    y = block(ctx, tr('e⁻ 由鋅流向銅', 'e⁻ flow from Zn to Cu'), RX, y + 16, RW, K.electron, 26, 'left', a(6.0), 34);
    row(ctx, true, tr('指針偏轉', 'The needle swings'), y + 14, K.green, a(6.5), 26);
    bottomLines(ctx, tr('鋅較活潑送出電子，銅較不活潑接收電子', 'Zinc (more active) gives electrons; copper (less active) receives them'), K.yellow, a(7.0));
  }
  function notes4(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    let y = block(ctx, tr('電子 e⁻', 'Electrons e⁻'), RX, 112, RW, K.electron, 24, 'left', a(0.6), 30);
    y = block(ctx, tr('只在金屬和外導線裡走', 'travel only in metal and wire'), RX, y, RW, K.white, 22, 'left', a(0.9), 28);
    const iy = y + 18, iA = a(2.6);
    if (iA > 0.01) { ionBadge(ctx, RX + 13, iy, 0, iA); ionBadge(ctx, RX + 45, iy, 1, iA); }
    text(ctx, tr('離子', 'Ions'), RX + 70, iy, K.white, 24, 'left', iA);
    y = block(ctx, tr('只在兩杯溶液和鹽橋裡', 'stay in the solutions and bridge'), RX, iy + 30, RW, K.white, 22, 'left', a(3.0), 28);
    y = row(ctx, true, tr('兩極隔開（分成兩杯）', 'Kept apart (two cups)'), y + 22, K.green, a(5.0), 24);
    y = block(ctx, tr('電子只能走外導線，才有外電流', 'e⁻ must take the outer wire: outer current'), RX + 42, y, RW - 30, K.white, 22, 'left', a(5.4), 28);
    // 對照（只用文字＋✗，不另畫燒杯）
    y = row(ctx, false, tr('泡在同一杯、直接接觸：\n鋅直接反應，沒有外電流', 'Same cup, direct contact: Zn reacts directly, no outer current'), y + 14, K.muted, a(6.2), 22);
    bottomLines(ctx, tr('兩極隔開：電子走外導線、離子留在溶液和鹽橋', 'Kept apart: e⁻ take the outer wire, ions stay in solution and bridge'), K.yellow, a(7.0));
  }
  function notes5(ctx, tl) {
    const a = t0 => ease((tl - t0) / 0.6);
    let y = block(ctx, tr('電池的條件', 'What a battery needs'), RX, 112, RW, K.yellow, 26, 'left', a(0.2), 32);
    y = row(ctx, true, tr('兩種不同的金屬', 'Two different metals'), y + 8, K.white, a(0.8));
    y = row(ctx, true, tr('電解質', 'An electrolyte'), y + 6, K.white, a(1.8));
    y = row(ctx, true, tr('兩極隔開（鹽橋連通）', 'Kept apart (salt bridge)'), y + 6, K.white, a(2.8));
    y = row(ctx, true, tr('閉合迴路', 'A closed circuit'), y + 6, K.white, a(3.8));
    // 對照：兩片鋅
    const cA = a(4.9), cy = y + 36;
    miniPlate(ctx, RX + 16, cy, 'zn', cA);
    text(ctx, '＝', RX + 48, cy, K.white, 26, 'center', cA);
    miniPlate(ctx, RX + 80, cy, 'zn', cA);
    mark(ctx, false, RX + 124, cy, cA);
    const ty = block(ctx, tr('兩片鋅：沒有足夠差異', 'Two Zn: not different enough'), RX, cy + 42, RW, K.muted, 22, 'left', a(5.2), 28);
    block(ctx, tr('無法維持持續電流', 'no steady current'), RX, ty, RW, K.muted, 22, 'left', a(5.2), 28);
    bottomLines(ctx, tr('下一個分頁「氧化與還原」：電子到底從哪來、到哪去？', 'Next: Oxidation & Reduction — where do electrons come from and go?'), K.cyan, a(5.8));
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i, tl) {
    const items = [];
    items.push([tr('橘＝正離子、紫＝負離子（只在溶液與鹽橋裡）', 'Orange = positive ion, purple = negative ion (solution & bridge only)'), 'i']);
    if (i >= 2) items.push([tr('藍球 e⁻＝電子（只在金屬與導線裡）', 'Blue ball e⁻ = electron (metal and wire only)'), 'b']);
    const al = i === 0 ? ease((tl - 3.2) / 0.6) : 1;
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
        if (kind === 'b') ball(ctx, x + 14, y, 6, 1);
        else { ctx.fillStyle = K.pos; ctx.beginPath(); ctx.arc(x + 7, y, 5, 0, TAU); ctx.fill(); ctx.fillStyle = K.neg; ctx.beginPath(); ctx.arc(x + 22, y, 5, 0, TAU); ctx.fill(); }
        ctx.restore();
        text(ctx, s, x + gapIcon, y, K.white, z, 'left', al);
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 940, 26);
    text(ctx, ls[0], W / 2, 58, K.yellow, 26);
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function drawScene(ctx, i, tl, t) {
    const S = state(i, tl, t);
    const win = (t0, t1, f) => ease((tl - t0) / f) * (1 - ease((tl - t1) / f));
    // 第 4、5 步：對應部位發亮（導線光畫在裝置之前，當底光）
    const wirePts = [{ x: XL, y: ETOP }, { x: XL, y: WY }, { x: XR, y: WY }, { x: XR, y: ETOP }];
    if (i === 3) glowPath(ctx, wirePts, win(0.6, 2.4, 0.5), K.electron);
    if (i === 4) glowPath(ctx, wirePts, win(3.8, 4.8, 0.4), K.yellow);
    apparatus(ctx, i, tl, t, S);
    if (i === 3) { const g = win(2.6, 4.8, 0.5); glowLiquid(ctx, g); glowBridge(ctx, g); }
    if (i === 4) {
      glowElectrodes(ctx, win(0.8, 1.8, 0.4));
      glowLiquid(ctx, win(1.8, 2.8, 0.4));
      glowBridge(ctx, win(2.8, 3.8, 0.4));
    }
    [notes1, notes2, notes3, notes4, notes5][i](ctx, tl, t);
    drawLegend(ctx, i, tl);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('originAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('originAnimResult'); if (el) el.innerHTML = html;
  }
  function render() {
    const c = canvas(); if (!c || !c.width) return;
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
    const r = document.getElementById('steps-origin');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-origin'); if (!r) return;
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

  window.GbAnim.origin = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const r = document.getElementById('steps-origin'); if (r) r.innerHTML = '';
      const o = document.getElementById('originAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { origin: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() {
      const i = stepAt(S.t), st = state(i, S.t - STARTS[i], S.t);
      return { scene: S.on ? 'origin' : null, t: S.t, step: S.step, running: !!S.raf, right: st.els.length ? st.els[st.els.length - 1].kind : null, closed: st.conn > 0.99, needle: +st.needle.toFixed(3), cuSol: +st.cuSol.toFixed(3) };
    }
  };
})();
