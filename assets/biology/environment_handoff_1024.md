# 人類與環境（單元 11）交接（2026-10-24 晚）

給接手的帳號／代理。先讀：本檔 → `assets/biology/environment_plan_1024.md`（§8 動畫共同規則、§2–4 每個動畫的規格、§7 待老師決定）→ `AGENTS.md` 的 13.5（一次只開一個 Opus、一個動畫）。不用讀整份 PROGRESS.md。

## 已完成並推上 main

- 規劃與 prompts：`environment_plan_1024.md`、`environment_ai_manifest_1024.jsonl`。
- 第 1 課的圖全部到齊並處理好：`assets/biology/environment_ai_1024/`（含 `sources.md`、`cut_environment_1024.py`、原圖備份在 `local-backups/20261024/environment_ai_originals/`）。封面：`assets/covers/biology_environmental_diversity_1024_v1.jpg`。
- 共用：`environment_kit_1024_v1.js`（包 EcologyKit，含新圖 SIZE、顏色語意、標籤）。
- 主程式：`environment_diversity_1024_v1.js`（4 分頁、文字、選擇題、「課本照片」檢視；每個動畫的步驟文字在 `VIEWS`）。尚未動到正式頁 `biology_environmental_diversity.html`。
- 預覽頁：`biology_environmental_diversity_1024_preview1.html`（每做完一個動畫，在 `environment_diversity_1024_v1.js` 那行之前加一行 `environment_draw_<名>_1024_v1.js?v=20261024-v1`）。
- 動畫完成：`count`、`composition`、`worth`、`frogs`、`response`、`mosaic`、`residents`、`uses`、`green`、`boundary`（都已提交；第 1 課動畫全部完成）。

## 第 1 課動畫：10 個全部完成（frogs、response、mosaic、residents、uses、green 已完成，表中保留說明）

| 動畫 | 狀態 | 要用的圖（`environment_ai_1024/` 除非另註） |
|---|---|---|
| `frogs` | **已完成並驗收**（見下方，勿重做） | BD1_ladybird_*.png 六隻；EC19 七星瓢蟲 |
| `response` | **已完成並驗收**（左群用 orange0，右群 patch／black2red／pale；勿重做） | BD1 瓢蟲 |
| `mosaic` | **已完成並驗收**（農田／草地的水條件分別寫「灌溉」「雨水」，待老師確認） | BD5_mosaic.jpg |
| `residents` | **已完成並驗收**（森林步驟背景用 HB1_forest，圖像來源要補；英文第 4 步駱駝被藍鵲名字遮住一部分，小問題） | BD6 四種、BD7 四種（BD7_chub/mayfly_nymph/dipper/river_snail）、ecology_ai_1023 的 HB2、HB4、HB6、HB7、HB8、EC16 |
| `uses` | **已完成並驗收**（第 4 步四碗米各掛一個性狀＝示意，待老師確認；耐寒、耐淹是代理補的；黃色用在「研究價值」） | BD2 稻米四款、BD8_cotton/silk_cocoons/timber、BD8_rubber_tapping/yew/bamboo |
| `green` | **已完成並驗收**（分割線改成「點圖移動」，因外殼不傳拖曳；B 寫「3 個框，看到 1 個樣子」待老師確認） | BD9a_rainforest.jpg、BD9b_palm_plantation.jpg（1024 寬，未放大） |
| `boundary`（P3） | **已完成並驗收** | ecology_ai_1023/HB5_pond.jpg、BD5 |

做法（每個動畫都一樣，一次只開一個 Opus）：給代理 §8、該動畫段落、`VIEWS.<名>` 文字、範本 `environment_draw_count_1024_v1.js`；代理只新增 `environment_draw_<名>_1024_v1.js` 並在預覽頁加一行 script，跑 `qa_text.cjs`、`qa_page.cjs`、中英文逐步截圖；代理不 commit，主對話看過截圖再 commit／push。

## 動畫收尾後還要做

1. 老師決定新標題（§7）。決定後才換正式頁：把 `biology_environmental_diversity.html` 改成載入 kit＋所有 draw 檔＋`environment_diversity_1024_v1.js`＋`genetics_quiz_1020_v1.js`（照預覽頁的 script 與 CSS），更新三課章節導覽、首頁卡片（`index.html` 與 `INDEX_CARD_EN`）與封面。
2. `PROGRESS.md` 更新；`environment_plan_1024.md` §9 勾選。
3. 第 2、3 課（共 27 個動畫、47 張圖中尚未到的 TH／CV 系列）完全還沒開始：圖由 Antigravity 依 §5 生成；kit 已通用，主程式與預覽頁照第 1 課複製即可。

