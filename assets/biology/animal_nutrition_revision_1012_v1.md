# 動物營養：三腳脂質、透明解剖圖與絨毛吸收

老師逐項授權的修正，2026-10-12。本版只新增解剖總覽、修正吸收模型；其他教材本體保留。

## 素材

- `animal_digestive_atlas_ai_1012_v1.png`：OpenAI ImageGen 原創立體解剖示意，1024 × 1536，透明 PNG，非實拍。沒有使用、描摹或下載 SciDraw 的成品，不宣稱網站範例可自由轉載。
- AI 圖供位置總覽；細節仍可用「原圖對照」及原有器官拉出功能。原有公共領域向量、11 張器官、OpenStax 真實切片與完整原圖均保留，授權見 [原始素材紀錄](animal_nutrition_sources_v2.md)。
- 絨毛模型是原創 Canvas 圖，沒有從原始 JPG 去背或重製其插圖；「真實光學切片」「完整構造原圖」維持原貌。模型沒有白色面板。
- 分子符號為可見性放大，不是分子與上皮細胞的真實尺度。葡萄糖、胺基酸、水沿共用路徑穿過上皮、進入微血管，再沿藍色靜脈離開；完整澱粉／蛋白質留在腸腔。
- 乳糜管獨立呈綠色。本頁沒有把長鏈脂質畫成直接吸收到靜脈。

## 科學核對

- [消化系統總覽](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system)：食物通道與附屬器官。
- [肝臟、胰臟、膽囊](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder)：位置及功能。
- [消化與吸收](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look)：水溶性養分由絨毛微血管經肝門靜脈運輸；長鏈脂質的淋巴路徑另列補充，不混用。

## 圖片生成提示詞

Use case: scientific-educational. Asset type: original unlabelled anatomy plate for a Taiwanese junior-high interactive biology lesson, displayed on a dark green chalkboard. Create a polished, remarkably clear semi-realistic 3D medical-atlas illustration of the human digestive system, genuinely transparent background outside the body. This is an ORIGINAL illustration, not a copy of any website graphic. Portrait composition, one adult human head, neck and frontal torso down to the pelvic outlet; head shown in left-facing sagittal cutaway to reveal the oral cavity and pharynx, chest and abdomen shown in frontal cutaway. Neutral pale gray softly translucent external skin silhouette, no distracting muscles, no gore. Soft studio lighting and clean high-definition anatomical surfaces, clear boundaries, clinically natural differentiated organ colors. Anatomical constraints: the oral cavity, posterior pharynx, long esophagus, stomach, duodenum, coiled small intestine, large intestine, rectum and anus form ONE continuous food route. Esophagus joins the top of the stomach in the subject's left upper abdomen (VIEWER RIGHT). Large reddish-brown liver is in the subject's right upper abdomen (VIEWER LEFT), with a smaller left lobe extending toward the stomach. A small green gallbladder is clearly visible tucked under the liver with a slender bile duct leading into the C-shaped duodenum. Single elongated golden-tan lobulated pancreas runs transversely beneath/behind the stomach, with its head nestled in the duodenal C loop. Major salivary glands clearly visible by the cheek/jaw and beneath the tongue. Tan haustrated colon frames the peach-pink small intestine: ascending colon on VIEWER LEFT, transverse colon across the upper abdomen, descending colon on VIEWER RIGHT, sigmoid colon feeding into the central rectum and distinct anal outlet at the bottom. Single small appendix near the cecum on VIEWER LEFT. Exactly one stomach, liver, pancreas and gallbladder. Small intestine is clearly distinguishable from colon. Give generous visual separation to the organ contours without inventing gaps in the food route. Complete head and anal outlet both visible, no cropped anatomy. Entire figure occupies most image height, slender portrait figure centered; outer margins transparent, no floor or scenery. Strictly NO TEXT, labels, arrows, leader lines, letters, numbers, logo or watermark. No white rectangular background, no checkerboard pattern, no ornamental effects, no face expression, no nipples or genital detail. Educational cutaway illustration, not a photograph.

## 驗證

- `animal_nutrition_atlas_villus_check_1012_v1.cjs`：184 張原生 Canvas 中英文畫面；44 次標籤點擊、44 次定位點點擊；10,010 組吸收路徑檢查，已吸收符號中心與可見靜脈中心線距離小於 10⁻⁸ px；完整大分子不跨過上皮；文字越界 0。
- 分子符號外接尺寸：葡萄糖 22 px、胺基酸／水 18 px、完整澱粉／蛋白質 74 px。舊版完整鏈約 10 px；此次依老師要求放大，明示非真實比例。小分子小於可見血管寬度，上皮細胞為 40 × 30 px。
- `animal_nutrition_preservation_check_1012_v1.cjs`：對照已發布的三腳脂質版 `e586973`，198 個保留畫面逐像素相同。原繪圖 JS、所有原數值座標、養分資料、器官原向量、CSS、動畫速率與逐站導覽函式完全相同；只有新增總覽及老師授權重做的吸收模型改變。新模型近白色像素 0。
- 透明 PNG：699,541 個全透明像素、873,323 個部分透明像素；左上角 alpha = 0。原圖與切片的 SHA-256 記錄仍和先前版本相同。
- 實際本機瀏覽器：三種絨毛視圖切換、中文／英文、原圖器官放大、新 AI 全身總覽均能操作。吸收播放前後 1 秒截圖不同；暫停前後 1 秒截圖相同。瀏覽器警告／錯誤 0。
- 實際桌面瀏覽器套用 iPad Pro 13／12.9／11、Air、10.2、mini 的橫直尺寸，中英文共 24 組；畫布全在視窗內、與操作欄不重疊；280 個可見按鈕中心點均命中按鈕。操作欄保留獨立捲動。
- 三腳脂質已於 `e586973` 部署成功，實際公開頁確認胰液作用 100% 畫面是笑臉主體與三隻分離的腳，不是舊球＋長條。未消化、咀嚼、分解、無作用消化液均使用同一三腳符號；膽汁中的球是油滴，維持乳化和分子分解的差別。
- 日夜縮時 `b478d6d` 已部署成功；公開頁照光完成後仍保留庭院，下一步「取葉、除鋁箔」可操作。只將黎明／黃昏光線曲線擴展兩倍，原六秒照光段、日程、擺動與陰影運動未改。

歷史 `animal_nutrition_check_v2.cjs`、脂質專項檢查是對應當時模組清單的舊版測試；本版整合測試使用上列兩支新檢查，包含新的總覽／絨毛外掛。

實體 iPad 與 Safari 未實測；桌面瀏覽器尺寸驗證不是實機結果。
