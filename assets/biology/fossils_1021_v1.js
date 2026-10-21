/* Fossils · teacher-requested V5 remake, 2026-10-21.
 * Three tabs: evidence (how a fossil forms; remains, traces and reconstructions), horse (five horse skeletons at one
 * scale, forefoot bones, and why the five are one selected series rather than a ladder) and environment (a coral
 * cliff and a living reef; how a sea floor became a mountain).
 * Pictures: fossils_ai_1021/ (AI illustrations made by the teacher with Gemini, not photographs).
 * Each interaction is drawn by its own module, fossils_draw_<name>_1021_v1.js, which registers window.FossilDraw[name];
 * the page text, steps, captions and multiple-choice checks live here. Shared helpers: fossils_kit_1021_v1.js.
 * Replaces the fossils_evolution entry of biodiversity_lessons_1010_v1.js (left in that file, unused).
 */
(()=>{'use strict';
const K=window.FossilKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── steps and captions ─────────────────────────────────────────────────────
const FORM_SHORT=[P(`死亡沉底`,`Sinks`),P(`泥沙掩埋`,`Buried`),P(`變成岩石`,`Turns to rock`),P(`岩層露出`,`Exposed`),P(`被發現`,`Found`)];
const FORM_NAMES=[P(`生物死後沉到水底`,`The animal dies and sinks`),P(`被泥沙快速掩埋`,`Buried quickly by mud and sand`),P(`變成岩層裡的化石`,`Turning into a fossil in rock`),P(`地層抬升，岩層露出`,`Uplift brings the rock to the surface`),P(`被人發現、挖出來`,`Found and dug out`)];
const FORM_TEXT=[
 P(`生物死後，遺體沉到湖底或海底。大部分的遺體會被吃掉或腐爛，只有很少數有機會變成化石。`,`When an animal dies, its body sinks to the lake or sea floor. Most bodies are eaten or rot away; only a very few have a chance of becoming fossils.`),
 P(`泥沙很快把遺體蓋住，擋住氧氣和啃食的動物，遺體比較不容易腐爛。骨頭、外殼這些硬的部分，最容易保存下來。`,`Mud and sand soon cover the body, shutting out oxygen and scavengers, so it rots less. Hard parts such as bones and shells are the most likely to survive.`),
 P(`泥沙一層一層堆積，變成岩層。水裡的礦物慢慢填進骨頭和外殼的空隙，讓它變得像石頭一樣硬。有些遺體整個消失，只在岩石上留下形狀，叫做印模。`,`Layer after layer of sediment hardens into rock. Minerals in the water slowly fill the gaps in bones and shells until they are as hard as stone. Some bodies vanish completely and leave only their shape in the rock, called a mold.`),
 P(`經過很久很久，地殼運動使岩層抬升；風吹、雨打、河流切割，把上面的岩層帶走，埋在裡面的化石就露出來了。`,`Over a very long time, movements of the crust lift the rock; wind, rain and rivers wear away the layers above, and the fossil inside is exposed.`),
 P(`人們在岩層裡發現化石，小心挖出來研究。化石多半在泥沙堆積成的沉積岩裡；岩漿冷卻成的火成岩，因為當初溫度太高，生物很難保存下來。`,`People spot the fossil in the rock and dig it out carefully to study it. Fossils are usually found in sedimentary rock, laid down from mud and sand; igneous rock, cooled from molten rock, was far too hot for a living thing to survive.`)];
const KIND_SHORT=[P(`遺體`,`Remains`),P(`足跡`,`Footprints`),P(`琥珀`,`Amber`),P(`復原圖`,`Reconstruction`)];
const KIND_NAMES=[P(`三葉蟲化石：保存下來的遺體`,`Trilobite fossil: preserved remains`),P(`足跡化石：活動留下的痕跡`,`Footprint fossils: traces of activity`),P(`琥珀：整隻包起來的遺體`,`Amber: a body sealed whole`),P(`復原圖：依證據畫出來的模型`,`Reconstruction: a model built from evidence`)];
const KIND_TEXT=[
 P(`三葉蟲化石保存的是生物自己的遺體，主要是硬的外殼。可以看出頭、胸、尾三段和身體的分節；但看不出牠的顏色，軟的部分也大多沒有留下來。`,`A trilobite fossil keeps the animal's own remains, mainly its hard shell. We can see the head, thorax and tail and the body segments, but not its colour, and most soft parts are gone.`),
 P(`足跡化石保存的不是遺體，而是生物活動留下的痕跡，叫做遺跡。可以知道曾經有生物走過、腳有幾趾、大約多大、往哪個方向走；但看不到牠完整的樣子。`,`Footprint fossils keep no body at all, only a trace the animal left while moving, called a trace fossil. They show that something walked here, how many toes it had, roughly how big it was and which way it went, but not what it looked like whole.`),
 P(`樹脂把小昆蟲整個包住，慢慢變硬成琥珀，連細小的翅膀和腳都保存下來，是非常完整的遺體。補充：琥珀是樹脂變成的，不是石頭。`,`Tree resin wrapped the small insect whole and slowly hardened into amber, keeping even its fine wings and legs: a very complete set of remains. Extra: amber is hardened resin, not stone.`),
 P(`復原圖不是化石，是科學家依化石的證據畫出來的模型。外殼的形狀、分節來自化石；步足和觸角只在少數保存特別好的標本上看過；顏色幾乎沒有證據，多半是推測。`,`A reconstruction is not a fossil; it is a model that scientists draw from fossil evidence. The shell shape and segments come from fossils; legs and antennae have been seen only in a few exceptionally preserved specimens; colour has almost no evidence and is mostly a guess.`)];

const HORSES=[
 {name:P(`始祖馬`,`Hyracotherium`),sci:`Hyracotherium`,when:P(`約 5,000 萬年前`,`about 50 million years ago`),toes:4,file:`horse_1_hyracotherium.png`,foot:`foot_1.png`},
 {name:P(`中新馬`,`Mesohippus`),sci:`Mesohippus`,when:P(`約 3,500 萬年前`,`about 35 million years ago`),toes:3,file:`horse_2_mesohippus.png`,foot:`foot_2.png`},
 {name:P(`草原古馬`,`Merychippus`),sci:`Merychippus`,when:P(`約 1,500 萬年前`,`about 15 million years ago`),toes:3,file:`horse_3_merychippus.png`,foot:`foot_3.png`},
 {name:P(`上新馬`,`Pliohippus`),sci:`Pliohippus`,when:P(`約 1,000 萬年前`,`about 10 million years ago`),toes:1,file:`horse_4_pliohippus.png`,foot:`foot_4.png`},
 {name:P(`現代馬`,`Equus (today's horse)`),sci:`Equus`,when:P(`約 500 萬年前到現在`,`about 5 million years ago to today`),toes:1,file:`horse_5_equus.png`,foot:`foot_5.png`}];
const HORSE_SHORT=HORSES.map(h=>h.name);
const HORSE_TEXT=[
 P(`始祖馬生活在森林邊緣，吃柔軟的樹葉，只有小狗那麼大。前腳有四趾、後腳有三趾，腳掌著地的面積大。`,`Hyracotherium lived at the forest edge and ate soft leaves; it was only the size of a small dog. It had four toes on each front foot and three on each hind foot, with a broad footpad.`),
 P(`中新馬比始祖馬高一些，前腳剩下三趾，中間的趾比較長、比較粗。`,`Mesohippus stood taller than Hyracotherium. Its front feet were down to three toes, and the middle one was longer and thicker.`),
 P(`草原古馬比中新馬又高了不少，前腳還是三趾，但中間的趾已經承受大部分重量，兩側的趾很小，走路時不太碰地。`,`Merychippus stood noticeably taller than Mesohippus. It still had three toes, but the middle one carried most of the weight and the two side toes were small, hardly touching the ground.`),
 P(`上新馬的前腳只剩一個大趾，包著蹄；兩側的趾退化成細長的小骨頭，掛在大趾旁邊。`,`Pliohippus had a single big toe wrapped in a hoof; the side toes had shrunk to thin splints beside it.`),
 P(`現代馬又高又大，前腳只有一個趾，包著硬硬的蹄，適合在草原上奔跑。補充：這五種馬是挑出來的一個系列，不是馬的演化史的全部。`,`Today's horse is tall and big, with one toe in a hard hoof, built for running over grassland. Extra: these five are one selected series, not the whole history of horses.`)];
const FEET_NAMES=[P(`前腳骨：四趾`,`Forefoot bones: four toes`),P(`前腳骨：三趾`,`Forefoot bones: three toes`),P(`前腳骨：三趾，中間最粗`,`Forefoot bones: three toes, the middle one thickest`),P(`前腳骨：一趾和退化的小骨`,`Forefoot bones: one toe and small splints`),P(`前腳骨：一趾`,`Forefoot bones: one toe`)];
const FEET_TEXT=[
 P(`始祖馬前腳有四個趾，每個趾差不多粗。四趾張開，腳掌大，適合在鬆軟的森林地面行走。`,`Hyracotherium had four toes on its front foot, all about equally thick. The four toes spread wide, a broad foot for soft forest floor.`),
 P(`中新馬前腳剩三個趾，中間的趾已經比兩側的粗一點。始祖馬的第四趾，在這裡已經不見了。`,`Mesohippus had three front toes, the middle one already thicker than the others. The fourth toe of Hyracotherium is gone here.`),
 P(`草原古馬前腳還是三個趾，中間的趾變得又長又粗，承受大部分的重量，兩側的趾很細小。`,`Merychippus still had three toes, but the middle one had grown long and thick and carried most of the weight, while the side toes were thin and small.`),
 P(`上新馬前腳只剩中間一個大趾，末端包著蹄；兩側原來的趾變成細長的小骨頭，已經不碰地。`,`Pliohippus kept only the middle toe, ending in a hoof; the former side toes were thin splints that no longer touched the ground.`),
 P(`現代馬前腳只有一個趾，趾骨又長又粗，包著硬蹄。兩側只剩細長的小骨頭，貼在大趾骨旁，外面被皮肉包住，跑起來又快又省力。`,`Today's horse has just one toe, long and thick, in a hard hoof. Only thin splint bones remain beside it, covered by skin and muscle, for fast, economical running.`)];
const TREE_SHORT=[P(`挑出的系列`,`Selected series`),P(`其他分支`,`Other branches`),P(`不一定變大`,`Not always bigger`),P(`多數已滅絕`,`Most extinct`)];
const TREE_NAMES=[P(`課本挑出來的一個系列`,`One selected series`),P(`馬的家族還有許多分支`,`The horse family has many other branches`),P(`有些分支沒有變大`,`Some branches did not get bigger`),P(`多數分支已經滅絕`,`Most branches have died out`)];
const TREE_TEXT=[
 P(`把五種馬一隻接一隻排起來，看起來像一道愈變愈大的階梯。但這是學者從化石裡挑出來、方便比較的一個系列。`,`Line the five horses up and they look like a staircase of ever larger animals. But this is a series picked out of the fossils to make comparison easy.`),
 P(`真實的馬科像一棵樹，在不同年代、不同地方分出很多分支。我們只看到其中一條，其他分支同樣是馬的親戚。這張樹狀圖是示意，不是真實的分支。`,`The real horse family is more like a tree, branching in different times and places. We follow only one path; the other branches are horse relatives too. This tree is a schematic, not the real branching.`),
 P(`馬科裡有些分支一直都很小，也有些變小了。演化沒有固定要往大的方向走，要看環境和族群的情況。`,`Some branches of the horse family stayed small, and some even grew smaller. Evolution has no fixed direction towards larger size; it depends on the environment and the population.`),
 P(`馬科的大多數分支已經滅絕，今天只剩下馬、驢、斑馬這一支。所以不能說「所有生物都會愈變愈大」。`,`Most branches of the horse family have died out; today only the horses, asses and zebras remain. So we cannot say that every lineage grows larger and larger.`)];

const CLIFF_SHORT=[P(`看到什麼`,`What we see`),P(`今天的珊瑚礁`,`A reef today`),P(`推論`,`Inference`),P(`還要檢查`,`To check`)];
const CLIFF_NAMES=[P(`觀察：山壁岩層裡有珊瑚化石`,`Observation: coral fossils in the cliff`),P(`已知條件：現在的造礁珊瑚生活在哪裡？`,`Known: where do reef-building corals live today?`),P(`推論：這裡以前可能是暖淺海`,`Inference: this place may once have been a warm shallow sea`),P(`推論還要查證什麼？`,`What must still be checked?`)];
const CLIFF_TEXT=[
 P(`高高的山壁岩層裡，有珊瑚的化石。這是看得到的事實，叫做觀察。`,`High in a cliff, there are coral fossils in the rock layers. This is a fact we can see: an observation.`),
 P(`現在的造礁珊瑚，生活在溫暖、清澈、陽光照得到的淺海。這是已經知道的條件。`,`Reef-building corals today live in warm, clear, sunlit shallow seas. This is a condition we already know.`),
 P(`如果化石裡的珊瑚和今天的造礁珊瑚需要相似的環境，這裡很久以前，可能是一片溫暖的淺海。這是推論，不是親眼看到的。`,`If these fossil corals needed an environment like today's reef-builders, this place may long ago have been a warm shallow sea. That is an inference, not something seen directly.`),
 P(`還要檢查：岩層是不是海裡堆積的沉積岩？化石有沒有被水流從別處搬來？岩層有多老？證據越多，推論越可靠。`,`Still to check: is the rock a sediment laid down in the sea? Were the fossils carried in from elsewhere by currents? How old is the rock? The more evidence, the more reliable the inference.`)];
const UP_SHORT=[P(`暖淺海`,`Warm sea`),P(`被泥沙蓋住`,`Buried`),P(`地殼抬升`,`Uplift`),P(`山壁露出`,`Cliff exposed`)];
const UP_NAMES=[P(`很久以前：溫暖的淺海`,`Long ago: a warm shallow sea`),P(`珊瑚死去，被泥沙蓋住`,`Coral dies and is buried`),P(`地殼運動，岩層慢慢抬升`,`Crustal movement slowly lifts the rock`),P(`風雨切割，山壁露出`,`Weathering exposes the cliff`)];
const UP_TEXT=[
 P(`很久以前，這裡是溫暖的淺海，海裡長著珊瑚礁。`,`Long ago this was a warm shallow sea with a coral reef growing in it.`),
 P(`珊瑚死去後，遺骸被泥沙一層一層蓋住，慢慢變成岩層裡的化石。`,`When the corals died, their remains were covered by layer upon layer of sediment and slowly became fossils in the rock.`),
 P(`經過幾百萬年，地殼運動把岩層慢慢抬高，海水退去，海底變成陸地，再變成山。`,`Over millions of years the crust lifted the rock higher. The sea withdrew, and the sea floor became land, then mountains.`),
 P(`風吹、雨打、河流切割，把外面的岩層帶走，山壁露出來，裡面的珊瑚化石就被人看見了。`,`Wind, rain and rivers wore the outer rock away, exposing the cliff and the coral fossils inside.`)];

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;K.text(c,short[k],480,300,28,C.yellow,'center');K.text(c,P(`（${name} 施工中）`,`(${name} under construction)`),480,340,22,C.muted,'center');};
const dr=(name,n,short)=>(c,s,t)=>((window.FossilDraw&&window.FossilDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const EV_TABS=[P(`化石怎麼形成`,`How a fossil forms`),P(`化石的種類`,`Kinds of fossil evidence`)];
const HORSE_TABS=[P(`五種馬的骨架`,`Five horse skeletons`),P(`前腳骨`,`Forefoot bones`),P(`不是一條直線`,`Not a straight line`)];
const ENV_TABS=[P(`山壁上的珊瑚`,`Coral in a cliff`),P(`海怎麼變成山`,`How a sea became a mountain`)];
const tabs=[
{id:'evidence',title:P(`看到骨頭，還是看到足跡？`,`Remains or traces?`),sub:P(`化石的證據`,`Fossil evidence`),
 hook:P(`岩板上有一隻三葉蟲的形狀，旁邊的石頭上有幾個腳印，一塊透明的琥珀裡還包著一隻小昆蟲。這些都是化石嗎？沒有骨頭，只有足跡，也能知道曾經有生物來過嗎？`,`A slab bears the shape of a trilobite, another stone holds a line of footprints, and a lump of amber has a small insect sealed inside. Are they all fossils? With no bones at all, only footprints, can we still tell that an animal once passed by?`),
 body:P(`先看「化石怎麼形成」：一隻生物要經過哪些步驟，才會留在石頭裡；再看「化石的種類」：遺體、足跡和復原圖，各告訴我們什麼，又有哪些是看不出來的。`,`First "How a fossil forms": the steps that leave a living thing in stone. Then "Kinds of fossil evidence": what remains, footprints and reconstructions each tell us, and what they cannot.`),
 reading:P(`化石：保存在岩層或琥珀、冰等裡面的古代生物遺體，以及牠們活動留下的痕跡。\n\n遺體：生物自己的身體，例如三葉蟲的外殼、貝殼、骨頭、琥珀裡的昆蟲。遺跡（痕跡化石）：生物活動留下的痕跡，例如足跡、爬痕、糞便。遺體和遺跡提供的資訊不同。\n\n化石是證據，復原圖是依證據建立的模型：形狀和結構來自化石，顏色、行為等細節常常要靠推測。\n\n補充：一般的化石多半在沉積岩裡，而且生物死後要很快被泥沙蓋住，才有機會保存下來；所以我們看到的化石，只是古代生物的一小部分。`,`Fossils are the remains of ancient living things preserved in rock, amber, ice and the like, together with the traces they left by their activity.\n\nRemains are the organism's own body, such as a trilobite's shell, a seashell, bones, or an insect in amber. Trace fossils are marks left by activity, such as footprints, burrows and droppings. Remains and traces give different information.\n\nA fossil is evidence; a reconstruction is a model built from evidence: shape and structure come from fossils, while colour and behaviour often have to be inferred.\n\nExtra: most fossils lie in sedimentary rock, and an animal must be buried quickly to be preserved, so the fossils we find are only a small part of ancient life.`),
 closure:P(`化石包括古代生物的遺體和牠們活動留下的痕跡。化石是證據，復原圖是依證據建立的模型；顏色、行為等細節，不能單靠化石確定。`,`Fossils include the remains of ancient organisms and the traces of their activity. A fossil is evidence; a reconstruction is a model built from evidence, and details such as colour and behaviour cannot be settled from fossils alone.`),
 quiz:[
  {q:P(`下列哪一種屬於「遺跡」（痕跡化石）？`,`Which of these is a trace fossil?`),options:[P(`岩石上的足跡`,`Footprints in rock`),P(`三葉蟲的外殼`,`A trilobite shell`),P(`琥珀裡的昆蟲`,`An insect in amber`),P(`貝殼`,`A seashell`)],answer:0,why:P(`足跡是生物活動留下的痕跡，不是身體本身；外殼、貝殼、琥珀裡的昆蟲都是遺體。`,`A footprint is a mark left by activity, not the body itself; shells and the insect in amber are remains.`),hint:P(`看「化石的種類」第 2 步。`,`See step 2 of "Kinds of fossil evidence".`)},
  {q:P(`三葉蟲復原圖上的體色，主要是怎麼決定的？`,`How was the colour on a trilobite reconstruction mainly decided?`),options:[P(`畫家依證據推測的，化石很難保存顏色`,`Guessed from evidence; fossils rarely keep colour`),P(`化石上的顏色原封不動畫上去`,`Copied exactly from the colour of the fossil`),P(`用顯微鏡看到了色素`,`Pigment was seen under a microscope`),P(`所有三葉蟲都是同一種顏色`,`All trilobites were the same colour`)],answer:0,why:P(`化石大多只留下硬的外殼，幾乎沒有顏色的證據，所以顏色多半是推測。`,`Fossils mostly keep only the hard shell and give almost no evidence of colour, so colour is mostly a guess.`),hint:P(`看「化石的種類」最後一步。`,`See the last step of "Kinds of fossil evidence".`)},
  {q:P(`在「化石怎麼形成」裡，生物死後要怎樣，才比較有機會變成化石？`,`In "How a fossil forms", what helps a dead animal become a fossil?`),options:[P(`很快被泥沙蓋住`,`Being covered quickly by mud and sand`),P(`留在地面上曬太陽`,`Lying in the sun on the ground`),P(`被其他動物吃掉`,`Being eaten by other animals`),P(`被火燒成灰`,`Being burned to ash`)],answer:0,why:P(`快速被泥沙蓋住，可以擋住氧氣和啃食的動物，遺體才不容易腐爛。`,`Quick burial keeps out oxygen and scavengers, so the body rots less.`),hint:P(`看第 2 步。`,`See step 2.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P(`觀察`,`View`),'view',EV_TABS.map((n,i)=>[i,n])),steps(s.view===1?KIND_SHORT:FORM_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:KIND_NAMES[k],text:KIND_TEXT[k]}:{title:FORM_NAMES[k],text:FORM_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('kinds',4,KIND_SHORT)(c,s,t):dr('formation',5,FORM_SHORT)(c,s,t)},
{id:'horse',title:P(`不是一路變大的階梯`,`Not a ladder of increasing size`),sub:P(`比較馬的化石`,`Comparing horse fossils`),
 hook:P(`最左邊的小馬只有小狗那麼大，最右邊是我們熟悉的馬。五隻排成一排，像一道愈變愈大的階梯。是不是所有的生物，都會愈變愈大？一隻馬，能在一生裡長出蹄嗎？`,`The little horse on the left is only dog-sized; the one on the right is the horse we know. Lined up, the five look like a staircase of growing animals. Does every kind of living thing grow larger and larger? Could one horse grow a hoof in its lifetime?`),
 body:P(`先看「五種馬的骨架」：同一個比例尺下，牠們有多大；再看「前腳骨」：趾怎麼變；最後看「不是一條直線」：為什麼這五隻只是挑出來的一個系列。`,`First "Five horse skeletons": how big they are at one scale. Then "Forefoot bones": how the toes changed. Finally "Not a straight line": why these five are only a selected series.`),
 reading:P(`演化：一個族群的性狀，經過很多代慢慢改變。同一種生物的個體之間本來就有差異，其中比較適合當時環境的個體，比較容易存活、留下比較多後代，於是這些性狀在族群裡慢慢變多。\n\n馬的化石：從約 5,000 萬年前的始祖馬到現代馬，體型變大、前腳的趾變少、中間的趾變粗、最後包成蹄。一般認為，這和森林減少、草原擴大，需要在開闊的草原上快速奔跑有關。\n\n這五種馬是挑出來的一個系列。馬科有許多分支，大多數已經滅絕，有些分支的體型沒有變大。演化不是一隻馬在一生裡努力就變成另一種，也沒有固定要往大的方向走。\n\n補充：牙齒也有變化。早期的馬吃柔軟的樹葉，臼齒比較低；後來的馬吃堅硬的草，臼齒變得又高又有複雜的紋路。\n\n想一想：如果草原再變回森林，馬還會繼續變大嗎？`,`Evolution: the traits of a population change slowly over many generations. Individuals of one species already differ; those better suited to the environment of the time survive more easily and leave more offspring, so their traits become more common.\n\nHorse fossils: from Hyracotherium about 50 million years ago to today's horse, the animal grew larger, lost front toes, thickened the middle toe and finally wrapped it in a hoof. This is generally linked to forests shrinking and grasslands spreading, where fast running over open ground paid off.\n\nThese five are a selected series. The horse family has many branches, most now extinct, and some branches did not grow larger. Evolution is not one horse becoming another kind by trying during its life, and it has no fixed direction towards larger size.\n\nExtra: the teeth changed as well. Early horses ate soft leaves and had low cheek teeth; later horses ate tough grass and developed tall teeth with complex ridges.\n\nThink: if the grassland turned back into forest, would horses keep growing larger?`),
 closure:P(`比較多項證據：體型、趾數、年代。馬的演化是族群經過很多代的改變，不是個體努力就變成另一種；這五種馬是挑出來的系列，馬科有許多分支，不是所有生物都愈變愈大。`,`Compare several kinds of evidence: size, toes and age. Horse evolution is the change of populations over many generations, not an individual becoming another kind by trying. These five are a selected series; the horse family has many branches, and not every lineage grows larger.`),
 quiz:[
  {q:P(`從始祖馬到現代馬，前腳的趾數怎麼變？`,`From Hyracotherium to today's horse, how did the front toes change?`),options:[P(`趾由多變少，中間的趾變粗、包成蹄`,`From many to few; the middle toe thickened into a hoof`),P(`趾越來越多`,`More and more toes`),P(`趾數都沒有變`,`The number never changed`),P(`先變少再變回四個`,`Fewer, then back to four`)],answer:0,why:P(`前腳從四趾、三趾，變成一個包著蹄的大趾，兩側的趾退化成小骨頭。`,`The front foot went from four toes to three to a single hoofed toe, with the side toes shrinking to splints.`),hint:P(`看「前腳骨」。`,`See "Forefoot bones".`)},
  {q:P(`為什麼不能說「所有生物都會愈變愈大」？`,`Why can't we say that every lineage grows larger and larger?`),options:[P(`馬科有許多分支，有些沒有變大，多數已滅絕`,`The horse family has many branches; some did not grow and most died out`),P(`因為馬一直都一樣大`,`Because horses were always the same size`),P(`因為始祖馬比現代馬大`,`Because Hyracotherium was bigger than today's horse`),P(`因為化石會越變越小`,`Because fossils shrink over time`)],answer:0,why:P(`五種馬只是挑出來的一個系列；演化沒有固定的方向，要看環境和族群的情況。`,`The five are only a selected series; evolution has no fixed direction and depends on environment and population.`),hint:P(`看「不是一條直線」。`,`See "Not a straight line".`)},
  {q:P(`下列哪一個，最能說明馬的前腳為什麼從多趾變成蹄？`,`Which best explains how the horse's front foot went from many toes to a hoof?`),options:[P(`很多代以來，在草原上跑得快的個體比較容易存活、留下後代`,`Over many generations, individuals that ran faster on grassland survived and left more offspring`),P(`馬為了跑得快，每天用力踮腳，腳趾就退化了`,`Horses stood on tiptoe every day to run faster, so their toes wore away`),P(`一隻馬在一生裡慢慢長出蹄`,`One horse slowly grew a hoof during its lifetime`),P(`人類把馬的腳趾剪掉`,`People cut the horses' toes off`)],answer:0,why:P(`演化是族群經過很多代的改變。個體一生中的努力，不會直接遺傳給下一代。`,`Evolution is the change of a population over many generations. What an individual does in its life is not passed straight on.`),hint:P(`想想「個體」和「族群」的差別。`,`Think about individual versus population.`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P(`觀察`,`View`),'view',HORSE_TABS.map((n,i)=>[i,n])),steps(s.view===2?TREE_SHORT:HORSE_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===2?{title:TREE_NAMES[k],text:TREE_TEXT[k]}:s.view===1?{title:FEET_NAMES[k],text:FEET_TEXT[k]}:{title:P(`${HORSES[k].name[0]}：${HORSES[k].when[0]}`,`${HORSES[k].name[1]}: ${HORSES[k].when[1]}`),text:HORSE_TEXT[k]};},
 draw:(c,s,t)=>s.view===2?dr('tree',4,TREE_SHORT)(c,s,t):s.view===1?dr('feet',5,HORSE_SHORT)(c,s,t):dr('horses',5,HORSE_SHORT)(c,s,t)},
{id:'environment',title:P(`今天在陸地，昨天呢？`,`On land today, but in the past?`),sub:P(`化石與古環境`,`Fossils and past environments`),
 hook:P(`高高的山壁岩層裡，嵌著珊瑚的化石。珊瑚是生活在海裡的動物，難道牠以前長在土裡嗎？還是這片山壁，以前根本不是山？`,`High in a mountain cliff, coral fossils are set in the rock. Corals live in the sea, so did this one grow in soil? Or was this cliff not a mountain at all, once?`),
 body:P(`先看「山壁上的珊瑚」：哪些是看到的事實，哪些是推論；再看「海怎麼變成山」：海底的岩層，怎麼跑到山上。`,`First "Coral in a cliff": which parts are facts we see and which are inferences. Then "How a sea became a mountain": how rock from the sea floor ended up on a mountain.`),
 reading:P(`古環境：每種生物都需要適合的環境。如果知道一種化石生物（或牠現在的親戚）需要什麼環境，再配合岩層的種類，就能推測那個地方過去的環境。\n\n現在的造礁珊瑚生活在溫暖、清澈、陽光照得到的淺海。所以，岩層裡的造礁珊瑚化石，可以支持「這裡很久以前可能是溫暖的淺海」。\n\n要把「觀察」和「推論」分開：山壁裡有珊瑚化石是觀察；這裡以前是溫暖淺海是推論。推論要說明用了什麼條件：假設古代珊瑚和現在的造礁珊瑚需要相似的環境，而且化石沒有被搬動過。\n\n補充：不是所有珊瑚都一樣。有些珊瑚生活在很深、很冷、沒有陽光的海裡；課本談的是造礁珊瑚。臺灣的許多山區，也能在岩層裡找到貝殼、珊瑚等海洋生物的化石。\n\n想一想：如果山壁裡找到的是樹葉化石，會推測什麼環境？`,`Past environments: every organism needs a suitable environment. If we know what a fossil organism (or its living relatives) needs, and the kind of rock it lies in, we can infer the environment of that place long ago.\n\nReef-building corals today live in warm, clear, sunlit shallow seas. So reef-coral fossils in rock can support "this place may long ago have been a warm shallow sea".\n\nKeep observation and inference apart: coral fossils in the cliff are an observation; a warm shallow sea once being here is an inference. An inference should state its assumptions: that ancient corals needed conditions like those of living reef-builders, and that the fossils were not moved.\n\nExtra: not all corals are alike. Some live in deep, cold, dark water; the lesson is about reef-building corals. In many mountain areas of Taiwan, shells, corals and other marine fossils can be found in the rock.\n\nThink: if the cliff held fossil leaves, what environment would you infer?`),
 closure:P(`把觀察和推論分開：山壁裡有珊瑚化石是觀察，這裡以前是溫暖淺海是推論。推論要說明使用的條件，還要靠更多證據確認。`,`Keep observation and inference apart: coral fossils in the cliff are an observation; a warm shallow sea is an inference. An inference states its assumptions and needs more evidence to confirm it.`),
 quiz:[
  {q:P(`山壁岩層裡有造礁珊瑚的化石，下列哪一個推論最有證據支持？`,`Reef-coral fossils are found in cliff rock. Which inference is best supported?`),options:[P(`這裡很久以前可能是溫暖的淺海`,`This place may long ago have been a warm shallow sea`),P(`珊瑚本來就長在土裡`,`Coral originally grew in soil`),P(`有人把珊瑚搬到山上`,`People carried the coral up the mountain`),P(`這片山壁昨天才出現`,`This cliff appeared yesterday`)],answer:0,why:P(`造礁珊瑚需要溫暖、清澈的淺海，岩層裡有牠的化石，可以推測這裡曾是那樣的環境。`,`Reef-building corals need warm, clear shallow seas, so their fossils in the rock suggest such an environment.`),hint:P(`看「山壁上的珊瑚」第 3 步。`,`See step 3 of "Coral in a cliff".`)},
  {q:P(`下列哪一句是「觀察」，不是推論？`,`Which statement is an observation, not an inference?`),options:[P(`山壁的岩層裡有珊瑚化石`,`The cliff rock contains coral fossils`),P(`這裡以前是海`,`This place was once sea`),P(`這裡以前很溫暖`,`This place was once warm`),P(`海水大約有十公尺深`,`The water was about ten metres deep`)],answer:0,why:P(`化石是看得到的事實，其他三句都是由證據推論出來的。`,`The fossils are something we see; the other three are inferred from evidence.`),hint:P(`看第 1 步和第 3 步的差別。`,`Compare steps 1 and 3.`)},
  {q:P(`高山上的岩層裡找到海洋生物的化石，最合理的說明是？`,`Marine fossils are found in mountain rock. What is the most reasonable explanation?`),options:[P(`岩層在海裡形成，後來地殼抬升變成山`,`The rock formed in the sea, and later the crust lifted it into a mountain`),P(`海洋生物自己爬上山`,`The sea animals climbed up the mountain`),P(`化石是在山上的岩石裡長出來的`,`The fossils grew inside the mountain rock`),P(`海洋生物本來就住在土裡`,`Sea animals normally live in soil`)],answer:0,why:P(`地殼運動可以把海底的岩層慢慢抬高，變成陸地和山。`,`Crustal movement can slowly lift sea-floor rock into land and mountains.`),hint:P(`看「海怎麼變成山」。`,`See "How a sea became a mountain".`)}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P(`觀察`,`View`),'view',ENV_TABS.map((n,i)=>[i,n])),steps(s.view===1?UP_SHORT:CLIFF_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:UP_NAMES[k],text:UP_TEXT[k]}:{title:CLIFF_NAMES[k],text:CLIFF_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('uplift',4,UP_SHORT)(c,s,t):dr('cliff',4,CLIFF_SHORT)(c,s,t)}
];
B.register({id:'fossils_evolution',title:P(`化石：石頭裡留下了什麼？`,`Fossils: what remains in stone?`),subtitle:P(`遺體、足跡，和古老的環境`,`Remains, footprints and ancient environments`),cover:'assets/covers/biology_fossils_evolution_1021_v1.jpg',
 assetDir:'assets/biology/fossils_ai_1021/',family:P(`地球上的生物`,`Life on Earth`),bookName:P(`生物`,`Life`),tabs});
})();
