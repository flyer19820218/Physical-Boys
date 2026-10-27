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

// ---------- 蟲洞段：《星際效應》式的 Ellis 蟲洞（真的光線追蹤＋重力透鏡） ----------
// 給學生的科普：電影裡的蟲洞不是「隧道」，而是一顆「水晶球」。
//   這裡畫的是 Ellis 蟲洞：ds² = −dt² + dl² + (b² + l²)(dθ² + sin²θ dφ²)，喉嚨半徑 b（取 1），r² = b² + l²。
//   l > 0 是我們的宇宙，l < 0 是另一個宇宙，l = 0 是喉嚨。它沒有質量、沒有事件視界，本身也不發光。
//   從遠處看，喉嚨是一顆透明的球：球裡是「另一邊宇宙的天空」（光線穿過喉嚨過來），
//   球外是我們這邊的星空，被彎曲的空間偏折（重力透鏡）——越靠近球的邊緣扭曲越厲害，星星被拉成一圈圈弧線。
//   穿越時不會有發亮的隧道：只會看到另一邊的天空越來越大、佔滿整個視野，我們的天空縮到身後。
//   放射光絲的「時空隧道」是科幻的傳統畫法，不是物理。
//   參考：James, von Tunzelmann, Franklin & Thorne〈Visualizing Interstellar's Wormhole〉Am. J. Phys. 83, 486。
// 光線怎麼算：
//   光線的守恆量（撞擊參數）B：dφ/dl = B / ( r √(r² − B²) )。相機在 l_c、像素和「朝蟲洞中心的方向」夾角 α → B = r_c sin α。
//   B < b：光穿過喉嚨，看到另一邊；B > b：在 r = B 轉彎折回，看到我們這邊；B 很接近 b 的光會繞喉嚨好幾圈 → 球邊緣的環形條紋。
//   掃過的總角度 φ = K(B) − F(|l_c|, B)（朝喉嚨走）或 F(|l_c|, B)（背著喉嚨走）：
//     K(B)：整條路徑（與相機無關，模組載入後在閒置時間做成表）；F：相機到無窮遠（每格現算，16 點高斯積分）。
//   畫面對蟲洞中心旋轉對稱 → 每格只要算一條「離中心距離 → φ」的表，再逐像素查兩張天空貼圖（低解析度畫布，最後放大）。
const TAU = Math.PI * 2, DEG = Math.PI / 180;
export const WARP_MS = 6000;          // 蟲洞段長度（有旁白時以旁白時間表為準，與 build_narration.py 的 WARP_MIN 一致）
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

// ===== 可調參數（長度單位＝喉嚨半徑 b） =====
export const WORM = {
  // 鏡頭與構圖
  FOV: 50,            // 水平視野（度）；橫式時球會撞到上方大字，就自動拉廣角（見 TOP_SAFE）
  CY: 0.575,          // 蟲洞中心的高度（畫面比例；上方留給 DOM 大字）
  TOP_SAFE: 0.17,     // 接近段最大的球（含邊緣光）上緣不高過畫面高度的這個比例
  A_START: 14,        // 接近段開始時球的視半徑（度）——相機慢慢靠近
  A_END: 20,          // 接近段結束（開始穿越）時球的視半徑（度）
  TUNNEL_S: 0.75,     // 最後穿過喉嚨的秒數（含在蟲洞段總長裡）
  L_EXIT: -0.9,       // 穿過後相機到達的位置（負＝另一個宇宙）
  PUSH_POW: 2.4,      // 推進的加速感（越大越晚才衝）
  SHAKE: 2.2,         // 穿過喉嚨那一下的微晃（CSS px）
  // 光線查表（CPU 退回路徑）
  RES_W: 640,         // 低解析度畫布寬度上限（CPU 退回路徑；20261027h 是 360）
  RES_PIX: 260000,    // 低解析度畫布像素上限（直式時寬度會再縮）
  MIP_BIAS: 0.45,     // 切向的模糊程度（越小越銳利，也越容易閃爍）
  MIP_RAD: 0.8,       // 徑向（被透鏡壓縮的方向）的模糊程度
  EDGE_PHI: 0.2,      // 每個低解析度像素 φ 變化超過這個（弧度）→ 直接用整片天空的平均色（球邊緣不閃爍）
  // 球的邊緣光
  RIM: 0.4,           // 邊緣光亮度
  RIM_W: 2.0,         // 邊緣光寬度（CSS px）
  DISPERSION: 1.3,    // 色散：紅、藍光環錯開的距離（CSS px）
  HALO: 0.13,         // 球外很淡的暖色光暈
  // 天空
  GAL_R: 50,          // 另一邊螺旋星系的角半徑（度）
  GAL_INC: 57,        // 星系盤面傾角（度）
  GAL_PA: 28,         // 星系長軸方向（度）
  GAL_OFF: 6,         // 星系中心偏離正前方的角度（度）
  STARS_HERE: 4600,   // 我們這邊全天的星數（稀疏）
  STARS_THERE: 17000, // 另一邊全天的星數（密）
  ROLL: 5,            // 整段天空緩慢旋轉的角度（度）
  // 太空梭（20261027j）：蟲洞沒有重力、沒有吸力、沒有潮汐力 → 太空梭靠引擎、機頭對準喉嚨、沿一條平行於蟲洞軸的直線等速開進去；
  //   追隨鏡頭在它後上方、軸向間距固定 → 太空梭在畫面下方的位置與大小大致不變，是球在變大、迎面而來。
  //   穿過喉嚨後它在另一邊的星空裡繼續往前飛（畫在球裡），出洞後鏡頭滑行減速、它照樣等速 → 慢慢往消失點縮小、被閃光吞沒。
  SHIP_SEP: 1.0,      // 鏡頭與太空梭沿軸向的間距（喉嚨半徑＝1），整段固定
  SHIP_H: 0.24,       // 航線在蟲洞軸（鏡頭）下方多遠；SHIP_H / SHIP_SEP ≈ 太空梭在球心下方的視角正切（約 13.5°：一開始壓在球緣，之後在球面前方）
  SHIP_DX: 0.03,      // 航線往右偏離軸多少（一點點，讓機頭微微斜向球心；仍是平行於軸的直線）
  SHIP_LEN: 0.22,     // 太空梭大小（翼展，喉嚨半徑＝1）
  SHIP_THICK: 0.18,   // 機身厚度／長度：從後上方看，俯視圖沿機身壓成 sinα + SHIP_THICK·cosα（α＝視線與機身的夾角＝鏡頭俯角）
  FLASH: 0.8,         // 出洞閃光的峰值（原本 0.95）
  // ---- 高清 GL 路徑（20261027i） ----
  GL: 'auto',         // 'auto'：能用 WebGL 就用；'off'：一律用 CPU；'force'：連軟體模擬的 GL 也用（測試用）。網址 ?gl=0／?gl=force 同義
  QUALITY: 'auto',    // 'auto'（第一秒依幀時間自動降檔）｜'high'｜'medium'
  GL_SCALE: 0,        // 0＝自動：裝置像素比（最多 2），太慢就降到 1.5、1.0；> 0 固定倍率（測試用）
  GL_MAXSIDE: 2560,   // GL 畫布長邊上限（裝置像素）
  GL_DELAY: 250,      // 開場後多久開始在背景建 GL（ms）
  FPS_MIN: 45,        // 低於這個幀率就降一檔
  PHI_N: 1024,        // 每格上傳的光線表長度（兩列：B<1、B>1）
  STAR_SIG: 0.55,     // 星點大小（高斯 σ，CSS px）
  STAR_GAMMA: 0.35,   // 星點被透鏡壓縮時變暗的程度（1＝物理的放大率 μ；越小，球裡的星越亮、越像點點閃光）
  STAR_GAIN: 1.0,     // 星點整體亮度
  GAL_GRAIN: 1.0,     // 星系近看時解析出來的老年黃星顆粒強度
  GAL_CLUSTER: 1.0,   // 星系旋臂上年輕藍星團的亮度
  // 曝光曲線：球裡（另一邊）的亮度與球緣光，隨時間平順增加，穿越時最亮（色調曲線有肩部，不會爆白）
  EXP0: 0.85,         // 開始
  EXP1: 1.24,         // 接近段結束（開始穿越）
  EXP2: 1.3,          // 穿過喉嚨
  RIM0: 0.7,          // 球緣光倍率：開始
  RIM1: 1.3,          // 球緣光倍率：接近段結束
};

// ---------- 小工具 ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// 3D 值雜訊（用方向向量取樣：天球上沒有接縫、極點也不會怪）
function makeNoise(seed) {
  const R = rng(seed), P = new Uint8Array(512), V = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; V[i] = R(); }
  for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0, t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const n = (x, y, z) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    let fx = x - X, fy = y - Y, fz = z - Z;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const xi = X & 255, yi = Y & 255, zi = Z & 255;
    const a = P[xi] + yi, b = P[xi + 1] + yi;
    const aa = P[a] + zi, ab = P[a + 1] + zi, ba = P[b] + zi, bb = P[b + 1] + zi;
    const x00 = V[P[aa]] + (V[P[ba]] - V[P[aa]]) * fx, x10 = V[P[ab]] + (V[P[bb]] - V[P[ab]]) * fx;
    const x01 = V[P[aa + 1]] + (V[P[ba + 1]] - V[P[aa + 1]]) * fx, x11 = V[P[ab + 1]] + (V[P[bb + 1]] - V[P[ab + 1]]) * fx;
    const y0 = x00 + (x10 - x00) * fy, y1 = x01 + (x11 - x01) * fy;
    return y0 + (y1 - y0) * fz;
  };
  return (x, y, z, oct) => {        // fbm，回傳約 0～1
    let s = 0, a = 0.5, f = 1, t = 0;
    for (let o = 0; o < oct; o++) { s += a * n(x * f + o * 17.3, y * f - o * 9.1, z * f + o * 5.7); t += a; a *= 0.5; f *= 2.03; }
    return s / t;
  };
}

// ---------- 1. 光線積分 ----------
// K(B)：整條光線掃過的角度（與相機位置無關）
//   B < 1：K = 2∫₀^∞ B dw / √(1 + (1−B²) sinh²w)      （代換 l = √(1−B²) sinh w）
//   B > 1：K = 2∫₀^∞ B dw / √(1 + (B²−1) cosh²w)      （代換 l = √(B²−1) cosh w，轉折點的 1/√ 奇異消失）
//   兩個被積函數都是平滑的偶函數 → 梯形法就非常準。表格用 v = ln|B − 1| 均勻取樣，B → 1 時（繞很多圈）也夠細。
const KT = { N: 1024, VMIN: -16, VHI: 1.8, lo: null, hi: null };
function* kTable() {
  if (KT.lo) return;
  let lastY = performance.now();
  const h = 0.02, NW = 1001, S2 = new Float64Array(NW), C2 = new Float64Array(NW), EW = new Float64Array(NW);
  for (let i = 0; i < NW; i++) { const s = Math.sinh(i * h), c = Math.cosh(i * h); S2[i] = s * s; C2[i] = c * c; EW[i] = Math.exp(-i * h); }
  const integ = (k2, A) => {          // ∫₀^∞ dw / √(1 + k2·A(w))，尾巴用 2e^{−w}/√k2 補上
    let s = 0.5 / Math.sqrt(1 + k2 * A[0]);
    for (let i = 1; i < NW; i++) {
      const fi = 1 / Math.sqrt(1 + k2 * A[i]);
      if (k2 * A[i] > 1e7) return (s + 0.5 * fi) * h + 2 * EW[i] / Math.sqrt(k2);
      s += fi;
    }
    return s * h;
  };
  const { N, VMIN, VHI } = KT, lo = new Float32Array(N), hi = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const B1 = 1 - Math.exp(VMIN + (0 - VMIN) * i / (N - 1));
    lo[i] = 2 * B1 * integ(Math.max(1e-30, 1 - B1 * B1), S2);
    const B2 = 1 + Math.exp(VMIN + (VHI - VMIN) * i / (N - 1));
    hi[i] = 2 * B2 * integ(B2 * B2 - 1, C2);
    if (performance.now() - lastY > 6) { yield; lastY = performance.now(); }
  }
  KT.lo = lo; KT.hi = hi;
}
function kOf(B) {
  const { N, VMIN, VHI, lo, hi } = KT;
  let f, T;
  if (B < 1) { f = (Math.log(1 - B) - VMIN) / (0 - VMIN) * (N - 1); T = lo; }
  else { f = B === 1 ? 0 : (Math.log(B - 1) - VMIN) / (VHI - VMIN) * (N - 1); T = hi; }
  if (!(f > 0)) return T[0];
  if (f >= N - 1) return T[N - 1];
  const i = f | 0, t = f - i;
  return T[i] + (T[i + 1] - T[i]) * t;
}
// F(L, B) = ∫_L^∞ B dl / ( √(1+l²) √(l²+1−B²) )：相機（|l| = L）到無窮遠掃過的角度。代換 l = L + c(1−x)/x → 平滑，16 點高斯積分。
const GL = (() => {
  const n = 16, X = new Float64Array(n), Wt = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let x = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), dp = 0;
    for (let it = 0; it < 60; it++) {
      let p0 = 1, p1 = x;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (x * p1 - p0) / (x * x - 1);
      const dx = p1 / dp; x -= dx;
      if (Math.abs(dx) < 1e-15) break;
    }
    X[i] = 0.5 * (1 - x); Wt[i] = 1 / ((1 - x * x) * dp * dp);   // 映到 (0,1)：權重 2/((1−x²)P'²) × ½
  }
  return { X, W: Wt };
})();
function fOf(L, B) {
  const c = 1 + L, r2 = 1 - B * B, X = GL.X, Wt = GL.W;
  let s = 0;
  for (let k = 0; k < 16; k++) {
    const x = X[k], l = L + c * (1 - x) / x, l2 = l * l;
    s += Wt[k] * c / (x * x * Math.sqrt(1 + l2) * Math.sqrt(l2 + r2));
  }
  return B * s;
}
// 相機位置 ↔ 球的視半徑：sin α_c = b / r_c
const lOfAngle = a => Math.sqrt(Math.max(0, 1 / Math.pow(Math.sin(a * DEG), 2) - 1));

