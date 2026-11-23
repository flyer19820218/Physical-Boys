# 3D 解剖資料來源與授權（小腸血液循環場景 si_scene_v1）

這個資料夾放「生物的運輸」血液循環重製要用的真實 3D 解剖網格。全部從開源解剖資料集抽出，**不是老師或 AI 原創**，也**不是教科書圖像**；授權獨立於本 repo 的程式碼。

## 檔案

| 檔案 | 說明 |
|---|---|
| `si_scene_v1.glb` | 完整版：97 個 node（一個結構一個 node），109,662 個三角形，約 0.65 MB |
| `si_scene_v1_lite.glb` | 輕量版（iPad 備援）：同樣 97 個 node，51,015 個三角形，約 0.39 MB |
| `si_parts_v1.json` | 每個結構的 id、英文名、繁體中文名、分類、三角形數、bbox、centroid、授權、備註；`zh_review: true` 的中文名待老師審 |
| `si_centerlines_v1.json` | 由 `si_scene_v1.glb` 網格自動估出的血管中心線（`schematic:false`）＋程式生成的示意小分支（`schematic:true`：小動脈、腸壁微血管、小靜脈、肝臟內路徑）；給 3D 血流粒子用。由 `tools/anatomy/dump_glb_world.mjs`＋`tools/anatomy/build_si_centerlines.py` 產生（2026-11-22）。中心線是網格的衍生資料，同樣以 CC BY-SA 4.0 提供 |
| `sources.md` | 本檔 |
| `../../../tools/anatomy/extract_si_scene.mjs` | 抽取腳本（可重跑，用法見最後一節） |

glb 格式：node 名稱 ＝ 資料集的結構 id（例如 `cardiovascular.superior_mesenteric_artery`）；座標沿用資料集：**公尺、+Y 向上、+Z 向前、+X 為人體左側、原點在兩腳跟之間的地面**。頂點已量化（`KHR_mesh_quantization`，16 位元）並用 `EXT_meshopt_compression` 壓縮，兩者都是 required：載入時要設定 meshopt 解碼器（three.js：`GLTFLoader.setMeshoptDecoder(MeshoptDecoder)`）。量化會讓每個 node 帶有平移與縮放，用來還原成上述世界座標，所以直接用 node 的世界矩陣即可；不要把 `node.position` 當成結構中心（中心請讀 `si_parts_v1.json` 的 `centroid`／`bbox`，單位公尺）。

## 資料來源（版本）

- 資料集：Svitylo **3D Anatomy Atlas** 的資料包 `packages/data/releases/1.2.0`（model `adult-male`、channel `preview`、generatedAt 2026-09-24T22:33:43Z、contentHash `2e741c8eec5921ffb650b8e038728c7e9f1a57bc655fd2eea8d01edd62d3d4fc`）。
- 資料集 repo：<https://github.com/authorOd/3d-anatomy-atlas>，抽取時的 commit：`4704dc61f7f9929e119ec19a57d4c497e093ddb4`（2026-11-08，Merge pull request #15）。只用「資料」，沒有用該專案的程式碼（程式碼授權是 CPAL-1.0，與本資料夾無關）。
- 上游模型：**Z-Anatomy**（<https://github.com/Z-Anatomy/Models-of-human-anatomy>，commit `e38ea5e6c7e22d229a975f3fde563a5aca52099e`，Startup.blend 日期 2023-05-02），再往上游是 **BodyParts3D**（The Database Center for Life Science）。
- 腎臟：**Human Reference Atlas** 的 3D Reference Organ（Kidney, Male, Left／Right v1.3），資料集已把它放進 Z-Anatomy 的身體。
- 使用的是資料集的 `standard` 品質檔（沒有用 `economy`）。
- **資料集本身是 preview 版**：它自己的授權稽核（licence audit）尚未完成，也沒有做過完整的解剖學審查（結構名稱與幾何都是「未審」狀態）。教學使用前，解剖正確性仍請老師把關。

## 授權

| 部分 | 授權 | 對應 node |
|---|---|---|
| Z-Anatomy（衍生自 BodyParts3D）的幾何與結構名稱 | **CC BY-SA 4.0** | 除腎臟以外的所有 node |
| Human Reference Atlas 腎臟 | **CC BY 4.0** | `visceral.fibrous_capsule_of_kidney_l`、`visceral.fibrous_capsule_of_kidney_r` |

BodyParts3D 原本是 CC BY 4.0（Z-Anatomy 改作時為 CC BY-SA 2.1 Japan），Z-Anatomy 以 CC BY-SA 4.0 釋出；因此**整份衍生成品（兩個 glb 與 `si_parts_v1.json`）以 CC BY-SA 4.0 提供**（腎臟那兩個 node 的來源本身是 CC BY 4.0，併入後仍在本成品的 CC BY-SA 4.0 之下一起散布）。授權全文：<https://creativecommons.org/licenses/by-sa/4.0/>（腎臟：<https://creativecommons.org/licenses/by/4.0/>）。

資料集裡另有兩項非商業（NC）授權的素材（內耳、Lissie Cowley 腎臟），資料集標示為 `included: no`，**本場景沒有使用**。

## 署名文字（照資料集 ATTRIBUTION.md 原文）

使用本資料的頁面或影片，請保留下列署名（也已寫進兩個 glb 的 `asset.copyright`）：

> “Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas.

腎臟另加：

> Browne K., Schlehlein H., “3D Reference Organ for Kidney, Male, Left v1.3” (doi:10.48539/HBM759.JKKF.434) and “… Right v1.3” (doi:10.48539/HBM364.QTSC.334); “3D Reference Organ for Ureter, Male, Left v1.2” (doi:10.48539/HBM434.VLQJ.299) and “… Right v1.2” (doi:10.48539/HBM852.SVFJ.388); Human Reference Atlas, CC BY 4.0. Adapted for Svitylo 3D Anatomy Atlas.

（原句同時列了輸尿管；本場景沒有用輸尿管，為求逐字一致整句保留。）

## 改作說明

上游（資料集）已做的改作，依 ATTRIBUTION.md 原文摘錄：

> Changes: Modifiers evaluated in Blender (subdivision capped at level 1) and curves converted to their bevelled surfaces; declared geometry corrections (sources/geometry-fixes.json, listed in the coverage report and noted in the structure cards): the teaching window in the anterior wall of the stomach and its mucosa closed with a patch that continues the wall, the lower end of the oesophagus blended into the cardiac opening, the lower edge of the laryngopharynx laid onto the oesophagus, and the lower end of the small intestine blended onto the ascending colon; converted to +Y up, metres, origin on the floor between the heels; each structure simplified into two quality levels with meshoptimizer; merged into region chunks with quantisation and EXT_meshopt_compression; hierarchy and names moved into the manifest and dictionaries; display colours assigned by material name.

腎臟的上游改作（置入 Z-Anatomy 身體、等比縮放與位移、必要時內凹最多 6 mm、焊接重複頂點、重算法線等）見資料集 `ATTRIBUTION.md` 的 “3D Reference Organs: Kidney v1.3 and Ureter v1.2” 一節。

本專案（`tools/anatomy/extract_si_scene.mjs`）再做的改作：

1. **挑選**：從 4,484 個結構中只取 95 個結構 id；另有 2 個衍生 node（下述第 3、4 點）＝ 共 97 個 node：主動脈與弓上分支、腹腔動脈幹系、腸系膜上／下動脈系、腎動脈、肺動脈幹與左右肺動脈、冠狀動脈、肝門靜脈系、腔靜脈、肝靜脈、腎靜脈、肺靜脈、心臟四腔與主動脈瓣、十二指腸、空腸、肝、胃、胰、脾、大腸（升、橫、降、乙狀結腸、闌尾）、腎（以腎纖維囊外形代表）、肺五葉、橫膈。
2. **還原座標**：資料集的 chunk 檔是「一個 chunk 一個合併 mesh」，每個頂點帶 `_ID` 屬性（全域 mesh 編號）；依 `_ID` 把頂點與三角形分回各結構，再把 chunk node 的平移與縮放乘回頂點，得到公尺座標。座標系沒有改。
3. **切分小腸（衍生 node `visceral.ileum`，且 `visceral.jejunum` 只剩近端）**：資料集的空腸與迴腸是**同一條曲管**（資料集沒有獨立的迴腸）。本專案沿管腔長度，從靠近十二指腸的那一端起算，在約 **2/5** 處用等值線切開：近端約 2/5 命名為空腸，遠端約 3/5 命名為迴腸（教科書常見比例）。切口兩側共用同一圈頂點、沒有縫隙；**分界位置是示意，不是解剖邊界**。
4. **合併軀幹體表（衍生 node `regions.torso_surface`）**：把資料集「胸部、腹部、背部、會陰」共 42 塊體表分區（`si_parts_v1.json` 的 `merged_from` 有完整清單）合併成一個外形殼，只作定位背景；沒有頭與四肢。
5. **weld、simplify**：每個結構各自用 glTF-Transform 的 `weld` 與 `simplify`（meshoptimizer）處理；血管與腸管鎖住開口邊界，端點不縮短。完整版的誤差上限：血管 0.03 mm、器官 0.1～0.2 mm、軀幹體表 1.5 mm（並限制保留 40%）；輕量版：血管 0.2 mm、器官 1.2 mm、肺／大腸／橫膈 2 mm、軀幹體表 3 mm（保留 15%）。以資料集 standard 檔為基準，實測最大偏差（簡化後表面到原始頂點的最大距離）：完整版血管 ≤ 0.27 mm、器官 ≤ 1.2 mm、體表 ≤ 2.3 mm；輕量版血管 ≤ 0.41 mm、器官 ≤ 3.1 mm、體表 ≤ 4.3 mm。簡化前後每個結構的連通塊數相同（沒有被切斷）。
6. **quantize、meshopt 壓縮**：位置 16 位元量化，法線 8 位元，頂點索引 16 位元。
7. **顯示色**：glb 內每個 node 有一個簡單材質（動脈紅、靜脈藍、各器官不同底色），只是預設值，檢視器可以覆蓋。這些顏色是本專案自行指定，不是資料集的顯示色。

