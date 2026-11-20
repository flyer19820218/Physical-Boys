# Physical-Boys｜AI 協作規則（V6 精簡版，2026-11-20）

> 版面以 `work_5.html`（能源與發電）為範本；**曉臻老師 Hook 以 `astronomy_universe_1.html` 為準（見 2.5）**。舊版全文（14 條定律）已備份在 `docs/archive/AGENTS_V5_全文備份_20261120.md`，**平常不要讀**；只有下面「專題規則」表指到的時候，才去讀那一節。
> 條件越多越容易亂做。這份只留「每一課都用得到」的規則；不確定時，**照 work_5 的寫法做，不要自己發明**。

## 0. 先讀這個：你要做什麼 → 該讀什麼

老師只要說一句話，你就照這張表找要讀的檔，**只讀那一課、那一類任務需要的**，不要整份 html、整份 PROGRESS 都讀。

| 老師說 | 先讀 | 再讀 |
|---|---|---|
| 「把 <課> 優化成 work_5 那樣」「做新一課」 | 本檔第 1～4 節 | `lessons_md/<課>.md`（講解文字）、`lessons_md/<課>.quiz.md`（題庫）、範本 `work_5.html` 的一個分頁 |
| 「做 <課> 的學生操作／老師講解」 | 本檔第 3.3 節 | 範本 `work_5_modes_1118_v1.js`、`work_5_kit_1103_v1.js` |
| 「做 <課> 的有聲講解」 | 本檔第 5 節 | `AGENTS_VOICE.md` → `tools/voice/lesson_studio/新課作業手冊.md` →（需要時）Project「網課有聲講解_自動螢光筆規範」「…雲端錄音與 Opus 精準切畫面」 |
| 改題庫／選項 | 本檔 3.4 | `assets/quiz/quiz_<課>_*.js`、`tools/qa/README.md` |
| 做到哪了？接著做什麼？ | `PROGRESS.md` 最上面幾行 | `git log --oneline -20` |
| 光筆（pen tool）相關 | `pencil.md` | — |
| 用到課本／網路圖片 | `assets/textbook_image_permissions.md` | 該圖片資料夾的 `sources.md` |

**每次開工的固定動作**：①讀本檔 ②讀 `PROGRESS.md` 前 30 行 ③`git pull` ④只讀這次的那一課。做完更新 `PROGRESS.md`（只改表格，不往下加長）。

## 1. 最高原則（三區）

> **先保護，再優化；先理解教學目的，再碰程式。** 美化不得凌駕科學正確、教學流程、原有互動、原有動畫、原有題目。

- 🔴 **紅區（沒有老師明確授權不准動）**：Canvas／SVG 的繪圖演算法與座標比例、動畫的位置／軌跡／方向／週期／速率、物理常數與公式、實驗裝置與流程、圖表、題庫答案與計分、已細修好的動畫節奏。
  不可以因為「想統一風格、想更漂亮、想簡化、想重構」就重寫正常運作的東西。**優化舊課預設只做「外層加法」**：加 UI、雙語、Hook、排版保護、模式列、播放器；不重做教材本體。
- 🟡 **黃區（先指出問題、老師同意才改）**：物理／化學定義、術語、公式推導、教學順序、疑似科學錯誤、題目內容、實驗設計。流程：指出位置 → 說原因 → 最小修改建議 → 等同意。
- 🟢 **綠區（可主動做）**：版面、1080px、iPad 保護、雙語、標題、Hook、串場、操作提示、概念收束、封面、防重疊。
- **換筆不換畫**：可改「怎麼畫」（線寬、顏色、圓角、光暈、字級只能變大），不可改「畫什麼」（座標、數量、軌跡、顏色語意）。改完要比對繪圖函式的數值座標證明沒變。
- 顏色語意全站一致：動能 K 黃、重力位能 U 橘、彈力位能 Ue 粉紅、總力學能 E 綠；電子／負電荷藍 `#4dd2ff`、正電荷橘 `#ff8040`、電流紅 `#ff4d4d`。

