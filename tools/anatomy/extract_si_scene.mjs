#!/usr/bin/env node
/**
 * extract_si_scene.mjs
 * 從開源解剖資料集（3D Anatomy Atlas data release 1.2.0 ＝ Z-Anatomy／BodyParts3D 衍生）
 * 抽出「小腸血液循環」場景用的真實解剖網格，輸出：
 *   <out>/si_scene_v1.glb       完整版（standard 品質來源，目標 <= 6 MB）
 *   <out>/si_scene_v1_lite.glb  輕量版（iPad 備援，目標 <= 2.5 MB）
 *   <out>/si_parts_v1.json      每個結構的名稱／分類／三角形數／bbox／centroid
 *
 * 需要的 npm 套件（不要裝進 repo，裝在任何暫存資料夾，例如 /tmp/gl）：
 *   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 *
 * 用法：
 *   node tools/anatomy/extract_si_scene.mjs --data <releases/1.2.0 資料夾> \
 *        [--out assets/biology/anatomy3d] [--modules /tmp/gl/node_modules] [--verify-only]
 *   --data     資料集 release 資料夾（內含 manifest.json、standard/、economy/、ATTRIBUTION.md）。唯讀。
 *   --out      輸出資料夾（預設：<repo>/assets/biology/anatomy3d）
 *   --modules  npm 套件所在的 node_modules（ESM 不看 NODE_PATH；套件不在腳本旁邊時用這個）
 *   --verify-only  不重新抽取，只重讀 <out> 內的 glb 做驗證
 *
 * 資料集格式（已驗證）：每個 chunk glb 只有「一個」合併後的 primitive；
 *   每個頂點帶自訂屬性 _ID = (全域 mesh 編號, 材質編號)。結構 ↔ mesh 是 1:1，
 *   結構 id 由 manifest.structures[].meshes[0] 對到 _ID.x。座標：公尺、+Y 向上、+Z 向前，
 *   +X 為人體的「左側」。chunk 的 node 帶 translation/scale（頂點是 int16 正規化），這裡還原成世界座標。
 *
 * 改作（寫進 sources.md）：挑選、合併（軀幹外形由 42 塊體表分區合併）、把「空腸」曲管依長度切成
 *   空腸（近端約 2/5）與迴腸（遠端約 3/5）、weld、simplify（meshoptimizer，誤差上限見 LOD 表）、
 *   quantize、meshopt 壓縮。座標不改。
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
 * 欄位：id（manifest 結構 id＝glb node 名稱）、zh（繁體中文醫學名稱）、kind、prof（簡化設定檔）、
 *       os（功能系統）、o2（教學配色分類，不是量測值：rich＝動脈血／肺靜脈，poor＝靜脈血／肺動脈）、zhReview（true＝請老師審中文名）、note、background。
 * zh 不確定的一律 zhReview:true。 */
