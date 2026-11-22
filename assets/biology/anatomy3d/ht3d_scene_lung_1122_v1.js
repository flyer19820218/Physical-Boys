/* ht3d_scene_lung_1122_v1.js
 * 3D 醫學版血液循環｜肺循環（小循環）的「資料與步驟」。核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_kidney_1122_v1.js。
 *
 * 路線：右心室 → 肺動脈幹 → 左／右肺動脈 → 肺內動脈分支（示意）→ 肺泡微血管（示意；O₂ 進血、CO₂ 出血，血色由缺氧漸變為充氧）
 *       → 肺內小靜脈（示意）→ 肺靜脈（左右各兩條，共四條）→ 左心房 →（第 5 步）左心室 → 主動脈，接大循環。
 * 這個檔只放資料，不放繪圖程式。中心線在 lung_centerlines_v1.json（tools/anatomy/build_lung_centerlines.py 產生）：
 *   mesh 段（半徑取自網格）：pa_trunk（肺動脈幹；上端到分叉點的 2 cm 為補段）、pa_L、pa_R、aorta
 *   示意段：a_<葉>（葉動脈；LU 左上、LL 左下、RU 右上、RM 右中、RL 右下）、s_<床>（到肺泡床的小動脈，末段沿一排肺泡）、
 *           c_<床>_<k>（肺泡微血管，從小動脈脊繞肺泡表面到小靜脈脊；最後一條是繞過末端肺泡的 U 形管）、
 *           n_<床>_<k>（每個肺泡兩圈環形微血管，與 c_ 交叉成網；只畫管、不放血球）、v_<床>（小靜脈）、
 *           pv_LS／pv_LI／pv_RS／pv_RI（四條肺靜脈；肺內段為示意，近端照資料集肺靜脈的走向進左心房）、rv_out／la_lv／lv_out（心腔內）
 *   肺泡（sacs）：alvFocus（放大的肺泡床 LL0）、alv（其他肺泡床）。全部口徑放大，標「示意」。
 *   例：追蹤的紅血球 ＝ rv_out → pa_trunk → pa_L → a_LL → s_LL0 → c_LL0_30（U 形微血管）→ v_LL0 → pv_LI → 左心房 → la_lv → lv_out → aorta
 * 座標：公尺；+Y 向上、+Z 向前（胸前）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述（查證出處見 sources.md「肺場景」）。src：EXISTING＝現有頁面原句；ADAPTED＝小改；NEW＝新增（待老師審）。
 * 血色：核心全站共識不畫藍色血液（缺氧血＝暗紅偏紫、充氧血＝鮮紅），與 2D 頁面「兩者都是紅色血液」一致。
 */

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表（只放有出處的；zh_review 的不放） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.right_ventricle': { zh: '右心室', en: 'Right ventricle' },
  'cardiovascular.left_atrium': { zh: '左心房', en: 'Left atrium' },
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  pulmonary_trunk: { zh: '肺動脈幹', en: 'Pulmonary trunk' },
  left_pa: { zh: '左肺動脈', en: 'Left pulmonary artery' },
  right_pa: { zh: '右肺動脈', en: 'Right pulmonary artery' },
  lung_L: { zh: '左肺', en: 'Left lung' },
  lung_R: { zh: '右肺', en: 'Right lung' },
  pulmonary_vein: { zh: '肺靜脈', en: 'Pulmonary vein' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  // 泛稱／示意（程式生成的部分）
  intrapulmonary_arteries: { zh: '肺內小動脈（示意）', en: 'Arteries in the lung (schematic)' },
  alveoli: { zh: '肺泡（示意）', en: 'Alveoli (schematic)' },
  alveolar_capillaries: { zh: '肺泡微血管（示意）', en: 'Alveolar capillaries (schematic)' },
  intrapulmonary_veins: { zh: '肺內小靜脈（示意）', en: 'Veins in the lung (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(['cardiovascular.right_ventricle', 'cardiovascular.left_atrium', 'cardiovascular.left_ventricle', 'pulmonary_trunk',
  'left_pa', 'right_pa', 'lung_L', 'lung_R', 'pulmonary_vein', 'aorta', 'intrapulmonary_arteries', 'alveoli', 'alveolar_capillaries', 'intrapulmonary_veins']);