## 2. 格式規格（以 work_5 為準，直接複製它的 `<style>` 與頁首，不要重寫）

### 2.1 版面與色票
- 主框架 `.wrap { max-width:1080px; margin:0 auto }`，不得改寬、不得全螢幕滿版。
- 黑板色：頁底 `--bg-base:#11261f`、面板 `--bg-panel:#17332a`；粉筆色 白 `#f6f3ea`、淡灰 `#a3b8b0`、黃 `#ffe066`、青 `#4dd2ff`、珊瑚 `#ff8040`、綠 `#33cc99`。**禁止純黑 `#000`。**
- 字型：`Noto Sans TC`（內文）、`JetBrains Mono`（公式、數字、標籤）。viewport 一律 `width=device-width, initial-scale=1, viewport-fit=cover`，**不加** maximum-scale／user-scalable（老師要雙指放大）。
- 新頁 `body` 不放點點背景（iOS 會拉出整頁直線）；沿用 work_5 的 `@media (hover:none) and (pointer:coarse)` 防護區塊。

### 2.2 字級（可讀文字 22～48px，同層級同字級，不要為了塞內容縮字）
| 元素 | 字級 |
|---|---|
| `body`、`.note`、Hook 內文、控制項標籤 | 22px |
| `h1`（黃） | 48px |
| 副標 `.subtitle`（青、粗體，一句短導讀） | 24px |
| `h2`（青，每個子頁標題） | 32px |
| `.note h3`、說明框小標 | 28px |
| `.tab-hook`（分頁鈕上行，鉤子問句） | 22px |
| `.tab-sub`（分頁鈕下行，學科小字） | 17px |
| `.sub-tab-btn` | 20px |
| `.step-btn`（步驟鈕） | 18px，高 44px |
| Hook 標題 | 26px |
| `.sub-tag` | 22px |
畫布內文字 22px 以上；寫在固定寬度色塊裡的字，用 `fitText` 量過再寫，並在交付時說最後落在幾 px。

### 2.3 頁面由上到下的順序（固定，不准自己調）
1. 封面 `#introScreen`（點一下進入；**畫面上不得有任何字**；圖片用相對路徑、不用 Base64；影片封面 poster 用第一格）
2. 左上角 `.home-fab`（回首頁）、`.back-fab`（回單元總覽）；右上角 `.language-switch`（中文／EN）；光筆 `assets/pen_tool_1031_v1.js`（`</body>` 前掛一行）
3. `header`：`h1` 主標題（只寫單元名稱，不加前綴）＋ `.subtitle` 一句導讀。**不放章節編號、課本頁碼、規格徽章。**
4. `#modeBar` 模式列：✋ 學生操作／👩‍🏫 老師講解（做了有聲講解才多一顆 🔊 有聲講解，由播放器加）＋ `.mode-hint`
5. `.tabs` 五個分頁鈕（`.tab-btn[data-tab=tab1..5]`）：上行＝鉤子問句、下行＝學科小字；選中＝實心黃底深字＋黃光；補充類分頁用 `danger-tab` 珊瑚色
6. 目前分頁 `.panel.tab-view` →（有多個主題時）`.sub-tabs` 子分頁（`.sub-tab-btn[data-sub]`，選中＝黃字黃底線）→ `.sub-view`
7. **曉臻老師 Hook 一律是該分頁（有子頁就是該子頁）面板裡的「第一個元素」**，在步驟列、`h2`、動畫之前（格式固定，見 2.5）。
   - 分頁骨架（以 `astronomy_universe_1` 為準）：`.panel` → **Hook** → 步驟列 `.mission-row` → 動畫面板（`.v5-panel` 內一張 `.v5-cv` 960×540 canvas）→ `h2` 與說明文字 → 卡片／表格 → 資優筆記 `.v5-notes`；練習題由 `assets/biology/lesson_quiz_static_*.{css,js}` ＋ `assets/quiz/quiz_<課>_*.js` 掛載。
   - **`work_5.html` 的 Hook 位置（放在 `panel-header` 之後）與標題（「曉臻老師開場」）是舊式，不要參照。** 其餘版面（色票、字級、分頁鈕）仍以 work_5 為準，直到老師另行指示。
