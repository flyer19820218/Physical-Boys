/* ht3d_scene_liver_1122_v1.js
 * 3D 醫學版血液循環｜肝臟路線的「資料與步驟」。核心引擎在 ht3d_core_1122_v1.js，格式照 ht3d_scene_small_intestine_1122_v1.js。
 *
 * 路線：主動脈 → 腹腔動脈幹 → 肝動脈 → 肝內動脈分支（示意）┐
 *       小腸、脾 → 腸繫膜上靜脈＋脾靜脈 → 肝門靜脈 → 肝內門靜脈分支（示意）┴→ 肝竇（示意）→ 中央靜脈（示意）→ 肝靜脈 → 下腔靜脈 → 右心房
 * 中心線在 liver_centerlines_v1.json（tools/anatomy/build_liver_centerlines.py 產生，見 sources.md「肝臟場景」）：
 *   mesh 段：aorta（到腹腔動脈幹起點）、smv、splenic、portal、ivc_lower、ivc_upper（門靜脈 5.0→4.6 mm 重設口徑）
 *   肝動脈：trunk_ha ＝ 資料集的腹腔動脈幹＋肝總動脈，後段（固有肝動脈到肝門）為程式生成
 *   示意段（肝內）：pt{層}_{n} 門靜脈分支、at{層}_{n} 肝動脈分支（與門靜脈分支並行）、ht{層}_{n} 肝靜脈分支（血流方向朝下腔靜脈）、
 *                  sn_* 肝竇（大尺度連接）、lb_* 放大的肝小葉（lb_venule／lb_arteriole／lb_feed_*／lb_central／lb_sin_*）
 * 座標：公尺；+Y 向上、+Z 向前（胸腹前面）、+X 為人體左側。鏡頭在 +Z 往 -Z 看時，畫面左邊＝人體右側。
 *
 * 科學敘述（查證出處見 sources.md「肝臟場景」）。src：EXISTING＝現有頁面原句；COORD＝協調者提供、有依據的敘述；NEW＝新增（待老師審）。
 * 肝內所有分支都是示意：分叉依「空間殖民＋分支定律」生成，不是真實解剖；肝竇與肝小葉為了看得見而放大。
 */

const P = (zh, en) => [zh, en];