// ---------- 2. 兩邊的天空貼圖（程序生成，不用外部圖檔） ----------
// 座標：以相機視軸為極軸的經緯貼圖。d＝離「重要極點」的角度（我們這邊＝蟲洞正後方，另一邊＝穿過去的正前方），ψ＝繞視軸的方位角。
// 靠近極點的列格子比較少（每格接近正方形）；d < D1 用細格（給畫面直接看到的區域），其餘粗格（只出現在被壓縮的環裡）。
// 另外做 8 層縮圖（mip）：透鏡把天空壓得很密的地方取比較糊的那層，畫面才不會閃爍。
const SK = { NC: 2048, CB: 11, D1: 60 * DEG, S1: 0.16 * DEG, S2: 0.5 * DEG, NL: 8, N1: 0, NR: 0, lv: null, per: 0, TEX: null, ready: false };
SK.N1 = Math.round(SK.D1 / SK.S1); SK.NR = SK.N1 + Math.round((Math.PI - SK.D1) / SK.S2);
const rowOf = d => { const r = d < SK.D1 ? d / SK.S1 : SK.N1 + (d - SK.D1) / SK.S2; return r < 0 ? 0 : r > SK.NR - 0.001 ? SK.NR - 0.001 : r; };
const dOfRow = r => (r < SK.N1 ? r * SK.S1 : Math.min(Math.PI, SK.D1 + (r - SK.N1) * SK.S2));
const stepOf = d => (d < SK.D1 ? SK.S1 : SK.S2);
function skyLayout() {
  if (SK.lv) return;
  const lv = [];
  let rows = SK.NR, ncol = new Uint16Array(rows), off = 0;
  for (let r = 0; r < rows; r++) {
    const d = dOfRow(r + 0.5), want = TAU * Math.sin(d) / stepOf(d);
    let n = 4; while (n < want && n < SK.NC) n <<= 1;
    ncol[r] = n;
  }
  for (let k = 0; k < SK.NL; k++) {
    if (k) {
      const prev = lv[k - 1], R2 = Math.ceil(prev.rows / 2), nc = new Uint16Array(R2);
      for (let r = 0; r < R2; r++) {
        const a = prev.ncol[2 * r], b = 2 * r + 1 < prev.rows ? prev.ncol[2 * r + 1] : a;
        nc[r] = Math.max(1, Math.min(a, b) >> 1);
      }
      rows = R2; ncol = nc;
    }
    const o = new Int32Array(rows), sh = new Uint8Array(rows);
    for (let r = 0; r < rows; r++) { o[r] = off; off += ncol[r]; sh[r] = SK.CB - Math.round(Math.log2(ncol[r])); }
    lv.push({ rows, ncol, off: o, sh });
  }
  SK.lv = lv; SK.per = off;
}

// 另一邊的螺旋星系
function galaxyModel() {
  const off = WORM.GAL_OFF * DEG, dir = -2.25;                  // 中心稍微偏左上
  const c = [Math.sin(off) * Math.cos(dir), Math.sin(off) * Math.sin(dir), Math.cos(off)];
  let e1 = [c[2], 0, -c[0]]; const n1 = Math.hypot(...e1); e1 = e1.map(v => v / n1);
  const e2 = [c[1] * e1[2] - c[2] * e1[1], c[2] * e1[0] - c[0] * e1[2], c[0] * e1[1] - c[1] * e1[0]];
  const pa = WORM.GAL_PA * DEG, ca = Math.cos(pa), sa = Math.sin(pa);
  return { c, a: e1.map((v, i) => ca * v + sa * e2[i]), b: e2.map((v, i) => -sa * e1[i] + ca * v), Rg: Math.tan(WORM.GAL_R * DEG), ci: Math.cos(WORM.GAL_INC * DEG) };
}

// 天空的「漫射光」（底色、銀河帶、星雲、星系）：在半解析度的格子上算，之後雙線性放大
function makeDiffuse(side) {
  const nz = makeNoise(side ? 9173 : 3301), nz2 = makeNoise(side ? 5519 : 7741);
  if (!side) {
    // 我們這邊：深綠黑，加一道很淡的銀河帶（斜斜地從蟲洞後方經過，透鏡扭曲時看得出彎）
    const dl = 17 * DEG, g = 40 * DEG;
    const N = [Math.cos(dl) * Math.cos(g), Math.cos(dl) * Math.sin(g), -Math.sin(dl)];
    return (x, y, z, o) => {
      const n = nz(x * 2.6, y * 2.6, z * 2.6, 3);
      let r = 10.5, gg = 21, b = 18.2;
      const k = 0.86 + 0.28 * n; r *= k; gg *= k; b *= k;
      const t = N[0] * x + N[1] * y + N[2] * z;
      const band = Math.exp(-(t * t) / 0.016);
      if (band > 0.01) {
        const cl = nz2(x * 5.5, y * 5.5, z * 5.5, 4);
        const rift = Math.exp(-((t - 0.015) * (t - 0.015)) / 0.0005) * (0.45 + 0.55 * nz(x * 9, y * 9, z * 9, 2));
        const I = band * (0.25 + 1.1 * cl * cl) * (1 - 0.6 * rift);
        r += I * 30; gg += I * 40; b += I * 37;
      }
      o[0] = r; o[1] = gg; o[2] = b;
    };
  }
  // 另一邊：偏暖（琥珀、玫瑰紫），有一個大的螺旋星系
  const G = galaxyModel(), { c, a, b: bb, Rg, ci } = G;
  return (x, y, z, o) => {
    let r = 19, gg = 10.5, b = 17;
    const cz = c[0] * x + c[1] * y + c[2] * z;
    const hz = Math.exp((cz - 1) / 0.3);                          // 星系周圍的琥珀色光霧
    r += 34 * hz; gg += 19 * hz; b += 9 * hz;
    const n1 = nz(x * 2.2, y * 2.2, z * 2.2, 3), n2 = nz2(x * 4.4, y * 4.4, z * 4.4, 3);
    const rose = Math.max(0, n1 - 0.5), amb = Math.max(0, n2 - 0.56);
    r += rose * rose * 300 + amb * amb * 260; gg += rose * rose * 80 + amb * amb * 140; b += rose * rose * 230 + amb * amb * 50;
    if (cz > 0.3) {
      const X = (a[0] * x + a[1] * y + a[2] * z) / cz / Rg, Y = (bb[0] * x + bb[1] * y + bb[2] * z) / cz / Rg;
      const Yd = Y / ci, rr = Math.hypot(X, Yd);
      if (rr < 1.6) {
        const rs = Math.hypot(X, Y / 0.82);
        const bulge = 2.4 * Math.exp(-Math.pow(rs / 0.035, 0.8)) + 0.7 * Math.exp(-rs / 0.1);
        const ang = Math.atan2(Yd, X), ph = ang - Math.log(rr + 0.015) / 0.32;
        const q = nz(x * 16, y * 16, z * 16, 3), q2 = nz2(x * 34, y * 34, z * 34, 1);
        const w = 1.3 * (q - 0.5);
        const arm = Math.pow(0.5 + 0.5 * Math.cos(2 * ph + w), 3);
        const lane = Math.pow(0.5 + 0.5 * Math.cos(2 * ph + 0.8 + w), 16);
        const disk = Math.exp(-rr / 0.27) * smooth((1.3 - rr) / 0.5) * smooth(rr / 0.05);
        const armI = disk * (0.2 + 1.7 * arm * (0.5 + q));
        const dust = 1 - 0.7 * lane * smooth(rr / 0.06) * smooth((1.15 - rr) / 0.35);
        const hii = disk * arm * arm * Math.pow(Math.max(0, q2 - 0.6) / 0.4, 2) * 2.2;
        const outer = smooth(rr / 0.6);                             // 外圈偏淡紫
        r += (bulge * 255 + armI * lerp(235, 205, outer) * 0.55) * dust + hii * 255 + 0.06 * Math.exp(-rs / 0.5) * 255;
        gg += (bulge * 196 + armI * lerp(200, 185, outer) * 0.55) * dust + hii * 92 + 0.06 * Math.exp(-rs / 0.5) * 170;
        b += (bulge * 140 + armI * lerp(215, 245, outer) * 0.55) * dust + hii * 150 + 0.06 * Math.exp(-rs / 0.5) * 110;
      }
    }
    o[0] = r; o[1] = gg; o[2] = b;
  };
}

