/* ==================================================================
   mechanics_5_common_1127_v1.js ｜ 大氣壓力與浮力：本單元 13 支動畫共用的畫法（window.M5）
   ------------------------------------------------------------------
   第一支動畫（straw）建立、magde 補上；之後的動畫只能「新增」函式（附在速查裡），不改既有函式的簽名。
   依賴 work_5_kit_1103_v1.js（W5）、mechanics_3_common_1126_v1.js（M3）、mechanics_4_common_1126_v1.js（M4）；
   載入順序：kit → M3 → M4 → M5 → 各動畫檔。文字、時間軸、箭頭、杯子、壓力計……能用 M3／M4 的就直接用。

   ── 全課統一數字（照簡報） ──
   M5.ATM ＝ 1033.6（gw/cm²，約 1 atm，約 1 kgw/cm²）　M5.D.water ＝ 1、M5.D.hg ＝ 13.6（gw/cm³）
   顏色：大氣壓力箭頭＝M4.PC.pressure（珊瑚）、空氣分子＝M4.PC.air；M5.PC 另加 sea 空氣海洋淡藍、juice 果汁紫、copper 銅、hg 水銀。

   ── 速查 ──
   常數   M5.ATM  M5.D  M5.PC
   路徑   M5.poly(pts) → { len, at(s)→[x,y], ang(s) }（折線依弧長取點；s 會夾在 0..len）
   空氣   M5.airSea(c,x0,y0,x1,y1,o)（「空氣的海洋」：淡藍透明漸層＋越往下越密的分子點群（確定性）；
                    o：{ n 點數(120), seed, t 時間(點微微漂動), a, dense 下密上疏的程度 0..1(0.6), fill 畫淡藍底(true), fillA 底色最濃處(0.16),
                    holes:[fn(c)] 不畫點的區域（fn 在目前路徑上「加一個封閉子路徑」，不要 beginPath）, r 點半徑(2.6) }）
          M5.gasDots(c,o)（容器裡的空氣分子點，可被一顆顆抽走（out）或灌進來（in），沿著 o.path 走；
                    區域 o.box:[x0,y0,x1,y1] 或 o.circle:[cx,cy,r]（位置是比例 → 區域變形，點跟著走）；
                    o：{ n(30), seed, t, r(3.2), col(M4.PC.air), a, jig 抖動 px(2.2),
                    k 0..1 抽／灌的進度, frac 會移動的點佔幾成(0.9), mode 'out'(預設，k＝1 剩 1－frac)|'in'(k＝0 剩 1－frac、k＝1 全滿),
                    path [[x,y],…] 出口路徑（第一點＝容器開口；out：點先走到開口再沿路徑出去、最後淡出）, win 每顆點移動佔 k 的長度(0.22),
                    paths [path,…] 多條出口（第 i 顆點走 paths[i % 條數]，取代 path）, shift(hx,hy)→[dx,dy] 依「家」的位置整批平移（例：兩個半球分開時左右各移一半） }）
                    → 目前「還在容器裡」的比例 0..1（＝密度，可直接拿來推壓力計）
   壓力   M5.pArrowAt(c,tipX,tipY,ang,len,o)（任意方向的大氣壓力箭頭：尖端在 (tipX,tipY)＝被壓的面，ang＝箭頭指向的方向(rad，y 向下)；
                    len＜28 自動改細箭頭；o：{ a, lw(6), col(珊瑚) }）
          M5.pressRing(c,cx,cy,r,o)（四面八方指向圓（球、管口）的壓力箭頭：n 支沿徑向；
                    o：{ n(16), ang0 第一支的位置角(rad，0＝右邊、y 向下), gap 尖端離圓面(6), len(46), lw(6), a, col,
                    out false＝從外往內壓；true＝在圓內從圓心往外推（尖端在 r－gap）, pulse 長度呼吸幅度(0.06), t, skip(ang)→true 不畫這支, grow 0..1 長出 }）
   杯子   M5.glass(c,o)（M4.cup 的玻璃杯，但液體可換顏色：o 同 M4.cup，另加 col 液體色(M4.PC.water)、edge 液面亮線色）→ 同 M4.cup 的回傳
   管子   M5.tube(c,pts,o)（沿折線的細管剖面（吸管、玻璃管），可畫一段液體從起點填到 fill：
                    o：{ hw 管內半寬(7), wall 壁厚(3), fill 液體長度 px(由 pts[0] 量起，0＝沒有), col 液體色, t 時間(液體內流動亮點), flow 0..1 亮點強度,
                    style 'straw'(白色條紋吸管，預設)|'glass'(透明玻璃), stripe 條紋色, a }）→ M5.poly(pts)
   錶     M5.halfGauge(c,cx,cy,r,o)（半圓指針錶（上半圓，左端 min、右端 max）：o：{ min(0), max(1), val, labels ['0','1 atm'] 兩端下方的字(22px),
                    title 錶下方的字(22px), a, from 拖尾起點值 }）→ { ang(v) }
   爆開   M5.burst(c,x,y,t,o)（「碰！」：t＝爆開後秒數，0～1.2 秒內閃光＋放射線＋字；o：{ text(L('碰！','BANG!')), col(黃), r(70), a }）
   馬德堡 M5.hemis(c,o)（兩個銅色空心半球（側視剖面，殼內看得到）＋接縫兩圈凸緣＋兩極拉環＋右半球頂端抽氣閥；
                    o：{ cx, cy, R(95), shell 殼厚(9), gap 兩半球分開的距離(0), dy 整顆上下抖動, a, valve true, inner 殼內底色透明度(0.55) }）
                    → { L:[cx,cy] 左半球圓心, Rt 右半球圓心, ringL, ringR 拉環中心, valve 閥口頂端 [x,y], valveIn 閥在殼內側的開口, R, clip(c) 加上兩個半球內部的子路徑 }；
                    M5.HEMI_VALVE＝閥的位置角；magde 建立（lab_magde 可重用）
          M5.horse(c,x,by,o)（簡化馬剪影（約 44×34 px）：x＝身體中線、by＝蹄底 y；o：{ dir 1 面向右|-1 面向左, s 縮放(1), lean 0..1 往前傾用力,
                    gait 步伐相位(rad), stride 0..1 腿擺動幅度, col 身體色, a, sweat 0..1 汗滴, t }）→ { collar:[x,y] 頸圈（拉繩接點）, tail:[x,y] }；magde 建立
   ================================================================== */
