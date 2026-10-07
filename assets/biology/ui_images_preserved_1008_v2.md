# 美圖保留、只調整頁面編排 · 2026-10-08 V2

老師澄清：生物美圖是賣點，不應因介面統一而拿掉；要求改頁面內編排並縮小過大的字。

## 修正

- V1 覆蓋 `.hero` 為 `background:none`，雖然原始圖片檔仍在，頁首美圖卻被關掉。V2 恢復十個單元原有的背景圖片及各自遮罩。
- 本機預覽總覽恢復圖像入口：十張既有單元封面、文字放在圖片下方，圖片等比完整顯示。
- 主標 44 → 36px；段落標題 30 → 28px；小標／Hook 標題 26 → 24px；主要內文 22 → 20px。
- 主按鈕 21 → 20px，最小高 52 → 48px；分頁主字 22 → 20px、副字 17 → 16px；保留清楚的選中顏色、88px 曉臻頭像與 1080px 主框架。
- 這些縮字是老師本次明確指定的 HTML UI 調整，不更改 Canvas 內的字、繪圖座標、幾何、動畫、實驗或題目。
- 原無字開場封面、圖片授權紀錄與圖庫都保留；新的圖片清單用已存在的 AI 封面，清楚註明非實拍，無新素材重製。
- V1 CSS／預覽保留，V2 使用新 CSS 與新 HTML 檔名；只替換正式十頁的 CSS 入口與 body 的單元識別屬性。
- 製作階段不改首頁、README、其他學科或 Claude 的檔案，不刪檔、不 commit／push；2026-10-08 老師核准新版後，另補動物營養首頁入口、英譯、章節數量與 README，再限定範圍發布。

## 預覽與驗證

- 總覽：`biology_images_preserved_preview_1008_v2.html`。
- 各單元：`biology_<unit>_images_preserved_preview_1008_v2.html`。
- 比對依據：上一版完整備份 `source-markdown/backups/biology_ui_atomics_20261008_post.fsmam5`。
- 靜態核對十頁除 CSS 入口與 UI metadata 外內容逐字相同；比對所有既有 JS／SVG／Canvas 與圖片 SHA256，不把靜態檢查宣稱為瀏覽器實測。
- Safari／iPad 實機、computed style 與 hit-test 尚未驗證；遵守原本瀏覽器的安全拒絕，不透過其他管道繞過。

## 核准發布

- 老師核准十個生物單元新版；美圖與教學內容仍保留。
- 發布前，310 個上一版相依檔案 SHA256 全部相同，十頁只有 CSS 入口與 UI metadata 差異；繪圖座標差異 0。
- 首頁只增加動物營養卡片及英譯，養分章數量 3 → 4；README 補上正式單元與素材紀錄。全站 cover 清單改版另做預覽，不混入這次發布。
- 修改前／後完整備份與預覽均留在本機；發布導覽檔修改前另備份至 `source-markdown/backups/biology_publish_20261008.zbtR8f`。
