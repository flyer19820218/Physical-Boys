# 伽利略星球｜交接 HANDOFF

給接力的 Claude 帳號看。計畫本體在 `PLAN.md`，這份只記「現在做到哪、怎麼接、怎麼交」。**每次開工先領取、每次收工必交棒**，不然下一個帳號會重做或撞檔。

## 1. 現況看板

| 階段 | 內容 | 狀態 | 負責帳號／日期 | commit |
|---|---|---|---|---|
| 規劃 | `PLAN.md`、`HANDOFF.md` | 完成 | 2026-10-25 | （見日誌） |
| 前置 | 各課左上角「回單元總覽」箭頭 | 完成（139 課） | 2026-10-25 | `a5255b7` |
| P0 | 資料與檢查（`lessons.json`、`check_museum.cjs`） | 資料完成（`d7721ac`）；`check_museum.cjs` 未寫 | 2026-10-26 本對話 | — |
| P1 | 星球與漫遊 | 進行中：畫面層＋3D 已可跑（headless 目視通過）；缺 iPhone 15 實測 | 2026-10-26 本對話 | — |
| P2 | 物理與化學展品 | 未開工 | — | — |
| P3 | 地科與生物展窗 | 未開工 | — | — |
| P4 | 氛圍 | 未開工 | — | — |

**開工條件**：生物最後一課（人類與環境第 3 課，`biology_environmental_conservation.html`）動畫完成，且老師說「開始」。沒有老師的 GO，只能讀、不能動工。

狀態只用：未開工／進行中（寫帳號與日期）／完成／卡住（寫原因）。

## 2. 新帳號五分鐘上手

1. 讀 `AGENTS.md`：RED ZONE 與 Zero Touch（教材頁不能動）、第二定律的色票與字級、第四定律雙語、第八定律標題不用章節編號、13.5 多代理分工省 token。
2. 讀 `PROGRESS.md`（約 60 行以內的現況，其餘是歷史）。
3. 讀 `galileo-planet/PLAN.md`，重點是 §2 已定案決策、§5 效能預算、§8 驗收。
4. 看本檔 §7 工作日誌最上面幾筆，知道上一個帳號停在哪。
5. `git fetch origin main && git rebase origin/main` 取得最新版，再開始。

## 3. 接力規則

- **領取**：開工前先在 §7 日誌最上面加一行「領取：階段、帳號代號、日期」，並 commit＋push。已經有人「進行中」就不要同時做同一階段；不同階段如果互不依賴可以並行，但要在日誌寫清楚。
- **只動自己的檔案**：`index_museum.html`、`assets/museum/`、`tools/museum/`、`galileo-planet/`。**不要動 `index.html`、任何課程頁、`PROGRESS.md` 以外的共用檔**（四個帳號同時在改它們）。最終切換 `index.html` 要等老師明確說。
- **commit 小而勤**：一個功能一個 commit，commit 訊息寫清楚做了什麼，換人時才看得懂。每次推送前先 `git fetch origin main` 再 rebase。
- **收工交棒**：在日誌最上面加一筆，固定寫這幾項：做到哪／沒做完的／已知問題／下一步建議／檢查結果／最後 commit SHA。再把 §1 看板更新。
- **品質第一，不急**。`AGENTS.md` 13.5：老師的原則是省 token，但品質與省 token 衝突時品質優先。
- **分工建議**：3D 場景與互動的複雜模組（星球、攝影機飛行、arcball、各展品）用 Opus，一次只開一個 Opus；資料腳本、CSS、文案、檢查腳本、截圖用 Sonnet。給代理的簡報要精簡，只放這個任務需要的檔案與規則。
- **不確定就問老師，不要猜**：尤其是 `PLAN.md` §10 待確認事項。

## 4. 每次交棒前的檢查清單

- [ ] `node --check` 每個 `.js`（ES module 用 `node --check` 可能不通過，改用 `node --input-type=module --check < file`）
- [ ] 重跑 `tools/museum/build_lessons.*`，再跑 `node tools/museum/check_museum.cjs`，課數一致、無 404
- [ ] Playwright 桌機（1280）與手機（390）各截圖看過，主要畫面不重疊、字不被裁
- [ ] 沒有 console 錯誤（先擋掉 Google Fonts 的請求，環境連不到它）
- [ ] 四個 hash（`#physics #chemistry #earth #biology`）直接進館
- [ ] 沒有純黑 `#000`、觸控目標 ≥ 44px、預設繁體中文、EN 切換可用
- [ ] `?debug=1` 面板的三角形數與 draw calls 在 `PLAN.md` §5.3 預算內，把數字寫進日誌
- [ ] **請老師用 iPhone 15 開 `?debug=1`，把 FPS、發燙與手感貼回日誌**（沒有真機數字，不可說「效能沒問題」）
- [ ] 日誌與看板已更新、已 push

## 5. 環境與工具備忘

