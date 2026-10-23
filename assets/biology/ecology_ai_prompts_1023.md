# 生物圈與生態關係：單元規畫與 Gemini 插圖咒語（2026-10-23）

> 這份檔案同時是「單元計畫」和「Gemini 咒語本」。
> 給多個 Claude 協作用：每個 Claude 只讀自己那一段（見第八節），不用整份都讀。
> 格式沿用「地球上的生物」六課的咒語本（編號、必要／可選、白底／灰底、檢查）。
> 備註：我沒有看到 `plants_diversity_plan_1022.md`，格式是依咒語本、`AGENTS.md`、`PROGRESS.md` 推的；若兩份規畫格式要完全一致，把那份給我，我再對齊。

---

## 一、先講結論

- **5 個必要分頁＋1 個可選分頁**，約 **13 張必要圖＋5 張可選圖**（地球上的生物六課是 51 張必要，這課少很多）。
- 食物網用到的 12 種生物，**分成 4 張「同一批」的圖**（生產者、初級、次級、高級消費者），同一批風格一致、去背後在程式裡重複使用。
- 第四、五、六課已生好的圖**盡量重用**（蜘蛛、蝸牛、蜻蜓、蕈類、菌絲、細菌），不重生。
- 流動、循環、金字塔、層級放大，**全部用程式畫**，不生圖。
- 第一單元已有的生物圈動畫**不重複**（見第二節）。

---

## 二、第一單元已經有的，這一課不做

我讀了 `biology_intro.html` 與 `biosphere_cinema_1011_v1.js`。第一單元的第四分頁「地球那麼大，生命住哪？」已經做了：

| 第一單元已有 | 內容 | 這一課怎麼處理 |
|---|---|---|
| 生物圈電影（四鏡頭） | 草履蟲顯微照 → 綠頭鴨與濕地 → 上下各約 10 km 的薄層（厚度放大 4 倍）→ 蘋果比喻（約 0.16 mm）、可拖曳的立體地球 | **不重做**。不再講厚度、範圍、蘋果比喻 |
| 探測點滑桿 | 海平面 ±10,000 m | **不重做** |
| 生存四條件 | 陽光、空氣、水、養分＋池塘圖 `life_habitat_v1.jpg` | 不再介紹四條件，也**不再用池塘圖當主角**。改問「條件不同，誰住哪裡？」（分頁一）和「養分從哪來、怎麼回來？」（分頁四） |
| 五個生命現象 | 代謝、生長、感應、生殖、運動 | 不重做 |
| 素材 | 草履蟲、綠頭鴨照片 | 這課**封面與插圖不用鴨、不用池塘**，避免學生覺得又看到同一張 |

**怎麼接起來（給 Hook 用）：** 第一單元結尾是「生命只住在地球薄薄的一層」。這一課從「這一層裡，生物怎麼互相牽連」開始。第一單元只說「陽光、養分是生存條件」；這一課回答「養分（碳）不會用完，是因為在生物之間繞圈」。

---

## 三、單元大綱

單元名稱：**生物圈與生態關係**（照老師指定）。學生看得到的標題不寫章節編號、不寫課本頁碼（AGENTS 第八定律）。

| # | 分頁（Hook 標題／副標題） | 核心問題 | 狀態 |
|---|---|---|---|
| 1 | 同一座山，為什麼住的不一樣？／環境因子與生態系的層級 | 環境因子（非生物、生物）決定誰住哪；個體 → 族群 → 群集 → 生態系 | 必要 |
| 2 | 誰吃誰？少了一個會怎樣？／食物鏈與食物網 | 生產者、消費者、分解者；箭頭方向；移走一種會連鎖影響 | 必要 |
| 3 | 能量跑到哪裡去了？／能量的單向流動 | 沿食物鏈往上，能量越來越少，所以食物鏈很少超過五層 | 必要 |
| 4 | 葉子掉下去，碳去哪了？／物質的循環 | 碳在生物與空氣之間繞圈；能量單向、物質循環 | 必要 |
| 5 | 同住一處，是敵是友？／生物之間的關係 | 捕食、競爭、互利共生、片利共生、寄生 | 必要 |
| 6 | 一種螺，怎麼讓稻田變樣？／外來種與人類活動 | 外來種、生物放大、保育 | **可選，待老師決定** |

### 待老師確認的範圍（我沒看到課本）

這份大綱是依一般國中生態單元推的，不是依翰林課文。請老師刪改：

1. **能量只剩約 10%**：寫成「約」「常用的估計」，實際常見 5～20%，放在補充。要不要放？
2. **蚯蚓算不算分解者**：不同版本寫法不同。我預設「分解者＝細菌與真菌（蕈類）」，蚯蚓放在「腐食動物，幫忙拆碎」。
3. **麻雀是雜食**（吃種子也吃昆蟲）：我故意放進食物網，讓學生看到「一種生物可以在不同位置」。若課本只教直線食物鏈，可拿掉。
4. **附生植物、鮣魚當片利共生**：這是課本常見例子，但實際關係不一定完全單向，頁面標「常見的例子」。
5. **寄生蜂寄生毛蟲**：嚴格說是「擬寄生」，國中通常歸在寄生。頁面不講「擬寄生」。
6. **氮循環要不要**：預設只教碳循環；氮循環放不放補充？
7. **生態系類型**（森林、草原、沙漠、海洋、臺灣的生態系）：這份**沒有**排。若課綱要教，要另開一個分頁，或放在別課。
8. **第六分頁**（外來種、生物放大、保育）要不要？不要的話，EC13～EC16 都不用生。

---

## 四、每個分頁怎麼做（程式畫的部分）