/* ---------- 結構分組（依 si_parts_v1.json 的 id） ---------- */
const CV = 'cardiovascular.';
const HEART = [CV + 'left_atrium', CV + 'left_ventricle', CV + 'right_atrium', CV + 'right_ventricle'];
const LEAFLETS = [CV + 'left_coronary_leaflet', CV + 'right_coronary_leaflet', CV + 'non_coronary_leaflet'];
const LUNGS = ['visceral.superior_lobe_of_left_lung', 'visceral.inferior_lobe_of_left_lung', 'visceral.superior_lobe_of_right_lung', 'visceral.middle_lobe_of_right_lung', 'visceral.inferior_lobe_of_right_lung'];
const AORTA = [CV + 'ascending_aorta', CV + 'aortic_arch', CV + 'thoracic_aorta', CV + 'abdominal_aorta'];
const PULM_ART = [CV + 'pulmonary_trunk', CV + 'left_pulmonary_artery', CV + 'right_pulmonary_artery'];
const PULM_VEIN = [CV + 'left_superior_pulmonary_vein', CV + 'left_inferior_pulmonary_vein', CV + 'right_superior_pulmonary_vein', CV + 'right_inferior_pulmonary_vein'];
const CAVA = [CV + 'superior_vena_cava', CV + 'inferior_vena_cava_thoracic_part', CV + 'inferior_vena_cava_abdominal_part'];
export const GROUPS = Object.freeze({
  torso: ['regions.torso_surface'], heart: HEART, leaflets: LEAFLETS, lungs: LUNGS,
  liver: ['visceral.liver'], stomach: ['visceral.stomach'], spleen: ['lymphoid.spleen'], diaphragm: ['muscular.diaphragm'],
  aorta: AORTA, cava: CAVA, pulmArt: PULM_ART, pulmVein: PULM_VEIN,
  // 程式生成的示意管與肺泡（第一個元素是合併後 mesh 的結構 id）
  genCap: ['@lcap'], genCapF: ['@lcapF'], alv: ['@alv'], alvFocus: ['@alvF']
});
export const MATERIAL = Object.freeze({
  'visceral.liver': { color: '#7d3328', sheen: '#c4746a', rough: 0.5 },
  'visceral.stomach': { color: '#c98d82', sheen: '#efc7bd', rough: 0.6 },
  'lymphoid.spleen': { color: '#74304a', sheen: '#b4687e', rough: 0.55 },
  lungs: { color: '#d9a6a2', sheen: '#f6d8d4', rough: 0.7 },
  heart: { color: '#a5333b', sheen: '#e08b8b', rough: 0.5 },
  leaflets: { color: '#e7c9b0', sheen: '#fff0e0', rough: 0.6 },
  diaphragm: { color: '#a8564c', sheen: '#dca095', rough: 0.7 },
  torso: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  alv: { color: '#d4808c', rim: '#f2a3ad', rough: 0.5 },
  alvFocus: { color: '#d4808c', rim: '#f2a3ad', rough: 0.5 },
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#55162c', rim: '#c0607e', rough: 0.36 },
  // 肺循環的顏色語意和大循環相反：肺動脈是缺氧血（暗紅偏紫）、肺靜脈是充氧血（鮮紅）
  pulmArt: { color: '#5e1a33', rim: '#c0607e', rough: 0.36 },
  pulmVein: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 }
});
/* 預設透明度。血管透明度一律 < 0.6（≥ 0.6 會開啟寫深度，把裡面的血球擋住）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.04, heart: 0.3, leaflets: 0, lungs: 0.14, liver: 0.05, stomach: 0.04, spleen: 0.05, diaphragm: 0, otherArteries: 0.12, otherVeins: 0.12, otherOrgans: 0.05,
  aorta: 0.3, cava: 0.15, pulmArt: 0.55, pulmVein: 0.55,
  genCap: 0.45, genCapF: 0.55, alv: 0.22, alvFocus: 0.3
});

/* ---------- 血流（公尺／秒，教學速度，不是真實速度） ---------- */
export const HEART_PERIOD = 1.0;
export const FLOW = Object.freeze({
  rv_out: { type: 'pulse', v: 0.06, density: 240 },
  pa_trunk: { type: 'pulse', v: 0.08, density: 300 },
  pa: { type: 'pulse', v: 0.06, density: 300 },
  lobar: { type: 'pulse', v: 0.035, density: 260 },
  seg: { type: 'pulseSoft', v: 0.018, density: 200 },
  cap: { type: 'slow', v: 0.004, density: 0, spacing: 0.0012, singleFile: true },
  ven: { type: 'steady', v: 0.012, density: 200 },
  pv: { type: 'steady', v: 0.03, density: 300 },
  la_lv: { type: 'steady', v: 0.04, density: 200 },
  lv_out: { type: 'pulse', v: 0.07, density: 240 },
  aorta: { type: 'pulse', v: 0.11, density: 380, fadeEnd: true }
});
export function flowKey(seg) {
  if (/^pa_[LR]$/.test(seg)) return 'pa';
  if (/^a_/.test(seg)) return 'lobar';
  if (/^(s|sb)_/.test(seg)) return 'seg';
  if (/^c_/.test(seg)) return 'cap';
  if (/^(v|vb)_/.test(seg)) return 'ven';
  if (/^pv_/.test(seg)) return 'pv';
  return seg;
}
export const FOCUS = 'LL0';   // 放大的肺泡床（左下葉）
/* 生成的示意管要畫成哪一組：只有肺泡微血管走這裡（頂點色沿路由暗紅變鮮紅）。
 * 肺動脈幹→左右肺動脈→葉動脈→小動脈（同一個材質、同一個 mesh，接點不會有色差或接縫）與小靜脈→肺靜脈由 replaceMesh 畫；心腔內的路徑不畫。 */