/* ---------- 名稱覆寫表（只放有出處的；zh_review 的不放） ---------- */
export const NAMES = Object.freeze({
  'cardiovascular.right_atrium': { zh: '右心房', en: 'Right atrium' },
  'cardiovascular.abdominal_aorta': { zh: '腹主動脈', en: 'Abdominal aorta' },
  aorta: { zh: '主動脈', en: 'Aorta' },
  'cardiovascular.coeliac_trunk': { zh: '腹腔動脈幹', en: 'Coeliac trunk' },
  hepatic_artery: { zh: '肝動脈', en: 'Hepatic artery' },
  'cardiovascular.hepatic_portal_vein_2': { zh: '肝門靜脈', en: 'Hepatic portal vein' },
  'cardiovascular.superior_mesenteric_vein': { zh: '腸繫膜上靜脈', en: 'Superior mesenteric vein' },
  'cardiovascular.splenic_vein': { zh: '脾靜脈', en: 'Splenic vein' },
  'visceral.liver': { zh: '肝臟', en: 'Liver' },
  'cardiovascular.hepatic_veins': { zh: '肝靜脈', en: 'Hepatic veins' },
  ivc: { zh: '下腔靜脈', en: 'Inferior vena cava', note: '（國中課本：下大靜脈）' },
  // 泛稱／示意（程式生成的部分）
  portal_branches: { zh: '門靜脈分支（示意）', en: 'Portal branches (schematic)' },
  artery_branches: { zh: '肝動脈分支（示意）', en: 'Artery branches (schematic)' },
  lobule: { zh: '肝小葉（放大）', en: 'Hepatic lobule (enlarged)' },
  sinusoid: { zh: '肝竇（示意）', en: 'Liver sinusoid (schematic)' },
  central_vein: { zh: '中央靜脈（示意）', en: 'Central vein (schematic)' },
  hv_branches: { zh: '肝靜脈分支（示意）', en: 'Hepatic vein branches (schematic)' }
});
export const LABEL_ALLOW = Object.freeze(['cardiovascular.right_atrium', 'cardiovascular.abdominal_aorta', 'aorta', 'cardiovascular.coeliac_trunk',
  'hepatic_artery', 'cardiovascular.hepatic_portal_vein_2', 'cardiovascular.superior_mesenteric_vein', 'cardiovascular.splenic_vein', 'visceral.liver',
  'cardiovascular.hepatic_veins', 'ivc', 'portal_branches', 'artery_branches', 'lobule', 'sinusoid', 'central_vein', 'hv_branches']);

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
  aorta: AORTA, portal: PORTAL, hepArt: HEP_ART, hepVeins: ['cardiovascular.hepatic_veins'], ivc: IVC
  // 肝內示意管（portalTree、arteryTree、sinus、lobVein、lobArt）沒有資料集網格，核心依 replaceMesh 直接生成同名結構
});
export const MATERIAL = Object.freeze({
  'visceral.liver': { color: '#7d3328', sheen: '#c4746a', rough: 0.5 },
  'visceral.stomach': { color: '#c98d82', sheen: '#efc7bd', rough: 0.6 },
  'visceral.pancreas': { color: '#d6b07c', sheen: '#f3dcb8', rough: 0.65 },
  'lymphoid.spleen': { color: '#74304a', sheen: '#b4687e', rough: 0.55 },
  gut: { color: '#c9765f', sheen: '#f0b8a6', rough: 0.5 },
  colon: { color: '#b98f78', sheen: '#e4c7b5', rough: 0.65 },
  lungs: { color: '#d9a6a2', sheen: '#f6d8d4', rough: 0.7 },
  heart: { color: '#a5333b', sheen: '#e08b8b', rough: 0.5 },
  leaflets: { color: '#e7c9b0', sheen: '#fff0e0', rough: 0.6 },
  kidneys: { color: '#8a3a36', sheen: '#c9837a', rough: 0.55 },
  diaphragm: { color: '#a8564c', sheen: '#dca095', rough: 0.7 },
  torso: { color: '#e9c8ad', sheen: '#fff1e4', rough: 0.8 },
  artery: { color: '#b3141d', rim: '#ff5a48', rough: 0.3 },
  vein: { color: '#55162c', rim: '#c0607e', rough: 0.36 }   // 血管只有兩種顏色：充氧血（artery）與缺氧血（vein）；肝竇、肝內分支、肝靜脈全用 vein（2026-11-23 老師）
});
/* 預設透明度（1＝不透明主角）。畫面上的血管透明度一律 < 0.6，才不會把管內的血球遮住（≥0.6 會開深度寫入）。 */
export const BASE_STYLE = Object.freeze({
  torso: 0.05, heart: 0.28, leaflets: 0, lungs: 0.08, gut: 0.2, colon: 0.1, liver: 0.3, stomach: 0.14, pancreas: 0.18,
  spleen: 0.2, kidneys: 0.1, diaphragm: 0, otherArteries: 0.12, otherVeins: 0.12,
  aorta: 0.5, portal: 0.55, hepArt: 0.55, hepVeins: 0.55, ivc: 0.5,
  portalTree: 0.55, arteryTree: 0.55, sinus: 0.5, lobSin: 0.5, lobVein: 0.55, lobArt: 0.55
});

/* ---------- 血流（每條區段的速度型態；公尺／秒，教學速度，不是真實速度） ----------
 * 肝內的分支愈分愈細、總截面積愈大，所以流速由粗到細逐級放慢；肝竇最慢，血球一顆接一顆。 */
