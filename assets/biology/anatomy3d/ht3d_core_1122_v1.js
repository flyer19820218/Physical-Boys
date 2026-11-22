/* ht3d_core_1122_v1.js — 3D 醫學版血液循環的可重用核心（ES module）
 * 場景／材質／鏡頭／血流粒子／標籤／放大窗／播放器。場景資料（器官、步驟）放在 ht3d_scene_*.js。
 *
 * 設計重點
 *  - 一個場景＝一個 glb（每個結構一個 node，名稱＝si_parts 的 id）＋ 中心線 json（si_centerlines_v1.json）。
 *  - 畫面任何時刻都由 stateAt(step, 秒) 決定（純函式）：鏡頭、透明度、流動區段、標籤、追蹤血球、放大窗。
 *    有聲講解可以 go(step, ms) 直接跳到某步某秒。
 *  - 只有一條 requestAnimationFrame；暫停或播完就停（OrbitControls 轉動時才補畫一張）；document.hidden 時停。
 *  - 每幀不配置記憶體：粒子矩陣、顏色都直接寫進預先配置好的 typed array。
 *  - 顏色：動脈鮮紅、靜脈暗紅偏紫；不畫藍色血液。背景用黑板色 #11261f（不用純黑）。
 */
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from '../../vendor/three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../vendor/three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from '../../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const frac = (x) => x - Math.floor(x);
const RICH = new THREE.Color('#e3312c'), POOR = new THREE.Color('#7c2238');   // 鮮紅／暗紅偏紫（全站共識，不用藍色）
export const GAP = 1.5;   // 老師講解：步驟之間停頓秒數（與 human_transport_teach_0118_v1.js 相同）

/* 心動週期脈動：f(τ)=max(0,sin(2πτ/T))²，F(t)=∫f 的解析式（同一時刻永遠算出同一個位置，可重現） */
function pulseIntegral(t, T) {
  const n = Math.floor(t / T), tau = t - n * T;
  const part = tau < T / 2 ? tau / 2 - (T / (8 * Math.PI)) * Math.sin((4 * Math.PI * tau) / T) : T / 4;
  return n * (T / 4) + part;
}
function flowDistance(type, v, t, T) {
  if (type === 'pulse') return v * (0.45 * t + 1.4 * pulseIntegral(t, T));      // 動脈：快、脈動
  if (type === 'pulseSoft') return v * (0.75 * t + 0.5 * pulseIntegral(t, T));  // 小動脈：脈動變小
  return v * t;                                                                   // 微血管 slow／靜脈 steady：平穩
}
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/* ---------- 中心線：等距重取樣＋平行移動標架（T,N,B） ---------- */
class Path {
  constructor(id, pts, rad, step = 0.0006) {
    this.id = id;
    const n0 = pts.length, cum = new Float64Array(n0);
    for (let i = 1; i < n0; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
    const len = cum[n0 - 1] || 1e-6, N = Math.max(2, Math.round(len / step) + 1);
    this.len = len; this.n = N;
    const P = (this.P = new Float32Array(N * 3)), R = (this.R = new Float32Array(N));
    let j = 0;
    for (let i = 0; i < N; i++) {
      const d = (i / (N - 1)) * len;
      while (j < n0 - 2 && cum[j + 1] < d) j++;
      const f = cum[j + 1] > cum[j] ? (d - cum[j]) / (cum[j + 1] - cum[j]) : 0;
      for (let k = 0; k < 3; k++) P[i * 3 + k] = pts[j][k] + (pts[j + 1][k] - pts[j][k]) * f;
      R[i] = rad[j] + (rad[j + 1] - rad[j]) * f;
    }
    const T = (this.T = new Float32Array(N * 3)), Nn = (this.N = new Float32Array(N * 3)), B = (this.B = new Float32Array(N * 3));
    const t = new THREE.Vector3(), nrm = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const a = Math.max(0, i - 1), c = Math.min(N - 1, i + 1);
      t.set(P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]).normalize();
      if (i === 0) { nrm.set(0, 1, 0); if (Math.abs(t.y) > 0.9) nrm.set(1, 0, 0); }
      nrm.addScaledVector(t, -nrm.dot(t)).normalize();
      b.crossVectors(t, nrm);
      T.set([t.x, t.y, t.z], i * 3); Nn.set([nrm.x, nrm.y, nrm.z], i * 3); B.set([b.x, b.y, b.z], i * 3);
    }
    let rs = 0; for (let i = 0; i < N; i++) rs += R[i]; this.rMean = rs / N;
  }
  point(u, out) { const f = clamp01(u) * (this.n - 1), i = Math.min(this.n - 2, Math.floor(f)), g = f - i, P = this.P; return out.set(P[i * 3] + (P[i * 3 + 3] - P[i * 3]) * g, P[i * 3 + 1] + (P[i * 3 + 4] - P[i * 3 + 1]) * g, P[i * 3 + 2] + (P[i * 3 + 5] - P[i * 3 + 2]) * g); }
  index(u) { return Math.min(this.n - 1, Math.round(clamp01(u) * (this.n - 1))); }
}

/* ---------- 紅血球：雙凹圓盤（Evans–Fung 外形，直徑 1） ---------- */
function rbcGeometry(seg) {
  const pts = [], R = 0.5, n = 9;
  const z = (r) => { const x = r / R, s = Math.sqrt(Math.max(0, 1 - x * x)); return 0.5 * s * (0.207 + 2.003 * x * x - 1.123 * x ** 4) * 0.5; };
  for (let i = 0; i <= n; i++) { const r = (i / n) * R * 0.999; pts.push(new THREE.Vector2(r, z(r) + 0.004)); }
  for (let i = n; i >= 0; i--) { const r = (i / n) * R * 0.999; pts.push(new THREE.Vector2(r, -z(r) - 0.004)); }
  const g = new THREE.LatheGeometry(pts, seg); g.computeVertexNormals(); return g;
}

