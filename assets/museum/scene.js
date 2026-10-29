// 伽利略星球的 3D 場景（Three.js r170，卡通描邊，全部用程式碼拼幾何，不用外部模型或貼圖）。
// 規格見 galileo-planet/PLAN.md §4、§5、§11。重點：
//   - 球外：39 個單元地標佈滿四個館的區域（只看不能點，點到就是點那一館）
//   - 進館：鏡頭轉成近乎正上方，球體淡出，剩下這一館的「平面地圖」（領土＋單元站＋通往隔壁館的出口）
//   - 領土：每館陸地切成 N 塊（N＝單元數），一個單元一塊；見 makeTerrain 與 territorySlots
//   - render-on-demand：沒有動作時完全停止繪圖（0 fps）
import * as THREE from './vendor/three.module.min.js';
import { buildShuttle } from './shuttle3d.js?v=20261027l';

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
const E_FLAT = 0.2;           // 廣場、單元站壓平後的高度
const PLANET_ITEM_S = 0.75;   // 單元小物品在球面上的縮放（館內地圖＝1）
const PLANET_SIGN_H = 0.72;   // 有小物品時，球面上封面小牌子的高度（原本 1.1）
const MAP_SIGN = { size: 0.9, focus: 1.15, gap: 0.12, back: 0.7 }; // 館內地圖：封面小牌子的高度、選中時的高度、和物品在畫面上的間隔、往後（北）退多少
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

// 沿「同一位置的平均面法線」往外推 w：粗細一致的描邊外殼（細長零件用；expandGeo 對細長零件幾乎沒有描邊）
function inflateGeo(g, w) {
  const pa = g.attributes.position.array, n = pa.length / 3;
  const acc = new Map(), keys = new Array(n);
  const ax = new THREE.Vector3(), bx = new THREE.Vector3(), cx = new THREE.Vector3();
  for (let t = 0; t + 2 < n; t += 3) {
    ax.fromArray(pa, t * 3); bx.fromArray(pa, t * 3 + 3); cx.fromArray(pa, t * 3 + 6);
    cx.sub(bx); bx.sub(ax); bx.cross(cx);
    const l = bx.length();
    for (let k = 0; k < 3; k++) {
      const i = (t + k) * 3;
      const key = Math.round(pa[i] * 2e3) + ',' + Math.round(pa[i + 1] * 2e3) + ',' + Math.round(pa[i + 2] * 2e3);
      keys[t + k] = key;
      let a = acc.get(key);
      if (!a) { a = [0, 0, 0]; acc.set(key, a); }
      if (l > 1e-12) { a[0] += bx.x / l; a[1] += bx.y / l; a[2] += bx.z / l; }
    }
  }
  const out = new Float32Array(pa.length);
  for (let i = 0; i < n; i++) {
    const a = acc.get(keys[i]), l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i * 3] = pa[i * 3] + w * a[0] / l; out[i * 3 + 1] = pa[i * 3 + 1] + w * a[1] / l; out[i * 3 + 2] = pa[i * 3 + 2] + w * a[2] / l;
  }
  return out;
}

// parts: [{g: BufferGeometry, m: Matrix4, color: Color, noHull?: boolean, glass?: boolean}]
// 回傳 {body, hull, glass}：body 帶頂點色（平面著色），hull 是各零件各自放大一圈的描邊外殼；
// glass＝標了 glass 的零件（半透明另畫，沒有描邊；沒有就是 null）。
// opt.inflate：描邊改用 inflateGeo（粗細一致）。
function buildMerged(parts, hullWidth, opt = {}) {
  const pos = [], nor = [], col = [], hpos = [];
  const gpos = [], gnor = [], gcol = [];
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    g.applyMatrix4(p.m);
    g.computeVertexNormals();
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    const P = p.glass ? gpos : pos, N = p.glass ? gnor : nor, C = p.glass ? gcol : col;
    for (let i = 0; i < pa.length; i++) { P.push(pa[i]); N.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) { C.push(p.color.r, p.color.g, p.color.b); if (p.glass) C.push(p.alpha == null ? 0.4 : p.alpha); }
    if (hullWidth > 0 && !p.noHull && !p.glass) {
      if (opt.inflate) {
        const ha = inflateGeo(g, hullWidth);
        for (let i = 0; i < ha.length; i++) hpos.push(ha[i]);
      } else {
        const h = expandGeo(g.clone(), hullWidth);
        const ha = h.attributes.position.array;
        for (let i = 0; i < ha.length; i++) hpos.push(ha[i]);
        h.dispose();
      }
    }
    g.dispose();
    p.g.dispose();
  }
  const mk = (P, N, C, cs) => {
    const b = new THREE.BufferGeometry();
    b.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    b.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    b.setAttribute('color', new THREE.Float32BufferAttribute(C, cs));
    return b;
  };
  const body = mk(pos, nor, col, 3);
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(hpos, 3));
  return { body, hull, glass: gpos.length ? mk(gpos, gnor, gcol, 4) : null }; // 玻璃的顏色帶 alpha（每個零件各自的透明度）
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

// ---------- 各館的特色小景（散在館的區域，不壓到單元站）：每種都是多個零件拼成 ----------
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
  // 物理館：單元站上已經有「和單元內容相關的小物品」，通用小景只留少量樹與灌木當景觀（20261029b）
  physics: [['broad', 3], ['bush', 4], ['pine', 2]],
  // 化學館：單元站已有小物品（燒瓶、燒杯、高爐都在站上），通用小景只留少量礦物結晶與樹叢當景觀（20261029d）
  chemistry: [['crystal', 3], ['bush', 3], ['broad', 2]],
  // 地科館：單元站已有小物品（含火山、氣象站），通用小景只留少量山、巨石、松樹當景觀（20261029c）
  earth: [['mountain', 2], ['boulders', 3], ['pine', 4]],
  biology: [['broad', 4], ['pine', 3], ['sakura', 2], ['bush', 2], ['mushroom', 2]],
};
const TREE_KINDS = new Set(['broad', 'pine', 'sakura', 'bush']);
const HERO_KIND = { physics: 'broad', chemistry: 'crystal', earth: 'mountain', biology: 'broad' }; // 每館先放兩個大一點的代表物
// 每館的造景數量與「離單元站至少多遠」（球面弧長）。有單元小物品的館：造景少、離站遠，不壓到小物品
const PROP_RULE = { physics: { count: 34, nd: 3.6 }, chemistry: { count: 32, nd: 3.6 }, earth: { count: 30, nd: 3.6 } };
function pickKind(hallId, x) {
  const list = PROP_KINDS[hallId], total = list.reduce((a, b) => a + b[1], 0);
  let t = x * total;
  for (const [k, w] of list) { if ((t -= w) < 0) return k; }
  return list[0][0];
}

// ---------- 單元小物品：每館一張「單元 → 小物品」的表 ----------
// 新增一館：在 UNIT_ITEMS 補一張表（單元 id → 函式），函式照下面的寫法用 K 拼零件、回傳物品頂端高度。
// 座標：原點＝底座頂面中心，y 往上，+z 朝鏡頭（地圖的螢幕下方），+x 往右；物品大約落在半徑 1.15、高 1.2～1.9 之內。
// 零件規格：圓柱至少 20 段、球至少 16×12 段；每件（不含描邊）約 3000 個三角形以內。
const IC = {
  wood: 0xc99a62, woodD: 0x8a6342, brass: 0xd9b25a, steel: 0xcfd6d3, metalD: 0x55605c, cream: 0xf2ecd9,
  red: 0xe0483a, blue: 0x3a7be0, glass: 0xd4f1f7, water: 0x5fb8e6, ink: 0x2f4a52, white: 0xf7f8f2,
  orange: 0xf6a13a, yellow: 0xffe27a, green: 0x4fae60,
};
function itemKit() {
  const parts = [];
  const up = new THREE.Vector3(0, 1, 0), va = new THREE.Vector3(), vb = new THREE.Vector3();
  const K = {
    parts,
    add(g, m, c, o = {}) { parts.push({ g, m, color: new THREE.Color(c), noHull: !!o.noHull, glass: !!o.glass, alpha: o.alpha }); },
    // 圓柱：中心在 (x,y,z)
    cyl(rt, rb, h, x, y, z, c, o = {}) { K.add(new THREE.CylinderGeometry(rt, rb, h, o.seg || 22, 1, !!o.open), M(x, y, z, o.rx || 0, o.ry || 0, o.rz || 0), c, o); },
    sph(r, x, y, z, c, o = {}) {
      const g = new THREE.SphereGeometry(r, o.ws || 20, o.hs || 14);
      K.add(g, Ms(x, y, z, o.sx || 1, o.sy || 1, o.sz || 1, o.rx || 0, o.ry || 0, o.rz || 0), c, o);
    },
    box(w, h, d, x, y, z, c, o = {}) { K.add(new THREE.BoxGeometry(w, h, d), M(x, y, z, o.rx || 0, o.ry || 0, o.rz || 0), c, o); },
    // 環：預設躺平（在 xz 平面上）
    torus(r, t, x, y, z, c, o = {}) {
      K.add(new THREE.TorusGeometry(r, t, o.rs || 8, o.ts || 28, o.arc || TAU), M(x, y, z, o.rx == null ? Math.PI / 2 : o.rx, o.ry || 0, o.rz || 0), c, o);
    },
    // 兩點之間的細桿
    rod(a, b, r, c, o = {}) {
      va.set(...a); vb.set(...b);
      const len = va.distanceTo(vb), q = new THREE.Quaternion().setFromUnitVectors(up, vb.clone().sub(va).normalize());
      const m = new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
      K.add(new THREE.CylinderGeometry(r, o.r2 == null ? r : o.r2, len, o.seg || 20, 1, !!o.open), m, c, o);
    },
    // 沿著一串點的管子（導線、軌道、聲波弧）
    tube(pts, r, c, o = {}) {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), !!o.closed, o.type || 'centripetal');
      K.add(new THREE.TubeGeometry(curve, o.n || 40, r, o.rs || 8, !!o.closed), new THREE.Matrix4(), c, o);
      return curve;
    },
  };
  return K;
}

// 1 密度與質量：等臂天平＋量筒
function itemBalance(K) {
  const bx = -0.4;
  K.box(0.86, 0.1, 0.44, bx, 0.05, 0, IC.woodD);
  K.cyl(0.05, 0.065, 1.08, bx, 0.64, 0, IC.brass);
  K.box(1.24, 0.065, 0.08, bx, 1.2, 0, IC.brass);
  K.sph(0.075, bx, 1.24, 0, IC.brass, { ws: 16, hs: 12 });
  K.add(new THREE.ConeGeometry(0.035, 0.5, 16), M(bx, 0.93, 0.07, Math.PI, 0, 0), IC.ink);       // 指針
  K.box(0.26, 0.05, 0.02, bx, 0.62, 0.075, IC.cream, { noHull: true });                           // 刻度板
  for (const s of [-1, 1]) {
    const px = bx + s * 0.58;
    K.sph(0.035, px, 1.2, 0, IC.brass, { ws: 16, hs: 12 });
    for (const a of [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 + 4.189]) K.rod([px, 1.19, 0], [px + Math.cos(a) * 0.22, 0.64, Math.sin(a) * 0.22], 0.012, IC.metalD, { seg: 8, noHull: true });
    K.cyl(0.28, 0.21, 0.06, px, 0.61, 0, IC.brass);
  }
  // 左盤：砝碼；右盤：待測的方塊
  K.cyl(0.075, 0.075, 0.14, bx - 0.58, 0.71, 0, IC.steel);
  K.cyl(0.03, 0.03, 0.05, bx - 0.58, 0.8, 0, IC.steel, { seg: 20 });
  K.sph(0.035, bx - 0.58, 0.835, 0, IC.steel, { ws: 16, hs: 12 });
  K.box(0.17, 0.17, 0.17, bx + 0.58, 0.725, 0, IC.blue);
  // 量筒（玻璃、裝水、有刻度）
  const cx = 0.78;
  K.cyl(0.27, 0.29, 0.06, cx, 0.03, 0, IC.white);
  K.cyl(0.175, 0.175, 1.26, cx, 0.69, 0, IC.glass, { glass: true, open: true, seg: 28 });
  K.cyl(0.16, 0.16, 0.72, cx, 0.42, 0, IC.water, { seg: 28 });
  K.torus(0.175, 0.02, cx, 1.32, 0, IC.white, { rs: 4, ts: 28 });
  for (let i = 0; i < 10; i++) K.box(i % 2 ? 0.07 : 0.12, 0.014, 0.012, cx - (i % 2 ? 0.025 : 0), 0.2 + i * 0.11, 0.176, IC.ink, { noHull: true });
  return 1.33;
}

// 2 波動與聲波：共鳴箱上的音叉＋往兩邊傳出去的聲波弧
function itemTuningFork(K) {
  K.box(1.1, 0.36, 0.48, 0, 0.18, 0, IC.wood);
  K.box(0.02, 0.27, 0.36, 0.552, 0.18, 0, 0x3b2a1e, { noHull: true });                           // 共鳴箱的開口
  K.cyl(0.07, 0.08, 0.08, -0.05, 0.4, 0, IC.metalD);
  K.cyl(0.04, 0.04, 0.34, -0.05, 0.58, 0, IC.steel);
  K.torus(0.15, 0.045, -0.05, 0.86, 0, IC.steel, { rx: 0, rz: Math.PI, arc: Math.PI, ts: 24 });   // U 形底
  for (const s of [-1, 1]) K.cyl(0.045, 0.045, 0.78, -0.05 + s * 0.15, 1.25, 0, IC.steel, { seg: 20 });
  // 小橡膠槌
  K.rod([0.08, 0.38, 0.17], [0.5, 0.38, 0.3], 0.022, IC.woodD, { seg: 16 });
  K.sph(0.085, 0.04, 0.4, 0.16, IC.red, { ws: 16, hs: 12, sx: 1.4 });
  // 聲波：水平的弧（從上面看像「)))」），越外圈越細
  const cyY = 1.42;
  [0.42, 0.62, 0.82].forEach((r, i) => {
    for (const s of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 8; k++) { const t = -0.55 + 1.1 * k / 8; pts.push([-0.05 + s * r * Math.cos(t), cyY - i * 0.06, r * Math.sin(t)]); }
      K.tube(pts, 0.032 - i * 0.006, 0x8fdcf2, { n: 18, rs: 6 });
    }
  });
  return 1.64;
}

