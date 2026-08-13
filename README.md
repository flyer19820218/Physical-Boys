# 自然科學與數理互動教學

## 專案簡介

這是一套面向國中自然科學課堂的 **開源 HTML5 雙語互動教材庫**。它不把學生留在被動觀看動畫的位置，而是讓學生親手拖曳、旋轉、改變變因、觀察回饋，再用物理、化學與地球科學語言解釋結果。

教材以 **STEM 教育（Science, Technology, Engineering, Mathematics）**、**探究式學習（Inquiry-Based Learning）**、**科學視覺化（Scientific Visualization）** 與 **互動模擬（Interactive Simulation）** 為核心，涵蓋物理、化學、地球科學、天文與數學連結。網站採純前端架構，免安裝、免後端，可直接於教室大螢幕、iPad 與一般瀏覽器使用。

## 系統五層架構
為確保國中三年龐大的教材內容能夠有條理地擴充，全站嚴格遵守以下五層架構：

1. **大館 (Pavilion)：** 依學科分類（物理與力學、化學與反應、地科與天文）。
2. **章節 (Chapter)：** 總計規劃約 30 個核心章節（如：化學反應與平衡、氧化還原反應）。
3. **單元 (Unit)：** 每個章節下轄 4~6 個單元，逐步深化觀念。
4. **分頁 (Tab)：** 每個單元內含 4~5 個頁籤，切割學習知識點。
5. **子分頁 (Sub-tab)：** 針對計算題與實驗題，提供「問題 ➔ 提示 ➔ 解答」的三部曲互動演練。

## 視覺與排版核心規範
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
* **10｜🧭 電與磁** （4 個小單元）
  * [磁力與磁場](magnetism_1.html)｜磁極互動、磁疇、磁力線、指南針與地球磁場互動解析
  * [電生磁與電磁鐵](electromagnetism_2.html)｜奧斯特實驗、右手定則、線圈磁場疊加、電磁鐵起重機與電話聽筒動畫
  * [磁力與電動機](electric_motor_3.html)｜右手開掌定則、平行電流交互作用、帶電粒子運動、分裂環換向與直流電動機動畫
  * [電磁感應與交流電](electromagnetic_induction_4.html)｜法拉第與冷次定律、發電機、變壓器、感應加熱與高中資優計算

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
**系統特點：** 純淨前端架構（HTML5、CSS3、Canvas、Vanilla JS），免外掛、免伺服器後端，下載即可於大螢幕、iPad 或一般瀏覽器執行。  
**關鍵字：** STEM 教育、國中自然、互動科學、探究式學習、物理模擬、化學模擬、地球科學、天文、雙語教育、科學視覺化、開放教育資源。

---

# Liming Bilingual Interactive STEM Learning Hub

## Project Overview

This is an **open-source, bilingual HTML5 interactive curriculum** designed for middle-school science classrooms. Students do more than watch animations: they drag, rotate, change variables, observe feedback, and explain the results using scientific reasoning.

The project centers on **STEM education**, **inquiry-based learning**, **scientific visualization**, and **interactive simulation**. It connects physics, chemistry, Earth science, astronomy, mathematics, technology, and engineering thinking. Because every lesson is built with client-side HTML5, CSS3, Canvas, and vanilla JavaScript, the materials run directly in modern browsers on classroom displays, iPads, and student devices—without plugins or a backend server.

## Five-Level Curriculum Architecture

1. **Pavilion:** Physics & Mechanics, Chemistry, and Earth & Space Science.
2. **Chapter:** Approximately 30 core chapters organize the full curriculum.
3. **Unit:** Each chapter contains 4–6 concept-building units.
4. **Tab:** Each unit uses 4–5 focused learning tabs.
5. **Sub-tab:** Calculations and experiments follow a Question → Hint → Answer progression.

## Design and Accessibility Principles

* **Dark chalkboard, high contrast:** A deep green background reduces glare while bright chalk colors map explanations to diagrams.
* **Responsive, touch-friendly layout:** Optimized for classroom projection, iPad landscape mode, and smaller screens.
* **Readable scientific typography:** Large body text, no-wrap scientific terms, and JetBrains Mono for variables and formulas.
* **True mathematical fractions:** CSS-rendered vertical fractions replace slash notation.
* **Teacher-ready language:** Concise explanations, interactive demonstrations, and immediate practice feedback.

## Curriculum Directory

> The live catalog in `index.html` is the source of truth.

### Physics & Mechanics Pavilion
* **01｜⚖️ Density & Measurement** (3 lessons)
  * [Laboratory Safety & Length Measurement](density_1.html) — Seven lab-tool safeguards, visual-error checks, ruler precision, and reliable averaging ★
  * [Measuring Mass & Volume](density_2.html) — Mass vs. weight, balance practice, three displacement methods, and graduated-cylinder parallax checks ★
  * [Density: Meaning & Calculations](density_3.html) — Cutting-material investigations, density language, an interactive calculator, and mass-volume graph analysis ★
