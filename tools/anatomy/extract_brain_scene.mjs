#!/usr/bin/env node
/**
 * extract_brain_scene.mjs
 * 從開源解剖資料集（3D Anatomy Atlas data release 1.2.0 ＝ Z-Anatomy／BodyParts3D／Brain for Blender 衍生）
 * 抽出「腦部：組織細胞」場景（血液怎麼送到腦、再回到心臟）用的真實解剖網格，輸出：
 *   <out>/brain_scene_v1.glb       完整版（standard 品質來源，目標 <= 6 MB）
 *   <out>/brain_scene_v1_lite.glb  輕量版（iPad 備援，目標 <= 2.5 MB）
 *   <out>/brain_parts_v1.json      每個結構的名稱／分類／三角形數／bbox／centroid／merged_from
 * 範本：tools/anatomy/extract_si_scene.mjs（讀 chunk、依 _ID 拆回結構、weld/simplify、quantize、meshopt 的程式原樣沿用）。
 * 不讀也不改 si_scene_v1.glb／si_parts_v1.json。
 *
 * 需要的 npm 套件（不要裝進 repo，裝在任何暫存資料夾，例如 /tmp/gl）：
 *   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 *
 * 用法：
 *   node tools/anatomy/extract_brain_scene.mjs --data <releases/1.2.0 資料夾> \
 *        [--out assets/biology/anatomy3d] [--modules /tmp/gl/node_modules] [--verify-only] [--list]
 *
 * 改作（寫進 sources.md「腦場景」）：挑選（心臟、主動脈弓與弓上分支、頸部與腦的動脈、硬腦膜靜脈竇、內頸靜脈、頭臂靜脈、上腔靜脈）；
 *   不收：小腦的動脈、下矢狀竇／直竇／枕竇（資料集這幾個竇的位置與教科書不符，見 sources.md）、頸外動脈（本場景只追頸內動脈）。
 *   合併（大腦皮質數十個腦回／腦溝依資料集的「葉」群組合併成額葉、頂葉、顳葉、枕葉、其他皮質〔島葉、邊緣葉、葉間腦溝〕各一塊，
 *   小腦合併成一塊、腦幹〔中腦、橋腦、延腦的外形〕合併成一塊；頭頸部體表分區合併成一個外形殼、胸部體表分區合併成一個外形殼，只作定位背景）；
 *   weld、simplify（meshoptimizer，誤差上限見 LOD 表）、quantize、meshopt 壓縮。座標不改。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/* ───────────────────────── 參數與套件載入 ───────────────────────── */
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const flag = n => argv.includes(n);
const HERE = path.dirname(fileURLToPath(import.meta.url));
if (flag('--help') || !opt('--data')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n/, ''));
  process.exit(opt('--data') ? 0 : 1);
}
const DATA = path.resolve(opt('--data'));
const OUT = path.resolve(opt('--out', path.join(HERE, '..', '..', 'assets', 'biology', 'anatomy3d')));
const MODULES = opt('--modules');
const ENTRY = {
  '@gltf-transform/core': '@gltf-transform/core/dist/index.js',
  '@gltf-transform/extensions': '@gltf-transform/extensions/dist/index.js',
  '@gltf-transform/functions': '@gltf-transform/functions/dist/index.js',
  'meshoptimizer/decoder': 'meshoptimizer/meshopt_decoder.mjs',
  'meshoptimizer/encoder': 'meshoptimizer/meshopt_encoder.js',
  'meshoptimizer/simplifier': 'meshoptimizer/meshopt_simplifier.js',
};
const dep = spec => MODULES ? import(pathToFileURL(path.resolve(MODULES, ENTRY[spec])).href) : import(spec);
const {Document, NodeIO, Logger} = await dep('@gltf-transform/core');
const {EXTMeshoptCompression, KHRMeshQuantization} = await dep('@gltf-transform/extensions');
const {weld, simplify, meshopt, prune} = await dep('@gltf-transform/functions');
const {MeshoptDecoder} = await dep('meshoptimizer/decoder');
const {MeshoptEncoder} = await dep('meshoptimizer/encoder');
const {MeshoptSimplifier} = await dep('meshoptimizer/simplifier');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const {ALL_EXTENSIONS} = await dep('@gltf-transform/extensions');
const ioRead = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
const ioWrite = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});

