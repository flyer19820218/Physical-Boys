# 人類與環境（單元 11）AI 插圖來源與處理紀錄

- 生成工具：Google Gemini（老師提供），2026-10-24。以下所有圖片都是 **AI 教學插圖，非實拍**。
- 原圖備份：`local-backups/20261024/environment_ai_originals/`（Gemini 原檔，未經處理）。
- 處理腳本：`cut_environment_1024.py`（白底去背＋去白邊＋依空隙切開；場景圖縮成 1672 寬）。紀錄：`_report_environment_1024.json`。

| 代號 | 檔案 | 內容 |
|---|---|---|
| BD0 | `assets/covers/biology_environmental_diversity_1024_v1.jpg` | 第 1 課封面（潮間帶，圖上無文字） |
| BD1a／BD1b | `BD1_ladybird_*.png`（6 隻） | 異色瓢蟲：底色、斑點不同 |
| BD2 | `BD2_rice_*.png`（4 款） | 白米、糙米、黑米、紅米 |
| BD3 | `BD3_*.png`（4 種） | 蜜蜂、蜻蜓、鳳蝶、蟋蟀 |
| BD4 | `BD4_reef.jpg` | 珊瑚礁與魚群 |
| BD5 | `BD5_mosaic.jpg` | 一個地區的斜俯視全景（山、森林、草地、農田、溪流、濕地、海岸） |
| BD6 | `BD6_*.png`（4 種） | 臺灣藍鵲、山羌、藍腹鷴、臺灣獼猴 |
| BD7 | `BD7_*.png`（4 種） | 苦花、蜉蝣稚蟲、河烏、川蜷 |
| BD8b | `BD8_rubber_tapping.png`、`BD8_yew.png`、`BD8_bamboo.png` | 橡膠樹採膠、紅豆杉枝（紅色假種皮）、竹筍與竹竿 |
| BD9a／BD9b | `BD9a_rainforest.jpg`、`BD9b_palm_plantation.jpg` | 多層次的熱帶森林、整齊的棕櫚園（原圖只有 1024 寬，未放大） |
| BD8a | `BD8_cotton.png`、`BD8_silk_cocoons.png`、`BD8_timber.png` | 棉花、蠶繭、木材 |

## 已知瑕疵

- 棉花枝條之間留有一小塊白色空隙；藍腹鷴、獼猴兩腳之間有一小處缺口（去背時保留白色主體的取捨）。
- 白色主體（蠶繭、棉花、藍腹鷴尾羽）靠「只去掉與邊緣相連的背景」處理，邊緣偶有細小缺角。
- 動物與作物的外形、斑紋為 AI 生成，只作示意，不代表真實物種的標準樣貌。

## 說明

第一批與第二批圖都已到齊。紅豆杉、竹筍的白縫用「去近白像素」處理；橡膠杯內的白色膠乳保留。BD9a／BD9b 是教學示意，不是同一個地點。

## 第 2 課（人類活動與威脅）

- 生成工具：Google Gemini（老師提供的 AI 教學插圖，非實拍），2026-10-25 整理。原圖備份：`local-backups/20261025/environment_l2_originals/`（檔名 `TH*_gemini_original.*`）。
- 處理腳本：`cut_environment_l2_1024.py`（可重跑；紀錄 `_report_environment_l2_1024.json`）。場景圖 2576 寬縮成 1672 寬 jpg（品質 88），1024 寬的不放大；白底去背圖依連通區塊切開、去白邊；TH5、TH11 依位置手動指派；TH11 用柔邊 alpha 保留觸角與絨毛，並去掉淡灰細紋。
- **TH8、TH14b 是程式衍生，不是 Gemini 原圖**：TH8 由 `ecology_ai_1023/HB5_pond.jpg` 以程式把水面染成藻華；TH14b 由 TH14a 以程式把珊瑚改成白化。兩者都是示意，已是定稿，只轉成 jpg。檔名帶 UNUSED 的 Gemini 原圖（構圖與底圖不同）不採用。
- **TH5 有三個版本，採用第一版**（`local-backups` 內只留採用版）。
- 圖上沒有文字；所有圖片都是 AI 教學插圖，大小與比例不代表真實大小。