- 標題、分頁、導覽一律**用主題命名**，不寫「第幾章／4-1」；學生看得到的地方不寫課本頁碼、圖號、「講義」；補充內容的標題只寫「補充」。出版社名只放收合的「圖像來源」。
- 版面用 `grid`／`flex`，少用 `position:absolute`；長句不設 `nowrap`（只有單一名詞、公式、數值＋單位、短按鈕可以）；按鈕好點、不佔版面。

### 2.4 雙語、符號、常數
- 載入時 100% 繁體中文；英文只放在 `data-en`／`tr('中','En')`。每個文字節點寫 `data-zh`＋`data-en`。切換語言後 Canvas 要重畫。
- **禁用 MathJax／LaTeX**。分式用 `.fraction`（HTML＋CSS），下標 `<sub>`、上標 `<sup>`，公式用 `.math-text`（JetBrains Mono）。
- 常數：概念與定義用精確值（g = 9.8）；計算練習可取 g = 10，但**一定要在該處標示「取 g = 10」**。亞佛加厥數一律 6 × 10²³。台灣國中不教氧化劑／還原劑，有就標「補充（高中）」。

### 2.5 曉臻老師 Hook（**固定格式，照 `astronomy_universe_1.html` 複製，圖示與結構都不准改**）
- **數量與位置**：每個主分頁（有子頁就每個子頁）各一個，是面板裡的第一個元素；不能五頁共用同一句。
- **標題固定**：「曉臻老師說」（`data-en="Ms. Xiaozhen says"`）。不寫「開場」「提問」等其他標題。
- **頭像固定**：一律 `assets/characters/xiaozhen/teaching.png`，`alt="曉臻老師"`；**不換其他姿勢**（celebrating／pointing／reading 等不能用在 Hook）。88px 圓形、`border:4px solid #55e9ff`、`object-fit:cover`；寬度 ≤720px 時縮成 72px。
- **內容**：2～3 句，生活情境／認知衝突／提問，引出該頁的科學核心；一般句用 `<span>`，**最關鍵的一句用 `<b>`（黃字）**；每個 `span`／`b` 都要有 `data-zh`＋`data-en`。Hook 不取代教材、不搶動畫。
- **HTML（整段複製，只換文字）**：
```html
<div class="hook-box">
  <div class="xiaozhen-logo"><img src="assets/characters/xiaozhen/teaching.png" alt="曉臻老師"></div>
  <div class="hook-content">
    <div class="hook-title" data-zh="曉臻老師說" data-en="Ms. Xiaozhen says">曉臻老師說</div>
    <div class="hook-text"><span data-zh="…" data-en="…">…</span><b data-zh="…" data-en="…">…</b></div>
  </div>
</div>
```
- **CSS（整段複製自 `astronomy_universe_1.html` 第 480～498、620～623、699 行，連同「青色薄膜疊在抬起來的面板色上」的註解）**：`.hook-box`（flex、gap 18px、青色 8% 薄膜疊 `var(--bg-panel)`、2px 青框、左側 6px 青粗邊、圓角 12px、內距 18px 22px）、`.xiaozhen-logo`、`.hook-content`、`.hook-box .hook-title`（26px 青）、`.hook-box .hook-text`（22px、行高 1.75、`b` 黃）；`.panel > .hook-box { margin-bottom:22px }`。
- 檢查：量 Hook 是否為面板第一個元素、頭像 `src` 是否為 `teaching.png`、標題是否為「曉臻老師說」、左上角位置是否與 universe_1 相同。

