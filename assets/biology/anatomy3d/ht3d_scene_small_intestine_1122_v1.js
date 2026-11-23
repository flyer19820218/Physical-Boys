/* ht3d_scene_small_intestine_1122_v1.js
 * 3D 醫學版血液循環｜小腸路線（試點場景）的「資料與步驟」。核心引擎在 ht3d_core_1122_v1.js。
 *
 * 這個檔只放資料，不放繪圖程式：
 *   NAMES   名稱覆寫表（id → 中／英）。si_parts_v1.json 的 zh 只是初稿，畫面上的名稱一律從這裡取。
 *   LABEL_ALLOW  畫面上「准許出現」的標籤名稱（2026-11-22 協調者查證後的定案表）；表外結構不加標籤。
 *   STYLE   每個結構／群組的預設透明度與材質類別。
 *   FLOW    每條流動區段的速度型態（動脈脈動、微血管慢、靜脈平穩）。
 *   STEPS   5 個步驟：每步都是「完整可還原的參數組」（鏡頭關鍵格、顯示透明度、流動區段、標籤、放大窗、追蹤血球）。
 *           任何時刻的畫面 = stateAt(step, 秒數)，是純函式；有聲講解可直接跳到某步某秒。
 * 座標：公尺；+Y 向上、+Z 向前（胸腹前面）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 * 科學敘述：只用現有頁面／exchanges 檔已有的句子，或 2026-11-22 協調者提供的 5 句有依據敘述；
 *           新增句子都標 NEW（列在回報的「待老師審」）。
 */

import { BEST_SCENE, BEST_GROUPS, BEST_BASE, bestFloor } from './ht3d_preset_1122_v1.js?v=20261123-f2';

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表 ----------
 * 依據：2026-11-22 協調者名稱定案表（查證：教育部醫學名詞／台灣解剖學教科書用語；英文用 Terminologia Anatomica 英文名）。
 * note：只在中文版顯示的小字註記。 */
export const NAMES = Object.freeze({
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  'cardiovascular.ascending_aorta': { zh: '升主動脈', en: 'Ascending aorta' },
  'cardiovascular.aortic_arch': { zh: '主動脈弓', en: 'Aortic arch' },
  'cardiovascular.thoracic_aorta': { zh: '胸主動脈', en: 'Thoracic aorta' },
  'cardiovascular.abdominal_aorta': { zh: '腹主動脈', en: 'Abdominal aorta' },
  'cardiovascular.superior_mesenteric_artery': { zh: '腸繫膜上動脈', en: 'Superior mesenteric artery' },
  small_intestine: { zh: '小腸', en: 'Small intestine' },
  'cardiovascular.superior_mesenteric_vein': { zh: '腸繫膜上靜脈', en: 'Superior mesenteric vein' },
  'cardiovascular.hepatic_portal_vein_2': { zh: '肝門靜脈', en: 'Hepatic portal vein' },
  'cardiovascular.splenic_vein': { zh: '脾靜脈', en: 'Splenic vein' },
  'visceral.liver': { zh: '肝臟', en: 'Liver' },
  'cardiovascular.hepatic_veins': { zh: '肝靜脈', en: 'Hepatic veins' },
  ivc: { zh: '下腔靜脈', en: 'Inferior vena cava', note: '（國中課本：下大靜脈）' },
  // 泛稱（程式生成的示意部分）
  arterioles: { zh: '小動脈（示意）', en: 'Arterioles (schematic)' },
  capillaries: { zh: '微血管（示意）', en: 'Capillaries (schematic)' },
  venules: { zh: '小靜脈（示意）', en: 'Venules (schematic)' }
});
/* 畫面上准許當標籤的名稱 key（定案表）。不在這裡的結構一律不加標籤。 */
export const LABEL_ALLOW = Object.freeze(['cardiovascular.left_ventricle', 'cardiovascular.right_atrium', 'aorta',
  'cardiovascular.ascending_aorta', 'cardiovascular.aortic_arch', 'cardiovascular.thoracic_aorta', 'cardiovascular.abdominal_aorta',
  'cardiovascular.superior_mesenteric_artery', 'small_intestine', 'cardiovascular.superior_mesenteric_vein',
  'cardiovascular.hepatic_portal_vein_2', 'cardiovascular.splenic_vein', 'visceral.liver', 'cardiovascular.hepatic_veins', 'ivc',
  'arterioles', 'capillaries', 'venules']);