const A = (id, zh, o = {}) => ({id, zh, kind: 'artery', prof: 'vessel', os: 'circulatory', o2: 'rich', ...o});
const Vn = (id, zh, o = {}) => ({id, zh, kind: 'vein', prof: 'vessel', os: 'circulatory', o2: 'poor', ...o});
const O = (id, zh, o = {}) => ({id, zh, kind: 'organ', prof: 'organ', ...o});
const cv = s => 'cardiovascular.' + s, vs = s => 'visceral.' + s;
const SEL = [
  // ── 動脈：主動脈與弓上分支 ──
  A(cv('ascending_aorta'), '升主動脈', {group: 'aorta'}),
  A(cv('aortic_arch'), '主動脈弓', {group: 'aorta'}),
  A(cv('brachiocephalic_trunk'), '頭臂動脈幹', {group: 'aortic_arch_branches', zhReview: true, note: '又稱無名動脈'}),
  A(cv('left_common_carotid_artery'), '左總頸動脈', {group: 'aortic_arch_branches'}),
  A(cv('right_common_carotid_artery'), '右總頸動脈', {group: 'aortic_arch_branches'}),
  A(cv('left_subclavian_artery'), '左鎖骨下動脈', {group: 'aortic_arch_branches'}),
  A(cv('right_subclavian_artery'), '右鎖骨下動脈', {group: 'aortic_arch_branches'}),
  A(cv('thoracic_aorta'), '胸主動脈', {group: 'aorta'}),
  A(cv('abdominal_aorta'), '腹主動脈', {group: 'aorta'}),
  A(cv('common_iliac_artery_l'), '左總髂動脈', {group: 'aorta', zhReview: true, note: '另有「髂總動脈」寫法'}),
  A(cv('common_iliac_artery_r'), '右總髂動脈', {group: 'aorta', zhReview: true, note: '另有「髂總動脈」寫法'}),
  // ── 腹腔動脈幹系 ──
  A(cv('coeliac_trunk'), '腹腔動脈幹', {group: 'coeliac'}),
  A(cv('common_hepatic_artery'), '肝總動脈', {group: 'coeliac'}),
  A(cv('proper_hepatic_artery'), '固有肝動脈', {group: 'coeliac'}),
  A(cv('gastroduodenal_artery'), '胃十二指腸動脈', {group: 'coeliac'}),
  A(cv('left_gastric_artery'), '胃左動脈', {group: 'coeliac'}),
  A(cv('splenic_artery'), '脾動脈', {group: 'coeliac'}),
  // ── 腸系膜上動脈系 ──
  A(cv('superior_mesenteric_artery'), '腸系膜上動脈', {group: 'sma'}),
  A(cv('inferior_pancreaticoduodenal_artery'), '胰十二指腸下動脈', {group: 'sma'}),
  A(cv('anterior_inferior_pancreaticoduodenal_artery'), '胰十二指腸下前動脈', {group: 'sma', zhReview: true, note: '或稱前下胰十二指腸動脈'}),
  A(cv('middle_colic_artery'), '中結腸動脈', {group: 'sma'}),
  A(cv('right_colic_artery'), '右結腸動脈', {group: 'sma'}),
  A(cv('ileocolic_artery'), '迴結腸動脈', {group: 'sma'}),
  A(cv('colic_branch_of_ileocolic_artery'), '迴結腸動脈結腸支', {group: 'sma', zhReview: true}),
  A(cv('ileal_branch_of_ileocolic_artery'), '迴結腸動脈迴腸支', {group: 'sma', zhReview: true}),
  A(cv('appendicular_artery'), '闌尾動脈', {group: 'sma'}),
  A(cv('marginal_artery'), '邊緣動脈', {group: 'sma', zhReview: true, note: '資料集名稱 Marginal artery（TA2：結腸邊緣動脈，即邊緣動脈弓），請老師確認要用哪個稱呼'}),
  // ── 腸系膜下動脈系 ──
  A(cv('inferior_mesenteric_artery'), '腸系膜下動脈', {group: 'ima'}),
  A(cv('left_colic_artery'), '左結腸動脈', {group: 'ima'}),
  A(cv('ascending_branch_of_left_colic_artery'), '左結腸動脈升支', {group: 'ima'}),
  A(cv('descending_branch_of_left_colic_artery'), '左結腸動脈降支', {group: 'ima'}),
  A(cv('sigmoid_arteries'), '乙狀結腸動脈', {group: 'ima'}),
  A(cv('superior_anorectal_artery'), '上直腸動脈', {group: 'ima', zhReview: true, note: '資料集名稱 Superior anorectal artery'}),
  // ── 腎動脈 ──
  A(cv('left_renal_artery'), '左腎動脈', {group: 'renal'}),
  A(cv('right_renal_artery'), '右腎動脈', {group: 'renal'}),
  A(cv('anterior_branch_of_renal_artery_l'), '左腎動脈前支', {group: 'renal'}),
  A(cv('posterior_branch_of_renal_artery_l'), '左腎動脈後支', {group: 'renal'}),
  A(cv('anterior_branch_of_renal_artery_r'), '右腎動脈前支', {group: 'renal'}),
  A(cv('posterior_branch_of_renal_artery_r'), '右腎動脈後支', {group: 'renal'}),
  // ── 肺循環動脈（缺氧血）──
  A(cv('pulmonary_trunk'), '肺動脈幹', {group: 'pulmonary', o2: 'poor'}),
  A(cv('left_pulmonary_artery'), '左肺動脈', {group: 'pulmonary', o2: 'poor'}),
  A(cv('right_pulmonary_artery'), '右肺動脈', {group: 'pulmonary', o2: 'poor'}),
  // ── 冠狀動脈（附帶）──
  A(cv('left_coronary_artery'), '左冠狀動脈', {group: 'coronary'}),
  A(cv('anterior_interventricular_artery'), '前室間動脈', {group: 'coronary', zhReview: true, note: '臨床稱左前降支（LAD）'}),
  A(cv('circumflex_artery_of_heart'), '迴旋支', {group: 'coronary', zhReview: true, note: '左冠狀動脈迴旋支（左旋支）'}),
  A(cv('right_coronary_artery'), '右冠狀動脈', {group: 'coronary'}),
  // ── 靜脈：肝門靜脈系 ──
  Vn(cv('hepatic_portal_vein_2'), '肝門靜脈', {group: 'portal', note: '靜脈血（含氧量低於動脈血）、富含小腸吸收的養分；id 的 _2 是資料集為避開同名 group 加的'}),
  Vn(cv('superior_mesenteric_vein'), '腸系膜上靜脈', {group: 'portal'}),
  Vn(cv('middle_colic_vein'), '中結腸靜脈', {group: 'portal'}),
  Vn(cv('right_colic_vein'), '右結腸靜脈', {group: 'portal'}),
  Vn(cv('right_gastro_omental_vein'), '右胃網膜靜脈', {group: 'portal', zhReview: true, note: '或稱胃網膜右靜脈'}),
  Vn(cv('splenic_vein'), '脾靜脈', {group: 'portal'}),
  Vn(cv('left_gastro_omental_vein'), '左胃網膜靜脈', {group: 'portal', zhReview: true, note: '或稱胃網膜左靜脈'}),
  Vn(cv('inferior_mesenteric_vein'), '腸系膜下靜脈', {group: 'portal'}),
  Vn(cv('sigmoid_veins'), '乙狀結腸靜脈', {group: 'portal'}),
  // ── 靜脈：腔靜脈、肝靜脈、腎靜脈、肺靜脈 ──
  Vn(cv('hepatic_veins'), '肝靜脈', {group: 'caval'}),
  Vn(cv('inferior_vena_cava_thoracic_part'), '下腔靜脈（胸段）', {group: 'caval', note: '資料集把下腔靜脈分成胸段（y 約 1.17–1.26 m，接右心房）與腹段（y 約 1.03–1.17 m）兩塊'}),
  Vn(cv('inferior_vena_cava_abdominal_part'), '下腔靜脈（腹段）', {group: 'caval'}),
  Vn(cv('common_iliac_vein_l'), '左總髂靜脈', {group: 'caval', zhReview: true, note: '另有「髂總靜脈」寫法'}),
  Vn(cv('common_iliac_vein_r'), '右總髂靜脈', {group: 'caval', zhReview: true, note: '另有「髂總靜脈」寫法'}),
  Vn(cv('left_renal_vein'), '左腎靜脈', {group: 'renal'}),
  Vn(cv('right_renal_vein'), '右腎靜脈', {group: 'renal'}),
  Vn(cv('superior_vena_cava'), '上腔靜脈', {group: 'caval'}),
  Vn(cv('left_brachiocephalic_vein'), '左頭臂靜脈', {group: 'caval', zhReview: true, note: '又稱無名靜脈'}),
  Vn(cv('right_brachiocephalic_vein'), '右頭臂靜脈', {group: 'caval', zhReview: true, note: '又稱無名靜脈'}),
  Vn(cv('left_superior_pulmonary_vein'), '左上肺靜脈', {group: 'pulmonary', o2: 'rich'}),
  Vn(cv('left_inferior_pulmonary_vein'), '左下肺靜脈', {group: 'pulmonary', o2: 'rich'}),
  Vn(cv('right_superior_pulmonary_vein'), '右上肺靜脈', {group: 'pulmonary', o2: 'rich'}),
  Vn(cv('right_inferior_pulmonary_vein'), '右下肺靜脈', {group: 'pulmonary', o2: 'rich'}),
  // ── 心臟 ──
  O(cv('left_atrium'), '左心房', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'rich'}),
  O(cv('left_ventricle'), '左心室', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'rich'}),
  O(cv('right_atrium'), '右心房', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'poor'}),
  O(cv('right_ventricle'), '右心室', {prof: 'heart', os: 'circulatory', group: 'heart', o2: 'poor'}),
  O(cv('left_coronary_leaflet'), '主動脈瓣左冠狀瓣', {prof: 'heart', os: 'circulatory', group: 'aortic_valve', zhReview: true, note: '主動脈根的半月瓣。資料集沒有獨立的主動脈根（竇）網格，root_of_aorta 群組只含這三片瓣，根部位置請看升主動脈起端'}),
  O(cv('right_coronary_leaflet'), '主動脈瓣右冠狀瓣', {prof: 'heart', os: 'circulatory', group: 'aortic_valve', zhReview: true}),
  O(cv('non_coronary_leaflet'), '主動脈瓣無冠狀瓣', {prof: 'heart', os: 'circulatory', group: 'aortic_valve', zhReview: true}),
  // ── 消化器官 ──
  O(vs('duodenum'), '十二指腸', {prof: 'tube', os: 'digestive', group: 'small_intestine'}),
  O(vs('jejunum'), '空腸', {prof: 'tube', os: 'digestive', group: 'small_intestine', derived: 'split_small_intestine',
    note: '資料集的空腸與迴腸是同一條曲管；本場景依管腔長度把近端約 2/5 切為空腸（分界為示意，非解剖邊界）'}),
  O(vs('ileum'), '迴腸', {prof: 'tube', os: 'digestive', group: 'small_intestine', derived: 'split_small_intestine', sys: 'visceral',
    note: '資料集沒有獨立的迴腸；由原「空腸」曲管遠端約 3/5 切出（分界為示意，非解剖邊界）'}),
  O(vs('liver'), '肝臟', {os: 'digestive'}),
  O(vs('stomach'), '胃', {os: 'digestive'}),
  O(vs('pancreas'), '胰臟', {os: 'digestive'}),
  O('lymphoid.spleen', '脾臟', {os: 'lymphatic'}),
  O(vs('ascending_colon'), '升結腸', {prof: 'bg', os: 'digestive', group: 'large_intestine', background: true, note: '含盲腸部分（資料集沒有獨立的盲腸／直腸）'}),
  O(vs('transverse_colon'), '橫結腸', {prof: 'bg', os: 'digestive', group: 'large_intestine', background: true}),
  O(vs('descending_colon'), '降結腸', {prof: 'bg', os: 'digestive', group: 'large_intestine', background: true}),
  O(vs('sigmoid_colon'), '乙狀結腸', {prof: 'bg', os: 'digestive', group: 'large_intestine', background: true}),
  O(vs('vermiform_appendix'), '闌尾', {prof: 'bg', os: 'digestive', group: 'large_intestine', background: true}),
  // ── 泌尿、呼吸、橫膈 ──
  O(vs('fibrous_capsule_of_kidney_l'), '左腎', {os: 'urinary', group: 'kidney', en: 'Left kidney (outline of fibrous capsule)', note: '以腎纖維囊的外形代表整個左腎（資料集的腎為 Human Reference Atlas 腎，CC BY 4.0）'}),
  O(vs('fibrous_capsule_of_kidney_r'), '右腎', {os: 'urinary', group: 'kidney', en: 'Right kidney (outline of fibrous capsule)', note: '以腎纖維囊的外形代表整個右腎（資料集的腎為 Human Reference Atlas 腎，CC BY 4.0）'}),
  O(vs('superior_lobe_of_left_lung'), '左肺上葉', {prof: 'bg', os: 'respiratory', group: 'lung', background: true}),
  O(vs('inferior_lobe_of_left_lung'), '左肺下葉', {prof: 'bg', os: 'respiratory', group: 'lung', background: true}),
  O(vs('superior_lobe_of_right_lung'), '右肺上葉', {prof: 'bg', os: 'respiratory', group: 'lung', background: true}),
  O(vs('middle_lobe_of_right_lung'), '右肺中葉', {prof: 'bg', os: 'respiratory', group: 'lung', background: true}),
  O(vs('inferior_lobe_of_right_lung'), '右肺下葉', {prof: 'bg', os: 'respiratory', group: 'lung', background: true}),
  O('muscular.diaphragm', '橫膈', {prof: 'bg', os: 'muscular'}),
  // ── 背景：軀幹體表（由體表分區合併）──
  {id: 'regions.torso_surface', zh: '軀幹體表', kind: 'context', prof: 'context', os: 'integumentary', sys: 'regions', background: true, derived: 'merge_regions',
   note: '由資料集「胸部、腹部、背部、會陰」共 42 塊體表分區合併成一個外形殼（無頭、無四肢），僅作定位背景'},
];
// 合併成軀幹體表的 manifest 群組（取其底下所有 structure）
const TORSO_GROUPS = ['regions.regions_of_thorax', 'regions.regions_of_abdomen', 'regions.regions_of_back', 'regions.regions_of_perineum'];
const TORSO_EXTRA = ['regions.umbilicus_l', 'regions.umbilicus_r'];