## 3. 教材設計方式

### 3.1 敘事與結構
- 順序：**現象 → 疑問 → 認知衝突 → 模型 → 操作／驗證 → 概念收束**。標題直接打中科學問題，例：「太陽沒有在燃燒」。
- 一課＝5 個主分頁（每頁一個鉤子問句）；一個分頁底下可有 2～4 個子頁；一個分頁（或子頁）＝**一個 Hook＋一支動畫＋說明與卡片＋資優筆記**。
- **每個分頁（或子頁）都要有自己的曉臻老師 Hook**，格式見 2.5，不得共用同一句。
- 不要讓學生寫文字（不放輸入框）；要確認理解一律用選擇題。

### 3.2 動畫（一個子頁一支）
- 檔名 `<課>_<主題>_<MMDD>_v1.js`；共用骨架 `<課>_kit_*.js`（範本 `work_5_kit_1103_v1.js`，用 `W5.register(id,{canvas,steps,draw})`，`draw` 是純函式）。
- **切入即自動播放；最多 5 個步驟鈕**（超過就合併成一組）；**學生模式＝一次播一個步驟、播完停住**，按編號才播下一步；不放播放／暫停／重來、滑桿、下拉選單。
- 進度條畫在畫布頂端，由 `assets/anim_progress_bar_1105_v1.js` 提供，不要自己畫。
- 只能有一條 `requestAnimationFrame`；離開分頁或 `document.hidden` 就停；**不要在動畫尾巴寫死分頁編號**（插入分頁會讓動畫畫一格就不動）。
- **分工**：動畫與有聲講解切畫面用 Opus，**同一時間只開一個 Opus 代理、一次只做一個動畫檔**；其他一律 Sonnet（文字、頁面骨架、檢查、git、錄音、建置、模擬）。給代理的簡報只放那個動畫需要的：每步文字、圖片檔名尺寸、範本檔路徑。
- 電路動畫一律用「電子流」；電路、生物小構造、考題附圖的專門規則見下方「專題規則」。

### 3.3 學生操作／老師講解（只有老師指定的課才做）
- **學生操作**＝預設，一次播一步、播完停住。**老師講解**＝按一下從頭連播到底、同分頁多個子頁自動接力、可暫停／從頭重播／點編號跳步；無動畫的子頁停 10 秒再接。
- 實作範本：`work_5_modes_1118_v1.js`（只做頁面層，**不改動畫檔**）；頁首用 work_5 的 `#modeBar`、`.teach-bar`。離開老師模式時所有動畫還原成剛進來的樣子。
- 老師講解的交件測試：每個分頁連播到結尾無 JS 錯誤；點步驟編號跳到的狀態＝真的播到那裡；暫停後數值凍住；切回學生模式全部還原；中英各看一次。

### 3.4 題庫
- 練習題一律**四選一**，格式 問題 → 提示 → 解答（中英都要）；放在 `assets/quiz/quiz_<課>_*.js`。
- 選項長度與措辭要平衡，「選最長的就對」不准成立：改完跑 `node tools/qa/mcq_check.cjs assets/quiz/quiz_<課>_*.js`，違規數要是 0。
- 考題附圖放題目正上方、畫「事件發生前」的狀態、不可先畫出答案；考題的電路圖用考卷標準符號、靜態、不放電子動畫。
- 動原題＝黃區，要老師同意（選項長度措辭已全站授權）。

## 4. 網頁製作流程（優化任一頁到 work_5 的水準）

