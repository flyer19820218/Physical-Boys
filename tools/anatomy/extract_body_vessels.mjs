#!/usr/bin/env node
/**
 * extract_body_vessels.mjs
 * 從開源解剖資料集（3D Anatomy Atlas data release 1.2.0 ＝ Z-Anatomy／BodyParts3D 衍生，和 si_scene_v1.glb 同一份資料、同一座標）
 * 抽出「全身血管底圖」：資料集 cardiovascular 系統 676 個有網格的結構，扣掉 si_scene 已經有的（它們由各場景自己畫），
 * 其餘 ≈600 條（四肢、頭頸、胸腹壁、脊髓、冠狀動脈、顱內靜脈竇…）依「動脈／靜脈 × 頭頸／手臂／腿／軀幹」合併成 8 個 node，
 * 輸出：
 *   <out>/body_vessels_v1.glb        完整版（背景用；誤差上限 0.2 mm）
 *   <out>/body_vessels_v1_lite.glb   輕量版（iPad 備援；誤差上限 0.6 mm）
 *   <out>/body_vessels_parts_v1.json 每個 node 的 id、種類、區域、中文名、三角形數、成員結構（英文 id）
 *
 * 需要 npm 套件（裝在暫存資料夾，不要裝進 repo）：npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 * 用法：node tools/anatomy/extract_body_vessels.mjs --data <releases/1.2.0 資料夾> [--out assets/biology/anatomy3d] [--modules /tmp/gl/node_modules]
 *   --data  資料集 release 資料夾（要有 manifest.json、standard/cardiovascular、economy/cardiovascular）。唯讀。
 * 改作（寫進 sources.md）：挑選、依區域合併、weld、simplify（meshoptimizer，鎖住開口邊界）、quantize、meshopt 壓縮。座標不改。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!opt('--data')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); process.exit(1); }
const DATA = path.resolve(opt('--data'));
const OUT = path.resolve(opt('--out', path.join(HERE, '..', '..', 'assets', 'biology', 'anatomy3d')));
const MODULES = opt('--modules');
const ENTRY = {
  '@gltf-transform/core': '@gltf-transform/core/dist/index.js', '@gltf-transform/extensions': '@gltf-transform/extensions/dist/index.js',
  '@gltf-transform/functions': '@gltf-transform/functions/dist/index.js', 'meshoptimizer/decoder': 'meshoptimizer/meshopt_decoder.mjs',
  'meshoptimizer/encoder': 'meshoptimizer/meshopt_encoder.js', 'meshoptimizer/simplifier': 'meshoptimizer/meshopt_simplifier.js',
};
const dep = spec => MODULES ? import(pathToFileURL(path.resolve(MODULES, ENTRY[spec])).href) : import(spec);
const {Document, NodeIO, Logger} = await dep('@gltf-transform/core');
const {EXTMeshoptCompression, KHRMeshQuantization, ALL_EXTENSIONS} = await dep('@gltf-transform/extensions');
const {weld, simplify, meshopt, prune} = await dep('@gltf-transform/functions');
const {MeshoptDecoder} = await dep('meshoptimizer/decoder');
const {MeshoptEncoder} = await dep('meshoptimizer/encoder');
const {MeshoptSimplifier} = await dep('meshoptimizer/simplifier');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const ioRead = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
const ioWrite = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});

/* ───────── 讀資料集（和 extract_brain_scene.mjs 相同的讀法：每個 chunk 一個合併 primitive、頂點帶 _ID＝(全域 mesh 編號, 材質編號)） ───────── */
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8'));
const byId = new Map(manifest.structures.map(s => [s.id, s]));
const chunkOfMesh = i => manifest.chunks.find(c => i >= c.meshStart && i < c.meshStart + c.meshCount);
const chunkCache = new Map();
async function loadChunk(chunk, quality) {
  const key = chunk.id + '|' + quality;
  if (chunkCache.has(key)) return chunkCache.get(key);
  const doc = await ioRead.read(path.join(DATA, chunk.files[quality].path));
  const nodes = doc.getRoot().listNodes();
  if (nodes.length !== 1) throw new Error(`chunk ${chunk.id}: 預期 1 個 node`);
  const node = nodes[0], prims = node.getMesh().listPrimitives();
  if (prims.length !== 1) throw new Error(`chunk ${chunk.id}: 預期 1 個 primitive`);
  const T = node.getTranslation(), S = node.getScale(), R = node.getRotation();
  if (R.some((v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 1e-9)) throw new Error('chunk 帶旋轉：' + chunk.id);
  const p = prims[0], pa = p.getAttribute('POSITION'), na = p.getAttribute('NORMAL'), ia = p.getAttribute('_ID');
  if (!ia) throw new Error('chunk 沒有 _ID 屬性：' + chunk.id);
  const n = pa.getCount(), pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), ids = new Uint16Array(n), e = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    pa.getElement(i, e); for (let k = 0; k < 3; k++) pos[i * 3 + k] = e[k] * S[k] + T[k];
    na.getElement(i, e); for (let k = 0; k < 3; k++) nrm[i * 3 + k] = e[k];
    ia.getElement(i, e); ids[i] = e[0];
  }
  const c = {pos, nrm, ids, idx: p.getIndices().getArray()};
  const set = new Set(ids);
  if (set.size !== chunk.meshCount || [...set].some(v => v < chunk.meshStart || v >= chunk.meshStart + chunk.meshCount)) throw new Error(`chunk ${chunk.id}: _ID 與 manifest 對不上`);
  chunkCache.set(key, c); return c;
}
async function getGeom(id, quality) {
  const s = byId.get(id), mi = s.meshes[0], c = await loadChunk(chunkOfMesh(mi), quality);
  const remap = new Map(), P = [], N = [], I = [];
  for (let t = 0; t < c.idx.length; t += 3) {
    const a = c.idx[t], b = c.idx[t + 1], d = c.idx[t + 2];
    if (c.ids[a] !== mi) continue;
    for (const v of [a, b, d]) {
      let r = remap.get(v);
      if (r === undefined) { r = P.length / 3; remap.set(v, r); P.push(c.pos[v * 3], c.pos[v * 3 + 1], c.pos[v * 3 + 2]); N.push(c.nrm[v * 3], c.nrm[v * 3 + 1], c.nrm[v * 3 + 2]); }
      I.push(r);
    }
  }
  return {pos: Float32Array.from(P), nrm: Float32Array.from(N), idx: Uint32Array.from(I)};
}
const concat = (id, gs) => {
  let nv = 0, ni = 0; for (const g of gs) { nv += g.pos.length; ni += g.idx.length; }
  const pos = new Float32Array(nv), nrm = new Float32Array(nv), idx = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of gs) { pos.set(g.pos, vo); nrm.set(g.nrm, vo); for (let i = 0; i < g.idx.length; i++) idx[io + i] = g.idx[i] + vo / 3; vo += g.pos.length; io += g.idx.length; }
  return {id, pos, nrm, idx};
};
async function weldSimplify(g, absTol) {
  const doc = new Document(), buf = doc.createBuffer(), acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', g.pos)).setAttribute('NORMAL', acc('VEC3', g.nrm)).setIndices(acc('SCALAR', g.idx));
  doc.createScene().addChild(doc.createNode('n').setMesh(doc.createMesh('m').addPrimitive(prim)));
  doc.setLogger(new Logger(Logger.Verbosity.SILENT));
  await doc.transform(weld(), simplify({simplifier: MeshoptSimplifier, ratio: 0, error: absTol / MeshoptSimplifier.getScale(g.pos, 3), lockBorder: true}));
  const p = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  return {id: g.id, pos: Float32Array.from(p.getAttribute('POSITION').getArray()), nrm: Float32Array.from(p.getAttribute('NORMAL').getArray()), idx: Uint32Array.from(p.getIndices().getArray())};
}

