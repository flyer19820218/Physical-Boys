/* ht3d_scene_kidney_1122_v1.js
 * 3D 醫學版血液循環｜腎臟路線的「資料與步驟」。核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_small_intestine_1122_v1.js。
 *
 * 路線：心臟 → 主動脈 → 腎動脈 → 腎臟內小動脈（示意）→ 腎絲球（示意）→ 管周微血管（示意）→ 腎靜脈 → 下腔靜脈 → 右心房。
 * 這個檔只放資料，不放繪圖程式。中心線在 kidney_centerlines_v1.json（tools/anatomy/build_kidney_centerlines.py 產生）：
 *   mesh 段（半徑取自網格）：lv_out, aorta, aorta_lower, renal_a_L/R, renal_ant_L/R, renal_post_L/R, renal_v_L/R, ivc_low, ivc_upper
 *   示意段（腎臟內部，口徑放大）：
 *     左腎 5 支（L0..L4）、右腎 3 支（R0..R2），每支：kart_<側><k>（葉間→弓狀→小葉間→入球小動脈）、kglom_<側><k>（腎絲球，螺旋放大）、
 *     kcap_<側><k>_<j>（出球小動脈＋管周微血管，左 3 條／右 2 條交織）、kven_<側><k>（小葉間→弓狀→葉間靜脈，匯入腎靜脈起點）
 *   例：左腎第 2 支的完整路徑 ＝ renal_ant_L → kart_L1 → kglom_L1 → kcap_L1_0 → kven_L1 → renal_v_L → ivc_upper
 * 座標：公尺；+Y 向上、+Z 向前（胸腹前面）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述（查證出處見 sources.md「腎臟場景」）。src：EXISTING＝現有頁面原句；ADAPTED＝小改；NEW／COORD＝新增（待老師審）。
 */

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表（只放有出處的；zh_review 的不放） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.left_ventricle': { zh: '左心室', en: 'Left ventricle' },
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  'cardiovascular.abdominal_aorta': { zh: '腹主動脈', en: 'Abdominal aorta' },
  renal_artery: { zh: '腎動脈', en: 'Renal artery' },
  renal_vein: { zh: '腎靜脈', en: 'Renal vein' },
  kidney: { zh: '腎臟', en: 'Kidney' },
  ivc: { zh: '下腔靜脈', en: 'Inferior vena cava', note: '（國中課本：下大靜脈）' },
  // 泛稱／示意（程式生成的部分）
  intrarenal_arteries: { zh: '腎內小動脈（示意）', en: 'Arterioles in the kidney (schematic)' },
  glomerulus: { zh: '腎絲球（示意）', en: 'Glomerulus (schematic)', note: '（也稱腎小球）' },
  peritubular: { zh: '微血管（示意）', en: 'Capillaries (schematic)' },
  intrarenal_veins: { zh: '腎內小靜脈（示意）', en: 'Venules in the kidney (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(['cardiovascular.left_ventricle', 'cardiovascular.right_atrium', 'aorta', 'cardiovascular.abdominal_aorta',
  'renal_artery', 'renal_vein', 'kidney', 'ivc', 'intrarenal_arteries', 'glomerulus', 'peritubular', 'intrarenal_veins']);

/* ---------- 結構分組（依 si_parts_v1.json 的 id） ---------- */
const HEART = ['cardiovascular.left_atrium', 'cardiovascular.left_ventricle', 'cardiovascular.right_atrium', 'cardiovascular.right_ventricle'];
const LEAFLETS = ['cardiovascular.left_coronary_leaflet', 'cardiovascular.right_coronary_leaflet', 'cardiovascular.non_coronary_leaflet'];
const LUNGS = ['visceral.superior_lobe_of_left_lung', 'visceral.inferior_lobe_of_left_lung', 'visceral.superior_lobe_of_right_lung', 'visceral.middle_lobe_of_right_lung', 'visceral.inferior_lobe_of_right_lung'];
const GUT = ['visceral.duodenum', 'visceral.jejunum', 'visceral.ileum'];
const COLON = ['visceral.ascending_colon', 'visceral.transverse_colon', 'visceral.descending_colon', 'visceral.sigmoid_colon', 'visceral.vermiform_appendix'];
const AORTA = ['cardiovascular.ascending_aorta', 'cardiovascular.aortic_arch', 'cardiovascular.thoracic_aorta', 'cardiovascular.abdominal_aorta'];
const IVC = ['cardiovascular.inferior_vena_cava_abdominal_part', 'cardiovascular.inferior_vena_cava_thoracic_part'];
const RENAL_ART = ['cardiovascular.left_renal_artery', 'cardiovascular.right_renal_artery',
  'cardiovascular.anterior_branch_of_renal_artery_l', 'cardiovascular.posterior_branch_of_renal_artery_l',
  'cardiovascular.anterior_branch_of_renal_artery_r', 'cardiovascular.posterior_branch_of_renal_artery_r'];