**階段 A｜基本教材網頁（含動畫、規則）**
1. 讀 `lessons_md/<課>.md`、`.quiz.md`；列出 5 個分頁、每分頁的子頁與鉤子問句，**先給老師看大綱**（這是唯一要先問的地方，其餘直接做）。
2. 複製 work_5 的 `<style>` 與頁首骨架（第 2.3 節），建 5 個分頁＋子頁骨架（`data-tab`、`data-sub`、`onclick="setSub(...)"`）。
3. 一次一個動畫（第 3.2 節）；每個動畫完成後立刻跑 `tools/qa/qa_page.cjs`（JS 錯誤、字體、封面無字、未定義函式、1080px、每張畫布 1 秒像素差、中英殘留）。
4. 寫 Hook、note、closure、題庫（第 3.1、3.4 節）。
5. 封面（`<課>_cover.jpg`、`#introScreen`）、首頁卡片：改 `index_classic.html` 後跑 `python3 tools/museum/build_lessons.py`。
6. 交付前檢查（第 6 節）；commit 並更新 `PROGRESS.md`。

**階段 B｜學生操作／老師講解**（老師指定才做，第 3.3 節）

**階段 C｜有聲講解**（老師指定才做，第 5 節）；順序固定 A → B → C，不要跳。

## 5. 有聲講解（彥君老師 × 曉臻助教）SOP 概要

老師只說：「做 <課> 的有聲講解」。完整步驟在 `tools/voice/lesson_studio/新課作業手冊.md`，規則在 `AGENTS_VOICE.md`。重點：
1. 寫稿（skill `lesson-dialogue-script`，一課一個新對話）→ `tools/voice/lesson_studio/scripts/<課>_script.txt`；稿裡不放英文字母與阿拉伯數字，N 極寫「恩極」、S 極寫「艾斯極」。
2. 設定檔 `tools/voice/lesson_studio/lessons/<課>.json`（cuts／steps／at／acts）；**切畫面派 Opus 逐句對照**，講到什麼畫面就真的點到對應按鈕。
   **派 Opus 切畫面的做法**（一課只開一個 Opus 代理，其餘工作用 Sonnet）：
   - 給 Opus 的簡報只放：①稿子與句號 ②頁面可呼叫的函式清單與每個步驟對應的畫面狀態（讀該課頁面的老師講解 STAGE 表與 mission-step／step-btn）③設定檔草稿 ④本節第 6 點的畫面原則。不要附整份 html。
   - Opus 要用**真實音檔長度**（建置、錄音後）跑 2～3 輪，逐句截圖檢查：鏡頭飛行有沒有晚到、句中換畫面的比例對不對、畫布有沒有整張在字幕框上方、字被字幕框擋住沒有。
   - Opus 只改 `at`／`acts` 與播放器的畫面對應（`viewOf`、螢光筆範圍），不改頁面本體；改完交回修改清單與句號，由 Sonnet 重新建置、跑逐句模擬。
   - 老師回報「切不準」時，先看是哪一句、哪個畫面，再交給 Opus 修，不要憑感覺整批調。
3. 建置 `python3 tools/voice/lesson_studio/build_lesson.py --lesson <課>` → `audio/<課>/manifest.json`、`stage.json`、`stage_spec.md`。
4. **雲端錄音** `python3 tools/voice/lesson_studio/cloud_tts.py <課>`（edge-tts；`No audio was received` 就重跑，只補缺的檔；音檔放 `audio/<課>/mp3/`，不放 GitHub Release）。**雲端錄音念的是稿上的字**：讀音不對就在稿裡寫同音字（例：參宿四寫「身秀四」），字幕靠 `build_lesson.py` 的 `SUB_MAP` 換回原字，刪該句 mp3 後重錄。
5. 播放器 `<課>_voice_v1.js`（複製最接近的課當範本，如 `astronomy_universe_1_voice_v1.js`、`work_5_voice_v1.js`）＋ html 加 `<script defer src="<課>_voice_v1.js?v=日期-版本">`；改了就換版本號。播放器強制學生模式、鎖定頁面本身的老師導覽。
6. **畫面原則：重點是動畫不是文字。** 動畫步驟以 `.v5-cv` 畫布為準，整張畫布必須在字幕框上方的主屏內；螢光筆要畫到畫面外時，畫完馬上拉回動畫。
7. **自動螢光筆**：唸到哪畫到哪，只框字本身（規範見 Project「網課有聲講解_自動螢光筆規範」與 `AGENTS_VOICE.md` 8-1）。
8. 驗證：`python3 -m http.server 8803` 後 `NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_<課>.js`（約 5 分鐘，背景跑、短間隔輪詢）：`mismatches 0`、`js errors none`、`mode-teacher 0`。
9. 推分支 `<課>-audio` → 老師聽看 → **老師說 OK 才推 main**。完成後把新學到的雷補進 `新課作業手冊.md`。

