/* ==================================================================
   work_5 ｜ 火力發電（cvs-thermal，960×540）
   四步：1 化石燃料哪裡來 → 2 鍋爐燒開水（化學能→熱能）→ 3 渦輪帶動發電機（熱能→動能→電能）
        → 4 燃煤與燃氣比一比
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 plant／classify 一致）：能量＝黃 ENE、熱＝橘紅 HEAT、水＝藍 WATER、蒸氣＝淡白 STEAM、
   化石燃料（非再生）＝橘紅 NON #ff8040；磁鐵 N 紅、S 藍；煙與 CO₂＝灰白 SMOKE。
   發電不畫電子、不畫電流小點：只用交流波形、線圈微光與燈泡亮度表示（比照 plant）。
   這是「火力」電廠：沒有反應爐、沒有放射性。

   純函式作法：所有畫面都由 s 算出；渦輪／轉子角度用「角速度的解析積分」θ(t)，跳步驟不走樣；
   亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；畫布字 ≥ 20px；
   畫布頂端 0～30px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量：黃 */
  const HEAT = '#ff6a3d';            /* 熱：橘紅（同 plant） */
  const NON = '#ff8040';             /* 化石燃料／非再生：橘紅（同 classify） */
  const WATER = '#5ab8e8';           /* 水：藍 */
  const STEAM = '#e8f1f4';           /* 蒸氣：淡白 */
  const SMOKE = '#b7c7c1';           /* 煙、CO₂ */
  const NPOLE = '#ff6f76', SPOLE = '#72b9ff';
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const COPPER = '#d08a4a', METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */
  const B = [0]; DUR.forEach(d => B.push(B[B.length - 1] + d));

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const isEN = () => L('a', 'b') === 'b';
  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), Bc = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, Bc[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }

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
  /* 底部字幕：說明一般框、結論綠框（同 classify） */
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

  /* ── 共用小零件 ── */
  function flame(c, x, y, s, t, outer, inner) {
    const f = 1 + 0.12 * Math.sin(t * 13 + x) + 0.07 * Math.sin(t * 7.3 + 1 + x * 0.3);
    const h = s * 1.7 * f;
    c.save();
    c.fillStyle = outer; c.beginPath(); c.moveTo(x, y - h);
    c.bezierCurveTo(x + s * 0.9, y - h * 0.45, x + s * 0.7, y, x, y);
    c.bezierCurveTo(x - s * 0.7, y, x - s * 0.9, y - h * 0.45, x, y - h); c.fill();
    c.fillStyle = inner; c.beginPath(); c.moveTo(x, y - h * 0.55);
    c.bezierCurveTo(x + s * 0.4, y - h * 0.25, x + s * 0.32, y, x, y);
    c.bezierCurveTo(x - s * 0.32, y, x - s * 0.4, y - h * 0.25, x, y - h * 0.55); c.fill();
    c.restore();
  }
  function lump(c, x, y, s, seed, fill, edge) {
    c.beginPath();
    for (let j = 0; j < 7; j++) {
      const an = j / 7 * TAU + seed, r = s * (0.8 + 0.32 * hash(seed * 10 + j));
      const px = x + Math.cos(an) * r, py = y + Math.sin(an) * r * 0.8;
      if (j) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath(); c.fillStyle = fill || '#2d3331'; c.fill(); c.strokeStyle = edge || '#8a9490'; c.lineWidth = 1.5; c.stroke();
  }
  function mkPath(pts) {
    const Pp = pts.map(p => ({ x: p[0], y: p[1] })), cum = [0];
    for (let i = 1; i < Pp.length; i++) cum.push(cum[i - 1] + Math.hypot(Pp[i].x - Pp[i - 1].x, Pp[i].y - Pp[i - 1].y));
    return { P: Pp, cum, len: cum[cum.length - 1] };
  }
  function at(path, d) {
    d = Math.max(0, Math.min(path.len, d));
    const Pp = path.P, cum = path.cum;
    for (let i = 1; i < Pp.length; i++) {
      if (d <= cum[i]) { const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return { x: lerp(Pp[i - 1].x, Pp[i].x, f), y: lerp(Pp[i - 1].y, Pp[i].y, f) }; }
    }
    const n = Pp.length - 1; return { x: Pp[n].x, y: Pp[n].y };
  }
  function subPath(c, path, d0, d1) {
    c.beginPath(); const a = at(path, d0); c.moveTo(a.x, a.y);
    for (let i = 1; i < path.P.length; i++) if (path.cum[i] > d0 && path.cum[i] < d1) c.lineTo(path.P[i].x, path.P[i].y);
    const b = at(path, d1); c.lineTo(b.x, b.y);
  }
  function pipe(c, path, fill, w, d1) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
    subPath(c, path, 0, path.len);
    c.strokeStyle = INK; c.lineWidth = w + 7; c.stroke();
    c.strokeStyle = '#6d817a'; c.lineWidth = w + 4; c.stroke();
    c.strokeStyle = EMPTY; c.lineWidth = w; c.stroke();
    const e = d1 == null ? path.len : d1;
    if (fill && e > 0.5) { subPath(c, path, 0, e); c.strokeStyle = fill; c.lineWidth = w; c.stroke(); }
    c.restore();
  }
  function flow(c, path, col, off, gap, dash, w, a) {
    if (a != null && a <= 0.02) return;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0 - gap; d < path.len; d += gap) {
      const p = Math.max(0, d), q = Math.min(path.len, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
    }
    c.restore();
  }
  /* 蒸氣小點沿管子前進（front＝蒸氣已走到哪裡） */
  function steamDots(c, path, t, front, a) {
    if (front <= 1 || a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(255,255,255,0.85)';
    const off = t * 150;
    for (let d = (off % 28) - 28; d < front; d += 28) { if (d < 0) continue; const q = at(path, d); c.beginPath(); c.arc(q.x, q.y, 3.4, 0, TAU); c.fill(); }
    c.restore();
  }
  function bar(c, x, y, w, h, f, col, a) {
    withA(c, a, () => {
      c.fillStyle = INK; W5.rr(c, x, y - h / 2, w, h, h / 2); c.fill();
      if (f > 0.005) {
        c.save(); W5.rr(c, x, y - h / 2, w, h, h / 2); c.clip();
        c.fillStyle = col; c.fillRect(x, y - h / 2, w * clamp01(f), h); c.restore();
      }
      c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 1.5; W5.rr(c, x, y - h / 2, w, h, h / 2); c.stroke();
    });
  }
  function swatch(c, a, x, y, col) {
    withA(c, a, () => {
      c.fillStyle = col; W5.rr(c, x, y - 8, 34, 16, 6); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1; c.stroke();
    });
  }
  function puff(c, x, y, r, col, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.7, y + r * 0.2, r * 0.75, 0, TAU); c.arc(x - r * 0.6, y + r * 0.25, r * 0.65, 0, TAU); c.fill();
    c.restore();
  }

  /* ═════════════════ 第 1 步：化石燃料哪裡來（地質剖面） ═════════════════ */
  const S1 = { x0: 40, x1: 920, top: 128, g: 200, bot: 440, mid: 470, lt: 26, dmax: 130 };
  const SED = ['#8a6a48', '#6f5538', '#9a7a55', '#7a5d3e'];
  const ROCK = ['#3f3024', '#4a3828'];
  const TREES = [256, 304, 352, 400, 446];
  function s1state(u) {
    return {
      die: ease(seg(u, 1.4, 2.6)),
      org: ease(seg(u, 1.8, 2.8)),
      D: S1.dmax * ease(seg(u, 2.6, 5.0)),
      sedFall: seg(u, 2.4, 2.8) * (1 - seg(u, 4.8, 5.3)),
      hp: ease(seg(u, 4.8, 5.5)),
      cook: ease(seg(u, 5.3, 6.7)),
      fin: seg(u, 6.3, 6.8),
      knob: ease(seg(u, 0.8, 7.0))
    };
  }
  function fern(c, x, y, h, ang, a, t, i) {
    withA(c, a, () => {
      c.save(); c.translate(x, y); c.rotate(ang);
      c.strokeStyle = '#6b4f35'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.stroke();
      const sw = 0.06 * Math.sin(t * 1.6 + i);
      for (let j = 0; j < 5; j++) {
        const an = -Math.PI / 2 + (j - 2) * 0.55 + sw;
        c.strokeStyle = j % 2 ? '#3fae6a' : '#2f9e62'; c.lineWidth = 3.5;
        c.beginPath(); c.moveTo(0, -h);
        c.quadraticCurveTo(Math.cos(an) * 20, -h + Math.sin(an) * 20 - 6, Math.cos(an) * 34, -h + Math.sin(an) * 30 + 8); c.stroke();
      }
      c.restore();
    });
  }
  function step1(c, s) {
    const u = s.u, k = s.k, t = s.t, S = s1state(u);
    const { x0, x1, top, g, bot, mid, lt } = S1;
    const oy = g + S.D;               /* 生物遺骸層的上緣 */
    withA(c, k, () => {
      c.save(); W5.rr(c, x0, top, x1 - x0, bot - top, 14); c.clip();
      /* 天空／水 */
      c.fillStyle = '#152c25'; c.fillRect(x0, top, x1 - x0, g - top);
      c.fillStyle = 'rgba(70,110,80,0.55)'; c.fillRect(x0, g - 22, mid - x0, 22);                 /* 沼澤淺水 */
      const sea = c.createLinearGradient(0, top, 0, g); sea.addColorStop(0, 'rgba(90,184,232,0.35)'); sea.addColorStop(1, 'rgba(90,184,232,0.6)');
      c.fillStyle = sea; c.fillRect(mid, top + 14, x1 - mid, g - top - 14);
      c.strokeStyle = 'rgba(216,240,255,0.55)'; c.lineWidth = 2; c.beginPath();
      for (let x = mid; x <= x1; x += 6) { const y = top + 14 + 2.5 * Math.sin(x / 18 + t * 1.8); if (x === mid) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 老岩層（隨著上面堆積整片往下沉） */
      for (let j = -1; j < 12; j++) {
        const y = oy + lt + j * 30; if (y > bot) break;
        c.fillStyle = ROCK[(j + 10) % 2]; c.fillRect(x0, Math.max(oy + lt, y), x1 - x0, 30);
      }
      /* 遺骸層 → 煤（左）／石油（右） */
      const olive = '#5b5a2e';
      c.fillStyle = ROCK[1]; c.fillRect(x0, oy, x1 - x0, lt);
      if (S.org > 0.01) {
        c.globalAlpha = S.org;
        c.fillStyle = mixHex(olive, '#1d2220', S.cook); c.fillRect(x0, oy, mid - x0, lt);
        c.fillStyle = mixHex(olive, '#3a2410', S.cook); c.fillRect(mid, oy, x1 - mid, lt);
        if (S.cook < 0.9) {     /* 還看得出是植物與小生物 */
          c.globalAlpha = S.org * (1 - S.cook);
          c.strokeStyle = '#8fae5a'; c.lineWidth = 2;
          for (let i = 0; i < 22; i++) { const x = x0 + 14 + hash(i + 700) * (x1 - x0 - 28), y = oy + 5 + hash(i + 710) * (lt - 10); c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y + 2); c.stroke(); }
        }
        if (S.cook > 0.4) {     /* 煤的光澤、石油的油光 */
          c.globalAlpha = (S.cook - 0.4) / 0.6;
          c.fillStyle = 'rgba(220,230,226,0.55)';
          for (let i = 0; i < 26; i++) { const x = x0 + 8 + hash(i + 720) * (mid - x0 - 16), y = oy + 4 + hash(i + 730) * (lt - 8); c.fillRect(x, y, 4, 2); }
          c.strokeStyle = 'rgba(255,190,120,0.55)'; c.lineWidth = 2;
          for (let i = 0; i < 5; i++) { const x = mid + 30 + i * 85 + 10 * Math.sin(t + i); c.beginPath(); c.moveTo(x, oy + 9); c.quadraticCurveTo(x + 20, oy + 5, x + 40, oy + 10); c.stroke(); }
        }
        c.globalAlpha = 1;
      }
      /* 泥沙一層層蓋上來 */
      for (let i = 0; i * 26 < S.D + 26; i++) {
        const yb = oy - i * 26, ya = Math.max(g, yb - 26);
        if (yb <= g) break;
        c.fillStyle = SED[i % 4]; c.fillRect(x0, ya, x1 - x0, yb - ya);
        c.strokeStyle = 'rgba(30,20,12,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, ya); c.lineTo(x1, ya); c.stroke();
      }
      /* 天然氣：右邊遺骸層上方的一個氣囊（上層） */
      if (S.cook > 0.02) {
        c.globalAlpha = S.cook;
        c.fillStyle = 'rgba(223,233,238,0.55)';
        c.beginPath(); c.moveTo(600, oy); c.quadraticCurveTo(720, oy - 46, 840, oy); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 1.5; c.stroke();
        for (let i = 0; i < 9; i++) {
          const ph = (t * 0.5 + hash(i + 760)) % 1, x = 640 + hash(i + 770) * 160;
          c.fillStyle = 'rgba(246,250,252,0.8)'; c.beginPath(); c.arc(x, oy - 3 - ph * 16, 2.5, 0, TAU); c.fill();
        }
        c.globalAlpha = 1;
      }
      /* 高溫：從地底往上的熱 */
      if (S.hp > 0.01) {
        const hg = c.createLinearGradient(0, bot, 0, oy);
        hg.addColorStop(0, W5.rgba(HEAT, 0.55 * S.hp)); hg.addColorStop(1, W5.rgba(HEAT, 0));
        c.fillStyle = hg; c.fillRect(x0, oy, x1 - x0, bot - oy);
        c.strokeStyle = W5.rgba('#ffd2b8', 0.55 * S.hp); c.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const x = 90 + i * 112, ph = (t * 0.8 + hash(i + 790)) % 1, yb = bot - 4 - ph * 40;
          c.beginPath(); for (let j = 0; j <= 8; j++) { const yy = yb - j * 3, xx = x + 3 * Math.sin(j * 0.9 + t * 4 + i); if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke();
        }
      }
      c.restore();
    });

    /* 遠古的生物：沼澤植物（左）倒下、海裡的小生物（右）沉到水底 */
    TREES.forEach((x, i) => {
      const di = ease(seg(u, 1.4 + i * 0.12, 2.3 + i * 0.12));
      const fade = 1 - seg(u, 2.4 + i * 0.05, 2.9);
      fern(c, x, g - 2, 52 + 16 * hash(i + 800), (i % 2 ? -1 : 1) * di * 1.45, k * fade, t, i);
    });
    withA(c, k, () => {
      for (let i = 0; i < 18; i++) {
        const di = ease(seg(u, 1.4 + hash(i + 820) * 0.6, 2.4 + hash(i + 820) * 0.6));
        const bx = 510 + hash(i + 830) * 300, by = 152 + hash(i + 840) * 32;
        const x = bx + (1 - di) * 6 * Math.sin(t * 1.5 + i), y = lerp(by, g - 4, di);
        const a = 1 - seg(u, 2.6, 3.0);
        if (a <= 0.02) continue;
        c.save(); c.globalAlpha *= a;
        if (i % 3 === 0) {       /* 小魚 */
          c.fillStyle = mixHex('#9fd8a0', '#6b6b4a', di);
          c.beginPath(); c.ellipse(x, y, 8, 4, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x - 13, y - 4); c.lineTo(x - 13, y + 4); c.closePath(); c.fill();
        } else {                 /* 浮游生物 */
          c.fillStyle = mixHex('#7fe0a0', '#6b6b4a', di); c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill();
        }
        c.restore();
      }
      /* 泥沙從水中落下 */
      if (S.sedFall > 0.02) {
        c.save(); c.globalAlpha *= S.sedFall; c.fillStyle = '#c9a87a';
        for (let i = 0; i < 40; i++) {
          const ph = (t * 0.6 + hash(i + 850)) % 1, x = 60 + hash(i + 860) * 840;
          c.beginPath(); c.arc(x, 150 + ph * 46, 2, 0, TAU); c.fill();
        }
        c.restore();
      }
      /* 高壓：上面一層層岩層往下壓 */
      if (S.hp > 0.02 && S.D > 60) {
        c.save(); c.globalAlpha *= S.hp;
        [150, 380, 880].forEach(x => W5.arrow(c, x, g + 8, x, oy - 8, WHITE, 4, 13));
        c.restore();
      }
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 2; W5.rr(c, S1.x0, S1.top, S1.x1 - S1.x0, S1.bot - S1.top, 14); c.stroke();
    });

    /* 時間軸：數百萬年前 → 今天 */
    const TX0 = 300, TX1 = 640, TY = 104;
    withA(c, k, () => {
      c.fillStyle = INK; W5.rr(c, TX0, TY - 6, TX1 - TX0, 12, 6); c.fill();
      c.fillStyle = W5.rgba(ENE, 0.55); W5.rr(c, TX0, TY - 6, Math.max(12, (TX1 - TX0) * S.knob), 12, 6); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 1.5; W5.rr(c, TX0, TY - 6, TX1 - TX0, 12, 6); c.stroke();
      for (let i = 1; i < 6; i++) { const x = lerp(TX0, TX1, i / 6); c.beginPath(); c.moveTo(x, TY - 9); c.lineTo(x, TY + 9); c.stroke(); }
      const kx = lerp(TX0, TX1, S.knob);
      W5.glow(c, kx, TY, 22, ENE, 0.6);
      c.fillStyle = ENE; c.beginPath(); c.arc(kx, TY, 9, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    });
    T(c, k, L('數百萬年前', 'Millions of years ago'), TX0 - 14, TY, ENE, 20, 'right');
    T(c, k, L('今天', 'Today'), TX1 + 14, TY, ENE, 20, 'left');

    /* 標籤 */
    const aA = k * (1 - seg(u, 2.4, 2.8));
    T(c, aA, L('遠古沼澤', 'Ancient swamp'), 56, 148, '#8fe0a8', 20, 'left');
    T(c, aA, L('遠古海洋', 'Ancient sea'), 904, 148, WATER, 20, 'right');
    T(c, k * S.sedFall, L('泥沙一層層蓋上來', 'Mud and sand pile on top'), 480, 160, '#e2c79c', 20);
    T(c, k * S.hp * (1 - S.fin), L('高壓', 'Pressure'), 166, 262, WHITE, 22, 'left');
    T(c, k * S.hp, L('高溫', 'Heat'), 480, 414, HEAT, 22);
    const oy2 = g + S.D;
    T(c, k * S.fin, L('煤（固體）', 'Coal (solid)'), 256, 384, NON, 22);
    T(c, k * S.fin, L('石油', 'Oil'), 720, 384, NON, 22);
    T(c, k * S.fin, L('天然氣', 'Natural gas'), 720, oy2 - 62, NON, 22);
    const pa = k * seg(u, 6.7, 7.2);
    const pr = P(c, pa, L('化石燃料', 'Fossil fuels'), 470, 160, NON, 22, 'right');
    if (pr) T(c, pa, L('台灣蘊藏量不豐富', "Taiwan's reserves are small"), 486, 160, DIM, 20, 'left');
  }

  /* ═════════════════ 第 2 步：鍋爐燒開水（化學能 → 熱能） ═════════════════ */
  const DR = { x: 180, y: 136, w: 250, h: 150, wl: 228 };   /* 汽鼓（上：水與蒸氣） */
  const FU = { x: 180, y: 300, w: 250, h: 130 };            /* 爐膛（下：燃燒） */
  const CH = { x: 58, y: 128, w: 40, bot: 430 };            /* 煙囪 */
  const STP2 = mkPath([[392, 136], [392, 116], [612, 116]]);
  const PN2 = { x: 632, y: 150, w: 300, h: 262 };
  function s2state(u) {
    return {
      fire: ease(seg(u, 0.3, 1.2)),
      boil: ease(seg(u, 1.8, 3.0)),
      steam: ease(seg(u, 2.4, 4.6)),
      front: ease(seg(u, 3.8, 5.0)),
      conv: ease(seg(u, 0.9, 5.2))
    };
  }
  function boilerBody(c, x, y, w, h, wl, S, t) {
    /* 汽鼓：上方蒸氣、下方水 */
    c.save(); W5.rr(c, x, y, w, h, 22); c.clip();
    c.fillStyle = EMPTY; c.fillRect(x, y, w, h);
    c.fillStyle = W5.rgba(STEAM, 0.05 + 0.4 * S.steam); c.fillRect(x, y, w, wl - y);
    for (let i = 0; i < 12; i++) {
      if (hash(i + 900) > S.steam) continue;
      const px = x + 14 + hash(i + 910) * (w - 28) + 3 * Math.sin(t * 2 + i);
      const py = wl - 4 - ((t * 26 + hash(i + 920) * (wl - y)) % (wl - y - 6));
      c.fillStyle = W5.rgba(STEAM, 0.4); c.beginPath(); c.arc(px, py, 5 + 4 * hash(i + 930), 0, TAU); c.fill();
    }
    const wob = 2.5 * S.boil;
    c.beginPath(); c.moveTo(x, y + h);
    for (let xx = x; xx <= x + w; xx += 4) c.lineTo(xx, wl + wob * Math.sin(xx / 9 + t * 7));
    c.lineTo(x + w, y + h); c.closePath();
    c.fillStyle = W5.rgba(mixHex(WATER, '#9fd8f5', 0.3 * S.boil), 0.6); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6;
    const span = y + h - wl;
    for (let i = 0; i < 26; i++) {
      if (hash(i + 940) > S.boil) continue;
      const sp = 36 + 30 * hash(i + 950), py = y + h - 4 - ((t * sp + hash(i + 960) * span) % span);
      const px = x + 10 + hash(i + 970) * (w - 20) + 2 * Math.sin(t * 5 + i);
      c.beginPath(); c.arc(px, py, 1.6 + 2.4 * hash(i + 980), 0, TAU); c.stroke();
    }
    c.restore();
    c.strokeStyle = '#9fb3ac'; c.lineWidth = 4; W5.rr(c, x, y, w, h, 22); c.stroke();
  }
  function step2(c, s) {
    const u = s.u, k = s.k, t = s.t, S = s2state(u);
    withA(c, k, () => {
      /* 煙道與煙囪 */
      c.fillStyle = SHELL; c.fillRect(CH.x + CH.w, 398, FU.x - CH.x - CH.w, 26);
      c.strokeStyle = METAL; c.lineWidth = 2; c.strokeRect(CH.x + CH.w, 398, FU.x - CH.x - CH.w, 26);
      for (let i = 0; i < 4; i++) {     /* 煙往煙囪走 */
        const ph = (t * 0.9 + i / 4) % 1;
        puff(c, lerp(FU.x - 8, CH.x + CH.w + 8, ph), 411, 5, SMOKE, 0.5 * S.fire);
      }
      const cg = c.createLinearGradient(CH.x, 0, CH.x + CH.w, 0);
      cg.addColorStop(0, '#4b5a54'); cg.addColorStop(0.5, '#6d7b76'); cg.addColorStop(1, '#3e4b46');
      c.fillStyle = cg; c.fillRect(CH.x, CH.y, CH.w, CH.bot - CH.y);
      c.strokeStyle = METAL; c.lineWidth = 2; c.strokeRect(CH.x, CH.y, CH.w, CH.bot - CH.y);
      c.fillStyle = '#c75a3a'; c.fillRect(CH.x, CH.y + 10, CH.w, 6); c.fillRect(CH.x, CH.y + 26, CH.w, 6);
      /* 煙囪冒出的煙 */
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.45 + i / 7) % 1;
        puff(c, CH.x + CH.w / 2 + ph * 34 + 4 * Math.sin(t + i), CH.y - 6 - ph * 34, 6 + ph * 9, SMOKE, 0.55 * S.fire * (1 - ph));
      }
      /* 爐膛 */
      c.fillStyle = '#1a2622'; W5.rr(c, FU.x, FU.y, FU.w, FU.h, 12); c.fill();
      c.save(); W5.rr(c, FU.x, FU.y, FU.w, FU.h, 12); c.clip();
      if (S.fire > 0.01) W5.glow(c, FU.x + FU.w / 2, FU.y + FU.h - 10, 170, HEAT, 0.6 * S.fire);
      /* 煤床與火焰 */
      for (let i = 0; i < 9; i++) {
        const x = FU.x + 22 + i * 23;
        if (S.fire > 0.02) withA(c, S.fire, () => flame(c, x, FU.y + FU.h - 20, 11 + 4 * hash(i + 990), t + i * 0.7, '#ff7a3a', '#ffd27a'));
      }
      for (let i = 0; i < 12; i++) {
        const x = FU.x + 18 + i * 17 + 4 * hash(i + 1000), y = FU.y + FU.h - 13 + 3 * hash(i + 1010);
        lump(c, x, y, 9, i + 3, mixHex('#2d3331', '#7a3a1a', S.fire * (0.5 + 0.5 * Math.sin(t * 3 + i))), '#8a9490');
      }
      /* 天然氣燃燒器：藍色火焰往左噴 */
      if (S.fire > 0.02) withA(c, S.fire, () => {
        c.save(); c.translate(FU.x + FU.w - 4, 360); c.rotate(-Math.PI / 2);
        flame(c, -10, 0, 9, t, '#5aa9ff', '#d8ecff'); flame(c, 10, 0, 9, t + 0.5, '#5aa9ff', '#d8ecff'); flame(c, 0, 0, 12, t + 1, '#5aa9ff', '#d8ecff');
        c.restore();
      });
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, FU.x, FU.y, FU.w, FU.h, 12); c.stroke();
      c.fillStyle = '#6d7b76'; c.fillRect(FU.x + 8, FU.y + FU.h - 4, FU.w - 16, 4);
      /* 熱往上傳：從爐膛到汽鼓 */
      c.fillStyle = '#33423e'; c.fillRect(DR.x + 20, DR.y + DR.h, DR.w - 40, FU.y - DR.y - DR.h);
      if (S.fire > 0.02) {
        c.save(); c.globalAlpha *= S.fire;
        for (let i = 0; i < 5; i++) {
          const x = DR.x + 50 + i * 38, ph = (t * 1.2 + i * 0.37) % 1;
          W5.arrow(c, x, FU.y + 30 - ph * 6, x, FU.y + 6 - ph * 6, HEAT, 3, 9);
        }
        c.restore();
      }
      /* 汽鼓 */
      boilerBody(c, DR.x, DR.y, DR.w, DR.h, DR.wl, S, t);
      /* 壓力錶 */
      const gx = 222, gy = 116;
      c.fillStyle = '#5d6f69'; c.fillRect(gx - 3, gy + 8, 6, DR.y - gy - 6);
      c.fillStyle = '#e8eef0'; c.beginPath(); c.arc(gx, gy, 14, 0, TAU); c.fill();
      c.strokeStyle = '#33423e'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = HEAT; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, 10, Math.PI * 0.25, Math.PI * 0.75 - Math.PI * 1.5 + TAU); c.stroke();
      const na = Math.PI * 0.75 + S.steam * Math.PI * 1.3 + 0.04 * Math.sin(t * 9) * S.steam;
      c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(na) * 11, gy + Math.sin(na) * 11); c.stroke();
      /* 天然氣管 */
      c.fillStyle = '#5c6f78'; c.fillRect(FU.x + FU.w, 355, 90, 10);
      c.strokeStyle = '#9fb6c4'; c.lineWidth = 1.5; c.strokeRect(FU.x + FU.w, 355, 90, 10);
      /* 蒸氣管 */
      pipe(c, STP2, mixHex(EMPTY, STEAM, 0.6), 12, STP2.len * S.front);
      steamDots(c, STP2, t, STP2.len * S.front, 1);
      if (S.front > 0.95) W5.arrow(c, 600, 116, 626, 116, STEAM, 4, 13);
      c.strokeStyle = 'rgba(163,184,176,0.6)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(442, 410); c.lineTo(404, 414); c.stroke();
    });
    T(c, k * seg(u, 1.4, 1.8), 'CO₂', 110, 146, SMOKE, 22, 'left', true);
    T(c, k * S.front, L('高溫高壓水蒸氣', 'High-pressure steam'), 500, 92, STEAM, 20);
    T(c, k, L('天然氣', 'Natural gas'), 448, 336, '#9fd0ff', 20, 'left');
    T(c, k, L('煤', 'Coal'), 448, 410, NON, 20, 'left');
    T(c, k * seg(u, 1.8, 2.3), L('水', 'Water'), 170, 262, WATER, 20, 'right');
    T(c, k * seg(u, 2.8, 3.3), L('水蒸氣', 'Steam'), 442, 176, STEAM, 20, 'left');

    /* 右側：能量條 */
    const pa = k * seg(u, 0.6, 1.1);
    withA(c, pa, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, PN2.x, PN2.y, PN2.w, PN2.h, 16); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(ENE, 0.55); c.stroke();
    });
    const cx2 = PN2.x + PN2.w / 2, bx = PN2.x + 20, bw = PN2.w - 40;
    P(c, pa, L('化學能 → 熱能', 'Chemical → heat'), cx2, 186, ENE, 22);
    T(c, pa, L('燃料的化學能', 'Chemical energy (fuel)'), bx, 230, NON, 20, 'left');
    bar(c, bx, 258, bw, 20, 1 - 0.85 * S.conv, NON, pa);
    T(c, pa, L('熱能', 'Heat'), bx, 296, HEAT, 20, 'left');
    bar(c, bx, 324, bw, 20, 0.85 * S.conv, HEAT, pa);
    const wa = k * seg(u, 3.0, 3.5);
    swatch(c, wa, bx, 374, WATER); T(c, wa, L('水', 'Water'), bx + 44, 374, WATER, 20, 'left');
    const ax = bx + 44 + W5.tw(c, L('水', 'Water'), 20) + 14;
    withA(c, wa, () => W5.arrow(c, ax, 374, ax + 30, 374, WHITE, 3, 10));
    swatch(c, wa, ax + 42, 374, STEAM); T(c, wa, L('水蒸氣', 'Steam'), ax + 86, 374, STEAM, 20, 'left');
  }

  /* ═════════════════ 第 3 步：渦輪帶動發電機 ═════════════════ */
  const BO = { x: 40, y: 176, w: 110, h: 150, wl: 250 };
  const STP3 = mkPath([[120, 176], [120, 150], [262, 150], [262, 196]]);
  const TB = { x0: 250, x1: 400, h0: 32, h1: 70, cy: 252 };
  const tbHalf = x => lerp(TB.h0, TB.h1, (x - TB.x0) / (TB.x1 - TB.x0));
  const GN = { x: 440, y: 206, w: 104, h: 92, cx: 492, cy: 252 };
  const CD = { x: 250, y: 352, w: 150, h: 80 };
  const COOL3 = mkPath([[600, 374], [276, 374], [276, 410], [600, 410]]);
  const FEED3 = mkPath([[258, 424], [178, 424], [178, 300], [150, 300]]);
  const PN3 = { x: 640, y: 150, w: 296, h: 214 };
  const R0 = B[2] + 1.4, RD = 2.4, OM = TAU * 0.85;
  function theta(t) {
    if (t <= R0) return 0;
    const x = (t - R0) / RD;
    if (x < 1) return OM * RD * (x * x * x - x * x * x * x / 2);
    return OM * (RD / 2 + (t - R0 - RD));
  }
  const amp = t => ease((t - R0) / RD);
  const emf = t => amp(t) * Math.sin(theta(t));
  function magnetCoil(c, cx, cy, R, th, glowA) {
    c.save();
    c.strokeStyle = '#5d6f69'; c.lineWidth = R * 0.14;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    const cw = R * 0.9, ch = R * 0.36;
    [-1, 1].forEach(sd => {
      const y0 = cy + sd * (R - ch * 0.5) - ch / 2;
      if (glowA > 0.02) W5.glow(c, cx, y0 + ch / 2, R * 0.75, ENE, 0.7 * glowA);
      c.fillStyle = '#7a4a22'; W5.rr(c, cx - cw / 2, y0, cw, ch, 3); c.fill();
      c.strokeStyle = COPPER; c.lineWidth = Math.max(1.5, R * 0.05);
      for (let k = 0; k < 6; k++) { const xx = cx - cw / 2 + cw * (k + 0.5) / 6; c.beginPath(); c.moveTo(xx - 2, y0 + 1); c.lineTo(xx + 2, y0 + ch - 1); c.stroke(); }
    });
    c.translate(cx, cy); c.rotate(th);
    const hl = R * 0.56, hw = R * 0.22;
    c.fillStyle = NPOLE; W5.rr(c, 0, -hw, hl, hw * 2, 3); c.fill();
    c.fillStyle = SPOLE; W5.rr(c, -hl, -hw, hl, hw * 2, 3); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; W5.rr(c, -hl, -hw, hl * 2, hw * 2, 3); c.stroke();
    c.fillStyle = '#cfe0da'; c.beginPath(); c.arc(0, 0, R * 0.08, 0, TAU); c.fill();
    c.restore();
    return hl;
  }
  function bulb(c, bx, by, lit) {
    if (lit > 0.02) W5.glow(c, bx, by, 48, ENE, 0.75 * lit);
    c.fillStyle = mixHex('#3a4a45', '#fff4b0', lit); c.beginPath(); c.arc(bx, by, 17, 0, TAU); c.fill();
    c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7f918a'; c.fillRect(bx - 8, by + 15, 16, 11);
    c.strokeStyle = mixHex('#6d817a', '#ffb000', lit); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx - 6, by + 9); c.lineTo(bx - 3, by - 4); c.lineTo(bx, by + 2); c.lineTo(bx + 3, by - 4); c.lineTo(bx + 6, by + 9); c.stroke();
  }
  function turbinePoly(c) {
    c.beginPath(); c.moveTo(TB.x0, TB.cy - TB.h0); c.lineTo(TB.x1, TB.cy - TB.h1);
    c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(TB.x0, TB.cy + TB.h0); c.closePath();
  }
  const CHAIN = [['化學能', 'Chemical'], ['熱能', 'Heat'], ['動能', 'Kinetic'], ['電能', 'Electrical']];
  const CHAIN_AT = [0.4, 1.2, 2.8, 4.2];
  function step3(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const front = ease(seg(u, 0.4, 1.5)), A = amp(t), th = theta(t);
    const cool = ease(seg(u, 4.8, 5.6)), elec = ease(seg(u, 2.8, 4.2));
    withA(c, k, () => {
      /* 小鍋爐（承接上一步） */
      c.fillStyle = '#1a2622'; W5.rr(c, BO.x, BO.y + BO.h + 4, BO.w, 56, 10); c.fill();
      c.save(); W5.rr(c, BO.x, BO.y + BO.h + 4, BO.w, 56, 10); c.clip();
      W5.glow(c, BO.x + BO.w / 2, BO.y + BO.h + 56, 80, HEAT, 0.6);
      for (let i = 0; i < 5; i++) flame(c, BO.x + 15 + i * 20, BO.y + BO.h + 54, 9, t + i, '#ff7a3a', '#ffd27a');
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 2.5; W5.rr(c, BO.x, BO.y + BO.h + 4, BO.w, 56, 10); c.stroke();
      boilerBody(c, BO.x, BO.y, BO.w, BO.h, BO.wl, { steam: 1, boil: 1 }, t);
      /* 回水管（冷凝後的水送回鍋爐） */
      pipe(c, FEED3, WATER, 8);
      flow(c, FEED3, 'rgba(255,255,255,0.55)', t * 60, 30, 9, 3, cool);
      /* 冷凝器外殼 */
      c.fillStyle = '#1a2b27'; W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.fill();
      c.save(); W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.clip();
      c.fillStyle = W5.rgba(WATER, 0.6); c.fillRect(CD.x, CD.y + CD.h - 16, CD.w, 16);
      c.restore();
      /* 冷卻水管：進來藍、出去溫一點 */
      pipe(c, COOL3, WATER, 8);
      c.save(); c.lineJoin = 'round'; subPath(c, COOL3, COOL3.cum[2], COOL3.len); c.strokeStyle = mixHex(WATER, '#fb923c', 0.75 * cool); c.lineWidth = 8; c.stroke(); c.restore();
      flow(c, COOL3, 'rgba(255,255,255,0.55)', t * 80, 30, 9, 3, cool);
      /* 冷凝器裡：蒸氣進來、遇冷凝成水滴 */
      c.save(); W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.clip();
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.9 + hash(i + 1100)) % 1;
        puff(c, 318 + (hash(i + 1110) - 0.5) * 60 * ph, CD.y + 4 + ph * 26, 5 + 3 * ph, STEAM, 0.5 * A * (1 - ph));
      }
      for (let i = 0; i < 12; i++) {
        const ph = (t * 1.2 + hash(i + 1120)) % 1;
        c.fillStyle = W5.rgba(WATER, 0.95 * cool * Math.min(1, ph * 4));
        c.beginPath(); c.ellipse(CD.x + 12 + hash(i + 1130) * (CD.w - 24), CD.y + 30 + ph * 30, 2.6, 3.6, 0, 0, TAU); c.fill();
      }
      c.restore();
      c.strokeStyle = METAL; c.lineWidth = 3; W5.rr(c, CD.x, CD.y, CD.w, CD.h, 14); c.stroke();
      /* 排氣管：渦輪 → 冷凝器 */
      c.fillStyle = SHELL; c.fillRect(302, 318, 32, 36); c.strokeStyle = METAL; c.lineWidth = 2; c.strokeRect(302, 318, 32, 36);
      /* 蒸氣管 */
      pipe(c, STP3, mixHex(EMPTY, STEAM, 0.6), 12, STP3.len * front);
      steamDots(c, STP3, t, STP3.len * front, 1);
      /* 轉軸 */
      c.fillStyle = '#7f918a'; c.fillRect(TB.x0 - 6, TB.cy - 4, GN.x - TB.x0 + 12, 8);
      /* 渦輪外殼與葉片 */
      turbinePoly(c);
      const g = c.createLinearGradient(0, TB.cy - TB.h1, 0, TB.cy + TB.h1);
      g.addColorStop(0, '#34463f'); g.addColorStop(0.5, '#22312d'); g.addColorStop(1, '#34463f');
      c.fillStyle = g; c.fill();
      c.save(); turbinePoly(c); c.clip();
      c.fillStyle = '#7f918a'; c.fillRect(TB.x0, TB.cy - 4, TB.x1 - TB.x0, 8);
      if (front >= 1) {
        for (let i = 0; i < 14; i++) {
          const px = TB.x0 + ((t * 110 + i * 37) % (TB.x1 - TB.x0)), hh = tbHalf(px) * 0.85;
          c.fillStyle = W5.rgba(STEAM, 0.30); c.beginPath(); c.arc(px, TB.cy + (hash(i + 1140) - 0.5) * 2 * hh, 4 + 2 * hash(i + 1150), 0, TAU); c.fill();
        }
      }
      for (let r = 0; r < 6; r++) {
        const x = 264 + r * 24, hh = tbHalf(x) - 6;
        for (let j = 0; j < 10; j++) {
          const a = th + j * TAU / 10 + r * 0.3, yb = TB.cy + hh * Math.cos(a), fr = Math.sin(a) > 0;
          c.strokeStyle = fr ? '#d8e8e2' : '#56685f'; c.lineWidth = fr ? 3.2 : 2.2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(x - 5, yb - 4); c.lineTo(x + 5, yb + 4); c.stroke();
        }
      }
      c.restore();
      turbinePoly(c); c.strokeStyle = METAL; c.lineWidth = 3; c.stroke();
      /* 發電機（側視外殼，微光＝在發電） */
      c.fillStyle = SHELL; W5.rr(c, GN.x, GN.y, GN.w, GN.h, 14); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 3; c.stroke();
      const gl = elec * Math.abs(emf(t));
      if (gl > 0.02) W5.glow(c, GN.cx, GN.cy, 46, ENE, 0.45 * gl);
      c.strokeStyle = COPPER; c.lineWidth = 3;
      for (let i = 0; i < 7; i++) { const x = GN.x + 16 + i * 12; c.beginPath(); c.moveTo(x, GN.y + 14); c.lineTo(x + 4, GN.y + GN.h - 14); c.stroke(); }
      /* 放大線：發電機 → 說明板 */
      c.save(); c.globalAlpha *= 0.8; c.strokeStyle = ENE; c.lineWidth = 1.5; c.setLineDash([5, 5]);
      c.beginPath(); c.moveTo(GN.x + GN.w, GN.y + 6); c.lineTo(PN3.x, PN3.y + 10); c.moveTo(GN.x + GN.w, GN.y + GN.h - 6); c.lineTo(PN3.x, PN3.y + PN3.h - 10); c.stroke();
      c.restore();
      /* 說明板：磁鐵在線圈中轉動、燈泡、交流波形 */
      c.fillStyle = 'rgba(11,26,21,0.92)'; W5.rr(c, PN3.x, PN3.y, PN3.w, PN3.h, 16); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(ENE, 0.55); c.stroke();
    });
    const MX = 712, MY = 240, MR = 52;
    let hl = 0;
    withA(c, k, () => { hl = magnetCoil(c, MX, MY, MR, th + Math.PI / 2, elec * Math.abs(emf(t))); });
    const d = hl * 0.55, ma = th + Math.PI / 2;
    T(c, k, 'N', MX + Math.cos(ma) * d, MY + Math.sin(ma) * d + 1, '#ffffff', 20, 'center', true);
    T(c, k, 'S', MX - Math.cos(ma) * d, MY - Math.sin(ma) * d + 1, '#ffffff', 20, 'center', true);
    const lit = elec * A;
    withA(c, k, () => {
      bulb(c, 868, 198, lit);
      const X0 = 806, X1 = 924, YC = 290, AMP = 22, WIN = 2.4;
      c.strokeStyle = 'rgba(163,184,176,0.5)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(X0, YC); c.lineTo(X1, YC); c.moveTo(X0, YC - AMP - 4); c.lineTo(X0, YC + AMP + 4); c.stroke();
      c.strokeStyle = ENE; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
      for (let px = 0; px <= X1 - X0; px += 2) {
        const tt = t - (1 - px / (X1 - X0)) * WIN, y = YC - AMP * elec * emf(tt);
        if (px === 0) c.moveTo(X0 + px, y); else c.lineTo(X0 + px, y);
      }
      c.stroke();
    });
    T(c, k, L('線圈', 'Coils'), MX, 326, COPPER, 20);
    T(c, k, L('交流電', 'AC'), 865, 338, ENE, 20);

    /* 元件名稱 */
    T(c, k, L('鍋爐', 'Boiler'), BO.x + BO.w / 2, 404, WHITE, 20);
    T(c, k * front, L('水蒸氣', 'Steam'), 160, 176, STEAM, 20, 'left');
    T(c, k, L('渦輪機', 'Turbine'), 334, 166, WHITE, 20);
    T(c, k, L('發電機', 'Generator'), GN.cx, 186, WHITE, 20);
    T(c, k, L('冷凝器', 'Condenser'), 408, 338, WHITE, 20, 'left');
    T(c, k * Math.max(0.45, cool), L('冷卻水', 'Cooling water'), 610, 392, WATER, 20, 'left');
    T(c, k * cool, L('水送回鍋爐', 'To boiler'), 192, 334, WATER, 20, 'left');

    /* 上方：能量流轉長條 */
    const sz = 22, gap = 44;
    const ws = CHAIN.map(p => W5.tw(c, L(p[0], p[1]), sz) + 28);
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (CHAIN.length - 1);
    let x = 480 - tot / 2;
    CHAIN.forEach((p, i) => {
      const on = seg(u, CHAIN_AT[i], CHAIN_AT[i] + 0.5);
      const cx = x + ws[i] / 2;
      if (on > 0.02) withA(c, k * on, () => W5.glow(c, cx, 104, ws[i] * 0.6, ENE, 0.35));
      P(c, k, L(p[0], p[1]), cx, 104, mixHex('#6f7f78', ENE, on), sz);
      if (i < CHAIN.length - 1) {
        const nx = seg(u, CHAIN_AT[i + 1], CHAIN_AT[i + 1] + 0.5);
        withA(c, k, () => W5.arrow(c, x + ws[i] + 8, 104, x + ws[i] + gap - 8, 104, mixHex('#6f7f78', ENE, nx), 3.5, 11));
      }
      x += ws[i] + gap;
    });
  }

  /* ═════════════════ 第 4 步：燃煤與燃氣比一比 ═════════════════ */
  function plant4(c, cx, coal, t, a) {
    withA(c, a, () => {
      const gy = 262;
      c.fillStyle = '#2a3a34'; c.fillRect(cx - 220, gy, 440, 6);
      /* 廠房 */
      c.fillStyle = '#2b4a40'; c.beginPath();
      c.moveTo(cx - 70, gy); c.lineTo(cx - 70, 206); c.lineTo(cx - 20, 190); c.lineTo(cx + 30, 206); c.lineTo(cx + 80, 206); c.lineTo(cx + 80, gy); c.closePath(); c.fill();
      c.strokeStyle = '#cfe0da'; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,224,102,0.45)';
      for (let i = 0; i < 4; i++) c.fillRect(cx - 56 + i * 32, 222, 16, 14);
      /* 煙囪 */
      const chx = coal ? cx - 118 : cx - 112, chw = coal ? 30 : 22, chy = coal ? 128 : 150;
      const cg = c.createLinearGradient(chx, 0, chx + chw, 0);
      cg.addColorStop(0, '#4b5a54'); cg.addColorStop(0.5, '#6d7b76'); cg.addColorStop(1, '#3e4b46');
      c.fillStyle = cg; c.fillRect(chx, chy, chw, gy - chy);
      c.fillStyle = '#c75a3a'; c.fillRect(chx, chy + 8, chw, 5); c.fillRect(chx, chy + 22, chw, 5);
      /* 燃料：煤堆／天然氣儲槽 */
      if (coal) {
        for (let i = 0; i < 10; i++) {
          const row = i < 5 ? 0 : i < 8 ? 1 : 2, col = row === 0 ? i : row === 1 ? i - 5 : i - 8;
          lump(c, cx + 112 + col * 16 + row * 8, gy - 8 - row * 12, 9, i + 20);
        }
      } else {
        c.strokeStyle = METAL; c.lineWidth = 3;
        c.beginPath(); c.moveTo(cx + 124, gy); c.lineTo(cx + 132, 236); c.moveTo(cx + 164, gy); c.lineTo(cx + 156, 236); c.stroke();
        const tg = c.createRadialGradient(cx + 136, 214, 4, cx + 144, 222, 30);
        tg.addColorStop(0, '#e3eef4'); tg.addColorStop(1, '#7f9aa8');
        c.fillStyle = tg; c.beginPath(); c.arc(cx + 144, 222, 28, 0, TAU); c.fill();
        c.fillStyle = '#5c6f78'; c.fillRect(cx + 80, 250, 36, 6);
      }
      /* 煙：燃煤濃、灰、帶黃（硫氧化物）；燃氣淡 */
      const n = coal ? 10 : 5;
      for (let i = 0; i < n; i++) {
        const ph = (t * 0.35 + i / n) % 1;
        const x = chx + chw / 2 + ph * (coal ? 150 : 110) + 5 * Math.sin(t * 0.9 + i);
        const y = chy - 8 - ph * (coal ? 34 : 28);
        const r = (coal ? 9 : 6) + ph * (coal ? 15 : 10);
        puff(c, x, y, r, coal ? mixHex('#7d8580', '#a49a6a', hash(i + 1200) * 0.6) : '#cfdad6', (coal ? 0.75 : 0.35) * (1 - ph));
      }
      if (coal) {      /* 煤灰：細小的灰點往下飄 */
        c.fillStyle = '#9aa29e';
        for (let i = 0; i < 26; i++) {
          const ph = (t * 0.25 + hash(i + 1210)) % 1;
          const x = chx + 30 + hash(i + 1220) * 150 + ph * 20, y = chy - 30 + ph * 70;
          c.globalAlpha = a * Math.sin(ph * Math.PI) * 0.9; c.beginPath(); c.arc(x, y, 1.8, 0, TAU); c.fill();
        }
        c.globalAlpha = a;
      }
    });
  }
  function step4(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const CXs = [247, 713];
    withA(c, k * 0.6, () => {
      c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 2; c.setLineDash([6, 8]);
      c.beginPath(); c.moveTo(480, 96); c.lineTo(480, 386); c.stroke(); c.setLineDash([]);
    });
    const a0 = k * seg(u, 0.2, 0.7), a1 = k * seg(u, 0.8, 1.3);
    plant4(c, CXs[0], true, t, a0);
    plant4(c, CXs[1], false, t, a1);
    T(c, a0, L('燃煤電廠', 'Coal-fired plant'), CXs[0], 288, NON, 24);
    T(c, a1, L('燃氣電廠', 'Gas-fired plant'), CXs[1], 288, NON, 24);
    const e0 = k * seg(u, 1.4, 1.9), e1 = k * seg(u, 1.9, 2.4);
    T(c, e0, L('硫氧化物、煤灰較多', 'More sulfur oxides and ash'), CXs[0], 322, '#e2d08a', 20);
    T(c, e1, L('汙染物較少', 'Fewer pollutants'), CXs[1], 322, '#cfe0da', 20);

    /* CO₂ 長條：同一把尺 */
    const BW = 240, BH = 24, BY = 362;
    const f0 = ease(seg(u, 2.4, 3.6)), f1 = ease(seg(u, 3.2, 4.4));
    [[CXs[0], f0 * 1.0, '100%'], [CXs[1], f1 * 0.6, L('約 60%', '~60%')]].forEach(([cx, f, txt], i) => {
      const a = k * seg(u, 2.2 + i * 0.6, 2.6 + i * 0.6), bx = cx - 150;
      T(c, a, 'CO₂', bx - 12, BY, SMOKE, 22, 'right', true);
      bar(c, bx, BY, BW, BH, f, SMOKE, a);
      const done = i === 0 ? seg(u, 3.5, 3.8) : seg(u, 4.3, 4.6);
      T(c, a * done, txt, bx + BW + 12, BY, WHITE, 22, 'left', true);
    });
    P(c, k * seg(u, 4.9, 5.4), L('兩者都排放二氧化碳', 'Both release carbon dioxide (CO₂)'), 480, 414, ENE, 22);
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['化石燃料哪裡來', 'Where do fossil fuels come from?'],
      sub: ['遠古生物死後被泥沙埋住，越埋越深，經過數百萬年的高溫高壓', 'Ancient life was buried by mud and sand, sank deeper, and was heated and squeezed for millions of years.'],
      con: ['結論：煤、石油、天然氣都是遠古生物變成的——化石燃料', 'Conclusion: coal, oil and natural gas formed from ancient life: fossil fuels.'] },
    { title: ['鍋爐燒開水：化學能 → 熱能', 'The boiler: chemical energy → heat'],
      sub: ['燃燒煤或天然氣，把鍋爐裡的水煮成高溫高壓的水蒸氣', 'Burning coal or natural gas boils the water into high-temperature, high-pressure steam.'],
      con: ['結論：燃料的化學能 → 熱能；煙囪排出二氧化碳', 'Conclusion: the fuel\'s chemical energy → heat; the chimney releases CO₂.'] },
    { title: ['渦輪帶動發電機', 'Steam turns the turbine and generator'],
      sub: ['蒸氣推動渦輪旋轉，渦輪軸帶動發電機裡的磁鐵轉動，燈泡亮了', 'Steam spins the turbine; its shaft turns the magnet in the generator, and the bulb lights up.'],
      con: ['結論：化學能 → 熱能 → 動能 → 電能；用過的蒸氣被冷卻水凝結回水', 'Conclusion: chemical → heat → kinetic → electrical. Cooling water turns used steam back into water.'] },
    { title: ['燃煤與燃氣比一比', 'Coal vs. natural gas'],
      sub: ['燃煤的汙染物較多；燃氣比較乾淨，CO₂ 約只有燃煤的六成', 'Coal gives off more pollutants; gas is cleaner, with about 60% of coal\'s CO₂.'],
      con: ['結論：兩者都燒化石燃料，都會排放二氧化碳', 'Conclusion: both burn fossil fuels, and both release carbon dioxide.'] }
  ];

  W5.register('thermal', {
    canvas: 'cvs-thermal',
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
