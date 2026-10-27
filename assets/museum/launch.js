// 開場：滿版煙霧裡浮出歡迎詞，煙霧往外散開後，露出 3D 場景（太空梭以光速飛進星球）。
// 只用 2D canvas 畫煙霧（約 46 團，事先畫好 4 種煙團貼圖），3D 還在載入時也能先動。
const TXT = {
  zh: { l1: '歡迎搭乘光速太空梭', l2: '來到<b>伽利略星球</b>', wait: '引擎啟動中', ready: '準備好了！', board: '登機中', goBtn: '🚀 出發！', go: '出發！', warp: '太空梭目前正穿越蟲洞', warpGo: '穿越成功！', skip: '跳過' },
  en: { l1: 'Welcome aboard the light-speed shuttle', l2: 'to <b>Galileo Planet</b>', wait: 'Starting engines', ready: 'Ready!', board: 'Boarding', goBtn: '🚀 Lift off!', go: 'Lift off!', warp: 'The shuttle is crossing a wormhole', warpGo: 'Wormhole cleared!', skip: 'Skip' },
};

function makePuff(rgb, seed) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  let r = seed;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.7) * 62;
    const cx = 128 + Math.cos(a) * d, cy = 128 + Math.sin(a) * d * 0.8, rr = 34 + rnd() * 58;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, `rgba(${rgb},0.30)`);
    g.addColorStop(0.55, `rgba(${rgb},0.14)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill();
  }
  // 邊緣淡出，煙團之間才不會有硬邊
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(128, 128, 40, 128, 128, 128);
  m.addColorStop(0, 'rgba(255,255,255,1)');
  m.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = m;
  x.fillRect(0, 0, S, S);
  return c;
}

// ---------- 蟲洞段：巨人黑洞（Schwarzschild 光線追蹤的吸積盤＋重力透鏡） ----------
// 做法（一次預算、每格只查表）：
//   1. 光子軌道表：u = 1/r 對「掃過的角度 φ」與「撞擊參數 b」的表（d²u/dφ² = −u + 3u²，M = 1），約 600 條光線。
//   2. 每個畫面像素（半解析度、2×2 超取樣）算出它的光線第一次、第二次穿過盤面的位置：
//      第一次＝盤面本身（含擋在陰影前面那條）；第二次＝繞過黑洞的透鏡像（上方的「帽子」、下方的細弧）。
//      存下盤面半徑、方位角，以及都卜勒＋重力紅移的亮度 g^k（左側迎向我們→亮白，右側遠離→暗橙）。
//   3. 每一格只把盤面紋理依半徑轉一個角度（內圈快、外圈慢），查表填色 → 一張小 ImageData → 多層縮小再放大當光暈。
// 太空梭在和盤面不同的傾斜軌道上，機頭沿切線、繞約 2.5 圈、一圈比一圈小；
// 繞到後方時位置被透鏡往外推（沿著帽子的形狀繞過頂端）、被陰影遮住；最後紅移、變暗、被拉長，沒入陰影。
const TAU = Math.PI * 2;
export const WARP_MS = 4200;          // 蟲洞段長度（有旁白時以旁白時間表為準，與 build_narration.py 的 WARP_MIN 一致）
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

// ===== 可調參數（長度單位＝黑洞質量 M；陰影半徑 √27 ≈ 5.2） =====
export const GARG = {
  INCL: 83.5,        // 視線和盤面法線的夾角（度）：90＝正側面；越小越能看到盤面上側
  R_IN: 6,           // 吸積盤內緣（最內穩定圓軌道 6M）
  R_OUT: 21,         // 吸積盤外緣
  DOPPLER: 3.0,      // 亮度 ∝ g^DOPPLER：越大左右亮暗差越明顯
  EXPOSURE: 0.95,    // 盤面整體曝光
  RING: 0.42,        // 光子環亮度
  SPIN_S: 2.4,       // 內緣轉一圈的秒數（外圈依克卜勒 r^1.5 變慢）
  FIT_W: 0.5,        // 盤面外緣半寬占畫面寬度的比例上限（橫式）
  FIT_W_PORTRAIT: 0.7, // 直式：讓盤面外緣超出左右兩邊（電影式裁切），黑洞才不會太小
  FIT_H: 0.385,      // 帽子上緣到中心占畫面高度的比例上限
  CY: 0.575,         // 黑洞中心的高度（畫面比例；上方留給 DOM 大字）
  BLOOM: 0.85,       // 光暈強度
  // 太空梭
  TURNS: 2.3,        // 繞幾圈才進去（2～3 圈）
  R0: 19,            // 起始軌道半徑
  R_END: 2.6,        // 結束時的半徑（已在陰影裡）
  ORBIT_TILT: 0.30,  // 軌道橢圓的扁度（螢幕上的短軸／長軸）
  SHUTTLE_U: 1.55,   // 太空梭尺寸（M）
  LENS_K: 0.55,      // 太空梭繞到後方時的透鏡位移強度
};

// ---------- 小工具 ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const BC = Math.sqrt(27);             // 陰影（臨界撞擊參數）

// ---------- 1. 光子軌道表（與畫面尺寸無關，整個模組共用一份） ----------
const PT = { B0: 0.02, DB: 0.02, BMAX: 24.5, DP: 0.0125, NB: 0, NP: 0, T: null };
function* photonTable() {
  if (PT.T) return PT;
  let lastY = performance.now();
  const NB = Math.ceil((PT.BMAX - PT.B0) / PT.DB) + 2, NP = Math.ceil((TAU + 0.08) / PT.DP) + 2;
  const T = new Float32Array(NB * NP), h0 = PT.DP;
  const f = u => -u + 3 * u * u;
  for (let i = 0; i < NB; i++) {
    const b = PT.B0 + i * PT.DB, row = i * NP;
    let u = 0, v = 1 / b, st = 0;
    T[row] = 0;
    for (let j = 1; j < NP; j++) {
      if (st) { T[row + j] = st; continue; }
      const ns = Math.min(24, 1 + Math.ceil(Math.abs(v) * h0 / 0.004)), h = h0 / ns;
      for (let s = 0; s < ns; s++) {
        const k1u = v, k1v = f(u);
        const k2u = v + 0.5 * h * k1v, k2v = f(u + 0.5 * h * k1u);
        const k3u = v + 0.5 * h * k2v, k3v = f(u + 0.5 * h * k2u);
        const k4u = v + h * k3v, k4v = f(u + h * k3u);
        u += h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
        v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
        if (u >= 0.5 || u < 0) break;
      }
      if (u >= 0.5) st = 1; else if (u < 0) st = -1;
      T[row + j] = st || u;
    }
    if (performance.now() - lastY > 6) { yield; lastY = performance.now(); }
  }
  PT.NB = NB; PT.NP = NP; PT.T = T;
  return PT;
}
// 光線（撞擊參數 b）掃過 φ 時的 u = 1/r；−1＝已經逃走，≥0.5＝已經掉進去
function tabU(b, ph) {
  const { T, NB, NP } = PT;
  let fb = (b - PT.B0) / PT.DB; if (fb < 0) fb = 0;
  const ib = fb | 0; if (ib >= NB - 1) return -1;
  const fp = ph / PT.DP, ip = fp | 0; if (ip >= NP - 1) return -1;
  const tb = fb - ib, tp = fp - ip, o = ib * NP + ip;
  const a = T[o], c = T[o + 1], d = T[o + NP], e = T[o + NP + 1];
  if (a < 0 || c < 0 || d < 0 || e < 0 || a >= 0.5 || c >= 0.5 || d >= 0.5 || e >= 0.5) {
    return tb < 0.5 ? (tp < 0.5 ? a : c) : (tp < 0.5 ? d : e);
  }
  return (a * (1 - tp) + c * tp) * (1 - tb) + (d * (1 - tp) + e * tp) * tb;
}

// ---------- 2. 吸積盤紋理（半徑 × 方位角，4 層模糊度） ----------
const NR = 96, NA = 1024, AM = NA - 1, NLOD = 4;
let DISK_TEX = null;
function* diskTexture() {
  if (DISK_TEX) return DISK_TEX;
  let lastY = performance.now();
  const { R_IN, R_OUT } = GARG, R = rng(20261027);
  // 週期性的 2D 值雜訊（方位角方向週期 PA）：格子沿方位角很長、沿半徑很短 → 沿盤面流動的細絲
  const lattice = (PA, PRr) => { const g = new Float32Array(PA * (PRr + 1)); for (let i = 0; i < g.length; i++) g[i] = R(); return { PA, PRr, g }; };
  const oct = [lattice(9, 20), lattice(17, 44), lattice(33, 90), lattice(61, 150)];
  const amp = [0.5, 0.3, 0.2, 0.14];
  const sm = t => t * t * (3 - 2 * t);
  const noise = (L, fa, fr) => {
    const x = fa * L.PA, y = fr * L.PRr;
    const ix = Math.floor(x), iy = Math.min(L.PRr - 1, Math.floor(y)), tx = sm(x - ix), ty = sm(y - iy);
    const x0 = ((ix % L.PA) + L.PA) % L.PA, x1 = (x0 + 1) % L.PA;
    const g = L.g, r0 = iy * L.PA, r1 = (iy + 1) * L.PA;
    return lerp(lerp(g[r0 + x0], g[r0 + x1], tx), lerp(g[r1 + x0], g[r1 + x1], tx), ty);
  };
  // 半徑方向的細環紋（每一格亂數，稍微抹平）
  const ring = new Float32Array(NR);
  for (let i = 0; i < NR; i++) ring[i] = 0.55 + 0.9 * R();
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < NR - 1; i++) ring[i] = 0.25 * ring[i - 1] + 0.5 * ring[i] + 0.25 * ring[i + 1];
  // 幾團比較亮的熱點（沿方位角拉長）
  const blobs = [];
  for (let k = 0; k < 14; k++) blobs.push({ r: R(), a: R(), wr: 0.015 + 0.03 * R(), wa: 0.03 + 0.08 * R(), s: 0.5 + 0.9 * R() });
  const tex = new Float32Array(NLOD * NR * NA);
  for (let i = 0; i < NR; i++) {
    const fr = (i + 0.5) / NR, r = R_IN + (R_OUT - R_IN) * fr;
    const twist = 0.9 * Math.log(r / R_IN);       // 讓細絲略帶螺旋
    for (let j = 0; j < NA; j++) {
      const fa = j / NA;
      let n = 0;
      for (let o = 0; o < oct.length; o++) n += amp[o] * noise(oct[o], (fa + twist * (o + 1) * 0.07) % 1, fr);
      n = n / 1.14;                                // 0～1
      let v = ring[i] * (0.32 + 1.25 * Math.pow(n, 1.6));
      for (const B of blobs) {
        const dr = fr - B.r;
        if (dr * dr > 9 * B.wr * B.wr) continue;
        let da = Math.abs(fa - B.a); da = Math.min(da, 1 - da);
        if (da > 3 * B.wa) continue;
        v += B.s * Math.exp(-(da * da) / (B.wa * B.wa) - (dr * dr) / (B.wr * B.wr));
      }
      tex[i * NA + j] = v;
    }
    if (performance.now() - lastY > 6) { yield; lastY = performance.now(); }
  }
  // 模糊層（給透鏡壓縮得很密的地方用，避免閃爍）
  const tmp = new Float32Array(NR * NA);
  for (let l = 1; l < NLOD; l++) {
    const src = (l - 1) * NR * NA, dst = l * NR * NA, s = 1 << (l - 1);
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
      tmp[i * NA + j] = 0.25 * tex[src + i * NA + ((j - s) & AM)] + 0.5 * tex[src + i * NA + j] + 0.25 * tex[src + i * NA + ((j + s) & AM)];
    }
    for (let i = 0; i < NR; i++) {
      const i0 = Math.max(0, i - s), i1 = Math.min(NR - 1, i + s);
      for (let j = 0; j < NA; j++) tex[dst + i * NA + j] = 0.25 * tmp[i0 * NA + j] + 0.5 * tmp[i * NA + j] + 0.25 * tmp[i1 * NA + j];
    }
    yield;
  }
  DISK_TEX = tex;
  return tex;
}

// 亮度 → 顏色（暗紅 → 橙 → 琥珀 → 近白）。存成 Uint32（ABGR），alpha＝最大通道，給 lighter 疊加用
const LN = 2048, LUT_SCALE = 160;
let LUT = null;
function lut() {
  if (LUT) return LUT;
  const stops = [[0, 0, 0, 0], [0.1, 62, 16, 5], [0.27, 170, 80, 30], [0.44, 240, 154, 76], [0.6, 255, 196, 126], [0.76, 255, 230, 188], [0.9, 255, 245, 226], [1, 255, 252, 246]];
  LUT = new Uint32Array(LN);
  for (let i = 0; i < LN; i++) {
    const I = i / LUT_SCALE, v = 1 - Math.exp(-I * 0.9);
    let k = 1; while (k < stops.length - 1 && stops[k][0] < v) k++;
    const A = stops[k - 1], B = stops[k], t = Math.min(1, Math.max(0, (v - A[0]) / (B[0] - A[0])));
    const r = lerp(A[1], B[1], t), g = lerp(A[2], B[2], t), b = lerp(A[3], B[3], t);
    const m = Math.max(r, g, b);
    if (m < 0.5) { LUT[i] = 0; continue; }
    const s = 255 / m;
    LUT[i] = ((Math.round(m) & 255) << 24 | (Math.round(b * s) & 255) << 16 | (Math.round(g * s) & 255) << 8 | (Math.round(r * s) & 255)) >>> 0;
  }
  return LUT;
}

function layoutOf(W, H) {
  const ppm = Math.min(W * (W < H ? GARG.FIT_W_PORTRAIT : GARG.FIT_W) / GARG.R_OUT, H * GARG.FIT_H / 10.6);
  return { cx: W / 2, cy: H * GARG.CY, ppm };
}

// ---------- 3. 依畫面尺寸預算（分段執行，每格只做一點，不卡主執行緒） ----------
function* prepare(Wd, Hd, Lc, S, out) {
  const tStart = performance.now();
  const cxd = Lc.cx * S, cyd = Lc.cy * S, ppmd = Lc.ppm * S;
  // 背景星空（含透鏡扭曲的星點）
  const bg = document.createElement('canvas'); bg.width = Wd; bg.height = Hd;
  const g = bg.getContext('2d');
  const sky = g.createRadialGradient(cxd, cyd, 0, cxd, cyd, Math.hypot(Wd, Hd) * 0.62);
  sky.addColorStop(0, 'rgb(12,17,15)'); sky.addColorStop(0.45, 'rgb(10,20,17)'); sky.addColorStop(1, 'rgb(13,30,25)');
  g.fillStyle = sky; g.fillRect(0, 0, Wd, Hd);
  const R = rng(4242);
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 7; k++) {   // 很淡的星雲
    const x = R() * Wd, y = R() * Hd, rr = (0.25 + 0.35 * R()) * Math.max(Wd, Hd);
    const n = g.createRadialGradient(x, y, 0, x, y, rr);
    const warm = R() < 0.3;
    n.addColorStop(0, warm ? 'rgba(90,52,30,0.07)' : 'rgba(30,86,74,0.08)'); n.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = n; g.fillRect(0, 0, Wd, Hd);
  }
  const E = 7.6, nStar = Math.round(Wd * Hd / 1100);
  for (let k = 0; k < nStar; k++) {
    const sx = (R() * Wd - cxd) / ppmd, sy = (R() * Hd - cyd) / ppmd;
    const beta = Math.hypot(sx, sy) + 1e-3, ux = sx / beta, uy = sy / beta;
    const mag = Math.pow(R(), 3.2), hue = R();
    const col = hue < 0.2 ? [255, 214, 170] : hue < 0.4 ? [190, 214, 255] : [240, 244, 236];
    const q = Math.sqrt(beta * beta + 4 * E * E);
    for (const th of [(beta + q) / 2, (beta - q) / 2]) {
      const at = Math.abs(th);
      if (at < BC * 1.08) continue;
      const qx = ux * th, qy = uy * th;
      if (at < 12.5 || (Math.abs(qy) < 3.2 && Math.abs(qx) < GARG.R_OUT + 2)) continue;   // 被盤面與光暈蓋住的星不畫
      const tan = Math.min(5, at / beta), rad = Math.min(2, Math.abs(0.5 + beta / (2 * q)));
      const mu = Math.min(6, tan * rad);
      const a = Math.min(1, (0.18 + 0.82 * mag) * Math.sqrt(mu) * (th < 0 ? 0.6 : 1));
      if (a < 0.06) continue;
      const x = cxd + ux * th * ppmd, y = cyd + uy * th * ppmd, s = (0.32 + 0.75 * mag) * Math.max(0.6, S * 1.4);
      g.save(); g.translate(x, y); g.rotate(Math.atan2(uy, ux));
      g.scale(Math.max(1, rad), Math.max(1, tan));
      g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
      g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
      if (mag > 0.75) {
        const hg = g.createRadialGradient(0, 0, 0, 0, 0, s * 5);
        hg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a * 0.35})`); hg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = hg; g.beginPath(); g.arc(0, 0, s * 5, 0, TAU); g.fill();
      }
      g.restore();
    }
  }
  g.globalCompositeOperation = 'lighter';           // 黑洞周圍的暖色光霧
  const hz = g.createRadialGradient(cxd, cyd, BC * ppmd, cxd, cyd, 15 * ppmd);
  hz.addColorStop(0, 'rgba(255,140,60,0.10)'); hz.addColorStop(0.5, 'rgba(200,90,40,0.04)'); hz.addColorStop(1, 'rgba(200,90,40,0)');
  g.fillStyle = hz; g.fillRect(0, 0, Wd, Hd);
  g.globalCompositeOperation = 'source-over';        // 暗角（電影感，也讓上方大字更好讀）
  const hyp = Math.hypot(Wd, Hd), vg = g.createRadialGradient(Wd / 2, Hd * 0.55, hyp * 0.22, Wd / 2, Hd * 0.55, hyp * 0.62);
  vg.addColorStop(0, 'rgba(6,12,10,0)'); vg.addColorStop(1, 'rgba(6,12,10,0.62)');
  g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
  out.bg = bg;
  warpStats.stage = { bg: performance.now() - tStart };
  yield;
  yield* warmGen();                                 // 光子表與盤面紋理（通常已在閒置時間先算好）
  warpStats.stage.pt = performance.now() - tStart;
  const tex = DISK_TEX;
  lut();
  warpStats.stage.tex = performance.now() - tStart;
  yield;
  // 每個像素的盤面查表資料
  const { R_IN, R_OUT, DOPPLER, RING } = GARG;
  const inc = GARG.INCL * Math.PI / 180, cosI = Math.cos(inc), sinI = Math.sin(inc);
  const bx0 = Math.max(0, Math.floor(cxd - (R_OUT + 3) * ppmd)), bx1 = Math.min(Wd, Math.ceil(cxd + (R_OUT + 3) * ppmd));
  const by0 = Math.max(0, Math.floor(cyd - 14 * ppmd)), by1 = Math.min(Hd, Math.ceil(cyd + 12 * ppmd));
  const bw = bx1 - bx0, bh = by1 - by0, NPX = bw * bh;
  const idx = new Uint32Array(NPX), base = new Float32Array(NPX);
  const w0 = new Float32Array(NPX), t0 = new Uint32Array(NPX), a0 = new Uint16Array(NPX), r0 = new Uint8Array(NPX);
  const w1 = new Float32Array(NPX), t1 = new Uint32Array(NPX), a1 = new Uint16Array(NPX), r1 = new Uint8Array(NPX);
  const DR = (R_OUT - R_IN) / NR, prof = r => smooth((r - R_IN) / 0.55) * Math.pow(R_IN / r, 1.75) * (1 - smooth((r - R_OUT * 0.5) / (R_OUT * 0.5)));
  const SXo = [0.25, 0.75], SYo = [0.3, 0.7], NS = SXo.length;   // 每個像素 2 個對角取樣
  const RW = 0.075, RC = BC + 0.07;
  // 每層暫存：命中數、權重、紋理座標、範圍
  const hc = [0, 0], hw = [0, 0], hr = [0, 0], ha = [0, 0], rmn = [0, 0], rmx = [0, 0], amx = [0, 0];
  let n = 0, lastY = performance.now();
  for (let py = by0; py < by1; py++) {
    for (let px = bx0; px < bx1; px++) {
      hc[0] = hc[1] = 0; hw[0] = hw[1] = 0;
      let bs = 0;
      for (let s = 0; s < NS; s++) {
        const X = (px + SXo[s] - cxd) / ppmd, Yu = (cyd - py - SYo[s]) / ppmd;
        const b = Math.sqrt(X * X + Yu * Yu);
        if (b < 0.03 || b > PT.BMAX - 0.1) continue;
        const cA = X / b, sA = Yu / b;
        const dop = 1 / (1 + 0.42 * cA);          // 光子環的左右亮暗
        const dd = (b - RC) / RW;
        if (dd > -1 && dd < 1) bs += RING * (1 - dd * dd) * dop * dop * dop / NS;
        else if (dd >= 1 && dd < 6) bs += RING * 0.035 * (1 - (dd - 1) / 4) * dop * dop / NS;
        const ph1 = Math.atan2(cosI, -sA * sinI);
        for (let L = 0; L < 2; L++) {
          const ph = ph1 + L * Math.PI;
          const u = tabU(b, ph);
          if (u < 0 || u >= 0.5) break;
          const r = 1 / u;
          if (r < R_IN || r > R_OUT) continue;
          const sp = Math.sin(ph), cp = Math.cos(ph);
          const dx = sp * cA, dy = -cp * sinI + sp * sA * cosI;
          let psi = Math.atan2(dy, dx); if (psi < 0) psi += TAU;
          const gg = Math.sqrt(1 - 3 / r) / (1 + Math.sqrt(1 / (r * r * r)) * b * sinI * cA);
          const wgt = Math.pow(gg, DOPPLER) * prof(r) * (L ? 0.75 : 1);
          const ai = psi / TAU * NA;
          if (hc[L] === 0) { hr[L] = r; ha[L] = ai; rmn[L] = rmx[L] = r; amx[L] = 0; }
          else {
            if (r < rmn[L]) rmn[L] = r; if (r > rmx[L]) rmx[L] = r;
            let da = Math.abs(ai - ha[L]); if (da > NA / 2) da = NA - da; if (da > amx[L]) amx[L] = da;
          }
          hc[L]++; hw[L] += wgt;
          break;
        }
      }
      if (hc[0] === 0 && hc[1] === 0 && bs <= 0) continue;
      idx[n] = (py - by0) * bw + (px - bx0);
      base[n] = bs;
      for (let L = 0; L < 2; L++) {
        let w = 0, t = 0, a = 0, rb = 0;
        if (hc[L]) {
          w = hw[L] / NS;
          rb = Math.min(NR - 1, Math.max(0, ((hr[L] - R_IN) / DR) | 0));
          const fp = Math.max((rmx[L] - rmn[L]) / DR, amx[L]) * 2;
          let lod = hc[L] < 2 ? 1 : fp < 1.5 ? 0 : fp < 3 ? 1 : fp < 6 ? 2 : 3;
          t = lod * NR * NA + rb * NA; a = (ha[L] | 0) & AM;
        }
        if (L === 0) { w0[n] = w; t0[n] = t; a0[n] = a; r0[n] = rb; } else { w1[n] = w; t1[n] = t; a1[n] = a; r1[n] = rb; }
      }
      n++;
    }
    if (performance.now() - lastY > 6) { yield; lastY = performance.now(); }
  }
  const disk = document.createElement('canvas'); disk.width = bw; disk.height = bh;
  const dctx = disk.getContext('2d');
  const img = dctx.createImageData(bw, bh);
  const blooms = [];
  let pw = bw, ph = bh;
  for (let k = 0; k < 4; k++) { pw = Math.max(2, Math.ceil(pw / 2)); ph = Math.max(2, Math.ceil(ph / 2)); const c = document.createElement('canvas'); c.width = pw; c.height = ph; blooms.push(c); }
  const acc = document.createElement('canvas'); acc.width = blooms[0].width; acc.height = blooms[0].height;
  Object.assign(out, {
    ready: true, acc, n, idx, base, w0, t0, a0, r0, w1, t1, a1, r1, tex,
    disk, dctx, img, px32: new Uint32Array(img.data.buffer), blooms,
    box: [bx0 / S, by0 / S, bw / S, bh / S], rot: new Int32Array(NR),
    prepMs: performance.now() - tStart,
  });
  warpStats.prepMs = out.prepMs; warpStats.active = n;
  return out;
}
export const warpStats = { prepMs: 0, active: 0, stage: null };
// 和畫面尺寸無關的預算（光子表、盤面紋理）：模組載入後利用閒置時間一點一點先算好；共用同一個產生器
let WARM = null;
function warmGen() {
  if (!WARM) WARM = (function* () { yield* photonTable(); yield* diskTexture(); lut(); })();
  return WARM;
}
if (typeof window !== 'undefined') {
  const step = dl => {
    const g = warmGen(), t0 = performance.now();
    while (performance.now() - t0 < 8 && (!dl || dl.timeRemaining() > 2)) { if (g.next().done) return; }
    later();
  };
  const later = () => (window.requestIdleCallback ? window.requestIdleCallback(step, { timeout: 2000 }) : setTimeout(step, 60));
  setTimeout(later, 1200);
}
const PREP_CACHE = new Map();

