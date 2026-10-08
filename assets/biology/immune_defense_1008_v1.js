/* Biology 4-4, teacher-review draft, 2026-10-08.
 * Original textbook artwork is supplied by the chapter framework and remains separate
 * from these original explanatory models. Internal animation coordinates and curve
 * values are schematic; they are not measured biological times or antibody titres.
 * LivingBook register API, pure Canvas 960 x 600; no DOM or shared-file mutation.
 */
(function () {
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
  function microbe(ctx, x, y, radius = 18, fragments = false) {
    ctx.save(); ctx.translate(x, y);
    if (fragments) {
      [[-12,-5], [5,-8], [-5,10], [12,7]].forEach(p => ellipse(ctx, p[0], p[1], 5, 3, C.teal));
    } else {
      ctx.rotate(-0.35); ellipse(ctx, 0, 0, radius * 1.2, radius * 0.7, '#245d63', C.teal);
      line(ctx, [[-radius * 0.55, 0], [-radius * 0.1, -4], [radius * 0.35, 3]], C.teal, 2);
    }
    ctx.restore();
  }
  function whiteCell(ctx, x, y, radius = 42, rx = 1, ry = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    circle(ctx, 0, 0, radius, '#dce7de', C.white);
    ellipse(ctx, -12, 2, radius * 0.27, radius * 0.32, C.purple);
    ellipse(ctx, 7, -8, radius * 0.3, radius * 0.23, C.purple);
    line(ctx, [[-9, -3], [8,-8]], C.purple, 8);
    ctx.restore();
  }
  function redCell(ctx, x, y) {
    ellipse(ctx, x, y, 17, 10, C.blood, '#f3aaaa');
    ellipse(ctx, x, y, 8, 4, '#90383f');
  }

  const artwork = [
    { file: 'skin_original.png', name: bi('康軒原圖：皮膚與黏膜阻隔', 'Kang Hsuan artwork: skin and mucosal barriers'), page: 114, figure: '3-25', crop: [0.20, 0.18, 0.43, 0.73] },
    { file: 'phagocyte_original.png', name: bi('康軒原圖：突破屏障與吞噬', 'Kang Hsuan artwork: barrier breach and phagocytosis'), page: 115, figure: '3-26A', crop: [0.45, 0.19, 0.43, 0.73] },
    { file: 'inflammation_original.png', name: bi('康軒原圖：局部發炎與白血球聚集', 'Kang Hsuan artwork: inflammation and cell recruitment'), page: 115, figure: '3-26B', crop: [0.36, 0.12, 0.49, 0.70] },
    { file: 'antibody.png', name: bi('康軒原圖：專一性防禦的兩種作用', 'Kang Hsuan artwork: two specific defense mechanisms'), page: 116, figure: '3-27', crop: [0.35, 0.09, 0.61, 0.80] },
    { file: 'antibody.png', name: bi('康軒原圖：先回顧專一性防禦', 'Kang Hsuan artwork: recall target-specific defenses'), page: 116, figure: '3-27', crop: [0.35, 0.09, 0.61, 0.80] }
  ];
  const bookCaptions = [
    bi('這是課本的皮膜屏障示意，外側病原體與內側組織被分開。角色和箭頭是教學比喻，並不是顯微實拍。切到模型，觀察完整、破損與呼吸道黏膜的差別。', 'This textbook illustration separates outside microbes from inside tissue. Characters and arrows are teaching metaphors, not microscopy. Switch to the model to compare intact skin, a break and airway mucosa.'),
    bi('先找皮膜的缺口，再看病原體進入後，白血球如何伸出細胞膜包圍它。漫畫嘴巴是吞噬的比喻，白血球並沒有嘴巴；新增模型分段顯示移出血管、膜包圍、閉合與囊內分解。', 'Locate the barrier opening and white cells enclosing invaders. The cartoon mouth is a metaphor: white blood cells do not have mouths. The model separates vessel exit, membrane enclosure, sealing and degradation inside a vesicle.'),
    bi('課本把皮膚表面的局部紅腫，和下方血管、白血球聚集放在一起。先對照整張圖，再用模型逐項比較血流增加、液體滲出與白血球移動。', 'The textbook connects surface redness and swelling with the vessel and cell recruitment below. Compare the whole figure, then separate blood delivery, fluid leakage and cell movement in the model.'),
    bi('課本左側表示處理受感染細胞，右側表示抗體作用。炮台、武器與表情是擬人比喻；真正抗體是會結合特定抗原部位的蛋白質，不是射擊子彈。模型顯示結合與協助清除。', 'The left panel represents action on infected cells and the right antibody action. Weapons and expressions are metaphors. Actual antibodies are proteins that bind particular antigenic sites, not projectiles. The model shows binding and assisted removal.'),
    bi('先用圖 3-27 回顧「目標要相符」。本頁新畫的曲線延伸課本第 117 頁的記憶概念，並不是從此原圖擷取的實測圖。切到模型比較遇甲、再遇甲與改遇乙。', 'Use figure 3-27 to recall target matching. This tab’s new curves explain the memory concept on page 117; they are not measured graphs extracted from this artwork. Compare A, A again, and a different target B in the model.')
  ];
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
  function original(ctx, s, D, index) {
    if (s.view === 'model') return false;
    const a = artwork[index];
    background(ctx); head(ctx, D, a.name, bi('出版社原始插圖；局部放大仍是同一張原圖', 'Publisher artwork; zooming uses the same original image'));
    if (s.view === 'focus') {
      const fitted = D.image(ctx, a.file, 30, 145, 235, 210);
      if (fitted) {
        const [x, y, w, h] = a.crop;
        ctx.strokeStyle = C.yellow; ctx.lineWidth = 3;
        ctx.strokeRect(fitted.x + x * fitted.w, fitted.y + y * fitted.h, w * fitted.w, h * fitted.h);
      }
      D.focus(ctx, a.file, a.crop, [290, 116, 635, 390]);
      label(ctx, D, bi('黃框＝右方放大區', 'Yellow box = enlarged area'), 32, 390, 235, C.yellow);
      D.hit(30, 145, 235, 210, 'view', 'book');
    } else {
      const fitted = D.image(ctx, a.file, 34, 110, 892, 390);
      if (fitted) D.hit(fitted.x, fitted.y, fitted.w, fitted.h, 'view', 'focus');
      else label(ctx, D, bi('原圖載入中', 'Loading original artwork'), 330, 275, 300);
    }
    footer(ctx, D, bi(`康軒｜課本第 ${a.page} 頁，圖 ${a.figure}｜點原圖可放大`, `Kang Hsuan | textbook p. ${a.page}, fig. ${a.figure} | tap to zoom`));
    D.status(bi('課本原圖：靜態觀察；互動過程請選「模型」', 'Original artwork: static observation; select Model for processes'));
    return true;
  }
  const viewControls = () => ({
    label: bi('觀察方式', 'Observation view'), items: [
      { label: bi('課本原圖', 'Textbook artwork'), key: 'view', value: 'book' },
      { label: bi('原圖放大', 'Original close-up'), key: 'view', value: 'focus' },
      { label: bi('互動模型', 'Interactive model'), key: 'view', value: 'model' }
    ]
  });
  function skinCells(ctx, wound, y = 250) {
    for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) {
      if (wound && col === 5) continue;
      round(ctx, 130 + col * 70, y + row * 35, 68, 33, 7, row ? C.epithelial : C.skin, '#ead4b6');
    }
  }
  function barrierProgress(s, t) {
    return s.observe === 'contact' ? 0 : s.observe === 'outcome' ? 1 : (t % 10) / 10;
  }
  function drawBarrier(ctx, s, t, D) {
    if (original(ctx, s, D, 0)) return;
    background(ctx);
    const names = { intact: bi('完整皮膚', 'Intact skin'), wound: bi('局部破損', 'A local break'), mucosa: bi('呼吸道黏膜', 'Airway mucosa') };
    head(ctx, D, names[s.scenario], bi('新增教學示意｜放大、非實際比例', 'Original explanatory model | enlarged, not to scale'));
    const p = barrierProgress(s, t);
    if (s.scenario === 'mucosa') {
      round(ctx, 130, 245, 700, 70, 15, '#254e53', C.teal);
      for (let j = 0; j < 10; j++) {
        const x = 130 + j * 70;
        round(ctx, x, 345, 68, 75, 9, C.epithelial, '#ead4b6');
        circle(ctx, x + 34, 392, 10, '#795d72');
        for (let k = 0; k < 5; k++) {
          const bend = 10 * Math.sin(t * 3 + j * 0.35 + k * 0.3);
          line(ctx, [[x + 9 + k * 12, 345], [x + 9 + k * 12 + bend, 323], [x + 9 + k * 12 + 2 * bend, 297]], C.white, 3);
        }
      }
      microbe(ctx, mix(780, 160, p), 274, 17);
      for (let i = 0; i < 5; i++) circle(ctx, 160 + ((i * 122 + 660 - p * 500) % 660), 294, 4, C.muted);
      arrow(ctx, 790, 208, 210, 208, C.teal);
      label(ctx, D, bi('向咽部移動', 'Toward the throat'), 400, 165, 360, C.teal);
      label(ctx, D, bi('黏液', 'Mucus'), 32, 261, 95, C.teal);
      label(ctx, D, bi('纖毛', 'Cilia'), 32, 317, 95);
      label(ctx, D, bi('組織側', 'Tissue side'), 130, 445, 210, C.skin);
      footer(ctx, D, bi('黏住 → 隨黏液移走；纖毛不把目標打碎', 'Trap → carry away in mucus; cilia do not smash the target'));
    } else {
      round(ctx, 130, 355, 700, 126, 10, '#2a4333');
      skinCells(ctx, s.scenario === 'wound');
      label(ctx, D, bi('外界', 'Outside'), 135, 150, 180);
      label(ctx, D, bi('組織內', 'In tissue'), 150, 400, 240, C.skin);
      const py = s.scenario === 'wound' ? mix(160, 438, ease(p)) : mix(160, 222, ease(Math.min(p * 2, 1)));
      microbe(ctx, 515, py, 19); microbe(ctx, 295, 207, 15);
      if (s.scenario === 'wound') {
        line(ctx, [[481, 242], [481, 357]], C.orange, 4);
        line(ctx, [[549, 242], [549, 357]], C.orange, 4);
        arrow(ctx, 620, 191, 547, 261, C.orange);
        label(ctx, D, bi('局部缺口', 'Local opening'), 625, 157, 230, C.orange);
      } else {
        arrow(ctx, 670, 174, 565, 250, C.yellow);
        label(ctx, D, bi('緊密的細胞層', 'Closely packed layers'), 630, 132, 270, C.yellow);
      }
      footer(ctx, D, bi('青色＝病原體示意；米色細胞層＝皮膚屏障', 'Teal = example microbe; tan cell layers = skin barrier'));
    }
    D.status(s.scenario === 'mucosa' ? bi('黏液帶著顆粒向咽部移動', 'Mucus carries particles toward the throat') : s.scenario === 'wound' ? bi('路徑只通過局部缺口', 'Entry is through the local break') : bi('目標停在本示範的完整皮膚外側', 'This example stays outside intact skin'));
  }

  function phagoPhase(s, t) { return s.sequence === 'auto' ? (t % 18) / 3 : clamp(Number(s.stage), 0, 5) + 0.7; }
  function drawEngulf(ctx, D, phase, captions = true) {
    // The target stays outside the cup until the enclosing membrane has closed.
    const step = Math.min(5, Math.floor(phase)), p = phase - step;
    const r = 116;
    const targetX = step < 4 ? 829 : mix(829, 770, ease(step === 4 ? p : 1));
    whiteCell(ctx, 680, 325, r);
    if (step >= 4) {
      // Sealed protruding cup encloses the whole target before internal transport.
      // Retracting the cup moves its vesicle inward without crossing an intact membrane.
      const right = mix(877, 823, ease(step === 4 ? p : 1));
      ctx.beginPath(); ctx.moveTo(744, 228);
      ctx.bezierCurveTo(806, 216, right, 260, right, 325);
      ctx.bezierCurveTo(right, 390, 806, 434, 744, 422);
      ctx.arc(680, 325, 116, Math.atan2(97, 64), Math.PI * 2 - Math.atan2(97, 64));
      ctx.closePath(); ctx.fillStyle = '#dce7de'; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.stroke();
      ellipse(ctx, 666, 327, 31, 37, C.purple); ellipse(ctx, 688, 317, 35, 27, C.purple);
    }
    if (step === 3) {
      const extent = ease(p), tipX = mix(785, 867, extent), upperY = mix(247, 302, extent), lowerY = mix(403, 348, extent);
      ctx.fillStyle = '#dce7de'; ctx.strokeStyle = C.white; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(744, 235);
      ctx.bezierCurveTo(803, 213, tipX + 15, upperY - 22, tipX, upperY);
      ctx.bezierCurveTo(tipX - 6, upperY + 12, 797, 264, 755, 282); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(744, 415);
      ctx.bezierCurveTo(803, 437, tipX + 15, lowerY + 22, tipX, lowerY);
      ctx.bezierCurveTo(tipX - 6, lowerY - 12, 797, 386, 755, 368); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (step >= 4) {
      // Closing cup becomes an internal phagosome; its contents remain visible.
      circle(ctx, targetX, 325, 34, '#355a58', C.teal);
      for (let i = 0; i < 3; i++) {
        const x = mix(615 + 24 * i, targetX - 28, ease(step === 5 ? p : 0));
        const y = mix(375 + i * 10, 335 + i * 8, ease(step === 5 ? p : 0));
        circle(ctx, x, y, 8, C.orange);
      }
    }
    microbe(ctx, targetX, 325, 20, step === 5 && p > 0.3);
    if (captions) {
      label(ctx, D, bi('膜包圍過程放大', 'Enlarged membrane process'), 485, 133, 430, C.teal);
      label(ctx, D, bi('紫色＝細胞核', 'Purple = nucleus'), 490, 466, 270, C.purple);
      if (step >= 4) label(ctx, D, bi('囊內目標', 'Enclosed target'), 747, 457, 180, C.teal);
    }
  }
  function drawPhago(ctx, s, t, D) {
    if (original(ctx, s, D, 1)) return;
    const f = phagoPhase(s, t), step = Math.min(5, Math.floor(f));
    background(ctx); head(ctx, D, phagoSteps[step][0], bi('左：移出血管｜右：吞噬放大｜步數不是生理時間', 'Vessel exit + engulfment close-up; stages are schematic'));
    round(ctx, 35, 117, 400, 390, 15, C.panel);
    round(ctx, 450, 117, 477, 390, 15, C.deep);
    round(ctx, 65, 181, 135, 45, 6, C.skin); round(ctx, 260, 181, 140, 45, 6, C.skin);
    microbe(ctx, 235, 263, 16);
    round(ctx, 65, 410, 340, 82, 27, '#552f34', C.red);
    for (let i = 0; i < 6; i++) redCell(ctx, 85 + ((i * 54 + t * 20) % 295), 469);
    if (step < 2) {
      const p = step === 0 ? 0 : ease(f - 1);
      const cy = mix(441, 348, p), rx = 1 - 0.38 * Math.sin(p * Math.PI), ry = 1 + 0.3 * Math.sin(p * Math.PI);
      whiteCell(ctx, 230, cy, 29, rx, ry);
    } else whiteCell(ctx, mix(230, 256, ease(Math.min(f - 2, 1))), mix(348, 301, ease(Math.min(f - 2, 1))), 30);
    label(ctx, D, bi('傷口', 'Wound'), 82, 136, 155, C.orange);
    arrow(ctx, 168, 155, 225, 186, C.orange);
    label(ctx, D, bi('組織', 'Tissue'), 76, 314, 150);
    label(ctx, D, bi('微血管', 'Small vessel'), 78, 377, 310, C.red);
    drawEngulf(ctx, D, f);
    footer(ctx, D, bi('青色＝目標；白色＋紫核＝吞噬白血球；紅血球留在血管內', 'Teal = target; white + purple nucleus = phagocyte; red cells stay in the vessel'));
    D.status(phagoSteps[step][0]);
  }

  function drawInflammation(ctx, s, t, D) {
    if (original(ctx, s, D, 2)) return;
    const m = Number(s.mechanism), dilated = m === 1 || m === 4, leaky = m === 2 || m === 4, recruited = m === 3 || m === 4;
    background(ctx); head(ctx, D, inflammationModes[m][0], bi('一次比較一項機制，再看整合；不顯示未量測的速率', 'Compare one mechanism, then combine; no unmeasured rates'));
    if (m === 0) {
      round(ctx, 100, 178, 760, 53, 10, C.skin);
      label(ctx, D, bi('完整皮膚與平常組織', 'Intact skin and baseline tissue'), 130, 131, 670, C.skin);
    } else {
      round(ctx, 100, 178, 370, 53, 10, C.skin); round(ctx, 560, 178, 300, 53, 10, C.skin);
      microbe(ctx, 515, 244, 17);
      label(ctx, D, bi('受損部位', 'Injury site'), 670, 131, 230, C.orange);
      arrow(ctx, 660, 154, 533, 196, C.orange);
    }
    if (leaky) ellipse(ctx, 500, 292, 170, 63, '#244e52', C.teal);
    const vh = dilated ? 110 : 72, top = 430 - vh / 2;
    round(ctx, 100, top, 760, vh, 28, dilated ? '#70373d' : '#4c2e33', C.red);
    for (let i = 0; i < (dilated ? 15 : 10); i++) {
      const x = 126 + ((i * 73 + t * (dilated ? 48 : 29)) % 706);
      redCell(ctx, x, 430 + (i % 2 ? 18 : -18));
    }
    whiteCell(ctx, 225, 430, 23);
    if (leaky) for (let j = 0; j < 6; j++) {
      const q = ((t / 4 + j / 6) % 1);
      circle(ctx, 360 + j * 52, mix(top + 12, 273, q), 5, C.teal);
    }
    if (recruited) for (let j = 0; j < 3; j++) {
      const q = (t / 9 + j / 3) % 1;
      whiteCell(ctx, mix(445 + j * 45, 480 + j * 36, q), mix(427, 277, ease(q)), 23, 1 - 0.35 * Math.sin(q * Math.PI), 1 + 0.2 * Math.sin(q * Math.PI));
    }
    if (s.symptom === 0 || s.symptom === 1) {
      line(ctx, [[305, top - 12], [700, top - 12]], C.orange, 5);
      label(ctx, D, dilated ? bi('血液供應增加', 'Increased blood delivery') : bi('與擴張狀態比較', 'Compare with dilation'), 105, 315, 340, C.orange);
    } else if (s.symptom === 2) {
      label(ctx, D, leaky ? bi('組織液增加', 'More tissue fluid') : bi('與通透性增加比較', 'Compare permeability'), 105, 282, 300, C.teal);
    } else if (m !== 0) {
      circle(ctx, 593, 278, 15, null, C.yellow);
      line(ctx, [[571, 248], [566, 239]], C.yellow, 3);
      line(ctx, [[616, 268], [629, 265]], C.yellow, 3);
      label(ctx, D, bi('局部刺激示意', 'Local stimulation'), 630, 273, 260, C.yellow);
    }
    label(ctx, D, bi('組織', 'Tissue'), 103, 244, 200);
    footer(ctx, D, bi('藍滴＝液體；白色細胞＝白血球；紅血球不跟著滲出', 'Blue drops = fluid; white cells = white blood cells; red cells do not leak with fluid'));
    D.status(joinPairs([inflammationModes[m][0], symptoms[s.symptom][0]], '｜'));
  }

  const profiles = [bi('三角凸起', 'Triangular projection'), bi('圓弧凸起', 'Rounded projection'), bi('方形凸起', 'Square projection')];
  const pockets = [bi('三角凹槽', 'Triangular pocket'), bi('圓弧凹槽', 'Rounded pocket'), bi('方形凹槽', 'Square pocket')];
  function shapePath(ctx, profile, x, y, half = 32, depth = 44) {
    ctx.moveTo(x - half, y);
    if (profile === 0) { ctx.lineTo(x, y + depth); ctx.lineTo(x + half, y); }
    else if (profile === 1) ctx.bezierCurveTo(x - half, y + depth * 1.34, x + half, y + depth * 1.34, x + half, y);
    else { ctx.lineTo(x - half, y + depth); ctx.lineTo(x + half, y + depth); ctx.lineTo(x + half, y); }
  }
  function projection(ctx, shape, x, y) {
    ctx.beginPath(); shapePath(ctx, shape, x, y); ctx.closePath();
    ctx.fillStyle = '#245d63'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.teal; ctx.stroke();
  }
  function pocket(ctx, shape, x, y, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(-77, 0); ctx.lineTo(-32, 0);
    // Antibody solid body has an actual complementary recess, not a painted symbol.
    if (shape === 0) { ctx.lineTo(0, 44); ctx.lineTo(32, 0); }
    else if (shape === 1) ctx.bezierCurveTo(-32, 58.96, 32, 58.96, 32, 0);
    else { ctx.lineTo(-32, 44); ctx.lineTo(32, 44); ctx.lineTo(32, 0); }
    ctx.lineTo(77, 0); ctx.lineTo(65, 94); ctx.lineTo(-65, 94); ctx.closePath();
    ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff2a8'; ctx.stroke(); ctx.restore();
  }
  function antibodyY(ctx, x, y, shape, size = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    line(ctx, [[0, 83], [0, 0], [-65, -75]], C.yellow, 24);
    line(ctx, [[0, 0], [65, -75]], C.yellow, 24);
    pocket(ctx, shape, -65, -98, 0.29); pocket(ctx, shape, 65, -98, 0.29);
    ctx.restore();
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
  function drawAntibody(ctx, s, t, D) {
    if (original(ctx, s, D, 3)) return;
    // Binding and assistance begin when their controls are pressed, not at tab start.
    const actionTime = Math.max(0, t - (s.dockStart || 0));
    background(ctx); head(ctx, D, bi('看結合部位，不看整個病原體外形', 'Match binding sites, not whole microbe outlines'), bi('左右為不同倍率的示意；真實結合還取決於化學性質', 'Independent magnifications; real binding also depends on chemistry'));
    round(ctx, 32, 120, 335, 390, 14, C.panel); round(ctx, 391, 120, 537, 390, 14, C.deep);
    label(ctx, D, bi('抗體是蛋白質', 'An antibody is a protein'), 60, 147, 285, C.yellow);
    antibodyY(ctx, 197, 330, Number(s.antibody), 1.22);
    label(ctx, D, bi('兩端部位相同', 'Two identical binding tips'), 55, 452, 295, C.yellow);
    if (s.dock === 2 && compatible(s)) {
      ctx.save(); ctx.translate(-22, -3); drawEngulf(ctx, D, 3 + (actionTime % 12) / 4, false); ctx.restore();
      label(ctx, D, bi('抗體標記 → 協助吞噬', 'Tagged target → assisted engulfment'), 415, 139, 485, C.teal);
      // A bound antibody remains visibly attached until intracellular degradation.
      const f = 3 + (actionTime % 12) / 4;
      if (f < 5.3) antibodyY(ctx, f < 4 ? 807 : mix(807, 748, ease(f - 4)), 354, Number(s.antibody), 0.21);
    } else {
      const approach = s.dock ? ease(Math.min(actionTime / 1.8, 1)) : 0;
      const rimY = mix(330, compatible(s) ? 218 : 280, approach);
      // Draw the pocket before the antigen: a matched interface is not hidden by fills.
      pocket(ctx, Number(s.antibody), 659, rimY);
      round(ctx, 471, 173, 376, 45, 12, '#245d63', C.teal);
      projection(ctx, Number(s.antigen), 659, 218);
      label(ctx, D, bi('病原體表面的抗原部位', 'An antigen site on the microbe'), 437, 133, 460, C.teal);
      label(ctx, D, s.dock ? (compatible(s) ? bi('相容結合；目標仍在', 'Compatible binding; target remains') : bi('不相容；保持分開', 'Incompatible; remains separate')) : bi('一端結合部位的放大', 'One enlarged antibody tip'), 420, 463, 489, s.dock && !compatible(s) ? C.orange : C.yellow);
    }
    footer(ctx, D, bi('青色＝抗原部位；黃色＝抗體；平面凹凸僅表示互補性', 'Teal = antigen site; yellow = antibody; flat profiles only model complementarity'));
    D.status(antibodyExplanation(s).title);
  }

  const memoryCases = [bi('初次遇甲', 'First encounter with A'), bi('有甲的記憶，再遇甲', 'Memory of A, then A again'), bi('有甲的記憶，改遇乙', 'Memory of A, then a different B')];
  const memoryCaptions = [
    bi('第一次對甲建立專一性反應需要過程。曲線先較低，再逐漸升高；這不是完全沒有任何防禦，前兩道防線仍可工作。', 'Developing the first specific response to A takes a process: the curve begins lower and rises later. This does not mean no defense at all; barriers and innate responses can still act.'),
    bi('已有與甲相符的免疫記憶，再遇甲時通常能更快建立較強的對應反應。記憶不是把時間變成零，也不是保證不感染；虛線是初次反應參考。', 'With matching memory of A, A again generally produces a faster, stronger corresponding response. Memory does not reduce response time to zero or guarantee no infection. The dashed curve is the first-response reference.'),
    bi('甲的記憶仍可能存在，但本例乙的抗原不同、不相符，因此不能直接套用成乙的較快記憶反應。此時看的是「對乙」的反應；不是身體失去甲的全部記憶。', 'Memory of A may remain, but B has a distinct, nonmatching antigen in this example. A’s memory cannot simply become a faster memory response to B. The plotted response is to B, not the loss of all memory of A.')
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
  function curve(ctx, fn, until, color, dashed = false) {
    const pts = [];
    for (let i = 0; i <= 150; i++) {
      const q = i / 150;
      if (q > until) break;
      pts.push([143 + 710 * q, 455 - 248 * fn(q)]);
    }
    if (pts.length > 1) line(ctx, pts, color, dashed ? 3 : 5, dashed ? [9, 7] : []);
  }
  function drawMemory(ctx, s, t, D) {
    if (original(ctx, s, D, 4)) return;
    background(ctx); const k = Number(s.memoryCase), p = memoryProgress(s, t);
    head(ctx, D, memoryCases[k], bi('定性比較｜沒有實測天數、抗體濃度、保護率或門檻', 'Qualitative only; no measured days, titres or protection thresholds'));
    const color = k === 1 ? C.orange : k === 2 ? C.pink : C.teal;
    label(ctx, D, bi('相對專一性反應', 'Relative specific response'), 32, 128, 370);
    line(ctx, [[470, 144], [516, 144]], C.muted, 3, [8, 6]);
    label(ctx, D, bi('初次反應參考', 'First-response reference'), 530, 129, 390, C.muted);
    arrow(ctx, 143, 455, 143, 184, C.white); arrow(ctx, 143, 455, 891, 455, C.white);
    curve(ctx, primaryCurve, 1, '#789f90', true);
    const fn = k === 1 ? recallCurve : primaryCurve;
    curve(ctx, fn, p, color);
    const x = 143 + 710 * p, y = 455 - 248 * fn(p);
    line(ctx, [[x, 193], [x, 455]], '#547366', 2, [4, 7]); circle(ctx, x, y, 7, color, C.white);
    label(ctx, D, bi(k === 2 ? '接觸乙' : '接觸甲', k === 2 ? 'Exposure to B' : 'Exposure to A'), 135, 474, 230, color);
    label(ctx, D, bi('接觸後時間 →', 'Time after exposure →'), 600, 474, 320);
    const card = k === 0 ? bi('初次建立對甲的反應', 'Build the first response to A') : k === 1 ? bi('甲的記憶 → 對應甲', 'Memory of A → matching A') : bi('甲的記憶 ≠ 對應乙', 'Memory of A ≠ matching B');
    round(ctx, 240, 178, 568, 45, 9, C.panel);
    ctx.save(); const cardSize = fitText(ctx, D.tr(card), 525, 22, 22); ctx.restore();
    label(ctx, D, card, 262, 185, 525, color, cardSize);
    footer(ctx, D, bi('曲線高度不是保護率；免疫記憶不代表永不感染', 'Curve height is not a protection percentage; memory does not guarantee no infection'));
    D.status(k === 0 ? bi('初次反應：對甲', 'First response: target A') : k === 1 ? bi('對應記憶：甲 → 甲', 'Matching memory: A → A') : bi('不同目標：甲的記憶不直接對應乙', 'Different target: memory of A does not directly match B'));
  }

  function bookExplain(s, index) {
    if (s.view === 'model') return null;
    return { title: artwork[index].name, text: bookCaptions[index] };
  }
  function mainBody(index) {
    const c = content[index];
    return joinPairs([...c.paragraphs, c.instructions, c.supplemental]);
  }
  const shortBodies = [
    bi('先看課本原圖的外界與組織，再切換完整皮膚、局部破損與呼吸道黏膜：比較病原體被擋住、經缺口進入，或隨黏液移走的差別。', 'Compare outside and tissue in the original artwork, then explore intact skin, a local break and airway mucosa. Follow blocking, entry through a break, and clearance in mucus.'),
    bi('白血球的吞噬有順序：移到組織、接近、包圍、吞入，再在囊內分解。逐段觀察「還在細胞外」與「已被膜完整包住」的差別。', 'Follow a phagocyte through recruitment, approach, enclosure, engulfment and degradation inside a vesicle. Compare a target still outside the cell with one fully enclosed by membrane.'),
    bi('紅與熱看局部血流，腫看液體累積，痛看組織刺激。一次切換一項機制，再看整合狀態，找出每個現象的原因。', 'Link redness and warmth to blood delivery, swelling to fluid accumulation, and pain to local stimulation. Compare one mechanism at a time before viewing them together.'),
    bi('抗體結合的是特定抗原部位。選相容與不相容的凹凸組合：結合後目標仍在，再觀察抗體如何協助其他免疫作用清除。', 'Antibodies bind particular antigenic sites. Compare compatible and incompatible profiles, see that a bound target remains, then follow assistance from other immune mechanisms.'),
    bi('比較初次遇甲、有甲的記憶再遇甲，以及改遇乙。曲線只表示反應的相對先後與強弱，沒有實測數值，也不是保證永不感染。', 'Compare first encounter with A, A again with matching memory, and a different B. Curves show only relative order and response strength, not measured values or guaranteed protection.')
  ];
  function sourceFor(index) {
    const { file, name, page, figure } = artwork[index]; return { file, name, page, figure };
  }
  const base = index => ({
    id: content[index].id, title: content[index].title, sub: content[index].subtitle,
    hook: content[index].hook, body: shortBodies[index], reading: mainBody(index), closure: content[index].closure,
    sources: [sourceFor(index)], scientificSources: sources.filter(s => content[index].sourceIds.includes(s.id)),
    init: () => ({ running: true, view: 'book' })
  });
  const tabs = [
    {
      ...base(0), init: () => ({ running: true, view: 'book', scenario: 'intact', observe: 'auto' }),
      controls: () => [viewControls(), {
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
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; if (key !== 'view') s.view = 'model'; },
      explain: s => bookExplain(s, 0) || { title: content[0].subtitle, text: joinPairs(barrierCaptions[s.scenario]) },
      draw: drawBarrier,
      check: s => ({ skinGapOnlyInWound: s.scenario === 'wound', airwayOnlyForCilia: s.scenario === 'mucosa', modelsNotTrueScale: true, noAbsoluteBarrierGuarantee: true })
    },
    {
      ...base(1), init: () => ({ running: true, view: 'book', sequence: 'auto', stage: 0 }),
      controls: () => [viewControls(), {
        label: bi('吞噬分段', 'Phagocytosis stages'), items: [
          { label: bi('連續過程', 'Continuous process'), key: 'sequence', value: 'auto' },
          ...phagoSteps.map((step, i) => ({ label: step[0], key: 'stage', value: i }))
        ]
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; if (key === 'stage') s.sequence = 'step'; if (key !== 'view') s.view = 'model'; },
      explain: s => bookExplain(s, 1) || (s.sequence === 'auto' ? { title: bi('追蹤細胞、膜與目標', 'Follow the cell, membrane and target'), text: joinPairs([content[1].instructions, content[1].paragraphs[1]]) } : { title: phagoSteps[s.stage][0], text: phagoSteps[s.stage][1] }),
      draw: drawPhago,
      check: s => ({ targetEnclosedBeforeDegraded: true, normalRedCellsRemainInVessel: true, whiteCellsMayExit: true, allWhiteCellsAreNotPhagocytes: true, selectedStage: s.sequence === 'step' ? Number(s.stage) : 'continuous' })
    },
    {
      ...base(2), init: () => ({ running: true, view: 'book', mechanism: 0, symptom: 0 }),
      controls: () => [viewControls(), {
        label: bi('比較局部變化', 'Compare local changes'), items: inflammationModes.map((p, i) => ({ label: p[0], key: 'mechanism', value: i }))
      }, {
        label: bi('把現象連回原因', 'Link a sign to its cause'), items: symptoms.map((p, i) => ({ label: p[0], key: 'symptom', value: i }))
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; if (key !== 'view') s.view = 'model'; },
      explain: s => bookExplain(s, 2) || { title: joinPairs([inflammationModes[s.mechanism][0], symptoms[s.symptom][0]], '｜'), text: joinPairs([inflammationModes[s.mechanism][1], symptoms[s.symptom][1]]) },
      draw: drawInflammation,
      check: s => ({ normalRedCellsRemainInVessel: true, fluidIsNotRedCells: true, dilation: Number(s.mechanism) === 1 || Number(s.mechanism) === 4, permeability: Number(s.mechanism) === 2 || Number(s.mechanism) === 4, infectionNotOnlyCause: true, localWarmthNotSystemicFever: true })
    },
    {
      ...base(3), init: () => ({ running: true, view: 'book', antigen: 0, antibody: 1, dock: 0, dockStart: 0, notice: '' }),
      controls: () => [viewControls(), {
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
        if (key !== 'view') s.view = 'model';
      },
      explain: s => bookExplain(s, 3) || antibodyExplanation(s), draw: drawAntibody,
      check: s => ({ compatible: compatible(s), bound: Boolean(s.dock && compatible(s)), assistedRemoval: s.dock === 2 && compatible(s), twoIdenticalTips: true, bindingAloneDoesNotRemoveTarget: true, epitopeNotWholePathogen: true, noFabricatedAffinityPercent: true })
    },
    {
      ...base(4), init: () => ({ running: true, view: 'model', memoryCase: 0, moment: 'auto' }),
      controls: () => [viewControls(), {
        label: bi('相同目標，還是不同目標？', 'Same target or a different target?'), items: memoryCases.map((label, i) => ({ label, key: 'memoryCase', value: i }))
      }, {
        label: bi('比較時間先後', 'Compare relative order'), items: [
          { label: bi('連續展開', 'Reveal continuously'), key: 'moment', value: 'auto' },
          { label: bi('接觸後早期', 'Early after exposure'), key: 'moment', value: 'early' },
          { label: bi('反應較後段', 'A later stage'), key: 'moment', value: 'later' },
          { label: bi('完整比較', 'Full comparison'), key: 'moment', value: 'full' }
        ]
      }],
      act: (s, key, value) => { s[key] = value; s.elapsed = 0; if (key !== 'view') s.view = 'model'; },
      explain: s => bookExplain(s, 4) || { title: memoryCases[s.memoryCase], text: joinPairs([memoryCaptions[s.memoryCase], content[4].supplemental]) },
      draw: drawMemory,
      check: s => ({ target: Number(s.memoryCase) === 2 ? 'B' : 'A', priorMemory: Number(s.memoryCase) ? 'A' : null, matchingMemory: Number(s.memoryCase) === 1, qualitativeOnly: true, measuredDays: null, titres: null, protectionPercent: null, noGuaranteedProtection: true, originalReferencedIsFigure327Not328: true })
    }
  ];

  LivingBook.register({
    id: 'immune', section: '4-4', title: bi('人體的防禦作用', 'Human defenses'),
    subtitle: bi('從皮膜屏障到專一性防禦與免疫記憶', 'From barriers to specific defense and immune memory'),
    // Main-supplied, text-free AI scene cover; textbook figures below remain original artwork.
    cover: 'assets/covers/biology_immune_1008_v1.png', tabs,
    scientificSources: sources,
    review: {
      date: '2026-10-08', canvas: [960, 600],
      textbookCredit: bi('康軒課本《生物的運輸與防禦》，版次待核對；老師於 2026-10-08 回報已獲同意使用。原圖直接擷取，不含手寫層；不是 AI 圖或開放授權。', 'Kang Hsuan textbook, Transport and Defense in Organisms; edition pending verification. Teacher reported permission on 2026-10-08. Original embedded artwork extracted without handwriting; not AI imagery or an open license.'),
      assetAudit: [
        { file: 'skin_barrier.png', actual: 'p114 unnumbered chapter-opening strip', note: 'Not used as a barrier figure or as the module cover.' },
        { file: 'skin_original.png', actual: 'p114 figure 3-25 barrier', note: 'Correct alias of inflammation.png; visually verified.' },
        { file: 'inflammation_original.png', actual: 'p115 figure 3-26B wound and vessel', note: 'Correct alias of phagocytosis.png; visually verified.' },
        { file: 'phagocyte_original.png', actual: 'p115 figure 3-26A breach and engulfment', note: 'New extraction Im6429; visually verified.' }
      ],
      cover: 'Main-supplied biology_immune_1008_v1.png: text-free AI scene illustration, not a textbook figure or microscopy photograph.',
      graph: 'Original qualitative explanatory graph, not the textbook 3-28 image or a measured data set.',
      animation: 'Framework owns RAF and pause/reset/fullscreen. Source/focus views are static. Model cycles depict explanatory sequences, not biological time.'
    }
  });
}());
