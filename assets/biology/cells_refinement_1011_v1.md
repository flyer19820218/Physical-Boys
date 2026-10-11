# 細胞與玻片製作｜教學圖與操作修訂

日期：2026-10-11。老師授權：頁首精簡、提供的神經細胞卡通圖延長纖維約三倍、可切回真實照片、恢復可辨認的製片步驟鍵。

## 神經細胞圖

- 來源：老師本次提供的課本截圖（紫色神經細胞；原標示為細胞本體、細胞核、神經纖維）。附件未另附作者、出版社或版次，不猜測來源，也不把原圖改掛 CC 授權。
- 正式資產：[neuron_long_fibers_1011_v1.png](neuron_long_fibers_1011_v1.png)。來源著作權不變；這是老師提供圖像的 AI 編輯改作，不是「原創 AI」或真實顯微照片。
- 製作工具：內建 imagegen，edit / precise-object-edit，兩次編輯，白色背景，不鏡像。保留紫色細胞本體和圓形細胞核，擴展畫面、延長細長突起，移除嵌入的文字與指示線。雙語構造名稱改由 HTML 按鍵顯示。
- 「約三倍」是相對原示意圖的教學延長目標，不是生物實際尺度；本體與核仍可辨識，纖維連續附著，同一個神經細胞。沒有用拉伸 CSS 壓扁本體。
- 原始螢光照片 `photos/neuron_fluorescence_v2.jpg` 完全保留。作者 ManuelSchottdorf；[原來源](https://commons.wikimedia.org/wiki/File:GFP_Neurons.png)；[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。綠色來自 GFP 標記，不是天然顏色。
- 主觀察台預設顯示構造示意，可切換真實照片；下方七張真實照片圖鑑、作者和授權維持不變。兩種圖像都有原圖復位、單指拖曳、雙指縮放。

## 最終編輯提示詞

> Refine this edited purple textbook neuron so its elongated fibers clearly meet the teacher's requested roughly 3-fold length relative to the original source. Preserve the exact purple painted soma and nucleus shape, style and anatomical attachment. The current left axon is still not long enough relative to soma diameter. Make the axon's continuous soma-to-terminal curved path roughly EIGHT TIMES the diameter of the soma body (excluding dendrites). Make the dendrites slender and long, approx 2–3 soma-body diameters each, with small tapered branches. Expand the clean WHITE landscape canvas as needed: soma occupies about 10–11% of total canvas width, toward the right, and the very long thin beaded axon spans around 80% of the width to the left, gently curved, ending in a small fine terminal arbor. A single neuron only; beaded segments attached to the one continuous thin axon, not detached chain. Cell body remains undistorted, purple prominent rounded nucleus easy to distinguish. Keep the same illustration style, no facial features. All complete branches within image with safe white margins, no clipped terminal. Absolutely no text, numbers, labels, arrows, brackets, logos or watermark. Do not mirror or replace with a different neuron. This is an edit of the teacher-provided image, keep biological body identity.

## 製片控制

- 線上測試：既有「下一步」按鍵並未被刪除，五步流程能執行；原先動畫尚未播完就先把文字換成下一步，且沒有獨立步驟鍵，操作狀態不明確。
- 增加五個可見步驟鍵；只有目前步驟能執行，已完成步驟以綠色標示。每個鍵轉交同一個原始 `mountNext`，不複製製片狀態、不重寫動畫。
- 播放時明示「操作中」，結束後才顯示「下一步」。原始動畫時間、滴液路徑、標本位置、蓋片幾何、吸水流程與三種標本選擇不改。
- 按鍵至少 44px 高；全螢幕控制維持左側，說明仍在圖下。其他單元不受影響。

## 驗證紀錄

待本版完成原生 Canvas、事件流程及瀏覽器驗證後填入結果。不把桌機測試當成實機 iPad 測試。