/* ---------- 結構分組（依 si_parts_v1.json 的 id） ---------- */
const HEART = ['cardiovascular.left_atrium', 'cardiovascular.left_ventricle', 'cardiovascular.right_atrium', 'cardiovascular.right_ventricle'];
const LEAFLETS = ['cardiovascular.left_coronary_leaflet', 'cardiovascular.right_coronary_leaflet', 'cardiovascular.non_coronary_leaflet'];
const LUNGS = ['visceral.superior_lobe_of_left_lung', 'visceral.inferior_lobe_of_left_lung', 'visceral.superior_lobe_of_right_lung', 'visceral.middle_lobe_of_right_lung', 'visceral.inferior_lobe_of_right_lung'];
const GUT = ['visceral.duodenum', 'visceral.jejunum', 'visceral.ileum'];
const COLON = ['visceral.ascending_colon', 'visceral.transverse_colon', 'visceral.descending_colon', 'visceral.sigmoid_colon', 'visceral.vermiform_appendix'];
const AORTA = ['cardiovascular.ascending_aorta', 'cardiovascular.aortic_arch', 'cardiovascular.thoracic_aorta', 'cardiovascular.abdominal_aorta'];
const IVC = ['cardiovascular.inferior_vena_cava_abdominal_part', 'cardiovascular.inferior_vena_cava_thoracic_part'];
const PORTAL = ['cardiovascular.superior_mesenteric_vein', 'cardiovascular.hepatic_portal_vein_2', 'cardiovascular.splenic_vein'];
const HEP_ART = ['cardiovascular.coeliac_trunk', 'cardiovascular.common_hepatic_artery', 'cardiovascular.proper_hepatic_artery'];
export const GROUPS = Object.freeze({
  torso: ['regions.torso_surface'], heart: HEART, leaflets: LEAFLETS, lungs: LUNGS, gut: GUT, colon: COLON,
  liver: ['visceral.liver'], stomach: ['visceral.stomach'], pancreas: ['visceral.pancreas'], spleen: ['lymphoid.spleen'],
  kidneys: ['visceral.fibrous_capsule_of_kidney_l', 'visceral.fibrous_capsule_of_kidney_r'], diaphragm: ['muscular.diaphragm'],
  aorta: AORTA, sma: ['cardiovascular.superior_mesenteric_artery'], portal: PORTAL, hepArt: HEP_ART,
  hepVeins: ['cardiovascular.hepatic_veins'], ivc: IVC,
  // 程式生成的示意管（核心依 FLOW 的 kind 建管）
  genArt: ['@art'], genCap: ['@cap'], genVen: ['@ven'], genLiver: ['@liver']
});
/* 材質類別：artery／vein 用血管材質；organ 依 id 取顏色；context 只當外形 */
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
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#5e1219', rim: '#c4545a', rough: 0.36 }
});
/* 預設透明度（1 = 不透明主角）。小腸與路線上的血管是主角；其餘器官淡化當背景。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.05, heart: 0.3, leaflets: 0, lungs: 0.1, gut: 0.95, colon: 0.16, liver: 0.32, stomach: 0.2, pancreas: 0.24,
  spleen: 0.28, kidneys: 0.16, diaphragm: 0, otherArteries: 0.3, otherVeins: 0.3,
  aorta: 0.5, sma: 0.6, portal: 0.55, hepArt: 0.45, hepVeins: 0.55, ivc: 0.5,
  genArt: 0.7, genCap: 0.75, genVen: 0.7, genLiver: 0
});

/* ---------- 血流（每條區段的速度型態；公尺／秒，教學速度，不是真實速度） ----------
 * pulse：動脈隨心動週期脈動；steady：靜脈平穩；slow：微血管單列慢行。fade：在鬆開的端點淡出。 */