/* ───────────────────────── 品質（LOD）設定 ─────────────────────────
 * absTol：簡化允許的「絕對」誤差（公尺），換算成 meshoptimizer 的相對誤差 = absTol / getScale(pos)。
 * lockBorder：鎖住開口邊界（血管兩端、腸管兩端不縮短，相鄰結構才接得上）。 */
const LOD = {
  full: {
    src: () => 'standard',
    prof: {
      vessel: {absTol: 0.00003, lockBorder: true},
      heart: {absTol: 0.0001},
      organ: {absTol: 0.0001},
      tube: {absTol: 0.00015, lockBorder: true},
      bg: {absTol: 0.0002},
      context: {absTol: 0.0015, ratio: 0.4},
    },
  },
  lite: {
    src: () => 'standard',   // economy 在腎、肺等處偏粗（誤差數 mm），直接用 standard 再用較大的誤差上限簡化，品質較可控
    prof: {
      vessel: {absTol: 0.0002, lockBorder: true},
      heart: {absTol: 0.0012},
      organ: {absTol: 0.0012},
      tube: {absTol: 0.0010, lockBorder: true},
      bg: {absTol: 0.0020, ratio: 0.4},
      context: {absTol: 0.0030, ratio: 0.15},
    },
  },
};

/* 顯示用基本色（檢視器可覆蓋）。血管：富氧紅／缺氧藍。 */
const COLORS = {
  'o2:rich': '#d2403a', 'o2:poor': '#3b64c9',
  'visceral.duodenum': '#e6a971', 'visceral.jejunum': '#ee9f93', 'visceral.ileum': '#e0868f',
  'visceral.liver': '#8a3a2e', 'visceral.stomach': '#e7a0a0', 'visceral.pancreas': '#e9c46a', 'lymphoid.spleen': '#7a2f4a',
  'group:large_intestine': '#d8b894', 'group:kidney': '#a4493d', 'group:lung': '#f0b6b6', 'group:heart': '#e07a72',
  'group:aortic_valve': '#f2e6c9', 'muscular.diaphragm': '#b5544a', 'regions.torso_surface': '#d9a58a',
};
const colorOf = s => {
  if (s.kind === 'artery' || s.kind === 'vein') return COLORS['o2:' + s.o2];
  if (s.id === cv('left_atrium') || s.id === cv('left_ventricle')) return '#e0605a';
  if (s.id === cv('right_atrium') || s.id === cv('right_ventricle')) return '#6a85d8';
  return COLORS[s.id] || COLORS['group:' + s.group] || '#c9b8a8';
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
};

