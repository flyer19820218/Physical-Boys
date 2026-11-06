/* galvanic_batteries_4_lab_history_1106_v1.js — 「🔬 動手做：金屬接通，蛙腿會動嗎？」科學史實驗台（#historyLabCanvas，邏輯 1000×600）
 *
 * 契約：window.GbLab.history = { activate(), deactivate(), relang(), _state(), setMode(m) }
 *   setMode('galvani'|'volta') 是選用的（頁面若想讓實驗台跟著上方子分頁切換可以呼叫；不呼叫也完全正常）。
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰 GbAnim、ctl 或舊程式的全域）。
 * 控制鈕由本檔建立在 #historyLabControls（沒有就建在畫布外框後面），說明字寫進 #historyLabResult（只有文字改變時才寫）。
 * 畫風沿用同課 galvani／volta 教學動畫（蛙腿、神經、解剖刀、金屬盤、扁圓柱金屬片、濕布、小燈泡同一畫法；不畫手），
 * 控制鈕、說明框、發亮提示、條件打勾與 lab_origin／lab_redox 實驗台一致。不寫年份數字、不寫電壓數值。
 *
 * ── 兩個實驗（〔賈法尼蛙腿〕〔伏打電堆〕模式按鈕切換；各自記住自己的狀態，activate() 兩個都回到初始）──
 *   賈法尼：〔解剖刀：銅／鐵〕〔金屬盤：鐵／銅〕；〔讓解剖刀碰神經／解剖刀離開神經〕（刀尖）；
 *     〔斷開金屬接觸／接通金屬接觸〕（刀柄碰金屬盤）；〔重來〕。刀自己移動（四種姿勢），金屬換色是淡入淡出。
 *     刀尖碰神經＋刀柄碰盤子＝迴路接通（左上標示）；接通且兩種不同金屬 → 蛙腿抽動（電子只在金屬裡，
 *     由鐵那一邊流向銅那一邊；神經裡畫白色「電刺激」光點）；相同金屬（銅＋銅、鐵＋鐵）或斷開 → 不動。
 *     右欄三個條件即時打勾／打叉，沒過的那一列與畫面上對應的部位發紅。初始＝銅刀、鐵盤、刀柄靠在盤上、刀尖還沒碰神經。
 *   伏打：〔＋一組〕〔－一組〕（1～6 組）、〔放大看一組／收起放大圖〕、〔重來〕。每組由下而上：鋅、食鹽水濕布、銅。
 *     頂端接外導線＋小燈泡；組數越多小燈越亮、旁邊「總電壓」長條越高（只表示相對大小）。加減一組時外導線夾頭先抬起
 *     （迴路斷開、燈暗），那一組從左邊滑進／滑出，夾頭再接回。電子只在金屬與導線，Na⁺／Cl⁻ 只在濕布裡（± 小圓點）。
 *   點畫面上發亮的零件也能做同一件事（刀尖、刀柄接觸點、刀身＝換刀的金屬、金屬盤＝換盤的金屬；
 *   電堆上方虛線＝加一組、最上面一組＝拿走、最下面一組＝放大、放大框＝收起）。
 *
 * ── 版面 ──────────────────────────────────────────────
 *   共用：y≈58 一句提示（黃／青）；y≈506／536 一句；y≈574（或 560／586）圖例。
 *   賈法尼：金屬盤 x 200–890、上緣 y=440；神經末端 NT=(444,322)；刀柄接觸點 (300,440)。左上 y=104／146：時代＋迴路接通／斷開。
 *     右欄 x 636–988、y 84–258：三個條件＋「蛙腿 抽動／不動」（蛙腿抽動時腳尖最高到 y≈287，不會碰到右欄）。
 *   伏打：電堆中心 x=300、寬 200、底座上緣 y=462、每組 38px；外導線 y=150、右幹線 x=720、小燈泡 (720,303)；
 *     總電壓長條 x 540–600、y 246–440；右欄 x≥770 一段說明；左上 y=104／142：時代＋組數。放大框 x 440–980、y 92–456。
 */
