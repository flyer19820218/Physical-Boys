# 自然科學與數理互動教學

> **Physical-Boys**｜給國中自然科課堂的開源 HTML5 雙語互動教材庫  
> **4 館・34 單元・139 課**：物理、化學、地科與天文、生物

## 專案簡介

這是一套面向國中自然科學課堂的 **開源 HTML5 雙語互動教材庫**。它不把學生留在被動觀看動畫的位置，而是讓學生親手拖曳、旋轉、改變變因、觀察回饋，再用生物、物理、化學與地球科學語言解釋結果。

教材以 **STEM 教育**、**探究式學習（Inquiry-Based Learning）**、**科學視覺化** 與 **互動模擬** 為核心，涵蓋生物、物理、化學、地球科學、天文與數學連結。網站採純前端架構（HTML5、CSS3、Canvas、Vanilla JS），免安裝、免後端，可直接於教室大螢幕、iPad 與一般瀏覽器使用。

## 課程規模

| 館 | 單元 | 課 | 星球上的代表科學家 |
|---|---:|---:|---|
| 🍎 物理與力學館（Physics） | 10 | 45 | 牛頓（Newton） |
| 🧪 化學與反應館（Chemistry） | 8 | 31 | 拉瓦節（Lavoisier） |
| 🌍 地科與天文館（Earth Science） | 5 | 20 | 韋格納（Wegener） |
| 🌱 生物科學館（Biology） | 11 | 43 | 達爾文（Darwin） |
| **合計** | **34** | **139** | |

每個單元 2～6 課；一課就是一個獨立的 HTML 檔，可單獨開啟、單獨上課。課程目錄中的 ★ 是老師標記的重點課（共 121 課）。

- **🍎 物理與力學館**（10 單元）：密度與質量｜波動與聲波｜光學與透鏡｜熱學與熱力學｜基礎力學與壓力｜直線運動學｜牛頓力學與圓周運動｜功與能｜基礎電學與電路｜電與磁
- **🧪 化學與反應館**（8 單元）：空氣與溶液｜原子與元素週期表｜化學反應與方程式平衡｜氧化與還原反應｜電解質、酸、鹼與鹽類｜反應速率與化學平衡｜有機化學與生活分子｜電化學與化學電池
- **🌍 地科與天文館**（5 單元）：水與陸地｜板塊運動與地球歷史｜太空的世界｜大氣與天氣｜全球氣候變遷
- **🌱 生物科學館**（11 單元）：生命科學緒論｜組成生物的層次與尺度｜養分與生命｜生物的運輸與防禦｜協調與感應｜生物的恆定性｜生殖與生命延續｜遺傳與生物技術｜地球上的生物｜生物圈與生態關係｜人類與環境

## 從哪裡開始

- **`index.html`｜伽利略星球**：網站首頁，四個館在這裡集合（2026-10-26 上線，持續建置中；計畫與交接見 [`galileo-planet/`](galileo-planet/)）。
- **`index_classic.html`｜課程清單**：舊版清單首頁，同時也是全部課程卡片的實際資料來源。
- **單課頁面**：每一課都是獨立的 HTML（例如 `density_1.html`），課程目錄中的連結可直接開啟。
- **本機預覽**：在專案根目錄執行 `tools/qa/serve.sh`，再開 <http://127.0.0.1:8765/>（背後只是一個 Python 靜態伺服器）。

## 教材架構

全站依照下列層級擴充：

| 層級 | 數量 | 說明 |
|---|---|---|
| **館**（Hall） | 4 | 依學科分類：物理、化學、地科與天文、生物。 |
| **單元**（Unit） | 34 | 一個完整的科學主題，例如「牛頓力學與圓周運動」；每單元 2～6 課，依教學路徑逐步深化。 |
| **課**（Lesson） | 139 | 一個獨立 HTML，是上課的基本單位。 |
| **分頁**（Tab） | 每課數個 | 每課依教學路徑分成數個主分頁（通常 3～6 個）；每個分頁都應有自己的曉臻老師 Hook，分頁鈕以「學生鉤子＋專業副標題」雙層標題為準。 |
| **互動與演練** | | 動畫、操作與練習；練習題採「問題 → 提示 → 解答」。 |

> **名詞對照**：本 README 以「單元」稱 34 個主題、以「課」稱 139 個 HTML 頁面。`PROGRESS.md` 的用法不同：那裡的「單元數」指的是「課」、「分類」指的是「單元」。

## 課程地圖

以 `index_classic.html` 的實際上線內容為準（由 `tools/museum/build_lessons.py` 產生 `assets/museum/data/lessons.json`，本節由該檔案整理）。★ ＝ 老師標記的重點課。展開各館查看全部課程：

