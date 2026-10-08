/* Biology 4-3 · 2026-10-08 · first teacher-review draft.
 * Original textbook artwork is supplied by the chapter framework.
 * Newly authored cells/molecules are explanatory models, not recorded footage.
 * The framework owns layout, language, fullscreen, gestures and the only RAF.
 */
(function (root) {
  'use strict';

  const C = Object.freeze({
    bg: '#11261f', panel: '#1c3d34', ink: '#f2ecd9', muted: '#b9cbbd',
    rich: '#ef3e46', poor: '#76232f', yellow: '#fde047', green: '#4ade80',
    plasma: '#e9ce85', wall: '#d89081', tissue: '#dab080', oxygen: '#ff6a59',
    carbon: '#576360', lymph: '#82cf75', nucleus: '#b289ce'
  });
  const P = (zh, en) => [zh, en];
  const RESEARCH = [
    { title: 'NIH / NHLBI: How blood flows through the heart', url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow' },
    { title: 'NIH / NHLBI: How the heart beats', url: 'https://www.nhlbi.nih.gov/health/heart/heart-beats' },
    { title: 'NIH / NHLBI: Lung gas exchange', url: 'https://www.nhlbi.nih.gov/health/lungs/breathing-benefits' },
    { title: 'OpenStax: Components of the blood', url: 'https://openstax.org/books/biology-2e/pages/40-2-components-of-the-blood' },
    { title: 'OpenStax: Blood flow, pressure and resistance', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-2-blood-flow-blood-pressure-and-resistance' },
    { title: 'OpenStax: Capillary exchange', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-3-capillary-exchange' }
  ];

  const CHAMBERS = [
    { id: 'ra', name: P('右心房', 'Right atrium'),
      text: P('接收上、下大靜脈帶回的較少氧血液，再送進右心室。圖上位於觀眾左側，卻是這個人的右側。', 'Receives oxygen-poor blood through the superior and inferior venae cavae and passes it to the right ventricle. It is on the viewer’s left, but the person’s right.') },
    { id: 'rv', name: P('右心室', 'Right ventricle'),
      text: P('收縮時把較少氧的血液送入肺動脈，到肺部進行氣體交換。它不直接把血送到全身。', 'Contracts to send oxygen-poor blood into the pulmonary artery for gas exchange in the lungs. It does not pump directly to the whole body.') },
    { id: 'la', name: P('左心房', 'Left atrium'),
      text: P('接收肺靜脈帶回的富氧血，再送進左心室。解剖上的左側，在這張前視圖的觀眾右側。', 'Receives oxygen-rich blood returning through the pulmonary veins and passes it to the left ventricle. Anatomical left is on the viewer’s right in this frontal view.') },
    { id: 'lv', name: P('左心室', 'Left ventricle'),
      text: P('收縮時把富氧血送入主動脈，供應全身組織。它的肌肉壁比右心室厚，能產生體循環需要的較高壓力。', 'Contracts to send oxygen-rich blood into the aorta for body tissues. Its thicker muscle wall generates the higher pressure required for systemic circulation.') },
    { id: 'av', name: P('房室瓣', 'Atrioventricular valves'),
      text: P('位於心房與心室之間。心室收縮時關閉，防止血液倒流回心房；左右各一個。進階名稱：右側三尖瓣，左側二尖瓣。', 'Lie between atria and ventricles. They close during ventricular contraction to prevent backflow into the atria, one on each side. Extension: right tricuspid and left mitral valve.') },
    { id: 'sl', name: P('半月瓣', 'Semilunar valves'),
      text: P('位於心室與大動脈之間。心室射血時開啟，心室轉為舒張時關閉，防止動脈的血倒流；肺動脈口與主動脈口各一個。', 'Lie between ventricles and the large arteries. They open during ejection and close as ventricles relax, preventing arterial backflow; one at the pulmonary outlet and one at the aortic outlet.') },
    { id: 'septum', name: P('心臟中隔', 'Cardiac septum'),
      text: P('把左右心分開。正常心臟的血液不能穿過中隔，左右兩側分別推動肺循環與體循環，仍連成同一套運輸系統。', 'Separates the right and left heart. In a normal heart, blood does not cross the septum. The two sides drive pulmonary and systemic circuits that form one connected transport system.') }
  ];
  const PHASES = [
    { name: P('舒張：充血', 'Relaxation: filling'), av: true, sl: false,
      text: P('心室舒張、壓力降低；房室瓣開啟，血液從心房流進心室。半月瓣關閉，動脈的血不會倒灌。', 'Ventricles relax and pressure falls. AV valves open so blood enters from the atria. Semilunar valves remain closed, preventing arterial backflow.') },
    { name: P('心房收縮', 'Atrial contraction'), av: true, sl: false,
      text: P('左右心房一起收縮，把最後一部分血液推進心室；房室瓣開、半月瓣關。心房先收縮，心室再收縮。', 'Both atria contract together to complete ventricular filling. AV valves are open and semilunar valves closed. Atrial contraction precedes ventricular contraction.') },
    { name: P('心室射血', 'Ventricular ejection'), av: false, sl: true,
      text: P('左右心室一起收縮。房室瓣關閉；當心室壓力高於動脈時，半月瓣打開。右心室送往肺，左心室送往全身。', 'Both ventricles contract together. AV valves close; semilunar valves open when ventricular pressure exceeds arterial pressure. The right ventricle supplies the lungs and the left supplies the body.') },
    { name: P('轉為舒張', 'Early relaxation'), av: false, sl: false,
      text: P('心室開始舒張，半月瓣關閉。這個短暫轉換期四個瓣膜都關；心室壓力再降低，房室瓣才打開，接回下一輪充血。', 'Ventricles begin to relax and semilunar valves close. All four valves are briefly closed; AV valves open only after ventricular pressure falls further, starting the next filling phase.') }
  ];
  const COMPONENTS = [
    { id: 'plasma', name: P('血漿', 'Plasma'),
      text: P('血液的液體部分，主要是水，含養分、鹽類、激素、蛋白質與代謝廢物。約占血液體積 55%，不是只有紅血球才負責運輸。', 'The liquid part of blood, mainly water, carrying nutrients, salts, hormones, proteins and metabolic wastes. It makes up about 55% of blood volume; transport is not performed by red cells alone.') },
    { id: 'rbc', name: P('紅血球', 'Red blood cells'),
      text: P('成熟的人類紅血球沒有細胞核，呈雙凹圓盤狀，數量最多。含血紅素，主要攜帶氧氣；正常交換時它留在微血管內，小分子才跨過管壁。', 'Mature human red cells have no nucleus and are biconcave discs, the most numerous formed elements. Hemoglobin carries oxygen. During normal exchange they stay inside capillaries; small molecules cross the wall.') },
    { id: 'wbc', name: P('白血球', 'White blood cells'),
      text: P('有細胞核，種類多，通常比紅血球大、數量較少。不同種類能吞噬病原體或參與抗體與免疫記憶；發炎時有些可穿出血管，不能把此特性套到正常紅血球。', 'Have nuclei and several types; generally larger and less numerous than red cells. Different types engulf pathogens or support antibodies and immune memory. Some leave vessels during inflammation; normal red cells do not.') },
    { id: 'platelet', name: P('血小板', 'Platelets'),
      text: P('小而不規則，沒有細胞核；實際是細胞碎片。血管受傷時聚集，並配合血漿中的凝血因子幫助止血，不是單靠一片血小板把傷口黏好。', 'Small, irregular cell fragments without nuclei. They gather at injured vessels and work with plasma clotting factors to limit bleeding, rather than sealing a wound with a single platelet.') }
  ];
  const STATIONS = [
    { id: 'lv', name: P('左心室', 'Left ventricle'), oxygen: 1, text: P('本次旅行的起點：富氧血由左心室推出。', 'Starting point: the left ventricle pumps oxygen-rich blood.') },
    { id: 'aorta', name: P('主動脈／小動脈', 'Aorta / arterioles'), oxygen: 1, text: P('離開心臟，分支把血送到身體組織。', 'Blood leaves the heart and branches toward body tissues.') },
    { id: 'body', name: P('組織微血管', 'Body capillaries'), oxygen: 0.5, text: P('氧氣擴散到組織；細胞產生的二氧化碳進入血液，紅血球留在血管內。', 'Oxygen diffuses to tissues; carbon dioxide from cells enters blood. Red cells remain in the vessel.') },
    { id: 'cava', name: P('小靜脈／大靜脈', 'Venules / venae cavae'), oxygen: 0, text: P('匯流後把較少氧的血液送回右心房。', 'Vessels merge to return oxygen-poor blood to the right atrium.') },
    { id: 'ra', name: P('右心房', 'Right atrium'), oxygen: 0, text: P('體循環的終點：收下全身回流的血液。', 'End of the systemic circuit: receives returning blood from the body.') },
    { id: 'rv', name: P('右心室', 'Right ventricle'), oxygen: 0, text: P('接續肺循環：收縮把血液送往肺部。', 'Begins the pulmonary circuit by pumping blood toward the lungs.') },
    { id: 'pa', name: P('肺動脈', 'Pulmonary artery'), oxygen: 0, text: P('是動脈，因為離開心臟；但其中的血液含氧較少。', 'An artery because it leaves the heart, although its blood is oxygen-poor.') },
    { id: 'lung', name: P('肺部微血管', 'Lung capillaries'), oxygen: 0.5, text: P('氧氣由肺泡進血液，二氧化碳由血液進肺泡，隨呼氣排出。', 'Oxygen moves from alveoli into blood; carbon dioxide enters alveoli to be exhaled.') },
    { id: 'pv', name: P('肺靜脈', 'Pulmonary vein'), oxygen: 1, text: P('是靜脈，因為回到心臟；其中的血液已變成富氧血。', 'A vein because it returns to the heart, carrying oxygen-rich blood.') },
    { id: 'la', name: P('左心房', 'Left atrium'), oxygen: 1, text: P('肺循環的終點：血液從肺回來，接著流入左心室。', 'End of the pulmonary circuit: blood returns from lungs, then enters the left ventricle.') }
  ];

  const CONTENT = [
    {
      id: 'heart', main: P('不是實心球', 'Four chambers'), sub: P('心臟與瓣膜', 'Heart and valves'),
      heading: P('心臟不是一顆實心球', 'The heart is not a solid ball'),
      hook: P('如果心臟只是一顆空球，血液為什麼不會亂流？點選四個腔室，再慢慢看瓣膜什麼時候開。', 'If the heart were one hollow ball, what would keep blood from flowing the wrong way? Select its chambers, then watch when each valve opens.'),
      lead: P('心臟、血管和血液組成心血管系統；淋巴系統協助回收液體。先用課本原圖找出心臟，再把四個腔室和單向瓣膜接起來。', 'The heart, vessels and blood form the cardiovascular system; the lymphatic system helps recover fluid. Locate the heart in the original textbook image, then connect its chambers and one-way valves.'),
      paragraphs: [
        P('心臟位於胸腔中央偏左，由心肌構成。上方是左右心房，下方是左右心室；這裡的左右是圖中人的左右，不是看圖人的左右。', 'The heart lies centrally in the chest, extending to the left, and is made of cardiac muscle. Atria are above and ventricles below. Left and right belong to the person in the figure, not the viewer.'),
        P('心房接收靜脈回流，心室把血推出到動脈。左右心有中隔分開，正常血液不直接穿過中隔混在一起。', 'Atria receive venous return; ventricles eject blood into arteries. The septum separates the two sides, preventing direct mixing across it in a normal heart.'),
        P('四個瓣膜受兩側壓力差影響而開閉，並非自己像幫浦般主動推血。房室瓣防止回流到心房；半月瓣防止動脈血倒流回心室。', 'Pressure differences open and close the four valves; they are not pumps. AV valves prevent backflow to atria; semilunar valves prevent arterial blood from returning to ventricles.'),
        P('左右心房先一起收縮，左右心室再一起收縮。體循環與肺循環在活體中同時持續進行；分段播放只是把同一個心搏拆慢，方便觀察。', 'Both atria contract first, followed by both ventricles. Systemic and pulmonary circulation operate continuously together; step mode slows one heartbeat to make its phases visible.'),
        P('課本補充（第 120–121 頁）：人工心肺機把「推動血液」與「肺部氣體交換」分給幫浦和氧合器，血液仍須回到身體。葉克膜也利用體外氣體交換提供支持；這裡只討論運輸原理，不提供醫療操作。想一想：哪個元件代替推血，哪個元件讓氧進入、二氧化碳離開？', 'Textbook extension (pp. 120–121): a heart–lung machine separates pumping from lung gas exchange, using a pump and an oxygenator before returning blood to the body. ECMO also provides extracorporeal gas-exchange support. This is a transport principle, not a medical procedure. Which component pumps, and which adds oxygen and removes carbon dioxide?')
      ],
      question: P('左心室和右心室都在推血，為什麼左心室的肌肉壁比較厚？先比較它們各自要把血送到哪裡。', 'Both ventricles pump blood. Why is the left ventricular wall thicker? Compare the destinations they supply.'),
      closure: P('心房收血、心室送血；瓣膜配合壓力開閉，讓血依序向前。', 'Atria receive, ventricles eject; pressure-operated valves keep blood moving forward.')
    },
    {
      id: 'vessels', main: P('三種管，三種任務', 'Three vessel jobs'), sub: P('動脈・微血管・靜脈', 'Arteries, capillaries, veins'),
      heading: P('三種血管，各有任務', 'Three kinds of vessel, three different jobs'),
      hook: P('動脈一定裝滿氧氣嗎？先看它從哪裡出發，再用真實切片比一比管壁與管腔。', 'Must an artery be full of oxygen? First check where it flows from, then compare walls and lumens in real tissue sections.'),
      lead: P('血管的分類先看血液與心臟的流向。動脈把血帶離心臟，靜脈把血帶回心臟；微血管接在兩者之間，負責交換。', 'Classify vessels by their flow relative to the heart. Arteries carry blood away, veins return it, and capillaries connect them and allow exchange.'),
      paragraphs: [
        P('動脈的管壁較厚、富彈性，能承受心室推出血液的壓力。離開大動脈後不斷分支，成為小動脈，最後接上微血管網。', 'Arteries have relatively thick, elastic walls that withstand ventricular ejection pressure. Large arteries branch into smaller arteries and arterioles that feed capillary networks.'),
        P('微血管的管壁主要只有一層細胞厚，管腔很窄，讓血液靠近組織細胞。一般組織中的氣體和小分子可交換，正常紅血球不跟著跑出去。', 'Capillary walls are essentially one cell thick and their narrow lumens bring blood close to tissue cells. Gases and small molecules exchange; normal red cells do not leave with them.'),
        P('微血管中的平均流速較慢，增加交換的時間。理由不是「單根管子越細就越慢」，而是大量微血管並聯，總截面積很大。這裡只比較趨勢，不當作人體實測速度。', 'Average flow is slower in capillary beds, allowing exchange. This is not a rule that one narrower tube always slows flow: many parallel capillaries have a large total cross-sectional area. The model compares trends, not measured human speeds.'),
        P('靜脈的管壁較薄、相對管腔較大，血壓較低。有些靜脈有瓣膜；周圍骨骼肌收縮可幫助回流，瓣膜防止血液倒退。並非每條靜脈都有瓣膜。', 'Veins have thinner walls, relatively larger lumens and lower pressure. Some have valves; surrounding skeletal muscles assist return, while valves prevent backflow. Not every vein has valves.'),
        P('肺動脈中的血含氧較少，肺靜脈中的血含氧較多。動／靜脈的名稱說流向，不直接表示含氧量，也不表示血液有藍色。', 'Pulmonary arteries carry oxygen-poor blood and pulmonary veins carry oxygen-rich blood. Vessel names describe direction, not oxygen content; blood is not blue.')
      ],
      question: P('只看血管裡的紅色深淺，能判斷動脈或靜脈嗎？還需要哪一項資訊？', 'Can red colour alone distinguish an artery from a vein? What additional information is needed?'),
      closure: P('分類看離心或回心；構造看管壁、管腔、瓣膜；交換發生在微血管。', 'Classify by flow away from or toward the heart; compare wall, lumen and valves; exchange occurs at capillaries.')
    },
    {
      id: 'blood', main: P('誰送氧？誰修補？', 'Carry, defend, repair'), sub: P('血液的四個成分', 'Four blood components'),
      heading: P('血液裡，誰在做什麼？', 'Who does what in blood?'),
      hook: P('一管血液裡，送氧、守衛、修補的都是同一種嗎？先把一管血分層，再點一顆血球看它的工作。', 'Does the same component carry oxygen, defend us and repair injury? Separate a sample into layers, then select a cell to examine its job.'),
      lead: P('血液由血漿與有形成分組成。有形成分包括紅血球、白血球及血小板；它們的形狀、大小、數量與功能不同。', 'Blood contains plasma and formed elements: red cells, white cells and platelets. Their shape, size, abundance and function differ.'),
      paragraphs: [
        P('加抗凝劑的血液經離心後，上層淡黃色是血漿，下層主要是紅血球，交界有很薄的白血球與血小板層。示意採約 55% 血漿、45% 有形成分，不代表每個人的比例固定。', 'After anticoagulated blood is centrifuged, pale-yellow plasma is above, red cells below, and a very thin layer of white cells and platelets lies between. The model uses approximately 55% plasma and 45% formed elements, not a fixed ratio for everyone.'),
        P('成熟的人類紅血球呈雙凹圓盤、沒有細胞核，血紅素讓血液呈紅色並攜帶氧氣。富氧血較鮮紅；含氧較少仍是暗紅色，不是藍色。', 'Mature human red cells are biconcave discs without nuclei. Hemoglobin gives blood its red colour and carries oxygen. Oxygen-rich blood is brighter red; oxygen-poor blood remains dark red, not blue.'),
        P('白血球有細胞核，是不同防禦細胞的統稱。吞噬、產生抗體和免疫記憶是不同種類與狀態的工作，不代表每一個白血球都能同時完成所有任務。', 'White cells have nuclei and include several defence cell types. Engulfment, antibody production and immune memory involve different cell types or states, rather than every white cell doing all jobs at once.'),
        P('血小板是沒有細胞核的小碎片，血管受傷時會黏附與聚集，並配合凝血作用幫助止血。血漿也運送養分、激素和廢物，因此血液不是只有「送氧」一種任務。', 'Platelets are small fragments without nuclei. They adhere and aggregate at injured vessels and assist clotting. Plasma carries nutrients, hormones and wastes, so blood does more than deliver oxygen.'),
        P('課本血抹片與電子顯微影像是觀察證據。血抹片中的染色、電子影像的著色是辨認工具，不可當成活體白血球或血小板的原色；模擬的數量比例也不是血球計數。', 'The textbook smear and electron micrograph are observational evidence. Staining and added colour aid identification but do not show the natural colour of living white cells or platelets. Simulated particle counts are not blood counts.')
      ],
      question: P('一個微血管旁的組織細胞收到氧氣時，是紅血球穿出去，還是氧氣分子穿出去？', 'When a tissue cell receives oxygen, does the red cell leave the capillary, or do oxygen molecules cross its wall?'),
      closure: P('血漿運送溶解物質；紅血球攜氧；白血球防禦；血小板協助止血。', 'Plasma carries dissolved substances, red cells carry oxygen, white cells defend, and platelets help stop bleeding.')
    },
    {
      id: 'circulation', main: P('跟一顆紅血球走', 'Follow one red cell'), sub: P('體循環＋肺循環', 'Systemic + pulmonary'),
      heading: P('一顆紅血球的完整旅行', 'One red cell’s complete journey'),
      hook: P('從左心室出發，回到同一個地方之前，會經過肺幾次？追蹤同一顆紅血球，不要在半途換車。', 'Starting in the left ventricle, how many lung visits occur before returning? Follow the same red cell for the entire trip.'),
      lead: P('體循環和肺循環連在一起。紅血球走在心臟與血管內，先把氧送到組織，再回右心、到肺補氧，最後回左心。', 'Systemic and pulmonary circuits are connected. A red cell stays in heart chambers and vessels, supplies body tissues, returns to the right heart, gains oxygen in the lungs and returns to the left heart.'),
      paragraphs: [
        P('完整路線：左心室、主動脈／小動脈、組織微血管、小靜脈／上、下大靜脈、右心房、右心室、肺動脈、肺部微血管、肺靜脈、左心房，再回左心室。', 'Complete route: left ventricle, aorta / arterioles, body capillaries, venules / venae cavae, right atrium, right ventricle, pulmonary artery, lung capillaries, pulmonary veins, left atrium, and back to the left ventricle.'),
        P('體循環由左心室送出、回右心房。組織細胞使用氧與養分進行代謝；氧氣從微血管擴散出去，細胞產生的二氧化碳與廢物則進入血液。', 'The systemic circuit runs from left ventricle to right atrium. Tissue cells use oxygen and nutrients; oxygen diffuses out of capillaries and carbon dioxide and wastes enter blood.'),
        P('肺循環由右心室送出、回左心房。在肺部，肺泡中的氧氣進入血液；血中的二氧化碳進肺泡，再呼出體外。肺泡是空氣的空間，紅血球不會游進肺泡。', 'The pulmonary circuit runs from right ventricle to left atrium. Oxygen enters blood from alveoli; carbon dioxide enters alveoli and is exhaled. Alveoli are air spaces, not places where red cells swim.'),
        P('每個小分子的擴散取決於兩側的濃度或分壓差。放大窗中的 O₂ 與 CO₂ 比紅血球小；其形狀特別放大供辨認，不代表真實分子與細胞的尺寸比例。', 'Diffusion follows each molecule’s concentration or partial-pressure difference. O₂ and CO₂ symbols are smaller than red cells, but deliberately enlarged for recognition; molecular and cellular dimensions are not to scale.'),
        P('二氧化碳不全掛在紅血球上。補充：大部分在運輸過程中轉成碳酸氫根，主要由血漿運送；這裡只呈現兩側交換，不把每顆 CO₂ 畫成紅血球的乘客。', 'Carbon dioxide is not all carried on red cells. Extension: much is converted to bicarbonate and transported in plasma. The model shows exchange without attaching every CO₂ symbol to a red cell.')
      ],
      question: P('肝臟、腎臟和小腸絨毛的細胞也需要交換物質：它們與微血管之間，除了氣體，還可能交換什麼？', 'Liver, kidney and intestinal-villus cells also exchange substances with blood. What might cross their capillaries besides gases?'),
      closure: P('一個完整循環經過心臟兩次；紅血球留在封閉管路，小分子在肺與組織交換。', 'A complete double circuit passes through the heart twice; red cells stay within the closed route while small molecules exchange at lungs and tissues.')
    },
    {
      id: 'lymph', main: P('流出去，怎麼回來？', 'How does fluid return?'), sub: P('組織液與淋巴', 'Tissue fluid and lymph'),
      heading: P('流出去的液體去哪了？', 'Where does escaped fluid go?'),
      hook: P('血管送到細胞旁的液體，怎麼回到循環裡？追蹤同一份水，看看位置一變，名稱怎麼變。', 'How does fluid delivered beside cells return to circulation? Follow water and see how its name changes with location.'),
      lead: P('血漿的一部分水與小分子可進入組織細胞間，成為組織液；組織液進入淋巴管後稱為淋巴，最後回到靜脈。', 'Water and small molecules from plasma can enter spaces between tissue cells as tissue fluid. After entering lymphatic vessels the fluid is called lymph and eventually returns to veins.'),
      paragraphs: [
        P('血漿在血管內，組織液在組織細胞間，淋巴在淋巴管內。這三個名稱主要辨認所在位置，不是血漿一流出去就突然變成另一種完全不同的液體。', 'Plasma is inside blood vessels, tissue fluid is between tissue cells, and lymph is inside lymphatic vessels. These names identify compartments rather than three unrelated liquids.'),
        P('正常紅血球不隨這些液體穿出一般微血管；留在血管內的血球和多數大蛋白，也使組織液與血漿的組成有所不同。', 'Normal red cells do not leave ordinary capillaries with this fluid. Retention of cells and many large proteins also means tissue fluid and plasma do not have identical composition.'),
        P('依課本的簡化模型，部分組織液回到血管，部分進入鄰近淋巴管。實際淨流量依組織、壓力與狀態而異；本圖不固定分配比例，也不表示每一條微血管都同樣回收。', 'In the textbook’s simplified model, some tissue fluid returns directly to blood and some enters nearby lymphatics. Net flow depends on tissue, pressure and state; the model assigns no fixed fractions or identical behaviour to every capillary.'),
        P('淋巴管起於組織間的盲端，淋巴逐步匯入較大的淋巴管。瓣膜配合周圍肌肉與呼吸等作用，幫助單向回流；沒有另一顆「淋巴心臟」。', 'Lymphatic vessels begin as blind-ended capillaries and merge into larger vessels. Valves cooperate with muscle movement and breathing to assist one-way return; there is no separate lymph heart.'),
        P('淋巴結分布於淋巴管途中，能過濾異物，並讓防禦細胞接觸病原體。最後淋巴回到頸根部附近的靜脈，接回心血管系統。', 'Nodes along lymphatic vessels filter foreign material and provide sites for immune cells to encounter pathogens. Lymph ultimately enters veins near the base of the neck and rejoins the cardiovascular system.'),
        P('淋巴主要協助回收組織液、運送部分養分（如小腸吸收的脂質），並參與防禦。圖中綠色只為區分淋巴路徑；一般淋巴並不是綠色的血。', 'Lymphatics recover tissue fluid, transport some nutrients such as intestinally absorbed fats, and support defence. Green distinguishes the lymphatic route; ordinary lymph is not green blood.')
      ],
      question: P('組織液若都流出、完全沒有回收，組織與血液的液體量會怎樣變？用模型中的回收路徑說明。', 'If all fluid escaped and none returned, how would tissue and blood volumes change? Explain using the return routes.'),
      closure: P('血漿在管內、組織液在細胞間、淋巴在淋巴管；回收路徑最後接回靜脈。', 'Plasma is in blood vessels, tissue fluid between cells, lymph in lymphatics; recovery routes ultimately reconnect to veins.')
    },
    {
      id: 'experiment', main: P('看見，量出來', 'Observe and measure'), sub: P('脈搏與魚尾血流', 'Pulse and fish-tail flow'),
      heading: P('把循環看見、量出來', 'Make circulation visible and measurable'),
      hook: P('摸到的每一下，和聽到的「咚咚」，怎麼算一次心跳？先量一分鐘，再看顯微視野裡哪條在分流。', 'How do a pulse beat and a “lub-dub” pair count as one heartbeat? Measure for a minute, then inspect which vessels branch in a microscopic field.'),
      lead: P('第一個實驗比較運動前後的心音與脈搏；第二個觀察魚尾鰭血管的血流。量測是你的實測，血流模型則明示為教學模擬。', 'The first experiment compares heart sounds and pulse before and after activity; the second observes flow in fish-tail vessels. Your measurements are real observations; the flow model is clearly marked as a teaching simulation.'),
      paragraphs: [
        P('心室射血使動脈管壁週期性擴張、回復，形成脈搏。用食指與中指輕按手腕靠拇指側的動脈；不使用拇指，避免混入自己拇指的脈搏。', 'Ventricular ejection causes periodic arterial expansion and recoil: the pulse. Gently use index and middle fingers at the wrist artery below the thumb; avoid using the thumb, which has its own pulse.'),
        P('聽診器的薄膜面置於左胸前，不敲擊或朝聽診器大叫。一組「咚咚」是一次心搏週期，不是兩次；主要兩個心音與瓣膜關閉有關。', 'Place the stethoscope diaphragm over the left chest; never strike it or shout into it. One “lub-dub” pair is one cardiac cycle, not two; the two main sounds accompany valve closure.'),
        P('依課本流程：兩人一組，靜坐休息 5 分鐘；同時計心搏與脈搏各 1 分鐘；原地踏步 3 分鐘；結束後立即再測 1 分鐘，最後互換角色重做。', 'Follow the textbook: work in pairs, sit quietly for 5 minutes, count heartbeats and pulse for 1 minute, step in place for 3 minutes, measure for 1 minute immediately afterward, then swap roles and repeat.'),
        P('計時採實際時間。點按計數代表自己感受到或聽到的一次，也可輸入整分鐘的紙本紀錄；未完成或漏數的測量不會自動乘成每分鐘結果。', 'The timer uses real time. Each tap records a beat you feel or hear; you may also enter a complete one-minute paper record. Incomplete or interrupted counts are not automatically extrapolated to a per-minute result.'),
        P('課本討論：同一受試者的心搏與脈搏次數是否相同？運動前後是否一樣，為什麼？若差異很大，先檢查計時、計數、量測部位與個體差異。', 'Textbook discussion: are heartbeat and pulse counts the same for the same person? Do they change after exercise, and why? For a large mismatch, consider timing, counting, measurement site and individual variation.'),
        P('魚尾觀察限教師示範。依課本用少量水的透明夾鏈袋安置小魚，或使用濕棉花替代裝置；低倍先找尾鰭，保持濕潤、不敲桌、不驚嚇，觀察完迅速放回水中。', 'Fish-tail observation is teacher-led. The textbook uses a transparent bag with a small amount of water or an alternative wet-cotton setup. Start at low power, keep the fish moist, avoid tapping or startling it, and return it promptly to water.'),
        P('觀察顆粒主要是紅血球。動脈往外分支、微血管交換、靜脈向回程匯流；同一視野的上下或左右方向不能直接當作離心／向心。魚類紅血球有細胞核，不沿用成熟人類紅血球無核的畫法。', 'The moving particles are mainly red cells. Arteries branch outward, capillaries exchange, and veins converge on the return route. Screen direction alone does not establish flow away from or toward the heart. Fish red cells have nuclei, unlike mature human red cells.')
      ],
      question: P('先不看答案：視野裡哪一條在分支、哪一條在匯流？能不能只憑它往左或往右流，就決定它是動脈？', 'Before revealing names, identify branching and convergence. Can leftward or rightward motion alone determine which vessel is an artery?'),
      closure: P('「咚咚」算一次，脈搏數整分鐘；辨血管看與心臟的關係及分支／匯流證據。', 'Count one lub-dub pair as one beat; measure for a full minute; identify vessels by their relationship to the heart and branching or convergence evidence.')
    }
  ];

  const mod = (a, b) => ((a % b) + b) % b;
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const item = (label, key, value, input) => ({ label, key, value, ...(input ? { input } : {}) });
  const group = (label, items) => ({ label, items });
  const source = (file, name, page, figure) => ({ file, name, page, figure });
  const TEXT = (ctx, D, pair, x, y, max = 900, extra = {}) => D.text(ctx, pair, x, y, { size: 22, color: C.ink, max, ...extra });
  function lines(ctx, D, pair, x, y, width, maxLines = 4, color = C.ink) {
    const value = D.tr(pair);
    ctx.save(); ctx.font = '700 22px "Noto Sans TC", "JetBrains Mono", sans-serif';
    const units = /\s/.test(value) ? value.split(/\s+/).map(w => w + ' ') : Array.from(value);
    let line = '', row = 0;
    for (const unit of units) {
      if (ctx.measureText(line + unit).width > width && line) {
        TEXT(ctx, D, P(line.trim(), line.trim()), x, y + row * 30, width, { color });
        line = unit; row += 1;
      } else line += unit;
      if (row >= maxLines) break;
    }
    if (line && row < maxLines) TEXT(ctx, D, P(line.trim(), line.trim()), x, y + row * 30, width, { color });
    ctx.restore();
    return y + (row + 1) * 30;
  }
  function poly(ctx, points, color, width) {
    ctx.save(); ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); ctx.restore();
  }
  function pointOn(points, u, weights) {
    const lens = points.slice(1).map((p, i) => weights ? weights[i] : Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    const total = lens.reduce((a, b) => a + b, 0);
    let target = clamp(u) * total;
    for (let i = 0; i < lens.length; i++) {
      if (target <= lens[i] || i === lens.length - 1) {
        const v = lens[i] ? clamp(target / lens[i]) : 0;
        return { x: lerp(points[i][0], points[i + 1][0], v), y: lerp(points[i][1], points[i + 1][1], v), angle: Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0]), segment: i };
      }
      target -= lens[i];
    }
    return { x: points[0][0], y: points[0][1], angle: 0, segment: 0 };
  }
  function oxygenColour(u) {
    const a = [118, 35, 47], b = [239, 62, 70];
    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(u)))).join(',')})`;
  }
  function redCell(ctx, x, y, r = 10, oxygen = 1, angle = 0, fish = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const g = ctx.createRadialGradient(-r * .25, -r * .3, 1, 0, 0, r);
    g.addColorStop(0, oxygenColour(oxygen)); g.addColorStop(.6, oxygenColour(oxygen)); g.addColorStop(1, C.poor);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3a49b'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = fish ? C.nucleus : C.poor; ctx.globalAlpha = fish ? .95 : .55;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .36, r * .28, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function whiteCell(ctx, x, y, r = 16) {
    ctx.save(); ctx.fillStyle = '#e7e4d3'; ctx.strokeStyle = C.nucleus; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = C.nucleus; ctx.beginPath(); ctx.arc(x - 6 + i * 5, y + (i % 2 ? -3 : 2), 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function platelet(ctx, x, y, r = 4) {
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * .5 : r; const p = [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    ctx.closePath(); ctx.fillStyle = C.yellow; ctx.fill(); ctx.restore();
  }
  function glucose(ctx, x, y, size = 6) {
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p = [x + Math.cos(a) * size, y + Math.sin(a) * size]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    ctx.closePath(); ctx.fillStyle = C.yellow; ctx.fill(); ctx.strokeStyle = '#fff2ac'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  function board(ctx, D, title, note) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 960, 600);
    TEXT(ctx, D, title, 24, 35, 910, { size: 27, color: C.yellow });
    if (note) TEXT(ctx, D, note, 24, 582, 912);
  }
  function imagePanel(ctx, D, file, x, y, w, h) {
    D.round(ctx, x, y, w, h, 12, '#fffaf0');
    const fitted = D.image(ctx, file, x + 6, y + 6, w - 12, h - 12);
    if (!fitted) TEXT(ctx, D, P('課本原圖載入中…', 'Loading textbook image…'), x + 16, y + 40, w - 32, { color: C.bg });
    return fitted;
  }
  function tick(s, t) {
    const delta = s.lastTime === undefined ? 0 : Math.max(0, Math.min(1.5, t - s.lastTime));
    s.lastTime = t;
    return s.running ? delta : 0;
  }
  const HEART_REGIONS = {
    ra: [.10, .34, .32, .30], rv: [.20, .60, .38, .27],
    la: [.60, .30, .27, .22], lv: [.57, .52, .35, .40],
    av: [.30, .43, .52, .25], sl: [.34, .25, .30, .25], septum: [.48, .48, .33, .44]
  };
  function focusOutline(ctx, D, fitted, crop, key, value) {
    if (!fitted) return;
    const [a, b, c, d] = crop;
    const x = fitted.x + a * fitted.w, y = fitted.y + b * fitted.h;
    const w = c * fitted.w, h = d * fitted.h;
    D.round(ctx, x, y, w, h, 8, 'rgba(253,224,71,.08)', C.yellow);
    if (key) D.hit(x, y, w, h, key, value);
  }
  function valveChannel(ctx, D, x, y, w, open, t, name, from, to) {
    TEXT(ctx, D, name, x, y - 34, w, { color: C.yellow });
    D.round(ctx, x, y - 18, w, 38, 18, '#dec6a4', '#d89081');
    const gate = x + w * .53;
    for (let i = 0; i < 4; i++) {
      let pos = mod(t * .26 + i / 4, 1);
      if (!open) pos = Math.min(pos, .53 - .055 - i * .025);
      redCell(ctx, x + 12 + (w - 24) * pos, y, 8, .6);
    }
    poly(ctx, [[gate - 6, y - 18], [gate + (open ? 16 : -2), y - (open ? 13 : 1)]], C.poor, 4);
    poly(ctx, [[gate - 6, y + 18], [gate + (open ? 16 : -2), y + (open ? 13 : 1)]], C.poor, 4);
    TEXT(ctx, D, from, x, y + 38, w / 2 - 6);
    TEXT(ctx, D, to, x + w, y + 38, w / 2 - 6, { align: 'right' });
  }
  function septumOutline(ctx, fitted) {
    if (!fitted) return;
    const point = (x, y) => [fitted.x + fitted.w * x, fitted.y + fitted.h * y];
    ctx.save(); ctx.beginPath(); ctx.moveTo(...point(.505, .494));
    ctx.bezierCurveTo(...point(.507, .575), ...point(.552, .653), ...point(.600, .735));
    ctx.bezierCurveTo(...point(.644, .804), ...point(.699, .872), ...point(.764, .901));
    ctx.bezierCurveTo(...point(.800, .900), ...point(.792, .865), ...point(.750, .820));
    ctx.bezierCurveTo(...point(.695, .748), ...point(.659, .678), ...point(.609, .600));
    ctx.bezierCurveTo(...point(.581, .550), ...point(.560, .506), ...point(.543, .493));
    ctx.closePath(); ctx.fillStyle = 'rgba(253,224,71,.10)'; ctx.fill();
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  }
  function heartDraw(ctx, s, t, D) {
    const delta = tick(s, t);
    if (s.auto) s.beat = mod(s.beat + delta * .55, 4);
    const phase = PHASES[Math.floor(s.beat)];
    board(ctx, D, P('課本心臟原圖＋瓣膜機制', 'Original heart + valve mechanism'), P('觀眾左＝人體右；觀眾右＝人體左。機制窗不是器官外形。', 'Viewer left = body right; viewer right = body left. Channels show valve function.'));
    const fitted = imagePanel(ctx, D, s.view === 'body' ? 'body_circulation.png' : 'heart.png', 24, 62, 430, 490);
    const crop = HEART_REGIONS[s.part] || HEART_REGIONS.lv;
    if (s.view === 'heart') {
      if (s.part === 'septum') septumOutline(ctx, fitted);
      else focusOutline(ctx, D, fitted, crop);
    }
    if (fitted && s.view === 'heart') {
      // The four chamber rectangles are taps on the original, never replacements.
      ['ra', 'rv', 'la', 'lv'].forEach(key => {
        const r = HEART_REGIONS[key]; D.hit(fitted.x + r[0] * fitted.w, fitted.y + r[1] * fitted.h, r[2] * fitted.w, r[3] * fitted.h, 'part', key);
      });
    }
    const name = CHAMBERS.find(x => x.id === s.part) || CHAMBERS[3];
    TEXT(ctx, D, name.name, 489, 86, 440, { size: 27, color: C.yellow });
    D.round(ctx, 486, 101, 444, 234, 10, '#fffaf0');
    D.focus(ctx, 'heart.png', crop, [492, 107, 432, 222]);
    TEXT(ctx, D, phase.name, 489, 353, 440, { size: 24 });
    valveChannel(ctx, D, 489, 416, 439, phase.av, t, P('房室瓣', 'AV valves'), P('心房', 'Atrium'), P('心室', 'Ventricle'));
    valveChannel(ctx, D, 489, 515, 439, phase.sl, t, P('半月瓣', 'Semilunar valves'), P('心室', 'Ventricle'), P('動脈', 'Artery'));
    D.status(P(`${D.tr(phase.name)}｜房室瓣${phase.av ? '開' : '關'}；半月瓣${phase.sl ? '開' : '關'}`, `${D.tr(phase.name)} | AV ${phase.av ? 'open' : 'closed'}; semilunar ${phase.sl ? 'open' : 'closed'}`));
  }
  function heartExplain(s) {
    const chamber = CHAMBERS.find(x => x.id === s.part) || CHAMBERS[3];
    const phase = PHASES[Math.floor(s.beat)];
    return { title: chamber.name, text: P(chamber.text[0] + '\n\n' + phase.text[0], chamber.text[1] + '\n\n' + phase.text[1]) };
  }

  const VESSEL_TEXT = {
    artery: P('先看流向：動脈離開心臟。切片左側較圓、紫色管壁較厚；血管圖中的動脈有較厚肌肉與彈性層。', 'Arteries carry blood away from the heart. The rounded vessel on the left of the section has a thick stained wall; the atlas shows thicker muscle and elastic layers.'),
    capillary: P('微血管管壁薄、離細胞近，平均流速較慢而有利交換。只比較這個放大模型的趨勢；不能拿不同原圖在螢幕上的大小當成真實尺寸。', 'Capillaries have thin walls and lie close to cells; slower average flow assists exchange. Model speeds are qualitative. Screen sizes of different images are not real-size comparisons.'),
    vein: P('靜脈回到心臟。切片右側管壁較薄、管腔較大，容易呈扁形；部分靜脈有瓣膜，骨骼肌擠壓可協助回流。', 'Veins return blood to the heart. The right-hand section has a thinner wall and larger, more flattened lumen. Some veins have valves and muscle compression assists return.')
  };
  function vesselsDraw(ctx, s, t, D) {
    board(ctx, D, P('真實切片與連續血流模型', 'Real section and continuous flow model'), P('模型速度僅比較趨勢；鮮紅／暗紅表示相對含氧量，沒有藍色血。', 'Model speeds are qualitative. Bright/dark red show oxygen content; blood is not blue.'));
    if (s.view === 'micrograph') {
      const f = imagePanel(ctx, D, 'vessel_photo.png', 24, 66, 474, 276);
      const cr = s.vessel === 'vein' ? [.53, .06, .32, .69] : [.20, .19, .35, .59];
      focusOutline(ctx, D, f, cr);
      D.round(ctx, 520, 66, 411, 276, 10, '#fffaf0');
      D.focus(ctx, 'vessel_photo.png', cr, [526, 72, 399, 264]);
      TEXT(ctx, D, P('光學切片：左動脈、右靜脈', 'Optical section: artery left, vein right'), 24, 370, 480);
      TEXT(ctx, D, P('原圖區域放大', 'Zoom of the original region'), 520, 370, 412);
    } else if (s.view === 'capillary') {
      imagePanel(ctx, D, 'capillary_micrograph.png', 24, 66, 465, 287);
      imagePanel(ctx, D, 'vessel_atlas.png', 513, 66, 418, 287);
      TEXT(ctx, D, P('光學影像：微血管與紅血球', 'Optical image: capillary and red cells'), 24, 376, 465);
      TEXT(ctx, D, P('課本構造圖：非顯微照片', 'Textbook anatomy: not a micrograph'), 513, 376, 420);
    } else {
      const f = imagePanel(ctx, D, 'vessel_atlas.png', 24, 66, 546, 312);
      const crop = s.vessel === 'artery' ? [.01, .0, .25, .99] : s.vessel === 'vein' ? [.66, .0, .33, .99] : [.32, .50, .34, .42];
      focusOutline(ctx, D, f, crop);
      D.round(ctx, 594, 66, 337, 312, 10, '#fffaf0');
      D.focus(ctx, 'vessel_atlas.png', crop, [600, 72, 325, 300]);
    }
    const inO = s.circuit === 'lung' ? .22 : 1, outO = s.circuit === 'lung' ? 1 : .22;
    const routes = [-43, 0, 43].map(dy => [[38, 463], [226, 463], [330, 463 + dy], [595, 463 + dy], [712, 463], [921, 463]]);
    routes.forEach(path => { poly(ctx, path, C.wall, 27); poly(ctx, path, '#dec6a4', 20); });
    for (let branch = 0; branch < 3; branch++) {
      for (let i = 0; i < 9; i++) {
        const u = mod(t * (s.squeeze ? .060 : .045) + i / 9 + branch * .023, 1);
        const p = pointOn(routes[branch], u, [1.5, .9, 4.3, .9, 1.6]);
        const o = p.segment < 2 ? inO : p.segment > 2 ? outO : lerp(inO, outO, clamp((p.x - 330) / 265));
        redCell(ctx, p.x, p.y, p.segment === 2 ? 8 : 10, o, p.angle);
      }
    }
    const vx = 815;
    poly(ctx, [[vx, 452], [vx + 15, 457]], C.poor, 3);
    poly(ctx, [[vx, 474], [vx + 15, 469]], C.poor, 3);
    if (s.squeeze) {
      poly(ctx, [[765, 428], [788, 449]], C.yellow, 6); poly(ctx, [[765, 499], [788, 478]], C.yellow, 6);
    }
    TEXT(ctx, D, P('離開心臟', 'Away from heart'), 37, 539, 205);
    TEXT(ctx, D, P('微血管：慢、交換', 'Capillaries: slow exchange'), 466, 539, 384, { align: 'center' });
    TEXT(ctx, D, P('回到心臟', 'Toward heart'), 923, 539, 208, { align: 'right' });
    D.status(s.circuit === 'lung' ? P('肺動脈：較少氧｜肺靜脈：富氧', 'Pulmonary artery: O₂-poor | pulmonary vein: O₂-rich') : P('體循環動脈：富氧｜靜脈：較少氧', 'Systemic artery: O₂-rich | vein: O₂-poor'));
  }

  // Crops verified against the stained smear: a biconcave disc, a nucleated
  // white cell, and a small purple platelet; no crop is a literal scale bar.
  const BLOOD_CROPS = { rbc: [.49, .34, .10, .13], wbc: [.414, .493, .10, .14], platelet: [.829, .863, .049, .067], plasma: [0, 0, 1, 1] };
  function bloodDraw(ctx, s, t, D) {
    const delta = tick(s, t);
    s.separation = clamp(s.separation + (s.targetSeparation - s.separation) * Math.min(1, delta * 1.6));
    if (s.task === 'separate') return separationDraw(ctx, s, t, D);
    const choice = COMPONENTS.find(x => x.id === s.component) || COMPONENTS[0];
    board(ctx, D, P('課本證據＋各成分的工作模型', 'Textbook evidence + component functions'), P('原影像是證據；下方是放大模型，物件數量不是血球計數。', 'Original images are evidence; model particle counts are not laboratory blood counts.'));
    const crop = BLOOD_CROPS[s.component];
    const f = imagePanel(ctx, D, s.view === 'focus' ? 'blood_smear.png' : 'blood_vessel.png', 24, 66, 435, 285);
    if (s.view === 'focus') {
      focusOutline(ctx, D, f, crop);
      D.round(ctx, 483, 66, 447, 285, 10, '#fffaf0');
      D.focus(ctx, 'blood_smear.png', crop, [489, 72, 435, 273]);
    } else {
      const smear = imagePanel(ctx, D, s.view === 'em' ? 'blood_electron_original.png' : 'blood_smear.png', 483, 66, 447, 285);
      if (s.view !== 'em' && s.component !== 'plasma') focusOutline(ctx, D, smear, crop, 'view', 'focus');
    }
    TEXT(ctx, D, s.view === 'focus' ? P('染色光學血抹片：原圖', 'Stained optical smear: original') : P('課本血管剖面示意', 'Textbook cutaway illustration'), 24, 379, 440);
    TEXT(ctx, D, s.view === 'focus' ? P('同一原圖區域放大', 'Enlargement from the same original') : s.view === 'em' ? P('著色電子顯微影像', 'Colourised electron micrograph') : P('染色光學血抹片', 'Stained optical blood smear'), 483, 379, 447);
    D.round(ctx, 24, 413, 906, 109, 35, '#d6b576', C.wall);
    for (let i = 0; i < 22; i++) {
      const x = 41 + mod(t * 46 + i * 53, 867), y = 437 + (i % 3) * 26;
      redCell(ctx, x, y, 12, .82, Math.sin(i) * .5);
      if (s.component === 'rbc') { D.oxygen(ctx, x - 3, y - 4, 3); }
    }
    for (let i = 0; i < 3; i++) whiteCell(ctx, 72 + mod(t * 46 + i * 284, 824), 474, 17);
    for (let i = 0; i < 11; i++) platelet(ctx, 42 + mod(t * 46 + i * 83, 868), 499 + Math.sin(i * 2) * 4, 4);
    if (s.component === 'plasma') for (let i = 0; i < 10; i++) {
      const x = 52 + mod(t * 46 + i * 90, 856), y = 456 + (i % 2) * 18;
      i % 2 ? D.water(ctx, x, y, 5) : glucose(ctx, x, y, 5);
    }
    if (s.task === 'repair') {
      // A short, explicit local injury; normal RBCs stay within the lumen.
      ctx.fillStyle = C.bg; ctx.fillRect(729, 409, 46, 15);
      const p = clamp(s.repair);
      s.repair = clamp(s.repair + delta * .14);
      for (let i = 0; i < 12; i++) {
        const start = [500 + i * 17, 468 + i % 3 * 11], end = [735 + i % 4 * 9, 415 + Math.floor(i / 4) * 5];
        platelet(ctx, lerp(start[0], end[0], p), lerp(start[1], end[1], p), 5);
      }
      if (p > .35) for (let i = 0; i < 6; i++) poly(ctx, [[730, 418 + i * 3], [773, 430 - i * 3]], 'rgba(242,236,217,.65)', 1.5);
    }
    TEXT(ctx, D, choice.name, 24, 552, 320, { color: C.yellow, size: 25 });
    TEXT(ctx, D, s.task === 'repair' ? P('血小板＋凝血：局部修補', 'Platelets + clotting: local repair') : P('觀察大小、核與相對數量', 'Compare size, nuclei and abundance'), 930, 552, 562, { align: 'right' });
    D.status(choice.name);
  }
  function separationDraw(ctx, s, t, D) {
    board(ctx, D, P('離心分層的教學模型', 'Teaching model of centrifuged blood'), P('有抗凝劑的血液；55%／45% 為概略示意，非個人實測。', 'Anticoagulated blood. 55% / 45% are approximate, not personal measurements.'));
    imagePanel(ctx, D, 'blood_smear.png', 24, 74, 457, 388);
    TEXT(ctx, D, P('同一份血液，包含不同成分', 'One sample contains several components'), 24, 497, 456);
    D.round(ctx, 569, 85, 183, 420, 70, '#ead59b', '#f2ecd9');
    const sep = s.separation;
    ctx.save(); ctx.beginPath(); ctx.roundRect(575, 91, 171, 408, 64); ctx.clip();
    if (sep > .01) { ctx.globalAlpha = sep; ctx.fillStyle = C.poor; ctx.fillRect(575, 91 + 408 * .55, 171, 408 * .45); ctx.fillStyle = '#e7e4d3'; ctx.fillRect(575, 91 + 408 * .545, 171, 6); ctx.globalAlpha = 1; }
    for (let i = 0; i < 38; i++) {
      const original = [593 + (i * 41 % 130), 111 + (i * 67 % 352)];
      const settled = [593 + (i * 37 % 130), 335 + (i * 43 % 129)];
      redCell(ctx, lerp(original[0], settled[0], sep), lerp(original[1], settled[1], sep), 9, .35);
    }
    for (let i = 0; i < 3; i++) whiteCell(ctx, 606 + i * 41, lerp(160 + i * 100, 318, sep), 10);
    ctx.restore();
    TEXT(ctx, D, P('血漿約 55%', 'Plasma ≈ 55%'), 789, 180, 150, { color: C.plasma });
    lines(ctx, D, P('白血球與血小板薄層', 'Thin white-cell and platelet layer'), 789, 284, 151, 3);
    lines(ctx, D, P('紅血球為主，約 45%', 'Mostly red cells, ≈ 45%'), 789, 401, 150, 3, C.yellow);
    D.hit(569, 85, 183, 225, 'component', 'plasma'); D.hit(569, 310, 183, 194, 'component', 'rbc');
    D.status(s.targetSeparation ? P('分層中：血漿在上，紅血球在下', 'Separating: plasma above, red cells below') : P('混合狀態：各成分在血漿中', 'Mixed: components suspended in plasma'));
  }

  // This closed route is a functional circuit beside original anatomy, not a
  // replacement drawing of heart or lungs. Every station has one next station.
  const LOOP = [[563, 498], [563, 379], [563, 259], [563, 137], [695, 98], [864, 137], [864, 259], [864, 379], [864, 498], [712, 498], [563, 498]];
  function loopPoint(progress) {
    const p = mod(progress, 10), k = Math.floor(p), f = p - k;
    return { x: lerp(LOOP[k][0], LOOP[k + 1][0], f), y: lerp(LOOP[k][1], LOOP[k + 1][1], f), angle: Math.atan2(LOOP[k + 1][1] - LOOP[k][1], LOOP[k + 1][0] - LOOP[k][0]), k, f };
  }
  function loopOxygen(progress) {
    const k = Math.floor(mod(progress, 10)), f = mod(progress, 1);
    if (k < 2 || k > 7) return 1;
    if (k === 2) return lerp(1, .22, f);
    if (k === 7) return lerp(.22, 1, f);
    return .22;
  }
  const SHORT_STATIONS = [P('左心室', 'LV'), P('主動脈', 'Aorta'), P('組織', 'Body'), P('大靜脈', 'V. cavae'), P('右心房', 'RA'), P('右心室', 'RV'), P('肺動脈', 'PA'), P('肺', 'Lungs'), P('肺靜脈', 'PV'), P('左心房', 'LA')];
  function circulationDraw(ctx, s, t, D) {
    const delta = tick(s, t);
    s.travel = mod(s.travel + delta * .24 * s.speed, 10);
    if (s.view !== 'loop') {
      const lung = s.view === 'lung';
      board(ctx, D, lung ? P('肺：小分子進出，紅血球留在管內', 'Lungs: molecules exchange; red cells stay inside') : P('組織：送氧、收二氧化碳', 'Tissues: deliver oxygen, collect carbon dioxide'), P('微觀放大：分子比紅血球小，但兩者沒有按真實尺度比例繪製。', 'Molecules are smaller than cells; their relative sizes are enlarged, not to scale.'));
      imagePanel(ctx, D, lung ? 'lung_gas.png' : 'tissue_gas.png', 24, 76, 400, 443);
      TEXT(ctx, D, P('課本原圖', 'Original textbook illustration'), 24, 548, 400);
      exchangeWindow(ctx, s, t, D, 449, 76, 481, 443, lung);
      D.status(lung ? P('O₂：肺泡進血液｜CO₂：血液進肺泡', 'O₂: alveoli to blood | CO₂: blood to alveoli') : P('O₂：血液進組織｜CO₂：組織進血液', 'O₂: blood to tissue | CO₂: tissue to blood'));
      return;
    }
    const tracer = loopPoint(s.travel), station = STATIONS[tracer.k];
    board(ctx, D, P('同一顆紅血球，走完全程', 'The same red cell completes the entire circuit'), P('左圖是解剖原圖；右圖是封閉路線模型。黃框追蹤同一顆紅血球。', 'Original anatomy beside a closed route; the yellow ring tracks the same red cell.'));
    const f = imagePanel(ctx, D, 'heart.png', 24, 72, 403, 472);
    if (['lv', 'ra', 'rv', 'la'].includes(station.id)) focusOutline(ctx, D, f, HEART_REGIONS[station.id]);
    for (let k = 0; k < 10; k++) {
      const path = [LOOP[k], LOOP[k + 1]];
      poly(ctx, path, '#d89081', 29); poly(ctx, path, '#dfc29d', 23);
    }
    for (let i = 0; i < 20; i++) {
      const u = mod(s.travel + i * .5, 10), p = loopPoint(u);
      redCell(ctx, p.x, p.y, 8, loopOxygen(u), p.angle);
    }
    redCell(ctx, tracer.x, tracer.y, 12, loopOxygen(s.travel), tracer.angle);
    ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tracer.x, tracer.y, 19, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    LOOP.slice(0, 10).forEach((pos, k) => D.hit(pos[0] - 29, pos[1] - 29, 58, 58, 'station', k));
    SHORT_STATIONS.forEach((name, k) => {
      const p = LOOP[k];
      if (k === 4) TEXT(ctx, D, name, p[0], 67, 160, { align: 'center' });
      else if (k === 5) TEXT(ctx, D, name, 933, 104, 129, { align: 'right' });
      else if (k === 0 || k === 9) TEXT(ctx, D, name, p[0], 541, 168, { align: 'center' });
      else if (k < 4) TEXT(ctx, D, name, p[0] - 25, p[1] - 25, 150, { align: 'right' });
      else TEXT(ctx, D, name, 934, p[1] + 43, 191, { align: 'right' });
    });
    D.round(ctx, 605, 209, 207, 194, 12, C.panel);
    lines(ctx, D, station.name, 620, 239, 177, 3, C.yellow);
    const o = loopOxygen(s.travel);
    lines(ctx, D, o > .65 ? P('富氧：鮮紅', 'Oxygen-rich: bright red') : P('較少氧：暗紅', 'Oxygen-poor: dark red'), 620, 335, 177, 3);
    D.status(station.name);
  }
  function exchangeWindow(ctx, s, t, D, x, y, w, h, lung) {
    D.round(ctx, x, y, w, h, 12, C.panel);
    const top = y + 96, cy = y + 218, bottom = y + 336;
    TEXT(ctx, D, P('教學放大模型', 'Enlarged teaching model'), x + 18, y + 34, w - 36, { color: C.yellow });
    TEXT(ctx, D, lung ? P('肺泡中的空氣', 'Air inside an alveolus') : P('組織細胞旁', 'Beside tissue cells'), x + w / 2, top - 28, w - 34, { align: 'center' });
    D.round(ctx, x + 18, top - 10, w - 36, 52, 12, lung ? '#735055' : '#6c5a37');
    D.round(ctx, x + 18, cy - 33, w - 36, 66, 20, '#ddbc8a', C.wall);
    D.round(ctx, x + 18, bottom - 22, w - 36, 50, 12, '#6c5a37');
    if (lung) TEXT(ctx, D, P('血管周圍的組織', 'Tissue around the vessel'), x + w / 2, bottom + 60, w - 34, { align: 'center' });
    else TEXT(ctx, D, P('細胞耗氧，並產生二氧化碳', 'Cells use oxygen and release carbon dioxide'), x + w / 2, bottom + 60, w - 34, { align: 'center' });
    for (let i = 0; i < 8; i++) {
      const u = mod(t * .10 + i / 8, 1), px = x + 36 + (w - 72) * u;
      redCell(ctx, px, cy + Math.sin(i) * 11, 12, lung ? lerp(.22, 1, u) : lerp(1, .22, u));
    }
    const gasOther = lung ? top + 15 : bottom;
    for (let i = 0; i < 7; i++) {
      const u = mod(t * .34 + i / 7, 1), px = x + 58 + i * (w - 116) / 6;
      D.oxygen(ctx, px - 8, lerp(lung ? gasOther : cy, lung ? cy : gasOther, u), 4);
      D.co2(ctx, px + 10, lerp(lung ? cy : gasOther, lung ? gasOther : cy, u), 3);
    }
    TEXT(ctx, D, P('微血管腔：紅血球不穿出', 'Capillary lumen: red cells stay inside'), x + w / 2, cy - 53, w - 36, { align: 'center' });
    D.oxygen(ctx, x + 35, y + h - 29, 4); TEXT(ctx, D, P('氧氣', 'Oxygen'), x + 50, y + h - 20, 130);
    D.co2(ctx, x + 204, y + h - 29, 3); TEXT(ctx, D, P('二氧化碳', 'Carbon dioxide'), x + 227, y + h - 20, w - 251);
  }
  function circulationExplain(s) {
    if (s.view === 'lung') return { title: P('在肺交換，紅血球不進肺泡', 'Lung exchange, without red cells entering alveoli'), text: P(CONTENT[3].paragraphs[2][0] + '\n\n' + CONTENT[3].paragraphs[4][0], CONTENT[3].paragraphs[2][1] + '\n\n' + CONTENT[3].paragraphs[4][1]) };
    if (s.view === 'body') return { title: P('在組織交換，紅血球留在微血管', 'Tissue exchange, with red cells inside capillaries'), text: CONTENT[3].paragraphs[1] };
    const stop = STATIONS[Math.floor(mod(s.travel, 10))];
    return { title: stop.name, text: P(stop.text[0] + '\n\n' + CONTENT[3].paragraphs[0][0], stop.text[1] + '\n\n' + CONTENT[3].paragraphs[0][1]) };
  }

  const LYMPH_EXPLAIN = {
    plasma: { title: P('血漿：仍在血管內', 'Plasma: inside the vessel'), text: CONTENT[4].paragraphs[0] },
    tissue: { title: P('組織液：細胞之間', 'Tissue fluid: between cells'), text: CONTENT[4].paragraphs[2] },
    lymph: { title: P('淋巴：進入淋巴管', 'Lymph: inside lymphatic vessels'), text: CONTENT[4].paragraphs[3] },
    node: { title: P('淋巴結：回流途中接受過濾', 'Lymph node: filtering along the return route'), text: CONTENT[4].paragraphs[4] },
    return: { title: P('最後接回靜脈', 'Finally rejoining veins'), text: CONTENT[4].paragraphs[5] }
  };
  function lymphDraw(ctx, s, t, D) {
    board(ctx, D, P('同一份液體，換位置、換名稱', 'Fluid changes compartment and name'), P('綠色只標示淋巴路徑；水分子放大，紅血球不跟著流出。', 'Green marks lymphatic routes. Enlarged water molecules leave, not red cells.'));
    const f = imagePanel(ctx, D, 'lymph_body.png', 24, 66, 212, 488);
    if (s.compartment === 'node') focusOutline(ctx, D, f, [.15, .22, .69, .20]);
    const blood = [[288, 187], [919, 187]];
    poly(ctx, blood, C.wall, 56); poly(ctx, blood, '#d6b576', 44);
    for (let i = 0; i < 12; i++) { const u = mod(t * .075 + i / 12, 1); redCell(ctx, 298 + u * 609, 187, 11, lerp(1, .22, u)); }
    D.round(ctx, 305, 260, 379, 100, 18, '#615139');
    TEXT(ctx, D, P('組織細胞之間', 'Between tissue cells'), 495, 318, 346, { align: 'center' });
    const lymph = [[477, 352], [500, 414], [731, 414], [852, 414], [852, 187]];
    poly(ctx, lymph, '#5eb75a', 27); poly(ctx, lymph, '#badf9a', 17);
    // Explicit blind entry end, and a venous outlet at the top right.
    ctx.save(); ctx.strokeStyle = '#badf9a'; ctx.lineWidth = 17; ctx.beginPath(); ctx.arc(477, 352, 1, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const out = [[383, 187], [399, 241], [425, 298], [477, 319]];
    const direct = [[477, 319], [593, 313], [650, 246], [692, 187]];
    poly(ctx, out, 'rgba(233,206,133,.35)', 3); poly(ctx, direct, 'rgba(233,206,133,.35)', 3);
    const viaLymph = [[383, 187], [399, 241], [425, 298], [477, 319], ...lymph];
    const viaBlood = [...out, ...direct.slice(1)];
    const speed = s.movement === 'active' ? .10 : .065;
    for (let i = 0; i < 7; i++) {
      let p = pointOn(viaBlood, mod(t * speed + i / 7, 1)); D.water(ctx, p.x, p.y, 5);
      p = pointOn(viaLymph, mod(t * speed * .66 + i / 7, 1)); D.water(ctx, p.x, p.y, 5);
    }
    D.round(ctx, 680, 375, 104, 79, 37, '#7fc772', '#d3f1a5');
    for (let i = 0; i < 4; i++) whiteCell(ctx, 703 + i % 2 * 32, 398 + Math.floor(i / 2) * 25, 9);
    // Valves are depicted open for forward flow. No backwards particles are drawn.
    [[602, 414], [852, 285]].forEach(([x, y], i) => {
      const pts1 = i ? [[x - 10, y + 8], [x - 5, y - 8]] : [[x - 8, y - 10], [x + 8, y - 5]];
      const pts2 = i ? [[x + 10, y + 8], [x + 5, y - 8]] : [[x - 8, y + 10], [x + 8, y + 5]];
      poly(ctx, pts1, '#27622f', 3); poly(ctx, pts2, '#27622f', 3);
    });
    TEXT(ctx, D, P('血漿', 'Plasma'), 306, 136, 150);
    TEXT(ctx, D, P('直接回到血管', 'Direct return to blood'), 685, 239, 293, { align: 'right' });
    TEXT(ctx, D, P('淋巴管', 'Lymphatic vessel'), 314, 453, 283, { color: C.lymph });
    TEXT(ctx, D, P('淋巴結', 'Lymph node'), 731, 491, 200, { align: 'center', color: C.lymph });
    TEXT(ctx, D, P('回到靜脈', 'Into veins'), 928, 111, 230, { align: 'right', color: C.lymph });
    D.hit(285, 155, 320, 64, 'compartment', 'plasma'); D.hit(305, 261, 380, 100, 'compartment', 'tissue');
    D.hit(488, 389, 180, 50, 'compartment', 'lymph'); D.hit(680, 375, 104, 80, 'compartment', 'node'); D.hit(824, 162, 105, 81, 'compartment', 'return');
    const focus = { plasma: [284, 151, 320, 73], tissue: [302, 257, 385, 108], lymph: [485, 387, 180, 57], node: [676, 370, 112, 89], return: [826, 150, 104, 95] }[s.compartment];
    if (focus) D.round(ctx, ...focus, 9, 'rgba(253,224,71,.05)', C.yellow);
    TEXT(ctx, D, P('血漿 → 組織液 → 淋巴 → 靜脈', 'Plasma → tissue fluid → lymph → veins'), 267, 545, 665, { color: C.yellow });
    D.status(LYMPH_EXPLAIN[s.compartment].title);
  }

  const PROTOCOL = [
    { id: 'rest', seconds: 300, title: P('靜坐休息 5 分鐘', 'Sit quietly for 5 minutes') },
    { id: 'before', seconds: 60, title: P('運動前，測 1 分鐘', 'Before activity: measure 1 minute') },
    { id: 'exercise', seconds: 180, title: P('原地踏步 3 分鐘', 'Step in place for 3 minutes') },
    { id: 'after', seconds: 60, title: P('運動後，測 1 分鐘', 'After activity: measure 1 minute') }
  ];
  function completeTimer(s, now = Date.now()) {
    if (!s.timer || s.timer.done || now < s.timer.deadline) return;
    s.timer.done = true;
    if (s.timer.kind === 'before' || s.timer.kind === 'after') {
      s.records[s.timer.kind] = { heart: s.heartCount, pulse: s.pulseCount, seconds: 60, origin: 'tap', at: s.timer.deadline };
      s.example = false;
    }
  }
  function countBeat(s, key, delta) {
    const now = Date.now(); completeTimer(s, now);
    if (!s.timer || s.timer.done || !['before', 'after'].includes(s.timer.kind)) {
      s.feedback = P('先開始一分鐘量測，才會接受點按計數。', 'Start a one-minute measurement before recording taps.'); return;
    }
    s[key] = Math.max(0, s[key] + delta);
  }
  function experimentAct(s, key, value) {
    completeTimer(s);
    if (key === 'stage' && s.timer && !s.timer.done) {
      s.feedback = P('請完成目前實時計時，再換下一段。', 'Finish the current real-time interval before changing stage.'); return;
    }
    if (key !== 'action') { s[key] = ['stage', 'entryHeart', 'entryPulse'].includes(key) ? Number(value) : value; return; }
    if (value === 'start') {
      if (s.timer && !s.timer.done && Date.now() < s.timer.deadline) { s.feedback = P('目前實時計時尚未完成。', 'The current real-time interval is not finished.'); return; }
      const p = PROTOCOL[s.stage];
      s.timer = { kind: p.id, deadline: Date.now() + p.seconds * 1000, startedAt: Date.now(), seconds: p.seconds, done: false };
      s.heartCount = 0; s.pulseCount = 0; s.example = false; s.feedback = null;
    }
    if (value === 'heart') countBeat(s, 'heartCount', 1);
    if (value === 'pulse') countBeat(s, 'pulseCount', 1);
    if (value === 'undo-heart') countBeat(s, 'heartCount', -1);
    if (value === 'undo-pulse') countBeat(s, 'pulseCount', -1);
    if (value === 'paper') {
      if (![s.entryHeart, s.entryPulse].every(n => Number.isInteger(n) && n >= 0 && n <= 240) || ![1, 3].includes(s.stage)) {
        s.feedback = P('請先選運動前／後，輸入整分鐘的兩筆整數紀錄。', 'Select before/after and enter two integer counts from a complete one-minute record.'); return;
      }
      if (s.timer && !s.timer.done && Date.now() < s.timer.deadline) { s.feedback = P('完成目前量測後，再存紙本紀錄。', 'Finish the active measurement before saving a paper record.'); return; }
      s.records[PROTOCOL[s.stage].id] = { heart: s.entryHeart, pulse: s.entryPulse, seconds: 60, origin: 'paper' };
      s.example = false; s.feedback = P('已存入紙本的一分鐘紀錄。', 'Saved your one-minute paper record.');
    }
    if (value === 'example') { s.example = !s.example; s.feedback = null; }
  }
  function experimentDraw(ctx, s, t, D) {
    if (s.view === 'fish') return fishDraw(ctx, s, t, D);
    completeTimer(s);
    const p = PROTOCOL[s.stage];
    board(ctx, D, P('心音與脈搏：真實一分鐘計數', 'Heart sounds and pulse: real one-minute counts'), P('畫面暫停不停止實時計時；「咚咚」算一次。範例與實測分開。', 'Screen pause does not stop the real clock. A lub-dub pair counts once. Examples are separate.'));
    imagePanel(ctx, D, s.photo === 'sound' ? 'stethoscope_photo.png' : 'pulse_photo.png', 24, 72, 316, 226);
    TEXT(ctx, D, s.photo === 'sound' ? P('聽診：薄膜面貼左胸', 'Listening: diaphragm on left chest') : P('觸摸：食指＋中指', 'Feel pulse: index + middle fingers'), 24, 327, 321);
    lines(ctx, D, p.title, 24, 375, 316, 2, C.yellow);
    const active = s.timer && !s.timer.done;
    const left = active ? Math.max(0, Math.ceil((s.timer.deadline - Date.now()) / 1000)) : s.timer && s.timer.done ? 0 : p.seconds;
    TEXT(ctx, D, P(`${Math.floor(left / 60)} 分 ${String(left % 60).padStart(2, '0')} 秒`, `${Math.floor(left / 60)} min ${String(left % 60).padStart(2, '0')} s`), 24, 468, 316, { size: 36 });
    lines(ctx, D, s.timer && s.timer.done ? P('此段完成，請選下一段。', 'Interval complete. Select the next stage.') : active ? P('實時計時中', 'Real-time interval running') : P('按「開始此段」啟動', 'Press Start interval'), 24, 507, 316, 2);
    D.round(ctx, 370, 72, 560, 103, 12, C.panel);
    TEXT(ctx, D, P(`心搏：${s.heartCount}`, `Heartbeats: ${s.heartCount}`), 391, 114, 245, { size: 26 });
    TEXT(ctx, D, P(`脈搏：${s.pulseCount}`, `Pulse beats: ${s.pulseCount}`), 670, 114, 245, { size: 26 });
    TEXT(ctx, D, P('點按記錄自己聽到／摸到的一次', 'Tap once for each beat you hear / feel'), 391, 151, 518);
    const records = s.example ? { before: { heart: 72, pulse: 72 }, after: { heart: 112, pulse: 112 } } : s.records;
    const vals = [records.before?.heart, records.before?.pulse, records.after?.heart, records.after?.pulse];
    const names = [P('前心搏', 'Pre heart'), P('前脈搏', 'Pre pulse'), P('後心搏', 'Post heart'), P('後脈搏', 'Post pulse')];
    const peak = Math.max(120, ...vals.filter(v => Number.isFinite(v)));
    poly(ctx, [[390, 218], [390, 430], [920, 430]], C.muted, 2);
    for (let i = 0; i < 4; i++) {
      const x = 425 + i * 131, v = vals[i], height = Number.isFinite(v) ? v / peak * 170 : 0;
      if (height) D.round(ctx, x, 430 - height, 71, height, 5, i % 2 ? C.yellow : '#f2b7ad');
      TEXT(ctx, D, Number.isFinite(v) ? P(String(v), String(v)) : P('未記錄', '—'), x + 35, height ? 421 - height : 405, 103, { align: 'center' });
      TEXT(ctx, D, names[i], x + 35, 465, 121, { align: 'center' });
    }
    TEXT(ctx, D, s.example ? P('示範數據，非你的實測', 'Example data, not your measurement') : P('整分鐘紀錄：次／分鐘', 'Complete one-minute records: beats/min'), 391, 505, 518, { color: s.example ? C.yellow : C.ink });
    const wave = (Math.sin(t * Math.PI * 1.8) + 1) / 2;
    poly(ctx, [[392, 532], [915, 532]], C.wall, 12 + wave * 5);
    poly(ctx, [[392, 532], [915, 532]], '#ddbc8a', 8 + wave * 5);
    for (let i = 0; i < 12; i++) redCell(ctx, 398 + mod(t * 40 + i * 43, 508), 532, 4, .9);
    TEXT(ctx, D, P('動脈壁脈動模型：不是你的脈搏', 'Arterial pulse model: not your pulse'), 391, 557, 518);
    D.status(s.feedback || (active ? PROTOCOL.find(q => q.id === s.timer.kind).title : s.timer?.done ? P('實時計時完成', 'Real interval completed') : p.title));
  }
  function fishDraw(ctx, s, t, D) {
    board(ctx, D, P('魚尾血流：教學模擬，非實拍短片', 'Fish-tail flow: teaching model, not recorded footage'), P('魚類紅血球有核。此處只有血管局部；離心／回心依來源，不依螢幕左右。', 'Fish red cells have nuclei. Heart-relative flow is not defined by screen direction.'));
    imagePanel(ctx, D, 'fish_photo.png', 24, 72, 278, 186);
    lines(ctx, D, P('原圖是魚的照片；右邊的動態血流是獨立模型。', 'The original is a fish photograph. Moving flow on the right is a separate model.'), 24, 303, 278, 4);
    lines(ctx, D, P('教師示範；保持濕潤、安靜，觀察後迅速回水。', 'Teacher-led. Keep fish moist and calm; return promptly to water.'), 24, 449, 278, 4, C.yellow);
    D.round(ctx, 326, 72, 604, 478, 15, '#273f34');
    const arteries = [[356, 174], [887, 174]], veins = [[887, 427], [356, 427]];
    poly(ctx, arteries, C.wall, 38); poly(ctx, arteries, '#dcba8b', 29);
    poly(ctx, veins, C.wall, 47); poly(ctx, veins, '#dcba8b', 36);
    const branches = [454, 619, 791];
    const tracks = branches.map((x, i) => [[356, 174], [x, 174], [x, 246], [x + (i % 2 ? -16 : 16), 315], [x, 383], [x, 427], [356, 427]]);
    tracks.forEach(path => { poly(ctx, path.slice(1, 6), C.wall, 18); poly(ctx, path.slice(1, 6), '#dcba8b', 12); });
    tracks.forEach((path, j) => {
      for (let i = 0; i < 9; i++) {
        const u = mod(t * .072 * s.fishSpeed + i / 9 + j * .035, 1), p = pointOn(path, u, [1.6, 1.2, 2.0, 2.0, 1.2, 1.6]);
        redCell(ctx, p.x, p.y, p.segment > 0 && p.segment < 5 ? 6 : 8, p.y < 285 ? .85 : .35, p.angle, true);
      }
    });
    if (s.reveal) {
      TEXT(ctx, D, P('分支：小動脈', 'Branching: arteriole'), 348, 128, 552);
      TEXT(ctx, D, P('狹窄：微血管', 'Narrow: capillary'), 629, 308, 247, { align: 'center' });
      TEXT(ctx, D, P('匯流：小靜脈', 'Convergence: venule'), 348, 493, 552);
    } else {
      TEXT(ctx, D, P('從心臟方向來', 'From the heart'), 349, 128, 553);
      TEXT(ctx, D, P('回到心臟方向', 'Toward the heart'), 349, 493, 553);
    }
    D.hit(342, 147, 558, 57, 'fishVessel', 'artery'); D.hit(345, 395, 558, 62, 'fishVessel', 'vein');
    branches.forEach(x => D.hit(x - 27, 214, 54, 180, 'fishVessel', 'capillary'));
    const chosen = s.fishVessel === 'artery' ? [343, 142, 560, 64] : s.fishVessel === 'vein' ? [343, 391, 560, 71] : [588, 215, 68, 181];
    D.round(ctx, ...chosen, 12, 'rgba(253,224,71,.04)', C.yellow);
    D.status(s.reveal ? P('分支、交換、匯流；速度為教學趨勢', 'Branching, exchange, convergence; speeds are qualitative') : P('先追蹤一顆血球，再點血管找證據', 'Follow a cell, then select a vessel to inspect evidence'));
  }
  function experimentExplain(s) {
    if (s.view === 'fish') {
      const detail = {
        artery: P('選中的上方血管往外分支，血液來源接近心臟方向，因此模型把它標為小動脈。真實視野不一定也是上方或向右。', 'The selected upper vessel branches outward from a heart-side source, so the model identifies it as an arteriole. A real field need not have this orientation.'),
        capillary: P('選中的細血管接在分支與匯流之間；紅血球逐顆通過、較慢。魚的紅血球呈橢圓且有細胞核，不能直接套用人類紅血球的無核特徵。', 'The selected narrow vessel joins branching and convergence. Cells pass singly and more slowly. Fish red cells are oval and nucleated, unlike mature human red cells.'),
        vein: P('選中的下方血管收集各支路的血液，回程接往心臟方向，因此模型把它標為小靜脈。單看向左流並不能命名為靜脈。', 'The selected lower vessel collects the branches and returns toward the heart, so the model identifies it as a venule. Leftward movement alone cannot identify a vein.')
      }[s.fishVessel];
      return { title: P('追蹤血球，看分流與匯流', 'Track cells to observe branching and convergence'), text: P(detail[0] + '\n\n' + CONTENT[5].paragraphs[5][0], detail[1] + '\n\n' + CONTENT[5].paragraphs[5][1]) };
    }
    const timerInfo = P('實時計時以開始時的時間戳記為準；畫面暫停或換頁後再回來，會依實際經過時間結算。不使用示意動畫替你數脈搏。', 'Real intervals use the start timestamp. After screen pause or leaving the tab, elapsed real time is checked on return. Animation never counts your pulse for you.');
    return { title: PROTOCOL[s.stage].title, text: P(CONTENT[5].paragraphs[s.photo === 'sound' ? 1 : 0][0] + '\n\n' + timerInfo[0], CONTENT[5].paragraphs[s.photo === 'sound' ? 1 : 0][1] + '\n\n' + timerInfo[1]) };
  }

  const COMMON_CHECK = { width: 960, height: 600, bloodOxygenColours: ['#ef3e46', '#76232f'], blueBlood: false, redCellsCrossCapillaryWall: false, moleculeSymbolsSmallerThanCells: true };
  function tabMeta(i, handlers) {
    const p = CONTENT[i];
    return {
      id: p.id, title: p.main, sub: p.sub, hook: p.hook,
      body: p.lead,
      reading: P([...p.paragraphs.map(x => x[0]), p.question[0]].join('\n\n'), [...p.paragraphs.map(x => x[1]), p.question[1]].join('\n\n')),
      closure: p.closure, ...handlers
    };
  }
  const tabs = [
    tabMeta(0, {
      sources: [source('heart.png', P('人體心臟構造', 'Human heart anatomy'), 101, '3-13'), source('body_circulation.png', P('人體心血管系統', 'Human cardiovascular system'), 100, '3-12')],
      init: () => ({ running: true, part: 'lv', view: 'heart', beat: 0, auto: true }),
      controls: s => [
        group(P('原圖位置與構造', 'Original position and anatomy'), [item(P('心臟構造', 'Heart anatomy'), 'view', 'heart'), item(P('人體位置', 'Body position'), 'view', 'body')]),
        group(P('找腔室／構造', 'Find a chamber / structure'), CHAMBERS.map(c => item(c.name, 'part', c.id))),
        group(P('心搏拆慢看', 'Slow down one heartbeat'), [item(P('連續心搏', 'Continuous cycle'), 'action', 'auto'), ...PHASES.map((p, i) => item(p.name, 'phase', i))])
      ],
      act: (s, key, value) => {
        if (key === 'phase') { s.beat = Number(value); s.auto = false; s.running = true; }
        else if (key === 'action' && value === 'auto') { s.auto = true; s.running = true; }
        else { s[key] = value; if (key === 'part') s.view = 'heart'; }
      },
      explain: heartExplain, draw: heartDraw,
      check: s => ({ ...COMMON_CHECK, anatomicalLeftOnViewerRight: true, originalHeart: 'heart.png', fourChambers: CHAMBERS.slice(0, 4).map(c => c.id), valves: PHASES[Math.floor(s.beat)], valveChannelsBlockBackflow: true, septumCrossing: false })
    }),
    tabMeta(1, {
      sources: [source('vessel_atlas.png', P('動脈、微血管與靜脈構造', 'Artery, capillary and vein anatomy'), 102, '3-15'), source('vessel_photo.png', P('動靜脈光學切片', 'Optical artery / vein section'), 103, '3-16A'), source('capillary_micrograph.png', P('微血管光學影像', 'Optical capillary micrograph'), 103, '3-16B')],
      init: () => ({ running: true, view: 'atlas', vessel: 'artery', circuit: 'body', squeeze: false }),
      controls: s => [
        group(P('觀察證據', 'Observation evidence'), [item(P('構造原圖', 'Anatomy'), 'view', 'atlas'), item(P('動靜脈切片', 'Vessel section'), 'view', 'micrograph'), item(P('微血管顯微圖', 'Capillary micrograph'), 'view', 'capillary')]),
        group(P('定位／比較', 'Locate / compare'), [item(P('動脈', 'Artery'), 'vessel', 'artery'), item(P('微血管', 'Capillary'), 'vessel', 'capillary'), item(P('靜脈', 'Vein'), 'vessel', 'vein')]),
        group(P('流向與含氧量', 'Direction and oxygen'), [item(P('體循環', 'Systemic'), 'circuit', 'body'), item(P('肺循環', 'Pulmonary'), 'circuit', 'lung'), item(P('肌肉協助回流', 'Muscle-assisted return'), 'squeeze', !s.squeeze)])
      ],
      explain: s => ({ title: s.vessel === 'artery' ? P('動脈：離心', 'Artery: away from heart') : s.vessel === 'vein' ? P('靜脈：回心', 'Vein: toward heart') : P('微血管：交換', 'Capillary: exchange'), text: VESSEL_TEXT[s.vessel] }),
      draw: vesselsDraw,
      check: s => ({ ...COMMON_CHECK, circuit: s.circuit, arteryDefinition: 'away from heart', veinDefinition: 'toward heart', capillaryFlowSlower: true, allBranchesJoined: true, arteryOxygen: s.circuit === 'lung' ? 'poor' : 'rich', veinOxygen: s.circuit === 'lung' ? 'rich' : 'poor' })
    }),
    tabMeta(2, {
      sources: [source('blood_vessel.png', P('血液成分剖面示意', 'Blood components illustration'), 104, '3-17'), source('blood_smear.png', P('光學血抹片', 'Optical blood smear'), 104, '3-18'), source('blood_electron_original.png', P('著色電子顯微影像', 'Colourised electron micrograph'), 105, '3-19')],
      init: () => ({ running: true, component: 'rbc', view: 'smear', task: 'flow', separation: 0, targetSeparation: 0, repair: 0 }),
      controls: s => [
        group(P('血液成分', 'Blood components'), COMPONENTS.map(c => item(c.name, 'component', c.id))),
        group(P('觀察與操作', 'Observe and explore'), [item(P('血液運輸', 'Transport'), 'task', 'flow'), item(P('離心分層', 'Centrifugation'), 'action', 'separate'), item(P('混合狀態', 'Mixed sample'), 'action', 'mix'), item(P('局部止血', 'Local clotting'), 'action', 'repair')]),
        group(P('影像證據', 'Image evidence'), [item(P('原圖全貌', 'Original overview'), 'view', 'smear'), item(P('血球區域放大', 'Enlarge cell region'), 'view', 'focus'), item(P('著色電子', 'Colourised electron'), 'view', 'em')])
      ],
      act: (s, key, value) => {
        if (key === 'action') {
          if (value === 'separate' || value === 'mix') { s.task = 'separate'; s.targetSeparation = value === 'separate' ? 1 : 0; }
          if (value === 'repair') { s.task = 'repair'; s.repair = 0; s.component = 'platelet'; }
        } else s[key] = value;
      },
      explain: s => {
        const c = COMPONENTS.find(x => x.id === s.component) || COMPONENTS[0];
        return { title: c.name, text: s.task === 'separate' ? P(c.text[0] + '\n\n' + CONTENT[2].paragraphs[0][0], c.text[1] + '\n\n' + CONTENT[2].paragraphs[0][1]) : c.text };
      }, draw: bloodDraw,
      check: () => ({ ...COMMON_CHECK, matureHumanRbcNucleus: false, whiteCellNucleus: true, plateletCellFragment: true, approximatePlasmaFraction: .55, approximateFormedFraction: .45, imageryIsStainedOrColourised: true, simulatedCountsAreNotLabValues: true, electronMicrographVerified: true })
    }),
    tabMeta(3, {
      sources: [source('heart.png', P('人體心臟構造', 'Human heart anatomy'), 101, '3-13'), source('body_circulation.png', P('人體心血管位置', 'Human cardiovascular anatomy'), 100, '3-12'), source('tissue_gas.png', P('組織氣體交換原圖', 'Original tissue gas exchange'), 107, '3-21'), source('lung_gas.png', P('肺部氣體交換原圖', 'Original lung gas exchange'), 107, '3-22')],
      init: () => ({ running: true, travel: 0, speed: 1, view: 'loop' }),
      controls: s => [
        group(P('看完整／放大', 'Complete circuit / enlarge'), [item(P('完整封閉路線', 'Complete closed circuit'), 'view', 'loop'), item(P('組織交換窗', 'Tissue exchange'), 'view', 'body'), item(P('肺部交換窗', 'Lung exchange'), 'view', 'lung')]),
        group(P('從這一站開始追蹤', 'Track from this station'), [0, 2, 4, 5, 7, 9].map(i => item(STATIONS[i].name, 'station', i))),
        group(P('講解速度', 'Teaching speed'), [item(P('慢速', 'Slow'), 'speed', .5), item(P('標準', 'Standard'), 'speed', 1), item(P('下一站', 'Next station'), 'action', 'next')])
      ],
      act: (s, key, value) => {
        if (key === 'station') { s.travel = mod(Number(value), 10); s.view = 'loop'; s.running = false; }
        else if (key === 'action' && value === 'next') { s.travel = mod(Math.floor(s.travel) + 1, 10); s.view = 'loop'; s.running = false; }
        else s[key] = value;
      }, explain: circulationExplain, draw: circulationDraw,
      check: s => ({ ...COMMON_CHECK, closed: LOOP[0][0] === LOOP[10][0] && LOOP[0][1] === LOOP[10][1], route: [...STATIONS.map(x => x.id), 'lv'], currentStation: STATIONS[Math.floor(mod(s.travel, 10))].id, start: 'lv', end: 'lv', lungVisitsPerCircuit: 1, heartPassagesPerCircuit: 2, co2MostlyPlasmaBicarbonate: true, oxygenAtLeftVentricle: loopOxygen(0), oxygenAtRightVentricle: loopOxygen(5), oxygenAtPulmonaryVein: loopOxygen(8) })
    }),
    tabMeta(4, {
      sources: [source('lymph_body.png', P('人體淋巴系統', 'Human lymphatic system'), 108, '3-23A')],
      init: () => ({ running: true, compartment: 'tissue', movement: 'rest' }),
      controls: s => [
        group(P('追蹤液體所在位置', 'Follow the fluid compartment'), Object.entries(LYMPH_EXPLAIN).map(([k, v]) => item(v.title, 'compartment', k))),
        group(P('比較回流', 'Compare return'), [item(P('安靜時', 'At rest'), 'movement', 'rest'), item(P('肌肉活動協助', 'Muscle movement helps'), 'movement', 'active')])
      ], explain: s => LYMPH_EXPLAIN[s.compartment], draw: lymphDraw,
      check: () => ({ ...COMMON_CHECK, namesByCompartment: ['plasma', 'tissue fluid', 'lymph'], bothReturnPaths: true, returnTo: 'veins near base of neck', lymphHeart: false, lymphDirection: 'one way', greenIsSchematic: true, fixedRecoveryFractions: false })
    }),
    tabMeta(5, {
      sources: [source('stethoscope_photo.png', P('心音探測照片', 'Heart-sound observation photograph'), 110, '實驗 3-3-1'), source('pulse_photo.png', P('脈搏探測照片', 'Pulse observation photograph'), 110, '實驗 3-3-1'), source('fish_photo.png', P('魚的原照片，非血流短片', 'Original fish photograph, not flow footage'), 112, '實驗 3-3-2')],
      init: () => ({ running: true, view: 'pulse', photo: 'pulse', stage: 0, timer: null, heartCount: 0, pulseCount: 0, records: {}, entryHeart: 0, entryPulse: 0, example: false, feedback: null, fishSpeed: 1, fishVessel: 'capillary', reveal: false }),
      controls: s => {
        const mode = group(P('實驗', 'Experiment'), [item(P('心音／脈搏紀錄', 'Heart / pulse records'), 'view', 'pulse'), item(P('魚尾血流模擬', 'Fish-tail flow model'), 'view', 'fish')]);
        if (s.view === 'fish') return [mode,
          group(P('觀察與追蹤', 'Observe and track'), [item(P('小動脈', 'Arteriole'), 'fishVessel', 'artery'), item(P('微血管', 'Capillary'), 'fishVessel', 'capillary'), item(P('小靜脈', 'Venule'), 'fishVessel', 'vein'), item(s.reveal ? P('隱藏名稱', 'Hide names') : P('顯示名稱', 'Reveal names'), 'reveal', !s.reveal)]),
          group(P('觀察速度', 'Observation speed'), [item(P('慢速追一顆', 'Slow cell tracking'), 'fishSpeed', .4), item(P('標準', 'Standard'), 'fishSpeed', 1)])];
        const result = [mode,
          group(P('課本流程／實時計時', 'Textbook protocol / real timer'), PROTOCOL.map((p, i) => item(p.title, 'stage', i))),
          group(P('開始此段與計數', 'Start interval and count'), [item(P('開始此段', 'Start interval'), 'action', 'start'), item(P('心搏 +1', 'Heartbeat +1'), 'action', 'heart'), item(P('脈搏 +1', 'Pulse +1'), 'action', 'pulse')]),
          group(P('手動整分鐘紀錄', 'Enter a full-minute record'), [item(P('心搏次數', 'Heartbeat count'), 'entryHeart', s.entryHeart, { type: 'number', min: 0, max: 240, step: 1 }), item(P('脈搏次數', 'Pulse count'), 'entryPulse', s.entryPulse, { type: 'number', min: 0, max: 240, step: 1 }), item(P('存紙本紀錄', 'Save paper record'), 'action', 'paper')]),
          group(P('觀察／範例', 'Observation / example'), [item(P('觸摸脈搏', 'Feel pulse'), 'photo', 'pulse'), item(P('聽心音', 'Heart sounds'), 'photo', 'sound'), item(s.example ? P('回實測', 'Real records') : P('看示範數據', 'Example data'), 'action', 'example')])
        ];
        return result;
      }, act: experimentAct, explain: experimentExplain, draw: experimentDraw,
      check: s => ({ ...COMMON_CHECK, protocolSeconds: PROTOCOL.map(p => p.seconds), timerClock: 'Date.now', oneLubDubPairOneCycle: true, pulseFingers: ['index', 'middle'], simulatedFlowLabelled: true, realFishVideoAvailable: false, fishRbcNucleus: true, observationsSeparateFromExamples: true, teacherLedFishDemonstration: true, records: s.records })
    })
  ];

  if (!root.LivingBook || typeof root.LivingBook.register !== 'function') throw new Error('Human transport requires the LivingBook framework.');
  root.LivingBook.register({
    id: 'human', section: '4-3', title: P('人體內物質的運輸', 'Transport in the human body'),
    subtitle: P('心臟、血管、血液、淋巴與兩個觀察實驗', 'Heart, vessels, blood, lymph and two observation experiments'),
    cover: 'assets/covers/biology_human_1008_v1.png', tabs,
    scienceSources: RESEARCH, reviewNotes: P('供老師晨間檢閱的第一稿；魚尾血流為教學模擬，尚無實拍短片。所有使用原圖均經目視核對。', 'First draft for morning teacher review; fish-tail flow is a teaching model and no live footage is supplied. Every original used was visually verified.')
  });
})(globalThis);
