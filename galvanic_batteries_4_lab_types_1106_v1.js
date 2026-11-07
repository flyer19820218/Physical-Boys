/* galvanic_batteries_4_lab_types_1106_v1.js — 「🔬 動手做：放電與充電」實驗台（#typesLabCanvas，邏輯 1000×600）
 *
 * 契約：window.GbLab.types = { activate(), deactivate(), relang(), _state() }
 * 只依賴頁面的 tr()；常數與小工具都在本 IIFE 內（不碰 GbAnim、ctl 或舊程式的全域）。
 * 控制鈕由本檔建立在 #typesLabControls（沒有就建在畫布外框後面），說明字寫進 #typesLabResult（只有文字改變時才寫）。
 * 畫風與同課 types 教學動畫一致：同一套電池外殼（一次＝圓柱、二次＝方形）、淺綠條＝剩餘反應物、小燈、外部電源、
 * 電子藍球、橘色 Li⁺ 膠囊、大紅叉、三角警示；點擊目標用黃色虛線脈動外框（同 lab_cell／lab_redox）。
 *
 * ── 實驗（學生自己選電池、放電、充電）───────────────────────────
 *   〔碳鋅〕〔鹼性〕〔鉛蓄〕〔鋰離子〕〔鎳氫〕選電池（換電池＝一顆新的、滿格、拔掉導線）。
 *   〔放電〕（或點發亮的導線接頭）：接上小燈；電子從負極經外電路（小燈）到正極，淺綠條慢慢變少；用完小燈熄滅、電子停下。
 *   〔充電〕：一次電池＝按鈕灰掉（aria-disabled）＋旁邊寫原因「一次電池不可充電」；點它會閃出大紅叉與「禁止嘗試充電」。
 *          二次電池＝小燈換成外部電源（正接正、負接負），電子方向反過來，淺綠條回升；Li⁺ 游回負極、鉛蓄反應式反向。
 *   〔看反應式〕：碳鋅（補充）與鉛蓄的反應式面板（JetBrains Mono，塞不下就換行）。其他三種舊頁沒有反應式，按鈕停用。
 *   〔換一顆新的〕：剩餘反應物回到滿格（一次電池用完時，也可以點發亮的電池）。
 *
 * ── 舊頁「多種電池」內容（逐項保留）──────────────────────────────
 *   名稱、電壓（鎳氫依指示不寫）、一次／二次、兩條特點寫在右側卡片；材料標示畫在電池剖面上下；
 *   碳鋅的電解液與兩條反應式、鉛蓄的放電／充電反應式在〔看反應式〕面板；鉛蓄目前方向的反應式另寫在下方；
 *   充電規則（正接正、負接負、電能 → 化學能）、放電（化學能 → 電能）、不可充電提示、回收、安全提醒寫在畫面與說明框。
 *
 * ── 版面（與 types 教學動畫第 3 步同一套幾何）────────────────────
 *   y≈58 一句提示。電池 x 80–520、y 245–385；小燈／外部電源中心 (300,160)；導線左 x=50、右 x=560、上 y=160。
 *   y≈225 電池兩端的材料名；y≈404 材料標示；y≈437 剩餘反應物條；y≈474 能量轉換；y≈514 反應式／回收提醒；y 556／584 圖例。
 *   右側卡片 x 600–975、y 88–476：名稱、電壓、一次／二次、兩條特點、底部規則。反應式面板蓋在 x 24–976、y 84–488。
 */
