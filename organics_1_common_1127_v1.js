/* ==================================================================
   organics_1_common_1127_v1.js ｜ 有機物基礎與木材乾餾：共用畫法庫（window.O1）
   規則：只增不改（後面的動畫檔可以往這裡加新函式，不可以改已有函式的行為）。
   依賴：work_5_kit（W5）。畫布一律 960×540 邏輯座標；畫布頂端 0～31 px 留給進度條。
   原子顏色（教材全站一致）：碳 C 深灰藍、氫 H 白、氧 O 紅、氮 N 藍、鈣 Ca 綠、鉀 K 紫、銅 Cu 橘銅、氯 Cl 黃綠。
   提供：
     O1.EL                      原子種類（色、半徑）
     O1.atom(c,x,y,el,r,o)      單顆球棒模型的原子（含元素符號）
     O1.bond(c,x0,y0,x1,y1,o)   化學鍵（o.order 1/2/3）
     O1.mol(c,m,ox,oy,o)        畫整個分子；m 來自 O1.MOL（{atoms:[{el,x,y}],bonds:[[i,j,order]]}）
     O1.fx(c,str,x,y,col,size,align)   化學式：數字自動變下標（CO2、CaCO3、C2H5OH、CH3OCH3）
     O1.flame(c,x,y,h,t,o)      火焰（t 秒，會閃動）
     O1.lamp(c,x,y,o)           酒精燈（o.on 是否點燃、o.s 縮放）
     O1.smoke(c,x0,y0,t,o)      往上飄的煙／蒸氣（確定性粒子）
   ================================================================== */
