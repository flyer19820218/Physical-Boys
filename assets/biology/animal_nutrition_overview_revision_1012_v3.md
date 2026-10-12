# 概論頁：逐一認識器官（2026-10-12）

## 老師本次授權

「先看整條路」必須能放大各部位，讓學生認識器官。只補概論頁的器官辨識，不改逐站消化、生化反應、酵素形狀或下一個循環單元。

## 新增操作

- 點器官名稱，或全身圖的標示／定位點，平滑放大同一張既有精美解剖圖；放大後停格。
- 消化道：口腔、咽、食道、胃、小腸、大腸、直腸、肛門。
- 消化液來源：唾腺、肝臟、膽囊、胰臟；與食物通道分開呈現。
- 放大區旁保留全身小圖與定位圈，主圖用指示圈指出所選部位。每個器官顯示名稱及既有簡短功能說明。
- 上一個／下一個器官、回到全身位置、逐一放大播放、暫停／繼續；播放完停在最後一個器官。
- 保留完整路線播放、詳細教學入口、拖曳與雙指縮放；拖曳或捏合不會被當成器官點選。

## 素材與教材保護

- 原圖 `animal_digestive_atlas_ai_1012_v1.png` 原檔不修改、不生成新圖、不改白底或原圖比例。來源／作者／AI 生成紀錄沿用 `animal_nutrition_revision_1012_v1.md`；頁面保留「AI 示意、非實拍」標示。
- 新功能為同一張圖的數位取景，非各器官同比例圖。保留既有實拍切片與原授權，不以 AI 名義冒稱第三方素材。
- 原 `overview(c)`、`zoom(c,st,p)` 逐字比對 d51e0be 完全相同，因此其數值座標全部不變。
- 既有繪圖、atlas、澱粉／蛋白質／脂質模型、教學資料、逐站樣式及兩張圖檔與 d51e0be 比對不變。只新增概論 helper、控制入口及概論全螢幕樣式。
- 所有說明沿用既有器官說明；直腸暫存糞便沿用既有路線／詳細單元內容。

## 驗證

- 檢查工具：`animal_nutrition_overview_check_1012_v3.cjs`；原逐站套件一併回歸。
- 原生 Canvas／替代 DOM：24 次手動放大、4 組雙語巡覽、24 次圖標點選；24 次畫面像素變化；144 次圖片比例檢查、216 次文字省略像素可見性檢查通過。
- 原逐站回歸：404 次長鏈單元守恆、234 張模型原生繪製、528 項文字邊界、120 項文字可見性、372 項控制操作通過；單一 RAF、暫停與完播、雙語、縮放／平移通過。
- 本機實際瀏覽器：12 個器官 × 2 語言的放大前後截圖雜湊均不同；播放途中暫停畫面不變，繼續後進入下一器官。
- 6 組 iPad CSS 尺寸 × 橫直向 × 2 語言（24 組）：畫布在螢幕內、不壓控制欄、長英文功能說明完整在可視區；可視按鍵中心點命中本身。控制欄可捲動，不刪按鍵。
- Noto Sans TC、JetBrains Mono 的瀏覽器字體載入檢查通過；1080px 主框架保留。
- 注意：上述是桌面瀏覽器尺寸模擬，不是實機 iPad／iPadOS Safari 驗證。觸控手勢另有替代 DOM 回歸，仍待老師實機核對。

## 預覽與備份

- 最新預覽：`biology_animal_nutrition_overview_organs_preview_1012_v8.html`（含六張課外小發現卡）。
- 修改前：`local-backups/20261012-overview-organs-pre.izV6cP/`。
- 完成備份：`local-backups/20261012-overview-organs-final.OIs4R4/`（本頁、程式、檢查、報告與截圖）。舊預覽不刪除。
- 2026-10-12 老師明確授權本版直接推上 main；往後已授權教材修改經檢查後直接發布，線上核對後再細修。循環圖不納入。

## 追加：消化道概論的課外小發現

- 老師授權在「先看整條路」底下增加不列考點的小知識；六張短卡可返回器官放大，繁中預設、中英切換。原本消化反應與動畫保持不變。
- 張口約 4–6 cm 是成人上下門牙間距，不是口腔體積：Cleveland Clinic，https://my.clevelandclinic.org/health/diseases/24086-trismus。
- 乳牙 20、完整恆牙 32（含 4 智齒；不含則 28）；食道約 25 cm；OpenStax 原值約 25.4 cm，課外卡明寫約值。https://openstax.org/books/anatomy-and-physiology-2e/pages/23-3-the-mouth-pharynx-and-esophagus。
- 胃容納約 1.5 L：IQWiG / InformedHealth.org，https://www.ncbi.nlm.nih.gov/books/NBK279304/?report=reader。不是固定上限，也不是建議食量；三瓶 500 mL 為容量類比，不鼓勵飲食挑戰。
- 小腸參考約 3–6 m：OpenStax 活體約 3.05 m、死後肌肉張力消失約兩倍，不能把不同量法寫成一個人人必須符合的數值。https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines。
- 大腸約 1.5 m：Cedars-Sinai 約 5 feet，換算後用約值；https://www.cedars-sinai.org/health-topics/the-digestive-process-the-large-intestine。小／大指管徑，不是長短；外圍位置由既有解剖圖與 OpenStax 核對。
- 全區明示成人、個體與量法差異，不新增題目、不要求背數字。只增加原創短文與來源連結，沒有下載或重製來源圖片。
- 回歸工具通過；實際瀏覽器六卡、資料連結、卡片返回器官放大、28px 數值、1080px 主框架與雙語無水平溢位已核對。實機 iPad 未驗證。