export const HEART_PERIOD = 1.0; // 秒（示意的心動週期）
export const FLOW = Object.freeze({
  aorta: { type: 'pulse', v: 0.10, density: 420, fadeStart: true, fadeEnd: true },
  trunk_ha: { type: 'pulse', v: 0.05, density: 320 },
  smv: { type: 'steady', v: 0.03, density: 420 },
  splenic: { type: 'steady', v: 0.022, density: 300, fadeStart: true },
  portal: { type: 'steady', v: 0.03, density: 520 },
  ivc_lower: { type: 'steady', v: 0.035, density: 420, fadeStart: true },
  ivc_upper: { type: 'steady', v: 0.035, density: 480 },
  ptA: { type: 'steady', v: 0.024, density: 380 },       // 門靜脈分支，前 3 層
  ptB: { type: 'steady', v: 0.012, density: 220 },       // 其後各層
  atA: { type: 'pulse', v: 0.04, density: 260 },
  atB: { type: 'pulseSoft', v: 0.02, density: 170 },
  htA: { type: 'steady', v: 0.028, density: 320 },
  htB: { type: 'steady', v: 0.012, density: 150 },
  sn: { type: 'slow', v: 0.0045, density: 0, spacing: 0.0022, singleFile: true },
  lbsin: { type: 'slow', v: 0.0045, density: 0, spacing: 0.0016, singleFile: true },
  lbfeedv: { type: 'steady', v: 0.012, density: 260 },
  lbfeeda: { type: 'pulseSoft', v: 0.02, density: 200 },
  lbvenule: { type: 'steady', v: 0.01, density: 220 },
  lbarteriole: { type: 'pulseSoft', v: 0.014, density: 180 },
  lbcentral: { type: 'steady', v: 0.012, density: 260 }
});
/* 區段 id → FLOW 型態（pt0_1 → ptA …） */
export function flowKey(seg) {
  let m;
  if ((m = /^(pt|at|ht)(\d+)_\d+$/.exec(seg))) return m[1] + (+m[2] <= 2 ? 'A' : 'B');
  if (/^sn_\d+$/.test(seg)) return 'sn';
  if (/^lb_sin_\d+$/.test(seg)) return 'lbsin';
  if ((m = /^lb_(feed_v|feed_a|venule|arteriole|central)\d*$/.exec(seg))) return 'lb' + m[1].replace('_', '');
  return seg;
}
export function tubeGroup() { return null; }   // 本場景沒有「只畫示意管」的段；肝內管都由 replaceMesh 畫成單層管

/* 單層管：這些群組不畫資料集的網格外殼，改由核心依中心線與其半徑畫成單層管，血球的流動範圍＝畫面上的管徑。
 * 肝動脈：資料集只到肝右緣，肝門前後改畫成通到肝門的單層管（trunk_ha，後段為程式生成）。肝靜脈：往肝內延伸成樹（ht*）。 */
export const REPLACE_MESH = Object.freeze({
  portal: ['smv', 'splenic', 'portal'], hepArt: ['trunk_ha'], hepVeins: ['ht*'], ivc: ['ivc_lower', 'ivc_upper'],
  portalTree: ['pt*'], arteryTree: ['at*'], sinus: ['sn_*'], lobSin: ['lb_sin_*'], lobVein: ['lb_venule*', 'lb_feed_v*', 'lb_central'], lobArt: ['lb_arteriole*', 'lb_feed_a*']
});
export const REPLACE_STYLE = Object.freeze({
  hepVeins: { kind: 'vein', step: 0.002, radial: [14, 10] },
  portalTree: { kind: 'vein', step: 0.002, radial: [14, 10] },
  arteryTree: { kind: 'artery', step: 0.002, radial: [12, 8] },
  hepArt: { kind: 'artery' },
  sinus: { kind: 'vein', step: 0.0025, radial: [8, 6] },
  lobSin: { kind: 'vein', step: 0.0012, radial: [10, 8] },
  lobVein: { kind: 'vein' },
  lobArt: { kind: 'artery' }
});
/* 流動區段 → 驗證用的網格（粒子在管腔內的抽樣檢查）。分支 id 太多，用 Proxy 依前綴回答。 */
const LUMEN_FIXED = {
  aorta: AORTA, smv: ['@portal'], splenic: ['@portal'], portal: ['@portal'], trunk_ha: ['@hepArt'],
  ivc_lower: ['@ivc'], ivc_upper: ['@ivc']
};
export const LUMEN_MESH = new Proxy(LUMEN_FIXED, {
  get(t, k) {
    if (typeof k !== 'string' || k in t) return t[k];
    if (/^pt\d/.test(k)) return ['@portalTree'];
    if (/^at\d/.test(k)) return ['@arteryTree'];
    if (/^ht\d/.test(k)) return ['@hepVeins', '@ivc'];
    if (/^sn_/.test(k)) return ['@sinus'];
    if (/^lb_sin_/.test(k)) return ['@lobSin'];
    if (/^lb_(venule|feed_v|central)/.test(k)) return ['@lobVein'];
    if (/^lb_(arteriole|feed_a)/.test(k)) return ['@lobArt'];
    return undefined;
  }
});

