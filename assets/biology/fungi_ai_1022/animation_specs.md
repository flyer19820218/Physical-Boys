# 真菌（第四課）動畫規格（給 Opus，一次一個檔；2026-10-22）

主程式：`assets/biology/fungi_1022_v1.js`（文字、步驟、選擇題在那裡）；共用工具：`assets/biology/fungi_kit_1022_v1.js`（`window.FungiKit`，**不要改**；需要新工具寫在自己的檔案裡）；圖與座標：`assets/biology/fungi_ai_1022/`（`sources.md`、`measurements.json`、`sizes.json`）。現在每個動畫檔都是「施工中」空殼，**整檔重寫**，檔名與註冊名稱不要改。空殼檔頭有說明。

## 共同規則（每一節都適用，不再重複）

- **畫布 960×600**（shell 固定），安全區 x 20～940、y 20～580。繪圖函式簽名 `draw(c, s, t)`，註冊 `window.FungiDraw.<名稱> = draw`（照 `microorganisms_draw_nucleus_1021_v1.js` 的寫法：`const K = window.FungiKit, {P, C, D, text, wrap, pill, arrow, line, circle, stageClock, fade, ease, mix, clamp, drawIn, place, at, fitRect, SIZE, marker, glow, dashed, panel, measure, splitLines, rgba} = K;`，檔尾 `window.FungiDraw.xxx = draw;`）。**必須在 `draw` 裡設 `s.shown = k`**（k 來自 `stageClock(s, t, N, PER)`），頁面說明文字靠它換。`s.phase >= 0` 時停在該步；`< 0` 時連續播放。
- 用 `D.hit(x, y, w, h, 'phase', i)` 讓畫面上的步驟標記可以點（範本：`fossils_draw_horses_1021_v1.js` 約第 154 行）。
- 圖片用 `K.drawIn / place / at`，檔名照下表（`bt:` 開頭＝`biotech_ai_1021/` 的圖）。**每個構造的位置請用 `assets/biology/fungi_ai_1022/measurements.json` 的座標（PNG 像素）乘縮放比例**，不要靠截圖試誤。
- 字體：畫布上所有文字 **22px 以上**（圓形編號 20px 例外）；用 `K.text/wrap/pill`；寫在色塊／圓角標籤裡的字先用 `measure` 量過。**不得字壓字、字壓圖**：位置 → 換行 → 縮短文字，最後才微幅縮字；中文與英文各自重新排版（長英文不套中文座標）。切換語言後要重畫。
- 顏色語意（本課固定）：**菌絲／菌絲網 奶白 `#f2ecd9`**；**孢子、孢子囊 灰黑（圖本身的顏色）**；**大分子 橘 `#fb923c`**、**小分子／糖 黃 `#fde047`**、**酵素 青 `#55e9ff`**、**二氧化碳 粉紅（用 `D.co2` 的樣式，和生物技術課一致）**；對 ✓ 綠 `#4ade80`、錯 ✗ 橘 `#fb923c`；重點框黃 `#fde047`。畫面上每一種東西都要有名字（沒有名字的線條學生會當成沒擦乾淨）。不得出現純黑 `#000`，深色用 `#0b1a15`／`#11261f`。
- 動畫要一直在動（閒置也動）；步驟轉場用淡入淡出或緩動，不要跳格。切步時舊東西淡出。
- 所有圖都是 AI 教學插圖，畫面角落（或說明文字）要有「示意」意識：**大小與數量只是示意**，不得寫成真實比例或數據。
- 轉場、互動、每個步驟各看中英兩輪截圖即可；先用 `tools/qa/qa_text.cjs` 擋字壓字。範本：`assets/biology/microorganisms_draw_nucleus_1021_v1.js`（圖＋標籤＋放大圈＋淡入淡出）、`microorganisms_draw_compare_1021_v1.js`（比較表）。

---

## 1. `fungi_draw_hyphae_1022_v1.js`（註冊名 `hyphae`）

- 屬於：分頁 1「先分解，再吸收」→ 觀察「菌絲的外形」（`s.view = 0`）。N = 4 步（`stageClock(s, t, 4, PER≈7)`）。
- 圖：`hyphae_a.png`（1008×1129）、`hyphae_b.png`（998×1134）。座標（PNG 像素）：游離端 `free_tips_x_y_openfrac`（a 24 個、b 20 個，其中 a 的 (578,16) 最上端、(13,410) 最左端、(458,1062) 底端）、分枝（Y 形）`y_forks_x_y_angle`（a 12 個，例如 (333,257)、(749,275)、(395,390)、(791,456)）、橫隔 `septa_checked_by_eye_x_y`（a：(570,84)、(526,173)、(486,243)、(608,253)、(549,282)、(645,230)、(708,276)；b 只有候選）。菌絲直徑約 24～30 px（所以縮放後仍要放大看才看得出橫隔；步驟 2 做一個放大圈把某一段放大 2.5 倍以上，圈裡的橫隔畫得夠清楚）。
- 版面建議：兩團並排各縮約 0.36～0.42（高 ≤ 470），中間留標籤區；或一團放大、另一團縮小當對照。要放大的小構造（橫隔、尖端）用放大圈（第九定律之二：局部放大）。
- 步驟（中英逐字，和主程式一致；標題與說明會顯示在頁面下方說明欄，畫布上只放短標籤）：