export const HEART_PERIOD = 1.0; // 秒（示意的心動週期）
export const FLOW = Object.freeze({
  lv_out: { type: 'pulse', v: 0.07, density: 260 },
  aorta: { type: 'pulse', v: 0.11, density: 520 },
  aorta_lower: { type: 'pulse', v: 0.09, density: 520, fadeEnd: true },
  sma: { type: 'pulse', v: 0.055, density: 380 },
  sma_branch: { type: 'pulse', v: 0.04, density: 300, fadeEnd: true },
  hep_artery: { type: 'pulse', v: 0.05, density: 300 },
  art: { type: 'pulseSoft', v: 0.022, density: 320 },
  cap: { type: 'slow', v: 0.0045, density: 0, spacing: 0.0016, singleFile: true },
  ven: { type: 'steady', v: 0.012, density: 320 },
  smv: { type: 'steady', v: 0.03, density: 420 },
  splenic: { type: 'steady', v: 0.022, density: 300, fadeStart: true },
  portal: { type: 'steady', v: 0.03, density: 520 },
  liver_cap: { type: 'slow', v: 0.008, density: 0, spacing: 0.0022, singleFile: true },
  hv: { type: 'steady', v: 0.026, density: 600 },
  ivc_lower: { type: 'steady', v: 0.035, density: 420, fadeStart: true },
  ivc_upper: { type: 'steady', v: 0.035, density: 480 }
});
/* 區段 id → FLOW 型態（art_0…art_9 → art …） */
export function flowKey(seg) {
  if (/^art_\d+$/.test(seg)) return 'art';
  if (/^cap_\d+$/.test(seg)) return 'cap';
  if (/^ven_\d+$/.test(seg)) return 'ven';
  if (/^liver_cap/.test(seg)) return 'liver_cap';
  if (/^hv\d$/.test(seg)) return 'hv';
  return seg;
}
/* 生成的示意管要畫成哪一組（mesh 段不用畫，glb 已有） */
export function tubeGroup(seg) {
  if (/^art_\d+$/.test(seg)) return 'genArt';
  if (/^cap_\d+$/.test(seg)) return 'genCap';
  if (/^ven_\d+$/.test(seg)) return 'genVen';
  if (/^liver_cap/.test(seg)) return 'genLiver';
  return null;
}
/* 單層靜脈管：這些群組不畫資料集的網格外殼（外殼與血球走的路徑口徑對不上，看起來像「外面套一層膜」），
 * 改由核心依中心線與其半徑畫成單層管。口徑依文獻，見 tools/anatomy/set_vein_calibers.py 與 sources.md「血管口徑」。
 * 下腔靜脈一路畫到右心房開口，資料集網格上端的空隙因此不再需要「示意橋」。 */
export const REPLACE_MESH = Object.freeze({ portal: ['smv', 'splenic', 'portal'], hepVeins: ['hv1', 'hv2'], ivc: ['ivc_lower', 'ivc_upper'] });
/* 流動區段 → 驗證用的網格（粒子在管腔內的抽樣檢查） */
export const LUMEN_MESH = Object.freeze({
  aorta: AORTA, aorta_lower: ['cardiovascular.abdominal_aorta'], sma: ['cardiovascular.superior_mesenteric_artery', 'cardiovascular.abdominal_aorta'],
  sma_branch: ['cardiovascular.superior_mesenteric_artery'], smv: ['@portal'],
  portal: ['@portal'], ivc_lower: ['@ivc'], hep_artery: [...HEP_ART, 'cardiovascular.abdominal_aorta'],
  hv1: ['@hepVeins', '@ivc'], hv2: ['@hepVeins', '@ivc'], splenic: ['@portal']
});

/* ---------- 步驟 ---------- */
const ARTS = Array.from({ length: 10 }, (_, i) => 'art_' + i);
const CAPS = Array.from({ length: 10 }, (_, i) => 'cap_' + i);
const VENS = Array.from({ length: 10 }, (_, i) => 'ven_' + i);
const LIVER_CAPS = ['liver_cap_a', 'liver_cap_b', 'liver_cap_c', 'liver_cap_d'];
export const FOCUS_CAP = 'cap_4';   // 鏡頭飛近、放大窗出現的那一段腸壁：腸壁血管都在朝向腸繫膜的那一面，
                                    // cap_4 是 10 段裡唯一從前外側看得到、5 cm 內沒有其他器官擋住的（tools 內以射線搜尋）

