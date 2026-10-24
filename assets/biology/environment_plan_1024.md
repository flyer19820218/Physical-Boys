# 人類與環境（三課）動畫重做設計規劃（2026-10-24 草案 v1，待老師看過）

三課檔案（檔名不變）：`biology_environmental_diversity.html`、`biology_environmental_threats.html`、`biology_environmental_conservation.html`。
做法和「生物圈與生態關係」四課一樣：**整課重做，每個觀察都是「連續播放＋步驟鈕」的自動動畫，圖是 AI 插圖＋程式畫的符號。** 動畫由 Opus 一次一個（`AGENTS.md` 13.5），其餘（文字、頁面、圖片處理、檢查、git）由 Sonnet。
規則沿用：不放課本頁碼、圖號、出版社名；標題不加章號；測驗只出選擇題（舊頁的「我的觀察紀錄」文字框拿掉）；畫面上每一種東西都要有名字；AI 圖標「AI 教學插圖，非實拍」；封面無字。

---

## 0. 這份文件怎麼用

| 誰 | 讀哪裡 |
|---|---|
| 老師 | §1 設計總覽、§2～§4 三課的分頁與動畫、§7 待老師決定 |
| Antigravity（生圖） | **§5 生圖清單與 prompts**（一條一張，整段貼上即可）；機器可讀版 `environment_ai_manifest_1024.jsonl` |
| Sonnet | §6 工作流程與主程式要做的事 |
| Opus（動畫） | 自己那一個動畫的段落＋§8「給動畫代理的共同規則」 |

---

## 1. 設計總覽

### 1.1 現況與問題

舊版三課共 13 個分頁，來源是 `environment_lessons_1010_v1.js`：每個分頁是「共用的 3D 小模型（`ecosphere_models`）＋課本原圖瀏覽＋一段長文字」。問題和生態第 4 課舊版相同：
1. 模型是符號堆疊（色塊、方塊、可旋轉的小地景），學生看不出「為什麼是這樣」，沒有因果步驟；
2. 要學生自己在文字、模型、原圖之間跳來跳去，認知負荷高；
3. 文字很長、很多「保留問題、不預填答案」的語句，學生沒有東西可以動手看；
4. 與已重做的單元（遺傳、地球上的生物、生物圈與生態）風格斷開。

**舊檔全部保留不刪**（`environment_lessons_1010_v1.js`、`environment_originals_1010_v1/`）。課本原圖（真實照片）**仍然保留**在每個分頁的「照片」檢視，當作觀察證據（`AGENTS.md` 第九定律之二：有真圖用真圖）；AI 插圖與動畫只負責「解釋機制、尺度與動態」。

### 1.2 整個單元的主線

> **多樣性是什麼 → 它怎麼被改變 → 怎麼知道保護有沒有用。**
> 三課各一個動詞：**看懂（比較）→ 追問（機制與證據）→ 驗證（追蹤成效）**。

| 課 | 主問題 | 一句話 | 全課貫穿的動作 |
|---|---|---|---|
| 第 1 課 多樣性 | 「很多」和「很不一樣」是同一件事嗎？ | 多樣性＝差異，不是數量 | **比**：個體內、物種間、生態系間 |
| 第 2 課 威脅 | 一個壓力，改變了生命的哪一個條件？ | 壓力→機制→證據 | **追**：從原因一路追到後果 |
| 第 3 課 保育 | 做了措施，怎麼知道有效？ | 措施≠成效，要追蹤 | **驗**：用同樣方法重複記錄 |

### 1.3 和前面單元、三課之間「不重複」

| 已教（不再重教，只用一句橋接） | 在哪一課 | 本單元的接法 |
|---|---|---|
| 森林層次、樣方、捉放法、族群收支與負荷量、演替 | 生態第 1 課 | 第 1 課「數量 vs 種數」只用結果；第 2 課 `harvest` 用「進／出」的水槽，只借用「族群收支」這個想法；第 3 課 `assess`、`monitor` 提到「捉放法、樣方是追蹤用的方法」 |
| 食物鏈／網、能量金字塔、分解者、碳氮循環 | 生態第 2 課 | 第 2 課 `magnify` 是**能量越往上越少、難排除物質濃度越往上越高**的對照，不重講金字塔；`chain` 的「分解者耗氧」只一句；第 1 課 `composition` 的食物網只看「有沒有替代路徑」，不講能量 |
| 互利／片利／寄生／競爭、生物防治、外來種要先評估 | 生態第 3 課 | 第 2 課 `stages` 講的是**外來種怎麼走到「入侵」（到達→建立→擴散→危害）**，不講「引入前評估」；福壽螺只出現在 `stages` 的說明一行；珊瑚白化 `coral` 回扣「共生藻是互利」 |
| 環境條件（雨量、溫度、光、流動、鹽度）、溶氧與水溫、山地隨海拔變冷、公平比較、證據 vs 推論、重複調查 | 生態第 4 課 | 第 1 課 `mosaic` 直接用「條件不同→住的不同」；第 2 課 `chain` 接 `oxygen`；第 2 課 `shift` 接 `mountain`（「山地隨海拔變冷」）；第 1 課 `green`、第 3 課 `track` 接 `fairtest`／`evidence`（公平比較、重複調查） |
| 溫室效應原理、氣候變遷 | 地科「溫室效應與氣候變遷」 | 第 2 課 `shift` 第 2 步只放一張小圖當前提，不再教機制，畫面標「地科學過」 |

**三課之間**
- 第 1 課不談威脅、不談保護措施（那是第 2、3 課）；價值只談「為什麼值得留」。
- 第 2 課不談解決方案，只留一句橋接（「下一課：怎麼知道有沒有用」）；放生／棄養只當「路徑」。
- 第 3 課不重講為什麼受威脅（石虎、海龜的威脅只用一個箭頭回扣第 2 課）。
- 同一張圖可以在不同課出現，但**用途必須不同**（例：石虎第 2 課是「活動範圍裝不下」，第 3 課是「廊道有沒有用」）。

### 1.4 顏色語意（本單元固定，同一個概念全單元同色，且一定連名字一起寫）

| 概念 | 顏色 | 使用處 |
|---|---|---|
| 遺傳多樣性 | 粉紅 `#f472b6` | 第 1 課 |
| 物種多樣性 | 青 `#55e9ff` | 第 1 課 |
| 生態系多樣性 | 綠 `#4ade80` | 第 1 課 |
| 壓力／威脅（箭頭、膠囊） | 橘 `#fb923c` | 第 2、3 課 |
| 營養鹽 | 粉紅小點 `#f472b6` | 第 2 課 |
| 難排除物質／濃度 | 黃色小點 `#fde047` | 第 2 課 |
| 溶氧 | 白色小泡泡（沿用生態第 4 課） | 第 2 課 |
| 族群／個體數量條 | 綠 `#4ade80` | 第 2、3 課 |
| 保護措施、連通 | 綠 `#4ade80` | 第 3 課 |
| 追蹤證據 | 青 `#55e9ff` | 第 3 課 |
| 待查證／不確定 | 白色虛線框 | 全單元 |

### 1.5 三課的標題與分頁一覽（標題為提案，老師可改；分頁 id 沿用舊版）

| 課（檔名） | 新標題（提案）／舊標題 | 分頁（id）：鉤子｜學科名 | 動畫數 |
|---|---|---|---|
| 1 `biology_environmental_diversity` | **生命的多樣，怎麼看、怎麼比？**／生物多樣性與重要性 | `genetic-variation` 同種也不一樣｜遺傳多樣性<br>`species-diversity` 多幾隻，還是多幾種？｜物種多樣性<br>`ecosystem-diversity` 不同住處，不同條件｜生態系多樣性<br>`biodiversity-value` 一片綠，代表什麼？｜生活資源與生物價值 | 10 |
| 2 `biology_environmental_threats` | **生命的家，是怎麼被改變的？**／人類活動與生存危機 | `habitat-fragmentation` 道路切開了什麼？｜棲地減少與破碎化<br>`resource-use-and-introduction` 取走與帶進的代價｜過度利用與外來入侵<br>`pollution-eutrophication` 養分多，魚一定好？｜汙染與水域優養化<br>`concentration-in-food-chain` 總量多，濃度就高？｜生物累積與生物放大<br>`climate-ecological-change` 變暖，生命跟得上嗎？｜溫室效應與生態變動 | 14 |
| 3 `biology_environmental_conservation` | **保育，怎麼知道有沒有效？**／保育與永續生活 | `conservation-evidence` 保護一隻，還要保護什麼？｜物種、棲地與合作<br>`habitat-connections` 修一條路，誰走得過？｜魚梯、廊道與監測<br>`everyday-actions` 小選擇，怎麼追蹤？｜生活行動與公民參與<br>`traditional-knowledge` 生活智慧怎麼讀？｜文化脈絡與永續思考<br>`synthesis`（選做）把三課的工具用在同一條溪｜整合 | 13 |

共 **37 個動畫**：P1 必做 29 個；P2 加分 2 個（`response`、`timing`）；P3 共 6 個（`boundary`、`worth`、`judge`、`citizen`、`materials`、`casefile`）是額度不夠時最先砍的，砍了仍是完整一課。三課「換標題」會牽動：首頁卡片（中英）、三頁的章節導覽連結、瀏覽器分頁標題；Sonnet 一次改完。

### 1.6 每個分頁的共同結構（沿用生態四課）

分頁 ＝ 曉臻 Hook（沿用舊版鉤子；每課第一個分頁改成接上一課的橋接句）＋ 2～3 個觀察（每個觀察＝一個動畫，**連續播放＋步驟鈕**；部分有選項鈕）＋ 兩題選擇題 ＋ 概念收束 ＋ 延伸閱讀（沿用舊版 `reading`，科學立場全部保留，見各課末）＋ 「照片」檢視（課本原圖，保留）。

---

## 2. 第 1 課「生命的多樣，怎麼看、怎麼比？」（`biology_environmental_diversity.html`）

**橋接（第一個分頁 Hook）**：「上一單元問的是：換個環境，誰能住下來？這一課換個問法：住下來的，有幾種？一樣嗎？值得留嗎？」
**主線**：多樣性不是「很多」，是「差異」——同一種之內、不同種之間、不同住處之間。
**這一課不講**：威脅、保護措施（第 2、3 課）；環境條件怎麼決定誰住得下來（生態第 4 課，只用結果）。
**共同做法**：粉（遺傳）／青（物種）／綠（生態系）三色固定，三個分頁的左上角都放一個小色塊「現在在看第幾個面向」（不用章號，用名字）。

### 動畫一覽

| 分頁 | 動畫（`window.EnvironmentDraw.<名>`） | 步 | 新圖 | 既有圖 | 優先 |
|---|---|---|---|---|---|
| genetic-variation | `frogs` 一種，很多樣子 | 4 | BD1a、BD1b | EC19 七星瓢蟲 | P1 |
| | `response` 環境一變，誰受影響 | 4 | （BD1 沿用） | — | P2 |
| species-diversity | `count` 數個體，還是數種類 | 4 | BD4 | EC4／EC5／EC15／EC19、EC2 草原 | P1 |
| | `composition` 數一樣，名單不一樣 | 4 | — | 同上 | P1 |
| ecosystem-diversity | `mosaic` 一個地區的許多住處 | 4 | BD5 | — | P1 |
| | `residents` 各住處，各有居民 | 4 | BD6、BD7 | HB2、HB7、HB8、EC16、EC5、EC4 | P1 |
| | `boundary` 邊界畫在哪裡（補充） | 3 | — | HB5、BD5 | P3 |
| biodiversity-value | `uses` 生物提供什麼 | 4 | BD2、BD8a、BD8b | — | P1 |
| | `green` 一片綠，看得出什麼 | 4 | BD9a、BD9b | — | P1 |
| | `worth` 值得留的理由 | 3 | — | 封面、BD0 | P3 |

**做的順序**（一次一個 Opus）：無新圖的先做 → `count` → `composition` → `worth`；圖到齊後 → `frogs` → `response` → `mosaic` → `residents` → `uses` → `green` → `boundary`。

### 分頁 1　同種也不一樣（遺傳多樣性）

Hook（舊）：三隻青蛙顏色不同，就一定是三種青蛙嗎？（橋接句加在最前）

**frogs（4 步）**　左 2/3 是舞台：六隻**異色瓢蟲**（BD1a 3 隻＋BD1b 3 隻，底色與斑點都不同）排成一列，名字「異色瓢蟲（示意）」。右 1/3 是步驟小卡。課本的斯文豪氏赤蛙照片保留在「照片」檢視，這裡用瓢蟲當動畫主角（斑紋變化明顯、容易放大看）。
1 比外表：六隻逐一亮出膠囊「底色」「斑點數」，只比較看得見的特徵（粉紅框＝遺傳多樣性的色）。
2 同種不一定長一樣、長得像不一定同種：六隻圈成一組「同一種」，旁邊放 EC19 七星瓢蟲（另一種），畫連線「長得像」但標「不同種」。
3 鏡頭推進其中一隻：體 → 細胞 → 染色體上的兩個位置，每個位置有兩種基因版本（粉紅與白色小方塊）；標「示意，不是真的基因序列」。
4 外表 ≠ 基因：兩隻外表一樣的，基因組合畫成不同；兩隻外表不同的，畫成基因相同但環境不同（溫度計小圖）；標「外表同時受遺傳與環境影響」。**不寫「一種顏色＝一種基因型」。**

**response（4 步）**　左右兩群各 12 個瓢蟲小圖示：左「較單一」（全部同一種底色）、右「較多樣」（三種底色）。底下一條生存條，每個小圖示下有小圓點（亮＝沒事，暗＝受影響）。
1 平常的年：兩群都亮。
2 環境變動 A（高溫乾旱，右上角太陽＋溫度計）：單一那群全暗；多樣那群只有一種底色暗。
3 環境變動 B（換成另一種變化，例如新的病，圖示用菌絲符號）：這次暗的是**另一種**底色——**沒有哪一種在所有環境都占優勢**。
4 補充（作物）：整片田都是同一個品種 vs 混種幾個品種；同樣遇到變動，單一品種那邊整排暗。畫面持續掛「示意，不是預測任何物種的存活」。
科學：不講演化、不講適應，只講「保留不同的反應」；不給數字。

### 分頁 2　多幾隻，還是多幾種？（物種多樣性）

Hook（舊）：同一種魚增加一百隻，和多出另一種魚，是同一種改變嗎？