- 本機伺服器：`tools/qa/serve.sh`（`http://127.0.0.1:8765/`）。
- Playwright：`tools/qa/lib.cjs` 的 `launch()` 會找瀏覽器；Node 在 `/opt/node22/bin/node`。
- **雲端沙箱連不到 Google Fonts**，頁面載入會卡住：測試時要在 context 擋掉 `fonts.googleapis.com`／`fonts.gstatic.com`（`ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort())`），並用 `waitUntil: 'domcontentloaded'`。字體沒載到時，任何「字寬塞不塞得下」的結論都無效（`AGENTS.md` 10.5）。
- **雲端是軟體 WebGL**：若 headless Chromium 建不起 WebGL，試 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`。軟體算圖只能驗「畫得出來、沒報錯」，**幀率數字沒有意義**。
- 取得 Three.js：在暫存資料夾 `npm i three`，複製 `build/three.module.min.js` 與授權檔進 `assets/museum/vendor/`（npm 在沙箱允許清單內）。
- 課程頁封面有兩種來源：`assets/index_covers/...`（首頁卡片）與 `assets/covers/...`；`lessons.json` 的 `cover` 一律用首頁卡片實際使用的那一張。
- 檢查腳本放 `tools/museum/`；截圖與暫存放 scratchpad，**不要提交**。

## 6. 第一次開工（P0）逐步清單

1. `git fetch origin main && git rebase origin/main`。
2. 寫 `tools/museum/build_lessons.*`：解析 `index.html`（`PLAN.md` §3.1 的結構），輸出 `assets/museum/data/lessons.json`；缺英文、缺封面要列警告。
3. 寫 `tools/museum/check_museum.cjs`，先實作「課數一致」「檔案與封面都存在」兩項。
4. 跑起來，核對總數：物理 45、化學 31、地科 20、生物 43，共 139（以當時 `PROGRESS.md` 的表為準，新增課程會變多）。
5. 寫日誌、更新看板、commit、push。
6. 接著做 P1。P1 先出一個「能轉的球＋四座館＋能點進去看到 139 課」的最小版，丟給老師在 iPhone 看手感，再加搜尋、展品與細節。

## 7. 工作日誌（最新的在最上面）

### 2026-10-26　領取：P0＋P1（老師說 GO；單帳號 Sonnet 5.5 本對話）

- 生物最後一課（人類與環境第 3 課）13 個動畫已全部完成（`325c2e2`），開工條件成立。
- 進行中：P0 資料與檢查 → P1 星球與漫遊。一邊做一邊 commit／push。

### 2026-10-25　規劃完成（這份文件的作者）

- 與老師討論定案：伽利略星球、完整球體、卡通描邊、只放四座館、館內自由逛＋卡片漫遊、右上角舊版連結、先放 `index_museum.html`、iPhone 15 為效能基準。詳見 `PLAN.md` §2。
- 老師原先想把 130 課放在星球上讓學生點，後改成「學生只能點進四座館，想看全部簡介就一直滑」；理由是教材不會沒有退場空間，而且手機上更好點。**不要改回在球上放 139 個點。**
- 已完成前置：每課左上角房子右邊加「回單元總覽」箭頭（`assets/back_nav_1025_v1.css`＋每頁 `a.back-fab`，連到 `index.html#physics` 等；`index.html` 末尾有一小段 hash 處理）。commit `a5255b7`，驗證桌機與手機寬度四科各一課。限制：有電影封面的課，封面還在時房子與箭頭都被封面蓋住，點掉封面才能按（原設計）。
- 首頁沒列出的 10 頁（6 個 `…_preview1.html`、`mirrior_1`、`skyball`、`sun_trajectory_Tai`、`sun_trajectory_northpole`）沒加箭頭。若有人把預覽檔複製成正式檔，箭頭會消失；補法：重跑同樣的腳本邏輯（在 `home-fab` 後插入 `a.back-fab`、在 `home_nav_1011_v1.css` 後插入 `back_nav_1025_v1.css` 連結，已有的略過）。
- 還沒做、也不屬於這個計畫：「下一頁」按鈕（老師說等生物最後一個單元完成再做）。
- 2026-10-26：P0 資料完成；P1 完成 `index_museum.html`、`assets/museum/{museum.css,ui.js,museum_v1.js,scene.js}`、`vendor/three.module.min.js`（r170，老師手動下載附上，因雲端環境連不到 npm）。模組合併成 ui.js／museum_v1.js／scene.js 三檔，不是 PLAN 原本的拆法。
- 改版必同步更新版本字串 `?v=`：`index_museum.html`、`museum_v1.js`（含 VERSION 與 ui.js import）。目前 `20261026e`。
- headless（SwiftShader）檢查：星球、四館、館內展品圈、焦點展品轉到正前方皆正常；雲端 FPS 無意義。待老師用 iPhone 15 開 `index_museum.html?debug=1` 回報 FPS／calls／tris。
- 下一步：`tools/museum/check_museum.cjs`、P2 器材展品（目前展品是底座＋emoji 暫代）、星球上館與雲的視覺微調。
- 待老師確認的問題見 `PLAN.md` §10。

- 2026-10-26（晚）：依 PLAN §11 完成——球外 39 個單元地標（只看不能點）、進館轉成平面地圖（彎路＋編號單元站＋通往隔壁館的出口，館到館會先浮到星球外再降落）、寬螢幕（寬高比≥1.2 且寬≥700）卡片改左側直排。地圖直式／橫式依「扣掉卡片後的可用區」自動切換。拖曳＝平移地圖、滾輪／雙指＝縮放。
- 尚未做：走過打勾與「下一站」記錄（localStorage）、出口上的館名文字（目前只有表情符號）、物理／化學器材模型（P2）、`tools/museum/check_museum.cjs`。
- 場景現況：展品＝底座＋emoji；球外地標＝小塔＋emoji。
- 2026-10-26（深夜）：老師指示——星球改六角形磚（預設約 10 萬片，`?hex=NN` 可調，磚數≈10×NN²，例如 `?hex=60`≈3.6 萬）、拿掉四座館建築改用顏色分區、球面上直接看得到每館的路與單元站（和進館後的平面地圖同一條曲線，見 `curveFor`／`expDir`）。點球面任一處 → 進最近的館。**三角形預算放寬**：球外約 60.5 萬三角形（老師要求 10 萬片磚），iPhone 15 實測待回報；若不順，先試 `?hex=70`。版本字串 `20261026f`。
