# 電與磁｜四節電影式封面

製作日期：2026-10-08。本批次先交付本機預覽，尚未 commit 或 push；等老師檢查並明確同意後發布。

## 圖像來源與處理

四張均以內建 image_gen 依原創文字提示生成，非實拍、非教科書或網路照片重製；沒有套用外部作者圖片，沒有鏡像他人圖片冒稱 AI 原創。圖片可作本專案的教學情境封面；不宣稱公共領域、獨占著作權或 CC 授權。

完整提示：[提示紀錄](magnetism_cover_prompts_1008_v1.json)。選定原檔、處理方式與檢視：[生成紀錄](magnetism_cover_generation_1008_v1.json)。尺寸及 SHA-256：[素材清單](magnetism_cover_manifest_1008_v1.json)。程式檢查：[驗證紀錄](magnetism_cover_report_1008_v1.json)。

| 教材 | 封面主題 | 正式圖像 | 首頁縮圖 |
| --- | --- | --- | --- |
| 磁力與磁場 | 條形磁鐵、鐵粉與指南針 | magnetism_1_cover_v1.jpg | ../index_covers/magnetism_1008_v1/magnetism_1.jpg |
| 電生磁與電磁鐵 | 銅線繞鐵心、吸住金屬零件 | electromagnetism_2_cover_v1.jpg | ../index_covers/magnetism_1008_v1/electromagnetism_2.jpg |
| 磁力與電動機 | 商用型直流馬達剖面、轉子與電刷 | electric_motor_3_cover_v1.jpg | ../index_covers/magnetism_1008_v1/electric_motor_3.jpg |
| 電磁感應與交流電 | 磁鐵移入中空線圈與檢流計 | electromagnetic_induction_4_cover_v1.jpg | ../index_covers/magnetism_1008_v1/electromagnetic_induction_4.jpg |

原生成圖為 1536 × 1024；正式封面同尺寸 JPEG，首頁縮圖 960 × 640。均只做等比例編碼、不裁切、不鏡像。檢流計最初多出的小數字已用內建 image_gen 移除；保留原始輸出和編修輸出，不刪檔。

## 教學界線

封面只引出現象，不作精密磁力線、接線或測量標準；封面退場後才顯示原教材。馬達封面呈現多繞組商用型機構，不取代課內分裂環簡化模型。感應封面捕捉磁鐵移動瞬間，不表示磁鐵停住仍持續產生感應電流。

封面完全不顯示文字、數字、公式、Logo、提示按鈕或浮水印。點選畫面可進入；鍵盤 Enter／Space／Escape 可離開；圖片失敗時不阻擋教材。只有緩慢推鏡與暗角，沒有假光跡、火花或跑動電流顆粒。來源與 AI 標示位於封面退場後的頁尾。

## 保留範圍與驗證限制

四節只加入可剝離的 `MAGNETISM-COVER` 區塊和獨立封面 CSS／JS。不改既有 Canvas／SVG、座標、倍率、物理公式、電路接法、分頁、題庫、動畫與雙語函式。首頁沿用已核准的 1080px 框架與 iPad 三欄規則，其他卡片維持原樣。

檢查為來源逐字比對、資源路徑／尺寸／雜湊、JS 語法與替代 DOM 行為测试，並非實際瀏覽器、Safari／iPad 觸控或像素差異驗證。既有第二節的單語教材未在本次封面工作擅自重製為雙語；其餘既有切換保留，新增來源文字準備中英兩版。

本機備份：`source-markdown/backups/magnetism_covers_20261008_pre.Og9drw`，包含改前首頁、98 節教材、協作檔、原有縮圖及本批原生成素材。
