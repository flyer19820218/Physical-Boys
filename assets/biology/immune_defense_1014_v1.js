/* Human defense · teacher-requested cartoon remake, 2026-10-14.
 * Same lesson text and controls as immune_defense_1008_v1.js, but every
 * picture is an original cute Canvas cartoon drawn here (no textbook or AI
 * raster artwork). Internal animation coordinates and curve values are
 * schematic; they are not measured biological times or antibody titres.
 * LivingBook register API, pure Canvas 960 x 600; no DOM or shared-file mutation.
 */
(function (root) {
  'use strict';

  const bi = (zh, en) => [zh, en];
  const C = Object.freeze({
    bg: '#11261f', panel: '#1c3d34', deep: '#0b1a15', white: '#f2ecd9',
    muted: '#b9d5c9', teal: '#55e9ff', yellow: '#fde047', orange: '#fb923c',
    pink: '#f472b6', green: '#4ade80', red: '#e78585', purple: '#c4a7ed',
    skin: '#c8a27b', epithelial: '#a58262', blood: '#b64d50'
  });
  const sources = [
    { id: 'barriers', title: bi('免疫生物學：身體的第一線防禦', 'Immunobiology: The front line of host defense'), url: 'https://www.ncbi.nlm.nih.gov/books/NBK27105/' },
    { id: 'phagocytes', title: bi('細胞分子生物學：先天免疫與吞噬', 'Molecular Biology of the Cell: Innate Immunity'), url: 'https://www.ncbi.nlm.nih.gov/books/NBK26846/' },
    { id: 'binding', title: bi('免疫生物學：抗體與特定抗原的結合', 'Immunobiology: Antibody interaction with specific antigen'), url: 'https://www.ncbi.nlm.nih.gov/books/NBK27160/' },
    { id: 'antibodies', title: bi('細胞分子生物學：抗體與兩個相同的結合部位', 'Molecular Biology of the Cell: B Cells and Antibodies'), url: 'https://www.ncbi.nlm.nih.gov/books/NBK26884/' },
    { id: 'vaccine', title: bi('美國 CDC：疫苗與免疫記憶原理', 'CDC Pink Book: Principles of Vaccination'), url: 'https://www.cdc.gov/pinkbook/hcp/table-of-contents/chapter-1-principles-of-vaccination.html' },
    { id: 'who', title: bi('世界衛生組織：疫苗如何作用', 'WHO: How do vaccines work?'), url: 'https://www.who.int/news-room/feature-stories/detail/how-do-vaccines-work' }
  ];

  const content = [
    {
      id: 'barrier', title: bi('病原體，先擋在外面', 'Keep pathogens outside'), subtitle: bi('皮膚與黏膜的屏障', 'Skin and mucosal barriers'),
      hook: bi('細菌每天碰到我們，為什麼不是每次都能進入身體？先找出「接觸」和「進入組織」之間的那一道界線。', 'Bacteria contact us every day. Why do they not enter every time? Find the boundary between contact and entry into tissue.'),
      paragraphs: [
        bi('能引起疾病的微生物等稱為病原體，例如某些細菌與病毒。接觸病原體不等於已經感染；病原體還需要在合適部位附著、增殖或越過屏障。不是所有微生物都會致病。', 'Pathogens are agents that can cause disease, including some bacteria and viruses. Contact alone does not mean infection: a pathogen must establish itself at a suitable site, multiply, or cross a barrier. Not all microbes cause disease.'),
        bi('皮膚覆蓋體表，多層緊密排列的細胞形成物理屏障。黏膜則位在眼部及呼吸道、消化道等與外界相通部位的內襯；它不是「皮膚破了才出現的膜」。', 'Skin covers the body surface; its closely packed layers form a physical barrier. Mucosa lines sites open to the outside, such as the eyes, airways and digestive tract. It is not a membrane that appears only when skin breaks.'),
        bi('屏障也有化學與清除作用。呼吸道黏液可黏住顆粒，纖毛協助把黏液移向咽部；胃酸與部分消化酵素能抑制或破壞許多隨食物進入的病原體。這些作用降低風險，但不是保證擋住所有病原體。', 'Barriers also use chemicals and clearance. Airway mucus traps particles, and cilia move it toward the throat. Gastric acid and some digestive enzymes inhibit or damage many ingested pathogens. These defenses reduce risk but do not stop every pathogen.')
      ],
      instructions: bi('切換完整皮膚、局部破損與呼吸道黏膜，再播放或逐步觀察。比較病原體停在哪一側、靠什麼攔截或移走。', 'Select intact skin, a local break, or airway mucosa. Play or step through the model. Compare which side retains the microbe and what blocks or removes it.'),
      closure: bi('第一道防線的重點是「阻隔與清除」。局部受損會增加進入組織的機會，並啟動後續防禦；黏膜入口本身也有屏障，不是毫無防備的洞。', 'The first line blocks entry and clears material. A local break can allow tissue entry and trigger further defenses. A mucosal entrance also has barriers; it is not an undefended hole.'),
      supplemental: bi('觀察界線：氣管與支氣管的纖毛示意，不代表所有黏膜都有纖毛。圖中的細胞與病原體經過放大，不能用畫面大小比較真實尺寸。', 'Model boundary: cilia represent the trachea and bronchi, not every mucosal surface. Cells and microbes are enlarged; their displayed sizes cannot be used to compare real dimensions.'),
      sourceIds: ['barriers', 'who'], figure: '3-25', page: 114
    },
    {
      id: 'phagocytosis', title: bi('傷口裡，白血球正在做什麼？', 'What do white blood cells do at a wound?'), subtitle: bi('移出血管與吞噬', 'Leaving vessels and engulfing microbes'),
      hook: bi('第一道防線破了，援軍從哪裡趕來？白血球會把病原體直接撞不見，還是要先包進細胞裡？', 'When the first barrier breaks, where does help come from? Does a white blood cell make a microbe vanish on contact, or first enclose it inside the cell?'),
      paragraphs: [
        bi('某些白血球具有吞噬能力。組織中原本就有能吞噬的細胞，感染或受傷時，血液中的部分白血球也會被招募，穿越血管壁移到需要防禦的部位。', 'Some white blood cells can phagocytose. Phagocytes already reside in tissues; during infection or injury, additional white blood cells can be recruited from blood and cross the vessel wall to the affected site.'),
        bi('吞噬包含接近與辨識、細胞膜伸出包圍目標、形成包住目標的小囊，再由細胞內的分解作用處理。病原體先被完整包入，之後才被分解，不會在接觸的瞬間憑空消失。', 'Phagocytosis involves approaching and recognizing a target, extending membrane around it, enclosing it in a vesicle, and breaking it down inside the cell. Engulfment comes before degradation; the target does not disappear instantly on contact.'),
        bi('這屬於非專一性防禦：不必先為本次目標產生一種專用抗體，便可處理多種目標。「非專一性」不是完全不辨識，也不是每種白血球都用吞噬的方式工作。', 'This is an innate, nonspecific defense: it can act against many targets without first making an antibody dedicated to this encounter. Nonspecific does not mean no recognition, and not all white blood cells work by phagocytosis.')
      ],
      instructions: bi('先看血管內的白血球，再逐步前進到移出、靠近、包圍、吞入與分解。暫停在「包圍」和「吞入」兩格，比較病原體是否已與外界隔開。', 'Follow the white blood cell from the vessel through exit, approach, enclosure, engulfment and degradation. Pause at enclosure and engulfment to compare whether the target is sealed off from the outside.'),
      closure: bi('吞噬是一個有順序的細胞過程。會移出血管的是被招募的白血球；本模型中的正常紅血球持續留在血管腔內，負責運輸。', 'Phagocytosis is an ordered cellular process. Recruited white blood cells can leave the vessel; normal red blood cells in this model remain in its lumen and carry materials.'),
      supplemental: bi('補充：吞噬囊與溶體合作分解目標。圖中只追蹤一個示範細胞；實際傷口有多種細胞協同參與，且部分病原體能逃避免疫作用。動畫步數不是生理時間。', 'Further reading: phagosomes and lysosomes cooperate in degradation. One demonstration cell is followed here; real wounds involve several cell types, and some pathogens evade defenses. Animation steps are not biological time.'),
      sourceIds: ['phagocytes', 'barriers'], figure: '3-26', page: 115
    },
    {
      id: 'inflammation', title: bi('紅腫熱痛，圖上看原因', 'Trace redness, swelling, warmth and pain'), subtitle: bi('發炎的局部變化', 'Local changes in inflammation'),
      hook: bi('傷口周圍為什麼會紅、熱、腫、痛？請把每個現象連回血管或組織的變化，別只背四個字。', 'Why can a wound become red, warm, swollen and painful? Connect each sign to a vascular or tissue change instead of memorizing four words.'),
      paragraphs: [
        bi('發炎是組織對感染或損傷的反應，可協助免疫細胞與防禦物質抵達局部。它可以和吞噬互相配合，不是白血球吞完之後才開始的另一場活動。', 'Inflammation is a tissue response to infection or injury. It helps immune cells and defensive substances reach a site and can cooperate with phagocytosis; it is not a separate activity that starts only after engulfment.'),
        bi('局部血管擴張，流到該處的血液增加，常造成紅與熱。血管壁通透性增加，使更多液體與部分血漿蛋白進入周圍組織，造成腫；化學訊號與組織壓力等可刺激疼痛。', 'Local vessel dilation increases blood delivery, often causing redness and warmth. Increased permeability lets more fluid and some plasma proteins enter surrounding tissue, causing swelling. Chemical signals and tissue pressure can contribute to pain.'),
        bi('白血球在訊號引導下聚集並移到組織，協助處理入侵者與損傷。發炎有防禦功能，但過強或持續的反應也可能傷害組織；紅腫熱痛並不表示「一定有細菌」，也不等於必須自行用藥。', 'Signals recruit white blood cells into tissues to help handle invaders and injury. Inflammation is protective, but excessive or persistent responses can damage tissue. These signs do not prove a bacterial infection or determine a treatment.')
      ],
      instructions: bi('先觀察平常狀態，再分別切換血管擴張、通透性增加與白血球聚集；最後看整合狀態。點選紅／熱／腫／痛，對照下方原因說明。', 'Start with baseline, then select dilation, increased permeability and cell recruitment separately before viewing them together. Select redness, warmth, swelling or pain to read the associated mechanism.'),
      closure: bi('紅與熱看血流，腫看組織液累積，痛看局部刺激；發炎的意義是協調防禦，不是四種症狀越強就越有效。', 'Link redness and warmth to blood delivery, swelling to tissue-fluid accumulation, and pain to local stimulation. Inflammation coordinates defense; stronger symptoms do not necessarily mean better protection.'),
      supplemental: bi('模型把機制拆開比較，實際上它們常重疊發生。藍色小滴只代表滲出的液體，不是紅血球，也不是實際水分子的尺寸；紅血球不會因一般發炎而一起穿出。', 'The model separates mechanisms for comparison, although they overlap in life. Blue droplets represent escaping fluid, not red blood cells or water molecules at true scale. Ordinary inflammatory permeability does not make red blood cells leave together.'),
      sourceIds: ['barriers', 'phagocytes'], figure: '3-26', page: 115
    },
    {
      id: 'antibody', title: bi('防禦也會認得對手', 'Defense can recognize its target'), subtitle: bi('抗原與抗體的專一性', 'Antigen–antibody specificity'),
      hook: bi('同一把鑰匙能打開所有鎖嗎？看看抗體末端的結合部位，和病原體表面哪一小塊能接得起來。', 'Can one key open every lock? Compare the antibody tip with the small surface feature on a pathogen that it can bind.'),
      paragraphs: [
        bi('專一性防禦由特定種類的白血球等共同參與。有的能處理被感染的細胞，有的能產生抗體；抗體本身是蛋白質，不是一顆白血球。', 'Specific defenses involve particular white blood cells and other components. Some act on infected cells; others produce antibodies. An antibody is a protein, not a white blood cell.'),
        bi('抗體辨識抗原上的特定部位。這裡用凹槽與凸起的形狀互補來表示專一性：要看的是表面的一小塊，不是整個病原體的外形；相同的病原體也可能具有多種不同抗原部位。', 'An antibody recognizes a specific site on an antigen. Complementary pockets and protrusions represent specificity here. The target is a small surface site, not the overall outline of the microbe. One pathogen can carry several different antigenic sites.'),
        bi('相容的抗體結合後，可阻礙部分病原體或毒素的作用，或把目標標記成更容易被其他免疫機制清除。結合不等於瞬間治癒，也不保證每個已結合的目標都立即失去感染能力。', 'Compatible binding can block some pathogen or toxin activities, or mark a target for removal by other immune mechanisms. Binding is not instant recovery and does not mean every bound target immediately loses its ability to infect.')
      ],
      instructions: bi('先選病原體表面的抗原形狀，再選抗體結合凹槽，按「嘗試結合」。相容時停下看目標仍在；再前進一段，觀察吞噬細胞如何協助處理。也試一次不相容的組合。', 'Choose a pathogen-surface antigen profile and an antibody pocket, then try binding. For a compatible pair, pause to see that the target still exists, then advance to phagocyte assistance. Also try an incompatible combination.'),
      closure: bi('專一性發生在「認得並結合」的層次。抗體與吞噬等作用可以合作；把對手標記起來，並不是讓整個病原體魔法般消失。', 'Specificity operates at recognition and binding. Antibodies can cooperate with phagocytosis and other defenses. Marking a target does not make a whole pathogen magically vanish.'),
      supplemental: bi('補充：B 細胞活化後可分化為分泌抗體的漿細胞與記憶細胞；部分 T 細胞參與處理受感染細胞。此頁用常見 Y 形抗體作示意，兩端結合部位相同；真實結合也取決於化學性質與三維構形，不是只比平面形狀。', 'Further reading: activated B cells can give rise to antibody-secreting plasma cells and memory cells; some T cells act on infected cells. A familiar Y-shaped antibody with identical tips is shown. Real binding also depends on chemistry and three-dimensional structure, not only a flat outline.'),
      sourceIds: ['binding', 'antibodies'], figure: '3-27', page: 116
    },
    {
      id: 'memory', title: bi('疫苗，讓身體先練習', 'Vaccines prepare immune memory'), subtitle: bi('相同目標與不同目標', 'Same target versus a different target'),
      hook: bi('先認識過甲，再遇到甲，可能反應更快；可是換成乙，也能直接套用嗎？用同一張圖比較三種情境。', 'Prior exposure to A may prepare a faster response to A. Does it transfer directly to B? Compare all three situations on the same graph.'),
      paragraphs: [
        bi('初次遇到某抗原時，對應的專一性反應需要建立。之後若留下對應免疫記憶，再次遇到相同或可被辨識的目標，通常能更快產生較強的對應反應。', 'At a first encounter with an antigen, the corresponding specific response must develop. If matching immune memory remains, encountering the same or a recognized target again generally permits a faster, stronger corresponding response.'),
        bi('疫苗讓身體接觸設計好的抗原，或產生該抗原的資訊，來建立對應防禦與記憶。不是把抗體當成萬能藥打進去，也不是每種疫苗都含完整活病原體；形成防禦仍需要時間。', 'Vaccines expose the body to selected antigens, or information that enables their production, to build corresponding defenses and memory. They are not injections of a universal antibody, and not all contain whole live pathogens. Developing protection still takes time.'),
        bi('本模型把甲與乙設定為抗原明顯不同、沒有可直接利用的對應記憶。甲的記憶不會自動成為乙的記憶；真實相似抗原可能有交叉反應，但不能因此說「打過一種疫苗就對所有疾病都有同樣保護」。', 'Here A and B have clearly distinct antigens and no matching memory that transfers directly. Memory of A does not automatically become memory of B. Similar real antigens may cross-react, but one vaccine does not give equal protection against all diseases.')
      ],
      instructions: bi('切換「初次遇甲」、「已有甲的記憶，再遇甲」與「已有甲的記憶，改遇乙」。播放曲線或沿相對時間線前進，比較反應何時開始、對應哪一個目標；虛線保留初次反應作參考。', 'Compare first encounter with A, A again with memory of A, and B with memory only of A. Play or move along the relative timeline and compare the onset and target of the response. A dashed primary-response curve remains as reference.'),
      closure: bi('疫苗運用專一性與記憶性來降低相應疾病風險。效果與持續時間因疫苗、病原體與個人狀態而異；有記憶不代表永不感染，曲線較高也不是保護率。', 'Vaccines use specificity and memory to reduce the risk from a corresponding disease. Effects and duration vary with the vaccine, pathogen and individual. Memory does not guarantee no infection, and a higher curve is not a protection percentage.'),
      supplemental: bi('讀圖提醒：縱軸是對本次目標的相對專一性反應，橫軸是接觸後時間的先後。所有曲線均為定性示意，沒有實測天數、抗體濃度或安全門檻。抗體量下降時，記憶細胞仍可能存在；這不是個人的檢驗結果。', 'Graph guide: the vertical axis is relative specific response to the current target, and the horizontal axis shows order after exposure. Curves are qualitative, with no measured days, antibody titres or protection thresholds. Memory cells may remain as antibodies decline; this is not an individual test result.'),
      sourceIds: ['vaccine', 'who'], figure: '3-28', page: 117
    }
  ];

  const barrierCaptions = {
    intact: [
      bi('病原體接觸體表。多層排列的皮膚細胞位在外界與組織之間，先比較它在哪一側。', 'A microbe contacts the surface. Layers of skin cells separate the outside from tissue; identify which side contains it.'),
      bi('本示範的病原體停在完整屏障外側，沒有穿進組織。完整皮膚能阻隔許多病原體，但這不是對所有病原體的絕對保證。', 'The example microbe remains outside the intact barrier without entering tissue. Intact skin blocks many pathogens, but this is not an absolute guarantee for every agent.')
    ],
    wound: [
      bi('只在局部畫出真正的缺口，其餘皮膚仍完整。先預測病原體能從哪裡進入。', 'A real local opening is shown while the rest of the skin remains intact. Predict the route of entry.'),
      bi('病原體經缺口進入組織，並不是穿透旁邊完整的皮膚。進入增加感染機會，不代表所有接觸傷口的病原體都必然造成疾病。', 'The microbe enters tissue through the break, not through adjacent intact skin. Entry increases opportunity for infection but does not mean every wound contact inevitably causes disease.')
    ],
    mucosa: [
      bi('這是呼吸道內襯的放大示意。黏膜細胞上方有黏液，纖毛伸入黏液層；鼻子到呼吸道並不是一路毫無阻擋。', 'This enlarged airway lining shows mucus above epithelial cells and cilia reaching into it. An airway entrance is not an unobstructed route into tissues.'),
      bi('顆粒黏在黏液裡，隨黏液向咽部移動。纖毛的作用是清除運送，不是把病原體打碎；黏膜內襯仍把管腔與組織分開。', 'A trapped particle moves with mucus toward the throat. Cilia transport material rather than smashing it, while the lining still separates the lumen from tissue.')
    ]
  };
  const phagoSteps = [
    [bi('組織出現入侵目標', 'A target is present in tissue'), bi('上方是傷口與病原體，下方是微血管。組織中的吞噬細胞可以先反應，血液也能帶來額外白血球；這裡追蹤其中一個被招募的細胞。', 'The wound and target are above a small vessel. Resident phagocytes may react first, and blood can bring additional white blood cells. One recruited cell is followed here.')],
    [bi('白血球移出血管', 'A white blood cell leaves the vessel'), bi('白血球變形穿越血管壁，往局部組織移動；它不是從傷口外面跑進來。紅血球繼續留在血管腔內，沒有跟著穿出。', 'The white blood cell deforms as it crosses the vessel wall into tissue. It does not arrive from outside through the wound. Red blood cells remain in the vessel lumen.')],
    [bi('接近並辨識目標', 'Approach and recognize'), bi('局部訊號引導吞噬細胞靠近目標。接近還不是吞噬：病原體此時仍在細胞外，沒有被細胞膜完整包住。', 'Local signals guide the phagocyte toward the target. Approach is not engulfment: the microbe is still outside and not yet enclosed by membrane.')],
    [bi('細胞膜伸出包圍', 'Membrane extends around the target'), bi('細胞膜向外伸出並逐漸包圍病原體。注意開口尚未閉合，目標仍與外界相通；這不是細胞畫一個洞讓它直接穿過。', 'Membrane extends around the microbe. The opening is not yet sealed, so the target remains connected to the outside. It is not simply passing through a hole in the cell.')],
    [bi('閉合形成吞噬囊', 'Seal the phagosome'), bi('膜閉合，把病原體包在細胞內的小囊裡。此時目標已被吞入，但仍可看見完整形狀；「被吞入」和「已分解」是不同階段。', 'The membrane closes and encloses the microbe in an internal vesicle. Its intact form is still visible. Being engulfed and being degraded are different stages.')],
    [bi('在囊內分解', 'Break down inside the vesicle'), bi('吞噬囊與細胞內分解系統合作，目標在囊內逐步分解成碎片。分解發生在細胞內，不是抗體碰一下或白血球撞一下便立刻治好。', 'The vesicle cooperates with intracellular degradation machinery to break the target into fragments. This happens inside the cell, not as an instant cure after a collision or antibody contact.')]
  ];
  const inflammationModes = [
    [bi('平常狀態', 'Baseline'), bi('血管內有紅血球與白血球，周圍組織液維持一般狀態。本圖先建立比較基準，沒有設定發炎時的額外滲出。', 'Red and white cells lie in the vessel, with surrounding tissue fluid at baseline. This establishes a comparison without the added inflammatory leakage.')],
    [bi('血管擴張', 'Vessel dilation'), bi('局部血管變寬、血液供應增加。紅與熱常與這個變化有關；這裡的熱指局部溫熱，不等於一定出現全身發燒。', 'Local vessels widen and blood delivery increases. Redness and warmth often follow. Warmth here means local heating, not inevitable whole-body fever.')],
    [bi('通透性增加', 'Increased permeability'), bi('更多液體及部分血漿蛋白能通過血管壁，周圍組織液累積，形成腫的趨勢。藍色滴代表液體，正常紅血球仍留在血管內。', 'More fluid and some plasma proteins cross the vessel wall, tending to accumulate in tissue and cause swelling. Blue drops represent fluid; normal red blood cells remain in the vessel.')],
    [bi('白血球聚集', 'White-cell recruitment'), bi('白血球受到訊號引導，在血管壁停留、變形移出，往受損部位聚集。這能增加局部處理目標的細胞，不是白血球越多就保證越有效。', 'Signals guide white cells to adhere, deform and exit toward injury. This brings cells to the site, but more cells do not guarantee more effective protection.')],
    [bi('整合觀察', 'View the combined response'), bi('血流、通透性與細胞移動可以同時改變。組織訊號與壓力等可引起痛；本圖以位置標記表示刺激，不把疼痛畫成可測量的強度。', 'Blood delivery, permeability and cell movement can change together. Tissue signals and pressure may cause pain; a location marker indicates stimulation, not a measured pain score.')]
  ];
  const symptoms = [
    [bi('紅', 'Redness'), bi('局部血管擴張、血液供應增加，受影響區域可能看起來較紅。', 'Dilation and greater blood delivery may make the affected area appear redder.')],
    [bi('熱', 'Warmth'), bi('增加的血流把熱帶到局部，使傷口附近可能摸起來較溫熱。局部熱與全身發燒不能直接畫等號。', 'Increased blood delivery brings warmth to the site. Local warmth and systemic fever are not equivalent.')],
    [bi('腫', 'Swelling'), bi('通透性增加使更多液體與部分蛋白進入組織，局部液體累積造成腫脹。', 'Increased permeability permits additional fluid and some proteins to enter tissues, where accumulation causes swelling.')],
    [bi('痛', 'Pain'), bi('發炎化學訊號與腫脹造成的壓力等可刺激局部感覺。痛不是「病原體咬人」的證據，也不是可從這張圖算出的數字。', 'Inflammatory chemicals and pressure from swelling can stimulate local sensation. Pain does not show a microbe biting, and cannot be calculated from this diagram.')]
  ];

  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const mix = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
  const ease = t => { const q = clamp(t, 0, 1); return q * q * (3 - 2 * q); };
  const joinPairs = (pairs, sep = '\n\n') => bi(pairs.map(p => p[0]).join(sep), pairs.map(p => p[1]).join(sep));

  function round(ctx, x, y, w, h, r, fill, stroke) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function line(ctx, pts, color, width = 3, dash = []) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke(); ctx.restore();
  }
  function circle(ctx, x, y, radius, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function arrow(ctx, x1, y1, x2, y2, color) {
    line(ctx, [[x1, y1], [x2, y2]], color, 3);
    const a = Math.atan2(y2 - y1, x2 - x1), l = 12;
    line(ctx, [[x2 - l * Math.cos(a - 0.5), y2 - l * Math.sin(a - 0.5)], [x2, y2], [x2 - l * Math.cos(a + 0.5), y2 - l * Math.sin(a + 0.5)]], color, 3);
  }
  function textLines(ctx, value, x, y, width, size = 22, color = C.white, align = 'left') {
    ctx.save(); ctx.font = `600 ${size}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
    const words = /\s/.test(value) ? value.split(/\s+/) : Array.from(value);
    const sep = /\s/.test(value) ? ' ' : '';
    const lines = []; let current = '';
    words.forEach(word => {
      const next = current ? current + sep + word : word;
      if (current && ctx.measureText(next).width > width) { lines.push(current); current = word; }
      else current = next;
    });
    if (current) lines.push(current);
    lines.forEach((s, i) => ctx.fillText(s, x, y + i * size * 1.35));
    ctx.restore(); return lines.length * size * 1.35;
  }
  function fitText(ctx, value, availableWidth, floor = 22, preferred = 22) {
    let size = preferred;
    ctx.font = `600 ${size}px "Noto Sans TC", sans-serif`;
    while (size > floor && ctx.measureText(value).width > availableWidth) {
      size--; ctx.font = `600 ${size}px "Noto Sans TC", sans-serif`;
    }
    return size;
  }
  function background(ctx, width = 960, height = 600) {
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, width, height);
  }

  const profiles = [bi('三角凸起', 'Triangular projection'), bi('圓弧凸起', 'Rounded projection'), bi('方形凸起', 'Square projection')];
  const pockets = [bi('三角凹槽', 'Triangular pocket'), bi('圓弧凹槽', 'Rounded pocket'), bi('方形凹槽', 'Square pocket')];
  function shapePath(ctx, profile, x, y, half = 32, depth = 44) {
    ctx.moveTo(x - half, y);
    if (profile === 0) { ctx.lineTo(x, y + depth); ctx.lineTo(x + half, y); }
    else if (profile === 1) ctx.bezierCurveTo(x - half, y + depth * 1.34, x + half, y + depth * 1.34, x + half, y);
    else { ctx.lineTo(x - half, y + depth); ctx.lineTo(x + half, y + depth); ctx.lineTo(x + half, y); }
  }

  function compatible(s) { return Number(s.antigen) === Number(s.antibody); }
  function antibodyExplanation(s) {
    if (s.notice === 'needsBinding') return {
      title: bi('先完成相容結合', 'First establish compatible binding'),
      text: bi('請先選相容的抗原與抗體並嘗試結合。這個示範追蹤「抗體標記後協助吞噬」；不相容的抗體不能在此情境替目標做同樣標記，但吞噬本身並不一定需要抗體。', 'Choose a compatible antigen–antibody pair and try binding first. This demonstration follows antibody-assisted phagocytosis. An incompatible antibody cannot provide this matching tag here, although phagocytosis does not always require antibodies.')
    };
    if (!s.dock) return {
      title: bi('先比較凸起與凹槽', 'Compare the projection and pocket'),
      text: bi('左邊是一個 Y 形抗體，兩端結合部位相同；右邊獨立放大其中一端與抗原表面。改變任一形狀都會回到尚未結合，請試相容與不相容各一組。', 'The Y-shaped antibody on the left has two identical tips. The independent close-up on the right shows one tip and an antigen surface. Changing either profile returns to the unbound state. Test compatible and incompatible pairs.')
    };
    if (!compatible(s)) return {
      title: bi('不相容：不能建立這個結合', 'Incompatible: this pairing does not bind'),
      text: bi('末端靠近，但凹凸不互補，本示範不形成結合。病原體表面仍在，沒有被抗體「撞死」；實際抗體還需要相容的化學性質與立體構形。換一種結合凹槽再觀察。', 'The tip approaches, but these profiles are not complementary, so this model does not bind them. The target remains rather than being killed by collision. Real binding also requires compatible chemistry and three-dimensional structure. Try another pocket.')
    };
    return s.dock === 2 ? {
      title: bi('抗體標記後，仍需清除步驟', 'Tagging is followed by removal steps'),
      text: bi('目標帶著已結合的抗體，能協助吞噬細胞等辨識與處理。放大窗依序顯示膜包圍、形成囊與分解；這個示範是其中一條清除路徑，不表示每種抗體都保證立即清除。', 'Bound antibodies can help phagocytes and other mechanisms recognize and handle a target. The close-up shows membrane enclosure, vesicle formation and degradation. This is one removal route, not a guarantee that every antibody immediately clears its target.')
    } : {
      title: bi('相容：結合後，目標仍然存在', 'Compatible: the bound target still exists'),
      text: bi('凸起嵌入互補凹槽，表示這個抗體能結合此抗原部位。目標沒有消失；抗體可標記目標、協助清除，部分抗體也可阻礙感染或毒素作用。按「觀察協助清除」追蹤下一步。', 'The projection docks into a complementary pocket, representing binding to this antigenic site. The target has not disappeared. Antibodies can mark targets for removal, and some block infection or toxin action. Select assisted removal to follow the next step.')
    };
  }

  const memoryCases = [bi('初次遇甲', 'First encounter with A'), bi('有甲的記憶，再遇甲', 'Memory of A, then A again'), bi('有甲的記憶，改遇乙', 'Memory of A, then a different B')];
  const memoryCaptions = [
    bi('第一次對甲建立專一性反應需要過程。曲線先較低，再逐漸升高；這不是完全沒有任何防禦，前兩道防線仍可工作。', 'Developing the first specific response to A takes a process: the curve begins lower and rises later. This does not mean no defense at all; barriers and innate responses can still act.'),
    bi('已有與甲相符的免疫記憶，再遇甲時通常能更快建立較強的對應反應。記憶不是把時間變成零，也不是保證不感染；虛線是初次反應參考。', 'With matching memory of A, A again generally produces a faster, stronger corresponding response. Memory does not reduce response time to zero or guarantee no infection. The dashed curve is the first-response reference.'),
    bi('甲的記憶仍可能存在，但本例乙的抗原不同、不相符，因此不能直接套用成乙的較快記憶反應。此時看的是「對乙」的反應；不是身體失去甲的全部記憶。', 'Memory of A may remain, but B has a distinct, nonmatching antigen in this example. A\'s memory cannot simply become a faster memory response to B. The plotted response is to B, not the loss of all memory of A.')
  ];
  function primaryCurve(q) {
    if (q < 0.18) return 0.035;
    if (q < 0.58) return mix(0.035, 0.49, ease((q - 0.18) / 0.4));
    return mix(0.49, 0.26, ease((q - 0.58) / 0.42));
  }
  function recallCurve(q) {
    if (q < 0.055) return 0.075;
    if (q < 0.34) return mix(0.075, 0.91, ease((q - 0.055) / 0.285));
    return mix(0.91, 0.58, ease((q - 0.34) / 0.66));
  }
  function memoryProgress(s, t) {
    return s.moment === 'early' ? 0.22 : s.moment === 'later' ? 0.58 : s.moment === 'full' ? 1 : (t % 14) / 14;
  }

  // ── Original cartoon kit (2026-10-14). Everything below is drawn in code;
  // no textbook or AI raster artwork is used. Faces are decoration only:
  // white blood cells engulf with membrane, never with a mouth.
  const K = Object.freeze({
    ink: '#0b1a15', germ: '#34b8a7', germLight: '#8eeedd', germDark: '#1f8578',
    germB: '#e47ab5', germBLight: '#ffc0e1', germBDark: '#a8457f',
    wbcEdge: '#c3c9ec', nucleus: '#a68be0', nucleusEdge: '#7a5fbf',
    rbc: '#d8424b', rbcLight: '#f49189', rbcDark: '#8e2632',
    skinTop: '#f1d2ad', skin: '#dcac85', skinDeep: '#c79168', skinNucleus: '#a8785a',
    tissue: '#3b2c36', fiber: '#5f4553', lumen: '#5b1f2b', wall: '#cf7c82',
    mucus: 'rgba(124, 214, 172, 0.5)', mucusEdge: '#a6ecc8', drop: '#8fdcff', lyso: '#fb923c'
  });
  const TAU = Math.PI * 2;
  function blob(ctx, cx, cy, r, t, wobble = 0.04, n = 40) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, rr = r * (1 + wobble * Math.sin(a * 5 + t * 2.1) + wobble * 0.6 * Math.sin(a * 3 - t * 1.4));
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function eyes(ctx, x, y, s, mood = 'happy', look = [0, 0]) {
    const gap = s * 2.35;
    for (const side of [-1, 1]) {
      const ex = x + side * gap / 2;
      if (mood === 'dizzy') {
        line(ctx, [[ex - s * 0.65, y - s * 0.65], [ex + s * 0.65, y + s * 0.65]], K.ink, s * 0.4);
        line(ctx, [[ex + s * 0.65, y - s * 0.65], [ex - s * 0.65, y + s * 0.65]], K.ink, s * 0.4);
        continue;
      }
      if (mood === 'sleepy') {
        ctx.beginPath(); ctx.arc(ex, y - s * 0.2, s * 0.75, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = K.ink; ctx.lineWidth = s * 0.34; ctx.lineCap = 'round'; ctx.stroke();
        continue;
      }
      ellipse(ctx, ex, y, s * 0.86, s, '#fbfdfb');
      ctx.strokeStyle = K.ink; ctx.lineWidth = Math.max(1.6, s * 0.2); ctx.stroke();
      const pr = mood === 'surprised' ? s * 0.36 : s * 0.55;
      circle(ctx, ex + look[0] * s * 0.28, y + look[1] * s * 0.3, pr, K.ink);
      circle(ctx, ex + look[0] * s * 0.28 - pr * 0.35, y + look[1] * s * 0.3 - pr * 0.4, pr * 0.38, '#ffffff');
      const outer = ex + side * s * 1.05, inner = ex - side * s * 0.75;
      if (mood === 'determined' || mood === 'grumpy' || mood === 'smug') line(ctx, [[outer, y - s * 1.6], [inner, y - s * 1.12]], K.ink, s * 0.32);
      if (mood === 'worried') line(ctx, [[outer, y - s * 1.12], [inner, y - s * 1.62]], K.ink, s * 0.3);
    }
  }
  function mouth(ctx, x, y, w, mood = 'happy') {
    ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = Math.max(2, w * 0.2); ctx.lineCap = 'round';
    if (mood === 'surprised' || mood === 'dizzy') { ellipse(ctx, x, y, w * 0.32, w * 0.4, '#7a2d3a'); ctx.stroke(); }
    else if (mood === 'smug' || mood === 'grumpy') {
      ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - w * 0.05); ctx.quadraticCurveTo(x, y + w * (mood === 'smug' ? 0.7 : 0.15), x + w * 0.55, y - w * 0.18);
      ctx.closePath(); ctx.fillStyle = '#7a2d3a'; ctx.fill(); ctx.stroke();
      if (mood === 'smug') { ctx.fillStyle = '#fbfdfb'; ctx.fillRect(x - w * 0.3, y - w * 0.06, w * 0.6, w * 0.16); }
    } else if (mood === 'worried') {
      ctx.beginPath(); ctx.moveTo(x - w * 0.5, y); ctx.quadraticCurveTo(x - w * 0.25, y - w * 0.2, x, y); ctx.quadraticCurveTo(x + w * 0.25, y + w * 0.2, x + w * 0.5, y); ctx.stroke();
    } else if (mood === 'determined') {
      ctx.beginPath(); ctx.moveTo(x - w * 0.4, y); ctx.quadraticCurveTo(x, y + w * 0.18, x + w * 0.4, y - w * 0.04); ctx.stroke();
    } else { ctx.beginPath(); ctx.arc(x, y - w * 0.32, w * 0.55, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke(); }
    ctx.restore();
  }
  function blush(ctx, x, y, r) { ctx.save(); ctx.globalAlpha = 0.55; ellipse(ctx, x, y, r, r * 0.6, '#f59aa8'); ctx.restore(); }
  function sweat(ctx, x, y, s) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.75, y + s * 0.2, x, y + s * 0.6);
    ctx.quadraticCurveTo(x - s * 0.75, y + s * 0.2, x, y - s); ctx.fillStyle = K.drop; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  }
  function sparkle(ctx, x, y, s, color = C.yellow) {
    ctx.save(); ctx.translate(x, y); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.32 : s, a = i * Math.PI / 4 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function capsule(ctx, L, R) {
    ctx.beginPath(); ctx.moveTo(-L, -R); ctx.lineTo(L, -R); ctx.arc(L, 0, R, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-L, R); ctx.arc(-L, 0, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
  }
  // A rod-shaped bacterium. Teal keeps the unit's "pathogen" colour meaning.
  function germ(ctx, x, y, size = 24, o = {}) {
    const L = size * 1.15, R = size * 0.62, t = o.t || 0, b = o.kind === 'B';
    const body = b ? K.germB : K.germ, light = b ? K.germBLight : K.germLight, dark = b ? K.germBDark : K.germDark;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.angle || 0); if (o.flip) ctx.scale(-1, 1);
    if (o.tail !== false) {
      const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([-L - R * 0.7 - u * R * 2.6, Math.sin(u * 7 + t * 8) * R * 0.32 * u]); }
      line(ctx, pts, K.ink, Math.max(2.2, size * 0.16)); line(ctx, pts, dark, Math.max(1.2, size * 0.08));
    }
    for (let i = 0; i < 7; i++) {
      const a = -0.9 + i * 0.3, px = Math.cos(a) * L * 0.9, py = -R;
      line(ctx, [[px, py], [px + Math.cos(a - 1.4) * R * 0.3, py - R * 0.35]], dark, Math.max(1.4, size * 0.07));
    }
    if (o.antigen !== undefined) {
      // Antigen knobs on the surface: the shape matters for antibody binding.
      for (const kx of [-L * 0.75, 0, L * 0.75]) {
        ctx.beginPath(); shapePath(ctx, o.antigen, kx, -R + 1, R * 0.36, -R * 0.5); ctx.closePath();
        ctx.fillStyle = light; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2.2; ctx.stroke();
      }
    }
    capsule(ctx, L, R); ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = Math.max(2.4, size * 0.12); ctx.stroke();
    ctx.save(); capsule(ctx, L, R); ctx.clip();
    ellipse(ctx, -L * 0.1, -R * 0.55, L * 1.1, R * 0.32, light);
    [[-L * 0.7, R * 0.3, 0.2], [-L * 0.25, R * 0.45, 0.14], [L * 0.05, -R * 0.05, 0.12]].forEach(([sx, sy, k]) => circle(ctx, sx, sy, size * k, dark));
    ctx.restore();
    if (o.face !== false) {
      const mood = o.mood || 'smug', fx = L * 0.42;
      eyes(ctx, fx, -R * 0.12, R * 0.34, mood, o.look || [0.6, 0]);
      mouth(ctx, fx, R * 0.42, R * 0.6, mood === 'happy' ? 'smug' : mood);
    }
    ctx.restore();
  }
  function germBits(ctx, x, y, s, spread, kind) {
    const body = kind === 'B' ? K.germB : K.germ;
    [[-1, -0.6, 0.4], [0.9, -0.8, -0.5], [-0.4, 0.9, 1.1], [1.1, 0.6, 0.2], [0, -0.1, -1]].forEach(([dx, dy, a]) => {
      ctx.save(); ctx.translate(x + dx * spread, y + dy * spread); ctx.rotate(a);
      capsule(ctx, s * 0.35, s * 0.24); ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    });
  }
  // A white blood cell: soft wobbling membrane, a lobed purple nucleus.
  function bodyFill(ctx, cx, cy, r) {
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.1);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#eceffa'); g.addColorStop(1, K.wbcEdge); return g;
  }
  function nucleusLobes(ctx, cx, cy, r) {
    [[-0.3, 0.32], [0.02, 0.45], [0.32, 0.3]].forEach(([dx, dy]) => {
      ellipse(ctx, cx + dx * r, cy + dy * r, r * 0.21, r * 0.18, K.nucleus); ctx.strokeStyle = K.nucleusEdge; ctx.lineWidth = 2; ctx.stroke();
    });
    line(ctx, [[cx - 0.2 * r, cy + 0.38 * r], [cx - 0.08 * r, cy + 0.44 * r]], K.nucleus, r * 0.09);
    line(ctx, [[cx + 0.12 * r, cy + 0.43 * r], [cx + 0.24 * r, cy + 0.36 * r]], K.nucleus, r * 0.09);
  }
  function wbcFace(ctx, cx, cy, r, mood, look) {
    eyes(ctx, cx, cy - r * 0.2, r * 0.13, mood, look);
    mouth(ctx, cx + look[0] * r * 0.04, cy + r * 0.04, r * 0.22, mood === 'sleepy' ? 'happy' : mood);
    if (mood !== 'grumpy') { blush(ctx, cx - r * 0.42, cy - r * 0.02, r * 0.1); blush(ctx, cx + r * 0.42, cy - r * 0.02, r * 0.1); }
  }
  function whiteCell(ctx, x, y, r, o = {}) {
    const t = o.t || 0, sx = o.sx || 1, sy = o.sy || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    blob(ctx, 0, 0, r, t, o.wobble ?? 0.035); ctx.fillStyle = bodyFill(ctx, 0, 0, r); ctx.fill();
    ctx.strokeStyle = K.ink; ctx.lineWidth = Math.max(2.4, r * 0.06) / Math.max(sx, sy); ctx.stroke();
    for (let i = 0; i < 9; i++) circle(ctx, Math.cos(i * 2.4) * r * 0.6, Math.sin(i * 2.4) * r * 0.55 + r * 0.05, r * 0.035, '#c9b7ee');
    nucleusLobes(ctx, 0, 0, r);
    if (o.face !== false) wbcFace(ctx, 0, 0, r, o.mood || 'happy', o.look || [0, 0]);
    ctx.restore();
  }
  function redCell(ctx, x, y, r = 13, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, K.rbcLight); g.addColorStop(0.45, '#e8636a'); g.addColorStop(0.8, K.rbc); g.addColorStop(1, '#b52f3b');
    ellipse(ctx, 0, 0, r, r * 0.64, g); ctx.strokeStyle = K.rbcDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.18, r * 0.42, r * 0.2, -0.3, Math.PI * 1.1, Math.PI * 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  function vessel(ctx, x, y, w, h, t, o = {}) {
    // Horizontal capillary: wall, plasma, red cells flowing left → right.
    round(ctx, x, y, w, h, h / 2, K.wall); round(ctx, x + 2, y + 7, w - 4, h - 14, (h - 14) / 2, o.lumen || K.lumen);
    ctx.save(); round(ctx, x + 2, y + 7, w - 4, h - 14, (h - 14) / 2); ctx.clip();
    const n = o.count || Math.round(w / 64), speed = o.speed || 30, rr = o.r || Math.min(13, (h - 14) * 0.36);
    for (let i = 0; i < n; i++) {
      const cx = x + ((i * (w / n) + t * speed) % (w + 40)) - 20, cy = y + h / 2 + (i % 3 - 1) * (h - 14) * 0.22;
      redCell(ctx, cx, cy, rr, Math.sin(i * 1.7) * 0.4);
    }
    ctx.restore();
    ctx.strokeStyle = K.ink; ctx.lineWidth = 2.5; round(ctx, x, y, w, h, h / 2); ctx.stroke();
    for (let sx = x + 40; sx < x + w - 30; sx += 66) { line(ctx, [[sx, y + 1], [sx, y + 7]], '#a85a62', 2); line(ctx, [[sx + 33, y + h - 7], [sx + 33, y + h - 1]], '#a85a62', 2); }
  }
  function tissueBack(ctx, x, y, w, h) {
    ctx.fillStyle = K.tissue; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (let i = 0; i < Math.ceil(h / 26) + 1; i++) {
      const pts = []; for (let px = x - 20; px <= x + w + 20; px += 20) pts.push([px, y + 12 + i * 26 + Math.sin(px * 0.02 + i * 1.3) * 5]);
      line(ctx, pts, K.fiber, 2);
    }
    ctx.restore();
  }
  function skinRows(ctx, x0, x1, y0, gap) {
    // Three brick rows; the top row is flatter. A wound removes a real gap.
    const rows = [[y0, 28, K.skinTop, false], [y0 + 30, 34, K.skin, true], [y0 + 66, 34, K.skinDeep, true]];
    rows.forEach(([y, h, fill, nuc], row) => {
      for (let x = x0 - (row % 2 ? 35 : 0); x < x1; x += 70) {
        const cx = x + 34;
        if (gap && cx > gap[0] - 4 && cx < gap[1] + 4) continue;
        const left = Math.max(x, x0), right = Math.min(x + 68, x1);
        if (right - left < 10) continue;
        round(ctx, left, y, right - left, h, 9, fill); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
        if (nuc) ellipse(ctx, (left + right) / 2, y + h / 2, 7, 5, K.skinNucleus);
        else line(ctx, [[left + 10, y + 7], [right - 14, y + 7]], 'rgba(255,255,255,0.55)', 3);
      }
    });
  }
  function boing(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const k of [0, 1]) { ctx.beginPath(); ctx.arc(x, y, r + k * 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    ctx.restore();
  }
  function droplet(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.quadraticCurveTo(x + s, y, x, y + s * 0.8); ctx.quadraticCurveTo(x - s, y, x, y - s * 1.3);
    ctx.fillStyle = K.drop; ctx.fill(); ctx.strokeStyle = '#2b6f8c'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function callout(ctx, D, pair, tx, ty, ax, ay, color, width = 280) {
    const h = label(ctx, D, pair, tx, ty, width, color);
    arrow(ctx, tx - 8 + (ax > tx ? width * 0.6 : 0), ty + Math.min(h, 30) / 2 + 4, ax, ay, color); return h;
  }

  // ── Tab 1: barriers ───────────────────────────────────────────────────────
  function barrierProgress(s, t) {
    return s.observe === 'contact' ? 0.5 : s.observe === 'outcome' ? 1 : (t % 10) / 10;
  }
  function skinScene(ctx, s, t, p) {
    const wound = s.scenario === 'wound', gap = wound ? [478, 552] : null;
    const sky = ctx.createLinearGradient(0, 110, 0, 250); sky.addColorStop(0, '#1f504a'); sky.addColorStop(1, '#173f3a');
    ctx.fillStyle = sky; ctx.fillRect(32, 110, 896, 142);
    for (let i = 0; i < 14; i++) circle(ctx, 40 + ((i * 131 + t * 9) % 880), 128 + (i * 37) % 110, 2.2, 'rgba(242,236,217,0.25)');
    tissueBack(ctx, 32, 350, 896, 160, t);
    vessel(ctx, 32, 462, 896, 46, t, { speed: 26, r: 10 });
    skinRows(ctx, 32, 928, 250, gap);
    if (wound) {
      line(ctx, [[478, 250], [470, 290], [480, 318], [474, 350]], '#e2575d', 4);
      line(ctx, [[552, 250], [560, 286], [550, 318], [557, 350]], '#e2575d', 4);
      ctx.save(); ctx.globalAlpha = 0.85; droplet(ctx, 488, 330, 7); ctx.restore();
    }
    // Germs waiting outside, then the hero germ for this scenario.
    [[150, 168, 16, 0.2], [292, 205, 19, -0.2], [760, 206, 16, 0.3], [880, 160, 14, -0.1]].forEach(([gx, gy, sz, a], i) =>
      germ(ctx, gx, gy + Math.sin(t * 2 + i) * 5, sz, { t: t + i, angle: a, mood: i % 2 ? 'grumpy' : 'smug', look: [0.4, 0.5] }));
    const cellMood = wound ? (p > 0.72 ? 'surprised' : 'happy') : 'sleepy';
    let gx = 515, gy, angle = 0, mood = 'smug';
    if (wound) {
      const q = ease(p); gy = mix(160, 430, q);
      angle = gy > 205 && gy < 395 ? Math.PI / 2 : gy >= 395 ? mix(Math.PI / 2, 0.3, (gy - 395) / 35) : 0;
      mood = p > 0.85 ? 'surprised' : 'smug';
    } else {
      if (p < 0.5) gy = mix(160, 232, ease(p * 2));
      else { const q = (p - 0.5) * 2; gy = 232 - 30 * Math.abs(Math.sin(q * Math.PI * 1.5)) * (1 - q); }
      mood = p < 0.47 ? 'smug' : p < 0.62 ? 'surprised' : 'grumpy';
      if (p > 0.46 && p < 0.66) boing(ctx, gx, 246, 26, 1 - Math.abs(p - 0.56) * 9);
    }
    germ(ctx, gx, gy, 24, { t, angle, mood, look: [0.2, 0.8] });
    whiteCell(ctx, 805, 400, 34, { t, mood: cellMood, look: wound && p > 0.72 ? [-0.9, 0.2] : [0, 0] });
    if (wound && p > 0.72) { line(ctx, [[805, 340], [805, 352]], C.yellow, 5); circle(ctx, 805, 361, 3, C.yellow); }
  }
  function mucosaScene(ctx, s, t, p) {
    const lum = ctx.createLinearGradient(0, 110, 0, 245); lum.addColorStop(0, '#1d4a45'); lum.addColorStop(1, '#173c38');
    ctx.fillStyle = lum; ctx.fillRect(32, 110, 896, 140);
    tissueBack(ctx, 32, 440, 896, 70, t);
    for (let j = 0; j < 12; j++) {
      const x = 130 + j * 68; if (x > 928) break;
      round(ctx, x + 1, 344, 66, 96, 14, '#e2ad96'); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
      ellipse(ctx, x + 34, 400, 9, 13, '#8a6a86');
    }
    // Mucus first, then cilia reaching up into it (metachronal wave).
    ctx.save(); ctx.beginPath(); ctx.moveTo(130, 304);
    for (let x = 130; x <= 928; x += 16) ctx.lineTo(x, 246 + Math.sin(x * 0.03 + t * 1.2) * 5);
    ctx.lineTo(928, 304); ctx.closePath(); ctx.fillStyle = K.mucus; ctx.fill(); ctx.strokeStyle = K.mucusEdge; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 16; i++) circle(ctx, 140 + ((i * 97 + 900 - (t * 50) % 900) % 790), 262 + (i * 23) % 34, 3 + (i % 3), 'rgba(255,255,255,0.35)');
    for (let j = 0; j < 12; j++) {
      const x = 130 + j * 68; if (x > 928) break;
      for (let k = 0; k < 5; k++) {
        const bend = 10 * Math.sin(t * 3 + j * 0.35 + k * 0.3), bx = x + 10 + k * 12;
        line(ctx, [[bx, 344], [bx + bend, 322], [bx + 2 * bend, 300]], K.ink, 4.5);
        line(ctx, [[bx, 344], [bx + bend, 322], [bx + 2 * bend, 300]], '#f6eedb', 2.4);
      }
    }
    const gx = mix(800, 175, p);
    for (let i = 0; i < 4; i++) circle(ctx, 160 + ((i * 190 + 700 - p * 520) % 700), 288 - i % 2 * 12, 5, '#c9c2b0');
    germ(ctx, gx, 272 + Math.sin(t * 6) * 2, 22, { t, angle: Math.sin(t * 5) * 0.08, mood: 'worried', look: [-0.6, 0.2] });
    sweat(ctx, gx + 30, 246, 6);
    arrow(ctx, 790, 200, 210, 200, C.teal);
  }
  function drawBarrier(ctx, s, t, D) {
    background(ctx);
    const names = { intact: bi('完整皮膚', 'Intact skin'), wound: bi('局部破損', 'A local break'), mucosa: bi('呼吸道黏膜', 'Airway mucosa') };
    head(ctx, D, names[s.scenario], bi('本站原創卡通示意｜放大、非實際比例', 'Original cartoon model | enlarged, not to scale'));
    const p = barrierProgress(s, t);
    ctx.save(); round(ctx, 32, 110, 896, 400, 16); ctx.clip();
    if (s.scenario === 'mucosa') mucosaScene(ctx, s, t, p); else skinScene(ctx, s, t, p);
    ctx.restore();
    if (s.scenario === 'mucosa') {
      label(ctx, D, bi('向咽部移動', 'Toward the throat'), 400, 158, 360, C.teal);
      label(ctx, D, bi('黏液', 'Mucus'), 38, 258, 90, C.green);
      label(ctx, D, bi('纖毛', 'Cilia'), 38, 312, 90);
      label(ctx, D, bi('組織側', 'Tissue side'), 140, 456, 240, K.skinTop);
      footer(ctx, D, bi('黏住 → 隨黏液移走；纖毛不把目標打碎', 'Trap → carry away in mucus; cilia do not smash the target'));
    } else {
      label(ctx, D, bi('外界', 'Outside'), 48, 120, 180);
      label(ctx, D, bi('組織內', 'In tissue'), 48, 362, 240, K.skinTop);
      if (s.scenario === 'wound') callout(ctx, D, bi('局部缺口', 'Local opening'), 612, 132, 552, 262, C.orange, 230);
      else callout(ctx, D, bi('緊密的細胞層', 'Closely packed layers'), 600, 118, 590, 254, C.yellow, 260);
      footer(ctx, D, bi('青綠色小怪＝病原體；米色細胞層＝皮膚屏障；表情只是擬人化', 'Teal critters = microbes; tan cell layers = skin barrier; faces are only decoration'));
    }
    D.status(s.scenario === 'mucosa' ? bi('黏液帶著顆粒向咽部移動', 'Mucus carries particles toward the throat') : s.scenario === 'wound' ? bi('路徑只通過局部缺口', 'Entry is through the local break') : bi('目標停在本示範的完整皮膚外側', 'This example stays outside intact skin'));
  }

  // ── Tab 2: phagocytosis ──────────────────────────────────────────────────
  function phagoPhase(s, t) { return s.sequence === 'auto' ? (t % 18) / 3 : clamp(Number(s.stage), 0, 5) + 0.7; }
  function engulf(ctx, D, phase, t, captions = true) {
    // The target stays outside until two membrane arms meet and seal.
    const step = Math.min(5, Math.floor(phase)), p = phase - step, cx = 650, cy = 330, r = 100;
    const inward = step >= 4 ? ease(step === 4 ? p : 1) : 0, tx = step < 4 ? 832 : mix(832, 772, inward);
    const fill = bodyFill(ctx, cx, cy, r);
    const parts = [];
    parts.push(c => blob(c, cx, cy, r, t, 0.03));
    if (step === 3) {
      const e = ease(p);
      for (const sgn of [-1, 1]) parts.push(c => {
        const tipX = mix(770, 868, e), tipY = cy + sgn * mix(78, 28, e);
        c.beginPath(); c.moveTo(cx + 52, cy + sgn * 86);
        c.bezierCurveTo(cx + 120, cy + sgn * 112, tipX + 26, tipY + sgn * 30, tipX, tipY);
        c.bezierCurveTo(tipX - 22, tipY - sgn * 12, cx + 96, cy + sgn * 52, cx + 66, cy + sgn * 40); c.closePath();
      });
    }
    if (step >= 4) parts.push(c => { c.beginPath(); c.ellipse(mix(818, 772, inward), cy, mix(70, 48, inward), mix(74, 56, inward), 0, 0, TAU); });
    ctx.save(); ctx.lineJoin = 'round';
    for (const part of parts) { part(ctx); ctx.strokeStyle = K.ink; ctx.lineWidth = 7; ctx.stroke(); }
    for (const part of parts) { part(ctx); ctx.fillStyle = fill; ctx.fill(); }
    ctx.restore();
    nucleusLobes(ctx, cx - 18, cy + 8, r);
    const cellMood = step <= 1 ? 'happy' : step <= 3 ? 'determined' : 'happy';
    wbcFace(ctx, cx - 24, cy - 6, r, cellMood, [0.9, 0]);
    if (step >= 4) {
      // Phagosome: the enclosed target, still intact until it is broken down.
      ctx.save(); ctx.beginPath(); ctx.arc(tx, cy, 38, 0, TAU); ctx.fillStyle = step === 5 ? `rgba(251,146,60,${0.18 + 0.2 * p})` : 'rgba(85,233,255,0.16)'; ctx.fill();
      ctx.setLineDash([6, 5]); ctx.strokeStyle = step === 5 ? C.orange : C.teal; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 3; i++) {
        const q = step === 5 ? ease(p) : 0, lx = mix(600 + 26 * i, tx - 26 + i * 18, q), ly = mix(392 + i * 8, cy + 20 - i * 12, q);
        circle(ctx, lx, ly, 8, K.lyso); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    if (step === 5 && p > 0.3) germBits(ctx, tx, cy, 24, 14);
    else germ(ctx, tx, cy, step >= 4 ? 18 : 22, { t, mood: step <= 1 ? 'smug' : step === 2 ? 'worried' : 'surprised', look: [-0.8, 0], flip: true, tail: step < 4 });
    if (step === 2) for (let i = 0; i < 3; i++) circle(ctx, 760 + i * 16, 330 + Math.sin(t * 4 + i) * 3, 3, C.teal);
    if (captions) {
      label(ctx, D, bi('膜包圍過程放大', 'Enlarged membrane process'), 470, 128, 430, C.teal);
      label(ctx, D, bi('紫色＝細胞核', 'Purple = nucleus'), 470, 466, 260, C.purple);
      if (step >= 4) label(ctx, D, bi('囊內目標', 'Enclosed target'), 742, 466, 180, C.teal);
    }
  }
  function drawPhago(ctx, s, t, D) {
    const f = phagoPhase(s, t), step = Math.min(5, Math.floor(f));
    background(ctx); head(ctx, D, phagoSteps[step][0], bi('左：移出血管｜右：吞噬放大｜步數不是生理時間', 'Vessel exit + engulfment close-up; stages are schematic'));
    round(ctx, 35, 117, 400, 390, 15, C.panel); round(ctx, 450, 117, 477, 390, 15, C.deep);
    ctx.save(); round(ctx, 35, 117, 400, 390, 15); ctx.clip();
    tissueBack(ctx, 35, 196, 400, 220, t);
    const sky = ctx.createLinearGradient(0, 117, 0, 160); sky.addColorStop(0, '#1f504a'); sky.addColorStop(1, '#173f3a'); ctx.fillStyle = sky; ctx.fillRect(35, 117, 400, 40);
    for (const [x0, x1] of [[35, 196], [262, 435]]) for (let x = x0; x < x1; x += 46) {
      const w = Math.min(44, x1 - x); round(ctx, x, 156, w, 40, 8, x % 2 ? K.skin : K.skinTop); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
    }
    line(ctx, [[196, 156], [204, 196]], '#e2575d', 4); line(ctx, [[262, 156], [256, 196]], '#e2575d', 4);
    germ(ctx, 230, 262, 15, { t, mood: step < 2 ? 'smug' : 'worried', look: [0, 0.8] });
    vessel(ctx, 50, 410, 370, 84, t, { speed: 20, r: 12, count: 7 });
    if (step < 2) {
      const q = step === 0 ? 0 : ease(f - 1);
      const cy = mix(452, 360, q), rx = 1 - 0.38 * Math.sin(q * Math.PI), ry = 1 + 0.32 * Math.sin(q * Math.PI);
      whiteCell(ctx, 230, cy, 27, { t, sx: rx, sy: ry, mood: step === 0 ? 'happy' : 'determined', look: [0, -0.9] });
      if (step === 1) sweat(ctx, 258, cy - 26, 6);
    } else whiteCell(ctx, mix(230, 258, ease(Math.min(f - 2, 1))), mix(360, 306, ease(Math.min(f - 2, 1))), 28, { t, mood: 'determined', look: [-0.5, -0.7] });
    ctx.restore();
    label(ctx, D, bi('傷口', 'Wound'), 300, 122, 120, C.orange);
    arrow(ctx, 296, 136, 264, 160, C.orange);
    label(ctx, D, bi('組織', 'Tissue'), 50, 300, 150);
    label(ctx, D, bi('微血管', 'Small vessel'), 50, 372, 300, C.red);
    engulf(ctx, D, f, t);
    footer(ctx, D, bi('青綠色＝病原體；白色＋紫核＝白血球；臉只是擬人化，吞噬靠細胞膜包圍', 'Teal = microbe; white + purple nucleus = white cell; faces are decoration—membrane does the engulfing'));
    D.status(phagoSteps[step][0]);
  }

  // ── Tab 3: inflammation ──────────────────────────────────────────────────
  function drawInflammation(ctx, s, t, D) {
    const m = Number(s.mechanism), dilated = m === 1 || m === 4, leaky = m === 2 || m === 4, recruited = m === 3 || m === 4;
    background(ctx); head(ctx, D, inflammationModes[m][0], bi('一次比較一項機制，再看整合；不顯示未量測的速率', 'Compare one mechanism, then combine; no unmeasured rates'));
    const vh = dilated ? 110 : 72, top = 430 - vh / 2;
    ctx.save(); round(ctx, 100, 110, 760, 400, 16); ctx.clip();
    const sky = ctx.createLinearGradient(0, 110, 0, 180); sky.addColorStop(0, '#1f504a'); sky.addColorStop(1, '#173f3a'); ctx.fillStyle = sky; ctx.fillRect(100, 110, 760, 90);
    tissueBack(ctx, 100, 200, 760, 310, t);
    // Nerve ending (always present); it glows only when pain is selected.
    const pain = s.symptom === 3 && m !== 0;
    for (const [w, c] of [[6, K.ink], [3, pain ? C.yellow : '#b59a4a']]) {
      line(ctx, [[760, 360], [690, 320], [628, 286], [600, 262]], c, w); line(ctx, [[628, 286], [612, 300]], c, w); line(ctx, [[690, 320], [700, 296]], c, w);
    }
    if (leaky) { ctx.save(); ctx.globalAlpha = 0.5; ellipse(ctx, 500, 292, 175, 62, '#2e6f7a'); ctx.restore(); }
    vessel(ctx, 100, top, 760, vh, t, { speed: dilated ? 48 : 29, count: dilated ? 15 : 10, r: 12, lumen: dilated ? '#74262f' : K.lumen });
    whiteCell(ctx, 225 + Math.sin(t) * 6, 430, 22, { t, mood: 'happy' });
    if (leaky) for (let j = 0; j < 6; j++) { const q = (t / 4 + j / 6) % 1; droplet(ctx, 360 + j * 52, mix(top + 6, 268, q), 6); }
    if (recruited) for (let j = 0; j < 3; j++) {
      const q = (t / 9 + j / 3) % 1;
      whiteCell(ctx, mix(445 + j * 45, 480 + j * 36, q), mix(427, 280, ease(q)), 22, { t: t + j, sx: 1 - 0.35 * Math.sin(q * Math.PI), sy: 1 + 0.2 * Math.sin(q * Math.PI), mood: 'determined', look: [0.3, -0.9] });
    }
    // Skin surface: swells (bulge) with permeability; redder with dilation.
    const bulge = leaky ? 1 : 0, topY = x => 178 - bulge * 26 * Math.exp(-Math.pow((x - 515) / 150, 2));
    ctx.beginPath(); ctx.moveTo(100, 231); for (let x = 100; x <= 860; x += 10) ctx.lineTo(x, topY(x)); ctx.lineTo(860, 231); ctx.closePath();
    ctx.fillStyle = K.skin; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2.5; ctx.stroke();
    for (let x = 130; x < 860; x += 70) if (m === 0 || x < 455 || x > 575) line(ctx, [[x, topY(x) + 4], [x, 229]], '#b98764', 2);
    if (dilated) { const g = ctx.createRadialGradient(515, 200, 10, 515, 200, 210); g.addColorStop(0, 'rgba(255,80,80,0.55)'); g.addColorStop(1, 'rgba(255,80,80,0)'); ctx.fillStyle = g; ctx.fillRect(300, 120, 430, 120); }
    if (m !== 0) {
      ctx.fillStyle = K.tissue; ctx.beginPath(); ctx.moveTo(478, topY(478) - 1); ctx.lineTo(500, 232); ctx.lineTo(530, 232); ctx.lineTo(552, topY(552) - 1); ctx.closePath(); ctx.fill();
      line(ctx, [[478, topY(478)], [500, 232]], '#e2575d', 4); line(ctx, [[552, topY(552)], [530, 232]], '#e2575d', 4);
      germ(ctx, 515, 248, 16, { t, mood: recruited ? 'worried' : 'smug', look: [0, 0.6] });
    }
    if (dilated && (s.symptom === 1 || m === 4)) for (let i = 0; i < 3; i++) {
      const pts = []; for (let k = 0; k <= 10; k++) pts.push([430 + i * 80 + Math.sin(k * 0.9 + t * 3 + i) * 7, 150 - k * 3.5 - ((t * 12) % 14)]);
      line(ctx, pts, C.orange, 3);
    }
    if (pain) for (let i = 0; i < 3; i++) {
      const a = -0.6 + i * 0.6, r1 = 20 + Math.sin(t * 6) * 3, x0 = 600 + Math.cos(a) * r1, y0 = 262 + Math.sin(a) * r1 - 10;
      line(ctx, [[x0, y0], [x0 + 7, y0 - 6], [x0 + 3, y0 - 12], [x0 + 11, y0 - 18]], C.yellow, 3);
    }
    ctx.restore();
    if (m === 0) label(ctx, D, bi('完整皮膚與平常組織', 'Intact skin and baseline tissue'), 130, 122, 670, K.skinTop);
    else callout(ctx, D, bi('受損部位', 'Injury site'), 680, 120, 556, 200, C.orange, 170);
    if (s.symptom === 0 || s.symptom === 1) {
      line(ctx, [[305, top - 12], [700, top - 12]], C.orange, 5);
      label(ctx, D, dilated ? bi('血液供應增加', 'Increased blood delivery') : bi('與擴張狀態比較', 'Compare with dilation'), 110, top - 52, 340, C.orange);
    } else if (s.symptom === 2) {
      label(ctx, D, leaky ? bi('組織液增加', 'More tissue fluid') : bi('與通透性增加比較', 'Compare permeability'), 110, 300, 300, C.teal);
    } else if (m !== 0) label(ctx, D, bi('局部刺激示意', 'Local stimulation'), 640, 250, 210, C.yellow);
    label(ctx, D, bi('組織', 'Tissue'), 110, 244, 200);
    footer(ctx, D, bi('藍滴＝液體；白色細胞＝白血球；紅血球不跟著滲出', 'Blue drops = fluid; white cells = white blood cells; red cells do not leak with fluid'));
    D.status(joinPairs([inflammationModes[m][0], symptoms[s.symptom][0]], '｜'));
  }

  // ── Tab 4: antigen–antibody specificity ───────────────────────────────────
  function pocket(ctx, shape, x, y, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(-77, 0); ctx.lineTo(-32, 0);
    // The antibody body has a real complementary recess, not a painted symbol.
    if (shape === 0) { ctx.lineTo(0, 44); ctx.lineTo(32, 0); }
    else if (shape === 1) ctx.bezierCurveTo(-32, 58.96, 32, 58.96, 32, 0);
    else { ctx.lineTo(-32, 44); ctx.lineTo(32, 44); ctx.lineTo(32, 0); }
    ctx.lineTo(77, 0); ctx.lineTo(65, 94); ctx.lineTo(-65, 94); ctx.closePath();
    const g = ctx.createLinearGradient(-77, 0, 77, 94); g.addColorStop(0, '#fff3a3'); g.addColorStop(0.5, C.yellow); g.addColorStop(1, '#e8b923');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4 / Math.max(scale, 0.35); ctx.lineJoin = 'round'; ctx.strokeStyle = K.ink; ctx.stroke(); ctx.restore();
  }
  function antibodyY(ctx, x, y, shape, size = 1, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
    const arms = [[[0, 83], [0, 0], [-65, -75]], [[0, 0], [65, -75]]];
    for (const a of arms) line(ctx, a, K.ink, 31);
    for (const a of arms) line(ctx, a, C.yellow, 24);
    for (const a of arms) line(ctx, a.map(([px, py]) => [px - 4, py - 3]), 'rgba(255,250,210,0.7)', 6);
    pocket(ctx, shape, -65, -98, 0.29); pocket(ctx, shape, 65, -98, 0.29);
    ctx.restore();
  }
  function bigGerm(ctx, t, antigen, mood) {
    // One wide germ body; the antigen knob hangs from its lower surface at x=659.
    ctx.save(); ctx.beginPath(); ctx.moveTo(470, 218); ctx.lineTo(870, 218); ctx.quadraticCurveTo(905, 192, 870, 166); ctx.lineTo(470, 166); ctx.quadraticCurveTo(435, 192, 470, 218); ctx.closePath();
    ctx.fillStyle = K.germ; ctx.fill(); ctx.save(); ctx.clip(); ellipse(ctx, 640, 172, 230, 10, K.germLight);
    [[560, 200, 7], [760, 190, 9], [830, 205, 6]].forEach(([x, y, r]) => circle(ctx, x, y, r, K.germDark)); ctx.restore();
    ctx.strokeStyle = K.ink; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
    ctx.beginPath(); shapePath(ctx, antigen, 659, 218); ctx.closePath();
    ctx.fillStyle = K.germLight; ctx.fill(); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.strokeStyle = K.ink; ctx.stroke();
    eyes(ctx, 512, 186, 9, mood, [0.4, 0.6]); mouth(ctx, 512, 205, 16, mood);
    for (let i = 0; i < 6; i++) { const px = 480 + i * 72; line(ctx, [[px, 166], [px - 6 + Math.sin(t * 3 + i) * 3, 152]], K.germDark, 3); }
  }
  function drawAntibody(ctx, s, t, D) {
    // Binding and assistance begin when their controls are pressed, not at tab start.
    const actionTime = Math.max(0, t - (s.dockStart || 0));
    background(ctx); head(ctx, D, bi('看結合部位，不看整個病原體外形', 'Match binding sites, not whole microbe outlines'), bi('左右為不同倍率的示意；真實結合還取決於化學性質', 'Independent magnifications; real binding also depends on chemistry'));
    round(ctx, 32, 120, 335, 390, 14, C.panel); round(ctx, 391, 120, 537, 390, 14, C.deep);
    label(ctx, D, bi('抗體是蛋白質', 'An antibody is a protein'), 56, 136, 285, C.yellow);
    antibodyY(ctx, 197, 322 + Math.sin(t * 1.6) * 4, Number(s.antibody), 1.22);
    for (const [sx, sy] of [[90, 230], [300, 250], [110, 410], [290, 420]]) sparkle(ctx, sx, sy + Math.sin(t * 2 + sx) * 3, 6 + 2 * Math.sin(t * 3 + sy), 'rgba(253,224,71,0.7)');
    label(ctx, D, bi('兩端部位相同', 'Two identical binding tips'), 55, 452, 295, C.yellow);
    if (s.dock === 2 && compatible(s)) {
      ctx.save(); ctx.translate(-22, -3); engulf(ctx, D, 3 + (actionTime % 12) / 4, t, false); ctx.restore();
      label(ctx, D, bi('抗體標記 → 協助吞噬', 'Tagged target → assisted engulfment'), 415, 132, 485, C.teal);
      // A bound antibody stays attached until intracellular degradation.
      const f = 3 + (actionTime % 12) / 4;
      if (f < 5.3) antibodyY(ctx, f < 4 ? 807 : mix(807, 748, ease(f - 4)), 354, Number(s.antibody), 0.21);
    } else {
      const approach = s.dock ? ease(Math.min(actionTime / 1.8, 1)) : 0, ok = compatible(s);
      const wobble = s.dock && !ok && approach >= 1 ? Math.sin(actionTime * 9) * 4 * Math.max(0, 1 - (actionTime - 1.8) / 2) : 0;
      const rimY = mix(330, ok ? 218 : 280, approach) + wobble;
      ctx.save(); round(ctx, 391, 120, 537, 390, 14); ctx.clip();
      line(ctx, [[659, rimY + 88], [659, rimY + 260]], K.ink, 31); line(ctx, [[659, rimY + 88], [659, rimY + 260]], C.yellow, 24);
      // Draw the pocket before the antigen so a matched interface is not hidden.
      pocket(ctx, Number(s.antibody), 659, rimY);
      bigGerm(ctx, t, Number(s.antigen), s.dock ? (ok && approach >= 1 ? 'worried' : approach >= 1 ? 'smug' : 'surprised') : 'smug');
      if (s.dock && ok && approach >= 1) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; sparkle(ctx, 659 + Math.cos(a) * 92, 250 + Math.sin(a) * 40, 9); }
      if (s.dock && !ok && approach >= 1) { line(ctx, [[600, 262], [585, 254]], C.orange, 3); line(ctx, [[718, 262], [733, 254]], C.orange, 3); }
      ctx.restore();
      label(ctx, D, bi('病原體表面的抗原部位', 'An antigen site on the microbe'), 420, 126, 480, C.teal);
      label(ctx, D, s.dock ? (ok ? bi('相容結合；目標仍在', 'Compatible binding; target remains') : bi('不相容；保持分開', 'Incompatible; remains separate')) : bi('一端結合部位的放大', 'One enlarged antibody tip'), 420, 462, 215, s.dock && !ok ? C.orange : C.yellow);
    }
    footer(ctx, D, bi('青綠色＝病原體與抗原部位；黃色＝抗體；平面凹凸僅表示互補性', 'Teal = microbe and antigen site; yellow = antibody; flat profiles only model complementarity'));
    D.status(antibodyExplanation(s).title);
  }

  // ── Tab 5: immune memory ─────────────────────────────────────────────────
  const PLOT = Object.freeze({ x: 110, w: 490, y: 455, h: 248 });
  function curve(ctx, fn, until, color, dashed = false) {
    const pts = [];
    for (let i = 0; i <= 150; i++) { const q = i / 150; if (q > until) break; pts.push([PLOT.x + PLOT.w * q, PLOT.y - PLOT.h * fn(q)]); }
    if (pts.length > 1) line(ctx, pts, color, dashed ? 3 : 6, dashed ? [9, 7] : []);
  }
  function memoryCard(ctx, x, y, shape, ok) {
    round(ctx, x - 30, y - 24, 60, 48, 8, '#fdf6e3'); ctx.strokeStyle = K.ink; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); shapePath(ctx, shape, x, y + 10, 14, -20); ctx.closePath(); ctx.fillStyle = K.germLight; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
    if (ok === false) { line(ctx, [[x + 22, y - 30], [x + 44, y - 8]], '#ef4444', 5); line(ctx, [[x + 44, y - 30], [x + 22, y - 8]], '#ef4444', 5); }
    if (ok === true) line(ctx, [[x + 22, y - 18], [x + 30, y - 9], [x + 46, y - 30]], C.green, 5);
  }
  function drawMemory(ctx, s, t, D) {
    background(ctx); const k = Number(s.memoryCase), p = memoryProgress(s, t);
    head(ctx, D, memoryCases[k], bi('定性比較｜沒有實測天數、抗體濃度、保護率或門檻', 'Qualitative only; no measured days, titres or protection thresholds'));
    const color = k === 1 ? C.orange : k === 2 ? C.pink : C.teal;
    label(ctx, D, bi('相對專一性反應', 'Relative specific response'), 32, 120, 300);
    line(ctx, [[318, 140], [352, 140]], C.muted, 3, [8, 6]);
    label(ctx, D, bi('初次反應參考', 'First-response reference'), 362, 126, 272, C.muted);
    arrow(ctx, PLOT.x, PLOT.y, PLOT.x, PLOT.y - PLOT.h - 20, C.white); arrow(ctx, PLOT.x, PLOT.y, PLOT.x + PLOT.w + 24, PLOT.y, C.white);
    curve(ctx, primaryCurve, 1, '#789f90', true);
    const fn = k === 1 ? recallCurve : primaryCurve;
    curve(ctx, fn, p, color);
    const x = PLOT.x + PLOT.w * p, y = PLOT.y - PLOT.h * fn(p);
    line(ctx, [[x, PLOT.y - PLOT.h - 6], [x, PLOT.y]], '#547366', 2, [4, 7]); circle(ctx, x, y, 8, color); ctx.strokeStyle = K.ink; ctx.lineWidth = 2.5; ctx.stroke();
    label(ctx, D, bi(k === 2 ? '接觸乙' : '接觸甲', k === 2 ? 'Exposure to B' : 'Exposure to A'), 96, 474, 230, color);
    label(ctx, D, bi('接觸後時間 →', 'Time after exposure →'), 388, 474, 248);
    const card = k === 0 ? bi('初次建立對甲的反應', 'Build the first response to A') : k === 1 ? bi('甲的記憶 → 對應甲', 'Memory of A → matching A') : bi('甲的記憶 ≠ 對應乙', 'Memory of A ≠ matching B');
    round(ctx, 130, 166, 470, 45, 9, C.panel);
    ctx.save(); const cardSize = fitText(ctx, D.tr(card), 440, 22, 22); ctx.restore();
    label(ctx, D, card, 150, 173, 440, color, cardSize);
    // Cartoon panel: which germ arrives, what the cell remembers, how many
    // matching antibodies are present (follows the curve height only).
    round(ctx, 640, 112, 288, 400, 15, C.panel);
    const target = k === 2 ? 'B' : 'A', shape = target === 'A' ? 0 : 2;
    germ(ctx, 770, 176 + Math.sin(t * 2) * 4, 26, { t, kind: target, antigen: shape, mood: fn(p) > 0.6 ? 'worried' : 'smug', look: [0.3, 0.7] });
    label(ctx, D, bi(target === 'A' ? '甲' : '乙', target), 860, 160, 50, target === 'A' ? C.teal : C.pink);
    const memoryCell = k > 0;
    whiteCell(ctx, 724, 318, 46, { t, mood: k === 2 ? 'surprised' : k === 1 ? 'determined' : 'worried', look: [0.4, -0.8] });
    if (memoryCell) {
      memoryCard(ctx, 852, 292, 0, k === 1 ? true : false);
      label(ctx, D, bi('甲的記憶', 'Memory of A'), 788, 330, 138, C.white);
    } else label(ctx, D, bi('第一次見到', 'First meeting'), 784, 300, 136, C.white);
    // Matching antibodies gather below; their number follows the curve only.
    const n = Math.round(fn(p) * 12);
    for (let i = 0; i < n; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      antibodyY(ctx, 676 + col * 44 + (row % 2) * 20, 430 + row * 44 + Math.sin(t * 2 + i) * 3, shape, 0.17, Math.sin(i * 1.3) * 0.3);
    }
    footer(ctx, D, bi('曲線高度不是保護率；免疫記憶不代表永不感染', 'Curve height is not a protection percentage; memory does not guarantee no infection'));
    D.status(k === 0 ? bi('初次反應：對甲', 'First response: target A') : k === 1 ? bi('對應記憶：甲 → 甲', 'Matching memory: A → A') : bi('不同目標：甲的記憶不直接對應乙', 'Different target: memory of A does not directly match B'));
  }

  // ── Text-free cartoon cover (exported to PNG once; not drawn per frame) ──
  function drawCover(ctx, W, H, t = 1.3) {
    ctx.save(); ctx.scale(W / 1672, H / 941);
    const bg = ctx.createLinearGradient(0, 0, 1672, 941); bg.addColorStop(0, '#173f3a'); bg.addColorStop(0.55, '#2b2a3c'); bg.addColorStop(1, '#3b2c36');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1672, 941);
    for (let i = 0; i < 26; i++) { ctx.save(); ctx.globalAlpha = 0.08 + 0.06 * (i % 3); circle(ctx, (i * 211) % 1672, (i * 137) % 941, 18 + (i * 7) % 40, '#f2ecd9'); ctx.restore(); }
    // Curved skin wall on the left; a crack lets one germ sneak inside.
    ctx.save(); ctx.translate(150, 0);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 16; i++) {
      const y = -30 + i * 64 + (row % 2) * 32, x = 330 + row * 54 + Math.sin(y / 300) * 60;
      if (i === 7 && row >= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(y / 300) * 0.2);
      round(ctx, -26, -30, 52, 60, 14, row === 0 ? K.skinTop : row === 1 ? K.skin : K.skinDeep); ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.stroke();
      if (row) ellipse(ctx, 0, 0, 8, 10, K.skinNucleus); ctx.restore();
    }
    ctx.restore();
    [[395, 170, 32, 0.4, 'smug'], [420, 350, 38, -0.3, 'grumpy'], [380, 610, 34, 0.2, 'smug'], [440, 790, 30, -0.4, 'grumpy']].forEach(([x, y, s, a, mood], i) => germ(ctx, x, y, s, { t: t + i, angle: a, mood, look: [0.8, 0] }));
    germ(ctx, 660, 470, 44, { t, angle: 0.15, mood: 'smug', look: [0.9, 0.1] });
    sparkle(ctx, 750, 420, 14, 'rgba(253,224,71,0.8)');
    // Capillary along the bottom right with red cells.
    vessel(ctx, 760, 770, 980, 124, t, { speed: 0, count: 12, r: 21 });
    // The hero white blood cell, ready with an outstretched membrane arm.
    const fill = bodyFill(ctx, 1170, 420, 210);
    const parts = [c => blob(c, 1170, 420, 210, t, 0.025), c => { c.beginPath(); c.moveTo(990, 330); c.bezierCurveTo(910, 300, 860, 380, 820, 415); c.bezierCurveTo(800, 445, 850, 465, 878, 450); c.bezierCurveTo(920, 430, 950, 440, 985, 462); c.closePath(); }];
    for (const part of parts) { part(ctx); ctx.strokeStyle = K.ink; ctx.lineWidth = 9; ctx.stroke(); }
    for (const part of parts) { part(ctx); ctx.fillStyle = fill; ctx.fill(); }
    nucleusLobes(ctx, 1188, 438, 210);
    wbcFace(ctx, 1134, 392, 210, 'determined', [-0.9, 0.1]);
    for (const [x, y, a, sz] of [[930, 160, -0.5, 0.55], [1390, 140, 0.4, 0.5], [1420, 620, -0.2, 0.45], [890, 650, 0.6, 0.4]]) antibodyY(ctx, x, y, 0, sz, a);
    ctx.restore();
  }

  function label(ctx, D, pair, x, y, max = 300, color = C.white, size = 22) {
    return textLines(ctx, D.tr(pair), x, y, max, size, color);
  }
  function head(ctx, D, pair, sub) {
    label(ctx, D, pair, 32, 22, 896, C.white, 28);
    if (sub) label(ctx, D, sub, 32, 69, 896, C.muted);
  }
  function footer(ctx, D, pair, y = 534) {
    line(ctx, [[32, y - 14], [928, y - 14]], '#41685a', 2);
    label(ctx, D, pair, 32, y, 896, C.muted);
  }
  function mainBody(index) {
    const c = content[index];
    return joinPairs([...c.paragraphs, c.instructions, c.supplemental]);
  }
  const shortBodies = [
    bi('切換完整皮膚、局部破損與呼吸道黏膜：比較病原體被擋住、經缺口進入，或隨黏液移走的差別。', 'Explore intact skin, a local break and airway mucosa. Compare blocking, entry through a break, and clearance in mucus.'),
    bi('白血球的吞噬有順序：移到組織、接近、包圍、吞入，再在囊內分解。逐段觀察「還在細胞外」與「已被膜完整包住」的差別。', 'Follow a phagocyte through recruitment, approach, enclosure, engulfment and degradation inside a vesicle. Compare a target still outside the cell with one fully enclosed by membrane.'),
    bi('紅與熱看局部血流，腫看液體累積，痛看組織刺激。一次切換一項機制，再看整合狀態，找出每個現象的原因。', 'Link redness and warmth to blood delivery, swelling to fluid accumulation, and pain to local stimulation. Compare one mechanism at a time before viewing them together.'),
    bi('抗體結合的是特定抗原部位。選相容與不相容的凹凸組合：結合後目標仍在，再觀察抗體如何協助其他免疫作用清除。', 'Antibodies bind particular antigenic sites. Compare compatible and incompatible profiles, see that a bound target remains, then follow assistance from other immune mechanisms.'),
    bi('比較初次遇甲、有甲的記憶再遇甲，以及改遇乙。曲線只表示反應的相對先後與強弱，沒有實測數值，也不是保證永不感染。', 'Compare first encounter with A, A again with matching memory, and a different B. Curves show only relative order and response strength, not measured values or guaranteed protection.')
  ];
  const base = index => ({
    id: content[index].id, title: content[index].title, sub: content[index].subtitle,
    hook: content[index].hook, body: shortBodies[index], reading: mainBody(index), closure: content[index].closure,
    sources: [], scientificSources: sources.filter(s => content[index].sourceIds.includes(s.id)),
    init: () => ({ running: true })
  });
  const tabs = [
    {
      ...base(0), init: () => ({ running: true, scenario: 'intact', observe: 'auto' }),
      controls: () => [{
        label: bi('屏障情境', 'Barrier scenario'), items: [
          { label: bi('完整皮膚', 'Intact skin'), key: 'scenario', value: 'intact' },
          { label: bi('局部破損', 'Local break'), key: 'scenario', value: 'wound' },
          { label: bi('呼吸道黏膜', 'Airway mucosa'), key: 'scenario', value: 'mucosa' }
        ]
      }, {
        label: bi('比較過程', 'Compare the process'), items: [
          { label: bi('連續觀察', 'Continuous observation'), key: 'observe', value: 'auto' },
          { label: bi('接觸時', 'At contact'), key: 'observe', value: 'contact' },
          { label: bi('結果位置', 'Resulting location'), key: 'observe', value: 'outcome' }
        ]
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; },
      explain: s => ({ title: content[0].subtitle, text: joinPairs(barrierCaptions[s.scenario]) }),
      draw: drawBarrier,
      check: s => ({ skinGapOnlyInWound: s.scenario === 'wound', airwayOnlyForCilia: s.scenario === 'mucosa', modelsNotTrueScale: true, noAbsoluteBarrierGuarantee: true, facesAreDecoration: true })
    },
    {
      ...base(1), init: () => ({ running: true, sequence: 'auto', stage: 0 }),
      controls: () => [{
        label: bi('吞噬分段', 'Phagocytosis stages'), items: [
          { label: bi('連續過程', 'Continuous process'), key: 'sequence', value: 'auto' },
          ...phagoSteps.map((step, i) => ({ label: step[0], key: 'stage', value: i }))
        ]
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; if (key === 'stage') s.sequence = 'step'; },
      explain: s => (s.sequence === 'auto' ? { title: bi('追蹤細胞、膜與目標', 'Follow the cell, membrane and target'), text: joinPairs([content[1].instructions, content[1].paragraphs[1]]) } : { title: phagoSteps[s.stage][0], text: phagoSteps[s.stage][1] }),
      draw: drawPhago,
      check: s => ({ targetEnclosedBeforeDegraded: true, normalRedCellsRemainInVessel: true, whiteCellsMayExit: true, allWhiteCellsAreNotPhagocytes: true, engulfByMembraneNotMouth: true, selectedStage: s.sequence === 'step' ? Number(s.stage) : 'continuous' })
    },
    {
      ...base(2), init: () => ({ running: true, mechanism: 0, symptom: 0 }),
      controls: () => [{
        label: bi('比較局部變化', 'Compare local changes'), items: inflammationModes.map((p, i) => ({ label: p[0], key: 'mechanism', value: i }))
      }, {
        label: bi('把現象連回原因', 'Link a sign to its cause'), items: symptoms.map((p, i) => ({ label: p[0], key: 'symptom', value: i }))
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; },
      explain: s => ({ title: joinPairs([inflammationModes[s.mechanism][0], symptoms[s.symptom][0]], '｜'), text: joinPairs([inflammationModes[s.mechanism][1], symptoms[s.symptom][1]]) }),
      draw: drawInflammation,
      check: s => ({ normalRedCellsRemainInVessel: true, fluidIsNotRedCells: true, dilation: Number(s.mechanism) === 1 || Number(s.mechanism) === 4, permeability: Number(s.mechanism) === 2 || Number(s.mechanism) === 4, infectionNotOnlyCause: true, localWarmthNotSystemicFever: true })
    },
    {
      ...base(3), init: () => ({ running: true, antigen: 0, antibody: 1, dock: 0, dockStart: 0, notice: '' }),
      controls: () => [{
        label: bi('抗原部位的形狀', 'Antigen site profile'), items: profiles.map((label, i) => ({ label, key: 'antigen', value: i }))
      }, {
        label: bi('抗體末端的凹槽', 'Antibody tip pocket'), items: pockets.map((label, i) => ({ label, key: 'antibody', value: i }))
      }, {
        label: bi('觀察結合與後續處理', 'Binding and subsequent handling'), items: [
          { label: bi('嘗試結合', 'Try binding'), key: 'dockAction', value: 'bind' },
          { label: bi('觀察協助清除', 'Observe assisted removal'), key: 'dockAction', value: 'assist' }
        ]
      }],
      act: (s, key, value) => {
        if (key === 'dockAction') {
          if (value === 'bind') { s.dock = 1; s.dockStart = s.elapsed || 0; s.notice = ''; }
          else if (s.dock && compatible(s)) { s.dock = 2; s.dockStart = s.elapsed || 0; s.notice = ''; }
          else s.notice = 'needsBinding';
        } else { s[key] = value; if (key === 'antigen' || key === 'antibody') { s.dock = 0; s.dockStart = 0; s.notice = ''; } }
      },
      explain: s => antibodyExplanation(s), draw: drawAntibody,
      check: s => ({ compatible: compatible(s), bound: Boolean(s.dock && compatible(s)), assistedRemoval: s.dock === 2 && compatible(s), twoIdenticalTips: true, bindingAloneDoesNotRemoveTarget: true, epitopeNotWholePathogen: true, noFabricatedAffinityPercent: true, antibodyHasNoFace: true })
    },
    {
      ...base(4), init: () => ({ running: true, memoryCase: 0, moment: 'auto' }),
      controls: () => [{
        label: bi('相同目標，還是不同目標？', 'Same target or a different target?'), items: memoryCases.map((label, i) => ({ label, key: 'memoryCase', value: i }))
      }, {
        label: bi('比較時間先後', 'Compare relative order'), items: [
          { label: bi('連續展開', 'Reveal continuously'), key: 'moment', value: 'auto' },
          { label: bi('接觸後早期', 'Early after exposure'), key: 'moment', value: 'early' },
          { label: bi('反應較後段', 'A later stage'), key: 'moment', value: 'later' },
          { label: bi('完整比較', 'Full comparison'), key: 'moment', value: 'full' }
        ]
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; },
      explain: s => ({ title: memoryCases[s.memoryCase], text: joinPairs([memoryCaptions[s.memoryCase], content[4].supplemental]) }),
      draw: drawMemory,
      check: s => ({ target: Number(s.memoryCase) === 2 ? 'B' : 'A', priorMemory: Number(s.memoryCase) ? 'A' : null, matchingMemory: Number(s.memoryCase) === 1, qualitativeOnly: true, measuredDays: null, titres: null, protectionPercent: null, noGuaranteedProtection: true })
    }
  ];

  root.ImmuneCartoon = Object.freeze({ drawCover, germ, whiteCell, redCell, antibodyY, version: '1014_v1' });
  if (!root.LivingBook) return;
  root.LivingBook.register({
    id: 'immune', section: '4-4', title: bi('人體的防禦作用', 'Human defenses'),
    subtitle: bi('從皮膜屏障到專一性防禦與免疫記憶', 'From barriers to specific defense and immune memory'),
    // Text-free cartoon cover drawn by drawCover() and exported to PNG.
    cover: 'assets/covers/biology_immune_1014_v1.png', tabs,
    scientificSources: sources,
    review: {
      date: '2026-10-14', canvas: [960, 600],
      artwork: 'All lesson pictures and the cover are original Canvas cartoons drawn in this file; no textbook figures or AI raster images are displayed. Faces on cells and microbes are decoration; antibodies have no faces because they are proteins.',
      graph: 'Original qualitative explanatory graph, not a measured data set.',
      animation: 'Framework owns RAF and pause/reset/fullscreen. Model cycles depict explanatory sequences, not biological time.'
    }
  });
}(globalThis));