## ShareAlike（相同方式分享）注意事項

以下是素材使用上的整理，不是法律結論：

- 兩個 glb 與 `si_parts_v1.json`（內含 Z-Anatomy 的英文結構名稱）都是 CC BY-SA 4.0 的**衍生資料**：再散布時要維持 **CC BY-SA 4.0**、保留上面的署名與改作說明、並標示「有被修改過」（本檔與 glb 的 `asset.copyright` 已寫明）。
- 若有人再對這些模型做改作（再簡化、再合併、換成別的格式）並散布，改作成品同樣要以 CC BY-SA 4.0 提供。
- 課程頁面若載入這些模型，請在頁面上放可見的署名與授權連結（例如收合的「圖像來源」區塊），不要把它標成 AI 原創或公共領域。
- 不要把這些資料和非商業（NC）授權的素材混成同一個改作成品。
- 只拿這批資料當「背景素材」放進課程頁面，與把頁面本身整體改授權，兩者是否構成「改作」，請找懂授權的人確認；老師若計畫商業合作或上架平台，建議先確認。
- 資料集的授權稽核仍是 pending（見上），若日後資料集更新授權資訊，請回頭更新本檔。

## 血管口徑（門脈—肝—下腔靜脈這條回流路線，2026-11-22 修正）

**為什麼改：** 老師看手機畫面發現靜脈「忽粗忽細、外面套一層膜、像水管」。成因是畫面上的血管粗細原本來自資料集的網格外殼，而血球沿中心線流動的半徑是另一組數字，兩者對不上（例：肝靜脈網格外殼約 23 mm 寬，血球管只有 6.6 mm）；上游靜脈又比文獻細很多（肝門靜脈 5.4 mm）。

**現在的做法：** 肝門靜脈系統（腸繫膜上靜脈、脾靜脈、肝門靜脈）、肝靜脈、下腔靜脈**不再畫資料集的網格外殼**，改由核心引擎（`ht3d_core_1122_v1.js` 的 `replaceMesh`）依中心線與下表半徑畫成**單層管**，管壁＝血球流動範圍。半徑寫在 `si_centerlines_v1.json`，由 `tools/anatomy/set_vein_calibers.py` 產生（可重複執行；重建中心線後要再跑一次）。這幾條靜脈因此是**程式生成的示意管**（形狀來自網格估出的中心線，粗細來自下表），不是資料集網格。

| 區段 | 畫面直徑（mm） | 依據（成人超音波／影像，只當量級參考；各研究族群不同、隨呼吸變動） |
|---|---|---|
| 腸繫膜上靜脈 | 7 → 9.5（由下往上變粗） | 一篇影像研究約 10.7–11.5 mm（PMC9748017）；**我們取較小值，屬示意** |
| 脾靜脈 | 6.5 → 8 | 超音波正常上限約 10 mm（Haffar〈Doppler of the portal system〉）；上限以下的示意值，**沒有找到「典型值」出處** |
| 肝門靜脈 | 10（接近肝門處收窄到約 6.4） | 正常約 7–13 mm（Radiopaedia〈Portal vein〉）；平均 9.60 ± 1.41 mm（PMC5398464）、10.27 ± 1.78 mm（PMC6988463）；CT 平均 15.5 mm（Abdom Radiol, s00261-016-0785-9）。收窄是為了接肝內分支，示意 |
| 肝內示意路徑 | 入口 5.0 → 中段 1.6 → 出口 4.0 | **沒有文獻值**。肝竇是微血管網，這裡只畫成 4 條示意管；入口 4 條合計截面積＝肝門靜脈末端、出口每 2 條合計截面積＝1 條肝靜脈起點（面積守恆，只為了接得順） |
| 肝靜脈 | 5.6 → 8.4 | 一篇超音波研究平均約 8.6 mm、近下腔靜脈端約 8.4 mm、遠端約 4.7 mm（repository.sustech.edu〈Measurements of Normal Hepatic Veins in Sudanese using Ultrasonography〉）；中肝靜脈約 6.0 mm（PMC4282232） |
| 下腔靜脈 | 腎靜脈以下 14 → 腎靜脈匯入後約 16 → 肝靜脈匯入處約 19 → 近右心房約 20 | 腎靜脈以下量到平均 13.8 mm（PMC3463481）；肝內段約 19.4 mm（PMC4282232）。**腎靜脈處的階梯與逐段數值是依匯入血流量的示意，沒有逐段文獻值** |

**匯入位置（結構順序依據）：** 下腔靜脈由下往上依序接 L1–L5 腰靜脈、L2 右生殖腺靜脈、L1 腎靜脈與右腎上腺靜脈、T8 肝靜脈與膈下靜脈（Radiopaedia〈IVC〉、StatPearls〈Inferior Vena Cava〉）。

**修正前的數字（留作對照）：** 肝門靜脈 5.4、腸繫膜上靜脈 3.0–5.4、脾靜脈 2.4–3.6、肝靜脈 6.6、下腔靜脈 17–22 mm（網格外殼：肝靜脈 23 mm 寬、下腔靜脈腹部 18 mm／胸部 26 mm）。

**沒做的（已於下一節「肝臟場景」補上示意版）：** 密集的肝竇網（門靜脈分支與肝動脈分支逐級分叉，再逐級匯成肝靜脈）；肝內靜脈的真實分支形狀（仍是示意，不是真實解剖）。

## 腎臟場景（`ht3d_scene_kidney_1122_v1.js`，2026-11-22）

模型沿用 `si_scene_v1.glb`／`si_parts_v1.json`（左右腎動脈與前後支、左右腎靜脈、腎纖維囊、腹主動脈、下腔靜脈都已在裡面，沒有新增或改動模型）。新增兩個衍生檔：

| 檔案 | 說明 |
|---|---|
| `kidney_centerlines_v1.json` | 58 段血流路徑，由 `tools/anatomy/build_kidney_centerlines.py` 產生（用法在腳本開頭）。**mesh 段**（`schematic:false`）：心室出口→主動脈（到腎動脈起點高度）、腹主動脈下段、左右腎動脈主幹與前後支、左右腎靜脈（腎門→下腔靜脈軸）、下腔靜脈（腎靜脈匯入處以下／以上）；中心線與半徑都由網格估出（半徑＝垂直切面環面積換算），不手填。**generated 段**（`schematic:true`）：腎臟內部的示意路徑（左腎 5 支、右腎 3 支，每支＝小動脈 `kart_`、腎絲球 `kglom_`、出球小動脈與管周微血管網 `kcap_`、小靜脈 `kven_`），以及下腔靜脈上端接右心房的一小段。中心線是網格的衍生資料，同樣以 CC BY-SA 4.0 提供。 |
| `ht3d_scene_kidney_1122_v1.js` | 場景資料（名稱、群組、材質、血流、步驟、標籤、說明文字）。 |

### 網格量到的口徑（`kidney_centerlines_v1.json`；直徑＝2×半徑）