(function (root) {
  'use strict';
  if (!root.W5 || !root.M3 || !root.M4) return;
  const M5 = root.M5 = root.M5 || {};

  const TAU = Math.PI * 2;
  const COL = W5.COL, clamp01 = W5.clamp01, ease = W5.ease, lerp = W5.lerp, hash = W5.hash;

  /* ═══════════ 常數 ═══════════ */
  M5.ATM = 1033.6;
  M5.D = { water: 1, hg: 13.6 };
  M5.PC = {
    pressure: M4.PC.pressure, air: M4.PC.air, atm: M4.PC.atm, water: M4.PC.water, waterEdge: M4.PC.waterEdge,
    sea: '#8fcdf0', juice: '#8e5cd9', juiceEdge: '#c9a6ff', copper: '#c8743c', copperHi: '#f2b27a', copperDk: '#6e3a1a', hg: '#c9d1d6'
  };

  /* ═══════════ 折線 ═══════════ */
  M5.poly = function (pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1];
    const idx = s => { let i = 1; while (i < pts.length - 1 && cum[i] < s) i++; return i; };
    return {
      len, pts,
      at(s) {
        s = Math.max(0, Math.min(len, s)); if (pts.length < 2) return pts[0].slice();
        const i = idx(s), d = cum[i] - cum[i - 1] || 1, f = (s - cum[i - 1]) / d;
        return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
      },
      ang(s) {
        s = Math.max(0, Math.min(len, s)); if (pts.length < 2) return 0;
        const i = idx(s); return Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
      }
    };
  };

  /* ═══════════ 空氣 ═══════════ */
  M5.airSea = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || y1 - y0 < 4) return;
    const n = o.n || 120, seed = o.seed || 5, t = o.t || 0, dense = o.dense == null ? 0.6 : o.dense, r = o.r || 2.6;
    M4.withA(c, a, () => {
      c.save();
      if (o.fill !== false) {
        const g = c.createLinearGradient(0, y0, 0, y1), fa = o.fillA == null ? 0.16 : o.fillA;
        g.addColorStop(0, W5.rgba(M5.PC.sea, 0.02)); g.addColorStop(1, W5.rgba(M5.PC.sea, fa));
        c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      if (o.holes && o.holes.length) {
        c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0);
        o.holes.forEach(fn => fn(c));
        c.clip('evenodd');
      }
      c.fillStyle = W5.rgba(M5.PC.air, 0.7);
      /* 越往下越密：fy ＝ 1 －（1－u）^(1＋2·dense) 的反過來，讓點擠在下方 */
      const pw = 1 + 2 * dense;
      for (let i = 0; i < n; i++) {
        const fx = hash(seed + i * 1.73), fy = 1 - Math.pow(hash(seed + i * 2.91 + 7), pw), ph = TAU * hash(seed + i * 4.07);
        const x = x0 + (x1 - x0) * fx + 3 * Math.sin(t * 1.3 + ph), y = y0 + 4 + (y1 - y0 - 8) * fy + 2.4 * Math.cos(t * 1.1 + ph * 1.7);
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.restore();
    });
  };

  M5.gasDots = function (c, o) {
    const n = o.n || 30, seed = o.seed || 21, t = o.t || 0, r = o.r || 3.2, jig = o.jig == null ? 2.2 : o.jig;
    const frac = o.frac == null ? 0.9 : o.frac, k = clamp01(o.k || 0), mode = o.mode || 'out', win = o.win || 0.22;
    const a = o.a == null ? 1 : o.a;
    const PS = (o.paths || (o.path && o.path.length ? [o.path] : [])).map(M5.poly);
    /* 家的位置（比例 → 實際座標） */
    const home = i => {
      if (o.circle) {
        const [cx, cy, R] = o.circle, rr = R * Math.sqrt((i + 0.5) / n) * (0.92 + 0.08 * hash(seed + i * 5)), an = i * 2.39996 + hash(seed + i) * 0.6;
        return [cx + Math.cos(an) * rr, cy + Math.sin(an) * rr];
      }
      const [x0, y0, x1, y1] = o.box, cols = o.cols || Math.max(1, Math.round(Math.sqrt(n * (x1 - x0) / Math.max(1, y1 - y0)))), rows = Math.ceil(n / cols);
      const ci = i % cols, ri = Math.floor(i / cols);
      const fx = (ci + 0.5 + 0.7 * (hash(seed + i * 3) - 0.5)) / cols, fy = (ri + 0.5 + 0.7 * (hash(seed + i * 3 + 1) - 0.5)) / rows;
      return [x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy];
    };
    /* 哪些點會移動：依確定性亂數排序，排名在前 frac 的會動 */
    const order = []; for (let i = 0; i < n; i++) order.push([hash(seed + i * 7.31 + 3), i]);
    order.sort((p, q) => p[0] - q[0]);
    const rank = new Array(n); order.forEach((p, j) => { rank[p[1]] = j / n; });
    let inside = 0;
    M4.withA(c, a, () => {
      c.save(); c.fillStyle = W5.rgba(o.col || M5.PC.air, 0.85);
      for (let i = 0; i < n; i++) {
        const ph = TAU * hash(seed + i * 3 + 2);
        const h = home(i), sh = o.shift ? o.shift(h[0], h[1]) : null;
        const hx = h[0] + (sh ? sh[0] : 0) + jig * Math.sin(t * 2.3 + ph), hy = h[1] + (sh ? sh[1] : 0) + jig * Math.cos(t * 1.9 + ph * 1.3);
        let x = hx, y = hy, al = 1, inBox = true;
        if (rank[i] < frac) {
          const st = (rank[i] / frac) * (1 - win);
          let q = clamp01((k - st) / win);
          if (mode === 'in') q = 1 - q;
          if (q > 0) {
            inBox = false;
            const P = PS.length ? PS[i % PS.length] : null, ex = P ? P.at(0) : [hx, hy];
            if (q < 0.35) { const f = ease(q / 0.35); x = lerp(hx, ex[0], f); y = lerp(hy, ex[1], f); }
            else if (P) { const p = P.at(P.len * (q - 0.35) / 0.65); x = p[0]; y = p[1]; }
            else { x = ex[0]; y = ex[1]; }
            al = q > 0.85 ? (1 - q) / 0.15 : 1;
          }
        }
        if (inBox) inside++;
        if (al <= 0.02) continue;
        c.globalAlpha = a * al;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.restore();
    });
    if (a <= 0.02) {   /* 沒畫也要回傳正確密度 */
      inside = 0;
      for (let i = 0; i < n; i++) {
        if (rank[i] >= frac) { inside++; continue; }
        const st = (rank[i] / frac) * (1 - win); let q = clamp01((k - st) / win); if (mode === 'in') q = 1 - q;
        if (q <= 0) inside++;
      }
    }
    return inside / n;
  };

  /* ═══════════ 壓力箭頭 ═══════════ */
  M5.pArrowAt = function (c, tipX, tipY, ang, len, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || len < 2) return;
    const col = o.col || M5.PC.pressure, ux = Math.cos(ang), uy = Math.sin(ang);
    const x0 = tipX - ux * len, y0 = tipY - uy * len;
    if (len >= 28) { M3.arrowFx(c, x0, y0, tipX, tipY, col, a, o.lw || 6, 0); return; }
    M4.withA(c, a, () => {
      const lw = Math.min(o.lw || 3, 3.5), head = Math.max(6, Math.min(9, len * 0.6));
      W5.arrow(c, x0, y0, tipX, tipY, 'rgba(11,26,21,0.85)', lw + 3, head + 2);
      W5.arrow(c, x0, y0, tipX, tipY, col, lw, head);
    });
  };
  M5.pressRing = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const n = o.n || 16, a0 = o.ang0 || 0, gap = o.gap == null ? 6 : o.gap, len0 = o.len || 46, pulse = o.pulse == null ? 0.06 : o.pulse;
    const t = o.t || 0, g = o.grow == null ? 1 : clamp01(o.grow);
    for (let i = 0; i < n; i++) {
      const th = a0 + i * TAU / n;
      if (o.skip && o.skip(((th % TAU) + TAU) % TAU)) continue;
      const len = len0 * g * (1 + pulse * Math.sin(t * 3.2 + i * 1.7));
      if (o.out) {
        const rr = r - gap; M5.pArrowAt(c, cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, th, len, { a, lw: o.lw, col: o.col });
      } else {
        const rr = r + gap; M5.pArrowAt(c, cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, th + Math.PI, len, { a, lw: o.lw, col: o.col });
      }
    }
  };

  /* ═══════════ 杯子（液體可換顏色） ═══════════ */
  M5.glass = function (c, o) {
    const col = o.col || M5.PC.water, edge = o.edge || M5.PC.waterEdge, a = o.a == null ? 1 : o.a;
    const cx = o.cx, bot = o.bot, rim = o.rim, rb = o.rb, rt = o.rt, t = o.t || 0, wob = o.wob == null ? 1.6 : o.wob;
    const H = bot - rim, half = y => rb + (rt - rb) * (bot - y) / H, lv = o.level == null ? bot : o.level;
    const surf = x => lv + wob * Math.sin((x - cx) * 0.075 + t * 3.1) * 0.6 + wob * Math.sin((x - cx) * 0.031 - t * 1.7) * 0.4;
    if (a > 0.02 && lv < bot - 0.5) M4.withA(c, a, () => {
      c.save();
      const hl = half(lv), xa = cx - hl, xb = cx + hl;
      c.beginPath(); c.moveTo(cx - rb, bot); c.lineTo(xa, surf(xa));
      for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, surf(x));
      c.lineTo(xb, surf(xb)); c.lineTo(cx + rb, bot); c.closePath();
      const g = c.createLinearGradient(0, lv, 0, bot);
      g.addColorStop(0, W5.rgba(col, 0.62)); g.addColorStop(1, W5.mix(col, '#0b1a15', 0.35));
      c.fillStyle = g; c.fill();
      if (o.glow) { c.shadowColor = W5.rgba(edge, 0.9 * o.glow); c.shadowBlur = 14 * o.glow; }
      c.strokeStyle = edge; c.lineWidth = 3 + 1.5 * (o.glow || 0); c.lineCap = 'round';
      c.beginPath(); c.moveTo(xa + 1.5, surf(xa)); for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, surf(x)); c.lineTo(xb - 1.5, surf(xb)); c.stroke();
      c.restore();
    });
    const res = M4.cup(c, Object.assign({}, o, { level: bot, glow: 0 }));
    res.level = lv; res.surf = surf;
    return res;
  };

  /* ═══════════ 細管（吸管、玻璃管） ═══════════ */
  M5.tube = function (c, pts, o) {
    o = o || {}; const P = M5.poly(pts), a = o.a == null ? 1 : o.a;
    if (a <= 0.02) return P;
    const hw = o.hw || 7, wl = o.wall || 3, glass = o.style === 'glass';
    const fill = Math.max(0, Math.min(P.len, o.fill || 0)), col = o.col || M5.PC.water;
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
    M4.withA(c, a, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
      /* 外壁 */
      path(); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 2 * (hw + wl) + 3; c.stroke();
      path(); c.strokeStyle = glass ? 'rgba(220,240,250,0.55)' : '#eef3f2'; c.lineWidth = 2 * (hw + wl); c.stroke();
      if (!glass) {   /* 吸管的斜條紋：用虛線畫在外壁上 */
        path(); c.strokeStyle = o.stripe || '#ff8fb3'; c.lineWidth = 2 * (hw + wl); c.setLineDash([7, 11]); c.stroke(); c.setLineDash([]);
      }
      /* 管內（空氣：深色半透明） */
      path(); c.strokeStyle = glass ? 'rgba(13,32,26,0.78)' : 'rgba(13,32,26,0.82)'; c.lineWidth = 2 * hw; c.stroke();
      /* 液體 */
      if (fill > 0.5) {
        path(); c.strokeStyle = col; c.lineWidth = 2 * hw; c.setLineDash([fill, P.len + 10]); c.stroke(); c.setLineDash([]);
        const fa = o.flow == null ? 0 : o.flow;
        if (fa > 0.02) {
          c.strokeStyle = W5.rgba('#ffffff', 0.55 * fa); c.lineWidth = Math.max(2, hw * 0.55); c.lineCap = 'round';
          const off = ((o.t || 0) * 90) % 26;
          for (let d = off; d < fill - 4; d += 26) {
            const p = P.at(d), q = P.at(Math.min(fill - 2, d + 9));
            c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
          }
          c.lineCap = 'butt';
        }
        /* 液面亮線（液體前緣） */
        const e = P.at(fill), an = P.ang(fill), nx = -Math.sin(an), ny = Math.cos(an);
        c.strokeStyle = W5.mix(col, '#ffffff', 0.55); c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(e[0] + nx * (hw - 1), e[1] + ny * (hw - 1)); c.lineTo(e[0] - nx * (hw - 1), e[1] - ny * (hw - 1)); c.stroke();
      }
      /* 管壁高光 */
      c.save(); c.translate(-hw - wl * 0.5 + 1, 0);
      path(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.4; c.stroke();
      c.restore();
      c.restore();
    });
    return P;
  };

  /* ═══════════ 半圓錶 ═══════════ */
  M5.halfGauge = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, mn = o.min || 0, mx = o.max == null ? 1 : o.max;
    const ang = v => Math.PI + Math.PI * clamp01((v - mn) / (mx - mn));
    const res = { ang };
    if (a <= 0.02) return res;
    M4.withA(c, a, () => {
      c.save();
      /* 外殼＋錶面（上半圓＋底邊） */
      c.fillStyle = '#6f7d86';
      c.beginPath(); c.arc(cx, cy, r + 6, Math.PI, TAU); c.lineTo(cx + r + 6, cy + 8); c.lineTo(cx - r - 6, cy + 8); c.closePath(); c.fill();
      const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.5, 4, cx, cy, r * 1.1);
      g.addColorStop(0, '#f6f3ea'); g.addColorStop(1, '#c9d3d9');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, Math.PI, TAU); c.closePath(); c.fill();
      /* 刻度：10 格 */
      c.strokeStyle = '#3a4a52'; c.lineCap = 'round';
      for (let i = 0; i <= 10; i++) {
        const q = Math.PI + Math.PI * i / 10, big = i % 5 === 0;
        c.lineWidth = big ? 3 : 2; c.beginPath();
        c.moveTo(cx + Math.cos(q) * r * (big ? 0.72 : 0.8), cy + Math.sin(q) * r * (big ? 0.72 : 0.8));
        c.lineTo(cx + Math.cos(q) * r * 0.92, cy + Math.sin(q) * r * 0.92); c.stroke();
      }
      if (o.from != null && Math.abs(o.from - o.val) > (mx - mn) * 0.01) {
        const p = ang(o.from), q = ang(o.val);
        c.strokeStyle = W5.rgba(COL.coral, 0.55); c.lineWidth = 7; c.lineCap = 'butt';
        c.beginPath(); c.arc(cx, cy, r * 0.6, Math.min(p, q), Math.max(p, q)); c.stroke();
      }
      const q = ang(o.val);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(q) * r * 0.82, cy + Math.sin(q) * r * 0.82); c.stroke();
      c.strokeStyle = COL.coral; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(q) * r * 0.82, cy + Math.sin(q) * r * 0.82); c.stroke();
      c.fillStyle = '#3a4a52'; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
      c.restore();
    });
    const lb = o.labels || ['0', '1 atm'];
    M3.T(c, a, lb[0], cx - r + 2, cy + 26, COL.dim, 22, 'center', true);
    M3.T(c, a, lb[1], cx + r - 2, cy + 26, COL.dim, 22, 'center', true);
    if (o.title) M3.T(c, a, o.title, cx, cy + 56, COL.white, 22);
    return res;
  };

  /* ═══════════ 爆開 ═══════════ */
  M5.burst = function (c, x, y, t, o) {
    o = o || {}; const a = (o.a == null ? 1 : o.a); if (t < 0 || t > 1.4 || a <= 0.02) return;
    const col = o.col || COL.yellow, r = o.r || 70, f = clamp01(t / 0.25), fade = 1 - clamp01((t - 0.5) / 0.9);
    M4.withA(c, a * fade, () => {
      W5.glow(c, x, y, r * (1 + 1.4 * f), col, 0.6);
      c.save(); c.strokeStyle = col; c.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const an = i * TAU / 14 + 0.2, r0 = r * (0.35 + 0.9 * ease(clamp01(t / 0.6))), r1 = r0 + r * (0.35 + 0.25 * hash(i + 3)) * (1 - 0.5 * clamp01(t / 1.2));
        c.lineWidth = 4 - 2 * clamp01(t / 1.2);
        c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.stroke();
      }
      c.restore();
    });
    const sc = 1 + 0.4 * (1 - ease(clamp01(t / 0.3)));
    M3.T(c, a * fade, o.text || M4.L('碰！', 'BANG!'), x, y - r * 0.2, col, Math.round(40 * sc));
  };

  /* ═══════════ 馬德堡半球 ═══════════ */
  M5.HEMI_VALVE = -Math.PI / 2 + 0.5;                    /* 抽氣閥在右半球上的位置角（rad，y 向下） */
  M5.hemis = function (c, o) {
    const R = o.R || 95, sh = o.shell || 9, gap = o.gap || 0, cy = o.cy + (o.dy || 0), a = o.a == null ? 1 : o.a;
    const lx = o.cx - gap / 2, rx = o.cx + gap / 2;
    const FL = 9, FW = 7;                                  /* 凸緣：比殼多伸出 FL、厚 FW */
    const vAng = M5.HEMI_VALVE, vx = rx + Math.cos(vAng) * R, vy = cy + Math.sin(vAng) * R;
    const res = {
      L: [lx, cy], Rt: [rx, cy], R, ringL: [lx - R - 20, cy], ringR: [rx + R + 20, cy],
      valve: [vx + Math.cos(vAng) * 24, vy + Math.sin(vAng) * 24], valveIn: [rx + Math.cos(vAng) * (R - sh), cy + Math.sin(vAng) * (R - sh)],
      clip(cc) {
        cc.moveTo(lx, cy - R + sh); cc.arc(lx, cy, R - sh, -Math.PI / 2, Math.PI / 2, true); cc.closePath();
        cc.moveTo(rx, cy - R + sh); cc.arc(rx, cy, R - sh, -Math.PI / 2, Math.PI / 2, false); cc.closePath();
      }
    };
    if (a <= 0.02) return res;
    M4.withA(c, a, () => {
      c.save();
      /* 殼內：深色半透明（看得到裡面的分子） */
      c.fillStyle = W5.rgba('#0b1a15', o.inner == null ? 0.55 : o.inner);
      c.beginPath(); res.clip(c); c.fill();
      const half = (x, side) => {          /* side －1 左半球、＋1 右半球 */
        const a0 = side < 0 ? Math.PI / 2 : -Math.PI / 2, a1 = side < 0 ? 3 * Math.PI / 2 : Math.PI / 2;
        /* 殼（環形扇區） */
        const g = c.createLinearGradient(x - R, cy - R, x + R, cy + R);
        g.addColorStop(0, M5.PC.copperHi); g.addColorStop(0.45, M5.PC.copper); g.addColorStop(1, M5.PC.copperDk);
        c.fillStyle = g;
        c.beginPath(); c.arc(x, cy, R, a0, a1, false); c.arc(x, cy, R - sh, a1, a0, true); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(60,28,10,0.85)'; c.lineWidth = 1.6; c.stroke();
        /* 殼上高光 */
        c.strokeStyle = 'rgba(255,225,190,0.55)'; c.lineWidth = 2.2; c.lineCap = 'round';
        const h0 = side < 0 ? Math.PI * 1.12 : -Math.PI * 0.42, h1 = side < 0 ? Math.PI * 1.38 : -Math.PI * 0.16;
        c.beginPath(); c.arc(x, cy, R - sh * 0.45, h0, h1); c.stroke();
        /* 凸緣（接縫處的一圈厚邊） */
        const fx = side < 0 ? x - FW : x;
        const fg = c.createLinearGradient(fx, 0, fx + FW, 0); fg.addColorStop(0, M5.PC.copperHi); fg.addColorStop(1, M5.PC.copperDk);
        c.fillStyle = fg;
        [[cy - R - FL, cy - R + sh + 2], [cy + R - sh - 2, cy + R + FL]].forEach(([y0, y1]) => {
          W5.rr(c, fx, y0, FW, y1 - y0, 2); c.fill(); c.strokeStyle = 'rgba(60,28,10,0.85)'; c.lineWidth = 1.4; c.stroke();
        });
        /* 拉環（極點外側） */
        const px = x + side * R, rx0 = px + side * 20;
        c.strokeStyle = '#7a8790'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(px, cy); c.lineTo(px + side * 8, cy); c.stroke();
        c.strokeStyle = '#b9c5cc'; c.lineWidth = 5; c.beginPath(); c.arc(rx0, cy, 11, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(rx0, cy, 11, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
      };
      half(lx, -1); half(rx, 1);
      /* 抽氣閥（右半球頂端）：短管＋閥柄 */
      if (o.valve !== false) {
        c.save(); c.translate(vx, vy); c.rotate(vAng + Math.PI / 2);
        c.fillStyle = '#9aa6ab'; c.fillRect(-5, -24, 10, 26);
        c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.4; c.strokeRect(-5, -24, 10, 26);
        c.fillStyle = '#4dd2ff'; W5.rr(c, -12, -16, 24, 6, 3); c.fill();
        c.restore();
      }
      c.restore();
    });
    return res;
  };

  /* ═══════════ 馬（簡化剪影） ═══════════ */
  M5.horse = function (c, x, by, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, d = o.dir || 1, s = o.s || 1, lean = clamp01(o.lean || 0);
    const gait = o.gait || 0, st = o.stride == null ? 0 : o.stride, col = o.col || '#8a5a35';
    const dk = W5.mix(col, '#0b1a15', 0.45), lt = W5.mix(col, '#ffffff', 0.18);
    const rot = -0.16 * lean;                                /* 往前傾：繞後蹄轉（面向右時往右下） */
    /* 局部座標（面向右、蹄底 y＝0）→ 畫面座標 */
    const pivotX = -10;
    const tf = (px, py) => {
      const qx = px - pivotX, qy = py, cs = Math.cos(-rot), sn = Math.sin(-rot);
      const rx = pivotX + qx * cs - qy * sn, ry = qx * sn + qy * cs;
      return [x + d * rx * s, by + ry * s];
    };
    const res = { collar: tf(11, -21), tail: tf(-15, -22) };
    if (a <= 0.02) return res;
    M4.withA(c, a, () => {
      c.save(); c.translate(x, by); c.scale(d * s, s);
      /* 影子 */
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse(0, 1, 22, 3.5, 0, 0, TAU); c.fill();
      c.translate(pivotX, 0); c.rotate(-rot); c.translate(-pivotX, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      /* 腿：後兩、前兩（遠側較暗） */
      const leg = (hx, ph, far) => {
        const sw = st * 0.42 * Math.sin(gait + ph);
        const kx = hx + Math.sin(sw) * 7, ky = -7, fx = hx + Math.sin(sw) * 12 + (lean * 3), fy = 0;
        c.strokeStyle = far ? dk : col; c.lineWidth = 3.6;
        c.beginPath(); c.moveTo(hx, -15); c.lineTo(kx, ky); c.lineTo(fx, fy - 1); c.stroke();
        c.fillStyle = '#2b2420'; c.fillRect(fx - 2.4, fy - 2.5, 4.8, 2.5);
      };
      leg(-9, Math.PI, true); leg(9, 0, true);
      /* 身體 */
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, -20, 15, 7.5, 0, 0, TAU); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(-2, -23.5, 10, 2.5, 0, 0, TAU); c.fill();
      leg(-12, 0, false); leg(7, Math.PI, false);
      /* 尾巴 */
      c.strokeStyle = dk; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-14, -23); c.quadraticCurveTo(-21, -20, -19, -11); c.stroke();
      /* 脖子＋頭（用力時頭壓低） */
      const hd = 4 * lean;
      c.fillStyle = col;
      c.beginPath(); c.moveTo(9, -25); c.lineTo(16, -33 + hd); c.lineTo(21, -30 + hd); c.lineTo(14, -18); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(21, -29 + hd, 6.5, 3.6, 0.45, 0, TAU); c.fill();
      /* 耳朵、鬃毛、眼睛 */
      c.fillStyle = dk;
      c.beginPath(); c.moveTo(16, -34 + hd); c.lineTo(17, -38 + hd); c.lineTo(19, -33 + hd); c.closePath(); c.fill();
      c.strokeStyle = dk; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(10, -27); c.lineTo(16, -34 + hd); c.stroke();
      c.fillStyle = '#f6f3ea'; c.beginPath(); c.arc(20, -31 + hd, 0.9, 0, TAU); c.fill();
      /* 頸圈（拉繩接點） */
      c.strokeStyle = '#e2c27a'; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(10, -27); c.lineTo(14, -18); c.stroke();
      c.restore();
      /* 汗滴（畫面座標，不跟著鏡像變形） */
      const sw = clamp01(o.sweat || 0);
      if (sw > 0.02) {
        c.save(); c.fillStyle = W5.rgba('#9fdcff', 0.9 * sw);
        for (let i = 0; i < 2; i++) {
          const q = (((o.t || 0) * 0.9 + i * 0.5 + hash(x) * 0.7) % 1);
          const p = tf(17 - i * 4, -40 + q * 14);
          c.globalAlpha = sw * (1 - q);
          c.beginPath(); c.moveTo(p[0], p[1] - 4); c.quadraticCurveTo(p[0] + 3, p[1] + 1, p[0], p[1] + 2); c.quadraticCurveTo(p[0] - 3, p[1] + 1, p[0], p[1] - 4); c.fill();
        }
        c.restore();
      }
    });
    return res;
  };
})(window);

