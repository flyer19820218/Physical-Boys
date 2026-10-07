# 光合作用 V3：剖面與分子運輸

老師明確要求：加粗箭頭、以可辨識的小分子取代點點、醣類用環形符號，植物改為剖面以教運輸。僅修改本單元；未 commit、未 push、未刪除舊版或其他協作者檔案。

## 圖像與生成方式

新增 [植物縱切剖面](photosynthesis_plant_cutaway_ai_v3.png)，使用內建 OpenAI imagegen，以本專案原創 AI 植物 V2 作編輯來源；沒有使用別人的照片或課本插圖重製。保持長寬比、原 PNG alpha 通道；未用程式修改生成圖。畫布另以原創 Canvas 放大木質部／韌皮部通道，通道與分子尺寸均為辨識示意。不是實拍或顯微照片。

原生成檔：
`/Users/lvyanjun/.codex/generated_images/01a04ddb-6e28-7263-a57d-c8cd7f95992c/exec-ec0e3a0e-e35b-4068-958c-4a4922cace7a.png`

最終提示詞：

> Use case: precise-object-edit / scientific-educational.
> Input image 1 is the edit target: our own original AI botanical plant illustration, not an external textbook.
> Primary request: turn this plant into an exquisite educational LONGITUDINAL CUTAWAY of roots, stem, petioles and one leaf, so students can see its internal transport tissues rather than only its exterior.
> Keep: realistic botanical leaf shapes, natural vein detail, asymmetrical branching, emerald greens, tan roots, complete portrait plant and fine roots within frame, premium museum-quality scientific 3D rendering. No cartoon, no clipart.
> Change: reveal a continuous clean longitudinal cutaway window in the central stem and main root, exposing slender parallel hollow xylem vessels on the interior side and phloem sieve tubes nearer the exterior, visibly connected through a cut petiole into the leaf vein. Use slightly enlarged internal tissues for teaching, but keep plant morphology credible. The main large right-facing leaf is partly cut away along a clean edge to expose upper/lower epidermis, densely packed palisade cells, airy spongy mesophyll and a vein; retain recognizable green leaf surface on the uncut part. Clear coherent organic anatomy, delicate believable tissue detail.
> Composition: full plant centered, roots lower quarter, central stem straight enough for Canvas transport overlays. Distinct open stem section visible from leaf junction to root. Cut surfaces use natural pale green/cream/tan colors, not prepainted arrows. Soft studio illumination and volume.
> Background: genuinely transparent outside the botanical specimen; remove every halo, gradient backdrop and ground shadow.
> No text, letters, numbers, labels, arrows, leader lines, molecules, sun, icons, logos, watermark. Do not add any separate inset or extra plant. Scientific conceptual illustration, not a micrograph or photograph.

AI 葉片切面的微細排列為概念圖；不拿生成圖當作特定物種真實切片的證據。精確運輸重點以右側 Canvas 通道及說明呈現。真實光學照片、授權葉片圖、封面、字型全部沿用 [V2](photosynthesis_sources_v2.md) 與 [V1](photosynthesis_sources_v1.md) 的來源／作者／授權／修改紀錄，檔案未變。

## 分子符號與科學界線

- 水：彎曲 O＋2H 球形模型，沿用生物 2-1 粉紅氧、白色氫；鍵角約 104.5°。
- CO₂：O–C–O 直線；碳使用深灰綠，不使用純黑。
- O₂：兩個相連的氧球。
- 葡萄糖：六角環辨識符號；蔗糖：六角＋五角相連。不是完整結構式、非立體化學投影。環上頂點不表示每個頂點都是碳。
- 礦物質：小顆粒，表示溶解的礦物離子，不是固體礦石。
- 光：光束與波線，無分子、無粒子流。
- 木質部與韌皮部各用一個放大的通道代表組織，不代表莖只有兩根管子。
- 水與礦物質的路徑是根→葉。本例蔗糖由成熟葉供應根；韌皮部運輸由來源到需求／儲藏部位，不能背成永遠向下。
- 葉片氣體路徑代表氣孔與葉肉的交換，不是 CO₂/O₂ 在木質部／韌皮部內輸送。
- 物質的移動符號不是即時濃度、定量速率或化學反應係數；光合作用不是一步完成。照光時植物也持續呼吸。

科學資料：

- [OpenStax Biology 2e：醣類、葡萄糖與蔗糖](https://openstax.org/books/biology-2e/pages/3-2-carbohydrates)
- [OpenStax Biology 2e：植物水與溶質運輸](https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants)
- 葉片、光合作用、實驗安全來源見 V2；原題、公式、實驗狀態機、程序、時長未改。

## 保護與驗證

V3 draw 繼承 V2 的 lab、evidence、leaf、photo 等原函式，逐函式相等檢查；另比對保衛細胞形狀、葉綠體素材定位與既有路徑座標，幾何不變。植物剖面／運輸新座標是本次明確授權的重設，不能宣稱整版只換樣式。

Native Canvas 使用真實本機 Noto Sans TC 與 JetBrains Mono，搭配替代 DOM 測互動、雙語、暫停、步驟與素材。此檢查不是 Safari/iPad 實機的字型、CSS computedStyle、全螢幕觸控命中驗證；後者仍待老師實機核對。沒有繞過先前本機瀏覽器的安全拒絕。
