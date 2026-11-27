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
   urea 新增（2026-11-27）：
     O1.flask(c,o)              圓底燒瓶（側視）→ { bottom, mouthY, floor(x) }
     O1.stand(c,o)              鐵架＋夾子
     O1.crystals(c,o)           一堆晶體（塊狀無機物／針狀白色結晶）
     O1.spatula(c,x,y,ang,o)    藥匙（沒有手）
     O1.bigX(c,x,y,size,o)      大 ✕ 擋板（可裂開、碎掉）
     O1.stamp(c,lines,x,y,o)    傾斜印章（可砸下）
     O1.burst(c,x,y,r,o)        驚嘆爆炸框「!」
     O1.plant(c,x,y,o)          植物  O1.critter(c,x,y,o) 小兔子（生命體示意）
   ================================================================== */
(function (root) {
  'use strict';
  if (typeof W5 === 'undefined') return;
  const O1 = root.O1 = root.O1 || {};
  const COL = W5.COL, clamp01 = W5.clamp01, ease = W5.ease, lerp = W5.lerp, hash = W5.hash, TAU = Math.PI * 2;

  /* ── 原子 ── */
  O1.EL = {
    C:  { col: '#7d8f9c', rim: '#1a252c', r: 26, txt: '#ffffff' },
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
    g.addColorStop(0, 'rgba(255,255,255,0.92)'); g.addColorStop(0.3, E.col); g.addColorStop(1, W5.mix(E.col, E.rim, 0.55));
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
  /* ══════════════════ 以下由 urea（烏拉的意外）新增，2026-11-27 ══════════════════ */

  /* 圓底燒瓶（側視剖面）：o：{ x 中線, y 球心, r 球半徑(58), nw 瓶頸半寬(15), top 瓶口 y, a,
       inner(c, g) 瓶內內容（已 clip 在瓶內：球＋瓶頸；g＝回傳的幾何）, heat 0..1 瓶底被加熱的橘光 }
     回傳 { bottom 瓶底內側 y, mouthY 瓶口 y, floor(x) 瓶底內壁在 x 的 y（放結晶用）, x, y, r, nw } */
  O1.flask = function (c, o) {
    o = o || {}; const x = o.x, y = o.y, r = o.r || 58, nw = o.nw || 15, top = o.top == null ? y - r - 70 : o.top, a = o.a == null ? 1 : o.a;
    const ri = r - 4, base = Math.sqrt(Math.max(1, r * r - nw * nw));
    const g = { x, y, r, nw, bottom: y + ri, mouthY: top, floor: px => y + Math.sqrt(Math.max(0, ri * ri - (px - x) * (px - x))) };
    if (a <= 0.02) return g;
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    const ang0 = Math.PI * 1.5 + Math.asin(nw / r), ang1 = Math.PI * 1.5 - Math.asin(nw / r);
    const shape = () => { c.beginPath(); c.moveTo(x - nw, top); c.lineTo(x - nw, y - base); c.arc(x, y, r, ang1, ang0, true); c.lineTo(x + nw, top); };
    /* 玻璃底色 */
    shape(); c.closePath();
    const gg = c.createLinearGradient(x - r, 0, x + r, 0);
    gg.addColorStop(0, 'rgba(160,215,230,0.20)'); gg.addColorStop(0.45, 'rgba(225,245,255,0.07)'); gg.addColorStop(1, 'rgba(120,190,210,0.20)');
    c.fillStyle = gg; c.fill();
    /* 內容 */
    if (o.inner) { c.save(); shape(); c.closePath(); c.clip(); o.inner(c, g); c.restore(); }
    /* 加熱：瓶底橘光 */
    if (o.heat > 0.01) { c.save(); shape(); c.closePath(); c.clip(); W5.glow(c, x, y + r, r * 0.9, '#ff8040', 0.35 * o.heat); c.restore(); }
    /* 玻璃壁 */
    shape(); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 7; c.stroke();
    shape(); c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 3.5; c.stroke();
    /* 瓶口唇 */
    c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - nw - 4, top); c.lineTo(x + nw + 4, top); c.stroke();
    /* 反光 */
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.arc(x, y, r * 0.74, Math.PI * 1.08, Math.PI * 1.36); c.stroke();
    c.beginPath(); c.moveTo(x - nw + 5, top + 10); c.lineTo(x - nw + 5, y - base - 6); c.stroke();
    c.restore();
    return g;
  };

  /* 鐵架（底座＋直桿＋一支夾子夾住瓶頸）：o：{ x 直桿 x, gy 桌面 y, top 直桿頂 y, clampY 夾子 y, toX 夾口中心 x, jaw 夾口半寬(17), a } */
  O1.stand = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const x = o.x, gy = o.gy, top = o.top, cy = o.clampY, tx = o.toX, jw = o.jaw || 17;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    /* 底座 */
    const bg = c.createLinearGradient(0, gy - 12, 0, gy); bg.addColorStop(0, '#6d7a82'); bg.addColorStop(1, '#3d474d');
    c.fillStyle = bg; W5.rr(c, x - 40, gy - 12, 120, 12, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
    /* 直桿 */
    const rg = c.createLinearGradient(x - 4, 0, x + 4, 0); rg.addColorStop(0, '#dfe6ea'); rg.addColorStop(1, '#7d8a92');
    c.fillStyle = rg; c.fillRect(x - 4, top, 8, gy - 12 - top); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.strokeRect(x - 4, top, 8, gy - 12 - top);
    /* 十字夾＋夾臂 */
    c.fillStyle = '#4a555c'; c.fillRect(x - 9, cy - 9, 18, 18);
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, cy); c.lineTo(tx - jw - 4, cy); c.stroke();
    c.strokeStyle = '#a9b6bd'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, cy); c.lineTo(tx - jw - 4, cy); c.stroke();
    /* 夾口（兩片軟木墊夾住瓶頸） */
    c.fillStyle = '#c49a6c'; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5;
    [-1, 1].forEach(sg => { c.beginPath(); W5.rr(c, tx + sg * jw - (sg < 0 ? 7 : 0), cy - 11, 7, 22, 2); c.fill(); c.stroke(); });
    c.strokeStyle = '#a9b6bd'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(tx - jw - 7, cy - 12); c.lineTo(tx + jw + 7, cy - 12); c.moveTo(tx - jw - 7, cy + 12); c.lineTo(tx + jw + 7, cy + 12); c.stroke();
    c.restore();
  };

  /* 一堆晶體（確定性）：沿 floor(x) 堆在底上。o：{ x0, x1 範圍, floor(x) 底面 y（不給就用 o.y）, n 顆數(14), k 0..1 已出現幾成（依序出現）,
       shape 'block' 塊狀晶體（無機物）| 'needle' 針狀白色結晶, col, edge, seed, a, s 大小縮放(1) } */
  O1.crystals = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const n = o.n || 14, k = o.k == null ? 1 : o.k, seed = o.seed || 1, sc = o.s || 1, needle = o.shape === 'needle';
    const col = o.col || (needle ? '#f6f8f4' : '#c9d6dc'), edge = o.edge || (needle ? '#9fb3ad' : '#6f8790');
    const fl = o.floor || (() => o.y);
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const p = clamp01(k * n - i); if (p <= 0) break;
      const h1 = hash(seed * 13 + i * 3.1), h2 = hash(seed * 7 + i * 5.7), h3 = hash(seed * 3 + i * 9.3);
      /* 由中間往兩邊堆：前面的在中間、後面的往外 */
      const side = i % 2 ? 1 : -1, spread = (o.x1 - o.x0) / 2, mid = (o.x0 + o.x1) / 2;
      const px = mid + side * spread * Math.min(1, (i / n) * 1.1 + h1 * 0.15) * (0.25 + 0.75 * h2);
      const layer = Math.floor(i / Math.max(4, n / 3));
      const py = fl(px) - 4 - layer * 9 * sc;
      const pop = ease(p);
      c.save(); c.translate(px, py); c.rotate((h3 - 0.5) * (needle ? 2.2 : 1.0)); c.scale(pop, pop);
      if (needle) {
        const L2 = (14 + 12 * h1) * sc, w = 2.6 * sc;
        c.fillStyle = col; c.strokeStyle = edge; c.lineWidth = 1.2;
        for (let j = -1; j <= 1; j++) {
          c.save(); c.rotate(j * 0.5);
          c.beginPath(); c.moveTo(-L2 / 2, 0); c.lineTo(-L2 / 2 + 3, -w); c.lineTo(L2 / 2 - 3, -w); c.lineTo(L2 / 2, 0); c.lineTo(L2 / 2 - 3, w); c.lineTo(-L2 / 2 + 3, w); c.closePath();
          c.fill(); c.stroke(); c.restore();
        }
      } else {
        const R = (7 + 5 * h1) * sc;
        c.beginPath();
        for (let j = 0; j < 6; j++) { const t = j / 6 * TAU, rr = R * (0.75 + 0.35 * hash(seed + i * 11 + j)); c[j ? 'lineTo' : 'moveTo'](Math.cos(t) * rr, Math.sin(t) * rr * 0.8); }
        c.closePath();
        const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, edge);
        c.fillStyle = g; c.fill(); c.strokeStyle = W5.mix(edge, '#0b1a15', 0.4); c.lineWidth = 1.4; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-R * 0.4, -R * 0.35); c.lineTo(R * 0.1, -R * 0.55); c.stroke();
      }
      c.restore();
    }
    c.restore();
  };

  /* 藥匙（金屬，沒有手）：勺尖在 (x,y)、ang＝柄朝哪個方向（rad，0＝往右）、tilt 勺面傾斜(rad)。o：{ a, len 柄長(130), load 0..1 勺上的粉末量, col 粉末色 } */
  O1.spatula = function (c, x, y, ang, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const len = o.len || 130;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ang); c.lineCap = 'round';
    /* 柄 */
    c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 9; c.beginPath(); c.moveTo(18, 0); c.lineTo(len, 0); c.stroke();
    c.strokeStyle = '#c9d3d8'; c.lineWidth = 5; c.beginPath(); c.moveTo(18, 0); c.lineTo(len, 0); c.stroke();
    /* 勺 */
    c.fillStyle = '#d9e2e6'; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(4, 0, 18, 9, 0, 0, TAU); c.fill(); c.stroke();
    if ((o.load || 0) > 0.02) {
      c.fillStyle = o.col || '#dfe8ec';
      c.beginPath(); c.ellipse(4, -3 * o.load, 13 * Math.sqrt(o.load), 7 * o.load + 1, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(111,135,144,0.9)'; c.lineWidth = 1.2; c.stroke();
    }
    c.restore();
  };

  /* 大「✕」擋板（迷思、不可能）：中心 (x,y)、size 半邊長。o：{ a, col(珊瑚), lw(22), crack 0..1 裂痕長出, shatter 碎裂後秒數（>0 就散成碎片飛走，約 1 秒）, seed, sc 縮放(1) } */
  O1.bigX = function (c, x, y, size, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const col = o.col || COL.coral, lw = o.lw || 22, sh = o.shatter || 0, seed = o.seed || 5, sc = o.sc || 1;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(sc, sc); c.lineCap = 'round';
    if (sh <= 0) {
      W5.glow(c, 0, 0, size * 1.6, col, 0.18);
      [[-1, -1, 1, 1], [1, -1, -1, 1]].forEach(([x0, y0, x1, y1]) => {
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 6; c.beginPath(); c.moveTo(x0 * size, y0 * size); c.lineTo(x1 * size, y1 * size); c.stroke();
        c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0 * size, y0 * size); c.lineTo(x1 * size, y1 * size); c.stroke();
      });
      /* 裂痕：從中心往外的鋸齒線 */
      const ck = clamp01(o.crack || 0);
      if (ck > 0.01) {
        c.strokeStyle = 'rgba(11,26,21,0.95)'; c.lineWidth = 3.5; c.lineJoin = 'round';
        for (let b = 0; b < 5; b++) {
          const th = b / 5 * TAU + hash(seed + b) * 0.8; let px = 0, py = 0;
          c.beginPath(); c.moveTo(0, 0);
          const segs = 4;
          for (let j = 1; j <= segs * ck; j++) {
            const rr = size * 1.05 * j / segs, jt = (hash(seed * 3 + b * 7 + j) - 0.5) * 0.6;
            px = Math.cos(th + jt) * rr; py = Math.sin(th + jt) * rr; c.lineTo(px, py);
          }
          c.stroke();
        }
      }
    } else {
      /* 碎片：沿兩條斜線切成小段，往外飛、往下掉、轉、淡出 */
      const f = clamp01(1 - sh / 1.0);
      if (f > 0.01) {
        let id = 0;
        [[-1, -1, 1, 1], [1, -1, -1, 1]].forEach(([x0, y0, x1, y1]) => {
          for (let j = 0; j < 5; j++, id++) {
            const t0 = j / 5, t1 = (j + 1) / 5, mx = lerp(x0, x1, (t0 + t1) / 2) * size, my = lerp(y0, y1, (t0 + t1) / 2) * size;
            const d = Math.hypot(mx, my) || 1, vx = mx / d * (90 + 80 * hash(seed + id)) + (hash(seed * 2 + id) - 0.5) * 60, vy = my / d * 70 - 60;
            const px = mx + vx * sh, py = my + vy * sh + 260 * sh * sh, rot = (hash(seed * 5 + id) - 0.5) * 8 * sh;
            const hl = size * 0.2 * Math.SQRT2;
            c.save(); c.globalAlpha *= f; c.translate(px, py); c.rotate(Math.atan2(y1 - y0, x1 - x0) + rot);
            c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 6; c.beginPath(); c.moveTo(-hl, 0); c.lineTo(hl, 0); c.stroke();
            c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(-hl, 0); c.lineTo(hl, 0); c.stroke();
            c.restore();
          }
        });
      }
    }
    c.restore();
  };

  /* 蓋章（傾斜的雙框印章，可「砸下來」）：lines＝[第一行(大), 第二行(小)…]，中心 (x,y)。
     o：{ a, col(綠), rot 傾角 rad(-0.12), sizes 每行字級([30,22]), slam 0..1（0＝放大 1.8 倍透明、1＝落定）, padX(18), padY(12), gap 行距(8) }
     字級建議 ≥22（畫布字級規則）；回傳 { w, h } */
  O1.stamp = function (c, lines, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return null;
    const col = o.col || COL.green, rot = o.rot == null ? -0.12 : o.rot, sizes = o.sizes || [30, 22], slam = o.slam == null ? 1 : clamp01(o.slam);
    const px = o.padX || 18, py = o.padY || 12, gap = o.gap || 8;
    let w = 0, h = 0;
    lines.forEach((t, i) => { const sz = sizes[Math.min(i, sizes.length - 1)]; c.save(); c.font = W5.font(sz); w = Math.max(w, c.measureText(t).width); c.restore(); h += sz + (i ? gap : 0); });
    const W = w + px * 2, H = h + py * 2, k = lerp(1.8, 1, ease(slam));
    c.save(); c.globalAlpha *= a * clamp01(slam * 2.5); c.translate(x, y); c.rotate(rot); c.scale(k, k);
    if (slam >= 1) W5.glow(c, 0, 0, Math.max(W, H) * 0.8, col, 0.16);
    c.fillStyle = 'rgba(11,26,21,0.92)'; W5.rr(c, -W / 2, -H / 2, W, H, 10); c.fill();
    c.strokeStyle = col; c.lineWidth = 4; W5.rr(c, -W / 2, -H / 2, W, H, 10); c.stroke();
    c.lineWidth = 1.6; W5.rr(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 6); c.stroke();
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
    let yy = -H / 2 + py;
    lines.forEach((t, i) => { const sz = sizes[Math.min(i, sizes.length - 1)]; c.font = W5.font(sz); c.fillText(t, 0, yy + sz / 2); yy += sz + gap; });
    c.restore();
    return { w: W, h: H };
  };

  /* 驚嘆爆炸框（「意外！」）：中心 (x,y)、r 半徑。o：{ a, col(黃), k 0..1 彈出, t 秒（輕微抖動）, txt('!') } */
  O1.burst = function (c, x, y, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const col = o.col || COL.yellow, k = o.k == null ? 1 : o.k, t = o.t || 0;
    const sc = k < 1 ? ease(k) * (1 + 0.25 * Math.sin(k * Math.PI)) : 1 + 0.03 * Math.sin(t * 6);
    if (sc <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(sc, sc); c.lineJoin = 'round';
    W5.glow(c, 0, 0, r * 1.7, col, 0.22);
    c.beginPath();
    for (let i = 0; i < 24; i++) { const th = i / 24 * TAU - Math.PI / 2, rr = i % 2 ? r * 0.72 : r * (0.98 + 0.08 * hash(i + 2)); c[i ? 'lineTo' : 'moveTo'](Math.cos(th) * rr, Math.sin(th) * rr); }
    c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#0d201a'; c.font = W5.font(Math.round(r * 1.05)); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(o.txt || '!', 0, r * 0.06);
    c.restore();
  };

  /* 一株植物（向量，綠葉）：(x,y)＝土面中心。o：{ a, g 0..1 長高, h 高(120), t 秒（葉子輕晃）, pot 是否畫土堆(true) } */
  O1.plant = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, g = o.g == null ? 1 : o.g, H = o.h || 120, t = o.t || 0; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
    if (o.pot !== false) { c.fillStyle = '#6b4a32'; c.beginPath(); c.ellipse(x, y, 46, 12, 0, Math.PI, TAU); c.fill(); c.fillStyle = '#4f3524'; c.beginPath(); c.ellipse(x, y, 46, 7, 0, 0, Math.PI); c.fill(); }
    const hh = H * ease(g), sway = Math.sin(t * 1.6) * 3;
    c.strokeStyle = '#3f8f4e'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y - 4); c.quadraticCurveTo(x - 6, y - hh * 0.5, x + sway, y - hh); c.stroke();
    const leaf = (f, side, size) => {
      if (g < f) return;
      const k = ease(clamp01((g - f) / 0.25)), lx = x + (sway * f) - 3 * (1 - f), ly = y - hh * f / Math.max(g, 0.01) * Math.min(g, 1);
      c.save(); c.translate(lx, ly); c.rotate(side * (0.9 + 0.08 * Math.sin(t * 2 + f * 5))); c.scale(k, k);
      const lg = c.createLinearGradient(0, 0, side * size, -size * 0.3); lg.addColorStop(0, '#2f7a40'); lg.addColorStop(1, '#7fd98a');
      c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(side * size * 0.5, -size * 0.45, side * size, 0); c.quadraticCurveTo(side * size * 0.5, size * 0.3, 0, 0); c.fill();
      c.strokeStyle = 'rgba(20,60,30,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(side * size * 0.85, -size * 0.05); c.stroke();
      c.restore();
    };
    leaf(0.3, -1, 40); leaf(0.48, 1, 44); leaf(0.66, -1, 38); leaf(0.82, 1, 34);
    if (g > 0.9) { const k = ease((g - 0.9) / 0.1); c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(x + sway, y - hh - 4, 9 * k, 0, TAU); c.fill(); c.fillStyle = '#ff9a6b'; c.beginPath(); c.arc(x + sway, y - hh - 4, 4 * k, 0, TAU); c.fill(); }
    c.restore();
  };

  /* 小兔子（側視，朝右；不畫人）：(x,y)＝腳底中心。o：{ a, s 縮放(1), t 秒（耳朵輕動）, hop 0..1 小跳 } */
  O1.critter = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1, t = o.t || 0; if (a <= 0.02) return;
    const hop = Math.sin(clamp01(o.hop || 0) * Math.PI) * 16;
    c.save(); c.globalAlpha *= a; c.translate(x, y - hop); c.scale(s, s); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 2 + hop / s, 40, 6, 0, 0, TAU); c.fill();
    const fur = '#e9e2d4', sh = '#b9ad98', ink = 'rgba(11,26,21,0.8)';
    c.strokeStyle = ink; c.lineWidth = 2;
    /* 尾巴、身體、後腿 */
    c.fillStyle = '#fbf8f0'; c.beginPath(); c.arc(-36, -30, 9, 0, TAU); c.fill(); c.stroke();
    const bg = c.createRadialGradient(-8, -40, 4, 0, -28, 44); bg.addColorStop(0, '#fffaf0'); bg.addColorStop(1, sh);
    c.fillStyle = bg; c.beginPath(); c.ellipse(-4, -28, 36, 27, -0.1, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = fur; c.beginPath(); c.ellipse(-16, -6, 18, 7, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(20, -4, 8, 5, 0, 0, TAU); c.fill(); c.stroke();
    /* 頭 */
    c.fillStyle = bg; c.beginPath(); c.ellipse(30, -50, 20, 17, 0.15, 0, TAU); c.fill(); c.stroke();
    /* 耳朵 */
    const ew = Math.sin(t * 2.3) * 0.08;
    [[-0.35 + ew, 20], [-0.12 - ew, 30]].forEach(([rt, ex]) => {
      c.save(); c.translate(ex, -62); c.rotate(rt);
      c.fillStyle = fur; c.beginPath(); c.ellipse(0, -22, 7, 23, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#f2a7a7'; c.beginPath(); c.ellipse(0, -21, 3.2, 16, 0, 0, TAU); c.fill();
      c.restore();
    });
    /* 眼、鼻 */
    c.fillStyle = '#2b2420'; c.beginPath(); c.arc(36, -54, 3.2, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(37, -55, 1.1, 0, TAU); c.fill();
    c.fillStyle = '#e57b8a'; c.beginPath(); c.arc(49, -47, 2.8, 0, TAU); c.fill();
    c.restore();
  };
})(window);
