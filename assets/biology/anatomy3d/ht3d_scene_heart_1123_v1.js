/* ht3d_scene_heart_1123_v1.js
 * 3D 醫學版血液循環｜心臟自己的血液供應（冠狀循環）的「資料與步驟」。核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_lung_1122_v1.js。
 *
 * 路線：左心室 → 主動脈根部 → 左、右冠狀動脈 → 愈分愈細的分支 → 心肌微血管（示意；氧氣、養分進心肌，二氧化碳進血，血色由鮮紅漸變為暗紅）
 *       → 小靜脈 → 心靜脈（沿著動脈旁邊走，示意）→ 冠狀竇（示意）→ 右心房。
 * 這個檔只放資料，不放繪圖程式。中心線在 heart_centerlines_v1.json（tools/anatomy/build_heart_centerlines.py 產生）：
 *   mesh 段（半徑取自網格）：lca（左冠狀動脈主幹）、lad／lcx 與它們的分支 lad_1…、lcx_1…（資料集裡每條分支各是一段管子，建置時接到母管壁上）、
 *           rca 與分支 rca_1…（右冠狀動脈）、aorta（升主動脈）
 *   示意段：sa_<分支>（末端小動脈）、cp_<分支>_<k>（心肌微血管，每條分支末端 3 條）、sv_<分支>（小靜脈）、
 *           v_<分支>（伴行心靜脈）、gcv（大心靜脈）、plv（後室靜脈）、scv（小心靜脈）、cs（冠狀竇）、
 *           lv_out／root_L／root_R／ra_in（心腔與主動脈竇內，只給血球走）、tr_*（追蹤用路徑片段，不畫）
 *   例：追蹤的紅血球 ＝ lv_out → root_L → lca → tr_lad → lad_2 → sa_lad_2 → cp_lad_2_1 → sv_lad_2 → v_lad_2 → tr_gcv → cs → ra_in
 * 座標：公尺；+Y 向上、+Z 向前（胸前）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述（查證出處見 sources.md「心臟／冠狀動脈場景」）。src：EXISTING＝現有頁面原句；ADAPTED＝小改；NEW＝新增（待老師審）。
 * 血色：核心全站共識不畫藍色血液（缺氧血＝暗紅、充氧血＝鮮紅），與 2D 頁面「兩者都是紅色血液」一致。
 */