| # | 按鈕（中／英） | 標題（中／英） | 說明（中／英，逐字） |
|---|---|---|---|
| 1 | 細長的管 / Thin tubes | 一根一根的細管<br>Thin tubes, one by one | 許多真菌（例如黴菌和蕈類）的身體，是由一根根細長的管子組成的，這種管子叫菌絲。菌絲很細，要用顯微鏡才看得清楚。酵母菌是單細胞，沒有菌絲。圖是 AI 教學插圖，不是顯微照片。<br>The body of many fungi, such as moulds and mushrooms, is made of long thin tubes called hyphae. Hyphae are so thin that a microscope is needed to see them clearly. Yeast is single-celled and has no hyphae. The picture is an AI teaching illustration, not a micrograph. |
| 2 | 分枝與橫隔 / Branches and cross-walls | 分枝，還有橫隔<br>Branches, and cross-walls | 菌絲會分枝，許多菌絲交織在一起，像一張細網，叫菌絲體。圖中的菌絲被短橫線隔成一格一格，那些橫線就是橫隔。補充：有些真菌的菌絲沒有橫隔，是一條長長相通的管子，例如下一頁的黑黴。<br>Hyphae branch, and many of them weave together like a fine net called a mycelium. In the picture each hypha is divided into compartments by short cross lines; those lines are cross-walls. Extra: the hyphae of some fungi have no cross-walls and form one long connected tube, as in the black mould on a later page. |
| 3 | 尖端生長 / Growing at the tips | 從尖端往前長<br>Growing forward from the tips | 菌絲主要從尖端往前伸長，一邊長、一邊分枝，網就越織越大。圖是某一個瞬間的樣子，示意菌絲怎麼長，不是真實的生長速度。<br>Hyphae lengthen mainly at their tips, branching as they go, so the net grows larger and larger. The picture shows one moment and sketches how hyphae grow; it is not the real growth rate. |
| 4 | 不是根 / Not a root | 菌絲不是植物的根<br>Hyphae are not plant roots | 菌絲不是植物的根。植物的根吸收水和無機鹽，葉子行光合作用自己製造養分；真菌沒有葉綠體，不能行光合作用，要從外界取得有機養分，整張菌絲網都在吸收。<br>Hyphae are not plant roots. A plant root takes up water and mineral salts, and the leaves make food by photosynthesis. Fungi have no chloroplasts and cannot photosynthesize, so they must get organic nutrients from outside, and the whole hyphal net does the absorbing. |

- 每一步的畫面內容與畫布標籤（中／英，逐字使用）：
  1. 「細長的管」：整團菌絲淡入；標籤 `菌絲（一根細管）` / `Hypha (one thin tube)`，用引線連到一根完整的菌絲；`很細，要用顯微鏡看` / `Very thin: needs a microscope`；角落小字 `AI 教學插圖，非顯微照片` / `AI teaching illustration, not a micrograph`。
  2. 「分枝與橫隔」：標出 2～3 處 Y 形分枝（`分枝` / `Branch`）、放大圈放大一小段橫隔（`橫隔` / `Cross-wall`）；整團標 `菌絲體` / `Mycelium`（引線到整團邊緣）。
  3. 「尖端生長」：選 2～3 個游離端高亮並用箭頭朝尖端外側（`尖端` / `Growing tip`）；在尖端前方用程式畫一小段**淡色虛線的延伸**，一邊延伸一邊在後方長出一個小分枝（用虛線畫，不是新圖）；角落寫 `示意，不是真實的生長速度` / `A sketch, not the real growth rate`。**不要把被別根蓋住的交叉點當成尖端**（用 `free_tips`，且開口比例 ≥ 0.6 的）。
  4. 「不是根」：左邊一團菌絲（縮小）、右邊用程式畫一株小植物的根（簡單線條＋根毛，棕色；**不要用白色**）；左標 `菌絲：從外界吸收有機養分` / `Hyphae: absorb organic nutrients from outside`，右標 `植物的根：吸收水和無機鹽` / `Plant root: takes up water and mineral salts`；中間大 ✗：`菌絲不是植物的根` / `Hyphae are not plant roots`。
- 避免的科學錯誤：不得說所有真菌的菌絲都有橫隔（說明欄已補充「有些沒有」，畫布不要用「一定」）；不得把管子裡的小圓點叫做細胞核（老師尚未確定，見 `sources.md`「待老師看」2）；兩團不要標成「不同種」；菌絲不是根；不寫真實大小數字。