// 3 光學與透鏡：三稜鏡把白光分成彩虹＋立在支架上的凸透鏡
function itemOptics(K) {
  const px = -0.4, by = 0.42;
  K.cyl(0.36, 0.36, 0.78, px, 0.39, 0, 0xbfeaf5, { seg: 3, ry: Math.PI });                       // 三稜鏡（上面看是三角形）
  K.rod([-1.15, by, -0.02], [px - 0.16, by, 0.02], 0.026, IC.white, { seg: 12 });                // 白光
  ['#e0483a', '#f2a03a', '#f2e03a', '#4fae60', '#3a9be0', '#7a5ae0'].forEach((c, i) => {
    const a = 0.16 + i * 0.075, sx = px + 0.16, sz = 0.05;
    K.rod([sx, by, sz], [sx + Math.cos(a) * 0.95, by - 0.01 * i, sz + Math.sin(a) * 0.95], 0.022, c, { seg: 10, noHull: true });
  });
  // 凸透鏡：鏡片＋金屬框＋支架（從上面看是中間厚、兩邊薄的透鏡剖面）
  const lx = 0.32, lz = -0.42, ly = 0.98;
  K.cyl(0.2, 0.23, 0.06, lx, 0.03, lz, IC.metalD);
  K.cyl(0.035, 0.035, 0.58, lx, 0.35, lz, IC.steel, { seg: 20 });
  K.sph(0.36, lx, ly, lz, 0x9fe3ff, { sz: 0.2, rx: -0.75, ws: 32, hs: 20 });                     // 鏡面往後仰，從上面看是一片圓透鏡
  K.torus(0.36, 0.03, lx, ly, lz, IC.brass, { rx: -0.75, ts: 36, rs: 6 });
  // 三道平行光穿過透鏡、在後面會聚到焦點（從上面看是一個「>」）
  const fx = lx + 0.62, fy = ly - 0.12;
  for (const dy of [-0.2, 0, 0.2]) {
    K.rod([lx - 0.5, ly + dy, lz - dy * 0.4], [lx, ly + dy, lz - dy * 0.4], 0.016, IC.yellow, { seg: 8, noHull: true });
    K.rod([lx, ly + dy, lz - dy * 0.4], [fx, fy, lz], 0.016, IC.yellow, { seg: 8, noHull: true });
  }
  K.sph(0.05, fx, fy, lz, 0xfff3b0, { ws: 16, hs: 12, noHull: true });
  return 1.42;
}

// 4 熱學與熱力學：酒精燈＋三腳架＋陶瓷纖維網上的燒杯（插溫度計）
function itemHeat(K) {
  // 酒精燈與火焰
  K.sph(0.25, 0, 0.19, 0, 0xd8eef2, { sy: 0.76, ws: 18, hs: 12 });
  K.cyl(0.21, 0.23, 0.04, 0, 0.02, 0, 0xd8eef2);
  K.cyl(0.09, 0.11, 0.1, 0, 0.39, 0, IC.brass);
  K.cyl(0.025, 0.025, 0.06, 0, 0.47, 0, IC.white, { seg: 20, noHull: true });
  K.add(new THREE.ConeGeometry(0.15, 0.5, 24), M(0, 0.73, 0), IC.orange);
  K.add(new THREE.ConeGeometry(0.08, 0.28, 20), M(0, 0.63, 0.03), IC.yellow, { noHull: true });
  // 三腳架（腳在左右與後方，前面留空看得到酒精燈）
  const ty = 0.96;
  K.torus(0.3, 0.026, 0, ty, 0, IC.metalD, { rs: 5, ts: 28 });
  for (const a of [-Math.PI / 2, 0.2, Math.PI - 0.2]) K.rod([Math.cos(a) * 0.3, ty, Math.sin(a) * 0.3], [Math.cos(a) * 0.52, 0, Math.sin(a) * 0.52], 0.026, IC.metalD, { seg: 12 });
  // 燒杯（玻璃）與水、氣泡
  const b0 = ty + 0.03, br = 0.24;
  K.cyl(br, br - 0.01, 0.52, 0, b0 + 0.26, 0, IC.glass, { glass: true, open: true, seg: 28 });
  K.cyl(br - 0.01, br - 0.01, 0.012, 0, b0 + 0.006, 0, IC.glass, { glass: true, seg: 28 });
  K.cyl(br - 0.02, br - 0.025, 0.34, 0, b0 + 0.18, 0, IC.water, { seg: 28 });
  K.torus(br, 0.018, 0, b0 + 0.52, 0, IC.white, { rs: 4, ts: 28 });
  // 火焰從杯底四周往上竄（從上面看得到）
  for (const [a, h] of [[0.35, 0.42], [0.95, 0.5], [1.57, 0.56], [2.2, 0.5], [2.8, 0.42]]) {
    const x = Math.cos(a) * (br + 0.05), z = Math.sin(a) * (br + 0.05), lean = 0.28;
    K.add(new THREE.ConeGeometry(0.1, h, 16), M(x, b0 - 0.06 + h / 2, z, Math.sin(a) * lean, 0, -Math.cos(a) * lean), IC.orange);
    K.add(new THREE.ConeGeometry(0.055, h * 0.62, 12), M(x * 1.06, b0 - 0.06 + h * 0.31, z * 1.06, Math.sin(a) * lean, 0, -Math.cos(a) * lean), IC.yellow, { noHull: true });
  }
  for (const [x, z] of [[0.1, 0.07], [-0.08, -0.06]]) K.sph(0.032, x, b0 + 0.36, z, IC.white, { ws: 16, hs: 12, noHull: true });
  // 溫度計：插在水裡、斜靠在杯口，紅色液柱＋刻度
  const a = [0.07, b0 + 0.08, 0.03], b = [-0.34, b0 + 1.0, -0.2];
  K.rod(a, b, 0.042, IC.white, { seg: 20 });
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); d.normalize();
  const at = t => [a[0] + d.x * L * t, a[1] + d.y * L * t, a[2] + d.z * L * t];
  K.sph(0.06, ...at(0.0), IC.red, { ws: 16, hs: 12 });
  const f = new THREE.Vector3(0, 0, 1).addScaledVector(d, -d.z).normalize().multiplyScalar(0.034);        // 朝鏡頭那一面
  const pa = at(0.04), pb = at(0.72);
  K.rod([pa[0] + f.x, pa[1] + f.y, pa[2] + f.z], [pb[0] + f.x, pb[1] + f.y, pb[2] + f.z], 0.016, IC.red, { seg: 12, noHull: true });
  for (let i = 1; i < 9; i++) { const p = at(0.1 + i * 0.1); K.add(new THREE.BoxGeometry(0.045, 0.012, 0.012), M(p[0] + f.x * 1.2, p[1] + f.y * 1.2, p[2] + f.z * 1.2, 0, Math.atan2(d.x, d.z) + Math.PI / 2, 0), IC.ink, { noHull: true }); }
  return b0 + 1.0;
}

// 5 基礎力學與壓力：支架上的彈簧秤（掛砝碼）＋連通管（水面一樣高）
function itemPressure(K) {
  // 鐵架與彈簧秤
  const sx = -0.55, sz = -0.3;
  K.box(0.56, 0.06, 0.4, sx - 0.1, 0.03, sz, IC.metalD);
  K.cyl(0.035, 0.035, 1.84, sx - 0.3, 0.95, sz, IC.steel, { seg: 20 });
  K.rod([sx - 0.3, 1.82, sz], [sx + 0.02, 1.82, sz], 0.028, IC.steel, { seg: 20 });
  K.torus(0.04, 0.012, sx, 1.77, sz, IC.steel, { rx: 0, rs: 4, ts: 12 });
  K.cyl(0.095, 0.095, 0.62, sx, 1.42, sz, IC.glass, { glass: true, seg: 28 });
  K.cyl(0.1, 0.1, 0.05, sx, 1.735, sz, IC.blue);
  K.cyl(0.1, 0.1, 0.05, sx, 1.105, sz, IC.blue);
  { const pts = []; for (let k = 0; k <= 64; k++) { const t = k / 64 * 9 * TAU; pts.push([sx + 0.055 * Math.cos(t), 1.7 - k / 64 * 0.36, sz + 0.055 * Math.sin(t)]); } K.tube(pts, 0.011, IC.steel, { n: 54, rs: 4, noHull: true, type: 'catmullrom' }); }
  K.box(0.05, 0.02, 0.02, sx, 1.33, sz + 0.07, IC.red, { noHull: true });                        // 指針
  for (let i = 0; i < 6; i++) K.box(0.05, 0.008, 0.01, sx - 0.035, 1.18 + i * 0.09, sz + 0.098, IC.ink, { noHull: true });
  K.rod([sx, 1.33, sz], [sx, 0.95, sz], 0.012, IC.steel, { seg: 12 });
  K.torus(0.035, 0.01, sx, 0.93, sz, IC.steel, { rx: 0, rs: 4, ts: 12 });
  K.cyl(0.12, 0.12, 0.24, sx, 0.78, sz, IC.brass);
  K.cyl(0.04, 0.04, 0.05, sx, 0.92, sz, IC.brass, { seg: 20 });
  // 連通管：底下一根橫管，接四種形狀的玻璃管；水面同高（細紅虛線標出水平面）
  const vz = 0.32, by = 0.12, wl = 0.66;
  K.box(1.5, 0.06, 0.34, 0.25, 0.03, vz, IC.woodD);
  K.rod([-0.42, by, vz], [0.92, by, vz], 0.075, IC.glass, { glass: true, seg: 24 });
  K.rod([-0.42, by, vz], [0.92, by, vz], 0.06, IC.water, { seg: 20 });
  const tubeX = [-0.35, 0.05, 0.45, 0.85];
  K.cyl(0.075, 0.075, 0.82, tubeX[0], by + 0.41, vz, IC.glass, { glass: true, open: true });       // 直管
  K.cyl(0.06, 0.06, wl - by, tubeX[0], (by + wl) / 2, vz, IC.water);
  K.cyl(0.2, 0.06, 0.8, tubeX[1], by + 0.4, vz, IC.glass, { glass: true, open: true });            // 漏斗形
  const rw = 0.06 + (0.2 - 0.06) * ((wl - by) / 0.8);
  K.cyl(rw - 0.015, 0.05, wl - by, tubeX[1], (by + wl) / 2, vz, IC.water);
  K.sph(0.17, tubeX[2], 0.42, vz, IC.glass, { glass: true, ws: 18, hs: 12 });                                      // 球形
  K.cyl(0.06, 0.06, 0.3, tubeX[2], 0.8, vz, IC.glass, { glass: true, open: true });
  K.sph(0.155, tubeX[2], 0.42, vz, IC.water, { ws: 16, hs: 12 });
  K.cyl(0.05, 0.05, wl - 0.55, tubeX[2], (wl + 0.55) / 2, vz, IC.water);
  K.rod([tubeX[3], by, vz], [tubeX[3] + 0.32, 0.95, vz], 0.065, IC.glass, { glass: true, open: true }); // 斜管
  K.rod([tubeX[3], by, vz], [tubeX[3] + 0.32 * (wl - by) / 0.83, wl, vz], 0.052, IC.water);
  for (let i = 0; i < 7; i++) K.box(0.11, 0.012, 0.012, -0.42 + i * 0.21, wl, vz - 0.22, IC.red, { noHull: true });
  for (const x of [tubeX[0], tubeX[1]]) K.torus(x === tubeX[0] ? 0.075 : 0.2, 0.014, x, by + 0.82, vz, IC.white, { rs: 4, ts: 24, noHull: true });
  return 1.85;
}

// 6 直線運動學：斜面＋打點計時器拉著紙帶的小車
function itemIncline(K) {
  const H = 1.0, L = 2.0, th = Math.atan2(H, L);
  const sh = new THREE.Shape([new THREE.Vector2(-1, 0), new THREE.Vector2(1, 0), new THREE.Vector2(-1, H)]);
  const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.56, bevelEnabled: false });
  K.add(wg, M(0, 0, -0.28), IC.wood);
  // 斜面上的鋁軌（兩條）
  const S = (u, h = 0, z = 0) => [-1 + u * L, H - u * H + h / Math.cos(th), z];   // 沿斜面 u∈[0,1]、離面 h
  for (const z of [-0.17, 0.17]) K.rod(S(0.02, 0.02, z), S(0.98, 0.02, z), 0.022, IC.steel, { seg: 12 });
  const slope = (u, h, z, rz = 0) => { const p = S(u, h, z); return M(p[0], p[1], p[2], 0, 0, -th + rz); };
  // 打點計時器（夾在高的那一端）
  K.add(new THREE.BoxGeometry(0.32, 0.17, 0.3), slope(0.09, 0.12, 0), 0x5a86b8);
  K.add(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24), slope(0.09, 0.22, 0.03), IC.metalD);
  K.add(new THREE.BoxGeometry(0.2, 0.025, 0.05), slope(0.15, 0.22, 0.03), IC.steel);
  // 小車
  const cu = 0.58;
  K.add(new THREE.BoxGeometry(0.44, 0.13, 0.32), slope(cu, 0.15, 0), IC.red);
  K.add(new THREE.BoxGeometry(0.16, 0.05, 0.2), slope(cu - 0.02, 0.24, 0), 0xf0f0e8);
  for (const du of [-0.08, 0.08]) for (const z of [-0.17, 0.17]) K.add(new THREE.CylinderGeometry(0.065, 0.065, 0.045, 24), slope(cu + du, 0.075, z).multiply(M(0, 0, 0, Math.PI / 2, 0, 0)), IC.ink);
  // 紙帶：從小車接到計時器，點的間距往小車那邊越來越密（越來越快）
  const ta = 0.11, tb = cu - 0.11, tl = (tb - ta) * L / Math.cos(th);
  const pm = S((ta + tb) / 2, 0.06, 0.03);
  K.add(new THREE.BoxGeometry(tl, 0.008, 0.075), M(pm[0], pm[1], pm[2], 0, 0, -th), IC.white, { noHull: true });
  let u = tb - 0.02, gap = 0.012;
  while (u > ta + 0.05) {
    const p = S(u, 0.066, 0.03);
    K.add(new THREE.CylinderGeometry(0.013, 0.013, 0.006, 12), M(p[0], p[1], p[2], 0, 0, -th), IC.ink, { noHull: true });
    u -= gap; gap += 0.011;
  }
  return H + 0.3;
}

// 7 牛頓力學與圓周運動：太陽＋行星軌道環（行星儀）＋一顆大蘋果
function itemOrbit(K) {
  const sy = 1.18, R0 = 0.78, tilt = 0.18;
  K.cyl(0.28, 0.32, 0.07, 0, 0.035, -0.05, IC.woodD);
  K.cyl(0.035, 0.035, sy - 0.25, 0, (sy - 0.25) / 2 + 0.06, -0.05, IC.brass, { seg: 20 });
  K.sph(0.26, 0, sy, -0.05, 0xf6b23a, { ws: 20, hs: 14 });
  K.torus(R0, 0.022, 0, sy, -0.05, 0xe8c65a, { rx: Math.PI / 2 + tilt, ts: 40, rs: 6 });
  // 支撐軌道的兩根細臂
  const ringPt = a => [Math.cos(a) * R0, sy - Math.sin(a) * R0 * Math.sin(tilt), -0.05 + Math.sin(a) * R0 * Math.cos(tilt)];
  for (const a of [Math.PI * 0.95, -0.1]) K.rod([0, sy - 0.22, -0.05], ringPt(a), 0.012, IC.brass, { seg: 8 });
  const pa = ringPt(0.75);
  K.sph(0.12, ...pa, IC.blue, { ws: 16, hs: 12 });
  K.sph(0.06, pa[0] + 0.05, pa[1] + 0.06, pa[2] + 0.06, IC.green, { ws: 16, hs: 12, noHull: true });
  // 蘋果
  const ax = -0.62, az = 0.46;
  K.sph(0.27, ax, 0.24, az, IC.red, { sy: 0.88 });
  K.rod([ax, 0.44, az], [ax + 0.04, 0.6, az - 0.02], 0.018, 0x6b4a2e, { seg: 12 });
  K.sph(0.1, ax + 0.12, 0.56, az - 0.02, IC.green, { ws: 16, hs: 12, sx: 1.0, sy: 0.25, sz: 0.5, rz: -0.4 });
  return sy + 0.3;
}

