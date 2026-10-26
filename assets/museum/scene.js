// 伽利略星球的 3D 場景（Three.js r170，卡通描邊，全部用程式碼拼幾何，不用外部模型或貼圖）。
// 規格見 galileo-planet/PLAN.md §4、§5、§11。重點：
//   - 球外：39 個單元地標佈滿四個館的區域（只看不能點，點到就是點那一館）
//   - 進館：鏡頭轉成近乎正上方，球體淡出，剩下這一館的「平面地圖」（彎路＋單元站＋通往隔壁館的出口）
//   - render-on-demand：沒有動作時完全停止繪圖（0 fps）
import * as THREE from './vendor/three.module.min.js';

const R = 10;                 // 星球半徑
const PLATEAU_TOP = R + 0.2;  // 館的平台頂面離球心的距離
const TILT = 0.35;
const BASE_FOV = 40;           // 一般視角；開場加速時會暫時拉寬            // 星球預設的「北極朝向觀眾」傾角
const TAU = Math.PI * 2;
const INK = 0x0b1a15;         // 描邊色（不用純黑）
const HALL_PITCH = 0.42;      // 館層鏡頭與正上方的夾角（弧度）；0＝完全俯視
const MAP_Y = 0.16;           // 地圖面高度（相對館的平台）
const DISC_R = 14.4;          // 地圖底盤半徑
// 地圖在兩種版型下需要塞進畫面的半寬、半高（世界單位）
const EXT = { v: { ex: 6.8, ey: 11.4 }, h: { ex: 12.4, ey: 6.8 } };
const PROP_COUNT = 120;      // 每館的特色小景數量（縮小、加密，球的輪廓才不會被撐開）
const E_FLAT = 0.2;           // 廣場、道路、單元站壓平後的高度
// 畫布是透明的（後面是 CSS 星雲）。一般的加法混色會把 alpha 也加成 1，背景就被蓋成暗色。
// GLOW_BLEND_A：顏色相加、alpha 也相加（著色器輸出的 alpha＝亮度，屬於正常的預乘透明）
// GLOW_BLEND：顏色相加、alpha 不動（給星流、火焰這種一般材質用）
const GLOW_BLEND_A = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };
const GLOW_BLEND = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
const GATE_EMOJI = { physics: '⚛️', chemistry: '🧪', earth: '🌍', biology: '🧬' };

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- 小工具：雜訊、合併幾何、材質 ----------
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x, y, z) {
  return vnoise(x, y, z) * 0.55 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.15;
}

function makeGradient() {
  const t = new THREE.DataTexture(new Uint8Array([85, 165, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

function M(x, y, z, rx = 0, ry = 0, rz = 0) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1),
  );
}

// 以幾何中心為基準放大一點，當作描邊用的外殼
function expandGeo(geo, w) {
  geo.computeBoundingSphere();
  const bs = geo.boundingSphere;
  const s = 1 + w / Math.max(0.2, bs.radius);
  const c = bs.center;
  const m = new THREE.Matrix4().makeTranslation(c.x, c.y, c.z)
    .multiply(new THREE.Matrix4().makeScale(s, s, s))
    .multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
  geo.applyMatrix4(m);
  return geo;
}

// parts: [{g: BufferGeometry, m: Matrix4, color: Color, noHull?: boolean}]
// 回傳 {body, hull}：body 帶頂點色（平面著色），hull 是各零件各自放大一圈的描邊外殼。
function buildMerged(parts, hullWidth) {
  const pos = [], nor = [], col = [], hpos = [];
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    g.applyMatrix4(p.m);
    g.computeVertexNormals();
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) col.push(p.color.r, p.color.g, p.color.b);
    if (hullWidth > 0 && !p.noHull) {
      const h = expandGeo(g.clone(), hullWidth);
      const ha = h.attributes.position.array;
      for (let i = 0; i < ha.length; i++) hpos.push(ha[i]);
      h.dispose();
    }
    g.dispose();
    p.g.dispose();
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(hpos, 3));
  return { body, hull };
}

const emojiCache = new Map();
function emojiTexture(ch) {
  if (emojiCache.has(ch)) return emojiCache.get(ch);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  emojiCache.set(ch, t);
  return t;
}
const numCache = new Map();
function numberTexture(n, hex) {
  const key = n + ':' + hex;
  if (numCache.has(key)) return numCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#16241f';
  x.beginPath(); x.arc(48, 48, 42, 0, TAU); x.fill();
  x.lineWidth = 7; x.strokeStyle = hex; x.stroke();
  x.fillStyle = '#f6f3ea';
  x.font = 'bold 50px "Noto Sans TC","Helvetica Neue",Arial,sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(n), 48, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  numCache.set(key, t);
  return t;
}

function Ms(x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz));
}
function roundRectPath(x, a, b, w, h, r) {
  x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}

// ---------- 各館的科學家雕像（球外在館中心，進館後在地圖起點）----------
const STONE = 0xe6e0d0, STONE2 = 0xcfc8b4;
function statueParts(hall) {
  const hc = new THREE.Color(hall.color), parts = [];
  const P = (g, m, c, noHull) => parts.push({ g, m, color: new THREE.Color(c), noHull });
  P(new THREE.CylinderGeometry(2.0, 2.0, 0.1, 24), M(0, 0.05, 0), 0xd9d2bc, true);       // 廣場石板
  P(new THREE.BoxGeometry(1.7, 0.45, 1.7), M(0, 0.33, 0), STONE2);
  P(new THREE.BoxGeometry(1.2, 1.0, 1.2), M(0, 1.05, 0), STONE);
  P(new THREE.BoxGeometry(0.75, 0.3, 0.06), M(0, 1.0, 0.63), hc);                        // 館色銘牌
  P(new THREE.CylinderGeometry(0.3, 0.55, 1.5, 10), M(0, 2.3, 0), STONE);                // 長袍
  P(new THREE.SphereGeometry(0.42, 10, 6), Ms(0, 3.0, 0, 1.15, 0.55, 0.85), STONE);      // 肩
  P(new THREE.SphereGeometry(0.31, 12, 8), M(0, 3.45, 0), STONE);                        // 頭
  if (hall.id !== 'physics') P(new THREE.ConeGeometry(0.2, 0.5, 6), M(0, 3.1, 0.2, Math.PI, 0, 0), STONE); // 鬍子
  P(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 7), M(0.62, 3.45, 0, 0, 0, -0.55), STONE); // 舉起的手臂
  // 說明牌的立架（石碑面朝前方、上傾，從上往下看也讀得到）
  P(new THREE.CylinderGeometry(0.07, 0.09, 0.95, 6), M(-0.85, 0.47, 1.7), STONE2);
  P(new THREE.CylinderGeometry(0.07, 0.09, 0.95, 6), M(0.85, 0.47, 1.7), STONE2);
  P(new THREE.BoxGeometry(2.3, 0.1, 1.46), M(0, 1.1, 1.7, 0.61, 0, 0), STONE2);
  if (hall.id === 'physics') {          // 牛頓：假髮、舉著蘋果；座上放稜鏡
    for (let i = 0; i < 8; i++) P(new THREE.SphereGeometry(0.17, 8, 6), M(Math.cos(i * 0.785) * 0.3, 3.38 + 0.04 * (i % 2), Math.sin(i * 0.785) * 0.3 - 0.05), 0xe6e0d6);
    P(new THREE.SphereGeometry(0.3, 10, 8), M(0, 3.3, -0.2), 0xe6e0d6);
    P(new THREE.SphereGeometry(0.23, 10, 8), M(1.0, 4.0, 0), 0xe0483a);
    P(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 4), M(1.0, 4.27, 0), 0x5a3a22, true);
    P(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 3), M(0.5, 0.85, 0.55, Math.PI / 2, 0.4, 0), 0xa8e6ff);
  } else if (hall.id === 'chemistry') {  // 拉瓦節：高舉燒瓶
    P(new THREE.SphereGeometry(0.34, 10, 8), M(1.0, 4.0, 0), 0xf0955c);
    P(new THREE.CylinderGeometry(0.1, 0.1, 0.45, 8), M(1.0, 4.45, 0), 0xf6d3bb);
    P(new THREE.CylinderGeometry(0.13, 0.11, 0.12, 8), M(1.0, 4.72, 0), 0x8a5a3a);
    P(new THREE.IcosahedronGeometry(0.1, 0), M(0.82, 4.95, 0.1), 0xfff3e6);
    P(new THREE.IcosahedronGeometry(0.07, 0), M(1.12, 5.15, 0), 0xfff3e6);
  } else if (hall.id === 'earth') {      // 魏格納：捧著地球儀（大陸可以拼起來）
    P(new THREE.SphereGeometry(0.42, 12, 8), M(1.0, 4.0, 0), 0x4f8ee0);
    P(new THREE.IcosahedronGeometry(0.2, 0), M(1.18, 4.12, 0.2), 0x7bc47a);
    P(new THREE.IcosahedronGeometry(0.17, 0), M(0.82, 3.9, 0.28), 0x7bc47a);
    P(new THREE.CylinderGeometry(0.05, 0.1, 0.3, 6), M(1.0, 3.5, 0), 0xb8862b, true);
  } else {                               // 達爾文：手拿葉子，腳邊有隻加拉巴哥象龜
    P(new THREE.SphereGeometry(0.3, 8, 6), Ms(1.0, 4.0, 0, 1.2, 0.35, 0.9, 0, 0, 0.5), 0x4fae60);
    P(new THREE.SphereGeometry(0.62, 12, 8), Ms(1.55, 0.45, 0.4, 1.2, 0.6, 1.45), 0x5f8f4a);
    P(new THREE.SphereGeometry(0.2, 8, 6), M(1.55, 0.5, 1.35), 0x9bc27a);
    for (const [dx, dz] of [[-0.45, 0.1], [0.45, 0.1], [-0.4, 0.8], [0.4, 0.8]]) P(new THREE.CylinderGeometry(0.1, 0.12, 0.25, 6), M(1.55 + dx, 0.14, dz), 0x9bc27a, true);
  }
  return parts;
}

