/* ==================================================================
   electronics_1「感應起電」分頁：為什麼帶電體能吸引不帶電的黑板？（極化）
   畫布 #cvs-tab3b（960×460）。頁面提供 tr、LANG、e_* 繪圖函式、animFrames、currentTab。
   介面：initPolarize()（可重複呼叫，從第 1 步重播）、polarizeGo(n)（n=1..5，跳到第 n 步接著播）。
   迴圈只有一條：id 存 animFrames['tab3b']；離開分頁或 document.hidden 就停，回來重啟。
   時間用「每幀累加、單幀最多 50ms」計算：老師模式暫停、背景分頁回來都不會跳格。
   第一輪用負棒、第二輪換正棒（結論相同），之後交替。
   ================================================================== */
(function () {
  'use strict';

  const W = 960, H = 460;
  const C_NEG = '#4dd2ff', C_POS = '#ff8040', C_NET = '#ffe066', C_TXT = '#f6f3ea', C_DIM = '#a3b8b0';
  const BG = '#0d201a';

  /* 版面（全部以畫布中線附近排開） */
  const CY = 262;                          // 黑板中心高度＝帶電棒高度
  const BW = 220, BH = 156;                // 黑板外框（含木框）
  const BX0 = 540;                         // 黑板靜止時左緣
  const BEAM_Y = 100;                      // 吊架橫桿
  const STR_L = CY - BH / 2 - BEAM_Y;      // 吊線長（84）
  const PIV_IN = 34;                       // 吊點離黑板左右緣的距離
  const ROD_LEN = 170, ROD_TH = 40;
  const ROD_X_FAR = 20, ROD_X_NEAR = 230;  // 棒子左端：遠處 → 靠近（棒尖 190 → 400）
  const THETA_MAX = 0.5;                   // 被吸過去的擺角（約 48px 位移，仍留間隙）
  const SHIFT_MAX = 6;                     // 電子雲最多偏移 6px（不離開自己的原子）
  const ROW_NET = CY + BH / 2 + 38;        // 合力箭頭那一列
  const ROW_B = 412, ROW_C = 448;          // 下方兩列文字

  /* 每一步的長度（ms）；第 5 步最後停留幾秒再重播 */
  const DUR = [4500, 6500, 6500, 6500, 9000];
  const TOTAL = DUR.reduce((a, b) => a + b, 0);

  const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* 4 欄 × 3 列的原子（相對黑板左上角），各自有電子的相位 */
  const ATOMS = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    ATOMS.push({ dx: 38 + c * 48, dy: 36 + r * 42,
                 ph: (r * 4 + c) * 1.7, sp: 0.0024 + ((r * 4 + c) % 5) * 0.00035 });
  }

  const S = { step: 1, t: 0, round: 0, last: null, ctx: null, cvs: null, texts: [], shapes: [] };
  let visHooked = false;

  /* ---------- 狀態（只由 step、t 決定，跳步驟時畫面與真的播到那裡一致） ---------- */
  function state() {
    const s = S.step, t = S.t;
    const st = { rodT: 0, p: 0, theta: 0, aLong: 0, aShort: 0, aNet: 0, aForceTxt: 0, lbl: 0, note: 0 };
    if (s === 1) {
      st.lbl = ease((t - 600) / 500);
    } else if (s === 2) {
      st.rodT = ease(t / 3000);
      st.p = ease((t - 400) / 3000);
      st.lbl = ease((t - 3500) / 500);
    } else if (s === 3) {
      st.rodT = 1; st.p = 1;
      st.aLong = ease(t / 1200);
      st.aShort = ease((t - 1300) / 900);
      st.aNet = ease((t - 2700) / 900);
    } else if (s === 4) {
      st.rodT = 1; st.p = 1;
      const k = 1 - ease(t / 400);
      st.aLong = k; st.aShort = k;
      st.aNet = 1;
      const sw = ease((t - 400) / 2400);
      const wob = t > 2800 ? 0.035 * Math.sin((t - 2800) / 420) * Math.exp(-(t - 2800) / 2500) : 0;
      st.theta = THETA_MAX * sw + wob;
      st.lbl = ease((t - 2400) / 500);
      st.note = ease((t - 3000) / 500);
    } else {
      const back = 1 - ease(t / 2500);
      st.rodT = back; st.p = back;
      st.theta = THETA_MAX * back;
      st.aNet = 1 - ease(t / 400);
      st.lbl = ease((t - 2600) / 500);
    }
    return st;
  }

  /* ---------- 文字：一律 ≥22px；記錄外框給自我檢查用 ---------- */
  const FONT = sz => `bold ${sz}px "Noto Sans TC", "JetBrains Mono"`;
  function wOf(s, sz) { const c = S.ctx; c.font = FONT(sz); return c.measureText(s).width; }
  function text(s, x, y, color, sz, align, plate, alpha) {
    const c = S.ctx;
    if (alpha !== undefined && alpha <= 0.01) return;
    c.save();
    if (alpha !== undefined) c.globalAlpha = alpha;
    if (plate) e_plate(c, s, x, y, sz, align);
    e_txt(c, s, x, y, color, sz, align);
    c.restore();
    const w = wOf(s, sz);
    const lx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    S.texts.push({ s, x: lx, y: y - sz * 0.88, w, h: sz * 1.12, size: sz });
  }
  /* 太寬就換行（只用在右側窄欄）：英文以單字、中文以字為單位，貪婪排行 */
  function textWrap(s, cx, y, color, sz, maxW, alpha) {
    const units = /\s/.test(s) ? s.split(/\s+/) : Array.from(s);
    const sep = /\s/.test(s) ? ' ' : '';
    const lines = []; let cur = '';
    units.forEach(u => {
      const tryS = cur ? cur + sep + u : u;
      if (cur && wOf(tryS, sz) > maxW) { lines.push(cur); cur = u; } else cur = tryS;
    });
    if (cur) lines.push(cur);
    lines.forEach((ln, i) => text(ln, cx, y + i * sz * 1.32, color, sz, 'center', true, alpha));
  }
  /* 置中在 cx，但整行不出畫布 */
  function textFit(s, cx, y, color, sz, alpha) {
    const w = wOf(s, sz);
    const x = clamp(cx, 24 + w / 2, W - 24 - w / 2);
    text(s, x, y, color, sz, 'center', true, alpha);
  }
  function shape(x, y, w, h, name) { S.shapes.push({ x, y, w, h, name }); }

  /* ---------- 小零件 ---------- */
  function plusSign(x, y, r, color, lw) { e_ln(S.ctx, x - r, y, x + r, y, color, lw); e_ln(S.ctx, x, y - r, x, y + r, color, lw); }
  function minusSign(x, y, r, color, lw) { e_ln(S.ctx, x - r, y, x + r, y, color, lw); }

  function drawBackground() {
    const c = S.ctx;
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
  }

  function drawProgress() {
    const c = S.ctx;
    let done = 0; for (let i = 0; i < S.step - 1; i++) done += DUR[i];
    const f = clamp((done + S.t) / TOTAL, 0, 1);
    c.fillStyle = 'rgba(246,243,234,0.12)'; c.fillRect(0, 0, W, 6);
    c.fillStyle = 'rgba(255,224,102,0.85)'; c.fillRect(0, 0, W * f, 6);
    let acc = 0;
    c.fillStyle = 'rgba(13,32,26,0.9)';
    for (let i = 0; i < DUR.length - 1; i++) { acc += DUR[i]; c.fillRect(W * acc / TOTAL - 1, 0, 2, 6); }
  }

  /* 吊架＋絕緣細線（線跟著擺角轉，黑板保持水平：平行四邊形吊法） */
  function drawHanger(bx, by) {
    const c = S.ctx;
    const p1 = BX0 + PIV_IN, p2 = BX0 + BW - PIV_IN;
    /* 橫桿 */
    const g = c.createLinearGradient(0, BEAM_Y - 6, 0, BEAM_Y + 6);
    g.addColorStop(0, '#8a6c4e'); g.addColorStop(1, '#4a3a2c');
    c.fillStyle = g; e_rr(c, BX0 - 10, BEAM_Y - 6, BW + 20, 12, 5); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.5; e_rr(c, BX0 - 10, BEAM_Y - 6, BW + 20, 12, 5); c.stroke();
    shape(BX0 - 10, BEAM_Y - 6, BW + 20, 12, 'beam');
    /* 細線 */
    e_ln(c, p1, BEAM_Y, bx + PIV_IN, by, 'rgba(232,226,206,0.85)', 2);
    e_ln(c, p2, BEAM_Y, bx + BW - PIV_IN, by, 'rgba(232,226,206,0.85)', 2);
    [p1, p2].forEach(px => { c.fillStyle = '#d8d0b8'; c.beginPath(); c.arc(px, BEAM_Y + 4, 3.5, 0, Math.PI * 2); c.fill(); });
    shape(Math.min(p1, bx + PIV_IN) - 2, BEAM_Y, Math.abs(p1 - bx - PIV_IN) + 4, by - BEAM_Y, 'string1');
    shape(Math.min(p2, bx + BW - PIV_IN) - 2, BEAM_Y, Math.abs(p2 - bx - BW + PIV_IN) + 4, by - BEAM_Y, 'string2');
  }

  /* 小塊黑板：木框＋深綠板面＋粉筆槽 */
  function drawBoard(bx, by) {
    const c = S.ctx;
    const wood = c.createLinearGradient(bx, by, bx, by + BH);
    wood.addColorStop(0, '#9a7650'); wood.addColorStop(0.5, '#7a5a3c'); wood.addColorStop(1, '#5a4129');
    c.fillStyle = wood; e_rr(c, bx, by, BW, BH, 8); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.45)'; c.lineWidth = 2; e_rr(c, bx, by, BW, BH, 8); c.stroke();
    const face = c.createLinearGradient(bx, by, bx + BW, by + BH);
    face.addColorStop(0, '#2a5e49'); face.addColorStop(1, '#1f4a3a');
    c.fillStyle = face; e_rr(c, bx + 10, by + 10, BW - 20, BH - 20, 4); c.fill();
    /* 一點點粉筆擦過的痕跡 */
    c.fillStyle = 'rgba(246,243,234,0.05)';
    c.beginPath(); c.ellipse(bx + BW * 0.62, by + BH * 0.32, 60, 16, -0.15, 0, Math.PI * 2); c.fill();
    /* 粉筆槽＋一小截粉筆 */
    c.fillStyle = '#6b4f35'; e_rr(c, bx - 6, by + BH - 2, BW + 12, 12, 4); c.fill();
    c.strokeStyle = 'rgba(246,243,234,0.35)'; c.lineWidth = 1.5; e_rr(c, bx - 6, by + BH - 2, BW + 12, 12, 4); c.stroke();
    c.fillStyle = '#f2ecd9'; e_rr(c, bx + BW - 58, by + BH - 7, 26, 7, 3); c.fill();
    shape(bx - 6, by, BW + 12, BH + 10, 'board');
  }

  /* 絕緣體裡的原子：橘色原子核不動；淡藍電子雲＋一顆束縛電子，整圈只偏一點點 */
  function drawAtoms(bx, by, p, dir) {
    const c = S.ctx;
    const sh = SHIFT_MAX * p * dir;
    ATOMS.forEach(a => {
      const nx = bx + a.dx, ny = by + a.dy;
      const ex0 = nx + sh;
      /* 電子雲 */
      c.fillStyle = 'rgba(77,210,255,0.20)';
      c.beginPath(); c.ellipse(ex0, ny, 17, 14, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(77,210,255,0.60)'; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(ex0, ny, 17, 14, 0, 0, Math.PI * 2); c.stroke();
      /* 原子核（不動） */
      e_ball(c, nx, ny, 8.5, C_POS, false);
      plusSign(nx, ny, 4, '#11261f', 2.4);
      /* 束縛電子：繞著（偏移後的）中心轉 */
      const ex = ex0 + 13 * Math.cos(a.ph), ey = ny + 11 * Math.sin(a.ph);
      e_ball(c, ex, ey, 6, C_NEG, false);
      minusSign(ex, ey, 3.2, '#11261f', 2.2);
    });
  }

  /* 黑板兩緣的感應電荷標記（局部分離） */
  function drawEdgeMarks(bx, by, p, rod) {
    if (p <= 0.02) return;
    const c = S.ctx;
    const nearPos = rod < 0;                       // 負棒：近端露出＋；正棒：近端聚集−
    const cNear = nearPos ? C_POS : C_NEG, cFar = nearPos ? C_NEG : C_POS;
    c.save(); c.globalAlpha = p;
    const xs = [bx - 14, bx + BW + 14];
    [0, 1].forEach(side => {
      const isNear = side === 0;
      const col = e_lighten(isNear ? cNear : cFar, 0.18);
      const pos = isNear ? nearPos : !nearPos;
      e_glow(c, isNear ? cNear : cFar, 10);
      for (let r = 0; r < 3; r++) {
        const y = by + 36 + r * 42;
        if (pos) plusSign(xs[side], y, 7, col, 3.5); else minusSign(xs[side], y, 7, col, 3.5);
      }
      e_noglow(c);
      shape(xs[side] - 8, by + 28, 16, 100, 'marks');
    });
    c.restore();
  }

  function drawRod(rodX, rod) {
    const c = S.ctx;
    e_chargedRod(c, rodX, CY, ROD_LEN, ROD_TH, rod, 5);
    shape(rodX, CY - ROD_TH / 2, ROD_LEN, ROD_TH, 'rod');
    text(rod < 0 ? tr('負帶電棒', 'Negative rod') : tr('正帶電棒', 'Positive rod'),
         rodX + ROD_LEN / 2, CY - ROD_TH / 2 - 14, rod < 0 ? C_NEG : C_POS, 22, 'center', true);
  }

  /* 步驟三：兩支受力箭頭（長短＝定性示意） */
  function drawForces(bx, by, st, rod) {
    const c = S.ctx;
    const nearPos = rod < 0;
    const cNear = nearPos ? C_POS : C_NEG, cFar = nearPos ? C_NEG : C_POS;
    const y = CY + 42;
    if (st.aLong > 0.01) {
      const x1 = bx - 28, x2 = ROD_X_NEAR + ROD_LEN + 20;
      const xe = x1 + (x2 - x1) * st.aLong;
      c.save(); c.globalAlpha = Math.min(1, st.aLong * 1.5);
      e_glow(c, cNear, 10); e_arrow(c, x1, y, xe, y, cNear, 6, 18); e_noglow(c);
      c.restore();
      shape(Math.min(x1, xe), y - 9, Math.abs(x1 - xe), 18, 'arrowLong');
      const s = tr('近：吸引力大', 'Near: strong pull');
      const w = wOf(s, 22);
      const cx = Math.min((x1 + x2) / 2, bx - 26 - w / 2);
      text(s, cx, y + 36, cNear, 22, 'center', true, st.aLong);
    }
    if (st.aShort > 0.01) {
      const x1 = bx + BW + 28, x2 = x1 + 42;
      const xe = x1 + (x2 - x1) * st.aShort;
      c.save(); c.globalAlpha = Math.min(1, st.aShort * 1.5);
      e_glow(c, cFar, 8); e_arrow(c, x1, y, xe, y, cFar, 5, 15); e_noglow(c);
      c.restore();
      shape(x1, y - 8, xe - x1, 16, 'arrowShort');
      const right0 = bx + BW + 12;
      textWrap(tr('遠：排斥力小', 'Far: weak push'), (right0 + W - 8) / 2, y + 36, cFar, 22, W - 8 - right0 - 8, st.aShort);
    }
  }

  /* 合力箭頭（黃）：在黑板正下方，指向棒子 */
  function drawNet(bx, a) {
    if (a <= 0.01) return;
    const c = S.ctx;
    const cx = bx + BW / 2, y = ROW_NET;
    c.save(); c.globalAlpha = a;
    e_glow(c, C_NET, 12); e_arrow(c, cx + 70, y, cx - 70, y, C_NET, 6, 18); e_noglow(c);
    c.restore();
    shape(cx - 70, y - 9, 140, 18, 'arrowNet');
    text(tr('合力：吸引', 'Net: attraction'), cx - 84, y + 8, C_NET, 22, 'right', true, a);
  }

  /* 圖例：橘＋＝原子核、藍−＝束縛電子 */
  function drawLegend(a) {
    if (a <= 0.01) return;
    const c = S.ctx;
    const s1 = tr('原子核', 'Nucleus'), s2 = tr('束縛電子', 'Bound electron');
    const w1 = wOf(s1, 22), w2 = wOf(s2, 22);
    const total = 22 + 8 + w1 + 40 + 22 + 8 + w2;
    let x = W / 2 - total / 2;
    const y = ROW_C;
    c.save(); c.globalAlpha = a;
    e_ball(c, x + 11, y - 8, 9, C_POS, false); plusSign(x + 11, y - 8, 4, '#11261f', 2.4);
    c.restore();
    shape(x, y - 19, 22, 22, 'legend');
    text(s1, x + 30, y, C_POS, 22, 'left', false, a);
    x += 30 + w1 + 40;
    c.save(); c.globalAlpha = a;
    e_ball(c, x + 11, y - 8, 7, C_NEG, false); minusSign(x + 11, y - 8, 3.5, '#11261f', 2.2);
    c.restore();
    shape(x, y - 19, 22, 22, 'legend');
    text(s2, x + 30, y, C_NEG, 22, 'left', false, a);
  }

  function caption(rod) {
    const neg = rod < 0;
    const CAP = [
      tr('中性的黑板：正負電荷一樣多', 'A neutral board: equal + and − charges'),
      neg ? tr('負電棒靠近：電子被推開一點點', 'Negative rod nears: electrons pushed back a little')
          : tr('正電棒靠近：電子被拉近一點點', 'Positive rod nears: electrons pulled in a little'),
      tr('近端吸引大，遠端排斥小', 'Near side pulled hard, far side pushed weakly'),
      tr('合力是吸引：黑板被吸過去', 'Net force attracts: the board swings to the rod'),
      tr('拿開帶電棒：電荷回到原位', 'Rod removed: the charges go back to place'),
    ];
    text(CAP[S.step - 1], W / 2, 42, C_TXT, 24, 'center', false);
  }

  /* ---------- 一幀 ---------- */
  function draw() {
    const c = S.ctx; if (!c) return;
    S.texts = []; S.shapes = [];
    const st = state();
    const rod = S.round % 2 === 0 ? -1 : 1;
    const dir = rod < 0 ? 1 : -1;                  // 負棒把電子推離棒子（往右）；正棒拉近（往左）

    c.save();
    e_pen(c);
    drawBackground();
    drawProgress();
    caption(rod);

    /* 黑板名稱、細線說明（固定） */
    text(tr('黑板（示意：小塊）', 'Blackboard (small piece, schematic)'), BX0 + BW / 2, BEAM_Y - 18, C_DIM, 22, 'center', false);
    textWrap(tr('絕緣細線', 'Insulating thread'), (BX0 + BW + 12 + W - 8) / 2, BEAM_Y + 40, C_DIM, 22, W - 8 - (BX0 + BW + 12) - 8);

    /* 擺角 → 黑板位置（平行吊線，板面保持水平） */
    const bx = BX0 - STR_L * Math.sin(st.theta);
    const by = CY - BH / 2 - STR_L * (1 - Math.cos(st.theta));

    drawHanger(bx, by);
    drawBoard(bx, by);
    drawAtoms(bx, by, st.p, dir);
    drawEdgeMarks(bx, by, st.p, rod);

    const rodX = ROD_X_FAR + (ROD_X_NEAR - ROD_X_FAR) * st.rodT;
    drawRod(rodX, rod);

    drawForces(bx, by, st, rod);
    drawNet(bx, st.aNet);

    /* 下方說明列 */
    const cxB = BX0 + BW / 2;
    if (S.step === 1) textFit(tr('正負電荷一樣多，合計為零', 'Equal + and −: the total is zero'), cxB, ROW_B, C_TXT, 22, st.lbl);
    if (S.step === 2) textFit(tr('只是局部分離：電子沒有跑出黑板', 'Only a local shift: no electron leaves the board'), cxB, ROW_B, C_TXT, 22, st.lbl);
    if (S.step === 4) {
      textFit(tr('合計：0（仍然是中性）', 'Total: 0 (still neutral)'), cxB, ROW_B, C_TXT, 22, st.lbl);
      textFit(tr('吸力很小，所以只吸得動輕的東西（粉筆灰、紙屑）', 'The pull is tiny, so only light things move (chalk dust, paper bits)'),
              W / 2, ROW_C, C_DIM, 22, st.note);
    }
    if (S.step === 5) textFit(tr('電荷回到原位，黑板還是中性', 'Charges back in place: the board is still neutral'), cxB, ROW_B, C_TXT, 22, st.lbl);
    if (S.step !== 4) drawLegend(1);

    c.restore();
  }

  function syncButtons() {
    for (let i = 1; i <= 5; i++) {
      const b = document.getElementById('btn-pol-' + i);
      if (b) b.classList.toggle('active', i === S.step);
    }
  }

  function advance(dt) {
    ATOMS.forEach(a => { a.ph += a.sp * dt; });   // 束縛電子繞自己的原子核轉（跳步驟不重置）
    S.t += dt;
    while (S.t >= DUR[S.step - 1]) {
      S.t -= DUR[S.step - 1];
      if (S.step === 5) { S.step = 1; S.round++; } else S.step++;
      syncButtons();
    }
  }

  function loop(ts) {
    if (currentTab !== 'tab3' || document.hidden) { S.last = null; return; }
    if (S.last === null) S.last = ts;
    const dt = clamp(ts - S.last, 0, 50);
    S.last = ts;
    advance(dt);
    draw();
    animFrames['tab3b'] = requestAnimationFrame(loop);
  }

  function start() {
    if (animFrames['tab3b']) cancelAnimationFrame(animFrames['tab3b']);
    S.last = null;
    if (currentTab !== 'tab3' || document.hidden) return;
    animFrames['tab3b'] = requestAnimationFrame(loop);
  }

  window.initPolarize = function () {
    S.cvs = document.getElementById('cvs-tab3b');
    if (!S.cvs) return;
    S.ctx = S.cvs.getContext('2d');
    S.step = 1; S.t = 0; S.round = 0;
    syncButtons();
    draw();
    start();
    if (!visHooked) {
      visHooked = true;
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentTab === 'tab3' && S.ctx) start();
      });
    }
  };

  /* 第 2、3 個參數只給檢查程式用：步驟內的毫秒、第幾輪（偶數＝負棒、奇數＝正棒） */
  window.polarizeGo = function (n, offsetMs, round) {
    if (!S.ctx) { window.initPolarize(); if (!S.ctx) return; }
    if (round !== undefined) S.round = Math.max(0, round | 0);
    S.step = clamp(Math.round(n) || 1, 1, 5);
    S.t = clamp(offsetMs || 0, 0, DUR[S.step - 1] - 1);
    syncButtons();
    draw();
    start();
  };

  /* 自我檢查用：最近一幀的文字與圖形外框（不影響畫面） */
  window.polarizeDebug = function () {
    return { step: S.step, t: S.t, round: S.round, texts: S.texts.slice(), shapes: S.shapes.slice() };
  };
})();