/* 標籤：key＝NAMES 的 key；at＝錨點（區段 id＋比例，或結構 id 的 centroid＋位移）；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  lv: { key: 'cardiovascular.left_ventricle', at: { part: 'cardiovascular.left_ventricle', dx: 0.012, dy: -0.012, dz: 0.02 }, side: 'r' },
  aorta: { key: 'aorta', at: { seg: 'aorta', u: 0.25 }, side: 'u' },
  aortaTho: { key: 'aorta', at: { seg: 'aorta', u: 0.62 }, side: 'r' },
  aortaAbd: { key: 'aorta', at: { seg: 'aorta', u: 0.94 }, side: 'l' },
  sma: { key: 'cardiovascular.superior_mesenteric_artery', at: { seg: 'sma', u: 0.12 }, side: 'r' },
  arterioles: { key: 'arterioles', at: { seg: 'art_1', u: 0.55 }, side: 'r' },
  gut: { key: 'small_intestine', at: { seg: 'cap_6', u: 0.5 }, side: 'd' },
  gutNear: { key: 'small_intestine', at: { pos: [-0.052, 1.031, 0.106] }, side: 'u' },   // 腸管表面（cap_4 旁）
  caps: { key: 'capillaries', at: { seg: 'cap_4', u: 0.3 }, side: 'd' },
  venules: { key: 'venules', at: { seg: 'ven_4', u: 0.5 }, side: 'l' },
  smv: { key: 'cardiovascular.superior_mesenteric_vein', at: { seg: 'smv', u: 0.5 }, side: 'l' },
  portal: { key: 'cardiovascular.hepatic_portal_vein_2', at: { seg: 'portal', u: 0.5 }, side: 'l' },
  liver: { key: 'visceral.liver', at: { part: 'visceral.liver', dx: -0.045, dy: 0.01, dz: 0.03 }, side: 'l' },
  hv: { key: 'cardiovascular.hepatic_veins', at: { seg: 'hv2', u: 0.3 }, side: 'r' },
  ivc: { key: 'ivc', at: { seg: 'ivc_lower', u: 0.8 }, side: 'l' },
  ra: { key: 'cardiovascular.right_atrium', at: { part: 'cardiovascular.right_atrium', dx: -0.012, dy: 0.01, dz: 0.01 }, side: 'l' }
});

/* 說明文字。src：EXISTING＝現有頁面原句；ADAPTED＝現有句子小改；NEW＝新增（待老師審）；COORD＝協調者提供的有依據敘述（待老師審）。
 * 函式形式的會在執行時從 HumanTransportExchanges 讀出原文（確保沿用現有句子，不重抄）。 */
const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.'); // NEW
const firstPara = (zone) => (X) => { const z = X && X.zones.find((q) => q.id === zone); return z ? P(z.text[0].split('\n\n')[0], z.text[1].split('\n\n')[0]) : P('', ''); };

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）；格與格之間用平滑樣條緩動。 */
const CAM = {
  front: { pos: [0.02, 1.16, 0.95], target: [0.0, 1.14, 0.06] },
  heart: { pos: [0.17, 1.33, 0.46], target: [0.02, 1.30, 0.07] },
  archL: { pos: [0.33, 1.36, 0.30], target: [0.015, 1.29, 0.05] },
  aortaDown: { pos: [0.30, 1.20, 0.40], target: [0.01, 1.17, 0.06] },
  smaOrigin: { pos: [0.20, 1.10, 0.40], target: [0.0, 1.09, 0.08] },
  gutWide: { pos: [0.05, 1.02, 0.52], target: [-0.005, 1.03, 0.09] },
  gutMid: { pos: [0.06, 1.04, 0.30], target: [0.005, 1.035, 0.10] },
  // cap_4 中點 (-0.0501, 1.0235, 0.0969)，無遮擋的觀看方向 (0.949, -0.163, 0.27)；near 用來切掉鏡頭前的腸管
  wallNear: { pos: [0.0306, 1.0096, 0.1199], target: [-0.046, 1.023, 0.0985], near: 0.03 },
  wallClose: { pos: [-0.0074, 1.0162, 0.1091], target: [-0.050, 1.0235, 0.0969], near: 0.022 },
  veinsBack: { pos: [-0.10, 1.04, 0.45], target: [-0.02, 1.05, 0.09] },
  portalUp: { pos: [-0.16, 1.13, 0.40], target: [-0.01, 1.13, 0.085] },
  liverIn: { pos: [-0.17, 1.20, 0.38], target: [-0.02, 1.19, 0.09] },
  liverClose: { pos: [-0.11, 1.215, 0.29], target: [-0.012, 1.215, 0.088] },
  hvIvc: { pos: [-0.18, 1.25, 0.34], target: [-0.012, 1.245, 0.075] },
  raEnd: { pos: [-0.20, 1.29, 0.40], target: [-0.012, 1.27, 0.075] }
};
const K = (t, name) => ({ t, ...CAM[name] });