> 所有互動一律**選擇題或離散選項**（老師 10-21 指示：不出開放式問題；AGENTS 8.1：可數的段數勝過滑桿）。
> 畫面上**每一種東西都要有名字**（PROGRESS 10-21：沒有名字的線條學生會當成沒擦乾淨）。
> 每個畫布動畫要實測「間隔 1 秒有像素變化」（AGENTS 10.3）；按鈕觸發型要先觸發再量。
> 畫布的字都要用 `fitText`、不得小於 22px；圖上小標籤另外量 PNG 位置，一次量好。

### 分頁 1：同一座山，為什麼住的不一樣？

**Hook 草稿：** 「同一座山坡，向陽的那面是成片的芒草，背陰潮濕的那面卻是蕨類和苔蘚。第一單元我們知道生命需要陽光、水，那為什麼不同的地方，住的生物不一樣？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 1a 兩塊土壤切面 | 離散切換「向陽乾燥／背陰潮濕」。切換時，光、水分、溫度的**多／少**用箭頭粗細表示（不寫數字、不畫太陽圖示以外的溫度計），兩邊的植物不同。 | EC1 |
| 1b 因子分類 | 6 張線索卡：光線、水分、溫度、土壤、天敵、競爭者。每張選「非生物因子／生物因子」，答對顯示原因。 | 無（文字卡） |
| 1c 層級放大 | 離散 4 段：個體（一隻麻雀）→ 族群（同種的一群，8 隻）→ 群集（草地上所有的生物）→ 生態系（加上土、水、光）。每段從上一段「拉遠」，用淡入切換。 | EC2（全景）、EC3～EC6 的去背圖 |

重點提醒：
- 分頁 1 的「非生物因子」**不要再把陽光、空氣、水、養分各講一遍**（第一單元講過）。這裡的重點是「差異」：同一類因子在不同地方大小不同。
- 層級放大要符合「小構造要局部放大」（AGENTS 第九定律之二）：放大後的那一層是主角，輔助圖縮成小的。

### 分頁 2：誰吃誰？少了一個會怎樣？

**Hook 草稿：** 「田裡的蚱蜢吃稻葉，青蛙吃蚱蜢，蛇吃青蛙，老鷹吃蛇。如果青蛙突然全部不見了，稻田會變成什麼樣子？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 2a 三種角色 | 生產者／消費者／分解者。每種配圖，選擇題辨認 8 種生物各是哪一種。 | EC3～EC6、重用蕈類（第四課 FU4）、細菌（第三課 MB1） |
| 2b 箭頭方向 | 先選擇「吃」與「被吃」的箭頭怎麼畫：**箭頭從被吃的指向吃的（表示能量流向）**。這是學生最常搞反的地方。 | 同上 |
| 2c 建立食物網 | 離散步驟：從一條直線鏈 → 加入麻雀、蜘蛛、螳螂等，變成網。標出「麻雀同時吃種子與昆蟲」。 | 同上，重用蜘蛛（第二課 TX6b）、蝸牛（TX6b）、蜻蜓（TX6a） |
| 2d 移走一種 | 4 個選項：移走青蛙／蛇／蚱蜢／稻。選一個後，顯示連鎖：上游增加、下游減少。**只示意方向，不給數字**。 | 同上 |

### 分頁 3：能量跑到哪裡去了？

**Hook 草稿：** 「一隻大冠鷲要吃很多隻蛇才夠，蛇又要吃很多隻青蛙。為什麼食物鏈很少超過五、六層？能量是被吃掉了，還是消失了？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 3a 能量往上傳 | 陽光 → 稻 → 蚱蜢 → 青蛙 → 蛇（5 段）。每上一層，能量條只剩約 1/10。損失去向各有標籤：**呼吸作用（變成熱散失）、排遺、沒被吃到的部分**。 | EC3～EC6 |
| 3b 能量金字塔 | 與「數量金字塔」並排，選擇題：為什麼最上層最少？ | 同上 |
| 3c（補充）生物放大 | 水蚤 → 米蝦 → 鯽魚 → 大口黑鱸，某種「不易分解的污染物」濃度逐層升高（只畫顏色深淺，**不寫實際濃度數字**）。 | EC14a、EC14b（可選） |

重點提醒：
- 「約 10%」寫成「約」，頁面註明「常用的估計值，不是固定值」。
- 能量用**黃**、熱用**橘**（見第六節顏色）。

### 分頁 4：葉子掉下去，碳去哪了？

**Hook 草稿：** 「第一單元說生命需要養分。可是一棵樹每年掉那麼多葉子，土地沒有被葉子埋起來。葉子去哪了？你呼出的二氧化碳，又會到哪裡去？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 4a 落葉去哪了 | 離散 4 階段：完整落葉 → 有斑點與破洞 → 只剩葉脈 → 變成腐植質。每階段標出是誰在作用（真菌、細菌；蚯蚓、昆蟲幫忙拆碎）。 | EC7 |
| 4b 碳的旅行 | 一個碳原子的路徑（程式畫）：空氣中的二氧化碳 → 光合作用進入樹 → 被蚱蜢吃 → 被青蛙吃 → 呼吸作用放回空氣；另一條：樹死亡 → 分解者 → 放回空氣。每個箭頭標「哪個作用」。 | EC8（大樹）、EC3～EC6 |
| 4c 能量 vs 物質 | 左右對照：能量從陽光進來，最後變成熱散失（**單向**）；碳在生物與空氣之間**繞圈**。選擇題：「下面哪一個是循環、哪一個是單向？」 | 程式畫 |
| 4d（補充）化石燃料 | 簡單一格：燃燒煤、石油，把很久以前的碳放回空氣。**不重講氣候變遷**（地科「全球氣候變遷」已有），只連結過去。 | 程式畫（不生圖） |

