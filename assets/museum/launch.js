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
  // 光線查表
  RES_W: 360,         // 低解析度畫布寬度上限
  RES_PIX: 110000,    // 低解析度畫布像素上限（直式時寬度會再縮）
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
  // 太空梭：從後上方的追隨鏡頭看，沿直線（極微的弧）飛向球心。蟲洞沒有質量、沒有潮汐力 → 不繞圈、不拉長、不變紅
  SHIP_S0: 0.6,       // 一開始太空梭在鏡頭前方多遠（喉嚨半徑＝1）
  SHIP_H: 0.18,       // 鏡頭比太空梭的航線高多少（越大，太空梭在畫面越下面）
  SHIP_X: 0.05,       // 一開始稍微偏右，之後慢慢修正對準（很微的弧）
  SHIP_LEN: 0.1,      // 太空梭長度
  SHIP_IN: 0.86,      // 接近段（前 5.25 秒）的這個比例時太空梭穿過喉嚨
  SHIP_FORE: 0.5,     // 從後上方看的機身縮短（俯視圖沿機身方向壓扁）
  FLASH: 0.8,         // 出洞閃光的峰值（原本 0.95）
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

// 和畫面尺寸無關的預算（K 表、兩張天空）：模組載入後利用閒置時間一點一點先算好；共用同一個產生器
export const warpStats = { warmMs: 0, prepMs: 0, frameMs: 0, ready: false, res: '' };
let WARM = null;
function warmGen() {
  if (!WARM) WARM = (function* () {
    const g = (function* () { yield* kTable(); yield* skyTextures(); })();
    let busy = 0;                                   // 實際花掉的計算時間（分段加總）
    while (true) { const s = performance.now(), r = g.next(); busy += performance.now() - s; if (r.done) break; yield; }
    warpStats.warmMs = busy; warpStats.ready = true;
  })();
  return WARM;
}
if (typeof window !== 'undefined') {
  // 開場時主執行緒很忙（3D 場景在建），閒置時間很少 → 最多等約 60 ms 就一定做一小段（約 10 ms），通常歡迎詞還沒播完就算好了
  const step = dl => {
    const g = warmGen(), t0 = performance.now(), bud = dl && !dl.didTimeout ? Math.min(12, Math.max(5, dl.timeRemaining())) : 11;
    while (performance.now() - t0 < bud) { if (g.next().done) return; }
    later();
  };
  const later = () => setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(step, { timeout: 50 }) : step()), 4);
  setTimeout(later, 300);
}

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

