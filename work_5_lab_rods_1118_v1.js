/* work_5_lab_rods_1118_v1.js — 「🔧 動手做｜自己當反應爐操作員：控制棒」實驗台（#rodsLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.rods = { activate(), deactivate(), relang(), _state() }
 * 自給自足：不依賴 W5／EmLab helper；只用頁面的全域 tr('中文','English')（沒有就顯示中文）。
 * 本檔載入時自己把實驗台 DOM（#lab-rods）附加在 #tab2 面板最後，CSS 注入 <style id="lab-rods-css">。
 *
 * 畫面：左邊一池水，裡面排著鈾-235 原子核；上方垂下 6 支控制棒（深度可調）。中子（白點）在池中飛：
 *   撞到鈾-235 → 分裂（閃光＋兩個碎片）並放出 2～3 顆新中子；撞到控制棒 → 被吸收；其他的跑掉／被水等吸收而消失。
 *   右邊是功率條、溫度條（只有「低／正常／過熱」示意刻度，不標數字）。
 * 物理（示意）：k＝平均每次分裂引發的下一代分裂數，只由控制棒深度決定（k<1 逐漸停、k=1 穩定、k>1 失控增長）。
 *   功率 P：dP/dt = (k−1)/τ·P + 小量中子源；溫度 T：被 P 加熱、被流過爐心的水帶走熱。
 *   T 衝過過熱線 → 安全系統讓控制棒自動全插（急停示意），3 秒內鎖住操作。
 *   畫面上的中子數量是「示意」：以 P 為目標微調，數量本身不代表真實數值。
 * 互動：5 檔按鈕（全拔／拔一半／正好／插深／全插）、畫布水平拖曳（向右＝插深）、
 *   鍵盤（畫布聚焦）：←／→ 拔出／插深，1～5 直接選檔，空白鍵＝射入一顆中子。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'rods', TAB = 'tab2';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const FONT = '"Noto Sans TC","JetBrains Mono",sans-serif';
  const COL = {
    bg: '#0d201a', panel: '#17332a', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', green: '#33cc99', red: '#ff4d4d', orange: '#fb923c',
    proton: '#ff8040', neutron: '#d9e2dd', water: '#5ab8e8', heat: '#ff6a3d'
  };
  const T_ = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  /* ───────── 幾何 ───────── */
  const POOL = { x: 24, y: 70, w: 636, h: 382 };              /* 水池 24..660 × 70..452 */
  const ROD_TOP = 70, ROD_MAX = 412, ROD_W = 14;
  const COLS = 7, ROWS = 4, ATOM_R = 18;
  const AX = i => 70 + i * (544 / (COLS - 1));
  const AY = [128, 208, 288, 368];
  const RODX = []; for (let i = 0; i < COLS - 1; i++) RODX.push((AX(i) + AX(i + 1)) / 2);
  const SRC = { x: AX(3), y: 428 };
  const BAR = { pX: 700, tX: 856, w: 56, y0: 120, y1: 398 };
  const T_HOT = 0.85;                                           /* 過熱線（示意） */

  /* 5 檔：深度 0（全拔）～1（全插） */
  const PRESETS = [
    { d: 0, zh: '全拔', en: 'All out' },
    { d: 0.35, zh: '拔一半', en: 'Half out' },
    { d: 0.55, zh: '正好', en: 'Just right' },
    { d: 0.8, zh: '插深', en: 'Deep' },
    { d: 1, zh: '全插', en: 'All in' }
  ];
  /* k(d)：分段線性；0.52～0.58 是「剛好 1」的平台 */
  const KPTS = [[0, 1.6], [0.35, 1.22], [0.52, 1.0], [0.58, 1.0], [0.8, 0.65], [1, 0.25]];
  function kOf(d) {
    d = clamp(d, 0, 1);
    for (let i = 1; i < KPTS.length; i++) {
      if (d <= KPTS[i][0]) { const [a, ka] = KPTS[i - 1], [b, kb] = KPTS[i]; return ka + (kb - ka) * (d - a) / (b - a); }
    }
    return KPTS[KPTS.length - 1][1];
  }
  const NU = 2.5, TAU_P = 1.8, SRC_P = 0.004;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; }

  /* ───────── 狀態 ───────── */
  const S = {
    on: false, raf: 0, last: 0, t: 0,
    d: 0.55, dTarget: 0.55, P: 0.45, T: 0.47,
    scram: null,                 /* {t: 已過秒數} */
    neutrons: [], atoms: [], marks: [], frags: [],
    srcTimer: 0, cat: '', drag: null, boxes: []
  };
  let cv = null, ctx = null, ctrl = null, resEl = null, built = false;

  function resetSim() {
    S.d = S.dTarget = 0.55; S.P = 0.45; S.T = 0.47; S.scram = null; S.t = 0;
    S.neutrons = []; S.marks = []; S.frags = []; S.srcTimer = 0;
    S.atoms = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) S.atoms.push({ x: AX(c), y: AY[r], cool: 0, targeted: false, seed: r * 7 + c });
    for (let i = 0; i < 8; i++) { const a = S.atoms[(i * 5) % S.atoms.length]; spawnNeutron(a.x, a.y); }
  }

  const tip = () => ROD_TOP + S.d * (ROD_MAX - ROD_TOP);
  const kNow = () => kOf(S.d);
  function category() {
    if (S.scram) return 'scram';
    const k = kNow();
    if (k > 1.03) return 'up';
    if (k < 0.97) return 'down';
    return 'flat';
  }

  /* 直線 (x1,y1)→(x2,y2) 會不會穿過插入中的控制棒；回傳第一個交點或 null */
  function rodHit(x1, y1, x2, y2) {
    const tp = tip(); if (tp < ROD_TOP + 4) return null;
    let best = null;
    for (const rx of RODX) {
      for (const ex of [rx - ROD_W / 2, rx + ROD_W / 2]) {
        if ((x1 - ex) * (x2 - ex) >= 0) continue;
        const f = (ex - x1) / (x2 - x1), y = y1 + (y2 - y1) * f;
        if (y >= ROD_TOP && y <= tp + 2 && (!best || f < best.f)) best = { f, x: ex, y };
      }
    }
    return best;
  }

  function spawnNeutron(x, y, fromSrc) {
    if (S.neutrons.length >= 140) return;
    const k = kNow();
    const live = S.neutrons.length;
    const target = 42 * S.P;
    const fb = Math.sqrt(clamp((target + 1) / (live + 1), 0.45, 3.2));
    const pRod = S.d > 0.02 ? clamp((1.6 - k) / NU, 0, 0.9) : 0;
    const pFis = clamp((k * fb) / NU, 0, 1 - pRod);
    const r = Math.random();
    let n = null;
    if (r < pFis) {                                               /* 去撞下一顆鈾-235 */
      const free = S.atoms.filter(a => a.cool <= 0 && !a.targeted && Math.hypot(a.x - x, a.y - y) > 30);
      const near = free.filter(a => Math.hypot(a.x - x, a.y - y) < 280);
      const cand = near.concat(free.filter(a => near.indexOf(a) < 0));      /* 近的先試，再試遠的 */
      for (let tries = 0; tries < 24 && cand.length; tries++) {
        const pickNear = near.length && tries < 10;
        const i = pickNear ? Math.floor(Math.random() * Math.min(near.length, cand.length)) : Math.floor(Math.random() * cand.length), a = cand[i];
        if (!rodHit(x, y, a.x, a.y)) { a.targeted = true; n = { x, y, tx: a.x, ty: a.y, fate: 'fis', atom: a }; break; }
        cand.splice(i, 1); if (pickNear) near.pop();
      }
    } else if (r < pFis + pRod) {                                  /* 被控制棒吸收 */
      const tp = tip();
      const rods = RODX.slice().sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
      const rx = rods[Math.random() < 0.7 ? 0 : 1];
      const ty = lerp(ROD_TOP + 10, tp - 4, Math.random());
      const ex = rx + (x < rx ? -ROD_W / 2 : ROD_W / 2);
      n = { x, y, tx: ex, ty: clamp(ty, ROD_TOP + 8, tp), fate: 'rod' };
    }
    if (!n) {                                                       /* 跑掉／被其他物質吸收 */
      const an = Math.random() * TAU, L = 90 + Math.random() * 90;
      let tx = x + Math.cos(an) * L, ty = y + Math.sin(an) * L;
      const h = rodHit(x, y, tx, ty);
      if (h) n = { x, y, tx: h.x, ty: h.y, fate: 'rod' };
      else n = { x, y, tx, ty, fate: 'esc' };
    }
    const dist = Math.hypot(n.tx - x, n.ty - y);
    n.sx = x; n.sy = y; n.age = 0; n.dur = Math.max(0.12, dist / (fromSrc ? 220 : 290)); n.trail = [];
    S.neutrons.push(n);
  }

  function fission(a) {
    a.cool = 1.6; a.targeted = false;
    const kids = Math.random() < 0.5 ? 2 : 3;
    for (let i = 0; i < kids; i++) spawnNeutron(a.x + (Math.random() - 0.5) * 6, a.y + (Math.random() - 0.5) * 6);
    const an = Math.random() * TAU;
    S.frags.push({ x: a.x, y: a.y, an, age: 0 });
  }

  /* ───────── 模擬 ───────── */
  function step(dt) {
    S.t += dt;
    /* 控制棒移動 */
    const sp = S.scram ? 2.6 : 0.9;
    if (Math.abs(S.dTarget - S.d) < sp * dt) S.d = S.dTarget; else S.d += Math.sign(S.dTarget - S.d) * sp * dt;
    const k = kNow();
    S.P = clamp(S.P + ((k - 1) / TAU_P * S.P + SRC_P) * dt, 0, 1.6);
    S.T = clamp(S.T + (0.55 * S.P - 0.7 * (S.T - 0.12)) * dt, 0, 1.05);
    /* 安全系統 */
    if (!S.scram && S.T >= T_HOT) { S.scram = { t: 0 }; S.dTarget = 1; }
    if (S.scram) { S.scram.t += dt; S.dTarget = 1; if (S.scram.t > 3 && S.T < 0.7) S.scram = null; }
    /* 中子源 */
    S.srcTimer -= dt;
    if (S.srcTimer <= 0) { S.srcTimer = 1.3; spawnNeutron(SRC.x, SRC.y - 8, true); }
    /* 中子 */
    const keep = [];
    for (const n of S.neutrons) {
      n.age += dt;
      const f = clamp(n.age / n.dur, 0, 1);
      n.x = lerp(n.sx, n.tx, f); n.y = lerp(n.sy, n.ty, f);
      n.trail.unshift({ x: n.x, y: n.y }); if (n.trail.length > 7) n.trail.pop();
      if (f < 1) { keep.push(n); continue; }
      if (n.fate === 'fis') fission(n.atom);
      else if (n.fate === 'rod') S.marks.push({ x: n.x, y: n.y, age: 0 });
    }
    S.neutrons = keep;
    for (const a of S.atoms) if (a.cool > 0) a.cool -= dt;
    S.marks = S.marks.filter(m => (m.age += dt) < 0.8);
    S.frags = S.frags.filter(f => (f.age += dt) < 1.0);
  }

  /* ───────── 繪圖小工具 ───────── */
  function font(size) { return `700 ${size}px ${FONT}`; }
  function tw(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fit(s, maxW, size, min) { min = min || 20; while (size > min && tw(s, size) > maxW) size--; return size; }
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(s, x, y, color, size, align, maxW) {
    size = maxW ? fit(s, maxW, size || 22) : (size || 22); align = align || 'center';
    ctx.save(); ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(13,32,26,0.92)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color || COL.white; ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width; ctx.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  function pill(s, x, y, color, size, align, maxW, fill) {
    size = maxW ? fit(s, maxW - 28, size || 22) : (size || 22); align = align || 'center';
    const w = tw(s, size) + 28, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    ctx.save(); ctx.fillStyle = fill || 'rgba(11,26,21,0.92)'; rr(x0, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.stroke();
    ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x0 + w / 2, y + 1);
    ctx.restore();
    S.boxes.push({ s, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2, size });
    return { x0, w, h };
  }
  function glow(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function ball(x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.08, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.32, color); g.addColorStop(1, mix(color, '#0b1a15', 0.5));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  /* 鈾-235 原子核：橘（質子）白（中子）小球堆成的團 */
  const NUC = (() => { const p = []; for (let i = 0; i < 13; i++) { const a = i * 2.39996, r = 4.2 * Math.sqrt(i); p.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, pro: i % 2 === 0 }); } return p; })();
  function nucleus(x, y, a, scale, wob) {
    ctx.save(); ctx.globalAlpha *= a;
    glow(x, y, ATOM_R * 1.7, COL.heat, 0.10 + 0.25 * clamp(S.T, 0, 1) * 0.5);
    for (let i = NUC.length - 1; i >= 0; i--) {
      const q = NUC[i];
      ball(x + q.x * scale + (wob ? Math.sin(S.t * 30 + i) * wob : 0), y + q.y * scale, 6.2 * scale, q.pro ? COL.proton : COL.neutron);
    }
    ctx.restore();
  }

  /* ───────── 主畫面 ───────── */
  function draw() {
    if (!ctx) return;
    S.boxes = [];
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    const cat = category(), k = kNow();

    /* 水池 */
    const warm = clamp((S.T - 0.3) / 0.7, 0, 1);
    ctx.save();
    const wg = ctx.createLinearGradient(0, POOL.y, 0, POOL.y + POOL.h);
    wg.addColorStop(0, mix('#123a4a', '#4a2a1c', warm * 0.7)); wg.addColorStop(1, mix('#0f2f3d', '#3a2216', warm * 0.6));
    ctx.fillStyle = wg; rr(POOL.x, POOL.y, POOL.w, POOL.h, 14); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.water, 0.7); ctx.stroke();
    /* 流動的水（左下流入、往右流過爐心） */
    ctx.save(); rr(POOL.x, POOL.y, POOL.w, POOL.h, 14); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) {
      const y = POOL.y + 24 + i * 42, off = ((S.t * 70 + i * 53) % 160);
      ctx.strokeStyle = 'rgba(90,184,232,0.18)';
      ctx.setLineDash([46, 114]); ctx.lineDashOffset = -off;
      ctx.beginPath(); ctx.moveTo(POOL.x, y); ctx.lineTo(POOL.x + POOL.w, y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore(); ctx.restore();
    /* 水流出口箭頭（右上 → 右側面板） */
    ctx.save(); ctx.strokeStyle = rgba(mix(COL.water, COL.heat, warm), 1); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(POOL.x + POOL.w - 2, 442); ctx.lineTo(670, 442); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(676, 442); ctx.lineTo(664, 434); ctx.lineTo(664, 450); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(COL.water, 1); ctx.fillStyle = rgba(COL.water, 1);
    ctx.beginPath(); ctx.moveTo(6, 440); ctx.lineTo(POOL.x + 2, 440); ctx.stroke();
    ctx.restore();

    /* 鈾-235 */
    for (const a of S.atoms) {
      if (a.cool > 0) { const reg = clamp(1 - a.cool / 1.6, 0, 1); if (reg > 0.55) nucleus(a.x, a.y, (reg - 0.55) / 0.45 * 0.9, 0.85 + 0.15 * reg, 0); }
      else nucleus(a.x, a.y, 1, 1, a.targeted ? 0.6 : 0);
    }
    /* 分裂碎片＋閃光 */
    for (const f of S.frags) {
      const p = f.age, d = 10 + 40 * p, a = 1 - p;
      glow(f.x, f.y, 40 + 30 * p, COL.yellow, 0.75 * a);
      ctx.save(); ctx.globalAlpha = a;
      ball(f.x + Math.cos(f.an) * d, f.y + Math.sin(f.an) * d, 9, COL.proton);
      ball(f.x - Math.cos(f.an) * d, f.y - Math.sin(f.an) * d, 8, COL.proton);
      ctx.restore();
    }
    /* 中子源 */
    ctx.save(); ctx.fillStyle = '#2a4a44'; ctx.strokeStyle = COL.dim; ctx.lineWidth = 2; rr(SRC.x - 14, SRC.y - 6, 28, 18, 5); ctx.fill(); ctx.stroke(); ctx.restore();
    text(T_('中子源', 'Neutron source'), SRC.x + 24, SRC.y + 3, COL.dim, 20, 'left');

    /* 控制棒 */
    const tp = tip();
    ctx.save();
    ctx.fillStyle = '#3b4744'; rr(POOL.x + 10, 56, POOL.w - 20, 12, 5); ctx.fill();
    for (const rx of RODX) {
      const x0 = rx - ROD_W / 2;
      const g = ctx.createLinearGradient(x0, 0, x0 + ROD_W, 0);
      g.addColorStop(0, '#1f2a27'); g.addColorStop(0.45, '#6b7b76'); g.addColorStop(1, '#1a2421');
      ctx.fillStyle = g; rr(x0, 60, ROD_W, Math.max(8, tp - 60), 5); ctx.fill();
      ctx.strokeStyle = S.scram ? COL.red : '#8fa39c'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
    /* 被吸收的中子 */
    for (const m of S.marks) {
      const a = 1 - m.age / 0.8;
      glow(m.x, m.y, 16, '#b8c4c0', 0.7 * a);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#9aa8a4'; ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, TAU); ctx.fill(); ctx.restore();
    }
    /* 中子 */
    for (const n of S.neutrons) {
      const a = n.fate === 'esc' ? clamp(1.2 - n.age / n.dur, 0, 1) : 1;
      ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
      for (let j = n.trail.length - 1; j >= 1; j--) {
        const f = 1 - j / n.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * f})`; ctx.lineWidth = 7 * f + 0.5;
        ctx.beginPath(); ctx.moveTo(n.trail[j].x, n.trail[j].y); ctx.lineTo(n.trail[j - 1].x, n.trail[j - 1].y); ctx.stroke();
      }
      glow(n.x, n.y, 14, '#ffffff', 0.45);
      ball(n.x, n.y, 5.5, '#f4f8f6');
      ctx.restore();
    }

    /* 頂端：下一代分裂數（示意標籤） */
    const hd = {
      up: [T_('平均每次分裂 → 下一代 多於 1 次：失控增長', 'Each fission → next generation: more than 1 → runaway'), COL.red],
      flat: [T_('平均每次分裂 → 下一代 剛好 1 次：穩定發電', 'Each fission → next generation: exactly 1 → steady power'), COL.green],
      down: [T_('平均每次分裂 → 下一代 少於 1 次：逐漸停下', 'Each fission → next generation: less than 1 → dying down'), COL.teal],
      scram: [T_('安全系統：控制棒自動全插，反應快速停下', 'Safety system: rods drop all the way in, reaction stops fast'), COL.red]
    }[cat];
    pill(hd[0], POOL.x + POOL.w / 2, 30, hd[1], 22, 'center', POOL.w + 10);

    /* 底部：控制棒狀態＋拖曳提示 */
    let pname = null; for (const p of PRESETS) if (Math.abs(p.d - S.dTarget) < 0.005) pname = T_(p.zh, p.en);
    const dPct = S.dTarget;
    const depthWord = pname || (dPct < 0.2 ? T_('很淺', 'Shallow') : dPct < 0.45 ? T_('偏淺', 'Fairly shallow') : dPct < 0.62 ? T_('中間', 'Middle') : dPct < 0.9 ? T_('偏深', 'Fairly deep') : T_('很深', 'Very deep'));
    pill(T_('控制棒：', 'Control rods: ') + depthWord, POOL.x, 482, COL.yellow, 22, 'left', 330);
    text(T_('在畫面上左右拖：向右＝插深、向左＝拔出', 'Drag sideways on the picture: right = deeper, left = pull out'), POOL.x + 4, 520, COL.dim, 20, 'left', 640);

    /* 右側面板：功率、溫度 */
    ctx.save(); ctx.fillStyle = 'rgba(23,51,42,0.85)'; rr(676, 60, 270, 470, 14); ctx.fill(); ctx.restore();
    const pcx = BAR.pX + BAR.w / 2, tcx = BAR.tX + BAR.w / 2;
    text(T_('功率', 'Power'), pcx, 90, COL.yellow, 24, 'center', 118);
    text(T_('溫度', 'Temp.'), tcx, 90, COL.orange, 24, 'center', 118);
    const bh = BAR.y1 - BAR.y0;
    function vbar(x, frac, col) {
      ctx.save(); ctx.fillStyle = COL.deep; rr(x, BAR.y0, BAR.w, bh, 10); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COL.dim; ctx.stroke();
      const h = bh * clamp(frac, 0, 1);
      if (h > 1) {
        ctx.save(); rr(x, BAR.y0, BAR.w, bh, 10); ctx.clip();
        const g = ctx.createLinearGradient(0, BAR.y1, 0, BAR.y0); g.addColorStop(0, mix(col, '#0b1a15', 0.35)); g.addColorStop(1, col);
        ctx.fillStyle = g; ctx.fillRect(x, BAR.y1 - h, BAR.w, h); ctx.restore();
        ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 4, BAR.y1 - h); ctx.lineTo(x + BAR.w - 4, BAR.y1 - h); ctx.stroke();
      }
      ctx.restore();
    }
    vbar(BAR.pX, S.P / 1.4, COL.yellow);
    const tCol = S.T >= T_HOT ? COL.red : S.T > 0.7 ? COL.orange : S.T > 0.3 ? '#f2b84b' : COL.teal;
    vbar(BAR.tX, S.T, tCol);
    /* 溫度刻度（示意，不標數字） */
    const yHot = BAR.y1 - bh * T_HOT, yNorm = BAR.y1 - bh * 0.5, yLow = BAR.y1 - bh * 0.15;
    ctx.save(); ctx.setLineDash([7, 5]); ctx.lineWidth = 3; ctx.strokeStyle = COL.red;
    ctx.beginPath(); ctx.moveTo(BAR.tX - 2, yHot); ctx.lineTo(BAR.tX + BAR.w + 8, yHot); ctx.stroke(); ctx.restore();
    text(T_('過熱', 'Too hot'), BAR.tX - 14, yHot, COL.red, 20, 'right', 86);
    text(T_('正常', 'Normal'), BAR.tX - 14, yNorm, COL.green, 20, 'right', 86);
    text(T_('低', 'Low'), BAR.tX - 14, yLow, COL.teal, 20, 'right', 86);
    /* 功率趨勢 */
    const trend = cat === 'up' ? [T_('上升 ↑', 'Rising ↑'), COL.red] : cat === 'flat' ? [T_('穩定', 'Steady'), COL.green] : [T_('下降 ↓', 'Falling ↓'), COL.teal];
    text(trend[0], pcx, 422, trend[1], 22, 'center', 120);
    text(S.T >= 0.7 ? T_('偏熱！', 'Hot!') : T_('安全', 'Safe'), tcx, 422, S.T >= 0.7 ? COL.red : COL.green, 22, 'center', 120);
    /* 水把熱帶走 */
    text(T_('水流過爐心', 'Water takes heat'), 811, 470, COL.water, 20, 'center', 256);
    text(T_('把熱帶走去產生蒸氣', 'away to make steam'), 811, 500, COL.water, 20, 'center', 256);

    /* 急停大字（前 3.5 秒） */
    if (S.scram && S.scram.t < 3.5) {
      const a = S.scram.t < 3 ? 1 : 1 - (S.scram.t - 3) / 0.5, blink = 0.75 + 0.25 * Math.sin(S.scram.t * 12);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = `rgba(120,10,10,${0.25 * blink})`; rr(POOL.x, POOL.y, POOL.w, POOL.h, 14); ctx.fill();
      pill(T_('⚠ 過熱！控制棒自動全插', '⚠ Overheating! Rods drop in automatically'), POOL.x + POOL.w / 2, 250, COL.red, 28, 'center', POOL.w - 20, 'rgba(40,6,6,0.94)');
      pill(T_('大量中子被吸收，連鎖反應停下', 'Most neutrons are absorbed; the chain reaction stops'), POOL.x + POOL.w / 2, 306, COL.white, 22, 'center', POOL.w - 20, 'rgba(40,6,6,0.94)');
      ctx.restore();
    }
  }

  /* ───────── 結果說明（HTML） ───────── */
  function updateResult(force) {
    const cat = category();
    if (!force && cat === S.cat) return;
    S.cat = cat;
    if (!resEl) return;
    const msg = {
      up: T_('控制棒插得太淺，被吸收的中子太少：平均每次分裂引發<b>多於 1 次</b>新的分裂，中子一代比一代多，功率和溫度一路往上衝。',
        'The rods are too shallow, so too few neutrons are absorbed: each fission causes <b>more than 1</b> new fission on average. Every generation has more neutrons, and power and temperature keep climbing.'),
      flat: T_('控制棒在剛好的位置：多出來的中子被控制棒吸收，平均每次分裂只引發<b>1 次</b>新的分裂，功率維持穩定，這就是穩定發電。',
        'The rods are at just the right depth: the extra neutrons are absorbed, so each fission causes just <b>1</b> new fission on average. Power stays steady: this is steady power generation.'),
      down: T_('控制棒插得很深，大部分中子被吸走：平均每次分裂引發<b>不到 1 次</b>新的分裂，連鎖反應越來越弱、逐漸停下。',
        'The rods are deep, so most neutrons are absorbed: each fission causes <b>fewer than 1</b> new fission on average. The chain reaction gets weaker and dies down.'),
      scram: T_('溫度衝過過熱線！安全系統讓控制棒<b>自動全插</b>，大量中子被吸收，連鎖反應很快停下。想再發電，要重新把控制棒拔出來。',
        'The temperature crossed the overheating line! The safety system drops the rods <b>all the way in</b>; most neutrons are absorbed and the chain reaction stops quickly. To make power again, pull the rods back out.')
    }[cat];
    resEl.innerHTML = '<div>' + msg + '</div><div class="lab-rods-fixed">' +
      T_('控制棒會<b>吸收中子</b>，插得越深，能去撞下一顆鈾-235 的中子越少。流過爐心的水把熱帶走，送去產生蒸氣發電。畫面中的數量與高低都是示意。',
        'Control rods <b>absorb neutrons</b>: the deeper they go, the fewer neutrons are left to hit the next uranium-235 nucleus. Water flowing through the core carries the heat away to make steam for electricity. All amounts and levels shown are only illustrations.') + '</div>';
  }

  /* ───────── 控制 ───────── */
  const locked = () => !!(S.scram && S.scram.t < 3);
  function setDepth(d) { if (locked()) return; S.dTarget = clamp(d, 0, 1); syncButtons(); if (!S.on) { S.d = S.dTarget; redrawStatic(); } }
  function act(key) {
    if (key.startsWith('p')) setDepth(PRESETS[+key.slice(1)].d);
    else if (key === 'inject') {
      S.P = clamp(S.P + 0.03, 0, 1.6);
      const a = S.atoms.find(x => x.cool <= 0) || S.atoms[0];
      spawnNeutron(POOL.x + 12, a.y, true);
      if (!S.on) redrawStatic();
    } else if (key === 'reset') { resetSim(); syncButtons(); updateResult(true); if (!S.on) redrawStatic(); }
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [T_('控制棒', 'Control rods'), PRESETS.map((p, i) => ['p' + i, T_(p.zh, p.en)])],
      [T_('操作', 'Actions'), [['inject', T_('射入一顆中子', 'Fire in a neutron')], ['reset', T_('重來', 'Reset')]]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, label] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = label;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
    syncButtons();
  }
  function syncButtons() {
    if (!ctrl) return;
    const lk = locked();
    ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const a = b.dataset.act;
      if (a.startsWith('p')) {
        b.classList.toggle('active', Math.abs(PRESETS[+a.slice(1)].d - S.dTarget) < 0.005);
        b.disabled = lk;
      }
    });
  }

  function onKey(e) {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') { setDepth(S.dTarget + 0.05); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { setDepth(S.dTarget - 0.05); e.preventDefault(); }
    else if (k === ' ' || k === 'Spacebar') { act('inject'); e.preventDefault(); }
    else if (/^[1-5]$/.test(k)) { act('p' + (+k - 1)); e.preventDefault(); }
  }
  function lx(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
  function onDown(e) { S.drag = { id: e.pointerId, x: lx(e), d: S.dTarget }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } cv.focus({ preventScroll: true }); }
  function onMove(e) { if (!S.drag || e.pointerId !== S.drag.id) return; setDepth(S.drag.d + (lx(e) - S.drag.x) / 500); }
  function onUp(e) { if (S.drag && e.pointerId === S.drag.id) S.drag = null; }
  function onVis() { if (!document.hidden && S.on && !S.raf) { S.last = 0; S.raf = requestAnimationFrame(frame); } }

  function frame(ts) {
    if (!S.on || document.hidden) { S.raf = 0; return; }
    const dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 0;
    S.last = ts;
    const wasLocked = locked();
    step(dt);
    if (wasLocked !== locked() || (S.scram && S.scram.t < 0.1)) syncButtons();
    updateResult(false);
    draw();
    S.raf = requestAnimationFrame(frame);
  }
  function redrawStatic() { draw(); updateResult(false); }

  /* ───────── DOM 注入 ───────── */
  const CSS = `
#lab-rods.lab-desk{max-width:1080px;margin:28px auto 12px;background:#11261f;border:2px solid #ffe066;border-radius:16px;padding:18px;box-sizing:border-box;color:#f6f3ea;font-size:22px;line-height:1.5}
#lab-rods .lab-head{font-size:26px;font-weight:700;color:#ffe066;margin:0 0 6px}
#lab-rods .lab-task{font-size:22px;color:#d8e4de;margin:0 0 12px}
#lab-rods .canvas-wrap{background:#0d201a;border:1px solid rgba(255,224,102,.35);border-radius:12px;overflow:hidden}
#lab-rods canvas{display:block;width:100%;height:auto;outline:none;cursor:ew-resize}
#lab-rods canvas:focus-visible{box-shadow:inset 0 0 0 3px #ffe066}
#lab-rods .lab-controls{display:flex;flex-direction:column;gap:10px;margin-top:12px}
#lab-rods .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:#1c3d34;border-radius:12px;padding:8px 10px}
#lab-rods .lab-name{font-size:22px;font-weight:700;color:#ffe066;min-width:5em}
#lab-rods .lab-btn{min-height:48px;font-size:22px;font-weight:700;padding:6px 16px;border-radius:10px;border:2px dashed rgba(255,224,102,.6);background:transparent;color:#f6f3ea;cursor:pointer;font-family:inherit}
#lab-rods .lab-btn:hover{border-style:solid}
#lab-rods .lab-btn.active{background:#ffe066;color:#11261f;border-style:solid}
#lab-rods .lab-btn:disabled{opacity:.45;cursor:not-allowed}
#lab-rods .result-box{margin-top:12px;background:#1c3d34;border-left:6px solid #ffe066;border-radius:10px;padding:12px 16px;font-size:22px;line-height:1.6}
#lab-rods .result-box b{color:#ffe066}
#lab-rods .lab-rods-fixed{margin-top:6px;color:#c9d8d2}
`;
  function build() {
    if (built) return;
    const tab = document.getElementById(TAB);
    if (!tab) { console.warn('W5Lab.rods: 找不到 #' + TAB); return; }
    built = true;
    if (!document.getElementById('lab-rods-css')) {
      const st = document.createElement('style'); st.id = 'lab-rods-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const box = document.createElement('div');
    box.className = 'lab-desk'; box.id = 'lab-rods';
    const head = '🔧 動手做｜自己當反應爐操作員：控制棒', headEn = '🔧 Hands-on | Be the reactor operator: control rods';
    const task = '任務：把控制棒調到「正好」讓功率穩住；再試試「全拔」，看安全系統怎麼救場。',
      taskEn = 'Task: set the control rods "Just right" to keep the power steady. Then try "All out" and watch the safety system step in.';
    const isEn = typeof window.LANG !== 'undefined' ? window.LANG === 'en' : (document.documentElement.lang === 'en');
    box.innerHTML =
      `<div class="lab-head" data-zh="${head}" data-en="${headEn}">${isEn ? headEn : head}</div>` +
      `<div class="lab-task" data-zh="${task}" data-en="${taskEn.replace(/"/g, '&quot;')}">${isEn ? taskEn : task}</div>` +
      `<div class="canvas-wrap"><canvas id="rodsLabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%" aria-label="控制棒實驗台"></canvas></div>` +
      `<div class="lab-controls" id="rodsLabControls"></div>` +
      `<div class="result-box" id="rodsLabResult"></div>`;
    tab.appendChild(box);
    cv = document.getElementById('rodsLabCanvas'); ctx = cv.getContext('2d');
    ctrl = document.getElementById('rodsLabControls'); resEl = document.getElementById('rodsLabResult');
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('keydown', onKey);
    resetSim(); buildControls(); updateResult(true); draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.on) draw(); });
  }

  /* ───────── 對外介面 ───────── */
  function activate() {
    build(); if (!cv) return;
    if (S.on) return;
    S.on = true; S.last = 0;
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden && !S.raf) S.raf = requestAnimationFrame(frame);
  }
  function deactivate() {
    S.on = false;
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.drag = null;
    document.removeEventListener('visibilitychange', onVis);
  }
  function relang() {
    if (!built) return;
    const box = document.getElementById('lab-rods');
    if (box && typeof window.LANG !== 'undefined') box.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = el.getAttribute('data-' + (window.LANG === 'en' ? 'en' : 'zh')); });
    buildControls(); updateResult(true); draw();
  }
  function _state() {
    return {
      running: S.on && !!S.raf, depth: +S.d.toFixed(3), depthTarget: S.dTarget, k: +kNow().toFixed(3),
      power: +S.P.toFixed(3), temp: +S.T.toFixed(3), scram: !!S.scram, locked: locked(), category: category(),
      neutrons: S.neutrons.length, boxes: S.boxes.slice()
    };
  }

  W5Lab.rods = { activate, deactivate, relang, _state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