const RENAL_VEIN = ['cardiovascular.left_renal_vein', 'cardiovascular.right_renal_vein'];
export const GROUPS = Object.freeze({
  torso: ['regions.torso_surface'], heart: HEART, leaflets: LEAFLETS, lungs: LUNGS, gut: GUT, colon: COLON,
  liver: ['visceral.liver'], stomach: ['visceral.stomach'], pancreas: ['visceral.pancreas'], spleen: ['lymphoid.spleen'], diaphragm: ['muscular.diaphragm'],
  kidneyL: ['visceral.fibrous_capsule_of_kidney_l'], kidneyR: ['visceral.fibrous_capsule_of_kidney_r'],
  aorta: AORTA, renalArt: RENAL_ART, renalVein: RENAL_VEIN, ivc: IVC,
  // 程式生成的示意管（核心依 tubeGroup 建管；第一個元素是合併後 mesh 的結構 id）
  genArt: ['@kart'], genGlom: ['@kglom'], genCap: ['@kcap'], genVen: ['@kven'], genBridge: ['@bridge']
});
export const MATERIAL = Object.freeze({
  'visceral.liver': { color: '#7d3328', sheen: '#c4746a', rough: 0.5 },
  'visceral.stomach': { color: '#c98d82', sheen: '#efc7bd', rough: 0.6 },
  'visceral.pancreas': { color: '#d6b07c', sheen: '#f3dcb8', rough: 0.65 },
  'lymphoid.spleen': { color: '#74304a', sheen: '#b4687e', rough: 0.55 },
  gut: { color: '#c87461', sheen: '#f0b5a3', rough: 0.5 },
  colon: { color: '#b98f78', sheen: '#e4c7b5', rough: 0.65 },
  lungs: { color: '#d9a6a2', sheen: '#f6d8d4', rough: 0.7 },
  heart: { color: '#a5333b', sheen: '#e08b8b', rough: 0.5 },
  leaflets: { color: '#e7c9b0', sheen: '#fff0e0', rough: 0.6 },
  kidneyL: { color: '#8a3a36', sheen: '#c9837a', rough: 0.55 },
  kidneyR: { color: '#8a3a36', sheen: '#c9837a', rough: 0.55 },
  diaphragm: { color: '#a8564c', sheen: '#dca095', rough: 0.7 },
  torso: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#55162c', rim: '#c0607e', rough: 0.36 }
});
/* 預設透明度（1 = 不透明主角）。血管透明度不要 ≥ 0.6（會開啟寫深度，把裡面的血球擋住）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.05, heart: 0.3, leaflets: 0, lungs: 0.08, gut: 0.12, colon: 0.1, liver: 0.16, stomach: 0.12, pancreas: 0.14, spleen: 0.16, diaphragm: 0,
  kidneyL: 0.3, kidneyR: 0.3, otherArteries: 0.2, otherVeins: 0.2,
  aorta: 0.5, renalArt: 0.58, renalVein: 0.58, ivc: 0.5,
  genArt: 0.7, genGlom: 0.75, genCap: 0.75, genVen: 0.7, genBridge: 0.5
});

/* ---------- 血流（公尺／秒，教學速度，不是真實速度） ---------- */
export const HEART_PERIOD = 1.0;
export const FLOW = Object.freeze({
  lv_out: { type: 'pulse', v: 0.07, density: 260 },
  aorta: { type: 'pulse', v: 0.11, density: 520 },
  aorta_lower: { type: 'pulse', v: 0.09, density: 400, fadeEnd: true },
  renal_a: { type: 'pulse', v: 0.05, density: 320 },
  renal_br: { type: 'pulse', v: 0.04, density: 220 },
  k_art: { type: 'pulseSoft', v: 0.02, density: 240 },
  k_glom: { type: 'slow', v: 0.006, density: 0, spacing: 0.0012, singleFile: true },
  k_cap: { type: 'slow', v: 0.005, density: 0, spacing: 0.0012, singleFile: true },
  k_ven: { type: 'steady', v: 0.012, density: 240 },
  renal_v: { type: 'steady', v: 0.025, density: 380 },
  ivc_low: { type: 'steady', v: 0.035, density: 420, fadeStart: true },
  ivc_upper: { type: 'steady', v: 0.035, density: 520 }
});
/* 區段 id → FLOW 型態 */
export function flowKey(seg) {
  if (/^kart_/.test(seg)) return 'k_art';
  if (/^kglom_/.test(seg)) return 'k_glom';
  if (/^kcap_/.test(seg)) return 'k_cap';
  if (/^kven_/.test(seg)) return 'k_ven';
  if (/^renal_a_/.test(seg)) return 'renal_a';
  if (/^renal_(ant|post)_/.test(seg)) return 'renal_br';
  if (/^renal_v_/.test(seg)) return 'renal_v';
  return seg;
}
/* 生成的示意管要畫成哪一組（mesh 段不用畫，glb 已有） */
export function tubeGroup(seg) {
  if (/^kart_/.test(seg)) return 'genArt';
  if (/^kglom_/.test(seg)) return 'genGlom';
  if (/^kcap_/.test(seg)) return 'genCap';
  if (/^kven_/.test(seg)) return 'genVen';
  return null;
}
/* 下腔靜脈上端到右心房開口之間，資料集網格有約 2 cm 空隙：用示意管接起來（同小腸場景） */
export const BRIDGE = Object.freeze({ seg: 'ivc_upper', fromY: 1.262, radius: 0.0092 });
export const LUMEN_MESH = Object.freeze({
  aorta: AORTA, aorta_lower: ['cardiovascular.abdominal_aorta'], ivc_low: IVC,
  renal_a_L: ['cardiovascular.left_renal_artery', 'cardiovascular.abdominal_aorta'], renal_a_R: ['cardiovascular.right_renal_artery', 'cardiovascular.abdominal_aorta'],
  renal_ant_L: ['cardiovascular.anterior_branch_of_renal_artery_l'], renal_post_L: ['cardiovascular.posterior_branch_of_renal_artery_l'],
  renal_ant_R: ['cardiovascular.anterior_branch_of_renal_artery_r'], renal_post_R: ['cardiovascular.posterior_branch_of_renal_artery_r'],
  renal_v_L: ['cardiovascular.left_renal_vein', ...IVC], renal_v_R: ['cardiovascular.right_renal_vein', ...IVC]
});