/* ───────────────────────── 圖論小工具（切腸管、量血管長度） ───────────────────────── */
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
}

/**
 * 把「空腸」曲管（一條開口圓管）依管腔長度切成兩段。
 * 起點端 = 離十二指腸最近的開口環（十二指腸空腸曲）；沿管面做 Dijkstra 得到「離起點的距離」場 f，
 * 輕微平滑後在 f = frac × 全長 處用等值線切開（切口兩側共用同一圈頂點，不留縫）。
 * 回傳 {lower: 近端(含起點), upper: 遠端, info}
 */
function splitTube(g, refPos, frac) {
  const G = buildGraph(g.pos, g.idx), nV = g.pos.length / 3;
  const loops = boundaryLoops(G);
  if (loops.length !== 2) throw new Error('腸管預期有 2 個開口環，實際 ' + loops.length);
  const dRef = loop => Math.min(...loop.map(c => { let m = Infinity; for (let i = 0; i < refPos.length; i += 3) m = Math.min(m, Math.hypot(G.cp[3 * c] - refPos[i], G.cp[3 * c + 1] - refPos[i + 1], G.cp[3 * c + 2] - refPos[i + 2])); return m; }));
  const [startLoop, endLoop] = dRef(loops[0]) <= dRef(loops[1]) ? [loops[0], loops[1]] : [loops[1], loops[0]];
  const d = dijkstra(G, startLoop);
  let f = Float64Array.from(d);
  for (let it = 0; it < 8; it++) {            // 平滑：消除環與環之間的抖動
    const nf = new Float64Array(G.nC);
    for (let u = 0; u < G.nC; u++) { let s = 0, n = 0; for (let e = G.off[u]; e < G.off[u + 1]; e++) { s += f[G.nbr[e]]; n++; } nf[u] = n ? 0.5 * f[u] + 0.5 * s / n : f[u]; }
    f = nf;
  }
  const L = endLoop.reduce((a, c) => a + d[c], 0) / endLoop.length, s = frac * L;
  const vf = v => f[G.canon[v]];
  const side = [{P: [], N: [], I: [], map: new Map()}, {P: [], N: [], I: [], map: new Map()}];
  const cutCache = new Map();
  const pushV = (k, ref) => {
    const sd = side[k]; const key = ref.t === 'o' ? 'o' + ref.i : 'c' + ref.a + '_' + ref.b;
    let r = sd.map.get(key); if (r !== undefined) return r;
    r = sd.P.length / 3; sd.map.set(key, r);
    if (ref.t === 'o') { sd.P.push(g.pos[3 * ref.i], g.pos[3 * ref.i + 1], g.pos[3 * ref.i + 2]); sd.N.push(g.nrm[3 * ref.i], g.nrm[3 * ref.i + 1], g.nrm[3 * ref.i + 2]); }
    else {
      let c = cutCache.get(key);
      if (!c) {
        const {a, b} = ref, t = (s - vf(a)) / (vf(b) - vf(a)), p = [], n = [];
        for (let q = 0; q < 3; q++) { p.push(g.pos[3 * a + q] + t * (g.pos[3 * b + q] - g.pos[3 * a + q])); n.push(g.nrm[3 * a + q] + t * (g.nrm[3 * b + q] - g.nrm[3 * a + q])); }
        const nl = Math.hypot(...n) || 1; c = {p, n: n.map(x => x / nl)}; cutCache.set(key, c);
      }
      sd.P.push(...c.p); sd.N.push(...c.n);
    }
    return r;
  };
  const fan = (k, poly) => { for (let j = 1; j + 1 < poly.length; j++) side[k].I.push(pushV(k, poly[0]), pushV(k, poly[j]), pushV(k, poly[j + 1])); };
  for (let t = 0; t < g.idx.length; t += 3) {
    const vs3 = [g.idx[t], g.idx[t + 1], g.idx[t + 2]], below = vs3.map(v => vf(v) <= s);
    if (below.every(Boolean)) { fan(0, vs3.map(i => ({t: 'o', i}))); continue; }
    if (!below.some(Boolean)) { fan(1, vs3.map(i => ({t: 'o', i}))); continue; }
    const lo = [], hi = [];
    for (let k = 0; k < 3; k++) {
      const cur = vs3[k], nxt = vs3[(k + 1) % 3], cb = below[k], nb = below[(k + 1) % 3];
      (cb ? lo : hi).push({t: 'o', i: cur});
      if (cb !== nb) { const cut = {t: 'c', a: Math.min(cur, nxt), b: Math.max(cur, nxt)}; lo.push(cut); hi.push(cut); }
    }
    fan(0, lo); fan(1, hi);
  }
  const mk = (id, sd) => ({id, pos: Float32Array.from(sd.P), nrm: Float32Array.from(sd.N), idx: Uint32Array.from(sd.I)});
  const lower = mk(g.id, side[0]), upper = mk('visceral.ileum', side[1]);
  const cl = components(buildGraph(lower.pos, lower.idx)), cu = components(buildGraph(upper.pos, upper.idx));
  if (cl !== 1 || cu !== 1) throw new Error(`切腸管後連通塊數不是 1：近端 ${cl}、遠端 ${cu}`);
  return {lower, upper, info: {axisLength: L, cutAt: s, frac, tris: [lower.idx.length / 3, upper.idx.length / 3]}};
}