**count（4 步）**　兩個同樣大的樣區 A、B（EC2 草原當背景，各框一個方框），居民用既有去背圖：蚱蜢（EC4）、毛蟲（EC4）、瓢蟲（EC19）、田螺（EC15）、澤蛙（EC5）、螳螂（EC5），**每一種用一種外框顏色分辨，不靠顏色以外的資訊判斷**，並寫名字。
1 數個體：A 有 12 隻（3 種）、B 有 8 隻（5 種）。兩條長條：個體數 A 長。
2 數種類：同一批動物，按種類分堆。種類長條：B 長。標「個體多不等於種類多」。
3 兩種不同的改變：左半「A 的某一種增加一百隻」（小圖示灌進來，個體條猛升，種類條不動）；右半「B 多了一種新的」（種類條 +1）。
4 真實場景：BD4 珊瑚礁照片，先框出「看起來不同的魚（類型）」，再有 3 個「無法辨認」打問號，再有一個「沒看到」的虛線框。標「看不到，不等於不存在」「未辨認的不能每隻算一種」。
科學：不給「多樣性指數」；比較前要先寫地點、面積、時間、方法（用生態第 4 課的公平比較三要素當小膠囊）。

**composition（4 步）**　C、D 兩個地方各 5 種（用同一批既有圖，名字清楚）。
1 兩份名單並排。
2 連線找相同的：只有 2 種相同，另外各 3 種是自己獨有。
3 合起來：8 種（比單看任何一邊都多）；亮起「如果只保護 C：D 獨有的 3 種就不在名單裡」。標「種數一樣，組成可以不同」。
4 補充：把 C 的 5 種畫成小食物網。移走其中一種：若牠的天敵還有別的食物來源（另一條線），那條線會亮起來「緩衝」；若沒有，線斷。標「種類多不保證永遠穩定，要看有沒有替代的路」。**不講能量、不講金字塔（生態第 2 課）。**

### 分頁 3　不同住處，不同條件（生態系多樣性）

Hook（舊）：把森林的生物都搬到沙漠，就能讓兩地一樣多樣嗎？

**mosaic（4 步）**　BD5 一個地區的斜俯視全景（山、森林、草地、農田、溪流、濕地、海岸依序排列）。
1 看見一個地區：整張圖緩慢推鏡。
2 切出幾塊：程式用柔邊色塊（不是硬線）疊出六種生態系，每塊一個名字（森林、草地、農田、溪流、濕地、海岸）；綠色框。
3 每塊的條件不一樣：每塊跳出 2 個條件圖示（水、光、溫度、鹽度…各用生態第 4 課同色），**只一句話，不重教條件怎麼決定誰住得下來**。
4 一個地區有幾種不同的生態系，就是這個地區的生態系多樣性。標「邊界是漸變的」「示意」。

**residents（4 步）**　四張卡依序展開，每張一個住處＋三到四位居民：
1 森林：BD6（臺灣藍鵲、山羌、藍腹鷴、臺灣獼猴）。
2 溪流：BD7（苦花、蜉蝣稚蟲、河烏、川蜷）＋HB4。
3 河口濕地：HB6 背景，居民 HB7 彈塗魚、HB8 招潮蟹、EC16 黑面琵鷺。
4 搬家測試（回應 Hook）：把森林居民拖到沙漠（HB2）。居民變淡、旁邊標「這裡沒有它們需要的環境」；森林那邊的位置變空。標「多樣性靠不同的環境，不是把生物搬來搬去」。示意，不是真實移入實驗。

**boundary（3 步，補充，P3）**　HB5 池塘周邊。
1 研究「池塘裡的生物」：框只框水面。
2 研究「整條溪流域」：框擴大到岸邊與上游。
3 同一張圖含陸地與水域，邊界依「研究的問題」決定；旁邊補一行「沙漠也有生物，只是不容易一眼看見」。

### 分頁 4　一片綠，代表什麼？（生活資源與生物價值）

Hook（舊）：看起來都很綠，我們還需要觀察什麼，才能比較兩片土地？

**uses（4 步）**　中央一個圓盤分四塊，每步亮一塊並出現去背圖：
1 食物：BD2 四種稻米（白米、糙米、黑米、紅米）。
2 衣料與材料：BD8a 棉花、蠶繭、木材；BD8b 橡膠樹採膠。
3 研究與藥物資源：BD8b 紅豆杉枝（紅色假種皮）；標「研究價值，不是自己可以食用的藥」「不採摘、不試吃」。
4 遺傳資源：回扣分頁 1。稻米四種的性狀不同（小膠囊：耐旱、耐病…），標「保留不同品種與野外親緣種，育種才有選擇」。**不寫「不能無限採集」以外的立場。**

**green（4 步）**　BD9a（多層次的熱帶森林）與 BD9b（整齊的棕櫚園）左右對照，中間一條可拖曳的分割線（自動播放時由程式來回移動）。
1 看起來都很綠：兩邊同時亮。
2 先觀察：樹冠高度、形狀、排列——程式在兩圖上各框出幾個「看起來不同的樹冠」，數量當作「看到的」；標「看到的」。
3 我們不能直接說的：三張「待查」虛線卡片（物種數、動物種類、土壤）；一張「還沒證明」。
4 該補什麼資料：同樣的樣區大小、同樣的調查時間與方法、重複幾次（回扣生態第 4 課 `fairtest`）。**不預填答案。** 標「這兩張是教學示意，不是同一個地點」。

**worth（3 步，P3）**　三張卡片，無新圖：1 對人有用的（食物、材料、研究）；2 文化與美感；3 本身存在的價值。結語：「有用途不代表可以無限採集；保育也不只看能不能換成金錢」。

### 選擇題方向（每分頁 2 題，只出選擇題）
遺傳：長得不同不一定不同種／長得像也不一定同種；外表受遺傳和環境共同影響。物種：個體多≠種類多；比較前要先說清楚地點、面積、時間、方法。生態系：不同環境各有不同居民，把生物搬家不會讓兩地一樣多樣；生態系邊界依研究問題決定。價值：綠色覆蓋≠多樣性；有用途≠可無限採集。

### 科學立場（沿用舊頁，一字不放寬）
三面向在本課只做概述，不延伸到高中遺傳計算；不從體色讀基因型；食物網「緩衝」不等於保證穩定；沙漠不是沒有生物；單張照片不是物種名錄；熱帶雨林開發成棕櫚園的影響「保留問題、先列證據與待查」；醫藥研究價值不等於植物可自行食用。延伸閱讀沿用舊版 `reading`。

---

## 3. 第 2 課「生命的家，是怎麼被改變的？」（`biology_environmental_threats.html`）

**橋接（第一個分頁 Hook）**：「上一課看到：生命的差異很珍貴。這一課追問：這些差異，是怎麼一點一點被改掉的？」
**主線**：看到一個壓力，就追問三件事——**它改變了哪個條件？中間經過哪幾步？證據在哪裡？**（壓力＝橘）
**這一課不講**：解決方案（第 3 課，只在最後一個畫面留一句橋接）；溫室效應原理（地科）；生物防治、引入前評估（生態第 3 課）。

### 動畫一覽

| 分頁 | 動畫 | 步 | 新圖 | 既有圖 | 優先 |
|---|---|---|---|---|---|
| habitat-fragmentation | `edge` 面積、品質與邊緣 | 4 | TH1a、TH1b、TH3 | — | P1 |
| | `fragment` 石虎的家裝不下 | 5 | TH2 | TH1a／TH1b | P1 |
| resource-use-and-introduction | `harvest` 取走的比補充的多 | 4 | TH4 | — | P1 |
| | `pathway` 外來種怎麼到的 | 4 | TH5 | — | P1 |
| | `stages` 從到達到入侵 | 5 | TH5、TH6 | EC15（福壽螺） | P1 |
| pollution-eutrophication | `sources` 汙染從哪裡來 | 4 | TH10a、TH10b | — | P1 |
| | `chain` 養分多了，氧怎麼不見 | 6 | TH8 | HB5 | P1 |
| | `judge` 看顏色夠不夠（補充） | 3 | — | HB5、TH8 | P3 |
| concentration-in-food-chain | `bioacc` 一個個體的累積 | 4 | TH11 | — | P1 |
| | `magnify` 一層一層吃上去 | 4 | TH11、TH4 | — | P1 |
| | `conc` 總量不等於濃度 | 3 | — | — | P1 |
| climate-ecological-change | `shift` 適合的條件往上搬 | 5 | TH12 | HB14～HB18、HB3 | P1 |
| | `timing` 開花和傳粉者對不上 | 4 | TH13 | BD3（蜜蜂） | P2 |
| | `coral` 珊瑚為什麼變白 | 4 | TH14a、TH14b | — | P1 |

**做的順序**（一次一個 Opus）：無新圖的先做 → `conc` → `judge`；圖到齊後 → `edge` → `fragment` → `harvest` → `pathway` → `stages` → `sources` → `chain` → `bioacc` → `magnify` → `shift` → `coral` → `timing`。

### 分頁 1　道路切開了什麼？（棲地減少與破碎化）

Hook（舊）：道路兩邊還有樹，動物的家就沒有受影響嗎？

**edge（4 步）**　左 2/3 是上空看下去的森林（TH1a 樹冠質感，全幅），右 1/3 步驟卡；程式用柔邊多邊形把一部分換成 TH1b 農地質感。
1 完整的一片森林，標「棲地」。
2 面積減少：一側被農地吃掉，面積條下降（只標比例條，不給實際數字）。
3 品質下降：形狀被削出彎彎曲曲的外緣——程式畫「邊緣帶」與「內部」兩種顏色；縮小的是內部，**內部比整體面積縮得更快**（兩條長條對比，用同一形狀逐步變瘦的示意，標「示意」）。
4 切到剖面 TH3：左邊森林內部（陰暗潮濕）、右邊森林邊緣（光強、風大、較乾），條件膠囊用生態第 4 課同色（光黃、水藍），標「邊緣的條件和內部不一樣，適合的生物也不一樣」。
科學：不寫具體「邊緣效應距離幾公尺」，不寫物種名單，只畫概念。

**fragment（5 步）**　同樣的俯視森林，石虎（TH2）出現。
1 完整的森林：石虎的活動範圍用一個虛線圓表示（名字「活動範圍」），圓完全落在森林裡。
2 一條路切過去：森林分成兩塊；虛線圓跨過路。
3 農地與房舍擴張：再分成幾塊小的；**沒有任何一塊能裝下整個虛線圓**，圓變橘色。
4 動物想去對面：石虎小圖示走到路邊、停、退回；橘色「危險」脈衝，標「移動、覓食、繁殖、躲避危險都受影響」。**不畫車禍、不畫受傷。**
5 小塊各自留著少數個體，彼此不容易交流；標「只保住一隻不夠，要保住牠需要的空間」。最後一行橋接：「怎麼讓兩塊連起來？下一課」。
課本的石虎照片保留在「照片」檢視。

### 分頁 2　取走與帶進的代價（過度利用與外來入侵）

Hook（舊）：資源想拿就拿、寵物想放就放，影響會只停在眼前嗎？

**harvest（4 步）**　一個水槽：水位＝族群大小；上方水龍頭＝補充（出生、成長加入）；下方排水孔＝自然損失；右側一個大勺子＝人類取走。想法借用生態第 1 課的族群收支，**不重講**。
1 沒有取走：進≈出，水位穩定。
2 取走得少：進 ≥ 出＋取走，水位仍穩。標「示意，不是安全比例」。
3 取走得多又長期：水位一路下降。標「取走超過補充」。
4 取走哪些個體：兩種勺子——取走成魚（會繁殖，TH4 成魚）vs 取走幼魚（TH4 幼魚）。取走成魚後，水龍頭變小。標「取走的不只是現在的數量，還有未來的補充」。旁邊補充一行：非目標生物與棲地也會受影響。
科學：課本黑鮪、紅豆杉只當「例子」放在步驟卡；不給任何魚種的數量、禁漁日期、現況等級（`AGENTS` 9：不當最新公告）。

**pathway（4 步）**　左「原本的地方」、右「新的地方」，中間四條路徑逐一亮起，每條路徑搭配去背圖：
1 搭便車（運輸、貨物、盆栽土）：斑腿樹蛙（TH5）。
2 寵物與觀賞（買來又不想養）：巴西龜、綠鬣蜥（TH5）。
3 養殖或食用用途的逃逸或釋放：美國螯蝦（TH5）。
4 放生不等於救牠：生物被放到不適合的環境，也可能對本地生物造成影響；標「不棄養、不放生」。
科學：只講路徑，不評分類單位；「外來」只是來源，不等於有害（下一個動畫才說）。

**stages（5 步）**　一個漏斗，從上到下四層：到達 → 建立（能活下來、繁殖）→ 擴散 → 造成危害。
1 外來種到達：多個外來小圖示（TH5 四種）掉進來。
2 不是每個都留得下來：多數小圖示變淡離開；標「外來不等於入侵」。
3 建立族群：留下來的開始增加（小圖示分裂變多）。
4 擴散：從一個點往外擴；福壽螺（EC15，生態第 3 課出現過）只當例子放一個小圖示與名字，不重講。
5 危害的三條路：競爭（TH6 藤蔓蓋住樹冠，爭光）、取食（螯蝦吃水生生物，用箭頭＋橘色）、改變棲地（程式畫水岸被挖鬆）；每條路一行說明。結尾：「要說入侵，看的是建立、擴散、有害的證據，不是來源，也不是長相」。
科學：不由外觀判斷；「不自行捕殺、食用或野放，交給專業管理」。

### 分頁 3　養分多，魚一定好？（汙染與水域優養化）

Hook（舊）：水裡藻類長得很旺，為什麼魚反而可能缺氧？

**sources（4 步）**　地景小剖面，三排去背物件（TH10a 工廠、車流、噴灑肥料的田；TH10b 住家排水口、魚塭、畜牧場）。
1 空氣：工廠、車輛。
2 水：住家排水口、魚塭、農田的水。
3 土壤：農田、畜牧場。
4 **不同汙染，不同途徑**：四行小表——營養鹽進水體 → 優養化；工廠與車輛排放 → 空氣；酸雨；臭氧層受損；細懸浮微粒。各用一行說明各自「走哪一條」；標「這些不是同一個原因」。
科學：照片的顏色不是汙染物檢測；不給飲水或健康建議。