<details>
<summary><b>🍎 物理與力學館（Physics）｜10 單元・45 課</b></summary>

#### 01｜⚖️ 密度與質量 <sub>Density & Measurement・3 課</sub>

- [實驗室安全與長度測量](density_1.html) ★｜📏 7大器材操作防呆、錯視對比、直尺精密度實戰與平均值剔除
- [質量與體積的測量](density_2.html) ★｜⚖️ 質量重量差異、天平秤重實戰、三大排水法與量筒視差檢定
- [密度的核心意義與計算](density_3.html) ★｜📊 切塊密度分析、唸法意義、萬用黑板計算機與純物質 M-V 圖解剖

#### 02｜🌊 波動與聲波 <sub>Waves & Sound・4 課</sub>

- [波的傳遞與力學波](waves_1.html)｜〰️ 橫波、縱波與介質運動模擬示範
- [聲波傳播與聲速計算](waves_2.html)｜📐 介質差異、溫度對聲速影響與公式計算
- [回聲原理與兩山試題](waves_3.html)｜⛰️ 回聲條件、表面漫射動畫與經典兩山距離計算
- [聲音三要素與共振](waves_4.html)｜🔔 響度、音調、音色互動實驗、水杯敲吹考題與共振現象

#### 03｜💡 光學與透鏡 <sub>Optics & Lenses・6 課</sub>

- [光的直進與針孔成像](optics_1.html)｜🔦 動態模擬針孔成像與光線直進原理
- [平面鏡成像與反射定律](optics_2.html) ★｜🪞 虛像定位、曲面鏡視野與雷射反射定律
- [光的折射與全反射](optics_3.html)｜💎 偏折規律、水池變淺解析與海市蜃樓模擬
- [光學透鏡與視力矯正](optics_4.html)｜👓 凸透鏡與凹透鏡成像規律、近視與遠視光路分析
- [光與顏色](optics_5.html)｜🌈 色光三原色、物體顏色呈現與濾光片解析
- [進階光學：連續反射解析](optics_max1.html)｜📐 雙平面鏡夾角反射與虛像個數公式探究

#### 04｜🔥 熱學與熱力學 <sub>Thermal Physics・5 課</sub>

- [溫度與溫度計](thermo_1.html)｜🌡️ 溫度計原理、攝氏華氏比例換算與自製水溫度計計算
- [熱量與熱平衡基礎](thermo_2.html)｜☕ 熱傳遞方向、1卡定義與理想熱平衡溫度計算
- [比熱與圖形斜率分析](thermo_3.html)｜📈 質量×比熱圖形斜率分析、熱量散失進階試題解析
- [熱傳播的三種方式](thermo_4.html)｜💨 傳導、對流與輻射互動模擬與生活實例全解析
- [熱對物質的影響與化學反應](thermo_5.html) ★｜❄️ 冰晶氫鍵微觀解密、4°C水的特例、脫水變色與長效沸騰曲線

#### 05｜🧲 基礎力學與壓力 <sub>Forces, Pressure & Fluids・5 課</sub>

- [力的本質與彈簧](mechanics_1.html) ★｜⚖️ 質量重力差異、接觸與超距力、虎克定律與串並聯拉力賽
- [力的合成、分解與平衡](mechanics_2.html) ★｜🎯 向量拔河、靜力平衡檯、平行四邊形雷達與斜面滑塊解析
- [無所不在的摩擦力](mechanics_3.html) ★｜🛹 微觀咬合探測、最大靜摩擦 V-t 圖推箱實戰與變因控制
- [壓力與液體壓力](mechanics_4.html) ★｜📌 固體壓力計算、液體深度影響、連通管與帕斯卡原理解析
- [大氣壓力與浮力](mechanics_5.html) ★｜💨 馬德堡拔河、托里切利氣壓計、阿基米德原理與沉浮觀念挑戰

#### 06｜📐 直線運動學 <sub>Linear Kinematics・5 課</sub>

- [位置、路徑長與位移](kinematics.html)｜📍 從數線座標到操場、時鐘秒針的幾何分析與隨堂練習
- [平均速率、速度與 V-T 圖](kinematics_2.html)｜🚗 雙車動態對照、面積位移與經典折返運動解析
- [等速度與加速度運動](kinematics_3.html)｜🚄 動態黑板教學版：加速度與等速度運動觀念剖析
- [等加速度運動（上集）](kinematics_4.html)｜⏱️ 1:1 大螢幕模擬器：打點計時器、伽利略斜面觀念建立
- [等加速度與自由落體（下集）](kinematics_5.html)｜📉 等加速度四大公式應用與自由落體深度定義解析

#### 07｜🍎 牛頓力學與圓周運動 <sub>Newtonian Mechanics・5 課</sub>

