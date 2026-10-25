// 伽利略星球的 3D 場景（Three.js r170，卡通描邊，全部用程式碼拼幾何，不用外部模型或貼圖）。
// 規格見 galileo-planet/PLAN.md §4、§5、§11。重點：
//   - 球外：39 個單元地標佈滿四個館的區域（只看不能點，點到就是點那一館）
//   - 進館：鏡頭轉成近乎正上方，球體淡出，剩下這一館的「平面地圖」（彎路＋單元站＋通往隔壁館的出口）
//   - render-on-demand：沒有動作時完全停止繪圖（0 fps）
import * as THREE from './vendor/three.module.min.js';

const R = 10;                 // 星球半徑
const PLATEAU_TOP = R + 0.2;  // 館的平台頂面離球心的距離
const TILT = 0.35;            // 星球預設的「北極朝向觀眾」傾角
const TAU = Math.PI * 2;
const INK = 0x0b1a15;         // 描邊色（不用純黑）
const HALL_PITCH = 0.42;      // 館層鏡頭與正上方的夾角（弧度）；0＝完全俯視
const MAP_Y = 0.16;           // 地圖面高度（相對館的平台）
const DISC_R = 14.4;          // 地圖底盤半徑
// 地圖在兩種版型下需要塞進畫面的半寬、半高（世界單位）
const EXT = { v: { ex: 6.8, ey: 11.4 }, h: { ex: 12.4, ey: 6.8 } };
const PROP_COUNT = 64;       // 每館的特色小景數量
const E_FLAT = 0.2;           // 廣場、道路、單元站壓平後的高度
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
  P(new THREE.ConeGeometry(0.2, 0.5, 6), M(0, 3.1, 0.2, Math.PI, 0, 0), STONE);          // 鬍子
  P(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 7), M(0.62, 3.45, 0, 0, 0, -0.55), STONE); // 舉起的手臂
  if (hall.id === 'physics') {          // 伽利略：望遠鏡；牛頓的蘋果放在座上
    P(new THREE.CylinderGeometry(0.09, 0.16, 1.7, 8), M(1.15, 4.25, 0, 0, 0, -0.95), 0xc9a24a);
    P(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 8), M(0.55, 3.62, 0, 0, 0, -0.95), 0x6b4f3a);
    P(new THREE.SphereGeometry(0.2, 8, 6), M(0.62, 0.7, 0.62), 0xe0483a);
    P(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 4), M(0.62, 0.92, 0.62), 0x5a3a22, true);
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
      P(new THREE.SphereGeometry(0.85, 16, 8, 0, TAU, Math.PI * 0.69, Math.PI * 0.31), M(0, 1.4, 0, -0.9, 0, 0), 0xf4f4ee);
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
      [[0, 2.85, 0, 0.3], [0.18, 3.35, 0.05, 0.42], [-0.1, 3.95, 0, 0.56]].forEach(([x, y, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), M(x, y, z), 0xe2dfdb));
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
      [[0, 2.2, 0, 0.36], [0.2, 2.75, 0.05, 0.5], [-0.15, 3.4, 0, 0.66]].forEach(([x, y, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), M(x, y, z), 0xd8d4d0));
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
  physics: [['dome', 2], ['dish', 2], ['pendulum', 2], ['magnet', 2], ['prism', 2], ['tesla', 2]],
  chemistry: [['erlenmeyer', 3], ['round', 2], ['rack', 2], ['crystal', 3], ['chimney', 2], ['bunsen', 2]],
  earth: [['volcano', 3], ['mountain', 4], ['strata', 2], ['boulders', 2], ['weather', 1]],
  biology: [['broad', 4], ['pine', 3], ['sakura', 2], ['bush', 2], ['mushroom', 2]],
};
function pickKind(hallId, x) {
  const list = PROP_KINDS[hallId], total = list.reduce((a, b) => a + b[1], 0);
  let t = x * total;
  for (const [k, w] of list) { if ((t -= w) < 0) return k; }
  return list[0][0];
}

