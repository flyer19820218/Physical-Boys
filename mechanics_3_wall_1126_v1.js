/* ==================================================================
   mechanics_3 ｜ 資優補充：夾在牆間的木塊（cvs-wall，960×540）
   四步：1 雙木塊：整體 2W → 2 木塊之間：0 → 3 三木塊：整體 3W → 4 中間的木塊
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   版面（同一個場景從頭延續到尾）：
   ・左右兩面磚牆（M3.wall，厚 56，從 y＝100 立到地面 GY＝455），把並排的直立木塊（120×180，頂 170、底 350）夾在半空中。
   ・雙木塊：木塊中線 420、540，牆面在 360、600。第 2 步「拆開看」：兩塊往外分開 40 px（牆跟著），放大鏡看中間接觸面。
     第 3 步：縫合起來 → 牆往外退到 300、660，兩塊往外挪，第三塊從上方落進中間。
   ・力全部直接畫在場景裡：
       重力（粉 ↓）從每塊中心（y＝260）往下；牆面摩擦力（珊瑚 ↑）貼在木塊靠牆那一面內側、從 y＝300 往上；
       牆壓著（綠 →／←，不標數字、長度固定）從牆裡推到木塊外側面（y＝330）；
       第 4 步中間木塊：左右接觸面各一支 0.5W 向上（珊瑚），鄰居那一側畫反作用力 0.5W 向下（標「0.5W（反）」）。
   ・木塊上方：整體虛線框＋大括號「總重 2W／3W」（y＝152）；第 2 步換成「左右對稱」；第 4 步換成等式列。
   比例尺：W ＝ 80 px，整支不變；背景方格 1 格＝40 px＝0.5W（格線對齊木塊中心）；力箭頭每 0.5W 一道刻痕。
   數字（照簡報）：每塊重 W；雙木塊總重 2W → 牆各 W、木塊之間 0；三木塊總重 3W → 牆各 1.5W；中間木塊左右各 0.5W，0.5W ＋ 0.5W ＝ W。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.brace || !M3.eqRow) return;

  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow;
  const FR = M3.FC.friction, GRAV = M3.FC.gravity, NORM = M3.FC.normal;
  const DUR = [11, 11, 12, 12];      /* 總長 46 秒 */

  const K = 80, CELL = 40, TICK = 0.5;   /* W ＝ 80 px；1 格＝0.5W */
  const GY = M3.GY;
  const BW = 120, BH = 180, BTOP = 170, BBOT = BTOP + BH, CY = BTOP + BH / 2;   /* 木塊；CY＝260 */
  const WALL_W = 56, WALL_TOP = 100;
  const FR_Y = 300;                  /* 牆面摩擦力的起點高度 */
  const N_Y = 330, N_LEN = 48;       /* 牆壓著：高度、箭頭長（不代表數值） */
  const BRACE_Y = 152;
  const GAP = 40;                    /* 第 2 步拆開的縫 */
  const LENS = { x: 480, y: 290, r: 56 };
  const ROW = 125;                   /* 第 4 步等式列 */

  /* 數字格式：0.5W、W、1.5W、2W */
  const wTxt = v => (v === 1 ? 'W' : (Math.round(v * 10) / 10) + 'W');

  M3.preload(['thinking', 'victory']);

  /* ── 場景幾何（純函式）：牆面 x、各木塊中線與上下位移、透明度 ── */
  function geo(s) {
    const n = s.n, u = s.u;
    if (n === 1) {
      const m = ease(seg(u, 0.3, 1.5));
      return { wl: 360 - 90 * (1 - m), wr: 600 + 90 * (1 - m), wa: fin(s, 1, 0.2, 0.6),
        blocks: [{ cx: 420, dy: 0, a: 1, seed: 3 }, { cx: 540, dy: 0, a: 1, seed: 8 }] };
    }
    if (n === 2) {
      const g = GAP * ease(seg(u, 0.6, 1.8));
      return { wl: 360 - g / 2, wr: 600 + g / 2, wa: 1, gap: g,
        blocks: [{ cx: 420 - g / 2, dy: 0, a: 1, seed: 3 }, { cx: 540 + g / 2, dy: 0, a: 1, seed: 8 }] };
    }
    if (n === 3) {
      const g = GAP * (1 - ease(seg(u, 0.4, 1.4))), e = ease(seg(u, 1.4, 2.8)), d = seg(u, 2.6, 3.5);
      /* 落下：先加速、最後一點點回彈 */
      const drop = d < 1 ? -128 * (1 - d * d) : 0, bounce = -6 * Math.sin(seg(u, 3.5, 3.9) * Math.PI);
      return { wl: lerp(360 - g / 2, 300, e), wr: lerp(600 + g / 2, 660, e), wa: 1,
        blocks: [{ cx: lerp(420 - g / 2, 360, e), dy: 0, a: 1, seed: 3 }, { cx: 480, dy: drop + bounce, a: fin(s, 3, 2.5, 0.4), seed: 5 },
                 { cx: lerp(540 + g / 2, 600, e), dy: 0, a: 1, seed: 8 }] };
    }
    return { wl: 300, wr: 660, wa: 1,
      blocks: [{ cx: 360, dy: 0, a: 1, seed: 3 }, { cx: 480, dy: 0, a: 1, seed: 5 }, { cx: 600, dy: 0, a: 1, seed: 8 }] };
  }

  function backdrop(c) {
    M3.backdrop(c, { gy: GY, cell: CELL, ox: 480, oy: CY, glow: COL.teal, gx: 480, gyGlow: 250 });
    M3.ground(c, GY);
  }

  /* 比例尺圖例（本檔自己畫：數字寫成 0.5W） */
  function legend(c, a) {
    withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.25)'; c.fillRect(40, M3.KEY_Y - 8, CELL, 16);
      c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(40, M3.KEY_Y - 8, CELL, 16);
    });
    T(c, a, L('1 格 ＝ 0.5W', '1 box = 0.5W'), 40 + CELL + 10, M3.KEY_Y, DIM, 20, 'left');
  }

  /* 一條發光的接觸面（垂直）：x、y0..y1 */
  function faceGlow(c, x, y0, y1, col, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      W5.glow(c, x, (y0 + y1) / 2, (y1 - y0) * 0.5, col, 0.16);
      c.save(); c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(x, y0 + 10); c.lineTo(x, y1 - 10); c.stroke(); c.restore();
    });
  }

  /* 木塊中心點 */
  function dot(c, x, y, a) {
    withA(c, a, () => {
      c.fillStyle = M3.INK; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = WHITE; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    });
  }

  /* ═══════════ 場景：牆＋木塊 ═══════════ */
  function scene(c, s, g, o) {
    withA(c, g.wa * o.wallA, () => {
      M3.wall(c, g.wl, WALL_TOP, GY, 'left', { w: WALL_W });
      M3.wall(c, g.wr, WALL_TOP, GY, 'right', { w: WALL_W });
    });
    /* 木塊懸空：地上淡淡的影子 */
    g.blocks.forEach((b, i) => {
      const ba = b.a * (o.blockA ? o.blockA[i] : 1);
      withA(c, ba * 0.35, () => { c.fillStyle = M3.INK; c.beginPath(); c.ellipse(b.cx, GY + 3, BW * 0.42, 5, 0, 0, Math.PI * 2); c.fill(); });
      if (o.glow && o.glow[i] > 0.02) W5.glow(c, b.cx, CY + b.dy, 120, YEL, 0.16 * o.glow[i]);
      M3.block(c, b.cx, BBOT + b.dy, BW, BH, { mat: 'lightwood', seed: b.seed, shadow: false, a: ba });
    });
  }

  /* ═══════════ 力 ═══════════ */
  /* 每塊的重力。a 每塊的透明度陣列、gr 長出、la 標籤 */
  function weights(c, g, gr, aArr, la) {
    g.blocks.forEach((b, i) => {
      const a = b.a * (aArr[i] == null ? 1 : aArr[i]);
      if (a <= 0.02 || gr <= 0.005) return;
      dot(c, b.cx, CY + b.dy, a * clamp01(gr * 4));
      M3.force(c, { x: b.cx, y: CY + b.dy, dir: 'down', val: 1, k: K, tick: TICK, col: GRAV, grow: gr, a,
        la: la * clamp01((gr - 0.85) / 0.15), text: 'W', lab: 'tip' });
    });
  }

  /* 牆的摩擦力（左右兩支）＋接觸面亮線。v 數值（W 的倍數）、gr 長出、la 標籤、hi 接觸面亮度 */
  function wallFriction(c, g, v, gr, a, la, hi) {
    if (a <= 0.02) return;
    faceGlow(c, g.wl, BTOP, BBOT, FR, a * hi);
    faceGlow(c, g.wr, BTOP, BBOT, FR, a * hi);
    if (gr <= 0.005) return;
    const txt = L('牆面支撐 ', 'Wall holds ') + wTxt(v);
    const lab = la * clamp01((gr - 0.85) / 0.15);
    const xl = g.wl + 14, xr = g.wr - 14;
    M3.force(c, { x: xl, y: FR_Y, dir: 'up', val: v, k: K, tick: TICK, col: FR, grow: gr, a, la: lab, text: txt, lab: 'left',
      dx: (g.wl - WALL_W - 14) - (xl - 14) });
    M3.force(c, { x: xr, y: FR_Y, dir: 'up', val: v, k: K, tick: TICK, col: FR, grow: gr, a, la: lab, text: txt, lab: 'right',
      dx: (g.wr + WALL_W + 14) - (xr + 14) });
  }

  /* 牆壓著（綠，水平、不標數字） */
  function wallPress(c, g, a, gr) {
    if (a <= 0.02 || gr <= 0.005) return;
    const len = N_LEN * gr;
    M3.arrowFx(c, g.wl - len, N_Y, g.wl, N_Y, NORM, a, 7, 0);
    M3.arrowFx(c, g.wr + len, N_Y, g.wr, N_Y, NORM, a, 7, 0);
    const la = a * clamp01((gr - 0.85) / 0.15), txt = L('牆壓著', 'Wall presses');
    P(c, la, txt, g.wl - WALL_W - 14, N_Y, NORM, 22, 'right');
    P(c, la, txt, g.wr + WALL_W + 14, N_Y, NORM, 22, 'left');
  }

  /* 整體：虛線框＋大括號「總重 nW」 */
  function whole(c, s, g, nB, a, gr) {
    if (a <= 0.02) return;
    const x0 = g.wl + 4, x1 = g.wr - 4;
    M3.ghostBox(c, x0, BTOP - 8, x1 - x0, BH + 16, YEL, a * 0.8, s.u * 18, 0.05);
    M3.brace(c, g.wl, BRACE_Y, g.wr, BRACE_Y, { col: GRAV, a, side: -1, depth: 14, grow: gr,
      text: L('總重 ', 'Total ') + wTxt(nB), size: 22, gapPx: 8 });
  }

  /* ═══════════ 第 2 步：放大鏡看中間接觸面 ═══════════ */
  function lens(c, s, a) {
    if (a <= 0.02) return;
    const r = LENS.r * (0.6 + 0.4 * ease(clamp01(a * 1.4)));
    M3.magnifier(c, LENS.x, LENS.y, r, { a, handle: Math.PI / 2, len: 58, inner: cc => {
      const X = LENS.x, Y = LENS.y, half = 30;
      cc.fillStyle = '#0d201a'; cc.fillRect(X - r, Y - r, 2 * r, 2 * r);
      [[X - r - 4, X - half], [X + half, X + r + 4]].forEach(([xa, xb], k) => {
        const gr = cc.createLinearGradient(xa, 0, xb, 0);
        gr.addColorStop(k ? 0 : 1, '#f4ecd8'); gr.addColorStop(k ? 1 : 0, '#d6c29a');
        cc.fillStyle = gr; cc.fillRect(xa, Y - r - 4, xb - xa, 2 * r + 8);
        /* 放大後的木紋 */
        cc.strokeStyle = 'rgba(150,108,58,0.45)'; cc.lineWidth = 2.5;
        for (let i = 0; i < 4; i++) {
          const yy = Y - r + 14 + i * 26 + W5.hash(i + k * 7) * 6;
          cc.beginPath(); cc.moveTo(xa, yy); cc.bezierCurveTo(xa + (xb - xa) * 0.3, yy - 6, xa + (xb - xa) * 0.7, yy + 6, xb, yy); cc.stroke();
        }
        /* 接觸面：淡珊瑚（沒有作用） */
        const fx = k ? xa : xb;
        cc.strokeStyle = W5.rgba(FR, 0.55); cc.lineWidth = 4; cc.beginPath(); cc.moveTo(fx, Y - r); cc.lineTo(fx, Y + r); cc.stroke();
      });
      /* 長度 0 的摩擦力：淡虛線箭頭＋劃叉 */
      const xa = fin(s, 2, 4.0, 0.5);
      M3.dashArrow(cc, X, Y + 22, X, Y - 22, FR, 0.45, 0, { lw: 4, head: 12, dash: [7, 6] });
      if (xa > 0.02) withA(cc, xa, () => {
        const h = 15 * (0.6 + 0.4 * xa);
        cc.save(); cc.lineCap = 'round';
        cc.strokeStyle = 'rgba(11,26,21,0.85)'; cc.lineWidth = 10;
        cc.beginPath(); cc.moveTo(X - h, Y - h); cc.lineTo(X + h, Y + h); cc.moveTo(X + h, Y - h); cc.lineTo(X - h, Y + h); cc.stroke();
        cc.strokeStyle = FR; cc.lineWidth = 6; cc.shadowColor = FR; cc.shadowBlur = 10;
        cc.beginPath(); cc.moveTo(X - h, Y - h); cc.lineTo(X + h, Y + h); cc.moveTo(X + h, Y - h); cc.lineTo(X - h, Y + h); cc.stroke();
        cc.restore();
      });
    } });
  }

  /* 對稱：中間一條黃色虛線鏡面 */
  function mirror(c, s, a) {
    if (a <= 0.02) return;
    withA(c, a, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([8, 7]); c.lineDashOffset = -s.u * 14;
      c.beginPath(); c.moveTo(480, BTOP - 30); c.lineTo(480, BBOT + 10); c.stroke(); c.restore();
    });
  }

  /* ═══════════ 第 4 步：中間木塊左右的 0.5W ═══════════ */
  function middleForces(c, s, gUp, gRe, laUp, laRe) {
    const xL = 420, xR = 540, y0 = 300;
    faceGlow(c, xL, BTOP, BBOT, FR, 0.9 * fin(s, 4, 1.6, 0.5));
    faceGlow(c, xR, BTOP, BBOT, FR, 0.9 * fin(s, 4, 1.6, 0.5));
    /* 鄰居給中間木塊：向上 0.5W（畫在中間木塊那一側） */
    [xL + 12, xR - 12].forEach(x => {
      if (gUp > 0.005) M3.force(c, { x, y: y0, dir: 'up', val: 0.5, k: K, tick: TICK, col: FR, grow: gUp, la: laUp, text: '0.5W', lab: 'tip' });
    });
    /* 反作用力：中間木塊給鄰居向下 0.5W（畫在鄰居那一側） */
    const txt = L('0.5W（反）', '0.5W (reaction)');
    if (gRe > 0.005) {
      M3.force(c, { x: xL - 12, y: y0 - 40, dir: 'down', val: 0.5, k: K, tick: TICK, col: FR, grow: gRe, a: 0.85, la: laRe, text: txt, lab: 'left' });
      M3.force(c, { x: xR + 12, y: y0 - 40, dir: 'down', val: 0.5, k: K, tick: TICK, col: FR, grow: gRe, a: 0.85, la: laRe, text: txt, lab: 'right' });
    }
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    const n = s.n, u = s.u;
    backdrop(c);
    const g = geo(s);
    const nB = g.blocks.length;

    /* ── 第 4 步：聚焦中間木塊（其餘淡化） ── */
    const foc = n === 4 ? fin(s, 4, 0.2, 1.0) : 0;
    const side = 1 - 0.65 * foc;
    const blockA = nB === 3 ? [side, 1, side] : [1, 1];
    scene(c, s, g, { wallA: 1 - 0.45 * foc, blockA, glow: nB === 3 ? [0, foc * (n === 4 && u > 8.2 ? 1 : 0.6), 0] : [0, 0] });

    /* ── 第 2 步：對稱鏡面（畫在力的下面） ── */
    const mA = n === 2 ? fin(s, 2, 2.6, 0.5) : n === 3 ? fout(s, 3, 0, 0.4) : 0;
    mirror(c, s, mA);
    if (n === 2) {
      faceGlow(c, 480 - g.gap / 2, BTOP, BBOT, FR, 0.5 * fin(s, 2, 1.8, 0.5));
      faceGlow(c, 480 + g.gap / 2, BTOP, BBOT, FR, 0.5 * fin(s, 2, 1.8, 0.5));
    }

    /* ── 牆壓著（綠） ── */
    const pA = n === 1 ? 1 : n === 2 ? 1 : n === 3 ? (u < 1.4 ? fout(s, 3, 0, 0.4) : fin(s, 3, 3.6, 0.5)) : 1 - 0.7 * foc;
    const pG = n === 1 ? grow(s, 1, 1.5, 2.2) : n === 3 && u >= 1.4 ? grow(s, 3, 3.6, 4.2) : 1;
    wallPress(c, g, pA, pG);

    /* ── 牆面摩擦力（珊瑚） ── */
    if (n <= 2) wallFriction(c, g, 1, grow(s, 1, 5.0, 6.4), 1, 1, n === 1 ? fin(s, 1, 4.8, 0.5) : 1);
    if (n === 3 && u < 1.4) wallFriction(c, g, 1, 1, fout(s, 3, 0, 0.4), 1, 1);
    if (n === 3 && u >= 1.4) wallFriction(c, g, 1.5, grow(s, 3, 6.6, 8.0), 1, 1, fin(s, 3, 6.4, 0.5));
    if (n === 4) wallFriction(c, g, 1.5, 1, 1 - 0.7 * foc, fout(s, 4, 0.2, 0.6), 1);

    /* ── 重力（粉） ── */
    if (n <= 2) weights(c, g, grow(s, 1, 2.4, 3.4), [1, 1], 1);
    if (n === 3 && u < 1.4) weights(c, g, 1, [fout(s, 3, 0, 0.4), 1, fout(s, 3, 0, 0.4)], 1);
    if (n === 3 && u >= 1.4) weights(c, g, grow(s, 3, 4.0, 4.8), [1, 1, 1], 1);
    if (n === 4) {
      const sa = 1 - 0.7 * foc;
      weights(c, { blocks: [g.blocks[0], g.blocks[2]] }, 1, [sa, sa], fout(s, 4, 0.2, 0.6));
      weights(c, { blocks: [g.blocks[1]] }, 1, [1], 1);
    }

    /* ── 整體：虛線框＋大括號 ── */
    if (n <= 2) whole(c, s, g, 2, n === 1 ? fin(s, 1, 3.8, 0.5) : fout(s, 2, 0.2, 0.5), grow(s, 1, 3.9, 4.6));
    if (n === 3 && u >= 1.4) whole(c, s, g, 3, fin(s, 3, 5.0, 0.5), grow(s, 3, 5.1, 5.8));
    if (n === 4) whole(c, s, g, 3, fout(s, 4, 0.2, 0.5), 1);

    /* ── 第 2 步：放大鏡、左右對稱、內部 0 ── */
    if (n === 2 || n === 3) {
      const la = n === 2 ? fin(s, 2, 3.4, 0.6) : fout(s, 3, 0, 0.4);
      lens(c, n === 2 ? s : { n: 2, u: 11 }, la);
      P(c, mA, L('左右對稱', 'Mirror image'), 480, 124, YEL, 22);
      const za = n === 2 ? fin(s, 2, 4.4, 0.5) : fout(s, 3, 0, 0.4);
      P(c, za, L('內部 0', 'Between: 0'), 480, LENS.y - LENS.r - 34, FR, 22);
    }

    /* ── 第 4 步：中間木塊左右的 0.5W、等式 ── */
    if (n === 4) {
      const gUp = grow(s, 4, 2.6, 3.6), gRe = grow(s, 4, 4.6, 5.4);
      middleForces(c, s, gUp, gRe, clamp01((gUp - 0.85) / 0.15), clamp01((gRe - 0.85) / 0.15));
      const show = Math.max(0, (u - 6.0) / 0.45);
      M3.eqRow(c, { x: 480, y: ROW, size: 24, show, tokens: [
        { t: '0.5W', col: FR }, { t: '＋', col: WHITE }, { t: '0.5W', col: FR }, { t: '＝', col: WHITE }, { t: 'W', col: GRAV, pill: true }
      ] });
    }

    /* ── 頂端主標、比例尺 ── */
    const keys = [L('雙木塊：整體 2W', 'Two blocks: 2W in all'), L('木塊之間：0', 'Between blocks: 0'),
      L('三木塊：整體 3W', 'Three blocks: 3W in all'), L('中間的木塊', 'The middle block')];
    P(c, n === 1 ? fin(s, 1, 0.2, 0.5) : fin(s, n, 0, 0.4), keys[n - 1], 480, M3.KEY_Y, WHITE, 24);
    legend(c, fin(s, 1, 0.2, 0.5));

    /* ── 底部結論 ── */
    const c1a = L('兩塊當成一個整體：總重 2W', 'Treat the two blocks as one: total weight 2W');
    const c1b = L('兩面牆平分：各撐 W', 'The two walls share it: W each');
    const c2a = L('每一塊：牆撐 W 向上 ＝ 自己重 W', 'Each block: W up from the wall = its own weight W');
    const c2b = L('左右對稱、沒有相對滑動趨勢 → 木塊之間 0', 'Symmetric, no tendency to slide: 0 between the blocks');
    const c3a = L('三塊當成一個整體：總重 3W', 'Treat the three blocks as one: total weight 3W');
    const c3b = L('兩面牆平分：各撐 1.5W', 'The two walls share it: 1.5W each');
    const c4a = L('只看中間木塊：重力 W 向下', 'Middle block alone: weight W down');
    const c4b = L('中間木塊：左右鄰居各撐 0.5W', 'Middle block: each neighbour holds 0.5W');
    if (n === 1) {
      M3.caption(c, fin(s, 1, 4.0, 0.5) * fout(s, 1, 6.6, 0.4), c1a, GRAV);
      M3.caption(c, fin(s, 1, 7.0, 0.5), c1b, FR);
    }
    if (n === 2) {
      M3.caption(c, fout(s, 2, 0, 0.4), c1b, FR);
      M3.caption(c, fin(s, 2, 1.0, 0.5) * fout(s, 2, 5.8, 0.4), c2a, WHITE);
      M3.caption(c, fin(s, 2, 6.2, 0.5), c2b, YEL);
    }
    if (n === 3) {
      M3.caption(c, fout(s, 3, 0, 0.4), c2b, YEL);
      M3.caption(c, fin(s, 3, 5.2, 0.5) * fout(s, 3, 7.8, 0.4), c3a, GRAV);
      M3.caption(c, fin(s, 3, 8.2, 0.5), c3b, FR);
    }
    if (n === 4) {
      M3.caption(c, fout(s, 4, 0, 0.4), c3b, FR);
      M3.caption(c, fin(s, 4, 1.0, 0.5) * fout(s, 4, 7.8, 0.4), c4a, WHITE);
      M3.caption(c, fin(s, 4, 8.2, 0.6), c4b, YEL, 480, M3.BOT_Y, 26);
    }

    /* ── 旁白 March：1～3 步想一想，第 4 步算出來了 ── */
    const ta = n <= 3 ? fin(s, 1, 0.6, 0.6) : fout(s, 4, 7.8, 0.4);
    M3.march(c, 'thinking', 900, 540, { sc: 0.27, a: ta });
    if (n === 4) {
      const va = fin(s, 4, 8.4, 0.5), hop = 6 * Math.abs(Math.sin(u * 4.2)) * va;
      if (va > 0.02) W5.glow(c, 900, 490, 70, YEL, 0.16 * va);
      M3.march(c, 'victory', 900, 534 - hop, { sc: 0.27, a: va, shadow: false });
    }
  }

  W5.register('wall', { canvas: 'cvs-wall', steps: DUR, draw });
})();
