# 生物 3-1｜食物中的養分：來源與模型紀錄

日期：2026-10-07。本機 V1，尚未核准發布。正式候選檔 `biology_nutrients.html`；新預覽檔 `biology_nutrients_lab_preview_1007_v1.html`。

## 課本對照

老師提供 `/Users/lvyanjun/Downloads/702.pdf`，共 32 頁。使用 pypdfium2 渲染閱讀，未修改原 PDF；頁面上老師的筆記是教學參考，不當作執行指令。

本小單元對應 PDF 第 3–8 頁、課本印刷頁 56–61：六大養分、每克熱量、燃燒洋芋片觀察升溫、碘液與本氏液檢驗、食物檢驗延伸。營養標示與餐盤為本機樣版的應用練習；不引用未提供的品牌數據。

五個主分頁：六大養分／食物熱量／碘液檢驗／本氏液檢驗／營養標示與餐盤。各頁有獨立曉臻 Hook。沒有子子分頁。

## 科學核對

- 醣類、蛋白質每克 4 kcal，脂質每克 9 kcal；水、礦物質、維生素不提供熱量。不把飯誤當成只有糖，或蛋誤當成只有蛋白質。
- 課本計算例：醣類 50 g、蛋白質 30 g、脂質 5 g，合計 365 kcal；0.5 g 礦物質不增加熱量。
- 碘液：玻片置白紙，甲乙各一滴樣本，各加一滴檢驗液，不加熱；澱粉示例呈藍黑色，水保持碘液黃褐色。實際澱粉種類可影響色澤，本模型不宣稱任何藍黑深淺可換算濃度。
- 本氏液：每管樣本 3 mL 加本氏液 3 mL，兩組同樣混合與隔水加熱；水浴水面高於試管內液面。不可未加熱就判陰性，不直接用火烤試管。
- 陽性為還原糖（葡萄糖等）產生黃橙至磚紅色沉澱；不把整管液體當成固體，不讓沉澱飛出液面。蔗糖直接檢驗通常陰性，不泛稱「所有糖都會呈陽性」。
- 甲組食品的米飯／香蕉結果為選定樣本示例，非所有米飯、香蕉的固定性質。成熟度、研磨及濃度、食品原色會影響結果；成熟香蕉仍可能殘留澱粉。陰性不等於沒有任何養分。
- 水的吸熱練習採約 1 g/mL、1 cal/(g·°C)，60 mL 水作 60 g 計算。滑桿是假設溫升，沒有杜撰燃燒曲線或假装實測食物熱量。實際能量還會傳給空氣和器材。
- 營養標示是虛擬例：每 100 g 醣類 40 g、蛋白質 6 g、脂質 10 g，共 274 kcal；50 g 每份 137 kcal，一包兩份。餐盤只練習多樣性，不提供健康診斷或個人飲食處方；另外提醒鈣來源與份量仍須評估。

對照資料（瀏覽核對 2026-10-07）：