// 8 功與能：雲霄飛車軌道＋停在最高點的小車
function itemCoaster(K) {
  const curve = new THREE.CatmullRomCurve3([
    [-1.0, 1.52, -0.5], [-0.72, 1.5, -0.38], [-0.42, 0.85, -0.1], [-0.14, 0.32, 0.24], [0.2, 0.62, 0.42],
    [0.5, 0.92, 0.25], [0.8, 0.55, -0.1], [1.0, 0.3, -0.45]].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const N = 56, pts = curve.getSpacedPoints(N), upv = new THREE.Vector3(0, 1, 0);
  const frames = pts.map((p, i) => {
    const t = curve.getTangentAt(i / N).normalize();
    const n = new THREE.Vector3().crossVectors(t, upv).normalize();
    const u = new THREE.Vector3().crossVectors(n, t).normalize();
    return { p, t, n, u };
  });
  for (const s of [-1, 1]) K.tube(frames.map(f => f.p.clone().addScaledVector(f.n, s * 0.09).toArray()), 0.026, IC.red, { n: 56, rs: 6, type: 'catmullrom' });
  frames.forEach((f, i) => {
    if (i % 3) return;
    K.add(new THREE.BoxGeometry(0.24, 0.02, 0.05), new THREE.Matrix4().makeBasis(f.n, f.u, f.t).setPosition(f.p.clone().addScaledVector(f.u, -0.02)), IC.woodD, { noHull: true });
  });
  for (const i of [2, 10, 19, 27, 34, 42, 51]) {
    const p = frames[i].p;
    K.cyl(0.028, 0.028, p.y - 0.03, p.x, (p.y - 0.03) / 2, p.z, IC.white, { seg: 20 });
  }
  // 小車
  const f = frames[3], cp = f.p.clone().addScaledVector(f.u, 0.1);
  const cm = new THREE.Matrix4().makeBasis(f.n, f.u, f.t).setPosition(cp);
  K.add(new THREE.BoxGeometry(0.28, 0.15, 0.34), cm.clone(), IC.yellow);
  K.add(new THREE.BoxGeometry(0.22, 0.08, 0.1), cm.clone().multiply(M(0, 0.1, -0.07)), IC.blue);
  K.add(new THREE.BoxGeometry(0.22, 0.08, 0.1), cm.clone().multiply(M(0, 0.1, 0.08)), IC.blue);
  for (const s of [-1, 1]) for (const dz of [-0.1, 0.1]) K.add(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 20), cm.clone().multiply(M(s * 0.12, -0.06, dz, 0, 0, Math.PI / 2)), IC.ink, { noHull: true });
  return 1.75;
}

// 9 基礎電學與電路：電池＋開關＋燈泡（看得到燈絲，台灣課本的燈泡畫法）用導線接成一圈
function itemCircuit(K) {
  K.box(1.96, 0.08, 1.2, 0, 0.04, 0, IC.wood);
  const y0 = 0.08;
  // 電池座與電池（＋極在右）
  K.box(0.78, 0.08, 0.28, -0.22, y0 + 0.04, -0.3, 0x3f5552);
  K.cyl(0.12, 0.12, 0.6, -0.22, y0 + 0.2, -0.3, 0x2e6f5e, { rz: Math.PI / 2 });
  K.cyl(0.122, 0.122, 0.12, 0.02, y0 + 0.2, -0.3, IC.orange, { rz: Math.PI / 2 });
  K.cyl(0.045, 0.045, 0.06, 0.11, y0 + 0.2, -0.3, IC.brass, { rz: Math.PI / 2, seg: 20 });
  // 閘刀開關（合上）
  const swx = -0.45, swz = 0.36;
  K.box(0.46, 0.05, 0.18, swx, y0 + 0.025, swz, IC.white);
  for (const dx of [-0.17, 0.17]) K.box(0.05, 0.08, 0.07, swx + dx, y0 + 0.09, swz, IC.brass);
  K.box(0.38, 0.025, 0.05, swx, y0 + 0.12, swz, IC.steel);
  K.cyl(0.03, 0.03, 0.12, swx + 0.2, y0 + 0.17, swz, IC.red, { seg: 20 });
  // 燈座與燈泡：玻璃殼裡看得到燈絲（線圈）與兩根支架
  const lx = 0.5, lz = -0.04, gy = y0 + 0.76;
  K.cyl(0.17, 0.19, 0.12, lx, y0 + 0.06, lz, IC.metalD);
  K.cyl(0.11, 0.11, 0.18, lx, y0 + 0.21, lz, IC.steel);
  for (let i = 0; i < 2; i++) K.torus(0.115, 0.012, lx, y0 + 0.17 + i * 0.06, lz, IC.steel, { rs: 4, ts: 20, noHull: true });
  K.sph(0.44, lx, gy, lz, 0xffd23a, { glass: true, alpha: 0.5, ws: 24, hs: 16 });
  K.cyl(0.15, 0.11, 0.16, lx, y0 + 0.37, lz, 0xffd23a, { glass: true, alpha: 0.5, open: true });
  K.cyl(0.03, 0.05, 0.16, lx, y0 + 0.38, lz, IC.white, { seg: 20, noHull: true });
  for (const s of [-1, 1]) K.rod([lx + s * 0.03, y0 + 0.44, lz], [lx + s * 0.15, gy + 0.08, lz], 0.018, IC.metalD, { seg: 8, noHull: true });
  { const pts = []; for (let k = 0; k <= 72; k++) { const t = k / 72; pts.push([lx - 0.15 + 0.3 * t, gy + 0.08 + 0.055 * Math.sin(t * 6 * TAU), lz + 0.055 * Math.cos(t * 6 * TAU)]); }
    K.tube(pts, 0.032, 0xb0200f, { n: 64, rs: 4, noHull: true, type: 'catmullrom' }); }
  // 導線：接成一個方形的迴路（電池 → 燈泡 → 開關 → 電池）
  const wy = y0 + 0.03;
  K.tube([[0.14, y0 + 0.2, -0.3], [0.3, wy, -0.3], [0.38, wy, -0.24], [0.42, wy, -0.08], [lx - 0.17, y0 + 0.06, lz]], 0.024, IC.red, { n: 24, rs: 6 });
  K.tube([[lx, y0 + 0.06, lz + 0.18], [lx + 0.02, wy, 0.2], [lx - 0.05, wy, 0.36], [0.1, wy, 0.38], [swx + 0.17, y0 + 0.1, swz]], 0.024, 0x3b4744, { n: 28, rs: 6 });
  K.tube([[swx - 0.17, y0 + 0.1, swz], [-0.76, wy, 0.32], [-0.8, wy, 0.1], [-0.72, wy, -0.24], [-0.55, y0 + 0.2, -0.3]], 0.024, 0x3b4744, { n: 28, rs: 6 });
  return gy + 0.44;
}

// 10 電與磁：馬蹄形磁鐵（N 紅、S 藍，斜靠在木架上）＋羅盤（指針紅端指向 S 極）
function itemMagnet(K) {
  const mx = -0.3, tilt = -0.5, R0 = 0.28, tr = 0.11, armL = 0.55;
  const mm = M(mx, 0.13, -0.05, tilt, 0, 0); // 磁鐵自己的座標：U 在 xy 平面、開口朝上
  const P = (g, m, c) => K.add(g, mm.clone().multiply(m), c);
  P(new THREE.TorusGeometry(R0, tr, 16, 28, Math.PI), M(0, tr, 0, 0, 0, Math.PI), 0xb0b6b3);
  for (const s of [-1, 1]) {
    P(new THREE.CylinderGeometry(tr, tr, armL * 0.5, 24), M(s * R0, tr + armL * 0.25, 0), 0xb0b6b3);
    P(new THREE.CylinderGeometry(tr, tr, armL * 0.5, 24), M(s * R0, tr + armL * 0.75, 0), s < 0 ? IC.red : IC.blue);
  }
  K.box(0.95, 0.18, 0.12, mx, 0.09, -0.42, IC.woodD);                                            // 後面的木架
  // 羅盤
  const cx = 0.5, cz = 0.3;
  K.cyl(0.34, 0.36, 0.12, cx, 0.06, cz, IC.brass, { seg: 40 });
  K.cyl(0.3, 0.3, 0.02, cx, 0.12, cz, IC.white, { seg: 40, noHull: true });
  K.torus(0.32, 0.025, cx, 0.13, cz, IC.brass, { rs: 8, ts: 40 });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; K.box(0.025, 0.012, 0.07, cx + Math.sin(a) * 0.24, 0.135, cz + Math.cos(a) * 0.24, IC.ink, { ry: a, noHull: true }); }
  // 指針：紅端（N）指向磁鐵的藍色 S 極
  const sp = new THREE.Vector3(0, tr + armL, 0).applyMatrix4(new THREE.Matrix4().makeTranslation(R0, 0, 0)).applyMatrix4(mm);
  const ang = Math.atan2(sp.x - cx, sp.z - cz);
  const nd = (half, c) => K.add(new THREE.ConeGeometry(0.05, 0.22, 4), M(cx, 0.15, cz, 0, ang, 0).multiply(M(0, 0, half * 0.11, half * Math.PI / 2, 0, 0)).multiply(Ms(0, 0, 0, 1, 1, 0.35)), c, { noHull: true });
  nd(1, IC.red); nd(-1, IC.blue);
  K.cyl(0.03, 0.03, 0.03, cx, 0.165, cz, IC.brass, { seg: 20, noHull: true });
  return 1.0;
}

// ---------- 地科館的單元小物品（20261029c）----------
const EC = {
  rock: 0x8a8f96, rockD: 0x6b7178, sand: 0xd8b878, soil: 0xa87a52, soilD: 0x86603f, grass: 0x7bc47a, grassD: 0x5fa862,
  aquifer: 0x7fb2d6, sea: 0x4f9fe0, snow: 0xf5f8fa, lava: 0xff7a2e, smoke: 0xd8d4d0, navy: 0x2c3e66, ice: 0xdff6ff,
};
// 球面上的一小片（大陸、冰帽）：扁的橢球貼在球面上，法線方向 v
function cap(K, cx, cy, cz, R, v, s, c, flat = 0.35) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
  const p = new THREE.Vector3(cx, cy, cz).addScaledVector(v, R * 0.99);
  K.add(new THREE.SphereGeometry(s, 16, 6, 0, TAU, 0, Math.PI / 2), new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, flat, 1)), c, { noHull: true }); // 半球（同 16×12 球的密度）
}
// 切面模型往後仰（像博物館的展示模型）：從第 k0 個零件起，以後下緣 z=z0 為軸往後仰 ang，前緣被墊高；下面補一塊木頭楔形台。
// 鏡頭是斜斜往下看的，直立的正面在畫面上很扁；仰起來以後正面的地層才看得清楚
function tiltBack(K, k0, ang, z0, zf, W) {
  const T = new THREE.Matrix4().makeTranslation(0, 0, z0).multiply(new THREE.Matrix4().makeRotationX(-ang)).multiply(new THREE.Matrix4().makeTranslation(0, 0, -z0));
  for (let i = k0; i < K.parts.length; i++) K.parts[i].m = T.clone().multiply(K.parts[i].m);
  const D = zf - z0, fy = D * Math.sin(ang), fz = z0 + D * Math.cos(ang);
  const sh = new THREE.Shape([new THREE.Vector2(z0, 0), new THREE.Vector2(fz, 0), new THREE.Vector2(fz, fy)]);
  K.add(new THREE.ExtrudeGeometry(sh, { depth: 2 * W, bevelEnabled: false }), M(W, 0, 0, 0, -Math.PI / 2, 0), IC.woodD);
  return fy;
}
// 雨滴：上尖下圓（旋轉體，20 段）
function drop(K, x, y, z, r, c) {
  const pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5 * Math.PI; pts.push(new THREE.Vector2(Math.sin(t) * r * (0.35 + 0.65 * t / Math.PI), r * 1.25 - i / 5 * r * 2.2)); }
  pts[0].x = 0; pts[5].x = 0;
  K.add(new THREE.LatheGeometry(pts, 20), M(x, y, z), c, { noHull: true });
}
// 正面輪廓（xy 平面的點）往 z 方向擠出成一塊（z 從 z0 到 z0+d）
function prism(K, pts, z0, d, c, o = {}) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  K.add(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 4 }), M(0, 0, z0), c, o);
}

// 1 水與陸地：地層切面方塊（頂面有河流切出的河谷，正面看得到地層與地下水面）＋一口小井
const SECTION_TILT = 0.5; // 切面模型往後仰的角度（弧度）
function itemWaterLand(K) {
  const W = 0.8, z0 = -0.3, D = 0.9, zf = z0 + D;         // 方塊：x −0.8～0.8，z −0.3～0.6（之後整塊往後仰）
  const vx = -0.2, vt = 0.3, vb = 0.07, yv = 0.6, yt = 0.84; // 河谷：中心 x、上緣半寬、谷底半寬、谷底高、地表高
  prism(K, [[-W, 0], [W, 0], [W, 0.18], [-W, 0.18]], z0, D, EC.rock);                 // 岩盤
  prism(K, [[-W, 0.18], [W, 0.18], [W, 0.4], [-W, 0.4]], z0, D, EC.aquifer);         // 含水層（地下水面以下）
  prism(K, [[-W, 0.4], [W, 0.4], [W, 0.54], [-W, 0.54]], z0, D, EC.sand);            // 砂礫層
  const soil = (y0, y1, c) => {                                                       // 河谷兩岸的土層（兩塊，中間切出 V 形谷）
    const k = (vt - vb) / (yt - yv), half = y => vb + Math.max(0, y - yv) * k;
    prism(K, [[-W, y0], [vx - half(y0), y0], [vx - half(y1), y1], [-W, y1]], z0, D, c);
    prism(K, [[vx + half(y0), y0], [W, y0], [W, y1], [vx + half(y1), y1]], z0, D, c);
  };
  prism(K, [[-W, 0.54], [W, 0.54], [W, yv], [-W, yv]], z0, D, EC.soilD);
  soil(yv, 0.78, EC.soil);
  soil(0.78, yt, EC.grass);
  K.box(vb * 2 + 0.04, 0.03, D, vx, yv + 0.015, 0, EC.sea, { noHull: true });          // 河流
  // 地下水面：正面一條深藍線
  K.box(W * 2, 0.022, 0.012, 0, 0.4, zf + 0.006, 0x2f6fb0, { noHull: true });
  // 井：井口在地表（右前），正面看得到井筒一直通到含水層
  const wx = 0.5, wz = zf - 0.2;
  K.cyl(0.15, 0.16, 0.14, wx, yt + 0.07, wz, 0xb7b2a6);
  K.cyl(0.105, 0.105, 0.012, wx, yt + 0.142, wz, 0x2c4f6e, { noHull: true });
  for (const s of [-1, 1]) K.cyl(0.022, 0.022, 0.42, wx + s * 0.15, yt + 0.21, wz, IC.woodD, { seg: 20 });
  prism(K, [[wx - 0.24, yt + 0.4], [wx + 0.24, yt + 0.4], [wx, yt + 0.58]], wz - 0.16, 0.32, 0xd9634a);           // 屋頂（三角柱，山牆朝前）
  K.rod([wx, yt + 0.4, wz], [wx, yt + 0.2, wz], 0.006, IC.ink, { seg: 8, noHull: true });
  K.cyl(0.04, 0.032, 0.06, wx, yt + 0.19, wz, IC.woodD, { seg: 20, noHull: true });
  K.box(0.07, yt - 0.3, 0.012, wx, (yt + 0.3) / 2, zf + 0.007, 0x3b4a52, { noHull: true });             // 正面的井筒
  K.box(0.07, 0.1, 0.014, wx, 0.35, zf + 0.008, 0x2f6fb0, { noHull: true });                             // 井底的地下水
  // 左岸兩棵小樹
  for (const [x, z, s] of [[-0.62, -0.28, 1], [-0.68, 0.18, 0.8]]) {
    K.cyl(0.025, 0.03, 0.12 * s, x, yt + 0.06 * s, z, 0x7a5a3a, { seg: 20 });
    K.add(new THREE.ConeGeometry(0.13 * s, 0.32 * s, 20), M(x, yt + 0.12 * s + 0.16 * s, z), 0x3b8f55);
  }
  const fy = tiltBack(K, 0, SECTION_TILT, z0, zf, W);
  return fy + yt * Math.cos(SECTION_TILT) + 0.5;
}

