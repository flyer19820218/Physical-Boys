/* Ecology lesson 1 · teacher-requested V5 remake, 2026-10-23.
 * Five tabs, seven views (the plan is assets/biology/ecology_l1_plan_1023.md):
 *   living-layer:        0 bridge (from the biosphere of unit 1 into the layer; three steps, no thickness repeated)
 *   organisation:        0 levels (individual, population, community, ecosystem on one meadow)
 *   sampling:            0 quadrat (4, 5, 3 plants, mean 4, x8 = 32), 1 recapture (N = M x C / R)
 *   population-balance:  0 balance (births + immigration - deaths - emigration), 1 capacity (carrying capacity)
 *   succession:          0 succession (five stages, two starting points)
 * Pictures: ecology_ai_1023/ (AI illustrations made by the teacher with Gemini, not photographs).
 * Each view is drawn by its own module, ecology_draw_<name>_1023_v1.js, which registers window.EcologyDraw[name];
 * the page text, steps, captions, picture labels (LAB, also window.EcologyKit.LAB) and multiple-choice checks live here.
 * Per-view state read by the drawing modules: quadrat s.set (0..2), recapture s.R (4, 2, 5, 0), balance s.sc (0..2),
 * succession s.origin (0 soil, 1 bare rock); every view also has s.phase (-1 play all, >=0 hold that step) and s.start.
 * Shared helpers: ecology_kit_1023_v1.js. Replaces the ecology_environment entry of ecology_lessons_1010_v1.js (left there, unused).
 */