(function (root) {
  'use strict';
  if (typeof W5 === 'undefined') return;
  const O1 = root.O1 = root.O1 || {};
  const COL = W5.COL, clamp01 = W5.clamp01, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, TAU = Math.PI * 2;

  /* ── 原子 ── */
  O1.EL = {
    C:  { col: '#7d8f9c', rim: '#1a252c', r: 26, txt: '#0d201a' },
    H:  { col: '#f6f3ea', rim: '#6d7a74', r: 17, txt: '#0d201a' },
    O:  { col: '#ff5d4d', rim: '#5a1612', r: 24, txt: '#fff' },
    N:  { col: '#5b8cff', rim: '#14224f', r: 24, txt: '#fff' },
    Ca: { col: '#6fd68a', rim: '#14402a', r: 30, txt: '#0d201a' },
    K:  { col: '#b58cff', rim: '#2f1a5c', r: 30, txt: '#0d201a' },
    Cu: { col: '#e08a4a', rim: '#5a2f12', r: 28, txt: '#0d201a' },
    Cl: { col: '#c8e04a', rim: '#3a4a10', r: 26, txt: '#0d201a' }
  };

  O1.atom = function (c, x, y, el, r, o) {
    o = o || {}; const E = O1.EL[el] || O1.EL.C; r = r || E.r;
    const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.92)'); g.addColorStop(0.3, E.col); g.addColorStop(1, W5.mix(E.col, E.rim, 0.75));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.lineWidth = 2; c.strokeStyle = E.rim; c.stroke();
    if (o.glow) W5.glow(c, x, y, r * 2.1, o.glow, 0.5);
    if (o.label !== false) {
      c.font = W5.font(Math.max(16, Math.round(r * 0.9)), true); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = E.txt; c.fillText(el, x, y + 1);
    }
    c.restore();
  };

  O1.bond = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const order = o.order || 1, a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, gap = o.gap || 7;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    for (let i = 0; i < order; i++) {
      const off = (i - (order - 1) / 2) * gap;
      c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = (o.lw || 6) + 3;
      c.beginPath(); c.moveTo(x0 + nx * off, y0 + ny * off); c.lineTo(x1 + nx * off, y1 + ny * off); c.stroke();
      c.strokeStyle = o.col || '#d9e2dd'; c.lineWidth = o.lw || 6;
      c.beginPath(); c.moveTo(x0 + nx * off, y0 + ny * off); c.lineTo(x1 + nx * off, y1 + ny * off); c.stroke();
    }
    c.restore();
  };

  /* 分子資料：座標以「鍵長 1 單位＝ 60 px」為尺度，原點在分子中心附近 */
  O1.MOL = {
    CH4:  { atoms: [{ el: 'C', x: 0, y: 0 }, { el: 'H', x: 0, y: -1.1 }, { el: 'H', x: 1.1, y: 0 }, { el: 'H', x: 0, y: 1.1 }, { el: 'H', x: -1.1, y: 0 }], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
    CO:   { atoms: [{ el: 'C', x: -0.55, y: 0 }, { el: 'O', x: 0.55, y: 0 }], bonds: [[0, 1, 3]] },
    CO2:  { atoms: [{ el: 'O', x: -1.5, y: 0 }, { el: 'C', x: 0, y: 0 }, { el: 'O', x: 1.5, y: 0 }], bonds: [[0, 1, 2], [1, 2, 2]] },
    H2O:  { atoms: [{ el: 'O', x: 0, y: -0.2 }, { el: 'H', x: -0.95, y: 0.6 }, { el: 'H', x: 0.95, y: 0.6 }], bonds: [[0, 1, 1], [0, 2, 1]] },
    UREA: { atoms: [{ el: 'C', x: 0, y: 0 }, { el: 'O', x: 0, y: -1.3 }, { el: 'N', x: -1.25, y: 0.75 }, { el: 'N', x: 1.25, y: 0.75 },
                    { el: 'H', x: -1.25, y: 1.95 }, { el: 'H', x: -2.35, y: 0.25 }, { el: 'H', x: 1.25, y: 1.95 }, { el: 'H', x: 2.35, y: 0.25 }],
            bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1], [2, 5, 1], [3, 6, 1], [3, 7, 1]] },
    /* 乙醇 C2H5OH：C−C−O−H（直線展開示意） */
    ETOH: { atoms: [{ el: 'C', x: -1.4, y: 0 }, { el: 'C', x: 0, y: 0 }, { el: 'O', x: 1.4, y: 0 }, { el: 'H', x: 2.35, y: 0.6 },
                    { el: 'H', x: -1.4, y: -1.2 }, { el: 'H', x: -2.3, y: 0.55 }, { el: 'H', x: -1.4, y: 1.2 }, { el: 'H', x: 0, y: -1.2 }, { el: 'H', x: 0, y: 1.2 }],
            bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
    /* 甲醚 CH3−O−CH3：C−O−C */
    DME:  { atoms: [{ el: 'C', x: -1.4, y: 0 }, { el: 'O', x: 0, y: 0 }, { el: 'C', x: 1.4, y: 0 },
                    { el: 'H', x: -1.4, y: -1.2 }, { el: 'H', x: -2.3, y: 0.55 }, { el: 'H', x: -1.4, y: 1.2 },
                    { el: 'H', x: 1.4, y: -1.2 }, { el: 'H', x: 2.3, y: 0.55 }, { el: 'H', x: 1.4, y: 1.2 }],
            bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]] }
  };

  /* 畫整個分子。o: scale（每單位 px，預設 60）、a、atomScale、label、dx(i,t) 之類不提供——要動就自己逐顆畫 */
  O1.mol = function (c, m, ox, oy, o) {
    o = o || {}; const S = o.scale || 60, a = o.a == null ? 1 : o.a, k = o.atomScale || 1;
    if (a <= 0.02) return;
    m.bonds.forEach(b => {
      const A = m.atoms[b[0]], B = m.atoms[b[1]];
      O1.bond(c, ox + A.x * S, oy + A.y * S, ox + B.x * S, oy + B.y * S, { order: b[2], a, lw: Math.max(3, 6 * k) });
    });
    /* 先畫小的、再畫大的，大原子不會被小原子蓋掉太多 */
    m.atoms.map((A, i) => i).sort((i, j) => O1.EL[m.atoms[j].el].r - O1.EL[m.atoms[i].el].r).forEach(i => {
      const A = m.atoms[i];
      O1.atom(c, ox + A.x * S, oy + A.y * S, A.el, O1.EL[A.el].r * k, { a, label: o.label });
    });
  };

  /* 化學式：數字自動變下標。align: left／center／right；回傳寬度 */
  O1.fx = function (c, str, x, y, col, size, align) {
    size = size || 22; align = align || 'center'; col = col || COL.white;
    const sub = Math.round(size * 0.68);
    const parts = []; /* {t, sub} */
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], prev = parts.length ? parts[parts.length - 1] : null;
      const isSub = /[0-9]/.test(ch) && prev && (/[A-Za-z)]/.test(prev.t) || prev.sub);
      parts.push({ t: ch, sub: !!isSub });
    }
    c.save(); c.textBaseline = 'middle';
    let w = 0;
    parts.forEach(p => { c.font = W5.font(p.sub ? sub : size, true); p.w = c.measureText(p.t).width; w += p.w; });
    let px = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.textAlign = 'left'; c.lineJoin = 'round';
    parts.forEach(p => {
      c.font = W5.font(p.sub ? sub : size, true);
      const py = y + (p.sub ? size * 0.22 : 0);
      c.lineWidth = 5; c.strokeStyle = 'rgba(13,32,26,0.92)'; c.strokeText(p.t, px, py);
      c.fillStyle = col; c.fillText(p.t, px, py); px += p.w;
    });
    c.restore();
    return w;
  };

  /* 火焰：底部中心 (x,y)，高度 h；t 秒；o.a 透明度、o.w 寬度 */
  O1.flame = function (c, x, y, h, t, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || h <= 1) return;
    const w = o.w || h * 0.42, fl = 1 + 0.06 * Math.sin(t * 17) + 0.04 * Math.sin(t * 29 + 1);
    c.save(); c.globalAlpha *= a;
    const g0 = c.createRadialGradient(x, y - h * 0.4, 0, x, y - h * 0.4, h * 0.9);
    g0.addColorStop(0, 'rgba(255,170,60,0.28)'); g0.addColorStop(1, 'rgba(255,170,60,0)');
    c.fillStyle = g0; c.beginPath(); c.arc(x, y - h * 0.4, h * 0.9, 0, TAU); c.fill();
    const body = (sc, col) => {
      const hh = h * sc * fl, ww = w * sc, sway = Math.sin(t * 9 + sc * 3) * ww * 0.12;
      c.fillStyle = col; c.beginPath(); c.moveTo(x - ww, y);
      c.bezierCurveTo(x - ww * 1.05, y - hh * 0.45, x - ww * 0.35 + sway, y - hh * 0.7, x + sway, y - hh);
      c.bezierCurveTo(x + ww * 0.35 + sway, y - hh * 0.7, x + ww * 1.05, y - hh * 0.45, x + ww, y); c.closePath(); c.fill();
    };
    body(1, o.outer || 'rgba(255,128,64,0.92)'); body(0.7, 'rgba(255,214,90,0.95)'); body(0.38, 'rgba(255,250,210,0.95)');
    c.restore();
  };

  /* 酒精燈：底座中心 (x,y)＝桌面；o.on 點燃、o.s 縮放、o.t 時間、o.a 透明度；燈芯頂端約在 y-62*s */
  O1.lamp = function (c, x, y, o) {
    o = o || {}; const s = o.s || 1, a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 2, 38, 7, 0, 0, TAU); c.fill();
    /* 玻璃燈身 */
    const g = c.createLinearGradient(-34, 0, 34, 0); g.addColorStop(0, 'rgba(160,215,230,0.35)'); g.addColorStop(0.5, 'rgba(220,245,255,0.18)'); g.addColorStop(1, 'rgba(120,190,210,0.35)');
    c.fillStyle = g; c.strokeStyle = 'rgba(190,230,240,0.85)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-34, 0); c.bezierCurveTo(-40, -12, -36, -34, -12, -42); c.lineTo(12, -42); c.bezierCurveTo(36, -34, 40, -12, 34, 0); c.closePath(); c.fill(); c.stroke();
    /* 酒精 */
    c.fillStyle = 'rgba(190,225,255,0.38)'; c.beginPath(); c.moveTo(-31, 0); c.bezierCurveTo(-36, -8, -33, -22, -22, -27); c.lineTo(22, -27); c.bezierCurveTo(33, -22, 36, -8, 31, 0); c.closePath(); c.fill();
    /* 燈頸＋燈芯 */
    c.fillStyle = '#9aa7ad'; c.fillRect(-10, -52, 20, 12); c.strokeStyle = '#1a252c'; c.lineWidth = 2; c.strokeRect(-10, -52, 20, 12);
    c.fillStyle = '#e8dcc0'; c.fillRect(-3, -62, 6, 11);
    c.restore();
    if (o.on) O1.flame(c, x, y - 60 * s, (o.fh || 62) * s, o.t || 0, { a, w: 14 * s });
  };

  /* 煙／蒸氣：從 (x0,y0) 往上飄；o.n 粒子數、o.h 上升高度、o.col、o.a、o.spread、o.r 粒子半徑 */
  O1.smoke = function (c, x0, y0, t, o) {
    o = o || {}; const n = o.n || 14, H = o.h || 140, a = o.a == null ? 1 : o.a, col = o.col || '#e8eef0', sp = o.spread || 26, r0 = o.r || 9;
    if (a <= 0.02) return;
    c.save();
    for (let i = 0; i < n; i++) {
      const ph = (t * (o.speed || 0.35) + hash(i + 3 + (o.seed || 0))) % 1;
      const x = x0 + (hash(i * 7 + 1) - 0.5) * sp + Math.sin(ph * 6 + i) * sp * 0.5 * ph + (o.drift || 0) * ph * H;
      const y = y0 - ph * H, r = r0 * (0.7 + 1.4 * ph);
      c.globalAlpha = a * (1 - ph) * Math.min(1, ph * 6) * 0.6;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, W5.rgba(col, 0.9)); g.addColorStop(1, W5.rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.restore();
  };
})(window);