* **02｜🌊 Waves & Sound** (4 lessons)
  * [Wave Propagation & Mechanical Waves](waves_1.html) — Interactive models of transverse waves, longitudinal waves, and particle motion
  * [Sound Propagation & Speed](waves_2.html) — Media, temperature effects, and sound-speed calculations
  * [Echoes & the Two-Cliff Problem](waves_3.html) — Echo conditions, diffuse reflection, and a classic distance challenge
  * [Pitch, Loudness, Timbre & Resonance](waves_4.html) — Interactive sound variables, glass experiments, and resonance
* **03｜💡 Optics & Lenses** (6 lessons)
  * [Rectilinear Light & Pinhole Imaging](optics_1.html) — Dynamic pinhole-camera simulation and straight-line light propagation
  * [Plane Mirrors & Reflection](optics_2.html) — Virtual-image location, curved-mirror fields of view, and laser reflection ★
  * [Refraction & Total Internal Reflection](optics_3.html) — Refraction patterns, apparent depth, and mirage simulations
  * [Lenses & Vision Correction](optics_4.html) — Converging and diverging lenses, image formation, myopia, and hyperopia
  * [Light & Color](optics_5.html) — Additive primary colors, object color, and optical filters
  * [Advanced Optics: Multiple Reflections](optics_max1.html) — Two-mirror angle investigations and virtual-image counting
* **04｜🔥 Thermal Physics** (5 lessons)
  * [Temperature & Thermometers](thermo_1.html) — Thermometer principles, Celsius-Fahrenheit conversion, and calibration problems
  * [Heat & Thermal Equilibrium](thermo_2.html) — Heat-flow direction, the calorie, and ideal equilibrium calculations
  * [Specific Heat & Graph Slopes](thermo_3.html) — Mass-specific-heat relationships, graph slopes, and heat-loss extensions
  * [Conduction, Convection & Radiation](thermo_4.html) — Interactive heat-transfer models and real-life applications
  * [Thermal Effects on Matter](thermo_5.html) — Ice structure, the 4°C water anomaly, dehydration, and heating curves ★
* **05｜🧲 Forces, Pressure & Fluids** (5 lessons)
  * [Forces & Springs](mechanics_1.html) — Mass vs. weight, contact and non-contact forces, Hooke’s law, and spring networks ★
  * [Force Composition, Resolution & Balance](mechanics_2.html) — Vector tug-of-war, equilibrium tables, parallelogram vectors, and inclined planes ★
  * [Friction Everywhere](mechanics_3.html) — Microscopic contact, maximum static friction, velocity-time analysis, and controlled variables ★
  * [Pressure & Fluid Pressure](mechanics_4.html) — Solid pressure, depth effects, communicating vessels, and Pascal’s principle ★
  * [Atmospheric Pressure & Buoyancy](mechanics_5.html) — Magdeburg hemispheres, Torricelli’s barometer, Archimedes’ principle, and floating ★
* **06｜📐 Linear Kinematics** (5 lessons)
  * [Position, Path Length & Displacement](kinematics.html) — Number lines, tracks, clock hands, geometric reasoning, and quick practice
  * [Average Speed, Velocity & v–t Graphs](kinematics_2.html) — Two-car comparisons, displacement from area, and turnaround motion
  * [Uniform & Accelerated Motion](kinematics_3.html) — Dynamic chalkboard models of constant velocity and acceleration
  * [Constant Acceleration I](kinematics_4.html) — Full-scale ticker timers and Galileo’s inclined-plane reasoning
  * [Constant Acceleration II & Free Fall](kinematics_5.html) — Four motion equations and a precise model of free fall
* **07｜🍎 Newtonian Mechanics** (5 lessons)
  * [Newton’s First Law & Inertia](newton_1.html) — Galileo’s thought experiment, constant motion, and inertia on accelerating vehicles ★
  * [Newton’s Second Law & F = ma](newton_2.html) — Force-acceleration relationships, weight in newtons, and measuring mass in space ★
  * [Newton’s Third Law & Apparent Weight](newton_3.html) — Free-body diagrams, action-reaction pairs, sailboat myths, and elevator motion ★
  * [Circular Motion & Gravitation](newton_4.html) — Centripetal force, tangential motion, banked roads, and inverse-square gravity ★
  * [Torque & Static Equilibrium](newton_5.html) — Pivots, lever arms, rotational effects, and equilibrium conditions ★