---

## 2. `fungi_draw_digest_1022_v1.js`（註冊名 `digest`）

- 屬於：分頁 1 → 觀察「外部消化」（`s.view = 1`）。N = 3 步。
- 圖：**全部用程式畫，不用 PNG**（菌絲細胞管、食物、分子、酵素）；可用 `hyphae_a.png` 的外形風格（奶白色管子，兩端圓鈍，有橫隔）當畫法參考。左右佈局：左 1/3 外界食物（一塊落葉／枯木，畫成褐色塊，用程式畫；要有名字 `落葉、枯木` / `Dead leaves, rotting wood`），中間一段橫放的菌絲（占畫面寬約 60%），細胞壁畫奶白色，**細胞外與細胞內用不同底色且有標籤** `細胞外` / `Outside the cell`、`菌絲細胞內` / `Inside the hypha`。
- 步驟（中英逐字）：

| # | 按鈕（中／英） | 標題（中／英） | 說明（中／英，逐字） |
|---|---|---|---|
| 1 | 外界食物 / Food outside | 外界的食物是大分子<br>The food outside is made of big molecules | 落葉、枯木這類外界的有機物，含有很多大分子，不能把整塊食物直接搬進細胞裡。<br>Outside organic matter such as dead leaves and rotting wood holds many big molecules, and a whole piece of food cannot be carried straight into a cell. |
| 2 | 外部消化 / Digest outside | 菌絲分泌酵素，在細胞外分解<br>Hyphae release enzymes that digest outside the cell | 菌絲分泌酵素，在細胞外把大分子分解成較小的分子。圖中的分子畫得很大，和菌絲的大小只是示意，不是真實比例。<br>Hyphae release enzymes that break the big molecules into smaller ones outside the cell. The molecules are drawn very large; their size next to the hypha is only a sketch, not a true scale. |
| 3 | 吸收 / Absorb | 小分子被吸收進菌絲<br>Small molecules are absorbed into the hypha | 較小的分子可以被菌絲吸收，用來維持生命和生長。真菌沒有葉綠體，不能行光合作用；牠可以是分解者，也可能和其他生物共生或寄生。<br>The smaller molecules can be absorbed by the hypha and used for living and growing. Fungi have no chloroplasts and cannot photosynthesize. A fungus can be a decomposer, and some live together with other organisms or as parasites. |

- 每一步畫面與畫布標籤：
  1. 「外界食物」：食物塊上有許多**大分子**（橘色的串珠，一串約 5～6 顆；標 `大分子` / `Large molecule`），一個大分子試著靠近菌絲，但卡在細胞壁外（✗ 小標：`整塊進不去` / `Cannot enter whole`）。
  2. 「外部消化」：菌絲壁上分泌出**酵素**（青色小「吃豆人」或剪刀形；標 `酵素` / `Enzyme`），酵素在細胞外把橘色串珠剪成黃色單顆（`小分子` / `Small molecule`），每剪一下有短暫閃光；標 `在細胞外分解` / `Digested outside the cell`；角落小字 `分子與菌絲的大小只是示意` / `Sizes of molecules and hypha are a sketch`。
  3. 「吸收」：黃色小分子穿過細胞壁進入菌絲（沿壁上的小通道，箭頭）；標 `吸收小分子` / `Absorbing small molecules`；細胞內小分子累積後發出一圈光（`用來維持生命與生長` / `Used for living and growing`）。另有一排三個小標籤並列（淡色）：`分解者` / `Decomposer`、`共生` / `Symbiont`、`寄生` / `Parasite`，只當名詞提示，不要畫成互動。
- 避免的科學錯誤：不得畫成「把整塊食物吞進去」；不得畫葉綠體或光合作用箭頭；酵素是在細胞**外**作用（步驟 2 的剪刀動作必須發生在細胞壁外）；分子與菌絲比例不要宣稱真實；吸收的是「較小分子」，不是酵素本身；不可畫成菌絲像「根插進食物」的樣子（要畫成貼著食物表面）。

---

## 3. `fungi_draw_yeast_1022_v1.js`（註冊名 `yeast`）

- 屬於：分頁 2「麵團為什麼鼓起來？」（只有這一個畫面，`s.view` 不存在）。N = 4 步；**互動**：頁面控制列有「我的預測」三顆鈕（`s.guess`：-1 未選、0＝A、1＝B、2＝C，由主程式的 `act` 設定），畫布上三個瓶子也要能點（`D.hit(x,y,w,h,'guess',i)`）；步驟 2 要求學生先選。第 3 步的說明欄（主程式已做）會依 `s.guess` 回饋：