// ---------- 各館的特色小景（散在館的區域，不壓到路）：每種都是多個零件拼成 ----------
const GREENS = [0x3f9a4d, 0x4fae60, 0x66c274, 0x37893f];
function treeParts(P, rnd, kind) {
  const trunk = (h, r0, r1) => P(new THREE.CylinderGeometry(r0, r1, h, 7), M(0, h / 2, 0), 0x7a5a3a);
  if (kind === 'pine') {
    trunk(0.8, 0.09, 0.15);
    [[0.9, 0.95, 0.9], [0.72, 0.8, 1.45], [0.54, 0.7, 1.9], [0.32, 0.6, 2.3]].forEach(([r, h, y], i) => P(new THREE.ConeGeometry(r, h, 9), M(0, y, 0), i % 2 ? 0x3b8f55 : 0x2f7d4a));
  } else if (kind === 'bush') {
    for (let i = 0; i < 3; i++) P(new THREE.IcosahedronGeometry(0.34 + 0.14 * rnd(i), 1), M((rnd(i + 3) - 0.5) * 0.7, 0.3, (rnd(i + 6) - 0.5) * 0.7), GREENS[i % 4]);
  } else {
    const sakura = kind === 'sakura';
    trunk(1.15, 0.1, 0.18);
    P(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 5), M(0.22, 1.35, 0, 0, 0, -0.7), 0x7a5a3a);
    const cols = sakura ? [0xf7a8c4, 0xf2c0d4, 0xf59ab8, 0xfbd0de] : GREENS;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rnd(i) * 0.6, rr = i === 0 ? 0 : 0.42 + 0.18 * rnd(i + 9);
      P(new THREE.IcosahedronGeometry(0.5 + 0.22 * rnd(i + 2), 1), M(Math.cos(a) * rr, 1.55 + 0.42 * (i % 3) * 0.55 + 0.18 * rnd(i + 4), Math.sin(a) * rr), cols[i % 4]);
    }
  }
}
function mushroomParts(P, rnd) {
  [[0, 0, 0.5, 0xe06a5a], [0.75, 0.3, 0.34, 0xe0b25a], [-0.55, 0.4, 0.28, 0xe06a5a]].forEach(([x, z, s, c]) => {
    P(new THREE.CylinderGeometry(0.09 * s * 2, 0.13 * s * 2, 1.0 * s, 7), M(x, 0.5 * s, z), 0xf2ecd9);
    P(new THREE.SphereGeometry(0.8 * s, 12, 7, 0, TAU, 0, Math.PI / 2), M(x, 1.0 * s, z), c);
    for (let i = 0; i < 4; i++) P(new THREE.IcosahedronGeometry(0.07 * s * 2, 0), M(x + Math.cos(i * 1.6) * 0.45 * s, 1.0 * s + 0.4 * s, z + Math.sin(i * 1.6) * 0.45 * s), 0xfff4e0);
  });
}
function propParts(hall, kind, rnd) {
  const hc = new THREE.Color(hall.color), parts = [];
  const P = (g, m, c) => parts.push({ g, m, color: new THREE.Color(c) });
  if (TREE_KINDS.has(kind)) { treeParts(P, rnd, kind); return parts; }
  if (hall.id === 'biology') {
    if (kind === 'mushroom') mushroomParts(P, rnd); else treeParts(P, rnd, kind);
  } else if (hall.id === 'physics') {
    if (kind === 'dome') {
      P(new THREE.CylinderGeometry(0.55, 0.68, 0.85, 14), M(0, 0.42, 0), 0xe9dfc4);
      P(new THREE.SphereGeometry(0.64, 16, 8, 0, TAU, 0, Math.PI / 2), M(0, 0.85, 0), hc);
      P(new THREE.BoxGeometry(0.16, 0.2, 0.9), M(0, 1.2, 0.18, -0.7, 0, 0), 0x2a3a35);
      P(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 8), M(0, 1.35, 0.3, -1.0, 0, 0), 0xc9a24a);
      P(new THREE.BoxGeometry(0.22, 0.4, 0.06), M(0, 0.22, 0.68), 0x6b4f3a);
    } else if (kind === 'dish') {
      P(new THREE.CylinderGeometry(0.07, 0.12, 1.1, 8), M(0, 0.55, 0), 0xcfc8b4);
      P(new THREE.CylinderGeometry(0.85, 0.22, 0.32, 18), M(0, 1.4, 0, -0.9, 0, 0), 0xf4f4ee);
      P(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5), M(0, 1.9, 0.4, -0.9, 0, 0), 0xcfc8b4);
      P(new THREE.SphereGeometry(0.1, 8, 6), M(0, 2.25, 0.62), hc);
    } else if (kind === 'pendulum') {
      for (const sx of [-0.7, 0.7]) P(new THREE.CylinderGeometry(0.05, 0.07, 1.9, 6), M(sx, 0.95, 0), 0x7a5a3a);
      P(new THREE.BoxGeometry(1.6, 0.09, 0.12), M(0, 1.9, 0), 0x7a5a3a);
      P(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 4), M(0.2, 1.25, 0, 0, 0, -0.3), 0xefe5c6);
      P(new THREE.SphereGeometry(0.2, 10, 8), M(0.42, 0.6, 0), 0xc9a24a);
      P(new THREE.SphereGeometry(0.2, 10, 8), M(-0.1, 0.2, 0.6), 0xe0483a);
    } else if (kind === 'magnet') {
      P(new THREE.TorusGeometry(0.5, 0.17, 8, 16, Math.PI), M(0, 0.62, 0), 0xb0b6b3);
      P(new THREE.CylinderGeometry(0.17, 0.17, 0.62, 10), M(-0.5, 0.31, 0), 0xe0483a);
      P(new THREE.CylinderGeometry(0.17, 0.17, 0.62, 10), M(0.5, 0.31, 0), 0x3a7be0);
      P(new THREE.CylinderGeometry(0.19, 0.19, 0.14, 10), M(-0.5, 0.07, 0), 0xcfd5d2);
      P(new THREE.CylinderGeometry(0.19, 0.19, 0.14, 10), M(0.5, 0.07, 0), 0xcfd5d2);
    } else if (kind === 'prism') {
      P(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 3), M(0, 0.62, 0, Math.PI / 2, 0, 0), 0xa8e6ff);
      [0xe0483a, 0xf2a03a, 0xf2e03a, 0x4fae60, 0x3a7be0, 0x8a5ae0].forEach((c, i) => P(new THREE.BoxGeometry(1.1, 0.045, 0.045), M(0.95, 0.45 + i * 0.045, 0.02 * i, 0, 0, -0.1 + i * 0.045), c));
      P(new THREE.BoxGeometry(0.9, 0.04, 0.04), M(-0.9, 0.6, 0), 0xfff3e6);
    } else { // tesla
      P(new THREE.CylinderGeometry(0.12, 0.28, 1.5, 10), M(0, 0.75, 0), 0xcfc8b4);
      P(new THREE.TorusGeometry(0.5, 0.11, 8, 18), M(0, 1.65, 0, Math.PI / 2, 0, 0), 0xd9d2bc);
      P(new THREE.SphereGeometry(0.25, 10, 8), M(0, 2.0, 0), hc);
      [[0.3, 1.1, 0.5], [-0.35, 1.4, 0.6], [0.1, 0.95, -0.7]].forEach(([x, y, r]) => P(new THREE.BoxGeometry(0.05, 0.5, 0.05), M(x, y, 0.1, 0, 0, r), 0xfff06a));
    }
  } else if (hall.id === 'chemistry') {
    if (kind === 'erlenmeyer') {
      P(new THREE.CylinderGeometry(0.2, 0.9, 1.2, 14), M(0, 0.6, 0), 0xcfeee8);
      P(new THREE.CylinderGeometry(0.2, 0.62, 0.55, 14), M(0, 0.28, 0), hc);
      P(new THREE.CylinderGeometry(0.2, 0.2, 0.75, 10), M(0, 1.55, 0), 0xcfeee8);
      P(new THREE.CylinderGeometry(0.2, 0.17, 0.2, 8), M(0, 2.0, 0), 0x8a5a3a);
      [[0.1, 2.35, 0.1], [-0.12, 2.7, 0], [0.08, 3.05, 0.05]].forEach(([x, y, z], i) => P(new THREE.IcosahedronGeometry(0.1 + 0.03 * i, 1), M(x, y, z), 0xfff3e6));
    } else if (kind === 'round') {
      P(new THREE.SphereGeometry(0.58, 14, 10), M(0, 1.05, 0), 0xcfeee8);
      P(new THREE.SphereGeometry(0.52, 12, 8, 0, TAU, Math.PI / 2, Math.PI / 2), M(0, 1.05, 0), hc);
      P(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 9), M(0, 1.85, 0), 0xcfeee8);
      P(new THREE.TorusGeometry(0.5, 0.035, 5, 16), M(0, 0.62, 0, Math.PI / 2, 0, 0), 0x8f8f88);
      for (let i = 0; i < 3; i++) P(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 5), M(Math.cos(i * 2.094) * 0.48, 0.3, Math.sin(i * 2.094) * 0.48, Math.sin(i * 2.094) * 0.35, 0, -Math.cos(i * 2.094) * 0.35), 0x8f8f88);
    } else if (kind === 'rack') {
      P(new THREE.BoxGeometry(1.7, 0.09, 0.55), M(0, 0.45, 0), 0x9a7048);
      P(new THREE.BoxGeometry(1.7, 0.09, 0.55), M(0, 1.05, 0), 0x9a7048);
      for (const sx of [-0.8, 0.8]) P(new THREE.BoxGeometry(0.09, 1.0, 0.5), M(sx, 0.5, 0), 0x7a5a3a);
      [0xf0955c, 0x4fae60, 0x3a9be0, 0xe05aa0, 0xf2d675].forEach((c, i) => {
        P(new THREE.CylinderGeometry(0.13, 0.13, 1.0, 9), M(-0.68 + i * 0.34, 0.95, 0), 0xcfeee8);
        P(new THREE.CylinderGeometry(0.1, 0.1, 0.45 + 0.05 * i, 9), M(-0.68 + i * 0.34, 0.72 + 0.025 * i, 0), c);
      });
    } else if (kind === 'crystal') {
      [[0, 0, 0, 0.55, 0], [0.55, 0.2, 0.3, 0.4, 0.3], [-0.5, 0.1, -0.2, 0.45, -0.35], [0.1, 0.1, 0.6, 0.3, 0.2]].forEach(([x, z, y2, s, tilt], i) =>
        P(new THREE.IcosahedronGeometry(0.4, 0), Ms(x, 0.5 + y2 * 0.3, z, s * 0.9, s * 3.0, s * 0.9, 0, i, tilt), [0xb48cff, 0x7fe0ff, 0xff9fd0, 0xf0955c][i]));
    } else if (kind === 'chimney') {
      P(new THREE.CylinderGeometry(0.3, 0.42, 2.3, 10), M(0, 1.15, 0), 0xb8785a);
      for (const y of [0.6, 1.3, 1.9]) P(new THREE.TorusGeometry(0.34 - y * 0.03, 0.04, 5, 14), M(0, y, 0, Math.PI / 2, 0, 0), 0x6b4f3a);
      P(new THREE.CylinderGeometry(0.38, 0.3, 0.18, 10), M(0, 2.35, 0), 0x6b4f3a);
      [[0, 2.7, 0, 0.24], [0.14, 3.05, 0.05, 0.32], [-0.08, 3.45, 0, 0.4]].forEach(([x, y, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), M(x, y, z), 0xe2dfdb));
    } else { // bunsen
      P(new THREE.CylinderGeometry(0.38, 0.45, 0.16, 12), M(0, 0.08, 0), 0x8f8f88);
      P(new THREE.CylinderGeometry(0.1, 0.12, 1.0, 9), M(0, 0.65, 0), 0xbfc7c4);
      P(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 9), M(0, 0.4, 0), 0x6b4f3a);
      P(new THREE.ConeGeometry(0.17, 0.6, 9), M(0, 1.45, 0), 0xf26b3a);
      P(new THREE.ConeGeometry(0.1, 0.38, 8), M(0, 1.4, 0), 0xffd34a);
    }
  } else { // earth
    if (kind === 'volcano') {
      P(new THREE.CylinderGeometry(1.95, 2.1, 0.12, 16), M(0, 0.06, 0), 0x4a3a33);
      P(new THREE.CylinderGeometry(0.4, 1.5, 1.6, 14), M(0, 0.9, 0), 0x6e5546);
      P(new THREE.CylinderGeometry(0.34, 0.7, 0.5, 14), M(0, 1.45, 0), 0x5a4438);
      P(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 14), M(0, 1.7, 0), 0xff7a2e);
      P(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14), M(0, 1.74, 0), 0xffc15a);
      for (let i = 0; i < 3; i++) {
        const az = i * 2.2 + 0.4;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -az, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.62)));
        parts.push({ g: new THREE.BoxGeometry(1.15, 0.05, 0.16 + 0.05 * i), m: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(az) * 0.95, 0.88, Math.sin(az) * 0.95), q, new THREE.Vector3(1, 1, 1)), color: new THREE.Color(0xff6a2a) });
      }
      [[0, 2.05, 0, 0.26], [0.16, 2.45, 0.05, 0.34], [-0.1, 2.9, 0, 0.42]].forEach(([x, y, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), M(x, y, z), 0xd8d4d0));
    } else if (kind === 'mountain') {
      P(new THREE.ConeGeometry(1.35, 2.0, 8), M(0, 1.0, 0), 0x8f7358);
      P(new THREE.ConeGeometry(0.95, 1.4, 7), M(0.8, 0.7, 0.45), 0x9a7e62);
      P(new THREE.ConeGeometry(0.85, 1.2, 7), M(-0.7, 0.6, -0.35), 0x85694e);
      P(new THREE.ConeGeometry(0.62, 0.9, 8), M(0, 1.6, 0), 0xf5f8fa);
      P(new THREE.ConeGeometry(0.4, 0.55, 7), M(0.8, 1.15, 0.45), 0xf5f8fa);
      [[1.3, -0.5, 0.3], [-1.1, 0.8, 0.25]].forEach(([x, z, s]) => P(new THREE.DodecahedronGeometry(s, 0), M(x, s * 0.7, z), 0x9a9a92));
    } else if (kind === 'strata') {
      const cols = [0x9c7a54, 0xc29a67, 0x8a6a48, 0xd0b080, 0x7a5c40, 0xb88f5e, 0xcfa86e];
      cols.forEach((c, i) => P(new THREE.CylinderGeometry(0.85 - i * 0.05 + 0.04, 0.9 - i * 0.05, 0.3, 12), M(0.03 * (i % 3), 0.15 + i * 0.3, 0.02 * (i % 2)), c));
      P(new THREE.IcosahedronGeometry(0.4, 1), Ms(0, 2.25, 0, 1.2, 0.5, 1.0), 0x66c274);
    } else if (kind === 'boulders') {
      [[0, 0, 0.55], [0.8, 0.3, 0.38], [-0.6, 0.5, 0.3], [0.2, -0.7, 0.28]].forEach(([x, z, s], i) => P(new THREE.DodecahedronGeometry(s, 0), Ms(x, s * 0.7, z, 1, 0.8, 1, i, i * 2, 0), i % 2 ? 0x9a9a92 : 0xb0a898));
    } else { // weather station
      P(new THREE.CylinderGeometry(0.05, 0.07, 1.9, 6), M(0, 0.95, 0), 0xf4f4ee);
      P(new THREE.BoxGeometry(0.8, 0.05, 0.05), M(0, 1.95, 0), 0xcfc8b4);
      P(new THREE.BoxGeometry(0.05, 0.05, 0.8), M(0, 1.95, 0), 0xcfc8b4);
      for (const [x, z] of [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]]) P(new THREE.SphereGeometry(0.1, 8, 6, 0, TAU, 0, Math.PI), M(x, 1.95, z), 0xe0483a);
      P(new THREE.BoxGeometry(0.62, 0.5, 0.5), M(0.65, 0.35, 0), 0xf4f4ee);
      P(new THREE.BoxGeometry(0.66, 0.06, 0.54), M(0.65, 0.63, 0), hc);
    }
  }
  return parts;
}
const PROP_KINDS = {
  physics: [['dome', 2], ['dish', 2], ['pendulum', 2], ['magnet', 2], ['prism', 2], ['tesla', 2], ['broad', 2], ['bush', 3], ['pine', 1]],
  chemistry: [['erlenmeyer', 3], ['round', 2], ['rack', 2], ['crystal', 3], ['chimney', 1], ['bunsen', 2], ['bush', 2], ['broad', 1]],
  earth: [['volcano', 1], ['mountain', 3], ['strata', 2], ['boulders', 3], ['weather', 1], ['pine', 3]],
  biology: [['broad', 4], ['pine', 3], ['sakura', 2], ['bush', 2], ['mushroom', 2]],
};
const TREE_KINDS = new Set(['broad', 'pine', 'sakura', 'bush']);
const HERO_KIND = { physics: 'tesla', chemistry: 'erlenmeyer', earth: 'volcano', biology: 'broad' }; // 每館先放兩個大一點的代表物
function pickKind(hallId, x) {
  const list = PROP_KINDS[hallId], total = list.reduce((a, b) => a + b[1], 0);
  let t = x * total;
  for (const [k, w] of list) { if ((t -= w) < 0) return k; }
  return list[0][0];
}

// ---------- 地形：球外與地標共用 ----------
function makeTerrain(hallDirs) {
  const ctx = { roads: null, nodes: null };
  let lastIdx = 0;
  const arcTo = (d, pts) => { // 到折線的最短弧長（先每隔幾點粗找，再細找）
    let bi = 0, bd = -2;
    for (let k = 0; k < pts.length; k += 6) { const p = pts[k]; const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bd) { bd = dd; bi = k; } }
    let bk = bi;
    for (let k = Math.max(0, bi - 6); k <= Math.min(pts.length - 1, bi + 6); k++) { const p = pts[k]; const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bd) { bd = dd; bk = k; } }
    lastIdx = bk;
    return R * Math.acos(clamp(bd, -1, 1));
  };
  function terrain(d) {
    let n = fbm(d.x * 1.8 + 4.2, d.y * 1.8 + 1.7, d.z * 1.8 + 9.1);
    let best = -1, bestDot = -2;
    hallDirs.forEach((hd, i) => {
      const dd = d.dot(hd);
      if (dd > bestDot) { bestDot = dd; best = i; }
    });
    const mask = smooth(0.5, 0.78, bestDot); // 館的區域：整塊都是陸地，館與館之間才有海
    n += mask * 0.55;
    let e = n > 0.5 ? 0.1 + 1.0 * Math.pow(smooth(0.72, 1.3, n), 1.4) : 0; // 丘陵起伏
    let rd = 99, nd = 99, pd = 99, ri = 0;
    if (ctx.roads && mask > 0.05) {
      pd = R * Math.acos(clamp(bestDot, -1, 1));
      rd = arcTo(d, ctx.roads[best]); ri = lastIdx;
      let bn = -2;
      for (const p of ctx.nodes[best]) { const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bn) bn = dd; }
      nd = R * Math.acos(clamp(bn, -1, 1));
      if (n > 0.5) { // 廣場、道路、單元站周圍壓平
        const flat = Math.max(1 - smooth(1.9, 3.0, pd), 1 - smooth(1.2, 2.6, rd), 1 - smooth(1.4, 2.8, nd));
        e = lerp(e, E_FLAT, flat);
      }
    }
    return { n, e, hall: best, mask, rd, nd, pd, ri };
  }
  terrain.ctx = ctx;
  return terrain;
}

// ---------- 路徑：球面與平面地圖共用同一條曲線 ----------
const SPHERE_S = 0.82; // 地圖座標 → 球面弧長的縮放
function curveFor(vertical, N) {
  const waves = clamp(N / 3.4, 1.6, 3.4);
  return t => vertical
    ? { x: 3.2 * Math.sin(t * Math.PI * waves), z: (t - 0.5) * 2 * 7.6 }
    : { x: (t - 0.5) * 2 * 8.6, z: 3.0 * Math.sin(t * Math.PI * waves) };
}
// 地圖上 (x,z)（x 往右、z 往螢幕下方）→ 這一館中心附近的球面方向
function expDir(b, p, S) {
  const vx = p.x * S, vz = p.z * S;
  const tan = b.E.clone().multiplyScalar(vx).addScaledVector(b.Np, -vz);
  const len = tan.length();
  if (len < 1e-6) return b.n.clone();
  const a = len / R;
  return b.n.clone().multiplyScalar(Math.cos(a)).addScaledVector(tan, Math.sin(a) / len).normalize();
}

