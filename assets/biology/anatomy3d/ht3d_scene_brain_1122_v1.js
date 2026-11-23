/* ht3d_scene_brain_1122_v1.js
 * 3D 醫學版血液循環｜腦部：組織細胞（血液怎麼送到腦、在腦裡和細胞交換物質、再回到心臟）的「資料與步驟」。
 * 核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_lung_1122_v1.js。這個檔只放資料，不放繪圖程式。
 *
 * 路線：左心室 → 升主動脈 → 主動脈弓 → 左頸總動脈（右側：頭臂動脈幹 → 右頸總動脈）→ 頸內動脈；鎖骨下動脈 → 椎動脈 → 基底動脈
 *       → 大腦動脈環（前、後交通動脈）→ 大腦前／中／後動脈 → 腦表面的小動脈（示意）→ 灰質裡的微血管（示意）→ 小靜脈 → 腦靜脈（示意）
 *       → 上矢狀竇 → 橫竇 → 乙狀竇 → 內頸靜脈 →（＋鎖骨下靜脈）頭臂靜脈 → 上腔靜脈 → 右心房 → 右心室（接小循環）。
 * 模型：brain_scene_v1.glb（tools/anatomy/extract_brain_scene.mjs；腦回依「葉」合併、小腦、腦幹、頭頸與胸部體表外形）。
 * 中心線：brain_centerlines_v1.json（tools/anatomy/build_brain_centerlines.py）。同軸一路延續的血管合成一段（兩段同軸相接時，
 *   兩根管的環對不齊，半透明時看得到一圈接縫），各部分在段內的位置（弧長比例）寫在 JSON 的 named.parts：
 *   aorta（升主動脈＋主動脈弓＋胸主動脈）、lcar（左頸總動脈→頸內動脈→大腦中動脈 M1→島葉支→腦表面小動脈→床 F 的軟腦膜小動脈）、
 *   rcar（頭臂動脈幹→右頸總→頸內→大腦中→床 B1）、rvb（右椎動脈→基底動脈→右大腦後動脈→床 B3）、lpcab（左大腦後動脈→床 B2）、
 *   lmca2／rmca2（大腦中動脈第二條島葉支→床 B4／B5）、rdrain（上矢狀竇→右橫竇→右乙狀竇→右內頸靜脈→右頭臂靜脈→上腔靜脈）、
 *   ldrain（左橫竇→左乙狀竇→左內頸靜脈→左頭臂靜脈）；側支（lsa、rsa、lva、laca、raca、lpcom、rpcom、acom、lscv、rscv、lpcab、lmca2、rmca2、ldrain）
 *   從母管中心線分出或併入，用 tubeRange 只畫母管壁外的部分。以下是合併前各部分的來源：
 *   mesh 段（中心線與半徑取自網格，平滑＋單調化）：aorta（升主動脈＋主動脈弓到左頸總動脈起點）、aorta_d、bct、rcca／lcca、rsa／lsa、rica／lica、
 *     rva／lva、ba、raca／laca、rm1／lm1、rm2a／rm2b／lm2a／lm2b（大腦中動脈島葉支）、rpca／lpca、rpcom／lpcom、acom、
 *     sss、rts／lts、rsig／lsig、rijv／lijv（含乙狀竇到內頸靜脈的補段）、rscv／lscv、rbcv／lbcv、svc
 *   示意段（schematic）：六個皮質微血管床 F（放大的床：左頂葉外側面，大腦中動脈供血）、B1（右頂葉）、B4／B5（左右額葉）、B2／B3（左右枕葉，大腦後動脈供血）
 *     每床：<床>pa（腦表面的小動脈，A* 找路貼著腦表面）→ <床>pa_in → <床>a<i>（穿入灰質的小動脈）→ <床>c<i><r|l><層>／<床>u<i>（微血管）
 *     → <床>v<j>（上行小靜脈）→ <床>pv_in → <床>pv（腦靜脈，接上矢狀竇或橫竇）；F 另有 Fx<k>（交叉連通支，只畫管不放血球）。
 *     心腔內：lv_out、ra_in、ra_rv（不畫管，只給血球走）。
 *   例：追蹤的紅血球 ＝ ao_tr（左心室→主動脈到左頸總動脈起點，不畫管）→ lcar → Fa6 → Fu6 → Fv5 → Fpv → rdrain → ra_in → ra_rv
 * 座標：公尺；+Y 向上、+Z 向前（臉）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述（查證出處見 sources.md「腦場景」）。src：EXISTING＝現有頁面原句；NEW＝新增（待老師審）。
 * 血色：全站共識不畫藍色血液（充氧血＝鮮紅、缺氧血＝暗紅）；微血管 o2:'rich>poor'（沿路由鮮紅變暗紅）。
 */