import { BEST_SCENE, BEST_GROUPS, BEST_BASE, bestFloor } from './ht3d_preset_1122_v1.js?v=20261123-f2';

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表（只放有出處的；zh_review 的不放：前室間動脈、迴旋支只在說明文字用「兩大支」描述） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  lca: { zh: '左冠狀動脈', en: 'Left coronary artery' },
  rca: { zh: '右冠狀動脈', en: 'Right coronary artery' },
  myocardium: { zh: '心肌（心臟壁）', en: 'Heart muscle (heart wall)' },
  // 泛稱／示意（程式生成的部分）
  arteriole: { zh: '小動脈（示意）', en: 'Arteriole (schematic)' },
  capillary: { zh: '心肌微血管（示意）', en: 'Myocardial capillaries (schematic)' },
  venule: { zh: '小靜脈（示意）', en: 'Venule (schematic)' },
  cardiac_veins: { zh: '冠狀靜脈（示意）', en: 'Cardiac veins (schematic)' },
  coronary_sinus: { zh: '冠狀竇（示意）', en: 'Coronary sinus (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(Object.keys(NAMES));

/* ---------- 結構分組（依 si_parts_v1.json 的 id） ---------- */
const CV = 'cardiovascular.';
const HEART = [CV + 'left_atrium', CV + 'left_ventricle', CV + 'right_atrium', CV + 'right_ventricle'];
const LEAFLETS = [CV + 'left_coronary_leaflet', CV + 'right_coronary_leaflet', CV + 'non_coronary_leaflet'];
const LUNGS = ['visceral.superior_lobe_of_left_lung', 'visceral.inferior_lobe_of_left_lung', 'visceral.superior_lobe_of_right_lung', 'visceral.middle_lobe_of_right_lung', 'visceral.inferior_lobe_of_right_lung'];
const AORTA = [CV + 'ascending_aorta', CV + 'aortic_arch', CV + 'thoracic_aorta', CV + 'abdominal_aorta'];
const PULM_ART = [CV + 'pulmonary_trunk', CV + 'left_pulmonary_artery', CV + 'right_pulmonary_artery'];
const PULM_VEIN = [CV + 'left_superior_pulmonary_vein', CV + 'left_inferior_pulmonary_vein', CV + 'right_superior_pulmonary_vein', CV + 'right_inferior_pulmonary_vein'];
const CAVA = [CV + 'superior_vena_cava', CV + 'inferior_vena_cava_thoracic_part', CV + 'inferior_vena_cava_abdominal_part'];
const CORON_A = [CV + 'left_coronary_artery', CV + 'anterior_interventricular_artery', CV + 'circumflex_artery_of_heart', CV + 'right_coronary_artery'];
export const GROUPS = Object.freeze({
  torso: ['regions.torso_surface'], heart: HEART, leaflets: LEAFLETS, lungs: LUNGS,
  liver: ['visceral.liver'], stomach: ['visceral.stomach'], spleen: ['lymphoid.spleen'], diaphragm: ['muscular.diaphragm'],
  aorta: AORTA, cava: CAVA, pulmArt: PULM_ART, pulmVein: PULM_VEIN,
  coronA: CORON_A,   // 資料集的冠狀動脈網格：不畫外殼，改畫單層管（replaceMesh）
  // 程式生成的示意管（第一個元素是合併後 mesh 的結構 id）。冠狀靜脈 coronV 沒有資料集網格，核心依 replaceMesh 直接生成
  genCapH: ['@hcap'], genCapHF: ['@hcapF']
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
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#5e1219', rim: '#c4545a', rough: 0.36 },
  // 冠狀動脈（大循環）是充氧血（鮮紅）；冠狀靜脈是缺氧血（暗紅）
  coronA: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  coronV: { color: '#5e1219', rim: '#c4545a', rough: 0.36 }
});
/* 預設透明度。血管透明度一律 < 0.6（≥ 0.6 會開啟寫深度，把裡面的血球擋住）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.04, heart: 0.3, leaflets: 0, lungs: 0.08, liver: 0.05, stomach: 0.04, spleen: 0.05, diaphragm: 0, otherArteries: 0.12, otherVeins: 0.12, otherOrgans: 0.05,
  aorta: 0.3, cava: 0.15, pulmArt: 0.2, pulmVein: 0.2,
  coronA: 0.55, coronV: 0.55, genCapH: 0.5, genCapHF: 0.58
});

/* ---------- 血流（公尺／秒，教學速度，不是真實速度） ---------- */
export const HEART_PERIOD = 1.0;
export const FLOW = Object.freeze({
  lv_out: { type: 'pulse', v: 0.07, density: 600 },
  root: { type: 'pulse', v: 0.04, density: 600 },
  aorta: { type: 'pulse', v: 0.11, density: 500, fadeEnd: true },
  trunk: { type: 'pulse', v: 0.05, density: 300 },
  branch: { type: 'pulseSoft', v: 0.03, density: 260 },
  arteriole: { type: 'pulseSoft', v: 0.012, density: 200 },
  cap: { type: 'slow', v: 0.004, density: 0, spacing: 0.0012, singleFile: true },
  venule: { type: 'steady', v: 0.008, density: 200 },
  vein: { type: 'steady', v: 0.02, density: 240 },
  cs: { type: 'steady', v: 0.03, density: 280 },
  ra_in: { type: 'steady', v: 0.04, density: 450 }
});
export function flowKey(seg) {
  if (seg === 'lv_out' || seg === 'aorta' || seg === 'ra_in' || seg === 'cs') return seg;
  if (/^root_/.test(seg)) return 'root';
  if (/^(lca|lad|lcx|rca)$/.test(seg)) return 'trunk';
  if (/^(lad|lcx|rca)_/.test(seg)) return 'branch';
  if (/^sa_/.test(seg)) return 'arteriole';
  if (/^cp_/.test(seg)) return 'cap';
  if (/^sv_/.test(seg)) return 'venule';
  return 'vein';   // v_*、gcv、plv、scv
}
export const FOCUS = 'lad_2';   // 放大的微血管床所在的分支（左心室前壁、靠近心尖）
/* 生成的示意管畫成哪一組：只有心肌微血管走這裡（頂點色沿路由鮮紅變暗紅）。其餘血管由 replaceMesh 畫；心腔內與追蹤用的路徑不畫。 */
export function tubeGroup(seg) {
  if (seg.startsWith('cp_' + FOCUS + '_')) return 'genCapHF';
  if (/^cp_/.test(seg)) return 'genCapH';
  return null;
}
export const LUMEN_MESH = Object.freeze({ aorta: [CV + 'ascending_aorta'] });

/* ---------- 步驟 ---------- */
const BEDS = ['lad', 'lad_1', 'lad_2', 'lad_3', 'lad_4', 'lad_5', 'lcx', 'lcx_1', 'lcx_2', 'lcx_3', 'lcx_4', 'lcx_5',
  'rca', 'rca_1', 'rca_2', 'rca_3', 'rca_4', 'rca_5', 'rca_6', 'rca_7', 'rca_8', 'rca_9', 'rca_10', 'rca_11', 'rca_12', 'rca_13'];
const ALL_SA = ['sa_*'], ALL_CP = ['cp_*'], ALL_SV = ['sv_*'];
const BED_E = [0.07331, 1.25235, 0.11443];   // 放大的微血管床的小動脈起點（heart_centerlines_v1.json named.beds.lad_2.E）
const BED_C = [0.07273, 1.25032, 0.10914];   // 那一床（小動脈＋三條微血管＋小靜脈）的中心
const BN = [0.6358, -0.5524, 0.5388];        // 由心臟中心指向那裡的外向單位向量（心臟表面的法線）
const NU = [0.0793, 0.7413, 0.6664];         // 垂直於 BN、也垂直於微血管環開口方向：從這個方向看過去，環的深度（往心肌裡面）才不會被壓扁
const mix = (a, b, ka, kb) => { const v = [0, 1, 2].map((i) => ka * a[i] + kb * b[i]), l = Math.hypot(...v); return v.map((x) => x / l); };
const viewAt = (dir, d, tgt = BED_C) => ({ pos: [0, 1, 2].map((i) => tgt[i] + dir[i] * d), target: tgt });
const BED_T = [BED_C[0] - BN[0] * 0.0012, BED_C[1] - BN[1] * 0.0012, BED_C[2] - BN[2] * 0.0012];   // 環的中段（比表面深約 1 mm）

/* 標籤：key＝NAMES 的 key；at＝錨點；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  lv: { key: 'cardiovascular.left_ventricle', at: { part: CV + 'left_ventricle', dx: 0.02, dy: -0.015, dz: 0.03 }, side: 'r' },
  aorta: { key: 'aorta', at: { seg: 'aorta', u: 0.8 }, side: 'u' },
  lca: { key: 'lca', at: { seg: 'lca', u: 0.5 }, side: 'u' },
  rca: { key: 'rca', at: { seg: 'rca', u: 0.2 }, side: 'l' },
  muscle: { key: 'myocardium', at: { part: CV + 'left_ventricle', dx: 0.03, dy: -0.01, dz: 0.03 }, side: 'r' },
  art: { key: 'arteriole', at: { seg: 'sa_' + FOCUS, u: 0.5 }, side: 'l' },
  cap: { key: 'capillary', at: { seg: 'cp_' + FOCUS + '_2', u: 0.5 }, side: 'u' },
  ven: { key: 'venule', at: { seg: 'sv_' + FOCUS, u: 0.6 }, side: 'r' },
  veins: { key: 'cardiac_veins', at: { seg: 'gcv', u: 0.3 }, side: 'r' },
  veinsR: { key: 'cardiac_veins', at: { seg: 'scv', u: 0.22 }, side: 'l' },
  cs: { key: 'coronary_sinus', at: { seg: 'cs', u: 0.5 }, side: 'd' },
  ra: { key: 'cardiovascular.right_atrium', at: { seg: 'ra_in', u: 0.75 }, side: 'u' }
});

/* 說明文字。函式形式的會在執行時從 HumanTransportExchanges 讀出 2D 原文（確保沿用現有句子，不重抄）。 */
const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.'); // NEW（與其他場景同句）
const heartZone = (X) => X && X.zones.find((q) => q.id === 'heart');
// 取 2D 原文：中文第 para 段第 zs 句；英文第 para 段第 es 句（可給陣列合併多句，因為中英斷句不一一對應）
const zoneSent = (para, zs, es) => (X) => {
  const z = heartZone(X); if (!z) return P('', '');
  const zh = z.text[0].split('\n\n')[para].split('。').filter(Boolean), en = z.text[1].split('\n\n')[para].split(/(?<=\.)\s+/).filter(Boolean);
  return P(zh[zs] + '。', [].concat(es).map((i) => en[i]).join(' '));
};

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）。 */
const CAM = {
  front: { pos: [0.03, 1.31, 0.80], target: [0.03, 1.30, 0.06] },
  root: { pos: [0.06, 1.40, 0.32], target: [0.018, 1.322, 0.078] },
  heartF: { pos: [0.03, 1.31, 0.36], target: [0.03, 1.29, 0.09] },
  heartL: { pos: [0.20, 1.31, 0.30], target: [0.04, 1.285, 0.09] },
  heartR: { pos: [-0.12, 1.32, 0.32], target: [0.0, 1.29, 0.10] },
  bedFar: viewAt(mix(BN, NU, 1, 0.25), 0.11),
  bedNear: viewAt(mix(BN, NU, 0.55, 0.6), 0.055, BED_T),
  bedClose: viewAt(mix(BN, NU, 0.35, 0.94), 0.028, BED_T),
  backWide: { pos: [0.06, 1.32, -0.16], target: [0.03, 1.28, 0.06] },
  backCs: { pos: [0.04, 1.285, -0.045], target: [0.02, 1.272, 0.05] },
  raView: { pos: [0.045, 1.29, -0.045], target: [-0.003, 1.273, 0.058] }
};
const K = (t, name) => ({ t, ...CAM[name] });
// 背景器官壓低
const BG = { liver: 0.04, stomach: 0.03, spleen: 0.04, torso: 0.03, diaphragm: 0, cava: 0.12, lungs: 0.05, pulmArt: 0.12, pulmVein: 0.12 };

export const STEPS = Object.freeze([
  {
    id: 'aortic_root', dur: 10, btn: P('主動脈根部：冠狀動脈的起點', 'Aortic root: where coronary arteries begin'),
    title: P('① 主動脈根部：冠狀動脈的起點', '① The aortic root: where the coronary arteries begin'),
    text: [
      { src: 'NEW', p: P('左心室收縮，把血射進主動脈。主動脈剛離開心臟的地方，管壁上有兩個小開口，就是左、右冠狀動脈的起點。', 'The left ventricle contracts and drives blood into the aorta. Just above the heart, two small openings in the aortic wall are the starts of the left and right coronary arteries.') },
      { src: 'EXISTING', p: zoneSent(1, 0, 0) },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'front'), K(2.6, 'root'), K(10, 'root')],
    style: { ...BG, 'lit.cardiovascular.left_ventricle': 1, 'glow.coronA': 0.6, heart: 0.22, 'cardiovascular.left_ventricle': 0.5, aorta: 0.34, coronV: 0.25, genCapH: 0.1, genCapHF: 0.1 },
    flows: ['lv_out', 'aorta', 'root_L', 'root_R'],
    labels: [{ id: 'lv', at: [0.6, 5.4] }, { id: 'aorta', at: [2.8, 10] }, { id: 'lca', at: [4.2, 10] }, { id: 'rca', at: [5.0, 10] }],
    tracer: { path: ['lv_out', 'root_L'], from: 0.4, to: 9.6 }
  },
  {
    id: 'coronary_arteries', dur: 13, btn: P('左、右冠狀動脈', 'Left and right coronary arteries'),
    title: P('② 左、右冠狀動脈：把血送到心臟表面', '② Left and right coronary arteries: blood across the surface of the heart'),
    text: [
      { src: 'NEW', p: P('左冠狀動脈很快分成兩大支，繞過心臟的前面和左側；右冠狀動脈繞過心臟的右側和下方。它們一路分出愈來愈細的分支，布滿心臟表面。', 'The left coronary artery soon divides into two large branches that wrap around the front and left side of the heart; the right coronary artery runs around the right side and underside. They keep branching into ever finer vessels that cover the heart surface.') },
      { src: 'EXISTING', p: zoneSent(0, 0, [0, 1]) },
      { src: 'NEW', p: P('冠狀動脈送的是剛從肺回來、含氧多的血（鮮紅）。', 'The coronary arteries carry freshly oxygenated blood (bright red) straight from the lungs via the heart.') }
    ],
    camera: [K(0, 'root'), K(3.0, 'heartF'), K(6.0, 'heartL'), K(9.4, 'heartR'), K(13, 'heartF')],
    style: { ...BG, 'lit.heart': 0.5, 'glow.coronA': 0.8, heart: 0.16, 'cardiovascular.left_ventricle': 0.2, aorta: 0.3, coronV: 0.2, genCapH: 0.3, genCapHF: 0.35 },
    flows: ['root_L', 'root_R', 'lca', 'lad*', 'lcx*', 'rca*'],
    labels: [{ id: 'lca', at: [0, 4.0] }, { id: 'rca', at: [1.6, 12] }, { id: 'lv', at: [5.0, 9.0] }],
    tracer: { path: ['root_L', 'lca', 'tr_lad', 'lad_2'], from: 0, to: 14.5, startU: 0.9 }   // to > dur：步末停在 lad_2 上，接第 3 步
  },
  {
    id: 'capillaries', dur: 14, btn: P('心肌微血管：交換氧與養分', 'Myocardial capillaries: oxygen and nutrients'),
    title: P('③ 心肌微血管：把氧氣和養分交給心肌', '③ Myocardial capillaries: delivering oxygen and nutrients to heart muscle'),
    text: [
      { src: 'EXISTING', p: zoneSent(0, 0, [0, 1]) },
      { src: 'NEW', p: P('分支末端接上極細的微血管（畫面放大、示意）。血液在這裡把氧氣和養分交給心肌細胞，也收下二氧化碳；血色由鮮紅慢慢變成暗紅。', 'Each branch ends in very fine capillaries (enlarged, schematic). Here blood hands oxygen and nutrients to the heart-muscle cells and picks up CO₂; the colour changes slowly from bright to dark red.') },
      { src: 'EXISTING', p: zoneSent(1, 0, 0) }
    ],
    camera: [K(0, 'heartF'), K(3.2, 'bedFar'), K(5.4, 'bedNear'), K(7.4, 'bedClose'), K(14, 'bedClose')],
    style: { ...BG, 'lit.cardiovascular.left_ventricle': 0.4, 'glow.genCapHF': 1, 'glow.coronA': 0.5, 'glow.coronV': 0.4, heart: 0.1, 'cardiovascular.left_ventricle': 0.3, aorta: 0.12,
      coronA: 0.5, coronV: 0.45, genCapH: 0.16, genCapHF: 0.58 },
    flows: ['lad_2', ...ALL_SA, ...ALL_CP, ...ALL_SV],
    labels: [{ id: 'art', at: [4.8, 14] }, { id: 'cap', at: [5.6, 14] }, { id: 'ven', at: [6.4, 14] }, { id: 'muscle', at: [1.2, 4.2] }],
    tracer: { path: ['lad_2', 'sa_' + FOCUS, 'cp_' + FOCUS + '_1', 'sv_' + FOCUS], from: 0, to: 14, startU: 0.5 }
  },
  {
    id: 'cardiac_veins', dur: 13, btn: P('心靜脈匯進冠狀竇', 'Cardiac veins drain into the coronary sinus'),
    title: P('④ 心靜脈：把用過的血收回來，匯進冠狀竇', '④ Cardiac veins: collecting the used blood into the coronary sinus'),
    text: [
      { src: 'NEW', p: P('微血管匯成小靜脈，再匯進沿著動脈旁邊走的心靜脈（示意）。心靜脈一路匯集、愈來愈粗，多數注入心臟後面的冠狀竇。', 'Capillaries join into venules, which empty into cardiac veins running alongside the arteries (schematic). They merge into ever larger veins, and most of them end in the coronary sinus at the back of the heart.') },
      { src: 'EXISTING', p: zoneSent(0, 1, [2, 3]) },
      { src: 'NEW', p: P('這裡的血是缺氧血，含較多二氧化碳（暗紅）。', 'This blood is low in oxygen and carries more CO₂ (dark red).') }
    ],
    camera: [K(0, 'bedClose'), K(3.0, 'bedFar'), K(5.6, 'heartL'), K(8.6, 'backWide'), K(11.0, 'backCs'), K(13, 'backCs')],
    style: { ...BG, 'lit.heart': 0.3, 'glow.coronV': 1, heart: 0.1, 'cardiovascular.left_ventricle': 0.12, 'cardiovascular.left_atrium': 0.16, aorta: 0.1,
      coronA: 0.3, coronV: 0.58, genCapH: 0.2, genCapHF: 0.3 },
    flows: [...ALL_SV, 'v_*', 'gcv', 'plv', 'scv', 'cs'],
    labels: [{ id: 'veins', at: [3.2, 7.6] }, { id: 'veinsR', at: [6.0, 8.8] }, { id: 'cs', at: [9.0, 13] }],
    tracer: { path: ['sv_' + FOCUS, 'v_' + FOCUS, 'tr_gcv', 'cs'], from: 0, to: 12.6 }
  },
  {
    id: 'to_ra', dur: 11, btn: P('回到右心房', 'Back to the right atrium'),
    title: P('⑤ 回到右心房：接上小循環', '⑤ Back to the right atrium: on to the pulmonary circulation'),
    text: [
      { src: 'NEW', p: P('冠狀竇把心肌用過的血送進右心房，和從身體其他地方回來的血會合。', 'The coronary sinus empties the heart muscle’s used blood into the right atrium, where it joins the blood returning from the rest of the body.') },
      { src: 'EXISTING', p: zoneSent(1, 0, 0) },
      { src: 'NEW', p: P('接著右心房 → 右心室 → 肺動脈，進入小循環（肺循環）去換氣：心肌排出的二氧化碳最後從肺呼出。', 'Next: right atrium → right ventricle → pulmonary artery, into the pulmonary circulation, where the CO₂ released by the heart muscle is finally exhaled.') }
    ],
    camera: [K(0, 'backCs'), K(3.4, 'raView'), K(11, 'raView')],
    style: { ...BG, 'lit.cardiovascular.right_atrium': 1, 'glow.coronV': 0.6, heart: 0.3, 'cardiovascular.right_atrium': 0.58, aorta: 0.1,
      coronA: 0.2, coronV: 0.56, genCapH: 0.1, genCapHF: 0.15 },
    flows: ['cs', 'ra_in', 'v_rca_4', 'v_rca_9', 'v_rca_12'],
    labels: [{ id: 'cs', at: [0, 5.0] }, { id: 'ra', at: [3.6, 11] }],
    tracer: { path: ['cs', 'ra_in'], from: 0, to: 10.4, startU: 0.55 }
  }
]);

