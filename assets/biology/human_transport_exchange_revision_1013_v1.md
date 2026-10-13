# 人體的運輸：血管、六區交換、淋巴修訂（2026-10-13）

## 本次授權範圍

老師明確要求修改血管分岔接縫、靜脈瓣膜、血漿顏色與血球排列，並新增心肌、肝臟、腎臟、肺、組織、小腸六大交換區。淋巴頁依最新指示改為原創重繪，另保留可查核來源的維基圖對照；不嵌入老師提供的翰林參考圖。

沒有修改 4-1／4-2，沒有重寫原本心音量測、真實一分鐘倒數、紀錄或魚尾互動。原始函式仍保留，新增模型共用 LivingBook 的播放／暫停時鐘，沒有另開 requestAnimationFrame、setInterval 或 setTimeout。

## 圖像與教學

- 分岔改畫合併後的輪廓，去掉交界重複描邊及斜接縫；血球仍走原中心線。
- 血漿改為淡稻黃色漸層。血球採固定種子的錯落位置、角度及小幅大小差異，不在每次重繪重新亂數；暫停與切換語言不會洗牌。靜脈血球在瓣膜前排隊時，仍保留各自的錯落間距，不會逐漸排成等距方格。
- 靜脈瓣膜兩片能合攏，粒子只有在瓣膜充分開啟時才能通過。壓力反轉為放慢的教學示意，不把靜脈畫成自行規律搏動的心臟。
- 六區分開呈現物質來源與去向；並可逐一聚焦氧氣、二氧化碳、葡萄糖、氨、尿素中該區實際展示的物質。
- 心肌使用自己的冠狀供血；肝臟處理氨、將尿素交回血液；腎臟過濾尿素並再吸收葡萄糖；肺只教氣體交換；組織接起血液運送與細胞利用；小腸的葡萄糖穿過上皮後進入微血管、再到肝門靜脈。
- 「氨 → 尿素」是功能摘要，不是單一步驟或 1:1 分子反應計量。圖形、時間、數量皆為放大的定性模型。
- 淋巴以原創橫向微血管網、組織細胞、盲端毛細淋巴管及淋巴結呈現。遠端頸根部靜脈以框圖明示，不誤接至局部小靜脈；回流路徑連續穿過框圖邊界。
- 淋巴主動畫保留老師同意的主線「血漿 → 組織液 → 淋巴管 → 靜脈」，無直接回微血管支線。血球不跟水分子流出血管。

## 本次新增參考圖的來源

Wikimedia Commons 的 [英文原圖](https://commons.wikimedia.org/wiki/File:Illu_lymph_capillary.png) 與 [中文版本](https://commons.wikimedia.org/wiki/File:Illu_lymph_capillary_zh.png) 均記載來源 NIH／National Cancer Institute 的 SEER，檔案頁標示 Public domain／PD US Government。只把這個查核套用於這兩個檔案，不推論「所有維基圖都無版權」。

兩張圖均保持原始像素、尺寸與文字，未移除背景、未修改；網站的「維基來源圖」使用對應語言。中文原圖的簡體標示照原圖保留，主動畫及網頁預設文字則為繁體中文。原圖的藍色小靜脈只屬示意配色，不表示藍色血液。原始 URL、尺寸及 SHA-256 記於 [來源紀錄](human_transport_media_1012_v1/lymph_sources_1013_v1.json)。

## 科學查核來源

- [OpenStax：血液及血漿](https://openstax.org/books/anatomy-and-physiology/pages/18-1-an-overview-of-blood)：血漿的淡稻黃色。
- [NIH：靜脈瓣膜](https://www.nhlbi.nih.gov/health/varicose-veins)：單向通過與阻止倒流。
- [NIH：心臟供血](https://www.nhlbi.nih.gov/health/heart/blood-flow)：冠狀循環。
- [OpenStax：代謝路徑](https://openstax.org/books/concepts-biology/pages/4-5-connections-to-other-metabolic-pathways)：肝糖及含氮代謝。
- [OpenStax：再吸收與尿素](https://openstax.org/books/anatomy-and-physiology/pages/25-6-tubular-reabsorption)：尿素形成與腎小管再吸收的補充資料。
- [NIH：腎臟如何工作](https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work)：過濾及再吸收；正常血球與多數蛋白留在血液。
- [NIH：肺部氣體交換](https://www.nhlbi.nih.gov/health/lungs/respiratory-system)：氧氣進血、二氧化碳進肺泡。
- [OpenStax：養分消化與吸收](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look)：葡萄糖吸收與肝門靜脈路徑。

## 驗證紀錄

1. 原始中心線 `VESSEL_MAIN`、`VESSEL_BRANCH`、`VEIN_BRANCH`、`BLOOD_MAIN`、`BLOOD_BRANCH` 與本輪修改前備份逐字相同；輪廓、瓣膜與血球位置則依老師明確授權修改。不是宣稱「整份圖只改樣式」。
2. 合併輪廓的數值快取與未快取的幾何，在相同輸入下產生完全相同的 PNG。動脈半徑函式隨脈波變動的情況不使用靜態快取。
3. 血管數值稽核：69,000 次粒子位置、301,898 次關閉瓣膜檢查通過；最小血管內餘裕約 1.78 畫布 px。心音事件為 S1 10 次、S2 10 次。
4. 原生 Canvas 稽核：34 個中英文剖面情境，289 段可見文字，無文字超出畫布。
5. 整合稽核通過 62 個中英文情境與 796 段可見文字，包含六區交換、淋巴主動畫、淋巴結及來源圖；逐段文字 knockout 驗證、六區暫停重繪一致、所有數值座標有限，原始 28 個函式與真實量測倒數保持不變。腎臟葡萄糖終點與小腸交換終點均核對到實際繪製的血管腔。另以 182,400 次血球位置檢查驗證錯落間距經反覆關瓣後仍保留、沒有逆向穿越關閉瓣膜。
6. 瀏覽器實測六區切換與自動播放；單一葡萄糖追蹤及暫停可操作。
7. 瀏覽器 viewport 模擬七款 iPad 的橫直式（14 情境）；畫布均在螢幕內、未壓到控制欄，可見控制按鍵中心點命中本身。另測大、小平板英文橫直式四情境。這是瀏覽器尺寸模擬，不宣稱實體 iPad 驗收。
8. 1080px 主框架及 h1 48px 保留。新增主教學標示 22px、主圖標題 26–27px；次要圖例 20px、來源及非比例說明 18px，沒有為英文縮小原有主要字級，較長圖例改換行。

修改前備份：`local-backups/20261013-vessel-junction-pre.WFOqVm/`。QA 只寫入暫存目錄，沒有把私人教科書 PDF 或翰林參考圖提交至 Git。