### 分頁 5：同住一處，是敵是友？

**Hook 草稿：** 「小丑魚躲在海葵的觸手裡，敵人不敢靠近，海葵也沒有吃掉牠。這兩種生物，是誰佔了誰的便宜？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 5a 五種關係 | 五張卡，每張一張圖＋「雙方得失」符號表：捕食（＋／−）、競爭（−／−）、互利共生（＋／＋）、片利共生（＋／0）、寄生（＋／−）。 | EC9～EC12，捕食用 EC13（可選）或重用 EC4、EC5 的去背圖 |
| 5b 分辨「寄生」與「捕食」 | 都是一方得、一方失，差在哪？選擇題。 | 無 |
| 5c 判斷 10 個情境 | 選擇題 10 題，每題一個生活情境，選 5 種關係之一。 | 無 |

重點提醒：
- 符號表的「＋／−／0」在畫面上要有圖例，**不只用顏色區分**。
- 互利共生要舉**兩個**不同例子（海葵與小丑魚、豆科與根瘤菌），讓學生知道不限於動物。

### 分頁 6（可選）：一種螺，怎麼讓稻田變樣？

**Hook 草稿：** 「稻田裡的福壽螺是從南美洲引進的，現在稻農最頭痛的就是牠。是什麼讓一種外來的生物，在新地方長得特別好？」

| 小段 | 內容 | 用到的圖 |
|---|---|---|
| 6a 外來種 | 福壽螺與本土田螺的比較；為什麼外來種容易過多（沒有天敵、食量大、繁殖快）。 | EC15 |
| 6b 生物放大 | 若 3c 沒放在分頁 3，就放這裡。 | EC14a、EC14b |
| 6c 保育 | 臺灣的例子：黑面琵鷺（棲地保護）。**只講一個例子、一個重點**。 | EC16 |

---

## 五、要生哪些圖（總表）

底色說明（沿用咒語本）：**白底**給有顏色的物體；**灰底（#808080）**給白色或半透明的東西；**全幅場景**不用去背、直接用。

| 編號 | 畫面 | 必要？ | 底色 | 用在哪 |
|---|---|---|---|---|
| EC0 | 封面：清晨的溪流與翠鳥 | 必要 | 全幅場景 | 單元封面 |
| EC1 | 向陽乾燥／背陰潮濕兩塊土壤切面 | 必要 | 白底 | 分頁 1 |
| EC2 | 草地生態系全景 | 必要 | 全幅場景 | 分頁 1 層級放大 |
| EC3 | 生產者：水稻、芒草、狗尾草 | 必要 | 白底 | 分頁 1、2、3、4 |
| EC4 | 初級消費者：蚱蜢、菜粉蝶幼蟲、田鼷鼠 | 必要 | 白底 | 分頁 1、2、3 |
| EC5 | 次級消費者：螳螂、澤蛙、麻雀 | 必要 | 白底 | 分頁 1、2、3 |
| EC6 | 高階消費者：黑眉錦蛇、大冠鷲、領角鴞 | 必要 | 白底 | 分頁 1、2、3 |
| EC7 | 落葉分解四階段 | 必要 | 白底 | 分頁 4 |
| EC8 | 一棵大樹（樟樹） | 必要 | 白底 | 分頁 4 |
| EC9 | 競爭：獨角仙與鍬形蟲搶樹液 | 必要 | 白底 | 分頁 5 |
| EC10 | 互利共生：小丑魚與海葵；豆科根瘤 | 必要 | 白底 | 分頁 5 |
| EC11 | 片利共生：樹幹上的鳥巢蕨；鮣魚與鯊魚 | 必要 | 白底 | 分頁 5 |
| EC12 | 寄生：菟絲子；被寄生蜂繭附著的毛蟲 | 必要 | 白底 | 分頁 5 |
| EC13 | 捕食：螳螂抓蚱蜢 | 可選 | 白底 | 分頁 5（也可用 EC4、EC5 的去背圖拼） |
| EC14a | 水蚤與米蝦 | 可選 | 灰底 | 分頁 3c／6b |
| EC14b | 鯽魚與大口黑鱸 | 可選 | 白底 | 分頁 3c／6b |
| EC15 | 福壽螺、粉紅卵塊、本土田螺 | 可選 | 白底 | 分頁 6 |
| EC16 | 黑面琵鷺 | 可選 | 灰底 | 分頁 6 |

**共 18 段咒語：必要 13 段、可選 5 段。**

### 建議生圖順序

1. **EC0 ＋ EC3～EC6**（封面與食物網那一批）：這批最先被用到，分頁 1、2、3 的動畫都要等它。
2. **EC1、EC2**：分頁 1。
3. **EC7、EC8**：分頁 4。
4. **EC9～EC12**：分頁 5。
5. 可選的最後再說。

### 重用已經生好的圖（不用重生）

路徑以各課的 `sources.md` 為準。

| 要用的生物 | 來源 | 用在 |
|---|---|---|
| 蜘蛛、蝸牛 | 第二課 TX6b（`naming_ai_1021/`） | 食物網的次級消費者（蜘蛛）與初級消費者（蝸牛） |
| 蜻蜓 | 第二課 TX6a | 食物網的次級消費者 |
| 蘑菇、菌絲 | 第四課 FU4、FU1 | 分解者 |
| 細菌 | 第三課 MB1 | 分解者 |
| 鳥巢蕨（整株） | 第五課 PL2 | 分頁 2 的生產者例子之一（可選）；分頁 5 的片利共生用新圖 EC11（附生在樹上） |