export const SCENE = Object.freeze({
  ...BEST_SCENE,   // 全部循環共用的最佳模板（ht3d_preset_1122_v1.js）：全身血管底圖、血管底線、亮度對比、血球同色發光

  id: 'heart', name: P('心臟：冠狀循環', 'Heart: coronary circulation'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/heart_centerlines_v1.json?v=20261123-h5',
  names: NAMES, labelAllow: LABEL_ALLOW, groups: { ...GROUPS, ...BEST_GROUPS }, material: MATERIAL, baseStyle: { ...BASE_STYLE, ...BEST_BASE }, flow: FLOW, flowKey, tubeGroup,
  // 冠狀動脈不畫資料集的網格外殼，改畫成單層、半徑漸變的管（網格估計值留在 JSON 的 radius_mesh）；末端小動脈（sa_）併入同一組
  // 冠狀靜脈（資料集沒有）全部是程式生成的示意管，同一個材質、同一個 mesh，接點不會有色差或接縫
  replaceMesh: { coronA: ['lca', 'lad*', 'lcx*', 'rca*', 'sa_*'], coronV: ['gcv', 'plv', 'scv', 'cs', 'v_*', 'sv_*'] },
  replaceStyle: { coronA: { kind: 'artery', mat: 'coronA', radial: [16, 8] }, coronV: { kind: 'vein', mat: 'coronV', radial: [16, 8] } },
  vesselFloor: bestFloor({ genCapH: 0, genCapHF: 0 }),   // 微血管只在自己那一步出現，其餘血管（含全身血管底圖）一直畫在畫面上
  smoothTubes: true,   // 生成的小血管用變半徑管；接點兩端不封口的段在 JSON 寫 capStart／capEnd: false
  lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [...AORTA],
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('心靜脈、冠狀竇、微血管為示意｜放大', 'Cardiac veins, coronary sinus and capillaries: schematic, enlarged'),
  credit: P('3D 模型：Z-Anatomy／BodyParts3D，CC BY-SA 4.0', '3D model: Z-Anatomy / BodyParts3D, CC BY-SA 4.0'),
  schematic: P('心臟場景的小分支為示意：冠狀動脈的樹狀分支依資料集網格（左、右冠狀動脈與其分支），但每條分支末端的小動脈、心肌微血管、小靜脈、伴行的心靜脈（大心靜脈、小心靜脈、後室靜脈、前心靜脈）與冠狀竇，資料集裡沒有，是程式生成的示意，不是解剖資料；微血管與小血管的口徑、血球都放大很多，速度為教學示意。冠狀動脈與主動脈的中心線與半徑由網格自動估算。',
    'Small branches in the heart scene are schematic: the coronary artery tree follows the dataset meshes (left and right coronary arteries and their branches), but the terminal arterioles, myocardial capillaries, venules, the companion cardiac veins (great, small, posterior and anterior) and the coronary sinus are not in the dataset; they are generated diagrams, not anatomical data. Capillaries, small vessels and cells are greatly enlarged and speeds are illustrative. Centrelines and radii of the coronary arteries and the aorta are estimated automatically from the meshes.')
});
export default SCENE;
