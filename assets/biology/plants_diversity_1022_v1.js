/* Plants: clues from water, seeds and fruits · teacher-requested V5 remake, 2026-10-22.
 * Four tabs, ten views (the plan is assets/biology/plants_diversity_plan_1022.md):
 *   groups: 0 vascular (how does water go up?), 1 groups (sort four plants: liverwort, sword fern, pine, orange)
 *   fern:   0 fernleaf (young frond to mature frond), 1 zoom (what are the dots on the back of a frond?)
 *   leaf:   0 evidence (five clues: veins, stem bundles, seed leaves, roots, petals)
 *   water:  0 swim (sperm of moss and fern must swim), 1 ovule (one ovule, 8 nuclei, double fertilization), 2 multi (many ovules, one tube each), 3 seed (seed coat and fruit)
 * Pictures: plants_ai_1022/ (AI illustrations made by the teacher with Gemini, not photographs).
 * Each view is drawn by its own module, plants_draw_<name>_1022_v1.js, which registers window.PlantsDraw[name];
 * the page text, steps, captions, picture labels (LAB, also window.PlantsKit.LAB) and multiple-choice checks live here.
 * Shared helpers: plants_kit_1022_v1.js. Replaces the plants_diversity entry of biodiversity_lessons_1010_v1.js (left there, unused).
 */