/* ---------- 步驟 ---------- */
/* 放大的肝小葉：位置與方向由 build_liver_centerlines.py 決定（liver_centerlines_v1.json 的 lobule）。
 * 追蹤用的那條肝竇 lb_sin_13：起點最靠近 lb_feed_v0（門靜脈來的血），終點在中央靜脈上。 */
const LOB = { c: [-0.04331, 1.1898, 0.12305], e1: [0.38758, 0, 0.92184], a: [0.92181, -0.00829, -0.38756], e2: [-0.00764, -0.99997, 0.00321] };
const lobPos = (x, y, z) => [LOB.c[0] + LOB.a[0] * x + LOB.e2[0] * y + LOB.e1[0] * z, LOB.c[1] + LOB.a[1] * x + LOB.e2[1] * y + LOB.e1[1] * z, LOB.c[2] + LOB.a[2] * x + LOB.e2[2] * y + LOB.e1[2] * z];
const PORTAL_CHAIN = ['pt0_1', 'pt1_1', 'pt2_1', 'pt3_1', 'pt4_1', 'pt5_1', 'pt6_1', 'pt6_15'];
const HV_CHAIN = ['ht6_20', 'ht6_19', 'ht6_18', 'ht6_17', 'ht5_5', 'ht4_6', 'ht3_4', 'ht2_4', 'ht1_3', 'ht0_2'];
export const FOCUS_LOBULE = LOB.c;

/* 標籤：key＝NAMES 的 key；at＝錨點；side＝標籤在錨點的哪一側 */
export const LABELS = Object.freeze({
  aortaAbd: { key: 'cardiovascular.abdominal_aorta', at: { seg: 'aorta', u: 0.93 }, side: 'l' },
  coeliac: { key: 'cardiovascular.coeliac_trunk', at: { seg: 'trunk_ha', u: 0.12 }, side: 'r' },
  hepArt: { key: 'hepatic_artery', at: { seg: 'trunk_ha', u: 0.9 }, side: 'r' },
  smv: { key: 'cardiovascular.superior_mesenteric_vein', at: { seg: 'smv', u: 0.4 }, side: 'l' },
  splenic: { key: 'cardiovascular.splenic_vein', at: { seg: 'splenic', u: 0.45 }, side: 'r' },
  portal: { key: 'cardiovascular.hepatic_portal_vein_2', at: { seg: 'portal', u: 0.35 }, side: 'l' },
  liver: { key: 'visceral.liver', at: { pos: [-0.03, 1.2025, 0.115] }, side: 'r' },
  ptBranch: { key: 'portal_branches', at: { seg: 'pt2_1', u: 0.6 }, side: 'u' },
  atBranch: { key: 'artery_branches', at: { seg: 'at3_2', u: 0.5 }, side: 'd' },
  lobule: { key: 'lobule', at: { pos: lobPos(-0.0045, -0.0055, 0.002) }, side: 'r' },
  sinusoid: { key: 'sinusoid', at: { seg: 'lb_sin_13', u: 0.5 }, side: 'r' },
  central: { key: 'central_vein', at: { seg: 'lb_central', u: 0.6 }, side: 'd' },
  hvBranch: { key: 'hv_branches', at: { seg: 'ht2_2', u: 0.5 }, side: 'd' },
  hv: { key: 'cardiovascular.hepatic_veins', at: { seg: 'ht0_2', u: 0.55 }, side: 'r' },
  ivc: { key: 'ivc', at: { seg: 'ivc_lower', u: 0.86 }, side: 'u' },
  ra: { key: 'cardiovascular.right_atrium', at: { part: 'cardiovascular.right_atrium', dx: -0.012, dy: 0.01, dz: 0.01 }, side: 'l' }
});

/* 說明文字。src：EXISTING／COORD／NEW（同 small_intestine 場景）。函式形式會在執行時從 HumanTransportExchanges 讀原文。 */
const firstPara = (zone) => (X) => { const z = X && X.zones.find((q) => q.id === zone); return z ? P(z.text[0].split('\n\n')[0], z.text[1].split('\n\n')[0]) : P('', ''); };