* **08｜⚡ Work & Energy** (4 lessons)
  * [Work & Power](work_1.html) — Positive and negative work, force-displacement angles, and power calculations ★
  * [Kinetic & Gravitational Potential Energy](work_2.html) — Energy transformations and mass-speed-squared relationships ★
  * [Conservation of Mechanical Energy](work_3.html) — Pendulum energy, free fall, and Joule’s mechanical equivalent of heat ★
  * [Simple Machines & Efficiency](work_4.html) — The work principle, nail-puller practice, wheel-and-axle systems, and inclined planes ★
* **09｜💡 Electricity & Circuits** (4 lessons)
  * [Electrostatics & Basic Circuits](electronics_1.html) — Charging by friction, electrostatic induction, and circuit-component observation ★
  * [Voltage & Three Circuit States](electronics_2.html) — Water-flow analogy, open and closed circuits, and dangerous short circuits ★
  * [Series/Parallel Circuits & Current](electronics_3.html) — Electric current, ammeter rules, and classic exam problems ★
  * [Resistance & Ohm’s Law](electronics_4.html) — Microscopic collisions, V–I graphs, and unknown-resistance measurement ★
* **10｜🧭 Electricity & Magnetism** (4 lessons)
  * [Magnetic Forces & Fields](magnetism_1.html) — Poles, domains, field lines, compasses, and Earth’s magnetic field ★
  * [Current-Generated Magnetism & Electromagnets](electromagnetism_2.html) — Oersted’s experiment, right-hand rules, field superposition, cranes, and telephone receivers ★
  * [Magnetic Force & Electric Motors](electric_motor_3.html) — Right-hand palm rule, parallel-current forces, charged particles, split-ring commutation, and interactive DC motors ★
  * [Electromagnetic Induction & AC](electromagnetic_induction_4.html) — Faraday and Lenz laws, generators, transformers, induction heating, and high-school extension calculations ★
### Chemistry Pavilion
* **01｜🧪 Air & Solutions** (4 lessons)
  * [Properties & Separation of Matter](concerntration_1.html) — Physical and chemical changes, pure substances, mixtures, filtration, and crystallization ★
  * [Three Ways to Express Concentration](concerntration_2.html) — Solutions, saturation, mass percent, volume percent, and ppm calculators ★
  * [Solubility & Saturation](concerntration_3.html) — Solubility curves, dissolved amount, and cooling crystallization challenges ★
  * [Air & Gas Preparation](concerntration_4.html) — Air composition, oxygen preparation, water displacement, and carbon-dioxide tests ★
* **02｜⚛️ Atoms & the Periodic Table** (4 lessons)
  * [Pure Substances & Elements](atomics_1.html) — Classifying matter, Lavoisier’s water electrolysis, and metals vs. nonmetals ★
  * [Atomic Models & the Periodic Table](atomics_2.html) — The history of atomic models, periodic patterns, and major element families ★
  * [Subatomic Particles & Isotopes](atomics_3.html) — Protons, neutrons, electrons, ion calculations, and allotropes ★
  * [Structures of Matter & Chemical Formulas](atomics_4.html) — Conductivity models, ion notation, 3D ethanol structure, and problem solving ★
* **03｜⚖️ Chemical Reactions & Equations** (3 lessons)
  * [Chemical Reactions & Conservation of Mass](chem_reaction_1.html) — Reaction evidence, fireworks, microscopic combustion, and closed-system precipitation ★
  * [Chemical Equations & Balancing](chem_reaction_2.html) — Writing rules, inspection, algebraic methods, and redox extensions ★
  * [Atomic Mass, Molecular Mass & the Mole](chem_reaction_3.html) — Carbon-12, molecular mass, Avogadro’s number, and molar-mass conversions ★
* **04｜🔥 Oxidation & Reduction** (3 lessons)
  * [Oxidation, Reduction & Reactivity](redox_1.html) — Virtual combustion, metal activity, and oxide acid-base patterns ★
  * [Redox Competition & Electron Transfer](redox_2.html) — Copper-oxide reduction, oxidizing/reducing agents, and advanced challenges ★
  * [Metal Smelting & Corrosion Protection](redox_3.html) — Blast-furnace chemistry, iron and steel, and everyday redox protection ★
* **05｜⚗️ Electrolytes, Acids, Bases & Salts** (4 lessons)
  * [Electrolytes & Ionic Dissociation](electrolyte_1.html) — Conductivity, closed circuits, 2:1 water electrolysis, and microscopic ion motion ★
  * [Common Acids, Bases & Concentrated-Acid Safety](electrolyte_2.html) — Strong and weak acids, sugar dehydration, and safe dilution ★
  * [Molarity, Dilution & pH](electrolyte_3.html) — Standard solutions, dilution and mixing, and extreme-pH challenges ★
  * [Neutralization, Titration & Salts](electrolyte_4.html) — Automated titration, common salts, and acid-base stoichiometry ★
