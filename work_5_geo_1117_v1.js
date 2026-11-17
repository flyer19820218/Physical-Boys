/* ==================================================================
   work_5 ｜ 地熱、洋流與潮汐（cvs-geo，960×540）
   四步：1 地熱發電（生產井→渦輪發電機→回注井） → 2 洋流發電（黑潮推動水下渦輪）
        → 3 潮汐發電（潮差→閘門→水輪發電機；一天兩次漲退潮） → 4 台灣目前的現況（三張卡片＋技術成熟度）
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（與 solar／hydrowind／thermal 一致）：能量＝黃 ENE、熱＝橘紅 HEAT、水＝藍 WATER、
   蒸氣＝淡白 STEAM、再生能源＝綠 REN #33cc99；研發中／警示＝橘 CAUTION。
   發電不畫電子、不畫電流小點：只用發電機微光、輸電線黃色流動與房子亮燈表示（比照 thermal）。

   純函式作法：所有畫面都由 s 算出；轉子角度用角速度的解析積分，潮汐的水流用固定步長的數值積分
   （同一個 u 一定得到同一個結果），跳步驟不走樣；亂數一律 W5.hash；文字一律 L('中文','English')（＝頁面 tr）；
   畫布字 ≥ 20px；畫布頂端 0～30px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。不用任何圖片檔。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const ENE = COL.energy;            /* 能量：黃 */
  const HEAT = '#ff6a3d';            /* 熱：橘紅 */
  const WATER = '#5ab8e8';           /* 水：藍 */
  const STEAM = '#e8f1f4';           /* 蒸氣：淡白 */
  const REN = '#33cc99';             /* 再生能源：綠 */
  const CAUTION = '#fb923c', COLD = '#72b9ff';
  const WHITE = COL.white, DIM = COL.dim, GOOD = COL.green;
  const METAL = '#8fa39c', SHELL = '#22312d', EMPTY = '#14241f', INK = '#0b1a15';
  const GROUND = '#2c4a3a', GROUND_EDGE = '#5f8a6c', ROCK = '#3a4f44';
  const DUR = [9, 9, 9, 9];          /* 總長 36 秒 */

  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
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
  /* 多行標籤（自動換行），回傳行數 */
  function TW(c, a, str, x, y, col, size, maxW, lh, align) {
    const lines = [].concat(...str.split('\n').map(part => wrap(c, part, size, maxW)));
    lines.forEach((l, i) => T(c, a, l, x, y + i * lh, col, size, align));
    return lines.length;
  }
  /* 底部字幕：說明一般框、結論綠框（同 hydrowind／thermal） */
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

  /* ── 路徑工具（同 hydrowind） ── */
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
  function flow(c, path, col, off, gap, dash, w, a, dEnd) {
    if (a != null && a <= 0.02) return;
    const end = dEnd == null ? path.len : dEnd;
    c.save(); if (a != null) c.globalAlpha *= a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    const s0 = ((off % gap) + gap) % gap;
    for (let d = s0 - gap; d < end; d += gap) {
      const p = Math.max(0, d), q = Math.min(end, d + dash);
      if (q > p + 0.5) { subPath(c, path, p, q); c.stroke(); }
    }
    c.restore();
  }
  /* 角速度 v·smoothstep 的解析積分（從 a 秒開始加速、b 秒到全速） */
  function ramp(u, a, b, v) {
    if (u <= a) return 0;
    const D = b - a, x = (u - a) / D;
    if (x < 1) return v * D * (x * x * x - x * x * x * x / 2);
    return v * (D / 2 + (u - b));
  }

  /* ── 共用小零件 ── */
  /* 上方能量流轉條：items＝[[中,英,亮起的顏色]]，ats＝各自亮起的秒數（同 hydrowind） */
  function chain(c, k, u, items, ats, y) {
    const sz = 22, gap = 44;
    const ws = items.map(p => W5.tw(c, L(p[0], p[1]), sz) + 28);
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let x = 480 - tot / 2;
    items.forEach((p, i) => {
      const on = seg(u, ats[i], ats[i] + 0.5), col = p[2] || ENE;
      const cx = x + ws[i] / 2;
      if (on > 0.02) withA(c, k * on, () => W5.glow(c, cx, y, ws[i] * 0.6, col, 0.3));
      P(c, k, L(p[0], p[1]), cx, y, mixHex('#6f7f78', col, on), sz);
      if (i < items.length - 1) {
        const nx = seg(u, ats[i + 1], ats[i + 1] + 0.5), ncol = items[i + 1][2] || ENE;
        withA(c, k, () => W5.arrow(c, x + ws[i] + 8, y, x + ws[i] + gap - 8, y, mixHex('#6f7f78', ncol, nx), 3.5, 11));
      }
      x += ws[i] + gap;
    });
  }
  function house(c, x, y, w, h, lit) {   /* (x,y) 牆的左上角 */
    c.fillStyle = '#41524c'; c.fillRect(x, y, w, h);
    c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + w / 2, y - h * 0.55); c.lineTo(x + w + 4, y); c.closePath(); c.fillStyle = '#6a7c76'; c.fill();
    const ww = w * 0.24;
    [x + w * 0.16, x + w * 0.6].forEach(xx => { c.fillStyle = mixHex('#1a2a25', ENE, lit); c.fillRect(xx, y + h * 0.3, ww, ww); });
    if (lit > 0.02) W5.glow(c, x + w / 2, y + h / 2, w * 0.8, ENE, 0.35 * lit);
  }
  function generator(c, gx, gy, sz, glowA, th) {
    if (glowA > 0.02) W5.glow(c, gx, gy, sz * 1.9, ENE, 0.55 * glowA * (0.8 + 0.2 * Math.sin(th * 2)));
    c.fillStyle = '#33423e'; W5.rr(c, gx - sz / 2, gy - sz / 2, sz, sz, 7); c.fill();
    c.strokeStyle = '#d08a4a'; c.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const xx = gx - sz * 0.33 + i * sz * 0.22; c.beginPath(); c.moveTo(xx, gy - sz * 0.36); c.lineTo(xx + 2, gy + sz * 0.36); c.stroke(); }
  }
  function powerLine(c, a, b, on, u) {
    c.strokeStyle = '#7d8f89'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    if (on > 0.02) {
      c.save(); c.globalAlpha *= on; c.strokeStyle = ENE; c.lineWidth = 3; c.setLineDash([10, 12]); c.lineDashOffset = -u * 60;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore();
    }
  }
  /* 水下渦輪／小風車式轉子（正面看：三片葉片） */
  function rotor(c, x, y, R, th, col) {
    for (let j = 0; j < 3; j++) {
      c.save(); c.translate(x, y); c.rotate(th + j * TAU / 3);
      c.fillStyle = col; c.beginPath(); c.moveTo(0, -R * 0.07);
      c.quadraticCurveTo(R * 0.4, -R * 0.16, R, -R * 0.03); c.lineTo(R, R * 0.03); c.quadraticCurveTo(R * 0.4, R * 0.08, 0, R * 0.07); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = METAL; c.beginPath(); c.arc(x, y, Math.max(4, R * 0.11), 0, TAU); c.fill();
  }
  /* 小圖示 */
  function iconCheck(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - r * 0.45, y + r * 0.02); c.lineTo(x - r * 0.1, y + r * 0.38); c.lineTo(x + r * 0.5, y - r * 0.35); c.stroke();
  }
  function iconWarn(c, x, y, r) {
    c.fillStyle = CAUTION; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 1.05, y + r * 0.8); c.lineTo(x - r * 1.05, y + r * 0.8); c.closePath(); c.fill();
    c.fillStyle = INK; c.fillRect(x - 1.6, y - r * 0.45, 3.2, r * 0.7); c.beginPath(); c.arc(x, y + r * 0.5, 2, 0, TAU); c.fill();
  }
  function iconPlates(c, x, y) {
    c.fillStyle = '#7d6a55'; c.beginPath(); c.moveTo(x - 16, y - 2); c.lineTo(x - 1, y - 8); c.lineTo(x - 1, y + 9); c.lineTo(x - 16, y + 9); c.closePath(); c.fill();
    c.fillStyle = '#9a8468'; c.beginPath(); c.moveTo(x + 1, y - 8); c.lineTo(x + 16, y - 3); c.lineTo(x + 16, y + 9); c.lineTo(x + 1, y + 9); c.closePath(); c.fill();
    c.fillStyle = HEAT; c.beginPath(); c.moveTo(x - 3, y + 9); c.lineTo(x, y - 2); c.lineTo(x + 3, y + 9); c.closePath(); c.fill();
  }
  function iconLab(c, x, y, r, col) {    /* 研發中：燒瓶 */
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - r * 0.18, y - r * 0.55); c.lineTo(x - r * 0.18, y - r * 0.1); c.lineTo(x - r * 0.5, y + r * 0.45);
    c.lineTo(x + r * 0.5, y + r * 0.45); c.lineTo(x + r * 0.18, y - r * 0.1); c.lineTo(x + r * 0.18, y - r * 0.55); c.stroke();
    c.beginPath(); c.moveTo(x - r * 0.32, y - r * 0.55); c.lineTo(x + r * 0.32, y - r * 0.55); c.stroke();
  }

  /* ═════════════════ 第 1 步：地熱發電 ═════════════════ */
  const GT = 210;                                       /* 地表 */
  const PROD = mkPath([[110, 420], [110, 190], [190, 190]]);
  const RET = mkPath([[330, 195], [470, 195], [470, 420]]);
  const UG = mkPath([[470, 420], [420, 428], [360, 413], [300, 426], [240, 411], [180, 424], [110, 420]]);
  const PL1 = { x: 190, y: 160, w: 140, h: 50 };
  const PN1 = { x: 606, y: 150, w: 324, h: 292 };
  function step1(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const heat = ease(seg(u, 0.5, 1.6));
    const up = ease(seg(u, 1.2, 2.6));
    const th = ramp(u, 2.2, 3.4, TAU * 1.4);
    const elec = ease(seg(u, 2.6, 3.4));
    const wire = seg(u, 3.0, 3.5);
    const back = ease(seg(u, 2.8, 3.8));
    const ugA = seg(u, 1.0, 1.6);

    withA(c, k, () => {
      /* 天空下緣的地表與地層 */
      c.fillStyle = GROUND; c.fillRect(40, GT, 550, 70);
      c.fillStyle = ROCK; c.fillRect(40, 280, 550, 80);
      const hg = c.createLinearGradient(0, 360, 0, 445);
      hg.addColorStop(0, mixHex('#3e3a30', '#5a3022', heat)); hg.addColorStop(1, mixHex('#40352c', '#8a3a20', heat));
      c.fillStyle = hg; c.fillRect(40, 360, 550, 85);
      /* 高溫岩層發光 */
      for (let i = 0; i < 6; i++) {
        const x = 80 + i * 92 + 18 * hash(i + 30), y = 420 + 14 * hash(i + 40);
        W5.glow(c, x, y, 58, HEAT, 0.28 * heat * (0.8 + 0.2 * Math.sin(t * 1.7 + i)));
      }
      c.strokeStyle = 'rgba(246,243,234,0.18)'; c.lineWidth = 1.5;
      [280, 360].forEach((yy, j) => { c.beginPath(); for (let x = 40; x <= 590; x += 10) { const y = yy + 3 * Math.sin(x / 37 + j * 2); if (x === 40) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); });
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 3; c.beginPath(); c.moveTo(40, GT); c.lineTo(590, GT); c.stroke();
      /* 地下裂隙裡的水：從回注井流向生產井，一路被岩層加熱（藍→橘紅） */
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      subPath(c, UG, 0, UG.len); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 12; c.stroke(); c.restore();
      withA(c, ugA, () => {
        const N = 20;
        for (let i = 0; i < N; i++) {
          const d = ((i / N) * UG.len + u * 45) % UG.len, q = at(UG, d), f = d / UG.len;
          c.fillStyle = mixHex(COLD, HEAT, f); c.beginPath(); c.arc(q.x, q.y, 4, 0, TAU); c.fill();
        }
      });
      /* 生產井：熱水與蒸氣往上 */
      pipe(c, PROD, mixHex(HEAT, '#ffb08f', 0.25), 12, PROD.len * up);
      flow(c, PROD, W5.rgba(STEAM, 0.95), u * 120, 28, 10, 3.5, up > 0.02 ? 1 : 0, PROD.len * up);
      /* 回注井：用過的水往下 */
      pipe(c, RET, W5.rgba(WATER, 0.9), 12, RET.len * back);
      flow(c, RET, 'rgba(230,246,255,0.85)', u * 90, 30, 10, 3, back > 0.02 ? 1 : 0, RET.len * back);
      /* 冷卻塔＋白色蒸氣 */
      c.fillStyle = '#9fb0ab'; c.beginPath();
      c.moveTo(384, 150); c.quadraticCurveTo(392, 180, 378, GT); c.lineTo(422, GT); c.quadraticCurveTo(408, 180, 416, 150); c.closePath(); c.fill();
      c.strokeStyle = '#d6e2de'; c.lineWidth = 1.5; c.stroke();
      const plume = seg(u, 2.4, 3.2);
      if (plume > 0.02) {
        for (let i = 0; i < 7; i++) {
          const ph = (u * 0.45 + i / 7) % 1, x = 400 + ph * 26 + 4 * Math.sin(i + u), y = 148 - ph * 18, r = 6 + ph * 9;
          c.fillStyle = W5.rgba(STEAM, 0.55 * plume * (1 - ph)); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        }
      }
      /* 發電廠：渦輪＋發電機 */
      c.fillStyle = SHELL; c.fillRect(PL1.x, PL1.y, PL1.w, PL1.h);
      c.strokeStyle = METAL; c.lineWidth = 3; c.strokeRect(PL1.x, PL1.y, PL1.w, PL1.h);
      const tx = 228, ty = 185, tr0 = 17;
      c.fillStyle = EMPTY; c.beginPath(); c.arc(tx, ty, tr0 + 4, 0, TAU); c.fill();
      c.strokeStyle = STEAM; c.lineWidth = 3;
      for (let j = 0; j < 8; j++) {
        const a = th + j * TAU / 8;
        c.beginPath(); c.moveTo(tx + Math.cos(a) * 5, ty + Math.sin(a) * 5);
        c.quadraticCurveTo(tx + Math.cos(a + 0.5) * tr0 * 0.7, ty + Math.sin(a + 0.5) * tr0 * 0.7, tx + Math.cos(a + 0.3) * tr0, ty + Math.sin(a + 0.3) * tr0); c.stroke();
      }
      c.fillStyle = METAL; c.beginPath(); c.arc(tx, ty, 5, 0, TAU); c.fill();
      c.strokeStyle = METAL; c.lineWidth = 4; c.beginPath(); c.moveTo(tx + 8, ty); c.lineTo(272, ty); c.stroke();
      generator(c, 290, 185, 34, elec, th);
      /* 輸電：發電廠 → 房子 */
      house(c, 48, 186, 40, 24, wire * elec);
      powerLine(c, [PL1.x + 4, PL1.y + 4], [68, 173], wire, u);
    });

    T(c, k, L('渦輪發電機', 'Turbine & generator'), 260, 140, WHITE, 20);
    T(c, k * seg(u, 1.2, 1.7), L('生產井', 'Production well'), 124, 244, WHITE, 20, 'left');
    T(c, k * seg(u, 1.6, 2.1), L('熱水＋蒸氣', 'Hot water + steam'), 124, 272, '#ffb08f', 20, 'left');
    T(c, k * seg(u, 2.9, 3.4), L('回注井', 'Injection well'), 456, 310, WHITE, 20, 'right');
    T(c, k * seg(u, 3.2, 3.7), L('送回地下', 'Sent back down'), 456, 338, WATER, 20, 'right');
    T(c, k * heat, L('高溫岩層', 'Hot rock'), 290, 385, '#ffb08f', 20);

    /* 右側說明板：穩定發電／板塊交界／酸性腐蝕 */
    const a1 = k * seg(u, 3.6, 4.1), a2 = k * seg(u, 4.4, 4.9), a3 = k * seg(u, 5.2, 5.7);
    withA(c, a1, () => {
      c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, PN1.x, PN1.y, PN1.w, PN1.h, 16); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(REN, 0.55); c.stroke();
    });
    const tx0 = PN1.x + 50, mw = PN1.w - 64, lh = 27, gp = 22;
    let y = PN1.y + 32;
    if (a1 > 0.02) {
      withA(c, a1, () => iconCheck(c, PN1.x + 26, y, 13, REN));
      y += TW(c, a1, L('地熱：穩定發電、\n不受天氣影響', 'Geothermal: steady power, unaffected by weather'), tx0, y, REN, 20, mw, lh, 'left') * lh + gp;
    }
    if (a2 > 0.02) {
      withA(c, a2, () => iconPlates(c, PN1.x + 26, y));
      y += TW(c, a2, L('台灣位在板塊交界，\n地熱資源豐富', 'Taiwan sits on a plate boundary: rich in geothermal heat'), tx0, y, DIM, 20, mw, lh, 'left') * lh + gp;
    }
    if (a3 > 0.02) {
      withA(c, a3, () => iconWarn(c, PN1.x + 26, y, 13));
      TW(c, a3, L('水的酸性強，\n容易腐蝕設備', 'Its water is acidic and corrodes equipment'), tx0, y, CAUTION, 20, mw, lh, 'left');
    }

    chain(c, k, u, [['地熱的熱能', 'Geothermal heat', HEAT], ['動能', 'Kinetic'], ['電能', 'Electrical']], [0.8, 2.4, 3.0], 104);
  }

  /* ═════════════════ 第 2 步：洋流發電（黑潮） ═════════════════ */
  const SEA2 = { x0: 40, x1: 850, top: 160, bed: 440 };
  const HUB2 = { x: 600, y: 268, R: 72 };
  const CUR = 170;                                      /* 海流全速時的流線速度（px/s） */
  const curD = u => ramp(u, 0.4, 1.8, 1);               /* 海流「走了多遠」的係數（秒×速度比） */
  const vProf = y => 0.3 + 0.9 * Math.exp(-Math.pow((y - 290) / 75, 2));   /* 黑潮核心最快 */
  function step2(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const D = curD(u);
    const th = 2.2 * ramp(u, 1.2, 2.4, 1) * 1.6;
    const elec = ease(seg(u, 2.0, 2.6));
    const wire = seg(u, 2.6, 3.2);

    withA(c, k, () => {
      /* 海水 */
      const g = c.createLinearGradient(0, SEA2.top, 0, SEA2.bed);
      g.addColorStop(0, W5.rgba(WATER, 0.42)); g.addColorStop(1, W5.rgba('#1d5a7a', 0.55));
      c.fillStyle = g; c.beginPath(); c.moveTo(SEA2.x0, SEA2.bed);
      for (let x = SEA2.x0; x <= SEA2.x1; x += 6) c.lineTo(x, SEA2.top + 3 * Math.sin(x / 24 + t * 1.5));
      c.lineTo(SEA2.x1, SEA2.bed); c.closePath(); c.fill();
      /* 黑潮核心帶（淡淡一層） */
      const kg = c.createLinearGradient(0, 205, 0, 375);
      kg.addColorStop(0, W5.rgba(WATER, 0)); kg.addColorStop(0.5, W5.rgba('#7fd0ff', 0.16)); kg.addColorStop(1, W5.rgba(WATER, 0));
      c.fillStyle = kg; c.fillRect(SEA2.x0, 205, SEA2.x1 - SEA2.x0, 170);
      /* 流線粒子：越靠黑潮核心越快、越長 */
      c.lineCap = 'round';
      const span = SEA2.x1 - SEA2.x0;
      for (let i = 0; i < 64; i++) {
        const y = 176 + hash(i + 600) * 252, v = vProf(y);
        const x = SEA2.x0 + (((hash(i + 610) * span + D * CUR * v) % span) + span) % span;
        const len = 14 + 46 * v * clamp01(D * 2 + 0.25);
        c.strokeStyle = W5.rgba('#dff4ff', 0.25 + 0.45 * v); c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(Math.min(x + len, SEA2.x1), y); c.stroke();
      }
      c.strokeStyle = 'rgba(216,240,255,0.65)'; c.lineWidth = 2; c.beginPath();
      for (let x = SEA2.x0; x <= SEA2.x1; x += 6) { const y = SEA2.top + 3 * Math.sin(x / 24 + t * 1.5); if (x === SEA2.x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 海床與右側陸地 */
      c.fillStyle = '#3a3a2e'; c.beginPath(); c.moveTo(40, 445); c.lineTo(40, 436);
      c.quadraticCurveTo(300, 426, 560, 438); c.quadraticCurveTo(700, 444, 850, 432); c.lineTo(850, 445); c.closePath(); c.fill();
      c.fillStyle = GROUND; c.beginPath(); c.moveTo(850, 445); c.lineTo(850, 140); c.lineTo(920, 140); c.lineTo(920, 445); c.closePath(); c.fill();
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 3; c.beginPath(); c.moveTo(850, 445); c.lineTo(850, 140); c.lineTo(920, 140); c.stroke();
      /* 海底電纜 → 陸上房子 */
      const cab = mkPath([[HUB2.x, 434], [700, 437], [842, 432], [842, 150], [880, 150]]);
      c.save(); subPath(c, cab, 0, cab.len); c.strokeStyle = '#5c6d67'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); c.restore();
      if (wire > 0.02) flow(c, cab, ENE, u * 70, 22, 10, 3, wire);
      house(c, 868, 122, 36, 18, wire * elec);
      /* 水下渦輪：塔柱＋機艙＋葉片 */
      c.fillStyle = '#8e9c97'; c.beginPath();
      c.moveTo(HUB2.x - 4, HUB2.y); c.lineTo(HUB2.x + 4, HUB2.y); c.lineTo(HUB2.x + 9, 438); c.lineTo(HUB2.x - 9, 438); c.closePath(); c.fill();
      c.fillStyle = '#5d6e68'; c.fillRect(HUB2.x - 18, 432, 36, 8);
      generator(c, HUB2.x + 20, HUB2.y, 26, elec, th);
      rotor(c, HUB2.x, HUB2.y, HUB2.R, th, '#f6f3ea');
    });

    P(c, k * seg(u, 0.6, 1.1), L('黑潮', 'Kuroshio'), 130, 222, WATER, 22);
    withA(c, k * seg(u, 0.6, 1.1), () => W5.arrow(c, 80, 258, 190, 258, '#bfe6ff', 4, 14));
    P(c, k * seg(u, 1.4, 1.9), L('黑潮流速約每秒 1 公尺以上', 'Kuroshio speed: about 1 m/s or more'), 300, 400, '#bfe6ff', 20);
    P(c, k * seg(u, 1.8, 2.3), L('水下渦輪', 'Underwater turbine'), 616, 366, WHITE, 20, 'left');
    T(c, k * seg(u, 0.2, 0.7), L('海面', 'Sea surface'), 120, 140, DIM, 20);
    P(c, k * wire, L('海底電纜', 'Seabed cable'), 836, 414, ENE, 20, 'right');

    chain(c, k, u, [['海流的動能', "Current's kinetic energy", WATER], ['電能', 'Electrical']], [0.9, 2.3], 104);
  }

  /* ═════════════════ 第 3 步：潮汐發電 ═════════════════ */
  const T3 = { h0: 0.8, h1: 8.6 };                     /* 0.8～8.6 秒走完一天（24 小時） */
  const hourOf = u => 24 * clamp01((u - T3.h0) / (T3.h1 - T3.h0));
  const MID3 = 262;
  const seaY = h => MID3 - 58 * Math.sin(TAU * h / 12);              /* 一天兩次滿潮（3 時、15 時）、兩次乾潮 */
  const gateOpen = u => ease(seg(u, 1.0, 1.8));
  const basinY = (h, g) => MID3 - g * 26 * Math.sin(TAU * h / 12 - 1.05);
  function tide(u) {                                    /* 固定步長積分：同一個 u 一定得同一結果 */
    let th = 0, off = 0; const dt = 0.02;
    const fAt = v => { const h = hourOf(v), g = gateOpen(v); return g * (basinY(h, g) - seaY(h)) / 60; };
    for (let v = 0; v < u; v += dt) { const f = fAt(v); th += Math.abs(f) * 7 * dt; off += f * 120 * dt; }
    const h = hourOf(u), g = gateOpen(u);
    return { h, g, ys: seaY(h), yb: basinY(h, g), f: fAt(u), th, off };
  }
  const DAM = { x0: 375, x1: 465, top: 150, bed: 440 };
  const TUN = { y0: 392, y1: 424 };
  const CK = { x: 836, y: 238, R: 54 };
  function step3(c, s) {
    const u = s.u, k = s.k, t = s.t;
    const S = tide(u), af = clamp01(Math.abs(S.f) * 2.2);

    withA(c, k, () => {
      /* 海（左）：水位隨潮汐升降 */
      c.fillStyle = W5.rgba(WATER, 0.6); c.beginPath(); c.moveTo(40, DAM.bed);
      for (let x = 40; x <= DAM.x0 + 6; x += 6) c.lineTo(x, S.ys + 3 * Math.sin(x / 22 + t * 1.6));
      c.lineTo(DAM.x0 + 6, DAM.bed); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(216,240,255,0.7)'; c.lineWidth = 2; c.beginPath();
      for (let x = 40; x <= DAM.x0; x += 6) { const y = S.ys + 3 * Math.sin(x / 22 + t * 1.6); if (x === 40) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      /* 蓄水池（右） */
      c.fillStyle = W5.rgba(WATER, 0.5); c.fillRect(DAM.x1 - 6, S.yb, 706 - DAM.x1 + 6, DAM.bed - S.yb);
      c.strokeStyle = 'rgba(216,240,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(DAM.x1, S.yb); c.lineTo(704, S.yb); c.stroke();
      /* 海床、右岸 */
      c.fillStyle = '#3a3a2e'; c.fillRect(40, DAM.bed, 680, 6);
      c.fillStyle = GROUND; c.beginPath(); c.moveTo(704, 446); c.lineTo(704, 186); c.lineTo(724, 180); c.lineTo(724, 446); c.closePath(); c.fill();
      c.strokeStyle = GROUND_EDGE; c.lineWidth = 2.5; c.beginPath(); c.moveTo(704, 446); c.lineTo(704, 186); c.lineTo(724, 180); c.stroke();
      /* 水壩＋穿過壩體的水道 */
      c.fillStyle = '#8e9c97'; c.beginPath();
      c.moveTo(DAM.x0 + 15, DAM.top); c.lineTo(DAM.x1 - 15, DAM.top); c.lineTo(DAM.x1, DAM.bed); c.lineTo(DAM.x0, DAM.bed); c.closePath(); c.fill();
      c.strokeStyle = '#d6e2de'; c.lineWidth = 2; c.stroke();
      c.fillStyle = S.g > 0.05 ? W5.rgba(WATER, 0.55 + 0.3 * S.g) : EMPTY; c.fillRect(DAM.x0, TUN.y0, DAM.x1 - DAM.x0, TUN.y1 - TUN.y0);
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.fillRect(DAM.x0, TUN.y0, DAM.x1 - DAM.x0, TUN.y1 - TUN.y0);
      /* 水道裡的水流 */
      if (S.g > 0.3 && af > 0.02) {
        c.save(); c.beginPath(); c.rect(DAM.x0, TUN.y0, DAM.x1 - DAM.x0, TUN.y1 - TUN.y0); c.clip();
        c.strokeStyle = W5.rgba('#e6f6ff', 0.85 * af); c.lineWidth = 2.5; c.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
          const x = DAM.x0 + (((i * 23 + S.off) % 92) + 92) % 92 - 4, y = TUN.y0 + 6 + (i % 3) * 10;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y); c.stroke();
        }
        c.restore();
      }
      /* 主軸＋水輪機 */
      const wx = 420, wy = 408;
      c.strokeStyle = '#5d6e68'; c.lineWidth = 4; c.beginPath(); c.moveTo(wx, 150); c.lineTo(wx, wy); c.stroke();
      c.strokeStyle = '#f6f3ea'; c.lineWidth = 3;
      for (let j = 0; j < 6; j++) { const a = S.th + j * TAU / 6; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * 13, wy + Math.sin(a) * 13); c.stroke(); }
      c.fillStyle = METAL; c.beginPath(); c.arc(wx, wy, 4, 0, TAU); c.fill();
      /* 閘門：向上拉開 */
      const gy = TUN.y0 - 36 * S.g;
      c.fillStyle = '#c9a25a'; c.fillRect(DAM.x0 + 2, gy, 9, TUN.y1 - TUN.y0);
      c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(DAM.x0 + 2, gy, 9, TUN.y1 - TUN.y0);
      /* 壩頂發電機 */
      generator(c, wx, 138, 26, af * S.g, S.th);
      /* 水流方向箭頭 */
      if (S.f > 0.12) W5.arrow(c, 312, 372, 360, 372, W5.rgba('#bfe6ff', clamp01((S.f - 0.12) * 6)), 4, 13);
      if (S.f < -0.12) W5.arrow(c, 530, 372, 482, 372, W5.rgba('#bfe6ff', clamp01((-S.f - 0.12) * 6)), 4, 13);
      /* 水位差：海面虛線延伸過壩，雙箭頭 */
      const gapA = clamp01((Math.abs(S.yb - S.ys) - 26) / 14) * S.g;
      if (gapA > 0.02) {
        c.save(); c.globalAlpha *= gapA;
        c.strokeStyle = W5.rgba('#bfe6ff', 0.8); c.lineWidth = 2; c.setLineDash([7, 6]);
        c.beginPath(); c.moveTo(DAM.x1 + 4, S.ys); c.lineTo(600, S.ys); c.stroke(); c.setLineDash([]);
        W5.arrow(c, 590, (S.ys + S.yb) / 2, 590, S.ys, ENE, 3, 10);
        W5.arrow(c, 590, (S.ys + S.yb) / 2, 590, S.yb, ENE, 3, 10);
        c.restore();
      }
      /* 右側：一天的時鐘（24 小時刻度；兩次滿潮、兩次乾潮） */
      c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, 742, 150, 188, 294, 16); c.fill();
      c.lineWidth = 2; c.strokeStyle = W5.rgba(WATER, 0.5); c.stroke();
      c.fillStyle = '#1b302a'; c.beginPath(); c.arc(CK.x, CK.y, CK.R, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 2.5; c.stroke();
      for (let i = 0; i < 24; i++) {
        const a = -Math.PI / 2 + i * TAU / 24, r0 = CK.R - (i % 6 === 0 ? 10 : 5);
        c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = i % 6 === 0 ? 2.5 : 1.2;
        c.beginPath(); c.moveTo(CK.x + Math.cos(a) * r0, CK.y + Math.sin(a) * r0); c.lineTo(CK.x + Math.cos(a) * (CK.R - 1), CK.y + Math.sin(a) * (CK.R - 1)); c.stroke();
      }
      [3, 15].forEach(h => { const a = -Math.PI / 2 + h * TAU / 24; c.fillStyle = WATER; c.beginPath(); c.arc(CK.x + Math.cos(a) * (CK.R - 20), CK.y + Math.sin(a) * (CK.R - 20), 6, 0, TAU); c.fill(); });
      [9, 21].forEach(h => { const a = -Math.PI / 2 + h * TAU / 24; c.strokeStyle = WATER; c.lineWidth = 2.5; c.beginPath(); c.arc(CK.x + Math.cos(a) * (CK.R - 20), CK.y + Math.sin(a) * (CK.R - 20), 5.5, 0, TAU); c.stroke(); });
      const ha = -Math.PI / 2 + S.h * TAU / 24;
      c.strokeStyle = ENE; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(CK.x, CK.y); c.lineTo(CK.x + Math.cos(ha) * (CK.R - 12), CK.y + Math.sin(ha) * (CK.R - 12)); c.stroke();
      c.fillStyle = ENE; c.beginPath(); c.arc(CK.x, CK.y, 5, 0, TAU); c.fill();
      /* 圖例 */
      c.fillStyle = WATER; c.beginPath(); c.arc(764, 384, 6, 0, TAU); c.fill();
      c.strokeStyle = WATER; c.lineWidth = 2.5; c.beginPath(); c.arc(764, 414, 5.5, 0, TAU); c.stroke();
    });
    const rising = Math.cos(TAU * S.h / 12);
    const tideA = clamp01(Math.abs(rising) * 3 - 0.3);
    P(c, k * tideA, rising > 0 ? L('漲潮', 'Rising tide') : L('退潮', 'Falling tide'), 208, 176, WATER, 20);
    T(c, k, L('海洋', 'Sea'), 110, 418, WHITE, 20);
    T(c, k, L('蓄水池', 'Basin'), 640, 418, WHITE, 20);
    T(c, k * seg(u, 1.0, 1.5), L('閘門', 'Gate'), 366, 408, '#e8c98a', 20, 'right');
    T(c, k, L('水輪發電機', 'Turbine & generator'), 444, 140, WHITE, 20, 'left');
    const gapA = clamp01((Math.abs(S.yb - S.ys) - 26) / 14) * S.g;
    T(c, k * gapA, L('水位差', 'Level gap'), 602, (S.ys + S.yb) / 2, ENE, 20, 'left');
    T(c, k, L('一天 24 小時', '24-hour day'), CK.x, 170, DIM, 20);
    const nl = TW(c, k, L('一天兩次漲退潮', 'Two rises and two falls a day'), CK.x, 316, WATER, 20, 168, 26, 'center');
    void nl;
    T(c, k, L('滿潮', 'High tide'), 778, 384, WHITE, 20, 'left');
    T(c, k, L('乾潮', 'Low tide'), 778, 414, WHITE, 20, 'left');

    chain(c, k, u, [['潮差的重力位能', 'Tidal gravitational PE'], ['動能', 'Kinetic'], ['電能', 'Electrical']], [0.6, 1.8, 2.4], 104);
  }

  /* ═════════════════ 第 4 步：台灣目前的現況 ═════════════════ */
  const CW = 260, CH = 218, CY = 138;
  const CARDS = [
    { x: 60, name: ['地熱', 'Geothermal'], ok: true, st: ['商業運轉中', 'In commercial operation'], lv: 0.88 },
    { x: 350, name: ['洋流', 'Ocean currents'], ok: false, st: ['研發中', 'In development'], lv: 0.34 },
    { x: 640, name: ['潮汐', 'Tides'], ok: false, st: ['研發中', 'In development'], lv: 0.26 }
  ];
  function miniGeo(c, cx, cy, u) {
    c.fillStyle = GROUND; c.fillRect(cx - 90, cy + 4, 180, 14);
    const g = c.createLinearGradient(0, cy + 18, 0, cy + 40); g.addColorStop(0, '#5a3022'); g.addColorStop(1, '#8a3a20');
    c.fillStyle = g; c.fillRect(cx - 90, cy + 18, 180, 22);
    W5.glow(c, cx, cy + 34, 60, HEAT, 0.35);
    c.strokeStyle = '#6d817a'; c.lineWidth = 7; c.beginPath(); c.moveTo(cx - 30, cy + 36); c.lineTo(cx - 30, cy - 4); c.lineTo(cx + 2, cy - 4); c.stroke();
    c.strokeStyle = HEAT; c.lineWidth = 3; c.stroke();
    c.fillStyle = SHELL; c.fillRect(cx + 2, cy - 18, 46, 22); c.strokeStyle = METAL; c.lineWidth = 2; c.strokeRect(cx + 2, cy - 18, 46, 22);
    for (let i = 0; i < 5; i++) {
      const ph = (u * 0.5 + i / 5) % 1, x = cx + 30 + ph * 18, y = cy - 22 - ph * 22, r = 4 + ph * 6;
      c.fillStyle = W5.rgba(STEAM, 0.55 * (1 - ph)); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  }
  function miniCurrent(c, cx, cy, u) {
    c.fillStyle = W5.rgba(WATER, 0.35); c.fillRect(cx - 90, cy - 34, 180, 74);
    c.strokeStyle = 'rgba(216,240,255,0.65)'; c.lineWidth = 2; c.beginPath();
    for (let x = cx - 90; x <= cx + 90; x += 5) { const y = cy - 34 + 2 * Math.sin(x / 12 + u * 2); if (x === cx - 90) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
    c.save(); c.beginPath(); c.rect(cx - 90, cy - 32, 180, 72); c.clip();
    c.strokeStyle = 'rgba(223,244,255,0.55)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const y = cy - 22 + hash(i + 700) * 56, x = cx - 100 + ((hash(i + 710) * 200 + u * 80) % 200); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 22, y); c.stroke(); }
    c.restore();
    c.fillStyle = '#8e9c97'; c.fillRect(cx + 18, cy + 2, 4, 38);
    rotor(c, cx + 20, cy + 2, 28, u * 3, '#f6f3ea');
  }
  function miniTide(c, cx, cy, u) {
    const ys = cy - 6 - 14 * Math.sin(u * 1.6), yb = cy + 4 - 5 * Math.sin(u * 1.6 - 1);
    c.fillStyle = W5.rgba(WATER, 0.55); c.fillRect(cx - 90, ys, 78, cy + 40 - ys);
    c.fillStyle = W5.rgba(WATER, 0.45); c.fillRect(cx + 12, yb, 78, cy + 40 - yb);
    c.fillStyle = '#8e9c97'; c.beginPath(); c.moveTo(cx - 8, cy - 32); c.lineTo(cx + 8, cy - 32); c.lineTo(cx + 14, cy + 40); c.lineTo(cx - 14, cy + 40); c.closePath(); c.fill();
    c.fillStyle = W5.rgba(WATER, 0.7); c.fillRect(cx - 14, cy + 24, 28, 10);
  }
  const MINI = [miniGeo, miniCurrent, miniTide];
  function step4(c, s) {
    const u = s.u, k = s.k;
    P(c, k * seg(u, 0.2, 0.7), L('三種都是再生能源', 'All three are renewable'), 480, 104, REN, 22);
    CARDS.forEach((cd, i) => {
      const ca = k * seg(u, 0.4 + 0.5 * i, 0.9 + 0.5 * i), dy = (1 - ease(seg(u, 0.4 + 0.5 * i, 1.0 + 0.5 * i))) * 18;
      const y0 = CY + dy, cx = cd.x + CW / 2, col = cd.ok ? REN : CAUTION;
      const ba = k * seg(u, 2.0 + 0.4 * i, 2.5 + 0.4 * i);
      withA(c, ca, () => {
        c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, cd.x, y0, CW, CH, 16); c.fill();
        c.lineWidth = 2.5; c.strokeStyle = W5.rgba(mixHex('#6f7f78', col, ba / Math.max(k, 0.001)), 0.9); c.stroke();
        c.save(); W5.rr(c, cd.x + 12, y0 + 12, CW - 24, 92, 10); c.clip();
        c.fillStyle = '#132a23'; c.fillRect(cd.x + 12, y0 + 12, CW - 24, 92);
        MINI[i](c, cx, y0 + 60, u);
        c.restore();
      });
      T(c, ca, L(cd.name[0], cd.name[1]), cx, y0 + 128, WHITE, 24);
      withA(c, ba, () => (cd.ok ? iconCheck : iconLab)(c, cd.x + 30, y0 + 170, 14, col));
      TW(c, ba, L(cd.st[0], cd.st[1]), cd.x + 54, y0 + 170, col, 20, CW - 70, 26, 'left');
    });
    /* 技術成熟度：三條小橫條 */
    const la = k * seg(u, 3.0, 3.5), fill = ease(seg(u, 3.3, 4.8));
    T(c, la, L('技術成熟度', 'Technology readiness'), 480, 380, WHITE, 20);
    withA(c, la, () => {
      CARDS.forEach(cd => {
        const x = cd.x + 20, w = CW - 40, y = 414, h = 16, col = cd.ok ? REN : CAUTION;
        c.fillStyle = INK; W5.rr(c, x, y - h / 2, w, h, h / 2); c.fill();
        c.strokeStyle = 'rgba(246,243,234,0.3)'; c.lineWidth = 1.5; c.stroke();
        if (fill > 0.005) {
          c.save(); W5.rr(c, x, y - h / 2, w, h, h / 2); c.clip();
          c.fillStyle = col; c.fillRect(x, y - h / 2, w * cd.lv * fill, h); c.restore();
        }
      });
    });
  }

  /* ═════════════════ 每步文字 ═════════════════ */
  const TXT = [
    { title: ['地熱發電', 'Geothermal power'],
      sub: ['生產井把地底的熱水與蒸氣抽上來推動渦輪、帶動發電機；用過的水從回注井送回地下', 'A production well brings up hot water and steam to spin a turbine and generator; the used water goes back down an injection well.'],
      con: ['結論：地熱的熱能 → 動能 → 電能；日夜都能穩定發電', 'Conclusion: geothermal heat → kinetic → electrical, steadily, day and night.'] },
    { title: ['洋流發電', 'Ocean-current power'],
      sub: ['黑潮終年沿台灣東岸往北流，推動水下渦輪的葉片旋轉，帶動發電機', 'The Kuroshio flows north along eastern Taiwan all year; it turns the blades of an underwater turbine, which drives a generator.'],
      con: ['結論：海流的動能 → 電能；海流穩定，但設備要長期泡在深海裡運作', "Conclusion: the current's kinetic energy → electricity. Currents are steady, but the machines must work deep at sea for years."] },
    { title: ['潮汐發電', 'Tidal power'],
      sub: ['漲潮、退潮讓水壩兩側出現水位差，打開閘門，海水穿過水道推動水輪機', 'Rising and falling tides make a level gap across the dam; when the gate opens, water rushes through and spins the turbine.'],
      con: ['結論：潮差的重力位能 → 動能 → 電能；一天大約漲退潮各兩次', 'Conclusion: tidal gravitational PE → kinetic → electrical; the tide rises and falls about twice a day.'] },
    { title: ['台灣目前的現況', 'Where Taiwan stands'],
      sub: ['三種都是再生能源，但技術成熟度差很多', 'All three are renewable, but they are at very different stages.'],
      con: ['結論：地熱已商轉，洋流與潮汐仍在研究', 'Conclusion: geothermal is already commercial; currents and tides are still being researched.'] }
  ];

  W5.register('geo', {
    canvas: 'cvs-geo',
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