/* ---------- 步驟 ---------- */
const LK = [0, 1, 2, 3, 4], RK = [0, 1, 2];
const seg = (pre, ks, side) => ks.map((k) => pre + side + k);
const KART = [...seg('kart_', LK, 'L'), ...seg('kart_', RK, 'R')];
const KGLOM = [...seg('kglom_', LK, 'L'), ...seg('kglom_', RK, 'R')];
const KCAP = [...LK.flatMap((k) => [0, 1, 2].map((j) => `kcap_L${k}_${j}`)), ...RK.flatMap((k) => [0, 1].map((j) => `kcap_R${k}_${j}`))];
const KVEN = [...seg('kven_', LK, 'L'), ...seg('kven_', RK, 'R')];
export const FOCUS_GLOM = 'kglom_L1';   // 鏡頭飛近、放大窗出現的那一個腎絲球（左腎第 2 支；從左前外側看得到）

/* 標籤：key＝NAMES 的 key；at＝錨點（區段 id＋比例，或結構 id 的 centroid＋位移）；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  lv: { key: 'cardiovascular.left_ventricle', at: { part: 'cardiovascular.left_ventricle', dx: 0.012, dy: -0.012, dz: 0.02 }, side: 'r' },
  aorta: { key: 'aorta', at: { seg: 'aorta', u: 0.25 }, side: 'u' },
  aortaAbd: { key: 'cardiovascular.abdominal_aorta', at: { seg: 'aorta', u: 0.9 }, side: 'l' },
  renalA_L: { key: 'renal_artery', at: { seg: 'renal_a_L', u: 0.55 }, side: 'u' },
  renalA_R: { key: 'renal_artery', at: { seg: 'renal_a_R', u: 0.6 }, side: 'd' },
  kidneyL: { key: 'kidney', at: { part: 'visceral.fibrous_capsule_of_kidney_l', dx: 0.012, dy: 0.03, dz: 0.02 }, side: 'r' },
  kidneyR: { key: 'kidney', at: { part: 'visceral.fibrous_capsule_of_kidney_r', dx: -0.012, dy: 0.03, dz: 0.02 }, side: 'l' },
  kart: { key: 'intrarenal_arteries', at: { seg: 'kart_L2', u: 0.6 }, side: 'r' },
  glom: { key: 'glomerulus', at: { seg: FOCUS_GLOM, u: 0.5 }, side: 'r' },
  caps: { key: 'peritubular', at: { seg: 'kcap_L1_2', u: 0.35 }, side: 'r' },
  kven: { key: 'intrarenal_veins', at: { seg: 'kven_L1', u: 0.2 }, side: 'd' },
  renalV: { key: 'renal_vein', at: { seg: 'renal_v_L', u: 0.4 }, side: 'd' },
  ivc: { key: 'ivc', at: { seg: 'ivc_upper', u: 0.55 }, side: 'l' },
  ra: { key: 'cardiovascular.right_atrium', at: { part: 'cardiovascular.right_atrium', dx: -0.012, dy: 0.01, dz: 0.01 }, side: 'l' }
});

/* 說明文字。src：EXISTING＝現有頁面原句；ADAPTED＝小改；NEW＝新增（待老師審）；COORD＝協調者提供的有依據敘述（待老師審）。
 * 函式形式的會在執行時從 HumanTransportExchanges 讀出原文（確保沿用現有句子，不重抄）。 */
