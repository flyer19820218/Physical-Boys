// 光速太空梭：共用的 3D 模型（20261027k）
// ------------------------------------------------------------------------------------------
// 造型、配色以蟲洞段原本的高畫質 2D 太空梭為準（原創 S 形圓滑三角翼，不仿任何真實或電影太空梭）：
//   白色隔熱瓦（細格紋、機身分段線、酬載艙門線）、機翼前緣黑瓦、深灰機鼻帽、四片駕駛艙窗、兩側小整流罩、
//   垂直尾翼、機尾三個主引擎噴口（上一下二）＋藍白尾焰與光暈。
// 用在兩個地方（同一艘、同樣的質感）：
//   ‧ launch.js 蟲洞段：自己的小 Three.js 渲染器（機尾視角、蟲洞球的暖色受光、微擺）
//   ‧ scene.js 伽利略星球：開場飛行與軌道（行為、位置、縮放都由 scene.js 決定，這裡只提供外觀）
// 這個檔案「不」直接 import three：呼叫端把 THREE 傳進來 → launch.js 可以在開場一開始就載入這個小檔
//   （2D 退回畫法與平面圖也在這裡），three 本體等到歡迎詞時才在背景載入。
// 座標：X 右、Y 上、Z 機頭方向（+Z）。1 單位 ≈ 2D 畫法的 u（機身全長約 2.4、翼展約 2.24）。
//   平面圖（2D 俯視）座標 (x, y2)：y2 往機尾為正 → 3D 的 Z = Z0 − y2。
// 資源：一張程序生成的 832×416 紋理（約 1.4 MB，含 mipmap 約 1.85 MB；兩處各自上傳到自己的 GL），
//   約 5 千個三角形、12 次 draw call（機身 1、深色金屬 1、噴口內壁 1、三組尾焰各 3）。
// ------------------------------------------------------------------------------------------
const TAU = Math.PI * 2;
export const Z0 = 0.07;

// ---------- 平面圖（俯視）的輪廓：和原本 2D 太空梭完全相同的曲線 ----------
export function pBody(c) {
  c.beginPath();
  c.moveTo(0, -1.33);
  c.bezierCurveTo(0.12, -1.31, 0.225, -1.08, 0.245, -0.72);
  c.lineTo(0.258, 0.98); c.lineTo(0.205, 1.07); c.lineTo(-0.205, 1.07); c.lineTo(-0.258, 0.98); c.lineTo(-0.245, -0.72);
  c.bezierCurveTo(-0.225, -1.08, -0.12, -1.31, 0, -1.33);
  c.closePath();
}
export function wingLE(c, s, move) {
  if (move) c.moveTo(s * 0.2, -0.78); else c.lineTo(s * 0.2, -0.78);
  c.bezierCurveTo(s * 0.3, -0.18, s * 0.5, 0.36, s * 1.04, 0.74);
}
export function pWings(c) {
  c.beginPath();
  wingLE(c, 1, true);
  c.quadraticCurveTo(1.12, 0.8, 1.1, 0.9);
  c.lineTo(0.86, 0.94); c.quadraticCurveTo(0.5, 0.9, 0.24, 1.0);
  c.lineTo(-0.24, 1.0); c.quadraticCurveTo(-0.5, 0.9, -0.86, 0.94); c.lineTo(-1.1, 0.9);
  c.quadraticCurveTo(-1.12, 0.8, -1.04, 0.74);
  c.bezierCurveTo(-0.5, 0.36, -0.3, -0.18, -0.2, -0.78);
  c.closePath();
}
export function pPods(c) {
  for (const s of [-1, 1]) {
    c.moveTo(s * 0.2, 0.7);
    c.quadraticCurveTo(s * 0.3, 0.86, s * 0.27, 1.05);
    c.lineTo(s * 0.17, 1.05);
    c.quadraticCurveTo(s * 0.17, 0.86, s * 0.2, 0.7);
    c.closePath();
  }
}
export function pFin(c) {
  c.beginPath();
  c.moveTo(0, 0.36); c.lineTo(0.034, 0.74); c.lineTo(0.03, 1.15); c.lineTo(-0.03, 1.15); c.lineTo(-0.034, 0.74);
  c.closePath();
}