// 2 板塊運動與地球歷史：兩塊板塊相撞（海洋板塊隱沒到大陸板塊下面）；大陸隆起山脈、冒煙的小火山，正面有含化石的地層
function itemPlates(K) {
  const z0 = -0.3, D = 0.84, zf = z0 + D, T = 0.74;                          // 板塊頂面高 T（拉高一點，俯視時正面的地層才看得清楚）
  // 隱沒的海洋板塊（正面看是一條往左下斜插的帶子）
  prism(K, [[0.92, 0.36], [0.92, T - 0.12], [0.28, T - 0.12], [-0.46, 0.0], [-0.14, 0.0], [0.34, 0.36]], z0, D, 0x5d6b7c);
  K.box(0.64, 0.08, D, 0.6, T - 0.08, 0, EC.sea);                                    // 海水
  // 大陸板塊：一層一層的地層，右邊貼著隱沒帶的斜面
  const yk = T - 0.12, xr = y => (y >= yk ? 0.28 : -0.46 + (y / yk) * 0.74);
  const band = (y0, y1, c) => prism(K, [[-0.92, y0], [xr(y0), y0], ...(y0 < yk && y1 > yk ? [[0.28, yk]] : []), [xr(y1), y1], [-0.92, y1]], z0, D, c);
  band(0, 0.16, 0x7a5c40); band(0.16, 0.3, 0xc29a67); band(0.3, 0.5, 0xe6d6a8); band(0.5, 0.66, 0xa8724e); band(0.66, T, EC.grassD);
  // 正面：淺色化石層裡的菊石（螺旋）與三葉蟲
  const fy = 0.4, fz = zf + 0.004;
  for (const x of [-0.76, -0.42]) {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const t = k / 30 * 2.2 * TAU, r = 0.014 + 0.066 * k / 30; pts.push([x + r * Math.cos(t), fy + r * Math.sin(t), fz]); }
    K.tube(pts, 0.013, 0x6b4a2e, { n: 30, rs: 4, noHull: true, type: 'catmullrom' });
  }
  K.sph(0.065, -0.12, fy, fz - 0.004, 0x6b4a2e, { sx: 0.75, sy: 1.2, sz: 0.25, noHull: true, ws: 16, hs: 12 });
  for (let i = 0; i < 3; i++) K.box(0.11, 0.011, 0.012, -0.12, fy - 0.045 + i * 0.045, fz + 0.01, 0xe6d6a8, { noHull: true });
  // 山脈（靠近相撞處隆起，偏後方）
  for (const [x, z, r, h] of [[0.02, -0.06, 0.26, 0.52], [-0.28, -0.12, 0.2, 0.4], [0.12, 0.26, 0.18, 0.36], [-0.2, 0.18, 0.17, 0.3]]) {
    K.add(new THREE.ConeGeometry(r, h, 20), M(x, T + h / 2, z), 0x8f7358);
    K.add(new THREE.ConeGeometry(r * 0.42, h * 0.42, 20), M(x, T + h * 0.79 + 0.005, z), EC.snow, { noHull: true });
  }
  // 冒煙的小火山（大陸這一側、偏前方）
  const vx = -0.62, vz = 0.2, vh = 0.32;
  K.cyl(0.08, 0.28, vh, vx, T + vh / 2, vz, 0x6e5546);
  K.cyl(0.065, 0.065, 0.02, vx, T + vh + 0.005, vz, EC.lava, { noHull: true });
  K.rod([vx + 0.07, T + vh - 0.02, vz + 0.04], [vx + 0.2, T + 0.06, vz + 0.12], 0.026, EC.lava, { seg: 12, noHull: true });
  [[0.02, 0.1, -0.02, 0.07], [0.07, 0.22, -0.05, 0.085], [0.04, 0.36, -0.09, 0.1]].forEach(([x, y, z, r]) => K.sph(r, vx + x, T + vh + y, vz + z, EC.smoke, { ws: 16, hs: 12 }));
  // 海洋板塊往左推的箭頭
  K.box(0.24, 0.03, 0.08, 0.7, T, 0.24, IC.white, { noHull: true });
  K.add(new THREE.ConeGeometry(0.08, 0.16, 20), M(0.5, T, 0.24, 0, 0, Math.PI / 2), IC.white, { noHull: true });
  const lift = tiltBack(K, 0, SECTION_TILT, z0, zf, 0.92);
  return lift + (T + vh) * Math.cos(SECTION_TILT) + 0.4;
}

// 3 太空的世界：太陽（小）、地軸傾斜的地球、月亮，立在深藍星空底座上＋一台天文望遠鏡
function itemSpace(K) {
  const bx = -0.22, bz = -0.12;
  K.cyl(0.66, 0.7, 0.08, bx, 0.04, bz, EC.navy, { seg: 40 });
  for (let i = 0; i < 11; i++) {                                                     // 星星：底座上的小亮點（平面圓片）
    const a = i * 2.4, r = 0.22 + 0.38 * ((i * 0.37) % 1);
    K.add(new THREE.CircleGeometry(0.022, 10), M(bx + Math.cos(a) * r, 0.082, bz + Math.sin(a) * r, -Math.PI / 2, 0, 0), IC.yellow, { noHull: true });
  }
  const post = (x, z, h) => K.cyl(0.026, 0.026, h, x, 0.08 + h / 2, z, IC.brass, { seg: 20 });
  // 太陽
  post(-0.64, -0.34, 0.66);
  K.sph(0.24, -0.64, 0.98, -0.34, 0xf6b23a, { ws: 16, hs: 12 });
  // 地球：地軸傾斜（白色細桿）、藍色海洋＋綠色大陸
  const ex = -0.06, ey = 0.86, ez = -0.06, tilt = 0.41, er = 0.22, zAxis = new THREE.Vector3(0, 0, 1);
  post(ex, ez, 0.52);
  const ax = [Math.sin(tilt), Math.cos(tilt)];
  K.rod([ex - ax[0] * 0.34, ey - ax[1] * 0.34, ez], [ex + ax[0] * 0.34, ey + ax[1] * 0.34, ez], 0.014, IC.white, { seg: 12 });
  K.sph(er, ex, ey, ez, 0x3a86e0, { rz: -tilt, ws: 16, hs: 12 });
  for (const [th, ph, s] of [[0.9, 0.9, 0.13], [1.7, 1.9, 0.11], [1.3, 3.6, 0.12]]) {
    cap(K, ex, ey, ez, er, new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyAxisAngle(zAxis, -tilt), s, IC.green);
  }
  // 月亮
  post(0.36, -0.4, 0.6);
  K.sph(0.09, 0.36, 0.77, -0.4, 0xd5d3cc, { ws: 16, hs: 12 });
  // 天文望遠鏡（右前方，鏡筒朝後上方的天空）
  const tx = 0.62, tz = 0.44, ty = 0.54;
  for (const a of [0.4, 2.5, 4.6]) K.rod([tx, ty, tz], [tx + Math.cos(a) * 0.3, 0, tz + Math.sin(a) * 0.3], 0.018, IC.metalD, { seg: 12 });
  K.cyl(0.045, 0.045, 0.08, tx, ty + 0.02, tz, IC.metalD, { seg: 20 });
  const dir = new THREE.Vector3(-0.35, 0.62, -0.7).normalize();
  const at = t => [tx + dir.x * t, ty + 0.08 + dir.y * t, tz + dir.z * t];
  K.rod(at(-0.3), at(0.45), 0.075, IC.white, { seg: 24, r2: 0.06 });
  K.rod(at(0.39), at(0.47), 0.088, IC.blue, { seg: 24 });
  K.rod(at(-0.3), at(-0.4), 0.03, IC.ink, { seg: 20 });
  return 1.24;
}

// 4 大氣與天氣：百葉箱＋風向標與風杯風速計＋一朵下雨的雲
function itemWeather(K) {
  // 百葉箱（白色、四腳、正面一片一片的百葉、斜屋頂）
  const bx = -0.5, bz = -0.06, by = 0.5, bw = 0.6, bh = 0.52, bd = 0.5;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.cyl(0.028, 0.028, by, bx + dx * (bw / 2 - 0.06), by / 2, bz + dz * (bd / 2 - 0.06), IC.white, { seg: 20 });
  K.box(bw, bh, bd, bx, by + bh / 2, bz, IC.white);
  for (let i = 0; i < 7; i++) K.box(bw - 0.1, 0.02, 0.03, bx, by + 0.06 + i * 0.064, bz + bd / 2 + 0.01, 0xb9c4ce, { noHull: true, rx: -0.5 });
  prism(K, [[bx - bw / 2 - 0.06, by + bh], [bx + bw / 2 + 0.06, by + bh], [bx, by + bh + 0.22]], bz - bd / 2 - 0.05, bd + 0.1, 0xeef1f3);
  // 風向標＋風杯風速計（後方的高桿）
  const px = 0.36, pz = -0.44, top = 1.5;
  K.cyl(0.08, 0.1, 0.06, px, 0.03, pz, IC.metalD);
  K.cyl(0.026, 0.026, top, px, top / 2, pz, IC.steel, { seg: 20 });
  const vy = 1.14;                                                                    // 風向標：箭頭指向風吹來的方向
  K.box(0.6, 0.03, 0.03, px + 0.02, vy, pz, IC.ink);
  K.add(new THREE.ConeGeometry(0.07, 0.18, 20), M(px - 0.34, vy, pz, 0, 0, Math.PI / 2), IC.red);
  K.box(0.18, 0.16, 0.014, px + 0.28, vy + 0.03, pz, IC.red);
  K.cyl(0.035, 0.035, 0.04, px, top, pz, IC.metalD, { seg: 20 });
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 + 0.3, ex = px + Math.cos(a) * 0.27, ez = pz + Math.sin(a) * 0.27;
    K.rod([px, top, pz], [ex, top, ez], 0.012, IC.metalD, { seg: 8 });
    K.add(new THREE.SphereGeometry(0.075, 16, 6, 0, TAU, 0, Math.PI / 2), M(ex, top, ez, 0, -a, Math.PI / 2), IC.blue);
  }
  // 雲（右前方）＋雨滴＋地上的小水窪
  const cx = 0.42, cz = 0.16, cy = 1.06;
  [[0, 0.02, 0, 0.24], [-0.23, -0.04, 0.03, 0.17], [0.23, -0.03, -0.02, 0.18]].forEach(([x, y, z, r]) => K.add(new THREE.SphereGeometry(r, 16, 6, 0, TAU, 0, Math.PI / 2), Ms(cx + x, cy - 0.1 + y, cz + z, 1, 1.1, 1), 0xf4f6f8)); // 雲（半球，底下平）
  K.cyl(0.36, 0.3, 0.08, cx, cy - 0.12, cz, 0xc9d3dc, { seg: 24 });
  K.cyl(0.02, 0.02, cy - 0.16, cx - 0.12, (cy - 0.16) / 2, cz - 0.1, IC.steel, { seg: 20 });                     // 雲的支架（模型）
  for (const [x, y] of [[-0.2, 0.74], [0.02, 0.62], [0.22, 0.76], [-0.1, 0.4], [0.14, 0.3]]) drop(K, cx + x, y, cz + 0.3 + (0.9 - y) * 0.7, 0.055, 0x2f7fd0); // 雨往前斜落，俯視時才不會被雲擋住
  K.cyl(0.3, 0.3, 0.02, cx, 0.01, cz + 0.62, 0x8fd3f0, { seg: 28, noHull: true });
  return top + 0.05;
}

// 5 全球氣候變遷：桌上型地球儀＋一攤正在融化的冰塊＋溫度計（紅色液柱偏高）
function itemClimate(K) {
  // 地球儀
  const gx = -0.4, gz = -0.14, gy = 0.86, gr = 0.4, tilt = 0.41, zAxis = new THREE.Vector3(0, 0, 1);
  K.cyl(0.26, 0.3, 0.08, gx, 0.04, gz, IC.woodD);
  K.cyl(0.035, 0.05, 0.4, gx, 0.28, gz, IC.brass, { seg: 20 });
  K.torus(gr + 0.05, 0.02, gx, gy, gz, IC.brass, { rx: 0, rz: -tilt - Math.PI * 0.1, arc: Math.PI * 1.2, ts: 28, rs: 6 });
  K.sph(gr, gx, gy, gz, 0x3a86e0);
  for (const [th, ph, s] of [[1.0, 1.3, 0.2], [1.6, 0.2, 0.16], [1.2, 2.6, 0.17]]) {
    cap(K, gx, gy, gz, gr, new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyAxisAngle(zAxis, -tilt), s, IC.green);
  }
  cap(K, gx, gy, gz, gr, new THREE.Vector3(0, 1, 0).applyAxisAngle(zAxis, -tilt), 0.14, EC.snow);   // 北極的冰帽（縮小了）
  // 融化的冰塊（右前方）：一攤水，上面幾塊冰
  const ix = 0.34, iz = 0.44;
  K.cyl(0.42, 0.42, 0.02, ix, 0.01, iz, 0x8fd3f0, { seg: 32, noHull: true });
  for (const [x, z, s, r] of [[-0.08, -0.06, 0.28, 0.3], [0.16, 0.06, 0.2, -0.5], [-0.12, 0.18, 0.14, 0.9]]) {
    K.box(s, s * 0.8, s, ix + x, s * 0.4 + 0.02, iz + z, EC.ice, { ry: r });
    K.box(s * 0.7, 0.02, s * 0.7, ix + x, s * 0.8 + 0.03, iz + z, 0xffffff, { ry: r, noHull: true });
  }
  // 溫度計（右後方）：白色板子上的玻璃管，紅色液柱偏高、頂端是粉紅的高溫區
  const tx = 0.58, tz = -0.38, H = 1.5;
  K.box(0.3, 0.06, 0.22, tx, 0.03, tz, IC.metalD);
  K.box(0.24, H, 0.05, tx, 0.06 + H / 2, tz, IC.white);
  K.box(0.24, 0.24, 0.052, tx, 0.06 + H - 0.22, tz, 0xf6c1b8, { noHull: true });
  K.cyl(0.036, 0.036, H - 0.24, tx, 0.18 + (H - 0.24) / 2, tz + 0.04, IC.glass, { seg: 20 });
  K.sph(0.07, tx, 0.18, tz + 0.045, IC.red, { ws: 16, hs: 12 });
  const top = 0.06 + H - 0.24;
  K.cyl(0.024, 0.024, top - 0.2, tx, 0.2 + (top - 0.2) / 2, tz + 0.065, IC.red, { seg: 20, noHull: true });
  for (let i = 0; i < 11; i++) K.box(i % 5 ? 0.045 : 0.08, 0.014, 0.01, tx - 0.07 - (i % 5 ? 0 : 0.017), 0.32 + i * 0.11, tz + 0.03, IC.ink, { noHull: true });
  K.add(new THREE.ConeGeometry(0.05, 0.1, 20), M(tx + 0.11, top + 0.02, tz + 0.06, 0, 0, Math.PI / 2), IC.red, { noHull: true });
  return 0.06 + H;
}

