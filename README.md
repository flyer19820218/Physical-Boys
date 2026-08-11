# 黎明國中自然科學與數理互動教學總庫
(Science Interactive Curriculum Platform)

## 專案簡介
這是一個專為國中自然科學設計的 **HTML5 互動式教學網站**。  
本系統旨在透過高解析度動態圖解、Canvas 互動模擬器與邏輯清晰的排版，幫助學生建構直觀且紮實的科學與數理概念，並提供隨堂演練的即時回饋。

## 系統五層架構 (5-Level Architecture)
為確保國中三年龐大的教材內容能夠有條理地擴充，全站嚴格遵守以下五層架構：

1. **大館 (Pavilion)：** 依學科分類（物理與力學、化學與反應、生物與生命、地科與天文）。
2. **章節 (Chapter)：** 總計規劃約 30 個核心章節（如：化學反應與平衡、氧化還原反應）。
3. **單元 (Unit)：** 每個章節下轄 4~6 個單元，逐步深化觀念。
4. **分頁 (Tab)：** 每個單元內含 4~5 個頁籤，切割學習知識點。
5. **子分頁 (Sub-tab)：** 針對計算題與實驗題，提供「問題 ➔ 提示 ➔ 解答」的三部曲互動演練。

## 視覺與排版核心規範 (UI/UX Guidelines)
為了保障課堂大螢幕投影效果與學生的閱讀舒適度，開發時必須遵守以下鐵律：

* **零黑色護眼原則 (Dark Chalkboard Theme)：** 背景嚴格採用吸光深黛綠（`#11261f` / `#16332a`）。嚴禁任何純黑色字體與線條，文字一律採用高對比粉筆亮色。
* **大螢幕滿版雙欄排版：** 採用 CSS Grid `grid-template-columns: repeat(auto-fit, minmax(420px, 1fr))`，專為 iPad 橫置與觸控屏幕最佳化。
* **字體地板與防斷字綁定 (Typography & No-Wrap)：** 內文基礎字體堅持最低 20px。化學符號與數學變數統一綁定高辨識度的 **`Verdana`** 或 **`JetBrains Mono`** 字體。專有名詞與公式嚴格加入 `white-space: nowrap;` 防斷字機制。
* **標準理化上下分式：** 徹底摒棄單行斜線（`/`）的排版，物理公式與化學計算一律使用 CSS `flex` 建構專業的垂直上下分數線。
* **專業語境輸出：** 內容文字需維持名師教學現場的專業、簡明與直白，禁止使用無意義的中二誇飾字眼。

---

## 課程單元與互動教材目錄

> 本目錄以首頁 `index.html` 的實際上線內容為準。

### 🍎 物理與力學館 (Physics)

* **01｜⚖️ 密度與質量** （3 個小單元）
  * [實驗室安全與長度測量](density_1.html)
  * [質量與體積的測量](density_2.html)
  * [密度的核心意義與計算](density_3.html)
* **02｜🌊 波動與聲波** （4 個小單元）
  * [波的傳遞與力學波](waves_1.html)
  * [聲波傳播與聲速計算](waves_2.html)
  * [回聲原理與兩山試題](waves_3.html)
  * [聲音三要素與共振](waves_4.html)
* **03｜💡 光學與透鏡** （6 個小單元）
  * [光的直進與針孔成像](optics_1.html)
  * [平面鏡成像與反射定律](optics_2.html)
  * [光的折射與全反射](optics_3.html)
  * [光學透鏡與視力矯正](optics_4.html)
  * [光與顏色](optics_5.html)
  * [進階光學：連續反射解析](optics_max1.html)
* **04｜🔥 熱學與熱力學** （5 個小單元）
  * [溫度與溫度計](thermo_1.html)
  * [熱量與熱平衡基礎](thermo_2.html)
  * [比熱與圖形斜率分析](thermo_3.html)
  * [熱傳播的三種方式](thermo_4.html)
  * [熱對物質的影響與化學反應](thermo_5.html)
* **05｜🧲 基礎力學與壓力** （5 個小單元）
  * [力的本質與彈簧](mechanics_1.html)
  * [力的合成、分解與平衡](mechanics_2.html)
  * [無所不在的摩擦力](mechanics_3.html)
  * [壓力與液體壓力](mechanics_4.html)
  * [大氣壓力與浮力](mechanics_5.html)
* **06｜📐 直線運動學** （5 個小單元）
  * [位置、路徑長與位移](kinematics.html)
  * [平均速率、速度與 V-T 圖](kinematics_2.html)
  * [等速度與加速度運動](kinematics_3.html)
  * [等加速度運動（上集）](kinematics_4.html)
  * [等加速度與自由落體（下集）](kinematics_5.html)
* **07｜🍎 牛頓力學與圓周運動** （5 個小單元）
  * [牛頓第一運動定律與慣性](newton_1.html)
  * [牛頓第二運動定律與 F=ma](newton_2.html)
  * [牛頓第三運動定律與視重](newton_3.html)
  * [圓周運動與萬有引力](newton_4.html)
  * [力矩與靜力平衡](newton_5.html)