/* ───────────────────────── weld + simplify（gltf-transform；逐結構一個小 Document） ───────────────────────── */
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

/* ───────────────────────── 建立各變體的幾何 ───────────────────────── */
async function buildVariant(name) {
  const cfg = LOD[name], out = [], log = [];
  let split = null;
  const torsoIds = [...TORSO_GROUPS.flatMap(descendants), ...TORSO_EXTRA];
  for (const s of SEL) {
    const q = cfg.src(s.prof), pr = cfg.prof[s.prof];
    let g;
    if (s.derived === 'split_small_intestine') {
      if (!split) {
        const base = await getGeom(vs('jejunum'), q), duo = await getGeom(vs('duodenum'), q);
        split = splitTube(base, duo.pos, 2 / 5);
        log.push(`  [${name}] 小腸切分：軸長 ${split.info.axisLength.toFixed(3)} m，切在 ${(split.info.frac * 100).toFixed(0)}%，三角形 近端 ${split.info.tris[0]} / 遠端 ${split.info.tris[1]}`);
      }
      g = s.id === vs('jejunum') ? split.lower : split.upper;
    } else if (s.derived === 'merge_regions') {
      g = concatGeoms(s.id, await Promise.all(torsoIds.map(id => getGeom(id, q))));
    } else g = await getGeom(s.id, q);
    const srcTris = g.idx.length / 3, srcComp = components(buildGraph(g.pos, g.idx));
    const r = await weldSimplify(g, pr), comp = components(buildGraph(r.pos, r.idx));
    r.meta = s; r.srcTris = srcTris; r.src = q;
    if (comp !== srcComp) log.push(`  !! [${name}] ${s.id} 簡化後連通塊數 ${srcComp} → ${comp}`);
    out.push(r);
  }
  return {geoms: out, log};
}