// ---------- 化學館的單元小物品（20261029d）----------
// 鏡頭幾乎是從上往下看（HALL_PITCH），所以化學的物品多半「攤平」擺：分子模型、週期表、比色卡從上面就看得清楚
const CH = {
  glassL: 0xcfeef5, tube: 0xbfe3ea, cork: 0xb5523b, carbon: 0x3d4448, oxy: 0xe0483a, hyd: 0xf7f8f2, bond: 0xcfd6d3,
  brick: 0xa45a40, brickD: 0x7e4433, hot: 0xff7a2e, hotY: 0xffc43a, iron: 0x8d969b, zinc: 0xa9b2b6, copper: 0xd27a3e,
  cuso4: 0x3f8fe0, pink: 0xff6fb5, paper: 0xfbfaf4,
};
// 旋轉體（玻璃器材的外形）：pts＝[[半徑, 高], ...]，24 段
function lathe(K, pts, x, y, z, c, o = {}) {
  K.add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg || 24), M(x, y, z), c, o);
}
// 從第 k0 個零件起，整組套上矩陣 m（先在自己的座標拼好，再擺位置／傾斜）
// 小氣泡：只有幾個像素大，用二十面體就夠圓
function bubble(K, x, y, z, r) { K.add(new THREE.IcosahedronGeometry(r, 0), M(x, y, z), IC.white, { noHull: true }); }
function xform(K, k0, m) { for (let i = k0; i < K.parts.length; i++) K.parts[i].m = m.clone().multiply(K.parts[i].m); }
// 錐形瓶：玻璃外殼＋裡面的液體（液面高 lv），s＝縮放
function erlen(K, x, y, z, s, liq, lv, o = {}) {
  const P = [[0, 0], [0.29, 0], [0.305, 0.03], [0.28, 0.11], [0.11, 0.43], [0.085, 0.48], [0.085, 0.62], [0.1, 0.645]].map(([r, h]) => [r * s, h * s]);
  lathe(K, P, x, y, z, IC.glass, { glass: true, alpha: 0.38, seg: o.seg });
  const rAt = h => (h <= 0.11 ? 0.28 : 0.28 - (h - 0.11) * (0.17 / 0.32)) - 0.018;
  lathe(K, [[0, 0.012], [0.275, 0.012], [rAt(Math.min(lv, 0.11)), Math.min(lv, 0.11)], ...(lv > 0.11 ? [[rAt(lv), lv]] : []), [0, lv]].map(([r, h]) => [r * s, h * s]), x, y, z, liq, { seg: o.seg });
  K.torus(0.1 * s, 0.012 * s, x, y + 0.645 * s, z, IC.white, { rs: 4, ts: 20, noHull: true });
  return 0.645 * s;
}
// 燒杯：玻璃杯身（開口）＋杯底＋液體＋杯口
function beaker(K, x, y, z, r, h, liq, lv, seg = 28) {
  K.cyl(r, r * 0.97, h, x, y + h / 2, z, IC.glass, { glass: true, alpha: 0.36, open: true, seg });
  if (lv > 0) K.cyl(r - 0.016, r * 0.97 - 0.016, lv, x, y + 0.012 + lv / 2, z, liq, { seg });
  else K.cyl(r * 0.97, r * 0.97, 0.012, x, y + 0.006, z, IC.glass, { glass: true, alpha: 0.36, seg });
  K.torus(r, 0.016, x, y + h, z, IC.white, { rs: 4, ts: seg, noHull: true });
}
// 球棍模型的「棍」：兩顆原子之間的鍵；n＝2 是雙鍵（兩根並排，間距 off，往 side 方向錯開）
function bond(K, a, b, n = 1, side = [0, 0, 1], off = 0.04) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i - 0.5) * 2 * off;
    K.rod([a[0] + side[0] * t, a[1] + side[1] * t, a[2] + side[2] * t], [b[0] + side[0] * t, b[1] + side[1] * t, b[2] + side[2] * t], 0.024, CH.bond, { seg: 8 });
  }
}

// 1 空氣與溶液：雙氧水＋二氧化錳製氧（錐形瓶＋薊頭漏斗）→ 導管 → 水槽裡倒立的集氣瓶（排水集氣法）＋一杯硫酸銅溶液
function itemAirGas(K) {
  const fx = -0.56, fz = -0.12;
  erlen(K, fx, 0, fz, 1.05, 0xd9f0f6, 0.2, { seg: 20 });
  K.cyl(0.2, 0.22, 0.025, fx, 0.03, fz, 0x3b3b3b, { noHull: true, seg: 20 });                     // 瓶底的二氧化錳（黑色粉末）
  for (const [x, y, z] of [[0.08, 0.1, 0.06], [-0.07, 0.15, -0.04], [0.02, 0.19, 0.1]]) bubble(K, fx + x, y, fz + z, 0.026);
  const ty = 0.68;
  K.cyl(0.1, 0.082, 0.1, fx, ty, fz, CH.cork);                                                   // 橡皮塞
  K.rod([fx - 0.035, 0.12, fz], [fx - 0.035, 1.12, fz], 0.02, CH.tube, { seg: 12 });               // 薊頭漏斗
  lathe(K, [[0.02, 0], [0.1, 0.1], [0.12, 0.17], [0.135, 0.2]], fx - 0.035, 1.1, fz, IC.glass, { glass: true, alpha: 0.5, seg: 20 });
  K.torus(0.135, 0.012, fx - 0.035, 1.3, fz, IC.white, { rs: 4, ts: 20, noHull: true });
  // 水槽（玻璃）＋水
  const tx = 0.42, tz = 0.12, tr = 0.5, th = 0.34;
  K.cyl(tr, tr, th, tx, th / 2, tz, IC.glass, { glass: true, alpha: 0.32, open: true, seg: 36 });
  K.cyl(tr - 0.012, tr - 0.012, 0.26, tx, 0.13, tz, IC.water, { glass: true, alpha: 0.5, seg: 32 });
  K.torus(tr, 0.018, tx, th, tz, IC.white, { rs: 4, ts: 32, noHull: true });
  // 倒立的集氣瓶：上半是收集到的氧氣，下半還有水
  const bx = tx + 0.1, bz = tz - 0.06, b0 = 0.08, bh = 0.66;
  K.cyl(0.17, 0.17, bh, bx, b0 + bh / 2, bz, IC.glass, { glass: true, alpha: 0.42, seg: 24 });
  K.cyl(0.155, 0.155, 0.24, bx, b0 + 0.12, bz, IC.water, { glass: true, alpha: 0.55, seg: 24 });
  K.torus(0.17, 0.016, bx, b0 + bh, bz, IC.white, { rs: 4, ts: 24, noHull: true });
  for (const [x, y, z] of [[0.02, 0.16, 0.02], [-0.04, 0.26, -0.03], [0.05, 0.4, 0.04], [-0.02, 0.52, 0]]) bubble(K, bx + x, y, bz + z, 0.035);
  // 導管：從橡皮塞往上、越過水槽邊、伸進水裡到集氣瓶口下面
  K.tube([[fx + 0.035, ty, fz], [fx + 0.04, 0.92, fz], [fx + 0.2, 1.0, fz], [0.02, 0.92, fz], [0.08, 0.5, fz + 0.06], [0.12, 0.08, bz], [bx - 0.04, 0.05, bz]], 0.026, CH.tube, { n: 28, rs: 5 });
  // 前面一小杯藍色的硫酸銅溶液＋玻璃棒
  beaker(K, -0.28, 0, 0.6, 0.17, 0.32, CH.cuso4, 0.2, 20);
  K.rod([-0.33, 0.06, 0.62], [-0.12, 0.5, 0.48], 0.016, IC.white, { seg: 12 });
  return 1.32;
}

