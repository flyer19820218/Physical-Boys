# 3D 血液循環｜接力指南（給接手的 Claude）

最後更新：2026-11-22 晚。老師（Soulrunning，臺灣國中理化老師，用繁體中文溝通）同時請**兩個 Claude 帳號**接力：一個做**腎**，另一個繼續修小腸／肝與共用程式。請從這份開始，**不要重新探索整個 repo**。

## 0. 老師的指令（接手時直接照做，不用再問）
- 目標：把 `biology_human_transport.html`「全身怎麼送到？」分頁做成真實、醫學等級、非卡通的 3D 課：從主動脈 → 小動脈 → 目標器官 → 靜脈回心，標血管名稱、擴散物質、器官功能，血液一邊流一邊介紹。
- 六個交換區要一起升級：**心肌、肝、腎、肺、組織、小腸**。小腸（含肝）已有初版（靜脈口徑已依文獻修正，見第 5 節），其餘待做。
- **做完檢查 OK 就推上 main**（老師已授權；3D 預設仍是 2D，學生要按切換鈕才看得到）。舊 2D 版先留著，新版全上線、老師確認後才退役。
- **教學內容不可以錯。** 血管名稱、血流走向、血管粗細都要有出處：多來源查證、數字記下出處；查不到的就標「未查證」，不要寫成定論。
- 血管名稱用**大學教科書**（臺灣）用語；不確定時用泛稱（如「小動脈」）；國中課本寫法不同的加註。畫面只顯示 `LABEL_ALLOW` 允許清單內的名稱。兩位老師上課會說「名稱不用背，看流向和功能」。
- **動畫由 Opus 做，且同一時間只開一個 Opus agent；簡單小任務給 Sonnet。**
- 先讀 `AGENTS.md` 與 `PROGRESS.md` 前 30 行。重點：紅區不亂動、1080px、22px 最小字、不用 `#000`、雙語、步驟鈕 ≤5、學生模式播一步就停／老師模式連播、單一 rAF、分頁隱藏即停、改 js／css 要換 `?v=`。
- 有聲講解要等 3D 畫面全做完才重做；重做先推分支，老師說 OK 才進 main。

## 1. 兩個帳號同時做，怎麼不打架（重要）
- 每個器官場景**用自己的檔案**：場景檔 `ht3d_scene_<器官>_1122_v1.js`、中心線 `<器官>_centerlines_v1.json`、建構腳本 `tools/anatomy/build_<器官>_centerlines.py`。需要新模型就用自己的 glb（`<器官>_scene_v1.glb`）。
- **不要改**：`si_scene_v1.glb`、`si_parts_v1.json`（只讀）、小腸場景檔、`ht3d_core_1122_v1.js`、頁面接線檔。核心引擎需要改時，只做最小修改，並在 commit 訊息與回報裡寫清楚改了什麼（小腸／肝那邊的帳號也可能在改）。
- 共用且會碰到同一處的只有兩個：**場景登錄檔** `ht3d_scenes_1122_v1.js`（加一行）與 `PROGRESS.md` 最上面那一行。
- **每次 push 前先 `git fetch` ＋ `git pull --rebase origin main`**；衝突只會出在上面兩處，兩邊都保留。
- 分工現況：**腎＝另一個帳號**；肝獨立場景、核心引擎＝這邊。肺、心肌、組織、總覽之後再分。

## 2. Repo 與 Git
- Repo：`flyer19820218/Physical-Boys`（小寫 physical-boys 會轉址）。GitHub Pages 只部署 `main`。
- 沙盒工作樹通常在 `/home/claude/physical-boys`（不見了就用 `add_repo` 再 clone，先 `git pull`）。
- 推送：在別的分支工作就用 `git push origin HEAD:main`（老師已授權直接推 main）。
- Commit 結尾加：`Co-Authored-By: <你的模型名> <noreply@anthropic.com>` 與 `Claude-Session: <你的 session 網址>`。
- 更新 `PROGRESS.md`：在檔案最上面加一行「最後更新：日期（內容）」，其他課都這樣做。

