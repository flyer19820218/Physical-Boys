/* ==================================================================
   mechanics_3_common_1126_v1.js ｜ 本單元 12 支動畫共用的畫法（window.M3）
   ------------------------------------------------------------------
   第一支動畫（micro）建立；之後的動畫只能「新增」函式，不改既有函式的簽名。
   依賴 work_5_kit_1103_v1.js（W5），要在 kit 之後、各動畫檔之前載入。

   ── 速查 ──
   常數   M3.FC（力的顏色語意）M3.INK  M3.GY(455)  M3.KEY_Y(62)  M3.Q_Y(108)  M3.BOT_Y(505)  M3.MAT（材質）
   文字   M3.L(zh,en)  M3.T(c,a,str,x,y,col,size,align,mono)  M3.P(...)（pill）  M3.caption(c,a,str,col,x,y,size)
   時間   M3.since(s,n,t)  M3.fin(s,n,t,d)  M3.fout(s,n,t,d)  M3.grow(s,n,a,b)  M3.shake(u,amp,freq,seed)
   場景   M3.backdrop(c,o)  M3.ground(c,gy,o)  M3.legend(c,x,y,cellPx,perCell,a,unit)  M3.table(c,x0,x1,topY,footY,o)
          M3.slab(c,x0,y0,x1,y1,mat,o)  M3.wall(c,x,y0,y1,side,o)
   力     M3.force(c,o)（長度＝值×比例尺，含「40 gw」標籤）  M3.arrowFx(c,x0,y0,x1,y1,col,a,lw,tickPx)
   物件   M3.block / M3.crate / M3.wardrobe / M3.fridge (c,cx,by,w,h,o)   M3.mass(c,cx,by,o)
          M3.springScale(c,o)   M3.magnifier(c,cx,cy,r,o)
   微觀   M3.teethPair(seed,x0,x1,base,o) → {low,up,contacts}   M3.teethFill(c,pts,toY,mat,o)   M3.texture(...)
   效果   M3.flash(c,x,y,r,col,a,rot)  M3.speedLines(c,x,y,h,len,a,dir)
   人物   M3.march(c,pose,x,baseY,o)  M3.marchHand(pose,x,baseY,o)  M3.MARCH（各姿勢的腳底、中線、手的位置）
          M3.marchPush(c,faceX,baseY,dir,o)（touch_ready 手貼物體的面推；dir 'left' 自動鏡像）→ {x,hand,box}
   虛線   M3.dashArrow(c,x0,y0,x1,y1,col,a,phase,o)（運動／運動趨勢，不是力）  M3.ghostBox(c,x0,y0,w,h,col,a,phase,fillA)（想去的位置）
   圖表   M3.fFGraph(c,o)（f–F 摩擦力折線小圖：靜摩擦斜線→最大靜摩擦→掉到動摩擦→水平線，紅點、虛線）→ {X(F),Y(f),...}
          M3.fFPoint(t,o)（沿整條折線 0..1 的位置 {F,f}，給紅點掃一遍用）
          static／kinetic 的標準版面：M3.FF_STD＝{ x:610, y:420, w:260, h:260 }（左邊衣櫃＋March、右邊 f–F 圖）
   拉木塊 M3.pullScene(c,o)（桌面材質板＋木塊＋砝碼＋彈簧秤＋March 往右拉，讀數升到峰值→滑動→保留峰值標籤，附讀數曲線小圖）
          M3.pullState(t,o)（t 0..1 → 讀數、位移）  M3.pullGraph(c,o)（讀數–時間小圖）  M3.PULL（時間點與預設版面）；surface／area／normal 用
   腳踏車 M3.bikeWheel(c,cx,cy,r,o)（側視車輪：ang 轉角、tread smooth|road|knobby、blur）→ {tyreIn,rimIn,knob}
          M3.bikeFork(c,cx,cy,r,o)（前叉）→ {crownX,crownY}   M3.rimBrake(c,cx,cy,r,o)（輪圈煞車夾器＋兩片煞車皮，squeeze 0..1）→ {x,y,x0,x1,top}；more 建立、less 沿用
   鏈條   M3.bikeChain(c,o)（側視：兩個齒盤＋繞一圈的滾子鏈，phase 鏈條走了多遠、rust 乾鏽、oil 上油亮面）→ {A,B,L,pitch,at(s)}；less 建立
   受力圖 M3.fbdBox(c,cx,cy,w,h,o)（受力圖裡的白框小冰箱／木塊，kind 'fridge'|'block'、dot 中心點）→ {x0,y0,x1,y1,cx,cy}
          M3.forceInto(c,o)（同 M3.force，但 o.x,o.y 是箭頭尖端＝推進物體表面的力）  M3.forceQ(c,o)（未知的力：虛線＋問號標籤）
          M3.segArrow(c,o)（分段箭頭 parts＝[{val,col}]，例 50＋350 首尾相接）→ {x1,y1,ends}
          M3.brace(c,x0,y0,x1,y1,o)（大括號，text 標總和／比例）  M3.eqRow(c,o)（一列彩色等式字塊，show 依序出現）；fridge 建立，ab／wall 沿用
   配對   M3.pairArc(c,x0,y0,x1,y1,o)（雙向弧箭頭，把作用力與反作用力配成一對；bulge 凸出量、grow 從中間長出）；ab 建立
   ================================================================== */