/* ───────────────────────── 選取清單 ─────────────────────────
 * 欄位：id（manifest 結構 id＝glb node 名稱；合併的衍生 node 用 brain.* / regions.*）、zh（繁體中文名稱）、kind、prof（簡化設定檔）、
 *       os（功能系統）、o2（教學配色分類：rich＝動脈血，poor＝靜脈血）、zhReview（true＝請老師審中文名，畫面不顯示）、note、background、
 *       merge（衍生 node：要合併的 manifest 群組 id 清單，取其底下所有有網格的結構）、drop（合併時排除的 id 正規式）。 */
const A = (id, zh, o = {}) => ({id, zh, kind: 'artery', prof: 'vessel', os: 'circulatory', o2: 'rich', ...o});
const Vn = (id, zh, o = {}) => ({id, zh, kind: 'vein', prof: 'vessel', os: 'circulatory', o2: 'poor', ...o});
const O = (id, zh, o = {}) => ({id, zh, kind: 'organ', prof: 'organ', ...o});
const cv = s => 'cardiovascular.' + s, nv = s => 'nervous.' + s;
const INNER = /nucleus|nuclei|aqueduct|ventricle/;   // 腦幹、小腦內部的神經核與腦室：會被外形蓋住，不收
const SEL = [
  // ── 心臟（左心室出發、右心房回來）──
  O(cv('left_atrium'), '左心房', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'rich'}),
  O(cv('left_ventricle'), '左心室', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'rich'}),
  O(cv('right_atrium'), '右心房', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'poor'}),
  O(cv('right_ventricle'), '右心室', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'poor'}),
  // ── 主動脈與弓上分支 ──
  A(cv('ascending_aorta'), '升主動脈', {group: 'aorta'}),
  A(cv('aortic_arch'), '主動脈弓', {group: 'aorta'}),
  A(cv('thoracic_aorta'), '胸主動脈', {group: 'aorta', note: '只當背景（血往下走的方向）'}),
  A(cv('brachiocephalic_trunk'), '頭臂動脈幹', {group: 'arch_branches', zhReview: true, note: '又稱無名動脈；國中課本不教'}),
  A(cv('right_common_carotid_artery'), '右頸總動脈', {group: 'carotid', zhReview: true, note: '另有「右總頸動脈」寫法'}),
  A(cv('left_common_carotid_artery'), '左頸總動脈', {group: 'carotid', zhReview: true, note: '另有「左總頸動脈」寫法'}),
  A(cv('right_subclavian_artery'), '右鎖骨下動脈', {group: 'arch_branches'}),
  A(cv('left_subclavian_artery'), '左鎖骨下動脈', {group: 'arch_branches'}),
  // ── 頸部與腦的動脈 ──
  A(cv('internal_carotid_artery_r'), '右頸內動脈', {group: 'carotid'}),
  A(cv('internal_carotid_artery_l'), '左頸內動脈', {group: 'carotid'}),
  A(cv('vertebral_artery_r'), '右椎動脈', {group: 'vertebral'}),
  A(cv('vertebral_artery_l'), '左椎動脈', {group: 'vertebral'}),
  A(cv('basilar_artery'), '基底動脈', {group: 'vertebral'}),
  A(cv('anterior_communicating_artery'), '前交通動脈', {group: 'circle'}),
  A(cv('posterior_communicating_artery_r'), '右後交通動脈', {group: 'circle'}),
  A(cv('posterior_communicating_artery_l'), '左後交通動脈', {group: 'circle'}),
  A(cv('anterior_cerebral_artery_r'), '右大腦前動脈', {group: 'cerebral'}),
  A(cv('anterior_cerebral_artery_l'), '左大腦前動脈', {group: 'cerebral'}),
  A(cv('middle_cerebral_artery_m1_segment_r'), '右大腦中動脈（M1 段）', {group: 'cerebral'}),
  A(cv('middle_cerebral_artery_m1_segment_l'), '左大腦中動脈（M1 段）', {group: 'cerebral'}),
  A(cv('insular_branches_of_middle_cerebral_artery_m2_r'), '右大腦中動脈島葉支（M2 段）', {group: 'cerebral', zhReview: true}),
  A(cv('insular_branches_of_middle_cerebral_artery_m2_segment_l'), '左大腦中動脈島葉支（M2 段）', {group: 'cerebral', zhReview: true}),
  A(cv('posterior_cerebral_artery_r'), '右大腦後動脈', {group: 'cerebral'}),
  A(cv('posterior_cerebral_artery_l'), '左大腦後動脈', {group: 'cerebral'}),
  // ── 硬腦膜靜脈竇 ──
  Vn(cv('superior_sagittal_sinus'), '上矢狀竇', {group: 'sinus'}),
  Vn(cv('transverse_sinus_r'), '右橫竇', {group: 'sinus'}),
  Vn(cv('transverse_sinus_l'), '左橫竇', {group: 'sinus'}),
  Vn(cv('sigmoid_sinus_r'), '右乙狀竇', {group: 'sinus'}),
  Vn(cv('sigmoid_sinus_l'), '左乙狀竇', {group: 'sinus'}),
  // ── 頸部與胸部的靜脈 ──
  Vn(cv('internal_jugular_vein_r'), '右內頸靜脈', {group: 'jugular', zhReview: true, note: '另有「頸內靜脈」寫法'}),
  Vn(cv('internal_jugular_vein_l'), '左內頸靜脈', {group: 'jugular', zhReview: true, note: '另有「頸內靜脈」寫法'}),
  Vn(cv('right_subclavian_vein'), '右鎖骨下靜脈', {group: 'caval'}),
  Vn(cv('left_subclavian_vein'), '左鎖骨下靜脈', {group: 'caval'}),
  Vn(cv('right_brachiocephalic_vein'), '右頭臂靜脈', {group: 'caval', zhReview: true, note: '又稱無名靜脈'}),
  Vn(cv('left_brachiocephalic_vein'), '左頭臂靜脈', {group: 'caval', zhReview: true, note: '又稱無名靜脈'}),
  Vn(cv('superior_vena_cava'), '上腔靜脈', {group: 'caval'}),
  // ── 腦（合併）──
  O('brain.frontal_lobe', '額葉', {prof: 'brain', os: 'nervous', group: 'cerebrum', merge: [nv('frontal_lobe')], asset: 'brainder'}),
  O('brain.parietal_lobe', '頂葉', {prof: 'brain', os: 'nervous', group: 'cerebrum', merge: [nv('parietal_lobe')], asset: 'brainder'}),
  O('brain.temporal_lobe', '顳葉', {prof: 'brain', os: 'nervous', group: 'cerebrum', merge: [nv('temporal_lobe')], asset: 'brainder'}),
  O('brain.occipital_lobe', '枕葉', {prof: 'brain', os: 'nervous', group: 'cerebrum', merge: [nv('occipital_lobe')], asset: 'brainder'}),
  O('brain.other_cortex', '大腦其他皮質（島葉、邊緣葉、葉間腦溝）', {prof: 'brain', os: 'nervous', group: 'cerebrum', merge: [nv('insula'), nv('limbic_lobe'), nv('interlobar_sulci')], asset: 'brainder', zhReview: true,
    note: '畫面只標「大腦」；海馬迴屬邊緣葉，一起合併'}),
  O('brain.cerebellum', '小腦', {prof: 'brain', os: 'nervous', group: 'cerebellum', merge: [nv('cerebellum')], drop: INNER}),
  O('brain.brainstem', '腦幹', {prof: 'brain', os: 'nervous', group: 'brainstem', merge: [nv('brainstem')], drop: INNER, note: '中腦、橋腦、延腦的外形（內部神經核與第四腦室不收）'}),
  // ── 背景：體表（合併）──
  {id: 'regions.head_neck_surface', zh: '頭頸部體表', kind: 'context', prof: 'context', os: 'integumentary', sys: 'regions', background: true,
   merge: ['regions.regions_of_head', 'regions.regions_of_neck'], note: '由資料集頭部（含耳廓、臉、頭皮）與頸部體表分區合併成一個外形殼，僅作定位背景（不含頭髮）'},
  {id: 'regions.thorax_surface', zh: '胸部體表', kind: 'context', prof: 'context', os: 'integumentary', sys: 'regions', background: true,
   merge: ['regions.regions_of_thorax'], note: '由資料集胸部體表分區合併成一個外形殼，僅作定位背景'},
];