## 3. 現有 3D 程式（全在 `assets/biology/anatomy3d/`）
| 檔案 | 用途 |
|---|---|
| `ht3d_core_1122_v1.js` | 引擎：場景、材質（邊緣光）、鏡頭關鍵格、沿中心線流動的紅血球（InstancedMesh）、CSS2D 標籤、放大窗（呼叫 2D 的 `HumanTransportExchanges.draw`）。通用，新場景不用改。 |
| `ht3d_scenes_1122_v1.js` | **場景登錄檔**：`export const SCENES = { <id>: { file, label:[中,英] } }`。加一行就多一個場景；兩個以上場景時，3D 舞台上方會出現場景切換鈕。 |
| `ht3d_scene_small_intestine_1122_v1.js` | 場景資料範本：`NAMES`／`LABEL_ALLOW`／`GROUPS`／`MATERIAL`／`BASE_STYLE`／`FLOW`／`LABELS`／`STEPS`／`SCENE`。**新場景照這個檔的格式複製。** |
| `ht3d_page_human_transport_1122_v1.js` | 頁面接線：切換鈕、場景鈕、步驟鈕、2D/3D 互斥、`window.HT3D`。場景可有自己的版權文字（`SCENE.schematic`＝[中,英]，沒寫就用預設）。 |
| `ht3d_1122_v1.css` | 樣式。 |
| `si_scene_v1.glb`（0.65MB）／`_lite.glb` | 97 個結構的解剖網格，**已含**冠狀動脈、左右腎動脈與分支、腎靜脈、腎臟（腎囊）、肺動脈幹、左右肺動脈、四條肺靜脈、各肺葉、心臟、肝、主動脈、下腔靜脈。心肌、腎、肺**不用再找素材**。 |
| `si_parts_v1.json` | 每個結構的類別、中心點、`bbox`、`zh_review` 標記（19 筆待確認名稱）。 |
| `si_centerlines_v1.json` | 48 段血流路徑（`kind／o2／source／schematic／points／radius`）。**每個新場景自己做一份。** |
| `sources.md` | 授權與改作說明（CC BY-SA 4.0；腎囊外形 CC BY 4.0）。新增結構與數字要補。 |
| `tools/anatomy/` | `extract_si_scene.mjs`、`build_si_centerlines.py`（中心線範本）、`dump_glb_world.mjs`。原始資料集在 GitHub `authorOd/3d-anatomy-atlas` 的 `packages/data/releases/1.2.0`（沙盒裡不一定還在，要的話重抓）。 |

**座標：** 公尺；+Y 向上、+Z 向前、+X 為人體左側；每個 glb node 是一個合併網格，頂點有量化，中心請讀 `si_parts_v1.json` 的 `centroid`／`bbox`。

**樣式鍵（每步 `style`）：** `<群組或id>: 0~1` 是透明度；`'deep.<群組或id>'` 讓目標器官顏色加深；`'glow.<群組或id>'` 讓講解中的血管發亮。三者隨步驟平滑過渡。血管透明度不要 ≥0.6（會開啟寫深度，把裡面的血球擋住）。

**公開介面：** `window.HT3D = { scenes, go(scene, step(從1起算), ms, {after:'loop'|'stop'}), pause(), resume(), isPlaying(), getState(), setLang(), dispose() }`。畫面完全由「場景＋步驟＋時間」決定（有聲講解之後直接用它切畫面）。

## 4. 新增一個器官場景（腎臟照這個做）
1. 複製小腸場景檔 → `ht3d_scene_kidney_1122_v1.js`；只改資料：`GROUPS`（要顯示的結構 id，例：腎動脈、腎靜脈、腎囊、腹主動脈、下腔靜脈）、`NAMES`／`LABEL_ALLOW`、`STEPS`（3～5 步，每步有 `camera` 關鍵格、`style`、`flows`、`labels`、`tracer`、`text`）、`SCENE`（`glb`/`parts` 可指向 `si_scene_v1.glb`／`si_parts_v1.json`，`centerlines` 指向自己的 json）。
2. 路徑：用 `build_si_centerlines.py` 為網格內已有的血管（腎動脈→腎靜脈→下腔靜脈）產生中心線，**半徑要取自網格**；資料集沒有的小分支與微血管用程式生成並**標「示意」**。
3. 文字：**沿用 2D 現有講解**（`HumanTransportExchanges` 的 `zones`，用 `firstPara('<區域id>')`），新寫的句子在 `text` 裡標 `src:'NEW'`，之後請老師看。
4. 名稱：每個新名稱查大學教科書用法，查不到官方出處的記入 `zh_review`，畫面不顯示。
5. 登錄：在 `ht3d_scenes_1122_v1.js` 加一行，例：`kidney: { file: './ht3d_scene_kidney_1122_v1.js', label: ['腎臟路線', 'Kidney'] }`。
6. 驗證（第 6 節）→ `git pull --rebase` → push main → 更新 `PROGRESS.md` 最上面一行。

## 5. 血管粗細與科學正確性（老師 2026-11-22 抓到的錯，必讀）
**發生什麼事：** 小腸／肝場景的靜脈看起來「變粗又變細、外面套一層膜、像水管」。原因：**畫面上的血管粗細來自 glb 網格外殼，但血球沿中心線流，中心線半徑是另外手填的數字，兩者對不上**；上游靜脈（肝門靜脈、腸繫膜上靜脈、脾靜脈）的數字又比文獻細很多。