| 血管 | 模型（網格） | 文獻 | 備註 |
|---|---|---|---|
| 左腎動脈主幹 | 半徑 3.45–4.85 mm（直徑約 7–10 mm，起點有開口喇叭） | 直徑 5–6 mm（Radiopaedia〈Renal artery〉）；左側平均 5.4 ± 1.2 mm（n = 1000，PMC6541921）；另有研究右 4.5、左 5.0 mm（Appl. Sci. 15(18):9967）、6.7／6.8 mm（PMC5648969） | 模型比文獻平均粗約三成，量級相符；**沿用資料集網格，未縮放** |
| 右腎動脈主幹 | 半徑 2.90–6.26 mm（起點喇叭） | 同上 | 同上 |
| 腎動脈前後支 | 由分叉處約 3.4 mm 漸縮到末端約 0.3–0.5 mm | 文獻：分支平均直徑 4.0 mm（PMC6541921） | 資料集把分支做成逐漸收尖，末端不是真實口徑 |
| 左腎靜脈 | 半徑 2.4–4.3 mm | **未查證**（找不到可信的口徑數值） | 長度：模型約 6 cm；文獻平均約 7.5–8.5 cm（Lumen Loyola；StatPearls） |
| 右腎靜脈 | 半徑 2.4–6.2 mm（接下腔靜脈處網格變寬） | **未查證** | 長度：模型約 3.3 cm；文獻約 2–4 cm（StatPearls；Korean J Radiol 2010）✔ |

**畫出來的半徑（2026-11-22 修正「外管」與突然變細）**：腎動脈主幹、前／後分支、腎靜脈原本畫資料集的網格外殼，外殼在分支處忽粗忽細、末端是平口，裡面又接程式生成的細管，看起來像細管插進外管。現在這幾條改畫成單層、圓頭、半徑漸變的管（核心 `replaceMesh`＋`smoothTubes`），中心線 JSON 的 `radius`＝繪製半徑，`radius_mesh`＝原網格估計值。繪製半徑的算法：網格估計值移動平均（5 點），動脈再取「只會變細」（累積最小值）並限制 ≤ 4.9 mm，靜脈取「只會變粗」並限制 ≤ 4.4 mm；前／後分支不超過主幹末端。結果：左腎動脈 4.8→3.5 mm，左／右分支 3.2／2.8→0.5 mm，腎靜脈 2.5→4.1／4.4 mm。網格原值的右腎動脈起點 6.3 mm、右腎靜脈近下腔靜脈 6.2 mm 是網格貼在大血管壁上變寬的假象，已不採用。**這些繪製半徑是依網格估計值整理的示意值，腎靜脈口徑文獻值仍未查證。** 腎動脈從主動脈壁外 3 mm、腎靜脈到下腔靜脈壁外 2.2 mm 才畫出管子（`tubeRange`），圓頭貼著大血管壁；血球仍沿完整中心線流動。

腎臟內部（葉間動脈、弓狀動脈、小葉間動脈、入球／出球小動脈、管周微血管、小葉間／弓狀／葉間靜脈）的**口徑與走向資料集沒有，也沒查到可直接採用的數值**：場景裡一律是程式生成的「示意」，口徑為了看得見而**放大**。畫法（2026-11-22 第三次重畫接點，參考血管鑄型電子顯微鏡圖與解剖教科書插圖——分支都是從主幹「順著方向慢慢分出去」，不是管對管硬插）：

1. **切線相接（G1 連續）**：每個接點兩條管的切線方向相同（腳本 `depart`／`arrive`：先沿上游切線走一小段，再用 smoothstep 平滑過渡到自己的走向）。前／後支離開腎動脈、小動脈離開前／後支、腎絲球出口接微血管、微血管併入小靜脈、小靜脈併入腎靜脈，全部如此。
2. **半徑連續、符合 Murray 定律**：分叉處 母管半徑³ ＝ 子管半徑³ 之和（Nordsletten 2006 在大鼠腎血管量到相符；本場景是示意，採用定律而非量測值）。小動脈 0.52→0.40 mm（起點＝前／後支末端半徑÷條數^(1/3)）；腎絲球管 0.40→0.32 mm；微血管 0.32→0.27→0.32 mm；小靜脈從 0.32 mm 起算，每併入一條微血管依 r³ 相加變粗，併完後平滑長到 1.3 mm 接腎靜脈（再依腎靜脈上逐一匯入的小靜脈數 Murray 變粗到 2.5–4.1 mm）。**這些都是示意用數字，不是量測值。**
3. **逐一匯入**：同一支的 2～3 條微血管不是擠進同一點，而是每隔 4.5 mm 依序併入小靜脈（像支流匯入河道）；5 條（右腎 3 條）小靜脈也每隔 3.5～4 mm 逐一匯入腎靜脈（`JOIN`）。
4. **管口不鼓球**：兩段同半徑、同軸相接的接點，兩邊都不封圓頭（JSON 段的 `capStart`／`capEnd: false`）；埋進大血管壁的管口（腎動脈起端、腎靜脈末端、微血管併入小靜脈處）也不封，圓頭只留在游離的末端。
5. **微血管是寬鬆的髮夾彎**：離開腎絲球的方向與回小靜脈的方向相反，所以控制點沿兩端切線拉長（約為兩端距離的 0.55 倍，5–9 mm），彎的曲率半徑遠大於管半徑，不會有「球」或折角。
6. 腎絲球畫成約 3 mm 的螺旋（真實約 0.2 mm），螺旋兩端半徑的斜率為 0（sin² 包絡），才接得上入球小動脈與微血管。

畫面標籤都帶「（示意）」。走向只畫到「從腎門分支→往皮質走→腎絲球→微血管網→回腎門匯入腎靜脈」這個層級，各支的分叉位置、數量（左 5、右 3）都是示意，不是解剖資料。腎內路徑的驗證：每個點必須落在腎纖維囊網格的凸包內（內縮 0.5 mm；腎囊在腎門處有開口，射線法不可靠；起點在腎門的前 8 mm 與小靜脈最後 50 mm［通過腎門開口］不檢查）。

### 這個場景用到的科學敘述與出處（2026-11-22 查證）

- **腎動脈**直接從腹主動脈側面分出，約在第 1～2 腰椎高度、位於腸繫膜上動脈起點下方；右腎動脈較長、斜向下、從下腔靜脈與右腎靜脈後方經過；左腎動脈較短、較水平、在左腎靜脈後方。長約 4–6 cm、直徑約 5–6 mm。（Radiopaedia〈Renal artery〉；Hazırolan et al., Diagn Interv Radiol 2011;17:67–73）
- **腎臟血流量**約佔心輸出量的 20–25%（約每分鐘 1.0–1.1 公升）。（StatPearls〈Physiology, Glomerular Filtration Rate〉NBK500032；OpenAnesthesia〈Renal anatomy and physiology〉；Cambridge〈Renal Physiology〉）
- **腎內血管順序**：腎動脈→節段動脈→葉間動脈→弓狀動脈→小葉間動脈→入球小動脈→腎絲球（毛細血管團，直徑約 200 µm）→出球小動脈→管周微血管與直小血管→小葉間靜脈→弓狀靜脈→葉間靜脈→腎靜脈；沒有節段靜脈。每個腎臟約 130 萬個腎元。（Lumen Learning〈Gross Anatomy of the Kidney〉；Wikipedia〈Renal circulation〉；JoVE 29.4）
- **過濾**：每天約濾出 180 公升（GFR 約 120–125 mL／分），尿約 1.5 公升／天，其餘 99% 以上在腎小管被再吸收回血液；水、尿素、葡萄糖、無機鹽等小分子可通過，血球與多數大型蛋白留在血管內。（StatPearls 22278；NBK500032；Open Textbook〈Organised life of animals〉）。**本課程把腎臟過濾與再吸收列為「延伸閱讀／不考」**，3D 場景沿用 2D 頁面既有的延伸畫面與句子。
- **腎靜脈**：每腎一條；左腎靜脈比右側長（約 3 倍；文獻約 7.5 cm 對 2.5 cm），從腹主動脈前方、腸繫膜上動脈下方通過，從內側進下腔靜脈，沿途接左腎上腺靜脈、左生殖腺靜脈；右腎靜脈短，約在第 1 腰椎高度進下腔靜脈，沒有其他支流。（Loyola Lumen〈Renal veins〉；StatPearls〈Renal Vein〉article-28373；Korean J Radiol 2010 11(3)）
- **不經過肝**：腎、腿、骨盆、腹壁的靜脈血直接進下腔靜脈，穿過橫膈進右心房。（接力指南第 5 節所列：Radiopaedia〈IVC〉、StatPearls〈Inferior Vena Cava〉）

### 名稱

畫面只顯示：腎動脈、腎靜脈、腎臟、腹主動脈、主動脈、下腔靜脈（國中課本：下大靜脈）、左心室、右心房，以及帶「（示意）」的泛稱：腎內小動脈、腎絲球（也稱腎小球；2D 頁面既有用語為「腎絲球」）、微血管、腎內小靜脈。葉間／弓狀／小葉間／入球／出球等大學用語只用在說明文字的口語帶過，**不當標籤**；這些名稱的臺灣教科書用法尚未逐一核對，列入待老師審。

