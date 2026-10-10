/* Additive bilingual lessons only; original artwork and existing model code are unchanged.
 * Source: teacher-provided 人類與環境.pdf, 28 PDF pages, printed pages 160–187.
 * Source SHA-256: c885b72b0a81573e4b92358e77dafe148adcf9e870223a3ccb995c5b98a6bfa2
 * Image/page pairs were individually viewed against source_info.json and large_objects.json.
 * Covers below are metadata only. Original creators and licences are unconfirmed, not invented.
 */
(() => {
  'use strict';
  const E = window.EcosphereModels, M = window.NewBookModels;
  const P = (zh, en) => [zh, en];
  const assetDir = 'assets/biology/environment_originals_1010_v1/';
  const rights = P('原圖取自老師提供的《人類與環境》；原圖作者及個別授權未確認，不宣稱開放授權。', 'Original from the teacher-provided Human Beings and the Environment textbook; its individual creator and licence are unconfirmed, and no open licence is claimed.');
  const boundary = P('模型的數值、倍率、時間、符號數與移動路徑皆為教學示意，非原書實測、現地調查或成效預測。', 'Model values, factors, times, symbol counts and paths are teaching illustrations, not source measurements, field surveys or forecasts of effectiveness.');
  const pic = (file, name, page, text) => ({ file, name, page, text: P(text[0] + '\n' + rights[0], text[1] + '\n' + rights[1]), sourceInfo: { source: '人類與環境.pdf', file, pdfPage: page - 159, printedPage: page, author: null, licence: null, pageVerification: 'Individually viewed original image and rendered printed page' } });

  function lesson(factory, o) {
    const sources = o.pics.map(q => ({ name: q.name, page: q.page }));
    for (const page of o.pages) if (!sources.some(q => q.page === page)) sources.push({ name: P('《人類與環境》教學參考', 'Human Beings and the Environment textbook reference'), page });
    const tab = factory({ ...o, sources });
    // Delegate multiple original images to the existing gallery API, separate from model view.
    const originals = tab.modelKind ? M.gallery({ title: o.title, pics: o.pics }) : null;
    const live = tab.explain;
    return { ...tab, sources,
      init: () => ({ ...(originals ? originals.init() : {}), ...tab.init() }),
      controls(s) { return originals && s.view === 1 ? [...tab.controls(s).filter(g => !g.items.some(it => it.key === 'photo')), ...originals.controls(s)] : tab.controls(s); },
      act(s, k, v) { if (originals && (k === 'pick' || k === 'compare')) originals.act(s, k, v); else tab.act(s, k, v); },
      draw(c, s, t, D) { if (originals && s.view === 1) originals.draw(c, s, t, D); else tab.draw(c, s, t, D); },
      explain(s) {
        const q = originals && s.view === 1 ? originals.explain(s) : live(s);
        const modelNote = tab.modelKind && s.view !== 1 ? boundary : P('原圖為靜態觀察；數位縮放不改變拍攝倍率，也不提供真實尺寸比較。', 'Originals are static observations; digital zoom changes neither the capture magnification nor the basis for comparing real sizes.');
        return { title: q.title, text: P(q.text[0] + '\n\n觀察任務：' + o.study[0] + '\n\n' + modelNote[0], q.text[1] + '\n\nObservation task: ' + o.study[1] + '\n\n' + modelNote[1]) };
      }
    };
  }

  const frogs = [
    pic('Im8_80.png', P('斯文豪氏赤蛙：褐色個體', 'Swinhoe’s frog: brown individual'), 162, P('課本圖例標示為同種蛙的個體。觀察斑紋、體色與背景；照片沒有基因檢測，不能由一種顏色推定一個基因型。', 'The textbook identifies individuals of one frog species. Observe markings, colour and background; there is no genetic test linking each colour to a genotype.')),
    pic('Im10_82.png', P('斯文豪氏赤蛙：綠斑個體', 'Swinhoe’s frog: green-marked individual'), 162, P('這是同種個體的另一種外觀，不是另一物種的證據。外觀差異可能同時受遺傳與環境影響，照片亮度也不等於性狀差異。', 'A different appearance within the same species is not evidence of a different species. Both heredity and environment can affect traits; photo brightness alone is not a trait difference.')),
    pic('Im12_84.png', P('斯文豪氏赤蛙：綠背個體', 'Swinhoe’s frog: green-backed individual'), 162, P('與另外兩張比較時，只記可見特徵。三張照片的顯示大小與背景不同，不能用來量真實體長或比較存活率。', 'Compare visible traits with the other two images. Different display sizes and backgrounds cannot establish actual body lengths or survival rates.'))
  ];
  const forest = pic('Im15_96.png', P('森林原圖', 'Forest original'), 163, P('可見樹木、地表植被與山地背景；這是生態系類型的例子，不是完整物種名錄或遺傳調查。', 'Trees, ground vegetation and a mountain background are visible. This exemplifies an ecosystem type, not a complete species inventory or genetic survey.'));
  const desert = pic('Im16_97.png', P('沙漠原圖', 'Desert original'), 163, P('觀察沙丘與少量可見植被。畫面生物少不表示沒有生命；需要相同方法的調查才能比較兩地多樣性。', 'Observe dunes and sparse visible vegetation. Few visible organisms do not mean no life; comparable surveys are needed to compare diversity between sites.'));
  const grassland = pic('Im17_98.png', P('草原原圖', 'Grassland original'), 163, P('草本、樹木與動物同時出現。先區分植被外觀與物種辨識，不以照片動物總數作為物種數。', 'Herbs, trees and animals occur together. Separate vegetation appearance from species identification; the number of animals is not the number of species.'));
  const stream = pic('Im18_99.png', P('淡水溪流原圖', 'Freshwater stream original'), 163, P('觀察溪水、底質及岸邊植被。單張影像不能量流速、溶氧，也看不到所有水中生物。', 'Observe water, substrate and bank vegetation. One image measures neither flow nor dissolved oxygen and cannot show all aquatic organisms.'));
  const reef = pic('Im19_100.png', P('珊瑚礁與魚原圖', 'Reef and fish original'), 163, P('觀察魚的外形與珊瑚構造；珊瑚蟲是動物。此照片不是水質測量，也不是可與其他照片直接相比的物種普查。', 'Observe fish forms and coral structures; coral polyps are animals. This is neither a water-quality measurement nor a species census directly comparable with the other photos.'));
  const rainforest = pic('Im25_226.png', P('熱帶雨林原圖', 'Rainforest original'), 164, P('課本用此圖與棕櫚園提出探究問題。請先描述可見植被層次，再提出待查問題；這張影像沒有物種數、基因資料或拍攝前後的連續紀錄。', 'The textbook pairs this with the plantation to pose an inquiry. Describe visible vegetation layers and identify questions to investigate; there are no species counts, genetic data or continuous before-and-after records.'));
  const plantation = pic('Im26_229.png', P('棕櫚園原圖', 'Palm plantation original'), 164, P('可見較規整的植被排列。這是課本的比較圖，不能假定兩圖是同一地點同一鏡頭，也不能只由綠色面積算多樣性。原書探究問題留待學生討論。', 'Vegetation has a more regular arrangement. These are textbook comparison images, not established same-camera views of the same site. Green area alone does not quantify diversity; the source inquiry remains open for discussion.'));
  const leopardcat = pic('Im33_317.png', P('石虎原圖', 'Leopard cat original'), 166, P('課本以石虎討論道路、農地開發與棲地。照片顯示一隻個體，不能提供臺灣總數、活動路徑或目前保育等級。', 'The textbook uses leopard cats to discuss roads, agriculture and habitat. One individual cannot establish Taiwan’s population, movement paths or present conservation status.'));
  const tuna = pic('Im34_343.png', P('黑鮪拍賣原圖', 'Bluefin tuna auction original'), 167, P('這張是課本的黑鮪拍賣現場，不是鯊魚照片。魚獲影像可引出資源利用問題，但不足以判定某海域目前資源量或捕撈是否過度。', 'This is the textbook bluefin tuna auction, not a shark photograph. Catches raise resource-use questions but cannot establish current stock size or overfishing in a particular sea.'));
  const yew = pic('Im35_344.png', P('紅豆杉原圖', 'Yew original'), 167, P('課本討論觀賞、研究或利用價值與野外採集壓力。照片不是藥物使用說明；不採摘、不試吃，也不自行提煉。', 'The textbook discusses ornamental, research or use values alongside pressure from wild collection. This is not a medication guide; do not collect, taste or extract it.'));
  const factory = pic('Im43_389.png', P('工業排放情境原圖', 'Industrial emission scene original'), 169, P('課本將此影像用於空氣汙染。可見煙囪與排放外觀，但顏色不能判定各種汙染物成分、濃度或空氣品質指標。', 'The textbook uses this scene for air pollution. Chimneys and emissions are visible, but colour cannot identify pollutant composition, concentration or an air-quality index.'));
  const river = pic('Im46_698.png', P('水體異常顏色原圖', 'Unusually coloured water original'), 169, P('課本以此圖討論廢水排放。只記顏色與地景，不憑外觀認定化學物質或飲用安全；不接觸、採集或聞未知水樣。', 'The source discusses wastewater. Record colour and setting without inferring chemicals or drinking safety; do not touch, collect or smell unknown water.'));
  const eutrophication = pic('Im47_699.png', P('優養化水域原圖', 'Eutrophic water original'), 169, P('課本以此圖顯示大量藻類和藍綠菌的水面。影像不是氮、磷、溶氧或藻種檢測；本課只用原圖與示意模型，不培養汙水。', 'The textbook illustrates water with abundant algae and cyanobacteria. This is not a nutrient, oxygen or species test; use the original and model, without culturing polluted water.'));
  const snail = pic('Im51_1562.png', P('福壽螺與卵原圖', 'Apple snail and eggs original'), 171, P('課本以福壽螺說明不當引入與野放。照片沒有測出繁殖率或影響大小；不要由卵的顏色直接辨認所有螺類，更不要觸摸或清除。', 'The source uses apple snails to discuss introduction and release. This photo measures neither reproduction nor impacts; egg colour alone does not identify every snail, and students should not touch or remove them.'));
  const crayfish = pic('Im52_1566.png', P('美國螯蝦原圖', 'Red swamp crayfish original'), 171, P('課本外來種例子。外來與入侵的判斷要看原產地、建立擴散和危害證據；外觀或一張照片不夠，不自行捕捉或野放。', 'A textbook nonnative-species example. Assess origin, establishment, spread and harmful effects; appearance or one photo is insufficient, and students should not catch or release animals.'));
  const coral = pic('Im57_1590.png', P('珊瑚白化原圖', 'Coral bleaching original'), 173, P('課本標示部分珊瑚白化。白化涉及共生藻或色素減少，不等於已證實所有珊瑚死亡；照片不能給出海溫、確切原因或未來恢復率。', 'The textbook identifies bleaching in part of this coral scene. Loss of symbiotic algae or pigments does not prove all corals are dead; the image gives neither temperature, a definitive cause nor recovery probabilities.'));
  const treefrog = pic('Im61_1615.png', P('斑腿樹蛙原圖', 'Nonnative tree frog original'), 172, P('課本討論與原生蛙的競爭等影響。不能把外形近似當作確認，也不能由此圖推算現在分布；疑似紀錄交由老師協助查證。', 'The source discusses effects including competition with native frogs. Similarity is not confirmed identification and the image does not map current distribution; ask the teacher to help verify uncertain records.'));
  const iguana = pic('Im63_1617.png', P('綠鬣蜥原圖', 'Green iguana original'), 172, P('這是照片原有的局部構圖，不補畫頭部或改比例。課本用於棄養後的生態影響；照片沒有族群數量或現行管理規定，不靠近或捕捉。', 'This is the original partial framing; no head is invented and proportions are unchanged. The source discusses ecological effects of abandonment; it provides neither population totals nor current management rules. Do not approach or catch it.'));
  const turtle = pic('Im72_1684.png', P('綠蠵龜原圖', 'Green sea turtle original'), 174, P('課本用綠蠵龜引出物種與棲地一起保育。照片不是即時追蹤，也沒有提供目前 IUCN 等級；觀察時不觸摸、追逐或餵食。', 'The source introduces conserving species together with habitat. This is not live tracking or a current IUCN assessment; observe without touching, chasing or feeding.'));
  const fishladder = pic('Im1_16.png', P('大東勢溪魚梯原圖', 'Dadongshi Stream fishway original'), 160, P('課本說明以分段落差改善河道連通。照片顯示設施，不提供使用率、通過成功率或所有魚種的適用性；模型廊道是空間類比，不是魚梯工程圖。', 'The source describes smaller height steps to improve river connectivity. The photo shows a structure, not use, passage success or suitability for all fish. The model corridor is a spatial analogy, not a fishway engineering drawing.'));
  const cups = pic('Im117_1991.png', P('循環杯歸還原圖', 'Reusable cup return original'), 179, P('原圖上的中文是原有店家標示，完整保留；僅用作內容圖，不用作無字封面。觀察歸還動作，不把這張照片當成所有商店目前的服務或環境成效。', 'Chinese shop lettering is part of the unchanged original, used within the lesson rather than as a text-free cover. Observe returning a cup; the image does not establish present services at all shops or environmental benefits.'));
  const biking = pic('Im121_2022.png', P('公共自行車原圖', 'Public bicycle original'), 179, P('課本生活行動例子，可討論交通替代與可行條件；照片沒有每公里排放或目前租借規則，圖像本身不是減碳計算。', 'A source example of everyday action for discussing travel alternatives and feasibility. The photo supplies neither emissions per kilometre nor current rental rules and does not calculate carbon savings.'));
  const ceremony = pic('Im142_2279.png', P('達悟族招魚祭原圖', 'Tao fish-calling ceremony original'), 184, P('這是課本的招魚祭影像，不是漁獲或魚種照片。儀式意義和捕魚規範要由閱讀與族人脈絡理解，不能只從服飾推定整個族群的所有生活方式。', 'This shows the source fish-calling ceremony, not catch or fish species. Interpret ritual and fishing practices through the reading and community context, not clothing or assumptions about all community members.'));
  const vessels = pic('Im145_2298.png', P('植物素材器皿原圖', 'Plant-material vessels original'), 185, P('課本列竹子、林投葉、檳榔葉鞘等素材；不是每件器皿都可只憑照片辨出材料。影像沒有分解時間、衛生檢測或生命週期資料。', 'The source lists bamboo, pandan leaves and betel leaf sheaths; a photo alone does not identify every vessel’s material. It gives no decomposition times, hygiene tests or life-cycle data.'));
  const woven = pic('Im146_2301.png', P('阿里鳳鳳原圖', 'Alifongfong original'), 185, P('課本以林投葉編織的阿里鳳鳳介紹阿美族生活器物。照片可見編織結構，製作脈絡與名稱來自閱讀；不憑圖片推定所有族群共用同一做法。', 'The textbook describes the Amis alifongfong woven from pandan leaves. Weaving is visible; the name and cultural context come from the reading. Do not assume every Indigenous community uses the same practice.'));

  const units = [
    { id: 'environmental_diversity', title: P('生物多樣性與重要性', 'Biodiversity and its importance'), subtitle: P('個體、物種、棲地，都是多樣性的一部分', 'Variation within species, among species and across habitats'), cover: 'Im19_100.png', coverSource: { page: 163 }, tabs: [
      lesson(E.diversity, {
        id: 'genetic-variation', title: P('同種也不一樣', 'One species, different individuals'), sub: P('遺傳多樣性', 'Genetic diversity'),
        hook: P('曉臻老師問：三隻青蛙顏色不同，就一定是三種青蛙嗎？', 'Ms Xiaozhen asks: do three differently coloured frogs have to be three species?'),
        body: P('生物多樣性涵蓋遺傳、物種與生態系三個面向。同種個體可以有不同的基因組合，稱為遺傳多樣性。課本用斯文豪氏赤蛙的個體差異引出這個面向；外觀不同不必然是不同物種，也不能只由體色讀出基因型。', 'Biodiversity includes genetic, species and ecosystem diversity. Individuals of one species can carry different genetic combinations: genetic diversity. The textbook introduces this through variation among Swinhoe’s frogs. Different appearances need not mean different species, and colour alone cannot identify a genotype.'),
        reading: P('保持遺傳差異，可能保留面對環境變動的不同反應；不是每個性狀都在所有環境有利。照片中的體色、背景與光線須分開觀察。模型用色彩作基因差異符號，沒有測定基因，也不是青蛙的真實體色模擬。三個面向在本課作概述，不延伸成高中遺傳計算。', 'Genetic variation can retain different responses to changing conditions, but no trait is advantageous everywhere. Separate body colour from lighting and background. Model colours symbolise genetic differences rather than measured genes or simulated frog pigmentation. The three aspects are introduced without advanced genetic calculations.'),
        closure: P('同種個體可以不同；觀察外形與確認遺傳差異是兩件事。', 'Individuals of one species can differ; observing appearance and establishing genetic differences require different evidence.'),
        record: P('記下三圖可見的體色與斑紋，另列一項照片無法確認的遺傳資訊。比較兩種模型情境，寫出符號代表什麼。', 'Record visible colours and markings in three images and one genetic fact the photos cannot establish. Compare two model scenarios and explain their symbols.'),
        study: P('操作一：維持「遺傳多樣性」，切換較單一／較多樣，辨認同種差異符號。操作二：切到原圖，依序選三隻蛙，兩張比較並記錄「看見／需查證」。', 'Action 1: keep genetic diversity selected and compare uniform/varied scenarios, identifying within-species symbols. Action 2: select the three original frogs, compare pairs and record visible versus unverified features.'),
        pics: frogs, pages: [162, 163], initial: { level: 0, variety: 1 }
      }),
      lesson(E.diversity, {
        id: 'species-diversity', title: P('多幾隻，還是多幾種？', 'More individuals or more species?'), sub: P('物種多樣性與食物網', 'Species diversity and food webs'),
        hook: P('曉臻老師問：同一種魚增加一百隻，和多出另一種魚，是同一種改變嗎？', 'Ms Xiaozhen asks: are a hundred more fish of one species and one additional species the same change?'),
        body: P('物種多樣性關心同一區域有哪些物種及其組成，不只是個體總數。增加同種個體不等於增加物種數。不同物種透過取食、競爭等關係形成互動；有替代食物來源可能緩衝部分變動，但不能只憑種類多就保證永遠穩定。', 'Species diversity concerns which species occur in an area and their composition, not simply the total number of individuals. More individuals of one species do not add species. Feeding and competition connect organisms; alternative foods may buffer some changes, but richness alone does not guarantee stability.'),
        reading: P('比較前需說清楚地點、面積、時間與調查方法。珊瑚礁照片可觀察不同外形，但未辨認的魚不能每隻算一種；看不到的生物也不表示不存在。模型的形狀代表物種，顏色只作符號，並未計算真實食物網穩定度或提供物種數估計。', 'Specify place, area, time and survey method before comparing. Different forms are visible in a reef photo, but unidentified fish cannot each be counted as separate species; unseen organisms may still be present. Model shapes represent species and colours are symbols, without estimates of real species numbers or food-web stability.'),
        closure: P('個體數和物種數分開；多樣性比較還要看組成與方法。', 'Separate individual counts from species counts, and compare composition using consistent methods.'),
        record: P('為兩種模型情境各記「形狀類別／個體符號」；原圖另記可辨認特徵與辨識信心，不編造完整物種名錄。', 'For each scenario record shape categories and individual symbols. For the original, record distinguishing traits and identification confidence without inventing a complete inventory.'),
        study: P('操作一：固定「物種多樣性」，切換差異程度，比較類別與總數。操作二：切換到遺傳面向後再回來，說明兩種「不同」指的是什麼；以原圖提出公平調查方法。', 'Action 1: hold species diversity selected and compare variation scenarios, separating categories from totals. Action 2: compare with the genetic view and explain the two meanings of difference; propose a fair survey for the original.'),
        pics: [reef, grassland], pages: [162, 163], initial: { level: 1, variety: 1 }
      }),
      lesson(E.diversity, {
        id: 'ecosystem-diversity', title: P('不同住處，不同條件', 'Different homes, different conditions'), sub: P('生態系多樣性', 'Ecosystem diversity'),
        hook: P('曉臻老師問：把森林的生物都搬到沙漠，就能讓兩地一樣多樣嗎？', 'Ms Xiaozhen asks: would moving all forest organisms to a desert make the two places equally diverse?'),
        body: P('森林、沙漠、草原、淡水與海洋具有不同的環境及群集，是生態系多樣性的例子。水分、光照、溫度與底質等條件影響生物能否生活。保育不只保留物種名單，也要維護支持生命的環境與相互作用。', 'Forests, deserts, grasslands, fresh waters and oceans have different conditions and communities, illustrating ecosystem diversity. Water, light, temperature and substrate influence where organisms can live. Conservation maintains the environment and interactions supporting life as well as species.'),
        reading: P('同一張圖可能同時含陸地與水域，生態系邊界要依研究目的界定。照片只呈現一處一時，不代表每種環境的所有情況，也不可將沙漠描述成沒有生物。模型以立體地景表示環境差異，樹木與水面是符號，不是實際面積、降雨或物種調查。', 'An image may contain both land and water; ecosystem boundaries depend on the investigation. A single scene cannot represent every instance of a habitat, and deserts are not lifeless. The three-dimensional landscape symbolises differences rather than actual areas, rainfall or species surveys.'),
        closure: P('多樣的環境支持不同生命；棲地與生物一起保護。', 'Different conditions support different lives; conserve organisms together with habitat.'),
        record: P('五種環境各列一項照片可見條件與一項需量測的因子；選兩種比較，不以畫面大小代表真實面積。', 'For each of five habitats list one visible condition and one measurement needed. Compare two without equating display size with real area.'),
        study: P('操作一：維持生態系面向，切換差異程度並旋轉觀察水陸關係。操作二：在原圖逐一選五種環境、兩張比較，記錄可能的生存條件與待查資料。', 'Action 1: keep the ecosystem view, compare variation scenarios and rotate to inspect land–water relationships. Action 2: select all five originals, compare pairs and record possible living conditions and missing evidence.'),
        pics: [forest, desert, grassland, stream, reef], pages: [163], initial: { level: 2, variety: 1 }
      }),
      lesson(E.diversity, {
        id: 'biodiversity-value', title: P('一片綠，代表什麼？', 'What does a green landscape tell us?'), sub: P('生活資源與生物價值', 'Resources and the value of life'),
        hook: P('曉臻老師問：看起來都很綠，我們還需要觀察什麼，才能比較兩片土地？', 'Ms Xiaozhen asks: if two landscapes look green, what else should we observe before comparing them?'),
        body: P('食物、衣料、木材、橡膠、研究資源與遊憩都和生物多樣性有關。遺傳資源可供作物育種研究，生物也具有文化、美感與本身存在的價值。資源有用途不代表可以無限制採集，保育也不只看能否換成金錢。', 'Food, fibres, timber, rubber, research materials and recreation connect to biodiversity. Genetic resources can support crop breeding, and organisms have cultural, aesthetic and intrinsic value. Usefulness does not justify unlimited collection, and conservation is not solely about monetary value.'),
        reading: P('講義重點補充，印刷頁 164 探究：熱帶雨林開發成棕櫚園後，多樣性可能怎麼變？可能造成什麼影響？請用照片提出觀察、推論與待查資料，先保留問題，不預填解答。模型的森林與園地是另一組概念情境，不是原圖重建，不能用它替代原地調查。醫藥研究價值不等於植物可自行食用。', 'Source inquiry, printed p. 164: how might biodiversity change when rainforest becomes a palm plantation, and what effects might follow? Record observations, inferences and evidence needed, leaving the inquiry unanswered. Model forest and plantation scenarios are separate conceptual examples, not reconstructions or field surveys. Medical research value does not imply a plant is safe to consume.'),
        closure: P('綠色覆蓋不是多樣性的測量；利用、文化與生命價值都值得考量。', 'Green cover is not a biodiversity measurement; consider use, culture and the value of life.'),
        record: P('製作「原圖可見／提出的問題／需要資料」三欄表，保留頁 164 的探究作答空間；另選一項生活資源，說明與生物的關係。', 'Make visible evidence, questions and data-needed columns, leaving space for the p. 164 inquiry. Choose one everyday resource and explain its biological connection.'),
        study: P('操作一：切換模型的較單一／較多樣情境，列出它呈現與省略的資訊。操作二：切到原圖比較雨林與棕櫚園，再看紅豆杉；只用證據支持判斷，不將模型當講義答案。', 'Action 1: compare uniform and varied model scenes, listing what they show and omit. Action 2: compare rainforest and plantation originals, then inspect yew; justify observations with evidence, without treating a model as the worksheet answer.'),
        pics: [rainforest, plantation, yew], pages: [164, 167, 180], initial: { level: 3, variety: 1 }
      })
    ] },
    { id: 'environmental_threats', title: P('人類活動與生存危機', 'Human activities and threats to life'), subtitle: P('追蹤棲地、資源、汙染與氣候的影響', 'Trace effects on habitat, resources, pollution and climate'), cover: 'Im57_1590.png', coverSource: { page: 173 }, tabs: [
      lesson(E.threats, {
        id: 'habitat-fragmentation', title: P('道路切開了什麼？', 'What does a road divide?'), sub: P('棲地減少與破碎化', 'Habitat loss and fragmentation'),
        hook: P('曉臻老師問：道路兩邊還有樹，動物的家就沒有受影響嗎？', 'Ms Xiaozhen asks: if trees remain on both sides of a road, is the animal’s home unaffected?'),
        body: P('開發可讓棲地面積減少、品質下降，也可把連續棲地分成小塊，稱為破碎化。生物移動、覓食、繁殖與躲避危險的條件可能受影響。課本用石虎引出道路與農地重疊的問題；不能只保住一隻動物卻忽略牠需要的生活空間。', 'Development may reduce habitat area, lower its quality and split continuous habitat into fragments. Movement, feeding, breeding and shelter can be affected. The textbook uses leopard cats to discuss overlap with roads and farmland; protecting an individual requires attention to its living space.'),
        reading: P('講義重點補充，印刷頁 166：棲地完整與破碎對動物生存有何影響？你能為石虎保育做什麼？先各自提出證據與問題，不預填探究答案。模型用兩側地景和移動符號示意；現實動物仍可能冒險跨路。廊道要有合適入口與相連棲地，不能彌補全部棲地損失。', 'Source questions, printed p. 166: how does intact versus fragmented habitat affect survival, and what could you do for leopard cat conservation? Develop evidence and questions without a prefilled answer. Model patches and symbols illustrate movement; real animals may still risk crossing a road. Corridors need suitable entrances and habitat, and cannot replace all lost area.'),
        closure: P('棲地的面積、品質與連通都要看；設施存在不等於保育成功。', 'Assess habitat area, quality and connectivity; a structure alone does not establish success.'),
        record: P('記錄連續、破碎、加入廊道三種情境的移動差異，另列兩項真正驗證成效所需的資料，保留原書提問作答。', 'Record movement in continuous, fragmented and corridor scenarios; list two field measurements needed to assess success, leaving the source questions for your response.'),
        study: P('操作一：固定棲地破碎，切換較低／較高壓力比較空間。操作二：在較高壓力加入／移除廊道並旋轉，追蹤可通過的位置；再看石虎照片，區分個體影像與移動證據。', 'Action 1: select fragmentation and compare lower/higher pressure. Action 2: add/remove a corridor at higher pressure and rotate to trace possible passage; distinguish the leopard cat photo from movement evidence.'),
        pics: [leopardcat], pages: [165, 166], initial: { threat: 0, pressure: 1, corridor: 0 }
      }),
      lesson(E.threats, {
        id: 'resource-use-and-introduction', title: P('取走與帶進的代價', 'The costs of removal and introduction'), sub: P('過度利用與外來入侵', 'Overuse and biological invasions'),
        hook: P('曉臻老師問：資源想拿就拿、寵物想放就放，影響會只停在眼前嗎？', 'Ms Xiaozhen asks: do the effects of taking resources and releasing pets stop at what we can see?'),
        body: P('採捕若長期超過族群補充，可能造成資源下降；利用還要注意非目標生物及棲地。人類運輸、引入與棄養也可能把生物帶到原本沒有的地方。外來種不全是入侵種；若建立、擴散並造成危害，才需討論入侵影響，不能只憑來源或外觀判斷。', 'Removal persistently exceeding replenishment can reduce resources, with nontarget organisms and habitat also needing attention. Transport, introduction and abandonment may move organisms beyond their native range. Nonnative species are not all invasive; assess establishment, spread and harm rather than origin or appearance alone.'),
        reading: P('課本黑鮪、紅豆杉、福壽螺與美國螯蝦分別引出利用與引入的問題；斑腿樹蛙、綠鬣蜥是其他案例。影響可能包括競爭、取食與棲地改變，不一定是完全沒有天敵。講義頁 167 的捕撈期間與漁法問題留給學生討論；書上禁漁日期、物種狀況、歷史數量不當作最新公告。外來種管理由專業評估，不自行捕殺、食用或野放。', 'Bluefin tuna, yew, apple snails and crayfish introduce resource-use and introduction issues; tree frogs and iguanas provide further cases. Competition, feeding and habitat change can matter, not only an absence of predators. Leave the p. 167 question about seasons and fishing methods for discussion. Source dates, statuses and historic numbers are not current notices. Management needs professional assessment; do not kill, eat or release wildlife.'),
        closure: P('利用看補充與影響；外來看建立、擴散及危害，不棄養不野放。', 'Compare use with replenishment and impacts; assess establishment, spread and harm, and avoid abandonment or release.'),
        record: P('分兩表記「採捕壓力／可能後果／所需調查」與「引入途徑／可能交互作用／待查證據」。原圖只記可見外觀，不推算族群數。', 'Record pressure, possible consequences and survey needs separately from introduction routes, interactions and missing evidence. Describe visible originals without estimating populations.'),
        study: P('操作一：選過度採捕，切換壓力並記錄模型符號改變，不算安全採收比例。操作二：改選外來種影響，切換壓力，再逐張看福壽螺、螯蝦與其他案例；說明哪些影響需調查。', 'Action 1: select overharvesting and compare pressures without deriving a safe harvest fraction. Action 2: select nonnative effects and compare pressures, then inspect the snail, crayfish and other originals; identify impacts requiring investigation.'),
        pics: [tuna, yew, snail, crayfish, treefrog, iguana], pages: [162, 167, 171, 172], initial: { threat: 1, pressure: 1 }
      }),
      lesson(E.threats, {
        id: 'pollution-eutrophication', title: P('養分多，魚一定好？', 'Do more nutrients always help fish?'), sub: P('汙染與水域優養化', 'Pollution and eutrophication'),
        hook: P('曉臻老師問：水裡藻類長得很旺，為什麼魚反而可能缺氧？', 'Ms Xiaozhen asks: why might fish lack oxygen when algae grow abundantly?'),
        body: P('空氣與水汙染可來自工業、農業及生活活動。氮、磷等營養鹽大量進入水體，可能促使藻類及藍綠菌增生；遮光與有機物分解耗氧會影響水生生物，嚴重時造成缺氧。這是優養化的機制，不能與難排除物質沿食物鏈放大混為一談。', 'Industrial, agricultural and everyday activities can pollute air and water. Excess nutrients such as nitrogen and phosphorus can stimulate algae and cyanobacteria. Shading and oxygen use during decomposition affect aquatic organisms, potentially causing severe oxygen depletion. This eutrophication mechanism differs from biomagnification of poorly eliminated substances.'),
        reading: P('日間光合作用可能產氧，呼吸與分解則耗氧；要判斷水質需看時間、深度、溶氧與營養鹽等資料。酸雨、臭氧層受損與細懸浮微粒有不同途徑，不用同一個原因包辦。照片色彩不是汙染物檢測，本模型只示意營養鹽情境。講義頁 169 水資源提問保留，不提供飲水判斷或醫療建議；不採集、培養或製造汙染水樣。', 'Photosynthesis can release oxygen during daylight, while respiration and decomposition consume it; assess time, depth, oxygen and nutrients. Acid rain, ozone-layer damage and fine particles involve different pathways. Photo colour is not a pollutant test and the model illustrates nutrients only. Leave the p. 169 water-resource questions open, without drinking-safety or medical advice; do not collect, culture or create polluted samples.'),
        closure: P('過量養分、藻量、分解與溶氧相連；外觀不能代替水質檢測。', 'Excess nutrients, algae, decomposition and oxygen are connected; appearance cannot replace water-quality tests.'),
        record: P('畫「輸入養分／藻類增生／遮光與分解耗氧／可能影響」因果圖，圈出模型未量測的項目。比較三張原圖各能支持與不能支持的判斷。', 'Draw nutrient input, algal growth, shading/decomposition and possible impacts, marking unmeasured links. Record what each of three originals can and cannot establish.'),
        study: P('操作一：選營養鹽汙染，切換壓力，說明綠色斑塊與缺氧機制。操作二：切到原圖比較優養化水面、異色水體與工業場景，列出各自需檢測的因子。', 'Action 1: select nutrient pollution and compare pressures, explaining green patches and oxygen depletion. Action 2: compare eutrophic water, coloured water and industrial originals and list measurements each requires.'),
        pics: [eutrophication, river, factory], pages: [168, 169], initial: { threat: 3, pressure: 1 }
      }),
      lesson(E.magnification, {
        id: 'concentration-in-food-chain', title: P('總量多，濃度就高？', 'Does more total mean more concentrated?'), sub: P('生物累積與生物放大', 'Bioaccumulation and biomagnification'),
        hook: P('曉臻老師問：大魚體內的物質總量較多，就能證明每公斤含量也較高嗎？', 'Ms Xiaozhen asks: if a large fish contains more of a substance in total, must it contain more per kilogram?'),
        body: P('同一個體從環境與食物攝入物質，攝入相對於排除造成體內累積，稱為生物累積。生物放大則比較食物鏈不同營養階層的濃度：某些難代謝或排除的物質，可能在較高階消費者有較高濃度。濃度是物質量除以組織質量，總量較多不等於濃度較高。', 'Bioaccumulation is buildup within an organism through uptake from its environment and food relative to elimination. Biomagnification compares concentrations across trophic levels: some poorly metabolised or eliminated substances can reach higher concentrations in higher consumers. Concentration is amount divided by tissue mass; a larger total is not necessarily a higher concentration.'),
        reading: P('模型四框代表等質量組織，單位／kg 是自訂教學濃度；2 倍、4 倍不是自然界固定倍率，也不是講義頁 170 的 ppm 數據。切換容易排除情境只是對照，不代表所有物質都按同一速率下降。原圖水體的顏色不能測出體內毒物。講義頁 170 的歷史水俁症探究留待學生推論，不預填食物鏈答案、不提供飲食安全或診療建議。', 'Four model boxes represent equal tissue mass; units/kg are invented teaching concentrations. Factors of two and four are neither universal laws nor the p. 170 ppm values. The readily eliminated case is a comparison, not a universal decline rate. Water colour cannot measure tissue contaminants. Leave the historical Minamata inquiry for student reasoning without prefilled food-chain answers, dietary-safety or treatment advice.'),
        closure: P('個體隨時間看累積；跨階層看濃度放大，先確認比較的質量。', 'Accumulation follows an organism over time; magnification compares trophic concentrations, with mass specified.'),
        record: P('記三組「物質性質／起始濃度／示例倍率／四階層濃度」，每組標「示意」。另分別寫個體追蹤與跨階層比較需要的資料。', 'Record three sets of properties, starting concentration, illustrative factor and four concentrations, labelled schematic. List data needed for an individual time series and a trophic comparison.'),
        study: P('操作一：固定起始濃度，切換難排除與容易排除，讀每公斤含量。操作二：維持難排除，分別改起始濃度與倍率，先預測再檢查；用「等質量」解釋不能只比點數總量。', 'Action 1: hold initial concentration fixed and compare poorly/readily eliminated cases, reading content per kilogram. Action 2: change starting concentration and factor separately in the poorly eliminated case, predicting then checking; explain why equal mass matters.'),
        pics: [river, tuna], pages: [170], initial: { persistent: 1, base: 1, factor: 4 }
      }),
      lesson(E.climate, {
        id: 'climate-ecological-change', title: P('變暖，生命跟得上嗎？', 'Can life keep up with warming?'), sub: P('溫室效應與生態變動', 'Greenhouse effect and ecological change'),
        hook: P('曉臻老師問：適合生活的地方往山上移，所有生物都搬得過去嗎？', 'Ms Xiaozhen asks: if suitable conditions shift uphill, can every organism move with them?'),
        body: P('溫室氣體吸收地表放出的部分紅外線，並向各方向再放射；地球仍會向太空散熱。氣候變動可能改變適生範圍、開花繁殖時間與水分條件。珊瑚受壓力時可能失去部分共生藻或色素而白化；白化不等於已死亡，後續要看壓力與恢復條件。', 'Greenhouse gases absorb some surface infrared radiation and emit in all directions; Earth still loses energy to space. Climate changes can alter suitable ranges, flowering/breeding times and water conditions. Stressed corals may lose symbiotic algae or pigments and bleach; bleaching is not death, and outcomes depend on stress and recovery conditions.'),
        reading: P('適生範圍變動與人為外來引入是不同過程，卻可能一起影響群集；不能將所有遷移物種叫入侵種。模型氣體情境與假設升溫各自比較概念，不從氣體符號數算攝氏溫度。照片及課本事件不是最新海溫或年度統計，一張照片也不能確認變遷原因。講義頁 173 的事件討論保留，請提出可能影響與所需證據。', 'Range shifts and human introductions are distinct processes that may jointly affect communities; migrating species are not automatically invasive. Gas and warming settings compare concepts separately, without converting symbol counts to Celsius. Source images and events are not current temperatures or annual statistics, and one photo cannot establish the cause of change. Keep the p. 173 event discussion open, proposing possible effects and evidence needed.'),
        closure: P('輻射機制、假設情境與實際預測分開；生物遷移還受棲地連通限制。', 'Separate radiation mechanisms, scenarios and forecasts; habitat connectivity also constrains movement.'),
        record: P('記錄兩種氣體情境的紅外線路徑，以及三種假設升溫的適生帶；每列註明不是實測。列出珊瑚照片無法回答的海溫與後續追蹤問題。', 'Record infrared paths in two gas scenarios and suitable zones in three warming scenarios, labelled unmeasured. List temperature and follow-up questions the coral image cannot answer.'),
        study: P('操作一：選輻射路徑，切換氣體情境，指出仍向太空放射的路徑。操作二：選生態影響，切換三種假設升溫，比較移動限制；再看珊瑚原圖，分清模型與影像證據。', 'Action 1: compare gas settings in radiation view and identify outgoing radiation to space. Action 2: compare three warming scenarios in ecological view and discuss movement constraints; distinguish these models from the coral original.'),
        pics: [coral, reef], pages: [172, 173], initial: { focus: 0, gas: 1, scenario: 1 }
      })
    ] },
    { id: 'environmental_conservation', title: P('保育與永續生活', 'Conservation and sustainable living'), subtitle: P('從棲地連通到每天的選擇', 'From habitat connections to everyday choices'), cover: 'Im1_16.png', coverSource: { page: 160 }, tabs: [
      lesson(E.conservation, {
        id: 'conservation-evidence', title: P('保護一隻，還要保護什麼？', 'What else must we protect?'), sub: P('物種、棲地與合作', 'Species, habitat and cooperation'),
        hook: P('曉臻老師問：海龜不被捕捉，但產卵的沙灘消失了，保育就完成了嗎？', 'Ms Xiaozhen asks: is turtle conservation complete if capture stops but nesting beaches disappear?'),
        body: P('保育是有計畫地管理自然資源，防止破壞與過度利用。物種需要覓食、繁殖與遷移的環境，保育須兼顧棲地、遺傳差異與生物交互作用。課本以綠蠵龜串起研究、保護區、社區參與及跨地區合作；不是把動物隔離保存就完成工作。', 'Conservation is planned management of natural resources to prevent destruction and overuse. Organisms need feeding, breeding and movement habitats, alongside genetic variation and biological interactions. The textbook uses green turtles to connect research, protected areas, communities and cooperation across regions; isolating animals is not a complete solution.'),
        reading: P('講義重點補充，印刷頁 175–177 用國際合作、貿易管理、瀕危評估與棲地保護說明不同工具。這是書載案例，不是現行法律清單；不沿用書中海龜等級、保護區總數、會員數與罰則當最新資訊。評估是依據資料判斷風險，法律則有其適用範圍；兩者不能直接畫等號。頁 174 問國際單位如何知道瀕危生物數，留待學生提出資料需求。', 'Printed pp. 175–177 illustrate cooperation, trade management, threat assessment and habitat protection as different tools. These are source examples, not a current legal list; turtle status, site totals, membership numbers and penalties are not presented as current. Evidence-based risk assessment and laws have distinct roles and scope. Leave the p. 174 question about establishing threatened-species numbers for students to identify data needs.'),
        closure: P('保育結合物種、棲地、研究與合作；有措施還要有證據。', 'Conservation combines species, habitat, research and cooperation; measures need evidence.'),
        record: P('列海龜生活需要與可能壓力，記兩種措施情境及追蹤指標。把「書載案例／需要查最新資料」分開，保留講義提問。', 'List turtle needs and possible pressures, comparing measure scenarios and monitoring indicators. Separate source cases from facts needing current verification and leave the inquiry open.'),
        study: P('操作一：選保護棲地，切換未採取／採取措施，列出圖像能說與不能說的事。操作二：切換後續追蹤，再比較減少乾擾；為每種措施選一項真正需蒐集的證據。', 'Action 1: compare habitat protection with and without the measure, listing what the image can and cannot establish. Action 2: switch monitoring, then compare disturbance reduction, choosing evidence needed for each measure.'),
        pics: [turtle, leopardcat], pages: [174, 175, 176, 177], initial: { measure: 0, enabled: 1, monitor: 1 }
      }),
      lesson(E.conservation, {
        id: 'habitat-connections', title: P('修一條路，誰走得過？', 'Who can use a connection?'), sub: P('魚梯、廊道與監測', 'Fishways, corridors and monitoring'),
        hook: P('曉臻老師問：魚梯看起來像樓梯，魚就一定知道入口、也一定游得上去嗎？', 'Ms Xiaozhen asks: if a fishway looks like stairs, must fish find its entrance and swim through?'),
        body: P('棲地連通讓生物有機會到達不同生活場所。河道障礙與道路切割造成的限制不同，魚梯和陸地廊道須各自符合目標物種的需求。入口、落差、流況或植被等設計與相連棲地品質，會影響實際使用；設施完成不等於所有生物都受益。', 'Connectivity can help organisms reach different living sites. River barriers and roads impose different constraints; fishways and land corridors must fit their target organisms. Entrances, height differences, flows or vegetation, together with connected habitat quality, affect use. Completion does not guarantee benefits for every species.'),
        reading: P('講義重點補充，印刷頁 160：除了到上游產卵的魚，其他魚也需要魚梯嗎？哪些建設乾擾動物移動？保留問題，先提出需要的生活史與移動資料。立體模型是陸地跨越的示意，只用作「連通」類比，不表示魚梯流速、坡度或工程尺寸。實際成效可討論使用、通過、存活與繁殖等不同證據，不能只拍到一隻就宣稱族群恢復。', 'Printed p. 160 asks whether fish other than upstream spawners need fishways, and which structures interrupt animal movement. Keep these questions open and identify life-history and movement data needed. The three-dimensional land crossing is a connectivity analogy, not fishway flow, slope or engineering dimensions. Use, successful passage, survival and breeding provide different evidence; one observed animal does not establish population recovery.'),
        closure: P('連通要符合物種需求、連到合適棲地，並追蹤實際結果。', 'Connections must suit organisms, reach suitable habitat and be monitored for actual outcomes.'),
        record: P('比較有無廊道的移動，另為魚梯列「照片所見／想驗證的事／所需資料」。保留原書兩個問題，不套用陸地模型的速度。', 'Compare movement with/without a corridor. For the fishway record visible evidence, questions to test and required data, leaving both source questions open and avoiding model speed estimates.'),
        study: P('操作一：固定連通棲地，切換措施並旋轉找入口與兩端。操作二：切換監測，再看魚梯原圖，提出能區分「找到入口」與「順利通過」的觀察紀錄。', 'Action 1: hold connectivity selected, compare measure settings and rotate to find entrances and endpoints. Action 2: switch monitoring and inspect the fishway original; propose records distinguishing finding an entrance from successful passage.'),
        pics: [fishladder, leopardcat], pages: [160, 166], initial: { measure: 1, enabled: 1, monitor: 1 }
      }),
      lesson(M.gallery, {
        id: 'everyday-actions', title: P('小選擇，怎麼追蹤？', 'How can we track everyday choices?'), sub: P('生活行動與公民參與', 'Everyday action and citizen participation'),
        hook: P('曉臻老師問：今天少用一個杯子，我們要怎麼知道行動真的持續了？', 'Ms Xiaozhen asks: how can we tell whether avoiding a disposable cup today becomes a lasting action?'),
        body: P('日常可減少一次用品、在合適條件使用大眾運輸或自行車、不棄養不放生，也可參與有規範的公民觀察。選一項可持續的行動，先記錄原本的情況，再以相同方法追蹤；環保口號或照片不是成效數據。', 'Everyday actions include reducing disposables, suitable public or bicycle transport, responsible pet care and structured citizen observations. Choose a feasible action, record a baseline and follow it with the same method; slogans or images are not effectiveness data.'),
        reading: P('循環杯需要歸還與清洗，交通選擇也受距離、路線和安全條件限制；整體環境影響要看材料、使用次數、運輸與處理，不能保證任何單一商品都最好。講義頁 179 問循環杯能否成功及原因、頁 181 問一日垃圾紀錄，留給學生實際觀察。頁 178 的政府、科學家與農民角色討論也保留不同立場；不預填結論。路死動物記錄以老師安排的安全資料為主，不進車道或搬動屍體。', 'Reusable cups require return and washing; transport depends on distance, routes and safety. Overall impacts depend on materials, reuse, transport and disposal, not a guarantee that one product is always best. Leave the p. 179 cup-success inquiry and p. 181 daily-waste record for observations. Retain the p. 178 government/scientist/farmer discussion without a preset conclusion. Use teacher-arranged safe roadkill records rather than entering traffic or handling carcasses.'),
        closure: P('挑可持續的行動，用一致紀錄追蹤，再依證據調整。', 'Choose feasible actions, track them consistently and adapt using evidence.'),
        record: P('記一日原本產生的一次用品數，選一項替代行動，記日期、情境、做到次數與困難；不把次數自行換成固定減碳量。', 'Record a baseline day’s disposables and one alternative, with dates, context, completed actions and barriers; do not convert counts into fixed carbon savings.'),
        study: P('操作一：依序選循環杯、自行車與海龜原圖，各找「行動」或「保育對象」。操作二：用兩張比較，列出兩種行動的可行條件，再設計一週的相同紀錄欄位。', 'Action 1: inspect cup, bicycle and turtle originals to identify actions or conservation targets. Action 2: compare pairs, list feasibility conditions and design consistent weekly records.'),
        pics: [cups, biking, turtle], pages: [178, 179, 181, 186, 187]
      }),
      lesson(M.matrix, {
        id: 'traditional-knowledge', title: P('生活智慧怎麼讀？', 'How do we read living knowledge?'), sub: P('文化脈絡與永續思考', 'Cultural context and sustainability'),
        hook: P('曉臻老師問：一張祭典或器皿照片，能告訴我們全部傳統規矩嗎？', 'Ms Xiaozhen asks: can one photo of a ceremony or vessel tell us every traditional practice?'),
        body: P('課本以達悟族飛魚季與阿美族植物器皿，介紹在地知識、季節、資源與生活的關係。傳統知識有特定族群與地方脈絡，不把所有原住民族說成同一種做法。比較時尊重名稱與知識來源，把照片可見、閱讀提供與需要詢問族人的資訊分開。', 'The textbook uses Tao flying-fish traditions and Amis plant vessels to explore links among local knowledge, seasons, resources and life. Practices belong to particular communities and places; Indigenous peoples do not all share one method. Respect names and knowledge sources, distinguishing visible evidence, textual information and questions for community members.'),
        reading: P('書中季節性捕魚規範可用於討論利用與資源補充，但不當成所有部落目前的時間表，也不作捕撈許可。天然素材不是無條件無害；採集、製作、重複使用與分解條件都要查證，不沿用書中商品「28 天」或塑膠年數作通則。講義頁 185 問開發環保餐具應考慮哪些面向，保留問題與理由欄，不預填選項答案。本頁「顯示證據」只提供照片與出處脈絡。', 'Seasonal fishing practices support discussion of use and replenishment, not present schedules for all villages or fishing permission. Natural materials are not automatically harmless; collection, manufacture, reuse and decomposition conditions need evidence. Product “28 days” and plastic lifetimes from the source are not universal rules. Leave the p. 185 utensil-design question and reasoning space unanswered. Show evidence reveals only image observations and source context.'),
        closure: P('尊重不同文化脈絡；永續判斷結合知識、條件與實際證據。', 'Respect distinct cultural contexts; judge sustainability using knowledge, conditions and evidence.'),
        record: P('每張圖記文化脈絡、可見材料或活動、課文補充及待查問題四欄；為一項餐具比較提出需驗證的條件，不先填原書答案。', 'For each image record cultural context, visible activity/material, textual context and open questions. Identify conditions to test for a utensil comparison without pre-answering the source inquiry.'),
        study: P('操作一：選三種對象，在顯示證據前先記觀察，再核對文化脈絡。操作二：切換資源、驗證界線兩種特徵，比較哪些資訊由照片可見、哪些需閱讀或量測。', 'Action 1: observe three subjects before showing evidence, then check cultural context. Action 2: compare resource and verification features, separating visible information from reading and measurement needs.'),
        prompt: P('先描述照片可見的活動或結構；文化規範與環境成效不能只用外觀判定。', 'First describe visible activity or structures; appearance alone cannot establish cultural rules or environmental effectiveness.'),
        features: [P('文化脈絡', 'Cultural context'), P('資源與材料', 'Resources and materials'), P('驗證界線', 'Evidence limits')],
        rows: [
          { ...ceremony, category: P('課文脈絡：達悟族', 'Source context: Tao'), values: [P('課本標為招魚祭，儀式意義需參考族人脈絡。', 'Labelled a fish-calling ceremony; meaning needs community context.'), P('可見船與儀式活動，沒有魚獲量資料。', 'Boats and ritual activity are visible, without catch data.'), P('照片不能測出資源補充、當前規範或捕撈成效。', 'No measurement of replenishment, current rules or fishing outcomes.')] },
          { ...vessels, category: P('課文脈絡：植物器皿', 'Source context: plant vessels'), values: [P('課文介紹阿美族器皿，不推定所有族群共用做法。', 'The text discusses Amis vessels, not one practice for all peoples.'), P('可見不同形狀，材料名稱需配合課文確認。', 'Different forms are visible; material names need textual context.'), P('未提供製造耗能、清洗、衛生或分解測試。', 'No manufacture, washing, hygiene or decomposition test data.')] },
          { ...woven, category: P('課文脈絡：阿美族', 'Source context: Amis'), values: [P('課本稱阿里鳳鳳，名稱與用途由閱讀理解。', 'Named alifongfong; read the context for its name and uses.'), P('可見編織結構；課文指出使用林投葉。', 'Weaving is visible; the text identifies pandan leaves.'), P('不由天然外觀推定採集無影響或固定分解天數。', 'Natural appearance proves neither harmless collection nor fixed decay time.')] }
        ],
        pics: [ceremony, vessels, woven], pages: [184, 185]
      })
    ] }
  ];
  for (const u of units) {
    u.assetDir = assetDir;
    u.family = P('生命與環境', 'Life and environment');
    u.bookName = P('人類與環境', 'Human Beings and the Environment');
    u.coverSource = { ...u.coverSource, file: u.cover, pdfPage: u.coverSource.page - 159, source: '人類與環境.pdf', author: null, licence: null, textFree: true, pageVerification: 'Individually viewed original image and rendered printed page' };
  }
  window.NewEnvironmentUnits = units;
  if (document.body.dataset.book === 'environment') {
    const u = units.find(q => q.id === document.body.dataset.unit);
    if (!u) throw new Error('Unknown environment unit: ' + document.body.dataset.unit);
    u.cover = u.assetDir + u.cover;
    LivingBook.register(u);
  }
})();
