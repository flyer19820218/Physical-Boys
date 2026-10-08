# 第四大單元進度

## 2026-10-08：4-1 本機 V1

老師授權「先快速做第一小單元，之後再細修」。本輪只製作植物的運輸構造，尚未發布。

- 正式檔：`biology_plant_structure.html`
- 新預覽：`biology_plant_structure_living_book_preview_1008_v1.html`
- 五主分頁：水／養分分工、葉莖相對位置、環狀／散生切片、形成層／年輪、中空／樹皮受損。
- 來源：`703.pdf` 印刷頁 89–93 原影像；手寫註記作教學參考，不當成程式指令，不公開整頁教師答案。書內圖號仍為 3-1 至 3-6，網站章號為第四大單元。
- 素材、權限與處理：`plant_structure_sources_1008_v1.md`、`ch4_plant_structure_1008_v1/source_manifest.json`、方向還原 manifest。原始檔保留；展示版本使用原生印刷色彩還原。
- 動態與互動：維管束分子追蹤、點原圖定位與放大視窗、真實切片辨認、逐季年輪／點成對年輪、樹木虛擬因果案例。完整解說與雙語全屏控制。
- 驗證：`plant_structure_checks_1008_v1.md`，30 個畫布情境與 10 個一秒像素差／最小 DOM 事件模型通過；iPad 尺寸算式通過，不冒稱瀏覽器或實機 fscheck。
- 備份：`local-backups/20261008/biology_plant_structure_living_book_v1/`。

沒有修改 index／README、沒有 commit／push；協作者原有變動全部保留。4-2、4-3、4-4 尚未開始製作，依老師看完 4-1 的指示接續。

## 2026-10-08：4-1 本機 V2 細修

- 老師授權放大主剖面、水／蔗糖辨識符號，加入韌皮部向上／向下的實際動畫；中空案例改成同心分層樹幹，中央老木逐漸中空但外側水與蔗糖持續運輸。
- 新預覽：`biology_plant_structure_transport_revision_preview_1008_v2.html`；正式檔改接 V2 CSS／模型／控制器。V1 預覽與素材不動。
- 詳細修正、科學參考與限制：`plant_structure_checks_1008_v2.md`。
- 42 張中英畫布、14 項一秒像素差、來源雜湊與事件模型通過；未改的定位／切片／年輪 12 項對照為 0 像素差。仍未驗證真實 iPad／Safari。
- 新備份：`local-backups/20261008/biology_plant_structure_transport_revision_v2/`。
- 沒有發布本單元、沒有新增未完成首頁入口。另依老師要求製作五張電化學封面，屬獨立的封面修改，不混入本單元教學本體。

## 2026-10-08：4-1 本機 V3，主圖優先

- 老師指出解說圖仍小，並授權左側控制鍵縮小。全螢幕控制欄 340 → 244px，按鈕字 22 → 18px，觸控高度至少 44px。
- 來源移到控制欄的收合區；主圖依右欄剩餘尺寸放到最大。長解說在圖下獨立捲動，減少擠圖。
- 科學、繪圖與原控制器保留 V2，逐位元組／所有數值座標未變。42 張原生 Canvas 影像與 V2 相同；14 項動態、36 項尺寸算式、雙語與事件模型通過。
- 新預覽：`biology_plant_structure_large_stage_preview_1008_v3.html`。細節：`plant_structure_checks_1008_v3.md`。V1／V2 預覽不動。
- 修改前與完成版備份：`local-backups/20261008/biology_plant_structure_large_stage_v3_pre.eY5lMT/`。
- 尚未真實瀏覽器／實機 iPad 驗證，沒有 commit／push，沒有改其他單元或首頁。

## 2026-10-08：4-1 本機 V4，五頁緊湊工具列

- 老師指出一般頁面仍是整排大控制區，要求全部版面縮小並排整齊。這次五頁一起重排，不再只處理全螢幕。
- 全螢幕／還原集中在標題旁的小工具列；同類選項分組並排。按鍵字 18 → 17px，觸控範圍至少 44×44px；主圖全寬，正文與畫布文字不縮小。
- 長提示與原圖來源在圖下收合，回饋與階段直接顯示。51 顆原有按鍵均保留原節點與事件處理器。
- V2 模型／控制器全部座標與動畫路線零變動；42 張畫布影像相同，14 項動畫、36 項尺寸算式、重排後事件與雙語檢查通過。
- 新預覽：`biology_plant_structure_compact_toolbar_preview_1008_v4.html`。細節：`plant_structure_checks_1008_v4.md`。
- 修改前及完成版備份：`local-backups/20261008/biology_plant_structure_compact_toolbar_v4_pre.4m5yv4/`。
- 尚未真實瀏覽器／實機 iPad 驗證；沒有改首頁／其他教材，沒有 commit／push。

## 2026-10-08：4-1 V4 核准發布

老師另行指示「4-1 先推上 git」。僅發布本單元正式頁、必要素材與首頁中英入口；其他單元、電化學封面及協作者尚未完成的修改保持原樣，不混入提交。4-2／4-3／4-4 不增設未完成入口。檢查與未驗證項目仍見 V4 稽核紀錄。

## 2026-10-09：4-2、4-3、4-4 初版核准發布

老師指示「直接都推上 git，等等有問題再修改」。本輪發布三份已完成初稿的正式頁、共用 UI／模型、實際使用的課本原圖、三張無字封面與來源紀錄；首頁第四大單元由 1 個更新為 4 個，新增三張中英封面卡片。

- 4-2：`biology_plant_transport.html`，5 個主題。
- 4-3：`biology_human_transport.html`，6 個主題。
- 4-4：`biology_immune_defense.html`，5 個主題。
- 正式頁之間改用正式網址，不發布本機預覽、整頁 PDF、備份或未使用的擷取圖。
- 不改 4-1 教材本體，其他協作者未完成的修改不混入提交。
- 檢查、來源及未驗證項目見 `chapter4_new_units_1008_v1.md`；Safari／iPad 實機版面仍待老師驗收。