### 本場景對引擎的最小修改（commit 內也有說明）

- `ht3d_core_1122_v1.js`：放大窗規格可帶 `tag: [中, 英]`，有就用它當放大窗標題，沒有就維持原本的「肝細胞／絨毛」判斷（小腸場景行為不變）。
- `ht3d_page_human_transport_1122_v1.js`：放大窗種類 `kidney_filter` 對到 2D 腎臟「延伸（過濾與再吸收）」畫面；`kidney` 維持「腎細胞交換」畫面。

## 肝臟場景（`ht3d_scene_liver_1122_v1.js`，2026-11-22）

模型沿用 `si_scene_v1.glb`／`si_parts_v1.json`（沒有新增或改動模型）。新增兩個檔：`liver_centerlines_v1.json`（476 段血流路徑，由 `tools/anatomy/build_liver_centerlines.py` 產生，固定亂數種子、約 15 秒，用法在腳本開頭）與場景檔。

**肝內的一切都是示意，不是真實解剖。** 資料集的肝臟只有外形，沒有任何肝內血管；肝內分支用「空間殖民（space colonization，Runions 等人 2007）」在肝臟網格內長出門靜脈樹與肝靜脈樹兩棵互相競爭的樹，肝動脈樹貼著門靜脈樹並行，分叉口徑用 Murray 定律 r<sub>父</sub><sup>3</sup> ＝ Σ r<sub>子</sub><sup>3</sup>（2026-11-23 起；先前用指數 2.7；與腎臟、肺臟場景一致，出處見「腎臟場景」；示意，不是量測值）。終端分支半徑：門靜脈 1.25 mm、肝靜脈 1.65 mm、肝動脈 0.43 mm（由肝門 4.6 mm、右肝靜脈 4.4 mm、固有肝動脈 1.6 mm 依終端數 50／19／50 推回，示意）。

**接點畫法（2026-11-23，老師要求「由粗到細、不要套管子」，參考全身血管圖，見接力指南 5c）**：每段沿路由粗漸細且接點半徑連續；最大的子管與母管同軸續行、較小的子管貼壁分出；子管沿母管切線離開；同軸接點不封口、游離末端才封圓頭；肝竇連接管中段最細、再略粗併入肝靜脈分支側壁；小葉的進口與小動脈同樣依 Murray（每條 ＝ 終端半徑 × 3^(−1/3)）漸細。**第二次修正（同日，老師：「樹梢直接變很細，要由粗到細慢慢分支、再由細到粗慢慢匯集」）**：Murray 定律推出的終端半徑（門靜脈 1.25、肝靜脈 1.65、動脈 0.43 mm）與肝竇（0.22 mm）差 4～7 倍，若要逐級二分到肝竇約需數千條分支，畫不出來（iPad 的血球預算只有 1000 顆，每段至少 3 顆）。改成**微循環分級示意**：①每條終端分支「整段」由 Murray 半徑連續漸細（接近等斜率的長錐形，最短的終端分支也有 17 mm）：門靜脈 1.25→0.60、動脈 0.43→0.37、肝靜脈樹梢 0.69→1.65 mm（血流方向相反，是由細變粗）——少畫的更細分支當作「省略」，與腎小動脈／肺泡的做法一致，分支口徑不再嚴格守 Murray；②肝竇連接管起點＝終端分支末端半徑 × n^(−1/3)（n＝同一終端接出的條數，2 條約 0.48 mm），中段緩緩收到 0.22 mm（短的連接管依「每 mm 相對變化 ≤ 約 14%」自動墊高最細處），再緩緩變粗；③連接管只併入肝靜脈樹梢的細端（當地半徑 ≤ 1.0 mm 的點），併入處半徑＝當地管半徑 × 0.62（0.30–0.58 mm），不再接到粗的肝靜脈分支側壁；④小葉進口＝終端末端 × 3^(−1/3)（門靜脈側 0.42→0.36 mm；動脈側不低於 0.34→0.31 mm，因為肝竇有四分之一從小動脈分出，小動脈不能比肝竇 0.28 mm 細），中央靜脈末端 1.15 mm 併入 2.6 mm 的肝靜脈分支。自訂檢查：連接管最陡處由每 mm 變 33% 降到 14%；終端末端÷連接管最細處中位數 4.5→2.2；肝靜脈當地管半徑÷連接管末端中位數 5.2→1.6。小葉內的肝竇半徑（中段 0.22 mm、兩端 0.28 mm）、小葉進口（0.42／0.34 mm）、中央靜脈（0.62→1.15 mm）都是**放大的示意值**，不是量測。

| 區段（id） | 內容 | 來源／性質 |
|---|---|---|
| `aorta` | 主動脈（到腹腔動脈幹起點） | 資料集網格中心線 |
| `trunk_ha` | 腹腔動脈幹＋肝總動脈＋**程式生成的固有肝動脈尾段（到肝門）** | 前段來自網格；資料集的肝動脈網格只畫到肝右緣、沒有進肝門，所以後段是依教科書走向補的（示意），口徑收窄到 1.6 mm |
| `smv`、`splenic`、`portal`、`ivc_lower`、`ivc_upper` | 同小腸場景 | 口徑見上一節；門靜脈由腸繫膜上靜脈末端半徑（4.75 mm）接過來、稍粗到 5.0 mm、肝門 4.6 mm，末 14 mm 再漸細到右支的半徑（約 4.3 mm；**示意，沒有文獻值**）；脾靜脈末 14 mm 順著門靜脈方向併入（原網格是近垂直併入，改成斜併，**示意**） |
| `pt{層}_{n}` | 門靜脈分支（示意）；層 0 為左、右門靜脈主幹 | 程式生成；肝門入口 4.6 mm；葉端約 1.1 mm，**沒有文獻值** |
| `at{層}_{n}` | 肝動脈分支（示意，與門靜脈分支並行） | 程式生成；肝門入口 1.6 mm；葉端約 0.4 mm，**沒有文獻值** |
| `ht{層}_{n}` | 肝靜脈分支（示意，血流朝下腔靜脈）；兩條主幹：右肝靜脈、中＋左肝靜脈共同幹 | 程式生成；右肝靜脈出口 4.4 mm（文獻另有 5–9 mm 的超音波值，本圖取小的、示意）；層數超過 6 的歸入第 6 層 |
| `sn_*` | 肝竇（大尺度連接，共 141 條） | 程式生成；**半徑 0.42 mm 是為了看得見而放大**，真實肝竇直徑約 10 微米（來源較弱，只當量級） |
| `lb_*` | 放大的肝小葉：三條小靜脈、三條小動脈、51 條肝竇、1 條中央靜脈、進入小葉的饋入管 | 程式生成，**整個小葉為了看得見而放大**；位置放在一對末端門靜脈／肝靜脈分支之間 |

**已查證、並用在說明文字或結構上的事實（2026-11-22 查證）：**

- 肝臟有雙重血液供應：肝門靜脈約供應 75% 的血流、肝動脈約 25%；兩者各供應肝臟約一半的氧（OpenAnesthesia〈Hepatic blood supply〉；LibreTexts Boundless〈22.7D Blood Supply to the Liver〉；Colorado State VIVO〈Liver anatomy〉）。**各文獻數字略有出入（有的寫 80／20），文字只寫「約四分之三／約四分之一」。**
- 肝動脈來自腹腔動脈幹→肝總動脈→固有肝動脈；固有肝動脈在肝門（porta hepatis）分成左右支（Kenhub〈Blood supply of the liver〉；Wikipedia〈Hepatic artery proper〉；OpenAnesthesia）。
- 門靜脈分支、肝動脈分支與膽管並行，在小葉邊緣組成「門管三合體（portal triad）」；古典肝小葉是六角形，門管在角落、中央靜脈在中心（Nottingham HELM〈Liver anatomy: Internal structure〉；AASLD〈Normal Liver Histology 101〉；Columbia 組織學實驗室〈Liver〉）。**膽管本圖沒有畫。**
- 門靜脈與肝動脈的末梢在肝竇混合，血液流過肝竇到中央靜脈，中央靜脈匯成肝靜脈，離開肝臟注入下腔靜脈（VIVO〈Liver anatomy〉；Columbia 組織學實驗室）。
- 肝靜脈主要有右、中、左三支，都注入下腔靜脈；中肝靜脈常與左肝靜脈先匯成短的共同幹（Radiopaedia〈Hepatic veins〉；Wikipedia〈Hepatic veins〉；Cleveland Clinic〈Hepatic veins〉）。畫面上的「右肝靜脈」與「中＋左共同幹」就是照這個畫的，但它們在肝內的走向是示意。