| 代號 | 本機檔案（尺寸） | 原圖檔名 | 處理 | 已知問題 |
|---|---|---|---|---|
| TH0 | `assets/covers/biology_environmental_threats_1024_v1.jpg`（1672×933） | `TH0_gemini_original.jpg` | 縮成 1672 寬 | 遠處車燈後隱約可見車形（已知）；封面無字 |
| TH1a | `TH1a_forest_top.jpg`（1672×933） | `TH1a_gemini_original.jpg` | 縮圖 | — |
| TH1b | `TH1b_farmland_top.jpg`（1672×933） | `TH1b_gemini_original.jpg` | 縮圖 | — |
| TH2 | `TH2_leopard_cat_stand.png`（1122×701）、`TH2_leopard_cat_walk.png`（1198×562） | `TH2_gemini_original.jpg` | 去背、切開 | — |
| TH3 | `TH3_edge_section.jpg`（1024×572） | `TH3_gemini_original.png` | 轉 jpg，不放大 | 原圖只有 1024 寬，偏小 |
| TH4 | `TH4_bluefin_adult.png`（530×215）、`TH4_bluefin_juvenile.png`（393×159） | `TH4_gemini_original.png` | 去背、切開 | 原圖 1024 寬，單隻偏小 |
| TH5 | `TH5_red_eared_slider.png`（739×388）、`TH5_crayfish.png`（422×766）、`TH5_green_iguana.png`（1189×528）、`TH5_spot_legged_treefrog.png`（485×381） | `TH5_gemini_original.jpg` | 去背；連通區塊分組（樹蛙與綠鬣蜥尾端相鄰，已分開，樹蛙完整） | 版本一 |
| TH6 | `TH6_vine_smother.jpg`（1672×933） | `TH6_gemini_original.jpg` | 縮圖 | — |
| TH8 | `TH8_pond_bloom.jpg`（1672×933） | `TH8_derived_from_HB5.png` | **程式衍生**（HB5 池塘染藻華），轉 jpg | 示意；與 HB5 構圖一致 |
| TH10a | `TH10_factory.png`（695×925）、`TH10_traffic.png`（711×543）、`TH10_sprayer_field.png`（694×523） | `TH10a_gemini_original.jpg` | 去背、切開，連同土壤剖面 | — |
| TH10b | `TH10_drain.png`（766×845）、`TH10_fish_farm.png`（858×670）、`TH10_livestock.png`（781×709） | `TH10b_gemini_original.jpg` | 去背、切開 | — |
| TH11 | `TH11_diatoms.png`（194×394）、`TH11_copepod.png`（344×340）、`TH11_sardine.png`（447×156）、`TH11_mackerel.png`（448×145） | `TH11_gemini_original.png` | 去背、依位置手動指派；柔邊 alpha | 原圖 1024 寬偏小；橈足類觸角、矽藻絨毛已保留，極細末端略淡 |
| TH12 | `TH12_formosan_salmon.png`（506×182）、`TH12_alpine_rhododendron.png`（378×394） | `TH12_gemini_original.png` | 去背、切開 | 原圖 1024 寬偏小 |
| TH13 | `TH13_cherry_bloom.png`（375×444）、`TH13_cherry_buds.png`（283×433）、`TH13_white_eye.png`（264×244） | `TH13_gemini_original.png` | 去背、切開 | 原圖 1024 寬偏小 |
| TH14a | `TH14a_coral_healthy.jpg`（1024×572） | `TH14a_gemini_original.png` | 轉 jpg，不放大 | 原圖 1024 寬偏小 |
| TH14b | `TH14b_coral_bleached.jpg`（1024×572） | `TH14b_derived_from_TH14a.png` | **程式衍生**（TH14a 把珊瑚改成白化），轉 jpg | 示意；與 TH14a 同尺寸同構圖 |

## 第 3 課（保育與永續）