(()=>{'use strict';
const K=window.EcologyKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── numbers shared by text and drawing ─────────────────────────────────────
const QSETS=[[4,5,3],[6,5,7],[2,3,1]],QAREA=8;                 // quadrat counts and the site/quadrat area ratio
const MARK_M=20,MARK_C=20,RSET=[4,2,5,0];                      // mark-recapture: marked first, caught again, marked among them
const START_N=40,SCEN=[{b:12,i:4,d:8,e:6},{b:6,i:2,d:14,e:4},{b:10,i:5,d:10,e:5}];
const qStat=s=>{const q=QSETS[s.set||0],sum=q[0]+q[1]+q[2],avg=sum/3;return{q,sum,avg,est:avg*QAREA};};
const rStat=s=>{const R=s.R==null?4:s.R;return{R,N:R>0?MARK_M*MARK_C/R:null};};
const bStat=s=>{const o=SCEN[s.sc||0],net=o.b+o.i-o.d-o.e;return{...o,net,end:START_N+net};};
K.QSETS=QSETS;K.QAREA=QAREA;K.MARK_M=MARK_M;K.MARK_C=MARK_C;K.RSET=RSET;K.START_N=START_N;K.SCEN=SCEN;

// ── picture and canvas labels used by the drawing modules (zh, en) ─────────
const LAB={
 aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`),schematic:P(`示意`,`Schematic`),sizeNoReal:P(`大小不代表真實大小`,`Sizes are not real sizes`),
 // bridge
 biosphere:P(`生物圈`,`Biosphere`),thinLayer:P(`薄薄的一層`,`A thin layer`),q1:P(`怎麼分層次？`,`How do we sort levels?`),q2:P(`數不完怎麼估？`,`How do we estimate?`),q3:P(`數量為什麼增減？`,`Why do numbers change?`),q4:P(`裸地怎麼變綠？`,`How does bare ground turn green?`),
 // levels
 individual:P(`個體`,`Individual`),population:P(`族群`,`Population`),community:P(`群集`,`Community`),ecosystem:P(`生態系`,`Ecosystem`),
 sparrow:P(`麻雀`,`Sparrow`),sparrowFlock:P(`約 8 隻麻雀`,`About 8 sparrows`),sameSpecies:P(`同種`,`Same species`),sameTime:P(`同時`,`Same time`),samePlace:P(`同地`,`Same place`),
 grass:P(`草`,`Grass`),grasshopper:P(`蚱蜢`,`Grasshopper`),butterfly:P(`蝴蝶`,`Butterfly`),web:P(`蜘蛛網`,`Spider web`),mushroom:P(`蕈類`,`Mushrooms`),log:P(`枯木`,`Dead log`),
 puddle:P(`水坑`,`Puddle`),soil:P(`土壤`,`Soil`),light:P(`光`,`Light`),air:P(`空氣`,`Air`),living:P(`生物`,`Living things`),nonliving:P(`非生物環境`,`Nonliving environment`),
 onlyOrganisms:P(`群集只算生物`,`A community counts organisms only`),eats:P(`被吃`,`Eaten`),decomposes:P(`分解`,`Decomposes`),
 // quadrat
 quadrat:P(`樣方`,`Quadrat`),plants:P(`株`,`plants`),mean:P(`平均`,`Mean`),site:P(`研究區`,`Study site`),times8:P(`8 倍`,`8 times`),estimate:P(`估計`,`Estimate`),about:P(`約`,`about`),
 random:P(`隨機放`,`Placed at random`),sameSize:P(`一樣大`,`Same size`),notCensus:P(`估計值，不是精確普查`,`An estimate, not an exact census`),setLabel:P(`樣方組`,`Sample set`),
 // recapture
 firstCatch:P(`第一次捉`,`First catch`),marked:P(`有記號`,`Marked`),unmarked:P(`沒有記號`,`Unmarked`),release:P(`放回`,`Release`),secondCatch:P(`第二次捉`,`Second catch`),
 formula:P(`N ≈ M × C ÷ R`,`N ≈ M × C ÷ R`),cannotUse:P(`R ＝ 0：不能用這個式子`,`R = 0: cannot use this formula`),assumptions:P(`假設`,`Assumptions`),classroom:P(`課堂用棋子模擬`,`Simulated with tokens in class`),
 vole:P(`田鼷鼠`,`Field mouse`),
 // balance and capacity
 start:P(`期初`,`Start`),end:P(`期末`,`End`),births:P(`出生`,`Births`),immigration:P(`遷入`,`Immigration`),deaths:P(`死亡`,`Deaths`),emigration:P(`遷出`,`Emigration`),net:P(`淨變化`,`Net change`),
 predators:P(`天敵`,`Predators`),snake:P(`黑眉錦蛇`,`Black-browed ratsnake`),eagle:P(`大冠鷲`,`Crested serpent eagle`),owl:P(`領角鴞`,`Collared scops owl`),
 increase:P(`增加`,`Increase`),decrease:P(`減少`,`Decrease`),unchanged:P(`不變`,`No change`),
 food:P(`食物`,`Food`),space:P(`空間`,`Space`),season:P(`季節`,`Season`),capacity:P(`環境負荷量`,`Carrying capacity`),more:P(`較多`,`More`),fewer:P(`較少`,`Fewer`),notFixedCap:P(`不是永遠固定的上限`,`Not a permanent fixed limit`),
 // succession
 bareSoil:P(`保留土壤的裸地`,`Bare ground with soil`),bareRock:P(`沒有土壤的裸岩`,`Bare rock without soil`),pioneer:P(`先鋒`,`Pioneers`),herbs:P(`草本`,`Herbs`),shrubs:P(`灌木`,`Shrubs`),trees:P(`林木`,`Trees`),
 lichen:P(`地衣`,`Lichen`),moss:P(`苔蘚`,`Moss`),seeds:P(`種子`,`Seeds`),roots:P(`根`,`Roots`),thinSoil:P(`薄土`,`Thin soil`),thickSoil:P(`土變厚`,`Soil thickens`),
 origin:P(`起點`,`Starting point`),notOneTree:P(`不是一株草長成樹`,`Not one herb growing into a tree`),notFixedPath:P(`路徑不固定`,`The path is not fixed`),camphor:P(`樟樹`,`Camphor tree`)
};
K.LAB=LAB;window.EcologyLabels=LAB;

// ── bridge / 0 ─────────────────────────────────────────────────────────────
const BR_SHORT=[P(`生物圈`,`Biosphere`),P(`一片草地`,`A meadow`),P(`四個問題`,`Four questions`)];
const BR_NAMES=[P(`生命只住在薄薄的一層`,`Life lives only in a thin layer`),P(`這一層裡，誰和誰住在一起？`,`In that layer, who lives with whom?`),P(`接下來的四個問題`,`The four questions ahead`)];
const BR_TEXT=[
 P(`前面已經看過：生命只住在地球薄薄的一層，叫做生物圈。這一課不再重講它有多薄，而是走進這一層裡面看。`,`We saw earlier that life lives only in a thin layer of Earth, the biosphere. This lesson does not repeat how thin it is; it walks into that layer and looks inside.`),
 P(`鏡頭拉近到一片草地：麻雀在水坑邊找食物，草長在土裡，蚱蜢停在草葉上，枯木上長出蕈類。這些生物不是各住各的，彼此有關係，也和水、土壤、陽光有關係。（AI 插圖，非實拍。）`,`Zoom into one meadow: sparrows feed beside a puddle, grass grows in the soil, a grasshopper rests on a leaf, and mushrooms grow on a dead log. These organisms do not live separately; they are linked to each other and to water, soil and sunlight. (An AI illustration, not a photo.)`),
 P(`這一課問四個問題：怎麼分層次？數不完怎麼估？數量為什麼會增減？裸地怎麼變綠？每個問題是一個分頁。`,`This lesson asks four questions: how do we sort levels? How do we estimate what we cannot count? Why do numbers rise and fall? How does bare ground turn green? Each question is one tab.`)];

// ── levels / 0 ─────────────────────────────────────────────────────────────
const LV_SHORT=[P(`個體`,`Individual`),P(`族群`,`Population`),P(`群集`,`Community`),P(`生態系`,`Ecosystem`)];
const LV_NAMES=[P(`個體：一隻麻雀`,`Individual: one sparrow`),P(`族群：同時、同地、同種`,`Population: same time, place and species`),P(`群集：各種生物族群合起來`,`Community: all the populations together`),P(`生態系：生物加上非生物環境`,`Ecosystem: organisms plus the nonliving environment`)];
const LV_TEXT=[
 P(`先看一隻麻雀。單獨一隻生物是一個個體。（AI 插圖，非實拍。）`,`Start with one sparrow. A single organism is an individual. (An AI illustration, not a photo.)`),
 P(`水坑邊這一群約 8 隻麻雀，是同一種、在同一個時間、同一個地方，合起來是一個族群。旁邊的蚱蜢和蝴蝶是別的種，不算在麻雀族群裡。「約 8 隻」是插圖的示意，不是普查數字。`,`This flock of about 8 sparrows beside the puddle is one species, at one time, in one place, so together they are a population. The grasshopper and butterfly are other species and are not part of the sparrow population. "About 8" is a schematic reading of the illustration, not a census.`),
 P(`草地上同時有麻雀族群、草、蚱蜢、蝴蝶、結網的蜘蛛、蕈類……每一種都是自己的族群，各種生物族群合起來是群集。群集只算生物，水和土壤不是生物，不算在群集裡。`,`The meadow has a sparrow population, grass, grasshoppers, butterflies, web-building spiders, mushrooms and more. Each kind is its own population, and all the populations together form the community. A community counts organisms only; water and soil are not organisms.`),
 P(`再把水坑、土壤、陽光、空氣加進來，並看它們和生物怎麼互相作用：陽光讓草行光合作用，草被蚱蜢吃，蕈類分解枯木。群集加上非生物環境與彼此的作用，才是生態系。`,`Now add the puddle, soil, sunlight and air, and look at how they act on the organisms: sunlight lets grass photosynthesise, grasshoppers eat grass, and mushrooms break down the dead log. A community plus the nonliving environment and their interactions is an ecosystem.`)];

// ── quadrat / 0 ────────────────────────────────────────────────────────────
const QD_SHORT=[P(`一株株數不完`,`Too many to count`),P(`放樣方、數株數`,`Place quadrats, count`),P(`算平均`,`Find the mean`),P(`乘上倍數`,`Scale up`)];
const QD_NAMES=[P(`一株一株數不完`,`Too many plants to count one by one`),P(`放樣方，數每個方框裡的株數`,`Place quadrats and count the plants in each`),P(`算每個樣方的平均株數`,`Find the mean plants per quadrat`),P(`乘上研究區是樣方的幾倍`,`Scale up by how many quadrats fit the site`)];
const qdText=s=>{const {q,avg,est}=qStat(s),m=Number.isInteger(avg)?`${avg}`:avg.toFixed(1),e=Number.isInteger(est)?`${est}`:est.toFixed(1);return[
 P(`這片草地很大，草又不會跑，但一株一株數不完。用樣方：在草地裡取幾個一樣大的方框當樣本，只數方框裡的株數。`,`This meadow is large and the plants do not move, but counting every one is too much. Use quadrats: take a few equal-sized frames as samples and count only the plants inside them.`),
 P(`隨機放三個一樣大的樣方，數每個樣方裡的植物：${q[0]} 株、${q[1]} 株、${q[2]} 株。（AI 插圖，植物數量是示意。）`,`Place three equal-sized quadrats at random and count the plants in each: ${q[0]}, ${q[1]} and ${q[2]} plants. (An AI illustration; the plant counts are schematic.)`),
 P(`平均每個樣方：(${q[0]} ＋ ${q[1]} ＋ ${q[2]}) ÷ 3 ＝ ${m} 株。`,`Mean per quadrat: (${q[0]} + ${q[1]} + ${q[2]}) ÷ 3 = ${m} plants.`),
 P(`研究區的面積是一個樣方的 ${QAREA} 倍，所以估計約 ${m} × ${QAREA} ＝ ${e} 株。換一組樣方，估出來的數會不同：這是估計值，不是精確普查。樣方要隨機放、大小一樣，放得越多越穩。`,`The study site is ${QAREA} times the area of one quadrat, so the estimate is about ${m} × ${QAREA} = ${e} plants. A different set of quadrats gives a different estimate: this is an estimate, not an exact census. Place quadrats at random, keep them the same size, and more quadrats give a steadier estimate.`)];};

// ── recapture / 1 ──────────────────────────────────────────────────────────
const RC_SHORT=[P(`會跑，不能用樣方`,`They move`),P(`第一次捉、做記號`,`First catch, mark`),P(`第二次捉、數記號`,`Second catch, count marks`),P(`算總數`,`Estimate the total`)];
const RC_NAMES=[P(`會跑的動物，改用捉放法`,`Moving animals: use mark-recapture`),P(`第一次捉，做記號後放回`,`Catch, mark and release`),P(`第二次捉，數有記號的`,`Catch again and count the marked`),P(`用式子估總數`,`Estimate the total with a formula`)];
const rcText=s=>{const {R,N}=rStat(s);return[
 P(`田鼷鼠會到處跑，不能用樣方一格一格數。捉放法的想法是：先做記號，再看記號在第二次捉到的動物裡占多少。`,`Field mice run about, so they cannot be counted frame by frame. Mark-recapture works like this: mark some first, then see what share of a second catch carries a mark.`),
 P(`第一次捉到 M ＝ ${MARK_M} 隻，做上記號後放回族群。課堂用棋子模擬，不自行捕捉野生動物。`,`The first catch is M = ${MARK_M} animals, which are marked and released back into the population. In class this is simulated with tokens; do not catch wild animals yourselves.`),
 P(`過一陣子，記號鼠已經混回族群。第二次捉到 C ＝ ${MARK_C} 隻，其中有記號的有 R ＝ ${R} 隻。`,`After a while the marked animals have mixed back in. The second catch is C = ${MARK_C} animals, and R = ${R} of them carry a mark.`),
 R>0?P(`記號鼠在第二次捉到的動物裡占 R ÷ C，也應該約等於它在整個族群裡的比例 M ÷ N。所以 N ≈ M × C ÷ R ＝ ${MARK_M} × ${MARK_C} ÷ ${R} ＝ ${N} 隻。這是估計值。`,`The marked share of the second catch, R ÷ C, should be about the marked share of the whole population, M ÷ N. So N ≈ M × C ÷ R = ${MARK_M} × ${MARK_C} ÷ ${R} = ${N}. This is an estimate.`)
   :P(`R ＝ 0 時，這個式子沒辦法用（不能除以 0）：第二次沒捉到任何有記號的，只能說族群可能很大，要重新取樣。捉放法也假設：記號不會掉、不影響存活與被捉的機會，放回後充分混合，短時間內沒有出生、死亡與遷移。`,`When R = 0 the formula cannot be used (you cannot divide by 0): no marked animal was caught, so the population may be large, and the sampling should be repeated. Mark-recapture also assumes that marks do not fall off or change survival or the chance of being caught, that animals mix well after release, and that there are no births, deaths or movements in the short time between catches.`)];};

// ── balance / 0 ────────────────────────────────────────────────────────────
const BL_SHORT=[P(`期初`,`Start`),P(`出生`,`Births`),P(`遷入`,`Immigration`),P(`死亡`,`Deaths`),P(`遷出`,`Emigration`),P(`淨變化`,`Net change`)];
const BL_NAMES=[P(`期初：${START_N} 隻田鼷鼠`,`Start: ${START_N} field mice`),P(`出生：族群增加`,`Births add to the population`),P(`遷入：從別處搬進來`,`Immigration: arriving from elsewhere`),P(`死亡：族群減少`,`Deaths reduce the population`),P(`遷出：搬到別處去`,`Emigration: leaving for elsewhere`),P(`四項加起來，才是淨變化`,`All four together make the net change`)];
const blText=s=>{const o=bStat(s),sg=o.net>0?`＋${o.net}`:`${o.net}`,sge=o.net>0?`+${o.net}`:`${o.net}`;return[
 P(`這片草地的田鼷鼠，期初有 ${START_N} 隻。一段時間後，數量改變了多少？要把四項都算進去。三個情境是教學示意，用上方的「情境」切換。`,`This meadow starts with ${START_N} field mice. After a period, how much has the number changed? All four terms count. The three scenarios are teaching examples; switch them with "Scenario" above.`),
 P(`出生：這段時間生下 ${o.b} 隻，數量增加。`,`Births: ${o.b} are born in this period, so the number rises.`),
 P(`遷入：有 ${o.i} 隻從別的地方搬進來，數量也增加。數量變多，不一定是這裡生出來的。`,`Immigration: ${o.i} arrive from other places, which also raises the number. More animals does not always mean they were born here.`),
 P(`死亡：有 ${o.d} 隻死亡，原因可能是天敵（蛇、大冠鷲、領角鴞）、疾病或衰老，數量減少。`,`Deaths: ${o.d} die, from predators (ratsnakes, serpent eagles, owls), disease or old age, so the number falls.`),
 P(`遷出：有 ${o.e} 隻離開這片草地，數量減少。`,`Emigration: ${o.e} leave this meadow, so the number falls.`),
 P(`淨變化 ＝ 出生 ＋ 遷入 － 死亡 － 遷出 ＝ ${o.b} ＋ ${o.i} － ${o.d} － ${o.e} ＝ ${sg}，期末 ${o.end} 隻。亮點表示進出的方向，不是每秒的出生或死亡速率。`,`Net change = births + immigration − deaths − emigration = ${o.b} + ${o.i} − ${o.d} − ${o.e} = ${sge}, so the end count is ${o.end}. The moving dots show direction, not births or deaths per second.`)];};

// ── capacity / 1 ───────────────────────────────────────────────────────────
const CP_SHORT=[P(`食物多`,`Plenty of food`),P(`食物少`,`Little food`),P(`其他條件`,`Other conditions`)];
const CP_NAMES=[P(`草多：能支持的數量較多`,`Plenty of grass: more can be supported`),P(`草少：能支持的數量較少`,`Little grass: fewer can be supported`),P(`不只看食物`,`Not only food`)];
const CP_TEXT=[
 P(`環境負荷量是在特定條件下，環境能支持的族群大小。草長得多、食物充足的草地，能支持的田鼷鼠示意為「較多」。（只比較多少，不是真實數字。）`,`Carrying capacity is the population size an environment can support under particular conditions. A meadow with plenty of grass and food can support, schematically, "more" field mice. (This compares amounts only; the numbers are not real.)`),
 P(`同一片草地，遇到缺水的季節，草變少，能支持的田鼷鼠示意為「較少」。同一塊地，環境負荷量也會改變。`,`The same meadow in a dry season has less grass and can support, schematically, "fewer" field mice. On the same ground the carrying capacity can change.`),
 P(`除了食物，空間、天敵和季節也會改變環境負荷量，所以它不是永遠固定的硬上限。數量超過某個情況之後會怎麼變，還需要更多資料才能判斷，這個畫面不能直接下結論。`,`Besides food, space, predators and the season also change carrying capacity, so it is not a permanent hard limit. What happens when numbers pass some point needs more evidence; this picture cannot settle it.`)];

// ── succession / 0 ─────────────────────────────────────────────────────────
const SU_SHORT=[P(`裸地`,`Bare ground`),P(`先鋒`,`Pioneers`),P(`草本`,`Herbs`),P(`灌木`,`Shrubs`),P(`林木`,`Trees`)];
const suNames=s=>{const r=s.origin===1;return[
 r?P(`起點：沒有土壤的裸岩`,`Start: bare rock without soil`):P(`起點：保留土壤的裸地`,`Start: bare ground with soil`),
 r?P(`先鋒：地衣與苔蘚`,`Pioneers: lichen and moss`):P(`先鋒：先長出來的小草`,`Pioneers: the first small plants`),
 P(`草本變多`,`Herbs increase`),P(`灌木進來`,`Shrubs arrive`),P(`林木長成`,`Trees grow up`)];};
const suText=s=>{const r=s.origin===1;return[
 r?P(`裸岩上沒有土壤，什麼植物也沒有。這是起點。（示意，不寫年數。）`,`Bare rock has no soil and no plants. This is the starting point. (Schematic; no years are given.)`)
  :P(`地面保留了土壤，看起來光禿禿的，但土裡可能還有種子、根和微生物。這是起點。（示意，不寫年數。）`,`The ground has kept its soil. It looks bare, but the soil may still hold seeds, roots and microbes. This is the starting point. (Schematic; no years are given.)`),
 r?P(`地衣與苔蘚先附在岩面上，慢慢累積一層薄薄的土。先到的生物改變了環境，後來的植物才有機會長在上面。`,`Lichen and moss attach to the rock first and slowly build a thin layer of soil. The first arrivals change the conditions, so later plants get a chance to establish.`)
  :P(`土裡的種子和根發芽，小草先長出來。有土壤的地方，常常能從草本開始。`,`Seeds and roots in the soil sprout and small plants come up first. Where soil remains, succession often starts with herbs.`),
 P(`草的種類和數量增加，根和落葉讓土壤變厚、能留住更多水。先到的生物改變了環境，也讓後來的物種比較容易建立。`,`The kinds and numbers of herbs increase, and roots and fallen leaves thicken the soil and hold more water. The first arrivals change the environment and make it easier for later species to establish.`),
 P(`草叢之間長出灌木，高一點的灌木遮住部分的光，一些喜歡全光的草本變少。群集的組成又改變了。`,`Shrubs grow up among the herbs. The taller shrubs shade part of the light, and some light-loving herbs become fewer. The composition of the community has changed again.`),
 P(`樹長高了，樹冠遮光，林下的光、溫度和濕度和裸地時不一樣，住的生物也不同。演替改變的是群集的組成，不是一株草長成一棵樹；路徑會受起點、種源、氣候和干擾影響，不是每個地方都照這個順序，也不一定以森林結尾。`,`Trees have grown tall; the canopy shades the ground, so light, temperature and humidity under it differ from bare ground, and different organisms live there. Succession changes the composition of the community; it is not one herb growing into a tree. The path depends on the starting point, sources of colonists, climate and disturbance, so not every place follows this order or ends as forest.`)];};

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;
 K.panel(c,40,40,880,520,'#16332b');
 K.text(c,P(`動畫製作中`,`Animation in progress`),480,270,40,C.yellow,'center');
 K.text(c,short[k],480,330,28,C.white,'center');
 K.text(c,P(`（${name}）`,`(${name})`),480,372,22,C.muted,'center');
 K.pulse(c,480,440,t,C.cyan,14);};
const dr=(name,n,short)=>(c,s,t)=>((window.EcologyDraw&&window.EcologyDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const RESTART=new Set(['phase','set','R','sc','origin']);
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}else if(RESTART.has(k))s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const SAMP_TABS=[P(`樣方：數草`,`Quadrats: plants`),P(`捉放法：數田鼷鼠`,`Mark-recapture: mice`)];
const BAL_TABS=[P(`四個收支`,`Four flows`),P(`環境負荷量`,`Carrying capacity`)];
const VIEW=(tabsArr)=>choice(P(`觀察`,`View`),'view',tabsArr.map((n,i)=>[i,n]));
const SETS=choice(P(`樣方組`,`Sample set`),'set',[[0,P(`A 組`,`Set A`)],[1,P(`B 組`,`Set B`)],[2,P(`C 組`,`Set C`)]]);
const RS=choice(P(`第二次有記號的 R`,`Marked in second catch, R`),'R',RSET.map(r=>[r,P(`R ＝ ${r}`,`R = ${r}`)]));
const SCS=choice(P(`情境`,`Scenario`),'sc',[[0,P(`情境 A`,`Scenario A`)],[1,P(`情境 B`,`Scenario B`)],[2,P(`情境 C`,`Scenario C`)]]);
const ORIGIN=choice(P(`起點`,`Starting point`),'origin',[[0,P(`保留土壤的裸地`,`Bare ground with soil`)],[1,P(`沒有土壤的裸岩`,`Bare rock without soil`)]]);

const tabs=[
{id:'living-layer',title:P(`薄薄一層裡，誰和誰住在一起？`,`In the thin living layer, who lives together?`),sub:P(`從生物圈到生態系`,`From the biosphere to ecosystems`),
 hook:P(`之前我們知道，生命只住在地球薄薄的一層。可是這一層裡，生物不是各住各的：一片草地上，麻雀在水坑邊找東西吃，蚱蜢躲在草葉間，枯木上長出蕈類。牠們彼此有關係嗎？和水、土壤、陽光呢？這一課，我們走進這一層，問四個問題。`,`Earlier we learned that life lives only in a thin layer of Earth. But inside that layer, organisms do not live separately: on a meadow, sparrows search for food beside a puddle, a grasshopper hides among the leaves, and mushrooms grow on a dead log. Are they linked to each other? To water, soil and sunlight? In this lesson we walk into the layer and ask four questions.`),
 body:P(`前面已經看過生物圈有多薄；這一課不再重講厚度，而是走進這一層裡面，看生物怎麼牽連在一起。按步驟鈕看三個畫面，也可以連續播放。`,`We already saw how thin the biosphere is; this lesson does not repeat the thickness but walks inside the layer to see how organisms are linked. Use the step buttons to look at three scenes, or play them all.`),
 reading:P(`生物圈是地球上有生物活動的範圍，涵蓋部分大氣、水域與地表附近。它的厚度與尺度前面已經說過。這一課接著問：在這一層裡，生物不是各自獨立的。同一個地方的生物會彼此作用，也和土壤、水、光和空氣互相影響。\n\n接下來四個分頁分別問：怎麼把一片草地分成個體、族群、群集和生態系？數不完的生物怎麼估？族群的數量為什麼增加或減少？裸地怎麼慢慢變綠？`,`The biosphere is the part of Earth where life is active, covering parts of the atmosphere, waters and the ground surface. Its thickness and scale were covered earlier. This lesson goes on to ask: inside that layer, organisms are not independent. Organisms in one place act on each other, and they also affect, and are affected by, soil, water, light and air.\n\nThe next four tabs ask: how do we sort a meadow into individuals, populations, communities and ecosystems? How do we estimate what we cannot count? Why do population numbers rise or fall? How does bare ground slowly turn green?`),
 closure:P(`生物圈是薄薄的一層；在這一層裡，生物與生物、生物與環境互相牽連。接下來用四個問題走進去：分層次、估數量、看增減、看群集怎麼改變。`,`The biosphere is a thin layer; inside it, organisms and their environment are linked. The next four questions walk inside: sorting levels, estimating numbers, watching rises and falls, and seeing how a community changes.`),
 quiz:[
  {q:P(`這一課和前面學過的生物圈，關係是哪一個？`,`How does this lesson relate to the biosphere we studied earlier?`),options:[P(`重講一次生物圈有多厚`,`It repeats how thick the biosphere is`),P(`走進生物圈裡，看生物彼此和與環境怎麼牽連`,`It goes inside the biosphere to see how organisms are linked to each other and to the environment`),P(`說明生命可以離開地球`,`It explains that life can leave Earth`),P(`只講草地，不講生物圈`,`It talks only about meadows, not the biosphere`)],answer:1,why:P(`前面講的是生物圈的範圍；這一課講這一層裡生物之間、生物與環境的關係。`,`The earlier lesson covered the range of the biosphere; this lesson covers the relationships among organisms and with the environment inside it.`),hint:P(`想想這一課的第一句話。`,`Think of the first sentence of this lesson.`)},
  {q:P(`在草地的畫面裡，下列哪一項不是生物？`,`In the meadow scene, which of these is not an organism?`),options:[P(`麻雀`,`Sparrow`),P(`蕈類`,`Mushrooms`),P(`水坑`,`Puddle`),P(`蚱蜢`,`Grasshopper`)],answer:2,why:P(`水坑是非生物環境；麻雀、蕈類和蚱蜢都是生物。`,`The puddle is part of the nonliving environment; sparrows, mushrooms and grasshoppers are organisms.`),hint:P(`問自己：它會生長、繁殖嗎？`,`Ask yourself whether it grows and reproduces.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:()=>[steps(BR_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return{title:BR_NAMES[k],text:BR_TEXT[k]};},
 draw:(c,s,t)=>dr('bridge',3,BR_SHORT)(c,s,t)},
{id:'organisation',title:P(`同一片草地，算幾個層次？`,`One meadow: how many levels?`),sub:P(`個體、族群、群集與生態系`,`Individual, population, community and ecosystem`),
 hook:P(`草地上有一群麻雀在水坑邊找食物，旁邊有草、蚱蜢、蝴蝶，還有一段長著蕈類的枯木。如果把牠們全部圈起來，這算一個「族群」嗎？那水坑和陽光算不算在裡面？`,`A flock of sparrows feeds beside a puddle on a meadow, with grass, a grasshopper and a butterfly nearby and a dead log with mushrooms. If we circle all of them, is that one "population"? And do the puddle and the sunlight count as part of it?`),
 body:P(`一隻麻雀是一個個體。同時、同地、同種的麻雀合起來是族群。同一個地方的各種生物族群合起來是群集。群集再加上水、土壤、光和空氣等非生物環境，以及它們和生物的作用，才是生態系。按步驟鈕，一層一層拉遠，看每一層多納入了什麼。`,`One sparrow is an individual. Sparrows of the same species in the same place at the same time form a population. The populations of all kinds in one place together form a community. A community plus the nonliving environment, such as water, soil, light and air, and how these act on the organisms, is an ecosystem. Use the step buttons to zoom out level by level and see what each level adds.`),
 reading:P(`「同時、同地、同種」是辨認族群的條件。群集只算生物，不把土壤或水算進去；生態系還要討論生物和環境的互相影響，例如草長高會遮住地面的光，蕈類分解枯木，讓養分回到土裡。畫面裡的「約 8 隻麻雀」是 AI 插圖的示意，不是普查數字，顏色和大小也只是構圖。\n\n每多一層，納入的對象就不同，不是把同一個名詞換大一點：個體是一隻；族群是同種的一群；群集是各種生物的族群；生態系還加上非生物環境與彼此的作用。`,`"Same time, same place, same species" are the conditions for recognising a population. A community counts organisms only and does not include soil or water; an ecosystem also considers how organisms and environment affect each other, for example tall grass shades the ground, and mushrooms break down the dead log so nutrients return to the soil. The "about 8 sparrows" in the picture is a schematic reading of an AI illustration, not a census, and colours and sizes are only composition.\n\nEach level adds different things; it is not the same word made bigger: an individual is one; a population is a group of one species; a community is the populations of all species; an ecosystem also adds the nonliving environment and the interactions.`),
 closure:P(`族群看同一種；群集看各種生物；生態系還要加上非生物環境和彼此的作用。`,`A population is one species; a community is all the species; an ecosystem also adds the nonliving environment and the interactions.`),
 quiz:[
  {q:P(`水坑邊的約 8 隻麻雀，屬於哪一個層次？`,`The flock of about 8 sparrows beside the puddle is at which level?`),options:[P(`個體`,`Individual`),P(`族群`,`Population`),P(`群集`,`Community`),P(`生態系`,`Ecosystem`)],answer:1,why:P(`同一種、同一個時間、同一個地方的一群，是族群。`,`A group of one species, at one time, in one place, is a population.`),hint:P(`檢查「同時、同地、同種」。`,`Check "same time, place and species".`)},
  {q:P(`草地上所有的生物（麻雀、草、蚱蜢、蕈類……）合起來，叫做什麼？`,`What are all the organisms on the meadow together (sparrows, grass, grasshoppers, mushrooms…) called?`),options:[P(`族群`,`A population`),P(`群集`,`A community`),P(`生態系`,`An ecosystem`),P(`一個個體`,`An individual`)],answer:1,why:P(`各種生物的族群合起來是群集；沒有算進水、土壤等非生物環境，所以還不是生態系。`,`The populations of all kinds together form a community; since the nonliving environment such as water and soil is not counted, it is not yet an ecosystem.`),hint:P(`有沒有算進水和土壤？`,`Are water and soil counted?`)},
  {q:P(`生態系比群集「多出來」的是什麼？`,`What does an ecosystem add to a community?`),options:[P(`再多幾隻麻雀`,`A few more sparrows`),P(`水、土壤、光等非生物環境，以及它們和生物的互相作用`,`The nonliving environment such as water, soil and light, and how it interacts with the organisms`),P(`只是換了一個名字`,`Only a new name`),P(`更多種類的蕈類`,`More kinds of mushrooms`)],answer:1,why:P(`生態系 ＝ 群集 ＋ 非生物環境 ＋ 彼此的作用。`,`Ecosystem = community + nonliving environment + their interactions.`),hint:P(`看最後一步多出現了什麼。`,`Look at what appears in the last step.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:()=>[steps(LV_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return{title:LV_NAMES[k],text:LV_TEXT[k]};},
 draw:(c,s,t)=>dr('levels',4,LV_SHORT)(c,s,t)},
{id:'sampling',title:P(`數不完，怎麼估？`,`Too many to count: how do we estimate?`),sub:P(`樣方與捉放法`,`Quadrats and mark-recapture`),
 hook:P(`一大片草地上的草，和草地裡跑來跑去的田鼷鼠，可以用同一種方法數嗎？如果不能一隻一隻數，要怎麼知道大概有多少？`,`Can we count grass over a large meadow and field mice running through it with the same method? If we cannot count one by one, how do we know roughly how many there are?`),
 body:P(`很少移動的生物，例如草，可以用樣方：在草地裡隨機放幾個一樣大的方框，數每個方框裡的株數，求平均，再乘上整片草地是方框的幾倍。會跑的動物，例如田鼷鼠，用捉放法：第一次捉 M 隻做記號後放回，第二次捉 C 隻，其中有記號的是 R 隻，總數 N 約等於 M × C ÷ R。兩種方法都是用樣本估整體，估出來的數不是精確的普查。用上方的「觀察」切換，再用選項換一組樣方或換一個 R。課堂用棋子模擬，不自行捕捉野生動物。`,`For organisms that hardly move, such as grass, use quadrats: place several equal-sized frames at random, count the plants in each, take the mean, and multiply by how many frames fit the whole meadow. For animals that run about, such as field mice, use mark-recapture: mark M animals on the first catch and release them, catch C on the second, of which R are marked, so the total N is about M × C ÷ R. Both methods estimate the whole from a sample, and the result is not an exact census. Use "View" above to switch, then use the options to change the sample set or R. In class this is simulated with tokens; do not catch wild animals yourselves.`),
 reading:P(`樣方：三個樣方各有 4、5、3 株，平均 4 株；研究區面積是一個樣方的 8 倍，估約 32 株。換一組樣方，估出來的數會不一樣，所以樣方要隨機放、大小一樣，放得越多越穩。\n\n捉放法：假設記號不會掉、不影響動物的存活與被捉的機會，放回後充分混合，兩次捉的時間之間沒有明顯的出生、死亡與遷移。R 為 0 時，這個式子不能用。多算幾次再平均，能減少隨機誤差，但不能修正已經不成立的假設。`,`Quadrats: three quadrats hold 4, 5 and 3 plants, a mean of 4; the study site is 8 times one quadrat in area, so the estimate is about 32. A different set of quadrats gives a different estimate, so place quadrats at random, keep them the same size, and more quadrats give a steadier estimate.\n\nMark-recapture: it assumes marks do not fall off or change survival or the chance of being caught, animals mix well after release, and there are no noticeable births, deaths or movements between the two catches. When R is 0 the formula cannot be used. Repeating and averaging reduces random error, but it cannot repair assumptions that no longer hold.`),
 closure:P(`先看取樣的方法和假設合不合理，再看算出來的總數。`,`Check whether the sampling method and its assumptions are reasonable before trusting the total you calculate.`),
 quiz:[
  {q:P(`三個樣方各有 4、5、3 株，研究區是一個樣方面積的 8 倍，估計約有幾株？`,`Three quadrats hold 4, 5 and 3 plants, and the study site is 8 times the area of one quadrat. About how many plants are there?`),options:[P(`12 株`,`12`),P(`32 株`,`32`),P(`96 株`,`96`),P(`4 株`,`4`)],answer:1,why:P(`平均 (4＋5＋3) ÷ 3 ＝ 4 株，再乘 8，約 32 株。`,`The mean is (4 + 5 + 3) ÷ 3 = 4, and 4 × 8 is about 32.`),hint:P(`先求平均，再乘倍數。`,`Find the mean first, then multiply by the ratio.`)},
  {q:P(`捉放法：先做記號 M ＝ 20 隻，第二次捉 C ＝ 20 隻，其中有記號 R ＝ 5 隻，總數約是多少？`,`Mark-recapture: M = 20 marked, then C = 20 caught, of which R = 5 are marked. About how many are there in total?`),options:[P(`20 隻`,`20`),P(`80 隻`,`80`),P(`100 隻`,`100`),P(`400 隻`,`400`)],answer:1,why:P(`N ≈ M × C ÷ R ＝ 20 × 20 ÷ 5 ＝ 80。`,`N ≈ M × C ÷ R = 20 × 20 ÷ 5 = 80.`),hint:P(`用式子 M × C ÷ R。`,`Use M × C ÷ R.`)},
  {q:P(`下列哪一個情況，會讓捉放法的估計不可靠？`,`Which situation makes a mark-recapture estimate unreliable?`),options:[P(`記號很容易掉落`,`The marks fall off easily`),P(`放回後動物充分混合`,`The animals mix well after release`),P(`記號不影響被捉的機會`,`The mark does not change the chance of being caught`),P(`兩次捉的時間隔得很短`,`The two catches are close together in time`)],answer:0,why:P(`記號掉了，第二次捉到的有記號的 R 會變少，算出來的總數就會偏高。其他三項正是捉放法需要的假設。`,`If marks fall off, fewer marked animals (R) are seen in the second catch, and the estimated total comes out too high. The other three are the assumptions the method needs.`),hint:P(`想想記號掉了會讓 R 變多還是變少。`,`Think whether lost marks make R larger or smaller.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0,set:0,R:4}),
 controls:s=>[VIEW(SAMP_TABS),steps(s.view===1?RC_SHORT:QD_SHORT),s.view===1?RS:SETS],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:RC_NAMES[k],text:rcText(s)[k]}:{title:QD_NAMES[k],text:qdText(s)[k]};},
 draw:(c,s,t)=>s.view===1?dr('recapture',4,RC_SHORT)(c,s,t):dr('quadrat',4,QD_SHORT)(c,s,t)},
{id:'population-balance',title:P(`數量變多，一定是生出來的嗎？`,`More animals: were they all born here?`),sub:P(`出生、死亡、遷入、遷出`,`Births, deaths, immigration, emigration`),
 hook:P(`一個星期後，草地上的田鼷鼠變多了。是因為生了很多小鼠嗎？會不會有些是從別的地方搬來的？如果蛇和貓頭鷹吃掉了一些，數量還會變多嗎？`,`A week later there are more field mice on the meadow. Were many born? Might some have moved in from elsewhere? And if snakes and owls ate some, could the number still rise?`),
 body:P(`一段時間裡，族群數量的淨變化 ＝ 出生 ＋ 遷入 － 死亡 － 遷出。比較前後的數量，四項都要看，不能只看出生。環境負荷量是在特定條件下，環境能支持的族群大小，會隨食物、空間、天敵和季節改變，不是永遠固定的硬上限。用「觀察」切換「四個收支」和「環境負荷量」，用「情境」換三組數字。`,`Over a period, the net change in a population = births + immigration − deaths − emigration. To compare numbers before and after, all four terms matter, not births alone. Carrying capacity is the population an environment can support under particular conditions; it changes with food, space, predators and season and is not a permanent hard limit. Use "View" to switch between "Four flows" and "Carrying capacity", and "Scenario" to change the three sets of numbers.`),
 reading:P(`畫面以期初 ${START_N} 隻為例，三個情境是教學示意：情境 A 淨增加 2 隻、情境 B 淨減少 10 隻、情境 C 沒有淨變化。亮點表示進出的方向，不是每秒出生或死亡的實測速率。\n\n環境負荷量用食物多、少的草地示意，只比較「較多」和「較少」，不是某一片草地真正的上限。數量超過某個情況之後會怎樣，還需要更多資料才能下結論。族群的變動也受疾病、遷移和其他生物影響，不能只套一個固定的公式或週期。`,`The picture starts from ${START_N} animals, and the three scenarios are teaching examples: Scenario A has a net gain of 2, Scenario B a net loss of 10, and Scenario C no net change. The moving dots show direction, not measured births or deaths per second.\n\nCarrying capacity is shown with grass-rich and grass-poor meadows and compares only "more" and "fewer"; it is not the true limit of any one meadow. What happens after numbers pass some point needs more evidence before a conclusion. Population changes are also affected by disease, movement and other organisms, so they cannot simply be fitted to one fixed formula or cycle.`),
 closure:P(`數量的變化要算四項：出生、遷入、死亡、遷出；環境負荷量要看條件，不是固定的上限。`,`Count four terms for a change in numbers: births, immigration, deaths and emigration; carrying capacity depends on conditions and is not a fixed limit.`),
 quiz:[
  {q:P(`期初 40 隻，出生 12、遷入 4、死亡 8、遷出 6，期末有幾隻？`,`The start is 40 animals with 12 born, 4 arriving, 8 dying and 6 leaving. How many are there at the end?`),options:[P(`40 隻`,`40`),P(`42 隻`,`42`),P(`52 隻`,`52`),P(`56 隻`,`56`)],answer:1,why:P(`40 ＋ 12 ＋ 4 － 8 － 6 ＝ 42。四項都要算，不是只看出生。`,`40 + 12 + 4 − 8 − 6 = 42. All four terms count, not births alone.`),hint:P(`出生和遷入加，死亡和遷出減。`,`Add births and immigration; subtract deaths and emigration.`)},
  {q:P(`一個星期後，草地上的田鼷鼠變多了，下列哪一句最合理？`,`A week later there are more field mice on the meadow. Which statement is most reasonable?`),options:[P(`一定是生了很多小鼠`,`Many must have been born`),P(`也可能有些是從別處遷入的，要把四項都看`,`Some may also have immigrated; look at all four terms`),P(`一定是天敵變少了`,`Predators must have decreased`),P(`一定是食物變多了`,`Food must have increased`)],answer:1,why:P(`數量變多，可能是出生變多，也可能是遷入，或兩者都有；光看總數無法判斷。`,`More animals could mean more births, immigration, or both; the total alone cannot tell you.`),hint:P(`想想有哪四項會改變數量。`,`Think of the four terms that change the number.`)},
  {q:P(`關於環境負荷量，下列哪一句正確？`,`Which statement about carrying capacity is correct?`),options:[P(`它是永遠不變的硬上限`,`It is a permanent hard limit that never changes`),P(`它會隨食物、空間、天敵和季節而改變`,`It changes with food, space, predators and season`),P(`它只和食物有關`,`It depends only on food`),P(`數量一超過它，就會立刻被刪到上限`,`Once the number passes it, the population is cut to the limit at once`)],answer:1,why:P(`環境負荷量是特定條件下環境能支持的族群大小，條件變了它也會變。`,`Carrying capacity is the population an environment can support under particular conditions, and it changes when the conditions change.`),hint:P(`看第三步：除了食物還有哪些？`,`Look at step three: what besides food?`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0,sc:0}),
 controls:s=>[VIEW(BAL_TABS),steps(s.view===1?CP_SHORT:BL_SHORT),...(s.view===1?[]:[SCS])],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:CP_NAMES[k],text:CP_TEXT[k]}:{title:BL_NAMES[k],text:blText(s)[k]};},
 draw:(c,s,t)=>s.view===1?dr('capacity',3,CP_SHORT)(c,s,t):dr('balance',6,BL_SHORT)(c,s,t)},
{id:'succession',title:P(`裸地怎麼變綠？`,`How does bare ground turn green?`),sub:P(`群集演替`,`Ecological succession`),
 hook:P(`崩塌後的坡地，或剛露出來的岩面，一開始什麼都沒有，後來卻長出草、灌木，最後變成樹林。這是原來的一株草慢慢長成大樹嗎？`,`A slope after a landslide, or a newly exposed rock face, starts with nothing, yet later grass and shrubs appear and finally woodland. Is that one original herb slowly growing into a tree?`),
 body:P(`演替是群集的組成隨時間改變，不是單一個體變成另一種。先來的生物和環境互相作用，可能改變土壤、光或水分，讓後來的物種比較容易建立。起點有沒有土壤、附近有沒有種子的來源、氣候和干擾，都會影響後來的變化。用「起點」切換有土壤的裸地和裸岩，再用步驟鈕看各個階段。`,`Succession is a change in the composition of a community over time, not one organism turning into another species. The first arrivals interact with the conditions and may change soil, light or water, making it easier for later species to establish. Whether the starting point has soil, whether seed sources lie nearby, and the climate and disturbance all affect what follows. Use "Starting point" to switch between bare ground with soil and bare rock, then use the step buttons to look at each stage.`),
 reading:P(`畫面是示意：階段只是一種可能的路徑，不是播放每一年真實發生的過程，也不寫固定年數。\n\n保留土壤的地方，土裡可能還有種子、根和微生物，常從草本開始；沒有土壤的裸岩，要先有地衣、苔蘚，慢慢累積薄薄的土，其他植物才長得住。不是所有的地方都照這個順序，也不是一定以森林結尾；起點、種子的來源、氣候和干擾都會改變路徑。圖中的灌木、地衣和苔蘚是程式畫的示意。`,`The picture is schematic: the stages are one possible path, not a replay of what happens each year, and no fixed years are given.\n\nWhere soil remains, the soil may still hold seeds, roots and microbes, and succession often starts with herbs; on bare rock, lichen and moss come first and slowly build a thin soil before other plants can hold on. Not every place follows this order, and it does not always end as forest; the starting point, seed sources, climate and disturbance all change the path. The shrubs, lichen and moss in the picture are drawn by program as schematics.`),
 closure:P(`演替改變的是群集的組成；起點條件和干擾會改變路徑。`,`Succession changes the composition of a community; starting conditions and disturbance change its path.`),
 quiz:[
  {q:P(`演替指的是什麼？`,`What does succession mean?`),options:[P(`一株草慢慢長成一棵樹`,`One herb slowly growing into a tree`),P(`群集的組成隨時間改變`,`The composition of a community changing over time`),P(`一種動物變成另一種動物`,`One animal turning into another`),P(`植物的數量永遠不變`,`The number of plants never changing`)],answer:1,why:P(`演替改變的是群集裡有哪些物種、各占多少，不是單一個體的變身。`,`Succession changes which species are in the community and how much of each there is; it is not one individual transforming.`),hint:P(`再讀一次畫面上的「不是一株草長成樹」。`,`Read again the line "not one herb growing into a tree".`)},
  {q:P(`保留土壤的裸地和沒有土壤的裸岩，起點的差別，下列哪一句最合理？`,`Which statement best describes the difference between bare ground with soil and bare rock?`),options:[P(`保留土壤的地方，土裡可能還有種子和根；裸岩要先有地衣、苔蘚慢慢累積薄土`,`Where soil remains, the soil may still hold seeds and roots; bare rock needs lichen and moss to build thin soil first`),P(`兩者完全一樣`,`They are exactly the same`),P(`裸岩上可以直接長出大樹`,`Big trees can grow directly on bare rock`),P(`只有保留土壤的地方才有演替`,`Succession occurs only where soil remains`)],answer:0,why:P(`起點條件不同，先出現的生物也不同。`,`Starting conditions differ, so the first organisms to arrive differ too.`),hint:P(`切換「起點」，看第二步。`,`Switch the "Starting point" and look at step two.`)},
  {q:P(`關於演替，下列哪一句正確？`,`Which statement about succession is correct?`),options:[P(`每個地方最後都會變成同一種森林`,`Every place ends up as the same kind of forest`),P(`路徑會受起點、種子來源、氣候與干擾影響，不一定以森林結尾`,`The path depends on the starting point, seed sources, climate and disturbance, and does not always end as forest`),P(`每個階段都剛好持續固定的年數`,`Every stage lasts exactly a fixed number of years`),P(`先來的生物不會改變環境`,`The first arrivals do not change the environment`)],answer:1,why:P(`演替的路徑不固定，畫面只是一種示意。`,`The path of succession is not fixed; the picture is one schematic.`),hint:P(`想想最後一步最後一句。`,`Think of the last sentence of the last step.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0,origin:0}),
 controls:()=>[steps(SU_SHORT),ORIGIN],
 act:viewAct,
 explain:s=>{const k=pick(s);return{title:suNames(s)[k],text:suText(s)[k]};},
 draw:(c,s,t)=>dr('succession',5,SU_SHORT)(c,s,t)}
];
B.register({id:'ecology_environment',title:P(`生命住在多薄的一層？`,`How thin is Earth's living layer?`),subtitle:P(`生物圈、組成層次、數量估計與群集演替`,`Biosphere, levels of organisation, estimating numbers and succession`),cover:'assets/covers/biology_ecology_1023_v1.jpg',
 assetDir:'assets/biology/ecology_ai_1023/',family:P(`生命與環境`,`Life and environment`),bookName:P(`生物圈`,`Biosphere`),tabs});
})();