// 2 原子與元素週期表：斜放的週期表看板（四大家族上色）＋氦原子模型（2 質子、2 中子、2 電子）
function itemAtomTable(K, hc) {
  const k0 = K.parts.length, P = 0.096, W = 18 * P + 0.12, D = 7 * P + 0.12;
  K.box(W, 0.05, D, 0, 0, 0, IC.ink);                                                            // 看板（深色底，格子才明顯）
  const fam = c => (c === 1 ? 0xe86a5a : c === 2 ? 0xf2a03a : c <= 12 ? 0xdcd6c4 : c <= 16 ? 0xa9dca0 : c === 17 ? 0x5fb8e6 : 0xb48cff);
  for (let r = 1; r <= 7; r++) for (let c = 1; c <= 18; c++) {
    if (r === 1 && c !== 1 && c !== 18) continue;
    if (r <= 3 && c > 2 && c < 13) continue;
    const col = r === 1 && c === 1 ? IC.white : fam(c);
    K.add(new THREE.PlaneGeometry(P * 0.86, P * 0.86), M(-W / 2 + 0.06 + (c - 0.5) * P, 0.027, -D / 2 + 0.06 + (r - 0.5) * P, -Math.PI / 2, 0, 0), col, { noHull: true });
  }
  xform(K, k0, M(0, 0.36, -0.44, 0.42, 0, 0));                                                    // 往鏡頭斜（後緣抬高）
  for (const s of [-1, 1]) K.box(0.08, 0.36, 0.08, s * 0.7, 0.18, -0.36, hc);                      // 看板的腳（館色）
  K.box(1.52, 0.06, 0.08, 0, 0.12, -0.36, hc);
  // 氦原子模型（立在前面的細桿上）
  const ax = 0, ay = 0.66, az = 0.5;
  K.cyl(0.2, 0.24, 0.06, ax, 0.03, az, hc);
  K.cyl(0.022, 0.022, ay - 0.1, ax, (ay - 0.1) / 2 + 0.05, az, IC.steel, { seg: 20 });
  [[0.045, 0.03, 0.02, IC.red], [-0.045, -0.02, 0.025, IC.red], [-0.01, 0.045, -0.04, 0xc9cdd2], [0.015, -0.05, -0.035, 0xc9cdd2]]
    .forEach(([x, y, z, c]) => K.sph(0.062, ax + x, ay + y, az + z, c, { ws: 16, hs: 10 }));
  const orb = (tz, ex) => {
    const m = new THREE.Matrix4().makeTranslation(ax, ay, az).multiply(new THREE.Matrix4().makeRotationZ(tz)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    K.add(new THREE.TorusGeometry(0.36, 0.014, 4, 36), m, 0x7fb2d6);
    const e = new THREE.Vector3(Math.cos(ex) * 0.36, Math.sin(ex) * 0.36, 0).applyMatrix4(m);
    K.sph(0.05, e.x, e.y, e.z, IC.blue, { ws: 16, hs: 10 });
  };
  orb(0.62, 0.9); orb(-0.62, 3.6);
  return ay + 0.42;
}

// 3 化學反應與方程式：托盤上用球棍模型排出 C ＋ O₂ → CO₂（兩邊原子數一樣：質量守恆）
function itemReaction(K, hc) {
  const tw = 2.1, td = 0.52;
  K.box(tw, 0.08, td, 0, 0.04, 0.02, IC.cream);
  K.box(tw + 0.04, 0.05, 0.05, 0, 0.065, td / 2 + 0.03, hc);
  K.box(tw + 0.04, 0.05, 0.05, 0, 0.065, -td / 2 + 0.01, hc);
  const y = 0.08, rC = 0.14, rO = 0.13, Z = 0.02, A = { ws: 16, hs: 12 }, sym = hc.clone().multiplyScalar(0.78); // 符號用深一點的館色，在米色托盤上才看得清楚
  K.sph(rC, -0.84, y + rC, Z, CH.carbon, A);                                                      // C
  K.box(0.24, 0.06, 0.07, -0.56, y + 0.04, Z, sym); K.box(0.07, 0.06, 0.24, -0.56, y + 0.04, Z, sym); // ＋
  const o1 = [-0.38, y + rO, Z], o2 = [-0.12, y + rO, Z];                                          // O＝O
  K.sph(rO, ...o1, CH.oxy, A); K.sph(rO, ...o2, CH.oxy, A); bond(K, o1, o2, 2, [0, 1, 0]);
  K.box(0.16, 0.06, 0.08, 0.08, y + 0.04, Z, sym);                                                 // →
  K.add(new THREE.ConeGeometry(0.13, 0.17, 20), M(0.24, y + 0.04, Z, 0, 0, -Math.PI / 2).multiply(Ms(0, 0, 0, 0.4, 1, 1)), sym);
  const a = [0.47, y + rO, Z], c = [0.72, y + rC, Z], b = [0.97, y + rO, Z];                       // O＝C＝O
  K.sph(rO, ...a, CH.oxy, A); K.sph(rC, ...c, CH.carbon, A); K.sph(rO, ...b, CH.oxy, A);
  bond(K, a, c, 2, [0, 1, 0]); bond(K, c, b, 2, [0, 1, 0]);
  // 托盤後面一根小火柴（碳燃燒）
  K.rod([-0.86, 0.1, -0.36], [-0.5, 0.1, -0.5], 0.022, IC.wood, { seg: 12 });
  K.sph(0.035, -0.5, 0.1, -0.5, IC.red, { ws: 12, hs: 8 });
  K.add(new THREE.ConeGeometry(0.05, 0.16, 16), M(-0.47, 0.19, -0.51), IC.orange, { noHull: true });
  return 0.5;
}

// 4 氧化與還原：高爐煉鐵（爐身、送料斜坡、爐頂的煙）→ 出鐵口流出紅熱的鐵水 → 鐵水桶；旁邊一疊鐵錠
function itemFurnace(K) {
  const fx = -0.3, fz = -0.32;
  lathe(K, [[0.36, 0], [0.4, 0.22], [0.42, 0.42], [0.34, 0.9], [0.26, 1.28], [0, 1.28]], fx, 0, fz, CH.brick, { seg: 28 });
  for (const y of [0.62, 1.02]) K.torus(y < 0.8 ? 0.39 : 0.31, 0.022, fx, y, fz, IC.metalD, { rs: 4, ts: 24 });
  K.torus(0.5, 0.035, fx, 0.36, fz, IC.steel, { rs: 4, ts: 32 });                                  // 熱風環管
  K.cyl(0.12, 0.14, 0.12, fx, 1.33, fz, IC.metalD);
  [[0.0, 1.5, 0.0, 0.12], [0.08, 1.66, -0.06, 0.14]].forEach(([x, y, z, r]) => K.sph(r, fx + x, y, fz + z, 0xd8d4d0, { ws: 12, hs: 8 }));
  // 熱風爐（右後方兩座圓頂高塔），用熱風管接到爐身的環管
  for (const [x, z, h] of [[0.34, -0.66, 1.0], [0.68, -0.34, 0.86]]) {
    K.cyl(0.17, 0.18, h, x, h / 2, z, 0xd9d2c4);
    K.add(new THREE.SphereGeometry(0.17, 20, 5, 0, TAU, 0, Math.PI / 2), M(x, h, z), 0xb9b2a4);
  }
  K.tube([[0.34, 0.5, -0.66], [0.5, 0.42, -0.5], [0.68, 0.5, -0.34]], 0.04, IC.steel, { n: 12, rs: 6 });
  K.tube([[0.5, 0.42, -0.5], [0.2, 0.4, -0.4], [fx + 0.48, 0.36, fz - 0.1]], 0.04, IC.steel, { n: 12, rs: 6 });
  // 出鐵口 → 鐵水溝（紅熱）→ 鐵水桶
  const cz0 = fz + 0.38, cz1 = 0.5;
  K.box(0.2, 0.08, cz1 - cz0, fx, 0.04, (cz0 + cz1) / 2, IC.metalD);
  K.box(0.12, 0.02, cz1 - cz0 + 0.02, fx, 0.085, (cz0 + cz1) / 2, CH.hot, { noHull: true });
  K.box(0.07, 0.022, cz1 - cz0, fx, 0.092, (cz0 + cz1) / 2, CH.hotY, { noHull: true });
  K.cyl(0.08, 0.08, 0.1, fx, 0.12, cz0 - 0.02, 0x3b2a22, { seg: 20, rx: Math.PI / 2, noHull: true });
  const lx = fx, lz = 0.76;
  K.cyl(0.26, 0.21, 0.3, lx, 0.15, lz, 0x4a4f55, { seg: 28 });
  K.cyl(0.235, 0.235, 0.02, lx, 0.29, lz, CH.hot, { seg: 28, noHull: true });
  K.cyl(0.14, 0.14, 0.022, lx, 0.295, lz, CH.hotY, { seg: 24, noHull: true });
  for (const s of [-1, 1]) K.box(0.08, 0.06, 0.06, lx + s * 0.27, 0.22, lz, IC.metalD);
  K.rod([fx, 0.1, cz1 - 0.02], [lx, 0.28, lz - 0.16], 0.03, CH.hot, { seg: 12, noHull: true });
  // 一疊鐵錠（右前方）
  const ix = 0.48, iz = 0.32;
  for (const [x, y, z, r] of [[-0.1, 0, -0.04, 0], [0.1, 0, -0.04, 0], [0, 0.09, -0.04, Math.PI / 2]]) {
    prism(K, [[-0.08, 0], [0.08, 0], [0.06, 0.09], [-0.06, 0.09]], -0.2, 0.4, CH.iron);           // 梯形斷面的鐵錠
    xform(K, K.parts.length - 1, M(ix + x, y, iz + z, 0, r, 0));
  }
  return 1.8;
}

// 5 電解質、酸鹼與鹽類：鐵架上的滴定管 → 錐形瓶（酚酞變粉紅）＋前面一排 pH 比色卡
function itemTitration(K, hc) {
  const sx = -0.42, sz = -0.42, fx = 0.02, fz = -0.12;
  K.box(0.86, 0.06, 0.56, -0.18, 0.03, -0.2, IC.metalD);
  K.box(0.36, 0.012, 0.36, fx, 0.066, fz, IC.white, { noHull: true });                             // 白色墊片（看清楚顏色）
  K.cyl(0.032, 0.032, 1.8, sx, 0.9, sz, IC.steel, { seg: 20 });
  // 滴定管：玻璃管、裡面的鹼液、活栓、尖嘴，用夾子夾在鐵架上
  const bt = 1.78, bb = 0.8;
  K.cyl(0.05, 0.05, bt - bb, fx, (bt + bb) / 2, fz, IC.glass, { glass: true, alpha: 0.45, seg: 20 });
  K.cyl(0.038, 0.038, 0.62, fx, bb + 0.31, fz, 0xd8eef8, { seg: 20 });
  for (let i = 0; i < 8; i++) K.box(i % 2 ? 0.03 : 0.05, 0.008, 0.008, fx - 0.015, bb + 0.1 + i * 0.1, fz + 0.051, IC.ink, { noHull: true });
  K.cyl(0.03, 0.03, 0.12, fx, bb - 0.04, fz, IC.glass, { glass: true, alpha: 0.5, seg: 20 });
  K.box(0.14, 0.035, 0.035, fx, bb - 0.05, fz, IC.blue);                                            // 活栓
  K.add(new THREE.ConeGeometry(0.03, 0.12, 20), M(fx, bb - 0.16, fz, Math.PI, 0, 0), IC.glass, { glass: true, alpha: 0.5 });
  K.sph(0.022, fx, bb - 0.28, fz, 0xd8eef8, { ws: 16, hs: 12, noHull: true });                      // 一滴
  for (const y of [1.0, 1.55]) {
    K.rod([sx, y, sz], [fx, y, fz], 0.016, IC.metalD, { seg: 10 });
    K.cyl(0.07, 0.07, 0.06, fx, y, fz, hc, { seg: 20 });
  }
  erlen(K, fx, 0.072, fz, 0.95, CH.pink, 0.17);
  // pH 比色卡：1（紅）→ 7（綠）→ 14（紫），斜斜朝鏡頭
  const k0 = K.parts.length;
  K.box(1.62, 0.04, 0.26, 0, 0, 0, IC.white);
  const PH = [0xe23b2e, 0xee5a2c, 0xf3862f, 0xf6b23a, 0xf2d63a, 0xc9dc48, 0x8fcf4e, 0x4fbf5a, 0x3fae86, 0x3a9bb0, 0x3a7be0, 0x4a5bd0, 0x6a4bc0, 0x7a3aa0];
  PH.forEach((c, i) => K.box(0.1, 0.012, 0.16, -0.75 + i * 0.1154, 0.024, 0.01, c, { noHull: true }));
  xform(K, k0, M(0, 0.1, 0.68, 0.38, 0, 0));
  K.box(1.4, 0.1, 0.08, 0, 0.05, 0.64, hc);
  return bt + 0.04;
}

// 6 反應速率與化學平衡：能量山坡模型（紅色高山＝沒有催化劑，綠色低山＝有催化劑，小球要翻過活化能）
//   ＋燒杯放在畫了 X 的紙上（硫代硫酸鈉實驗，溶液變混濁看不到 X）＋碼表
function itemRate(K, hc) {
  // 能量山坡（正面輪廓擠出），整塊往後仰
  const z0 = -0.78, D = 0.26, zf = z0 + D, X0 = -0.86, X1 = 0.86;
  const prof = bump => {
    const pts = [[X0, 0]];
    for (let i = 0; i <= 28; i++) {
      const x = X0 + (X1 - X0) * i / 28, t = Math.min(1, Math.max(0, (x + 0.3) / 0.6)), base = 0.36 + (0.14 - 0.36) * t * t * (3 - 2 * t);
      pts.push([x, base + bump * Math.exp(-((x + 0.02) ** 2) / 0.05)]);
    }
    pts.push([X1, 0]);
    return pts;
  };
  const k0 = K.parts.length;
  prism(K, prof(0.62), z0, D, hc);
  prism(K, prof(0.26), zf, 0.05, IC.green);
  K.sph(0.085, -0.66, 0.36 + 0.085, zf - 0.04, IC.red, { ws: 16, hs: 12 });
  tiltBack(K, k0, 0.55, z0, zf + 0.05, X1);
  // 燒杯＋X 紙
  const bx = -0.46, bz = 0.38;
  K.box(0.52, 0.012, 0.52, bx, 0.006, bz, CH.paper, { noHull: true });
  for (const r of [0.785, -0.785]) K.box(0.36, 0.006, 0.05, bx, 0.015, bz, IC.ink, { ry: r, noHull: true });
  K.cyl(0.19, 0.185, 0.36, bx, 0.192, bz, IC.glass, { glass: true, alpha: 0.32, open: true, seg: 28 });
  K.cyl(0.175, 0.175, 0.24, bx, 0.14, bz, 0xf0d860, { glass: true, alpha: 0.72, seg: 28 });   // 混濁的淡黃色溶液（X 快看不到了）
  K.torus(0.19, 0.016, bx, 0.372, bz, IC.white, { rs: 4, ts: 28, noHull: true });
  // 碼表（平躺、稍微朝鏡頭）
  const k1 = K.parts.length;
  K.cyl(0.3, 0.3, 0.09, 0, 0, 0, IC.steel, { seg: 40 });
  K.cyl(0.26, 0.26, 0.012, 0, 0.05, 0, IC.white, { seg: 40, noHull: true });
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; K.box(0.016, 0.008, i % 3 ? 0.035 : 0.06, Math.sin(a) * 0.21, 0.058, -Math.cos(a) * 0.21, IC.ink, { ry: -a, noHull: true }); }
  K.box(0.02, 0.01, 0.2, 0.06, 0.065, -0.06, IC.red, { ry: -0.6, noHull: true });
  K.cyl(0.02, 0.02, 0.02, 0, 0.068, 0, IC.ink, { seg: 20, noHull: true });
  K.cyl(0.05, 0.05, 0.08, 0, 0, -0.33, IC.metalD, { seg: 20, rx: Math.PI / 2 });
  K.cyl(0.07, 0.07, 0.05, 0, 0, -0.39, hc, { seg: 20, rx: Math.PI / 2 });
  xform(K, k1, M(0.42, 0.14, 0.36, 0.3, -0.25, 0));
  return 1.0;
}

// 7 有機化學與生活分子：乙醇（酒精）的球棍模型，立在細桿上（黑＝碳、紅＝氧、白＝氫）
function itemOrganic(K, hc) {
  K.cyl(0.26, 0.3, 0.07, -0.08, 0.035, 0.05, hc, { seg: 28 });
  K.cyl(0.026, 0.026, 0.62, -0.08, 0.38, 0.05, IC.steel, { seg: 20 });
  const C1 = [-0.36, 0.78, 0.04], C2 = [0.08, 0.92, -0.04], O = [0.48, 0.74, 0.08], HO = [0.74, 0.92, 0.18];
  const away = (p, d, L) => { const v = new THREE.Vector3(...d).normalize().multiplyScalar(L); return [p[0] + v.x, p[1] + v.y, p[2] + v.z]; };
  const H = [away(C1, [-0.8, 0.45, 0.1], 0.36), away(C1, [-0.1, -0.35, 0.95], 0.36), away(C1, [-0.15, -0.3, -0.95], 0.36),
    away(C2, [-0.05, 0.6, 0.8], 0.36), away(C2, [0.1, 0.55, -0.85], 0.36), HO];
  bond(K, C1, C2); bond(K, C2, O); bond(K, O, HO);
  for (const h of H.slice(0, 3)) bond(K, C1, h);
  for (const h of H.slice(3, 5)) bond(K, C2, h);
  const A = { ws: 16, hs: 12 };
  K.sph(0.17, ...C1, CH.carbon, A); K.sph(0.17, ...C2, CH.carbon, A); K.sph(0.155, ...O, CH.oxy, A);
  for (const h of H) K.sph(0.1, ...h, CH.hyd, { ws: 12, hs: 9 });
  return 1.3;
}

// 8 電化學與化學電池：鋅銅電池（鋅片在硫酸鋅、銅片在藍色硫酸銅、中間鹽橋）用導線接到後面的伏特計
function itemCell(K, hc) {
  const zx = -0.5, cx = 0.5, bz = 0.16, br = 0.27, bh = 0.46;
  beaker(K, zx, 0, bz, br, bh, 0xe6f3f6, 0.32);
  beaker(K, cx, 0, bz, br, bh, CH.cuso4, 0.32);
  const pz = bz - 0.06;
  K.box(0.2, 0.56, 0.03, zx - 0.06, 0.37, pz, CH.zinc);                                            // 鋅片（−）
  K.box(0.2, 0.56, 0.03, cx + 0.06, 0.37, pz, CH.copper);                                          // 銅片（＋）
  // 鹽橋：倒 U 形管（裝著白色的鹽溶液凝膠），兩腳插進兩杯
  const sz = bz + 0.1, sy = 0.5, sr = 0.42;
  K.torus(sr, 0.045, 0, sy, sz, IC.cream, { rx: 0, arc: Math.PI, ts: 24, rs: 8 });
  for (const s of [-1, 1]) K.cyl(0.045, 0.045, 0.32, s * sr, sy - 0.16, sz, IC.cream, { seg: 20 });
  // 伏特計（後方）
  const vx = 0, vz = -0.62;
  K.box(0.56, 0.24, 0.34, vx, 0.12, vz, 0x3f5552);
  K.box(0.46, 0.012, 0.24, vx, 0.246, vz + 0.01, IC.white, { noHull: true });
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; K.box(0.012, 0.006, 0.04, vx + Math.sin(a) * 0.16, 0.254, vz + 0.08 - Math.cos(a) * 0.16, IC.ink, { ry: -a, noHull: true }); }
  K.box(0.012, 0.008, 0.17, vx + 0.04, 0.258, vz + 0.0, IC.red, { ry: -0.3, noHull: true });
  for (const [s, c] of [[-1, 0x2f3638], [1, IC.red]]) K.cyl(0.035, 0.035, 0.08, vx + s * 0.2, 0.28, vz + 0.12, c, { seg: 20 });
  // 導線：鋅片 → 黑色（−）端子；銅片 → 紅色（＋）端子
  K.tube([[zx - 0.06, 0.65, pz], [zx - 0.06, 0.82, pz - 0.1], [-0.36, 0.55, -0.42], [-0.2, 0.32, vz + 0.12]], 0.024, 0x2f3638, { n: 28, rs: 6 });
  K.tube([[cx + 0.06, 0.65, pz], [cx + 0.06, 0.82, pz - 0.1], [0.36, 0.55, -0.42], [0.2, 0.32, vz + 0.12]], 0.024, IC.red, { n: 28, rs: 6 });
  return 0.9;
}

const UNIT_ITEMS = {
  physics: {
    'physics-01': itemBalance, 'physics-02': itemTuningFork, 'physics-03': itemOptics, 'physics-04': itemHeat, 'physics-05': itemPressure,
    'physics-06': itemIncline, 'physics-07': itemOrbit, 'physics-08': itemCoaster, 'physics-09': itemCircuit, 'physics-10': itemMagnet,
  },
  chemistry: {
    'chemistry-01': itemAirGas, 'chemistry-02': itemAtomTable, 'chemistry-03': itemReaction, 'chemistry-04': itemFurnace,
    'chemistry-05': itemTitration, 'chemistry-06': itemRate, 'chemistry-07': itemOrganic, 'chemistry-08': itemCell,
  },
  earth: {
    'earth-01': itemWaterLand, 'earth-02': itemPlates, 'earth-03': itemSpace, 'earth-04': itemWeather, 'earth-05': itemClimate,
  },
};
const ITEM_PLINTH = { r: 1.22, h: 0.3 }; // 有小物品的單元站：矮而寬的圓台
// 一個單元的小物品（含圓台）；沒有表就回傳 null（沿用原本的小底座）
function unitItemParts(hall, unitId, withPlinth = true) {
  const fn = (UNIT_ITEMS[hall.id] || {})[unitId];
  if (!fn) return null;
  const K = itemKit();
  const h = fn(K, new THREE.Color(hall.color));
  const y0 = withPlinth ? ITEM_PLINTH.h + 0.02 : 0.02;
  for (const p of K.parts) p.m = new THREE.Matrix4().makeTranslation(0, y0, 0).multiply(p.m);
  if (withPlinth) {
    K.parts.push({ g: new THREE.CylinderGeometry(ITEM_PLINTH.r, ITEM_PLINTH.r + 0.08, ITEM_PLINTH.h, 40), m: M(0, ITEM_PLINTH.h / 2, 0), color: new THREE.Color(0xefe5c6) });
    K.parts.push({ g: new THREE.CylinderGeometry(ITEM_PLINTH.r + 0.005, ITEM_PLINTH.r + 0.005, 0.05, 40, 1, true), m: M(0, ITEM_PLINTH.h - 0.04, 0), color: new THREE.Color(hall.color), noHull: true });
  }
  return { parts: K.parts, h: h + y0 };
}