import { BEST_SCENE, BEST_GROUPS, BEST_BASE, bestFloor } from './ht3d_preset_1122_v1.js?v=20261123-f2';

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表（只放有把握的；不確定的用泛稱，原名記在 brain_parts_v1.json 的 zh_review，畫面不顯示） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  'cardiovascular.right_ventricle': { zh: '右心室', en: 'Right ventricle' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  aortic_arch: { zh: '主動脈弓', en: 'Aortic arch' },
  carotid: { zh: '頸動脈', en: 'Carotid artery' },                    // 泛稱（頸總動脈／頸內動脈的臺灣用語未逐一核對，見 sources.md）
  vertebral: { zh: '椎動脈', en: 'Vertebral artery' },
  basilar: { zh: '基底動脈', en: 'Basilar artery' },
  circle: { zh: '大腦動脈環', en: 'Cerebral arterial circle' },
  aca: { zh: '大腦前動脈', en: 'Anterior cerebral artery' },
  mca: { zh: '大腦中動脈', en: 'Middle cerebral artery' },
  pca: { zh: '大腦後動脈', en: 'Posterior cerebral artery' },
  cerebrum: { zh: '大腦', en: 'Cerebrum' },
  cerebellum: { zh: '小腦', en: 'Cerebellum' },
  brainstem: { zh: '腦幹', en: 'Brainstem' },
  sss: { zh: '上矢狀竇', en: 'Superior sagittal sinus' },
  ts: { zh: '橫竇', en: 'Transverse sinus' },
  sig: { zh: '乙狀竇', en: 'Sigmoid sinus' },
  jugular: { zh: '頸靜脈', en: 'Jugular vein' },                      // 泛稱（內頸靜脈／頸內靜脈兩種寫法，見 sources.md）
  svc: { zh: '上腔靜脈', en: 'Superior vena cava' },
  // 泛稱／示意（程式生成的部分）
  pial_art: { zh: '腦表面的小動脈（示意）', en: 'Small artery on the brain surface (schematic)' },
  capillaries: { zh: '微血管（示意）', en: 'Capillaries (schematic)' },
  venules: { zh: '小靜脈（示意）', en: 'Venules (schematic)' },
  cerebral_vein: { zh: '腦靜脈（示意）', en: 'Cerebral vein (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(['cardiovascular.left_ventricle', 'cardiovascular.right_atrium', 'cardiovascular.right_ventricle', 'aorta', 'aortic_arch',
  'carotid', 'vertebral', 'basilar', 'circle', 'aca', 'mca', 'pca', 'cerebrum', 'cerebellum', 'brainstem', 'sss', 'ts', 'sig', 'jugular', 'svc',
  'pial_art', 'capillaries', 'venules', 'cerebral_vein']);

/* ---------- 結構分組（依 brain_parts_v1.json 的 id） ---------- */
const CV = 'cardiovascular.';
const HEART = [CV + 'left_atrium', CV + 'left_ventricle', CV + 'right_atrium', CV + 'right_ventricle'];
const CEREBRUM = ['brain.frontal_lobe', 'brain.parietal_lobe', 'brain.temporal_lobe', 'brain.occipital_lobe', 'brain.other_cortex'];
const AORTA = [CV + 'ascending_aorta', CV + 'aortic_arch', CV + 'thoracic_aorta'];
const NECK_ART = [CV + 'brachiocephalic_trunk', CV + 'right_common_carotid_artery', CV + 'left_common_carotid_artery', CV + 'right_subclavian_artery', CV + 'left_subclavian_artery',
  CV + 'internal_carotid_artery_r', CV + 'internal_carotid_artery_l', CV + 'vertebral_artery_r', CV + 'vertebral_artery_l'];
const BRAIN_ART = [CV + 'basilar_artery', CV + 'anterior_communicating_artery', CV + 'posterior_communicating_artery_r', CV + 'posterior_communicating_artery_l',
  CV + 'anterior_cerebral_artery_r', CV + 'anterior_cerebral_artery_l', CV + 'middle_cerebral_artery_m1_segment_r', CV + 'middle_cerebral_artery_m1_segment_l',
  CV + 'insular_branches_of_middle_cerebral_artery_m2_r', CV + 'insular_branches_of_middle_cerebral_artery_m2_segment_l', CV + 'posterior_cerebral_artery_r', CV + 'posterior_cerebral_artery_l'];
const SINUS = [CV + 'superior_sagittal_sinus', CV + 'transverse_sinus_r', CV + 'transverse_sinus_l', CV + 'sigmoid_sinus_r', CV + 'sigmoid_sinus_l'];
const NECK_VEIN = [CV + 'internal_jugular_vein_r', CV + 'internal_jugular_vein_l', CV + 'right_subclavian_vein', CV + 'left_subclavian_vein',
  CV + 'right_brachiocephalic_vein', CV + 'left_brachiocephalic_vein', CV + 'superior_vena_cava'];