/* 鏡頭關鍵格：t（秒）、pos、target。每步第一格＝前一步最後一格（連續）。 */
const CAM = {
  wide: { pos: [0.04, 1.20, 0.80], target: [-0.02, 1.19, 0.07] },
  celiacL: { pos: [0.30, 1.17, 0.30], target: [0.0, 1.17, 0.085] },          // 人體左前方看：主動脈→腹腔動脈幹
  hilumR: { pos: [-0.18, 1.18, 0.14], target: [-0.006, 1.178, 0.088] },       // 人體右前方看：肝門靜脈與肝動脈並排進肝門
  hilumNear: { pos: [-0.155, 1.188, 0.15], target: [-0.006, 1.183, 0.09] },
  liverAll: { pos: [-0.02, 1.215, 0.46], target: [-0.025, 1.21, 0.08] },
  liverTilt: { pos: [-0.10, 1.265, 0.40], target: [-0.03, 1.205, 0.08] },
  lobWide: { pos: [-0.0009, 1.2117, 0.2007], target: LOB.c, near: 0.01 },
  lobNear: { pos: [-0.02404, 1.19977, 0.15834], target: LOB.c, near: 0.008 },   // 肝小葉前上方看：三條小靜脈／小動脈、肝竇、中央靜脈
  lobSide: { pos: [-0.0094, 1.18563, 0.15219], target: LOB.c, near: 0.008 },
  hvView: { pos: [-0.05, 1.27, 0.38], target: [-0.02, 1.23, 0.08] },
  hvIvc: { pos: [-0.18, 1.25, 0.34], target: [-0.012, 1.245, 0.075] },
  raEnd: { pos: [-0.20, 1.29, 0.40], target: [-0.012, 1.27, 0.075] }
};
const K = (t, name) => ({ t, ...CAM[name] });

