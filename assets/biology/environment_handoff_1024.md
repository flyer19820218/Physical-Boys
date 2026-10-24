# 人類與環境（單元 11）交接（2026-10-24 晚）

給接手的帳號／代理。先讀：本檔 → `assets/biology/environment_plan_1024.md`（§8 動畫共同規則、§2–4 每個動畫的規格、§7 待老師決定）→ `AGENTS.md` 的 13.5（一次只開一個 Opus、一個動畫）。不用讀整份 PROGRESS.md。

## 已完成並推上 main

- 規劃與 prompts：`environment_plan_1024.md`、`environment_ai_manifest_1024.jsonl`。
- 第 1 課的圖全部到齊並處理好：`assets/biology/environment_ai_1024/`（含 `sources.md`、`cut_environment_1024.py`、原圖備份在 `local-backups/20261024/environment_ai_originals/`）。封面：`assets/covers/biology_environmental_diversity_1024_v1.jpg`。
- 共用：`environment_kit_1024_v1.js`（包 EcologyKit，含新圖 SIZE、顏色語意、標籤）。
- 主程式：`environment_diversity_1024_v1.js`（4 分頁、文字、選擇題、「課本照片」檢視；每個動畫的步驟文字在 `VIEWS`）。尚未動到正式頁 `biology_environmental_diversity.html`。
- 預覽頁：`biology_environmental_diversity_1024_preview1.html`（每做完一個動畫，在 `environment_diversity_1024_v1.js` 那行之前加一行 `environment_draw_<名>_1024_v1.js?v=20261024-v1`）。
- 動畫完成：`count`、`composition`、`worth`（都已提交）。

## 第 1 課還沒做的動畫（7 個）

| 動畫 | 狀態 | 要用的圖（`environment_ai_1024/` 除非另註） |
|---|---|---|
| `frogs` | **半成品**（318 行，語法通過，未驗收；預覽頁已加 script） | BD1_ladybird_*.png 六隻；EC19 七星瓢蟲 |
| `response` | 未做 | BD1 瓢蟲沿用 |
| `mosaic` | 未做 | BD5_mosaic.jpg |
| `residents` | 未做 | BD6 四種、BD7 四種（BD7_chub/mayfly_nymph/dipper/river_snail）、ecology_ai_1023 的 HB2、HB4、HB6、HB7、HB8、EC16 |
| `uses` | 未做 | BD2 稻米四款、BD8_cotton/silk_cocoons/timber、BD8_rubber_tapping/yew/bamboo |
| `green` | 未做 | BD9a_rainforest.jpg、BD9b_palm_plantation.jpg（1024 寬，未放大） |
| `boundary`（P3，可最後） | 未做 | ecology_ai_1023/HB5_pond.jpg、BD5 |

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
