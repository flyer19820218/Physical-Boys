/* ==================================================================
   organics_1 ｜ 補充（高中）：碳還原氧化銅（cvs-cuo，960×540，紫色資優分頁 tab5）
   四步：1 乾餾留下碳 → 2 混合加熱 → 3 黑變紅 → 4 反應式
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop（紫色光暈 #c084fc，同 smoke；紫色只用在光暈）／ground／slab／caption／magnifier／dashArrow、
        M4.L／P／withA／fin／fout／grow／zoomLeader、
        O1.rig／rigPts／spot／cBlob／htube／lamp／flame／atom／bond／mol／MOL.CO2／fx，
        以及本檔新增到 O1 的 O1.CU／tstand／heap／tubeBed／grains。

   科學內容（只用簡報）：有機物（像木材）隔絕空氣加熱後留下黑色的碳；碳粉和黑色的氧化銅混合、加熱；
     黑色的氧化銅被碳還原成紅色的銅，同時有 CO₂ 從管口出來；反應式 C ＋ 2CuO → 2Cu ＋ CO₂。
     畫面上沒有任何數字（除化學式的係數與下標）。不畫手：玻璃棒自己攪拌，粉末用虛線箭頭表示裝進試管。

   第 1 步（11 s）乾餾留下碳：
     u 0.2 標題 → u 0.3～1.0 縮小的乾餾裝置淡入（正在加熱、冒白煙）；u 0.8～3.4 竹筷由淺變黑
     → u 1.0「隔絕空氣加熱」→ u 3.0「變黑」＋竹筷處閃一下光
     → u 3.6～4.2 其他部分變暗，只留竹筷 → u 4.0～4.8 放大鏡長出（虛線連到竹筷）
     → u 4.6 鏡內一塊黑色木炭 → u 5.0 下方第一格「黑色的木炭」
     → u 5.4～7.2 木炭解析成一顆顆 C 原子（O1.cBlob，由中心往外）→ u 7.0 第二格「碳原子 C」＋箭頭
     → u 8.0 字卡；u 9.0～11 靜止（只有火焰、煙在動）。
   第 2 步（12 s）混合加熱：
     u 0～0.5 第 1 步全部淡出 → u 0.5～1.1 橫放的硬質試管（空）＋鐵架＋酒精燈（未點）淡入
     → u 0.8 錶玻璃上的黑色碳粉、u 1.0「碳粉 C」→ u 1.3 錶玻璃上的黑色氧化銅、u 1.5「氧化銅 CuO」
     → u 2.2～3.0 兩個錶玻璃滑到中間合成一堆（左半碳粉、右半氧化銅）、標籤淡出
     → u 3.0～4.6 玻璃棒自己攪拌，粉末拌開；u 3.6「混合」
     → u 4.8～5.4 黃色虛線箭頭由粉堆指進試管底 → u 5.2～6.6 粉堆變少、試管底的黑色粉末層變厚
     → u 6.6「碳＋氧化銅」→ u 6.8～7.4 錶玻璃、箭頭、「混合」淡出
     → u 7.2～7.7 酒精燈點燃 → u 7.4～8.6 試管底受熱橘光 → u 7.8「加熱」
     → u 8.6 字卡；u 9.6～12 靜止（火焰閃動）。
   第 3 步（11 s）黑變紅：
     u 0～0.5「碳＋氧化銅」淡出（火焰持續）→ u 0.8～6.0 試管底粉末從受熱處往兩邊出現紅色亮點、擴散成紅色
     → u 1.0 起 CO₂ 分子每 0.8 s 一個從管口飄出（各飄 3.6 s、往上 185 px 淡出）
     → u 1.6～2.4 放大鏡在左邊長出（虛線連到粉末）→ u 2.4～6.4 鏡內黑色氧化銅顆粒一顆顆閃一下變成紅色銅（碳顆粒變小）
     → u 2.8「二氧化碳 CO₂」→ u 3.4 下方「氧化銅（黑）」→ u 5.0 箭頭＋「銅（紅）」
     → u 7.4 字卡；u 8.4～11 靜止（火焰、CO₂ 持續）。
   第 4 步（12 s）反應式：
     u 0～0.6 試管、放大鏡、桌面淡出 → u 0.6 C、u 0.9 第一個 CuO、u 1.2 第二個 CuO（Cu 與 O 兩球相貼）彈出、u 1.0「＋」
     → u 1.6 下排「C ＋ 2CuO」→ u 2.2～2.8 大箭頭長出、u 2.4 下排箭頭
     → u 3.0～3.5 兩個 O 原子發黃光（「＋」淡出）
     → u 3.4～5.0 下面那個 O 從兩個 CuO 之間繞過 C 的上方，移到 C 的左邊 → u 4.0～5.4 上面那個 O 移到 C 的右邊
       （O 一離開，原位留下淡淡的「反應前」原子）→ u 5.0 / 5.4 兩條 C＝O 雙鍵依序長出（CO₂ 成形）
     → u 6.0～7.2 CO₂ 與兩個 Cu 一起滑到箭頭右邊 → u 7.2 大「＋」、下排「2Cu ＋ CO₂」；u 7.2～8.0 左邊反應前的原子變回清楚
     → u 8.2「兩邊原子一樣多：C 1 個、Cu 2 個、O 2 個」（綠）→ u 9.0 字卡（反應式）；u 10～12 靜止。
   每一步右上角都有「補充（高中）」小標（珊瑚，20px）。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466；第 4 步淡出）。「補充（高中）」右對齊 (946,62)。
     第 1 步：O1.rig 縮放 0.75、平移 (−40,113)（同 products、smoke）：竹筷中心 ≈ (105,314)。
       「隔絕空氣加熱」(150,190)；「變黑」(105,245)；聚光洞 竹筷 r 70。
       放大鏡中心 (740,228) r 125（柄朝右上 −0.7 rad、長 70），虛線連到竹筷；鏡內 O1.cBlob n 30、r 17、R 100。
       下方兩格 y 410：「黑色的木炭」(640)、「碳原子 C」(850)，格間白箭頭。
     第 2、3 步：硬質試管 O1.htube 閉口端 (450,270)、傾角 0.08、長 360、外半徑 30 → 管口 ≈ (809,299)；
       粉末層管軸 d 22～150、最厚 15 px，受熱中心 d 85（x ≈ 535）；酒精燈 x ≈ 535（縮放 1.3，火焰高 78，焰尖約在管底）；
       鐵架夾在 d 250 ≈ (699,290)，直桿頂 y 192。
       第 2 步：錶玻璃（縮放 0.9）碳粉 x 150、氧化銅 x 370 → 合在 x 260；「碳粉 C」(150,360)、「氧化銅 CuO」(370,360)、「混合」(260,345)；
         玻璃棒 尖端 (260±18, 412) → 上端 (330±10, 292)；虛線箭頭 (300,392) → (470,292)；
         「碳＋氧化銅」(536,200)；「加熱」左對齊 (600,410)。
       第 3 步：CO₂ 分子 O1.mol scale 18、atomScale 0.5（元素符號 16px），從管口 (817,293) 往上 185 px、往右飄 30、左右擺 ±18；
         「二氧化碳 CO₂」右對齊 (752,170)；放大鏡中心 (215,230) r 120（柄朝左下 2.4 rad、長 60），虛線連到粉末 ≈ (533,296)；
         鏡內 O1.grains r 16；下方兩格 y 410：「氧化銅（黑）」(140)、「銅（紅）」(330)。
     第 4 步：原子（原尺寸 C 26、O 24、Cu 28）：C (150,250)；CuO 兩組 Cu (350,170)/(350,330)、O 緊貼在右 (402,·)；
       大箭頭 (470→560, 250)；生成物 Cu (640,170)/(640,330)、CO₂ 中心 (830,250)（O 在 ±69）；大「＋」(250,250)、(702,250)。
       下排化學式 y 400（30px）：C (150)、＋ (250)、2CuO (376)、箭頭 494→538、2Cu (640)、＋ (735)、CO₂ (830)；係數 2 用黃色。
       O 的路徑（Catmull-Rom）：下 O (402,330)→(425,268)→(300,250)→(190,188)→(110,200)→(81,250)；
         上 O (402,170)→(428,232)→(330,250)→(219,250)。原子數核對 pill (480,452)（綠，22px）。
   字級：標題 24、字卡 24、標籤 22、角落小標 20、下排化學式 30、原子元素符號 ≥ 16。
   示意：乾餾裝置縮小重用；木炭與 C 原子堆、粉末顆粒都是示意（CuO 沒畫晶格，Cu 與 O 畫成兩顆相貼的球）；
     粉末裝進試管用虛線箭頭表示；紅色擴散的速度、亮點、CO₂ 分子的數量與路徑都是示意；第 4 步「反應前」的淡原子只是為了讓反應式左右都看得到。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' ||
      !O1.rig || !O1.cBlob || !O1.htube || !O1.tstand || !O1.heap || !O1.tubeBed || !O1.grains) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, YEL = COL.yellow, CORAL = COL.coral, GREEN = COL.green;
  const PURPLE = '#c084fc';                               /* 資優分頁的紫色：只用在背景光暈（同 smoke） */
  const COPPER = O1.CU.cuHi;                              /* 「銅（紅）」標籤色 */
  const DUR = [11, 12, 11, 12];                           /* 總長 46 秒 */

  /* 第 n 步的 u；之前的步 −99、之後的步 99 */
  const uu = (s, n) => (s.n > n ? 99 : s.n < n ? -99 : s.u);
  const seg = (u, a, b) => clamp01((u - a) / (b - a));

  /* ── 版面 ── */
  const GY = 452;
  /* 第 1 步：縮小的乾餾裝置 */
  const RS = 0.75, RX = -40, RY = GY - RS * GY;          /* RY = 113 */
  const RP = O1.rigPts({ x: RX, y: RY, s: RS });
  const CH = { x: RP.chips.x, y: RP.chips.y };           /* 竹筷中心 ≈ (105,314) */
  const M1 = { x: 740, y: 228, r: 125 };
  const CH1_Y = 410, CH1 = [640, 850];
  /* 第 2、3 步：橫放的硬質試管 */
  const TB = { x: 450, y: 270, ang: 0.08, len: 360, r: 30 };
  const G = O1.htube(null, Object.assign({ a: 0 }, TB));
  const BED = { d0: 22, d1: 150, h: 15, hot: 85 };
  const LX = G.P(BED.hot, 0).x;                           /* 酒精燈 x ≈ 535 */
  const FH = 78;
  const SC = G.P(250, 0);                                 /* 鐵架夾子 ≈ (699,290) */
  const MOUTH = G.mouth;                                  /* 管口 ≈ (809,299) */
  const AIM3 = G.P(BED.hot, G.ri - 8);                    /* 放大鏡瞄準的粉末 */
  const M3G = { x: 215, y: 230, r: 120 };
  const HEAP = { a: 150, b: 370, m: 260, s: 0.9 };
  /* 第 4 步：原子 */
  const AC = { x: 150, y: 250 };
  const CUA = [{ x: 350, y: 170 }, { x: 350, y: 330 }];
  const OA = [{ x: 402, y: 170 }, { x: 402, y: 330 }];
  const PCU = [{ x: 640, y: 170 }, { x: 640, y: 330 }];
  const PCO2 = { x: 830, y: 250 }, CO2S = 46;              /* CO₂：O 在 C 的 ±1.5×46 = ±69 */
  const ARR = { x0: 470, x1: 560, y: 250 };
  const FX_Y = 400, FX_S = 30;
  /* O 的路徑：OA[1]（下）先走，繞過 C 上方到左邊；OA[0]（上）走兩組 CuO 中間到右邊 */
  const PATH_LO = [[402, 330], [425, 268], [300, 250], [190, 188], [110, 200], [AC.x - 1.5 * CO2S, AC.y]];
  const PATH_UP = [[402, 170], [428, 232], [330, 250], [AC.x + 1.5 * CO2S, AC.y]];

  /* ═══════════ 小工具 ═══════════ */
  /* Catmull-Rom：k 0..1 沿著整條折線（每段等時間） */
  function crPt(pts, k) {
    const n = pts.length - 1, f = clamp01(k) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const q = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t);
    return { x: q(0), y: q(1) };
  }
  /* 化學式寬度（同 O1.fx 的算法） */
  function fxW(c, str, size) {
    const sub = Math.round(size * 0.68); let w = 0;
    c.save();
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], isSub = /[0-9]/.test(ch) && i > 0 && /[A-Za-z)0-9]/.test(str[i - 1]) && !(/[0-9]/.test(str[i - 1]) && i === 1 && /[0-9]/.test(str[0]));
      c.font = W5.font(isSub ? sub : size, true); w += c.measureText(ch).width;
    }
    c.restore(); return w;
  }
  /* 係數（黃）＋化學式（白），整組以 x 為中心 */
  function term(c, a, coef, f, x, y, size) {
    if (a <= 0.02) return;
    size = size || FX_S;
    withA(c, a, () => {
      let cw = 0;
      if (coef) { c.save(); c.font = W5.font(size, true); cw = c.measureText(coef).width + 2; c.restore(); }
      const w = cw + fxW(c, f, size), x0 = x - w / 2;
      if (coef) O1.fx(c, coef, x0, y, YEL, size, 'left');
      O1.fx(c, f, x0 + cw, y, WHITE, size, 'left');
    });
  }
  /* 兩顆相貼的 Cu、O（CuO 示意） */
  function cuo(c, cx, ox, y, a, oy) {
    O1.atom(c, cx, y, 'Cu', null, { a });
    O1.atom(c, ox, oy == null ? y : oy, 'O', null, { a });
  }

  /* ═══════════ 背景 ═══════════ */
  function bench(c, s) {
    const a = s.n === 4 ? fout(s, 4, 0, 0.6) : 1;
    M3.ground(c, GY, {});
    if (a > 0.02) withA(c, a, () => M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 6 }));
  }

  /* ═══════════ 第 1 步：乾餾留下碳 ═══════════ */
  function step1(c, s) {
    const A = s.n === 1 ? fin(s, 1, 0.3, 0.7) : s.n === 2 ? fout(s, 2, 0, 0.5) : 0;
    if (A <= 0.02) return;
    const u = uu(s, 1);
    const dark = 0.15 + 0.85 * ease(seg(u, 0.8, 3.4));
    withA(c, A, () => {
      O1.rig(c, { x: RX, y: RY, s: RS, t: s.t, lampOn: true, heat: 1, chipsDarkness: dark,
        smokeAmt: 1, gasAmt: 0.7, liquidAmt: lerp(0.3, 0.85, seg(u, 0.5, 6)), tarAmt: lerp(0.2, 0.7, seg(u, 0.5, 6)), drip: 1 });
      if (u > 3.0 && u < 3.8) W5.glow(c, CH.x, CH.y, 70, YEL, 0.35 * Math.sin(Math.PI * (u - 3.0) / 0.8));
      O1.spot(c, [{ x: CH.x, y: CH.y, r: 70 }], { a: ease(seg(u, 3.6, 4.2)) });
    });
    P(c, A * fin(s, 1, 1.0, 0.4), L('隔絕空氣加熱', 'Heated without air'), 150, 190, WHITE, 22);
    P(c, A * fin(s, 1, 3.0, 0.4), L('變黑', 'Turns black'), 105, 245, WHITE, 22);
    /* 放大鏡：木炭 → C 原子堆 */
    const r = s.n === 1 ? M1.r * ease(seg(u, 4.0, 4.8)) : M1.r * (1 - ease(clamp01(s.u / 0.5)));
    if (r > 2) {
      const la = s.n === 1 ? fin(s, 1, 4.1, 0.5) : fout(s, 2, 0, 0.4);
      M4.zoomLeader(c, CH.x, CH.y, M1.x, M1.y, r, { a: la, col: WHITE, mark: 30 });
      M3.magnifier(c, M1.x, M1.y, r, { handle: -0.7, len: 70, glassA: 0.3, inner: cc => {
        cc.fillStyle = 'rgba(13,32,26,0.96)'; cc.fillRect(M1.x - r, M1.y - r, 2 * r, 2 * r);
        W5.glow(cc, M1.x, M1.y, r * 1.1, '#ffffff', 0.08);
        const k = ease(seg(u, 5.4, 7.2)), lump = ease(seg(u, 4.6, 5.0)) * (1 - 0.75 * k);
        if (lump > 0.02) charcoal(cc, M1.x, M1.y, lump);
        if (k > 0.01) O1.cBlob(cc, M1.x, M1.y, { n: 30, r: 17, R: 100, k, seed: 5 });
      } });
    }
    /* 下方兩格 */
    const out = s.n === 1 ? 1 : fout(s, 2, 0, 0.5);
    const a1 = out * fin(s, 1, 5.0, 0.4), a2 = out * fin(s, 1, 7.0, 0.4);
    const r1 = P(c, a1, L('黑色的木炭', 'Black charcoal'), CH1[0], CH1_Y, WHITE, 22);
    const r2 = P(c, a2, L('碳原子 C', 'C atoms'), CH1[1], CH1_Y, YEL, 22);
    if (r1 && r2 && a2 > 0.02) withA(c, a2, () => W5.arrow(c, r1.x + r1.w + 4, CH1_Y, r2.x - 4, CH1_Y, WHITE, 3, 9));
  }
  /* 放大鏡裡的一塊木炭（黑色不規則塊＋裂紋＋木紋） */
  function charcoal(c, x, y, a) {
    c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 11; i++) { const th = i / 11 * TAU, rr = 96 * (0.82 + 0.22 * hash(i * 3 + 7)); c[i ? 'lineTo' : 'moveTo'](x + Math.cos(th) * rr * 1.05, y + Math.sin(th) * rr * 0.86); }
    c.closePath();
    const g = c.createLinearGradient(x - 90, y - 80, x + 90, y + 80); g.addColorStop(0, '#4a5156'); g.addColorStop(0.4, '#25292c'); g.addColorStop(1, '#141719');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(160,170,176,0.7)'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(120,128,134,0.55)'; c.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) { const yy = y - 55 + i * 27; c.beginPath(); c.moveTo(x - 80, yy); c.bezierCurveTo(x - 30, yy - 8, x + 20, yy + 8, x + 80, yy - 2); c.stroke(); }
    c.strokeStyle = 'rgba(8,10,12,0.9)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(x - 20, y - 70); c.lineTo(x - 6, y - 30); c.lineTo(x - 18, y + 4); c.moveTo(x + 40, y + 10); c.lineTo(x + 22, y + 46); c.stroke();
    c.restore();
  }

  /* ═══════════ 第 2、3 步：試管＋酒精燈＋鐵架 ═══════════ */
  function rig23(c, s) {
    const A = s.n === 2 ? fin(s, 2, 0.5, 0.6) : s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.6) : 0;
    if (A <= 0.02) return;
    const on = s.n === 2 ? grow(s, 2, 7.2, 7.7) : 1, heat = s.n === 2 ? grow(s, 2, 7.4, 8.6) : 1;
    const bedK = s.n === 2 ? grow(s, 2, 5.2, 6.6) : 1, red = s.n === 3 ? grow(s, 3, 0.8, 6.0) : s.n > 3 ? 1 : 0;
    withA(c, A, () => {
      O1.lamp(c, LX, GY, { s: 1.3, on: false });
      if (on > 0.01) O1.flame(c, LX, GY - 60 * 1.3, FH * on, s.t, { w: 22 });
      O1.tstand(c, { x: SC.x, y: SC.y, gy: GY, top: 192, ang: TB.ang, r: TB.r, part: 'back' });
      O1.htube(c, Object.assign({}, TB, { t: s.t, chips: 0, heat, heatD: BED.hot, stopper: 'none' }));
      O1.tubeBed(c, G, { d0: BED.d0, d1: BED.d1, h: BED.h, k: bedK, red, hotD: BED.hot, t: s.t, seed: 7 });
      O1.tstand(c, { x: SC.x, y: SC.y, gy: GY, top: 192, ang: TB.ang, r: TB.r, part: 'front' });
    });
    /* 標籤 */
    const aMix = s.n === 2 ? fin(s, 2, 6.6, 0.4) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    P(c, aMix, L('碳＋氧化銅', 'C + CuO'), 536, 200, WHITE, 22);
    const aHeat = (s.n === 2 ? fin(s, 2, 7.8, 0.4) : 1) * A;
    P(c, aHeat, L('加熱', 'Heat'), 600, 410, CORAL, 22, 'left');
  }

  /* 第 2 步：錶玻璃上的粉末 → 混合 → 裝進試管 */
  function step2(c, s) {
    if (s.n !== 2) return;
    const u = s.u;
    const m = ease(seg(u, 2.2, 3.0)), merged = ease(seg(u, 2.8, 3.1));
    const glassA = fout(s, 2, 6.8, 0.6);
    /* 玻璃棒（先畫，被粉堆蓋住的那段像插進粉裡） */
    const rA = fin(s, 2, 3.0, 0.3) * fout(s, 2, 4.6, 0.4);
    if (rA > 0.02) {
      const w = (u - 3.0) * 7;
      O1.rod(c, HEAP.m + 18 * Math.cos(w), 412 + 4 * Math.sin(w), 330 + 10 * Math.cos(w), 292, { a: rA });
    }
    if (merged < 0.98) {
      const a0 = 1 - merged;
      O1.heap(c, lerp(HEAP.a, HEAP.m, m), GY - 2, { s: HEAP.s, kind: 'c', a: a0 * fin(s, 2, 0.8, 0.5), seed: 3 });
      O1.heap(c, lerp(HEAP.b, HEAP.m, m), GY - 2, { s: HEAP.s, kind: 'cuo', a: a0 * fin(s, 2, 1.3, 0.5), seed: 9 });
    }
    if (merged > 0.02) {
      const k = 1.3 * (1 - 0.85 * ease(seg(u, 5.2, 6.6)));
      O1.heap(c, HEAP.m, GY - 2, { s: HEAP.s, kind: 'mix', mix: ease(seg(u, 3.2, 4.6)), k, a: merged * glassA, seed: 5 });
    }
    const lOut = fout(s, 2, 2.2, 0.4);
    P(c, fin(s, 2, 1.0, 0.4) * lOut, L('碳粉 C', 'Carbon C'), HEAP.a, 360, WHITE, 22);
    P(c, fin(s, 2, 1.5, 0.4) * lOut, L('氧化銅 CuO', 'Copper oxide CuO'), HEAP.b, 360, WHITE, 22);
    P(c, fin(s, 2, 3.6, 0.4) * glassA, L('混合', 'Mix'), HEAP.m, 345, YEL, 22);
    /* 裝進試管：虛線箭頭 */
    const g = ease(seg(u, 4.8, 5.4)), aA = fin(s, 2, 4.8, 0.3) * glassA;
    if (g > 0.01 && aA > 0.02) M3.dashArrow(c, 300, 392, lerp(300, 470, g), lerp(392, 292, g), YEL, aA, s.t * 1.5);
  }

  /* ═══════════ 第 3 步：CO₂ 從管口出來＋放大鏡 ═══════════ */
  function co2Stream(c, s) {
    const A = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.5) : 0;
    if (A <= 0.02) return;
    const u = s.n === 3 ? s.u : DUR[2] + s.u;
    const x0 = MOUTH.x + 8, y0 = MOUTH.y - 6;
    for (let i = 0; i < 16; i++) {
      const t0 = 1.0 + i * 0.8, age = u - t0; if (age < 0 || age > 3.6) continue;
      const p = age / 3.6;
      const x = x0 + 30 * Math.sqrt(p) + 18 * Math.sin(p * 5 + i * 1.3), y = y0 - 185 * p;
      const a = A * clamp01(p * 6) * (1 - ease(seg(p, 0.75, 1)));
      O1.mol(c, O1.MOL.CO2, x, y, { scale: 18, atomScale: 0.5, a });
    }
    P(c, fin(s, 3, 2.8, 0.4) * A, L('二氧化碳 CO₂', 'Carbon dioxide CO₂'), 752, 170, WHITE, 22, 'right');
  }

  function step3(c, s) {
    const u = uu(s, 3);
    const r = s.n === 3 ? M3G.r * ease(seg(u, 1.6, 2.4)) : s.n === 4 ? M3G.r * (1 - ease(clamp01(s.u / 0.5))) : 0;
    if (r > 2) {
      const la = s.n === 3 ? fin(s, 3, 1.7, 0.5) : fout(s, 4, 0, 0.4);
      M4.zoomLeader(c, AIM3.x, AIM3.y, M3G.x, M3G.y, r, { a: la, col: WHITE, mark: 26 });
      const k = s.n === 3 ? ease(seg(u, 2.4, 6.4)) : 1;
      M3.magnifier(c, M3G.x, M3G.y, r, { handle: 2.4, len: 60, glassA: 0.25, inner: cc => {
        cc.fillStyle = '#26302c'; cc.fillRect(M3G.x - r, M3G.y - r, 2 * r, 2 * r);
        O1.grains(cc, M3G.x, M3G.y, r, { r: 16, k, seed: 11, t: s.t });
      } });
    }
    const out = s.n === 3 ? 1 : s.n === 4 ? fout(s, 4, 0, 0.5) : 0;
    const a1 = out * fin(s, 3, 3.4, 0.4), a2 = out * fin(s, 3, 5.0, 0.4);
    const r1 = P(c, a1, L('氧化銅（黑）', 'CuO (black)'), 140, 410, WHITE, 22);
    const r2 = P(c, a2, L('銅（紅）', 'Cu (red)'), 330, 410, COPPER, 22);
    if (r1 && r2 && a2 > 0.02) withA(c, a2, () => W5.arrow(c, r1.x + r1.w + 4, 410, r2.x - 4, 410, WHITE, 3, 9));
  }

  /* ═══════════ 第 4 步：反應式 ═══════════ */
  function step4(c, s) {
    if (s.n !== 4) return;
    const u = s.u, A = fin(s, 4, 0.4, 0.5);
    if (A <= 0.02) return;
    c.save(); c.globalAlpha *= A;
    /* 大箭頭、「＋」 */
    const ga = ease(seg(u, 2.2, 2.8));
    if (ga > 0.01) M3.arrowFx(c, ARR.x0, ARR.y, lerp(ARR.x0 + 4, ARR.x1, ga), ARR.y, WHITE, 1, 6, 0);
    const plus = (x, a) => { if (a > 0.02) { c.save(); c.globalAlpha *= a; W5.label(c, '＋', x, 250, WHITE, 40); c.restore(); } };
    plus(250, fin(s, 4, 1.0, 0.3) * fout(s, 4, 3.0, 0.3));
    plus(702, fin(s, 4, 7.2, 0.4));
    /* 反應前的淡原子（O 離開之後才出現；最後變回清楚，讓反應式左右都看得到） */
    const gA = u < 3.3 ? 0 : u < 7.2 ? 0.28 * seg(u, 3.3, 3.6) : lerp(0.28, 1, ease(seg(u, 7.2, 8.0)));
    if (gA > 0.02) {
      O1.atom(c, AC.x, AC.y, 'C', null, { a: gA });
      CUA.forEach((p, i) => cuo(c, p.x, OA[i].x, p.y, gA));
      if (u > 7.2) plus(250, gA);
    }
    /* 移動中的原子 */
    const e = ease(seg(u, 6.0, 7.2));
    const kLo = ease(seg(u, 3.4, 5.0)), kUp = ease(seg(u, 4.0, 5.4));
    const oLo = crPt(PATH_LO, kLo), oUp = crPt(PATH_UP, kUp);
    const dxC = (PCO2.x - AC.x) * e, dxCu = (PCU[0].x - CUA[0].x) * e;
    const pop = (t0) => { const q = clamp01((u - t0) / 0.4); return { a: clamp01(q * 2.5), sc: q >= 1 ? 1 : 0.5 + 0.5 * ease(q) + 0.15 * Math.sin(Math.PI * q) }; };
    const pc = pop(0.6), p1 = pop(0.9), p2 = pop(1.2);
    /* O 發光（要搬家） */
    const glowO = u > 3.0 && u < 5.6 ? 0.5 * Math.min(1, (u - 3.0) / 0.3) * (1 - seg(u, 5.2, 5.6)) : 0;
    /* C＝O 雙鍵（CO₂ 成形） */
    const bL = fin(s, 4, 5.0, 0.3), bR = fin(s, 4, 5.4, 0.3);
    const cx = AC.x + dxC, cy = AC.y;
    const oL = kLo >= 1 ? { x: AC.x - 1.5 * CO2S + dxC, y: AC.y } : oLo, oR = kUp >= 1 ? { x: AC.x + 1.5 * CO2S + dxC, y: AC.y } : oUp;
    if (bL > 0.02 && kLo >= 1) O1.bond(c, oL.x, oL.y, cx, cy, { order: 2, a: bL });
    if (bR > 0.02 && kUp >= 1) O1.bond(c, cx, cy, oR.x, oR.y, { order: 2, a: bR });
    /* Cu */
    [p1, p2].forEach((p, i) => { if (p.a > 0.02) O1.atom(c, CUA[i].x + dxCu, CUA[i].y, 'Cu', O1.EL.Cu.r * p.sc, { a: p.a, glow: e > 0.02 && e < 1 ? COPPER : null }); });
    /* C */
    if (pc.a > 0.02) O1.atom(c, cx, cy, 'C', O1.EL.C.r * pc.sc, { a: pc.a });
    /* O（下＝左邊那顆、上＝右邊那顆） */
    [[p2, oL], [p1, oR]].forEach(([p, q]) => {
      if (p.a <= 0.02) return;
      if (glowO > 0.02) W5.glow(c, q.x, q.y, 50, YEL, glowO);
      O1.atom(c, q.x, q.y, 'O', O1.EL.O.r * p.sc, { a: p.a });
    });
    /* 下排化學式 */
    term(c, fin(s, 4, 1.6, 0.4), '', 'C', AC.x, FX_Y);
    withA(c, fin(s, 4, 1.6, 0.4), () => W5.label(c, '＋', 250, FX_Y, WHITE, FX_S));
    term(c, fin(s, 4, 1.6, 0.4), '2', 'CuO', 376, FX_Y);
    withA(c, fin(s, 4, 2.4, 0.4), () => W5.arrow(c, 494, FX_Y, 538, FX_Y, WHITE, 3, 10));
    term(c, fin(s, 4, 7.2, 0.4), '2', 'Cu', PCU[0].x, FX_Y);
    withA(c, fin(s, 4, 7.2, 0.4), () => W5.label(c, '＋', 735, FX_Y, WHITE, FX_S));
    term(c, fin(s, 4, 7.2, 0.4), '', 'CO2', PCO2.x, FX_Y);
    c.restore();
    /* 原子數核對 */
    P(c, fin(s, 4, 8.2, 0.5), L('兩邊原子一樣多：C 1 個、Cu 2 個、O 2 個', 'Same atoms on both sides: 1 C, 2 Cu, 2 O'), 480, 452, GREEN, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('乾餾留下碳', 'Carbon is left'),
    () => L('混合加熱', 'Mix and heat'),
    () => L('黑變紅', 'Black turns red'),
    () => L('反應式', 'The equation')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    P(c, 1, L('補充（高中）', 'Extra (senior high)'), 946, M3.KEY_Y, CORAL, 20, 'right');
    M3.caption(c, fin(s, 1, 8.0, 0.6) * fout(s, 2, 0, 0.4), L('有機物（像木材）隔絕空氣加熱後，會留下黑色的碳', 'Organics such as wood, heated without air, leave black carbon'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.6, 0.6) * fout(s, 3, 0, 0.4), L('把碳粉和黑色的氧化銅混合，加熱', 'Mix carbon powder with black copper oxide, then heat'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.4, 0.6) * fout(s, 4, 0, 0.4), L('黑色的氧化銅，被碳還原成紅色的銅', 'Carbon reduces black copper oxide to red copper'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 9.0, 0.6), 'C ＋ 2CuO → 2Cu ＋ CO₂', YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40, glow: PURPLE });
    bench(c, s);
    step1(c, s);
    rig23(c, s);
    step2(c, s);
    co2Stream(c, s);
    step3(c, s);
    step4(c, s);
    texts(c, s);
  }

  W5.register('cuo', { canvas: 'cvs-cuo', steps: DUR, draw });
})();