/* ==================================================================
   M5 新增（torr 建立；tilt、water 沿用）：托里切利實驗的水銀槽、氣壓計玻璃管、垂直尺寸標、空氣柱
   ── 速查 ──
   水銀槽 M5.trough(c,o)（側視剖面的槽＋液體：o：{ x0,x1 內壁 x, bot 內底 y, top 槽口 y, level 液面 y, wall 壁厚(6),
                    col 液體色(M5.PC.hg), edge 液面亮線色('#f4f8fa'), t 時間(液面微波), wob 波幅(1.2), a }）→ { x0,x1,bot,top,level, surf(x) }
          M5.liqFill(col, c, x0, y0, x1, y1)（液體填色：水銀＝銀灰金屬漸層、其他＝半透明；給自己畫液柱用）→ fillStyle
   玻璃管 M5.baroTube(c,o)（一端封閉的玻璃管（剖面），可任意旋轉；液體＝「管內 ∩ 世界座標 y ≥ level」→ 傾斜時液面仍是水平的；
                    o：{ x,y 管口中心, len 管長 px（管口→封閉端外頂）, ang 旋轉角(rad；0＝封閉端朝正上、正值＝往右倒（順時針）、π＝開口朝上),
                    hw 管內半寬(10), wall 壁厚(4), level 液面 y（null／-Infinity＝整管裝滿、Infinity＝空管）, col 液體色(M5.PC.hg), edge 液面亮線色,
                    bulge 液面彎曲 px（正＝往上凸，水銀；負＝往下凹，水；預設依 col）, gas 管頂空氣分子 { n(14), seed, t, r(3) }（null＝真空，只畫玻璃）, a }）
                    → { at(s) 管口沿軸 s px 的點, ux,uy 管口→封閉端的單位向量, top 封閉端內頂點, levelX 液面與管軸交點 x（無液面＝null）, hw, wall }
   尺寸   M5.dimV(c,x,y0,y1,text,o)（垂直尺寸標：兩端短橫線＋雙箭頭直線＋中間 pill；o：{ col(黃), a, g 由 y0 往 y1 長出 0..1(1), ty 字的 y(中點), size(22), lw(3) }）→ pill 外框
   空氣柱 M5.airCol(c,x0,y0,x1,y1,o)（一根「頭上的空氣柱」：淡藍漸層＋分子點＋左右虛線邊（上端淡出）；o：{ n 點數(依高度), seed, t, dense 下密上疏(0.6),
                    fillA(0.3), a, dash 邊線流動(true) }）
   ================================================================== */
