# 生物技術：AI 教學插圖紀錄（2026-10-21）

- 生成工具：Google Gemini（老師生成並提供，2026-10-21）。性質：AI 教學插圖，非實拍。
- 完整提示詞：`../genetics_ai_prompts_1020.md` 的 B1～B6。提示詞都是從科學內容重新描述，沒有把課本圖交給 Gemini 參考。
- 原始檔備份：`local-backups/20261021/biotech_ai_originals/`（同資料夾有去背程式 `cut_biotech_ai_1021.py` 與裁切紀錄 `cut_log.json`）。B2～B6 老師提供的是螢幕截圖，去背前先裁掉截圖的外框（每邊 8 px）。
- 這一課原本借用的課本照片（`../genetics_originals_1010_v1/Im824_1671.png`、`Im836_1837.png`、`Im846_1951.png`、`Im847_1952.png`、`Im849_1954.png`）不再使用，檔案沒有刪除。

| 本機檔名 | 用途 | 提示詞 | 處理 |
|---|---|---|---|
| dough_bowl.png、dough_risen.png、bread_loaf.png | 麵團發酵：三格流程（揉好 → 發酵後 → 烤好），發酵那一步兩張碗淡入淡出 | B1：麵團發酵前後與切開的麵包，灰底 | 玻璃碗會透出灰底，所以整張用「與背景的色差」當透明度（色差 7 以下全透明、46 以上不透明），玻璃變成看得穿、只留碗緣和反光；依連通區塊分成三個，縮為 0.5（兩個碗同尺寸，淡入淡出時對得齊） |
| yeast_cells.png | 原圖整群（備用） | B2：酵母菌，灰底 | 裁掉截圖外框，去灰底（含細胞之間的空隙），縮為 0.6 |
| yeast_budding.png、yeast_single.png、yeast_small.png、yeast_pair.png、yeast_tall.png | 放大鏡裡的酵母菌（麵團發酵、發酵食品） | 由 B2 切出 | 從 yeast_cells.png 依連通區塊切出單一細胞群（相連的出芽細胞保持一起），沒有再縮放 |
| food_soy_sauce.png、food_yogurt.png、food_pickled_cabbage.png、food_bread.png | 發酵食品四張卡片 | B3：發酵食品，白底 | 裁掉截圖外框，去白底，依連通區塊分開，縮為 0.6；醬油瓶上半段空的玻璃也用色差當透明度，看得穿 |
| sheep_white_face.png、sheep_black_face_egg.png、sheep_black_face_surrogate.png、lamb_dolly.png | 桃莉羊：提供細胞核、提供卵細胞、代理孕母、桃莉；臉部放大比較 | B4：複製羊，灰底 | 裁掉截圖外框，去灰底（含腳之間的空隙），依連通區塊分開，縮為 0.55。臉部比較是畫面上即時裁切同一張圖，沒有另存檔 |
| brassica_wild.png、brassica_cabbage.png、brassica_broccoli.png、brassica_cauliflower.png、brassica_kohlrabi.png、brassica_kale.png | 同一個祖先：野生甘藍與五種蔬菜；一代一代挑的最後一步（球莖甘藍） | B5：甘藍家族，白底 | 裁掉截圖外框，去白底（含枝條、花之間 3 px 以上的白色空隙），依連通區塊分開，縮為 0.6 |
| fish_green.png、fish_red.png、fish_green_unlit.png、fish_plain.png | 螢光魚：一般斑馬魚、照藍光前後、綠光與紅光、下一代 | B6：螢光斑馬魚，黑底（老師的圖多了一隻「沒照藍光的綠色魚」，用在開燈前） | **沒有去背**：每條魚連同黑色背景裁成長方形，縮為 0.5；頁面用「濾色（screen）」疊在黑板上，黑色自然消失，光暈保持原樣 |

- 去背方法（B2～B5）：從圖邊緣連通、與背景色差在容差內的區域是透明的；緊鄰背景的 3.5 px 依顏色距離做半透明，並把背景色從顏色中扣除，在黑板底色上不會出現灰邊或白邊。
- 圖的科學性：
  - B4 兩隻黑臉羊是同一品種（蘇格蘭黑臉羊），白臉羊與小羊都是白臉（芬蘭多賽特羊），符合桃莉的真實案例。Gemini 把黑臉羊畫成有角，蘇格蘭黑臉羊的母羊確實有角。
  - B5 野生甘藍畫成開黃花、葉片灰綠，與真實的野生甘藍相符。
  - B6 畫的是斑馬魚。臺灣 2003 年最早上市的螢光魚是螢光青鱂魚；頁面的延伸閱讀有說明。
  - 頁面用程式畫的示意：放大的麵團（筋性網、醣、二氧化碳、酒精、氣泡）、麴菌與乳酸菌、DNA 與質體、剪刀（實際是酵素，頁面有註明）、細菌分裂、胰島素、受精卵與玻璃針、水母與珊瑚、體細胞與卵細胞的核移植、胚胎分裂、一代一代挑選的植株。都不是真實比例。
- 科學內容核對：
  - 桃莉羊：<https://vet.ed.ac.uk/roslin/about/history/dolly/facts/life-of-dolly>；<https://www.scientificamerican.com/article/dolly-at-20-the-inside-story-on-the-world-s-most-famous-sheep/>（芬蘭多賽特羊的乳腺細胞、蘇格蘭黑臉羊的卵、277 次細胞核移植、1996 年 7 月 5 日出生）
  - 螢光魚：<https://en.wikipedia.org/wiki/GloFish>（新加坡團隊 1999 年做出綠色螢光斑馬魚；紅色螢光基因來自珊瑚；臺灣大學蔡懷楨團隊的綠色螢光青鱂魚，2003 年在臺灣上市，是全世界第一個核准基因轉殖觀賞魚販售的地方）
  - 學校午餐：學校衛生法第 23 條，禁止使用基因改造的生鮮食材及其初級加工品（聯合報 2026-04-02 報導教育部說明）。
  - 複製人：人工生殖法第 16 條第 1 項第 2 款，禁止以無性生殖方式實施人工生殖。
