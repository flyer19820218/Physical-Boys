# 養分去向：真實證據與原有細胞剖面（2026-10-12）

## 授權範圍

老師指出三格簡筆圖不精確，明確授權改用已有細胞／粒線體圖及魚尾血流實拍。本版僅替換小腸站最後的 `use` 視覺分派；原 `AnimalDraw.use`、所有既有繪圖座標、消化酵素造型、吸收路徑、其他站動畫秒數均不變。不延伸製作下一個循環單元。

## 逐項素材

### 1. 小腸絨毛

- `animal_intestine_openstax_v1.jpg`：沿用已在本頁使用的原檔。
- 作者 OpenStax College；真實光學切片來源為 University of Michigan Medical School（Regents, 2012）。
- 原圖與授權：https://commons.wikimedia.org/wiki/File:2418_Histology_Small_IntestinesN.jpg ，CC BY 3.0。
- 修改：僅在 Canvas 顯示層取原圖 `(410,565,397,225)` 的絨毛光學切片、等比例放大。原 JPEG、原英文總圖與下方真實照片不改、不刪。這是顯微照片，不是養分運輸實拍。

### 2. 斑馬魚幼魚尾部血流

- 作者：Yujia Qi；UCLA, Department of Mathematics。
- 來源：zebrafish bloodflow，2023-09-18，https://zenodo.org/records/8354953 ，DOI 10.5281/zenodo.8354953。
- 授權：CC BY 4.0。原站 JSON `metadata.license.id = cc-by-4.0`，https://zenodo.org/api/records/8354953 。
- 原片：`4dpf-tail.avi`，44,268,420 bytes，來源公布 MD5 `5a357a7773896b2d958ec54517302cb7`。
- 選用未截肢的 tail 片段；不採用資料集中的 amputation 影片。
- 瀏覽器版：`fish_tail_bloodflow_1012_v2.mp4`；只做 H.264 轉碼，保留整段畫面、原片播放時間／幀率，不添加假血球、不改方向、不替血球加養分。影片海報 `fish_tail_bloodflow_1012_v2.jpg` 取成品第一幀。
- 檔案實測：原 AVI 100.1 秒、1001 幀、696 × 520、10 fps；轉碼後同樣 100.1 秒、1001 幀、696 × 520、10 fps。MD5 已與來源公布值完全相符。原片與 JSON 授權證據留本機備份，不把 44 MB 原片加入 Git。
- 標明「受精後第 4 天斑馬魚幼魚尾部」；不冒稱成年小魚尾鰭、人體微血管或人體小腸，也不把原片的相機播放幀率當成自然血流速度測量。
- CC BY 4.0 允許分享、改作，須署名、連結授權並註明轉碼。此紀錄及頁面保留作者與來源；不暗示作者為本教材背書。
- 授權全文：https://creativecommons.org/licenses/by/4.0/ 。

### 3. 細胞、粒線體

- `animal_cutaway_ai_v2.jpg`：Physical-Boys 既有原創 AI 精美細胞剖面，非實拍、非真實比例。
- 既有生成與標示紀錄：[cell_photo_credits_v4.md](cell_photo_credits_v4.md)。
- SHA-256：`c44bfabf58ce5b9e92e2ba6752a679f28208d6cc422c30d58bb1f672b85a060a`。
- 不修改圖檔、不重新生成。全細胞與下方橘色粒線體均取自同圖；粒線體放大取景 `(704,662,392,208)`，保持原比例，無白底。

## 教學文字核對

- 葡萄糖、胺基酸主要隨血漿運輸；紅血球主要協助運送氧。實拍能看見血球，但看不見單個養分分子。參考 https://openstax.org/books/biology-2e/pages/40-2-components-of-the-blood 。
- 細胞可把養分用於合成及獲取能量；粒線體參與有氧呼吸。糖解先在細胞質進行，不把整個葡萄糖直接送進粒線體的示意當實際反應。參考 https://openstax.org/books/biology-2e/pages/7-2-glycolysis 。
- 本版為原創短解說，不複製來源圖表／段落。保留消化、吸收與細胞利用的區別。

## 驗證紀錄

- 新繪圖原生 Canvas 測試：28 幅，20 次來源／顯示長寬比檢查，68 個雙語標籤邊界檢查，零越界。細胞與小腸原圖逐位元組比對 8c6f45d 完全相同。
- 原 controller／器官放大回歸：372 個控制動作、404 個單元守恆案例、24 個器官放大、24 個圖上點擊、216 個文字可見性檢查；維持單一 RAF，暫停／完成／雙語／平移縮放通過。
- 瀏覽器實際解碼影片：H.264，696 × 520，100.1 秒，播放倍率 1；readyState 4，影片 error 為空，播放時間前進。影片全長 FFmpeg 解碼亦通過。
- 瀏覽器 12 種尺寸（iPad Pro 13/12.9/11、Air、10.2、mini 的橫直參考 CSS 尺寸）× 2 語言 × 3 畫面，共 72 案例：畫面均在視窗內、不蓋控制欄、可見按鍵中心點命中正確按鍵、零橫向溢位。
- 原 `AnimalDraw.use` 全函式、其他繪圖／酵素／吸收幾何／故事秒數／原版 CSS 均以逐字比對確認未更動；本次是老師授權替換此一場景，不宣稱只改樣式。
- 本機預覽：`biology_animal_nutrition_evidence_preview_1012_v4.html`；原片與 JSON 授權證據、本次前版保存在 `local-backups/20261012-nutrient-evidence-pre.Y6Y49A/`。成品、檢查報告與截圖備份於 `local-backups/20261012-nutrient-evidence-final.f3swb4/`。
- 實機 iPad、Safari 尚未驗證，不以桌面 CSS 尺寸模擬冒稱通過。

## 可見性限制

幼魚原片中的大黑斑不隨血流移動，不把它們標成紅血球。觀察的是血管內移動的小細胞；此低對比研究原片可作真實血流證據，不能據此量人體血流速度、判定個別養分位置。