## 已知小問題／待老師確認

- `count` 裡澤蛙外框是粉紅，與「遺傳多樣性＝粉紅」撞色（`composition` 已改紅色）；有空時把 `count` 的澤蛙改成別色。
- EC15 圖是陸生蝸牛，動畫寫「蝸牛」，計畫原寫「田螺」。
- `composition` 食物網中螳螂只吃蚱蜢，畫面註明「只畫這 5 種之間」。
- `worth` 第 3 步用潮間帶封面當背景放森林動物，可能怪；第 1 步小圖沒有名字。
- 瓢蟲換成斯文豪氏赤蛙的決定、不放原住民文化 AI 圖、課本原圖授權，見計畫 §7。
- 預覽頁封面 404（`assets/biology/assets/covers/...`）是共用外殼既有行為，第 10 單元同樣有，不影響顯示。


## 第 2 課進度（2026-10-25）

- 圖片全部處理完（`environment_ai_1024/TH*`，腳本 `cut_environment_l2_1024.py`，紀錄在 `sources.md` 檔尾；TH8、TH14b 是程式衍生）、kit 已登記尺寸、主程式 `environment_threats_1024_v1.js`、預覽頁 `biology_environmental_threats_1024_preview1.html`（14 個動畫目前都是「動畫製作中」占位）。正式頁 `biology_environmental_threats.html` 還是舊版，等 14 個動畫做完再換（同第 1 課：預覽頁複製成正式頁、首頁卡片、導覽）。
- 動畫順序（一次一個 Opus）：`conc` → `judge` → `edge` → `fragment` → `harvest` → `pathway` → `stages` → `sources` → `chain` → `bioacc` → `magnify` → `shift` → `coral` → `timing`。做完一個，在預覽頁主程式那行之前加一行 `environment_draw_<名>_1024_v1.js?v=20261025-v1`。
- 完成：`judge`、`conc`、`edge`、`fragment`、`harvest`、`pathway`、`stages`、`sources`、`chain`、`bioacc`、`magnify`、`shift`、`coral`、`timing`（第 2 課 14 個動畫全部完成，已換正式頁、首頁卡片與導覽）（第 3 步拿掉「小魚→大魚」食物鏈箭頭，避免與 magnify 的「往上濃度變高」矛盾）

## 第 3 課進度（2026-10-25）

- 第 2 課 14 個動畫全部完成並已換上正式頁、首頁卡片、導覽。
- 第 3 課：圖片處理（`cut_environment_l3_1024.py`、`_report_environment_l3_1024.json`、sources.md 第 3 課段落）、kit SIZE、主程式 `environment_conservation_1024_v1.js`（5 分頁）、預覽頁 `biology_environmental_conservation_1024_preview1.html` 已完成；13 個動畫目前都是「動畫製作中」占位。正式頁 `biology_environmental_conservation.html` 還是舊的（動畫做完再換，並更新首頁卡片：新標題「保育，怎麼知道有沒有效？」、封面 `assets/covers/biology_environmental_conservation_1024_v1.jpg`）。
- 分頁與動畫：`conservation-evidence`：turtle、toolbox、assess；`habitat-connections`：fishway、corridor、monitor；`everyday-actions`：track(選項 s.action)、tradeoff、citizen；`traditional-knowledge`：season、clues、materials；`synthesis`：casefile。
- 動畫順序（一次一個 Opus）：`assess` → `track` → `clues` → `casefile` → `turtle` → `toolbox` → `fishway` → `corridor` → `monitor` → `tradeoff` → `season` → `citizen` → `materials`。做完一個，在預覽頁主程式那行之前加一行 `environment_draw_<名>_1024_v1.js?v=20261025-v1`。
- 完成：`assess`、`track`、`clues`、`casefile`、`turtle`、`toolbox`、`fishway`、`corridor`、`monitor`、`tradeoff`、`season`
- 已知：CV5b 構圖與 CV5a 不一致（fishway 要對位或切換，不要淡入淡出）；CV1_juvenile 原圖是成體姿勢，不要標大小。