// 取樣用：把一串 2D 路徑指令變成折線（給 3D 幾何與 2D 退回畫法共用）
const bez3 = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
const bez2 = (a, b, c, t) => { const u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; };
// 右半翼平面輪廓（x ≥ 0，翼根在 x = 0、藏在機身裡）
export function wingHalf(n = 14) {
  const P = [[0, -0.78], [0.2, -0.78]];
  for (let i = 1; i <= n; i++) { const t = i / n; P.push([bez3(0.2, 0.3, 0.5, 1.04, t), bez3(-0.78, -0.18, 0.36, 0.74, t)]); }
  for (let i = 1; i <= 4; i++) { const t = i / 4; P.push([bez2(1.04, 1.12, 1.1, t), bez2(0.74, 0.8, 0.9, t)]); }
  P.push([0.86, 0.94]);
  for (let i = 1; i <= 6; i++) { const t = i / 6; P.push([bez2(0.86, 0.5, 0.24, t), bez2(0.94, 0.9, 1.0, t)]); }
  P.push([0, 1.0]);
  return P;
}
// 機身：平面半寬 w(y2)（和 pBody 一樣）、頂部與底部高度（3D 的 Y）
export function bodyAt(y2) {
  let w;
  if (y2 <= -0.72) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bez3(-1.33, -1.31, -1.08, -0.72, m) < y2) lo = m; else hi = m; }
    w = bez3(0, 0.12, 0.225, 0.245, (lo + hi) / 2);
  } else if (y2 <= 0.98) w = 0.245 + 0.013 * (y2 + 0.72) / 1.7;
  else w = 0.258 - 0.053 * Math.min(1, (y2 - 0.98) / 0.09);
  let yt;
  if (y2 <= -0.86) { const e = (y2 + 1.33) / 0.47; yt = -0.05 + 0.34 * (1 - Math.pow(1 - Math.max(0, e), 2.4)); }
  else if (y2 <= -0.55) { const e = (y2 + 0.86) / 0.31; yt = 0.29 - 0.045 * e * e * (3 - 2 * e); }
  else if (y2 <= 0.98) yt = 0.245;
  else yt = 0.245 - 0.03 * Math.min(1, (y2 - 0.98) / 0.09);
  let yb;
  if (y2 <= -1.0) { const e = (y2 + 1.33) / 0.33; yb = -0.07 - 0.13 * (1 - Math.pow(1 - Math.max(0, e), 2)); }
  else yb = -0.2;
  return { w, yt, yb };
}
export const ENGINES = [[0, 0.083], [-0.128, -0.093], [0.128, -0.093]];   // 主引擎噴口（後視圖的 X, Y）：上一下二
export const BELL = { z0: Z0 - 1.05, z1: Z0 - 1.29, r0: 0.046, r1: 0.092 };
export const FIN = { yBase: 0.235, h: 0.4, rootLE: 0.36, rootTE: 1.13, tipLE: 0.88, tipTE: 1.15, t0: 0.05, t1: 0.024 };
export const WING = { y: -0.165, t: 0.055, dihedral: 3.5 };