function drawFlash(ctx, W, H, p) {
  if (p <= 0) return;
  const pk = WORM.FLASH;
  const fl = p < 0.45 ? Math.pow(p / 0.45, 1.5) * pk : pk * Math.pow(1 - (p - 0.45) / 0.55, 1.6);
  if (fl <= 0.003) return;
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

// 蟲洞段的流程（總長 warpMs，預設 6 秒）：
//   接近段（前 warpMs − TUNNEL_S 秒）：後上方的追隨鏡頭慢慢靠近蟲洞，太空梭機頭對準球心、沿直線往前飛，越來越小，沒入球裡。
//     蟲洞不螺旋：螺旋墜入是「黑洞」的模型（吸積盤、繞轉、時間膨脹變紅）；Ellis 蟲洞沒有質量、沒有潮汐力，所以不繞圈、不拉長、不變紅。
//   穿越段（最後 TUNNEL_S 秒）：鏡頭自己加速穿過喉嚨——球越來越大、佔滿畫面，另一邊的天空向前展開。不發光。
//   之後 p > 0：出洞閃光（drawFlash）。
export function makeWarp(warpMs) {
  const T = Math.max(1, warpMs / 1000);
  const TS = Math.max(1, T - WORM.TUNNEL_S);        // 接近段；之後鏡頭自己穿過喉嚨
  const lS = lOfAngle(WORM.A_START), lE = lOfAngle(WORM.A_END);
  let key = '', D = null;

  // 相機在蟲洞軸上的位置 l（> 0 我們這邊，< 0 另一邊）
  const camL = tau => {
    if (tau <= TS) { const x = tau / TS; return lerp(lS, lE, 0.35 * x + 0.65 * smooth(x)); }   // 慢慢靠近
    const q = Math.min(1, (tau - TS) / WORM.TUNNEL_S);
    let l = lE + (WORM.L_EXIT - lE) * Math.pow(q, WORM.PUSH_POW);                              // ease-in：越來越快地穿過喉嚨
    if (tau > T) { const v = (WORM.L_EXIT - lE) * WORM.PUSH_POW / WORM.TUNNEL_S, x = Math.min(2, tau - T); l += v * x * (1 - 0.25 * x); }  // 出洞後繼續滑行
    return l;
  };
  // 太空梭在軸上的位置（同一個 l 座標）：等速略加速地飛向喉嚨，tin 時穿過，之後在另一邊繼續飛、變小、淡出
  // 太空梭和鏡頭的距離：一開始就在鏡頭前不遠處，之後加速往前飛（距離越拉越大 → 在畫面上越來越小），tin 時剛好到達喉嚨
  const tin = WORM.SHIP_IN * TS, S0 = WORM.SHIP_S0, sepIn = camL(tin);
  const shipAt = tau => {
    const x = Math.max(0, tau / tin);
    const sep = x <= 1 ? S0 + (sepIn - S0) * Math.pow(x, 1.7) : sepIn + (sepIn - S0) * 1.7 * (x - 1);
    const xo = WORM.SHIP_X * Math.pow(Math.max(0, 1 - x), 2);                                   // 很微的弧：慢慢修正對準球心
    return { zs: camL(tau) - sep, sep, X: xo / sep, Y: WORM.SHIP_H / sep };
  };

  // tau：進蟲洞後的秒數；w：淡入 0→1；p：出洞進度 0→1；dt：秒（畫面只由 tau 決定）
  return function draw(ctx, W, H, tau, w, p, dt) {
    const wt = w * (p < 0.4 ? 1 : 1 - smooth((p - 0.4) / 0.45));
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
    if (!ready) {                                  // 還沒在閒置時間算完：每格最多再算約 12 ms（這一格若剛做過尺寸預算就先不算）
      const g = warmGen(), t0 = performance.now(), bud = t0 - tIn > 3 ? 0 : 12;
      while (performance.now() - t0 < bud) { if (g.next().done) break; }
    }
    const tStart = performance.now();
    const { cx, cy, f } = D.L;
    const lc = camL(tau);
    // 穿過喉嚨那一下的微晃（不發光）
    const sk = tau > TS ? WORM.SHAKE * Math.exp(-(lc * lc) / 0.25) : 0;
    const ox = sk * (0.6 * Math.sin(tau * 71) + 0.4 * Math.sin(tau * 43.7)), oy = sk * (0.6 * Math.sin(tau * 59.3 + 1) + 0.4 * Math.sin(tau * 37.1));

    ctx.save();
    ctx.globalAlpha = wt;
    ctx.fillStyle = 'rgb(11,22,19)';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(ox, oy);
    if (ready && SK.ready) {
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
        const Rs = f * Math.tan(ac), rw = WORM.RIM_W, dd = WORM.DISPERSION, A = WORM.RIM;
        ctx.globalCompositeOperation = 'lighter';
        ringFill(ctx, cx, cy, Rs * 1.012, Rs * 0.16, '255,176,120', WORM.HALO, 2.4);          // 外側光暈
        ringFill(ctx, cx, cy, Rs * 0.95, Rs * 0.05, '255,190,140', WORM.HALO * 0.6, 2.2);     // 內側柔光
        ringFill(ctx, cx, cy, Rs + dd, rw, '255,70,30', A * 0.85);
        ringFill(ctx, cx, cy, Rs, rw, '120,190,110', A * 0.7);
        ringFill(ctx, cx, cy, Rs - dd, rw, '60,90,255', A * 0.55);
        ringFill(ctx, cx, cy, Rs, rw * 0.45, '255,236,210', A * 0.6);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // 太空梭：後上方的追隨鏡頭，太空梭沿直線飛向球心、越來越小，最後沒入球裡
    const vis = smooth(tau / 0.45) * (1 - smooth((tau - tin) / 0.5)) * (tau < TS ? 1 : 0);
    if (vis > 0.01) {
      const P = shipAt(tau), Pa = shipAt(tau - 0.03), Pb = shipAt(tau + 0.03);
      const x = cx + P.X * f, y = cy + P.Y * f;
      const heading = Math.atan2((Pb.Y - Pa.Y), (Pb.X - Pa.X)) + Math.PI / 2;   // 機頭＝前進方向（對準球心）
      const near = smooth(1 - P.zs / 3);                                         // 越接近喉嚨，受球裡暖光照得越多
      const rim = [lerp(150, 255, near), lerp(186, 190, near), lerp(215, 136, near)].map(Math.round);
      shuttle(ctx, x, y, WORM.SHIP_LEN / 2.5 * f / P.sep, heading, 0.6 + 0.4 * Math.sin(tau * 23) * Math.sin(tau * 7.3), {
        sx: 1, sy: WORM.SHIP_FORE, light: Math.atan2(cy - y, cx - x), lk: 0.4 + 0.55 * near, rim,
        dim: 0.12, alpha: vis,
      });
    }

    ctx.translate(-ox, -oy);
    ctx.drawImage(D.vg, 0, 0, W, H);                // 暗角
    ctx.restore();
    drawFlash(ctx, W, H, p);
    warpStats.frameMs = performance.now() - tStart;
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
    if (!warpT && !warpStats.ready) {               // 歡迎詞與煙霧的時候，順便每格算一小段蟲洞的天空（約 4 ms）
      const g = warmGen(), t1 = performance.now();
      while (performance.now() - t1 < 4) { if (g.next().done) break; }
    }
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
