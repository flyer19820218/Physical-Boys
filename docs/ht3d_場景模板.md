# 3D 血液循環｜場景最佳模板（2026-11-23，老師：「幫全部的循環做一個最佳模板」）

所有循環場景（小腸、肝、腎、肺、腦，之後的心肌、組織、總覽）共用同一組設定，在 `assets/biology/anatomy3d/ht3d_preset_1122_v1.js`。

## 場景檔怎麼套（一行）
```js
import { BEST_SCENE, BEST_GROUPS, BEST_BASE, bestFloor } from './ht3d_preset_1122_v1.js?v=<版本>';
export const SCENE = Object.freeze({
  ...BEST_SCENE,
  ...自己的設定,
  groups: { ...GROUPS, ...BEST_GROUPS }, baseStyle: { ...BASE_STYLE, ...BEST_BASE },
  vesselFloor: bestFloor({ 放大的微血管床群組: 0 })
});
```
改了 preset 就換 `?v=`（場景檔裡的 import 版本、頁面 `VER`、html 的 css／js 版本一起換）。

## 規則
1. **全部的血管都畫上去、不消失**：資料集 cardiovascular 共 676 條血管（`body_vessels_v1.glb` 是除了各場景已有的 76 條以外的 587 條，四肢、頭頸都有）常駐畫面；核心 `vesselFloor` 讓每一步裡所有血管都不低於底線透明度（0.28；全身底圖 0.16～0.18）。步驟的 style **不用再把沒講到的血管寫成 0**。
2. **目標血管亮度加倍、色相不變**：步驟 style 寫 `glow.<群組>: 1`＋把透明度拉到 0.56（< 0.6，血球才看得見）。核心 `vesselGlow:'bright'`：沒講到的血管顏色變暗（`vesselDim` 0.62）、講到的同色自發光（`vesselGlowE` 0.85），亮度比 ≥ 2 倍。原因：鮮紅 R 通道已近上限，乘法加亮只會把 G／B 一起拉高變粉白（上一位試 `glowGain 2`＋`flowBright 4` 就是這樣）。
3. **只有兩種血管色**：鮮紅（充氧，`artery`）與暗紅（缺氧，`vein`，不偏紫、不用藍）。不要另外做第三種材質。
4. **血球同色發光**：核心 `flowGlow`（0.55）＝底色不乘亮、加上血球自己那個紅的自發光；不要再用 `flowBright`。追蹤的那顆血球仍用 `flowBright`（預設 1）。
5. **放大的微血管床只在自己那一步出現**（肝竇、肝小葉、腎絲球、肺泡網、腦微血管床…）：`bestFloor({ 群組: 0 })` 排除在底線之外，不然放大尺度會雜亂、也增加三角形。
6. **目標器官**：`lit.<器官群組>: 1`（顏色 ×2＋自發光＋外框加亮）。
7. **場景自己已經畫的血管，全身底圖不要重疊**：腦場景用自己的 JSON 中心線畫頭頸血管，所以把 `bodyArtHead`、`bodyVeinHead` 的 baseStyle 與底線都設 0。
8. 血管畫法、接點、粗細仍照接力指南 5b、5c、5c-2、5c-3；血球預算 full 2400／lite 1000、每段至少 3 顆。

## 檢查清單
- [ ] 每一步載入無 JS 錯誤、無 404（`tools/qa/ht3d_lshot.cjs`，`SCENE=<場景>` 環境變數指定場景）
- [ ] 截圖：目標血管明顯比背景亮、血球看得見；背景血管淡淡的、不蓋住目標
- [ ] 放大的微血管床在別的步驟不出現
- [ ] iPad（lite）三角形數與重繪量（全身底圖 lite 增加約 7.6 萬三角形；**真機沒量**）