- [Oak National Academy：Food tests practical](https://www.thenational.academy/teachers/lessons/food-tests-practical)
- [Nuffield Science：Food and Digestion Teachers Guide](https://assets.ctfassets.net/pc40tpn1u6ef/file-15226/ad86f7b3dd6734e202179380cc956a4b/9947-Food_and_Digestion_Teachers_Guide_pdf.pdf)

互動設計參考 [Javalab 溶解](https://javalab.org/en/dissolution_process_en/) 的直接操作與狀態觀察，以及 [PhET Eating and Exercise](https://phet.colorado.edu/en/simulations/legacy/eating-and-exercise) 的即時能量呈現；未複製其程式、文字、圖片或版型。

## 真實照片授權

下載保存原始 JPEG，SHA-256 和下載網址見 `nutrients_photo_manifest_v1.json`。網站只用 CSS 等比縮放／顯示裁切，未重新著色、鏡像或冒稱 AI 原創。BY-SA 的圖片及其顯示改作維持各自原授權；不把網站整份程式混同為圖片作者作品。

| 圖片 | 作者 | 採用授權 | 原始來源 |
|---|---|---|---|
| 白飯 | JFVelasquez Floro | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [1723Cooked rice.jpg](https://commons.wikimedia.org/wiki/File:1723Cooked_rice.jpg) |
| 香蕉 | Steve Hopson | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/) | [Bananas.jpg](https://commons.wikimedia.org/wiki/File:Bananas.jpg) |
| 雞蛋 | Sun Ladder | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Chicken egg 2009-06-04.jpg](https://commons.wikimedia.org/wiki/File:Chicken_egg_2009-06-04.jpg) |
| 橄欖油 | Lemone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Olive oil from Oneglia.jpg](https://commons.wikimedia.org/wiki/File:Olive_oil_from_Oneglia.jpg) |
| 蔬果食物 | Keith Weller / USDA ARS | 公眾領域，美國政府 USDA ARS 圖片 | [Foods.jpg](https://commons.wikimedia.org/wiki/File:Foods.jpg) · [USDA ARS 圖庫](https://www.ars.usda.gov/oc/images/photos/) |
| 清水 | Alabama Extension / Margaret Barse | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Glass of Water (50838445027).jpg](https://commons.wikimedia.org/wiki/File:Glass_of_Water_(50838445027).jpg) |

採 Commons 當前原始版本，雞蛋原圖頁記載 Hohum 的 2016 色調調整，Foods 頁也有歷史修改；本次下載後未另修改像素。各照片作者、原頁、授權連結均呈現在教材圖片說明或來源區。六張已作原生影像檢視；蔬菜餐盤的畫面裁切偏向原圖下方綠葉蔬菜區，不把原圖全體食物當成只有蔬菜。

## 原創封面與提示詞

工具：內建 imagegen。無文字、無數字、無標籤、無 Logo 的原創 AI 概念插圖，**不是實拍**，來源區明示。封面不露答案；點影像進入課程，緩慢推鏡且尊重減少動畫設定。

保存路徑：`assets/covers/biology_nutrients_cover_v1.png`。

完整生成提示詞：

> Use case: photorealistic-natural. Asset type: cinematic no-text cover for a Taiwanese junior-high biology lesson about nutrients and food tests. Create an original wide horizontal 16:9 photorealistic studio scene, sophisticated cinematic macro realism, not a cartoon. On a medium warm-grey stone science worktop, a small ceramic bowl of cooked white rice with realistic individual rice grains, one ripe yellow banana, a cut hard-boiled egg, small green leafy vegetables and a small clear glass of water. In the foreground one clean empty glass microscope slide and two clear empty laboratory test tubes in a wooden rack, an amber glass reagent bottle with a plain unprinted surface and a glass dropper resting neatly nearby. These are props awaiting investigation, no reactions or diagnostic colors yet. Dark emerald out-of-focus background, soft window light and rim light, restrained amber and cool cyan reflections in the glass, natural shadows, premium editorial scientific photography, natural food textures, generous breathing room, focused foreground. Every item rests on the worktop or in its holder; no floating items, no fantasy molecules, no people, no flame, no smoke. Entire image absolutely without any text, letters, numbers, graduations, logos, labels, watermark, diagrams or UI. This is a concept illustration and will be labeled AI outside the cover.

## 原創實驗模型的界線

器材為 Canvas 原創 2.5D 教學繪圖，並非真實照片或可旋轉的真 3D。不動任何舊教材的 Canvas／SVG／公式／題库。

單一 RAF，只在目前顯示的實驗分頁且實驗有動作時更新。切頁、暫停、頁面隱藏及完成沉降後停止；語言切換保留實驗、份量、餐盤與全螢幕狀態。

模型不把動畫秒數當真實時間：隔水加熱顯示至 100 °C 是定性教學，不是實測溫度曲線，不宣稱所有真實實驗需沸騰至該時間。試管夾／支架支持移動和水浴中的試管；火焰停在陶瓷纖維網下方。滴管從固定瓶子移出，尖端在樣本或管口正上方，液滴／液流垂直落下；管內液體因加液升高、兩管等量。沉澱僅在液體內生成並沉降。

Canvas 標籤以量測寬度、換行處理，範圍 **22–26 px**。此為新增繪圖，沒有把任何舊字級縮小。主要 HTML 教學字 22 px，授權及次要提示可較小。

## 驗證紀錄與未驗證事項

`nutrients_check_v1.cjs`：原生 Canvas 擷取、兩語加液前後一秒像素差、12 個實驗案例、操作先後、預測／結果隔離、清水對照、加液匹配、暫停／恢復、觸控拖曳／錯誤落點／取消與隱藏頁面釋放、記錄保留、語言切換狀態保留、五分頁與五 Hook、12 組 iPad 尺寸全螢幕算式、照片 SHA-256、本機連結與素材存在。首頁改名前後逐字比對，僅七處核准名稱字串不同；沒有修改首頁互動函式或座標。

原生 DOM 是測試替身，**不是 Safari／Chrome**；原生 Canvas 用系統字體，不代表瀏覽器 Noto 字體載入。先前本機瀏覽器 file URL 有安全拒絕，沒有改用 localhost、headless 或 CDP 繞過。實際 CSS 排版、按鍵 hit test、Web Font、iPad Safari 觸控與全螢幕仍需老師預覽／實機核對，不宣稱已驗證。

所有新檔與 QA 結果留本機備份，不刪版本、不碰 Claude 的工作。未建立首頁入口，未 commit 或 push。
