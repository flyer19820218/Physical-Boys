# three.js（本地檔案版）

給 3D 動畫（例如 3D 人體血液循環）使用。網站是純前端、部署在 GitHub Pages，**不走 CDN**，所以 three.js 直接放在 repo 裡。

- 版本：**three.js 0.187.0**（REVISION 187），MIT 授權。來源與逐檔對照見 [`VERSION.txt`](VERSION.txt)，授權原文見 [`LICENSE`](LICENSE)。
- 這裡所有 `.js` 都是 npm 套件的**原檔，逐位元組複製，沒有改寫**。不要手改；要升級就整批重換（見最後一節）。
- 0.187.0 的 npm 套件**沒有附 `.min.js`**，所以檔名是 `three.module.js` 與 `three.core.js`（不是 `three.module.min.js`）。GitHub Pages 會 gzip，實際傳輸量約 126 KB + 283 KB。

## 檔案

| 檔案 | 用途 |
|---|---|
| `three.module.js` | three.js 主入口（會用相對路徑 import 同資料夾的 `three.core.js`） |
| `three.core.js` | three.js 核心（**必須與 `three.module.js` 放在同一個資料夾、同一個版本**） |
| `examples/jsm/loaders/GLTFLoader.js` | 載入 `.glb` / `.gltf` |
| `examples/jsm/libs/meshopt_decoder.module.js` | 解 `EXT_meshopt_compression` 壓縮的 glb（`MeshoptDecoder`） |
| `examples/jsm/utils/BufferGeometryUtils.js` | GLTFLoader 的相依（也可單獨使用，例如 `mergeVertices`） |
| `examples/jsm/utils/SkeletonUtils.js` | GLTFLoader 的相依（`clone` 骨架模型） |
| `examples/jsm/controls/OrbitControls.js` | 滑鼠／手指轉動視角 |
| `examples/jsm/renderers/CSS2DRenderer.js` | 把 HTML 標籤（器官名稱等）釘在 3D 物件上 |
| `examples/jsm/environments/RoomEnvironment.js` | 程式產生的室內環境光（搭配 `PMREMGenerator` 當 `scene.environment`，給 MeshStandard／MeshPhysical 柔和反射；不需要貼圖檔）。2026-11-22 為 3D 血液循環加入 |

資料夾結構保持和 three 官方一致（`examples/jsm/...`），所以檔案之間的相對 import（例如 GLTFLoader 的 `../utils/BufferGeometryUtils.js`）不用改就能運作。

## 用法一：只用 three 本體（最簡單）

```html
<script type="module">
  import * as THREE from './assets/vendor/three/three.module.js';

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(640, 400);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 640 / 400, 0.1, 100);
  camera.position.set(0, 0.6, 4);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
                              new THREE.MeshStandardMaterial({ color: 0x4dd2ff }));
  scene.add(cube);

  renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.01; cube.rotation.y += 0.015;
    renderer.render(scene, camera);
  });
</script>
```

路徑 `./assets/...` 是**相對於這個 HTML 檔**。本站的課程頁都在 repo 根目錄，直接照寫即可。**不要寫成 `/assets/...`**：GitHub Pages 的專案網站網址是 `/<repo名>/`，開頭的 `/` 會指到網域根目錄而找不到檔案。

## 用法二：用到 examples/jsm 的任何附加元件（必須加 importmap）

`GLTFLoader`、`OrbitControls`、`CSS2DRenderer` 等檔案裡寫的是 `import ... from 'three'`（裸模組名），瀏覽器不知道 `'three'` 是哪個檔，**沒有 importmap 會直接報錯**：

```
Failed to resolve module specifier "three". Relative references must start with either "/", "./", or "../".
```

解法是在 `<head>` 放一段 importmap（**必須出現在任何 `<script type="module">` 之前**），並讓所有 three 相關 import 都走裸名 `'three'`：

```html
<script type="importmap">
{ "imports": { "three": "./assets/vendor/three/three.module.js" } }
</script>

<script type="module">
  import * as THREE from 'three';
  import { GLTFLoader } from './assets/vendor/three/examples/jsm/loaders/GLTFLoader.js';
  import { MeshoptDecoder } from './assets/vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
  import { OrbitControls } from './assets/vendor/three/examples/jsm/controls/OrbitControls.js';
  import { CSS2DRenderer, CSS2DObject } from './assets/vendor/three/examples/jsm/renderers/CSS2DRenderer.js';
  // ...
</script>
```

注意事項：

- importmap 裡的路徑同樣相對於 HTML 檔；若頁面放在子資料夾，要改成 `../assets/vendor/three/three.module.js`，其餘 import 路徑也同步調整。
- 整個頁面只能有**一份** three。要嘛全部走 `'three'`（importmap 指向同一個 URL），要嘛只用用法一；不要同一頁混用不同 URL（例如一邊帶 `?v=`、一邊不帶），否則 three 會重複載入，`instanceof` 會失效並在 console 出現 "Multiple instances of Three.js" 警告。以相同 URL 同時用 importmap 與直接相對路徑 import，實測是同一個模組實例。
- 需要瀏覽器支援 importmap：Chrome／Edge 89+、Firefox 108+、Safari／iPadOS 16.4+。
- **ES module 不能用 `file://` 雙擊開啟**（瀏覽器會擋）。3D 頁面要經過 http(s)：GitHub Pages、`tools/qa/serve.sh`，或在 repo 根目錄 `python3 -m http.server 8811`。這點和其他「雙擊就能開」的課程頁不同，需要時請事先告知老師。

