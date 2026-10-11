# 生物圈尺度運鏡：影像與比例紀錄

核對日期：2026-10-11。此段為不同來源影像串接的教學模型，不是同一地點、同一生物一路拍到太空的紀錄片。沒有校準比例尺的顯微照片與鴨照片，不可用螢幕像素直接量測生物。

## 原始影像

| 網站素材 | 作者與來源 | 使用條件 | 本教材修改 |
|---|---|---|---|
| `paramecium_1800.jpg`，草履蟲 Paramecium caudatum | MTadey，[Wikimedia Commons 原圖頁](https://commons.wikimedia.org/wiki/File:Param%C3%A9cium_caud%C3%A1tum.jpg)，2019-05-06 自作顯微照片 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；保留作者、來源、授權連結與修改聲明，不暗示背書 | 3264×2448 等比例縮為 1800×1350；JPEG；播放時裁切、平移、縮放；未重畫生物 |
| `mallard_1920.jpg`，綠頭鴨雌鳥 Anas platyrhynchos | CEKeech，[Wikimedia Commons 原圖頁](https://commons.wikimedia.org/wiki/File:On_a_Golden_Pond,_230821_DSCN1974.jpg)，2023-08-21，Cedar Mill Wetlands | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；仍保留作者與來源方便查證 | 3088×1737 等比例縮為 1920×1080；JPEG；播放時裁切、平移、縮放；未重畫生物 |
| `earth_july_4096.jpg`，Blue Marble Next Generation，2004 年 7 月 | NASA Earth Observatory / Reto Stöckli，[資料集及署名規範](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/)，[月份底圖](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/) | [NASA 影像使用規範](https://www.nasa.gov/nasa-brand-center/images-and-media/)；按資料集要求標示 NASA Earth Observatory，不暗示 NASA 背書。此規範不可泛化至 NASA 網站上的第三方受保護影像 | 5400×2700 等比例縮為 4096×2048；投影到球面、取景、照明與光暈。這是衛星月合成、去雲的地表資料，不是單張照片或即時影像 |
| `earth_globe_fallback.png` | 由上一項 NASA 紋理及本教材的球面 UV／照明算式產生 | 隨上一項保留 NASA 來源及修改說明 | 原創渲染；只在立體渲染無法使用時提供靜態球體。介面不假稱靜態備援可旋轉 |

原始檔與本機驗證影像另存於本機 `originals/`、`qa/`、`qa_20s_apple/`，不把這些大型工作檔加入學生網頁。公開網頁的「影像來源與尺度說明」已附作者、來源、授權及修改方式。

## 蘋果皮比喻與尺度

- 地球平均半徑約 6,371 km；[NASA Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html)。
- 本教材依老師指定，用海平面上下各約 10 km、總厚約 20 km 比較尺度。這不是生命分布的硬邊界，也不代表各深度都有同樣多的生物。
- 地球模型直徑若為 10 cm = 100 mm，薄層換算為 `20 ÷ (2 × 6371) × 100 = 0.156961… mm ≈ 0.16 mm`。
- 蘋果剖面為本教材程式繪製的原創教學示意，不是實拍。果皮邊緣為了辨識而放大；真正果皮厚度因水果而異，不能把 0.16 mm 說成果皮實測值。
- 局部剖面厚度先放大 4 倍，退到整顆地球後恢復 `±10 / 6371` 的相對半徑；1280×720 畫布中最後的整層約 0.81 px。藍色地球光暈是光影效果，不是生物圈厚度。
- 四鏡頭全程 20 秒；最後停住，讓學生讀比例、旋轉地球或重播。影像上的移動是數位運鏡，不是草履蟲或鴨的錄影動作。

## 整合與驗證界線

在 `biology_intro.html` 的三個既有 chapter1 adapter 之後載入新 JS，再呼叫 `BiosphereCinema.mount()`。原本的生物圈 `.board` 隱藏保留，所有 ID、原始 SVG 座標及原始 inline JS 未改；其他分頁、酵母實驗、題目及全站首頁樣式未改。

驗證：JS 語法、素材存在、原始來源逐字比對、真實影像的 native Canvas 逐幀像素變化、比例算式，以及模擬 DOM 中的選鏡頭、播放結束、拖曳、重播、雙語、全螢幕進退、非作用分頁暫停與失敗提示。

尚未驗證：真正瀏覽器的 WebGL shader、CSS computed style／版面截圖、瀏覽器字體，以及實機 iPad 觸控與全螢幕。模擬事件或 native Canvas 渲染不等於完成這些驗證。