// ---------- 程序生成的紋理（隔熱瓦、分段線、黑色前緣、窗、機鼻帽、垂尾的方向舵） ----------
// 版面（A＝416）：左邊 A×A 是俯視圖（頂面）；右上 ½A×½A 是腹面、旁邊一塊實心黑瓦；右下 A×½A 是側視圖（機身側面、垂尾）
const A = 416, AW = 2 * A;
export const ATLAS = { A, W: AW, H: A };
export const UVT = (x, y2) => [(x + 1.25) / 2.5 * A / AW, 1 - (y2 + 1.42) / 2.76];
export const UVB = (x, y2) => [(A + (x + 1.25) / 2.5 * A * 0.5) / AW, 1 - (y2 + 1.42) / 2.76 * 0.5];
export const UVS = (z, y) => [(A + (z + 1.4) / 2.9 * A) / AW, 1 - (0.5 * A + (0.95 - y) / 1.3 * A * 0.5) / A];
export const UVK = [(1.75 * A) / AW, 1 - 0.25];
let ATLAS_CV = null;
function rnd(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
function tiles(c, x0, y0, x1, y1, step, line, jitter, R) {
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
    const v = (R() - 0.5) * jitter;
    if (Math.abs(v) > 0.004) { c.fillStyle = v > 0 ? `rgba(255,255,250,${v})` : `rgba(40,44,42,${-v})`; c.fillRect(x, y, step, step); }
  }
  c.strokeStyle = line; c.beginPath();
  for (let y = y0; y <= y1; y += step) { c.moveTo(x0, y); c.lineTo(x1, y); }
  for (let x = x0; x <= x1; x += step) { c.moveTo(x, y0); c.lineTo(x, y1); }
  c.stroke();
}
export function makeAtlas() {
  if (ATLAS_CV) return ATLAS_CV;
  const cv = document.createElement('canvas');
  cv.width = AW; cv.height = A;
  const c = cv.getContext('2d'), R = rnd(20261027);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = '#d9d5ca'; c.fillRect(0, 0, AW, A);
  // ===== 俯視圖（頂面） =====
  c.save();
  c.beginPath(); c.rect(0, 0, A, A); c.clip();
  c.setTransform(A / 2.5, 0, 0, A / 2.76, 1.25 * A / 2.5, 1.42 * A / 2.76);
  c.lineWidth = 0.006;
  // 機翼：白色隔熱瓦，翼根到翼尖微暗；細格紋
  const wg = c.createLinearGradient(0, 0, 1.15, 0);
  wg.addColorStop(0, '#e6e2d7'); wg.addColorStop(0.6, '#dad6cb'); wg.addColorStop(1, '#c9c6bc');
  const wg2 = c.createLinearGradient(0, 0, -1.15, 0);
  wg2.addColorStop(0, '#e6e2d7'); wg2.addColorStop(0.6, '#dad6cb'); wg2.addColorStop(1, '#c9c6bc');
  c.fillStyle = '#d9d5ca'; c.fillRect(-1.3, -1.45, 2.6, 2.85);
  c.save(); c.beginPath(); c.rect(0, -1.45, 1.3, 2.85); c.clip(); c.fillStyle = wg; pWings(c); c.fill(); c.restore();
  c.save(); c.beginPath(); c.rect(-1.3, -1.45, 1.3, 2.85); c.clip(); c.fillStyle = wg2; pWings(c); c.fill(); c.restore();
  c.save(); pWings(c); c.clip();
  tiles(c, -1.2, -0.85, 1.2, 1.05, 0.05, 'rgba(70,76,74,0.09)', 0.05, R);
  c.strokeStyle = 'rgba(70,76,74,0.5)'; c.lineWidth = 0.014;
  c.beginPath();
  for (const s of [-1, 1]) {
    c.moveTo(s * 0.26, 0.8); c.quadraticCurveTo(s * 0.6, 0.76, s * 1.0, 0.8);      // 副翼
    c.moveTo(s * 0.62, 0.78); c.lineTo(s * 0.62, 0.95);
    c.moveTo(s * 0.27, 0.3); c.lineTo(s * 0.6, 0.5);
  }
  c.stroke();
  // 前緣黑瓦（沿前緣的粗線，被機翼裁掉一半）＋黑白交界亮線
  c.strokeStyle = '#272d2b'; c.lineWidth = 0.13;
  c.beginPath();
  for (const s of [-1, 1]) { wingLE(c, s, true); c.quadraticCurveTo(s * 1.12, 0.8, s * 1.1, 0.9); }
  c.stroke();
  c.strokeStyle = 'rgba(150,156,150,0.55)'; c.lineWidth = 0.016;
  c.save(); c.translate(0, 0.072); c.beginPath(); for (const s of [-1, 1]) wingLE(c, s, true); c.stroke(); c.restore();
  // 翼根陰影（和機身交接處；烘在紋理裡的環境光遮蔽）
  for (const s of [-1, 1]) {
    const ao = c.createLinearGradient(s * 0.24, 0, s * 0.5, 0);
    ao.addColorStop(0, 'rgba(40,46,44,0.32)'); ao.addColorStop(1, 'rgba(40,46,44,0)');
    c.fillStyle = ao; c.fillRect(s > 0 ? 0.2 : -0.52, -0.7, 0.32, 1.8);
  }
  c.restore();
  // 機身
  c.fillStyle = '#e9e6dd'; pBody(c); c.fill();
  c.save(); pBody(c); c.clip();
  tiles(c, -0.3, -1.4, 0.3, 1.1, 0.04, 'rgba(70,76,74,0.07)', 0.045, R);
  const ng = c.createLinearGradient(0, -1.34, 0, -1.1);             // 機鼻帽（深灰碳纖維）
  ng.addColorStop(0, '#3a403e'); ng.addColorStop(0.72, '#555a57'); ng.addColorStop(1, 'rgba(85,90,87,0)');
  c.fillStyle = ng; c.fillRect(-0.3, -1.4, 0.6, 0.32);
  c.strokeStyle = 'rgba(64,70,68,0.38)'; c.lineWidth = 0.012;         // 機身分段線（橫向，淡一點；斜看時才不會像一圈圈的桶箍）
  c.beginPath();
  for (const y of [-0.62, -0.25, 0.12, 0.5, 0.86]) { c.moveTo(-0.26, y); c.quadraticCurveTo(0, y - 0.035, 0.26, y); }
  c.stroke();
  c.strokeStyle = 'rgba(64,70,68,0.62)'; c.lineWidth = 0.015;          // 酬載艙門（縱向）
  c.beginPath();
  c.moveTo(-0.15, -0.62); c.lineTo(-0.15, 0.86); c.moveTo(0.15, -0.62); c.lineTo(0.15, 0.86);
  c.moveTo(0, -0.62); c.lineTo(0, 0.86);
  c.stroke();
  c.fillStyle = 'rgba(52,58,56,0.6)';                                 // 姿態控制噴嘴
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 0.17, -1.0, 0.018, 0, TAU); c.fill(); c.beginPath(); c.arc(s * 0.2, -1.04, 0.012, 0, TAU); c.fill(); }
  c.restore();
  // 駕駛艙窗（四片深色玻璃）
  const wgl = c.createLinearGradient(0, -0.94, 0, -0.78);
  wgl.addColorStop(0, '#2c4452'); wgl.addColorStop(1, '#0f191e');
  c.fillStyle = wgl;
  c.beginPath(); c.moveTo(-0.16, -0.8); c.lineTo(-0.115, -0.935); c.lineTo(0.115, -0.935); c.lineTo(0.16, -0.8); c.quadraticCurveTo(0, -0.77, -0.16, -0.8); c.closePath(); c.fill();
  c.strokeStyle = '#cfcbc0'; c.lineWidth = 0.018;
  c.beginPath(); c.moveTo(0, -0.935); c.lineTo(0, -0.78); c.moveTo(-0.075, -0.935); c.lineTo(-0.09, -0.785); c.moveTo(0.075, -0.935); c.lineTo(0.09, -0.785); c.stroke();
  // 整流罩（頂面）
  c.fillStyle = '#ece9e0'; c.beginPath(); pPods(c); c.fill();
  c.strokeStyle = 'rgba(60,66,64,0.5)'; c.lineWidth = 0.012; c.beginPath(); pPods(c); c.stroke();
  c.restore();
  // ===== 腹面（黑色隔熱瓦，邊緣一點灰） =====
  c.save();
  c.beginPath(); c.rect(A, 0, A / 2, A / 2); c.clip();
  c.fillStyle = '#373c3d'; c.fillRect(A, 0, A / 2, A / 2);
  c.setTransform(A / 2.5 / 2, 0, 0, A / 2.76 / 2, A + 1.25 * A / 5, 1.42 * A / 5.52);
  c.lineWidth = 0.012;
  tiles(c, -1.25, -1.42, 1.25, 1.34, 0.06, 'rgba(120,126,122,0.28)', 0.08, R);
  c.restore();
  // 實心黑瓦（翼前緣、翼端與後緣的側面）
  c.fillStyle = '#262b2a'; c.fillRect(1.5 * A, 0, A / 2, A / 2);
  // ===== 側視圖（Z 往右＝往機頭；Y 往上） =====
  c.save();
  c.beginPath(); c.rect(A, A / 2, A, A / 2); c.clip();
  c.setTransform(A / 2.9, 0, 0, -A / 2 / 1.3, A + 1.4 * A / 2.9, A / 2 + 0.95 * A / 2 / 1.3);   // (Z, Y) → 像素
  c.fillStyle = '#e6e3da'; c.fillRect(-1.4, -0.35, 2.9, 1.3);
  c.lineWidth = 0.008;
  tiles(c, -1.4, -0.35, 1.5, 0.95, 0.045, 'rgba(70,76,74,0.09)', 0.04, R);
  // 機身下緣：黑瓦（側面靠近腹部的一條）
  const bl = c.createLinearGradient(0, -0.2, 0, -0.06);
  bl.addColorStop(0, '#272c2b'); bl.addColorStop(0.75, '#2c3130'); bl.addColorStop(1, 'rgba(44,49,48,0)');
  c.fillStyle = bl; c.fillRect(-1.4, -0.35, 2.9, 0.29);
  // 機鼻帽（側面）
  const nz = c.createLinearGradient(1.45, 0, 1.18, 0);
  nz.addColorStop(0, '#3a403e'); nz.addColorStop(0.75, '#555a57'); nz.addColorStop(1, 'rgba(85,90,87,0)');
  c.fillStyle = nz; c.fillRect(1.15, -0.35, 0.4, 1.3);
  // 酬載艙門的邊線、機身分段線
  c.strokeStyle = 'rgba(64,70,68,0.55)'; c.lineWidth = 0.012;
  c.beginPath();
  c.moveTo(0.69, 0.175); c.lineTo(-0.79, 0.175);
  for (const y2 of [-0.62, -0.25, 0.12, 0.5, 0.86]) { const z = Z0 - y2; c.moveTo(z, -0.06); c.lineTo(z, 0.27); }
  c.stroke();
  // 側窗（兩片小窗）
  c.fillStyle = '#16232a';
  for (const z of [0.93, 0.84]) { c.beginPath(); c.moveTo(z - 0.035, 0.13); c.lineTo(z + 0.035, 0.135); c.lineTo(z + 0.03, 0.2); c.lineTo(z - 0.03, 0.195); c.closePath(); c.fill(); }
  // 垂直尾翼：方向舵（後段）、前緣深色條
  const F = FIN, zL0 = Z0 - F.rootLE, zT0 = Z0 - F.rootTE, zL1 = Z0 - F.tipLE, zT1 = Z0 - F.tipTE, y0 = F.yBase, y1 = F.yBase + F.h;
  c.strokeStyle = 'rgba(60,66,64,0.6)'; c.lineWidth = 0.012;
  c.beginPath();
  const rf = 0.62;                                                    // 方向舵分界（弦長比例）
  c.moveTo(lerp(zL0, zT0, rf), y0 + 0.02); c.lineTo(lerp(zL1, zT1, rf), y1 - 0.01);
  c.moveTo(lerp(zL0, zT0, rf), y0 + 0.25); c.lineTo(zT0 + 0.01, y0 + 0.25);
  c.stroke();
  c.strokeStyle = '#2d3331'; c.lineWidth = 0.035;
  c.beginPath(); c.moveTo(zL0, y0); c.lineTo(zL1, y1); c.stroke();
  c.restore();
  ATLAS_CV = cv;
  return cv;
}
export function freeAtlas() { ATLAS_CV = null; }
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 幾何 ----------
// parts: {pos:Float32Array(非索引、每 3 頂點一個三角形), nor, mode}；依面的法向量決定用哪一塊紋理
function assignUV(pos, nor, mode) {
  const n = pos.length / 3, uv = new Float32Array(n * 2);
  for (let t = 0; t < n; t += 3) {
    // 面法向量
    const ax = pos[t * 3], ay = pos[t * 3 + 1], az = pos[t * 3 + 2];
    const ux = pos[t * 3 + 3] - ax, uy = pos[t * 3 + 4] - ay, uz = pos[t * 3 + 5] - az;
    const vx = pos[t * 3 + 6] - ax, vy = pos[t * 3 + 7] - ay, vz = pos[t * 3 + 8] - az;
    let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    let proj;
    if (mode === 'fin') proj = 'S';
    else if (mode === 'wing') proj = fy > 0.3 ? 'T' : fy < -0.3 ? 'B' : 'K';
    else proj = fy > 0.42 ? 'T' : fy < -0.55 ? 'B' : 'S';
    for (let k = 0; k < 3; k++) {
      const i = t + k, x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], y2 = Z0 - z;
      const q = proj === 'T' ? UVT(x, y2) : proj === 'B' ? UVB(x, y2) : proj === 'S' ? UVS(z, y) : UVK;
      uv[i * 2] = q[0]; uv[i * 2 + 1] = q[1];
    }
  }
  return uv;
}
function nonIndexed(THREE, g) {
  if (!g.index) return g;
  const n = g.toNonIndexed(); g.dispose(); return n;
}
function merge(THREE, list, withUV) {
  let N = 0;
  for (const p of list) N += p.pos.length;
  const pos = new Float32Array(N), nor = new Float32Array(N), uv = withUV ? new Float32Array(N / 3 * 2) : null, col = list.some(p => p.col) ? new Float32Array(N) : null;
  let o = 0;
  for (const p of list) {
    pos.set(p.pos, o); nor.set(p.nor, o);
    if (uv) uv.set(p.uv, o / 3 * 2);
    if (col) { if (p.col) col.set(p.col, o); else col.fill(1, o, o + p.pos.length); }
    o += p.pos.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}
function partOf(THREE, g, mode) {
  g = nonIndexed(THREE, g);
  const pos = g.attributes.position.array.slice(), nor = g.attributes.normal.array.slice();
  g.dispose();
  return { pos, nor, uv: mode ? assignUV(pos, nor, mode) : null };
}
// 機身：沿機身的截面環（上半圓潤、下半較平），機尾開口另外用深色底板封住
function fuselage(THREE) {
  const st = [];
  for (let i = 0; i <= 16; i++) st.push(-1.33 + 0.61 * Math.pow(i / 16, 1.8));
  for (let i = 1; i <= 10; i++) st.push(-0.72 + 1.7 * i / 10);
  st.push(1.01, 1.04, 1.07);
  st[0] = -1.3299;
  const M = 28, ring = [], pos = [];
  for (const y2 of st) {
    const b = bodyAt(y2), yc = (b.yt + b.yb) / 2, hh = (b.yt - b.yb) / 2, r = [];
    for (let j = 0; j < M; j++) {
      const a = j / M * TAU, cs = Math.cos(a), sn = Math.sin(a), n = sn > 0 ? 2.5 : 4.5;
      r.push([b.w * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n), yc + hh * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n), Z0 - y2]);
    }
    ring.push(r);
  }
  const P = new Float32Array(ring.length * M * 3);
  ring.forEach((r, i) => r.forEach((p, j) => P.set(p, (i * M + j) * 3)));
  const idx = [];
  for (let i = 0; i < ring.length - 1; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, c2 = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M;
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // 機尾底板（深色）
  const last = ring[ring.length - 1], cz = last[0][2], cap = [];
  let cyc = 0; for (const p of last) cyc += p[1]; cyc /= M;
  for (let j = 0; j < M; j++) { const p = last[j], q = last[(j + 1) % M]; cap.push(0, cyc, cz, ...q, ...p); }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cap, 3));
  cg.computeVertexNormals();
  return { body: g, cap: cg };
}
// 機翼：右半翼的平面輪廓擠出成薄板（翼根厚、翼尖薄、前緣圓），上反角 WING.dihedral；左半翼鏡像
function wing(THREE, side) {
  const sh = new THREE.Shape();
  const P = wingHalf(16);
  P.forEach(([x, y2], i) => { const X = side * x, Y = y2 - Z0; if (i) sh.lineTo(X, Y); else sh.moveTo(X, Y); });
  const g = new THREE.ExtrudeGeometry(sh, { depth: WING.t, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 2, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);            // 形狀的 Y → −Z（機尾），擠出方向 → +Y
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), ax = Math.min(1, Math.abs(x) / 1.12);
    // 翼尖變薄、上反角
    const yy = (y - WING.t / 2) * (1 - 0.55 * ax) + Math.abs(x) * Math.tan(WING.dihedral * Math.PI / 180);
    p.setY(i, yy + WING.y);
  }
  g.computeVertexNormals();
  return g;
}
function fin(THREE) {
  const F = FIN, sh = new THREE.Shape();
  // 形狀座標：X＝−Z（往機尾為正）、Y＝高度
  sh.moveTo(F.rootLE - Z0, F.yBase - 0.02); sh.lineTo(F.tipLE - Z0, F.yBase + F.h); sh.lineTo(F.tipTE - Z0, F.yBase + F.h);
  sh.lineTo(F.rootTE - Z0, F.yBase - 0.02); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: F.t0, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 1 });
  g.rotateY(Math.PI / 2);              // 形狀 X → −Z、擠出方向 → +X
  g.translate(-F.t0 / 2, 0, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const h = Math.min(1, Math.max(0, (p.getY(i) - F.yBase) / F.h)); p.setX(i, p.getX(i) * (1 - (1 - F.t1 / F.t0) * h)); }
  g.computeVertexNormals();
  return g;
}
function pod(THREE, s) {
  const g = new THREE.SphereGeometry(1, 14, 8);
  g.scale(0.06, 0.055, 0.21);
  g.translate(s * 0.215, 0.205, Z0 - 0.88);
  return g;
}

