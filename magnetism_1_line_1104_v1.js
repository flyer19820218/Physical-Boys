/* magnetism_1_line_1104_v1.js — 「磁力線分布」分頁動畫（#lineCanvas，1000×600）
 *
 * 契約：window.MagAnim.line = { activate(sceneId), deactivate(), relang() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、line、drawMagnet、getBField、drawSymmetricFieldLines
 * （直接呼叫，不複製、不修改）。鐵粉的取向用 getBField 算；磁力線用 drawSymmetricFieldLines
 * 錄成路徑一次（快取），播放時只做「由 N 往 S 逐步顯現」與「沿磁場方向流動的亮點」。
 * 磁力線的錄製：傳給 drawSymmetricFieldLines 一個只記錄路徑的 ctx（函式本身不改）。
 * 注意：drawSymmetricFieldLines 內部會讀頁面的 lineState.type（同名極相對時略過正對的那一條），
 * 本檔在建快取時暫時設定 lineState.type，畫完立即還原；整合時頁面需保留 lineState 這個物件。
 * 畫布不綁任何事件；唯一控制是 #steps-line 裡的步驟鈕（每場景 ≤5 個）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * line-bar 條形磁鐵與相對磁極，共 52.0 s
 *   1 撒鐵粉 6.0 s  單一條形磁鐵；鐵粉由左到右撒下，方向凌亂（現象）
 *   2 輕敲   9.0 s  敲第 1 下：鐵粉被磁化、開始轉向；敲第 2 下：完全順著磁場、頭尾串連（磁極附近最密）
 *   3 磁力線 13.0 s 鐵粉淡出，假想磁力線由 N 往 S 畫出（考試只畫線）→ 外部 N→S、內部 S→N 封閉
 *                   → 磁極附近最密＝最強、中央上方稀疏＝較弱 → 磁力線不相交
 *   4 異名極 11.0 s 兩磁鐵 S 對 N：撒鐵粉→輕敲→畫磁力線，中間的線直接連通（相吸）
 *   5 同名極 13.0 s 兩磁鐵 N 對 N：同上流程，中間的線互相排開（相斥）（含停留）
 * line-u U 形磁鐵，共 34.0 s
 *   1 撒鐵粉 6.0 s  U 形磁鐵；撒下凌亂的鐵粉
 *   2 輕敲   8.0 s  敲兩下，鐵粉順著磁場排列；兩極之間排成整齊直線
 *   3 磁力線 10.0 s 假想磁力線由 N 往 S 畫出；內部沿 U 形由 S 回到 N，形成封閉曲線
 *   4 均勻   10.0 s 兩極之間磁力線近乎平行、等距 → 均勻的強磁場（含停留）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.MagAnim = window.MagAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const GREEN = C.green, PINK = C.pink, YELLOW = C.yellow, CYAN = C.cyan;
  const CHALK = '#f2ecd9';
  const LINE_COLOR = 'rgba(85,233,255,0.82)';   // 磁力線（與本頁其他分頁一致：青色）
  const FILING = 'rgba(214,219,210,0.88)';       // 鐵粉：淺灰

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function glowRing(ctx, x, y, r, color, a, dash) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4; if (dash) ctx.setLineDash(dash);
    ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 有底色的小標籤（避免字壓在磁力線上）
  function tag(ctx, s, x, y, color, a = 1, size = 24) {
    if (a <= 0) return;
    const w = textW(ctx, s, size) + 20;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.92)'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - size * 0.75, w, size * 1.5, 8); ctx.fill(); ctx.stroke();
    label(ctx, s, x, y + 1, color, 'center', size); ctx.restore();
  }

  // ═════════ 磁場配置（磁極座標沿用舊版） ═════════
  const CY = 300, MW = 300, MH = 60, MTOP = CY - MH / 2;
  const CFG = {
    single:  { poles: [{ x: 350, y: CY, m: 60000 }, { x: 650, y: CY, m: -60000 }], n: 14, mags: [[350, true]] },
    attract: { poles: [{ x: 100, y: CY, m: 50000 }, { x: 400, y: CY, m: -50000 }, { x: 600, y: CY, m: 50000 }, { x: 900, y: CY, m: -50000 }], n: 14, mags: [[100, true], [600, true]] },
    repel:   { poles: [{ x: 100, y: CY, m: -50000 }, { x: 400, y: CY, m: 50000 }, { x: 600, y: CY, m: 50000 }, { x: 900, y: CY, m: -50000 }], n: 14, mags: [[100, false], [600, true]] },
    u:       { poles: [{ x: 620, y: 230, m: 60000 }, { x: 620, y: 370, m: -60000 }], n: 20 }
  };

  // ───────── 鐵粉（位置固定、取向用 getBField 算） ─────────
  const NF = 4200;
  const FIL = (() => {
    const r = rng(20261104), a = [];
    for (let i = 0; i < NF; i++) {
      const x = 6 + r() * (W - 12), y = 62 + r() * (H - 124);
      a.push({ x, y, a0: r() * Math.PI, ap: x / W * 0.82 + r() * 0.18, ph: r() * TAU });
    }
    return a;
  })();
  const filCache = {};
  function filField(key) {
    if (filCache[key]) return filCache[key];
    const poles = CFG[key].poles, fa = new Float32Array(NF), st = new Float32Array(NF);
    for (let i = 0; i < NF; i++) {
      const f = FIL[i], B = getBField(f.x, f.y, poles), mag = Math.hypot(B.bx, B.by);
      let ang = Math.atan2(B.by, B.bx);
      // 鐵粉沒有頭尾：取與起始角度差最小的那個方向（轉最短的路）
      let d = ang - f.a0; d -= Math.round(d / Math.PI) * Math.PI;
      fa[i] = f.a0 + d;
      st[i] = clamp((Math.log10(mag + 1e-9) + 1.3) / 1.4, 0, 1);
    }
    return (filCache[key] = { fa, st });
  }
  // fs = { sweep 撒到哪(0–1), A 對齊(0–1), chain 串連(0–1), alpha, shake }
  // 鐵粉狀態沒變（只有整體透明度在變）時，直接貼上次的點陣圖，閒置畫面不重畫 4200 根
  let filBmp = null, filSig = '';
  function drawFilings(ctx, key, fs, t) {
    if (fs.alpha <= 0.01 || fs.sweep <= 0) return;
    const sig = [key, fs.sweep.toFixed(3), fs.A.toFixed(3), fs.chain.toFixed(3), fs.shake > 0 ? t.toFixed(3) : 0].join('|');
    if (!filBmp) { filBmp = document.createElement('canvas'); filBmp.width = W; filBmp.height = H; }
    if (sig !== filSig) {
      const g = filBmp.getContext('2d'); g.clearRect(0, 0, W, H);
      paintFilings(g, key, fs, t); filSig = sig;
    }
    ctx.save(); ctx.globalAlpha = fs.alpha; ctx.drawImage(filBmp, 0, 0); ctx.restore();
  }
  function paintFilings(ctx, key, fs, t) {
    const F = filField(key);
    // 串連後依磁場強弱分三層亮度（弱處較淡、磁極附近最亮最密）
    const tiers = fs.chain > 0 ? [[0, 0.33, 1 - 0.6 * fs.chain], [0.33, 0.62, 1 - 0.3 * fs.chain], [0.62, 2, 1]] : [[0, 2, 1]];
    for (const [lo, hi, ta] of tiers) {
    ctx.save(); ctx.globalAlpha = ta; ctx.strokeStyle = FILING; ctx.lineWidth = 1.8; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let i = 0; i < NF; i++) {
      const f = FIL[i];
      if (f.ap > fs.sweep) continue;
      const s = F.st[i];
      if (s < lo || s >= hi) continue;
      const k = Math.min(1, fs.A * (0.45 + 0.75 * s));
      let a = f.a0 + (F.fa[i] - f.a0) * k;
      if (fs.shake > 0) a += Math.sin(t * 47 + f.ph) * 0.35 * fs.shake;
      const L = 3.2 + 5.2 * fs.chain * s;
      const dx = Math.cos(a) * L, dy = Math.sin(a) * L;
      ctx.moveTo(f.x - dx, f.y - dy); ctx.lineTo(f.x + dx, f.y + dy);
    }
    ctx.stroke(); ctx.restore();
    }
  }

  // ───────── 磁力線快取：把 drawSymmetricFieldLines 的輸出「錄下來」（路徑點與箭頭），播放時重畫 ─────────
  // 傳給它一個只記錄、不繪圖的 ctx；函式本身完全照頁面原樣執行。
  function recorder() {
    const paths = [], arrows = []; let cur = null, tf = [0, 0, 0], stack = [];
    const r = {
      paths, arrows, lineWidth: 1, lineCap: 'butt', strokeStyle: '', fillStyle: '',
      save() { stack.push(tf.slice()); }, restore() { if (stack.length) tf = stack.pop(); },
      beginPath() { cur = []; }, moveTo(x, y) { if (!cur) cur = []; cur.push(x, y); }, lineTo(x, y) { if (!cur) cur = []; cur.push(x, y); },
      stroke() { if (cur && cur.length >= 4 && tf[0] === 0 && tf[1] === 0 && tf[2] === 0) paths.push(cur); cur = null; },
      translate(x, y) { tf[0] += x; tf[1] += y; }, rotate(a) { tf[2] += a; },
      fill() { if (tf[0] || tf[1]) arrows.push([tf[0], tf[1], tf[2]]); cur = null; },
      setLineDash() {}, closePath() {}
    };
    return r;
  }
  const lineCache = {};
  function potentialU(poles, x, y) {
    let V = 0; for (const p of poles) V += p.m / Math.max(20, Math.hypot(x - p.x, y - p.y));
    return 0.5 - Math.atan(V / 460) / Math.PI;   // 沿磁場方向（N→S）遞增：N 附近≈0、S 附近≈1
  }
  function buildLines(key) {
    if (lineCache[key]) return lineCache[key];
    const cfg = CFG[key], rec = recorder();
    const hasLS = typeof lineState !== 'undefined' && lineState;
    const saved = hasLS ? lineState.type : null;
    const lb = document.getElementById('line-bar');
    const addAct = key === 'repel' && lb && !lb.classList.contains('active');
    try {
      if (hasLS) lineState.type = key === 'u' ? 'single' : key;
      if (addAct) lb.classList.add('active');
      drawSymmetricFieldLines(rec, cfg.poles, cfg.n, 2, LINE_COLOR, true);
    } finally {
      if (hasLS) lineState.type = saved;
      if (addAct) lb.classList.remove('active');
    }
    // 每條線：切成畫布內（含邊距）的連續段，點序一律改成「順著磁場方向」，並記下每點的 u 與累積長度
    const runs = [];
    for (const pts of rec.paths) {
      let xs = [], ys = [];
      for (let i = 0; i < pts.length; i += 2) { xs.push(pts[i]); ys.push(pts[i + 1]); }
      const B = getBField(xs[0], ys[0], cfg.poles);
      if (B.bx * (xs[1] - xs[0]) + B.by * (ys[1] - ys[0]) < 0) { xs.reverse(); ys.reverse(); }
      let run = null;
      for (let i = 0; i < xs.length; i++) {
        const inside = xs[i] > -30 && xs[i] < W + 30 && ys[i] > -30 && ys[i] < H + 30;
        if (inside) {
          if (!run) run = { x: [], y: [], u: [], s: [] };
          const n = run.x.length;
          run.s.push(n ? run.s[n - 1] + Math.hypot(xs[i] - run.x[n - 1], ys[i] - run.y[n - 1]) : 0);
          run.x.push(xs[i]); run.y.push(ys[i]); run.u.push(potentialU(cfg.poles, xs[i], ys[i]));
        } else if (run) { if (run.x.length > 1) runs.push(run); run = null; }
      }
      if (run && run.x.length > 1) runs.push(run);
    }
    const arrows = rec.arrows.map(([x, y, a]) => [x, y, a, potentialU(cfg.poles, x, y)]);
    return (lineCache[key] = { runs, arrows });
  }
  // reveal：顯現到 u 的哪裡（由 N 往 S 畫出）；pulse>0：沿磁場方向流動的亮段
  function drawLines(ctx, key, reveal, t, pulse, alpha) {
    if (reveal <= 0 || alpha <= 0) return;
    const L = buildLines(key);
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 底線
    ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 2.5; ctx.beginPath();
    const tips = [];
    for (const r of L.runs) {
      let started = false, last = -1;
      for (let i = 0; i < r.x.length; i++) {
        if (r.u[i] > reveal) { started = false; continue; }
        if (!started) { ctx.moveTo(r.x[i], r.y[i]); started = true; } else ctx.lineTo(r.x[i], r.y[i]);
        last = i;
      }
      if (reveal < 1.2 && last >= 0 && last < r.x.length - 1 && r.u[last + 1] > reveal) tips.push([r.x[last], r.y[last]]);
    }
    ctx.stroke();
    // 流動亮段（虛線的位移跟著時間走，方向＝點序＝磁場方向）
    if (pulse > 0) {
      ctx.strokeStyle = 'rgba(235,252,255,0.95)'; ctx.lineWidth = 2.8; ctx.setLineDash([14, 70]); ctx.lineDashOffset = -t * 70;
      ctx.beginPath();
      for (const r of L.runs) {
        let started = false;
        for (let i = 0; i < r.x.length; i++) {
          if (r.u[i] > reveal) { started = false; continue; }
          if (!started) { ctx.moveTo(r.x[i], r.y[i]); started = true; } else ctx.lineTo(r.x[i], r.y[i]);
        }
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // 方向箭頭（drawSymmetricFieldLines 給的位置與方向）
    ctx.fillStyle = LINE_COLOR;
    for (const [x, y, a, u] of L.arrows) {
      if (u > reveal) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(14, 0); ctx.lineTo(0, 8); ctx.fill(); ctx.restore();
    }
    // 正在畫的筆尖
    if (tips.length) {
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = CYAN; ctx.shadowBlur = 10; ctx.beginPath();
      for (const [x, y] of tips) { ctx.moveTo(x + 4, y); ctx.arc(x, y, 4, 0, TAU); }
      ctx.fill();
    }
    ctx.restore();
  }

  // ───────── 磁鐵 ─────────
  function drawBars(ctx, key) {
    CFG[key].mags.forEach(([x, nLeft]) => drawMagnet(ctx, x, MTOP, MW, MH, nLeft));
  }
  // 磁鐵內部的磁力線：由 S 指向 N（畫在磁鐵上，避開 N、S 字母）
  function drawInside(ctx, key, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    CFG[key].mags.forEach(([x, nLeft]) => {
      const dir = nLeft ? Math.PI : 0, xm = x + MW / 2;
      [MTOP + 9, MTOP + MH - 9].forEach(yy => {
        line(ctx, [[x + 14, yy], [x + MW - 14, yy]], CYAN, 3, [9, 7]);
        arrowHead(ctx, xm, yy, dir, CYAN, 10);
      });
    });
    ctx.restore();
  }
  const UM = { cx: 420, cy: 300, r: 70 };
  function drawU(ctx) {
    ctx.save(); ctx.strokeStyle = '#7d8781'; ctx.lineWidth = 60;
    ctx.beginPath(); ctx.arc(UM.cx, UM.cy, UM.r, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = '#7d8781'; ctx.fillRect(420, 200, 150, 60); ctx.fillRect(420, 340, 150, 60);
    ctx.fillStyle = C.poleN; ctx.fillRect(570, 200, 100, 60);
    ctx.fillStyle = C.poleS; ctx.fillRect(570, 340, 100, 60);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(570, 200, 100, 60); ctx.strokeRect(570, 340, 100, 60);
    ctx.restore();
    label(ctx, 'N', 620, 230, '#fff', 'center', 32);
    label(ctx, 'S', 620, 370, '#fff', 'center', 32);
  }
  function drawUInside(ctx, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(596, 370); ctx.lineTo(420, 370);
    ctx.arc(UM.cx, UM.cy, UM.r, Math.PI / 2, Math.PI * 1.5); ctx.lineTo(596, 230); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    arrowHead(ctx, 495, 370, Math.PI, CYAN, 11);            // 下臂：由 S 往左
    arrowHead(ctx, UM.cx - UM.r, UM.cy, -Math.PI / 2, CYAN, 11); // 彎處：往上
    arrowHead(ctx, 495, 230, 0, CYAN, 11);                  // 上臂：往右回到 N
    ctx.restore();
  }

  // ───────── 上方訊息列與下方圖例 ─────────
  function topMsg(ctx, s, color, a = 1) {
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, 6, W, 52); ctx.restore();
    if (!s || a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, W / 2, 33, color, 'center', 26); ctx.restore();
  }
  // items: [kind, text, alpha]
  function legend(ctx, items) {
    items = items.filter(it => it[2] > 0.02);
    const size = 22, gap = 30, gw = 46;
    const rows = [[]]; let x = 0;
    for (const it of items) {
      const w = gw + 10 + textW(ctx, it[1], size);
      if (x + w > W - 40 && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      rows[rows.length - 1].push([it, w]); x += w + gap;
    }
    const rh = 34, top = H - 12 - rows.length * rh;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, top - 8, W, H - top + 8); ctx.restore();
    rows.forEach((row, ri) => {
      const tot = row.reduce((s, [, w]) => s + w, 0) + gap * (row.length - 1);
      let xx = (W - tot) / 2; const y = top + ri * rh + rh / 2;
      for (const [[kind, txt, a], w] of row) {
        ctx.save(); ctx.globalAlpha = a;
        if (kind === 'fil') {
          ctx.strokeStyle = FILING; ctx.lineWidth = 1.7;
          for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(xx + 3 + k * 9, y + 3); ctx.lineTo(xx + 9 + k * 9, y - 3); ctx.stroke(); }
        } else if (kind === 'line') {
          ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + gw - 8, y); ctx.stroke();
          arrowHead(ctx, xx + gw - 10, y, 0, LINE_COLOR, 9);
        } else if (kind === 'in') {
          line(ctx, [[xx, y], [xx + gw - 8, y]], CYAN, 3, [9, 7]); arrowHead(ctx, xx + gw - 10, y, 0, CYAN, 9);
        } else if (kind === 'bar') {
          ctx.fillStyle = C.poleN; ctx.fillRect(xx, y - 9, gw / 2, 18); ctx.fillStyle = C.poleS; ctx.fillRect(xx + gw / 2, y - 9, gw / 2, 18);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(xx, y - 9, gw, 18);
        } else if (kind === 'u') {
          ctx.strokeStyle = '#7d8781'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(xx + gw, y - 10); ctx.lineTo(xx + 14, y - 10);
          ctx.arc(xx + 14, y, 10, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(xx + gw, y + 10); ctx.stroke();
          ctx.fillStyle = C.poleN; ctx.fillRect(xx + gw - 10, y - 14, 10, 8); ctx.fillStyle = C.poleS; ctx.fillRect(xx + gw - 10, y + 6, 10, 8);
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha = a; label(ctx, txt, xx + gw + 10, y, CHALK, 'left', size); ctx.restore();
        xx += w + gap;
      }
    });
  }

  const shakeAt = (t, t0) => (t >= t0 && t < t0 + 0.45) ? 1 - (t - t0) / 0.45 : 0;
  function shakeOff(sh, t) { return sh > 0 ? [Math.sin(t * 61) * 5 * sh, Math.cos(t * 53) * 3 * sh] : [0, 0]; }

  // ═════════ 場景 1：條形磁鐵與相對磁極 ═════════
  function barState(step, t) {
    // 回傳 { key, fs, reveal, pulse, lineA, inA, msg, mc, off, shake, extra }
    const s = { key: 'single', fs: { sweep: 0, A: 0, chain: 0, alpha: 1, shake: 0 }, reveal: 0, pulse: 0, lineA: 1, inA: 0, msg: '', mc: CHALK, shake: 0 };
    if (step === 0) {
      s.fs.sweep = seg(t, 0.8, 3.2) * 1.02;
      if (t < 0.8) { s.msg = tr('條形磁鐵：周圍的磁場看不見', 'A bar magnet: its field is invisible'); s.mc = CHALK; }
      else if (t < 3.4) { s.msg = tr('在磁鐵周圍撒上鐵粉……', 'Sprinkle iron filings around it...'); s.mc = CYAN; }
      else { s.msg = tr('鐵粉方向凌亂，還看不出形狀', 'The filings point every way: no pattern yet'); s.mc = PINK; }
    } else if (step === 1) {
      s.fs.sweep = 1.02;
      s.shake = Math.max(shakeAt(t, 0.3), shakeAt(t, 4.0));
      s.fs.A = 0.55 * easeIO(seg(t, 0.6, 2.8)) + 0.45 * easeIO(seg(t, 4.3, 6.3));
      s.fs.chain = easeIO(seg(t, 4.3, 6.5));
      s.fs.shake = s.shake;
      if (t < 3.6) { s.msg = tr('輕敲桌面：鐵粉被磁化，開始順著磁場轉向', 'Tap: the filings become tiny magnets and turn'); s.mc = CYAN; }
      else if (t < 6.8) { s.msg = tr('再敲一下：鐵粉頭尾相吸，串連成曲線', 'Tap again: they link end to end into curves'); s.mc = CYAN; }
      else { s.msg = tr('磁極附近的鐵粉最密集', 'The filings are densest near the poles'); s.mc = YELLOW; }
    } else if (step === 2) {
      s.fs = { sweep: 1.02, A: 1, chain: 1, alpha: 1 - 0.7 * easeIO(seg(t, 0.2, 2.6)) - 0.3 * easeIO(seg(t, 4.4, 5.6)), shake: 0 };
      s.reveal = lerp(0, 1.05, seg(t, 0.4, 3.4)) + (t > 3.4 ? 1 : 0);
      s.pulse = t > 3.6 ? 1 : 0;
      s.inA = easeIO(seg(t, 5.6, 6.4));
      if (t < 3.6) { s.msg = tr('照著鐵粉畫出假想的磁力線（考試只畫線，不畫鐵粉）', 'Trace imaginary field lines (exams draw lines, not filings)'); s.mc = CYAN; }
      else if (t < 5.6) { s.msg = tr('磁鐵外部：由 N 極出發，回到 S 極', 'Outside: lines leave N and return to S'); s.mc = CYAN; }
      else if (t < 8.2) { s.msg = tr('磁鐵內部：由 S 到 N，連成封閉曲線', 'Inside: from S to N, forming closed loops'); s.mc = CYAN; }
      else if (t < 10.8) { s.msg = tr('磁極附近最密：磁場最強；中央上方稀疏：較弱', 'Densest near poles = strongest; sparse above the middle = weaker'); s.mc = YELLOW; }
      else { s.msg = tr('磁力線彼此不相交', 'Field lines never cross each other'); s.mc = GREEN; }
      s.rings = { a: easeIO(seg(t, 8.2, 8.8)) * (1 - easeIO(seg(t, 10.6, 11.2))) };
    } else {
      const key = step === 3 ? 'attract' : 'repel';
      s.key = key;
      s.magA = easeIO(seg(t, 0, 0.8));
      s.fs.sweep = seg(t, 1.2, 2.8) * 1.02;
      s.shake = shakeAt(t, 3.0);
      s.fs.shake = s.shake;
      s.fs.A = easeIO(seg(t, 3.2, 4.8)); s.fs.chain = s.fs.A;
      s.fs.alpha = 1 - 0.75 * easeIO(seg(t, 5.0, 6.6)) - 0.25 * easeIO(seg(t, 7.0, 8.0));
      s.reveal = lerp(0, 1.05, seg(t, 5.0, 7.4)) + (t > 7.4 ? 1 : 0);
      s.pulse = t > 7.4 ? 1 : 0;
      s.inA = easeIO(seg(t, 7.0, 7.8));
      const att = key === 'attract';
      if (t < 1.4) { s.msg = att ? tr('兩根磁鐵：S 極對 N 極（異名極相對）', 'Two magnets: S faces N (opposite poles)') : tr('兩根磁鐵：N 極對 N 極（同名極相對）', 'Two magnets: N faces N (like poles)'); s.mc = att ? GREEN : PINK; }
      else if (t < 3.0) { s.msg = tr('撒上鐵粉……', 'Sprinkle iron filings...'); s.mc = CYAN; }
      else if (t < 5.0) { s.msg = tr('輕敲：鐵粉順著磁場排好', 'Tap: the filings line up with the field'); s.mc = CYAN; }
      else if (t < 7.8) { s.msg = tr('畫出假想磁力線', 'Draw the imaginary field lines'); s.mc = CYAN; }
      else { s.msg = att ? tr('中間的磁力線直接連通：互相吸引', 'Lines run straight across the gap: attraction') : tr('中間的磁力線互相排開：互相排斥', 'Lines push apart in the gap: repulsion'); s.mc = att ? GREEN : PINK; }
      s.mid = { a: easeIO(seg(t, 7.8, 8.4)), att };
    }
    return s;
  }

  function drawBar(ctx, step, t) {
    const s = barState(step, t);
    const [sx, sy] = shakeOff(s.shake, t);
    ctx.save(); ctx.translate(sx, sy);
    drawFilings(ctx, s.key, s.fs, t);
    drawLines(ctx, s.key, s.reveal, t, s.pulse, s.lineA);
    if (s.magA !== undefined && s.magA < 1) { ctx.save(); ctx.globalAlpha = s.magA; drawBars(ctx, s.key); ctx.restore(); }
    else drawBars(ctx, s.key);
    drawInside(ctx, s.key, s.inA);
    ctx.restore();
    if (s.rings && s.rings.a > 0) {
      const a = s.rings.a, p = 4 * Math.sin(t * 5);
      glowRing(ctx, 350, CY, 64 + p, YELLOW, a);
      glowRing(ctx, 650, CY, 64 + p, YELLOW, a);
      glowRing(ctx, 500, 172, 46 + p, PINK, a, [8, 7]);
      tag(ctx, tr('密：強', 'Dense: strong'), 350, 404, YELLOW, a);
      tag(ctx, tr('密：強', 'Dense: strong'), 650, 404, YELLOW, a);
      tag(ctx, tr('疏：弱', 'Sparse: weak'), 500, 98, PINK, a);
    }
    if (s.mid && s.mid.a > 0) {
      const col = s.mid.att ? GREEN : PINK;
      glowRing(ctx, 500, CY, 72 + 4 * Math.sin(t * 5), col, s.mid.a, s.mid.att ? null : [8, 7]);
      tag(ctx, s.mid.att ? tr('連通', 'Connected') : tr('排開', 'Pushed apart'), 500, 404, col, s.mid.a);
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [
      ['bar', tr('條形磁鐵', 'Bar magnet'), 1],
      ['fil', tr('鐵粉', 'Iron filings'), s.fs.sweep > 0 ? clamp(s.fs.alpha * 1.5, 0, 1) : 0],
      ['line', tr('磁力線（假想）', 'Field lines (imaginary)'), s.reveal > 0 ? 1 : 0],
      ['in', tr('磁鐵內部：S → N', 'Inside magnet: S → N'), s.inA]
    ]);
  }

  // ═════════ 場景 2：U 形磁鐵 ═════════
  function uState(step, t) {
    const s = { fs: { sweep: 0, A: 0, chain: 0, alpha: 1, shake: 0 }, reveal: 0, pulse: 0, inA: 0, msg: '', mc: CHALK, shake: 0, box: 0 };
    if (step === 0) {
      s.fs.sweep = seg(t, 0.8, 3.2) * 1.02;
      if (t < 0.8) { s.msg = tr('U 形磁鐵：N、S 兩極被彎到很近', 'A U-shaped magnet: N and S bent close together'); }
      else if (t < 3.4) { s.msg = tr('撒上鐵粉……', 'Sprinkle iron filings...'); s.mc = CYAN; }
      else { s.msg = tr('鐵粉方向凌亂', 'The filings point every way'); s.mc = PINK; }
    } else if (step === 1) {
      s.fs.sweep = 1.02;
      s.shake = Math.max(shakeAt(t, 0.3), shakeAt(t, 3.4));
      s.fs.shake = s.shake;
      s.fs.A = 0.55 * easeIO(seg(t, 0.6, 2.6)) + 0.45 * easeIO(seg(t, 3.7, 5.6));
      s.fs.chain = easeIO(seg(t, 3.7, 5.8));
      if (t < 3.2) { s.msg = tr('輕敲：鐵粉順著磁場轉向', 'Tap: the filings turn along the field'); s.mc = CYAN; }
      else if (t < 6.0) { s.msg = tr('再敲一下：鐵粉串連成線', 'Tap again: they link into lines'); s.mc = CYAN; }
      else { s.msg = tr('兩極之間的鐵粉排成整齊的直線', 'Between the poles they form neat straight lines'); s.mc = YELLOW; }
    } else if (step === 2) {
      s.fs = { sweep: 1.02, A: 1, chain: 1, alpha: 1 - 0.7 * easeIO(seg(t, 0.2, 2.6)) - 0.3 * easeIO(seg(t, 4.4, 5.6)), shake: 0 };
      s.reveal = lerp(0, 1.05, seg(t, 0.4, 3.4)) + (t > 3.4 ? 1 : 0);
      s.pulse = t > 3.6 ? 1 : 0;
      s.inA = easeIO(seg(t, 5.4, 6.2));
      if (t < 3.6) { s.msg = tr('照著鐵粉畫出假想的磁力線', 'Trace the imaginary field lines'); s.mc = CYAN; }
      else if (t < 5.4) { s.msg = tr('外部：由 N 極出發，回到 S 極', 'Outside: from N back to S'); s.mc = CYAN; }
      else { s.msg = tr('內部沿著 U 形由 S 回到 N：封閉曲線', 'Inside, along the U from S to N: closed loops'); s.mc = CYAN; }
    } else {
      s.fs.alpha = 0; s.reveal = 2; s.pulse = 1; s.inA = 1;
      s.box = easeIO(seg(t, 0.4, 1.2));
      if (t < 4.5) { s.msg = tr('兩極之間：磁力線近乎平行、間隔相等', 'Between the poles: lines nearly parallel, evenly spaced'); s.mc = YELLOW; }
      else { s.msg = tr('→ 兩極之間是均勻的強磁場', '→ a uniform, strong field between the poles'); s.mc = GREEN; }
    }
    return s;
  }

  function drawUScene(ctx, step, t) {
    const s = uState(step, t);
    const [sx, sy] = shakeOff(s.shake, t);
    ctx.save(); ctx.translate(sx, sy);
    drawFilings(ctx, 'u', s.fs, t);
    drawLines(ctx, 'u', s.reveal, t, s.pulse, 1);
    drawU(ctx);
    drawUInside(ctx, s.inA);
    ctx.restore();
    if (s.box > 0) {
      const p = 0.75 + 0.25 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha = s.box * p; ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.setLineDash([10, 7]);
      ctx.shadowColor = YELLOW; ctx.shadowBlur = 14; ctx.strokeRect(566, 262, 108, 76); ctx.restore();
      tag(ctx, tr('均勻磁場', 'Uniform field'), 800, 300, YELLOW, s.box);
      ctx.save(); ctx.globalAlpha = s.box; line(ctx, [[678, 300], [800 - textW(ctx, tr('均勻磁場', 'Uniform field'), 24) / 2 - 14, 300]], YELLOW, 3); ctx.restore();
    }
    topMsg(ctx, s.msg, s.mc);
    legend(ctx, [
      ['u', tr('U 形磁鐵', 'U-shaped magnet'), 1],
      ['fil', tr('鐵粉', 'Iron filings'), s.fs.sweep > 0 ? clamp(s.fs.alpha * 1.5, 0, 1) : 0],
      ['line', tr('磁力線（假想）', 'Field lines (imaginary)'), s.reveal > 0 ? 1 : 0],
      ['in', tr('磁鐵內部：S → N', 'Inside magnet: S → N'), s.inA]
    ]);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'line-bar': {
      draw: drawBar, keys: ['single', 'attract', 'repel'],
      steps: [
        { d: 6.0, b: ['撒鐵粉', 'Sprinkle'],
          cap: ['磁場看不見。在條形磁鐵周圍撒上<strong class="accent-cyan">鐵粉</strong>，一開始鐵粉方向凌亂。',
                'A magnetic field is invisible. Sprinkle <strong class="accent-cyan">iron filings</strong> around a bar magnet: at first they point every which way.'] },
        { d: 9.0, b: ['輕敲', 'Tap'],
          cap: ['輕敲桌面：鐵粉被磁化成小磁針，<strong class="accent-orange">順著磁場方向轉動</strong>；再敲一下，頭尾相吸<strong class="accent-cyan">串連成一條條曲線</strong>，磁極附近最密。',
                'Tap the table: each filing becomes a tiny magnet and <strong class="accent-orange">turns along the field</strong>. Tap again and they <strong class="accent-cyan">link into curves</strong>, densest near the poles.'] },
        { d: 13.0, b: ['磁力線', 'Lines'],
          cap: ['照鐵粉畫出<strong class="accent-cyan">假想的磁力線</strong>（考試只畫線）：外部由 <strong class="accent-red">N 極</strong>出發回到 <strong class="accent-blue">S 極</strong>，內部由 S 到 N，形成<strong class="accent-green">封閉曲線</strong>；越密磁場越強，磁力線不相交。',
                'Trace <strong class="accent-cyan">imaginary field lines</strong> (exams draw only lines): outside from <strong class="accent-red">N</strong> to <strong class="accent-blue">S</strong>, inside from S to N, forming <strong class="accent-green">closed loops</strong>. Denser = stronger; lines never cross.'] },
        { d: 11.0, b: ['異名極', 'S–N'],
          cap: ['<strong class="accent-blue">S 極</strong>對 <strong class="accent-red">N 極</strong>（異名極相對）：中間的磁力線<strong class="accent-green">直接連通</strong>，兩磁鐵互相吸引。',
                '<strong class="accent-blue">S</strong> facing <strong class="accent-red">N</strong> (opposite poles): the lines <strong class="accent-green">run straight across</strong> the gap, and the magnets attract.'] },
        { d: 13.0, b: ['同名極', 'N–N'],
          cap: ['<strong class="accent-red">N 極</strong>對 <strong class="accent-red">N 極</strong>（同名極相對）：中間的磁力線<strong class="accent-pink">互相排開</strong>、不相連，兩磁鐵互相排斥。',
                '<strong class="accent-red">N</strong> facing <strong class="accent-red">N</strong> (like poles): the lines <strong class="accent-pink">push away</strong> from each other in the gap, and the magnets repel.'] }
      ]
    },
    'line-u': {
      draw: drawUScene, keys: ['u'],
      steps: [
        { d: 6.0, b: ['撒鐵粉', 'Sprinkle'],
          cap: ['U 形磁鐵把 <strong class="accent-red">N 極</strong>和 <strong class="accent-blue">S 極</strong>彎到很近。在周圍撒上<strong class="accent-cyan">鐵粉</strong>。',
                'A U-shaped magnet bends its <strong class="accent-red">N</strong> and <strong class="accent-blue">S</strong> poles close together. Sprinkle <strong class="accent-cyan">iron filings</strong> around it.'] },
        { d: 8.0, b: ['輕敲', 'Tap'],
          cap: ['輕敲兩下：鐵粉<strong class="accent-orange">順著磁場排列</strong>，兩極之間排成整齊的直線。',
                'Tap twice: the filings <strong class="accent-orange">line up with the field</strong>, forming neat straight lines between the poles.'] },
        { d: 10.0, b: ['磁力線', 'Lines'],
          cap: ['畫出<strong class="accent-cyan">假想的磁力線</strong>：外部由 <strong class="accent-red">N 極</strong>出發回到 <strong class="accent-blue">S 極</strong>，內部沿 U 形由 S 回到 N，形成<strong class="accent-green">封閉曲線</strong>。',
                'Draw the <strong class="accent-cyan">imaginary field lines</strong>: outside from <strong class="accent-red">N</strong> to <strong class="accent-blue">S</strong>, inside along the U from S back to N — <strong class="accent-green">closed loops</strong>.'] },
        { d: 10.0, b: ['均勻', 'Uniform'],
          cap: ['兩極之間的磁力線<strong class="accent-cyan">近乎平行、間隔相等</strong>，代表那裡是<strong class="accent-yellow">均勻的強磁場</strong>。',
                'Between the poles the lines are <strong class="accent-cyan">nearly parallel and evenly spaced</strong>: a <strong class="accent-yellow">uniform, strong field</strong>.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };

  function canvasCtx() { const c = document.getElementById('lineCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = YELLOW; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t);
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i]);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('lineResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-line');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-line'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => { S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; render(); start(); });
      row.appendChild(b);
    });
  }

  function visible() { const c = document.getElementById('lineCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) S.t = 0;
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (S.scene) start();
  });

  MagAnim.line = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'line-bar';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0;
      SCENES[sceneId].keys.forEach(k => { buildLines(k); filField(k); });  // 切入時一次建好快取，播放中不卡頓
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-line'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 測試用：直接畫出某場景第 t 秒的畫面
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();
