/* galvanic_batteries_4_volta_1106_v1.js — 科學史「伏打電池」分頁動畫（#voltaAnimCanvas，邏輯 1000×600）
 *
 * 契約：window.GbAnim.volta = { activate(), deactivate(), relang(), setStepStop(bool), _info(), _state(), _frameAt(t) }
 * 單一場景 'volta'。畫布不綁事件；唯一控制是 #steps-volta 的 5 個步驟鈕；結果框 #voltaAnimResult。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰舊程式的 C、label、line…）。
 * 畫面是「場景時間 t 的純函式」：金屬片位置、滴管水滴、離子擺動、電子位置都只由 t 算出。
 * 畫風、金屬用色、字級與版面沿用同課的 galvanic_batteries_4_galvani_1106_v1.js。
 *
 * ── 版面 ────────────────────────────────────────────────────────────
 *   y≈58 本步一句說明（黃）。電堆中心 x=300、寬 200，底座上緣 y=462；每組由下往上：Zn 12px、濕布 14px、Cu 12px（共 38px），
 *   最多 6 組 → 最上面 Cu 的頂面在 y=234。電堆最下面是 Zn 端（右側有接片）、最上面是 Cu 端（舊畫布的接法）。
 *   左欄 x≤190：組數、Zn 端／Cu 端標註；右欄：第 2 步放大框 x 440–980，第 3 步說明 x≥480，
 *   第 4 步總電壓長條 x 540–600 與說明 x≥680，第 5 步外導線 x=720（小燈泡在它正中央）與說明 x≥770。
 *   下方 y≈506/536：本步一句；y≈574（或 560/586 兩列）：圖例。
 * ── 科學表示 ────────────────────────────────────────────────────────
 *   藍球＝電子，只畫在外導線與燈絲裡（從 Zn 端出發 → 外導線 → 小燈泡 → Cu 端），不進電堆、不進濕布。
 *   Na⁺（橘）、Cl⁻（紫）只在濕布裡小幅擺動，不進導線。不寫化學反應式、不寫電壓數值、不寫年份數字。
 *   第 4 步的長條只表示「相對大小」：每多一組長條加高一段（與電堆同高），不標數值。
 *
 * ── 步驟表，共 42 s ─────────────────────────────────────────────
 *   1 不用蛙腿   8 s  蛙腿縮圖打叉；鋅片、布片、銅片排一列，滴管自己滴食鹽水，布片變濕
 *   2 放大一組   8 s  三片飛到底座疊成一組；右邊放大框：Cu／濕布（Na⁺、Cl⁻ 在動）／Zn
 *   3 重複堆疊   9 s  一組一組落下疊上去，疊到 6 組
 *   4 總電壓     9 s  從 1 組重新疊到 6 組，旁邊「總電壓」長條跟著升高（相對長度）
 *   5 持續電流   8 s  外導線＋小燈泡；電子從 Zn 端經外電路走到 Cu 端，燈泡一直亮
 * 播放規則（AGENTS 10.6，2026-11-05）：activate() 播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝連播到底再停（老師講解），到底時呼叫一次 GbAnim.ctl.onEnd()。
 * GbAnim.ctl.paused 為真時時間凍住。子分頁被隱藏（canvas offsetWidth＝0）時不跑 rAF，每 250ms 檢查一次。
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
    na: '#ff8040', cl: '#c691ff', ink: '#0c1e19',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    zn: '#b9c6cc', znHi: '#e4ecef', znLo: '#7b8a91',
    skin: '#6f9f55', skinHi: '#93c172', skinLo: '#3c6630', spot: '#3f5f2c', cut: '#e6a5a0',
    red: '#ff6b5a', wire: '#c9d3d6', stand: '#3b4d46', standHi: '#56695f'
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const frac = x => x - Math.floor(x);
  function mixHex(a, b, k) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
  }

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
  // 置中於 y 的多行文字
  function para(ctx, s, x, y, maxW, color, size, align, alpha, lh) {
    const ls = wrap(ctx, s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(ctx, l, x, y + (k - (ls.length - 1) / 2) * h, color, size, align, alpha));
    return ls.length;
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
  const PX = 300, PW = 200, BY = 462;                 // 電堆中心、寬、底座上緣
  const HZ = 12, HC = 14, HU = 12, G = HZ + HC + HU;  // 每組：Zn、濕布、Cu
  const NMAX = 6, TOPC = BY - NMAX * G;               // 6 組時最上面 Cu 頂面中心 y=234
  const WX = 720, TW = 150;                           // 外導線：右幹線 x、上導線 y
  const TAB = { x0: PX + 96, x1: PX + 126, y: BY - HZ / 2 };   // 最下面 Zn 片的接片
  const BULB = { x: WX, y: (TAB.y + TW) / 2, r: 28 };          // 小燈泡在右幹線正中央
  const E_PATH = mkPath([{ x: TAB.x1, y: TAB.y }, { x: WX, y: TAB.y }, { x: WX, y: TW }, { x: PX, y: TW }, { x: PX, y: TOPC }]);
  // 第 1 步排成一列的位置 → 第 2 步疊成一組的位置
  const ROW = { zn: { cx: 400, y: 300, w: 150, h: 18 }, cloth: { cx: 620, y: 298, w: 150, h: 22 }, cu: { cx: 840, y: 300, w: 150, h: 18 } };
  const G0 = { zn: { cx: PX, y: BY - HZ, w: PW, h: HZ }, cloth: { cx: PX, y: BY - HZ - HC, w: PW, h: HC }, cu: { cx: PX, y: BY - G, w: PW, h: HU } };
  // 第 2 步放大框
  const ZP = { x: 440, y: 92, w: 540, h: 364 }, ZX = 610, ZW = 260;
  const ZS = { cu: { y: 164, h: 40 }, cloth: { y: 204, h: 140 }, zn: { y: 344, h: 40 } };
  const ZIONS = [[530, 248, 0], [610, 248, 1], [690, 248, 0], [530, 304, 1], [610, 304, 0], [690, 304, 1]];   // x, y, 0=Na⁺ 1=Cl⁻
  // 第 4 步長條
  const MX = 540, MW = 60;

  // ───────── 步驟 ─────────
  const STEPS = [
    { dur: 8, b: ['不用蛙腿', 'No frog leg'],
      cap: ['不用蛙腿：只用兩種金屬，加上食鹽水浸濕的布片', 'No frog leg: just two metals and a brine-soaked cloth'],
      res: ['十九世紀初，伏打做出不用蛙腿的電源：只用鋅片（Zn）、銅片（Cu）兩種金屬，和食鹽水浸濕的布片。',
        'Early 19th century: Volta built a power source with no frog leg — just two metals, zinc (Zn) and copper (Cu), and a brine-soaked cloth.'] },
    { dur: 8, b: ['放大一組', 'One set'],
      cap: ['放大看一組：鋅片、濕布、銅片', 'Zoom in on one set: zinc, wet cloth, copper'],
      res: ['一組＝鋅片＋食鹽水濕布＋銅片。布片吸住食鹽水，形成可導電的中間層；食鹽水裡的離子在布片裡移動。',
        'One set = zinc + brine-soaked cloth + copper. The cloth holds the brine, forming a conductive middle layer; ions in the brine move within the cloth.'] },
    { dur: 9, b: ['重複堆疊', 'Stacking'],
      cap: ['重複堆疊：一組一組往上疊，電堆越來越高', 'Stack them: set after set, the pile grows taller'],
      res: ['鋅片、濕布、銅片交替堆疊，一組一組疊上去，就是伏打電堆。',
        'Zinc, wet cloth and copper stacked alternately, set after set — that is the voltaic pile.'] },
    { dur: 9, b: ['總電壓', 'Total voltage'],
      cap: ['金屬組數增加：總電壓隨堆疊增加', 'More metal sets: the total voltage increases with stacking'],
      res: ['金屬組數增加，總電壓隨堆疊增加。旁邊的長條只表示相對大小，不代表數值。',
        'More metal sets: the total voltage increases with stacking. The bar shows relative size only, not a value.'] },
    { dur: 8, b: ['持續電流', 'Steady current'],
      cap: ['接上外導線：伏打電堆能持續供應電流', 'Connect a wire: the pile supplies a steady current'],
      res: ['接上外導線與小燈泡：電子從 Zn 端出發，經外導線走到 Cu 端。伏打電堆不用蛙腿，就能穩定、持續供應電流。',
        'Connect a wire and a small bulb: electrons leave the Zn end and travel through the outer wire to the Cu end. With no frog leg, the voltaic pile supplies a steady, lasting current.'] }
  ];
  const STARTS = []; let TOTAL = 0; STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.dur; });

  // ───────── 依時間算出狀態（純函式） ─────────
  const D3 = g => 1.0 + (g - 1) * 1.0;     // 第 3 步：第 g 組（g=1..5）落定的步內時間
  const D4 = g => 1.2 + (g - 1) * 1.2;     // 第 4 步
  const FALL = 0.55;
  // 第 g 組的落下位移（0＝已落定；null＝還沒出現）
  function dropOf(land, tl) {
    const u = tl - (land - FALL);
    if (u < 0) return null;
    const k = clamp(u / FALL, 0, 1);
    return { dy: -130 * (1 - k * k), a: clamp(u / 0.25, 0, 1) };
  }
  function landed(i, tl) {                 // 已落定的組數（含第 0 組）
    if (i < 2) return 1;
    if (i === 4) return NMAX;
    const f = i === 2 ? D3 : D4; let n = 1;
    for (let g = 1; g < NMAX; g++) if (tl >= f(g)) n++;
    return n;
  }

  // ───────── 圖形：金屬片／布片（側看的扁圓柱） ─────────
  function slab(ctx, cx, y, w, h, kind, alpha, wet) {
    if (alpha <= 0.01) return;
    const ry = clamp(w * 0.045, 5, 12), x0 = cx - w / 2, x1 = cx + w / 2;
    let hi, mid, lo, top;
    if (kind === 'zn') { hi = K.znHi; mid = K.zn; lo = K.znLo; top = '#d3dde1'; }
    else if (kind === 'cu') { hi = K.cuHi; mid = K.cu; lo = K.cuLo; top = '#dd9a62'; }
    else {
      const k = wet === undefined ? 1 : wet;
      hi = mixHex('#efe4c8', '#7d9aa2', k); mid = mixHex('#d6c8a6', '#56747c', k); lo = mixHex('#a99a78', '#3a535a', k); top = mixHex('#e4d8b8', '#6d8a92', k);
    }
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, lo); g.addColorStop(0.28, hi); g.addColorStop(0.62, mid); g.addColorStop(1, lo);
    ctx.beginPath();
    ctx.moveTo(x0, y); ctx.lineTo(x0, y + h);
    ctx.ellipse(cx, y + h, w / 2, ry, 0, Math.PI, 0, true);
    ctx.lineTo(x1, y);
    ctx.ellipse(cx, y, w / 2, ry, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, y, w / 2, ry, 0, 0, TAU);
    ctx.fillStyle = top; ctx.fill(); ctx.stroke();
    if (kind === 'cloth') {                                     // 布紋＋濕亮光
      ctx.strokeStyle = 'rgba(60,70,60,0.28)'; ctx.lineWidth = 1;
      for (let k = 1; k < 8; k++) { const xx = x0 + w * k / 8; ctx.beginPath(); ctx.moveTo(xx, y + 2); ctx.lineTo(xx, y + h + ry * 0.6); ctx.stroke(); }
      if ((wet === undefined ? 1 : wet) > 0.3) {
        ctx.strokeStyle = `rgba(220,248,255,${0.5 * (wet === undefined ? 1 : wet)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx - w * 0.12, y, w * 0.22, ry * 0.4, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
      }
    } else {                                                    // 金屬高光
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx - w * 0.1, y, w * 0.3, ry * 0.5, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    }
    ctx.restore();
  }
  function stand(ctx, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createLinearGradient(0, BY, 0, BY + 16);
    g.addColorStop(0, K.standHi); g.addColorStop(1, K.stand);
    ctx.fillStyle = g; rrect(ctx, PX - 140, BY + 2, 280, 14, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(159,179,170,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  // 電堆濕布裡的離子（小點；顏色＋圖例辨認）
  function pileIons(ctx, yMid, t, seed, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let k = 0; k < 5; k++) {
      const x = PX - 72 + k * 36 + 5 * Math.sin(t * 2.3 + k * 1.7 + seed * 2.1);
      ctx.fillStyle = (k + seed) % 2 ? K.cl : K.na;
      ctx.beginPath(); ctx.arc(x, yMid + 1.5 * Math.sin(t * 3.1 + k + seed), 3.5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function group(ctx, g, dy, alpha, t, ions) {
    const b = BY - g * G + dy;
    slab(ctx, PX, b - HZ, PW, HZ, 'zn', alpha);
    slab(ctx, PX, b - HZ - HC, PW, HC, 'cloth', alpha, 1);
    if (ions) pileIons(ctx, b - HZ - HC / 2 + 3, t, g, alpha);
    slab(ctx, PX, b - G, PW, HU, 'cu', alpha);
  }
  function pile(ctx, i, tl, t) {
    const f = i === 2 ? D3 : D4;
    group(ctx, 0, 0, 1, t, true);
    for (let g = 1; g < NMAX; g++) {
      if (i === 4) { group(ctx, g, 0, 1, t, true); continue; }
      const d = dropOf(f(g), tl);
      if (d) group(ctx, g, d.dy, d.a, t, true);
    }
  }

  // ───────── 圖形：蛙腿縮圖（同 galvani 檔的畫法，不動） ─────────
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
  const FT = { x: 30, y: 112, w: 200, h: 118 };     // 蛙腿縮圖框
  function frogThumb(ctx, al, crossK) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.panel; ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
    rrect(ctx, FT.x, FT.y, FT.w, FT.h, 14); ctx.fill(); ctx.stroke();
    ctx.save(); rrect(ctx, FT.x + 4, FT.y + 4, FT.w - 8, FT.h - 8, 12); ctx.clip();
    ctx.translate(FT.x + FT.w / 2, FT.y + FT.h / 2); ctx.scale(0.42, 0.42); ctx.translate(-672, -415);
    leg(ctx); ctx.restore();
    if (crossK > 0.01) {                               // 紅色叉（兩筆依序畫出）
      ctx.strokeStyle = K.red; ctx.lineWidth = 7; ctx.lineCap = 'round';
      const p = (x0, y0, x1, y1, k) => { if (k <= 0) return; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); ctx.stroke(); };
      p(FT.x + 26, FT.y + 18, FT.x + FT.w - 26, FT.y + FT.h - 18, clamp(crossK * 2, 0, 1));
      p(FT.x + FT.w - 26, FT.y + 18, FT.x + 26, FT.y + FT.h - 18, clamp(crossK * 2 - 1, 0, 1));
    }
    ctx.restore();
  }

  // ───────── 圖形：滴管、電子、燈泡、離子 ─────────
  function dropper(ctx, x, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = '#5b3b6b'; rrect(ctx, x - 13, 124, 26, 34, 12); ctx.fill();          // 橡皮頭
    ctx.fillStyle = 'rgba(210,240,250,0.18)'; ctx.strokeStyle = 'rgba(220,240,245,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 9, 156); ctx.lineTo(x - 9, 214); ctx.lineTo(x - 3, 236); ctx.lineTo(x + 3, 236); ctx.lineTo(x + 9, 214); ctx.lineTo(x + 9, 156); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,236,248,0.55)'; ctx.fillRect(x - 7, 186, 14, 28);          // 管內的食鹽水
    ctx.restore();
  }
  function drop(ctx, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = 'rgba(214,242,252,0.95)';
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 6, y, x + 5, y + 3); ctx.arc(x, y + 3, 5, 0, Math.PI); ctx.quadraticCurveTo(x - 6, y, x, y - 9); ctx.fill();
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
  function electrons(ctx, t, tc, alpha) {
    if (alpha <= 0.01) return;
    const sp = 34, d = 70 * Math.max(0, t - tc), L = E_PATH.L;
    for (let k = -1; k * sp < L + sp; k++) {
      const s = k * sp + (d % sp);
      if (s < 0 || s > L) continue;
      const p = at(E_PATH, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1);
      ball(ctx, p.x, p.y, 6, alpha * fade);
    }
  }
  function wirePartial(ctx, len, alpha) {           // 外導線：沿路徑畫到 len
    if (alpha <= 0.01 || len <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const draw = (w, c) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(E_PATH.pts[0].x, E_PATH.pts[0].y);
      for (const q of E_PATH.seg) {
        if (len >= q.s0 + q.len) ctx.lineTo(q.b.x, q.b.y);
        else { const p = at(E_PATH, len); ctx.lineTo(p.x, p.y); break; }
      }
      ctx.stroke();
    };
    draw(8, 'rgba(12,30,25,0.8)'); draw(5, K.wire);
    ctx.restore();
  }
  function bulb(ctx, lit, t) {
    const { x, y, r } = BULB;
    ctx.save();
    if (lit > 0.01) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, r * 3);
      g.addColorStop(0, `rgba(255,240,190,${0.75 * lit})`); g.addColorStop(0.4, `rgba(255,226,140,${0.3 * lit})`); g.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = lit > 0.01 ? `rgba(255,244,205,${0.12 + 0.55 * lit})` : 'rgba(210,230,235,0.12)';
    ctx.strokeStyle = 'rgba(230,240,240,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = lit > 0.01 ? mixHex('#8a7a60', '#fff3c4', lit) : '#8a7a60'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + 12);                     // 燈絲：下接腳 → 鋸齒 → 上接腳
    for (let k = 0; k <= 6; k++) ctx.lineTo(x + (k % 2 ? 9 : -9), y + 12 - k * 4);
    ctx.lineTo(x, y - 12); ctx.lineTo(x, y - r); ctx.stroke();
    ctx.restore();
  }
  function ionPill(ctx, x, y, cl, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = cl ? K.cl : K.na; ctx.shadowColor = cl ? K.cl : K.na; ctx.shadowBlur = 8;
    rrect(ctx, x - 29, y - 16, 58, 32, 16); ctx.fill(); ctx.restore();
    text(ctx, cl ? 'Cl⁻' : 'Na⁺', x, y + 1, K.ink, 22, 'center', al, true);
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

  // ───────── 標註 ─────────
  const BY1 = 506, BY2 = 536;
  function bottomLines(ctx, s, color, alpha, oneLine) {
    const ls = wrap(ctx, s, 940, 24);
    if (ls.length === 1 || oneLine) text(ctx, ls[0], W / 2, oneLine ? 516 : (BY1 + BY2) / 2, color, 24, 'center', alpha);
    else ls.slice(0, 2).forEach((l, k) => text(ctx, l, W / 2, k ? BY2 : BY1, color, 24, 'center', alpha));
  }
  function counter(ctx, n, al) {
    text(ctx, tr('組數', 'Count'), 105, 282, K.muted, 24, 'center', al);
    text(ctx, tr(`${n} 組`, n === 1 ? '1 set' : `${n} sets`), 105, 318, K.white, 28, 'center', al);
  }

  // ───────── 各步畫面 ─────────
  function scene1(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    frogThumb(ctx, a(0.2), clamp((tl - 0.9) / 0.8, 0, 1));
    text(ctx, tr('不用蛙腿', 'No frog leg'), FT.x + FT.w / 2, 262, K.white, 24, 'center', a(1.4));
    const wet = ease((tl - 3.2) / 2.2);
    slab(ctx, ROW.zn.cx, ROW.zn.y, ROW.zn.w, ROW.zn.h, 'zn', a(1.6));
    slab(ctx, ROW.cloth.cx, ROW.cloth.y, ROW.cloth.w, ROW.cloth.h, 'cloth', a(2.0), wet);
    slab(ctx, ROW.cu.cx, ROW.cu.y, ROW.cu.w, ROW.cu.h, 'cu', a(2.4));
    text(ctx, '＋', 510, 312, K.white, 28, 'center', a(2.0));
    text(ctx, '＋', 730, 312, K.white, 28, 'center', a(2.4));
    // 滴管自己滴食鹽水
    const dA = ease((tl - 2.6) / 0.4) * (1 - ease((tl - 5.6) / 0.5));
    dropper(ctx, ROW.cloth.cx, dA);
    text(ctx, tr('食鹽水', 'Brine'), ROW.cloth.cx + 28, 182, K.white, 24, 'left', dA);
    for (let k = 0; k < 3; k++) {
      const u = (tl - (3.0 + 0.8 * k)) / 0.35;
      if (u >= 0 && u <= 1) drop(ctx, ROW.cloth.cx, lerp(244, 292, u * u), 1);
    }
    // 標籤（布片 → 濕布：先淡出再淡入，不重疊）
    para(ctx, tr('鋅片 Zn', 'Zinc (Zn)'), ROW.zn.cx, 372, 190, K.znHi, 24, 'center', a(1.8));
    para(ctx, tr('銅片 Cu', 'Copper (Cu)'), ROW.cu.cx, 372, 190, K.cuHi, 24, 'center', a(2.6));
    const dryA = a(2.2) * (1 - clamp((tl - 4.6) / 0.3, 0, 1));
    const wetA = clamp((tl - 4.95) / 0.35, 0, 1);
    para(ctx, tr('布片', 'Cloth'), ROW.cloth.cx, 372, 190, K.white, 24, 'center', dryA);
    para(ctx, tr('食鹽水濕布', 'Brine-soaked cloth'), ROW.cloth.cx, 372, 190, K.white, 24, 'center', wetA);
    bottomLines(ctx, tr('兩種金屬（鋅、銅）＋食鹽水浸濕的布片', 'Two metals (zinc, copper) + a brine-soaked cloth'), K.yellow, a(5.6));
  }
  function scene2(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    stand(ctx, a(0.1));
    const mv = (key, t0) => {
      const k = ease((tl - t0) / 0.8), R = ROW[key], P = G0[key];
      return { cx: lerp(R.cx, P.cx, k), y: lerp(R.y, P.y, k) - 60 * Math.sin(Math.PI * k), w: lerp(R.w, P.w, k), h: lerp(R.h, P.h, k) };
    };
    const z = mv('zn', 0.3), c = mv('cloth', 0.7), u = mv('cu', 1.1);
    slab(ctx, z.cx, z.y, z.w, z.h, 'zn', 1);
    slab(ctx, c.cx, c.y, c.w, c.h, 'cloth', 1, 1);
    if (tl > 1.5) pileIons(ctx, BY - HZ - HC / 2 + 3, t, 0, ease((tl - 1.5) / 0.5));
    slab(ctx, u.cx, u.y, u.w, u.h, 'cu', 1);
    // 放大框
    const pA = a(2.1);
    if (pA > 0.01) {
      ctx.save(); ctx.globalAlpha = pA;
      ctx.strokeStyle = K.yellow; ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
      rrect(ctx, PX - PW / 2 - 8, BY - G - 18, PW + 16, G + 30, 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(253,224,71,0.55)';
      ctx.beginPath(); ctx.moveTo(PX + PW / 2 + 8, BY - G - 18); ctx.lineTo(ZP.x, ZP.y + 20);
      ctx.moveTo(PX + PW / 2 + 8, BY + 12); ctx.lineTo(ZP.x, ZP.y + ZP.h - 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = K.panel; ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5;
      rrect(ctx, ZP.x, ZP.y, ZP.w, ZP.h, 16); ctx.fill(); ctx.stroke();
      ctx.restore();
      text(ctx, tr('放大看一組', 'Zoom in: one set'), ZP.x + 24, ZP.y + 30, K.yellow, 26, 'left', pA);
      const sA = a(2.5);
      slab(ctx, ZX, ZS.zn.y, ZW, ZS.zn.h, 'zn', sA);
      slab(ctx, ZX, ZS.cloth.y, ZW, ZS.cloth.h, 'cloth', sA, 1);
      slab(ctx, ZX, ZS.cu.y, ZW, ZS.cu.h, 'cu', sA);
      ZIONS.forEach(([x, y, cl], k) => {
        const ox = 10 * Math.sin(t * 1.9 + k * 1.3), oy = 6 * Math.sin(t * 2.6 + k * 2.1);
        ionPill(ctx, x + ox, y + oy, cl, a(3.4 + 0.12 * k));
      });
      const LX = 770, LW = 196;
      para(ctx, tr('銅片 Cu', 'Copper (Cu)'), LX, ZS.cu.y + ZS.cu.h / 2, LW, K.cuHi, 24, 'left', a(2.8));
      const cy = ZS.cloth.y + ZS.cloth.h / 2;
      let y = block(ctx, tr('濕布', 'Wet cloth'), LX, cy - 30, LW, K.white, 24, 'left', a(3.1));
      block(ctx, tr('（吸住食鹽水）', '(holds brine)'), LX, y + 2, LW, K.muted, 22, 'left', a(3.1));
      para(ctx, tr('鋅片 Zn', 'Zinc (Zn)'), LX, ZS.zn.y + ZS.zn.h / 2, LW, K.znHi, 24, 'left', a(2.8));
    }
    bottomLines(ctx, tr('布片吸住食鹽水，形成可導電的中間層；離子在布片裡移動', 'The cloth holds the brine — a conductive middle layer where ions move'), K.yellow, a(4.6));
  }
  function braceLeft(ctx, y0, y1, al) {
    if (al <= 0.01) return;
    const x = PX - PW / 2 - 12;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 6, y0); ctx.lineTo(x, y0); ctx.lineTo(x, y1); ctx.lineTo(x + 6, y1);
    ctx.moveTo(x, (y0 + y1) / 2); ctx.lineTo(x - 6, (y0 + y1) / 2); ctx.stroke(); ctx.restore();
  }
  function scene3(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    stand(ctx, 1);
    pile(ctx, 2, tl, t);
    braceLeft(ctx, BY - G - 8, BY + 6, a(0.2));
    text(ctx, tr('一組', '1 set'), PX - PW / 2 - 26, BY - G / 2, K.yellow, 24, 'right', a(0.2));
    counter(ctx, landed(2, tl), 1);
    const RX = 480, RW = 480;
    let y = block(ctx, tr('一組＝鋅片＋濕布＋銅片', '1 set = zinc + wet cloth + copper'), RX, 140, RW, K.white, 26, 'left', a(0.4), 36);
    y = block(ctx, tr('鋅、濕布、銅、鋅、濕布、銅……', 'Zn, cloth, Cu, Zn, cloth, Cu…'), RX, y + 12, RW, K.muted, 24, 'left', a(2.0));
    block(ctx, tr('一組一組往上疊', 'Stack set after set'), RX, y + 18, RW, K.green, 28, 'left', a(5.4), 38);
    bottomLines(ctx, tr('交替堆疊起來，就是伏打電堆', 'Stacked alternately, they form the voltaic pile'), K.yellow, a(6.2));
  }
  function scene4(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    stand(ctx, 1);
    pile(ctx, 3, tl, t);
    const n = landed(3, tl);
    counter(ctx, n, 1);
    // 長條：每落定一組，往上長一段（與電堆同高），只表示相對大小
    let hgt = G;
    for (let g = 1; g < NMAX; g++) hgt += G * ease((tl - D4(g)) / 0.4);
    const fA = a(0.3);
    ctx.save(); ctx.globalAlpha = fA;
    ctx.fillStyle = 'rgba(74,222,128,0.08)'; ctx.strokeStyle = 'rgba(74,222,128,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    rrect(ctx, MX, TOPC, MW, BY - TOPC, 6); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    const g = ctx.createLinearGradient(0, BY - hgt, 0, BY);
    g.addColorStop(0, '#86efac'); g.addColorStop(1, '#22a356');
    ctx.fillStyle = g; ctx.shadowColor = K.green; ctx.shadowBlur = 12;
    rrect(ctx, MX + 4, BY - hgt, MW - 8, hgt, 5); ctx.fill();
    ctx.restore();
    // 長條旁的對應虛線：電堆頂端 ↔ 長條頂端
    ctx.save(); ctx.globalAlpha = fA * 0.8; ctx.strokeStyle = K.muted; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(PX + PW / 2 + 6, BY - hgt); ctx.lineTo(MX - 6, BY - hgt); ctx.stroke(); ctx.restore();
    text(ctx, tr('總電壓', 'Total voltage'), MX + MW / 2, TOPC - 30, K.green, 26, 'center', fA);
    const RX = 680, RW = 290;
    let y = block(ctx, tr('疊的組數越多', 'The more sets stacked'), RX, 150, RW, K.white, 26, 'left', a(0.6), 36);
    y = block(ctx, tr('總電壓越大', 'the higher the total voltage'), RX, y + 4, RW, K.green, 26, 'left', a(1.4), 36);
    block(ctx, tr('長條只表示相對大小', 'The bar shows relative size only'), RX, y + 24, RW, K.muted, 22, 'left', a(2.2), 30);
    bottomLines(ctx, tr('金屬組數增加 → 總電壓隨堆疊增加', 'More metal sets → total voltage increases with stacking'), K.yellow, a(6.7));
  }
  function scene5(ctx, tl, t) {
    const a = t0 => ease((tl - t0) / 0.6);
    const tc = STARTS[4] + 1.7, lit = ease((tl - 1.9) / 0.5);
    stand(ctx, 1);
    pile(ctx, 4, tl, t);
    // Zn 端接片（最下面的 Zn 片向右伸出）
    ctx.save(); const g = ctx.createLinearGradient(0, TAB.y - 5, 0, TAB.y + 5);
    g.addColorStop(0, K.znHi); g.addColorStop(1, K.znLo);
    ctx.fillStyle = g; rrect(ctx, TAB.x0, TAB.y - 5, TAB.x1 - TAB.x0 + 4, 10, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    // 外導線 → 電子 → 元件（燈泡最後畫）
    wirePartial(ctx, E_PATH.L * ease((tl - 0.3) / 1.3), 1);
    electrons(ctx, t, tc, ease((tl - 1.7) / 0.4));
    bulb(ctx, lit, t);
    // 接點
    ctx.save(); ctx.fillStyle = K.wire;
    ctx.beginPath(); ctx.ellipse(PX, TOPC, 9, 4, 0, 0, TAU); ctx.fill(); ctx.restore();
    // 標註
    text(ctx, tr('Zn 端', 'Zn end'), PX - PW / 2 - 14, BY - HZ / 2, K.znHi, 24, 'right', a(0.4));
    text(ctx, tr('Cu 端', 'Cu end'), PX - PW / 2 - 14, TOPC + 4, K.cuHi, 24, 'right', a(0.4));
    text(ctx, tr('外導線', 'Outer wire'), (PX + WX) / 2, TW - 24, K.white, 24, 'center', a(1.2));
    text(ctx, tr('小燈泡', 'Small bulb'), WX - BULB.r - 14, BULB.y, K.white, 24, 'right', a(2.0));
    const RX = 765, RW = 220;
    let y = block(ctx, tr('電子 e⁻', 'Electrons e⁻'), RX, 130, RW, K.electron, 26, 'left', a(2.2), 34);
    y = block(ctx, tr('從 Zn 端出發', 'leave the Zn end,'), RX, y + 4, RW, K.white, 24, 'left', a(2.6));
    y = block(ctx, tr('經外導線', 'go along the wire,'), RX, y, RW, K.white, 24, 'left', a(3.0));
    y = block(ctx, tr('走到 Cu 端', 'reach the Cu end'), RX, y, RW, K.white, 24, 'left', a(3.4));
    block(ctx, tr('持續電流', 'Steady current'), RX, y + 30, RW, K.green, 26, 'left', a(4.4), 34);
    bottomLines(ctx, tr('不用蛙腿，也能得到持續的電流', 'No frog leg needed — and the current keeps flowing'), K.yellow, a(5.2), true);
  }

  // ───────── 圖例、說明句、進度條 ─────────
  function drawLegend(ctx, i, tl) {
    const items = [];
    if (i >= 1) items.push([tr('橘 Na⁺、紫 Cl⁻＝食鹽水裡的離子（只在濕布裡）', 'Orange Na⁺, purple Cl⁻ = ions in the brine (stay in the cloth)'), 'i']);
    if (i === 4) items.push([tr('藍球 e⁻＝電子（只在金屬與導線裡）', 'Blue ball e⁻ = electron (only in metal and wire)'), 'b']);
    if (!items.length) return;
    const al = i === 1 ? ease((tl - 3.4) / 0.6) : 1;
    const z = 22, gapIcon = 40, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(ctx, s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    const rows = tot <= maxW ? [items.map((_, k) => k)] : items.map((_, k) => [k]);
    const ys = rows.length === 1 ? [574] : [560, 586];
    rows.forEach((row, r) => {
      const tw = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tw / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        ctx.save(); ctx.globalAlpha = al;
        if (kind === 'b') ball(ctx, x + 14, y, 6, 1);
        else { ctx.fillStyle = K.na; ctx.beginPath(); ctx.arc(x + 7, y, 5, 0, TAU); ctx.fill(); ctx.fillStyle = K.cl; ctx.beginPath(); ctx.arc(x + 22, y, 5, 0, TAU); ctx.fill(); }
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
    [scene1, scene2, scene3, scene4, scene5][i](ctx, tl, t);
    drawLegend(ctx, i, tl);
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, ended: false };
  let lastResult = '', stepStop = true;
  const canvas = () => document.getElementById('voltaAnimCanvas');
  const ctl = () => window.GbAnim.ctl;
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('voltaAnimResult'); if (el) el.innerHTML = html;
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
    const row = document.getElementById('steps-volta');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.ended = false;
    stop(); render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-volta'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === stepAt(S.t) ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
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

  window.GbAnim.volta = {
    activate() {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.ended = false; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.on = false; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-volta'); if (row) row.innerHTML = '';
      const r = document.getElementById('voltaAnimResult'); if (r) r.innerHTML = '';
    },
    relang() {
      if (!S.on) return;
      const k = stepAt(S.t);
      lastResult = ''; buildButtons(); S.step = k; updateUI();
      stop(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.on) start(); },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL - 1e-3); S.step = -1; render(); return TOTAL; },
    _info() { return { volta: { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'volta' : null, t: S.t, step: S.step, running: !!S.raf, sets: landed(stepAt(S.t), S.t - STARTS[stepAt(S.t)]) }; }
  };
})();
