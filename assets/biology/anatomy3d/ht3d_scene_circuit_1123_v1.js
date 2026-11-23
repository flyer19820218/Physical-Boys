/* ht3d_scene_circuit_1123_v1.js
 * 3D 醫學版血液循環｜完整封閉路線總覽：把小腸、肝、腎、腦、肺的路線接成「一個圈」的「資料與步驟」。
 * 核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_lung_1122_v1.js。這個檔只放資料，不放繪圖程式。
 *
 * 路線（黃圈追蹤同一顆紅血球，五步走完一圈，第 5 步結束＝回到第 1 步的起點）：
 *   ① 左心室 → 主動脈 → 腸繫膜上動脈（同時：頸動脈往腦、腎動脈往腎、肝動脈往肝）
 *   ② 小動脈 → 小腸微血管（同時：腦、腎、肝的微血管床也在交換）→ 小靜脈
 *   ③ 腸繫膜上靜脈 → 肝門靜脈 → 肝（肝竇）→ 肝靜脈
 *   ④ 下腔靜脈（匯入腎靜脈；頭部的血走上腔靜脈）→ 右心房 → 右心室
 *   ⑤ 肺動脈 → 肺裡的微血管（換氣）→ 肺靜脈 → 左心房 → 左心室（回到起點，圈子封閉）
 * 中心線：circuit_centerlines_v1.json（tools/anatomy/build_circuit_centerlines.py 由各器官場景的中心線合成；
 *   主幹半徑取自網格，各器官的小血管床為示意、口徑放大）。模型：si_scene_v1.glb（心、肺、肝、腎、腸、體表）＋
 *   brain_organ_v1.glb（腦與頭頸外形，從 brain_scene_v1.glb 抽出，tools/anatomy/subset_glb.mjs）＋全身血管底圖（ht3d_preset）。
 * 座標：公尺；+Y 向上、+Z 向前、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述：src：EXISTING＝現有頁面原句；NEW＝新增（待老師審）。血色全站共識：不畫藍色血液（充氧血＝鮮紅、缺氧血＝暗紅）。
 */

import { BEST_SCENE, BEST_GROUPS, BEST_BASE, bestFloor } from './ht3d_preset_1122_v1.js?v=20261123-f2';

const P = (zh, en) => [zh, en];
const V = '?v=20261123-h5';

/* ---------- 名稱（沿用各器官場景已定案的名稱；有把握的才放） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  'cardiovascular.right_ventricle': { zh: '右心室', en: 'Right ventricle' },
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  'cardiovascular.left_atrium': { zh: '左心房', en: 'Left atrium' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  carotid: { zh: '頸動脈', en: 'Carotid artery' },
  brain: { zh: '腦', en: 'Brain' },
  jugular: { zh: '頸靜脈', en: 'Jugular vein' },
  svc: { zh: '上腔靜脈', en: 'Superior vena cava' },
  renal_artery: { zh: '腎動脈', en: 'Renal artery' },
  renal_vein: { zh: '腎靜脈', en: 'Renal vein' },
  kidney: { zh: '腎臟', en: 'Kidney' },
  'cardiovascular.superior_mesenteric_artery': { zh: '腸繫膜上動脈', en: 'Superior mesenteric artery' },
  small_intestine: { zh: '小腸', en: 'Small intestine' },
  'cardiovascular.superior_mesenteric_vein': { zh: '腸繫膜上靜脈', en: 'Superior mesenteric vein' },
  'cardiovascular.hepatic_portal_vein_2': { zh: '肝門靜脈', en: 'Hepatic portal vein' },
  'visceral.liver': { zh: '肝臟', en: 'Liver' },
  'cardiovascular.hepatic_veins': { zh: '肝靜脈', en: 'Hepatic veins' },
  ivc: { zh: '下腔靜脈', en: 'Inferior vena cava', note: '（國中課本：下大靜脈）' },
  pulmonary_trunk: { zh: '肺動脈幹', en: 'Pulmonary trunk' },
  pulmonary_artery: { zh: '肺動脈', en: 'Pulmonary artery' },
  pulmonary_vein: { zh: '肺靜脈', en: 'Pulmonary vein' },
  lung_L: { zh: '左肺', en: 'Left lung' },
  lung_R: { zh: '右肺', en: 'Right lung' },
  // 泛稱／示意（程式生成的部分）
  capillaries: { zh: '微血管（示意）', en: 'Capillaries (schematic)' },
  alveolar_capillaries: { zh: '肺泡微血管（示意）', en: 'Alveolar capillaries (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(Object.keys(NAMES));

/* ---------- 結構分組（依 si_parts_v1.json、brain_organ_parts_v1.json 的 id） ---------- */
const CV = 'cardiovascular.';
const HEART = [CV + 'left_atrium', CV + 'left_ventricle', CV + 'right_atrium', CV + 'right_ventricle'];
const LEAFLETS = [CV + 'left_coronary_leaflet', CV + 'right_coronary_leaflet', CV + 'non_coronary_leaflet'];
const LUNGS = ['visceral.superior_lobe_of_left_lung', 'visceral.inferior_lobe_of_left_lung', 'visceral.superior_lobe_of_right_lung', 'visceral.middle_lobe_of_right_lung', 'visceral.inferior_lobe_of_right_lung'];
const GUT = ['visceral.duodenum', 'visceral.jejunum', 'visceral.ileum'];
const COLON = ['visceral.ascending_colon', 'visceral.transverse_colon', 'visceral.descending_colon', 'visceral.sigmoid_colon', 'visceral.vermiform_appendix'];
const AORTA = [CV + 'ascending_aorta', CV + 'aortic_arch', CV + 'thoracic_aorta', CV + 'abdominal_aorta'];
const NECK_ART = [CV + 'left_common_carotid_artery', CV + 'right_common_carotid_artery', CV + 'brachiocephalic_trunk'];
const HEP_ART = [CV + 'coeliac_trunk', CV + 'common_hepatic_artery', CV + 'proper_hepatic_artery'];
const RENAL_ART = [CV + 'left_renal_artery', CV + 'right_renal_artery', CV + 'anterior_branch_of_renal_artery_l', CV + 'posterior_branch_of_renal_artery_l',
  CV + 'anterior_branch_of_renal_artery_r', CV + 'posterior_branch_of_renal_artery_r'];