/* ───────── 選取與分區 ───────── */
const have = new Set(JSON.parse(fs.readFileSync(path.join(OUT, 'si_parts_v1.json'), 'utf8')).map(p => p.id));   // si_scene 已有的（各場景自己畫）
const VEIN = /vein|vena|sinus|venous|plexus/i, SKIP = /^(x_[lr]|unnamed|left_atrium|left_ventricle|right_atrium|right_ventricle)$|papillary|leaflet/;
const ARM = /axillary|brachial|radial|ulnar|palmar|metacarpal|digital_(arteries|veins)_of_hand|cephalic|basilic|median_(cubital|antebrachial)|humeral|collateral|interosseous|carpal|subscapular|thoracodorsal|scapular|antebrachial|deep_palmar|superficial_palmar/i;
const LEG = /femoral|popliteal|tibial|fibular|plantar|dorsalis_pedis|metatarsal|genicular|saphenous|digital_(arteries|veins)_of_foot|peroneal|tarsal|calcaneal|malleolar|external_iliac|patellar|perforating|gluteal|obturator|pudendal/i;
const HEAD = /carotid|facial|temporal|maxillary|lingual|jugular|occipital|vertebral|basilar|cerebral|cerebellar|sinus|ophthalmic|angular|thyroid|labial|meningeal|communicating|retinal|orbital|diploic|emissary|pharyngeal|palatine|mental|buccal|masseteric|auricular|sphenopalatine|supraorbital|supratrochlear|ethmoidal|infraorbital|alveolar|nasal|pontine|choroidal|callosal|striate|thalamo|labyrinthine|ascending_cervical|cervical|vertebr|retromandibular|diploic|trigeminal|submental|suprascapular_vein/i;
const sel = [];
for (const s of manifest.structures) {
  if (s.system !== 'cardiovascular' || s.kind !== 'structure' || !s.meshes || !s.meshes.length) continue;
  if (have.has(s.id)) continue;
  const name = s.id.split('.').slice(1).join('.');
  if (SKIP.test(name)) continue;
  const kind = VEIN.test(name) ? 'vein' : 'artery';
  let region = ARM.test(name) ? 'arm' : LEG.test(name) ? 'leg' : HEAD.test(name) ? 'head' : null;
  sel.push({id: s.id, name, kind, region});
}
/* 沒有被名稱規則分到的，用網格中心點的位置分：頭頸（y>1.45）、手臂（|x|>0.16）、腿（y<0.95）、其他＝軀幹 */
const cent = new Map();
for (const q of sel) {
  const g = await getGeom(q.id, 'economy'); let x = 0, y = 0, n = g.pos.length / 3;
  for (let i = 0; i < n; i++) { x += g.pos[i * 3]; y += g.pos[i * 3 + 1]; }
  cent.set(q.id, [x / n, y / n]);
  if (!q.region) { const [cx, cy] = cent.get(q.id); q.region = cy > 1.45 ? 'head' : Math.abs(cx) > 0.16 ? 'arm' : cy < 0.95 ? 'leg' : 'trunk'; }
}
const REGION_ZH = {head: '頭頸', arm: '手臂', leg: '腿', trunk: '軀幹'}, KIND_ZH = {artery: '動脈', vein: '靜脈'};
const nodes = new Map();
for (const q of sel) { const id = `body.${q.kind === 'artery' ? 'arteries' : 'veins'}.${q.region}`; if (!nodes.has(id)) nodes.set(id, {id, kind: q.kind, region: q.region, members: []}); nodes.get(id).members.push(q.id); }
console.log('選取', sel.length, '條；節點', [...nodes.values()].map(n => `${n.id}:${n.members.length}`).join(' '));