(function (root) {
  'use strict';
  if (!root.W5 || !root.M3 || !root.M4 || !root.M5) return;
  const M5 = root.M5, TAU = Math.PI * 2;
  const COL = W5.COL, clamp01 = W5.clamp01, lerp = W5.lerp, hash = W5.hash;
  const isHg = col => !col || col === M5.PC.hg;

  M5.liqFill = function (col, c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    if (isHg(col)) { g.addColorStop(0, '#dfe6ea'); g.addColorStop(0.3, '#c9d3d8'); g.addColorStop(0.7, '#9eaab3'); g.addColorStop(1, '#75828c'); }
    else { g.addColorStop(0, W5.rgba(col, 0.62)); g.addColorStop(1, W5.mix(col, '#0b1a15', 0.3)); }
    return g;
  };

  /* ═══════════ 水銀槽 ═══════════ */
  M5.trough = function (c, o) {
    const x0 = o.x0, x1 = o.x1, bot = o.bot, top = o.top, lv = o.level, wl = o.wall || 6, a = o.a == null ? 1 : o.a;
    const col = o.col || M5.PC.hg, edge = o.edge || (isHg(col) ? '#f4f8fa' : M5.PC.waterEdge);
    const wob = o.wob == null ? 1.2 : o.wob, t = o.t || 0;
    const surf = x => lv + wob * Math.sin((x - x0) * 0.07 + t * 3.1) * 0.6 + wob * Math.sin((x - x0) * 0.029 - t * 1.7) * 0.4;
    const res = { x0, x1, bot, top, level: lv, surf };
    if (a <= 0.02) return res;
    M4.withA(c, a, () => {
      c.save();
      /* 液體 */
      c.beginPath(); c.moveTo(x0, bot);
      for (let x = x0; x <= x1; x += 4) c.lineTo(x, surf(x));
      c.lineTo(x1, surf(x1)); c.lineTo(x1, bot); c.closePath();
      c.fillStyle = M5.liqFill(col, c, 0, lv, 0, bot); c.fill();
      if (isHg(col)) {                                   /* 水銀的金屬反光：兩道淡白橫紋 */
        c.save(); c.clip();
        c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 2;
        [0.35, 0.68].forEach((f, i) => { const y = lerp(lv, bot, f); c.beginPath(); c.moveTo(x0 + 20 + 14 * i, y); c.lineTo(x1 - 40 - 20 * i, y + 2); c.stroke(); });
        c.restore();
      }
      c.strokeStyle = edge; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); for (let x = x0; x <= x1; x += 4) (x === x0 ? c.moveTo(x, surf(x)) : c.lineTo(x, surf(x))); c.lineTo(x1, surf(x1)); c.stroke();
      /* 槽壁（玻璃，剖面） */
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = wl + 3; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x0 - wl / 2, top); c.lineTo(x0 - wl / 2, bot + wl / 2); c.lineTo(x1 + wl / 2, bot + wl / 2); c.lineTo(x1 + wl / 2, top); c.stroke();
      c.strokeStyle = 'rgba(200,236,255,0.88)'; c.lineWidth = wl;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0 - wl + 1, top + 4); c.lineTo(x0 - wl + 1, bot); c.stroke();
      c.restore();
    });
    return res;
  };

  /* ═══════════ 氣壓計玻璃管 ═══════════ */
  M5.baroTube = function (c, o) {
    const x = o.x, y = o.y, len = o.len, ang = o.ang || 0, hw = o.hw || 10, wl = o.wall || 4, a = o.a == null ? 1 : o.a;
    const col = o.col || M5.PC.hg, hg = isHg(col), edge = o.edge || (hg ? '#f6f9fa' : M5.PC.waterEdge);
    const ux = Math.sin(ang), uy = -Math.cos(ang), cs = Math.cos(ang);
    const at = s => [x + ux * s, y + uy * s];
    const lv = o.level == null ? -Infinity : o.level;
    /* 液面與管軸的交點（只有管子不是水平、而且液面落在管內時才有） */
    let levelX = null;
    if (isFinite(lv) && Math.abs(uy) > 0.05) { const s = (lv - y) / uy; if (s > -hw && s < len + hw) levelX = x + ux * s; }
    const res = { at, ux, uy, top: at(len), levelX, hw, wall: wl };
    if (a <= 0.02) return res;
    const inner = cc => { cc.beginPath(); cc.moveTo(-hw, 0); cc.lineTo(-hw, -len + hw); cc.arc(0, -len + hw, hw, Math.PI, TAU); cc.lineTo(hw, 0); cc.closePath(); };
    M4.withA(c, a, () => {
      c.save(); c.translate(x, y); c.rotate(ang);
      /* 管內底色：真空／空氣＝深色（畫得「空」） */
      inner(c); c.fillStyle = 'rgba(9,22,18,0.86)'; c.fill();
      c.save(); inner(c); c.clip();
      /* 液體：回到世界座標，填 y ≥ level 的部分 */
      if (lv < Infinity) {
        c.save(); c.rotate(-ang); c.translate(-x, -y);
        const px = Math.cos(ang), py = Math.sin(ang);                 /* 垂直於管軸的方向（世界座標） */
        c.fillStyle = M5.liqFill(col, c, x - px * hw, y - py * hw, x + px * hw, y + py * hw);
        const W = hw / Math.max(0.2, Math.abs(cs)) + 2, bl = o.bulge == null ? (hg ? 4 : -3) : o.bulge;
        if (!isFinite(lv)) { c.fillRect(0, -50, 960, 700); }
        else {
          const xc = levelX == null ? x : levelX;
          c.beginPath(); c.moveTo(xc - W - 400, lv); c.lineTo(xc - W, lv);
          c.quadraticCurveTo(xc, lv - 2 * bl, xc + W, lv); c.lineTo(xc + W + 400, lv); c.lineTo(xc + W + 400, 900); c.lineTo(xc - W - 400, 900); c.closePath();
          c.fill();
          c.strokeStyle = edge; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(xc - W, lv); c.quadraticCurveTo(xc, lv - 2 * bl, xc + W, lv); c.stroke();
        }
        c.restore();
      }
      /* 管頂空氣分子（只畫在液面以上） */
      if (o.gas) {
        const g = o.gas, n = g.n || 14, sd = g.seed || 13, t = g.t || 0, r = g.r || 3;
        const sLv = lv === Infinity ? 0 : !isFinite(lv) ? len : Math.abs(uy) > 0.05 ? Math.max(0, Math.min(len, (lv - y) / uy)) : len;
        const span = Math.max(0, len - sLv - 2 * r - 4);
        c.fillStyle = W5.rgba(M5.PC.air, 0.9);
        for (let i = 0; i < n; i++) {
          const fx = hash(sd + i * 1.37) * 2 - 1, fy = hash(sd + i * 2.71 + 5), ph = TAU * hash(sd + i * 3.3);
          const lx = fx * (hw - r - 1) + 1.5 * Math.sin(t * 2.6 + ph), ly = -len + r + 2 + fy * span + 1.5 * Math.cos(t * 2.1 + ph);
          const wx = x + lx * Math.cos(ang) - ly * Math.sin(ang), wy = y + lx * Math.sin(ang) + ly * Math.cos(ang);
          if (wy > lv - r - 3 + (hg ? -4 : 0)) continue;
          c.beginPath(); c.arc(lx, ly, r, 0, TAU); c.fill();
        }
      }
      c.restore();
      /* 玻璃壁 */
      const wall = (cc, d) => { cc.beginPath(); cc.moveTo(-d, 0); cc.lineTo(-d, -len + hw); cc.arc(0, -len + hw, d, Math.PI, TAU); cc.lineTo(d, 0); };
      c.lineJoin = 'round'; c.lineCap = 'butt';
      wall(c, hw + wl / 2); c.strokeStyle = 'rgba(11,26,21,0.65)'; c.lineWidth = wl + 3; c.stroke();
      wall(c, hw + wl / 2); c.strokeStyle = 'rgba(200,236,255,0.92)'; c.lineWidth = wl; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(-hw + 3, -8); c.lineTo(-hw + 3, -len + hw + 4); c.stroke();
      c.restore();
    });
    return res;
  };

  /* ═══════════ 垂直尺寸標 ═══════════ */
  M5.dimV = function (c, x, y0, y1, text, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || COL.yellow, g = o.g == null ? 1 : clamp01(o.g);
    if (a <= 0.02 || g <= 0.01) return null;
    const ye = lerp(y0, y1, g), lw = o.lw || 3;
    M4.withA(c, a, () => {
      c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 9, y0); c.lineTo(x + 9, y0); c.stroke();
      if (g > 0.98) { c.beginPath(); c.moveTo(x - 9, y1); c.lineTo(x + 9, y1); c.stroke(); }
      const d = Math.sign(y1 - y0) || 1;
      W5.arrow(c, x, (y0 + ye) / 2, x, y0 + d * 1, col, lw, 12);
      W5.arrow(c, x, (y0 + ye) / 2, x, ye - d * 1, col, lw, 12);
      c.restore();
    });
    if (!text || g < 0.98) return null;
    return M3.P(c, a, text, x, o.ty == null ? (y0 + y1) / 2 : o.ty, col, o.size || 22, 'center', true);
  };

  /* ═══════════ 空氣柱 ═══════════ */
  M5.airCol = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || y1 - y0 < 4) return;
    const n = o.n || Math.max(6, Math.round((y1 - y0) * (x1 - x0) / 260));
    M4.withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, W5.rgba(M5.PC.sea, 0)); g.addColorStop(1, W5.rgba(M5.PC.sea, o.fillA == null ? 0.3 : o.fillA));
      c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      const sg = c.createLinearGradient(0, y0, 0, y1); sg.addColorStop(0, W5.rgba(M5.PC.sea, 0)); sg.addColorStop(0.25, W5.rgba(M5.PC.sea, 0.9));
      c.strokeStyle = sg; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = o.dash === false ? 0 : -(o.t || 0) * 12;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
      c.restore();
    });
    M5.airSea(c, x0 + 2, y0, x1 - 2, y1, { n, seed: o.seed || 17, t: o.t || 0, dense: o.dense == null ? 0.6 : o.dense, fill: false, r: o.r || 2.6, a });
  };
})(window);