// ---------- 太空梭（原創造型，從上方看，機頭朝 −y） ----------
// shuttle(ctx, x, y, u, roll, glow, opt)：u＝尺寸單位（機身全長約 2.5u）；roll＝旋轉角；glow＝引擎火焰 0～1
// opt（可省略）：light 光源方向（螢幕角度，預設右上）、lk 光源強度、sx/sy 沿翼展／沿機身的縮放（透視、潮汐拉長）、
//               dim 變暗、red 紅移、alpha 透明度
let SPR = null;
const SP_XL = 1.25, SP_YT = -1.42, SP_YB = 1.34;
function pBody(c) {
  c.beginPath();
  c.moveTo(0, -1.33);
  c.bezierCurveTo(0.12, -1.31, 0.225, -1.08, 0.245, -0.72);
  c.lineTo(0.258, 0.98); c.lineTo(0.205, 1.07); c.lineTo(-0.205, 1.07); c.lineTo(-0.258, 0.98); c.lineTo(-0.245, -0.72);
  c.bezierCurveTo(-0.225, -1.08, -0.12, -1.31, 0, -1.33);
  c.closePath();
}
// 機翼：一整片圓滑的 S 形（ogee）三角翼，翼尖微微下削
function wingLE(c, s, move) {
  if (move) c.moveTo(s * 0.2, -0.78); else c.lineTo(s * 0.2, -0.78);
  c.bezierCurveTo(s * 0.3, -0.18, s * 0.5, 0.36, s * 1.04, 0.74);
}
function pWings(c) {
  c.beginPath();
  wingLE(c, 1, true);
  c.quadraticCurveTo(s1(1.12), 0.8, s1(1.1), 0.9);
  c.lineTo(0.86, 0.94); c.quadraticCurveTo(0.5, 0.9, 0.24, 1.0);
  c.lineTo(-0.24, 1.0); c.quadraticCurveTo(-0.5, 0.9, -0.86, 0.94); c.lineTo(-1.1, 0.9);
  c.quadraticCurveTo(-1.12, 0.8, -1.04, 0.74);
  c.bezierCurveTo(-0.5, 0.36, -0.3, -0.18, -0.2, -0.78);
  c.closePath();
}
function s1(x) { return x; }
// 引擎整流罩（機尾兩側的小鼓包）
function pPods(c) {
  for (const s of [-1, 1]) {
    c.moveTo(s * 0.2, 0.7);
    c.quadraticCurveTo(s * 0.3, 0.86, s * 0.27, 1.05);
    c.lineTo(s * 0.17, 1.05);
    c.quadraticCurveTo(s * 0.17, 0.86, s * 0.2, 0.7);
    c.closePath();
  }
}
function pFin(c) {
  c.beginPath();
  c.moveTo(0, 0.36); c.lineTo(0.034, 0.74); c.lineTo(0.03, 1.15); c.lineTo(-0.03, 1.15); c.lineTo(-0.034, 0.74);
  c.closePath();
}
function silhouette(c) {
  pWings(c); c.fill();
  pBody(c); c.fill();
  c.beginPath(); pPods(c); c.fill();
  pFin(c); c.fill();
}
function paintShuttle(c, Lx, Ly) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  // 機翼：白色隔熱瓦，翼根到翼尖微暗
  const wg = c.createLinearGradient(0, 0, 1.15, 0);
  wg.addColorStop(0, '#e9e5da'); wg.addColorStop(0.55, '#d6d2c6'); wg.addColorStop(1, '#b9b6ac');
  c.save(); c.scale(1, 1);
  c.fillStyle = wg;
  pWings(c); c.fill();
  // 機翼的分段線、副翼
  c.save(); pWings(c); c.clip();
  c.strokeStyle = 'rgba(70,76,74,0.45)'; c.lineWidth = 0.014;
  c.beginPath();
  for (const s of [-1, 1]) {
    c.moveTo(s * 0.26, 0.8); c.quadraticCurveTo(s * 0.6, 0.76, s * 1.0, 0.8);
    c.moveTo(s * 0.62, 0.78); c.lineTo(s * 0.62, 0.95);
    c.moveTo(s * 0.27, 0.3); c.lineTo(s * 0.6, 0.5);
  }
  c.stroke();
  // 機翼前緣：黑色隔熱瓦（沿前緣的粗線，被機翼裁掉一半）
  c.strokeStyle = '#272d2b'; c.lineWidth = 0.13;
  c.beginPath();
  for (const s of [-1, 1]) { wingLE(c, s, true); c.quadraticCurveTo(s * 1.12, 0.8, s * 1.1, 0.9); }
  c.stroke();
  c.strokeStyle = 'rgba(120,128,124,0.5)'; c.lineWidth = 0.02;   // 黑瓦與白瓦的交界亮線
  c.save(); c.translate(0, 0.075);
  c.beginPath();
  for (const s of [-1, 1]) wingLE(c, s, true);
  c.stroke(); c.restore();
  // 翼根陰影（和機身交接處）
  const ao = c.createLinearGradient(0.24, 0, 0.5, 0);
  ao.addColorStop(0, 'rgba(40,46,44,0.38)'); ao.addColorStop(1, 'rgba(40,46,44,0)');
  c.fillStyle = ao; c.fillRect(0.2, -0.7, 0.32, 1.8);
  const ao2 = c.createLinearGradient(-0.24, 0, -0.5, 0);
  ao2.addColorStop(0, 'rgba(40,46,44,0.38)'); ao2.addColorStop(1, 'rgba(40,46,44,0)');
  c.fillStyle = ao2; c.fillRect(-0.52, -0.7, 0.32, 1.8);
  c.restore();
  c.restore();
  // 主引擎（三個噴口：上中一個、下兩個）
  const bell = (x, y0, y1, w0, w1) => {
    const bgd = c.createLinearGradient(x - w1, 0, x + w1, 0);
    bgd.addColorStop(0, '#262b2a'); bgd.addColorStop(0.35 + 0.2 * Lx, '#a7aca8'); bgd.addColorStop(0.7, '#4a504e'); bgd.addColorStop(1, '#1f2423');
    c.fillStyle = bgd;
    c.beginPath(); c.moveTo(x - w0, y0); c.lineTo(x + w0, y0); c.quadraticCurveTo(x + w1 * 0.9, (y0 + y1) / 2, x + w1, y1); c.lineTo(x - w1, y1); c.quadraticCurveTo(x - w1 * 0.9, (y0 + y1) / 2, x - w0, y0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(205,240,255,0.9)';
    c.beginPath(); c.ellipse(x, y1, w1 * 0.92, 0.018, 0, 0, TAU); c.fill();
  };
  c.fillStyle = '#3b413f'; c.fillRect(-0.18, 1.02, 0.36, 0.09);   // 機尾襟翼
  bell(-0.115, 1.06, 1.25, 0.04, 0.072);
  bell(0.115, 1.06, 1.25, 0.04, 0.072);
  // 機身：圓筒的明暗，高光偏向光源
  const hx = Math.max(0.2, Math.min(0.8, 0.5 + 0.28 * Lx));
  const bgr = c.createLinearGradient(-0.26, 0, 0.26, 0);
  bgr.addColorStop(0, '#80857f'); bgr.addColorStop(Math.max(0.05, hx - 0.3), '#c9c5ba'); bgr.addColorStop(hx, '#f7f4ec');
  bgr.addColorStop(Math.min(0.95, hx + 0.3), '#c4c0b5'); bgr.addColorStop(1, '#757a75');
  c.fillStyle = bgr; pBody(c); c.fill();
  c.save(); pBody(c); c.clip();
  // 機鼻帽（深灰碳纖維）
  const ng = c.createLinearGradient(0, -1.34, 0, -1.12);
  ng.addColorStop(0, '#3c4240'); ng.addColorStop(0.75, '#5b605d'); ng.addColorStop(1, 'rgba(91,96,93,0)');
  c.fillStyle = ng; c.fillRect(-0.3, -1.4, 0.6, 0.3);
  // 背脊（細長的亮條）與機身分段線
  const sg = c.createLinearGradient(-0.05, 0, 0.05, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,250,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.fillRect(-0.05, -0.6, 0.1, 1.5);
  c.strokeStyle = 'rgba(64,70,68,0.55)'; c.lineWidth = 0.015;
  c.beginPath();
  for (const y of [-0.62, -0.25, 0.12, 0.5, 0.86]) { c.moveTo(-0.26, y); c.quadraticCurveTo(0, y - 0.035, 0.26, y); }
  c.moveTo(-0.15, -0.25); c.lineTo(-0.15, 0.5); c.moveTo(0.15, -0.25); c.lineTo(0.15, 0.5);
  c.stroke();
  c.fillStyle = 'rgba(52,58,56,0.5)';                        // 兩個小小的姿態控制噴嘴
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 0.17, -1.0, 0.018, 0, TAU); c.fill(); }
  c.restore();
  // 駕駛艙窗（四片深色玻璃）
  const wgl = c.createLinearGradient(0, -0.94, 0, -0.78);
  wgl.addColorStop(0, '#2f4756'); wgl.addColorStop(1, '#0e171c');
  c.fillStyle = wgl;
  c.beginPath(); c.moveTo(-0.16, -0.8); c.lineTo(-0.115, -0.935); c.lineTo(0.115, -0.935); c.lineTo(0.16, -0.8); c.quadraticCurveTo(0, -0.77, -0.16, -0.8); c.closePath(); c.fill();
  c.strokeStyle = '#cfcbc0'; c.lineWidth = 0.018;
  c.beginPath(); c.moveTo(0, -0.935); c.lineTo(0, -0.78); c.moveTo(-0.075, -0.935); c.lineTo(-0.09, -0.785); c.moveTo(0.075, -0.935); c.lineTo(0.09, -0.785); c.stroke();
  c.strokeStyle = 'rgba(235,250,255,0.75)'; c.lineWidth = 0.014;   // 玻璃反光
  c.beginPath(); c.moveTo(-0.1 + 0.05 * Lx, -0.915); c.lineTo(-0.035 + 0.05 * Lx, -0.915); c.stroke();
  // 軌道機動吊艙
  const pg = c.createLinearGradient(-0.24, 0, 0.24, 0);
  pg.addColorStop(0, '#9a9e98'); pg.addColorStop(0.5 + 0.2 * Lx, '#f1eee5'); pg.addColorStop(1, '#8c918b');
  c.fillStyle = pg; c.beginPath(); pPods(c); c.fill();
  c.strokeStyle = 'rgba(60,66,64,0.45)'; c.lineWidth = 0.012; c.beginPath(); pPods(c); c.stroke();
  // 垂尾：落在機身上的影子＋刀片
  c.save(); pBody(c); c.clip();
  c.translate(-Lx * 0.09, -Ly * 0.05 + 0.02);
  c.fillStyle = 'rgba(30,36,34,0.35)'; pFin(c); c.fill();
  c.restore();
  const fg = c.createLinearGradient(-0.035, 0, 0.035, 0);
  fg.addColorStop(0, Lx < 0 ? '#f4f1e8' : '#7e837e'); fg.addColorStop(1, Lx < 0 ? '#7e837e' : '#f4f1e8');
  c.fillStyle = fg; pFin(c); c.fill();
  c.strokeStyle = '#2d3331'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(0, 0.37); c.lineTo(0, 0.72); c.stroke();   // 垂尾前緣
  // 機身側緣細線
  c.strokeStyle = 'rgba(48,54,52,0.5)'; c.lineWidth = 0.012; pBody(c); c.stroke();
}
function shuttle(ctx, x, y, u, roll, glow, opt) {
  const o = opt || {};
  const sx = o.sx || 1, sy = o.sy || 1, lk = o.lk == null ? 0.8 : o.lk, red = o.red || 0, dim = o.dim || 0;
  const la = (o.light == null ? -0.9 : o.light) - roll, Lx = Math.cos(la), Ly = Math.sin(la);
  const m = ctx.getTransform(), S = Math.hypot(m.a, m.b) || 1;
  const ppu = Math.max(6, u * S * Math.max(sx, sy) * 1.3);
  const cw = Math.ceil(2 * SP_XL * ppu) + 4, ch = Math.ceil((SP_YB - SP_YT) * ppu) + 4;
  if (!SPR) SPR = [document.createElement('canvas'), document.createElement('canvas')];
  for (const c of SPR) if (c.width < cw || c.height < ch) { c.width = Math.max(c.width, cw + 32); c.height = Math.max(c.height, ch + 32); }
  const ox = cw / 2, oy = -SP_YT * ppu + 2;
  const a = SPR[0].getContext('2d'), b = SPR[1].getContext('2d');
  for (const c of [a, b]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, cw + 2, ch + 2); c.setTransform(ppu, 0, 0, ppu, ox, oy); }
  paintShuttle(a, Lx, Ly);
  // 受光：光源側偏暖、背光側偏冷暗
  a.globalCompositeOperation = 'source-atop';
  const lg = a.createLinearGradient(-Lx * 1.3, -Ly * 1.3, Lx * 1.3, Ly * 1.3);
  lg.addColorStop(0, `rgba(6,18,24,${0.62 + 0.25 * dim})`); lg.addColorStop(0.5, `rgba(20,30,32,${0.14 + 0.3 * dim})`); lg.addColorStop(1, `rgba(255,140,60,${0.3 * lk})`);
  a.fillStyle = lg; a.fillRect(-2, -2, 4, 4);
  // 邊緣光：剪影減去往背光方向平移的剪影
  b.fillStyle = 'rgb(255,158,72)'; silhouette(b);
  b.globalCompositeOperation = 'destination-out';
  b.translate(-Lx * 0.095, -Ly * 0.095); silhouette(b);
  a.setTransform(1, 0, 0, 1, 0, 0);
  a.globalCompositeOperation = 'lighter'; a.globalAlpha = Math.min(1, lk * 1.25);
  a.drawImage(SPR[1], 0, 0, cw, ch, 0, 0, cw, ch);
  a.globalAlpha = 1;
  if (red > 0.01) { a.globalCompositeOperation = 'source-atop'; a.fillStyle = `rgba(70,10,4,${0.82 * red})`; a.fillRect(0, 0, cw, ch); }
  // 畫到主畫布：先火焰（加亮），再機身
  ctx.save();
  ctx.translate(x, y); ctx.rotate(roll); ctx.scale(sx, sy);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.globalCompositeOperation = 'lighter';
  const fl = 0.85 + 0.15 * glow, fk = 1 - 0.8 * red;
  const cOut = red > 0.5 ? '255,96,40' : '90,170,255', cMid = red > 0.5 ? '255,170,110' : '170,220,255';
  for (const [ex, ey, sc] of [[-0.115, 1.25, 1], [0.115, 1.25, 1], [0, 1.24, 1.08]]) {
    const len = (1.0 + 0.55 * glow) * sc * u, wd = 0.085 * sc * u, X0 = ex * u, Y0 = ey * u;
    let gr = ctx.createLinearGradient(0, Y0, 0, Y0 + len);
    gr.addColorStop(0, `rgba(${cMid},${0.85 * fl * fk})`); gr.addColorStop(0.35, `rgba(${cOut},${0.45 * fl * fk})`); gr.addColorStop(1, `rgba(${cOut},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(X0 - wd, Y0); ctx.quadraticCurveTo(X0 - wd * 1.25, Y0 + len * 0.35, X0, Y0 + len); ctx.quadraticCurveTo(X0 + wd * 1.25, Y0 + len * 0.35, X0 + wd, Y0); ctx.closePath(); ctx.fill();
    gr = ctx.createLinearGradient(0, Y0, 0, Y0 + len * 0.45);
    gr.addColorStop(0, `rgba(255,255,255,${0.95 * fk})`); gr.addColorStop(1, `rgba(${cMid},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(X0 - wd * 0.5, Y0); ctx.quadraticCurveTo(X0 - wd * 0.55, Y0 + len * 0.2, X0, Y0 + len * 0.45); ctx.quadraticCurveTo(X0 + wd * 0.55, Y0 + len * 0.2, X0 + wd * 0.5, Y0); ctx.closePath(); ctx.fill();
  }
  const hg = ctx.createRadialGradient(0, 1.3 * u, 0, 0, 1.3 * u, 0.85 * u);
  hg.addColorStop(0, `rgba(${cMid},${0.4 * fl * fk})`); hg.addColorStop(1, `rgba(${cOut},0)`);
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 1.3 * u, 0.85 * u, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(SPR[0], 0, 0, cw, ch, -ox / ppu * u, -oy / ppu * u, cw / ppu * u, ch / ppu * u);
  ctx.restore();
}

function drawFlash(ctx, W, H, p) {
  if (p <= 0) return;
  const fl = p < 0.45 ? Math.pow(p / 0.45, 1.5) * 0.95 : 0.95 * Math.pow(1 - (p - 0.45) / 0.55, 1.6);
  if (fl <= 0.003) return;
  ctx.fillStyle = `rgba(228,252,250,${fl})`;
  ctx.fillRect(0, 0, W, H);
}

// 太空梭的螺旋：半徑一圈比一圈小，角速度越裡面越快；最後 20% 因時間膨脹而變慢、紅移
function buildOrbit(R0) {
  const N = 720, th = new Float32Array(N + 1), Rr = new Float32Array(N + 1);
  const { R_END, TURNS } = GARG;
  let acc = 0, prev = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    Rr[i] = R_END + (R0 - R_END) * Math.pow(1 - u, 1.2);
    const om = Math.pow(Rr[i], -0.6) * (1 - 0.65 * smooth((u - 0.78) / 0.22));
    if (i) acc += 0.5 * (om + prev) / N;
    th[i] = acc; prev = om;
  }
  for (let i = 0; i <= N; i++) th[i] *= TURNS * TAU / acc;
  return { N, th, Rr };
}