export function tubeGroup(seg) {
  if (seg.startsWith('c_' + FOCUS + '_') || seg.startsWith('n_' + FOCUS + '_')) return 'genCapF';
  if (/^(c|n)_/.test(seg)) return 'genCap';
  return null;
}
export const LUMEN_MESH = Object.freeze({ aorta: [CV + 'ascending_aorta', CV + 'aortic_arch'] });

/* ---------- 步驟 ---------- */
const BEDS = ['LU0', 'LU1', 'LL0', 'LL1', 'RU0', 'RU1', 'RM0', 'RM1', 'RL0', 'RL1'];
const FCAPS = 'c_' + FOCUS + '_*', FU = 'c_' + FOCUS + '_14';   // 追蹤的紅血球走的那條微血管（朝鏡頭那一面最外面的肺泡；json named.tracer）
const TR_ART = ['sb_LL0_0', 'sb_LL0_1'], TR_VEN = ['vb_LL0_9', 'vb_LL0_8', 'vb_LL0_7'];   // 小動脈樹／小靜脈樹上通過那個肺泡的區段（依血流順序）。路徑：小動脈 s_ → 樹 → 微血管 → 樹 → 小靜脈 v_
const O = [0.1064, 1.2474, 0.0790], AB = [0.6666, 0.7454, 0.0082], AE = [0.4787, -0.4365, 0.7618];   // 放大肺泡床中心與兩個軸（lung_centerlines_v1.json named.focus_*）
const at = (d, e = 0, y = 0) => [O[0] + AB[0] * d + AE[0] * e, O[1] + AB[1] * d + AE[1] * e + y, O[2] + AB[2] * d + AE[2] * e];

