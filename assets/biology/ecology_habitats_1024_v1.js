/* Ecology lesson 4 · "Who can live in a different habitat?" V5 remake, 2026-10-24.
 * Four tabs, eleven views (plan: assets/biology/ecology_l4_plan_1024.md). ONE idea runs through the lesson:
 * "Which condition of this place is the hardest gate?"  Water, temperature, light, flow, salinity, tide, depth decide who can settle.
 * It does NOT repeat lessons 1-3 (forest layers, quadrats, succession; food chains, energy, carbon and nitrogen; + / 0 / - relationships, introduced species).
 *   land-habitats:     0 climate (rain x temperature map), 1 adapt (one problem, different solutions), 2 mountain (supplement: forests change with height)
 *   freshwater:        0 pondstream (still vs flowing water), 1 oxygen (s.warm 0 cooler / 1 warmer)
 *   coasts-ocean:      0 estuary (fresh meets salt), 1 tide (the intertidal zone), 2 oceanlight (s.clear 0 cloudier / 1 clearer)
 *   schoolyard-survey: 0 fairtest (a fair comparison), 1 evidence (seen / inferred / unknown), 2 settle (conditions, food, neighbours)
 * Pictures: ecology_ai_1023/ (teacher's Gemini AI illustrations, not photographs; HB1..HB18). Signs, curves, tools and marks are drawn by program.
 * Each view is drawn by its own module ecology_draw_<name>_1024_v1.js, registered as window.EcologyDraw[name] (canvas 960x600).
 * Per-view state the drawing modules read: s.phase (-1 play all, >=0 hold), s.start, oxygen s.warm, oceanlight s.clear.
 * Shared helpers: ecology_kit_1023_v1.js. Replaces the ecology_habitats entry of ecology_lessons_1010_v1.js (left there, unused).
 */