// ---------- 材質：受光以外再加兩項（蟲洞與星球共用同一段著色器） ----------
//   邊緣光（uRimCol、uRimDir：觀察空間的方向；越靠輪廓、越朝光源越亮）＋尾焰照亮機尾（uTailCol，靠近機尾、朝後的面）
function patch(m, U) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uRimCol = U.uRimCol; sh.uniforms.uRimDir = U.uRimDir; sh.uniforms.uRimPow = U.uRimPow; sh.uniforms.uTailCol = U.uTailCol;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMP;\nvarying vec3 vMN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMP = position; vMN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimCol; uniform vec3 uRimDir; uniform float uRimPow; uniform vec3 uTailCol;\nvarying vec3 vMP;\nvarying vec3 vMN;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec3 Vv = normalize(vViewPosition);
  float fr = pow(1.0 - clamp(abs(dot(normal, Vv)), 0.0, 1.0), uRimPow);
  float tw = smoothstep(0.0, 0.65, dot(normal, uRimDir));
  totalEmissiveRadiance += uRimCol * fr * tw * (0.35 + 0.65 * diffuseColor.rgb);
  float tail = smoothstep(${(Z0 - 0.45).toFixed(3)}, ${(Z0 - 1.07).toFixed(3)}, vMP.z) * (0.25 + 0.75 * max(0.0, -normalize(vMN).z));
  totalEmissiveRadiance += uTailCol * tail * diffuseColor.rgb;
}`);
  };
  m.customProgramCacheKey = () => 'shuttle3d-k';
}

// 尾焰：外焰（柔和、帶熱浪的輕微扭動）＋白熱內焰＋噴口光暈（面向鏡頭的光片）
const FLAME_VS = `
uniform float uTime; uniform float uPow; uniform float uShim;
varying float vT; varying vec3 vN; varying vec3 vV;
void main() {
  vec3 p = position;
  float t = clamp(-p.z, 0.0, 1.0); vT = t;
  float ang = atan(p.y, p.x);
  float w = sin(t * 17.0 - uTime * 29.0 + ang * 3.0) * 0.6 + sin(t * 31.0 - uTime * 47.0 - ang * 2.0) * 0.4;
  p.xy *= 1.0 + uShim * t * w + 0.22 * (uPow - 1.0) * t;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;
const FLAME_FS = `
uniform vec3 uC0; uniform vec3 uC1; uniform float uI; uniform float uK; uniform float uTime;
varying float vT; varying vec3 vN; varying vec3 vV;
void main() {
  float e = abs(dot(normalize(vN), normalize(vV)));
  float body = mix(0.25, 1.0, pow(e, uK));                 // 輪廓處較淡（有體積感），正面看過去也看得到（機尾視角是幾乎順著火焰看）
  float fall = pow(1.0 - vT, 1.8) * smoothstep(0.0, 0.04, vT + 0.01);
  float fl = 0.92 + 0.08 * sin(vT * 23.0 - uTime * 37.0);  // 輕微脈動（熱浪）
  vec3 col = mix(uC1, uC0, clamp((1.0 - vT) * (0.4 + 0.6 * e) * 1.3, 0.0, 1.0));
  gl_FragColor = vec4(col * body * fall * fl * uI, 1.0);
}`;
const HALO_VS = `
uniform float uSize; varying vec2 vQ;
void main() {
  vQ = position.xy * 2.0;
  float sc = length(modelMatrix[0].xyz);
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uSize * sc;
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FS = `
uniform vec3 uC; uniform float uI; varying vec2 vQ;
void main() {
  float r2 = dot(vQ, vQ);
  float a = exp(-r2 * 5.0) * 0.8 + exp(-r2 * 26.0) * 0.6;
  gl_FragColor = vec4(uC * a * uI * (1.0 - smoothstep(0.7, 1.0, r2)), 1.0);
}`;

// buildShuttle(THREE, opt) → { group, flames, U, setThrust(power, timeS), tris, dispose() }
//   opt.flameLen：外焰長度（預設 0.85，scene.js 的 flicker 會再乘上 group.scale.z）
//   opt.anisotropy：紋理的異向過濾
export function buildShuttle(THREE, opt = {}) {
  const parts = [], dark = [], hot = [];
  const fz = fuselage(THREE);
  parts.push(partOf(THREE, fz.body, 'body'));
  dark.push(partOf(THREE, fz.cap, null));
  parts.push(partOf(THREE, wing(THREE, 1), 'wing'), partOf(THREE, wing(THREE, -1), 'wing'));
  parts.push(partOf(THREE, fin(THREE), 'fin'));
  parts.push(partOf(THREE, pod(THREE, 1), 'body'), partOf(THREE, pod(THREE, -1), 'body'));
  // 機尾襟翼（引擎下方的一片）
  const flap = new THREE.BoxGeometry(0.4, 0.035, 0.11); flap.translate(0, -0.19, Z0 - 1.12);
  dark.push(partOf(THREE, flap, null));
  // 主引擎噴口：外殼（深色金屬）＋內壁（白熱、往噴口外變暗）＋喉部小圓盤；整流罩後端的小噴嘴
  const B = BELL;
  for (const [x, y] of ENGINES) {
    const mk = k => {
      const g = new THREE.CylinderGeometry(B.r0 * k, B.r1 * k, B.z0 - B.z1, 18, 3, true);
      const gp = g.attributes.position, L = B.z0 - B.z1;
      for (let i = 0; i < gp.count; i++) { const h = (gp.getY(i) + L / 2) / L, f = 1 + 0.08 * Math.sin(Math.PI * h); gp.setX(i, gp.getX(i) * f); gp.setZ(i, gp.getZ(i) * f); }
      g.computeVertexNormals();
      g.rotateX(Math.PI / 2); g.translate(x, y, (B.z0 + B.z1) / 2);   // 喉部（細）朝前、噴口（粗）朝後
      return g;
    };
    dark.push(partOf(THREE, mk(1), null));
    // 內壁（略小一圈、雙面）：頂點色＝離喉部越近越亮
    const pr = partOf(THREE, mk(0.93), null);
    pr.col = new Float32Array(pr.pos.length);
    for (let i = 0; i < pr.pos.length; i += 3) { const h = Math.min(1, Math.max(0, (B.z0 - pr.pos[i + 2]) / (B.z0 - B.z1))); pr.col[i] = lerp(0.95, 0.3, h); pr.col[i + 1] = lerp(0.98, 0.5, h); pr.col[i + 2] = lerp(1.0, 0.85, h); }
    hot.push(pr);
    const disc = new THREE.CircleGeometry(B.r0 * 1.05, 14); disc.rotateY(Math.PI); disc.translate(x, y, B.z0 - 0.004);
    const dp = partOf(THREE, disc, null); dp.col = new Float32Array(dp.pos.length).fill(1); hot.push(dp);
  }
  for (const s of [-1, 1]) {
    const n = new THREE.CylinderGeometry(0.018, 0.032, 0.06, 10, 1, true); n.rotateX(Math.PI / 2); n.translate(s * 0.215, 0.205, Z0 - 1.1);
    dark.push(partOf(THREE, n, null));
  }
  const gBody = merge(THREE, parts, true), gDark = merge(THREE, dark, false), gHot = merge(THREE, hot, false);

  const tex = new THREE.CanvasTexture(makeAtlas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = opt.anisotropy || 4;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const U = {
    uRimCol: { value: new THREE.Color(0, 0, 0) }, uRimDir: { value: new THREE.Vector3(0, 0, -1) }, uRimPow: { value: 3.2 },
    uTailCol: { value: new THREE.Color(0, 0, 0) },
  };
  const mBody = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: opt.bump == null ? 0.3 : opt.bump, roughness: 0.88, metalness: 0.0 });   // 隔熱瓦很霧面
  const mDark = new THREE.MeshStandardMaterial({ color: 0x40464a, roughness: 0.38, metalness: 0.7 });
  patch(mBody, U); patch(mDark, U);
  const mHot = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
  const group = new THREE.Group();
  group.name = 'shuttle3d';
  const meshBody = new THREE.Mesh(gBody, mBody), meshDark = new THREE.Mesh(gDark, mDark), meshHot = new THREE.Mesh(gHot, mHot);
  group.add(meshBody, meshDark, meshHot);

  // 尾焰（每個噴口一組：外焰、內焰、光暈），group 的 −Z 是往後噴的方向；scene.js 用 scale.z 調整長度
  const blend = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
  const FU = { uTime: { value: 0 }, uPow: { value: 1 }, uShim: { value: 0.06 } };
  const mkFlameMat = (c0, c1, I, K) => new THREE.ShaderMaterial({
    uniforms: { ...FU, uC0: { value: new THREE.Color(c0) }, uC1: { value: new THREE.Color(c1) }, uI: { value: I }, uK: { value: K } },
    vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...blend,
  });
  const mOut = mkFlameMat(0xb4dcff, 0x3f8cff, 1.0, 1.3), mIn = mkFlameMat(0xffffff, 0xa8d8ff, 1.15, 0.8);
  const mHalo = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(0x8cc4ff) }, uI: { value: 0.5 }, uSize: { value: 0.42 } },
    vertexShader: HALO_VS, fragmentShader: HALO_FS, transparent: true, depthWrite: false, depthTest: true, fog: false, ...blend,
  });
  const L = opt.flameLen || 0.85;
  const gOut = new THREE.CylinderGeometry(B.r1 * 0.9, B.r1 * 2.1, 1, 18, 10, true); gOut.translate(0, -0.5, 0); gOut.rotateX(Math.PI / 2);   // 真空中的尾焰往外擴張
  const gIn = new THREE.CylinderGeometry(B.r1 * 0.6, B.r1 * 0.12, 0.5, 14, 5, true); gIn.translate(0, -0.25, 0); gIn.rotateX(Math.PI / 2);
  const gHalo = new THREE.PlaneGeometry(1, 1);
  const flames = [];
  for (const [x, y] of ENGINES) {
    const fg = new THREE.Group();
    fg.position.set(x, y, B.z1 + 0.01);
    const o = new THREE.Mesh(gOut, mOut); o.scale.set(1, 1, L);
    const i2 = new THREE.Mesh(gIn, mIn); i2.scale.set(1, 1, L);
    const h = new THREE.Mesh(gHalo, mHalo); h.position.z = -0.02;
    o.renderOrder = i2.renderOrder = h.renderOrder = 9;
    o.frustumCulled = i2.frustumCulled = h.frustumCulled = false;
    fg.add(o, i2, h);
    group.add(fg);
    flames.push(fg);
  }
  const tris = (gBody.attributes.position.count + gDark.attributes.position.count + gHot.attributes.position.count) / 3
    + 3 * ((gOut.index ? gOut.index.count : 0) + (gIn.index ? gIn.index.count : 0) + 6) / 3;
  return {
    group, flames, U, tris: Math.round(tris), meshes: { body: meshBody, dark: meshDark, hot: meshHot },
    mats: { body: mBody, dark: mDark, hot: mHot, out: mOut, in: mIn, halo: mHalo },
    // power：推力（1＝巡航；越大火焰越長越亮）；timeS：秒（熱浪扭動用）
    setThrust(power, timeS, haloI) {
      FU.uPow.value = power; FU.uTime.value = timeS || 0;
      mOut.uniforms.uI.value = 1.0 * (0.85 + 0.15 * power); mIn.uniforms.uI.value = 1.15 * (0.85 + 0.15 * power);
      mHalo.uniforms.uI.value = haloI != null ? haloI : 0.5 * power;
      mHot.color.setScalar(Math.min(1, 0.75 + 0.2 * power));
    },
    dispose() {
      for (const g of [gBody, gDark, gHot, gOut, gIn, gHalo]) g.dispose();
      for (const m of [mBody, mDark, mHot, mOut, mIn, mHalo]) m.dispose();
      tex.dispose();
      if (group.parent) group.parent.remove(group);
    },
  };
}