**注意：** 第六課「動物」還沒做。青蛙（AN5）、蚯蚓（AN2）、小白鷺（AN7）都還沒有。這課 EC5 的澤蛙是新圖；之後做第六課時，**不要把同一隻蛙再生一次**，先看這課的 EC5。

---

## 六、顏色與符號（全站同一概念同一顏色）

AGENTS 1.1：同一個概念在所有單元必須同色。這一課新出現的概念：

| 概念 | 建議色 | 說明 |
|---|---|---|
| 能量（陽光、食物裡的能量） | 黃 `#fde047` | 沿用黑板粉筆黃 |
| 熱（呼吸散失的能量） | 橘 `#fb923c` | 同上 |
| 碳／物質 | 青 `#55e9ff` | 碳原子的旅行路徑 |
| 食物箭頭（吃與被吃） | 白 `#f2ecd9` | 箭頭從被吃的指向吃的 |

**待核對：** 光合作用、呼吸作用的單元（若已做）已經用了什麼顏色代表二氧化碳、氧氣？本課沿用，不另起爐灶。請負責分頁 4 的 Claude 先確認。

---

## 七、Gemini 咒語

### 怎麼用

- 一段咒語生一張圖。整段（含最後的 Style 那幾句）一起貼給 Gemini。
- 生好後貼回對話，跟我說是哪個編號（例如「EC3」）。檔名不用改，我會去背、存檔、記錄。
- 畫面裡不能有任何字。Gemini 若自己加了字、箭頭、標籤或浮水印，請它重生。
- 一張圖裡有好幾個東西的，都寫成「左右分開、中間留空」，我才能切開，分別放進互動。
- 不要把課本照片或別人的圖當參考圖丟給 Gemini（AI 重畫別人的圖不會變成原創）。
- 顯微或剖面類圖是 AI 教學插圖，頁面會註明。

### 生圖後我會檢查什麼

- 腳的數量：昆蟲 6、蜘蛛 8。蚱蜢、螳螂、獨角仙、鍬形蟲都要 6 隻腳。
- 毛蟲看起來要是毛蟲（有身體分節與短腳），不要變成蛆或蟲。
- 同一批裡的生物視覺大小要差不多，我才好排版。
- 不能有人、車、房子、路標、電線。

---

### EC0　封面（必要，全幅場景，不用去背）

用途：單元封面。**不用池塘、不用鴨**（第一單元已經用過）。

檢查：沒有字、人、橋、房子、垃圾。翠鳥要有藍綠色的背、橘色的腹。

```
Cinematic photorealistic wide shot, 16:9 landscape. A clear, shallow stream running through lowland subtropical forest at dawn: smooth mossy boulders in the water, ferns and broad-leaved shrubs along the banks, a common kingfisher (blue-green back, orange belly, long dagger-like bill) perched on a low branch above the water at the right third of the frame in sharp focus, a dragonfly resting on a reed in the foreground, small dark fish shapes visible in the clear water, soft morning mist, shafts of golden light through the trees, dew on the leaves. Shallow depth of field, generous margins on all sides, no people, no buildings, no bridges, no litter.
Absolutely no text, no letters, no numbers, no labels, no logos, no watermark, no signature, no borders.
```

---

### EC1　向陽乾燥／背陰潮濕兩塊土壤切面（必要，白底）

用途：分頁 1「同一座山，為什麼住的不一樣？」：兩種環境，住著不同的植物。

檢查：兩塊**一樣大、同樣的切面構圖**；左邊看起來乾、亮；右邊看起來濕、暗。**不要畫太陽、雲、溫度計的圖示**（光、水分差異我用程式標示）。

```
Landscape 16:9. Two clean rectangular cross-section blocks of hillside soil, exactly the same size and the same side-view composition, with a wide gap between them. LEFT: a sunny, dry slope: pale sandy-brown soil with a thin dry surface layer, a few small pebbles and a couple of fine cracks, one large clump of Chinese silver grass (Miscanthus) with long narrow leaves and a few pale seed plumes, long fine roots visible in the soil, bright warm light on the plants. RIGHT: a shaded, damp slope: dark brown moist humus-rich soil with a thin layer of fallen leaves on top, three ferns with broad arching fronds, a carpet of green moss, a small glistening film of water in a hollow, two small brown mushrooms, soft cool green light on the plants.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC2　草地生態系全景（必要，全幅場景，不用去背）

用途：分頁 1 層級放大：從一隻麻雀拉遠到整個草地生態系。

檢查：**要看得出「同種的一群」（約 8 隻麻雀）**，其他生物各只有一、兩隻；沒有人、車、房子、柵欄、電線。

```
Photorealistic landscape, 16:9. A lowland meadow in Taiwan at mid-morning: tall green grasses and small white and yellow wildflowers, a bare patch of brown soil with a few stones, a small shallow puddle reflecting the sky, an old rotting log with a few mushrooms growing on it, a flock of about eight Eurasian tree sparrows feeding together on the ground at left-centre (clearly all the same species and similar size), a few grasshoppers resting on grass blades, one butterfly on a flower, a dew-covered spider web between two stems. Natural soft daylight, good depth, generous margins on all sides, no people, no vehicles, no buildings, no fences, no wires.
Absolutely no text, no letters, no numbers, no labels, no logos, no watermark, no signature, no borders.
```

---

### EC3　生產者：水稻、芒草、狗尾草（必要，白底）

用途：分頁 1、2、3、4：食物網的生產者。

檢查：三種都是禾本科，葉子細長、葉脈平行；水稻穗下垂，芒草穗銀白，狗尾草穗像小刷子。**每株都要整株，根部帶一小堆土**。

```
Landscape 16:9. Three whole plants, each rooted in a small mound of dark soil, similar visual size, with wide gaps between them. LEFT: a rice plant (Oryza sativa) with several slender green leaves and one drooping panicle of pale green-gold grains. MIDDLE: a clump of Chinese silver grass (Miscanthus) with long arching blade-like leaves and one upright silvery-white feathery plume. RIGHT: a green foxtail (Setaria viridis) with a few narrow leaves and one nodding green bristly spike shaped like a small bottle brush.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC4　初級消費者：蚱蜢、菜粉蝶幼蟲、田鼷鼠（必要，白底）