(()=>{'use strict';
const K=window.EcologyKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── picture and canvas labels used by the drawing modules (zh, en) ─────────
const LAB={
 aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`),schematic:P(`示意`,`Schematic`),sizeNoReal:P(`大小不代表真實大小`,`Sizes are not real sizes`),supplement:P(`補充`,`Supplement`),
 // conditions
 condition:P(`條件`,`Condition`),light:P(`光`,`Light`),temperature:P(`溫度`,`Temperature`),warm:P(`較暖`,`Warmer`),cool:P(`較冷`,`Cooler`),water:P(`水`,`Water`),rainfall:P(`雨量`,`Rainfall`),
 manyRain:P(`雨量多`,`More rain`),fewRain:P(`雨量少`,`Less rain`),hot:P(`熱`,`Hot`),cold:P(`冷`,`Cold`),dry:P(`乾`,`Dry`),wet:P(`濕`,`Wet`),
 fuzzy:P(`示意，邊界是漸變，不是固定的線`,`Schematic: boundaries blend, they are not fixed lines`),thisPlace:P(`這個地方`,`This place`),
 // land
 forest:P(`森林`,`Forest`),grassland:P(`草原`,`Grassland`),desert:P(`沙漠`,`Desert`),tundra:P(`凍原`,`Tundra`),hotDesert:P(`熱沙漠`,`Hot desert`),coldDesert:P(`寒冷的沙漠`,`Cold desert`),
 desertKey:P(`沙漠的關鍵是乾，不是熱`,`A desert is defined by dryness, not heat`),tundraAlive:P(`低溫、生長季短，仍有生命`,`Cold and a short growing season, yet still life`),
 lichen:P(`地衣`,`Lichen`),herb:P(`草本`,`Herbs`),dwarfShrub:P(`矮灌木`,`Low shrubs`),cactus:P(`仙人掌`,`Cactus`),stemStore:P(`莖：儲水`,`Stem: stores water`),spine:P(`刺：減少水分散失`,`Spines: cut water loss`),
 camel:P(`駱駝`,`Camel`),hump:P(`駝峰：儲存脂肪，不是水`,`Hump: stores fat, not water`),reindeer:P(`馴鹿`,`Reindeer`),thickFur:P(`厚毛`,`Thick fur`),problem:P(`難題`,`Problem`),solution:P(`解法`,`Solution`),
 lowGrowth:P(`貼地生長`,`Low, close to the ground`),lack:P(`缺水`,`Water shortage`),shortSeason:P(`冷、生長季短`,`Cold, short growing season`),
 // mountain
 foothill:P(`山腳`,`Foothills`),broadleaf:P(`闊葉林`,`Broadleaf forest`),mixed:P(`針闊混合林與霧`,`Mixed conifer-broadleaf forest and mist`),fir:P(`冷杉林`,`Fir forest`),summit:P(`山頂`,`Summit`),alpine:P(`矮灌叢與草坡`,`Low shrubs and grass slopes`),
 higherColder:P(`越高越冷`,`Higher, colder`),bandsBlend:P(`示意：各帶是漸變，不是固定的海拔界線`,`Schematic: zones blend, they are not fixed height lines`),
 // fresh water
 pond:P(`池塘`,`Pond`),stream:P(`溪流`,`Stream`),stillWater:P(`靜水`,`Still water`),flowingWater:P(`流水`,`Flowing water`),flow:P(`水流`,`Flow`),daphnia:P(`水蚤`,`Water flea`),shrimp:P(`米蝦`,`Freshwater shrimp`),crucian:P(`鯽魚`,`Crucian carp`),
 waterPlant:P(`水草`,`Water plants`),mud:P(`泥`,`Mud`),stones:P(`石頭與礫石`,`Stones and gravel`),bankLeaves:P(`岸邊落葉`,`Leaves from the bank`),hideBehind:P(`躲在石頭後`,`Sheltering behind a stone`),
 depth:P(`水深`,`Depth`),clearNotClean:P(`看起來清澈，不等於沒有汙染`,`Clear-looking water can still be polluted`),commonIn:P(`常見於`,`Common in`),
 dissolvedO2:P(`溶氧`,`Dissolved oxygen`),stirring:P(`攪動`,`Stirring`),surface:P(`水面`,`Surface`),day:P(`白天`,`Day`),night:P(`夜晚`,`Night`),photosynthesis:P(`光合作用放出氧`,`Photosynthesis releases oxygen`),respire:P(`呼吸用掉氧`,`Respiration uses oxygen`),
 sameOtherConditions:P(`其他條件相同`,`Other conditions the same`),notAlwaysMore:P(`溪流不一定比池塘高`,`Streams are not always higher than ponds`),
 // coast and ocean
 river:P(`河`,`River`),sea:P(`海`,`Sea`),estuary:P(`河口：河海交界`,`Estuary: where river meets sea`),salinity:P(`鹽度`,`Salinity`),fresh:P(`淡`,`Fresh`),salty:P(`鹹`,`Salty`),
 highTide:P(`漲潮`,`High tide`),lowTide:P(`退潮`,`Low tide`),highTideLine:P(`高潮線`,`High-tide line`),lowTideLine:P(`低潮線`,`Low-tide line`),intertidal:P(`潮間帶`,`Intertidal zone`),
 mangrove:P(`紅樹林`,`Mangroves`),mudskipper:P(`彈塗魚`,`Mudskipper`),fiddlerCrab:P(`招潮蟹`,`Fiddler crab`),spoonbill:P(`黑面琵鷺`,`Black-faced spoonbill`),mudflat:P(`泥灘`,`Mudflat`),
 exposure:P(`曝露`,`Exposure`),drying:P(`變乾`,`Drying out`),sun:P(`太陽曬`,`Sun`),burrow:P(`躲進洞`,`In the burrow`),inPool:P(`留在水窪`,`In the pool`),notOnlyEstuary:P(`潮間帶不只在河口`,`The intertidal zone is not only at estuaries`),
 sunlit:P(`有光：可以光合作用`,`Lit: photosynthesis possible`),tooDark:P(`光太少：不能光合作用`,`Too dark for photosynthesis`),dark:P(`沒有日光`,`No sunlight`),phytoplankton:P(`浮游藻類`,`Phytoplankton`),
 sinking:P(`沉下來的有機碎屑`,`Sinking organic particles`),isopod:P(`大王具足蟲`,`Giant isopod`),scavenger:P(`清除者、消費者`,`Scavenger, consumer`),jellyfish:P(`水母`,`Jellyfish`),notOnlyHere:P(`示意：不代表只住在這個深度`,`Schematic: not only found at this depth`),
 vent:P(`熱泉`,`Hydrothermal vent`),chemEnergy:P(`化學能`,`Chemical energy`),tubeWorm:P(`管蟲`,`Tube worms`),clearer:P(`較清澈`,`Clearer`),cloudier:P(`較混濁`,`Cloudier`),lightDepthNotFixed:P(`透光深度不是固定的數字`,`Light depth is not a fixed number`),
 // schoolyard
 openSite:P(`開闊處`,`Open site`),shadeSite:P(`遮蔭處`,`Shaded site`),quadrat:P(`樣框`,`Quadrat frame`),stopwatch:P(`碼表`,`Stopwatch`),thermometer:P(`溫度計`,`Thermometer`),lightMeter:P(`光度計`,`Light meter`),humidity:P(`濕度`,`Humidity`),hygrometer:P(`濕度計`,`Hygrometer`),
 sameArea:P(`範圍一樣`,`Same area`),sameTime:P(`時間一樣`,`Same time`),sameMethod:P(`方法一樣`,`Same method`),unfair:P(`不公平`,`Unfair`),fair:P(`公平`,`Fair`),record:P(`記錄`,`Record`),
 placeDateTime:P(`地點、日期、時間`,`Place, date, time`),noPicking:P(`不拔植物`,`Do not uproot plants`),noDanger:P(`不翻動、不捕捉危險生物`,`Do not disturb or catch dangerous animals`),noRoad:P(`不靠近車道`,`Keep away from roads`),noWater:P(`不靠近水邊`,`Keep away from water edges`),
 unsureTraits:P(`不確定先記特徵，不急著猜名字`,`If unsure, record traits first`),isItShade:P(`是遮蔭，還是找比較久？`,`Shade, or just searching longer?`),
 seen:P(`我看到的`,`What I saw`),inferred:P(`我推論的`,`What I infer`),notProven:P(`還沒證明`,`Not yet proven`),maybeHidden:P(`可能躲起來`,`May be hiding`),notSeenNotAbsent:P(`沒看到，不等於不存在`,`Not seeing is not the same as absent`),
 repeat:P(`重複調查`,`Repeat the survey`),trial:P(`第幾次`,`Trial`),chance:P(`偶然`,`Chance`),moreFactors:P(`遮蔭處同時也不一樣的條件`,`Other differences at the shaded site`),soil:P(`土壤`,`Soil`),changeOne:P(`下一次：一次只改一個條件`,`Next: change one condition at a time`),
 // settle
 gateCondition:P(`條件`,`Conditions`),gateFood:P(`食物`,`Food`),gateNeighbour:P(`鄰居`,`Neighbours`),settleHere:P(`住得下來`,`Can settle`),cannotSettle:P(`住不下來`,`Cannot settle`),food:P(`食物`,`Food`),
 competitor:P(`競爭者`,`Competitor`),enemy:P(`天敵`,`Natural enemy`),dryPond:P(`乾涸的池塘`,`Dried-up pond`),rapids:P(`湍急的水`,`Rapid water`)
};
K.LAB=LAB;window.EcologyLabels=LAB;

// ── land / climate ─────────────────────────────────────────────────────────
const CL_SHORT=[P(`暖又多雨`,`Warm and wet`),P(`雨量變少`,`Less rain`),P(`溫度變低`,`Colder`),P(`又冷又乾`,`Cold and dry`)];
const CL_NAMES=[P(`暖又多雨：森林`,`Warm and wet: forest`),P(`只讓雨量變少：草原到沙漠`,`Only less rain: grassland to desert`),P(`只讓溫度變低：凍原`,`Only colder: tundra`),P(`補充：又冷又乾`,`Supplement: cold and dry`)];
const CL_TEXT=[
 P(`溫度高、雨量多的地方，常見森林：樹要長得高大，需要足夠的水，也需要適合生長的溫度。右邊的風景是示意，地圖上的色塊是漸變，不是固定的線。（AI 插圖，非實拍。）`,`Forests are common where it is warm and wet: tall trees need enough water and a suitable temperature. The landscape on the right is schematic and the colour patches on the map blend, they are not fixed lines. (AI illustrations, not photos.)`),
 P(`溫度不變，只把雨量往下拉：森林變成草原，再變成沙漠。沙漠的關鍵是乾，不是熱；沒有足夠的水，高大的樹就長不起來。`,`Keep the temperature and lower only the rainfall: forest becomes grassland, then desert. A desert is defined by dryness, not heat; without enough water tall trees cannot grow.`),
 P(`回到雨量中等，只把溫度往下拉：變成凍原。凍原冷、生長季短，樹長不高，但仍有地衣、草本和矮灌木，不是沒有生命。`,`Return to moderate rainfall and lower only the temperature: tundra. Tundra is cold with a short growing season and trees stay low, but lichens, herbs and low shrubs still live there, so it is not lifeless.`),
 P(`補充：又冷又乾的地方，也可以是沙漠，叫寒冷的沙漠；又熱又乾的是熱沙漠。所以不能說「沙漠一定很熱」。看環境要把兩個條件一起看。`,`Supplement: a place that is both cold and dry can also be a desert, a cold desert; hot and dry is a hot desert. So we cannot say "deserts are always hot". Read the two conditions together.`)];

// ── land / adapt ───────────────────────────────────────────────────────────
const AD_SHORT=[P(`沙漠：缺水`,`Desert: water`),P(`駱駝的駝峰`,`Camel's hump`),P(`凍原：冷`,`Tundra: cold`),P(`馴鹿的厚毛`,`Reindeer's fur`)];
const AD_NAMES=[P(`仙人掌：把水存起來、少散失`,`Cactus: store water, lose less`),P(`駝峰：存的是脂肪`,`The hump stores fat`),P(`矮灌木與地衣：長得矮、耐冷`,`Low shrubs and lichens: low and cold-tolerant`),P(`馴鹿：厚毛保暖`,`Reindeer: thick fur keeps warm`)];
const AD_TEXT=[
 P(`沙漠最卡的是缺水。仙人掌的粗莖可以儲水，葉變成刺，減少水分從葉散失。（AI 插圖，非實拍。）`,`In a desert the hardest gate is water. A cactus's thick stem stores water and its leaves are reduced to spines, which cuts water lost through leaves. (AI illustration, not a photo.)`),
 P(`駱駝的駝峰儲存的是脂肪，不是水。沙漠的動物各有各的辦法，這只是其中一個例子。`,`A camel's hump stores fat, not water. Desert animals each have their own ways, and this is only one example.`),
 P(`凍原最卡的是低溫和很短的生長季。矮灌木貼著地面長，地衣長在石頭上；植物長得矮，是適應這裡的條件。`,`In tundra the hardest gate is low temperature and a very short growing season. Low shrubs grow close to the ground and lichens grow on rocks; staying low suits these conditions.`),
 P(`馴鹿有厚厚的毛，幫助牠在寒冷的環境保暖。同一類難題，不同的生物有不同的解法。`,`A reindeer has thick fur, which helps it keep warm in the cold. The same kind of problem, solved differently by different organisms.`)];

// ── land / mountain (supplement) ───────────────────────────────────────────
const MT_SHORT=[P(`山腳`,`Foothills`),P(`往上`,`Going up`),P(`山頂`,`Summit`)];
const MT_NAMES=[P(`山腳：較暖，闊葉林`,`Foothills: warmer, broadleaf forest`),P(`往上：越來越冷，針葉林與霧`,`Going up: colder, conifers and mist`),P(`山頂：更冷，樹長不高`,`Summit: colder still, trees stay low`)];
const MT_TEXT=[
 P(`補充：臺灣的高山，從山腳到山頂，溫度一路下降，林相跟著改變。山腳較暖，常見闊葉林。這是概略的示意，不同的山、不同的坡向，界線都不一樣。（AI 插圖，非實拍。）`,`Supplement: on a high Taiwanese mountain, temperature falls from foothills to summit and the forest changes with it. The foothills are warmer and broadleaf forest is common. This is a rough illustration; the limits differ from mountain to mountain and slope to slope. (AI illustrations, not photos.)`),
 P(`往上走，溫度更低，霧也多了：先是針葉樹和闊葉樹混生，再往上是整片的冷杉。各帶是漸變，不是固定的海拔界線。`,`Higher up it gets colder and mistier: first conifers mix with broadleaf trees, then comes fir forest. The zones blend and are not fixed height lines.`),
 P(`接近山頂更冷、風也大，樹長不高，常見矮的圓柏、箭竹草坡和裸岩。高度和緯度都會讓溫度下降，所以看到的變化有點像往寒冷的地方走。`,`Near the summit it is colder and windier and trees stay low: low junipers, bamboo grass slopes and bare rock. Both height and latitude lower the temperature, so the change looks a little like travelling toward colder places.`)];

// ── fresh water / pondstream ───────────────────────────────────────────────
const PS_SHORT=[P(`水動不動`,`Does it flow`),P(`誰留得住`,`Who stays put`),P(`光與深度`,`Light and depth`),P(`底質與岸邊`,`Bottom and banks`)];
const PS_NAMES=[P(`池塘是靜水，溪流是流水`,`A pond is still water, a stream is flowing water`),P(`流水：誰留得住？`,`Flowing water: who stays put?`),P(`光到不到水底`,`Does light reach the bottom`),P(`泥底還是石底，岸邊還送來落葉`,`Mud or stones, and leaves from the bank`)];
const PS_TEXT=[
 P(`池塘的水幾乎不流，叫靜水；溪流的水一直往前流，叫流水。同樣是淡水，水動不動，就是第一個不同。（AI 插圖，非實拍。）`,`A pond's water hardly moves, so it is still water; a stream's water keeps flowing, so it is flowing water. Both are fresh water, and whether the water moves is the first difference. (AI illustrations, not photos.)`),
 P(`流水會把輕的東西往下游沖。溪流裡的米蝦躲在石頭後面，比較不容易被沖走；池塘的水蚤和鯽魚在靜水裡可以自在地漂游。這裡只說牠們「常見於」哪裡，不是說某種動物只住在某一種水域。`,`Flowing water carries light things downstream. A freshwater shrimp sheltering behind a stone is less likely to be swept away; water fleas and crucian carp can drift and swim freely in still water. This only says where they are common, not that an animal lives in only one kind of water.`),
 P(`光從水面進來，越深越暗。圖中的池塘較深，光到不了水底，水草多長在淺處；圖中的溪流較淺，光能一路照到底。這是示意，要知道某個池塘或溪流實際的情形，得去量。`,`Light enters from the surface and fades with depth. The pond shown is deeper, so light does not reach the bottom and water plants grow mostly in the shallows; the stream shown is shallow and light reaches the bottom. This is schematic; to know a real pond or stream you must measure it.`),
 P(`池塘底多半是泥，溪流底多半是石頭和礫石。兩岸的樹會把落葉送進水裡，是水裡有機物的來源之一。看起來清澈的水，不等於沒有汙染。`,`A pond bottom is usually mud, a stream bottom usually stones and gravel. Trees on the banks drop leaves into the water, one source of organic matter. Water that looks clear is not necessarily unpolluted.`)];

// ── fresh water / oxygen ───────────────────────────────────────────────────
const OX_SHORT=[P(`氧怎麼進水`,`Oxygen gets in`),P(`水溫`,`Water temperature`),P(`白天與夜晚`,`Day and night`)];
const OX_NAMES=[P(`空氣的氧溶進水裡`,`Oxygen from the air dissolves in water`),P(`水越暖，溶的氧越少`,`The warmer the water, the less oxygen it holds`),P(`補充：水草白天放氧，夜晚也在呼吸`,`Supplement: water plants release oxygen by day and also respire at night`)];
const oxText=s=>{const w=(s.warm|0)===1;return[
 P(`水裡的魚也要呼吸氧。氧從水面溶進水裡，水面被攪動（例如急流）時，溶進去的更多。不過溪流不一定比池塘高，還要看水溫、流動和生物的活動。（示意）`,`Fish in water need oxygen too. Oxygen dissolves in from the surface, and more dissolves when the surface is stirred, for example by rapids. But a stream is not always higher than a pond; temperature, flow and the activity of organisms matter. (Schematic)`),
 w?P(`水比較暖時，能溶進水裡的氧比較少，魚可能游到水面附近。比較時只改水溫，其他條件相同。`,`When the water is warmer it holds less dissolved oxygen, and fish may swim near the surface. Change only the temperature and keep the other conditions the same.`)
  :P(`水比較冷時，能溶進水裡的氧比較多。比較時只改水溫，其他條件相同。切到「較暖」比一比。`,`When the water is cooler it holds more dissolved oxygen. Change only the temperature and keep the other conditions the same. Switch to "Warmer" to compare.`),
 P(`補充：白天，水草行光合作用放出氧，水裡的氧增加；夜晚沒有光，水草和所有生物都在呼吸，氧會減少，天亮前可能最少。這是示意，不是量測的資料。`,`Supplement: by day water plants photosynthesise and release oxygen, so dissolved oxygen rises; at night there is no light, plants and all organisms respire, and oxygen falls, possibly lowest before dawn. This is schematic, not measured data.`)];};

// ── coast and ocean / estuary ──────────────────────────────────────────────
const ES_SHORT=[P(`河遇到海`,`River meets sea`),P(`漲潮`,`High tide`),P(`退潮`,`Low tide`),P(`誰住在這裡`,`Who lives here`)];
const ES_NAMES=[P(`河口：淡水和海水相遇`,`Estuary: fresh water meets seawater`),P(`漲潮：鹹水往上游推`,`Rising tide: salt water pushes upstream`),P(`退潮：河水推回海邊，泥灘露出`,`Falling tide: river pushes back, mud is exposed`),P(`要面對鹽度和水位的變化`,`Facing changes in salinity and water level`)];
const ES_TEXT=[
 P(`河口是河流入海的地方，淡水和海水在這裡相遇，越往海那邊水越鹹。圖上的顏色代表鹽度，是示意。（AI 插圖，非實拍。）`,`An estuary is where a river enters the sea; fresh water and seawater meet and the water gets saltier toward the sea. Colours show salinity and are schematic. (AI illustration, not a photo.)`),
 P(`漲潮時，海水往上游推，水位上升，鹹水的邊界往河裡移動。`,`At high tide seawater pushes upstream, the water level rises and the salty boundary moves into the river.`),
 P(`退潮時，河水把邊界推回海邊，水位下降，泥灘露出來。漲潮、退潮來回，河口的鹽度和水位就一直在變。`,`At low tide the river pushes the boundary back toward the sea, the water level falls and the mudflat is exposed. As tides come and go, salinity and water level here keep changing.`),
 P(`紅樹林、彈塗魚和招潮蟹都住在這裡，牠們要面對鹽度和水位的變化；黑面琵鷺會在露出的泥灘覓食。（AI 插圖，非實拍，大小不代表真實大小。）`,`Mangroves, mudskippers and fiddler crabs live here and must cope with changing salinity and water level; black-faced spoonbills feed on the exposed mudflat. (AI illustrations, not photos; sizes are not real.)`)];

// ── coast and ocean / tide ─────────────────────────────────────────────────
const TD_SHORT=[P(`兩條線`,`Two lines`),P(`露出來的難題`,`Exposure problems`),P(`怎麼應付`,`Coping`)];
const TD_NAMES=[P(`高潮線與低潮線之間：潮間帶`,`Between the high- and low-tide lines: the intertidal zone`),P(`退潮：露出空氣中`,`Low tide: exposed to air`),P(`躲進洞裡、留在水窪`,`In a burrow, in a pool`)];
const TD_TEXT=[
 P(`高潮時水淹到的最高處，叫高潮線；低潮時水退到的最低處，叫低潮線。兩條線之間，一會兒被水淹、一會兒又露出來的地方，叫潮間帶。潮間帶不只在河口，岩岸和沙灘也有。（AI 插圖，非實拍。）`,`The highest point the water reaches at high tide is the high-tide line and the lowest at low tide the low-tide line. Between them, the place covered by water and then exposed again is the intertidal zone. It is not only at estuaries; rocky shores and beaches have it too. (AI illustrations, not photos.)`),
 P(`退潮時，潮間帶露出在空氣中：太陽曬、水分蒸發，水窪的鹽度也可能改變。這些都是平常泡在水裡的生物要面對的難題。`,`At low tide the intertidal zone is exposed to air: sun, evaporation, and pool salinity may change. These are problems for organisms that are usually under water.`),
 P(`招潮蟹躲進洞裡，彈塗魚留在水窪裡。漲潮時水回來，牠們又被水淹過。（示意）`,`A fiddler crab shelters in its burrow and a mudskipper stays in a pool. When the tide returns, water covers them again. (Schematic)`)];

// ── coast and ocean / oceanlight ───────────────────────────────────────────
const OL_SHORT=[P(`光進水`,`Light enters`),P(`光太少`,`Too little light`),P(`全黑的深處`,`The dark deep`),P(`熱泉`,`Vents`)];
const OL_NAMES=[P(`陽光進水，越深越暗`,`Sunlight enters and fades with depth`),P(`光太少，不能光合作用`,`Too little light for photosynthesis`),P(`沒有日光的深處`,`The deep with no sunlight`),P(`補充：熱泉`,`Supplement: hydrothermal vents`)];
const olText=s=>{const c=(s.clear|0)===1;return[
 c?P(`海水比較清澈時，光可以照得比較深。透光的上層有光，浮游藻類和珊瑚礁的藻可以行光合作用。透光的深度不是固定的數字，要看海水清不清澈。`,`When the sea is clearer, light reaches deeper. In the lit upper layer, phytoplankton and reef algae can photosynthesise. The depth of light is not a fixed number; it depends on how clear the water is.`)
  :P(`海水比較混濁時，光照得比較淺，只有很淺的上層夠亮。透光的深度不是固定的數字，要看海水清不清澈。切到「較清澈」比一比。`,`When the sea is cloudier, light reaches less deep and only a thin upper layer is bright. The depth of light is not a fixed number; it depends on how clear the water is. Switch to "Clearer" to compare.`),
 P(`再往下，光越來越少，少到不能光合作用。這裡的生物要吃別的東西。（示意：水母放在這裡只是示意，不代表牠只住在這個深度。）`,`Further down there is less and less light, too little for photosynthesis. Organisms here must eat other things. (Schematic: the jellyfish is only illustrative and does not live only at this depth.)`),
 P(`深處完全沒有日光。上層死掉的生物與排遺會一點一點沉下來，叫沉降的有機碎屑，是深處生物的食物來源之一。大王具足蟲吃沉下來的殘骸，是清除者、消費者。沒有日光，不等於沒有生命。（AI 插圖，非實拍，示意。）`,`The deep has no sunlight at all. Dead organisms and wastes from above sink bit by bit as organic particles, one food source for deep organisms. The giant isopod eats sunk remains and is a scavenger and consumer. No sunlight does not mean no life. (AI illustration, not a photo; schematic.)`),
 P(`補充：深海熱泉附近，有些微生物利用熱泉噴出的化學物質裡的化學能製造養分，不靠日光，也支持周圍的生物。（AI 插圖，非實拍，示意。）`,`Supplement: near deep-sea vents some microbes use chemical energy in the vented chemicals to make nutrients without sunlight, and support organisms around them. (AI illustration, not a photo; schematic.)`)];};

// ── schoolyard / fairtest ──────────────────────────────────────────────────
const FT_SHORT=[P(`不公平`,`Unfair`),P(`範圍一樣`,`Same area`),P(`時間一樣`,`Same time`),P(`記環境因子`,`Record conditions`),P(`安全與不傷害`,`Safety`)];
const FT_NAMES=[P(`先看一次不公平的比較`,`First, an unfair comparison`),P(`第一要一樣：範圍`,`First same thing: the area`),P(`第二要一樣：時間與方法`,`Second same thing: time and method`),P(`一起記下環境因子`,`Record the conditions too`),P(`調查時，也要保護生物和自己`,`Protect organisms and yourself`)];
const FT_TEXT=[
 P(`遮蔭處找了很久、範圍又大；開闊處只找一下。結果是「遮蔭 12 隻、開闊 4 隻」（示意）。這能說是遮蔭讓昆蟲變多嗎？不能，因為找的方式就不一樣。（AI 插圖，非實拍。）`,`The shaded site was searched for long and over a big area, the open site briefly. The result: "12 in shade, 4 in the open" (schematic). Does that show shade increases insects? No, because the searching was not alike. (AI illustrations, not photos.)`),
 P(`第一個要一樣的是範圍：兩處都用同樣大小的樣框。`,`The first thing to keep the same is the area: use frames of the same size at both sites.`),
 P(`第二個要一樣的是時間和努力程度：同樣的分鐘數、同樣的觀察方法、同樣的人數。`,`The second thing to keep the same is time and effort: the same minutes, the same observing method and the same number of people.`),
 P(`然後一起記下環境因子：光、溫度、濕度。照片要附地點、日期和時間。還可以量風和土壤的酸鹼，由老師安排器材和一致的做法。（數字為示意）`,`Then record the conditions: light, temperature and humidity. Photos need place, date and time. Wind and soil acidity can also be measured with equipment and procedures arranged by the teacher. (Numbers are schematic)`),
 P(`調查時要保護生物，也要保護自己：不拔植物、不翻動或捕捉危險的生物、不靠近車道、不靠近水邊。不確定是什麼生物時，先記下特徵，不急著猜名字。`,`While surveying, protect organisms and yourself: do not uproot plants, do not disturb or catch dangerous animals, keep away from roads and water edges. If you are unsure what an organism is, record its traits first rather than guessing a name.`)];

// ── schoolyard / evidence ──────────────────────────────────────────────────
const EV_SHORT=[P(`看到與推論`,`Seen and inferred`),P(`沒看到`,`Not seen`),P(`重複調查`,`Repeat`),P(`還不能下結論`,`No conclusion yet`)];
const EV_NAMES=[P(`我看到的，和我推論的`,`What I saw, and what I infer`),P(`沒看到，不等於不存在`,`Not seeing is not the same as absent`),P(`重複幾次，才分得出偶然`,`Repeat to tell chance apart`),P(`還不能說「因為遮蔭」`,`We cannot yet say "because of shade"`)];
const EV_TEXT=[
 P(`把紀錄分成兩欄：「我看到的」是兩處各有幾隻、溫度和濕度；「我推論的」是「遮蔭讓昆蟲變多」。推論要有更多證據才算數，先標「還沒證明」。（示意）`,`Sort the record into two columns: "what I saw" is the counts at each site, temperature and humidity; "what I infer" is "shade increases insects". An inference needs more evidence, so mark it "not yet proven". (Schematic)`),
 P(`放大鏡掃過去，才發現葉子下面躲著蚱蜢，土裡縮著田螺。生物可能躲起來、活動的時間不同，或不好辨認，所以沒看到，不等於不存在。（AI 插圖，非實拍。）`,`Only when the magnifier passes do we see a grasshopper under a leaf and a snail in the soil. Organisms may hide, be active at other times or be hard to identify, so not seeing them does not mean they are absent. (AI illustrations, not photos.)`),
 P(`同樣的方法調查三次：遮蔭處每次不一定都比開闊處多。重複幾次，才分得出哪些差異可能只是偶然。數字是示意，不是真實的調查資料。`,`Surveying three times in the same way: the shaded site does not always beat the open one. Repeats show which differences may be chance. The numbers are schematic, not real survey data.`),
 P(`遮蔭處同時也比較涼、比較濕、土壤也不一樣，光只是其中一個差別。所以兩地比較，還不能證明是遮蔭造成的。下一次，一次只改一個條件，再比較。`,`The shaded site is also cooler, wetter and has different soil; light is only one difference. So a two-site comparison cannot prove shade is the cause. Next time, change one condition at a time and compare.`)];

// ── schoolyard / settle ────────────────────────────────────────────────────
const SE_SHORT=[P(`條件關`,`Conditions`),P(`食物關`,`Food`),P(`鄰居關`,`Neighbours`),P(`三關都過`,`All three`)];
const SE_NAMES=[P(`第一關：條件合不合`,`Gate one: do the conditions fit`),P(`第二關：吃得到嗎`,`Gate two: is there food`),P(`第三關：和鄰居相處`,`Gate three: living with neighbours`),P(`三關都過，才住得下來`,`Pass all three to settle`)];
const SE_TEXT=[
 P(`一隻鯽魚想搬家。第一關是條件：靜水的池塘合適，湍急的水對牠不一定合適，乾涸的池塘不行。`,`A crucian carp wants to move. The first gate is conditions: a still pond suits it, rapid water may not, and a dried-up pond does not.`),
 P(`第二關是食物：這裡有沒有牠能吃的東西？前面學過，食物是生物活下去的來源。`,`The second gate is food: is there something it can eat? Food is what keeps organisms alive.`),
 P(`第三關是鄰居：有沒有競爭者、有沒有天敵？生物之間的關係，可以用得益、受害、看不出明顯影響來描述。`,`The third gate is neighbours: are there competitors or natural enemies? Relationships between organisms can be described as gaining, harmed or no evident effect.`),
 P(`三關都過了，才住得下來。換個環境，誰能住下來？先看這三件事：條件、食物、鄰居。`,`Only after all three gates can it settle. Who can live in a different place? First look at these three things: conditions, food and neighbours.`)];

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;
 K.panel(c,40,40,880,520,'#16332b');
 K.text(c,P(`動畫製作中`,`Animation in progress`),480,270,40,C.yellow,'center');
 K.text(c,short[k],480,330,28,C.white,'center');
 K.text(c,P(`（${name}）`,`(${name})`),480,372,22,C.muted,'center');
 K.pulse(c,480,440,t,C.cyan,14);};
const dr=(name,n,short)=>(c,s,t)=>((window.EcologyDraw&&window.EcologyDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const RESTART=new Set(['phase','warm','clear']);
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}else if(RESTART.has(k))s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const VIEW=(tabsArr)=>choice(P(`觀察`,`View`),'view',tabsArr.map((n,i)=>[i,n]));
const OXC=choice(P(`水溫`,`Water temperature`),'warm',[[0,P(`較冷`,`Cooler`)],[1,P(`較暖`,`Warmer`)]]);
const OLC=choice(P(`海水`,`Seawater`),'clear',[[0,P(`較混濁`,`Cloudier`)],[1,P(`較清澈`,`Clearer`)]]);
const INIT=()=>({running:true,view:0,phase:-1,start:0,warm:0,clear:1});
// one view = {key, n, short, names, text(s) -> array, opt}
const V=(key,short,names,text,opt)=>({key,n:short.length,short,names,text:typeof text==='function'?text:()=>text,opt});
const LAND_V=[V('climate',CL_SHORT,CL_NAMES,CL_TEXT),V('adapt',AD_SHORT,AD_NAMES,AD_TEXT),V('mountain',MT_SHORT,MT_NAMES,MT_TEXT)];
const FRESH_V=[V('pondstream',PS_SHORT,PS_NAMES,PS_TEXT),V('oxygen',OX_SHORT,OX_NAMES,oxText,OXC)];
const COAST_V=[V('estuary',ES_SHORT,ES_NAMES,ES_TEXT),V('tide',TD_SHORT,TD_NAMES,TD_TEXT),V('oceanlight',OL_SHORT,OL_NAMES,olText,OLC)];
const YARD_V=[V('fairtest',FT_SHORT,FT_NAMES,FT_TEXT),V('evidence',EV_SHORT,EV_NAMES,EV_TEXT),V('settle',SE_SHORT,SE_NAMES,SE_TEXT)];
const LAND_TABS=[P(`雨量與溫度地圖`,`Rain and temperature map`),P(`同一個難題，不同解法`,`One problem, different solutions`),P(`補充：爬山`,`Supplement: climbing a mountain`)];
const FRESH_TABS=[P(`靜水與流水`,`Still and flowing water`),P(`水裡的氧`,`Oxygen in water`)];
const COAST_TABS=[P(`河口`,`Estuary`),P(`潮間帶`,`Intertidal zone`),P(`海洋的光`,`Light in the ocean`)];
const YARD_TABS=[P(`公平比較`,`A fair comparison`),P(`證據與推論`,`Evidence and inference`),P(`能不能住下來`,`Can it settle`)];
const wire=(views,names)=>({
 controls:s=>{const v=views[s.view]||views[0];return[VIEW(names),steps(v.short),...(v.opt?[v.opt]:[])];},
 act:viewAct,
 explain:s=>{const v=views[s.view]||views[0],k=pick(s);return{title:v.names[k],text:v.text(s)[k]};},
 draw:(c,s,t)=>{const v=views[s.view]||views[0];return dr(v.key,v.n,v.short)(c,s,t);}});

const tabs=[
{id:'land-habitats',title:P(`雨量與溫度`,`Rainfall and temperature`),sub:P(`陸域生態系`,`Terrestrial ecosystems`),
 hook:P(`前面看的是生物之間怎麼互相影響。這一課換個問題：同一種生物搬到別的地方，還活得下來嗎？先問：沙漠一定很熱、凍原一定沒有生命嗎？`,`So far we looked at how organisms affect each other. This lesson asks something else: if an organism moves elsewhere, can it still live? First: must deserts be hot and tundra lifeless?`),
 body:P(`森林、草原、沙漠和凍原的生物組成，受到水分、溫度、光照和干擾等條件影響。森林有層次，草原多草本；沙漠的關鍵是乾旱，不一定高溫；凍原常受低溫和短生長季限制，仍有地衣、草本和矮灌木。先看雨量和溫度怎麼挑地方，再看生物怎麼應付最卡的那一關。`,`Water, temperature, light and disturbance influence communities in forests, grasslands, deserts and tundra. Forests have layers and grasslands are herb-dominated; a desert is defined by aridity, not necessarily heat; tundra is limited by cold and a short growing season yet still has lichens, herbs and low shrubs. First see how rainfall and temperature pick a place, then how organisms cope with the hardest gate.`),
 reading:P(`臺灣的山地，隨海拔升高，溫度降低，林相也不同，可以比較溫度與植被；但海拔帶只是概略，不是全球固定的界線，不同的山、不同的坡向都不一樣。草原還會受放牧與火影響，不能只看一個雨量門檻。\n\n沙漠生物各有適應，駱駝的駝峰儲存脂肪，不是水箱。畫面上的地圖是示意：色塊是漸變，不是固定的線，不是計算某種樹的存活率，也不是按一下就真實完成生態系的轉換。`,`On Taiwan's mountains, temperature falls and forests change with height, so we can compare temperature and vegetation; but height bands are approximate, not global fixed boundaries, and differ by mountain and slope. Grazing and fire also shape grasslands, so one rainfall threshold is not enough.\n\nDesert organisms have various adaptations; a camel's hump stores fat, not a tank of water. The map is schematic: its colour patches blend and are not fixed lines; it does not calculate the survival of any tree or instantly change one ecosystem into another.`),
 closure:P(`用雨量和溫度兩個條件一起看，不用單一標籤決定一個地方有什麼。每個地方都有最卡的一關，生物有各自的解法。`,`Read rainfall and temperature together rather than letting one label decide what lives somewhere. Every place has a hardest gate, and organisms have their own ways through.`),
 quiz:[
  {q:P(`沙漠最關鍵的條件是什麼？`,`What is the key condition of a desert?`),options:[P(`一定很熱`,`It is always hot`),P(`雨量少、很乾`,`Little rain, very dry`),P(`一定有沙丘`,`It always has dunes`),P(`沒有任何生物`,`It has no organisms`)],answer:1,why:P(`沙漠的關鍵是乾，不一定熱；又冷又乾也可以是沙漠。`,`A desert is defined by dryness, not heat; a cold, dry place can also be a desert.`),hint:P(`看第二步和第四步。`,`See steps two and four.`)},
  {q:P(`駱駝的駝峰儲存的是什麼？`,`What does a camel's hump store?`),options:[P(`水`,`Water`),P(`脂肪`,`Fat`),P(`空氣`,`Air`),P(`沙`,`Sand`)],answer:1,why:P(`駝峰儲存脂肪，不是水箱。`,`The hump stores fat, not a water tank.`),hint:P(`切到「同一個難題，不同解法」看第二步。`,`Switch to "One problem, different solutions" and look at step two.`)},
  {q:P(`關於凍原，哪一句比較合理？`,`Which statement about tundra is more reasonable?`),options:[P(`完全沒有生命`,`It has no life at all`),P(`低溫、生長季短，但仍有地衣、草本和矮灌木`,`Cold with a short growing season, but lichens, herbs and low shrubs still live there`),P(`雨量越少越暖`,`The less rain, the warmer`),P(`長滿高大的樹`,`It is full of tall trees`)],answer:1,why:P(`凍原冷、生長季短，樹長不高，但不是沒有生命。`,`Tundra is cold with a short growing season and trees stay low, but it is not lifeless.`),hint:P(`看第三步。`,`Look at step three.`)}],
 sources:[],init:INIT,...wire(LAND_V,LAND_TABS)},
{id:'freshwater',title:P(`池塘與溪流`,`Ponds and streams`),sub:P(`淡水環境比較`,`Comparing fresh waters`),
 hook:P(`都是淡水，為什麼溪流和池塘看到的生物不一樣？`,`Both are fresh water, so why might a stream and a pond show different organisms?`),
 body:P(`淡水生態系包括池塘等靜水，和溪流等流水。流速、水深、透光、溶氧、底質和岸邊的輸入，都可能影響生物組成。先比較靜水和流水，再看水裡的氧從哪裡來。`,`Freshwater ecosystems include still waters such as ponds and flowing waters such as streams. Flow, depth, light, dissolved oxygen, the bottom and inputs from the bank can all affect communities. First compare still and flowing water, then see where the oxygen in water comes from.`),
 reading:P(`先看環境，再問需要量什麼。看起來清澈，不等於沒有汙染；溪流也不必然比池塘溶氧高，要看溫度、流動與生物的活動。畫面上的兩個淡水地景合併了多種條件，沒有量流速，也沒有量溶氧。\n\n比較兩個地方時一次只改一項、其他條件盡量相同，否則兩地的差異，就不能全部歸給水流。岸邊落葉可以是水裡有機物的來源，但並不是所有水生動物都只吃落葉。`,`Observe the setting first, then decide what to measure. Clear water is not proof of no pollution, and streams do not invariably have more oxygen than ponds; temperature, flow and biological activity matter. The two freshwater scenes combine many conditions and neither flow nor oxygen was measured.\n\nWhen comparing two places change one thing at a time and keep the others as similar as possible; otherwise not all the differences can be blamed on flow. Leaves from the bank can be a source of organic matter in water, but not every aquatic animal eats only leaves.`),
 closure:P(`同為淡水，流動、光、底質和溶氧仍然可以不同；比較時一次只改一個條件。`,`Fresh waters can differ in flow, light, bottom and dissolved oxygen; compare by changing one condition at a time.`),
 quiz:[
  {q:P(`池塘和溪流最直接的不同是什麼？`,`What is the most direct difference between a pond and a stream?`),options:[P(`一個是淡水、一個是海水`,`One is fresh, the other salt`),P(`水有沒有流動`,`Whether the water flows`),P(`一個有魚、一個沒有`,`One has fish and the other none`),P(`一個比較大`,`One is bigger`)],answer:1,why:P(`池塘是靜水，溪流是流水。`,`A pond is still water and a stream is flowing water.`),hint:P(`看第一步。`,`Look at step one.`)},
  {q:P(`其他條件相同，水溫升高時，水裡溶的氧會怎麼變？`,`With other conditions the same, what happens to dissolved oxygen when water gets warmer?`),options:[P(`變多`,`It rises`),P(`變少`,`It falls`),P(`完全不變`,`It stays the same`),P(`變成二氧化碳`,`It turns into carbon dioxide`)],answer:1,why:P(`水比較暖時，能溶進水裡的氧比較少。`,`Warmer water holds less dissolved oxygen.`),hint:P(`切到「水裡的氧」，把水溫從較冷切到較暖。`,`Switch to "Oxygen in water" and change the water from cooler to warmer.`)},
  {q:P(`看起來很清澈的溪水，一定沒有汙染嗎？`,`Is clear-looking stream water necessarily unpolluted?`),options:[P(`是，清澈就是乾淨`,`Yes, clear means clean`),P(`不一定，還要量才知道`,`Not necessarily; it must be measured`),P(`一定有汙染`,`It is always polluted`),P(`和汙染無關，只看流速`,`Pollution depends only on flow`)],answer:1,why:P(`看起來清澈，不等於沒有汙染。`,`Looking clear is not proof of no pollution.`),hint:P(`看第四步的最後一句。`,`See the last sentence of step four.`)}],
 sources:[],init:INIT,...wire(FRESH_V,FRESH_TABS)},
{id:'coasts-ocean',title:P(`河海交界到深海`,`From river mouths to the deep sea`),sub:P(`河口與海洋生態系`,`Estuarine and marine ecosystems`),
 hook:P(`漲潮時住處被水淹、退潮時又露出來，生物要面對哪些改變？`,`When a home is covered at high tide and exposed at low tide, what changes must organisms face?`),
 body:P(`河口在河海交界，鹽度和水位隨潮汐、河川流入而變；紅樹林、彈塗魚和招潮蟹是常見的例子。潮間帶是高潮線與低潮線之間的區域，不只在河口。海洋各深度的光照不同：透光的上層可以光合作用，深處仍有別的能量途徑支持生命。`,`Estuary salinity and water level change with tides and river inflow; mangroves, mudskippers and fiddler crabs are common examples. The intertidal zone lies between the high- and low-tide lines, not only at estuaries. Light differs with ocean depth: the sunlit upper water supports photosynthesis, while other energy routes support life deeper down.`),
 reading:P(`紅樹林落葉可以進入碎屑食物網，但不是所有河口動物都只吃落葉。海洋透光的深度還受水清不清澈影響，不能把約 200 公尺當成光合作用的固定界線。深海生物可以利用沉降的有機碎屑；熱泉附近還有利用化學能的生產者。\n\n大王具足蟲吞食殘骸，是清除者、消費者，不應該因此改叫菌類式的分解者。畫面上的圖都只是一次的局部景象，要判斷某個物種適不適合住在那裡，還需要長時間的水位、水質與生物資料。`,`Mangrove litter can enter detritus food webs, but not every estuarine animal eats only litter. Light depth also depends on how clear the water is, so about 200 m is not a fixed photosynthesis boundary. Deep-sea organisms may use sinking organic particles, and vents can support producers that use chemical energy.\n\nGiant isopods ingest remains as scavenging consumers, not as fungus-type decomposers. The pictures show one local scene each; judging whether a species suits a place needs long-term water-level, water-quality and biological data.`),
 closure:P(`河口會變動、潮間帶會曝露、海洋的光隨深度減少；沒有日光，不等於沒有生命。`,`Estuaries vary, intertidal zones are exposed and ocean light fades with depth; no sunlight does not mean no life.`),
 quiz:[
  {q:P(`河口的鹽度和水位為什麼一直在變？`,`Why do estuary salinity and water level keep changing?`),options:[P(`因為海水和河水不會混合`,`Seawater and river water never mix`),P(`因為潮汐來回，河水又不斷流進來`,`Tides come and go while the river keeps flowing in`),P(`因為魚在游`,`Because fish swim`),P(`因為月亮是圓的`,`Because the moon is round`)],answer:1,why:P(`漲潮把鹹水推進河裡，退潮河水推回海邊，來回之間鹽度與水位一直在變。`,`High tide pushes salt water in and low tide lets the river push back, so salinity and water level keep changing.`),hint:P(`看第二、三步。`,`See steps two and three.`)},
  {q:P(`「潮間帶」指的是哪裡？`,`What is the "intertidal zone"?`),options:[P(`只有河口的泥灘`,`Only estuary mudflats`),P(`高潮線和低潮線之間，一會兒被水淹、一會兒露出來的地方`,`The place between the high- and low-tide lines that is covered by water and then exposed`),P(`海最深的地方`,`The deepest part of the sea`),P(`河流的源頭`,`The source of a river`)],answer:1,why:P(`潮間帶不只在河口，岩岸和沙灘也有。`,`The intertidal zone is not only at estuaries; rocky shores and beaches have it too.`),hint:P(`看「潮間帶」第一步。`,`See step one of "Intertidal zone".`)},
  {q:P(`海水變混濁時，光能照到的深度會怎麼變？`,`How does the depth that light reaches change when the sea gets cloudier?`),options:[P(`變淺`,`It becomes shallower`),P(`變深`,`It becomes deeper`),P(`不變，固定是 200 公尺`,`It stays fixed at 200 m`),P(`和水無關`,`It has nothing to do with the water`)],answer:0,why:P(`透光的深度不是固定的數字，水越混濁，光照得越淺。`,`The depth of light is not a fixed number; the cloudier the water, the shallower light reaches.`),hint:P(`切到「海洋的光」，把海水切到較混濁。`,`Switch to "Light in the ocean" and set the seawater to cloudier.`)},
  {q:P(`深海完全沒有日光，為什麼仍可能有生物？`,`The deep sea has no sunlight at all. Why can organisms still live there?`),options:[P(`因為牠們不需要能量`,`They need no energy`),P(`因為有沉下來的有機碎屑，熱泉附近還有利用化學能的微生物`,`Sinking organic particles feed them, and near vents some microbes use chemical energy`),P(`因為深海其實有太陽`,`There is sun in the deep sea`),P(`因為牠們靠月光`,`They live on moonlight`)],answer:1,why:P(`沒有日光，不等於沒有生命；能量還有別的來源。`,`No sunlight does not mean no life; energy has other sources.`),hint:P(`看第三、四步。`,`See steps three and four.`)}],
 sources:[],init:INIT,...wire(COAST_V,COAST_TABS)},
{id:'schoolyard-survey',title:P(`校園就是研究場`,`The schoolyard is a research site`),sub:P(`控制條件與觀察紀錄`,`Controls and observation records`),
 hook:P(`陰影下看到的昆蟲比較多，是因為陰影，還是你在那裡找比較久？`,`More insects were seen in the shade: was it the shade, or did you simply search there longer?`),
 body:P(`選校園裡遮蔭處和開闊處，用相同的範圍、方法、觀察時間和努力程度比較。記錄光、溫度、濕度等環境因子和認得出的生物，照片附上地點、日期和時間。調查時不拔植物、不翻動或捕捉危險的生物、不靠近車道和水邊；不確定是什麼生物，先記特徵，不急著猜名字。最後，用三道關收束這個單元。`,`Compare shaded and open schoolyard sites with the same area, method, duration and effort. Record light, temperature, humidity and identifiable organisms, with place, date and time for photos. Do not uproot plants, disturb or catch dangerous animals, or go near traffic and water edges; if unsure what an organism is, record its traits instead of guessing its name. Finally, three gates close this unit.`),
 reading:P(`校園調查還可以量風與土壤酸鹼，由老師安排器材與一致的步驟。沒看到某種生物，不等於一定不存在：可能躲起來、活動時間不同或不好辨認。重複調查可以降低偶然，但「遮蔭處比較多」仍然不能只憑兩個地點的比較，就證明是遮蔭造成的。\n\n畫面上的數字都是示意，不是校園的實測資料。要研究因果，需要一次只改一個條件，再重複比較。`,`A schoolyard survey can also measure wind and soil acidity with teacher-arranged instruments and consistent procedures. Not seeing an organism does not prove it is absent; it may hide, be active at another time or be hard to identify. Repeats reduce chance effects, but a two-site comparison alone still does not prove that shade caused "more in the shade".\n\nNumbers on the screen are schematic, not real schoolyard data. To study cause, change one condition at a time and repeat the comparison.`),
 closure:P(`公平比較方法，再把觀察、推論和待查問題分開；住不住得下來，要看條件、食物和鄰居。`,`Compare methods fairly and separate observations, inferences and open questions; whether an organism can settle depends on conditions, food and neighbours.`),
 quiz:[
  {q:P(`比較遮蔭處和開闊處的昆蟲，哪一項要保持一樣？`,`Comparing insects at a shaded and an open site, what should be kept the same?`),options:[P(`範圍、時間和觀察方法`,`The area, time and method`),P(`只要範圍一樣就好`,`Only the area`),P(`只要時間一樣就好`,`Only the time`),P(`都不用一樣`,`Nothing needs to be the same`)],answer:0,why:P(`範圍、時間與方法、努力程度都要一樣，比較才公平。`,`Area, time, method and effort should all be the same for a fair comparison.`),hint:P(`看公平比較第二、三步。`,`See steps two and three of "A fair comparison".`)},
  {q:P(`調查時沒有看到某種昆蟲，最合理的說法是？`,`You did not see a certain insect during the survey. What is most reasonable to say?`),options:[P(`牠一定不存在`,`It definitely does not exist`),P(`不一定，牠可能躲起來、活動時間不同或不好辨認`,`Not necessarily; it may hide, be active at another time or be hard to identify`),P(`牠已經死了`,`It has died`),P(`是調查的人看錯`,`The observer made a mistake`)],answer:1,why:P(`沒看到，不等於不存在。`,`Not seeing is not the same as absent.`),hint:P(`切到「證據與推論」看第二步。`,`Switch to "Evidence and inference" and see step two.`)},
  {q:P(`兩個地點各調查一次，遮蔭處的昆蟲比較多，能證明是遮蔭造成的嗎？`,`Two sites were surveyed once each and the shaded one had more insects. Does this prove shade caused it?`),options:[P(`能，因為差很多`,`Yes, the difference is large`),P(`不能，遮蔭處還有別的不同，也要重複調查`,`No; the shaded site differs in other ways too, and surveys should be repeated`),P(`能，因為遮蔭比較涼`,`Yes, because shade is cooler`),P(`不需要調查`,`No survey is needed`)],answer:1,why:P(`兩地比較不能證明因果；下一次一次只改一個條件，再重複比較。`,`A two-site comparison cannot prove cause; next time change one condition at a time and repeat.`),hint:P(`看「證據與推論」第三、四步。`,`See steps three and four of "Evidence and inference".`)},
  {q:P(`一種生物搬到新的環境，要住得下來，要看哪三件事？`,`For an organism to settle in a new place, which three things matter?`),options:[P(`大小、顏色、名字`,`Size, colour, name`),P(`條件、食物、鄰居`,`Conditions, food, neighbours`),P(`日期、地點、天氣`,`Date, place, weather`),P(`只要有水就好`,`Water alone is enough`)],answer:1,why:P(`條件合不合、吃得到嗎、和鄰居相處得來嗎。`,`Whether conditions fit, whether there is food, and how it gets on with neighbours.`),hint:P(`切到「能不能住下來」。`,`Switch to "Can it settle".`)}],
 sources:[],init:INIT,...wire(YARD_V,YARD_TABS)}
];
B.register({id:'ecology_habitats',title:P(`換個環境，誰能住下來？`,`Who can live in a different habitat?`),subtitle:P(`陸域、水域與校園調查`,`Land, water and schoolyard investigations`),cover:'assets/covers/biology_ecology_habitats_1023_v1.jpg',
 assetDir:'assets/biology/ecology_ai_1023/',family:P(`生命與環境`,`Life and environment`),bookName:P(`生態系`,`Ecosystem`),tabs});
})();