(function (root) {
  'use strict';
  const M3 = root.M3 = root.M3 || {};
  if (typeof W5 === 'undefined') return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, clamp01 = W5.clamp01, ease = W5.ease, lerp = W5.lerp, hash = W5.hash;

  /* ═══════════ 常數 ═══════════ */
  /* 力的顏色語意（全單元一致）：外力青、摩擦珊瑚、重力粉、正向力綠、合力黃 */
  M3.FC = { push: COL.teal, friction: COL.coral, gravity: COL.pink, normal: COL.green, net: COL.yellow };
  M3.INK = '#0b1a15';
  /* 建議版面：地面線、頂端主標 pill、第二行問句、底部結論 */
  M3.GY = 455; M3.KEY_Y = 62; M3.Q_Y = 108; M3.BOT_Y = 505;

  /* 材質：fill＝上→下漸層兩色、edge＝表面亮線、tex＝紋理種類（grain 木紋／speck 顆粒／glint 反光／none） */
  M3.MAT = {
    wood:      { fill: ['#bd8655', '#7a4b2d'], edge: '#e9bb8a', tex: 'grain', ink: 'rgba(70,38,18,0.45)' },      /* 木桌、木板 */
    lightwood: { fill: ['#f4ecd8', '#d6c29a'], edge: '#fff8e6', tex: 'grain', ink: 'rgba(150,108,58,0.38)' },   /* 木塊（白色紋理） */
    darkwood:  { fill: ['#6d4630', '#432a1c'], edge: '#a87452', tex: 'grain', ink: 'rgba(30,16,8,0.45)' },      /* 衣櫃 */
    ice:       { fill: ['#dff6fc', '#86c8de'], edge: '#ffffff', tex: 'glint', ink: 'rgba(255,255,255,0.55)' },
    asphalt:   { fill: ['#6d7278', '#3a3e43'], edge: '#cfd4d8', tex: 'speck', ink: 'rgba(20,22,25,0.55)' },
    plastic:   { fill: ['#eaf1f5', '#b3c2cb'], edge: '#ffffff', tex: 'glint', ink: 'rgba(255,255,255,0.6)' },
    sandpaper: { fill: ['#cfa76b', '#8c6a39'], edge: '#f2d59e', tex: 'speck', ink: 'rgba(70,48,20,0.6)' },
    rubber:    { fill: ['#4d5260', '#2a2d36'], edge: '#a3acbe', tex: 'none',  ink: 'rgba(0,0,0,0.3)' },          /* 鞋底、輪胎 */
    metal:     { fill: ['#e6edf1', '#93a2ac'], edge: '#ffffff', tex: 'glint', ink: 'rgba(255,255,255,0.7)' },   /* 冰刀、軸承 */
    brick:     { fill: ['#7c5a4c', '#563d33'], edge: '#b38b78', tex: 'none',  ink: 'rgba(30,18,14,0.6)' }        /* 牆 */
  };
  const matOf = m => (typeof m === 'string' ? (M3.MAT[m] || M3.MAT.wood) : (m || M3.MAT.wood));

  /* ═══════════ 文字 ═══════════ */
  /* 中英對照（頁面全域 tr） */
  M3.L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  /* 在 globalAlpha × a 下執行 fn；a 太小就不畫 */
  M3.withA = function (c, a, fn) { if (a <= 0.02) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); };
  /* 帶透明度的文字（走 W5.label，會被檢查工具記錄）；回傳字寬 */
  M3.T = function (c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return 0;
    c.save(); c.globalAlpha *= a; const w = W5.label(c, str, x, y, col, size || 22, align, mono); c.restore(); return w;
  };
  /* 帶透明度的圓角標籤（走 W5.pill）；回傳外框 */
  M3.P = function (c, a, str, x, y, col, size, align, mono) {
    if (a <= 0.02) return null;
    c.save(); c.globalAlpha *= a; const r = W5.pill(c, str, x, y, col, size || 22, align, mono); c.restore(); return r;
  };
  /* 結論字卡：底下一團同色光暈＋pill（預設畫在底部 BOT_Y） */
  M3.caption = function (c, a, str, col, x, y, size) {
    x = x == null ? 480 : x; y = y == null ? M3.BOT_Y : y;
    if (a > 0.02) W5.glow(c, x, y, 200, col || COL.white, 0.10 * a);
    return M3.P(c, a, str, x, y, col || COL.white, size || 24);
  };

  /* ═══════════ 時間軸（s 是 draw 的第二個參數） ═══════════ */
  /* 第 n 步開始後第 t 秒算起過了多久；別的步回傳 ±99 */
  M3.since = (s, n, t) => (s.n > n ? 99 : s.n < n ? -99 : s.u - t);
  /* 第 n 步第 t 秒起用 d 秒淡入（0→1）；之後的步維持 1 */
  M3.fin = (s, n, t, d) => ease(clamp01(M3.since(s, n, t) / (d || 0.5)));
  /* 第 n 步第 t 秒起用 d 秒淡出（1→0） */
  M3.fout = (s, n, t, d) => 1 - M3.fin(s, n, t, d);
  /* 第 n 步 a→b 秒緩動 0→1（之前的步 0、之後的步 1） */
  M3.grow = (s, n, a, b) => (s.n > n ? 1 : s.n < n ? 0 : ease(clamp01((s.u - a) / (b - a))));
  /* 確定性抖動（純函式）：u 秒時的位移，amp 振幅、freq 角頻率 */
  M3.shake = (u, amp, freq, seed) => { const f = freq || 30, k = seed || 0; return amp * (Math.sin(u * f + k) * 0.65 + Math.sin(u * f * 2.37 + 1.7 + k) * 0.35); };

  /* ═══════════ 背景與地面 ═══════════ */
  /* 背景：一團淡色光暈＋淡方格。o：{ gy 方格下緣, y0 方格上緣(40), cell 格寬(40), ox, oy 格點對齊點, glow 光暈色, gx, gyGlow 光暈中心, a } */
  M3.backdrop = function (c, o) {
    o = o || {};
    const gy = o.gy == null ? M3.GY : o.gy, y0 = o.y0 == null ? 40 : o.y0, cell = o.cell || 40, a = o.a == null ? 1 : o.a;
    M3.withA(c, a, () => {
      const gx = o.gx == null ? 480 : o.gx, gyc = o.gyGlow == null ? 260 : o.gyGlow;
      const g = c.createRadialGradient(gx, gyc, 30, gx, gyc, 560);
      g.addColorStop(0, W5.rgba(o.glow || COL.teal, 0.06)); g.addColorStop(1, W5.rgba(o.glow || COL.teal, 0));
      c.fillStyle = g; c.fillRect(0, 32, 960, gy - 32);
      c.strokeStyle = 'rgba(246,243,234,0.07)'; c.lineWidth = 1.2;
      const ox = o.ox == null ? 0 : o.ox, oy = o.oy == null ? gy : o.oy;
      const yStart = oy - Math.floor((oy - y0) / cell) * cell;
      for (let x = ox - Math.floor(ox / cell) * cell; x <= 960; x += cell) { c.beginPath(); c.moveTo(x, yStart); c.lineTo(x, gy); c.stroke(); }
      for (let y = yStart; y <= gy; y += cell) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
    });
  };
  /* 地面：地面線以下的深色漸層＋中間亮、兩端淡的地面線。o：{ x0, x1, a } */
  M3.ground = function (c, gy, o) {
    o = o || {}; gy = gy == null ? M3.GY : gy;
    const x0 = o.x0 == null ? 0 : o.x0, x1 = o.x1 == null ? 960 : o.x1;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      const g = c.createLinearGradient(0, gy, 0, 540);
      g.addColorStop(0, '#2a4a3f'); g.addColorStop(1, '#14302a');
      c.fillStyle = g; c.fillRect(x0, gy, x1 - x0, 540 - gy);
      const e = c.createLinearGradient(x0, 0, x1, 0);
      e.addColorStop(0, 'rgba(246,243,234,0.10)'); e.addColorStop(0.5, 'rgba(246,243,234,0.32)'); e.addColorStop(1, 'rgba(246,243,234,0.10)');
      c.strokeStyle = e; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, gy); c.lineTo(x1, gy); c.stroke();
    });
  };
  /* 比例尺圖例：一個 cellPx 寬的小格＋「1 格 ＝ perCell unit」 */
  M3.legend = function (c, x, y, cellPx, perCell, a, unit) {
    a = a == null ? 1 : a;
    M3.withA(c, a, () => {
      c.fillStyle = 'rgba(246,243,234,0.25)'; c.fillRect(x, y - 8, cellPx, 16);
      c.strokeStyle = COL.white; c.lineWidth = 2; c.strokeRect(x, y - 8, cellPx, 16);
    });
    return M3.T(c, a, M3.L('1 格 ＝ ', '1 box = ') + perCell + ' ' + (unit || 'gw'), x + cellPx + 10, y, COL.dim, 20, 'left');
  };

  /* 材質紋理（畫在目前的 clip 裡）：x0..x1、y0..y1 範圍；o：{ seed, lw 線寬倍率, a } */
  M3.texture = function (c, mat, x0, y0, x1, y1, o) {
    o = o || {}; const M = matOf(mat), seed = o.seed || 0, lw = o.lw || 1;
    c.save(); c.globalAlpha *= (o.a == null ? 1 : o.a);
    if (M.tex === 'grain') {
      c.strokeStyle = M.ink; c.lineCap = 'round';
      const gap = 11 * lw;
      for (let y = y0 + gap * 0.6, i = 0; y < y1; y += gap * (0.8 + 0.5 * hash(seed + i * 3.1)), i++) {
        c.lineWidth = (1.2 + 1.3 * hash(seed + i * 7.7)) * lw;
        const ph = hash(seed + i) * TAU, amp = (1.5 + 2.5 * hash(seed + i * 5.3)) * lw, wl = (90 + 80 * hash(seed + i * 2.9)) * lw;
        c.beginPath();
        for (let x = x0; x <= x1 + 8; x += 8 * lw) {
          const yy = y + Math.sin(x / wl * TAU + ph) * amp;
          if (x === x0) c.moveTo(x, yy); else c.lineTo(x, yy);
        }
        c.stroke();
      }
      /* 一兩個木節 */
      const kn = Math.max(1, Math.round((x1 - x0) / (300 * lw)));
      for (let i = 0; i < kn; i++) {
        const kx = lerp(x0, x1, (i + 0.3 + 0.4 * hash(seed + 40 + i)) / kn), ky = lerp(y0, y1, 0.3 + 0.4 * hash(seed + 50 + i));
        c.lineWidth = 1.6 * lw;
        c.beginPath(); c.ellipse(kx, ky, 12 * lw, 4.5 * lw, 0, 0, TAU); c.stroke();
        c.beginPath(); c.ellipse(kx, ky, 5 * lw, 2 * lw, 0, 0, TAU); c.stroke();
      }
    } else if (M.tex === 'speck') {
      c.fillStyle = M.ink;
      const n = Math.min(900, Math.round((x1 - x0) * (y1 - y0) / (260 * lw * lw)));
      for (let i = 0; i < n; i++) {
        const x = lerp(x0, x1, hash(seed + i * 1.37)), y = lerp(y0, y1, hash(seed + i * 2.71 + 9)), r = (1 + 2.2 * hash(seed + i * 4.1)) * lw;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < n / 3; i++) {
        const x = lerp(x0, x1, hash(seed + i * 3.19 + 5)), y = lerp(y0, y1, hash(seed + i * 1.93 + 2));
        c.beginPath(); c.arc(x, y, 1.2 * lw, 0, TAU); c.fill();
      }
    } else if (M.tex === 'glint') {
      c.strokeStyle = M.ink; c.lineCap = 'round';
      const n = Math.max(2, Math.round((x1 - x0) / (120 * lw)));
      for (let i = 0; i < n; i++) {
        const x = lerp(x0, x1, (i + hash(seed + i)) / n), y = lerp(y0, y1, 0.25 + 0.5 * hash(seed + i * 3)), L = (18 + 30 * hash(seed + i * 5)) * lw;
        c.lineWidth = 2 * lw;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + L, y - L * 0.35); c.stroke();
      }
    }
    c.restore();
  };
  /* 一塊平整的材質板（桌面、地板條）：x0..x1、y0..y1，頂端畫表面亮線。o：{ a, seed, r 圓角 } */
  M3.slab = function (c, x0, y0, x1, y1, mat, o) {
    o = o || {}; const M = matOf(mat);
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      c.save();
      W5.rr(c, x0, y0, x1 - x0, y1 - y0, o.r == null ? 4 : o.r);
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, M.fill[0]); g.addColorStop(1, M.fill[1]);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.fillStyle = g; c.fill(); c.restore();
      c.clip(); M3.texture(c, M, x0, y0, x1, y1, { seed: o.seed || 3 });
      c.restore();
      c.strokeStyle = M.edge; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0 + 3, y0 + 1); c.lineTo(x1 - 3, y0 + 1); c.stroke();
    });
  };
  /* 桌子：桌面板（材質 o.mat，預設 wood）＋兩支桌腳到 footY。o：{ mat, thick(22), a, seed } */
  M3.table = function (c, x0, x1, topY, footY, o) {
    o = o || {}; const th = o.thick || 22, a = o.a == null ? 1 : o.a;
    M3.withA(c, a, () => {
      const legW = 20;
      [x0 + 28, x1 - 28 - legW].forEach(lx => {
        const g = c.createLinearGradient(lx, 0, lx + legW, 0); g.addColorStop(0, '#6b4129'); g.addColorStop(1, '#4a2c1b');
        c.fillStyle = g; c.fillRect(lx, topY + th - 2, legW, footY - topY - th + 2);
        c.fillStyle = 'rgba(11,26,21,0.4)'; c.beginPath(); c.ellipse(lx + legW / 2, footY + 2, 18, 4, 0, 0, TAU); c.fill();
      });
      /* 桌面下的橫擋 */
      c.fillStyle = '#5a3622'; c.fillRect(x0 + 28, topY + th - 2, x1 - x0 - 56, 12);
    });
    M3.slab(c, x0, topY, x1, topY + th, o.mat || 'wood', { a, seed: o.seed || 11 });
  };
  /* 牆：side＝'right' 牆在 x 右邊（牆面朝左），'left' 牆在 x 左邊（牆面朝右）。o：{ w 厚度(60), a } */
  M3.wall = function (c, x, y0, y1, side, o) {
    o = o || {}; const w = o.w || 60, xa = side === 'left' ? x - w : x, M = M3.MAT.brick;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      c.save();
      const g = c.createLinearGradient(xa, 0, xa + w, 0);
      g.addColorStop(side === 'left' ? 1 : 0, M.fill[0]); g.addColorStop(side === 'left' ? 0 : 1, M.fill[1]);
      c.fillStyle = g; c.fillRect(xa, y0, w, y1 - y0);
      c.beginPath(); c.rect(xa, y0, w, y1 - y0); c.clip();
      c.strokeStyle = M.ink; c.lineWidth = 2;
      const bh = 26, bw = 52;
      for (let y = y1, r = 0; y > y0 - bh; y -= bh, r++) {
        c.beginPath(); c.moveTo(xa, y); c.lineTo(xa + w, y); c.stroke();
        for (let bx = xa - (r % 2) * bw / 2; bx < xa + w; bx += bw) { c.beginPath(); c.moveTo(bx, y); c.lineTo(bx, y - bh); c.stroke(); }
      }
      c.restore();
      c.strokeStyle = M.edge; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    });
  };

  /* ═══════════ 力的箭頭 ═══════════ */
  /* 發光粗箭頭（深色描邊＋同色光暈）；tickPx＞0 時每 tickPx 畫一道刻痕（讓學生數格） */
  M3.arrowFx = function (c, x0, y0, x1, y1, col, a, lw, tickPx) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    a = a == null ? 1 : a; if (a <= 0.02 || len < 3) return;
    lw = lw || 7; const head = Math.min(22, Math.max(12, len * 0.45));
    c.save(); c.globalAlpha *= a;
    W5.arrow(c, x0, y0, x1, y1, 'rgba(11,26,21,0.85)', lw + 4, head + 4);
    c.shadowColor = W5.rgba(col, 0.85); c.shadowBlur = 12;
    W5.arrow(c, x0, y0, x1, y1, col, lw, head);
    c.shadowColor = 'transparent';
    if (tickPx > 0) {
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len, hw = lw / 2 + 3;
      c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 2;
      for (let d = tickPx; d < len - head; d += tickPx) {
        const x = x0 + ux * d, y = y0 + uy * d;
        c.beginPath(); c.moveTo(x - uy * hw, y + ux * hw); c.lineTo(x + uy * hw, y - ux * hw); c.stroke();
      }
    }
    c.restore();
  };
  const DIRS = { right: { x: 1, y: 0 }, left: { x: -1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
  /* 力：箭頭長＝val × k（比例尺，px／單位，整支動畫固定）。
     o：{ x, y 起點（作用點）, dir 'right'|'left'|'up'|'down'|{x,y}|角度(rad), val 數值, k 比例尺, col 顏色,
          a 透明度, grow 長出比例 0..1, lw 線寬(7), tick 每幾單位一道刻痕(0＝不畫),
          name 名稱（例 L('推力','Push')，會變成「推力 40 gw」）, text 自訂整段標籤（覆蓋 name＋數字）, unit('gw'), num false＝不寫數字,
          lab 標籤位置 'tip'(預設)|'above'|'below'|'left'|'right'|null, la 標籤透明度, dx, dy 標籤微調, size(22), pill(true) }
     回傳 { x0, y0, x1, y1, len, box }（box＝標籤外框，可拿來排版） */
  M3.force = function (c, o) {
    const d0 = typeof o.dir === 'string' ? DIRS[o.dir] : typeof o.dir === 'number' ? { x: Math.cos(o.dir), y: Math.sin(o.dir) } : (o.dir || DIRS.right);
    const m = Math.hypot(d0.x, d0.y) || 1, d = { x: d0.x / m, y: d0.y / m };
    const g = o.grow == null ? 1 : clamp01(o.grow), a = o.a == null ? 1 : o.a;
    const full = Math.abs(o.val) * o.k, len = full * g;
    const x1 = o.x + d.x * len, y1 = o.y + d.y * len, col = o.col || COL.white;
    if (g > 0.005) M3.arrowFx(c, o.x, o.y, x1, y1, col, a, o.lw || 7, o.tick ? o.tick * o.k : 0);
    const res = { x0: o.x, y0: o.y, x1, y1, len, box: null };
    const where = o.lab === undefined ? 'tip' : o.lab;
    if (!where) return res;
    const la = a * (o.la == null ? clamp01((g - 0.85) / 0.15) : o.la);
    if (la <= 0.02) return res;
    const num = o.num === false ? '' : (Math.round(o.val * 10) / 10) + ' ' + (o.unit || 'gw');
    const str = o.text != null ? o.text : (o.name ? o.name + (num ? ' ' + num : '') : num);
    if (!str) return res;
    const size = o.size || 22, wbox = W5.tw(c, str, size) + (o.pill === false ? 0 : 28), hbox = size + 16;
    let lx, ly, align = 'center';
    const mx = (o.x + x1) / 2, my = (o.y + y1) / 2;
    if (where === 'tip') {
      if (Math.abs(d.x) >= Math.abs(d.y)) { lx = x1 + d.x * 14; ly = y1; align = d.x > 0 ? 'left' : 'right'; }
      else { lx = x1; ly = y1 + d.y * (hbox / 2 + 12); }
    } else if (where === 'above') { lx = mx; ly = my - hbox / 2 - 12; }
    else if (where === 'below') { lx = mx; ly = my + hbox / 2 + 12; }
    else if (where === 'left') { lx = Math.min(o.x, x1) - 14; ly = my; align = 'right'; }
    else { lx = Math.max(o.x, x1) + 14; ly = my; align = 'left'; }
    lx += o.dx || 0; ly += o.dy || 0;
    if (o.pill === false) M3.T(c, la, str, lx, ly, col, size, align);
    else res.box = M3.P(c, la, str, lx, ly, col, size, align);
    if (!res.box) { const bx = align === 'left' ? lx : align === 'right' ? lx - wbox : lx - wbox / 2; res.box = { x: bx, y: ly - hbox / 2, w: wbox, h: hbox }; }
    return res;
  };

  /* ═══════════ 物件（cx＝中線 x、by＝底面 y：都是「放在某條線上」的畫法） ═══════════ */
  function boxShadow(c, cx, by, w) {
    c.save(); c.globalAlpha *= 0.45; c.fillStyle = M3.INK;
    c.beginPath(); c.ellipse(cx, by + 3, w * 0.55, 7, 0, 0, TAU); c.fill(); c.restore();
  }
  /* 底面接觸線強調（o.contact＝強度 0..1，o.contactCol 預設黃） */
  function contactLine(c, cx, by, w, o) {
    const k = o.contact || 0; if (k <= 0.02) return;
    const col = o.contactCol || COL.yellow;
    M3.withA(c, k, () => {
      W5.glow(c, cx, by, w * 0.6, col, 0.25);
      c.save(); c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(cx - w / 2 + 3, by - 1); c.lineTo(cx + w / 2 - 3, by - 1); c.stroke(); c.restore();
    });
  }
  /* 木塊（淺色木紋、端面年輪）：o：{ a, mat('lightwood'), seed, contact 底面強調, contactCol, shadow(true) } */
  M3.block = function (c, cx, by, w, h, o) {
    o = o || {}; const M = matOf(o.mat || 'lightwood'), x0 = cx - w / 2, y0 = by - h;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      if (o.shadow !== false) boxShadow(c, cx, by, w);
      c.save();
      W5.rr(c, x0, y0, w, h, 6);
      const g = c.createLinearGradient(0, y0, 0, by); g.addColorStop(0, M.fill[0]); g.addColorStop(1, M.fill[1]);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.fillStyle = g; c.fill(); c.restore();
      c.clip(); M3.texture(c, M, x0, y0, x0 + w, by, { seed: o.seed || 7 });
      /* 上緣高光、下緣陰影 */
      const hl = c.createLinearGradient(0, y0, 0, by);
      hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(0.12, 'rgba(255,255,255,0)'); hl.addColorStop(0.85, 'rgba(0,0,0,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.18)');
      c.fillStyle = hl; c.fillRect(x0, y0, w, h);
      c.restore();
      c.strokeStyle = 'rgba(70,48,24,0.85)'; c.lineWidth = 2; W5.rr(c, x0, y0, w, h, 6); c.stroke();
    });
    contactLine(c, cx, by, w, o);
  };
  /* 木箱（框條＋斜撐的貨運木箱）：o：{ a, seed, contact, contactCol, shadow } */
  M3.crate = function (c, cx, by, w, h, o) {
    o = o || {}; const M = M3.MAT.wood, x0 = cx - w / 2, y0 = by - h, f = Math.max(12, Math.min(w, h) * 0.13);
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      if (o.shadow !== false) boxShadow(c, cx, by, w);
      c.save();
      c.beginPath(); c.rect(x0, y0, w, h);
      const g = c.createLinearGradient(0, y0, 0, by); g.addColorStop(0, '#b07a4a'); g.addColorStop(1, '#7c5031');
      c.save(); c.shadowColor = 'rgba(11,26,21,0.55)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.fillStyle = g; c.fill(); c.restore();
      c.clip();
      /* 橫向木板縫 */
      c.strokeStyle = 'rgba(60,32,16,0.6)'; c.lineWidth = 2;
      const nb = Math.max(2, Math.round(h / 34));
      for (let i = 1; i < nb; i++) { const y = y0 + h * i / nb; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + w, y); c.stroke(); }
      M3.texture(c, M, x0, y0, x0 + w, by, { seed: o.seed || 21, a: 0.6 });
      /* 斜撐 */
      c.save(); c.lineCap = 'butt'; c.strokeStyle = '#c48d58'; c.lineWidth = f * 0.9;
      c.beginPath(); c.moveTo(x0 + f, by - f); c.lineTo(x0 + w - f, y0 + f); c.stroke();
      c.strokeStyle = 'rgba(60,32,16,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0 + f, by - f - f * 0.45); c.lineTo(x0 + w - f - f * 0.45, y0 + f); c.stroke();
      c.restore();
      c.restore();
      /* 外框 */
      c.strokeStyle = '#d49a62'; c.lineWidth = f; c.strokeRect(x0 + f / 2, y0 + f / 2, w - f, h - f);
      c.strokeStyle = 'rgba(60,32,16,0.85)'; c.lineWidth = 2; c.strokeRect(x0, y0, w, h); c.strokeRect(x0 + f, y0 + f, w - 2 * f, h - 2 * f);
      /* 四角釘子 */
      c.fillStyle = '#3d2a1d';
      [[x0 + f / 2, y0 + f / 2], [x0 + w - f / 2, y0 + f / 2], [x0 + f / 2, by - f / 2], [x0 + w - f / 2, by - f / 2]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 2.6, 0, TAU); c.fill(); });
    });
    contactLine(c, cx, by, w, o);
  };
  /* 衣櫃（深色大木櫃：兩扇門、把手、頂冠、短腳）：o：{ a, seed, contact, contactCol, shadow } */
  M3.wardrobe = function (c, cx, by, w, h, o) {
    o = o || {}; const M = M3.MAT.darkwood, x0 = cx - w / 2, y0 = by - h, foot = 10, crown = 14;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      if (o.shadow !== false) boxShadow(c, cx, by, w);
      /* 腳 */
      c.fillStyle = '#2e1d13';
      c.fillRect(x0 + 8, by - foot, 16, foot); c.fillRect(x0 + w - 24, by - foot, 16, foot);
      /* 櫃身 */
      const bx = x0, byTop = y0 + crown, bh = h - crown - foot;
      c.save();
      c.beginPath(); c.rect(bx, byTop, w, bh);
      const g = c.createLinearGradient(bx, 0, bx + w, 0); g.addColorStop(0, M.fill[0]); g.addColorStop(0.5, '#7a5038'); g.addColorStop(1, M.fill[1]);
      c.save(); c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 4; c.fillStyle = g; c.fill(); c.restore();
      c.clip(); M3.texture(c, M, bx, byTop, bx + w, byTop + bh, { seed: o.seed || 31 });
      c.restore();
      /* 頂冠 */
      c.fillStyle = '#8a5d40'; W5.rr(c, x0 - 6, y0, w + 12, crown, 3); c.fill();
      c.strokeStyle = 'rgba(20,10,4,0.8)'; c.lineWidth = 2; W5.rr(c, x0 - 6, y0, w + 12, crown, 3); c.stroke();
      /* 兩扇門 */
      const m = 12, dw = (w - 3 * m) / 2, dh = bh - 2 * m;
      for (let i = 0; i < 2; i++) {
        const dx = bx + m + i * (dw + m), dy = byTop + m;
        c.fillStyle = 'rgba(255,220,180,0.06)'; W5.rr(c, dx, dy, dw, dh, 4); c.fill();
        c.strokeStyle = 'rgba(20,10,4,0.75)'; c.lineWidth = 2; W5.rr(c, dx, dy, dw, dh, 4); c.stroke();
        c.strokeStyle = 'rgba(255,220,180,0.14)'; W5.rr(c, dx + 8, dy + 8, dw - 16, dh - 16, 3); c.stroke();
        const hx = i === 0 ? dx + dw - 10 : dx + 10;
        c.fillStyle = '#e2c27a'; W5.rr(c, hx - 3, dy + dh * 0.45, 6, 26, 3); c.fill();
      }
      c.strokeStyle = 'rgba(20,10,4,0.85)'; c.lineWidth = 2; c.strokeRect(bx, byTop, w, bh);
    });
    contactLine(c, cx, by, w, o);
  };
  /* 冰箱（白色、上下兩門、側邊把手、圓角）：o：{ a, contact, contactCol, shadow, handle 'left'|'right' } */
  M3.fridge = function (c, cx, by, w, h, o) {
    o = o || {}; const x0 = cx - w / 2, y0 = by - h, split = y0 + h * 0.34;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      if (o.shadow !== false) boxShadow(c, cx, by, w);
      c.save();
      W5.rr(c, x0, y0, w, h, 12);
      const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#f4f7f8'); g.addColorStop(0.7, '#d9e1e4'); g.addColorStop(1, '#b7c3c8');
      c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 4; c.fillStyle = g; c.fill();
      c.restore();
      c.strokeStyle = '#7d8b91'; c.lineWidth = 2.5; W5.rr(c, x0, y0, w, h, 12); c.stroke();
      c.beginPath(); c.moveTo(x0 + 2, split); c.lineTo(x0 + w - 2, split); c.stroke();
      /* 高光條 */
      c.fillStyle = 'rgba(255,255,255,0.55)'; W5.rr(c, x0 + 8, y0 + 10, 6, h - 26, 3); c.fill();
      /* 把手 */
      const hx = o.handle === 'left' ? x0 + 16 : x0 + w - 22;
      c.fillStyle = '#8c9aa0';
      W5.rr(c, hx, split - 58, 7, 44, 3); c.fill(); W5.rr(c, hx, split + 16, 7, 64, 3); c.fill();
      /* 底部散熱格 */
      c.strokeStyle = 'rgba(80,95,100,0.6)'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const y = by - 18 + i * 3.5; c.beginPath(); c.moveTo(x0 + 16, y); c.lineTo(x0 + w - 16, y); c.stroke(); }
    });
    contactLine(c, cx, by, w, o);
  };
  /* 砝碼（側視圓柱，頂端有掛鈕）：o：{ w(64), h(34), a } → 回傳頂面 y（下一顆可以疊在這裡） */
  M3.mass = function (c, cx, by, o) {
    o = o || {}; const w = o.w || 64, h = o.h || 34, x0 = cx - w / 2, y0 = by - h, e = 7;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      const g = c.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, '#7e8a90'); g.addColorStop(0.35, '#e9eef0'); g.addColorStop(0.6, '#b9c4c9'); g.addColorStop(1, '#5f6b71');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, by); c.ellipse(cx, by, w / 2, e, 0, Math.PI, 0, true); c.lineTo(x0 + w, y0); c.closePath(); c.fill();
      c.strokeStyle = '#3d474c'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#d6dde0'; c.beginPath(); c.ellipse(cx, y0, w / 2, e, 0, 0, TAU); c.fill(); c.stroke();
      /* 頂鈕 */
      c.fillStyle = '#9aa6ab'; c.fillRect(cx - 5, y0 - 12, 10, 10); c.strokeRect(cx - 5, y0 - 12, 10, 10);
      c.beginPath(); c.ellipse(cx, y0 - 12, 9, 3.5, 0, 0, TAU); c.fill(); c.stroke();
    });
    return y0 - e;
  };

  /* ═══════════ 彈簧秤（水平） ═══════════
     o：{ x0 掛鉤端（接物體）, x1 拉環端（手拉的地方）, y 高度, val 讀數, max 刻度上限, a,
          read 是否在上方顯示讀數 pill（預設 true）, readText 自訂讀數字串, col 讀數顏色（預設 W5 white）, readDy 讀數離秤的高度(44) }
     由 x0 到 x1：掛鉤 → 彈簧（長度＝剩下的空間，所以拉得越遠越長）→ 外殼（刻度＋指針）→ 拉環。x1 可以在 x0 左邊（往左拉）。
     回傳 { hook:{x,y}, ring:{x,y}, read: pill 外框 } */
  M3.springScale = function (c, o) {
    const a = o.a == null ? 1 : o.a, sgn = o.x1 >= o.x0 ? 1 : -1, y = o.y;
    const HOOK = 16, RING = 22, CASE = 150, CH = 30;
    const xc1 = o.x1 - sgn * RING, xc0 = xc1 - sgn * CASE, xs0 = o.x0 + sgn * HOOK;
    const val = Math.max(0, o.val || 0), max = o.max || 100;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      /* 掛鉤 */
      c.strokeStyle = '#cfd8dc'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(xs0, y); c.lineTo(o.x0 + sgn * 5, y); c.arc(o.x0 + sgn * 5, y + 6, 6, -Math.PI / 2, Math.PI / 2, sgn < 0); c.stroke();
      /* 彈簧：線圈數固定、隨長度伸縮 */
      const L0 = xc0 - xs0, n = 11;
      c.strokeStyle = '#e9eef0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(xs0, y);
      for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8); c.lineTo(xs0 + L0 * t, y + Math.sin(t * n * TAU) * 9); }
      c.stroke();
      c.strokeStyle = 'rgba(11,26,21,0.35)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(xs0, y + 2);
      for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8); c.lineTo(xs0 + L0 * t, y + 2 + Math.sin(t * n * TAU) * 9); }
      c.stroke();
      /* 外殼 */
      const cx0 = Math.min(xc0, xc1);
      const g = c.createLinearGradient(0, y - CH / 2, 0, y + CH / 2); g.addColorStop(0, '#f2f5f6'); g.addColorStop(1, '#a9b6bc');
      c.save(); c.shadowColor = 'rgba(11,26,21,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 3; c.fillStyle = g; W5.rr(c, cx0, y - CH / 2, CASE, CH, 8); c.fill(); c.restore();
      c.strokeStyle = '#4e5b61'; c.lineWidth = 2; W5.rr(c, cx0, y - CH / 2, CASE, CH, 8); c.stroke();
      /* 刻度（從掛鉤那一頭的外殼端開始量） */
      const pad = 12, span = CASE - 2 * pad, t0 = sgn > 0 ? cx0 + pad : cx0 + CASE - pad;
      c.strokeStyle = '#3d474c'; c.lineWidth = 1.5;
      for (let i = 0; i <= 10; i++) { const x = t0 + sgn * span * i / 10, hh = i % 5 === 0 ? 9 : 5; c.beginPath(); c.moveTo(x, y - CH / 2 + 3); c.lineTo(x, y - CH / 2 + 3 + hh); c.stroke(); }
      /* 指針 */
      const px = t0 + sgn * span * clamp01(val / max);
      c.fillStyle = COL.red; c.strokeStyle = '#5a1a1a'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px, y - 4); c.lineTo(px - 6, y + 9); c.lineTo(px + 6, y + 9); c.closePath(); c.fill(); c.stroke();
      /* 拉環 */
      c.strokeStyle = '#cfd8dc'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(xc1, y); c.lineTo(xc1 + sgn * 6, y); c.stroke();
      c.beginPath(); c.ellipse(o.x1 - sgn * 8, y, 9, 13, 0, 0, TAU); c.stroke();
      c.restore();
    });
    const res = { hook: { x: o.x0, y }, ring: { x: o.x1, y }, read: null };
    if (o.read !== false) {
      const str = o.readText != null ? o.readText : (Math.round(val * 10) / 10) + ' gw';
      res.read = M3.P(c, a, str, Math.min(xc0, xc1) + CASE / 2, y - (o.readDy || 44), o.col || COL.white, 22, 'center', true);
    }
    return res;
  };

  /* ═══════════ 放大鏡 ═══════════
     o：{ a, inner(c) 鏡片內容（已 clip 成圓，畫布座標）, rim 框粗(10), rimA 框透明度, handle 柄的角度(rad，預設右下 0.8), handleA 柄透明度, len 柄長(r×1.15), glassA 反光強度(1) } */
  M3.magnifier = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02 || r < 2) return;
    const rim = o.rim || 10, ang = o.handle == null ? 0.8 : o.handle, hA = o.handleA == null ? 1 : o.handleA, rA = o.rimA == null ? 1 : o.rimA;
    M3.withA(c, a, () => {
      /* 柄（先畫，在框下面） */
      if (hA > 0.02) M3.withA(c, hA, () => {
        const len = o.len || r * 1.15, ux = Math.cos(ang), uy = Math.sin(ang);
        const sx = cx + ux * (r + rim * 0.4), sy = cy + uy * (r + rim * 0.4);
        c.save(); c.lineCap = 'round';
        c.strokeStyle = '#2b2f33'; c.lineWidth = 16; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + ux * len, sy + uy * len); c.stroke();
        c.strokeStyle = '#7a4f33'; c.lineWidth = 12; c.beginPath(); c.moveTo(sx + ux * len * 0.25, sy + uy * len * 0.25); c.lineTo(sx + ux * len, sy + uy * len); c.stroke();
        c.strokeStyle = 'rgba(255,220,180,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx + ux * len * 0.3 - uy * 3, sy + uy * len * 0.3 + ux * 3); c.lineTo(sx + ux * len * 0.95 - uy * 3, sy + uy * len * 0.95 + ux * 3); c.stroke();
        c.restore();
      });
      /* 鏡片內容 */
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
      if (o.inner) o.inner(c); else { c.fillStyle = 'rgba(77,210,255,0.08)'; c.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      /* 玻璃反光 */
      const ga = o.glassA == null ? 1 : o.glassA;
      if (ga > 0.02) {
        const g = c.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.05, cx - r * 0.2, cy - r * 0.2, r * 1.1);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.28 * ga).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(160,220,255,' + (0.12 * ga).toFixed(3) + ')');
        c.fillStyle = g; c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      }
      c.restore();
      /* 框 */
      if (rA > 0.02) M3.withA(c, rA, () => {
        c.save();
        c.strokeStyle = '#1d2226'; c.lineWidth = rim + 4; c.beginPath(); c.arc(cx, cy, r + rim / 2, 0, TAU); c.stroke();
        const g = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        g.addColorStop(0, '#f1f4f5'); g.addColorStop(0.45, '#9aa7ad'); g.addColorStop(1, '#5d6a70');
        c.strokeStyle = g; c.lineWidth = rim; c.beginPath(); c.arc(cx, cy, r + rim / 2, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r + rim * 0.75, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
        c.restore();
      });
    });
  };

  /* ═══════════ 微觀鋸齒 ═══════════
     teethPair：下表面（例：桌面，齒尖朝上）＋上表面（例：木塊底面，齒尖朝下）一組「咬得上」的鋸齒輪廓。
       base＝下表面谷底的基準 y；x0..x1 範圍（建議左右各多畫一點出畫面）。
       o：{ period 平均齒距(70), amp 平均齒高(60), jit 不規則度 0..1(0.6), bite 有咬進去的谷的比例 0..1(1),
            dip 上齒尖落在右斜面的位置 0..1（0＝谷底、1＝齒尖；不給就在 dipMin～dipMax 間亂數，預設 0.25～0.55）, clear 上表面在下齒尖上方留的空隙(6), seed }
       回傳 { low:[{x,y}], up:[{x,y}], contacts:[{x,y,nx,ny}] }
       ・contacts＝上齒尖碰到下表面「右斜面」的點；nx,ny＝斜面朝外（朝左上）的單位法向量。
         上表面往右推時，接觸點的力朝左上 → 水平分量就是向左的摩擦力。
       ・把上表面整排往上平移（y − gap）就是「分開」的樣子；gap＝0 時剛好咬住、不會互相穿過。 */
  M3.teethPair = function (seed, x0, x1, base, o) {
    o = o || {};
    const P = o.period || 70, A = o.amp || 60, J = o.jit == null ? 0.6 : o.jit, bite = o.bite == null ? 1 : o.bite, clr = o.clear == null ? 6 : o.clear;
    const low = [], up = [], contacts = [];
    let x = x0 - P * 0.5, i = 0;
    const peakY = k => base - A * (0.7 + 0.6 * J * (hash(seed + k * 4.13) - 0.5));
    const valY = k => base + A * 0.18 * J * (hash(seed + k * 6.71 + 3) - 0.5);
    low.push({ x, y: peakY(0) });
    while (x < x1 + P) {
      i++;
      const hv = P * 0.5 * (1 + J * (hash(seed + i * 2.37 + 1) - 0.5));
      const hp = P * 0.5 * (1 + J * (hash(seed + i * 3.91 + 7) - 0.5));
      const V = { x: x + hv, y: valY(i) }, Pk = { x: x + hv + hp, y: peakY(i) };
      low.push(V, Pk);
      x = Pk.x;
    }
    /* 上表面：每個下齒尖上方一個頂點（留 clear 空隙）；被咬的谷，上齒尖落在谷的右斜面 */
    for (let k = 0; k < low.length; k += 2) {
      const pk = low[k];
      up.push({ x: pk.x, y: pk.y - clr * (0.6 + 0.8 * hash(seed + k * 1.7 + 11)) });
      const V = low[k + 1], N = low[k + 2];
      if (!V || !N) break;
      if (hash(seed + k * 5.17 + 19) < bite) {
        const f = o.dip != null ? o.dip : lerp(o.dipMin == null ? 0.25 : o.dipMin, o.dipMax == null ? 0.55 : o.dipMax, hash(seed + k * 8.3 + 23));
        const T = { x: lerp(V.x, N.x, f), y: lerp(V.y, N.y, f) };
        const dx = N.x - V.x, dy = N.y - V.y, m = Math.hypot(dx, dy) || 1;
        up.push(T); contacts.push({ x: T.x, y: T.y, nx: dy / m, ny: -dx / m });
      }
    }
    return { low, up, contacts };
  };
  /* 鋸齒（或任何折線輪廓）填色：pts 輪廓、toY 填到哪條水平線（下表面填到下方、上表面填到上方）。
     o：{ a, dx, dy 平移, lw 線寬倍率, seed, edge 邊線色（預設材質亮線）, edgeW(3), glow 邊線發光 0..1 } */
  M3.teethFill = function (c, pts, toY, mat, o) {
    o = o || {}; const M = matOf(mat), dx = o.dx || 0, dy = o.dy || 0, lw = o.lw || 1;
    if (!pts.length) return;
    M3.withA(c, o.a == null ? 1 : o.a, () => {
      let yMin = toY, yMax = toY;
      pts.forEach(p => { yMin = Math.min(yMin, p.y + dy); yMax = Math.max(yMax, p.y + dy); });
      const xa = pts[0].x + dx, xb = pts[pts.length - 1].x + dx;
      c.save();
      c.beginPath(); c.moveTo(xa, toY);
      pts.forEach(p => c.lineTo(p.x + dx, p.y + dy));
      c.lineTo(xb, toY); c.closePath();
      const down = toY > (yMin + yMax) / 2;            /* 填到下方＝下表面 */
      const g = c.createLinearGradient(0, down ? yMin : yMax, 0, down ? yMax : yMin);
      g.addColorStop(0, M.fill[0]); g.addColorStop(1, M.fill[1]);
      c.fillStyle = g; c.fill();
      c.clip();
      M3.texture(c, M, xa, yMin, xb, yMax, { seed: o.seed || 5, lw });
      /* 靠近表面的一層亮邊（立體感） */
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 10 * lw; c.lineJoin = 'round';
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x + dx, p.y + dy) : c.moveTo(p.x + dx, p.y + dy))); c.stroke();
      c.restore();
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      if (o.glow > 0.02) { c.shadowColor = M.edge; c.shadowBlur = 10 * o.glow; }
      c.strokeStyle = o.edge || M.edge; c.lineWidth = (o.edgeW || 3) * lw;
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x + dx, p.y + dy) : c.moveTo(p.x + dx, p.y + dy))); c.stroke();
      c.restore();
    });
  };

  /* ═══════════ 效果 ═══════════ */
  /* 閃光（四芒星＋光暈），rot 旋轉角 */
  M3.flash = function (c, x, y, r, col, a, rot) {
    if (a <= 0.02) return;
    col = col || COL.yellow;
    M3.withA(c, a, () => {
      W5.glow(c, x, y, r * 1.6, col, 0.55);
      c.save(); c.translate(x, y); c.rotate(rot || 0);
      c.fillStyle = '#fffbe6';
      c.beginPath();
      for (let i = 0; i < 8; i++) { const q = i * Math.PI / 4, rr = i % 2 ? r * 0.22 : r; c.lineTo(Math.cos(q) * rr, Math.sin(q) * rr); }
      c.closePath(); c.fill();
      c.restore();
    });
  };
  /* 速度線：在 (x, y) 附近、高 h 範圍內畫 3 條長 len 的線；dir＝-1 線往左拖（物體往右跑） */
  M3.speedLines = function (c, x, y, h, len, a, dir) {
    if (a <= 0.02) return; dir = dir || -1;
    M3.withA(c, a, () => {
      c.save(); c.strokeStyle = 'rgba(200,214,206,0.75)'; c.lineWidth = 3; c.lineCap = 'round';
      [0.2, 0.5, 0.8].forEach((f, i) => {
        const yy = y - h / 2 + h * f, x0 = x + dir * 10 * hash(i + 3), L = len * (0.6 + 0.4 * hash(i + 9));
        c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + dir * L, yy); c.stroke();
      });
      c.restore();
    });
  };

  /* ═══════════ March 精靈 ═══════════
     M3.MARCH[pose]：w,h 原圖尺寸；sole 腳底所在列（半身圖＝下緣裁切列）；cx 身體中線；bust 是否半身（下緣是裁切，不是腳）；
                    hand 手的位置（推東西用，原圖座標）；face 臉朝哪邊。
     全身圖（touch_ready／touch_water／touch_shock／shocked_full／victory）：baseY 給地面線，腳會貼地。
     半身圖（normal／struggling／thinking／explaining／shocked）：當「旁白表情」，baseY 給 540（從畫布下緣冒出來）。
     推東西：touch_ready 手往右平伸（掌心 hand），flip:true 變成往左推；tug（拔河拉繩，手在 hand）原圖面向左。 */
  M3.MARCH = {
    touch_ready:  { w: 208, h: 472, sole: 471, cx: 70,  hand: [200, 172], face: 'right' },
    touch_water:  { w: 220, h: 471, sole: 470, cx: 150, hand: [12, 262], face: 'left' },
    touch_shock:  { w: 266, h: 482, sole: 481, cx: 118, hand: [258, 180], face: 'right' },
    shocked_full: { w: 273, h: 489, sole: 488, cx: 146, face: 'front' },
    victory:      { w: 250, h: 371, sole: 370, cx: 124, face: 'front' },
    running:      { w: 357, h: 349, sole: 348, cx: 230, face: 'right' },
    normal:       { w: 207, h: 316, sole: 315, cx: 103, bust: true, face: 'front' },
    struggling:   { w: 287, h: 305, sole: 304, cx: 215, bust: true, hand: [8, 170], face: 'left' },
    thinking:     { w: 265, h: 327, sole: 326, cx: 98,  bust: true, face: 'front' },
    explaining:   { w: 326, h: 359, sole: 358, cx: 146, bust: true, hand: [8, 170], face: 'left' },
    shocked:      { w: 243, h: 316, sole: 315, cx: 117, bust: true, face: 'front' },
    tug:          { w: 352, h: 572, sole: 565, cx: 150, hand: [318, 285], face: 'left', src: 'assets/characters/tug/tug_march_left.png' }
  };
  const MIMG = {};
  /* 取得（必要時載入）某個姿勢的圖；還沒載入完回傳 null */
  M3.marchImg = function (pose) {
    const P = M3.MARCH[pose]; if (!P) return null;
    let im = MIMG[pose];
    if (!im) { im = new Image(); im.src = P.src || ('assets/characters/march/' + pose + '.png'); MIMG[pose] = im; }
    return im.complete && im.naturalWidth ? im : null;
  };
  /* 預先載入幾個姿勢（動畫檔載入時呼叫，避免第一次出現時空白一下） */
  M3.preload = function (poses) { (poses || []).forEach(p => M3.marchImg(p)); };
  /* 畫 March：x＝身體中線、baseY＝腳底（半身圖＝下緣）；o：{ sc 縮放(0.5), flip 左右翻轉, a, shadow(全身圖預設 true) }
     回傳 { x, y, w, h } 外框（沒載入完回傳 null） */
  M3.march = function (c, pose, x, baseY, o) {
    o = o || {}; const P = M3.MARCH[pose], a = o.a == null ? 1 : o.a;
    if (!P || a <= 0.02) return null;
    const im = M3.marchImg(pose); if (!im) return null;
    const sc = o.sc || 0.5, w = P.w * sc, h = P.h * sc, top = baseY - P.sole * sc;
    const left = o.flip ? x - (P.w - P.cx) * sc : x - P.cx * sc;
    M3.withA(c, a, () => {
      if (!P.bust && o.shadow !== false) {
        c.save(); c.globalAlpha *= 0.4; c.fillStyle = M3.INK;
        c.beginPath(); c.ellipse(x, baseY + 3, Math.max(30, w * 0.32), 7, 0, 0, TAU); c.fill(); c.restore();
      }
      if (o.flip) { c.save(); c.translate(left + w, top); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); }
      else c.drawImage(im, left, top, w, h);
    });
    return { x: left, y: top, w, h };
  };
  /* March 手的位置（畫布座標）；參數同 M3.march。沒有定義手的姿勢回傳 null */
  M3.marchHand = function (pose, x, baseY, o) {
    o = o || {}; const P = M3.MARCH[pose]; if (!P || !P.hand) return null;
    const sc = o.sc || 0.5, top = baseY - P.sole * sc;
    const hx = o.flip ? x + (P.cx - P.hand[0]) * sc : x + (P.hand[0] - P.cx) * sc;
    return { x: hx, y: top + P.hand[1] * sc };
  };

  /* ═══════════ 第二支動畫（dir）新增 ═══════════ */
  /* March 推東西（touch_ready 手平伸）：faceX＝被推物體的那一面、baseY＝地面線、dir 'right'（站左邊往右推）|'left'（站右邊往左推，鏡像）。
     o：{ sc(0.5), a } → 回傳 { x 身體中線, hand:{x,y} 手掌位置（推力箭頭的作用點）, box 外框 }；圖沒載入完 box＝null */
  M3.marchPush = function (c, faceX, baseY, dir, o) {
    o = o || {}; const P = M3.MARCH.touch_ready, sc = o.sc || 0.5, flip = dir === 'left';
    const x = flip ? faceX + (P.hand[0] - P.cx) * sc : faceX - (P.hand[0] - P.cx) * sc;
    const box = M3.march(c, 'touch_ready', x, baseY, { sc, flip, a: o.a });
    return { x, hand: M3.marchHand('touch_ready', x, baseY, { sc, flip }), box };
  };
  /* 虛線箭頭（運動方向、運動趨勢用；不是力）：phase＝虛線流動的位移（拿 s.u×速度，看起來在往前流）。o：{ lw(4), head(14), dash([10,8]) } */
  M3.dashArrow = function (c, x0, y0, x1, y1, col, a, phase, o) {
    o = o || {}; a = a == null ? 1 : a; if (a <= 0.02) return;
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const lw = o.lw || 4, head = o.head || 14, ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.strokeStyle = col; c.fillStyle = col;
      c.setLineDash(o.dash || [10, 8]); c.lineDashOffset = -(phase || 0); c.lineWidth = lw;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * head * 0.8, y1 - uy * head * 0.8); c.stroke();
      c.setLineDash([]);
      c.beginPath(); c.moveTo(x1, y1);
      c.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
      c.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
      c.closePath(); c.fill(); c.restore();
    });
  };
  /* 半透明虛線外框（「想去的位置」「原來的位置」）：x0,y0 左上、w,h；col 線色；fillA 填色透明度(0.08)；phase 虛線流動 */
  M3.ghostBox = function (c, x0, y0, w, h, col, a, phase, fillA) {
    a = a == null ? 1 : a; if (a <= 0.02) return;
    M3.withA(c, a, () => {
      c.save();
      c.fillStyle = W5.rgba(col, fillA == null ? 0.08 : fillA); W5.rr(c, x0, y0, w, h, 6); c.fill();
      c.setLineDash([12, 9]); c.lineDashOffset = -(phase || 0);
      c.strokeStyle = col; c.lineWidth = 3; W5.rr(c, x0, y0, w, h, 6); c.stroke();
      c.restore();
    });
  };

  /* ═══════════ 第三支動畫（static）新增：f–F 小圖 ═══════════
     M3.fFGraph(c, o)：橫軸推力 F、縱軸摩擦力 f（單位 gw，0～max）。折線＝靜摩擦力 f＝F（斜線，到 peak 為止）
       → 在 F＝peak 垂直掉到 kin（虛線，drop）→ 動摩擦力 f＝kin 的水平線（到 kinTo）。全部用摩擦力的珊瑚色。
     o（全部可省略，括號內是預設）：
       位置大小  x, y＝原點（F＝0、f＝0）的畫布座標（610, 420）；w, h＝兩軸長度 px（260, 260）；
                 panel 底板：true（預設，依軸自動留邊）| false | {x0,y0,x1,y1}
       刻度      max(100) 軸上限、tick(20) 刻度間隔、peak(60) 最大靜摩擦力、kin(40) 動摩擦力
       折線      staticTo 斜線畫到 F＝多少（0，超過 peak 就停在 peak）；drop 掉下來那段虛線的進度 0..1（0）；
                 kinTo 動摩擦水平線畫到 F＝多少（null＝不畫，從 peak 起算，最多 max）
       紅點      dot {F,f}（null＝不畫）、dotA 透明度(1)、dotLabel 點旁小字（例 '(30, 30)'）、guides 點到兩軸的虛線(true)、pulse 0..1 光暈脈動
       推力標記  markF：在 F 軸上 F＝markF 的位置畫青色小三角（null＝不畫）
       標示      maxLine 60 gw 垂直虛線透明度(0.45)、maxLabel「最大靜摩擦力 60 gw」透明度(0)（畫在虛線頂端）、
                 kinLabel「動摩擦力 40 gw（固定）」透明度(0)（畫在水平線上方、靠右）
       其他      a 整張透明度(1)、size 標籤字級(20)、tickSize 刻度數字字級(18)
     回傳 { X(F)→畫布 x, Y(f)→畫布 y, ox, oy, w, h, panel:{x0,y0,x1,y1} }，可拿來在圖上再加自己的標示。
     例（static 第 2 步）：M3.fFGraph(c, { staticTo: F, dot: { F, f: F }, markF: F, dotLabel: '(30, 30)' });
     例（kinetic 第 4 步放大）：M3.fFGraph(c, { x: 200, y: 440, w: 560, h: 330, staticTo: 60, drop: 1, kinTo: 100,
                                     dot: M3.fFPoint(t), maxLabel: 1, kinLabel: 1, size: 24 }); */
  M3.FF_STD = { x: 610, y: 420, w: 260, h: 260 };
  M3.fFGraph = function (c, o) {
    o = o || {};
    const S = M3.FF_STD, ox = o.x == null ? S.x : o.x, oy = o.y == null ? S.y : o.y, w = o.w || S.w, h = o.h || S.h;
    const max = o.max || 100, tick = o.tick || 20, peak = o.peak == null ? 60 : o.peak, kin = o.kin == null ? 40 : o.kin;
    const a = o.a == null ? 1 : o.a, size = o.size || 20, ts = o.tickSize || 18;
    const X = F => ox + F / max * w, Y = f => oy - f / max * h;
    const FRc = M3.FC.friction;
    let pr = null;
    if (o.panel !== false) pr = (o.panel && typeof o.panel === 'object') ? o.panel : { x0: ox - 140, y0: oy - h - 52, x1: ox + w + 70, y1: oy + 86 };
    const res = { X, Y, ox, oy, w, h, panel: pr };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      /* 底板 */
      if (pr) {
        c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, pr.x0, pr.y0, pr.x1 - pr.x0, pr.y1 - pr.y0, 16); c.fill();
        c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, pr.x0, pr.y0, pr.x1 - pr.x0, pr.y1 - pr.y0, 16); c.stroke(); c.restore();
      }
      /* 格線＋刻度 */
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.08)'; c.lineWidth = 1.2;
      for (let v = tick; v <= max + 0.01; v += tick) {
        c.beginPath(); c.moveTo(X(v), oy); c.lineTo(X(v), Y(max)); c.stroke();
        c.beginPath(); c.moveTo(ox, Y(v)); c.lineTo(X(max), Y(v)); c.stroke();
      }
      c.restore();
      for (let v = 0; v <= max + 0.01; v += tick) {
        M3.T(c, 1, String(v), X(v), oy + 30, COL.dim, ts, 'center', true);
        if (v > 0) M3.T(c, 1, String(v), ox - 10, Y(v), COL.dim, ts, 'right', true);
      }
      /* 軸 */
      W5.arrow(c, ox, oy, X(max) + 26, oy, COL.white, 2.5, 11);
      W5.arrow(c, ox, oy, ox, Y(max) - 26, COL.white, 2.5, 11);
      M3.T(c, 1, M3.L('推力 F（gw）', 'Push F (gw)'), X(max / 2), oy + 60, M3.FC.push, size);
      M3.T(c, 1, M3.L('摩擦力 f（gw）', 'Friction f (gw)'), ox + 10, Y(max) - 30, FRc, size, 'right');
      /* 最大靜摩擦力的垂直虛線＋標示 */
      const ml = o.maxLine == null ? 0.45 : o.maxLine;
      if (ml > 0.02) M3.withA(c, ml, () => {
        c.save(); c.setLineDash([8, 7]); c.strokeStyle = COL.white; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(X(peak), oy); c.lineTo(X(peak), Y(max) - 8); c.stroke(); c.restore();
      });
      M3.T(c, o.maxLabel || 0, M3.L('最大靜摩擦力 ' + peak + ' gw', 'Max static friction ' + peak + ' gw'), X(peak), Y(max) - 30, COL.white, size);
      /* 折線 */
      const line = (pts, dash) => {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        if (dash) c.setLineDash([9, 7]);
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9;
        c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])))); c.stroke();
        c.strokeStyle = FRc; c.lineWidth = 5; c.shadowColor = W5.rgba(FRc, 0.8); c.shadowBlur = 10;
        c.stroke(); c.restore();
      };
      const st = Math.max(0, Math.min(peak, o.staticTo || 0));
      if (st > 0.2) line([[0, 0], [st, st]]);
      const dr = clamp01(o.drop || 0);
      if (dr > 0.01) line([[peak, peak], [peak, lerp(peak, kin, dr)]], true);
      if (o.kinTo != null && o.kinTo > peak + 0.2) line([[peak, kin], [Math.min(max, o.kinTo), kin]]);
      M3.T(c, o.kinLabel || 0, M3.L('動摩擦力 ' + kin + ' gw（固定）', 'Kinetic friction ' + kin + ' gw (fixed)'), X(max), Y(kin) - 26, FRc, size, 'right');
      /* F 軸上的推力標記 */
      if (o.markF != null) {
        const mx = X(Math.max(0, Math.min(max, o.markF)));
        c.save(); c.fillStyle = M3.FC.push; c.strokeStyle = M3.INK; c.lineWidth = 2;
        c.beginPath(); c.moveTo(mx, oy + 3); c.lineTo(mx - 8, oy + 15); c.lineTo(mx + 8, oy + 15); c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      /* 紅點 */
      const dA = o.dotA == null ? 1 : o.dotA;
      if (o.dot && dA > 0.02) M3.withA(c, dA, () => {
        const px = X(o.dot.F), py = Y(o.dot.f);
        if (o.guides !== false) {
          c.save(); c.setLineDash([5, 6]); c.lineWidth = 2;
          c.strokeStyle = W5.rgba(M3.FC.push, 0.75); c.beginPath(); c.moveTo(px, py); c.lineTo(px, oy); c.stroke();
          c.strokeStyle = W5.rgba(FRc, 0.75); c.beginPath(); c.moveTo(px, py); c.lineTo(ox, py); c.stroke();
          c.restore();
        }
        W5.glow(c, px, py, 26 + 10 * (o.pulse || 0), COL.red, 0.45 + 0.3 * (o.pulse || 0));
        c.save(); c.fillStyle = COL.red; c.strokeStyle = '#fff3f0'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(px, py, 8.5, 0, TAU); c.fill(); c.stroke(); c.restore();
        if (o.dotLabel) M3.T(c, 1, o.dotLabel, px + 18, py + 4, COL.white, size, 'left', true);
      });
    });
    return res;
  };
  /* 沿 f–F 折線（斜線 0→peak、掉到 kin、水平到 max）走 t（0..1，按長度均分）的位置 {F,f}。o：{ max, peak, kin }（同 fFGraph） */
  M3.fFPoint = function (t, o) {
    o = o || {}; const max = o.max || 100, peak = o.peak == null ? 60 : o.peak, kin = o.kin == null ? 40 : o.kin;
    const l1 = peak * Math.SQRT2, l2 = peak - kin, l3 = max - peak, d = clamp01(t) * (l1 + l2 + l3);
    if (d <= l1) { const F = d / Math.SQRT2; return { F, f: F }; }
    if (d <= l1 + l2) return { F: peak, f: peak - (d - l1) };
    return { F: peak + (d - l1 - l2), f: kin };
  };
  /* ═══════════ 第五支動畫（surface）新增：水平拉木塊的實驗場景（area、normal 沿用） ═══════════
     場景：側視，桌子上鋪一張「桌面材質板」（塑膠／木板／砂紙…），木塊放在上面（可疊砝碼），
           右邊用彈簧秤水平往右拉，March（tug 拉繩姿勢、鏡像成往右拉）抓著拉環；
           讀數從 0 升到峰值（＝最大靜摩擦力）→ 木塊滑動、讀數掉下來 → 峰值保留一個標籤。
     時間：只吃一個進度 t（0..1），整段拉動的節奏都在 M3.pullState 裡：
           0～0.04 靜止 → 0.04～0.52 讀數上升 → 0.52～0.60 停在峰值（木塊微微顫）→ 0.60 滑動，讀數掉到 kin
           （預設 0.72×峰值，畫面上不寫這個數字）→ 0.60～1 木塊往右滑 slide px。
     預設版面（sc＝1、x＝y＝0）：地面線 455、接觸面 top 340、桌子 x 40～540、木塊中線 200（寬 180、高 78）、
           彈簧秤高度＝木塊半高、拉環最遠約 x 600；讀數曲線小圖 panel x 24～380、y 40～232；
           右上角 760～940 留給各支自己的東西（surface 放材質放大鏡）。底部 y ≥ 470 留給角落標籤／結論。

     M3.pullState(t, o) → { r 讀數 gw, dx 木塊位移 px, shake 顫動 px, slipped 是否已滑動, atPeak 0..1（到峰值後漸亮）, kin }
       o：{ peak, kin, slide(36) }
     M3.PULL：上面這些時間點與預設版面（常數；要改版面就傳參數，不要改這裡）

     M3.pullScene(c, o)：畫整個場景（不畫背景與地面線，請先 M3.backdrop／M3.ground）。o（括號內是預設）：
       進度     t(0) 0..1；peak 峰值 gw（必填）；kin 滑動後讀數（peak×0.72）；slide 滑動距離(36)；shift 額外整體右移 px（換材質時把木塊拉回原位用）
       桌面     mat 材質板（'wood'，M3.MAT 的名稱）；matPrev＋swap 0..1：舊材質淡出、新材質淡入；tableMat 桌子本體('darkwood')；
                sheet 材質板厚度(8)
       木塊     block { w(180), h(78) }；blockCx(200)；contact 底面接觸面強調 0..1、contactCol（預設黃）；
                drawBlock(c, cx, by, w, h, st) 自訂木塊畫法（例：area 的三種擺法；不給就用 M3.block）
       砝碼     masses 疊幾顆(0)；massIn 0..1 最上面那一顆從上方落下的進度（1＝已放好）
       彈簧秤   max 刻度上限(120)；len0 讀數 0 時掛鉤到拉環的長度(230)；ext 每 gw 伸長 px(0.35)
       人物     puller(true) 畫 March；
       文字     labels(true)：彈簧秤上方的讀數 pill（滑動前＝即時讀數白字、滑動後＝「峰值 40 gw」珊瑚色）；
                peakHold(true)：秤殼上的峰值記號（珊瑚色小三角，停在峰值）
       位置大小 x, y(0)、sc(1)：整個場景以 (0,0) 為原點平移、縮放（例：做成小縮圖時 sc 0.4、labels:false）
       透明度   a(1)
       曲線圖   graph：false＝不畫；或 M3.pullGraph 的參數（panel 位置、ghosts…，t／peak／kin 會自動帶入）；預設 {} 畫在左上
     回傳 { st 狀態, top 接觸面 y, block {x0,y0,x1,y1,cx,by}, massTop 砝碼頂 y, hook, ring {x,y}, read 讀數 pill 外框, graph }
       （座標都已換成畫布座標，可拿來在木塊上畫重力／正向力箭頭、加自己的標籤）
     例（surface 第 1 步）：M3.pullScene(c, { t, peak: 40, mat: 'plastic', graph: { ghosts: [] } });
     例（normal 第 2 步）：M3.pullScene(c, { t, peak: 87.5, mat: 'wood', masses: 1, massIn: e });

     M3.pullGraph(c, o)：讀數–時間小圖（青色曲線，到峰值打珊瑚點＋「峰值 40 gw」標籤）。o：
       panel {x0,y0,x1,y1}（預設 M3.PULL.graph）；t, peak, kin；max(120)；ticks([40,80,120])；
       ghosts [{ peak, kin, a(0.35) }]：前幾次的曲線（淡、虛線、峰值處小點，方便比較）；a；title(true)
     回傳 { X(t), Y(r), panel } */
  M3.PULL = {
    T0: 0.04, TPEAK: 0.52, TSLIP: 0.60, TDROP: 0.66,
    GY: 455, top: 340, table: { x0: 40, x1: 540 }, blockCx: 200, block: { w: 180, h: 78 },
    len0: 230, ext: 0.35, slide: 36, max: 120,
    graph: { x0: 24, y0: 40, x1: 380, y1: 232 }
  };
  M3.pullState = function (t, o) {
    o = o || {}; const P = M3.PULL, peak = o.peak || 0, kin = o.kin == null ? peak * 0.72 : o.kin, slide = o.slide == null ? P.slide : o.slide;
    t = clamp01(t || 0);
    let r = 0, dx = 0, shake = 0;
    if (t < P.TPEAK) r = peak * ease(clamp01((t - P.T0) / (P.TPEAK - P.T0)));
    else if (t < P.TSLIP) r = peak;
    else {
      const q = ease(clamp01((t - P.TSLIP) / (P.TDROP - P.TSLIP)));
      r = lerp(peak, kin, q) + peak * 0.025 * Math.sin((t - P.TSLIP) * 70) * q;
      const d = clamp01((t - P.TSLIP) / (1 - P.TSLIP));
      dx = slide * (0.18 * ease(clamp01((t - P.TSLIP) / 0.04)) + 0.82 * d);
    }
    if (t > P.TPEAK - 0.06 && t < P.TSLIP) shake = 1.6 * clamp01((t - P.TPEAK + 0.06) / 0.06);
    return { r, dx, shake, slipped: t >= P.TSLIP, atPeak: clamp01((t - P.TPEAK + 0.02) / 0.04), kin, t };
  };
  M3.pullGraph = function (c, o) {
    o = o || {}; const P = M3.PULL, pn = o.panel || P.graph, a = o.a == null ? 1 : o.a, max = o.max || P.max;
    const ox = pn.x0 + 50, oy = pn.y1 - 44, w = pn.x1 - pn.x0 - 72, h = oy - pn.y0 - 46;
    const X = t => ox + clamp01(t) * w, Y = r => oy - r / max * h;
    const res = { X, Y, panel: pn };
    if (a <= 0.02) return res;
    const curve = (peak, kin, t1) => {
      const pts = [], n = 120;
      for (let i = 0; i <= n; i++) { const t = t1 * i / n; pts.push([X(t), Y(M3.pullState(t, { peak, kin }).r)]); }
      return pts;
    };
    const stroke = (pts, col, lw, dash) => {
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; if (dash) c.setLineDash(dash);
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 4; c.stroke();
      c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = W5.rgba(col, 0.7); c.shadowBlur = 8; c.stroke(); c.restore();
    };
    M3.withA(c, a, () => {
      c.save(); c.fillStyle = 'rgba(23,51,42,0.94)'; W5.rr(c, pn.x0, pn.y0, pn.x1 - pn.x0, pn.y1 - pn.y0, 14); c.fill();
      c.strokeStyle = 'rgba(246,243,234,0.22)'; c.lineWidth = 2; W5.rr(c, pn.x0, pn.y0, pn.x1 - pn.x0, pn.y1 - pn.y0, 14); c.stroke(); c.restore();
      const ticks = o.ticks || [40, 80, 120];
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.09)'; c.lineWidth = 1.2;
      ticks.forEach(v => { c.beginPath(); c.moveTo(ox, Y(v)); c.lineTo(ox + w, Y(v)); c.stroke(); }); c.restore();
      ticks.forEach(v => M3.T(c, 1, String(v), ox - 8, Y(v), COL.dim, 18, 'right', true));
      W5.arrow(c, ox, oy, ox + w + 14, oy, COL.white, 2.5, 10);
      W5.arrow(c, ox, oy, ox, pn.y0 + 30, COL.white, 2.5, 10);
      if (o.title !== false) {
        M3.T(c, 1, M3.L('彈簧秤讀數（gw）', 'Scale reading (gw)'), pn.x0 + 16, pn.y1 - 20, M3.FC.push, 20, 'left');
        M3.T(c, 1, M3.L('時間 →', 'Time →'), pn.x1 - 16, pn.y1 - 20, COL.dim, 18, 'right');
      }
      (o.ghosts || []).forEach(g => M3.withA(c, g.a == null ? 0.35 : g.a, () => {
        stroke(curve(g.peak, g.kin, 1), COL.white, 2.5, [7, 6]);
        c.fillStyle = COL.white; c.beginPath(); c.arc(X(P.TPEAK), Y(g.peak), 4.5, 0, TAU); c.fill();
      }));
      const t = clamp01(o.t || 0), peak = o.peak || 0;
      if (t > 0.002) {
        stroke(curve(peak, o.kin, t), M3.FC.push, 4);
        const st = M3.pullState(t, o);
        const pk = st.atPeak;
        if (pk > 0.02) M3.withA(c, pk, () => {
          W5.glow(c, X(P.TPEAK), Y(peak), 22, M3.FC.friction, 0.5);
          c.fillStyle = M3.FC.friction; c.strokeStyle = '#fff3ec'; c.lineWidth = 2;
          c.beginPath(); c.arc(X(P.TPEAK), Y(peak), 7, 0, TAU); c.fill(); c.stroke();
        });
        M3.P(c, pk, M3.L('峰值 ', 'Peak ') + peak + ' gw', X(P.TPEAK), Y(peak) - 28, M3.FC.friction, 20, 'center', true);
        /* 曲線前端的小點 */
        if (t < 1) { c.save(); c.fillStyle = COL.white; c.beginPath(); c.arc(X(t), Y(st.r), 4.5, 0, TAU); c.fill(); c.restore(); }
      }
    });
    return res;
  };
  M3.preload(['tug']);
  M3.pullScene = function (c, o) {
    const P = M3.PULL, a = o.a == null ? 1 : o.a, sc = o.sc || 1, ox = o.x || 0, oy = o.y || 0;
    const TX = x => ox + x * sc, TY = y => oy + y * sc;
    const st = M3.pullState(o.t, o);
    const top = P.top, GY = P.GY, sheet = o.sheet == null ? 8 : o.sheet;
    const bw = (o.block && o.block.w) || P.block.w, bh = (o.block && o.block.h) || P.block.h;
    const cx = (o.blockCx == null ? P.blockCx : o.blockCx) + st.dx + (o.shift || 0) + M3.shake((o.t || 0) * 11, st.shake, 40, 2.1);
    const max = o.max || P.max, len0 = o.len0 || P.len0, ext = o.ext == null ? P.ext : o.ext;
    const sy = top - bh / 2, hx0 = cx + bw / 2, hx1 = hx0 + len0 + st.r * ext;
    const res = { st, top: TY(top), block: { x0: TX(cx - bw / 2), y0: TY(top - bh), x1: TX(cx + bw / 2), y1: TY(top), cx: TX(cx), by: TY(top) },
                  massTop: TY(top - bh), hook: { x: TX(hx0), y: TY(sy) }, ring: { x: TX(hx1), y: TY(sy) }, read: null, graph: null };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save(); c.translate(ox, oy); c.scale(sc, sc);
      /* 桌子＋材質板 */
      M3.table(c, P.table.x0, P.table.x1, top + sheet, GY, { mat: o.tableMat || 'darkwood', seed: 13 });
      const sx0 = P.table.x0 + 10, sx1 = P.table.x1 - 10, sw = o.swap == null ? 1 : clamp01(o.swap);
      if (o.matPrev && sw < 1) M3.slab(c, sx0, top, sx1, top + sheet, o.matPrev, { a: 1 - sw, seed: 5, r: 2 });
      M3.slab(c, sx0, top, sx1, top + sheet, o.mat || 'wood', { a: o.matPrev ? sw : 1, seed: 5, r: 2 });
      /* 滑動：速度線、滑動瞬間的閃光 */
      if (st.slipped) {
        const q = clamp01((st.t - P.TSLIP) / 0.05);
        M3.speedLines(c, cx - bw / 2 - 8, top - bh / 2, bh * 0.8, 40, q, -1);
        M3.flash(c, cx + bw / 2 - 6, top - 2, 16, COL.yellow, 1 - clamp01((st.t - P.TSLIP - 0.02) / 0.08), 0.3);
      }
      /* 木塊＋砝碼 */
      if (o.drawBlock) o.drawBlock(c, cx, top, bw, bh, st);
      else M3.block(c, cx, top, bw, bh, { seed: 9, contact: o.contact || 0, contactCol: o.contactCol });
      let mt = top - bh; const nm = o.masses || 0;
      for (let i = 0; i < nm; i++) {
        const last = i === nm - 1, e = last ? (o.massIn == null ? 1 : clamp01(o.massIn)) : 1;
        const drop = (1 - ease(Math.min(1, e * 1.15))) * 120;
        const by = mt - drop;
        const nt = M3.mass(c, cx, by, { a: Math.min(1, e * 3) });
        if (e >= 1 || !last) mt = nt;
      }
      res.massTop = TY(mt);
      /* 彈簧秤 */
      M3.springScale(c, { x0: hx0, x1: hx1, y: sy, val: st.r, max, read: false });
      /* 峰值記號（秤殼上緣的珊瑚色小三角，停在峰值） */
      if (o.peakHold !== false && st.atPeak > 0.02) {
        const xc0 = hx1 - 22 - 150, px = xc0 + 12 + 126 * clamp01((o.peak || 0) / max);
        M3.withA(c, st.atPeak, () => {
          c.fillStyle = M3.FC.friction; c.strokeStyle = M3.INK; c.lineWidth = 2;
          c.beginPath(); c.moveTo(px, sy - 16); c.lineTo(px - 7, sy - 27); c.lineTo(px + 7, sy - 27); c.closePath(); c.fill(); c.stroke();
        });
      }
      /* March 抓拉環往右拉 */
      if (o.puller !== false) {
        const M = M3.MARCH.tug, msc = (GY - sy) / (M.sole - M.hand[1]);
        M3.march(c, 'tug', hx1 + (M.hand[0] - M.cx) * msc, GY, { sc: msc, flip: true });
      }
      c.restore();
      /* 讀數 pill（畫布座標、字級不縮放） */
      if (o.labels !== false) {
        const rx = TX(hx1 - 22 - 75), ry = TY(sy) - 48;
        if (!st.slipped) res.read = M3.P(c, 1, Math.round(st.r) + ' gw', rx, ry, COL.white, 22, 'center', true);
        else res.read = M3.P(c, 1, M3.L('峰值 ', 'Peak ') + o.peak + ' gw', rx, ry, M3.FC.friction, 22, 'center', true);
      }
    });
    if (o.graph !== false) {
      const g = Object.assign({}, o.graph || {}, { t: o.t, peak: o.peak, kin: o.kin, max, a: a * (o.graph && o.graph.a != null ? o.graph.a : 1) });
      res.graph = M3.pullGraph(c, g);
    }
    return res;
  };

  /* ═══════════ 第八支動畫（more）新增：腳踏車零件（less 沿用） ═══════════ */
  /* 腳踏車輪（側視）：cx,cy 輪軸、r 輪胎外半徑。o：{ ang 轉角(rad，順時針為正), tread 'road'(預設)|'smooth'(光滑反光)|'knobby'(深胎紋，塊狀凸出 r 外),
       tyreW 胎厚(r×0.11), spokes 輻條數(18), blur 動態模糊 0..1（轉很快時）, a }
     回傳 { tyreIn 胎內緣半徑, rimOut 輪圈外緣（＝tyreIn）, rimIn 輪圈內緣, knob 胎紋凸出量 }；輪圈外緣到內緣之間＝煞車面 */
  M3.bikeWheel = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, ang = o.ang || 0, tw = o.tyreW || r * 0.11, rw = Math.max(5, r * 0.075);
    const tread = o.tread || 'road', blur = clamp01(o.blur || 0), NS = o.spokes || 18;
    const tyreIn = r - tw, rimIn = tyreIn - rw, knob = tread === 'knobby' ? tw * 0.42 : 0;
    const res = { tyreIn, rimOut: tyreIn, rimIn, knob };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save();
      /* 輻條（轉快時多畫幾份錯開的淡影＝模糊） */
      const hubR = Math.max(5, r * 0.08), copies = blur > 0.05 ? 5 : 1;
      if (blur > 0.05) { c.fillStyle = 'rgba(223,230,234,' + (0.10 * blur).toFixed(3) + ')'; c.beginPath(); c.arc(cx, cy, rimIn, 0, TAU); c.fill(); }
      c.lineCap = 'round';
      for (let k = 0; k < copies; k++) {
        const da = copies > 1 ? (k - 2) * 0.07 * blur : 0;
        c.strokeStyle = copies > 1 ? 'rgba(223,230,234,' + (0.55 * (1 - blur * 0.6)).toFixed(3) + ')' : '#dfe6ea';
        c.lineWidth = Math.max(1.4, r * 0.012);
        for (let i = 0; i < NS; i++) {
          const q = ang + da + i * TAU / NS, side = i % 2 ? 1 : -1, q0 = q + side * 0.35;
          c.beginPath(); c.moveTo(cx + Math.cos(q0) * hubR * 0.9, cy + Math.sin(q0) * hubR * 0.9);
          c.lineTo(cx + Math.cos(q) * (rimIn + 1), cy + Math.sin(q) * (rimIn + 1)); c.stroke();
        }
      }
      /* 花鼓 */
      const hg = c.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 1, cx, cy, hubR * 1.4);
      hg.addColorStop(0, '#f4f7f8'); hg.addColorStop(1, '#6d7b83');
      c.fillStyle = hg; c.beginPath(); c.arc(cx, cy, hubR * 1.3, 0, TAU); c.fill();
      c.fillStyle = '#39444b'; c.beginPath(); c.arc(cx, cy, hubR * 0.45, 0, TAU); c.fill();
      /* 輪圈（銀色，外緣亮、內緣暗） */
      c.strokeStyle = '#aab6bd'; c.lineWidth = rw; c.beginPath(); c.arc(cx, cy, tyreIn - rw / 2, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, tyreIn - 1.5, 0, TAU); c.stroke();
      c.strokeStyle = '#5b6870'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, rimIn + 0.8, 0, TAU); c.stroke();
      /* 輪胎 */
      const tg = c.createRadialGradient(cx, cy, tyreIn, cx, cy, r);
      tg.addColorStop(0, '#1f2228'); tg.addColorStop(0.55, '#3a3f49'); tg.addColorStop(1, '#262a31');
      c.strokeStyle = tg; c.lineWidth = tw; c.beginPath(); c.arc(cx, cy, r - tw / 2, 0, TAU); c.stroke();
      if (tread === 'knobby') {
        /* 深胎紋：一圈塊狀凸起＋胎面上的橫溝 */
        const N = Math.max(16, Math.round(TAU * r / (tw * 1.25))), bw = TAU / N * 0.55;
        c.fillStyle = '#30343d'; c.strokeStyle = '#151820'; c.lineWidth = 1.5;
        for (let i = 0; i < N; i++) {
          const q = ang + i * TAU / N, r0 = r - tw * 0.35, r1 = r + knob;
          c.beginPath();
          c.moveTo(cx + Math.cos(q - bw / 2) * r0, cy + Math.sin(q - bw / 2) * r0);
          c.lineTo(cx + Math.cos(q - bw * 0.42) * r1, cy + Math.sin(q - bw * 0.42) * r1);
          c.lineTo(cx + Math.cos(q + bw * 0.42) * r1, cy + Math.sin(q + bw * 0.42) * r1);
          c.lineTo(cx + Math.cos(q + bw / 2) * r0, cy + Math.sin(q + bw / 2) * r0);
          c.closePath(); c.fill(); c.stroke();
        }
        c.strokeStyle = 'rgba(12,14,18,0.9)'; c.lineWidth = Math.max(2, tw * 0.14);
        for (let i = 0; i < N; i++) {
          const q = ang + (i + 0.5) * TAU / N;
          c.beginPath(); c.moveTo(cx + Math.cos(q) * (r - tw * 0.75), cy + Math.sin(q) * (r - tw * 0.75)); c.lineTo(cx + Math.cos(q) * (r - 1), cy + Math.sin(q) * (r - 1)); c.stroke();
        }
      } else if (tread === 'road') {
        c.strokeStyle = 'rgba(12,14,18,0.7)'; c.lineWidth = 1.6;
        const N = Math.round(TAU * r / 9);
        for (let i = 0; i < N; i++) {
          const q = ang + i * TAU / N;
          c.beginPath(); c.moveTo(cx + Math.cos(q) * (r - tw * 0.3), cy + Math.sin(q) * (r - tw * 0.3)); c.lineTo(cx + Math.cos(q) * (r - 1), cy + Math.sin(q) * (r - 1)); c.stroke();
        }
      } else {
        /* 光滑胎：胎面一圈反光（不跟著轉） */
        c.strokeStyle = 'rgba(255,255,255,0.32)'; c.lineWidth = Math.max(2, tw * 0.16);
        c.beginPath(); c.arc(cx, cy, r - tw * 0.28, -2.5, -1.2); c.stroke();
        c.beginPath(); c.arc(cx, cy, r - tw * 0.28, 0.5, 1.0); c.stroke();
      }
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      /* 氣嘴（看得出輪子在轉） */
      const qv = ang + 0.2, rv = tyreIn - rw;
      c.save(); c.translate(cx + Math.cos(qv) * rv, cy + Math.sin(qv) * rv); c.rotate(qv);
      c.fillStyle = '#c9a227'; c.fillRect(-Math.max(6, r * 0.06), -2.5, Math.max(6, r * 0.06), 5); c.restore();
      c.restore();
    });
    return res;
  };
  /* 前叉（側視，畫在輪子前面）：cx,cy 輪軸、r 輪胎外半徑。o：{ a, col 烤漆色('#3f5f7a'), up 豎管往上伸多長(r×0.3) }
     回傳 { crownX, crownY } 前叉肩（夾器鎖在這裡） */
  M3.bikeFork = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || '#3f5f7a';
    const crownX = cx - r * 0.1, crownY = cy - r - r * 0.17, up = o.up == null ? r * 0.3 : o.up;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round';
      const lw = Math.max(6, r * 0.065);
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 4;
      c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + r * 0.08, cy - r * 0.55, crownX, crownY); c.lineTo(crownX - r * 0.03, crownY - up); c.stroke();
      c.strokeStyle = col; c.lineWidth = lw;
      c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + r * 0.08, cy - r * 0.55, crownX, crownY); c.lineTo(crownX - r * 0.03, crownY - up); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = Math.max(1.5, lw * 0.25);
      c.beginPath(); c.moveTo(cx - lw * 0.2, cy - r * 0.1); c.quadraticCurveTo(cx + r * 0.06, cy - r * 0.55, crownX - lw * 0.25, crownY); c.stroke();
      /* 前叉肩 */
      c.fillStyle = col; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2;
      W5.rr(c, crownX - r * 0.13, crownY - lw * 0.7, r * 0.26, lw * 1.4, lw * 0.5); c.fill(); c.stroke();
      /* 勾爪＋軸 */
      c.fillStyle = '#8e9aa2'; c.beginPath(); c.arc(cx, cy, Math.max(4, r * 0.035), 0, TAU); c.fill();
      c.restore();
    });
    return { crownX, crownY };
  };
  /* 輪圈煞車（側拉式夾器，側視，夾在輪子正上方）：cx,cy,r 與 M3.bikeWheel 相同（tyreW 也要一樣）。
     o：{ squeeze 夾緊 0..1（後面那片煞車皮從錯開滑到重合、夾器臂變亮）, tyreW, a }
     回傳 { x, y 煞車皮中心（＝摩擦力作用點，切線方向水平）, x0, x1 煞車皮左右端, top 煞車皮上緣 } */
  M3.rimBrake = function (c, cx, cy, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, sq = clamp01(o.squeeze || 0);
    const tw = o.tyreW || r * 0.11, rw = Math.max(5, r * 0.075), rp = r - tw - rw / 2;
    const pl = r * 0.34, pt = Math.max(10, rw * 1.5), px = cx, py = cy - rp;
    const res = { x: px, y: py, x0: px - pl / 2, x1: px + pl / 2, top: py - pt / 2 };
    if (a <= 0.02) return res;
    const bx = cx - r * 0.1, by = cy - r - r * 0.17;
    const pad = (dx, dy, back) => {
      c.save(); c.translate(px + dx, py + dy);
      c.fillStyle = back ? '#1b1e24' : '#2c3038'; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2;
      W5.rr(c, -pl / 2, -pt / 2, pl, pt, 3); c.fill(); c.stroke();
      if (!back) {
        c.strokeStyle = 'rgba(160,170,185,0.55)'; c.lineWidth = 2;               /* 煞車皮上的溝紋 */
        for (let i = 1; i < 6; i++) { const x = -pl / 2 + pl * i / 6; c.beginPath(); c.moveTo(x, -pt / 2 + 2); c.lineTo(x, pt / 2 - 2); c.stroke(); }
        c.fillStyle = '#9aa6ad'; W5.rr(c, -pl * 0.3, -pt / 2 - 6, pl * 0.6, 6, 2); c.fill();     /* 煞車皮座 */
      }
      c.restore();
    };
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      /* 後片（錯開＝還沒夾，重合＝夾緊） */
      pad(10 * (1 - sq), -7 * (1 - sq), true);
      /* 夾器臂：從前叉肩的螺栓繞過輪胎上方，下到煞車皮 */
      const armCol = W5.mix('#8f9ba3', '#dfe7ec', sq);
      [[-1, 0], [1, 0]].forEach(([sd]) => {
        c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9;
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(px + sd * pl * 0.75, by - 4, px + sd * pl * 0.32, py - pt / 2 - 4); c.stroke();
        c.strokeStyle = armCol; c.lineWidth = 5;
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(px + sd * pl * 0.75, by - 4, px + sd * pl * 0.32, py - pt / 2 - 4); c.stroke();
      });
      c.fillStyle = '#5d6a70'; c.beginPath(); c.arc(bx, by, 6, 0, TAU); c.fill();
      c.fillStyle = '#dfe7ec'; c.beginPath(); c.arc(bx, by, 2.5, 0, TAU); c.fill();
      pad(0, 0, false);
      c.restore();
    });
    return res;
  };
  /* ═══════════ 第九支動畫（less）新增：腳踏車鏈條＋齒盤 ═══════════ */
  /* 鏈條幾何（同一組參數只算一次）：A、B 兩齒盤的節圓半徑＝齒數×節距／2π；微調中心距讓鏈條剛好是偶數節 */
  const CHAIN_G = {};
  function chainGeom(x, y, dir, dist, nA, nB, p) {
    const key = [x, y, dir, dist, nA, nB, p].join(',');
    if (CHAIN_G[key]) return CHAIN_G[key];
    const rA = nA * p / TAU, rB = nB * p / TAU, ux = Math.cos(dir), uy = Math.sin(dir), nx = uy, ny = -ux;
    const lenOf = D => { const sb = (rA - rB) / D, b = Math.asin(sb); return 2 * D * Math.cos(b) + rB * (Math.PI - 2 * b) + rA * (Math.PI + 2 * b); };
    const M = Math.max(4, 2 * Math.round(lenOf(dist) / p / 2)), Lt = M * p;
    let D = dist;
    for (let i = 0; i < 8; i++) { const b = Math.asin((rA - rB) / D); D += (Lt - lenOf(D)) / (2 * Math.cos(b)); }
    const sb = (rA - rB) / D, cb = Math.sqrt(1 - sb * sb), b = Math.asin(sb);
    const A = { x, y, r: rA, n: nA }, B = { x: x + ux * D, y: y + uy * D, r: rB, n: nB };
    const mT = { x: nx * cb + ux * sb, y: ny * cb + uy * sb }, mB = { x: -nx * cb + ux * sb, y: -ny * cb + uy * sb };
    const thT = Math.atan2(mT.y, mT.x), thB = Math.atan2(mB.y, mB.x);
    const run = D * cb, s1 = run, s2 = s1 + rB * (Math.PI - 2 * b), s3 = s2 + run;
    const PAt = { x: A.x + rA * mT.x, y: A.y + rA * mT.y }, PBt = { x: B.x + rB * mT.x, y: B.y + rB * mT.y };
    const PBb = { x: B.x + rB * mB.x, y: B.y + rB * mB.y }, PAb = { x: A.x + rA * mB.x, y: A.y + rA * mB.y };
    const at = s => {
      s = ((s % Lt) + Lt) % Lt;
      if (s < s1) { const f = s / run; return { x: lerp(PAt.x, PBt.x, f), y: lerp(PAt.y, PBt.y, f), ang: dir }; }
      if (s < s2) { const q = thT + (s - s1) / rB; return { x: B.x + rB * Math.cos(q), y: B.y + rB * Math.sin(q), ang: q + Math.PI / 2 }; }
      if (s < s3) { const f = (s - s2) / run; return { x: lerp(PBb.x, PAb.x, f), y: lerp(PBb.y, PAb.y, f), ang: dir + Math.PI }; }
      const q = thB + (s - s3) / rA; return { x: A.x + rA * Math.cos(q), y: A.y + rA * Math.sin(q), ang: q + Math.PI / 2 };
    };
    /* 齒谷相位：滾子剛好坐在齒谷裡（B 從上方切點起算、A 從下方切點起算） */
    const g = { A, B, L: Lt, M, p, at, top: { x0: PAt.x, y0: PAt.y, x1: PBt.x, y1: PBt.y }, offB: thT - s1 / rB, offA: thB - s3 / rA };
    CHAIN_G[key] = g; return g;
  }
  /* 齒盤（側視）：r 節圓、n 齒、off 第一個齒谷的角度；big＝大齒盤（五爪鏤空），否則小飛輪 */
  function sprocket(c, cx, cy, r, n, p, off, big, rust, spin) {
    const step = TAU / n, rv = r - p * 0.3, rt = r + p * 0.42;
    const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, rt);
    g.addColorStop(0, W5.mix('#eef3f5', '#c9a07a', rust * 0.5)); g.addColorStop(1, W5.mix('#7f8d95', '#6a4630', rust * 0.6));
    c.save(); c.fillStyle = g; c.strokeStyle = 'rgba(11,26,21,0.9)'; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath();
    for (let j = 0; j < n; j++) {
      const v = off + j * step, P = (q, rr) => c.lineTo(cx + Math.cos(q) * rr, cy + Math.sin(q) * rr);
      P(v - step * 0.16, rv); P(v + step * 0.16, rv); P(v + step * 0.36, rt * 0.97); P(v + step * 0.5, rt); P(v + step * 0.64, rt * 0.97);
    }
    c.closePath(); c.fill(); c.stroke();
    if (big) {
      /* 五爪鏤空＋齒盤螺絲 */
      c.fillStyle = '#0f241d';
      for (let i = 0; i < 5; i++) {
        const a0 = spin + i * TAU / 5 + 0.22, a1 = spin + (i + 1) * TAU / 5 - 0.22;
        c.beginPath(); c.arc(cx, cy, r * 0.74, a0, a1); c.arc(cx, cy, r * 0.34, a1 - 0.12, a0 + 0.12, true); c.closePath(); c.fill();
      }
      c.fillStyle = '#dfe6ea';
      for (let i = 0; i < 5; i++) { const q = spin + i * TAU / 5; c.beginPath(); c.arc(cx + Math.cos(q) * r * 0.8, cy + Math.sin(q) * r * 0.8, Math.max(2.5, r * 0.035), 0, TAU); c.fill(); }
    } else {
      c.fillStyle = 'rgba(15,36,29,0.85)'; c.beginPath(); c.arc(cx, cy, r * 0.62, 0, TAU); c.fill();
      c.fillStyle = W5.mix('#aab6bd', '#7a5236', rust * 0.5); c.beginPath(); c.arc(cx, cy, r * 0.5, 0, TAU); c.fill();
    }
    /* 花鼓／中軸 */
    c.fillStyle = '#5d6a70'; c.beginPath(); c.arc(cx, cy, Math.max(6, r * (big ? 0.2 : 0.3)), 0, TAU); c.fill();
    c.fillStyle = '#dfe7ec'; c.beginPath(); c.arc(cx, cy, Math.max(3, r * (big ? 0.08 : 0.12)), 0, TAU); c.fill();
    c.restore();
  }
  /* 腳踏車鏈條（側視）：A 齒盤在 (o.x,o.y)，B 齒盤在 dir 方向約 dist 遠（會微調成整數節）；鏈條順時針走（上段 A→B）。
     o：{ x, y, dir 方向(rad，0＝B 在 A 右邊), dist 約略中心距(300), nA, nB 齒數(14, 36), pitch 節距 px(16),
          phase 鏈條走了多遠(px，越大＝順時針轉越多；齒盤跟著轉), rust 乾鏽 0..1, oil 上油亮面 0..1, sprockets 畫齒盤(true), a }
     回傳 { A:{x,y,r,n,rot}, B:{...}, L 鏈長, pitch, top:{x0,y0,x1,y1} 上段, at(s) 鏈條路徑上 s 處 {x,y,ang} } */
  M3.bikeChain = function (c, o) {
    o = o || {};
    const p = o.pitch || 16, G = chainGeom(o.x, o.y, o.dir || 0, o.dist || 300, o.nA || 14, o.nB || 36, p);
    const ph = o.phase || 0, rust = clamp01(o.rust || 0), oil = clamp01(o.oil || 0), a = o.a == null ? 1 : o.a;
    const A = Object.assign({}, G.A, { rot: ph / G.A.r }), B = Object.assign({}, G.B, { rot: ph / G.B.r });
    const res = { A, B, L: G.L, pitch: p, top: G.top, at: G.at };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      if (o.sprockets !== false) {
        sprocket(c, B.x, B.y, B.r, B.n, p, G.offB + B.rot, B.r >= A.r, rust, B.rot);
        sprocket(c, A.x, A.y, A.r, A.n, p, G.offA + A.rot, A.r > B.r, rust, A.rot);
      }
      const pins = [];
      for (let k = 0; k < G.M; k++) pins.push(G.at(k * p + ph));
      const outer = W5.mix(W5.mix('#a7b3ba', '#8a4b26', rust * 0.75), '#c8b27a', oil * 0.25);
      const inner = W5.mix(W5.mix('#5f6a71', '#5b3018', rust * 0.75), '#6e5a2c', oil * 0.3);
      c.save(); c.lineCap = 'round';
      const link = (k, lw, col) => { const P0 = pins[k], P1 = pins[(k + 1) % G.M]; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(P0.x, P0.y); c.lineTo(P1.x, P1.y); c.stroke(); };
      /* 內鏈片（偶數節） */
      for (let k = 0; k < G.M; k += 2) { link(k, p * 0.66, 'rgba(11,26,21,0.9)'); link(k, p * 0.5, inner); }
      /* 滾子 */
      c.fillStyle = W5.mix('#8f9ba3', '#6d3b1d', rust * 0.7);
      pins.forEach(P => { c.beginPath(); c.arc(P.x, P.y, p * 0.3, 0, TAU); c.fill(); });
      /* 外鏈片（奇數節） */
      for (let k = 1; k < G.M; k += 2) { link(k, p * 0.74, 'rgba(11,26,21,0.9)'); link(k, p * 0.58, outer); }
      /* 上油：外鏈片上一道亮油光 */
      if (oil > 0.02) {
        c.strokeStyle = 'rgba(255,226,150,' + (0.75 * oil).toFixed(3) + ')'; c.lineWidth = Math.max(1.5, p * 0.13);
        for (let k = 1; k < G.M; k += 2) {
          const P0 = pins[k], P1 = pins[(k + 1) % G.M], dx = P1.x - P0.x, dy = P1.y - P0.y, m = Math.hypot(dx, dy) || 1, ox = dy / m * p * 0.14, oy = -dx / m * p * 0.14;
          c.beginPath(); c.moveTo(P0.x + dx * 0.2 + ox, P0.y + dy * 0.2 + oy); c.lineTo(P0.x + dx * 0.8 + ox, P0.y + dy * 0.8 + oy); c.stroke();
        }
      }
      /* 鉚釘頭 */
      c.fillStyle = W5.mix('#e6edf1', '#b07a52', rust * 0.6);
      pins.forEach(P => { c.beginPath(); c.arc(P.x, P.y, p * 0.15, 0, TAU); c.fill(); });
      c.restore();
    });
    return res;
  };
  /* ═══════════ 資優題（fridge）新增：受力圖元件（ab、wall 也可用） ═══════════
     M3.fbdBox   受力圖裡的物體（白框小冰箱或木塊，中心可畫作用點）
     M3.forceInto「推進去」的力：箭頭尖端貼在物體表面（o.x,o.y＝箭頭尖端），其餘參數同 M3.force
     M3.forceQ   未知的力：虛線箭頭＋問號標籤（長度不代表數值）
     M3.segArrow 分段箭頭：好幾段首尾相接（例 50＋350），每段自己的顏色，段與段之間有分隔刻痕
     M3.brace    大括號（標總和、比例）
     M3.eqRow    一列等式：好幾個彩色字塊依序出現（show 0..n） */

  /* 受力圖的物體：cx,cy 中心、w,h 大小。o：{ kind 'fridge'|'block', a, dot 中心點(false), label 物體中間的字, col 邊框色, glow } → {x0,y0,x1,y1,cx,cy} */
  M3.fbdBox = function (c, cx, cy, w, h, o) {
    o = o || {}; const x0 = cx - w / 2, y0 = cy - h / 2, a = o.a == null ? 1 : o.a;
    const res = { x0, y0, x1: x0 + w, y1: y0 + h, cx, cy };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      if (o.glow) W5.glow(c, cx, cy, Math.max(w, h) * 0.9, o.glow, 0.12);
      c.save();
      W5.rr(c, x0, y0, w, h, o.kind === 'block' ? 6 : 10);
      let g;
      if (o.kind === 'block') { g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#f4ecd8'); g.addColorStop(1, '#d6c29a'); }
      else { g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#f4f7f8'); g.addColorStop(0.7, '#d9e1e4'); g.addColorStop(1, '#b7c3c8'); }
      c.shadowColor = 'rgba(11,26,21,0.6)'; c.shadowBlur = 12; c.shadowOffsetY = 3; c.fillStyle = g; c.fill();
      c.restore();
      c.strokeStyle = o.col || '#7d8b91'; c.lineWidth = 2.5; W5.rr(c, x0, y0, w, h, o.kind === 'block' ? 6 : 10); c.stroke();
      if (o.kind !== 'block') {
        const sp = y0 + h * 0.34;
        c.beginPath(); c.moveTo(x0 + 2, sp); c.lineTo(x0 + w - 2, sp); c.stroke();
        c.fillStyle = '#8c9aa0';
        W5.rr(c, x0 + 9, sp - 26, 5, 18, 2); c.fill(); W5.rr(c, x0 + 9, sp + 8, 5, 26, 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.55)'; W5.rr(c, x0 + w - 14, y0 + 8, 4, h - 18, 2); c.fill();
      }
      if (o.dot) {
        c.fillStyle = M3.INK; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
        c.fillStyle = COL.white; c.beginPath(); c.arc(cx, cy, 3, 0, TAU); c.fill();
      }
    });
    if (o.label) M3.T(c, a, o.label, cx, cy, M3.INK, o.size || 20);
    return res;
  };

  /* 「推進去」的力：箭頭尖端在 (o.x, o.y)（物體表面），箭尾在外面；長度＝val×k×grow。其餘參數與回傳同 M3.force */
  M3.forceInto = function (c, o) {
    const d0 = typeof o.dir === 'string' ? DIRS[o.dir] : typeof o.dir === 'number' ? { x: Math.cos(o.dir), y: Math.sin(o.dir) } : (o.dir || DIRS.right);
    const m = Math.hypot(d0.x, d0.y) || 1, g = o.grow == null ? 1 : clamp01(o.grow), len = Math.abs(o.val) * o.k * g;
    return M3.force(c, Object.assign({}, o, { x: o.x - d0.x / m * len, y: o.y - d0.y / m * len }));
  };

  /* 未知的力（虛線、尖端前後脈動）：o：{ x, y（into＝true 時是尖端，否則是箭尾）, dir, len px, col, a, phase 虛線流動, pulse 0..1 脈動量,
       text 標籤, lab 'above'|'below'|'left'|'right', dx, dy, size(22), into } → { x0,y0,x1,y1, box } */
  M3.forceQ = function (c, o) {
    const d0 = typeof o.dir === 'string' ? DIRS[o.dir] : (o.dir || DIRS.right), a = o.a == null ? 1 : o.a;
    const len = (o.len || 100) * (1 + 0.12 * (o.pulse || 0));
    let x0 = o.x, y0 = o.y, x1 = o.x + d0.x * len, y1 = o.y + d0.y * len;
    if (o.into) { x1 = o.x; y1 = o.y; x0 = o.x - d0.x * len; y0 = o.y - d0.y * len; }
    const res = { x0, y0, x1, y1, box: null };
    if (a <= 0.02) return res;
    M3.withA(c, a, () => {
      c.save(); c.shadowColor = W5.rgba(o.col || COL.white, 0.7); c.shadowBlur = 10;
      M3.dashArrow(c, x0, y0, x1, y1, o.col || COL.white, 1, o.phase || 0, { lw: 6, head: 18, dash: [12, 9] });
      c.restore();
    });
    if (o.text) {
      const where = o.lab || 'above', size = o.size || 22, hb = size + 16, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      let lx = mx, ly = my, al = 'center';
      if (where === 'above') ly = Math.min(y0, y1) - hb / 2 - 12;
      else if (where === 'below') ly = Math.max(y0, y1) + hb / 2 + 12;
      else if (where === 'left') { lx = Math.min(x0, x1) - 14; al = 'right'; }
      else { lx = Math.max(x0, x1) + 14; al = 'left'; }
      res.box = M3.P(c, a, o.text, lx + (o.dx || 0), ly + (o.dy || 0), o.col || COL.white, size, al);
    }
    return res;
  };

  /* 分段箭頭：從 (o.x,o.y) 沿 dir 依序畫 parts＝[{ val, col }]（長度＝val×k），最後一段有箭頭；grow 0..1＝整支長出多少。
     o：{ x, y, dir, k, parts, a, grow, lw(7), divider 段間刻痕(true) } → { x1, y1, len, ends:[每段終點 {x,y}] } */
  M3.segArrow = function (c, o) {
    const d0 = typeof o.dir === 'string' ? DIRS[o.dir] : (o.dir || DIRS.right);
    const a = o.a == null ? 1 : o.a, lw = o.lw || 7, g = o.grow == null ? 1 : clamp01(o.grow);
    const parts = o.parts || [], total = parts.reduce((t, p) => t + Math.abs(p.val) * o.k, 0), drawn = total * g;
    const ends = []; let acc = 0;
    parts.forEach(p => { acc += Math.abs(p.val) * o.k; ends.push({ x: o.x + d0.x * acc, y: o.y + d0.y * acc }); });
    const res = { x1: o.x + d0.x * drawn, y1: o.y + d0.y * drawn, len: drawn, ends };
    if (a <= 0.02 || drawn < 2) return res;
    M3.withA(c, a, () => {
      let s0 = 0;
      parts.forEach((p, i) => {
        const L = Math.abs(p.val) * o.k, s1 = Math.min(s0 + L, drawn);
        if (s1 > s0) {
          const xa = o.x + d0.x * s0, ya = o.y + d0.y * s0, xb = o.x + d0.x * s1, yb = o.y + d0.y * s1;
          const last = i === parts.length - 1 || s1 >= drawn;
          if (last) M3.arrowFx(c, xa, ya, xb, yb, p.col, 1, lw);
          else {
            c.save(); c.lineCap = 'butt';
            c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = lw + 4; c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke();
            c.shadowColor = W5.rgba(p.col, 0.85); c.shadowBlur = 12;
            c.strokeStyle = p.col; c.lineWidth = lw; c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke();
            c.restore();
          }
        }
        s0 += L;
      });
      if (o.divider !== false) {
        c.save(); c.strokeStyle = 'rgba(11,26,21,0.95)'; c.lineWidth = 3; const hw = lw / 2 + 5;
        ends.slice(0, -1).forEach(e => {
          if (Math.hypot(e.x - o.x, e.y - o.y) > drawn) return;
          c.beginPath(); c.moveTo(e.x - d0.y * hw, e.y + d0.x * hw); c.lineTo(e.x + d0.y * hw, e.y - d0.x * hw); c.stroke();
        });
        c.restore();
      }
    });
    return res;
  };

  /* 大括號：沿 (x0,y0)→(x1,y1) 畫，往 side（+1＝線段方向的右手邊，例如由上往下畫時凸向左；-1 反過來）凸出 depth px。
     o：{ col, a, side(1), depth(16), lw(3), grow 0..1, text 標籤（畫在凸點外側）, size(22), pill(true), gapPx 標籤離凸點(10) }
     → { tx, ty 凸點, box } */
  M3.brace = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || COL.white, sd = o.side == null ? 1 : o.side, dp = o.depth || 16;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * sd, ny = ux * sd;
    const P = (t, h) => ({ x: x0 + ux * L * t + nx * h, y: y0 + uy * L * t + ny * h });
    const tip = P(0.5, dp), res = { tx: tip.x, ty: tip.y, box: null };
    if (a <= 0.02) return res;
    const g = o.grow == null ? 1 : clamp01(o.grow);
    M3.withA(c, a, () => {
      c.save(); c.strokeStyle = col; c.lineWidth = o.lw || 3; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = W5.rgba(col, 0.6); c.shadowBlur = 8;
      const half = dp / 2, ex = 0.5 * g;
      c.beginPath();
      [[0, 1], [1, -1]].forEach(([e, sg]) => {
        const A = P(e, 0), Q = P(e, half), B = P(e + sg * 0.06, half);
        c.moveTo(A.x, A.y); c.quadraticCurveTo(Q.x, Q.y, B.x, B.y);
        const C = P(e + sg * Math.max(0.06, ex - 0.06), half); c.lineTo(C.x, C.y);
        if (g > 0.98) { const Q2 = P(0.5, half), D = P(0.5, dp); c.quadraticCurveTo(Q2.x, Q2.y, D.x, D.y); }
      });
      c.stroke(); c.restore();
    });
    if (o.text && g > 0.9) {
      const size = o.size || 22, gp = o.gapPx == null ? 10 : o.gapPx;
      const lx = tip.x + nx * gp, ly = tip.y + ny * gp;
      const al = Math.abs(nx) >= Math.abs(ny) ? (nx > 0 ? 'left' : 'right') : 'center';
      const oy = Math.abs(ny) > Math.abs(nx) ? ny * (size / 2 + 8) : 0;
      res.box = o.pill === false ? M3.T(c, a, o.text, lx, ly + oy, col, size, al) : M3.P(c, a, o.text, lx, ly + oy, col, size, al);
    }
    return res;
  };

  /* 一列等式：tokens＝[{ t 文字, col 顏色, pill 是否加框 }]，依序出現（show＝已出現幾塊，可帶小數＝正在淡入）。
     o：{ x, y, align 'center'|'left'|'right', size(24), gap(12), a, show(全部), rise 淡入時上移 px(8), mono } → { x0, x1, pos:[{x0,x1,cx}] } */
  M3.eqRow = function (c, o) {
    const size = o.size || 24, gap = o.gap == null ? 12 : o.gap, a = o.a == null ? 1 : o.a, toks = o.tokens || [];
    const ws = toks.map(k => W5.tw(c, k.t, size, o.mono) + (k.pill ? 28 : 0));
    const tot = ws.reduce((s, w) => s + w, 0) + gap * Math.max(0, toks.length - 1);
    let x = o.align === 'left' ? o.x : o.align === 'right' ? o.x - tot : o.x - tot / 2;
    const res = { x0: x, x1: x + tot, pos: [] };
    const show = o.show == null ? toks.length : o.show, rise = o.rise == null ? 8 : o.rise;
    toks.forEach((k, i) => {
      const ta = a * ease(clamp01(show - i)), cx = x + ws[i] / 2, y = o.y + rise * (1 - ease(clamp01(show - i)));
      res.pos.push({ x0: x, x1: x + ws[i], cx });
      if (k.pill) M3.P(c, ta, k.t, cx, y, k.col || COL.white, size, 'center', o.mono);
      else M3.T(c, ta, k.t, cx, y, k.col || COL.white, size, 'center', o.mono);
      x += ws[i] + gap;
    });
    return res;
  };

  /* ═══════════ 資優題（ab）新增：作用力與反作用力的「配對」記號（wall 也可用） ═══════════ */
  /* 雙向弧箭頭：從 (x0,y0) 彎到 (x1,y1)，往線段方向的右手邊凸出 bulge px（負值凸向另一邊），兩端都有箭頭；把一對力「配成一對」用。
     o：{ col(黃), a, bulge(24), lw(3.5), head(12), grow 0..1（從中間往兩端長出）, dash 虛線陣列(null＝實線), phase 虛線流動 } → { tx, ty 凸點 } */
  M3.pairArc = function (c, x0, y0, x1, y1, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a, col = o.col || COL.yellow, bg = o.bulge == null ? 24 : o.bulge;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    /* 二次曲線控制點＝中點往法線推 2×bulge（曲線頂點剛好凸出 bulge） */
    const cx = (x0 + x1) / 2 + nx * bg * 2, cy = (y0 + y1) / 2 + ny * bg * 2;
    const Q = t => ({ x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 });
    const tip = Q(0.5), res = { tx: tip.x, ty: tip.y };
    const g = o.grow == null ? 1 : clamp01(o.grow);
    if (a <= 0.02 || g <= 0.01) return res;
    const lw = o.lw || 3.5, head = o.head || 12, t0 = 0.5 - 0.5 * g, t1 = 0.5 + 0.5 * g;
    M3.withA(c, a, () => {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => { c.beginPath(); for (let i = 0; i <= 40; i++) { const p = Q(t0 + (t1 - t0) * i / 40); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); } };
      c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = lw + 4; path(); c.stroke();
      if (o.dash) { c.setLineDash(o.dash); c.lineDashOffset = -(o.phase || 0); }
      c.shadowColor = W5.rgba(col, 0.7); c.shadowBlur = 10; c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke();
      c.setLineDash([]);
      /* 兩端箭頭：沿曲線切線方向 */
      [[t0, t0 + 0.04], [t1, t1 - 0.04]].forEach(([te, tb]) => {
        const e = Q(te), b = Q(tb), d = Math.hypot(e.x - b.x, e.y - b.y) || 1, ux = (e.x - b.x) / d, uy = (e.y - b.y) / d;
        c.fillStyle = col; c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(e.x + ux * 3, e.y + uy * 3);
        c.lineTo(e.x - ux * head - uy * head * 0.55, e.y - uy * head + ux * head * 0.55);
        c.lineTo(e.x - ux * head + uy * head * 0.55, e.y - uy * head - ux * head * 0.55);
        c.closePath(); c.stroke(); c.fill();
      });
      c.restore();
    });
    return res;
  };
})(window);