- [牛頓第一運動定律與慣性](newton_1.html) ★｜🚌 伽利略斜面思想實驗、動者恆動與公車加減速生活慣性模擬
- [牛頓第二運動定律與 F=ma](newton_2.html) ★｜🚀 外力與加速度正反比關係、重量換算牛頓 N 與太空梭質量測量
- [牛頓第三運動定律與視重](newton_3.html) ★｜⛵ 雙木塊受力隔離圖、滑板拉繩對抗、帆船迷思與電梯超失重解析
- [圓周運動與萬有引力](newton_4.html) ★｜🛰️ 向心力與切線飛行、交流道轉彎斜坡分析與距離平方反比定律
- [力矩與靜力平衡](newton_5.html) ★｜🎯 支點力臂與轉動效應、順逆時針力矩與靜力平衡條件

#### 08｜⚡ 功與能 <sub>Work & Energy・4 課</sub>

- [功的定義與功率](work_1.html) ★｜🏋️ 正功與負功定義、施力與位移夾角分析與功率計算
- [動能與重力位能](work_2.html) ★｜🎢 U型軌道動能位能互換、質量與速率平方正比關係
- [力學能守恆定律](work_3.html) ★｜🔄 單擺擺盪動位能互換模擬、🪂 自由落體與 🔥 焦耳熱功當量實驗
- [簡單機械與機械效率](work_4.html) ★｜🔩 功的原理：省力必定費距離、銳角拔釘演練與輪軸斜面解析

#### 09｜💡 基礎電學與電路 <sub>Electricity & Circuits・4 課</sub>

- [靜電現象與基本電路](electronics_1.html) ★｜⚡ 摩擦起電、靜電感應與基礎電路元件觀察
- [電壓本質與電路三態](electronics_2.html) ★｜🔋 水流模型對比、電路三態與危險短路模擬
- [串並聯電路與電流](electronics_3.html) ★｜🌊 電流定義、電表測量法則與歷屆經典考題
- [電阻與歐姆定律](electronics_4.html) ★｜🚧 微觀碰撞、V-I關係圖與未知電阻測量實戰

#### 10｜🧭 電與磁 <sub>Electricity & Magnetism・4 課</sub>

- [磁力與磁場](magnetism_1.html) ★｜🧲 磁極互動、磁疇、磁力線、指南針與地球磁場互動解析
- [電生磁與電磁鐵](electromagnetism_2.html) ★｜⚡ 奧斯特實驗、右手定則、線圈磁場疊加、電磁鐵起重機與電話聽筒動畫
- [磁力與電動機](electric_motor_3.html) ★｜⚙️ 右手開掌定則、平行導線交互作用、帶電粒子運動、分裂環換向與直流電動機動畫
- [電磁感應與交流電](electromagnetic_induction_4.html) ★｜⚡ 法拉第與冷次定律、發電機、變壓器、感應加熱與高中資優計算

</details>

<details>
<summary><b>🧪 化學與反應館（Chemistry）｜8 單元・31 課</b></summary>

#### 01｜🧪 空氣與溶液 <sub>Air & Solutions・4 課</sub>

- [物質的性質與分離](concerntration_1.html) ★｜⚗️ 物理與化學變化、純物質與混合物、過濾法與結晶法實戰模擬
- [三大濃度的計算](concerntration_2.html) ★｜📊 水溶液與飽和、重量百分濃度、體積百分濃度與 ppm 計算機
- [溶解度與飽和濃度](concerntration_3.html) ★｜📈 溶解度與溶解量區別、溫度溶解度曲線與降溫結晶進階題
- [空氣與氣體製備](concerntration_4.html) ★｜🎈 空氣組成比例、雙氧水製氧與排水集氣裝置圖、二氧化碳檢驗

#### 02｜⚛️ 原子與元素週期表 <sub>Atoms & the Periodic Table・4 課</sub>

- [純物質與元素](atomics_1.html) ★｜💎 物質分類、拉瓦節電解水、部首玄機與常見金屬非金屬解析
- [原子模型與週期表](atomics_2.html) ★｜🗺️ 微觀科學史演進、18x7 週期表地圖規律與四大家族密碼
- [微粒計算與同位素](atomics_3.html) ★｜🧮 質子中子電子比較、離子數目計算機與同素異形體特性解析
- [物質結構與化學式](atomics_4.html) ★｜🔗 微觀三大結構導電性、離子轉譯器、乙醇立體結構與解題特區

#### 03｜⚖️ 化學反應與方程式平衡 <sub>Chemical Reactions & Equations・4 課</sub>

