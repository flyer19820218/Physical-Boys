/* ht3d_preset_1122_v1.js — 全部循環場景共用的「最佳模板」設定（2026-11-23 老師要求：全部的血管都畫上去、目標血管亮度加倍、做一個最佳模板）。
 *
 * 用法（每個場景檔一行）：
 *   import { BEST_SCENE, BEST_GROUPS, bestFloor } from './ht3d_preset_1122_v1.js?v=20261123-f2';
 *   export const SCENE = Object.freeze({ ...BEST_SCENE, ...這個場景自己的設定, groups: { ...GROUPS, ...BEST_GROUPS }, vesselFloor: bestFloor({ 微血管床群組: 0 }) });
 *
 * 規則（寫進 docs/ht3d_場景模板.md）：
 *  1. 全身血管底圖：所有血管（含四肢、頭頸、胸腹壁小分支，資料集 cardiovascular 共 676 條）常駐畫面上、淡淡的，不消失、不被截掉（vesselFloor）。
 *  2. 目標血管（當步講解的）：style 寫 `glow.<群組>: 1`＋透明度拉高；沒講到的血管不用寫 0，底線會讓它們留在畫面上並自動變暗（vesselDim）。
 *  3. 目標血管的亮度 ≥ 非目標的 2 倍，而且色相不變：只有兩種血管色（鮮紅＝充氧、暗紅＝缺氧）。鮮紅的 R 通道已接近上限，
 *     用乘法加亮只會偏粉白，所以「非目標變暗＋目標同色自發光」（核心 vesselGlow:'bright'）。
 *  4. 目標血管裡的血球：同色發光（核心 flowGlow），底色不乘亮。
 *  5. 放大的微血管床（肝竇、肝小葉、腎絲球、肺泡網、腦微血管床…）只在自己那一步出現：場景用 bestFloor({ 群組: 0 }) 把它們排除在底線之外。
 */
export const BODY_VESSELS = Object.freeze({
  glb: 'assets/biology/anatomy3d/body_vessels_v1.glb?v=20261123-f2', glbLite: 'assets/biology/anatomy3d/body_vessels_v1_lite.glb?v=20261123-f2',
  parts: 'assets/biology/anatomy3d/body_vessels_parts_v1.json?v=20261123-f2'
});
/* 全身血管底圖的群組（8 個 node 依「動脈／靜脈 × 頭頸／手臂／腿／軀幹」）。場景要單獨調某一區時用這些群組名。 */
export const BEST_GROUPS = Object.freeze({
  bodyArtHead: ['body.arteries.head'], bodyArtArm: ['body.arteries.arm'], bodyArtLeg: ['body.arteries.leg'], bodyArtTrunk: ['body.arteries.trunk'],
  bodyVeinHead: ['body.veins.head'], bodyVeinArm: ['body.veins.arm'], bodyVeinLeg: ['body.veins.leg'], bodyVeinTrunk: ['body.veins.trunk']
});
/* 全身血管底圖沒講到時的透明度（場景的 baseStyle 要 `{ ...BASE_STYLE, ...BEST_BASE }`）；講到時由 style 拉高。 */
export const BEST_BASE = Object.freeze({ bodyArtHead: 0.2, bodyArtArm: 0.2, bodyArtLeg: 0.2, bodyArtTrunk: 0.2, bodyVeinHead: 0.2, bodyVeinArm: 0.2, bodyVeinLeg: 0.2, bodyVeinTrunk: 0.2 });
export const BEST_SCENE = Object.freeze({
  extras: Object.freeze([BODY_VESSELS]),
  vesselGlow: 'bright',   // 目標血管同色自發光、非目標變暗（核心 tint()）
  vesselDim: 0.62,         // 非目標血管顏色變暗幅度（0～0.8）
  vesselGlowE: 0.85,      // 目標血管自發光強度
  flowGlow: 0.55          // 血球同色發光（取代 flowBright 乘法）
});
/* 血管透明度底線：任何一步都不低於它。overrides 例：{ lobSin: 0, sinus: 0 }＝這些群組不套底線（放大的微血管床，只在自己那一步才出現）。 */
export const bestFloor = (overrides = {}) => Object.freeze({ all: 0.28, bodyArtHead: 0.16, bodyArtArm: 0.16, bodyArtLeg: 0.16, bodyArtTrunk: 0.18, bodyVeinHead: 0.16, bodyVeinArm: 0.16, bodyVeinLeg: 0.16, bodyVeinTrunk: 0.18, ...overrides });
