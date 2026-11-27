/* ==================================================================
   mechanics_4_common_1126_v1.js ｜ 壓力與液體壓力：本單元 12 支動畫共用的畫法（window.M4）
   ------------------------------------------------------------------
   第一支動畫（pdef）建立；之後的動畫只能「新增」函式（附在速查裡），不改既有函式的簽名。
   依賴 work_5_kit_1103_v1.js（W5）與 mechanics_3_common_1126_v1.js（M3）；載入順序：kit → M3 → M4 → 各動畫檔。
   文字、時間軸、力的箭頭、材質板、放大鏡、March……都直接用 M3（M4 只放別名，方便少打字）。

   ── 速查 ──
   常數   M4.PC（本單元語意色：force 施力青、weight 重量粉、pressure 壓力珊瑚、water／waterEdge 水、oil 油、air 氣體、atm 大氣壓、formula 公式黃）
          M4.SKIN（手的膚色）  M4.BALLOON（氣球預設色）
   別名   M4.L  M4.T  M4.P  M4.withA  M4.since  M4.fin  M4.fout  M4.grow  M4.caption（＝ M3 同名函式）
   壓力   M4.pPill(c,a,str,x,y,size,align)（珊瑚色壓力 pill＋淡光暈）→ 外框
          M4.pArrow(c,x,tipY,len,o)（壓力箭頭：尖端在 (x,tipY)＝被壓的面；o.dir 'down'(預設)|'up'|'left'|'right'；
                    len 由呼叫端依「長度∝壓力」算好；len＜28 自動改成細箭頭）
   手與板 M4.hand(c,x,palmY,o)（現在畫的是「重物」不是手：x＝中線、palmY＝重物底面；o：{ dir 'left'|'right' 手指朝向, armTop 手臂從哪裡畫起(淡出), a }）
          M4.pressPlate(c,cx,by,w,o)（壓板：底面在 by；o：{ thick(16), a, mat('lightwood'), hand true, gap 手懸在板上方幾 px(0), dir, armTop }）
                    → { x0, x1, top, by, palmY }（palmY＝手掌底面，施力箭頭的尖端放這裡）
   氣球   M4.balloon(c,cx,by,o)（圓潤氣球，底部貼 by；o：{ w(150), h(128), col, a, box 0..1 被上下壓平的程度（頂面、底面切平）, dimple:{x,depth,wid} 底部被釘尖頂出的凹點 }）
                    → { x0, x1, top, by, cx, cy }
          M4.balloonPop(c,x,y,t,o)（爆破：t＝爆破後秒數，0～1.1 秒內畫閃光＋碎片飛散；o：{ col, seed, a, r 氣球半徑(70), floorY 碎片落到哪(不設＝不落地) }）
          M4.balloonScraps(c,x,tipY,baseY,o)（破掉後的殘骸：垂在釘尖上的一片＋桌上兩小片；o：{ col, a }）
   釘子   M4.nail(c,x,by,h,o)（一根釘子尖朝上立在 by 上；o：{ w 釘身寬(10), a, head 釘頭寬(w×2.6) }）→ 尖端 y
          M4.nailBed(c,cx,by,w,o)（一片密集釘板：前後三排、尖朝上；o：{ n 前排根數(21), h 高(54), a }）→ { tipY, xs 前排尖端的 x }
   放大   M4.zoomLeader(c,tx,ty,cx,cy,r,o)（被放大處畫小圈＋連到放大鏡框的兩條虛線；o：{ a, col, mark 小圈半徑(14) }）
   立體   M4.rot3(beta,gamma)（3×3 旋轉矩陣＝先繞 x 軸 beta、再繞 z 軸 gamma；world＝R·body）
          M4.obl(ox,oy,k,kx,ky)（斜視投影 (x,y,z)→[sx,sy]：x 右、y 上、z 往後＝往右上 (kx 0.5, ky 0.34)，k 縮放，(0,0,0)→(ox,oy)）
          M4.box3(c,o)（可任意旋轉的長方體，斜視畫出看得到的面＋依法向量打光；o：{ pj 投影(M4.obl), ctr [x,y,z], half [hx,hy,hz] 半邊長(body),
                    R 旋轉(M4.rot3), col 底色('#c4624a' 磚紅), a, pits 每面小氣孔數(9), seed }）→ { V 八頂點 world, S 八頂點 screen, vis 六面是否看得到, edges(axis) }
                    M4.box3.extent(R,half) → { x:[min,max], y:[..], z:[..] }（旋轉後相對中心的範圍，放在地面上用）；brick 建立
   液體   M4.tank(c,o)（側視剖面水桶＋水：o：{ x0,x1 內壁, bot 內底 y, top 桶口 y, level 水面 y, wall 壁厚(6), holes:[{y,side 'right'|'left',r 半徑(5)}],
                    t 時間(水面微波), wob 波幅(1.6), a, glow 水面亮線光暈(0..1) }）→ { x0,x1,bot,top,level, outL,outR 外壁 x, surf(x) 水面 y }；depth 建立
          M4.jetRange(h,drop)（托里切利水平射程 ＝ 2√(h×drop)，h＝洞的深度、drop＝洞到落點的落差，單位一致即可）
          M4.jet(c,o)（真正的拋物線噴流：o：{ x,y 洞口, h 洞深(px), landY 落點 y, dir 1 右|-1 左, f 0..1 噴流前緣走到的「飛行時間」比例,
                    t 時間(流動的水滴虛線), lw 粗細(依 h 自動), a, splash true }）→ { xl 落點 x, pts, front:[x,y] }；h≤0 不畫
          M4.plug(c,x,y,o)（洞口軟木塞：o：{ dir 1 塞頭朝右, a, rot 轉角 }）  M4.trough(c,x0,x1,gy,o)（地上接水槽；o：{ h(24), a }）→ 水面 y
          M4.depthRuler(c,x,y0,y1,k,o)（直立量尺：0 在 y0（自由液面），往下每 5 cm 一格、10 cm 長刻度；k＝px／cm；o：{ a, w 寬(14) }）
   杯子   M4.cup(c,o)（側視剖面玻璃杯＋水，杯身是上下兩個內半寬的梯形（＝圓台）：o：{ cx 中線, bot 內底 y, rim 杯口 y, rb 內底半寬, rt 杯口內半寬,
                    level 水面 y（≥ bot＝空杯）, wall 壁厚(6), base 杯底厚(10), t 時間(水面微波), wob 波幅(1.6), a, glow 水面亮線光暈(0..1) }）
                    → { cx,bot,rim,rb,rt,level, half(y) 該高度的內半寬, surf(x) 水面 y, outBot 杯底外緣 y }；shape 建立
          M4.pour(c,x,y0,y1,o)（由上往下倒的一道水柱：上端 y0 淡入、落到 y1（水面）濺起漣漪；o：{ w 寬(7), t 時間(流動的水滴), a, splash true, rw 漣漪寬(22) }）；shape 建立
   氣體   M4.atmArrow(c,x,tipY,len,o)（大氣壓／氣體壓力箭頭（灰白）：尖端在 (x,tipY)＝被壓的面；o：{ dir 'down'|'up'|'left'|'right', a, lw(6), col(M4.PC.atm),
                    brk 斷軸記號離箭尾幾 px（null＝不畫；用在「前面 1000 省略」的長度畫法） }）
          M4.airDots(c,x0,y0,x1,y1,o)（容器內的空氣分子點（淡白、確定性位置）：位置是框內的「比例」→ 框變大，點就照比例散開；
                    o：{ n(28), cols 每列幾點(8), seed, t 時間(微微抖動), a, r 半徑(3.2) }）
          M4.lid(c,x0,x1,rimY,o)（水桶的密閉蓋（側視剖面）＋橡皮墊：rimY＝桶口頂面（M4.tank 的 top－4）；o：{ over 蓋子比桶外壁多出(10), thick(12), gasket 墊厚(6),
                    squash 0..1 墊被壓扁, vent 通氣孔 x（null＝沒有）, open 0..1 通氣孔蓋掀開, a }）→ { top, bot 蓋子底面, ventX, ventTop }
          M4.gauge(c,cx,cy,r,o)（圓形指針壓力計：o：{ min, max, val, mark 標記刻度值, markLabel 標記文字(22px，畫在錶外), markCol, from 拖尾起點值(畫一段弧＝已經降了多少), a,
                    ticks 每幾單位一格(10), sweep 270°(左下→右下順時針) }）→ { ang(v) 該值的角度 }；seal 建立
   連通管 M4.connected(c,o)（底部一條水平管連通的一排容器＋水（側視剖面）：o：{ floor 管內底 y, pipeTop 管內頂 y, px0,px1 管內兩端 x, wall(6),
                    vessels:[{ pts:[[y,xl,xr],…] 內壁（由 pipeTop 往上到口，線性內插）, level 水面 y }], t, wob(1.4), a, glow, pipeGlow 0..1 管外緣亮光, water(true) }）
                    → { vessels:[{ edge(y)→[xl,xr], level, surf(x) }] }；level 建立
   量尺   M4.heightRuler(c,x,y0,k,hMax,o)（直立高度尺：0 在 y0（底）往上，每 5 cm 一格、每 10 cm 數字 22px；o：{ a, w(14), every(10), unit('cm'，null＝不寫) }）；level 建立
   水龍頭 M4.faucet(c,x,y,o)（出水口尖端 (x,y) 朝下；o：{ dir -1 本體往左(預設)|1 往右, len(80), open 0..1 把手轉開, drop 出水口長(26), a }）→ { x, y, bodyY }；level 建立
   水管   M4.pipe(c,lines,o)（剖面水管網：lines＝[{ pts:[[x,y],…], wetTop 這條管 y ≥ wetTop 才有水（不設＝整條有水）, flow 流動亮點(false) }]；
                    先畫全部管壁、再畫全部管內 → 分岔、轉角接得起來；o：{ r 管內半寬(5), wall 壁厚(4), t 時間, a }）；app 建立
   等高線 M4.levelDash(c,x0,x1,y,o)（「同一水平」的水藍虛線：o：{ g 0..1 從 x0 長到 x1, a, lw(3) }）；app 建立
   打勾   M4.okMark(c,x,y,ok,o)（圓形小章：ok true＝綠勾、false＝紅叉；o：{ r(15), a }）；app 建立
   活塞   M4.piston(c,x,y,o)（剖面活塞筒＋活塞：(x,y)＝筒口與容器內壁交界的中點；o：{ dir 筒往哪邊伸出 'up'(預設)|'down'|'left'|'right', w 筒內寬, len 筒長(由內壁量起),
                    pos 活塞內面離筒口幾 px（0＝與內壁齊平）, th 活塞厚(14), rod 活塞桿長(0), handle 把手寬(0＝不畫), wall 筒壁厚(6), water true 筒口到活塞內面畫水, a }）
                    → { face:[x,y] 活塞內面中點, out:[x,y] 活塞（或把手）最外側中點 }；transmit 建立（jack、work 可重用）
          M4.gaugeLink(c,x0,y0,x1,y1,o)（容器壁接到壓力計的一段直導管（同 seal 的畫法）；o：{ a }）；transmit 建立
          M4.pWaves(c,cx,cy,t,o)（壓力由 (cx,cy) 一圈一圈往外擴散的珊瑚波＋徑向短箭頭（確定性）：t＝開始後幾秒；
                    o：{ clip(c) 只在這條路徑內畫（例：容器內部）, dur 發波幾秒(4), gap 每圈間隔秒(0.55), speed px/s(170), rMax(420),
                    ang:[a0,a1] 短箭頭的角度範圍(rad，y 向下；預設 [-0.35, π＋0.35]), n 每圈箭頭數(9), len(18), a }）；transmit 建立
   千斤頂 M4.jack(c,o)（液壓千斤頂剖面：底部一條水平連通管＋左小、右大兩個朝上的活塞筒（M4.piston），裡面裝滿水：
                    o：{ mouth 管內頂 y（＝兩筒筒口）, floor 管內底 y, wall 管壁厚(8), a,
                    s／b：左小／右大活塞 { x 中線, w 筒內寬, len, pos, th, rod, handle }（同 M4.piston，dir 固定 'up'） }
                    → { s, b 兩個 M4.piston 的回傳, x0,x1 管內兩端 x, clip(c) 液體範圍（兩筒＋連通管）的路徑，給 M4.pWaves 的 o.clip 用 }；jack 建立（work 可重用）
   行程   M4.cmRuler(c,x,y0,k,n,o)（行程尺：從 y0 起往 o.dir（'down' 預設｜'up'）量 n cm，每 1 cm 一短刻度、每 5 cm 長刻度，不寫數字；k＝px／cm；
                    o：{ a, w 寬(14), side 刻度貼哪一邊 'left'(預設)|'right', hi:[c0,c1] 把第 c0～c1 cm 那段塗亮(黃) , hiA 亮段透明度(1) }）→ y(cm) 該刻度的 y；work 建立
          M4.slug(c,x,y0,y1,w,o)（一段被標亮的液體「圓柱」：中線 x、上下 y0～y1、直徑 w；畫成剖面長方形＋上下橢圓（看得出是圓柱、體積 ∝ w²×高）；
                    o：{ a, ry 橢圓半高(w×0.11), top 畫上橢圓(true), bottom 畫下緣前半弧(true), fillA 填色(0.42), dash 虛線外框(true), glow 光暈(0..1), phase 虛線流動 }）；work 建立
   空氣球 M4.airBall(c,cx,cy,r,o)（柔軟透明的空氣球（淺白藍＋高光＋底部小結），球心 (cx,cy)、半徑 r；裡面畫固定 n 顆空氣分子點（位置是單位圓內的比例 → 球變小，點就擠在一起）；
                    o：{ a, col('#cfe9ff'), n 分子點數(16), seed, t 時間(微微抖動), knot 底部小結(true), ghost 原本大小的半徑（畫白色虛線圓；null＝不畫）, ghostA(1) }）→ { cx, cy, r }；total 建立
          M4.squeeze(c,cx,cy,r,parts,o)（從四周向內壓球的壓力箭頭：n 支沿徑向、尖端貼在球面（r＋gap）；parts＝[{ len, col }] 由外往內首尾相接的分段（最內一段帶箭頭），
                    長度由呼叫端依「長度∝壓力」算好；o：{ n(6), ang0 第一支的方向角(rad，y 向下；0＝從右邊壓), gap(2), lw(5), a }）；total 建立
   U 型管 M4.uTube(c,o)（兩臂同粗的玻璃 U 型管（側視剖面）＋水＋右臂可疊一段油：o：{ xl,xr 兩臂中線, yb 直臂下端（彎管圓心）y, rim 管口 y, hw 管內半寬(22), wall(6),
                    lvL 左水面 y, lvR 右臂水的頂面 y（有油時＝油水交界）, oilTop 右臂油面 y（null＝沒有油）, t, wob 液面微波(1), a }）
                    → { cx, R, iface, surfL(x), surfR(x) 右臂最上面的液面, path(c) 管內輪廓路徑（clip 用） }；utube 建立
          M4.pourLiquid(c,x,y0,y1,o)（同 M4.pour，但可換顏色：o：{ col 液體色(M4.PC.oil), hi 亮點色('#ffe2a8'), rim 漣漪色(同 hi), w(7), t, a, splash true, rw(14) }）；utube 建立
          M4.sideRuler(c,x,y0,k,hMax,o)（直立量尺：0 在 y0 往上、每 5 cm 一格、每 10 cm 長刻度；數字 22px 寫在 o.side 'left'|'right'(預設) 那一側；
                    o：{ a, w(14), nums 要寫的數值([10,20…]), g 0..1 由 0 往上長出, col 數字色(淡灰) }）；utube 建立
   ================================================================== */
