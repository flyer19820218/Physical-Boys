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