## GLTFLoader 搭配 MeshoptDecoder（載入壓縮過的 glb）

```js
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);   // 載入含 EXT_meshopt_compression 的 glb 前一定要先呼叫

// 路徑只是示意，請換成實際的 glb 檔
loader.load('./assets/biology/human_body.glb', (gltf) => {
  scene.add(gltf.scene);
}, undefined, (err) => console.error(err));

// 或用 Promise：
// const gltf = await loader.loadAsync('./assets/biology/human_body.glb');
```

- 沒呼叫 `setMeshoptDecoder` 又載入壓縮 glb，會得到 `THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files`。
- 不需要自己 `await MeshoptDecoder.ready`（GLTFLoader 內部用 `decodeGltfBufferAsync`，會自己等）。`MeshoptDecoder.supported` 可用來檢查瀏覽器是否支援 WebAssembly。
- 沒壓縮的 glb 也可以照同樣方式載入，多設一個 decoder 不影響。
- 目前**沒有**附 DRACOLoader／KTX2Loader；若之後的模型用了 Draco 或 KTX2 壓縮，要另外把對應的 loader 與 decoder（`libs/draco/`、`libs/basis/`）從 three 套件複製進來。

## 無頭瀏覽器（Playwright）測 WebGL

驗證過的組合：Playwright 1.63、Chromium headless shell 157 與完整 Chromium 153（`channel: 'chromium'`，新 headless 模式），Linux 容器，沒有實體 GPU，WebGL 由 SwiftShader（軟體算圖）提供。

**這個環境下不加任何參數 WebGL1／WebGL2 都可用。** 為了換機器或換瀏覽器版本時比較穩，建議固定帶上這組參數（已實測可用且無副作用）：

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-angle=swiftshader',     // 強制 ANGLE 走 SwiftShader 軟體算圖
    '--enable-unsafe-swiftshader', // 新版 Chromium 要明確允許 SwiftShader
    '--ignore-gpu-blocklist',      // 沒有 GPU 的機器不要因黑名單而關掉 WebGL
  ],
});
```

執行方式：`NODE_PATH=$(npm root -g) node your_test.cjs`。

實測結果（`headless: true`，兩種 Chromium 都是）：

| 啟動參數 | WebGL / WebGL2 |
|---|---|
| 不加參數 | 可用 |
| `--use-angle=swiftshader`、`--enable-unsafe-swiftshader`、`--ignore-gpu-blocklist`（上面那組） | 可用 |
| `--use-gl=swiftshader`（舊寫法） | 可用，但建議改用 `--use-angle=swiftshader` |
| `--disable-gpu` | 可用（自動退回 SwiftShader） |
| `--disable-gpu --disable-software-rasterizer` | **不可用**（WebGL 取得 context 失敗） |
| `--disable-webgl` | **不可用** |

所以：**不要**帶 `--disable-software-rasterizer` 或 `--disable-webgl`。取得的 renderer 字串是 `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) ...), SwiftShader driver)`。

驗證 WebGL 畫面的小技巧：

- 判斷「canvas 有非空像素」：在 `renderer.render(...)` 之後、**同一個 task 內**用 `gl.readPixels` 讀（不必開 `preserveDrawingBuffer`），或用 `page.screenshot()`。
- 判斷「畫面有在動」：不同時間點各讀一次，比較像素雜湊值是否不同。
- `gl.readPixels` 與 `page.screenshot()` 都可能讓 Chromium 在 console 印 `GPU stall due to ReadPixels` 的警告（軟體算圖下的效能提示，不是錯誤）。檢查 console 時請把這一條排除，其他 `error`／`warning` 一律視為問題。
- SwiftShader 是 CPU 算圖，慢；測試用小畫布（例如 640×400）、少量影格就夠。

本資料夾的實測結果：立方體旋轉、`GLTFLoader` 載入一個未壓縮 glb 與一個 `EXT_meshopt_compression` 壓縮 glb（頂點數、座標總和、包圍盒都與原始資料一致）、`OrbitControls`、`CSS2DRenderer`、`BufferGeometryUtils.mergeVertices`、`SkeletonUtils.clone` 全部正常，console 沒有 error／warning，canvas 有非空像素且逐影格不同。

## 升級版本

1. 在暫存資料夾（不要在 repo 裡）：`npm install three@<版本>`。
2. 把 `node_modules/three/build/three.module.js`、`three.core.js` 與上表的 `examples/jsm/...` 各檔**成對**複製過來，覆蓋原檔（`three.module.js` 與 `three.core.js` 必須同版本）。若新版的 `GLTFLoader` 新增了相依檔，用 `grep "from '" examples/jsm/loaders/GLTFLoader.js` 檢查並補上。
3. 更新 `VERSION.txt` 與 `LICENSE`（`node_modules/three/LICENSE`）。
4. 用 importmap 頁面重測一次（立方體、GLTFLoader、meshopt），console 不能有 error。若頁面的 `<script type="importmap">` 或模組帶 `?v=`，一起換版本號，避免瀏覽器吃到舊快取。

## 授權

three.js：MIT（見 `LICENSE`）。`examples/jsm/libs/meshopt_decoder.module.js` 是 meshoptimizer（Copyright (C) 2016-2026 Arseny Kapoulkine，MIT），版權聲明保留在該檔檔頭。3D 模型、貼圖等素材的授權獨立於程式碼，請照專案慣例逐一記錄來源與授權。