(function (root) {
  'use strict';
  const M4 = root.M4 = root.M4 || {};
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, clamp01 = W5.clamp01, ease = W5.ease, lerp = W5.lerp, hash = W5.hash;

  /* ═══════════ 常數 ═══════════ */
  M4.PC = {
    force: COL.teal, weight: COL.pink, pressure: COL.coral, formula: COL.yellow,
    water: '#2f8fd8', waterEdge: '#7cc9ff', oil: '#e0a84a', air: '#dfe8e4', atm: '#e6ece9'
  };
  M4.SKIN = { fill: '#f0c39a', shade: '#d39a6c', line: 'rgba(96,52,28,0.55)', sleeve: '#5d6f96', sleeveDk: '#3f4d6d' };
  M4.BALLOON = '#a77bff';

  /* ═══════════ 別名（沿用 M3） ═══════════ */
  ['L', 'T', 'P', 'withA', 'since', 'fin', 'fout', 'grow', 'caption'].forEach(k => { M4[k] = M3[k]; });

  /* ═══════════ 壓力 ═══════════ */
  M4.pPill = function (c, a, str, x, y, size, align) {
    if (a <= 0.02) return null;
    W5.glow(c, x, y, 90, COL.coral, 0.10 * a);
    return M3.P(c, a, str, x, y, COL.coral, size || 22, align);
  };
  M4.pArrow = function (c, x, tipY, len, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || len < 1) return;
    const D = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[o.dir || 'down'];
    const x0 = x - D[0] * len, y0 = tipY - D[1] * len;
    if (len >= 28) { M3.arrowFx(c, x0, y0, x, tipY, COL.coral, a, o.lw || 7, 0); return; }
    M3.withA(c, a, () => {
      const lw = o.lw || 3, head = Math.max(6, Math.min(9, len * 0.6));
      W5.arrow(c, x0, y0, x, tipY, 'rgba(11,26,21,0.85)', lw + 3, head + 2);
      W5.arrow(c, x0, y0, x, tipY, COL.coral, lw, head);
    });
  };

  /* ═══════════ 手與壓板 ═══════════ */
  /* 「手」已全面改成重物（老師 2026-11-27 規範：不畫手，一律用重物取代）。函式名稱 M4.hand 與參數保留，
   * 讓既有動畫不必改；掌心位置 palmY＝重物底面，施力箭頭的尖端照舊放在這裡。 */
  M4.hand = function (c, x, palmY, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      const bw = 64, bh = 40, x0 = x - bw / 2, y0 = palmY - bh;
      /* 吊環 */
      c.strokeStyle = '#d6dde3'; c.lineWidth = 4; c.beginPath(); c.arc(x, y0 - 6, 8, Math.PI, 0); c.stroke();
      /* 重物本體：粉色系（重量＝粉） */
      const g = c.createLinearGradient(0, y0, 0, palmY); g.addColorStop(0, '#8a4a68'); g.addColorStop(1, '#5a2f45');
      c.fillStyle = g; c.strokeStyle = '#f472b6'; c.lineWidth = 3; W5.rr(c, x0, y0, bw, bh, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.16)'; W5.rr(c, x0 + 6, y0 + 5, bw - 12, 7, 3); c.fill();
      c.restore();
    });
  };
  M4.pressPlate = function (c, cx, by, w, o) {
    o = o || {}; const th = o.thick || 16, a = o.a == null ? 1 : o.a, top = by - th;
    M3.slab(c, cx - w / 2, top, cx + w / 2, by, o.mat || 'lightwood', { a, seed: o.seed || 7, r: 4 });
    const palmY = top - (o.gap || 0);
    if (o.hand !== false) M4.hand(c, cx, palmY, { dir: o.dir, armTop: o.armTop, a });
    return { x0: cx - w / 2, x1: cx + w / 2, top, by, palmY };
  };

  /* ═══════════ 氣球 ═══════════ */
  /* 橢圓（box＞0 時縱向放大再被上下兩條接觸線切平＝被壓扁的樣子）＋底部凹點 */
  function balloonPath(c, cx, cy, rx, ry, box, dim, by) {
    c.beginPath();
    const N = 96, ryE = ry * (1 + 0.32 * box), top = cy - ry;
    for (let i = 0; i <= N; i++) {
      const q = i / N * TAU, cs = Math.cos(q), sn = Math.sin(q);
      let x = cx + rx * cs, y = cy + ryE * sn;
      if (y < top) y = top;
      if (by != null && y > by) y = by;
      if (dim && sn > 0) { const d = (x - dim.x) / (dim.wid || 22); y -= (dim.depth || 0) * Math.exp(-d * d); }
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  M4.balloon = function (c, cx, by, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a;
    const w = o.w || 150, h = o.h || 128, col = o.col || M4.BALLOON, box = clamp01(o.box || 0);
    const rx = w / 2, ry = h / 2, cy = by - ry, n = box;
    const res = { x0: cx - rx, x1: cx + rx, top: by - h, by, cx, cy };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 影子 */
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse(cx, by + 2, rx * 0.8, 5, 0, 0, TAU); c.fill();
      balloonPath(c, cx, cy, rx, ry, n, o.dimple, by);
      const g = c.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 4, cx, cy, Math.max(rx, ry) * 1.15);
      g.addColorStop(0, W5.mix(col, '#ffffff', 0.55)); g.addColorStop(0.45, col); g.addColorStop(1, W5.mix(col, '#1a1030', 0.55));
      c.fillStyle = g; c.fill();
      c.strokeStyle = W5.mix(col, '#ffffff', 0.35); c.lineWidth = 2; c.stroke();
      /* 高光 */
      c.save(); balloonPath(c, cx, cy, rx, ry, n, o.dimple, by); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.ellipse(cx - rx * 0.42, cy - ry * 0.42, rx * 0.17, ry * 0.11, -0.6, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath(); c.ellipse(cx - rx * 0.22, cy - ry * 0.58, rx * 0.07, ry * 0.05, -0.6, 0, TAU); c.fill();
      /* 下緣反光 */
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(cx + rx * 0.05, cy + ry * 0.05, rx * 0.82, ry * 0.8, 0, 0.3, 1.25); c.stroke();
      c.restore();
      c.restore();
    });
    return res;
  };
  M4.balloonPop = function (c, x, y, t, o) {
    o = o || {}; if (t < 0 || t > 1.1) return;
    const a = o.a == null ? 1 : o.a, col = o.col || M4.BALLOON, seed = o.seed || 5, r = o.r || 70;
    M3.withA(c, a, () => {
      /* 閃光與衝擊圈 */
      const fa = 1 - clamp01(t / 0.35);
      if (fa > 0.02) M3.flash(c, x, y, 26 + 50 * ease(clamp01(t / 0.25)), '#fff2d6', fa, 0.3);
      const ra = 1 - clamp01(t / 0.5);
      if (ra > 0.02) { c.save(); c.globalAlpha *= ra; c.strokeStyle = W5.mix(col, '#ffffff', 0.5); c.lineWidth = 4;
        c.beginPath(); c.arc(x, y, r * (0.6 + 0.9 * ease(clamp01(t / 0.5))), 0, TAU); c.stroke(); c.restore(); }
      /* 碎片（確定性） */
      const fadeA = 1 - clamp01((t - 0.55) / 0.5);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * TAU + (hash(seed + i) - 0.5) * 0.5, sp = 170 + 110 * hash(seed + i + 20);
        const x0 = x + Math.cos(ang) * r * 0.55, y0 = y + Math.sin(ang) * r * 0.45;
        let px = x0 + Math.cos(ang) * sp * t, py = y0 + Math.sin(ang) * sp * t + 420 * t * t;
        if (o.floorY != null && py > o.floorY - 3) py = o.floorY - 3;
        const rot = ang + t * (6 + 6 * hash(seed + i + 40)) * (i % 2 ? 1 : -1), s = 7 + 6 * hash(seed + i + 60);
        c.save(); c.globalAlpha *= fadeA; c.translate(px, py); c.rotate(rot);
        c.fillStyle = i % 3 ? col : W5.mix(col, '#ffffff', 0.35);
        c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.8, -s * 0.6); c.lineTo(s * 0.4, s * 0.55); c.lineTo(-s * 0.6, s * 0.4); c.closePath(); c.fill();
        c.restore();
      }
    });
  };
  M4.balloonScraps = function (c, x, tipY, baseY, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || M4.BALLOON;
    M3.withA(c, a, () => {
      c.save();
      const dk = W5.mix(col, '#1a1030', 0.35);
      /* 垂在釘尖上的一片 */
      c.fillStyle = dk; c.strokeStyle = W5.mix(col, '#ffffff', 0.3); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x - 4, tipY + 2);
      c.quadraticCurveTo(x - 18, tipY + 8, x - 22, tipY + 26); c.lineTo(x - 13, tipY + 22); c.lineTo(x - 9, tipY + 30);
      c.quadraticCurveTo(x - 4, tipY + 14, x, tipY - 1);
      c.quadraticCurveTo(x + 6, tipY + 12, x + 14, tipY + 20); c.lineTo(x + 19, tipY + 13);
      c.quadraticCurveTo(x + 12, tipY + 4, x + 4, tipY + 2); c.closePath(); c.fill(); c.stroke();
      /* 桌上的兩小片 */
      [[-52, 1.0, 0.2], [44, 0.8, -0.3]].forEach(([dx, s, r]) => {
        c.save(); c.translate(x + dx, baseY - 3); c.rotate(r);
        c.fillStyle = dk; c.beginPath(); c.moveTo(-12 * s, 2); c.quadraticCurveTo(-4 * s, -7 * s, 8 * s, -3 * s); c.lineTo(13 * s, 3); c.closePath(); c.fill(); c.stroke();
        c.restore();
      });
      c.restore();
    });
  };

  /* ═══════════ 釘子 ═══════════ */
  function nailBody(c, x, by, h, w, head, lite) {
    const tipH = Math.max(6, w * 1.6), sh = by - 4, top = by - h;
    /* 釘頭（貼桌面） */
    const hg = c.createLinearGradient(0, by - 5, 0, by);
    hg.addColorStop(0, lite ? '#eef3f6' : '#c9d3d9'); hg.addColorStop(1, '#6f7d86');
    c.fillStyle = hg; W5.rr(c, x - head / 2, by - 5, head, 5, 2); c.fill();
    /* 釘身＋尖 */
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, lite ? '#9aa8b1' : '#7d8b94'); g.addColorStop(0.4, lite ? '#ffffff' : '#e4eaee'); g.addColorStop(1, lite ? '#7f8d96' : '#5f6c75');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - w / 2, sh); c.lineTo(x - w / 2, top + tipH); c.lineTo(x, top); c.lineTo(x + w / 2, top + tipH); c.lineTo(x + w / 2, sh); c.closePath(); c.fill();
    if (w >= 6) { c.strokeStyle = 'rgba(30,40,46,0.55)'; c.lineWidth = 1; c.stroke(); }
    return top;
  }
  M4.nail = function (c, x, by, h, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 10, head = o.head || w * 2.6;
    if (a > 0.02) M3.withA(c, a, () => { c.save(); nailBody(c, x, by, h, w, head, true); c.restore(); });
    return by - h;
  };
  M4.nailBed = function (c, cx, by, w, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, n = o.n || 21, h = o.h || 54, gap = w / (n - 1);
    const xs = []; for (let i = 0; i < n; i++) xs.push(cx - w / 2 + i * gap);
    if (a > 0.02) M3.withA(c, a, () => {
      c.save();
      /* 後兩排：往上錯開、顏色暗一點（看起來是一整片） */
      [[2, 0.5, 0.45], [1, 0.25, 0.7]].forEach(([row, off, al]) => {
        c.save(); c.globalAlpha *= al;
        xs.forEach((x, i) => { if (i < n - 1 || off === 0) nailBody(c, x + gap * off, by - row * 3, h - row * 0.5, 3.4, 7, false); });
        c.restore();
      });
      if (!o.frontLater) xs.forEach(x => nailBody(c, x, by, h, 3.8, 8, true));
      c.restore();
    });
    return { tipY: by - h, xs, gap };
  };
  /* 釘板前排（balloon 要夾在後排與前排之間時，先 nailBed(...,{frontLater:true}) 再畫氣球，最後畫這個） */
  M4.nailBedFront = function (c, cx, by, w, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, n = o.n || 21, h = o.h || 54, gap = w / (n - 1);
    if (a > 0.02) M3.withA(c, a, () => { c.save(); for (let i = 0; i < n; i++) nailBody(c, cx - w / 2 + i * gap, by, h, 3.8, 8, true); c.restore(); });
  };

  /* ═══════════ 放大 ═══════════ */
  M4.zoomLeader = function (c, tx, ty, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const mk = o.mark || 14, col = o.col || COL.white;
    M3.withA(c, a, () => {
      c.save(); c.strokeStyle = W5.rgba(col, 0.75); c.lineWidth = 2; c.setLineDash([6, 5]);
      const d = Math.hypot(tx - cx, ty - cy), ux = (tx - cx) / d, uy = (ty - cy) / d, px = -uy, py = ux;
      /* 兩條切線狀的虛線：放大鏡框兩側 → 小圈兩側 */
      [1, -1].forEach(sg => {
        c.beginPath(); c.moveTo(cx + px * sg * r * 0.7 + ux * r * 0.72, cy + py * sg * r * 0.7 + uy * r * 0.72);
        c.lineTo(tx + px * sg * mk * 0.9 - ux * mk * 0.4, ty + py * sg * mk * 0.9 - uy * mk * 0.4); c.stroke();
      });
      c.setLineDash([]); c.lineWidth = 2.5; c.strokeStyle = col;
      c.beginPath(); c.arc(tx, ty, mk, 0, TAU); c.stroke();
      c.restore();
    });
  };
  /* ═══════════ 立體：斜視投影＋可旋轉長方體（brick 建立） ═══════════ */
  M4.rot3 = function (beta, gamma) {
    const cb = Math.cos(beta), sb = Math.sin(beta), cg = Math.cos(gamma), sg = Math.sin(gamma);
    /* Rz(gamma)·Rx(beta) */
    return [[cg, -sg * cb, sg * sb], [sg, cg * cb, -cg * sb], [0, sb, cb]];
  };
  const mulR = (R, v) => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]];
  M4.obl = function (ox, oy, k, kx, ky) {
    kx = kx == null ? 0.5 : kx; ky = ky == null ? 0.34 : ky; k = k == null ? 1 : k;
    const f = (x, y, z) => [ox + k * (x + z * kx), oy - k * (y + z * ky)];
    f.kx = kx; f.ky = ky; f.k = k; f.ox = ox; f.oy = oy;
    return f;
  };
  /* 六個面：body 法向量軸 ax、正負 sg；頂點索引（頂點 i 的 bit0→x、bit1→y、bit2→z 取正） */
  const BOX_F = [
    { ax: 0, sg: 1, v: [1, 3, 7, 5] }, { ax: 0, sg: -1, v: [0, 4, 6, 2] },
    { ax: 1, sg: 1, v: [2, 6, 7, 3] }, { ax: 1, sg: -1, v: [0, 1, 5, 4] },
    { ax: 2, sg: 1, v: [4, 5, 7, 6] }, { ax: 2, sg: -1, v: [0, 2, 3, 1] }
  ];
  M4.box3 = function (c, o) {
    const pj = o.pj, R = o.R || M4.rot3(0, 0), h = o.half, ctr = o.ctr, a = o.a == null ? 1 : o.a;
    const V = [], S = [];
    for (let i = 0; i < 8; i++) {
      const b = [(i & 1 ? 1 : -1) * h[0], (i & 2 ? 1 : -1) * h[1], (i & 4 ? 1 : -1) * h[2]];
      const w = mulR(R, b); V.push([ctr[0] + w[0], ctr[1] + w[1], ctr[2] + w[2]]); S.push(pj(V[i][0], V[i][1], V[i][2]));
    }
    /* 投影方向 d＝(-kx,-ky,1)；n·d＜0 → 看得到 */
    const d = [-pj.kx, -pj.ky, 1], Lt = [-0.28, 0.84, -0.47];
    const vis = BOX_F.map(F => { const n = [R[0][F.ax] * F.sg, R[1][F.ax] * F.sg, R[2][F.ax] * F.sg]; F._n = n; return n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < -1e-4; });
    const hx = hs => [1, 3, 5].map(i => parseInt(hs.slice(i, i + 2), 16));
    const base = hx(o.col || '#c4624a'), dk = base.map((v, i) => lerp(v, [28, 12, 8][i], 0.62)), lt = base.map((v, i) => lerp(v, [255, 226, 207][i], 0.42));
    const res = { V, S, vis, R };
    res.edges = ax => { /* 平行於 body 軸 ax 的四條邊：{ i, j, faces:[f1,f2] 相鄰兩面索引, sil 是否為輪廓邊 } */
      const out = [], bit = 1 << ax;
      for (let i = 0; i < 8; i++) if (!(i & bit)) {
        const j = i | bit, fs = BOX_F.map((F, fi) => (F.v.includes(i) && F.v.includes(j) ? fi : -1)).filter(x => x >= 0);
        out.push({ i, j, faces: fs, sil: vis[fs[0]] !== vis[fs[1]], any: vis[fs[0]] || vis[fs[1]] });
      }
      return out;
    };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      BOX_F.forEach((F, fi) => {
        if (!vis[fi]) return;
        const n = F._n, lam = Math.max(0, n[0] * Lt[0] + n[1] * Lt[1] + n[2] * Lt[2]);
        const q = 0.3 + 0.7 * lam, col = 'rgb(' + dk.map((v, i) => Math.round(lerp(v, lt[i], q))).join(',') + ')';
        c.beginPath(); F.v.forEach((vi, q) => (q ? c.lineTo(S[vi][0], S[vi][1]) : c.moveTo(S[vi][0], S[vi][1]))); c.closePath();
        c.fillStyle = col; c.fill();
        /* 面上的小氣孔（body 座標固定 → 跟著磚塊轉） */
        const np = o.pits == null ? 9 : o.pits;
        if (np > 0) {
          c.save(); c.clip(); c.fillStyle = 'rgba(40,14,8,0.32)';
          const u = (F.ax + 1) % 3, v = (F.ax + 2) % 3, seed = (o.seed || 3) * 17 + fi * 31;
          for (let q = 0; q < np; q++) {
            const b = [0, 0, 0]; b[F.ax] = F.sg * h[F.ax];
            b[u] = (hash(seed + q) * 1.7 - 0.85) * h[u]; b[v] = (hash(seed + q + 50) * 1.7 - 0.85) * h[v];
            const w = mulR(R, b), p = pj(ctr[0] + w[0], ctr[1] + w[1], ctr[2] + w[2]);
            c.beginPath(); c.arc(p[0], p[1], (1.2 + 1.6 * hash(seed + q + 90)) * pj.k, 0, TAU); c.fill();
          }
          c.restore();
        }
      });
      /* 邊線 */
      c.strokeStyle = 'rgba(52,20,12,0.9)'; c.lineWidth = 2.2;
      BOX_F.forEach((F, fi) => {
        if (!vis[fi]) return;
        c.beginPath(); F.v.forEach((vi, q) => (q ? c.lineTo(S[vi][0], S[vi][1]) : c.moveTo(S[vi][0], S[vi][1]))); c.closePath(); c.stroke();
      });
      c.restore();
    });
    return res;
  };
  M4.box3.extent = function (R, h) {
    const e = { x: [1e9, -1e9], y: [1e9, -1e9], z: [1e9, -1e9] };
    for (let i = 0; i < 8; i++) {
      const w = mulR(R, [(i & 1 ? 1 : -1) * h[0], (i & 2 ? 1 : -1) * h[1], (i & 4 ? 1 : -1) * h[2]]);
      ['x', 'y', 'z'].forEach((k, q) => { e[k][0] = Math.min(e[k][0], w[q]); e[k][1] = Math.max(e[k][1], w[q]); });
    }
    return e;
  };
  /* ═══════════ 液體：水桶、噴流、軟木塞、接水槽、深度量尺（depth 建立） ═══════════ */
  M4.tank = function (c, o) {
    const x0 = o.x0, x1 = o.x1, bot = o.bot, top = o.top, lv = o.level, wl = o.wall || 6, a = o.a == null ? 1 : o.a;
    const wob = o.wob == null ? 1.6 : o.wob, t = o.t || 0, holes = o.holes || [];
    const surf = x => lv + wob * Math.sin((x - x0) * 0.075 + t * 3.1) * 0.6 + wob * Math.sin((x - x0) * 0.031 - t * 1.7) * 0.4;
    const res = { x0, x1, bot, top, level: lv, outL: x0 - wl, outR: x1 + wl, surf };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 水 */
      if (lv < bot - 0.5) {
        c.beginPath(); c.moveTo(x0, bot);
        for (let x = x0; x <= x1; x += 4) c.lineTo(x, surf(x));
        c.lineTo(x1, surf(x1)); c.lineTo(x1, bot); c.closePath();
        const g = c.createLinearGradient(0, lv, 0, bot);
        g.addColorStop(0, W5.rgba(M4.PC.water, 0.42)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
        c.fillStyle = g; c.fill();
        /* 自由液面亮線 */
        if (o.glow) { c.save(); c.shadowColor = W5.rgba(M4.PC.waterEdge, 0.9 * o.glow); c.shadowBlur = 14 * o.glow; }
        c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3 + 1.5 * (o.glow || 0); c.lineCap = 'round';
        c.beginPath(); for (let x = x0; x <= x1; x += 4) (x === x0 ? c.moveTo(x, surf(x)) : c.lineTo(x, surf(x))); c.lineTo(x1, surf(x1)); c.stroke();
        if (o.glow) c.restore();
      }
      /* 桶壁（剖面）：洞的地方留缺口 */
      const wallCol = c.createLinearGradient(0, top, 0, bot);
      wallCol.addColorStop(0, '#cfd8de'); wallCol.addColorStop(1, '#8b99a3');
      c.fillStyle = wallCol;
      const side = (xa, sd) => {
        const hs = holes.filter(h => (h.side || 'right') === sd).map(h => [h.y - (h.r || 5), h.y + (h.r || 5)]).sort((p, q) => p[0] - q[0]);
        let y = top;
        hs.forEach(([ya, yb]) => { if (ya > y) c.fillRect(xa, y, wl, ya - y); y = Math.max(y, yb); });
        if (bot + wl > y) c.fillRect(xa, y, wl, bot + wl - y);
        hs.forEach(([ya, yb]) => { if (yb > lv) { c.fillStyle = W5.rgba(M4.PC.water, 0.5); c.fillRect(xa, Math.max(ya, lv), wl, yb - Math.max(ya, lv)); c.fillStyle = wallCol; } });
      };
      side(x0 - wl, 'left'); side(x1, 'right');
      c.fillRect(x0 - wl, bot, x1 - x0 + 2 * wl, wl);
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0 - wl + 1, top); c.lineTo(x0 - wl + 1, bot + wl); c.moveTo(x1 + 1, top); c.lineTo(x1 + 1, bot); c.stroke();
      /* 桶口 */
      c.fillStyle = '#e4ebef'; W5.rr(c, x0 - wl - 3, top - 4, wl + 6, 7, 3); c.fill(); W5.rr(c, x1 - 3, top - 4, wl + 6, 7, 3); c.fill();
      c.restore();
    });
    return res;
  };
  M4.jetRange = (h, drop) => (h > 0 && drop > 0 ? 2 * Math.sqrt(h * drop) : 0);
  /* 噴流：g＝1 的無因次拋體：v＝√(2h)，x＝vτ，y＝τ²/2 → 落點 x＝2√(h·drop)（與 M4.jetRange 一致） */
  M4.jet = function (c, o) {
    const h = o.h, x = o.x, y = o.y, dir = o.dir || 1, drop = o.landY - y, a = o.a == null ? 1 : o.a;
    const res = { xl: x + dir * M4.jetRange(h, drop), pts: [], front: [x, y] };
    if (h <= 0.05 || drop <= 0) return res;
    const v = Math.sqrt(2 * h), tauL = Math.sqrt(2 * drop), f = o.f == null ? 1 : clamp01(o.f), N = 40;
    for (let i = 0; i <= N; i++) { const tau = tauL * f * i / N; res.pts.push([x + dir * v * tau, y + tau * tau / 2]); }
    res.front = res.pts[N];
    if (a <= 0.02 || f <= 0.002) return res;
    const lw = o.lw || Math.max(1.6, Math.min(6, 6 * Math.sqrt(h / 30)));
    const path = () => { c.beginPath(); res.pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = W5.rgba(M4.PC.water, 0.9); c.lineWidth = lw + 1.5; path(); c.stroke();
      /* 流動的水滴：亮色虛實相間，速度 ∝ √h */
      c.strokeStyle = 'rgba(205,236,255,0.95)'; c.lineWidth = Math.max(1.2, lw * 0.45);
      c.setLineDash([9, 11]); c.lineDashOffset = -((o.t || 0) * 12 * v) % 20; path(); c.stroke(); c.setLineDash([]);
      /* 前緣水珠 */
      if (f < 1) { c.fillStyle = M4.PC.waterEdge; c.beginPath(); c.arc(res.front[0], res.front[1], lw * 0.7 + 1, 0, TAU); c.fill(); }
      else if (o.splash !== false) {
        const t = o.t || 0;
        for (let k = 0; k < 2; k++) {
          const q = ((t * 1.6 + k * 0.5 + (o.seed || 0) * 0.37) % 1);
          c.strokeStyle = W5.rgba(M4.PC.waterEdge, 0.7 * (1 - q)); c.lineWidth = 2;
          c.beginPath(); c.ellipse(res.xl, o.landY, 5 + 16 * q * Math.min(1, lw / 4), 2 + 3 * q, 0, 0, TAU); c.stroke();
        }
      }
      c.restore();
    });
    return res;
  };
  M4.plug = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, dir = o.dir || 1; if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(dir, 1);
      const g = c.createLinearGradient(0, -7, 0, 7); g.addColorStop(0, '#d9a56e'); g.addColorStop(1, '#94603a');
      c.fillStyle = g; c.strokeStyle = 'rgba(70,38,18,0.8)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(-8, -5); c.lineTo(4, -7); c.lineTo(15, -7); c.quadraticCurveTo(18, 0, 15, 7); c.lineTo(4, 7); c.lineTo(-8, 5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(70,38,18,0.45)'; [[7, -3], [11, 2], [5, 3]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.1, 0, TAU); c.fill(); });
      c.restore();
    });
  };
  M4.trough = function (c, x0, x1, gy, o) {
    o = o || {}; const h = o.h || 24, a = o.a == null ? 1 : o.a, wy = gy - 8;
    M3.withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, wy, 0, gy); g.addColorStop(0, W5.rgba(M4.PC.water, 0.5)); g.addColorStop(1, W5.rgba('#1a60a8', 0.7));
      c.fillStyle = g; c.fillRect(x0 + 4, wy, x1 - x0 - 8, gy - wy - 3);
      c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 5, wy); c.lineTo(x1 - 5, wy); c.stroke();
      c.strokeStyle = '#aebbc4'; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x0 - 4, gy - h); c.lineTo(x0 + 2, gy - 2); c.lineTo(x1 - 2, gy - 2); c.lineTo(x1 + 4, gy - h); c.stroke();
      c.restore();
    });
    return wy;
  };
  M4.depthRuler = function (c, x, y0, y1, k, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 14; if (a <= 0.02 || y1 <= y0) return;
    M3.withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(246,243,234,0.16)'; c.fillRect(x - w / 2, y0, w, y1 - y0);
      c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 1.5; c.strokeRect(x - w / 2, y0, w, y1 - y0);
      for (let d = 0; y0 + d * k <= y1 + 0.5; d += 5) {
        const y = y0 + d * k, big = d % 10 === 0;
        c.lineWidth = big ? 2.2 : 1.4; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2 + (big ? w : w * 0.55), y); c.stroke();
      }
      c.restore();
    });
  };
  /* ═══════════ 杯子（shape 建立） ═══════════ */
  M4.cup = function (c, o) {
    const cx = o.cx, bot = o.bot, rim = o.rim, rb = o.rb, rt = o.rt, wl = o.wall || 6, bs = o.base || 10;
    const a = o.a == null ? 1 : o.a, t = o.t || 0, wob = o.wob == null ? 1.6 : o.wob;
    const H = bot - rim, half = y => rb + (rt - rb) * (bot - y) / H;
    const lv = o.level == null ? bot : o.level;
    const surf = x => lv + wob * Math.sin((x - cx) * 0.075 + t * 3.1) * 0.6 + wob * Math.sin((x - cx) * 0.031 - t * 1.7) * 0.4;
    const res = { cx, bot, rim, rb, rt, level: lv, half, surf, outBot: bot + bs };
    if (a <= 0.02) return res;
    /* 斜壁的水平壁厚：wall ÷ cosθ，看起來每面一樣厚 */
    const dx = wl * Math.hypot(H, rt - rb) / H;
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      /* 地上的影子 */
      c.fillStyle = 'rgba(11,26,21,0.35)'; c.beginPath(); c.ellipse(cx, bot + bs + 2, rb + dx + 14, 5, 0, 0, TAU); c.fill();
      /* 杯內淡淡的玻璃色 */
      c.fillStyle = 'rgba(200,230,245,0.05)';
      c.beginPath(); c.moveTo(cx - rt, rim); c.lineTo(cx + rt, rim); c.lineTo(cx + rb, bot); c.lineTo(cx - rb, bot); c.closePath(); c.fill();
      /* 水 */
      if (lv < bot - 0.5) {
        const hl = half(lv), xa = cx - hl, xb = cx + hl;
        c.beginPath(); c.moveTo(cx - rb, bot); c.lineTo(xa, surf(xa));
        for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, surf(x));
        c.lineTo(xb, surf(xb)); c.lineTo(cx + rb, bot); c.closePath();
        const g = c.createLinearGradient(0, lv, 0, bot);
        g.addColorStop(0, W5.rgba(M4.PC.water, 0.42)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
        c.fillStyle = g; c.fill();
        if (o.glow) { c.save(); c.shadowColor = W5.rgba(M4.PC.waterEdge, 0.9 * o.glow); c.shadowBlur = 14 * o.glow; }
        c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3 + 1.5 * (o.glow || 0); c.lineCap = 'round';
        c.beginPath(); c.moveTo(xa + 1.5, surf(xa)); for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, surf(x)); c.lineTo(xb - 1.5, surf(xb)); c.stroke();
        if (o.glow) c.restore();
      }
      /* 玻璃：左右壁＋厚杯底（一個外輪廓減掉內輪廓） */
      const oxT = rt + dx, oxB = rb + dx;
      c.beginPath();
      c.moveTo(cx - oxT, rim); c.lineTo(cx - oxB, bot + bs - 3); c.quadraticCurveTo(cx - oxB, bot + bs, cx - oxB + 3, bot + bs);
      c.lineTo(cx + oxB - 3, bot + bs); c.quadraticCurveTo(cx + oxB, bot + bs, cx + oxB, bot + bs - 3); c.lineTo(cx + oxT, rim);
      c.lineTo(cx + rt, rim); c.lineTo(cx + rb, bot); c.lineTo(cx - rb, bot); c.lineTo(cx - rt, rim); c.closePath();
      const gg = c.createLinearGradient(cx - oxB, 0, cx + oxB, 0);
      gg.addColorStop(0, 'rgba(225,244,252,0.55)'); gg.addColorStop(0.5, 'rgba(200,228,242,0.30)'); gg.addColorStop(1, 'rgba(170,205,222,0.45)');
      c.fillStyle = gg; c.fill();
      c.strokeStyle = 'rgba(232,246,255,0.85)'; c.lineWidth = 1.6; c.stroke();
      /* 內壁亮線 */
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(cx - rt, rim); c.lineTo(cx - rb, bot); c.lineTo(cx + rb, bot); c.lineTo(cx + rt, rim); c.stroke();
      /* 反光：左壁一道細白光、右壁一道淡光 */
      const sx = (f, y) => cx + f * (half(y) + dx * 0.5);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(sx(-1, rim + 12), rim + 12); c.lineTo(sx(-1, rim + H * 0.55), rim + H * 0.55); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(sx(1, rim + H * 0.3), rim + H * 0.3); c.lineTo(sx(1, rim + H * 0.8), rim + H * 0.8); c.stroke();
      /* 杯口圓邊 */
      c.fillStyle = 'rgba(240,250,255,0.9)';
      W5.rr(c, cx - oxT - 1, rim - 3, dx + 2, 6, 3); c.fill(); W5.rr(c, cx + rt - 1, rim - 3, dx + 2, 6, 3); c.fill();
      c.restore();
    });
    return res;
  };
  M4.pour = function (c, x, y0, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 7, t = o.t || 0;
    if (a <= 0.02 || y1 - y0 < 2) return;
    M3.withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, y0, 0, Math.min(y1, y0 + 40));
      g.addColorStop(0, W5.rgba(M4.PC.water, 0)); g.addColorStop(1, W5.rgba(M4.PC.water, 0.85));
      c.fillStyle = g; c.fillRect(x - w / 2, y0, w, y1 - y0);
      /* 流動的亮水滴 */
      c.strokeStyle = 'rgba(205,236,255,0.9)'; c.lineWidth = Math.max(1.2, w * 0.35); c.lineCap = 'round';
      c.setLineDash([10, 12]); c.lineDashOffset = -(t * 260) % 22;
      c.beginPath(); c.moveTo(x, Math.max(y0 + 14, y0)); c.lineTo(x, y1 - 2); c.stroke(); c.setLineDash([]);
      if (o.splash !== false) {
        const rw = o.rw || 22;
        for (let k = 0; k < 2; k++) {
          const q = (t * 1.8 + k * 0.5) % 1;
          c.strokeStyle = W5.rgba(M4.PC.waterEdge, 0.75 * (1 - q)); c.lineWidth = 2;
          c.beginPath(); c.ellipse(x, y1, 4 + rw * q, 1.5 + 3 * q, 0, 0, TAU); c.stroke();
        }
      }
      c.restore();
    });
  };
  /* ═══════════ 氣體：大氣壓箭頭、空氣分子點、密閉蓋、壓力計（seal 建立） ═══════════ */
  M4.atmArrow = function (c, x, tipY, len, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || len < 4) return;
    const D = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[o.dir || 'down'];
    const col = o.col || M4.PC.atm, lw = o.lw || 6, x0 = x - D[0] * len, y0 = tipY - D[1] * len;
    const head = Math.min(18, Math.max(10, len * 0.4));
    const brk = o.brk != null && o.brk < len - head - 6 ? o.brk : null, gap = 5;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'butt';
      /* 斷軸時：箭尾一小段＋缺口＋箭身（缺口兩邊各一道斜線，像「≈」） */
      const sx = brk == null ? x0 : x0 + D[0] * (brk + gap), sy = brk == null ? y0 : y0 + D[1] * (brk + gap);
      const tail = (cl, w) => { if (brk == null) return; c.strokeStyle = cl; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + D[0] * (brk - gap), y0 + D[1] * (brk - gap)); c.stroke(); };
      tail('rgba(11,26,21,0.85)', lw + 4);
      W5.arrow(c, sx, sy, x, tipY, 'rgba(11,26,21,0.85)', lw + 4, head + 4);
      c.shadowColor = W5.rgba(col, 0.6); c.shadowBlur = 8;
      tail(col, lw);
      W5.arrow(c, sx, sy, x, tipY, col, lw, head);
      c.shadowColor = 'transparent';
      if (brk != null) {
        const bx = x0 + D[0] * brk, by = y0 + D[1] * brk, px = -D[1], py = D[0], hw = lw / 2 + 5, sk = 3;
        c.lineCap = 'round';
        [-gap, gap].forEach(dd => {
          const cx = bx + D[0] * dd, cy = by + D[1] * dd;
          const seg = () => { c.beginPath(); c.moveTo(cx + px * hw - D[0] * sk, cy + py * hw - D[1] * sk); c.lineTo(cx - px * hw + D[0] * sk, cy - py * hw + D[1] * sk); c.stroke(); };
          c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 4; seg();
          c.strokeStyle = col; c.lineWidth = 2; seg();
        });
      }
      c.restore();
    });
  };
  M4.airDots = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || y1 - y0 < 4) return;
    const n = o.n || 28, seed = o.seed || 13, t = o.t || 0, r = o.r || 3.2;
    M3.withA(c, a, () => {
      c.save(); c.fillStyle = W5.rgba(M4.PC.air, 0.75);
      /* 分層抖動：先把框切成 cols × rows 格，每格一點、格內隨機偏移 → 分布均勻、不結塊 */
      const cols = o.cols || 8, rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const ci = i % cols, ri = Math.floor(i / cols);
        const fx = (ci + 0.5 + 0.7 * (hash(seed + i * 3) - 0.5)) / cols, fy = (ri + 0.5 + 0.7 * (hash(seed + i * 3 + 1) - 0.5)) / rows, ph = TAU * hash(seed + i * 3 + 2);
        const x = x0 + (x1 - x0) * fx + 2.2 * Math.sin(t * 2.3 + ph), y = y0 + (y1 - y0) * fy + 2.2 * Math.cos(t * 1.9 + ph * 1.3);
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.restore();
    });
  };
  M4.lid = function (c, x0, x1, rimY, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, ov = o.over == null ? 10 : o.over, th = o.thick || 12;
    const gk = (o.gasket || 6) * (1 - 0.4 * clamp01(o.squash || 0)), bot = rimY - gk, top = bot - th;
    const res = { top, bot, ventX: o.vent, ventTop: top - 9 };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 橡皮墊（深灰，只在桶口兩邊壁上看得到剖面） */
      c.fillStyle = '#3d4350'; c.strokeStyle = 'rgba(163,172,190,0.7)'; c.lineWidth = 1.2;
      W5.rr(c, x0 - ov, bot, x1 - x0 + 2 * ov, gk, 2); c.fill(); c.stroke();
      /* 蓋板 */
      const g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, '#e6edf1'); g.addColorStop(1, '#93a2ac');
      c.fillStyle = g; W5.rr(c, x0 - ov, top, x1 - x0 + 2 * ov, th, 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 - ov + 4, top + 1.5); c.lineTo(x1 + ov - 4, top + 1.5); c.stroke();
      /* 通氣孔：短管＋小蓋（open 時掀開、管口看得到洞） */
      if (o.vent != null) {
        const vx = o.vent, op = clamp01(o.open || 0);
        c.fillStyle = '#b9c5cc'; c.fillRect(vx - 7, top - 8, 14, 9);
        if (op > 0.05) { c.fillStyle = 'rgba(11,26,21,0.9)'; c.fillRect(vx - 3, top - 8, 6, th + 8); }
        c.save(); c.translate(vx + 9, top - 8); c.rotate(-1.9 * ease(op)); c.translate(-(vx + 9), -(top - 8));
        c.fillStyle = '#4dd2ff'; W5.rr(c, vx - 10, top - 14, 20, 7, 3); c.fill();
        c.strokeStyle = 'rgba(11,26,21,0.6)'; c.lineWidth = 1.2; c.stroke();
        c.restore();
      }
      c.restore();
    });
    return res;
  };
  M4.gauge = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, mn = o.min, mx = o.max, sw = (o.sweep || 270) * Math.PI / 180, a0 = Math.PI / 2 + (TAU - sw) / 2;
    const ang = v => a0 + sw * clamp01((v - mn) / (mx - mn));
    const res = { ang };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 外殼＋錶面 */
      const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 4, cx, cy, r * 1.1);
      g.addColorStop(0, '#f6f3ea'); g.addColorStop(1, '#c9d3d9');
      c.fillStyle = '#6f7d86'; c.beginPath(); c.arc(cx, cy, r + 6, 0, TAU); c.fill();
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      /* 刻度 */
      const tk = o.ticks || 10;
      c.strokeStyle = '#3a4a52'; c.lineCap = 'round';
      for (let v = Math.ceil(mn / tk) * tk; v <= mx + 1e-6; v += tk) {
        const q = ang(v), big = (v / tk) % 2 === 0;
        c.lineWidth = big ? 3 : 2; c.beginPath();
        c.moveTo(cx + Math.cos(q) * r * (big ? 0.74 : 0.8), cy + Math.sin(q) * r * (big ? 0.74 : 0.8));
        c.lineTo(cx + Math.cos(q) * r * 0.92, cy + Math.sin(q) * r * 0.92); c.stroke();
      }
      /* 拖尾：from → val 的弧（已經降了多少） */
      if (o.from != null && Math.abs(o.from - o.val) > 0.3) {
        c.strokeStyle = W5.rgba(COL.coral, 0.55); c.lineWidth = 7; c.lineCap = 'butt';
        const p = ang(o.from), q = ang(o.val);
        c.beginPath(); c.arc(cx, cy, r * 0.62, Math.min(p, q), Math.max(p, q)); c.stroke();
      }
      /* 標記刻度（例：大氣壓 1033） */
      if (o.mark != null) {
        const q = ang(o.mark);
        c.strokeStyle = '#1f6f8b'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx + Math.cos(q) * r * 0.66, cy + Math.sin(q) * r * 0.66); c.lineTo(cx + Math.cos(q) * r * 0.97, cy + Math.sin(q) * r * 0.97); c.stroke();
      }
      /* 指針 */
      const q = ang(o.val);
      c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - Math.cos(q) * r * 0.14, cy - Math.sin(q) * r * 0.14); c.lineTo(cx + Math.cos(q) * r * 0.8, cy + Math.sin(q) * r * 0.8); c.stroke();
      c.strokeStyle = COL.coral; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cx - Math.cos(q) * r * 0.14, cy - Math.sin(q) * r * 0.14); c.lineTo(cx + Math.cos(q) * r * 0.8, cy + Math.sin(q) * r * 0.8); c.stroke();
      c.fillStyle = '#3a4a52'; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
      c.restore();
      if (o.markLabel && o.mark != null) {
        /* 標記文字放在錶外、標記刻度的方向 */
        const q = ang(o.mark), cs = Math.cos(q), sn = Math.sin(q), rr = r + 14;
        const al = cs > 0.3 ? 'left' : cs < -0.3 ? 'right' : 'center';
        M3.T(c, 1, o.markLabel, cx + cs * rr, cy + sn * rr + (al === 'center' ? sn * 12 : 0), o.markCol || M4.PC.atm, 22, al, true);
      }
    });
    return res;
  };
  /* ═══════════ 連通管、量尺、水龍頭（level 建立） ═══════════ */
  /* 底部一條水平管連通的一排容器（側視剖面）。每個容器的內壁用 pts＝[[y,xl,xr],…]（由下＝pipeTop 往上到口）描述，
     中間線性內插；水是「一整塊」多邊形（管內＋各容器到各自水面），不會有半透明重疊的接縫。 */
  M4.connected = function (c, o) {
    const fl = o.floor, pt = o.pipeTop, px0 = o.px0, px1 = o.px1, wl = o.wall || 6, a = o.a == null ? 1 : o.a;
    const t = o.t || 0, wob = o.wob == null ? 1.4 : o.wob, vs = o.vessels || [];
    const edge = pts => y => {
      if (y >= pts[0][0]) return [pts[0][1], pts[0][2]];
      for (let i = 1; i < pts.length; i++) {
        if (y >= pts[i][0]) { const p = pts[i - 1], q = pts[i], f = (p[0] - y) / (p[0] - q[0]); return [lerp(p[1], q[1], f), lerp(p[2], q[2], f)]; }
      }
      const z = pts[pts.length - 1]; return [z[1], z[2]];
    };
    const info = vs.map((v, i) => {
      const e = edge(v.pts), lv = v.level == null ? pt : Math.max(v.pts[v.pts.length - 1][0], Math.min(pt, v.level));
      const surf = x => lv + wob * Math.sin(x * 0.075 + t * 3.1 + i * 1.3) * 0.6 + wob * Math.sin(x * 0.031 - t * 1.7 + i) * 0.4;
      return { edge: e, level: lv, surf };
    });
    const res = { vessels: info };
    if (a <= 0.02) return res;
    const wet = o.water !== false;
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      /* 容器內淡淡的玻璃色 */
      c.fillStyle = 'rgba(200,230,245,0.05)';
      vs.forEach(v => { c.beginPath(); v.pts.forEach((p, k) => (k ? c.lineTo(p[1], p[0]) : c.moveTo(p[1], p[0]))); for (let k = v.pts.length - 1; k >= 0; k--) c.lineTo(v.pts[k][2], v.pts[k][0]); c.closePath(); c.fill(); });
      c.fillRect(px0, pt, px1 - px0, fl - pt);
      /* 水：管內＋各容器到水面（一個多邊形） */
      if (wet) {
        c.beginPath(); c.moveTo(px0, fl); c.lineTo(px0, pt);
        vs.forEach((v, i) => {
          const I = info[i], lv = I.level;
          c.lineTo(v.pts[0][1], pt);
          v.pts.forEach(p => { if (p[0] > lv) c.lineTo(p[1], p[0]); });
          const [xa, xb] = I.edge(lv);
          c.lineTo(xa, I.surf(xa));
          for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, I.surf(x));
          c.lineTo(xb, I.surf(xb));
          for (let k = v.pts.length - 1; k >= 0; k--) if (v.pts[k][0] > lv) c.lineTo(v.pts[k][2], v.pts[k][0]);
          c.lineTo(v.pts[0][2], pt);
        });
        c.lineTo(px1, pt); c.lineTo(px1, fl); c.closePath();
        const top = Math.min.apply(null, info.map(I => I.level));
        const g = c.createLinearGradient(0, top, 0, fl);
        g.addColorStop(0, W5.rgba(M4.PC.water, 0.42)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
        c.fillStyle = g; c.fill();
        /* 水面亮線 */
        info.forEach(I => {
          if (I.level >= pt - 0.5) return;
          const [xa, xb] = I.edge(I.level);
          if (o.glow) { c.save(); c.shadowColor = W5.rgba(M4.PC.waterEdge, 0.9 * o.glow); c.shadowBlur = 14 * o.glow; }
          c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3 + 1.5 * (o.glow || 0); c.lineCap = 'round';
          c.beginPath(); c.moveTo(xa + 1.5, I.surf(xa)); for (let x = xa + 4; x < xb; x += 4) c.lineTo(x, I.surf(x)); c.lineTo(xb - 1.5, I.surf(xb)); c.stroke();
          if (o.glow) c.restore();
        });
      }
      /* 連通管強調：外緣亮光 */
      if (o.pipeGlow > 0.01) {
        c.save(); c.shadowColor = W5.rgba(M4.PC.waterEdge, 0.95 * o.pipeGlow); c.shadowBlur = 18 * o.pipeGlow;
        c.strokeStyle = W5.rgba(M4.PC.waterEdge, 0.9 * o.pipeGlow); c.lineWidth = 3;
        W5.rr(c, px0 - wl - 2, pt - wl - 2, px1 - px0 + 2 * wl + 4, fl - pt + 2 * wl + 4, 6); c.stroke(); c.restore();
      }
      /* 玻璃壁（實色，不會疊出深淺） */
      const GL = '#a9c6d3', HI = 'rgba(240,250,255,0.85)';
      c.fillStyle = GL;
      c.fillRect(px0 - wl, fl, px1 - px0 + 2 * wl, wl);               /* 管底 */
      c.fillRect(px0 - wl, pt - wl, wl, fl - pt + wl);                  /* 左端 */
      c.fillRect(px1, pt - wl, wl, fl - pt + wl);                       /* 右端 */
      let xs = px0 - wl;
      vs.forEach(v => { const xa = v.pts[0][1] - wl; if (xa > xs) c.fillRect(xs, pt - wl, xa - xs, wl); xs = v.pts[0][2] + wl; });
      if (px1 + wl > xs) c.fillRect(xs, pt - wl, px1 + wl - xs, wl);   /* 管頂（開口處留空） */
      c.strokeStyle = GL; c.lineWidth = wl; c.lineCap = 'butt';
      vs.forEach(v => {
        [1, 2].forEach(k => { const sg = k === 1 ? -1 : 1; c.beginPath(); v.pts.forEach((p, j) => (j ? c.lineTo(p[k] + sg * wl / 2, p[0]) : c.moveTo(p[k] + sg * wl / 2, p[0] + 0.5))); c.stroke(); });
      });
      /* 內壁亮線＋管的亮線 */
      c.strokeStyle = HI; c.lineWidth = 1.4;
      vs.forEach(v => { [1, 2].forEach(k => { c.beginPath(); v.pts.forEach((p, j) => (j ? c.lineTo(p[k], p[0]) : c.moveTo(p[k], p[0]))); c.stroke(); }); });
      c.beginPath(); c.moveTo(px0, fl); c.lineTo(px1, fl); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(px0 - wl, fl + wl - 0.5); c.lineTo(px1 + wl, fl + wl - 0.5); c.stroke();
      /* 管口圓邊 */
      c.fillStyle = 'rgba(240,250,255,0.9)';
      vs.forEach(v => { const z = v.pts[v.pts.length - 1]; W5.rr(c, z[1] - wl - 1, z[0] - 3, wl + 2, 6, 3); c.fill(); W5.rr(c, z[2] - 1, z[0] - 3, wl + 2, 6, 3); c.fill(); });
      c.restore();
    });
    return res;
  };
  /* 直立高度尺：0 在 y0（底），往上每 5 cm 一格、每 10 cm 長刻度＋數字（22px）；o：{ a, w(14), every 數字間隔(10), unit 頂端單位字('cm') } */
  M4.heightRuler = function (c, x, y0, k, hMax, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 14, ev = o.every || 10; if (a <= 0.02) return;
    const y1 = y0 - hMax * k;
    M3.withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(246,243,234,0.14)'; c.fillRect(x - w / 2, y1, w, y0 - y1);
      c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 1.5; c.strokeRect(x - w / 2, y1, w, y0 - y1);
      for (let d = 0; d <= hMax + 1e-6; d += 5) {
        const y = y0 - d * k, big = d % 10 === 0;
        c.lineWidth = big ? 2.2 : 1.4; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2 + (big ? w : w * 0.55), y); c.stroke();
      }
      c.restore();
    });
    for (let d = 0; d <= hMax + 1e-6; d += ev) M3.T(c, a, String(d), x + w / 2 + 8, y0 - d * k, COL.dim, 22, 'left', true);
    if (o.unit !== null) M3.T(c, a, o.unit || 'cm', x, y1 - 20, COL.dim, 22, 'center', true);
  };
  /* 水龍頭（側視）：出水口尖端在 (x,y) 朝下；本體水平管往 dir（-1 左(預設)｜1 右）延伸 len；
     o：{ len(80), open 0..1 把手轉開（0 平躺、1 立起）, a, drop 出水口直管長(26) } → { x, y, bodyY } */
  M4.faucet = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, dir = o.dir || -1, len = o.len || 80, drop = o.drop || 26;
    const by = y - drop, res = { x, y, bodyY: by };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      const g = c.createLinearGradient(0, by - 9, 0, by + 9); g.addColorStop(0, '#eef3f6'); g.addColorStop(1, '#8b99a3');
      const xe = x + dir * len, xa = Math.min(x, xe), xb = Math.max(x, xe);
      c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.55)'; c.lineWidth = 1.4;
      /* 水平本體＋轉角＋出水口 */
      c.beginPath();
      if (dir < 0) { c.moveTo(xa, by - 8); c.lineTo(x - 2, by - 8); c.quadraticCurveTo(x + 8, by - 8, x + 8, by + 2); c.lineTo(x + 8, y); c.lineTo(x - 8, y); c.lineTo(x - 8, by + 8); c.lineTo(xa, by + 8); }
      else { c.moveTo(xb, by - 8); c.lineTo(x + 2, by - 8); c.quadraticCurveTo(x - 8, by - 8, x - 8, by + 2); c.lineTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x + 8, by + 8); c.lineTo(xb, by + 8); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#6f7d86'; c.fillRect(x - 9, y - 4, 18, 4);
      /* 把手：短柱＋一根把柄（open 時從平躺轉到立起） */
      const hx = x + dir * Math.min(30, len * 0.55), op = clamp01(o.open || 0);
      c.fillStyle = '#8b99a3'; c.fillRect(hx - 4, by - 16, 8, 9);
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 8; c.lineCap = 'round';
      const lx = hx + dir * 24 * Math.cos(op * Math.PI / 2), ly = by - 16 - 24 * Math.sin(op * Math.PI / 2);
      c.beginPath(); c.moveTo(hx, by - 16); c.lineTo(lx, ly); c.stroke();
      c.strokeStyle = '#ff8a8a'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx, by - 16); c.lineTo(lx, ly); c.stroke();
      c.fillStyle = '#d64545'; c.beginPath(); c.arc(hx, by - 16, 5, 0, TAU); c.fill();
      c.restore();
    });
    return res;
  };
  /* ═══════════ 水管網、等高虛線、打勾（app 建立） ═══════════ */
  /* 剖面水管：管壁金屬灰、管內有水＝藍、沒水＝深色（空氣）；wetTop 以上是空氣，交界畫一條水面亮線（垂直段）。 */
  M4.pipe = function (c, lines, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const r = o.r || 5, wl = o.wall || 4, t = o.t || 0;
    const path = pts => { c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = '#8b99a3'; c.lineWidth = 2 * (r + wl);
      lines.forEach(L => { path(L.pts); c.stroke(); });
      c.strokeStyle = '#10231d'; c.lineWidth = 2 * r;
      lines.forEach(L => { path(L.pts); c.stroke(); });
      lines.forEach(L => {
        const wt = L.wetTop == null ? -1e4 : L.wetTop;
        c.save(); c.beginPath(); c.rect(0, wt, 960, 3e4); c.clip();
        c.strokeStyle = W5.rgba(M4.PC.water, 0.85); c.lineWidth = 2 * r; path(L.pts); c.stroke();
        if (L.flow) {
          c.strokeStyle = 'rgba(205,236,255,0.85)'; c.lineWidth = Math.max(1.4, r * 0.6);
          c.setLineDash([8, 10]); c.lineDashOffset = -(t * 60) % 18; path(L.pts); c.stroke(); c.setLineDash([]);
        }
        c.restore();
        if (L.wetTop != null) {
          c.strokeStyle = M4.PC.waterEdge; c.lineWidth = 3; c.lineCap = 'butt';
          for (let k = 1; k < L.pts.length; k++) {
            const p = L.pts[k - 1], q = L.pts[k];
            if (Math.abs(p[0] - q[0]) < 0.5 && wt > Math.min(p[1], q[1]) && wt < Math.max(p[1], q[1])) { c.beginPath(); c.moveTo(p[0] - r, wt); c.lineTo(p[0] + r, wt); c.stroke(); }
          }
          c.lineCap = 'round';
        }
      });
      c.restore();
    });
  };
  M4.levelDash = function (c, x0, x1, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, g = o.g == null ? 1 : o.g; if (a <= 0.02 || g <= 0.01) return;
    M3.withA(c, a, () => {
      c.save(); c.strokeStyle = M4.PC.waterEdge; c.lineWidth = o.lw || 3; c.setLineDash([12, 8]);
      c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, g), y); c.stroke(); c.restore();
    });
  };
  M4.okMark = function (c, x, y, ok, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, r = o.r || 15; if (a <= 0.02) return;
    const col = ok ? COL.green : COL.red;
    M3.withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(11,26,21,0.9)'; c.strokeStyle = col; c.lineWidth = 2.5;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
      c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      if (ok) { c.moveTo(x - r * 0.45, y + r * 0.02); c.lineTo(x - r * 0.1, y + r * 0.38); c.lineTo(x + r * 0.5, y - r * 0.35); }
      else { const q = r * 0.4; c.moveTo(x - q, y - q); c.lineTo(x + q, y + q); c.moveTo(x + q, y - q); c.lineTo(x - q, y + q); }
      c.stroke(); c.restore();
    });
  };
  /* ═══════════ 活塞、壓力計導管、壓力擴散波（transmit 建立） ═══════════ */
  /* 剖面活塞筒：在「筒往外伸 ＝ 局部 −y」的座標裡畫，再依 dir 旋轉 → 上下左右都同一套畫法 */
  M4.piston = function (c, x, y, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a;
    const rot = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[o.dir || 'up'];
    const w = o.w || 28, len = o.len || 50, pos = o.pos || 0, th = o.th || 14, rod = o.rod || 0, hw = o.handle || 0, wl = o.wall || 6;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const W = (u, v) => [x + v * cs + u * sn, y + v * sn - u * cs];        /* 局部 (u 往外, v 橫向) → 畫布 */
    const outU = pos + th + rod + (hw ? 8 : 0);
    const res = { face: W(pos, 0), out: W(outU, 0) };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save(); c.translate(x, y); c.rotate(rot);
      /* 筒內的水（筒口 → 活塞內面） */
      if (o.water !== false && pos > 0) { c.fillStyle = W5.rgba(M4.PC.water, 0.5); c.fillRect(-w / 2, -pos, w, pos + 1); }
      /* 筒壁 */
      const g = c.createLinearGradient(-w / 2 - wl, 0, w / 2 + wl, 0);
      g.addColorStop(0, '#cfd8de'); g.addColorStop(1, '#8b99a3');
      c.fillStyle = g; c.fillRect(-w / 2 - wl, -len, wl, len); c.fillRect(w / 2, -len, wl, len);
      c.fillStyle = '#e4ebef'; W5.rr(c, -w / 2 - wl - 3, -len - 3, wl + 6, 7, 3); c.fill(); W5.rr(c, w / 2 - 3, -len - 3, wl + 6, 7, 3); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-w / 2 - 0.5, -len); c.lineTo(-w / 2 - 0.5, 0); c.moveTo(w / 2 + 0.5, -len); c.lineTo(w / 2 + 0.5, 0); c.stroke();
      /* 活塞（深灰橡膠＋亮邊） */
      const pg = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      pg.addColorStop(0, '#5d6372'); pg.addColorStop(0.45, '#7d8494'); pg.addColorStop(1, '#3a3e4a');
      c.fillStyle = pg; W5.rr(c, -w / 2 + 0.5, -pos - th, w - 1, th, 3); c.fill();
      c.strokeStyle = 'rgba(220,228,236,0.7)'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = 'rgba(11,26,21,0.45)'; c.lineWidth = 1.2;
      [0.33, 0.66].forEach(f => { c.beginPath(); c.moveTo(-w / 2 + 2, -pos - th * f); c.lineTo(w / 2 - 2, -pos - th * f); c.stroke(); });
      /* 活塞桿＋把手 */
      if (rod > 0) {
        const rw = Math.max(6, Math.min(10, w * 0.32));
        const rg = c.createLinearGradient(-rw / 2, 0, rw / 2, 0); rg.addColorStop(0, '#e6edf1'); rg.addColorStop(1, '#93a2ac');
        c.fillStyle = rg; c.fillRect(-rw / 2, -pos - th - rod - 1, rw, rod + 2);
      }
      if (hw > 0) {
        const hg = c.createLinearGradient(0, -outU, 0, -outU + 8); hg.addColorStop(0, '#e6edf1'); hg.addColorStop(1, '#93a2ac');
        c.fillStyle = hg; W5.rr(c, -hw / 2, -outU, hw, 8, 3); c.fill();
        c.strokeStyle = 'rgba(11,26,21,0.5)'; c.lineWidth = 1.2; c.stroke();
      }
      c.restore();
    });
    return res;
  };
  M4.gaugeLink = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'butt';
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 10; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = '#b9c5cc'; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * 2, ny = (x1 - x0) / L * 2;
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 - nx, y0 - ny); c.lineTo(x1 - nx, y1 - ny); c.stroke();
      c.restore();
    });
  };
  M4.pWaves = function (c, cx, cy, t, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || t < 0) return;
    const dur = o.dur == null ? 4 : o.dur, gap = o.gap || 0.55, sp = o.speed || 170, rMax = o.rMax || 420;
    const ang = o.ang || [-0.35, Math.PI + 0.35], n = o.n || 9, len = o.len || 18;
    M3.withA(c, a, () => {
      c.save(); const g0 = c.globalAlpha;
      if (o.clip) { c.beginPath(); o.clip(c); c.clip(); }
      for (let k = 0; k * gap <= Math.min(t, dur) + 1e-9; k++) {
        const r = (t - k * gap) * sp; if (r < 2 || r > rMax) continue;
        const f = Math.pow(1 - r / rMax, 1.2), ka = Math.min(1, r / 30);
        c.strokeStyle = W5.rgba(COL.coral, 0.5 * f * ka); c.lineWidth = 3;
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
        if (r < 24) continue;
        for (let i = 0; i < n; i++) {
          const q = lerp(ang[0], ang[1], n === 1 ? 0.5 : i / (n - 1)) + (k % 2 ? 0.5 : 0) * (ang[1] - ang[0]) / Math.max(1, n - 1);
          if (q > ang[1] + 1e-6) continue;
          const ux = Math.cos(q), uy = Math.sin(q), x1 = cx + ux * r, y1 = cy + uy * r;
          c.globalAlpha = g0 * Math.min(1, 1.3 * f) * ka;
          W5.arrow(c, x1 - ux * len, y1 - uy * len, x1, y1, 'rgba(11,26,21,0.85)', 6, 10);
          W5.arrow(c, x1 - ux * len, y1 - uy * len, x1, y1, COL.coral, 3, 8);
        }
        c.globalAlpha = g0;
      }
      c.restore();
    });
  };
  /* ═══════════ 液壓千斤頂（jack 建立） ═══════════ */
  M4.jack = function (c, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, wl = o.wall || 8, top = o.mouth, bot = o.floor;
    const S = o.s, B = o.b, x0 = Math.min(S.x - S.w / 2, B.x - B.w / 2), x1 = Math.max(S.x + S.w / 2, B.x + B.w / 2);
    const res = { x0, x1, s: null, b: null };
    res.clip = cc => {
      cc.rect(x0, top, x1 - x0, bot - top);
      [S, B].forEach(P => { const fy = top - (P.pos || 0); cc.rect(P.x - P.w / 2, fy, P.w, top - fy + 1); });
    };
    if (a > 0.02) M3.withA(c, a, () => {
      c.save();
      /* 連通管裡的水 */
      const g = c.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, W5.rgba(M4.PC.water, 0.46)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
      c.fillStyle = g; c.fillRect(x0, top, x1 - x0, bot - top);
      /* 管壁（外框 − 內框） */
      const wg = c.createLinearGradient(0, top - wl, 0, bot + wl);
      wg.addColorStop(0, '#cfd8de'); wg.addColorStop(1, '#8b99a3');
      c.fillStyle = wg; c.beginPath();
      W5.rr(c, x0 - wl, top - wl, x1 - x0 + 2 * wl, bot - top + 2 * wl, 6);
      c.rect(x0, top, x1 - x0, bot - top);
      c.fill('evenodd');
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
      c.strokeRect(x0 - 0.5, top - 0.5, x1 - x0 + 1, bot - top + 1);
      /* 筒口（頂壁開口，壁裡也是水） */
      c.fillStyle = W5.rgba(M4.PC.water, 0.5);
      [S, B].forEach(P => c.fillRect(P.x - P.w / 2, top - wl - 1, P.w, wl + 2));
      c.restore();
    });
    [['s', S], ['b', B]].forEach(([k, P]) => {
      res[k] = M4.piston(c, P.x, top, { dir: 'up', w: P.w, len: P.len, pos: P.pos, th: P.th, rod: P.rod, handle: P.handle, wall: 6, a });
    });
    return res;
  };

  /* ═══════════ 行程尺、標亮的液體圓柱（work 建立） ═══════════ */
  M4.cmRuler = function (c, x, y0, k, n, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 14, sg = o.dir === 'up' ? -1 : 1;
    const Y = cm => y0 + sg * cm * k;
    if (a <= 0.02) return Y;
    const ya = Math.min(y0, Y(n)), yb = Math.max(y0, Y(n)), right = o.side === 'right';
    M3.withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(246,243,234,0.14)'; c.fillRect(x - w / 2, ya, w, yb - ya);
      if (o.hi) {
        const h0 = Y(o.hi[0]), h1 = Y(o.hi[1]), hA = o.hiA == null ? 1 : o.hiA;
        if (hA > 0.02) { c.fillStyle = W5.rgba(COL.yellow, 0.55 * hA); c.fillRect(x - w / 2, Math.min(h0, h1), w, Math.abs(h1 - h0)); }
      }
      c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 1.5; c.strokeRect(x - w / 2, ya, w, yb - ya);
      for (let d = 0; d <= n + 1e-6; d++) {
        const y = Y(d), big = d % 5 === 0, L = big ? w : w * 0.5;
        c.lineWidth = big ? 2.2 : 1.3; c.beginPath();
        if (right) { c.moveTo(x + w / 2, y); c.lineTo(x + w / 2 - L, y); } else { c.moveTo(x - w / 2, y); c.lineTo(x - w / 2 + L, y); }
        c.stroke();
      }
      c.restore();
    });
    return Y;
  };
  M4.slug = function (c, x, y0, y1, w, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || y1 - y0 < 0.5) return;
    const ry = o.ry == null ? w * 0.11 : o.ry, hw = w / 2, fA = o.fillA == null ? 0.42 : o.fillA;
    const HI = '#9fe3ff', FILL = '#5cc8ff';
    M3.withA(c, a, () => {
      c.save();
      if (o.glow) W5.glow(c, x, (y0 + y1) / 2, Math.max(hw, (y1 - y0) / 2) + 40, FILL, 0.28 * o.glow);
      const path = () => {
        c.beginPath(); c.moveTo(x - hw, y0); c.lineTo(x - hw, y1);
        if (o.bottom !== false) c.ellipse(x, y1, hw, ry, 0, Math.PI, 0, true); else c.lineTo(x + hw, y1);
        c.lineTo(x + hw, y0);
        if (o.top !== false) c.ellipse(x, y0, hw, ry, 0, 0, Math.PI, true); else c.closePath();
      };
      path(); c.fillStyle = W5.rgba(FILL, fA); c.fill();
      if (o.top !== false) { c.fillStyle = W5.rgba(HI, fA * 0.7); c.beginPath(); c.ellipse(x, y0, hw, ry, 0, 0, TAU); c.fill(); }
      c.strokeStyle = HI; c.lineWidth = 2.5;
      if (o.dash !== false) { c.setLineDash([8, 6]); c.lineDashOffset = -(o.phase || 0); }
      path(); c.stroke();
      if (o.top !== false) { c.beginPath(); c.ellipse(x, y0, hw, ry, 0, 0, TAU); c.stroke(); }
      c.restore();
    });
  };
  /* ═══════════ 空氣球、向內壓的壓力箭頭（total 建立） ═══════════ */
  M4.airBall = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || '#cfe9ff';
    const res = { cx, cy, r };
    if (a <= 0.02 || r < 1) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 原本大小（白色虛線圓） */
      if (o.ghost != null) {
        const ga = o.ghostA == null ? 1 : o.ghostA;
        if (ga > 0.02) { c.save(); c.globalAlpha *= ga; c.strokeStyle = 'rgba(246,243,234,0.85)'; c.lineWidth = 2.5; c.setLineDash([7, 6]);
          c.beginPath(); c.arc(cx, cy, o.ghost, 0, TAU); c.stroke(); c.restore(); }
      }
      /* 底部小結 */
      if (o.knot !== false) {
        c.fillStyle = W5.mix(col, '#5d7f99', 0.45);
        c.beginPath(); c.moveTo(cx - 4, cy + r - 1); c.lineTo(cx + 4, cy + r - 1); c.lineTo(cx + 5, cy + r + 6); c.lineTo(cx - 5, cy + r + 6); c.closePath(); c.fill();
      }
      /* 球體：透明淺白藍 */
      const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.05);
      g.addColorStop(0, W5.rgba('#ffffff', 0.55)); g.addColorStop(0.5, W5.rgba(col, 0.30)); g.addColorStop(1, W5.rgba(col, 0.50));
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      c.strokeStyle = W5.rgba('#ffffff', 0.85); c.lineWidth = 2.2; c.stroke();
      /* 空氣分子點：單位圓內的固定比例位置 */
      const n = o.n == null ? 16 : o.n, seed = o.seed || 7, t = o.t || 0;
      c.fillStyle = 'rgba(246,243,234,0.85)';
      for (let i = 0; i < n; i++) {
        const q = Math.sqrt((i + 0.5) / n) * 0.78, ang = i * 2.39996 + seed + 0.3 * Math.sin(t * 1.7 + i);
        const x = cx + r * q * Math.cos(ang), y = cy + r * q * Math.sin(ang);
        c.beginPath(); c.arc(x, y, Math.max(1.8, Math.min(3, r * 0.07)), 0, TAU); c.fill();
      }
      /* 高光 */
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath(); c.ellipse(cx - r * 0.42, cy - r * 0.45, r * 0.2, r * 0.12, -0.7, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, r * 0.8, 0.25, 1.25); c.stroke();
      c.restore();
    });
    return res;
  };
  M4.squeeze = function (c, cx, cy, r, parts, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || !parts || !parts.length) return;
    const n = o.n || 6, ang0 = o.ang0 || 0, gap = o.gap == null ? 2 : o.gap, lw = o.lw || 5;
    const tot = parts.reduce((m, p) => m + Math.max(0, p.len), 0); if (tot < 2) return;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'butt';
      for (let i = 0; i < n; i++) {
        const th = ang0 + i * TAU / n, ux = Math.cos(th), uy = Math.sin(th);
        const tipR = r + gap; let rr0 = tipR + tot;
        parts.forEach((p, k) => {
          const L = Math.max(0, p.len); if (L < 0.5) return;
          const r1 = rr0 - L, last = k === parts.length - 1;
          const x0 = cx + ux * rr0, y0 = cy + uy * rr0, x1 = cx + ux * r1, y1 = cy + uy * r1;
          if (last) {
            const head = Math.max(7, Math.min(12, L * 0.5));
            W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 3, head + 2);
            W5.arrow(c, x0, y0, x1, y1, p.col, lw, head);
          } else {
            c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
            c.strokeStyle = p.col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          }
          rr0 = r1;
        });
      }
      c.restore();
    });
  };
  /* ═══════════ U 型管、可換色的倒液、側標量尺（utube 建立） ═══════════ */
  M4.uTube = function (c, o) {
    const xl = o.xl, xr = o.xr, yb = o.yb, rim = o.rim, hw = o.hw || 22, wl = o.wall || 6, a = o.a == null ? 1 : o.a;
    const t = o.t || 0, wob = o.wob == null ? 1 : o.wob, cx = (xl + xr) / 2, R = (xr - xl) / 2;
    const lvL = o.lvL, lvR = o.lvR, oil = o.oilTop != null && o.oilTop < lvR - 0.3, oTop = oil ? o.oilTop : lvR;
    const wave = (y0, ph) => x => y0 + wob * (Math.sin(x * 0.16 + t * 3.1 + ph) * 0.6 + Math.sin(x * 0.07 - t * 1.9 + ph) * 0.4);
    const surfL = wave(lvL, 0), surfR = wave(oTop, 1.7);
    const path = cc => {
      cc.beginPath(); cc.moveTo(xl - hw, rim); cc.lineTo(xl - hw, yb); cc.arc(cx, yb, R + hw, Math.PI, 0, true);
      cc.lineTo(xr + hw, rim); cc.lineTo(xr - hw, rim); cc.lineTo(xr - hw, yb); cc.arc(cx, yb, R - hw, 0, Math.PI, false);
      cc.lineTo(xl + hw, rim); cc.closePath();
    };
    const res = { cx, R, iface: lvR, surfL, surfR, path };
    if (a <= 0.02) return res;
    const topSurf = (f, x0, x1) => { for (let x = x0; ; x += 4) { if (x >= x1) { c.lineTo(x1, f(x1)); break; } c.lineTo(x, f(x)); } };
    M3.withA(c, a, () => {
      c.save(); c.lineJoin = 'round';
      /* 管內淡淡的玻璃色 */
      c.fillStyle = 'rgba(200,230,245,0.06)'; path(c); c.fill();
      /* 水（一整塊：左臂到水面、彎管、右臂到 lvR） */
      c.beginPath(); c.moveTo(xl - hw, surfL(xl - hw)); c.lineTo(xl - hw, yb); c.arc(cx, yb, R + hw, Math.PI, 0, true);
      if (oil) { c.lineTo(xr + hw, lvR); c.lineTo(xr - hw, lvR); }
      else { c.lineTo(xr + hw, surfR(xr + hw)); for (let x = xr + hw - 4; x > xr - hw; x -= 4) c.lineTo(x, surfR(x)); c.lineTo(xr - hw, surfR(xr - hw)); }
      c.lineTo(xr - hw, yb); c.arc(cx, yb, R - hw, 0, Math.PI, false);
      c.lineTo(xl + hw, surfL(xl + hw)); for (let x = xl + hw - 4; x > xl - hw; x -= 4) c.lineTo(x, surfL(x)); c.closePath();
      const top = Math.min(lvL, lvR), g = c.createLinearGradient(0, top, 0, yb + R + hw);
      g.addColorStop(0, W5.rgba(M4.PC.water, 0.44)); g.addColorStop(1, W5.rgba('#1a60a8', 0.62));
      c.fillStyle = g; c.fill();
      /* 油（右臂，浮在水上） */
      if (oil) {
        c.beginPath(); c.moveTo(xr - hw, lvR); c.lineTo(xr + hw, lvR); c.lineTo(xr + hw, surfR(xr + hw));
        for (let x = xr + hw - 4; x > xr - hw; x -= 4) c.lineTo(x, surfR(x)); c.lineTo(xr - hw, surfR(xr - hw)); c.closePath();
        const go = c.createLinearGradient(0, oTop, 0, lvR);
        go.addColorStop(0, W5.rgba('#f2c060', 0.62)); go.addColorStop(1, W5.rgba(M4.PC.oil, 0.78));
        c.fillStyle = go; c.fill();
        /* 油水交界：清楚的一條線 */
        c.strokeStyle = 'rgba(255,240,205,0.9)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(xr - hw + 1, lvR); c.lineTo(xr + hw - 1, lvR); c.stroke();
      }
      /* 自由液面亮線 */
      c.lineCap = 'round'; c.lineWidth = 3;
      c.strokeStyle = M4.PC.waterEdge; c.beginPath(); c.moveTo(xl - hw + 1.5, surfL(xl - hw)); topSurf(surfL, xl - hw + 4, xl + hw - 1.5); c.stroke();
      c.strokeStyle = oil ? '#ffd890' : M4.PC.waterEdge; c.beginPath(); c.moveTo(xr - hw + 1.5, surfR(xr - hw)); topSurf(surfR, xr - hw + 4, xr + hw - 1.5); c.stroke();
      /* 玻璃壁：外圈、內圈各一條（半透明，看得出是玻璃） */
      const GL = 'rgba(178,212,228,0.62)', HI = 'rgba(240,250,255,0.85)';
      const wallPath = (off, inner) => {
        const xa = inner ? xl + off : xl - off, xb = inner ? xr - off : xr + off, rr = inner ? R - off : R + off;
        c.beginPath(); c.moveTo(xa, rim); c.lineTo(xa, yb); c.arc(cx, yb, rr, Math.PI, 0, true); c.lineTo(xb, rim);
      };
      c.lineCap = 'butt'; c.strokeStyle = GL; c.lineWidth = wl;
      wallPath(hw + wl / 2, false); c.stroke(); wallPath(hw + wl / 2, true); c.stroke();
      c.strokeStyle = HI; c.lineWidth = 1.4;
      wallPath(hw, false); c.stroke(); wallPath(hw, true); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.2;
      wallPath(hw + wl, false); c.stroke();
      /* 玻璃反光：兩臂各一道直的、彎管一道弧 */
      c.strokeStyle = 'rgba(255,255,255,0.20)'; c.lineWidth = 4; c.lineCap = 'round';
      [xl, xr].forEach(x => { c.beginPath(); c.moveTo(x - hw * 0.55, rim + 14); c.lineTo(x - hw * 0.55, yb - 10); c.stroke(); });
      c.beginPath(); c.arc(cx, yb, R + hw * 0.55, Math.PI * 0.62, Math.PI * 0.9); c.stroke();
      /* 管口圓邊 */
      c.fillStyle = 'rgba(240,250,255,0.9)';
      [xl, xr].forEach(x => { W5.rr(c, x - hw - wl - 1, rim - 3, wl + 2, 6, 3); c.fill(); W5.rr(c, x + hw - 1, rim - 3, wl + 2, 6, 3); c.fill(); });
      c.restore();
    });
    return res;
  };
  M4.pourLiquid = function (c, x, y0, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 7, t = o.t || 0;
    const col = o.col || M4.PC.oil, hi = o.hi || '#ffe2a8', rimC = o.rim || hi;
    if (a <= 0.02 || y1 - y0 < 2) return;
    M3.withA(c, a, () => {
      c.save();
      const g = c.createLinearGradient(0, y0, 0, Math.min(y1, y0 + 30));
      g.addColorStop(0, W5.rgba(col, 0.55)); g.addColorStop(1, W5.rgba(col, 0.92));
      c.fillStyle = g; c.fillRect(x - w / 2, y0, w, y1 - y0);
      c.strokeStyle = W5.rgba(hi, 0.85); c.lineWidth = Math.max(1.2, w * 0.35); c.lineCap = 'round';
      c.setLineDash([10, 12]); c.lineDashOffset = -(t * 200) % 22;
      c.beginPath(); c.moveTo(x, y0 + 4); c.lineTo(x, y1 - 2); c.stroke(); c.setLineDash([]);
      if (o.splash !== false) {
        const rw = o.rw || 14;
        for (let k = 0; k < 2; k++) {
          const q = (t * 1.8 + k * 0.5) % 1;
          c.strokeStyle = W5.rgba(rimC, 0.75 * (1 - q)); c.lineWidth = 2;
          c.beginPath(); c.ellipse(x, y1, 3 + rw * q, 1.5 + 2.5 * q, 0, 0, TAU); c.stroke();
        }
      }
      c.restore();
    });
  };
  M4.sideRuler = function (c, x, y0, k, hMax, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, w = o.w || 14, g = o.g == null ? 1 : clamp01(o.g);
    if (a <= 0.02 || g <= 0.01) return;
    const h = hMax * g, y1 = y0 - h * k, left = o.side === 'left';
    M3.withA(c, a, () => {
      c.save();
      c.fillStyle = 'rgba(246,243,234,0.14)'; c.fillRect(x - w / 2, y1, w, y0 - y1);
      c.strokeStyle = 'rgba(246,243,234,0.78)'; c.lineWidth = 1.5; c.strokeRect(x - w / 2, y1, w, y0 - y1);
      for (let d = 0; d <= h + 1e-6; d += 5) {
        const y = y0 - d * k, big = d % 10 === 0, L = big ? w : w * 0.55;
        c.lineWidth = big ? 2.2 : 1.4; c.beginPath();
        if (left) { c.moveTo(x + w / 2, y); c.lineTo(x + w / 2 - L, y); } else { c.moveTo(x - w / 2, y); c.lineTo(x - w / 2 + L, y); }
        c.stroke();
      }
      c.restore();
    });
    (o.nums || [10, 20]).forEach(d => {
      if (d > h + 1e-6) return;
      M3.T(c, a, String(d), left ? x - w / 2 - 8 : x + w / 2 + 8, y0 - d * k, o.col || COL.dim, 22, left ? 'right' : 'left', true);
    });
  };
})(window);