const HINT = P('名稱不用背，看血往哪裡流、做什麼事。', 'No need to memorise names: follow where the blood flows and what happens.'); // NEW
// 取 2D 原文的第 para 段、第 sent 句（中文以「。」、英文以「. 」切句）
const sentOf = (zh, en, para, sent) => {
  const z = zh.split('\n\n')[para].split('。').filter(Boolean), e = en.split('\n\n')[para].split(/(?<=\.)\s+/).filter(Boolean);
  return P(z[sent] + '。', e[sent]);
};
const zoneSent = (zone, para, sent) => (X) => { const z = X && X.zones.find((q) => q.id === zone); return z ? sentOf(z.text[0], z.text[1], para, sent) : P('', ''); };
const extraOf = (X) => X && X.explain({ exchange: 'kidney', kidneyView: 'extension' });
const extraSent = (para, sent) => (X) => { const e = extraOf(X); return e ? sentOf(e.text[0], e.text[1], para, sent) : P('', ''); };

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）；格與格之間用平滑樣條緩動。
 * 腎絲球 kglom_L1 中點約 (0.0785, 1.133, 0.035)；從左前外側 (0.55, 0.15, 0.82) 方向看，前方只有半透明的腎臟外殼。 */
const CAM = {
  front: { pos: [0.02, 1.16, 0.95], target: [0.0, 1.14, 0.06] },
  heart: { pos: [0.17, 1.33, 0.46], target: [0.02, 1.30, 0.07] },
  archL: { pos: [0.33, 1.36, 0.30], target: [0.015, 1.29, 0.05] },
  aortaDown: { pos: [0.30, 1.20, 0.40], target: [0.01, 1.17, 0.06] },
  renalOrigin: { pos: [0.22, 1.15, 0.40], target: [0.01, 1.12, 0.06] },
  renalBoth: { pos: [0.0, 1.16, 0.40], target: [0.0, 1.11, 0.04] },
  kidneyL: { pos: [0.17, 1.15, 0.26], target: [0.058, 1.12, 0.035] },
  glomNear: { pos: [0.128, 1.146, 0.109], target: [0.0785, 1.133, 0.035] },
  glomClose: { pos: [0.0961, 1.1378, 0.0612], target: [0.0785, 1.133, 0.035] },
  capView: { pos: [0.110, 1.138, 0.086], target: [0.077, 1.129, 0.036] },
  hilum: { pos: [0.12, 1.15, 0.30], target: [0.03, 1.11, 0.05] },
  ivcUp: { pos: [-0.16, 1.20, 0.38], target: [-0.012, 1.17, 0.075] },
  raEnd: { pos: [-0.20, 1.29, 0.40], target: [-0.012, 1.27, 0.075] }
};
const K = (t, name) => ({ t, ...CAM[name] });
// 背景器官（小腸、大腸、肝、胃、胰、脾）壓低，免得擋住腎與血管
const BG = { gut: 0.05, colon: 0.04, liver: 0.08, stomach: 0.06, pancreas: 0.05, spleen: 0.08, lungs: 0.06, torso: 0.03 };