export const STEPS = Object.freeze([
  {
    id: 'two_inflows', dur: 12, btn: P('兩條血管送血進肝', 'Two vessels feed the liver'),
    title: P('① 肝臟有兩個入口', '① Two vessels bring blood to the liver'),
    text: [
      { src: 'NEW', p: P('肝臟有兩條血管送血進來：肝動脈帶來含氧多的血，肝門靜脈帶來剛從腸胃吸收養分、含氧較少的血。', 'Two vessels bring blood into the liver: the hepatic artery carries oxygen-rich blood, and the hepatic portal vein carries blood with freshly absorbed nutrients but less oxygen.') },
      { src: 'NEW', p: P('肝動脈是腹腔動脈幹的分支，腹腔動脈幹由腹主動脈分出。', 'The hepatic artery is a branch of the coeliac trunk, which comes off the abdominal aorta.') },
      { src: 'NEW', p: P('進入肝臟的血，約四分之三來自肝門靜脈，約四分之一來自肝動脈。', 'About three quarters of the blood entering the liver comes from the portal vein and about one quarter from the hepatic artery.') }
    ],
    camera: [K(0, 'wide'), K(2.8, 'celiacL'), K(6.6, 'celiacL'), K(9.2, 'hilumR'), K(12, 'hilumNear')],
    style: { 'glow.aorta': 0.5, 'glow.hepArt': 1, 'glow.portal': 1, 'lit.liver': 1, ivc: 0.1, liver: 0.16, portalTree: 0.22, arteryTree: 0.22, hepVeins: 0.08, sinus: 0, lobSin: 0, lobVein: 0, lobArt: 0, gut: 0.12, spleen: 0.14, pancreas: 0.12, stomach: 0.08, heart: 0.1, lungs: 0.05, kidneys: 0.05, colon: 0.05 },
    flows: ['aorta', 'trunk_ha', 'smv', 'splenic', 'portal'],
    labels: [{ id: 'aortaAbd', at: [1.0, 6.0] }, { id: 'coeliac', at: [2.8, 7.0] }, { id: 'hepArt', at: [9.0, 12] }, { id: 'portal', at: [9.2, 12] }, { id: 'liver', at: [10.2, 12] }],
    tracer: { path: ['aorta', 'trunk_ha'], from: 0.4, to: 9.2 }
  },
  {
    id: 'branching', dur: 12, btn: P('一路並行，愈分愈細', 'Branching side by side'),
    title: P('② 兩條血管一路並行，愈分愈細', '② Both vessels branch side by side'),
    text: [
      { src: 'NEW', p: P('進入肝臟後，肝門靜脈和肝動脈並行分支，愈分愈細（示意）。', 'Inside the liver the portal vein and the hepatic artery branch side by side into ever finer vessels (schematic).') },
      { src: 'NEW', p: P('膽管也和它們並行，這張圖沒有畫。', 'The bile ducts run alongside them too; they are not drawn here.') },
      { src: 'NEW', p: P('分支愈細，血流愈慢。', 'The finer the branches, the slower the flow.') }
    ],
    camera: [K(0, 'hilumNear'), K(2.5, 'liverAll'), K(8.0, 'liverTilt'), K(12, 'liverTilt')],
    style: { 'glow.portalTree': 1, 'glow.arteryTree': 1, 'lit.liver': 1, ivc: 0.1, liver: 0.14, portalTree: 0.56, arteryTree: 0.56, portal: 0.55, hepArt: 0.55, aorta: 0.15, hepVeins: 0.1, sinus: 0, lobSin: 0, lobVein: 0, lobArt: 0, gut: 0.08, spleen: 0.08, pancreas: 0.08, stomach: 0.06, heart: 0.08, lungs: 0.04, kidneys: 0.04, colon: 0.04 },
    flows: ['trunk_ha', 'portal', 'pt*', 'at*'],
    labels: [{ id: 'portal', at: [0.4, 4.6] }, { id: 'hepArt', at: [0.4, 4.6] }, { id: 'ptBranch', at: [3.4, 12] }, { id: 'atBranch', at: [4.2, 12] }],
    tracer: { path: ['portal', ...PORTAL_CHAIN], from: 1.0, to: 11.0 }
  },
  {
    id: 'lobule', dur: 15, btn: P('肝小葉：血液混合', 'Lobule: the two bloods mix'),
    title: (X) => { const z = X && X.zones.find((q) => q.id === 'liver'); return z ? P('③ ' + z.title[0], '③ ' + z.title[1]) : P('③ 肝小葉：血液混合', '③ The lobule: blood mixes'); },
    text: [
      { src: 'EXISTING', p: firstPara('liver') },
      { src: 'NEW', p: P('兩種血在極細的肝竇（示意）混合，一顆一顆紅血球慢慢經過肝細胞旁，再流向中央靜脈。', 'The two kinds of blood mix in the tiny sinusoids (schematic); red cells pass the liver cells one by one on the way to the central vein.') },
      { src: 'NEW', p: P('這裡的肝小葉與肝竇都放大了，才看得清楚。', 'The lobule and sinusoids are enlarged here so they can be seen.') }
    ],
    camera: [K(0, 'liverTilt'), K(3.0, 'lobWide'), K(6.0, 'lobNear'), K(9.0, 'lobSide'), K(15, 'lobSide')],
    style: { 'glow.lobSin': 1, 'glow.lobVein': 1, 'glow.lobArt': 1, 'lit.liver': 1, liver: 0.06, portalTree: 0.14, arteryTree: 0.14, hepVeins: 0.1, sinus: 0.08, lobSin: 0.56, lobVein: 0.56, lobArt: 0.56, portal: 0.08, hepArt: 0.08, aorta: 0.04, ivc: 0.08, gut: 0.03, spleen: 0.03, pancreas: 0.03, stomach: 0.03, heart: 0.03, torso: 0.03 },
    flows: ['pt6_15', 'at6_15', 'lb_*'],
    labels: [{ id: 'lobule', at: [2.8, 9.2] }, { id: 'sinusoid', at: [5.0, 7.0] }, { id: 'central', at: [6.8, 9.2] }],
    tracer: { path: ['pt6_15', 'lb_feed_v0', 'lb_sin_13', 'lb_central'], from: 3.0, to: 9.0 },
    window: { kind: 'liver', open: [9.6, 10.6], focus: { pos: LOB.c } }
  },
  {
    id: 'return', dur: 13, btn: P('肝靜脈：回到心臟', 'Hepatic veins: back to the heart'),
    title: P('④ 肝靜脈：回到心臟', '④ Hepatic veins: back to the heart'),
    text: [
      { src: 'NEW', p: P('中央靜脈匯集成愈來愈粗的肝靜脈（主要有右、中、左三支，示意）。', 'Central veins merge into ever larger hepatic veins (mainly right, middle and left; schematic).') },
      { src: 'COORD', p: P('肝靜脈把肝臟的血送進下腔靜脈（國中課本：下大靜脈），回到右心房。', 'Hepatic veins carry blood from the liver into the inferior vena cava and back to the right atrium.') }
    ],
    camera: [K(0, 'lobSide'), K(3.0, 'liverTilt'), K(7.0, 'hvView'), K(10.0, 'hvIvc'), K(13, 'raEnd')],
    style: { 'glow.hepVeins': 1, 'glow.ivc': 1, 'glow.sinus': 0.6, 'lit.cardiovascular.right_atrium': 1, 'cardiovascular.right_atrium': 0.62, 'lit.liver': 1, liver: 0.1, hepVeins: 0.56, sinus: 0.5, lobVein: 0.55, portalTree: 0.15, arteryTree: 0.1, lobArt: 0.3, portal: 0.15, hepArt: 0.1, aorta: 0.08, ivc: 0.55, heart: 0.4, gut: 0.05, spleen: 0.05, pancreas: 0.05, stomach: 0.05 },
    flows: ['sn_*', 'lb_sin_*', 'lb_central', 'ht*', 'ivc_lower', 'ivc_upper'],
    labels: [{ id: 'central', at: [0.4, 3.4] }, { id: 'hvBranch', at: [4.2, 7.2] }, { id: 'hv', at: [6.8, 9.6] }, { id: 'ivc', at: [9.4, 11.6] }, { id: 'ra', at: [11.4, 13] }],
    tracer: { path: ['lb_central', ...HV_CHAIN, 'ivc_upper'], from: 1.5, to: 12.2 },
    window: { kind: 'liver', close: [0, 0.9], focus: { pos: LOB.c } }
  }
]);

