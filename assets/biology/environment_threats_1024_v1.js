/* Unit 11 lesson 2 · "How are the homes of living things being changed?" V5 remake, 2026-10-25 (plan: assets/biology/environment_plan_1024.md section 3).
 * Five tabs; each has its animation views plus a "Textbook photos" view (the original textbook pictures, kept).
 *   habitat-fragmentation:        edge (area, quality and edges), fragment (a leopard cat's home does not fit)
 *   resource-use-and-introduction: harvest (taking more than is replaced), pathway (how nonnative species arrive), stages (from arrival to invasion)
 *   pollution-eutrophication:     sources (where pollution comes from), chain (nutrients up, oxygen down), judge (is colour enough?)
 *   concentration-in-food-chain:  bioacc (one individual over time), magnify (up the food chain), conc (total is not concentration)
 *   climate-ecological-change:    shift (suitable conditions move uphill), timing (flowers and pollinators), coral (why corals turn white)
 * Colours (plan 1.4): pressure orange, nutrient pink dots, substance yellow dots, population green, always together with the name.
 * Each view is drawn by its own module environment_draw_<name>_1024_v1.js, registered as window.EnvironmentDraw[name] (canvas 960x600).
 * While a module is missing a stub is drawn. Every view has s.phase (-1 play all, >=0 hold) and s.start; the module sets s.shown = step.
 * Pictures: environment_ai_1024/ and ecology_ai_1023/ (teacher's Gemini AI illustrations, not photographs; TH8 and TH14b are programmatic edits); textbook originals: environment_originals_1010_v1/.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps,ORIG=K.ORIG;

// ── textbook originals (kept as the "Textbook photos" view) ───────────────
  const rights = P('原圖取自老師提供的《人類與環境》；原圖作者及個別授權未確認，不宣稱開放授權。', 'Original from the teacher-provided Human Beings and the Environment textbook; its individual creator and licence are unconfirmed, and no open licence is claimed.');
  const pic = (file, name, page, text) => ({ file, name, page, text: P(text[0] + '\n' + rights[0], text[1] + '\n' + rights[1]), sourceInfo: { source: '人類與環境.pdf', file, pdfPage: page - 159, printedPage: page, author: null, licence: null, pageVerification: 'Individually viewed original image and rendered printed page' } });
  const leopardcat = pic(ORIG+'Im33_317.png', P('石虎原圖', 'Leopard cat original'), 166, P('課本以石虎討論道路、農地開發與棲地。照片顯示一隻個體，不能提供臺灣總數、活動路徑或目前保育等級。', 'The textbook uses leopard cats to discuss roads, agriculture and habitat. One individual cannot establish Taiwan\'s population, movement paths or present conservation status.'));
  const tuna = pic(ORIG+'Im34_343.png', P('黑鮪拍賣原圖', 'Bluefin tuna auction original'), 167, P('這張是課本的黑鮪拍賣現場，不是鯊魚照片。魚獲影像可引出資源利用問題，但不足以判定某海域目前資源量或捕撈是否過度。', 'This is the textbook bluefin tuna auction, not a shark photograph. Catches raise resource-use questions but cannot establish current stock size or overfishing in a particular sea.'));
  const yew = pic(ORIG+'Im35_344.png', P('紅豆杉原圖', 'Yew original'), 167, P('課本討論觀賞、研究或利用價值與野外採集壓力。照片不是藥物使用說明；不採摘、不試吃，也不自行提煉。', 'The textbook discusses ornamental, research or use values alongside pressure from wild collection. This is not a medication guide; do not collect, taste or extract it.'));
  const factory = pic(ORIG+'Im43_389.png', P('工業排放情境原圖', 'Industrial emission scene original'), 169, P('課本將此影像用於空氣汙染。可見煙囪與排放外觀，但顏色不能判定各種汙染物成分、濃度或空氣品質指標。', 'The textbook uses this scene for air pollution. Chimneys and emissions are visible, but colour cannot identify pollutant composition, concentration or an air-quality index.'));
  const river = pic(ORIG+'Im46_698.png', P('水體異常顏色原圖', 'Unusually coloured water original'), 169, P('課本以此圖討論廢水排放。只記顏色與地景，不憑外觀認定化學物質或飲用安全；不接觸、採集或聞未知水樣。', 'The source discusses wastewater. Record colour and setting without inferring chemicals or drinking safety; do not touch, collect or smell unknown water.'));
  const eutrophication = pic(ORIG+'Im47_699.png', P('優養化水域原圖', 'Eutrophic water original'), 169, P('課本以此圖顯示大量藻類和藍綠菌的水面。影像不是氮、磷、溶氧或藻種檢測；本課只用原圖與示意動畫，不培養汙水。', 'The textbook illustrates water with abundant algae and cyanobacteria. This is not a nutrient, oxygen or species test; this lesson uses only the original and schematic animations, without culturing polluted water.'));
  const snail = pic(ORIG+'Im51_1562.png', P('福壽螺與卵原圖', 'Apple snail and eggs original'), 171, P('課本以福壽螺說明不當引入與野放。照片沒有測出繁殖率或影響大小；不要由卵的顏色直接辨認所有螺類，更不要觸摸或清除。', 'The source uses apple snails to discuss introduction and release. This photo measures neither reproduction nor impacts; egg colour alone does not identify every snail, and students should not touch or remove them.'));
  const crayfish = pic(ORIG+'Im52_1566.png', P('美國螯蝦原圖', 'Red swamp crayfish original'), 171, P('課本外來種例子。外來與入侵的判斷要看原產地、建立擴散和危害證據；外觀或一張照片不夠，不自行捕捉或野放。', 'A textbook nonnative-species example. Assess origin, establishment, spread and harmful effects; appearance or one photo is insufficient, and students should not catch or release animals.'));
  const treefrog = pic(ORIG+'Im61_1615.png', P('斑腿樹蛙原圖', 'Nonnative tree frog original'), 172, P('課本討論與原生蛙的競爭等影響。不能把外形近似當作確認，也不能由此圖推算現在分布；疑似紀錄交由老師協助查證。', 'The source discusses effects including competition with native frogs. Similarity is not confirmed identification and the image does not map current distribution; ask the teacher to help verify uncertain records.'));
  const iguana = pic(ORIG+'Im63_1617.png', P('綠鬣蜥原圖', 'Green iguana original'), 172, P('這是照片原有的局部構圖，不補畫頭部或改比例。課本用於棄養後的生態影響；照片沒有族群數量或現行管理規定，不靠近或捕捉。', 'This is the original partial framing; no head is invented and proportions are unchanged. The source discusses ecological effects of abandonment; it provides neither population totals nor current management rules. Do not approach or catch it.'));
  const coral = pic(ORIG+'Im57_1590.png', P('珊瑚白化原圖', 'Coral bleaching original'), 173, P('課本標示部分珊瑚白化。白化涉及共生藻或色素減少，不等於已證實所有珊瑚死亡；照片不能給出海溫、確切原因或未來恢復率。', 'The textbook identifies bleaching in part of this coral scene. Loss of symbiotic algae or pigments does not prove all corals are dead; the image gives neither temperature, a definitive cause nor recovery probabilities.'));
  const reef = pic(ORIG+'Im19_100.png', P('珊瑚礁與魚原圖', 'Reef and fish original'), 163, P('觀察魚的外形與珊瑚構造；珊瑚蟲是動物。此照片不是水質測量，也不是可與其他照片直接相比的物種普查。', 'Observe fish forms and coral structures; coral polyps are animals. This is neither a water-quality measurement nor a species census directly comparable with the other photos.'));

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;
 K.panel(c,40,40,880,520,'#16332b');
 K.text(c,P(`動畫製作中`,`Animation in progress`),480,270,40,C.yellow,'center');
 K.text(c,short[k],480,330,28,C.white,'center');
 K.text(c,P(`（${name}）`,`(${name})`),480,372,22,C.muted,'center');
 K.pulse(c,480,440,t,C.cyan,14);};
const dr=name=>(c,s,t)=>((window.EnvironmentDraw&&window.EnvironmentDraw[name])||stub(name,(VIEWS[name]||{short:[0,0,0,0]}).short.length,(VIEWS[name]||{short:[]}).short))(c,s,t);

// ── the textbook photo view ────────────────────────────────────────────────
const photoDraw=list=>(c,s,t)=>{const q=list[s.pick|0]||list[0];
 K.panel(c,40,40,880,520,'#16332b');
 K.drawIn(c,q.file,K.fitRect(q.file,70,66,820,440),{radius:12});
 K.cpill(c,q.name,480,514,{color:C.yellow});};

// ── views: tab name, step labels, step titles, step texts ──────────────────
const VIEWS={
edge:{tab:P(`面積、品質與邊緣`,`Area, quality and edges`),
 short:[P(`完整的森林`,`An intact forest`),P(`面積減少`,`Less area`),P(`品質下降`,`Lower quality`),P(`邊緣不一樣`,`Edges differ`)],
 names:[P(`一整片森林：棲地`,`One whole forest: a habitat`),P(`面積減少：農地吃掉一側`,`Less area: farmland takes one side`),P(`品質下降：內部縮得更快`,`Lower quality: the interior shrinks faster`),P(`森林內部和邊緣，條件不一樣`,`Forest interior and edge differ in conditions`)],
 text:[P(`從上空看下去，一整片連續的森林，是許多生物的棲地。（AI 插圖，非實拍。）`,`Seen from above, one continuous forest is a habitat for many organisms. (AI illustration, not a photo.)`),
  P(`農地擴張，吃掉森林的一側，棲地面積下降。比例條只表示變小的趨勢，沒有實際數字。示意。`,`Farmland spreads and takes one side of the forest, so habitat area falls. The bar shows only the trend of getting smaller, with no real numbers. Schematic.`),
  P(`形狀被削出彎彎曲曲的外緣，畫面分成「邊緣帶」與「內部」兩種顏色。整體面積縮小時，內部縮得比整體更快。同一個形狀逐步變瘦的示意，不是實測。`,`The shape is cut into a winding outline, drawn as an "edge zone" and an "interior" in two colours. As the whole area shrinks, the interior shrinks faster than the whole. This is the same shape getting thinner, a schematic and not a measurement.`),
  P(`切開來看剖面：左邊是森林內部，較陰暗潮濕；右邊是森林邊緣，光較強、風較大、也較乾。邊緣的條件和內部不一樣，適合的生物也不一樣。這裡只畫概念，不寫邊緣影響到幾公尺，也不列物種名單。`,`In cross-section, the left is the forest interior, darker and more humid; the right is the forest edge, with stronger light, more wind and drier air. Conditions at the edge differ from the interior, so the organisms that suit them differ too. Only the idea is drawn, with no distance for the edge effect and no species list.`)]},
fragment:{tab:P(`石虎的家裝不下`,`A leopard cat's home does not fit`),
 short:[P(`完整的森林`,`An intact forest`),P(`一條路切過`,`A road cuts through`),P(`再被切碎`,`Cut into pieces`),P(`想去對面`,`Trying to cross`),P(`空間不夠`,`Not enough space`)],
 names:[P(`石虎的活動範圍落在森林裡`,`The leopard cat's home range lies inside the forest`),P(`一條路切過：活動範圍跨過路`,`A road cuts through: the home range crosses it`),P(`沒有任何一塊裝得下整個活動範圍`,`No single patch holds the whole home range`),P(`走到路邊，停，退回`,`Walks to the roadside, stops, turns back`),P(`只保住一隻不夠`,`Saving one animal is not enough`)],
 text:[P(`一隻石虎生活的範圍，用虛線圓表示，名字叫「活動範圍」。在完整的森林裡，圓完全落在森林中。（AI 插圖，非實拍。）`,`The area where one leopard cat lives is shown by a dashed circle called its "home range". In an intact forest the circle lies wholly within the forest. (AI illustration, not a photo.)`),
  P(`一條路切過去，森林分成兩塊，虛線圓跨過了路。`,`A road cuts through and the forest splits in two; the dashed circle now crosses the road.`),
  P(`農地與房舍繼續擴張，森林再分成幾塊小的。沒有任何一塊能裝下整個虛線圓，圓變成橘色，表示這個壓力改變了牠的生活空間。圖的大小是示意。`,`Farmland and houses keep spreading and the forest splits into several small patches. No patch holds the whole dashed circle, so it turns orange, showing that this pressure has changed its living space. Sizes are schematic.`),
  P(`石虎想去對面：走到路邊，停下，退回。橘色的脈衝提醒我們，移動、覓食、繁殖、躲避危險都受影響。現實中動物仍可能冒險跨路；這裡不畫車禍。`,`The leopard cat wants to reach the other side: it walks to the roadside, stops and turns back. The orange pulse reminds us that moving, feeding, breeding and avoiding danger are all affected. In reality animals may still risk crossing a road; no accident is drawn here.`),
  P(`小塊各自只留下少數個體，彼此不容易交流。只保住一隻動物不夠，要保住牠需要的空間。怎麼讓兩塊連起來？下一課再看。`,`Each small patch keeps only a few individuals, and they can hardly meet one another. Saving one animal is not enough; its needed space has to be kept too. How can the pieces be joined? We look at that in the next lesson.`)]},
harvest:{tab:P(`取走的比補充的多`,`Taking more than is replaced`),
 short:[P(`沒有取走`,`No harvest`),P(`取走得少`,`A small harvest`),P(`取走得多`,`A large harvest`),P(`取走哪些個體`,`Which individuals`)],
 names:[P(`進 ≈ 出：水位穩定`,`In ≈ out: the level holds`),P(`取走得少：水位仍穩`,`A small harvest: the level still holds`),P(`取走超過補充：水位一路下降`,`Harvest exceeds replacement: the level keeps falling`),P(`取走成魚或幼魚，影響不同`,`Taking adults or juveniles differs`)],
 text:[P(`水槽的水位代表族群大小。水龍頭是補充（出生、成長加入），排水孔是自然損失。進和出差不多，水位穩定。借用上一單元族群收支的想法。（示意）`,`The water level stands for population size. The tap is replenishment (births and growth into the population) and the drain is natural loss. When in and out are about equal, the level holds. This borrows the population-budget idea from the last unit. (Schematic)`),
  P(`人類用大勺子取走一些。取走得少，補充仍然大於或等於自然損失加取走，水位還是穩的。這是示意，不是安全的取走比例。`,`People scoop some out with a big ladle. If the harvest is small, replenishment still matches or exceeds natural loss plus harvest, and the level holds. This is schematic and not a safe harvest fraction.`),
  P(`取走得多，又持續很久，水位一路下降。取走超過補充，族群就會變少。`,`When the harvest is large and lasts long, the level keeps falling. Taking more than is replaced makes the population shrink.`),
  P(`取走成魚（會繁殖）和取走幼魚（還沒繁殖），影響不同。取走成魚後，水龍頭變小：取走的不只是現在的數量，還有未來的補充。另外，捕撈也可能影響非目標生物與棲地。課本以黑鮪等為例；不給任何物種的數量、禁漁日期或現況，這些不當作最新公告。`,`Taking adults (which breed) and taking juveniles (which have not yet bred) have different effects. After adults are taken the tap shrinks: what is lost is not only today's numbers but also future replacement. Harvesting can also affect non-target organisms and habitat. The textbook uses bluefin tuna and similar cases as examples; no numbers, fishing-ban dates or current status are given, and none should be treated as a current notice.`)]},
pathway:{tab:P(`外來種怎麼到的`,`How nonnative species arrive`),
 short:[P(`搭便車`,`Hitchhiking`),P(`寵物與觀賞`,`Pets and display`),P(`養殖逃逸`,`Farm escape`),P(`放生不等於救牠`,`Release is not rescue`)],
 names:[P(`路徑一：搭便車`,`Route 1: hitchhiking`),P(`路徑二：寵物與觀賞`,`Route 2: pets and display`),P(`路徑三：養殖或食用用途的逃逸或釋放`,`Route 3: escape or release from farming or food use`),P(`路徑四：放生`,`Route 4: release`)],
 text:[P(`從「原本的地方」到「新的地方」，有好幾條路。第一條是搭便車：隨運輸、貨物或盆栽土移動，例如斑腿樹蛙可能這樣到新的地方。（AI 插圖，非實拍。）`,`There are several routes from the "original place" to the "new place". The first is hitchhiking: moving with transport, cargo or potting soil, for example nonnative tree frogs may travel this way. (AI illustration, not a photo.)`),
  P(`第二條是寵物與觀賞：買來之後不想養了。巴西龜、綠鬣蜥都是這類例子。棄養把牠們帶進了原本沒有的地方。`,`The second is pets and display: bought, then no longer wanted. Red-eared sliders and green iguanas are examples. Abandonment places them where they did not occur before.`),
  P(`第三條是養殖或食用用途的逃逸或釋放，例如美國螯蝦。逃出或被放出的個體，進入了新的水域。`,`The third is escape or release from farming or food use, for example red swamp crayfish. Individuals that escape or are released enter new waters.`),
  P(`第四條是放生：把生物放到不適合的環境，牠可能活不好，也可能對本地生物造成影響。放生不等於救牠。不棄養、不放生。這裡只講路徑；「外來」只是來源，不等於有害，下一個動畫才說明。`,`The fourth is release: putting an animal into an unsuitable environment may do it harm, and may also affect local organisms. Releasing is not rescuing. Do not abandon or release animals. Only routes are shown here; "nonnative" only describes origin and does not mean harmful, which the next animation explains.`)]},
stages:{tab:P(`從到達到入侵`,`From arrival to invasion`),
 short:[P(`到達`,`Arrival`),P(`不一定留下`,`Not all stay`),P(`建立族群`,`Establishment`),P(`擴散`,`Spread`),P(`危害的路`,`Ways of harm`)],
 names:[P(`第一層：到達`,`Layer 1: arrival`),P(`外來不等於入侵`,`Nonnative is not invasive`),P(`第二層：建立族群`,`Layer 2: establishment`),P(`第三層：擴散`,`Layer 3: spread`),P(`第四層：造成危害`,`Layer 4: causing harm`)],
 text:[P(`漏斗從上到下有四層：到達、建立、擴散、造成危害。第一層，多種外來生物到達新的地方。（AI 插圖，非實拍。）`,`The funnel has four layers from top to bottom: arrival, establishment, spread and harm. In layer one, several nonnative organisms arrive in a new place. (AI illustrations, not photos.)`),
  P(`不是每一個都留得下來，多數會離開或死去。外來不等於入侵。`,`Not every one stays; most leave or die. Nonnative does not mean invasive.`),
  P(`能活下來並繁殖的，開始增加，這叫建立族群。`,`Those that survive and reproduce begin to increase; this is establishment of a population.`),
  P(`族群從一個點往外擴散。福壽螺是前一單元出現過的例子，這裡只放一個小圖示。`,`The population spreads outward from one point. The apple snail, met in an earlier unit, is shown only as a small icon here.`),
  P(`造成危害有三條路：競爭（藤蔓蓋住樹冠，搶光）、取食（例如螯蝦吃水生生物）、改變棲地（水岸被挖鬆）。要說入侵，看的是建立、擴散、有害的證據，不是來源，也不是長相。外來種管理由專業單位評估，不自行捕殺、食用或野放。`,`Harm comes by three routes: competition (a vine covers the canopy and takes the light), feeding (for example crayfish eating aquatic organisms) and habitat change (a loosened riverbank). To call a species invasive we look for evidence of establishment, spread and harm, not its origin or its looks. Management of nonnative species is assessed by professionals; do not kill, eat or release them yourself.`)]},
sources:{tab:P(`汙染從哪裡來`,`Where pollution comes from`),
 short:[P(`空氣`,`Air`),P(`水`,`Water`),P(`土壤`,`Soil`),P(`不同汙染，不同途徑`,`Different routes`)],
 names:[P(`空氣：工廠與車輛`,`Air: factories and vehicles`),P(`水：住家排水、魚塭、農田的水`,`Water: household drains, fish ponds, farm runoff`),P(`土壤：農田與畜牧場`,`Soil: farmland and livestock yards`),P(`不同汙染，走不同的路`,`Different pollution takes different routes`)],
 text:[P(`空氣汙染的來源之一：工廠與車輛的排放。（AI 插圖，非實拍。）`,`One source of air pollution: emissions from factories and vehicles. (AI illustration, not a photo.)`),
  P(`水汙染的來源：住家排水口、魚塭、農田的水，都可能把營養鹽帶進水體。`,`Sources of water pollution: household drains, fish ponds and farm runoff can all carry nutrients into water.`),
  P(`土壤的來源：噴灑的農田與畜牧場。物質也可能從土壤再進入水。`,`Soil sources: sprayed fields and livestock yards. Substances may also pass from soil into water.`),
  P(`不同汙染，走不同的路：營養鹽進水體，造成優養化；工廠與車輛排放進入空氣；酸雨、臭氧層受損、細懸浮微粒各有不同的途徑。這些不是同一個原因。圖上的顏色不是汙染物檢測；這裡不提供飲水或健康建議。`,`Different pollution takes different routes: nutrients entering water cause eutrophication; factory and vehicle emissions enter the air; acid rain, ozone-layer damage and fine particles each follow different pathways. These do not have a single cause. Colours in the pictures are not pollutant tests, and no drinking-water or health advice is given.`)]},
chain:{tab:P(`養分多了，氧怎麼不見`,`More nutrients, less oxygen`),
 short:[P(`清澈的池塘`,`A clear pond`),P(`養分進來`,`Nutrients enter`),P(`藻類增生`,`Algae multiply`),P(`遮光`,`Shading`),P(`死亡與分解`,`Death and decay`),P(`缺氧`,`Low oxygen`)],
 names:[P(`清澈的池塘：氧夠用`,`A clear pond: enough oxygen`),P(`營養鹽從岸邊流入`,`Nutrients flow in from the bank`),P(`藻類大量增生，水面變綠`,`Algae multiply and the surface turns green`),P(`水面的藻擋住光`,`Surface algae block the light`),P(`死亡的藻下沉，被分解`,`Dead algae sink and are decomposed`),P(`溶氧不夠，魚游到水面附近`,`Too little oxygen: fish come near the surface`)],
 text:[P(`清澈的池塘，水草長在水下。白色小氣泡代表溶氧。（示意；水面是 AI 插圖，非實拍。）`,`A clear pond with plants growing under the water. The white bubbles stand for dissolved oxygen. (Schematic; the surface is an AI illustration, not a photo.)`),
  P(`營養鹽（粉紅小點）從岸邊的田、排水流進池塘。`,`Nutrients (pink dots) flow into the pond from farmland and drains on the bank.`),
  P(`營養多了，藻類大量增生，水面變綠。`,`With more nutrients, algae multiply and the surface turns green.`),
  P(`水面的藻擋住光（黃色光柱），下面的水草得到的光變少，變暗、變少。`,`Surface algae block the light (yellow beam), so the plants below get less light and become dimmer and fewer.`),
  P(`死去的藻與水草沉到底部，被分解者分解，分解者要用氧，所以氣泡變少。`,`Dead algae and plants sink to the bottom and are decomposed by decomposers, which use oxygen, so the bubbles become fewer.`),
  P(`溶氧不夠，魚游到水面附近。白天藻類行光合作用會放出氧，夜間與分解則耗氧。要判斷水質，要看時間、深度、溶氧、營養鹽等資料。這個機制和下一個分頁的生物放大是兩回事。`,`With too little oxygen, fish come near the surface. By day algae release oxygen through photosynthesis, while at night and during decomposition oxygen is used up. Judging water quality needs data on time, depth, dissolved oxygen and nutrients. This mechanism is a different matter from the biomagnification on the next tab.`)]},
judge:{tab:P(`看顏色夠不夠`,`Is colour enough?`),
 short:[P(`只看顏色`,`Colour only`),P(`要補的資料`,`Data to add`),P(`安全`,`Safety`)],
 names:[P(`三杯水：哪一杯最不好？`,`Three cups: which is worst?`),P(`顏色之外，還要哪些資料`,`Beyond colour, what data`),P(`顏色只是線索，不是檢測`,`Colour is a clue, not a test`)],
 text:[P(`清澈、綠色、顏色異常，三杯水排開。只看顏色，哪一杯最不好？先不作答。（示意；異常顏色的課本照片在「課本照片」檢視。）`,`Three cups are lined up: clear, green and oddly coloured. By colour alone, which is worst? Do not answer yet. (Schematic; the textbook photo of unusually coloured water is in the Textbook photos view.)`),
  P(`要判斷，還要補四種資料：溶氧、營養鹽、時間、深度。`,`To judge, add four kinds of data: dissolved oxygen, nutrients, time and depth.`),
  P(`安全：不採集、不接觸不明水體。顏色只是線索，不是檢測。補充。`,`Safety: do not collect or touch unknown water. Colour is a clue, not a test. Supplement.`)]},
bioacc:{tab:P(`一個個體的累積`,`Build-up in one individual`),
 short:[P(`容易排除`,`Easily removed`),P(`難排除`,`Hard to remove`),P(`環境裡更多`,`More in the water`),P(`小結`,`Summary`)],
 names:[P(`容易排除的物質：水位不再上升`,`An easily removed substance: the level stops rising`),P(`難排除的物質：水位隨時間升高`,`A hard-to-remove substance: the level rises over time`),P(`環境裡更多：升得更快`,`More in the environment: it rises faster`),P(`生物累積：同一個個體，隨時間`,`Bioaccumulation: one individual over time`)],
 text:[P(`一條小魚的身體是一個水桶，黃色小點代表某種物質。進水口是從水和食物進來，排水口是排出或分解。容易排除的物質，進和出差不多，水位不再上升。（AI 插圖，非實拍；物質是示意。）`,`A small fish's body is a bucket and the yellow dots stand for some substance. The inlet is intake from water and food; the outlet is excretion or breakdown. For an easily removed substance, in and out are about equal and the level stops rising. (AI illustration, not a photo; the substance is schematic.)`),
  P(`難排除的物質，進大於出，水位隨時間（下方日數軸）一路升高。`,`For a hard-to-remove substance, in exceeds out and the level rises with time (the day axis below).`),
  P(`同樣的魚，環境裡的物質更多，水位升得更快。`,`For the same fish, more of the substance in its surroundings makes the level rise faster.`),
  P(`生物累積是同一個個體，隨時間的累積。不同營養階層的比較，是下一個動畫。這裡沒有任何真實物質的名字或數值，單位是自訂的教學濃度（單位／kg）。`,`Bioaccumulation is the build-up in one individual over time. Comparing different trophic levels is the next animation. No real substance or value appears here; the unit is an invented teaching concentration (units/kg).`)]},
magnify:{tab:P(`一層一層吃上去`,`Up the food chain`),
 short:[P(`水中很稀`,`Dilute in water`),P(`一層層吃上去`,`Eaten upward`),P(`難排除`,`Hard to remove`),P(`容易排除對照`,`Easily removed`)],
 names:[P(`水中很稀：框內只有幾點`,`Dilute in the water: only a few dots`),P(`每一層吃很多下面那一層`,`Each level eats many of the level below`),P(`難排除：越往上越密`,`Hard to remove: denser going up`),P(`容易排除：點不變密`,`Easily removed: dots do not thicken`)],
 text:[P(`五個營養階層由左到右：矽藻、橈足類、沙丁魚、鯖魚、鮪魚。每一層下面有一個同樣大小的組織框（等質量），黃色小點越多，濃度越高。水中很稀，框內只有幾點。（AI 插圖，非實拍。）`,`Five trophic levels from left to right: diatoms, copepods, sardines, mackerel and tuna. Under each is a tissue box of the same size (equal mass); more yellow dots means higher concentration. In the water it is dilute, so only a few dots appear. (AI illustrations, not photos.)`),
  P(`一層一層吃上去：每一層吃很多下面那一層，黃點被「吃進」。`,`Eaten level by level: each level eats many of the level below, taking the yellow dots in.`),
  P(`難排除的物質，點越往上越密（示意約 2 倍、4 倍，不是固定倍率）。右上角的能量長條同時遞減：一個變少，一個變多，是不同的量。`,`For a hard-to-remove substance the dots get denser going up (about 2 times and 4 times, schematic and not a fixed ratio). The energy bars in the corner shrink at the same time: one gets less and the other gets more, and they are different quantities.`),
  P(`容易排除的對照：點不變密。不同物質的排除速率不同。沒有真實物質或 ppm 數值；水色不能測出體內的物質，也不提供飲食或診療建議。`,`An easily removed substance for comparison: the dots do not thicken. Different substances are removed at different rates. No real substance or ppm value is given; water colour cannot reveal what is in a body, and no dietary or medical advice is given.`)]},
conc:{tab:P(`總量不等於濃度`,`Total is not concentration`),
 short:[P(`算總量`,`Total`),P(`除以質量`,`Divide by mass`),P(`同質量才能比`,`Same mass to compare`)],
 names:[P(`大魚的總量比較多`,`The big fish has the larger total`),P(`每單位質量：小魚比較高`,`Per unit mass: the small fish is higher`),P(`比濃度，要先確認質量`,`Compare concentrations: fix the mass first`)],
 text:[P(`大魚（質量 10 單位）體內共 20 點，小魚（質量 1 單位）體內共 5 點。算總量，大魚 20 比小魚 5 多。教學數字，不是真實測量。`,`The big fish (mass 10 units) holds 20 dots in all; the small fish (mass 1 unit) holds 5. By total, the big fish's 20 exceeds the small fish's 5. Teaching numbers, not real measurements.`),
  P(`濃度是物質量除以質量：大魚 20 ÷ 10 ＝ 每單位 2，小魚 5 ÷ 1 ＝ 每單位 5。小魚的濃度比較高。`,`Concentration is the amount divided by the mass: big fish 20 ÷ 10 = 2 per unit, small fish 5 ÷ 1 = 5 per unit. The small fish has the higher concentration.`),
  P(`回到食物鏈：看濃度，要先確認比較的質量，同質量的組織才能比。總量多，不等於濃度高。`,`Back to the food chain: to read concentration, first fix the mass being compared; compare tissue of the same mass. A larger total does not mean a higher concentration.`)]},
shift:{tab:P(`適合的條件往上搬`,`Suitable conditions move uphill`),
 short:[P(`回顧`,`Recap`),P(`前提`,`Premise`),P(`假設升溫`,`Assumed warming`),P(`山頂的難題`,`The summit problem`),P(`能不能搬`,`Can they move?`)],
 names:[P(`越高越冷，林相一帶一帶變`,`Higher is colder; vegetation changes in bands`),P(`前提：溫室效應（地科學過）`,`Premise: the greenhouse effect (Earth science)`),P(`假設升溫：各帶往上移`,`Assumed warming: bands shift upward`),P(`山頂沒有更高的地方`,`The summit has no higher ground`),P(`自己移動，和人搬運，是不同的過程`,`Moving on their own vs carried by people`)],
 text:[P(`上一單元看過：山越高越冷，林相一帶一帶改變。（AI 插圖，非實拍。）`,`As seen in the last unit: the higher the mountain, the colder, and vegetation changes in bands. (AI illustration, not a photo.)`),
  P(`前提：地表放出紅外線，溫室氣體吸收一部分並向各方向再放射，這是地球科學已學過的內容，這裡當作前提，不再重講機制。`,`Premise: the surface emits infrared radiation, and greenhouse gases absorb part of it and re-emit in all directions. This is already learned in Earth science and is taken here as a premise without re-teaching the mechanism.`),
  P(`假設升溫，適合的條件往上移，各帶跟著往上。用選項切換較小、中、較大的假設升溫，比較移動量。這是假設，不是預測；不從符號算攝氏溫度。`,`With assumed warming, suitable conditions move upward and each band follows. Use the options to switch between smaller, medium and larger assumed warming and compare the shift. It is an assumption, not a forecast, and no Celsius value is calculated from symbols.`),
  P(`最上面那一帶沒有更高的地方可去，被擠壓。高山植物與怕熱的冷水魚是這類代表。`,`The topmost band has no higher place to go and is squeezed. Alpine plants and cold-water fish that cannot tolerate heat are examples.`),
  P(`中間有農地與道路擋住。生物自己移動（自然擴散）和人類搬運（外來引入）是不同的過程，用不同顏色的箭頭表示。不能把所有遷移的物種都叫入侵種；一張照片也不能確認變遷的原因。`,`Farmland and roads block the middle. Organisms moving by themselves (natural dispersal) and being carried by people (introduction) are different processes, shown with different arrow colours. Not every species that moves is invasive, and one photo cannot establish the cause of a change.`)]},
timing:{tab:P(`開花和傳粉者對不上`,`Flowers and pollinators fall out of step`),
 short:[P(`平常的年`,`A normal year`),P(`溫度改變`,`Temperature changes`),P(`沒有同步`,`Out of step`),P(`機會變少`,`Fewer chances`)],
 names:[P(`平常的年：兩段時間重疊`,`A normal year: the two periods overlap`),P(`花開的時段往前移`,`Flowering moves earlier`),P(`傳粉者沒有同步`,`The pollinators do not follow`),P(`重疊少，花粉傳遞的機會少`,`Less overlap, fewer chances to carry pollen`)],
 text:[P(`一個圓形月曆，只寫「早」「中」「晚」。花開的時段（山櫻花）和傳粉者活動的時段（綠繡眼、蜜蜂）重疊。（AI 插圖，非實拍。）`,`A circular calendar marked only "early", "middle" and "late". The flowering period (mountain cherry) and the pollinators' active period (white-eyes, honeybees) overlap. (AI illustrations, not photos.)`),
  P(`溫度改變，花開的弧往前移。`,`When temperature changes, the flowering arc moves earlier.`),
  P(`傳粉者沒有同步，重疊縮小。不是所有生物都用同一種方式感應季節。`,`The pollinators do not move in step and the overlap shrinks. Not all organisms sense the season in the same way.`),
  P(`重疊少，花粉傳遞的機會就少。示意，不預測哪一個物種會怎樣。`,`With less overlap there are fewer chances to carry pollen. Schematic; it does not predict what will happen to any particular species.`)]},
coral:{tab:P(`珊瑚為什麼變白`,`Why corals turn white`),
 short:[P(`珊瑚是動物`,`Coral is an animal`),P(`壓力`,`Stress`),P(`白化`,`Bleaching`),P(`白化不等於死亡`,`Not the same as death`)],
 names:[P(`珊瑚蟲與共生藻`,`Coral polyps and symbiotic algae`),P(`壓力：共生藻離開或色素減少`,`Stress: algae leave or pigment fades`),P(`白化：珊瑚變白`,`Bleaching: the coral turns white`),P(`要看壓力與恢復條件`,`It depends on stress and recovery conditions`)],
 text:[P(`珊瑚是動物。放大看，珊瑚蟲裡面住著共生藻（綠色小點），共生藻供應養分，這是互利共生。（AI 插圖，非實拍。）`,`Coral is an animal. Zoomed in, the polyps hold symbiotic algae (green dots) that supply nutrients: a mutualism. (AI illustration, not a photo.)`),
  P(`遇到壓力，例如水溫過高，共生藻離開，或色素減少。`,`Under stress, for example water that is too warm, the algae leave or the pigments fade.`),
  P(`珊瑚失去顏色，變白，這叫白化。畫面淡入白化的珊瑚（程式改色的示意圖）。`,`The coral loses its colour and turns white: bleaching. The picture fades to the bleached coral (a programmatically recoloured schematic).`),
  P(`白化不等於死亡。壓力解除，共生藻可能回來；壓力持續，才可能死亡。要看壓力與恢復條件。這裡不寫實際年度的海溫或統計。`,`Bleaching is not death. If the stress ends the algae may return; if the stress continues, death may follow. It depends on the stress and recovery conditions. No actual yearly sea temperatures or statistics are given.`)]}
};

// ── tabs ───────────────────────────────────────────────────────────────────
const RESTART=new Set(['phase']);
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;s.pick=0;}else if(RESTART.has(k))s.start=s.elapsed;};
const stepOf=s=>s.phase<0?(s.shown||0):s.phase;
const INIT=()=>({running:true,view:0,phase:-1,start:0,pick:0});
const PHOTO_TAB=P(`課本照片`,`Textbook photos`);
// Builds the interactive parts of a tab from the list of view names and its photo list.
const make=(names,photos)=>{const np=names.length,isPhoto=s=>s.view===np;
 return{init:INIT,act:viewAct,
 controls:s=>[choice(P(`觀察`,`View`),'view',[...names.map((n,i)=>[i,VIEWS[n].tab]),[np,PHOTO_TAB]]),
  isPhoto(s)?choice(P(`原圖`,`Original`),'pick',photos.map((q,i)=>[i,q.name])):steps(VIEWS[names[s.view]].short)],
 explain:s=>{if(isPhoto(s)){const q=photos[s.pick|0]||photos[0];return{title:q.name,text:q.text};}
  const v=VIEWS[names[s.view]],k=stepOf(s);return{title:v.names[k],text:v.text[k]};},
 draw:(c,s,t)=>isPhoto(s)?photoDraw(photos)(c,s,t):dr(names[s.view])(c,s,t),
 sources:photos.map(q=>({name:q.name,page:q.page}))};};

const MC=(q,a,b,c4,d,answer,why,hint)=>({q,options:[a,b,c4,d],answer,why,hint});
const tabs=[
{id:'habitat-fragmentation',title:P(`道路切開了什麼？`,`What does a road divide?`),sub:P(`棲地減少與破碎化`,`Habitat loss and fragmentation`),
 hook:P(`上一課看到：生命的差異很珍貴。這一課追問：這些差異，是怎麼一點一點被改掉的？先從最常見的開始：道路兩邊還有樹，動物的家就沒有受影響嗎？`,`The last lesson showed that differences among living things are precious. This lesson asks: how are those differences changed, bit by bit? Start with the most common case: if trees remain on both sides of a road, is the animals' home unaffected?`),
 body:P(`看到一個壓力，就追問三件事：它改變了哪個條件？中間經過哪幾步？證據在哪裡？開發可讓棲地面積減少、品質下降，也可把連續棲地分成小塊，稱為破碎化。生物移動、覓食、繁殖與躲避危險的條件可能受影響。課本用石虎引出道路與農地重疊的問題；不能只保住一隻動物卻忽略牠需要的生活空間。`,`When we see a pressure, we ask three things: which condition does it change, through which steps, and where is the evidence? Development can reduce habitat area, lower its quality and split continuous habitat into fragments. Movement, feeding, breeding and shelter can be affected. The textbook uses leopard cats to discuss overlap with roads and farmland; protecting an individual requires attention to its living space.`),
 reading:P(`探究：棲地完整與破碎對動物生存有何影響？你能為石虎保育做什麼？先各自提出證據與問題，不預填探究答案。動畫用兩側地景和移動符號示意；現實動物仍可能冒險跨路。廊道要有合適入口與相連棲地，不能彌補全部棲地損失（下一課再談）。邊緣影響的距離、物種名單這裡都不寫。`,`Inquiry: how does intact versus fragmented habitat affect survival, and what could you do for leopard cat conservation? Develop evidence and questions without a prefilled answer. The animations use landscapes and movement symbols as illustrations; real animals may still risk crossing a road. Corridors need suitable entrances and connected habitat, and cannot replace all lost area (the next lesson returns to this). No edge-effect distances or species lists are given here.`),
 closure:P(`棲地的面積、品質與連通都要看；設施存在不等於保育成功。`,`Assess habitat area, quality and connectivity; a structure alone does not establish success.`),
 quiz:[
  MC(P(`森林被削掉一部分，面積變小。關於「內部」，哪一句最合理？`,`Part of a forest is cut away and its area shrinks. Which statement about the "interior" is most reasonable?`),P('內部縮得和整體一樣慢','The interior shrinks as slowly as the whole'),P('內部會比整體縮得更快','The interior shrinks faster than the whole'),P('內部一點也不受影響','The interior is not affected at all here'),P('邊緣和內部條件完全相同','Edge and interior have identical conditions'),1,P(`外緣被削出來後，邊緣帶占的比例變大，內部縮得比整體更快；邊緣的條件也和內部不同。`,`Once the outline is cut, the edge zone takes a larger share and the interior shrinks faster than the whole; edge conditions also differ from the interior.`),P(`看「面積、品質與邊緣」第三、四步。`,`See "Area, quality and edges", steps three and four.`)),
  MC(P(`石虎的活動範圍比任何一塊森林都大時，會怎樣？`,`What happens when a leopard cat's home range is larger than every forest patch?`),P('只要保住一隻動物就夠了','Saving one single animal is enough'),P('沒有影響，牠會自己縮小','No effect; the range simply shrinks'),P('移動與繁殖等都可能受影響','Moving and feeding may both be affected'),P('路只要有樹就不會切開棲地','A road with trees never divides habitat'),2,P(`要保住牠，要保住牠需要的空間，不只是一隻動物。`,`To save the animal, its needed space must be kept, not just the single animal.`),P(`看「石虎的家裝不下」第三到五步。`,`See "A leopard cat's home does not fit", steps three to five.`))]},
{id:'resource-use-and-introduction',title:P(`取走與帶進的代價`,`The costs of removal and introduction`),sub:P(`過度利用與外來入侵`,`Overuse and biological invasions`),
 hook:P(`資源想拿就拿、寵物想放就放，影響會只停在眼前嗎？`,`If we take resources whenever we like and release pets whenever we like, do the effects stop at what we can see?`),
 body:P(`採捕若長期超過族群補充，可能造成資源下降；利用還要注意非目標生物及棲地。人類運輸、引入與棄養也可能把生物帶到原本沒有的地方。外來種不全是入侵種；若建立、擴散並造成危害，才需討論入侵影響，不能只憑來源或外觀判斷。`,`Removal persistently exceeding replenishment can reduce resources, with nontarget organisms and habitat also needing attention. Transport, introduction and abandonment may move organisms beyond their native range. Nonnative species are not all invasive; assess establishment, spread and harm rather than origin or appearance alone.`),
 reading:P(`課本黑鮪、紅豆杉、福壽螺與美國螯蝦分別引出利用與引入的問題；斑腿樹蛙、綠鬣蜥是其他案例。影響可能包括競爭、取食與棲地改變，不一定是完全沒有天敵。捕撈期間與漁法的問題留給學生討論；書上禁漁日期、物種狀況、歷史數量不當作最新公告。外來種管理由專業評估，不自行捕殺、食用或野放。動畫的水槽與漏斗是示意，不是安全的取走比例，也不是任何物種的預測。`,`Bluefin tuna, yew, apple snails and crayfish introduce resource-use and introduction issues; tree frogs and iguanas provide further cases. Competition, feeding and habitat change can matter, not only an absence of predators. Leave the question about seasons and fishing methods for discussion. Source dates, statuses and historic numbers are not current notices. Management needs professional assessment; do not kill, eat or release wildlife. The tank and funnel in the animations are schematic, not a safe harvest fraction and not a forecast for any species.`),
 closure:P(`利用看補充與影響；外來看建立、擴散及危害，不棄養不野放。`,`Compare use with replenishment and impacts; assess establishment, spread and harm, and avoid abandonment or release.`),
 quiz:[
  MC(P(`取走成魚，為什麼影響的不只是現在的數量？`,`Why does taking adult fish affect more than today's numbers?`),P('成魚會繁殖，未來補充變少','Adults breed, so later supply also falls'),P('只影響現在，完全不影響未來','Adult fish simply look better to people'),P('幼魚完全不會受到任何影響','Juveniles are never affected at all here'),P('取走多少都不會改變補充','Any amount taken leaves supply unchanged'),0,P(`取走成魚後，水龍頭（補充）變小。`,`After adults are taken, the tap (replenishment) shrinks.`),P(`看「取走的比補充的多」第四步。`,`See "Taking more than is replaced", step four.`)),
  MC(P(`要說一種外來生物是「入侵」，應該看什麼？`,`What should we look at before calling a nonnative organism "invasive"?`),P('有沒有擴散與危害的證據','Evidence of spread and the harm done'),P('牠的外型看起來是不是很兇','Whether it looks fierce or not to us'),P('牠是不是從國外來的生物','Whether it came from another country'),P('有沒有人把牠抓來煮來吃','Whether anyone has caught it to eat'),0,P(`外來只是來源；入侵看建立、擴散與危害，不是來源，也不是長相。`,`Nonnative only describes origin; invasion depends on establishment, spread and harm, not on origin or looks.`),P(`看「從到達到入侵」第二與第五步。`,`See "From arrival to invasion", steps two and five.`))]},
{id:'pollution-eutrophication',title:P(`養分多，魚一定好？`,`Do more nutrients always help fish?`),sub:P(`汙染與水域優養化`,`Pollution and eutrophication`),
 hook:P(`水裡藻類長得很旺，為什麼魚反而可能缺氧？`,`When algae grow abundantly, why might fish lack oxygen?`),
 body:P(`空氣與水汙染可來自工業、農業及生活活動。氮、磷等營養鹽大量進入水體，可能促使藻類及藍綠菌增生；遮光與有機物分解耗氧會影響水生生物，嚴重時造成缺氧。這是優養化的機制，不能與難排除物質沿食物鏈放大混為一談。`,`Industrial, agricultural and everyday activities can pollute air and water. Excess nutrients such as nitrogen and phosphorus can stimulate algae and cyanobacteria. Shading and oxygen use during decomposition affect aquatic organisms, potentially causing severe oxygen depletion. This eutrophication mechanism differs from biomagnification of poorly eliminated substances.`),
 reading:P(`日間光合作用可能產氧，呼吸與分解則耗氧；要判斷水質需看時間、深度、溶氧與營養鹽等資料。酸雨、臭氧層受損與細懸浮微粒有不同途徑，不用同一個原因包辦。照片色彩不是汙染物檢測，動畫只示意營養鹽情境。水資源的提問保留，不提供飲水判斷或醫療建議；不採集、培養或製造汙染水樣。`,`Photosynthesis can release oxygen during daylight, while respiration and decomposition consume it; assess time, depth, oxygen and nutrients. Acid rain, ozone-layer damage and fine particles involve different pathways. Photo colour is not a pollutant test and the animations illustrate nutrients only. Leave the water-resource questions open, without drinking-safety or medical advice; do not collect, culture or create polluted samples.`),
 closure:P(`過量養分、藻量、分解與溶氧相連；外觀不能代替水質檢測。`,`Excess nutrients, algae, decomposition and oxygen are connected; appearance cannot replace water-quality tests.`),
 quiz:[
  MC(P(`下面哪一組，最符合優養化讓水中缺氧的順序？`,`Which sequence best fits how eutrophication leads to low oxygen?`),P('營養鹽多→藻類增生→分解耗氧→缺氧','More nutrients → algae → decay → less oxygen'),P('藻類增生→營養鹽減少→水中氧增加','Algae multiply → fewer nutrients → more oxygen'),P('水中先缺氧→藻類增生→營養鹽增加','Low oxygen → algae grow → more nutrients'),P('水變綠→藻類變多→溶氧升高→魚更健康','Water turns green → fish are surely healthier'),0,P(`營養鹽 → 藻 → 遮光 → 分解耗氧 → 缺氧。`,`Nutrients → algae → shading → decomposition → low oxygen.`),P(`看「養分多了，氧怎麼不見」第二到六步。`,`See "More nutrients, less oxygen", steps two to six.`)),
  MC(P(`看到一杯水是綠色的，可以怎麼說？`,`A cup of water looks green. What can we say?`),P('顏色只是線索，還要看資料','Colour is a clue; more data is needed too'),P('一定是優養化，不必再檢測','It is surely eutrophic, so skip testing'),P('顏色就等於完整的檢測結果','Colour alone is already the test result'),P('酸雨和優養化其實是同一原因','Acid rain and eutrophication share a cause'),0,P(`水色不是檢測；不同的汙染走不同的途徑。`,`Water colour is not a test, and different pollution takes different routes.`),P(`看「看顏色夠不夠」與「汙染從哪裡來」。`,`See "Is colour enough?" and "Where pollution comes from".`))]},
{id:'concentration-in-food-chain',title:P(`總量多，濃度就高？`,`Does more total mean more concentrated?`),sub:P(`生物累積與生物放大`,`Bioaccumulation and biomagnification`),
 hook:P(`大魚體內的物質總量較多，就能證明每公斤含量也較高嗎？`,`If a large fish contains more of a substance in total, does that show it contains more per kilogram?`),
 body:P(`同一個體從環境與食物攝入物質，攝入相對於排除造成體內累積，稱為生物累積。生物放大則比較食物鏈不同營養階層的濃度：某些難代謝或排除的物質，可能在較高階消費者有較高濃度。濃度是物質量除以組織質量，總量較多不等於濃度較高。`,`Bioaccumulation is buildup within an organism through uptake from its environment and food relative to elimination. Biomagnification compares concentrations across trophic levels: some poorly metabolised or eliminated substances can reach higher concentrations in higher consumers. Concentration is amount divided by tissue mass; a larger total is not necessarily a higher concentration.`),
 reading:P(`動畫的四個框代表等質量組織，單位／kg 是自訂的教學濃度；2 倍、4 倍不是自然界固定倍率，也不是書中的 ppm 數據。容易排除的情境只是對照，不代表所有物質都按同一速率下降。水體的顏色不能測出體內毒物。歷史上水俁症的探究留待學生推論，不預填食物鏈答案、不提供飲食安全或診療建議。能量沿食物鏈往上變少，與難排除物質的濃度往上變高，是不同的量。`,`The four boxes in the animation represent equal tissue mass; units/kg are invented teaching concentrations. Factors of two and four are neither universal laws nor the ppm values in the source. The readily eliminated case is a comparison, not a universal decline rate. Water colour cannot measure tissue contaminants. Leave the historical Minamata inquiry for student reasoning without prefilled food-chain answers, dietary-safety or treatment advice. Energy gets less going up a food chain while the concentration of a hard-to-remove substance gets higher; these are different quantities.`),
 closure:P(`個體隨時間看累積；跨階層看濃度放大，先確認比較的質量。`,`Accumulation follows an organism over time; magnification compares trophic concentrations, with mass specified.`),
 quiz:[
  MC(P(`「生物累積」和「生物放大」，哪一個說法正確？`,`Which statement about bioaccumulation and biomagnification is correct?`),P('累積是個體隨時間，放大比階層','Accumulate: one body; magnify: across levels'),P('累積是跨階層，放大是同一個體','Accumulate: across levels; magnify: one body'),P('兩者其實就是完全同一件事','They are exactly the very same thing here'),P('只有容易排除的物質會放大','Only substances easily removed will magnify'),0,P(`累積看一個個體隨時間；放大看食物鏈不同階層的濃度。`,`Accumulation follows one individual over time; magnification looks at concentrations at different levels of a food chain.`),P(`看「一個個體的累積」第四步。`,`See "Build-up in one individual", step four.`)),
  MC(P(`大魚體內共 20 點、質量 10；小魚共 5 點、質量 1（教學數字）。哪一句正確？`,`A big fish holds 20 dots with mass 10; a small fish holds 5 dots with mass 1 (teaching numbers). Which is correct?`),P('小魚每單位質量5，大魚為2','Small fish: 5 per unit mass; big fish: 2'),P('大魚總量多，所以濃度一定較高','Big fish has more total so higher density'),P('兩者的濃度剛好是一樣的','The two concentrations are exactly equal'),P('不用除以質量也能比濃度','Concentration needs no division by mass'),0,P(`濃度是量除以質量；總量大不等於濃度高。`,`Concentration is amount divided by mass; a larger total does not mean a higher concentration.`),P(`看「總量不等於濃度」第二步。`,`See "Total is not concentration", step two.`))]},
{id:'climate-ecological-change',title:P(`變暖，生命跟得上嗎？`,`Can life keep up with warming?`),sub:P(`溫室效應與生態變動`,`Greenhouse effect and ecological change`),
 hook:P(`適合生活的地方往山上移，所有生物都搬得過去嗎？`,`If suitable places shift uphill, can every organism move with them?`),
 body:P(`溫室氣體吸收地表放出的部分紅外線，並向各方向再放射；地球仍會向太空散熱。氣候變動可能改變適生範圍、開花繁殖時間與水分條件。珊瑚受壓力時可能失去部分共生藻或色素而白化；白化不等於已死亡，後續要看壓力與恢復條件。`,`Greenhouse gases absorb some surface infrared radiation and emit in all directions; Earth still loses energy to space. Climate changes can alter suitable ranges, flowering and breeding times and water conditions. Stressed corals may lose symbiotic algae or pigments and bleach; bleaching is not death, and outcomes depend on stress and recovery conditions.`),
 reading:P(`適生範圍變動與人為外來引入是不同過程，卻可能一起影響群集；不能將所有遷移物種叫入侵種。動畫的假設升溫只比較概念，不從符號算攝氏溫度。照片及課本事件不是最新海溫或年度統計，一張照片也不能確認變遷原因。事件的討論保留，請提出可能影響與所需證據。下一課：怎麼知道保護有沒有用。`,`Range shifts and human introductions are distinct processes that may jointly affect communities; migrating species are not automatically invasive. The assumed warming in the animation only compares concepts, without converting symbols to Celsius. Source images and events are not current temperatures or annual statistics, and one photo cannot establish the cause of change. Keep the event discussion open, proposing possible effects and evidence needed. Next lesson: how do we know whether protection works?`),
 closure:P(`輻射機制、假設情境與實際預測分開；生物遷移還受棲地連通限制。`,`Separate radiation mechanisms, scenarios and forecasts; habitat connectivity also constrains movement.`),
 quiz:[
  MC(P(`假設升溫，適合高山生物的條件往上移。山頂那一帶會怎樣？`,`With assumed warming, conditions suited to alpine life shift upward. What about the summit band?`),P('已無更高處可去，被擠壓','No higher ground exists; it is squeezed'),P('會一直往更高的地方搬','It keeps moving to still higher ground'),P('完全不會受到任何影響','It is not affected by warming at all'),P('會自動變成低海拔的森林','It automatically becomes lowland forest'),0,P(`山頂沒有更高的地方，適合的條件可能消失。這是假設的比較，不是預測。`,`The summit has no higher ground, so suitable conditions may vanish. This is an assumed comparison, not a forecast.`),P(`看「適合的條件往上搬」第四步。`,`See "Suitable conditions move uphill", step four.`)),
  MC(P(`關於珊瑚白化，哪一句最合理？`,`Which statement about coral bleaching is most reasonable?`),P('白化是藻離開，壓力解除可恢復','Bleaching is loss of algae; may recover'),P('白化就代表珊瑚已經完全死亡','Bleaching means the coral is already dead'),P('白化只因一種原因，看照片就知道','Bleaching has one cause a photo can confirm'),P('珊瑚本身其實就是一種植物','Coral is a kind of plant, not an animal'),0,P(`白化不等於死亡，要看壓力與恢復條件。`,`Bleaching is not death; it depends on stress and recovery conditions.`),P(`看「珊瑚為什麼變白」第四步。`,`See "Why corals turn white", step four.`))]}
];
const defs=[
 [['edge','fragment'],[leopardcat]],
 [['harvest','pathway','stages'],[tuna,yew,snail,crayfish,treefrog,iguana]],
 [['sources','chain','judge'],[eutrophication,river,factory]],
 [['bioacc','magnify','conc'],[river,tuna]],
 [['shift','timing','coral'],[coral,reef]]];
tabs.forEach((t,i)=>Object.assign(t,make(defs[i][0],defs[i][1])));
// the bridge sentence is only needed on the first tab; other tabs keep their old hooks
B.register({id:'environmental_threats',title:P(`生命的家，是怎麼被改變的？`,`How are the homes of living things being changed?`),subtitle:P(`棲地減少與破碎化、過度利用與外來入侵、汙染與水域優養化、生物累積與生物放大、溫室效應與生態變動`,`Habitat loss and fragmentation, overuse and biological invasions, pollution and eutrophication, bioaccumulation and biomagnification, greenhouse effect and ecological change`),cover:'assets/covers/biology_environmental_threats_1024_v1.jpg',
 assetDir:'assets/biology/environment_ai_1024/',family:P(`生命與環境`,`Life and environment`),bookName:P(`人類與環境`,`Humans and the environment`),tabs});
})();
