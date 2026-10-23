/* Ecology lesson 2 · "How can a leaf support a whole food web?" V5 remake, 2026-10-23.
 * Four tabs, ten views (plan: assets/biology/ecology_l2_plan_1023.md):
 *   roles:         0 roles (producer / consumer / decomposer / together), 1 leafdecay (a fallen leaf in four stages)
 *   food-links:    0 arrow (which way does the arrow point), 1 web (chain to web), 2 remove (take one species away, s.rm)
 *   energy-flow:   0 energy (8000 units up the chain, s.eff 5/10/20 %), 1 pyramid (energy vs numbers)
 *   carbon-cycle:  0 carbon (a carbon atom's trip, 7 steps), 1 compare (energy one-way vs matter cycling), 2 nitrogen (supplement)
 * Pictures: ecology_ai_1023/ (teacher's Gemini AI illustrations, not photographs); a few from other lessons as 'folder/file.png'.
 * Each view is drawn by its own module ecology_draw_<name>_1023_v1.js, registered as window.EcologyDraw[name] (canvas 960x600).
 * Text, steps, captions, picture labels (LAB = window.EcologyKit.LAB), quizzes and the shared data (K.WEB, K.EN) live here.
 * Per-view state the drawing modules read: remove s.rm (0..3), energy s.eff (5, 10, 20); every view has s.phase (-1 play all, >=0 hold) and s.start.
 * Shared helpers: ecology_kit_1023_v1.js. Replaces the ecology_energy entry of ecology_lessons_1010_v1.js (left there, unused).
 */