**已修正（2026-11-22，小腸場景）：** 這幾條靜脈不再畫網格外殼，改畫成**單層管**，粗細全部依文獻：
- 場景檔的 `SCENE.replaceMesh = { <群組>: [<中心線區段 id>…] }`：列在裡面的群組，核心會丟掉資料集網格，改依中心線與其半徑畫一根變半徑的單層管（管壁＝血流範圍）；樣式鍵（透明度、`deep.`、`glow.`）照用原群組名。
- 半徑寫在中心線 json，由 `tools/anatomy/set_vein_calibers.py` 設定（可重複執行）；`tubeRange: [u0,u1]` 可限定管畫到哪裡（例：下腔靜脈畫到右心房開口、肝靜脈畫到下腔靜脈管壁）。數字與出處在 `sources.md`「血管口徑」。
- **新場景的靜脈請照這個做**，並且口徑要有出處；動脈若網格口徑與血流一致可繼續用網格。
- 血管透明度仍要 < 0.6，血球才看得見（≥0.985 會變不透明，把管裡的血球蓋住）。
- 還沒做：密集的肝竇網（門靜脈分支與肝動脈分支逐級分叉再逐級匯成肝靜脈）、肝靜脈往肝內延伸的分支形狀，留給肝臟獨立場景。

**所以新場景一定要：**
1. 中心線半徑與畫出來的血管一致（用上面的單層管做法，或半徑直接取自網格）；程式生成的示意管，口徑要有文獻出處，記在 `sources.md`。
2. **靜脈由小到大逐段匯集、愈靠近心臟愈粗**；中間隔著微血管床時才允許變細（微血管床要畫成密集分叉網，不能只畫幾條細圈圈）。分支匯入用平順的 Y 形接點。
3. 管壁與血流是同一根管（不要網格外殼＋另一層生成管＋血球三層疊在一起）。
4. 手機（430 寬）也要看一次再交件。

**已查證的科學事實（2026-11-22，查證來源見下）：**
- 肝門靜脈把胃腸道、膽囊、胰、脾的靜脈血送進肝；這些靜脈血全部匯入它，是**單一入口**（Wikipedia〈Portal vein〉、Colorado State VIVO〈Liver anatomy〉）。
- 肝的血量約 75% 來自肝門靜脈、約 25% 來自肝動脈；肝動脈是腹腔動脈幹（源自主動脈）的分支；兩者末梢在肝竇混合 → 中央靜脈 → 肝靜脈 → 下腔靜脈（StatPearls〈Physiology, Liver〉、VIVO、LibreTexts）。
- **腎、腿、骨盆、腹壁的靜脈血不經過肝**，直接進下腔靜脈。下腔靜脈在 L5 由左右總髂靜脈匯成，沿途匯入位置（由下往上）：L1–L5 腰靜脈、L2 右生殖腺靜脈、L1 腎靜脈與右腎上腺靜脈、T8 肝靜脈與膈下靜脈，T8 穿過橫膈入右心房。腎靜脈和肝靜脈之間除右腎上腺靜脈外沒有其他分支（Radiopaedia〈IVC〉、StatPearls〈Inferior Vena Cava〉、Elsevier Complete Anatomy、Cambridge〈Atlas of Surgical Techniques in Trauma〉）。
- 小腸吸收的**脂肪**（乳糜微粒）進乳糜管 → 腸繫膜淋巴管 → 胸管 → 左鎖骨下靜脈，**不走肝門靜脈**；短鏈、中鏈脂肪酸、單醣、胺基酸才走肝門靜脈（Wikipedia〈Lacteal〉、PMC7000543、SUNY Lumen Learning Nutrition）。**教學文字不要寫成「所有養分都走肝門靜脈」。**

**口徑文獻值（成人超音波／影像的平均或正常範圍，各研究族群不同、會隨呼吸變動，只當量級參考）：**
| 血管 | 文獻值 | 出處 |
|---|---|---|
| 肝門靜脈 | 正常約 7–13 mm（超音波），CT 平均 15.5 mm | Radiopaedia〈Portal vein〉、Springer Abdom Radiol s00261-016-0785-9 |
| 脾靜脈 | 超音波正常上限約 10 mm | Haffar〈Doppler of the portal system〉 |
| 腸繫膜上靜脈 | 一篇影像研究約 11 mm | PMC9748017 |
| 肝靜脈 | 一篇超音波研究平均約 8.6 mm；中肝靜脈約 6 mm | repository.sustech.edu、PMC4282232 |
| 下腔靜脈 | 平均 13.8 mm（腎靜脈以下量）；肝內段約 19 mm | PMC3463481、PMC4282232 |
- **沒查證的：** 下腔靜脈各段的精確逐段口徑（沒有單一權威來源，只能依匯入的血流量示意性逐段變粗，並標「示意」）；腎動脈、腎靜脈的口徑與腎臟內部血管（葉間動脈、弓狀動脈等）的名稱與走向——**腎的內容請接手者自己查證並把出處記下來**；直腸下段等少數不經肝的旁路沒有逐條核對，國中教學可省略。