* **08｜⚡ 功與能** （4 個小單元）
  * [功的定義與功率](work_1.html)
  * [動能與重力位能](work_2.html)
  * [力學能守恆定律](work_3.html)
  * [簡單機械與機械效率](work_4.html)
* **09｜💡 基礎電學與電路** （4 個小單元）
  * [靜電現象與基本電路](electronics_1.html)
  * [電壓本質與電路三態](electronics_2.html)
  * [串並聯電路與電流](electronics_3.html)
  * [電阻與歐姆定律](electronics_4.html)
* **10｜🧭 電與磁** （1 個小單元）
  * [磁力與磁場](magnetism_1.html)｜磁極互動、磁疇、磁力線、指南針與地球磁場互動解析

### 🧪 化學與反應館 (Chemistry)

* **01｜🧪 空氣與溶液** （4 個小單元）
  * [物質的性質與分離](concerntration_1.html)
  * [三大濃度的計算](concerntration_2.html)
  * [溶解度與飽和濃度](concerntration_3.html)
  * [空氣與氣體製備](concerntration_4.html)
* **02｜⚛️ 原子與元素週期表** （4 個小單元）
  * [純物質與元素](atomics_1.html)
  * [原子模型與週期表](atomics_2.html)
  * [微粒計算與同位素](atomics_3.html)
  * [物質結構與化學式](atomics_4.html)
* **03｜⚖️ 化學反應與方程式平衡** （3 個小單元）
  * [化學反應與質量守恆](chem_reaction_1.html)
  * [化學反應式與平衡係數](chem_reaction_2.html)
  * [原子量、分子量與莫耳](chem_reaction_3.html)
* **04｜🔥 氧化與還原反應** （3 個小單元）
  * [狹義的氧化還原與活性](redox_1.html)
  * [氧化還原的競爭法則與電子轉移](redox_2.html)
  * [金屬冶煉與生活防護](redox_3.html)
* **05｜⚗️ 電解質、酸、鹼與鹽類** （4 個小單元）
  * [電解質與微觀解離說](electrolyte_1.html)
  * [常見的酸與鹼與濃酸危機](electrolyte_2.html)
  * [莫耳濃度、稀釋與 pH 值計算](electrolyte_3.html)
  * [酸鹼中和、滴定與常見鹽類](electrolyte_4.html)
* **06｜⚡ 反應速率與化學平衡** （3 個小單元）
  * [反應速率與碰撞學說](chem_reaction_balance_1.html)
  * [活化能與催化劑](chem_reaction_balance_2.html)
  * [可逆反應與動態平衡](chem_reaction_balance_3.html)
* **07｜🧬 有機化學與生活分子** （4 個小單元）
  * [有機物基礎與木材乾餾](organics_1.html)
  * [常見有機物 (烴、醇、酸、酯)](organics_2.html)
  * [聚合物與衣料纖維](organics_3.html)
  * [食品化學與清潔劑](organics_4.html)
* **08｜🔋 電化學與化學電池** （5 個小單元）
  * [電能與電功率](electric_energy_power_1.html)
  * [電力輸送與電費](electric_power_transmission_2.html)
  * [短路與用電安全](electrical_safety_3.html)
  * [化學電池](galvanic_batteries_4.html)
  * [電解與電鍍](electrolysis_5.html)

### 🧬 生物與生命館 (Biology)

* **BIO｜🧬 生命科學與生物技術** （規劃中）
  * 🔬 課程單元規劃中：收錄細胞構造與生理功能、光合作用與呼吸作用、人體各大器官系統、協調與恆定、遺傳學與演化等核心教材...

### 🌍 地科與天文館 (Earth Science)

* **01｜🌍 水與陸地** （4 個小單元）
  * [地球上的水與地下水](earth_water_1.html)
  * [地貌的改變與外營力](earth_landforms_2.html)
  * [海岸線與動態平衡](earth_coastline_3.html)
  * [岩石家族與變身循環](earth_rocks_4.html)
* **02｜🌋 板塊運動與地球歷史** （4 個小單元）
  * [地球內部構造與板塊動力](earth_interior_1.html)
  * [板塊交界與地表變動](earth_plates_2.html)
  * [岩層密碼與地球歷史](earth_strata_3.html)
  * [臺灣的板塊與地震](earth_taiwan_quake_4.html)
* **03｜🌌 太空的世界** （4 個小單元）
  * [宇宙尺度與太陽系](astronomy_universe_1.html)
  * [地球自轉、公轉與四季](astronomy_earth_motion_2.html)
  * [太陽運行與天球模型](astronomy_sunpath_3.html)
  * [月相、日月食與潮汐](astronomy_moon_phases_4.html)

---
**設計與課程企劃：** 呂彥君老師  
**聯絡信箱：** flyer19820218@gmail.com  
**系統特點：** 純淨前端架構（HTML5, CSS3, Vanilla JS），免外掛、免伺服器後端，下載即可於任意大螢幕或平板無縫運行。