**沒有查證、畫面上標明示意或沒有寫成事實的：**

- 左右門靜脈、各層分支的口徑與分叉角度、分支總數（門靜脈 50、肝動脈同數、肝靜脈 44 個末端）都是生成結果，不是量測。
- 肝竇與肝小葉的真實尺寸（本圖都放大了）；小葉內動脈與門靜脈血進入肝竇的位置（文獻說「在小葉邊緣混合」，本圖依此畫，細節為示意）。
- 「肝竇」與「肝血竇」兩個中文名稱哪個是台灣大學教科書的標準用語：**尚未確認**，畫面暫用「肝竇（示意）」，請老師決定。
- 「腹腔動脈幹」「肝動脈」「中央靜脈」「肝小葉」依 `si_parts_v1.json`（資料集中文名）與一般教科書用法；沒有逐一對台灣大學教科書查證。
- 肝內血流速度是教學用速度，不是真實流速；分支愈細愈慢是依「總截面積變大」的連續方程式原理，數值為示意。

**核心引擎為這個場景新增的功能（`ht3d_core_1122_v1.js`，其他場景不受影響）：**
- 血流區段清單可寫「前綴*」（例：`'pt*'` ＝ 所有 id 以 pt 開頭的區段）。
- `o2` 欄位可以是 `'rich'`、`'poor'`、數字、或 `[起, 終]`（沿管由起到終漸變；肝竇用 `[0, 0.45]` 表示動脈血與門靜脈血混合後的中間色）。
- `replaceStyle`：每個「單層管」群組可指定材質（`mat`）、環數（`radial`）與環距（`step`）。

## 肺場景（肺循環／小循環，`ht3d_scene_lung_1122_v1.js`，2026-11-22）

模型沿用 `si_scene_v1.glb`／`si_parts_v1.json`（肺動脈幹、左右肺動脈、四條肺靜脈、左心房、右心室、五個肺葉都已在裡面，沒有新增或改動模型）。新增兩個檔：`lung_centerlines_v1.json`（302 段血流路徑＋41 個示意肺泡，由 `tools/anatomy/build_lung_centerlines.py` 產生；沒有亂數，重跑結果逐位元相同，約 20 秒；用法在腳本開頭）與場景檔。中心線是網格的衍生資料，同樣以 CC BY-SA 4.0 提供。

**肺裡面的一切都是示意，不是真實解剖。** 資料集沒有支氣管、肺泡、肺內血管；肺內分支、肺泡、肺泡微血管、小靜脈、肺靜脈在肺裡的那一段都是程式生成，口徑與肺泡都放大很多，畫面標籤一律帶「（示意）」。

| 區段（id） | 內容 | 來源／性質 |
|---|---|---|
| `rv_out` | 右心室腔內 → 肺動脈瓣（肺動脈幹下端環） | 程式生成（心腔內，不畫管，只給血球走） |
| `pa_trunk` | 肺動脈幹 | 網格兩端環中心（下端環半徑 14.8 mm、上端 13.2 mm）間的平滑曲線，長 27 mm＋**到分叉點的 2 cm 補段（資料集的肺動脈幹上端與左右肺動脈起點之間有空隙）**。繪製半徑 13.6 mm，最後 16 mm 平滑收到 10.5 mm（Y 形分叉，見下） |
| `pa_L`、`pa_R` | 左、右肺動脈 | 分叉點起的 Hermite 曲線（沿主幹切線離開）接上網格中心線。繪製半徑起點 10.5 mm（Murray：13.2³ ≈ 2×10.5³），之後取網格估計值（7 點移動平均、只會變細）：左 10.5→3.7 mm（長 128 mm，網格本身逐漸收細）、右 10.5→7.9 mm（長 70 mm）；網格原值留在 `radius_mesh`。右肺動脈在分叉處要往右急轉，最小曲率半徑只有管半徑的 1.2 倍（不會折疊，但比 3 倍小） |
| `a_LU`／`a_LL`／`a_RU`／`a_RM`／`a_RL` | 葉動脈（左上、左下、右上、右中、右下葉） | 程式生成（示意）：左上葉＝左肺動脈的側支（起點 5.2 mm）；左下葉＝左肺動脈末端同軸延續；右上葉與「葉間動脈→右下葉」＝右肺動脈末端 Y 形分叉；右中葉＝葉間動脈的側支（3.6 mm） |
| `s_<床>` | 到肺泡床的小動脈＋沿一排肺泡的「小動脈脊」 | 程式生成（示意）：每個葉 2 個肺泡床（共 10 床），葉動脈末端 Y 形分成兩支；口徑沿弧長等比漸細到肺泡床（約 0.7 mm），再依分出去的微血管條數以 Murray 逐步變細到 0.28–0.30 mm |
| `c_<床>_<k>` | 肺泡微血管 | 程式生成（示意）：從小動脈脊沿 +e1 離開（Bezier 轉彎）→ 貼著肺泡表面從小動脈側經左右側繞到小靜脈側（相鄰兩條傾斜方向相反，互相交叉）→ 沿 −e1 併入小靜脈脊；最後一條是繞過最末端肺泡的 U 形管（追蹤的紅血球走這條）。半徑 0.28–0.30 mm（**真實微血管直徑只有幾微米，放大很多；未查證確切值**）。`o2: 'poor>rich'`：顏色沿路由暗紅（缺氧）漸變成鮮紅（充氧） |
| `n_<床>_<k>` | 環形肺泡微血管 | 程式生成（示意）：每個肺泡兩圈（極角 42°、138°），與 `c_` 交叉成網；只畫管、不放血球（真實的肺泡微血管網裡各段流向不同，不畫成繞圈流動） |
| `v_<床>` | 小靜脈 | 程式生成（示意）：沿肺泡另一側的「小靜脈脊」逐一收集微血管（Murray 變粗），再走回肺門：第一條同軸接上肺靜脈起點（1.6 mm），其後的從側面匯入（末端 1.3 mm，開口貼著肺靜脈內壁）；穿過動脈的路徑會自動加中途點推開 |
| `pv_LS`／`pv_LI`／`pv_RS`／`pv_RI` | 左上、左下、右上、右下肺靜脈 | 肺內 20 mm 為示意；近端照資料集肺靜脈短管（心房端 1～1.5 cm）的走向進左心房，畫到心房壁為止（中心線上離左心房網格最近的點）。右上肺靜脈收右上葉與右中葉（教科書常見的引流方式）。繪製半徑 1.6 mm 起，逐一匯入時依 Murray 變粗，之後沿弧長等比變粗到約 5 mm（直徑 10 mm），最後 7 mm 放大到 1.25 倍（開口漏斗狀）；資料集網格短管半徑 3.5–5.5 mm（不畫，網格被單層管取代） |
| `la_lv`、`lv_out`、`aorta` | 左心房 → 左心室 → 主動脈（第 5 步接大循環） | 心腔內為程式生成；主動脈為網格中心線（畫的是資料集網格） |
| sacs `alvFocus`／`alv` | 肺泡 | 程式生成（示意）：放大的肺泡床（左下葉 `LL0`）5 個肺泡、半徑 2.6 mm；其他 9 床各 4 個、半徑 1.4 mm。**真實肺泡直徑約 0.2 mm，放大 13～26 倍** |

**接點畫法（照接力指南 5b）：**
1. 每段都有半徑陣列；`smoothTubes: true`；肺動脈幹、左右肺動脈、葉動脈、小動脈（同一組 `pulmArt`）與小靜脈、肺靜脈（同一組 `pulmVein`）用 `replaceMesh`＋`replaceStyle` 畫成單層管：同一側的大小血管同材質、同一個 mesh，接點沒有色差。
2. **Y 形分叉**（肺動脈幹→左右肺動脈、右肺動脈→上葉／葉間、葉動脈→兩條小動脈）：母管最後一段半徑平滑收到子管起點半徑（＝母管 ×2^(−1/3)，Murray），兩條子管從末端同軸、同半徑出發再分開；**沒有圓頭、沒有台階**（第一版用圓頭，截圖看得到「球」，已改掉）。
3. **側支與側面匯入**（左上葉動脈、右中葉動脈、第 2 條以後的小靜脈）：起點／終點從母管中心往分支那一側移 (r母−r子)，子管開口貼著母管內壁，不會在母管中央看到一個環；母管在分出點之後依 Murray 變細。
4. 全場景沒有游離末端，所有段 `capStart`／`capEnd: false`。
5. 曲率：肺泡微血管、小動脈、小靜脈的最小曲率半徑 ≥ 管半徑的 2.7 倍（多數 ≥ 3）；粗的葉動脈 1.7–2.0 倍、肺靜脈近心房 2.1–2.5 倍、肺動脈幹 1.4 倍、右肺動脈分叉處 1.2 倍（粗管在短距離內必須轉大角度，已盡量拉長；> 1 倍就不會折疊）。
6. 驗證（腳本內，結果寫在 JSON 的 `validation`）：肺內 generated 點全部落在同側肺葉網格的凸包內（內縮 0.5 mm；葉動脈起點 12 mm、小靜脈最後 12 mm、肺靜脈出肺門後不計）＝ 0 個點在外；奇偶射線法（補充）也全部在肺葉網格內；畫出來的管兩兩檢查「中心線距離 ≥ 兩管半徑和」（相連的兩段在接點 25 mm 內不算）＝ 0 處互相穿過；肺泡與其他肺泡床的血管不相交。

