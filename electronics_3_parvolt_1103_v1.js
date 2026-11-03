/* ==================================================================
   electronics_3 ｜為什麼並聯各支路電壓相等（cvs-t3v）
   五步自動循環：1 電子的能量 → 2 串聯分攤 → 3 只能選一條 → 4 花光能量 → 5 電壓相等

   物理模型（國中版）：電壓＝每顆電子身上扛的能量。電池給每顆電子一份（3 格＝3.0 V），
   電子在導線上能量不變，只有經過燈的那一小段才把能量花掉（扣除位置由燈的座標算出）。

   電子用「發射序號」來排：第 j 顆在 t 時刻走了 s = t·v − j·D 的路程，
   並聯時 j 為偶數走上支路、奇數走下支路——一顆一顆輪流選，絕不分身。
   上支路比下支路多 216 px（兩段 108 px 的直立轉角）＝ 4·D，
   所以兩條支路的電子回到主線時剛好又排成等距，不會擠成一團。

   沿用 electronics_3.html 的全域：tr、currentTab、animFrames、COLOR_*、E_BLUE、e_* 繪圖函式。
   本檔自訂的函式一律 pv_ 開頭。
   ================================================================== */
(function () {
  'use strict';

  const W = 960, H = 480;
  const L = 120, R = 840, TOPB = 148, MIDB = 256, BOT = 382;
  const BAT_L = 420, BAT_R = 540, CX = 480;
  const LAMP_S = 0.66;
  const V_E = 84;          /* 電子速度 px/s */
  const D = 54;            /* 主線上電子間距；216 = 4·D，回主線仍等距 */
  const DRAIN = 22;        /* 能量在燈座 ±22 px 內扣完（落在燈上，不在導線上） */
  const TR = 0.9;          /* 步驟轉場秒數 */
  const DUR = [0, 6.5, 7.5, 7.5, 7.5, 10];
  const TOTAL = DUR.reduce((a, b) => a + b, 0);
  const NODE_COL = '#f6f3ea';
  const ENERGY = (typeof COLOR_YELLOW !== 'undefined') ? COLOR_YELLOW : '#ffe066';  /* 能量＝黃，全程一致 */

  /* 路徑：起點一律是電池負極（左端 x=420），終點是正極（右端 x=540） */
  const P_SER = [{ x: BAT_L, y: BOT }, { x: L, y: BOT }, { x: L, y: TOPB }, { x: R, y: TOPB },
                 { x: R, y: BOT }, { x: BAT_R, y: BOT }];
  const P_UP  = [{ x: BAT_L, y: BOT }, { x: L, y: BOT }, { x: L, y: MIDB }, { x: L, y: TOPB },
                 { x: CX, y: TOPB }, { x: R, y: TOPB }, { x: R, y: MIDB }, { x: R, y: BOT }, { x: BAT_R, y: BOT }];
  const P_DN  = [{ x: BAT_L, y: BOT }, { x: L, y: BOT }, { x: L, y: MIDB }, { x: CX, y: MIDB },
                 { x: R, y: MIDB }, { x: R, y: BOT }, { x: BAT_R, y: BOT }];
  const S_NODE = (BAT_L - L) + (BOT - MIDB);   /* 426：抵達分流點的路程 */

  function pv_prep(pts) {
    const segs = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y, len = Math.hypot(dx, dy);
      if (len < 0.001) continue;
      segs.push({ x: pts[i].x, y: pts[i].y, dx, dy, len, s0: tot }); tot += len;
    }
    return { pts, segs, len: tot };
  }
  const G_SER = pv_prep(P_SER), G_UP = pv_prep(P_UP), G_DN = pv_prep(P_DN);

  function pv_at(g, s) {
    for (const sg of g.segs) {
      if (s <= sg.s0 + sg.len) { const r = (s - sg.s0) / sg.len; return { x: sg.x + sg.dx * r, y: sg.y + sg.dy * r }; }
    }
    const last = g.pts[g.pts.length - 1]; return { x: last.x, y: last.y };
  }
  /* 燈在路徑上的位置：交給 e_frac 用燈的座標去算，不用座標硬猜 */
  function pv_arc(g, x, y) { return e_frac(g.pts, x, y) * g.len; }

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── 能量格：3 格＝一份＝3.0 V，從右邊那格開始被花掉 ── */
  function pv_cells(c, cx, topY, e, cw) {
    const w = cw || 9, g = Math.max(2, Math.round(w * 0.22)), tw = 3 * w + 2 * g, x0 = cx - tw / 2;
    c.fillStyle = 'rgba(11,26,21,0.80)';
    e_rr(c, x0 - 3, topY - 3, tw + 6, w + 6, 4); c.fill();
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * (w + g), f = clamp01(e * 3 - i);
      if (f > 0.001) { c.fillStyle = ENERGY; c.fillRect(x, topY, w * f, w); }
      c.strokeStyle = 'rgba(255,224,102,0.55)'; c.lineWidth = 1.2;
      c.strokeRect(x + 0.5, topY + 0.5, w - 1, w - 1);
    }
  }
  function pv_electron(c, x, y, e) {
    e_carrier(c, x, y, e);
    pv_cells(c, x, y - 32, e);
  }

  /* ── 每一步的版面：燈的位置、亮度、每顆燈吃掉多少能量、中間那條支路在不在 ── */
  function pv_layout(n) {
    if (n === 1) return { sys: 's', mid: 0,
      A: { x: CX, y: TOPB, lit: 1, amt: 1, vis: 1 }, B: { x: CX, y: TOPB, lit: 1, amt: 0, vis: 0 } };
    if (n === 2) return { sys: 's', mid: 0,
      A: { x: 330, y: TOPB, lit: 0.55, amt: 0.5, vis: 1 }, B: { x: 630, y: TOPB, lit: 0.55, amt: 0.5, vis: 1 } };
    return { sys: 'p', mid: 1,
      A: { x: CX, y: TOPB, lit: 1, amt: 1, vis: 1 }, B: { x: CX, y: MIDB, lit: 1, amt: 1, vis: 1 } };
  }
  function pv_mixLamp(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), lit: lerp(a.lit, b.lit, t),
             amt: lerp(a.amt, b.amt, t), vis: lerp(a.vis, b.vis, t) };
  }

  function pv_energy(s, drops) {
    let e = 1;
    for (const d of drops) e -= d.amt * ease((s - (d.s - DRAIN)) / (2 * DRAIN));
    return e;
  }

  /* ── 一整串電子 ── */
  function pv_drawSeries(c, tv, A, B) {
    const drops = [];
    if (A.amt > 0.001) drops.push({ s: pv_arc(G_SER, A.x, A.y), amt: A.amt });
    if (B.amt > 0.001) drops.push({ s: pv_arc(G_SER, B.x, B.y), amt: B.amt });
    const jMax = Math.floor(tv / D), jMin = Math.ceil((tv - G_SER.len) / D);
    for (let j = jMin; j <= jMax; j++) {
      const s = tv - j * D; if (s < 0 || s > G_SER.len) continue;
      const p = pv_at(G_SER, s);
      pv_electron(c, p.x, p.y, pv_energy(s, drops));
    }
  }
  function pv_drawParallel(c, tv, A, B, mark) {
    const dUp = [{ s: pv_arc(G_UP, CX, TOPB), amt: A.amt }];
    const dDn = [{ s: pv_arc(G_DN, CX, MIDB), amt: B.amt }];
    const jMax = Math.floor(tv / D), jMin = Math.ceil((tv - G_UP.len) / D);
    let picked = null;
    for (let j = jMin; j <= jMax; j++) {
      const up = (((j % 2) + 2) % 2) === 0;
      const g = up ? G_UP : G_DN;
      const s = tv - j * D; if (s < 0 || s > g.len) continue;
      const p = pv_at(g, s);
      pv_electron(c, p.x, p.y, pv_energy(s, up ? dUp : dDn));
      const past = s - S_NODE;
      if (past >= 0 && past < D) picked = { x: p.x, y: p.y, up, k: past / D };
    }
    if (mark > 0.01 && picked) {          /* 剛剛在分流點做出選擇的那一顆 */
      c.save(); c.globalAlpha *= mark * (1 - picked.k);
      c.strokeStyle = '#f6f3ea'; c.lineWidth = 3;
      c.beginPath(); c.arc(picked.x, picked.y, 19, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    return picked;
  }

  function pv_wires(c, mid) {
    e_wire(c, [{ x: BAT_L, y: BOT }, { x: L, y: BOT }, { x: L, y: TOPB }, { x: R, y: TOPB },
               { x: R, y: BOT }, { x: BAT_R, y: BOT }], 7, '#5c6763');
    if (mid > 0.01) {
      c.save(); c.globalAlpha *= mid;
      e_wire(c, [{ x: L, y: MIDB }, { x: R, y: MIDB }], 7, '#5c6763');
      c.restore();
    }
  }

  /* 文字：一律不縮字（不給 maxW），版面已預留寬度，自測時量過 */
  function pv_t(c, s, x, y, col, size, align) { e_label(c, s, x, y, col, size, align || 'center', true); }

  /* ── 每一步的圖上標籤 ── */
  function pv_labels(c, n, al, picked) {
    if (al <= 0.01) return;
    c.save(); c.globalAlpha *= al;
    if (n === 1) {
      pv_t(c, tr('滿 3 格出發', 'leaves with 3 cells'), 270, BOT - 44, ENERGY, 20);
      pv_t(c, tr('導線上：能量不變', 'on the wire: energy unchanged'), 300, 272, COLOR_WHITE, 20);
      pv_t(c, tr('在燈上花光', 'spent in the bulb'), 668, 102, ENERGY, 20);
      pv_t(c, tr('0 格，回電池', '0 cells, back to battery'), 690, BOT - 44, COLOR_DIM, 20);
    } else if (n === 2) {
      pv_t(c, 'V₁ = 1.5 V', 330, TOPB + 48, ENERGY, 22);
      pv_t(c, 'V₂ = 1.5 V', 630, TOPB + 48, ENERGY, 22);
      pv_t(c, tr('花 1.5 格', 'spends 1.5 cells'), 330, TOPB + 80, COLOR_WHITE, 19);
      pv_t(c, tr('再花 1.5 格', 'spends the other 1.5'), 630, TOPB + 80, COLOR_WHITE, 19);
      pv_t(c, '1.5 V + 1.5 V = 3.0 V', CX, 290, COLOR_GREEN, 24);
      pv_t(c, tr('滿 3 格出發', 'leaves with 3 cells'), 270, BOT - 44, ENERGY, 20);
      pv_t(c, tr('0 格，回電池', '0 cells, back to battery'), 690, BOT - 44, COLOR_DIM, 20);
    } else if (n === 3) {
      pv_t(c, tr('一顆走上面，下一顆走下面', 'one up, the next one down'), 290, 208, E_BLUE, 20);
      const upOn = picked ? picked.up : true;
      const on = '#9fe6ff', off = 'rgba(77,210,255,0.22)';
      e_arrow(c, L + 28, MIDB - 14, L + 28, MIDB - 58, upOn ? on : off, 4, 14);
      e_arrow(c, L + 20, MIDB + 22, L + 70, MIDB + 22, upOn ? off : on, 4, 14);
      pv_t(c, tr('分流點', 'splits here'), L + 28, MIDB + 58, NODE_COL, 20, 'left');
      pv_t(c, tr('匯流點', 'rejoins here'), R - 28, MIDB + 58, NODE_COL, 20, 'right');
    } else if (n === 4) {
      pv_t(c, tr('燈 1：3 格 → 0 格', 'bulb 1: 3 → 0 cells'), 680, 102, ENERGY, 22);
      pv_t(c, tr('燈 2：3 格 → 0 格', 'bulb 2: 3 → 0 cells'), 680, 206, ENERGY, 22);
      pv_t(c, tr('滿能量進來', 'arrive full'), 270, BOT - 44, ENERGY, 20);
      pv_t(c, tr('空手回電池', 'return empty'), 690, BOT - 44, COLOR_DIM, 20);
    } else if (n === 5) {
      pv_t(c, 'V₁ = 3.0 V', 680, 98, ENERGY, 26);
      pv_t(c, 'V₂ = 3.0 V', 680, 204, ENERGY, 26);
      pv_t(c, 'V = 3.0 V', CX, BOT - 60, ENERGY, 22);
      pv_t(c, tr('分流點：每顆 3 格', 'split: 3 cells each'), L + 28, MIDB + 58, ENERGY, 20, 'left');
      pv_t(c, tr('匯流點：每顆 0 格', 'rejoin: 0 cells each'), R - 28, MIDB + 58, COLOR_DIM, 20, 'right');
    }
    c.restore();
  }

  /* ── 下方的步驟說明（22px，必要時兩行）── */
  function pv_caption(c, n, al) {
    if (al <= 0.01) return;
    const T = {
      1: [tr('電池給每顆電子一份能量：3 格 ＝ 3.0 V。', 'The battery gives every electron one share of energy: 3 cells = 3.0 V.'),
          tr('電子在導線上能量不變，只有經過燈時才把能量花掉。', 'On the wires its energy stays the same; it is spent only in the bulb.')],
      2: [tr('串聯：同一顆電子要連續經過兩顆燈，', 'Series: the same electron must pass both bulbs, one after the other,'),
          tr('3 格只好分成 1.5 ＋ 1.5，每顆燈只分到一半。', 'so its 3 cells are split 1.5 + 1.5 and each bulb gets only half.')],
      3: [tr('並聯：電子一顆一顆來到分流點，不能分身——', 'Parallel: electrons reach the split one by one and cannot split in two —'),
          tr('每一顆只能選一條路，有的走上面、有的走下面。', 'each takes just one branch: some go up, some go down.')],
      4: [tr('每條支路只有一顆燈：3 格能量全部在這顆燈花光。', 'Each branch has only one bulb, so all 3 cells are spent in that bulb.'),
          tr('主線上電子滿能量進來、空手回到電池。', 'On the main line electrons arrive full and return empty.')],
      5: [tr('不管走哪一條，每顆電子都把整份 3.0 V 花在自己那顆燈：', 'Whichever branch, each electron spends its whole 3.0 V in its own bulb:'),
          'V = V₁ = V₂ = 3.0 V']
    }[n];
    c.save(); c.globalAlpha *= al;
    pv_t(c, T[0], CX, 440, COLOR_WHITE, 22);
    if (n === 5) pv_t(c, T[1], CX, 472, COLOR_GREEN, 26);
    else pv_t(c, T[1], CX, 470, COLOR_WHITE, 22);
    c.restore();
  }

  function pv_header(c) {
    /* 圖例（左上）：藍球＝電子，從負極出發 */
    e_carrier(c, 35, 30, 1);
    e_label(c, tr('藍球＝電子，從負極出發', 'blue = electrons, leaving the − terminal'), 50, 37, '#9fdcf5', 19, 'left', true);
    /* 能量格說明（右上） */
    const s = tr('＝ 3.0 V（一份能量）', '= 3.0 V (one share)');
    const wd = e_w(c, s, 19);
    e_label(c, s, 936, 37, ENERGY, 19, 'right', true);
    pv_cells(c, 936 - wd - 34, 24, 1, 12);
  }

  function pv_progress(c, frac) {
    c.fillStyle = 'rgba(246,243,234,0.12)';
    e_rr(c, 0, 0, W, 5, 2.5); c.fill();
    c.fillStyle = 'rgba(246,243,234,0.62)';
    e_rr(c, 0, 0, Math.max(5, W * frac), 5, 2.5); c.fill();
    let acc = 0;
    c.fillStyle = 'rgba(17,38,31,0.95)';
    for (let i = 1; i < 5; i++) { acc += DUR[i]; c.fillRect(W * acc / TOTAL - 1.5, 0, 3, 5); }
  }

  /* ── 狀態 ── */
  let step = 1, from = 1, stepT = 0, tv = 0, lastTs = null, shownBtn = 0;
  let cvs = null, ctx = null;

  function pv_buttons() {
    if (shownBtn === step) return;
    shownBtn = step;
    for (let i = 1; i <= 5; i++) {
      const b = document.getElementById('btn-pv-' + i);
      if (b) b.classList.toggle('active', i === step);
    }
  }

  function pv_visible() {
    if (document.hidden || currentTab !== 'tab3') return false;
    const v = document.getElementById('view-t3-par');
    return !!(v && getComputedStyle(v).display !== 'none' && cvs && cvs.offsetParent !== null);
  }

  function pv_draw() {
    const c = ctx;
    c.clearRect(0, 0, W, H);
    e_pen(c);

    const trans = (from !== step) && stepT < TR;
    const a = trans ? ease(stepT / TR) : 1;
    const Lf = pv_layout(from), Lt = pv_layout(step);
    const useFrom = trans ? Lf : Lt;
    const A = pv_mixLamp(useFrom.A, Lt.A, a), B = pv_mixLamp(useFrom.B, Lt.B, a);
    const mid = lerp(useFrom.mid, Lt.mid, a);

    /* 1 導線 */
    pv_wires(c, mid);

    /* 2 電子（在燈之前畫） */
    let picked = null;
    const mark3 = (step === 3 ? a : 0) + (trans && from === 3 ? 1 - a : 0);
    if (!trans || Lf.sys === Lt.sys) {
      if (Lt.sys === 's') pv_drawSeries(c, tv, A, B);
      else picked = pv_drawParallel(c, tv, A, B, mark3);
    } else {
      c.save(); c.globalAlpha = 1 - a;
      if (Lf.sys === 's') pv_drawSeries(c, tv, Lf.A, Lf.B); else picked = pv_drawParallel(c, tv, Lf.A, Lf.B, 0);
      c.globalAlpha = a;
      if (Lt.sys === 's') pv_drawSeries(c, tv, Lt.A, Lt.B); else picked = pv_drawParallel(c, tv, Lt.A, Lt.B, mark3);
      c.restore();
    }

    /* 3 燈、電池、節點（元件在電子之後） */
    if (B.vis > 0.01) { c.save(); c.globalAlpha = B.vis; e_lamp(c, B.x, B.y, LAMP_S, B.lit); c.restore(); }
    e_lamp(c, A.x, A.y, LAMP_S, A.lit);
    e_battery3d(c, BAT_L, BOT, 120, 22, '3.0V', false);
    if (mid > 0.01) {
      c.save(); c.globalAlpha = mid;
      e_ball(c, L, MIDB, 8, NODE_COL, false);
      e_ball(c, R, MIDB, 8, NODE_COL, false);
      c.restore();
    }

    /* 4 文字 */
    if (trans) { pv_labels(c, from, 1 - a, picked); pv_caption(c, from, 1 - a); }
    pv_labels(c, step, a, picked);
    pv_caption(c, step, a);
    pv_header(c);

    let before = 0; for (let i = 1; i < step; i++) before += DUR[i];
    pv_progress(c, (before + Math.min(stepT, DUR[step])) / TOTAL);
    e_noglow(c);
    c.globalAlpha = 1;
  }

  function pv_frame(ts) {
    if (!pv_visible()) { animFrames['tab3v'] = null; lastTs = null; return; }
    let dt = lastTs === null ? 0 : (ts - lastTs) / 1000;
    lastTs = ts;
    dt = Math.max(0, Math.min(0.05, dt));
    tv += dt * V_E;
    stepT += dt;
    if (stepT >= DUR[step]) { from = step; step = step % 5 + 1; stepT = 0; }
    pv_buttons();
    pv_draw();
    animFrames['tab3v'] = requestAnimationFrame(pv_frame);
  }

  function pv_start() {
    cvs = document.getElementById('cvs-t3v');
    if (!cvs) return;
    ctx = cvs.getContext('2d');
    cancelAnimationFrame(animFrames['tab3v']);
    lastTs = null;
    if (!pv_visible()) return;
    pv_buttons();
    pv_draw();
    animFrames['tab3v'] = requestAnimationFrame(pv_frame);
  }

  /* 一進子分頁：從第 1 步自動播放 */
  window.initParVolt = function () {
    step = 1; from = 1; stepT = 0; shownBtn = 0;
    if (tv === 0) tv = 40 * D;          /* 一開始線上就已經排滿電子 */
    pv_start();
  };

  /* 步驟鈕：跳到該步開頭並接著播（平順轉場） */
  window.parVoltGo = function (n) {
    n = Math.max(1, Math.min(5, n | 0));
    from = step; step = n; stepT = 0;     /* 同一步重按：from === step，直接從頭、不做轉場 */
    pv_buttons();
    pv_start();
  };

  /* 瀏覽器分頁被藏起來會停；回來時接著播（不從頭） */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && typeof currentTab !== 'undefined' && currentTab === 'tab3') {
      const v = document.getElementById('view-t3-par');
      if (v && getComputedStyle(v).display !== 'none') pv_start();
    }
  });
})();
