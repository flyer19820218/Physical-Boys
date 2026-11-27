/* ==================================================================
   mechanics_5 ｜ 資優補充：同體積比浮力：A、B、C、D（cvs-vol，960×540）
   四步：1 四個物體 → 2 找出泡在水裡的部分 → 3 比較 V排開 → 4 排出大小
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／caption／block（自訂材質色）、M4.L／T／P／withA／fin／fout／grow、M4.tank（寬水槽＋水面）、M5.wetBox（ice 建立）。

   數字（照簡報）：四個方塊體積都是 100 cm³，在同一杯清水（D＝1）：
     A 浮著、水下 40 cm³；B 浮著、水下 70 cm³（上面 30 cm³ 露出水面）；C 懸在水中、全沒入 100 cm³；D 沉在杯底、全沒入 100 cm³。
     浮力 B ＝ V排 × D液：A＝40 gw、B＝70 gw、C＝100 gw、D＝100 gw → B_C ＝ B_D ＞ B_B ＞ B_A。
     D 雖然沉底、C 雖然不浮，都完全泡在水裡，浮力一樣是 100 gw。
   比例尺：方塊邊長 84 px ＝ 100 cm³（剖面，水下深度 ∝ 體積：0.84 px ＝ 1 cm³ → A 水下 33.6 px、B 58.8 px）；
     條狀圖 1 gw ＝ 1.8 px（100 gw ＝ 180 px，第 3、4 步同一比例；條寬第 3 步 30 px、第 4 步 56 px）。
   物理畫法：方塊依序落水，水面跟著上升（上升量 ＝ 方塊寬 × 浸入深度 ÷ 槽寬，四塊全放進去共升約 25 px，停好時水面 y＝210）；
     A、B 落水後阻尼上下晃，停在平衡浸入深度；C 入水後被水的阻力減速、停在水中（懸浮）；D 一路沉到槽底。
   第 1 步（11 s）：四塊 u 0.3 起依序出現在槽上方（橘 A、粉 B、綠 C、灰 D），A u 0.8、B 1.8、C 2.8、D 3.8 落水；
     「體積都是 100 cm³」u 6.6（y 108）；狀態小字「浮／浮／懸浮／沉底」u 7.2；字卡 u 8.4。停在：A、B 浮、C 懸在中間、D 在槽底。
   第 2 步（11.5 s）：狀態字淡出；標題列改成「水面以下的部分 → 亮藍色」u 0.4；A u 1.0、B 2.0、C 3.0、D 4.0 起，水面以下由下往上塗亮藍（0.9 s），
     每塊右邊（D 靠右牆，標在左邊）出現「40／70／100／100 cm³」；u 6.4「C、D 全部泡在水裡」；字卡 u 8.0。停在：四塊水下部分亮藍＋四個體積。
   第 3 步（11.5 s）：體積 pill 淡出；標題列「B ＝ V排 × D液（D液 ＝ 1）」u 0.3；每塊右邊一根條由槽底往上長（A u 1.0、B 1.9、C 2.8、D 3.8，各 0.9～1.1 s），
     條頂「40／70／100／100 gw」；右上「條高 ∝ 浮力」u 1.0；字卡 u 8.2。停在：四根條。
   第 4 步（12 s）：水槽與方塊變淡（u 0～0.8）；條頂數字先淡出，四根條 u 0.8～3.0 由原位滑到排名位置（C、D、B、A，由大到小）並變寬；
     數字再出現 u 3.0；C、D 條頂畫黃色等高虛線＋「＝」u 3.4；標題列「B_C ＝ B_D ＞ B_B ＞ B_A」u 3.8；
     「C 懸浮、D 沉底：都全部泡在水裡 → 浮力一樣大」u 5.0（y 168）；字卡 u 8.4。停在：排名條狀圖＋不等式。
   版面：水槽內壁 x 40～920、槽口 y 128、內底 455、水面 210（放方塊前 234.9）；方塊中線 x 150／360／570／780、邊長 84；
     A 頂 y 159.6、B 頂 184.8、C 頂 270（水面下 60 px）、D 頂 371；方塊懸在 y 92（頂）。
     第 3 步條：x ＝ 方塊中線 ＋ 50～80、底在 455；條頂數字置中在條上。第 4 步條中線 x 300／420／540／660。
     標題 KEY_Y 62、第二行 y 108、字卡 BOT_Y 505。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M4.tank || !M5.wetBox) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow;
  const SUB = '#38c8ff';                                      /* 水面以下的亮藍 */
  const DUR = [11, 11.5, 11.5, 12];                           /* 總長 46 秒 */

  /* ── 版面 ── */
  const TK = { x0: 40, x1: 920, top: 128, bot: 455 }, WT = TK.x1 - TK.x0;
  const S = 84, PX = S / 100;                                 /* 邊長 ＝ 100 cm³；px / cm³ */
  const LV = 210;                                             /* 四塊都停好時的水面 */
  const HANG = 92;
  const KB = 1.8;                                             /* 條狀圖 px/gw */
  const BAR_W3 = 30, BAR_W4 = 56;
  const RANK_X = [300, 420, 540, 660];
  const OBJ = [
    { id: 'A', x: 150, v: 40, col: COL.orange, lo: '#fdba74', hi: '#c2410c', t0: 0.8, kind: 'float' },
    { id: 'B', x: 360, v: 70, col: COL.pink, lo: '#f9a8d4', hi: '#be185d', t0: 1.8, kind: 'float' },
    { id: 'C', x: 570, v: 100, col: COL.green, lo: '#7ee2bf', hi: '#178a64', t0: 2.8, kind: 'mid' },
    { id: 'D', x: 780, v: 100, col: '#9aa5ad', lo: '#c9d1d6', hi: '#5f6b72', t0: 3.8, kind: 'sink' }
  ];
  const RANK = [2, 3, 1, 0];                                  /* 由大到小：C、D、B、A（OBJ 的索引） */
  const C_REL = 60;                                           /* C 停在水面下 60 px（頂面） */
  const D_REL = TK.bot - S - LV;                              /* D 頂面在水面下 161 px（＝貼槽底） */
  const LV0 = LV + OBJ.reduce((s, o) => s + o.v * PX, 0) * S / WT;   /* 放方塊前的水面 */

  /* ── 物理小函式 ── */
  function bob(tau, D) {                                      /* 落水後的阻尼晃動（入水 150 px/s，示意） */
    if (tau <= 0) return 0;
    const g = 2.2, w = 5, Bc = (150 - D * g) / w, e = Math.exp(-g * tau);
    return Math.max(0, Math.min(S - 4, D * (1 - e * Math.cos(w * tau)) + Bc * e * Math.sin(w * tau)));
  }
  /* 第 1 步 u 秒：每塊「頂面相對水面」rel（null＝還懸在上方，落下中給 fallQ） */
  function rels(s) {
    const u = s.n === 1 ? s.u : 99;
    return OBJ.map(o => {
      if (u < o.t0) return { hang: true, q: 0 };
      if (u < o.t0 + 0.4) return { hang: true, q: ((u - o.t0) / 0.4) ** 2 };
      const tau = u - o.t0 - 0.4;
      if (o.kind === 'float') return { rel: bob(tau, o.v * PX) - S };
      if (o.kind === 'mid') return { rel: -S + (S + C_REL) * (1 - Math.exp(-1.7 * tau)) * (1 + 0.05 * Math.exp(-1.2 * tau) * Math.sin(4 * tau)) };
      return { rel: -S + (S + D_REL) * ease(clamp01(tau / 2.3)) };
    });
  }
  /* 方塊位置與水面 → { level, tops[] } */
  function layout(s) {
    const R = rels(s);
    const d = R.map(r => (r.hang ? 0 : clamp01((r.rel + S) / S) * S));
    const level = LV0 - d.reduce((a, b) => a + b, 0) * S / WT;
    const tops = R.map((r, i) => {
      if (r.hang) { const contact = level - S; return lerp(HANG, contact, r.q); }
      return Math.min(TK.bot - S, level + r.rel);
    });
    return { level, tops };
  }

  /* ═══════════ 畫法 ═══════════ */
  function block(c, o, top, a) {
    M3.block(c, o.x, top + S, S, S, { a, mat: { fill: [o.lo, o.hi], edge: '#ffffff', tex: 'none', ink: 'rgba(0,0,0,0.3)' }, shadow: false });
  }
  /* 水面以下塗亮藍：g 0..1 由下往上 */
  function subFill(c, o, top, level, g, t, a) {
    const bot = top + S, y0 = Math.max(top, level), h = (bot - y0) * clamp01(g);
    if (h < 0.5 || a <= 0.02) return;
    withA(c, a, () => {
      c.save();
      W5.rr(c, o.x - S / 2, top, S, S, 6); c.clip();
      const gr = c.createLinearGradient(0, bot - h, 0, bot);
      gr.addColorStop(0, W5.rgba(SUB, 0.92)); gr.addColorStop(1, W5.rgba('#1d8fe0', 0.92));
      c.fillStyle = gr; c.fillRect(o.x - S / 2, bot - h, S, h);
      c.strokeStyle = '#e8f8ff'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(o.x - S / 2, bot - h); c.lineTo(o.x + S / 2, bot - h); c.stroke();
      c.restore();
      c.save(); c.strokeStyle = W5.rgba('#e8f8ff', 0.6 + 0.3 * Math.sin(t * 3)); c.lineWidth = 2;
      W5.rr(c, o.x - S / 2, top, S, S, 6); c.stroke(); c.restore();
    });
  }
  /* 一根條：中線 x、底 455、寬 w、值 v（g 長出比例） */
  function bar(c, o, x, w, g, a, glow) {
    const h = o.v * KB * clamp01(g); if (h < 0.5 || a <= 0.02) return;
    const y = TK.bot - h;
    withA(c, a, () => {
      c.save();
      if (glow) { c.shadowColor = o.col; c.shadowBlur = 16 * glow; }
      const gr = c.createLinearGradient(0, y, 0, TK.bot); gr.addColorStop(0, o.lo); gr.addColorStop(1, o.hi);
      c.fillStyle = gr; W5.rr(c, x - w / 2, y, w, h, 5); c.fill();
      c.shadowBlur = 0; c.strokeStyle = 'rgba(246,243,234,0.9)'; c.lineWidth = 2; c.stroke();
      c.restore();
    });
  }
  /* 帶下標的一列式子（主字 28px、下標 22px），外面一個 pill 框 */
  function subEq(c, a, parts, cx, y, col) {
    if (a <= 0.02) return;
    const ws = parts.map(p => (Array.isArray(p) ? W5.tw(c, p[0], 28, true) + W5.tw(c, p[1], 22, true) + 2 : W5.tw(c, p, 28, true)));
    const gap = 10, tot = ws.reduce((s, w) => s + w, 0) + gap * (parts.length - 1), h = 48, x0 = cx - tot / 2 - 18;
    withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, x0, y - h / 2, tot + 36, h, h / 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 2.5; c.stroke(); c.restore();
    });
    W5.glow(c, cx, y, tot * 0.6, col, 0.12 * a);
    let x = cx - tot / 2;
    parts.forEach((p, i) => {
      if (Array.isArray(p)) {
        const w0 = W5.tw(c, p[0], 28, true);
        T(c, a, p[0], x, y - 2, col, 28, 'left', true);
        T(c, a, p[1], x + w0 + 2, y + 8, col, 22, 'left', true);
      } else T(c, a, p, x, y, col, 28, 'left', true);
      x += ws[i] + gap;
    });
  }

  /* ═══════════ 場景：水槽＋方塊 ═══════════ */
  function scene(c, s) {
    const t = s.t, ly = layout(s), dim = s.n === 4 ? lerp(1, 0.22, fin(s, 4, 0, 0.8)) : 1;
    /* 先畫水槽，再畫方塊＋泡水部分的淡淡水色（M5.wetBox；淡一點，方塊原色才認得出來） */
    M4.tank(c, { x0: TK.x0, x1: TK.x1, bot: TK.bot, top: TK.top, level: ly.level, wall: 6, t, wob: 1.4, a: dim });
    OBJ.forEach((o, i) => {
      const a = dim * (s.n === 1 ? fin(s, 1, 0.3 + 0.25 * i, 0.4) : 1);
      block(c, o, ly.tops[i], a);
      M5.wetBox(c, o.x - S / 2, o.x + S / 2, ly.tops[i], ly.tops[i] + S, ly.level, { t, a, fillA: 0.22 });
    });
    /* 第 2 步起：水面以下塗亮藍 */
    OBJ.forEach((o, i) => {
      const g = s.n === 2 ? grow(s, 2, 1.0 + i, 1.9 + i) : s.n > 2 ? 1 : 0;
      subFill(c, o, ly.tops[i], ly.level, g, t, dim * (s.n === 3 ? 1 - 0.35 * fin(s, 3, 0.6, 0.6) : 1));
    });
    /* 字母 */
    OBJ.forEach((o, i) => P(c, (s.n === 4 ? fout(s, 4, 0, 0.6) : 1) * (s.n === 1 ? fin(s, 1, 0.5 + 0.25 * i, 0.4) : 1), o.id, o.x, ly.tops[i] + S / 2, WHITE, 24, 'center'));
    return ly;
  }

  /* 第 1 步：狀態小字 */
  function step1(c, s, ly) {
    const k = fout(s, 2, 0, 0.4);
    const a = fin(s, 1, 7.2, 0.5) * k;
    const tags = [L('浮', 'Floats'), L('浮', 'Floats'), L('懸浮', 'Suspended'), L('沉底', 'On the bottom')];
    OBJ.forEach((o, i) => T(c, a, tags[i], o.x, ly.tops[i] - 20, DIM, 22, 'center'));
    P(c, fin(s, 1, 6.6, 0.5) * k, L('體積都是 100 cm³', 'All have the same volume: 100 cm³'), 480, M3.Q_Y, WHITE, 24, 'center');
  }
  /* 第 2 步：體積 pill */
  function step2(c, s, ly) {
    if (s.n !== 2 && s.n !== 3) return;
    const k = fout(s, 3, 0, 0.4);
    P(c, fin(s, 2, 0.4, 0.5) * k, L('水面以下的部分 → 亮藍色', 'Part below the surface → bright blue'), 480, M3.Q_Y, SUB, 24, 'center');
    OBJ.forEach((o, i) => {
      const a = fin(s, 2, 1.7 + i, 0.4) * k, y0 = Math.max(ly.tops[i], ly.level);
      const right = i < 3;                                     /* D 靠右牆：標在左邊 */
      P(c, a, o.v + ' cm³', o.x + (right ? 1 : -1) * (S / 2 + 8), (y0 + ly.tops[i] + S) / 2, SUB, 22, right ? 'left' : 'right', true);
    });
    const ca = fin(s, 2, 6.4, 0.5) * k;
    T(c, ca, L('C、D：全部泡在水裡', 'C and D: completely under water'), 675, 175, WHITE, 22, 'center');
  }
  /* 第 3、4 步：條狀圖 */
  function bars(c, s) {
    if (s.n < 3) return;
    const t = s.t;
    if (s.n === 3) {
      P(c, fin(s, 3, 0.3, 0.5), L('B ＝ V排 × D液（D液 ＝ 1）', 'B = V(disp.) × D(liquid), D(liquid) = 1'), 480, M3.Q_Y, WHITE, 24, 'center', true);
      T(c, fin(s, 3, 1.0, 0.5), L('條高 ∝ 浮力', 'Bar height ∝ B'), 912, 158, DIM, 22, 'right');
    }
    const T3 = [1.0, 1.9, 2.8, 3.8];
    OBJ.forEach((o, i) => {
      const x3 = o.x + 65, ri = RANK.indexOf(i), x4 = RANK_X[ri];
      let x = x3, w = BAR_W3, la = 1, g = 1, glow = 0;
      if (s.n === 3) { g = grow(s, 3, T3[i], T3[i] + 0.6 + 0.004 * o.v); la = fin(s, 3, T3[i] + 0.9, 0.4); glow = 0.4 + 0.3 * Math.sin(t * 3 + i); }
      else {
        const q = ease(clamp01((s.u - 0.8 - 0.25 * ri) / 1.5));
        x = lerp(x3, x4, q); w = lerp(BAR_W3, BAR_W4, q);
        la = fout(s, 4, 0, 0.4) + fin(s, 4, 3.0, 0.5);
        glow = 0.3 + 0.3 * Math.sin(t * 3 + i);
      }
      bar(c, o, x, w, g, 1, glow);
      const top = TK.bot - o.v * KB * g;
      if (g > 0.3) T(c, clamp01((g - 0.3) / 0.3), o.id, x, TK.bot - 20, WHITE, 22, 'center');
      P(c, la, o.v + ' gw', x, top - 22, o.col, 22, 'center', true);
    });
    if (s.n !== 4) return;
    /* C、D 等高虛線＋「＝」 */
    const ea = fin(s, 4, 3.4, 0.5), yTop = TK.bot - 100 * KB;
    withA(c, ea, () => {
      c.save(); c.strokeStyle = YEL; c.lineWidth = 3; c.setLineDash([9, 6]); c.lineDashOffset = -t * 12;
      c.beginPath(); c.moveTo(RANK_X[0] - BAR_W4 / 2 - 14, yTop); c.lineTo(RANK_X[1] + BAR_W4 / 2 + 14, yTop); c.stroke(); c.restore();
    });
    P(c, ea, '＝', (RANK_X[0] + RANK_X[1]) / 2, yTop + 34, YEL, 24, 'center', true);
    P(c, ea, '＞', (RANK_X[1] + RANK_X[2]) / 2, TK.bot - 30, YEL, 24, 'center', true);
    P(c, ea, '＞', (RANK_X[2] + RANK_X[3]) / 2, TK.bot - 30, YEL, 24, 'center', true);
    subEq(c, fin(s, 4, 3.8, 0.5), [['B', 'C'], '＝', ['B', 'D'], '＞', ['B', 'B'], '＞', ['B', 'A']], 480, M3.Q_Y, YEL);
    P(c, fin(s, 4, 5.0, 0.5), L('C 懸浮、D 沉底：都全部泡在水裡 → 浮力一樣大', 'C hangs, D sits on the bottom: both fully under → same B'), 480, 168, WHITE, 22, 'center');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('四個體積相同的物體', 'Four objects, equal volume'),
    () => L('找出泡在水裡的部分', 'Find the part under water'),
    () => L('比較 V排開 → 浮力', 'Compare V(disp.) → buoyancy'),
    () => L('排出浮力大小', 'Rank the buoyancies')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.4, 0.6) * fout(s, 2, 0, 0.4), L('同體積：A、B 浮，C 懸在水中，D 沉到杯底', 'Same volume: A, B float, C hangs, D sinks'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('泡在水裡：40、70、100、100 cm³', 'Under water: 40, 70, 100, 100 cm³'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 8.2, 0.6) * fout(s, 4, 0, 0.4), L('B ＝ V排 × 1：40、70、100、100 gw', 'B = V(disp.) × 1: 40, 70, 100, 100 gw'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 8.4, 0.6), L('同一種液體：只看泡在水裡的體積', 'Same liquid: only the volume under water counts'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: 540, cell: 40, glow: '#c084fc' });
    const ly = scene(c, s);
    step1(c, s, ly);
    step2(c, s, ly);
    bars(c, s);
    texts(c, s);
  }

  W5.register('vol', { canvas: 'cvs-vol', steps: DUR, draw });
})();