(()=>{'use strict';
const K=window.PlantsKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── picture labels used by the drawing modules (zh, en) ────────────────────
const LAB={
 liverwort:P(`地錢`,`Liverwort`),moss:P(`苔蘚`,`Moss`),swordFern:P(`腎蕨`,`Sword fern`),nestFern:P(`鳥巢蕨`,`Bird's nest fern`),
 pine:P(`松`,`Pine`),orange:P(`橘子`,`Orange`),
 thallus:P(`葉狀體`,`Thallus`),stalkBody:P(`孢子體（柄＋孢子囊）`,`Sporophyte (stalk + capsule)`),rhizoid:P(`假根（示意）`,`Rhizoids (schematic)`),
 root:P(`根`,`Root`),stem:P(`莖`,`Stem`),leaf:P(`葉`,`Leaf`),vascular:P(`維管束（示意）`,`Vascular tissue (schematic)`),
 water:P(`水`,`Water`),cellToCell:P(`一個細胞傳給下一個`,`Cell to cell`),pipe:P(`像水管一路送上去`,`Piped all the way up`),
 short:P(`矮（示意）`,`Short (schematic)`),tall:P(`可以長高（示意）`,`Can grow tall (schematic)`),
 gate1:P(`有維管束嗎？`,`Vascular tissue?`),gate2:P(`有種子嗎？`,`Seeds?`),gate3:P(`種子有果實包著嗎？`,`Seeds wrapped in a fruit?`),
 yes:P(`有`,`Yes`),no:P(`沒有`,`No`),
 bryophyte:P(`蘚苔植物`,`Bryophytes`),fern:P(`蕨類`,`Ferns`),gymno:P(`裸子植物`,`Gymnosperms`),angio:P(`被子植物`,`Angiosperms`),
 evidenceNote:P(`看不見維管束：證據由切片提供`,`Vascular tissue cannot be seen here: the evidence comes from sections`),
 fiddlehead:P(`捲曲的幼葉`,`Coiled young frond`),unrolling:P(`展開中`,`Unrolling`),matureFront:P(`成熟葉正面`,`Mature frond, upper side`),
 matureBack:P(`成熟葉背面（另一片葉）`,`Mature frond, underside (another frond)`),noDots:P(`沒有小點`,`No dots`),
 sori:P(`孢子囊堆`,`Sorus (group of sporangia)`),soriPl:P(`孢子囊堆`,`Sori`),linear:P(`線形排列`,`In lines`),round:P(`圓點排列`,`In round dots`),
 sporangium:P(`孢子囊`,`Sporangium`),annulus:P(`環帶（示意）`,`Ring of cells (schematic)`),spores:P(`孢子`,`Spores`),
 notSeed:P(`孢子不是種子`,`A spore is not a seed`),oneCell:P(`單一細胞`,`A single cell`),
 embryo:P(`胚`,`Embryo`),food:P(`養分`,`Stored food`),coat:P(`種皮`,`Seed coat`),peanut:P(`花生種子`,`Peanut seed`),
 zoomBox:P(`放大這裡`,`Zoom in here`),
 bodhi:P(`菩提葉`,`Bodhi leaf`),bamboo:P(`竹葉`,`Bamboo leaf`),netVein:P(`網狀脈`,`Net veins`),parVein:P(`平行脈`,`Parallel veins`),
 stemMono:P(`玉米莖橫切（示意）`,`Maize stem section (schematic)`),stemDi:P(`向日葵莖橫切（示意）`,`Sunflower stem section (schematic)`),
 scattered:P(`維管束散生`,`Bundles scattered`),ring:P(`維管束排成一圈`,`Bundles in a ring`),
 corn:P(`玉米粒`,`Corn kernel`),twoCot:P(`兩枚子葉`,`Two seed leaves`),oneCot:P(`一枚子葉`,`One seed leaf`),
 endosperm:P(`胚乳`,`Endosperm`),cotyledon:P(`子葉`,`Seed leaf`),
 taproot:P(`主根＋側根`,`Taproot + side roots`),fibrous:P(`鬚根`,`Fibrous roots`),
 petals3:P(`3 片花瓣`,`3 petals`),petals5:P(`5 片花瓣`,`5 petals`),petalsOnly:P(`只數彩色的花瓣`,`Count only the coloured petals`),
 dicot:P(`雙子葉植物`,`Dicots`),monocot:P(`單子葉植物`,`Monocots`),
 allTogether:P(`多項證據一起看`,`Look at several clues together`),
 dry:P(`乾的時候`,`When dry`),wet:P(`下雨或有露水`,`Rain or dew`),waterFilm:P(`水膜`,`Water film`),
 antheridium:P(`精子器（示意）`,`Antheridium (schematic)`),archegonium:P(`頸卵器（示意）`,`Archegonium (schematic)`),
 sperm:P(`精子`,`Sperm`),egg:P(`卵`,`Egg`),fertilize:P(`受精`,`Fertilization`),sporophyte:P(`孢子體`,`Sporophyte`),
 pollen:P(`花粉`,`Pollen`),stigma:P(`柱頭`,`Stigma`),style:P(`花柱`,`Style`),ovary:P(`子房`,`Ovary`),ovule:P(`胚珠`,`Ovule`),
 pollenTube:P(`花粉管`,`Pollen tube`),spermCell:P(`精細胞`,`Sperm cell`),fruit:P(`果實`,`Fruit`),seed:P(`種子`,`Seed`),
 scale:P(`毬果鱗片`,`Cone scale`),bareSeed:P(`種子裸露`,`Seed uncovered`),coneNotFruit:P(`毬果不是果實`,`A cone is not a fruit`),
 juice:P(`汁囊`,`Juice sacs`),peel:P(`果皮`,`Peel`),
 germ1:P(`吸水膨脹`,`Swells with water`),germ2:P(`胚根長出`,`Root emerges`),germ3:P(`莖彎鉤出土`,`Bent stem pushes up`),germ4:P(`展開真葉`,`True leaves open`),
 schematic:P(`示意`,`Schematic`),aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`)
};
K.LAB=LAB;window.PlantsLabels=LAB;

// ── groups / 0: how does water go up? ──────────────────────────────────────
const VASC_SHORT=[P(`雨後都吸水`,`Both take up water`),P(`苔：直接吸`,`Moss: direct`),P(`蕨：維管束`,`Fern: vascular tissue`),P(`比一比`,`Compare`)];
const VASC_NAMES=[P(`雨後，苔和蕨都吸到水`,`After rain, moss and fern both take up water`),P(`苔：水從身體表面進去，一個細胞傳給下一個`,`Moss: water enters through the body surface, cell to cell`),P(`蕨：根吸的水進維管束，一路送到每片葉`,`Fern: water from the roots enters vascular tissue and reaches every leaf`),P(`比一比：苔矮，蕨可以長高`,`Compare: moss stays short, fern can grow tall`)];
const VASC_TEXT=[
 P(`下過雨，地上有水。苔蘚和蕨類都需要水，但水進到身體以後，走的路不一樣。`,`After rain there is water on the ground. Mosses and ferns both need water, but once it is in the body, the two take different routes.`),
 P(`苔蘚沒有維管束。水主要從身體表面直接吸進去，再一個細胞傳給下一個細胞，傳不遠。苔蘚的假根只負責固定，不是真正的根。`,`A moss has no vascular tissue. Water enters mostly through the body surface and passes from one cell to the next, so it cannot travel far. The rhizoids only hold the moss in place; they are not true roots.`),
 P(`蕨類有維管束。根吸進去的水進入維管束，像水管一樣一路送到每一片葉。`,`A fern has vascular tissue. Water taken up by the roots enters the vascular tissue and is piped to every leaf.`),
 P(`沒有維管束，水傳不遠，所以苔蘚長得矮。有維管束，水可以送得比較高，蕨類就能長得比較高。（圖是示意，不是實際高度。）`,`Without vascular tissue water cannot travel far, so mosses stay short. With vascular tissue water can be sent higher, so ferns can grow taller. (Schematic, not real heights.)`)];

// ── groups / 1: sort four plants ───────────────────────────────────────────
const GRP_SHORT=[P(`地錢`,`Liverwort`),P(`腎蕨`,`Sword fern`),P(`松`,`Pine`),P(`橘子`,`Orange`)];
const GRP_NAMES=[P(`地錢：沒有維管束，是蘚苔植物`,`Liverwort: no vascular tissue, a bryophyte`),P(`腎蕨：有維管束、沒有種子，是蕨類`,`Sword fern: vascular tissue, no seeds, a fern`),P(`松：有種子、沒有果實，是裸子植物`,`Pine: seeds without a fruit, a gymnosperm`),P(`橘子：種子被果實包著，是被子植物`,`Orange: seeds wrapped in a fruit, an angiosperm`)];
const GRP_TEXT=[
 P(`第一關：有維管束嗎？地錢沒有。它貼著地長，用孢子繁殖，所以是蘚苔植物。維管束在圖上看不見，這個證據要靠切片才看得到。`,`Gate 1: vascular tissue? A liverwort has none. It grows flat on the ground and reproduces by spores, so it is a bryophyte. Vascular tissue cannot be seen in the picture; that evidence comes from thin sections.`),
 P(`第一關：有維管束，過關。第二關：有種子嗎？腎蕨沒有，它用孢子繁殖，所以是蕨類。`,`Gate 1: vascular tissue, passed. Gate 2: seeds? A sword fern has none and reproduces by spores, so it is a fern.`),
 P(`有維管束，也有種子。第三關：種子有果實包著嗎？松的種子露在毬果的鱗片上，沒有果實，所以是裸子植物。毬果不是果實。`,`It has vascular tissue and seeds. Gate 3: are the seeds wrapped in a fruit? The seeds of a pine sit uncovered on the scales of the cone. There is no fruit, so it is a gymnosperm. A cone is not a fruit.`),
 P(`有維管束，有種子，種子還被果實包著，所以是被子植物。橘子的果肉和汁囊是果實的一部分，種子在裡面。`,`It has vascular tissue and seeds, and the seeds are wrapped in a fruit, so it is an angiosperm. The flesh and juice sacs of an orange are part of the fruit, with the seeds inside.`)];
const GRP_ANS=[0,1,2,3];
const GUESS_NAMES=[P(`蘚苔植物`,`Bryophyte`),P(`蕨類`,`Fern`),P(`裸子植物`,`Gymnosperm`),P(`被子植物`,`Angiosperm`)];
const GRP_HINT=[P(`想想第一關：有維管束嗎？`,`Think of Gate 1: vascular tissue?`),P(`有維管束，再問：有種子嗎？`,`It has vascular tissue; next ask: seeds?`),P(`有種子，再問：種子有果實包著嗎？`,`It has seeds; next ask: wrapped in a fruit?`),P(`種子被果實包著，要想想子房。`,`The seeds are wrapped in a fruit; think of the ovary.`)];

// ── fern / 0: young frond to mature frond ──────────────────────────────────
const FL_SHORT=[P(`捲曲的幼葉`,`Coiled frond`),P(`慢慢展開`,`Unrolling`),P(`成熟葉正面`,`Upper side`),P(`成熟葉背面`,`Underside`),P(`兩種排列`,`Two patterns`)];
const FL_NAMES=[P(`捲曲的幼葉`,`A coiled young frond`),P(`幼葉慢慢展開`,`The frond unrolls`),P(`成熟葉的正面：光滑，沒有小點`,`Mature frond, upper side: smooth, no dots`),P(`成熟葉的背面：一排排小點`,`Mature frond, underside: rows of dots`),P(`小點有兩種排列：線形與圓點`,`Two patterns of dots: lines and round dots`)];
const FL_TEXT=[
 P(`蕨類的幼葉是捲起來的，像一個小拳頭。這個捲曲的樣子，是認出蕨類的線索。這時候葉背還沒有小點。`,`The young frond of a fern is rolled up like a little fist. This coiled shape is a clue for recognizing ferns. At this stage there are no dots on the underside.`),
 P(`幼葉從頂端慢慢展開，小羽片一片一片打開。（三張圖是不同的葉，不是同一片葉的連續照片。）`,`The young frond slowly unrolls and the leaflets open one by one. (The three pictures show different fronds, not one frond photographed over time.)`),
 P(`成熟葉的正面很光滑，看不到小點。如果只看正面，會以為蕨類沒有任何繁殖的構造。`,`The upper side of a mature frond is smooth and shows no dots. Looking only at this side, you might think a fern has nothing for reproduction.`),
 P(`把葉子翻到背面，會看到一排排咖啡色的小點。它們叫孢子囊堆，是許多孢子囊聚在一起。這是另一片成熟葉的背面。重點：幼葉還沒長出孢子囊堆，不代表它不是蕨。`,`Turn the frond over and you see rows of brown dots. They are called sori, groups of sporangia. This is the underside of another mature frond. Key idea: a young frond with no sori yet is still a fern.`),
 P(`孢子囊堆有不同的排列：左邊排成一條條線形，右邊是一顆顆圓點。（兩片葉不同，這裡不指定是哪一種蕨。）`,`Sori can be arranged in different ways: in lines on the left, in round dots on the right. (The two leaves differ; we do not name the fern species here.)`)];

// ── fern / 1: zoom into a dot ──────────────────────────────────────────────
const ZM_SHORT=[P(`葉背`,`Underside`),P(`孢子囊堆`,`Sorus`),P(`孢子囊`,`Sporangium`),P(`孢子`,`Spores`),P(`不是種子`,`Not a seed`)];
const ZM_NAMES=[P(`葉背的小點在哪裡`,`Where are the dots on the underside`),P(`拉近：小點是孢子囊堆`,`Zoom in: a dot is a sorus`),P(`再拉近：孢子囊打開了`,`Closer: a sporangium opens`),P(`孢子散出來`,`Spores are released`),P(`孢子不是種子`,`A spore is not a seed`)];
const ZM_TEXT=[
 P(`先回到葉背。黃色的框，框出要放大的地方：一個小點。`,`Back to the underside. The yellow box marks the place to enlarge: one dot.`),
 P(`放大以後，小點是許多孢子囊聚成的孢子囊堆。它不是蟲卵，也不是種子。`,`Enlarged, a dot is a sorus, many sporangia gathered together. It is not a clutch of insect eggs and not a seed.`),
 P(`再放大，每個孢子囊像一顆小球。成熟時它會裂開，把孢子彈出來。（AI 插圖，不是真實顯微照片。）`,`Enlarged again, each sporangium looks like a tiny ball. When ripe it splits open and flings out the spores. (An AI illustration, not a real micrograph.)`),
 P(`孢子是很小、褐色的小粒，隨風散開。孢子是單一細胞。`,`Spores are tiny brown specks that are carried off by the wind. A spore is a single cell.`),
 P(`孢子不是種子。孢子只有一個細胞；種子裡有胚、養分和種皮。右邊的花生種子可以對照：兩枚子葉裡存著養分，中間有小小的胚。`,`A spore is not a seed. A spore is one cell; a seed holds an embryo, stored food and a seed coat. Compare the peanut seed on the right: the two seed leaves store food, with a tiny embryo between them.`)];

// ── leaf / 0: five clues ───────────────────────────────────────────────────
const EV_SHORT=[P(`葉脈`,`Veins`),P(`莖`,`Stem`),P(`子葉`,`Seed leaves`),P(`根`,`Roots`),P(`花瓣`,`Petals`),P(`一起看`,`Together`)];
const EV_NAMES=[P(`證據一：葉脈，網狀還是平行`,`Clue 1: veins, net or parallel`),P(`證據二：莖的維管束，環狀還是散生`,`Clue 2: stem bundles, ring or scattered`),P(`證據三：種子的子葉，兩枚還是一枚`,`Clue 3: seed leaves, two or one`),P(`證據四：根，主根還是鬚根`,`Clue 4: roots, taproot or fibrous`),P(`證據五：花瓣，五片還是三片`,`Clue 5: petals, five or three`),P(`多項證據一起看，還有例外`,`Look at all the clues, and expect exceptions`)];
const EV_TEXT=[
 P(`菩提葉有一條粗粗的中肋，旁邊分出細脈，連成網，叫網狀脈，是雙子葉植物常見的樣子。竹葉的細脈沿著葉子平行排列，叫平行脈，是單子葉植物常見的樣子。`,`A bodhi leaf has a thick midrib with fine veins branching off and joining into a net: net veins, common in dicots. The veins of a bamboo leaf run side by side along the leaf: parallel veins, common in monocots.`),
 P(`把莖橫切，雙子葉植物（向日葵）的維管束常排成一圈；單子葉植物（玉米）的維管束常散在整個切面。（圖是 AI 畫的、顏色是人工染色風格，只用來看排列，不是真實切片照片。）`,`Cut a stem across: in a dicot (sunflower) the vascular bundles are often in a ring; in a monocot (maize) they are often scattered across the section. (An AI drawing in an artificial staining style, used only to see the arrangement; not a real section photo.)`),
 P(`花生種子分成兩半，是兩枚子葉，養分存在子葉裡，中間有小小的胚。玉米粒只有一枚子葉，養分大多在胚乳裡。`,`A peanut seed splits into two halves, its two seed leaves, which store the food, with a tiny embryo between them. A corn kernel has one seed leaf and keeps most of its food in the endosperm.`),
 P(`雙子葉幼苗常有一條粗的主根，旁邊長出側根。單子葉幼苗常是一大叢粗細差不多的鬚根。`,`A dicot seedling often has one thick taproot with side roots growing from it. A monocot seedling often has a tuft of fine roots of similar thickness, called fibrous roots.`),
 P(`數數看：五片花瓣的花，常見於雙子葉植物；三片花瓣的花，常見於單子葉植物。要只數彩色的花瓣，不數小小的綠色萼片。（圖不指定物種。）`,`Count them: a flower with five petals is common in dicots; a flower with three petals is common in monocots. Count only the coloured petals, not the small green sepals. (The flowers are not named.)`),
 P(`這些都是「常見的樣子」，不是鐵律。只靠一項證據可能判斷錯，要多項一起看。另外，雙子葉不等於木本，單子葉也不等於草本，那是另一種分法。`,`These are common patterns, not strict rules. One clue alone can mislead you, so look at several together. Also, dicot does not mean woody and monocot does not mean herbaceous; that is a different way of sorting plants.`)];

// ── water / 0: moss and fern sperm must swim ───────────────────────────────
const SW_SHORT=[P(`乾的時候`,`Dry`),P(`水膜`,`Water film`),P(`精子游泳`,`Sperm swim`),P(`受精`,`Fertilization`),P(`孢子體`,`Sporophyte`)];
const SW_NAMES=[P(`乾的時候：精子出不來`,`When dry: the sperm cannot get out`),P(`下雨或露水：形成水膜`,`Rain or dew: a water film forms`),P(`精子游過水膜`,`Sperm swim through the water film`),P(`找到卵，受精`,`The sperm reaches the egg: fertilization`),P(`長出孢子體，又產生孢子`,`A sporophyte grows and makes spores again`)];
const SW_TEXT=[
 P(`苔和蕨的精子有尾巴，要靠游泳才能到卵那裡。乾的時候，沒有水，精子出不來，也游不動。（精子器、頸卵器、精子和卵是程式畫的示意。）`,`The sperm of mosses and ferns have tails and must swim to reach the egg. When it is dry there is no water, so the sperm cannot get out or swim. (The antheridium, archegonium, sperm and egg are schematic, drawn in code.)`),
 P(`下雨或有露水時，地面和植物表面形成一層水膜。`,`When it rains or dew forms, a thin film of water covers the ground and the plant.`),
 P(`精子靠著水膜，游向有卵的頸卵器。沒有水，這一步就走不下去。`,`Using the water film, the sperm swim towards the archegonium that holds the egg. Without water this step cannot go on.`),
 P(`精子找到卵，兩者結合，這叫受精。`,`A sperm reaches the egg and the two join. This is fertilization.`),
 P(`受精卵長成孢子體，孢子體再產生孢子，孢子散開，又開始下一輪。苔蘚的孢子體是細柄加孢子囊；蕨類的孢子體就是我們平常看到的蕨。`,`The fertilized egg grows into a sporophyte, which makes spores; the spores scatter and a new round begins. In a moss the sporophyte is a thin stalk with a capsule; in a fern the sporophyte is the fern we usually see.`)];

// ── water / 1: one ovule, the eight nuclei of the embryo sac, double fertilization ─────────
const OV_SHORT=[P(`胚珠構造`,`Ovule`),P(`八個核`,`Eight nuclei`),P(`管到珠孔`,`Tube at micropyle`),P(`兩個精細胞`,`Two sperm cells`),P(`雙重受精`,`Double fertilization`),P(`變成種子`,`Becomes a seed`)];
const OV_NAMES=[P(`一顆胚珠的構造：珠柄、珠被、珠孔、胚囊`,`Inside one ovule: stalk, integuments, micropyle, embryo sac`),P(`胚囊裡有 8 個核，不是 8 個胚珠`,`The embryo sac holds 8 nuclei, not 8 ovules`),P(`花粉管沿著珠柄，找到珠孔`,`The pollen tube follows the stalk to the micropyle`),P(`花粉管破裂，放出 2 個精細胞`,`The tube bursts and releases 2 sperm cells`),P(`雙重受精：一個結合卵，一個結合兩個極核`,`Double fertilization: one with the egg, one with the two polar nuclei`),P(`受精卵變成胚，胚珠變成種子`,`The zygote becomes the embryo and the ovule becomes a seed`)];
const OV_TEXT=[
 P(`這是一顆胚珠，不是整個子房。胚珠用珠柄接在子房壁的胎座上，外面包著兩層珠被，下方有一個小開口叫珠孔，珠心的中央有胚囊。倒生胚珠的珠孔朝向胎座，所以花粉管是從「底下」進來的。（胚珠圖是 AI 插圖；胚囊裡的細胞是程式畫的示意。）`,`This is one ovule, not the whole ovary. A stalk joins it to the placenta on the ovary wall, two integuments wrap it, a small opening called the micropyle lies at the bottom, and the embryo sac sits in the middle of the nucellus. In an anatropous ovule the micropyle faces the placenta, so the pollen tube enters from "below". (The ovule picture is an AI illustration; the cells in the embryo sac are schematic, drawn in code.)`),
 P(`胚囊裡有 8 個核，分在 7 個細胞裡。靠珠孔那端有 3 個細胞：1 個卵和 2 個助細胞；中間有 1 個大的中央細胞，裡面有 2 個極核；另一端有 3 個反足細胞。8 個核＝卵 1＋助細胞 2＋極核 2＋反足 3，每個核都只有 n 套染色體。`,`The embryo sac has 8 nuclei in 7 cells. Near the micropyle are 3 cells: 1 egg and 2 synergids. In the middle is one large central cell holding 2 polar nuclei. At the other end are 3 antipodal cells. So 8 nuclei = egg 1 + synergids 2 + polar nuclei 2 + antipodals 3, and every nucleus has only n chromosomes.`),
 P(`花粉管離開花柱，沿著胎座和珠柄的表面長，一直長到珠孔。助細胞會放出化學訊號，把花粉管引過來。（路線是示意。）`,`The pollen tube leaves the style, grows along the surface of the placenta and the stalk, and reaches the micropyle. The synergids give off chemical signals that guide the tube in. (The route is schematic.)`),
 P(`花粉管進入一個助細胞，管尖破裂，放出 2 個精細胞。精細胞沒有尾巴，是被花粉管送到這裡的，不必自己游泳。`,`The tube enters one synergid and its tip bursts, releasing 2 sperm cells. They have no tails; the pollen tube delivered them here, so they do not have to swim.`),
 P(`第一個精細胞（n）和卵（n）結合，成為受精卵（2n），會長成胚。第二個精細胞（n）和中央細胞的 2 個極核（n＋n）結合，成為 3n 的細胞，會長成胚乳。一條花粉管，兩次結合，這叫雙重受精，是被子植物的特色。`,`The first sperm cell (n) joins the egg (n) and becomes the zygote (2n), which grows into the embryo. The second sperm cell (n) joins the 2 polar nuclei (n + n) of the central cell and becomes a 3n cell, which grows into the endosperm. One pollen tube, two unions: this is double fertilization, a feature of angiosperms.`),
 P(`受精卵分裂成胚；3n 的細胞分裂成胚乳，儲存養分；珠被變成種皮；整個胚珠變成種子。助細胞和反足細胞不再需要，會消失。有些種子（像玉米）的胚乳留著，有些（像花生）胚乳的養分被子葉吸走。`,`The zygote divides into the embryo; the 3n cell divides into the endosperm, which stores food; the integuments become the seed coat; and the whole ovule becomes a seed. The synergids and antipodals are no longer needed and disappear. In some seeds (such as corn) the endosperm stays, while in others (such as peanut) its food is taken up by the seed leaves.`)];

// ── water / 2: an ovary with many ovules, one pollen tube for each ovule ───────────────────
const MU_SHORT=[P(`5 顆胚珠`,`Five ovules`),P(`花粉落下`,`Pollen lands`),P(`一管一胚珠`,`One tube each`),P(`算一算`,`Count`),P(`種子數`,`Seeds`)];
const MU_NAMES=[P(`多胚珠的子房：5 顆胚珠接在胎座上`,`An ovary with many ovules: 5 ovules on the placenta`),P(`花粉落在柱頭，各自長出花粉管`,`Pollen lands on the stigma and each grain grows a tube`),P(`一條花粉管，找一顆胚珠`,`One pollen tube finds one ovule`),P(`算一算：5 顆胚珠要 5 粒花粉、10 個精細胞`,`Count: 5 ovules need 5 pollen grains and 10 sperm cells`),P(`受精的胚珠變成種子，子房變成果實`,`Fertilized ovules become seeds and the ovary becomes a fruit`)];
const MU_TEXT=[
 P(`很多植物（像豌豆）的子房裡有好幾顆胚珠，排在胎座上。這個子房有 5 顆胚珠，最多可以長出 5 顆種子。（子房圖是 AI 插圖；花粉與花粉管是程式畫的示意。）`,`Many plants (such as pea) have several ovules in the ovary, lined up on the placenta. This ovary has 5 ovules, so it can make at most 5 seeds. (The ovary picture is an AI illustration; the pollen and pollen tubes are schematic, drawn in code.)`),
 P(`花粉被風或昆蟲帶到柱頭上，一粒花粉長出一條花粉管。裸子植物（像松）的花粉直接落在胚珠旁，也是長出花粉管。這裡畫 5 粒花粉，各長一條。`,`Wind or insects carry pollen to the stigma, and each pollen grain grows one pollen tube. In gymnosperms such as pine, pollen lands right next to the ovule and also grows a pollen tube. Five pollen grains are drawn here, each growing one tube.`),
 P(`花粉管穿過花柱，再沿著胎座分頭走，每一條管子各自找到一顆胚珠的珠孔。這條管子送來的 2 個精細胞，就負責這顆胚珠的雙重受精。（路線是示意。）`,`The pollen tubes grow through the style and then split up along the placenta; each tube finds the micropyle of one ovule. The 2 sperm cells this tube delivers carry out the double fertilization of that ovule. (The routes are schematic.)`),
 P(`每顆胚珠都要雙重受精，所以 5 顆胚珠＝5 粒花粉、5 條花粉管、10 個精細胞（每條管 2 個），共 10 次結合：5 個卵加 5 個中央細胞。要讓 n 顆胚珠都受精，至少要 n 粒花粉落在柱頭上。`,`Every ovule needs double fertilization, so 5 ovules = 5 pollen grains, 5 pollen tubes and 10 sperm cells (2 per tube), making 10 unions: 5 eggs plus 5 central cells. For n ovules all to be fertilized, at least n pollen grains must land on the stigma.`),
 P(`受精的胚珠變成種子，子房變成果實。5 顆都受精，就結 5 顆種子；沒有花粉管到達的胚珠，不會變成種子。豌豆莢裡有 6 顆豆，表示那個子房有 6 顆胚珠受精。如果子房只有 1 顆胚珠（像稻），就只結 1 顆種子。（豌豆莢是 AI 插圖。）`,`Fertilized ovules become seeds and the ovary becomes a fruit. If all 5 are fertilized, 5 seeds form; an ovule that no pollen tube reaches does not become a seed. A pea pod with 6 peas means that ovary had 6 ovules fertilized. If an ovary has only 1 ovule (as in rice), it makes only 1 seed. (The pea pod is an AI illustration.)`)];

// ── water / 2: seed coat and fruit ─────────────────────────────────────────
const SD_SHORT=[P(`種子裡有什麼`,`Inside a seed`),P(`被子：在果實裡`,`Angiosperm: in a fruit`),P(`裸子：在鱗片上`,`Gymnosperm: on a scale`),P(`萌發`,`Germination`)];
const SD_NAMES=[P(`種子裡有什麼：種皮、子葉、胚`,`Inside a seed: seed coat, seed leaves, embryo`),P(`被子植物：種子在果實裡`,`Angiosperm: the seed is inside a fruit`),P(`裸子植物：種子露在毬果鱗片上`,`Gymnosperm: the seed lies uncovered on a cone scale`),P(`萌發：吸水、胚根、莖、葉`,`Germination: water, root, stem, leaves`)];
const SD_TEXT=[
 P(`種子外面有種皮保護，裡面有胚和養分。花生的兩枚子葉存著養分，中間的小胚會長成新的植物。`,`A seed is protected by a seed coat and holds an embryo and stored food. The two seed leaves of a peanut store food, and the tiny embryo between them grows into a new plant.`),
 P(`橘子切開，種子被果肉和果皮包在裡面。果實由子房發育而來，被子植物的種子有果實包著。`,`Cut an orange open and the seeds are wrapped in flesh and peel. A fruit develops from the ovary, so the seeds of an angiosperm are enclosed in a fruit.`),
 P(`松的毬果鱗片張開，帶翅的種子就露在鱗片上，沒有果實包著。毬果不是果實。（圖裡有 2 個成熟毬果和 1 個青毬果。）`,`When the scales of a pine cone open, the winged seeds lie uncovered on them, with no fruit around them. A cone is not a fruit. (The picture shows 2 mature cones and 1 young green cone.)`),
 P(`種子吸水膨脹，胚根先長出來往下長，接著莖彎成鉤子把子葉頂出土，最後展開真葉，開始行光合作用。（四張圖的土塊形狀不同，不是同一粒種子的連續照片。）`,`The seed swells with water, the root emerges first and grows down, then the stem bends into a hook and pushes the seed leaves out of the soil, and finally the true leaves open and begin photosynthesis. (The soil blocks differ in shape, so these are not photos of one seed.)`)];

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;K.text(c,short[k],480,300,28,C.yellow,'center');K.text(c,P(`（${name} 施工中）`,`(${name} under construction)`),480,340,22,C.muted,'center');};
const dr=(name,n,short)=>(c,s,t)=>((window.PlantsDraw&&window.PlantsDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;};
// groups tab: the student may guess the class of the plant shown (s.guess = 0..3, -1 = no guess); a new view or step clears it
const groupsAct=(s,k,v)=>{if(k==='guess'){if(s.phase<0){s.phase=pick(s);s.start=s.elapsed;}s.guess=v;return;}viewAct(s,k,v);if(k==='view'||k==='phase')s.guess=-1;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const GROUP_TABS=[P(`水怎麼上去？`,`How does water go up?`),P(`四類植物分一分`,`Sort four plants`)];
const FERN_TABS=[P(`幼葉到成熟葉`,`Young to mature frond`),P(`拉近看，小點是什麼`,`Zoom in on a dot`)];
const WATER_TABS=[P(`苔與蕨：精子游過水`,`Moss and fern: sperm swim`),P(`單胚珠：胚囊的 8 個核`,`One ovule: 8 nuclei`),P(`多胚珠：一管一胚珠`,`Many ovules: one tube each`),P(`種皮與果實`,`Seed coat and fruit`)];
const GUESS_CTL=()=>choice(P(`我猜這是`,`My guess`),'guess',[[-1,P(`先不猜`,`No guess`)],...GUESS_NAMES.map((n,i)=>[i,n])]);

const tabs=[
{id:'groups',title:P(`不開花，也可以是植物`,`Not flowering, still a plant`),sub:P(`植物的四類比較`,`Four groups of plants`),
 hook:P(`霧濛濛的森林裡，岩石上蓋著一層綠綠的苔蘚；旁邊有蕨，有高高的松樹，還有一叢開著小白花的灌木。這些都是植物嗎？苔蘚不開花，蕨不開花，松樹也不開花，可是牠們都是植物。那開花不開花，還能不能當作分類的標準？今天我們換三個問題來分：有沒有維管束？有沒有種子？種子有沒有果實包著？`,`In a misty forest, a rock is covered with green moss; beside it are ferns, a tall pine, and a shrub with small white flowers. Are they all plants? Moss does not flower, ferns do not flower, and pines do not flower, yet they are all plants. So can flowering still be the way to sort them? Today we use three other questions: is there vascular tissue? Are there seeds? Are the seeds wrapped in a fruit?`),
 body:P(`先看「水怎麼上去？」：苔蘚和蕨類的水走的路有什麼不同；再看「四類植物分一分」：地錢、腎蕨、松、橘子，一個一個過三道關。`,`First "How does water go up?": how the routes of water differ in moss and fern. Then "Sort four plants": a liverwort, a sword fern, a pine and an orange, each through three gates.`),
 reading:P(`植物的四類：蘚苔植物沒有維管束、沒有種子，用孢子繁殖，有假根（不是真根）。蕨類有維管束（有根、莖、葉），沒有種子，用孢子繁殖。裸子植物有種子，沒有果實，種子裸露在毬果的鱗片上。被子植物有花，種子包在果實裡，果實由子房發育而來。\n\n維管束：負責運送水和養分的管道。沒有維管束，水只能一個細胞傳給下一個細胞，傳不遠，所以蘚苔植物都長得比較矮。\n\n孢子和種子不一樣：孢子是單一細胞；種子裡有胚、養分和種皮。\n\n注意：圖是 AI 畫的教學插圖，大小不代表真實大小；維管束在圖上看不見，要靠切片或書上的說明當證據。`,`The four groups: bryophytes have no vascular tissue and no seeds, reproduce by spores, and have rhizoids (not true roots). Ferns have vascular tissue (roots, stems and leaves) and no seeds, and reproduce by spores. Gymnosperms have seeds but no fruit; the seeds lie uncovered on the scales of the cone. Angiosperms have flowers, and their seeds are inside a fruit that develops from the ovary.\n\nVascular tissue: the tubes that carry water and nutrients. Without it water can only pass from cell to cell and cannot travel far, so bryophytes stay short.\n\nA spore is not a seed: a spore is a single cell, while a seed holds an embryo, stored food and a seed coat.\n\nNote: the pictures are AI teaching illustrations and sizes do not show real sizes; vascular tissue cannot be seen in them, so that evidence comes from thin sections.`),
 closure:P(`分四類，不看開不開花，看三道關：有維管束嗎？有種子嗎？種子有果實包著嗎？蘚苔沒有維管束，蕨有維管束沒種子，松有種子沒果實，橘子的種子在果實裡。`,`Sort into four groups with three gates, not by flowers: vascular tissue? seeds? seeds wrapped in a fruit? Bryophytes lack vascular tissue; ferns have it but no seeds; pines have seeds but no fruit; an orange has its seeds inside a fruit.`),
 quiz:[
  {q:P(`苔蘚為什麼長得比較矮？`,`Why do mosses stay short?`),options:[P(`沒有維管束，水只能一個細胞傳給下一個，傳不遠`,`No vascular tissue, so water passes cell to cell and cannot travel far`),P(`因為苔蘚不需要水`,`Mosses do not need water`),P(`因為假根太深，長不上來`,`The rhizoids are too deep to grow up`),P(`因為苔蘚太重，撐不起來`,`Mosses are too heavy to stand up`)],answer:0,why:P(`沒有維管束這條水管，水只能靠細胞一個傳一個；假根只負責固定，苔蘚也需要水。`,`Without vascular tissue as a water pipe, water can only pass from cell to cell. The rhizoids only hold the moss in place, and mosses do need water.`),hint:P(`看「水怎麼上去？」第 2、4 步。`,`See steps 2 and 4 of "How does water go up?".`)},
  {q:P(`松的毬果是果實嗎？`,`Is the cone of a pine a fruit?`),options:[P(`是，因為裡面有種子`,`Yes, because it holds seeds`),P(`是，因為它又硬又大`,`Yes, because it is hard and big`),P(`不是，種子裸露在鱗片上，沒有果實包著`,`No, the seeds lie uncovered on the scales with no fruit around them`),P(`不是，因為松沒有種子`,`No, because pines have no seeds`)],answer:2,why:P(`果實由子房發育而來，把種子包起來。松的種子露在鱗片上，所以毬果不是果實。`,`A fruit develops from the ovary and wraps the seeds. The seeds of a pine lie uncovered on the scales, so a cone is not a fruit.`),hint:P(`看「四類植物分一分」第 3 步。`,`See step 3 of "Sort four plants".`)},
  {q:P(`蕨和松都不開花，哪一項最能把牠們分開？`,`Ferns and pines both do not flower. Which clue separates them best?`),options:[P(`有沒有維管束`,`Having vascular tissue`),P(`有沒有種子`,`Having seeds`),P(`有沒有根`,`Having roots`),P(`有沒有綠色的葉子`,`Having green leaves`)],answer:1,why:P(`兩者都有維管束、根和綠葉；蕨用孢子繁殖，沒有種子，松有種子。`,`Both have vascular tissue, roots and green leaves. A fern reproduces by spores and has no seeds; a pine has seeds.`),hint:P(`第二關問什麼？`,`What does Gate 2 ask?`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0,guess:-1}),
 controls:s=>s.view===1?[choice(P(`觀察`,`View`),'view',GROUP_TABS.map((n,i)=>[i,n])),steps(GRP_SHORT),GUESS_CTL()]:[choice(P(`觀察`,`View`),'view',GROUP_TABS.map((n,i)=>[i,n])),steps(VASC_SHORT)],
 act:groupsAct,
 explain:s=>{const k=pick(s);if(s.view!==1)return{title:VASC_NAMES[k],text:VASC_TEXT[k]};
  const g=s.guess;let text=GRP_TEXT[k];
  if(g>=0)text=g===GRP_ANS[k]?P(`猜對了：${GUESS_NAMES[g][0]}。${GRP_TEXT[k][0]}`,`Correct: ${GUESS_NAMES[g][1]}. ${GRP_TEXT[k][1]}`):P(`你猜的是${GUESS_NAMES[g][0]}，再想一想。${GRP_HINT[k][0]}`,`You guessed ${GUESS_NAMES[g][1]}; think again. ${GRP_HINT[k][1]}`);
  return{title:(g>=0&&g!==GRP_ANS[k])?GRP_SHORT[k]:GRP_NAMES[k],text};},
 draw:(c,s,t)=>s.view===1?dr('groups',4,GRP_SHORT)(c,s,t):dr('vascular',4,VASC_SHORT)(c,s,t)},
{id:'fern',title:P(`葉背的小點是種子？`,`Are the dots under the leaf seeds?`),sub:P(`蕨類的孢子`,`Spores of ferns`),
 hook:P(`翻開一片蕨葉的背面，會看到一排排咖啡色的小點，像小蟲的卵，又像一粒粒小種子。可是蕨不開花，也不結果，哪來的種子？如果牠們不是種子，那是什麼？再看看另一個線索：蕨類的幼葉捲得像拳頭，沒有這些小點，它還是蕨嗎？今天，我們把小點拉近，看看裡面藏著什麼。`,`Turn over a fern frond and you see rows of brown dots, like insect eggs, or like tiny seeds. But a fern does not flower or make fruit, so where would seeds come from? If they are not seeds, what are they? One more clue: the young fronds of a fern are coiled like a fist and have no dots yet. Is it still a fern? Today we zoom in on a dot to see what is inside.`),
 body:P(`先看「幼葉到成熟葉」：捲曲的幼葉怎麼展開、葉背的小點長什麼樣子；再看「拉近看，小點是什麼」：從葉背一路放大到孢子，再和種子比一比。`,`First "Young to mature frond": how a coiled frond unrolls and what the dots on the underside look like. Then "Zoom in on a dot": enlarging from the underside down to the spores, then comparing them with a seed.`),
 reading:P(`蕨類的繁殖：蕨類用孢子繁殖。葉背的小點叫孢子囊堆，是許多孢子囊聚在一起；孢子囊成熟後裂開，把孢子散出去。\n\n幼葉：蕨類的幼葉是捲曲的，慢慢展開。幼葉還沒有長出孢子囊堆，不代表牠不是蕨。\n\n兩種排列：孢子囊堆有的排成線形，有的排成圓點，不同的蕨不太一樣；這一課的兩張圖不指定是哪一種蕨。\n\n孢子和種子：孢子是單一細胞，很小；種子裡有胚、養分和種皮，構造複雜得多。蕨類沒有種子。\n\n注意：孢子囊與孢子是 AI 畫的教學示意，不是真實顯微照片，大小也不代表真實大小。`,`Reproduction of ferns: ferns reproduce by spores. The dots on the underside are called sori, groups of sporangia; when ripe, the sporangia split open and scatter the spores.\n\nYoung fronds: the young frond of a fern is coiled and slowly unrolls. A young frond with no sori yet is still a fern.\n\nTwo patterns: sori may be in lines or in round dots, depending on the fern; the two pictures here do not name the species.\n\nSpores and seeds: a spore is a single, very small cell; a seed holds an embryo, stored food and a seed coat and is far more complex. Ferns have no seeds.\n\nNote: the sporangia and spores are AI teaching sketches, not real micrographs, and their sizes are not real sizes.`),
 closure:P(`葉背的小點是孢子囊堆，裡面的孢子是單一細胞，不是種子。幼葉還沒長出小點，不代表不是蕨。蕨類用孢子繁殖，沒有種子。`,`The dots under the leaf are sori, and the spores in them are single cells, not seeds. A young frond with no dots yet is still a fern. Ferns reproduce by spores and have no seeds.`),
 quiz:[
  {q:P(`蕨葉背面一排排咖啡色的小點是什麼？`,`What are the rows of brown dots on the underside of a fern frond?`),options:[P(`蟲卵`,`Insect eggs`),P(`種子`,`Seeds`),P(`花`,`Flowers`),P(`孢子囊堆，裡面有孢子囊`,`Sori, holding sporangia`)],answer:3,why:P(`小點是許多孢子囊聚成的孢子囊堆；蕨類沒有花，也沒有種子。`,`The dots are sori, groups of sporangia. Ferns have no flowers and no seeds.`),hint:P(`看「拉近看，小點是什麼」第 2 步。`,`See step 2 of "Zoom in on a dot".`)},
  {q:P(`一片捲曲的幼葉，葉背還沒有小點，下列哪一句最合理？`,`A coiled young frond has no dots on its underside yet. Which statement is most reasonable?`),options:[P(`沒有小點，所以不是蕨類`,`No dots, so it is not a fern`),P(`幼葉還沒長出孢子囊堆，不代表它不是蕨類`,`A young frond has no sori yet, which does not mean it is not a fern`),P(`沒有小點，表示它之後會開花`,`No dots means it will flower later`),P(`捲曲的葉子一定是別的植物`,`A coiled leaf must belong to another plant`)],answer:1,why:P(`孢子囊堆要等葉子長大才出現；捲曲的幼葉本身就是蕨類的線索。`,`Sori appear only when the frond has grown; the coiled young frond is itself a clue for ferns.`),hint:P(`看「幼葉到成熟葉」第 1、4 步。`,`See steps 1 and 4 of "Young to mature frond".`)},
  {q:P(`孢子和種子有什麼不同？`,`How do a spore and a seed differ?`),options:[P(`孢子是比較小的種子`,`A spore is a smaller seed`),P(`孢子是單一細胞；種子有胚、養分和種皮`,`A spore is one cell; a seed has an embryo, stored food and a seed coat`),P(`兩者都有胚和種皮`,`Both have an embryo and a seed coat`),P(`種子是單一細胞，孢子有很多細胞`,`A seed is one cell and a spore has many cells`)],answer:1,why:P(`孢子只有一個細胞；種子構造複雜，有胚、養分和種皮。`,`A spore has just one cell; a seed is complex, with an embryo, stored food and a seed coat.`),hint:P(`看「拉近看，小點是什麼」第 5 步。`,`See step 5 of "Zoom in on a dot".`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P(`觀察`,`View`),'view',FERN_TABS.map((n,i)=>[i,n])),steps(s.view===1?ZM_SHORT:FL_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:ZM_NAMES[k],text:ZM_TEXT[k]}:{title:FL_NAMES[k],text:FL_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('zoom',5,ZM_SHORT)(c,s,t):dr('fernleaf',5,FL_SHORT)(c,s,t)},
{id:'leaf',title:P(`一片葉，夠判斷嗎？`,`Is one leaf enough to decide?`),sub:P(`單子葉與雙子葉`,`Monocots and dicots`),
 hook:P(`散步時，你撿到一片葉子，只有這一片。你能說它屬於單子葉植物，還是雙子葉植物嗎？葉脈看起來是網狀的，會不會只是這片葉子特別？到底要看哪些地方，才能比較有把握？今天，我們一起收集五種證據：葉脈、莖、子葉、根和花瓣，再看看為什麼不能只靠其中一項。`,`On a walk you pick up a leaf, just one. Can you say whether it belongs to a monocot or a dicot? The veins look like a net, but what if this leaf is just unusual? Where else should you look to be more sure? Today we collect five clues: veins, stem, seed leaves, roots and petals, and see why one clue is never enough.`),
 body:P(`「五種證據」一步一步看：葉脈、莖的維管束、子葉、根、花瓣，最後一步把證據合起來，也看看有哪些例外。`,`"Five clues" goes step by step: veins, stem bundles, seed leaves, roots and petals, and the last step puts the clues together and notes the exceptions.`),
 reading:P(`被子植物分成單子葉植物和雙子葉植物，常見的差別有五項：\n葉脈：雙子葉常是網狀脈，單子葉常是平行脈。\n莖的維管束：雙子葉常排成一圈，單子葉常散生。\n子葉：雙子葉的種子有兩枚子葉，單子葉有一枚。養分存在哪裡也不同：花生存在子葉，玉米大多存在胚乳。\n根：雙子葉常有主根和側根，單子葉常是鬚根。\n花瓣：雙子葉常見 4 或 5 片，單子葉常見 3 片。\n\n這些是「典型」的樣子，有例外，所以要多項證據一起看。雙子葉不等於木本，單子葉不等於草本。\n\n注意：莖橫切圖是 AI 畫的，顏色是人工染色風格，只用來看維管束的排列；花的圖不指定物種。`,`Angiosperms split into monocots and dicots, and five common differences are:\nVeins: dicots often have net veins, monocots often have parallel veins.\nStem bundles: in dicots often a ring, in monocots often scattered.\nSeed leaves: a dicot seed has two, a monocot seed has one. Where the food is stored also differs: in the seed leaves of a peanut, mostly in the endosperm of corn.\nRoots: dicots often have a taproot with side roots, monocots often have fibrous roots.\nPetals: dicots often have 4 or 5, monocots often have 3.\n\nThese are typical patterns with exceptions, so use several clues together. Dicot does not mean woody, and monocot does not mean herbaceous.\n\nNote: the stem sections are AI drawings in an artificial staining style, used only to see how the bundles are arranged; the flowers are not named.`),
 closure:P(`單子葉和雙子葉靠多項證據判斷：葉脈、莖的維管束、子葉、根和花瓣。每一項都是「常見」，不是鐵律；一片葉不夠，要多項一起看。`,`Monocots and dicots are told apart by several clues: veins, stem bundles, seed leaves, roots and petals. Each clue is "common", not a rule; one leaf is not enough, so look at several clues together.`),
 quiz:[
  {q:P(`你只拿到一片竹葉，葉脈是平行脈。下列哪一句最合理？`,`You hold only a bamboo leaf, with parallel veins. Which statement is most reasonable?`),options:[P(`平行脈是單子葉常見的特徵，但最好再配合其他證據`,`Parallel veins are common in monocots, but better check other clues too`),P(`只看葉脈就一定能斷定`,`Veins alone settle it for sure`),P(`葉脈和單、雙子葉完全無關`,`Veins have nothing to do with monocots or dicots`),P(`平行脈是雙子葉的特徵`,`Parallel veins belong to dicots`)],answer:0,why:P(`這些特徵是「常見」，有例外，所以要多項證據一起看。`,`These features are "common" and have exceptions, so look at several clues together.`),hint:P(`看「五種證據」最後一步。`,`See the last step of "Five clues".`)},
  {q:P(`莖橫切時，維管束散在整個切面，較可能是哪一類？`,`In a stem section, the vascular bundles are scattered over the whole section. Which group is it more likely to be?`),options:[P(`雙子葉植物，像向日葵`,`A dicot, like sunflower`),P(`單子葉植物，像玉米`,`A monocot, like maize`),P(`裸子植物，像松`,`A gymnosperm, like pine`),P(`任何植物都一樣，無法判斷`,`All plants look the same; no way to tell`)],answer:1,why:P(`維管束散生是單子葉常見的樣子；排成一圈則是雙子葉常見的樣子。`,`Scattered bundles are common in monocots; a ring is common in dicots.`),hint:P(`看「五種證據」第 2 步。`,`See step 2 of "Five clues".`)},
  {q:P(`「雙子葉植物都是木本，單子葉植物都是草本」，這句話對嗎？`,`"All dicots are woody and all monocots are herbaceous." Is this right?`),options:[P(`對，這是最基本的分法`,`Yes, it is the basic way to sort them`),P(`對，因為子葉數量決定莖會不會變硬`,`Yes, because the number of seed leaves decides whether the stem hardens`),P(`對，木本只出現在雙子葉`,`Yes, woody plants occur only in dicots`),P(`不對，木本或草本是另一種分法，和單、雙子葉不是同一件事`,`No, woody versus herbaceous is a different way of sorting, not the same as monocot or dicot`)],answer:3,why:P(`單、雙子葉看子葉、葉脈、根等證據；木本或草本是看莖是否木質化，兩種分法不同。`,`Monocots and dicots are judged by seed leaves, veins, roots and so on; woody or herbaceous depends on whether the stem becomes woody. They are different ways of sorting.`),hint:P(`看「五種證據」最後一步。`,`See the last step of "Five clues".`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[steps(EV_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return{title:EV_NAMES[k],text:EV_TEXT[k]};},
 draw:(c,s,t)=>dr('evidence',6,EV_SHORT)(c,s,t)},
{id:'water',title:P(`精子靠水，還是靠管？`,`Do sperm need water or a tube?`),sub:P(`陸地生活與生殖`,`Life and reproduction on land`),
 hook:P(`苔怕乾，蕨愛潮濕，可是松樹卻長在乾乾的山脊上。苔和蕨的精子要游到卵那裡，才能受精，沒有水怎麼游？松樹沒有水膜可以用，牠的精子要怎麼找到卵？答案和花粉有關。今天，我們看四件事：苔與蕨的精子怎麼游過水，種子植物的花粉管怎麼把精細胞送進一顆胚珠，一個子房有很多胚珠時怎麼算，以及種子和果實怎麼保護下一代。`,`Moss fears dryness and ferns love damp places, yet pines grow on dry ridges. The sperm of mosses and ferns must swim to the egg, so how could they swim without water? A pine has no water film to use, so how does its sperm find the egg? The answer lies in pollen. Today we look at four things: how the sperm of moss and fern swim through water, how a pollen tube delivers sperm cells into one ovule, how to count when an ovary holds many ovules, and how seeds and fruits protect the next generation.`),
 body:P(`先看「苔與蕨：精子游過水」；再看「單胚珠」：胚囊裡的 8 個核和雙重受精；再看「多胚珠」：一條花粉管對一顆胚珠，要怎麼算；最後看「種皮與果實」：種子裡有什麼、被子和裸子植物的種子有什麼不同、種子怎麼萌發。`,`First "Moss and fern: sperm swim". Then "One ovule": the 8 nuclei of the embryo sac and double fertilization. Then "Many ovules": one pollen tube for each ovule, and how to count. Finally "Seed coat and fruit": what is inside a seed, how angiosperm and gymnosperm seeds differ, and how a seed germinates.`),
 reading:P(`苔與蕨：精子有尾巴，必須游過一層水才能到達卵，所以生殖時需要水（下雨或露水形成的水膜）。受精卵長成孢子體，孢子體產生孢子。\n\n種子植物：花粉落在柱頭，長出花粉管，把精細胞送到胚珠的珠孔，不必游過水。被子植物的胚囊有 8 個核（卵 1、助細胞 2、極核 2、反足 3）；2 個精細胞，一個和卵結合成受精卵（2n），一個和 2 個極核結合成 3n 的胚乳，叫雙重受精。子房裡有幾顆胚珠，就需要幾條花粉管，要有 n 顆種子，至少要 n 粒花粉、2n 個精細胞。裸子植物的花粉直接落在胚珠旁，也是用花粉管。但植物本身仍然需要水，只是生殖不再靠水膜。\n\n種子和果實：胚珠發育成種子，種子有種皮保護，裡面有胚和養分。被子植物的子房發育成果實，把種子包在裡面；裸子植物的種子露在毬果的鱗片上，沒有果實。\n\n萌發：種子吸水膨脹，胚根先長出，接著莖彎成鉤子頂出土，展開真葉。\n\n注意：精子器、頸卵器、精子、卵、胚囊裡的細胞與花粉管，都是程式畫的示意；胚珠與子房的圖是 AI 教學插圖；種子與果實的圖是 AI 教學插圖。`,`Moss and fern: sperm have tails and must swim through a film of water to reach the egg, so reproduction needs water (a film from rain or dew). The fertilized egg grows into a sporophyte, which makes spores.\n\nSeed plants: pollen lands on the stigma and grows a pollen tube that delivers sperm cells to the micropyle of an ovule, with no swimming through water. The embryo sac of an angiosperm has 8 nuclei (egg 1, synergids 2, polar nuclei 2, antipodals 3). Of the 2 sperm cells, one joins the egg to make the zygote (2n) and one joins the 2 polar nuclei to make the 3n endosperm: double fertilization. An ovary needs one pollen tube for every ovule, so for n seeds at least n pollen grains and 2n sperm cells are needed. In gymnosperms pollen lands right next to the ovule and also uses a pollen tube. The plant still needs water itself; only reproduction no longer depends on a water film.\n\nSeeds and fruits: the ovule develops into a seed, protected by a seed coat, with an embryo and stored food inside. In angiosperms the ovary develops into a fruit that wraps the seeds; in gymnosperms the seeds lie uncovered on the scales of the cone, with no fruit.\n\nGermination: the seed swells with water, the root comes out first, then the stem bends into a hook and pushes up, and the true leaves open.\n\nNote: the antheridium, archegonium, sperm, egg, cells of the embryo sac and pollen tubes are schematics drawn in code; the ovule and ovary pictures are AI teaching illustrations; the pictures of seeds and fruits are AI teaching illustrations.`),
 closure:P(`苔與蕨的精子要游過水膜才能受精，所以離不開潮濕的環境。種子植物用花粉管送精細胞，生殖不再靠水膜；被子植物的胚囊有 8 個核，經雙重受精，一條花粉管對一顆胚珠；種子有種皮保護，被子植物的種子再被果實包住。`,`The sperm of mosses and ferns must swim through a water film to fertilize, so they depend on damp places. Seed plants send sperm cells through a pollen tube and no longer need a water film; the embryo sac of an angiosperm has 8 nuclei, double fertilization uses one pollen tube for each ovule; a seed is protected by a seed coat, and the seeds of angiosperms are wrapped in a fruit as well.`),
 quiz:[
  {q:P(`苔和蕨的精子，怎麼找到卵？`,`How do the sperm of moss and fern reach the egg?`),options:[P(`被風吹過去`,`Blown over by wind`),P(`靠昆蟲帶過去`,`Carried by insects`),P(`靠水膜，游過去`,`They swim through a film of water`),P(`長出花粉管，送過去`,`A pollen tube delivers them`)],answer:2,why:P(`苔和蕨的精子有尾巴，要游過水膜；花粉管是種子植物才有的構造。`,`The sperm of moss and fern have tails and swim through a water film; the pollen tube belongs to seed plants.`),hint:P(`看「苔與蕨：精子游過水」第 3 步。`,`See step 3 of "Moss and fern: sperm swim".`)},
  {q:P(`花粉管的功用是什麼？`,`What does the pollen tube do?`),options:[P(`讓花粉吸水，長成新種子`,`Lets pollen take up water and grow into a new seed`),P(`把精細胞送到胚珠，精細胞不必自己游泳`,`Delivers sperm cells to the ovule so they need not swim`),P(`是從柱頭長出去的根`,`Is a root growing out of the stigma`),P(`是精子的尾巴`,`Is the tail of a sperm`)],answer:1,why:P(`花粉管穿過花柱，把精細胞送到胚珠，所以種子植物受精不再靠水膜。`,`The pollen tube grows through the style and delivers sperm cells to the ovule, so seed plants no longer need a water film for fertilization.`),hint:P(`看「單胚珠」第 3、4 步。`,`See steps 3 and 4 of "One ovule".`)},
  {q:P(`關於種子和果實，下列哪一句正確？`,`Which statement about seeds and fruits is correct?`),options:[P(`松的毬果是果實`,`The cone of a pine is a fruit`),P(`所有種子植物的種子都被果實包著`,`The seeds of all seed plants are wrapped in a fruit`),P(`果實是由種子發育成的`,`A fruit develops from a seed`),P(`被子植物的種子在果實裡，松的種子露在毬果鱗片上`,`Angiosperm seeds are inside a fruit, while pine seeds lie uncovered on cone scales`)],answer:3,why:P(`果實由子房發育而來；裸子植物沒有果實，毬果不是果實。`,`A fruit develops from the ovary; gymnosperms have no fruit, and a cone is not a fruit.`),hint:P(`看「種皮與果實」第 2、3 步。`,`See steps 2 and 3 of "Seed coat and fruit".`)},
  {q:P(`被子植物一顆胚珠的胚囊裡，共有幾個核？`,`How many nuclei are in the embryo sac of one angiosperm ovule?`),options:[P(`4 個`,`4`),P(`7 個`,`7`),P(`8 個`,`8`),P(`16 個`,`16`)],answer:2,why:P(`卵 1＋助細胞 2＋極核 2＋反足 3＝8 個核，分在 7 個細胞裡（中央細胞有 2 個核）。`,`Egg 1 + synergids 2 + polar nuclei 2 + antipodals 3 = 8 nuclei, in 7 cells (the central cell has 2 nuclei).`),hint:P(`看「單胚珠」第 2 步。`,`See step 2 of "One ovule".`)},
  {q:P(`雙重受精完成後，下列哪一項正確？`,`After double fertilization, which statement is correct?`),options:[P(`受精卵是 n，胚乳是 2n`,`The zygote is n and the endosperm is 2n`),P(`受精卵是 2n，胚乳是 3n`,`The zygote is 2n and the endosperm is 3n`),P(`受精卵是 3n，胚乳是 2n`,`The zygote is 3n and the endosperm is 2n`),P(`兩個精細胞都和卵結合`,`Both sperm cells join the egg`)],answer:1,why:P(`精細胞（n）加卵（n）＝受精卵 2n；精細胞（n）加 2 個極核（n＋n）＝胚乳 3n。`,`Sperm cell (n) + egg (n) = zygote 2n; sperm cell (n) + 2 polar nuclei (n + n) = endosperm 3n.`),hint:P(`看「單胚珠」第 5 步。`,`See step 5 of "One ovule".`)},
  {q:P(`某子房有 6 顆胚珠，全部都要受精，至少需要幾粒花粉、共幾個精細胞？`,`An ovary has 6 ovules and all must be fertilized. At least how many pollen grains and how many sperm cells in total?`),options:[P(`6 粒花粉、6 個精細胞`,`6 pollen grains, 6 sperm cells`),P(`6 粒花粉、12 個精細胞`,`6 pollen grains, 12 sperm cells`),P(`12 粒花粉、12 個精細胞`,`12 pollen grains, 12 sperm cells`),P(`3 粒花粉、6 個精細胞`,`3 pollen grains, 6 sperm cells`)],answer:1,why:P(`一顆胚珠要一條花粉管，一條管送 2 個精細胞（一個給卵，一個給極核）：6 粒花粉、12 個精細胞。`,`Each ovule needs one pollen tube and each tube delivers 2 sperm cells (one for the egg, one for the polar nuclei): 6 pollen grains, 12 sperm cells.`),hint:P(`看「多胚珠」第 4 步。`,`See step 4 of "Many ovules".`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P(`觀察`,`View`),'view',WATER_TABS.map((n,i)=>[i,n])),steps(s.view===3?SD_SHORT:s.view===2?MU_SHORT:s.view===1?OV_SHORT:SW_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===3?{title:SD_NAMES[k],text:SD_TEXT[k]}:s.view===2?{title:MU_NAMES[k],text:MU_TEXT[k]}:s.view===1?{title:OV_NAMES[k],text:OV_TEXT[k]}:{title:SW_NAMES[k],text:SW_TEXT[k]};},
 draw:(c,s,t)=>s.view===3?dr('seed',4,SD_SHORT)(c,s,t):s.view===2?dr('multi',5,MU_SHORT)(c,s,t):s.view===1?dr('ovule',6,OV_SHORT)(c,s,t):dr('swim',5,SW_SHORT)(c,s,t)}
];
B.register({id:'plants_diversity',title:P(`植物：水、種子與果實的線索`,`Plants: clues from water, seeds and fruits`),subtitle:P(`蘚苔、蕨類、種子植物與構造比較`,`Bryophytes, ferns, seed plants and comparative structures`),cover:'assets/covers/biology_plants_diversity_1022_v1.jpg',
 assetDir:'assets/biology/plants_ai_1022/',family:P(`地球上的生物`,`Life on Earth`),bookName:P(`生物`,`Life`),tabs});
})();