**這個場景用到的科學敘述與數字（2026-11-22 查證；本次只能用網路搜尋，搜尋工具只回傳文獻標題與網址、沒有內文摘要，所以下列數字是「找到文獻出處，數值依該文獻常見的引用值，未開全文逐字核對」，請老師或下一位接手者有機會時核對）：**

> **2026-11-23 老師指示：畫面上未逐字核對的數字一律拿掉。** 下表的肺動脈平均壓、肺泡數與直徑**已不出現在畫面文字**，只保留作研究紀錄；要放回畫面前必須先逐字核對原文。

| 敘述／數字 | 用在哪 | 出處（標題／機構） | 狀態 |
|---|---|---|---|
| 右心室 → 肺動脈 → 肺微血管 → 肺靜脈 → 左心房；肺動脈血較少氧、肺靜脈血較多氧，兩者都是紅色 | 第①②④⑤步 | 2D 頁面既有句子（`HumanTransportExchanges` 的 `lung` 區）；國中課程教材（彰化縣、基隆市公開授課教案「人體內的心血管系統」等，openclass.chc.edu.tw／openclass.kl.edu.tw） | 既有內容 |
| 左、右肺各兩條肺靜脈，共四條，注入左心房；右中葉靜脈通常匯入右上肺靜脈 | 第④步、`pv_RS` | 一般解剖教科書；Radiology 2005;235〈Pulmonary Vein Diameter, Cross-sectional Area, and Shape: CT Analysis〉（doi 10.1148/radiol.2351032106） | 常見解剖，變異（例如三條或五條）未畫 |
| 靜止時肺動脈平均壓約 14 mmHg（正常 14.0 ± 3.3 mmHg） | 第②步 | Kovacs G et al., Eur Respir J 2009;34(4):888〈Pulmonary arterial pressure during rest and exercise in healthy subjects: a systematic review〉（publications.ersnet.org/content/erj/34/4/888） | 數值未逐字核對 |
| 成人肺泡數平均約 4.8 億（範圍約 2.7～7.9 億）→ 文字寫「約 3～8 億個」 | 第③步 | Ochs M et al., Am J Respir Crit Care Med 2004〈The number of alveoli in the human lung〉；Harvard BioNumbers ID 101476〈Number of alveoli in lung〉 | 數值未逐字核對 |
| 肺泡直徑約 0.2 mm（平均肺泡體積約 4.2×10⁶ µm³ 換算） | 第③步、本表 sacs 列 | 同上 Ochs 2004；BioNumbers ID 101477〈Volume of alveolus〉 | 數值未逐字核對 |
| 主肺動脈直徑：平均約 25 mm，正常上限約 29 mm（男）／27 mm（女） | 只拿來對照模型（模型 27–30 mm，相符） | Framingham Heart Study 的 CT 正常值研究（PMC3275437、Weill Cornell VIVO pubid 22178898；作者與年份未核對）；另有 PMC9026207〈Pulmonary artery diameter: means and normal limits—assessment by CTA〉 | 數值未逐字核對；畫面沒有寫數字 |
| 肺動脈幹長約 5 cm | 只拿來對照（模型含補段 4.7 cm） | Radiopaedia〈Pulmonary trunk〉；StatPearls（NBK534812）；Elsevier Complete Anatomy〈Pulmonary trunk〉 | 數值未逐字核對 |
| 左、右肺動脈直徑 | 沒用 | PMC9026207、Radiopaedia〈Right pulmonary artery〉 | **未查證**（沒取得數字；畫面口徑取網格＋Murray） |
| 肺靜脈開口直徑（約 1～2 cm 量級） | 決定繪製口徑（取 10 mm，偏小、示意） | Radiology 2005;235（同上）；PMC3474072 | **未查證**（沒取得數字） |
| 紅血球通過肺微血管約 0.75 秒（靜止時），運動時縮短 | 沒用（保留給有聲講解） | BioNumbers ID 101731〈typical transit time for erythrocyte in pulmonary capillary〉；Loyola〈Pulmonary physiology〉pf3；Virginia Tech Pressbooks〈Pulmonary Physiology〉第 8 章 | 數值未逐字核對 |
| 肺泡總表面積（教科書常寫約 70 m²，形態計量研究約 130 m²）、氣血屏障厚度（調和平均約 0.6 µm） | 沒用 | Britannica〈Human respiratory system: The lungs〉；J Cell Biol 21(3):367〈A morphometric study on the thickness of the pulmonary air-blood barrier〉（rupress.org）；PMC1233269、PMC2106384 | **未查證**（沒取得數字；畫面沒寫） |

**名稱：** 畫面只顯示右心室、肺動脈幹、左肺動脈、右肺動脈、左肺、右肺、肺靜脈、左心房、左心室、主動脈，以及帶「（示意）」的泛稱：肺內小動脈、肺泡、肺泡微血管、肺內小靜脈。「葉動脈」「葉間動脈」只寫在程式註解，**不當標籤**。「小循環（肺循環）」「大循環（體循環）」是國中課本與大學教科書通用的說法；資料集中文名（`si_parts_v1.json`）裡這幾個結構都沒有 `zh_review` 標記。

**血色：** 核心全站共識不畫藍色血液（2D 頁面也寫「兩者都是紅色血液」）：缺氧血＝暗紅、充氧血＝鮮紅。肺動脈這一組（`pulmArt`）用缺氧血色、肺靜脈這一組（`pulmVein`）用充氧血色，與大循環相反，文字在第①②④步講清楚。

**核心引擎為這個場景新增的功能（`ht3d_core_1122_v1.js`，向下相容；小腸、腎臟、肝臟三個場景的粒子數與三角形數改前改後完全相同）：**
- `o2: 'poor>rich'`：沿管由暗紅漸變到鮮紅（肺泡微血管用）。原本的 `'rich'`／`'poor'`／數字／`[起,終]`／未寫（或 `'rich>poor'`）行為不變。
- 中心線 JSON 可帶 `sacs: { <群組>: [[x,y,z,半徑], …] }`：畫成合併的半透明球（肺泡），群組寫在場景 `groups`、材質讀 `SCENE.material[群組]`，樣式鍵（透明度、`lit.`）照用。沒有 `sacs` 的場景不受影響。

**效能（只在軟體 WebGL 測過，真實 GPU／iPad 未測）：** 粒子（血球）每步 25／197／353／211／154 顆（完整與 lite 相同，都在預算 2400／1000 內；肺泡微血管只在第③步、而且只有放大的那一床放血球）。三角形數完整模式每步約 21／33／41／31／28 萬，lite 約 11／19／24／18／16 萬（肺泡微血管 266 段＋41 個球；lite 的管與球環數較少）。

## 腦場景（腦部：組織細胞，`ht3d_scene_brain_1122_v1.js`，2026-11-23）

**新模型** `brain_scene_v1.glb`（完整版 0.66 MB、125,886 三角形，其中腦 91,744）／`brain_scene_v1_lite.glb`（0.40 MB、67,041 三角形）／`brain_parts_v1.json`（49 個 node），由 `tools/anatomy/extract_brain_scene.mjs` 從同一資料集（3D Anatomy Atlas data release 1.2.0，repo commit `4704dc61f7f9929e119ec19a57d4c497e093ddb4`）抽出；讀 chunk、依 `_ID` 拆結構、weld／simplify／quantize／meshopt 的程式沿用 `extract_si_scene.mjs`。**沒有修改 `si_scene_v1.glb`、`si_parts_v1.json`。**
用法：`node tools/anatomy/extract_brain_scene.mjs --data <3d-anatomy-atlas>/packages/data/releases/1.2.0 --modules /tmp/gl/node_modules`（約 6 秒；加 `--list` 列每個結構簡化前後的三角形數）。