export function makeWarp(warpMs) {
  const T = Math.max(1, warpMs / 1000);
  let ORB = null, orbKey = '';
  const TH0 = Math.PI * 0.76;          // 從左前方出現，往畫面下方（靠近我們）繞過去
  let key = '', D = null, gen = null;

  // u∈[0,1] → 太空梭在畫面上的位置（以 M 為單位、y 向下）、深度、是否在黑洞前方
  const orbitAt = uu => {
    const f = Math.min(1, Math.max(0, uu)) * ORB.N, i = Math.min(ORB.N - 1, f | 0), t = f - i;
    const R = lerp(ORB.Rr[i], ORB.Rr[i + 1], t), th = TH0 - lerp(ORB.th[i], ORB.th[i + 1], t);
    let X = R * Math.cos(th), Y = GARG.ORBIT_TILT * R * Math.sin(th);
    const depth = R * Math.sin(th);                 // >0：在黑洞前方
    let mag = 1;
    if (depth < 0) {                               // 在後方：被透鏡往外推（沿著帽子的形狀）
      const beta = Math.hypot(X, Y) + 1e-4, E2 = GARG.LENS_K * 4 * (-depth);
      const thp = (beta + Math.sqrt(beta * beta + 4 * E2)) / 2;
      mag = thp / beta; X *= mag; Y *= mag;
    }
    return { X, Y, R, th, depth, mag };
  };

  // tau：進蟲洞後的秒數；w：淡入 0→1；p：出洞進度 0→1；dt：秒（這一版用 tau 決定畫面，不依賴 dt）
  return function draw(ctx, W, H, tau, w, p, dt) {
    const wt = w * (p < 0.4 ? 1 : 1 - smooth((p - 0.4) / 0.45));
    if (wt <= 0.003) { drawFlash(ctx, W, H, p); return; }
    const m = ctx.getTransform(), S = Math.hypot(m.a, m.b) || 1;
    const Wd = Math.max(1, Math.round(W * S)), Hd = Math.max(1, Math.round(H * S));
    const k = Wd + 'x' + Hd;
    if (k !== key) {
      key = k;
      D = PREP_CACHE.get(k) || null;
      if (!D) { D = {}; gen = prepare(Wd, Hd, layoutOf(W, H), S, D); PREP_CACHE.clear(); PREP_CACHE.set(k, D); }
      else gen = null;
    }
    if (gen) {                                     // 分段預算：每格最多約 9 ms
      const t0 = performance.now();
      while (gen && performance.now() - t0 < 9) { if (gen.next().done) gen = null; }
    }
    const L = layoutOf(W, H), { cx, cy, ppm } = L;
    if (orbKey !== k) { orbKey = k; ORB = buildOrbit(Math.min(GARG.R0, (W * 0.5 - 1.6 * GARG.SHUTTLE_U * ppm) / ppm / 0.94)); }   // 窄螢幕：起始圈縮小，太空梭不出畫面
    const uT = tau / T;
    const zoom = 1 + 12 * Math.pow(p, 1.7);                  // 出洞：鏡頭衝進陰影（平常保持 1，大圖才走快速路徑）

    ctx.save();
    ctx.globalAlpha = wt;
    if (zoom > 1.0001) { ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy); }
    if (D.bg) ctx.drawImage(D.bg, 0, 0, W, H);      // 星空＋暖色光霧＋暗角（都預先畫好）
    else { ctx.fillStyle = 'rgb(11,22,19)'; ctx.fillRect(0, 0, W, H); }

    // 太空梭狀態
    const us = Math.min(1, uT);
    const vis = smooth(tau / 0.35) * (1 - smooth((us - 0.86) / 0.13)) * (uT < 1 ? 1 : 0);
    let sh = null;
    if (vis > 0.01) {
      const P = orbitAt(us), Pa = orbitAt(us - 0.004), Pb = orbitAt(us + 0.004);
      const red = smooth((us - 0.7) / 0.3);
      const front = P.depth >= 0, back = smooth(-P.depth / 4);              // 在後方的程度（0～1，過交點時平順）
      const pf = 1 / (1 - Math.max(-0.4, Math.min(0.4, P.depth / 50)));     // 越靠近鏡頭越大
      const heading = Math.atan2(Pb.Y - Pa.Y, Pb.X - Pa.X) + Math.PI / 2;    // 機頭＝畫面上的前進切線方向
      // 透視：沿機身／沿翼展的縮短（用軌道面的投影，稍微放寬免得太扁）
      const AV = 0.55, st = Math.sin(P.th), ct = Math.cos(P.th);
      const fNose = Math.sqrt(st * st + AV * AV * ct * ct), fWing = Math.sqrt(ct * ct + AV * AV * st * st);
      const stretch = 1 + 0.42 * red * red;                                // 潮汐：沿切線拉長一點
      const x = cx + P.X * ppm, y = cy + P.Y * ppm;
      sh = {
        front, x, y, u: GARG.SHUTTLE_U * ppm * pf * Math.min(1.35, Math.sqrt(P.mag)), heading,
        o: { sx: fWing * (1 - 0.16 * red * red), sy: fNose * stretch, light: Math.atan2(cy - y, cx - x),
          lk: Math.min(1.2, 0.45 + 5.5 / Math.max(3, P.R)) * (1 - 0.45 * back), dim: Math.max(0.1 * red, 0.6 * back), red,
          alpha: Math.min(1, vis * 1.15) * (1 - 0.3 * back) },
        glow: 0.6 + 0.4 * Math.sin(tau * 23) * Math.sin(tau * 7.3),
      };
    }
    if (sh && !sh.front) shuttle(ctx, sh.x, sh.y, sh.u, sh.heading, sh.glow, sh.o);

    // 事件視界的陰影（極深的綠黑，不用純黑）
    ctx.fillStyle = 'rgb(5,8,7)';
    ctx.beginPath(); ctx.arc(cx, cy, BC * ppm * 1.004, 0, TAU); ctx.fill();

    if (D.ready) {
      // 每一格：盤面紋理依半徑轉動（克卜勒：內圈快），查表填色
      const { n, idx, base, w0, t0, a0, r0, w1, t1, a1, r1, tex, px32, rot } = D;
      const { R_IN, R_OUT, SPIN_S } = GARG, DR = (R_OUT - R_IN) / NR;
      const sp = tau * (1 + 2.5 * p);
      for (let i = 0; i < NR; i++) { const r = R_IN + (i + 0.5) * DR; rot[i] = Math.floor(sp / SPIN_S * Math.pow(R_IN / r, 1.5) * NA); }
      const ex = GARG.EXPOSURE * LUT_SCALE, LU = LUT, LMAX = LN - 1;
      for (let q = 0; q < n; q++) {
        let I = base[q], ww = w0[q];
        if (ww > 0) I += ww * tex[t0[q] + ((a0[q] - rot[r0[q]]) & AM)];
        ww = w1[q];
        if (ww > 0) I += ww * tex[t1[q] + ((a1[q] - rot[r1[q]]) & AM)];
        let li = (I * ex) | 0; if (li > LMAX) li = LMAX;
        px32[idx[q]] = LU[li];
      }
      D.dctx.putImageData(D.img, 0, 0);
      // 光暈：一路縮小一半，各層（＋橫向光芒）先疊在一張半尺寸的小畫布上，主畫布只疊一次
      let src = D.disk;
      for (const c of D.blooms) { const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); src = c; }
      const acc = D.acc, g = acc.getContext('2d'), aw = acc.width, ah = acc.height, B = GARG.BLOOM;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, aw, ah);
      g.globalCompositeOperation = 'lighter';
      [0.32, 0.42, 0.55, 0.75].forEach((a, i) => { g.globalAlpha = Math.min(1, a * B); g.drawImage(D.blooms[i], 0, 0, aw, ah); });
      const [bx, by, bw, bh] = D.box, cyA = (cy + 1.35 * ppm - by) / bh * ah;   // 光芒對準陰影前方那條最亮的盤面
      g.globalAlpha = Math.min(1, 0.22 * B);                                  // 很淡的橫向光芒（鏡頭感）
      g.drawImage(D.blooms[3], -aw * 0.7, cyA - ah * 0.06, aw * 2.4, ah * 0.12);
      g.globalAlpha = Math.min(1, 0.12 * B);
      g.drawImage(D.blooms[2], -aw * 0.1, cyA - ah * 0.025, aw * 1.2, ah * 0.05);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(D.disk, bx, by, bw, bh);
      ctx.drawImage(acc, bx, by, bw, bh);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (sh && sh.front) shuttle(ctx, sh.x, sh.y, sh.u, sh.heading, sh.glow, sh.o);
    ctx.restore();

    drawFlash(ctx, W, H, p);
  };
}