| 預測 | 回饋（中／英，逐字，已在說明欄） |
|---|---|
| A 瓶 / Bottle A | 你猜 A 瓶，猜對了！有糖又溫暖，酵母菌最活躍。<br>You predicted bottle A, and you were right! With sugar and warmth, yeast is most active. |
| B 瓶 / Bottle B | 你猜 B 瓶。結果是 A 瓶最明顯：B 瓶沒有加糖，酵母菌得不到養分，產生的氣體很少。<br>You predicted bottle B. The result is that A swells most: bottle B has no added sugar, so the yeast gets little food and makes little gas. |
| C 瓶 / Bottle C | 你猜 C 瓶。結果是 A 瓶最明顯：C 瓶雖然有糖，但太冷，酵母菌活動慢，氣體產生得少。<br>You predicted bottle C. The result is that A swells most: bottle C has sugar, but it is too cold, so the yeast works slowly and makes less gas. |

  未選時的句子：你還沒有預測。選一個「我的預測」，下次就能比較自己猜得準不準。 / You have not made a prediction yet. Choose one under "My prediction" to compare it with the result next time.
- 圖（biotech 的既有圖，`bt:` 前綴）：`bt:yeast_budding.png`（255×226，出芽的酵母菌群）、`bt:yeast_single.png`（123×130）、`bt:yeast_small.png`（96×80）、`bt:yeast_pair.png`（125×101）、`bt:dough_bowl.png`（386×284，揉好的麵團）、`bt:dough_risen.png`（386×284，發酵後）。瓶子、氣球、糖粒、水、二氧化碳泡泡都用程式畫（透明玻璃瓶，奶白細線；水用藍色半透明，溫水偏橘色調、冷水偏青色調，**不寫溫度數字**）。
- 版面：三個瓶子等寬並排（每個約 220×330，瓶口套氣球），瓶下標 A／B／C 和材料標籤；氣球畫在瓶口上方，**初始大小一樣**。
- 步驟（中英逐字）：

| # | 按鈕（中／英） | 標題（中／英） | 說明（中／英，逐字） |
|---|---|---|---|
| 1 | 三個瓶子 / Three bottles | 三個瓶子，一次只差一個條件<br>Three bottles, one difference at a time | 三個瓶子裡放了等量的酵母菌，瓶口各套一個氣球。A 瓶：加糖，溫水。B 瓶：不加糖，溫水。C 瓶：加糖，但是水很冷（低溫）。和 A 瓶比，B 瓶只少了糖，C 瓶只有溫度不同。<br>Each of the three bottles holds the same amount of yeast and has a balloon over its mouth. Bottle A: sugar and warm water. Bottle B: no sugar, warm water. Bottle C: sugar, but the water is cold (low temperature). Compared with A, bottle B lacks only the sugar, and bottle C differs only in temperature. |
| 2 | 先猜 / Predict | 先猜：哪個氣球會鼓起來？<br>Predict: which balloon will swell? | 你覺得過一陣子之後，哪一個氣球會鼓得最明顯？在上面的「我的預測」選一個，再按「看結果」。<br>After a while, which balloon do you think will swell the most? Choose one under "My prediction" above, then press "See the result". |
| 3 | 看結果 / See the result | 看結果：氣球鼓得不一樣<br>The result: the balloons swell differently | A 瓶的氣球鼓得最明顯；B 瓶的氣球幾乎沒有鼓；C 瓶的氣球鼓得慢，也鼓得少。這是定性的比較，只看誰多誰少，示意的快慢不是測得的數字。<br>The balloon on bottle A swells the most; the balloon on bottle B hardly swells; the balloon on bottle C swells slowly and only a little. This is a qualitative comparison of more and less. The speeds shown are a sketch, not measured numbers. |
| 4 | 為什麼 / Why | 酵母菌發酵，產生二氧化碳<br>Yeast ferments and makes carbon dioxide | 酵母菌是單細胞真菌。有糖又溫暖時，酵母菌分解糖，產生二氧化碳和酒精，這就是發酵。二氧化碳是氣體，把氣球撐起來；麵團裡的酵母菌也一樣，二氧化碳被麵團包住，麵團就膨脹。溫度太低時酵母菌活動慢，產生的氣體少。<br>Yeast is a single-celled fungus. When sugar is present and it is warm, yeast breaks the sugar down and makes carbon dioxide and alcohol; this is fermentation. Carbon dioxide is a gas and pushes the balloon up. Yeast in dough does the same: the carbon dioxide is trapped in the dough, so the dough swells. When it is too cold, yeast works slowly and makes less gas. |