**chain（6 步）**　上半是池塘的「水面照片」（HB5 → TH8 淡入淡出），下半是側面剖面（程式畫的水柱、藻類、水草、泥底、魚）。
1 清澈的池塘：水草在水下，白色小氣泡＝溶氧（回扣生態第 4 課 `oxygen`）。
2 營養鹽進來：粉紅小點從岸邊（田、排水）流入。
3 藻類大量增生：水面變綠（TH8 淡入），藻類符號變多。
4 遮光：黃色光柱被水面的藻類擋住，下面的水草變暗、變少。
5 死亡後下沉、被分解：沉到底部的有機物被分解者分解，**氣泡變少**（只一句「分解者要用氧」）。
6 缺氧：魚游到水面附近，標「溶氧不夠」。標「要判斷水質，看的是時間、深度、溶氧、營養鹽等資料」。
科學：白天藻類光合作用會放氧，夜間與分解耗氧；不把優養化和生物放大混為一談（下一個分頁）。

**judge（3 步，補充，P3）**　三杯水的圖示：清澈（HB5）、綠色（TH8）、顏色異常（課本照片保留在「照片」檢視）。
1 只看顏色：三杯排開，問「哪一杯最不好？」——先不作答。
2 要補的資料：四張卡片（溶氧、營養鹽、時間、深度）依序出現。
3 安全：不採集、不接觸不明水體；標「顏色只是線索，不是檢測」。

### 分頁 4　總量多，濃度就高？（生物累積與生物放大）

Hook（舊）：大魚體內的物質總量較多，就能證明每公斤含量也較高嗎？

**bioacc（4 步）**　一條小魚（TH11 沙丁魚）的身體是一個水桶，黃色小點＝某種物質。進水口＝從水和食物進來，排水口＝排出或分解。
1 容易排除的物質：進≈出，水位不再上升。
2 難排除的物質：進＞出，水位隨時間（下方日數軸）一路升高。
3 同樣的魚，環境裡的物質更多：升得更快。
4 小結：**生物累積＝同一個個體，隨時間的累積**；下一個動畫看的是不同營養階層。
科學：不給任何真實物質的名字或數值；水位單位是「自訂教學濃度（單位/kg）」。

**magnify（4 步）**　五個營養階層由左到右（TH11 矽藻→橈足類→沙丁魚→鯖魚，加 TH4 鮪魚），每一層下面一個「同樣大小的組織框」（等質量），框內黃色小點數＝濃度。右上角小圖：能量往上變少（長條遞減，回扣生態第 2 課，標「能量」）。
1 水中很稀：框內只有幾點。
2 一層一層吃上去：每一層吃很多下面那一層，黃點被「吃進」。
3 難排除：點越往上越密（示意約 2 倍、4 倍，標「不是固定倍率」），右上角能量長條同時遞減，**一個變少、一個變多**。標「不同的量」。
4 容易排除的對照：點不變密（同時標「不同物質的排除速率不同」）。
科學：不寫真實物質、不寫 ppm；原圖水體顏色不能測出體內毒物；不提供飲食或診療建議。

**conc（3 步）**　兩隻動物：大魚（質量 10 單位，總量 20 點）vs 小魚（質量 1 單位，總量 5 點）。
1 算總量：大魚 20 ＞ 小魚 5。
2 除以質量：大魚 20÷10＝每單位 2；小魚 5÷1＝每單位 5。小魚濃度較高。
3 同質量才能比：回到食物鏈，「看濃度要先確認比較的質量」。標「教學數字，不是真實測量」。

### 分頁 5　變暖，生命跟得上嗎？（溫室效應與生態變動）

Hook（舊）：適合生活的地方往山上移，所有生物都搬得過去嗎？

**shift（5 步，選項 `s.warm`＝較小／中／較大的**假設**升溫）**　HB14 山地林相全景＋右側溫度計；各帶用柔邊半透明色帶＋近景小卡（HB15～HB18）。
1 回顧：越高越冷，林相一帶一帶變（「上一單元看過」）。
2 前提（地科學過）：一個小圖示——地表放出紅外線→溫室氣體吸收並再放射。標「地科已學，這裡當作前提」。
3 假設升溫：各帶往上移，標「適合的條件往上移」；選項切換移動量。標「假設，不是預測」。
4 山頂的難題：最上面那一帶沒有更高的地方（TH12 的高山植物與冷水魚當代表）；擠壓。
5 能不能搬：中間有農地與道路擋住（回扣第 2 課 `fragment`）；兩種箭頭——自己移動（自然擴散）vs 人搬運（外來引入），**是不同過程**，用不同顏色。
科學：不給溫度或高度數字；不叫所有遷移的物種「入侵種」；一張照片不能確認變遷原因。

**timing（4 步，P2）**　一個圓形月曆（不寫月份數字，只寫「早」「中」「晚」）；兩條弧：花開的時段（TH13 山櫻花）與傳粉者活動的時段（TH13 綠繡眼、BD3 蜜蜂）。
1 平常的年：兩弧重疊。
2 溫度改變：花開的弧往前移。
3 傳粉者沒有同步：重疊縮小。標「不是所有生物都用同一種方式感應季節」。
4 重疊少，花粉傳遞的機會少；標「示意，不預測哪個物種」。

**coral（4 步）**　TH14a 健康珊瑚 → TH14b 白化（同一個群體淡入淡出）。
1 珊瑚是動物：放大看到珊瑚蟲與裡面的共生藻（綠色小點），箭頭「共生藻供應養分」（回扣生態第 3 課互利）。
2 壓力（水溫過高等）：共生藻離開或色素減少。
3 白化：畫面淡入 TH14b。
4 白化 ≠ 死亡：壓力解除，共生藻可能回來（淡入彩色）；壓力持續，才可能死亡。標「要看壓力與恢復條件」。**不寫實際年度海溫或統計。**

### 選擇題方向（每分頁 2 題）
棲地：面積縮小時內部縮得更快；邊緣條件不同；活動範圍大於棲地塊時動物受影響。外來／利用：取走成魚傷害未來補充；外來≠入侵；入侵看建立、擴散、危害證據。優養化：營養鹽→藻→遮光→分解耗氧；水色不是檢測；不同汙染不同途徑。放大：累積是同一個個體隨時間；放大是跨階層；總量大≠濃度高。氣候：適合條件往上移；山頂沒有地方；白化≠死亡；自己移動 vs 人搬運不同。

### 科學立場（沿用舊頁，一字不放寬）
廊道要有合適入口與相連棲地，不能彌補全部棲地損失（延到第 3 課）；現實動物仍可能冒險跨路；採捕期間與漁法留給學生討論；書上禁漁日期、物種狀況、歷史數量不當作最新公告；外來種管理由專業評估，不自行捕殺、食用或野放；酸雨、臭氧層受損、細懸浮微粒各有不同途徑；不採集、培養或製造汙染水樣；不提供飲水判斷或醫療建議；水俁症等歷史案例的探究留待學生推論，不預填；氣體情境與假設升溫只比較概念，不從符號算攝氏溫度；一張照片不能確認變遷原因。延伸閱讀沿用舊版 `reading`。

---

## 4. 第 3 課「保育，怎麼知道有沒有效？」（`biology_environmental_conservation.html`）

**橋接（第一個分頁 Hook）**：「前一課追到了壓力。這一課問：我們做了措施，怎麼知道真的有用？」
**主線**：**措施不等於成效。** 每個措施都問三件事——**它補了哪一塊？有人用嗎（找到、進入、通過）？用同樣的方法追蹤了嗎？**（措施＝綠，證據＝青）
**這一課不講**：為什麼受威脅（只用一個橘色箭頭回扣第 2 課）；調查方法細節（只回扣生態第 1、4 課的樣方、捉放法、公平比較、重複調查）。
**文化內容的原則（`AGENTS.md` 9）**：**不用 AI 生成任何原住民族人物、祭典、船隻或器物**（容易失真、也不尊重）。分頁 4 的人物與器物一律只用課本原照（保留在「照片」檢視）；AI 只畫自然物（飛魚、天然素材）。

### 動畫一覽

| 分頁 | 動畫 | 步 | 新圖 | 既有圖 | 優先 |
|---|---|---|---|---|---|
| conservation-evidence | `turtle` 一隻海龜用幾個家 | 5 | CV1a、CV1b、CV2、CV3 | — | P1 |
| | `toolbox` 四種工具一起用 | 4 | CV1a | CV2 | P1 |
| | `assess` 評估和法律不一樣 | 3 | — | — | P1 |
| habitat-connections | `fishway` 魚梯怎麼走 | 5 | CV5a、CV5b、CV5c、CV5d | BD7（苦花）、EC14a（米蝦） | P1 |
| | `corridor` 陸橋與涵洞 | 4 | CV6a、CV6b | TH1a／TH1b、TH2（石虎） | P1 |
| | `monitor` 看到一隻，夠了嗎 | 4 | CV7a、CV7b | — | P1 |
| everyday-actions | `track` 先記原本，再追蹤 | 4 | — | — | P1 |
| | `tradeoff` 哪一個比較好，要看條件 | 4 | CV8a、CV8b | — | P1 |
| | `citizen` 一筆好紀錄要有什麼（補充） | 3 | CV9 | — | P3 |
| traditional-knowledge | `season` 季節裡的規範 | 4 | CV10 | — | P1 |
| | `clues` 一張照片能說什麼 | 3 | — | 課本原照（祭典、器皿、編織） | P1 |
| | `materials` 天然素材的條件（補充） | 3 | CV11 | EC7（落葉分解） | P3 |
| synthesis（選做） | `casefile` 把三課的工具用在同一條溪 | 4 | — | BD7、HB4、CV5b | P3 |

**做的順序**（一次一個 Opus）：無新圖的先做 → `assess` → `track` → `clues` → `casefile`；圖到齊後 → `turtle` → `toolbox` → `fishway` → `corridor` → `monitor` → `tradeoff` → `season` → `citizen` → `materials`。

### 分頁 1　保護一隻，還要保護什麼？（物種、棲地與合作）

Hook（舊）：海龜不被捕捉，但產卵的沙灘消失了，保育就完成了嗎？

**turtle（5 步）**　一條由左到右的路徑，三個「家」依序出現，一隻綠蠵龜（CV1a 成體）沿著走。
1 產卵的沙灘（CV2，黎明）：沙灘剖面小圖 CV1b 卵窩（沙下的卵）；標「產卵沙灘」。
2 孵化後離開沙灘：CV1a 小海龜走向海；標「孵化」。
3 外海成長：藍色漸層畫面，CV1b 亞成體；標「外海」。
4 近岸海草床覓食（CV3）：標「海草床」。
5 成熟後回到海岸產卵（常回到出生地附近，標「多數研究如此」）：一個橘色箭頭指向沙灘，標「沙灘消失，這個循環就缺一塊」。
結論一行：「只保護動物，不保護牠要用的家，保育沒有完成」。
科學：不寫海龜目前的保育等級、數量；時程不寫年數。課本綠蠵龜照片保留在「照片」檢視。

**toolbox（4 步）**　海龜在中央，四種工具從四個方向逐一飛進來：
1 研究：一隻帶標記的海龜（CV1a 衛星標籤版）＋路徑線；標「追蹤、調查」。
2 保護區：沙灘（CV2）上畫一個柔邊的保護範圍；標「保護區」。
3 社區參與：程式畫的簡單人形剪影（無五官）沿海岸巡視；標「社區」。
4 跨地區合作：海龜路徑跨過兩段不同的海岸，兩端各一個旗標（抽象圖形）；標「跨地區合作」。最後四個工具一起發亮：「單用一個，缺口還在」。
科學：這是書載案例，**不是現行法律清單**；不沿用書中海龜等級、保護區總數、會員數與罰則。

**assess（3 步）**　左右兩張卡：左「瀕危評估」、右「法律與管理」。
1 評估：用資料判斷**滅絕風險**——族群趨勢、分布範圍、威脅（三個小圖示）。
2 法律與管理：規範**可以做什麼、不可以做什麼**，有適用的範圍（一個柔邊範圍圈）。
3 兩者不能畫等號：中間畫一個「≠」；下方問題「國際單位怎麼知道數量？」→ 答案是「要有資料：樣方、捉放法、重複調查」（回扣生態第 1、4 課，各一個小圖示）。
科學：「評估」與「法律」不是同一回事；國際組織名稱只作為例子，不寫等級現況。

### 分頁 2　修一條路，誰走得過？（魚梯、廊道與監測）

Hook（舊）：魚梯看起來像樓梯，魚就一定知道入口、也一定游得上去嗎？

**fishway（5 步）**　CV5a（河上有一道落差的橫向堰）→ CV5b（旁邊加了分段落差的魚梯，同一個畫面）→ CV5c（魚梯剖面）。
1 河被攔住：CV5a，標「落差」；游向上游的魚（程式畫剪影）被擋住。
2 魚梯：CV5b 淡入，標「魚梯」；一格一格的水池。
3 入口在哪：水流從魚梯口出來的區域亮起，標「入口」；魚要先找到入口（流向會吸引牠）。
4 每格的落差與流速：CV5c 剖面。四種水生生物（CV5d 鰻魚、吻鰕虎，加既有苦花 BD7、米蝦 EC14a）各有一條「能通過的落差」示意長條，**長度只是示意，不代表任何真實數據**。
5 「找到入口」≠「順利通過」≠「到上游產卵並存活」：三格依序點亮，後兩格先是虛線（待查證）。
科學：不寫流速、坡度、工程尺寸；「除了到上游產卵的魚，其他魚也需要魚梯嗎？」保留成題目（選擇題）；實際成效要看使用、通過、存活與繁殖等不同證據。

**corridor（4 步）**　延續第 2 課 `fragment` 的俯視森林（TH1a／TH1b）：
1 被路切開的兩塊森林，石虎（TH2）在路邊。
2 陸橋：CV6a（植被覆蓋的陸橋），切入近景；標「陸橋」。
3 涵洞：CV6b（路下的通道剖面），小動物走過；標「涵洞」；標「不同動物需要不同設計」。
4 通道要連到合適的棲地，入口要有植被；標「連到哪裡很重要」「不能彌補全部棲地損失」。
科學：不寫施工數字；「設施完成≠成功」留到 `monitor`。

**monitor（4 步）**　CV7a 自動相機＋CV7b 夜間紅外線風格畫面（灰階）。
1 一張照片：只能說「這裡出現過一隻」；標「一筆紀錄」。
2 重複記錄：用同一種方法連續多次（回扣生態第 4 課重複調查），紀錄一格一格累積。
3 區分「靠近」「進入」「通過」：三個計數器同時走；通過的最少。
4 想說族群恢復，還需要更多證據：存活、繁殖、族群數量（回扣捉放法、樣方）；標「不能只拍到一隻就宣稱恢復」。