export const STEPS = Object.freeze([
  {
    id: 'leave_heart', dur: 10, btn: P('離開心臟：主動脈', 'Leaving the heart: aorta'),
    title: P('① 離開心臟：主動脈', '① Leaving the heart: the aorta'),
    text: [
      { src: 'ADAPTED', p: P('左心室收縮時把富氧血送入主動脈，供應全身組織。', 'The left ventricle contracts to send oxygen-rich blood into the aorta for body tissues.') },
      { src: 'EXISTING', p: P('鮮紅／暗紅表示相對含氧量，沒有藍色血液。', 'Bright/dark red show relative oxygen; blood is not blue.') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'front'), K(2.2, 'heart'), K(5.0, 'archL'), K(7.8, 'aortaDown'), K(10, 'aortaDown')],
    style: { 'deep.heart': 0.6, 'glow.aorta': 1, heart: 0.55, 'cardiovascular.left_ventricle': 0.62, lungs: 0.06, gut: 0.6, liver: 0.18, portal: 0.35, ivc: 0.35, hepVeins: 0.35, sma: 0.6, genArt: 0, genCap: 0, genVen: 0 },
    flows: ['lv_out', 'aorta', 'aorta_lower'],
    labels: [{ id: 'lv', at: [0.6, 5.2] }, { id: 'aorta', at: [3.0, 6.6] }, { id: 'aortaTho', at: [6.8, 10] }],
    tracer: { path: ['lv_out', 'aorta'], from: 0.4, to: 9.6 }
  },
  {
    id: 'sma', dur: 10, btn: P('腸繫膜上動脈送往小腸', 'Superior mesenteric artery to the gut'),
    title: P('② 腸繫膜上動脈：送往小腸', '② Superior mesenteric artery: to the small intestine'),
    text: [
      { src: 'COORD', p: P('腸繫膜上動脈由腹主動脈分出，把富氧血送到小腸。', 'The superior mesenteric artery branches from the abdominal aorta and carries oxygen-rich blood to the small intestine.') },
      { src: 'EXISTING', p: P('動脈往外分支、微血管交換、靜脈向回程匯流。', 'Arteries branch outward, capillaries exchange, and veins converge on the way back.') },
      { src: 'NEW', p: P('愈分愈細的小動脈（示意）把血送進腸壁。', 'Ever-finer arterioles (schematic) carry blood into the gut wall.') }
    ],
    camera: [K(0, 'aortaDown'), K(2.0, 'smaOrigin'), K(5.0, 'gutMid'), K(8.2, 'gutWide'), K(10, 'gutWide')],
    style: { 'deep.gut': 1, 'glow.sma': 1, 'glow.genArt': 0.9, 'glow.aorta': 0.5, heart: 0.2, gut: 0.5, otherVeins: 0.12, portal: 0.25, liver: 0.2, portal: 0.3, ivc: 0.3, hepVeins: 0.25, genVen: 0.25, genCap: 0.7 },
    flows: ['aorta', 'aorta_lower', 'sma', 'sma_branch', ...ARTS],
    labels: [{ id: 'aortaAbd', at: [0.5, 4.5] }, { id: 'sma', at: [1.6, 10] }, { id: 'arterioles', at: [5.2, 10] }, { id: 'gut', at: [4.6, 10] }],
    tracer: { path: ['aorta', 'sma', 'art_4'], from: 0.0, to: 9.4, startU: 0.93 }
  },
  {
    id: 'villi', dur: 12, btn: P('微血管與絨毛：養分進血', 'Capillaries and villi: nutrients in'),
    title: (X) => { const z = X && X.zones.find((q) => q.id === 'intestine'); return z ? P('③ ' + z.title[0], '③ ' + z.title[1]) : P('③ 微血管與絨毛：養分進血', '③ Capillaries and villi'); },
    text: [
      { src: 'EXISTING', p: firstPara('intestine') },
      { src: 'NEW', p: P('3D 畫面是腸壁；放大窗把腸壁裡的絨毛放大來看（示意）。', 'The 3D view shows the gut wall; the window enlarges a villus inside it (schematic).') }
    ],
    camera: [K(0, 'gutWide'), K(2.6, 'wallNear'), K(4.6, 'wallClose'), K(12, 'wallClose')],
    style: { 'deep.gut': 1, 'glow.genCap': 1, 'glow.genArt': 0.4, 'glow.genVen': 0.4, heart: 0.1, gut: 0.92, liver: 0.15, colon: 0.1, portal: 0.4, genArt: 0.9, genCap: 1, genVen: 0.9, torso: 0.02 },
    flows: ['sma', ...ARTS, ...CAPS, ...VENS],
    labels: [{ id: 'caps', at: [1.2, 4.2] }, { id: 'gutNear', at: [1.2, 4.2] }],
    tracer: { path: ['art_4', 'cap_4', 'ven_4'], from: 0.2, to: 11.5 },
    window: { kind: 'intestine', open: [4.0, 5.0], focus: { seg: FOCUS_CAP, u: 0.5 } }
  },
  {
    id: 'portal', dur: 10, btn: P('肝門靜脈：先到肝臟', 'Portal vein: liver first'),
    title: P('④ 肝門靜脈：先到肝臟', '④ Hepatic portal vein: to the liver first'),
    text: [
      { src: 'COORD', p: P('小腸吸收的養分隨血液先經肝門靜脈到肝臟處理，再進入其他血液循環。', 'Nutrients absorbed by the small intestine travel in the blood through the hepatic portal vein to the liver first, before entering the rest of the circulation.') },
      { src: 'COORD', p: P('肝門靜脈的血含氧量較低，但富含剛吸收的養分。', 'Portal blood is lower in oxygen but rich in freshly absorbed nutrients.') },
      { src: 'COORD', p: P('小靜脈匯流成腸繫膜上靜脈，再和脾靜脈匯合成肝門靜脈。', 'Venules converge into the superior mesenteric vein, which joins the splenic vein to form the hepatic portal vein.') }
    ],
    camera: [K(0, 'wallClose'), K(1.6, 'gutMid'), K(4.2, 'veinsBack'), K(7.2, 'portalUp'), K(10, 'liverIn')],
    style: { 'deep.liver': 1, 'deep.gut': 0.6, 'glow.portal': 1, 'glow.genVen': 0.9, heart: 0.12, gut: 0.5, liver: 0.5, aorta: 0.3, sma: 0.25, otherArteries: 0.1, hepArt: 0.2, genArt: 0.15, genCap: 0.6, genVen: 0.9, genLiver: 0.9, portal: 0.58, colon: 0.12, stomach: 0.14, pancreas: 0.18 },
    flows: [...CAPS, ...VENS, 'smv', 'splenic', 'portal', ...LIVER_CAPS],
    labels: [{ id: 'venules', at: [1.6, 5.6] }, { id: 'smv', at: [3.6, 7.6] }, { id: 'portal', at: [6.0, 10] }, { id: 'liver', at: [7.6, 10] }],
    tracer: { path: ['ven_4', 'smv', 'portal', 'liver_cap_b'], from: 0.4, to: 9.8 },
    window: { kind: 'intestine', close: [0, 0.9], focus: { seg: FOCUS_CAP, u: 0.5 } }
  },
  {
    id: 'liver_back', dur: 12, btn: P('肝臟加工，回到心臟', 'Liver processing, back to the heart'),
    title: P('⑤ 肝臟加工，回到心臟', '⑤ The liver processes; blood returns to the heart'),
    text: [
      { src: 'EXISTING', p: firstPara('liver') },
      { src: 'COORD', p: P('肝臟另外有肝動脈送來含氧血；肝靜脈把肝臟的血送進下腔靜脈（國中課本：下大靜脈），回到右心房。', 'The liver also receives oxygen-rich blood from the hepatic artery; hepatic veins carry blood from the liver into the inferior vena cava and back to the right atrium.') }
    ],
    camera: [K(0, 'liverIn'), K(2.0, 'liverClose'), K(7.4, 'liverClose'), K(9.6, 'hvIvc'), K(12, 'raEnd')],
    style: { 'deep.liver': 1, 'deep.cardiovascular.right_atrium': 0.8, 'glow.hepVeins': 1, 'glow.ivc': 1, 'glow.hepArt': 0.7, 'glow.genLiver': 0.6, heart: 0.4, 'cardiovascular.right_atrium': 0.62, liver: 0.5, gut: 0.4, aorta: 0.35, sma: 0.3, genArt: 0, genCap: 0.2, genVen: 0.3, genLiver: 0.95, hepArt: 0.95, portal: 0.58, stomach: 0.12, lungs: 0.06 },
    flows: ['portal', ...LIVER_CAPS, 'liver_cap_art', 'hep_artery', 'hv1', 'hv2', 'ivc_lower', 'ivc_upper'],
    labels: [{ id: 'liver', at: [0.4, 7.6] }, { id: 'hv', at: [7.6, 12] }, { id: 'ivc', at: [8.2, 12] }, { id: 'ra', at: [9.8, 12] }],
    tracer: { path: ['liver_cap_b', 'hv1', 'ivc_upper'], from: 7.2, to: 11.6 },
    window: { kind: 'liver', open: [2.4, 3.3], close: [7.0, 7.7], focus: { part: 'visceral.liver', dx: -0.02, dy: 0.02, dz: 0.04 } }
  }
]);

