/* ==================================================================
   work_5 ｜ 發電結構比一比（cvs-mix，960×540）
   四步：1 2005 年發電結構（圓餅逐塊長出） → 2 2025 年發電結構（兩張並排）
        → 3 不可循環使用的能源占比（96% → 88%） → 4 平均每度電的碳排放（加權平均算式）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。
   純數據圖解：只呈現課本給的教學用統計數據，不加評論。

   能源配色（兩張圓餅、柱狀圖、算式一律同色）：
     煤＝灰褐 #9a8b7a、天然氣＝橘 #ff8040、石油＝暗紅 #c0504d、核能＝紫 #b58cff、再生能源＝綠 #33cc99
   圓餅從 12 點順時針：2005 依大到小（煤→天然氣→核能→石油→再生），小塊落在左上；
   2025 依小到大（核能→石油→再生→煤→天然氣），小塊落在右上。兩張並排時小塊標籤都朝外側，不擠在中間。
   占比 ≥ 20% 的大塊標籤寫在塊內，其餘寫在圓餅外並用引線連回該塊；外側標籤依 y 排開，不互相重疊。

   純函式作法：所有畫面都由 s 算出（跳步不走樣）；亂數一律 W5.hash（本檔用不到）；文字一律 L('中文','English')；
   畫布字 ≥ 20px；頂端 0～30px 留給 kit 的進度條，內容一律畫在 y ≥ 32。不用任何圖片檔。整個包在 IIFE 內。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green, HL = COL.yellow, INK = '#0b1a15';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 能源與數據 ── */
  const SRC = {
    coal: { zh: '煤', en: 'Coal', col: '#9a8b7a' },
    gas:  { zh: '天然氣', en: 'Natural gas', col: '#ff8040' },
    oil:  { zh: '石油', en: 'Oil', col: '#c0504d' },
    nuc:  { zh: '核能', en: 'Nuclear', col: '#b58cff' },
    ren:  { zh: '再生能源', en: 'Renewables', col: '#33cc99' }
  };
  const Y2005 = [['coal', 45], ['gas', 31], ['nuc', 14], ['oil', 6], ['ren', 4]];
  const Y2025 = [['nuc', 1], ['oil', 3], ['ren', 12], ['coal', 36], ['gas', 48]];
  const NONRE = { coal: 1, gas: 1, oil: 1, nuc: 1 };      /* 不可循環使用 */

  /* 位置：第 1 步單張置中；第 2 步起兩張並排 */
  const ONE = { cx: 480, cy: 250, R: 145 };
  const LEFT = { cx: 290, cy: 228, R: 100 }, RIGHT = { cx: 670, cy: 228, R: 100 };

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（也不記進 W5.boxes） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  const NOHEAD = /^[，、。：；）」！？]/;
  function wrap(c, str, size, maxW) {
    const toks = str.match(/[⺀-鿿　-〿＀-￯]|[^\s⺀-鿿　-〿＀-￯]+\s*|\s+/g) || [];
    const lines = []; let cur = '';
    for (const t of toks) {
      const test = cur + t;
      if (cur && W5.tw(c, test.trim(), size) > maxW && !NOHEAD.test(t)) { lines.push(cur.trim()); cur = t.trimStart(); }
      else cur = test;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  /* 底部字幕：說明一般框、結論綠框（同 solar／thermal） */
  function subtitle(c, a, str, border) {
    if (a <= 0.02) return;
    const size = 22, lh = 31, lines = wrap(c, str, size, 860);
    let w = 0; lines.forEach(l => { w = Math.max(w, W5.tw(c, l, size)); });
    w += 48; const h = lines.length * lh + 18, y0 = 490 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.86)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = border ? 2.5 : 1.5; c.strokeStyle = border || 'rgba(246,243,234,0.22)'; c.stroke();
    lines.forEach((l, i) => W5.label(c, l, 480, y0 + 9 + lh * (i + 0.5), WHITE, size));
    c.restore();
  }
  function withA(c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }

  /* 多色一行字：parts = [[字, 顏色, 透明度], ...]，依序排開（寬度先量好，不互相壓到） */
  function parts(c, list, x, y, size, align, mono) {
    const ws = list.map(p => W5.tw(c, p[0], size, mono));
    const total = ws.reduce((s, w) => s + w, 0);
    let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    list.forEach((p, i) => { T(c, p[2] == null ? 1 : p[2], p[0], x0, y, p[1], size, 'left', mono); x0 += ws[i]; });
    return total;
  }

  /* ── 圓餅 ── */
  function slices(data) {
    let acc = 0;
    return data.map(([key, pct]) => { const a0 = acc; acc += pct; return { key, pct, f0: a0 / 100, f1: acc / 100, mid: (a0 + pct / 2) / 100 }; });
  }
  const S2005 = slices(Y2005), S2025 = slices(Y2025);
  const ang = f => -Math.PI / 2 + f * TAU;                  /* 12 點為 0、順時針 */
  const dirX = f => Math.sin(f * TAU), dirY = f => -Math.cos(f * TAU);

  /* 外側標籤排版：同一側依自然 y 排序、間距 ≥ GAP，整組保持原本的中心 */
  const GAP = 54;
  function layout(sl, g) {
    const out = {};
    const sides = { L: [], R: [] };
    sl.forEach((S, i) => {
      if (S.pct >= 20) return;
      const side = dirX(S.mid) >= 0 ? 'R' : 'L';
      sides[side].push({ i, y: g.cy + (g.R + 14) * dirY(S.mid) });
    });
    ['L', 'R'].forEach(side => {
      const arr = sides[side].sort((a, b) => a.y - b.y);
      if (!arr.length) return;
      const nat = arr.reduce((s, o) => s + o.y, 0) / arr.length;
      const ys = arr.map(o => o.y);
      for (let j = 1; j < ys.length; j++) ys[j] = Math.max(ys[j], ys[j - 1] + GAP);
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
      let off = nat - mean;
      if (ys[0] + off < 62) off = 62 - ys[0];               /* 最上面的標籤頂端仍在 y ≥ 38 */
      arr.forEach((o, j) => { out[o.i] = { side, ly: ys[j] + off }; });
    });
    return out;
  }

  function wedge(c, cx, cy, R, f0, f1) {
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, ang(f0), ang(f1)); c.closePath();
  }

  /* opt: grow(i)→0..1、lab(i)→0..1、hl 0..1（描亮不可循環）、pulse 0..1、title 透明度 */
  function pie(c, sl, g, opt, year) {
    const { cx, cy, R } = g, hl = opt.hl || 0;
    /* 底盤 */
    c.save(); c.fillStyle = 'rgba(11,26,21,0.55)'; c.beginPath(); c.arc(cx, cy, R + 3, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 1.5; c.stroke(); c.restore();
    sl.forEach((S, i) => {
      const gr = opt.grow(i); if (gr <= 0.001) return;
      const f1 = lerp(S.f0, S.f1, gr), src = SRC[S.key];
      let col = src.col;
      if (hl > 0 && NONRE[S.key]) col = W5.mix(src.col, '#ffffff', 0.18 * hl);
      c.fillStyle = col; wedge(c, cx, cy, R, S.f0, f1); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
      if (hl > 0 && !NONRE[S.key]) { c.save(); c.globalAlpha = 0.55 * hl; c.fillStyle = INK; wedge(c, cx, cy, R, S.f0, f1); c.fill(); c.restore(); }
    });
    /* 描亮加粗：不可循環使用的四塊 */
    if (hl > 0.02) {
      sl.forEach(S => {
        if (!NONRE[S.key]) return;
        c.save(); c.globalAlpha = hl * (0.75 + 0.25 * (opt.pulse || 0));
        c.strokeStyle = HL; c.lineWidth = 2 + 3.5 * hl; c.lineJoin = 'round';
        wedge(c, cx, cy, R, S.f0, S.f1); c.stroke(); c.restore();
      });
    }
    /* 標籤 */
    const lay = layout(sl, g);
    sl.forEach((S, i) => {
      const a = opt.lab(i); if (a <= 0.02) return;
      const src = SRC[S.key], name = L(src.zh, src.en), pct = S.pct + '%';
      const dim = hl > 0 && !NONRE[S.key] ? 1 - 0.45 * hl : 1;
      if (S.pct >= 20) {
        const r = 0.56 * R, x = cx + r * dirX(S.mid), y = cy + r * dirY(S.mid);
        /* 塊內寬度有限：名稱太長（如 Natural gas）就拆成兩行 */
        const words = W5.tw(c, name, 20) > 0.9 * R && name.indexOf(' ') > 0 ? name.split(' ') : [name];
        const top = y - 13 - 12 * (words.length - 1);
        words.forEach((wd, j) => T(c, a * dim, wd, x, top + 24 * j, WHITE, 20));
        T(c, a * dim, pct, x, top + 24 * (words.length - 1) + 27, WHITE, 22, 'center', true);
        return;
      }
      const o = lay[i], sgn = o.side === 'R' ? 1 : -1;
      const ex = cx + (R + 2) * dirX(S.mid), ey = cy + (R + 2) * dirY(S.mid);
      const bx = cx + (R + 14) * dirX(S.mid), by = cy + (R + 14) * dirY(S.mid);
      const xa = cx + sgn * (R + 30);
      withA(c, a * dim, () => {
        c.strokeStyle = W5.mix(src.col, '#ffffff', 0.2); c.lineWidth = 2.5; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(ex, ey); c.lineTo(bx, by); c.lineTo(xa - sgn * 6, o.ly); c.stroke();
        c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(ex, ey, 3.5, 0, TAU); c.fill();
      });
      const al = o.side === 'R' ? 'left' : 'right';
      T(c, a * dim, name, xa, o.ly - 12, W5.mix(src.col, '#ffffff', 0.3), 20, al);
      T(c, a * dim, pct, xa, o.ly + 14, WHITE, 22, al, true);
    });
    /* 圓餅下方的年份 */
    P(c, opt.title, year, cx, cy + R + 28, WHITE, 22);
  }

  /* 逐塊長出：第 i 塊在 [t0 + i·gap, t0 + i·gap + len] 長完 */
  const grower = (u, t0, gap, len) => i => ease(seg(u, t0 + i * gap, t0 + i * gap + len));
  const labeler = (u, t0, gap, len) => i => seg(u, t0 + i * gap + len - 0.1, t0 + i * gap + len + 0.3);
  const full = () => 1;

  /* ═════════════════ 第 1 步：2005 年 ═════════════════ */
  function step1(c, s) {
    const u = s.u;
    pie(c, S2005, ONE, { grow: grower(u, 0.5, 0.9, 0.8), lab: labeler(u, 0.5, 0.9, 0.8), title: s.k }, L('2005 年', '2005'));
  }

  /* ═════════════════ 第 2 步：2025 年並排 ═════════════════ */
  function geoMove(e) { return { cx: lerp(ONE.cx, LEFT.cx, e), cy: lerp(ONE.cy, LEFT.cy, e), R: lerp(ONE.R, LEFT.R, e) }; }
  function step2(c, s) {
    const u = s.u, e = ease(seg(u, 0, 1.0));
    pie(c, S2005, geoMove(e), { grow: full, lab: full, title: 1 }, L('2005 年', '2005'));
    pie(c, S2025, RIGHT, { grow: grower(u, 1.2, 0.85, 0.8), lab: labeler(u, 1.2, 0.85, 0.8), title: seg(u, 1.0, 1.4) }, L('2025 年', '2025'));
  }

  /* ═════════════════ 第 3 步：不可循環使用的占比 ═════════════════ */
  function step3(c, s) {
    const u = s.u, hl = ease(seg(u, 0.2, 1.4)), pulse = 0.5 + 0.5 * Math.sin(u * 4);
    pie(c, S2005, LEFT, { grow: full, lab: full, title: 1, hl, pulse }, L('2005 年', '2005'));
    pie(c, S2025, RIGHT, { grow: full, lab: full, title: 1, hl, pulse }, L('2025 年', '2025'));
    const C = k => W5.mix(SRC[k].col, '#ffffff', 0.25);
    const fy = 393, ny = 436;
    const tl = (t0, i) => seg(u, t0 + 0.28 * i, t0 + 0.28 * i + 0.25);
    /* 2005：14＋45＋6＋31＝96% */
    const A = 1.6;
    parts(c, [['14', C('nuc'), tl(A, 0)], [' + ', WHITE, tl(A, 1)], ['45', C('coal'), tl(A, 1)], [' + ', WHITE, tl(A, 2)],
      ['6', C('oil'), tl(A, 2)], [' + ', WHITE, tl(A, 3)], ['31', C('gas'), tl(A, 3)], [' =', WHITE, tl(A, 4)]], LEFT.cx, fy, 22, 'center', true);
    const n1 = ease(seg(u, 2.9, 3.3));
    T(c, n1, '96%', LEFT.cx, ny, HL, 44, 'center', true);
    /* 2025：1＋36＋3＋48＝88% */
    const B = 3.5;
    parts(c, [['1', C('nuc'), tl(B, 0)], [' + ', WHITE, tl(B, 1)], ['36', C('coal'), tl(B, 1)], [' + ', WHITE, tl(B, 2)],
      ['3', C('oil'), tl(B, 2)], [' + ', WHITE, tl(B, 3)], ['48', C('gas'), tl(B, 3)], [' =', WHITE, tl(B, 4)]], RIGHT.cx, fy, 22, 'center', true);
    const n2 = ease(seg(u, 4.8, 5.2));
    T(c, n2, '88%', RIGHT.cx, ny, HL, 44, 'center', true);
    /* 兩數之間：減少了 8 個百分點 */
    const m = ease(seg(u, 5.3, 5.8));
    P(c, m, L('減少了 8 個百分點', '8 percentage points lower'), 480, ny, HL, 20);
  }

  /* ═════════════════ 第 4 步：平均每度電碳排放 ═════════════════ */
  const ROWS = [
    { key: 'coal', zh: '燃煤', en: 'Coal', g: 900, v: '900 g' },
    { key: 'oil', zh: '燃油', en: 'Oil', g: 750, v: '750 g' },
    { key: 'gas', zh: '燃氣', en: 'Gas', g: 400, v: '400 g' },
    { key: 'zero', zh: '核能與再生能源', en: 'Nuclear & renewables', g: 0, v: null }
  ];
  function step4(c, s) {
    const u = s.u, k = s.k;
    const C = key => W5.mix(SRC[key].col, '#ffffff', 0.25);
    /* 左：每度電碳排放（柱狀示意） */
    T(c, k, L('每發一度電的碳排放', 'Carbon per kWh generated'), 40, 100, HL, 22, 'left');
    withA(c, k * 0.5, () => { c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(40, 116); c.lineTo(420, 116); c.stroke(); });
    const X0 = 40, SC = 300 / 900;
    ROWS.forEach((r, i) => {
      const a = seg(u, 0.3 + 0.3 * i, 0.6 + 0.3 * i), gr = ease(seg(u, 0.4 + 0.3 * i, 1.2 + 0.3 * i));
      const ny = 145 + 72 * i, by = ny + 26;
      T(c, a, L(r.zh, r.en), X0, ny, WHITE, 20, 'left');
      withA(c, a, () => {
        if (r.key === 'zero') {
          c.fillStyle = SRC.nuc.col; c.fillRect(X0, by - 10, 4, 20);
          c.fillStyle = SRC.ren.col; c.fillRect(X0 + 4, by - 10, 4, 20);
        } else {
          const w = r.g * SC * gr;
          c.fillStyle = SRC[r.key].col; W5.rr(c, X0, by - 10, Math.max(4, w), 20, 4); c.fill();
          c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.2; c.stroke();
        }
      });
      const vx = r.key === 'zero' ? X0 + 18 : X0 + r.g * SC * gr + 12;
      T(c, a * seg(u, 0.9 + 0.3 * i, 1.2 + 0.3 * i), r.v || L('約 0', '≈ 0'), vx, by, r.key === 'zero' ? WHITE : C(r.key), 22, 'left', true);
    });

    /* 右：加權平均算式，數字依序浮現 */
    const XR = 480, tl = (t0, i) => seg(u, t0 + 0.3 * i, t0 + 0.3 * i + 0.3);
    const yr = (y0, A, terms, prods, tot, year) => {
      T(c, seg(u, A - 0.3, A), year, XR, y0, WHITE, 22, 'left');
      parts(c, [[terms[0], C('coal'), tl(A, 0)], [' + ', WHITE, tl(A, 1)], [terms[1], C('oil'), tl(A, 1)], [' + ', WHITE, tl(A, 2)], [terms[2], C('gas'), tl(A, 2)]],
        XR, y0 + 37, 22, 'left', true);
      const B = A + 1.0;
      parts(c, [['= ', WHITE, tl(B, 0)], [prods[0], C('coal'), tl(B, 0)], [' + ', WHITE, tl(B, 1)], [prods[1], C('oil'), tl(B, 1)],
        [' + ', WHITE, tl(B, 2)], [prods[2], C('gas'), tl(B, 2)]], XR, y0 + 72, 22, 'left', true);
      T(c, ease(seg(u, A + 2.0, A + 2.4)), tot, XR, y0 + 110, HL, 30, 'left', true);
    };
    yr(105, 1.6, ['0.45×900', '0.06×750', '0.31×400'], ['405', '45', '124'], '≈ 574 g', L('2005 年', '2005'));
    yr(262, 4.0, ['0.36×900', '0.03×750', '0.48×400'], ['324', '22.5', '192'], '≈ 538.5 g', L('2025 年', '2025'));
    P(c, ease(seg(u, 6.5, 6.9)), L('兩者相差：574 − 538.5 ≈ 35.5 g', 'Difference: 574 − 538.5 ≈ 35.5 g'), 700, 422, HL, 22);
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['2005 年發電結構', 'Power mix in 2005'],
      sub: ['圓餅的每一塊＝該能源占總發電量的比例（教學用統計數據）', 'Each slice = that source\'s share of total generation (statistics for teaching).'],
      con: ['結論：2005 年煤占 45% 最多，其次是天然氣 31%', 'Conclusion: in 2005, coal is the largest at 45%, followed by natural gas at 31%.'] },
    { title: ['2025 年發電結構', 'Power mix in 2025'],
      sub: ['同一種能源用同一個顏色，兩張圓餅可以直接比較', 'Each source keeps the same colour, so the two pies can be compared directly.'],
      con: ['結論：2025 年天然氣占 48% 最多，其次是煤 36%', 'Conclusion: in 2025, natural gas is the largest at 48%, followed by coal at 36%.'] },
    { title: ['不可循環使用的能源占比', 'Share of non-reusable sources'],
      sub: ['煤、石油、天然氣、核能都是不可循環使用的能源，把占比加起來', 'Coal, oil, natural gas and nuclear are non-reusable sources; add up their shares.'],
      con: ['結論：不可循環使用的能源占比，2005 年 96%，2025 年 88%', 'Conclusion: the non-reusable share is 96% in 2005 and 88% in 2025.'] },
    { title: ['平均每度電的碳排放', 'Average carbon per kWh'],
      sub: ['加權平均：每種能源「占比 × 每度電碳排放」，再全部加起來', 'Weighted average: for each source, share × carbon per kWh, then add them all.'],
      con: ['結論：平均每度電碳排放，2005 年約 574 g，2025 年約 538.5 g', 'Conclusion: average carbon per kWh is about 574 g (2005) and 538.5 g (2025).'] }
  ];

  W5.register('mix', {
    canvas: 'cvs-mix',
    steps: DUR,
    draw(c, s) {
      const n = s.n, u = s.u, k = s.k;
      if (n === 1) step1(c, s);
      else if (n === 2) step2(c, s);
      else if (n === 3) step3(c, s);
      else step4(c, s);

      const X = TXT[n - 1];
      P(c, k, L(X.title[0], X.title[1]), 480, 52, WHITE, 24);
      subtitle(c, k * (1 - seg(u, s.d - 3.2, s.d - 2.9)), L(X.sub[0], X.sub[1]));
      subtitle(c, seg(u, s.d - 2.9, s.d - 2.6), L(X.con[0], X.con[1]), GOOD);
    }
  });
})();