## 6. 交付前檢查（逐項，不可只用讀的）

- [ ] 主內容 1080px；預設繁中；EN 可切換；沒有 `#000`、MathJax、Base64
- [ ] 頁面順序、字級、分頁鈕、步驟鈕與 work_5 相同（量 `h1` → `#modeBar` → `.tabs` 的垂直位置遞增）
- [ ] 未碰紅區；舊課只做外層加法
- [ ] 每張該動的畫布，1 秒前後像素差明顯大於 0（靜態圖要在交付說明裡指出）
- [ ] 沒有「只有呼叫、沒有定義」的函式；分頁增刪後所有 `currentTab === '...'` 逐一核對
- [ ] 沒有文字壓圖、斷字、重疊；iPad Pro 13 橫式正常、直式不破版
- [ ] 題庫四選一，`mcq_check.cjs` 0 違規
- [ ] 學生看得到的文字沒有課本頁碼、圖號、「講義」
- [ ] 圖片版權已記在該圖片資料夾的 `sources.md`、`assets/textbook_image_permissions.md`

## 7. 發布與協作

- 老師已授權：**教材修改做完必要檢查後直接 commit、push 到 main**，由老師在線上確認再細修；只動指定範圍的檔案，不順手整理、改內容或重構。**有聲講解例外：先推分支，老師說 OK 才合併 main。**
- 改了 js／css 要換 `?v=` 版本號（或新檔名），否則老師會看到舊快取；請老師「硬重新整理」。
- commit 結尾加：`Co-Authored-By` 與 `Claude-Session` 兩行。回報寫：改了什麼、沒動什麼、commit SHA。
- 要完整 HTML 時給完整可獨立執行的檔，不得用「略」或 `// omitted`。
- 老師不喜歡打終端機：需要老師動手的事，做成「雙擊就跑」的工具，不要叫老師貼長指令。
- 省 token：不要整份讀 html／PROGRESS；大批文字修改一次做完；截圖有上限，先用 `qa_page.cjs` 擋掉明顯錯誤。品質永遠優先於省 token。

## 8. 專題規則（只有做到那一類才去讀舊版全文）

舊版全文：`docs/archive/AGENTS_V5_全文備份_20261120.md`，依章名搜尋。

| 做的是 | 去讀舊版的 |
|---|---|
| 電路動畫（電子流、轉角、元件位置、斷路） | 「第六定律之二｜電路動畫一律用電子流」、「2.2.1 電學語意色」 |
| 生物教材（真實圖像、版權、小構造局部放大） | 「第九定律之二｜生物教材」 |
| 練習題選項長度怎麼調 | 「8.2 選項長度平衡」「8.3 四選一」 |
| Hook 小單元分頁鈕配色細節、曉臻角色母版（Hook 本身以本檔 2.5 為準） | 「第五定律｜曉臻老師 Hook」「5.1 角色母版」 |
| 動畫穩定性細節（續播條件地雷、`killAllSims`、10.4／10.5 畫了不等於看得到） | 「第十定律」 |
| 預覽檔名與快取防護 | 「第十三律」 |
| Mac 雙擊錄音、BreezyVoice、GitHub Actions 單人旁白 | 「第十四律」 |

> 一句話：**不是把課本電子化，而是把好老師腦中的教學路徑程式化；AI 的工作是保護這條路徑，再把它表達得更清楚。**