/* ───────────────────────── 組 glb 並寫檔 ───────────────────────── */
const ATTR_ZANATOMY = '“Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas.';
const ATTR_HRA = 'Browne K., Schlehlein H., “3D Reference Organ for Kidney, Male, Left v1.3” (doi:10.48539/HBM759.JKKF.434) and “… Right v1.3” (doi:10.48539/HBM364.QTSC.334); “3D Reference Organ for Ureter, Male, Left v1.2” (doi:10.48539/HBM434.VLQJ.299) and “… Right v1.2” (doi:10.48539/HBM852.SVFJ.388); Human Reference Atlas, CC BY 4.0. Adapted for Svitylo 3D Anatomy Atlas.';  // 與 ATTRIBUTION.md 逐字相同（輸尿管此場景沒用到，但原句整段保留）
async function writeGlb(file, geoms, variant) {
  const doc = new Document(), buf = doc.createBuffer(), scene = doc.createScene('si_scene_v1');
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
  asset.generator = 'physical-boys tools/anatomy/extract_si_scene.mjs (glTF-Transform)';
  asset.copyright = ATTR_ZANATOMY + ' Kidneys: ' + ATTR_HRA + ' Modified (selected, merged, split, simplified, quantised). Licence of this file: CC BY-SA 4.0. See sources.md.';
  doc.getRoot().setExtras({
    dataset: `${manifest.title.en} ${manifest.model} release ${manifest.version}`, upstream: manifest.source.repository, upstreamRevision: manifest.source.revision,
    licence: 'CC-BY-SA-4.0 (kidneys: CC-BY-4.0)', units: 'm', up: '+Y', front: '+Z', variant,
    note: 'Node names are dataset structure ids. Positions are quantised: node translation/scale restore world coordinates (metres).',
  });
  doc.setLogger(new Logger(Logger.Verbosity.WARN));
  await doc.transform(prune(), meshopt({encoder: MeshoptEncoder, level: 'high', quantizePosition: 16}));
  fs.mkdirSync(path.dirname(file), {recursive: true});
  await ioWrite.write(file, doc);
  return fs.statSync(file).size;
}