- **挑選**：心臟四腔；升主動脈、主動脈弓、胸主動脈；頭臂動脈幹、左右頸總動脈、左右鎖骨下動脈、左右頸內動脈、左右椎動脈、基底動脈、前／後交通動脈、左右大腦前動脈、大腦中動脈 M1 段與島葉支（M2）、左右大腦後動脈；上矢狀竇、左右橫竇、左右乙狀竇；左右內頸靜脈、左右鎖骨下靜脈、左右頭臂靜脈、上腔靜脈。
- **不收**：小腦的動脈（小腦上／前下／後下動脈）、頸外動脈、下矢狀竇／直竇／枕竇（資料集這三個竇的位置在腦幹前上方，與教科書位置〔大腦鐮下緣、竇匯〕不符，未採用）。
- **合併**：大腦皮質依資料集的「葉」群組合併成 5 塊（`brain.frontal_lobe`／`parietal_lobe`／`temporal_lobe`／`occipital_lobe`／`other_cortex`〔島葉、邊緣葉含海馬迴、葉間腦溝〕）；小腦全部小葉合併成 `brain.cerebellum`；腦幹（中腦、橋腦、延腦外形）合併成 `brain.brainstem`（內部神經核、第四腦室、中腦導水管不收）；頭頸部體表分區（頭皮、臉、耳廓、頸部）合併成 `regions.head_neck_surface`、胸部體表分區合併成 `regions.thorax_surface`，只作定位背景。完整清單在 `brain_parts_v1.json` 的 `merged_from`。
- **簡化誤差上限**：完整版 血管 0.03 mm、心臟 0.2 mm、腦 0.4 mm、體表 1.5 mm（保留 ≥35%）；輕量版 血管 0.2 mm、心臟 1.2 mm、腦 0.9 mm（保留 ≥30%）、體表 3 mm。
- **授權與署名**：大腦皮質來自 **Brain for Blender**（Anderson M. Winkler, brainder.org；CC BY-SA 3.0，經 Z-Anatomy 改作後以 CC BY-SA 4.0 提供），其餘為 Z-Anatomy／BodyParts3D（CC BY-SA 4.0）。署名照資料集 ATTRIBUTION.md 原文（已寫進 glb 的 `asset.copyright`）：
  > “Brain for Blender” by Anderson M. Winkler (https://brainder.org/research/brain-for-blender/), CC BY-SA 3.0, as adapted in “Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0; cortical parcellation of Destrieux et al. (2010), computed with FreeSurfer. Adapted for Svitylo 3D Anatomy Atlas.

  衍生成品（兩個 glb、`brain_parts_v1.json`、`brain_centerlines_v1.json`）整體以 **CC BY-SA 4.0** 提供。

**中心線** `brain_centerlines_v1.json`（205 段）由 `tools/anatomy/build_brain_centerlines.py` 產生（用法在腳本開頭；約 4 分鐘，亂數種子固定）。方法照接力指南 5b：每段半徑陣列、`smoothTubes`、所有資料集血管用 `replaceMesh` 改畫單層漸變管、切線相接、Murray、同軸接點不封口、圓頭只在游離末端（鎖骨下動脈／靜脈外側端、胸主動脈下端、大腦前動脈末端、上矢狀竇前端）。
- **同軸一路延續的血管合成一段**（兩段同軸接起來時兩根管的環對不齊，半透明時看得到一圈接縫）：`lcar`＝左頸總動脈→頸內動脈→大腦中動脈 M1→島葉支→腦表面小動脈（示意）→床 F 軟腦膜小動脈；`rcar`＝頭臂動脈幹→右頸總→頸內→大腦中→床 B1；`rvb`＝右椎動脈→基底動脈→右大腦後動脈→床 B3；`rdrain`＝上矢狀竇→右橫竇→右乙狀竇→右內頸靜脈→右頭臂靜脈→上腔靜脈；`ldrain`＝左橫竇→左乙狀竇→左內頸靜脈→左頭臂靜脈。各部分在段內的弧長範圍寫在 JSON `named.parts`。Y 形分叉／匯流的另一支（左鎖骨下動脈、右鎖骨下動脈、左椎動脈、大腦前動脈、左大腦後動脈、第二條島葉支、左橫竇、鎖骨下靜脈、左頭臂靜脈）從母管中心線分出（或併入），用 `tubeRange` 只畫母管壁外的部分。
- **半徑**（取自網格：垂直切面面積換算，再平滑、單調化；網格本身比文獻細，畫面不寫數字）：主動脈 14→12 mm、頸總動脈 3.9、頸內動脈 3.9→1.45、椎動脈 1.27→1.1、基底動脈 1.39（Murray：兩條椎動脈匯合）、大腦前／中動脈起點 1.16（Murray：頸內動脈末端 Y 形分叉）、島葉支 0.92、大腦後動脈 1.1→0.6、前／後交通動脈 0.6／0.7（只畫管、不放血球）；上矢狀竇 0.6→2.0（每匯入一條腦靜脈依 Murray 變粗）、橫竇 1.3→1.75、乙狀竇 1.75→1.9、內頸靜脈 1.9→4.2（**上限 4.2 mm 為示意**：資料集下端膨大到 4.9 mm，會和頸總動脈起端重疊）、頭臂靜脈 →7、上腔靜脈 8.8→10.5 mm。
- **修正資料集的幾何（示意）**：①乙狀竇下端與內頸靜脈上端之間有數 mm 空隙，且內頸靜脈上端比乙狀竇末端還高，補段從內頸靜脈低於乙狀竇末端 5 mm 處接上；②內頸靜脈在頸部與頸動脈網格互相穿插，往外推開到不相交；③上矢狀竇、橫竇往腦外推（≤ 3.4 mm）；④資料集的大腦中動脈 M1 段夾在額葉與顳葉網格互相貼住、沒有縫的地方：改用 A* 在腦外找一條起訖點與切線都不變的路徑（示意，偏離網格中心線最多約 7 mm），0 點穿腦、管壁離腦 ≥ 0.12 mm；大腦前動脈往兩半球之間走，但腦網格在那裡互相貼住：只畫到還在腦外的地方（約 11 mm），末端收細，之後的分支沒有畫；⑤椎動脈最後 30 mm 與基底動脈原本貼著（部分穿進）腦幹、大腦後動脈有幾處穿進腦網格：局部做「限制下的平滑」推出去，中心線 0 點在腦內；**大腦後動脈繞過中腦旁的一段，管壁仍碰到腦約 0.5–0.7 mm**（那裡的縫太窄；試過把管縮到不碰腦，要縮到 0.14 mm、下游也只能更細，接不上床的小動脈，所以沒採用）。
- **示意（程式生成）**：①腦表面的小動脈與腦靜脈：1 mm 格點標出腦網格內外，A* 在腦外找路（偏好離腦表面 1～3 mm），再做「限制下的平滑」（拉普拉斯平滑＋推出腦外，反覆）；②六個皮質微血管床：F（放大的床，左頂葉外側面，大腦中動脈供血；7 條穿入灰質的小動脈、6 條上行小靜脈、31 條微血管分 4 層＋42 條交叉連通支）、B1（右頂葉）、B4／B5（左右額葉）、B2／B3（左右枕葉，大腦後動脈供血、引流到橫竇）。床的位置由腳本掃描皮質表面選出最平、灰質最厚的一塊（灰質最薄處 2.9～3.5 mm），沿法線打射線量軟腦膜面高度與灰質厚度，在（沿面、沿面、深度）參數空間建床再對應回去，所以床會跟著皮質表面彎曲。微血管半徑 0.12 mm（真實微血管直徑約 5～8 µm，**放大約 30 倍**；未逐字核對）。
- **驗證**（JSON `validation.results`）：六個床灰質裡的點 1,730／1,730 在腦網格內（x／y／z 三軸奇偶射線多數決）；軟腦膜上的小血管 357／357 在腦外且離表面 ≤ 1.5 mm（最大 0.71 mm）；腦表面路徑 0 點穿進腦；畫出來的管兩兩不相穿（相連接點附近除外）＝ 0 處；最小曲率半徑÷管半徑（只算畫出來的範圍）：全部 ≥ 1.15，其中升主動脈 1.65、頭臂靜脈→上腔靜脈所在的右側回流段 1.40、頸內動脈末端分出大腦中動脈 1.39／1.61（接點附近做局部高斯平滑，主動脈中心線整條平滑）。
- **核心引擎新增（皆為選用、向下相容；小腸／腎臟／肝臟／肺場景每步粒子數與三角形數改前改後完全相同）**：`SCENE.genTubeRange`（生成的微血管也照 `tubeRange` 只畫一段）、`SCENE.cellMin`（血球最小直徑，腦設 0.18 mm）、中心線段的 `step`（細而急彎的生成管用較密取樣）。
- **效能**（只在軟體 WebGL 測過，真實 GPU／iPad 未測）：粒子每步約 218～375 顆；三角形完整模式每步約 24～39 萬、lite 約 15～25 萬。

**這個場景用到的科學敘述與數字（2026-11-23 查證；搜尋工具只回傳標題與網址、沒有內文摘要，所以下列數字是「找到出處，數值依常見引用值，未逐字核對」）：**
> **2026-11-23 老師指示：畫面上未逐字核對的數字一律拿掉。** 下表的數值（肺動脈平均壓、肺泡數與直徑、腦占體重／氧耗／血流比例、缺氧耐受時間）**已不出現在畫面文字**，只保留作研究紀錄；要放回畫面前必須先逐字核對原文。

| 敘述／數字 | 用在哪 | 出處（標題／機構） | 狀態 |
|---|---|---|---|
| 腦約占體重 2%，卻用掉全身約 20% 的氧氣 | 第①步 | Harvard BioNumbers ID 103264〈Fraction of brain oxygen consumption out of body oxygen consumption〉；Univ. of Arizona Davis Lab〈Blood Supply to the Brain〉；LibreTexts〈Blood Supply to the Brain〉（Essentials of Physiology for Nurse Anesthetists） | 數值未逐字核對 |
| 腦血流約為心輸出量的 15%（約 750 mL/min） | 第①步（只寫 15%） | Wikipedia〈Cerebral circulation〉；LibreTexts〈18.7D Blood Flow in the Brain〉；LITFL〈Cerebral Blood Flow〉；WFSA〈Basic Sciences〉 | 數值未逐字核對 |
| 葡萄糖是腦細胞主要的能量來源；腦幾乎不能儲存能量 | 第③步 | Mergenthaler et al.〈Sugar for the brain〉（PMC3900881）；Pflügers Arch s00424-020-02441-x（PMC7462931）；UTHealth Neuroscience Online 第 11 章 | 未逐字核對 |
| 缺氧幾分鐘腦細胞就會受損（常見說法約 4～6 分鐘；畫面只寫「幾分鐘」） | 第③步 | Cleveland Clinic〈Cerebral Hypoxia〉；Headway〈Hypoxic and anoxic brain injury〉；Live Science〈How long can the brain survive without oxygen?〉 | 未逐字核對 |
| 腦微血管壁細胞緊密相接（血腦屏障），只讓需要的物質通過 | 第③步 | PMC7462931；UTHealth Neuroscience Online 第 11 章 | 一般教科書內容，未逐字核對 |
| 兩條椎動脈合成基底動脈；大腦動脈環（交通動脈）分出大腦前／中／後動脈 | 第②步 | 一般解剖教科書；資料集結構階層（cerebral_arterial_circle） | 常見解剖 |
| 上矢狀竇→（竇匯）→橫竇→乙狀竇→內頸靜脈；頸內靜脈＋鎖骨下靜脈＝頭臂靜脈；左右頭臂靜脈＝上腔靜脈 | 第④⑤步 | 一般解剖教科書；資料集結構階層 | 常見解剖 |
| 頸內動脈、椎動脈、基底動脈直徑 | 沒用（畫面口徑取網格） | AJNR 7(1):55；PMC11811384〈Basilar Artery Diameter〉；Folia Morphologica FM.a2019.0071 | **未查證**（沒取得數字） |
| 頸總動脈、內頸靜脈直徑 | 沒用 | Cardiovasc Ultrasound s12947-016-0084-1；PMC7539051 | **未查證** |

**名稱**：畫面只顯示左心室、主動脈弓、頸動脈（泛稱）、椎動脈、基底動脈、大腦動脈環、大腦前／中／後動脈、大腦、小腦、上矢狀竇、橫竇、乙狀竇、頸靜脈（泛稱）、上腔靜脈、右心房、右心室，以及帶「（示意）」的腦表面的小動脈、微血管、小靜脈、腦靜脈。「頸總動脈／總頸動脈」「內頸動脈／頸內動脈」「內頸靜脈／頸內靜脈」「頭臂動脈幹（無名動脈）」「頭臂靜脈（無名靜脈）」「島葉支」的臺灣大學教科書用語未逐一核對，記在 `brain_parts_v1.json` 的 `zh_review`（10 筆），畫面用泛稱或不標。

**放大窗**：沿用 2D「組織」交換動畫（`HumanTransportExchanges` 的 `tissue` 區，畫的是一般組織細胞，不是神經元／星狀膠細胞），標題寫「放大：微血管與腦細胞的交換（示意）」。

## 已知限制與缺漏

- **沒有**獨立的空腸動脈、迴腸動脈（資料集只有腸系膜上動脈本體含幾條短分支，以及迴結腸動脈的迴腸支）；沒有獨立的盲腸、直腸；沒有獨立的主動脈根（竇）網格（`root_of_aorta` 群組只含三片主動脈瓣）；沒有胃網膜動脈、胃右動脈、短胃動脈。
- 小腸系膜與小腸絨毛的微血管網資料集沒有；腸壁內血管只能靠後續手工／程式補畫。
- 腎臟 node 只有外形（腎纖維囊），沒有內部構造；腎內動脈、靜脈（`intrarenal_*`）沒收進來（會被腎臟蓋住）。
- 肝臟是整個外形，沒有區段，肝內血管資料集沒有（肝臟場景的肝內血管全是程式生成的示意）；胃是外形，沒有黏膜層。

## 重新產生

```sh
# 套件裝在任何暫存資料夾即可，不要裝進 repo
mkdir -p /tmp/gl && cd /tmp/gl && npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
# 資料集 clone 在 repo 外面（唯讀），再執行：
node tools/anatomy/extract_si_scene.mjs \
  --data <資料集>/packages/data/releases/1.2.0 \
  --modules /tmp/gl/node_modules
# 只重驗證已輸出的 glb：加 --verify-only（--list 會列出每個 node 的三角形數）
```

## 全身血管底圖 body_vessels_v1（2026-11-23）

老師要求「全部的血管都畫上去」。**資料來源就是上面同一份資料集**（`authorOd/3d-anatomy-atlas` release 1.2.0，Z-Anatomy／BodyParts3D 衍生）：它的 cardiovascular 系統有 **676 個有網格的結構**（動脈約 421、靜脈約 231，含股動脈、脛動脈、足底弓、腋動脈、肱動脈、橈動脈、掌弓、指動脈、顏面／顳淺／枕動脈、大腦前／中／後動脈、顱內靜脈竇…），之前 si_scene 只挑了其中 69 條主幹。座標系與 si_scene 完全相同（公尺、+Y 向上、原點在兩腳跟之間），不用對位。

| 檔案 | 說明 |
|---|---|
| `body_vessels_v1.glb` | 完整版：8 個 node，約 22.8 萬三角形，約 1.1 MB（誤差上限 0.2 mm） |
| `body_vessels_v1_lite.glb` | 輕量版（iPad 備援）：同樣 8 個 node，約 7.6 萬三角形，約 0.47 MB（誤差上限 0.6 mm） |
| `body_vessels_parts_v1.json` | 每個 node 的 id、種類、區域、成員結構（英文 id，共 587 條） |
| `../../../tools/anatomy/extract_body_vessels.mjs` | 抽取腳本（可重跑，用法見檔頭） |

- 選取：cardiovascular 結構 676 條，扣掉 si_scene 已有的（76，含心腔／瓣膜／乳頭肌，這些由各場景自己畫）與沒有名稱的 `x_l`／`x_r`／`unnamed`，剩 587 條。依名稱分「動脈／靜脈」，再依「頭頸／手臂／腿／軀幹」合併成 8 個 node（`body.arteries.head`、`body.veins.leg`…）；名稱規則分不到的用網格中心位置分。
- 改作：挑選、依區域合併、weld、simplify（meshoptimizer，鎖住開口邊界）、quantize、meshopt 壓縮；座標不改。授權同上：**CC BY-SA 4.0**，署名與改作說明已寫進 glb 的 `asset.copyright`。
- 用法：場景檔 `...BEST_SCENE`（`ht3d_preset_1122_v1.js`）會帶 `extras`，核心載入後疊進同一個場景；背景血管群組 `bodyArtHead／Arm／Leg／Trunk`、`bodyVeinHead／…`。載入失敗就略過，不影響場景。
- 這些只是「背景的血管分布」，沒有逐條核對血管走向與名稱，畫面上**不標名稱**；腦場景自己畫頭頸血管，所以腦場景把頭頸那兩組設成不畫（避免兩層重疊）。
- 另外查過 HuBMAP **Human Reference Atlas**「Blood Vasculature」3D 參考物件（CC BY 4.0，`hubmapconsortium/ccf-releases` 的 `v1.2/models/VH_M_Blood_Vasculature.glb`）：104 條，只有軀幹加眼部血管，**沒有四肢**，比這份少，所以沒有採用。
