# 光合作用｜老師修正版（2026-10-11）

## 修改範圍

- 保留既有立體葉綠體，以老師 `702.png` 的進出方向重排文字與箭頭：水、二氧化碳由上方進入，光由左側進入；左側葉綠素吸光，能量與 H 由載體傳往右側酵素合成醣類；氧氣、醣類與產物水往下離開。
- 氣孔採新製開／閉構造比較，每個保衛細胞畫一個連續的大液胞；另加表皮細胞引線、細胞核與葉綠體圖例。這是國中教學簡化模型，不代表所有植物、發育或膨壓狀態的液胞數均相同。保留原有真實光學照片與切換功能。
- 遮光實驗改為完整盆栽 → 同一片葉雙面鋁箔 → 陽光快轉 → 搬入實驗室 → 取葉除箔。沿用原教材的 5～7 天設定、八步順序、動畫時間、預測與結果判斷。
- 酒精改裝小燒杯，放在大燒杯的熱水浴內；葉片較寬、較平展。沿用先蓋熄酒精燈、再移入酒精的安全流程。
- 其他未授權場景、舊繪圖檔、模型與照片不重畫。此版為老師授權的幾何／動畫修改，不宣稱「只改樣式」。主標題／一句副標題，不顯示章節標籤。

## 素材、授權與製作方式

使用內建 ImageGen（不是 CLI/API），原創 AI 教學素材；頁面清楚標示「AI，非實拍」。兩張 PNG 保存真正 alpha，不加白底。文字放在 Canvas 雙語層，不內嵌於圖片。

| 新素材 | 路徑 | 性質 |
|---|---|---|
| 氣孔開閉構造 | `photosynthesis_guard_single_vacuole_ai_1011_v1.png` | 原創 AI 插圖，1774 × 887；四個保衛細胞各一個連續液胞 |
| 寫實盆栽 | `photosynthesis_potted_bean_ai_1011_v1.png` | 原創 AI 寫實情境素材，1024 × 1536；非真實拍攝 |

老師提供的 iStock 截圖只作為生物構造參考，不下載、重製或去浮水印。Ali Zifan 舊圖、真實顯微照片、既有來源與授權記錄原檔保留；本次不把舊圖冒稱 AI 原創。

### 最終提示詞組

1. **scientific-educational / 氣孔**：Create an original polished, gently cute 3D educational illustration comparing an open stoma on the left and a closed stoma on the right. Exactly two guard cells per complex, four total; each guard cell has exactly ONE continuous large cyan vacuole, one coral nucleus in the surrounding cytoplasm and several green chloroplasts outside the vacuole. Open cells are swollen and curved around an open pore; closed cells have lower turgor and meet at a narrow seam. Thick inner walls, thinner outer walls. Surround each complex with epidermal cells. Actual transparent alpha background. No faces, words, labels, arrows, watermark, stock tracing or white background.
2. **photorealistic-natural / 盆栽**：An entire photorealistic potted bean plant in a terracotta pot with dark soil, upright stems, branching petioles and genuine leaf textures. A prominent front-left leaf faces the camera nearly vertically, connected to the plant, with other leaves above and to the right. Show the whole plant and pot in a portrait 1024 × 1536 composition. Actual transparent alpha background. No aluminum foil, people, writing, labels, logo or watermark. This is an AI educational scene, not a microscopy image.
3. **background-extraction / 盆栽透明化**：Remove only the background of the generated plant. Preserve the same plant, pot, leaf shapes, identity, framing, fine edges and all internal spaces. Produce genuinely transparent alpha, not a bokeh, solid white or checkerboard background. Do not reposition or redraw the plant.

## 科學參考

- [OpenStax：光反應](https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis)：光能、由水提供氧氣、能量與電子載體。
- [OpenStax：卡爾文循環](https://openstax.org/books/concepts-biology/pages/5-3-the-calvin-cycle)：二氧化碳的碳進入醣類，酵素與光反應提供的能量／還原力。
- [保衛細胞液胞三維研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC10175559/)：液胞構造會隨狀態改變；課堂單一大液胞圖為簡化模型。

## 驗證紀錄

- `photosynthesis_teacher_check_1011_v1.cjs` 通過：280 張 native Canvas 圖，其中 208 張為八步實驗的中英文分格；使用本機 Noto Sans TC 與 JetBrains Mono，文字超出畫布數為 0。
- 舊模型、v8 介面／CSS、v6 繪圖 SHA-256 與修改前完全相同；五個保護函式維持相同引用。舊 Ali Zifan SVG 的 SHA-256 完全相同。這不是「只改了樣式」的宣稱；授權場景才重新安排幾何。
- 原有模型的預測、八步順序、完成前不顯示結果、暫停、重設、背景暫停均通過。三種必要條件任一缺少時，產物水停止移動。實驗結果用新盆栽的同一片葉，不會默默退回舊卡通葉。
- 新 PNG 真正全透明像素：盆栽 740,307；氣孔 763,851。盆栽角落有 1/255 的 alpha 抗鋸齒殘值，不是實心背景；不後製改動原生成圖。
- 實際內建瀏覽器：完整走完八步；氣孔示意／真實照片切換、開／閉放大、重設與中英切換正常。暫停一秒像素完全相同；缺光時產物區一秒像素完全相同；主控按鍵可以接續。
- 六種平板尺寸（1366 × 1024、1194 × 834、1180 × 820、1024 × 768、1133 × 744、1080 × 810）橫／直向、中／英、三個改動場景，共 72 組；516 個可見按鍵中心命中檢查，0 失敗。離開可視區的按鍵不列入命中數，控制欄保持可捲動。畫布不壓控制欄且在螢幕內；氣孔新圖的容器同步改成 960:620，避免共享舊 1297:769 比例裁掉底部。
- 實際頁面本機字型錯誤提示未顯示，瀏覽器 error／warn 紀錄為 0。Canvas 字級 22～30px；英文優先換行，沒有為塞字縮到 22px 以下。
- **限制**：沒有實機 iPad／Safari 測試；多點 pinch 與拖曳狀態用 native DOM 替身驗證，不能冒稱實機觸控驗證。

本機預覽：`biology_photosynthesis_teacher_preview_1011_v1.html`。修改前備份：`local-backups/20261011/photosynthesis_teacher_redraw_pre.3oKMM8`。發布後另以正式網址確認線上畫面。