- [化學反應與質量守恆](chem_reaction_1.html) ★｜⚖️ 四大現象、煙火動畫、碳燃燒微觀視角與密閉系統沉澱實驗
- [化學反應式與平衡係數](chem_reaction_2.html) ★｜📝 書寫原則、觀察法、代數法與資優氧化還原法互動推導
- [原子量、分子量與莫耳](chem_reaction_3.html) ★｜🧮 碳-12標準、分子量計算、亞佛加厥數與莫耳質量雙向轉換
- [化學計量與反應計算](chem_reaction_4.html) ★｜🧪 係數比＝莫耳數比、質量與莫耳換算路徑、限量試劑判定

#### 04｜🔥 氧化與還原反應 <sub>Oxidation & Reduction・3 課</sub>

- [狹義的氧化還原與活性](redox_1.html) ★｜🔥 6 大元素虛擬燃燒實驗室、金屬活性順序與酸鹼性規律
- [氧化還原的競爭法則與電子轉移](redox_2.html) ★｜🧪 碳還原氧化銅微觀模擬、氧化劑還原劑判定與資優挑戰
- [金屬冶煉與生活防護](redox_3.html) ★｜🏭 高爐煉鐵化學交響曲、生鐵鋼熟鐵解析與生活氧化還原防護

#### 05｜⚗️ 電解質、酸、鹼與鹽類 <sub>Electrolytes, Acids, Bases & Salts・4 課</sub>

- [電解質與微觀解離說](electrolyte_1.html) ★｜⚡ 巨觀導電實驗、封閉迴路、電解水氣泡 2:1 與離子移動微觀解離模擬
- [常見的酸與鹼與濃酸危機](electrolyte_2.html) ★｜🔥 三大強酸與弱酸性質、方糖碳化實驗與濃酸稀釋防呆安全模擬
- [莫耳濃度、稀釋與 pH 值計算](electrolyte_3.html) ★｜🥤 標準溶液配製儀表板、稀釋混合計算與極端 pH 值挑戰
- [酸鹼中和、滴定與常見鹽類](electrolyte_4.html) ★｜💧 自動滴定變色實驗機、常見鹽類圖鑑與酸鹼中和計量演練

#### 06｜⚡ 反應速率與化學平衡 <sub>Reaction Rates & Equilibrium・3 課</sub>

- [反應速率與碰撞學說](chem_reaction_balance_1.html) ★｜⏱️ 直觀感受、有效碰撞條件、四大影響變因與硫代硫酸鈉經典實驗
- [活化能與催化劑](chem_reaction_balance_2.html) ★｜🔥 跨越反應門檻、催化劑的魔法與四大特性、生活與工業應用
- [可逆反應與動態平衡](chem_reaction_balance_3.html) ★｜⚖️ 巨觀靜止與微觀沸騰、濃度/溫度/壓力破壞平衡、鐘乳石與血液緩衝

#### 07｜🧬 有機化學與生活分子 <sub>Organic & Everyday Chemistry・4 課</sub>

- [有機物基礎與木材乾餾](organics_1.html) ★｜🧪 歷史定義與例外盲盒、乾餾產物檢驗、同分異構物 3D 結構
- [常見有機物 (烴、醇、酸、酯)](organics_2.html) ★｜⛽ 沸點分離分餾塔、酸醇微觀解離對比與 🍌 果香酯化脫水拼圖
- [聚合物與衣料纖維](organics_3.html) ★｜🔗 單體聚合鎖鏈動畫、熱塑熱固加熱對比與 🔥 布料鑑識燃燒實驗
- [食品化學與清潔劑](organics_4.html) ★｜🍳 蛋白質不可逆變性、皂化大釜煉金術與 🦠 肥皂微胞去污攻擊戰

#### 08｜🔋 電化學與化學電池 <sub>Electrochemistry & Batteries・5 課</sub>

- [電能與電功率](electric_energy_power_1.html) ★｜⚡ 電能三大效應、E=IVt 推導、串並聯電能計算、電功率與電器標示
- [電力輸送與電費](electric_power_transmission_2.html) ★｜🔌 直流與交流、高壓輸電線損、一度電與電費、家庭 110 V／220 V 配電與接地安全
- [短路與用電安全](electrical_safety_3.html) ★｜🔥 短路與過載、導線發熱、保險絲與斷路器、觸電防護及延長線額定電流互動解析
- [化學電池](galvanic_batteries_4.html) ★｜🔋 賈法尼與伏打科學史、氧化還原、鋅銅電池、鹽橋與常見電池互動解析
- [電解與電鍍](electrolysis_5.html) ★｜⚡ 導電與電極、電解水、硫酸銅電解與電鍍工業的互動解析

</details>

<details>
<summary><b>🌍 地科與天文館（Earth Science）｜5 單元・20 課</b></summary>

