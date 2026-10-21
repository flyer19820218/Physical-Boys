# 突變：AI 教學插圖紀錄（2026-10-21）

- 生成工具：Google Gemini（老師生成並提供，2026-10-21）。性質：AI 教學插圖，非實拍。
- 完整提示詞：`../genetics_ai_prompts_1020.md` 的 U1～U4。提示詞都是從科學內容重新描述，沒有把課本圖交給 Gemini 參考。
- 原始檔備份：`local-backups/20261021/mutations_ai_originals/`（同資料夾有去背程式 `cut_mutations_ai_1021.py`、改色程式 `derive_dark_calf_1021.py` 與裁切紀錄 `cut_log.json`）。U2、U4 老師提供的是螢幕截圖，去背前先裁掉截圖的深色外框。
- 這一課原本借用的課本照片（`../genetics_originals_1010_v1/Im809_1545.png`、`Im810_1548.png`、`Im811_1549.png`）不再使用，檔案沒有刪除。

| 本機檔名 | 用途 | 提示詞 | 處理 |
|---|---|---|---|
| buffalo_cow.png、buffalo_calf_albino.png | 小水牛怎麼是白的（比一比、放大看）；一家人（爸媽只用頭頸部） | U1：水牛媽媽與白化小水牛，灰底 | 去灰底，依連通區塊分開兩隻，縮為 0.55（兩隻同一比例） |
| buffalo_calf_dark.png | 一家人：AA、Aa 的灰黑色小牛 | 由 U1 衍生 | 把白化小牛的亮度當陰影，改成水牛媽媽的灰黑色，小腿保留淺色（像媽媽）；輪廓與眼睛不變。**程式改色的示意，不是另外生成的圖** |
| sparrow_normal.png、sparrow_albino.png | 比一比；好還是壞 | U2：一般麻雀與白化麻雀，灰底 | 裁掉截圖外框，去灰底（含腳與樹枝之間的空隙），左右分開，縮為 0.8 |
| peacock_blue.png、peacock_white.png | 比一比（補充：白孔雀不是白化）；好還是壞 | U3：藍孔雀與白孔雀，灰底 | 去灰底（含尾羽之間的空隙），依連通區塊分開（尾羽與白孔雀在左右方向有重疊），縮為 0.5 |
| eye_peacock_blue.png、eye_peacock_white.png、eye_sparrow_albino.png | 放大看（孔雀）：看眼睛分辨是不是白化 | 由 U2、U3 裁切 | 原尺寸、以眼睛為中心的正方形裁切（已去背），沒有縮放 |
| rbc_normal.png、rbc_sickle.png | 改一個字差多少：紅血球變成鐮刀形；好還是壞 | U4：正常紅血球與鐮刀形紅血球，白底 | 裁掉截圖外框；所有接近白色的像素都當背景（含細胞之間的白縫），邊緣依綠色頻道估計透明度；清除 Gemini 留在細胞之間的一個紅色小點；左右分開，縮為 0.6 |

- 去背方法：從圖邊緣連通、與背景色差在容差內的區域是透明的；緊鄰背景的 3～4.5 px 依顏色距離做半透明，並把背景色從顏色中扣除，在黑板底色上不會出現灰邊或白邊。U1 不清除內部的灰色區塊，因為水牛背上的灰色反光和背景很接近。
- 圖的科學性：白化麻雀的眼睛畫成粉紅偏紅（白化的鳥常見）；白化小水牛的眼睛顏色很淡。白孔雀的眼睛 Gemini 畫成深褐色，教材只說「眼睛還有顏色」；真實的白孔雀眼睛常是藍灰色。
- 本站以程式繪製的示意：放大的毛與皮膚（黑色素顆粒、製造黑色素的細胞）、黑色素基因字母（示意，不是真實序列）、血紅素基因字母（HBB 第 3～9 個密碼子的真實序列 CTG ACT CCT GAG GAG AAG TCT；第 6 個密碼子 GAG → GTG 就是鐮形血球的突變）、紅血球變形與血紅素黏成長條、染色體圖譜（長度依人類染色體的真實大小等比例縮小，條紋為示意）、第 21 號染色體沒有分開、突變的原因與細胞、配子、遺傳疾病的小圖示。
- 科學內容核對：MedlinePlus Genetics：白化症 <https://medlineplus.gov/genetics/condition/oculocutaneous-albinism/>（體染色體隱性）、鐮形血球疾病 <https://medlineplus.gov/genetics/condition/sickle-cell-disease/>（體染色體隱性）、唐氏症 <https://medlineplus.gov/genetics/condition/down-syndrome/>（大多是形成卵時染色體沒有分開，大多不是遺傳來的，媽媽年齡越大機率越高）、第 21 號染色體 <https://medlineplus.gov/genetics/chromosome/21/>（約 200～300 個會製造蛋白質的基因）。