(()=>{'use strict';
const K=window.EcologyKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── shared data ────────────────────────────────────────────────────────────
// Energy chain: rice -> grasshopper -> frog -> snake. Start 8000 schematic units; at 5/10/20 % the next levels are whole numbers.
const EN_START=8000,EFFS=[5,10,20];
const enVals=e=>{const f=e/100,a=EN_START,b=a*f,c=b*f,d=c*f;return[a,b,c,d];};
K.EN_START=EN_START;K.EFFS=EFFS;K.enVals=enVals;
// Food web used by "web" and "remove". role: P producer, 1 primary, 2 secondary, 3 tertiary, 4 quaternary consumer. Edge a->b = a is eaten by b.
const WEB={
 nodes:[
  {id:'rice',role:'P',pic:'EC3_rice.png'},{id:'grasshopper',role:1,pic:'EC4_grasshopper.png'},{id:'vole',role:1,pic:'EC4_vole.png'},
  {id:'frog',role:2,pic:'EC5_frog.png'},{id:'snake',role:3,pic:'EC6_snake.png'},{id:'eagle',role:4,pic:'EC6_eagle.png'}],
 edges:[['rice','grasshopper'],['rice','vole'],['grasshopper','frog'],['frog','snake'],['vole','snake'],['snake','eagle']],
 // chain used first in "web": rice -> grasshopper -> frog -> snake. "web" then adds sparrow (omnivore: eats rice seeds and grasshoppers), mantis, vole, eagle.
 chain:['rice','grasshopper','frog','snake'],
 sparrowEats:['rice','grasshopper'],mantisEats:['grasshopper'],mantisEatenBy:['frog']
};
// Removing one species (s.rm 0..3 = rice, grasshopper, frog, snake): direction of change only (up/down), never a number.
// up = more, down = less, buffer = another food keeps it from falling much.
const RM=[
 {id:'rice',   direct:{grasshopper:'down',vole:'down'},later:{frog:'down',snake:'down',eagle:'down'}},
 {id:'grasshopper',direct:{rice:'up',frog:'down'},later:{snake:'buffer'}},
 {id:'frog',   direct:{grasshopper:'up',snake:'buffer'},later:{rice:'down'}},
 {id:'snake',  direct:{frog:'up',vole:'up',eagle:'down'},later:{grasshopper:'down'}}];
K.WEB=WEB;K.RM=RM;

// ── picture and canvas labels used by the drawing modules (zh, en) ─────────
const LAB={
 aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`),schematic:P(`示意`,`Schematic`),sizeNoReal:P(`大小不代表真實大小`,`Sizes are not real sizes`),
 // roles
 producer:P(`生產者`,`Producer`),consumer:P(`消費者`,`Consumer`),decomposer:P(`分解者`,`Decomposer`),
 primary:P(`初級消費者`,`Primary consumer`),secondary:P(`次級消費者`,`Secondary consumer`),tertiary:P(`三級消費者`,`Tertiary consumer`),quaternary:P(`四級消費者`,`Quaternary consumer`),
 herbivore:P(`草食`,`Plant-eater`),carnivore:P(`肉食`,`Meat-eater`),omnivore:P(`雜食`,`Omnivore`),scavenger:P(`腐食動物`,`Detritus feeder`),
 sun:P(`陽光`,`Sunlight`),light:P(`光能`,`Light energy`),chemE:P(`食物中的化學能`,`Chemical energy in food`),makesFood:P(`自己製造養分`,`Makes its own food`),eatsFood:P(`吃現成的養分`,`Eats ready-made food`),breaksDown:P(`分解遺體與排遺`,`Breaks down remains and waste`),
 photosynthesis:P(`光合作用`,`Photosynthesis`),respiration:P(`呼吸作用`,`Respiration`),
 // species names
 rice:P(`水稻`,`Rice`),miscanthus:P(`芒草`,`Miscanthus`),foxtail:P(`狗尾草`,`Foxtail grass`),grasshopper:P(`蚱蜢`,`Grasshopper`),vole:P(`田鼷鼠`,`Field mouse`),rabbit:P(`野兔`,`Hare`),caterpillar:P(`菜粉蝶幼蟲`,`Cabbage white caterpillar`),
 frog:P(`澤蛙`,`Paddy field frog`),mantis:P(`螳螂`,`Mantis`),sparrow:P(`麻雀`,`Sparrow`),snake:P(`黑眉錦蛇`,`Black-browed ratsnake`),eagle:P(`大冠鷲`,`Crested serpent eagle`),owl:P(`領角鴞`,`Collared scops owl`),
 fungi:P(`蕈類（真菌）`,`Mushrooms (fungi)`),bacteria:P(`細菌`,`Bacteria`),earthworm:P(`蚯蚓`,`Earthworm`),leaf:P(`落葉`,`Fallen leaf`),log:P(`腐木`,`Rotting log`),soil:P(`土壤`,`Soil`),humus:P(`腐植質`,`Humus`),
 // leaf decay
 leafWhole:P(`完整落葉`,`Whole leaf`),leafHoles:P(`斑點與破洞`,`Spots and holes`),leafVeins:P(`只剩葉脈`,`Only veins left`),leafSoil:P(`變成腐植質`,`Becomes humus`),
 chewed:P(`被拆碎`,`Broken into pieces`),digested:P(`被分解吸收`,`Digested and absorbed`),nutrientsBack:P(`養分回到土裡`,`Nutrients return to the soil`),
 // arrows and web
 eaten:P(`被吃`,`Eaten`),eater:P(`吃的`,`Eater`),food:P(`食物`,`Food`),chase:P(`追逐方向`,`Chase direction`),arrowDir:P(`箭頭方向`,`Arrow direction`),
 matterEnergy:P(`物質與能量傳向取食者`,`Matter and energy pass to the eater`),foodChain:P(`食物鏈`,`Food chain`),foodWeb:P(`食物網`,`Food web`),
 sameEater:P(`同一種動物，不同位置`,`One animal, different positions`),eatsSeeds:P(`吃種子`,`Eats seeds`),eatsInsects:P(`吃昆蟲`,`Eats insects`),
 removed:P(`被移走`,`Removed`),moreAfter:P(`變多`,`Increases`),lessAfter:P(`變少`,`Decreases`),bufferAfter:P(`有別的食物，影響較小`,`Has other food, smaller effect`),directEffect:P(`直接影響`,`Direct effect`),laterEffect:P(`接著影響`,`Knock-on effect`),dirOnly:P(`只示意方向，不是數字`,`Direction only, not numbers`),
 // energy
 unit:P(`單位`,`units`),energyUnits:P(`能量（示意單位）`,`Energy (schematic units)`),transfer:P(`傳到下一層`,`Passed on`),
 heat:P(`呼吸散熱`,`Heat from respiration`),feces:P(`排遺`,`Waste`),uneaten:P(`沒被吃到的部分`,`Uneaten parts`),detritus:P(`進入碎屑，給分解者`,`Goes to detritus, for decomposers`),lostRoute:P(`沒傳下去的能量去向`,`Where the rest goes`),
 about:P(`約`,`about`),notFixed:P(`常用的估計，不是固定值`,`A common estimate, not a fixed value`),eff:P(`傳遞比例`,`Transfer fraction`),fewerLevels:P(`所以食物鏈很少拉得太長`,`so food chains are rarely very long`),
 energyPyramid:P(`能量金字塔`,`Energy pyramid`),numberPyramid:P(`個體數（示意）`,`Numbers of individuals (schematic)`),topSmallest:P(`最上層最少`,`The top level is smallest`),
 oneTreeManyInsects:P(`一棵樹可養很多昆蟲：個體數不一定是金字塔`,`One tree can feed many insects: numbers need not form a pyramid`),
 // carbon / nitrogen
 co2:P(`二氧化碳`,`Carbon dioxide`),carbon:P(`碳`,`Carbon`),air:P(`空氣`,`Air`),organic:P(`含碳的養分`,`Carbon-containing food`),
 feeding:P(`攝食`,`Feeding`),decomposition:P(`分解作用`,`Decomposition`),remains:P(`遺體與排遺`,`Remains and waste`),
 buried:P(`埋藏`,`Buried`),fossilFuel:P(`化石燃料`,`Fossil fuel`),burning:P(`燃燒`,`Burning`),supplement:P(`補充`,`Supplement`),
 cycle:P(`循環`,`Cycles`),oneWay:P(`單向`,`One way`),matter:P(`物質（碳）`,`Matter (carbon)`),energy:P(`能量`,`Energy`),enters:P(`進來`,`Enters`),
 n2:P(`氮氣`,`Nitrogen gas`),nitrogen:P(`氮`,`Nitrogen`),nodule:P(`根瘤`,`Root nodule`),rhizobia:P(`根瘤菌`,`Nodule bacteria`),legume:P(`豆科植物`,`Legume`),usableN:P(`植物能吸收的含氮物質`,`Nitrogen compounds plants can absorb`),protein:P(`蛋白質`,`Protein`),
 ecosphere:P(`生態瓶`,`Ecosphere (sealed bottle)`),water:P(`水`,`Water`),waterPlant:P(`水草`,`Water plant`),shrimp:P(`小蝦`,`Shrimp`),sealed:P(`密封`,`Sealed`),onlyLightIn:P(`只有光能進來`,`Only light gets in`),bottleFood:P(`瓶中的小生態系`,`A tiny ecosystem in a bottle`),
 camphor:P(`樟樹`,`Camphor tree`),sunlightIn:P(`陽光進來`,`Sunlight in`),heatOut:P(`熱散失`,`Heat lost`)
};
K.LAB=LAB;window.EcologyLabels=LAB;

// ── roles / 0 ──────────────────────────────────────────────────────────────
const RO_SHORT=[P(`生產者`,`Producers`),P(`消費者`,`Consumers`),P(`分解者`,`Decomposers`),P(`合起來`,`Together`)];
const RO_NAMES=[P(`生產者：自己製造養分`,`Producers make their own food`),P(`消費者：吃現成的養分`,`Consumers eat ready-made food`),P(`分解者：分解遺體與排遺`,`Decomposers break down remains and waste`),P(`三種角色接成一個圈`,`Three roles join into one loop`)];
const RO_TEXT=[
 P(`水稻、芒草、狗尾草這些綠色植物，葉子行光合作用，把光能變成食物裡的化學能，所以是生產者。陸地上的生產者大多靠光合作用；這是按「怎麼取得養分」分的角色，不是按「會不會動」分的。（AI 插圖，非實拍。）`,`Rice, miscanthus and foxtail grass are green plants whose leaves photosynthesise, turning light energy into chemical energy in food, so they are producers. Most land producers rely on photosynthesis. Roles are sorted by how organisms obtain nutrition, not by whether they move. (AI illustrations, not photos.)`),
 P(`蚱蜢吃稻葉，是初級消費者；澤蛙吃蚱蜢，是次級消費者；蛇吃澤蛙，是三級消費者；大冠鷲吃蛇，是更高一級的消費者。消費者自己不能製造養分，要吃現成的。麻雀既吃種子也吃昆蟲，是雜食，在不同食物鏈上位置不同。`,`A grasshopper eats rice leaves and is a primary consumer; a paddy field frog eats grasshoppers and is a secondary consumer; a snake eats frogs and is a tertiary consumer; a crested serpent eagle eats snakes and is a higher-level consumer. Consumers cannot make their own food and must eat ready-made food. A sparrow eats both seeds and insects, so it is an omnivore and sits at different positions on different chains.`),
 P(`倒下的腐木、落葉和動物的排遺，不會一直堆著。蕈類（真菌）和細菌把它們裡面的有機物分解、吸收，是分解者。蚯蚓和一些昆蟲吃落葉碎屑、把它們拆小，是腐食動物，幫分解者的忙。不同版本的分類寫法略有不同，這裡把分解者定為蕈類與細菌。`,`A fallen log, dead leaves and animal waste do not pile up for ever. Mushrooms (fungi) and bacteria break down and absorb the organic matter in them, so they are decomposers. Earthworms and some insects eat leaf fragments and break them smaller; they are detritus feeders that help decomposers. Different books word this slightly differently; here decomposers are fungi and bacteria.`),
 P(`生產者做出養分，消費者吃進養分，各層的遺體和排遺由分解者分解，養分回到土裡，生產者又能用。陽光是能量的來源，分解者不是「最後一層」，而是連著每一層的遺體與排遺。`,`Producers make food, consumers eat it, and decomposers break down the remains and waste of every level so that nutrients return to the soil for producers to use again. Sunlight is the source of energy. Decomposers are not a "last level"; they connect to the remains and waste of every level.`)];

// ── roles / 1 (leafdecay) ──────────────────────────────────────────────────
const LD_SHORT=[P(`完整落葉`,`Whole leaf`),P(`被拆碎`,`Broken up`),P(`被分解`,`Decomposed`),P(`回到土裡`,`Back to soil`)];
const LD_NAMES=[P(`一片剛落下的葉子`,`A freshly fallen leaf`),P(`蚯蚓和昆蟲把它拆小`,`Earthworms and insects break it smaller`),P(`蕈類和細菌分解它`,`Fungi and bacteria decompose it`),P(`變成腐植質，養分回到土裡`,`It becomes humus and nutrients return to the soil`)];
const LD_TEXT=[
 P(`葉子剛落下，還是完整、綠中帶黃。葉裡有生產者用光合作用做出來的有機物。這片葉子之後去哪了？（AI 插圖，非實拍。）`,`The leaf has just fallen, still whole and green-yellow. It holds organic matter made by a producer through photosynthesis. Where does it go next? (AI illustration, not a photo.)`),
 P(`葉子變褐，出現斑點和破洞。蚯蚓、一些昆蟲吃葉子碎屑，把它拆成小塊；它們是腐食動物，不是分解者。`,`The leaf turns brown with spots and holes. Earthworms and some insects eat leaf fragments and break them into small pieces; they are detritus feeders, not decomposers.`),
 P(`只剩下葉脈。蕈類的菌絲和細菌在葉的碎屑上分解有機物，吸收其中的養分，同時也會呼吸。`,`Only the veins remain. Fungal threads and bacteria break down organic matter in the leaf fragments and absorb its nutrients, and they also respire.`),
 P(`葉子變成深色的腐植質，混進土壤。其中的養分可以再被植物的根吸收。物質沒有消失，是被不同的生物接力用掉、再回到環境。`,`The leaf becomes dark humus mixed into the soil. Its nutrients can be absorbed again by plant roots. The matter did not vanish; different organisms used it in turn and it returned to the environment.`)];

// ── food-links / 0 (arrow) ─────────────────────────────────────────────────
const AR_SHORT=[P(`追逐的方向`,`Chase direction`),P(`看誰被吃`,`Who is eaten?`),P(`一條食物鏈`,`A food chain`)];
const AR_NAMES=[P(`大冠鷲追蛇：追的方向`,`An eagle chases a snake: the chase direction`),P(`箭頭從被吃的指向吃的`,`The arrow goes from the eaten to the eater`),P(`稻 → 蚱蜢 → 澤蛙 → 蛇`,`Rice → grasshopper → frog → snake`)];
const AR_TEXT=[
 P(`大冠鷲飛過去抓蛇。追的方向是從鷲到蛇。但食物鏈的箭頭不是「誰追誰」。`,`An eagle swoops at a snake. The chase goes from the eagle to the snake. But a food-chain arrow does not show who chases whom.`),
 P(`食物鏈的箭頭，起點是被吃的，終點是吃它的：蛇 → 大冠鷲。因為箭頭表示食物裡的物質與能量傳給取食者。找箭頭時先問：被吃的是誰？吃它的是誰？`,`In a food chain the arrow starts at the one eaten and ends at the one that eats it: snake → eagle, because the arrow shows matter and energy in the food passing to the eater. Ask first: who is eaten, and who eats it?`),
 P(`稻被蚱蜢吃、蚱蜢被澤蛙吃、澤蛙被蛇吃：稻 → 蚱蜢 → 澤蛙 → 蛇。每一個箭頭都是從被吃的指向吃的，第一個一定是生產者。`,`Rice is eaten by grasshoppers, grasshoppers by frogs, frogs by snakes: rice → grasshopper → frog → snake. Every arrow runs from the eaten to the eater, and the first is always a producer.`)];

// ── food-links / 1 (web) ───────────────────────────────────────────────────
const WB_SHORT=[P(`一條鏈`,`One chain`),P(`加入麻雀`,`Add the sparrow`),P(`加入更多`,`Add more`),P(`食物網`,`The web`)];
const WB_NAMES=[P(`先從一條食物鏈開始`,`Start with one food chain`),P(`麻雀：吃種子，也吃昆蟲`,`The sparrow eats seeds and insects`),P(`再加螳螂、田鼷鼠、大冠鷲`,`Add a mantis, a field mouse and an eagle`),P(`交錯的鏈變成食物網`,`Crossing chains become a food web`)];
const WB_TEXT=[
 P(`稻田裡一條食物鏈：稻 → 蚱蜢 → 澤蛙 → 蛇。一條直線只是真實關係的一小部分。（AI 插圖，非實拍。）`,`One food chain in a paddy: rice → grasshopper → frog → snake. A single line is only a small part of the real relationships. (AI illustrations, not photos.)`),
 P(`麻雀吃稻的種子，也吃蚱蜢。吃種子時牠是初級消費者，吃蚱蜢時牠是次級消費者。同一種動物吃不同的食物，在不同的鏈上位置不同。`,`A sparrow eats rice seeds and also grasshoppers. Eating seeds makes it a primary consumer; eating grasshoppers makes it a secondary consumer. One animal eating different foods sits at different positions on different chains.`),
 P(`再加進螳螂（吃蚱蜢、被澤蛙吃）、田鼷鼠（吃稻、被蛇吃）和大冠鷲（吃蛇）。每多一種生物，就多出幾個箭頭。`,`Now add a mantis (eats grasshoppers, eaten by frogs), a field mouse (eats rice, eaten by snakes) and an eagle (eats snakes). Each new species adds several arrows.`),
 P(`這些鏈互相交錯，就是食物網。網裡一個生物常有不只一種食物、不只一種天敵，所以少了某一種，影響不會只沿一條線傳。`,`These chains cross one another and form a food web. An organism in the web often has more than one food and more than one predator, so losing one species does not spread along a single line.`)];

// ── food-links / 2 (remove) ────────────────────────────────────────────────
const RM_SHORT=[P(`原本的網`,`The web`),P(`移走一種`,`Remove one`),P(`連鎖影響`,`Knock-on effects`)];
const RM_NAMES=[P(`移走之前的食物網`,`The food web before removal`),P(`移走一種生物`,`One species removed`),P(`影響沿著箭頭傳`,`Effects follow the arrows`)];
const RM_SPEC=[P(`水稻`,`rice`),P(`蚱蜢`,`grasshoppers`),P(`澤蛙`,`frogs`),P(`蛇`,`snakes`)];
const RM_DIRECT=[
 P(`吃稻的蚱蜢和田鼷鼠失去食物，會變少。`,`Grasshoppers and field mice, which eat rice, lose their food and decrease.`),
 P(`蚱蜢不再吃稻，稻比較不會被啃，會變多；吃蚱蜢的澤蛙少了食物，會變少。`,`Grasshoppers no longer eat rice, so less rice is eaten and it increases; frogs, which ate grasshoppers, lose food and decrease.`),
 P(`蚱蜢少了天敵，會變多；蛇少了一種食物，但還有田鼷鼠，影響比較小。`,`Grasshoppers lose a predator and increase; snakes lose one food but still have field mice, so the effect is smaller.`),
 P(`澤蛙和田鼷鼠少了天敵，會變多；只吃蛇的大冠鷲少了食物，會變少。`,`Frogs and field mice lose a predator and increase; eagles, which eat only snakes here, lose food and decrease.`)];
const RM_LATER=[
 P(`接著，吃它們的澤蛙、蛇、大冠鷲也跟著變少：影響沿箭頭一路往上傳。`,`Next, the frogs, snakes and eagles that eat them also decrease: the effect travels up the arrows.`),
 P(`蛇還有田鼷鼠可吃，影響被緩衝；但稻田裡的食物平衡已經改變。`,`Snakes can still eat field mice, so the effect is buffered; but the balance in the paddy has changed.`),
 P(`蚱蜢變多，會吃掉更多稻，稻可能因此變少。`,`More grasshoppers eat more rice, so rice may decrease.`),
 P(`澤蛙變多，會吃掉更多蚱蜢，蚱蜢變少。稻同時受到田鼷鼠變多（吃更多稻）和蚱蜢變少（被啃較少）兩種相反的影響，方向不一定，要更多資料才能判斷。畫面只示意方向，不是數字。`,`More frogs eat more grasshoppers, so grasshoppers decrease. Rice is affected in two opposite ways at once, by more field mice (eating more rice) and fewer grasshoppers (less rice eaten), so its direction is unclear and needs more data. The picture shows direction only, not numbers.`)];
const rmText=s=>{const r=s.rm||0;return[
 P(`稻田裡的食物網：稻是生產者，蚱蜢和田鼷鼠吃稻，澤蛙吃蚱蜢，蛇吃澤蛙和田鼷鼠，大冠鷲吃蛇。用上方的「移走」選一種。`,`The paddy food web: rice is the producer; grasshoppers and field mice eat rice; frogs eat grasshoppers; snakes eat frogs and field mice; eagles eat snakes. Use "Remove" above to choose one.`),
 P(`假設${RM_SPEC[r][0]}突然全部不見了。（只示意方向，不是數字。）`,`Suppose all the ${RM_SPEC[r][1]} suddenly disappear. (Direction only, not numbers.)`),
 P(`${RM_DIRECT[r][0]}${RM_LATER[r][0]}`,`${RM_DIRECT[r][1]} ${RM_LATER[r][1]}`)];};
const RMC=choice(P(`移走`,`Remove`),'rm',[[0,P(`水稻`,`Rice`)],[1,P(`蚱蜢`,`Grasshoppers`)],[2,P(`澤蛙`,`Frogs`)],[3,P(`蛇`,`Snakes`)]]);

// ── energy-flow / 0 (energy) ───────────────────────────────────────────────
const EN_SHORT=[P(`陽光進來`,`Sunlight in`),P(`稻 → 蚱蜢`,`Rice → grasshopper`),P(`蚱蜢 → 澤蛙`,`Grasshopper → frog`),P(`澤蛙 → 蛇`,`Frog → snake`),P(`全部比較`,`Compare all`)];
const EN_NAMES=[P(`能量從陽光進來`,`Energy enters as sunlight`),P(`稻傳給蚱蜢：沒有全部傳下去`,`Rice to grasshopper: not all passes on`),P(`蚱蜢傳給澤蛙：又少一截`,`Grasshopper to frog: less again`),P(`澤蛙傳給蛇：更少`,`Frog to snake: even less`),P(`每往上一層，能量變少`,`Each step up, less energy`)];
const fmt=n=>Number.isInteger(n)?`${n}`:`${+n.toFixed(2)}`;
const enText=s=>{const e=s.eff||10,v=enVals(e).map(fmt);return[
 P(`稻的葉行光合作用，把一部分光能變成食物裡的化學能。這就是整條食物鏈的能量來源。為了好比較，假設稻裡有 ${v[0]} 單位的能量（示意單位，不是真實量測）。`,`Rice leaves photosynthesise and turn part of the light energy into chemical energy in food. This is where the whole chain's energy comes from. To make comparison easy, suppose the rice holds ${v[0]} units of energy (a schematic unit, not a measurement).`),
 P(`蚱蜢吃稻，只有一部分能量傳到蚱蜢，約 ${e}%，就是 ${v[1]} 單位。其餘的去向：蚱蜢自己呼吸用掉並散成熱、排遺、沒被吃到的部分（進入碎屑，給分解者）。`,`A grasshopper eats rice, and only part of the energy reaches it, about ${e}%, which is ${v[1]} units. The rest goes to: the grasshopper's own respiration, which ends as heat, waste, and uneaten parts (which enter detritus for decomposers).`),
 P(`澤蛙吃蚱蜢，又只有約 ${e}% 傳到澤蛙：${v[2]} 單位。每一層都要呼吸、活動，每一層也都有排遺和沒被吃到的部分。`,`A frog eats grasshoppers, and again only about ${e}% reaches the frog: ${v[2]} units. Every level respires and moves, and every level has waste and uneaten parts.`),
 P(`蛇吃澤蛙，約 ${e}% 傳到蛇：${v[3]} 單位。越往上，能分到的能量越少，所以食物鏈很少拉得太長。`,`A snake eats frogs, and about ${e}% reaches the snake: ${v[3]} units. The higher up, the less energy is available, which is why food chains are rarely very long.`),
 P(`四層合起來看：${v.join(' → ')} 單位。約 ${e}% 是課堂用的概略值，常見的範圍大約 5～20%，不是每條食物鏈都固定。能量是單向流動，最後以熱散失，不會像碳那樣循環。用上方的「傳遞比例」換 5%、10%、20% 比較。`,`All four levels together: ${v.join(' → ')} units. About ${e}% is a classroom approximation; real values often range from about 5 to 20% and differ between chains. Energy flows one way and ends as heat; it does not cycle like carbon. Use "Transfer fraction" above to compare 5%, 10% and 20%.`)];};
const EFFC=choice(P(`傳遞比例`,`Transfer fraction`),'eff',EFFS.map(e=>[e,P(`約 ${e}%`,`About ${e}%`)]));

// ── energy-flow / 1 (pyramid) ──────────────────────────────────────────────
const PY_SHORT=[P(`能量金字塔`,`Energy pyramid`),P(`個體數呢？`,`And numbers?`),P(`為什麼這麼少`,`Why so few?`)];
const PY_NAMES=[P(`能量金字塔：越往上越少`,`The energy pyramid: less toward the top`),P(`個體數：常常也是越往上越少`,`Numbers: often fewer toward the top too`),P(`最上層為什麼最少`,`Why the top is smallest`)];
const PY_TEXT=[
 P(`把每一層的能量疊起來，最下面的生產者最多，往上一層比一層少，形狀像金字塔。比較不同生態系的能量金字塔時，面積和時間單位要一樣。（示意，不是量測。）`,`Stack the energy of each level and the producers at the bottom hold the most, with each level above holding less, forming a pyramid. To compare energy pyramids of different ecosystems, the area and time unit must match. (Schematic, not measured.)`),
 P(`稻田這條鏈上，個體數也常常是稻很多、蚱蜢較少、澤蛙更少、蛇最少。但個體數不一定是金字塔：一棵大樹上可以養很多昆蟲，這時最下層的個體反而少。`,`On this paddy chain the numbers also tend to be many rice plants, fewer grasshoppers, fewer frogs and fewest snakes. But numbers need not form a pyramid: one big tree can feed many insects, and then the bottom level has fewer individuals.`),
 P(`上一層能分到的能量只是下一層的一小部分，所以最上層能養活的個體最少，也很少再多出第五、第六層。能量金字塔不會倒過來，因為能量一路只會變少。`,`A level receives only a small part of the energy of the level below, so the top level can support the fewest animals and there are rarely a fifth or sixth level. An energy pyramid is never inverted, because energy only decreases along the way.`)];

// ── carbon-cycle / 0 (carbon) ──────────────────────────────────────────────
const CB_SHORT=[P(`空氣中的碳`,`Carbon in air`),P(`光合作用`,`Photosynthesis`),P(`被蚱蜢吃`,`Eaten`),P(`被澤蛙吃`,`Eaten again`),P(`呼吸放回`,`Respired back`),P(`遺體與分解`,`Remains`),P(`補充：埋藏`,`Supplement`)];
const CB_NAMES=[P(`碳在空氣裡：二氧化碳`,`Carbon in the air: carbon dioxide`),P(`光合作用：碳進入稻`,`Photosynthesis: carbon enters the rice`),P(`攝食：碳傳給蚱蜢`,`Feeding: carbon passes to the grasshopper`),P(`攝食：碳傳給澤蛙`,`Feeding: carbon passes to the frog`),P(`呼吸作用：碳回到空氣`,`Respiration: carbon returns to the air`),P(`遺體與排遺：分解者再把碳放回去`,`Remains and waste: decomposers return carbon`),P(`補充：埋藏與燃燒`,`Supplement: burial and burning`)];
const CB_TEXT=[
 P(`空氣裡有二氧化碳，碳元素在裡面。我們追蹤的是「碳元素」，不是某一個固定不變的分子。（AI 插圖，非實拍；碳與箭頭由程式畫，為示意。）`,`The air holds carbon dioxide, which contains the element carbon. We trace the carbon element, not one unchanged molecule. (AI illustrations, not photos; carbon and arrows are drawn by program, schematic.)`),
 P(`稻的葉行光合作用，把二氧化碳裡的碳做成含碳的有機物，碳進入生產者。`,`Rice leaves photosynthesise and make the carbon in carbon dioxide into organic matter, so carbon enters the producer.`),
 P(`蚱蜢吃稻，含碳的有機物傳給蚱蜢。`,`A grasshopper eats rice, and carbon-containing organic matter passes to the grasshopper.`),
 P(`澤蛙吃蚱蜢，碳再傳給澤蛙。蛇吃澤蛙、大冠鷲吃蛇，也是這樣一層層傳。`,`A frog eats grasshoppers, and the carbon passes to the frog. When snakes eat frogs and eagles eat snakes it passes on in the same way.`),
 P(`生產者、消費者和分解者都會進行呼吸作用，把一部分含碳的有機物變成二氧化碳放回空氣。植物也呼吸，不是只吸收二氧化碳。`,`Producers, consumers and decomposers all respire, turning part of their carbon-containing organic matter into carbon dioxide released to the air. Plants also respire; they do not only absorb carbon dioxide.`),
 P(`各層的遺體和排遺，由分解者（蕈類、細菌）分解；分解者呼吸，把碳放回空氣，也有一部分碳留在土壤裡成為腐植質。`,`The remains and waste of every level are broken down by decomposers (fungi and bacteria); decomposers respire and return carbon to the air, and some carbon stays in the soil as humus.`),
 P(`補充：少部分含碳物質在合適條件下被長期埋藏，其中一部分形成煤、石油等化石燃料；燃燒化石燃料會比較快把地層裡的碳送回空氣。這兩條路徑時間尺度不同。這裡不重講氣候變遷。`,`Supplement: a small part of carbon-containing matter is buried for a long time under suitable conditions, and some forms fossil fuels such as coal and oil; burning fossil fuels returns carbon from the ground to the air much faster. The two routes run on different timescales. Climate change is not repeated here.`)];

// ── carbon-cycle / 1 (compare) ─────────────────────────────────────────────
const CM_SHORT=[P(`能量：單向`,`Energy: one way`),P(`碳：繞圈`,`Carbon: a loop`),P(`並排比較`,`Side by side`)];
const CM_NAMES=[P(`能量從陽光進來，最後變成熱`,`Energy enters as light and ends as heat`),P(`碳在生物與空氣之間繞圈`,`Carbon loops between organisms and air`),P(`一個單向，一個循環`,`One is one-way, one cycles`)];
const CM_TEXT=[
 P(`能量從陽光進來，沿著食物鏈一層層傳，每一層都有一部分變成熱散失，散失的熱不會再變回食物裡的能量。所以能量是單向流動，要靠陽光不斷補充。`,`Energy enters as sunlight and passes along the food chain, and at every level part becomes heat that is lost; lost heat does not turn back into energy in food. Energy therefore flows one way and needs sunlight to keep supplying it.`),
 P(`碳從空氣進入生產者，傳給消費者，遺體與排遺給分解者，呼吸再回到空氣，又可以被生產者用。所以碳是循環的。`,`Carbon goes from air into producers, to consumers, and through remains and waste to decomposers, and respiration returns it to the air, where producers can use it again. So carbon cycles.`),
 P(`左邊的能量是一條直線：陽光進來，熱散失。右邊的碳是一個圈。下方是「生態瓶」：把水、水草（生產者）、小蝦（消費者）和細菌（分解者）封在一個玻璃瓶裡，做成瓶中的小生態系，只讓光進去。瓶裡的物質可以循環，但還是需要光這個能量輸入，沒有光，水草不能行光合作用，整個瓶子就撐不久，所以不是永動機。`,`On the left energy is a straight line: sunlight in, heat out. On the right carbon is a loop. Below is an "ecosphere": water, water plants (producers), shrimp (consumers) and bacteria (decomposers) sealed in a glass bottle as a tiny ecosystem, with only light let in. Matter can cycle inside, but it still needs light as an energy input; without light the plants cannot photosynthesise and the bottle cannot last, so it is not a perpetual-motion machine.`)];

// ── carbon-cycle / 2 (nitrogen, supplement) ────────────────────────────────
const NT_SHORT=[P(`空氣中的氮`,`Nitrogen in air`),P(`根瘤菌`,`Nodule bacteria`),P(`沿食物鏈`,`Along the chain`),P(`回到環境`,`Returns`)];
const NT_NAMES=[P(`補充：空氣裡有很多氮氣，卻不能直接用`,`Supplement: plenty of nitrogen gas, but not directly usable`),P(`根瘤菌把氮變成植物能吸收的`,`Nodule bacteria make nitrogen usable`),P(`含氮的養分沿食物鏈傳`,`Nitrogen compounds pass along the chain`),P(`遺體、排遺與分解，氮回到環境`,`Remains, waste and decay return nitrogen`)];
const NT_TEXT=[
 P(`空氣中大部分是氮氣，但多數植物和動物不能直接利用氮氣。生物需要氮來製造蛋白質等物質。（補充。）`,`Most of the air is nitrogen gas, but most plants and animals cannot use nitrogen gas directly. Organisms need nitrogen to make proteins and other substances. (Supplement.)`),
 P(`豆科植物的根上有根瘤，裡面住著根瘤菌。根瘤菌能把空氣中的氮氣變成植物能吸收的含氮物質；豆科植物提供養分給根瘤菌。這是互利共生的一個例子。（AI 插圖，非實拍。）`,`Legumes have root nodules that house nodule bacteria. The bacteria turn nitrogen gas into nitrogen compounds plants can absorb, while the legume supplies them with food. This is an example of mutualism. (AI illustration, not a photo.)`),
 P(`植物吸收含氮物質，用來製造蛋白質；消費者吃植物，含氮的物質沿食物鏈傳下去。`,`Plants absorb nitrogen compounds and use them to make proteins; consumers eat plants and nitrogen-containing matter passes along the food chain.`),
 P(`遺體和排遺被分解者分解後，含氮物質回到土壤，可以再被植物吸收；有些細菌還會把含氮物質變回氮氣放回空氣。氮也在循環。`,`When decomposers break down remains and waste, nitrogen compounds return to the soil and plants can absorb them again; some bacteria also turn nitrogen compounds back into nitrogen gas that returns to the air. Nitrogen cycles too.`)];

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;
 K.panel(c,40,40,880,520,'#16332b');
 K.text(c,P(`動畫製作中`,`Animation in progress`),480,270,40,C.yellow,'center');
 K.text(c,short[k],480,330,28,C.white,'center');
 K.text(c,P(`（${name}）`,`(${name})`),480,372,22,C.muted,'center');
 K.pulse(c,480,440,t,C.cyan,14);};
