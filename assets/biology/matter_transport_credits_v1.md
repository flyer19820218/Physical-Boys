# 生物第二章 2-1｜素材與科學核對 V1

日期：2026-10-06。僅本機預覽，不代表老師已核准上架。

## 真實光學顯微照片

### 水蘊草葉細胞

- 本機：`photos/elodea_clear_v2.jpg`（延用第一章已核對素材，未重新修改）。
- 作者：Juan Carlos Fonseca Mata。
- [原始檔案與授權證據](https://commons.wikimedia.org/wiki/File:Chloroplasts_-_Microscopic_view_of_Elodea_canadensis.jpg)。
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；圖像維持原授權。
- 第一章縮圖等比例縮至最多 1800px、JPEG 品質 90；未變形、鏡像或改色。本章僅顯示／數位縮放，未改檔。
- 觀察重點：一整格為細胞，綠色顆粒為葉綠體，不是小分子。來源未交代拍攝倍率，不編造倍率或量尺。
- SHA-256 沿用：`9723b627a6158bba8be82f9e903d189d2b45af41a1728c37de0f98bbbfd1e11d`。
- 原圖與前次 metadata 已保存在 `source-markdown/backups/biology_cells_20261006_v2/`，本章備份另帶現用影像。

### 紫色葉表皮質壁分離

- 本機：`photos/plasmolysis_rhoeo_v1.jpg`，原始 JPEG 3120×1440，直接下載，不裁切、不改色、不變形。
- 作者：Krishna satya 333；Own work，2020-07-03。
- [原始檔案與授權證據](https://commons.wikimedia.org/wiki/File:Observation_of_the_plasma_membrane_during_plasmolysis_in_Rhio_leaf_cells.jpg)。
- 原圖：https://upload.wikimedia.org/wikipedia/commons/d/db/Observation_of_the_plasma_membrane_during_plasmolysis_in_Rhio_leaf_cells.jpg 。
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；作者署名、來源、授權均放在照片下，圖像維持同授權。
- 網頁等比例顯示，觸控僅改顯示層縮放／平移；不是重新拍攝的不同倍率。不提供來源沒有的倍率、尺度尺或時間序列。
- 觀察重點：壁內縮小的紫色原生質體及空隙；不推論所有植物細胞原本都是紫色。照片不是模型動畫的逐幀實驗結果。
- 已逐張查看原圖，細胞壁、紫色原生質體及保衛細胞可辨認。原圖留在素材及本機 ZIP 備份；來源頁另以 HTML 證據保留。
- SHA-256：`c1b743bb4b60f6a377546b89120c3f48fafc11286aed4c43dff150266230ae6f`。

## 原創 AI 無字封面

- 本機：`assets/covers/biology_matter_transport_cover_v1.png`。
- 原創 imagegen，Physical-Boys，2026-10-06。未提供第三方參考圖。
- 原始輸出：`/Users/lvyanjun/.codex/generated_images/01a04ddb-6e28-7263-a57d-c8cd7f95992c/exec-9d95e22b-035e-4d6f-9262-cf25a11a85be.png`。
- 1536×1024 PNG，原樣複製；原始輸出保留。已查看，無文字、數字、標籤或浮水印。
- 封面為 AI 情境插圖，非實拍；葉片／器材用來引起觀察，不作細胞構造或擴散速度的證據。
- SHA-256：`07f75cef5b5e50d9558101eba77cf2eb922215e046c5e1cacfea89e64d543a2d`。

生成提示詞（generation，opaque background，沒有 reference images）：

> Create an original cinematic wordless cover for a junior-high biology lesson about the materials of life, diffusion, and osmosis. Landscape 3:2 image. Photorealistic natural science still life: a fresh vivid green leaf with dew in the foreground on a muted medium-gray laboratory bench, a shallow clear glass dish with thin purple leaf tissue, an elegant unmarked glass beaker containing clear water with a small softly diffusing red dye plume fully below the water surface, and a realistic compound microscope subtly out of focus behind. Dramatic warm side lighting against a dark forest-green laboratory atmosphere, exceptionally beautiful optical reflections and fine leaf veins, scientifically plausible equipment, no floating particles outside glass. No text, no lettering, no digits, no measurement markings, no arrows, no diagrams, no logo, no watermark. This is an original AI illustrative cover, not evidence of a real experiment. No third-party reference imagery. High quality, restrained premium biology education visual, not cartoon, not cute.

## 原創程式模型，不是照片

- 分子鏈：六角符號代表葡萄糖單元；不是完整鍵結式。示意分散／連接與消化概念，不宣稱按一下能進行真實反應。
- 細胞膜：原創脂質雙層概念剖面，氧氣穿膜、水與葡萄糖有不同運輸構造，澱粉不能直接穿過。本章不把「小分子」一律視為能直接過膜。示意通路不作高中載體機制的完整模擬。
- 擴散：240 個代表粒子、二維隨機步進、反射邊界。巨觀色素依同組粒子平滑分布顯示，微觀虛線不是隔板。兩邊等體積，數目可比較分布；不是實際分子總數。加速的是觀察時間，不是溫度，不模擬滴液引發的對流。
- 滲透：外液大儲槽，細胞內不透膜溶質守恆。模型驅動項為內外相對濃度差減去細胞壁支撐壓力；水量變化有界，體積映射為剖面線性縮放的立方根。細胞壁不縮小，原生質體可縮小。吸水增壓後接近平衡，不假稱兩側濃度必然相等。
- 水的兩條動態通路同時顯示入／出；淨移動以差額判斷，接近平衡時雙向水仍移動。
- 全部模型顏色、時間、尺寸和水量均為定性示意，不供真實量測，不把模型冒充顯微實拍。
- 曉臻 Hook 延用正式 `assets/characters/xiaozhen/teaching.png`，未修改人物素材。

## 科學與教材來源

- 老師講義《生物 第二章 .pdf》第 2～4 頁；不擷取未獲授權的講義照片作網站素材。
- [OpenStax Biology 2e：Passive Transport](https://openstax.org/books/biology-2e/pages/5-2-passive-transport)：核對選擇性通透、擴散、滲透、植物細胞壁支持。
- [OpenStax Biology 2e：Carbohydrates](https://openstax.org/books/biology-2e/pages/3-2-carbohydrates)：核對葡萄糖與澱粉單元。內容使用原創中文／英文解說，未搬用其圖片或原段落。
- [Javalab Osmosis](https://javalab.org/en/osmosis_en/)：僅觀察核心變數與介面思路，未嵌入、下載程式或取用圖像；科學文字以講義及 OpenStax 核對。
- 講義第 15 頁「碳原子半徑 7 奈米」保持待確認；不在本單元引用，也不修改原題。

## 尚未驗證的界線

此版可做原生 Canvas、純模型、DOM 事件測試，不等於瀏覽器字體、排版或 iPad 實機通過。前次 file:// 安全拒絕沒有以 localhost／headless／CDP 繞過。