(function () {
  'use strict';
  window.GbLab = window.GbLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', neg: '#c691ff', ink: '#0c1e19', red: '#ff6b5a',
    cu: '#c97a3d', cuHi: '#eaa872', cuLo: '#8a4b20',
    fe: '#8d969b', feHi: '#b3bbbf', feLo: '#5a6266',
    zn: '#b9c6cc', znHi: '#e4ecef', znLo: '#7b8a91',
    skin: '#6f9f55', skinHi: '#93c172', skinLo: '#3c6630', spot: '#3f5f2c', cut: '#e6a5a0',
    nerve: '#f3e7c8', wire: '#c9d3d6', stand: '#3b4d46', standHi: '#56695f'
  };
  const MET = {
    cu: { hi: K.cuHi, mid: K.cu, lo: K.cuLo, edge: '#5e3215', shine: 'rgba(255,214,170,0.7)', label: K.cuHi },
    fe: { hi: K.feHi, mid: K.fe, lo: K.feLo, edge: '#3f474b', shine: 'rgba(232,238,242,0.7)', label: K.feHi }
  };
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpP = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const frac = x => x - Math.floor(x);
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);
  function mixHex(a, b, k) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
  }

  // ───────── 文字工具（先量再寫） ─────────
  let ctx = null;
  function textW(s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : Array.from(s), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = u; } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function text(s, x, y, color, size, align, alpha, m) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size, m); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function block(s, x, y, maxW, color, size, align, alpha, lh) {   // 第一行中心在 y，回傳下一段的 y
    const ls = wrap(s, maxW, size), h = lh || Math.round(size * 1.32);
    ls.forEach((l, k) => text(l, x, y + k * h, color, size, align, alpha));
    return y + ls.length * h;
  }
  function fitSize(s, maxW, z0, m) { for (let z = z0; z > 22; z--) if (textW(s, z, m) <= maxW) return z; return 22; }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
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
  function quadPts(a, c, b, n) {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const u = k / n, v = 1 - u;
      out.push({ x: v * v * a.x + 2 * u * v * c.x + u * u * b.x, y: v * v * a.y + 2 * u * v * c.y + u * u * b.y });
    }
    return out;
  }

  // ═════════ 共用小圖 ═════════
  function ball(x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function pulseDot(x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, 'rgba(255,247,222,1)'); g.addColorStop(0.35, 'rgba(255,247,222,0.75)'); g.addColorStop(1, 'rgba(255,247,222,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.restore();
  }
  function mark(ok, x, y, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6); ctx.lineTo(x + 7, y - 5); }
    else { ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); }
    ctx.stroke(); ctx.restore();
  }
  function ionDot(x, y, kind, r, al) {                           // ± 小圓點：橘＝正離子（Na⁺）、紫＝負離子（Cl⁻）
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = kind ? K.neg : K.pos;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (r >= 8) {
      ctx.strokeStyle = K.ink; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; const a = r * 0.5;
      ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x + a, y);
      if (!kind) { ctx.moveTo(x, y - a); ctx.lineTo(x, y + a); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function glowStroke(color, bad, fn) {
    const pulse = bad ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(S.t * 4.2)) : 0.3 + 0.12 * Math.sin(S.t * 3);
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = color; ctx.shadowBlur = bad ? 10 : 4; ctx.lineJoin = 'round';
    fn(); ctx.restore();
  }
  function drawCaption(s, color) {
    const z = fitSize(s, 960, 26);
    const ls = wrap(s, 960, z);
    const bw = Math.max(...ls.map(l => textW(l, ls.length > 1 ? 22 : z))) + 28, bh = ls.length > 1 ? 56 : 36;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.82)'; rrect(W / 2 - bw / 2, 58 - bh / 2, bw, bh, 10); ctx.fill(); ctx.restore();
    if (ls.length === 1) text(ls[0], W / 2, 58, color, z);
    else ls.slice(0, 2).forEach((l, k) => text(l, W / 2, 45 + k * 26, color, 22));
  }
  function bottomLines(s, color, twoRowLegend) {
    const ls = wrap(s, 940, 24);
    if (ls.length === 1) text(ls[0], W / 2, twoRowLegend ? 516 : 521, color, 24);
    else ls.slice(0, 2).forEach((l, k) => text(l, W / 2, twoRowLegend ? (k ? 530 : 502) : (k ? 536 : 506), color, 24));
  }
  function drawLegend(items) {                                   // items: [文字, 'b'|'p'|'i']
    const z = 22, gapIcon = 40, gapItem = 34, maxW = W - 40;
    const wid = items.map(([s]) => gapIcon + textW(s, z));
    const tot = wid.reduce((a, b) => a + b, 0) + gapItem * (items.length - 1);
    const rows = tot <= maxW ? [items.map((_, k) => k)] : items.map((_, k) => [k]);
    const ys = rows.length === 1 ? [574] : [560, 586];
    rows.forEach((row, r) => {
      const tw = row.reduce((a, k) => a + wid[k], 0) + gapItem * (row.length - 1);
      let x = W / 2 - tw / 2;
      row.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'b') ball(x + 14, y, 6, 1);
        else if (kind === 'p') pulseDot(x + 14, y, 1);
        else { ionDot(x + 8, y, 0, 6, 1); ionDot(x + 24, y, 1, 6, 1); }
        text(s, x + gapIcon, y, K.white, z, 'left');
        x += wid[k] + gapItem;
      });
    });
    return rows.length;
  }
  function legendRows(items) {
    const wid = items.map(([s]) => 40 + textW(s, 22));
    return wid.reduce((a, b) => a + b, 0) + 34 * (items.length - 1) <= W - 40 ? 1 : 2;
  }

  // ═════════ 賈法尼：幾何與圖形（同 galvani 教學動畫的畫法） ═════════
  const PL = { x0: 200, x1: 890, top: 440, th: 24 };
  const PLATE_Y = PL.top + PL.th / 2;
  const HIP = { x: 522, y: 414 }, KNEE = { x: 655, y: 417 };
  const N0 = { x: 514, y: 400 }, NC = { x: 486, y: 332 }, NT = { x: 444, y: 322 };
  const BUTT = { x: 300, y: PL.top };
  const POSE = {                                                  // [刀尖碰神經][刀柄碰盤]
    11: { tip: NT, butt: BUTT },
    10: { tip: NT, butt: { x: 269, y: 386 } },
    '01': { tip: { x: 410, y: 292 }, butt: BUTT },
    '00': { tip: { x: 424, y: 268 }, butt: { x: 282, y: 392 } }
  };
  const poseKey = (tip, link) => (tip ? '1' : '0') + (link ? '1' : '0');
  function mixPose(a, b, k) { return { tip: lerpP(a.tip, b.tip, k), butt: lerpP(a.butt, b.butt, k) }; }
  const E_FE_PLATE = mkPath([{ x: 600, y: PLATE_Y }, { x: 300, y: PLATE_Y }, BUTT, NT]);   // 鐵盤 → 接觸點 → 銅刀 → 刀尖
  const E_FE_KNIFE = mkPath([NT, BUTT, { x: 300, y: PLATE_Y }, { x: 600, y: PLATE_Y }]);   // 鐵刀 → 接觸點 → 銅盤
  const P_PATH = mkPath(quadPts(NT, NC, N0, 16).concat([{ x: 560, y: 414 }, { x: 640, y: 416 }]));
  const TWP = 1.5;
  function kickAt(t, t0) {
    const u = t - t0; if (u < 0) return 0;
    const p = frac(u / TWP);
    if (p < 0.16) return ease(p / 0.16);
    return 1 - ease((p - 0.16) / 0.5);
  }

  function plateDraw(kind, alpha) {
    if (alpha <= 0.01) return;
    const m = MET[kind];
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createLinearGradient(0, PL.top, 0, PL.top + PL.th);
    g.addColorStop(0, m.hi); g.addColorStop(0.25, m.mid); g.addColorStop(1, m.lo);
    ctx.fillStyle = g; rrect(PL.x0, PL.top, PL.x1 - PL.x0, PL.th, 6); ctx.fill();
    ctx.strokeStyle = kind === 'cu' ? 'rgba(255,214,170,0.55)' : 'rgba(220,228,232,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PL.x0 + 6, PL.top + 1.5); ctx.lineTo(PL.x1 - 6, PL.top + 1.5); ctx.stroke();
    ctx.strokeStyle = m.edge; ctx.lineWidth = 1.5; rrect(PL.x0, PL.top, PL.x1 - PL.x0, PL.th, 6); ctx.stroke();
    ctx.restore();
  }
  function limb(P, Q, w1, w2, bulge, fill, stroke) {
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
  function leg(kick) {
    const a = 7 * RAD - 30 * RAD * kick;
    const A = { x: KNEE.x + 118 * Math.cos(a), y: KNEE.y + 118 * Math.sin(a) };
    const f = a - 6 * RAD - 22 * RAD * kick;
    const TB = { x: A.x + 38 * Math.cos(f), y: A.y + 38 * Math.sin(f) };
    ctx.save(); ctx.lineJoin = 'round';
    const toes = [[-0.36, 50], [-0.13, 64], [0.09, 62], [0.30, 48]].map(([da, l]) => {
      const ang = f + da; return { x: TB.x + l * Math.cos(ang), y: TB.y + l * Math.sin(ang) };
    });
    ctx.fillStyle = 'rgba(111,159,85,0.8)'; ctx.strokeStyle = K.skinLo; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(TB.x, TB.y);
    toes.forEach((p, k) => { if (k) { const q = toes[k - 1]; ctx.quadraticCurveTo((p.x + q.x) / 2 * 0.8 + TB.x * 0.2, (p.y + q.y) / 2 * 0.8 + TB.y * 0.2, p.x, p.y); } else ctx.lineTo(p.x, p.y); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    toes.forEach(p => limb(TB, p, 9, 6, 0, K.skin, K.skinLo));
    ctx.fillStyle = K.skinHi; toes.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); });
    limb(A, TB, 15, 11, 0, K.skin, K.skinLo);
    limb(KNEE, A, 30, 15, 5, K.skin, K.skinLo);
    limb(HIP, KNEE, 50, 30, 7, K.skin, K.skinLo);
    ctx.strokeStyle = 'rgba(170,215,140,0.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(HIP.x + 18, HIP.y - 16); ctx.quadraticCurveTo(590, HIP.y - 28, KNEE.x - 14, KNEE.y - 11); ctx.stroke();
    const an = Math.atan2(A.y - KNEE.y, A.x - KNEE.x);
    ctx.beginPath(); ctx.moveTo(KNEE.x + 14 * Math.cos(an) + 8 * Math.sin(an), KNEE.y + 14 * Math.sin(an) - 8 * Math.cos(an));
    ctx.lineTo(KNEE.x + 80 * Math.cos(an) + 5 * Math.sin(an), KNEE.y + 80 * Math.sin(an) - 5 * Math.cos(an)); ctx.stroke();
    ctx.fillStyle = K.spot;
    [[560, 410, 7, 4], [598, 420, 6, 3.5], [625, 408, 5, 3]].forEach(([x, y, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); });
    [0.35, 0.65].forEach(u => { ctx.beginPath(); ctx.ellipse(lerp(KNEE.x, A.x, u), lerp(KNEE.y, A.y, u) + 2, 4.5, 3, an, 0, TAU); ctx.fill(); });
    ctx.fillStyle = K.cut; ctx.strokeStyle = '#b06f6a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(HIP.x - 14, HIP.y, 10, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function nerve() {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(60,50,30,0.6)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(N0.x, N0.y); ctx.quadraticCurveTo(NC.x, NC.y, NT.x, NT.y); ctx.stroke();
    ctx.strokeStyle = K.nerve; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(N0.x, N0.y); ctx.quadraticCurveTo(NC.x, NC.y, NT.x, NT.y); ctx.stroke();
    ctx.restore();
  }
  function knifeGeom(pose) {
    const B = pose.butt, Tp = pose.tip;
    const dx = Tp.x - B.x, dy = Tp.y - B.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    return { B, Tp, L, ux, uy, nx, ny, P: (s, o) => ({ x: B.x + ux * s + nx * o, y: B.y + uy * s + ny * o }) };
  }
  function knife(pose, kind, alpha) {
    if (alpha <= 0.01) return;
    const m = MET[kind], G = knifeGeom(pose), { B, Tp, L, nx, ny, P } = G;
    const hL = L * 0.58;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(B.x + nx * 9, B.y + ny * 9, B.x - nx * 9, B.y - ny * 9);
    g.addColorStop(0, m.hi); g.addColorStop(0.45, m.mid); g.addColorStop(1, m.lo);
    ctx.fillStyle = g; ctx.strokeStyle = m.edge; ctx.lineWidth = 1.8;
    const q = [P(0, 9), P(hL, 8), P(hL, -8), P(0, -9)];
    ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); ctx.lineTo(q[1].x, q[1].y); ctx.lineTo(q[2].x, q[2].y); ctx.lineTo(q[3].x, q[3].y);
    ctx.arc(B.x, B.y, 9, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = kind === 'cu' ? 'rgba(94,50,21,0.65)' : 'rgba(50,58,62,0.65)'; ctx.lineWidth = 1.5;
    for (let k = 1; k <= 4; k++) { const a = P(hL * k / 6, 6.5), b = P(hL * k / 6, -6.5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    const r0 = P(hL - 2, 11), r1 = P(hL + 6, 11), r2 = P(hL + 6, -11), r3 = P(hL - 2, -11);
    ctx.fillStyle = m.lo; ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.closePath(); ctx.fill();
    const s0 = hL + 6, bl = L - s0;
    const a0 = P(s0, 6), c = P(s0 + bl * 0.5, -16), e0 = P(s0, -10);
    ctx.fillStyle = g; ctx.strokeStyle = m.edge; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(Tp.x, Tp.y); ctx.quadraticCurveTo(c.x, c.y, e0.x, e0.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = m.shine; ctx.lineWidth = 1.5;
    const h0 = P(s0 + 4, 3), h1 = P(L - 10, 1);
    ctx.beginPath(); ctx.moveTo(h0.x, h0.y); ctx.lineTo(h1.x, h1.y); ctx.stroke();
    ctx.restore();
  }
  function contactDot(x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function gapMark(x, y, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = K.muted; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.stroke(); ctx.restore();
  }

  // ═════════ 伏打：幾何與圖形（同 volta 教學動畫的畫法） ═════════
  const PX = 300, PWD = 200, BY = 462;
  const HZ = 12, HC = 14, HU = 12, G = HZ + HC + HU, NMAX = 6;
  const WX = 720, TW = 150;
  const TAB = { x0: PX + 96, x1: PX + 126, y: BY - HZ / 2 };
  const BULB = { x: WX, y: (TAB.y + TW) / 2, r: 28 };
  const BAR = { x: 540, w: 60, y0: 246, y1: 440 };
  const ZP = { x: 440, y: 92, w: 540, h: 364 }, ZX = 610, ZW = 260;
  const ZS = { cu: { y: 164, h: 40 }, cloth: { y: 204, h: 140 }, zn: { y: 344, h: 40 } };
  const ZIONS = [[530, 248, 0], [610, 248, 1], [690, 248, 0], [530, 304, 1], [610, 304, 0], [690, 304, 1]];
  const LIFTV = 54, SLIDE = 300;
  const topOf = n => BY - n * G;

  function slab(cx, y, w, h, kind, alpha) {
    if (alpha <= 0.01) return;
    const ry = clamp(w * 0.045, 5, 12), x0 = cx - w / 2, x1 = cx + w / 2;
    let hi, mid, lo, top;
    if (kind === 'zn') { hi = K.znHi; mid = K.zn; lo = K.znLo; top = '#d3dde1'; }
    else if (kind === 'cu') { hi = K.cuHi; mid = K.cu; lo = K.cuLo; top = '#dd9a62'; }
    else { hi = mixHex('#efe4c8', '#7d9aa2', 1); mid = mixHex('#d6c8a6', '#56747c', 1); lo = mixHex('#a99a78', '#3a535a', 1); top = mixHex('#e4d8b8', '#6d8a92', 1); }
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
    if (kind === 'cloth') {
      ctx.strokeStyle = 'rgba(60,70,60,0.28)'; ctx.lineWidth = 1;
      for (let k = 1; k < 8; k++) { const xx = x0 + w * k / 8; ctx.beginPath(); ctx.moveTo(xx, y + 2); ctx.lineTo(xx, y + h + ry * 0.6); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(220,248,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx - w * 0.12, y, w * 0.22, ry * 0.4, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx - w * 0.1, y, w * 0.3, ry * 0.5, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    }
    ctx.restore();
  }
  function stand() {
    ctx.save();
    const g = ctx.createLinearGradient(0, BY, 0, BY + 16);
    g.addColorStop(0, K.standHi); g.addColorStop(1, K.stand);
    ctx.fillStyle = g; rrect(PX - 140, BY + 2, 280, 14, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(159,179,170,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function pileIons(cx, yMid, seed, alpha) {
    if (alpha <= 0.01) return;
    for (let k = 0; k < 5; k++) {
      const x = cx - 72 + k * 36 + 5 * Math.sin(S.t * 2.3 + k * 1.7 + seed * 2.1);
      ionDot(x, yMid + 1.5 * Math.sin(S.t * 3.1 + k + seed), (k + seed) % 2, 3.5, alpha);
    }
  }
  function group(g, dx, dy, alpha) {                               // 第 g 組（0＝最下面）
    const b = BY - g * G + dy, cx = PX + dx;
    slab(cx, b - HZ, PWD, HZ, 'zn', alpha);
    slab(cx, b - HZ - HC, PWD, HC, 'cloth', alpha);
    pileIons(cx, b - HZ - HC / 2 + 3, g, alpha);
    slab(cx, b - G, PWD, HU, 'cu', alpha);
  }
  function bulb(lit) {
    const { x, y, r } = BULB;
    ctx.save();
    if (lit > 0.01) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, r * 3);
      g.addColorStop(0, `rgba(255,240,190,${0.8 * lit})`); g.addColorStop(0.4, `rgba(255,226,140,${0.34 * lit})`); g.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = lit > 0.01 ? `rgba(255,244,205,${0.12 + 0.6 * lit})` : 'rgba(210,230,235,0.12)';
    ctx.strokeStyle = 'rgba(230,240,240,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = lit > 0.01 ? mixHex('#8a7a60', '#fff3c4', clamp(lit * 1.3, 0, 1)) : '#8a7a60'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + 12);
    for (let k = 0; k <= 6; k++) ctx.lineTo(x + (k % 2 ? 9 : -9), y + 12 - k * 4);
    ctx.lineTo(x, y - 12); ctx.lineTo(x, y - r); ctx.stroke();
    ctx.restore();
  }
  function wireLine(pts) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); ctx.stroke();
    });
    ctx.restore();
  }

  // ═════════ 狀態 ═════════
  const S = {};
  function resetGal() { Object.assign(S, { knife: 'cu', plate: 'fe', tip: false, link: true, kick: 0, tw0: 0, eD: 0, eA: 0 }); }
  function resetVol() { Object.assign(S, { n: 1, zoom: false, zoomT: -9, lit: 0, veD: 0 }); }
  function resetAll() { Object.assign(S, { mode: 'galvani', t: 0, tw: null, modeT: -9, actions: 0 }); resetGal(); resetVol(); }
  resetAll();
  const R0 = { raf: 0, timer: 0, last: 0, on: false };
  let cv = null, ctrl = null, res = null, lastRes = '', ctrlSig = '', targetsNow = [];

  function twP() { return S.tw ? clamp((S.t - S.tw.t0) / S.tw.dur, 0, 1) : 1; }
  function twIs(k) { return !!(S.tw && S.tw.key === k); }
  const busy = () => !!S.tw;
  const gClosed = () => S.tip && S.link && !twIs('pose');
  const gDiff = () => S.knife !== S.plate;
  const gTwitch = () => gClosed() && gDiff() && !twIs('metal');
  function curPose() {
    if (twIs('pose')) return mixPose(POSE[S.tw.data.from], POSE[S.tw.data.to], ease(twP()));
    return POSE[poseKey(S.tip, S.link)];
  }
  // 伏打：頂端夾頭的 y 與滑動中那一組
  function voltaGeo() {
    const n = S.n, p = twP();
    if (twIs('add')) {
      const top0 = topOf(n - 1), top1 = topOf(n);
      const lift = p < 0.2 ? LIFTV * ease(p / 0.2) : p < 0.78 ? LIFTV : lerp(LIFTV, top0 - top1, ease((p - 0.78) / 0.22));
      const k = ease((p - 0.2) / 0.55);
      return { stackN: n - 1, end: top0 - lift, mover: { g: n - 1, dx: -SLIDE * (1 - k), dy: -70 * Math.sin(Math.PI * k) * (1 - k * 0.2), a: clamp(k * 2.2, 0, 1) }, open: true };
    }
    if (twIs('remove')) {
      const top0 = topOf(n + 1), top1 = topOf(n);
      const lift = p < 0.2 ? LIFTV * ease(p / 0.2) : p < 0.78 ? LIFTV : lerp(LIFTV, top0 - top1, ease((p - 0.78) / 0.22));
      const k = ease((p - 0.2) / 0.55);
      return { stackN: n, end: top0 - lift, mover: { g: n, dx: -SLIDE * k, dy: -70 * Math.sin(Math.PI * k), a: clamp((1 - k) * 2.2, 0, 1) }, open: true };
    }
    return { stackN: n, end: topOf(n), mover: null, open: false };
  }
  const vPath = n => mkPath([{ x: TAB.x1, y: TAB.y }, { x: WX, y: TAB.y }, { x: WX, y: TW }, { x: PX, y: TW }, { x: PX, y: topOf(n) }]);
  let VPATH = vPath(1), VPATH_N = 1;

  // ═════════ 可以點的目標 ═════════
  function computeTargets() {
    const out = [];
    if (busy() || S.t - S.modeT < 0.35) return out;
    if (S.mode === 'galvani') {
      const G2 = knifeGeom(curPose());
      out.push({ key: 'tTip', shape: 'tip', r: [NT.x - 26, NT.y - 26, NT.x + 26, NT.y + 26], bad: !S.tip });
      out.push({ key: 'tLink', shape: 'link', r: [BUTT.x - 26, BUTT.y - 26, BUTT.x + 26, BUTT.y + 26], bad: !S.link });
      const a = G2.P(G2.L * 0.18, 0), b = G2.P(G2.L * 0.5, 0);
      out.push({ key: 'swapKnife', shape: 'knife', r: [Math.min(a.x, b.x) - 16, Math.min(a.y, b.y) - 16, Math.max(a.x, b.x) + 16, Math.max(a.y, b.y) + 16], bad: !gDiff() });
      out.push({ key: 'swapPlate', shape: 'plate', r: [PL.x0, PL.top, PL.x1, PL.top + PL.th + 4], bad: !gDiff() });
    } else {
      if (S.zoom) { out.push({ key: 'zoom', shape: 'panel', r: [ZP.x, ZP.y, ZP.x + ZP.w, ZP.y + ZP.h], bad: false }); }
      if (S.n < NMAX) { const y = topOf(S.n); out.push({ key: 'add', shape: 'ghost', r: [PX - PWD / 2 - 6, y - G - 14, PX + PWD / 2 + 6, y - 8], bad: false }); }
      if (S.n > 1) { const y = topOf(S.n); out.push({ key: 'remove', shape: 'top', r: [PX - PWD / 2 - 6, y - 8, PX + PWD / 2 + 6, y + G - 4], bad: false }); }
      if (!S.zoom && (S.n === 1 || S.n > 1)) { const y = BY - G; out.push({ key: 'zoom', shape: 'bottom', r: [PX - PWD / 2 - 6, S.n > 1 ? y - 2 : y - 8, PX + PWD / 2 + 6, BY + 8], bad: false }); }
    }
    return out;
  }
  function drawGlow(tg) {
    const color = tg.bad ? K.red : K.yellow;
    glowStroke(color, tg.bad, () => {
      const [x0, y0, x1, y1] = tg.r;
      if (tg.shape === 'tip') { ctx.beginPath(); ctx.arc(NT.x, NT.y, 20, 0, TAU); ctx.stroke(); }
      else if (tg.shape === 'link') { ctx.beginPath(); ctx.arc(BUTT.x, BUTT.y, 20, 0, TAU); ctx.stroke(); }
      else if (tg.shape === 'knife') {
        const G2 = knifeGeom(curPose()), q = [G2.P(-14, 16), G2.P(G2.L + 8, 16), G2.P(G2.L + 8, -22), G2.P(-14, -16)];
        ctx.beginPath(); q.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
      } else if (tg.shape === 'plate') { rrect(PL.x0 - 6, PL.top - 4, PL.x1 - PL.x0 + 12, PL.th + 10, 9); ctx.stroke(); }
      else if (tg.shape === 'ghost') {
        const y = topOf(S.n) - G, ry = 9;
        ctx.beginPath(); ctx.ellipse(PX, y, PWD / 2, ry, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PX - PWD / 2, y); ctx.lineTo(PX - PWD / 2, y + G); ctx.moveTo(PX + PWD / 2, y); ctx.lineTo(PX + PWD / 2, y + G); ctx.stroke();
      } else { rrect(x0, y0, x1 - x0, y1 - y0, 10); ctx.stroke(); }
    });
  }

  // ═════════ 文字 ═════════
  const MN = { cu: ['銅', 'copper'], fe: ['鐵', 'iron'] };
  const mzh = k => MN[k][0], men = k => MN[k][1];
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  function gKey() {
    if (twIs('pose')) return 'move';
    if (twIs('metal')) return 'metal';
    if (S.tip && S.link) return gDiff() ? 'twitch' : 'same';
    if (!S.tip && !S.link) return 'open2';
    return S.tip ? 'noLink' : 'noTip';
  }
  function vKey() {
    if (twIs('add')) return 'add';
    if (twIs('remove')) return 'remove';
    return S.zoom ? 'zoom' : 'pile';
  }
  const Y = s => `<span class="accent-yellow">${s}</span>`;
  function caption() {
    if (S.mode === 'galvani') {
      const k = gKey(), a = S.knife, b = S.plate;
      switch (k) {
        case 'move': return T('解剖刀移動中…', 'The scalpel is moving…');
        case 'metal': return T('換金屬中…', 'Changing the metal…');
        case 'twitch': return T(`${mzh(a)}刀＋${mzh(b)}盤：兩種不同金屬接通，蛙腿抽動！`, `${cap1(men(a))} scalpel + ${men(b)} plate: two different metals — the leg twitches!`);
        case 'same': return T(`${mzh(a)}刀＋${mzh(b)}盤：同一種金屬，迴路接通，蛙腿卻不動`, `${cap1(men(a))} scalpel + ${men(b)} plate: the same metal — circuit closed, but no twitch`);
        case 'noTip': return T('解剖刀沒碰到神經：迴路斷開，蛙腿不動', 'The scalpel is not touching the nerve: circuit open, no twitch');
        case 'noLink': return T('金屬沒有接觸：迴路斷開，蛙腿不動', 'The metals are not touching: circuit open, no twitch');
        default: return T('解剖刀懸空：迴路斷開，蛙腿不動', 'The scalpel is in the air: circuit open, no twitch');
      }
    }
    const k = vKey(), n = S.n;
    if (k === 'add') return T('加上一組…（夾頭先拿開，迴路斷開）', 'Adding a set… (clip lifted, circuit open)');
    if (k === 'remove') return T('拿走一組…（夾頭先拿開，迴路斷開）', 'Removing a set… (clip lifted, circuit open)');
    if (k === 'zoom') return T('放大看一組：銅片、食鹽水濕布、鋅片', 'Zoom in on one set: copper, brine-soaked cloth, zinc');
    if (n === 1) return T('1 組：小燈泡微微亮，再多疊幾組看看', '1 set: the bulb glows faintly — stack more sets');
    if (n === NMAX) return T('6 組（最多）：組數越多，小燈泡越亮', '6 sets (the most): more sets, brighter bulb');
    return T(`${n} 組：組數越多，小燈泡越亮`, `${n} sets: more sets, brighter bulb`);
  }
  function captionColor() {
    if (S.mode === 'galvani') { const k = gKey(); return k === 'twitch' ? K.yellow : k === 'move' || k === 'metal' ? K.white : K.cyan; }
    const k = vKey(); return k === 'add' || k === 'remove' ? K.white : K.yellow;
  }
  const HIST_G = () => T('賈法尼以為是「動物電」；伏打懷疑是金屬在搞鬼。', "Galvani thought it was 'animal electricity'; Volta suspected the metals.");
  function resultHTML() {
    if (S.mode === 'galvani') {
      const k = gKey(), a = S.knife, b = S.plate;
      switch (k) {
        case 'move': return T('解剖刀移動中……看看蛙腿。', 'The scalpel is moving… watch the leg.');
        case 'metal': return T('換金屬中……', 'Changing the metal…');
        case 'twitch':
          if (a === 'cu') return T(`銅製解剖刀碰觸神經，青蛙放在鐵盤上；${Y('兩金屬接觸後，蛙腿收縮')}。${HIST_G()}今天的理解：生物確有電訊號；兩種不同的金屬接通，也能讓電動起來。`,
            `The copper scalpel touches the nerve and the frog lies on an iron plate; ${Y('once the two metals touch, the leg contracts')}. ${HIST_G()} Today we know living things do have electrical signals, and two different metals joined together can also make electricity move.`);
          return T(`鐵製解剖刀＋銅盤：還是${Y('兩種不同的金屬')}，迴路接通，蛙腿收縮。${HIST_G()}`,
            `Iron scalpel + copper plate: still ${Y('two different metals')}, the circuit is closed and the leg contracts. ${HIST_G()}`);
        case 'same': return T(`解剖刀和盤子是${Y('同一種金屬')}（${mzh(a)}＋${mzh(b)}）：迴路雖然接通，蛙腿不收縮。只有兩種不同的金屬接觸，蛙腿才抽動。${HIST_G()}`,
          `The scalpel and the plate are ${Y('the same metal')} (${men(a)} + ${men(b)}): the circuit is closed, yet the leg does not contract. Only two different metals make it twitch. ${HIST_G()}`);
        case 'noTip': return T(`解剖刀沒有碰到神經：${Y('迴路斷開')}，沒有電流通過神經，蛙腿不收縮。`, `The scalpel is not touching the nerve: the ${Y('circuit is open')}, no current flows through the nerve, so the leg does not contract.`);
        case 'noLink': return T(`解剖刀與${mzh(b)}盤未接觸時，${Y('迴路斷開')}，沒有電流通過神經，蛙腿不收縮。`, `Without contact between the scalpel and the ${men(b)} plate, the ${Y('circuit is open')}: no current flows through the nerve, so the leg does not contract.`);
        default: return T(`解剖刀懸空，${Y('迴路斷開')}：沒有電流通過神經，蛙腿不收縮。`, `The scalpel is in the air, so the ${Y('circuit is open')}: no current flows through the nerve, and the leg does not contract.`);
      }
    }
    const k = vKey(), n = S.n;
    if (k === 'add' || k === 'remove') return T('外導線的夾頭先拿開（迴路斷開，燈暗），換好再接回去。', 'The wire clip is lifted first (circuit open, bulb dark), then clipped back on.');
    if (k === 'zoom') return T(`一組＝鋅片＋食鹽水濕布＋銅片。布片吸住食鹽水；食鹽水裡的離子（${Y('Na⁺、Cl⁻')}）只在濕布裡移動，電子只走金屬與外導線。`,
      `One set = zinc + brine-soaked cloth + copper. The cloth holds the brine; the ions in it (${Y('Na⁺, Cl⁻')}) move only within the cloth, while electrons travel only through the metal and the outer wire.`);
    return T(`十九世紀初，伏打公布能穩定供應電流的伏打電堆：銅（Cu）、鋅（Zn）交替堆疊，中間夾食鹽水浸濕的布片。現在疊了 ${n} 組：${Y('金屬組數增加，總電壓隨堆疊增加')}，小燈泡越亮。`,
      `Early 19th century: Volta announced the voltaic pile, which provides a steady current — copper (Cu) and zinc (Zn) stacked alternately with brine-soaked cloth in between. Now ${n === 1 ? '1 set is' : n + ' sets are'} stacked: ${Y('more metal sets, higher total voltage')}, and a brighter bulb.`);
  }
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ═════════ 畫：賈法尼 ═════════
  function renderGalvani() {
    const pose = curPose(), mt = twIs('metal') ? S.tw.data : null, mk = mt ? ease(twP()) : 1;
    if (mt && mt.which === 'plate') { plateDraw(mt.from, 1); plateDraw(mt.to, mk); } else plateDraw(S.plate, 1);
    leg(S.kick);
    nerve();
    if (mt && mt.which === 'knife') { knife(pose, mt.from, 1); knife(pose, mt.to, mk); } else knife(pose, S.knife, 1);
    // 接觸點：碰到＝白點；沒碰到＝虛線小圈
    const settled = !twIs('pose');
    if (settled) {
      if (S.tip) contactDot(NT.x, NT.y, 1); else gapMark(NT.x, NT.y, 1);
      if (S.link) contactDot(BUTT.x, BUTT.y, 1); else gapMark(BUTT.x, BUTT.y, 1);
    }
    // 電子（只在金屬裡：鐵那一邊 → 接觸點 → 銅那一邊）、神經裡的電刺激
    if (S.eA > 0.01) {
      const P = S.knife === 'fe' ? E_FE_KNIFE : E_FE_PLATE, sp = 34, L = P.L;
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (S.eD % sp);
        if (s < 0 || s > L) continue;
        const p = at(P, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1);
        ball(p.x, p.y, 6, S.eA * fade);
      }
      const per = 0.75, LP = P_PATH.L;
      for (let k = 0; k < 3; k++) {
        const age = frac((S.t - S.tw0) / per - k / 3) * per * 3, s = age * 260 / 2.2;
        if (s > LP) continue;
        const p = at(P_PATH, s);
        pulseDot(p.x, p.y, S.eA * clamp(Math.min(s / 12, (LP - s) / 40), 0, 1));
      }
    }
    // 標註
    const kn = mt && mt.which === 'knife' ? (mk > 0.5 ? mt.to : mt.from) : S.knife;
    const pk = mt && mt.which === 'plate' ? (mk > 0.5 ? mt.to : mt.from) : S.plate;
    const kl = kn === 'cu' ? T('銅製解剖刀', 'Copper scalpel') : T('鐵製解剖刀', 'Iron scalpel');
    text(kl, 318, 292, MET[kn].label, 24, 'right');
    text(pk === 'cu' ? T('銅盤', 'Copper plate') : T('鐵盤', 'Iron plate'), PL.x0 - 14, PLATE_Y, MET[pk].label, 24, 'right');
    text(T('神經', 'Nerve'), 515, 300, K.nerve, 24);
    text(T('蛙腿', 'Frog leg'), 640, 348, K.skinHi, 24);
    text(T('十八世紀末・賈法尼', 'Late 18th century · Galvani'), 30, 104, K.muted, 22, 'left');
    const closed = gClosed();
    text(closed ? T('迴路接通', 'Circuit closed') : T('迴路斷開', 'Circuit open'), 30, 146, closed ? K.green : K.red, 28, 'left', settled ? 1 : 0.45);
    drawGalPanel();
    const two = legendRows(galLegend()) > 1;
    bottomLines(HIST_G().replace(/[。.]$/, ''), K.white, two);
    drawLegend(galLegend());
  }
  const galLegend = () => [[T('藍球 e⁻＝電子（只在金屬裡移動）', 'Blue ball e⁻ = electron (moves in the metals)'), 'b'], [T('白光＝電刺激', 'White glow = electric stimulus'), 'p']];
  function drawGalPanel() {
    const X = 636, Yp = 84, Wp = 352, Hp = 174;
    ctx.save(); ctx.fillStyle = 'rgba(18,51,41,0.72)'; ctx.strokeStyle = 'rgba(159,179,170,0.3)'; ctx.lineWidth = 2;
    rrect(X, Yp, Wp, Hp, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    const pend = busy(), blink = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(S.t * 4.2));
    const rows = [
      [S.tip, T('刀尖碰到神經', 'Tip on the nerve')],
      [S.link, T('金屬接觸（刀柄碰盤）', 'Metals touch')],
      [gDiff(), T('兩種不同的金屬', 'Two different metals')]
    ];
    rows.forEach(([ok, s], k) => {
      const y = Yp + 28 + k * 36;
      if (!ok && !pend) {
        ctx.save(); ctx.globalAlpha = blink; ctx.fillStyle = 'rgba(255,107,90,0.12)'; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
        rrect(X + 8, y - 16, Wp - 16, 32, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      mark(ok, X + 30, y, pend ? 0.45 : 1);
      const z = fitSize(s, Wp - 64, 24);
      text(s, X + 52, y, ok ? K.white : K.red, z, 'left', pend ? 0.5 : 1);
    });
    const yr = Yp + Hp - 26;
    ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 16, yr - 22); ctx.lineTo(X + Wp - 16, yr - 22); ctx.stroke(); ctx.restore();
    text(T('蛙腿', 'Frog leg'), X + 18, yr, K.muted, 22, 'left');
    const tw = gTwitch(), rs = pend ? T('…', '…') : tw ? T('抽動！', 'twitches!') : T('不動', 'still');
    text(rs, X + Wp - 18, yr, pend ? K.muted : tw ? K.green : K.red, 28, 'right');
  }

  // ═════════ 畫：伏打 ═════════
  function renderVolta() {
    const V = voltaGeo(), zA = S.zoom ? clamp((S.t - S.zoomT) / 0.3, 0, 1) : 0, under = S.zoom ? 0 : clamp((S.t - S.zoomT) / 0.3, 0, 1);
    stand();
    for (let g = 0; g < V.stackN; g++) group(g, 0, 0, 1);
    // Zn 端接片
    ctx.save(); const tg = ctx.createLinearGradient(0, TAB.y - 5, 0, TAB.y + 5);
    tg.addColorStop(0, K.znHi); tg.addColorStop(1, K.znLo);
    ctx.fillStyle = tg; rrect(TAB.x0, TAB.y - 5, TAB.x1 - TAB.x0 + 4, 10, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    // 外導線（頂端夾頭跟著電堆頂端）
    wireLine([{ x: TAB.x1, y: TAB.y }, { x: WX, y: TAB.y }, { x: WX, y: TW }, { x: PX, y: TW }, { x: PX, y: V.end }]);
    ctx.save(); ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(PX - 9, V.end - 4, 18, 8, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    if (V.open) {
      ctx.save(); ctx.globalAlpha = clamp((V.mover ? 1 : 0), 0, 1) * 0.9; ctx.strokeStyle = K.red; ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(PX, V.end + 14, 13, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (V.mover) group(V.mover.g, V.mover.dx, V.mover.dy, V.mover.a);
    // 電子（只在外導線）
    if (S.lit > 0.02 && !V.open) {
      if (VPATH_N !== S.n) { VPATH = vPath(S.n); VPATH_N = S.n; }
      const sp = 34, L = VPATH.L, al = clamp(S.lit / 0.12, 0, 1);
      for (let k = -1; k * sp < L + sp; k++) {
        const s = k * sp + (S.veD % sp);
        if (s < 0 || s > L) continue;
        const p = at(VPATH, s), fade = clamp(Math.min(s, L - s) / 16, 0, 1);
        ball(p.x, p.y, 6, al * fade);
      }
    }
    bulb(S.lit);
    // 總電壓長條（相對大小，不標數值）
    const hgt = (BAR.y1 - BAR.y0) * clamp(S.barN / NMAX, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(74,222,128,0.08)'; ctx.strokeStyle = 'rgba(74,222,128,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    rrect(BAR.x, BAR.y0, BAR.w, BAR.y1 - BAR.y0, 6); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    if (hgt > 1) {
      const g2 = ctx.createLinearGradient(0, BAR.y1 - hgt, 0, BAR.y1);
      g2.addColorStop(0, '#86efac'); g2.addColorStop(1, '#22a356');
      ctx.fillStyle = g2; ctx.shadowColor = K.green; ctx.shadowBlur = 12;
      rrect(BAR.x + 4, BAR.y1 - hgt, BAR.w - 8, hgt, 5); ctx.fill();
    }
    ctx.restore();
    // 標註（放大框蓋住的字就不寫）
    text(T('十九世紀初・伏打', 'Early 19th century · Volta'), 30, 104, K.muted, 22, 'left');
    text(T(`組數：${S.n} 組`, S.n === 1 ? 'Sets: 1' : `Sets: ${S.n}`), 30, 142, K.white, 28, 'left');
    const lblA = V.mover ? 0.35 : 1;
    text(T('Zn 端', 'Zn end'), PX - PWD / 2 - 14, BY - HZ / 2, K.znHi, 24, 'right', lblA);
    text(T('Cu 端', 'Cu end'), PX - PWD / 2 - 14, Math.min(topOf(V.stackN) + 6, BY - HZ / 2 - 36), K.cuHi, 24, 'right', lblA);
    if (under > 0.01) {
      text(T('外導線', 'Outer wire'), (PX + WX) / 2, TW - 24, K.white, 24, 'center', under);
      text(T('總電壓', 'Total voltage'), BAR.x + BAR.w / 2, BAR.y0 - 22, K.green, 24, 'center', under);
      const RX = 770, RW = 218;
      let y = block(T('疊的組數越多', 'The more sets stacked,'), RX, 112, RW, K.white, 24, 'left', under, 30);
      y = block(T('小燈泡越亮', 'the brighter the bulb'), RX, y + 2, RW, K.yellow, 24, 'left', under, 30);
      y = block(T('總電壓越大', 'and the higher the total voltage'), RX, y + 2, RW, K.green, 24, 'left', under, 30);
      y = block(T('長條只表示相對大小', 'The bar shows relative size only'), RX, y + 8, RW, K.muted, 22, 'left', under, 27);
      text(T('小燈泡', 'Small bulb'), WX + BULB.r + 14, Math.max(BULB.y + 50, y + 16), K.white, 24, 'left', under);
    }
    if (zA > 0.01) drawZoom(zA);
    const items = volLegend(), two = legendRows(items) > 1;
    bottomLines(T('鋅、食鹽水濕布、銅交替堆疊：金屬組數增加，總電壓隨堆疊增加', 'Zn, wet cloth and Cu stacked alternately: more sets, higher total voltage'), K.white, two);
    drawLegend(items);
  }
  const volLegend = () => [[T('橘 Na⁺、紫 Cl⁻＝食鹽水裡的離子（只在濕布裡）', 'Orange Na⁺, purple Cl⁻ = ions in the brine (stay in the cloth)'), 'i'],
    [T('藍球 e⁻＝電子（只在金屬與導線裡）', 'Blue ball e⁻ = electron (only in metal and wire)'), 'b']];
  function drawZoom(al) {
    ctx.save(); ctx.globalAlpha = al;
    ctx.strokeStyle = K.yellow; ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
    rrect(PX - PWD / 2 - 8, BY - G - 18, PWD + 16, G + 30, 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(253,224,71,0.55)';
    ctx.beginPath(); ctx.moveTo(PX + PWD / 2 + 8, BY - G - 18); ctx.lineTo(ZP.x, ZP.y + 20);
    ctx.moveTo(PX + PWD / 2 + 8, BY + 12); ctx.lineTo(ZP.x, ZP.y + ZP.h - 20); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = K.panel; ctx.strokeStyle = K.yellow; ctx.lineWidth = 2.5;
    rrect(ZP.x, ZP.y, ZP.w, ZP.h, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
    text(T('放大看一組', 'Zoom in: one set'), ZP.x + 24, ZP.y + 30, K.yellow, 26, 'left', al);
    slab(ZX, ZS.zn.y, ZW, ZS.zn.h, 'zn', al);
    slab(ZX, ZS.cloth.y, ZW, ZS.cloth.h, 'cloth', al);
    slab(ZX, ZS.cu.y, ZW, ZS.cu.h, 'cu', al);
    ZIONS.forEach(([x, y, cl], k) => {
      const ox = 10 * Math.sin(S.t * 1.9 + k * 1.3), oy = 6 * Math.sin(S.t * 2.6 + k * 2.1);
      ionDot(x + ox, y + oy, cl, 12, al);
    });
    const LX = 770, LW = 196;
    text(T('銅片 Cu', 'Copper (Cu)'), LX, ZS.cu.y + ZS.cu.h / 2, K.cuHi, 24, 'left', al);
    const cy = ZS.cloth.y + ZS.cloth.h / 2;
    const y = block(T('食鹽水濕布', 'Brine-soaked cloth'), LX, cy - 30, LW, K.white, 24, 'left', al, 30);
    block(T('（離子只在布裡）', '(ions stay in it)'), LX, y + 2, LW, K.muted, 22, 'left', al, 27);
    text(T('鋅片 Zn', 'Zinc (Zn)'), LX, ZS.zn.y + ZS.zn.h / 2, K.znHi, 24, 'left', al);
    text(T('點一下放大框可收起', 'Tap the box to close it'), ZP.x + ZP.w / 2, ZP.y + ZP.h - 24, K.muted, 22, 'center', al);
  }

  // ═════════ 畫一幀 ═════════
  function render() {
    if (!ctx || !cv || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    if (S.mode === 'galvani') renderGalvani(); else renderVolta();
    targetsNow = computeTargets();
    targetsNow.forEach(drawGlow);
    const fadeIn = clamp(1 - (S.t - S.modeT) / 0.35, 0, 1);
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(caption(), captionColor());
  }

  // ═════════ 步進 ═════════
  function step(dt) {
    S.t += dt;
    const tw = S.tw;
    if (tw && S.t - tw.t0 >= tw.dur) { S.tw = null; if (tw.done) tw.done(); refreshUI(); }
    // 賈法尼
    const twitch = gTwitch();
    if (twitch) {
      if (!S.wasTw) { S.tw0 = S.t + 0.3; S.wasTw = true; }
      S.kick = kickAt(S.t, S.tw0);
      S.eA = Math.min(1, S.eA + dt / 0.5);
      S.eD += 70 * dt;
    } else {
      S.wasTw = false;
      S.kick = Math.max(0, S.kick - dt * 3);
      S.eA = Math.max(0, S.eA - dt / 0.25);
    }
    // 伏打
    const V = voltaGeo();
    const want = V.open ? 0 : 0.24 + 0.76 * (S.n - 1) / (NMAX - 1);
    S.lit += (want - S.lit) * Math.min(1, dt * (V.open ? 10 : 4));
    if (Math.abs(S.lit - want) < 1e-3) S.lit = want;
    S.veD += (30 + 14 * S.n) * dt * (V.open ? 0 : 1);
    const barWant = V.stackN;                                    // 加一組時等那一組放好才長高；拿走時馬上變矮
    S.barN = S.barN === undefined ? barWant : S.barN + (barWant - S.barN) * Math.min(1, dt * 6);
  }

  // ═════════ 操作 ═════════
  function tween(key, dur, data, done) { S.tw = { key, t0: S.t, dur, data: data || {}, done }; }
  const GAL_KEYS = ['kCu', 'kFe', 'pFe', 'pCu', 'tTip', 'tLink', 'swapKnife', 'swapPlate'];
  const VOL_KEYS = ['add', 'remove', 'zoom'];
  function can(key) {
    if (key === 'mGal') return S.mode !== 'galvani' && !busy();
    if (key === 'mVol') return S.mode !== 'volta' && !busy();
    if (key === 'reset') return !busy();
    if (busy()) return false;
    if (S.mode === 'galvani') {
      if (!GAL_KEYS.includes(key)) return false;
      if (key === 'kCu') return S.knife !== 'cu';
      if (key === 'kFe') return S.knife !== 'fe';
      if (key === 'pFe') return S.plate !== 'fe';
      if (key === 'pCu') return S.plate !== 'cu';
      return true;
    }
    if (!VOL_KEYS.includes(key)) return false;
    if (key === 'add') return S.n < NMAX;
    if (key === 'remove') return S.n > 1;
    return true;
  }
  function act(key) {
    if (!can(key)) return;
    S.actions++;
    if (key === 'swapKnife') key = S.knife === 'cu' ? 'kFe' : 'kCu';
    if (key === 'swapPlate') key = S.plate === 'fe' ? 'pCu' : 'pFe';
    switch (key) {
      case 'mGal': S.mode = 'galvani'; S.modeT = S.t; break;
      case 'mVol': S.mode = 'volta'; S.modeT = S.t; S.barN = S.n; break;
      case 'reset': if (S.mode === 'galvani') resetGal(); else { resetVol(); S.barN = 1; } S.modeT = S.t; break;
      case 'kCu': case 'kFe': { const from = S.knife; S.knife = key === 'kCu' ? 'cu' : 'fe'; tween('metal', 0.6, { which: 'knife', from, to: S.knife }); break; }
      case 'pCu': case 'pFe': { const from = S.plate; S.plate = key === 'pCu' ? 'cu' : 'fe'; tween('metal', 0.6, { which: 'plate', from, to: S.plate }); break; }
      case 'tTip': case 'tLink': {
        const from = poseKey(S.tip, S.link);
        if (key === 'tTip') S.tip = !S.tip; else S.link = !S.link;
        tween('pose', 0.7, { from, to: poseKey(S.tip, S.link) }); break;
      }
      case 'add': S.n++; tween('add', 1.3); break;
      case 'remove': S.n--; tween('remove', 1.3); break;
      case 'zoom': S.zoom = !S.zoom; S.zoomT = S.t; break;
    }
    refreshUI();
    if (!R0.raf) render();
  }
  function setMode(m) {
    if (m !== 'galvani' && m !== 'volta') return;
    if (!R0.on) { S.mode = m; return; }
    if (S.mode === m) return;
    S.tw = null; act(m === 'galvani' ? 'mGal' : 'mVol');
  }

  // ═════════ 控制鈕 ═════════
  function ctrlSpec() {
    const rows = [[T('實驗', 'Experiment'), [['mGal', T('賈法尼蛙腿', "Galvani's frog leg")], ['mVol', T('伏打電堆', 'Voltaic pile')]]]];
    if (S.mode === 'galvani') {
      rows.push([T('解剖刀', 'Scalpel'), [['kCu', T('銅', 'Copper')], ['kFe', T('鐵', 'Iron')]]]);
      rows.push([T('金屬盤', 'Plate'), [['pFe', T('鐵', 'Iron')], ['pCu', T('銅', 'Copper')]]]);
      rows.push([T('操作', 'Do'), [
        ['tTip', S.tip ? T('解剖刀離開神經', 'Lift the scalpel off') : T('讓解剖刀碰神經', 'Touch the nerve')],
        ['tLink', S.link ? T('斷開金屬接觸', 'Break metal contact') : T('接通金屬接觸', 'Make metal contact')],
        ['reset', T('重來', 'Start over')]]]);
    } else {
      rows.push([T('電堆', 'Pile'), [
        ['add', T('＋一組', '+ 1 set')], ['remove', T('－一組', '− 1 set')],
        ['zoom', S.zoom ? T('收起放大圖', 'Close zoom') : T('放大看一組', 'Zoom in on a set')],
        ['reset', T('重來', 'Start over')]]]);
    }
    return rows;
  }
  const PRESS = { mGal: () => S.mode === 'galvani', mVol: () => S.mode === 'volta', kCu: () => S.knife === 'cu', kFe: () => S.knife === 'fe', pFe: () => S.plate === 'fe', pCu: () => S.plate === 'cu', zoom: () => S.zoom };
  function buildControls() {
    if (!ctrl) return;
    const rows = ctrlSpec(), sig = JSON.stringify(rows);
    if (sig === ctrlSig) return;
    ctrlSig = sig;
    const fk = document.activeElement && ctrl.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    ctrl.style.display = 'flex'; ctrl.style.flexDirection = 'column'; ctrl.style.gap = '10px';
    for (const [name, btns] of rows) {
      const row = document.createElement('div'); row.className = 'lab-row';
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name;
      sp.style.cssText = 'font-size:22px;font-weight:900;color:#b8c9c1;margin-right:4px;';
      row.appendChild(sp);
      for (const [key, label] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'action-btn lab-btn'; b.dataset.act = key; b.textContent = label;
        b.style.cssText = 'font-size:22px;min-height:56px;padding:10px 18px;font-weight:900;touch-action:manipulation;';
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b && !b.disabled) b.focus(); }
  }
  function refreshUI() {
    buildControls();
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act, ok = can(k), pr = PRESS[k] ? PRESS[k]() : null;
      b.disabled = !ok; b.style.opacity = ok || pr ? '1' : '0.42'; b.style.cursor = ok ? 'pointer' : 'default';
      if (pr !== null) { b.setAttribute('aria-pressed', pr ? 'true' : 'false'); b.classList.toggle('active', pr); }
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', (S.mode === 'galvani'
      ? T('賈法尼蛙腿實驗台：選解剖刀與金屬盤的金屬，讓解剖刀碰神經、接通或斷開金屬接觸，看蛙腿動不動；目前：', "Galvani bench: choose the scalpel and plate metals, touch the nerve, make or break the metal contact, and watch the leg. Now: ")
      : T('伏打電堆實驗台：加一組、減一組或放大看一組，看小燈泡的亮度；目前：', 'Voltaic pile bench: add or remove a set, or zoom in, and watch the bulb. Now: ')) + caption());
  }

  // ═════════ 點畫面（只認目前發亮的目標） ═════════
  function hitAt(e) {
    const r = cv.getBoundingClientRect(); if (!r.width) return null;
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    return targetsNow.find(tg => x >= tg.r[0] - 4 && x <= tg.r[2] + 4 && y >= tg.r[1] - 4 && y <= tg.r[3] + 4) || null;
  }
  function onClick(e) { if (!cv) return; const hit = hitAt(e); if (hit) act(hit.key); }
  function onMove(e) { if (!cv || e.pointerType !== 'mouse') return; cv.style.cursor = hitAt(e) ? 'pointer' : 'default'; }

  // ═════════ 動畫迴圈（單一 rAF；看不見就停） ═════════
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.05, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt); render(); writeResult();
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
    cv = document.getElementById('historyLabCanvas');
    if (!cv) return;
    ctrl = document.getElementById('historyLabControls');
    if (!ctrl) {
      ctrl = document.createElement('div'); ctrl.id = 'historyLabControls'; ctrl.className = 'lab-controls';
      const host = cv.parentElement && cv.parentElement.classList.contains('canvas-wrap') ? cv.parentElement : cv;
      host.insertAdjacentElement('afterend', ctrl);
    }
    res = document.getElementById('historyLabResult');
    ctx = cv.getContext('2d');
    resetAll(); S.barN = 1;
    R0.on = true; lastRes = ''; ctrlSig = '';
    cv.addEventListener('click', onClick);
    cv.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVis);
    refreshUI(); render(); sync();
  }
  function deactivate() {
    R0.on = false;
    if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0;
    if (R0.timer) clearTimeout(R0.timer); R0.timer = 0;
    if (cv) { cv.removeEventListener('click', onClick); cv.removeEventListener('pointermove', onMove); }
    document.removeEventListener('visibilitychange', onVis);
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ctrlSig = '';
  }
  function relang() { if (!R0.on) return; lastRes = ''; ctrlSig = ''; refreshUI(); render(); }
  function _state() {
    return {
      mode: S.mode, busy: busy(), tween: S.tw ? S.tw.key : null,
      galvani: { knife: S.knife, plate: S.plate, tip: S.tip, link: S.link, closed: gClosed(), different: gDiff(), twitch: gTwitch(), kick: +S.kick.toFixed(3), electrons: +S.eA.toFixed(2), sub: gKey() },
      volta: { sets: S.n, zoom: S.zoom, lit: +S.lit.toFixed(3), bar: +(S.barN || 0).toFixed(2), sub: vKey() },
      targets: targetsNow.map(t => ({ key: t.key, shape: t.shape, bad: t.bad, r: t.r.map(v => Math.round(v)) })),
      caption: caption(), running: !!R0.raf, on: R0.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  window.GbLab.history = { activate, deactivate, relang, _state, setMode };
})();