### 分頁 3　小選擇，怎麼追蹤？（生活行動與公民參與）

Hook（舊）：今天少用一個杯子，我們要怎麼知道行動真的持續了？

**track（4 步，選項 `s.action`＝循環杯／公共自行車）**　一條橫軸（天）與一條縱軸（每天的次數）；資料點全是**教學示意**。
1 先記原本的情況：一週的基線，點是灰色。
2 開始行動：從這一天開始，點變成綠色。
3 用同樣的方法繼續記：同一種記法（同一個時間、同一種單位）。
4 看變化，也看有沒有持續：標「口號和照片不是成效數據」。
科學：不給任何真實減量數字。

**tradeoff（4 步）**　左右兩組對照：一次性杯 vs 循環杯（CV8a）、汽車/公車 vs 自行車（CV8b）。
1 一次性杯：用一次就丟。
2 循環杯：要用很多次、要清洗、要有地方歸還才划得來；標「使用次數」「清洗」「歸還」。
3 交通：距離短、路線安全，自行車比較可行；距離長或不安全，不一定。標「距離」「路線」「安全」。
4 判斷要看材料、使用次數、運輸與處理（整體環境影響），不能保證任何單一商品都最好。**不寫排碳公里數。**

**citizen（3 步，補充，P3）**　CV9 野外筆記本、望遠鏡、相機、放大鏡。
1 一筆好紀錄：地點、日期、時間、照片、特徵（五個格子逐一填滿，格子是符號，不寫字以外的內容）。
2 不確定時先記特徵，不急著猜名字（回扣生態第 4 課）。
3 安全：不進車道、不搬動動物；路死動物紀錄以老師安排的安全資料為主。

### 分頁 4　生活智慧怎麼讀？（文化脈絡與永續思考）

Hook（舊）：一張祭典或器皿照片，能告訴我們全部傳統規矩嗎？

**season（4 步）**　圓形季節盤（不寫月份，只寫「這個季節」「其他季節」）；中央放 CV10 飛魚。
1 一年中魚群來的季節：魚群接近的弧線亮起。
2 有的時間捕、有的時間休息：弧線分成兩段顏色。
3 休息的時間，資源有機會補充：右側的「族群條」回升（示意）。
4 這是特定族群、特定地方的規範：旁邊文字「不同族群、不同地方有不同做法」；標「不當成現在的時間表，也不是捕撈許可」。
科學：「季節性規範可用於討論利用與資源補充」；不把所有原住民族說成同一種做法；知識來源與名稱要尊重，照片可見的、閱讀提供的、需要詢問族人的資訊要分開。

**clues（3 步）**　三張課本原照（祭典、器皿、編織；保留在「照片」檢視、這裡引用同一批）依序放大。每張照片旁邊三個欄位：**照片可見／閱讀提供／需要詢問族人**。
1 祭典照片：「可見」欄滑進幾張卡（人數、服飾、場所…只寫看得見的，由 Sonnet 擬）；其餘兩欄虛線。
2 器皿照片：「可見」欄＝形狀、材料外觀；「閱讀提供」＝課本提到的材料；「需要詢問」＝製作脈絡。
3 編織照片：同樣方式；結尾「一張照片只是一個線索」。
科學：不沿用書中商品「28 天」或塑膠年數當通則；不預填開放題答案；不替任何族群講他們沒有說過的話。

**materials（3 步，補充，P3）**　CV11 天然素材四種（名稱以通用名稱為主，不掛特定族群）。
1 天然素材不是「沒有成本」：採集（會不會超過補充）。
2 製作與重複使用：使用次數。
3 用完以後：分解（EC7 落葉分解）要看條件；標「要查證，不一概而論」。

### 分頁 5　把三課的工具用在同一條溪（整合，選做）

這個分頁沒有舊版對應，是整個單元的收束，**額度不夠就整個不做**（頁面少一個分頁，其餘三個仍完整）。
Hook：「到這裡你已經有三組工具：比較、追問、驗證。同一條溪，你怎麼用？」

**casefile（4 步）**　HB4 溪流為底，BD7 溪流居民在水裡。
1 比：這條溪有哪些居民（物種）、哪些住處（生態系）。
2 追：這條溪承受什麼壓力——三個橘色小圖示（棲地被改、營養鹽、外來種）逐一亮起，各連一條線到「改變了什麼條件」。
3 做：兩個綠色措施——CV5b 魚梯、減少排放（程式畫的簡單圖示）。
4 驗：追蹤的青色圖示——同樣方法、重複記錄；標「措施不等於成效」。不給任何真實結果。

### 選擇題方向（每分頁 2 題）
保育：只保動物不保棲地不算完成；評估≠法律。連通：魚梯入口與落差影響使用；找到入口≠順利通過；一張相機照片不能證明族群恢復。生活行動：先記原本再追蹤；循環杯要看使用次數與歸還；交通選擇要看距離與安全。文化：季節性規範不等於現在的時間表；照片可見的和需要詢問的要分開；不同族群有不同做法。

### 科學立場（沿用舊頁，一字不放寬）
魚梯與廊道只作連通的類比，不表示流速、坡度或工程尺寸；實際成效可看使用、通過、存活與繁殖；循環杯需要歸還與清洗，整體環境影響看材料、使用次數、運輸與處理；公民觀察以老師安排的安全資料為主，不進車道、不搬動屍體；書中的保育等級、法規、數量、日期不當作最新資訊；傳統知識有特定族群與地方脈絡。延伸閱讀沿用舊版 `reading`。

---

## 5. 生圖清單與 prompts（給 Antigravity）

共 **47 條 prompt**，切出約 **97 個檔案**。一條 prompt 一張圖；整段英文（含 Style 句）原樣貼上，不要刪減、不要加字。

### 5.1 執行規則（請 Antigravity 照做）

1. **每條 prompt 各產 2 張候選**，存成 `<ID>_gemini_original_a.png`、`<ID>_gemini_original_b.png`（例：`BD1a_gemini_original_a.png`）。放在 `local-backups/20261024/environment_ai_originals/`。選哪張由老師或 Sonnet 決定。
2. **畫面不得有任何文字、字母、數字、標籤、箭頭、Logo、浮水印、簽名、時間戳記**。生出來只要有，就重生，不要用修圖遮。
3. **全幅場景與封面**：16:9 橫幅、滿版、不要邊框；盡量最高解析度。**白底去背圖**：純白（#FFFFFF）平塗背景、無陰影、無地面、主體之間留寬的空白欄（程式依左右空隙切開），主體不可接觸或重疊，也不要貼到畫面邊緣。
4. **編輯圖（`edit`）**：必須**先有底圖才能做**——TH8 要先有既有的 `assets/biology/ecology_ai_1023/HB5_pond.jpg`；TH14b 要先完成 TH14a；CV5b 要先完成 CV5a。把底圖當附圖，用該條 prompt 編輯；構圖與視角必須和底圖完全一致，只改 prompt 寫的那一部分。若工具無法做圖像編輯，改用該條下方的「備案（純文字）」，但要說明構圖可能不一致（之後程式會用淡入淡出，構圖不同會跳動）。
5. **不要用別人的圖當參考圖**（版權）。只准用本專案自己的圖當編輯底圖。
6. **各條下面的「檢查」逐項看過再交**：有一項不符就重生。生物特徵（石虎、藍腹鷴、綠蠵龜…）寧可重生也不要交錯的。
7. **所有動物、植物都畫成「教學插圖」**，不要血、不要受傷、不要死亡的動物、不要人。
8. 生完一批就貼回對話或放進上面資料夾，並**說出 ID**；Sonnet 會用 `cut_environment_1024.py`（沿用 `cut_ecology_l4_1024.py`）去背、切開、縮到最長邊 1400 px、存入 `assets/biology/environment_ai_1024/`。

### 5.2 建議的批次順序

1. 第一批（無依賴）：BD0～BD9b、TH0～TH6、TH10a～TH14a、CV0～CV5a、CV5c～CV11。
2. 第二批（需要底圖）：TH8（底圖 HB5）、TH14b（底圖 TH14a）、CV5b（底圖 CV5a）。
3. 優先順序若要分段交：第 1 課所有 BD → 第 2 課 TH → 第 3 課 CV；每課內「必要」先於「可選（補充）」。

### 5.3 總表

| ID | 畫面 | 型式 | 主體數 | 切出的檔名（左到右） | 用在哪 | 必要？ |
|---|---|---|---|---|---|---|
| BD0 | 封面：潮池裡的許多種生命 | 封面，全幅，不去背 | — | `biology_environmental_diversity_1024_v1.jpg` | 第 1 課封面、首頁卡片 | 必要 |
| BD1a | 異色瓢蟲（一）：三種花色 | 白底去背圖 | 3 | `BD1_ladybird_orange19.png`、`BD1_ladybird_orange0.png`、`BD1_ladybird_black2red.png` | frogs、response | 必要 |
| BD1b | 異色瓢蟲（二）：另外三種花色 | 白底去背圖 | 3 | `BD1_ladybird_black4red.png`、`BD1_ladybird_pale.png`、`BD1_ladybird_patch.png` | frogs、response | 必要 |
| BD2 | 四種稻米（碗裝） | 白底去背圖 | 4 | `BD2_rice_white.png`、`BD2_rice_brown.png`、`BD2_rice_black.png`、`BD2_rice_red.png` | uses（食物、遺傳資源） | 必要 |
| BD3 | 草地四種昆蟲 | 白底去背圖 | 4 | `BD3_honeybee.png`、`BD3_dragonfly.png`、`BD3_swallowtail.png`、`BD3_cricket.png` | count（可選配角）、timing（蜜蜂） | 必要 |
| BD4 | 珊瑚礁與許多魚（數種類用） | 全幅場景，不去背 | — | `BD4_reef.jpg` | count 第 4 步 | 必要 |
| BD5 | 一個地區的許多生態系（斜俯視全景） | 全幅場景，不去背 | — | `BD5_mosaic.jpg` | mosaic、boundary | 必要 |
| BD6 | 森林居民（臺灣） | 白底去背圖 | 4 | `BD6_blue_magpie.png`、`BD6_muntjac.png`、`BD6_swinhoes_pheasant.png`、`BD6_macaque.png` | residents 第 1 步 | 必要 |
| BD7 | 溪流居民（臺灣） | 白底去背圖 | 4 | `BD7_shovel_jaw_fish.png`、`BD7_mayfly_nymph.png`、`BD7_brown_dipper.png`、`BD7_river_snail.png` | residents 第 2 步、fishway（苦花）、casefile | 必要 |
| BD8a | 生活資源（一）：棉、繭、木材 | 白底去背圖 | 3 | `BD8_cotton.png`、`BD8_silk_cocoons.png`、`BD8_timber.png` | uses 第 2 步 | 必要 |
| BD8b | 生活資源（二）：橡膠、紅豆杉、竹筍 | 白底去背圖 | 3 | `BD8_rubber_tapping.png`、`BD8_yew_twig.png`、`BD8_bamboo_shoots.png` | uses 第 2、3 步 | 必要 |
| BD9a | 自然的熱帶雨林樹冠（斜俯視） | 全幅場景，不去背 | — | `BD9a_rainforest.jpg` | green（左） | 必要 |
| BD9b | 整齊的油棕園（斜俯視） | 全幅場景，不去背 | — | `BD9b_palm_plantation.jpg` | green（右） | 必要 |
| TH0 | 封面：暮色的路與森林邊緣的石虎 | 封面，全幅，不去背 | — | `biology_environmental_threats_1024_v1.jpg` | 第 2 課封面、首頁卡片 | 必要 |
| TH1a | 連續森林樹冠（正上方） | 全幅場景，不去背 | — | `TH1a_forest_top.jpg` | edge、fragment、corridor（底圖） | 必要 |
| TH1b | 農地拼塊（正上方） | 全幅場景，不去背 | — | `TH1b_farmland_top.jpg` | edge、fragment、corridor（農地底圖） | 必要 |
| TH2 | 石虎（兩個姿勢） | 白底去背圖 | 2 | `TH2_leopard_cat_stand.png`、`TH2_leopard_cat_walk.png` | fragment、corridor | 必要 |
| TH3 | 森林內部與邊緣的剖面 | 全幅場景，不去背 | — | `TH3_edge_section.jpg` | edge 第 4 步 | 必要 |
| TH4 | 黑鮪（成魚與幼魚） | 白底去背圖 | 2 | `TH4_bluefin_adult.png`、`TH4_bluefin_juvenile.png` | harvest、magnify | 必要 |
| TH5 | 四種外來生物（臺灣常見的例子） | 白底去背圖 | 4 | `TH5_red_eared_slider.png`、`TH5_crayfish.png`、`TH5_green_iguana.png`、`TH5_spot_legged_treefrog.png` | pathway、stages | 必要 |
| TH6 | 藤蔓蓋滿樹冠 | 全幅場景，不去背 | — | `TH6_vine_smother.jpg` | stages 第 5 步 | 必要 |
| TH8 | 同一座池塘：藻華爆發（以 HB5 池塘為底） | 編輯圖（以另一張為底） | — | `TH8_pond_bloom.jpg` | chain 第 3 步（與 HB5 淡入淡出）、judge | 必要 |
| TH10a | 汙染來源（一）：工廠、車流、噴灑的田 | 白底去背圖 | 3 | `TH10_factory.png`、`TH10_traffic.png`、`TH10_sprayer_field.png` | sources | 必要 |
| TH10b | 汙染來源（二）：排水口、魚塭、畜牧場 | 白底去背圖 | 3 | `TH10_drain.png`、`TH10_fish_farm.png`、`TH10_livestock.png` | sources | 必要 |
| TH11 | 海洋食物鏈四成員 | 白底去背圖 | 4 | `TH11_diatoms.png`、`TH11_copepod.png`、`TH11_sardine.png`、`TH11_mackerel.png` | bioacc、magnify | 必要 |
| TH12 | 怕熱的高山代表：櫻花鉤吻鮭與高山杜鵑 | 白底去背圖 | 2 | `TH12_formosan_salmon.png`、`TH12_alpine_rhododendron.png` | shift 第 4 步 | 必要 |
| TH13 | 櫻花盛開、花苞與綠繡眼 | 白底去背圖 | 3 | `TH13_cherry_bloom.png`、`TH13_cherry_buds.png`、`TH13_white_eye.png` | timing | 必要 |
| TH14a | 健康的珊瑚群體 | 全幅場景，不去背 | — | `TH14a_coral_healthy.jpg` | coral（第 1、2 步） | 必要 |
| TH14b | 同一群珊瑚：白化 | 編輯圖（以另一張為底） | — | `TH14b_coral_bleached.jpg` | coral 第 3、4 步（與 TH14a 淡入淡出） | 必要 |
| CV0 | 封面：黎明的沙灘與回海的小海龜 | 封面，全幅，不去背 | — | `biology_environmental_conservation_1024_v1.jpg` | 第 3 課封面、首頁卡片 | 必要 |
| CV1a | 綠蠵龜（成體、帶標籤成體、幼龜） | 白底去背圖 | 3 | `CV1_green_turtle_adult.png`、`CV1_green_turtle_tagged.png`、`CV1_hatchling.png` | turtle、toolbox | 必要 |
| CV1b | 綠蠵龜（亞成體）與沙中卵窩剖面 | 白底去背圖 | 2 | `CV1_juvenile.png`、`CV1_nest_cutaway.png` | turtle | 必要 |
| CV2 | 海龜產卵沙灘（黎明） | 全幅場景，不去背 | — | `CV2_nesting_beach.jpg` | turtle 第 1 步、toolbox 第 2 步 | 必要 |
| CV3 | 近岸海草床與覓食的綠蠵龜 | 全幅場景，不去背 | — | `CV3_seagrass.jpg` | turtle 第 4 步 | 必要 |
| CV5a | 河上有落差的橫向堰 | 全幅場景，不去背 | — | `CV5a_weir.jpg` | fishway 第 1 步 | 必要 |
| CV5b | 同一條河：旁邊加了魚梯 | 編輯圖（以另一張為底） | — | `CV5b_weir_fishway.jpg` | fishway 第 2 步（與 CV5a 淡入淡出） | 必要 |
| CV5c | 魚梯縱剖面 | 全幅場景，不去背 | — | `CV5c_fishway_section.jpg` | fishway 第 4 步 | 必要 |
| CV5d | 洄游水生生物：鰻魚與吻鰕虎 | 白底去背圖 | 2 | `CV5_eel.png`、`CV5_goby.png` | fishway 第 4 步 | 必要 |
| CV6a | 植被覆蓋的陸橋（斜俯視） | 全幅場景，不去背 | — | `CV6a_overpass.jpg` | corridor 第 2 步 | 必要 |
| CV6b | 路下的涵洞通道剖面 | 全幅場景，不去背 | — | `CV6b_underpass.jpg` | corridor 第 3 步 | 必要 |
| CV7a | 自動相機（綁在樹幹上） | 白底去背圖 | 1 | `CV7_camera_trap.png` | monitor | 必要 |
| CV7b | 紅外線夜拍風格的石虎畫面 | 全幅場景，不去背 | — | `CV7b_ir_frame.jpg` | monitor | 必要 |
| CV8a | 生活用品（一）：循環杯、紙杯、購物袋 | 白底去背圖 | 3 | `CV8_reusable_cup.png`、`CV8_paper_cups.png`、`CV8_tote_bag.png` | tradeoff | 必要 |
| CV8b | 生活用品（二）：自行車、公車、餐具組 | 白底去背圖 | 3 | `CV8_bicycle.png`、`CV8_bus.png`、`CV8_meal_set.png` | tradeoff | 必要 |
| CV9 | 野外觀察用具 | 白底去背圖 | 4 | `CV9_notebook.png`、`CV9_binoculars.png`、`CV9_camera.png`、`CV9_hand_lens.png` | citizen（補充） | 可選（補充） |
| CV10 | 飛魚（滑翔與游泳） | 白底去背圖 | 2 | `CV10_flying_fish_glide.png`、`CV10_flying_fish_swim.png` | season | 必要 |
| CV11 | 天然素材四種 | 白底去背圖 | 4 | `CV11_bamboo.png`、`CV11_pandan.png`、`CV11_areca_sheath.png`、`CV11_banana_leaf.png` | materials（補充） | 可選（補充） |