* **06｜⚡ Reaction Rates & Equilibrium** (3 lessons)
  * [Reaction Rates & Collision Theory](chem_reaction_balance_1.html) — Effective collisions, four rate factors, and a classic thiosulfate experiment ★
  * [Activation Energy & Catalysts](chem_reaction_balance_2.html) — Reaction thresholds, catalyst properties, and real-world applications ★
  * [Reversible Reactions & Dynamic Equilibrium](chem_reaction_balance_3.html) — Microscopic dynamics, concentration/temperature/pressure changes, caves, and blood buffers ★
* **07｜🧬 Organic & Everyday Chemistry** (4 lessons)
  * [Organic Chemistry & Wood Distillation](organics_1.html) — Definitions and exceptions, dry-distillation products, and 3D isomers ★
  * [Hydrocarbons, Alcohols, Acids & Esters](organics_2.html) — Fractional distillation, acid-alcohol comparison, and fruity ester formation ★
  * [Polymers & Textile Fibers](organics_3.html) — Monomer-polymer animation, thermoplastics vs. thermosets, and fiber testing ★
  * [Food Chemistry & Detergents](organics_4.html) — Protein denaturation, soap making, and micelle cleaning ★
* **08｜🔋 Electrochemistry & Batteries** (5 lessons)
  * [Electrical Energy & Power](electric_energy_power_1.html) — Three effects of electricity, deriving E = IVt, circuit energy, power, and appliance ratings ★
  * [Power Transmission & Electricity Cost](electric_power_transmission_2.html) — AC/DC, high-voltage transmission, line loss, kilowatt-hours, 110/220 V wiring, and grounding ★
  * [Short Circuits & Electrical Safety](electrical_safety_3.html) — Overload, heating wires, fuses, breakers, electric shock, and extension-cord current ratings ★
  * [Galvanic Cells](galvanic_batteries_4.html) — Galvani and Volta, redox, zinc-copper cells, salt bridges, and common batteries ★
  * [Electrolysis & Electroplating](electrolysis_5.html) — Electrodes, water electrolysis, copper-sulfate electrolysis, and industrial electroplating ★
### Earth & Space Science Pavilion
* **01｜🌍 Water & Land** (4 lessons)
  * [Earth’s Water & Groundwater](earth_water_1.html) — Earth systems, water distribution, salinity, glaciers, water tables, and overpumping ★
  * [Changing Landforms & External Processes](earth_landforms_2.html) — Internal/external forces, weathering, rivers, glaciers, wind, and waves ★
  * [Coastlines & Dynamic Equilibrium](earth_coastline_3.html) — Sediment budgets, transgression/regression, dams, and breakwater impacts ★
  * [Rock Families & the Rock Cycle](earth_rocks_4.html) — Mineral identification, igneous cooling, sedimentation, metamorphism, and the rock cycle ★
* **02｜🌋 Plate Tectonics & Earth History** (4 lessons)
  * [Earth’s Interior & Plate Dynamics](earth_interior_1.html) — Crust, mantle, core, lithosphere, asthenosphere, convection, and plate motion ★
  * [Plate Boundaries & Surface Change](earth_plates_2.html) — Global plates, seafloor spreading, subduction, mountain building, earthquakes, and volcanoes ★
  * [Rock-Layer Records & Earth History](earth_strata_3.html) — Folds, faults, geologic-event sequencing, and index-fossil dating ★
  * [Taiwan’s Plate Tectonics & Earthquakes](earth_taiwan_quake_4.html) — Orogeny, focus and epicenter, magnitude and intensity, hazard zones, and preparedness ★
* **03｜🌌 Space & Astronomy** (4 lessons)
  * [Cosmic Scale & the Solar System](astronomy_universe_1.html) — Zoom from the universe and Milky Way to the Solar System, Earth, and Moon ★
  * [Earth’s Rotation, Revolution & Seasons](astronomy_earth_motion_2.html) — Day and night, time, apparent solar motion, revolution, and the seasons ★
  * [Solar Paths & the Celestial Sphere](astronomy_sunpath_3.html) — Daily solar motion, seasonal daylight paths, and celestial-sphere directions ★
  * [Moon Phases, Eclipses & Tides](astronomy_moon_phases_4.html) — Lunar phases and observing times, eclipses, the 5° orbital tilt, and tidal cycles ★

---

**Curriculum designer:** Yan-Jun Lu  
**Contact:** flyer19820218@gmail.com  
**Technology:** HTML5, CSS3, Canvas, and vanilla JavaScript—no plugins or backend required.  
**Keywords:** STEM education, interactive science, inquiry-based learning, physics simulations, chemistry simulations, Earth science, astronomy, bilingual education, middle-school science, scientific visualization, open educational resources (OER).