(function () {
  'use strict';
  window.GbLab = window.GbLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif", MONO = "'JetBrains Mono',monospace";
  const K = {
    bg: '#0c1e19', white: '#f2ecd9', yellow: '#fde047', green: '#4ade80', cyan: '#55e9ff',
    muted: '#9fb3aa', dim: '#5f7a70', panel: '#123329', electron: '#4dd2ff',
    pos: '#ff8040', ink: '#0c1e19', red: '#ff6b5a',
    wire: '#c9d3d6', body: '#1d4337', bodyHi: '#2c5e4e', edge: '#b9d3c8', stuff: '#86b89c',
    negEl: '#56615c', posEl: '#6e6559', lyte: 'rgba(120,200,190,0.13)',
    zn: '#b9c6cc', znLo: '#7b8a91'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = (s, m) => `900 ${s}px ${m ? MONO : FONT}`;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  // ───────── 幾何（與 types 教學動畫第 3、4 步相同） ─────────
  const CAP_Y = 58;
  const BX0 = 80, BX1 = 520, BT0 = 245, BT1 = 385, BCY = 315;
  const CHX = 300, CHY = 160, CHW = 170, CHH = 64;
  const LWX = 50, RWX = 560, TIP = BX1 + 12;
  const LOOP = [{ x: BX0, y: BCY }, { x: LWX, y: BCY }, { x: LWX, y: CHY }, { x: RWX, y: CHY }, { x: RWX, y: BCY }, { x: TIP, y: BCY }];
  const GAP = 40;                                                // 拔掉導線時，接頭離正極 40px（真的斷開）
  const LI_ROWS = [280, 315, 350], LI_POS = [335, 400], LI_NEG = [200, 265];
  const CARD = { x0: 600, x1: 975, y0: 88, y1: 476 };
  const CCX = (CARD.x0 + CARD.x1) / 2;
  const GX0 = 220, GX1 = 520, GY = 437, GH = 24;                 // 剩餘反應物條
  const SP = 58, V_E = 120;                                      // 電子間距、速度
  const T_DIS = 14, T_CHG = 9;                                   // 滿格放完／充滿的秒數

  // ───────── 五種電池（舊頁內容） ─────────
  const BAT = {
    carbon: { b: ['碳鋅', 'Carbon-zinc'], name: ['碳鋅電池', 'Carbon-zinc battery'], v: ['1.5 V', '1.5 V'], re: false, shape: 'cyl',
      facts: [['價格較低，使用時間較短', 'Lower price, shorter running time'], ['久放可能漏液與腐蝕', 'May leak and corrode if stored a long time']],
      ends: [['鋅系材料', 'Zinc material'], ['碳棒', 'Carbon rod']],
      mat: [[['電解液：', 0], ['NH₄Cl＋ZnCl₂', 1], [' 糊狀物', 0]], [['Electrolyte: ', 0], ['NH₄Cl + ZnCl₂', 1], [' paste', 0]]], eq: true },
    alkaline: { b: ['鹼性', 'Alkaline'], name: ['鹼性電池', 'Alkaline battery'], v: ['約 1.5 V', 'about 1.5 V'], re: false, shape: 'cyl',
      facts: [['低溫性能與壽命較佳', 'Works better in the cold and lasts longer'], ['電解質常用氫氧化鉀（KOH）', 'Electrolyte: usually potassium hydroxide (KOH)']],
      ends: [['負極', 'Negative'], ['正極', 'Positive']],
      mat: [[['電解質：氫氧化鉀（', 0], ['KOH', 1], ['）', 0]], [['Electrolyte: potassium hydroxide (', 0], ['KOH', 1], [')', 0]]], eq: false },
    lead: { b: ['鉛蓄', 'Lead-acid'], name: ['鉛蓄電池', 'Lead-acid battery'], v: ['每一組約 2 V', 'about 2 V per cell'], re: true, shape: 'pack',
      facts: [['多組串聯可提高總電壓', 'Several cells in series raise the total voltage'], ['放電與充電反應方向相反', 'Charging runs the reaction opposite to discharging']],
      ends: [['負極', 'Negative'], ['正極', 'Positive']],
      mat: [[['鉛板組＋稀硫酸 ', 0], ['H₂SO₄', 1]], [['Lead plates + dilute ', 0], ['H₂SO₄', 1]]], eq: true },
    lithium: { b: ['鋰離子', 'Li-ion'], name: ['鋰離子電池', 'Lithium-ion battery'], v: ['3.6～3.7 V', '3.6–3.7 V'], re: true, shape: 'pack',
      facts: [['能量密度高，手機與電腦常用', 'High energy density — used in phones and computers'], ['避免高溫、擠壓與破壞', 'Avoid heat, crushing and damage']],
      ends: [['負極材料', 'Negative material'], ['正極材料', 'Positive material']], mat: null, eq: false },
    nimh: { b: ['鎳氫', 'Ni-MH'], name: ['鎳氫電池', 'Ni-MH battery'], v: '1.2 V', re: true, shape: 'pack',
      facts: [['家用 AA／AAA 充電電池', 'Household AA / AAA rechargeable batteries'], ['記憶效應較不明顯', 'Memory effect is less noticeable']],
      ends: [['合金', 'Alloy'], ['氫氧化物', 'Hydroxide']],
      mat: [[['合金與氫氧化物', 0]], [['Alloy and hydroxide', 0]]], eq: false }
  };
  const ORDER = ['carbon', 'alkaline', 'lead', 'lithium', 'nimh'];
  const L2 = p => T(p[0], p[1]);
  const EQ = {
    cNeg: 'Zn ⟶ Zn²⁺ ＋ 2e⁻',
    cPos: '2MnO₂ ＋ 2NH₄⁺ ＋ 2e⁻ ⟶ Mn₂O₃ ＋ 2NH₃ ＋ H₂O',
    pbDis: 'Pb ＋ PbO₂ ＋ 2H₂SO₄ ⟶ 2PbSO₄ ＋ 2H₂O',
    pbChg: '2PbSO₄ ＋ 2H₂O ⟶ Pb ＋ PbO₂ ＋ 2H₂SO₄'
  };

  // ───────── 文字工具（先量再寫） ─────────
  let ctx = null;
  function textW(s, size, m) { ctx.save(); ctx.font = font(size, m); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrap(s, maxW, size, m) {
    if (s.indexOf('\n') >= 0) {
      const one = s.replace(/\n/g, '');
      if (textW(one, size, m) <= maxW) return [one];
      return s.split('\n').reduce((a, part) => a.concat(wrap(part, maxW, size, m)), []);
    }
    ctx.save(); ctx.font = font(size, m);
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : Array.from(s), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = u; } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function text(s, x, y, color, size, align, alpha, m) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.font = font(size, m); ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function fitSize(s, maxW, z0, m) { for (let z = z0; z > 22; z--) if (textW(s, z, m) <= maxW) return z; return 22; }
  function rrect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  // 中英＋化學式混排：segs＝[[字, 是否等寬, 顏色]]；整行放得下就一行，否則在空白處斷成多行（不縮到 22 以下）
  function tokens(segs) {
    const out = [];
    segs.forEach(([s, m, c]) => {
      const parts = m ? s.split(/( )/) : (/[㐀-鿿]/.test(s) ? [s] : s.split(/( )/));
      parts.forEach(p => { if (p) out.push([p, m, c]); });
    });
    return out;
  }
  function segsW(segs, z) { return segs.reduce((a, [s, m]) => a + textW(s, z, m), 0); }
  function mixLines(segs, maxW, z0) {
    for (let z = z0; z >= 22; z--) if (segsW(segs, z) <= maxW) return { z, lines: [segs] };
    const z = 22, lines = []; let cur = [], w = 0;
    tokens(segs).forEach(tk => {
      const tw = textW(tk[0], z, tk[1]);
      if (w + tw > maxW && cur.length) {
        while (cur.length && cur[cur.length - 1][0] === ' ') cur.pop();
        lines.push(cur); cur = []; w = 0;
        if (tk[0] === ' ') return;
      }
      cur.push(tk); w += tw;
    });
    if (cur.length) lines.push(cur);
    return { z, lines };
  }
  function mixDraw(segs, x, y, maxW, z0, align, alpha, lh) {
    const { z, lines } = mixLines(segs, maxW, z0), h = lh || Math.round(z * 1.3);
    const y0 = y - (lines.length - 1) * h / 2;
    lines.forEach((ln, k) => {
      const tw = segsW(ln, z);
      let xx = align === 'left' ? x : align === 'right' ? x - tw : x - tw / 2;
      ln.forEach(([s, m, c]) => { text(s, xx, y0 + k * h, c, z, 'left', alpha, m); xx += textW(s, z, m); });
    });
    return lines.length;
  }

  // ───────── 路徑工具 ─────────
  function mkPath(pts) {
    const seg = []; let L = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1e-6) continue;
      seg.push({ a, b, len, s0: L, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len }); L += len;
    }
    return { pts, seg, L };
  }
  function at(P, s) {
    let g = P.seg[P.seg.length - 1];
    for (const q of P.seg) if (s <= q.s0 + q.len) { g = q; break; }
    const u = clamp(s - g.s0, 0, g.len);
    return { x: g.a.x + g.dx * u, y: g.a.y + g.dy * u };
  }
  function strokePts(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); }
  const LP = mkPath(LOOP);

  // ───────── 狀態 ─────────
  const S = {};
  function freshBattery(key) {
    Object.assign(S, { bat: key, mode: 'idle', level: 1, flow: 0, conn: 0, top: 0, phase: 0, swapT: S.t || 0, done: false });
  }
  function resetState() {
    S.t = 0; S.actions = 0; S.panel = false; S.flash = -99; S.flashN = 0;
    freshBattery('carbon'); S.swapT = -9;
  }
  resetState();
  const R0 = { raf: 0, timer: 0, last: 0, on: false };
  let cv = null, ctrl = null, res = null, lastRes = '', ctrlSig = '', targetsNow = [], lastE = [];
  const B = () => BAT[S.bat];
  const flashing = () => S.t - S.flash < 3.2;
  const wantTop = () => (S.mode === 'chg' ? 1 : 0);

  // ───────── 圖形（與 types 教學動畫同一畫法） ─────────
  function wireLine(pts, al) {
    if (pts.length < 2 || al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[8, 'rgba(12,30,25,0.8)'], [5, K.wire]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; strokePts(pts); ctx.stroke(); });
    ctx.restore();
  }
  function wireEnd(x, y) {
    ctx.save(); ctx.fillStyle = K.wire; ctx.strokeStyle = 'rgba(12,30,25,0.8)'; ctx.lineWidth = 1.5;
    rrect(x - 6, y - 7, 10, 14, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function ball(x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = K.electron; ctx.shadowBlur = 10; ctx.fillStyle = K.electron;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function lamp(x, y, k, al) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    if (k > 0.01) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, 70);
      g.addColorStop(0, `rgba(255,250,235,${0.75 * k})`); g.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = k > 0.01 ? `rgba(255,252,240,${0.25 + 0.7 * k})` : 'rgba(200,220,215,0.14)';
    ctx.strokeStyle = 'rgba(226,240,236,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = k > 0.01 ? `rgba(120,90,40,${0.5 + 0.5 * k})` : 'rgba(150,170,165,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 12, y + 4); ctx.lineTo(x - 6, y - 6); ctx.lineTo(x, y + 4); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x + 12, y + 4); ctx.stroke();
    ctx.restore();
  }
  function charger(y, al, glow) {
    if (al <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.panel; ctx.strokeStyle = K.electron; ctx.lineWidth = 3;
    if (glow) { ctx.shadowColor = K.electron; ctx.shadowBlur = 14 * glow; }
    rrect(CHX - CHW / 2, y - CHH / 2, CHW, CHH, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    const s = T('外部電源', 'Power supply'), z = fitSize(s, CHW - 24, 24);
    text(s, CHX, y + 1, K.white, z, 'center', al);
    text('−', CHX - CHW / 2 - 14, y - 22, K.electron, 28, 'center', al, true);
    text('＋', CHX + CHW / 2 + 14, y - 22, K.pos, 26, 'center', al, true);
  }
  function shell(kind, al, hot) {
    const h = BT1 - BT0, r = kind === 'cyl' ? h * 0.42 : 10;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.edge; rrect(BX1 - 2, BCY - h * 0.22, 14, h * 0.44, 4); ctx.fill();
    const g = ctx.createLinearGradient(0, BT0, 0, BT1);
    g.addColorStop(0, K.bodyHi); g.addColorStop(0.45, K.body); g.addColorStop(1, '#14302a');
    ctx.fillStyle = g; rrect(BX0, BT0, BX1 - BX0, h, r); ctx.fill();
    ctx.restore();
    return r;
  }
  function shellEdge(kind, al, hot) {
    const h = BT1 - BT0, r = kind === 'cyl' ? h * 0.42 : 10;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.strokeStyle = hot ? K.red : K.edge; ctx.lineWidth = hot ? 4 : 3;
    if (hot) { ctx.shadowColor = K.red; ctx.shadowBlur = 18 * hot; }
    rrect(BX0, BT0, BX1 - BX0, h, r); ctx.stroke(); ctx.shadowBlur = 0;
    if (kind === 'cyl') {
      ctx.strokeStyle = 'rgba(185,211,200,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BX1 - r * 0.9, BT0 + 4); ctx.lineTo(BX1 - r * 0.9, BT1 - 4); ctx.stroke();
    }
    ctx.restore();
  }
  function clipShell(kind) {
    const h = BT1 - BT0, r = kind === 'cyl' ? h * 0.42 : 10;
    rrect(BX0 + 3, BT0 + 3, BX1 - BX0 - 6, h - 6, Math.max(4, r - 3)); ctx.clip();
  }
  // 各電池的剖面
  function interior(key, al) {
    const b = BAT[key];
    ctx.save(); ctx.globalAlpha *= al; clipShell(b.shape);
    if (key === 'carbon') {
      ctx.fillStyle = K.zn; ctx.fillRect(BX0, BT0, BX1 - BX0, 14); ctx.fillRect(BX0, BT1 - 14, BX1 - BX0, 14);   // 鋅系外殼（內襯）
      ctx.fillRect(BX0, BT0, 16, BT1 - BT0);
      ctx.fillStyle = '#4a3d2e'; ctx.fillRect(BX0 + 16, BT0 + 14, BX1 - BX0 - 66, BT1 - BT0 - 28);            // 糊狀物
      ctx.fillStyle = 'rgba(242,236,217,0.07)';
      for (let k = 0; k < 22; k++) { ctx.beginPath(); ctx.arc(BX0 + 40 + (k * 53) % 380, BT0 + 30 + (k * 37) % 90, 3, 0, TAU); ctx.fill(); }
      const g = ctx.createLinearGradient(0, BCY - 12, 0, BCY + 12);
      g.addColorStop(0, '#5b5f61'); g.addColorStop(0.4, '#2b2e30'); g.addColorStop(1, '#16191a');
      ctx.fillStyle = g; rrect(160, BCY - 12, BX1 - 160, 24, 6); ctx.fill();                                // 碳棒
    } else if (key === 'alkaline') {
      ctx.fillStyle = '#3d4a46'; ctx.fillRect(BX0, BT0, BX1 - BX0, BT1 - BT0);
      ctx.fillStyle = 'rgba(185,198,204,0.55)'; rrect(150, BCY - 28, 300, 56, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 3; rrect(144, BCY - 34, 312, 68, 30); ctx.stroke();
    } else if (key === 'lead') {
      ctx.fillStyle = 'rgba(150,200,210,0.16)'; ctx.fillRect(BX0, BT0, BX1 - BX0, BT1 - BT0);               // 稀硫酸
      for (let k = 0; k < 6; k++) {
        const x = 118 + k * 62;
        ctx.fillStyle = k % 2 ? '#6b4a3a' : '#8d979b'; rrect(x, BT0 + 16, 30, BT1 - BT0 - 32, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(12,30,25,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    } else if (key === 'lithium') {
      ctx.fillStyle = K.negEl; rrect(BX0 + 10, BT0 + 10, 72, BT1 - BT0 - 20, 6); ctx.fill();
      ctx.fillStyle = K.posEl; rrect(BX1 - 82, BT0 + 10, 72, BT1 - BT0 - 20, 6); ctx.fill();
      ctx.fillStyle = K.lyte; ctx.fillRect(BX0 + 82, BT0 + 10, BX1 - BX0 - 164, BT1 - BT0 - 20);
      ctx.strokeStyle = 'rgba(12,30,25,0.5)'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const y = BT0 + 30 + k * 27;
        ctx.beginPath(); ctx.moveTo(BX0 + 18, y); ctx.lineTo(BX0 + 74, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(BX1 - 74, y); ctx.lineTo(BX1 - 18, y); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#7d858a'; rrect(BX0 + 10, BT0 + 10, 180, BT1 - BT0 - 20, 6); ctx.fill();             // 合金
      ctx.fillStyle = '#5d7f6a'; rrect(BX1 - 190, BT0 + 10, 180, BT1 - BT0 - 20, 6); ctx.fill();            // 氫氧化物
      ctx.fillStyle = 'rgba(242,236,217,0.25)'; ctx.fillRect(BX0 + 194, BT0 + 10, 52, BT1 - BT0 - 20);      // 隔離層
    }
    ctx.restore();
  }
  function liPill(x, y, al) {
    if (al <= 0.01) return;
    const hw = textW('Li⁺', 22, true) / 2 + 7;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = K.pos; ctx.shadowColor = K.pos; ctx.shadowBlur = 6;
    rrect(x - hw, y - 15, hw * 2, 30, 15); ctx.fill(); ctx.restore();
    text('Li⁺', x, y + 1, K.ink, 22, 'center', al, true);
  }
  function mark(ok, x, y, al, r) {
    if (al <= 0.01) return;
    r = r || 13; const q = r / 13;
    ctx.save(); ctx.globalAlpha *= al; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ok ? K.green : K.red; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - 6 * q, y + 1 * q); ctx.lineTo(x - 1 * q, y + 6 * q); ctx.lineTo(x + 7 * q, y - 5 * q); }
    else { ctx.moveTo(x - 5 * q, y - 5 * q); ctx.lineTo(x + 5 * q, y + 5 * q); ctx.moveTo(x + 5 * q, y - 5 * q); ctx.lineTo(x - 5 * q, y + 5 * q); }
    ctx.stroke(); ctx.restore();
  }
  function bigX(cx, cy, s, k, al) {
    if (al <= 0.01 || k <= 0) return;
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = K.red; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.shadowColor = K.red; ctx.shadowBlur = 16;
    const k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    ctx.beginPath(); ctx.moveTo(cx - s, cy - s * 0.62); ctx.lineTo(cx - s + 2 * s * k1, cy - s * 0.62 + 1.24 * s * k1); ctx.stroke();
    if (k2 > 0) { ctx.beginPath(); ctx.moveTo(cx + s, cy - s * 0.62); ctx.lineTo(cx + s - 2 * s * k2, cy - s * 0.62 + 1.24 * s * k2); ctx.stroke(); }
    ctx.restore();
  }
  function warnIcon(x, y, s, color, al) {
    if (al <= 0.01) return;
    const q = s / 13;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = color; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(x, y - 12 * q); ctx.lineTo(x + 13 * q, y + 10 * q); ctx.lineTo(x - 13 * q, y + 10 * q); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = K.ink; ctx.lineWidth = 3 * q; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 4 * q); ctx.lineTo(x, y + 2 * q); ctx.stroke();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(x, y + 6.5 * q, 1.8 * q, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function dot(x, y, color) { ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.restore(); }

  // ───────── 左半：迴路＋電池 ─────────
  function tipX() { return TIP + GAP * (1 - ease(S.conn)); }
  function drawCircuit() {
    const b = B(), sw = ease((S.t - S.swapT) / 0.45), dy = 26 * (1 - sw), hot = flashing() ? (0.75 + 0.25 * Math.sin(S.t * 6)) * clamp(3.2 - (S.t - S.flash), 0, 1) : 0;
    // 導線（右下那一小段可以拔開：留真正的缺口）
    const tx = tipX();
    wireLine(LOOP.slice(0, 5), 1);
    wireLine([{ x: RWX, y: BCY }, { x: tx, y: BCY }], 1);
    wireEnd(tx - 2, BCY);
    // 電子（只在導線裡；元件之後畫）
    lastE = [];
    const ea = S.conn > 0.98 ? clamp(0.3 + S.flow, 0, 1) * (S.mode === 'idle' ? 0 : 1) : 0;
    if (ea > 0.01) {
      for (let k = 0; k * SP < LP.L + SP; k++) {
        let s = (k * SP + S.phase) % LP.L; if (s < 0) s += LP.L;
        const p = at(LP, s), fade = clamp(Math.min(s, LP.L - s) / 18, 0, 1);
        const inBox = S.top > 0.5 && p.y === CHY && Math.abs(p.x - CHX) < CHW / 2 + 4;
        if (!inBox) { ball(p.x, p.y, 8, fade * ea); lastE.push(p); }
      }
    }
    // 小燈 ↔ 外部電源
    const tp = ease(S.top);
    lamp(CHX, CHY - 40 * tp, S.mode === 'dis' ? S.flow : 0, 1 - tp);
    charger(CHY - 40 * (1 - tp), tp, S.mode === 'chg' ? S.flow : 0);
    if (tp > 0.5) {
      text(T('負接負', '− to −'), CHX - CHW / 2 - 32, CHY - 26, K.electron, 22, 'right', ease(2 * tp - 1));
      text(T('正接正', '+ to +'), CHX + CHW / 2 + 32, CHY - 26, K.pos, 22, 'left', ease(2 * tp - 1));
    } else if (!flashing() && tp < 0.01) text(T('小燈', 'Lamp'), CHX, 112, K.muted, 22, 'center');
    // 電池
    ctx.save(); ctx.translate(0, dy);
    shell(b.shape, sw);
    interior(S.bat, sw);
    if (S.bat === 'lithium') {
      const m = 1 - S.level, moving = S.flow > 0.05;
      LI_ROWS.forEach((y, r) => [0, 1].forEach(c => {
        const jx = moving ? 2.5 * Math.sin(S.t * 1.7 + r * 1.3 + c * 2.1) : 0;
        liPill(lerp(LI_NEG[c], LI_POS[c], ease(clamp(m * 1.15 - r * 0.075, 0, 1))) + jx, y + 1.5 * Math.sin(S.t * 2.3 + r + c), sw);
      }));
    }
    shellEdge(b.shape, sw, hot);
    ctx.restore();
    text('−', BX0 - 14, BCY + 28, K.electron, 28, 'center', 1, true);
    text('＋', BX1 + 26, BCY + 28, K.pos, 26, 'center', 1, true);
    // 兩端材料名（電池上方）
    const e0 = L2(b.ends[0]), e1 = L2(b.ends[1]);
    text(e0, BX0, 225, K.electron, fitSize(e0, 210, 22), 'left', sw);
    text(e1, BX1, 225, K.pos, fitSize(e1, 210, 22), 'right', sw);
    // 材料標示（電池下方）
    if (b.mat) mixDraw(b.mat[T(0, 1)].map(([s, m]) => [s, m, K.white]), 300, 405, 520, 22, 'center', sw);
    else {
      const chg = S.mode === 'chg' && S.flow > 0.05;
      mixDraw(chg ? [[T('充電時：', 'Charging: '), 0, K.pos], ['Li⁺', 1, K.pos], [T(' 游回負極', ' moves back to −'), 0, K.pos]]
        : [[T('放電時：', 'Discharge: '), 0, K.white], ['Li⁺', 1, K.pos], [T(' 從負極游向正極', ' moves − → +'), 0, K.white]], 300, 405, 520, 22, 'center', sw);
    }
    // 剩餘反應物（淺綠條）
    const gl = T('剩餘反應物', 'Reactants left');
    text(gl, GX0 - 12, GY, K.stuff, fitSize(gl, GX0 - 12 - 30, 22), 'right');
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.75)'; rrect(GX0, GY - GH / 2, GX1 - GX0, GH, 6); ctx.fill();
    if (S.level > 0.005) {
      if (S.flow > 0.05) { ctx.shadowColor = K.stuff; ctx.shadowBlur = 6 + 6 * Math.sin(S.t * 5); }
      ctx.fillStyle = K.stuff; rrect(GX0, GY - GH / 2, Math.max(8, (GX1 - GX0) * S.level), GH, 6); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = 'rgba(185,211,200,0.5)'; ctx.lineWidth = 1.5; rrect(GX0, GY - GH / 2, GX1 - GX0, GH, 6); ctx.stroke(); ctx.restore();
    // 能量轉換
    let es = '', ec = K.white;
    if (S.mode === 'dis') { es = S.level > 0.001 ? T('放電：化學能 → 電能', 'Discharge: chemical → electrical energy') : T('反應物用完了', 'Reactants used up'); ec = S.level > 0.001 ? K.white : K.red; }
    else if (S.mode === 'chg') { es = S.level < 0.999 ? T('充電：電能 → 化學能', 'Charging: electrical → chemical energy') : T('充飽了', 'Fully charged'); ec = S.level < 0.999 ? K.electron : K.green; }
    if (es) text(es, 300, 474, ec, fitSize(es, 560, 24));
    // 一次電池硬要充電：大紅叉＋禁止
    if (flashing()) {
      const k = ease((S.t - S.flash) / 0.6), al = clamp(3.2 - (S.t - S.flash), 0, 1);
      bigX(300, BCY, 112, k, al);
      const s = T('禁止嘗試充電', 'Never try to charge it'), z = fitSize(s, 400, 26), w = textW(s, z) + 60;
      ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = 'rgba(40,14,12,0.92)'; ctx.strokeStyle = K.red; ctx.lineWidth = 3;
      rrect(300 - w / 2, 92, w, 40, 20); ctx.fill(); ctx.stroke(); ctx.restore();
      warnIcon(300 - w / 2 + 24, 112, 13, K.red, al);
      text(s, 300 + 12, 112, K.red, z, 'center', al);
    }
  }

  // ───────── 右半：電池卡片 ─────────
  function drawCard() {
    const b = B(), sw = ease((S.t - S.swapT) / 0.45), warn = flashing();
    ctx.save(); ctx.fillStyle = 'rgba(18,51,41,0.85)'; ctx.strokeStyle = warn ? K.red : 'rgba(159,179,170,0.6)'; ctx.lineWidth = 3;
    rrect(CARD.x0, CARD.y0, CARD.x1 - CARD.x0, CARD.y1 - CARD.y0, 18); ctx.fill(); ctx.stroke(); ctx.restore();
    const iw = CARD.x1 - CARD.x0 - 44, xl = CARD.x0 + 22;
    let y = CARD.y0 + 34;
    const nm = L2(b.name);
    text(nm, CCX, y, K.white, fitSize(nm, iw, 30), 'center', sw); y += 42;
    if (b.v) {
      const v = L2(b.v), m = !/[㐀-鿿]/.test(v);
      text(v, CCX, y, K.yellow, fitSize(v, iw, 28, m), 'center', sw, m); y += 42;
    }
    const kind = b.re ? T('二次電池｜可以充電', 'Secondary | rechargeable') : T('一次電池｜不可充電', 'Primary | not rechargeable');
    const kz = fitSize(kind, iw - 40, 24), kw = textW(kind, kz) + 36;
    mark(b.re, CCX - kw / 2 + 13, y, sw); text(kind, CCX - kw / 2 + 36, y, b.re ? K.green : K.red, kz, 'left', sw);
    y += 28;
    ctx.save(); ctx.strokeStyle = 'rgba(159,179,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(CARD.x1 - 22, y); ctx.stroke(); ctx.restore();
    y += 12;
    // 兩條特點
    const facts = b.facts.map(L2);
    let z = 24, ls = facts.map(f => wrap(f, iw - 24, 24));
    if (ls.reduce((a, l) => a + l.length, 0) > 4) { z = 22; ls = facts.map(f => wrap(f, iw - 24, 22)); }
    const lh = z + 8;
    ls.forEach(lines => {
      y += lh / 2 + 4;
      dot(xl + 6, y, K.cyan);
      lines.forEach((l, k) => text(l, xl + 22, y + k * lh, K.white, z, 'left', sw));
      y += (lines.length - 1) * lh + lh / 2 + 6;
    });
    // 底部：規則
    const by = CARD.y1 - 46;
    ctx.save(); ctx.fillStyle = b.re ? 'rgba(74,222,128,0.10)' : 'rgba(255,107,90,0.12)'; ctx.strokeStyle = b.re ? K.green : K.red; ctx.lineWidth = 2;
    rrect(CARD.x0 + 12, by - 30, CARD.x1 - CARD.x0 - 24, 60, 12); ctx.fill(); ctx.stroke(); ctx.restore();
    const rule = b.re ? T('充電：正極接正極、\n負極接負極', 'Charge: + to +, − to −') : T('用完交給廢電池回收', 'When used up: recycle it');
    const rl = wrap(rule, iw - 8, 22);
    rl.slice(0, 2).forEach((l, k) => text(l, CCX, by + (k - (rl.length - 1) / 2) * 26, b.re ? K.green : K.red, 22, 'center', sw));
  }

  // ───────── 下方：反應式／提醒、圖例 ─────────
  function drawStrip() {
    const b = B();
    let segs;
    if (S.bat === 'lead') {
      const chg = S.mode === 'chg';
      segs = [[chg ? T('充電：', 'Charge: ') : T('放電：', 'Discharge: '), 0, chg ? K.electron : K.white], [chg ? EQ.pbChg : EQ.pbDis, 1, K.white]];
    } else if (S.bat === 'carbon') {
      segs = [[T('負極 (−)：', 'Negative (−): '), 0, K.electron], [EQ.cNeg, 1, K.white], [T('（正極看〔看反應式〕）', '  (positive: “Reactions”)'), 0, K.muted]];
    } else segs = [[T('廢電池含有害物質，請依規定妥善回收', 'Used batteries contain harmful substances — recycle them properly'), 0, K.muted]];
    mixDraw(segs, W / 2, 514, 950, 24, 'center', 1, 28);
    void b;
  }
  function drawLegend() {
    const items = [[T('藍球 e⁻＝電子（只走外電路）', 'Blue ball e⁻ = electron (outer circuit only)'), 'b'],
      [T('淺綠條＝剩餘反應物', 'Light-green bar = reactants left'), 'g']];
    if (S.bat === 'lithium') items.push([T('橘 Li⁺＝鋰離子（只在電池內部）', 'Orange Li⁺ = lithium ion (inside only)'), 'i']);
    const gi = 40, gap = 30, wid = items.map(([s]) => gi + textW(s, 22));
    const rows = []; let cur = [], cw = 0;
    items.forEach((_, k) => { const add = wid[k] + (cur.length ? gap : 0); if (cw + add > W - 40 && cur.length) { rows.push(cur); cur = []; cw = 0; } cur.push(k); cw += wid[k] + (cur.length > 1 ? gap : 0); });
    rows.push(cur);
    const ys = rows.length === 1 ? [568] : [552, 580];
    rows.forEach((rw, r) => {
      const tw = rw.reduce((a, k) => a + wid[k], 0) + gap * (rw.length - 1);
      let x = W / 2 - tw / 2;
      rw.forEach(k => {
        const [s, kind] = items[k], y = ys[r];
        if (kind === 'b') ball(x + 14, y, 7, 1);
        else if (kind === 'g') { ctx.save(); ctx.fillStyle = K.stuff; rrect(x + 1, y - 7, 28, 14, 4); ctx.fill(); ctx.restore(); }
        else { ctx.save(); ctx.fillStyle = K.pos; rrect(x + 2, y - 8, 26, 16, 8); ctx.fill(); ctx.restore(); }
        text(s, x + gi, y, K.white, 22, 'left');
        x += wid[k] + gap;
      });
    });
  }
  function drawCaption(s, color) {
    const z = fitSize(s, 960, 26), ls = wrap(s, 960, z);
    const lz = ls.length > 1 ? 22 : z, ls2 = ls.length > 1 ? wrap(s, 960, 22).slice(0, 2) : ls;
    const bw = Math.max(...ls2.map(l => textW(l, lz))) + 28, bh = ls2.length > 1 ? 56 : 38;
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.86)'; rrect(W / 2 - bw / 2, CAP_Y - bh / 2, bw, bh, 10); ctx.fill(); ctx.restore();
    if (ls2.length === 1) text(ls2[0], W / 2, CAP_Y, color, lz);
    else ls2.forEach((l, k) => text(l, W / 2, CAP_Y - 13 + k * 26, color, 22));
  }

  // ───────── 反應式面板（〔看反應式〕） ─────────
  const PX0 = 24, PX1 = 976, PY0 = 84, PY1 = 488;
  function drawPanel() {
    ctx.save(); ctx.fillStyle = 'rgba(14,40,33,0.97)'; ctx.strokeStyle = K.cyan; ctx.lineWidth = 3;
    rrect(PX0, PY0, PX1 - PX0, PY1 - PY0, 18); ctx.fill(); ctx.stroke(); ctx.restore();
    const xl = PX0 + 34, iw = PX1 - PX0 - 68;
    if (S.bat === 'carbon') {
      const h = T('補充：碳鋅電池的反應', 'Extra: reactions in a carbon-zinc battery');
      text(h, W / 2, PY0 + 40, K.yellow, fitSize(h, iw, 28));
      mixDraw([[T('電解液：', 'Electrolyte: '), 0, K.cyan], [T('NH₄Cl＋ZnCl₂', 'NH₄Cl + ZnCl₂'), 1, K.cyan], [T(' 糊狀物', ' paste'), 0, K.cyan]], W / 2, PY0 + 96, iw, 24, 'center');
      text(T('負極 (−)', 'Negative (−)'), xl, PY0 + 158, K.electron, 24, 'left');
      mixDraw([['(−): ', 1, K.electron], [EQ.cNeg, 1, K.white]], W / 2, PY0 + 202, iw, 26, 'center');
      text(T('正極 (+)', 'Positive (+)'), xl, PY0 + 262, K.pos, 24, 'left');
      mixDraw([['(+): ', 1, K.pos], [EQ.cPos, 1, K.white]], W / 2, PY0 + 312, iw, 26, 'center', 1, 32);
      const n = T('一次電池：反應只往一個方向，不可嘗試充電', 'Primary battery: the reaction only goes one way — never try to charge it');
      text(n, W / 2, PY1 - 36, K.red, fitSize(n, iw, 24));
    } else if (S.bat === 'lead') {
      const h = T('鉛蓄電池的反應：放電與充電方向相反', 'Lead-acid: charging runs the reaction in reverse');
      text(h, W / 2, PY0 + 40, K.yellow, fitSize(h, iw, 28));
      const chg = S.mode === 'chg', dis = !chg;
      [[T('放電（化學能 → 電能）', 'Discharge (chemical → electrical)'), EQ.pbDis, dis, K.white, PY0 + 118],
        [T('充電（電能 → 化學能，正接正、負接負）', 'Charge (electrical → chemical, + to +, − to −)'), EQ.pbChg, chg, K.electron, PY0 + 258]].forEach(([lab, eq, on, col, y]) => {
        const al = on ? 1 : 0.5;
        if (on) { ctx.save(); ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.shadowColor = K.yellow; ctx.shadowBlur = 8; rrect(PX0 + 16, y - 34, PX1 - PX0 - 32, 116, 14); ctx.stroke(); ctx.restore(); }
        text(lab, xl, y, col, fitSize(lab, iw, 24), 'left', al);
        mixDraw([[eq, 1, K.white]], W / 2, y + 46, iw, 28, 'center', al);
      });
      const n = T('目前方向亮框；按〔放電〕或〔充電〕看它反過來', 'The framed one is happening now — press Discharge or Charge to flip it');
      text(n, W / 2, PY1 - 30, K.muted, fitSize(n, iw, 22));
    }
  }

  // ───────── 訊息（畫布提示＋說明框，同一個狀態） ─────────
  function msgKey() {
    if (flashing()) return 'deny';
    if (S.mode === 'dis') return S.level <= 0.001 ? (B().re ? 'emptyRe' : 'emptyPri') : 'dis';
    if (S.mode === 'chg') return S.level >= 0.999 ? 'full' : 'chg';
    return S.level <= 0.001 ? (B().re ? 'emptyRe' : 'emptyPri') : S.level < 0.999 ? 'paused' : 'idle';
  }
  const Y = s => `<span class="accent-yellow">${s}</span>`;
  function msg(cap) {
    const b = B(), nm = L2(b.name), v = b.v ? L2(b.v) : '', k = msgKey();
    const kind = b.re ? T('二次電池，可以充電', 'a secondary battery — rechargeable') : T('一次電池，不可充電', 'a primary battery — not rechargeable');
    const extraDis = S.bat === 'lithium' ? T('Li⁺ 在電池裡從負極游向正極。', ' Inside, Li⁺ moves from the negative side to the positive side.')
      : S.bat === 'lead' ? T(`放電反應：${EQ.pbDis}。`, ` Discharge reaction: ${EQ.pbDis}.`) : '';
    const extraChg = S.bat === 'lithium' ? T('Li⁺ 從正極游回負極。', ' Li⁺ moves back from the positive side to the negative side.')
      : S.bat === 'lead' ? T(`充電反應：${EQ.pbChg}，和放電方向相反。`, ` Charging reaction: ${EQ.pbChg} — the reverse of discharging.`) : '';
    const safety = T('實際電池不可拆解、短路、加熱或嘗試替不可充電電池充電。', 'Never open, short-circuit or heat a real battery, or try to charge a non-rechargeable one.');
    switch (k) {
      case 'idle': return cap ? T('選一種電池，按〔放電〕或點發亮的接頭，接上小燈', 'Pick a battery, then press “Discharge” or tap the glowing plug')
        : T(`${Y(nm)}${v ? `（${v}）` : ''}：${kind}。按〔放電〕把小燈接上，看電子怎麼走、淺綠條（剩餘反應物）怎麼變。`,
          `${Y(nm)}${v ? ` (${v})` : ''}: ${kind}. Press “Discharge” to connect the lamp, and watch where the electrons go and how the light-green bar (reactants left) changes.`);
      case 'paused': return cap ? T('導線拔開了：按〔放電〕繼續，或換一種電池', 'Unplugged: press “Discharge” to continue, or pick another battery')
        : T(`導線拔開，電子不再流動、小燈熄滅；剩餘反應物停在原處。按〔放電〕接回去繼續。`, 'The wire is unplugged: electrons stop and the lamp goes out; the reactants left stay where they are. Press “Discharge” to plug it back in.');
      case 'dis': return cap ? T('放電：電子從負極出發，經小燈走到正極', 'Discharging: electrons leave the negative end, pass the lamp, reach the positive end')
        : T(`${Y('放電：化學能 → 電能。')}電子從負極出發，經外電路（小燈）回到正極，小燈亮起；淺綠條（剩餘反應物）越用越少。`, `${Y('Discharge: chemical energy → electrical energy.')} Electrons leave the negative end, travel through the outer circuit (the lamp) and reach the positive end; the light-green bar (reactants left) keeps shrinking. `) + extraDis;
      case 'emptyPri': return cap ? T('反應物用完了：小燈熄滅。一次電池不可充電', 'Reactants used up: the lamp is out. A primary battery cannot be recharged')
        : T(`${nm}的反應物用完了，電子不再流動、小燈熄滅。${Y('一次電池的反應只往一個方向，不能倒回去，不可嘗試充電。')}廢電池含有害物質，請依規定妥善回收；按〔換一顆新的〕再做一次。`,
          `The ${nm}'s reactants are used up: electrons stop and the lamp goes out. ${Y('A primary battery’s reaction only goes one way and cannot go back — never try to charge it.')} Used batteries contain harmful substances, so recycle them properly. Press “New battery” to try again.`);
      case 'emptyRe': return cap ? T('反應物用完了：二次電池可以按〔充電〕充回來', 'Reactants used up: a secondary battery can be recharged — press “Charge”')
        : T(`${nm}的反應物用完了，小燈熄滅。它是${Y('二次電池，可以充電')}：按〔充電〕接上外部電源。`, `The ${nm}'s reactants are used up and the lamp goes out. It is ${Y('a secondary battery, so it can be recharged')}: press “Charge” to connect a power supply.`);
      case 'chg': return cap ? T('充電：正極接正極、負極接負極，電子方向反過來', 'Charging: + to +, − to −; the electrons flow the other way')
        : T(`充電時必須${Y('「正極接正極、負極接負極」')}，用外部電源強制推動反向的化學反應：${Y('電能 → 化學能')}。電子方向反過來，淺綠條回升。`, `To charge, connect ${Y('+ to + and − to −')}. The power supply forces the chemical reaction to run backward: ${Y('electrical → chemical energy')}. The electrons flow the other way and the light-green bar rises. `) + extraChg;
      case 'full': return cap ? T('充飽了：剩餘反應物回到滿格，可以再放電', 'Fully charged: the reactants are back — discharge it again')
        : T(`${Y('充飽了')}：電能已經轉換成化學能存起來，剩餘反應物回到滿格。二次電池可以這樣重複放電、充電。按〔放電〕再用一次。`, `${Y('Fully charged')}: the electrical energy is stored as chemical energy and the reactants are back to full. A secondary battery can be discharged and charged again and again. Press “Discharge” to use it again.`);
      case 'deny': return cap ? T(`${nm}是一次電池，不可充電！`, `The ${nm} is a primary battery — it cannot be charged!`)
        : T(`${Y('禁止嘗試充電！')}${nm}是一次電池，反應不能倒回去：就算硬接上電源也推不回去，只會有危險。${safety}`, `${Y('Never try to charge it!')} The ${nm} is a primary battery; its reaction cannot go back — even forcing a power supply onto it only creates danger. ${safety}`);
    }
    return '';
  }
  function captionColor() { const k = msgKey(); return k === 'deny' || k === 'emptyPri' ? K.red : k === 'full' || k === 'emptyRe' ? K.yellow : K.cyan; }
  function writeResult() { if (!res) return; const h = msg(false); if (h !== lastRes) { lastRes = h; res.innerHTML = h; } }

  // ───────── 可以點的目標 ─────────
  function computeTargets() {
    const out = [];
    if (S.mode === 'idle' && S.level > 0.001 && S.conn < 0.02 && !S.panel) out.push({ key: 'dis', r: [TIP + 4, BCY - 24, TIP + GAP + 12, BCY + 12], shape: 'plug' });
    if (!B().re && S.level <= 0.001 && !S.panel && !flashing()) out.push({ key: 'fresh', r: [BX0 - 6, BT0 - 6, BX1 + 18, BT1 + 6], shape: 'bat' });
    return out;
  }
  function drawGlow(tg) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(S.t * 3.4); ctx.strokeStyle = K.yellow; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -S.t * 24; ctx.shadowColor = K.yellow; ctx.shadowBlur = 6; ctx.lineJoin = 'round';
    const [x0, y0, x1, y1] = tg.r; rrect(x0, y0, x1 - x0, y1 - y0, 12); ctx.stroke(); ctx.restore();
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx || !cv || !cv.width) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    const pan = S.panel && B().eq;                               // 面板打開時它整個蓋住舞台：底下不畫（字不疊字）
    if (!pan) { drawCircuit(); drawCard(); } else lastE = [];
    drawStrip();
    drawLegend();
    targetsNow = computeTargets();
    targetsNow.forEach(drawGlow);
    if (pan) drawPanel();
    drawCaption(msg(true), captionColor());
  }

  // ───────── 步進 ─────────
  function approach(v, tgt, rate, dt) { return v < tgt ? Math.min(tgt, v + rate * dt) : Math.max(tgt, v - rate * dt); }
  function step(dt) {
    S.t += dt;
    const wt = wantTop();
    if (Math.abs(S.top - wt) > 1e-3) {
      S.conn = approach(S.conn, 0, 1 / 0.3, dt);
      if (S.conn < 0.01) S.top = approach(S.top, wt, 1 / 0.6, dt);
    } else { S.top = wt; S.conn = approach(S.conn, S.mode === 'idle' ? 0 : 1, 1 / 0.35, dt); }
    const live = S.conn > 0.98 && ((S.mode === 'dis' && S.level > 0) || (S.mode === 'chg' && S.level < 1));
    S.flow = approach(S.flow, live ? 1 : 0, 1 / 0.4, dt);
    if (S.mode === 'dis') { S.level = Math.max(0, S.level - S.flow * dt / T_DIS); S.phase += V_E * S.flow * dt; }
    else if (S.mode === 'chg') { S.level = Math.min(1, S.level + S.flow * dt / T_CHG); S.phase -= V_E * S.flow * dt; }
    S.phase = ((S.phase % SP) + SP) % SP;
  }
  const busy = () => S.flow > 0.01 || Math.abs(S.top - wantTop()) > 1e-3 || Math.abs(S.conn - (S.mode === 'idle' ? 0 : 1)) > 1e-3 || flashing() || S.t - S.swapT < 0.45;

  // ───────── 操作 ─────────
  function can(key) {
    const b = B();
    if (BAT[key]) return true;
    if (key === 'dis') return true;
    if (key === 'chg') return b.re;
    if (key === 'panel') return b.eq;
    if (key === 'fresh') return S.level < 0.999 && S.mode !== 'chg';
    return false;
  }
  function act(key) {
    if (key === 'chg' && !B().re) { S.flash = S.t; S.flashN++; S.actions++; shake(); refreshUI(); if (!R0.raf) render(); return; }
    if (!can(key)) return;
    S.actions++;
    if (BAT[key]) { if (key !== S.bat) { freshBattery(key); S.swapT = S.t; S.flash = -99; if (!BAT[key].eq) S.panel = false; } }
    else if (key === 'dis') S.mode = S.mode === 'dis' ? 'idle' : 'dis';
    else if (key === 'chg') S.mode = S.mode === 'chg' ? 'idle' : 'chg';
    else if (key === 'panel') S.panel = !S.panel;
    else if (key === 'fresh') { const m = S.mode; freshBattery(S.bat); S.swapT = S.t; S.mode = m === 'dis' ? 'dis' : 'idle'; S.conn = m === 'dis' ? 1 : 0; S.flash = -99; }
    refreshUI();
    if (!R0.raf) render();
  }
  function shake() {
    const b = ctrl && ctrl.querySelector('[data-act="chg"]');
    if (b && b.animate) b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 360 });
    const r = ctrl && ctrl.querySelector('.lab-why');
    if (r && r.animate) r.animate([{ color: '#ff6b5a', transform: 'scale(1.12)' }, { color: '#ff6b5a', transform: 'scale(1)' }], { duration: 900 });
  }

  // ───────── 控制鈕 ─────────
  function ctrlSpec() {
    return [
      [T('選電池', 'Battery'), ORDER.map(k => [k, L2(BAT[k].b)])],
      [T('操作', 'Do'), [['dis', T('放電', 'Discharge')], ['chg', T('充電', 'Charge')], ['panel', T('看反應式', 'Reactions')], ['fresh', T('換一顆新的', 'New battery')]]]
    ];
  }
  function buildControls() {
    if (!ctrl) return;
    const rows = ctrlSpec(), sig = JSON.stringify(rows);
    if (sig === ctrlSig) return;
    ctrlSig = sig;
    const fk = document.activeElement && ctrl.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    ctrl.innerHTML = '';
    ctrl.style.display = 'flex'; ctrl.style.flexDirection = 'column'; ctrl.style.gap = '10px';
    for (const [name, btns] of rows) {
      const row = document.createElement('div'); row.className = 'lab-row';
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name;
      sp.style.cssText = 'font-size:22px;font-weight:900;color:#b8c9c1;margin-right:4px;';
      row.appendChild(sp);
      for (const [key, label] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'action-btn lab-btn'; b.dataset.act = key; b.textContent = label;
        b.style.cssText = 'font-size:22px;min-height:56px;padding:10px 18px;font-weight:900;touch-action:manipulation;';
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
        if (key === 'chg') {
          const w = document.createElement('span'); w.className = 'lab-why'; w.dataset.why = '1';
          w.style.cssText = 'font-size:22px;font-weight:900;color:#ff8f80;display:inline-block;';
          row.appendChild(w);
        }
      }
      ctrl.appendChild(row);
    }
    if (fk) { const b = ctrl.querySelector(`[data-act="${fk}"]`); if (b && !b.disabled) b.focus(); }
  }
  let uiSig = '';
  function refreshUI() {
    buildControls();
    const b = B();
    if (ctrl) {
      ctrl.querySelectorAll('.lab-btn').forEach(el => {
        const k = el.dataset.act;
        let on = null, ok = can(k);
        if (BAT[k]) on = k === S.bat;
        else if (k === 'dis') on = S.mode === 'dis';
        else if (k === 'chg') on = S.mode === 'chg';
        else if (k === 'panel') on = S.panel && b.eq;
        if (k === 'chg') {                                           // 一次電池：灰掉但還能點（點了閃出提示）
          el.disabled = false; el.setAttribute('aria-disabled', ok ? 'false' : 'true');
          el.style.opacity = ok ? '1' : '0.42'; el.style.cursor = ok ? 'pointer' : 'not-allowed';
          el.title = ok ? '' : T('一次電池不可充電', 'A primary battery cannot be charged');
        } else { el.disabled = !ok; el.style.opacity = ok ? '1' : '0.42'; el.style.cursor = ok ? 'pointer' : 'default'; }
        if (on !== null) { el.setAttribute('aria-pressed', on ? 'true' : 'false'); el.classList.toggle('active', !!on); }
      });
      const why = ctrl.querySelector('.lab-why');
      if (why) why.textContent = b.re ? '' : T('← 一次電池不可充電', '← a primary battery cannot be charged');
    }
    writeResult();
    if (cv) cv.setAttribute('aria-label', T('放電與充電實驗台：選電池、放電、充電，看電子方向與剩餘反應物；目前：', 'Discharge and charge bench: pick a battery, discharge or charge it, and watch the electrons and the reactants left. Now: ') + msg(true));
    uiSig = sigNow();
  }
  const sigNow = () => [S.bat, S.mode, S.panel, msgKey(), S.level < 0.999, S.level > 0.001].join();

  // ───────── 點畫面（只認目前發亮的目標） ─────────
  function hitAt(e) {
    const r = cv.getBoundingClientRect(); if (!r.width) return null;
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    return targetsNow.find(tg => x >= tg.r[0] - 6 && x <= tg.r[2] + 6 && y >= tg.r[1] - 6 && y <= tg.r[3] + 6) || null;
  }
  function onClick(e) { if (!cv) return; const hit = hitAt(e); if (hit) act(hit.key); }
  function onMove(e) { if (!cv || e.pointerType !== 'mouse') return; cv.style.cursor = hitAt(e) ? 'pointer' : 'default'; }

  // ───────── 動畫迴圈（單一 rAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.offsetWidth > 0 && cv.getClientRects().length); }
  function frame(now) {
    R0.raf = 0;
    if (!R0.on || document.hidden) return;
    if (!visibleNow()) { R0.last = 0; poll(); return; }
    const dt = R0.last ? Math.min(0.05, Math.max(0, (now - R0.last) / 1000)) : 0; R0.last = now;
    step(dt);
    if (sigNow() !== uiSig) refreshUI();
    render(); writeResult();
    R0.raf = requestAnimationFrame(frame);
  }
  function poll() { if (R0.timer || !R0.on) return; R0.timer = setTimeout(() => { R0.timer = 0; sync(); }, 300); }
  function sync() {
    const want = R0.on && !document.hidden;
    if (want && !R0.raf && !R0.timer) { R0.last = 0; R0.raf = requestAnimationFrame(frame); }
    else if (!want) { if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0; if (R0.timer) clearTimeout(R0.timer); R0.timer = 0; }
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (R0.on) deactivate();
    cv = document.getElementById('typesLabCanvas');
    if (!cv) return;
    ctrl = document.getElementById('typesLabControls');
    if (!ctrl) {
      ctrl = document.createElement('div'); ctrl.id = 'typesLabControls'; ctrl.className = 'lab-controls';
      const host = cv.parentElement && cv.parentElement.classList.contains('canvas-wrap') ? cv.parentElement : cv;
      host.insertAdjacentElement('afterend', ctrl);
    }
    res = document.getElementById('typesLabResult');
    ctx = cv.getContext('2d');
    resetState();
    R0.on = true; lastRes = ''; ctrlSig = '';
    cv.addEventListener('click', onClick);
    cv.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVis);
    refreshUI(); render(); sync();
  }
  function deactivate() {
    R0.on = false;
    if (R0.raf) cancelAnimationFrame(R0.raf); R0.raf = 0;
    if (R0.timer) clearTimeout(R0.timer); R0.timer = 0;
    if (cv) { cv.removeEventListener('click', onClick); cv.removeEventListener('pointermove', onMove); }
    document.removeEventListener('visibilitychange', onVis);
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ctrlSig = '';
  }
  function relang() { if (!R0.on) return; lastRes = ''; ctrlSig = ''; refreshUI(); render(); }
  function where(p) {
    const onSeg = (a, b) => Math.abs(a.x - b.x) < 1 ? Math.abs(p.x - a.x) <= 3 && p.y >= Math.min(a.y, b.y) - 1 && p.y <= Math.max(a.y, b.y) + 1
      : Math.abs(p.y - a.y) <= 3 && p.x >= Math.min(a.x, b.x) - 1 && p.x <= Math.max(a.x, b.x) + 1;
    for (let k = 0; k + 1 < LOOP.length; k++) if (onSeg(LOOP[k], LOOP[k + 1])) return 'wire';
    return 'OTHER';
  }
  function _state() {
    return {
      battery: S.bat, mode: S.mode, rechargeable: B().re, level: +S.level.toFixed(3), flow: +S.flow.toFixed(3),
      connected: +S.conn.toFixed(3), top: S.top > 0.5 ? 'charger' : 'lamp', lamp: S.mode === 'dis' ? +S.flow.toFixed(3) : 0,
      dir: S.flow > 0.01 ? (S.mode === 'chg' ? 'charge' : 'discharge') : 'none', gap: Math.round(tipX() - TIP),
      panel: S.panel && B().eq, deny: flashing(), denyCount: S.flashN, busy: busy(), sub: msgKey(),
      liAtNeg: S.bat === 'lithium' ? +S.level.toFixed(3) : null,
      electrons: lastE.slice(0, 40).map(p => ({ x: Math.round(p.x), y: Math.round(p.y), where: where(p) })),
      targets: targetsNow.map(t => ({ key: t.key, r: t.r.map(v => Math.round(v)) })),
      caption: msg(true), running: !!R0.raf, on: R0.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }

  window.GbLab.types = { activate, deactivate, relang, _state };
})();