### 5.4 既有圖（不用再生，直接用）

| 用途 | 既有檔案（`assets/biology/ecology_ai_1023/`，除非另註） |
|---|---|
| 草地動物（count、composition、residents） | `EC4_grasshopper`、`EC4_caterpillar`、`EC4_vole`、`EC4_rabbit`、`EC5_mantis`、`EC5_frog`、`EC5_sparrow`、`EC6_snake`、`EC6_eagle`、`EC6_owl`、`EC15_field_snail`、`EC19_ladybird_aphids`（七星瓢蟲）、`EC2_meadow_scene` |
| 河口濕地居民 | `HB6_mangrove`、`HB7_mudskipper`、`HB8_fiddler_crab`、`EC16_spoonbill_stand`／`fly` |
| 池塘、溪流、沙漠、凍原、森林、山地 | `HB5_pond`、`HB4_stream`、`HB2_desert`、`HB3_tundra`、`HB1_forest`、`HB14_mountain`、`HB15`～`HB18` |
| 水生生物 | `EC14a_daphnia`、`EC14a_shrimp`、`EC14b_crucian`、`EC15_apple_snail` |
| 落葉分解 | `EC7_leaf_green`、`EC7_leaf_brown`、`EC7_leaf_skeleton`、`EC7_leaf_soil`、`EC18_log_decay` |
| 外來種延伸 | `EC15_apple_snail`、`EC15_egg_mass`（福壽螺） |
| 課本原照（真實照片，保留在「照片」檢視） | `assets/biology/environment_originals_1010_v1/`：`Im15_96`森林、`Im16_97`沙漠、`Im17_98`草原、`Im18_99`溪流、`Im19_100`珊瑚礁、`Im25_226`雨林、`Im26_229`棕櫚園、`Im33_317`石虎、`Im34_343`黑鮪、`Im35_344`紅豆杉、`Im43_389`工業、`Im46_698`水色異常、`Im47_699`優養化、`Im51_1562`福壽螺、`Im52_1566`螯蝦、`Im57_1590`珊瑚白化、`Im61_1615`斑腿樹蛙、`Im63_1617`綠鬣蜥、`Im72_1684`綠蠵龜、`Im1_16`魚梯、`Im117_1991`循環杯、`Im121_2022`自行車、`Im142_2279`祭典、`Im145_2298`器皿、`Im146_2301`編織 |


### 5.5　第 1 課（生物多樣性）的 prompts

#### BD0　封面：潮池裡的許多種生命（封面，全幅，不去背，必要）

- 切出：`biology_environmental_diversity_1024_v1.jpg`
- 用在：第 1 課封面、首頁卡片
- 檢查：沒有字、人、船、垃圾；畫面裡要能數出至少 6 種完全不同的生物（海膽、海星、海葵、螺、藤壺、寄居蟹、海藻、小魚）；不要單一主角。

```
Cinematic photorealistic wide shot, 16:9 landscape. A rocky tide pool at low tide seen from slightly above, crowded with many clearly different kinds of life in sharp focus: a purple sea urchin, an orange starfish, a green sea anemone with open tentacles, several snails and limpets on the rock, clusters of white barnacles at the pool edge, red and green seaweeds, a small hermit crab, and a tiny blenny fish in the clear water; late-afternoon golden light, wet shiny rock, calm water surface with soft reflections. No people, no buildings, no litter, no boats.
Shallow depth of field, generous margins on all sides. Absolutely no text, no letters, no numbers, no labels, no logos, no watermark, no signature, no borders.
```

#### BD1a　異色瓢蟲（一）：三種花色（白底去背圖，必要）

- 切出：`BD1_ladybird_orange19.png`、`BD1_ladybird_orange0.png`、`BD1_ladybird_black2red.png`
- 用在：frogs、response
- 檢查：三隻大小、朝向一致（頭朝上、翅蓋合攏、俯視）；斑點要清楚可數；不要畫成七星瓢蟲（紅底 7 點）。

```
Landscape 16:9. Three Asian harlequin ladybirds (Harmonia axyridis), each seen from directly above with wing cases closed and the head pointing up, all the same size and the same orientation, each showing a different colour form: (1) orange-red wing cases with about nineteen small black spots; (2) plain orange-yellow wing cases with no spots at all; (3) glossy black wing cases with exactly two large red spots. The pronotum behind the head shows the typical pale pattern with dark marks.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD1b　異色瓢蟲（二）：另外三種花色（白底去背圖，必要）

- 切出：`BD1_ladybird_black4red.png`、`BD1_ladybird_pale.png`、`BD1_ladybird_patch.png`
- 用在：frogs、response
- 檢查：同 BD1a：大小、朝向一致；與 BD1a 的三隻不能長得一樣。

```
Landscape 16:9. Three Asian harlequin ladybirds (Harmonia axyridis), each seen from directly above with wing cases closed and the head pointing up, all the same size and the same orientation, each showing a different colour form: (1) glossy black wing cases with exactly four red spots; (2) pale yellow-orange wing cases with only a few faint small spots; (3) red wing cases with a few large merged dark patches. The pronotum behind the head shows the typical pale pattern with dark marks.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD2　四種稻米（碗裝）（白底去背圖，必要）

- 切出：`BD2_rice_white.png`、`BD2_rice_brown.png`、`BD2_rice_black.png`、`BD2_rice_red.png`
- 用在：uses（食物、遺傳資源）
- 檢查：四碗大小一致、從斜上方看；米粒要清楚是稻米（細長）；四種顏色差異明顯；碗不要有花紋與字。

```
Landscape 16:9. Four small round dark-glazed ceramic bowls seen from slightly above, each heaped with a different kind of uncooked whole rice grains: (1) polished white rice; (2) light brown whole-grain rice; (3) glossy purple-black rice; (4) reddish-brown red rice. The bowls are identical plain bowls with no pattern; the grains are slender and clearly rice.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD3　草地四種昆蟲（白底去背圖，必要）

- 切出：`BD3_honeybee.png`、`BD3_dragonfly.png`、`BD3_swallowtail.png`、`BD3_cricket.png`
- 用在：count（可選配角）、timing（蜜蜂）
- 檢查：蜜蜂 6 隻足；蜻蜓翅膀兩對展開；鳳蝶翅膀展開；蟋蟀有後腳與觸角；四隻尺寸看起來都清楚。

```
Landscape 16:9. Four different meadow insects, each in a clear natural pose: (1) a honey bee in side view with wings slightly spread and six legs; (2) a dragonfly with a slender blue-green body perched with both pairs of transparent wings spread flat; (3) a swallowtail butterfly with its wings fully open in top view, black wings with yellow markings and small tails; (4) a field cricket in side view with long antennae and large hind legs.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD4　珊瑚礁與許多魚（數種類用）（全幅場景，不去背，必要）

- 切出：`BD4_reef.jpg`
- 用在：count 第 4 步
- 檢查：至少 10 種看得出不同的魚、彼此不重疊、不要成群擠成一團；珊瑚形態至少 3 種；水清；沒有潛水員、船、垃圾；魚的位置分散，方便程式在上面框選。

```
Landscape 16:9. A healthy shallow tropical coral reef seen at eye level in clear blue water with sunbeams from above: at least ten clearly different kinds of reef fish well separated across the frame, such as a yellow butterflyfish, a blue tang, an orange clownfish beside an anemone, a black-and-white striped sergeant fish, a green parrotfish, a Moorish idol, a lionfish and a few tiny blue damselfish; coral colonies of several shapes (branching, table and rounded brain coral) and a sandy patch. No divers, no boats, no debris.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### BD5　一個地區的許多生態系（斜俯視全景）（全幅場景，不去背，必要）

- 切出：`BD5_mosaic.jpg`
- 用在：mosaic、boundary
- 檢查：由近到遠依序：海岸（沙灘與一小段紅樹）→河口濕地（蘆葦與淺水）→ 農田方塊 → 溪流蜿蜒 → 草地 → 山麓森林 → 高山森林；每一種地景範圍夠大、邊界分明但自然過渡，方便程式疊色塊；沒有房子、道路、人。

```
Landscape 16:9. An oblique aerial view looking from the sea toward the mountains in clear midday light, showing in clear bands from front to back: a sandy coast with a thin strip of mangroves, a wetland of reeds and shallow pools, a river meandering through a patchwork of green farm fields, an open grassland, forested foothills, and tall forested mountains fading into light haze in the far distance. Each landscape type is large, distinct and softly blended into the next. No roads, no towns, no buildings, no people, no boats.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### BD6　森林居民（臺灣）（白底去背圖，必要）

- 切出：`BD6_blue_magpie.png`、`BD6_muntjac.png`、`BD6_swinhoes_pheasant.png`、`BD6_macaque.png`
- 用在：residents 第 1 步
- 檢查：藍腹鷴要有紅色臉部皮膚、白色長尾；臺灣藍鵲要有紅喙紅腳、白尖長尾；山羌是小型鹿、雄性有短角；臺灣獼猴棕灰色、短尾。四隻都全身入鏡。

```
Landscape 16:9. Four different forest animals of Taiwan, each in a natural full-body pose: (1) a Formosan blue magpie (Urocissa caerulea) perched, with a blue body, black head, red bill and red legs and a very long blue tail with white tips; (2) a male Formosan Reeves's muntjac (Muntiacus reevesi) standing in side view, a small reddish-brown deer with short antlers; (3) a male Swinhoe's pheasant (Lophura swinhoii) standing, glossy dark blue-black plumage, red facial skin, a white crest and long white tail feathers; (4) a Formosan rock macaque (Macaca cyclopis) sitting, grey-brown fur, a pinkish face and a short tail.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD7　溪流居民（臺灣）（白底去背圖，必要）

- 切出：`BD7_shovel_jaw_fish.png`、`BD7_mayfly_nymph.png`、`BD7_brown_dipper.png`、`BD7_river_snail.png`
- 用在：residents 第 2 步、fishway（苦花）、casefile
- 檢查：苦花（臺灣鏟頜魚）側面、銀橄欖色細長；蜉蝣稚蟲 3 條尾絲、6 隻腳、腹側羽狀鰓；河烏棕黑色站在小石頭上；川蜷深色細長螺塔。

```
Landscape 16:9. Four different stream animals, each fully visible: (1) a Taiwan shovel-jaw fish (Onychostoma barbatulum), a slender silvery-olive cyprinid fish in side view with a forked tail; (2) a mayfly nymph seen from above, with a flat brown body, six legs, feathery gills along the sides of the abdomen and three long tail filaments; (3) a brown dipper (Cinclus pallasii), a plump dark chocolate-brown songbird standing on one small wet grey stone; (4) a river snail (Semisulcospira) with a dark elongated spiral shell, in side view.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD8a　生活資源（一）：棉、繭、木材（白底去背圖，必要）