// 一顆星「點」到貼圖（第 0 層，雙線性分配，總亮度守恆）
function splat(F0, lv0, x, y, z, I, cr, cg, cb) {
  const d = Math.acos(Math.max(-1, Math.min(1, z)));
  let psi = Math.atan2(y, x); if (psi < 0) psi += TAU;
  const st = stepOf(d), amp = I * (SK.S1 / st) * (SK.S1 / st);
  const rf = rowOf(d) - 0.5, r0 = Math.floor(rf), fr = rf - r0;
  for (let k = 0; k < 2; k++) {
    const rr = r0 + k, wr = k ? fr : 1 - fr;
    if (rr < 0 || rr >= lv0.rows || wr <= 0) continue;
    const n = lv0.ncol[rr], cf = psi / TAU * n - 0.5, c0 = Math.floor(cf), fc = cf - c0, base = lv0.off[rr] * 3;
    const i0 = base + (((c0 % n) + n) % n) * 3, i1 = base + (((c0 + 1) % n + n) % n) * 3;
    const a0 = amp * wr * (1 - fc), a1 = amp * wr * fc;
    F0[i0] += a0 * cr; F0[i0 + 1] += a0 * cg; F0[i0 + 2] += a0 * cb;
    F0[i1] += a1 * cr; F0[i1 + 1] += a1 * cg; F0[i1 + 2] += a1 * cb;
  }
}
// 亮星的光暈：在切平面上撒一圈高斯分布的點
function haloSplat(F0, lv0, x, y, z, I, cr, cg, cb, rad) {
  let ux = -y, uy = x, uz = 0; let nn = Math.hypot(ux, uy); if (nn < 1e-6) { ux = 1; uy = 0; nn = 1; } ux /= nn; uy /= nn;
  const vx = y * uz - z * uy, vy = z * ux - x * uz, vz = x * uy - y * ux;
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    if (!i && !j) continue;
    const wgt = Math.exp(-(i * i + j * j) / 2) * 0.1, a = i * rad / 2, b = j * rad / 2;
    let px = x + a * ux + b * vx, py = y + a * uy + b * vy, pz = z + a * uz + b * vz;
    const m = Math.hypot(px, py, pz); px /= m; py /= m; pz /= m;
    splat(F0, lv0, px, py, pz, I * wgt, cr, cg, cb);
  }
}
// 貼圖產生的內層迴圈（放在一般函式裡，JavaScript 引擎才最佳化得好）
function fillRow(F0, TR, G, a0, a1, tg, GC, n, ob) {
  for (let i = 0; i < GC * 3; i++) TR[i] = G[a0 + i] + (G[a1 + i] - G[a0 + i]) * tg;   // 先在列方向內插
  const sc = GC / n;
  for (let c = 0; c < n; c++) {
    const cf = (c + 0.5) * sc - 0.5, cc = Math.floor(cf), tc = cf - cc, i0 = ((cc + GC) % GC) * 3, i1 = ((cc + 1) % GC) * 3, oi = ob + c * 3;
    F0[oi] = TR[i0] + (TR[i1] - TR[i0]) * tc; F0[oi + 1] = TR[i0 + 1] + (TR[i1 + 1] - TR[i0 + 1]) * tc; F0[oi + 2] = TR[i0 + 2] + (TR[i1 + 2] - TR[i0 + 2]) * tc;
  }
}
function mipRow(Fk, Mx, P, Q, ot, nt, os, ns, rw) {
  const lg = Math.round(Math.log2(ns / nt)), wgt = rw * nt / ns;
  for (let c = 0; c < ns; c++) {
    const t = ot + (c >> lg) * 3, s = os + c * 3;
    Fk[t] += P[s] * wgt; Fk[t + 1] += P[s + 1] * wgt; Fk[t + 2] += P[s + 2] * wgt;
    if (Q[s] > Mx[t]) Mx[t] = Q[s]; if (Q[s + 1] > Mx[t + 1]) Mx[t + 1] = Q[s + 1]; if (Q[s + 2] > Mx[t + 2]) Mx[t + 2] = Q[s + 2];
  }
}
const toneC = x => (x < 190 ? x : 190 + 65 * (1 - Math.exp(-(x - 190) / 65)));
// 縮圖層：平均之外保留一點最亮值（cm）→ 被透鏡壓得很密的地方，星星還看得到一點閃光（不會全糊成一片）
function packRange(F, Mx, cm, TEX, ob, i0, i1) {
  for (let i = i0; i < i1; i++) {
    let r = F[i * 3], g = F[i * 3 + 1], b = F[i * 3 + 2];
    if (cm > 0) { r += cm * (Mx[i * 3] - r); g += cm * (Mx[i * 3 + 1] - g); b += cm * (Mx[i * 3 + 2] - b); }
    const m = Math.max(r, g, b);
    if (m > 200) { const k = Math.min(0.6, (m - 200) / 900); r += (m - r) * k; g += (m - g) * k; b += (m - b) * k; }   // 太亮的地方偏白
    r = toneC(r); g = toneC(g); b = toneC(b);
    TEX[ob + i] = (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
  }
}
const STAR_COL = [[200, 220, 255], [235, 240, 255], [255, 250, 238], [255, 230, 190], [255, 200, 150]];
function* skyTexture(side, TEX, base, SC) {
  let lastY = performance.now();
  const tick = () => performance.now() - lastY > 6;
  const lv = SK.lv, lv0 = lv[0], zs = side ? 1 : -1;
  // (a) 漫射光：半解析度格子
  const GR = Math.ceil(SK.NR / 2), GC = 320, G = SC.G || (SC.G = new Float32Array(GR * GC * 3)), diff = makeDiffuse(side), o = [0, 0, 0];
  for (let r = 0; r < GR; r++) {
    const d = dOfRow((r + 0.5) * 2), sd = Math.sin(d), cd = Math.cos(d) * zs;
    for (let c = 0; c < GC; c++) {
      const p = (c + 0.5) / GC * TAU;
      diff(sd * Math.cos(p), sd * Math.sin(p), cd, o);
      const i = (r * GC + c) * 3; G[i] = o[0]; G[i + 1] = o[1]; G[i + 2] = o[2];
    }
    if (tick()) { yield; lastY = performance.now(); }
  }
  // (b) 放大到第 0 層
  const F0 = SC.F0 || (SC.F0 = new Float32Array(lv0.off[lv0.rows - 1] * 3 + lv0.ncol[lv0.rows - 1] * 3));   // 每格都會被覆寫，不必清零
  const TR = new Float32Array(GC * 3);
  for (let r = 0; r < lv0.rows; r++) {
    const gf = Math.min(GR - 1.001, Math.max(0, (r + 0.5) / 2 - 0.5)), g0 = gf | 0, tg = gf - g0, n = lv0.ncol[r], ob = lv0.off[r] * 3;
    const a0 = g0 * GC * 3, a1 = a0 + GC * 3;
    fillRow(F0, TR, G, a0, a1, tg, GC, n, ob);
    if (tick()) { yield; lastY = performance.now(); }
  }
  // (c) 星星
  const R = rng(side ? 424242 : 171717), uni = () => { const z = 2 * R() - 1, p = TAU * R(), s = Math.sqrt(1 - z * z); return [s * Math.cos(p), s * Math.sin(p), z]; };
  const nStar = side ? WORM.STARS_THERE : WORM.STARS_HERE;
  const Gm = side ? galaxyModel() : null;
  const dl = 17 * DEG, gA = 40 * DEG, NB = [Math.cos(dl) * Math.cos(gA), Math.cos(dl) * Math.sin(gA), -Math.sin(dl)];
  const extra = side ? 7000 : 2600;
  for (let k = 0; k < nStar + extra; k++) {
    let v = uni();
    if (k >= nStar) {             // 額外的星：集中在銀河帶（這邊）或星系盤（那邊）
      for (let tries = 0; tries < 40; tries++) {
        v = uni();
        if (side) {
          const cz = Gm.c[0] * v[0] + Gm.c[1] * v[1] + Gm.c[2] * v[2];
          if (cz > 0.3) {
            const X = (Gm.a[0] * v[0] + Gm.a[1] * v[1] + Gm.a[2] * v[2]) / cz / Gm.Rg, Y = (Gm.b[0] * v[0] + Gm.b[1] * v[1] + Gm.b[2] * v[2]) / cz / Gm.Rg / Gm.ci;
            if (R() < Math.exp(-Math.hypot(X, Y) / 0.35)) break;
          }
        } else {
          const t = NB[0] * v[0] + NB[1] * v[1] + NB[2] * v[2];
          if (R() < Math.exp(-(t * t) / 0.012)) break;
        }
      }
    }
    const m = R(), I = side ? 40 + 420 * Math.pow(m, 8) + (m > 0.996 ? 900 : 0) : 22 + 300 * Math.pow(m, 10) + (m > 0.997 ? 1100 : 0);
    const h = R(), col = side ? STAR_COL[h < 0.12 ? 0 : h < 0.3 ? 1 : h < 0.55 ? 2 : h < 0.82 ? 3 : 4] : STAR_COL[h < 0.25 ? 0 : h < 0.55 ? 1 : h < 0.8 ? 2 : h < 0.95 ? 3 : 4];
    const x = v[0], y = v[1], z = v[2] * zs;
    splat(F0, lv0, x, y, z, I, col[0] / 255, col[1] / 255, col[2] / 255);
    if (I > 400) haloSplat(F0, lv0, x, y, z, I, col[0] / 255, col[1] / 255, col[2] / 255, (0.35 + 0.0004 * I) * DEG);
    if ((k & 255) === 0 && tick()) { yield; lastY = performance.now(); }
  }
  // (d) 色調壓縮＋打包＋縮圖
  const pack = function* (F, L, Mx, cm) {
    const ob = base + L.off[0], n = F.length / 3;
    for (let i = 0; i < n; i += 65536) { packRange(F, Mx, cm, TEX, ob, i, Math.min(n, i + 65536)); if (tick()) { yield; lastY = performance.now(); } }
  };
  // 整片天空的平均色（依每格的立體角加權）：給光線繞了無數圈的球邊緣用，放在貼圖最後面
  const avg = new Float32Array(3);
  let wsum = 0;
  for (let r = 0; r < lv0.rows; r++) {
    const d = dOfRow(r + 0.5), n = lv0.ncol[r], wgt = stepOf(d) * Math.sin(d) / n, ob = lv0.off[r] * 3;
    for (let c = 0; c < n; c++) { avg[0] += F0[ob + c * 3] * wgt; avg[1] += F0[ob + c * 3 + 1] * wgt; avg[2] += F0[ob + c * 3 + 2] * wgt; }
    wsum += wgt * n;
    if ((r & 31) === 0 && tick()) { yield; lastY = performance.now(); }
  }
  for (let i = 0; i < 3; i++) avg[i] /= wsum;
  packRange(avg, null, 0, TEX, 2 * SK.per + side, 0, 1);
  yield* pack(F0, lv0, null, 0);
  let P = F0, Q = F0;          // P：純平均；Q：區塊內最亮值
  const CM = [0, 0.3, 0.25, 0.18, 0.1, 0.04, 0, 0];
  for (let k = 1; k < SK.NL; k++) {
    const A = lv[k - 1], B = lv[k], nk = (B.off[B.rows - 1] - B.off[0] + B.ncol[B.rows - 1]) * 3, a0 = A.off[0], b0 = B.off[0];
    const Fk = SC['F' + k] ? SC['F' + k].fill(0) : (SC['F' + k] = new Float32Array(nk)), Mx = SC['M' + k] ? SC['M' + k].fill(0) : (SC['M' + k] = new Float32Array(nk));
    for (let r = 0; r < B.rows; r++) {
      const nt = B.ncol[r], ot = (B.off[r] - b0) * 3;
      const two = 2 * r + 1 < A.rows;
      mipRow(Fk, Mx, P, Q, ot, nt, (A.off[2 * r] - a0) * 3, A.ncol[2 * r], two ? 0.5 : 1);
      if (two) mipRow(Fk, Mx, P, Q, ot, nt, (A.off[2 * r + 1] - a0) * 3, A.ncol[2 * r + 1], 0.5);
      if ((r & 7) === 0 && tick()) { yield; lastY = performance.now(); }
    }
    yield* pack(Fk, B, Mx, CM[k]);
    P = Fk; Q = Mx;
    if (tick()) { yield; lastY = performance.now(); }
  }
}
function* skyTextures() {
  if (SK.ready) return;
  skyLayout();
  const TEX = new Uint32Array(SK.per * 2 + 2);
  for (let i = 0; i < TEX.length; i += 131072) { TEX.fill(0xff131611, i, i + 131072); yield; }   // 先分段寫一遍：大陣列第一次寫入時才真正配置記憶體，一次寫完會卡一下
  const SC = {};                 // 暫存陣列兩邊共用（少配置記憶體 → 少一次大的垃圾回收卡頓）
  yield* skyTexture(0, TEX, 0, SC);
  yield* skyTexture(1, TEX, SK.per, SC);
  SK.TEX = TEX; SK.ready = true;
}
// 開場結束後放掉 CPU 路徑的大陣列（回到首頁不佔記憶體；K 表只有 8 KB，留著）
function freeCpuSky() { SK.TEX = null; SK.ready = false; WARM_S = null; PREP_CACHE.clear(); refreshReady(); }

// 和畫面尺寸無關的預算：模組載入後利用閒置時間一點一點先算好。
//   K 表（約 10～20 ms）兩條路徑都要；兩張天空貼圖（約 300～400 ms、常駐約 7.7 MB＋暫存約 14 MB）只有 CPU 退回路徑要，
//   GL 路徑可用時就不算（天空在 GPU 上程序生成）。GL 建立失敗或 context lost 時才補算。
export const warpStats = { warmMs: 0, prepMs: 0, frameMs: 0, ready: false, res: '', path: '', gl: {} };
let WARM_K = null, WARM_S = null;
const skyNeeded = () => !HD.want || HD.state === 'failed' || HD.state === 'lost';
function refreshReady() { warpStats.ready = !!KT.lo && (SK.ready || !skyNeeded()); return warpStats.ready; }
// 在預算 bud 毫秒內往下算；回傳「目前需要的都算好了沒」
function warmStep(bud) {
  const t0 = performance.now();
  let r = false;
  try {
    if (!KT.lo) { WARM_K = WARM_K || kTable(); while (performance.now() - t0 < bud) if (WARM_K.next().done) break; }
    if (KT.lo && skyNeeded() && !SK.ready) { WARM_S = WARM_S || skyTextures(); while (performance.now() - t0 < bud) if (WARM_S.next().done) break; }
    r = refreshReady();
  } finally { warpStats.warmMs += performance.now() - t0; }
  return r;
}
let warmTimer = 0;
function scheduleWarm(delay = 4) {
  if (typeof window === 'undefined' || warmTimer) return;
  // 開場時主執行緒很忙（3D 場景在建），閒置時間很少 → 最多等約 60 ms 就一定做一小段（約 10 ms），通常歡迎詞還沒播完就算好了
  const step = dl => {
    const bud = dl && !dl.didTimeout ? Math.min(12, Math.max(5, dl.timeRemaining())) : 11;
    if (warmStep(bud)) return;
    later();
  };
  const later = () => { warmTimer = setTimeout(() => { warmTimer = 0; window.requestIdleCallback ? window.requestIdleCallback(step, { timeout: 50 }) : step(); }, 4); };
  warmTimer = setTimeout(() => { warmTimer = 0; later(); }, delay);
}
scheduleWarm(300);

// ---------- 3. 依畫面尺寸的資料（每個像素離中心的距離索引、方位角欄位） ----------
function layoutOf(W, H) {
  const { FOV, CY, TOP_SAFE, A_END } = WORM;
  const cy = H * CY;
  const fFov = (W / 2) / Math.tan(FOV / 2 * DEG);
  const fTop = Math.min(cy - TOP_SAFE * H, (H - cy) * 0.96) / (Math.tan(A_END * DEG) * 1.06);
  return { cx: W / 2, cy, f: Math.min(fFov, fTop) };
}
const PREP_CACHE = new Map();
function prepare(W, H, Wd) {
  const t0 = performance.now();
  const L = layoutOf(W, H);
  const lw = Math.max(32, Math.min(WORM.RES_W, Wd, Math.round(Math.sqrt(WORM.RES_PIX * W / H)))), lh = Math.max(24, Math.round(lw * H / W));
  const k = lw / W, cxl = L.cx * k, cyl = L.cy * k, fl = L.f * k;
  const NP = lw * lh, RI = new Uint16Array(NP), CI = new Uint16Array(NP);
  let rmax = 0;
  for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
    const dx = i + 0.5 - cxl, dy = j + 0.5 - cyl, rho = Math.hypot(dx, dy), e = Math.round(rho * 4);
    let ps = Math.atan2(dy, dx); if (ps < 0) ps += TAU;
    RI[j * lw + i] = e; CI[j * lw + i] = Math.floor(ps / TAU * SK.NC) & (SK.NC - 1);
    if (e > rmax) rmax = e;
  }
  const NE = rmax + 2, SA = new Float64Array(NE), RHO = new Float32Array(NE);
  for (let e = 0; e < NE; e++) { RHO[e] = e / 4; SA[e] = Math.sin(Math.atan(e / 4 / fl)); }
  const lo = document.createElement('canvas'); lo.width = lw; lo.height = lh;
  const lctx = lo.getContext('2d'), img = lctx.createImageData(lw, lh);
  // 暗角（電影感，也讓上方大字更好讀）
  const vg = document.createElement('canvas'); vg.width = 96; vg.height = Math.max(32, Math.round(96 * H / W));
  const g = vg.getContext('2d'), hyp = Math.hypot(vg.width, vg.height);
  const gr = g.createRadialGradient(vg.width / 2, vg.height * 0.56, hyp * 0.2, vg.width / 2, vg.height * 0.56, hyp * 0.62);
  gr.addColorStop(0, 'rgba(6,12,10,0)'); gr.addColorStop(0.6, 'rgba(6,12,10,0.22)'); gr.addColorStop(1, 'rgba(6,12,10,0.66)');
  g.fillStyle = gr; g.fillRect(0, 0, vg.width, vg.height);
  const D = {
    L, lw, lh, k, fl, NP, RI, CI, NE, SA, RHO, lo, lctx, img, px32: new Uint32Array(img.data.buffer), vg,
    PHI: new Float64Array(NE), SIDE: new Uint8Array(NE), OFF: new Int32Array(NE), SH: new Uint8Array(NE), FLA: new Int32Array(NE),
  };
  warpStats.prepMs = performance.now() - t0; warpStats.res = lw + 'x' + lh;
  return D;
}

