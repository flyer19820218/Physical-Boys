# 化石單元插圖紀錄（2026-10-21）

`biology_fossils_evolution.html` 用的圖，都是老師用 Google Gemini 生成的 **AI 教學插圖（非實拍）**。咒語在 `assets/biology/biodiversity_ai_prompts_1021.md` 的「第一課」（FO0～FO7）。

處理方式見 `cut_fossils_1021.py`（參數與每張裁切的位置見 `cut_log.json`）：

- 白底圖：從圖邊緣連通、與底色相近的區域變透明；肋骨、腳趾之間夠大的空隙也變透明；緊鄰透明區的 3 px 依顏色距離做半透明並扣掉底色，放在黑板底色上不會有白邊。
- 同一張圖裡切出的幾個東西，用**同一個縮放比例**，相對大小不變。
- 螢幕截圖（FO4、FO6、FO7）先各裁掉 8 px 的外框。
- 原始圖留在 `local-backups/20261021/fossils_ai_originals/`。

| 檔案 | 用在 | 咒語編號 | 處理 | 科學檢查 |
|---|---|---|---|---|
| `assets/covers/biology_fossils_evolution_1021_v1.jpg` | 封面 | FO0 | 等比例縮成 1672 px 寬，不裁切，不去背 | 畫面無字 |
| `fossil_trilobite_slab.png` | 化石的種類、化石怎麼形成 | FO1 | 去背、切開、縮放 0.38 | 三葉蟲浮雕在岩板上，分頭、胸、尾三段 |
| `fossil_footprints_slab.png` | 化石的種類 | FO1 | 同上 | 四個三趾腳印，由下往上排成一行 |
| `fossil_amber_insect.png` | 化石的種類 | FO1 | 同上 | 琥珀裡一隻小昆蟲，三對腳、一對翅 |
| `trilobite_walking.png` | 化石的種類（復原圖）、化石怎麼形成 | FO2 | 去背、縮放 0.38 | 復原圖畫了觸角與步足；這兩項只在保存特別好的標本上看過，顏色是推測，頁面都有註明 |
| `trilobite_enrolled.png` | 備用（目前頁面沒用到） | FO2 | 同上 | 蜷縮的姿勢 |
| `horse_1_hyracotherium.png` … `horse_5_equus.png` | 五種馬的骨架、不是一條直線 | FO3 | 去背、五隻同一縮放比例 0.5，相鄰的馬以連通區塊分開 | 五隻由小到大；照老師提供的課本內容，用「挑出來的一個系列」呈現，頁面不寫肩高數字（AI 插圖的比例只是大致） |
| `foot_1.png` … `foot_5.png` | 前腳骨 | FO4 | 去背（先裁 8 px 外框）、五組同一縮放比例 0.5 | 趾數 4、3、3、1、1，與課本內容一致；第一次生成有一個紅點，已請 Gemini 重生 |
| `coral_fossil_cliff.jpg` | 山壁上的珊瑚 | FO6 | 裁 8 px 外框、存 JPEG | 山壁岩層中的造礁珊瑚化石 |
| `coral_reef_today.jpg` | 山壁上的珊瑚、海怎麼變成山 | FO7 | 同上 | 今天的造礁珊瑚礁（淺、清澈、有陽光） |

沒有生成：FO5（牙齒，可選）。

## 不再使用的舊圖（沒有刪）

課本原圖 `biodiversity_originals_1010_v1/` 的 Im7_66（三葉蟲）、Im12_87（足跡）、Im10_85（遺體）、Im32_186、Im33_187（馬骨架）、Im31_182（珊瑚化石）原本用在這一課，現在已經換成上面的 AI 插圖，檔案和來源紀錄保留不刪。

## 科學內容核對

- 馬的演化：前腳趾數 4→3→3→1→1、體型變大，以及「演化是分支、不是直線」：<https://natmus.humboldt.edu/node/1047>（Humboldt State University Natural History Museum）。年代用「約」＋整數級的概數，未逐一核對文獻。
- 草原古馬、上新馬的體型與年代，來自一般教科書說法，沒有逐項回查原始文獻，所以頁面不寫肩高。
- 化石形成、遺體與遺跡、造礁珊瑚的環境條件：一般教科書內容。