const RENAL_VEIN = [CV + 'left_renal_vein', CV + 'right_renal_vein'];
const PORTAL = [CV + 'superior_mesenteric_vein', CV + 'hepatic_portal_vein_2', CV + 'splenic_vein'];
const IVC = [CV + 'inferior_vena_cava_abdominal_part', CV + 'inferior_vena_cava_thoracic_part'];
const HEAD_VEIN = [CV + 'superior_vena_cava', CV + 'right_brachiocephalic_vein'];
const PULM_ART = [CV + 'pulmonary_trunk', CV + 'left_pulmonary_artery', CV + 'right_pulmonary_artery'];
const PULM_VEIN = [CV + 'left_superior_pulmonary_vein', CV + 'left_inferior_pulmonary_vein', CV + 'right_superior_pulmonary_vein', CV + 'right_inferior_pulmonary_vein'];
export const GROUPS = Object.freeze({
  torso: ['regions.torso_surface'], head: ['regions.head_neck_surface'], heart: HEART, leaflets: LEAFLETS, lungs: LUNGS, gut: GUT, colon: COLON,
  liver: ['visceral.liver'], stomach: ['visceral.stomach'], pancreas: ['visceral.pancreas'], spleen: ['lymphoid.spleen'], diaphragm: ['muscular.diaphragm'],
  kidneys: ['visceral.fibrous_capsule_of_kidney_l', 'visceral.fibrous_capsule_of_kidney_r'],
  cerebrum: ['brain.frontal_lobe', 'brain.parietal_lobe', 'brain.temporal_lobe', 'brain.occipital_lobe', 'brain.other_cortex'],
  cerebellum: ['brain.cerebellum'], brainstem: ['brain.brainstem'],
  // 主要血管：資料集網格的外殼不畫，改畫成單層、半徑漸變的管（replaceMesh），血球就在管裡走
  aorta: AORTA, sma: [CV + 'superior_mesenteric_artery'], hepArt: HEP_ART, neckArt: NECK_ART, renalArt: RENAL_ART,
  portal: PORTAL, hepVein: [CV + 'hepatic_veins'], ivc: IVC, renalVein: RENAL_VEIN, headVein: HEAD_VEIN,
  pulmArt: PULM_ART, pulmVein: PULM_VEIN,
  // 程式生成的示意微血管（沿路由鮮紅變暗紅；第一個元素是合併後 mesh 的結構 id）
  gutMicro: ['@gutMicro'], liverMicro: ['@liverMicro'], kidneyMicro: ['@kidneyMicro'], brainMicro: ['@brainMicro'], lungMicro: ['@lungMicro']
});
export const MATERIAL = Object.freeze({
  'visceral.liver': { color: '#7d3328', sheen: '#c4746a', rough: 0.5 },
  'visceral.duodenum': { color: '#c9765f', sheen: '#f0b8a6', rough: 0.5 },
  'visceral.jejunum': { color: '#cf7c66', sheen: '#f4bcaa', rough: 0.5 },
  'visceral.ileum': { color: '#c87461', sheen: '#f0b5a3', rough: 0.5 },
  'visceral.stomach': { color: '#c98d82', sheen: '#efc7bd', rough: 0.6 },
  'visceral.pancreas': { color: '#d6b07c', sheen: '#f3dcb8', rough: 0.65 },
  'lymphoid.spleen': { color: '#74304a', sheen: '#b4687e', rough: 0.55 },
  colon: { color: '#b98f78', sheen: '#e4c7b5', rough: 0.65 },
  lungs: { color: '#d9a6a2', sheen: '#f6d8d4', rough: 0.7 },
  heart: { color: '#a5333b', sheen: '#e08b8b', rough: 0.5 },
  leaflets: { color: '#e7c9b0', sheen: '#fff0e0', rough: 0.6 },
  kidneys: { color: '#8a3a36', sheen: '#c9837a', rough: 0.55 },
  diaphragm: { color: '#a8564c', sheen: '#dca095', rough: 0.7 },
  torso: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  head: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  // 腦的外框色調暗一點：lit 時核心會把外框加亮（半透明的腦回層層疊起來，太亮會變成一團白霧）
  cerebrum: { color: '#c79a8e', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  cerebellum: { color: '#c08f82', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  brainstem: { color: '#bf9684', rough: 0.8, rim: '#6e4c44', rimStrength: 0.08, clearcoat: 0 },
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#5e1219', rim: '#c4545a', rough: 0.36 },
  // 肺循環的顏色語意和大循環相反：肺動脈是缺氧血（暗紅）、肺靜脈是充氧血（鮮紅）
  pulmArt: { color: '#5e1219', rim: '#c4545a', rough: 0.36 },
  pulmVein: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 }
});
/* 預設透明度。血管透明度一律 < 0.6（≥ 0.6 會開啟寫深度，把裡面的血球擋住）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.04, head: 0.05, heart: 0.3, leaflets: 0, lungs: 0.12, gut: 0.3, colon: 0.1, liver: 0.16, stomach: 0.06, pancreas: 0.08, spleen: 0.08,
  kidneys: 0.24, diaphragm: 0, cerebrum: 0.1, cerebellum: 0.08, brainstem: 0.08, otherArteries: 0.12, otherVeins: 0.12, otherOrgans: 0.05,
  aorta: 0.5, sma: 0.5, hepArt: 0.5, neckArt: 0.5, renalArt: 0.5, portal: 0.5, hepVein: 0.5, ivc: 0.5, renalVein: 0.5, headVein: 0.5, pulmArt: 0.5, pulmVein: 0.5,
  gutMicro: 0.5, liverMicro: 0.5, kidneyMicro: 0.5, brainMicro: 0.5, lungMicro: 0.5
});

/* ---------- 血流（公尺／秒，教學速度，不是真實速度） ---------- */
export const HEART_PERIOD = 1.0;
export const FLOW = Object.freeze({
  lv_out: { type: 'pulse', v: 0.07, density: 260 },
  aorta: { type: 'pulse', v: 0.11, density: 420 },
  aorta_lower: { type: 'pulse', v: 0.09, density: 420, fadeEnd: true },
  carotid: { type: 'pulse', v: 0.07, density: 260 },
  sma: { type: 'pulse', v: 0.055, density: 380 },
  sma_branch: { type: 'pulse', v: 0.04, density: 300, fadeEnd: true },
  hep_artery: { type: 'pulse', v: 0.05, density: 300 },
  renal_a: { type: 'pulse', v: 0.05, density: 300 },
  art: { type: 'pulseSoft', v: 0.022, density: 320 },
  cap: { type: 'slow', v: 0.0045, density: 0, spacing: 0.0022, singleFile: true },
  ven: { type: 'steady', v: 0.012, density: 320 },
  kart: { type: 'pulseSoft', v: 0.02, density: 300 },
  smv: { type: 'steady', v: 0.03, density: 420 },
  splenic: { type: 'steady', v: 0.022, density: 300, fadeStart: true },
  portal: { type: 'steady', v: 0.03, density: 520 },
  liver_cap: { type: 'slow', v: 0.008, density: 0, spacing: 0.0026, singleFile: true },
  hv: { type: 'steady', v: 0.026, density: 600 },
  renal_v: { type: 'steady', v: 0.03, density: 320 },
  cvein: { type: 'steady', v: 0.02, density: 260 },
  rdrain: { type: 'steady', v: 0.03, density: 420 },
  ivc_lower: { type: 'steady', v: 0.035, density: 420, fadeStart: true },
  ivc_upper: { type: 'steady', v: 0.035, density: 480 },
  ra_in: { type: 'steady', v: 0.04, density: 220 },
  ra_rv: { type: 'steady', v: 0.04, density: 220 },
  rv_out: { type: 'pulse', v: 0.06, density: 240 },
  pa_trunk: { type: 'pulse', v: 0.08, density: 300 },
  pa: { type: 'pulse', v: 0.06, density: 300 },
  lobar: { type: 'pulse', v: 0.035, density: 260 },
  seg: { type: 'pulseSoft', v: 0.018, density: 200 },
  pven: { type: 'steady', v: 0.012, density: 200 },
  pv: { type: 'steady', v: 0.03, density: 300 },
  la_lv: { type: 'steady', v: 0.04, density: 200 }
});
export function flowKey(seg) {
  if (/^art_\d+$/.test(seg)) return 'art';
  if (/^(cap_\d+|kc_|bc_|lc_)/.test(seg)) return 'cap';
  if (/^ven_\d+$/.test(seg)) return 'ven';
  if (/^liver_cap/.test(seg)) return 'liver_cap';
  if (/^hv\d$/.test(seg)) return 'hv';
  if (/^(lcar|rcar)$/.test(seg)) return 'carotid';
  if (/^renal_(a|ant|post)/.test(seg)) return 'renal_a';
  if (/^renal_v/.test(seg)) return 'renal_v';
  if (/^kart_/.test(seg)) return 'kart';
  if (/^kven_/.test(seg)) return 'ven';
  if (/^(Fpv|B1pv)$/.test(seg)) return 'cvein';
  if (/^pa_[LR]$/.test(seg)) return 'pa';
  if (/^a_/.test(seg)) return 'lobar';
  if (/^s_/.test(seg)) return 'seg';
  if (/^v_/.test(seg)) return 'pven';
  if (/^pv_/.test(seg)) return 'pv';
  return seg;
}
/* 生成的示意微血管要畫成哪一組（頂點色沿路由鮮紅變暗紅／暗紅變鮮紅） */
export function tubeGroup(seg) {
  if (/^(art|cap|ven)_\d+$/.test(seg)) return 'gutMicro';
  if (/^liver_cap/.test(seg)) return 'liverMicro';
  if (/^kc_/.test(seg)) return 'kidneyMicro';
  if (/^bc_/.test(seg)) return 'brainMicro';
  if (/^lc_/.test(seg)) return 'lungMicro';
  return null;
}

/* ---------- 步驟 ---------- */
const ARTS = Array.from({ length: 10 }, (_, i) => 'art_' + i), CAPS = Array.from({ length: 10 }, (_, i) => 'cap_' + i), VENS = Array.from({ length: 10 }, (_, i) => 'ven_' + i);
const LIVER_CAPS = ['liver_cap_a', 'liver_cap_b', 'liver_cap_c', 'liver_cap_d', 'liver_cap_art'];
const KIDNEY_ART = ['renal_a_L', 'renal_a_R', 'renal_ant_L', 'renal_post_L', 'renal_ant_R', 'renal_post_R'];

const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.');

/* 標籤：key＝NAMES 的 key；at＝錨點；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  lv: { key: 'cardiovascular.left_ventricle', at: { part: CV + 'left_ventricle', dx: 0.012, dy: -0.012, dz: 0.02 }, side: 'r' },
  aorta: { key: 'aorta', at: { seg: 'aorta', u: 0.62 }, side: 'r' },
  carotid: { key: 'carotid', at: { seg: 'lcar', u: 0.12 }, side: 'r' },
  brain: { key: 'brain', at: { pos: [0.0, 1.69, 0.03] }, side: 'r' },
  renalA: { key: 'renal_artery', at: { seg: 'renal_a_L', u: 0.5 }, side: 'r' },
  kidney: { key: 'kidney', at: { pos: [0.085, 1.10, 0.03] }, side: 'r' },
  sma: { key: 'cardiovascular.superior_mesenteric_artery', at: { seg: 'sma', u: 0.35 }, side: 'l' },
  gut: { key: 'small_intestine', at: { pos: [0.02, 1.06, 0.11] }, side: 'r' },
  caps: { key: 'capillaries', at: { seg: 'cap_4', u: 0.3 }, side: 'd' },
  smv: { key: 'cardiovascular.superior_mesenteric_vein', at: { seg: 'smv', u: 0.3 }, side: 'l' },
  portal: { key: 'cardiovascular.hepatic_portal_vein_2', at: { seg: 'portal', u: 0.5 }, side: 'l' },
  liver: { key: 'visceral.liver', at: { part: 'visceral.liver', dx: -0.045, dy: 0.01, dz: 0.03 }, side: 'l' },
  hv: { key: 'cardiovascular.hepatic_veins', at: { seg: 'hv2', u: 0.3 }, side: 'r' },
  ivc: { key: 'ivc', at: { seg: 'ivc_upper', u: 0.3 }, side: 'l' },
  renalV: { key: 'renal_vein', at: { seg: 'renal_v_R', u: 0.5 }, side: 'l' },
  svc: { key: 'svc', at: { seg: 'rdrain', u: 0.985 }, side: 'l' },
  jugular: { key: 'jugular', at: { seg: 'rdrain', u: 0.8 }, side: 'l' },
  ra: { key: 'cardiovascular.right_atrium', at: { part: CV + 'right_atrium', dx: -0.012, dy: 0.01, dz: 0.01 }, side: 'l' },
  rv: { key: 'cardiovascular.right_ventricle', at: { part: CV + 'right_ventricle', dx: -0.012, dy: -0.014, dz: 0.022 }, side: 'l' },
  trunk: { key: 'pulmonary_trunk', at: { seg: 'pa_trunk', u: 0.35 }, side: 'r' },
  paL: { key: 'pulmonary_artery', at: { seg: 'pa_L', u: 0.5 }, side: 'r' },
  lungL: { key: 'lung_L', at: { part: 'visceral.superior_lobe_of_left_lung', dx: 0.035, dy: 0.03, dz: 0.0 }, side: 'r' },
  lungR: { key: 'lung_R', at: { part: 'visceral.superior_lobe_of_right_lung', dx: -0.035, dy: 0.03, dz: 0.0 }, side: 'l' },
  lungCaps: { key: 'alveolar_capillaries', at: { seg: 'lc_LL0_0', u: 0.5 }, side: 'r' },   // 指在床最外側那一條，不是追蹤血球走的中間那條，圓點才不會蓋住黃圈
  pvL: { key: 'pulmonary_vein', at: { seg: 'pv_LI', u: 0.35 }, side: 'd' },
  la: { key: 'cardiovascular.left_atrium', at: { part: CV + 'left_atrium', dx: 0.0, dy: 0.022, dz: -0.01 }, side: 'u' }
});

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）。 */
const CAM = {
  body: { pos: [0.0, 0.98, 3.4], target: [0.0, 0.98, 0.05] },
  heartMid: { pos: [0.06, 1.34, 0.80], target: [0.02, 1.30, 0.07] },          // 第 1 步：心臟與主動脈弓（中景，不要貼太近）
  wide: { pos: [0.0, 1.31, 1.72], target: [0.0, 1.31, 0.05] },               // 第 1 步末～第 2 步：頭到小腸，看腦、腎、肝、小腸並聯
  wide2: { pos: [0.0, 1.30, 1.62], target: [0.0, 1.30, 0.05] },
  gutMid: { pos: [-0.03, 1.10, 0.76], target: [-0.03, 1.07, 0.08] },         // 第 2 步末：往小腸推近
  gutClose: { pos: [-0.032, 1.04, 0.47], target: [-0.028, 1.019, 0.095] },   // 第 3 步：小腸微血管（追蹤的血球在 art_4→cap_4→ven_4）
  gutClose2: { pos: [-0.04, 1.034, 0.41], target: [-0.036, 1.021, 0.095] },
  portalView: { pos: [-0.02, 1.12, 0.64], target: [-0.02, 1.10, 0.08] },     // 第 4 步：腸繫膜上靜脈→肝門靜脈
  liverView: { pos: [-0.03, 1.22, 0.64], target: [-0.03, 1.20, 0.08] },      // 肝門靜脈→肝→肝靜脈→下腔靜脈
  raView: { pos: [-0.004, 1.30, 0.52], target: [-0.004, 1.285, 0.085] },     // 右心房
  rvView: { pos: [0.018, 1.30, 0.50], target: [0.01, 1.288, 0.09] },         // 右心室（第 4 步末＝第 5 步開頭）
  lungsWide: { pos: [0.02, 1.32, 0.74], target: [0.02, 1.30, 0.05] },        // 第 5 步：兩肺
  leftLung: { pos: [0.16, 1.29, 0.52], target: [0.10, 1.265, 0.055] },
  lungBed: { pos: [0.15, 1.27, 0.37], target: [0.105, 1.256, 0.07] },        // 推近到追蹤血球經過的那一小團肺泡微血管（示意）        // 左肺下葉的示意肺泡微血管床
  laView: { pos: [0.05, 1.31, 0.49], target: [0.025, 1.295, 0.05] },         // 左心房
  lvView: { pos: [0.06, 1.29, 0.52], target: [0.04, 1.275, 0.075] }          // 左心室＝第 1 步起點
};
const K = (t, name) => ({ t, ...CAM[name] });
// 背景器官壓低
const BG = { torso: 0.03, head: 0.04, diaphragm: 0, stomach: 0.04, spleen: 0.05, pancreas: 0.05, colon: 0.06, leaflets: 0 };

export const STEPS = Object.freeze([
  {
    id: 'leave_heart', dur: 12, btn: P('從左心室出發：主動脈', 'Leaving the heart: the aorta'),
    title: P('① 從左心室出發：主動脈把血送往全身', '① Setting off from the left ventricle: the aorta sends blood everywhere'),
    text: [
      { src: 'NEW', p: P('左心室把鮮紅的充氧血打進主動脈；主動脈一路分支，通往頭、腎、小腸、肝等各個器官。', 'The left ventricle pumps bright-red, oxygen-rich blood into the aorta, which branches to the head, kidneys, gut, liver and every other organ.') },
      { src: 'NEW', p: P('跟著黃圈這顆紅血球走：走完一圈，牠會回到出發的地方，所以叫「循環」。', 'Follow the red cell in the yellow ring: after one full loop it is back where it started, which is why it is called a circulation.') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'body'), K(3.0, 'heartMid'), K(6.5, 'heartMid'), K(12, 'wide')],
    style: { ...BG, 'lit.cardiovascular.left_ventricle': 1, 'glow.aorta': 1, 'glow.neckArt': 0.7, 'glow.renalArt': 0.7, 'glow.sma': 0.7, 'glow.hepArt': 0.7, heart: 0.4, aorta: 0.55 },
    flows: ['lv_out', 'aorta', 'aorta_lower', 'lcar', 'rcar', 'sma', 'sma_branch', 'hep_artery', ...KIDNEY_ART],
    labels: [{ id: 'lv', at: [0.6, 5.8] }, { id: 'aorta', at: [5.8, 12] }, { id: 'carotid', at: [7.6, 12] }],
    tracer: { path: ['lv_out', 'aorta', 'sma'], from: 0.4, to: 11.6 }
  },
  {
    id: 'to_organs', dur: 12, btn: P('分送到各器官：並聯', 'To the organs, in parallel'),
    title: P('② 分送到各器官：血分成好幾條路同時流', '② To the organs: the blood takes many routes at once'),
    text: [
      { src: 'NEW', p: P('動脈愈分愈細，把血送到腦、腎、肝、小腸（各器官裡的小血管為示意，口徑放大）。', 'The arteries branch into ever finer vessels carrying blood to the brain, kidneys, liver and gut (small vessels inside organs are schematic and enlarged).') },
      { src: 'NEW', p: P('各器官是「並聯」的：血同時分到好幾條路，不是一個器官接著一個器官。', 'The organs are supplied in parallel: the blood splits into many routes at the same time rather than passing through one organ after another.') }
    ],
    camera: [K(0, 'wide'), K(8.8, 'wide2'), K(12, 'gutMid')],
    style: { ...BG, 'glow.sma': 0.8, 'glow.neckArt': 0.8, 'glow.renalArt': 0.8, 'glow.hepArt': 0.8, 'glow.aorta': 0.5, 'glow.gutMicro': 0.6, 'glow.kidneyMicro': 0.6, 'glow.brainMicro': 0.6, 'glow.liverMicro': 0.3,
      'lit.gut': 0.5, 'lit.kidneys': 0.5, 'lit.cerebrum': 0.3, 'lit.liver': 0.3 },
    flows: ['aorta', 'aorta_lower', 'lcar', 'rcar', 'sma', 'sma_branch', 'hep_artery', ...KIDNEY_ART, ...ARTS, 'kart_*'],
    labels: [{ id: 'brain', at: [0.6, 9.0] }, { id: 'kidney', at: [1.0, 9.0] }, { id: 'sma', at: [1.4, 9.0] }, { id: 'liver', at: [1.8, 9.0] }],
    tracer: { path: ['sma', 'art_4'], from: 0.5, to: 11.5, startU: 1 }   // 從第 1 步停下的地方（腸繫膜上動脈末端）走進小動脈，步末停在小動脈末端＝微血管入口
  },
  {
    id: 'exchange', dur: 12, btn: P('微血管：和細胞交換', 'Capillaries: exchange with cells'),
    title: P('③ 微血管：把氧氣和養分交給細胞', '③ Capillaries: handing oxygen and nutrients to the cells'),
    text: [
      { src: 'NEW', p: P('微血管的壁很薄，血在這裡把氧氣和養分交給細胞，帶走二氧化碳和廢物；血色由鮮紅變成暗紅。', 'Capillary walls are very thin: here the blood hands oxygen and nutrients to the cells and takes away CO₂ and waste, turning from bright red to dark red.') },
      { src: 'NEW', p: P('小腸的微血管還會把吃進來的養分吸收進血液；同一時間，腦、腎等其他器官的微血管也在交換。', 'In the small intestine the capillaries also take digested nutrients into the blood; at the same moment, capillaries in the brain, kidneys and other organs are exchanging too.') }
    ],
    camera: [K(0, 'gutMid'), K(3.5, 'gutClose'), K(12, 'gutClose2')],
    style: { ...BG, 'glow.gutMicro': 1, 'glow.kidneyMicro': 0.7, 'glow.brainMicro': 0.7, 'glow.liverMicro': 0.3, 'lit.gut': 0.5, 'lit.kidneys': 0.4, 'lit.cerebrum': 0.3 },
    flows: [...ARTS, ...CAPS, ...VENS, 'kart_*', 'kc_*', 'kven_*', 'bc_*', 'lcar', 'rcar', 'Fpv', 'B1pv'],
    labels: [{ id: 'caps', at: [2.6, 12] }, { id: 'gut', at: [3.0, 12] }],
    tracer: { path: ['art_4', 'cap_4', 'ven_4'], from: 0.3, to: 11.5, startU: 1 }
  },
  {
    id: 'to_right_heart', dur: 16, btn: P('肝門靜脈→肝→右心', 'Portal vein, liver, right heart'),
    title: P('④ 回到心臟：先經過肝臟，再進右心房、右心室', '④ Back to the heart: through the liver first, then the right atrium and ventricle'),
    text: [
      { src: 'NEW', p: P('小腸的靜脈血匯成腸繫膜上靜脈，經肝門靜脈先送進肝臟處理，再由肝靜脈離開，匯入下腔靜脈。', 'Blood from the small intestine joins the superior mesenteric vein and goes through the hepatic portal vein into the liver first, then leaves through the hepatic veins into the inferior vena cava.') },
      { src: 'NEW', p: P('腎的血由腎靜脈併入下腔靜脈；頭部的血經頸靜脈、上腔靜脈。兩條腔靜脈都通到右心房，再進右心室。', 'Blood from the kidneys joins the inferior vena cava via the renal veins; blood from the head returns through the jugular vein and superior vena cava. Both venae cavae open into the right atrium, then the right ventricle.') }
    ],
    camera: [K(0, 'gutClose2'), K(3.0, 'portalView'), K(6.0, 'portalView'), K(9.0, 'liverView'), K(10.0, 'liverView'), K(12.5, 'raView'), K(14.0, 'raView'), K(16, 'rvView')],
    style: { ...BG, 'glow.portal': 1, 'glow.hepVein': 1, 'glow.ivc': 1, 'glow.renalVein': 0.7, 'glow.headVein': 0.7, 'glow.liverMicro': 1, 'lit.liver': 0.6, 'lit.heart': 0.5 },
    flows: [...VENS, 'smv', 'splenic', 'portal', ...LIVER_CAPS, 'hep_artery', 'hv1', 'hv2', 'ivc_lower', 'ivc_upper', 'renal_v_L', 'renal_v_R', 'kven_*', 'Fpv', 'B1pv', 'rdrain', 'ra_in', 'ra_rv'],
    labels: [{ id: 'smv', at: [3.0, 7.0] }, { id: 'portal', at: [5.0, 10.0] }, { id: 'liver', at: [6.6, 11.0] }, { id: 'ivc', at: [9.4, 12.2] }, { id: 'svc', at: [11.8, 16] }, { id: 'ra', at: [12.0, 16] }, { id: 'rv', at: [13.8, 16] }],
    tracer: { path: ['ven_4', 'smv', 'portal', 'liver_cap_b', 'hv1', 'ivc_upper', 'ra_rv'], from: 0.4, to: 15.6, startU: 1 }
  },
  {
    id: 'lungs', dur: 16, btn: P('肺循環：換氣後回左心室', 'Lungs: back to the left ventricle'),
    title: P('⑤ 肺循環：在肺換氣，回到左心室，圈子封閉', '⑤ Lungs: gas exchange, then back to the left ventricle, closing the loop'),
    text: [
      { src: 'NEW', p: P('右心室把缺氧血打進肺動脈，送到肺；肺泡旁的微血管放出二氧化碳、帶進氧氣，血變回鮮紅。', 'The right ventricle pumps oxygen-poor blood into the pulmonary arteries; in capillaries next to the alveoli it releases CO₂ and picks up oxygen, turning bright red again.') },
      { src: 'NEW', p: P('肺靜脈把充氧血送回左心房，再進左心室——回到出發的地方，一圈完成。', 'The pulmonary veins return oxygen-rich blood to the left atrium and then the left ventricle: back at the start, one loop complete.') }
    ],
    camera: [K(0, 'rvView'), K(4.0, 'lungsWide'), K(5.0, 'lungsWide'), K(7.2, 'leftLung'), K(8.6, 'lungBed'), K(10.0, 'lungBed'), K(12.5, 'laView'), K(13.6, 'laView'), K(16, 'lvView')],
    style: { ...BG, 'glow.pulmArt': 0.8, 'glow.pulmVein': 1, 'glow.lungMicro': 1, 'lit.lungs': 0.5, 'lit.heart': 0.5 },
    flows: ['rv_out', 'pa_trunk', 'pa_L', 'pa_R', 'a_*', 's_*', 'lc_*', 'v_*', 'pv_*', 'la_lv', 'lv_out'],
    labels: [{ id: 'rv', at: [0, 3.0] }, { id: 'trunk', at: [1.2, 5.6] }, { id: 'lungL', at: [3.6, 7.2] }, { id: 'lungR', at: [3.6, 7.2] }, { id: 'lungCaps', at: [7.8, 11.0] }, { id: 'pvL', at: [10.0, 12.8] }, { id: 'la', at: [11.8, 16] }, { id: 'lv', at: [13.8, 16] }],
    tracer: { path: ['rv_out', 'pa_trunk', 'pa_L', 'a_LL', 's_LL0', 'lc_LL0_2', 'v_LL0', 'pv_LI', 'la_lv'], from: 0.4, to: 15.6 }   // 步末停在 la_lv 末端＝左心室，正是第 1 步的起點（圈子封閉）
  }
]);

export const SCENE = Object.freeze({
  ...BEST_SCENE,   // 全部循環共用的最佳模板（ht3d_preset_1122_v1.js）：全身血管底圖、血管底線、亮度對比、血球同色發光
  extras: Object.freeze([...BEST_SCENE.extras, Object.freeze({
    glb: 'assets/biology/anatomy3d/brain_organ_v1.glb' + V, glbLite: 'assets/biology/anatomy3d/brain_organ_v1_lite.glb' + V, parts: 'assets/biology/anatomy3d/brain_organ_parts_v1.json' + V
  })]),

  id: 'circuit', name: P('完整封閉路線', 'The complete loop'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/circuit_centerlines_v1.json' + V,
  names: NAMES, labelAllow: LABEL_ALLOW, groups: { ...GROUPS, ...BEST_GROUPS }, material: MATERIAL, baseStyle: { ...BASE_STYLE, ...BEST_BASE }, flow: FLOW, flowKey, tubeGroup,
  maxDistance: 3.6,   // 第 1 步開頭拉遠看全身（核心選用開關）
  ringMinPx: 11,      // 黃圈在畫面上至少 11 px 半徑（核心選用開關）：總覽鏡頭遠、細管裡的血球小，否則黃圈看不見
  replaceMesh: {
    aorta: ['aorta', 'aorta_lower'], sma: ['sma', 'sma_branch'], hepArt: ['hep_artery'], neckArt: ['lcar', 'rcar'], renalArt: [...KIDNEY_ART, 'kart_*'],
    portal: ['smv', 'splenic', 'portal'], hepVein: ['hv1', 'hv2'], ivc: ['ivc_lower', 'ivc_upper'], renalVein: ['renal_v_L', 'renal_v_R', 'kven_*'], headVein: ['rdrain', 'Fpv', 'B1pv'],
    pulmArt: ['pa_trunk', 'pa_L', 'pa_R', 'a_*', 's_*'], pulmVein: ['v_*', 'pv_*']
  },
  replaceStyle: {
    aorta: { kind: 'artery', radial: [24, 14] }, sma: { kind: 'artery', radial: [14, 8] }, hepArt: { kind: 'artery', radial: [14, 8] }, neckArt: { kind: 'artery', radial: [14, 8], step: 0.0009 },
    renalArt: { kind: 'artery', radial: [14, 8] },
    portal: { kind: 'vein', radial: [16, 10] }, hepVein: { kind: 'vein', radial: [16, 10] }, ivc: { kind: 'vein', radial: [20, 12] }, renalVein: { kind: 'vein', radial: [16, 10] },
    headVein: { kind: 'vein', radial: [16, 10], step: 0.0011 },
    pulmArt: { kind: 'vein', mat: 'pulmArt', radial: [20, 12] }, pulmVein: { kind: 'artery', mat: 'pulmVein', radial: [16, 10] }
  },
  vesselFloor: bestFloor(),   // 全部血管（含全身血管底圖、各器官的示意微血管）一直畫在畫面上
  smoothTubes: true,
  lumenMesh: {}, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [],
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('各器官裡的小血管為示意｜口徑放大', 'Small vessels inside organs: schematic, enlarged'),
  credit: P('3D 模型：Z-Anatomy／BodyParts3D／Brain for Blender，CC BY-SA', '3D model: Z-Anatomy / BodyParts3D / Brain for Blender, CC BY-SA'),
  schematic: P('總覽場景的各器官小血管為示意：小腸、肝、腎、腦、肺裡的小動脈、微血管、小靜脈，是程式生成的示意，不是解剖資料；口徑與血球都放大很多（真實微血管直徑只有幾微米），速度為教學示意。主動脈、頸動脈、腎動脈、腸繫膜上動脈、肝動脈、門靜脈、肝靜脈、腎靜脈、下腔靜脈、上腔靜脈、頸靜脈、肺動脈、肺靜脈的中心線與半徑由網格自動估算，取自各器官場景。',
    'Small vessels inside organs in the overview are schematic: the arterioles, capillaries and venules in the small intestine, liver, kidneys, brain and lungs are generated diagrams, not anatomical data; calibres and cells are greatly enlarged (real capillaries are a few micrometres wide) and speeds are illustrative. Centrelines and radii of the aorta, carotid, renal, superior mesenteric and hepatic arteries, portal, hepatic, renal, caval and jugular veins and pulmonary arteries and veins are estimated automatically from the meshes, taken from the single-organ scenes.')
});
export default SCENE;