// 每一格：相機在 lc 時，「離中心距離 → 天空貼圖的哪一格」的表
function buildRhoTable(D, lc, roll) {
  const { NE, SA, RHO, PHI, SIDE, OFF, SH, FLA } = D;
  const L = Math.abs(lc), rc = Math.sqrt(1 + lc * lc), toward = lc > 0;
  for (let e = 0; e < NE; e++) {
    const B = rc * SA[e];
    if (toward) { PHI[e] = kOf(B) - fOf(L, B); SIDE[e] = B < 1 ? 1 : 0; }   // 朝喉嚨：B<1 穿過去（另一邊），B>1 折回（這邊）
    else { PHI[e] = fOf(L, B); SIDE[e] = 1; }                                // 已在另一邊、背著喉嚨看出去
  }
  const lv = SK.lv, NL = SK.NL, bias = WORM.MIP_BIAS, rollC = Math.round(roll / TAU * SK.NC);
  // 球的邊緣（B = 1）附近 ±1.25 個低解析度像素：光線繞了無數圈，取兩邊天空的平均色 → 邊緣不會一格一格地閃
  const eEdge = toward && rc > 1 ? 4 * D.fl * Math.tan(Math.asin(1 / rc)) : -99;
  for (let e = 0; e < NE; e++) {
    const side = SIDE[e];
    let phi = PHI[e] % TAU; if (phi < 0) phi += TAU;
    let flip = 0; if (phi > Math.PI) { phi = TAU - phi; flip = 1; }
    const d = side ? phi : Math.PI - phi, st = stepOf(d);
    // 這一格在貼圖上的大小（徑向：φ 隨距離變化多快；切向：繞一圈的周長）→ 選 mip 層
    const ea = e > 0 && SIDE[e - 1] === side ? e - 1 : e, eb = e < NE - 1 && SIDE[e + 1] === side ? e + 1 : e;
    const dphi = eb > ea ? Math.abs(PHI[eb] - PHI[ea]) / ((eb - ea) / 4) : 1e3;
    const foot = Math.max(dphi / st * WORM.MIP_RAD, Math.sin(d) / (Math.max(0.5, RHO[e]) * st) * bias);
    let k = 0; if (foot > 2) k = Math.min(NL - 1, Math.floor(Math.log2(foot)));
    if (Math.abs(e - eEdge) < 5 || dphi > WORM.EDGE_PHI) k = NL - 1;
    if (k === NL - 1) { OFF[e] = 2 * SK.per + side; SH[e] = SK.CB; FLA[e] = 0; continue; }   // 壓到最密：整片天空的平均色
    const Lk = lv[k], r = Math.min(Lk.rows - 1, Math.floor(rowOf(d)) >> k);
    OFF[e] = side * SK.per + Lk.off[r]; SH[e] = Lk.sh[r]; FLA[e] = (flip ? SK.NC / 2 : 0) + rollC;
  }
}

// ---------- 太空梭（原創造型，從上方看，機頭朝 −y） ----------
// shuttle(ctx, x, y, u, roll, glow, opt)：u＝尺寸單位（機身全長約 2.5u）；roll＝旋轉角；glow＝引擎火焰 0～1
// opt（可省略）：light 光源方向（螢幕角度，預設右上）、lk 光源強度、sx/sy 沿翼展／沿機身的縮放（透視）、
//               dim 變暗、red 紅移、alpha 透明度、rim 受光側的邊緣光顏色 [r,g,b]（預設暖橘）
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
  lg.addColorStop(0, `rgba(6,18,24,${0.62 + 0.25 * dim})`); lg.addColorStop(0.5, `rgba(20,30,32,${0.14 + 0.3 * dim})`); const lc = o.rim || [255, 140, 60];
  lg.addColorStop(1, `rgba(${lc[0]},${lc[1]},${lc[2]},${0.3 * lk})`);
  a.fillStyle = lg; a.fillRect(-2, -2, 4, 4);
  // 邊緣光：剪影減去往背光方向平移的剪影
  b.fillStyle = o.rim ? `rgb(${o.rim[0]},${o.rim[1]},${o.rim[2]})` : 'rgb(255,158,72)'; silhouette(b);
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

function flashAlpha(p) {
  if (p <= 0) return 0;
  const pk = WORM.FLASH;
  const fl = p < 0.45 ? Math.pow(p / 0.45, 1.5) * pk : pk * Math.pow(1 - (p - 0.45) / 0.55, 1.6);
  return fl <= 0.003 ? 0 : Math.min(1, fl);
}
function drawFlash(ctx, W, H, p) {
  const fl = flashAlpha(p);
  if (!fl) return;
  ctx.fillStyle = `rgba(228,252,250,${fl})`;
  ctx.fillRect(0, 0, W, H);
}