export function startLaunch({ lang = 'zh', minMs = 3200 } = {}) {
  const root = document.getElementById('launch');
  if (!root) return null;
  const t = TXT[lang] || TXT.zh;
  root.querySelector('.l1').textContent = t.l1;
  root.querySelector('.l2').innerHTML = t.l2;
  const status = root.querySelector('.launch-status .st');
  status.textContent = t.wait;
  const skipBtn = root.querySelector('#launchSkip');
  const goBtn = root.querySelector('#launchGo');
  skipBtn.textContent = t.skip;
  const capEl = root.querySelector('.warp-cap .cap-t');
  root.setAttribute('aria-label', t.l1 + ' ' + t.l2.replace(/<[^>]+>/g, ''));
  root.hidden = false;
  document.body.classList.add('launching');

  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const dpr = 0.5; // 煙霧本來就是糊的：用一半解析度畫再放大，省很多力氣
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, root.clientWidth);
    H = Math.max(1, root.clientHeight);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const tex = [makePuff('242,236,217', 11), makePuff('190,226,218', 29), makePuff('159,214,205', 47), makePuff('246,243,234', 83)];
  const puffs = [];
  for (let i = 0; i < 46; i++) {
    puffs.push({
      a: Math.random() * Math.PI * 2,
      d: 0.12 + Math.pow(Math.random(), 0.6) * 0.95,
      s: 0.45 + Math.random() * 0.55,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.25,
      va: (Math.random() - 0.5) * 0.06,
      tex: tex[i % 4],
      al: 0.55 + Math.random() * 0.45,
      delay: Math.random() * 0.6,
    });
  }

  const start = performance.now();
  let lastT = start, partT = 0, raf = 0, done = false;
  let warpT = 0, warpMs = WARP_MS, warpDraw = null;
  let resolveDone;
  const donePromise = new Promise(r => { resolveDone = r; });
  let resolveMin;
  const minShown = new Promise(r => { resolveMin = r; });
  setTimeout(() => resolveMin(), minMs);
  // 歡迎詞淡入完成的時間點：3D 場景在這之後才開始建（建的時候畫面會停一下，這時文字已經靜止，比較不明顯）
  const textShown = new Promise(r => setTimeout(r, 1900));

  function draw(now) {
    raf = 0;
    if (done) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const tau = (now - start) / 1000;
    const p = partT ? Math.min(1, (now - partT) / (warpT ? 1500 : 1300)) : 0;
    const w = warpT ? smooth((now - warpT) / 900) : 0; // 蟲洞隧道淡入（煙霧同時淡出）
    ctx.clearRect(0, 0, W, H);
    const baseA = (partT ? Math.pow(1 - p, 2) : 1) * (1 - w);
    if (baseA > 0.002) {
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, `rgba(36,68,59,${baseA})`);
      g.addColorStop(0.55, `rgba(23,45,39,${baseA})`);
      g.addColorStop(1, `rgba(11,26,21,${baseA})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const hd = Math.hypot(W, H) * 0.5, big = Math.max(W, H);
    for (const q of puffs) {
      const inA = Math.min(1, Math.max(0, (tau - q.delay) / 1.1));
      q.rot += q.vr * dt;
      q.a += q.va * dt;
      const push = 1 + 2.6 * p * p, grow = (0.8 + 0.2 * inA) * (1 + 1.4 * p);
      const x = W / 2 + Math.cos(q.a) * q.d * hd * push;
      const y = H / 2 + Math.sin(q.a) * q.d * hd * 0.82 * push;
      const sz = q.s * big * 0.62 * grow;
      const a = q.al * 0.4 * inA * Math.pow(1 - p, 1.6) * (q.d < 0.32 ? 0.45 : 1) * (1 - w);
      if (a <= 0.003) continue;
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(q.rot);
      ctx.drawImage(q.tex, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (warpT) {
      const wtau = (now - warpT) / 1000;
      warpDraw(ctx, W, H, wtau, w, p, dt);
    }
    if (partT && !warpT && p < 0.35) { // 衝出煙霧的一下閃光
      ctx.fillStyle = `rgba(200,245,240,${0.2 * Math.sin(Math.PI * p / 0.35)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (p >= 1) { finish(); return; }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('show')));

  function finish() {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    root.hidden = true;
    root.classList.remove('show', 'go', 'parting', 'warping', 'warp-go');
    resolveDone();
  }

  let onSkipCb = null;
  skipBtn.addEventListener('click', () => { if (onSkipCb) onSkipCb(); else finish(); });

  return {
    minShown,
    textShown,
    done: donePromise,
    // 先顯示「出發！」，delay 毫秒後煙霧散開；散開的那一刻呼叫 onStart（讓 3D 開始飛）
    part(onStart, delay = 400) {
      if (partT || done) return donePromise;
      root.classList.remove('counting');
      if (warpT) { capEl.textContent = t.warpGo; root.classList.add('warp-go'); } // 在蟲洞裡：大字改成「穿越成功！」，閃光衝出去
      else { status.textContent = t.go; root.classList.add('go'); }
      const go = () => {
        if (done) return;
        partT = performance.now();
        root.classList.add('parting');
        if (onStart) onStart();
      };
      if (delay > 0) setTimeout(go, delay); else go();
      return donePromise;
    },
    // 有旁白時：顯示「出發」按鈕，等使用者按（聲音一定要等使用者按一下才能播）。onTap 在點擊當下直接呼叫
    showGo(onTap) {
      if (done) return;
      status.textContent = t.ready;
      root.classList.add('ready');
      goBtn.textContent = t.goBtn;
      goBtn.hidden = false;
      goBtn.onclick = () => {
        goBtn.hidden = true;
        goBtn.onclick = null;
        root.classList.remove('ready');
        status.textContent = t.board;
        if (onTap) onTap();
      };
      requestAnimationFrame(() => { try { goBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
    },
    // 穿越蟲洞：歡迎詞退場，畫面切進時空隧道（煙霧淡出）。ms＝預計停留多久。重複呼叫沒有作用
    warp(ms) {
      if (warpT || partT || done) return;
      warpMs = Math.max(1500, ms || WARP_MS);
      warpDraw = makeWarp(warpMs);
      capEl.textContent = t.warp;
      warpT = performance.now();
      root.classList.remove('ready', 'counting');
      goBtn.hidden = true;
      root.classList.add('warping');
    },
    // （舊版）倒數：中央的大字（3、2、1）
    count(text) {
      if (done) return;
      status.textContent = text;
      root.classList.remove('counting');
      void root.offsetWidth; // 重新觸發彈跳動畫
      root.classList.add('counting');
    },
    skip: finish,
    onSkip(cb) { onSkipCb = cb; },
  };
}