- 生成工具：Google Gemini（老師提供的 AI 教學插圖，非實拍），2026-10-25 整理。原圖備份：`local-backups/20261025/environment_l3_originals/`（檔名 `CV*_gemini_original.png`，共 18 張，原圖皆 1024×572）。
- 處理腳本：`cut_environment_l3_1024.py`（可重跑；紀錄 `_report_environment_l3_1024.json`）。因原圖只有 1024 寬，場景圖與封面**不放大**，只轉 jpg（品質 88）；白底去背圖去背、去白邊、依空白欄（CV1a、CV5d 依連通區塊）切開；CV1b 的卵窩補回被誤去背的白色卵。
- 圖上沒有文字；所有圖片都是 AI 教學插圖，大小與比例不代表真實大小。綠蠵龜、日本鰻鱺、吻鰕虎、石虎等物種特徵為 AI 生成，待老師確認。CV9（野外用具）、CV11（天然素材）為補充圖。

| 代號 | 本機檔案（尺寸） | 原圖檔名 | 處理 | 已知問題 |
|---|---|---|---|---|
| CV0 | `assets/covers/biology_environmental_conservation_1024_v1.jpg`（1024×572） | `CV0_gemini_original.png` | 不放大，存 jpg | 原圖只有 1024 寬；封面無字（沙灘黎明、一列小海龜、浪邊成年海龜） |
| CV2 | `CV2_nesting_beach.jpg`（1024×572） | `CV2_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | 畫面偏亮，不太像黎明 |
| CV3 | `CV3_seagrass.jpg`（1024×572） | `CV3_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | — |
| CV5a | `CV5a_weir.jpg`（1024×572） | `CV5a_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | — |
| CV5b | `CV5b_weir_fishway.jpg`（1024×572） | `CV5b_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | **非逐像素編輯圖**：構圖與 CV5a 不同（堰偏左、視角略異），淡入淡出會跳動，動畫要用對位或切換 |
| CV5c | `CV5c_fishway_section.jpg`（1024×572） | `CV5c_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | — |
| CV6a | `CV6a_overpass.jpg`（1024×572） | `CV6a_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | — |
| CV6b | `CV6b_underpass.jpg`（1024×572） | `CV6b_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | — |
| CV7b | `CV7b_ir_frame.jpg`（1024×572） | `CV7b_gemini_original.png` | 轉 jpg，不放大（原圖 1024 寬） | 灰階紅外線風格，非實拍 |
| CV1a | `CV1_green_turtle_adult.png`（369×278）、`CV1_green_turtle_tagged.png`（370×279）、`CV1_hatchling.png`（227×141） | `CV1a_gemini_original.png` | 去背、切開 | 小海龜帶一小塊沙底一起去背 |
| CV1b | `CV1_juvenile.png`（509×311）、`CV1_nest_cutaway.png`（367×390） | `CV1b_gemini_original.png` | 去背、切開 | 卵窩的白色卵被誤挖洞，已補回；原圖畫的是成體姿勢，作「亞成體」用時不標大小 |
| CV5d | `CV5_eel.png`（500×341）、`CV5_goby.png`（469×152） | `CV5d_gemini_original.png` | 去背、切開 | 主體水平重疊，依連通區塊切開 |
| CV7a | `CV7_camera_trap.png`（338×506） | `CV7a_gemini_original.png` | 去背、切開 | 自動相機綁在一段樹幹上（樹幹一起保留） |
| CV8a | `CV8_reusable_cup.png`（187×326）、`CV8_paper_cups.png`（178×318）、`CV8_tote_bag.png`（385×255） | `CV8a_gemini_original.png` | 去背、切開 | — |
| CV8b | `CV8_bicycle.png`（301×197）、`CV8_bus.png`（357×152）、`CV8_meal_set.png`（220×158） | `CV8b_gemini_original.png` | 去背、切開 | 車輪輻條間的白底一併去掉（透出黑板色） |
| CV9 | `CV9_notebook.png`（281×194）、`CV9_binoculars.png`（228×210）、`CV9_camera.png`（211×122）、`CV9_hand_lens.png`（115×242） | `CV9_gemini_original.png` | 去背、切開 | — |
| CV10 | `CV10_flying_fish_glide.png`（447×253）、`CV10_flying_fish_swim.png`（439×130） | `CV10_gemini_original.png` | 去背、切開 | — |
| CV11 | `CV11_bamboo.png`（187×400）、`CV11_pandan.png`（248×431）、`CV11_areca_sheath.png`（241×429）、`CV11_banana_leaf.png`（173×447） | `CV11_gemini_original.png` | 去背、切開 | 露兜葉葉片間的白縫有少量細小缺角 |