- 切出：`BD8_cotton.png`、`BD8_silk_cocoons.png`、`BD8_timber.png`
- 用在：uses 第 2 步
- 檢查：棉花枝要有裂開的棉鈴與白色纖維；蠶繭 3–4 個白色橢圓、旁邊一小段蠶絲；木材是 4 根去皮圓木堆疊、看得到年輪端面。

```
Landscape 16:9. Three natural resources, each as a compact object: (1) a branch of a cotton plant with green leaves and several open cotton bolls full of white fluffy fibre; (2) a small pile of four white oval silkworm cocoons with a loose thread of silk unwinding from one; (3) a small stack of four debarked pale wooden logs, the round cut ends showing clear growth rings.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD8b　生活資源（二）：橡膠、紅豆杉、竹筍（白底去背圖，必要）

- 切出：`BD8_rubber_tapping.png`、`BD8_yew_twig.png`、`BD8_bamboo_shoots.png`
- 用在：uses 第 2、3 步
- 檢查：橡膠樹幹有螺旋切痕、下方小杯接白色乳膠；紅豆杉小枝是針狀葉＋鮮紅杯狀假種皮；竹筍兩支＋一小段綠竹竿。

```
Landscape 16:9. Three plant resources, each as a compact object: (1) a short section of rubber tree trunk with a thin spiral tapping cut and a small cup attached below collecting white latex; (2) a twig of yew (Taxus) with flat dark green needle-like leaves and several bright red cup-shaped fleshy arils each holding a seed; (3) two young bamboo shoots with brown overlapping sheaths beside a short length of green bamboo culm with a node.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### BD9a　自然的熱帶雨林樹冠（斜俯視）（全幅場景，不去背，必要）

- 切出：`BD9a_rainforest.jpg`
- 用在：green（左）
- 檢查：與 BD9b 視角、光線、色調一致；樹冠高低、形狀、綠色深淺都不同，有突出的巨樹與藤蔓；沒有路、房子、人。

```
Landscape 16:9. An aerial view looking down at about forty-five degrees over a natural tropical rainforest canopy in soft even daylight: trees of many different heights, crown shapes and shades of green, a few giant emergent trees rising above the rest, vines, an irregular lumpy canopy surface and light mist in a distant valley. No roads, no buildings, no people, no clearings.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### BD9b　整齊的油棕園（斜俯視）（全幅場景，不去背，必要）

- 切出：`BD9b_palm_plantation.jpg`
- 用在：green（右）
- 檢查：與 BD9a 視角、光線、色調、遠方山形一致；棕櫚排列成規則的行、高度與樹冠形狀相近；行間露出紅土；沒有路、房子、人。

```
Landscape 16:9. An aerial view looking down at about forty-five degrees over an oil palm plantation in the same soft even daylight and the same overall green colour grading as a rainforest canopy view: perfectly regular rows of identical palms of nearly the same height with star-shaped crowns, narrow strips of bare reddish soil between the rows, gentle hills and light mist in the distance. No roads, no buildings, no people.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

### 5.6　第 2 課（人類活動與威脅）的 prompts

#### TH0　封面：暮色的路與森林邊緣的石虎（封面，全幅，不去背，必要）

- 切出：`biology_environmental_threats_1024_v1.jpg`
- 用在：第 2 課封面、首頁卡片
- 檢查：石虎要有：黃褐色有斑點、額頭兩條黑縱紋、耳後黑底白斑、尾巴有環；路上沒有車（只有遠處柔和的車燈光暈）；沒有人、路標、房子、血；不是受傷的動物。

```
Cinematic photorealistic wide shot, 16:9 landscape. Dusk on a narrow empty asphalt road cutting through dense subtropical forest, thin mist hanging between the trees, the forest continuing on both sides; at the right edge of the road at the treeline a single leopard cat (Prionailurus bengalensis: tawny coat with dark spots, two dark stripes on the forehead, rounded black ears with a white spot behind) stands alert looking toward the road, in sharp focus; far down the road a soft warm glow of approaching headlights with no vehicle shape visible. No people, no vehicles visible, no road signs, no buildings, no litter, no blood.
Shallow depth of field, generous margins on all sides. Absolutely no text, no letters, no numbers, no labels, no logos, no watermark, no signature, no borders.
```

#### TH1a　連續森林樹冠（正上方）（全幅場景，不去背，必要）

- 切出：`TH1a_forest_top.jpg`
- 用在：edge、fragment、corridor（底圖）
- 檢查：正上方垂直往下看（像衛星或無人機）；整幅都是森林，沒有空地、路、水、房子；質感要細，方便程式切割後與 TH1b 拼接；左右上下亮度平均。

```
Landscape 16:9. A straight-down top view, like a drone or satellite photo, of continuous natural subtropical broadleaf forest canopy filling the entire frame: dense rounded tree crowns of many shades of green with soft crown shadows, perfectly even lighting from edge to edge. No clearings, no roads, no buildings, no water, no horizon.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH1b　農地拼塊（正上方）（全幅場景，不去背，必要）

- 切出：`TH1b_farmland_top.jpg`
- 用在：edge、fragment、corridor（農地底圖）
- 檢查：與 TH1a 同樣的正上方視角、光線、比例；長方形田塊不同綠與黃褐色，田間有裸土帶；沒有房子、車、人；亮度平均。

```
Landscape 16:9. A straight-down top view, like a drone or satellite photo, of a patchwork of farmland filling the entire frame: rectangular fields in different shades of green and tan with bare brown soil strips between them, in the same even lighting and the same scale as a forest canopy photo taken from the same height. No buildings, no vehicles, no people, no roads wider than a field track, no water.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH2　石虎（兩個姿勢）（白底去背圖，必要）

- 切出：`TH2_leopard_cat_stand.png`、`TH2_leopard_cat_walk.png`
- 用在：fragment、corridor
- 檢查：額頭兩條黑縱紋、眼內側白紋、耳背黑底白斑、尾有環與黑尾尖、體型像家貓；站姿側面、行走姿勢側面；四肢完整。

```
Landscape 16:9. Two images of the same leopard cat (Prionailurus bengalensis), each in full-body side view and facing left: (1) standing alert with the head slightly raised; (2) walking with one front paw lifted. Tawny-yellow coat with dark spots and blotches, two dark stripes on the forehead, white stripes along the inner eyes, rounded black ears with a white spot on the back, and a ringed tail with a dark tip; the body is about the size of a domestic cat.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH3　森林內部與邊緣的剖面（全幅場景，不去背，必要）

- 切出：`TH3_edge_section.jpg`
- 用在：edge 第 4 步
- 檢查：左右明顯對比：左森林內部（暗、潮濕、落葉厚、蕨類苔蘚），右森林邊緣（亮、乾、草本、土色淺）；地面剖面可見土壤顏色左深右淺；右上有太陽光但不要畫太陽本體；不要房子與人。

```
Landscape 16:9. A stylised side-view cutaway illustration of a forest edge: on the left, forest interior with tall trunks, deep shade, thick dark moist leaf litter, ferns and mosses; on the right, the forest edge opening into a bright sunlit open field with dry grass and pale dry topsoil; below ground the soil cross-section is visible, darker and moister on the left, paler and drier on the right; strong sunlight enters from the right side of the sky (no sun disc), a soft gradient from shade to bright light across the picture. No buildings, no people.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH4　黑鮪（成魚與幼魚）（白底去背圖，必要）

- 切出：`TH4_bluefin_adult.png`、`TH4_bluefin_juvenile.png`
- 用在：harvest、magnify
- 檢查：兩隻都朝左、側面、魚鰭完整；成魚大（約幼魚三倍長）；不要血、不要魚鉤與漁網；幼魚是同一種魚縮小。

```
Landscape 16:9. Two Pacific bluefin tuna (Thunnus orientalis) in clean full-body side view, both facing left: (1) a large adult with a dark blue back, silvery flanks and a sleek torpedo body with crescent tail and small yellow finlets; (2) a juvenile of the same species about one third of the adult's length, with the same shape and a more delicate pale vertical banding on the flank. No hooks, no nets, no blood.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH5　四種外來生物（臺灣常見的例子）（白底去背圖，必要）

- 切出：`TH5_red_eared_slider.png`、`TH5_crayfish.png`、`TH5_green_iguana.png`、`TH5_spot_legged_treefrog.png`
- 用在：pathway、stages
- 檢查：巴西龜眼後有紅色橫斑；螯蝦深紅色、一對大螯；綠鬣蜥全身（頭到尾）完整、背脊有鬣刺、喉下有垂皮；斑腿樹蛙淡褐色、背有深色斑紋、趾端有吸盤。四隻都全身。

```
Landscape 16:9. Four different introduced animals, each shown in full body: (1) a red-eared slider turtle (Trachemys scripta elegans) seen from the side with an olive-green shell and a red patch behind the eye; (2) a red swamp crayfish (Procambarus clarkii) in top view with a dark red body and a pair of large pincers; (3) a green iguana (Iguana iguana) in full side view from head to the end of its banded tail, with a spiny crest along the back and a dewlap under the chin; (4) a spot-legged tree frog (Polypedates megacephalus) crouching, pale brown with dark markings on the back and wide adhesive toe pads.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH6　藤蔓蓋滿樹冠（全幅場景，不去背，必要）

- 切出：`TH6_vine_smother.jpg`
- 用在：stages 第 5 步
- 檢查：藤蔓葉為心形到三角形、先端尖，開淡粉白色的小簇毛狀花；原本的樹冠幾乎被蓋住；上層受光、下層暗；沒有人、房子。

```
Landscape 16:9. A mid-height view of a line of small trees and shrubs at the edge of a field, completely blanketed by a dense climbing vine with heart-shaped to triangular leaves with pointed tips and small clusters of pale whitish-pink fluffy flowers; the original tree crowns are barely visible under the green blanket; bright sunlight on the top surface, deep shade underneath. No people, no buildings.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH8　同一座池塘：藻華爆發（以 HB5 池塘為底）（編輯圖（以另一張為底），必要）

- 切出：`TH8_pond_bloom.jpg`
- 用在：chain 第 3 步（與 HB5 淡入淡出）、judge
- **底圖（附圖）**：`assets/biology/ecology_ai_1023/HB5_pond.jpg`
- 檢查：構圖、視角、岸邊、蘆葦、天空必須與 HB5 完全相同，只有水面改變；水面大面積鮮綠色浮渣、岸邊有黃綠條紋；沒有死魚、人。

```
Edit the attached image of a calm pond (HB5_pond.jpg). Keep the exact composition, viewpoint, shoreline, reeds, banks, trees and sky unchanged. Change only the water: cover most of the water surface with a thick, bright, scummy green algal bloom with swirls of paler green and a few yellowish streaks near the shore, so the water beneath looks murky olive green, with the lily pads partly covered by the green layer. No dead animals, no people, no text.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

備案（純文字，無法編輯圖像時用）：

```
Landscape 16:9. A still pond seen from a slightly raised angle, with reeds and emergent plants along the shore, green banks and a clear sky: the whole water surface is covered by a thick, bright, scummy green algal bloom with swirls of paler green and yellowish streaks near the shore, the water beneath murky olive green, a few lily pads partly covered. No dead animals, no people.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH10a　汙染來源（一）：工廠、車流、噴灑的田（白底去背圖，必要）

- 切出：`TH10_factory.png`、`TH10_traffic.png`、`TH10_sprayer_field.png`
- 用在：sources
- 檢查：三個物件都是小型模型風格、獨立；工廠只有一根煙囪、煙為白灰色；車流 3 輛車、一小段路面；田為一小塊綠色作物與噴灑的拖拉機。不要品牌字。

```
Landscape 16:9. Three separate compact diorama-style objects: (1) a small factory building with a single tall smokestack releasing a plume of white-grey smoke; (2) a short strip of grey road with two passenger cars and a lorry driving in a line; (3) a small square of green crop rows with a tractor pulling a boom sprayer that is releasing a fine mist over the field.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH10b　汙染來源（二）：排水口、魚塭、畜牧場（白底去背圖，必要）

- 切出：`TH10_drain.png`、`TH10_fish_farm.png`、`TH10_livestock.png`
- 用在：sources
- 檢查：排水口是住家牆角下水管把水排進小水溝；魚塭是方形池、兩台水車式增氧機；畜牧場是低矮棚舍、柵欄、數隻豬。不要人。

```
Landscape 16:9. Three separate compact diorama-style objects: (1) the corner of a small house wall with a drainpipe at its base discharging water into a short shallow ditch; (2) a square fish-farm pond with earth banks and two paddle-wheel aerators churning the water; (3) a low livestock shed with a fenced yard and a few pigs.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH11　海洋食物鏈四成員（白底去背圖，必要）

- 切出：`TH11_diatoms.png`、`TH11_copepod.png`、`TH11_sardine.png`、`TH11_mackerel.png`
- 用在：bioacc、magnify
- 檢查：矽藻是一串金褐色玻璃質細胞（顯微放大畫法）；橈足類透明、兩條長觸角；沙丁魚銀亮側面；鯖魚背有斑紋。魚都朝左。矽藻與橈足類不需要與魚成比例。

```
Landscape 16:9. Four members of a marine food chain, each in a clean separate view: (1) a chain of diatom cells drawn as a microscope-style enlargement, golden-brown glassy rectangular cells linked end to end; (2) a copepod, a tiny transparent crustacean with a teardrop body and two very long antennae, enlarged; (3) a sardine in side view, slim and silvery with a darker blue-green back, facing left; (4) a mackerel in side view, blue-green back with dark wavy stripes and a silver belly, facing left.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH12　怕熱的高山代表：櫻花鉤吻鮭與高山杜鵑（白底去背圖，必要）

- 切出：`TH12_formosan_salmon.png`、`TH12_alpine_rhododendron.png`
- 用在：shift 第 4 步
- 檢查：鮭魚側面、橄欖褐色身體側面有數個橢圓形深色斑；杜鵑為一小枝：革質亮綠葉＋一簇淡粉白色鐘形花。