## 6. 驗證方法（不要重新摸索）
- 啟動伺服器：`tools/qa/serve.sh`（Port 8765；ES 模組不能用 `file://`）。
- 2D 回歸：`node tools/qa/qa_page.cjs biology_human_transport.html`，結果要與改動前逐項相同（只差動畫像素數）；另跑 `node tools/qa/smoke.cjs biology_human_transport.html`。
- 3D 截圖：Playwright chromium 要加旗標 `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --use-gl=angle`。沙盒是軟體算圖，**動畫時間幾乎不走**，所以一律用 `HT3D.go('<場景>', 步驟, 毫秒, {after:'stop'})` 跳到指定時間，再等約 5 秒讓畫面更新；`getState()`／DOM 讀到的值可能落後一次切換。
- 手機尺寸截圖：視窗約 430 寬、`hasTouch:true`、`deviceScaleFactor:3`，**不要開 `isMobile:true`**（它會讓 `getBoundingClientRect` 和截圖的位置差一大段）。`HT3D.go` 後 `scrollIntoView({block:'center',behavior:'instant'})`（頁面是平滑捲動，不加 instant 量到的位置會是捲動中途的），等約 1.5 秒再量舞台 canvas 的矩形；用 `page.screenshot()` 截整個視窗後自己裁切（`clip` 參數會偏）。
- 近距離看血管：`const V=HT3D._debug.viewer(); V.camera.position.set(x,y,z); V.controls.target.set(x,y,z); V.controls.update(); V.controls.dispatchEvent({type:'start'}); V.requestRender()`（dispatch `start` 讓引擎知道是使用者鏡頭，不會被步驟鏡頭拉回去）。粒子是否在管腔內：`HT3D._debug.lumen(300)`（沿管軸方向的射線打不到管壁，所以兩支血管交會處會有少數誤判，不用在意）。
- 多場景切換測試：暫時在登錄檔加一個指向同一場景檔的第二筆，跑完**一定要還原**，不能把測試項目 commit。
- 乾淨 clone 驗證：`git clone` 到暫存資料夾、另開 port 跑一次載入，看 `HT3D.getState().ready === true` 且無 404。
- 沙盒的雲端瀏覽器**沒有 WebGL**，線上實際 3D 只能請老師用電腦／iPad 看；那裡只會看到「已切回經典 2D 版」的提示（正確的退回行為）。iPad 真機效能還沒測過。
- 看圖很花額度：只看關鍵步驟的截圖。

## 7. 待辦（依序）
1. ~~小腸／肝：修口徑、去掉外層膜~~（2026-11-22 已完成，見第 5 節）。
2. 腎臟：腎動脈 → 腎臟（過濾；尿素、水、無機鹽）→ 腎靜脈 → 下腔靜脈（**另一個帳號負責**）。
3. 肝臟獨立場景（含密集肝竇網、肝靜脈往肝內的分支；這邊負責）。
4. 肺：肺動脈 → 肺泡微血管（O₂ 進、CO₂ 出）→ 肺靜脈 → 左心房。
5. 心肌：左心室 → 主動脈根部 → 左右冠狀動脈 → 心肌微血管 → 冠狀靜脈竇 → 右心房。
6. 組織（全身組織微血管）。
7. 「完整封閉路線」3D 總覽。
8. iPad 實測與 lite 模式門檻。
9. 有聲講解重做；先推分支，老師說 OK 才進 main。
10. 全部完成且老師確認後，退役舊 2D 版。

## 8. 老師尚未回覆的決定（先沿用目前做法，不要自己決定）
放大窗字約 19px（< 22px）；3D 寫「下腔靜脈（國中課本：下大靜脈）」而 2D 舊版寫「上／下大靜脈」；新文案（含「名稱不用背，看流向」提示與依據說明）待老師看過；標「示意」的程式生成部分是否接受；19 筆 `zh_review` 名稱；是否改成預設 3D（`DEFAULT_3D`，目前 false）；是否加乳糜管、胺基酸、肝竇內容。

## 9. 給接手者的提醒
- 老師說「一次做完」，但額度有限：每完成一個器官就推 main、更新 `PROGRESS.md`，不要累積。
- 回報用繁體中文、簡短：做了什麼、檢查結果、什麼沒驗證到、需要老師決定的事。
- 不要把 3D 的授權說明刪掉；放大窗開啟時畫面左下說明字會淡出，授權仍在頁面下方「操作提示與圖像來源」區。
- 老師不喜歡打終端機；需要他動手的事做成「雙擊就跑」，不要叫他貼長指令。