- 每一步畫面與畫布標籤：
  1. 「三個瓶子」：三瓶依序淡入；每瓶下方標籤（逐字）：A：`有糖、溫水` / `Sugar, warm water`；B：`沒有糖、溫水` / `No sugar, warm water`；C：`有糖、冷水` / `Sugar, cold water`；瓶內都有同樣數量的酵母菌小圖示（`bt:yeast_small.png`，以相同數量排列，標 `酵母菌（等量）` / `Yeast (equal amount)`）；A→B 之間畫一個小標籤 `只差糖` / `Only sugar differs`，A→C 之間 `只差溫度` / `Only temperature differs`（各用一條虛線弧連兩瓶）。
  2. 「先猜」：三個瓶子輪流脈動提示可點；上方問句 `哪一個氣球會鼓得最明顯？` / `Which balloon will swell the most?`；已選的瓶子有黃框；未選時下方提示 `先選一個預測` / `Choose a prediction first`。**這一步不顯示結果**，氣球保持原樣。
  3. 「看結果」：氣球依序鼓起（**定性**：A 鼓到最大、C 慢且小、B 幾乎不動），瓶內冒出二氧化碳小泡泡（A 多、C 少、B 幾乎沒有）；結束時 A 瓶上方出現 ✓ 綠，B、C 無標記；若學生預測對，被選瓶子旁出現 `你猜對了` / `You were right`，猜錯則出現 `A 瓶最明顯` / `Bottle A swells most`（只用這兩個短標籤，詳細回饋在說明欄）。畫面角落寫 `定性比較：只看誰多誰少，快慢是示意` / `Qualitative: only more or less; the speed is a sketch`。
  4. 「為什麼」：放大 A 瓶中一個酵母菌（用 `bt:yeast_budding.png`，旁邊圓圈放大示意）：糖（黃色 `D.sugar`）進入酵母菌→出來粉紅二氧化碳泡泡＋小標 `酒精` / `Alcohol`；二氧化碳向上進氣球。下方一條小對照：`bt:dough_bowl.png` 淡入淡出成 `bt:dough_risen.png`，標 `麵團：二氧化碳被包住，麵團膨脹` / `Dough: carbon dioxide is trapped, so it swells`；角落 `酵母菌（單細胞真菌）` / `Yeast (a single-celled fungus)`。
- 避免的科學錯誤：**不放數字**（不寫溫度、毫升、秒數、「最適溫度」）、**不把示意速度當實驗數據**；B 瓶「沒有加糖」不寫成「完全沒有養分」；不得說酵母菌「吹氣」（是代謝產生二氧化碳）；三瓶除了標的條件，酵母菌量與瓶子必須畫成一樣；不要在還沒按「看結果」之前露出答案（步驟 1、2 氣球大小必須相同）；酵母菌不是細菌、不畫成有鞭毛。

---

## 4. `fungi_draw_network_1022_v1.js`（註冊名 `network`）

- 屬於：分頁 3「看到蘑菇，沒看到全部」→ 觀察「土壤剖面」（`s.view = 0`）。N = 4 步。
- 圖（三張**同一畫布 1226×1302**，疊起來等於原圖）：`mushroom_soil.png`（整張）、`mushroom_cap_only.png`（只有 5 朵菇）、`mycelium_net_only.png`（只有土壤與菌絲網）。縮放建議 0.43（高 560 → 寬約 527），放畫面左側 x 20～547；右側 x 580～940 放標籤與放大圈。座標（PNG 像素，見 `measurements.json`）：菇的範圍 `[299,6,978,549]`，四朵站著的傘蓋中心 (374,362)、(466,220)、(584,362)、(721,106)，倒著那朵的傘 bbox `[750,285,980,522]`、菌褶中心約 (865,402)，最高那朵的菌環 bbox 約 `[665,190,755,240]`；菌絲中心點（所有白線的匯聚點）(645,602)；白色菌絲 bbox `[5,541,1221,1193]`；土壤上緣 y 約 452～472；落葉在約 (590,880)、朽木在約 (960,970)（目測，請用 `mushroom_soil.png` 再量）。
- 步驟（中英逐字）：

| # | 按鈕（中／英） | 標題（中／英） | 說明（中／英，逐字） |
|---|---|---|---|
| 1 | 地面上的菇 / Mushrooms above | 地面上的菇是子實體<br>The mushroom above the ground is a fruiting body | 地面上看得見的菇，是蕈類產生孢子的構造，叫子實體，不是整個真菌。圖中倒下的那一朵翻過來，可以看到傘下面一片一片的菌褶。<br>The mushroom you see above ground is the part of a mushroom fungus that makes spores, called a fruiting body; it is not the whole fungus. The mushroom lying on its side is turned over so you can see the gills under the cap. |
| 2 | 孢子 / Spores | 菌褶產生孢子<br>The gills make spores | 菌褶會產生很多很小的孢子，孢子隨風飄散；落在適合的地方，可以長出新的菌絲。孢子小到肉眼看不見，圖中沒有畫出孢子。<br>The gills make a great many tiny spores that drift away on the wind. A spore that lands in a suitable place can grow new hyphae. Spores are too small to see with the naked eye, so none are drawn in the picture. |
| 3 | 地下的菌絲網 / Hyphae below | 土壤切開，看到地下的菌絲網<br>Cut the soil open to see the hyphae below | 把土壤切開，才看到子實體底下有一大片菌絲網，在泥土、落葉和枯木之間蔓延，把它們分解、吸收。從地面上看，只看得到菇，看不到這張網。<br>Cut the soil open and a large net of hyphae appears beneath the fruiting bodies, spreading through soil, dead leaves and rotting wood, breaking them down and absorbing them. From above the ground you see only the mushrooms, never the net. |
| 4 | 採走菇 / Pick the mushrooms | 採走菇，菌絲還在<br>Pick the mushrooms and the hyphae stay | 把菇採走，地下的菌絲網還在，之後還可能長出新的菇，所以採走菇不代表整個真菌不見了。看見的子實體只是真菌的一部分。不要依照圖片採菇或吃野生的菇：照片不能判斷能不能吃。<br>Pick the mushrooms and the hyphal net underground is still there; new mushrooms may grow later. So removing the mushrooms does not mean the whole fungus is gone: the fruiting body is only a part of it. Never pick or eat wild mushrooms by looking at a picture, because a photo cannot tell you whether it is edible. |