/* ───────────────────────── 驗證：重讀 glb ───────────────────────── */
async function readBack(file) {
  const doc = await ioRead.read(file), res = new Map();
  for (const n of doc.getRoot().listNodes()) {
    const m = n.getMesh(); if (!m) continue;
    const T = n.getTranslation(), S = n.getScale(), prims = m.listPrimitives();
    let pos = [], idx = [], off = 0;
    for (const p of prims) {
      const pa = p.getAttribute('POSITION'), e = [0, 0, 0];
      for (let i = 0; i < pa.getCount(); i++) { pa.getElement(i, e); pos.push(e[0] * S[0] + T[0], e[1] * S[1] + T[1], e[2] * S[2] + T[2]); }
      const ia = p.getIndices(); for (let i = 0; i < ia.getCount(); i++) idx.push(ia.getScalar(i) + off);
      off += pa.getCount();
    }
    res.set(n.getName(), {id: n.getName(), pos: Float32Array.from(pos), idx: Uint32Array.from(idx), prims: prims.length, mesh: m.getName(), T, S});
  }
  return {doc, res};
}
function medialLength(g, originPos) {
  // 以「離腹主動脈最近的開口端」當起點，沿管面最遠處當終點（近似中心線長度）；另回傳端點直線距離
  const G = buildGraph(g.pos, g.idx), loops = boundaryLoops(G);
  const dd = loop => Math.min(...loop.map(c => { let m = Infinity; for (let i = 0; i < originPos.length; i += 3) m = Math.min(m, Math.hypot(G.cp[3 * c] - originPos[i], G.cp[3 * c + 1] - originPos[i + 1], G.cp[3 * c + 2] - originPos[i + 2])); return m; }));
  let best = loops[0], bd = Infinity; for (const l of loops) { const v = dd(l); if (v < bd) { bd = v; best = l; } }
  const d = dijkstra(G, best); let far = 0; for (let i = 0; i < G.nC; i++) if (Number.isFinite(d[i]) && d[i] > d[far]) far = i;
  const c0 = best.reduce((a, c) => [a[0] + G.cp[3 * c] / best.length, a[1] + G.cp[3 * c + 1] / best.length, a[2] + G.cp[3 * c + 2] / best.length], [0, 0, 0]);
  return {geodesic: d[far], straight: Math.hypot(G.cp[3 * far] - c0[0], G.cp[3 * far + 1] - c0[1], G.cp[3 * far + 2] - c0[2]), gapToAorta: bd, origin: c0, end: [G.cp[3 * far], G.cp[3 * far + 1], G.cp[3 * far + 2]]};
}
async function verify(file, label) {
  const {res} = await readBack(file);
  console.log(`\n=== 驗證 ${label}：${path.basename(file)}（${(fs.statSync(file).size / 1048576).toFixed(2)} MB）===`);
  const want = SEL.map(s => s.id), missing = want.filter(id => !res.has(id)), extra = [...res.keys()].filter(id => !want.includes(id));
  let total = 0, emptyN = 0; const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const s of SEL) {
    const r = res.get(s.id); if (!r) continue;
    const tri = r.idx.length / 3; total += tri; if (!tri || !r.pos.length) emptyN++;
    const st = stats(r); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], st.bbox.min[k]); mx[k] = Math.max(mx[k], st.bbox.max[k]); }
    if (flag('--list')) console.log('  ' + s.id.padEnd(62) + String(tri).padStart(6) + ' tri  prim=' + r.prims);
  }
  console.log(`  node 數 ${res.size}／預期 ${want.length}；缺少 ${missing.length ? missing.join(',') : '無'}；多出 ${extra.length ? extra.join(',') : '無'}；空 mesh ${emptyN}；三角形合計 ${total}`);
  console.log(`  整體 bbox(m)：min [${mn.map(v => v.toFixed(3))}]  max [${mx.map(v => v.toFixed(3))}]  尺寸 [${mx.map((v, k) => (v - mn[k]).toFixed(3))}]`);
  const sma = res.get(cv('superior_mesenteric_artery')), aorta = res.get(cv('abdominal_aorta'));
  if (sma && aorta) {
    const m = medialLength(sma, aorta.pos);
    console.log(`  SMA 長度：沿管面最遠處 ${(m.geodesic * 100).toFixed(1)} cm、起迄直線 ${(m.straight * 100).toFixed(1)} cm（起點離腹主動脈 ${(m.gapToAorta * 1000).toFixed(1)} mm，起點 [${m.origin.map(v => v.toFixed(3))}] → 終點 [${m.end.map(v => v.toFixed(3))}]）`);
  }
  return res;
}