```
Landscape 16:9. Two images: (1) a Formosan landlocked salmon (Oncorhynchus formosanus) in clean side view facing left, olive-brown back with a row of dark oval parr marks along the flank and a faint pinkish tint; (2) a short flowering branch of an alpine rhododendron (Rhododendron pseudochrysanthum) with leathery glossy dark green leaves and a cluster of pale pink-white bell-shaped flowers.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH13　櫻花盛開、花苞與綠繡眼（白底去背圖，必要）

- 切出：`TH13_cherry_bloom.png`、`TH13_cherry_buds.png`、`TH13_white_eye.png`
- 用在：timing
- 檢查：兩枝櫻花枝是同一種、同樣大小與角度：一枝盛開（深粉紅下垂鐘形花）、一枝只有緊閉花苞；綠繡眼橄欖綠、眼周一圈白色。

```
Landscape 16:9. Three images: (1) a branch of Taiwan cherry (Prunus campanulata) in full bloom, with deep pink bell-shaped flowers hanging downward; (2) a branch of the same tree at the same size and angle with only tight closed buds and a few bronze young leaves, no open flowers; (3) a Japanese white-eye (Zosterops japonicus) perched, olive-green back, pale belly and a distinct white ring around the eye.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### TH14a　健康的珊瑚群體（全幅場景，不去背，必要）

- 切出：`TH14a_coral_healthy.jpg`
- 用在：coral（第 1、2 步）
- 檢查：鹿角珊瑚為主、褐金到粉紅色、可見珊瑚蟲細節；水藍清澈；少數小魚在旁；構圖簡單，之後要生成同構圖的白化版。

```
Landscape 16:9. An underwater close-up of a healthy colony of branching staghorn coral filling the centre of the frame, rich golden-brown and pinkish colours with fine visible polyps along the branches, clear blue water behind, sunbeams from above, and a few small colourful fish nearby. Simple composition. No divers, no debris.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### TH14b　同一群珊瑚：白化（編輯圖（以另一張為底），必要）

- 切出：`TH14b_coral_bleached.jpg`
- 用在：coral 第 3、4 步（與 TH14a 淡入淡出）
- **底圖（附圖）**：`assets/biology/environment_ai_1024/TH14a_coral_healthy.jpg（先生 TH14a 再做這張）`
- 檢查：構圖、珊瑚枝形狀、小魚位置、水色與 TH14a 完全相同，只有珊瑚改成蒼白；不要變成死掉長滿藻的樣子。

```
Edit the attached image of a healthy coral colony (TH14a_coral_healthy.jpg). Keep the exact composition, coral branch shapes, fish, water colour and light unchanged. Change only the coral colour: bleached to a pale white-cream with the polyps faintly visible and a few patches that are slightly brownish; do not add algae or decay. No text.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

備案（純文字，無法編輯圖像時用）：

```
Landscape 16:9. An underwater close-up of a colony of branching staghorn coral filling the centre of the frame, completely bleached to a pale white-cream colour with the polyps faintly visible and a few slightly brownish patches, clear blue water behind, sunbeams from above and a few small colourful fish nearby. Simple composition. No divers, no debris, no algae.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

### 5.7　第 3 課（保育與永續）的 prompts

#### CV0　封面：黎明的沙灘與回海的小海龜（封面，全幅，不去背，必要）

- 切出：`biology_environmental_conservation_1024_v1.jpg`
- 用在：第 3 課封面、首頁卡片
- 檢查：沒有字、人、燈、房子、垃圾；左下前景可見一列小海龜朝海走，中景一隻成年海龜剪影在浪邊；沙上有爬行痕與一個淺坑。

```
Cinematic photorealistic wide shot, 16:9 landscape. A quiet sandy beach at dawn: a curved track in the sand leads from the water up to a freshly dug shallow pit near the dune grass; at the lower left, in sharp focus, a short line of tiny hatchling sea turtles heads toward the sea; at the water's edge a single large adult green sea turtle is silhouetted among gentle waves; pink-orange sky, low sun, wet sand reflecting the light. No people, no buildings, no lights, no litter, no boats.
Shallow depth of field, generous margins on all sides. Absolutely no text, no letters, no numbers, no labels, no logos, no watermark, no signature, no borders.
```

#### CV1a　綠蠵龜（成體、帶標籤成體、幼龜）（白底去背圖，必要）

- 切出：`CV1_green_turtle_adult.png`、`CV1_green_turtle_tagged.png`、`CV1_hatchling.png`
- 用在：turtle、toolbox
- 檢查：成體兩隻是同一姿勢（斜俯視游泳）、同一隻，第二隻在背甲上多一個小圓形灰色衛星標籤（短天線，無字）；幼龜在一小塊沙地上、爬行姿勢；綠蠵龜特徵：一對前額鱗、背甲圓滑橄欖褐。

```
Landscape 16:9. Three images of green sea turtles (Chelonia mydas): (1) a large adult swimming, seen from a top three-quarter view, with a smooth oval olive-brown shell with radiating pale streaks, a single pair of scales between the eyes and long paddle-like flippers; (2) exactly the same adult in exactly the same pose, with one small round grey satellite tag with a short antenna attached to the top of its shell; (3) a hatchling on a small patch of sand in a crawling pose, dark top and pale underside, flippers extended, drawn at about one third of the adult's length for visibility.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV1b　綠蠵龜（亞成體）與沙中卵窩剖面（白底去背圖，必要）

- 切出：`CV1_juvenile.png`、`CV1_nest_cutaway.png`
- 用在：turtle
- 檢查：亞成體側面、游泳、比成體小；卵窩是一塊沙的長方形剖面，內有圓形空腔，約 12 顆白色圓卵（像乒乓球）；沙層可見分層。

```
Landscape 16:9. Two images: (1) a juvenile green sea turtle (Chelonia mydas) swimming in clean side view, smaller than an adult, smooth olive-brown shell; (2) a rectangular cross-section block of beach sand showing layers, with a round chamber in the middle holding about twelve round white soft-shelled eggs like ping-pong balls, the sand layer above the chamber a little compacted.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV2　海龜產卵沙灘（黎明）（全幅場景，不去背，必要）

- 切出：`CV2_nesting_beach.jpg`
- 用在：turtle 第 1 步、toolbox 第 2 步
- 檢查：沙灘乾淨、有一條從浪邊爬上沙灘的彎曲痕跡與高處的淺坑；背景有稀疏的濱海植物；與 CV0 色調相近但不是同一張構圖；沒有人、燈、房子、垃圾。

```
Landscape 16:9. A sandy sea turtle nesting beach at dawn seen from slightly above and at an angle: smooth pale sand, a curved crawl track from the surf up to a shallow nest depression higher on the beach near sparse dune vegetation (beach morning glory and coarse grass), gentle waves and a pale pink sky. No people, no turtles in close-up, no buildings, no lights, no litter.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV3　近岸海草床與覓食的綠蠵龜（全幅場景，不去背，必要）

- 切出：`CV3_seagrass.jpg`
- 用在：turtle 第 4 步
- 檢查：海草是綠色帶狀長葉；水清；一隻綠蠵龜在中景吃海草（不要太大）；有一點小魚；沒有潛水員、船、垃圾。

```
Landscape 16:9. An underwater scene of a shallow seagrass meadow in clear turquoise water: dense green ribbon-like seagrass blades swaying, sandy patches between them, one green sea turtle grazing on the seagrass in the middle distance, a few small fish, sunbeams from the surface. No divers, no boats, no debris.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV5a　河上有落差的橫向堰（全幅場景，不去背，必要）

- 切出：`CV5a_weir.jpg`
- 用在：fishway 第 1 步
- 檢查：整條河被一道直線的低矮混凝土堰橫過，水從約人高的落差跌下、下方有白色泡沫；右岸要留出空地，之後要加上魚梯；沒有魚梯、人、車。

```
Landscape 16:9. A shallow clear river in a forested valley seen from a slightly raised angle across the stream: a low straight-edged concrete weir spans the entire river with water spilling over a vertical drop of about one metre into a foaming pool below; calm water downstream; tree-lined banks and rocks, with an open flat bank on the right side. No fishway, no people, no vehicles, no bridges.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV5b　同一條河：旁邊加了魚梯（編輯圖（以另一張為底），必要）

- 切出：`CV5b_weir_fishway.jpg`
- 用在：fishway 第 2 步（與 CV5a 淡入淡出）
- **底圖（附圖）**：`assets/biology/environment_ai_1024/CV5a_weir.jpg（先生 CV5a 再做這張）`
- 檢查：除右岸新增的階梯式魚梯外，其餘與 CV5a 完全相同；魚梯入口在下游、靠近堰下方的泡沫池邊；水從一格流到下一格；沒有人。

```
Edit the attached image of a river with a weir (CV5a_weir.jpg). Keep the exact composition, river, weir, banks and trees unchanged. Add only a concrete pool-and-weir fishway on the right bank beside the weir: a staircase of about six small water-filled pools, water cascading from one pool to the next, with its lower entrance opening into the foaming pool just below the weir. No people, no text.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

備案（純文字，無法編輯圖像時用）：

```
Landscape 16:9. A shallow clear river in a forested valley seen from a slightly raised angle: a low straight-edged concrete weir spans the river with water dropping about one metre into a foaming pool below; on the right bank beside the weir a concrete pool-and-weir fishway, a staircase of about six small water-filled pools with water cascading from one to the next and its lower entrance opening into the foaming pool; tree-lined banks and rocks. No people, no vehicles.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV5c　魚梯縱剖面（全幅場景，不去背，必要）

- 切出：`CV5c_fishway_section.jpg`
- 用在：fishway 第 4 步
- 檢查：沿水流方向切開的剖面；6 個水池依序下低上高、池間低牆、水從牆頂與底部小孔流過；右下是入口、左上是出口；池內有 2–3 條小魚休息；沒有字。

```
Landscape 16:9. A side-view cutaway illustration of a pool-and-weir fishway: a concrete channel on a gentle slope cut open lengthwise to show a series of six water-filled pools separated by low walls, water spilling over the top of each wall to the pool below, with small round openings near the bottom of the walls; the entrance at the lower right and the exit at the upper left; two or three small fish resting in different pools; an earth bank above the channel. Clean, simple diagrammatic style.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV5d　洄游水生生物：鰻魚與吻鰕虎（白底去背圖，必要）

- 切出：`CV5_eel.png`、`CV5_goby.png`
- 用在：fishway 第 4 步
- 檢查：鰻魚是日本鰻鱺：細長、背橄欖褐、腹淡色、單一長背臀鰭；吻鰕虎是底棲小魚，腹鰭癒合成吸盤，褐色斑駁。都是側面。

```
Landscape 16:9. Two freshwater animals in clean side view: (1) a Japanese eel (Anguilla japonica) with a long slim body in a gentle curve, olive-brown back, pale belly and a continuous fin along the back and tail; (2) a small goby (Rhinogobius) on the bottom with a mottled brown body, two dorsal fins and pelvic fins fused into a sucker.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV6a　植被覆蓋的陸橋（斜俯視）（全幅場景，不去背，必要）

- 切出：`CV6a_overpass.jpg`
- 用在：corridor 第 2 步
- 檢查：陸橋寬、覆土有草灌木與小樹，兩端與兩側森林相連；橋下是一段兩線道公路進入短隧道；路上沒有車、人、路標。

```
Landscape 16:9. An oblique aerial view along a two-lane road through forested hills: a wide land bridge covered with soil, grass, shrubs and young trees spans over the road, its two ends joining the forest on either side so that a green strip connects the forest areas; the empty road passes beneath the bridge through a short tunnel. No vehicles, no people, no road signs, no buildings.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV6b　路下的涵洞通道剖面（全幅場景，不去背，必要）

- 切出：`CV6b_underpass.jpg`
- 用在：corridor 第 3 步
- 檢查：側面剖面：路堤上方是路面、下方是長方形涵洞，洞內地面為泥土落葉與一道淺水溝；兩端洞口有植被；兩側是森林；洞內沒有動物。

```
Landscape 16:9. A side-view cutaway illustration of a road embankment with a rectangular concrete culvert tunnel running beneath the road: the tunnel floor is earth with leaf litter and a shallow trickle of water, vegetation grows around both tunnel entrances, and forest stands on both sides of the road above; the road surface is visible on top with no vehicles. No animals, no people, no text.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV7a　自動相機（綁在樹幹上）（白底去背圖，必要）

- 切出：`CV7_camera_trap.png`
- 用在：monitor
- 檢查：橄欖綠矩形野外相機，前面有鏡頭與紅外線燈格，綁帶繞在一小段樹幹上；機身上沒有品牌字或標誌。

```
Landscape 16:9. A single rugged olive-green rectangular wildlife trail camera strapped to a short vertical section of tree trunk with a webbing strap, its front showing a round lens and a panel of small infrared LEDs; plain body with no markings.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV7b　紅外線夜拍風格的石虎畫面（全幅場景，不去背，必要）

- 切出：`CV7b_ir_frame.jpg`
- 用在：monitor
- 檢查：灰階、有顆粒；石虎在林間小徑邊緣行走、眼睛反光發白；前景蕨與樹幹被閃光照亮、往暗處衰減；畫面上絕對沒有時間戳記、數字、邊框、文字。

```
Landscape 16:9. A grainy black-and-white infrared night-vision style wildlife camera frame: a leopard cat (Prionailurus bengalensis) walking along the edge of a forest trail with its eyes glowing white, ferns and tree trunks in the foreground lit by an infrared flash and falling off into darkness. No on-screen overlay, no timestamp, no text, no numbers, no border.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy, vegetation and natural colours. Full-bleed scene filling the whole frame, no border. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature.
```

#### CV8a　生活用品（一）：循環杯、紙杯、購物袋（白底去背圖，必要）

- 切出：`CV8_reusable_cup.png`、`CV8_paper_cups.png`、`CV8_tote_bag.png`
- 用在：tradeoff
- 檢查：循環杯是不鏽鋼杯＋蓋；紙杯三個疊起，塑膠蓋；購物袋是折起的素色布袋；任何物件上都沒有圖案與字。

```
Landscape 16:9. Three everyday objects, all plain with no printing or logos: (1) a stainless-steel reusable cup with a screw-on lid; (2) a stack of three white paper cups topped with plastic lids; (3) a neatly folded plain cloth tote bag with two handles.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV8b　生活用品（二）：自行車、公車、餐具組（白底去背圖，必要）

- 切出：`CV8_bicycle.png`、`CV8_bus.png`、`CV8_meal_set.png`
- 用在：tradeoff
- 檢查：自行車為城市公共自行車風格（前籃、無品牌）側面；公車為素色，沒有路線字、品牌；餐具組為便當盒＋筷子＋小碗。