/* 標籤：key＝NAMES 的 key；at＝錨點；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  rv: { key: 'cardiovascular.right_ventricle', at: { part: CV + 'right_ventricle', dx: -0.012, dy: -0.014, dz: 0.022 }, side: 'l' },
  trunk: { key: 'pulmonary_trunk', at: { seg: 'pa_trunk', u: 0.35 }, side: 'r' },
  paL: { key: 'left_pa', at: { seg: 'pa_L', u: 0.3 }, side: 'r' },
  paR: { key: 'right_pa', at: { seg: 'pa_R', u: 0.75 }, side: 'l' },
  lungL: { key: 'lung_L', at: { part: 'visceral.superior_lobe_of_left_lung', dx: 0.035, dy: 0.03, dz: 0.0 }, side: 'r' },
  lungR: { key: 'lung_R', at: { part: 'visceral.superior_lobe_of_right_lung', dx: -0.035, dy: 0.03, dz: 0.0 }, side: 'l' },
  intraArt: { key: 'intrapulmonary_arteries', at: { seg: 's_LL1', u: 0.3 }, side: 'r' },
  alv: { key: 'alveoli', at: { pos: at(0.004, 0.012) }, side: 'r' },
  caps: { key: 'alveolar_capillaries', at: { seg: 'c_' + FOCUS + '_12', u: 0.5 }, side: 'u' },
  intraVein: { key: 'intrapulmonary_veins', at: { seg: 'v_' + FOCUS, u: 0.72 }, side: 'd' },
  pvL: { key: 'pulmonary_vein', at: { seg: 'pv_LI', u: 0.35 }, side: 'd' },
  pvR: { key: 'pulmonary_vein', at: { seg: 'pv_RS', u: 0.35 }, side: 'u' },
  la: { key: 'cardiovascular.left_atrium', at: { part: CV + 'left_atrium', dx: 0.0, dy: 0.022, dz: -0.01 }, side: 'u' },
  lv: { key: 'cardiovascular.left_ventricle', at: { part: CV + 'left_ventricle', dx: 0.014, dy: -0.01, dz: 0.02 }, side: 'r' },
  aorta: { key: 'aorta', at: { seg: 'aorta', u: 0.5 }, side: 'u' }
});

/* 說明文字。函式形式的會在執行時從 HumanTransportExchanges 讀出 2D 原文（確保沿用現有句子，不重抄）。 */
const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.'); // NEW（與腎臟場景同句）
const lungZone = (X) => X && X.zones.find((q) => q.id === 'lung');
// 取 2D 原文：中文第 para 段第 zs 句；英文第 para 段第 es 句（可給陣列合併多句，因為中英斷句不一一對應）
const zoneSent = (para, zs, es) => (X) => {
  const z = lungZone(X); if (!z) return P('', '');
  const zh = z.text[0].split('\n\n')[para].split('。').filter(Boolean), en = z.text[1].split('\n\n')[para].split(/(?<=\.)\s+/).filter(Boolean);
  return P(zh[zs] + '。', [].concat(es).map((i) => en[i]).join(' '));
};

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）。 */
const CAM = {
  front: { pos: [0.0, 1.31, 0.80], target: [0.0, 1.30, 0.06] },
  heart: { pos: [0.075, 1.35, 0.40], target: [0.022, 1.322, 0.085] },
  bif: { pos: [0.06, 1.52, 0.30], target: [0.025, 1.338, 0.068] },
  lungsWide: { pos: [0.0, 1.42, 0.66], target: [0.0, 1.29, 0.045] },
  leftLung: { pos: [0.37, 1.31, 0.27], target: [0.095, 1.265, 0.05] },
  focusFar: { pos: at(0.17, 0.0, 0.03), target: O },
  focusNear: { pos: at(0.055, 0.0, 0.006), target: O },
  focusClose: { pos: at(0.036, 0.0, 0.004), target: O },
  hilumL: { pos: [0.24, 1.33, 0.34], target: [0.06, 1.285, 0.05] },
  laBack: { pos: [0.04, 1.45, -0.30], target: [0.02, 1.302, 0.045] },
  heartLeft: { pos: [0.26, 1.36, 0.36], target: [0.03, 1.30, 0.065] },
  aortaView: { pos: [0.08, 1.43, 0.50], target: [0.02, 1.325, 0.07] }
};
const K = (t, name) => ({ t, ...CAM[name] });
// 背景器官壓低
const BG = { liver: 0.04, stomach: 0.03, spleen: 0.04, torso: 0.03, diaphragm: 0, cava: 0.12 };
const ALL_S = BEDS.map((b) => 's_' + b), ALL_V = BEDS.map((b) => 'v_' + b);