/* ───────────────────────── 主流程 ───────────────────────── */
function checkAttribution() {
  const t = fs.readFileSync(path.join(DATA, 'ATTRIBUTION.md'), 'utf8');
  for (const [n, s] of [['Z-Anatomy', ATTR_ZANATOMY], ['HRA kidney', ATTR_HRA]]) if (!t.includes(s)) console.warn(`!! ATTRIBUTION.md 的 ${n} 署名文字與腳本內建不同，請人工比對後更新 ATTR_*`);
}
const fullPath = path.join(OUT, 'si_scene_v1.glb'), litePath = path.join(OUT, 'si_scene_v1_lite.glb'), jsonPath = path.join(OUT, 'si_parts_v1.json');
if (!flag('--verify-only')) {
  console.log(`資料集：${manifest.model} ${manifest.version}，來源 ${manifest.source.repository} @ ${manifest.source.revision}`);
  checkAttribution();
  const missingIds = SEL.filter(s => !s.derived && !byId.get(s.id)?.meshes).map(s => s.id);
  if (missingIds.length) throw new Error('manifest 找不到：' + missingIds.join(', '));
  const full = await buildVariant('full'); full.log.forEach(l => console.log(l));
  const lite = await buildVariant('lite'); lite.log.forEach(l => console.log(l));
  const sizeFull = await writeGlb(fullPath, full.geoms, 'full');
  const sizeLite = await writeGlb(litePath, lite.geoms, 'lite');
  console.log(`寫出 ${fullPath}  ${(sizeFull / 1048576).toFixed(2)} MB\n寫出 ${litePath}  ${(sizeLite / 1048576).toFixed(2)} MB`);
  // si_parts_v1.json（三角形數、bbox、centroid 取自「完整版」輸出幾何）
  const liteBy = new Map(lite.geoms.map(g => [g.meta.id, g]));
  const torsoIds = [...TORSO_GROUPS.flatMap(descendants), ...TORSO_EXTRA];
  const parts = full.geoms.map(g => {
    const s = g.meta, st = stats(g), m = byId.get(s.id);
    let en = s.en || enNames[s.id]?.name; if (s.id === vs('ileum')) en = 'Ileum'; if (s.id === 'regions.torso_surface') en = 'Torso surface (merged body regions)';
    if (m?.side && en && !/\b(left|right)\b/i.test(en)) en = (m.side === 'left' ? 'Left ' : 'Right ') + en.charAt(0).toLowerCase() + en.slice(1);
    const lic = s.derived === 'split_small_intestine' ? licenseOf.get('z-anatomy') : licenseOf.get(m?.asset) || licenseOf.get('z-anatomy');
    const e = {id: s.id, en, zh: s.zh, kind: s.kind, system: m?.system || s.sys, organ_system: s.os, group: s.group || null};
    if (s.o2) e.o2 = s.o2;
    if (s.background) e.background = true;
    Object.assign(e, {triangles: st.triangles, triangles_lite: stats(liteBy.get(s.id)).triangles, bbox: st.bbox, centroid: st.centroid, license: lic});
    if (s.zhReview) e.zh_review = true;
    if (s.derived) { e.derived = s.derived; if (s.derived === 'merge_regions') e.merged_from = torsoIds; }
    if (s.note) e.note = s.note;
    return e;
  });
  fs.writeFileSync(jsonPath, '[\n' + parts.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n');
  console.log(`寫出 ${jsonPath}（${parts.length} 筆；zh_review ${parts.filter(p => p.zh_review).length} 筆）`);
}
await verify(fullPath, '完整版'); await verify(litePath, '輕量版');