/* ───────────────────────── 品質（LOD）設定 ─────────────────────────
 * absTol：簡化允許的「絕對」誤差（公尺）；ratio：保留比例下限（0＝只看誤差）；lockBorder：鎖住開口邊界。 */
const LOD = {
  full: {
    prof: {
      vessel: {absTol: 0.00003, lockBorder: true},
      heart: {absTol: 0.0002},
      organ: {absTol: 0.0002},
      brain: {absTol: 0.0004},
      context: {absTol: 0.0015, ratio: 0.35},
    },
  },
  lite: {
    prof: {
      vessel: {absTol: 0.0002, lockBorder: true},
      heart: {absTol: 0.0012},
      organ: {absTol: 0.0012},
      brain: {absTol: 0.0009, ratio: 0.3},
      context: {absTol: 0.0030, ratio: 0.15},
    },
  },
};
const COLORS = {
  'o2:rich': '#d2403a', 'o2:poor': '#3b64c9', 'group:cerebrum': '#e9c2b4', 'group:cerebellum': '#dcae9e', 'group:brainstem': '#d9b49f', context: '#d9a58a',
};
const colorOf = s => {
  if (s.kind === 'artery' || s.kind === 'vein') return COLORS['o2:' + s.o2];
  if (s.id === cv('left_atrium') || s.id === cv('left_ventricle')) return '#e0605a';
  if (s.id === cv('right_atrium') || s.id === cv('right_ventricle')) return '#6a85d8';
  if (s.kind === 'context') return COLORS.context;
  return COLORS['group:' + s.group] || '#c9b8a8';
};
const srgb2lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hex2lin = h => [1, 3, 5].map(i => srgb2lin(parseInt(h.slice(i, i + 2), 16) / 255));
/* ───────────────────────── 讀資料集 ───────────────────────── */
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8'));
const enNames = JSON.parse(fs.readFileSync(path.join(DATA, 'names', 'en.json'), 'utf8')).entries;
const byId = new Map(manifest.structures.map(s => [s.id, s]));
const licenseOf = new Map(manifest.assets.map(a => [a.id, a.license.id]));
const chunkOfMesh = i => manifest.chunks.find(c => i >= c.meshStart && i < c.meshStart + c.meshCount);
const chunkCache = new Map();
async function loadChunk(chunk, quality) {
  const key = chunk.id + '|' + quality;
  if (chunkCache.has(key)) return chunkCache.get(key);
  const doc = await ioRead.read(path.join(DATA, chunk.files[quality].path));
  const nodes = doc.getRoot().listNodes();
  if (nodes.length !== 1) throw new Error(`chunk ${chunk.id}: 預期 1 個 node，實際 ${nodes.length}`);
  const node = nodes[0], prims = node.getMesh().listPrimitives();
  if (prims.length !== 1) throw new Error(`chunk ${chunk.id}: 預期 1 個 primitive`);
  const T = node.getTranslation(), S = node.getScale(), R = node.getRotation();
  if (R.some((v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 1e-9)) throw new Error('chunk 帶旋轉：' + chunk.id);
  const p = prims[0], pa = p.getAttribute('POSITION'), na = p.getAttribute('NORMAL'), ia = p.getAttribute('_ID');
  if (!ia) throw new Error('chunk 沒有 _ID 屬性：' + chunk.id);
  const n = pa.getCount(), pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), ids = new Uint16Array(n);
  const e = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    pa.getElement(i, e); for (let k = 0; k < 3; k++) pos[i * 3 + k] = e[k] * S[k] + T[k];
    na.getElement(i, e); for (let k = 0; k < 3; k++) nrm[i * 3 + k] = e[k];
    ia.getElement(i, e); ids[i] = e[0];
  }
  const c = {pos, nrm, ids, idx: p.getIndices().getArray(), extras: node.getExtras()};
  // 驗證：chunk 內不同 _ID 數 == meshCount，且全落在 [meshStart, meshStart+meshCount)
  const set = new Set(ids);
  if (set.size !== chunk.meshCount || [...set].some(v => v < chunk.meshStart || v >= chunk.meshStart + chunk.meshCount))
    throw new Error(`chunk ${chunk.id}: _ID 與 manifest 對不上`);
  chunkCache.set(key, c);
  return c;
}
/** 取出單一結構的三角網格（世界座標，公尺）。 */
async function getGeom(id, quality) {
  const s = byId.get(id);
  if (!s || !s.meshes || !s.meshes.length) throw new Error('manifest 找不到有網格的結構：' + id);
  const mi = s.meshes[0], c = await loadChunk(chunkOfMesh(mi), quality);
  const remap = new Map(), P = [], N = [], I = [];
  for (let t = 0; t < c.idx.length; t += 3) {
    const a = c.idx[t], b = c.idx[t + 1], d = c.idx[t + 2];
    if (c.ids[a] !== mi) continue;
    if (c.ids[b] !== mi || c.ids[d] !== mi) throw new Error('三角形跨越多個結構：' + id);
    for (const v of [a, b, d]) {
      let r = remap.get(v);
      if (r === undefined) { r = P.length / 3; remap.set(v, r); P.push(c.pos[v * 3], c.pos[v * 3 + 1], c.pos[v * 3 + 2]); N.push(c.nrm[v * 3], c.nrm[v * 3 + 1], c.nrm[v * 3 + 2]); }
      I.push(r);
    }
  }
  if (!I.length) throw new Error('結構沒有三角形：' + id);
  return {id, pos: Float32Array.from(P), nrm: Float32Array.from(N), idx: Uint32Array.from(I)};
}
function descendants(groupId) {
  const out = [];
  for (const s of manifest.structures) if (s.parent === groupId) out.push(...(s.kind === 'group' ? descendants(s.id) : [s.id]));
  return out;
}
const concatGeoms = (id, gs) => {
  let nv = 0, ni = 0; for (const g of gs) { nv += g.pos.length; ni += g.idx.length; }
  const pos = new Float32Array(nv), nrm = new Float32Array(nv), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of gs) { pos.set(g.pos, vo); nrm.set(g.nrm, vo); for (let i = 0; i < g.idx.length; i++) idx[io + i] = g.idx[i] + vo / 3; vo += g.pos.length; io += g.idx.length; }
  return {id, pos, nrm, idx};
};/* ───────────────────────── 圖論小工具（切腸管、量血管長度） ───────────────────────── */
class Heap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    let i = this.k.length; this.k.push(key); this.v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (this.k[p] <= this.k[i]) break; [this.k[p], this.k[i]] = [this.k[i], this.k[p]]; [this.v[p], this.v[i]] = [this.v[i], this.v[p]]; i = p; }
  }
  pop() {
    const key = this.k[0], val = this.v[0], lk = this.k.pop(), lv = this.v.pop();
    if (this.k.length) {
      this.k[0] = lk; this.v[0] = lv; let i = 0; const n = this.k.length;
      for (;;) { let m = i; const l = 2 * i + 1, r = l + 1; if (l < n && this.k[l] < this.k[m]) m = l; if (r < n && this.k[r] < this.k[m]) m = r; if (m === i) break; [this.k[m], this.k[i]] = [this.k[i], this.k[m]]; [this.v[m], this.v[i]] = [this.v[i], this.v[m]]; i = m; }
    }
    return [key, val];
  }
}
/** 以「位置」合併重複頂點後的邊圖（CSR）。 */
function buildGraph(pos, idx) {
  const nV = pos.length / 3, canon = new Int32Array(nV), m = new Map(), cp = []; let nC = 0;
  for (let i = 0; i < nV; i++) {
    const k = Math.round(pos[3 * i] * 1e6) + '_' + Math.round(pos[3 * i + 1] * 1e6) + '_' + Math.round(pos[3 * i + 2] * 1e6);
    let c = m.get(k); if (c === undefined) { c = nC++; m.set(k, c); cp.push(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]); }
    canon[i] = c;
  }
  const edges = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const a = canon[idx[t]], b = canon[idx[t + 1]], c = canon[idx[t + 2]];
    for (const [x, y] of [[a, b], [b, c], [c, a]]) { if (x === y) continue; const key = Math.min(x, y) * nC + Math.max(x, y); edges.set(key, (edges.get(key) || 0) + 1); }
  }
  const deg = new Int32Array(nC);
  for (const key of edges.keys()) { deg[Math.floor(key / nC)]++; deg[key % nC]++; }
  const off = new Int32Array(nC + 1); for (let i = 0; i < nC; i++) off[i + 1] = off[i] + deg[i];
  const nbr = new Int32Array(off[nC]), wgt = new Float64Array(off[nC]), fill = off.slice(0, nC), boundary = [];
  for (const [key, cnt] of edges) {
    const lo = Math.floor(key / nC), hi = key % nC;
    const w = Math.hypot(cp[3 * lo] - cp[3 * hi], cp[3 * lo + 1] - cp[3 * hi + 1], cp[3 * lo + 2] - cp[3 * hi + 2]);
    nbr[fill[lo]] = hi; wgt[fill[lo]++] = w; nbr[fill[hi]] = lo; wgt[fill[hi]++] = w;
    if (cnt === 1) boundary.push([lo, hi]);
  }
  return {nC, canon, cp, off, nbr, wgt, boundary};
}
function dijkstra(G, sources) {
  const d = new Float64Array(G.nC).fill(Infinity), h = new Heap();
  for (const s of sources) { d[s] = 0; h.push(0, s); }
  while (h.size) {
    const [du, u] = h.pop(); if (du > d[u]) continue;
    for (let e = G.off[u]; e < G.off[u + 1]; e++) { const v = G.nbr[e], nd = du + G.wgt[e]; if (nd < d[v]) { d[v] = nd; h.push(nd, v); } }
  }
  return d;
}
function components(G) {
  const par = Int32Array.from({length: G.nC}, (_, i) => i);
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let u = 0; u < G.nC; u++) for (let e = G.off[u]; e < G.off[u + 1]; e++) par[find(u)] = find(G.nbr[e]);
  const roots = new Set(); for (let u = 0; u < G.nC; u++) if (G.off[u + 1] > G.off[u]) roots.add(find(u));
  return roots.size;
}
function boundaryLoops(G) {
  const par = new Map(), find = x => { let r = x; while (par.get(r) !== r) r = par.get(r); par.set(x, r); return r; };
  for (const [a, b] of G.boundary) { if (!par.has(a)) par.set(a, a); if (!par.has(b)) par.set(b, b); par.set(find(a), find(b)); }
  const loops = new Map(); for (const v of par.keys()) { const r = find(v); if (!loops.has(r)) loops.set(r, []); loops.get(r).push(v); }
  return [...loops.values()];
}/* ───────────────────────── weld + simplify（gltf-transform；逐結構一個小 Document） ───────────────────────── */
async function weldSimplify(g, {absTol = 0, ratio = 0, lockBorder = false}) {
  const doc = new Document(), buf = doc.createBuffer();
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', g.pos)).setAttribute('NORMAL', acc('VEC3', g.nrm)).setIndices(acc('SCALAR', g.idx));
  doc.createScene().addChild(doc.createNode('n').setMesh(doc.createMesh('m').addPrimitive(prim)));
  doc.setLogger(new Logger(Logger.Verbosity.SILENT));
  const steps = [weld()];
  if (absTol > 0) steps.push(simplify({simplifier: MeshoptSimplifier, ratio, error: absTol / MeshoptSimplifier.getScale(g.pos, 3), lockBorder}));
  await doc.transform(...steps);
  const p = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  return {id: g.id, pos: Float32Array.from(p.getAttribute('POSITION').getArray()), nrm: Float32Array.from(p.getAttribute('NORMAL').getArray()), idx: Uint32Array.from(p.getIndices().getArray())};
}
function stats(g) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = g.pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  let A = 0; const c = [0, 0, 0];
  for (let t = 0; t < g.idx.length; t += 3) {
    const a = g.idx[t] * 3, b = g.idx[t + 1] * 3, d = g.idx[t + 2] * 3;
    const ux = g.pos[b] - g.pos[a], uy = g.pos[b + 1] - g.pos[a + 1], uz = g.pos[b + 2] - g.pos[a + 2];
    const vx = g.pos[d] - g.pos[a], vy = g.pos[d + 1] - g.pos[a + 1], vz = g.pos[d + 2] - g.pos[a + 2];
    const ar = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    A += ar; for (let k = 0; k < 3; k++) c[k] += ar * (g.pos[a + k] + g.pos[b + k] + g.pos[d + k]) / 3;
  }
  const r5 = x => Math.round(x * 1e5) / 1e5;
  return {triangles: g.idx.length / 3, bbox: {min: mn.map(r5), max: mx.map(r5)}, centroid: c.map(v => r5(v / (A || 1))), area: A};
}
/** 群組底下所有「有網格」的結構（結構本身底下若還有子結構也一起收；資料集有些腦溝結構底下掛著腦回） */
function descAll(groupId) {
  const out = [];
  for (const s of manifest.structures) if (s.parent === groupId) { if (s.meshes && s.meshes.length) out.push(s.id); out.push(...descAll(s.id)); }
  return out;
}
const mergeIds = s => [...new Set(s.merge.flatMap(descAll))].filter(id => !(s.drop && s.drop.test(id)));