#### 01｜🌍 水與陸地 <sub>Water & Land・4 課</sub>

- [地球上的水與地下水](earth_water_1.html) ★｜🌊 四大層圈、水體分布、海水鹽度、冰川海平面、地下水面與超抽危機
- [地貌的改變與外營力](earth_landforms_2.html) ★｜⛰️ 內外營力、風化作用、河流剖面與冰川、風、海浪地形配對
- [海岸線與動態平衡](earth_coastline_3.html) ★｜🏖️ 泥沙收支、海退海進、河口供沙與水庫、防波堤工程衝擊
- [岩石家族與變身循環](earth_rocks_4.html) ★｜🪨 礦物鑑定、火成岩冷卻、沉積與變質作用、三大岩類循環拼圖

#### 02｜🌋 板塊運動與地球歷史 <sub>Plate Tectonics & Earth History・4 課</sub>

- [地球內部構造與板塊動力](earth_interior_1.html) ★｜🌍 地殼、地函、地核、岩石圈與軟流圈，搭配熱對流與板塊運動圖解
- [板塊交界與地表變動](earth_plates_2.html) ★｜🌊 全球板塊、海底擴張、隱沒、造山與地震火山分布的互動圖解
- [岩層密碼與地球歷史](earth_strata_3.html) ★｜🪨 褶皺、斷層、地質事件時光機與代表性化石年代判讀
- [臺灣的板塊與地震](earth_taiwan_quake_4.html) ★｜🇹🇼 臺灣造山、震源震央、規模與震度、地震密集區與防災判斷

#### 03｜🌌 太空的世界 <sub>Space & Astronomy・4 課</sub>

- [宇宙尺度與太陽系](astronomy_universe_1.html) ★｜🌌 從宇宙、銀河系一路縮放到太陽系、地球與月球，建立天體尺度與宇宙空間概念
- [地球自轉、公轉與四季](astronomy_earth_motion_2.html) ★｜🌍 晝夜交替、時刻、太陽東升西落、地球公轉與四季成因互動解析
- [太陽運行與天球模型](astronomy_sunpath_3.html) ★｜☀️ 太陽日周運動、季節日照路徑與天球方位模型互動解析
- [月相、日月食與潮汐](astronomy_moon_phases_4.html) ★｜🌙 月相與觀測時間、日食、月食、5° 軌道傾角與潮汐週期互動解析

#### 04｜🌦️ 大氣與天氣 <sub>Atmosphere & Weather・6 課</sub>

- [地球的大氣](weather_atmosphere_1.html) ★｜🌍 空氣的重量與氣壓、大氣成分與分層、有無大氣的對照，以及汙染與酸雨實驗互動解析
- [水氣與雲雨](weather_cloud_rain_2.html) ★｜☁️ 相對溼度與露點、上升的空氣如何成雲、三種雲，以及霧露霜與雨雪霰的實驗互動解析
- [氣壓與風](weather_wind_3.html) ★｜🌬️ 氣壓差形成風、風向與風速、等壓線疏密，以及科氏力與 3D 高低氣壓的互動解析
- [氣團與鋒面](weather_airmass_front_4.html) ★｜🌦️ 兩大氣團與冬夏季風、迎風面與背風面、冷鋒暖鋒的剖面，以及滯留鋒與梅雨的互動解析
- [氣象資訊](weather_forecast_5.html) ★｜🌦️ 地面、高空、雷達與衛星觀測，看懂天氣圖當預報員，紫外線指數與警特報的互動解析
- [臺灣常見的災變天氣](weather_disaster_6.html) ★｜🌦️ 寒潮與寒害、梅雨與滯留鋒、颱風的生成與路徑，加上資優特集：颱風眼與螺旋雨帶的互動解析

#### 05｜🌏 全球氣候變遷 <sub>Global Climate Change・2 課</sub>

- [海洋與大氣](climate_ocean_7.html) ★｜🌊 風推動洋流、黑潮與臺灣附近的洋流、波浪與海嘯，以及海洋酸化的互動解析
- [溫室效應與氣候變遷](climate_change_8.html) ★｜🌡️ 看得見的溫室效應、一百多年的暖化紀錄、海平面與物種遷移，以及減緩、調適與淨零排放的互動解析

</details>

<details>
<summary><b>🌱 生物科學館（Biology）｜11 單元・43 課</b></summary>

#### 01｜🌱 生命科學緒論 <sub>Introduction to Life Science・3 課</sub>

