# 植物的營養方式｜3-3 素材與科學來源（V1）

## 教學範圍

依老師提供的 /Users/lvyanjun/Downloads/702.pdf，第14–19頁（書頁67–72）及手寫註記規劃；不公開PDF或課本截圖。六個主分頁：原料與養分、葉片構造、光合作用、氣體交換、遮光葉片實驗、對照與推論。先製作本機預覽，尚未核准發布。

## 逐圖授權

1. photosynthesis_leaf_diagram_v1.svg：Zephyris，Leaf Tissue Structure；CC BY-SA 3.0。來源 https://commons.wikimedia.org/wiki/File:Leaf_Tissue_Structure.svg ，授權 https://creativecommons.org/licenses/by-sa/3.0/ 。移除14個原文標籤switch文字容器，加入viewBox；圖形path、形狀與transform保持不變。教材另加中英文說明及局部放大，改編SVG依相同授權提供。原圖未畫葉脈，頁面已明示。不宣稱AI原創。
2. photos/leaf_cross_optical_photo_v1.jpg：Iceclanl，Mesophytic Leaf Cross Section Microscope Image；CC BY-SA 3.0。來源 https://commons.wikimedia.org/wiki/File:Mesophytic_Leaf_Cross_Section_Microscope_Image.jpg ，授權 https://creativecommons.org/licenses/by-sa/3.0/ 。原JPEG未修改；螢幕內裁切及縮放不另存改造照片。染色切片不能把染色當成活葉自然色；來源未列倍率，不杜撰。
3. photos/guard_optical_v3.jpg：Trương Minh Khải，Stomata of Tradescantia spathacea leaves；CC BY 4.0。來源 https://commons.wikimedia.org/wiki/File:Stomata_of_Tradescantia_spathacea_leaves.jpg ，授權 https://creativecommons.org/licenses/by/4.0/ 。原檔未改。來源標示400倍；教材數位縮放與此倍率分開。
4. photos/elodea_clear_v2.jpg：Juan Carlos Fonseca Mata，Chloroplasts - Microscopic view of Elodea canadensis；CC BY-SA 4.0。來源 https://commons.wikimedia.org/wiki/File:Chloroplasts_-_Microscopic_view_of_Elodea_canadensis.jpg ，授權 https://creativecommons.org/licenses/by-sa/4.0/ 。復用先前已核對素材；等比例縮至長邊1800、JPEG壓縮，不改色、不鏡像、不改形狀。相關紀錄另見cell_photo_credits_v3.md。

照片來源頁與授權於2026-10-07逐張核對；授權不限於教育用途，仍需遵守署名與適用的相同方式分享條件。

## AI封面

檔案 assets/covers/biology_photosynthesis_cover_v1.png。內建OpenAI imagegen生成的原創AI概念影像，非實拍、非實驗紀錄。無文字、無結果預告；已目視核對。原生成檔保留在Codex generated_images；本專案只複製一份，不刪原檔。

完整提示詞：

Use case: photorealistic-natural. Asset type: cinematic no-text image cover for a junior-high biology photosynthesis lesson. Original wide 16:9 photorealistic botanical science concept illustration. Close view of a healthy real green geranium plant on a medium warm-gray stone laboratory bench beside a shallow clear glass petri dish, natural imperfect green leaf texture and crisp branching veins. One attached leaf has a neat opaque aluminum-foil band covering only its middle third, gently fitted on both sides without crushing the blade. Sunlit living leaves are the main subject, soft warm sunlight from a laboratory window, deep emerald softly blurred background, subtle glass reflections and natural resting shadows. No reaction results or blue-black iodine stain; preserve suspense. Scientifically sensible leaves and petioles. No people, no open flame, no fantasy particles, no diagram or painted cross section. Absolutely no text, numbers, formula, graduations, labels, logos or watermark anywhere. This is an original AI concept image, not an observation photograph.

## 科學與流程交叉核對

- OpenStax Biology 2e / 30.4 Leaves：https://openstax.org/books/biology-2e/pages/30-4-leaves （表皮、葉肉、葉脈、氣孔與保衛細胞）。
- OpenStax Biology 2e / 8.1 Overview of Photosynthesis：https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis （原料、能量、葉綠體與有機物）。
- Practical Biology / Testing leaves for starch：https://practicalbiology.org/standard-techniques/testing-leaves-for-starch-the-technique.html （沸水、酒精熱水浴、沖洗、碘液及酒精安全）。
- Practical Biology / Identifying conditions：https://practicalbiology.org/energy/photosynthesis/identifying-the-conditions-needed-for-photosynthesis.html （光照、葉綠素、CO₂控制與證據限制）。此網站的先暗處理48h再照光版本，不取代老師課本的遮光後照光5–7天版本。

課本完整式（反應兩側都有水）與淨反應分開標示，HTML上下標，無MathJax。植物日夜都呼吸；照光時箭頭為淨交換，不表示氣孔單向通行。模型開啟百分比只描述孔隙示意，並非實測速率。

## 原創模型及驗證界線

新寫的植物、葉綠體、氣孔、遮光葉實驗與證據圖均為教學示意，不是照片或實測資料。未更動既有教材的繪圖及物理邏輯。酒精隔水加熱使用無明火熱水浴示意；所有加熱均老師操作。模型有預測門檻、順序鎖、暫停、切語言保留進度；滴管從固定瓶子移出，在葉片上方垂直滴液。葉片移入水／酒精的大小小於容器內寬；平放培養皿時採桌面透視壓縮，不漂浮。

QA：photosynthesis_check_v1.cjs 可重跑。Native Canvas、替代DOM與本機替代中文字型可檢查JS、狀態、圖像解碼、雙語與幾何；不等於實機iPad或Safari CSS／觸控命中驗證。先前瀏覽器安全拒絕未繞過。