/* ---------- 變半徑單層管：沿 Path 的標架與半徑（p.R）畫一根管（管壁＝血流範圍，不另外套外殼） ---------- */
function varTube(p, u0, u1, radial, stepM) {
  const i0 = p.index(u0), i1 = Math.max(i0 + 1, p.index(u1));
  const stride = Math.max(1, Math.round(stepM / (p.len / (p.n - 1))));
  const idx = []; for (let i = i0; i < i1; i += stride) idx.push(i); idx.push(i1);
  const rings = idx.length, pos = new Float32Array(rings * radial * 3), nor = new Float32Array(rings * radial * 3), uv = new Float32Array(rings * radial * 2), ind = [];
  for (let r = 0; r < rings; r++) {
    const i = idx[r], k = i * 3, R = p.R[i];
    for (let a = 0; a < radial; a++) {
      const ang = (a / radial) * TAU, c = Math.cos(ang), s = Math.sin(ang), o = (r * radial + a) * 3;
      const dx = p.N[k] * c + p.B[k] * s, dy = p.N[k + 1] * c + p.B[k + 1] * s, dz = p.N[k + 2] * c + p.B[k + 2] * s;
      pos[o] = p.P[k] + dx * R; pos[o + 1] = p.P[k + 1] + dy * R; pos[o + 2] = p.P[k + 2] + dz * R;
      nor[o] = dx; nor[o + 1] = dy; nor[o + 2] = dz;
      uv[(r * radial + a) * 2] = a / radial; uv[(r * radial + a) * 2 + 1] = r / (rings - 1);
    }
  }
  for (let r = 0; r < rings - 1; r++) for (let a = 0; a < radial; a++) {
    const a1 = (a + 1) % radial, A = r * radial + a, B = (r + 1) * radial + a, C = (r + 1) * radial + a1, D = r * radial + a1;
    ind.push(A, D, B, B, D, C);   // (N,B,T) 為右手系：這個順序讓正面朝外
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(ind); return g;
}

/* ---------- 材質：MeshPhysical＋邊緣微光（fresnel）＝醫學圖譜的次表面感 ---------- */
function rimMaterial(opts) {
  const m = new THREE.MeshPhysicalMaterial({
    color: opts.color, roughness: opts.rough ?? 0.5, metalness: 0, clearcoat: opts.clearcoat ?? 0.15, clearcoatRoughness: 0.45,
    sheen: opts.sheen ? 0.6 : 0, sheenColor: new THREE.Color(opts.sheen || '#ffffff'), sheenRoughness: 0.55,
    envMapIntensity: opts.env ?? 0.55, vertexColors: !!opts.vertexColors, side: THREE.FrontSide
  });
  const rim = new THREE.Color(opts.rim || opts.sheen || '#ffd8c8');
  m.userData.rim = { value: rim.multiplyScalar(opts.rimStrength ?? 0.32) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = m.userData.rim;
    sh.fragmentShader = 'uniform vec3 rimColor;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  { float rimF = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.6); totalEmissiveRadiance += rimColor * rimF; }');
  };
  m.customProgramCacheKey = () => 'ht3d-rim-v1';
  return m;
}

/* =====================================================================================
 * Viewer
 * ===================================================================================== */