- 每一步畫面與畫布標籤：
  1. 「地面上的菇」：整張 `mushroom_soil.png`；標籤 `子實體（蕈類的菇）` / `Fruiting body (the mushroom)`，引線到最高那朵；`地面` / `Ground` 一條虛線沿土壤上緣；其他地方先不標。
  2. 「孢子」：倒著那朵放大（圈放大菌褶，`菌褶` / `Gills`）；從菌褶向外飄出**程式畫**的灰褐色小點與風的箭頭，小點加一個放大圈，標 `孢子（放大示意，肉眼看不見）` / `Spores (enlarged sketch; invisible to the naked eye)`；一個孢子落在地上長出一小段新菌絲（程式畫，淡奶白線）＋標 `新的菌絲` / `New hyphae`。
  3. 「地下的菌絲網」：蘑菇層稍微變淡（alpha 0.35），土壤剖面的菌絲網依序高亮（從中心點 (645,602) 向外延伸的光點／亮度掃描）；標籤 `菌絲網` / `Hyphal net`（引線到中心點附近）、`落葉` / `Dead leaf`、`朽木` / `Rotting wood`、`土壤` / `Soil`；另外在左側棕色細線處標 `棕色細線：植物的根，不是菌絲` / `Brown thin lines: plant roots, not hyphae`（見 `sources.md` 待老師看 8，這個標籤必須有）；一條小提示 `從地面上看不到這張網` / `You cannot see this net from above ground`。
  4. 「採走菇」：`mushroom_cap_only.png` 往上移並淡出（像被採走），底下是 `mycelium_net_only.png`（轉場時 `mushroom_soil.png` 淡出、`mycelium_net_only.png` 在下、`mushroom_cap_only.png` 在上浮起；柄底的邊是切開的，浮起時看不到切口的位置要蓋好）；標籤 `菇被採走` / `Mushrooms picked`，`菌絲還在` / `The hyphae are still there`；最後在中心點 (645,602) 的位置，用程式畫一朵很小的新菇長出來（可縮小用 `mushroom_cap_only.png` 最小那朵的裁切 `crop`，或程式畫）＋標 `之後可能長出新的菇` / `New mushrooms may grow later`。底部警示（每一步都顯示，小標籤）：`不要依圖採菇或吃野生的菇` / `Do not pick or eat wild mushrooms from a picture`。
- 避免的科學錯誤：**不得讓學生覺得白線是「根」**；不得說採走菇就殺死真菌；「孢子」要標為放大示意；不要把土壤中的白線全稱為「根」；孢子不是種子；不要暗示這張圖可用來判斷蘑菇可不可以吃；最高的菇上的環（菌環）不要標名（課文不教）。`mycelium_net_only.png` 的地面後緣是複製補的（見 `sources.md`），只用在第 4 步。

---

## 5. `fungi_draw_molds_1022_v1.js`（註冊名 `molds`）