/* ───────────────────────── 建立各變體的幾何 ───────────────────────── */
async function buildVariant(name) {
  const cfg = LOD[name], out = [], log = [];
  for (const s of SEL) {
    const pr = cfg.prof[s.prof];
    let g;
    if (s.merge) g = concatGeoms(s.id, await Promise.all(mergeIds(s).map(id => getGeom(id, 'standard'))));
    else g = await getGeom(s.id, 'standard');
    const srcTris = g.idx.length / 3, srcComp = components(buildGraph(g.pos, g.idx));
    const r = await weldSimplify(g, pr), comp = components(buildGraph(r.pos, r.idx));
    r.meta = s; r.srcTris = srcTris;
    if (comp !== srcComp) log.push(`  !! [${name}] ${s.id} 簡化後連通塊數 ${srcComp} → ${comp}`);
    if (flag('--list')) log.push(`  [${name}] ${s.id.padEnd(58)} ${String(srcTris).padStart(7)} → ${String(r.idx.length / 3).padStart(7)}`);
    out.push(r);
  }
  return {geoms: out, log};
}

/* ───────────────────────── 組 glb 並寫檔 ───────────────────────── */
const ATTR_ZANATOMY = '“Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas.';
const ATTR_BRAINDER = '“Brain for Blender” by Anderson M. Winkler (https://brainder.org/research/brain-for-blender/), CC BY-SA 3.0, as adapted in “Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0; cortical parcellation of Destrieux et al. (2010), computed with FreeSurfer. Adapted for Svitylo 3D Anatomy Atlas.';  // 與 ATTRIBUTION.md 逐字相同
async function writeGlb(file, geoms, variant) {
  const doc = new Document(), buf = doc.createBuffer(), scene = doc.createScene('brain_scene_v1');
  const mats = new Map();
  for (const g of geoms) {
    const s = g.meta, hex = colorOf(s);
    if (!mats.has(hex)) mats.set(hex, doc.createMaterial('mat_' + hex.slice(1)).setBaseColorFactor([...hex2lin(hex), 1]).setRoughnessFactor(0.7).setMetallicFactor(0).setDoubleSided(true));
    const nv = g.pos.length / 3, idxArr = nv < 65535 ? Uint16Array.from(g.idx) : g.idx;
    const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
    const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', g.pos)).setAttribute('NORMAL', acc('VEC3', g.nrm)).setIndices(acc('SCALAR', idxArr)).setMaterial(mats.get(hex));
    const mesh = doc.createMesh(s.id).addPrimitive(prim);
    scene.addChild(doc.createNode(s.id).setMesh(mesh).setExtras({kind: s.kind, system: byId.get(s.id)?.system || 'derived'}));
  }
  const asset = doc.getRoot().getAsset();
  asset.generator = 'physical-boys tools/anatomy/extract_brain_scene.mjs (glTF-Transform)';
  asset.copyright = ATTR_ZANATOMY + ' Cerebral cortex: ' + ATTR_BRAINDER + ' Modified (selected, merged, simplified, quantised). Licence of this file: CC BY-SA 4.0. See sources.md.';
  doc.getRoot().setExtras({
    dataset: `${manifest.title.en} ${manifest.model} release ${manifest.version}`, upstream: manifest.source.repository, upstreamRevision: manifest.source.revision,
    licence: 'CC-BY-SA-4.0', units: 'm', up: '+Y', front: '+Z', variant,
    note: 'Node names are dataset structure ids (merged nodes: brain.*, regions.*_surface). Positions are quantised: node translation/scale restore world coordinates (metres).',
  });
  doc.setLogger(new Logger(Logger.Verbosity.WARN));
  await doc.transform(prune(), meshopt({encoder: MeshoptEncoder, level: 'high', quantizePosition: 16}));
  fs.mkdirSync(path.dirname(file), {recursive: true});
  await ioWrite.write(file, doc);
  return fs.statSync(file).size;
}