/* ==================================================================
   M5 新增（crown 建立；archi、cao 沿用）：溢水杯、出水口水流、量筒、平台磅秤、素材圖預載
   ── 速查 ──
   圖     M5.img(src)（預載＋快取一張圖；載入完回傳 Image，還沒好回傳 null → 呼叫端先畫程式版，不畫空框）
   溢水杯 M5.overflowCan(c,o)（側視剖面的直筒溢水杯：右壁靠近杯口有一支往右下斜的出水管；水一直裝到出水管口（溢水高度）；
                    o：{ x0,x1 內壁 x, bot 內底 y, rim 杯口 y, spY 出水管中心 y（在右壁上）, spLen 出水管長(46), spDrop 管口比管根低多少(10),
                    spR 出水管內半徑(5), level 水面 y（預設＝出水管內底，＝裝滿）, wall 壁厚(6), base 杯底厚(10), flow 0..1 出水管裡有水在流,
                    t 時間(水面微波), wob 波幅(1.2), a, front(c) 在水與玻璃之間畫的東西（例：泡在水裡的物體，會被水染色）}）
                    → { x0,x1,bot,rim,level, surf(x), lip:[x,y] 出水管口下緣（水從這裡落下）, outBot 杯底外緣 y }
   水流   M5.spill(c,o)（從出水管口落下的一道拋物線水流＋落點漣漪：o：{ x,y 管口, dx 落點的水平距離(px), landY 落點 y, f 0..1 水量（粗細、透明度）,
                    w 最粗寬(6), t, a, col(M4.PC.water), splash(true) }）→ { xl 落點 x }
   量筒   M5.cylinder(c,o)（側視量筒（細長玻璃筒＋底座＋刻度）：o：{ cx, bot 內底 y, hw 內半寬(20), k px/mL, max 刻度上限 mL(150), rim 筒口 y(預設高出 max 10 px),
                    vol 水量 mL, minor 小刻度(10), major 大刻度(50), labels 大刻度數字(false；22px 畫在筒右邊), unit 最上面數字後的單位('mL'),
                    t, wob(1), a, hi:[v0,v1] 這段水塗亮(黃，閃), hiA(1), col(M4.PC.water) }）→ { y(v) 該 mL 的液面 y, x0,x1 內壁, outR 外壁右緣 x, rim }
   磅秤   M5.platScale(c,o)（平台磅秤（側視）：底座＋上平台＋前面一塊電子顯示；o：{ cx, by 底座底面 y, w 平台寬(160), h 底座高(28),
                    text 顯示字(22px 等寬), col 顯示字色(黃), dispW 顯示窗寬(依字寬), a, glow 0..1 顯示窗發亮 }）→ { top 平台頂面 y, x0, x1 }
   ================================================================== */