// ---------- 場景 ----------
export async function createScene({ canvas, halls, scientists = {}, reducedMotion, quality, debugEl, handlers }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dprCap = quality === 'low' ? 1 : quality === 'mid' ? 1.5 : 2;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
  const PR_STEPS = [2, 1.5, 1.25, 1];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.4, 900);

  const gradient = makeGradient();
  const toonMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  const hullMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  const planetMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, transparent: true });
  const planetHullMat = new THREE.MeshBasicMaterial({ color: 0x0f3333, side: THREE.BackSide, transparent: true }); // 星球外框用深青，和大氣光暈接得起來
  const hiddenMat = new THREE.MeshBasicMaterial({ visible: false });

  scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x20322b, 1.35));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
  sun.position.set(-16, 22, 30);
  scene.add(sun);

  // 星星：三層大小、帶一點顏色；整組跟著鏡頭移動（像很遠的天空），不跟著星球轉
  const starGroup = new THREE.Group();
  scene.add(starGroup);
  const starMats = [];
  {
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const sx = sc.getContext('2d');
    const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,0.9)');
    gr.addColorStop(0.55, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    const starTex = new THREE.CanvasTexture(sc);
    const tints = [0xf6f3ea, 0xfff1c9, 0xc9f4ff, 0xffd6e4];
    const c = new THREE.Color();
    [[1100, 1.6, 0.8], [300, 2.8, 0.9], [70, 4.6, 1]].forEach(([n, size, op]) => {
      const arr = new Float32Array(n * 3), ca = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1), r = 330 + Math.random() * 120;
        arr[i * 3] = r * Math.sin(v) * Math.cos(u);
        arr[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
        arr[i * 3 + 2] = r * Math.cos(v);
        c.set(tints[i % 4]).multiplyScalar(0.65 + 0.35 * Math.random());
        ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
      const mat = new THREE.PointsMaterial({ size, map: starTex, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, fog: false });
      mat.userData.base = op;
      mat.userData.tw = 1;
      starMats.push(mat);
      const pts = new THREE.Points(g, mat);
      pts.frustumCulled = false;
      starGroup.add(pts);
    });
  }
  scene.fog = new THREE.Fog(0xd2efe6, 900, 1800); // 只有走在地面上時才拉近（遠景淡淡的霧）

  // 四座館的方向：正四面體頂點
  const hallDirs = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => new THREE.Vector3(...v).normalize());
  const terrain = makeTerrain(hallDirs);
  const N0 = new THREE.Vector3(0, 1, 0);
  function basisOf(n) {
    const Np = N0.clone().sub(n.clone().multiplyScalar(N0.dot(n))).normalize();
    const E = new THREE.Vector3().crossVectors(Np, n);
    return { n, Np, E };
  }
  const bases = hallDirs.map(basisOf);

  // ----- 沿路與單元站在球面上的位置（球外看得到的路，和進館後的平面地圖是同一條） -----
  const hallNodes = [], hallRoad = [];
  halls.forEach((hall, hi) => {
    const N = hall.units.length, curve = curveFor(true, N), b = bases[hi];
    hallNodes.push(hall.units.map((u, i) => expDir(b, curve(N === 1 ? 0.5 : i / (N - 1)), SPHERE_S)));
    const pts = [];
    for (let s = 0; s <= 240; s++) pts.push(expDir(b, curve(-0.04 + (1.08 * s) / 240), SPHERE_S));
    hallRoad.push(pts);
  });

  terrain.ctx.roads = hallRoad; terrain.ctx.nodes = hallNodes;

  // ----- 地面配色：星球和館內平面地圖共用同一套 -----
  const groundColor = (() => {
    const tc3 = new THREE.Color();
    const hallCol = halls.map(h => new THREE.Color(h.color));
    // 每館四種相近的色調，用低頻雜訊分成一塊一塊的田野
    const tones = hallCol.map((c, i) => {
      const hsl = {}; c.getHSL(hsl);
      if (halls[i].id === 'earth') hsl.l = Math.min(0.8, hsl.l + 0.05);
      const mk = (dh, ds, dl) => new THREE.Color().setHSL((hsl.h + dh + 1) % 1, clamp(hsl.s + ds, 0, 1), clamp(hsl.l + dl, 0, 1));
      return [mk(0, 0, 0), mk(0.012, 0.03, -0.075), mk(-0.01, -0.05, 0.075), mk(0.035, -0.12, -0.035)];
    });
    const ROCK = hallCol.map(c => c.clone().lerp(new THREE.Color(0xa89f8e), 0.55)), SNOW = new THREE.Color(0xf6f8f4);
    const ACCENT_HEX = { physics: [0xf6b088, 0xfff6e0, 0xe8c65a], chemistry: [0xfde047, 0xfff6e0, 0xb48cff], earth: [0xf5f8fa, 0xc9d3dc, 0x7bc47a], biology: [0xf7a8c4, 0xfff6e0, 0xfde047] };
    const ACC = halls.map(h => (ACCENT_HEX[h.id] || ACCENT_HEX.biology).map(x => new THREE.Color(x)));
    const DEEP = new THREE.Color(0x0f4a66), SHALLOW = new THREE.Color(0x2c93b4), FOAM = new THREE.Color(0xa6e6ea), GLINT = new THREE.Color(0x6fc6dc), SAND = new THREE.Color(0xf0e2b0);
    const ROADB = new THREE.Color(0xd8cdb0), EDGE = new THREE.Color(0xffffff), DASH = new THREE.Color(0xf2c94c), PLAZA = new THREE.Color(0xe9e2cf), ROAD = new THREE.Color(0xeee3c6), NODE_C = hallCol.map(c => c.clone().multiplyScalar(0.55));
    const roadHalf = 0.9, nodeR = 1.1; // 單位：球面弧長
    const out = [0, 0, 0, 0.9];
    // tr：terrain() 的結果；x,y,z：球面方向；v：這片磚的編號（只拿來做雜訊）。回傳 [r,g,b（0～255）, 邊角暗度]
    return (tr, x, y, z, v) => {
      let c, bevel = 0.9; // bevel：六角磚邊角比中心暗一點，近看才看得出一片一片
      if (tr.n <= 0.5) {
        bevel = 0.97;
        c = tc3.copy(DEEP).lerp(SHALLOW, smooth(0.16, 0.5, tr.n));
        if (tr.n > 0.474) c.lerp(FOAM, 0.75);                                     // 岸邊浪花
        else if (hash3(v * 0.21, 4.1, 1.3) < 0.035) c.lerp(GLINT, 0.6);           // 水面反光
      } else if (tr.n < 0.56) c = SAND;
      else {
        const hh = tr.hall, tn = tones[hh];
        const pn = vnoise(x * 6.5 + hh * 3.1, y * 6.5 + 1.3, z * 6.5 + 7.7) + 0.22 * (vnoise(x * 21 + 5, y * 21, z * 21 + 2) - 0.5);
        c = tc3.copy(tn[pn < 0.36 ? 1 : pn < 0.6 ? 0 : pn < 0.78 ? 2 : 3]);
        if (tr.e > 0.62) c.lerp(ROCK[hh], 0.7 * smooth(0.62, 0.95, tr.e));       // 山坡露出岩石
        if (tr.e > 0.98) c.lerp(SNOW, smooth(0.98, 1.08, tr.e));                  // 山頂積雪
        if (tr.n < 0.6) c.lerp(SAND, 0.35);                                       // 靠海邊偏沙色
        if (tr.nd < nodeR) { c = NODE_C[hh]; bevel = 0.96; }
        else if (tr.rd < roadHalf) {
          bevel = 0.97;
          if (tr.rd > 0.72) c = EDGE;                                               // 路邊白線
          else if (tr.rd < 0.12 && Math.floor(tr.ri / 8) % 2 === 0) c = DASH;       // 中央黃色虛線
          else c = ((v * 2654435761) >>> 0) % 5 < 2 ? ROADB : ROAD;                  // 路面磁磚
        }
        else if (tr.pd < 1.9) { c = PLAZA; bevel = 0.95; }
        else if (tr.e < 0.9 && hash3(v * 0.73, 2.2, 5.9) < 0.022) c = ACC[hh][Math.floor(hash3(v * 0.31, 9.1, 0.4) * 3) % 3]; // 小花、小石
      }
      const jit = 0.95 + 0.1 * hash3(v * 0.37, 3.1, 0.7);
      out[0] = Math.min(255, Math.round(c.r * jit * 255));
      out[1] = Math.min(255, Math.round(c.g * jit * 255));
      out[2] = Math.min(255, Math.round(c.b * jit * 255));
      out[3] = bevel;
      return out;
    };
  })();

  // ----- 星球本體：六角形磚塊（預設約 10 萬片；?hex=NN 可調，NN 為頻率，磚數≈10×NN²） -----
  const planet = new THREE.Group();
  scene.add(planet);
  const planetMeshes = [];
  const HEXF = clamp(parseInt(new URLSearchParams(location.search).get('hex') || '120', 10) || 120, 16, 160);
  let cellCount = 0;
  {
    // 1) 細分正二十面體，取得所有頂點（每個頂點＝一片磚的中心）與三角形
    const T = (1 + Math.sqrt(5)) / 2;
    const bv = [[-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0], [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T], [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1]]
      .map(v => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; });
    const bf = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const f = HEXF;
    const vx = [], vy = [], vz = [];
    const keyMap = new Map();
    const addV = (x, y, z) => {
      const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      const key = ((Math.round(x * 20000) + 20000) * 40001 + (Math.round(y * 20000) + 20000)) * 40001 + (Math.round(z * 20000) + 20000);
      let id = keyMap.get(key);
      if (id === undefined) { id = vx.length; keyMap.set(key, id); vx.push(x); vy.push(y); vz.push(z); }
      return id;
    };
    const tri = new Uint32Array(20 * f * f * 3);
    let tc = 0;
    for (const [ia, ib, ic] of bf) {
      const a = bv[ia], b = bv[ib], c = bv[ic];
      const rows = [];
      for (let i = 0; i <= f; i++) {
        const row = [];
        for (let j = 0; j <= f - i; j++) {
          const u = i / f, v = j / f;
          row.push(addV(a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v));
        }
        rows.push(row);
      }
      for (let i = 0; i < f; i++) {
        for (let j = 0; j < f - i; j++) {
          tri[tc++] = rows[i][j]; tri[tc++] = rows[i + 1][j]; tri[tc++] = rows[i][j + 1];
          if (j < f - i - 1) { tri[tc++] = rows[i + 1][j]; tri[tc++] = rows[i + 1][j + 1]; tri[tc++] = rows[i][j + 1]; }
        }
      }
    }
    const nv = vx.length, nt = tc / 3;
    cellCount = nv;
    // 2) 每個三角形的重心＝六角形的角；角的高度各自由地形算出，三片磚共用同一個角，所以不會有縫
    const cx = new Float32Array(nt), cy = new Float32Array(nt), cz = new Float32Array(nt), ce = new Float32Array(nt);
    const tmp = new THREE.Vector3();
    for (let t = 0; t < nt; t++) {
      let x = vx[tri[t * 3]] + vx[tri[t * 3 + 1]] + vx[tri[t * 3 + 2]];
      let y = vy[tri[t * 3]] + vy[tri[t * 3 + 1]] + vy[tri[t * 3 + 2]];
      let z = vz[tri[t * 3]] + vz[tri[t * 3 + 1]] + vz[tri[t * 3 + 2]];
      const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      cx[t] = x; cy[t] = y; cz[t] = z;
      ce[t] = terrain(tmp.set(x, y, z)).e;
    }
    // 每個頂點周圍的三角形
    const cnt = new Uint32Array(nv + 1);
    for (let i = 0; i < tc; i++) cnt[tri[i] + 1]++;
    for (let i = 0; i < nv; i++) cnt[i + 1] += cnt[i];
    const fill = cnt.slice(0, nv);
    const adj = new Uint32Array(tc);
    for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) { const v = tri[t * 3 + k]; adj[fill[v]++] = t; }

    // 4) 組出六角形網格：每片 7 個頂點（中心＋6 角）、6 個三角形
    const pos = new Float32Array(nv * 7 * 3);
    const col = new Uint8Array(nv * 7 * 3);
    const index = new Uint32Array(nv * 18);
    const ring = [], ang = [];
    const dv = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), helper = new THREE.Vector3();
    for (let v = 0; v < nv; v++) {
      const x = vx[v], y = vy[v], z = vz[v];
      dv.set(x, y, z);
      const tr = terrain(dv);
      // 局部座標軸，用來把角依逆時針（從外面看）排好
      helper.set(Math.abs(y) < 0.9 ? 0 : 1, Math.abs(y) < 0.9 ? 1 : 0, 0);
      t1.crossVectors(helper, dv).normalize();
      t2.crossVectors(dv, t1);
      ring.length = 0; ang.length = 0;
      for (let q = cnt[v]; q < cnt[v + 1]; q++) {
        const t = adj[q];
        ring.push(t);
        ang.push(Math.atan2((cx[t] - x) * t2.x + (cy[t] - y) * t2.y + (cz[t] - z) * t2.z, (cx[t] - x) * t1.x + (cy[t] - y) * t1.y + (cz[t] - z) * t1.z));
      }
      for (let a = 1; a < ring.length; a++) { // 插入排序（最多 6 個）
        const r0 = ring[a], a0 = ang[a]; let b = a - 1;
        while (b >= 0 && ang[b] > a0) { ring[b + 1] = ring[b]; ang[b + 1] = ang[b]; b--; }
        ring[b + 1] = r0; ang[b + 1] = a0;
      }
      // 顏色（和館內平面地圖共用 groundColor）
      const gcol = groundColor(tr, x, y, z, v);
      const r8 = gcol[0], g8 = gcol[1], b8 = gcol[2], bevel = gcol[3];
      const base = v * 7;
      const rc = R + tr.e;
      pos[base * 3] = x * rc; pos[base * 3 + 1] = y * rc; pos[base * 3 + 2] = z * rc;
      for (let k = 0; k < 6; k++) {
        const t = ring[Math.min(k, ring.length - 1)];
        const rr = R + ce[t], o = (base + 1 + k) * 3;
        pos[o] = cx[t] * rr; pos[o + 1] = cy[t] * rr; pos[o + 2] = cz[t] * rr;
      }
      col[base * 3] = r8; col[base * 3 + 1] = g8; col[base * 3 + 2] = b8;
      const rb = Math.round(r8 * bevel), gb8 = Math.round(g8 * bevel), bb = Math.round(b8 * bevel);
      for (let k = 1; k < 7; k++) { const o = (base + k) * 3; col[o] = rb; col[o + 1] = gb8; col[o + 2] = bb; }
      for (let k = 0; k < 6; k++) {
        const o = v * 18 + k * 3;
        index[o] = base; index[o + 1] = base + 1 + k; index[o + 2] = base + 1 + ((k + 1) % 6);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, planetMat);
    body.frustumCulled = false;
    // 外框：一顆稍大的暗色球（只描出輪廓，不吃三角形）
    const outline = new THREE.Mesh(new THREE.IcosahedronGeometry(R + 0.3, 5), planetHullMat);
    planet.add(body, outline);
    planetMeshes.push(body, outline);
  }

  // ----- 大氣：一層厚厚的殼（半徑 1.62R，比雲高很多）。亮度看「視線離球心多近」來算：
  //   視線穿過星球的地方：中央一層淡淡的薄霧，越靠近邊緣越亮；
  //   視線擦過星球外面的地方：從地表往外慢慢變淡，雲和造景都在光暈裡面。
  const atmoU = { uStrength: { value: 1 }, uR: { value: R + 0.25 }, uRs: { value: R * 1.62 } };
  const atmoOuter = new THREE.Mesh(new THREE.SphereGeometry(R * 1.62, 96, 48), new THREE.ShaderMaterial({
    uniforms: atmoU,
    vertexShader: `varying vec3 vP; varying vec3 vC;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; vC = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uStrength; uniform float uR; uniform float uRs; varying vec3 vP; varying vec3 vC;
      void main() {
        vec3 d = normalize(vP);
        float b = length(vC - d * dot(vC, d));
        vec3 cIn = vec3(0.46, 0.86, 0.92), cMid = vec3(0.30, 0.70, 0.80), cOut = vec3(0.06, 0.30, 0.40);
        float i; vec3 col;
        if (b < uR) {
          float q = b / uR;
          i = 0.022 + 0.15 * pow(q, 6.0);
          col = mix(cMid, cIn, q * q);
        } else {
          float h = clamp((b - uR) / (uRs - uR), 0.0, 1.0);
          i = 0.172 * pow(1.0 - h, 1.6);
          col = mix(cIn, cOut, sqrt(h));
        }
        vec3 o = col * i * uStrength;
        // 只「加亮」、不蓋住背景：alpha 用亮度（預乘透明），背景的星雲還看得到
        gl_FragColor = vec4(o, max(o.r, max(o.g, o.b)));
        #include <colorspace_fragment>
      }`,
    side: THREE.FrontSide, transparent: true, depthWrite: false, ...GLOW_BLEND_A,
  }));
  atmoOuter.renderOrder = 5;
  scene.add(atmoOuter);

  // ----- 走在地面上時的天空（從地平線的淺青到頭頂的深青） -----
  const skyU = { uTop: { value: new THREE.Color(0x3d8f97) }, uHor: { value: new THREE.Color(0xd2efe6) }, uUp: { value: new THREE.Vector3(0, 0, 1) }, uAlpha: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU,
    vertexShader: `varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uUp; uniform float uAlpha; varying vec3 vD;
      void main() {
        float h = dot(normalize(vD), uUp);
        gl_FragColor = vec4(mix(uHor, uTop, smoothstep(-0.05, 0.45, h)), uAlpha);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false,
  }));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  sky.visible = false;
  scene.add(sky);
  let starFade = 1;


  // ----- 雲：小朵、成串，壓扁貼著星球，會慢慢飄 -----
  const clouds = new THREE.Group();
  planet.add(clouds);
  {
    const blobs = [];
    const dir = new THREE.Vector3();
    let guard = 0;
    while (blobs.length < 120 && guard++ < 1500) {
      dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      if (hallDirs.some(h => dir.dot(h) > 0.965)) continue; // 不要一開始就蓋在雕像上
      const centre = dir.clone().multiplyScalar(R + 2.7 + Math.random() * 0.8);
      const tangent = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0.3, 1, 0.2)).normalize();
      const side = new THREE.Vector3().crossVectors(dir, tangent);
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count && blobs.length < 120; i++) {
        const mid = 1 - Math.abs(i - (count - 1) / 2) / count;
        blobs.push({
          p: centre.clone().addScaledVector(tangent, (i - (count - 1) / 2) * 0.62).addScaledVector(side, (Math.random() - 0.5) * 0.45).addScaledVector(dir, mid * 0.2),
          s: (0.3 + Math.random() * 0.22) * (0.7 + 0.55 * mid),
          dir: dir.clone(),
        });
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient }), blobs.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    blobs.forEach((bb, i) => {
      q.setFromUnitVectors(up, bb.dir);
      sc.set(bb.s * 1.35, bb.s * 0.78, bb.s * 1.1);
      m.compose(bb.p, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    clouds.add(mesh);
  }

  // ----- 球外的單元地標（只看不能點）：站在路上的每一站，立著用封面做的小牌子 -----
  const landmarks = new THREE.Group();
  planet.add(landmarks);
  const signs = new Map(); // unitId -> [{sprite, h, ex}]
  const signSprites = [];
  const propRecs = [];   // 星球上的造景：方向、種類、大小、轉角（館內地圖照樣擺一份）
  const detailRecs = []; // 星球上的草叢、小石、小花
  let detailGeo = null;
  function addSign(unitId, sprite, h, ex) {
    let a = signs.get(unitId);
    if (!a) { a = []; signs.set(unitId, a); }
    a.push({ sprite, h, ex });
  }
  halls.forEach((hall, hi) => {
    const col = new THREE.Color(hall.color);
    const { n, Np, E } = bases[hi];
    const parts = [];
    const up = new THREE.Vector3(0, 1, 0);
    hall.units.forEach((u, i) => {
      const dir = hallNodes[hi][i];
      const rad = R + terrain(dir).e - 0.05;
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const base = new THREE.Matrix4().compose(dir.clone().multiplyScalar(rad), q, new THREE.Vector3(1, 1, 1));
      parts.push({ g: new THREE.CylinderGeometry(0.42, 0.5, 0.16, 10), m: base.clone().multiply(M(0, 0.08, 0)), color: col.clone() });
      parts.push({ g: new THREE.CylinderGeometry(0.07, 0.09, 1.3, 6), m: base.clone().multiply(M(0, 0.8, 0)), color: new THREE.Color(0xcfc8b4) });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(u.emoji), transparent: true, depthWrite: false }));
      sp.position.copy(dir).multiplyScalar(rad + 1.95);
      sp.scale.set(1.1, 1.1, 1);
      sp.userData = { hallId: hall.id, unitId: u.id };
      signSprites.push(sp);
      landmarks.add(sp);
      addSign(u.id, sp, 1.1, null);
    });
    // 特色小景：散在館的區域，避開路、站與廣場
    const placed = [], tan = new THREE.Vector3(), dd = new THREE.Vector3();
    for (let tries = 0; placed.length < PROP_COUNT && tries < 6000; tries++) {
      const a = hash3(hi * 9.1, tries * 1.37, 2.2) * TAU, r = 0.22 + 0.7 * Math.sqrt(hash3(hi * 3.3, tries * 0.71, 5.5));
      tan.copy(E).multiplyScalar(Math.cos(a)).addScaledVector(Np, Math.sin(a));
      dd.copy(n).multiplyScalar(Math.cos(r)).addScaledVector(tan, Math.sin(r)).normalize();
      const t = terrain(dd);
      if (t.hall !== hi || t.mask < 0.55 || t.n < 0.62 || t.rd < 2.8 || t.nd < 3.0 || t.pd < 3.6) continue;
      if (placed.some(pp => pp.dot(dd) > Math.cos(1.2 / R))) continue;
      placed.push(dd.clone());
      const q = new THREE.Quaternion().setFromUnitVectors(up, dd).multiply(new THREE.Quaternion().setFromAxisAngle(up, hash3(tries, hi, 1.1) * TAU));
      const hero = placed.length <= 2;
      const kind = hero ? HERO_KIND[hall.id] : pickKind(hall.id, hash3(tries * 0.7, hi, 8.8));
      const big = (kind === 'volcano' || kind === 'mountain') ? 0.72 : 0.5;
      const sc = hero ? 1.05 : big + 0.32 * hash3(tries, hi, 4.4);
      propRecs.push({ dd: dd.clone(), kind, sc, ang: hash3(tries, hi, 1.1) * TAU, tries, hi, e: t.e, rd: t.rd, nd: t.nd });
      const bm = new THREE.Matrix4().compose(dd.clone().multiplyScalar(R + t.e - 0.05), q, new THREE.Vector3(sc, sc, sc));
      for (const pt of propParts(hall, kind, k => hash3(tries * 1.9 + k, hi * 2.3, 6.1))) { pt.m = bm.clone().multiply(pt.m); parts.push(pt); }
    }
    const mg = buildMerged(parts, 0.05);
    landmarks.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
  });

  // ----- 地面細節：草叢、小花、小石頭（InstancedMesh：一種形狀一次畫完，近看地面才不會空空的） -----
  {
    const DETAIL = {
      physics: { tuft: 2400, pebble: 700, flower: 0.14, grass: [0x8aa64a, 0x9bb85a, 0x7c9a40], bloom: [0xfff6e0, 0xf6b088, 0xfde68a], rock: [0xb8ad94, 0xcfc4a8] },
      chemistry: { tuft: 1500, pebble: 1500, flower: 0.18, grass: [0x8f9a52, 0xa0a060, 0x7f8a48], bloom: [0xfde047, 0xfff6e0], rock: [0xb48cff, 0x7fe0ff, 0xc98a6a, 0xd8b4a0] },
      earth: { tuft: 1500, pebble: 2000, flower: 0.12, grass: [0x6f9a6a, 0x5f8a62, 0x7fa874], bloom: [0xf5f8fa, 0xc9f4ff], rock: [0x9a9a92, 0xb0a898, 0x8a8f96, 0xc9c4bb] },
      biology: { tuft: 3200, pebble: 500, flower: 0.38, grass: [0x3f9a4d, 0x4fae60, 0x66c274, 0x37893f], bloom: [0xf7a8c4, 0xfff6e0, 0xfde047, 0xf59ab8], rock: [0x9a9a92, 0xb0a898] },
    };
    const white = new THREE.Color(0xffffff);
    const tuftG = buildMerged([
      { g: new THREE.ConeGeometry(0.055, 0.34, 4, 1, true), m: M(0, 0.17, 0), color: white },
      { g: new THREE.ConeGeometry(0.05, 0.3, 4, 1, true), m: M(0.06, 0.14, 0.02, 0, 0, -0.4), color: white },
      { g: new THREE.ConeGeometry(0.05, 0.28, 4, 1, true), m: M(-0.05, 0.13, 0.03, 0.35, 0, 0.35), color: white },
    ], 0).body;
    const pebbleG = new THREE.IcosahedronGeometry(0.11, 0);
    const bloomG = new THREE.IcosahedronGeometry(0.05, 0);
    const detailMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient });
    detailGeo = { tuft: tuftG, pebble: pebbleG, bloom: bloomG, mat: detailMat };
    const lists = { tuft: [], pebble: [], bloom: [] };
    const up = new THREE.Vector3(0, 1, 0), dd = new THREE.Vector3(), tan = new THREE.Vector3(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const q = new THREE.Quaternion(), qs = new THREE.Quaternion(), mtx = new THREE.Matrix4();
    halls.forEach((hall, hi) => {
      const spec = DETAIL[hall.id] || DETAIL.biology;
      const { n, Np, E } = bases[hi];
      for (const kind of ['tuft', 'pebble']) {
        const want = spec[kind], salt = kind === 'tuft' ? 0 : 50;
        let got = 0;
        for (let tries = 0; got < want && tries < want * 4; tries++) {
          const a = hash3(hi * 5.3 + salt, tries * 0.917, 3.3) * TAU, r = 0.05 + 0.95 * Math.sqrt(hash3(hi * 1.7, tries * 1.311 + salt, 8.1));
          tan.copy(E).multiplyScalar(Math.cos(a)).addScaledVector(Np, Math.sin(a));
          dd.copy(n).multiplyScalar(Math.cos(r)).addScaledVector(tan, Math.sin(r)).normalize();
          const t = terrain(dd);
          if (t.hall !== hi || t.n < 0.57 || t.mask < 0.3 || t.rd < 1.05 || t.nd < 1.35 || t.pd < 2.15) continue;
          if (kind === 'tuft' && t.e > 0.95) continue; // 山頂積雪處不長草
          got++;
          const h3 = hash3(tries * 0.37, hi + 2.2, kind === 'tuft' ? 1.9 : 4.7);
          q.setFromUnitVectors(up, dd).multiply(qs.setFromAxisAngle(up, h3 * TAU));
          const sz = kind === 'tuft' ? 0.75 + 0.7 * h3 : 0.6 + 1.0 * h3;
          pv.copy(dd).multiplyScalar(R + t.e - (kind === 'tuft' ? 0.03 : 0.04));
          sv.set(sz, kind === 'tuft' ? sz : sz * 0.62, sz);
          mtx.compose(pv, q, sv);
          const pal = kind === 'tuft' ? spec.grass : spec.rock;
          const colr = pal[Math.floor(h3 * 997) % pal.length];
          lists[kind].push(mtx.clone(), colr);
          detailRecs.push({ dd: dd.clone(), kind, sz, ang: h3 * TAU, e: t.e, color: colr });
          if (kind === 'tuft' && hash3(tries * 0.53, hi, 6.6) < spec.flower) {
            pv.copy(dd).multiplyScalar(R + t.e + 0.29 * sz);
            mtx.compose(pv, q, sv.set(sz, sz, sz));
            const bc = spec.bloom[Math.floor(hash3(tries, hi, 2.7) * 997) % spec.bloom.length];
            lists.bloom.push(mtx.clone(), bc);
            detailRecs.push({ dd: dd.clone(), kind: 'bloom', sz, ang: h3 * TAU, e: t.e, color: bc });
          }
        }
      }
    });
    const cc = new THREE.Color();
    for (const [geo, list] of [[tuftG, lists.tuft], [pebbleG, lists.pebble], [bloomG, lists.bloom]]) {
      const cnt = list.length / 2;
      if (!cnt) continue;
      const im = new THREE.InstancedMesh(geo, detailMat, cnt);
      for (let i = 0; i < cnt; i++) { im.setMatrixAt(i, list[i * 2]); im.setColorAt(i, cc.set(list[i * 2 + 1])); }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false;
      landmarks.add(im);
    }
  }

  // 封面縮圖（約 5 KB 一張）載入後換掉表情符號；載不到就維持表情符號
  function loadCovers() {
    const ver = (import.meta.url.split('?')[1] || '');
    halls.forEach(hall => {
      hall.units.forEach(u => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = 204; c.height = 140;
          const x = c.getContext('2d');
          x.fillStyle = hall.color; roundRectPath(x, 0, 0, 204, 140, 14); x.fill();
          x.save(); roundRectPath(x, 7, 7, 190, 126, 9); x.clip(); x.drawImage(img, 7, 7, 190, 126); x.restore();
          x.lineWidth = 3; x.strokeStyle = '#0b1a15'; roundRectPath(x, 1.5, 1.5, 201, 137, 13); x.stroke();
          const tex = new THREE.CanvasTexture(c);
          tex.colorSpace = THREE.SRGBColorSpace;
          for (const { sprite, h, ex } of signs.get(u.id) || []) {
            sprite.material.map = tex; sprite.material.needsUpdate = true;
            if (ex) { ex.aspect = 204 / 140; sprite.scale.set(ex.size * ex.aspect, ex.size, 1); }
            else sprite.scale.set(h * 204 / 140, h, 1);
          }
          invalidate();
        };
        img.src = new URL('./thumbs/' + u.id + '.jpg' + (ver ? '?' + ver : ''), import.meta.url).href;
      });
    });
  }

  // ----- 雕像與石碑（球外一座、進館後地圖起點一座，共用同一份幾何與貼圖） -----
  function plaqueTexture(hall) {
    const sci = (scientists[hall.id] || {});
    const zh = sci.zh || { name: hall.zh, years: '', role: '' }, en = sci.en || { name: '' };
    const c = document.createElement('canvas');
    c.width = 512; c.height = 320;
    const x = c.getContext('2d');
    x.fillStyle = '#e6e0d0'; x.fillRect(0, 0, 512, 320);
    x.lineWidth = 14; x.strokeStyle = hall.color; x.strokeRect(7, 7, 498, 306);
    x.fillStyle = '#16241f'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 84px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    x.fillText(zh.name, 256, 92);
    x.font = 'bold 40px "Helvetica Neue",Arial,sans-serif';
    x.fillText(en.name, 256, 160);
    x.font = '34px "Helvetica Neue",Arial,sans-serif';
    x.fillStyle = '#4a5a52';
    x.fillText(zh.years, 256, 212);
    x.font = 'bold 30px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    x.fillStyle = '#16241f';
    x.fillText('點一下看介紹  Tap to read', 256, 268);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function statueInstance(hall, sg, tex) {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(sg.body, toonMat), new THREE.Mesh(sg.hull, hullMat));
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.31), new THREE.MeshBasicMaterial({ map: tex }));
    plane.position.set(0, 1.1 + Math.sin(0.96) * 0.08, 1.7 + Math.cos(0.96) * 0.08);
    plane.rotation.x = -0.96;
    plane.userData.statueHall = hall.id;
    grp.add(plane);
    const px = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.6, 2.2), hiddenMat);
    px.position.y = 2.3;
    px.userData.statueHall = hall.id;
    grp.add(px);
    return { grp, proxies: [plane, px] };
  }
  const statueProxiesPlanet = [];

  // ----- 四座館（只剩地圖；球外靠顏色分區，不再蓋建築） -----
  const hallObjs = [];
  const unitIndex = new Map(); // unitId -> {hall, index}

  halls.forEach((hall, hi) => {
    const col = new THREE.Color(hall.color);
    const hex = hall.color;
    const g = new THREE.Group();
    const { n, E } = bases[hi];
    const Zl = new THREE.Vector3().crossVectors(E, n);
    g.position.copy(n).multiplyScalar(PLATEAU_TOP);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, n, Zl));
    planet.add(g);
    const sg = buildMerged(statueParts(hall), 0.06);
    const plaqueTex = plaqueTexture(hall);
    const stP = statueInstance(hall, sg, plaqueTex);
    const iconP = stP.grp;
    g.add(iconP);
    statueProxiesPlanet.push(...stP.proxies);

    const anchor = new THREE.Object3D();
    anchor.position.y = 6.0;
    g.add(anchor);

    // ----- 平面地圖（進館後才看得到） -----
    const map = new THREE.Group();
    map.position.y = MAP_Y;
    map.visible = false;
    g.add(map);

    // 地圖的內容（地面、路線、站牌、雕像、出口）放在 content 裡；橫式螢幕時整個轉 90 度
    const content = new THREE.Group();
    map.add(content);
    // 底盤：館色邊框（地面本身是「攤平的星球」，第一次用到時才建，見 ensureGround）
    {
      const mm = buildMerged([{ g: new THREE.CylinderGeometry(DISC_R + 0.55, DISC_R + 0.8, 0.5, 64), m: M(0, -0.5, 0), color: col.clone().multiplyScalar(0.6) }], 0.08);
      map.add(new THREE.Mesh(mm.body, toonMat), new THREE.Mesh(mm.hull, hullMat));
    }
    const pathHolder = new THREE.Group();
    content.add(pathHolder);
    const stM = statueInstance(hall, sg, plaqueTex);
    const iconMap = stM.grp;
    iconMap.scale.setScalar(0.8);
    content.add(iconMap);

    // 單元站
    const N = hall.units.length;
    const exhibits = [];
    const exProxies = [];
    hall.units.forEach((u, i) => {
      const ex = new THREE.Group();
      const pp = [];
      pp.push({ g: new THREE.CylinderGeometry(0.62, 0.8, 0.55, 14), m: M(0, 0.28, 0), color: new THREE.Color(0xefe5c6) });
      pp.push({ g: new THREE.CylinderGeometry(0.72, 0.72, 0.1, 14), m: M(0, 0.6, 0), color: col.clone() });
      const mg = buildMerged(pp, 0.06);
      ex.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(u.emoji), transparent: true, depthWrite: false }));
      sprite.position.y = 1.75;
      sprite.scale.set(1.5, 1.5, 1);
      ex.add(sprite);
      const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberTexture(i + 1, hex), transparent: true, depthWrite: false }));
      badge.position.set(0.95, 0.75, 0.75);
      badge.scale.set(0.62, 0.62, 1);
      ex.add(badge);
      const ep = new THREE.Mesh(new THREE.SphereGeometry(1.25, 8, 6), hiddenMat);
      ep.position.y = 1.1;
      ep.userData.unitId = u.id;
      ex.add(ep);
      content.add(ex);
      const exObj = { group: ex, sprite, size: 1.5, target: 1.5, hop: 0, hopTarget: 0, aspect: 1 };
      exhibits.push(exObj);
      addSign(u.id, sprite, null, exObj);
      exProxies.push(ep);
      unitIndex.set(u.id, { hall: hi, index: i });
    });
    const focusRing = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1.22, 28).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }),
    );
    focusRing.position.y = 0.04;
    content.add(focusRing);

    // 通往隔壁館的出口
    const gates = [];
    const gateProxies = [];
    halls.forEach((other, oj) => {
      if (oj === hi) return;
      const gc = new THREE.Color(other.color);
      const gp = [
        { g: new THREE.BoxGeometry(0.55, 2.4, 0.55), m: M(-1.2, 1.2, 0), color: gc.clone() },
        { g: new THREE.BoxGeometry(0.55, 2.4, 0.55), m: M(1.2, 1.2, 0), color: gc.clone() },
        { g: new THREE.BoxGeometry(3.0, 0.55, 0.65), m: M(0, 2.55, 0), color: gc.clone() },
        { g: new THREE.CylinderGeometry(1.7, 1.9, 0.18, 16), m: M(0, 0.09, 0.2), color: new THREE.Color(0xefe5c6), noHull: true },
      ];
      const gm = buildMerged(gp, 0.06);
      const gg = new THREE.Group();
      gg.add(new THREE.Mesh(gm.body, toonMat), new THREE.Mesh(gm.hull, hullMat));
      const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(GATE_EMOJI[other.id] || '🚪'), transparent: true, depthWrite: false }));
      gs.position.set(0, 4.1, 0);
      gs.scale.set(1.9, 1.9, 1);
      gg.add(gs);
      const gx = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.6, 2.2), hiddenMat);
      gx.position.y = 2.3;
      gx.userData.gateHall = other.id;
      gg.add(gx);
      gg.scale.setScalar(0.74);
      content.add(gg);
      gates.push({ group: gg, toIndex: oj });
      gateProxies.push(gx);
    });

    hallObjs.push({
      hall, group: g, map, content, ground: null, laid: false, nodesV: [], gatesV: [], statueV: null,
      anchor, icon: iconP, iconMap, statueProxies: stM.proxies, exhibits, exProxies, gates, gateProxies, focusRing, pathHolder, N,
      q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, bases[hi].Np, n)).invert(),
      focus: 0, layoutV: null, nodes: [],
    });
  });

  // ----- 地圖版面：一律先用「直式」排好（和星球上的路是同一條），橫式螢幕就把整張地圖轉 90 度 -----
  const pathMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  const HS = 1 / SPHERE_S; // 球面長度 → 地圖長度
  function layoutBase(h) {
    const N = h.N, curve = curveFor(true, N);
    h.nodesV = h.exhibits.map((e, i) => {
      const p = curve(N === 1 ? 0.5 : i / (N - 1));
      e.group.position.set(p.x, 0, p.z);
      return new THREE.Vector3(p.x, 0, p.z);
    });
    // 路面本身畫在地面磚上（跟星球上一模一樣），這裡再補上清楚的白色路邊線與黃色虛線
    const parts = [];
    const edgeC = new THREE.Color(0xffffff), dashC = new THREE.Color(0xf2c94c);
    const steps = 90;
    for (let s2 = 0; s2 < steps; s2++) {
      const t0 = -0.04 + (1.08 * s2) / steps, t1 = -0.04 + (1.08 * (s2 + 1)) / steps;
      const a = curve(t0), b = curve(t1);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const ang = Math.atan2(b.x - a.x, b.z - a.z);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ang, 0));
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, px = Math.cos(ang), pz = -Math.sin(ang);
      const add = (w, l, off, color) => parts.push({
        g: new THREE.BoxGeometry(w, 0.05, l),
        m: new THREE.Matrix4().compose(new THREE.Vector3(mx + px * off, 0.03, mz + pz * off), q, new THREE.Vector3(1, 1, 1)),
        color, noHull: true,
      });
      add(0.15, len + 0.06, 0.98, edgeC);
      add(0.15, len + 0.06, -0.98, edgeC);
      if (s2 % 2 === 0) add(0.15, len * 0.8, 0, dashC);
    }
    const mg = buildMerged(parts, 0);
    h.pathHolder.add(new THREE.Mesh(mg.body, pathMat));
    const sp0 = curve(-0.16);
    h.statueV = new THREE.Vector3(sp0.x, 0, sp0.z);
    h.iconMap.position.copy(h.statueV);
    // 出口：沿著「隔壁館所在的方向」放在地圖邊緣
    const { E, Np } = bases[hallObjs.indexOf(h)];
    const ext = EXT.v;
    h.gatesV = h.gates.map(gt => {
      const od = hallDirs[gt.toIndex];
      let dx = od.dot(E), dz = -od.dot(Np); // 本地 x 往右、z 往螢幕下方
      const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const k = Math.min((ext.ex - 1.2) / Math.max(Math.abs(dx), 1e-3), (ext.ey - 1.4) / Math.max(Math.abs(dz), 1e-3));
      gt.group.position.set(dx * k, 0, dz * k);
      return gt.group.position.clone();
    });
    h.laid = true;
  }
  function layoutHall(h, vertical) {
    if (!h.laid) layoutBase(h);
    ensureGround(h);
    h.layoutV = vertical;
    const rot = vertical ? 0 : Math.PI / 2;
    h.content.rotation.y = rot;
    // 站牌、雕像、出口要一直正對鏡頭，所以各自轉回來
    h.exhibits.forEach(e => { e.group.rotation.y = -rot; });
    h.iconMap.rotation.y = -rot;
    h.gates.forEach(gt => { gt.group.rotation.y = -rot; });
    h.nodes = h.nodesV.map(p => (vertical ? p.clone() : new THREE.Vector3(p.z, 0, -p.x)));
    placeFocus(h);
  }

  // ----- 館內地面：把星球上這一館附近「攤平」——同樣的六角磚配色與起伏、同樣的造景與花草 -----
  const groundMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  const _mv = new THREE.Vector3();
  function toMap(b, d, out) { // 球面方向 → 地圖座標（直式，與 expDir 相反）
    const c = clamp(d.dot(b.n), -1, 1), a = Math.acos(c);
    if (a > 1.45) return null;
    _mv.copy(d).addScaledVector(b.n, -c);
    const sl = _mv.length();
    if (sl < 1e-6) return out.set(0, 0, 0);
    const f = (R * a) / (sl * SPHERE_S);
    return out.set(_mv.dot(b.E) * f, 0, -_mv.dot(b.Np) * f);
  }
  function ensureGround(h) {
    if (h.ground) return;
    if (!h.laid) layoutBase(h);
    const hi = hallObjs.indexOf(h), b = bases[hi];
    // 地圖上才有的雕像與出口：周圍整平成廣場
    const zones = [{ x: h.statueV.x, z: h.statueV.z, r: 2.1 }].concat(h.gatesV.map(p => ({ x: p.x, z: p.z, r: 2.2 })));
    const zoneK = (x, z) => { let k = 0; for (const zn of zones) k = Math.max(k, 1 - smooth(zn.r * 0.75, zn.r, Math.hypot(x - zn.x, z - zn.z))); return k; };
    const heightAt = (e, x, z, rad) => lerp(lerp(Math.max(-0.2, (e - E_FLAT) * HS), 0, zoneK(x, z)), -0.15, smooth(DISC_R - 1.4, DISC_R - 0.1, rad));
    const ground = new THREE.Group();

    // 1) 六角磚（尖角朝上排列，外接圓半徑 RC）。中心的高度與顏色取自星球；角的高度取相鄰三片的平均，所以不會有縫
    const RC = 0.08, SQ3 = Math.sqrt(3);
    const Rr = Math.ceil(DISC_R / (1.5 * RC)) + 1;
    const qMax = Math.ceil(DISC_R / (SQ3 * RC)) + Math.ceil(Rr / 2) + 2;
    const key = (q, r) => (q + 4000) * 8001 + (r + 4000);
    const idxOf = new Map();
    const cx = [], cz = [], cy = [], cc = [], cq = [], cr = [];
    for (let r = -Rr; r <= Rr; r++) {
      for (let q = -qMax; q <= qMax; q++) {
        const x = RC * SQ3 * (q + r / 2), z = RC * 1.5 * r, rad = Math.hypot(x, z);
        if (rad > DISC_R - RC) continue;
        const d = expDir(b, { x, z }, SPHERE_S);
        const tr = terrain(d);
        const id = cx.length;
        const gcl = groundColor(tr, d.x, d.y, d.z, id + 7919 * hi);
        let c0 = gcl[0], c1 = gcl[1], c2 = gcl[2], bev = gcl[3];
        if (zoneK(x, z) > 0.5) { c0 = 233; c1 = 226; c2 = 207; bev = 0.95; }
        cx.push(x); cz.push(z); cy.push(heightAt(tr.e, x, z, rad)); cq.push(q); cr.push(r);
        cc.push(c0, c1, c2, bev);
        idxOf.set(key(q, r), id);
      }
    }
    const NB = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]; // 鄰居方向依序為 0°,60°,…,300°
    const nc = cx.length;
    const pos = new Float32Array(nc * 21), col = new Uint8Array(nc * 21), index = new Uint32Array(nc * 18);
    for (let i = 0; i < nc; i++) {
      const base = i * 7, x = cx[i], z = cz[i], y = cy[i];
      const c0 = cc[i * 4], c1 = cc[i * 4 + 1], c2 = cc[i * 4 + 2], bev = cc[i * 4 + 3];
      pos[base * 3] = x; pos[base * 3 + 1] = y; pos[base * 3 + 2] = z;
      col[base * 3] = c0; col[base * 3 + 1] = c1; col[base * 3 + 2] = c2;
      const d0 = Math.round(c0 * bev), d1 = Math.round(c1 * bev), d2 = Math.round(c2 * bev);
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI / 6 + (k * Math.PI) / 3; // 第 k 個角夾在第 k 與第 k+1 個鄰居之間
        const n1 = idxOf.get(key(cq[i] + NB[k][0], cr[i] + NB[k][1]));
        const n2 = idxOf.get(key(cq[i] + NB[(k + 1) % 6][0], cr[i] + NB[(k + 1) % 6][1]));
        let sy = y, sn = 1;
        if (n1 !== undefined) { sy += cy[n1]; sn++; }
        if (n2 !== undefined) { sy += cy[n2]; sn++; }
        const o = (base + 1 + k) * 3;
        pos[o] = x + RC * Math.cos(ang); pos[o + 1] = sy / sn; pos[o + 2] = z + RC * Math.sin(ang);
        col[o] = d0; col[o + 1] = d1; col[o + 2] = d2;
        const t = i * 18 + k * 3;
        index[t] = base; index[t + 1] = base + 1 + ((k + 1) % 6); index[t + 2] = base + 1 + k; // 從上方看逆時針
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeVertexNormals();
    ground.add(new THREE.Mesh(geo, groundMat));

    // 2) 造景：星球上的同一批，照位置攤平過來（大小跟著地圖比例放大）
    const pv = new THREE.Vector3(), sv = new THREE.Vector3(), qY = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    const parts = [];
    const FOOT = { volcano: 2.1, mountain: 1.5, strata: 0.9, boulders: 1.2, broad: 1.0, sakura: 1.0, pine: 0.9 }; // 各種造景的底面半徑（未縮放）
    for (const rec of propRecs) {
      if (!toMap(b, rec.dd, pv)) continue;
      const rad = Math.hypot(pv.x, pv.z);
      if (rad > DISC_R - 1.0 || zoneK(pv.x, pv.z) > 0.01) continue;
      const sc = rec.sc * HS * 0.85, foot = (FOOT[rec.kind] || 0.8) * sc;
      // 地圖是近看，大的造景（火山、山）不可以壓到路和站牌
      if (rec.rd * HS - foot < 1.7 || rec.nd * HS - foot < 2.2) continue;
      const y = heightAt(rec.e, pv.x, pv.z, rad) - 0.05 * HS;
      const bm = new THREE.Matrix4().compose(pv.set(pv.x, y, pv.z), qY.setFromAxisAngle(UP, rec.ang), sv.set(sc, sc, sc));
      for (const pt of propParts(halls[rec.hi], rec.kind, k => hash3(rec.tries * 1.9 + k, rec.hi * 2.3, 6.1))) { pt.m = bm.clone().multiply(pt.m); parts.push(pt); }
    }
    if (parts.length) {
      const mg = buildMerged(parts, 0.05 * HS);
      ground.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
    }

    // 3) 草叢、小石、小花
    if (detailGeo) {
      const lists = { tuft: [], pebble: [], bloom: [] };
      const m4 = new THREE.Matrix4();
      for (const rec of detailRecs) {
        if (!toMap(b, rec.dd, pv)) continue;
        const rad = Math.hypot(pv.x, pv.z);
        if (rad > DISC_R - 0.6 || zoneK(pv.x, pv.z) > 0.01) continue;
        let y = heightAt(rec.e, pv.x, pv.z, rad);
        const sz = rec.sz * HS;
        if (rec.kind === 'tuft') { y -= 0.03 * HS; sv.set(sz, sz, sz); }
        else if (rec.kind === 'pebble') { y -= 0.04 * HS; sv.set(sz, sz * 0.62, sz); }
        else { y += 0.29 * sz; sv.set(sz, sz, sz); }
        m4.compose(pv.set(pv.x, y, pv.z), qY.setFromAxisAngle(UP, rec.ang), sv);
        lists[rec.kind].push(m4.clone(), rec.color);
      }
      const ccol = new THREE.Color();
      for (const kind of ['tuft', 'pebble', 'bloom']) {
        const list = lists[kind], cnt = list.length / 2;
        if (!cnt) continue;
        const im = new THREE.InstancedMesh(detailGeo[kind], detailGeo.mat, cnt);
        for (let i = 0; i < cnt; i++) { im.setMatrixAt(i, list[i * 2]); im.setColorAt(i, ccol.set(list[i * 2 + 1])); }
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.frustumCulled = false;
        ground.add(im);
      }
    }
    h.content.add(ground);
    h.ground = ground;
  }

  // ----- 光速太空梭：開場載著大家飛進來，之後繞著星球慢慢轉 -----
  const shuttle = new THREE.Group();
  const flames = [];
  let shuttleProxy;
  {
    const parts = [];
    const P = (g, m, c, noHull) => parts.push({ g, m, color: new THREE.Color(c), noHull });
    const BODY = 0xf2ecd9;
    P(new THREE.CylinderGeometry(0.3, 0.34, 1.5, 16), M(0, 0, 0, Math.PI / 2, 0, 0), BODY);                  // 機身
    P(new THREE.ConeGeometry(0.3, 0.7, 16), M(0, 0, 1.1, Math.PI / 2, 0, 0), BODY);                          // 機鼻
    P(new THREE.CylinderGeometry(0.345, 0.345, 0.14, 16), M(0, 0, 0.28, Math.PI / 2, 0, 0), 0xfde047, true); // 黃色腰帶
    P(new THREE.SphereGeometry(0.22, 14, 8, 0, TAU, 0, Math.PI / 2), Ms(0, 0.2, 0.62, 1, 0.55, 1.5), 0x38bdf8, true); // 駕駛艙窗
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.22, 0.45); wingShape.lineTo(1.15, -0.5); wingShape.lineTo(1.15, -0.72); wingShape.lineTo(0.22, -0.7); wingShape.closePath();
    const wingR = new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, -0.08, 0);
    const wingL = new THREE.Matrix4().makeRotationZ(Math.PI).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).setPosition(0, -0.14, 0);
    P(new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false }), wingR, 0xe6e0d0);
    P(new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false }), wingL, 0xe6e0d0);
    P(new THREE.BoxGeometry(0.09, 0.1, 0.26), M(1.12, -0.11, -0.6), 0xf2d675, true);   // 翼尖：四館的顏色
    P(new THREE.BoxGeometry(0.09, 0.1, 0.26), M(-1.12, -0.11, -0.6), 0xa8e6cf, true);
    const finShape = new THREE.Shape();
    finShape.moveTo(-0.75, 0.25); finShape.lineTo(-0.75, 0.95); finShape.lineTo(-0.45, 0.95); finShape.lineTo(-0.05, 0.25); finShape.closePath();
    P(new THREE.ExtrudeGeometry(finShape, { depth: 0.06, bevelEnabled: false }), new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(0.03, 0, 0), BODY);
    P(new THREE.BoxGeometry(0.075, 0.12, 0.3), M(0, 0.72, -0.55), 0xf0955c, true);
    P(new THREE.BoxGeometry(0.075, 0.12, 0.38), M(0, 0.52, -0.45), 0x6fa8f2, true);
    const nozzles = [[0, 0.1], [-0.17, -0.08], [0.17, -0.08]];
    nozzles.forEach(([x, y]) => P(new THREE.CylinderGeometry(0.1, 0.14, 0.24, 12), M(x, y, -0.84, Math.PI / 2, 0, 0), 0x4a5a52));
    const sg2 = buildMerged(parts, 0.035);
    shuttle.add(new THREE.Mesh(sg2.body, toonMat), new THREE.Mesh(sg2.hull, hullMat));
    const fOut = new THREE.MeshBasicMaterial({ color: 0x55e9ff, transparent: true, opacity: 0.85, depthWrite: false, fog: false, ...GLOW_BLEND });
    const fIn = new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.95, depthWrite: false, fog: false, ...GLOW_BLEND });
    const fOutG = new THREE.ConeGeometry(0.11, 0.8, 10).translate(0, 0.4, 0).rotateX(-Math.PI / 2);
    const fInG = new THREE.ConeGeometry(0.065, 0.5, 8).translate(0, 0.25, 0).rotateX(-Math.PI / 2);
    nozzles.forEach(([x, y]) => {
      const fg = new THREE.Group();
      fg.position.set(x, y, -0.96);
      fg.add(new THREE.Mesh(fOutG, fOut), new THREE.Mesh(fInG, fIn));
      shuttle.add(fg);
      flames.push(fg);
    });
    shuttleProxy = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), hiddenMat);
    shuttle.add(shuttleProxy);
    shuttle.scale.setScalar(0.62);
    shuttle.visible = false;
    scene.add(shuttle);
  }

  // 光速星流：一條條細長的光，從畫面中心往外拉（只在開場出現）
  const WARP_N = 600;
  const warp = (() => {
    const pos = new Float32Array(WARP_N * 12), colA = new Float32Array(WARP_N * 12), idx = new Uint32Array(WARP_N * 6);
    const data = [];
    const tints = [[0.95, 0.93, 0.86], [0.45, 0.9, 1.0], [0.99, 0.86, 0.3], [0.7, 0.98, 0.88]];
    for (let i = 0; i < WARP_N; i++) {
      data.push({ a: Math.random() * TAU, r: 7 + Math.pow(Math.random(), 0.7) * 60, z: -Math.random() * 340, w: 0.05 + Math.random() * 0.09, k: 0.6 + Math.random() * 0.8, c: tints[Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 3)] });
      const b4 = i * 4;
      idx.set([b4, b4 + 1, b4 + 2, b4, b4 + 2, b4 + 3], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...GLOW_BLEND }));
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.renderOrder = 8;
    scene.add(mesh);
    function update(cam, vLen, dz, bright) {
      const L0 = clamp(vLen * 0.05, 0.05, 46);
      for (let i = 0; i < WARP_N; i++) {
        const d = data[i];
        d.z += dz;
        if (d.z > 4) d.z -= 344;
        const cx = cam.x + Math.cos(d.a) * d.r, cy = cam.y + Math.sin(d.a) * d.r;
        const hz = cam.z + d.z, tz = hz - L0 * d.k;
        const tx = -Math.sin(d.a) * d.w, ty = Math.cos(d.a) * d.w;
        const o = i * 12;
        pos[o] = cx - tx; pos[o + 1] = cy - ty; pos[o + 2] = hz;
        pos[o + 3] = cx + tx; pos[o + 4] = cy + ty; pos[o + 5] = hz;
        pos[o + 6] = cx + tx; pos[o + 7] = cy + ty; pos[o + 8] = tz;
        pos[o + 9] = cx - tx; pos[o + 10] = cy - ty; pos[o + 11] = tz;
        const f = bright * smooth(4, -24, d.z) * smooth(-344, -260, d.z);
        for (let k = 0; k < 2; k++) { colA[o + k * 3] = d.c[0] * f; colA[o + k * 3 + 1] = d.c[1] * f; colA[o + k * 3 + 2] = d.c[2] * f; }
        for (let k = 6; k < 12; k++) colA[o + k] = 0;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.color.needsUpdate = true;
    }
    return { mesh, update };
  })();

  // 開場：鏡頭從很遠的地方以光速衝過來、慢慢煞車；太空梭在前面帶路，最後繞進軌道
  const INTRO = { far: 640, dur: 5600 };
  const ORB_R = 15, ORB_W = 0.16, ORB_END = -4.0, ORB_IN = 0.6, ORB_U = 0.62;
  const ORB_K = (ORB_IN - ORB_END - ORB_W * (INTRO.dur / 1000) * (1 - ORB_U)) / ((1 - ORB_U) * (1 - ORB_U));
  const qOrb = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.42, 0, 0.2));
  let intro = null;
  let shuttleTheta = ORB_END, shuttleRoll = 0;
  const shPos = new THREE.Vector3(), shPos2 = new THREE.Vector3(), shDir = new THREE.Vector3(), shPrev = new THREE.Vector3(0, 0, -1);
  const _c = new THREE.Vector3(), _ch = new THREE.Vector3(), camI = new THREE.Vector3();
  const orbitPos = (th, out) => out.set(ORB_R * Math.cos(th), 0, ORB_R * Math.sin(th)).applyQuaternion(qOrb);
  function introCam(u, out) {
    const sw = 1 - u;
    return out.set(Math.sin(u * 6.0) * 0.9 * sw, (1.2 + Math.cos(u * 4.3) * 0.5) * sw, planetDistance() + INTRO.far * Math.pow(sw, 2.4));
  }
  const introSpeed = u => 2.4 * INTRO.far / (INTRO.dur / 1000) * Math.pow(1 - u, 1.4);
  function shuttleAt(u, out) {
    introCam(u, _c);
    const ahead = 6.2 + 30 * Math.pow(smooth(0.25, 1.0, u), 1.5);
    _ch.set(_c.x + Math.sin(u * 9) * 0.25, _c.y - 1.05 + Math.sin(u * 7) * 0.12, _c.z - ahead);
    orbitPos(ORB_END + ORB_W * (INTRO.dur / 1000) * (1 - u) + ORB_K * (1 - u) * (1 - u), out);
    return out.lerp(_ch, 1 - smooth(0.5, 0.9, u));
  }
  function poseShuttle(pos, dir, dt, bankBias) {
    shuttle.position.copy(pos);
    // 轉彎時往內側傾
    const turn = shPrev.x * dir.z - shPrev.z * dir.x;
    shPrev.copy(dir);
    const target = clamp(-turn / Math.max(dt, 1e-3) * 0.6 + bankBias, -0.9, 0.9);
    shuttleRoll += (target - shuttleRoll) * (1 - Math.exp(-dt / 0.25));
    tmpLook.copy(pos).add(dir);
    shuttle.lookAt(tmpLook);
    shuttle.rotateZ(shuttleRoll);
  }
  const tmpLook = new THREE.Vector3();
  function flicker(power) {
    for (const f of flames) {
      const j = 0.82 + 0.36 * Math.random();
      f.scale.set(1, 1, power * j);
    }
  }
  function updateIntro(dt, now) {
    const flying = intro.phase === 'fly';
    const u = intro.fixedU != null ? intro.fixedU : flying ? Math.min(1, (now - intro.t0) / INTRO.dur) : 0;
    intro.u = u;
    planet.quaternion.copy(intro.qStart).slerp(intro.qEnd, 1 - Math.pow(1 - u, 2.2));
    introCam(u, camI);
    const v = introSpeed(u);
    warp.mesh.visible = true;
    warp.update(camI, v, flying ? v * dt : 0, smooth(12, 150, v));
    shuttleAt(u, shPos);
    shuttleAt(Math.min(1, u + 0.004), shPos2);
    shDir.subVectors(shPos2, shPos);
    if (shDir.lengthSq() < 1e-8) shDir.set(0, 0, -1);
    shDir.normalize();
    poseShuttle(shPos, shDir, dt, 0);
    flicker(1 + 2.2 * smooth(20, 200, v));
    clouds.rotation.y += dt * 0.012;
    if (u >= 1 && intro.fixedU == null) { endIntro(now); return true; }
    return flying && intro.fixedU == null;
  }
  function endIntro(now) {
    if (!intro) return;
    const cb = intro.onDone;
    planet.quaternion.copy(intro.qEnd);
    intro = null;
    warp.mesh.visible = false;
    shuttleTheta = ORB_END;
    lastWake = now;
    if (cb) cb();
  }
  function beginIntro() {
    if (reducedMotion) return false;
    flight = null;
    omega.set(0, 0, 0);
    state.mode = 'planet'; state.k = 0; state.zoomP = 1;
    const qEnd = planet.quaternion.clone();
    const qStart = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -2.6).multiply(qEnd);
    intro = { phase: 'hold', t0: 0, u: 0, qStart, qEnd, onDone: null };
    shuttle.visible = true;
    invalidate();
    return true;
  }
  function playIntro(onDone) {
    if (!intro) { if (onDone) onDone(); return; }
    intro.phase = 'fly';
    intro.t0 = performance.now();
    intro.onDone = onDone || null;
    invalidate();
  }
  function skipIntro() {
    if (!intro) return;
    intro.onDone = null;
    endIntro(performance.now());
    invalidate();
  }

  // 沒有人操作時的小動畫（雲飄、太空梭繞行、星星呼吸）；兩分鐘沒動作就停下來省電，並以每秒約 30 格繪製
  const AMBIENT_MS = 120000;
  let lastWake = performance.now(), onlyAmbient = false;
  function ambientOn(now) { return !reducedMotion && state.mode === 'planet' && state.k < 0.04 && now - lastWake < AMBIENT_MS; }
  function ambientStep(dt, now) {
    clouds.rotation.y += dt * 0.012;
    shuttleTheta -= ORB_W * dt;
    const t = now / 1000;
    starMats.forEach((m, i) => { m.userData.tw = i === 0 ? 1 : 0.8 + 0.2 * Math.sin(t * (1.1 + i * 0.7) + i * 2.1); });
    flicker(1);
  }
  function orbitShuttle(dt) {
    orbitPos(shuttleTheta, shPos);
    orbitPos(shuttleTheta - 0.01, shPos2);
    shDir.subVectors(shPos2, shPos).normalize();
    poseShuttle(shPos, shDir, Math.max(dt, 0.016), 0.35);
  }

  // ----- 視角狀態 -----
  const state = {
    mode: 'planet',     // 目前的目標：planet | hall
    hall: -1,           // 目標館
    hallVis: -1,        // 畫面上正在顯示的館（館到館的飛行途中才會和 hall 不同）
    k: 0,               // 0＝星球視角，1＝館視角（飛行中連續變化）
    zoomP: 1,
    zoomH: 1,
    sheetF: 0,
    sheetAxis: 'y',
    curV: true,         // 目前地圖是直式還是橫式
  };
  const pan = new THREE.Vector2(), panT = new THREE.Vector2();
  let flight = null;
  const omega = new THREE.Vector3();
  let dragging = false;
  let lastInteract = 0;
  planet.quaternion.setFromEuler(new THREE.Euler(TILT, 0.6, 0));

  function uprightOf(q) {
    const cur = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const want = new THREE.Vector3(0, Math.cos(TILT), Math.sin(TILT));
    return new THREE.Quaternion().setFromUnitVectors(cur, want).multiply(q);
  }

  // ----- 尺寸與相機 -----
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, canvas.clientWidth);
    H = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    invalidate();
  }
  function planetDistance() {
    const halfV = THREE.MathUtils.degToRad(BASE_FOV / 2);
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    const half = Math.min(halfV, halfH);
    return R / Math.sin(0.64 * half);
  }
  function freeFractions() {
    return {
      fw: state.sheetAxis === 'x' ? Math.max(0.3, 1 - state.sheetF) : 1,
      fh: state.sheetAxis === 'y' ? Math.max(0.3, 1 - state.sheetF) : 1,
    };
  }
  function wantVertical() { const { fw, fh } = freeFractions(); return W * fw < H * fh * 1.05; }
  function hallDistance() {
    const halfV = THREE.MathUtils.degToRad(BASE_FOV / 2);
    const tanV = Math.tan(halfV), tanH = tanV * camera.aspect;
    const { fw, fh } = freeFractions();
    const ext = state.curV ? EXT.v : EXT.h;
    const dH = ext.ex / (0.95 * tanH * fw);
    const dV = ext.ey / (0.95 * tanV * fh);
    return clamp(Math.max(dH, dV), 18, 160);
  }
  const posP = new THREE.Vector3(), posH = new THREE.Vector3(), tgtH = new THREE.Vector3();
  const posG = new THREE.Vector3(), tgtG = new THREE.Vector3(), upV = new THREE.Vector3(), tgtV = new THREE.Vector3();
  let groundH = R + 0.3;
  const GROUND = { camH: 3.0, back: 3.4, look: 7.5, lookDrop: 0.2 };
  const minZoomP = () => (R * 1.0) / planetDistance();
  // 0＝在太空看星球，1＝站在路上走（放大到靠近地面時）
  function groundBlend() { return smooth(R * 2.4, R * 1.35, planetDistance() * state.zoomP) * (1 - state.k); }
  const gDir = new THREE.Vector3(), gQ = new THREE.Quaternion();
  function groundTargetH() { // 鏡頭下方與前方的地面高度，鏡頭要在其上
    gQ.copy(planet.quaternion).invert();
    gDir.set(0, -0.3, 1).normalize().applyQuaternion(gQ);
    const e1 = terrain(gDir).e;
    gDir.set(0, 0.0, 1).normalize().applyQuaternion(gQ);
    const e2 = terrain(gDir).e;
    gDir.set(0, 0.35, 1).normalize().applyQuaternion(gQ);
    return R + Math.max(e1, e2, terrain(gDir).e);
  }
  function applyCamera() {
    if (intro) {
      const u = intro.u || 0;
      introCam(u, camera.position);
      const fov = BASE_FOV + 26 * Math.pow(1 - u, 1.6);
      if (Math.abs(camera.fov - fov) > 1e-4) camera.fov = fov;
      const r = 0.07 * Math.sin(u * 5.2) * (1 - u);
      camera.up.set(Math.sin(r), Math.cos(r), 0);
      camera.lookAt(0, 0, 0);
      camera.setViewOffset(W, H, 0, 0, W, H);
      return;
    }
    if (camera.fov !== BASE_FOV) camera.fov = BASE_FOV;
    posP.set(0, 0, planetDistance() * state.zoomP);
    const g = groundBlend();
    posG.set(0, -GROUND.back, groundH + GROUND.camH);
    tgtG.set(0, GROUND.look, groundH - GROUND.lookDrop);
    const dH = hallDistance() * state.zoomH;
    tgtH.set(pan.x, pan.y, PLATEAU_TOP + MAP_Y);
    // 鏡頭從南側往北看，近的在畫面下方，帶一點立體感
    posH.set(0, -Math.sin(HALL_PITCH) * dH, Math.cos(HALL_PITCH) * dH).add(tgtH);
    posP.lerp(posG, g);                       // 太空 → 地面
    camera.position.lerpVectors(posP, posH, state.k);
    tgtV.set(0, 0, 0).lerp(tgtG, g);
    upV.set(0, 1, 0).lerp(new THREE.Vector3(0, 0, 1), g).normalize();
    camera.up.copy(upV);
    camera.lookAt(lerp(tgtV.x, tgtH.x, state.k), lerp(tgtV.y, tgtH.y, state.k), lerp(tgtV.z, tgtH.z, state.k));
    const shift = state.k * (state.sheetF / 2);
    if (state.sheetAxis === 'x') camera.setViewOffset(W, H, -shift * W, 0, W, H);
    else camera.setViewOffset(W, H, 0, shift * H, W, H);
  }

  // 依 k 決定誰看得到：球、地標、館的平台與建築、地圖
  function applyVisibility() {
    const k = state.k;
    const ek = smooth(0.45, 0.95, k);
    planetMat.opacity = planetHullMat.opacity = 1 - ek;
    planetMeshes.forEach(m => { m.visible = ek < 0.99; });
    landmarks.visible = k < 0.5;
    const gbv = groundBlend();
    const atmoK = (1 - ek) * (1 - smooth(0.15, 0.6, gbv));
    atmoU.uStrength.value = atmoK;
    atmoOuter.visible = atmoK > 0.01;
    const skyA = intro ? 0 : smooth(0.45, 0.95, gbv);
    skyU.uAlpha.value = skyA;
    sky.visible = skyA > 0.01;
    starFade = 1 - skyA;
    starMats.forEach(m => { m.opacity = m.userData.base * m.userData.tw * starFade; });
    starGroup.visible = starFade > 0.01;
    scene.fog.near = lerp(900, 6, skyA);
    scene.fog.far = lerp(1800, 30, skyA);
    shuttle.visible = !!intro || (state.mode === 'planet' && k < 0.3 && gbv < 0.35);
    hallObjs.forEach(h => { h.icon.visible = k < 0.5; });
    clouds.visible = k < 0.35 && groundBlend() < 0.4; // 雲很低：走在地面上時收起來，才不會擋住視線
    hallObjs.forEach((h, i) => {
      const isVis = i === state.hallVis;
      h.group.visible = k < 0.55 || isVis;
      h.map.visible = isVis && k > 0.5;
      const mScale = isVis ? smooth(0.5, 0.95, k) : 0;
      h.map.scale.setScalar(Math.max(0.001, mScale));
    });
  }

  // ----- 飛行 -----
  function startFlight(toQ, toK, instant, dip = 0, toHallIdx = -1, keepZoom = false) {
    const fromQ = planet.quaternion.clone();
    const target = toQ.clone();
    if (fromQ.dot(target) < 0) target.set(-target.x, -target.y, -target.z, -target.w);
    omega.set(0, 0, 0);
    if (instant || reducedMotion) {
      planet.quaternion.copy(target);
      if (!keepZoom) state.zoomP = 1;
      state.k = toK;
      if (toHallIdx >= 0) state.hallVis = toHallIdx;
      flight = null;
    } else {
      flight = { t0: performance.now(), dur: dip ? 1700 : keepZoom ? 800 : 1200, fromQ, toQ: target, fromK: state.k, toK, dip, toHallIdx, swapped: false, fromZoom: state.zoomP, toZoom: keepZoom ? state.zoomP : 1 };
    }
    invalidate();
  }
  // 放大到地面時，自動轉到最近的一個單元站前面，面向路的前進方向（單元編號增加的方向）
  let walkSnapped = false;
  function snapToNearestStop() {
    const inv = new THREE.Quaternion().copy(planet.quaternion).invert();
    const v0 = new THREE.Vector3(0, 0, 1).applyQuaternion(inv);
    let bh = 0, bi = 0, bd = -2;
    hallNodes.forEach((arr, h) => arr.forEach((p, i) => { const d = p.dot(v0); if (d > bd) { bd = d; bh = h; bi = i; } }));
    const p = hallNodes[bh][bi].clone();
    const t = bases[bh].Np.clone().multiplyScalar(-1);
    t.addScaledVector(p, -t.dot(p)).normalize();
    const r = new THREE.Vector3().crossVectors(t, p);
    const al = 4.0 / R;
    const T = new THREE.Vector3(0, Math.sin(al), Math.cos(al));
    const tT = new THREE.Vector3(0, Math.cos(al), -Math.sin(al));
    const rT = new THREE.Vector3().crossVectors(tT, T);
    const A = new THREE.Matrix4().makeBasis(r, t, p), B = new THREE.Matrix4().makeBasis(rT, tT, T);
    const Q = new THREE.Quaternion().setFromRotationMatrix(B.multiply(A.invert()));
    startFlight(Q, 0, false, 0, -1, true);
  }
  function flyToHall(id, instant) {
    const i = halls.findIndex(h => h.id === id);
    if (i < 0) return;
    const fromHall = state.mode === 'hall' && state.hall >= 0 && state.hall !== i && state.k > 0.5;
    state.mode = 'hall';
    state.hall = i;
    pan.set(0, 0); panT.set(0, 0);
    if (fromHall) startFlight(hallObjs[i].q, 1, instant, 0.62, i); // 館到館：先浮到星球外再降落
    else {
      state.hallVis = i;
      startFlight(hallObjs[i].q, 1, instant, 0, i);
    }
  }
  function flyToPlanet(instant) {
    const base = state.hall >= 0 && state.k > 0.5 ? hallObjs[state.hall].q : planet.quaternion;
    state.mode = 'planet';
    startFlight(uprightOf(base), 0, instant);
  }

  // ----- 展品焦點 -----
  function placeFocus(h) {
    const nd = h.nodesV[h.focus];
    if (nd) h.focusRing.position.set(nd.x, 0.04, nd.z);
  }
  function focusUnit(unitId, instant) {
    const info = unitIndex.get(unitId);
    if (!info) return;
    const h = hallObjs[info.hall];
    h.focus = info.index;
    h.exhibits.forEach((e, i) => { e.target = i === info.index ? 2.05 : 1.5; e.hopTarget = i === info.index ? 0.35 : 0; });
    const nd = h.nodes[info.index];
    if (nd) {
      const nv = h.nodesV[info.index];
      h.focusRing.position.set(nv.x, 0.04, nv.z);
      // 放大看地圖時，鏡頭跟著移到這一站；整張地圖都看得到時就置中
      if (state.zoomH < 0.92) panT.set(nd.x, -nd.z); else panT.set(0, 0);
      if (instant || reducedMotion) pan.copy(panT);
    }
    invalidate();
  }

  // ----- 輸入：拖曳、雙指縮放、滾輪、點擊 -----
  const pointers = new Map();
  let drag = null, pinchStart = 0, pinchZoom = 1;
  const raycaster = new THREE.Raycaster();
  const pickSphere = new THREE.Sphere(new THREE.Vector3(), R + 0.4);
  const planetInv = new THREE.Quaternion();
  const ndc = new THREE.Vector2();

  function rotatePlanet(axis, angle) {
    if (angle === 0 || axis.lengthSq() === 0) return;
    planet.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), angle));
  }
  function onTap(cx, cy) {
    if (flight || intro) return;
    const rect = canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(ndc, camera);
    if (state.mode === 'planet' && shuttle.visible && handlers.onShuttlePick && raycaster.intersectObject(shuttleProxy, false).length) {
      handlers.onShuttlePick();
      return;
    }
    if (state.mode === 'planet' && groundBlend() > 0.5) {
      const hit = raycaster.intersectObjects(signSprites.concat(statueProxiesPlanet), false)[0];
      if (hit) {
        const u = hit.object.userData;
        if (u.statueHall) handlers.onStatuePick && handlers.onStatuePick(u.statueHall);
        else if (handlers.onUnitPick) handlers.onUnitPick(u.hallId, u.unitId);
      }
    } else if (state.mode === 'planet') {
      const pt = raycaster.ray.intersectSphere(pickSphere, tmpV);
      if (pt) {
        tmpV.applyQuaternion(planetInv.copy(planet.quaternion).invert()).normalize();
        let bi = 0, bd = -2;
        hallDirs.forEach((hd, i) => { const d = hd.dot(tmpV); if (d > bd) { bd = d; bi = i; } });
        if (bd > 0.3) handlers.onHallPick(halls[bi].id);
      }
    } else if (state.mode === 'hall' && state.hallVis >= 0) {
      const h = hallObjs[state.hallVis];
      const hit = raycaster.intersectObjects(h.exProxies.concat(h.gateProxies, h.statueProxies), false)[0];
      if (hit) {
        const d = hit.object.userData;
        if (d.statueHall) handlers.onStatuePick && handlers.onStatuePick(d.statueHall);
        else if (d.gateHall) handlers.onHallPick(d.gateHall);
        else { focusUnit(d.unitId, false); handlers.onExhibitPick(d.unitId); }
      }
    }
  }

  canvas.addEventListener('pointerdown', e => {
    if (intro) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastInteract = performance.now();
    if (handlers.onInteract) handlers.onInteract();
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, lastT: performance.now() };
      dragging = true;
      omega.set(0, 0, 0);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      pinchZoom = state.mode === 'planet' ? state.zoomP : state.zoomH;
      drag = null;
    }
    invalidate();
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    lastInteract = performance.now();
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart > 0) {
        const z = clamp(pinchZoom * (pinchStart / d), state.mode === 'planet' ? minZoomP() : 0.4, state.mode === 'planet' ? 1.5 : 1.35);
        if (state.mode === 'planet') state.zoomP = z; else state.zoomH = z;
        invalidate();
      }
      return;
    }
    if (!drag || flight) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    if (!drag.moved) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastT) / 1000;
    drag.x = e.clientX; drag.y = e.clientY; drag.lastT = now;
    if (state.mode === 'planet') {
      const speed = (1 / (0.42 * Math.min(W, H))) * Math.max(0.18, state.zoomP);
      const walking = groundBlend() > 0.5;  // 站在地面時：上下＝往前後走，左右＝轉向
      const axis = walking ? new THREE.Vector3(dy, 0, -dx * 1.4) : new THREE.Vector3(dy, dx, 0);
      const angle = axis.length() * speed;
      rotatePlanet(axis, angle);
      if (!reducedMotion) omega.lerp(axis.normalize().multiplyScalar(angle / dt), 0.5);
    } else if (state.mode === 'hall') {
      // 拖曳＝平移地圖
      const wpp = (2 * hallDistance() * state.zoomH * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2))) / H;
      const ext = state.curV ? EXT.v : EXT.h;
      pan.x = clamp(pan.x - dx * wpp, -ext.ex, ext.ex);
      pan.y = clamp(pan.y + dy * wpp, -ext.ey, ext.ey);
      panT.copy(pan);
    }
    invalidate();
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    lastInteract = performance.now();
    if (pointers.size === 0 && drag) {
      const wasTap = !drag.moved && performance.now() - drag.t < 600;
      dragging = false;
      if (wasTap) { omega.set(0, 0, 0); onTap(e.clientX, e.clientY); }
      else if (state.mode === 'planet' && performance.now() - drag.lastT > 90) omega.set(0, 0, 0);
      drag = null;
    }
    if (pointers.size < 2) pinchStart = 0;
    invalidate();
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (intro) return;
    const f = Math.exp(e.deltaY * 0.0012);
    if (state.mode === 'planet') state.zoomP = clamp(state.zoomP * f, minZoomP(), 1.5);
    else {
      state.zoomH = clamp(state.zoomH * f, 0.4, 1.35);
      if (state.zoomH >= 0.92) panT.set(0, 0);
    }
    invalidate();
  }, { passive: false });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); handlers.onContextLost && handlers.onContextLost(); });
  canvas.addEventListener('webglcontextrestored', () => invalidate());

  // ----- 迴圈（render-on-demand） -----
  let raf = 0, last = 0, running = false;
  const frameTimes = [];
  let qSamples = [];
  let lastDebug = 0;
  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector3();

  function invalidate() {
    lastWake = performance.now();
    onlyAmbient = false;
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function update(dt, now) {
    if (intro) return updateIntro(dt, now);
    let active = false;
    if (flight) {
      const u = Math.min(1, (now - flight.t0) / flight.dur);
      const e = ease(u);
      planet.quaternion.copy(flight.fromQ).slerp(flight.toQ, e);
      state.zoomP = lerp(flight.fromZoom, flight.toZoom, e);
      state.k = Math.max(0, lerp(flight.fromK, flight.toK, e) - flight.dip * Math.sin(Math.PI * e));
      if (flight.toHallIdx >= 0 && !flight.swapped && u >= 0.5) { flight.swapped = true; state.hallVis = flight.toHallIdx; }
      if (u >= 1) { if (flight.toHallIdx >= 0) state.hallVis = flight.toHallIdx; flight = null; } else active = true;
    } else {
      if (!dragging && omega.lengthSq() > 1e-6) {
        const ang = omega.length() * dt;
        rotatePlanet(omega, ang);
        omega.multiplyScalar(Math.exp(-dt / 0.55));
        if (omega.length() < 0.03) omega.set(0, 0, 0);
        active = true;
      } else if (state.mode === 'planet' && !dragging && now - lastInteract > 450 && !reducedMotion && groundBlend() < 0.05) {
        const q = planet.quaternion;
        const cur = tmpV.set(0, 1, 0).applyQuaternion(q);
        const want = tmpN.set(0, Math.cos(TILT), Math.sin(TILT));
        const full = new THREE.Quaternion().setFromUnitVectors(cur, want);
        const ang = 2 * Math.acos(clamp(full.w, -1, 1));
        if (ang > 0.004) {
          const part = new THREE.Quaternion().slerp(full, 1 - Math.exp(-dt / 0.6));
          q.premultiply(part);
          active = true;
        }
      }
      if (pointers.size > 0) active = true;
    }
    { // 剛放大到地面時，自動站到最近的單元站前面
      const gb = groundBlend();
      if (gb < 0.08) walkSnapped = false;
      else if (gb > 0.25 && !walkSnapped && !flight && state.mode === 'planet') { walkSnapped = true; snapToNearestStop(); active = true; }
    }
    // 站在地面時，鏡頭高度跟著地形慢慢起伏
    if (groundBlend() > 0.02) {
      const ht = groundTargetH();
      if (Math.abs(ht - groundH) > 0.004) { groundH += (ht - groundH) * (1 - Math.exp(-dt / 0.12)); active = true; }
    }
    // 地圖版面隨螢幕形狀調整
    const wv = wantVertical();
    if (wv !== state.curV) { state.curV = wv; }
    const hv = hallObjs[state.hallVis];
    if (hv && hv.layoutV !== state.curV) layoutHall(hv, state.curV);
    // 鏡頭平移
    if (!dragging && (Math.abs(panT.x - pan.x) > 0.01 || Math.abs(panT.y - pan.y) > 0.01)) {
      const k = 1 - Math.exp(-dt / 0.14);
      pan.x += (panT.x - pan.x) * k; pan.y += (panT.y - pan.y) * k;
      active = true;
    }
    // 單元站的跳動與放大
    for (const h of hallObjs) {
      if (!h.map.visible) continue;
      for (const e of h.exhibits) {
        const ds = e.target - e.size, dh = e.hopTarget - e.hop;
        if (Math.abs(ds) > 0.005 || Math.abs(dh) > 0.005) {
          const k = 1 - Math.exp(-dt / 0.09);
          e.size += ds * k; e.hop += dh * k;
          e.sprite.scale.set(e.size * e.aspect, e.size, 1);
          e.sprite.position.y = 1.75 + e.hop;
          active = true;
        }
      }
    }
    if (ambientOn(now)) { ambientStep(dt, now); onlyAmbient = !active; active = true; }
    else onlyAmbient = false;
    if (shuttle.visible) orbitShuttle(dt);
    return active;
  }

  function emitFrame() {
    if (!handlers.onFrame) return;
    const info = {};
    const sceneHidden = state.k > 0.3 || groundBlend() > 0.12;
    info.plates = hallObjs.map((h, i) => {
      h.anchor.getWorldPosition(tmpV);
      tmpN.copy(hallDirs[i]).applyQuaternion(planet.quaternion);
      const show = !sceneHidden && tmpN.z > 0.12;
      tmpV.project(camera);
      return { id: h.hall.id, x: (tmpV.x * 0.5 + 0.5) * W, y: (-tmpV.y * 0.5 + 0.5) * H, show };
    });
    if (state.mode === 'hall' && !flight && state.hallVis >= 0) {
      const h = hallObjs[state.hallVis];
      const ex = h.exhibits[h.focus];
      if (ex) {
        ex.sprite.getWorldPosition(tmpV);
        tmpV.project(camera);
        info.focus = { x: (tmpV.x * 0.5 + 0.5) * W, y: (-tmpV.y * 0.5 + 0.5) * H - 34, show: true };
      }
    } else info.focus = { x: 0, y: 0, show: false };
    handlers.onFrame(info);
  }

  function frame(now) {
    raf = 0;
    const ambientFrame = onlyAmbient;
    if (ambientFrame && now - last < 30) { raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const active = update(dt, now);
    applyVisibility();
    applyCamera();
    starGroup.position.copy(camera.position);
    sky.position.copy(camera.position);
    skyU.uUp.value.copy(camera.position).normalize();
    scene.updateMatrixWorld(true);
    emitFrame();
    renderer.render(scene, camera);
    if (!quality && !ambientFrame && !onlyAmbient) { // 品質自動降級：只降不升（背景小動畫刻意 30 fps，不算）
      qSamples.push(dt);
      if (qSamples.length >= 70) {
        const avg = qSamples.reduce((a, b) => a + b, 0) / qSamples.length;
        qSamples = [];
        const next = PR_STEPS.find(s => s < pixelRatio - 0.01);
        if (avg > 0.022 && next) { pixelRatio = next; resize(); }
      }
    }
    frameTimes.push(dt);
    if (frameTimes.length > 40) frameTimes.shift();
    if (debugEl && now - lastDebug > 250) { lastDebug = now; writeDebug(false); }
    if (active) raf = requestAnimationFrame(frame);
    else { running = false; qSamples = []; if (debugEl) writeDebug(true); }
  }

  function stats() {
    const avg = frameTimes.length ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length : 0;
    const info = renderer.info;
    return {
      idle: !running,
      fps: avg ? Math.round(1 / avg) : 0,
      frameMs: +(avg * 1000).toFixed(1),
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      pixelRatio,
      mode: state.mode,
      k: +state.k.toFixed(2),
    };
  }
  function writeDebug(idle) {
    const s = stats();
    debugEl.hidden = false;
    debugEl.textContent =
      (idle ? 'IDLE (0 fps)  last ' : 'ACTIVE ') + s.fps + ' fps  ' + s.frameMs + ' ms\n' +
      'calls ' + s.calls + '  tris ' + s.triangles + '\n' +
      'geo ' + s.geometries + '  tex ' + s.textures + '  pr ' + s.pixelRatio + '\n' +
      s.mode + ' k=' + s.k;
  }

  loadCovers();

  // ----- 啟動 -----
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();
  state.curV = wantVertical();
  invalidate();

  // 四館的平面地圖在背景一館一館先建好（開場、手指在畫面上、正在飛或轉的時候先不建）
  let destroyed = false;
  function prebuildMaps() {
    if (destroyed) return;
    const h = hallObjs.find(x => !x.ground);
    if (!h) return;
    if (intro || pointers.size || flight || omega.lengthSq() > 1e-4) { setTimeout(prebuildMaps, 800); return; }
    ensureGround(h);
    setTimeout(prebuildMaps, 500);
  }
  setTimeout(prebuildMaps, 2500);

  return {
    beginIntro,
    playIntro,
    skipIntro,
    flyToHall,
    flyToPlanet,
    focusUnit,
    setSheetFraction(f, axis) { state.sheetF = clamp(f, 0, 0.9); state.sheetAxis = axis === 'x' ? 'x' : 'y'; invalidate(); },
    stats,
    // 檢查用：直接設定星球角度（尤拉角，弧度）與縮放
    debugPose(rx, ry, rz, zoom = 1) { flight = null; omega.set(0, 0, 0); planet.quaternion.setFromEuler(new THREE.Euler(rx, ry, rz)); state.zoomP = zoom; lastInteract = performance.now() + 1e9; invalidate(); },
    // 錄影用：站在某座館雕像前方 a 單位處，面向雕像（a 越小越靠近）
    debugWalk(hallId, a, beta = 0) {
      const hi = halls.findIndex(h => h.id === hallId);
      if (hi < 0) return;
      const { n, E } = bases[hi];
      const Zl = new THREE.Vector3().crossVectors(E, n).normalize();
      const ps = n.clone().normalize();
      const ang = a / R;
      const dirT = Zl.clone().multiplyScalar(Math.cos(beta)).addScaledVector(E, Math.sin(beta));
      const f = ps.clone().multiplyScalar(Math.cos(ang)).addScaledVector(dirT, Math.sin(ang)).normalize();
      const t = ps.clone().addScaledVector(f, -ps.dot(f)).normalize();
      const r = new THREE.Vector3().crossVectors(t, f);
      const Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, t, f).invert());
      flight = null; omega.set(0, 0, 0);
      state.mode = 'planet'; state.k = 0; state.zoomP = minZoomP();
      planet.quaternion.copy(Q);
      walkSnapped = true; lastInteract = performance.now() + 1e9;
      groundH = groundTargetH();
      invalidate();
    },
    // 錄影用：把星球轉到某座館正對鏡頭（含傾斜），回傳 true
    faceHall(hallId) {
      const hi = halls.findIndex(h => h.id === hallId);
      if (hi < 0) return false;
      state.mode = 'planet';
      const want = new THREE.Vector3(0, Math.sin(0.28), Math.cos(0.28)).normalize();
      startFlight(new THREE.Quaternion().setFromUnitVectors(bases[hi].n.clone().normalize(), want), 0, false, 0, -1);
      return true;
    },
    // 錄影用：顯示／隱藏路邊的單元看板
    debugSigns(v) { signSprites.forEach(sp => { sp.visible = !!v; }); invalidate(); },
    // 錄影用：目前模式與狀態
    debugState() { return { mode: state.mode, k: state.k, zoomP: state.zoomP, gb: groundBlend(), flight: !!flight, intro: !!intro }; },
    // 檢查用：把開場停在某個進度 u（0～1）
    debugIntro(u) { if (!intro) beginIntro(); intro.phase = 'fly'; intro.fixedU = u; invalidate(); },
    // 檢查用：回傳某個東西在畫面上的位置（像素）
    debugScreen(kind, id) {
      applyVisibility(); applyCamera(); scene.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      if (kind === 'shuttle') shuttle.getWorldPosition(v);
      else if (kind === 'unit') { const i = unitIndex.get(id); hallObjs[i.hall].exhibits[i.index].sprite.getWorldPosition(v); }
      else { const h = hallObjs[halls.findIndex(x => x.id === id)]; h.statueProxies[0].getWorldPosition(v); }
      v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      running = false;
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* ignore */ }
    },
  };
}