export const SCENE = Object.freeze({
  ...BEST_SCENE,   // 全部循環共用的最佳模板（ht3d_preset_1122_v1.js）：全身血管底圖、血管底線、亮度對比、血球同色發光

  id: 'small_intestine', name: P('小腸路線', 'Small-intestine route'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/si_centerlines_v1.json?v=20261123-h4',
  smoothTubes: true,   // 小動脈／微血管／小靜脈／肝內示意管／單層靜脈（門靜脈、肝靜脈、下腔靜脈）都用「變半徑＋圓頭封口」的管（核心選用開關，和腎、肝、肺、腦、總覽相同）；沒開時這些管是等粗圓柱、兩端是平口（老師 2026-11-23：小腸路線終點的錐形／平口殘端就是這個原因）
  names: NAMES, labelAllow: LABEL_ALLOW, groups: { ...GROUPS, ...BEST_GROUPS }, material: MATERIAL, baseStyle: { ...BASE_STYLE, ...BEST_BASE }, flow: FLOW, flowKey, tubeGroup,
  replaceMesh: REPLACE_MESH, lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD, focusCap: FOCUS_CAP,
  routeVessels: [...AORTA, 'cardiovascular.superior_mesenteric_artery', ...PORTAL, ...HEP_ART, 'cardiovascular.hepatic_veins', ...IVC],
  vesselFloor: bestFloor({ genArt: 0, genCap: 0, genVen: 0, genLiver: 0 }),   // 放大的微血管床只在自己那一步出現，其餘血管（含全身血管底圖）一直畫在畫面上
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('小分支為示意｜血球放大', 'Small branches are schematic | cells enlarged'),
  credit: P('3D 模型：Z-Anatomy／BodyParts3D，CC BY-SA 4.0', '3D model: Z-Anatomy / BodyParts3D, CC BY-SA 4.0')
});
export default SCENE;
