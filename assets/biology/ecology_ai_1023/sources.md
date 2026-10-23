# 生物圈與生態關係（四課共用）：AI 教學插圖紀錄（2026-10-23）

- 生成工具：Google Gemini（老師生成並提供，2026-10-23）。性質：AI 教學插圖，非實拍照片；顏色與細節是人工畫的，大小不代表真實大小；頁面上要標「AI 插圖／教學示意」。
- 原始檔：`local-backups/20261023/ecology_ai_originals/`（18 張，檔名 `ECx_gemini_original.jpg`，原圖 2576×1438；EC8 為 1792×2400）。
- 處理程式：`cut_ecology_1023.py`（本資料夾）。白底／灰底去背、去白邊、依左右空隙切成單張，最長邊縮到 1400 px。重跑：`python3 -I cut_ecology_1023.py <原圖資料夾>`。
- 提示詞：`../ecology_ai_prompts_1023.md`（EC0～EC16，英文咒語；檔頭的單元規畫已過時，以 `../ecology_plan_1023.md` v2 為準）。
- 這批圖還沒有接進任何課；課本原圖 `../ecology_originals_1010_v1/` 沒有刪除，現行四課仍在使用。
- 這批 18 張全部都有，不缺。

## 原圖與輸出對照

| 編號 | 內容 | 底色 | 輸出（寬×高 px） |
|---|---|---|---|
| EC0 | 封面：清晨溪流與翠鳥 | 全幅 | `../../covers/biology_ecology_1023_v1.jpg` 1672×933 |
| EC1 | 向陽乾燥／背陰潮濕土壤切面 | 白 | `EC1_sunny_dry.png` 928×1116；`EC1_shady_moist.png` 929×948 |
| EC2 | 草地生態系全景（約 8 隻麻雀） | 全幅 | `EC2_meadow_scene.jpg` 1672×933 |
| EC3 | 生產者：水稻／芒草／狗尾草 | 白 | `EC3_rice.png` 590×1096；`EC3_miscanthus.png` 774×1141；`EC3_foxtail.png` 549×919 |
| EC4 | 初級消費者：蚱蜢／菜粉蝶幼蟲／田鼷鼠 | 白 | `EC4_grasshopper.png` 788×446；`EC4_caterpillar.png` 633×331；`EC4_vole.png` 634×568 |
| EC5 | 次級消費者：螳螂／澤蛙／麻雀 | 白 | `EC5_mantis.png` 803×760；`EC5_frog.png` 657×581；`EC5_sparrow.png` 723×612 |
| EC6 | 高階消費者：黑眉錦蛇／大冠鷲／領角鴞 | 白 | `EC6_snake.png` 847×559；`EC6_eagle.png` 536×874；`EC6_owl.png` 383×836 |
| EC7 | 落葉分解四階段 | 白 | `EC7_leaf_green.png` 533×925；`EC7_leaf_brown.png` 530×926；`EC7_leaf_skeleton.png` 530×924；`EC7_leaf_soil.png` 597×379 |
| EC8 | 樟樹整棵（直式 3:4） | 白 | `EC8_camphor_tree.png` 1026×1400 |
| EC9 | 獨角仙與鍬形蟲搶樹液（連樹皮方塊一起保留） | 白 | `EC9_beetles_sap.png` 1400×1167 |
| EC10 | 小丑魚與海葵／豆科根瘤 | 白 | `EC10_clownfish_anemone.png` 1111×1091；`EC10_legume_nodules.png` 1021×1243 |
| EC11 | 鳥巢蕨附生／鮣魚與鯊魚 | 白 | `EC11_nest_fern.png` 1071×1376；`EC11_remora_shark.png` 1229×493 |
| EC12 | 菟絲子／被寄生蜂繭附著的毛蟲 | 白 | `EC12_dodder.png` 1125×1204；`EC12_wasp_cocoons.png` 1018×522 |
| EC13 | 螳螂抓蚱蜢（可選） | 白 | `EC13_mantis_grasshopper.png` 692×1280 |
| EC14a | 水蚤／米蝦（可選） | 灰 (131,131,131) | `EC14a_daphnia.png` 783×974；`EC14a_shrimp.png` 1242×584 |
| EC14b | 鯽魚／大口黑鱸（可選） | 白 | `EC14b_crucian.png` 1003×587；`EC14b_bass.png` 1209×509 |
| EC15 | 福壽螺／粉紅卵塊／田螺（可選） | 白 | `EC15_apple_snail.png` 1037×639；`EC15_egg_mass.png` 221×744；`EC15_field_snail.png` 655×350 |
| EC16 | 黑面琵鷺站立／飛行（可選） | 灰 (131,131,131) | `EC16_spoonbill_stand.png` 999×989；`EC16_spoonbill_fly.png` 1188×783 |

## 已知小瑕疵（接進課之前要看一眼）

- `EC1_shady_moist`：原圖有淡綠色光暈，去背後邊緣可能殘留一點淺綠。
- `EC10_clownfish_anemone`：海葵觸手淺奶油色，外圍有淡淡的光暈，貼到深色黑板底上看邊緣。
- `EC7_leaf_skeleton`：右側邊緣有一個小缺口（淺色外框與背景連通所致），葉脈小格子刻意保留不透明。
- `EC14a_daphnia`：半透明身體，貼到黑板底上會偏灰；若要更透明要另外調。
- `EC4_vole`、`EC5_sparrow`、`EC13_mantis_grasshopper`：細毛／細腳邊緣偶有淺色點，貼上後要放大看。
- `EC9_beetles_sap`：連樹皮方塊整塊保留，不是單獨的甲蟲。
- `EC2_meadow_scene.jpg`、封面 `../../covers/biology_ecology_1023_v1.jpg`：整張不去背、不裁切，寬 1672 px。

## 演替分頁 SU 系列（Gemini 生成，2026-10-23 收圖；同日去背）
AI 插圖，非實拍。原圖左右各一塊，從中線切開；用 OpenCV GrabCut 去掉模糊的戶外背景，輸出透明 PNG（寬 800，SU4 寬 1000）。原圖在對話附件，未備份進 repo。
- `SU1_rock.png` 裸岩（起點：岩石）／`SU1_soil.png` 有土壤的岩面（起點：土壤）
- `SU2_lichen.png` 地衣＋苔蘚附著岩面／`SU2_seedling.png` 土壤上的草本幼苗
- `SU3_herb.png` 草本群落（草、開花植物）／`SU3_shrub.png` 灌木幼樹（有厚土壤）
- `SU4_forest.png` 林木：原圖只有 3 棵樹，用程式把去背後的樹冠縮小、調暗，疊成前後三排，變成較密的樹林（程式合成，不是原圖）。
- 已知瑕疵：樹冠邊緣、草尖有殘留的淺色背景點（SU3 草本、灌木、SU2 幼苗已再清掉一次淺色天空殘留）；SU2_seedling 的幼苗與 SU2_lichen 的苔蘚在去背時被切掉，由程式補畫；各圖區塊高度不同（寬同為 800），底邊要對齊使用。