```
Landscape 16:9. Three everyday objects, all plain with no printing or logos: (1) a city bicycle with a front basket in clean side view; (2) a plain single-colour city bus in clean side view with no route numbers or lettering; (3) a reusable meal set: a lunch box with a lid, a pair of chopsticks and a small bowl.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 3 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV9　野外觀察用具（白底去背圖，可選（補充））

- 切出：`CV9_notebook.png`、`CV9_binoculars.png`、`CV9_camera.png`、`CV9_hand_lens.png`
- 用在：citizen（補充）
- 檢查：筆記本攤開、紙張空白（沒有任何字或格線以外的內容）＋鉛筆；望遠鏡為雙筒；相機為通用小型數位相機，無品牌；放大鏡有木柄。

```
Landscape 16:9. Four field observation tools: (1) an open field notebook with blank lined pages and a pencil lying across it; (2) a pair of binoculars; (3) a compact digital camera with no brand markings; (4) a hand magnifying lens with a wooden handle.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV10　飛魚（滑翔與游泳）（白底去背圖，必要）

- 切出：`CV10_flying_fish_glide.png`、`CV10_flying_fish_swim.png`
- 用在：season
- 檢查：同一種飛魚；滑翔姿勢胸鰭展開像翅膀、尾叉形；游泳姿勢鰭收起；藍背銀腹；側面；沒有水花也沒有人、船。

```
Landscape 16:9. Two images of the same species of flying fish, both in clean side view: (1) gliding, with its enlarged pectoral fins spread wide like wings and its forked tail with a longer lower lobe; (2) swimming, with the pectoral fins folded against the body. Blue-green back, silvery belly, large eye. No water splash, no people, no boats.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 2 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

#### CV11　天然素材四種（白底去背圖，可選（補充））

- 切出：`CV11_bamboo.png`、`CV11_pandan.png`、`CV11_areca_sheath.png`、`CV11_banana_leaf.png`
- 用在：materials（補充）
- 檢查：只畫素材本身，不要編好的器物、不要手、不要任何文化符號；竹節＋綠竹竿、林投葉一束（葉緣有鋸齒、長帶狀）、檳榔葉鞘（大型船形彎曲）、香蕉葉一片。

```
Landscape 16:9. Four natural plant materials, each shown as a single raw object with nothing made from them: (1) a short section of green bamboo culm with a node and a few leaves; (2) a bundle of long ribbon-like pandanus leaves with fine saw-like edges; (3) a large curved boat-shaped areca palm leaf sheath; (4) one whole green banana leaf with its central rib.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. The 4 subjects stand in one single horizontal row with wide empty white gaps between them, none touching or overlapping, each one fully visible and about the same visual size. Generous empty margin around each subject. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

## 6. 工作流程（Sonnet 主對話）

順序：**計畫過目 → 生圖 → 處理圖片 → 共用工具與主程式 → 預覽頁 → 動畫（Opus 一次一個）→ QA → 換掉正式頁 → 首頁與進度**。老師 10-23 說過「做多少推多少」，所以動畫是**逐個上線**，不等全做完。

1. **老師看這份計畫**，回覆 §7 的待決定項。
2. **Antigravity 生圖**（§5），交回後 Sonnet 一次做完圖片處理：
   - `assets/biology/environment_ai_1024/`：`cut_environment_1024.py`（複製 `ecology_ai_1023/cut_ecology_l4_1024.py` 改檔名表）、`sources.md`（每張：生成工具、日期、原圖備份路徑、處理方式、已知瑕疵、「AI 教學插圖，非實拍」）、`_report.json`。
   - 原圖備份 `local-backups/20261024/environment_ai_originals/`；咒語保留在本檔。
   - 封面縮成寬 1672 JPEG：`assets/covers/biology_environmental_{diversity,threats,conservation}_1024_v1.jpg`，換封面、首頁卡片（含中英 `INDEX_CARD_EN`）。
   - 去背圖處理後一律放大 400% 看邊緣；貼上黑板底（`#11261f`）檢查有沒有亮邊、灰框。
3. **共用工具** `environment_kit_1024_v1.js`：包住 `ecology_kit_1023_v1.js`（`window.EcologyKit`），只加：新圖的 `SIZE`（用 PIL 量好）、本單元顏色常數（§1.4）、共用 `LAB` 標籤（壓力、措施、示意、AI 教學插圖…）。動畫契約沿用：`window.EnvironmentDraw.<名稱> = (c, s, t) => {…}`。
4. **主程式**（每課一支）：`environment_diversity_1024_v1.js`、`environment_threats_1024_v1.js`、`environment_conservation_1024_v1.js`。要做的事：
   - 分頁／副標題／鉤子（沿用舊版，第一個分頁加橋接句）、各觀察的步驟文字、`LAB`、選項（`s.warm`、`s.action`）、步驟鈕簡稱；
   - 沒做好的動畫先用 `stub` 頂著（顯示「製作中」+ 該動畫第一張圖），讓正式頁隨時可以換；
   - 每分頁 2 題選擇題（用 `genetics_quiz_1020_v1.js`），方向見各課末；
   - **拿掉**「我的觀察紀錄」文字框（開放式）；
   - 「照片」檢視：保留舊版課本原圖，沿用 `gallery`；AI 圖加 `ai:true`（圖像來源列寫「AI 教學插圖，非實拍」）；
   - 延伸閱讀沿用舊版 `reading` 全文；
   - 每課末的概念收束沿用舊版 `closure`，必要時補一句橋接下一課；
   - 章節導覽三個連結、頁面標題、首頁卡片名稱（中英）同步成新標題。
5. **預覽頁**：`biology_environmental_{diversity,threats,conservation}_1024_preview1.html`（內容與正式頁相同，script 多載入新檔，在舊的 `environment_lessons_1010_v1.js` 之前或取代之）。動畫逐個加入 `<script>`。
6. **動畫**（Opus 一次一個，順序見各課「做的順序」）。每個動畫做完：Sonnet 看截圖與報告，沒問題就 commit／push 到 `main`（先過 `node --check`、`qa_text`）。
7. **QA**：`tools/qa/serve.sh` 起站後跑 `qa_page.cjs`、`qa_text.cjs`、`smoke.cjs`；因為這三支只跑每個分頁第一個觀察，要照第 6 課動物的做法寫 wrapper（放 scratchpad），逐分頁、逐觀察、中英都跑：1 秒像素差、字壓字、字型載入、控制項高度。
8. **換掉正式頁**：三課各自，所有動畫都上線（或 P3 決定砍掉、改成不顯示）後，老師看過再換。
9. **`PROGRESS.md`**：每課做完更新那一段。

---

## 7. 待老師決定／待老師看

**開工前（影響很大）**
1. **三課新標題**是否採用（§1.5 提案）：會連動首頁卡片、章節導覽、頁籤名稱；不想改就維持舊標題，分頁鉤子不受影響。
2. **第 3 課第 5 個分頁「整合」**（`casefile`）要不要做：這是新增分頁，沒有舊版對應，整個是 P3。
3. **第 1 課動畫主角用瓢蟲取代斯文豪氏赤蛙**（課本蛙照片仍在「照片」檢視）：原因是 AI 容易畫錯赤蛙的種類特徵，瓢蟲斑紋變化大、也真的是同種差異很大的例子。
4. **原住民族相關內容**：第 3 課分頁 4 不用 AI 生成任何族人、祭典、船、器物，只用課本原照；AI 只畫自然物（飛魚、天然素材）。如果老師手邊有已取得授權的照片，可以補進 `clues`。
5. **課本原照的授權**：目前仍是「原圖作者及個別授權未確認」，維持現狀（保留在「照片」檢視）。第九定律之二要求逐張確認；是否之後另案換成 CC0／公共領域的真實照片，請老師決定。

**做完一批再問（YELLOW，科學內容）**
- 臺灣物種的 AI 插圖是否畫對特徵：石虎、藍腹鷴、臺灣藍鵲、山羌、臺灣獼猴、苦花、河烏、櫻花鉤吻鮭、綠蠵龜、日本鰻鱺、吻鰕虎（生出來後老師看；錯的重生）。
- `conc`：用「小魚濃度比大魚高」的教學數字說明「總量≠濃度」，會不會讓學生誤以為小魚一定比大魚毒？已在畫面標「教學數字，不是真實測量」，請老師看措辭。
- `shift`：溫度、高度、升溫幅度一律不寫數字；三段「假設升溫」只是移動量。
- `timing`、`response` 都是概念示意（不預測任何物種）；`harvest` 的「適量取走」不是安全比例。
- `turtle` 的「常回到出生地附近」是否保留；`season` 的「不當成現在的時間表，也不是捕撈許可」措辭。
- 各動畫 Opus 自己多加的標籤與句子：照慣例逐條列出，由老師確認。

**已知風險**
- 編輯圖（TH8、TH14b、CV5b）若 Antigravity 無法做圖像編輯，構圖不一致會讓淡入淡出時跳動；備案是用同一場景重新生，之後程式再對位。
- 俯視森林／農地（TH1a、TH1b）是紋理圖，AI 容易出現「看起來像放大的地毯」的重複圖樣；如果邊緣不均勻，Sonnet 會用程式裁中間。
- 37 個動畫總量大，Opus 額度可能中途撞到上限；沿用「做多少推多少」，P3 最先砍。

---

## 8. 給動畫代理的共同規則（Opus 讀這一段＋自己那一個動畫的段落，不用讀整份 AGENTS.md／PROGRESS.md）

**你要交的東西**：一個檔案 `assets/biology/environment_draw_<name>_1024_v1.js`，內容 `(()=>{...window.EnvironmentDraw.<name>=(c,s,t)=>{...}})()`。不要改別的檔案（主程式、kit、HTML 都不要動；需要新標籤、新控制項或新文字，回報給主對話）。**不跑 git。**
**範本**：簡報會指定一個現成動畫（建議 `ecology_draw_chase_1024_v1.js` 或 `ecology_draw_pyramid_1023_v1.js`），學它的結構：`const K=window.EnvironmentKit`（包住 `EcologyKit`）、`K.stageClock(s,t,n,per)`、`K.place／K.at／K.drawIn／K.pill／K.arrow／K.wrap／K.text／K.marker`，轉場用淡入淡出。步驟文字、`LAB` 標籤與選項在對應的主程式（只讀你那個視圖的區塊與 `LAB`）。
**畫布**：960×600、背景 `#11261f`（外殼已填）、面板 `#16332b`／`#1c3d34`、禁純黑；粉筆色 白 `#f2ecd9`、黃 `#fde047`、青 `#55e9ff`、綠 `#4ade80`、橘 `#fb923c`、粉 `#f472b6`。**本單元顏色語意見 §1.4，同一個概念全單元同色，且一定連名字一起寫。**
**字**：畫布文字用 `K.text`／`K.wrap`／`K.pill`，**不小於 22px**；寫在色塊／膠囊裡的字先用 `K.measure` 量寬度，塞不下就換行或縮短文字，**不要縮到小於 22px**；中英文都要排得下（英文不能靠縮字塞進去）。每種東西都要有名字（用 `K.LAB`）。
**圖**：用 `K.place`／`K.at`；圖上標籤位置用 Python／PIL 量一次，寫進常數，不要靠截圖試誤。局部放大：全景只負責「在哪裡」，放大區是主角。貼上黑板底色後，邊緣不可有亮邊、灰框，放大看一次。同一構造的前後對照（TH8↔HB5、TH14a↔TH14b、CV5a↔CV5b）要用相同構圖，轉場用淡入淡出。
**動**：每個步驟停住 1 秒畫布都要有像素變化（呼吸、脈衝、緩慢移動、流動亮點）；`s.phase<0` 連續播放（每步 `per` 秒），`s.phase>=0` 停在該步（也要有微小動態）。**每一幀設 `s.shown=k`。** 選項（`s.warm`、`s.action` 等）切換時畫面立刻對應。
**科學與文字**：不放課本頁碼、圖號、出版社、年數；AI 插圖標 `LAB.aiNote` 或 `LAB.schematic`；**不給沒有依據的數字**（所有數字標「示意」或「教學數字」）；不替任何物種預測存活；不提供飲食、醫療、飲水判斷；不教學生採集汙染水樣、捕殺或野放外來種。
**檢查（你自己跑，不要貼整份程式碼回報）**：①`node --check`；②本機伺服器 `http://127.0.0.1:8765/`（沒有就 `tools/qa/serve.sh`，`OUT_DIR=/tmp/claude-0/qa-out`）；用 Playwright（`tools/qa/lib.cjs`）開對應的預覽頁，用 `LivingBook.setTab(i)`、`LivingBook.action('phase',k)`、`LivingBook.action('warm'|'action',v)` 逐一切換（先讀 `qa_page.cjs` 看怎麼進入頁面）；③每步驟×每選項×中英文各截一張，看字有沒有壓到圖、壓到字、超出畫布；④間隔 1 秒像素差都大於 0；⑤`node tools/qa/qa_text.cjs <預覽頁>`；⑥畫布上每一行字拿掉會變（沒有連續 4px 以上看不到的字）；⑦測試瀏覽器已載到 JetBrains Mono 與 Noto Sans TC。**預覽頁要先把你的 script 加進 `<script>`（在主程式之前）**；這是唯一可以改的 HTML 行。
**回報只要**：檔案是否完成；各步驟的轉場與互動一行說明；檢查結果（①～⑦各通過與否）；已知問題；**你自己多加的標籤與句子（逐條列出，給老師確認）**；需要主對話改的地方。

---

## 9. 進度

- [x] 讀 `AGENTS.md`、`PROGRESS.md`、三課現況，寫這份計畫（2026-10-24）
- [ ] 老師看過計畫、回覆 §7
- [ ] Antigravity 生圖（§5）、圖片處理與入庫（第 1 課 BD 系列已全部到齊並入庫；第 2、3 課未開始）
- [ ] `environment_kit_1024_v1.js`（已做）、三個主程式與預覽頁（第 1 課已做，第 2、3 課未做）、`stub`（已做）
- 第 1 課動畫：[x] count　[x] composition　[x] worth　[x] frogs　[ ] response　[ ] mosaic　[ ] residents　[ ] uses　[ ] green　[ ] boundary
- 第 2 課動畫：[ ] conc　[ ] judge　[ ] edge　[ ] fragment　[ ] harvest　[ ] pathway　[ ] stages　[ ] sources　[ ] chain　[ ] bioacc　[ ] magnify　[ ] shift　[ ] coral　[ ] timing
- 第 3 課動畫：[ ] assess　[ ] track　[ ] clues　[ ] casefile　[ ] turtle　[ ] toolbox　[ ] fishway　[ ] corridor　[ ] monitor　[ ] tradeoff　[ ] season　[ ] citizen　[ ] materials
- [ ] QA（`qa_page`、`qa_text`、`smoke`）、換掉三個正式頁、首頁卡片與封面、`PROGRESS.md`、commit／push