const dr=(name,n,short)=>(c,s,t)=>((window.EcologyDraw&&window.EcologyDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const RESTART=new Set(['phase','rm','eff']);
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}else if(RESTART.has(k))s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const VIEW=(tabsArr)=>choice(P(`觀察`,`View`),'view',tabsArr.map((n,i)=>[i,n]));
const ROLE_TABS=[P(`三種角色`,`Three roles`),P(`落葉去哪了`,`Where the leaf goes`)];
const LINK_TABS=[P(`箭頭方向`,`Arrow direction`),P(`鏈到網`,`Chain to web`),P(`移走一種`,`Remove one`)];
const ENERGY_TABS=[P(`能量往上傳`,`Energy up the chain`),P(`能量金字塔`,`Energy pyramid`)];
const CARBON_TABS=[P(`碳的旅行`,`A carbon trip`),P(`能量 vs 碳`,`Energy vs carbon`),P(`補充：氮`,`Supplement: nitrogen`)];
const INIT=()=>({running:true,view:0,phase:-1,start:0,rm:2,eff:10});

const tabs=[
{id:'roles',title:P(`誰養活誰？`,`Who supports whom?`),sub:P(`生產者、消費者、分解者`,`Producers, consumers and decomposers`),
 hook:P(`秋天，樹下落了一地的葉子，可是來年春天，地上並沒有被葉子埋起來。落葉去哪了？是物質消失了，還是被什麼生物接手用掉了？`,`In autumn leaves pile up under a tree, yet next spring the ground is not buried in them. Where did they go? Did the matter vanish, or did other organisms take it over?`),
 body:P(`生物依「怎麼取得養分」分成三種角色：生產者自己製造養分，消費者吃現成的，分解者分解遺體與排遺。按步驟鈕看每個角色，再用「觀察」看一片落葉怎麼被拆碎、分解，最後回到土裡。`,`Organisms fall into three roles by how they obtain nutrition: producers make their own food, consumers eat ready-made food, and decomposers break down remains and waste. Use the step buttons to look at each role, then use "View" to follow one fallen leaf as it is broken up, decomposed and returned to the soil.`),
 reading:P(`生產者把無機物做成有機物，陸地植物多靠光合作用；消費者攝食現成的有機物；分解者如許多細菌與真菌，分解遺體和排遺中的有機物並吸收利用。這是「取得養分方式」的角色，不是「會不會動」。\n\n蚯蚓、一些昆蟲吃落葉碎屑，把它們拆小，是腐食動物；禿鷹等清除者吞食動物殘骸，也不同於菌類在體外分解再吸收的方式。不同版本把分解者歸入消費者的寫法略有不同，這裡為了方便追蹤，分開說明。分解者能利用各營養階層的遺體與排遺，不能只畫在最高一層後面。`,`Producers turn inorganic matter into organic matter, and most land plants rely on photosynthesis; consumers eat ready-made organic matter; decomposers such as many bacteria and fungi break down organic matter in remains and waste and absorb it. These roles describe how nutrition is obtained, not whether an organism moves.\n\nEarthworms and some insects eat leaf fragments and break them smaller; they are detritus feeders. Scavengers such as vultures swallow animal remains, which also differs from fungi that digest outside the body and then absorb. Books differ slightly on whether decomposers count as consumers; here they are described separately to make them easy to trace. Decomposers can use the remains and waste of every trophic level, not only those of the top level.`),
 closure:P(`按取得養分的方式分角色；分解者連結各層的遺體與排遺，讓物質回到土裡。`,`Roles follow how nutrition is obtained; decomposers connect the remains and waste of every level and return matter to the soil.`),
 quiz:[
  {q:P(`水稻是生產者，最主要的原因是什麼？`,`What mainly makes rice a producer?`),options:[P(`它不會動`,`It does not move`),P(`它的葉行光合作用，自己製造養分`,`Its leaves photosynthesise and make its own food`),P(`它長在水裡`,`It grows in water`),P(`它被動物吃`,`It is eaten by animals`)],answer:1,why:P(`生產者是依「自己製造養分」來分的，和會不會動、被不被吃無關。`,`Producers are defined by making their own food, not by moving or being eaten.`),hint:P(`看第一步：葉子在做什麼？`,`Look at step one: what do the leaves do?`)},
  {q:P(`麻雀吃稻的種子，也吃蚱蜢，牠是什麼？`,`A sparrow eats rice seeds and also grasshoppers. What is it?`),options:[P(`生產者`,`A producer`),P(`分解者`,`A decomposer`),P(`消費者，而且是雜食`,`A consumer, and an omnivore`),P(`只能算草食動物`,`Only a plant-eater`)],answer:2,why:P(`麻雀吃現成的養分，所以是消費者；吃種子又吃昆蟲，是雜食，在不同的鏈上位置不同。`,`A sparrow eats ready-made food, so it is a consumer; eating seeds and insects makes it an omnivore at different positions on different chains.`),hint:P(`牠吃的是動物還是植物，還是兩者都吃？`,`Does it eat animals, plants, or both?`)},
  {q:P(`蚯蚓吃落葉碎屑，把它拆小。下列哪一句最合理？`,`An earthworm eats leaf fragments and breaks them smaller. Which statement is most reasonable?`),options:[P(`牠是生產者`,`It is a producer`),P(`牠是腐食動物，幫蕈類和細菌分解`,`It is a detritus feeder that helps fungi and bacteria`),P(`牠是分解者，不需要蕈類`,`It is a decomposer and does not need fungi`),P(`牠讓落葉消失，物質就不見了`,`It makes leaves vanish and the matter disappears`)],answer:1,why:P(`蚯蚓把落葉拆小，讓蕈類和細菌更容易分解；物質沒有消失。`,`The earthworm breaks leaves smaller so fungi and bacteria can decompose them more easily; the matter does not disappear.`),hint:P(`看落葉的第二步。`,`Look at step two of the leaf.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(ROLE_TABS),steps(s.view===1?LD_SHORT:RO_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:LD_NAMES[k],text:LD_TEXT[k]}:{title:RO_NAMES[k],text:RO_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('leafdecay',4,LD_SHORT)(c,s,t):dr('roles',4,RO_SHORT)(c,s,t)},
{id:'food-links',title:P(`箭頭從哪裡來？`,`Where does the arrow start?`),sub:P(`食物鏈與食物網`,`Food chains and webs`),
 hook:P(`大冠鷲追著蛇飛，追的方向是鷲指向蛇。那食物鏈的箭頭，要畫成鷲指向蛇，還是蛇指向鷲？如果稻田裡的澤蛙突然全部不見，會發生什麼事？`,`An eagle chases a snake, so the chase points from eagle to snake. Should the food-chain arrow point from eagle to snake, or snake to eagle? And if all the frogs in a paddy suddenly vanished, what would happen?`),
 body:P(`食物鏈的箭頭從被吃的指向吃它的，表示食物裡的物質與能量往哪裡傳，不是追逐的方向。許多食物鏈交錯起來就是食物網。按步驟看箭頭怎麼畫、鏈怎麼長成網，再用「觀察」試試移走一種生物，看影響沿著箭頭怎麼傳。`,`A food-chain arrow points from the eaten to the eater, showing where matter and energy in food go, not the chase direction. Many chains crossing form a food web. Use the step buttons to see how arrows are drawn and how a chain grows into a web, then use "View" to remove one species and see how the effects travel along the arrows.`),
 reading:P(`先問「被吃的是誰」，再找「吃它的是誰」，箭頭由前者指向後者；鏈的第一個一定是生產者。同一種動物吃不同的食物時，可能出現在不同的營養階層，例如麻雀吃種子是初級消費者，吃昆蟲是次級消費者。\n\n移走一種生物時，影響沿著取食關係傳：吃它的生物少了食物，它吃的生物少了天敵。若某種生物還有別的食物或別的天敵，影響就會被緩衝。畫面只示意變多或變少的方向，不是數字，實際大小還要看環境與其他生物。`,`Ask "who is eaten" first and then "who eats it", and the arrow points from the first to the second; the first in a chain is always a producer. When one animal eats different foods it may sit at different trophic levels; for example a sparrow eating seeds is a primary consumer and eating insects is a secondary consumer.\n\nWhen one species is removed, the effects pass along feeding links: those that ate it lose food, and those it ate lose a predator. If an organism has other foods or other predators the effect is buffered. The picture shows only the direction of increase or decrease, not numbers; real sizes depend on the environment and other organisms.`),
 closure:P(`食物 → 取食者；交錯的取食路徑形成食物網，影響會沿著箭頭傳。`,`Food → eater; interlinked feeding routes form a food web, and effects travel along the arrows.`),
 quiz:[
  {q:P(`食物鏈「稻 → 蚱蜢 → 澤蛙」的箭頭，代表什麼？`,`What do the arrows in the food chain "rice → grasshopper → frog" mean?`),options:[P(`誰追誰`,`Who chases whom`),P(`食物裡的物質與能量傳給取食者`,`Matter and energy in food pass to the eater`),P(`誰比較大`,`Which is bigger`),P(`誰住得比較高`,`Which lives higher up`)],answer:1,why:P(`箭頭從被吃的指向吃的，表示食物裡的物質與能量往取食者傳。`,`The arrow runs from the eaten to the eater, showing matter and energy in food passing to the eater.`),hint:P(`想想箭頭的起點是誰。`,`Think who is at the start of the arrow.`)},
  {q:P(`大冠鷲吃蛇。這個取食關係的箭頭應該怎麼畫？`,`An eagle eats a snake. How should the arrow for this feeding link be drawn?`),options:[P(`大冠鷲 → 蛇`,`Eagle → snake`),P(`蛇 → 大冠鷲`,`Snake → eagle`),P(`兩個方向都畫`,`Both directions`),P(`不用畫箭頭`,`No arrow`)],answer:1,why:P(`蛇是被吃的，大冠鷲是吃的，箭頭從被吃的指向吃的。`,`The snake is eaten and the eagle eats, so the arrow goes from the snake to the eagle.`),hint:P(`先問：被吃的是誰？`,`Ask first: who is eaten?`)},
  {q:P(`稻田裡的澤蛙全部不見，下列哪一句最合理？`,`All the frogs in a paddy disappear. Which statement is most reasonable?`),options:[P(`只有澤蛙受影響`,`Only frogs are affected`),P(`蚱蜢可能變多，蛇因為還有田鼷鼠可吃，影響較小`,`Grasshoppers may increase, and snakes, which can still eat field mice, are affected less`),P(`所有生物都一定變多`,`Every organism must increase`),P(`食物網完全不變`,`The food web does not change at all`)],answer:1,why:P(`少了天敵，蚱蜢可能變多；蛇還有別的食物，影響被緩衝。只示意方向，不是數字。`,`Without a predator grasshoppers may increase; snakes have other food, so the effect is buffered. Only directions are shown, not numbers.`),hint:P(`切到「移走一種」，選澤蛙。`,`Switch to "Remove one" and choose frogs.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(LINK_TABS),steps(s.view===2?RM_SHORT:s.view===1?WB_SHORT:AR_SHORT),...(s.view===2?[RMC]:[])],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===2?{title:RM_NAMES[k],text:rmText(s)[k]}:s.view===1?{title:WB_NAMES[k],text:WB_TEXT[k]}:{title:AR_NAMES[k],text:AR_TEXT[k]};},
 draw:(c,s,t)=>s.view===2?dr('remove',3,RM_SHORT)(c,s,t):s.view===1?dr('web',4,WB_SHORT)(c,s,t):dr('arrow',3,AR_SHORT)(c,s,t)},
{id:'energy-flow',title:P(`能量為何變少？`,`Why is less energy passed onward?`),sub:P(`營養階層與能量流動`,`Trophic levels and energy flow`),
 hook:P(`一隻大冠鷲要吃很多隻蛇才夠，蛇又要吃很多隻澤蛙。為什麼食物鏈很少超過五、六層？兔子吃到的能量，會全部被鷹吃到嗎？`,`An eagle needs many snakes, and a snake needs many frogs. Why are food chains rarely more than five or six levels? Does a hawk receive all the energy a rabbit ate?`),
 body:P(`每一個營養階層都要維持生命活動，呼吸作用會散熱；有些有機物沒被吃到，或隨排遺進入碎屑，給分解者。所以只有一部分能量傳到下一層。約十分之一是常用的教學概略值，不是每條食物鏈都固定。按步驟看一條鏈上能量怎麼一層層減少，用「傳遞比例」換 5%、10%、20%，再看能量金字塔。`,`Every trophic level must sustain life processes, and respiration releases heat; some organic matter is uneaten or enters detritus through waste, for decomposers. So only part of the energy reaches the next level. About one tenth is a common teaching approximation, not fixed for every food chain. Use the step buttons to watch the energy shrink along one chain, change "Transfer fraction" between 5%, 10% and 20%, and then look at the energy pyramid.`),
 reading:P(`畫面以稻裡有 8000 單位能量為例（示意單位，不是真實量測，也不是個體數或體重），傳遞比例取 5%、10%、20% 時，下三層分別是 400、20、1，800、80、8，1600、320、64。這是教學示意，約 10% 是常用概略值，實際常見的範圍大約 5～20%。\n\n沒傳到下一層的能量，不能全部說成「立刻變熱」：呼吸作用會散熱，排遺和沒被吃到的部分還會進入碎屑，供分解者利用，最後也都以熱散失。能量沿食物鏈單向流動，已散失的熱不會再變回食物裡的能量，所以不像碳那樣循環。多數生態系的能量從陽光開始，但深海熱泉附近也有利用化學能的生產者。`,`The picture uses rice holding 8000 units of energy (a schematic unit, not a measurement, and not numbers of individuals or body mass). With transfer fractions of 5%, 10% and 20% the next three levels are 400, 20, 1; 800, 80, 8; and 1600, 320, 64. This is a teaching illustration; about 10% is a common approximation and real values often range from about 5 to 20%.\n\nEnergy not passed on cannot all be called "heat at once": respiration releases heat, while waste and uneaten parts enter detritus for decomposers, and in the end all of it is lost as heat. Energy flows one way along a food chain, and lost heat does not turn back into energy in food, so it does not cycle like carbon. Most ecosystems begin with sunlight, but near deep-sea vents there are producers that use chemical energy.`),
 closure:P(`傳遞比例是概略示例；能量單向流動，最後散熱，所以食物鏈很少拉得太長。`,`Transfer fractions are illustrative; energy flows one way and ends as heat, so food chains are rarely very long.`),
 quiz:[
  {q:P(`稻裡有 8000 單位的能量，傳遞比例約 10%，蚱蜢得到多少？`,`Rice holds 8000 units and the transfer fraction is about 10%. How much does the grasshopper get?`),options:[P(`8000 單位`,`8000`),P(`800 單位`,`800`),P(`80 單位`,`80`),P(`8 單位`,`8`)],answer:1,why:P(`8000 × 10% ＝ 800 單位；再往上一層是 80、再一層是 8。`,`8000 × 10% = 800 units; the next levels are 80 and then 8.`),hint:P(`切到「約 10%」，看第二步。`,`Switch to "About 10%" and look at step two.`)},
  {q:P(`沒有傳到下一個營養階層的能量，去了哪裡？`,`Where does energy not passed to the next trophic level go?`),options:[P(`一直留在原處不變`,`It stays unchanged`),P(`一部分經呼吸變成熱散失，一部分隨排遺與沒被吃到的部分進入碎屑，給分解者`,`Some is lost as heat through respiration; some enters detritus with waste and uneaten parts, for decomposers`),P(`全部立刻變成熱`,`All of it turns into heat at once`),P(`全部傳回上一層`,`All of it goes back down`)],answer:1,why:P(`有呼吸散熱，也有排遺與沒被吃到的部分進入碎屑，最後也都散熱。`,`Some is lost as heat through respiration, and waste and uneaten parts enter detritus; in the end all of it is lost as heat.`),hint:P(`看第二步右邊的三條去向。`,`Look at the three routes on the right in step two.`)},
  {q:P(`為什麼食物鏈很少拉到五、六層以上？`,`Why are food chains rarely longer than five or six levels?`),options:[P(`因為動物不喜歡吃大的`,`Animals dislike eating big prey`),P(`因為每往上一層，傳到的能量都變少，最上層分到的太少`,`Because each level up receives less energy, and the top level gets too little`),P(`因為分解者吃光了`,`Because decomposers eat it all`),P(`因為陽光太弱`,`Because sunlight is too weak`)],answer:1,why:P(`能量一層層減少，越上層能養活的個體越少。`,`Energy shrinks level by level, so higher levels can support fewer animals.`),hint:P(`看最後一步四層的數字。`,`Look at the four numbers in the last step.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(ENERGY_TABS),steps(s.view===1?PY_SHORT:EN_SHORT),...(s.view===1?[]:[EFFC])],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:PY_NAMES[k],text:PY_TEXT[k]}:{title:EN_NAMES[k],text:enText(s)[k]};},
 draw:(c,s,t)=>s.view===1?dr('pyramid',3,PY_SHORT)(c,s,t):dr('energy',5,EN_SHORT)(c,s,t)},
{id:'carbon-cycle',title:P(`碳去了哪裡？`,`Where did the carbon go?`),sub:P(`物質的循環`,`Cycling of matter`),
 hook:P(`落葉分解之後，裡面的碳真的不見了嗎？植物只吸收二氧化碳嗎？你呼出的二氧化碳，又會到哪裡去？`,`When a leaf decomposes, has its carbon really gone? Do plants only take in carbon dioxide? Where does the carbon dioxide you breathe out go?`),
 body:P(`光合作用讓二氧化碳裡的碳進入生產者；攝食把含碳物質傳給消費者；各層的遺體和排遺由分解者分解。生產者、消費者和分解者都會呼吸，讓一部分碳以二氧化碳回到空氣。按步驟追蹤一個碳的旅行，再比較「能量單向、碳循環」，最後有一頁補充：氮。`,`Photosynthesis moves carbon from carbon dioxide into producers; feeding passes carbon-containing matter to consumers; the remains and waste of every level are broken down by decomposers. Producers, consumers and decomposers all respire, returning some carbon to the air as carbon dioxide. Follow one carbon trip step by step, compare "energy one way, carbon cycles", and finish with a supplement page on nitrogen.`),
 reading:P(`我們追蹤的是碳元素，不是同一個分子，也不是能量繞圈。少部分含碳物質在合適條件下被長期埋藏，其中一部分形成化石燃料；燃燒可以比較快把地層裡的碳送回空氣，兩條路徑的時間尺度不同。這裡不重講氣候變遷。畫面省略了海洋交換等細節，箭頭粗細不是流量。\n\n即使是封閉的生態瓶，也需要光這個能量輸入，不能因為物質可以循環，就說能量也是封閉或永動的。補充的氮循環：多數生物不能直接用氮氣，豆科植物根瘤裡的根瘤菌把氮氣變成植物能吸收的含氮物質；含氮物質沿食物鏈傳，遺體與排遺分解後回到土壤，有些細菌又把氮放回空氣。`,`We trace the carbon element, not one unchanged molecule, and not energy going round. A small part of carbon-containing matter is buried for a long time under suitable conditions and some forms fossil fuels; burning can return carbon from the ground to the air much faster, so the two routes run on different timescales. Climate change is not repeated here. The picture omits ocean exchange and other details, and arrow widths are not fluxes.\n\nEven a closed ecosphere needs light as an energy input; cycling matter does not make energy closed or perpetual. In the nitrogen supplement: most organisms cannot use nitrogen gas directly, and nodule bacteria in legume roots turn it into nitrogen compounds plants can absorb; nitrogen compounds pass along the food chain, remains and waste return them to the soil after decay, and some bacteria release nitrogen back to the air.`),
 closure:P(`碳元素在生物與環境之間循環；能量持續從陽光輸入，最後散熱，不循環。`,`Carbon cycles between organisms and the environment; energy keeps entering as sunlight and ends as heat without cycling.`),
 quiz:[
  {q:P(`植物對碳的作用，下列哪一句最完整？`,`Which statement about plants and carbon is most complete?`),options:[P(`植物只吸收二氧化碳`,`Plants only absorb carbon dioxide`),P(`植物行光合作用吸收二氧化碳，也行呼吸作用放出二氧化碳`,`Plants absorb carbon dioxide by photosynthesis and release carbon dioxide by respiration`),P(`植物只放出二氧化碳`,`Plants only release carbon dioxide`),P(`植物和碳無關`,`Plants have nothing to do with carbon`)],answer:1,why:P(`植物也會呼吸，所以兩個方向都有。`,`Plants respire too, so carbon goes both ways.`),hint:P(`看第五步。`,`Look at step five.`)},
  {q:P(`下面哪一個是「單向」，哪一個是「循環」？`,`Which is "one-way" and which "cycles"?`),options:[P(`能量單向，碳循環`,`Energy is one-way; carbon cycles`),P(`能量循環，碳單向`,`Energy cycles; carbon is one-way`),P(`兩個都循環`,`Both cycle`),P(`兩個都單向`,`Both are one-way`)],answer:0,why:P(`能量最後以熱散失，不會再變回食物；碳元素在生物與環境之間繞圈。`,`Energy ends as heat and does not turn back into food; carbon circulates between organisms and the environment.`),hint:P(`看「能量 vs 碳」的並排比較。`,`See the side-by-side "Energy vs carbon".`)},
  {q:P(`落葉被分解後，裡面的碳去哪了？`,`After a leaf decomposes, where has its carbon gone?`),options:[P(`憑空消失`,`It vanished`),P(`一部分經呼吸變成二氧化碳回到空氣，一部分留在土壤成為腐植質`,`Some returns to the air as carbon dioxide through respiration and some stays in the soil as humus`),P(`全部變成能量`,`It all turned into energy`),P(`全部傳給蚯蚓`,`It all went to earthworms`)],answer:1,why:P(`物質不會消失，只是換了形式與位置。`,`Matter does not vanish; it changes form and place.`),hint:P(`看第六步。`,`Look at step six.`)},
  {q:P(`（補充）根瘤菌對植物有什麼幫助？`,`(Supplement) How do nodule bacteria help a plant?`),options:[P(`幫植物行光合作用`,`They photosynthesise for the plant`),P(`把空氣中的氮氣變成植物能吸收的含氮物質`,`They turn nitrogen gas into nitrogen compounds the plant can absorb`),P(`把二氧化碳變成氧`,`They turn carbon dioxide into oxygen`),P(`把植物吃掉`,`They eat the plant`)],answer:1,why:P(`根瘤菌固定氮氣，豆科植物提供養分給它們，是互利共生。`,`Nodule bacteria fix nitrogen gas, and the legume gives them food: mutualism.`),hint:P(`切到「補充：氮」看第二步。`,`Switch to "Supplement: nitrogen" and look at step two.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(CARBON_TABS),steps(s.view===2?NT_SHORT:s.view===1?CM_SHORT:CB_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===2?{title:NT_NAMES[k],text:NT_TEXT[k]}:s.view===1?{title:CM_NAMES[k],text:CM_TEXT[k]}:{title:CB_NAMES[k],text:CB_TEXT[k]};},
 draw:(c,s,t)=>s.view===2?dr('nitrogen',4,NT_SHORT)(c,s,t):s.view===1?dr('compare',3,CM_SHORT)(c,s,t):dr('carbon',7,CB_SHORT)(c,s,t)}
];
B.register({id:'ecology_energy',title:P(`一片葉子如何養活整個網？`,`How can a leaf support a whole food web?`),subtitle:P(`生態角色、食物網、能量流動與物質循環`,`Ecological roles, food webs, energy flow and cycling of matter`),cover:'assets/covers/biology_ecology_energy_1023_v1.jpg',
 assetDir:'assets/biology/ecology_ai_1023/',family:P(`生命與環境`,`Life and environment`),bookName:P(`生態系`,`Ecosystem`),tabs});
})();