// ---------- 地形：球外與地標共用 ----------
// 領土的「領域扭曲」：把方向用 fbm 推一下再找最近的種子，邊界就會彎彎曲曲（不是直線 Voronoi）
const TERR_WARP = 0.36, TERR_WF = 2.6;
function warpDir(d, a, out) {
  const f = TERR_WF, x = d.x, y = d.y, z = d.z;
  return out.set(
    x + a * (fbm(x * f + 11.3, y * f + 2.9, z * f + 5.1) - 0.5),
    y + a * (fbm(x * f + 3.7, y * f + 8.2, z * f + 1.4) - 0.5),
    z + a * (fbm(x * f + 7.9, y * f + 5.6, z * f + 9.3) - 0.5)).normalize();
}
const HALL_SEP = Math.sqrt(8 / 3); // 正四面體兩頂點（單位向量）的距離
const TERR_SHADE_DL = [0, -0.12, 0.06, -0.06]; // 領土的四階明暗（HSL 的 L 差）
function makeTerrain(hallDirs) {
  // ctx.seeds[館][i]：第 i 個單元領土的種子方向（球面單位向量）
  const ctx = { seeds: null };
  const w = new THREE.Vector3(), w2 = new THREE.Vector3();
  // full＝false：只要高度（六角磚的角），不算領土，省時間
  function terrain(d, full = true) {
    let n = fbm(d.x * 1.8 + 4.2, d.y * 1.8 + 1.7, d.z * 1.8 + 9.1);
    let best = -1, bestDot = -2;
    hallDirs.forEach((hd, i) => {
      const dd = d.dot(hd);
      if (dd > bestDot) { bestDot = dd; best = i; }
    });
    const mask = smooth(0.5, 0.78, bestDot); // 館的區域：整塊都是陸地，館與館之間才有海
    n += mask * 0.55;
    let e = n > 0.5 ? 0.1 + 1.0 * Math.pow(smooth(0.72, 1.3, n), 1.4) : 0; // 丘陵起伏
    let nd = 99, pd = 99, hall = best, ter = -1, bd = 99;
    if (ctx.seeds && mask > 0.05) {
      pd = R * Math.acos(clamp(bestDot, -1, 1));
      // 最近的單元站（沒扭曲的距離）：站的周圍壓平
      let bn = -2;
      for (const p of ctx.seeds[best]) { const dd = d.x * p.x + d.y * p.y + d.z * p.z; if (dd > bn) bn = dd; }
      nd = R * Math.acos(clamp(bn, -1, 1));
      if (n > 0.5) { // 廣場、單元站周圍壓平
        const flat = Math.max(1 - smooth(1.9, 3.0, pd), 1 - smooth(1.4, 2.8, nd));
        e = lerp(e, E_FLAT, flat);
        if (full) {
          // 館與館的交界也一起扭曲
          warpDir(d, TERR_WARP, w);
          let o1 = -2, o2 = -2;
          hallDirs.forEach((hd, i) => { const q = w.dot(hd); if (q > o1) { o2 = o1; o1 = q; hall = i; } else if (q > o2) o2 = q; });
          bd = ((o1 - o2) / HALL_SEP) * R;
          // 單元站附近扭曲得少一點，站一定落在自己領土的中間
          let r1 = -2;
          for (const p of ctx.seeds[hall]) { const q = d.x * p.x + d.y * p.y + d.z * p.z; if (q > r1) r1 = q; }
          const k = smooth(0.75, 2.0, R * Math.acos(clamp(r1, -1, 1)));
          w2.copy(d).lerp(w, k).normalize();
          // 只找最近兩個種子：屬於哪一塊、離國界多遠（弧長）
          const ss = ctx.seeds[hall];
          let i1 = -1, i2 = -1, a1 = -2, a2 = -2;
          for (let i = 0; i < ss.length; i++) { const q = w2.dot(ss[i]); if (q > a1) { a2 = a1; i2 = i1; a1 = q; i1 = i; } else if (q > a2) { a2 = q; i2 = i; } }
          ter = i1;
          if (i2 >= 0) bd = Math.min(bd, ((a1 - a2) / ss[i1].distanceTo(ss[i2])) * R);
        }
      }
    }
    return { n, e, hall, mask, nd, pd, ter, bd };
  }
  terrain.ctx = ctx;
  return terrain;
}

