/* ==================================================================
   organics_1 ｜ 補充：乾餾時看到的煙（cvs-smoke，960×540，tab5）
   三步：1 白煙 → 2 黑煙 → 3 醋酸與石蕊
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、O1。
   用到：M3.backdrop／ground／slab／caption／magnifier／dashArrow、
        M4.L／T／P／withA／fin／fout／grow／zoomLeader、
        O1.rig／rigPts／smoke／miniMol／MOL.H2O／cBlob／spot／litmus／dropper。本檔沒有新增 O1 函式。

   科學內容（只用簡報）：白煙＝小水滴（水蒸氣遇冷凝結）；黑煙＝碳顆粒；收集管液體中的醋酸使藍色石蕊試紙變紅色。
     畫面上沒有任何數字（除化學式下標，本檔一律用 Unicode 下標 H₂O）。不畫手：滴管自己移動、自己擠。

   第 1 步（12 s）白煙：
     u 0.2 標題 → u 0.3～1.0 縮小的乾餾裝置淡入（正在加熱、導管口冒白煙）
     → u 1.0「導管口」→ u 1.4「白煙」＋白煙處閃一下光
     → u 2.0～2.8 放大鏡長出（虛線連到導管口上方的白煙）
     → u 2.8 放大鏡內 20 個 H₂O 分子快速亂飛（水蒸氣）、u 3.0 下方第一格「水蒸氣 H₂O」
     → u 4.2～5.0 鏡內由暖轉冷（青光）、u 4.4 第二格「遇冷」＋箭頭
     → u 4.4～6.6 分子依序聚集，每 4 個聚成一顆小圓滴（u 5.0～6.8 水滴的青色球殼依序出現）
     → u 6.8 第三格「小水滴」＋箭頭 → u 8.2 字卡；u 9.0～12 靜止（水滴只微微上下浮動）。
   第 2 步（12 s）黑煙：
     u 0～0.5 第 1 步放大鏡縮回、下方三格與「白煙」淡出 → u 0.4～1.6 導管口的煙由白漸變成黑
     → u 1.4「黑煙」→ u 2.0～2.8 放大鏡再長出（鏡內是淺灰底，黑色看得清楚）
     → u 2.8～4.0 五顆黑色模糊小顆粒依序飄進來（每顆間隔 0.3 s）
     → u 4.4～6.4 每顆顆粒依序「解析」成一團 C 原子（O1.cBlob，模糊黑影變淡）
     → u 6.4 下方「碳顆粒：C 原子聚在一起」→ u 8.2 字卡；u 9.0～12 靜止（顆粒只微微飄動）。
   第 3 步（13 s）醋酸與石蕊：
     u 0～0.5 放大鏡、標籤淡出；u 0～0.8 導管口的煙回到白色、變淡 → u 0.6～1.2 其他部分變暗，只留收集管
     → u 0.9～1.5 黃色虛線箭頭由收集管指向右邊 → u 1.0～1.6 放大畫的收集管（開口、上層透明醋酸、底部焦油）在右邊升起
     → u 1.6「收集管裡的液體」→ u 2.0 藍色石蕊試紙出現、u 2.3「藍色石蕊試紙」
     → u 2.6 滴管出現在收集管上方（橡皮頭擠扁）→ u 2.8～3.6 往下伸進液體 → u 3.6 漣漪
     → u 3.7～4.3 放開橡皮頭、吸進液體 → u 4.3～4.9 提起 → u 4.9～5.9 移到試紙上方
     → u 6.0～6.3 擠橡皮頭、尖端長出一滴 → u 6.3～6.6 液滴落下 → u 6.6 打到試紙（濕痕＋水花圈）
     → u 6.6～7.8 試紙從滴到的地方往外由藍變紅 → u 6.8～7.6 滴管退開淡出
     → u 8.0「醋酸」（珊瑚，引線指到管內液體）→ u 8.4「變紅色」→ u 9.0 字卡；u 9.6～13 靜止。

   版面：步驟標題 KEY_Y 62、字卡 BOT_Y 505（＝ M3.KEY_Y／M3.BOT_Y）。畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34。
     桌面 GY 452（M3.slab 20～940、452～466）。
     乾餾裝置：O1.rig 縮放 0.75、平移 (−40,113)（同 products 第 2、3 步，桌面仍在 452）：導管口 ≈ (488,291)、收集管中線 x 455、
       收集管液體中心 ≈ (455,405)、燒杯 414～496。O1.rig 的 gasAmt 設 0，導管口的煙改由本檔在畫布座標畫（O1.smoke 起點 (491,287)、
       上升 125、r 10；黑煙＝灰邊 #8a9196 r 16 ＋黑芯 #2a2e31 r 12，縮小後才看得清楚）。
     第 1、2 步：「導管口」右對齊 (468,241)；「白煙」／「黑煙」右對齊 (468,190)；放大鏡瞄準點 (500,240)（白煙／黑煙裡）。
       放大鏡中心 (730,220) r 125（柄朝右上 −0.7 rad、長 80，柄尾 ≈ (890,74)），虛線連到瞄準點（小圈 r 22）。
       第 1 步下方三格 y 398：「水蒸氣 H₂O」(585)、「遇冷」(730)、「小水滴」(875)，格間白箭頭。
       第 1 步鏡內：H₂O 分子 O1.miniMol scale 10、k 0.34；5 顆水滴 中心（相對鏡心）(−55,−50)(45,−55)(−5,10)(−60,58)(62,48)、半徑 28～32，每顆 4 個分子。
       第 2 步鏡內：淺灰底 #c9d2d4；5 顆碳顆粒 中心（相對鏡心）(−55,−45)(45,−58)(0,12)(−52,60)(60,48)，模糊黑影 r 34、O1.cBlob n 8、r 12、R 28；
         「碳顆粒：C 原子聚在一起」(730,398)。
     第 3 步：聚光洞 收集管 (455,405) r 56；黃虛線箭頭 (492,372) → (566,300)。
       放大的收集管：中線 x 615、管口 y 150、外底 y 440、外半徑 34（內 30）；液面 y 270、焦油頂 y 382；木頭試管座 570～660、420～452。
       「收集管裡的液體」左對齊 (668,200)；石蕊試紙 (745,398)～(935,426)，滴到的位置 (835,412)；「藍色石蕊試紙」(840,452)。
       滴管（O1.dropper len 70）尖端：(615,140) → 伸進液體 (615,312) → 提起 (615,140) → 試紙上方 (835,330)（弧線）→ 退開往右上淡出。
       「醋酸」左對齊 (668,318)（珊瑚，引線到管內 (628,318)）；「變紅色」(840,368)（珊瑚）。
   字級：標題 24、字卡 24、所有標籤 22、原子元素符號 16（cBlob r 12 → 16px）。
   示意：裝置縮小重用；煙的樣子、黑煙的顏色、分子大小與數量、每顆水滴只有 4 個分子、碳顆粒只有幾顆原子（實際多得多）、
     水滴與碳顆粒的形狀都是示意；第 3 步把收集管拿出來放大畫（開口、管座）是示意；液體分層與顏色、試紙顏色是示意。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof O1 === 'undefined' || !O1.rig || !O1.cBlob || !O1.dropper || !O1.miniMol) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, CORAL = COL.coral, TEAL = COL.teal;
  const DUR = [12, 12, 13];                               /* 總長 37 秒 */

  /* ── 版面 ── */
  const GY = 452;
  const RS = 0.75, RX = -40, RY = GY - RS * GY;          /* RY = 113 */
  const RP = O1.rigPts({ x: RX, y: RY, s: RS });
  const OUT = { x: RP.outlet.x, y: RP.outlet.y };        /* 導管口 ≈ (488,291) */
  const COLX = RP.colTop.x;                              /* 收集管中線 ≈ 455 */
  const AIM = { x: 500, y: 240 };                        /* 放大鏡瞄準的煙 */
  const MX = 730, MY = 220, MR = 125;
  const CHAIN_Y = 398, CHAIN = [585, 730, 875];
  /* 第 1 步：水滴（相對鏡心）＋每滴 4 個分子 */
  const DROPS = [{ x: -55, y: -50, r: 30 }, { x: 45, y: -55, r: 28 }, { x: -5, y: 10, r: 32 }, { x: -60, y: 58, r: 28 }, { x: 62, y: 48, r: 30 }];
  /* 第 2 步：碳顆粒（相對鏡心） */
  const SOOT = [{ x: -55, y: -45 }, { x: 45, y: -58 }, { x: 0, y: 12 }, { x: -52, y: 60 }, { x: 60, y: 48 }];
  /* 第 3 步 */
  const TX = 615, T_TOP = 150, T_BOT = 440, T_R = 34, T_RI = 30, SURF = 270, TAR = 382;
  const LIT = { x: 745, y: 398, w: 190, h: 28 }, DOT = { x: 835, y: 412 };
  const DROP_LEN = 70;

  /* 顏色 */
  const ACID = '#e8cf96', SMOKE_W = '#eef2f0', SMOKE_B = '#2a2e31', SMOKE_EDGE = '#8a9196';

  /* ═══════════ 背景 ═══════════ */
  function bench(c) {
    M3.ground(c, GY, {});
    M3.slab(c, 20, GY, 940, GY + 14, 'wood', { seed: 6 });
  }

  /* ═══════════ 乾餾裝置（三步共用） ═══════════ */
  /* 黑煙比例 0..1（第 2 步 u 0.4～1.6 變黑；第 3 步 u 0～0.8 變回白） */
  const blackK = s => (s.n === 2 ? ease(clamp01((s.u - 0.4) / 1.2)) : s.n === 3 ? 1 - ease(clamp01(s.u / 0.8)) : 0);
  function rig(c, s) {
    const A = s.n === 1 ? fin(s, 1, 0.3, 0.7) : 1;
    const bk = blackK(s), gas = s.n === 3 ? lerp(1, 0.6, ease(clamp01(s.u / 0.8))) : 1;
    O1.rig(c, {
      x: RX, y: RY, s: RS, a: A, t: s.t,
      lampOn: true, heat: 1, chipsDarkness: s.n === 1 ? 0.8 : 1,
      smokeAmt: s.n === 1 ? 1 : 0.6, gasAmt: 0, liquidAmt: 0.85, tarAmt: 0.75, drip: 1
    });
    /* 導管口的煙：自己畫在畫布座標（比 O1.rig 內建的氣體大一號，縮小後才看得清楚）；
       黑煙先畫一層灰邊，黑色在黑板底上才看得出輪廓 */
    const x0 = OUT.x + 3, y0 = OUT.y - 4, so = { n: 22, h: 125, spread: 16, speed: 0.45, seed: 9, drift: 0.18 };
    withA(c, A, () => {
      if (bk < 0.98) O1.smoke(c, x0, y0, s.t, Object.assign({}, so, { a: 1.5 * gas * (1 - bk), r: 10, col: SMOKE_W }));
      if (bk > 0.02) {
        O1.smoke(c, x0, y0, s.t, Object.assign({}, so, { a: 1.5 * gas * bk, r: 16, col: SMOKE_EDGE }));
        O1.smoke(c, x0, y0, s.t, Object.assign({}, so, { a: 1.9 * gas * bk, r: 12, col: SMOKE_B }));
      }
    });
  }

  /* 「導管口」「白煙／黑煙」 */
  function rigLabels(c, s) {
    const out = s.n <= 2 ? 1 : fout(s, 3, 0, 0.5);
    P(c, out * fin(s, 1, 1.0, 0.4), L('導管口', 'Gas outlet'), OUT.x - 20, OUT.y - 50, WHITE, 22, 'right');
    const wA = s.n === 1 ? fin(s, 1, 1.4, 0.4) : s.n === 2 ? fout(s, 2, 0, 0.5) : 0;
    P(c, wA, L('白煙', 'White smoke'), OUT.x - 20, 190, WHITE, 22, 'right');
    if (s.n === 1 && s.u > 1.4 && s.u < 2.2) W5.glow(c, AIM.x, AIM.y + 10, 60, WHITE, 0.4 * Math.sin(Math.PI * (s.u - 1.4) / 0.8));
    const bA = s.n === 2 ? fin(s, 2, 1.4, 0.4) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    P(c, bA, L('黑煙', 'Black smoke'), OUT.x - 20, 190, WHITE, 22, 'right');
  }

  /* ═══════════ 第 1、2 步：放大鏡 ═══════════ */
  function magR(s) {
    if (s.n === 1) return MR * ease(clamp01((s.u - 2.0) / 0.8));
    if (s.n === 2) return s.u < 1 ? MR * (1 - ease(clamp01(s.u / 0.5))) : MR * ease(clamp01((s.u - 2.0) / 0.8));
    return s.n === 3 ? MR * (1 - ease(clamp01(s.u / 0.5))) : 0;
  }
  /* 鏡內畫的是哪一步（第 3 步縮回時沿用第 2 步的畫面） */
  const magStep = s => (s.n === 2 && s.u < 1 ? 1 : s.n === 3 ? 2 : s.n);

  /* 第 1 步鏡內：水蒸氣分子亂飛 → 遇冷聚成小水滴 */
  function vapourInner(c, s, r) {
    const u = s.n === 1 ? s.u : 12;
    const cool = ease(clamp01((u - 4.2) / 0.8));
    c.fillStyle = 'rgba(13,32,26,0.95)'; c.fillRect(MX - r, MY - r, 2 * r, 2 * r);
    W5.glow(c, MX, MY, r * 1.1, '#ff8040', 0.12 * (1 - cool));
    W5.glow(c, MX, MY, r * 1.1, TEAL, 0.16 * cool);
    const show = clamp01((u - 2.8) / 0.4);
    if (show <= 0.01) return;
    /* 水滴球殼（在分子後面） */
    DROPS.forEach((d, j) => {
      const q = ease(clamp01((u - 5.0 - 0.3 * j) / 0.9)); if (q <= 0.01) return;
      const bob = 3 * Math.sin(u * 1.3 + j * 1.7), x = MX + d.x, y = MY + d.y + bob, rr = d.r * (0.6 + 0.4 * q);
      c.save(); c.globalAlpha *= q;
      const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.35, rr * 0.1, x, y, rr);
      g.addColorStop(0, 'rgba(200,245,255,0.35)'); g.addColorStop(1, 'rgba(77,210,255,0.18)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(160,235,255,0.85)'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, rr - 5, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
      c.restore();
    });
    /* 20 個 H₂O 分子 */
    for (let i = 0; i < 20; i++) {
      const j = Math.floor(i / 4), q = i % 4, d = DROPS[j];
      const w1 = 1.8 + 1.5 * hash(i + 11), w2 = 1.5 + 1.6 * hash(i + 23), p1 = hash(i * 3 + 1) * TAU, p2 = hash(i * 5 + 2) * TAU;
      const vx = MX + 95 * Math.sin(w1 * u + p1), vy = MY + 95 * Math.sin(w2 * u + p2);
      const a0 = 4.4 + 0.1 * i, k = ease(clamp01((u - a0) / 1.6));
      const sa = q * Math.PI / 2 + j * 0.7, bob = 3 * Math.sin(u * 1.3 + j * 1.7);
      const sx = MX + d.x + Math.cos(sa) * d.r * 0.45 + 1.5 * Math.sin(u * 3 + i), sy = MY + d.y + bob + Math.sin(sa) * d.r * 0.45 + 1.5 * Math.cos(u * 2.6 + i);
      const x = lerp(vx, sx, k), y = lerp(vy, sy, k);
      const rot = hash(i + 51) * TAU + (2 + 2 * hash(i + 61)) * Math.min(u, a0 + 0.8) + 0.2 * Math.sin(u * 2 + i);
      O1.miniMol(c, O1.MOL.H2O, x, y, { scale: 10, k: 0.34, rot, a: show });
    }
  }

  /* 第 2 步鏡內：黑色小顆粒 → 解析成 C 原子團 */
  function sootInner(c, s, r) {
    const u = s.n === 2 ? s.u : 12;
    c.fillStyle = '#c9d2d4'; c.fillRect(MX - r, MY - r, 2 * r, 2 * r);
    W5.glow(c, MX, MY - 20, r, '#ffffff', 0.25);
    SOOT.forEach((p, j) => {
      const q = clamp01((u - 2.8 - 0.3 * j) / 0.5); if (q <= 0.01) return;
      const k = ease(clamp01((u - 4.4 - 0.3 * j) / 1.2));
      const drift = 22 * (1 - ease(q));
      const x = MX + p.x + 4 * Math.sin(u * 0.9 + j * 2.1) + drift, y = MY + p.y + 4 * Math.cos(u * 0.8 + j) + drift * 0.6;
      /* 模糊黑影（解析後變淡，留一點黑色光暈） */
      c.save(); c.globalAlpha *= q * (1 - 0.65 * k);
      const g = c.createRadialGradient(x, y, 4, x, y, 36);
      g.addColorStop(0, 'rgba(34,38,41,0.95)'); g.addColorStop(0.6, 'rgba(34,38,41,0.75)'); g.addColorStop(1, 'rgba(34,38,41,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 36, 0, TAU); c.fill(); c.restore();
      if (k > 0.01) O1.cBlob(c, x, y, { n: 8, r: 12, R: 28, k, seed: 3 + j * 2 });
    });
  }

  function magnifier(c, s) {
    const r = magR(s); if (r <= 2) return;
    const ms = magStep(s);
    const la = s.n === 1 ? fin(s, 1, 2.1, 0.5) : s.n === 2 ? (s.u < 1 ? fout(s, 2, 0, 0.4) : fin(s, 2, 2.1, 0.5)) : fout(s, 3, 0, 0.4);
    M4.zoomLeader(c, AIM.x, AIM.y, MX, MY, r, { a: la, col: WHITE, mark: 22 });
    M3.magnifier(c, MX, MY, r, { handle: -0.7, len: 80, glassA: ms === 2 ? 0.2 : 0.35, inner: cc => (ms === 1 ? vapourInner(cc, s, r) : sootInner(cc, s, r)) });
  }

  /* 第 1 步下方三格：水蒸氣 H₂O → 遇冷 → 小水滴 */
  function chain(c, s) {
    const out = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0; if (out <= 0.02) return;
    const a1 = out * fin(s, 1, 3.0, 0.4), a2 = out * fin(s, 1, 4.4, 0.4), a3 = out * fin(s, 1, 6.8, 0.4);
    const r1 = P(c, a1, L('水蒸氣 H₂O', 'H₂O vapour'), CHAIN[0], CHAIN_Y, WHITE, 22);
    const r2 = P(c, a2, L('遇冷', 'Cooled'), CHAIN[1], CHAIN_Y, TEAL, 22);
    const r3 = P(c, a3, L('小水滴', 'Droplets'), CHAIN[2], CHAIN_Y, TEAL, 22);
    const arr = (a, A, B) => { if (!A || !B || a <= 0.02) return; withA(c, a, () => W5.arrow(c, A.x + A.w + 4, CHAIN_Y, B.x - 4, CHAIN_Y, WHITE, 3, 9)); };
    arr(a2, r1, r2); arr(a3, r2, r3);
  }

  function sootLabel(c, s) {
    const a = s.n === 2 ? fin(s, 2, 6.4, 0.5) : s.n === 3 ? fout(s, 3, 0, 0.5) : 0;
    P(c, a, L('碳顆粒：C 原子聚在一起', 'Carbon particles: clumps of C atoms'), MX, CHAIN_Y, WHITE, 22);
  }

  /* ═══════════ 第 3 步：收集管的液體＋藍色石蕊試紙 ═══════════ */
  /* 放大畫的收集管（開口、直立）：上層透明醋酸、底部焦油；o.ripple 0..1 漣漪 */
  function bigTube(c, dy, ripple) {
    const top = T_TOP + dy, bot = T_BOT + dy, surf = SURF + dy, tar = TAR + dy;
    const outer = () => { c.beginPath(); c.moveTo(TX - T_R, top); c.lineTo(TX - T_R, bot - T_R); c.arc(TX, bot - T_R, T_R, Math.PI, 0, true); c.lineTo(TX + T_R, top); };
    const inner = () => { c.beginPath(); c.moveTo(TX - T_RI, top); c.lineTo(TX - T_RI, bot - T_R); c.arc(TX, bot - T_R, T_RI, Math.PI, 0, true); c.lineTo(TX + T_RI, top); c.closePath(); };
    outer(); c.closePath(); c.fillStyle = 'rgba(200,236,246,0.10)'; c.fill();
    c.save(); inner(); c.clip();
    const lg = c.createLinearGradient(0, surf, 0, tar); lg.addColorStop(0, W5.rgba(ACID, 0.30)); lg.addColorStop(1, W5.rgba(ACID, 0.46));
    c.fillStyle = lg; c.fillRect(TX - T_RI, surf, 2 * T_RI, tar - surf + 4);
    const tg = c.createLinearGradient(0, tar, 0, bot); tg.addColorStop(0, '#4a2e18'); tg.addColorStop(1, '#1f130a');
    c.fillStyle = tg; c.beginPath(); c.moveTo(TX - T_RI, tar + 3);
    for (let x = TX - T_RI; x <= TX + T_RI; x += 6) c.lineTo(x, tar + 3 * Math.sin(x * 0.11 + 1) - 1);
    c.lineTo(TX + T_RI, bot + 4); c.lineTo(TX - T_RI, bot + 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,200,140,0.22)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(TX - T_RI + 8, tar + 10); c.quadraticCurveTo(TX, tar + 3, TX + T_RI - 8, tar + 11); c.stroke();
    c.strokeStyle = 'rgba(255,236,190,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(TX - T_RI, surf); c.lineTo(TX + T_RI, surf); c.stroke();
    if (ripple > 0.01 && ripple < 0.99) {
      c.strokeStyle = 'rgba(255,236,190,' + (0.85 * (1 - ripple)).toFixed(3) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(TX, surf, 6 + 22 * ripple, 2 + 3 * ripple, 0, 0, TAU); c.stroke();
    }
    c.restore();
    outer(); c.strokeStyle = 'rgba(11,26,21,0.8)'; c.lineWidth = 8; c.stroke();
    outer(); c.strokeStyle = 'rgba(200,236,246,0.92)'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.42)'; c.lineWidth = 3; c.beginPath(); c.moveTo(TX - T_R + 8, top + 14); c.lineTo(TX - T_R + 8, bot - T_R - 6); c.stroke();
    /* 管口唇邊 */
    c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 4; c.beginPath(); c.moveTo(TX - T_R - 4, top); c.lineTo(TX - T_R + 2, top); c.moveTo(TX + T_R - 2, top); c.lineTo(TX + T_R + 4, top); c.stroke();
  }

  /* 滴管尖端位置（第 3 步 u） */
  function tipAt(u) {
    const up = { x: TX, y: 140 }, dip = { x: TX, y: 312 }, over = { x: DOT.x, y: 330 };
    if (u < 2.8) return up;
    if (u < 3.7) { const k = ease(clamp01((u - 2.8) / 0.8)); return { x: up.x, y: lerp(up.y, dip.y, k) }; }
    if (u < 4.3) return dip;
    if (u < 4.9) { const k = ease(clamp01((u - 4.3) / 0.6)); return { x: up.x, y: lerp(dip.y, up.y, k) }; }
    if (u < 6.8) { const k = ease(clamp01((u - 4.9) / 1.0)); return { x: lerp(up.x, over.x, k), y: lerp(up.y, over.y, k) - 60 * Math.sin(Math.PI * k) }; }
    const k = ease(clamp01((u - 6.8) / 0.8)); return { x: over.x + 50 * k, y: over.y - 150 * k };
  }

  function step3(c, s) {
    if (s.n !== 3) return;
    const u = s.u;
    /* 聚光：只留收集管 */
    O1.spot(c, [{ x: COLX, y: 405, r: 56 }], { a: fin(s, 3, 0.6, 0.6) });
    const ar = grow(s, 3, 0.9, 1.5);
    if (ar > 0.01) M3.dashArrow(c, 492, 372, lerp(492, 566, ar), lerp(372, 300, ar), YEL, 1, s.t * 1.5);
    /* 放大的收集管＋試管座 */
    const ta = fin(s, 3, 1.0, 0.6), dy = 24 * (1 - ease(clamp01((u - 1.0) / 0.6)));
    withA(c, ta, () => {
      bigTube(c, dy, u > 3.6 ? clamp01((u - 3.6) / 0.9) : 0);
      M3.slab(c, 570, 420 + dy, 660, GY, 'wood', { seed: 3 });
    });
    P(c, fin(s, 3, 1.6, 0.4), L('收集管裡的液體', 'Collected liquid'), 668, 200, WHITE, 22, 'left');
    /* 藍色石蕊試紙 */
    const red = 1.25 * grow(s, 3, 6.6, 7.8);
    withA(c, fin(s, 3, 2.0, 0.4), () => O1.litmus(c, LIT.x, LIT.y, LIT.w, LIT.h, { k: red, cx: DOT.x, cy: DOT.y, wet: clamp01((u - 6.6) / 0.2) }));
    P(c, fin(s, 3, 2.3, 0.4), L('藍色石蕊試紙', 'Blue litmus paper'), 840, GY, TEAL, 22);
    /* 落下的液滴＋水花圈 */
    if (u > 6.3 && u < 6.6) {
      const k = (u - 6.3) / 0.3, y = lerp(334, LIT.y + 6, k * k);
      c.save(); c.fillStyle = ACID; c.strokeStyle = 'rgba(60,36,16,0.8)'; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(DOT.x, y, 4.5, 6, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
    }
    if (u > 6.6 && u < 7.4) {
      const k = (u - 6.6) / 0.8;
      c.save(); c.strokeStyle = 'rgba(255,236,190,' + (0.85 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(DOT.x, DOT.y, 8 + 26 * k, 4 + 8 * k, 0, 0, TAU); c.stroke(); c.restore();
    }
    /* 滴管：自己移動、自己擠 */
    const da = clamp01((u - 2.6) / 0.3) * (1 - clamp01((u - 7.2) / 0.4));
    if (da > 0.02) {
      const p = tipAt(u);
      const squeeze = u < 3.7 ? 1 : u < 4.3 ? 1 - ease(clamp01((u - 3.7) / 0.6)) : u < 6.0 ? 0 : u < 6.8 ? 0.6 * ease(clamp01((u - 6.0) / 0.3)) : 0.6 * (1 - ease(clamp01((u - 6.8) / 0.4)));
      const fill = u < 3.7 ? 0 : u < 6.0 ? 0.55 * ease(clamp01((u - 3.7) / 0.6)) : lerp(0.55, 0.42, ease(clamp01((u - 6.0) / 0.3)));
      const drop = u > 6.0 && u < 6.3 ? ease(clamp01((u - 6.0) / 0.3)) : 0;
      O1.dropper(c, p.x, p.y, { a: da, len: DROP_LEN, fill, col: ACID, squeeze, drop });
      /* 伸進液體的那段：疊一層液體色（只在管內、液面以下） */
      if (u > 3.2 && u < 4.9) {
        c.save(); c.beginPath(); c.rect(TX - T_RI, SURF, 2 * T_RI, TAR - SURF); c.clip();
        c.fillStyle = W5.rgba(ACID, 0.4); c.fillRect(p.x - 8, p.y - DROP_LEN, 16, DROP_LEN + 2); c.restore();
      }
    }
    /* 「醋酸」：引線指到管內液體 */
    const a1 = fin(s, 3, 8.0, 0.4);
    withA(c, a1, () => {
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(668, 318); c.lineTo(628, 318); c.stroke();
      c.strokeStyle = CORAL; c.lineWidth = 2; c.beginPath(); c.moveTo(668, 318); c.lineTo(628, 318); c.stroke();
      c.fillStyle = CORAL; c.beginPath(); c.arc(628, 318, 4, 0, TAU); c.fill(); c.restore();
    });
    P(c, a1, L('醋酸', 'Acetic acid'), 668, 318, CORAL, 22, 'left');
    P(c, fin(s, 3, 8.4, 0.4), L('變紅色', 'Turns red'), 840, 368, CORAL, 22);
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('白煙', 'White smoke'),
    () => L('黑煙', 'Black smoke'),
    () => L('醋酸與石蕊', 'Acetic acid and litmus')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 8.2, 0.6) * fout(s, 2, 0, 0.4), L('白煙：小水滴（水蒸氣遇冷凝結）', 'White smoke: tiny water droplets (water vapour condensing in the cold)'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.2, 0.6) * fout(s, 3, 0, 0.4), L('黑煙：碳顆粒', 'Black smoke: particles of carbon'), YEL, 480, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 9.0, 0.6), L('液體中的醋酸使藍色石蕊試紙變紅色', 'The acetic acid in the liquid turns blue litmus paper red'), YEL, 480, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    bench(c);
    rig(c, s);
    step3(c, s);
    magnifier(c, s);
    rigLabels(c, s);
    chain(c, s);
    sootLabel(c, s);
    texts(c, s);
  }

  W5.register('smoke', { canvas: 'cvs-smoke', steps: DUR, draw });
})();
