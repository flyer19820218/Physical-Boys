# 光合作用 V2：來源、AI 素材與重畫範圍

V2 保留 V1 與其備份，未發布 Git。老師 2026-10-07 明確要求修正雙語 UI、植物、葉綠體、氣孔及實驗裝置；本版是授權後的畫面重設，不宣稱「只換樣式」。六個主分頁、原有題目、模型狀態機、步驟門檻與時長保持不變。

## 課本核對

老師提供的 `/Users/lvyanjun/Downloads/702.pdf`，印刷頁 69、71–72：植物葉肉與氣孔、雙面遮光 5–7 天、沸水軟化、酒精隔水褪色、熱水沖洗、培養皿滴碘液。圖與手寫註記只作教學參考，沒有截取、鏡像或描摹後冒稱 AI 原創。

補回酒精燈、三腳架與陶瓷纖維網；火焰只加熱外層水。安全呈現與課本圖有一項明確差異：進行開口酒精處理前，以燈帽蓋熄酒精燈，利用已加熱的水浴褪色，避免開口酒精靠近明火；不宣稱逐幀完全照抄課本。

## 真實照片與授權圖

沿用 [V1 完整授權紀錄](photosynthesis_sources_v1.md) 中的四張已核對素材，圖片檔案不變。網頁逐張顯示作者、來源、授權、修改條件。葉片橫切與氣孔照片可觸控拖曳、雙指縮放；AI 圖沒有冒充它們。

## 新增原創 AI 圖（不是實拍）

植物 `photosynthesis_plant_ai_v2.png`、葉綠體 `photosynthesis_chloroplast_ai_v2.png`，內建 OpenAI imagegen 生成；頁面畫布及說明均標示 AI 概念圖、非實拍／非顯微照片。保持長寬比、透明背景，不嵌入 Base64；未提供他人圖作重製來源。原生成圖仍保留在 Codex generated_images。

植物提示詞：

> Create an original premium natural-history botanical scientific illustration for a junior-high interactive photosynthesis lesson. A complete small dicot shrub, leaves and stems ABOVE soil-level and branching roots BELOW, isolated on a genuinely transparent background. Entire plant fits with generous margins, portrait composition, green stem at center, 7-9 naturally asymmetric ovate pointed leaves attached by real petioles, mature richly detailed leaf surfaces with delicate branching veins and subtle imperfect edges, varying sizes and orientations. Fine tan branching roots clearly attached to the stem, roots occupy lower quarter. Scientific plate / museum-quality realistic 3D botanical rendering, softly lit emerald greens and warm tan roots, not flat cartoon, not a toy, not an icon. Natural morphology, no flowers, no pot, no ground slab, no labels, no arrows, no sun, no lettering, no numbers, no logos, no watermark. Transparent outside the plant. This is original conceptual artwork, not a photograph.

葉綠體提示詞：

> Original premium scientific 3D cutaway illustration of one chloroplast isolated on a truly transparent background, wide horizontal composition. A flattened elongated ellipsoid viewed obliquely from above, outer and inner envelope layers visible as thin distinct rims, large clean cutaway exposes pale green stroma. Inside: 7-9 irregularly distributed grana, each a stack of 5-9 very thin flattened green circular thylakoid discs, with several clearly visible broad thin stroma lamellae connecting grana; perspective, believable volume, delicately translucent envelope. Disc stacks must not look like thick pills or Lego bricks. Rich dark emerald membranes, light mint stroma, detailed membrane edges, realistic biomedical textbook / museum quality material and lighting, visually elegant not a children's cartoon or clip art. Scientific conceptual rendering, not micrograph. No labels, no arrows, no formulas, no text, no numbers, no watermark, no background, no stars, no decorative molecules. Keep entire structure within margins.

氣孔、實驗桌、酒精燈、水浴、培養皿、滴管與葉片表面均為原創 Canvas 程式模型，不是照片、非定量實驗紀錄。Canvas 疊加箭頭與流動粒子，未把 AI 靜態素材說成真實分子運動。

## 科學資料

- [OpenStax Biology 2e：葉片](https://openstax.org/books/biology-2e/pages/30-4-leaves)
- [OpenStax Biology 2e：光合作用](https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis)
- [Practical Biology：葉片澱粉檢驗](https://practicalbiology.org/standard-techniques/testing-leaves-for-starch-the-technique.html)

## 驗證界線

本頁附原版 Noto Sans TC 與 JetBrains Mono 本機字型，來源為 [Google Fonts 官方 Noto Sans TC](https://github.com/google/fonts/tree/main/ofl/notosanstc) 與 [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono)，附各自原始 OFL 授權及版權聲明，未修改字型。Native Canvas 已註冊同一份真字型，而非假名替代字型。

Native Canvas 可核對逐格裝置、光流、氣孔開閉與 JS 狀態；替代 DOM 測試不等於 Safari / iPad 實機。尚未取得真正瀏覽器的字型載入、computedStyle／觸控命中證據，不宣稱全部 V5 驗證通過。頁面字型載入失敗時會顯示警告，不吞掉錯誤。