export const STEPS = Object.freeze([
  {
    id: 'leave_rv', dur: 10, btn: P('離開右心室：肺動脈幹', 'Leaving the right ventricle'),
    title: P('① 離開右心室：肺動脈幹', '① Leaving the right ventricle: the pulmonary trunk'),
    text: [
      { src: 'EXISTING', p: zoneSent(0, 0, 0) },
      { src: 'NEW', p: P('這裡的血是缺氧血、含二氧化碳較多；和大循環相反，肺「動脈」流的是缺氧血。', 'This blood is low in oxygen and carries more CO₂: unlike the systemic circulation, the pulmonary arteries carry oxygen-poor blood.') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'front'), K(2.4, 'heart'), K(6.0, 'heart'), K(9.0, 'bif'), K(10, 'bif')],
    style: { ...BG, 'lit.cardiovascular.right_ventricle': 1, 'glow.pulmArt': 0.3, heart: 0.4, 'cardiovascular.right_ventricle': 0.58, lungs: 0.07, aorta: 0.22,
      pulmVein: 0.3, genCap: 0.1, genCapF: 0.15, alv: 0.08, alvFocus: 0.12 },
    flows: ['rv_out', 'pa_trunk'],
    labels: [{ id: 'rv', at: [0.8, 6.2] }, { id: 'trunk', at: [3.2, 10] }],
    tracer: { path: ['rv_out', 'pa_trunk'], from: 0.4, to: 9.6 }
  },
  {
    id: 'pulmonary_arteries', dur: 12, btn: P('左右肺動脈進入肺', 'Pulmonary arteries into the lungs'),
    title: P('② 左、右肺動脈：把血送進左肺、右肺', '② Left and right pulmonary arteries: into the lungs'),
    text: [
      { src: 'NEW', p: P('肺動脈幹分成左、右肺動脈，分別進入左肺與右肺，在肺裡愈分愈細（肺內分支為示意）。', 'The pulmonary trunk divides into the left and right pulmonary arteries, which enter the lungs and branch ever finer (branches inside the lungs are schematic).') },
      { src: 'NEW', p: P('肺循環的血壓比大循環低很多：靜止時肺動脈平均約 14 毫米汞柱。', 'Pressure in the pulmonary circulation is much lower than in the systemic circulation: at rest the mean pulmonary arterial pressure is about 14 mmHg.') },
      { src: 'EXISTING', p: zoneSent(1, 2, [2, 3]) }
    ],
    camera: [K(0, 'bif'), K(3.0, 'lungsWide'), K(7.0, 'lungsWide'), K(10.4, 'leftLung'), K(12, 'leftLung')],
    style: { ...BG, 'lit.lungs': 1, 'glow.pulmArt': 0.3, heart: 0.22, 'cardiovascular.right_ventricle': 0.22, lungs: 0.12, aorta: 0.18, pulmArt: 0.55, pulmVein: 0.25,
      genCap: 0.3, genCapF: 0.35, alv: 0.16, alvFocus: 0.22 },
    flows: ['pa_trunk', 'pa_L', 'pa_R', 'a_*', ...ALL_S],
    labels: [{ id: 'trunk', at: [0, 2.6] }, { id: 'paL', at: [1.2, 9.6] }, { id: 'paR', at: [1.8, 9.6] }, { id: 'lungL', at: [3.4, 9.8] }, { id: 'lungR', at: [3.8, 9.8] },
      { id: 'intraArt', at: [7.6, 12] }],
    tracer: { path: ['pa_trunk', 'pa_L', 'a_LL', 's_' + FOCUS], from: 0.2, to: 13.5, startU: 0.96 }   // to > dur：步末停在小動脈中段，接第 3 步
  },
  {
    id: 'alveoli', dur: 13, btn: P('肺泡與微血管：換氣', 'Alveoli and capillaries: gas exchange'),
    title: (X) => { const z = lungZone(X); return z ? P('③ ' + z.title[0], '③ ' + z.title[1]) : P('③ 肺泡接力：氧氣進血，二氧化碳出血', '③ Alveoli: oxygen enters blood; CO₂ leaves it'); },
    text: [
      { src: 'EXISTING', p: zoneSent(0, 1, 1) },
      { src: 'EXISTING', p: zoneSent(1, 0, 0) },
      { src: 'NEW', p: P('微血管的血一路由暗紅（缺氧）變成鮮紅（充氧）。成人約有 3～8 億個肺泡，每個直徑約 0.2 毫米；畫面是放大的示意。', 'Along the capillaries the blood turns from dark red (oxygen-poor) to bright red (oxygen-rich). An adult has roughly 300–800 million alveoli, each about 0.2 mm across; this view is an enlarged schematic.') }
    ],
    camera: [K(0, 'leftLung'), K(2.6, 'focusFar'), K(4.4, 'focusNear'), K(6.4, 'focusClose'), K(13, 'focusClose')],
    style: { ...BG, 'lit.lungs': 0.6, 'lit.alvFocus': 0, 'glow.genCapF': 1, 'glow.pulmArt': 0.3, 'glow.pulmVein': 0.3, heart: 0.1, lungs: 0.06, aorta: 0.1, pulmArt: 0.58, pulmVein: 0.58,
      genCap: 0.35, genCapF: 0.58, alv: 0.5, alvFocus: 0.97 },
    flows: ['s_' + FOCUS, 'sb_' + FOCUS + '_*', FCAPS, 'vb_' + FOCUS + '_*', 'v_' + FOCUS],
    labels: [{ id: 'alv', at: [4.2, 8.4] }, { id: 'caps', at: [4.8, 8.4] }, { id: 'intraArt', at: [0, 2.4] }],   // 放大窗打開前收起標籤（不壓在放大窗上）
    tracer: { path: ['s_' + FOCUS, ...TR_ART, FU, ...TR_VEN, 'v_' + FOCUS], from: 0, to: 24, startU: 0.85 },   // 約 4–7 秒走過 U 形微血管（看得到暗紅變鮮紅）；to > dur：步末停在小靜脈上，接第 4 步
    window: { kind: 'lung', open: [8.2, 9.2], focus: { pos: O }, tag: P('放大：肺泡與微血管的氣體交換（示意）', 'Enlarged: gas exchange in an alveolus (schematic)') }
  },
  {
    id: 'pulmonary_veins', dur: 12, btn: P('肺靜脈送回左心房', 'Pulmonary veins to the left atrium'),
    title: P('④ 肺靜脈：充氧血回到左心房', '④ Pulmonary veins: oxygen-rich blood back to the left atrium'),
    text: [
      { src: 'NEW', p: P('小靜脈一路匯集成肺靜脈；左、右肺各有兩條，共四條，都注入左心房（肺內小靜脈為示意）。', 'Venules join into the pulmonary veins: two from each lung, four in all, all emptying into the left atrium (veins inside the lungs are schematic).') },
      { src: 'EXISTING', p: zoneSent(1, 1, 1) },
      { src: 'NEW', p: P('和大循環相反：肺「靜脈」流的是充氧血。', 'The reverse of the systemic circulation: the pulmonary veins carry oxygen-rich blood.') }
    ],
    camera: [K(0, 'focusClose'), K(2.8, 'hilumL'), K(6.0, 'hilumL'), K(9.4, 'laBack'), K(12, 'laBack')],
    style: { ...BG, 'lit.cardiovascular.left_atrium': 1, 'lit.lungs': 0.4, 'glow.pulmVein': 1, heart: 0.3, 'cardiovascular.left_atrium': 0.58, lungs: 0.09,
      aorta: 0.15, pulmArt: 0.28, pulmVein: 0.58, genCap: 0.25, genCapF: 0.3, alv: 0.12, alvFocus: 0.18 },
    flows: [...ALL_V, 'pv_*'],
    labels: [{ id: 'intraVein', at: [0.6, 3.6] }, { id: 'pvL', at: [3.2, 12] }, { id: 'pvR', at: [7.0, 12] }, { id: 'la', at: [8.8, 12] }],
    tracer: { path: ['v_' + FOCUS, 'pv_LI'], from: 0, to: 11.6, startU: 0.45 },
    window: { kind: 'lung', close: [0, 0.9], focus: { pos: O }, tag: P('放大：肺泡與微血管的氣體交換（示意）', 'Enlarged: gas exchange in an alveolus (schematic)') }
  },
  {
    id: 'to_systemic', dur: 11, btn: P('回到心臟，接大循環', 'Back to the heart, on to the body'),
    title: P('⑤ 回到心臟：接上大循環', '⑤ Back to the heart: on to the systemic circulation'),
    text: [
      { src: 'NEW', p: P('小循環（肺循環）：右心室 → 肺動脈 → 肺部微血管 → 肺靜脈 → 左心房。', 'Pulmonary (lesser) circulation: right ventricle → pulmonary arteries → lung capillaries → pulmonary veins → left atrium.') },
      { src: 'NEW', p: P('左心房的血進入左心室，再由主動脈送往全身——這就是大循環（體循環）。', 'From the left atrium the blood enters the left ventricle and leaves through the aorta to the whole body: the systemic circulation.') },
      { src: 'NEW', p: P('小循環的任務是換氣：在肺放出二氧化碳、帶回氧氣。', 'The job of the pulmonary circulation is gas exchange: release CO₂ in the lungs and pick up oxygen.') }
    ],
    camera: [K(0, 'laBack'), K(3.4, 'heartLeft'), K(7.0, 'heartLeft'), K(9.6, 'aortaView'), K(11, 'aortaView')],
    style: { ...BG, 'lit.heart': 1, 'glow.aorta': 0.8, 'glow.pulmVein': 0.5, heart: 0.5, 'cardiovascular.left_ventricle': 0.58, 'cardiovascular.right_ventricle': 0.25,
      lungs: 0.07, aorta: 0.45, pulmArt: 0.3, pulmVein: 0.5, genCap: 0.12, genCapF: 0.15, alv: 0.08, alvFocus: 0.1 },
    flows: ['pv_*', 'la_lv', 'lv_out', 'aorta'],
    labels: [{ id: 'la', at: [0, 4.0] }, { id: 'lv', at: [3.6, 8.6] }, { id: 'aorta', at: [7.8, 11] }],
    tracer: { path: ['la_lv', 'lv_out', 'aorta'], from: 0.6, to: 10.6 }
  }
]);

