/* ==================================================================
   work_5 ｜ 核分裂（鈾-235）微觀動畫（cvs-fission，960×540）
   五步自動循環：1 中子來了 → 2 原子核分裂 → 3 連鎖反應 → 4 減速 → 5 控制
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)。

   語意色（全程一致）：質子＝橘 COL.proton、中子＝淺灰白 COL.neutron（快中子＝更亮的白＋光暈）、
   能量＝黃 COL.energy、熱／爆發＝橘紅光暈 HEAT。本動畫沒有電子、沒有電流。

   純函式作法：
   - 所有「隨機」都用 W5.hash(整數)。
   - 會互相影響的事件（第 3 步的連鎖、第 5 步的反應爐中子）在載入時「一次算好」成常數表，
     draw 只依 s 查表，不累積狀態；跳步驟時畫面與真的播過一樣。
   - 第 1→2 步的原子核用 s.since(1) 算晃動相位，兩步之間無縫接續。

   物理模型（國中資優版、示意）：
   - 原子核用 37 顆小球示意（不是真的 236 顆）；分裂成 21 顆（鋇）＋13 顆（氪）＋3 顆快中子，
     小球數與質子數在動畫裡守恆（質子 14 → 9 ＋ 5）。
   - 兩塊碎片依動量守恆：較輕的氪飛得較快（位移比 ≈ 141 : 92）。
   - 碎片在周圍的原子間減速（動能變熱）：位移 D·(1 − e^(−t/τ))，撞到的原子被推開、留下橘紅熱光。
   - 減速：中子撞氫（質量相近）每撞一次大幅變慢；畫面只畫 3 次，實際約要撞 20 次（畫面有註明）。
   本檔自訂函式不汙染全域（整個包在 IIFE 內）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, clamp01 = W5.clamp01;
  const PRO = COL.proton, NEU = COL.neutron, ENE = COL.energy, WHITE = COL.white, DIM = COL.dim;
  const HEAT = '#ff6a3d';            /* 熱／爆發光暈：橘紅 */
  const HOT = '#ffb27a';             /* 衝擊波、火花 */
  const FASTN = '#ffffff';           /* 快中子：更亮的白 */
  const WATER = '#5ab8e8';           /* 水的淡藍底 */
  const O_COL = '#8098ff', H_COL = '#f3b6cf';   /* 水分子：氧（藍紫）、氫（淡粉），避開質子橘與中子白 */
  const WARN = COL.red;
  const GOOD = COL.green;
  const DUR = [6.5, 9.5, 8, 8, 8.5];             /* 總長 40.5 秒 */

  /* 兩個 #hex 色混合，回傳 #hex（W5.ball 只吃 #hex） */
  function mixHex(a, b, t) {
    const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), B = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
  }
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  /* ── 文字：一律走 W5.label / W5.pill；透明度太低時不畫（避免把看不見的字算進重疊檢查） ── */
  function T(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size, align, mono); c.restore(); return w;
  }
  function P(c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size, align, mono); c.restore(); return r;
  }
  /* 多行卡片（底板＋每行 W5.label） */
  function card(c, a, lines, x, y, col, size, lh) {
    if (a <= 0.02) return;
    size = size || 22; lh = lh || size + 9;
    let w = 0; lines.forEach(s => { w = Math.max(w, W5.tw(c, s, size)); });
    w += 40; const h = lines.length * lh + 18;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.90)'; W5.rr(c, x - w / 2, y - h / 2, w, h, 18); c.fill();
    c.lineWidth = 2; c.strokeStyle = col; c.stroke();
    lines.forEach((s, i) => W5.label(c, s, x, y - h / 2 + 9 + lh * (i + 0.5), col, size));
    c.restore();
  }

  /* 斷行：英文以字為單位、中文以字元為單位；中文標點不放行首；字串含 \n 時照 \n 斷 */
  const CJK = /[⺀-鿿　-〿＀-￯]/;
  const NOHEAD = /^[，、。：；）」！？]/;
  function wrap(c, str, size, maxW) {
    if (str.indexOf('\n') >= 0) return str.split('\n');
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

  /* 底部一句話字幕：半透明圓角底板、22px 白字、必要時兩行 */
  function subtitle(c, a, str) {
    if (a <= 0.02) return;
    const size = 22, lh = 31, lines = wrap(c, str, size, 860);
    let w = 0; lines.forEach(l => { w = Math.max(w, W5.tw(c, l, size)); });
    w += 48; const h = lines.length * lh + 18, y0 = 490 - h / 2;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(11,26,21,0.80)'; W5.rr(c, 480 - w / 2, y0, w, h, 16); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(246,243,234,0.22)'; c.stroke();
    lines.forEach((l, i) => W5.label(c, l, 480, y0 + 9 + lh * (i + 0.5), WHITE, size));
    c.restore();
  }

  /* 圖例：左上角小小的 */
  function legend(c, a, withProton) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    let y = 30;
    if (withProton) { W5.ball(c, 28, y, 9, PRO); W5.label(c, L('質子', 'proton'), 44, y, PRO, 20, 'left'); y += 30; }
    W5.ball(c, 28, y, 9, NEU); W5.label(c, L('中子', 'neutron'), 44, y, NEU, 20, 'left');
    c.restore();
  }

  /* ── 小球與飛行中的中子 ── */
  function nball(c, x, y, r, col) {
    W5.ball(c, x, y, r, col);
    c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
  /* trail：由新到舊的位置陣列；fast 0..1 決定亮度與光暈 */
  function flyN(c, trail, r, fast, a) {
    if (a <= 0.02 || !trail.length) return;
    const col = mixHex(NEU, FASTN, fast);
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    const n = trail.length;
    for (let j = n - 1; j >= 1; j--) {
      const f = 1 - j / n;
      c.strokeStyle = W5.rgba(fast > 0.5 ? '#ffffff' : '#d9e2dd', 0.55 * f);
      c.lineWidth = r * 1.3 * f + 0.5;
      c.beginPath(); c.moveTo(trail[j].x, trail[j].y); c.lineTo(trail[j - 1].x, trail[j - 1].y); c.stroke();
    }
    const h = trail[0];
    if (fast > 0.05) W5.glow(c, h.x, h.y, r * 3.2, '#ffffff', 0.55 * fast);
    nball(c, h.x, h.y, r, col);
    c.restore();
  }

  function sunflower(n, cs) {
    const pts = [];
    for (let i = 0; i < n; i++) { const r = cs * Math.sqrt(i + 0.5), th = i * 2.399963; pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) }); }
    return pts;
  }
  function jit(i, t, amp) {
    return { x: amp * Math.sin(t * 6.7 + hash(i * 3 + 1) * TAU), y: amp * Math.cos(t * 5.9 + hash(i * 3 + 2) * TAU) };
  }

  /* 爆發閃光：橘紅光暈＋黃色核心（能量） */
  function flash(c, x, y, dt, big) {
    if (dt < 0 || dt > 1.6) return;
    const R = big || 60;
    W5.glow(c, x, y, R * (1 + dt * 0.8), HEAT, 0.85 * Math.exp(-dt * 3));
    W5.glow(c, x, y, R * 0.45, ENE, 0.9 * Math.exp(-dt * 6));
  }

  /* ═════════════════ 第 1、2 步：大的鈾原子核 ═════════════════ */
  const RP = 15, CS = 14.5;
  const CX = 470, CY = 262;
  const BIG = (function () {
    const pts = sunflower(37, CS);
    let ia = 0; pts.forEach((p, i) => { if (p.x < pts[ia].x) ia = i; });
    const idx = pts.map((p, i) => i).filter(i => i !== ia);
    const sc = i => Math.abs(pts[i].x - 10) - 0.25 * Math.abs(pts[i].y);
    const free = idx.slice().sort((a, b) => sc(a) - sc(b)).slice(0, 3);
    const rest = idx.filter(i => free.indexOf(i) < 0).sort((a, b) => pts[a].x - pts[b].x);
    const ba = [ia].concat(rest.slice(0, 20)), kr = rest.slice(20);
    const type = new Array(37).fill('n');
    const pickP = (grp, k, seed) => grp.filter(i => i !== ia).sort((a, b) => hash(a * 11 + seed) - hash(b * 11 + seed)).slice(0, k).forEach(i => { type[i] = 'p'; });
    pickP(ba, 9, 5); pickP(kr, 5, 9);
    const RB = CS * Math.sqrt(21) + RP, RK = CS * Math.sqrt(13) + RP;
    const d = RB + RK - 14, XB = -d * 13 / 34, XK = XB + d, XN = XB + RB - 7;
    const tgt = new Array(37), grp = new Array(37);
    function assign(list, n, cx, g) {
      const slots = sunflower(n, CS).map(p => ({ x: p.x + cx, y: p.y, used: false }));
      const gx = list.reduce((s, i) => s + pts[i].x, 0) / list.length;
      const order = list.slice().sort((a, b) => Math.abs(pts[b].x - gx) + Math.abs(pts[b].y) - Math.abs(pts[a].x - gx) - Math.abs(pts[a].y));
      order.forEach(i => {
        let bj = -1, bd = 1e9;
        slots.forEach((s, j) => { if (s.used) return; const dd = Math.hypot(s.x - (pts[i].x - gx + cx), s.y - pts[i].y); if (dd < bd) { bd = dd; bj = j; } });
        slots[bj].used = true; tgt[i] = { x: slots[bj].x, y: slots[bj].y }; grp[i] = g;
      });
    }
    assign(ba, 21, XB, 0); assign(kr, 13, XK, 1);
    const fdir = [{ x: -0.26, y: -0.966 }, { x: -0.56, y: 0.83 }, { x: 0.52, y: 0.855 }];
    free.forEach((i, k) => { tgt[i] = { x: XN + (k === 1 ? -2 : 2), y: [-20, 22, 0][k] }; grp[i] = 2 + k; });
    const order = pts.map((p, i) => i).sort((a, b) => hash(a * 5 + 77) - hash(b * 5 + 77));
    const nP = type.filter(t => t === 'p').length;
    return { pts, ia, free, type, tgt, grp, order, RB, RK, XB, XK, XN, fdir, nP, R: CS * Math.sqrt(37) + RP };
  })();

  const N_X0 = 24, N_T0 = 0.3, N_V = 110;                       /* 慢中子：110 px/s */
  const SLOT = { x: CX + BIG.pts[BIG.ia].x, y: CY + BIG.pts[BIG.ia].y };
  const T_ABS = N_T0 + (SLOT.x - RP * 0.4 - N_X0) / N_V;         /* 吸收時刻（第 1 步內） */
  const T_SC = 2.2, TAU_F = 0.7, DB = -200, DK = 200 * 141 / 92; /* 分裂時刻（第 2 步內）；動量守恆 */
  const V_FAST = 480;                                            /* 快中子 480 px/s（慢中子的 4 倍多） */

  function fragC(g, dt) {
    const f = 1 - Math.exp(-Math.max(0, dt) / TAU_F);
    return g === 0 ? { x: CX + BIG.XB + DB * f, y: CY } : { x: CX + BIG.XK + DK * f, y: CY };
  }
  function fragV(g, dt) { return Math.abs(g === 0 ? DB : DK) / TAU_F * Math.exp(-Math.max(0, dt) / TAU_F); }

  /* 周圍的原子：碎片撞到就被推開、冒火花、留下熱 */
  const ATOMS = [
    { x: 58, y: 150 }, { x: 150, y: 178 }, { x: 262, y: 168 }, { x: 70, y: 352 }, { x: 160, y: 340 }, { x: 290, y: 332 },
    { x: 36, y: 250 }, { x: 330, y: 205 },
    { x: 690, y: 196 }, { x: 790, y: 182 }, { x: 905, y: 196 }, { x: 700, y: 336 }, { x: 800, y: 338 }, { x: 925, y: 318 },
    { x: 936, y: 262 }, { x: 640, y: 340 }
  ];
  ATOMS.forEach(a => {
    a.th = Infinity;
    for (let t = 0; t < 7.3; t += 0.005) {
      for (let g = 0; g < 2; g++) {
        const fc = fragC(g, t), R = g === 0 ? BIG.RB : BIG.RK;
        if (Math.hypot(a.x - fc.x, a.y - fc.y) < R + 13) { a.th = t; a.g = g; break; }
      }
      if (a.th < Infinity) break;
    }
  });

  function drawAtoms(c, a, dt) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    ATOMS.forEach((at, i) => {
      let x = at.x, y = at.y;
      if (dt > 0) {
        for (let g = 0; g < 2; g++) {   /* 被碎片推開（只依目前碎片位置，純函式） */
          const fc = fragC(g, dt), R = (g === 0 ? BIG.RB : BIG.RK) + 15;
          const dx = x - fc.x, dy = y - fc.y, d = Math.hypot(dx, dy) || 1;
          if (d < R) { x = fc.x + dx / d * R; y = fc.y + dy / d * R; }
        }
      }
      const hd = dt - at.th, hot = hd > 0 ? 1 : 0;
      const amp = 1.2 + hot * 3.2 * Math.exp(-Math.max(0, hd) / 2.5);
      x += amp * Math.sin(dt * 9 + i * 1.7 + (hot ? hd * 14 : 0)); y += amp * Math.cos(dt * 8 + i * 2.3 + (hot ? hd * 12 : 0));
      if (hot) W5.glow(c, x, y, 30, HEAT, 0.16 + 0.5 * Math.exp(-hd / 1.4));
      c.strokeStyle = 'rgba(163,184,176,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 11, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(163,184,176,0.75)'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
      if (hot && hd < 0.6) {   /* 撞擊火花 */
        const k = 1 - hd / 0.6;
        c.strokeStyle = W5.rgba(HOT, 0.9 * k); c.lineWidth = 2.5; c.lineCap = 'round';
        for (let j = 0; j < 6; j++) {
          const an = j / 6 * TAU + i, r0 = 13 + hd * 30, r1 = r0 + 12 * k;
          c.beginPath(); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); c.stroke();
        }
        W5.glow(c, x, y, 24, ENE, 0.5 * k);
      }
    });
    c.restore();
  }

  /* tt：從第 1 步開始的秒數；u2：第 2 步內秒數（第 1 步時為 −1） */
  function drawBig(c, tt, u2) {
    let a;
    if (u2 < 0) a = 0.10 * ease(seg(tt, T_ABS + 0.2, DUR[0]));
    else a = 0.10 + 0.12 * ease(seg(u2, 0, 1.1));
    const e = u2 < 0 ? 0 : ease(seg(u2, 0.9, T_SC));
    a *= (1 - e);
    const ph = TAU * 1.5 * tt;
    const sx = 1 + a * Math.sin(ph), sy = 1 / sx;
    const dt = u2 - T_SC, split = u2 >= T_SC;

    /* 核後方淡淡的光 */
    if (!split) W5.glow(c, CX, CY, BIG.R * 1.7, HEAT, 0.10 + 0.25 * a + 0.2 * e);

    /* 碎片尾巴 */
    if (split) {
      for (let g = 0; g < 2; g++) {
        const fc = fragC(g, dt), v = fragV(g, dt), R = g === 0 ? BIG.RB : BIG.RK, dir = g === 0 ? 1 : -1;
        const len = v * 0.45, al = clamp01(v / 400) * 0.55;
        if (al > 0.01 && len > 4) {
          const gr = c.createLinearGradient(fc.x, 0, fc.x + dir * (len + R), 0);
          gr.addColorStop(0, W5.rgba(HEAT, al)); gr.addColorStop(1, W5.rgba(HEAT, 0));
          c.fillStyle = gr; c.beginPath();
          c.moveTo(fc.x, fc.y - R * 0.8); c.lineTo(fc.x + dir * (len + R), fc.y - R * 0.25);
          c.lineTo(fc.x + dir * (len + R), fc.y + R * 0.25); c.lineTo(fc.x, fc.y + R * 0.8); c.closePath(); c.fill();
        }
        if (dt < 3) W5.glow(c, fc.x, fc.y, R * 1.5, HEAT, 0.25 * Math.exp(-dt / 1.2) + 0.06);
      }
    }

    const fw = split ? 1 + 0.15 * Math.exp(-dt / 1.0) * Math.sin(TAU * 2.2 * dt) : 1;
    for (const i of BIG.order) {
      const b = BIG.pts[i], j = jit(i, tt, 1.3);
      let x, y;
      if (i === BIG.ia && tt < T_ABS) continue;          /* 還在飛的那顆慢中子另外畫 */
      if (BIG.grp[i] >= 2 && split) continue;            /* 射出的快中子另外畫 */
      if (!split) {
        const wx = b.x * sx, wy = b.y * sy, t = BIG.tgt[i];
        x = CX + lerp(wx, t.x, e) + j.x; y = CY + lerp(wy, t.y, e) + j.y;
      } else {
        const g = BIG.grp[i], fc = fragC(g, dt), gx = g === 0 ? BIG.XB : BIG.XK, t = BIG.tgt[i];
        x = fc.x + (t.x - gx) * fw + j.x; y = fc.y + t.y / fw + j.y;
      }
      nball(c, x, y, RP, BIG.type[i] === 'p' ? PRO : NEU);
    }
    /* 剛吸收時的小閃光 */
    if (u2 < 0 && tt >= T_ABS && tt < T_ABS + 0.8) W5.glow(c, SLOT.x, SLOT.y, 36, '#ffffff', 0.6 * (1 - (tt - T_ABS) / 0.8));

    /* 分裂瞬間：衝擊波＋光暈 */
    if (split && dt < 1.6) {
      const nx = CX + BIG.XN, k = dt / 1.6;
      flash(c, nx, CY, dt, 150);
      c.save(); c.strokeStyle = W5.rgba(HOT, 0.85 * (1 - k)); c.lineWidth = 7 * (1 - k) + 1;
      c.beginPath(); c.arc(nx, CY, 30 + 560 * Math.pow(k, 0.75), 0, TAU); c.stroke();
      c.strokeStyle = W5.rgba(ENE, 0.5 * (1 - k)); c.lineWidth = 2;
      c.beginPath(); c.arc(nx, CY, 20 + 420 * Math.pow(k, 0.75), 0, TAU); c.stroke(); c.restore();
    }
    /* 3 顆快中子：飛過的路徑留下虛線（配合「3 個快中子」的標示） */
    if (split && u2 < 4.3) {
      c.save(); c.globalAlpha *= 1 - seg(u2, 3.9, 4.3);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.setLineDash([6, 7]);
      BIG.free.forEach((i, k) => {
        const d = BIG.fdir[k], t0 = BIG.tgt[i], L0 = Math.min(V_FAST * dt, 700);
        c.beginPath(); c.moveTo(CX + t0.x, CY + t0.y); c.lineTo(CX + t0.x + d.x * L0, CY + t0.y + d.y * L0); c.stroke();
      });
      c.restore();
    }
    if (split) {
      BIG.free.forEach((i, k) => {
        const d = BIG.fdir[k], t0 = BIG.tgt[i], tr0 = [];
        for (let m = 0; m < 9; m++) {
          const tm = Math.max(0, dt - m * 0.025);
          tr0.push({ x: CX + t0.x + d.x * V_FAST * tm, y: CY + t0.y + d.y * V_FAST * tm });
        }
        const h = tr0[0];
        if (h.x > -30 && h.x < 990 && h.y > -30 && h.y < 570) flyN(c, tr0, RP * 0.8, 1, 1);
      });
    }
  }

  function drawIncoming(c, tt, k) {
    if (tt >= T_ABS) return;
    const t = Math.max(0, tt - N_T0), x = N_X0 + N_V * t, y = SLOT.y;
    const tr0 = [];
    for (let m = 0; m < 7; m++) tr0.push({ x: N_X0 + N_V * Math.max(0, t - m * 0.06), y });
    flyN(c, tr0, RP, 0, k * clamp01((tt - 0.05) / 0.3));
    const lb = L('慢中子', 'slow neutron'), lw = W5.tw(c, lb, 22);
    T(c, k * (1 - seg(tt, T_ABS - 0.9, T_ABS - 0.5)), lb, Math.max(x, lw / 2 + 8), y - 36, NEU, 22);
  }

  /* ═════════════════ 第 1 步 ═════════════════ */
  function step1(c, s) {
    const tt = s.u, k = s.k;
    c.save(); c.globalAlpha = k;
    drawAtoms(c, 0.9, -1);
    drawBig(c, tt, -1);
    drawIncoming(c, tt, 1);
    c.restore();
    P(c, k, 'U-235 + n → U-236', 480, 38, WHITE, 22, 'center', true);
    const a1 = k * (1 - seg(tt, T_ABS - 0.15, T_ABS + 0.1)), a2 = seg(tt, T_ABS + 0.2, T_ABS + 0.5);
    T(c, a1, L('鈾-235', 'Uranium-235'), CX, 112, WHITE, 24);
    T(c, a2, L('鈾-236（不穩定）', 'Uranium-236 (unstable)'), CX, 112, HOT, 24);
    T(c, a1, L('92 個質子＋143 個中子', '92 protons + 143 neutrons'), CX, 410, WHITE, 20);
    T(c, a2, L('92 個質子＋144 個中子', '92 protons + 144 neutrons'), CX, 410, WHITE, 20);
    T(c, k, L('周圍的原子', 'nearby atoms'), 880, 130, DIM, 20);
    legend(c, k, true);
    subtitle(c, k, L('慢中子被鈾-235 吸收，原子核變得不穩定、開始晃動',
      'A slow neutron is absorbed by uranium-235. The nucleus becomes unstable and starts to wobble.'));
  }

  /* ═════════════════ 第 2 步 ═════════════════ */
  function step2(c, s) {
    const u = s.u, tt = s.since(1), dt = u - T_SC;
    drawAtoms(c, 0.9, dt);
    drawBig(c, tt, u);
    P(c, 1, L('U-235 + n → Ba-141 + Kr-92 + 3n + 能量', 'U-235 + n → Ba-141 + Kr-92 + 3n + energy'), 480, 38, WHITE, 22, 'center', true);
    legend(c, 1, true);
    const pre = 1 - seg(u, 1.9, 2.15);
    T(c, pre, L('鈾-236（不穩定）', 'Uranium-236 (unstable)'), CX, 112, HOT, 24);
    T(c, pre, L('92 個質子＋144 個中子', '92 protons + 144 neutrons'), CX, 410, WHITE, 20);
    T(c, 1 - seg(u, 4.0, 4.3), L('周圍的原子', 'nearby atoms'), 880, 130, DIM, 20);
    /* 碎片名稱：跟著碎片走 */
    const fb = fragC(0, dt), fk = fragC(1, dt), al = seg(u, T_SC + 0.5, T_SC + 0.9);
    T(c, al, L('鋇-141', 'Barium-141'), fb.x, 362, WHITE, 24);
    T(c, al, L('氪-92', 'Krypton-92'), fk.x, 352, WHITE, 24);
    T(c, seg(u, T_SC + 0.15, T_SC + 0.4) * (1 - seg(u, 3.9, 4.25)), L('3 個快中子', '3 fast neutrons'), 610, 150, FASTN, 22);
    /* 能量 */
    P(c, seg(u, 4.3, 4.7), L('1 個鈾核分裂約放出 200 MeV（兆電子伏特）', 'One uranium fission releases about 200 MeV (mega-electron-volts)'), 480, 118, ENE, 22);
    T(c, seg(u, 4.8, 5.2), L('約是 1 個碳原子燃燒放出能量的 5000 萬倍', 'about 50 million times the energy from burning one carbon atom'), 480, 162, ENE, 20);
    /* 守恆：等寬字、逐欄對齊 */
    const ac = seg(u, 5.3, 5.7), X = 434;
    T(c, ac, L('質量數：', 'Mass no.:'), X, 256, WHITE, 20, 'right');
    T(c, ac, '235 + 1 = 141 + 92 + 3 = 236', X + 6, 256, WHITE, 20, 'left', true);
    T(c, ac, L('質子數：', 'Protons:'), X, 290, PRO, 20, 'right');
    T(c, ac, ' 92 + 0 =  56 + 36 + 0 =  92', X + 6, 290, PRO, 20, 'left', true);
    T(c, seg(u, 5.8, 6.2), L('反應後總質量少了約 0.1%，少掉的質量變成能量（E = mc²）', 'Total mass drops by about 0.1%: the lost mass becomes energy (E = mc²)'), 480, 404, ENE, 20);
    subtitle(c, seg(u, T_SC + 0.1, T_SC + 0.5), L('碎片高速飛出，撞擊周圍的原子，動能變成熱',
      'The fragments fly out at high speed, hit nearby atoms, and their kinetic energy becomes heat.'));
    subtitle(c, 1 - seg(u, T_SC - 0.3, T_SC), L('原子核越晃越厲害，拉長、中間變細……',
      'The nucleus wobbles harder, stretches, and pinches in the middle...'));
  }

  /* ═════════════════ 小原子核（第 3、4 步共用） ═════════════════ */
  const SN = (function () {
    const pts = sunflower(12, 6.6), type = new Array(12).fill('n');
    [8, 11, 1, 4, 10].forEach(i => { type[i] = 'p'; });   /* 角度約每 72° 一顆，質子分散 */
    const emit = [2, 6, 9];
    return { pts, type, emit, r: 7, R: 6.6 * Math.sqrt(12) + 7 };
  })();
  /* tf：分裂時刻（Infinity＝不分裂）；ang：碎片分開的方向 */
  function smallNuc(c, x, y, t, tf, ang, seed) {
    const dt = t - tf, split = dt >= 0;
    if (!split) W5.glow(c, x, y, SN.R * 1.6, HEAT, 0.12);
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const off = split ? 8 + 15 * (1 - Math.exp(-dt / 0.5)) + 2.5 * dt : 0;
    const fade = split ? 1 - 0.35 * clamp01(dt / 1.5) : 1;
    if (split && dt > 0.4) W5.glow(c, x, y, SN.R * 2.2, HEAT, (0.16 + 0.07 * Math.sin(t * 3 + seed)) * clamp01((dt - 0.4) / 0.6));   /* 留下的熱 */
    /* 快分裂時先晃一下 */
    const wob = (!split && dt > -0.35) ? 0.25 * (1 + dt / 0.35) * Math.sin((dt + 0.35) * 40) : 0;
    c.save(); c.globalAlpha *= fade;
    for (let i = 0; i < 12; i++) {
      if (split && SN.emit.indexOf(i) >= 0) continue;
      const b = SN.pts[i], j = jit(i + seed * 13, t, 0.8);
      let px = b.x * (1 + wob), py = b.y / (1 + wob);
      if (split) { const sd = (b.x * ux + b.y * uy) >= 0 ? 1 : -1; px += ux * off * sd; py += uy * off * sd; }
      nball(c, x + px + j.x, y + py + j.y, SN.r, SN.type[i] === 'p' ? PRO : NEU);
    }
    c.restore();
    if (split) flash(c, x, y, dt, 62);
  }

  /* ═════════════════ 第 3 步：連鎖反應（事件表載入時算好） ═════════════════ */
  const V3 = 190;
  const NUC3 = [{ x: 480, y: 262 }, { x: 227, y: 317 }, { x: 679, y: 298 }, { x: 636, y: 153 },
    { x: 78, y: 352 }, { x: 198, y: 142 }, { x: 70, y: 151 },
    { x: 404, y: 128 }, { x: 394, y: 356 }, { x: 895, y: 223 },
    { x: 318, y: 222 }, { x: 788, y: 152 }, { x: 833, y: 345 }];
  const CH = (function () {
    const tf = new Array(13).fill(Infinity), par = new Array(13).fill(-1);
    const T0 = 0.15;
    tf[0] = T0 + (NUC3[0].x + 10 - 12) / V3 * 0.4;   /* 第一顆中子從左邊飛來（較快一點進場） */
    const travel = (a, b) => (Math.hypot(NUC3[a].x - NUC3[b].x, NUC3[a].y - NUC3[b].y) - 12) / V3;
    for (let f = 0; f < 3; f++) {
      par[1 + f] = 0; tf[1 + f] = tf[0] + travel(0, 1 + f);
      for (let k = 0; k < 3; k++) { const ch = 4 + f * 3 + k; par[ch] = 1 + f; tf[ch] = tf[1 + f] + travel(1 + f, ch); }
    }
    const neu = [];   /* {from, to|null, t0, t1, x0,y0,x1,y1} */
    for (let n = 1; n < 13; n++) {
      const a = NUC3[par[n]], b = NUC3[n], d = Math.hypot(b.x - a.x, b.y - a.y);
      neu.push({ t0: tf[par[n]], t1: tf[n], x0: a.x, y0: a.y, x1: a.x + (b.x - a.x) * (d - 12) / d, y1: a.y + (b.y - a.y) * (d - 12) / d });
    }
    /* 第 3 次分裂後再射出的 27 顆（漸漸淡出，暗示還會繼續） */
    for (let n = 4; n < 13; n++) {
      const a = NUC3[par[n]], b = NUC3[n], base = Math.atan2(b.y - a.y, b.x - a.x);
      for (let k = 0; k < 3; k++) {
        const an = base + (k - 1) * 0.75 + (hash(n * 7 + k) - 0.5) * 0.4, len = 230;
        neu.push({ t0: tf[n], t1: tf[n] + len / V3, x0: b.x, y0: b.y, x1: b.x + Math.cos(an) * len, y1: b.y + Math.sin(an) * len, out: true });
      }
    }
    const g1 = Math.min(tf[1], tf[2], tf[3]), g2 = Math.min.apply(null, tf.slice(4)), g2e = Math.max.apply(null, tf.slice(4));
    return { tf, par, neu, T0, g1, g2, g2e };
  })();

  function step3(c, s) {
    const u = s.u, k = s.k;
    c.save(); c.globalAlpha = k;
    /* 中子路徑（細線）：飛過的地方留下淡淡的線 */
    CH.neu.forEach(n => {
      if (u < n.t0 || n.out) return;
      const f = clamp01((u - n.t0) / (n.t1 - n.t0));
      c.strokeStyle = 'rgba(217,226,221,0.28)'; c.lineWidth = 1.5; c.setLineDash([5, 6]);
      c.beginPath(); c.moveTo(n.x0, n.y0); c.lineTo(lerp(n.x0, n.x1, f), lerp(n.y0, n.y1, f)); c.stroke();
    });
    c.setLineDash([]);
    NUC3.forEach((p, i) => {
      /* 上排的核：碎片左右分開，不往上撞到標題區 */
      const h = hash(i * 17 + 3), ang = p.y < 175 ? (h < 0.5 ? 0 : Math.PI) + (h - 0.5) * 0.6 : h * TAU;
      smallNuc(c, p.x, p.y, u, CH.tf[i], ang, i + 1);
    });
    /* 第一顆中子 */
    if (u < CH.tf[0]) {
      const t1 = CH.tf[0], f = clamp01((u - CH.T0) / (t1 - CH.T0)), x = lerp(-10, NUC3[0].x - 12, f);
      const trl = []; for (let m = 0; m < 8; m++) trl.push({ x: lerp(-10, NUC3[0].x - 12, clamp01((u - m * 0.03 - CH.T0) / (t1 - CH.T0))), y: 262 });
      flyN(c, trl, 6, 0.6, 1);
    }
    CH.neu.forEach(n => {
      if (u < n.t0 || u > n.t1) return;
      const trl = [];
      for (let m = 0; m < 8; m++) { const f = clamp01((u - m * 0.03 - n.t0) / (n.t1 - n.t0)); trl.push({ x: lerp(n.x0, n.x1, f), y: lerp(n.y0, n.y1, f) }); }
      const fa = n.out ? 1 - clamp01((u - n.t0) / (n.t1 - n.t0)) : 1;
      flyN(c, trl, 6, 0.6, fa);
    });
    c.restore();

    legend(c, k, true);
    T(c, k * (1 - seg(u, CH.tf[0] - 0.2, CH.tf[0])), L('鈾-235', 'Uranium-235'), 480, 312, WHITE, 20);
    /* 計數 */
    P(c, seg(u, CH.tf[0], CH.tf[0] + 0.3), L('第 1 次：1 個核分裂', 'Round 1: 1 fission'), 222, 428, WHITE, 22);
    P(c, seg(u, CH.g1, CH.g1 + 0.3), L('第 2 次：3 個', 'Round 2: 3'), 480, 428, WHITE, 22);
    P(c, seg(u, CH.g2, CH.g2 + 0.3), L('第 3 次：9 個', 'Round 3: 9'), 712, 428, WHITE, 22);
    /* 標題 → 警示 */
    const tw = CH.g2e + 0.5;
    P(c, k * (1 - seg(u, tw - 0.4, tw - 0.1)), L('連鎖反應', 'Chain reaction'), 480, 38, WHITE, 24);
    const aw = seg(u, tw, tw + 0.4);
    if (L('a', 'b') === 'a') P(c, aw, '不加控制：1 → 3 → 9 → 27 → 81 …，瞬間釋放大量能量（核彈的原理）', 540, 40, WARN, 22);
    else card(c, aw, ['No control: 1 → 3 → 9 → 27 → 81 …', 'a huge burst of energy at once (how an atomic bomb works)'], 540, 46, WARN, 22, 30);
    subtitle(c, k, L('每次分裂放出的中子，又去撞別的鈾核——這就是連鎖反應',
      'Neutrons from each fission hit other uranium nuclei: a chain reaction.'));
  }

  /* ═════════════════ 第 4 步：減速（水是減速劑） ═════════════════ */
  const PANEL4 = { x: 24, y: 86, w: 912, h: 358 };
  const U4 = [{ x: 250, y: 168 }, { x: 800, y: 268 }, { x: 110, y: 384 }, { x: 205, y: 298 }, { x: 742, y: 404 }];
  const WP = [{ x: -30, y: 200 }, { x: 430, y: 236 }, { x: 560, y: 150 }, { x: 650, y: 330 }];
  const UT = U4[1];
  const MV = (function () {
    const last = WP[3], d = Math.hypot(UT.x - last.x, UT.y - last.y);
    const end = { x: last.x + (UT.x - last.x) * (d - SN.R + 4) / d, y: last.y + (UT.y - last.y) * (d - SN.R + 4) / d };
    const pts = WP.concat([end]), v = [520, 300, 170, 80];
    const tm = [0.45]; for (let i = 0; i < 4; i++) tm.push(tm[i] + Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) / v[i]);
    /* 碰撞分子：氫原子的中心放在「碰撞法線」的反方向（彈性碰撞的衝量方向） */
    const hits = [];
    for (let i = 1; i <= 3; i++) {
      const a = pts[i - 1], b = pts[i], cc = pts[i + 1];
      const di = norm(b.x - a.x, b.y - a.y), dout = norm(cc.x - b.x, cc.y - b.y);
      const n = norm(dout.x - di.x, dout.y - di.y);
      const hx = b.x - n.x * 18, hy = b.y - n.y * 18;
      hits.push({ t: tm[i], n, hx, hy, ang: Math.atan2(n.y, n.x) + Math.PI });
    }
    return { pts, v, tm, hits, tA: tm[4] };
  })();
  function norm(x, y) { const d = Math.hypot(x, y) || 1; return { x: x / d, y: y / d }; }
  function nPos4(t) {
    const P_ = MV.pts, tm = MV.tm;
    if (t <= tm[0]) return { x: P_[0].x, y: P_[0].y, sp: 0 };
    for (let i = 0; i < 4; i++) if (t <= tm[i + 1]) { const f = (t - tm[i]) / (tm[i + 1] - tm[i]); return { x: lerp(P_[i].x, P_[i + 1].x, f), y: lerp(P_[i].y, P_[i + 1].y, f), sp: MV.v[i] }; }
    return { x: P_[4].x, y: P_[4].y, sp: 0 };
  }
  const MOLS = (function () {
    const out = [];
    const near = (x, y) => {
      for (const u of U4) if (Math.hypot(x - u.x, y - u.y) < 66) return true;
      for (let i = 0; i < 4; i++) { const a = MV.pts[i], b = MV.pts[i + 1]; if (dSeg(x, y, a, b) < 44) return true; }
      for (const h of MV.hits) if (Math.hypot(x - h.hx, y - h.hy) < 60) return true;
      if (Math.hypot(x - 860, y - 150) < 70) return true;               /* 有標字的那顆 */
      if (y < 150 && x > 30 && x < 490) return true;                     /* 「快中子」說明 */
      if (y > 284 && y < 404 && x > 200 && x < 660) return true;        /* 「撞到氫」說明 */
      if (y > 196 && y < 240 && x > 740 && x < 860) return true;        /* 「鈾-235」 */
      return false;
    };
    let id = 0;
    for (let r = 0; r < 4; r++) for (let q = 0; q < 10; q++) {
      const x = 62 + q * 94 + (r % 2) * 40 + (hash(id * 3 + 400) - 0.5) * 34, y = 120 + r * 92 + (hash(id * 3 + 401) - 0.5) * 30; id++;
      if (x < 50 || x > 914 || y < 112 || y > 424 || near(x, y)) continue;
      out.push({ x, y, a0: hash(id * 7 + 9) * TAU, id });
    }
    return out;
  })();
  function dSeg(x, y, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
    let t = ((x - a.x) * dx + (y - a.y) * dy) / l; t = clamp01(t);
    return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
  }
  function molecule(c, x, y, ang, rO, rH, letters) {
    const bend = 1.82 / 2;   /* H–O–H 約 104.5° */
    const d = rO + rH * 0.35;
    const h1 = { x: x + Math.cos(ang - bend) * d, y: y + Math.sin(ang - bend) * d };
    const h2 = { x: x + Math.cos(ang + bend) * d, y: y + Math.sin(ang + bend) * d };
    nball(c, h1.x, h1.y, rH, H_COL); nball(c, h2.x, h2.y, rH, H_COL);
    nball(c, x, y, rO, O_COL);
    if (letters) {
      W5.label(c, 'O', x, y + 1, '#ffffff', 16, 'center', true);
      W5.label(c, 'H', h1.x, h1.y + 1, '#ffffff', 16, 'center', true);
      W5.label(c, 'H', h2.x, h2.y + 1, '#ffffff', 16, 'center', true);
    }
  }

  function waterPanel(c, x, y, w, h, t) {
    c.save();
    c.fillStyle = W5.rgba(WATER, 0.10); W5.rr(c, x, y, w, h, 18); c.fill();
    c.lineWidth = 2; c.strokeStyle = W5.rgba(WATER, 0.35); c.stroke();
    /* 緩慢流動的水紋 */
    c.beginPath(); W5.rr(c, x, y, w, h, 18); c.clip();
    c.strokeStyle = W5.rgba(WATER, 0.10); c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const yy = y + 30 + i * (h - 40) / 5;
      c.beginPath();
      for (let xx = x; xx <= x + w; xx += 16) { const yv = yy + 5 * Math.sin(xx / 60 + t * 1.3 + i); if (xx === x) c.moveTo(xx, yv); else c.lineTo(xx, yv); }
      c.stroke();
    }
    c.restore();
  }

  function step4(c, s) {
    const u = s.u, k = s.k;
    c.save(); c.globalAlpha = k;
    waterPanel(c, PANEL4.x, PANEL4.y, PANEL4.w, PANEL4.h, u);
    /* 背景水分子：熱運動（晃、轉） */
    MOLS.forEach(m => {
      const x = m.x + 3 * Math.sin(u * 1.7 + m.id), y = m.y + 3 * Math.cos(u * 1.4 + m.id * 1.3);
      molecule(c, x, y, m.a0 + 0.35 * Math.sin(u * 0.9 + m.id), 15, 9, false);
    });
    /* 有標字的水分子 */
    molecule(c, 860 + 2 * Math.sin(u * 1.5), 154 + 2 * Math.cos(u * 1.2), Math.PI / 2 + 0.25 * Math.sin(u * 0.8), 19, 12, true);
    /* 被撞的水分子：被撞後往後彈開、晃得更厲害 */
    MV.hits.forEach((h, i) => {
      const dt = u - h.t, rec = dt > 0 ? 16 * (1 - Math.exp(-dt / 0.3)) : 0;
      const sh = dt > 0 ? 4 * Math.exp(-dt / 1.2) : 0;
      const ox = h.hx - h.n.x * rec, oy = h.hy - h.n.y * rec;
      /* O 在 H 的另一側：分子中心 = H − n·(rO + rH·0.35) 的方向上 */
      const d = 15 + 9 * 0.35, bend = 1.82 / 2;
      const ang = Math.atan2(h.n.y, h.n.x) + bend;           /* 讓第一顆 H 剛好朝向中子 */
      const Ox = ox - Math.cos(ang - bend) * d, Oy = oy - Math.sin(ang - bend) * d;
      const w = sh * Math.sin(dt * 25);
      molecule(c, Ox + w, Oy + w * 0.6, ang + 0.05 * w + 0.25 * Math.sin(u * 0.9 + i), 15, 9, false);
      if (dt > 0 && dt < 0.5) {
        const kk = 1 - dt / 0.5;
        W5.glow(c, h.hx + h.n.x * 9, h.hy + h.n.y * 9, 30, '#ffffff', 0.7 * kk);
        c.save(); c.strokeStyle = W5.rgba('#ffffff', 0.8 * kk); c.lineWidth = 2; c.lineCap = 'round';
        for (let j = 0; j < 5; j++) { const an = j / 5 * TAU + i, r0 = 12 + dt * 30; c.beginPath(); c.moveTo(h.hx + h.n.x * 9 + Math.cos(an) * r0, h.hy + h.n.y * 9 + Math.sin(an) * r0); c.lineTo(h.hx + h.n.x * 9 + Math.cos(an) * (r0 + 9 * kk), h.hy + h.n.y * 9 + Math.sin(an) * (r0 + 9 * kk)); c.stroke(); }
        c.restore();
      }
    });
    /* 鈾-235 原子核 */
    U4.forEach((p, i) => smallNuc(c, p.x, p.y, u, i === 1 ? MV.tA + 0.25 : Infinity, i === 1 ? 0.35 : 0, 30 + i));
    /* 中子 */
    if (u < MV.tA) {
      const trl = []; for (let m = 0; m < 12; m++) { const q = nPos4(u - m * 0.022); trl.push(q); }
      const sp = nPos4(u).sp, fast = clamp01((sp - 80) / 440);
      flyN(c, trl, 8, fast, clamp01((u - 0.3) / 0.25));
    } else if (u < MV.tA + 0.6) {
      W5.glow(c, MV.pts[4].x, MV.pts[4].y, 30, '#ffffff', 0.6 * (1 - (u - MV.tA) / 0.6));
    }
    /* 分裂後再射出的快中子 */
    const tfz = MV.tA + 0.25;
    if (u > tfz) {
      [-2.3, 0.2, 1.3].forEach((an, j) => {
        const trl = []; for (let m = 0; m < 10; m++) { const tm = Math.max(0, u - tfz - m * 0.025); trl.push({ x: UT.x + Math.cos(an) * 420 * tm, y: UT.y + Math.sin(an) * 420 * tm }); }
        const h = trl[0]; if (h.x < PANEL4.x + PANEL4.w + 20 && h.y > PANEL4.y - 20 && h.y < PANEL4.y + PANEL4.h + 20) flyN(c, trl, 7, 1, 1);
      });
    }
    c.restore();

    legend(c, k, true);
    P(c, k, L('水＝減速劑：讓快中子變成慢中子，鈾-235 才容易吸收', 'Water = moderator: slow neutrons are easy for U-235 to absorb'), 530, 40, WATER, 22);
    T(c, k, L('水分子', 'water molecule'), 860, 108, WATER, 20);
    T(c, seg(u, 0.7, 1.0), L('快中子：不容易引起分裂', 'Fast neutron: hard to cause fission'), 250, 118, FASTN, 22);
    T(c, seg(u, MV.hits[0].t + 0.1, MV.hits[0].t + 0.4), L('撞到氫原子，速度變慢', 'Each hit on hydrogen slows it down'), 430, 330, H_COL, 22);
    T(c, seg(u, MV.hits[2].t + 0.4, MV.hits[2].t + 0.8), L('示意：實際約要撞 20 次', 'In reality: about 20 hits'), 430, 362, DIM, 20);
    T(c, k * (1 - seg(u, MV.tA + 0.2, MV.tA + 0.5)), L('鈾-235', 'Uranium-235'), UT.x, 220, WHITE, 20);
    if (u > MV.hits[2].t && u < MV.tA) {
      const q = nPos4(u);
      T(c, seg(u, MV.hits[2].t + 0.1, MV.hits[2].t + 0.4) * (1 - seg(u, MV.tA - 0.7, MV.tA - 0.4)), L('慢中子', 'slow neutron'), q.x, q.y - 28, NEU, 22);
    }
    subtitle(c, k, L('快中子撞上水分子變慢，慢中子才容易被鈾-235 吸收',
      'Fast neutrons slow down by hitting water molecules; slow neutrons are easily absorbed by uranium-235.'));
  }

  /* ═════════════════ 第 5 步：控制棒（中子事件表載入時算好） ═════════════════ */
  const V5 = { x: 40, y: 92, w: 560, h: 348 };
  const RODS = [110, 250, 390, 530], CRODS = [180, 320, 460];
  const RY0 = 132, RY1 = 428, FW = 44, CW = 22;
  const ST = [0, 2.8, 5.6];
  function ins5(u) {
    if (u < ST[1]) return 0;
    if (u < ST[2]) return ease(seg(u, ST[1], ST[1] + 0.6));
    return 1 - 0.5 * ease(seg(u, ST[2], ST[2] + 0.6));
  }
  const tip5 = u => lerp(126, 428, ins5(u));
  const stage5 = t => (t < ST[1] ? 0 : t < ST[2] ? 1 : 2);
  const SIM5 = (function () {
    let sd = 9001; const rnd = () => hash(sd++);
    const VN = 210, END = DUR[4] + 0.2;
    const fis = [], neu = [], abs = [];
    const q = [];
    const push = f => { q.push(f); q.sort((a, b) => a.t - b.t); };
    [[0.2, 1, 220], [0.35, 2, 330], [0.5, 0, 280], [0.7, 3, 190]].forEach(([t, r, y]) => push({ t, x: RODS[r], y, rod: r, m: -1 }));
    [5.75, 6.05, 6.35].forEach((t, i) => push({ t, x: RODS[[0, 3, 1][i]], y: 180 + i * 90, rod: [0, 3, 1][i], m: 1 }));
    /* 第 2 階段的中子源：偶爾冒出的單顆中子（會被控制棒吃掉） */
    [3.3, 3.9, 4.5, 5.0].forEach((t, i) => {
      const rod = [1, 2, 0, 3][i], y = 170 + rnd() * 220;
      emitFree(t, RODS[rod] + (rod < 2 ? 18 : -18), y, rod < 2 ? 0 : Math.PI);
    });
    function crossCtl(x0, y0, x1, y1, t0) {   /* 第一個碰到的「已插入」控制棒 */
      const len = Math.hypot(x1 - x0, y1 - y0); let best = null;
      CRODS.forEach(cx => {
        for (const side of [-CW / 2, CW / 2]) {
          const xe = cx + side; if ((xe - x0) * (xe - x1) > 0 || x1 === x0) continue;
          const lam = (xe - x0) / (x1 - x0), yc = y0 + lam * (y1 - y0), tc = t0 + lam * len / VN;
          if (yc > V5.y && yc < tip5(tc) && (!best || lam < best.lam)) best = { lam, x: xe, y: yc, t: tc };
        }
      });
      return best;
    }
    function emitFree(t0, x0, y0, an) {
      const len = 150 + rnd() * 90;
      let x1 = x0 + Math.cos(an) * len, y1 = y0 + Math.sin(an) * len;
      /* 留在容器內 */
      const fx = x1 < V5.x + 8 ? (V5.x + 8 - x0) / (x1 - x0) : x1 > V5.x + V5.w - 8 ? (V5.x + V5.w - 8 - x0) / (x1 - x0) : 1;
      const fy = y1 < V5.y + 8 ? (V5.y + 8 - y0) / (y1 - y0) : y1 > V5.y + V5.h - 8 ? (V5.y + V5.h - 8 - y0) / (y1 - y0) : 1;
      const f = Math.min(fx, fy); x1 = x0 + (x1 - x0) * f; y1 = y0 + (y1 - y0) * f;
      const hit = crossCtl(x0, y0, x1, y1, t0);
      if (hit) { neu.push({ t0, t1: hit.t, x0, y0, x1: hit.x, y1: hit.y, fate: 'abs' }); abs.push({ t: hit.t, x: hit.x, y: hit.y }); }
      else neu.push({ t0, t1: t0 + Math.hypot(x1 - x0, y1 - y0) / VN, x0, y0, x1, y1, fate: 'esc' });
    }
    let guard = 0;
    while (q.length && guard++ < 1200) {
      const f = q.shift(); if (f.t > END) break;
      fis.push(f);
      const st = stage5(f.t);
      const recent = fis.filter(g => g.t > f.t - 1.2).length;
      let m = f.m >= 0 ? f.m : st === 0 ? (recent < 14 ? 2 : recent < 20 ? 1 : 0) : st === 1 ? 0 : 1;
      if (st === 2 && f.m < 0) m = 1;
      const n = 2 + (rnd() < 0.45 ? 1 : 0);
      for (let j = 0; j < n; j++) {
        if (j < m) {   /* 會再引起分裂：飛到別根燃料棒，路上不能穿過已插入的控制棒 */
          let ok = false;
          for (let tries = 0; tries < 14 && !ok; tries++) {
            const dj = [-1, 1, -2, 2][Math.floor(rnd() * 4)], r2 = f.rod + dj;
            if (r2 < 0 || r2 > 3) continue;
            const x1 = RODS[r2] + (rnd() - 0.5) * 18, y1 = RY0 + 14 + rnd() * (RY1 - RY0 - 28);
            if (crossCtl(f.x, f.y, x1, y1, f.t)) continue;
            const t1 = f.t + Math.hypot(x1 - f.x, y1 - f.y) / VN;
            if (t1 > END) { ok = true; neu.push({ t0: f.t, t1, x0: f.x, y0: f.y, x1, y1, fate: 'fis' }); break; }
            neu.push({ t0: f.t, t1, x0: f.x, y0: f.y, x1, y1, fate: 'fis' });
            push({ t: t1, x: x1, y: y1, rod: r2, m: -1 }); ok = true;
          }
          if (!ok) emitFree(f.t, f.x, f.y, rnd() * TAU);
        } else {
          /* 其他中子：往旁邊飛，碰到控制棒就被吸收，否則被水／容器吸收而淡出 */
          let an = rnd() * TAU;
          if (st >= 1 && rnd() < 0.7) { const cl = CRODS.reduce((b, cx) => Math.abs(cx - f.x) < Math.abs(b - f.x) ? cx : b, CRODS[0]); an = (cl > f.x ? 0 : Math.PI) + (rnd() - 0.5) * 1.2; }
          emitFree(f.t, f.x, f.y, an);
        }
      }
    }
    return { fis, neu, abs };
  })();

  function fuelRod(c, x, i, heat) {
    const x0 = x - FW / 2;
    const g = c.createLinearGradient(x0, 0, x0 + FW, 0);
    g.addColorStop(0, '#6f6640'); g.addColorStop(0.35, W5.mix('#c9b66e', '#ffcf8a', heat)); g.addColorStop(1, '#5d5636');
    c.fillStyle = g; W5.rr(c, x0, RY0, FW, RY1 - RY0, 10); c.fill();
    c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 1.5;
    for (let y = RY0 + 26; y < RY1 - 6; y += 26) { c.beginPath(); c.moveTo(x0 + 3, y); c.lineTo(x0 + FW - 3, y); c.stroke(); }
    for (let j = 0; j < 40; j++) {   /* 燃料丸裡的小顆粒 */
      const px = x0 + 6 + hash(i * 100 + j) * (FW - 12), py = RY0 + 6 + hash(i * 100 + j + 50) * (RY1 - RY0 - 12);
      c.fillStyle = 'rgba(80,72,40,0.55)'; c.beginPath(); c.arc(px, py, 2.2, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.5; W5.rr(c, x0, RY0, FW, RY1 - RY0, 10); c.stroke();
  }
  function ctlRod(c, x, tip) {
    const x0 = x - CW / 2, top = 70;
    const g = c.createLinearGradient(x0, 0, x0 + CW, 0);
    g.addColorStop(0, '#1f2a27'); g.addColorStop(0.4, '#4a5a55'); g.addColorStop(1, '#1a2421');
    c.fillStyle = g; W5.rr(c, x0, top, CW, tip - top, 5); c.fill();
    c.strokeStyle = '#8fa39c'; c.lineWidth = 1.5; c.stroke();
  }

  function step5(c, s) {
    const u = s.u, k = s.k, tip = tip5(u);
    c.save(); c.globalAlpha = k;
    waterPanel(c, V5.x, V5.y, V5.w, V5.h, u);
    /* 氣泡（一直在動） */
    c.save(); c.beginPath(); W5.rr(c, V5.x, V5.y, V5.w, V5.h, 18); c.clip();
    for (let i = 0; i < 14; i++) {
      const bx = V5.x + 20 + hash(i * 3 + 700) * (V5.w - 40) + 4 * Math.sin(u * 2 + i);
      const by = V5.y + V5.h - ((u * (26 + 14 * hash(i + 720)) + hash(i * 3 + 701) * V5.h) % V5.h);
      c.strokeStyle = W5.rgba(WATER, 0.45); c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by, 2.5 + 2 * hash(i + 730), 0, TAU); c.stroke();
    }
    c.restore();
    /* 爐心亮度：最近的分裂越多越亮（橘紅） */
    let I = 0; SIM5.fis.forEach(f => { const d = u - f.t; if (d >= 0) I += Math.exp(-d / 0.7); });
    const heat = clamp01(I / 14);
    W5.glow(c, 320, 280, 360, HEAT, 0.42 * heat);
    RODS.forEach((x, i) => fuelRod(c, x, i, heat));
    /* 中子 */
    SIM5.neu.forEach(n => {
      if (u < n.t0 || u > n.t1 + (n.fate === 'esc' ? 0 : 0)) return;
      const trl = [];
      for (let m = 0; m < 7; m++) { const f = clamp01((u - m * 0.03 - n.t0) / (n.t1 - n.t0)); trl.push({ x: lerp(n.x0, n.x1, f), y: lerp(n.y0, n.y1, f) }); }
      const f0 = (u - n.t0) / (n.t1 - n.t0);
      const a = n.fate === 'esc' ? 1 - seg(f0, 0.6, 1) : 1;
      flyN(c, trl, 5.5, 0.3, a);
    });
    /* 分裂閃光 */
    SIM5.fis.forEach(f => { const d = u - f.t; if (d >= 0 && d < 1.2) flash(c, f.x, f.y, d, 34); });
    /* 控制棒（畫在中子之後：被吸收的中子消失在棒上） */
    c.fillStyle = '#33423e'; W5.rr(c, 160, 64, 320, 11, 5); c.fill();
    c.strokeStyle = '#8fa39c'; c.lineWidth = 1.5; c.stroke();
    CRODS.forEach(x => ctlRod(c, x, tip));
    /* 吸收火花 */
    SIM5.abs.forEach(a => {
      const d = u - a.t; if (d < 0 || d > 0.45) return;
      const kk = 1 - d / 0.45;
      W5.glow(c, a.x, a.y, 16, NEU, 0.8 * kk);
      c.save(); c.strokeStyle = W5.rgba(NEU, 0.85 * kk); c.lineWidth = 1.8; c.lineCap = 'round';
      for (let j = 0; j < 4; j++) { const an = j / 4 * TAU + 0.6, r0 = 5 + d * 20; c.beginPath(); c.moveTo(a.x + Math.cos(an) * r0, a.y + Math.sin(an) * r0); c.lineTo(a.x + Math.cos(an) * (r0 + 7 * kk), a.y + Math.sin(an) * (r0 + 7 * kk)); c.stroke(); }
      c.restore();
    });
    c.restore();

    /* 右欄：標示＋每階段的小圖示 */
    legend(c, k, false);
    c.save(); c.globalAlpha = k; c.strokeStyle = 'rgba(163,184,176,0.6)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(624, 112); c.lineTo(CRODS[2] + CW / 2 + 4, 112); c.stroke();
    c.beginPath(); c.moveTo(624, 214); c.lineTo(RODS[3] + FW / 2 + 4, 214); c.stroke();
    c.beginPath(); c.moveTo(624, 266); c.lineTo(578, 266); c.stroke();
    c.restore();
    T(c, k, L('控制棒', 'Control rods'), 630, 112, WHITE, 22, 'left');
    T(c, k, L('（硼、鎘，吸收中子）', '(boron, cadmium:'), 630, 142, WHITE, 20, 'left');
    if (L('a', 'b') === 'b') T(c, k, 'absorb neutrons)', 630, 168, WHITE, 20, 'left');
    T(c, k, L('燃料棒（鈾）', 'Fuel rods (uranium)'), 630, 214, '#e3cf85', 22, 'left');
    T(c, k, L('水（減速劑）', 'Water (moderator)'), 630, 266, WATER, 22, 'left');

    T(c, k, L('每次分裂，平均讓幾個', 'Neutrons per fission that'), 630, 322, DIM, 20, 'left');
    T(c, k, L('中子再引起分裂：', 'cause another (average):'), 630, 350, DIM, 20, 'left');
    const sA = [1 - seg(u, ST[1] - 0.25, ST[1]), seg(u, ST[1] + 0.05, ST[1] + 0.3) * (1 - seg(u, ST[2] - 0.25, ST[2])), seg(u, ST[2] + 0.05, ST[2] + 0.3)].map(v => v * k);
    const icon = (a, nb, faint, txt, col) => {
      if (a <= 0.02) return;
      c.save(); c.globalAlpha *= a;
      const yy = 398, pulse = 0.5 + 0.5 * Math.sin(u * 6);
      flash(c, 650, yy, 0.25 + 0.15 * pulse, 26);
      c.strokeStyle = ENE; c.lineWidth = 2.5; c.lineCap = 'round';   /* 小小的「分裂」爆星 */
      for (let j = 0; j < 8; j++) { const an = j / 8 * TAU, r0 = 4, r1 = j % 2 ? 10 : 15; c.beginPath(); c.moveTo(650 + Math.cos(an) * r0, yy + Math.sin(an) * r0); c.lineTo(650 + Math.cos(an) * r1, yy + Math.sin(an) * r1); c.stroke(); }
      W5.arrow(c, 672, yy, 712, yy, DIM, 3, 10);
      for (let j = 0; j < nb; j++) { c.save(); if (faint) c.globalAlpha *= 0.35; W5.glow(c, 734 + j * 30, yy, 18, '#ffffff', 0.4 * pulse); nball(c, 734 + j * 30, yy, 9, NEU); c.restore(); }
      c.restore();
      T(c, a, txt, 734 + nb * 30 + 4, yy, col, 26, 'left', true);
    };
    icon(sA[0], 2, false, '≥ 2', HEAT);
    icon(sA[1], 1, true, '≤ 0.5', DIM);
    icon(sA[2], 1, false, '= 1', GOOD);

    P(c, sA[0], L('拉出：反應變快', 'Rods out: the reaction speeds up'), 520, 38, HEAT, 22);
    P(c, sA[1], L('插入：反應變慢、甚至停止', 'Rods in: the reaction slows or stops'), 520, 38, DIM, 22);
    P(c, sA[2], L('剛好平衡：每次分裂只讓 1 個中子再引起分裂，穩定發電', 'Balanced: each fission triggers exactly 1 more, steady power'), 520, 38, GOOD, 22);
    subtitle(c, k, L('控制棒吸收中子，讓反應維持在剛剛好的速度',
      'Control rods absorb neutrons and keep the reaction at just the right pace.'));
  }

  W5.register('fission', {
    canvas: 'cvs-fission',
    steps: DUR,
    draw(c, s) {
      if (s.n === 1) step1(c, s);
      else if (s.n === 2) step2(c, s);
      else if (s.n === 3) step3(c, s);
      else if (s.n === 4) step4(c, s);
      else step5(c, s);
    }
  });
})();