- [生命與科學方法](biology_intro.html) ★｜🌱 酵母菌對照實驗、五個生命現象精美圖解、生存條件與互動生物圈
- [顯微鏡與微小世界](biology_microscope.html) ★｜🔬 器材辨認、倍率與調焦、倒像、移動小生物追蹤；全螢幕操作
- [細胞與玻片製作](biology_cells.html) ★｜🔬 真實細胞照片、形狀與功能、玻片製作；40／100／400 倍顯微操作與觸控移片

#### 02｜🔬 組成生物的層次與尺度 <sub>Biological Organization and Scale・3 課</sub>

- [生命的材料與細胞膜](biology_matter_transport.html) ★｜💧 大小分子、細胞膜、擴散與滲透；植物不脹破、質壁分離與紅血球溶血
- [從一個細胞到一個生命](biology_organization.html) ★｜🧬 真實顯微觀察、細胞分工與組織；人體與植物圖像層次、全螢幕觸控講解
- [生命的尺度](biology_scale.html) ★｜🔍 約略尺寸、長度單位與科學記號；真實影像、觀察工具比較及全螢幕觸控

#### 03｜🍚 養分與生命 <sub>Nutrients and Life・4 課</sub>

- [食物中的養分](biology_nutrients.html) ★｜🧪 六大養分、熱量與餐盤；碘液、本氏液實驗台，等量對照與全螢幕觸控
- [酵素與生命的反應](biology_enzymes.html) ★｜🧬 分解與合成、受質吻合、溫度與酸鹼活性；唾液澱粉酶實驗與全螢幕觸控
- [植物的營養方式](biology_photosynthesis.html) ★｜🌿 植物剖面與物質運輸、光合作用、氣孔原圖；遮光葉片澱粉檢驗與全螢幕觸控
- [動物的營養方式](biology_animal_nutrition.html) ★｜🐿️ 消化器官逐站導覽、消化液、蠕動、絨毛吸收與養分利用；全螢幕觸控講解

#### 04｜🌳 生物的運輸與防禦 <sub>Transport and Defence・4 課</sub>

- [植物的運輸構造](biology_plant_structure.html) ★｜🌳 木質部與韌皮部運輸、真實莖切片、年輪與中空樹；全螢幕觸控講解
- [植物體內物質的運輸](biology_plant_transport.html) ★｜💧 根毛吸水、蒸散作用、蔗糖供需與雙向運輸；染液實驗、整株原圖追蹤與全螢幕觸控
- [人體內物質的運輸](biology_human_transport.html) ★｜❤️ 心臟原圖定位與放大、血管及血液；紅血球循環旅程、淋巴回流與脈搏實測
- [人體的防禦作用](biology_immune_defense.html) ★｜🛡️ 皮膚與黏膜、吞噬逐格和發炎；抗原抗體形狀配對、免疫記憶與全螢幕觸控

#### 05｜🧠 協調與感應 <sub>Coordination and Responses・4 課</sub>

- [神經訊息：刺激到反應](biology_nervous_signals.html) ★｜🧬 感覺器官與受器、神經元原圖放大、肌肉與腺體；反應時間與溫度感覺練習
- [腦與反射：訊息怎麼走？](biology_brain_reflex.html) ★｜🧠 腦部原圖局部放大、脊髓與脊椎；縮手反射與意識分路、膝跳與瞳孔
- [內分泌：血液裡的協調訊息](biology_endocrine.html) ★｜🩸 腺體定位與原圖放大、激素運送與作用對象；胰島素、升糖素及生長發育
- [動植物的感應：不只有移動](biology_responses.html) ★｜🌿 動物行為、向光與向地生長、捲鬚與閉葉；照片的光源方向探究

#### 06｜🌡️ 生物的恆定性 <sub>Homeostasis・4 課</sub>

- [恆定與體溫：穩定不是不變](biology_temperature_homeostasis.html) ★｜🌡️ 恆定範圍、器官合作、內溫與外溫；流汗蒸發、血管與發抖調節
- [呼吸與氣體：空氣如何到達細胞？](biology_respiration.html) ★｜🫁 空氣路徑、肺泡交換、橫膈與呼吸運動；細胞呼吸、各類生物及氣體檢驗
- [血糖調節：燃料如何供應？](biology_glucose_homeostasis.html) ★｜🍚 葡萄糖的供應與儲存；胰島素、升糖素、肝臟與腎上腺素的方向比較
- [排泄與水分：留下需要的，排出多餘的](biology_excretion_water.html) ★｜💧 代謝廢物、泌尿器官、過濾與再吸收；體內水分、動植物的保水構造

#### 07｜🌸 生殖與生命延續 <sub>Reproduction and continuity・4 課</sub>

