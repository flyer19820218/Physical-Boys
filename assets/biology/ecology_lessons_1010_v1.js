/* Additive bilingual content only. Textbook artwork and model code are not edited here. */
(() => {
  'use strict';
  const E = window.EcosphereModels, M = window.NewBookModels;
  const P = (zh, en) => [zh, en];
  const pic = (file, name, page, text) => ({ file, name, page, text });
  function lesson(factory, o) {
    const sources = o.pics.map(q => ({ name: q.name, page: q.page }));
    for (const page of o.pages) if (!sources.some(q => q.page === page)) sources.push({ name: P('《生物圈》教學參考', 'Biosphere textbook reference'), page });
    const tab = factory({ ...o, sources });
    const live = tab.explain;
    return { ...tab, explain(s) {
      const q = live(s);
      return { title: q.title, text: P(q.text[0] + '\n\n觀察任務：' + o.study[0], q.text[1] + '\n\nObservation task: ' + o.study[1]) };
    } };
  }
  const earth = pic('Im75_189.png', P('地球原圖', 'Original Earth image'), 120, P('課本地球影像供觀察整體外形；影像本身未畫出可量測的生命邊界。約 20 km 是教學上的概略薄層描述，請切回模型比較尺度。', 'The Earth image shows the overall form, not a measurable boundary of life. Roughly 20 km is an approximate teaching description; return to the model to compare scales.'));
  const forest = pic('Im82_293.png', P('森林的生物與環境示意', 'Forest organisms and environment schematic'), 121, P('這是課本組成層次圖的森林部分，不是現地普查照片。辨認同種個體、不同族群，以及水、土壤等非生物部分；完整層次名稱見教學文字與模型。', 'This is the forest portion of the textbook organisation diagram, not a field census photo. Identify individuals of one species, different populations and nonliving parts such as water and soil; use the text and model for the full hierarchy.'));
  const quadrat = pic('Im88_586.png', P('樣區調查照片', 'Quadrat survey photograph'), 122, P('照片呈現用等面積樣區調查植物的做法，沒有提供整個研究區的普查數據。觀察樣區邊界與記錄姿勢，不要由照片植物多少推算全部族群。', 'The photograph illustrates surveying plants with equal-area quadrats; it does not provide a complete site census. Observe boundaries and recording, without estimating the whole population from photo density.'));
  const recovery = pic('Im225_930.png', P('九二一地震後九份二山的後期照片', 'Later photograph of Jiufenershan after the 1999 earthquake'), 125, P('這是課本印刷頁 125 所列民國 98 年（2009）影像，供與同頁民國 90 年（2001）照片比較。它不是目前地景；單張照片不能辨認全部物種或證明固定演替終點。', 'This is the textbook image labelled 2009, compared on the same page with 2001. It is not a current landscape record. One photograph cannot identify every species or establish a fixed endpoint of succession.'));
  const beech = pic('Im231_960.png', P('臺灣水青岡照片', 'Taiwan beech photograph'), 127, P('課本以臺灣水青岡作生產者例子。葉片可進行光合作用；樹也會呼吸。照片不直接呈現光合作用速率或能量數值。', 'The textbook uses Taiwan beech as a producer. Leaves photosynthesise, and the tree also respires. The photograph does not measure photosynthesis or energy.'));
  const squirrel = pic('Im229_956.png', P('松鼠取食照片', 'Feeding squirrel photograph'), 127, P('松鼠攝食現成有機物，是消費者。營養階層需看這一次吃什麼，不能只用物種名稱永遠固定一個階層。', 'The squirrel consumes organic matter and is a consumer. Its trophic level depends on what it eats in the particular chain, not only its species name.'));
  const fungus = pic('Im232_962.png', P('靈芝照片', 'Bracket fungus photograph'), 127, P('課本將此菌類列作分解者例子；分解者利用遺體與排遺等有機物。分解不等於把物質消滅，照片本身也不能測量分解速率。', 'This fungus is a textbook decomposer example. Decomposers use organic matter in remains and waste; matter is not destroyed, and the photograph does not measure decomposition.'));
  const prey = pic('Im2063_4448.png', P('獵豹與獵物照片', 'Cheetah and prey photograph'), 134, P('照片顯示掠食的一次事件，不能由此算出兩個族群的數量曲線或固定週期。獵物中的物質與能量傳向掠食者。', 'This photograph shows one predation event, not population curves or a fixed cycle. Matter and energy in prey pass to the predator.'));
  const anemone = pic('Im2081_4577.png', P('寄居蟹與海葵照片', 'Hermit crab and sea anemone photograph'), 136, P('課本用此例討論互利共生：海葵的保護與寄居蟹移動帶來的取食機會。照片只顯示共處，受益機制仍需課本資訊或觀察支持。', 'The textbook discusses protection by the anemone and feeding opportunities associated with crab movement. The photograph shows association; the benefit mechanisms need textual or observational evidence.'));
  const pond = pic('Im2159_5090.png', P('池塘照片', 'Pond photograph'), 146, P('靜水池塘中，水生植物分布與光、水深等有關；水面的一張照片不能提供水底溶氧或所有生物名錄。', 'Plant distribution in a still-water pond relates to light and depth. One surface photograph does not provide bottom-water oxygen or a complete species list.'));
  const stream = pic('Im2153_5078.png', P('溪流照片', 'Stream photograph'), 147, P('觀察流水、河床及岸邊植被。溪流與池塘可用流速等因子比較，但照片不是流速或水質的測量紀錄。', 'Observe flowing water, the bed and bank vegetation. Flow helps compare streams and ponds, but the photograph is not a flow or water-quality measurement.'));
  const estuary = pic('Im2163_5166.png', P('河口照片', 'Estuary photograph'), 148, P('河海交界的水位和鹽度會隨潮汐、河川入流等變動。照片是一次景象，不表示每天固定的鹽度或水位。', 'Water level and salinity at a river mouth vary with tides and freshwater inflow. This image captures one scene, not constant salinity or water level.'));
  const reef = pic('Im2180_5300.png', P('淺海生態系照片', 'Shallow marine ecosystem photograph'), 151, P('觀察魚與珊瑚等生物。珊瑚蟲是動物，部分與藻類共生；這張淺海照片不能代表所有深度的海洋。', 'Observe fish and corals. Coral polyps are animals, and some have symbiotic algae. This shallow-water image does not represent every ocean depth.'));

  const units = [
    { id: 'ecology_environment', title: P('生命住在多薄的一層？', 'How thin is Earth’s living layer?'), subtitle: P('生物圈、組成層次與族群調查', 'Biosphere, organisation and population surveys'), cover: 'Im225_930.png', coverSource: { page: 125 }, tabs: [
      lesson(E.biosphere, {
        id: 'living-layer', title: P('薄薄的生命圈', 'A thin living layer'), sub: P('生物圈與尺度', 'Biosphere and scale'),
        hook: P('曉臻老師問：如果地球是一顆球，生命是填滿整顆球，還是住在表面附近？', 'Ms Xiaozhen asks: if Earth is a ball, does life fill the whole ball or live near its surface?'),
        body: P('生物圈是地球上有生物活動的範圍，涵蓋部分大氣、水域與地表附近。課本以海平面上下各約 10 km、合計約 20 km 描述它的概略尺度。這不是一條固定界線，也不是範圍內每處都有同樣多的生命。先比較接近比例與誇張厚度，再想像我們的生活環境有多薄。', 'The biosphere is the part of Earth supporting life, including portions of the atmosphere, waters and near-surface land. The textbook describes an approximate 20 km layer, about 10 km above and below sea level. This is neither a fixed boundary nor a uniformly inhabited shell. Compare near-scale and exaggerated views to consider how thin our living environment is.'),
        reading: P('讀圖時先問「尺度有沒有被誇張」。地球半徑約 6370 km，整球尺度下很難看清生命薄層，所以模型提供放大顯示。黃線是範圍提示，不是生命分布實測；球的旋轉是改變觀察角度，不是表示物種移動。生物能否生活，還要看水、溫度、光、養分等條件。', 'First ask whether scale is exaggerated. With an Earth radius of about 6370 km, the living layer is hard to distinguish on the globe, so the model offers an enlarged view. Yellow lines indicate a concept, not measured life distribution; rotation changes your viewpoint, not species locations. Water, temperature, light and nutrients also determine whether organisms can live somewhere.'),
        closure: P('生物圈很薄；概略範圍不等於固定界線。', 'The biosphere is thin; an approximate range is not a fixed boundary.'),
        record: P('記錄兩種厚度顯示的差別，並寫出一句提醒：這張模型不能告訴我什麼？', 'Record the difference between the two thickness views, then state one thing the model cannot tell you.'),
        study: P('切換接近比例與誇張厚度。說明為什麼放大後較好觀察，卻不能把放大的黃線當成真實厚度或每一處的生命界線。', 'Switch between near scale and exaggerated thickness. Explain why enlargement aids observation without making the enlarged yellow layer a true thickness or local boundary.'),
        pics: [earth], pages: [120], initial: { mode: 0 }
      }),
      lesson(E.biosphere, {
        id: 'organisation', title: P('森林裡的層次', 'Levels within a forest'), sub: P('個體到生態系', 'Individual to ecosystem'),
        hook: P('曉臻老師問：把同一片森林裡的樹、鳥和水都圈起來，還能叫一個族群嗎？', 'Ms Xiaozhen asks: can trees, birds and water in one forest all be called a population?'),
        body: P('一隻松鼠是一個個體；同時、同地的同種松鼠形成族群。同區各種生物族群合稱群集。群集再加上水、土壤、光、溫度等非生物環境及彼此作用，才是生態系。每增加一層，納入的對象不同，不是把同一個名詞換大一點。', 'One squirrel is an individual. Squirrels of the same species in the same area at the same time form a population. The different populations together form a community. An ecosystem includes that community, nonliving factors such as water, soil, light and temperature, and their interactions. Each level includes different things, not merely a larger version of the same term.'),
        reading: P('「同時、同地、同種」是辨認族群的重要條件。群集不把土壤或水算成生物；生態系則要討論生物與環境的互相影響。例如樹冠改變林下光線，光線又影響植物生長。模型用球和樹形區分對象，顏色是符號，不能拿球數當森林的普查數。', 'Population identification requires the same time, place and species. Soil and water are not organisms in a community; ecosystems include organism–environment interactions. For example, a canopy changes understory light, which affects plant growth. Model spheres and trees distinguish categories; their colours are symbols, and their counts are not a forest census.'),
        closure: P('族群看同種；群集看各種生物；生態系還看非生物環境與作用。', 'Population: one species. Community: different populations. Ecosystem: also the nonliving environment and interactions.'),
        record: P('以校園為例，各寫一個個體、族群、群集與生態系描述，標明時間與範圍。', 'Use your schoolyard to describe an individual, population, community and ecosystem; specify time and boundaries.'),
        study: P('依序切換四個層次，逐項寫出「這一層多納入了什麼」。再用原圖找出一個非生物因子，解釋為什麼它不屬於群集卻屬於生態系。', 'Switch through the four levels and list what each newly includes. Find a nonliving factor in the original and explain why it belongs to the ecosystem but not the community.'),
        pics: [forest], pages: [121], initial: { mode: 1, level: 0 }
      }),
      lesson(E.sampling, {
        id: 'sampling', title: P('數不完怎麼估？', 'How can we estimate what we cannot count?'), sub: P('樣區與捉放法', 'Quadrats and mark–recapture'),
        hook: P('曉臻老師問：一大片草地和一池會游動的魚，可以用同一種數法嗎？', 'Ms Xiaozhen asks: should a large lawn and a pond of moving fish be counted in the same way?'),
        body: P('對移動性低的生物，可用等面積樣區算平均密度，再乘研究區面積。對會移動的生物，捉放法可用初次標記數 M、再捕總數 C、其中標記數 R，估算 N ≈ M × C ÷ R。兩種方法都靠樣本推估全部，估計值不是精確普查；在課堂用棋子模擬，不自行捕捉野生動物。', 'For organisms with little movement, equal-area quadrats estimate mean density, which is scaled to the site area. Mark–recapture uses initially marked M, second catch C and marked recaptures R to estimate N ≈ M × C ÷ R. Both infer a total from samples rather than providing an exact census. Use tokens in class instead of catching wildlife.'),
        reading: P('課本樣區例為每區 4、5、3 株，平均 4 株；研究區面積為一區的 8 倍，估為 32 株。模型另提供不同抽樣組合，不必每次得到 32。捉放法假設標記不脫落、不改變生存或被捕機率，放回後充分混合，短期內出生、死亡與遷移可忽略。R = 0 時不能用此式得到有效估值；多次平均可減少隨機誤差，不能修正壞掉的假設。', 'The textbook quadrats contain 4, 5 and 3 plants, averaging 4; a site eight times one quadrat’s area gives an estimate of 32. Other model samples need not give 32. Mark–recapture assumes retained marks, unaffected survival and capture probability, mixing, and negligible births, deaths and migration between catches. R = 0 gives no usable estimate with this formula. Repeated averages reduce random error, not invalid assumptions.'),
        closure: P('先看取樣與假設是否合理，再看算出的總數。', 'Check sampling and assumptions before trusting a calculated total.'),
        record: P('記錄三組樣區估值與已知總數的差異；另記一組 M、C、R，說明假設失效可能使估計偏高或偏低。', 'Record three quadrat estimates and their errors against the known total. Record M, C and R for one trial and explain a possible direction of bias from an invalid assumption.'),
        study: P('先換樣區組合，再固定 M、C 改變 R；試一次 R = 0。解釋數字改變的理由，不把模型預設的取樣順序誤認為現場隨機抽樣。', 'Change the quadrat sample, then hold M and C fixed while changing R; try R = 0. Explain the changes without treating the model’s preset sample sequence as field randomisation.'),
        pics: [quadrat, pic('Im214_751.png', P('池塘魚群的數量問題', 'The problem of counting pond fish'), 123, P('課本用魚群引出估算問題；照片未提供捉放數據。操作與估算式請看模型及課本棋子實驗。', 'The fish photograph introduces estimation but provides no mark–recapture counts. Use the model and textbook token experiment for the method.'))], pages: [122, 123], initial: { method: 0 }
      }),
      lesson(E.population, {
        id: 'population-balance', title: P('族群為何變動？', 'Why do populations change?'), sub: P('個體收支與環境負荷', 'Population balance and carrying capacity'),
        hook: P('曉臻老師問：一週後松鼠變多，一定是出生很多嗎？會不會是搬進來的？', 'Ms Xiaozhen asks: if there are more squirrels next week, must many have been born—or might some have arrived?'),
        body: P('一段期間的族群淨變化 = 出生 + 遷入 − 死亡 − 遷出。比較前後數量時，四項都要考慮。環境負荷量是環境在特定條件下能支持的族群大小，會隨食物、空間、季節及其他生物改變；不是永遠固定的硬上限。', 'Population change over an interval equals births + immigration − deaths − emigration. All four matter when comparing counts. Carrying capacity is the population an environment can support under particular conditions; it changes with food, space, seasons and other organisms, rather than being a permanently fixed ceiling.'),
        reading: P('模型以期初 40 個體做一段期間的收支。亮點表示進出方向，不是每秒出生或死亡的實測速率。改變資源支持量只提供背景，不會把個體瞬間刪到上限。課本草地中羊與牛的例子是在說共用資源會影響可支持的數量，不代表所有牧場都有固定的羊牛交換比例。', 'The model balances one interval starting with 40 individuals. Moving dots show direction, not measured births or deaths per second. Changing resource capacity adds context, not instant removal above a limit. The textbook sheep–cattle example illustrates shared-resource constraints, not a universal conversion ratio between animals.'),
        closure: P('數量變化要算四項；環境負荷量要看條件。', 'Population change has four terms; carrying capacity depends on conditions.'),
        record: P('設計一組淨增加、一組淨減少與一組不變的收支。保持收支相同，改資源情境，寫出下一段期間值得追蹤的問題。', 'Create increasing, decreasing and unchanged balances. Hold the balance fixed, change resources and propose a question for the next interval.'),
        study: P('一次只改一項收支，先預測期末數再檢查說明。將期末數超過示例支持量的情境與未超過者比較：哪些後續變化還需資料，而不能由這段模型直接斷定？', 'Change one flow at a time, predict the ending count and check the explanation. Compare counts above and below the illustrative capacity: which later changes require evidence beyond this model?'),
        pics: [pic('Im221_907.png', P('草地資源與羊牛示意', 'Grassland resources with sheep and cattle'), 124, P('課本以兩種消費者共用草地說明資源限制。圖內動物是教學例子，不是實際牧場調查，不能推出通用的承載量或交換比例。', 'The textbook illustrates consumers sharing a grassland resource. These are teaching examples, not a ranch census or universal carrying capacity or conversion ratio.'))], pages: [124], initial: {}
      }),
      lesson(E.succession, {
        id: 'succession', title: P('裸地如何變綠？', 'How does bare ground become green?'), sub: P('群集演替', 'Ecological succession'),
        hook: P('曉臻老師問：裸地變成森林，是原來的一株草慢慢變成大樹嗎？', 'Ms Xiaozhen asks: when bare ground becomes woodland, does one original herb turn into a tree?'),
        body: P('演替是群集組成隨時間改變，不是單一個體變成另一種。先進入的生物與環境互相作用，可能改變土壤、光照或水分，讓後來的物種較能建立。裸地是否保留土壤、附近有哪些種源，以及氣候和乾擾，都影響後續變化。', 'Succession changes community composition over time, not one organism into another species. Early organisms interact with conditions and may change soil, light or water, allowing other species to establish. Remaining soil, nearby sources of colonists, climate and disturbance influence what follows.'),
        reading: P('課本以九份二山地震後的不同年份照片與裸地到林木的圖示引出演替。模型按鈕是在跳到不同觀察時段，不是播放每一年的真實過程。保有土壤的地點可能仍有種子、根系或微生物；缺乏土壤的起點限制不同。圖中的草本、灌木、林木是一種可能路徑，並非所有地方必定照此順序或以森林為終點。', 'The textbook introduces succession through post-earthquake photographs of Jiufenershan and a bare-ground-to-woodland diagram. Buttons select observation stages, not actual yearly footage. A site retaining soil may retain seeds, roots or microbes; a site without soil has different constraints. Herbs, shrubs and trees describe one possible pathway, not a required sequence or forest endpoint everywhere.'),
        closure: P('演替改變的是群集組成；起始條件與乾擾會改變路徑。', 'Succession changes community composition; starting conditions and disturbance change its path.'),
        record: P('比較有土壤與缺乏土壤的起點，寫出兩個可能影響定殖的因子。從原圖只記錄看得到的變化，另列不能由照片確認的事。', 'Compare starting sites with and without soil and list two colonisation factors. Record visible changes in the originals separately from what photos cannot establish.'),
        study: P('切換時段與起始條件，再比較課本照片。說明「草變成樹」與「不同物種的比例改變」有何不同；不要替模型的時段自行加上固定年數。', 'Change stage and starting conditions, then compare textbook photographs. Distinguish a herb turning into a tree from changing proportions of different species; do not assign fixed years to stages.'),
        pics: [recovery, pic('Im224_929.png', P('九份二山較早期照片', 'Earlier Jiufenershan photograph'), 125, P('課本標示民國 90 年（2001）的較早期影像。應與後期照片及觀察條件一起比較，不能由色彩差異算出物種數。', 'The textbook labels this earlier image 2001. Compare it with the later photo and observation conditions; colour differences do not measure species richness.'))], pages: [125], initial: { stage: 0 }
      })
    ] },
    { id: 'ecology_energy', title: P('一片葉子如何養活整個網？', 'How can a leaf support a whole food web?'), subtitle: P('生態角色、能量流動與碳循環', 'Ecological roles, energy flow and the carbon cycle'), cover: 'Im231_960.png', coverSource: { page: 127 }, tabs: [
      lesson(M.gallery, {
        id: 'roles', title: P('誰養活誰？', 'Who supports whom?'), sub: P('生產者、消費者、分解者', 'Producers, consumers and decomposers'),
        hook: P('曉臻老師問：落葉不見了，是物質消失，還是被別的生物利用了？', 'Ms Xiaozhen asks: when fallen leaves disappear, has matter vanished or have other organisms used it?'),
        body: P('生產者把無機物轉成有機物，陸地植物多利用光合作用。消費者攝食現成有機物；分解者如許多細菌與菌類，分解遺體、排遺中的有機物並吸收利用。這是取得養分方式的角色，不是以大小、美醜或有沒有動來分類。', 'Producers make organic matter from inorganic materials, commonly through photosynthesis in land plants. Consumers ingest organic matter. Decomposers, including many bacteria and fungi, break down and absorb organic matter from remains and waste. These roles describe nutrition, not size, appearance or movement.'),
        reading: P('課本的廣義消費者包含分解者，本頁為方便追蹤功能分開說明。禿鷹等清除者吞食殘骸，與菌類體外分解再吸收的方式不同。分解者能利用各營養階層的遺體與排遺，不能只畫在最高階消費者後面。植物會光合作用，也會呼吸；不是只有動物才呼吸。', 'The textbook includes decomposers within a broad consumer category; this page separates functions for clarity. Scavengers such as vultures ingest carcasses, unlike fungi digesting externally and absorbing. Decomposers use remains and waste from all trophic levels, not only the top. Plants both photosynthesise and respire; respiration is not exclusive to animals.'),
        closure: P('按取得養分的方式分角色；分解者連結各層的遺體與排遺。', 'Roles follow how nutrition is obtained; decomposers connect remains and waste from every level.'),
        record: P('各選一張原圖，記錄可見特徵與課本提供的營養角色。另說明清除者與分解者不同在哪裡。', 'For each original, separate visible traits from its textbook nutritional role. Explain how scavengers differ from decomposers.'),
        study: P('比較水青岡、松鼠與靈芝的營養取得方式。照片不能直接顯示全部生理過程，請用閱讀內容補上證據來源，而不是以「能不能動」作答案。', 'Compare nutrition in beech, squirrel and fungus. Photos do not reveal every physiological process; use the reading for the evidence rather than classifying by movement.'),
        pics: [beech, squirrel, fungus], pages: [126, 127]
      }),
      lesson(E.foodweb, {
        id: 'food-links', title: P('箭頭從哪裡來？', 'Where does the arrow start?'), sub: P('食物鏈與食物網', 'Food chains and webs'),
        hook: P('曉臻老師問：鷹追兔子的方向，和食物鏈箭頭的方向一定相同嗎？', 'Ms Xiaozhen asks: does the direction of a hawk chasing a rabbit match a food-chain arrow?'),
        body: P('食物鏈按取食關係連起來，箭頭由食物指向取食者，表示食物中的物質與能量轉移，不是追逐方向。多條食物鏈交錯形成食物網。同種動物吃不同食物時，可能出現在不同營養階層；移除一個資源，影響會沿取食關係傳遞。', 'A food chain links feeding relationships. Arrows point from food to its consumer, showing transfer of matter and energy, not the chase direction. Interlinked chains form a food web. The same species may occupy different trophic levels when eating different foods; loss of a resource can affect connected organisms.'),
        reading: P('先用「被吃的是誰？」確認箭頭起點，再找「吃它的是誰？」。課本以臺灣檫樹、寬尾鳳蝶幼蟲與黃山雀說明食物依存；黃山雀還有其他食物來源，可能緩衝某項食物減少的影響。模型另用植物、兔、鼠與鷹示意，不是把原圖物種替換後宣稱真實族群。多條路徑可能提供替代，不能推出食物網越複雜就一定越穩定。', 'First identify what is eaten, then its eater. The textbook uses Taiwan sassafras, broad-tailed swallowtail larvae and yellow tits to discuss dependence; other foods may buffer the tit against a reduction in one resource. The model uses plants, rabbits, mice and hawks as separate symbols, not as measured substitutes for textbook species. Alternative routes can help, but complexity does not guarantee stability.'),
        closure: P('食物 → 取食者；交錯的取食路徑形成食物網。', 'Food → consumer; interconnected feeding routes form a food web.'),
        record: P('畫一條三個角色的食物鏈並標方向。比較單一路徑與交錯路徑，寫出一個可能緩衝影響的理由及一個限制。', 'Draw and label a three-role chain. Compare single and linked routes, noting one possible buffering mechanism and one limitation.'),
        study: P('切換路徑，再降低生產者資源。先以箭頭找出直接取食者，再討論間接影響；亮點稀疏只提示資源情境，不是量到族群下降百分比。', 'Switch routes and reduce producer resources. Follow arrows to direct consumers before discussing indirect effects; fewer dots indicate a resource scenario, not measured population decline.'),
        pics: [pic('Im247_1059.png', P('黃山雀照片', 'Yellow tit photograph'), 129, P('這是課本食物依存例中的黃山雀影像。照片未包含完整食物鏈箭頭，也不能顯示牠所有食物來源；取食資訊見課本與本頁文字。', 'This yellow tit belongs to the textbook food-dependence example. The photo alone contains neither the complete arrows nor all its food sources; consult the feeding information in the text.'))], pages: [128, 129], initial: { mode: 0, network: 0 }
      }),
      lesson(E.foodweb, {
        id: 'energy-flow', title: P('能量為何變少？', 'Why is less energy passed onward?'), sub: P('營養階層與能量流動', 'Trophic levels and energy flow'),
        hook: P('曉臻老師問：兔子吃到的能量，會全部被鷹吃到嗎？兔子活動時又用了什麼？', 'Ms Xiaozhen asks: does a hawk receive all the energy eaten by a rabbit? What powers the rabbit’s activity?'),
        body: P('每個營養階層都要維持生命活動，呼吸作用會散熱；有些有機物未被取食或隨排遺進入碎屑途徑。因此只有部分能量傳到下一個營養階層。約十分之一是常用教學概略值，不是所有食物鏈都固定 10%。能量單向流動，最終散熱，不會像碳元素一樣循環利用。', 'Each trophic level uses energy for life processes, with respiration releasing heat. Some organic matter remains uneaten or enters detrital pathways through waste. Only part of the energy reaches the next level. Roughly one tenth is a common teaching approximation, not a universal 10% rule. Energy flows one way and ultimately dissipates as heat rather than cycling like carbon.'),
        reading: P('模型以能量單位和選定的傳遞比例比較三個階層。1000 單位取 10% 時，下兩層為 100 與 10；這不是個體數或體重，也不是原圖量測。未到下一層的能量不能全部說成立刻散熱，碎屑仍可供分解者利用，最後也散熱。能量金字塔比較時，實際研究還須一致的面積與時間單位。多數生態系能量始於日光，但無光熱泉可有利用化學能的生產者。', 'The model compares three levels using illustrative energy units and chosen transfer fractions. Starting with 1000 at 10% gives 100 and 10, not animal counts, body masses or source measurements. Energy not reaching the next level is not all immediate heat: decomposers can use detritus before energy ultimately dissipates. Real energy-pyramid comparisons also require consistent area and time units. Most ecosystems begin with sunlight, while dark vents may support chemical-energy producers.'),
        closure: P('傳遞比例是概略示例；能量流動並散熱，不循環。', 'Transfer fractions are illustrative; energy flows and dissipates rather than cycles.'),
        record: P('固定起始能量，記錄 5%、10%、20% 三組結果。把「沒傳到下一層」的途徑分成散熱與碎屑利用，寫出模型限制。', 'Hold input energy fixed and record results for 5%, 10% and 20%. Separate heat from detrital routes among energy not passed onward, and state a model limitation.'),
        study: P('先預測下一層數值再切比例。將亮點方向與碳循環比較，解釋為什麼分解者存在也不會讓已散失的熱重新變成食物能量。', 'Predict the next-level value before changing the fraction. Compare flow direction with the carbon cycle and explain why decomposers do not recycle dissipated heat into food energy.'),
        pics: [pic('Im275_1306.png', P('草食動物照片', 'Herbivore photograph'), 131, P('課本用草食動物引出取食、維生與能量傳遞。照片不是能量金字塔量測，不能從動物大小或照片亮度推算能量。', 'The textbook herbivore illustrates feeding, life processes and transfer. The photograph is not an energy measurement; size or brightness does not quantify energy.'))], pages: [130, 131], initial: { mode: 1, efficiency: 10 }
      }),
      lesson(E.carbon, {
        id: 'carbon-cycle', title: P('碳去了哪裡？', 'Where did the carbon go?'), sub: P('物質的碳循環', 'Cycling of carbon matter'),
        hook: P('曉臻老師問：落葉分解後，裡面的碳真的不見了嗎？植物只吸收二氧化碳嗎？', 'Ms Xiaozhen asks: does carbon disappear when a leaf decomposes? Do plants only take in carbon dioxide?'),
        body: P('光合作用讓二氧化碳中的碳進入生產者的有機物；攝食把含碳物質傳到消費者。各階層的遺體和排遺可被分解者利用。生產者、消費者與分解者都會呼吸，讓部分碳以二氧化碳回到環境。追蹤的是碳元素，不是同一個分子或能量繞圈。', 'Photosynthesis incorporates carbon from CO₂ into producer organic matter. Feeding transfers carbon-containing matter to consumers. Decomposers use remains and waste from all levels. Producers, consumers and decomposers all respire, returning some carbon as CO₂. We trace carbon atoms, not an unchanged molecule or energy travelling in a circle.'),
        reading: P('少部分含碳物質在合適條件下長期埋藏，部分形成化石燃料；燃燒可較快把地層中的碳送回大氣，兩條路徑時間尺度不同。模型省略海洋交換等細節，亮點和箭頭粗細不是通量。即使是封閉生態瓶，也需要光等能量輸入，不能因物質可循環就說能量也封閉或永動。原圖是課本碳循環的地景底圖，箭頭與標籤並未包含於萃取PNG。', 'Some carbon is buried for long periods under suitable conditions, and some forms fossil fuels. Combustion can return it much faster, so the routes use different timescales. The model omits ocean exchange and other details; dots and arrow widths do not measure flux. Even a closed ecosphere needs energy input such as light; cycling matter does not make it energetically closed or perpetual. The extracted original is the carbon diagram’s landscape base, without its page-level arrows and labels.'),
        closure: P('碳元素在不同物質間循環；能量持續輸入並散熱。', 'Carbon cycles among substances; energy enters continually and dissipates as heat.'),
        record: P('選三條碳路徑，各寫起點、終點與過程。指出植物回到大氣的一條路徑，並比較埋藏與燃燒的時間尺度。', 'For three carbon routes, record start, end and process. Identify one route from plants back to air and compare burial with combustion timescales.'),
        study: P('分別選光合、攝食、呼吸、分解與埋藏／燃燒。確認各階層遺體都可進碎屑途徑，並用一句話區分「碳循環」與「能量流動」。', 'Select photosynthesis, feeding, respiration, decomposition and burial/combustion. Check that remains from every level can enter detritus, then distinguish carbon cycling from energy flow in one sentence.'),
        pics: [pic('Im278_1357.png', P('碳循環地景原圖（未含頁面箭頭）', 'Carbon-cycle landscape original (without page arrows)'), 132, P('萃取影像保留課本地景與生物圖像，不含PDF文字層的過程標籤及完整箭頭。請勿把底圖當成完整碳循環；機制由獨立新增模型呈現。', 'This extracted image retains landscape and organisms but not the PDF text-layer process labels or complete arrows. It is not a complete carbon-cycle diagram; mechanisms appear in the separate added model.'))], pages: [132, 133], initial: { path: 0 }
      })
    ] },
    { id: 'ecology_interactions', title: P('一起生活，一定互相幫忙嗎？', 'Does living together always help both sides?'), subtitle: P('生物交互關係與生物防治', 'Biological interactions and biological control'), cover: 'Im2081_4577.png', coverSource: { page: 136 }, tabs: [
      lesson(E.relations, {
        id: 'predation', title: P('追逐牽動誰？', 'Who is affected by a chase?'), sub: P('掠食與族群影響', 'Predation and population effects'),
        hook: P('曉臻老師問：獵物變少，掠食者一定在同一瞬間、同一比例變少嗎？', 'Ms Xiaozhen asks: if prey decline, must predators decline at the same instant and by the same fraction?'),
        body: P('掠食者取得養分，獵物受害，兩者族群可能互相影響。獵物較多可能供應更多食物；掠食壓力增加又可能使獵物下降。變化通常有時間差，也受其他食物、疾病、遷移與環境影響，不能把每組掠食關係都套成固定週期。', 'Predators gain food and prey are harmed, so their populations may affect one another. More prey can provide more food, while increased predation may reduce prey. Responses can lag and also depend on alternative food, disease, migration and conditions. Not every predator–prey pair follows a fixed cycle.'),
        reading: P('課本猞猁與野兔曲線是用來理解可能的先後變動，不應當成本模型測出的曲線。本互動用正負符號說明一次關係，沒有計算族群週期。食物箭頭從獵物指向掠食者，和追捕方向不同；要驗證族群波動，需同區、同方法、長期的雙方數量資料，而不只一張捕食照片。', 'The textbook lynx–hare curves illustrate possible lagged changes; they are not curves measured by this model. This interaction uses signs to explain a relationship and does not calculate population cycles. Food arrows go from prey to predator, unlike chase direction. Testing population fluctuations needs comparable, long-term counts of both populations in the same region, not one predation photo.'),
        closure: P('掠食者受益、獵物受害；族群回應還要看時間與環境。', 'Predators benefit and prey are harmed; population responses depend on timing and conditions.'),
        record: P('記錄兩者的正負影響，畫出食物箭頭；列出兩項判斷族群波動所需、但照片沒有的資料。', 'Record effects on both organisms and draw the food arrow. List two missing kinds of evidence needed to assess population fluctuations.'),
        study: P('確認模型箭頭起點，再查看原圖。解釋正負號描述利害，不是固定的死亡百分比；如果獵物減少，替代食物可能如何改變後續影響？', 'Check where the model arrow starts, then inspect the original. Explain that signs indicate effects, not fixed death percentages. How might alternative foods change the consequences of reduced prey?'),
        pics: [prey], pages: [134], initial: { relation: 0 }
      }),
      lesson(E.relations, {
        id: 'competition', title: P('資源不夠分', 'When resources are limited'), sub: P('種內與種間競爭', 'Within- and between-species competition'),
        hook: P('曉臻老師問：兩棵樹不會打架，也可能互相競爭嗎？', 'Ms Xiaozhen asks: can two trees compete without fighting?'),
        body: P('競爭發生在生物共同利用有限資源時，可在同種個體間，也可在不同物種間。例如植物競爭光、水、空間與礦物質，動物可競爭食物或配偶。雙方的負號是相對於沒有競爭者的情況，可利用資源減少，不表示雙方必定死亡。', 'Competition occurs when organisms share a limited resource, within or between species. Plants may compete for light, water, space and minerals; animals for food or mates. Minus signs mean reduced access relative to having no competitor, not inevitable death of both organisms.'),
        reading: P('「生活在同一地點」不夠判定競爭，還要指出共同需要且不足的資源。模型把共用資源改為較充足，表示壓力可能降低，不是量測競爭係數。原圖羚羊為同種競爭例，模型用植物甲、乙示意，符號未指明物種；討論種內或種間時需另外交代身分。', 'Sharing a place alone does not prove competition: identify the shared resource and its limitation. Increasing model resources suggests reduced pressure, not a measured competition coefficient. The antelope original illustrates within-species competition, whereas model Plant A and Plant B are symbols without specified species; supply identities when discussing within- or between-species cases.'),
        closure: P('先指出共用且有限的資源，才判定競爭。', 'Identify a shared, limited resource before concluding competition.'),
        record: P('記一個種內與一個種間競爭例子，明確列出資源。比較兩種資源情境，寫出哪些判斷仍需實地證據。', 'Record one within-species and one between-species example with the resource identified. Compare the two resource scenarios and note what still needs field evidence.'),
        study: P('先選競爭，再改資源。用「相對於沒有另一方」解釋 −／−；若同一地點的兩種動物吃不同食物，還需要哪些資訊才能說牠們競爭？', 'Select competition and change resources. Explain −/− relative to an absence of the other organism. What further information is needed when two local animals eat different foods?'),
        pics: [pic('Im2076_4540.png', P('羚羊競爭照片', 'Antelope competition photograph'), 135, P('課本以羚羊爭奪配偶說明同種競爭。照片呈現行為，不提供族群生存率或資源壓力的數值。', 'The textbook uses antelopes competing for mates as within-species competition. This behavioural photo provides no survival-rate or resource-pressure values.'))], pages: [135], initial: { relation: 1 }
      }),
      lesson(E.relations, {
        id: 'symbiosis', title: P('一起生活的代價', 'The effects of close association'), sub: P('共生與寄生', 'Symbiosis and parasitism'),
        hook: P('曉臻老師問：植物長在樹上，就一定在偷樹的養分嗎？', 'Ms Xiaozhen asks: must a plant growing on a tree be stealing the tree’s nutrients?'),
        body: P('用雙方的影響比較關係：互利共生是 +／+；片利共生是 +／0；寄生是寄生者 +、寄主 −。鳥巢蕨附生在樹上可取得生長位置，課本情境中樹無明顯利害，不等於寄生。寄生通常是持續依賴寄主取得養分，也不一定立即使寄主死亡。', 'Compare effects on both partners: mutualism is +/+, commensalism +/0, and parasitism benefits the parasite while harming its host. A bird’s-nest fern gains a growing position on a tree, with no evident effect on the tree in the textbook example; attachment alone is not parasitism. Parasites often depend on a host over time without immediately killing it.'),
        reading: P('先問各自得到什麼、失去什麼，再選關係，不用「看起來很親密」作判準。0 指這個情境未見明顯影響，不表示任何時間、任何條件都絕對無影響。寄生與掠食都可有 +／−，要再看生活方式與歷程。課本另有寄生蜂作生物防治的補充，某些寄生蜂幼蟲最後會使寄主死亡，不能把「不立即殺死」說成沒有例外。', 'Ask what each gains or loses rather than judging by apparent closeness. Zero means no evident effect in this context, not an absolute absence under every condition. Predation and parasitism can share +/− signs but differ in their process and way of life. Some parasitoid wasp larvae used in biological control eventually kill their hosts, so delayed killing is not an exception-free rule.'),
        closure: P('同住不等於互利，附生不等於寄生；利害要有證據。', 'Association is not automatically mutualism, nor attachment parasitism; effects need evidence.'),
        record: P('各記一個 +／+、+／0、+／− 的例子及受益或受害機制。另列「照片可見」與「需觀察驗證」兩欄。', 'Record examples of +/+, +/0 and +/− with their mechanisms. Separate visible photo evidence from effects needing investigation.'),
        study: P('切換互利、片利與寄生，逐一讀雙方名稱再對正負號。用鳥巢蕨例說明生長位置與直接吸取寄主養分的差別。', 'Switch among mutualism, commensalism and parasitism, checking names before signs. Use the fern example to distinguish a growing position from directly taking host nutrients.'),
        pics: [anemone, pic('Im2082_4578.png', P('鳥巢蕨附生照片', 'Epiphytic bird’s-nest fern photograph'), 136, P('課本以附生鳥巢蕨與樹作片利共生例子。附著位置可見，但「樹未受明顯影響」需要情境資料，不是只看照片就測得。', 'The textbook treats this fern–tree association as commensalism. Attachment is visible, but absence of evident tree effects requires contextual evidence.'))], pages: [136, 137], initial: { relation: 2 }
      }),
      lesson(E.relations, {
        id: 'biocontrol', title: P('讓天敵幫忙', 'Let natural enemies help'), sub: P('生物防治與風險', 'Biological control and its risks'),
        hook: P('曉臻老師問：讓瓢蟲吃蚜蟲，就能保證沒有害蟲、也沒有其他影響嗎？', 'Ms Xiaozhen asks: do ladybirds eating aphids guarantee no pests and no other effects?'),
        body: P('生物防治利用其他生物減少害蟲影響，例如瓢蟲捕食蚜蟲。它運用掠食、寄生等生物關係，但不保證消滅所有害蟲，也不代表完全無風險。要先評估目標、作用方式與非目標生物，不能隨意引進或野放外來生物。', 'Biological control uses organisms to reduce pest impacts, such as ladybirds feeding on aphids. It uses relationships including predation and parasitism but guarantees neither eradication nor zero risk. Evaluate targets, mechanisms and nontarget effects; do not introduce or release nonnative organisms casually.'),
        reading: P('課本有鴨在稻田活動、瓢蟲捕食與寄生蜂等例子。挑選方法時，要問害蟲是否真的造成問題、天敵是否作用在目標、以及是否傷害其他生物。措施後要用相同調查方式追蹤害蟲、天敵與作物損傷；「有天敵」是措施存在，「有成效」要由證據支持。模型的亮點不計算防治成功率。', 'Textbook examples include ducks in rice fields, ladybirds and parasitoid wasps. Ask whether the pest is causing damage, whether the control acts on it, and whether other organisms are harmed. Track pests, enemies and crop damage with consistent surveys. Presence of an enemy is a measure, not evidence of success; moving model dots do not calculate effectiveness.'),
        closure: P('生物防治要評估風險並監測，不能把外來引進當成萬靈丹。', 'Biological control needs risk assessment and monitoring, not indiscriminate introductions.'),
        record: P('設計防治前後的記錄表：害蟲、天敵、作物損傷與非目標生物。寫明調查時間與方法，提出一項安全限制。', 'Design a before-and-after record for pests, enemies, crop damage and nontarget organisms, with timing, method and one safety restriction.'),
        study: P('將生物防治與一般掠食比較，指出共同的取食方向與不同的管理目的。列出證明防治有效還需要的觀察，不以模型動畫當結果。', 'Compare biological control with predation: identify the shared food direction and the different management purpose. List observations needed to establish effectiveness without using animation as data.'),
        pics: [pic('Im2102_4676.png', P('瓢蟲捕食照片', 'Ladybird feeding photograph'), 138, P('課本生物防治的取食例子。一次捕食影像不能證明整田有效、完全無害或可免除後續監測。', 'A feeding example from textbook biological control. One image does not demonstrate field-wide success, zero harm or no need for monitoring.'))], pages: [134, 138], initial: { relation: 5 }
      })
    ] },
    { id: 'ecology_habitats', title: P('換個環境，誰能住下來？', 'Who can live in a different habitat?'), subtitle: P('陸域、水域與校園調查', 'Land, water and schoolyard investigations'), cover: 'Im2180_5300.png', coverSource: { page: 151 }, tabs: [
      lesson(E.habitat, {
        id: 'land-habitats', title: P('雨量與溫度', 'Rainfall and temperature'), sub: P('陸域生態系', 'Terrestrial ecosystems'),
        hook: P('曉臻老師問：沙漠一定很熱、凍原一定沒有生命嗎？', 'Ms Xiaozhen asks: must deserts be hot and tundra be lifeless?'),
        body: P('森林、草原、沙漠與凍原的生物組成，受到水分、溫度、光照及乾擾等影響。森林有植被層次；草原多草本；沙漠的關鍵是乾旱，不一定高溫；凍原常受低溫與短生長季限制，仍有地衣、草本與矮灌木等。', 'Water, temperature, light and disturbance influence communities in forests, grasslands, deserts and tundra. Forests have vegetation layers; grasslands are herb-dominated. Deserts are defined by aridity, not necessarily heat. Tundra has cold and short growing seasons but still supports lichens, herbs and low shrubs.'),
        reading: P('臺灣山地隨高度有不同林相，可比較溫度與植被，但課本的海拔帶是概略介紹，不適合套成全球固定界線。草原還會受放牧與火影響，不能只看一個雨量門檻。沙漠生物各有適應，駱駝的駝峰儲存脂肪，不是水箱。模型更改因子是提出問題，不會計算樹種存活率，也不會一按就真實完成生態系轉換。', 'Taiwan’s mountain forests vary with elevation and temperature, but textbook vegetation bands are approximate rather than global boundaries. Grazing and fire also shape grasslands; one rainfall threshold is insufficient. Desert adaptations vary: camel humps store fat, not tanks of water. Model settings generate questions, not survival rates or instantaneous real ecosystem transformations.'),
        closure: P('用多個環境因子解釋組成，不用單一標籤決定所有生物。', 'Use multiple conditions to explain communities, not one label for all organisms.'),
        record: P('選兩種陸域生態系，比較水分、溫度、植被與一項可能的生存限制；把實際資料與模型設定分開。', 'Compare water, temperature, vegetation and one possible constraint in two land ecosystems, separating actual evidence from model settings.'),
        study: P('先選森林、再比較草原、沙漠與凍原。改變一個因子後，提出可驗證的問題；不要以模型樹數判斷真實多樣性。', 'Compare forest, grassland, desert and tundra. Change one factor and pose a testable question; model tree counts do not measure real diversity.'),
        pics: [pic('Im2111_4735.png', P('闊葉林照片', 'Broadleaf forest photograph'), 141, P('課本森林例子的闊葉林影像。可見植被外觀，不能從照片直接量出雨量、溫度或固定的林相界線。', 'A broadleaf forest from the textbook. Vegetation appearance is visible, but rainfall, temperature and fixed forest boundaries are not measured by the image.'))], pages: [139, 140, 141, 142, 143, 144, 145], initial: { habitat: 0 }
      }),
      lesson(E.habitat, {
        id: 'freshwater', title: P('池塘與溪流', 'Ponds and streams'), sub: P('淡水環境比較', 'Comparing fresh waters'),
        hook: P('曉臻老師問：都是淡水，為什麼溪流和池塘看到的生物不一樣？', 'Ms Xiaozhen asks: if both are fresh water, why might their organisms differ?'),
        body: P('淡水生態系包括池塘等靜水與溪流等流水。流速、水深、透光、溶氧、底質和岸邊輸入，都可影響生物組成。池塘的水面植物與水底條件可能不同；溪流生物要面對流水，岸邊落葉也能提供食物網的有機物。', 'Freshwater ecosystems include still ponds and flowing streams. Flow, depth, light, dissolved oxygen, substrate and bank inputs can affect communities. Surface plants and bottom conditions can differ in ponds. Stream organisms face moving water, while fallen leaves from banks can supply organic matter to food webs.'),
        reading: P('先看原圖的環境，再問需要哪些測量。看起來清澈不等於沒有汙染；溪流也不必然比池塘溶氧高，需看溫度、流動與生物活動等。模型淡水地景合併了多種條件，不區分每條溪流的河段，也未量溶氧。比較時一次改一項，其餘條件盡量一致，避免把兩個地點的差異全歸給水流。', 'Observe the original setting, then decide what to measure. Clear water is not proof of no pollution, and streams do not invariably have more oxygen than ponds; temperature, flow and biological activity matter. The freshwater model combines conditions without specifying river sections or measuring oxygen. Change one factor while controlling others, rather than attributing every difference between two sites to flow.'),
        closure: P('同為淡水，流動與多種環境因子仍可不同。', 'Fresh waters can differ in flow and many other conditions.'),
        record: P('做池塘／溪流比較表：原圖可見特徵、需要量測的因子、預測與驗證方法各一欄。', 'Make a pond/stream comparison with columns for visible traits, measurements needed, predictions and testing methods.'),
        study: P('在淡水情境切換光與水位，提出水生植物可能分布在哪裡的理由。再看池塘、溪流原圖；本模型沒有流速控制，不要把動畫速度當作水流測值。', 'Change light and water level in fresh water and reason about plant distribution. Compare pond and stream originals; there is no flow-rate control, so animation speed is not a flow measurement.'),
        pics: [pond, stream], pages: [146, 147], initial: { habitat: 4 }
      }),
      lesson(E.habitat, {
        id: 'coasts-ocean', title: P('河海交界到深海', 'From river mouths to the deep sea'), sub: P('河口與海洋生態系', 'Estuarine and marine ecosystems'),
        hook: P('曉臻老師問：漲潮時住處被水淹、退潮時又露出來，生物要面對哪些改變？', 'Ms Xiaozhen asks: what changes must organisms face when their home is submerged at high tide and exposed at low tide?'),
        body: P('河口在河海交界，鹽度和水位隨潮汐、河川入流等變動；紅樹林、彈塗魚與招潮蟹是課本例子。潮間帶是高潮與低潮之間的區域，不只存在河口。海洋各深度的光照和環境不同，透光上層可有光合作用，深處仍有不同能量途徑支持生命。', 'Estuary salinity and water level change with tides and river inflow; textbook examples include mangroves, mudskippers and fiddler crabs. The intertidal zone lies between high- and low-tide levels, not only at estuaries. Ocean conditions and light differ with depth: sunlit upper water supports photosynthesis, while other energy routes support life deeper down.'),
        reading: P('紅樹林落葉可進入碎屑食物網；不是所有河口動物都只吃落葉。海洋透光深度還受水的透明度影響，不能用大陸棚約 200 m 當光合作用的固定界線。深海生物可利用沈降有機碎屑；熱泉附近另有利用化學能的生產者。大王具足蟲吞食殘骸是清除者、消費者，不應因此改叫菌類式的分解者。', 'Mangrove litter can enter detrital food webs, but not every estuarine animal eats only litter. Light penetration also depends on water clarity; a roughly 200 m shelf depth is not a fixed photosynthesis boundary. Deep-sea organisms may use sinking detritus, and vents can support chemical-energy producers. Giant isopods ingest remains as scavenging consumers, not fungal-style decomposers.'),
        closure: P('河口變動、潮間帶曝露、海洋光照分層；深處沒有日光也不等於沒有生命。', 'Estuaries vary, intertidal habitats alternate exposure, and ocean light changes with depth; darkness does not mean lifelessness.'),
        record: P('各記一項河口、潮間帶與深海的限制和可能的食物來源，標出依原圖觀察或閱讀推論。', 'Record one constraint and possible food source for an estuary, intertidal zone and deep sea, marking photo observation versus reading-based inference.'),
        study: P('切換河口與海洋，比較水位與光照情境。原圖僅是局部一次景象；說明還需哪些時間與水質資料，才能判斷某個物種適合生活。', 'Switch between estuary and ocean and compare water-level and light scenarios. Originals show particular scenes; what time-series and water data are needed to assess suitability for a species?'),
        pics: [estuary, reef], pages: [148, 149, 150, 151, 156, 157], initial: { habitat: 5 }
      }),
      lesson(E.habitat, {
        id: 'schoolyard-survey', title: P('校園就是研究場', 'The schoolyard is a research site'), sub: P('控制條件與觀察紀錄', 'Controls and observation records'),
        hook: P('曉臻老師問：陰影下看到的昆蟲比較多，是因為陰影，還是你在那裡找比較久？', 'Ms Xiaozhen asks: did shade have more insects, or did you simply search there longer?'),
        body: P('選校園遮蔭處與開闊處，以相同範圍、方法、觀察時間和努力程度比較。記錄光照、溫度、濕度等環境因子與可辨認的生物，照片附地點、日期與時間。不拔植物、不翻動或捕捉危險生物，不靠近車道或水邊；不確定物種先記特徵，不急著猜名字。', 'Compare shaded and open schoolyard sites with equal area, method, duration and effort. Record light, temperature, humidity and identifiable organisms, with place, date and time for photos. Avoid uprooting plants, disturbing or catching dangerous organisms, traffic and unsafe water edges. Record traits for unknown organisms rather than guessing names.'),
        reading: P('課本校園實驗還比較風與土壤酸鹼，可由老師安排器材與一致程序。生物未被觀察到，不等於確定不存在；可能躲藏、活動時間不同或辨識不足。重複調查有助區分偶然差異，但「遮蔭處比較多」仍不能單憑兩地比較證明因果。模型條件供先提出預測，球數與樹數不是校園實測資料。', 'The textbook investigation also compares wind and soil acidity using teacher-arranged instruments and consistent procedures. Not observing an organism does not prove absence: it may be hidden, active at another time or hard to identify. Repeats reduce chance differences, but a two-site comparison alone does not prove that shade caused a difference. Model settings generate predictions, not schoolyard survey counts.'),
        closure: P('公平比較方法，再把觀察、推論與待查問題分開。', 'Compare methods fairly and separate observations, inferences and open questions.'),
        record: P('建立兩地調查記錄：範圍／日期時間／觀察分鐘／環境因子／物種或特徵／數量／辨識信心。最後寫一項方法限制與下一次改進。', 'Record site boundaries, date/time, minutes searched, conditions, species or traits, counts and identification confidence for two sites. Finish with one limitation and improvement.'),
        study: P('先固定水分與溫度，只改光照，寫預測；再提出真實調查的記錄方式。比較實際結果與預測，不能把模型顯示當成調查完成。', 'Hold water and temperature fixed, change light and write a prediction. Plan the actual survey record, then compare evidence with your prediction rather than treating the model as completed fieldwork.'),
        pics: [pic('Im2431_5628.png', P('校園環境照片', 'Schoolyard environment photograph'), 152, P('課本校園調查的環境照片。不同調查地點需自己記錄邊界、時間與條件；不能用這張照片代替自己的觀察數據。', 'A setting from the textbook schoolyard investigation. Record boundaries, time and conditions at your own sites; this photo does not replace your observations.'))], pages: [152, 153], initial: { habitat: 7 }
      })
    ] }
  ];
  window.NewEcologyUnits = units;
  if (document.body.dataset.book === 'ecology') {
    const u = units.find(q => q.id === document.body.dataset.unit);
    if (!u) throw new Error('Unknown ecology unit: ' + document.body.dataset.unit);
    u.assetDir = 'assets/biology/ecology_originals_1010_v1/';
    u.cover = u.assetDir + u.cover;
    u.family = P('生命與環境', 'Life and environment');
    u.bookName = P('生物圈', 'Biosphere');
    LivingBook.register(u);
  }
})();
