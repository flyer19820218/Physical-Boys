/* ==================================================================
   mechanics_3 ｜ 需要「增加」摩擦力：防止打滑（cvs-more，960×540）
   四步：1 鞋底紋路 → 2 輪胎胎紋 → 3 雪地加雪鏈 → 4 煞車皮
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   共同畫法：一半是生活物件，一半是放大鏡看接觸面（鋸齒沿用 micro 的 M3.teethPair／teethFill）。
   ・第 1、2 步：左右兩個「樣品台」（左＝光滑、會打滑；右＝有紋路、站得穩），中間一個放大鏡看「有紋路」那一邊的接觸面。
     紋路＝在鋸齒上再挖出一道道溝（treadProfile），鋸齒只在紋路塊的底面，咬進地面。
   ・第 3 步：雪地汽車。先空轉打滑 → 裝上雪鏈 → 咬住雪面往前開；右邊放大鏡看鏈條陷進雪面。
   ・第 4 步：腳踏車前輪特寫（M3.bikeWheel／bikeFork／rimBrake，新增在 common，less 沿用），
     右邊放大鏡＝正面剖面：兩片有紋路的煞車皮把輪圈夾住；輪子轉速漸慢到停，摩擦力箭頭沿輪圈切線。
   ・March 只用半身表情圖，從畫布底邊左右兩角升起（不放在地面上，避免穿幫）。
   ・換步時前一步的最後畫面淡出（0.6 秒）。摩擦力箭頭只比長短、不標數字（簡報沒有給數字）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.bikeWheel) return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, hash = W5.hash;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, DIM = COL.dim, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = COL.yellow, GRN = COL.green;
  const DUR = [11, 11, 12, 11];      /* 總長 45 秒 */
  const frac = x => x - Math.floor(x);

  /* ═══════════ 版面 ═══════════ */
  const FL = 330;                    /* 第 1、2 步樣品台的地面線 */
  const ZL = 180, ZR = 780, ZW = 150;   /* 左右樣品台中心、半寬 */
  const LENS = { x: 480, y: 212, r: 100 };   /* 第 1、2 步中間的放大鏡 */
  const MID_Y = 392;                 /* 放大鏡下方的重點字 */
  const BUST = { l: 86, r: 882, sc: 0.38 };

  /* 材質（本檔用） */
  const TILE = { fill: ['#e3ecf0', '#97aab4'], edge: '#ffffff', tex: 'glint', ink: 'rgba(255,255,255,0.6)' };
  const SNOW = { fill: ['#ffffff', '#b9d3e0'], edge: '#ffffff', tex: 'speck', ink: 'rgba(120,160,190,0.5)' };

  M3.preload(['struggling', 'normal']);

  /* ═══════════ 小工具 ═══════════ */
  /* 半身表情：從畫布底邊升起（rise 0..1） */
  function bust(c, pose, x, a, flip) {
    if (a <= 0.02) return;
    const P0 = M3.MARCH[pose];
    M3.march(c, pose, x, 540 + P0.h * BUST.sc * (1 - a), { sc: BUST.sc, a: Math.min(1, a * 1.5), flip });
  }
  /* 放大鏡從 A 飛到 B（z 0..1），回傳位置與半徑 */
  function lensPos(z, A, B) { return { x: lerp(A.x, B.x, z), y: lerp(A.y, B.y, z) - Math.sin(z * Math.PI) * 30, r: lerp(A.r, B.r, z) }; }
  /* 放大鏡到物件接觸點的虛線引線 */
  function leader(c, lx, ly, r, tx, ty, a) {
    withA(c, a, () => {
      const d = Math.hypot(tx - lx, ty - ly) || 1, sx = lx + (tx - lx) / d * (r + 12), sy = ly + (ty - ly) / d * (r + 12);
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.75)'; c.lineWidth = 2.5; c.setLineDash([7, 6]);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
      c.fillStyle = YEL; c.beginPath(); c.arc(tx, ty, 5, 0, TAU); c.fill(); c.restore();
    });
  }
  /* 紋路剖面：在上表面鋸齒 up 上挖出一道道溝（block 紋路塊寬、gap 溝寬、groove 溝頂 y、off 相位） */
  function inGap(x, o) { const per = o.block + o.gap; return ((x - o.off) % per + per) % per > o.block; }
  function treadProfile(up, o) {
    const out = []; let j = 0;
    for (let x = up[0].x; x <= up[up.length - 1].x; x += 3) {
      while (j < up.length - 2 && up[j + 1].x < x) j++;
      const A = up[j], B = up[j + 1], f = clamp01((x - A.x) / ((B.x - A.x) || 1));
      out.push({ x, y: inGap(x, o) ? o.groove : lerp(A.y, B.y, f) });
    }
    return out;
  }
  /* 地板樣品台（磁磚、濕）：x0..x1 */
  function tileSlab(c, x0, x1) {
    c.save();
    const g = c.createLinearGradient(0, FL, 0, FL + 40);
    g.addColorStop(0, '#c4d3da'); g.addColorStop(1, '#7c8f99');
    c.fillStyle = g; W5.rr(c, x0, FL, x1 - x0, 40, 6); c.fill();
    c.strokeStyle = 'rgba(70,90,100,0.6)'; c.lineWidth = 2;
    for (let x = x0 + 75; x < x1 - 10; x += 75) { c.beginPath(); c.moveTo(x, FL + 2); c.lineTo(x, FL + 38); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0 + 4, FL + 1); c.lineTo(x1 - 4, FL + 1); c.stroke();
    /* 水光反射 */
    c.strokeStyle = 'rgba(190,235,255,0.45)'; c.lineWidth = 3; c.lineCap = 'round';
    [[0.15, 12, 50], [0.55, 24, 70], [0.8, 10, 40]].forEach(([f, dy, w]) => { const x = lerp(x0, x1, f); c.beginPath(); c.moveTo(x, FL + dy); c.lineTo(x + w, FL + dy); c.stroke(); });
    c.restore();
  }
  /* 柏油路樣品台（濕）：shift＝路面小石子往左移的距離（車輪抓地往前滾） */
  function roadSlab(c, x0, x1, shift, seed) {
    c.save();
    const g = c.createLinearGradient(0, FL, 0, FL + 40);
    g.addColorStop(0, '#62686f'); g.addColorStop(1, '#30343a');
    c.fillStyle = g; W5.rr(c, x0, FL, x1 - x0, 40, 6); c.fill();
    c.save(); W5.rr(c, x0, FL, x1 - x0, 40, 6); c.clip();
    const w = x1 - x0;
    for (let i = 0; i < 46; i++) {
      const x = x0 + frac((hash(seed + i * 3.7) * w - shift) / w) * w, y = FL + 5 + 30 * hash(seed + i * 5.3);
      c.fillStyle = i % 3 ? 'rgba(200,205,210,0.45)' : 'rgba(20,22,25,0.6)';
      c.beginPath(); c.arc(x, y, 1.4 + 1.6 * hash(seed + i), 0, TAU); c.fill();
    }
    /* 白色車道線（看得出路面有沒有在動） */
    c.fillStyle = 'rgba(246,243,234,0.7)';
    for (let k = -1; k < 4; k++) { const x = x0 + frac((k * 110 - shift) / 330) * 330 - 30; c.fillRect(x, FL + 31, 46, 4); }
    c.restore();
    c.strokeStyle = 'rgba(207,212,216,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0 + 4, FL + 1); c.lineTo(x1 - 4, FL + 1); c.stroke();
    c.restore();
  }
  /* 地上的水窪 */
  function puddle(c, x, w) {
    c.save(); c.fillStyle = 'rgba(150,215,245,0.35)';
    c.beginPath(); c.ellipse(x, FL + 2, w, 6, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(220,245,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, FL + 2, w * 0.7, 3.5, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.restore();
  }
  /* 水花（x, y 發射點，dir 往哪邊噴，k 強度） */
  function splash(c, x, y, dir, k, u, seed, col) {
    if (k <= 0.02) return;
    c.save(); c.fillStyle = col || '#c6ecff';
    for (let i = 0; i < 9; i++) {
      const pp = frac(u * 1.6 + hash(seed + i * 3.3)), h = hash(seed + i * 7.1);
      const px = x + dir * (12 + 46 * h) * pp, py = y - (34 + 36 * hash(seed + i * 2.2)) * pp + 70 * pp * pp;
      c.globalAlpha = (1 - pp) * 0.85 * k; c.beginPath(); c.arc(px, py, 2.4 + 1.6 * h, 0, TAU); c.fill();
    }
    c.restore();
  }
  /* 從前一步最後畫面接過來時，整個場景淡入 */

  /* ═══════════ 鞋子（側視，鞋尖朝右；x＝鞋中心、by＝鞋底） ═══════════ */
  /* 皮鞋：光滑硬底（tilt＞0＝鞋尖翹起，繞鞋跟轉） */
  function dressShoe(c, x, by, tilt) {
    c.save(); c.translate(x - 98, by); c.rotate(-tilt); c.translate(98, 0);
    c.lineJoin = 'round';
    /* 鞋底（光滑、反光） */
    c.fillStyle = '#c79a63';
    c.beginPath(); c.moveTo(-98, -10); c.lineTo(102, -10); c.quadraticCurveTo(112, -8, 107, 0); c.lineTo(-52, 0);
    c.quadraticCurveTo(-58, -4, -64, -4); c.lineTo(-98, -4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,240,210,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-40, -1.5); c.lineTo(100, -1.5); c.stroke();
    c.fillStyle = '#2a1810'; W5.rr(c, -98, -12, 36, 12, 2); c.fill();
    /* 鞋面 */
    const g = c.createLinearGradient(0, -62, 0, -10);
    g.addColorStop(0, '#8e4c25'); g.addColorStop(1, '#4a2210');
    c.fillStyle = g; c.strokeStyle = '#22100a'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-96, -10); c.lineTo(-99, -46); c.quadraticCurveTo(-98, -60, -84, -62); c.lineTo(-44, -56);
    c.quadraticCurveTo(-24, -54, -10, -50); c.quadraticCurveTo(36, -40, 76, -30); c.quadraticCurveTo(108, -22, 106, -10); c.closePath(); c.fill(); c.stroke();
    /* 鞋口 */
    c.fillStyle = '#1d0e07'; c.beginPath(); c.moveTo(-84, -61); c.quadraticCurveTo(-62, -66, -44, -56); c.quadraticCurveTo(-62, -57, -84, -57); c.closePath(); c.fill();
    /* 鞋帶 */
    c.strokeStyle = '#efe2c4'; c.lineWidth = 2.5; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const lx = -30 + i * 11; c.beginPath(); c.moveTo(lx, -53 + i * 2.6); c.lineTo(lx + 10, -47 + i * 2.6); c.stroke(); }
    /* 縫線、亮面 */
    c.setLineDash([5, 4]); c.strokeStyle = 'rgba(230,190,140,0.7)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-92, -15); c.lineTo(100, -15); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(50, -36); c.quadraticCurveTo(86, -29, 99, -17); c.stroke();
    c.beginPath(); c.moveTo(-94, -42); c.lineTo(-92, -24); c.stroke();
    c.restore();
  }
  /* 運動鞋：厚底、底部一塊塊防滑紋 */
  function sneaker(c, x, by) {
    c.save(); c.translate(x, by); c.lineJoin = 'round';
    /* 大底＋防滑塊 */
    c.fillStyle = '#23262d'; W5.rr(c, -102, -17, 214, 11, 4); c.fill();
    for (let lx = -99; lx < 104; lx += 19) { W5.rr(c, lx, -8, 12, 8, 2); c.fill(); }
    /* 中底 */
    c.fillStyle = '#f4f1e8'; c.strokeStyle = '#8a8f96'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-104, -31); c.lineTo(100, -31); c.quadraticCurveTo(115, -29, 112, -16); c.lineTo(-104, -16); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,108,240,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-96, -23); c.lineTo(104, -23); c.stroke();
    /* 鞋面 */
    const g = c.createLinearGradient(0, -96, 0, -30);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c6d0da');
    c.fillStyle = g; c.strokeStyle = '#3a4656'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-102, -31); c.lineTo(-104, -72); c.quadraticCurveTo(-102, -90, -86, -90); c.lineTo(-56, -84);
    c.quadraticCurveTo(-40, -100, -20, -96); c.lineTo(-8, -82); c.quadraticCurveTo(40, -58, 86, -45); c.quadraticCurveTo(112, -39, 110, -31); c.closePath(); c.fill(); c.stroke();
    /* 鞋頭包覆 */
    c.fillStyle = '#d6dde4'; c.beginPath(); c.moveTo(58, -31); c.quadraticCurveTo(62, -50, 86, -45); c.quadraticCurveTo(112, -39, 110, -31); c.closePath(); c.fill();
    /* 側邊色條、後跟拉環 */
    c.fillStyle = '#7a6cf0';
    c.beginPath(); c.moveTo(-72, -35); c.quadraticCurveTo(-20, -40, 30, -64); c.lineTo(40, -56); c.quadraticCurveTo(-8, -35, -50, -33); c.closePath(); c.fill();
    W5.rr(c, -109, -88, 13, 30, 4); c.fill();
    /* 鞋口、鞋帶 */
    c.fillStyle = '#2a3440'; c.beginPath(); c.moveTo(-86, -89); c.quadraticCurveTo(-70, -94, -56, -84); c.quadraticCurveTo(-72, -84, -86, -86); c.closePath(); c.fill();
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = -16 + i * 14, ly = -84 + i * 8;
      c.strokeStyle = '#3a4656'; c.lineWidth = 5; c.beginPath(); c.moveTo(lx - 7, ly - 5); c.lineTo(lx + 7, ly + 4); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(lx - 7, ly - 5); c.lineTo(lx + 7, ly + 4); c.stroke();
    }
    c.restore();
  }

  /* ═══════════ 放大鏡裡的「紋路咬住地面」（第 1、2 步共用畫法） ═══════════ */
  function makeGrip(seed, lowO, tr) {
    const pair = M3.teethPair(seed, -150, 150, lowO.base, lowO);
    const up = treadProfile(pair.up, tr);
    const contacts = pair.contacts.filter(p => !inGap(p.x - 4, tr) && !inGap(p.x + 4, tr) && Math.abs(p.x) < 84);
    return { low: pair.low, up, contacts, tr };
  }
  const GRIP1 = makeGrip(13, { base: 46, period: 30, amp: 26, jit: 0.6, bite: 1, clear: 4, dipMin: 0.15, dipMax: 0.35 }, { block: 46, gap: 24, groove: -14, off: -12 });
  const GRIP2 = makeGrip(29, { base: 50, period: 34, amp: 30, jit: 0.7, bite: 1, clear: 4, dipMin: 0.15, dipMax: 0.35 }, { block: 58, gap: 30, groove: -24, off: -20 });
  /* lowMat 地面材質；drop 0..1 紋路壓下去；flashA 接觸點閃光 */
  function gripLens(c, s, G, lx, ly, r, lowMat, drop, flashA) {
    M3.magnifier(c, lx, ly, r, {
      rim: 9, handle: -0.75, inner: cc => {
        const k = r / LENS.r;
        cc.save(); cc.translate(lx, ly); cc.scale(k, k);
        cc.fillStyle = '#16302a'; cc.fillRect(-120, -120, 240, 240);
        M3.teethFill(cc, G.low, 160, lowMat, { seed: 4, lw: 1 / Math.max(0.3, k) });
        M3.teethFill(cc, G.up, -200, 'rubber', { seed: 8, dy: -30 * (1 - drop), lw: 1 / Math.max(0.3, k) });
        if (flashA > 0.02) G.contacts.forEach((p, i) => M3.flash(cc, p.x, p.y, 15, YEL, flashA * (0.7 + 0.3 * Math.sin(s.u * 6 + i * 1.7)), i));
        cc.restore();
      }
    });
  }

  /* ═══════════ 第 1 步：鞋底紋路 ═══════════ */
  function step1(c, s) {
    const n = 1, u = s.u;
    M3.backdrop(c, { gy: FL, cell: 40, glow: COL.teal });
    M3.ground(c, FL);
    tileSlab(c, ZL - ZW, ZL + ZW); tileSlab(c, ZR - ZW, ZR + ZW);
    /* 左：光滑皮鞋在濕地板上滑來滑去 */
    const sl = grow(s, n, 0.9, 1.6), ph = (u - 0.9) * TAU / 2.0;
    const off = 30 * Math.sin(ph) * sl, vel = Math.cos(ph) * sl, tilt = 0.12 * Math.max(0, Math.sin(ph)) * sl;
    puddle(c, ZL, 120);
    M3.speedLines(c, ZL + off - Math.sign(vel || 1) * 112, FL - 42, 50, 46, Math.abs(vel) * 0.9, vel >= 0 ? -1 : 1);
    dressShoe(c, ZL + off, FL, tilt);
    splash(c, ZL + off + (vel >= 0 ? 104 : -96), FL - 2, vel >= 0 ? 1 : -1, Math.abs(vel) * sl, u, 3);
    /* 右：紋路運動鞋站得穩 */
    puddle(c, ZR, 110);
    sneaker(c, ZR, FL);
    const la = fin(s, n, 0.8, 0.5);
    P(c, la, L('光滑鞋底', 'Smooth sole'), ZL, 190, WHITE, 22);
    P(c, la, L('紋路鞋底', 'Treaded sole'), ZR, 190, WHITE, 22);
    P(c, fin(s, n, 2.0, 0.4), L('打滑！', 'Slipping!'), ZL, 398, FR, 22);
    P(c, fin(s, n, 2.4, 0.4), L('站得穩', 'Steady'), ZR, 398, GRN, 22);
    bust(c, 'struggling', BUST.l, fin(s, n, 1.4, 0.6), true);
    bust(c, 'normal', BUST.r, fin(s, n, 2.2, 0.6));
    /* 放大鏡：從運動鞋底飛到中間 */
    const z = ease(seg(u, 3.2, 4.4)), lp = lensPos(z, { x: ZR - 20, y: FL - 4, r: 22 }, LENS), lA = fin(s, n, 3.2, 0.3);
    leader(c, lp.x, lp.y, lp.r, ZR - 40, FL - 3, lA * clamp01((z - 0.4) / 0.6));
    if (lA > 0.02) withA(c, lA, () => gripLens(c, s, GRIP1, lp.x, lp.y, lp.r, TILE, ease(seg(u, 4.8, 5.8)), fin(s, n, 5.8, 0.3)));
    const ia = fin(s, n, 5.0, 0.5);
    P(c, ia, L('鞋底', 'Sole'), LENS.x, LENS.y - 58, WHITE, 20);
    P(c, ia, L('地面', 'Floor'), LENS.x, LENS.y + 66, WHITE, 20);
    P(c, fin(s, n, 6.4, 0.5), L('紋路鞋底咬住地面', 'Tread grips the floor'), LENS.x, MID_Y, YEL, 22);
    P(c, fin(s, n, 0.3, 0.5), L('鞋底紋路', 'Shoe tread'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.0, 0.5), L('增加摩擦力，防止打滑', 'More friction stops slipping'), WHITE);
  }

  /* ═══════════ 第 2 步：輪胎胎紋 ═══════════ */
  const WR = 95;
  function step2(c, s) {
    const n = 2, u = s.u;
    M3.backdrop(c, { gy: FL, cell: 40, glow: COL.teal });
    M3.ground(c, FL);
    /* 右：深胎紋，滾得動 → 路面往後移 */
    const wR = 2.4, shift = wR * WR * Math.max(0, u - 0.6);
    roadSlab(c, ZL - ZW, ZL + ZW, 0, 11); roadSlab(c, ZR - ZW, ZR + ZW, shift, 23);
    puddle(c, ZL, 120);
    /* 左：光滑胎，原地空轉（轉很快、路面沒動） */
    const spin = grow(s, n, 0.6, 1.4), angL = 10 * Math.max(0, u - 0.6) * spin;
    const wob = M3.shake(u, 2.2 * spin, 26);
    M3.bikeWheel(c, ZL + wob, FL - WR, WR, { ang: angL, tread: 'smooth', blur: 0.85 * spin });
    splash(c, ZL - 10, FL - 3, -1, spin, u, 7);
    const kn = WR * 0.11 * 0.42;
    M3.bikeWheel(c, ZR, FL - WR - kn, WR, { ang: wR * Math.max(0, u - 0.6), tread: 'knobby' });
    const la = fin(s, n, 0.6, 0.5);
    P(c, la, L('光滑胎', 'Bald tyre'), ZL, 112, WHITE, 22);
    P(c, la, L('深胎紋', 'Deep tread'), ZR, 112, WHITE, 22);
    /* 摩擦力：接觸點往前（右），胎紋的長很多（只比長短） */
    const ga = grow(s, n, 2.8, 3.8);
    M3.force(c, { x: ZL, y: FL + 18, dir: 'right', val: 34, k: 1, col: FR, grow: ga, lab: null, lw: 7 });
    M3.force(c, { x: ZR, y: FL + 18, dir: 'right', val: 140, k: 1, col: FR, grow: ga, lab: null, lw: 7 });
    P(c, fin(s, n, 3.6, 0.4), L('摩擦力小 → 打滑', 'Small friction → slips'), ZL, 398, FR, 22);
    P(c, fin(s, n, 4.0, 0.4), L('摩擦力大 → 抓得住', 'Big friction → grips'), ZR, 398, FR, 22);
    bust(c, 'struggling', BUST.l, fin(s, n, 1.2, 0.6), true);
    bust(c, 'normal', BUST.r, fin(s, n, 1.8, 0.6));
    /* 放大鏡：胎紋剖面咬住路面 */
    const z = ease(seg(u, 4.4, 5.6)), lp = lensPos(z, { x: ZR, y: FL - 4, r: 22 }, LENS), lA = fin(s, n, 4.4, 0.3);
    leader(c, lp.x, lp.y, lp.r, ZR - 18, FL - 3, lA * clamp01((z - 0.4) / 0.6));
    if (lA > 0.02) withA(c, lA, () => gripLens(c, s, GRIP2, lp.x, lp.y, lp.r, 'asphalt', ease(seg(u, 5.8, 6.6)), fin(s, n, 6.6, 0.3)));
    const ia = fin(s, n, 6.0, 0.5);
    P(c, ia, L('胎紋', 'Tread'), LENS.x, LENS.y - 62, WHITE, 20);
    P(c, ia, L('路面', 'Road'), LENS.x, LENS.y + 68, WHITE, 20);
    P(c, fin(s, n, 7.0, 0.5), L('胎紋咬住路面', 'Tread grips the road'), LENS.x, MID_Y, YEL, 22);
    P(c, fin(s, n, 0.3, 0.5), L('輪胎胎紋', 'Tyre tread'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.4, 0.5), L('增加摩擦力，騎車不打滑', 'More friction, no slipping on the bike'), WHITE);
  }

  /* ═══════════ 第 3 步：雪地加雪鏈 ═══════════ */
  const SG = 400, CW = 38, CX0 = 230, CX1 = 450;
  const L3 = { x: 765, y: 232, r: 110 };
  const carX = u => CX0 + (CX1 - CX0) * ease(seg(u, 5.8, 11.0));
  const spinW = u => 13 * seg(u, 0.6, 1.2) * (1 - seg(u, 3.4, 3.9));
  function spinAng(u) {                     /* 空轉角度＝角速度對時間積分（純函式：每次從 0 加起） */
    let a = 0; const end = Math.min(u, 4); for (let t = 0; t < end; t += 1 / 60) a += spinW(t) / 60; return a;
  }
  /* 汽車車輪（側視）：ang 轉角、ck 雪鏈裝上的比例 0..1 */
  function carWheel(c, x, y, ang, ck) {
    c.save();
    c.fillStyle = '#1f2228'; c.beginPath(); c.arc(x, y, CW, 0, TAU); c.fill();
    c.strokeStyle = '#3a3f49'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, CW - 4, 0, TAU); c.stroke();
    const g = c.createRadialGradient(x - 6, y - 6, 2, x, y, 22);
    g.addColorStop(0, '#f2f5f7'); g.addColorStop(1, '#7d8a92');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 21, 0, TAU); c.fill();
    c.strokeStyle = '#4b565d'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const q = ang + i * TAU / 5; c.beginPath(); c.moveTo(x + Math.cos(q) * 5, y + Math.sin(q) * 5); c.lineTo(x + Math.cos(q) * 19, y + Math.sin(q) * 19); c.stroke(); }
    c.fillStyle = '#39444b'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
    /* 雪鏈：側邊一圈鏈條＋跨過胎面的橫鏈 */
    if (ck > 0.01) {
      const N = 10;
      for (let i = 0; i < N; i++) {
        const show = clamp01(ck * N - i); if (show <= 0) continue;
        const q = ang + i * TAU / N;
        c.save(); c.globalAlpha *= show;
        c.strokeStyle = '#dfe7ec'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(x, y, 30, q, q + TAU / N); c.stroke();
        c.translate(x + Math.cos(q) * (CW + 1), y + Math.sin(q) * (CW + 1)); c.rotate(q);
        c.fillStyle = '#c9d3d9'; c.strokeStyle = '#4b565d'; c.lineWidth = 1.5;
        W5.rr(c, -4, -7, 8, 14, 3); c.fill(); c.stroke();
        c.restore();
      }
    }
    c.restore();
  }
  function car(c, x, ang, ck, dy) {
    const y = SG + dy, wy = y - CW + 5;
    c.save(); c.lineJoin = 'round';
    /* 車身 */
    const g = c.createLinearGradient(0, y - 130, 0, y - 24);
    g.addColorStop(0, '#4f86d6'); g.addColorStop(1, '#244a8a');
    c.fillStyle = g; c.strokeStyle = '#13284a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 152, y - 30); c.lineTo(x - 158, y - 72); c.quadraticCurveTo(x - 156, y - 82, x - 132, y - 84);
    c.lineTo(x - 104, y - 128); c.quadraticCurveTo(x - 96, y - 134, x - 80, y - 134); c.lineTo(x + 26, y - 134);
    c.quadraticCurveTo(x + 40, y - 134, x + 52, y - 124); c.lineTo(x + 84, y - 88); c.lineTo(x + 140, y - 78);
    c.quadraticCurveTo(x + 160, y - 74, x + 160, y - 52); c.lineTo(x + 156, y - 30); c.closePath(); c.fill(); c.stroke();
    /* 車窗 */
    c.fillStyle = '#a9dcf2';
    c.beginPath(); c.moveTo(x - 96, y - 88); c.lineTo(x - 78, y - 124); c.lineTo(x - 30, y - 124); c.lineTo(x - 30, y - 88); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x - 20, y - 88); c.lineTo(x - 20, y - 124); c.lineTo(x + 24, y - 124); c.quadraticCurveTo(x + 34, y - 124, x + 42, y - 116); c.lineTo(x + 70, y - 88); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 70, y - 92); c.lineTo(x - 56, y - 118); c.moveTo(x + 4, y - 92); c.lineTo(x + 18, y - 118); c.stroke();
    /* 車門線、把手、燈、保險桿 */
    c.strokeStyle = 'rgba(19,40,74,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - 25, y - 86); c.lineTo(x - 25, y - 34); c.moveTo(x + 74, y - 86); c.lineTo(x + 70, y - 34); c.stroke();
    c.fillStyle = '#dfe7ec'; W5.rr(c, x - 60, y - 76, 18, 5, 2); c.fill(); W5.rr(c, x + 34, y - 76, 18, 5, 2); c.fill();
    W5.glow(c, x + 156, y - 62, 30, COL.yellow, 0.45);
    c.fillStyle = '#fff3b0'; W5.rr(c, x + 148, y - 68, 12, 12, 3); c.fill();
    c.fillStyle = '#ff5a4d'; W5.rr(c, x - 160, y - 72, 9, 16, 3); c.fill();
    c.fillStyle = '#3a3f49'; W5.rr(c, x - 162, y - 38, 30, 10, 4); c.fill(); W5.rr(c, x + 132, y - 38, 30, 10, 4); c.fill();
    /* 車頂積雪 */
    c.fillStyle = '#f4fbff';
    c.beginPath(); c.moveTo(x - 92, y - 133); c.quadraticCurveTo(x - 60, y - 150, x - 20, y - 141); c.quadraticCurveTo(x + 10, y - 150, x + 34, y - 133); c.closePath(); c.fill();
    /* 輪拱 */
    c.fillStyle = '#152238';
    [x - 100, x + 100].forEach(wx => { c.beginPath(); c.arc(wx, wy, CW + 7, Math.PI, TAU); c.fill(); });
    c.restore();
    carWheel(c, x - 100, wy, ang, ck);
    carWheel(c, x + 100, wy, ang, ck);
    return { rearX: x - 100, frontX: x + 100, wy };
  }
  /* 雪地 */
  function snowGround(c, u) {
    c.save();
    const g = c.createLinearGradient(0, SG, 0, 540);
    g.addColorStop(0, '#d3e4ec'); g.addColorStop(1, '#7c9cad');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 540); c.lineTo(0, SG);
    for (let x = 0; x <= 960; x += 24) c.lineTo(x, SG + 2 * Math.sin(x * 0.03) * (x > 40 && x < 920 ? 0.5 : 1));
    c.lineTo(960, 540); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, SG); c.lineTo(960, SG); c.stroke();
    /* 遠方雪堆 */
    c.fillStyle = 'rgba(220,236,244,0.16)';
    [[120, 70], [420, 50], [840, 80]].forEach(([x, h]) => { c.beginPath(); c.ellipse(x, SG, 160, h, 0, Math.PI, TAU); c.fill(); });
    c.restore();
  }
  function snowflakes(c, u) {
    c.save(); c.fillStyle = 'rgba(246,250,255,0.55)';
    for (let i = 0; i < 28; i++) {
      const x = frac(hash(i * 1.7) + 0.012 * Math.sin(u * 0.8 + i)) * 960, y = 40 + frac(hash(i * 3.1 + 7) + u * (0.05 + 0.04 * hash(i + 3))) * (SG - 40);
      c.beginPath(); c.arc(x, y, 1.5 + 1.8 * hash(i + 11), 0, TAU); c.fill();
    }
    c.restore();
  }
  /* 放大鏡裡：雪面＋輪胎（空轉時胎面往左溜）＋雪鏈（陷進雪面） */
  const SNOWP = M3.teethPair(51, -120, 120, 34, { period: 22, amp: 11, jit: 0.8, bite: 0.5, clear: 3 });
  const CZ = 1.6;                            /* 放大鏡裡再放大一點，鏈環才看得清楚 */
  function chainLens(c, s, lx, ly, r, slip, ck, sink, flashA) {
    M3.magnifier(c, lx, ly, r, {
      rim: 9, handle: -0.75, inner: cc => {
        const k = r / L3.r * CZ, lw = 1 / Math.max(0.3, k);
        cc.save(); cc.translate(lx, ly + 8); cc.scale(k, k); cc.translate(0, -22);
        cc.fillStyle = '#16302a'; cc.fillRect(-130, -130, 260, 260);
        M3.teethFill(cc, SNOWP.low, 140, SNOW, { seed: 4, lw });
        const xs = [-70, 20, 110];
        const appear = i => clamp01(ck * 3 - i * 0.8 - 0.2);
        /* 鏈條把雪壓出凹痕、旁邊擠出雪屑 */
        xs.forEach((x, i) => {
          if (appear(i) <= 0 || sink < 0.5) return;
          cc.fillStyle = 'rgba(120,158,180,0.85)';
          cc.beginPath(); cc.ellipse(x, 26 + sink * 0.5, 40, 4 + sink * 0.6, 0, 0, TAU); cc.fill();
          cc.fillStyle = '#ffffff';
          [-44, -48, 44, 49].forEach((dx, j) => { cc.beginPath(); cc.arc(x + dx, 23 - sink * 0.3 - (j % 2) * 4, 2.5 + sink * 0.2, 0, TAU); cc.fill(); });
        });
        /* 胎面（週期花紋，空轉時往左溜） */
        const pts = [];
        for (let x = -130; x <= 130; x += 3) pts.push({ x, y: 15 + 2 * Math.sin((x + slip) * TAU / 18) });
        M3.teethFill(cc, pts, -200, 'rubber', { seed: 8, lw });
        /* 橫鏈：環－條－環，貼著胎面，裝好後往下陷進雪裡 */
        xs.forEach((x, i) => {
          const a = appear(i); if (a <= 0) return;
          const cy = 22 + sink - 14 * (1 - a);
          cc.save(); cc.globalAlpha *= a;
          const gg = cc.createLinearGradient(0, cy - 8, 0, cy + 8);
          gg.addColorStop(0, '#f4f7f8'); gg.addColorStop(1, '#6f7c84');
          [-22, 22].forEach(dx => {
            cc.strokeStyle = '#2f393f'; cc.lineWidth = 7 * Math.min(1.4, lw);
            cc.beginPath(); cc.ellipse(x + dx, cy, 13, 7, 0, 0, TAU); cc.stroke();
            cc.strokeStyle = gg; cc.lineWidth = 4.5 * Math.min(1.4, lw);
            cc.beginPath(); cc.ellipse(x + dx, cy, 13, 7, 0, 0, TAU); cc.stroke();
          });
          cc.fillStyle = gg; cc.strokeStyle = '#2f393f'; cc.lineWidth = 1.5 * lw;
          W5.rr(cc, x - 12, cy - 4, 24, 8, 3); cc.fill(); cc.stroke();
          cc.restore();
          if (flashA > 0.02) [-22, 22].forEach((dx, j) => M3.flash(cc, x + dx, cy + 7, 9, YEL, flashA * (0.7 + 0.3 * Math.sin(s.u * 6 + i + j * 2)), i + j));
        });
        cc.restore();
      }
    });
  }
  function step3(c, s) {
    const n = 3, u = s.u;
    M3.backdrop(c, { gy: SG, cell: 40, glow: '#bfe9f5' });
    snowGround(c, u);
    const sw = spinW(u), spinK = sw / 13, sa = spinAng(u);
    const x = carX(u), ang = sa + (x - CX0) / CW, ck = seg(u, 4.0, 5.4);
    /* 空轉挖出的凹坑、開走後的鏈條壓痕 */
    const dig = seg(u, 0.8, 3.6);
    c.save(); c.fillStyle = 'rgba(110,145,165,0.55)';
    [CX0 - 100, CX0 + 100].forEach(wx => { c.beginPath(); c.ellipse(wx, SG + 2, 34, 3 + 6 * dig, 0, 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(90,125,145,0.6)';
    [CX0 - 100, CX0 + 100].forEach(w0 => { for (let tx = w0; tx < w0 + (x - CX0) - 30; tx += 14) c.fillRect(tx, SG + 1, 5, 6); });
    c.restore();
    const shY = M3.shake(u, 1.6 * spinK, 30);
    const cr = car(c, x + M3.shake(u, 1.5 * spinK, 23, 2), ang, ck, shY);
    /* 空轉時雪往後噴 */
    [cr.rearX, cr.frontX].forEach((wx, i) => splash(c, wx - 30, SG - 6, -1, spinK, u, 31 + i * 9, '#f4fbff'));
    /* 摩擦力：空轉時很小、裝雪鏈後很大（都朝前、只比長短） */
    const fA = grow(s, n, 1.6, 2.2) * fout(s, n, 3.8, 0.4);
    M3.force(c, { x: cr.rearX, y: SG + 22, dir: 'right', val: 22, k: 1, col: FR, a: fA, lab: 'below', name: L('摩擦力', 'Friction'), num: false, la: fA, lw: 7 });
    const fC = grow(s, n, 6.0, 6.8);
    M3.force(c, { x: cr.rearX, y: SG + 22, dir: 'right', val: 120, k: 1, col: FR, grow: fC, lab: 'below', name: L('摩擦力', 'Friction'), num: false, lw: 7 });
    snowflakes(c, u);
    /* 狀態字 */
    P(c, fin(s, n, 0.9, 0.4) * fout(s, n, 3.9, 0.3), L('沒有雪鏈：輪子空轉', 'No chains: the wheels spin'), 480, M3.Q_Y, FR, 22);
    P(c, fin(s, n, 4.1, 0.3) * fout(s, n, 5.7, 0.3), L('裝上雪鏈', 'Put on snow chains'), 480, M3.Q_Y, WHITE, 22);
    P(c, fin(s, n, 6.0, 0.4), L('雪鏈咬住雪面，車子前進', 'Chains grip the snow, the car moves'), 480, M3.Q_Y, GRN, 22);
    /* 放大鏡：從前輪接觸點飛到右邊 */
    const z = ease(seg(u, 1.8, 2.9)), lp = lensPos(z, { x: cr.frontX, y: SG - 2, r: 20 }, L3), lA = fin(s, n, 1.8, 0.3);
    leader(c, lp.x, lp.y, lp.r, cr.frontX, SG - 2, lA * clamp01((z - 0.4) / 0.6));
    const slip = sa * 30;
    if (lA > 0.02) withA(c, lA, () => chainLens(c, s, lp.x, lp.y, lp.r, slip, ck, 12 * ease(seg(u, 5.0, 6.0)), fin(s, n, 6.2, 0.3)));
    const ia = fin(s, n, 3.0, 0.5);
    P(c, ia, L('輪胎', 'Tyre'), L3.x, L3.y - 62, WHITE, 20);
    P(c, ia, L('雪', 'Snow'), L3.x, L3.y + 74, WHITE, 20);
    P(c, fin(s, n, 3.0, 0.4) * fout(s, n, 4.6, 0.3), L('輪胎在雪上打滑', 'The tyre slides on snow'), L3.x, 382, FR, 22);
    P(c, fin(s, n, 6.6, 0.5), L('雪鏈陷進雪面，咬得更深', 'Chains dig deep into the snow'), L3.x, 382, YEL, 22);
    bust(c, 'struggling', BUST.r, fin(s, n, 1.4, 0.6) * fout(s, n, 5.8, 0.4));
    bust(c, 'normal', BUST.r, fin(s, n, 6.2, 0.6));
    P(c, fin(s, n, 0.3, 0.5), L('雪地加雪鏈', 'Snow chains'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 9.0, 0.5), L('增加摩擦力，雪地也能前進', 'More friction, moving on snow'), WHITE);
  }

  /* ═══════════ 第 4 步：煞車皮 ═══════════ */
  const WC = { x: 300, y: 290, r: 165 };
  const L4 = { x: 725, y: 262, r: 128 };
  const W0 = 7, TB = 3.0, DB = 4.2;          /* 角速度、捏煞車時間、減速到停的秒數 */
  const wheelW = u => (u < TB ? W0 : W0 * Math.max(0, 1 - (u - TB) / DB));
  const wheelAng = u => { if (u < TB) return W0 * u; const t = Math.min(u - TB, DB); return W0 * TB + W0 * (t - t * t / (2 * DB)); };
  /* 正面剖面：輪圈夾在兩片有紋路的煞車皮中間；sq 夾緊 0..1、push 夾緊力箭頭長出 0..1 */
  function brakeLens(c, s, lx, ly, r, sq, push, flashA) {
    M3.magnifier(c, lx, ly, r, {
      rim: 9, handle: -0.75, inner: cc => {
        const k = r / L4.r * 1.2, lw = 1 / Math.max(0.3, k);
        cc.save(); cc.translate(lx, ly - 10 * r / L4.r); cc.scale(k, k); cc.translate(0, 40);
        cc.fillStyle = '#16302a'; cc.fillRect(-140, -140, 280, 280);
        /* 輻條、輪胎 */
        cc.strokeStyle = '#c7d0d5'; cc.lineWidth = 3 * lw; cc.beginPath(); cc.moveTo(0, 50); cc.lineTo(0, 140); cc.stroke();
        const tg = cc.createRadialGradient(-8, -120, 4, 0, -112, 40);
        tg.addColorStop(0, '#4a505c'); tg.addColorStop(1, '#1f2228');
        cc.fillStyle = tg; cc.beginPath(); cc.ellipse(0, -114, 31, 34, 0, 0, TAU); cc.fill();
        /* 輪圈剖面 */
        const rg = cc.createLinearGradient(-20, 0, 20, 0);
        rg.addColorStop(0, '#8c99a1'); rg.addColorStop(0.5, '#eef3f5'); rg.addColorStop(1, '#8c99a1');
        cc.fillStyle = rg; cc.strokeStyle = '#4b565d'; cc.lineWidth = 2 * lw;
        cc.beginPath(); cc.moveTo(-23, -88); cc.lineTo(-20, -80); cc.lineTo(-20, -8); cc.quadraticCurveTo(-18, 30, -6, 52); cc.lineTo(6, 52);
        cc.quadraticCurveTo(18, 30, 20, -8); cc.lineTo(20, -80); cc.lineTo(23, -88); cc.lineTo(14, -84); cc.lineTo(-14, -84); cc.closePath(); cc.fill(); cc.stroke();
        cc.fillStyle = 'rgba(60,72,80,0.6)'; cc.fillRect(-12, -70, 24, 50);
        /* 兩片煞車皮（齒＝溝紋），從兩側夾過來 */
        const g = 34 * (1 - sq);
        [-1, 1].forEach(sd => {
          const F = sd * (20 + g + 8), O = sd * (20 + g + 32), xl = Math.min(F, O);
          /* 夾器臂 */
          cc.strokeStyle = '#9aa6ad'; cc.lineWidth = 7 * lw; cc.lineCap = 'round';
          cc.beginPath(); cc.moveTo(O + sd * 6, -60); cc.quadraticCurveTo(sd * 76, -118, 0, -134); cc.stroke();
          cc.fillStyle = '#9aa6ad'; cc.fillRect(Math.min(O, O + sd * 9), -76, 9, 64);
          /* 煞車皮本體＋齒 */
          cc.fillStyle = '#4a505c'; cc.strokeStyle = '#a3acbe'; cc.lineWidth = 1.5 * lw;
          cc.fillRect(xl, -74, 24, 60); cc.strokeRect(xl, -74, 24, 60);
          for (let yy = -74; yy < -16; yy += 12) {
            const x0 = Math.min(F, sd * (20 + g));
            cc.fillRect(x0, yy + 2.5, 8.5, 7); cc.strokeRect(x0, yy + 2.5, 8.5, 7);
          }
          if (flashA > 0.02) for (let yy = -74, i = 0; yy < -16; yy += 24, i++) M3.flash(cc, sd * 20, yy + 6, 10, YEL, flashA * (0.65 + 0.35 * Math.sin(s.u * 8 + i * 1.9 + sd)), i);
          /* 夾緊的力（青） */
          if (push > 0.01) M3.arrowFx(cc, sd * 106, -44, sd * (106 - (106 - Math.abs(O) - 20) * push), -44, PUSH, 1, 6 * lw);
        });
        cc.restore();
      }
    });
  }
  function step4(c, s) {
    const n = 4, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: COL.teal, gyGlow: 290 });
    const w = wheelW(u), ang = wheelAng(u), sq = ease(seg(u, 2.6, 3.0));
    /* 轉動方向（虛線弧＋箭頭），越慢越淡 */
    withA(c, (w / W0) * fin(s, n, 0.4, 0.4), () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.8)'; c.lineWidth = 4; c.setLineDash([12, 9]); c.lineDashOffset = -ang * 30;
      c.beginPath(); c.arc(WC.x, WC.y, WC.r + 24, 0.1, 0.95); c.stroke(); c.setLineDash([]);
      const q = 0.95, ex = WC.x + Math.cos(q) * (WC.r + 24), ey = WC.y + Math.sin(q) * (WC.r + 24);
      W5.arrow(c, ex + Math.sin(q) * 2, ey - Math.cos(q) * 2, ex - Math.sin(q) * 14, ey + Math.cos(q) * 14, 'rgba(246,243,234,0.9)', 4, 16);
      c.restore();
    });
    M3.bikeWheel(c, WC.x, WC.y, WC.r, { ang, tread: 'road', blur: 0.9 * w / W0 });
    M3.bikeFork(c, WC.x, WC.y, WC.r, { up: 30 });
    const bk = M3.rimBrake(c, WC.x, WC.y, WC.r, { squeeze: sq });
    /* 煞車時接觸點冒小火花 */
    const rub = sq * (w / W0);
    for (let i = 0; i < 3; i++) M3.flash(c, lerp(bk.x0, bk.x1, frac(u * 1.7 + i * 0.37)), bk.y + 4, 10, YEL, rub * (0.5 + 0.5 * Math.sin(u * 13 + i * 2)), u * 2 + i);
    /* 摩擦力沿輪圈切線，與輪圈運動方向相反（輪子上緣往右轉 → 摩擦力向左）；停下來後消失 */
    const fa = 1 - ease(seg(u, TB + DB, TB + DB + 0.6));
    M3.force(c, { x: bk.x0 - 2, y: bk.y, dir: 'left', val: 120, k: 1, col: FR, grow: grow(s, n, 3.1, 3.9), a: fa, lab: 'above', name: L('摩擦力', 'Friction'), num: false, dx: -10, lw: 8 });
    /* 放大鏡（正面剖面） */
    const z = ease(seg(u, 2.0, 3.0)), lp = lensPos(z, { x: bk.x, y: bk.y, r: 20 }, L4), lA = fin(s, n, 2.0, 0.3);
    leader(c, lp.x, lp.y, lp.r, bk.x1 + 4, bk.y, lA * clamp01((z - 0.4) / 0.6));
    if (lA > 0.02) withA(c, lA, () => brakeLens(c, s, lp.x, lp.y, lp.r, ease(seg(u, 3.1, 3.6)), grow(s, n, 3.0, 3.6), fin(s, n, 3.6, 0.3) * (0.35 + 0.65 * w / W0)));
    const ia = fin(s, n, 3.8, 0.5);
    P(c, ia, L('煞車皮', 'Pad'), L4.x - 80, L4.y + 46, WHITE, 20);
    P(c, ia, L('夾緊', 'Clamp'), L4.x + 80, L4.y + 46, PUSH, 20);
    P(c, ia, L('輪圈', 'Rim'), L4.x, L4.y + 84, WHITE, 20);
    P(c, fin(s, n, 6.6, 0.5), L('摩擦力大 → 停得下來', 'Big friction → it stops'), L4.x - 25, 424, FR, 22);
    /* 狀態字 */
    P(c, fin(s, n, 0.6, 0.4) * fout(s, n, 2.8, 0.3), L('輪子轉得很快', 'The wheel spins fast'), 480, M3.Q_Y, WHITE, 22);
    P(c, fin(s, n, 3.0, 0.4) * fout(s, n, 7.2, 0.3), L('捏煞車：煞車皮夾住輪圈', 'Brake: the pads clamp the rim'), 480, M3.Q_Y, PUSH, 22);
    P(c, fin(s, n, 7.4, 0.4), L('輪子停下來了', 'The wheel stops'), 480, M3.Q_Y, GRN, 22);
    bust(c, 'normal', BUST.r, fin(s, n, 7.6, 0.6));
    P(c, fin(s, n, 0.3, 0.5), L('煞車皮', 'Brake pads'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 8.4, 0.5), L('增加摩擦力，車子才停得下來', 'More friction lets the bike stop'), WHITE);
  }

  /* ═══════════ draw ═══════════ */
  const STEPS = [step1, step2, step3, step4];
  function draw(c, s) {
    const cur = STEPS[s.n - 1] || step1;
    if (s.n > 1 && s.u < 0.6) {
      /* 換步：前一步的最後畫面淡出、這一步淡入（前一步的字不記進檢查框） */
      const f = ease(s.u / 0.6), dbg = W5.debug;
      W5.debug = false; STEPS[s.n - 2](c, { n: s.n - 1, u: DUR[s.n - 2] }); W5.debug = dbg;
      c.save(); c.globalAlpha = f; c.fillStyle = COL.bg; c.fillRect(0, 32, 960, 508); cur(c, s); c.restore();
    } else cur(c, s);
  }

  W5.register('more', { canvas: 'cvs-more', steps: DUR, draw });
})();
