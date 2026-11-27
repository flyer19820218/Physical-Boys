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
   products 新增（2026-11-27）：
     O1.MOL.H2                  氫分子
     O1.noFire(c,x,y,r,o)       「不可燃」禁止符號（圓圈＋斜線）
     O1.litmus(c,x,y,w,h,o)     石蕊試紙（從一點擴散變色）
     O1.rod(c,x0,y0,x1,y1,o)    玻璃棒（尖端可掛液滴）
     O1.cBlob(c,cx,cy,o)        碳原子聚集的不規則塊（木炭微觀示意）
   testc 新增（2026-11-27）：
     O1.CANDLE                  蠟燭燃燒檢驗台設計常數（桌面、蠟燭、燒杯尺寸、倒扣位置…）
     O1.candlePts(o)            蠟燭＋倒扣燒杯的錨點（純數學，不畫；焰尖、杯口、內壁、夾子、水珠點…）
     O1.candle(c,o)             蠟燭燃燒檢驗台（蠟燭＋燭火＋倒扣燒杯（石灰水／乾燥冷燒杯）＋夾子＋上升分子＋氯化亞鈷試紙）→ candlePts
     O1.cocl(c,x,y,ang,o)       氯化亞鈷試紙（可旋轉的長條，從尖端由藍變粉紅）
   testh 新增（2026-11-27）：
     O1.tweezers(c,x,y,ang,o)   鑷子（尖端 (x,y)、鑷身往 ang 伸出；夾試紙用，沒有手）
   iso 新增（2026-11-27）：
     O1.badge(c,x,y,txt,o)      原子旁的小圓標（數數、鍵數）
     O1.freeDir(pts,bonds,i)    第 i 顆原子最空的方向（放小圓標用）
     O1.arcPt(p0,p1,k,lift)     兩點之間走弧線
   props 新增（2026-11-27）：
     O1.miniMol(c,m,x,y,o)      小分子粒子（不寫元素符號、可旋轉、指定鍵換色）
     O1.dropper(c,x,y,o)        滴管（尖端 (x,y)；管內液體、液滴、橡皮頭擠壓）
     O1.germ(c,x,y,o)           細菌示意（橢圓＋鞭毛；dead 0..1 停止變灰）
     O1.naBlock(c,x,y,o)        鈉金屬小方塊（銀灰）
     O1.bubble(c,x,y,r,o)       液體中的小氣泡
   cuo 新增（2026-11-27）：
     O1.CU                      顏色：黑色氧化銅、紅色的銅、碳粉
     O1.tstand(c,o)             橫放試管用的鐵架＋夾子（part 'back'／'front' 分兩層畫）
     O1.heap(c,x,y,o)           錶玻璃上的一堆黑色粉末（碳粉／氧化銅／混合，可拌開、可變少）→ 粉堆頂點
     O1.tubeBed(c,g,o)          O1.htube 管底的一層粉末：黑 → 從受熱處擴散成紅色的銅
     O1.grains(c,cx,cy,R,o)     放大鏡內的粉末顆粒：黑色氧化銅依序變紅色銅、碳顆粒變小 → { n, cu }
   cuso4 新增（2026-11-27）：
     O1.CUSO4                   顏色：白色無水硫酸銅、遇水變成的藍色
     O1.cuso4Pile(c,x,y,o)      蒸發皿＋白色粉堆（可從一點由白變藍擴散、濕痕）→ { rimY, base, top, hw, surf(px) }
     O1.waterDrop(c,x,y,r,o)    一顆水珠（上尖下圓、高光；可拉長表示下落）
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
  /* ══════════════════ 以下由 products（乾餾三大產物）新增，2026-11-27 ══════════════════
     O1.MOL.H2               氫分子（兩顆 H，單鍵）
     O1.noFire(c,x,y,r,o)    「不可燃」禁止符號（圓圈＋斜線，可依序畫出）
     O1.litmus(c,x,y,w,h,o)  石蕊試紙（橫放長條；可從某點開始變色擴散）
     O1.rod(c,x0,y0,x1,y1,o) 玻璃棒（沒有手；尖端可掛一滴液體）
     O1.cBlob(c,cx,cy,o)     碳原子聚集成的不規則塊（木炭的微觀示意；依序出現） */

  /* 氫分子 H2：兩顆 H（鍵長示意） */
  if (!O1.MOL.H2) O1.MOL.H2 = { atoms: [{ el: 'H', x: -0.42, y: 0 }, { el: 'H', x: 0.42, y: 0 }], bonds: [[0, 1, 1]] };

  /* 「不可燃」禁止符號：中心 (x,y)、半徑 r。o：{ a, k 0..1 畫出進度（先畫圓、再畫斜線）, col(珊瑚), lw(7) } */
  O1.noFire = function (c, x, y, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, k = clamp01(o.k == null ? 1 : o.k); if (a <= 0.02 || k <= 0.01) return;
    const col = o.col || COL.coral, lw = o.lw || 7, k1 = clamp01(k / 0.7), k2 = clamp01((k - 0.7) / 0.3);
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    const ring = () => { c.beginPath(); c.arc(x, y, r, -Math.PI * 0.75, -Math.PI * 0.75 + TAU * k1); };
    const sl = () => { const d = r * 0.707; c.beginPath(); c.moveTo(x - d, y - d); c.lineTo(x - d + 2 * d * k2, y - d + 2 * d * k2); };
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 4; ring(); c.stroke(); if (k2 > 0) { sl(); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = lw; ring(); c.stroke(); if (k2 > 0) { sl(); c.stroke(); }
    c.restore();
  };

  /* 石蕊試紙（橫放長條）：左上 (x,y)、寬 w、高 h。
     o：{ a, base 原色('#4a7fe0' 藍), to 變成的顏色('#e0465a' 紅), k 0..1.3 變色範圍（從 (cx,cy) 往外擴散；≥ 1.25 保證整條變色、邊緣不留藍）, cx, cy 變色起點（預設長條中心）, wet 0..1 沾到液體的濕痕 } */
  O1.litmus = function (c, x, y, w, h, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const base = o.base || '#4a7fe0', to = o.to || '#e0465a', k = Math.max(0, Math.min(1.3, o.k || 0));
    const cx = o.cx == null ? x + w / 2 : o.cx, cy = o.cy == null ? y + h / 2 : o.cy;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(0,0,0,0.25)'; W5.rr(c, x + 3, y + 5, w, h, 3); c.fill();
    c.fillStyle = base; W5.rr(c, x, y, w, h, 3); c.fill();
    c.save(); W5.rr(c, x, y, w, h, 3); c.clip();
    /* 纖維紋理 */
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
    for (let i = 0; i < 10; i++) { const yy = y + 3 + (h - 6) * hash(i + 31); c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy + (hash(i + 7) - 0.5) * 4); c.stroke(); }
    if (k > 0.01) {
      const R = k * Math.max(Math.hypot(cx - x, cy - y), Math.hypot(cx - x - w, cy - y), Math.hypot(cx - x, cy - y - h), Math.hypot(cx - x - w, cy - y - h)) * 1.05;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, R));
      g.addColorStop(0, to); g.addColorStop(0.82, to); g.addColorStop(1, W5.rgba(to, 0));
      c.fillStyle = g; c.fillRect(x, y, w, h);
    }
    const wet = clamp01(o.wet || 0);
    if (wet > 0.02) { c.fillStyle = 'rgba(255,255,255,' + (0.25 * wet).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, cy, 9 * wet, 6 * wet, 0, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5; W5.rr(c, x, y, w, h, 3); c.stroke();
    c.restore();
  };

  /* 玻璃棒（沒有手）：尖端 (x0,y0) → 另一端 (x1,y1)。o：{ a, w 粗(7), drop 0..1 尖端掛的液滴大小, dropCol 液滴色('#e2c27a') } */
  O1.rod = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const w = o.w || 7, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = w + 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x0 + nx * w * 0.22 + (x1 - x0) * 0.08, y0 + ny * w * 0.22 + (y1 - y0) * 0.08); c.lineTo(x1 + nx * w * 0.22 - (x1 - x0) * 0.08, y1 + ny * w * 0.22 - (y1 - y0) * 0.08); c.stroke();
    const dr = clamp01(o.drop || 0);
    if (dr > 0.02) {
      c.fillStyle = o.dropCol || '#e2c27a'; c.strokeStyle = 'rgba(60,36,16,0.8)'; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(x0, y0 + 3 * dr, 4.5 * dr, 5.5 * dr, 0, 0, TAU); c.fill(); c.stroke();
    }
    c.restore();
  };

  /* 碳原子聚集成的不規則塊（示意）：中心 (cx,cy)。
     o：{ a, n 顆數(28), r 原子半徑(20), R 塊的大約半徑(95), k 0..1 已出現幾成（由中心往外依序彈出）, seed(5), glow 光暈色(null), label 是否寫 C(true) }
     原子排成略擠的六角堆積再加確定性擾動、只留在不規則邊界內；回傳實際畫出的點 [{x,y}]。 */
  O1.cBlob = function (c, cx, cy, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, n = o.n || 28, r = o.r || 20, R = o.R || 95, k = clamp01(o.k == null ? 1 : o.k), seed = o.seed || 5;
    const pts = [], d = r * 1.78;
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const x = (i + (j & 1) * 0.5) * d + (hash(seed + i * 13 + j * 7) - 0.5) * r * 0.5, y = j * d * 0.866 + (hash(seed * 3 + i * 5 + j * 11) - 0.5) * r * 0.5;
      const th = Math.atan2(y, x), lim = R * (0.78 + 0.22 * Math.sin(th * 3 + seed) + 0.1 * Math.sin(th * 5 + seed * 2));
      if (Math.hypot(x, y) <= lim) pts.push({ x: cx + x, y: cy + y, d: Math.hypot(x, y) + hash(seed + i * 3 + j) * r });
    }
    pts.sort((p, q) => p.d - q.d); const P = pts.slice(0, n);
    if (a <= 0.02) return P;
    c.save(); c.globalAlpha *= a;
    if (o.glow && k > 0.02) W5.glow(c, cx, cy, R * 1.4, o.glow, 0.18 * k);
    /* 先畫外圈（後出現）再畫內圈，內圈蓋在上面 → 由裡往外疊 */
    for (let i = P.length - 1; i >= 0; i--) {
      const q = clamp01(k * P.length - i); if (q <= 0) continue;
      const sc = 0.4 + 0.6 * ease(q) + 0.12 * Math.sin(Math.PI * clamp01(q));
      O1.atom(c, P[i].x, P[i].y, 'C', r * sc, { a: clamp01(q * 2), label: o.label !== false && q > 0.6 });
    }
    c.restore();
    return P;
  };

  /* ══════════════════ 以下由 testc（檢驗碳：石灰水）新增，2026-11-27 ══════════════════
     O1.CANDLE               蠟燭燃燒檢驗台的設計常數
     O1.candlePts(o)         錨點（純數學，不畫）
     O1.candle(c,o)          蠟燭＋燭火＋倒扣燒杯（石灰水／乾燥冷燒杯）＋夾子＋上升分子＋氯化亞鈷試紙
     O1.cocl(c,x,y,ang,o)    氯化亞鈷試紙（長條，從尖端由藍變粉紅）
     下一支 testh（檢驗氫）與「蠟燭燃燒檢驗台」動手做都用這組；只增不改。 */

  /* ─────────── 蠟燭燃燒檢驗台 ───────────
     設計座標（s = 1、x = y = 0 時就是 960×540 畫布座標；testc 動畫用原寸）：
       桌面 GY 452（本函式不畫桌子）。燭臺小碟：中心 (CX 300, 452)、半寬 46。
       蠟燭：中線 CX 300、半寬 CR 22、高 CH 110（底在碟面 y 444）→ 頂面 y 334；burn = 1 時變短 BURN 16 px（頂面 350）。
       燭芯：頂面往上 WICK 12 px（燭芯頂 322）；燭火底 ＝ 頂面 − 3，高 FH 62 × lit → 焰尖 ≈ y 269（burn 0、lit 1；火焰閃動最多再高約 10%）。
       燒杯（倒扣，flip = 1）：中線 BX 300、外半寬 BW 70、高 BH 150、玻璃壁 WALL 4、杯口外翻 5 px；
         放好時（lower 1、lift 0）杯口 y RIM 256（在焰尖上方約 13 px，不蓋住火焰）、杯底（朝上）y 106、杯中心 y 181。
         lower 0 時整個燒杯再往上 RAISE 120 px；lift 另外往上加 px。
       石灰水塗層：內壁一圈厚 COAT 7 px（兩側＋杯底內側，較濃）＋整個杯內一層淡色（前後杯壁）；混濁度 turb 由杯底（倒扣時在上方）往杯口推進，兩側變乳白、杯內變半透明乳白。
       夾子：夾在燒杯外壁、杯中心高度；往 tongSide（-1 左／1 右）伸出 tongLen 190 px（左邊時夾子末端 ≈ x 40）。
     整組變換：畫布點 ＝ (o.x + s·設計x, o.y + s·設計y)；所有錨點都已換成畫布座標。
     o（全部可省略）：
       x, y 平移(0,0)；s 縮放(1)；a 整體透明度(1)；t 秒（火焰閃動、分子上升）；
       ── 蠟燭 ──
       candle 0..1 蠟燭＋燭臺透明度(1)；cx 蠟燭中線（設計 x，300）；burn 0..1 燭身變短(0)；
       lit 0..1 燭火大小（0＝沒點燃）(1)；fh 燭火高(62)；fw 燭火半寬(14)；
       ── 燒杯 ──
       beaker 0..1 燒杯透明度（0＝不畫燒杯、夾子、塗層）(1)；kind 'lime'（內壁塗澄清石灰水）| 'cold'（乾燥的冷燒杯）('lime')；
       bx 燒杯中線（設計 x，預設＝cx）；lower 0..1（1＝放到火焰上方、0＝再高 RAISE px）(1)；lift 額外往上 px(0)；
       flip 0..1（1＝倒扣（杯口朝下）、0＝杯口朝上；中間值＝繞夾子軸翻轉，畫成垂直壓扁，最扁 8%，不會消失）(1)；
       coat 0..1 石灰水塗層透明度（kind 'lime'；預設 1）；turb 0..1 石灰水混濁度（透明淡青 → 乳白，由杯底往杯口推進）(0)；
       fog 0..1 內壁起霧（kind 'cold'）(0)；drops 0..1 內壁小水珠（依序出現、變大）(0)；dropSlide 0..1 水珠往杯口滑(0)；
       tong 0..1 夾子透明度（預設＝1）；tongSide -1 | 1（夾子往左／右伸出，-1）；tongLen(190)；
       ── 上升的分子／箭頭 ──
       gas 0..1 從焰尖上升、飄進杯內的分子（0＝不畫；值＝出現的比例）；gasMol 'CO2' | 'H2O' | ['CO2','H2O',…] 輪流('CO2')；
       gasN 分子數(5)；gasSpeed 每秒走幾趟(0.15)；gasUnit 分子每單位 px(11)；gasAtom 原子縮放(0.36)；
         分子不寫元素符號（太小），請另外放圖例 pill；
       arrow 0..1 焰尖往上長進杯內的黃色箭頭；
       ── 氯化亞鈷試紙 ──
       paper null | { x, y 試紙尖端（設計座標）, ang 長條往哪個方向伸（rad，0＝往右）, len(90), w(16), k 0..1 由藍變粉紅, wet 0..1, a }；
         要碰水珠時，尖端放在 O1.candlePts(o).dropSpot 的設計座標（＝ _d.dropSpot）。
       ── 標籤 ──
       labels true／false／{ candle, flame, coat, tong: 透明度 }（true＝candle＋coat）；22px、畫在畫布座標，不跟著 s 縮小；
         candleText 蠟燭標籤文字（預設「蠟燭」）、coatText 燒杯標籤文字（預設 lime「澄清石灰水」／cold「乾燥的冷燒杯」）。
         位置：candle 左對齊於 (cx+66, 392)；flame 左對齊於 (cx+60, 焰中段)；coat 左對齊於 (燒杯右緣+40, 杯中心−BH/4)；tong 置中於（夾子末端往燒杯方向 60 px）上方 36 px。
     回傳 O1.candlePts(o)。 */
  const CAN = { GY: 452, CX: 300, CR: 22, CH: 110, DISH: 8, BURN: 16, WICK: 12, FH: 62, FW: 14,
    BW: 70, BH: 150, WALL: 4, COAT: 7, RIM: 256, RAISE: 120, TONG: 190 };
  O1.CANDLE = CAN;

  /* 錨點（畫布座標）。o 同 O1.candle（只看 x、y、s、cx、burn、lit、fh、bx、lower、lift、flip、tongSide、tongLen）。
     回傳 {
       s, map(dx,dy) 設計→畫布, sy 燒杯目前的垂直翻轉比例（1＝倒扣、−1＝杯口朝上）,
       base 燭臺中心（桌面）  candleTop 蠟燭頂面中心  wick 燭芯頂  flameBase 燭火底  flameTip 焰尖（依 lit、fh）  flameMid 燭火中段
       beaker { cx, cy 中心, rim 杯口中心（倒扣時在下）, top 杯底外側中心（倒扣時在上）, x0, x1 外壁, ix0, ix1 內壁, inTop 內側杯底, w, h }
       coatL, coatR 左右內壁塗層中段點    coatTop 內側杯底塗層中心（混濁最先出現處）
       dropSpot 右內壁靠杯口的水珠聚集點（試紙要碰的地方）
       grip 夾子夾住燒杯處   tongEnd 夾子末端
       gasFrom 分子出發點（焰尖上方）   gasTo 分子在杯內聚集的中心
       _d 設計座標版本（給呼叫端再算、或給 paper 用）
     } */
  O1.candlePts = function (o) {
    o = o || {}; const S = o.s || 1, ox = o.x || 0, oy = o.y || 0;
    const map = (dx, dy) => ({ x: ox + S * dx, y: oy + S * dy });
    const cx = o.cx == null ? CAN.CX : o.cx, burn = clamp01(o.burn || 0), lit = clamp01(o.lit == null ? 1 : o.lit), fh = o.fh || CAN.FH;
    const top = CAN.GY - CAN.DISH - CAN.CH + CAN.BURN * burn, wick = top - CAN.WICK, fBase = top - 3, tip = fBase - fh * lit;
    const bx = o.bx == null ? cx : o.bx, lower = clamp01(o.lower == null ? 1 : o.lower), lift = o.lift || 0;
    const flip = clamp01(o.flip == null ? 1 : o.flip), sy = -Math.cos(Math.PI * flip);
    const cy = CAN.RIM - CAN.BH / 2 - lift - (1 - lower) * CAN.RAISE;
    const P = (lx, ly) => ({ x: bx + lx, y: cy + ly * sy });           /* 燒杯區域座標（倒扣方向）→ 設計座標 */
    const ix = CAN.BW - CAN.WALL, inB = -CAN.BH / 2 + CAN.WALL, cm = ix - CAN.COAT / 2;
    const side = o.tongSide == null ? -1 : (o.tongSide < 0 ? -1 : 1), tl = o.tongLen || CAN.TONG;
    const grip = { x: bx + side * (CAN.BW + 1), y: cy }, tEnd = { x: bx + side * (CAN.BW + 1 + tl), y: cy };
    const d = {
      cx, top, wick, fBase, tip, bx, cy, sy, flip, side, tl,
      rim: P(0, CAN.BH / 2), btop: P(0, -CAN.BH / 2), inTop: P(0, inB),
      coatL: P(-cm, 0), coatR: P(cm, 0), coatTop: P(0, inB + CAN.COAT / 2),
      dropSpot: P(ix - 4, CAN.BH / 2 - 22), grip, tongEnd: tEnd,
      gasFrom: { x: cx, y: tip - 6 }, gasTo: P(0, -CAN.BH * 0.12)
    };
    const M = p => map(p.x, p.y);
    return {
      s: S, map, sy,
      base: map(cx, CAN.GY), candleTop: map(cx, top), wick: map(cx, wick), flameBase: map(cx, fBase), flameTip: map(cx, tip), flameMid: map(cx, (fBase + tip) / 2),
      beaker: { cx: ox + S * bx, cy: oy + S * cy, rim: M(d.rim), top: M(d.btop), x0: ox + S * (bx - CAN.BW), x1: ox + S * (bx + CAN.BW),
        ix0: ox + S * (bx - ix), ix1: ox + S * (bx + ix), inTop: M(d.inTop), w: 2 * CAN.BW * S, h: CAN.BH * S },
      coatL: M(d.coatL), coatR: M(d.coatR), coatTop: M(d.coatTop), dropSpot: M(d.dropSpot),
      grip: M(grip), tongEnd: M(tEnd), gasFrom: M(d.gasFrom), gasTo: M(d.gasTo),
      _d: d
    };
  };

  /* 氯化亞鈷試紙（沒有手）：尖端在 (x,y)，長條往 ang 方向伸出（rad，0＝往右）。
     o：{ a, len(90), w(16), k 0..1 由尖端開始由藍變粉紅（1＝整條粉紅）, wet 0..1 尖端濕痕, base 原色('#3f6fdc'), to 變成的顏色('#f28cb1') } */
  O1.cocl = function (c, x, y, ang, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const len = o.len || 90, w = o.w || 16, k = clamp01(o.k || 0), base = o.base || '#3f6fdc', to = o.to || '#f28cb1';
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ang || 0);
    c.fillStyle = 'rgba(0,0,0,0.25)'; W5.rr(c, 3, -w / 2 + 4, len, w, 3); c.fill();
    c.fillStyle = base; W5.rr(c, 0, -w / 2, len, w, 3); c.fill();
    c.save(); W5.rr(c, 0, -w / 2, len, w, 3); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const yy = -w / 2 + 2 + (w - 4) * hash(i + 41); c.beginPath(); c.moveTo(0, yy); c.lineTo(len, yy + (hash(i + 9) - 0.5) * 3); c.stroke(); }
    if (k > 0.01) {
      const e = len * 1.15 * k;
      const g = c.createLinearGradient(0, 0, Math.max(1, e), 0);
      g.addColorStop(0, to); g.addColorStop(0.85, to); g.addColorStop(1, W5.rgba(to, 0));
      c.fillStyle = g; c.fillRect(0, -w / 2, Math.max(1, e), w);
    }
    const wet = clamp01(o.wet || 0);
    if (wet > 0.02) { c.fillStyle = 'rgba(255,255,255,' + (0.28 * wet).toFixed(3) + ')'; c.beginPath(); c.ellipse(6, 0, 8 * wet, w * 0.35 * wet, 0, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5; W5.rr(c, 0, -w / 2, len, w, 3); c.stroke();
    c.restore();
  };

  O1.candle = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, t = o.t || 0, S = o.s || 1;
    const R = O1.candlePts(o), D = R._d;
    if (a <= 0.02) return R;
    const ca = clamp01(o.candle == null ? 1 : o.candle), ba = clamp01(o.beaker == null ? 1 : o.beaker);
    const lit = clamp01(o.lit == null ? 1 : o.lit), kind = o.kind || 'lime';
    const cx = D.cx, GY = CAN.GY;
    /* 圓角矩形子路徑（不 beginPath） */
    const rrp = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

    c.save(); c.globalAlpha *= a; c.translate(o.x || 0, o.y || 0); c.scale(S, S); c.lineJoin = 'round'; c.lineCap = 'round';

    /* ① 燭臺＋蠟燭 */
    if (ca > 0.02) {
      c.save(); c.globalAlpha *= ca;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(cx, GY + 2, 52, 8, 0, 0, TAU); c.fill();
      const dg = c.createLinearGradient(cx - 46, 0, cx + 46, 0); dg.addColorStop(0, '#6d7a82'); dg.addColorStop(0.45, '#cfd8dc'); dg.addColorStop(1, '#5d6a72');
      c.fillStyle = dg; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - 46, GY - CAN.DISH); c.lineTo(cx - 38, GY); c.lineTo(cx + 38, GY); c.lineTo(cx + 46, GY - CAN.DISH); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx, GY - CAN.DISH, 46, 6, 0, 0, TAU); c.fillStyle = '#9aa7ad'; c.fill(); c.stroke();
      /* 燭身 */
      const top = D.top, bot = GY - CAN.DISH, r = CAN.CR;
      const wg = c.createLinearGradient(cx - r, 0, cx + r, 0); wg.addColorStop(0, '#d8ccb0'); wg.addColorStop(0.35, '#fbf5e6'); wg.addColorStop(1, '#c9bc9c');
      c.fillStyle = wg; c.strokeStyle = 'rgba(90,76,50,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - r, top); c.lineTo(cx - r, bot); c.ellipse(cx, bot, r, 4, 0, Math.PI, 0, true); c.lineTo(cx + r, top); c.ellipse(cx, top, r, 5, 0, 0, Math.PI, false); c.closePath(); c.fill(); c.stroke();
      /* 頂面（點燃時中間一小池熔蠟） */
      c.fillStyle = '#efe6d0'; c.beginPath(); c.ellipse(cx, top, r, 5, 0, 0, TAU); c.fill(); c.stroke();
      if (lit > 0.02) { c.fillStyle = 'rgba(255,236,190,' + (0.7 * lit).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, top + 0.5, r * 0.6, 2.8, 0, 0, TAU); c.fill(); }
      /* 蠟淚（隨 burn 變長） */
      const drip = 8 + 18 * clamp01(o.burn || 0);
      c.fillStyle = '#f6eedb'; c.strokeStyle = 'rgba(90,76,50,0.6)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(cx + r - 8, top + 3); c.quadraticCurveTo(cx + r + 1, top + 4, cx + r + 1, top + 10); c.lineTo(cx + r + 1, top + drip); c.arc(cx + r - 1.5, top + drip, 2.5, 0, Math.PI); c.lineTo(cx + r - 4, top + 6); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - r + 7, top + 10); c.lineTo(cx - r + 7, bot - 8); c.stroke();
      /* 燭芯 */
      c.strokeStyle = '#2f2a26'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, top); c.quadraticCurveTo(cx + 1, top - 7, cx + 3, D.wick); c.stroke();
      if (lit > 0.02) { c.fillStyle = 'rgba(255,128,64,' + (0.9 * lit).toFixed(3) + ')'; c.beginPath(); c.arc(cx + 3, D.wick, 2.2, 0, TAU); c.fill(); }
      c.restore();
    }
    /* ② 燭火 */
    if (lit > 0.02 && ca > 0.02) O1.flame(c, cx, D.fBase, (o.fh || CAN.FH) * lit, t, { a: ca, w: (o.fw || CAN.FW) * Math.max(0.45, lit) });

    /* ③ 燒杯（區域座標：原點＝杯中心、倒扣方向；用 scale(1, sy) 翻轉） */
    const BW = CAN.BW, BH = CAN.BH, WL = CAN.WALL, ix = BW - WL, h2 = BH / 2, inB = -h2 + WL;
    const sy = (D.sy < 0 ? -1 : 1) * Math.max(0.08, Math.abs(D.sy)), beakerOn = ba > 0.02;   /* 翻到一半時壓扁成細條，不消失 */
    const inside = () => { c.beginPath(); rrp(-ix, inB, 2 * ix, BH - WL + 1, 7); };
    const outline = () => {
      c.beginPath(); c.moveTo(-BW - 5, h2); c.lineTo(-BW, h2 - 6); c.lineTo(-BW, -h2 + 10); c.arcTo(-BW, -h2, -BW + 10, -h2, 10);
      c.lineTo(BW - 10, -h2); c.arcTo(BW, -h2, BW, -h2 + 10, 10); c.lineTo(BW, h2 - 6); c.lineTo(BW + 5, h2);
    };
    if (beakerOn) {
      c.save(); c.globalAlpha *= ba; c.translate(D.bx, D.cy); c.scale(1, sy);
      /* 玻璃（後面） */
      const gg = c.createLinearGradient(-BW, 0, BW, 0); gg.addColorStop(0, 'rgba(160,215,230,0.22)'); gg.addColorStop(0.5, 'rgba(220,245,255,0.07)'); gg.addColorStop(1, 'rgba(120,190,210,0.22)');
      c.fillStyle = gg; outline(); c.closePath(); c.fill();
      if (kind === 'lime') {
        const co = clamp01(o.coat == null ? 1 : o.coat), tb = clamp01(o.turb || 0);
        if (co > 0.02) {
          const band = () => { c.beginPath(); rrp(-ix, inB, 2 * ix, BH - WL - 1, 7); rrp(-ix + CAN.COAT, inB + CAN.COAT, 2 * (ix - CAN.COAT), BH - WL - CAN.COAT + 4, 4); };
          c.save(); c.globalAlpha *= co;
          /* 前、後杯壁也塗了石灰水：整個杯內淡淡一層，兩側（側看較厚）較濃 */
          c.fillStyle = 'rgba(120,228,236,0.12)'; inside(); c.fill();
          c.fillStyle = 'rgba(120,228,236,0.62)'; band(); c.fill('evenodd');
          if (tb > 0.01) {
            const f = Math.min(1.2, tb * 1.2), mk = A => {
              const g = c.createLinearGradient(0, inB, 0, h2);
              g.addColorStop(0, 'rgba(246,248,244,' + A + ')'); g.addColorStop(clamp01(f - 0.18), 'rgba(246,248,244,' + A + ')'); g.addColorStop(clamp01(f), 'rgba(246,248,244,0)'); g.addColorStop(1, 'rgba(246,248,244,0)');
              return g;
            };
            c.fillStyle = mk(0.72); inside(); c.fill();                 /* 前後杯壁變乳白 */
            c.fillStyle = mk(0.95); band(); c.fill('evenodd');        /* 兩側杯壁 */
            /* 乳白小顆粒（碳酸鈣，示意）：依混濁前緣依序出現 */
            c.fillStyle = 'rgba(255,255,255,0.95)';
            for (let i = 0; i < 46; i++) {
              const p = hash(i * 3 + 11), on = i % 3;     /* 0 左壁、1 右壁、2 杯底內側 */
              let px, py;
              if (on === 2) { px = (hash(i + 5) - 0.5) * 2 * (ix - 4); py = inB + 1.5 + hash(i + 17) * (CAN.COAT - 3); }
              else { px = (on ? 1 : -1) * (ix - 1.5 - hash(i + 23) * (CAN.COAT - 3)); py = inB + 6 + p * (BH - WL - 10); }
              const pp = (py - inB) / (BH - WL); if (pp > f - 0.05) continue;
              c.beginPath(); c.arc(px, py, 1.3 + hash(i + 2), 0, TAU); c.fill();
            }
          }
          /* 塗層內緣的亮線（看得出是一層液膜） */
          c.strokeStyle = W5.mix('#9ff0f4', '#ffffff', tb); c.globalAlpha *= 0.8; c.lineWidth = 1.6;
          c.beginPath(); rrp(-ix + CAN.COAT, inB + CAN.COAT, 2 * (ix - CAN.COAT), BH - WL - CAN.COAT + 4, 4); c.stroke();
          c.restore();
        }
      } else {
        const fg = clamp01(o.fog || 0), dr = clamp01(o.drops || 0), sl = clamp01(o.dropSlide || 0);
        if (fg > 0.02) {
          c.save(); inside(); c.clip();
          const g = c.createLinearGradient(0, inB, 0, h2); g.addColorStop(0, 'rgba(236,244,247,' + (0.55 * fg).toFixed(3) + ')'); g.addColorStop(1, 'rgba(236,244,247,' + (0.22 * fg).toFixed(3) + ')');
          c.fillStyle = g; c.beginPath(); rrp(-ix, inB, 2 * ix, BH - WL + 1, 7); rrp(-ix + 9, inB + 9, 2 * (ix - 9), BH - WL, 4); c.fill('evenodd');
          c.restore();
        }
        if (dr > 0.02) {
          const N = 22;
          for (let i = 0; i < N; i++) {
            const q = clamp01(dr * N * 1.15 - i * 1.15 / (1 + 0.15)); if (q <= 0.02) continue;
            const on = i % 3; let px, py;
            if (on === 2) { px = (hash(i + 7) - 0.5) * 2 * (ix - 12); py = inB + 4; }
            else { px = (on ? 1 : -1) * (ix - 3.5); py = inB + 14 + hash(i * 5 + 3) * (BH - 46); py += sl * (h2 - 10 - py) * (0.35 + 0.65 * hash(i + 61)); }
            const rr = (2.2 + 2.6 * hash(i + 13)) * (0.4 + 0.6 * q) * (1 + 0.35 * sl);
            c.fillStyle = 'rgba(190,232,255,0.85)'; c.strokeStyle = 'rgba(77,210,255,0.9)'; c.lineWidth = 1;
            c.beginPath(); c.ellipse(px, py, rr * 0.85, rr, 0, 0, TAU); c.fill(); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px - rr * 0.3, py - rr * 0.35 * Math.sign(sy), rr * 0.3, 0, TAU); c.fill();
          }
        }
      }
      c.restore();
    }

    /* ④ 上升的分子（設計座標，不翻轉） */
    const gas = clamp01(o.gas || 0);
    if (gas > 0.02 && lit > 0.02) {
      const kinds = Array.isArray(o.gasMol) ? o.gasMol : [o.gasMol || 'CO2'], n = o.gasN || 5, sp = o.gasSpeed || 0.15, U = o.gasUnit || 11, k = o.gasAtom || 0.36;
      const inBeaker = beakerOn && D.flip > 0.9 && D.cy + h2 < D.tip + 60;
      for (let i = 0; i < n; i++) {
        const va = clamp01(gas * n - i); if (va <= 0.02) continue;
        const ph = (t * sp + i / n + 0.08 * hash(i * 13 + 7)) % 1;     /* 相位平均錯開，同時只有一兩顆在往上走 */
        const x0 = cx + (hash(i + 3) - 0.5) * 10, y0 = D.tip - 4;
        const slot = (i * 5) % 6, col2 = slot % 2 ? 1 : -1, row = Math.floor(slot / 2);   /* 杯內 2 欄 × 3 列落點，分子不互相重疊 */
        const x1 = inBeaker ? D.bx + col2 * (ix - 30) + (hash(i * 7 + 2) - 0.5) * 6 : cx + col2 * 40;
        const y1 = inBeaker ? D.cy - h2 + WL + 24 + row * 40 + hash(i * 5 + 1) * 6 : D.tip - 150 - row * 30;
        const e = ease(clamp01((ph - 0.08) / 0.4));   /* 先直直往上、再散開；約一半時間到達落點後停留、淡出 */
        const mx = lerp(x0, x1, e) + Math.sin(ph * 7 + i) * 6, my = lerp(y0, y1, 1 - Math.pow(1 - clamp01(ph / 0.5), 2));
        const al = va * clamp01(ph / 0.12) * clamp01((1 - ph) / 0.22);
        if (al <= 0.02) continue;
        O1.mol(c, O1.MOL[kinds[i % kinds.length]] || O1.MOL.CO2, mx, my, { scale: U, atomScale: k, a: al, label: false });
      }
    }
    const ar = clamp01(o.arrow || 0);
    if (ar > 0.02 && lit > 0.02) {
      const y0 = D.tip - 10, y1 = y0 - 100 * ar;
      W5.arrow(c, cx + 46, y0, cx + 46, y1, 'rgba(11,26,21,0.85)', 9, 20); W5.arrow(c, cx + 46, y0, cx + 46, y1, COL.yellow, 5, 16);
    }

    /* ⑤ 燒杯玻璃（前面）＋夾子 */
    if (beakerOn) {
      c.save(); c.globalAlpha *= ba; c.translate(D.bx, D.cy); c.scale(1, sy);
      c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 2.5; outline(); c.stroke();
      c.strokeStyle = 'rgba(200,236,246,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-ix, h2 - 5); c.lineTo(-ix, inB + 7); c.arcTo(-ix, inB, -ix + 7, inB, 7); c.lineTo(ix - 7, inB); c.arcTo(ix, inB, ix, inB + 7, 7); c.lineTo(ix, h2 - 5); c.stroke();
      /* 杯口（橢圓）與尖嘴 */
      c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, h2, BW + 5, 4.5, 0, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-BW - 5, h2); c.quadraticCurveTo(-BW - 11, h2 + 2, -BW - 12, h2 + 6); c.stroke();
      /* 刻度短線（不寫數字）＋反光 */
      c.strokeStyle = 'rgba(220,245,255,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { const yy = h2 - 30 - i * 26; c.beginPath(); c.moveTo(BW - 4, yy); c.lineTo(BW - (i % 2 ? 14 : 22), yy); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-BW + 10, -h2 + 18); c.lineTo(-BW + 10, h2 - 18); c.stroke();
      c.restore();
    }
    const tga = ba * clamp01(o.tong == null ? 1 : o.tong);
    if (tga > 0.02) {
      const sd = D.side, gx = D.grip.x, gy = D.grip.y, ex = D.tongEnd.x, pv = gx + sd * 62;
      c.save(); c.globalAlpha *= tga;
      const arm = (w, col) => {
        c.strokeStyle = col; c.lineWidth = w;
        c.beginPath(); c.moveTo(gx + sd * 4, gy - 13); c.quadraticCurveTo(gx + sd * 14, gy - 2, pv, gy); c.lineTo(ex - sd * 10, gy - 10); c.stroke();
        c.beginPath(); c.moveTo(gx + sd * 4, gy + 13); c.quadraticCurveTo(gx + sd * 14, gy + 2, pv, gy); c.lineTo(ex - sd * 10, gy + 10); c.stroke();
      };
      arm(8, 'rgba(11,26,21,0.85)'); arm(4.5, '#c3cdd2');
      /* 夾口（貼著杯壁的弧形墊片） */
      c.fillStyle = '#8f9ca3'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(gx + sd * 3, gy, 4, 15, 0, 0, TAU); c.fill(); c.stroke();
      /* 支點、末端握環 */
      c.beginPath(); c.arc(pv, gy, 5, 0, TAU); c.fill(); c.stroke();
      [-1, 1].forEach(k => { c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 7; c.beginPath(); c.ellipse(ex - sd * 2, gy + k * 11, 9, 6, 0, 0, TAU); c.stroke(); c.strokeStyle = '#c3cdd2'; c.lineWidth = 3.5; c.stroke(); });
      c.restore();
    }
    /* ⑥ 氯化亞鈷試紙 */
    if (o.paper) { const p = o.paper; O1.cocl(c, p.x, p.y, p.ang || 0, { a: p.a, len: p.len, w: p.w, k: p.k, wet: p.wet }); }
    c.restore();

    /* ⑦ 標籤（畫布座標、22px，不跟著縮放） */
    if (o.labels) {
      const lab = typeof o.labels === 'object' ? o.labels : { candle: 1, coat: 1 };
      const Lz = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
      const M = R.map, L = k => clamp01(lab[k] || 0);
      const lead = (al, p0, p1) => {
        if (al <= 0.02) return; c.save(); c.globalAlpha *= al * a; c.lineCap = 'round';
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
        c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
        c.fillStyle = 'rgba(246,243,234,0.95)'; c.beginPath(); c.arc(p1.x, p1.y, 3.5, 0, TAU); c.fill(); c.restore();
      };
      const pill = (al, str, p, align, col) => { if (al <= 0.02) return; c.save(); c.globalAlpha *= al * a; W5.pill(c, str, p.x, p.y, col || COL.white, 22, align); c.restore(); };
      if (L('candle') && ca > 0.02) { lead(L('candle') * ca, M(cx + 66, 392), M(cx + CAN.CR, 392)); pill(L('candle') * ca, o.candleText || Lz('蠟燭', 'Candle'), M(cx + 66, 392), 'left'); }
      if (L('flame') && lit > 0.02) { const fy = (D.fBase + D.tip) / 2; lead(L('flame'), M(cx + 60, fy), M(cx + 10, fy)); pill(L('flame'), Lz('火焰', 'Flame'), M(cx + 60, fy), 'left'); }
      if (L('coat') && beakerOn) {
        const ly = D.cy - BH / 4; lead(L('coat') * ba, M(D.bx + BW + 40, ly), M(D.bx + ix - CAN.COAT / 2, ly));
        pill(L('coat') * ba, o.coatText || (kind === 'lime' ? Lz('澄清石灰水', 'Clear limewater') : Lz('乾燥的冷燒杯', 'Dry, cold beaker')), M(D.bx + BW + 40, ly), 'left', kind === 'lime' ? COL.teal : COL.white);
      }
      if (L('tong') && tga > 0.02) pill(L('tong') * tga, Lz('夾子', 'Tongs'), M(D.tongEnd.x - D.side * 60, D.grip.y - 36));
    }
    return R;
  };

  /* ══════════════════ 以下由 testh（檢驗氫：氯化亞鈷試紙）新增，2026-11-27 ══════════════════ */
  /* 鑷子（沒有手，自己移動）：夾口尖端在 (x,y)，鑷身往 ang 方向伸出（rad，0＝往右）。
     o：{ a 透明度(1), len 全長(100), w 尾端（相接處）寬(7), bow 兩臂中段最大張開(9), tip 夾口張開(0；夾著東西時 = 試紙厚度一半左右) }
     兩臂在尾端相接、在夾口處靠攏；中段有防滑紋。要夾試紙時：鑷子尖端放在試紙尾端往回 12～16 px 處、ang 與試紙相同（鑷子畫在試紙後面呼叫）。 */
  O1.tweezers = function (c, x, y, ang, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const len = o.len || 100, w = o.w || 7, bow = o.bow == null ? 9 : o.bow, tip = o.tip || 0;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ang || 0); c.lineCap = 'round'; c.lineJoin = 'round';
    const arm = k => { c.beginPath(); c.moveTo(len, k * w / 2); c.quadraticCurveTo(len * 0.45, k * (bow + 2), 0, k * tip); };
    [-1, 1].forEach(k => { c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 7; arm(k); c.stroke(); });
    [-1, 1].forEach(k => { c.strokeStyle = '#c3cdd2'; c.lineWidth = 3.6; arm(k); c.stroke(); });
    /* 尾端相接處 */
    c.fillStyle = '#9aa7ad'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
    W5.rr(c, len - 4, -w / 2 - 2, 10, w + 4, 3); c.fill(); c.stroke();
    /* 防滑紋 */
    c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const px = len * (0.5 + i * 0.06), q = 1 - px / len, off = (bow + 2) * 4 * q * (1 - q) * 0.95 + (w / 2) * (px / len) * 0.4;
      [-1, 1].forEach(k => { c.beginPath(); c.moveTo(px - 2, k * (off - 1.5)); c.lineTo(px + 2, k * (off + 1.5)); c.stroke(); });
    }
    c.restore();
  };

  /* ══════════════════ 以下由 iso（同分異構物）新增，2026-11-27 ══════════════════
     O1.badge(c,x,y,txt,o)        原子旁的小圓標（數數、鍵數；字 18px）
     O1.freeDir(pts,bonds,i)      第 i 顆原子「最空」的方向（離所有鍵最遠的角度，放小圓標用）
     O1.arcPt(p0,p1,k,lift)       兩點之間走弧線（k 0..1 已緩動；lift＞0 往上拱、＜0 往下拱）→ {x,y} */

  /* 小圓標：中心 (x,y)、txt 短字（數字）。o：{ a, k 0..1 彈出, col 外框與字色(黃), r 半徑(13), size 字級(18) } */
  O1.badge = function (c, x, y, txt, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, k = o.k == null ? 1 : clamp01(o.k); if (a <= 0.02 || k <= 0.01) return;
    const col = o.col || COL.yellow, r = (o.r || 13), sc = 0.9 + 0.1 * ease(k) + 0.15 * Math.sin(Math.PI * k);   /* 彈出時最小 0.9 倍，字不會小於 16px */
    c.save(); c.globalAlpha *= a * ease(k); c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = 'rgba(11,26,21,0.92)'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 2.2; c.stroke();
    c.font = W5.font(o.size || 18, true); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = col; c.fillText(String(txt), 0, 1);
    c.restore();
  };

  /* 最空的方向：pts＝[{x,y}]、bonds＝[[i,j],…]；從 16 個方向挑離第 i 顆所有鍵最遠的角度（同分時偏右上）。回傳弧度 */
  O1.freeDir = function (pts, bonds, i) {
    const angs = [];
    bonds.forEach(b => { const j = b[0] === i ? b[1] : b[1] === i ? b[0] : -1; if (j >= 0) angs.push(Math.atan2(pts[j].y - pts[i].y, pts[j].x - pts[i].x)); });
    if (!angs.length) return -Math.PI / 4;
    let best = -Math.PI / 4, bv = -1;
    for (let q = 0; q < 16; q++) {
      const th = -Math.PI / 4 - q * TAU / 16;
      let m = 9; angs.forEach(g => { let d = Math.abs(((th - g) % TAU + TAU) % TAU); d = Math.min(d, TAU - d); m = Math.min(m, d); });
      if (m > bv + 1e-6) { bv = m; best = th; }
    }
    return best;
  };

  /* 弧線內插：p0→p1，k 0..1（自己先緩動）；lift 拱高 px（正＝往上） */
  O1.arcPt = function (p0, p1, k, lift) {
    return { x: lerp(p0.x, p1.x, k), y: lerp(p0.y, p1.y, k) - (lift || 0) * Math.sin(Math.PI * k) };
  };

  /* ══════════════════ 以下由 props（結構不同，性質不同）新增，2026-11-27 ══════════════════
     O1.miniMol(c,m,x,y,o)        小分子（容器裡的粒子；不寫元素符號、可旋轉、指定鍵換色）
     O1.dropper(c,x,y,o)          滴管（沒有手，自己移動；管內液體、尖端液滴、橡皮頭擠壓）
     O1.germ(c,x,y,o)             簡單的細菌（橢圓＋小鞭毛線；可「停止」變灰）
     O1.naBlock(c,x,y,o)          鈉金屬小方塊（銀灰色）
     O1.bubble(c,x,y,r,o)         液體中的小氣泡（透明圈＋高光） */

  /* 小分子：m 來自 O1.MOL，中心 (x,y)＝分子原點。o：{ scale 每單位 px(9), k 原子縮放(0.26), rot 旋轉(rad), a,
     hi 要換色的鍵（MOL 原子編號 [[i,j],…]）, hiCol(黃) }。不寫元素符號（粒子太小，只靠顏色分辨）。 */
  O1.miniMol = function (c, m, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const S = o.scale || 9, k = o.k || 0.26, r = o.rot || 0, cs = Math.cos(r), sn = Math.sin(r), hi = o.hi || [];
    const P = m.atoms.map(A => ({ x: x + (A.x * cs - A.y * sn) * S, y: y + (A.x * sn + A.y * cs) * S }));
    const isHi = b => hi.some(h => (h[0] === b[0] && h[1] === b[1]) || (h[0] === b[1] && h[1] === b[0]));
    c.save(); c.globalAlpha *= a;
    m.bonds.forEach(b => O1.bond(c, P[b[0]].x, P[b[0]].y, P[b[1]].x, P[b[1]].y, { lw: Math.max(2.5, 6 * k), col: isHi(b) ? (o.hiCol || COL.yellow) : null }));
    m.atoms.map((A, i) => i).sort((i, j) => O1.EL[m.atoms[j].el].r - O1.EL[m.atoms[i].el].r)
      .forEach(i => O1.atom(c, P[i].x, P[i].y, m.atoms[i].el, O1.EL[m.atoms[i].el].r * k, { label: false }));
    c.restore();
  };

  /* 滴管（直立，沒有手）：尖端在 (x,y)，往上是玻璃管（長 o.len 55）＋橡皮頭（高 26）；全長約 len＋30。
     o：{ a, len(55), fill 0..1 管內液體多少, col 液體色('#c39bff'), squeeze 0..1 橡皮頭被擠扁, drop 0..1 尖端掛的液滴大小 } */
  O1.dropper = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const len = o.len || 55, col = o.col || '#c39bff', sq = clamp01(o.squeeze || 0), fill = clamp01(o.fill == null ? 0.6 : o.fill);
    const top = y - len;
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    /* 玻璃管：上段寬 12、下段收成尖口 */
    const tube = () => { c.beginPath(); c.moveTo(x - 6, top); c.lineTo(x - 6, y - 16); c.lineTo(x - 2, y); c.lineTo(x + 2, y); c.lineTo(x + 6, y - 16); c.lineTo(x + 6, top); c.closePath(); };
    tube(); c.fillStyle = 'rgba(200,230,245,0.18)'; c.fill();
    /* 管內液體（由下往上 fill） */
    if (fill > 0.02) {
      c.save(); tube(); c.clip();
      const ly = lerp(y, top + 4, fill);
      c.fillStyle = W5.rgba(col, 0.75); c.fillRect(x - 7, ly, 14, y - ly + 1); c.restore();
    }
    tube(); c.strokeStyle = 'rgba(232,246,255,0.9)'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 3, top + 4); c.lineTo(x - 3, y - 20); c.stroke();
    /* 橡皮頭（擠壓時變扁變寬） */
    const bw = 11 * (1 + 0.25 * sq), bh = 26 * (1 - 0.3 * sq);
    const g = c.createLinearGradient(x - bw, 0, x + bw, 0); g.addColorStop(0, '#ff9d7a'); g.addColorStop(1, '#c4553a');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 7, top + 2); c.lineTo(x - bw, top - bh * 0.35);
    c.quadraticCurveTo(x - bw, top - bh, x, top - bh); c.quadraticCurveTo(x + bw, top - bh, x + bw, top - bh * 0.35); c.lineTo(x + 7, top + 2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(70,24,14,0.8)'; c.lineWidth = 1.4; c.stroke();
    /* 尖端液滴 */
    const d = clamp01(o.drop || 0);
    if (d > 0.02) { const r = 5 * d; c.fillStyle = W5.rgba(col, 0.9); c.beginPath(); c.arc(x, y + r * 0.9, r, 0, TAU); c.fill(); }
    c.restore();
  };

  /* 細菌（示意）：中心 (x,y)、身體朝 o.ang（rad，0＝頭朝右，鞭毛在尾端）。
     o：{ a, s 縮放(1)（原寸身長 34、寬 16）, t 秒（鞭毛擺動）, dead 0..1（停止擺動＋變灰）, col 活著的顏色(綠 '#7be0a0'), seed } */
  O1.germ = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const s = o.s || 1, dead = clamp01(o.dead || 0), t = o.t || 0, seed = o.seed || 0;
    /* W5.mix 回傳 rgb()，不能再拿去 mix；這裡自己混成 #hex */
    const hx = (p, q, k) => '#' + [0, 2, 4].map(i => Math.round(lerp(parseInt(p.slice(1 + i, 3 + i), 16), parseInt(q.slice(1 + i, 3 + i), 16), k)).toString(16).padStart(2, '0')).join('');
    const col = hx(o.col || '#7be0a0', '#8a948f', dead), live = 1 - dead;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(o.ang || 0); c.scale(s, s);
    /* 鞭毛：尾端 3 條波浪線（活著時擺動；死掉後垂下不動） */
    c.strokeStyle = W5.mix('#c9f5d8', '#8a948f', dead); c.lineWidth = 1.8; c.lineCap = 'round';
    for (let q = 0; q < 3; q++) {
      const y0 = (q - 1) * 5; c.beginPath(); c.moveTo(-16, y0);
      for (let k = 1; k <= 8; k++) {
        const xx = -16 - k * 2.2, ph = t * 14 * live + q * 1.3 + seed;
        c.lineTo(xx, y0 + (q - 1) * k * 0.35 + Math.sin(k * 0.9 + ph) * 2.6 * (0.35 + 0.65 * live) + dead * k * 0.5);
      }
      c.stroke();
    }
    /* 身體 */
    const g = c.createRadialGradient(-4, -4, 1, 0, 0, 18); g.addColorStop(0, W5.mix(col, '#ffffff', 0.45)); g.addColorStop(1, W5.mix(col, '#0b1a15', 0.35));
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 17, 8, 0, 0, TAU); c.fill();
    c.strokeStyle = W5.mix('#1d5a3a', '#4a524e', dead); c.lineWidth = 1.6; c.stroke();
    /* 體內兩個小點 */
    c.fillStyle = W5.rgba(hx('#1d5a3a', '#4a524e', dead), 0.7);
    c.beginPath(); c.arc(-4, 1, 2, 0, TAU); c.arc(5, -2, 1.6, 0, TAU); c.fill();
    c.restore();
  };

  /* 鈉金屬小方塊（示意）：中心 (x,y)。o：{ a, w 寬(30), h 高(22), rot 旋轉(rad) } —— 銀灰色、切面有金屬光澤 */
  O1.naBlock = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const w = o.w || 30, h = o.h || 22;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(o.rot || 0);
    /* 上面（斜面，稍亮）＋正面 */
    c.fillStyle = '#e3e9ec'; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(-w / 2 + 6, -h / 2 - 6); c.lineTo(w / 2 + 6, -h / 2 - 6); c.lineTo(w / 2, -h / 2); c.closePath(); c.fill();
    c.fillStyle = '#9aa6ad'; c.beginPath(); c.moveTo(w / 2, -h / 2); c.lineTo(w / 2 + 6, -h / 2 - 6); c.lineTo(w / 2 + 6, h / 2 - 6); c.lineTo(w / 2, h / 2); c.closePath(); c.fill();
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#d5dde1'); g.addColorStop(0.55, '#b3bec4'); g.addColorStop(1, '#8a959b');
    c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = 'rgba(40,50,56,0.85)'; c.lineWidth = 1.4; c.strokeRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-w / 2 + 4, -h / 2 + 4); c.lineTo(-w / 2 + 4, h / 2 - 5); c.stroke();
    c.restore();
  };

  /* 液體中的小氣泡：中心 (x,y)、半徑 r。o：{ a, col 外圈色('#e8f6ff') } */
  O1.bubble = function (c, x, y, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || r < 0.5) return;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(232,246,255,0.16)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = W5.rgba(o.col || '#e8f6ff', 0.85); c.lineWidth = Math.max(1, r * 0.22); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.38, Math.max(0.8, r * 0.25), 0, TAU); c.fill();
    c.restore();
  };

  /* ══════════════════ 以下由 cuo（碳還原氧化銅，補充（高中））新增，2026-11-27 ══════════════════
     O1.CU                      顏色：黑色氧化銅、紅色的銅、碳粉
     O1.tstand(c,o)             橫放試管用的鐵架＋夾子（可分兩層畫：back 在試管後、front 夾片在試管前）
     O1.heap(c,x,y,o)           錶玻璃上的一堆黑色粉末（碳粉／氧化銅／兩者混合；可變少）
     O1.tubeBed(c,g,o)          O1.htube 管底的一層粉末：黑色（碳＋氧化銅）→ 從受熱處往兩邊擴散成紅色的銅（中間有紅色亮點）
     O1.grains(c,cx,cy,R,o)     放大鏡內的粉末顆粒（示意）：黑色氧化銅顆粒依序變成紅色銅顆粒，碳顆粒變小
     只增不改；cuso4 之後若要畫粉末可重用 O1.heap、O1.tstand。 */

  /* 兩個 #rrggbb 顏色內插，回傳 #rrggbb（可再丟給 W5.rgba／再內插；W5.mix 回傳 rgb() 不能再內插） */
  const cuMix = (p, q, t) => { const A = [1, 3, 5].map(i => parseInt(p.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(q.slice(i, i + 2), 16));
    return '#' + A.map((v, i) => ('0' + Math.round(v + (B[i] - v) * clamp01(t)).toString(16)).slice(-2)).join(''); };
  O1.CU = { cuo: '#202427', cuoHi: '#6c757b', cu: '#c0583a', cuHi: '#f2a074', cuDk: '#7a2e1a', c: '#3a4246', cHi: '#8e989e' };

  /* 橫放試管的鐵架：o：{ x, y 夾子中心（在管軸上）, gy 桌面 y, top 直桿頂 y, ang 試管傾角(0.08), r 試管外半徑(22), a, part 'back'|'front'|（不給＝兩層都畫） }
     back＝底座、直桿、十字夾、夾臂（畫在試管前先畫）；front＝兩片軟木夾片＋鐵絲（試管畫完再畫）。直桿就在夾子正後方（同 O1.rig 的畫法）。 */
  O1.tstand = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const x = o.x, y = o.y, gy = o.gy, top = o.top == null ? y - 90 : o.top, ang = o.ang == null ? 0.08 : o.ang, r = o.r || 22, part = o.part;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
    if (part !== 'front') {
      const bg = c.createLinearGradient(0, gy - 12, 0, gy); bg.addColorStop(0, '#6d7a82'); bg.addColorStop(1, '#3d474d');
      c.fillStyle = bg; W5.rr(c, x - 70, gy - 12, 140, 12, 3); c.fill(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.stroke();
      const rg = c.createLinearGradient(x - 4, 0, x + 4, 0); rg.addColorStop(0, '#dfe6ea'); rg.addColorStop(1, '#7d8a92');
      c.fillStyle = rg; c.fillRect(x - 4, top, 8, gy - 12 - top); c.strokeRect(x - 4, top, 8, gy - 12 - top);
      const by = y - r - 28;
      c.fillStyle = '#4a555c'; c.fillRect(x - 9, by, 18, 18); c.strokeRect(x - 9, by, 18, 18);
      const arm = () => { c.beginPath(); c.moveTo(x + 9, by + 9); c.lineTo(x + 14, by + 9); c.lineTo(x + 14, y - r - 8); };
      arm(); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.stroke();
      arm(); c.strokeStyle = '#a9b6bd'; c.lineWidth = 5; c.stroke();
    }
    if (part !== 'back') {
      c.translate(x, y); c.rotate(ang);
      c.fillStyle = '#c49a6c'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5;
      [-1, 1].forEach(sg => { W5.rr(c, -12, sg < 0 ? -r - 8 : r + 1, 24, 7, 2); c.fill(); c.stroke(); });
      c.strokeStyle = '#a9b6bd'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-14, -r - 10); c.lineTo(14, -r - 10); c.moveTo(-14, r + 10); c.lineTo(14, r + 10);
      c.moveTo(14, -r - 10); c.lineTo(17, 0); c.lineTo(14, r + 10); c.stroke();
    }
    c.restore();
  };

  /* 錶玻璃上的一堆黑色粉末（示意）：底部中心 (x,y)。
     o：{ a, s 縮放(1), k 0..1.4 粉堆大小（1＝一般；>1 較大堆）, kind 'c' 碳粉（灰黑霧面）| 'cuo' 氧化銅（黑、帶亮點）| 'mix' 兩種混合,
          mix 0..1（kind 'mix' 時：0＝左半碳粉、右半氧化銅還沒拌開；1＝均勻拌開）, glass 是否畫錶玻璃(true), seed }
     回傳粉堆頂端 { x, y }（畫布座標）。 */
  O1.heap = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1, k = o.k == null ? 1 : Math.max(0, o.k), kind = o.kind || 'cuo', seed = o.seed || 3;
    const h = 40 * ease(Math.min(1, k)) * (k > 1 ? 1 + 0.35 * (k - 1) : 1), hw = 44 * (k > 1 ? 1 + 0.25 * (k - 1) : Math.max(0.35, Math.min(1, k * 1.4)));
    const topPt = { x, y: y - (12 + h) * s };
    if (a <= 0.02) return topPt;
    const CU = O1.CU;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    if (o.glass !== false) {
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 3, 66, 8, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(190,230,240,0.22)'; c.strokeStyle = 'rgba(200,236,246,0.9)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-62, -12); c.quadraticCurveTo(0, 12, 62, -12); c.stroke();
      c.beginPath(); c.ellipse(0, -12, 62, 7, 0, 0, TAU); c.fill(); c.stroke();
    }
    if (h > 1) {
      const shape = () => { c.beginPath(); c.moveTo(-hw, -10); c.bezierCurveTo(-hw * 0.65, -12 - h * 0.6, -hw * 0.3, -12 - h, 0, -12 - h);
        c.bezierCurveTo(hw * 0.3, -12 - h, hw * 0.65, -12 - h * 0.6, hw, -10); c.closePath(); };
      shape();
      const base = kind === 'c' ? CU.c : CU.cuo;
      const g = c.createLinearGradient(-hw * 0.6, -12 - h, hw * 0.6, -8); g.addColorStop(0, cuMix(base, '#ffffff', 0.22)); g.addColorStop(0.55, base); g.addColorStop(1, cuMix(base, '#0b1a15', 0.5));
      c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(150,160,166,0.75)'; c.lineWidth = 1.6; c.stroke();
      /* 顆粒：碳＝霧面灰點；氧化銅＝小亮點 */
      c.save(); shape(); c.clip();
      const n = 34, mx = kind === 'mix' ? clamp01(o.mix || 0) : 0;
      for (let i = 0; i < n; i++) {
        const isC = kind === 'c' ? true : kind === 'cuo' ? false : i % 2 === 0;
        let px = (hash(seed * 7 + i * 3.3) - 0.5) * 2 * hw * 0.92;
        if (kind === 'mix') { const half = (isC ? -1 : 1) * (0.1 + 0.85 * hash(seed + i * 5.1)) * hw * 0.92; px = lerp(half, px, ease(mx)); }
        const lim = 1 - Math.abs(px) / (hw * 1.02), py = -11 - hash(seed * 5 + i * 7.7) * h * Math.max(0, lim) * 0.95;
        c.fillStyle = isC ? W5.rgba(CU.cHi, 0.75) : 'rgba(225,235,240,0.85)';
        c.beginPath(); c.arc(px, py, isC ? 2.2 : 1.4, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.restore();
    return topPt;
  };

  /* 試管底的一層粉末：g＝O1.htube 的回傳值（用 g.P、g.ri、g.r 算出管軸與內壁）。
     o：{ a, d0(22)/d1(150) 粉末在管軸上的範圍, h 最厚處(15), k 0..1 裝了幾成（由管底往上變厚）, red 0..1 變成銅的進度（從 hotD 往兩邊擴散）,
          hotD 受熱最強處（預設 d0、d1 中間）, seed, t 秒（亮點閃爍） }
     粉末畫在內壁裡（clip），沿著下管壁平鋪；沒有變紅的地方是黑色（碳＋氧化銅），變紅的前緣有紅色亮點。 */
  O1.tubeBed = function (c, g, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, k = clamp01(o.k == null ? 1 : o.k); if (a <= 0.02 || k <= 0.01) return;
    const d0 = o.d0 == null ? 22 : o.d0, d1 = o.d1 == null ? 150 : o.d1, H = (o.h || 15) * ease(k), hot = o.hotD == null ? (d0 + d1) / 2 : o.hotD;
    const red = clamp01(o.red || 0), seed = o.seed || 7, t = o.t || 0, CU = O1.CU;
    const p0 = g.P(0, 0), p1 = g.P(1, 0), ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), ri = g.ri, r = g.r;
    const span = Math.max(hot - d0, d1 - hot) + 26, front = red * span, soft = 26;
    const fRed = d => clamp01((front - Math.abs(d - hot)) / soft + (red >= 1 ? 1 : 0));
    const thick = d => H * clamp01((d - d0) / 16) * clamp01((d1 - d) / 26) * (0.92 + 0.08 * Math.sin(d * 0.21 + seed));
    c.save(); c.globalAlpha *= a; c.translate(p0.x, p0.y); c.rotate(ang);
    c.beginPath(); c.moveTo(g.len || 300, -ri); c.lineTo(r, -ri); c.arc(r, 0, ri, -Math.PI / 2, Math.PI / 2, true); c.lineTo(g.len || 300, ri); c.closePath(); c.clip();
    const bed = () => { c.beginPath(); c.moveTo(d0 - 4, ri + 2); for (let d = d0; d <= d1 + 0.1; d += 3) c.lineTo(d, ri - thick(d)); c.lineTo(d1 + 4, ri + 2); c.closePath(); };
    bed(); const gg = c.createLinearGradient(0, ri - H, 0, ri); gg.addColorStop(0, '#3a4044'); gg.addColorStop(1, CU.cuo); c.fillStyle = gg; c.fill();
    c.save(); bed(); c.clip();
    /* 變紅（整片顏色，前緣柔和） */
    if (red > 0.001) for (let d = d0 - 4; d <= d1 + 4; d += 2) {
      const f = fRed(d); if (f <= 0.01) continue;
      c.fillStyle = W5.rgba(CU.cu, 0.95 * f); c.fillRect(d, ri - H - 2, 2.4, H + 4);
    }
    /* 顆粒：沒變紅＝灰白小點（碳＋氧化銅），前緣＝紅色亮點，變紅後＝銅色亮點 */
    for (let i = 0; i < 70; i++) {
      const d = d0 + 4 + hash(seed + i * 3.7) * (d1 - d0 - 10), th = thick(d); if (th < 2) continue;
      const y = ri - hash(seed * 3 + i * 5.3) * th * 0.9 - 1, f = fRed(d);
      if (f <= 0.02) { c.fillStyle = 'rgba(200,210,215,0.55)'; c.beginPath(); c.arc(d, y, 1.2, 0, TAU); c.fill(); }
      else if (f < 0.98) {
        const tw = 0.6 + 0.4 * Math.sin(t * 9 + i * 1.7);
        W5.glow(c, d, y, 7, '#ffb27a', 0.55 * tw * Math.sin(Math.PI * f));
        c.fillStyle = W5.rgba('#ff9a5a', 0.95); c.beginPath(); c.arc(d, y, 2.2, 0, TAU); c.fill();
      } else { c.fillStyle = W5.rgba(CU.cuHi, 0.8); c.beginPath(); c.arc(d, y, 1.4, 0, TAU); c.fill(); }
    }
    c.restore();
    bed(); c.strokeStyle = red > 0.5 ? 'rgba(122,46,26,0.8)' : 'rgba(150,160,166,0.6)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
  };

  /* 放大鏡裡的粉末顆粒（示意，沒有畫晶格）：在 (cx,cy) 半徑 R 的圓裡排顆粒（請在呼叫端先 clip）。
     o：{ a, r 顆粒半徑(16), k 0..1 反應進度（每顆氧化銅在自己的時間點由黑變紅、變的時候閃一下；碳顆粒跟著 k 變小）, seed(11), cFrac 碳顆粒比例(0.3), t 秒 }
     回傳 { n 顆粒數, cu 已變紅的顆數 } */
  O1.grains = function (c, cx, cy, R, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, r = o.r || 16, k = clamp01(o.k || 0), seed = o.seed || 11, cf = o.cFrac == null ? 0.3 : o.cFrac, CU = O1.CU;
    const out = { n: 0, cu: 0 }; if (a <= 0.02) return out;
    const d = r * 2.1, pts = [];
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const x = (i + (j & 1) * 0.5) * d + (hash(seed + i * 13 + j * 7) - 0.5) * r * 0.5, y = j * d * 0.87 + (hash(seed * 3 + i * 5 + j * 11) - 0.5) * r * 0.5;
      if (Math.hypot(x, y) <= R + r * 0.6) pts.push({ x: cx + x, y: cy + y, id: (i + 9) * 31 + (j + 9) });
    }
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    pts.forEach((p, n) => {
      const isC = hash(seed * 5 + p.id * 1.3) < cf, th = 0.04 + 0.8 * hash(seed * 7 + p.id * 2.9);
      const q = isC ? 0 : ease(clamp01((k - th) / 0.14)), sc = isC ? 1 - 0.45 * ease(k) : 1;
      const rr = r * sc * (0.85 + 0.25 * hash(p.id + seed)); out.n++; if (q >= 0.5) out.cu++;
      if (!isC && q > 0.01 && q < 0.99) W5.glow(c, p.x, p.y, rr * 2.4, '#ffb27a', 0.6 * Math.sin(Math.PI * q));
      c.beginPath();
      for (let m = 0; m < 7; m++) { const tt = m / 7 * TAU + hash(p.id + m) * 0.4, rm = rr * (0.78 + 0.3 * hash(seed + p.id * 3 + m)); c[m ? 'lineTo' : 'moveTo'](p.x + Math.cos(tt) * rm, p.y + Math.sin(tt) * rm); }
      c.closePath();
      const base = isC ? CU.c : cuMix(CU.cuo, CU.cu, q), hi = isC ? CU.cHi : cuMix(CU.cuoHi, CU.cuHi, q);
      const gg = c.createLinearGradient(p.x - rr, p.y - rr, p.x + rr, p.y + rr); gg.addColorStop(0, hi); gg.addColorStop(0.45, base); gg.addColorStop(1, cuMix(base, '#0b1a15', 0.45));
      c.fillStyle = gg; c.fill(); c.strokeStyle = isC ? 'rgba(20,26,30,0.9)' : W5.rgba(cuMix('#0b1a15', CU.cuDk, q), 0.9); c.lineWidth = 1.4; c.stroke();
      if (!isC) { c.strokeStyle = W5.rgba(cuMix('#e8eef0', '#ffd2b0', q), 0.75); c.lineWidth = 1.6; c.beginPath(); c.arc(p.x - rr * 0.15, p.y - rr * 0.15, rr * 0.5, Math.PI * 1.05, Math.PI * 1.45); c.stroke(); }
    });
    c.restore();
    return out;
  };


  /* ══════════════════ 以下由 cuso4（無水硫酸銅檢驗水，補充）新增，2026-11-27 ══════════════════
     O1.CUSO4                    顏色：白色無水硫酸銅、遇水變成的藍色
     O1.cuso4Pile(c,x,y,o)       蒸發皿＋一堆白色粉末（無水硫酸銅）；可從某一點開始由白變藍、往四周擴散；可有濕痕 → 錨點
     O1.waterDrop(c,x,y,r,o)     一顆水珠（上尖下圓，帶高光；可拉長表示下落）
     只增不改。 */
  O1.CUSO4 = { white: '#fbfbf6', whiteDk: '#c9cec8', blue: '#2f8fe8', blueHi: '#8fd0ff', blueDk: '#1a5ea8' };

  /* 蒸發皿＋粉堆（側視略俯視）：皿底中心 (x,y)。
     o：{ a, s 縮放(1)（原寸：皿口半寬 150、皿高 70、粉堆半寬 112、高 92）, k 0..1 粉堆大小（0＝空皿）,
          blue 0..1.3 由白變藍的範圍（從 (bx,by) 往外擴散；≥ 1.25 保證整堆變藍）, bx, by 變藍起點（畫布座標；預設粉堆頂）,
          wet 0..1 起點的濕痕, seed, dish 是否畫蒸發皿(true) }
     回傳 { rimY 皿口中線 y, base 粉堆底 y, top 粉堆頂 {x,y}, hw 粉堆半寬, surf(px) 粉堆表面在 px 處的 y（畫布座標） }。 */
  O1.cuso4Pile = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, s = o.s || 1, k = clamp01(o.k == null ? 1 : o.k), seed = o.seed || 4, CS = O1.CUSO4;
    const R = 150 * s, H = 70 * s, ry = 22 * s, rimY = y - H, base = rimY + 8 * s;
    const hw = 112 * s * (0.3 + 0.7 * ease(k)), h = 92 * s * ease(k);
    const prof = t => { const q = Math.max(0, 1 - t * t); return q * (0.82 + 0.18 * q) + 0.035 * Math.sin(t * 9 + seed) * q; };
    const surf = px => base - h * prof((px - x) / hw);
    const out = { rimY, base, hw, top: { x, y: surf(x) }, surf };
    if (a <= 0.02) return out;
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    if (o.dish !== false) {
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(x, y + 2, R * 0.62, 9 * s, 0, 0, TAU); c.fill();
      /* 皿身（外側） */
      const body = () => { c.beginPath(); c.moveTo(x - R, rimY); c.bezierCurveTo(x - R * 0.95, y - H * 0.25, x - R * 0.6, y, x - R * 0.32, y);
        c.lineTo(x + R * 0.32, y); c.bezierCurveTo(x + R * 0.6, y, x + R * 0.95, y - H * 0.25, x + R, rimY); c.ellipse(x, rimY, R, ry, 0, 0, Math.PI, false); c.closePath(); };
      body();
      const g = c.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, '#9aa5a1'); g.addColorStop(0.3, '#e6ebe8'); g.addColorStop(0.55, '#d3dad7'); g.addColorStop(1, '#7f8a86');
      c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; c.stroke();
      /* 皿內（橢圓口） */
      c.beginPath(); c.ellipse(x, rimY, R, ry, 0, 0, TAU);
      const gi = c.createLinearGradient(0, rimY - ry, 0, rimY + ry); gi.addColorStop(0, '#8c9793'); gi.addColorStop(1, '#c8d0cc');
      c.fillStyle = gi; c.fill();
    }
    if (h > 1) {
      c.save();
      /* 只畫在皿口前緣上方（粉堆底部被皿的前緣擋住） */
      c.beginPath(); c.rect(x - R - 10, 34, 2 * R + 20, rimY - 34); c.ellipse(x, rimY, R - 2, ry - 1, 0, 0, TAU); c.clip();
      const shape = () => { c.beginPath(); c.moveTo(x - hw, base); for (let i = 1; i <= 40; i++) { const px = x - hw + 2 * hw * i / 40; c.lineTo(px, surf(px)); } c.lineTo(x + hw, base + 6 * s); c.lineTo(x - hw, base + 6 * s); c.closePath(); };
      shape(); c.fillStyle = CS.white; c.fill();
      c.save(); shape(); c.clip();
      const bx = o.bx == null ? x : o.bx, by = o.by == null ? surf(x) : o.by, bl = Math.max(0, Math.min(1.3, o.blue || 0));
      const Rmax = Math.max(Math.hypot(bx - x + hw, by - base), Math.hypot(bx - x - hw, by - base), Math.hypot(bx - x, by - surf(x))) * 1.05;
      const Rk = bl * Rmax;
      if (Rk > 1) {
        const gb = c.createRadialGradient(bx, by, 0, bx, by, Rk);
        gb.addColorStop(0, CS.blue); gb.addColorStop(0.8, CS.blue); gb.addColorStop(1, W5.rgba(CS.blue, 0));
        c.fillStyle = gb; c.fillRect(x - hw - 4, by - Rk - 4, 2 * hw + 8, base - by + Rk + 20);
      }
      /* 立體感：左上亮、右下暗 */
      const gs = c.createLinearGradient(x - hw * 0.5, surf(x) , x + hw * 0.7, base);
      gs.addColorStop(0, 'rgba(255,255,255,0.30)'); gs.addColorStop(0.5, 'rgba(255,255,255,0)'); gs.addColorStop(1, 'rgba(40,60,70,0.30)');
      c.fillStyle = gs; c.fillRect(x - hw - 2, base - h - 4, 2 * hw + 4, h + 14 * s);
      /* 顆粒：白色區灰點、藍色區深藍點與亮點 */
      for (let i = 0; i < (h > 10 * s ? 70 : 0); i++) {
        const px = x + (hash(seed * 7 + i * 3.1) - 0.5) * 2 * hw * 0.94, top = surf(px);
        const py = top + 3 * s + hash(seed * 5 + i * 7.3) * Math.max(0, base - top - 4 * s);
        const isBlue = Math.hypot(px - bx, py - by) < Rk * 0.86;
        c.fillStyle = isBlue ? (i % 3 ? W5.rgba(CS.blueDk, 0.7) : W5.rgba(CS.blueHi, 0.85)) : (i % 3 ? 'rgba(150,160,154,0.6)' : 'rgba(255,255,255,0.95)');
        c.beginPath(); c.arc(px, py, (i % 3 ? 1.6 : 1.2) * Math.max(0.8, s), 0, TAU); c.fill();
      }
      const wet = clamp01(o.wet || 0);
      if (wet > 0.02) { c.fillStyle = 'rgba(120,150,170,' + (0.35 * wet).toFixed(3) + ')'; c.beginPath(); c.ellipse(bx, by + 4 * s, 22 * s * wet, 9 * s * wet, 0, 0, TAU); c.fill(); }
      c.restore();
      if (h > 10 * s) { shape(); c.strokeStyle = Rk > hw * 1.4 ? 'rgba(14,52,96,0.85)' : 'rgba(120,130,124,0.9)'; c.lineWidth = 1.6; c.stroke(); }
      c.restore();
    }
    if (o.dish !== false) {
      /* 皿口前緣（蓋住粉堆底部）＋後緣 */
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, rimY, R, ry, 0, Math.PI, TAU); c.stroke();
      c.strokeStyle = '#f2f5f3'; c.lineWidth = 4 * Math.max(0.7, s); c.beginPath(); c.ellipse(x, rimY, R, ry, 0, 0.05, Math.PI - 0.05); c.stroke();
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, rimY + 2 * s, R, ry, 0, 0.05, Math.PI - 0.05); c.stroke();
    }
    c.restore();
    return out;
  };

  /* 水珠：中心 (x,y)（圓的部分）、半徑 r。o：{ a, col('#4dd2ff'), stretch 0..1 下落時往上拉長 } */
  O1.waterDrop = function (c, x, y, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || r < 0.5) return;
    const col = o.col || '#4dd2ff', st = clamp01(o.stretch || 0), tip = r * (1.5 + 1.2 * st);
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.moveTo(x, y - tip);
    c.bezierCurveTo(x + r * 0.35, y - tip * 0.6, x + r, y - r * 0.5, x + r, y);
    c.arc(x, y, r, 0, Math.PI, false);
    c.bezierCurveTo(x - r, y - r * 0.5, x - r * 0.35, y - tip * 0.6, x, y - tip); c.closePath();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r * 1.3);
    g.addColorStop(0, 'rgba(235,250,255,0.95)'); g.addColorStop(0.45, W5.rgba(col, 0.9)); g.addColorStop(1, W5.rgba(col, 0.75));
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.15, r * 0.18, r * 0.3, -0.4, 0, TAU); c.fill();
    c.restore();
  };


})(window);
