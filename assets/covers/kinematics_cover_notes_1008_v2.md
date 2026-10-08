# 直線運動學封面與首頁黑屏修正 · 2026-10-08

## 老師核准範圍

老師看過五張封面後，指示拿掉第一張不自然的燈光，其他四張保留並推送 Git。另核准首頁短片縮圖改取開頭第一個清楚畫面，維持靜止、不自動播放。本次不改教材內影片、poster、動畫、題目、公式或裝置。

## 五張 AI 封面

使用內建 image_gen；未使用第三方照片或插圖作母版，均為 **AI 情境插圖、非實拍**。場景、光跡與紙帶不能當作定量實驗證據。第一張以同一工具局部移除橘色彎曲光軌、青色斜線與兩顆發光圓點，保留自然校園景觀。其他四張選用輸出及像素檔案不變。無標題、公式、文字、Logo 或浮水印。

| 教材 | 完整封面 | 首頁縮圖 |
| --- | --- | --- |
| kinematics.html | assets/covers/kinematics_cover_v2.jpg | assets/index_covers/kinematics_1008_v2/kinematics.jpg |
| kinematics_2.html | assets/covers/kinematics_2_cover_v1.jpg | assets/index_covers/kinematics_1008_v1/kinematics_2.jpg |
| kinematics_3.html | assets/covers/kinematics_3_cover_v1.jpg | assets/index_covers/kinematics_1008_v1/kinematics_3.jpg |
| kinematics_4.html | assets/covers/kinematics_4_cover_v1.jpg | assets/index_covers/kinematics_1008_v1/kinematics_4.jpg |
| kinematics_5.html | assets/covers/kinematics_5_cover_v1.jpg | assets/index_covers/kinematics_1008_v1/kinematics_5.jpg |

完整圖 1536×1024、首頁縮圖 960×640；僅等比 JPEG 編碼，不裁切或鏡像。原始 PNG、舊版封面與預覽保留。生成服務的適用條款不等於保證排他著作權，也不改變本網站其他素材的授權。

- 五個原始提示詞：`assets/covers/kinematics_cover_prompts_1008_v1.json`。
- 選用原始輸出與完整修圖提示詞：`assets/covers/kinematics_cover_generation_1008_v2.json`。
- 老師指示、修圖母版與方法：`assets/covers/kinematics_cover_revision_1008_v2.json`。
- 素材 SHA256、尺寸、來源影片與保護檔案：`assets/covers/kinematics_cover_manifest_1008_v2.json`。

## 黑屏縮圖：只取第一個場景，不播片

原先首頁按第 0 幀抽圖，四支短片開頭為黑屏或尚未顯現場景的淡入。依老師本次核准，跳過黑屏及淡入的最暗部分，不取高潮或結尾。先逐幀檢查前 0.5 秒，以第一場景在 0.5 秒的亮度作參考，取最早達到其 95% 的畫面，再逐張目視核對；深色星空不以亮區面積誤判。

| 教材 | 來源影片 | 零起算幀 | 時間 |
| --- | --- | --- | --- |
| 牛頓第三運動定律 | assets/covers/newton_3_cover_v1.mp4 | 15 | 0.500 秒 |
| 圓周運動與萬有引力 | assets/covers/newton_4_cover_v1.mp4 | 11 | 0.458 秒 |
| 力矩與靜力平衡 | assets/covers/newton_5_cover_v1.mp4 | 12 | 0.500 秒 |
| 簡單機械 | assets/covers/work_4_cover_v1.mp4 | 11 | 0.458 秒 |

新縮圖：`assets/index_covers/first_visible_1008_v2/`。保留原始 1280×720、原亮度、不調色、不重新剪輯影片；首頁仍只載入 JPEG，無 video、audio 或播放腳本。這是老師核准的本次黑屏例外，不把 V5「不可取高潮／結尾」改掉。抽幀時間與亮度紀錄：`assets/index_first_visible_frames_report_1008_v2.json`。

## 保護、驗證與限制

移除五個新增封面區塊後，教材 HTML 逐字回復原檔；原有 inline JS、SVG／Canvas 座標變更為 0。其他 93 個教材檔與共同協作檔案保持工作開始時內容；首頁 98 個入口、標題、副標題、雙語／學科切換程式、1080px 與 iPad 三欄 CSS 不變。其他 89 張卡片逐字保持，四張影片卡僅更換縮圖及說明，83 張舊縮圖檔案全保留。

備份：`source-markdown/backups/kinematics_covers_20261008_pre.qPiX6D/` 與 `source-markdown/backups/kinematics_covers_20261008_publish.HhnXiD/`。新預覽：`index_kinematics_covers_preview_1008_v4.html`、`kinematics_natural_cover_preview_1008_v2.html`；沒有覆蓋已交付的預覽。未刪檔，不提交 Claude／老師的無關未提交修改。

來源／JS 語法／相對路徑／退場與載入失敗／雙語文字以程式檢查，報告：`assets/covers/kinematics_cover_report_1008_v2.json`。實際瀏覽器排版、字體載入、原動畫逐格像素差異、iPad／Safari 觸控仍未實機驗證；不把替代 DOM 測試稱作瀏覽器實測，也不繞過既有本機瀏覽器安全拒絕。
