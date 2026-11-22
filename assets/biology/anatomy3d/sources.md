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

**沒做的（留給肝臟獨立場景）：** 密集的肝竇網（門靜脈分支與肝動脈分支逐級分叉，再逐級匯成肝靜脈）；肝內靜脈的真實分支形狀。

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

腎臟內部（葉間動脈、弓狀動脈、小葉間動脈、入球／出球小動脈、管周微血管、小葉間／弓狀／葉間靜脈）的**口徑與走向資料集沒有，也沒查到可直接採用的數值**：場景裡一律是程式生成的「示意」，口徑為了看得見而**放大**，且沿路**由粗變細、靜脈側由細變粗**（2026-11-22 修正接點：小動脈半徑 0.60→0.42 mm，起點對齊腎動脈前／後支網格末端 0.4–0.5 mm；腎絲球管 0.42→0.36 mm；微血管 0.34→0.29→0.34 mm；小靜脈 0.50→1.3 mm；腎絲球畫成約 3 mm 的螺旋，真實約 0.2 mm）。接點兩端半徑相同、管口封成圓頭（核心 `SCENE.smoothTubes`），不再是平口水管對接。這些數字都是示意用，**不是量測值**。畫面標籤都帶「（示意）」。走向只畫到「從腎門分支→往皮質走→腎絲球→微血管網→回腎門匯入腎靜脈」這個層級，各支的分叉位置、數量（左 5、右 3）都是示意，不是解剖資料。腎內路徑的驗證：每個點必須落在腎纖維囊網格的凸包內（內縮 0.5 mm；腎囊在腎門處有開口，射線法不可靠；起點在腎門的前 8 mm 與匯入腎門的接點不檢查）。

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

## 已知限制與缺漏

- **沒有**獨立的空腸動脈、迴腸動脈（資料集只有腸系膜上動脈本體含幾條短分支，以及迴結腸動脈的迴腸支）；沒有獨立的盲腸、直腸；沒有獨立的主動脈根（竇）網格（`root_of_aorta` 群組只含三片主動脈瓣）；沒有胃網膜動脈、胃右動脈、短胃動脈。
- 小腸系膜與小腸絨毛的微血管網資料集沒有；腸壁內血管只能靠後續手工／程式補畫。
- 腎臟 node 只有外形（腎纖維囊），沒有內部構造；腎內動脈、靜脈（`intrarenal_*`）沒收進來（會被腎臟蓋住）。
- 肝臟是整個外形，沒有區段；胃是外形，沒有黏膜層。

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