// ---------- 地形：球外與地標共用 ----------
function makeTerrain(hallDirs) {
  const ctx = { roads: null, nodes: null };
  const arcTo = (d, pts) => { // 到折線的最短弧長（先每隔幾點粗找，再細找）
    let bi = 0, bd = -2;
    for (let k = 0; k < pts.length; k += 6) { const p = pts[k]; const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bd) { bd = dd; bi = k; } }
    for (let k = Math.max(0, bi - 6); k <= Math.min(pts.length - 1, bi + 6); k++) { const p = pts[k]; const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bd) bd = dd; }
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
    let rd = 99, nd = 99, pd = 99;
    if (ctx.roads && mask > 0.05) {
      pd = R * Math.acos(clamp(bestDot, -1, 1));
      rd = arcTo(d, ctx.roads[best]);
      let bn = -2;
      for (const p of ctx.nodes[best]) { const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bn) bn = dd; }
      nd = R * Math.acos(clamp(bn, -1, 1));
      if (n > 0.5) { // 廣場、道路、單元站周圍壓平
        const flat = Math.max(1 - smooth(1.9, 3.0, pd), 1 - smooth(0.45, 1.4, rd), 1 - smooth(0.9, 1.8, nd));
        e = lerp(e, E_FLAT, flat);
      }
    }
    return { n, e, hall: best, mask, rd, nd, pd };
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
export async function createScene({ canvas, halls, reducedMotion, quality, debugEl, handlers }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dprCap = quality === 'low' ? 1 : quality === 'mid' ? 1.5 : 2;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
  const PR_STEPS = [2, 1.5, 1.25, 1];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.4, 800);

  const gradient = makeGradient();
  const toonMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  const hullMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  const planetMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, transparent: true });
  const planetHullMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, transparent: true });
  const hiddenMat = new THREE.MeshBasicMaterial({ visible: false });

  scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x20322b, 1.35));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
  sun.position.set(-16, 22, 30);
  scene.add(sun);

  // 星星（不跟著星球轉）
  {
    const n = 260, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1), r = 200 + Math.random() * 160;
      arr[i * 3] = r * Math.sin(v) * Math.cos(u);
      arr[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
      arr[i * 3 + 2] = r * Math.cos(v) - 80;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf6f3ea, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.75, depthWrite: false })));
  }

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

  // ----- 星球本體：六角形磚塊（預設約 10 萬片；?hex=NN 可調，NN 為頻率，磚數≈10×NN²） -----
  const planet = new THREE.Group();
  scene.add(planet);
  const planetMeshes = [];
  const HEXF = clamp(parseInt(new URLSearchParams(location.search).get('hex') || '100', 10) || 100, 16, 150);
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

    // 3) 配色用的調色盤
    const tc3 = new THREE.Color();
    const hallCol = halls.map(h => new THREE.Color(h.color));
    const landPal = hallCol.map((c, i) => {
      const base = c.clone(); if (halls[i].id === 'earth') base.lerp(new THREE.Color(0xffffff), 0.12);
      return [base.clone().multiplyScalar(0.86), base.clone(), base.clone().lerp(new THREE.Color(0xfff6e0), 0.22)];
    });
    const OCEAN = [new THREE.Color(0x1d5a88), new THREE.Color(0x25679a)], SHORE = new THREE.Color(0x3f9cc4), SAND = new THREE.Color(0xf0e2b0);
    const PLAZA = new THREE.Color(0xe9e2cf), ROAD = new THREE.Color(0xfff0c8), NODE_C = hallCol.map(c => c.clone().multiplyScalar(0.55));
    const roadHalf = 0.3, nodeR = 0.62; // 單位：球面弧長
    const cosRoad = Math.cos(roadHalf / R), cosNode = Math.cos(nodeR / R);

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
      // 顏色
      let c;
      if (tr.n <= 0.5) c = tr.n > 0.44 ? SHORE : OCEAN[(v * 7919) % 2];
      else if (tr.n < 0.56) c = SAND;
      else {
        const pal = landPal[tr.hall];
        c = pal[tr.e > 0.78 ? 2 : (hash3(v * 0.013, 1.7, 2.9) > 0.5 ? 1 : 0)];
        if (tr.nd < nodeR) c = NODE_C[tr.hall];
        else if (tr.rd < roadHalf) c = ROAD;
        else if (tr.pd < 1.9) c = PLAZA;
      }
      const jit = 0.93 + 0.14 * hash3(v * 0.37, 3.1, 0.7);
      const r8 = Math.min(255, Math.round(c.r * jit * 255)), g8 = Math.min(255, Math.round(c.g * jit * 255)), b8 = Math.min(255, Math.round(c.b * jit * 255));
      const base = v * 7;
      const rc = R + tr.e;
      pos[base * 3] = x * rc; pos[base * 3 + 1] = y * rc; pos[base * 3 + 2] = z * rc;
      for (let k = 0; k < 6; k++) {
        const t = ring[Math.min(k, ring.length - 1)];
        const rr = R + ce[t], o = (base + 1 + k) * 3;
        pos[o] = cx[t] * rr; pos[o + 1] = cy[t] * rr; pos[o + 2] = cz[t] * rr;
      }
      for (let k = 0; k < 7; k++) { const o = (base + k) * 3; col[o] = r8; col[o + 1] = g8; col[o + 2] = b8; }
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
    const outline = new THREE.Mesh(new THREE.IcosahedronGeometry(R + 0.42, 5), planetHullMat);
    planet.add(body, outline);
    planetMeshes.push(body, outline);
  }


  // ----- 雲 -----
  const clouds = (() => {
    const blobs = [];
    const dir = new THREE.Vector3();
    let guard = 0;
    while (blobs.length < 22 && guard++ < 600) {
      dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      if (hallDirs.some(h => dir.dot(h) > 0.93)) continue; // 不要遮到館
      const centre = dir.clone().multiplyScalar(R + 4.4 + Math.random() * 0.8);
      const tangent = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0.3)).normalize();
      const count = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count && blobs.length < 22; i++) {
        blobs.push({ p: centre.clone().addScaledVector(tangent, (i - count / 2) * 1.05), s: 0.6 + Math.random() * 0.6 });
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient }), blobs.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    blobs.forEach((b, i) => {
      q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
      sc.set(b.s * 1.5, b.s * 0.85, b.s * 1.1);
      m.compose(b.p, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    planet.add(mesh);
    return mesh;
  })();

  // ----- 球外的單元地標（只看不能點）：站在路上的每一站，立著用封面做的小牌子 -----
  const landmarks = new THREE.Group();
  planet.add(landmarks);
  const signs = new Map(); // unitId -> [{sprite, h, ex}]
  const signSprites = [];
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
    for (let tries = 0; placed.length < PROP_COUNT && tries < 2400; tries++) {
      const a = hash3(hi * 9.1, tries * 1.37, 2.2) * TAU, r = 0.22 + 0.7 * Math.sqrt(hash3(hi * 3.3, tries * 0.71, 5.5));
      tan.copy(E).multiplyScalar(Math.cos(a)).addScaledVector(Np, Math.sin(a));
      dd.copy(n).multiplyScalar(Math.cos(r)).addScaledVector(tan, Math.sin(r)).normalize();
      const t = terrain(dd);
      if (t.hall !== hi || t.mask < 0.55 || t.n < 0.62 || t.rd < 1.7 || t.nd < 2.4 || t.pd < 3.4) continue;
      if (placed.some(pp => pp.dot(dd) > Math.cos(1.55 / R))) continue;
      placed.push(dd.clone());
      const q = new THREE.Quaternion().setFromUnitVectors(up, dd).multiply(new THREE.Quaternion().setFromAxisAngle(up, hash3(tries, hi, 1.1) * TAU));
      const kind = pickKind(hall.id, hash3(tries * 0.7, hi, 8.8));
      const big = (kind === 'volcano' || kind === 'mountain') ? 1.15 : 0.85;
      const sc = big + 0.45 * hash3(tries, hi, 4.4);
      const bm = new THREE.Matrix4().compose(dd.clone().multiplyScalar(R + t.e - 0.05), q, new THREE.Vector3(sc, sc, sc));
      for (const pt of propParts(hall, kind, k => hash3(tries * 1.9 + k, hi * 2.3, 6.1))) { pt.m = bm.clone().multiply(pt.m); parts.push(pt); }
    }
    const mg = buildMerged(parts, 0.05);
    landmarks.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
  });

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
    const iconP = new THREE.Group();
    iconP.add(new THREE.Mesh(sg.body, toonMat), new THREE.Mesh(sg.hull, hullMat));
    g.add(iconP);

    const anchor = new THREE.Object3D();
    anchor.position.y = 6.0;
    g.add(anchor);

    // ----- 平面地圖（進館後才看得到） -----
    const map = new THREE.Group();
    map.position.y = MAP_Y;
    map.visible = false;
    g.add(map);

    // 底盤：米色紙面＋館色邊框，一次合成
    {
      const mp = [
        { g: new THREE.CylinderGeometry(DISC_R + 0.55, DISC_R + 0.8, 0.5, 48), m: M(0, -0.28, 0), color: col.clone().multiplyScalar(0.6) },
        { g: new THREE.CylinderGeometry(DISC_R, DISC_R, 0.14, 48), m: M(0, -0.07, 0), color: new THREE.Color(0xefe5c6), noHull: true },
      ];
      // 地圖上的小裝飾：館色小圓點，散在紙面上
      for (let i = 0; i < 26; i++) {
        const a = hash3(i * 1.7, hi * 3.1, 1.3) * TAU, r = 3 + hash3(i * 2.3, hi, 7.7) * (DISC_R - 4);
        mp.push({ g: new THREE.CylinderGeometry(0.22 + hash3(i, hi, 2) * 0.2, 0.22 + hash3(i, hi, 2) * 0.2, 0.04, 8), m: M(Math.cos(a) * r, 0.0, Math.sin(a) * r), color: col.clone().lerp(new THREE.Color(0xefe5c6), 0.55), noHull: true });
      }
      const mm = buildMerged(mp, 0.08);
      map.add(new THREE.Mesh(mm.body, toonMat), new THREE.Mesh(mm.hull, hullMat));
    }
    const pathHolder = new THREE.Group();
    map.add(pathHolder);
    const iconMap = new THREE.Group();
    iconMap.add(new THREE.Mesh(sg.body, toonMat), new THREE.Mesh(sg.hull, hullMat));
    iconMap.scale.setScalar(0.8);
    map.add(iconMap);

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
      map.add(ex);
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
    map.add(focusRing);

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
      map.add(gg);
      gates.push({ group: gg, toIndex: oj });
      gateProxies.push(gx);
    });

    hallObjs.push({
      hall, group: g, map, anchor, icon: iconP, iconMap, exhibits, exProxies, gates, gateProxies, focusRing, pathHolder, N,
      q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, bases[hi].Np, n)).invert(),
      focus: 0, layoutV: null, nodes: [],
    });
  });

  // ----- 地圖版面：彎路與單元站（直式螢幕走直路，橫式螢幕走橫路） -----
  const pathMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  function layoutHall(h, vertical) {
    h.layoutV = vertical;
    const N = h.N;
    const curve = curveFor(vertical, N);
    // 單元站
    h.nodes = [];
    h.exhibits.forEach((e, i) => {
      const t = N === 1 ? 0.5 : i / (N - 1);
      const p = curve(t);
      e.group.position.set(p.x, 0, p.z);
      h.nodes.push(new THREE.Vector3(p.x, 0, p.z));
    });
    // 路：沿曲線切成小方塊，合成一個網格
    const parts = [];
    const col = new THREE.Color(0xfff0c8);
    const steps = 70;
    for (let s = 0; s < steps; s++) {
      const t0 = -0.05 + (1.1 * s) / steps, t1 = -0.05 + (1.1 * (s + 1)) / steps;
      const a = curve(t0), b = curve(t1);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const ang = Math.atan2(b.x - a.x, b.z - a.z);
      parts.push({
        g: new THREE.BoxGeometry(0.62, 0.06, len + 0.08),
        m: new THREE.Matrix4().compose(
          new THREE.Vector3((a.x + b.x) / 2, 0.04, (a.z + b.z) / 2),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ang, 0)),
          new THREE.Vector3(1, 1, 1)),
        color: col, noHull: true,
      });
    }
    h.pathHolder.children.slice().forEach(c => { c.geometry.dispose(); h.pathHolder.remove(c); });
    const mg = buildMerged(parts, 0);
    h.pathHolder.add(new THREE.Mesh(mg.body, pathMat));
    placeFocus(h);
    const sp0 = curve(-0.16);
    h.iconMap.position.set(sp0.x, 0, sp0.z);
    // 出口：沿著「隔壁館所在的方向」放在地圖邊緣
    const { E, Np } = bases[hallObjs.indexOf(h)];
    const ext = vertical ? EXT.v : EXT.h;
    h.gates.forEach(gt => {
      const od = hallDirs[gt.toIndex];
      let dx = od.dot(E), dz = -od.dot(Np); // 本地 x 往右、z 往螢幕下方
      const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const k = Math.min((ext.ex - 1.2) / Math.max(Math.abs(dx), 1e-3), (ext.ey - 1.4) / Math.max(Math.abs(dz), 1e-3));
      gt.group.position.set(dx * k, 0, dz * k);
    });
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
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
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
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
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
    hallObjs.forEach(h => { h.icon.visible = k < 0.5; });
    clouds.visible = k < 0.35;
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
    const nd = h.nodes[h.focus];
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
      h.focusRing.position.set(nd.x, 0.04, nd.z);
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
    if (flight) return;
    const rect = canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(ndc, camera);
    if (state.mode === 'planet' && groundBlend() > 0.5) {
      const hit = raycaster.intersectObjects(signSprites, false)[0];
      if (hit && handlers.onUnitPick) handlers.onUnitPick(hit.object.userData.hallId, hit.object.userData.unitId);
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
      const hit = raycaster.intersectObjects(h.exProxies.concat(h.gateProxies), false)[0];
      if (hit) {
        const d = hit.object.userData;
        if (d.gateHall) handlers.onHallPick(d.gateHall);
        else { focusUnit(d.unitId, false); handlers.onExhibitPick(d.unitId); }
      }
    }
  }

  canvas.addEventListener('pointerdown', e => {
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
      const wpp = (2 * hallDistance() * state.zoomH * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / H;
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
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function update(dt, now) {
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
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const active = update(dt, now);
    applyVisibility();
    applyCamera();
    scene.updateMatrixWorld(true);
    emitFrame();
    renderer.render(scene, camera);
    if (!quality) { // 品質自動降級：只降不升
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

  return {
    flyToHall,
    flyToPlanet,
    focusUnit,
    setSheetFraction(f, axis) { state.sheetF = clamp(f, 0, 0.9); state.sheetAxis = axis === 'x' ? 'x' : 'y'; invalidate(); },
    stats,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      running = false;
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* ignore */ }
    },
  };
}