(function (root) {
  'use strict';
  if (!root.W5 || !root.M3 || !root.M4 || !root.M5) return;
  const M5 = root.M5, TAU = Math.PI * 2;
  const COL = W5.COL, clamp01 = W5.clamp01, lerp = W5.lerp;

  /* ═══════════ 素材圖預載 ═══════════ */
  const IMG = {};
  M5.img = function (src) {
    let im = IMG[src];
    if (!im) { im = new Image(); im.src = src; IMG[src] = im; }
    return im.complete && im.naturalWidth ? im : null;
  };

  /* ═══════════ 溢水杯 ═══════════ */
  M5.overflowCan = function (c, o) {
    const x0 = o.x0, x1 = o.x1, bot = o.bot, rim = o.rim, wl = o.wall || 6, bs = o.base || 10, a = o.a == null ? 1 : o.a;
    const spY = o.spY, spLen = o.spLen || 46, spDrop = o.spDrop == null ? 10 : o.spDrop, spR = o.spR || 5;
    const lv = o.level == null ? spY + spR : o.level, t = o.t || 0, wob = o.wob == null ? 1.2 : o.wob;
    const surf = x => lv + wob * Math.sin((x - x0) * 0.075 + t * 3.1) * 0.6 + wob * Math.sin((x - x0) * 0.031 - t * 1.7) * 0.4;
    const ox = x1 + wl, tipX = ox + spLen, tipY = spY + spDrop;
    const res = { x0, x1, bot, rim, level: lv, surf, lip: [tipX + 1, tipY + spR], outBot: bot + bs };
    if (a <= 0.02) return res;
    M4.withA(c, a, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      /* 影子、杯內淡玻璃色 */
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse((x0 + x1) / 2, bot + bs + 2, (x1 - x0) / 2 + wl + 14, 5, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(200,230,245,0.05)'; c.fillRect(x0, rim, x1 - x0, bot - rim);
      if (o.front) o.front(c);
      /* 水 */
      c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0, surf(x0));
      for (let x = x0 + 4; x < x1; x += 4) c.lineTo(x, surf(x));
      c.lineTo(x1, surf(x1)); c.lineTo(x1, bot); c.closePath();
      const g = c.createLinearGradient(0, lv, 0, bot);
      g.addColorStop(0, W5.rgba(o.col || M4.PC.water, 0.40)); g.addColorStop(1, W5.rgba('#1a60a8', 0.6));
      c.fillStyle = g; c.fill();
      c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x0 + 1.5, surf(x0)); for (let x = x0 + 4; x < x1; x += 4) c.lineTo(x, surf(x)); c.lineTo(x1 - 1.5, surf(x1)); c.stroke();
      /* 出水管：管內（有水流時是水色） */
      const tube = (w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x1 - 1, spY); c.lineTo(tipX, tipY); c.stroke(); };
      tube(2 * spR + 2 * 3 + 3, 'rgba(11,26,21,0.6)');
      tube(2 * spR + 2 * 3, 'rgba(210,236,250,0.75)');
      tube(2 * spR, 'rgba(13,32,26,0.8)');
      const fl = clamp01(o.flow || 0);
      if (fl > 0.02) {
        tube(2 * spR, W5.rgba(M4.PC.water, 0.35 + 0.5 * fl));
        c.save(); c.strokeStyle = W5.rgba('#ffffff', 0.6 * fl); c.lineWidth = 2; c.setLineDash([5, 8]); c.lineDashOffset = -t * 40;
        c.beginPath(); c.moveTo(x1, spY); c.lineTo(tipX, tipY); c.stroke(); c.restore();
      }
      /* 玻璃：左右壁＋杯底 */
      const outline = () => {
        c.beginPath(); c.moveTo(x0 - wl, rim); c.lineTo(x0 - wl, bot + bs - 4); c.quadraticCurveTo(x0 - wl, bot + bs, x0 - wl + 4, bot + bs);
        c.lineTo(x1 + wl - 4, bot + bs); c.quadraticCurveTo(x1 + wl, bot + bs, x1 + wl, bot + bs - 4); c.lineTo(x1 + wl, rim);
        c.lineTo(x1, rim); c.lineTo(x1, bot); c.lineTo(x0, bot); c.lineTo(x0, rim); c.closePath();
      };
      outline();
      const gg = c.createLinearGradient(x0 - wl, 0, x1 + wl, 0);
      gg.addColorStop(0, 'rgba(225,244,252,0.55)'); gg.addColorStop(0.5, 'rgba(200,228,242,0.30)'); gg.addColorStop(1, 'rgba(170,205,222,0.45)');
      c.fillStyle = gg; c.fill();
      c.strokeStyle = 'rgba(232,246,255,0.85)'; c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x0 + 5, rim + 10); c.lineTo(x0 + 5, bot - 8); c.stroke();
      /* 出水管口的環 */
      c.strokeStyle = 'rgba(232,246,255,0.9)'; c.lineWidth = 2;
      const ang = Math.atan2(tipY - spY, tipX - x1), nx = -Math.sin(ang), ny = Math.cos(ang);
      c.beginPath(); c.moveTo(tipX + nx * (spR + 3), tipY + ny * (spR + 3)); c.lineTo(tipX - nx * (spR + 3), tipY - ny * (spR + 3)); c.stroke();
      c.restore();
    });
    return res;
  };

  /* ═══════════ 出水管落下的水流 ═══════════ */
  M5.spill = function (c, o) {
    const x0 = o.x, y0 = o.y, dx = o.dx == null ? 24 : o.dx, y1 = o.landY, f = clamp01(o.f == null ? 1 : o.f), a = o.a == null ? 1 : o.a;
    const res = { xl: x0 + dx };
    if (a <= 0.02 || f <= 0.02 || y1 <= y0) return res;
    const col = o.col || M4.PC.water, w = (o.w || 6) * (0.35 + 0.65 * f), t = o.t || 0;
    /* x ＝ x0 ＋ dx·q、y ＝ y0 ＋ (y1－y0)·q²（q 0..1）：出口水平、越落越陡 */
    const P = q => [x0 + dx * q, y0 + (y1 - y0) * q * q];
    M4.withA(c, a * (0.5 + 0.5 * f), () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => { c.beginPath(); for (let i = 0; i <= 24; i++) { const p = P(i / 24); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } };
      path(); c.strokeStyle = W5.rgba(col, 0.85); c.lineWidth = w; c.stroke();
      path(); c.strokeStyle = W5.rgba('#ffffff', 0.55); c.lineWidth = Math.max(1.2, w * 0.3); c.setLineDash([6, 10]); c.lineDashOffset = -t * 70; c.stroke(); c.setLineDash([]);
      if (o.splash !== false) {
        c.strokeStyle = W5.rgba(M4.PC.waterEdge, 0.8 * f); c.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          const q = ((t * 1.6 + i * 0.5) % 1), rw = 4 + 12 * q;
          c.globalAlpha = a * f * (1 - q);
          c.beginPath(); c.ellipse(x0 + dx, y1, rw, rw * 0.3, 0, 0, TAU); c.stroke();
        }
      }
      c.restore();
    });
    return res;
  };

  /* ═══════════ 量筒 ═══════════ */
  M5.cylinder = function (c, o) {
    const cx = o.cx, bot = o.bot, hw = o.hw || 20, k = o.k, max = o.max || 150, a = o.a == null ? 1 : o.a;
    const rim = o.rim == null ? bot - max * k - 10 : o.rim, wl = 4, t = o.t || 0, wob = o.wob == null ? 1 : o.wob;
    const yv = v => bot - v * k, vol = Math.max(0, o.vol || 0), lv = yv(vol);
    const x0 = cx - hw, x1 = cx + hw;
    const res = { y: yv, x0, x1, outR: x1 + wl, rim };
    if (a <= 0.02) return res;
    const surf = x => lv + (vol > 0.5 ? wob * Math.sin((x - cx) * 0.2 + t * 3.3) * 0.7 : 0);
    M4.withA(c, a, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      /* 底座（六角座的側視：一塊扁梯形） */
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse(cx, bot + 13, hw + 26, 4, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(200,232,248,0.55)'; c.strokeStyle = 'rgba(232,246,255,0.85)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(cx - hw - 22, bot + 12); c.lineTo(cx - hw - 12, bot + 3); c.lineTo(cx + hw + 12, bot + 3); c.lineTo(cx + hw + 22, bot + 12); c.closePath(); c.fill(); c.stroke();
      /* 筒內淡玻璃色＋水 */
      c.fillStyle = 'rgba(200,230,245,0.06)'; c.fillRect(x0, rim, 2 * hw, bot - rim);
      if (vol > 0.2) {
        c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0, surf(x0)); for (let x = x0 + 3; x < x1; x += 3) c.lineTo(x, surf(x)); c.lineTo(x1, surf(x1)); c.lineTo(x1, bot); c.closePath();
        const g = c.createLinearGradient(0, lv, 0, bot); g.addColorStop(0, W5.rgba(o.col || M4.PC.water, 0.5)); g.addColorStop(1, W5.rgba('#1a60a8', 0.7));
        c.fillStyle = g; c.fill();
        if (o.hi && (o.hiA == null || o.hiA > 0.02)) {
          const h0 = yv(o.hi[0]), h1 = Math.max(lv, yv(o.hi[1])), ha = (o.hiA == null ? 1 : o.hiA) * (0.8 + 0.2 * Math.sin(t * 4));
          c.save(); c.globalAlpha *= ha; c.fillStyle = W5.rgba(COL.yellow, 0.9); c.fillRect(x0, h1, 2 * hw, h0 - h1);
          c.shadowColor = COL.yellow; c.shadowBlur = 16; c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.strokeRect(x0 + 1, h1, 2 * hw - 2, h0 - h1); c.restore();
        }
        c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3;
        c.beginPath(); c.moveTo(x0 + 1, surf(x0)); for (let x = x0 + 3; x < x1; x += 3) c.lineTo(x, surf(x)); c.lineTo(x1 - 1, surf(x1)); c.stroke();
      }
      /* 玻璃壁＋杯口的小唇 */
      c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = wl + 3;
      c.beginPath(); c.moveTo(x0 - wl / 2, rim); c.lineTo(x0 - wl / 2, bot + wl / 2); c.lineTo(x1 + wl / 2, bot + wl / 2); c.lineTo(x1 + wl / 2, rim); c.stroke();
      c.strokeStyle = 'rgba(210,238,252,0.9)'; c.lineWidth = wl; c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(x0 - wl / 2 - 5, rim - 2); c.lineTo(x0 - wl / 2, rim); c.moveTo(x1 + wl / 2, rim); c.lineTo(x1 + wl / 2 + 5, rim - 2); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x0 + 3, rim + 6); c.lineTo(x0 + 3, bot - 4); c.stroke();
      /* 刻度（畫在筒身左半邊） */
      const minor = o.minor || 10, major = o.major || 50;
      c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineCap = 'butt';
      for (let v = minor; v <= max + 0.01; v += minor) {
        const y = yv(v), big = Math.abs(v / major - Math.round(v / major)) < 1e-6;
        c.lineWidth = big ? 2.2 : 1.3; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + (big ? hw * 0.9 : hw * 0.5), y); c.stroke();
      }
      c.restore();
    });
    if (o.labels) {
      const major = o.major || 50;
      for (let v = 0; v <= max + 0.01; v += major) {
        const str = v >= max - 0.01 && o.unit !== null ? v + ' ' + (o.unit || 'mL') : String(v);
        M3.T(c, a, str, x1 + wl + 10, yv(v), COL.dim, 22, 'left', true);
      }
    }
    return res;
  };

  /* ═══════════ 平台磅秤 ═══════════ */
  M5.platScale = function (c, o) {
    const cx = o.cx, by = o.by, w = o.w || 160, h = o.h || 28, a = o.a == null ? 1 : o.a;
    const top = by - h - 8, res = { top, x0: cx - w / 2, x1: cx + w / 2 };
    if (a <= 0.02) return res;
    const str = o.text == null ? '' : String(o.text), tw = str ? W5.tw(c, str, 22, true) : 0;
    const dw = Math.max(o.dispW || 0, tw + 18), dh = 26;
    M4.withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(11,26,21,0.4)'; c.beginPath(); c.ellipse(cx, by + 2, w / 2 + 10, 5, 0, 0, TAU); c.fill();
      /* 底座 */
      const g = c.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, '#dfe5e8'); g.addColorStop(1, '#8e9ba3');
      c.fillStyle = g; W5.rr(c, cx - w / 2 + 6, by - h, w - 12, h, 6); c.fill();
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 1.6; c.stroke();
      /* 平台 */
      const pg = c.createLinearGradient(0, top, 0, top + 8); pg.addColorStop(0, '#f4f7f8'); pg.addColorStop(1, '#a9b5bc');
      c.fillStyle = pg; W5.rr(c, cx - w / 2, top, w, 8, 3); c.fill(); c.stroke();
      /* 顯示窗 */
      const gl = clamp01(o.glow || 0);
      if (gl > 0.02) W5.glow(c, cx, by - h / 2, dw * 0.8, COL.yellow, 0.35 * gl);
      c.fillStyle = '#102a22'; W5.rr(c, cx - dw / 2, by - h / 2 - dh / 2, dw, dh, 4); c.fill();
      c.strokeStyle = gl > 0.02 ? W5.rgba(COL.yellow, 0.5 + 0.5 * gl) : 'rgba(163,184,176,0.7)'; c.lineWidth = 1.6; c.stroke();
      c.restore();
    });
    if (str) M3.T(c, a, str, cx, by - h / 2, o.col || COL.yellow, 22, 'center', true);
    return res;
  };
})(window);