- 屬於：分頁 3 → 觀察「黴菌與孢子」（`s.view = 1`）。N = 6 步。
- 圖：`bread_mold.png`（1289×906）、`sporangia_pair.png`（1106×1126）、`sporangium_closed.png`（340×831）、`sporangium_open.png`（384×813）、`orange_mold.png`（829×762）、`penicillium_brush.png`（895×1250）；步驟 6 用：`bt:yeast_budding.png`（255×226）、`penicillium_brush.png` 或 `bread_mold.png`、`mushroom_cap_only.png`（1226×1302，用 `crop` 只取最高那朵 [約 0.24, 0.0, 0.34, 0.42]）。座標（PNG 像素，`measurements.json`）：
  - `bread_mold.png`：黑點（孢子囊）173 個的座標 `black_heads_x_y_area_173`，比較孤立的 19 個可當標籤目標，例如 (504,549)、(559,521)、(504,497)；白色棉絮重心 (564,386)；麵包皮 bbox `[0,119,1265,899]`；左端被切平（見 `sources.md` 6，不要把整片放太靠左）。
  - `sporangia_pair.png`：左球心約 (331,174) 半徑約 168；右球心約 (783,209) 半徑約 178；兩根柄的 x 範圍依 y（`stalk_runs_x_by_y`）；假根 bbox `[5,880,1100,1120]`；奶白色囊軸 (801,151)；孢子直徑約 19 px。
  - `sporangium_closed.png`：球心 (170,171) 半徑 168；柄下端在 y = 831 切平。`sporangium_open.png`：球心 (188,187) 半徑 178；破口範圍 `[19,15,336,361]`；孢子堆 `[11,151,365,364]`；囊軸 `[184,98,225,183]`；飄出的孢子約 22 顆，分布 `[86,40,372,545]`。
  - `orange_mold.png`：藍綠色黴斑中心 (416,392)，半徑約 131；白色外圈半徑約 120～200（由內往外）；橘子 bbox `[6,6,822,755]`；蒂 (410,39)。
  - `penicillium_brush.png`：柄 x 約 437～492（y 700～1000）；柄上橫隔 y 約 829、922、1026；柄頂約 y 660 分兩枝；分枝區 y 330～640；孢子鏈的游離端 `chain_free_tips_x_y`（11 個，例如 (429,18)、(542,25)、(207,57)、(840,112)）；底部橫向菌絲 bbox `[240,1150,671,1243]`。
- 步驟（中英逐字）：

| # | 按鈕（中／英） | 標題（中／英） | 說明（中／英，逐字） |
|---|---|---|---|
| 1 | 麵包上的黴 / Mould on bread | 麵包上的棉絮與黑點<br>Cotton fluff and black dots on bread | 放太久的麵包上，白色的棉絮是菌絲，黑色的小點是孢子囊，這是黑黴（例如根黴）。黑點不是一朵朵小蘑菇。發霉的食物不要聞、不要吃。<br>On bread left too long, the white cotton fluff is hyphae and the small black dots are sporangia; this is a black mould (for example Rhizopus). The dots are not tiny mushrooms. Do not sniff or eat mouldy food. |
| 2 | 柄與假根 / Stalk and rhizoids | 放大一根黑黴：柄、孢子囊、假根<br>One black mould enlarged: stalk, sporangium, rhizoids | 放大一根黑黴：細長的柄把圓球狀的孢子囊舉高，柄的底下是假根，伸進食物裡，固定身體，也分泌酵素、吸收養分。孢子囊裡面裝著很多孢子。<br>One black mould enlarged: a long thin stalk lifts a round sporangium into the air. At the foot of the stalk are rhizoids that reach into the food, hold the mould in place and release enzymes to absorb nutrients. The sporangium holds many spores. |
| 3 | 孢子囊破開 / Sporangium opens | 孢子囊破開，孢子飛出來<br>The sporangium opens and spores escape | 孢子囊成熟後破開，裡面的孢子散出來，隨空氣飄走；落在新的食物上，可以長出新的菌絲。孢子又多又小，圖中孢子的大小和數量只是示意。<br>When the sporangium is ripe it splits open, and the spores spill out and drift away on the air. A spore that lands on new food can grow new hyphae. Spores are many and tiny; their size and number in the picture are only a sketch. |
| 4 | 橘子上的青黴 / Mould on an orange | 橘子皮上的青黴<br>Green mould on an orange peel | 橘子皮上藍綠色、外圈白色的黴斑，常見的是青黴；看得到的是菌絲和孢子。不要自己培養、打開、近聞或吃發霉的材料。特定的青黴菌種可以用在食品製造，例如某些乳酪，但這不表示自然發霉的食物可以吃。<br>The blue-green spot with a white rim on an orange peel is often Penicillium; what you see is hyphae and spores. Never grow, open, sniff or eat mouldy material yourself. Certain Penicillium strains are used in food making, for example in some cheeses, but that does not mean food that has gone mouldy by itself is safe to eat. |
| 5 | 孢子鏈 / Spore chains | 青黴：刷子狀，頂端有孢子鏈<br>Penicillium: a brush with spore chains | 放大一根青黴：頂端分枝，像一把小刷子，每一枝的尖端串著一串串孢子，像一串串珠子。藍綠色就是這些孢子的顏色。<br>One Penicillium enlarged: the top branches like a small brush, and the tip of every branch carries a string of spores like a string of beads. The blue-green colour is the colour of these spores. |
| 6 | 三種真菌 / Three fungi | 三種真菌比一比<br>Three kinds of fungi compared | 酵母菌：單細胞，不是由菌絲組成。黴菌（黑黴、青黴）：由菌絲組成，常長成絨毛狀，靠孢子繁殖。蕈類（香菇、靈芝）：由菌絲組成，看得見的菇是子實體，會產生孢子。不是所有真菌都長得像蘑菇。<br>Yeast: single-celled, not made of hyphae. Moulds (black mould, Penicillium): made of hyphae, often fluffy, and reproduce by spores. Mushroom fungi (shiitake, reishi): made of hyphae, and the mushroom you see is a fruiting body that makes spores. Not every fungus looks like a mushroom. |

