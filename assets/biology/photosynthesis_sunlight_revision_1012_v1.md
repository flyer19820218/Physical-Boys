# 日照縮時模擬（2026-10-12）

## 老師授權與範圍

老師要求：「照光等待不 ok，真一點；做成縮時攝影，要有陽光，植物也要動」。僅替換照光等待（step 1）畫面。不改其他分頁、鋁箔操作、取葉、水浴、沖洗、培養皿、碘液、題目判斷與八步模型。照光動作仍為 6 秒，其他動作仍為 4 秒；不改講義原有 5～7 天。

老師後續確認：「不用畫出太陽來」。太陽在畫面外，只以自然亮暗、葉面斑駁光與投影移動表現日照；沒有太陽圖示。

## 素材與真實性

- 新素材：`photosynthesis_sunlit_garden_ai_1012_v1.png`，原創寫實日照庭院背景。內建 OpenAI ImageGen 模式；無第三方參考圖，未轉載素材。不是實拍，沒有白底、字、標籤、商標或浮水印。
- 原生成檔：`/Users/lvyanjun/.codex/generated_images/01a04ddb-6e28-7263-a57d-c8cd7f95992c/exec-72dc434e-7f06-4874-bb54-3085abce1e0f.png`。原 PNG 原樣複製，未用其他工具編修。
- 植物沿用已核准的 `photosynthesis_potted_bean_ai_1011_v1.png`，來源、提示詞及透明背景紀錄見 [前版紀錄](photosynthesis_teacher_revision_1011_v1.md)。不新增另一株取代實驗對照。
- Canvas 即時合成日照、移動投影、莖葉風動。畫面明示「AI 縮時模擬，非實拍」；不能當作觀察證據，不代表實測天氣、日照強度、生長或光合作用速率。並未憑空新增植株生長、開花或枯萎。
- 盆土以下固定，柔軟莖部向上增加彎動，各葉片另有不同相位微幅擺動。先將同片葉的正反面鋁箔合成，再整體網格變形，因此鋁箔和葉片同步，不會漂移或換葉。
- 暫停、語言切換、分頁及背景停止沿用既有 RAF/model；沒有另開動畫迴圈。

## 完整生成提示詞

```text
Use case: photorealistic-natural. Asset type: background plate for an interactive biology sunlight time-lapse, not a documentary photograph. Primary request: an extremely realistic empty outdoor school garden bench in natural sunshine, photographed with a locked-off camera at the height of a small potted plant. Wide landscape composition, approximately 3:2. A weathered warm gray-brown wooden tabletop occupies the lower quarter of the frame, its far edge at 73 percent height, with a clean open center to place a plant on later. Behind it, lush garden foliage is softly defocused with convincing depth and natural bokeh. Real warm sunlight from above and to the right lights the wood and the foliage: believable dappled highlights and soft leaf shadows, sunlit rim highlights, restrained lens flare near the upper right edge. Natural textured timber, realistic photographic exposure and color, outdoor greens, rich forest green shadows. The scene must feel outdoors in actual sunny weather, not a studio or a cartoon. No plant or flowerpot on the bench, no person, no experimental apparatus, no animals, no labels, no text, no numbers, no watermark, no white background, no cartoon sun icon, no arrows, no dramatic fantasy rays. The tabletop center remains free of objects so the existing transparent plant can be composited there; perspective almost front-facing with a modest top surface visible. The sun is outside the frame; don't draw a yellow circle.
```

## 驗證

- `photosynthesis_sunlight_check_1012_v1.cjs`：72 張中英文縮時畫面通過；葉片區及場景像素確實改變，不是空轉計時。暫停前後像素逐 byte 相同；16 個盆土／花盆固定點沒有位移；標籤越界為 0。
- 非日照的 8 個實驗狀態 × 4 個動作時間點 × 2 語言，共 64 張：與修改前逐像素相同。其他繪圖函式沿用同一參照，未改動。
- 八步模型、動作時間、預測與重做通過；原模型 SHA-256 維持 `603e78d63458f283141ac5ae8542b0de1e677f6a76cbf287cc87dd4370c6cdf9`。
- 原 `photosynthesis_teacher_check_1011_v1.cjs` 回歸：280 張圖、208 張實驗畫面、6 分頁雙語，以及預測／暫停／重做等檢查通過。
- 實際 Codex 瀏覽器：中文播放與英文播放的畫面確實變動；暫停截圖完全相同；切換語言不丟失步驟／暫停狀態；照光完成可接取葉、除鋁箔，再接沸水軟化。console warning/error 為 0。
- 平板尺寸桌面模擬：1366×1024、1194×834、1180×820、1080×810、1024×768、1133×744，及各自直式，共 12 尺寸 × 2 語言。版面穩定後畫布無控制欄重疊／裁切，174 個完整可見按鍵中心點沒有被遮擋；英文直式控制欄捲到底後，繼續／重做按鍵可觸及。
- 實際瀏覽器畫面：`/private/tmp/photosynthesis_sunlight_browser_1012.png`。原生接觸表、逐幀及報告：`/private/tmp/photosynthesis_sunlight_1012_v1/`。尺寸紀錄：`/private/tmp/photosynthesis_sunlight_layout_1012.json`。
- 原生測試平均約 113 ms 包含 PNG 編碼／寫檔，不能當作動畫幀率；另測 60 幀純繪製平均約 11.2 ms，僅代表本機 Canvas，不推論實機 iPad 效能。

實機 iPad／Safari 未測，不把桌面模擬宣稱為實機驗證。
