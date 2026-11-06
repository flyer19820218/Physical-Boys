/* galvanic_batteries_4_types_1106_v1.js — 「為什麼不能亂充電？／常見電池」分頁動畫（#typesAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.types = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'types'。畫布不綁事件；唯一控制是 #steps-types 的 5 個步驟鈕；結果框 #typesAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（寫法沿用同課 cell／redox，但不呼叫它們的內部函式）。
 * 畫面是「場景時間 t 的純函式」：電子位置、小燈亮度、反應物剩多少、Li⁺ 位置都只由 t 算出。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。下方 y≈506/536：本步一句；y≈574：圖例（第 5 步不畫圖例）。
 *   第 1、2 步：左右兩個「電池＋小燈」迴路（中心 x=250／750）。電池橫放 y 320–390，負極在左端、正極（凸點）在右端；
 *     導線往上繞到 y=170，小燈在正上方；電子從負極出發 → 往上 → 經小燈 → 往下 → 進正極。電池內的淺綠條＝反應物剩多少。
 *     第 2 步右半換成「一次電池的反應」卡片（反應物 → 生成物 ✓；反向 ✗）。
 *   第 3、4 步：左半是「外部電源（上，中心 300,160）＋電池（x 80–520, y 245–385）」；電源負極接電池負極、正極接正極。
 *     第 3 步電池畫成鋰離子剖面：左負極、右正極、中間電解質，Li⁺（橘膠囊）只在電解質區游動；右半是鉛蓄電池反應式卡片（放電↓／充電↑）。
 *     第 4 步電池是一次電池（用完了），硬接電源 → 大紅叉；右半是警示卡片。
 *   第 5 步：兩欄對照表（一次／二次 × 例子、能不能充電、放電、充電）。
 * ── 科學表示（只用頁面原有內容） ───────────────────────────────────
 *   放電：化學能 → 電能；充電：電能 → 化學能，正極接正極、負極接負極，外部電源強制推動反向反應。
 *   鋰離子：放電時 Li⁺ 從負極游向正極，充電時游回負極；電子只走外電路、Li⁺ 只在電池內部。
 *   鉛蓄：Pb ＋ PbO₂ ＋ 2H₂SO₄ ⟶ 2PbSO₄ ＋ 2H₂O（放電），充電反過來。
 *   一次電池：反應不能倒回去、不可嘗試充電、用完交給廢電池回收（含有害物質）。不寫電壓數值、不寫年份、不寫爆炸機制。
 *   顏色：電子＝#4dd2ff 圓球；Li⁺＝橘 #ff8040；電池「＋」橘、「−」藍；警示＝紅 #ff6b5a；黃色只用在標題與進度條。
 *
 * ── 步驟表，共 43 s ─────────────────────────────────────────────
 *   1 放電       8 s  一次（碳鋅、鹼性）與二次（鉛蓄、鋰離子、鎳氫）兩個迴路；電子從負極經小燈到正極；化學能 → 電能
 *   2 用完       8 s  一次電池反應物用完、電子停下、小燈熄滅；右卡：反應只往一個方向，不能倒回去
 *   3 充電      10 s  鋰離子剖面接外部電源（正接正、負接負）；電子方向反過來、Li⁺ 游回負極；電能 → 化學能；鉛蓄反應式 ↓↑
 *   4 不能亂充   8 s  一次電池硬接電源：推不回去 → 大紅叉＋警示；不可嘗試充電；不可拆解、短路、加熱
 *   5 整理       9 s  對照表＋回收提醒
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
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', ink: '#0c1e19', red: '#ff6b5a',
    wire: '#c9d3d6', body: '#1d4337', bodyHi: '#2c5e4e', edge: '#b9d3c8', stuff: '#86b89c',
    negEl: '#56615c', posEl: '#6e6559', lyte: 'rgba(120,200,190,0.13)'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const swapOut = m => clamp(1 - 2 * m, 0, 1), swapIn = m => clamp(2 * m - 1, 0, 1);   // 先淡出再淡入（字不交疊）
  const Fd = u => u - u * u * u + u * u * u * u / 2;                                   // ∫(1−smoothstep)

  // ───────── 文字工具（先量再寫） ─────────
  function textW(ctx, s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(ctx, s, maxW, size, m) {
    if (s.indexOf('\n') >= 0) return s.split('\n').reduce((a, part) => a.concat(wrap(ctx, part, maxW, size, m)), []);
    ctx.save(); ctx.font = font(size, m);
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
  // 置中多行：以 cy 為整塊的中心
  function blockC(ctx, s, cx, cy, maxW, color, size, alpha, align) {
    const ls = wrap(ctx, s, maxW, size), h = Math.round(size * 1.3), y0 = cy - (ls.length - 1) * h / 2;
    ls.forEach((l, k) => text(ctx, l, cx, y0 + k * h, color, size, align || 'center', alpha));
    return ls.length;
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
  // 第 1、2 步：放電迴路（cx＝250 或 750）
  const PB = { y0: 320, y1: 390, hw: 110, wy: 170, wx: 150 };
  const PCY = (PB.y0 + PB.y1) / 2;
  function loopPts(cx) {
    return [{ x: cx - PB.hw, y: PCY }, { x: cx - PB.wx, y: PCY }, { x: cx - PB.wx, y: PB.wy },
      { x: cx + PB.wx, y: PB.wy }, { x: cx + PB.wx, y: PCY }, { x: cx + PB.hw + 14, y: PCY }];
  }
  const LOOPS = [mkPath(loopPts(250)), mkPath(loopPts(750))];
  const V1 = 140, SP1 = 62;
  // 第 3、4 步：外部電源＋電池
  const BX0 = 80, BX1 = 520, BT0 = 245, BT1 = 385, BCY = 315;
  const CHX = 300, CHY = 160, CHW = 170, CHH = 64;
  const LWX = 50, RWX = 560;
  const NEG_WIRE = [{ x: CHX - CHW / 2, y: CHY }, { x: LWX, y: CHY }, { x: LWX, y: BCY }, { x: BX0, y: BCY }];        // 電源負極 → 電池負極
  const POS_WIRE = [{ x: BX1 + 12, y: BCY }, { x: RWX, y: BCY }, { x: RWX, y: CHY }, { x: CHX + CHW / 2, y: CHY }];  // 電池正極 → 電源正極
  const PN = mkPath(NEG_WIRE), PP = mkPath(POS_WIRE);
  const V3 = 120, SP3 = 58;
  // Li⁺：3 列 × 2 欄，只在電解質區（x 160–440）
  const LI_ROWS = [280, 315, 350], LI_POS = [335, 400], LI_NEG = [200, 265];
  // 右側卡片
  const CARD = { x0: 600, x1: 970, y0: 92, y1: 476 };
  const CCX = (CARD.x0 + CARD.x1) / 2;

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['放電', 'Discharge'],
      cap: ['一次電池、二次電池放電：都是化學能 → 電能', 'Both kinds of battery discharge: chemical → electrical energy'],
      bot: ['電子從負極出發，經外電路（小燈）回到正極，小燈亮起', 'Electrons leave the negative end, pass the lamp, and reach the positive end'],
      res: ['一次電池（碳鋅、鹼性）和二次電池（鉛蓄、鋰離子、鎳氫）放電時都一樣：把化學能轉換成電能。電子從負極出發，經外電路（小燈）回到正極，小燈就亮了。',
        'Primary batteries (carbon-zinc, alkaline) and secondary batteries (lead-acid, Li-ion, Ni-MH) discharge the same way: chemical energy becomes electrical energy. Electrons leave the negative end, travel through the outer circuit (the lamp), and reach the positive end — the lamp lights up.'] },
    { dur: 8, b: ['用完', 'Used up'],
      cap: ['一次電池用完：反應只往一個方向，不能倒回去', 'A primary battery runs out: the reaction only goes one way'],
      bot: ['反應物用完，電子不再流動，小燈熄滅：這顆電池就沒電了', 'Reactants used up: electrons stop, the lamp goes out — the battery is dead'],
      res: ['一次電池的化學反應只往一個方向進行：反應物越用越少，用完了電子就不再流動，小燈熄滅。反應不能倒回去，所以一次電池用完就要換新的。',
        'In a primary battery the chemical reaction only goes one way: the reactants get used up, then electrons stop flowing and the lamp goes out. The reaction cannot go back, so a used-up primary battery has to be replaced.'] },
    { dur: 10, b: ['充電', 'Charging'],
      cap: ['二次電池充電：正極接正極、負極接負極，反應倒著走', 'Charging a secondary battery: + to +, − to −, the reaction runs backward'],
      bot: ['外部電源強制推動反向的化學反應：電能 → 化學能', 'The outside power supply forces the reaction backward: electrical → chemical'],
      res: ['二次電池充電時，外部電源必須「正極接正極、負極接負極」，用電能強制推動反向的化學反應，把電能轉換成化學能存起來。鋰離子電池放電時 Li⁺ 從負極游向正極，充電時游回負極；鉛蓄電池放電與充電的反應方向相反。鋰離子電池能量密度高，手機、電腦常用，要避免高溫、擠壓與破壞。',
        'To charge a secondary battery, connect the power supply + to + and − to −. Electrical energy forces the chemical reaction to run backward and is stored as chemical energy. In a Li-ion battery, Li⁺ moves from the negative side to the positive side during discharge, and back again during charging; in a lead-acid battery, charging runs the discharge reaction in reverse. Li-ion batteries store a lot of energy, so phones and computers use them — keep them away from heat, crushing and damage.'] },
    { dur: 8, b: ['不能亂充', "Don't charge"],
      cap: ['一次電池為什麼不能充電？推不回去，只會有危險', "Why not charge a primary battery? It won't go back — only danger"],
      bot: ['一次電池不可嘗試充電；用完交給廢電池回收', 'Never try to charge a primary battery; recycle it when it is used up'],
      res: ['一次電池的反應不能倒回去：就算硬接上電源，也推不回去，只會有危險。所以一次電池不可嘗試充電；任何電池都不可拆解、短路或加熱。',
        'A primary battery’s reaction cannot go back: even if you force a power supply onto it, nothing is restored — it is only dangerous. So never try to charge a primary battery, and never open, short-circuit or heat any battery.'] },
    { dur: 9, b: ['整理', 'Summary'],
      cap: ['整理：一次電池與二次電池', 'Summary: primary vs secondary batteries'],
      bot: ['廢電池含有害物質：用完一定要交給廢電池回收', 'Used batteries contain harmful substances: always take them to battery recycling'],
      res: ['一次電池（碳鋅、鹼性）不可充電；二次電池（鉛蓄、鋰離子、鎳氫）可重複充電。放電：化學能 → 電能；充電：電能 → 化學能（正極接正極、負極接負極）。廢電池含有害物質，用完要交給廢電池回收。',
        'Primary batteries (carbon-zinc, alkaline) are not rechargeable; secondary batteries (lead-acid, Li-ion, Ni-MH) can be recharged again and again. Discharge: chemical → electrical energy; charge: electrical → chemical energy (+ to +, − to −). Used batteries contain harmful substances — take them to battery recycling.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  // 第 2 步：流量 f＝1−smoothstep((tl−A2)/D2)，反應物同步降到 0
  const A2 = 0.4, D2 = 4.4;
  const f2 = tl => 1 - ease((tl - A2) / D2);
  const I2 = tl => Math.min(tl, A2) + D2 * Fd(clamp((tl - A2) / D2, 0, 1)) + Math.max(0, tl - A2 - D2) * 0;
  const D1END = V1 * (STEPS[0].dur - 2.4);
  const LV1 = 0.82;
  function state(i, tl) {
    const S = { i, lamp: [0, 0], level: [1, 1], d: [null, null], flow: 0, li: 0, liRows: [0, 0, 0], d3: null };
    if (i === 0) {
      const on = ease((tl - 2.4) / 0.5);
      S.d = [Math.max(0, V1 * (tl - 2.4)), Math.max(0, V1 * (tl - 2.4))];
      S.lamp = [ease((tl - 2.7) / 0.5), ease((tl - 2.7) / 0.5)];
      const lv = 1 - (1 - LV1) * clamp((tl - 2.4) / (STEPS[0].dur - 2.4), 0, 1);
      S.level = [lv, lv]; S.flow = on;
    } else if (i === 1) {
      const f = f2(tl);
      S.d = [D1END + V1 * I2(tl), null];
      S.lamp = [f, 0]; S.level = [LV1 * f, LV1]; S.flow = f;
    } else if (i === 2) {
      const T0 = 2.2;
      S.d3 = Math.max(0, V3 * (tl - T0));
      S.flow = ease((tl - T0) / 0.4);
      S.liRows = LI_ROWS.map((_, r) => ease((tl - 2.6 - 0.5 * r) / 2.6));
      S.li = S.liRows.reduce((a, b) => a + b, 0) / 3;
    } else if (i === 3) {
      const T0 = 1.7;
      S.d3 = Math.max(0, V3 * 0.55 * (tl - T0));
      S.flow = ease((tl - T0) / 0.4) * (1 - ease((tl - 3.3) / 0.5));
      S.level = [0, 0];
    }
    return S;
  }

  // ───────── 圖形 ─────────
  function wireLine(ctx, pts, al) {
    if (pts.length < 2 || al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(ctx, pts); ctx.stroke(); });
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
  function flowE(ctx, P, d, sp, al) {             // 電子沿路徑 P 走；只畫已經走到的（s ≤ d）
    if (d === null || d <= 0 || al <= 0.01) return;
    const L = P.L;
    for (let k = -1; k * sp < L + sp; k++) {
      const s = k * sp + (d % sp);
      if (s < 0 || s > L || s > d) continue;
      const p = at(P, s), fade = clamp(Math.min(s, L - s) / 18, 0, 1) * clamp((d - s) / 16, 0, 1);
      ball(ctx, p.x, p.y, 8, fade * al);
    }
  }
  function lamp(ctx, x, y, k, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    if (k > 0.01) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, 70);
      g.addColorStop(0, `rgba(255,250,235,${0.75 * k})`); g.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = k > 0.01 ? `rgba(255,252,240,${0.25 + 0.7 * k})` : 'rgba(200,220,215,0.14)';
    ctx.strokeStyle = 'rgba(226,240,236,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = k > 0.01 ? `rgba(120,90,40,${0.5 + 0.5 * k})` : 'rgba(150,170,165,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 12, y + 4); ctx.lineTo(x - 6, y - 6); ctx.lineTo(x, y + 4); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x + 12, y + 4); ctx.stroke();
    ctx.restore();
  }
  // 電池外殼：kind 'cyl'（一次：圓柱）或 'pack'（二次：方形）；負極在左端、正極凸點在右端
  function battery(ctx, x0, y0, x1, y1, kind, level, al, opt) {
    if (al <= 0.01) return;
    opt = opt || {};
    const h = y1 - y0, r = kind === 'cyl' ? h * 0.42 : 10, cy = (y0 + y1) / 2;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.edge; rrect(ctx, x1 - 2, cy - h * 0.22, 14, h * 0.44, 4); ctx.fill();               // 正極凸點
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, K.bodyHi); g.addColorStop(0.45, K.body); g.addColorStop(1, '#14302a');
    ctx.fillStyle = g; rrect(ctx, x0, y0, x1 - x0, h, r); ctx.fill();
    ctx.strokeStyle = opt.hot ? K.red : K.edge; ctx.lineWidth = opt.hot ? 4 : 3;
    if (opt.hot) { ctx.shadowColor = K.red; ctx.shadowBlur = 18 * opt.hot; }
    ctx.stroke(); ctx.shadowBlur = 0;
    if (kind === 'cyl') {                                                                     // 圓柱的金屬環
      ctx.strokeStyle = 'rgba(185,211,200,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1 - r * 0.9, y0 + 4); ctx.lineTo(x1 - r * 0.9, y1 - 4); ctx.stroke();
    }
    // 反應物剩多少（淺綠條）
    if (opt.bar !== false) {
      const bx0 = x0 + (opt.pad || 46), bx1 = x1 - (opt.pad || 46), bh = Math.min(30, h * 0.42);
      ctx.fillStyle = 'rgba(12,30,25,0.75)'; rrect(ctx, bx0, cy - bh / 2, bx1 - bx0, bh, 6); ctx.fill();
      if (level > 0.005) { ctx.fillStyle = K.stuff; rrect(ctx, bx0, cy - bh / 2, Math.max(8, (bx1 - bx0) * level), bh, 6); ctx.fill(); }
      ctx.strokeStyle = 'rgba(185,211,200,0.5)'; ctx.lineWidth = 1.5; rrect(ctx, bx0, cy - bh / 2, bx1 - bx0, bh, 6); ctx.stroke();
    }
    ctx.restore();
    if (opt.signsIn) {
      text(ctx, '−', x0 + 23, cy, K.electron, 28, 'center', al, true);
      text(ctx, '＋', x1 - 23, cy, K.pos, 26, 'center', al, true);
    }
  }
  function liPill(ctx, x, y, al) {
    if (al <= 0.01) return;
    const hw = textW(ctx, 'Li⁺', 22, true) / 2 + 7;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.pos; ctx.shadowColor = K.pos; ctx.shadowBlur = 6;
    rrect(ctx, x - hw, y - 15, hw * 2, 30, 15); ctx.fill(); ctx.restore();
    text(ctx, 'Li⁺', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function liCell(ctx, al) {                       // 鋰離子剖面（外殼＋負極／電解質／正極）
    if (al <= 0.01) return;
    battery(ctx, BX0, BT0, BX1, BT1, 'pack', 0, al, { bar: false });
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.negEl; rrect(ctx, BX0 + 10, BT0 + 10, 72, BT1 - BT0 - 20, 6); ctx.fill();
    ctx.fillStyle = K.posEl; rrect(ctx, BX1 - 82, BT0 + 10, 72, BT1 - BT0 - 20, 6); ctx.fill();
    ctx.fillStyle = K.lyte; ctx.fillRect(BX0 + 82, BT0 + 10, BX1 - BX0 - 164, BT1 - BT0 - 20);
    ctx.strokeStyle = 'rgba(12,30,25,0.5)'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      const y = BT0 + 30 + k * 27;
      ctx.beginPath(); ctx.moveTo(BX0 + 18, y); ctx.lineTo(BX0 + 74, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BX1 - 74, y); ctx.lineTo(BX1 - 18, y); ctx.stroke();
    }
    ctx.restore();
  }
  function charger(ctx, al, glow) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.panel; ctx.strokeStyle = K.electron; ctx.lineWidth = 3;
    if (glow) { ctx.shadowColor = K.electron; ctx.shadowBlur = 14 * glow; }
    rrect(ctx, CHX - CHW / 2, CHY - CHH / 2, CHW, CHH, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    const s = tr('外部電源', 'Power supply'), z = fitSize(ctx, s, CHW - 24, 24);
    text(ctx, s, CHX, CHY + 1, K.white, z, 'center', al);
    text(ctx, '−', CHX - CHW / 2 - 14, CHY - 22, K.electron, 28, 'center', al, true);
    text(ctx, '＋', CHX + CHW / 2 + 14, CHY - 22, K.pos, 26, 'center', al, true);
  }
  function arrow(ctx, x0, y0, x1, y1, color, al, w, glow) {
    if (al <= 0.01) return;
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, hd = 14 + (w || 4);
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w || 4; ctx.lineCap = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hd * 0.8, y1 - uy * hd * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * hd - uy * hd * 0.55, y1 - uy * hd + ux * hd * 0.55);
    ctx.lineTo(x1 - ux * hd + uy * hd * 0.55, y1 - uy * hd - ux * hd * 0.55); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function mark(ctx, ok, x, y, alpha, color, r) {
    if (alpha <= 0.01) return;
    r = r || 12; const q = r / 12;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = 3.5 * Math.sqrt(q); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color || (ok ? K.green : K.red); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 5.5 * q, y + 1 * q); ctx.lineTo(x - 1 * q, y + 5.5 * q); ctx.lineTo(x + 6.5 * q, y - 4.5 * q); }
    else { ctx.moveTo(x - 5 * q, y - 5 * q); ctx.lineTo(x + 5 * q, y + 5 * q); ctx.moveTo(x + 5 * q, y - 5 * q); ctx.lineTo(x - 5 * q, y + 5 * q); }
    ctx.stroke(); ctx.restore();
  }
  function bigX(ctx, cx, cy, s, k, al) {           // 大紅叉（兩筆依序畫出）
    if (al <= 0.01 || k <= 0) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.shadowColor = K.red; ctx.shadowBlur = 16;
    const k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    ctx.beginPath(); ctx.moveTo(cx - s, cy - s * 0.62); ctx.lineTo(cx - s + 2 * s * k1, cy - s * 0.62 + 1.24 * s * k1); ctx.stroke();
    if (k2 > 0) { ctx.beginPath(); ctx.moveTo(cx + s, cy - s * 0.62); ctx.lineTo(cx + s - 2 * s * k2, cy - s * 0.62 + 1.24 * s * k2); ctx.stroke(); }
    ctx.restore();
  }
  function warnIcon(ctx, x, y, s, color, al) {     // 三角形驚嘆號（純圖形），s＝半寬
    if (al <= 0.01) return;
    const q = s / 13;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = color; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(x, y - 12 * q); ctx.lineTo(x + 13 * q, y + 10 * q); ctx.lineTo(x - 13 * q, y + 10 * q); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = K.ink; ctx.lineWidth = 3 * q; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 4 * q); ctx.lineTo(x, y + 2 * q); ctx.stroke();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(x, y + 6.5 * q, 1.8 * q, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function card(ctx, al, color) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = 'rgba(18,51,41,0.85)'; ctx.strokeStyle = color || 'rgba(159,179,170,0.6)'; ctx.lineWidth = 3;
    rrect(ctx, CARD.x0, CARD.y0, CARD.x1 - CARD.x0, CARD.y1 - CARD.y0, 18); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // 一行「左詞 → 右詞」，箭頭長度依字寬；cross＝箭頭上打紅叉；rev＝箭頭朝左
  function wordArrow(ctx, l, r, cy, z, color, al, rev, cross, acolor) {
    if (al <= 0.01) return;
    const wl = textW(ctx, l, z), wr = textW(ctx, r, z);
    const lc = CARD.x0 + 22 + wl / 2, rc = CARD.x1 - 22 - wr / 2;
    text(ctx, l, lc, cy, color, z, 'center', al);
    text(ctx, r, rc, cy, color, z, 'center', al);
    const a0 = lc + wl / 2 + 14, a1 = rc - wr / 2 - 14;
    if (rev) arrow(ctx, a1, cy, a0, cy, acolor || color, al, 4); else arrow(ctx, a0, cy, a1, cy, acolor || color, al, 4);
    if (cross) mark(ctx, false, rev ? (a0 + a1 + 18) / 2 : (a0 + a1 - 18) / 2, cy, cross, K.red, 14);
  }

  // ───────── 說明句、圖例、進度條 ─────────
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1) text(ctx, ls[0], W / 2, (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function drawLegend(ctx, al, withLi) {
    if (al <= 0.01) return;
    const items = [[tr('藍球 e⁻＝電子（只走外電路）', 'Blue ball e⁻ = electron (outer circuit only)'), 'b']];
    if (withLi) items.push([tr('橘 Li⁺＝鋰離子（只在電池內部）', 'Orange Li⁺ = lithium ion (inside only)'), 'i']);
    const z = 22, gapIcon = 40, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    const rows = tot <= maxW ? [items.map((_, k) => k)] : items.map((_, k) => [k]);
    const ys = rows.length === 1 ? [574] : [562, 588];
    rows.forEach((rw, r) => {
      const tw = rw.reduce((a, k) => a + wid[k], 0) + gapItem * (rw.length - 1);
      let x = W / 2 - tw / 2;
      rw.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        ctx.save(); ctx.globalAlpha = al;
        if (kind === 'b') ball(ctx, x + 14, y, 7, 1);
        else { ctx.fillStyle = K.pos; rrect(ctx, x + 2, y - 8, 26, 16, 8); ctx.fill(); }
        ctx.restore();
        text(ctx, s, x + gapIcon, y, K.white, z, 'left', al);
        x += wid[k] + gapItem;
      });
    });
  }
  function drawCaption(ctx, cap) {
    const z = fitSize(ctx, cap, 950, 26);
    const ls = wrap(ctx, cap, 950, z);
    text(ctx, ls[0], W / 2, 58, K.yellow, z);
  }
  function drawProgress(ctx, t) {
    if (window.AnimBar && typeof window.AnimBar.draw === 'function') { window.AnimBar.draw(ctx, W, STARTS, TOTAL, t); return; }
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = K.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.restore();
  }
  function equation(ctx, s, cx, y, maxW, color, al, z0) {
    const z = fitSize(ctx, s, maxW, z0 || 26, true);
    text(ctx, s, cx, y, color, z, 'center', al, true);
  }
  function energyText(ctx, s, cx, cy, maxW, color, al) {
    if (al <= 0.01) return;
    blockC(ctx, s, cx, cy, maxW, color, 24, al);
  }

  // ───────── 各步畫面 ─────────
  function dischargePanel(ctx, n, S, al, tl, i) {   // n＝0 左（一次）、1 右（二次）
    const cx = n ? 750 : 250, A = t0 => (i === 0 ? ease((tl - t0) / 0.5) : 1) * al;
    text(ctx, n ? tr('二次電池', 'Secondary battery') : tr('一次電池', 'Primary battery'), cx, 110, K.white, 28, 'center', A(0.3 + n * 0.3));
    const wk = i === 0 ? ease((tl - 1.2 - n * 0.2) / 1.0) : 1;
    wireLine(ctx, partial(loopPts(cx), wk), al);
    lamp(ctx, cx, PB.wy, S.lamp[n], A(1.4 + n * 0.2));
    flowE(ctx, LOOPS[n], S.d[n], SP1, al);
    battery(ctx, cx - PB.hw, PB.y0, cx + PB.hw, PB.y1, n ? 'pack' : 'cyl', S.level[n], A(0.5 + n * 0.3), { signsIn: true });
    const name = n ? tr('鉛蓄、鋰離子、鎳氫', 'Lead-acid, Li-ion, Ni-MH') : tr('碳鋅、鹼性', 'Carbon-zinc, alkaline');
    text(ctx, name, cx, 425, n ? K.green : K.muted, fitSize(ctx, name, 2 * PB.wx + 60, 24), 'center', A(0.8 + n * 0.3));
    return A;
  }

  function drawScene(ctx, i, tl, T) {
    const S = state(i, tl);
    const a = t0 => ease((tl - t0) / 0.5);
    if (i === 0) {
      [0, 1].forEach(n => {
        dischargePanel(ctx, n, S, 1, tl, i);
        energyText(ctx, tr('化學能 → 電能', 'chemical energy → electrical energy'), n ? 750 : 250, 255, 2 * PB.wx - 40, K.white, a(3.6 + n * 0.4));
      });
      // 兩欄中間的分隔線
      ctx.save(); ctx.globalAlpha = a(0.3) * 0.5; ctx.strokeStyle = K.dim; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(500, 96); ctx.lineTo(500, 450); ctx.stroke(); ctx.restore();
    }
    if (i === 1) {
      dischargePanel(ctx, 0, S, 1, tl, i);
      const m = ease((tl - 4.6) / 0.6);
      energyText(ctx, tr('化學能 → 電能', 'chemical energy → electrical energy'), 250, 255, 2 * PB.wx - 40, K.white, swapOut(m) * (1 - 0.5 * (1 - S.flow)));
      energyText(ctx, tr('反應物用完了', 'reactants used up'), 250, 255, 2 * PB.wx - 40, K.red, swapIn(m));
      text(ctx, tr('淺綠條＝反應物剩多少', 'Light-green bar = reactants left'), 250, 460, K.stuff, 22, 'center', a(0.8));
      // 右：一次電池的反應卡片
      card(ctx, a(0.6));
      text(ctx, tr('一次電池的反應', 'Reaction in a primary battery'), CCX, 128, K.white, fitSize(ctx, tr('一次電池的反應', 'Reaction in a primary battery'), 340, 26), 'center', a(0.8));
      const R = tr('反應物', 'Reactants'), P = tr('生成物', 'Products');
      wordArrow(ctx, R, P, 205, 24, K.white, a(1.2), false, 0, K.green);
      const okS = tr('放電：只往這個方向', 'Discharge: this way only');
      const ow = textW(ctx, okS, 22) + 34;
      mark(ctx, true, CCX - ow / 2 + 12, 250, a(1.8), K.green); text(ctx, okS, CCX - ow / 2 + 34, 250, K.green, 22, 'left', a(1.8));
      wordArrow(ctx, R, P, 335, 24, K.white, a(5.2), true, a(5.9), K.red);
      const noS = tr('不能倒回去', 'It cannot go back');
      const nw = textW(ctx, noS, 22) + 34;
      mark(ctx, false, CCX - nw / 2 + 12, 380, a(5.9), K.red); text(ctx, noS, CCX - nw / 2 + 34, 380, K.red, 22, 'left', a(5.9));
      blockC(ctx, tr('用完就要換新的', 'Used up = replace it'), CCX, 440, 330, K.muted, 22, a(6.6));
    }
    if (i === 2 || i === 3) {
      const prim = i === 3;
      const wk = ease((tl - (prim ? 0.7 : 1.0)) / 1.0);
      // 左半：電源＋電池
      if (prim) battery(ctx, BX0, BT0, BX1, BT1, 'cyl', 0, a(0.1), { pad: 70, hot: ease((tl - 3.0) / 0.5) * (0.75 + 0.25 * Math.sin(T * 6)) });
      else liCell(ctx, a(0.1));
      text(ctx, '−', BX0 - 14, BCY + 28, K.electron, 28, 'center', a(0.3), true);
      text(ctx, '＋', BX1 + 26, BCY + 28, K.pos, 26, 'center', a(0.3), true);
      if (!prim) {
        text(ctx, tr('負極', 'Negative'), BX0 + 46, 225, K.electron, 22, 'center', a(0.4));
        text(ctx, tr('正極', 'Positive'), BX1 - 46, 225, K.pos, 22, 'center', a(0.4));
        text(ctx, tr('鋰離子電池', 'Li-ion battery'), 300, 225, K.white, 24, 'center', a(0.3));
      } else {
        const s = tr('一次電池（用完了）', 'Primary battery (used up)');
        text(ctx, s, 300, 225, K.white, fitSize(ctx, s, 400, 24), 'center', a(0.3));
      }
      charger(ctx, a(0.5), S.flow);
      wireLine(ctx, partial(NEG_WIRE, wk), 1);
      wireLine(ctx, partial(POS_WIRE, wk), 1);
      text(ctx, tr('負接負', '− to −'), CHX - CHW / 2 - 32, CHY - 26, K.electron, 22, 'right', a(1.9));
      text(ctx, tr('正接正', '+ to +'), CHX + CHW / 2 + 32, CHY - 26, K.pos, 22, 'left', a(2.0));
      flowE(ctx, PN, S.d3, SP3, prim ? 1 - ease((tl - 3.3) / 0.5) : 1);
      flowE(ctx, PP, S.d3, SP3, prim ? 1 - ease((tl - 3.3) / 0.5) : 1);
      if (!prim) {
        // Li⁺：放電後在正極這邊，充電時一列一列游回負極
        LI_ROWS.forEach((y, r) => {
          const m = S.liRows[r];
          [0, 1].forEach(c => {
            const jx = 2 * Math.sin(T * 1.7 + r * 1.3 + c * 2.1) * (1 - Math.abs(2 * m - 1));
            liPill(ctx, lerp(LI_POS[c], LI_NEG[c], m) + jx, y + 1.5 * Math.sin(T * 2.3 + r + c), a(0.6));
          });
        });
        const m = ease((tl - 2.2) / 0.5);
        arrow(ctx, 190, 405, 410, 405, K.muted, a(0.8) * swapOut(m), 4);
        text(ctx, tr('放電時：Li⁺ 從負極游向正極', 'Discharge: Li⁺ moves − → +'), 300, 437, K.muted, 22, 'center', a(0.8) * swapOut(m));
        arrow(ctx, 410, 405, 190, 405, K.pos, swapIn(m), 4, 8);
        text(ctx, tr('充電時：Li⁺ 游回負極', 'Charging: Li⁺ moves back to −'), 300, 437, K.pos, 22, 'center', swapIn(m));
        energyText(ctx, tr('電能 → 化學能', 'electrical → chemical energy'), 300, 470, 500, K.white, a(3.2));
        // 右：鉛蓄電池反應式
        card(ctx, a(4.8));
        text(ctx, tr('鉛蓄電池', 'Lead-acid battery'), CCX, 126, K.white, 26, 'center', a(5.0));
        equation(ctx, 'Pb ＋ PbO₂ ＋ 2H₂SO₄', CCX, 190, 340, K.white, a(5.3));
        equation(ctx, '2PbSO₄ ＋ 2H₂O', CCX, 372, 340, K.white, a(5.3));
        const hot = ease((tl - 6.2) / 0.5);
        arrow(ctx, CCX - 22, 222, CCX - 22, 340, K.muted, a(5.6), 5);
        text(ctx, tr('放電', 'Discharge'), CCX - 44, 281, K.muted, 22, 'right', a(5.6));
        arrow(ctx, CCX + 22, 340, CCX + 22, 222, K.electron, a(6.0), 5, 12 * hot);
        text(ctx, tr('充電', 'Charge'), CCX + 44, 281, K.electron, 22, 'left', a(6.0));
        blockC(ctx, tr('放電與充電反應方向相反', 'Charging runs the reaction in reverse'), CCX, 430, 330, K.green, 22, a(6.6));
      } else {
        bigX(ctx, 300, BCY, 112, ease((tl - 3.0) / 0.7), 1);
        // 右：警示卡
        card(ctx, a(3.6), K.red);
        warnIcon(ctx, CCX, 158, 40, K.red, a(3.8));
        const s1 = tr('不可嘗試充電', 'Never try to charge it');
        text(ctx, s1, CCX, 232, K.red, fitSize(ctx, s1, 340, 30), 'center', a(4.2));
        wordArrow(ctx, tr('生成物', 'Products'), tr('反應物', 'Reactants'), 290, 22, K.white, a(4.8), false, a(5.2), K.muted);
        blockC(ctx, tr('硬接電源也推不回去，\n只會有危險', 'Forcing it won’t turn it back — it is only dangerous'), CCX, 345, 330, K.white, 22, a(5.2));
        blockC(ctx, tr('任何電池都不可\n拆解、短路、加熱', 'Never open, short-circuit or heat any battery'), CCX, 422, 330, K.muted, 22, a(6.0));
      }
    }
    if (i === 4) {
      const X0 = 30, XC1 = 250, XC2 = 610, X1 = 970, HY = 116, RH = 76, RY0 = 144;
      const rows = [
        [tr('例子', 'Examples'), tr('碳鋅、鹼性', 'Carbon-zinc, alkaline'), tr('鉛蓄、鋰離子、鎳氫', 'Lead-acid, Li-ion, Ni-MH'), 0, 0],
        [tr('能充電嗎？', 'Rechargeable?'), tr('不可充電', 'No'), tr('可重複充電', 'Yes, again and again'), -1, 1],
        [tr('放電', 'Discharge'), tr('化學能 → 電能', 'chemical → electrical'), tr('化學能 → 電能', 'chemical → electrical'), 0, 0],
        [tr('充電', 'Charge'), tr('不可嘗試充電', 'Never try'), tr('電能 → 化學能\n（正接正、負接負）', 'electrical → chemical\n(+ to +, − to −)'), -1, 0]
      ];
      // 表格框
      ctx.save(); ctx.globalAlpha = a(0.2);
      ctx.fillStyle = 'rgba(18,51,41,0.85)'; rrect(ctx, X0, HY - 26, X1 - X0, RY0 - HY + 26 + RH * rows.length, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(159,179,170,0.55)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(XC1, HY - 26); ctx.lineTo(XC1, RY0 + RH * rows.length); ctx.moveTo(XC2, HY - 26); ctx.lineTo(XC2, RY0 + RH * rows.length); ctx.stroke();
      for (let r = 0; r <= rows.length - 1; r++) { ctx.beginPath(); ctx.moveTo(X0, RY0 + RH * r); ctx.lineTo(X1, RY0 + RH * r); ctx.stroke(); }
      ctx.restore();
      text(ctx, tr('一次電池', 'Primary'), (XC1 + XC2) / 2, HY + 1, K.white, 28, 'center', a(0.4));
      text(ctx, tr('二次電池', 'Secondary'), (XC2 + X1) / 2, HY + 1, K.white, 28, 'center', a(0.4));
      rows.forEach((rw, r) => {
        const cy = RY0 + RH * r + RH / 2, al = a(1.0 + r * 1.0);
        blockC(ctx, rw[0], (X0 + XC1) / 2, cy, XC1 - X0 - 24, K.muted, 24, al);
        [[rw[1], rw[3], XC1, XC2], [rw[2], rw[4], XC2, X1]].forEach(([s, mk, xa, xb]) => {
          const color = mk < 0 ? K.red : mk > 0 ? K.green : K.white;
          if (mk) {
            const tw = textW(ctx, s, 24), x0 = (xa + xb) / 2 - (tw + 36) / 2;
            mark(ctx, mk > 0, x0 + 12, cy, al, color);
            text(ctx, s, x0 + 36, cy, color, 24, 'left', al);
          } else blockC(ctx, s, (xa + xb) / 2, cy, xb - xa - 30, color, 24, al);
        });
      });
    }
    // 下方一句
    const botAt = [5.4, 6.2, 7.0, 5.8, 5.6][i];
    bottomLines(ctx, tr(STEPS[i].bot[0], STEPS[i].bot[1]), K.yellow, a(botAt));
    if (i < 4) drawLegend(ctx, i === 0 ? a(2.6) : 1, i === 2);
    return S;
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const P = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true, lastS = null;
  const canvas = () => document.getElementById('typesAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('typesAnimResult'); if (el) el.innerHTML = html;
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
    const r = document.getElementById('steps-types');
    if (r) r.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === P.step));
  }
  function jumpTo(k) {
    if (!P.on) return;
    P.t = STARTS[k] + 1e-4; P.step = -1; P.last = 0; P.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const r = document.getElementById('steps-types'); if (!r) return;
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

  window.GbAnim.types = {
    activate() {
      stop();
      P.on = true; P.t = 0; P.step = -1; P.last = 0; P.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      P.on = false; P.step = -1; lastResult = '';
      const r = document.getElementById('steps-types'); if (r) r.innerHTML = '';
      const o = document.getElementById('typesAnimResult'); if (o) o.innerHTML = '';
    },
    relang() {
      if (!P.on) return;
      const k = stepAt(P.t);
      lastResult = ''; buildButtons(); P.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (P.on) start(); },
    _frameAt(t) { P.t = clamp(t, 0, TOTAL - 1e-3); P.step = -1; render(); return TOTAL; },
    _info() { return { types: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() {
      const S = lastS;
      return { scene: P.on ? 'types' : null, t: P.t, step: P.step, running: !!P.raf,
        lamp: S ? S.lamp.map(v => +v.toFixed(3)) : [0, 0], level: S ? S.level.map(v => +v.toFixed(3)) : [1, 1],
        flow: S ? +S.flow.toFixed(3) : 0, liBack: S ? +S.li.toFixed(3) : 0 };
    }
  };
})();