export const SCENE = Object.freeze({
  id: 'lung', name: P('肺循環（小循環）', 'Pulmonary circulation'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/lung_centerlines_v1.json?v=20261123-d5',
  names: NAMES, labelAllow: LABEL_ALLOW, groups: GROUPS, material: MATERIAL, baseStyle: BASE_STYLE, flow: FLOW, flowKey, tubeGroup,
  // 肺動脈幹、左右肺動脈、四條肺靜脈不畫資料集的網格外殼，改畫成單層、半徑漸變的管（半徑：見 sources.md「肺場景」；網格估計值留在 JSON 的 radius_mesh）；
  // 肺內的動脈分支（a_、s_）與小靜脈（v_）併入同一組，和主幹同材質、同一個 mesh
  replaceMesh: { pulmArt: ['pa_trunk', 'pa_L', 'pa_R', 'a_*', 's_*', 'sb_*'], pulmVein: ['v_*', 'vb_*', 'pv_*'] },
  replaceStyle: { pulmArt: { kind: 'vein', mat: 'pulmArt', radial: [20, 12] }, pulmVein: { kind: 'artery', mat: 'pulmVein', radial: [16, 10] } },
  smoothTubes: true,   // 生成的小血管用變半徑管；接點兩端不封口的段在 JSON 寫 capStart／capEnd: false
  flowBright: 2,   // 血球亮度加倍；目標器官亮度加倍＝各步驟 style 的 lit.<群組>: 1
  lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [...AORTA],
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('肺內分支、肺泡為示意｜放大', 'Lung branches and alveoli: schematic, enlarged'),   // 手機上這行會壓到畫面，保持短；顏色說明寫在步驟②③的說明文字
  credit: P('3D 模型：Z-Anatomy／BodyParts3D，CC BY-SA 4.0', '3D model: Z-Anatomy / BodyParts3D, CC BY-SA 4.0'),
  schematic: P('肺場景的小分支為示意：肺內的動脈分支、到肺泡的小動脈、肺泡與肺泡微血管、肺內小靜脈、肺靜脈在肺裡的那一段，以及肺動脈幹分叉處約 2 公分的補段，是程式生成的示意，不是解剖資料；肺泡與小血管的口徑、血球都放大很多，速度為教學示意。肺動脈幹、左右肺動脈、主動脈的中心線與半徑由網格自動估算。',
    'Small branches in the lung scene are schematic: the arterial branches inside the lungs, the arterioles, the alveoli and alveolar capillaries, the venules, the intrapulmonary part of the pulmonary veins and a 2 cm link at the pulmonary-trunk bifurcation are generated diagrams, not anatomical data. Alveoli, small vessels and cells are greatly enlarged and speeds are illustrative. Centrelines and radii of the pulmonary trunk, pulmonary arteries and aorta are estimated automatically from the meshes.')
});
export default SCENE;