// 細環（徑向近似高斯），只填環本身那一圈，不填整個畫面
function ringFill(ctx, cx, cy, r, w, rgb, a, spread = 2.6) {
  const r0 = Math.max(0, r - spread * w), r1 = r + spread * w;
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, x = (r0 + t * (r1 - r0) - r) / w;
    g.addColorStop(t, `rgba(${rgb},${(a * Math.exp(-x * x)).toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r1, 0, TAU); if (r0 > 0) ctx.arc(cx, cy, r0, 0, TAU, true); ctx.fill();
}

// ======================================================================================
// 高清 GL 路徑（20261027i）：在 GPU 上逐像素畫蟲洞天空
// --------------------------------------------------------------------------------------
// 架構：
//   ‧ 一張全解析度 WebGL 畫布（WebGL2 優先、沒有就 WebGL1）疊在原本半解析度的煙霧畫布上；寬高＝容器 CSS 像素 × 倍率
//     （倍率＝min(裝置像素比, 2)，長邊 ≤ GL_MAXSIDE；第一秒依實際幀時間自動降到 1.5／1.0 倍、高→中品質）。
//   ‧ 光線：每格在 CPU 算一條「撞擊參數 B → 掃過角度 φ」表（兩列 × PHI_N：B<1 以 ln(1−B)、B>1 以 ln(B−1) 為座標，
//     邊緣 B→1 也夠細），打包成 24 位元定點放進 RGBA8 紋理（8 KB；不用浮點紋理 → iOS 沒有浮點線性取樣也沒關係），
//     shader 用 NEAREST 取兩點自己做線性內插。每像素：α → B = r_c sin α → 查 φ → 出射方向 (sinφ cosψ, sinφ sinψ, cosφ)。
//   ‧ 天空全部在 shader 裡程序生成（不吃貼圖記憶體）：我們這邊深綠黑＋淡銀河帶＋暗帶；另一邊暖色星雲＋大螺旋星系
//     （核球、旋臂、塵帶暗帶與細絲、粉紅電離氫區、旋臂上的年輕藍星團、近看時解析出來的老年黃星顆粒、多尺度噪聲）。
//     星點用「方向 → 等角立方體格點」雜湊，三種尺度；每顆星在螢幕空間畫成固定大小的點（用方向對螢幕的 Jacobian 反算），
//     亮星有十字光芒與小光暈。唯一的紋理是 256×256 的雜訊表（256 KB）。
//   ‧ 防閃爍：用 dFdx/dFdy 算每個像素在天空上涵蓋多大（透鏡壓縮處很大）→ 噪聲的高頻層淡出成平均值、星點層淡出成
//     「平均亮度」、旋臂與核球先做等效的模糊；壓到極限（球邊緣、光線繞無數圈）就換成整片天空的平均色（建好時用 GPU 算一次）。
//   ‧ 球緣細暖光＋色散、球外光暈、暗角、色調曲線（有肩部、不爆白）、抖色（避免暗部色階）都在同一個 shader。
//   ‧ 太空梭畫在一張只有它那麼大的 2D 畫布（全解析度），用 CSS 位移跟著走；出洞閃光是一個 div（不佔畫布記憶體）。
// 記憶體（iPad Pro 12.9" 橫式 2560×1919 最壞情況）：GL 畫布 19.7 MB（瀏覽器合成時可能再多一份）、太空梭畫布約 4.6 MB、
//   紋理 0.27 MB。CPU 退回路徑則要常駐 7.7 MB 的天空貼圖＋計算時約 14 MB 暫存。蟲洞段結束／跳過時全部釋放（loseContext）。
// 退回：GL 不可用、建立失敗、highp 不支援、shader 編譯失敗、context lost、?gl=0 → 自動改用上面的 CPU 路徑（不會空白）。
// ======================================================================================
const HD_VS = `
#ifdef GL2
in vec2 aP;
#else
attribute vec2 aP;
#endif
void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

const HD_FS = `
precision highp float;
#ifdef GL2
#define T2(s, uv) textureLod(s, uv, 0.0)
out vec4 oColor;
#define FRAG oColor
#else
#define T2(s, uv) texture2D(s, uv)
#define FRAG gl_FragColor
#endif
uniform vec2 uRes;      // 畫布（裝置像素）
uniform vec2 uC;        // 蟲洞中心（裝置像素，y 向下）
uniform float uF;       // 焦距（裝置像素）
uniform float uS;       // 每 CSS px 幾個裝置像素
uniform float uRc, uToward, uRoll;
uniform vec3 uTab;      // vmin, 第 2 列的 vmax, N
uniform vec2 uPk;       // φ 打包：最小值、範圍
uniform sampler2D uPhi, uNz;
uniform vec3 uGc, uGa, uGb;
uniform vec2 uG;        // 星系 Rg、cos(傾角)
uniform vec4 uQ;        // 星點層數、星系細節層數、星團、老年星顆粒
uniform vec4 uExp;      // 另一邊曝光、這邊曝光、星點 γ、星點亮度
uniform vec4 uRim;      // 球邊緣半徑（裝置像素，≤0 不畫）、寬、色散、亮度
uniform vec2 uHalo;
uniform vec3 uM0, uM1;  // 兩邊天空的平均色
uniform vec2 uAref;     // 未受透鏡時每 CSS px² 的立方體 uv 面積、星系盤面面積
uniform vec2 uGal;      // 老年星顆粒、藍星團強度
uniform float uMode;    // 0 畫面；1、2 等距長方圖（算平均色用）
uniform vec3 uVig;
#define PI 3.14159265
uniform float uSig;

vec4 hash42(vec2 p) {
  vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
float n2(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return T2(uNz, (i + f + 0.5) * (1.0 / 256.0)).r; }
float n3(vec3 x) {
  vec3 p = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  vec2 uv = p.xy + vec2(37.0, 17.0) * p.z + f.xy;
  vec2 rg = T2(uNz, (uv + 0.5) * (1.0 / 256.0)).gr;
  return mix(rg.x, rg.y, f.z);
}
// fbm：fp＝每個像素在噪聲座標裡的寬度；超過約半格的那一層淡出成平均值（不閃爍），之後的層直接用平均值
float fbm3(vec3 p, float fp, float oct) {
  float s = 0.0, a = 0.5, t = 0.0, tt = 1.0 - pow(0.5, oct);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= oct) break;
    float k = 1.0 - smoothstep(0.25, 0.6, fp);
    if (k <= 0.0) { s += 0.5 * (tt - t); t = tt; break; }
    s += a * mix(0.5, n3(p), k); t += a;
    p = p * 2.03 + vec3(17.3, -9.1, 5.7); fp *= 2.03; a *= 0.5;
  }
  return s / tt;
}
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
float fbm2(vec2 p, float fp, float oct) {
  float s = 0.0, a = 0.5, t = 0.0, tt = 1.0 - pow(0.5, oct);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= oct) break;
    float k = 1.0 - smoothstep(0.25, 0.6, fp);
    if (k <= 0.0) { s += 0.5 * (tt - t); t = tt; break; }
    s += a * mix(0.5, n2(p), k); t += a;
    p = ROT * p + vec2(7.1, -3.3); fp *= 2.0; a *= 0.5;
  }
  return s / tt;
}
float phiAt(float row, float v, float vhi) {
  float N = uTab.z;
  float x = clamp((v - uTab.x) / (vhi - uTab.x), 0.0, 1.0) * (N - 1.0);
  float i = min(floor(x), N - 2.0), t = x - i;
  float y = (row + 0.5) * 0.5;
  vec3 a = floor(T2(uPhi, vec2((i + 0.5) / N, y)).rgb * 255.0 + 0.5);
  vec3 b = floor(T2(uPhi, vec2((i + 1.5) / N, y)).rgb * 255.0 + 0.5);
  float fa = dot(a, vec3(65536.0, 256.0, 1.0)), fb = dot(b, vec3(65536.0, 256.0, 1.0));
  return uPk.x + uPk.y * mix(fa, fb, t) * (1.0 / 16777215.0);
}
vec3 starColor(float h, float warm) {
  vec4 th = mix(vec4(0.25, 0.55, 0.8, 0.95), vec4(0.12, 0.3, 0.55, 0.82), warm);
  vec3 c = vec3(1.0, 0.784, 0.588);
  if (h < th.w) c = vec3(1.0, 0.902, 0.745);
  if (h < th.z) c = vec3(1.0, 0.98, 0.933);
  if (h < th.y) c = vec3(0.922, 0.941, 1.0);
  if (h < th.x) c = vec3(0.784, 0.863, 1.0);
  return c;
}
// 一格裡的一顆星：在螢幕空間畫成固定大小的點（s＝離星的距離，CSS px）；亮星加十字光芒與小光暈
vec3 starCell(vec2 g, vec2 cell, vec4 Ji, float seed, float fill, vec3 pk, float mE, float warm, float edgeN) {
  if (edgeN > 0.0 && (cell.x < 0.5 || cell.y < 0.5 || cell.x > edgeN - 1.5 || cell.y > edgeN - 1.5)) return vec3(0.0);
  vec4 h = hash42(cell + seed);
  if (h.x > fill) return vec3(0.0);
  vec2 dg = g - (cell + 0.3 + 0.4 * h.yz);
  float dl = length(dg);
  if (dl > 0.8) return vec3(0.0);
  vec2 s = vec2(Ji.x * dg.x + Ji.y * dg.y, Ji.z * dg.x + Ji.w * dg.y);
  float r2 = dot(s, s);
  float p = pk.x + pk.y * pow(h.w, pk.z);
  float I = exp(-r2 * (0.5 / (uSig * uSig)));
  if (p > 1.1) {
    vec2 as = abs(s);
    float L = 2.5 + 8.0 * min(1.0, p - 1.1);
    I += 0.22 * (exp(-as.y * 2.4 - as.x / L) + exp(-as.x * 2.4 - as.y / L)) + 0.06 * exp(-sqrt(r2) * 0.4);
  }
  float win = 1.0 - smoothstep(0.55, 0.8, dl);
  vec4 h2 = hash42(cell + seed + 71.7);
  return starColor(h2.x, warm) * (p * mE * I * win);
}
// 一層星點。g：格點座標；jx, jy：每 CSS px 在格點座標裡走多少（x、y 方向）；aref：未受透鏡時每 CSS px² 幾格
// 透鏡壓縮（μ<1）時星變暗（μ^γ），點太密（一個點涵蓋超過半格）就淡出成平均亮度 → 不閃爍
vec3 starLayer(vec2 g, vec2 jx, vec2 jy, float seed, float fill, vec3 pk, float aref, float warm, float edgeN, out vec3 mean) {
  float det = jx.x * jy.y - jy.x * jx.y;
  float ad = max(abs(det), 1e-14);
  float mu = clamp(aref / ad, 1e-4, 6.0);
  float mE = mu * min(pow(mu, uExp.z - 1.0), 10.0) * uExp.w;      // 壓縮處稍微保留星光（最多 10 倍），不會整圈發白
  float T = dot(jx, jx) + dot(jy, jy);
  float sv = sqrt(0.5 * (T + sqrt(max(T * T - 4.0 * ad * ad, 0.0))));
  float ws = 1.0 - smoothstep(0.5, 0.8, 3.0 * uSig * sv);
  float meanPk = pk.x + pk.y / (pk.z + 1.0);
  mean = mix(vec3(0.93, 0.95, 1.0), vec3(1.0, 0.93, 0.85), warm) * (fill * meanPk * 2.0 * PI * uSig * uSig * aref * mE / mu);
  vec3 acc = vec3(0.0);
  if (ws > 0.0) {
    vec4 Ji = vec4(jy.y, -jy.x, -jx.y, jx.x) / (det >= 0.0 ? max(det, 1e-14) : min(det, -1e-14));
    vec2 b = floor(g - 0.5);
    acc = starCell(g, b, Ji, seed, fill, pk, mE, warm, edgeN)
        + starCell(g, b + vec2(1.0, 0.0), Ji, seed, fill, pk, mE, warm, edgeN)
        + starCell(g, b + vec2(0.0, 1.0), Ji, seed, fill, pk, mE, warm, edgeN)
        + starCell(g, b + vec2(1.0, 1.0), Ji, seed, fill, pk, mE, warm, edgeN);
  }
  return mix(mean, acc, ws);
}
// 方向 → 等角立方體（6 面）的格點；Jacobian 用方向的螢幕導數解析地算（跨面也連續）
vec3 cubeStars(vec3 D, vec3 dx, vec3 dy, float side, float mask3) {
  vec3 a = abs(D); vec3 Dm; vec3 xm; vec3 ym; float face;
  if (a.x >= a.y && a.x >= a.z) { Dm = D.yzx; xm = dx.yzx; ym = dy.yzx; face = D.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z) { Dm = D.zxy; xm = dx.zxy; ym = dy.zxy; face = D.y > 0.0 ? 2.0 : 3.0; }
  else { Dm = D; xm = dx; ym = dy; face = D.z > 0.0 ? 4.0 : 5.0; }
  float sg = Dm.z > 0.0 ? 1.0 : -1.0, M = abs(Dm.z);
  vec2 st = Dm.xy / M;
  vec2 k = (4.0 / PI) / (1.0 + st * st) / (M * M) * uS;
  vec2 ux = k * (xm.xy * M - Dm.xy * (sg * xm.z));
  vec2 uy = k * (ym.xy * M - Dm.xy * (sg * ym.z));
  vec2 u01 = atan(st) * (2.0 / PI) + 0.5;
  float fs = face * 13.7 + side * 101.3;
  vec3 m; vec3 c = vec3(0.0);
  float N1 = side > 0.5 ? 46.0 : 40.0, N2 = side > 0.5 ? 150.0 : 128.0, N3 = side > 0.5 ? 400.0 : 360.0;
  c += starLayer(u01 * N1, ux * 0.5 * N1, uy * 0.5 * N1, fs + 1.0, side > 0.5 ? 0.6 : 0.55,
                 side > 0.5 ? vec3(0.06, 1.7, 12.0) : vec3(0.05, 1.5, 14.0), uAref.x * 0.25 * N1 * N1, side, N1, m);
  c += starLayer(u01 * N2, ux * 0.5 * N2, uy * 0.5 * N2, fs + 37.0, side > 0.5 ? 0.6 : 0.5,
                 side > 0.5 ? vec3(0.04, 0.42, 5.0) : vec3(0.035, 0.34, 6.0), uAref.x * 0.25 * N2 * N2, side, N2, m);
  if (uQ.x > 2.5 && mask3 > 0.02)
    c += mask3 * starLayer(u01 * N3, ux * 0.5 * N3, uy * 0.5 * N3, fs + 73.0, 0.5,
                 side > 0.5 ? vec3(0.03, 0.15, 3.0) : vec3(0.025, 0.12, 3.0), uAref.x * 0.25 * N3 * N3, side, N3, m);
  return c;
}

const vec3 BANDN = vec3(0.7326, 0.6147, -0.2924);   // 銀河帶的法向量（cos17°cos40°, cos17°sin40°, −sin17°）
vec3 skyHere(vec3 D, float fp) {
  float n = fbm3(D * 2.6, fp * 2.6, 3.0);
  vec3 c = vec3(10.5, 21.0, 18.2) * (0.86 + 0.28 * n);
  float t = dot(BANDN, D);
  float s2 = 0.008 + fp * fp;
  float band = sqrt(0.008 / s2) * exp(-t * t / (2.0 * s2));
  if (band > 0.01) {
    float cl = fbm3(D * 5.5 + 3.1, fp * 5.5, 4.0);
    float fine = fbm3(D * 16.0 - 5.3, fp * 16.0, 3.0);
    float r2 = 0.00025 + fp * fp;
    float rift = sqrt(0.00025 / r2) * exp(-(t - 0.015) * (t - 0.015) / (2.0 * r2)) * (0.45 + 0.55 * fbm3(D * 9.0, fp * 9.0, 2.0));
    float I = band * (0.25 + 1.1 * cl * cl) * (0.7 + 0.6 * fine) * (1.0 - 0.6 * rift);
    c += I * vec3(30.0, 40.0, 37.0);
  }
  return c / 255.0;
}
vec3 skyThereBg(vec3 D, float fp) {
  vec3 c = vec3(19.0, 10.5, 17.0);
  float cz = dot(uGc, D);
  c += exp((cz - 1.0) / 0.3) * vec3(34.0, 19.0, 9.0);            // 星系周圍的琥珀色光霧
  float n1 = fbm3(D * 2.2 + 11.0, fp * 2.2, 3.0), n2 = fbm3(D * 4.4 - 7.0, fp * 4.4, 3.0);
  float fine = fbm3(D * 13.0 + 2.0, fp * 13.0, 3.0);
  float rose = max(0.0, n1 - 0.5) * (0.6 + 0.8 * fine), amb = max(0.0, n2 - 0.56) * (0.6 + 0.8 * fine);
  c += rose * rose * vec3(300.0, 80.0, 230.0) + amb * amb * vec3(260.0, 140.0, 50.0);
  return c / 255.0;
}
// 另一邊的大螺旋星系（盤面座標 q：去投影後的平面；所有細節都依像素在盤面上的寬度 fq 淡出）
vec3 galaxy(vec3 D, vec3 dx, vec3 dy) {
  float cz = dot(uGc, D);
  if (cz < 0.3) return vec3(0.0);
  float Rg = uG.x, ci = uG.y;
  vec2 A = vec2(dot(uGa, D), dot(uGb, D));
  vec2 P = A / (cz * Rg);
  vec2 q = vec2(P.x, P.y / ci);
  float rr = length(q);
  if (rr > 1.6) return vec3(0.0);
  vec2 dPx = (vec2(dot(uGa, dx), dot(uGb, dx)) * cz - A * dot(uGc, dx)) / (cz * cz * Rg);
  vec2 dPy = (vec2(dot(uGa, dy), dot(uGb, dy)) * cz - A * dot(uGc, dy)) / (cz * cz * Rg);
  vec2 qx = vec2(dPx.x, dPx.y / ci), qy = vec2(dPy.x, dPy.y / ci);
  float fq = max(length(qx), length(qy));
  // 核球（先做等效模糊：透鏡壓縮處不會只剩一個閃爍的亮點）＋小小的亮核
  float rs = length(vec2(P.x, P.y / 0.82));
  float b1 = 0.035 * 0.035, b2 = 0.1 * 0.1, f2 = fq * fq;
  float bulge = 1.25 * (b1 / (b1 + f2)) * exp(-pow(sqrt(rs * rs + f2) / 0.035, 0.8)) + 0.5 * (b2 / (b2 + f2)) * exp(-sqrt(rs * rs + f2) / 0.1);
  float b0 = 0.004 * 0.004;
  bulge += 0.7 * (b0 / (b0 + f2)) * exp(-rs * rs / (2.0 * (b0 + f2)));
  float ang = atan(q.y, q.x);
  float qn = fbm2(q * 18.0, fq * 18.0, 3.0);
  float q2 = fbm2(q * 60.0 + 7.3, fq * 60.0, 2.0);
  float w = 1.3 * (qn - 0.5);
  float lr = log(rr + 0.015);
  float ph = ang - lr / 0.32;
  float gph = 2.0 * sqrt(1.0 / (rr * rr + 1e-4) + 1.0 / pow(0.32 * (rr + 0.015), 2.0));
  float aa = exp(-0.5 * pow(1.5 * fq * gph, 2.0));                // 旋臂太密時先模糊
  float arm = mix(0.3125, pow(0.5 + 0.5 * cos(2.0 * ph + w), 3.0), aa);
  float lane = mix(0.1, pow(0.5 + 0.5 * cos(2.0 * ph + 0.62 + w), 22.0), aa * aa * aa);
  float disk = exp(-rr / 0.27) * smoothstep(0.0, 1.0, (1.35 - rr) / 0.65) * smoothstep(0.0, 1.0, rr / 0.05);
  // 沿旋臂拉長的細節（螺旋座標：(cos φ, sin φ) 繞一圈連續、ln r 方向拉長）→ 羽狀結構、沿臂的塵埃細絲
  float gl = 1.0 / (rr + 0.015);
  vec3 sp = vec3(cos(ph) * 5.0, sin(ph) * 5.0, lr * 9.0);        // 沿臂稍微拉長（約 2:1）
  float fs = fq * max(5.0 * 0.5 * gph, 9.0 * gl);
  float det = fbm3(sp * 1.0 + 3.7, fs, 2.0);                      // 沿臂的羽狀結構（只用粗的 2 層，細層會變成髮絲）
  float det2 = fbm2(q * 34.0 + 3.7, fq * 34.0, uQ.y);              // 團塊狀細節（各向同性，近看時最多 7 層）
  float armI = disk * (0.08 + 2.0 * arm * (0.45 + qn)) * (0.25 + 0.75 * det + 0.75 * det2);
  float laneM = smoothstep(0.0, 1.0, rr / 0.05) * smoothstep(0.0, 1.0, (1.2 - rr) / 0.4);
  float fil = mix(fbm3(sp * 2.1 - 1.3, fs * 2.1, 2.0), fbm2(q * 70.0 - 1.3, fq * 70.0, max(2.0, uQ.y - 2.0)), 0.6);
  float filR = 1.0 - abs(2.0 * fil - 1.0);
  filR = mix(0.4, filR * filR, 1.0 - smoothstep(0.25, 0.6, fs * 2.1));
  float tauD = (1.1 * lane * smoothstep(0.3, 0.75, det2 + 0.25 * det) + 0.7 * filR * (0.2 + 1.0 * lane + 0.6 * arm)) * laneM * smoothstep(0.02, 0.1, rr);
  vec3 trans = exp(-tauD * vec3(0.75, 1.0, 1.35));                // 塵埃：變暗也變紅
  float hk = max(0.0, q2 - 0.6) / 0.4;
  float hii = disk * arm * arm * hk * hk * 3.2;
  float outer = smoothstep(0.0, 1.0, rr / 0.7);
  vec3 young = mix(vec3(165.0, 195.0, 255.0), vec3(150.0, 170.0, 255.0), outer);   // 旋臂：年輕的藍白星
  vec3 oldD = vec3(255.0, 214.0, 170.0);                          // 盤面底光：年老的黃星
  vec3 oldC = bulge * vec3(255.0, 200.0, 145.0);
  float young_w = arm * aa;
  vec3 armC = mix(oldD, young, clamp(0.15 + 1.1 * young_w, 0.0, 1.0)) * 0.5;
  vec3 col = (oldC + armI * armC + 0.1 * disk * oldD) * trans + hii * vec3(255.0, 80.0, 130.0) * trans.g + 0.05 * exp(-rs / 0.5) * vec3(255.0, 170.0, 110.0);
  col /= 255.0;
  vec3 m;
  if (uQ.z > 0.5) {                                               // 旋臂上的年輕藍星團（盤面上的格點）
    float K = 70.0;
    float am = disk * arm * (0.3 + qn) * 4.0 * trans.b * uGal.y;
    if (am > 0.01) col += am * vec3(0.78, 0.88, 1.12) * starLayer(q * K, qx * uS * K, qy * uS * K, 911.0, 0.7, vec3(0.0, 0.8, 2.0), uAref.y * K * K, 0.0, 0.0, m);
  }
  if (uQ.w > 0.5) {                                               // 近看時解析出來的老年黃星顆粒（平均值扣掉 → 不改變整體亮度）
    float K2 = 340.0;
    float om = (0.4 * bulge + 0.5 * disk) * trans.g * uGal.x;
    if (om > 0.01) {
      vec3 sl = starLayer(q * K2, qx * uS * K2, qy * uS * K2, 577.0, 0.8, vec3(0.1, 0.9, 3.0), uAref.y * K2 * K2, 1.0, 0.0, m);
      col += om * (sl - m) * 2.0;
    }
  }
  return col;
}
vec3 tone(vec3 c) {
  float m = max(c.r, max(c.g, c.b));
  if (m > 0.784) { float k = min(0.6, (m - 0.784) / 3.53); c += (m - c) * k; }   // 太亮的地方偏白
  vec3 hi = 0.745 + 0.255 * (1.0 - exp(-(c - 0.745) / 0.255));                   // 肩部：亮部慢慢壓到 1，不爆白
  return mix(c, hi, step(0.745, c));
}
float ring(float r, float r0, float w) { float x = (r - r0) / w; return exp(-x * x); }

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 D; float side; float rho = 0.0;
  if (uMode > 0.5) {
    float lon = fc.x / uRes.x * 2.0 * PI, lat = fc.y / uRes.y * PI;
    D = vec3(sin(lat) * cos(lon), sin(lat) * sin(lon), cos(lat));
    side = uMode - 1.0;
  } else {
    vec2 d = fc - uC; rho = length(d);
    float ta = rho / uF;
    float B = uRc * ta / sqrt(1.0 + ta * ta);                     // B = r_c sin α
    float psi = atan(d.y, d.x) + uRoll;
    float phi;
    if (B < 1.0) { phi = phiAt(0.0, log(max(1.0 - B, 1e-30)), 0.0); side = 1.0; }
    else { phi = phiAt(1.0, log(max(B - 1.0, 1e-30)), uTab.y); side = uToward > 0.5 ? 0.0 : 1.0; }
    float sp = sin(phi);
    D = vec3(sp * cos(psi), sp * sin(psi), cos(phi));
  }
  vec3 dx = dFdx(D), dy = dFdy(D);
  float fp = max(length(dx), length(dy));                         // 每像素在天空上的寬度（弧度）
  vec3 col;
  if (side < 0.5) {
    float t = dot(BANDN, D);
    col = skyHere(D, fp) + cubeStars(D, dx, dy, 0.0, exp(-t * t / 0.02));
    col = mix(col, uM0, smoothstep(0.08, 0.35, fp)) * uExp.y;
  } else {
    float cz = dot(uGc, D);
    col = skyThereBg(D, fp) + galaxy(D, dx, dy) + cubeStars(D, dx, dy, 1.0, 0.45 + 0.55 * smoothstep(0.2, 0.95, cz));
    col = mix(col, uM1, smoothstep(0.08, 0.35, fp)) * uExp.x;
  }
  if (uMode > 0.5) { FRAG = vec4(col * 0.25, 1.0); return; }
  col = tone(col);
  if (uRim.x > 0.0) {                                             // 球緣：細暖光、紅藍錯開（色散）、外側淡光暈
    float Rs = uRim.x, rw = uRim.y, dd = uRim.z, Am = uRim.w;
    col += ring(rho, Rs * 1.012, Rs * 0.16) * uHalo.x * vec3(1.0, 0.69, 0.47);
    col += ring(rho, Rs * 0.95, Rs * 0.05) * uHalo.y * vec3(1.0, 0.745, 0.55);
    col += ring(rho, Rs + dd, rw) * Am * 0.85 * vec3(1.0, 0.275, 0.118);
    col += ring(rho, Rs, rw) * Am * 0.7 * vec3(0.47, 0.745, 0.43);
    col += ring(rho, Rs - dd, rw) * Am * 0.55 * vec3(0.235, 0.353, 1.0);
    col += ring(rho, Rs, rw * 0.45) * Am * 0.6 * vec3(1.0, 0.925, 0.824);
  }
  col = min(col, vec3(1.0));
  float vt = clamp((length(fc - uVig.xy) - 0.2 * uVig.z) / (0.42 * uVig.z), 0.0, 1.0);   // 暗角
  float va = vt < 0.6 ? 0.22 * vt / 0.6 : 0.22 + 0.44 * (vt - 0.6) / 0.4;
  col = mix(col, vec3(0.0235, 0.047, 0.039), va);
  vec4 hd = hash42(fc);
  col += (hd.x + hd.y - 1.0) * (1.0 / 255.0);                    // 抖色：暗部漸層不出現色階
  FRAG = vec4(col, 1.0);
}`;

const HD = {
  want: false, state: 'off', force: false, root: null, below: null, glc: null, gl: null, v2: false,
  shipc: null, sctx: null, flash: null, prog: null, vs: null, fs: null, buf: null, tPhi: null, tNz: null, U: null,
  gen: null, timer: 0, N: 1024, phiBuf: null, mean0: [0.05, 0.09, 0.08], mean1: [0.2, 0.12, 0.13],
  levels: null, level: 0, lastNow: 0, ft: [], lastDrop: 0, shipW: 0, shipH: 0, visible: false, size: '',
};
const PH_MIN = -2, PH_RANGE = 64;
function glParam() { try { return new URLSearchParams(location.search).get('gl'); } catch (e) { return null; } }
function hdFail(err) {
  if (HD.state === 'failed' || HD.state === 'released' || HD.state === 'off') return;
  console.warn('[launch] 蟲洞高清模式無法使用，改用 CPU 繪圖：', err && err.message || err);
  warpStats.gl.error = String(err && err.message || err);
  hdDispose(false);
  HD.state = 'failed';
  refreshReady(); scheduleWarm(0);                 // 補算 CPU 路徑的天空貼圖
}
// 建 GL：每一步都很短，分段在 setTimeout 裡做（不阻塞歡迎詞與煙霧）；有 KHR_parallel_shader_compile 就讓驅動在背景編譯
function* hdBuild() {
  const S = warpStats.gl, tB = performance.now();
  let busy = 0, t = performance.now();
  const lap = () => { const n = performance.now(); busy += n - t; t = n; };
  const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !HD.force };
  let gl = HD.glc.getContext('webgl2', opts); const v2 = !!gl;
  if (!gl) gl = HD.glc.getContext('webgl', opts) || HD.glc.getContext('experimental-webgl', opts);
  if (!gl) throw new Error('WebGL 不可用');
  HD.gl = gl; HD.v2 = v2; S.api = v2 ? 'webgl2' : 'webgl1';
  const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  S.highp = hp ? hp.precision : 0;
  if (!hp || hp.precision < 20) throw new Error('fragment shader 不支援 highp');
  if (!v2 && !gl.getExtension('OES_standard_derivatives')) throw new Error('沒有 OES_standard_derivatives');
  HD.glc.addEventListener('webglcontextlost', hdLost);
  lap(); yield 'wait';
  // 雜訊表 256×256：R 隨機、G＝R 平移 (37,17)（一次取樣就有 3D 值雜訊的上下兩層）
  const NZ = 256, nz = new Uint8Array(NZ * NZ * 4), R = rng(20261027);
  for (let i = 0; i < NZ * NZ; i++) { nz[i * 4] = (R() * 256) | 0; nz[i * 4 + 2] = (R() * 256) | 0; nz[i * 4 + 3] = 255; }
  for (let y = 0; y < NZ; y++) for (let x = 0; x < NZ; x++) nz[(y * NZ + x) * 4 + 1] = nz[(((y - 17) & 255) * NZ + ((x - 37) & 255)) * 4];
  HD.tNz = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, HD.tNz);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NZ, NZ, 0, gl.RGBA, gl.UNSIGNED_BYTE, nz);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  lap(); yield 'wait';
  // shader
  const tc = performance.now();
  const pre = v2 ? '#version 300 es\n#define GL2\n' : '#extension GL_OES_standard_derivatives : enable\n';
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, pre + src); gl.compileShader(s); return s; };
  HD.vs = mk(gl.VERTEX_SHADER, HD_VS); HD.fs = mk(gl.FRAGMENT_SHADER, HD_FS);
  const prog = HD.prog = gl.createProgram();
  gl.attachShader(prog, HD.vs); gl.attachShader(prog, HD.fs); gl.bindAttribLocation(prog, 0, 'aP'); gl.linkProgram(prog);
  const ext = gl.getExtension('KHR_parallel_shader_compile'); S.parallel = !!ext;
  lap();
  if (ext) { while (!gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) { t = performance.now(); yield 'wait'; } }
  else yield 'wait';
  t = performance.now();
  const tl = performance.now();
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('shader：' + (gl.getShaderInfoLog(HD.fs) || '') + (gl.getProgramInfoLog(prog) || ''));
  }
  S.linkBlockMs = performance.now() - tl; S.compileMs = performance.now() - tc;
  const U = HD.U = {};
  for (const n of ['uRes', 'uC', 'uF', 'uS', 'uRc', 'uToward', 'uRoll', 'uTab', 'uPk', 'uPhi', 'uNz', 'uGc', 'uGa', 'uGb', 'uG', 'uQ', 'uExp', 'uRim', 'uHalo', 'uM0', 'uM1', 'uAref', 'uGal', 'uMode', 'uVig', 'uSig']) U[n] = gl.getUniformLocation(prog, n);
  HD.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, HD.buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  HD.N = WORM.PHI_N; HD.phiBuf = new Uint8Array(HD.N * 2 * 4);
  HD.tPhi = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, HD.tPhi);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, HD.N, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, HD.phiBuf);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  lap(); yield 'wait';
  if (!KT.lo) { const g = kTable(); while (!g.next().done) { lap(); yield; } }
  lap();
  // 兩邊天空的平均色：在 GPU 上畫一張 96×48 的全天圖（像素很大 → 星點、細節自動淡成平均）讀回來加權平均
  const tm = performance.now();
  const MW = 96, MH = 48, ft = gl.createTexture(), fb = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, ft);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MW, MH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ft, 0);
  const px = new Uint8Array(MW * MH * 4);
  for (const side of [0, 1]) {
    hdUniforms({ mode: side + 1, Wd: MW, Hd: MH, W: MW, H: MH, s: 1, lc: 3, roll: 0, ox: 0, oy: 0, exp: 1, rim: 0, f: 400, cx: 48, cy: 24 });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, MW, MH, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const acc = [0, 0, 0]; let ws = 0;
    for (let y = 0; y < MH; y++) {
      const wgt = Math.sin((y + 0.5) / MH * Math.PI);
      for (let x = 0; x < MW; x++) { const i = (y * MW + x) * 4; acc[0] += px[i] * wgt; acc[1] += px[i + 1] * wgt; acc[2] += px[i + 2] * wgt; ws += wgt; }
    }
    const m = acc.map(v => v / ws * 4 / 255);
    if (side) HD.mean1 = m; else HD.mean0 = m;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(ft);
  S.meanMs = performance.now() - tm; S.means = [HD.mean0, HD.mean1].map(m => m.map(v => +(v * 255).toFixed(1)));
  lap(); yield 'wait';
  // 暖機：用正式尺寸先畫一格（畫布還看不見），讓驅動把管線準備好，蟲洞開始時不卡
  const tw = performance.now();
  const W = Math.max(1, HD.root.clientWidth), H = Math.max(1, HD.root.clientHeight);
  hdLevels(); hdSize(W, H);
  const L = layoutOf(W, H);
  hdUniforms({ mode: 0, Wd: HD.glc.width, Hd: HD.glc.height, W, H, s: HD.glc.width / W, lc: lOfAngle(WORM.A_START), roll: 0, ox: 0, oy: 0, exp: 1, rim: 1, f: L.f, cx: L.cx, cy: L.cy });
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.flush();
  S.warmDrawMs = performance.now() - tw;
  lap();
  S.buildMs = busy; S.buildWallMs = performance.now() - tB;
  HD.state = 'ready'; refreshReady();
}
function hdLost(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (HD.state === 'released' || HD.state === 'off') return;
  hdFail(new Error('webglcontextlost'));
  HD.state = 'lost';
  refreshReady(); scheduleWarm(0);
}
// 品質檔（由高到低）；第一秒依幀時間往下降
function hdLevels() {
  const dpr = Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
  let L;
  if (WORM.GL_SCALE > 0) L = [{ s: WORM.GL_SCALE, q: WORM.QUALITY === 'medium' ? 'medium' : 'high' }];
  else {
    L = [{ s: dpr, q: 'high' }, { s: Math.min(dpr, 1.5), q: 'high' }, { s: Math.min(dpr, 1.5), q: 'medium' }, { s: 1, q: 'medium' }, { s: 0.75, q: 'medium' }];
    if (WORM.QUALITY !== 'auto') L = L.filter(l => l.q === WORM.QUALITY);
    L = L.filter((l, i) => !i || l.s !== L[i - 1].s || l.q !== L[i - 1].q);
  }
  HD.levels = L; HD.level = 0;
}
function hdSize(W, H) {
  const lv = HD.levels[HD.level];
  const s = Math.min(lv.s, WORM.GL_MAXSIDE / Math.max(W, H));
  const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
  if (HD.glc.width !== w || HD.glc.height !== h) { HD.glc.width = w; HD.glc.height = h; }
  HD.size = w + 'x' + h;
}
// 每格：相機在 lc 時「B → φ」的兩列表（24 位元定點打包）
function hdPhiTable(lc) {
  const N = HD.N, buf = HD.phiBuf, L = Math.abs(lc), rc = Math.sqrt(1 + lc * lc), toward = lc > 0, vmin = KT.VMIN;
  const v1 = Math.max(vmin + 1, Math.log(Math.max(1e-12, rc - 1)));
  for (let row = 0; row < 2; row++) {
    const vhi = row ? v1 : 0;
    for (let i = 0; i < N; i++) {
      const v = vmin + (vhi - vmin) * i / (N - 1);
      let B = row ? 1 + Math.exp(v) : 1 - Math.exp(v);
      if (B > rc) B = rc * 0.999999;
      let phi = toward ? kOf(B) - fOf(L, B) : fOf(L, B);
      if (!(phi === phi)) phi = 0;
      const q = Math.round(Math.min(1, Math.max(0, (phi - PH_MIN) / PH_RANGE)) * 16777215), o = (row * N + i) * 4;
      buf[o] = q >>> 16; buf[o + 1] = (q >>> 8) & 255; buf[o + 2] = q & 255; buf[o + 3] = 255;
    }
  }
  return v1;
}
let GALM = null;
function hdUniforms(o) {
  const gl = HD.gl, U = HD.U, lv = HD.levels ? HD.levels[HD.level] : { q: 'high' };
  gl.viewport(0, 0, o.Wd, o.Hd);
  gl.useProgram(HD.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, HD.buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, HD.tPhi);
  const v1 = hdPhiTable(o.lc);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, HD.N, 2, gl.RGBA, gl.UNSIGNED_BYTE, HD.phiBuf);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, HD.tNz);
  gl.uniform1i(U.uPhi, 0); gl.uniform1i(U.uNz, 1);
  const s = o.s;
  gl.uniform2f(U.uRes, o.Wd, o.Hd);
  gl.uniform2f(U.uC, (o.cx + o.ox) * s, (o.cy + o.oy) * s);
  gl.uniform1f(U.uF, o.f * s); gl.uniform1f(U.uS, s);
  gl.uniform1f(U.uRc, Math.sqrt(1 + o.lc * o.lc)); gl.uniform1f(U.uToward, o.lc > 0 ? 1 : 0); gl.uniform1f(U.uRoll, o.roll);
  gl.uniform3f(U.uTab, KT.VMIN, v1, HD.N); gl.uniform2f(U.uPk, PH_MIN, PH_RANGE);
  if (!GALM) GALM = galaxyModel();
  gl.uniform3fv(U.uGc, GALM.c); gl.uniform3fv(U.uGa, GALM.a); gl.uniform3fv(U.uGb, GALM.b); gl.uniform2f(U.uG, GALM.Rg, GALM.ci);
  const hi = lv.q === 'high';
  gl.uniform4f(U.uQ, hi ? 3 : 2, hi ? 7 : 4, 1, hi ? 1 : 0);
  gl.uniform4f(U.uExp, o.exp, 1, WORM.STAR_GAMMA, WORM.STAR_GAIN);
  gl.uniform1f(U.uSig, WORM.STAR_SIG);
  gl.uniform2f(U.uGal, WORM.GAL_GRAIN, WORM.GAL_CLUSTER);
  // 球緣
  let Rs = -1;
  if (o.mode === 0 && o.lc > 0.02) { const ac = Math.asin(1 / Math.sqrt(1 + o.lc * o.lc)); if (ac < 72 * DEG) Rs = o.f * Math.tan(ac) * s; }
  gl.uniform4f(U.uRim, Rs, WORM.RIM_W * s, WORM.DISPERSION * s, WORM.RIM * o.rim);
  gl.uniform2f(U.uHalo, WORM.HALO * o.rim, WORM.HALO * 0.6 * o.rim);
  gl.uniform3fv(U.uM0, HD.mean0); gl.uniform3fv(U.uM1, HD.mean1);
  const ar = 4 / Math.PI / o.f;
  gl.uniform2f(U.uAref, ar * ar, 1 / (GALM.Rg * o.f * GALM.Rg * o.f * GALM.ci));
  gl.uniform1f(U.uMode, o.mode);
  gl.uniform3f(U.uVig, o.W / 2 * s, o.H * 0.56 * s, Math.hypot(o.W, o.H) * s);
}
function hdDispose(removeEls) {
  if (HD.timer) { clearTimeout(HD.timer); HD.timer = 0; }
  const gl = HD.gl;
  if (gl) {
    try {
      if (HD.glc) HD.glc.removeEventListener('webglcontextlost', hdLost);
      if (HD.prog) gl.deleteProgram(HD.prog);
      if (HD.vs) gl.deleteShader(HD.vs);
      if (HD.fs) gl.deleteShader(HD.fs);
      if (HD.buf) gl.deleteBuffer(HD.buf);
      if (HD.tPhi) gl.deleteTexture(HD.tPhi);
      if (HD.tNz) gl.deleteTexture(HD.tNz);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose && !gl.isContextLost()) lose.loseContext();
    } catch (e) { /* ignore */ }
  }
  HD.gl = HD.prog = HD.vs = HD.fs = HD.buf = HD.tPhi = HD.tNz = HD.U = HD.gen = HD.phiBuf = null;
  if (HD.glc) { HD.glc.style.display = 'none'; HD.glc.width = HD.glc.height = 1; }
  if (HD.shipc) { HD.shipc.style.display = 'none'; HD.shipc.width = HD.shipc.height = 0; HD.sctx = null; HD.shipW = HD.shipH = 0; }
  if (HD.flash) HD.flash.style.opacity = '0';
  if (removeEls) {
    for (const el of [HD.glc, HD.shipc, HD.flash]) if (el && el.parentNode) el.parentNode.removeChild(el);
    HD.glc = HD.shipc = HD.flash = null;
  }
  HD.visible = false;
}
// 開場一開始呼叫：建好三個元素（GL 畫布、太空梭畫布、閃光層），在背景分段建 GL
export function hdInit(root, below) {
  hdRelease();
  const q = glParam();
  if (q === '0' || WORM.GL === 'off' || typeof document === 'undefined') { HD.want = false; HD.state = 'off'; refreshReady(); return false; }
  HD.want = true; HD.state = 'building'; HD.force = q === 'force' || WORM.GL === 'force';
  warpStats.gl = {};
  HD.root = root;
  const glc = HD.glc = document.createElement('canvas');
  glc.setAttribute('aria-hidden', 'true'); glc.style.visibility = 'hidden'; glc.style.opacity = '0';
  const sc = HD.shipc = document.createElement('canvas');
  sc.setAttribute('aria-hidden', 'true');
  Object.assign(sc.style, { inset: 'auto', left: '0', top: '0', width: '1px', height: '1px', display: 'none', pointerEvents: 'none', transformOrigin: '0 0', willChange: 'transform' });
  const fl = HD.flash = document.createElement('div');
  Object.assign(fl.style, { position: 'absolute', inset: '0', background: 'rgb(228,252,250)', opacity: '0', pointerEvents: 'none' });
  const ref = below && below.parentNode === root ? below.nextSibling : root.firstChild;
  root.insertBefore(glc, ref); root.insertBefore(sc, ref); root.insertBefore(fl, ref);
  HD.gen = hdBuild();
  const step = () => {
    HD.timer = 0;
    if (HD.state !== 'building') return;
    const t0 = performance.now();
    try {
      while (performance.now() - t0 < 8) { const r = HD.gen.next(); if (r.done) return; if (r.value === 'wait') break; }
    } catch (e) { hdFail(e); return; }
    HD.timer = setTimeout(step, 16);
  };
  HD.timer = setTimeout(step, WORM.GL_DELAY);
  refreshReady();
  return true;
}
// 蟲洞要開始了但還沒建好（很少見）：當場一口氣做完
function hdFinishNow() {
  if (HD.state !== 'building' || !HD.gen) return;
  if (HD.timer) { clearTimeout(HD.timer); HD.timer = 0; }
  const t0 = performance.now();
  try { while (!HD.gen.next().done) { /* run */ } } catch (e) { hdFail(e); }
  warpStats.gl.finishNowMs = performance.now() - t0;
}
// 蟲洞段結束、跳過、取消時呼叫：刪掉 GL 物件、loseContext、移除畫布，回到首頁不佔記憶體
export function hdRelease() {
  const had = HD.want;
  hdDispose(true);
  SPR = null;
  HD.root = null; HD.levels = null; HD.ft = []; HD.lastNow = 0;
  HD.state = had ? 'released' : 'off';
}
export const hdState = () => HD.state;
const hdUsable = () => HD.state === 'ready' && !!HD.gl;