export async function createViewer(o) {
  const SC = o.scene, host = o.host, lite = !!o.lite;
  const V = { lite, lang: o.lang || 'zh', stats: { rafCount: 0, frames: 0, frameMs: 0, fps: 0 }, disposed: false };
  const tr = (p) => (Array.isArray(p) ? p[V.lang === 'en' ? 1 : 0] : String(p ?? ''));

  /* --- DOM --- */
  const wrap = document.createElement('div'); wrap.className = 'ht3d-layers';
  host.append(wrap);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !lite, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { wrap.remove(); throw new Error('webgl'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x11261f, 0);
  renderer.domElement.className = 'ht3d-gl';
  renderer.domElement.setAttribute('aria-label', o.ariaLabel || '3D');
  wrap.append(renderer.domElement);
  const css2d = new CSS2DRenderer(); css2d.domElement.className = 'ht3d-labels'; wrap.append(css2d.domElement);
  const ui = document.createElement('div'); ui.className = 'ht3d-ui'; wrap.append(ui);
  const chipL = document.createElement('div'), chipR = document.createElement('div');
  chipL.className = 'ht3d-chip ht3d-chip-l'; chipR.className = 'ht3d-chip ht3d-chip-r'; ui.append(chipL, chipR);
  const note = document.createElement('div'); note.className = 'ht3d-note'; ui.append(note);
  /* 放大窗（2D 畫布＋連線） */
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'ht3d-link');
  const link = document.createElementNS('http://www.w3.org/2000/svg', 'line'), ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('r', '14'); svg.append(link, ring); ui.append(svg);
  const inset = document.createElement('div'); inset.className = 'ht3d-inset';
  const insetBox = document.createElement('div'); insetBox.className = 'ht3d-inset-box';
  const insetCanvas = document.createElement('canvas'); insetCanvas.width = 960; insetCanvas.height = 600; insetBox.append(insetCanvas);
  const insetTag = document.createElement('div'); insetTag.className = 'ht3d-inset-tag'; inset.append(insetTag, insetBox);
  ui.append(inset);
  const insetCtx = insetCanvas.getContext('2d');

  /* --- three 場景 --- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1.6, 0.004, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04); scene.environment = envRT.texture;
  scene.add(new THREE.HemisphereLight(0xfff2e6, 0x1d3a30, 0.55));
  const key = new THREE.DirectionalLight(0xfff0e0, 2.1); key.position.set(-0.6, 1.0, 1.1); scene.add(key);   // 主光：左上前方
  const fill = new THREE.DirectionalLight(0xd8e8ff, 0.7); fill.position.set(0.9, 0.3, 0.6); scene.add(fill);  // 補光
  const back = new THREE.DirectionalLight(0xffe2d0, 1.0); back.position.set(0.1, 0.6, -1.2); scene.add(back); // 輪廓光
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.minDistance = 0.025; controls.maxDistance = 1.8;
  controls.enablePan = true; controls.screenSpacePanning = true;

  /* --- 載入 --- */
  const progress = (f) => o.onProgress && o.onProgress(f);
  const get = (u) => fetch(u, { cache: 'force-cache' }).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const glbUrl = lite ? SC.glbLite : SC.glb;
  let gltf, parts, CL;
  try {
    [parts, CL, gltf] = await Promise.all([get(SC.parts), get(SC.centerlines), new Promise((res, rej) => loader.load(glbUrl, res, (e) => { if (e.total) progress(Math.min(0.95, e.loaded / e.total)); }, rej))]);
  } catch (e) { pmrem.dispose(); envRT.dispose(); renderer.dispose(); renderer.forceContextLoss(); wrap.remove(); throw e; }
  progress(1);
  const PARTS = new Map(parts.map((p) => [p.id, p]));
  const SAN = new Map(parts.map((p) => [THREE.PropertyBinding.sanitizeNodeName(p.id), p.id]));
  const GROUP_OF = new Map();
  for (const [g, ids] of Object.entries(SC.groups)) for (const id of ids) if (!GROUP_OF.has(id)) GROUP_OF.set(id, g);
  const ROUTE = new Set(SC.routeVessels);

  /* 結構 */
  const structures = new Map();   // id → {id, meshes, mat, kind, group, op}
  const root = gltf.scene; scene.add(root);
  const REPL = new Set(Object.keys(SC.replaceMesh || {})), dropMeshes = [];   // replaceMesh：這些群組不畫資料集的網格外殼，改畫單層管（見下）
  root.traverse((ob) => {
    if (!ob.isMesh) return;
    // GLTFLoader 會把 node 名稱的「.」去掉（PropertyBinding.sanitizeNodeName），用對照表找回 si_parts 的 id
    const id = SAN.get(ob.name) || (ob.parent && SAN.get(ob.parent.name)) || ob.name;
    if (REPL.has(GROUP_OF.get(id))) { dropMeshes.push(ob); return; }
    let s = structures.get(id);
    if (!s) {
      const p = PARTS.get(id) || {}; const kind = p.kind || 'organ';
      const group = GROUP_OF.get(id) || (kind === 'artery' ? 'otherArteries' : kind === 'vein' ? 'otherVeins' : 'otherOrgans');
      const M = SC.material;
      const spec = M[id] || M[group] || (kind === 'artery' ? M.artery : kind === 'vein' ? M.vein : { color: '#b9877a', rough: 0.6 });
      const vessel = kind === 'artery' || kind === 'vein';
      const mat = rimMaterial(vessel ? { ...(kind === 'artery' ? M.artery : M.vein), clearcoat: 0.6, env: 0.6, rimStrength: 0.35 } : { ...spec, rimStrength: group === 'torso' ? 0.5 : 0.22 });
      if (group === 'torso') { mat.side = THREE.DoubleSide; }
      s = { id, meshes: [], mat, kind, group, op: -1, route: ROUTE.has(id) };
      structures.set(id, s);
    }
    if (ob.material && ob.material.dispose) ob.material.dispose();
    ob.material = s.mat; s.meshes.push(ob);
  });
  for (const ob of dropMeshes) { ob.removeFromParent(); ob.geometry.dispose(); if (ob.material && ob.material.dispose) ob.material.dispose(); }
  /* 中心線 → Path */
  const paths = new Map();
  for (const [id, sg] of Object.entries(CL.segments)) paths.set(id, Object.assign(new Path(id, sg.points, sg.radius), { meta: sg }));

  /* 程式生成的示意管（依群組合併，節省 draw call） */
  const tubeBuckets = {};
  const tmpC = new THREE.Color();
  for (const [id, sg] of Object.entries(CL.segments)) {
    const g = SC.tubeGroup(id); if (!g) continue;
    const curve = new THREE.CatmullRomCurve3(sg.points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const len = paths.get(id).len, r = paths.get(id).rMean;
    const geo = new THREE.TubeGeometry(curve, Math.max(8, Math.round(len / 0.0008)), r, lite ? 6 : 8, false);
    const n = geo.attributes.position.count, cols = new Float32Array(n * 3), rs = (lite ? 6 : 8) + 1;
    for (let i = 0; i < n; i++) {
      const u = Math.floor(i / rs) / Math.max(1, Math.floor(n / rs) - 1);
      const o2 = sg.o2 === 'rich' ? 1 : sg.o2 === 'poor' ? 0 : 1 - smooth(u * 1.1);
      tmpC.copy(POOR).lerp(RICH, o2).multiplyScalar(0.72); cols.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    (tubeBuckets[g] = tubeBuckets[g] || []).push(geo);
  }
  const bridgePath = SC.bridge && paths.get(SC.bridge.seg);
  if (bridgePath) {
    const pts = CL.segments[SC.bridge.seg].points.filter((p) => p[1] >= SC.bridge.fromY);
    if (pts.length > 2) {
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal'), 24, SC.bridge.radius, lite ? 8 : 12, false);
      const cols = new Float32Array(geo.attributes.position.count * 3); tmpC.set(SC.material.vein.color);
      for (let i = 0; i < cols.length; i += 3) cols.set([tmpC.r, tmpC.g, tmpC.b], i);
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tubeBuckets.genBridge = [geo];
    }
  }
  for (const [g, geos] of Object.entries(tubeBuckets)) {
    const geo = mergeGeometries(geos, false); geos.forEach((x) => x.dispose());
    const mat = rimMaterial({ color: '#ffffff', rough: 0.36, clearcoat: 0.5, env: 0.6, vertexColors: true, rim: '#ffb0a0', rimStrength: 0.25 });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = '@' + g; scene.add(mesh);
    const sid = SC.groups[g][0];
    structures.set(sid, { id: sid, meshes: [mesh], mat, kind: 'generated', group: g, op: -1, route: true });
  }
  /* 靜脈單層管：依中心線與其半徑（口徑依文獻，見 tools/anatomy/set_vein_calibers.py、sources.md）畫成一根管；
   * 資料集的網格外殼已在上面丟掉，所以畫面上的粗細＝血球流動的範圍，不會再有「外面套一層膜」。 */
  for (const [g, segIds] of Object.entries(SC.replaceMesh || {})) {
    const geos = [];
    for (const sid of segIds) {
      const p = paths.get(sid); if (!p) continue;
      const rg = p.meta.tubeRange || [0, 1];
      geos.push(varTube(p, rg[0], rg[1], lite ? 10 : 14, 0.0012));
    }
    if (!geos.length) continue;
    const geo = mergeGeometries(geos, false); geos.forEach((x) => x.dispose());
    const mat = rimMaterial({ ...SC.material.vein, clearcoat: 0.6, env: 0.6, rimStrength: 0.35 });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = '@' + g; scene.add(mesh);
    structures.set('@' + g, { id: '@' + g, meshes: [mesh], mat, kind: 'vein', group: g, op: -1, route: true });
  }

  /* 血流粒子（InstancedMesh：一個 draw call） */
  const budgetMax = o.budget || (lite ? 1000 : 2400);
  const rbcGeo = rbcGeometry(lite ? 8 : 12);
  const rbcMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 0.2, sheen: 0.25, sheenColor: new THREE.Color('#ff7a68'), envMapIntensity: 0.45 });
  const cells = new THREE.InstancedMesh(rbcGeo, rbcMat, budgetMax);
  cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cells.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(budgetMax * 3), 3); cells.instanceColor.setUsage(THREE.DynamicDrawUsage);
  cells.frustumCulled = false; cells.count = 0; scene.add(cells);
  const pSeg = new Int16Array(budgetMax), pU0 = new Float32Array(budgetMax), pRad = new Float32Array(budgetMax), pAng = new Float32Array(budgetMax),
    pTum = new Float32Array(budgetMax), pRate = new Float32Array(budgetMax), pScale = new Float32Array(budgetMax);
  let flowList = [], flowKeySig = '', budget = budgetMax;
  const flowInfo = [];   // per active seg: {path, F, len, size, o2, fadeIn}

  /* 追蹤的那一顆紅血球＋黃圈 */
  const tracerMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color('#ffd0c0'), emissive: new THREE.Color('#5a120f'), envMapIntensity: 0.6 });
  const tracer = new THREE.Mesh(rbcGeo, tracerMat); tracer.visible = false; scene.add(tracer);
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 48), new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }));
  ringMesh.renderOrder = 10; ringMesh.visible = false; scene.add(ringMesh);
  const tracerPaths = SC.steps.map((st) => {
    if (!st.tracer) return null;
    // 接續的區段從「最靠近上一段終點」的位置開始（例如小靜脈接進腸繫膜上靜脈的匯入點）
    const list = st.tracer.path.map((id) => paths.get(id)).filter(Boolean), u0 = [0], cum = [0], end = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 1; i < list.length; i++) {
      list[i - 1].point(1, end); let best = 0, bd = 1e9;
      for (let k = 0; k < list[i].n; k += 2) { const d = list[i].point(k / (list[i].n - 1), q).distanceToSquared(end); if (d < bd) { bd = d; best = k / (list[i].n - 1); } }
      u0.push(best);
    }
    list.forEach((p, i) => cum.push(cum[cum.length - 1] + p.len * (1 - u0[i]))); return { list, u0, cum, total: cum[cum.length - 1] };
  });

  /* 標籤（CSS2D） */
  const labels = new Map();
  const tmpV = new THREE.Vector3();
  function anchorOf(at) {
    if (at.pos) return new THREE.Vector3().fromArray(at.pos);
    if (at.seg) { const p = paths.get(at.seg); if (p) return p.point(at.u ?? 0.5, new THREE.Vector3()); }
    if (at.part) { const c = PARTS.get(at.part)?.centroid || [0, 0, 0]; return new THREE.Vector3(c[0] + (at.dx || 0), c[1] + (at.dy || 0), c[2] + (at.dz || 0)); }
    return new THREE.Vector3();
  }
  for (const [lid, L] of Object.entries(SC.labels)) {
    if (!SC.labelAllow.includes(L.key)) continue;    // 名稱定案表外的一律不標
    const el = document.createElement('div'); el.className = 'ht3d-label side-' + L.side;
    el.innerHTML = '<span class="dot"></span><span class="lead"></span><span class="txt"><b></b><small></small></span>';
    const obj = new CSS2DObject(el);
    obj.center.set(L.side === 'r' ? 0 : L.side === 'l' ? 1 : 0.5, L.side === 'u' ? 1 : L.side === 'd' ? 0 : 0.5);
    obj.position.copy(anchorOf(L.at)); obj.visible = false; scene.add(obj);
    labels.set(lid, { obj, el, key: L.key, alpha: -1 });
  }
  function labelText() {
    for (const L of labels.values()) {
      const n = SC.names[L.key] || { zh: L.key, en: L.key };
      L.el.querySelector('b').textContent = V.lang === 'en' ? n.en : n.zh;
      L.el.querySelector('small').textContent = V.lang === 'en' ? '' : n.note || '';
    }
    note.textContent = tr(SC.note) + '　' + tr(SC.credit);
    chipSig = '';
  }

  /* --- 每步狀態（純函式） --- */
  const styleCache = SC.steps.map((st) => ({ ...SC.baseStyle, ...(st.style || {}) }));
  const NEAR = 0.004;   // 預設近裁切面；關鍵格可指定較大的 near，把鏡頭前擋住的腸管切掉（剖面視角）
  function camAt(st, t) {
    const K = st.camera; if (t <= K[0].t) return [K[0].pos, K[0].target, K[0].near || NEAR];
    for (let i = 0; i < K.length - 1; i++) {
      if (t <= K[i + 1].t) { const s = smooth((t - K[i].t) / (K[i + 1].t - K[i].t)); return [lerp3(K[i].pos, K[i + 1].pos, s), lerp3(K[i].target, K[i + 1].target, s), (K[i].near || NEAR) + ((K[i + 1].near || NEAR) - (K[i].near || NEAR)) * s]; }
    }
    const k = K[K.length - 1]; return [k.pos, k.target, k.near || NEAR];
  }
  function lerp3(a, b, s) { return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]; }
  function stateAt(k, tau) {
    const st = SC.steps[k], t = Math.min(tau, st.dur);
    const [pos, target, near] = camAt(st, t);
    const prev = styleCache[k > 0 ? k - 1 : 0], cur = styleCache[k], b = k > 0 ? smooth(t / 1.0) : 1, style = {};
    for (const key of new Set([...Object.keys(prev), ...Object.keys(cur)])) {
      const z = /^(deep|glow)\./.test(key) ? 0 : undefined;   // 加深／發亮沒寫＝0，才會從 0 平滑過渡
      const a = prev[key] ?? SC.baseStyle[key] ?? z ?? cur[key], c = cur[key] ?? SC.baseStyle[key] ?? z ?? a; style[key] = a + (c - a) * b;
    }
    const prevFlows = new Set(k > 0 ? SC.steps[k - 1].flows : []);
    const flows = st.flows.map((id) => ({ id, alpha: prevFlows.has(id) ? 1 : smooth(t / 0.8) }));
    const lab = (st.labels || []).map((L) => {
      const a = smooth((t - L.at[0]) / 0.4) * (L.at[1] >= st.dur ? 1 : 1 - smooth((t - (L.at[1] - 0.4)) / 0.4)); return { id: L.id, alpha: a };
    });
    let tracerU = null;
    if (st.tracer) { const T = st.tracer; tracerU = smooth((t - T.from) / (T.to - T.from)); }
    let win = null;
    if (st.window) {
      const W = st.window; let a = 1;
      if (W.open) a *= smooth((t - W.open[0]) / (W.open[1] - W.open[0]));
      if (W.close) a *= 1 - smooth((t - W.close[0]) / (W.close[1] - W.close[0]));
      win = { kind: W.kind, amount: a, t: Math.max(0, tau - (W.open ? W.open[0] : -8)), focus: W.focus };
    }
    return { scene: SC.id, step: k + 1, ms: Math.round(tau * 1000), t, camera: { pos, target, near }, style, flows, labels: lab, tracer: st.tracer ? { path: st.tracer.path, u: tracerU } : null, window: win, flowTime: tau + k * 41.3 };
  }

  /* --- 套用狀態 --- */
  let camFrom = null, userCam = false, lastStep = -1, chipSig = '';
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  /* 加深（deep.<群組或id>：0～1）＝目標器官的顏色變深、變飽和；發亮（glow.<群組或id>：0～1）＝正在講解的血管加自發光與較強邊緣光。
   * 兩者都放在每一步的 style 裡，跟透明度一樣隨步驟平滑過渡；不改血管透明度，血球才不會被遮住。 */
  const hsl = { h: 0, s: 0, l: 0 }, VEIN_GLOW = new THREE.Color('#d23a66'), ART_GLOW = new THREE.Color('#ff3b2c');
  function tint(s, deep, glow) {
    const m = s.mat; if (!m.userData.base) m.userData.base = { color: m.color.clone(), rim: m.userData.rim.value.clone() };
    const b = m.userData.base;
    if (s.kind === 'artery' || s.kind === 'vein' || s.kind === 'generated') {
      m.emissive.copy(s.kind === 'vein' || /Ven|Bridge/.test(s.group) ? VEIN_GLOW : ART_GLOW); m.emissiveIntensity = 0.6 * glow;
      m.userData.rim.value.copy(b.rim).multiplyScalar(1 + 2.6 * glow);
      if (!m.vertexColors) m.color.copy(b.color).lerp(tmpWhite, 0.14 * glow);
    } else if (s.group !== 'torso') {
      b.color.getHSL(hsl); m.color.setHSL(hsl.h, Math.min(1, hsl.s + 0.28 * deep), hsl.l * (1 - 0.34 * deep));
    }
  }
  const tmpWhite = new THREE.Color(1, 1, 1);
  function applyStyles(style) {
    for (const s of structures.values()) {
      let op = style[s.id] ?? style[s.group];
      if (op === undefined) op = s.group === 'otherOrgans' ? 0.2 : 0.3;
      op = Math.round(op * 100) / 100;
      const deep = Math.round((style['deep.' + s.id] ?? style['deep.' + s.group] ?? 0) * 50) / 50, glow = Math.round((style['glow.' + s.id] ?? style['glow.' + s.group] ?? 0) * 50) / 50;
      if (deep !== s.deep || glow !== s.glow) { s.deep = deep; s.glow = glow; tint(s, deep, glow); }
      if (op === s.op) continue;
      s.op = op;
      const vis = op > 0.01, transparent = op < 0.985, depth = s.group === 'torso' ? false : op >= 0.6;
      for (const m of s.meshes) m.visible = vis;
      if (s.mat.transparent !== transparent || s.mat.depthWrite !== depth) { s.mat.transparent = transparent; s.mat.depthWrite = depth; s.mat.needsUpdate = true; }
      s.mat.opacity = op;
      for (const m of s.meshes) m.renderOrder = transparent ? (depth ? 1 : 2) : 0;
    }
  }
  function allocate(flows) {
    const sig = flows.map((f) => f.id).join(','); if (sig === flowKeySig) return; flowKeySig = sig;
    flowList = flows.map((f) => f.id).filter((id) => paths.has(id));
    flowInfo.length = 0;
    const want = flowList.map((id) => {
      const p = paths.get(id), F = SC.flow[SC.flowKey(id)] || { type: 'steady', v: 0.02, density: 300 };
      return F.singleFile ? Math.floor(p.len / F.spacing) : Math.round(p.len * F.density);
    });
    const total = want.reduce((a, b) => a + b, 0), scale = total > budget ? budget / total : 1;
    let n = 0;
    flowList.forEach((id, j) => {
      const p = paths.get(id), F = SC.flow[SC.flowKey(id)] || { type: 'steady', v: 0.02, density: 300 };
      const size = Math.min(0.0042, Math.max(0.00055, p.rMean * 0.75));
      const o2 = p.meta.o2 === 'rich' ? 1 : p.meta.o2 === 'poor' ? 0 : -1;
      flowInfo.push({ path: p, F, size, o2, alpha: 1 });
      const cnt = Math.max(F.singleFile ? 2 : 3, Math.floor(want[j] * scale)), rnd = mulberry32(hashStr(id));
      for (let i = 0; i < cnt && n < budget; i++, n++) {
        pSeg[n] = j; pU0[n] = F.singleFile ? i / cnt : (i + rnd() * 0.8) / cnt;
        const maxR = Math.max(0, (p.rMean - size * 0.55) / p.rMean) * 0.8;
        pRad[n] = F.singleFile ? 0 : Math.sqrt(rnd()) * maxR; pAng[n] = rnd() * TAU; pTum[n] = rnd() * TAU; pRate[n] = (rnd() - 0.5) * 2.4; pScale[n] = 0.85 + rnd() * 0.3;
        tmpC.copy(POOR).lerp(RICH, o2 < 0 ? 1 : o2); cells.instanceColor.setXYZ(n, tmpC.r, tmpC.g, tmpC.b);
      }
    });
    cells.count = n; cells.instanceColor.needsUpdate = true;
  }
  const M = cells.instanceMatrix.array;
  function updateCells(flows, ft) {
    for (let j = 0; j < flowInfo.length; j++) flowInfo[j].alpha = flows[j] ? flows[j].alpha : 1;
    const T = SC.heartPeriod, C = cells.instanceColor.array;
    for (let i = 0; i < cells.count; i++) {
      const fi = flowInfo[pSeg[i]], p = fi.path, F = fi.F;
      const u = frac(pU0[i] + flowDistance(F.type, F.v, ft, T) / p.len);
      const k = Math.min(p.n - 1, Math.round(u * (p.n - 1))), k3 = k * 3;
      const R = p.R[k] * pRad[i], ca = Math.cos(pAng[i]) * R, sa = Math.sin(pAng[i]) * R;
      const tx = p.T[k3], ty = p.T[k3 + 1], tz = p.T[k3 + 2], nx = p.N[k3], ny = p.N[k3 + 1], nz = p.N[k3 + 2], bx = p.B[k3], by = p.B[k3 + 1], bz = p.B[k3 + 2];
      const px = p.P[k3] + nx * ca + bx * sa, py = p.P[k3 + 1] + ny * ca + by * sa, pz = p.P[k3 + 2] + nz * ca + bz * sa;
      let fade = fi.alpha;
      if (F.fadeEnd) fade *= smooth((1 - u) / 0.1);
      if (F.fadeStart) fade *= smooth(u / 0.1);
      const s = fi.size * pScale[i] * fade;
      let yx, yy, yz, xx, xy, xz;
      if (F.singleFile) { yx = tx; yy = ty; yz = tz; xx = nx; xy = ny; xz = nz; }        // 微血管：一顆接一顆，盤面朝前
      else { const a = pTum[i] + pRate[i] * ft, c = Math.cos(a), sn = Math.sin(a); yx = nx * c + bx * sn; yy = ny * c + by * sn; yz = nz * c + bz * sn; xx = tx; xy = ty; xz = tz; }
      const zx = xy * yz - xz * yy, zy = xz * yx - xx * yz, zz = xx * yy - xy * yx, o = i * 16;
      M[o] = xx * s; M[o + 1] = xy * s; M[o + 2] = xz * s; M[o + 3] = 0;
      M[o + 4] = yx * s; M[o + 5] = yy * s; M[o + 6] = yz * s; M[o + 7] = 0;
      M[o + 8] = zx * s; M[o + 9] = zy * s; M[o + 10] = zz * s; M[o + 11] = 0;
      M[o + 12] = px; M[o + 13] = py; M[o + 14] = pz; M[o + 15] = 1;
      if (fi.o2 < 0) { const g = 1 - smooth(u * 1.1), o3 = i * 3; C[o3] = POOR.r + (RICH.r - POOR.r) * g; C[o3 + 1] = POOR.g + (RICH.g - POOR.g) * g; C[o3 + 2] = POOR.b + (RICH.b - POOR.b) * g; }
    }
    cells.instanceMatrix.needsUpdate = true; cells.instanceColor.needsUpdate = true;
  }
  const tq = new THREE.Vector3(), tt = new THREE.Vector3(), tnn = new THREE.Vector3(), tb = new THREE.Vector3(), basisM = new THREE.Matrix4();
  function updateTracer(k, tr0) {
    const TP = tracerPaths[k];
    if (!TP || !tr0) { tracer.visible = ringMesh.visible = false; return; }
    const st = SC.steps[k].tracer; let d = tr0.u * TP.total;
    if (st.startU) d = Math.max(d, 0) * (1 - st.startU * TP.list[0].len / TP.total) + st.startU * TP.list[0].len;
    let i = 0; while (i < TP.list.length - 1 && d > TP.cum[i + 1]) i++;
    const p = TP.list[i], u = TP.u0[i] + (d - TP.cum[i]) / p.len, idx = p.index(u) * 3;
    p.point(u, tq); tt.fromArray(p.T, idx); tnn.fromArray(p.N, idx); tb.crossVectors(tt, tnn);
    const size = Math.min(0.0042, Math.max(0.00055, p.rMean * 0.75)) * 1.5;
    basisM.makeBasis(tt, tnn, tb); tracer.quaternion.setFromRotationMatrix(basisM); tracer.position.copy(tq); tracer.scale.setScalar(size);
    const o2 = p.meta.o2 === 'rich' ? 1 : p.meta.o2 === 'poor' ? 0 : 1 - smooth(u * 1.1);
    tracerMat.color.copy(POOR).lerp(RICH, o2);
    ringMesh.position.copy(tq); ringMesh.quaternion.copy(camera.quaternion); ringMesh.scale.setScalar(size * 1.5);
    tracer.visible = ringMesh.visible = true;
  }
  function updateLabels(lab) {
    const on = new Map(lab.map((l) => [l.id, l.alpha]));
    for (const [id, L] of labels) {
      const a = Math.round((on.get(id) || 0) * 20) / 20;
      if (a === L.alpha) continue; L.alpha = a;
      L.obj.visible = a > 0.02; L.el.style.opacity = String(a);
    }
  }
  const proj = new THREE.Vector3(), X5 = new THREE.Vector3(0.05, 0, 0);
  function toScreen(v, w, h) { proj.copy(v).project(camera); return [(proj.x * 0.5 + 0.5) * w, (-proj.y * 0.5 + 0.5) * h, proj.z]; }
  function updateChips(w, h) {
    // 往人體 +X（左側）挪一小段（相對於鏡頭距離，避免跑到鏡頭後面），看它在畫面上往哪邊
    X5.set(camera.position.distanceTo(controls.target) * 0.15, 0, 0);
    const a = toScreen(controls.target, w, h), b = toScreen(tmpV.copy(controls.target).add(X5), w, h);
    const dx = b[0] - a[0], sig = Math.abs(dx) < 12 ? 'none' : dx > 0 ? 'std' : 'flip';
    if (sig + V.lang === chipSig) return; chipSig = sig + V.lang;
    const R = V.lang === 'en' ? 'Body right' : '人體右', L = V.lang === 'en' ? 'Body left' : '人體左';
    chipL.style.display = chipR.style.display = sig === 'none' ? 'none' : '';
    chipL.textContent = '◀ ' + (sig === 'std' ? R : L); chipR.textContent = (sig === 'std' ? L : R) + ' ▶';
    chipL.title = chipR.title = V.lang === 'en' ? 'Viewer left = body right' : '觀眾左＝人體右';
  }
  let insetShown = -1;
  function updateInset(win, w, h) {
    const a = win ? win.amount : 0;
    note.style.opacity = a > 0.3 ? '0' : '';   // 放大窗蓋住左下說明時先淡出；授權與來源仍在頁面下方的來源區塊
    if (a <= 0.01) { if (insetShown !== 0) { inset.style.display = 'none'; svg.style.display = 'none'; insetShown = 0; } return; }
    insetShown = 1; inset.style.display = 'block'; svg.style.display = 'block';
    const f = win.focus.seg ? paths.get(win.focus.seg).point(win.focus.u ?? 0.5, tmpV) : anchorOf(win.focus);
    const [fx, fy] = toScreen(f, w, h);
    const portrait = h > w * 0.75;
    const bw = w * (portrait ? 0.9 : 0.84), bh = bw / 1.6, bx = w - bw - w * 0.012, by = h - bh - h * 0.02;
    inset.style.left = bx + 'px'; inset.style.top = by + 'px'; inset.style.width = bw + 'px'; inset.style.height = bh + 'px';
    inset.style.transformOrigin = (fx - bx) + 'px ' + (fy - by) + 'px';
    inset.style.transform = 'scale(' + (0.15 + 0.85 * a).toFixed(3) + ')'; inset.style.opacity = String(Math.min(1, a * 1.4));
    link.setAttribute('x1', fx); link.setAttribute('y1', fy); link.setAttribute('x2', bx); link.setAttribute('y2', by + bh * 0.5);
    ring.setAttribute('cx', fx); ring.setAttribute('cy', fy); svg.style.opacity = String(a);
    insetTag.textContent = win.kind === 'liver' ? (V.lang === 'en' ? 'Enlarged: liver cells (schematic)' : '放大：肝細胞（示意）') : (V.lang === 'en' ? 'Enlarged: villus in the gut wall (schematic)' : '放大：腸壁裡的絨毛（示意）');
    if (o.drawInset) { insetCtx.setTransform(1, 0, 0, 1, 0, 0); o.drawInset(insetCtx, win.kind, win.t, V.lang); }
  }

  let current = null;
  function apply(k, tau) {
    const S = stateAt(k, tau); current = S;
    if (k !== lastStep) {   // 新的一步：若學生剛轉過鏡頭，從目前鏡頭平滑接回關鍵格
      camFrom = userCam ? [camera.position.toArray(), controls.target.toArray()] : null; userCam = false; lastStep = k;
    }
    if (!userCam) {
      let p = S.camera.pos, t = S.camera.target;
      if (camFrom && S.t < 1.2) { const s = smooth(S.t / 1.2); p = lerp3(camFrom[0], p, s); t = lerp3(camFrom[1], t, s); }
      camera.position.fromArray(p); controls.target.fromArray(t); camera.lookAt(controls.target);
      const nr = camFrom && S.t < 1.2 ? NEAR : S.camera.near;
      if (Math.abs(camera.near - nr) > 1e-5) { camera.near = nr; camera.updateProjectionMatrix(); }
    } else if (camera.near !== NEAR) { camera.near = NEAR; camera.updateProjectionMatrix(); }
    applyStyles(S.style); allocate(S.flows); updateCells(S.flows, S.flowTime); updateTracer(k, S.tracer); updateLabels(S.labels);
    return S;
  }
  let W = 0, H = 0;
  function render() {
    if (V.disposed) return;
    renderer.render(scene, camera); css2d.render(scene, camera);
    updateChips(W, H); if (current) updateInset(current.window, W, H);
    V.stats.drawCalls = renderer.info.render.calls; V.stats.triangles = renderer.info.render.triangles;
  }
  function resize() {
    const r = host.getBoundingClientRect(), w = Math.max(50, Math.round(r.width)), h = Math.max(30, Math.round(r.height));
    if (w === W && h === H) return false; W = w; H = h;
    renderer.setSize(w, h, false); css2d.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    insetCanvas.style.width = '100%'; insetCanvas.style.height = '100%'; chipSig = ''; return true;
  }
  resize(); labelText();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (resize()) V.requestRender(); }) : null; if (ro) ro.observe(host);

  /* --- 播放器（唯一一條 rAF） --- */
  const P = { step: 0, tau: 0, playing: false, queue: [], after: 'stop', gap: 0, raf: 0, last: 0, dirty: true, onStep: null, onEnd: null, fpsWin: [] };
  function frame(now) {
    P.raf = 0; if (V.disposed) return;
    V.stats.rafCount++;
    if (document.hidden) { P.last = 0; return; }   // 分頁隱藏：停（visibilitychange 時恢復）
    const dt = P.last ? Math.min(0.1, (now - P.last) / 1000) : 0; P.last = now;
    if (P.playing) tick(dt);
    const st = SC.steps[P.step];
    const lastKey = st.camera[st.camera.length - 1].t;
    controls.enabled = !(P.playing && P.tau < lastKey);   // 鏡頭自動飛行時鎖住
    apply(P.step, P.tau); render();
    if (P.playing && dt > 0) { P.fpsWin.push(dt); if (P.fpsWin.length > 60) P.fpsWin.shift(); const avg = P.fpsWin.reduce((a, b) => a + b, 0) / P.fpsWin.length; V.stats.fps = Math.round(1 / avg); V.stats.frames++; }
    P.dirty = false;
    if (P.playing || P.dirty) P.raf = requestAnimationFrame(frame); else P.last = 0;
  }
  function tick(dt) {
    const st = SC.steps[P.step];
    if (P.gap > 0) { P.gap -= dt; P.tau += dt; if (P.gap <= 0) start(P.queue.shift(), 0); return; }
    P.tau += dt;
    if (P.tau >= st.dur) {
      if (P.queue.length) { P.gap = GAP; }
      else if (P.after === 'loop') { /* 有聲講解：鏡頭停在最後一格，血流繼續 */ }
      else { P.tau = st.dur; P.playing = false; P.onEnd && P.onEnd(P.step); }
    }
  }
  function start(k, tau0) { P.step = k; P.tau = tau0 || 0; P.gap = 0; P.onStep && P.onStep(k); }
  function ensure() { if (!P.raf && !V.disposed) P.raf = requestAnimationFrame(frame); }
  V.requestRender = () => { P.dirty = true; ensure(); };
  controls.addEventListener('start', () => { userCam = true; });
  controls.addEventListener('change', () => { if (!P.playing) V.requestRender(); });
  const onVis = () => { if (!document.hidden) { P.last = 0; ensure(); } };
  document.addEventListener('visibilitychange', onVis);

  Object.assign(V, {
    three: THREE, scene, camera, renderer, controls, paths, structures, labels, stateAt,
    steps: SC.steps,
    playStep(k) { P.queue = []; P.after = 'stop'; start(k, 0); P.playing = true; ensure(); },
    playFrom(k) { P.queue = []; for (let i = k + 1; i < SC.steps.length; i++) P.queue.push(i); P.after = 'stop'; start(k, 0); P.playing = true; ensure(); },
    go(k, ms, after) { P.queue = []; P.after = after || 'loop'; start(k, (ms || 0) / 1000); P.playing = true; ensure(); },
    pause() { P.playing = false; V.requestRender(); },
    resume() { if (P.step >= 0) { P.playing = true; P.last = 0; ensure(); } },
    isPlaying: () => P.playing,
    setHandlers(h) { P.onStep = h.onStep || null; P.onEnd = h.onEnd || null; },
    position: () => ({ step: P.step, tau: P.tau, playing: P.playing, queue: P.queue.slice(), after: P.after, inGap: P.gap > 0 }),
    getState() { return current ? JSON.parse(JSON.stringify({ ...current, playing: P.playing, userCamera: userCam, particles: cells.count, lite, lang: V.lang })) : null; },
    setLang(l) { V.lang = l === 'en' ? 'en' : 'zh'; labelText(); V.requestRender(); },
    setBudget(n) { budget = Math.max(200, Math.min(budgetMax, n)); flowKeySig = ''; V.requestRender(); },
    resetCamera() { userCam = false; camFrom = null; V.requestRender(); },
    sampleParticles(n) {   // 測試用：抽樣目前粒子的世界座標與所在區段
      const out = []; const step = Math.max(1, Math.floor(cells.count / n));
      for (let i = 0; i < cells.count; i += step) { const o = i * 16, fi = flowInfo[pSeg[i]]; out.push({ seg: fi.path.id, x: M[o + 12], y: M[o + 13], z: M[o + 14] }); }
      return out;
    },
    lumenCheck(n, meshMap) {   // 測試用：粒子位置往 8 個垂直方向射線，都要打到該血管的網格
      const ray = new THREE.Raycaster(), dir = new THREE.Vector3(), o3 = new THREE.Vector3(), res = { checked: 0, inside: 0, fails: [] };
      scene.updateMatrixWorld(true);
      const sides = new Map(); for (const s of structures.values()) { sides.set(s.mat, s.mat.side); s.mat.side = THREE.DoubleSide; }
      const step = Math.max(1, Math.floor(cells.count / n));
      for (let i = 0; i < cells.count; i += step) {
        const fi = flowInfo[pSeg[i]], ids = meshMap[fi.path.id]; if (!ids) continue;
        const meshes = ids.flatMap((id) => (structures.get(id) || { meshes: [] }).meshes);
        const o = i * 16; o3.set(M[o + 12], M[o + 13], M[o + 14]);
        const u = frac(pU0[i] + flowDistance(fi.F.type, fi.F.v, current.flowTime, SC.heartPeriod) / fi.path.len), k = fi.path.index(u) * 3;
        const T = new THREE.Vector3().fromArray(fi.path.T, k), N = new THREE.Vector3().fromArray(fi.path.N, k), B = new THREE.Vector3().crossVectors(T, N);
        let ok = true;
        for (let a = 0; a < 8 && ok; a++) {
          dir.copy(N).multiplyScalar(Math.cos((a * TAU) / 8)).addScaledVector(B, Math.sin((a * TAU) / 8)).normalize();
          ray.set(o3, dir); ray.far = Math.max(0.006, fi.path.R[k / 3] * 4);
          if (!ray.intersectObjects(meshes, false).length) ok = false;
        }
        res.checked++; if (ok) res.inside++; else if (res.fails.length < 12) res.fails.push({ seg: fi.path.id, u: +u.toFixed(3) });
      }
      for (const [m, sd] of sides) m.side = sd;
      return res;
    },
    dispose() {
      if (V.disposed) return; V.disposed = true;
      if (P.raf) cancelAnimationFrame(P.raf); P.raf = 0;
      document.removeEventListener('visibilitychange', onVis); if (ro) ro.disconnect(); controls.dispose();
      scene.traverse((ob) => { if (ob.geometry) ob.geometry.dispose(); const ms = Array.isArray(ob.material) ? ob.material : ob.material ? [ob.material] : []; ms.forEach((m) => { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose(); }); });
      for (const L of labels.values()) L.el.remove();
      envRT.dispose(); pmrem.dispose(); cells.dispose && cells.dispose();
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
      wrap.remove();
    }
  });
  return V;
}