/* ==================================================================
   M5 新增（ice 建立；vol 沿用）：泡在液體裡的物體上色
   ── 速查 ──
   泡水   M5.wetBox(c,x0,x1,top,bot,level,o)（M5.trough 的液體是不透明漸層，物體要畫在水槽「之後」；
                    這個函式在物體 x0～x1、top～bot 範圍內，把液面 level 以下的部分蓋一層半透明液體色，
                    液面穿過物體時再補一條液面亮線（跟著 t 微微起伏）；
                    o：{ col 液體色(M4.PC.water), deep 底部色('#1a60a8'；col 不是預設時自動由 col 調暗), edge 亮線色(M4.PC.waterEdge),
                    fillA 上緣透明度(0.38), t, a }）
   ================================================================== */
(function (root) {
  'use strict';
  if (!root.W5 || !root.M3 || !root.M4 || !root.M5) return;
  const M5 = root.M5;
  M5.wetBox = function (c, x0, x1, top, bot, level, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a;
    const y0 = Math.max(top, level); if (a <= 0.02 || bot <= y0 + 0.5) return;
    const col = o.col || M4.PC.water, deep = o.deep || (o.col ? W5.mix(col, '#0b1a15', 0.35) : '#1a60a8');
    const t = o.t || 0, fa = o.fillA == null ? 0.38 : o.fillA;
    M4.withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, y0, 0, bot);
      g.addColorStop(0, W5.rgba(col, fa)); g.addColorStop(1, deep.indexOf('rgb(') === 0 ? deep.replace('rgb(', 'rgba(').replace(')', ',' + (fa + 0.12) + ')') : W5.rgba(deep, fa + 0.12));
      c.fillStyle = g; c.fillRect(x0 - 1, y0, x1 - x0 + 2, bot - y0);
      if (level > top) {
        c.strokeStyle = o.edge || M4.PC.waterEdge; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x0 - 1, level + 1.2 * Math.sin(t * 3.1)); c.lineTo(x1 + 1, level + 1.2 * Math.sin(t * 3.1 + 0.6)); c.stroke();
      }
      c.restore();
    });
  };
})(window);
