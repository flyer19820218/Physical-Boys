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
   except 新增（2026-11-27）：
     O1.fxTokens(str)           化學式拆字（元素符號／下標）
     O1.fxHi(c,str,x,y,col,size,align,o)  化學式＋指定元素（預設 C）換黃色、可加光暈 → { w, hits }
     O1.card(c,x,y,w,h,o)       化學式卡片底板
     O1.rock(c,x,y,o)           石灰岩塊（示意）  O1.powder(c,x,y,o) 錶玻璃上的白粉堆  O1.bottle(c,x,y,o) 棕色試劑小瓶
   char 新增（2026-11-27）：
     O1.dspoon(c,o)             燃燒匙（杯＋長柄；內容物可由粉末變液體、變色、冒泡、被火燒）→ { rx, surf }
     O1.match(c,x,y,ang,o)      火柴（木棒＋火柴頭，可點燃）
     O1.goggles(c,x,y,o)        護目鏡（簡單向量）
     O1.lampCap(c,x,y,s,o)      酒精燈燈帽（玻璃罩）
   distill 新增（2026-11-27）：
     O1.htube(c,o)              硬質試管（橫放可傾斜：竹筷碎片、變黑、管內白煙、受熱光、管壁水珠、塞子）→ { P(d,off), ri, mouth, stopperEnd }
     O1.RIG                     乾餾裝置設計常數（桌面、夾子點、收集管、燒杯…）
     O1.rigPts(o)               乾餾裝置錨點（導管口、收集管液面、試管底、竹筷中心…；畫布座標）
     O1.rig(c,o)                整組乾餾裝置（products、smoke、竹筷乾餾動手做共用；選項與座標見函式註解）→ rigPts
     O1.spot(c,holes,o)         聚光：其他部分變暗、只留圓洞
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
      if (el !== 'H') { c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,20,26,0.85)'; c.strokeText(el, x, y + 1); }
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
  /* ══════════════════ 以下由 except（四大例外）新增，2026-11-27 ══════════════════ */

  /* 化學式拆字：元素符號（大寫＋小寫，例 Ca、Na）算一個 token；元素或 ) 後面的數字是下標。
     回傳 [{ t 字, sub 是否下標, el 是否元素符號 }] */
  O1.fxTokens = function (str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], prev = out.length ? out[out.length - 1] : null;
      if (/[A-Z]/.test(ch)) {
        let t = ch; while (i + 1 < str.length && /[a-z]/.test(str[i + 1])) t += str[++i];
        out.push({ t, sub: false, el: true });
      } else if (/[0-9]/.test(ch) && prev && (prev.el || prev.t === ')' || prev.sub)) out.push({ t: ch, sub: true, el: false });
      else out.push({ t: ch, sub: false, el: false });
    }
    return out;
  };

  /* 化學式（同 O1.fx 的字型與下標規則），但指定的元素符號換色＋可加光暈。
     o：{ hi 要標色的元素(['C'])（只比對整個元素符號：Ca、Cl、Cu 不算 C）, hiCol(黃), glow 0..1 光暈強度, a, measure 只量不畫 }
     回傳 { w 寬, hits:[{x,y}] 每個被標色元素的中心 } */
  O1.fxHi = function (c, str, x, y, col, size, align, o) {
    o = o || {}; size = size || 22; align = align || 'center'; col = col || COL.white;
    const hi = o.hi || ['C'], hiCol = o.hiCol || COL.yellow, a = o.a == null ? 1 : o.a, sub = Math.round(size * 0.68);
    const parts = O1.fxTokens(str);
    c.save();
    let w = 0;
    parts.forEach(p => { c.font = W5.font(p.sub ? sub : size, true); p.w = c.measureText(p.t).width; w += p.w; });
    let px = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    const hits = [];
    parts.forEach(p => { if (p.el && hi.indexOf(p.t) >= 0) hits.push({ x: px + p.w / 2, y }); px += p.w; });
    if (o.measure || a <= 0.02) { c.restore(); return { w, hits }; }
    c.globalAlpha *= a;
    if (o.glow > 0.02) hits.forEach(h => W5.glow(c, h.x, h.y, size * 1.3, hiCol, 0.5 * o.glow));
    px = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
    parts.forEach(p => {
      c.font = W5.font(p.sub ? sub : size, true);
      const py = y + (p.sub ? size * 0.22 : 0);
      c.lineWidth = 5; c.strokeStyle = 'rgba(13,32,26,0.92)'; c.strokeText(p.t, px, py);
      c.fillStyle = p.el && hi.indexOf(p.t) >= 0 ? hiCol : col; c.fillText(p.t, px, py); px += p.w;
    });
    c.restore();
    return { w, hits };
  };

  /* 化學式卡片（底板）：左上 (x,y)、寬 w、高 h。o：{ a, col 邊框與頂帶色(珊瑚), band 頂帶高(0＝不畫) } */
  O1.card = function (c, x, y, w, h, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const col = o.col || COL.coral;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(0,0,0,0.22)'; W5.rr(c, x + 5, y + 7, w, h, 16); c.fill();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1d3d33'); g.addColorStop(1, '#122a22');
    c.fillStyle = g; W5.rr(c, x, y, w, h, 16); c.fill();
    if (o.band) { c.save(); W5.rr(c, x, y, w, h, 16); c.clip(); c.fillStyle = W5.rgba(col, 0.16); c.fillRect(x, y, w, o.band); c.restore(); }
    c.strokeStyle = col; c.lineWidth = 2.5; W5.rr(c, x, y, w, h, 16); c.stroke();
    c.restore();
  };

  /* 石灰岩塊（示意）：底部中心 (x,y)、o：{ a, s 縮放(1), seed } —— 灰白色、帶層紋與小斑點 */
  O1.rock = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1, seed = o.seed || 3; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 2, 58, 8, 0, 0, TAU); c.fill();
    const P = [[-56, 0], [-50, -30], [-28, -52], [6, -60], [36, -48], [56, -22], [52, 0]];
    const shape = () => { c.beginPath(); P.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0] + (hash(seed + i) - 0.5) * 6, p[1] + (hash(seed * 3 + i) - 0.5) * 6)); c.closePath(); };
    shape();
    const g = c.createLinearGradient(-40, -60, 40, 0); g.addColorStop(0, '#f1efe6'); g.addColorStop(0.55, '#cfccbf'); g.addColorStop(1, '#8f8c80');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2.2; c.stroke();
    c.save(); shape(); c.clip();
    c.strokeStyle = 'rgba(120,116,100,0.55)'; c.lineWidth = 1.6;
    [-14, -30, -44].forEach((yy, i) => { c.beginPath(); c.moveTo(-60, yy + 4); c.bezierCurveTo(-20, yy - 4 + i * 2, 20, yy + 6, 60, yy - 2); c.stroke(); });
    c.fillStyle = 'rgba(110,106,92,0.6)';
    for (let i = 0; i < 16; i++) { c.beginPath(); c.arc((hash(seed * 5 + i) - 0.5) * 100, -hash(seed * 7 + i) * 52, 1.2 + hash(i + seed) * 1.6, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-34, -44); c.lineTo(-6, -54); c.stroke();
    c.restore();
  };

  /* 一小堆白色粉末放在錶玻璃上（示意）：底部中心 (x,y)、o：{ a, s 縮放(1), k 0..1 粉堆高度, col 粉末色 } */
  O1.powder = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1, k = o.k == null ? 1 : o.k; if (a <= 0.02) return;
    const col = o.col || '#f8f8f2';
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 3, 66, 8, 0, 0, TAU); c.fill();
    /* 錶玻璃 */
    c.fillStyle = 'rgba(190,230,240,0.22)'; c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-62, -12); c.quadraticCurveTo(0, 12, 62, -12); c.stroke();
    c.beginPath(); c.ellipse(0, -12, 62, 7, 0, 0, TAU); c.fill(); c.stroke();
    /* 粉堆 */
    const h = 46 * ease(k);
    if (h > 1) {
      c.beginPath(); c.moveTo(-46, -10); c.bezierCurveTo(-30, -12 - h * 0.6, -14, -12 - h, 0, -12 - h);
      c.bezierCurveTo(14, -12 - h, 30, -12 - h * 0.6, 46, -10); c.closePath();
      const g = c.createLinearGradient(-30, -12 - h, 30, -8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, col); g.addColorStop(1, '#c9cec6');
      c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(120,130,122,0.9)'; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = 'rgba(150,160,150,0.55)';
      for (let i = 0; i < 12; i++) { const px = (hash(i * 3 + 1) - 0.5) * 60, py = -12 - hash(i * 5 + 2) * h * 0.7 * (1 - Math.abs(px) / 50); c.beginPath(); c.arc(px, py, 1.3, 0, TAU); c.fill(); }
    }
    c.restore();
  };

  /* 試劑小瓶（棕色玻璃＋瓶蓋＋空白標籤，示意；不畫任何警告圖案）：底部中心 (x,y)、o：{ a, s 縮放(1), cap 瓶蓋色 } */
  O1.bottle = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 2, 40, 7, 0, 0, TAU); c.fill();
    /* 瓶身 */
    const g = c.createLinearGradient(-34, 0, 34, 0); g.addColorStop(0, '#5a3418'); g.addColorStop(0.4, '#9a6232'); g.addColorStop(1, '#4a2a12');
    c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-34, 0); c.lineTo(-34, -64); c.quadraticCurveTo(-34, -78, -16, -82); c.lineTo(-16, -92); c.lineTo(16, -92); c.lineTo(16, -82);
    c.quadraticCurveTo(34, -78, 34, -64); c.lineTo(34, 0); c.closePath(); c.fill(); c.stroke();
    /* 瓶蓋 */
    c.fillStyle = o.cap || '#4a555c'; W5.rr(c, -19, -108, 38, 18, 4); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.2; for (let i = -12; i <= 12; i += 6) { c.beginPath(); c.moveTo(i, -106); c.lineTo(i, -92); c.stroke(); }
    /* 空白標籤 */
    c.fillStyle = '#efe9d8'; W5.rr(c, -26, -58, 52, 40, 4); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(120,110,90,0.7)'; c.lineWidth = 2;
    [-48, -38, -28].forEach((yy, i) => { c.beginPath(); c.moveTo(-18, yy); c.lineTo(i === 2 ? 6 : 18, yy); c.stroke(); });
    /* 反光 */
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, -66); c.lineTo(-26, -8); c.stroke();
    c.restore();
  };
  /* ══════════════════ 以下由 char（三種白色粉末加熱）新增，2026-11-27 ══════════════════ */

  /* 燃燒匙（側視；沒有手）：小杯在下、長柄垂直往上（柄在杯右側 off px，末端彎進杯緣）。
     o：{ x 杯中心 x, y 杯口（杯緣橢圓中心）y, top 柄頂 y, off 柄相對杯中心的水平位移(30×s), s 縮放(1)（原寸杯寬 52、杯深約 16）, a,
          load 0..1 內容物量（0＝空杯）, col 內容物顏色（CSS 色字串）, edge 內容物描邊色, melt 0..1（0＝粉末堆成小丘、1＝熔成平的液面）,
          clear 0..1 液體透亮程度（會變半透明＋反光）, grain 0..1 粉粒紋理（預設 1−melt）, heat 0..1 杯底被火燒的橘光, bubble 0..1 液面冒泡, t 秒, seed }
     回傳 { rx 柄的 x, surf 內容物頂端 y }（給煙、跳動顆粒定位用） */
  O1.dspoon = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, S = o.s || 1;
    const X = o.x, Y = o.y, off = o.off == null ? 30 * S : o.off, top0 = o.top == null ? Y - 160 * S : o.top;
    const load = clamp01(o.load == null ? 1 : o.load), melt = clamp01(o.melt || 0), hM = 13 * load * (1 - melt);
    const g = { rx: X + off, surf: Y - (hM + 3) * S };
    if (a <= 0.02) return g;
    /* 以杯口中心為原點、縮放 S 後畫（下面的 x、y、rx、top 都是區域座標） */
    const x = 0, y = 0, rx = off / S, top = (top0 - Y) / S;
    const R = 26, RY = 7, seed = o.seed || 1, t = o.t || 0;
    c.save(); c.globalAlpha *= a; c.translate(X, Y); c.scale(S, S); c.lineCap = 'round'; c.lineJoin = 'round';
    /* 柄：垂直往下，末端彎進杯緣 */
    const rod = (w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(rx, top); c.lineTo(rx, y - 8); c.quadraticCurveTo(rx, y - 1, x + R - 4, y - 1); c.stroke(); };
    rod(8, 'rgba(11,26,21,0.85)'); rod(4.5, '#c3cdd2');
    c.fillStyle = '#8f9ca3'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5; c.beginPath(); c.arc(rx, top, 5, 0, TAU); c.fill(); c.stroke();
    /* 杯內（後半） */
    c.fillStyle = '#4d5a61'; c.beginPath(); c.ellipse(x, y, R, RY, 0, 0, TAU); c.fill();
    /* 內容物 */
    if (load > 0.02) {
      const cl = clamp01(o.clear || 0);
      c.save(); c.globalAlpha *= 1 - 0.35 * cl;
      c.fillStyle = o.col || '#f4f2ec'; c.strokeStyle = o.edge || 'rgba(111,135,144,0.9)'; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(x, y + 1, R - 4, RY - 1.5 + hM, 0, Math.PI, TAU); c.ellipse(x, y + 1, R - 4, RY - 1.5, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
      c.restore();
      /* 粉粒紋理 */
      const gr = clamp01(o.grain == null ? 1 - melt : o.grain);
      if (gr > 0.02) {
        c.save(); c.globalAlpha *= gr * 0.55; c.fillStyle = o.edge || 'rgba(111,135,144,0.9)';
        for (let i = 0; i < 16; i++) {
          const px = x + (hash(seed * 11 + i) - 0.5) * (R - 8) * 2, rel = 1 - Math.pow((px - x) / (R - 4), 2);
          const py = y + 1 - (RY - 2 + hM) * Math.sqrt(Math.max(0, rel)) * hash(seed * 5 + i * 3) * 0.9;
          c.fillRect(px - 1, py - 1, 2, 2);
        }
        c.restore();
      }
      /* 液面反光 */
      if (melt > 0.02) {
        c.save(); c.globalAlpha *= melt * (0.35 + 0.5 * cl); c.strokeStyle = '#ffffff'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(x - 4, y, R - 12, RY - 3.5, 0, Math.PI * 1.1, Math.PI * 1.55); c.stroke(); c.restore();
      }
      /* 冒泡 */
      const bb = clamp01(o.bubble || 0);
      if (bb > 0.02) {
        c.save(); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 1.3;
        for (let i = 0; i < 6; i++) {
          const ph = (t * (0.9 + 0.5 * hash(seed + i * 7)) + hash(seed * 3 + i)) % 1, rr = (1.5 + 2.5 * hash(i + 9)) * Math.sin(ph * Math.PI) * bb;
          if (rr < 0.4) continue;
          c.beginPath(); c.arc(x + (hash(seed * 2 + i * 5) - 0.5) * (R - 10) * 2, y - hM * 0.5 - 1, rr, 0, TAU); c.stroke();
        }
        c.restore();
      }
    }
    /* 杯身（前半，金屬） */
    const body = () => { c.beginPath(); c.moveTo(x - R, y); c.bezierCurveTo(x - R + 1, y + 22, x + R - 1, y + 22, x + R, y); c.ellipse(x, y, R, RY, 0, 0, Math.PI, false); c.closePath(); };
    const mg = c.createLinearGradient(x - R, 0, x + R, 0); mg.addColorStop(0, '#7f8c93'); mg.addColorStop(0.4, '#dfe6ea'); mg.addColorStop(1, '#6d7a82');
    c.fillStyle = mg; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; body(); c.fill(); c.stroke();
    /* 被火燒：杯底橘光 */
    const ht = clamp01(o.heat || 0);
    if (ht > 0.02) { c.save(); body(); c.clip(); W5.glow(c, x, y + 18, 30, '#ff8040', 0.7 * ht); c.restore(); }
    /* 杯緣 */
    c.strokeStyle = '#e8eef0'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, R, RY, 0, 0, TAU); c.stroke();
    c.restore();
    return g;
  };

  /* 火柴（沒有手）：火柴頭在 (x,y)，木棒往 ang 方向伸出（rad，0＝往右）。
     o：{ a, len 木棒長(70), lit 0..1 頭上火焰大小, burnt 0..1 頭燒黑程度, t 秒 } */
  O1.match = function (c, x, y, ang, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const len = o.len || 70, lit = clamp01(o.lit || 0), bt = clamp01(o.burnt || 0);
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    c.save(); c.translate(x, y); c.rotate(ang);
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 8; c.beginPath(); c.moveTo(4, 0); c.lineTo(len, 0); c.stroke();
    c.strokeStyle = '#dcb87a'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(4, 0); c.lineTo(len, 0); c.stroke();
    c.fillStyle = W5.mix('#c0392b', '#2a2320', bt); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(2, 0, 8, 6, 0, 0, TAU); c.fill(); c.stroke();
    c.restore();
    if (lit > 0.02) O1.flame(c, x, y + 4, 30 * lit, o.t || 0, { w: 9 * lit });
    c.restore();
  };

  /* 護目鏡（簡單向量）：中心 (x,y)。o：{ a, s 縮放(1)（原寸約 100×36）, col 鏡框色(綠) } */
  O1.goggles = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1; if (a <= 0.02 || s <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    /* 鬆緊帶 */
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(-52, -3); c.lineTo(-46, 0); c.moveTo(52, -3); c.lineTo(46, 0); c.stroke();
    c.strokeStyle = '#3f8f7a'; c.lineWidth = 5; c.beginPath(); c.moveTo(-52, -3); c.lineTo(-46, 0); c.moveTo(52, -3); c.lineTo(46, 0); c.stroke();
    /* 鏡框＋鏡片 */
    const col = o.col || COL.green;
    [-1, 1].forEach(sg => {
      const x0 = sg > 0 ? 4 : -46;
      c.fillStyle = 'rgba(11,26,21,0.9)'; W5.rr(c, x0, -18, 42, 36, 12); c.fill();
      c.strokeStyle = col; c.lineWidth = 3; W5.rr(c, x0, -18, 42, 36, 12); c.stroke();
      c.fillStyle = 'rgba(77,210,255,0.35)'; W5.rr(c, x0 + 5, -13, 32, 26, 9); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 10, -6); c.lineTo(x0 + 18, -10); c.stroke();
    });
    /* 鼻樑 */
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(-4, -4); c.quadraticCurveTo(0, -9, 4, -4); c.stroke();
    c.restore();
  };

  /* 酒精燈的燈帽（玻璃罩，蓋上就熄火）：(x,y)＝帽口中心（蓋在燈上時約在 O1.lamp 的桌面 y − 44×s），s＝跟 O1.lamp 同一個縮放。o：{ a } */
  O1.lampCap = function (c, x, y, s, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    const g = c.createLinearGradient(-15, 0, 15, 0); g.addColorStop(0, 'rgba(160,215,230,0.45)'); g.addColorStop(0.5, 'rgba(225,245,255,0.22)'); g.addColorStop(1, 'rgba(120,190,210,0.45)');
    c.fillStyle = g; c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(-14, -22); c.quadraticCurveTo(-13, -34, 0, -35); c.quadraticCurveTo(13, -34, 14, -22); c.lineTo(15, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-9, -6); c.lineTo(-9, -24); c.stroke();
    c.restore();
  };

  /* ══════════════════ 以下由 distill（乾餾裝置）新增，2026-11-27 ══════════════════
     O1.htube(c,o)    硬質試管（橫放、可傾斜；內裝竹筷碎片、白煙、受熱光、管壁水珠、管口塞子）
     O1.rigPts(o)     乾餾裝置的關鍵錨點（不畫，只算座標；給標籤、圓圈、放大鏡定位）
     O1.rig(c,o)      整組乾餾裝置（鐵架＋硬質試管＋竹筷＋塞子＋導管＋收集管＋冷水燒杯＋出氣導管＋酒精燈）
     O1.spot(c,holes,o)  聚光：整張畫布變暗，只留幾個圓洞（「其他部分變暗」） */

  /* 硬質試管（側視，閉口端在左、管口在右；沒有手）。
     座標：(x,y)＝閉口端外側尖端（管軸上），ang＝管軸方向（rad，0＝水平往右，正值＝管口往下傾斜），len 管長(300)，r 外半徑(22)，管壁 3.5 px。
       管軸上距閉口端 d 的點＝(x + d·cos ang, y + d·sin ang)；管口在 d = len。
     o：{ x, y, ang(0.08), len(300), r(22), a, t 秒,
          chips 0..1 竹筷碎片量（依序出現，0＝空管）, dark 0..1 竹筷變黑（黃褐→褐→黑）, chip0(10)/chip1(125) 碎片所在的管軸範圍, seed,
          smoke 0..1 管內白煙（從碎片往管口飄，限制在管內）, heat 0..1 管底受熱橘光, heatD 受熱處的管軸距離（預設碎片中間）,
          dew 0..1 管口附近管壁小水珠, dewSlide 0..1 水珠沿下管壁往管口滑（0＝原位、1＝滑到塞子邊聚成一小灘）,
          stopper 'none' | 'plug'（實心塞，不通氣）| 'hole'（單孔塞，導管由 rig 畫）（預設 'none'） }
     回傳 { P(d, off) 管軸距離 d、垂直管軸偏移 off（正＝往下）的畫布點, ri 內半徑, mouth, stopperEnd 塞子外端中心 } */
  O1.htube = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a;
    const X = o.x, Y = o.y, ang = o.ang == null ? 0.08 : o.ang, len = o.len || 300, r = o.r || 22, ri = r - 3.5, t = o.t || 0, seed = o.seed || 4;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const P = (d, off) => ({ x: X + d * ca - (off || 0) * sa, y: Y + d * sa + (off || 0) * ca });
    const g = { P, ri, r, len, mouth: P(len, 0), stopperEnd: P(len + 20, 0) };
    if (a <= 0.02) return g;
    const chips = clamp01(o.chips || 0), dark = clamp01(o.dark || 0), c0 = o.chip0 == null ? 10 : o.chip0, c1 = o.chip1 == null ? 125 : o.chip1;
    c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(ang); c.lineJoin = 'round'; c.lineCap = 'round';
    /* 管外形（區域座標：x 沿管軸 0..len，y 垂直管軸） */
    const outer = () => { c.beginPath(); c.moveTo(len, -r); c.lineTo(r, -r); c.arc(r, 0, r, -Math.PI / 2, Math.PI / 2, true); c.lineTo(len, r); };
    const inner = () => { c.beginPath(); c.moveTo(len, -ri); c.lineTo(r, -ri); c.arc(r, 0, ri, -Math.PI / 2, Math.PI / 2, true); c.lineTo(len, ri); c.closePath(); };
    /* 玻璃底色 */
    outer(); c.closePath();
    const gg = c.createLinearGradient(0, -r, 0, r);
    gg.addColorStop(0, 'rgba(160,215,230,0.24)'); gg.addColorStop(0.45, 'rgba(225,245,255,0.07)'); gg.addColorStop(1, 'rgba(120,190,210,0.22)');
    c.fillStyle = gg; c.fill();
    /* 管內：受熱光、竹筷、白煙、水珠（clip 在內壁） */
    c.save(); inner(); c.clip();
    const ht = clamp01(o.heat || 0), hd = o.heatD == null ? (c0 + c1) / 2 : o.heatD;
    if (ht > 0.02) W5.glow(c, hd, ri, 70, '#ff8040', 0.45 * ht);
    if (chips > 0.02) {
      const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const mixc = (p, q, k) => { const A = hx(p), B = hx(q); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp01(k))).join(',') + ')'; };
      const base = dark < 0.5 ? mixc('#c9a063', '#7a4a24', dark * 2) : mixc('#7a4a24', '#2a221d', dark * 2 - 1);
      const edge = dark < 0.6 ? 'rgba(60,36,16,0.9)' : 'rgba(150,140,128,0.9)';   /* 變黑後改淺色描邊，黑炭在深底上也看得見 */
      const N = 22;
      for (let i = 0; i < N; i++) {
        const k = clamp01(chips * N - i); if (k <= 0) break;
        const h1 = hash(seed * 17 + i * 3.3), h2 = hash(seed * 5 + i * 7.1), h3 = hash(seed * 11 + i * 2.9);
        const L2 = 16 + 16 * h1, w = 4.5 + 2 * h2;
        const layer = i < 12 ? 0 : 1;
        const cx = c0 + 10 + (c1 - c0 - 20) * ((i * 0.618 + h3 * 0.3) % 1);
        const cy = ri - 4 - layer * 8 - h2 * 3;
        /* 剛放進去：從管口那側滑進來 */
        const slide = (1 - ease(k)) * 60;
        c.save(); c.translate(cx + slide, cy); c.rotate((h3 - 0.5) * 0.7);
        c.fillStyle = base; c.strokeStyle = edge; c.lineWidth = 1.3;
        c.beginPath(); W5.rr(c, -L2 / 2, -w / 2, L2, w, 1.5); c.fill(); c.stroke();
        c.strokeStyle = dark < 0.6 ? 'rgba(255,240,200,0.35)' : 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-L2 / 2 + 3, -w * 0.15); c.lineTo(L2 / 2 - 3, -w * 0.15); c.stroke();
        c.restore();
      }
    }
    const sm = clamp01(o.smoke || 0);
    if (sm > 0.02) {
      for (let i = 0; i < 26; i++) {
        const ph = (t * (0.28 + 0.12 * hash(i + 41)) + hash(i * 3 + 7)) % 1;
        const px = lerp(c0 + 20, len - 10, ph), py = (hash(i * 5 + 2) - 0.5) * ri * 1.4 - 4 + Math.sin(ph * 7 + i) * 3, rr = 8 + 7 * ph;
        const al = sm * Math.min(1, ph * 5) * (1 - 0.5 * ph) * 0.85;
        const rg = c.createRadialGradient(px, py, 0, px, py, rr); rg.addColorStop(0, 'rgba(240,244,242,' + al.toFixed(3) + ')'); rg.addColorStop(1, 'rgba(240,244,242,0)');
        c.fillStyle = rg; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
      }
    }
    const dw = clamp01(o.dew || 0), ds = clamp01(o.dewSlide || 0);
    if (dw > 0.02) {
      const stopX = o.stopper && o.stopper !== 'none' ? len - 14 : len - 2;
      c.fillStyle = 'rgba(180,232,255,0.9)'; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const x0 = 170 + i * 18 + hash(i + 61) * 8, k = ease(clamp01(ds * 1.25 - i * 0.05));
        const px = lerp(x0, stopX - 6 - (i % 3) * 5, k), py = ri - 3 - (i % 2) * 2 * (1 - k), rr = (2.6 + 1.2 * hash(i + 3)) * dw;
        c.beginPath(); c.ellipse(px, py, rr * (1 + 0.5 * k), rr, 0, 0, TAU); c.fill(); c.stroke();
      }
      /* 管上壁凝結的小水珠（不動） */
      for (let i = 0; i < 5; i++) {
        const px = 185 + i * 22 + hash(i + 81) * 8, rr = (2 + hash(i + 13)) * dw;
        c.beginPath(); c.arc(px, -ri + 3, rr, 0, TAU); c.fill(); c.stroke();
      }
      /* 管口聚成一小灘 */
      if (ds > 0.5) { c.fillStyle = 'rgba(150,220,255,0.55)'; c.beginPath(); c.ellipse(stopX - 10, ri - 1, 16 * ease((ds - 0.5) * 2), 3.5, 0, 0, TAU); c.fill(); }
    }
    c.restore();
    /* 塞子 */
    if (o.stopper && o.stopper !== 'none') {
      const sg = c.createLinearGradient(0, -r, 0, r); sg.addColorStop(0, '#7b6f66'); sg.addColorStop(0.5, '#5a504a'); sg.addColorStop(1, '#3e3733');
      c.fillStyle = sg; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(len - 14, -ri + 1); c.lineTo(len + 20, -ri - 4); c.lineTo(len + 20, ri + 4); c.lineTo(len - 14, ri - 1); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(len - 10, -ri + 5); c.lineTo(len + 16, -ri + 1); c.stroke();
    }
    /* 玻璃壁 */
    outer(); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 7; c.stroke();
    outer(); c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 3.5; c.stroke();
    c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 4; c.beginPath(); c.moveTo(len, -r - 3); c.lineTo(len, -r + 2); c.moveTo(len, r - 2); c.lineTo(len, r + 3); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(r + 6, -r + 7); c.lineTo(len - 24, -r + 7); c.stroke();
    c.restore();
    return g;
  };

  /* ─────────── 乾餾裝置 ───────────
     設計座標（s = 1、x = y = 0 時就是 960×540 畫布座標；distill 動畫用原寸）：
       桌面 GY = 452（裝置自己不畫桌子，除非 o.bench）。
       鐵架：直桿在 x 370（y 196～440，畫在試管後面），底座 300～440；夾子夾在試管上、管軸通過 C (370, 276)。
       硬質試管：以夾子點 C 為支點傾斜 tubeTilt（預設 0.08 rad ≈ 4.6°，管口略向下）；閉口端在 C 往左 245 px、管口在 C 往右 55 px（管長 300、外半徑 22）。
         tubeTilt = 0.08 時：閉口端尖 ≈ (126, 256)、管口 ≈ (425, 280)、塞子外端 ≈ (445, 282)。
         竹筷碎片：管軸距離 10～125（中心 ≈ (193, 262)），躺在下管壁。
       導管（玻璃）：塞子外端 → 沿管軸再 24 px → 水平往右到 x 653 → 轉彎往下穿過收集管塞子 → 管端 y 370（在收集管裡、液面上方）。
       收集管：直立試管，中線 x 660，管口 y 310（雙孔塞 300～324），外底 y 440（內底 ≈ 436），外半徑 17。
         液體：內底往上最多 50 px（liquidAmt = 1 時液面 y 386）；焦油：最底層，最多 16 px 厚。
       出氣導管：從收集管塞子右孔（x 667）往上到 y 252，彎向右上，管口（＝「導管口」，氣體出口）≈ (704, 238)。
       燒杯（冷水）：x 605～715，杯口 y 340，杯底＝桌面 452；水面 y 360。
       酒精燈：O1.lamp 縮放 1.3，底在桌面；lampX 預設＝竹筷中心 x（≈ 193）；火焰從 y 374 往上 lampFlameH（預設 115）→ 焰尖 ≈ y 259，外焰包住管底。
       預熱時酒精燈來回移動的合理範圍：lampX 150～330（再右會撞到鐵架底座）。
     整組變換：畫布點 ＝ (o.x + s·設計x, o.y + s·設計y)。縮小放到別處時給 x、y、s；所有錨點都已換成畫布座標。
     o（全部可省略）：
       x, y 平移(0,0)；s 縮放(1)；a 整體透明度；t 秒（火焰閃動、煙、滴落）；
       tubeTilt 試管傾角 rad(0.08，正＝管口往下)；
       lampX 酒精燈 x（設計座標）；lampOn 是否點燃；lampFlameH 火焰高（設計 px，115）；lampLift 酒精燈往下沉多少 px（出場動畫用，0）；
       heat 0..1 管底受熱橘光（位置跟著 lampX）；
       chips 0..1 竹筷碎片量（依序滑進管底）(1)；chipsDarkness 0..1 竹筷變黑；
       smokeAmt 0..1 試管內白煙＋收集管上方白霧；gasAmt 0..1 導管口冒出的白色氣體；gasCol 氣體顏色('#eef2f0')；
       liquidAmt 0..1 收集管的黃褐色液體；tarAmt 0..1 底部黑褐色焦油；drip 0..1 導管端滴下液滴；
       dew 0..1 管口附近管壁水珠；dewSlide 0..1 水珠沿下管壁滑向管口；
       parts { stand, tube, chips, stopper, delivery, collector, outlet, beaker, lamp } 各零件透明度 0..1（預設全 1；依序出現用）；
       grow { delivery, outlet } 0..1 導管「長出來」的比例（預設 1）；
       bench true 時自己畫桌面（M3.slab，設計 x 20～760）；
       labels true／false／{ tube, chips, stopper, delivery, collector, water, lamp, stand, outlet: 透明度 }（標籤永遠用 22px、畫在畫布座標，不跟著 s 縮小；
         true＝tube、chips、delivery、collector、water、lamp 六個；縮小使用時請自己放標籤）。
     回傳 O1.rigPts(o)（見下）。 */
  const RIG = { GY: 452, CX: 370, CY: 276, BACK: 245, LEN: 300, TR: 22, COLX: 660, COL_TOP: 310, COL_BOT: 440, COL_R: 17,
    BK_X0: 605, BK_X1: 715, BK_TOP: 340, WATER: 360, LAMP_S: 1.3, IN_END: 370, LIQ_MAX: 50, TAR_MAX: 16 };
  O1.RIG = RIG;

  /* 乾餾裝置錨點（畫布座標）。o 同 O1.rig（只看 x、y、s、tubeTilt、lampX、lampFlameH、liquidAmt、tarAmt）。
     回傳 {
       s, map(dx,dy) 設計座標→畫布座標,
       bottom  試管閉口端外側尖端（管軸上）     bottomIn 試管底內側（＝「試管底」，黑色固體所在）
       chips   竹筷碎片堆中心                  chipsR 碎片堆大約半徑（畫布 px，圓圈用）
       clamp   夾子點（管軸）                  mouth 試管口中心      stopper 塞子外端中心
       bend    導管水平段轉彎處                inletEnd 導管在收集管內的管端
       colTop  收集管管口中心                  colBottom 收集管內底   liquidTop 目前液面中心（liquidAmt）   liquidMax 液面最高時中心
       liquidMid 目前液體中段中心（圓圈用）      tar 焦油層中心
       outlet  出氣導管口（＝導管口，氣體出口）  gasTop 氣體往上飄約 120 px 處
       beaker { x0, x1, top, bottom, water }   lamp 酒精燈底座中心（桌面）  wick 燈芯頂  flameTip 焰尖
     } */
  O1.rigPts = function (o) {
    o = o || {}; const S = o.s || 1, ox = o.x || 0, oy = o.y || 0, th = o.tubeTilt == null ? 0.08 : o.tubeTilt;
    const map = (dx, dy) => ({ x: ox + S * dx, y: oy + S * dy });
    const ca = Math.cos(th), sa = Math.sin(th);
    const bx = RIG.CX - RIG.BACK * ca, by = RIG.CY - RIG.BACK * sa;
    const ax = d => ({ x: bx + d * ca, y: by + d * sa });
    const st = ax(RIG.LEN + 20), p1 = { x: st.x + 24 * ca, y: st.y + 24 * sa };
    const lx = o.lampX == null ? ax(67.5).x : o.lampX, fh = o.lampFlameH == null ? 115 : o.lampFlameH;
    const inB = RIG.COL_BOT - 4, liq = clamp01(o.liquidAmt || 0), tar = clamp01(o.tarAmt || 0);
    const lt = inB - RIG.LIQ_MAX * liq, th2 = RIG.TAR_MAX * tar;
    const flameBase = RIG.GY - 60 * RIG.LAMP_S;
    return {
      s: S, map, tilt: th,
      bottom: map(bx, by), bottomIn: map(ax(RIG.TR).x, ax(RIG.TR).y), chips: map(ax(67.5).x, ax(67.5).y + 6), chipsR: 75 * S,
      clamp: map(RIG.CX, RIG.CY), mouth: map(ax(RIG.LEN).x, ax(RIG.LEN).y), stopper: map(st.x, st.y),
      bend: map(RIG.COLX - 7, p1.y), inletEnd: map(RIG.COLX - 7, RIG.IN_END),
      colTop: map(RIG.COLX, RIG.COL_TOP), colBottom: map(RIG.COLX, inB),
      liquidTop: map(RIG.COLX, lt), liquidMax: map(RIG.COLX, inB - RIG.LIQ_MAX), liquidMid: map(RIG.COLX, (Math.min(lt, inB - 20) + inB) / 2),
      tar: map(RIG.COLX, inB - Math.max(th2, 4) / 2),
      outlet: map(RIG.COLX + 44, 238), gasTop: map(RIG.COLX + 74, 118),
      beaker: { x0: ox + S * RIG.BK_X0, x1: ox + S * RIG.BK_X1, top: oy + S * RIG.BK_TOP, bottom: oy + S * RIG.GY, water: oy + S * RIG.WATER },
      lamp: map(lx, RIG.GY), wick: map(lx, RIG.GY - 62 * RIG.LAMP_S), flameTip: map(lx, flameBase - fh),
      _d: { bx, by, ca, sa, st, p1, lx, fh, inB, lt, th2, flameBase }
    };
  };

  O1.rig = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, t = o.t || 0, S = o.s || 1;
    const R = O1.rigPts(o), D = R._d;
    if (a <= 0.02) return R;
    const pa = k => { const p = o.parts && o.parts[k]; return p == null ? 1 : clamp01(p); };
    const gr = k => { const p = o.grow && o.grow[k]; return p == null ? 1 : clamp01(p); };
    c.save(); c.globalAlpha *= a; c.translate(o.x || 0, o.y || 0); c.scale(S, S); c.lineCap = 'round'; c.lineJoin = 'round';
    const GY = RIG.GY, CX = RIG.CX, COLX = RIG.COLX;
    /* 桌面（選用） */
    if (o.bench && typeof M3 !== 'undefined') { M3.slab(c, 20, GY, 760, GY + 14, 'wood', { seed: 6 }); }
    /* 玻璃管（導管）：沿折線畫，k＝長出來的比例 */
    const glassPath = (pts, k, rad) => {
      /* 依總長截斷 */
      let tot = 0; const segs = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(l); tot += l; }
      let rem = tot * k; const out = [pts[0]];
      for (let i = 1; i < pts.length && rem > 0; i++) {
        const l = segs[i - 1], f = Math.min(1, rem / l);
        out.push({ x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f) }); rem -= l;
      }
      if (out.length < 2) return;
      const path = () => { c.beginPath(); c.moveTo(out[0].x, out[0].y); for (let i = 1; i < out.length - 1; i++) c.arcTo(out[i].x, out[i].y, out[i + 1].x, out[i + 1].y, rad || 10); c.lineTo(out[out.length - 1].x, out[out.length - 1].y); };
      path(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 11; c.stroke();
      path(); c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 7; c.stroke();
      path(); c.strokeStyle = 'rgba(40,70,70,0.9)'; c.lineWidth = 2.5; c.stroke();
    };

    /* ① 鐵架（在試管後面） */
    const aSt = pa('stand');
    if (aSt > 0.02) {
      c.save(); c.globalAlpha *= aSt;
      const bg = c.createLinearGradient(0, GY - 12, 0, GY); bg.addColorStop(0, '#6d7a82'); bg.addColorStop(1, '#3d474d');
      c.fillStyle = bg; W5.rr(c, CX - 70, GY - 12, 140, 12, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
      const rg = c.createLinearGradient(CX - 4, 0, CX + 4, 0); rg.addColorStop(0, '#dfe6ea'); rg.addColorStop(1, '#7d8a92');
      c.fillStyle = rg; c.fillRect(CX - 4, 196, 8, GY - 12 - 196); c.strokeRect(CX - 4, 196, 8, GY - 12 - 196);
      c.fillStyle = '#4a555c'; c.fillRect(CX - 9, RIG.CY - 50, 18, 18); c.strokeRect(CX - 9, RIG.CY - 50, 18, 18);
      /* 夾臂：十字夾往下伸到試管上方 */
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(CX + 9, RIG.CY - 41); c.lineTo(CX + 14, RIG.CY - 41); c.lineTo(CX + 14, RIG.CY - 30); c.stroke();
      c.strokeStyle = '#a9b6bd'; c.lineWidth = 5; c.beginPath(); c.moveTo(CX + 9, RIG.CY - 41); c.lineTo(CX + 14, RIG.CY - 41); c.lineTo(CX + 14, RIG.CY - 30); c.stroke();
      c.restore();
    }

    /* ② 燒杯（後半）＋冷水 */
    const aBk = pa('beaker');
    const bk = () => { c.beginPath(); c.moveTo(RIG.BK_X0 - 4, RIG.BK_TOP); c.lineTo(RIG.BK_X0, GY - 6); c.quadraticCurveTo(RIG.BK_X0, GY, RIG.BK_X0 + 6, GY); c.lineTo(RIG.BK_X1 - 6, GY); c.quadraticCurveTo(RIG.BK_X1, GY, RIG.BK_X1, GY - 6); c.lineTo(RIG.BK_X1 + 4, RIG.BK_TOP); };
    if (aBk > 0.02) {
      c.save(); c.globalAlpha *= aBk;
      bk(); c.closePath(); c.fillStyle = 'rgba(160,215,230,0.10)'; c.fill();
      const wg = c.createLinearGradient(0, RIG.WATER, 0, GY); wg.addColorStop(0, 'rgba(77,210,255,0.34)'); wg.addColorStop(1, 'rgba(77,210,255,0.20)');
      c.fillStyle = wg; c.fillRect(RIG.BK_X0 + 2, RIG.WATER, RIG.BK_X1 - RIG.BK_X0 - 4, GY - RIG.WATER - 2);
      c.strokeStyle = 'rgba(160,235,255,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(RIG.BK_X0 + 2, RIG.WATER); c.lineTo(RIG.BK_X1 - 2, RIG.WATER); c.stroke();
      c.restore();
    }

    /* ③ 酒精燈＋火焰（在試管後面，外焰包住管底） */
    const aLp = pa('lamp');
    if (aLp > 0.02) {
      O1.lamp(c, D.lx, GY + (o.lampLift || 0), { s: RIG.LAMP_S, on: false, a: aLp });
      if (o.lampOn) O1.flame(c, D.lx, D.flameBase + (o.lampLift || 0), D.fh * (o.lampOn === true ? 1 : clamp01(o.lampOn)), t, { a: aLp, w: 22 });
    }

    /* ④ 硬質試管＋竹筷＋塞子 */
    const aTb = pa('tube'), aCh = pa('chips'), aSp = pa('stopper');
    const tubeO = { x: D.bx, y: D.by, ang: R.tilt, len: RIG.LEN, r: RIG.TR, t, seed: 4,
      chips: (o.chips == null ? 1 : o.chips) * (aCh > 0.02 ? 1 : 0), dark: o.chipsDarkness || 0,
      smoke: o.smokeAmt || 0, heat: (o.heat || 0), heatD: (D.lx - D.bx) / D.ca, dew: o.dew || 0, dewSlide: o.dewSlide || 0,
      stopper: aSp > 0.5 ? 'hole' : 'none' };
    if (aTb > 0.02) {
      /* 塞子淡入：先畫沒塞子的管，再疊一次有塞子的 */
      if (aSp > 0.02 && aSp < 0.98) { O1.htube(c, Object.assign({}, tubeO, { a: aTb, stopper: 'none' })); O1.htube(c, Object.assign({}, tubeO, { a: aTb * aSp, stopper: 'hole' })); }
      else O1.htube(c, Object.assign({}, tubeO, { a: aTb }));
    }
    /* 夾子（夾在試管上，畫在試管前面） */
    if (aSt > 0.02) {
      c.save(); c.globalAlpha *= aSt; c.translate(CX, RIG.CY); c.rotate(R.tilt);
      c.fillStyle = '#c49a6c'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
      [-1, 1].forEach(sg => { W5.rr(c, -12, sg < 0 ? -RIG.TR - 8 : RIG.TR + 1, 24, 7, 2); c.fill(); c.stroke(); });
      c.strokeStyle = '#a9b6bd'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-14, -RIG.TR - 10); c.lineTo(14, -RIG.TR - 10); c.moveTo(-14, RIG.TR + 10); c.lineTo(14, RIG.TR + 10); c.moveTo(14, -RIG.TR - 10); c.lineTo(17, 0); c.lineTo(14, RIG.TR + 10); c.stroke();
      c.restore();
    }

    /* ⑤ 收集管（直立）＋液體＋焦油＋雙孔塞 */
    const aCo = pa('collector'), cr = RIG.COL_R, cri = cr - 3;
    const colOuter = () => { c.beginPath(); c.moveTo(COLX - cr, RIG.COL_TOP); c.lineTo(COLX - cr, RIG.COL_BOT - cr); c.arc(COLX, RIG.COL_BOT - cr, cr, Math.PI, 0, true); c.lineTo(COLX + cr, RIG.COL_TOP); };
    const colInner = () => { c.beginPath(); c.moveTo(COLX - cri, RIG.COL_TOP); c.lineTo(COLX - cri, RIG.COL_BOT - cr); c.arc(COLX, RIG.COL_BOT - cr, cri, Math.PI, 0, true); c.lineTo(COLX + cri, RIG.COL_TOP); c.closePath(); };
    if (aCo > 0.02) {
      c.save(); c.globalAlpha *= aCo;
      colOuter(); c.closePath(); c.fillStyle = 'rgba(200,236,246,0.12)'; c.fill();
      c.save(); colInner(); c.clip();
      const liq = clamp01(o.liquidAmt || 0), tar = clamp01(o.tarAmt || 0);
      if (liq > 0.01) {
        const lg = c.createLinearGradient(COLX - cri, 0, COLX + cri, 0); lg.addColorStop(0, 'rgba(176,122,48,0.92)'); lg.addColorStop(0.5, 'rgba(214,160,74,0.85)'); lg.addColorStop(1, 'rgba(160,108,40,0.92)');
        c.fillStyle = lg; c.fillRect(COLX - cri, D.lt, cri * 2, D.inB - D.lt + 2);
        c.strokeStyle = 'rgba(255,225,160,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(COLX - cri, D.lt); c.lineTo(COLX + cri, D.lt); c.stroke();
      }
      if (tar > 0.01) {
        const tg = c.createLinearGradient(0, D.inB - D.th2, 0, D.inB); tg.addColorStop(0, '#4a2e18'); tg.addColorStop(1, '#24160c');
        c.fillStyle = tg; c.beginPath(); c.moveTo(COLX - cri, D.inB - D.th2 + 2);
        c.quadraticCurveTo(COLX, D.inB - D.th2 - 3, COLX + cri, D.inB - D.th2 + 2); c.lineTo(COLX + cri, D.inB + 4); c.lineTo(COLX - cri, D.inB + 4); c.closePath(); c.fill();
      }
      /* 收集管上方白霧 */
      const sm = clamp01(o.smokeAmt || 0);
      if (sm > 0.02) {
        for (let i = 0; i < 7; i++) {
          const ph = (t * 0.3 + hash(i * 9 + 1)) % 1, px = COLX + (hash(i + 21) - 0.5) * cri * 1.6, py = RIG.COL_TOP + 20 + ph * Math.max(10, D.lt - RIG.COL_TOP - 30), rr = 9;
          const rg = c.createRadialGradient(px, py, 0, px, py, rr); rg.addColorStop(0, 'rgba(240,244,242,' + (0.35 * sm * Math.sin(ph * Math.PI)).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(240,244,242,0)');
          c.fillStyle = rg; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
        }
      }
      c.restore();
      colOuter(); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 6; c.stroke();
      colOuter(); c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(COLX - cr + 6, RIG.COL_TOP + 22); c.lineTo(COLX - cr + 6, RIG.COL_BOT - cr - 4); c.stroke();
      /* 雙孔塞 */
      const sg = c.createLinearGradient(COLX - 20, 0, COLX + 20, 0); sg.addColorStop(0, '#7b6f66'); sg.addColorStop(0.5, '#5a504a'); sg.addColorStop(1, '#3e3733');
      c.fillStyle = sg; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(COLX - 20, RIG.COL_TOP - 10); c.lineTo(COLX + 20, RIG.COL_TOP - 10); c.lineTo(COLX + cri + 1, RIG.COL_TOP + 14); c.lineTo(COLX - cri - 1, RIG.COL_TOP + 14); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    /* 液滴：從導管端滴進收集管 */
    const dr = clamp01(o.drip || 0);
    if (dr > 0.02 && aCo > 0.02) {
      for (let i = 0; i < 2; i++) {
        const ph = (t * 1.2 + i * 0.5) % 1, y0 = RIG.IN_END + 4, y1 = D.lt - 2;
        const py = ph < 0.35 ? y0 + 2 * (ph / 0.35) : lerp(y0 + 2, y1, Math.pow((ph - 0.35) / 0.65, 2));
        if (py > y1) continue;
        c.save(); c.globalAlpha *= dr * aCo; c.fillStyle = 'rgba(214,160,74,0.95)'; c.strokeStyle = 'rgba(60,36,16,0.8)'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(COLX - 7, py, 3, 4, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
      }
    }

    /* ⑥ 導管：塞子外端 → 沿管軸 → 水平 → 往下進收集管 */
    const aDl = pa('delivery');
    if (aDl > 0.02) {
      c.save(); c.globalAlpha *= aDl;
      glassPath([{ x: D.st.x - 6 * D.ca, y: D.st.y - 6 * D.sa }, D.p1, { x: COLX - 7, y: D.p1.y }, { x: COLX - 7, y: RIG.IN_END }], gr('delivery'), 12);
      c.restore();
    }
    /* ⑦ 出氣導管（收集管右孔往上，彎向右上） */
    const aOt = pa('outlet');
    if (aOt > 0.02) {
      c.save(); c.globalAlpha *= aOt;
      glassPath([{ x: COLX + 7, y: RIG.COL_TOP + 8 }, { x: COLX + 7, y: 252 }, { x: COLX + 44, y: 238 }], gr('outlet'), 14);
      c.restore();
    }
    /* ⑧ 燒杯前壁（玻璃） */
    if (aBk > 0.02) {
      c.save(); c.globalAlpha *= aBk;
      bk(); c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 6; c.stroke();
      bk(); c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 3; c.beginPath(); c.moveTo(RIG.BK_X0 + 10, RIG.BK_TOP + 14); c.lineTo(RIG.BK_X0 + 12, GY - 14); c.stroke();
      c.restore();
    }
    /* ⑨ 導管口冒出的氣體 */
    const gs = clamp01(o.gasAmt || 0);
    if (gs > 0.02 && aOt > 0.5) O1.smoke(c, COLX + 48, 236, t, { n: 16, h: 120, a: 1.3 * gs, spread: 18, r: 9, speed: 0.45, col: o.gasCol || '#eef2f0', seed: 9, drift: 0.22 });
    c.restore();

    /* ⑩ 標籤（畫布座標、22px，不跟著縮放） */
    if (o.labels) {
      const lab = typeof o.labels === 'object' ? o.labels : { tube: 1, chips: 1, delivery: 1, collector: 1, water: 1, lamp: 1 };
      const Lz = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
      const M = R.map;
      const lead = (al, x0, y0, x1, y1) => {
        if (al <= 0.02) return; c.save(); c.globalAlpha *= al * a; c.lineCap = 'round';
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.fillStyle = 'rgba(246,243,234,0.95)'; c.beginPath(); c.arc(x1, y1, 3.5, 0, TAU); c.fill(); c.restore();
      };
      const pill = (al, str, p, align, col) => { if (al <= 0.02) return; c.save(); c.globalAlpha *= al * a; W5.pill(c, str, p.x, p.y, col || COL.white, 22, align); c.restore(); };
      const ax = d => ({ x: D.bx + d * D.ca, y: D.by + d * D.sa });
      const L = k => clamp01(lab[k] || 0);
      /* 位置（設計座標）：硬質試管 (330,150)、竹筷碎片 (150,196)、導管 (550,236)、收集管 左對齊 (735,300)、冷水 左對齊 (735,404)、酒精燈 左對齊 (lampX+70, 420)、
         鐵架 左對齊 (CX+16, 196)、導管口 左對齊 (outlet+18, 220)、塞子 (ax(LEN+4)) 上方 */
      if (L('tube')) { const q = ax(220); lead(L('tube'), M(q.x, 168).x, M(q.x, 168).y, M(q.x, q.y - RIG.TR).x, M(q.x, q.y - RIG.TR).y); pill(L('tube'), Lz('硬質試管', 'Hard-glass test tube'), M(q.x, 150)); }
      if (L('chips')) { const q = ax(55); lead(L('chips'), M(150, 214).x, M(150, 214).y, M(q.x, q.y + 6).x, M(q.x, q.y + 6).y); pill(L('chips'), Lz('竹筷碎片', 'Bamboo chips'), M(150, 196)); }
      if (L('delivery')) { lead(L('delivery'), M(550, 254).x, M(550, 254).y, M(550, D.p1.y - 4).x, M(550, D.p1.y - 4).y); pill(L('delivery'), Lz('導管', 'Glass tube'), M(550, 236)); }
      if (L('collector')) { lead(L('collector'), M(735, 300).x, M(735, 300).y, M(COLX + RIG.COL_R - 2, 330).x, M(COLX + RIG.COL_R - 2, 330).y); pill(L('collector'), Lz('收集管', 'Collecting tube'), M(735, 300), 'left'); }
      if (L('water')) { lead(L('water'), M(735, 404).x, M(735, 404).y, M(RIG.BK_X1 - 12, 404).x, M(RIG.BK_X1 - 12, 404).y); pill(L('water'), Lz('冷水', 'Cold water'), M(735, 404), 'left'); }
      if (L('lamp')) pill(L('lamp'), Lz('酒精燈', 'Alcohol lamp'), M(D.lx + 66, 420), 'left');
      if (L('stand')) pill(L('stand'), Lz('鐵架', 'Stand'), M(CX + 16, 196), 'left');
      if (L('outlet')) pill(L('outlet'), Lz('導管口', 'Gas outlet'), M(COLX + 62, 220), 'left');
      if (L('stopper')) { const q = ax(RIG.LEN + 4); lead(L('stopper'), M(q.x, 338).x, M(q.x, 338).y, M(q.x, q.y + RIG.TR).x, M(q.x, q.y + RIG.TR).y); pill(L('stopper'), Lz('塞子', 'Stopper'), M(q.x, 356)); }
    }
    return R;
  };

  /* 聚光：整張畫布（y 32 以下）蓋一層暗色，只留 holes 的圓洞；洞邊畫柔和光暈。
     holes：[{ x, y, r }]（畫布座標）；o：{ a 0..1 暗的程度(1→ 最暗 0.62), col 暗色('#0b1a15'), y0 從哪裡開始蓋(32) } */
  O1.spot = function (c, holes, o) {
    o = o || {}; const a = clamp01(o.a == null ? 1 : o.a); if (a <= 0.02) return;
    const y0 = o.y0 == null ? 32 : o.y0;
    c.save(); c.globalAlpha *= a * 0.62; c.fillStyle = o.col || '#0b1a15';
    c.beginPath(); c.rect(0, y0, 960, 540 - y0);
    (holes || []).forEach(h => { c.moveTo(h.x + h.r, h.y); c.arc(h.x, h.y, h.r, 0, TAU, true); });
    c.fill('evenodd'); c.restore();
  };
})(window);