// 蟲洞段的流程（總長 warpMs，預設 6 秒）：
//   接近段（前 warpMs − TUNNEL_S 秒）：太空梭靠引擎、機頭對準球心，沿平行於蟲洞軸的直線等速前進；追隨鏡頭在它後上方、
//     軸向間距固定 → 太空梭在畫面下方的位置與大小大致不變，是蟲洞球迎面變大（「開進去」，不是「被吸進去」）。
//     蟲洞沒有吸力：Ellis 蟲洞 g_tt = −1，沒有重力、沒有潮汐力，靜止的東西不會自己掉進去。
//     螺旋墜入、加速掉入、時間膨脹變紅、潮汐拉長，都是黑洞或重力井的模型。
//   穿越段（最後 TUNNEL_S 秒）：鏡頭從接近段的速度接著加速穿過喉嚨，太空梭同步推進、仍在前方同樣的間距；
//     它先穿過喉嚨（約第 5.8 秒），之後畫在球裡、在另一邊的星空裡往前飛。球越來越大、佔滿畫面。不發光。
//   之後 p > 0：出洞閃光（drawFlash）；鏡頭滑行減速，太空梭維持等速 → 往消失點慢慢縮小、被閃光吞沒。
export function makeWarp(warpMs) {
  const T = Math.max(1, warpMs / 1000);
  const TS = Math.max(1, T - WORM.TUNNEL_S);        // 接近段；之後鏡頭自己穿過喉嚨
  const lS = lOfAngle(WORM.A_START), lE = lOfAngle(WORM.A_END);
  let key = '', D = null;

  // 相機在蟲洞軸上的位置 l（> 0 我們這邊，< 0 另一邊）
  //   接近段：等速（v0）從球視半徑 A_START 靠近到 A_END；穿越段：從 v0 接著 ease-in 加速穿過喉嚨（速度連續、不頓）；出洞後滑行減速。
  const TU = WORM.TUNNEL_S, TE = TS + TU, PP = WORM.PUSH_POW;
  const v0 = (lE - lS) / TS;                                  // < 0：往喉嚨
  const dX = WORM.L_EXIT - lE - v0 * TU;                      // 穿越段在等速之外多走的距離
  const vT = v0 + dX * PP / TU;                               // 穿越段結束時的速度
  const camL = tau => {
    if (tau <= TS) return lS + v0 * tau;
    const s = Math.min(TU, tau - TS);
    let l = lE + v0 * s + dX * Math.pow(s / TU, PP);
    if (tau > TE) { const x = Math.min(2, tau - TE); l += vT * x * (1 - 0.25 * x); }      // 出洞後繼續滑行（減速）
    return l;
  };
  // 太空梭在軸上的位置：一直在鏡頭前方 SHIP_SEP（接近段＝等速；穿越段和我們一起推進、間距不變）；
  //   出洞後鏡頭滑行減速，太空梭維持等速（vT）→ 間距慢慢拉開
  const lsAt = tau => tau <= TE ? camL(tau) - WORM.SHIP_SEP : camL(TE) - WORM.SHIP_SEP + vT * (tau - TE);
  // 投影（Ellis 蟲洞裡小角度的光線）：離軸 h 的點，在相機看來偏離球心 tanα ≈ h / D，
  //   D = r_c r_s (atan l_c − atan l_s)，r = √(1 + l²)。兩者都離喉嚨很遠時 D → l_c − l_s（平直空間）；
  //   太空梭穿過喉嚨、在另一邊時，光線穿過喉嚨過來 → D 變大一點（看起來略小、略靠近球心，而且一定在球裡）。
  const shipAt = tau => {
    const lc = camL(tau), ls = lsAt(tau);
    const D = Math.hypot(1, lc) * Math.hypot(1, ls) * (Math.atan(lc) - Math.atan(ls));
    return { ls, D, X: WORM.SHIP_DX / D, Y: WORM.SHIP_H / D };
  };
  // 曝光曲線（球裡另一邊的天空、球緣光）：平順增加，穿越時最亮（GL 路徑；CPU 路徑只套球緣光）
  const expo = tau => {
    if (tau <= TS) { const e = smooth((tau - 0.4) / (TS - 0.4)); return { exp: lerp(WORM.EXP0, WORM.EXP1, e), rim: lerp(WORM.RIM0, WORM.RIM1, e) }; }
    const q = smooth((tau - TS) / WORM.TUNNEL_S);
    return { exp: lerp(WORM.EXP1, WORM.EXP2, q), rim: WORM.RIM1 };
  };
  const shake = (tau, lc) => {
    const sk = tau > TS ? WORM.SHAKE * Math.exp(-(lc * lc) / 0.25) : 0;
    return [sk * (0.6 * Math.sin(tau * 71) + 0.4 * Math.sin(tau * 43.7)), sk * (0.6 * Math.sin(tau * 59.3 + 1) + 0.4 * Math.sin(tau * 37.1))];
  };
  // 太空梭（後上方的追隨鏡頭；等速直線開進球心，穿過後在另一邊的星空裡繼續往前飛）：兩條路徑共用
  const drawShip = (c, tau, cx, cy, f) => {
    const vis = smooth(tau / 0.45);                                            // 不淡出：穿過喉嚨後仍看得到，最後被出洞閃光吞沒
    if (vis <= 0.01) return null;
    const P = shipAt(tau);
    const x = cx + P.X * f, y = cy + P.Y * f;
    // 機頭＝前進方向＝沿蟲洞軸；平行於視軸的直線在畫面上指向消失點（球心）→ 機頭永遠對準球心，不側滑
    const heading = Math.atan2(cy - y, cx - x) + Math.PI / 2;
    // 透視縮短：機身沿軸，視線與機身的夾角＝太空梭偏離球心的視角 α（鏡頭俯角）→ 頂面投影 sinα、機身厚度投影 T·cosα
    const ta = Math.hypot(P.X, P.Y), ca = 1 / Math.sqrt(1 + ta * ta), sy = Math.min(1, ta * ca + WORM.SHIP_THICK * ca);
    const near = smooth(1 - P.ls / 3);                                         // 越接近喉嚨（及穿過後），受另一邊的暖光照得越多
    const rim = [lerp(150, 255, near), lerp(186, 190, near), lerp(215, 136, near)].map(Math.round);
    const u = WORM.SHIP_LEN / 2.5 * f / P.D;
    // 引擎：穩定發光、只有很慢的輕微脈動（不閃爍）
    const glow = 0.8 + 0.07 * Math.sin(TAU * 1.1 * tau) + 0.03 * Math.sin(TAU * 2.3 * tau + 1.3);
    if (c) shuttle(c, x, y, u, heading, glow, {
      sx: 1, sy, light: Math.atan2(cy - y, cx - x), lk: 0.4 + 0.55 * near, rim,
      dim: 0.12, alpha: vis,
    });
    return { x, y, u };
  };

  // GL 路徑的一格：天空畫在全解析度 GL 畫布；太空梭畫在跟著它走的小畫布；閃光是 div
  function drawHD(W, H, tau, wt, p) {
    const now = performance.now(), t0 = now;
    // 自動選檔：第一秒（淡入、煙霧還在）每 10 格看一次幀時間中位數，低於 FPS_MIN 就降一檔；之後只有嚴重掉幀（< 30 fps）才降
    if (HD.lastNow) HD.ft.push(Math.min(500, now - HD.lastNow));      // 很慢的格也要算進去
    HD.lastNow = now;
    if (WORM.GL_SCALE <= 0 && HD.level < HD.levels.length - 1) {
      const early = tau < 1.8, span = HD.ft.reduce((x, y) => x + y, 0);
      if (HD.ft.length >= 4 && span >= (early ? 350 : 700)) {     // 以時間為窗（很慢的時候格數少，也照樣判斷）
        const a = HD.ft.slice().sort((x, y) => x - y), med = a[a.length >> 1];
        if (med > (early ? 1000 / WORM.FPS_MIN : 34)) {
          HD.level++; HD.lastDrop = now;
          (warpStats.gl.drops || (warpStats.gl.drops = [])).push(tau.toFixed(2) + 's ' + med.toFixed(1) + 'ms→L' + HD.level);
        }
        HD.ft = [];
      }
    }
    if (HD.ft.length) warpStats.gl.lastFt = +HD.ft[HD.ft.length - 1].toFixed(1);
    hdSize(W, H);
    const lv = HD.levels[HD.level];
    warpStats.gl.level = HD.level; warpStats.gl.q = lv.q; warpStats.gl.size = HD.size; warpStats.res = HD.size;
    const L = layoutOf(W, H), lc = camL(tau), [ox, oy] = shake(tau, lc), E = expo(tau);
    if (wt > 0.003) {
      const s = HD.glc.width / W;
      hdUniforms({ mode: 0, Wd: HD.glc.width, Hd: HD.glc.height, W, H, s, lc, roll: WORM.ROLL * DEG * Math.min(1.3, tau / T), ox, oy, exp: E.exp, rim: E.rim, f: L.f, cx: L.cx, cy: L.cy });
      HD.gl.drawArrays(HD.gl.TRIANGLES, 0, 3);
      if (!HD.visible) { HD.glc.style.visibility = 'visible'; HD.glc.style.display = ''; HD.visible = true; }
    }
    HD.glc.style.opacity = String(Math.max(0, Math.min(1, wt)));
    // 太空梭：只有它那麼大的畫布（全解析度），用 CSS 位移放到正確位置
    const sc = HD.shipc, info = wt > 0.003 ? drawShip(null, tau, L.cx, L.cy, L.f) : null;
    if (info) {
      const sd = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), R = Math.ceil(3.2 * info.u) + 4;
      const need = Math.ceil(2 * R * sd);
      if (!HD.sctx || need > sc.width) { sc.width = sc.height = need; HD.sctx = sc.getContext('2d'); }
      const ox0 = Math.floor((info.x - R) * sd) / sd, oy0 = Math.floor((info.y - R) * sd) / sd, cw = sc.width / sd;
      const c = HD.sctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.clearRect(0, 0, sc.width, sc.height);
      c.setTransform(sd, 0, 0, sd, -ox0 * sd, -oy0 * sd);
      drawShip(c, tau, L.cx, L.cy, L.f);
      // 暗角（GL 畫布上的暗角蓋不到這張）：在太空梭所在位置補上一樣的暗度
      const vt = Math.min(1, Math.max(0, (Math.hypot(info.x - W / 2, info.y - H * 0.56) - 0.2 * Math.hypot(W, H)) / (0.42 * Math.hypot(W, H))));
      const va = vt < 0.6 ? 0.22 * vt / 0.6 : 0.22 + 0.44 * (vt - 0.6) / 0.4;
      if (va > 0.01) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(6,12,10,${va.toFixed(3)})`; c.fillRect(ox0, oy0, cw, cw); c.globalCompositeOperation = 'source-over'; }
      sc.style.width = sc.style.height = cw + 'px';
      sc.style.transform = `translate(${ox0}px,${oy0}px)`;
      sc.style.opacity = String(Math.max(0, Math.min(1, wt)));
      sc.style.display = '';
    } else if (sc.style.display !== 'none') sc.style.display = 'none';
    HD.flash.style.opacity = flashAlpha(p).toFixed(3);
    warpStats.frameMs = performance.now() - t0;
  }

  // tau：進蟲洞後的秒數；w：淡入 0→1；p：出洞進度 0→1；dt：秒（畫面只由 tau 決定）
  function draw(ctx, W, H, tau, w, p, dt) {
    const wt = w * (p < 0.4 ? 1 : 1 - smooth((p - 0.4) / 0.45));
    if (HD.state === 'building' && HD.root) hdFinishNow();          // 蟲洞開始時還沒建好（很少見）：當場做完
    if (hdUsable()) {
      draw.mode = 'gl'; warpStats.path = 'gl';
      try { drawHD(W, H, tau, wt, p); return; } catch (e) { hdFail(e); }
    }
    draw.mode = 'cpu'; warpStats.path = 'cpu';
    if (wt <= 0.003) { drawFlash(ctx, W, H, p); return; }
    const m = ctx.getTransform(), S = Math.hypot(m.a, m.b) || 1;
    const Wd = Math.max(1, Math.round(W * S)), k = W + 'x' + H + '@' + Wd;
    const tIn = performance.now();
    if (k !== key) {
      key = k;
      D = PREP_CACHE.get(k) || null;
      if (!D) { D = prepare(W, H, Wd); PREP_CACHE.clear(); PREP_CACHE.set(k, D); }
    }
    const ready = SK.ready && KT.lo;
    if (!ready) warmStep(performance.now() - tIn > 3 ? 0 : 12);   // 還沒在閒置時間算完：每格最多再算約 12 ms（這一格若剛做過尺寸預算就先不算）
    const tStart = performance.now();
    const { cx, cy, f } = D.L;
    const lc = camL(tau);
    const [ox, oy] = shake(tau, lc);                // 穿過喉嚨那一下的微晃（不發光）

    ctx.save();
    ctx.globalAlpha = wt;
    ctx.fillStyle = 'rgb(11,22,19)';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(ox, oy);
    if (SK.ready && KT.lo) {
      // 光線查表 → 逐像素取兩張天空貼圖
      buildRhoTable(D, lc, WORM.ROLL * DEG * Math.min(1.3, tau / T));
      const { NP, RI, CI, OFF, SH, FLA, px32 } = D, TEX = SK.TEX, MASK = SK.NC - 1;
      for (let i = 0; i < NP; i++) { const e = RI[i]; px32[i] = TEX[OFF[e] + (((CI[i] + FLA[e]) & MASK) >> SH[e])]; }
      D.lctx.putImageData(D.img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(D.lo, 0, 0, W, D.lh / D.k);
    } else if (lc > 0.02) {                        // 貼圖還沒好（很少見）：先畫一顆暗暗的暖色球頂著
      const Rs = f * Math.tan(Math.asin(1 / Math.sqrt(1 + lc * lc)));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rs);
      g.addColorStop(0, 'rgb(70,42,40)'); g.addColorStop(0.25, 'rgb(36,20,28)'); g.addColorStop(1, 'rgb(48,28,34)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Rs, 0, TAU); ctx.fill();
    }

    // 球的邊緣光：兩邊天空的光在喉嚨邊緣疊在一起，細而亮；紅藍微微錯開（色散）；外面一圈很淡的暖色光暈
    if (lc > 0.02) {
      const ac = Math.asin(1 / Math.sqrt(1 + lc * lc));
      if (ac < 72 * DEG) {
        const rg = expo(tau).rim;
        const Rs = f * Math.tan(ac), rw = WORM.RIM_W, dd = WORM.DISPERSION, A = WORM.RIM * rg;
        ctx.globalCompositeOperation = 'lighter';
        ringFill(ctx, cx, cy, Rs * 1.012, Rs * 0.16, '255,176,120', WORM.HALO * rg, 2.4);          // 外側光暈
        ringFill(ctx, cx, cy, Rs * 0.95, Rs * 0.05, '255,190,140', WORM.HALO * 0.6 * rg, 2.2);     // 內側柔光
        ringFill(ctx, cx, cy, Rs + dd, rw, '255,70,30', A * 0.85);
        ringFill(ctx, cx, cy, Rs, rw, '120,190,110', A * 0.7);
        ringFill(ctx, cx, cy, Rs - dd, rw, '60,90,255', A * 0.55);
        ringFill(ctx, cx, cy, Rs, rw * 0.45, '255,236,210', A * 0.6);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    ctx.translate(-ox, -oy);
    drawShip(ctx, tau, cx, cy, f);                  // 和 GL 路徑一樣不跟著微晃（我們和它一起飛，相對位置平順）
    ctx.drawImage(D.vg, 0, 0, W, H);                // 暗角
    ctx.restore();
    drawFlash(ctx, W, H, p);
    warpStats.frameMs = performance.now() - tStart;
  }
  draw.mode = '';
  return draw;
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
  let dpr = 0.5; // 煙霧本來就是糊的：用一半解析度畫再放大，省很多力氣（蟲洞走 CPU 退回路徑時才提高到 1）
  const CPU_DPR = 1;
  let W = 1, H = 1;
  // 蟲洞高清（GL）：在歡迎詞與煙霧時就在背景建好；蟲洞段畫在另一張全解析度畫布上（疊在這張上面）
  hdInit(root, cv);
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
    if (!warpT && !warpStats.ready) warmStep(4);  // 歡迎詞與煙霧的時候，順便每格算一小段（K 表；CPU 路徑才要的天空貼圖）
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
      if (warpDraw.mode === 'cpu' && dpr < CPU_DPR) { dpr = CPU_DPR; resize(); }   // CPU 退回路徑：畫布提高到 1 倍（下一格生效）
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
    hdRelease();                                   // GL 物件、畫布全部釋放
    freeCpuSky();
    cv.width = cv.height = 1;
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
