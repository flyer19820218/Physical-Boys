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

// ---------- 地形：球外與地標共用 ----------
function makeTerrain(hallDirs) {
  return function terrain(d) {
    let n = fbm(d.x * 1.8 + 4.2, d.y * 1.8 + 1.7, d.z * 1.8 + 9.1);
    let flat = false, best = -1, bestDot = -2;
    hallDirs.forEach((hd, i) => {
      const dd = d.dot(hd);
      if (dd > bestDot) { bestDot = dd; best = i; }
      if (dd > 0.95) flat = true;
    });
    const mask = smooth(0.5, 0.78, bestDot); // 館的區域：整塊都是陸地，館與館之間才有海
    n += mask * 0.55;
    let e = n > 0.5 ? Math.min(0.8, 0.22 + (n - 0.5) * 1.2) : 0;
    if (flat) e = 0.2;
    return { n, e, hall: best, mask };
  };
}

// ---------- 場景 ----------
export async function createScene({ canvas, halls, reducedMotion, quality, debugEl, handlers }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dprCap = quality === 'low' ? 1 : quality === 'mid' ? 1.5 : 2;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
  const PR_STEPS = [2, 1.5, 1.25, 1];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 800);

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

  // ----- 星球本體 -----
  const planet = new THREE.Group();
  scene.add(planet);
  const planetMeshes = [];
  {
    const geo = new THREE.IcosahedronGeometry(R, 7);
    const pos = geo.attributes.position;
    const faces = pos.count / 3;
    const colors = new Float32Array(pos.count * 3);
    const hullPos = new Float32Array(pos.count * 3);
    const dir = new THREE.Vector3(), tmpC = new THREE.Color();
    const hex = h => tmpC.setHex(h).clone();
    const OCEAN = [hex(0x2f7fb3), hex(0x3a8fc2)], SHALLOW = hex(0x62c0cf), SAND = hex(0xe9dca2);
    const GRASS = [hex(0x74c26d), hex(0x5eab5a)], FOREST = hex(0x3f8f4f), ROCK = hex(0xa9a08a), ICE = hex(0xf3f7f8);
    const hallCol = halls.map(h => new THREE.Color(h.color));
    for (let f = 0; f < faces; f++) {
      let ne = 0, ee = 0, ly = 0, mk = 0;
      const hallVotes = [0, 0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const i = f * 3 + k;
        dir.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
        const t = terrain(dir);
        const polar = Math.abs(dir.y) > 0.9;
        const eh = polar ? Math.max(t.e, 0.12) : t.e;
        pos.setXYZ(i, dir.x * (R + eh), dir.y * (R + eh), dir.z * (R + eh));
        ne += t.n; ee += eh; ly += Math.abs(dir.y); mk += t.mask; hallVotes[t.hall]++;
      }
      ne /= 3; ee /= 3; ly /= 3; mk /= 3;
      const r = hash3(f * 0.37, f * 0.91, 3.3);
      let c;
      if (ly > 0.9) c = ICE;
      else if (ee <= 0.001) c = ne > 0.44 ? SHALLOW : OCEAN[r > 0.5 ? 1 : 0];
      else if (ee < 0.3) c = SAND;
      else if (ee < 0.62) c = GRASS[r > 0.5 ? 1 : 0];
      else if (ee < 0.88) c = FOREST;
      else c = ROCK;
      if (ee > 0.001 && ly <= 0.9) { // 各館的陸地帶一點館色，從遠處就分得出四個區域
        c = c.clone().lerp(hallCol[hallVotes.indexOf(Math.max(...hallVotes))], 0.3 * mk);
      }
      for (let k = 0; k < 3; k++) {
        const i = f * 3 + k;
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
    }
    geo.computeVertexNormals();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const len = Math.hypot(x, y, z), s = (len + 0.28) / len;
      hullPos[i * 3] = x * s; hullPos[i * 3 + 1] = y * s; hullPos[i * 3 + 2] = z * s;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const hullGeo = new THREE.BufferGeometry();
    hullGeo.setAttribute('position', new THREE.BufferAttribute(hullPos, 3));
    const a = new THREE.Mesh(geo, planetMat), b = new THREE.Mesh(hullGeo, planetHullMat);
    planet.add(a, b);
    planetMeshes.push(a, b);
  }

  // ----- 雲 -----
  const clouds = (() => {
    const blobs = [];
    const dir = new THREE.Vector3();
    let guard = 0;
    while (blobs.length < 44 && guard++ < 600) {
      dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      if (hallDirs.some(h => dir.dot(h) > 0.93)) continue; // 不要遮到館
      const centre = dir.clone().multiplyScalar(R + 4.4 + Math.random() * 0.8);
      const tangent = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0.3)).normalize();
      const count = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count && blobs.length < 44; i++) {
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

  // ----- 球外的單元地標（只看不能點） -----
  const landmarks = new THREE.Group();
  planet.add(landmarks);
  halls.forEach((hall, hi) => {
    const { n, Np, E } = bases[hi];
    const col = new THREE.Color(hall.color);
    const parts = [];
    const N = hall.units.length;
    const tan = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    hall.units.forEach((u, i) => {
      const ang = 0.34 + 0.5 * Math.sqrt((i + 0.5) / N);       // 離館中心的角度：0.34～0.84 弧度
      const az = i * 2.39996 + hi * 1.3;                          // 黃金角螺旋，分佈均勻
      tan.copy(E).multiplyScalar(Math.cos(az)).addScaledVector(Np, Math.sin(az));
      dir.copy(n).multiplyScalar(Math.cos(ang)).addScaledVector(tan, Math.sin(ang)).normalize();
      const e = Math.max(terrain(dir).e, 0.1);
      const rad = R + e - 0.12;
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const base = new THREE.Matrix4().compose(dir.clone().multiplyScalar(rad), q, new THREE.Vector3(1, 1, 1));
      parts.push({ g: new THREE.CylinderGeometry(0.32, 0.42, 1.2, 8), m: base.clone().multiply(M(0, 0.6, 0)), color: new THREE.Color(0xefe5c6) });
      parts.push({ g: new THREE.ConeGeometry(0.56, 0.85, 8), m: base.clone().multiply(M(0, 1.6, 0)), color: col.clone() });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(u.emoji), transparent: true, depthWrite: false }));
      sp.position.copy(dir).multiplyScalar(rad + 2.5);
      sp.scale.set(1.55, 1.55, 1);
      landmarks.add(sp);
    });
    const mg = buildMerged(parts, 0.05);
    landmarks.add(new THREE.Mesh(mg.body, toonMat), new THREE.Mesh(mg.hull, hullMat));
  });

  // ----- 四座館 -----
  const hallObjs = [];
  const hallProxies = [];
  const unitIndex = new Map(); // unitId -> {hall, index}

  halls.forEach((hall, hi) => {
    const col = new THREE.Color(hall.color);
    const hex = hall.color;
    const baseParts = [], bldParts = [];
    const PB = (g, m, c, noHull) => baseParts.push({ g, m, color: new THREE.Color(c), noHull });
    const P = (g, m, c) => bldParts.push({ g, m, color: new THREE.Color(c) });
    // 平台（球外看得到；進館後讓位給地圖）
    PB(new THREE.CylinderGeometry(5.2, 5.7, 3.2, 28), M(0, -1.52, 0), col.clone().multiplyScalar(0.55));
    PB(new THREE.CylinderGeometry(5.0, 5.0, 0.12, 28), M(0, 0.02, 0), 0xefe5c6, true);
    // 建築
    if (hall.id === 'physics') {            // 伽利略的觀星台
      P(new THREE.CylinderGeometry(1.7, 1.9, 1.5, 16), M(0, 0.85, 0), 0xe9dfc4);
      P(new THREE.SphereGeometry(1.7, 16, 8, 0, TAU, 0, Math.PI / 2), M(0, 1.6, 0), hex);
      P(new THREE.TorusGeometry(1.74, 0.09, 6, 24), M(0, 1.6, 0, Math.PI / 2, 0, 0), 0xb8862b);
      P(new THREE.CylinderGeometry(0.28, 0.36, 2.4, 10), M(0, 2.7, -0.3, -0.95, 0, 0), 0xc9a24a);
      P(new THREE.BoxGeometry(0.7, 1.0, 0.12), M(0, 0.6, 1.86), 0x6b4f3a);
    } else if (hall.id === 'chemistry') {   // 錐形瓶塔
      P(new THREE.CylinderGeometry(0.55, 1.9, 2.6, 16), M(0, 1.4, 0), hex);
      P(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 12), M(0, 3.35, 0), 0xf6d3bb);
      P(new THREE.CylinderGeometry(0.78, 0.64, 0.18, 12), M(0, 4.08, 0), 0xe0713a);
      P(new THREE.IcosahedronGeometry(0.24, 1), M(0.25, 4.7, 0.1), 0xfff3e6);
      P(new THREE.IcosahedronGeometry(0.17, 1), M(-0.25, 5.1, 0), 0xfff3e6);
      P(new THREE.IcosahedronGeometry(0.12, 1), M(0.1, 5.5, 0.1), 0xfff3e6);
    } else if (hall.id === 'earth') {       // 山與雪頂
      P(new THREE.ConeGeometry(2.1, 3.2, 9), M(0, 1.7, 0), 0x8f7358);
      P(new THREE.ConeGeometry(1.02, 1.36, 9), M(0, 2.66, 0), 0xf4f7f8);
      P(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6), M(0, 3.9, 0), 0xefe5c6);
      P(new THREE.BoxGeometry(0.6, 0.36, 0.04), M(0.32, 4.15, 0), hex);
    } else {                                // 生物：溫室與兩棵樹
      P(new THREE.BoxGeometry(2.8, 1.5, 2.2), M(0, 0.85, 0), 0xd9efe2);
      P(new THREE.CylinderGeometry(1.5, 1.5, 2.2, 3).rotateX(-Math.PI / 2), M(0, 2.35, 0), hex);
      P(new THREE.BoxGeometry(0.7, 0.9, 0.1), M(0, 0.55, 1.12), 0x4fae60);
      for (const sx of [-1, 1]) {
        P(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 6), M(sx * 1.75, 0.55, -0.55), 0x7a5a3a);
        P(new THREE.IcosahedronGeometry(0.62, 1), M(sx * 1.75, 1.4, -0.55), 0x4fae60);
      }
    }
    const bm = buildMerged(baseParts, 0.07);
    const bd = buildMerged(bldParts, 0.07);

    const g = new THREE.Group();
    const baseG = new THREE.Group();
    baseG.add(new THREE.Mesh(bm.body, toonMat), new THREE.Mesh(bm.hull, hullMat));
    const bldG = new THREE.Group();
    bldG.add(new THREE.Mesh(bd.body, toonMat), new THREE.Mesh(bd.hull, hullMat));
    g.add(baseG, bldG);
    const { n, E } = bases[hi];
    const Zl = new THREE.Vector3().crossVectors(E, n);
    g.position.copy(n).multiplyScalar(PLATEAU_TOP);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, n, Zl));
    planet.add(g);

    const proxy = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 6, 10), hiddenMat);
    proxy.position.y = 2.4;
    proxy.userData.hallIndex = hi;
    g.add(proxy);
    hallProxies.push(proxy);

    const anchor = new THREE.Object3D();
    anchor.position.y = 5.6;
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
      exhibits.push({ group: ex, sprite, size: 1.5, target: 1.5, hop: 0, hopTarget: 0 });
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
      hall, group: g, baseG, bldG, map, anchor, exhibits, exProxies, gates, gateProxies, focusRing, pathHolder, N,
      q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, bases[hi].Np, n)).invert(),
      focus: 0, layoutV: null, nodes: [], start: new THREE.Vector3(),
    });
  });

  // ----- 地圖版面：彎路與單元站（直式螢幕走直路，橫式螢幕走橫路） -----
  const pathMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
  function layoutHall(h, vertical) {
    h.layoutV = vertical;
    const N = h.N;
    const waves = clamp(N / 3.4, 1.6, 3.4);
    const curve = t => vertical
      ? { x: 3.2 * Math.sin(t * Math.PI * waves), z: (t - 0.5) * 2 * 7.6 }
      : { x: (t - 0.5) * 2 * 8.6, z: 3.0 * Math.sin(t * Math.PI * waves) };
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
    // 建築縮小後放在路的起點外側
    const s0 = curve(0);
    h.start.set(vertical ? s0.x : s0.x - 3.4, 0, vertical ? s0.z - 3.2 : s0.z);
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
  function applyCamera() {
    posP.set(0, 0, planetDistance() * state.zoomP);
    const dH = hallDistance() * state.zoomH;
    tgtH.set(pan.x, pan.y, PLATEAU_TOP + MAP_Y);
    // 鏡頭從南側往北看，近的在畫面下方，帶一點立體感
    posH.set(0, -Math.sin(HALL_PITCH) * dH, Math.cos(HALL_PITCH) * dH).add(tgtH);
    camera.position.lerpVectors(posP, posH, state.k);
    camera.up.set(0, 1, 0);
    camera.lookAt(lerp(0, tgtH.x, state.k), lerp(0, tgtH.y, state.k), lerp(0, tgtH.z, state.k));
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
    clouds.visible = k < 0.35;
    hallObjs.forEach((h, i) => {
      const isVis = i === state.hallVis;
      h.group.visible = k < 0.55 || isVis;
      h.baseG.visible = k < 0.7 || !isVis;
      h.map.visible = isVis && k > 0.5;
      const mScale = isVis ? smooth(0.5, 0.95, k) : 0;
      h.map.scale.setScalar(Math.max(0.001, mScale));
      // 建築：球外在平台正中央；進館後縮小移到地圖起點
      const b = isVis ? smooth(0.45, 1, k) : 0;
      h.bldG.position.set(h.start.x * b, MAP_Y * b, h.start.z * b);
      h.bldG.scale.setScalar(lerp(1, 0.42, b));
    });
  }

  // ----- 飛行 -----
  function startFlight(toQ, toK, instant, dip = 0, toHallIdx = -1) {
    const fromQ = planet.quaternion.clone();
    const target = toQ.clone();
    if (fromQ.dot(target) < 0) target.set(-target.x, -target.y, -target.z, -target.w);
    omega.set(0, 0, 0);
    if (instant || reducedMotion) {
      planet.quaternion.copy(target);
      state.k = toK;
      if (toHallIdx >= 0) state.hallVis = toHallIdx;
      flight = null;
    } else {
      flight = { t0: performance.now(), dur: dip ? 1700 : 1200, fromQ, toQ: target, fromK: state.k, toK, dip, toHallIdx, swapped: false };
    }
    invalidate();
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
    if (state.mode === 'planet') {
      const hit = raycaster.intersectObjects(hallProxies, false)[0];
      if (hit) handlers.onHallPick(halls[hit.object.userData.hallIndex].id);
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
        const z = clamp(pinchZoom * (pinchStart / d), state.mode === 'planet' ? 0.62 : 0.4, state.mode === 'planet' ? 1.5 : 1.35);
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
      const speed = 1 / (0.42 * Math.min(W, H));
      const axis = new THREE.Vector3(dy, dx, 0);
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
    if (state.mode === 'planet') state.zoomP = clamp(state.zoomP * f, 0.62, 1.5);
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
      } else if (state.mode === 'planet' && !dragging && now - lastInteract > 450 && !reducedMotion) {
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
          e.sprite.scale.set(e.size, e.size, 1);
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
    const sceneHidden = state.k > 0.3;
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