export const GROUPS = Object.freeze({
  torso: ['regions.thorax_surface'], head: ['regions.head_neck_surface'], heart: HEART,
  cerebrum: CEREBRUM, cerebellum: ['brain.cerebellum'], brainstem: ['brain.brainstem'],
  aorta: AORTA, arteries: [...NECK_ART, ...BRAIN_ART], focusArt: ['@focusArt'],
  veins: [...SINUS, ...NECK_VEIN], focusVein: ['@focusVein'],
  // 程式生成的示意微血管（第一個元素是合併後 mesh 的結構 id）
  genCap: ['@bcap'], genCapF: ['@bcapF']
});
export const MATERIAL = Object.freeze({
  heart: { color: '#a5333b', sheen: '#e08b8b', rough: 0.5 },
  // 腦的外框色調暗一點：lit:1 時核心會把外框加亮約 6.5 倍（半透明的腦回層層疊起來，太亮會變成一團白霧）
  cerebrum: { color: '#c79a8e', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  cerebellum: { color: '#c08f82', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  brainstem: { color: '#bf9684', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  head: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  torso: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#5e1219', rim: '#c4545a', rough: 0.36 }
});
/* 預設透明度。血管透明度一律 < 0.6（≥ 0.6 會開啟寫深度，把裡面的血球擋住）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.03, head: 0.05, heart: 0.3, cerebrum: 0.05, cerebellum: 0.05, brainstem: 0.06, otherArteries: 0.1, otherVeins: 0.1, otherOrgans: 0.05,
  aorta: 0.35, arteries: 0.5, focusArt: 0.5, veins: 0.45, focusVein: 0.5,
  genCap: 0.4, genCapF: 0.5
});

/* ---------- 血流（公尺／秒，教學速度，不是真實速度） ---------- */
export const HEART_PERIOD = 1.0;
export const FLOW = Object.freeze({
  lv_out: { type: 'pulse', v: 0.07, density: 240 },
  aorta: { type: 'pulse', v: 0.11, density: 360 },
  aorta_d: { type: 'pulse', v: 0.11, density: 300, fadeEnd: true },
  subcl: { type: 'pulse', v: 0.07, density: 260, fadeEnd: true },
  carotid: { type: 'pulse', v: 0.08, density: 200 },
  vert: { type: 'pulse', v: 0.06, density: 200 },
  cerebral: { type: 'pulse', v: 0.035, density: 200 },
  pial: { type: 'pulseSoft', v: 0.018, density: 220 },
  arteriole: { type: 'slow', v: 0.004, density: 0, spacing: 0.0005, singleFile: true },
  cap: { type: 'slow', v: 0.0025, density: 0, spacing: 0.0006, singleFile: true },
  venule: { type: 'slow', v: 0.004, density: 0, spacing: 0.0005, singleFile: true },
  cvein: { type: 'steady', v: 0.014, density: 240 },
  drain: { type: 'steady', v: 0.03, density: 160 },
  scv: { type: 'steady', v: 0.03, density: 200, fadeStart: true },
  chamber: { type: 'steady', v: 0.04, density: 200 }
});
export function flowKey(seg) {
  if (seg === 'ao_tr') return 'aorta';
  if (seg === 'lsa' || seg === 'rsa') return 'subcl';
  if (seg === 'lcar' || seg === 'rcar') return 'carotid';
  if (seg === 'rvb' || seg === 'lva') return 'vert';
  if (/^([lr]aca|lpcab|lmca2|rmca2)$/.test(seg)) return 'cerebral';
  if (/^(F|B\d)a\d/.test(seg)) return 'arteriole';
  if (/^(F|B\d)[cux]\d/.test(seg)) return 'cap';
  if (/^(F|B\d)v\d/.test(seg)) return 'venule';
  if (/^(F|B\d)pv$/.test(seg)) return 'cvein';
  if (seg === 'rdrain' || seg === 'ldrain') return 'drain';
  if (/^[lr]scv$/.test(seg)) return 'scv';
  if (/^(ra_in|ra_rv)$/.test(seg)) return 'chamber';
  return seg;
}
/* 生成的示意管要畫成哪一組：只有微血管與交叉連通支走這裡（頂點色沿路由鮮紅變暗紅）；小動脈、小靜脈、腦表面血管由 replaceMesh 畫 */
export function tubeGroup(seg) {
  if (/^F[cux]\d/.test(seg)) return 'genCapF';
  if (/^B\d[cux]\d/.test(seg)) return 'genCap';
  return null;
}
export const LUMEN_MESH = Object.freeze({});

/* ---------- 步驟 ---------- */
const BG_BEDS = ['B1', 'B2', 'B3', 'B4', 'B5'];
const FC = [0.06589, 1.65196, 0.02976], FN = [0.9853, 0.0247, 0.1693], FE1 = [-0.1275, 0.7658, 0.6303], FE2 = [-0.1141, -0.6426, 0.7577];   // 放大的床 F 的中心、法線、e1、e2（brain_centerlines_v1.json named.focus_*）
const atF = (d, u = 0, v = 0) => [0, 1, 2].map((i) => FC[i] + FN[i] * d + FE1[i] * u + FE2[i] * v);   // d：沿法線離開腦表面；u、v：沿床的兩個方向（公尺）

/* 標籤：key＝NAMES 的 key；at＝錨點；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({   // seg 的 u＝弧長比例（合併段裡各部分的範圍見 JSON named.parts）
  lv: { key: 'cardiovascular.left_ventricle', at: { part: CV + 'left_ventricle', dx: 0.016, dy: -0.012, dz: 0.02 }, side: 'r' },
  arch: { key: 'aortic_arch', at: { seg: 'aorta', u: 0.25 }, side: 'u' },
  carotid: { key: 'carotid', at: { seg: 'lcar', u: 0.18 }, side: 'r' },
  carotidHi: { key: 'carotid', at: { seg: 'lcar', u: 0.45 }, side: 'r' },
  vert: { key: 'vertebral', at: { seg: 'rvb', u: 0.3 }, side: 'l' },
  basilar: { key: 'basilar', at: { seg: 'rvb', u: 0.56 }, side: 'd' },
  circle: { key: 'circle', at: { pos: [0.0, 1.607, 0.072] }, side: 'd' },
  aca: { key: 'aca', at: { seg: 'raca', u: 0.85 }, side: 'u' },
  mca: { key: 'mca', at: { seg: 'lcar', u: 0.72 }, side: 'r' },
  pca: { key: 'pca', at: { seg: 'rvb', u: 0.66 }, side: 'l' },
  cerebrum: { key: 'cerebrum', at: { part: 'brain.parietal_lobe', dx: -0.02, dy: 0.04, dz: 0.0 }, side: 'u' },
  cerebellum: { key: 'cerebellum', at: { part: 'brain.cerebellum', dx: 0.03, dy: -0.01, dz: -0.01 }, side: 'r' },
  pial: { key: 'pial_art', at: { seg: 'lcar', u: 0.94 }, side: 'd' },
  caps: { key: 'capillaries', at: { seg: 'Fc3r1', u: 0.5 }, side: 'u' },
  venules: { key: 'venules', at: { seg: 'Fpv', u: 0.06 }, side: 'u' },
  cvein: { key: 'cerebral_vein', at: { seg: 'Fpv', u: 0.5 }, side: 'r' },
  sss: { key: 'sss', at: { seg: 'rdrain', u: 0.2 }, side: 'u' },
  ts: { key: 'ts', at: { seg: 'rdrain', u: 0.53 }, side: 'l' },
  sig: { key: 'sig', at: { seg: 'rdrain', u: 0.615 }, side: 'l' },
  jugular: { key: 'jugular', at: { seg: 'rdrain', u: 0.76 }, side: 'l' },
  svc: { key: 'svc', at: { seg: 'rdrain', u: 0.975 }, side: 'l' },
  ra: { key: 'cardiovascular.right_atrium', at: { part: CV + 'right_atrium', dx: -0.016, dy: -0.006, dz: 0.012 }, side: 'l' },
  rv: { key: 'cardiovascular.right_ventricle', at: { part: CV + 'right_ventricle', dx: 0.01, dy: -0.016, dz: 0.022 }, side: 'r' }
});

/* 說明文字。函式形式的會在執行時從 HumanTransportExchanges 讀出 2D 原文（確保沿用現有句子，不重抄）。 */
const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.'); // NEW（與腎臟、肺場景同句）
const tissueZone = (X) => X && X.zones.find((q) => q.id === 'tissue');
// 取 2D「組織」原文：中文第 para 段第 zs 句；英文第 para 段第 es 句（可給陣列合併多句，因為中英斷句不一一對應）
const zoneSent = (para, zs, es) => (X) => {
  const z = tissueZone(X); if (!z) return P('', '');
  const zh = z.text[0].split('\n\n')[para].split('。').filter(Boolean), en = z.text[1].split('\n\n')[para].split(/(?<=\.)\s+/).filter(Boolean);
  return P(zh[zs] + '。', [].concat(es).map((i) => en[i]).join(' '));
};

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）。 */
const CAM = {
  chest: { pos: [0.04, 1.37, 0.44], target: [0.01, 1.345, 0.075] },
  heart: { pos: [0.09, 1.36, 0.36], target: [0.02, 1.335, 0.08] },
  neck: { pos: [0.14, 1.47, 0.42], target: [0.01, 1.44, 0.06] },
  headWide: { pos: [0.20, 1.60, 0.50], target: [0.0, 1.57, 0.045] },
  base: { pos: [0.05, 1.47, 0.27], target: [0.0, 1.60, 0.06] },
  lateralL: { pos: [0.33, 1.68, 0.14], target: [0.02, 1.635, 0.035] },
  focusFar: { pos: atF(0.085, -0.004, 0.02), target: FC },
  focusNear: { pos: atF(0.042, -0.003, 0.022), target: atF(-0.001, 0, 0) },     // 斜著看（約 30°），看得到小動脈往灰質裡鑽、微血管分層
  focusClose: { pos: atF(0.031, -0.002, 0.017), target: atF(-0.0012, 0.0005, 0) },
  top: { pos: [0.20, 1.86, 0.16], target: [0.0, 1.64, 0.03] },
  back: { pos: [0.16, 1.70, -0.30], target: [0.01, 1.60, 0.0] },
  neckR: { pos: [-0.26, 1.52, 0.24], target: [-0.03, 1.50, 0.05] },
  chestR: { pos: [-0.10, 1.40, 0.40], target: [-0.01, 1.36, 0.075] },
  heartR: { pos: [-0.10, 1.33, 0.34], target: [0.0, 1.315, 0.085] }
};
const K = (t, name) => ({ t, ...CAM[name] });
// 背景壓低
const BG = { torso: 0.03, head: 0.04 };
const bgBeds = (...pre) => BG_BEDS.flatMap((b) => pre.map((p) => b + p));

export const STEPS = Object.freeze([
  {
    id: 'leave_lv', dur: 10, btn: P('離開左心室：往頭頸', 'Leaving the left ventricle'),
    title: P('① 離開左心室：主動脈弓分出往頭頸的動脈', '① Leaving the left ventricle: arteries rise from the aortic arch'),
    text: [
      { src: 'NEW', p: P('左心室收縮，把充氧血送進主動脈；主動脈弓向上分出幾條動脈，往腦的血主要走左右頸動脈，另有一小部分走椎動脈。', 'The left ventricle pumps oxygen-rich blood into the aorta. Several arteries rise from the aortic arch; blood for the brain travels mainly in the two carotid arteries, and some in the vertebral arteries.') },
      { src: 'NEW', p: P('腦的細胞非常需要氧氣和養分，所以心臟送出的血有相當大一部分流向腦。', 'Brain cells need a great deal of oxygen and nutrients, so a large share of the blood the heart pumps goes to the brain.') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'chest'), K(2.6, 'heart'), K(6.0, 'heart'), K(9.2, 'neck'), K(10, 'neck')],
    style: { ...BG, 'lit.cardiovascular.left_ventricle': 1, 'glow.aorta': 0.6, 'glow.arteries': 0.3, heart: 0.42, 'cardiovascular.left_ventricle': 0.58, aorta: 0.45,
      cerebrum: 0.035, cerebellum: 0.035, brainstem: 0.04, arteries: 0.5, focusArt: 0.12, veins: 0.16, focusVein: 0.1, genCap: 0.12, genCapF: 0.14 },
    flows: ['lv_out', 'aorta', 'lcar', 'rcar', 'lsa', 'rsa'],
    labels: [{ id: 'lv', at: [0.8, 6.4] }, { id: 'arch', at: [2.8, 10] }, { id: 'carotid', at: [6.4, 10] }],
    tracer: { path: ['ao_tr', 'lcar'], from: 0.4, to: 22.9 }   // to > dur：步末停在頸總動脈（lcar 的 20% 處），接第 2 步
  },
  {
    id: 'to_brain', dur: 13, btn: P('頸動脈、椎動脈進入腦', 'Carotid & vertebral arteries'),
    title: P('② 頸動脈、椎動脈進入顱內，連成大腦動脈環', '② Carotid and vertebral arteries enter the skull and form the cerebral arterial circle'),
    text: [
      { src: 'NEW', p: P('頸動脈沿著頸部往上進入顱內；兩條椎動脈從鎖骨下動脈分出，在腦幹前方合成一條基底動脈。', 'The carotid arteries run up the neck into the skull; the two vertebral arteries branch from the subclavian arteries and join in front of the brainstem to form the basilar artery.') },
      { src: 'NEW', p: P('它們在腦的底部由交通動脈連成一圈「大腦動脈環」，再分出大腦前、中、後動脈，沿著腦表面把血送到大腦各處。', 'At the base of the brain, communicating arteries link them into a ring, the cerebral arterial circle, which gives off the anterior, middle and posterior cerebral arteries that carry blood over the brain surface.') },
      { src: 'NEW', p: P('頸部與腦底部的大血管取自解剖模型；腦表面的分支是示意。', 'The large vessels of the neck and the brain base come from the anatomical model; the branches on the brain surface are schematic.') }
    ],
    camera: [K(0, 'neck'), K(3.0, 'headWide'), K(5.2, 'base'), K(8.6, 'base'), K(11.6, 'lateralL'), K(13, 'lateralL')],
    style: { ...BG, 'lit.cerebrum': 0.15, 'lit.cerebellum': 0.15, 'lit.brainstem': 0.15, 'glow.arteries': 0.4, heart: 0.12, aorta: 0.18,
      cerebrum: 0.04, cerebellum: 0.045, brainstem: 0.05, arteries: 0.55, focusArt: 0.45, veins: 0.14, focusVein: 0.14, genCap: 0.28, genCapF: 0.3 },
    flows: ['lcar', 'rcar', 'rvb', 'lva', 'lpcab', 'lmca2', 'rmca2', 'laca', 'raca'],
    labels: [{ id: 'carotidHi', at: [0.4, 5.0] }, { id: 'vert', at: [1.6, 5.0] }, { id: 'basilar', at: [4.6, 8.8] }, { id: 'circle', at: [5.0, 9.4] },
      { id: 'aca', at: [5.6, 9.4] }, { id: 'mca', at: [6.0, 13] }, { id: 'pca', at: [6.4, 9.4] }, { id: 'cerebrum', at: [10.2, 13] }, { id: 'cerebellum', at: [10.6, 13] }],
    tracer: { path: ['lcar'], from: 0, to: 13, startU: 0.2 }   // 從第 1 步停下的地方（lcar 20%）走到 lcar 末端（床 F 最後一條穿入灰質的小動脈入口）
  },
  {
    id: 'capillaries', dur: 14, btn: P('腦的微血管：和細胞交換', 'Brain capillaries: exchange'),
    title: (X) => { const z = tissueZone(X); return z ? P('③ ' + z.title[0], '③ ' + z.title[1]) : P('③ 送到細胞才算完成：養分進去，廢物出來', '③ Delivery to cells: nutrients in, CO₂ out'); },
    text: [
      { src: 'EXISTING', p: zoneSent(0, 1, 2) },
      { src: 'NEW', p: P('腦的微血管壁細胞接得特別緊（血腦屏障），只讓氧氣、葡萄糖等需要的物質通過；微血管裡的血一路由鮮紅（充氧）變成暗紅（缺氧）。', 'The cells of brain capillary walls are joined especially tightly (the blood–brain barrier) and let through needed substances such as oxygen and glucose; along the capillary the blood turns from bright red (oxygen-rich) to dark red (oxygen-poor).') },
      { src: 'NEW', p: P('葡萄糖是腦細胞主要的能量來源，而腦幾乎不能儲存能量：血流一中斷，缺氧的腦細胞很快就會受損。微血管放大很多，是示意。', 'Glucose is the main energy source of brain cells, and the brain can store almost no energy: if blood flow stops, oxygen-starved brain cells are soon damaged. Capillaries are greatly enlarged (schematic).') }
    ],
    camera: [K(0, 'lateralL'), K(2.8, 'focusFar'), K(5.0, 'focusNear'), K(7.4, 'focusClose'), K(14, 'focusClose')],
    style: { ...BG, 'lit.cerebrum': 0.15, 'glow.genCapF': 1, 'glow.focusArt': 0.5, 'glow.focusVein': 0.5, heart: 0.05, aorta: 0.08,
      cerebrum: 0.03, cerebellum: 0.03, brainstem: 0.03, arteries: 0.5, focusArt: 0.55, veins: 0.22, focusVein: 0.55, genCap: 0.3, genCapF: 0.58 },
    flows: ['lcar', 'Fa*', 'Fc*', 'Fu*', 'Fv*', 'Fpv'],
    labels: [{ id: 'pial', at: [3.0, 8.4] }, { id: 'caps', at: [5.2, 8.4] }, { id: 'venules', at: [5.8, 8.4] }],   // 放大窗打開前收起標籤（不壓在放大窗上）
    tracer: { path: ['Fa6', 'Fu6', 'Fv5', 'Fpv'], from: 0.4, to: 106.51 },   // 約 4.3–8.5 秒走過底部的 U 形微血管（看得到鮮紅變暗紅）；to > dur：步末停在小靜脈併入軟腦膜小靜脈之後 1.5 mm，接第 4 步
    window: { kind: 'tissue', open: [8.6, 9.6], focus: { pos: FC }, tag: P('放大：微血管與腦細胞的交換（示意）', 'Enlarged: capillary and brain cells (schematic)') }
  },
  {
    id: 'veins_sinus', dur: 13, btn: P('腦靜脈→靜脈竇→頸靜脈', 'Cerebral veins → sinuses'),
    title: P('④ 腦靜脈 → 硬腦膜靜脈竇 → 頸靜脈', '④ Cerebral veins → dural venous sinuses → jugular vein'),
    text: [
      { src: 'EXISTING', p: zoneSent(1, 0, 0) },
      { src: 'NEW', p: P('微血管匯成小靜脈，再匯成腦表面的靜脈，注入頭顱裡的「硬腦膜靜脈竇」：上矢狀竇沿著頭頂往後走，經橫竇、乙狀竇，接上頸部的頸靜脈（腦靜脈為示意）。', 'Capillaries join into venules and then into veins on the brain surface, which empty into the dural venous sinuses inside the skull: the superior sagittal sinus runs back along the top of the head and continues through the transverse and sigmoid sinuses into the jugular vein in the neck (cerebral veins are schematic).') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'focusClose'), K(2.6, 'focusFar'), K(4.6, 'top'), K(7.0, 'back'), K(10.0, 'back'), K(12.4, 'neckR'), K(13, 'neckR')],
    style: { ...BG, 'lit.cerebrum': 0.15, 'lit.cerebellum': 0.15, 'glow.veins': 1, 'glow.focusVein': 0.6, heart: 0.08, aorta: 0.1,
      cerebrum: 0.04, cerebellum: 0.04, brainstem: 0.04, arteries: 0.2, focusArt: 0.25, veins: 0.58, focusVein: 0.55, genCap: 0.25, genCapF: 0.32 },
    flows: ['Fpv', ...bgBeds('pv'), 'rdrain', 'ldrain'],
    labels: [{ id: 'cvein', at: [0.8, 4.6] }, { id: 'sss', at: [3.6, 9.8] }, { id: 'ts', at: [6.4, 11.6] }, { id: 'sig', at: [7.2, 11.6] }, { id: 'jugular', at: [10.8, 13] }],
    tracer: { path: ['Fpv', 'rdrain'], from: 0.2, to: 18.06, startU: 0.1047 },   // 上矢狀竇約 3–8 秒、匯合處／橫竇 8–10 秒、乙狀竇與頸靜脈 10 秒後；to > dur：步末停在 rdrain 75%（頸靜脈），接第 5 步
    window: { kind: 'tissue', close: [0, 0.9], focus: { pos: FC }, tag: P('放大：微血管與腦細胞的交換（示意）', 'Enlarged: capillary and brain cells (schematic)') }
  },
  {
    id: 'back_to_heart', dur: 11, btn: P('回到右心房，接小循環', 'Back to the right atrium'),
    title: P('⑤ 回到右心房：接上小循環', '⑤ Back to the right atrium: on to the pulmonary circulation'),
    text: [
      { src: 'NEW', p: P('頸靜脈和鎖骨下靜脈匯成頭臂靜脈，左右頭臂靜脈再匯成上腔靜脈，注入右心房。', 'The jugular and subclavian veins join into the brachiocephalic veins, and the left and right brachiocephalic veins join into the superior vena cava, which empties into the right atrium.') },
      { src: 'NEW', p: P('接著血由右心房進入右心室，送到肺換氣（見「肺循環」場景），再回到左心房、左心室——完成一次循環。', 'From the right atrium the blood enters the right ventricle and goes to the lungs for gas exchange (see the pulmonary circulation scene), then returns to the left atrium and ventricle: one full circuit.') },
      { src: 'NEW', p: P('整條路線：左心室 → 主動脈 → 頸動脈、椎動脈 → 腦的微血管 → 腦靜脈 → 靜脈竇 → 頸靜脈 → 上腔靜脈 → 右心房。', 'The whole route: left ventricle → aorta → carotid and vertebral arteries → brain capillaries → cerebral veins → venous sinuses → jugular vein → superior vena cava → right atrium.') }
    ],
    camera: [K(0, 'neckR'), K(3.2, 'chestR'), K(6.6, 'chestR'), K(9.4, 'heartR'), K(11, 'heartR')],
    style: { ...BG, 'lit.heart': 1, 'glow.veins': 1, heart: 0.45, 'cardiovascular.right_atrium': 0.58, 'cardiovascular.right_ventricle': 0.5, aorta: 0.2,
      cerebrum: 0.035, cerebellum: 0.035, brainstem: 0.04, arteries: 0.2, focusArt: 0.12, veins: 0.55, focusVein: 0.15, genCap: 0.12, genCapF: 0.14 },
    flows: ['rdrain', 'ldrain', 'lscv', 'rscv', 'ra_in', 'ra_rv'],
    labels: [{ id: 'jugular', at: [0, 3.0] }, { id: 'svc', at: [3.0, 9.0] }, { id: 'ra', at: [6.6, 11] }, { id: 'rv', at: [8.4, 11] }],
    tracer: { path: ['rdrain', 'ra_in', 'ra_rv'], from: 0, to: 10.6, startU: 0.75 }
  }
]);

export const SCENE = Object.freeze({
  ...BEST_SCENE,   // 全部循環共用的最佳模板（ht3d_preset_1122_v1.js）：全身血管底圖、血管底線、亮度對比、血球同色發光

  id: 'brain', name: P('腦部：組織細胞', 'Brain: tissue cells'),
  glb: 'assets/biology/anatomy3d/brain_scene_v1.glb?v=20261123-f3', glbLite: 'assets/biology/anatomy3d/brain_scene_v1_lite.glb?v=20261123-f3',
  parts: 'assets/biology/anatomy3d/brain_parts_v1.json?v=20261123-f3', centerlines: 'assets/biology/anatomy3d/brain_centerlines_v1.json?v=20261123-h5f3',
  names: NAMES, labelAllow: LABEL_ALLOW, groups: { ...GROUPS, ...BEST_GROUPS }, material: MATERIAL, baseStyle: { ...BASE_STYLE, ...BEST_BASE, bodyArtHead: 0, bodyVeinHead: 0 }, flow: FLOW, flowKey, tubeGroup,   // 腦場景自己畫頭頸血管（JSON 中心線），全身底圖的頭頸那組不畫（baseStyle 設 0），免得兩層重疊
  // 資料集的血管網格一律不畫，改畫單層、半徑漸變的管（半徑取自網格並平滑、單調化；網格估計值見 sources.md「腦場景」）；腦表面的血管、小動脈、小靜脈（示意）併入同材質的組
  replaceMesh: {
    aorta: ['aorta'], arteries: ['lcar', 'rcar', 'rvb', 'lva', 'lsa', 'rsa', 'laca', 'raca', 'lpcab', 'lmca2', 'rmca2', 'lpcom', 'rpcom', 'acom', ...bgBeds('a*')],
    focusArt: ['Fa*'],
    veins: ['rdrain', 'ldrain', 'lscv', 'rscv', ...bgBeds('v*', 'pv')], focusVein: ['Fv*', 'Fpv']
  },
  replaceStyle: {
    aorta: { kind: 'artery', radial: [24, 14] }, arteries: { kind: 'artery', radial: [12, 8], step: 0.0009 }, focusArt: { kind: 'artery', radial: [12, 8], step: 0.0003 },
    veins: { kind: 'vein', radial: [16, 10], step: 0.0011 }, focusVein: { kind: 'vein', radial: [12, 8], step: 0.0003 }
  },
  vesselFloor: bestFloor({ genCap: 0, genCapF: 0, focusArt: 0, focusVein: 0, bodyArtHead: 0, bodyVeinHead: 0 }),   // 放大的微血管床只在自己那一步出現，其餘血管（含全身血管底圖）一直畫在畫面上
  smoothTubes: true,     // 小血管用變半徑管；接點兩端不封口的段在 JSON 寫 capStart／capEnd: false
  genTubeRange: true,    // 微血管從小動脈中心線分出、併入小靜脈中心線：照 JSON 的 tubeRange 只畫母管壁外的部分（核心新增的選用開關）
  cellMin: 0.00018,      // 腦的微血管很細（放大後半徑 0.12 mm）：血球最小直徑降到 0.18 mm，才不會擠出管外（核心新增的選用開關）
  lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [],
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('腦表面血管、微血管為示意｜放大', 'Brain-surface vessels, capillaries: schematic, enlarged'),   // 手機上這行會壓到畫面，保持短
  credit: P('3D 模型：Z-Anatomy／BodyParts3D／Brain for Blender，CC BY-SA', '3D model: Z-Anatomy / BodyParts3D / Brain for Blender, CC BY-SA'),
  schematic: P('腦場景的小血管為示意：腦表面的小動脈與腦靜脈、灰質裡的小動脈、微血管、小靜脈，以及乙狀竇到頸靜脈之間幾公釐的補段，是程式生成的示意，不是解剖資料；小血管口徑與血球都放大很多（真實微血管直徑只有幾微米），速度為教學示意。主動脈、頸部動脈、椎動脈、基底動脈、大腦動脈環與大腦前／中／後動脈、硬腦膜靜脈竇、頸部靜脈的中心線與半徑由網格自動估算並平滑。頸外動脈、小腦的動脈、深部的靜脈（下矢狀竇、直竇）沒有畫。',
    'Small vessels in the brain scene are schematic: the small arteries and cerebral veins on the brain surface, the arterioles, capillaries and venules in the grey matter and a few-millimetre link from the sigmoid sinus to the jugular vein are generated diagrams, not anatomical data; small calibres and cells are greatly enlarged (real capillaries are a few micrometres wide) and speeds are illustrative. Centrelines and radii of the aorta, neck arteries, vertebral and basilar arteries, the cerebral arterial circle with the anterior, middle and posterior cerebral arteries, the dural venous sinuses and the neck veins are estimated automatically from the meshes and smoothed. The external carotid artery, the cerebellar arteries and the deep veins (inferior sagittal and straight sinuses) are not drawn.')
});
export default SCENE;