- [細胞分裂：變多，又不亂套](biology_cell_division.html) ★｜🔬 原圖放大、染色體複製與分配；細胞分裂、減數分裂及受精恢復染色體套數
- [無性生殖：不靠種子，也能延續](biology_asexual_reproduction.html) ★｜🌱 分裂、出芽、斷裂、孢子與營養器官繁殖；組織培養、兩週觀察與香蕉遺傳多樣性
- [動物與人類生殖：新生命如何開始？](biology_reproduction_humans.html) ★｜🐣 受精與胚胎發育分類、繁殖行為及蛋的構造；人體原圖、著床與母胎物質交換
- [開花植物生殖：從花到果實與種子](biology_reproduction_flowers.html) ★｜🌸 花的構造、授粉、花粉管與受精；子房與胚珠發育、授粉媒介及花的觀察

#### 08｜🧬 遺傳與生物技術 <sub>Inheritance and biotechnology・4 課</sub>

- [遺傳：消失的表徵去哪了？](biology_mendel_inheritance.html) ★｜從豌豆實驗到配子、基因型與機率；圖解、互動操作與解說
- [人類遺傳：各帶一份，怎麼組合？](biology_human_inheritance.html) ★｜ABO 血型、染色體模型與獨立機率；圖解、互動操作與解說
- [突變：遺傳訊息改了一點之後](biology_mutations.html) ★｜變化的位置、影響與是否傳到下一代；圖解、互動操作與解說
- [生物技術：借用生命的能力](biology_biotechnology.html) ★｜發酵、基因轉殖、複製與育種；圖解、互動操作與解說

#### 09｜🌎 地球上的生物 <sub>Life on Earth・6 課</sub>

- [化石：石頭裡留下了什麼？](biology_fossils_evolution.html) ★｜遺體、活動痕跡與環境的證據；圖解、互動操作與解說
- [命名與分類：替生命找座標](biology_naming_classification.html) ★｜學名、分類層級、五界與檢索；圖解、互動操作與解說
- [原核與原生生物：小世界，大差異](biology_microorganisms.html) ★｜細菌、草履蟲、藍綠菌、矽藻與海帶；圖解、互動操作與解說
- [真菌：看不見的網，怎麼吃飯？](biology_fungi.html) ★｜菌絲、外部消化、發酵與孢子；圖解、互動操作與解說
- [植物：水、種子與果實的線索](biology_plants_diversity.html) ★｜蘚苔、蕨類、種子植物與構造比較；圖解、互動操作與解說
- [動物：長得像，親緣就近嗎？](biology_animals_diversity.html) ★｜身體構造、脊椎與分類證據；圖解、互動操作與解說

#### 10｜🌿 生物圈與生態關係 <sub>Biosphere and ecological relationships・4 課</sub>

- [生命住在多薄的一層？](biology_ecology_environment.html) ★｜個體到生態系、樣方與捉放法、族群收支及演替；圖解、互動操作與解說
- [一片葉子如何養活整個網？](biology_ecology_energy.html) ★｜生產者、消費者、分解者、食物鏈與食物網；能量傳遞及碳循環互動
- [一起生活，一定互相幫忙嗎？](biology_ecology_interactions.html) ★｜掠食、競爭、共生與寄生、生物防治；動畫、圖解與正負影響比較
- [換個環境，誰能住下來？](biology_ecology_habitats.html) ★｜森林、草原、沙漠、凍原、淡水與海洋；3D 棲地及校園調查紀錄

#### 11｜♻️ 人類與環境 <sub>Humans and the environment・3 課</sub>

- [生命的多樣，怎麼看、怎麼比？](biology_environmental_diversity.html) ★｜遺傳、物種與生態系多樣性，與生物的價值
- [生命的家，是怎麼被改變的？](biology_environmental_threats.html) ★｜棲地破碎、過度利用與外來種、汙染、生物放大與氣候變動
- [保育與永續生活](biology_environmental_conservation.html) ★｜魚梯與廊道、物種與棲地保育、生活行動與文化脈絡；原圖比較及觀察紀錄

</details>

## 設計與開發原則

完整且最新的規範以 [`AGENTS.md`](AGENTS.md)（V5 大憲章）為準；目前做到哪、還有什麼沒做，看 [`PROGRESS.md`](PROGRESS.md)。以下是最核心的原則。

**先保護，再優化。** 既有的 Canvas、動畫、計算、座標、實驗裝置與題庫若科學上正確，不為了雙語化或排版而改寫（Zero Touch）；優化一律採「外層加法」：加 UI、加雙語、加 Hook、加排版保護。發現疑似科學錯誤時，先提出討論，不偷偷修正。

**視覺與排版**