用途：分頁 1、2、3：吃植物的動物。

檢查：蚱蜢 6 隻腳，後腳粗大；毛蟲是綠色、有短剛毛，在一小片菜葉上，葉緣有被咬的缺口；老鼠雙手抱著一粒稻穀。三隻畫成相近的視覺大小。

```
Landscape 16:9. Three small plant-eating animals, drawn at a similar visual size rather than true relative size, with wide gaps between them. LEFT: a green rice grasshopper (Oxya) in side view, exactly six legs with large folded hind legs for jumping, two short antennae, chewing the end of a thin grass blade. MIDDLE: a cabbage white butterfly caterpillar (Pieris rapae), velvet green with fine short hairs, resting on a small piece of green cabbage leaf that has a few crescent-shaped bite marks along its edge. RIGHT: a small field mouse (Mus caroli) sitting upright, grey-brown fur, pale belly, round ears, a long thin tail, holding a single rice grain in both front paws and nibbling it.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC5　次級消費者：螳螂、澤蛙、麻雀（必要，白底）

用途：分頁 1、2、3：吃動物的動物。**麻雀是雜食**（吃種子也吃昆蟲），分頁 2 會用它說明「一種生物在食物網裡不只一個位置」。

檢查：螳螂 6 隻腳（前面一對是帶刺的捕捉足），三角形的頭；蛙皮膚濕潤，後腳折疊；麻雀頭頂栗褐色、臉頰白色有一個黑點。

```
Landscape 16:9. Three animals in side view, drawn at a similar visual size rather than true relative size, with wide gaps between them. LEFT: a large green praying mantis (Tenodera) standing on a short grass stem, triangular head with two large eyes, exactly six legs: the front pair raised and folded, armed with spines, and four slender walking legs. MIDDLE: a paddy field frog (Fejervarya) sitting upright, olive-brown skin with darker blotches, a pointed snout, bulging eyes, long folded hind legs with partly webbed feet, moist glossy skin. RIGHT: a Eurasian tree sparrow (Passer montanus) perched on a short twig, chestnut-brown crown, white cheek with a single black spot, brown back streaked with black, pale grey-brown belly.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC6　高階消費者：黑眉錦蛇、大冠鷲、領角鴞（必要，白底）

用途：分頁 1、2、3：食物網的上層。

檢查：蛇要有「眼睛後面一道黑紋」；大冠鷲頭後有黑白相間的短冠羽、臉上有黃色裸皮；領角鴞有小小的耳羽、眼睛大而朝前。三隻畫成相近的視覺大小。

```
Landscape 16:9. Three predators, drawn at a similar visual size rather than true relative size, with wide gaps between them. LEFT: a black-browed ratsnake (Elaphe taeniura) coiled loosely with its head raised, slender body olive-grey to yellowish with faint darker stripes, and a dark stripe running from the eye to the back of the head like an eyebrow. MIDDLE: a crested serpent eagle (Spilornis cheela) perched upright in side view, dark brown back, bare yellow skin around the eye and bill base, a short rounded crest of black-and-white feathers on the nape, brown underparts with white spots, strong yellow legs with talons. RIGHT: a collared scops owl (Otus lettia) perched upright facing forward, soft grey-brown streaked plumage, two small ear tufts, large forward-facing eyes, a short tail.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC7　落葉分解四階段（必要，白底）

用途：分頁 4：落葉去哪了？（分解者的作用，物質回到土裡）。

檢查：**四階段是同一種葉子**；第 1 階段完整、第 2 階段有斑點與破洞、第 3 階段只剩葉脈網、第 4 階段是一小堆深褐色碎碎的腐植質。第 2、3 階段可有細細的白色絲（菌絲）。

```
Landscape 16:9. Four stages of one broad-leaved tree leaf decaying on the ground, from left to right, the same leaf outline and the same starting size, with wide gaps between them. 1) A freshly fallen leaf, yellow-green and intact, with all its veins clear. 2) The same kind of leaf, now brown with dark spots, a few small holes along the edges, and faint white thread-like fungal strands on the surface. 3) The same leaf mostly eaten away so that only its pale net of veins (a leaf skeleton) and a few brown scraps remain, with a few fine white threads. 4) A small low heap of dark brown crumbly humus (soil-like crumbs) with one or two tiny fragments of leaf vein in it.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC8　一棵大樹（樟樹）（必要，白底）

用途：分頁 4：碳的旅行的主角（光合作用在哪裡、落葉在哪裡、樹死亡後怎麼辦）。

檢查：整棵樹要在畫面裡；樹冠要完整；根不用畫在土裡（只畫地面上的板根），樹下有一些落葉。