export const STEPS = Object.freeze([
  {
    id: 'leave_heart', dur: 10, btn: P('離開心臟：主動脈', 'Leaving the heart: aorta'),
    title: P('① 離開心臟：主動脈', '① Leaving the heart: the aorta'),
    text: [
      { src: 'ADAPTED', p: P('左心室收縮時把富氧血送入主動脈，供應全身組織。', 'The left ventricle contracts to send oxygen-rich blood into the aorta for body tissues.') },
      { src: 'NEW', p: P('主動脈一路往下，到腎臟的高度分出腎動脈。', 'The aorta runs down and gives off the renal arteries at the level of the kidneys.') },
      { src: 'NEW', p: HINT }
    ],
    camera: [K(0, 'front'), K(2.2, 'heart'), K(5.0, 'archL'), K(7.6, 'aortaDown'), K(10, 'renalOrigin')],
    style: { ...BG, 'deep.heart': 0.6, 'glow.aorta': 1, heart: 0.55, 'cardiovascular.left_ventricle': 0.62, renalArt: 0.45, renalVein: 0.3, ivc: 0.3,
      genArt: 0, genGlom: 0, genCap: 0, genVen: 0, genBridge: 0.35 },
    flows: ['lv_out', 'aorta', 'aorta_lower'],
    labels: [{ id: 'lv', at: [0.6, 5.2] }, { id: 'aorta', at: [3.0, 6.8] }, { id: 'aortaAbd', at: [7.4, 10] }],
    tracer: { path: ['lv_out', 'aorta', 'renal_a_L'], from: 0.4, to: 9.6 }
  },
  {
    id: 'renal_artery', dur: 11, btn: P('腎動脈送血進腎臟', 'Renal arteries into the kidneys'),
    title: P('② 腎動脈：把血送進腎臟', '② Renal arteries: blood into the kidneys'),
    text: [
      { src: 'NEW', p: P('腎動脈直接從腹主動脈分出：左邊較短、較平，右邊較長、斜向下。', 'The renal arteries branch straight off the abdominal aorta: the left one is shorter and more level, the right one longer and sloping down.') },
      { src: 'NEW', p: P('腎臟不大，卻分到心臟送出血液的約 20～25%。', 'The kidneys are small, yet they receive about 20–25% of the blood the heart pumps out.') },
      { src: 'NEW', p: P('進了腎臟，血管愈分愈細，變成許多小動脈（示意）。', 'Inside the kidney the vessels branch into ever-finer arterioles (schematic).') }
    ],
    camera: [K(0, 'renalOrigin'), K(3.0, 'renalBoth'), K(6.6, 'renalBoth'), K(9.2, 'kidneyL'), K(11, 'kidneyL')],
    style: { ...BG, 'deep.kidneyL': 1, 'deep.kidneyR': 0.6, 'glow.renalArt': 1, 'glow.genArt': 0.9, 'glow.aorta': 0.5, heart: 0.2, aorta: 0.45,
      kidneyL: 0.3, kidneyR: 0.28, renalArt: 0.58, renalVein: 0.25, ivc: 0.25, genArt: 0.55, genGlom: 0.5, genCap: 0.3, genVen: 0.25, genBridge: 0.3 },
    flows: ['aorta', 'aorta_lower', 'renal_a_L', 'renal_a_R', 'renal_ant_L', 'renal_ant_R', 'renal_post_L', 'renal_post_R', ...KART],
    labels: [{ id: 'aortaAbd', at: [0, 3.0] }, { id: 'renalA_L', at: [1.6, 11] }, { id: 'renalA_R', at: [2.4, 6.8] }, { id: 'kidneyR', at: [3.2, 6.8] },
      { id: 'kidneyL', at: [4.0, 8.6] }, { id: 'kart', at: [8.8, 11] }],
    tracer: { path: ['renal_a_L', 'renal_ant_L', 'kart_L1'], from: 0.3, to: 10.6, startU: 0.9 }
  },
  {
    id: 'glomerulus', dur: 12, btn: P('腎絲球（不考）', 'Glomerulus (non-exam)'),
    title: (X) => { const e = extraOf(X); return e ? P('③ ' + e.title[0], '③ ' + e.title[1]) : P('③ 延伸閱讀／不考：腎臟過濾與再吸收', '③ Extra / non-exam: filtration and reabsorption'); },
    text: [
      { src: 'NEW', p: P('小動脈把血送進腎絲球，它是一團微血管（示意；實際直徑約 0.2 毫米）。', 'An arteriole carries blood into the glomerulus, a tuft of capillaries (schematic; really about 0.2 mm across).') },
      { src: 'EXISTING', p: extraSent(0, 1) },
      { src: 'ADAPTED', p: P('葡萄糖也會被濾出，但正常會再吸收回血液；每天濾出約 180 公升，最後的尿只有約 1.5 公升。', 'Glucose is filtered too, but is normally reabsorbed into the blood; about 180 litres are filtered each day, yet only about 1.5 litres leave as urine.') }
    ],
    camera: [K(0, 'kidneyL'), K(2.8, 'glomNear'), K(4.8, 'glomClose'), K(12, 'glomClose')],
    style: { ...BG, 'deep.kidneyL': 0.8, 'glow.genGlom': 1, 'glow.genArt': 0.5, heart: 0.1, aorta: 0.3, kidneyL: 0.16, kidneyR: 0.2,
      renalArt: 0.45, renalVein: 0.25, ivc: 0.2, genArt: 0.55, genGlom: 0.55, genCap: 0.5, genVen: 0.35, genBridge: 0.2 },
    flows: [...KART, ...KGLOM],
    labels: [{ id: 'kidneyL', at: [0, 2.6] }, { id: 'kart', at: [0, 2.4] }, { id: 'glom', at: [2.6, 5.4] }],
    tracer: { path: ['kart_L1', 'kglom_L1'], from: 0, to: 11.5, startU: 0.85 },
    window: { kind: 'kidney_filter', open: [5.0, 6.0], close: [11.2, 12], focus: { seg: FOCUS_GLOM, u: 0.5 },
      tag: P('放大：腎絲球（示意，不考）', 'Enlarged: glomerulus (schematic, non-exam)') }   // tag 不換行：手機 430 寬時太長會被切掉
  },
  {
    id: 'kidney_cells', dur: 12, btn: P('微血管與腎細胞', 'Capillaries and kidney cells'),
    title: (X) => { const z = X && X.zones.find((q) => q.id === 'kidney'); return z ? P('④ ' + z.title[0], '④ ' + z.title[1]) : P('④ 腎細胞也要養分：進氧氣、葡萄糖，出二氧化碳', '④ Kidney cells: oxygen and glucose in, CO₂ out'); },
    text: [
      { src: 'NEW', p: P('血離開腎絲球後，流進腎小管周圍的微血管（示意）。', 'After the glomerulus, blood flows into the capillaries around the kidney tubules (schematic).') },
      { src: 'EXISTING', p: zoneSent('kidney', 0, 1) },
      { src: 'EXISTING', p: zoneSent('kidney', 1, 0) }
    ],
    camera: [K(0, 'glomClose'), K(2.6, 'capView'), K(12, 'capView')],
    style: { ...BG, 'deep.kidneyL': 0.8, 'glow.genCap': 1, 'glow.genGlom': 0.4, 'glow.genVen': 0.5, heart: 0.1, aorta: 0.3, kidneyL: 0.16, kidneyR: 0.2,
      renalArt: 0.35, renalVein: 0.3, ivc: 0.2, genArt: 0.5, genGlom: 0.55, genCap: 0.55, genVen: 0.55, genBridge: 0.2 },
    flows: [...KGLOM, ...KCAP, ...KVEN],
    labels: [{ id: 'glom', at: [0, 1.8] }, { id: 'caps', at: [1.0, 4.6] }, { id: 'kven', at: [2.6, 4.6] }],
    tracer: { path: ['kglom_L1', 'kcap_L1_0', 'kven_L1'], from: 0, to: 14, startU: 0.92 },   // to > dur：步末停在腎內小靜脈末段，接第 5 步,
    window: { kind: 'kidney', open: [4.6, 5.6], focus: { seg: 'kcap_L1_0', u: 0.5 },
      tag: P('放大：腎細胞的交換（示意）', 'Enlarged: exchange with kidney cells (schematic)') }
  },
  {
    id: 'renal_vein', dur: 11, btn: P('腎靜脈回心臟', 'Renal vein back to the heart'),
    title: P('⑤ 腎靜脈：回到心臟', '⑤ Renal veins: back to the heart'),
    text: [
      { src: 'NEW', p: P('小靜脈一路匯集成腎靜脈；左腎靜脈較長，從腹主動脈前方橫過去。', 'Venules join up into the renal vein; the left renal vein is longer and crosses in front of the abdominal aorta.') },
      { src: 'COORD', p: P('腎靜脈把處理過的血送進下腔靜脈（國中課本：下大靜脈），回到右心房。', 'The renal veins carry the processed blood into the inferior vena cava and back to the right atrium.') },
      { src: 'NEW', p: P('腎臟的靜脈血不經過肝臟，直接進入下腔靜脈。', 'Blood from the kidneys does not pass through the liver; it goes straight into the inferior vena cava.') }
    ],
    camera: [K(0, 'capView'), K(2.6, 'hilum'), K(6.0, 'hilum'), K(8.6, 'ivcUp'), K(11, 'raEnd')],
    style: { ...BG, 'deep.cardiovascular.right_atrium': 0.8, 'glow.renalVein': 1, 'glow.ivc': 1, 'glow.genVen': 0.7, heart: 0.4, 'cardiovascular.right_atrium': 0.62,
      aorta: 0.3, kidneyL: 0.28, kidneyR: 0.24, renalArt: 0.3, renalVein: 0.58, ivc: 0.55, genArt: 0.2, genGlom: 0.3, genCap: 0.4, genVen: 0.55, genBridge: 0.5 },
    flows: [...KVEN, 'renal_v_L', 'renal_v_R', 'ivc_low', 'ivc_upper'],
    labels: [{ id: 'kven', at: [0.8, 3.6] }, { id: 'renalV', at: [1.8, 7.0] }, { id: 'ivc', at: [6.2, 11] }, { id: 'ra', at: [8.8, 11] }],
    tracer: { path: ['kven_L1', 'renal_v_L', 'ivc_upper'], from: 3.0, to: 10.8, startU: 0.94 },
    window: { kind: 'kidney', close: [0, 0.9], focus: { seg: 'kcap_L1_0', u: 0.5 }, tag: P('放大：腎細胞的交換（示意）', 'Enlarged: exchange with kidney cells (schematic)') }
  }
]);