/* ───────── 建置 ───────── */
const LOD = {full: {q: 'standard', tol: 0.0002, file: 'body_vessels_v1.glb'}, lite: {q: 'economy', tol: 0.0006, file: 'body_vessels_v1_lite.glb'}};
const ATTR = '“Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas.';
const report = {};
for (const [name, cfg] of Object.entries(LOD)) {
  const outG = [];
  for (const n of nodes.values()) {
    const gs = []; for (const m of n.members) gs.push(await getGeom(m, cfg.q));
    outG.push(await weldSimplify(concat(n.id, gs), cfg.tol));
  }
  const doc = new Document(), buf = doc.createBuffer(), scene = doc.createScene('body_vessels_v1');
  const mat = doc.createMaterial('vessel').setBaseColorFactor([0.8, 0.2, 0.2, 1]).setRoughnessFactor(0.6).setMetallicFactor(0).setDoubleSided(true);
  for (const g of outG) {
    const nv = g.pos.length / 3, idxArr = nv < 65535 ? Uint16Array.from(g.idx) : g.idx, acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
    const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', g.pos)).setAttribute('NORMAL', acc('VEC3', g.nrm)).setIndices(acc('SCALAR', idxArr)).setMaterial(mat);
    scene.addChild(doc.createNode(g.id).setMesh(doc.createMesh(g.id).addPrimitive(prim)).setExtras({kind: nodes.get(g.id).kind}));
  }
  doc.getRoot().getAsset().generator = 'physical-boys tools/anatomy/extract_body_vessels.mjs (glTF-Transform)';
  doc.getRoot().getAsset().copyright = ATTR + ' Modified (selected, merged by region, simplified, quantised). Licence of this file: CC BY-SA 4.0. See sources.md.';
  doc.getRoot().setExtras({dataset: `${manifest.title.en} ${manifest.model} release ${manifest.version}`, upstream: manifest.source.repository, upstreamRevision: manifest.source.revision, licence: 'CC-BY-SA-4.0', units: 'm', up: '+Y', front: '+Z', variant: name});
  doc.setLogger(new Logger(Logger.Verbosity.WARN));
  await doc.transform(prune(), meshopt({encoder: MeshoptEncoder, level: 'high', quantizePosition: 16}));
  await ioWrite.write(path.join(OUT, cfg.file), doc);
  report[name] = {bytes: fs.statSync(path.join(OUT, cfg.file)).size, tris: Object.fromEntries(outG.map(g => [g.id, g.idx.length / 3]))};
  console.log(name, report[name].bytes, 'bytes', 'tris', Object.values(report[name].tris).reduce((a, b) => a + b, 0));
}
const parts = [...nodes.values()].map(n => ({
  id: n.id, kind: n.kind, region: n.region, zh: `${REGION_ZH[n.region]}${KIND_ZH[n.kind]}（背景血管，示意全身分布）`, en: `${n.region} ${n.kind}s (background network)`,
  n: n.members.length, tris_full: report.full.tris[n.id], tris_lite: report.lite.tris[n.id], license: 'CC-BY-SA-4.0',
  members: n.members.map(m => m.replace(/^cardiovascular\./, ''))
}));
fs.writeFileSync(path.join(OUT, 'body_vessels_parts_v1.json'), JSON.stringify(parts));
console.log('parts json', parts.length, 'nodes; total members', parts.reduce((a, p) => a + p.n, 0));