```
Portrait 3:4. A single large camphor tree (Cinnamomum camphora) drawn whole and standing upright: a thick rough-barked trunk with buttress roots visible above ground at the base, a broad rounded crown of glossy leaves in light and dark green, and a scatter of fallen leaves around the base on a small low mound of ground. The whole tree fits within the frame with space around it.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC9　競爭：獨角仙與鍬形蟲搶樹液（必要，白底）

用途：分頁 5：競爭（兩種生物搶同一樣資源）。

檢查：兩隻都是 6 隻腳、抓著樹皮；獨角仙頭上有分叉長角，鍬形蟲有彎曲的大顎；兩隻大小差不多、面對面。

```
Landscape 16:9. A vertical section of tree trunk with rough bark and clean cut edges, with a dark, wet, glistening patch where sap is oozing in the middle. At the sap patch, two different beetles face each other head to head and push against each other: on the left a Japanese rhinoceros beetle (Trypoxylus dichotomus), glossy brown, with a long forked horn on its head; on the right a flat stag beetle (Dorcus), shiny black-brown, with large curved mandibles. Both about the same size, each with exactly six legs gripping the bark.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC10　互利共生：小丑魚與海葵；豆科根瘤（必要，白底）

用途：分頁 5：互利共生，兩個例子（動物與動物、植物與細菌）。根瘤菌的細節（固氮）**只講「根瘤裡住著細菌」**，不深入氮循環。

檢查：小丑魚是橘色、有**三道**白色寬帶；根上有很多圓形的小瘤；被切開的那一顆，裡面是粉紅色。

```
Landscape 16:9. Two scenes side by side, with a wide gap between them. LEFT: a clownfish (Amphiprion ocellaris), bright orange with three broad white bands edged in thin black lines, swimming among the tentacles of a sea anemone with cream tentacles tipped in soft purple, the anemone attached to a small piece of rock. RIGHT: the root system of a young bean plant washed clean of soil, with many small round pale nodules scattered along the roots, and one nodule cut in half and placed beside it, showing a pink interior.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC11　片利共生：樹幹上的鳥巢蕨；鮣魚與鯊魚（必要，白底）

用途：分頁 5：片利共生（一方得益、另一方沒有明顯得失）。頁面標「課本常見的例子」。

檢查：鳥巢蕨要**長在樹幹上、根抓著樹皮**，不是長在土裡；鮣魚的吸盤在**頭頂**（一片扁平、有橫紋的盤），吸附在鯊魚身側。

```
Landscape 16:9. Two scenes side by side, with a wide gap between them. LEFT: a section of vertical tree trunk with rough bark and a few patches of green moss, with a bird's nest fern (Asplenium nidus) growing out of the bark about halfway up, its roots clinging to the bark and no soil, a rosette of broad glossy strap-shaped green leaves forming a nest in the centre. RIGHT: a grey reef shark seen in side view, with a slender remora (sucker-fish) attached to the side of the shark's body by the flat, ridged sucker disc on top of its own head; the remora is about one fifth the length of the shark.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC12　寄生：菟絲子；被寄生蜂繭附著的毛蟲（必要，白底）

用途：分頁 5：寄生（一方得益、另一方受害）。

檢查：菟絲子是**金黃色、沒有葉子的細線**，纏在綠色植物的莖上；毛蟲旁邊要有一小堆淡黃色的小繭；不要畫成噁心的樣子，也不要畫黃蜂本身。

```
Landscape 16:9. Two scenes side by side, with a wide gap between them. LEFT: dodder (Cuscuta), leafless golden-orange thread-like stems twining and coiling around the green stem and leaves of a host plant, with small clusters of tiny white flowers on the dodder. RIGHT: a green cabbage white caterpillar resting still on a small piece of green leaf, with a tight cluster of about ten small pale yellow silk cocoons (of a parasitic wasp) attached right beside it; no wasps shown.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### 以下為可選

### EC13　捕食：螳螂抓蚱蜢（可選，白底）

用途：分頁 5 捕食的動作圖。若不生，用 EC4、EC5 的去背圖並排即可，只是少了「抓住」的動作。

檢查：螳螂 6 隻腳、蚱蜢 6 隻腳；蚱蜢是完整的（不要血腥）。

```
Landscape 16:9. A green praying mantis clinging to a slender green grass stem, gripping a green grasshopper between its folded, spiny front legs, the grasshopper still whole and intact. The mantis has exactly six legs (two front grasping legs and four walking legs) and the grasshopper exactly six legs. Side view, the pair centred.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC14a　水蚤與米蝦（可選，灰底）

用途：分頁 3c／6b 生物放大的前兩層（水中食物鏈）。

檢查：水蚤是半透明的、有一隻大眼睛、兩根大的分枝觸角；米蝦半透明、有長觸角、10 隻腳（含螯與步足可不要求數清）。

```
Landscape 16:9. Two small freshwater animals in side view, with a wide gap between them, drawn at a similar visual size rather than true relative size. LEFT: a water flea (Daphnia), translucent pale amber, with a rounded transparent shell, one large dark compound eye, two large branched swimming antennae and a small visible gut. RIGHT: a small freshwater shrimp (Neocaridina), translucent pale brown with fine speckles, long thin antennae, jointed legs and a fan-shaped tail.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, medium grey background (#808080) with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC14b　鯽魚與大口黑鱸（可選，白底）

用途：生物放大的後兩層。

檢查：鯽魚較小、銀灰帶金黃；大口黑鱸較大、背綠褐色、身側一道深色縱帶、嘴很大。**鱸魚要畫得比鯽魚大**。

```
Landscape 16:9. Two freshwater fish in side view, both facing right, with a wide gap between them. LEFT: a crucian carp (Carassius), silvery-golden-grey, deep oval body, a single long dorsal fin, no barbels. RIGHT: a largemouth bass (Micropterus salmoides), noticeably larger than the carp, green-brown back, pale belly, a dark horizontal stripe along the body, a very large mouth reaching behind the eye.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC15　福壽螺、粉紅卵塊、本土田螺（可選，白底）

用途：分頁 6a 外來種。