export const SCENE = Object.freeze({
  id: 'kidney', name: P('腎臟路線', 'Kidney route'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/kidney_centerlines_v1.json',
  names: NAMES, labelAllow: LABEL_ALLOW, groups: GROUPS, material: MATERIAL, baseStyle: BASE_STYLE, flow: FLOW, flowKey, tubeGroup,
  bridge: BRIDGE, lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [...AORTA, ...RENAL_ART, ...RENAL_VEIN, ...IVC],
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('腎內小分支為示意｜血球與血管放大', 'Vessels inside the kidney are schematic | cells and vessels enlarged'),
  credit: P('3D 模型：Z-Anatomy／BodyParts3D，CC BY-SA 4.0；腎臟外形：Human Reference Atlas，CC BY 4.0', '3D model: Z-Anatomy / BodyParts3D, CC BY-SA 4.0; kidney shape: Human Reference Atlas, CC BY 4.0'),
  schematic: P('腎臟場景的小分支為示意：腎臟內部的小動脈、腎絲球、管周微血管、小靜脈，以及下腔靜脈接到右心房的那一小段，是程式生成的示意，不是解剖資料；口徑與血球都放大、速度為教學示意。腎動脈、腎靜脈、主動脈、下腔靜脈的中心線與半徑由網格自動估算。',
    'Small branches in the kidney scene are schematic: the arterioles, glomeruli, peritubular capillaries and venules inside the kidney, and the short link from the inferior vena cava into the right atrium, are generated diagrams, not anatomical data. Calibres and cells are enlarged and speeds are illustrative. Centrelines and radii of the aorta, renal arteries, renal veins and inferior vena cava are estimated automatically from the meshes.')
});
export default SCENE;