- 深色黑板主題：背景 `#11261f`／`#1c3d34`，文字用高對比粉筆色；不使用純黑 `#000`。
- 主內容寬度上限 **1080px**；**iPad Pro 13 吋橫式** 是第一優先裝置，Canvas 等比例縮放。
- 字級以 **22px** 為內文基準，主標題最高 48px；專有名詞、公式、數值加單位可用 `nowrap`，整句英文不可鎖死不換行。
- 公式用 HTML／CSS 的上下分式與 `<sub>`／`<sup>`，不使用 MathJax 或 LaTeX。
- 電學語意色全站統一：電子藍、正電荷橘、電流紅；同一個物理量在所有單元維持同一個顏色。

**雙語**

- 載入時一律顯示繁體中文；英文存放於 `data-en`，JavaScript 產生的文字用 `tr('中文','English')`。
- 右上角固定懸浮語言切換器（`position: fixed; top: 20px; right: 20px`），切換後 Canvas 需重繪。

**教學設計**

- 教學弧線：現象 → 疑問 → 認知衝突 → 模型 → 操作／驗證 → 概念收束。先觀察、再命名、最後公式化。
- 每個主分頁都應有自己的曉臻老師 Hook（88×88px 青色圓框頭像），不五頁共用同一句。
- 單元封面採電影式「無字圖片封面」，答案與教學文字等封面退場後才出現。
- 標題依科學主題命名，不用課本章節編號；學生看得到的內容不寫課本頁碼、圖號，也不加「講義」「課本」出處標示。
- 新製動畫切入即自動播放，只保留最多 5 個步驟按鈕；不放需要學生書寫的觀察紀錄輸入框，確認理解時用選擇題（問題 → 提示 → 解答）。

**生物圖像**：有授權可用的真實照片就用真圖，避免卡通化；AI 插圖明確標示為教學示意、非實拍。每張圖逐張核對並保留作者、來源與授權。

**交付前檢查**：每張應該會動的畫布都要實測確實在動、所有被呼叫的函式都要存在、中英文各檢查一次排版。檢查工具在 [`tools/qa/`](tools/qa/)。

## 倉庫結構

```text
index.html                 伽利略星球（首頁）
index_classic.html         課程清單（課程卡片的資料來源）
index_museum.html          舊網址，自動轉到 index.html
<主題>_<編號>.html         139 個課程頁（物理、化學、地科、生物）
assets/                    圖片、封面、角色（曉臻、March、April）、生物素材、伽利略星球資料與音訊
galileo-planet/            伽利略星球的計畫（PLAN.md）與交接（HANDOFF.md）
tools/museum/              課程資料與縮圖、旁白接檔腳本（build_lessons.py 等）
tools/qa/                  教材檢查工具（頁面、文字、煙霧測試）
tools/voice/               曉臻旁白錄音工具
tools/promo/、promo/       宣傳短片的製作腳本與成品
.github/workflows/         曉臻自動錄音（GitHub Actions）
local-backups/             原始圖片備份（依日期）
AGENTS.md                  協作規範（V5 大憲章）
PROGRESS.md                工作進度
```

另有少數預覽頁與輔助頁（如 `*_preview1.html`、`skyball.html`、`sun_trajectory_*.html`、`mirrior_1.html`）不計入 139 課。

## 新增或修改課程

1. 課程卡片只改 **`index_classic.html`**，不要在 `index.html` 加卡片。
2. 執行 `python3 tools/museum/build_lessons.py` 重新產生 `assets/museum/data/lessons.json`，星球上才會出現；加 `--check` 可只比對現有檔案是否過期。
3. 用 `tools/qa/` 的工具跑檢查（說明見 [`tools/qa/README.md`](tools/qa/README.md)）。
4. 更新 [`PROGRESS.md`](PROGRESS.md)。

旁白錄音：把台詞推到 GitHub，由 Actions 用微軟「曉臻」語音自動錄製並接檔；流程見 `AGENTS.md` 第十四律。

## 圖像來源與授權

網路上找得到的圖不等於能自由使用。每張第三方圖像都逐張記錄作者、來源、授權與處理方式，並在頁面保留署名；原創 AI 圖保留提示詞與生成紀錄。紀錄放在各素材資料夾內（例如 `assets/biology/*/sources.md`）與 [`assets/textbook_image_permissions.md`](assets/textbook_image_permissions.md)。圖像授權獨立於程式碼，兩者不混為一談。

---

**設計與課程企劃：** 呂彥君老師  
**聯絡信箱：** flyer19820218@gmail.com  
**系統特點：** 純淨前端架構（HTML5、CSS3、Canvas、Vanilla JS），免外掛、免伺服器後端，下載即可於大螢幕、iPad 或一般瀏覽器執行。  
**關鍵字：** STEM 教育、國中自然、互動科學、探究式學習、生物科學、物理模擬、化學模擬、地球科學、天文、雙語教育、科學視覺化、開放教育資源。