檢查：福壽螺殼圓胖、殼口大、淡褐金色；卵塊是**亮粉紅色的小顆粒**附在水面上方的稻莖上；本土田螺較小、殼呈錐形。

```
Landscape 16:9. Three items, with wide gaps between them. LEFT: a golden apple snail (Pomacea canaliculata), a large rounded shell in golden-brown, a wide shell opening, soft body with two tentacles, in side view. MIDDLE: a green rice stem with a cluster of bright pink round eggs laid on it above the water line, a short piece of stem shown. RIGHT: a native Asian field snail (Sinotaia), noticeably smaller than the apple snail, a conical olive-brown shell with several clear spiral whorls.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

### EC16　黑面琵鷺（可選，灰底）

用途：分頁 6c 保育的例子。

檢查：黑色湯匙狀的長嘴；臉黑色；全身白色。

```
Landscape 16:9. Two black-faced spoonbills (Platalea minor), with a wide gap between them. LEFT: a spoonbill standing in side view on long dark legs, pure white plumage, a bare black face, and a long black bill widening into a flat spoon-shaped tip, with a pale yellow-white crest at the back of the head. RIGHT: a second spoonbill in flight seen from the side, both wings fully spread with long white flight feathers visible, neck stretched forward, legs trailing behind.
Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, medium grey background (#808080) with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.
```

---

## 八、多個 Claude 怎麼分工（省 token）

依 AGENTS 13.5：**動畫一次只開一個 Opus；文字、圖片處理、頁面骨架、檢查、git 用 Sonnet；commit 與 push 由主對話做，代理不跑 git。**

### 檔名約定（沿用前幾課）

| 項目 | 檔名 |
|---|---|
| 主頁 | 沿用現有的生態單元檔名（若已存在舊版，**先讀再改**；不存在才新建，例如 `biology_ecology.html`） |
| 主程式 | `ecology_1023_v1.js` |
| 共用工具 | `ecology_kit_1023_v1.js` |
| 動畫模組 | `ecology_draw_<名稱>_1023_v1.js` |
| 圖片資料夾 | `assets/biology/ecology_ai_1023/`（含 `sources.md`） |
| 封面 | `assets/covers/biology_ecology_1023_v1.jpg`（等比例縮成 1672 px 寬 JPEG，不裁切；首頁卡片同步換） |
| 原圖備份 | `local-backups/20261023/ecology_ai_originals/` |

### 工作包（建議順序）

| 包 | 誰 | 做什麼 | 要等什麼 | 要讀哪些規則 |
|---|---|---|---|---|
| P0 | Sonnet | 收到每批圖後去背、去白邊、存檔、寫 `sources.md`、封面縮圖 | 老師貼圖 | 9 之二（圖像紀錄）、2.2（透明 PNG） |
| P1 | Sonnet | 頁面骨架：5 個分頁按鈕、Hook（曉臻 `teaching.png`）、中英雙語、概念收束、選擇題題庫、圖像來源收合區 | 這份規畫、老師確認第三節範圍 | 2.1～2.4、4、5、8、第一單元的 `biology_intro.html`（只看版型與 Hook） |
| P2 | Sonnet | 共用工具 `ecology_kit_1023_v1.js`：載圖、去背圖的錨點、`fitText`、顏色常數、語言切換 | P0 的 EC3～EC6 | 2.3、4.3、1.1（fitText） |
| P3-1 | Opus | 動畫：分頁 1 兩塊土壤切面（1a） | EC1 | 10.1、10.3、10.4 |
| P3-2 | Opus | 動畫：分頁 1 層級放大（1c） | EC2、EC3～EC6 | 同上＋第九定律之二「小構造要局部放大」 |
| P3-3 | Opus | 動畫：分頁 2 食物網（2b～2d） | EC3～EC6、重用的蜘蛛／蝸牛／蜻蜓／蕈類／細菌 | 同上 |
| P3-4 | Opus | 動畫：分頁 3 能量往上傳＋金字塔（3a、3b） | EC3～EC6 | 同上 |
| P3-5 | Opus | 動畫：分頁 4 落葉分解（4a） | EC7 | 同上 |
| P3-6 | Opus | 動畫：分頁 4 碳的旅行＋能量 vs 物質（4b、4c） | EC8、EC3～EC6 | 同上 |
| P3-7 | Opus | 動畫：分頁 5 五種關係卡（5a） | EC9～EC12（、EC13） | 同上 |
| P3-8（可選） | Opus | 動畫：分頁 3c 生物放大、分頁 6 | EC14、EC15、EC16 | 同上 |
| P4 | Sonnet | 檢查：`qa_page`、`qa_text`、`smoke`、中英全狀態截圖、每個畫布 1 秒像素差、`currentTab` 逐一核對、函式存在檢查 | 全部完成 | 10.1～10.5、V5 最後檢查清單 |

**P3 一次只開一個，做完、檢查完、回報完，才開下一個**（第三課五個 Opus 同時開撞到額度上限，反而更貴）。

### 給動畫代理的簡報（模板）

每個 P3 簡報**只放這一個動畫需要的東西**：

```
任務：<分頁與小段名稱>
範本：fossils_draw_feet_1021_v1.js（只讀這一個）
圖片：<檔名、尺寸（用程式量好 PNG 尺寸與錨點）>
每一步的畫面與文字（中英）：<逐步列出>
互動：<選擇題／離散選項，不要滑桿、不要開放式輸入>
顏色：能量黃、熱橘、碳青、食物箭頭白（見第六節）
只讀這些規則：2.3 字體、2.4 防重疊、4.3 Canvas 雙語、9 之二（生物圖像、局部放大）、10.3／10.4／10.5
回報只要：檔案是否完成、轉場與互動、檢查結果、已知問題、需要老師決定的文字。不要貼整份程式碼。
```

### 完成後

- 主對話更新 `PROGRESS.md`（只改表與清單，不往下加長），把「待老師看」的項目列在「待老師決定」。
- 老師確認後 commit 並 push 到 `main`（AGENTS 13.4 已授權）。

---

## 九、進度檢查表

- [ ] 老師確認第三節的範圍（能量 10%、蚯蚓、麻雀、氮循環、生態系類型、第六分頁）
- [ ] EC0、EC3～EC6 生好（食物網那一批）
- [ ] EC1、EC2 生好
- [ ] EC7、EC8 生好
- [ ] EC9～EC12 生好
- [ ] 可選：EC13～EC16（視第六分頁決定）
- [ ] P0 去背與 `sources.md`
- [ ] P1 頁面骨架
- [ ] P2 共用工具
- [ ] P3 動畫逐個完成
- [ ] P4 檢查與截圖
- [ ] 更新 `PROGRESS.md`
- [ ] push 到 `main`

---

## 十、我不確定的地方（請老師看）

- 這份規畫沒有依據翰林課文，分頁範圍是依一般國中生態單元推的（第三節）。
- 第一單元的 `biology_intro.html` 是**簡單版**；我只讀了它的程式與文字，沒有實際操作動畫。若第一單元之後有改版（例如把生物圈電影擴充），本課要再核對一次是否重複。
- 圖中生物的物種（例如田鼷鼠、澤蛙、領角鴞）是我依臺灣常見種挑的，Gemini 畫出來若不像，不一定是錯，**只要科學特徵對、頁面標「示意」就好**；但請老師看過是否為學生熟悉的種類。
- 「約 10%」、「0.16 mm」這類數字：本課只用「約 10%」。第一單元的蘋果數字**不再重複**。
- 所有圖都是 AI 教學插圖，不是實拍；頁面要依 AGENTS 第九定律之二標示「AI 插圖／教學示意」，並保留咒語記錄。

---

## 補充：演替分頁的 5 個階段圖（SU1～SU4，2026-10-23）

演替動畫的起點（保留土壤的裸地、沒有土壤的裸岩）與階段（先鋒、草本、灌木、林木）。同一組「切面方塊」風格（和 EC1 一致），方塊一樣大、土層逐漸變厚。白底、無字。生好貼回，說編號（SU1～SU4）。

共同尾巴（每段都要）：
`Style: detailed scientific illustration in a clean, semi-realistic hand-painted style like a modern biology textbook, soft even lighting, accurate anatomy and natural colours. Isolated on a plain, flat, pure white background with no shadow and no scenery. Generous empty margin around and between the subjects. Absolutely no text, no letters, no numbers, no labels, no arrows, no logos, no watermark, no signature, no border.`

### SU1 起點：裸岩／保留土壤的裸地
```
Landscape 16:9. Two clean rectangular cross-section blocks of ground, exactly the same size and the same side-view composition, with a wide gap between them. LEFT: bare rock with no soil: a solid block of grey fractured bedrock with rough weathered surface, a few small cracks, nothing growing on it at all. RIGHT: bare ground that has kept its soil: a block with a flat bare surface of brown mineral soil about one quarter of the block height, with a few tiny seeds and fine pale roots visible inside the soil, a few small pebbles on top, no plants growing above the surface, and the rock below the soil.
(then the common Style paragraph)
```

### SU2 先鋒：地衣與苔蘚／先長出的小草
```
Landscape 16:9. Two clean rectangular cross-section blocks, exactly the same size and the same side-view composition as a bare-rock block and a bare-soil block, with a wide gap between them. LEFT: grey bedrock block whose top surface is covered with patches of crustose lichen (grey-green, pale orange and yellow, flat and crusty) and a few small cushions of green moss, with a very thin dark layer of new soil in the cracks, no other plants. RIGHT: soil block with a surface that shows several small green seedlings and short thin grass blades, scattered, each only a few centimetres tall, soil layer about one quarter of the block height, fine roots visible in the soil.
(then the common Style paragraph)
```

### SU3 草本變多／灌木進來
```
Landscape 16:9. Two clean rectangular cross-section blocks, exactly the same size and the same side-view composition, with a wide gap between them. LEFT: a block of dense herbaceous vegetation: many grasses (foxtail, silver grass) and a few small yellow and white wildflowers covering the surface, a thicker layer of dark brown topsoil about one third of the block height, a mat of fine roots in the soil, a little leaf litter on top. RIGHT: a shrub stage: two or three young shrubs about knee to waist height (Mallotus japonicus with broad rounded leaves) standing among clumps of grass, topsoil about one third of the block height and dark with some fallen leaves, roots of the shrubs visible in the soil.
(then the common Style paragraph)
```

### SU4 林木長成
```
Landscape 16:9. One clean rectangular cross-section block in the same size and side-view composition as the others, centred. A young woodland: two or three young broadleaf trees (camphor trees, Cinnamomum camphora) with clear trunks and rounded crowns that reach above the block, shade-loving ferns and a carpet of moss on the ground below them, a deep layer of dark humus-rich soil about two fifths of the block height with a layer of fallen leaves on top, tree roots visible in the soil.
(then the common Style paragraph)
```

### 生圖後我會檢查
- 同一張裡兩塊方塊一樣大、構圖一致；土層厚度由 SU1（薄）到 SU4（最厚）逐漸增加。
- 沒有人、動物、房子、路標；SU1 左邊的裸岩上**不能**有任何植物，SU1 右邊地面上**不能**有植物。
- 地衣是貼在岩面上的扁平色塊，不要畫成花或菇。