// ---------- 領土：種子位置（地圖座標，直式） ----------
const SPHERE_S = 0.82; // 地圖座標 → 球面弧長的縮放
// 每館固定一串「空位」：照順序繞著雕像一圈一圈往外排（順時針、從上方開始），
// 只依位置編號用固定的偽隨機抖動 → 之後新增單元只是多佔下一個空位，舊領土不會動。
// 空位必須：在館內地圖的可視範圍內（EXT.v）、避開中央廣場與出口、在陸地上、屬於這一館。
const SLOT_RINGS = [[[3.3, 4.8, 6], [5.1, 8.7, 11], [5.5, 10.3, 14]], [[3.0, 5.6, 9], [4.4, 7.4, 14], [5.2, 9.4, 18], [4.6, 9.8, 20]]];
function territorySlots(hi, b, gatesV, landOk) {
  const out = [];
  let k = 0;
  SLOT_RINGS.forEach((rings, pass) => {
    const ms = pass ? 2.2 : 3.1, salt = pass ? 50 : 0; // 第一輪排得寬鬆，滿了才用第二輪補空隙
    let a0 = -Math.PI / 2;
    for (const [rx, rz, n] of rings) {
      for (let j = 0; j < n; j++, k++) {
        const a = a0 + (j / n) * TAU;
        const x = rx * Math.cos(a) + (hash3(k * 1.7 + salt, 3.1, 0.9) - 0.5) * 0.9;
        const z = rz * Math.sin(a) + (hash3(k * 2.3 + salt, 7.7, 4.1) - 0.5) * 0.9;
        if (Math.abs(x) > EXT.v.ex - 1.4 || Math.abs(z) > EXT.v.ey - 1.6) continue;
        if (x * x + z * z < 2.8 * 2.8) continue;                          // 中央廣場（雕像）
        if (gatesV.some(g => Math.hypot(x - g.x, z - g.z) < 2.7)) continue; // 出口
        if (out.some(p => Math.hypot(x - p.x, z - p.z) < ms)) continue;
        if (!landOk(x, z)) continue;
        out.push({ x, z });
      }
      a0 += Math.PI / n;
    }
  });
  return out;
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
  // 單元小物品的玻璃（量筒、燒杯、燈泡）：半透明、不寫深度，裡面的水和燈絲看得到
  const glassMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, transparent: true, depthWrite: false }); // 透明度在頂點色的 alpha
  const glassMesh = g => { const m = new THREE.Mesh(g, glassMat); m.renderOrder = 2; return m; };

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

  // ----- 出口位置（地圖座標，直式）：沿著「隔壁館所在的方向」放在地圖邊緣 -----
  function gatePositions(hi) {
    const { E, Np } = bases[hi], ext = EXT.v;
    return hallDirs.map((od, oj) => {
      if (oj === hi) return null;
      let dx = od.dot(E), dz = -od.dot(Np); // 本地 x 往右、z 往螢幕下方
      const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const k = Math.min((ext.ex - 1.2) / Math.max(Math.abs(dx), 1e-3), (ext.ey - 1.4) / Math.max(Math.abs(dz), 1e-3));
      return { x: dx * k, z: dz * k, toIndex: oj };
    }).filter(Boolean);
  }

  // ----- 領土種子＝單元站：球面方向（hallNodes）與地圖座標（hallSeedsV，直式）是同一組點 -----
  const hallNodes = [], hallSeedsV = [];
  {
    const wv = new THREE.Vector3();
    halls.forEach((hall, hi) => {
      const b = bases[hi];
      const landOk = (x, z) => {
        const d = expDir(b, { x, z }, SPHERE_S);
        if (terrain(d, false).n < 0.64) return false;
        warpDir(d, TERR_WARP, wv);
        let o = 0, od = -2;
        hallDirs.forEach((hd, i) => { const q = wv.dot(hd); if (q > od) { od = q; o = i; } });
        return o === hi;
      };
      const slots = territorySlots(hi, b, gatePositions(hi), landOk);
      if (slots.length < hall.units.length) console.warn('[galileo] ' + hall.id + ' 館的領土空位不夠：' + slots.length + ' < ' + hall.units.length);
      const pts = hall.units.map((u, i) => slots[i] || { x: 0, z: -2.4 - 0.1 * i });
      hallSeedsV.push(pts);
      hallNodes.push(pts.map(p => expDir(b, p, SPHERE_S)));
    });
  }
  terrain.ctx.seeds = hallNodes;
  // 相鄰的領土用不同明暗（四階，種子靠得近就避開已用過的那一階）
  const hallShade = hallSeedsV.map(ps => {
    const sh = [];
    ps.forEach((p, i) => {
      const used = new Set();
      for (let j = 0; j < i; j++) if (Math.hypot(p.x - ps[j].x, p.z - ps[j].z) < 6.5) used.add(sh[j]);
      let k = 0; while (used.has(k) && k < 3) k++;
      sh.push(k);
    });
    return sh;
  });

  // ----- 地面配色：星球和館內平面地圖共用同一套 -----
  const groundColor = (() => {
    const tc3 = new THREE.Color();
    const hallCol = halls.map(h => new THREE.Color(h.color));
    // 領土：同一館同色系，四階明暗（hallShade）讓相鄰的領土分得出來；每塊裡面再用低頻雜訊分兩種很接近的田野色
    const SHADE_DL = TERR_SHADE_DL;
    const tones = hallCol.map((c, i) => {
      const hsl = {}; c.getHSL(hsl);
      if (halls[i].id === 'earth') hsl.l = Math.min(0.8, hsl.l + 0.05);
      const mk = (dh, ds, dl) => new THREE.Color().setHSL((hsl.h + dh + 1) % 1, clamp(hsl.s + ds, 0, 1), clamp(hsl.l + dl, 0, 1));
      return SHADE_DL.map((dl, k) => [mk(0.008 * k, 0.02 * (k & 1), dl), mk(0.008 * k + 0.01, -0.03, dl + 0.02)]);
    });
    const BORDER = hallCol.map(c => c.clone().lerp(new THREE.Color(0xfbf7ea), 0.72)); // 國界：淺色細線
    const BORDER_W = 0.15, BORDER_SH = 0.36;                                         // 線寬、線旁陰影（球面弧長）
    const ROCK = hallCol.map(c => c.clone().lerp(new THREE.Color(0xa89f8e), 0.55)), SNOW = new THREE.Color(0xf6f8f4);
    const ACCENT_HEX = { physics: [0xf6b088, 0xfff6e0, 0xe8c65a], chemistry: [0xfde047, 0xfff6e0, 0xb48cff], earth: [0xf5f8fa, 0xc9d3dc, 0x7bc47a], biology: [0xf7a8c4, 0xfff6e0, 0xfde047] };
    const ACC = halls.map(h => (ACCENT_HEX[h.id] || ACCENT_HEX.biology).map(x => new THREE.Color(x)));
    const DEEP = new THREE.Color(0x0f4a66), SHALLOW = new THREE.Color(0x2c93b4), FOAM = new THREE.Color(0xa6e6ea), GLINT = new THREE.Color(0x6fc6dc), SAND = new THREE.Color(0xf0e2b0);
    const PLAZA = new THREE.Color(0xe9e2cf), NODE_C = hallCol.map(c => c.clone().multiplyScalar(0.55));
    const nodeR = 1.1; // 單位：球面弧長
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
        const hh = tr.hall, tn = tones[hh][tr.ter >= 0 ? hallShade[hh][tr.ter] : 0];
        const pn = vnoise(x * 6.5 + hh * 3.1, y * 6.5 + 1.3, z * 6.5 + 7.7) + 0.22 * (vnoise(x * 21 + 5, y * 21, z * 21 + 2) - 0.5);
        c = tc3.copy(tn[pn < 0.55 ? 0 : 1]);
        if (tr.e > 0.62) c.lerp(ROCK[hh], 0.7 * smooth(0.62, 0.95, tr.e));       // 山坡露出岩石
        if (tr.e > 0.98) c.lerp(SNOW, smooth(0.98, 1.08, tr.e));                  // 山頂積雪
        if (tr.n < 0.6) c.lerp(SAND, 0.35);                                       // 靠海邊偏沙色
        if (tr.nd < nodeR) { c = NODE_C[hh]; bevel = 0.96; }
        else if (tr.pd < 1.9) { c = PLAZA; bevel = 0.95; }
        else if (tr.bd < BORDER_W) { c = BORDER[hh]; bevel = 0.97; }              // 國界線
        else if (tr.bd < BORDER_SH) c.multiplyScalar(0.8);                        // 國界旁一圈稍暗，線更清楚
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
      ce[t] = terrain(tmp.set(x, y, z), false).e;
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

  // ----- 球外的單元地標：每塊領土中央一站，立著用封面做的小牌子 -----
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
    const parts = [], itemParts = [];
    const up = new THREE.Vector3(0, 1, 0);
    hall.units.forEach((u, i) => {
      const dir = hallNodes[hi][i];
      const rad = R + terrain(dir).e - 0.05;
      const item = unitItemParts(hall, u.id);
      let signPos;
      if (item) {
        // 單元小物品：和館內地圖同一件，縮小放在領土中央；「地圖的上方」對齊球面的北方（Np），和進館後看到的方向一樣
        const s = PLANET_ITEM_S;
        const tN = Np.clone().addScaledVector(dir, -Np.dot(dir)).normalize();
        const tE = new THREE.Vector3().crossVectors(tN, dir);
        const basis = new THREE.Matrix4().makeBasis(tE, dir, tN.clone().negate());
        const bm = basis.setPosition(dir.clone().multiplyScalar(rad)).multiply(new THREE.Matrix4().makeScale(s, s, s));
        for (const pt of item.parts) { pt.m = bm.clone().multiply(pt.m); itemParts.push(pt); }
        // 封面小牌子：立在物品後方（北邊）一根細桿上，從太空看不會蓋住物品
        const foot = dir.clone().multiplyScalar(rad).addScaledVector(tN, (ITEM_PLINTH.r + 0.15) * s);
        const top = foot.clone().addScaledVector(dir, item.h * s + 0.55);
        parts.push({ g: new THREE.CylinderGeometry(0.035, 0.045, item.h * s + 0.55, 12), m: new THREE.Matrix4().compose(foot.clone().add(top).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(up, dir), new THREE.Vector3(1, 1, 1)), color: new THREE.Color(0xcfc8b4) });
        signPos = top.addScaledVector(dir, 0.42);
      } else {
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
        const base = new THREE.Matrix4().compose(dir.clone().multiplyScalar(rad), q, new THREE.Vector3(1, 1, 1));
        parts.push({ g: new THREE.CylinderGeometry(0.42, 0.5, 0.16, 10), m: base.clone().multiply(M(0, 0.08, 0)), color: col.clone() });
        parts.push({ g: new THREE.CylinderGeometry(0.07, 0.09, 1.3, 6), m: base.clone().multiply(M(0, 0.8, 0)), color: new THREE.Color(0xcfc8b4) });
        signPos = dir.clone().multiplyScalar(rad + 1.95);
      }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(u.emoji), transparent: true, depthWrite: false }));
      sp.position.copy(signPos);
      const sh = item ? PLANET_SIGN_H : 1.1;
      sp.scale.set(sh, sh, 1);
      sp.userData = { hallId: hall.id, unitId: u.id };
      signSprites.push(sp);
      landmarks.add(sp);
      addSign(u.id, sp, sh, null);
    });
    if (itemParts.length) {
      const ig = buildMerged(itemParts, 0.022, { inflate: true });
      landmarks.add(new THREE.Mesh(ig.body, toonMat), new THREE.Mesh(ig.hull, hullMat));
      if (ig.glass) landmarks.add(glassMesh(ig.glass));
    }
    // 特色小景：散在館的區域，避開單元站、廣場與國界線
    const rule = PROP_RULE[hall.id] || { count: PROP_COUNT, nd: 3.0 };
    const placed = [], tan = new THREE.Vector3(), dd = new THREE.Vector3();
    for (let tries = 0; placed.length < rule.count && tries < 6000; tries++) {
      const a = hash3(hi * 9.1, tries * 1.37, 2.2) * TAU, r = 0.22 + 0.7 * Math.sqrt(hash3(hi * 3.3, tries * 0.71, 5.5));
      tan.copy(E).multiplyScalar(Math.cos(a)).addScaledVector(Np, Math.sin(a));
      dd.copy(n).multiplyScalar(Math.cos(r)).addScaledVector(tan, Math.sin(r)).normalize();
      const t = terrain(dd);
      if (t.hall !== hi || t.mask < 0.55 || t.n < 0.62 || t.nd < rule.nd || t.pd < 3.6 || t.bd < 0.55) continue;
      if (placed.some(pp => pp.dot(dd) > Math.cos(1.2 / R))) continue;
      placed.push(dd.clone());
      const q = new THREE.Quaternion().setFromUnitVectors(up, dd).multiply(new THREE.Quaternion().setFromAxisAngle(up, hash3(tries, hi, 1.1) * TAU));
      const hero = placed.length <= 2;
      const kind = hero ? HERO_KIND[hall.id] : pickKind(hall.id, hash3(tries * 0.7, hi, 8.8));
      const big = (kind === 'volcano' || kind === 'mountain') ? 0.72 : 0.5;
      const sc = hero ? 1.05 : big + 0.32 * hash3(tries, hi, 4.4);
      propRecs.push({ dd: dd.clone(), kind, sc, ang: hash3(tries, hi, 1.1) * TAU, tries, hi, e: t.e, nd: t.nd, bd: t.bd });
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
    const q = new THREE.Quaternion(), qs = new THREE.Quaternion(), mtx = new THREE.Matrix4(), tintC = new THREE.Color();
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
          if (t.hall !== hi || t.n < 0.57 || t.mask < 0.3 || t.nd < 1.35 || t.pd < 2.15 || t.bd < 0.42) continue;
          if (kind === 'tuft' && t.e > 0.95) continue; // 山頂積雪處不長草
          got++;
          const h3 = hash3(tries * 0.37, hi + 2.2, kind === 'tuft' ? 1.9 : 4.7);
          q.setFromUnitVectors(up, dd).multiply(qs.setFromAxisAngle(up, h3 * TAU));
          const sz = kind === 'tuft' ? 0.75 + 0.7 * h3 : 0.6 + 1.0 * h3;
          pv.copy(dd).multiplyScalar(R + t.e - (kind === 'tuft' ? 0.03 : 0.04));
          sv.set(sz, kind === 'tuft' ? sz : sz * 0.62, sz);
          mtx.compose(pv, q, sv);
          const pal = kind === 'tuft' ? spec.grass : spec.rock;
          let colr = pal[Math.floor(h3 * 997) % pal.length];
          if (kind === 'tuft' && t.ter >= 0) colr = tintC.set(colr).offsetHSL(0, 0, TERR_SHADE_DL[hallShade[hi][t.ter]] * 0.8).getHex(); // 草也跟著領土分明暗
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

    // 地圖的內容（地面與領土、站牌、雕像、出口）放在 content 裡；橫式螢幕時整個轉 90 度
    const content = new THREE.Group();
    map.add(content);
    // 底盤：館色邊框（地面本身是「攤平的星球」，第一次用到時才建，見 ensureGround）
    {
      const mm = buildMerged([{ g: new THREE.CylinderGeometry(DISC_R + 0.55, DISC_R + 0.8, 0.5, 64), m: M(0, -0.5, 0), color: col.clone().multiplyScalar(0.6) }], 0.08);
      map.add(new THREE.Mesh(mm.body, toonMat), new THREE.Mesh(mm.hull, hullMat));
    }
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
      const item = unitItemParts(hall, u.id);
      let signY = 1.75, signZ = 0, sz = 1.5, szF = 2.05;
      if (item) {
        // 單元小物品（含圓台）；封面小牌子縮小、抬到物品上方
        const mg = buildMerged(item.parts, 0.035, { inflate: true });
        const body = new THREE.Group();
        body.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
        if (mg.glass) body.add(glassMesh(mg.glass));
        ex.add(body);
        ex.userData.item = body;
        // 鏡頭從南方斜斜往下看（HALL_PITCH）：畫面上的「高度」≈ y·sin(p) − z·cos(p)。
        // 牌子放在物品後上方，牌子的下緣剛好高過物品在畫面上的最高點，就不會擋住物品
        const sp = Math.sin(HALL_PITCH), cp = Math.cos(HALL_PITCH), pa = mg.body.attributes.position.array;
        let top = 0;
        for (let k = 0; k < pa.length; k += 3) if (pa[k + 1] > ITEM_PLINTH.h + 0.01) top = Math.max(top, pa[k + 1] * sp - pa[k + 2] * cp);
        sz = MAP_SIGN.size; szF = MAP_SIGN.focus;
        signZ = -MAP_SIGN.back;
        signY = Math.max(item.h + 0.15, (top + MAP_SIGN.gap + sz / 2 + signZ * cp) / sp);
      } else {
        const pp = [];
        pp.push({ g: new THREE.CylinderGeometry(0.62, 0.8, 0.55, 14), m: M(0, 0.28, 0), color: new THREE.Color(0xefe5c6) });
        pp.push({ g: new THREE.CylinderGeometry(0.72, 0.72, 0.1, 14), m: M(0, 0.6, 0), color: col.clone() });
        const mg = buildMerged(pp, 0.06);
        ex.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
      }
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(u.emoji), transparent: true, depthWrite: false }));
      sprite.position.set(0, signY, signZ);
      sprite.scale.set(sz, sz, 1);
      ex.add(sprite);
      const ep = new THREE.Mesh(item ? new THREE.CylinderGeometry(1.35, 1.35, signY + sz * 0.6, 12) : new THREE.SphereGeometry(1.25, 8, 6), hiddenMat);
      ep.position.y = item ? (signY + sz * 0.6) / 2 : 1.1;
      ep.userData.unitId = u.id;
      ex.add(ep);
      content.add(ex);
      const exObj = { group: ex, sprite, size: sz, target: sz, base: sz, focusSize: szF, signY, hop: 0, hopTarget: 0, aspect: 1 };
      exhibits.push(exObj);
      addSign(u.id, sprite, null, exObj);
      exProxies.push(ep);
      unitIndex.set(u.id, { hall: hi, index: i });
    });
    const focusRing = new THREE.Mesh(
      (UNIT_ITEMS[hall.id] ? new THREE.RingGeometry(1.36, 1.62, 48) : new THREE.RingGeometry(0.98, 1.22, 28)).rotateX(-Math.PI / 2), // 有小物品的館：圓台較寬，光圈也跟著放大
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
      anchor, icon: iconP, iconMap, statueProxies: stM.proxies, exhibits, exProxies, gates, gateProxies, focusRing, N,
      q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, bases[hi].Np, n)).invert(),
      focus: 0, layoutV: null, nodes: [],
    });
  });

  // ----- 地圖版面：一律先用「直式」排好（和星球上的領土是同一組點），橫式螢幕就把整張地圖轉 90 度 -----
  const HS = 1 / SPHERE_S; // 球面長度 → 地圖長度
  function layoutBase(h) {
    const hi = hallObjs.indexOf(h);
    h.nodesV = h.exhibits.map((e, i) => {
      const p = hallSeedsV[hi][i];
      e.group.position.set(p.x, 0, p.z);
      return new THREE.Vector3(p.x, 0, p.z);
    });
    // 雕像在中央廣場（館的正中心）
    h.statueV = new THREE.Vector3(0, 0, 0);
    h.iconMap.position.copy(h.statueV);
    const gp = gatePositions(hi);
    h.gatesV = h.gates.map(gt => {
      const p = gp.find(g => g.toIndex === gt.toIndex);
      gt.group.position.set(p.x, 0, p.z);
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
      // 地圖是近看，大的造景（火山、山）不可以壓到站牌和國界線
      if (rec.nd * HS - foot < 2.2 || rec.bd * HS - foot < 0.2) continue;
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
    // 外觀＝蟲洞段那一台高畫質太空梭（shuttle3d.js 共用模型，20261027k）；位置、縮放、軌道、轉彎傾斜、點擊重播都和原本一樣
    const sh3 = buildShuttle(THREE, { anisotropy: Math.min(4, renderer.capabilities.getMaxAnisotropy()) });
    sh3.U.uRimCol.value.setRGB(0.2, 0.26, 0.3);      // 淡淡的冷色輪廓光（取代卡通描邊，在星球前也看得清楚）
    sh3.U.uRimDir.value.set(0, 1, 0);
    sh3.U.uTailCol.value.setRGB(0.16, 0.28, 0.5);    // 尾焰照亮機尾
    sh3.setThrust(1, 0, 0.45);
    shuttle.add(sh3.group);
    flames.push(...sh3.flames);                      // flicker() 照舊用 scale.z 調整火焰長度
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
  // 0＝在太空看星球，1＝站在地面上走（放大到靠近地面時）
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
  // 放大到地面時，自動轉到最近的一個單元站前面（面向地圖的上方）
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
    h.exhibits.forEach((e, i) => { e.target = i === info.index ? e.focusSize : e.base; e.hopTarget = i === info.index ? 0.35 : 0; });
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

  // 館內地圖座標（直式）→ 這一點屬於哪個單元的領土（海、沙灘、別館、廣場都回傳 null）
  function unitAtMap(h, p) {
    const hi = hallObjs.indexOf(h);
    if (Math.hypot(p.x, p.z) > DISC_R - 0.3) return null;
    const tr = terrain(expDir(bases[hi], p, SPHERE_S));
    if (tr.n < 0.56 || tr.hall !== hi || tr.ter < 0 || tr.pd < 1.9) return null;
    return h.hall.units[tr.ter] ? h.hall.units[tr.ter].id : null;
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
      } else if (h.ground) {
        // 點到地面：落在哪一塊領土就選哪個單元
        const gh = raycaster.intersectObject(h.ground.children[0], false)[0];
        const u = gh && unitAtMap(h, h.content.worldToLocal(gh.point.clone()));
        if (u) { focusUnit(u, false); handlers.onExhibitPick(u); }
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
  let qSamples = [], loopFrames = 0;
  let lastDebug = 0;
  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector3();

  function invalidate() {
    lastWake = performance.now();
    onlyAmbient = false;
    if (running) return;
    running = true;
    loopFrames = 0;
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
          e.sprite.position.y = e.signY + e.hop + (e.size - e.base) / 2; // 放大時往上長，不往下蓋到物品
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
    // 品質自動降級：只降不升（背景小動畫刻意 30 fps，不算）。
    //   20261027l：迴圈剛啟動的前 8 格（著色器第一次用、紋理上傳）與開場光速飛行的前 30%（約 1.7 秒：這時開場的蟲洞畫布與出洞閃光還疊在上面、
    //   開場資源正在釋放）不算，免得開場那一下把整個星球的解析度白白降一級、之後再也升不回來。
    if (++loopFrames > 8 && !(intro && intro.u < 0.3) && !quality && !ambientFrame && !onlyAmbient) {
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
    // 錄影用：顯示／隱藏單元看板
    debugSigns(v) { signSprites.forEach(sp => { sp.visible = !!v; }); invalidate(); },
    // 錄影用：目前模式與狀態
    debugState() { return { mode: state.mode, k: state.k, zoomP: state.zoomP, gb: groundBlend(), flight: !!flight, intro: !!intro }; },
    // 檢查用：把開場停在某個進度 u（0～1）
    debugIntro(u) { if (!intro) beginIntro(); intro.phase = 'fly'; intro.fixedU = u; invalidate(); },
    // 檢查用：領土資訊（每館的種子地圖座標、各領土在館內地圖可視範圍裡的面積、種子是否落在自己的領土中）
    debugTerritories() {
      return halls.map((hall, hi) => {
        const b = bases[hi], N = hall.units.length, area = new Array(N).fill(0), STEP = 0.2;
        let land = 0, other = 0;
        for (let z = -EXT.v.ey; z <= EXT.v.ey; z += STEP) for (let x = -EXT.v.ex; x <= EXT.v.ex; x += STEP) {
          const tr = terrain(expDir(b, { x, z }, SPHERE_S));
          if (tr.n <= 0.5) continue;
          land++;
          if (tr.hall === hi && tr.ter >= 0) area[tr.ter] += STEP * STEP; else other++;
        }
        const seeds = hallSeedsV[hi].map((p, i) => {
          const tr = terrain(hallNodes[hi][i]);
          return { x: +p.x.toFixed(2), z: +p.z.toFixed(2), own: tr.hall === hi && tr.ter === i, border: +tr.bd.toFixed(2), land: tr.n > 0.56 };
        });
        return { id: hall.id, units: N, territories: new Set(seeds.map((s, i) => i)).size, area: area.map(a => +a.toFixed(1)), seeds, shade: hallShade[hi] };
      });
    },
    // 檢查用：館內放大到某個單元（zoom 越小越近），回傳 true
    debugZoomUnit(unitId, zoom = 0.45) { if (!unitIndex.has(unitId)) return false; state.zoomH = clamp(zoom, 0.4, 1.35); focusUnit(unitId, true); handlers.onExhibitPick && handlers.onExhibitPick(unitId); return true; },
    // 檢查用：館內畫面上 (cx,cy) 點下去會選到哪個單元（不觸發任何動作）
    debugPick(cx, cy) {
      if (state.mode !== 'hall' || state.hallVis < 0) return null;
      const rect = canvas.getBoundingClientRect();
      ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
      applyVisibility(); applyCamera(); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
      raycaster.setFromCamera(ndc, camera);
      const h = hallObjs[state.hallVis];
      const hit = raycaster.intersectObjects(h.exProxies.concat(h.gateProxies, h.statueProxies), false)[0];
      if (hit) return hit.object.userData.unitId || hit.object.userData.gateHall || hit.object.userData.statueHall;
      const gh = h.ground && raycaster.intersectObject(h.ground.children[0], false)[0];
      return gh ? 'ground:' + unitAtMap(h, h.content.worldToLocal(gh.point.clone())) : null;
    },
    // 檢查用：每個單元小物品的三角形數（本體／描邊／玻璃）
    debugItemTris() {
      const tri = g => (g ? g.attributes.position.count / 3 : 0);
      const out = {};
      halls.forEach(hall => hall.units.forEach(u => {
        const it = unitItemParts(hall, u.id);
        if (!it) return;
        const mg = buildMerged(it.parts, 0.035, { inflate: true });
        out[u.id] = { body: tri(mg.body), hull: tri(mg.hull), glass: tri(mg.glass), h: +it.h.toFixed(2) };
        mg.body.dispose(); mg.hull.dispose(); if (mg.glass) mg.glass.dispose();
      }));
      return out;
    },
    // 檢查用：館內地圖上 (x,z)（直式座標）屬於哪個單元
    debugUnitAt(hallId, x, z) { const h = hallObjs[halls.findIndex(q => q.id === hallId)]; return unitAtMap(h, { x, z }); },
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