/* ───────────────────────── 驗證：重讀 glb ───────────────────────── */
async function verify(file, label) {
  const doc = await ioRead.read(file), res = new Map();
  for (const n of doc.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; let t = 0; for (const p of m.listPrimitives()) t += p.getIndices().getCount() / 3; res.set(n.getName(), t); }
  const want = SEL.map(s => s.id), missing = want.filter(id => !res.has(id)), extra = [...res.keys()].filter(id => !want.includes(id));
  const total = [...res.values()].reduce((a, b) => a + b, 0), brain = SEL.filter(s => s.prof === 'brain').reduce((a, s) => a + (res.get(s.id) || 0), 0);
  console.log(`=== 驗證 ${label}：${path.basename(file)}（${(fs.statSync(file).size / 1048576).toFixed(2)} MB）node ${res.size}／預期 ${want.length}；缺 ${missing.join(',') || '無'}；多 ${extra.join(',') || '無'}；三角形 ${total}（腦 ${brain}）`);
}

/* ───────────────────────── 主流程 ───────────────────────── */
const fullPath = path.join(OUT, 'brain_scene_v1.glb'), litePath = path.join(OUT, 'brain_scene_v1_lite.glb'), jsonPath = path.join(OUT, 'brain_parts_v1.json');
if (!flag('--verify-only')) {
  console.log(`資料集：${manifest.model} ${manifest.version}，來源 ${manifest.source.repository} @ ${manifest.source.revision}`);
  const t = fs.readFileSync(path.join(DATA, 'ATTRIBUTION.md'), 'utf8');
  for (const [n, s] of [['Z-Anatomy', ATTR_ZANATOMY], ['Brain for Blender', ATTR_BRAINDER]]) if (!t.includes(s)) console.warn(`!! ATTRIBUTION.md 的 ${n} 署名文字與腳本內建不同，請人工比對後更新`);
  const missingIds = SEL.filter(s => !s.merge && !byId.get(s.id)?.meshes).map(s => s.id);
  if (missingIds.length) throw new Error('manifest 找不到：' + missingIds.join(', '));
  const full = await buildVariant('full'); full.log.forEach(l => console.log(l));
  const lite = await buildVariant('lite'); lite.log.forEach(l => console.log(l));
  const sizeFull = await writeGlb(fullPath, full.geoms, 'full'), sizeLite = await writeGlb(litePath, lite.geoms, 'lite');
  console.log(`寫出 ${fullPath}  ${(sizeFull / 1048576).toFixed(2)} MB\n寫出 ${litePath}  ${(sizeLite / 1048576).toFixed(2)} MB`);
  const liteBy = new Map(lite.geoms.map(g => [g.meta.id, g]));
  const parts = full.geoms.map(g => {
    const s = g.meta, st = stats(g), m = byId.get(s.id);
    let en = s.en || enNames[s.id]?.name || null;
    if (m?.side && en && !/\b(left|right)\b/i.test(en)) en = (m.side === 'left' ? 'Left ' : 'Right ') + en.charAt(0).toLowerCase() + en.slice(1);
    if (s.merge) en = {'brain.frontal_lobe': 'Frontal lobe (merged)', 'brain.parietal_lobe': 'Parietal lobe (merged)', 'brain.temporal_lobe': 'Temporal lobe (merged)', 'brain.occipital_lobe': 'Occipital lobe (merged)',
      'brain.other_cortex': 'Insula, limbic lobe and interlobar sulci (merged)', 'brain.cerebellum': 'Cerebellum (merged)', 'brain.brainstem': 'Brainstem (merged outer shape)',
      'regions.head_neck_surface': 'Head and neck surface (merged body regions)', 'regions.thorax_surface': 'Thorax surface (merged body regions)'}[s.id];
    const lic = licenseOf.get(s.asset || m?.asset) || licenseOf.get('z-anatomy');
    const e = {id: s.id, en, zh: s.zh, kind: s.kind, system: m?.system || s.sys || s.os, organ_system: s.os, group: s.group || null};
    if (s.o2) e.o2 = s.o2;
    if (s.background) e.background = true;
    Object.assign(e, {triangles: st.triangles, triangles_lite: stats(liteBy.get(s.id)).triangles, bbox: st.bbox, centroid: st.centroid, license: lic});
    if (s.asset) e.asset = s.asset;
    if (s.zhReview) e.zh_review = true;
    if (s.merge) { e.derived = 'merge'; e.merged_from = mergeIds(s); }
    if (s.note) e.note = s.note;
    return e;
  });
  fs.writeFileSync(jsonPath, '[\n' + parts.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n');
  console.log(`寫出 ${jsonPath}（${parts.length} 筆；zh_review ${parts.filter(p => p.zh_review).length} 筆）`);
}
await verify(fullPath, '完整版'); await verify(litePath, '輕量版');
