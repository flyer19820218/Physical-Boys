# 顯微鏡與微小世界：影像與示意圖紀錄

- 封面：`assets/covers/biology_microscope_cover_v1.jpg`，內建 image_gen 生成，無字、無標籤、無浮水印。這是藝術化科學插圖，不是真實顯微照片，不可當作物種鑑定或比例尺。
- 生成原檔保留於老師本機的 Codex generated_images；網頁使用本專案內的 JPEG。
- `green_algae_v1.svg`、`diatoms_v1.svg`、`cork_cells_v1.svg` 與互動視野為原創程式繪圖，參考講義圖示的教學重點，不複製講義圖片。
- 靜態圖沒有比例尺；不同圖之間不能直接比較真實大小。互動只在同一標本、同一目鏡設定下比較倍率及相對視野直徑。
- 球形綠藻大球為群體，表面點為細胞，內部小球為子群體。
- 矽藻以圓盤及舟形、含矽外壁與條紋呈現典型特徵，不用此圖鑑定物種。
- 軟木圖示死細胞留下的小室與細胞壁，不畫細胞核等活細胞內部構造。
- 原型中的植物細胞、F 倒像及水中生物游動座標與速率保留；只增加標本選項及電子數字。

## 內容來源

老師《生物 第一章.pdf》顯微鏡相關頁（17–36）；器材補充核對 [Nikon MicroscopyU](https://www.microscopyu.com/techniques/stereomicroscopy/introduction-to-stereomicroscopy)。

## 封面完整 prompt（內建工具；非 CLI）

Use case: scientific-educational
Asset type: wordless cinematic opening image for a Taiwanese middle-school microscopy lesson.
Primary request: an exquisite immersive artist's visualization of the microscopic life in a drop of pond water, landscape widescreen composition.
Subject: a large translucent green spherical Volvox-like colony with many tiny green cells on its spherical surface and a few clearly separate daughter colonies inside; several smaller golden-brown diatoms, both circular patterned silica discs and slender boat-shaped forms with delicate symmetrical striations.
Style/medium: high-end scientific illustration, softly dimensional, believable fine textures, elegant luminous edges, not a real micrograph and not a literal scale chart.
Scene/backdrop: deep forest-green aqueous darkness (#11261f), softly luminous light passing through water, layered shallow depth of field. Subjects occupy the central area for mobile cropping.
Constraints: no words, letters, digits, chemical symbols, arrows, labels, logo, watermark, border, microscope equipment or fantasy tentacles. Do not make all species the same size. No faces, no cute cartoon style. Preserve recognisable Volvox sphere and characteristic diatom shells. This is an atmospheric introduction, not an identifying reference plate.