export const SCENE = Object.freeze({
  id: 'liver', name: P('肝臟路線', 'Liver route'),
  glb: 'assets/biology/anatomy3d/si_scene_v1.glb', glbLite: 'assets/biology/anatomy3d/si_scene_v1_lite.glb',
  parts: 'assets/biology/anatomy3d/si_parts_v1.json', centerlines: 'assets/biology/anatomy3d/liver_centerlines_v1.json?v=20261123-3',
  names: NAMES, labelAllow: LABEL_ALLOW, groups: GROUPS, material: MATERIAL, baseStyle: BASE_STYLE, flow: FLOW, flowKey, tubeGroup,
  replaceMesh: REPLACE_MESH, replaceStyle: REPLACE_STYLE, lumenMesh: LUMEN_MESH, labels: LABELS, steps: STEPS, heartPeriod: HEART_PERIOD,
  routeVessels: [...AORTA, ...PORTAL, ...HEP_ART, 'cardiovascular.hepatic_veins', ...IVC],
  smoothTubes: true,   // 單層管改用「變半徑（由粗漸細）＋游離端圓頭」：中心線 JSON 的半徑陣列、capStart／capEnd 才會生效（接點畫法見接力指南 5b／5c）
  vesselGlow: 'hue',   // 目標血管（style 的 glow.<群組>）只加亮度、不變色：充氧血管＝artery 色、缺氧血管＝vein 色，只有這兩種（核心：SCENE.vesselGlow，預設舊做法）
  flowBright: 2,   // 血球亮度加倍（核心：SCENE.flowBright，預設 1）；目標器官亮度加倍＝各步驟 style 的 lit.<群組>: 1
  status: P('黃圈追蹤一顆紅血球。', 'The yellow ring follows one red cell.'),
  note: P('肝內分支為示意｜肝竇與肝小葉放大｜血球放大', 'Branches inside the liver are schematic | sinusoids and lobule enlarged | cells enlarged'),
  credit: P('3D 模型：Z-Anatomy／BodyParts3D，CC BY-SA 4.0', '3D model: Z-Anatomy / BodyParts3D, CC BY-SA 4.0')
});
export default SCENE;