- 每一步畫面與畫布標籤：
  1. 「麵包上的黴」：`bread_mold.png` 淡入；標 `白色棉絮：菌絲` / `White fluff: hyphae`、`黑色小點：孢子囊` / `Black dots: sporangia`、`麵包` / `Bread`；一個圈圈放大幾個黑點（不是放大成小蘑菇）；警示條（此步與步驟 4 都顯示）`發霉的食物不要聞、不要吃` / `Do not sniff or eat mouldy food`。
  2. 「柄與假根」：從麵包上其中一個黑點拉出放大圈（可用 `D` 的放大動畫，目標點取孤立的黑點），圈內顯示 `sporangia_pair.png`（或 closed 那根加假根）；標 `孢子囊` / `Sporangium`、`柄` / `Stalk`、`假根` / `Rhizoids`（引線到假根）、`食物` / `Food`（在假根下方畫一塊程式畫的麵包面）；說明 `假根伸進食物，也分泌酵素、吸收養分` / `Rhizoids reach into the food and release enzymes to absorb nutrients`（畫布小字）。
  3. 「孢子囊破開」：先顯示 `sporangium_closed.png`，經過一小段後切成 `sporangium_open.png`（相同位置淡入淡出，**兩張構圖不同、球心略有偏移，要對齊球心**：closed 球心 (170,171) 對 open 球心 (188,187)），再從破口把孢子（程式畫灰黑小球，直徑與圖中孢子一致約 19 px 乘縮放）大量飄出，隨風向右上飄遠；標 `孢子` / `Spores`、`孢子囊破開` / `Sporangium splits open`、一片小麵包面上長出新菌絲（程式畫）＋`落在新食物上，長出新的菌絲` / `On new food, a spore grows new hyphae`；角落 `孢子的大小與數量只是示意` / `Size and number of spores are a sketch`。
  4. 「橘子上的青黴」：`orange_mold.png`；標 `藍綠色：孢子` / `Blue-green: spores`、`白色：菌絲` / `White: hyphae`、`橘子皮` / `Orange peel`（引線目標：中心 (416,392)、白圈約 (225,460)、皮 (160,600)）；警示條 `不要自己培養、打開、近聞或吃發霉的材料` / `Never grow, open, sniff or eat mouldy material`；另一行小字 `特定的青黴菌種可用在食品製造，不表示自然發霉的食物可以吃` / `Certain Penicillium strains are used in food making; that does not make food that has gone mouldy by itself safe`。
  5. 「孢子鏈」：從橘子的黴斑拉出放大圈到 `penicillium_brush.png`（放大，占畫面主要空間）；標 `柄` / `Stalk`、`分枝（像刷子）` / `Branches (like a brush)`、`孢子鏈` / `Spore chain`、`孢子` / `Spore`（引線到鏈上單顆）；鏈上孢子一顆一顆依序亮起（亮度掃描，由基部到尖端）。
  6. 「三種真菌」：三欄比較表（版面參考 `microorganisms_draw_compare_1021_v1.js`；每欄上方一張小圖＋名稱）：
     - 酵母菌 Yeast（`bt:yeast_budding.png`）：`單細胞` / `Single-celled`；`不是由菌絲組成` / `Not made of hyphae`；例子 `酵母菌` / `Yeast`。
     - 黴菌 Moulds（`penicillium_brush.png`）：`由菌絲組成` / `Made of hyphae`；`常長成絨毛狀，靠孢子繁殖` / `Often fluffy; reproduce by spores`；例子 `黑黴、青黴` / `Black mould, Penicillium`。
     - 蕈類 Mushroom fungi（`mushroom_cap_only.png` 的一朵）：`由菌絲組成` / `Made of hyphae`；`看得見的菇是子實體，會產生孢子` / `The mushroom you see is a fruiting body that makes spores`；例子 `香菇、靈芝` / `Shiitake, reishi`。
     下方一行：`不是所有真菌都長得像蘑菇` / `Not every fungus looks like a mushroom`。三欄依步驟 6 的 stage 內進度逐欄亮起（黃框滑動），不需要分三個按鈕。
- 避免的科學錯誤：黑點**不是**小蘑菇；黑黴的孢子裝在孢子囊裡，青黴的孢子串在枝尖，不要畫成同一種構造；假根不是植物的根；孢子的大小與數量只是示意；照片不能判斷可食性；**不得出現「發霉的食物可以吃」或把青黴用在食品當成可吃的理由**；不要說「白色棉絮是孢子」（是菌絲）；青黴的孢子鏈圖中交叉是 Gemini 的畫法（`sources.md` 待老師看 11），動畫亮起孢子時不要依賴交叉點判斷鏈的歸屬。
