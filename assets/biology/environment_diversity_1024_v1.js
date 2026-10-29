/* Unit 11 lesson 1 · "How do we look at and compare the variety of life?" V5 remake, 2026-10-24 (plan: assets/biology/environment_plan_1024.md section 2).
 * Four tabs; each has its animation views plus a "Textbook photos" view (the original textbook pictures, kept).
 *   genetic-variation:   frogs (one species, many looks), response (who is affected when conditions change)
 *   species-diversity:   count (individuals or kinds), composition (same number, different list)
 *   ecosystem-diversity: mosaic (one region, many homes), residents (each home has its residents), boundary (where the line is drawn)
 *   biodiversity-value:  uses (what organisms provide), green (what a green view shows), worth (reasons to keep)
 * Colours (plan 1.4): genetic pink, species cyan, ecosystem green, always together with the name.
 * Each view is drawn by its own module environment_draw_<name>_1024_v1.js, registered as window.EnvironmentDraw[name] (canvas 960x600).
 * While a module is missing a stub is drawn. Every view has s.phase (-1 play all, >=0 hold) and s.start; the module sets s.shown = step.
 * Pictures: environment_ai_1024/ and ecology_ai_1023/ (teacher's Gemini AI illustrations, not photographs); textbook originals: environment_originals_1010_v1/.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps,ORIG=K.ORIG;

// ── textbook originals (kept as the "Textbook photos" view) ───────────────
  const rights = P('原圖取自老師提供的《人類與環境》；原圖作者及個別授權未確認，不宣稱開放授權。', 'Original from the teacher-provided Human Beings and the Environment textbook; its individual creator and licence are unconfirmed, and no open licence is claimed.');
  const pic = (file, name, page, text) => ({ file, name, page, text: P(text[0] + '\n' + rights[0], text[1] + '\n' + rights[1]), sourceInfo: { source: '人類與環境.pdf', file, pdfPage: page - 159, printedPage: page, author: null, licence: null, pageVerification: 'Individually viewed original image and rendered printed page' } });
  const frogs = [
    pic(ORIG+'Im8_80.png', P('斯文豪氏赤蛙：褐色個體', 'Swinhoe\'s frog: brown individual'), 162, P('課本圖例標示為同種蛙的個體。觀察斑紋、體色與背景；照片沒有基因檢測，不能由一種顏色推定一個基因型。', 'The textbook identifies individuals of one frog species. Observe markings, colour and background; there is no genetic test linking each colour to a genotype.')),
    pic(ORIG+'Im10_82.png', P('斯文豪氏赤蛙：綠斑個體', 'Swinhoe\'s frog: green-marked individual'), 162, P('這是同種個體的另一種外觀，不是另一物種的證據。外觀差異可能同時受遺傳與環境影響，照片亮度也不等於性狀差異。', 'A different appearance within the same species is not evidence of a different species. Both heredity and environment can affect traits; photo brightness alone is not a trait difference.')),
    pic(ORIG+'Im12_84.png', P('斯文豪氏赤蛙：綠背個體', 'Swinhoe\'s frog: green-backed individual'), 162, P('與另外兩張比較時，只記可見特徵。三張照片的顯示大小與背景不同，不能用來量真實體長或比較存活率。', 'Compare visible traits with the other two images. Different display sizes and backgrounds cannot establish actual body lengths or survival rates.'))
  ];
  const forest = pic(ORIG+'Im15_96.png', P('森林原圖', 'Forest original'), 163, P('可見樹木、地表植被與山地背景；這是生態系類型的例子，不是完整物種名錄或遺傳調查。', 'Trees, ground vegetation and a mountain background are visible. This exemplifies an ecosystem type, not a complete species inventory or genetic survey.'));
  const desert = pic(ORIG+'Im16_97.png', P('沙漠原圖', 'Desert original'), 163, P('觀察沙丘與少量可見植被。畫面生物少不表示沒有生命；需要相同方法的調查才能比較兩地多樣性。', 'Observe dunes and sparse visible vegetation. Few visible organisms do not mean no life; comparable surveys are needed to compare diversity between sites.'));
  const grassland = pic(ORIG+'Im17_98.png', P('草原原圖', 'Grassland original'), 163, P('草本、樹木與動物同時出現。先區分植被外觀與物種辨識，不以照片動物總數作為物種數。', 'Herbs, trees and animals occur together. Separate vegetation appearance from species identification; the number of animals is not the number of species.'));
  const stream = pic(ORIG+'Im18_99.png', P('淡水溪流原圖', 'Freshwater stream original'), 163, P('觀察溪水、底質及岸邊植被。單張影像不能量流速、溶氧，也看不到所有水中生物。', 'Observe water, substrate and bank vegetation. One image measures neither flow nor dissolved oxygen and cannot show all aquatic organisms.'));
  const reef = pic(ORIG+'Im19_100.png', P('珊瑚礁與魚原圖', 'Reef and fish original'), 163, P('觀察魚的外形與珊瑚構造；珊瑚蟲是動物。此照片不是水質測量，也不是可與其他照片直接相比的物種普查。', 'Observe fish forms and coral structures; coral polyps are animals. This is neither a water-quality measurement nor a species census directly comparable with the other photos.'));
  const rainforest = pic(ORIG+'Im25_226.png', P('熱帶雨林原圖', 'Rainforest original'), 164, P('課本用此圖與棕櫚園提出探究問題。請先描述可見植被層次，再提出待查問題；這張影像沒有物種數、基因資料或拍攝前後的連續紀錄。', 'The textbook pairs this with the plantation to pose an inquiry. Describe visible vegetation layers and identify questions to investigate; there are no species counts, genetic data or continuous before-and-after records.'));
  const plantation = pic(ORIG+'Im26_229.png', P('棕櫚園原圖', 'Palm plantation original'), 164, P('可見較規整的植被排列。這是課本的比較圖，不能假定兩圖是同一地點同一鏡頭，也不能只由綠色面積算多樣性。原書探究問題留待學生討論。', 'Vegetation has a more regular arrangement. These are textbook comparison images, not established same-camera views of the same site. Green area alone does not quantify diversity; the source inquiry remains open for discussion.'));
  const yew = pic(ORIG+'Im35_344.png', P('紅豆杉原圖', 'Yew original'), 167, P('課本討論觀賞、研究或利用價值與野外採集壓力。照片不是藥物使用說明；不採摘、不試吃，也不自行提煉。', 'The textbook discusses ornamental, research or use values alongside pressure from wild collection. This is not a medication guide; do not collect, taste or extract it.'));

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
frogs:{tab:P(`一種，很多樣子`,`One species, many looks`),
 short:[P(`比外表`,`Compare looks`),P(`同種？不同種？`,`Same species?`),P(`看進體內`,`Look inside`),P(`外表≠基因`,`Looks ≠ genes`)],
 names:[P(`六隻異色瓢蟲：底色和斑點都不同`,`Six harlequin ladybirds: colour and spots differ`),P(`長得不一樣，可以是同一種`,`Looking different can still be one species`),P(`鏡頭推進：同一個位置有不同版本`,`Zooming in: one position, different versions`),P(`外表同時受遺傳與環境影響`,`Looks come from both genes and environment`)],
 text:[P(`六隻異色瓢蟲，底色和斑點都不一樣。先只比看得見的特徵：底色、斑點數。（AI 插圖，非實拍。）`,`Six harlequin ladybirds differ in base colour and spots. First compare only what can be seen: colour and spots. (AI illustration, not a photo.)`),
  P(`這六隻都是異色瓢蟲，是同一種。旁邊的七星瓢蟲外表有點像，卻是另一種。長得不一樣不一定是不同種，長得像也不一定是同一種。`,`All six are harlequin ladybirds, one species. The seven-spot ladybird beside them looks somewhat similar but is a different species. Looking different does not mean different species, and looking alike does not mean the same species.`),
  P(`鏡頭推進其中一隻：身體、細胞、染色體上的某個位置。同一種的個體，在同一個位置可以帶不同版本的基因，這就是同種內的遺傳差異。圖是示意，不是真的基因序列。`,`Zoom in on one beetle: body, cell, one position on a chromosome. Individuals of a species can carry different versions of a gene at the same position: genetic differences within a species. The picture is schematic, not a real gene sequence.`),
  P(`兩隻外表一樣的，基因組合可能不同；兩隻外表不同的，也可能基因相同、只是環境不同（例如幼蟲時的溫度）。外表同時受遺傳與環境影響，不能只看外表就讀出基因。`,`Two beetles that look alike may carry different gene combinations; two that look different may carry the same genes and differ only in environment (for example temperature while growing). Looks depend on both genes and environment, so appearance alone cannot reveal the genes.`)]},
response:{tab:P(`環境一變，誰受影響`,`When conditions change`),
 short:[P(`平常的年`,`A normal year`),P(`高溫乾旱`,`Heat and drought`),P(`換一種變動`,`A different change`),P(`作物也一樣`,`Crops too`)],
 names:[P(`平常的年：兩群都沒事`,`A normal year: both groups fine`),P(`變動 A：受影響的是其中一種`,`Change A: one kind is affected`),P(`變動 B：這次換了另一種`,`Change B: a different kind this time`),P(`作物：整片同品種 vs 混種`,`Crops: one variety vs mixed varieties`)],
 text:[P(`左邊這群瓢蟲底色都一樣，右邊這群有三種底色。平常的年份，兩群都過得去，看不出差別。`,`The left group all share one base colour; the right group has three. In a normal year both do fine and no difference shows.`),
  P(`遇到高溫乾旱，左邊整群都受影響；右邊只有其中一種底色受影響，其他還在。示意，不是預測任何物種的存活。`,`In a heat wave with drought the whole left group is affected, while on the right only one base colour is, and the others remain. Schematic; it does not predict the survival of any species.`),
  P(`換成另一種變動，例如新的病，這次受影響的是另一種底色。沒有哪一種在所有環境都占優勢。`,`With a different change, such as a new disease, a different base colour is affected. No kind is best in every condition.`),
  P(`作物也一樣：整片田都是同一個品種，遇到變動就整排受影響；混種幾個品種，通常能留下一部分。保留不同的品種，就是保留不同的反應。`,`Crops work the same way: a field of one variety is affected row after row, while a mix of varieties usually keeps part of the crop. Keeping different varieties keeps different responses.`)]},
count:{tab:P(`數個體，還是數種類`,`Individuals or kinds`),
 short:[P(`數個體`,`Count individuals`),P(`數種類`,`Count kinds`),P(`兩種改變`,`Two changes`),P(`真實場景`,`A real scene`)],
 names:[P(`同樣大的兩個樣區：個體誰多？`,`Two equal plots: which has more individuals?`),P(`同一批動物：種類誰多？`,`The same animals: which has more kinds?`),P(`多一百隻，和多一種`,`A hundred more, or one more kind`),P(`看到的魚，和沒看到的`,`Fish seen, and fish not seen`)],
 text:[P(`A、B 兩個樣區一樣大。數個體：A 有 12 隻，B 有 8 隻，A 比較多。（AI 插圖，非實拍。）`,`Plots A and B are equally large. Counting individuals: A has 12 and B has 8, so A has more. (AI illustrations, not photos.)`),
  P(`同一批動物，按種類分堆：A 只有 3 種，B 有 5 種。個體多，不等於種類多。`,`Sort the same animals by kind: A has only 3 kinds, B has 5. More individuals does not mean more kinds.`),
  P(`A 的某一種再增加一百隻，個體數猛升，種類數不變；B 多出一種新的，種類數加一。兩種改變不是同一件事。`,`If one kind in A increases by a hundred, the individual count jumps but the number of kinds stays; if B gains a new kind, the kinds go up by one. These are different changes.`),
  P(`珊瑚礁的照片：先框出看起來不同的魚，有些無法辨認，不能每隻算一種；沒看到的也不表示不存在。比較前要先寫清楚地點、面積、時間、方法。`,`A reef photo: first outline fish that look different; some cannot be identified and must not each count as one kind; unseen ones may still be there. Before comparing, state place, area, time and method.`)]},
composition:{tab:P(`數一樣，名單不一樣`,`Same number, different list`),
 short:[P(`兩份名單`,`Two lists`),P(`找相同的`,`Find shared`),P(`合起來`,`Combine`),P(`有替代的路`,`Alternative paths`)],
 names:[P(`C、D 兩個地方各 5 種`,`Places C and D: 5 kinds each`),P(`只有 2 種相同`,`Only 2 kinds in common`),P(`合起來是 8 種`,`Together: 8 kinds`),P(`種類多，不保證永遠穩定`,`More kinds does not guarantee stability`)],
 text:[P(`C、D 兩個地方各有 5 種生物，種數一樣。名單並排來看。`,`Places C and D each have 5 kinds, the same number. Look at the two lists side by side.`),
  P(`連線找相同的：只有 2 種相同，另外各 3 種是自己獨有的。`,`Link the matches: only 2 kinds are shared and each place has 3 of its own.`),
  P(`合起來是 8 種，比單看任何一邊都多。如果只保護 C，D 獨有的 3 種就不在名單裡。種數一樣，組成可以不同。`,`Together there are 8 kinds, more than either place alone. If only C were protected, the 3 kinds unique to D would not be on the list. The same number can hide different composition.`),
  P(`把 C 的 5 種畫成小食物網。移走一種時，若牠的天敵還有別的食物來源，那條線亮起來，有緩衝；沒有就斷了。種類多不保證永遠穩定，要看有沒有替代的路。`,`Draw C's 5 kinds as a small food web. If one kind is removed and its predator has another food source, that line lights up as a buffer; if not, the link breaks. More kinds does not guarantee stability; it depends on whether alternative paths exist.`)]},
mosaic:{tab:P(`一個地區的許多住處`,`One region, many homes`),
 short:[P(`看見地區`,`See the region`),P(`切成幾塊`,`Divide it`),P(`條件不同`,`Different conditions`),P(`有幾種？`,`How many kinds?`)],
 names:[P(`一個地區的全景`,`A panorama of one region`),P(`六種不同的生態系`,`Six different ecosystems`),P(`每塊的條件都不一樣`,`Each has different conditions`),P(`生態系多樣性`,`Ecosystem diversity`)],
 text:[P(`一個地區從山到海，慢慢看過去。（AI 插圖，非實拍。）`,`Look slowly across one region from mountain to sea. (AI illustration, not a photo.)`),
  P(`這個地區可以分出森林、草地、農田、溪流、濕地、海岸六種生態系。邊界是漸變的，這裡只是示意。`,`This region can be divided into forest, grassland, farmland, stream, wetland and coast. Boundaries change gradually; this is only schematic.`),
  P(`每一塊的水、光、溫度、鹽度等條件不一樣，所以住的生物也不一樣。`,`Each area has different water, light, temperature and salinity, so different organisms live there.`),
  P(`一個地區有幾種不同的生態系，就是這個地區的生態系多樣性。`,`How many different ecosystems a region holds is that region's ecosystem diversity.`)]},
residents:{tab:P(`各住處，各有居民`,`Each home, its residents`),
 short:[P(`森林`,`Forest`),P(`溪流`,`Stream`),P(`河口濕地`,`Estuary`),P(`搬家測試`,`Moving test`)],
 names:[P(`森林的居民`,`Residents of the forest`),P(`溪流的居民`,`Residents of the stream`),P(`河口濕地的居民`,`Residents of the estuary`),P(`把森林居民搬到沙漠`,`Moving forest residents to a desert`)],
 text:[P(`森林裡住著臺灣藍鵲、山羌、藍腹鷴、臺灣獼猴。（AI 插圖，非實拍。）`,`The forest holds Taiwan blue magpies, Reeves's muntjacs, Swinhoe's pheasants and Formosan macaques. (AI illustrations, not photos.)`),
  P(`溪流裡有苦花、蜉蝣稚蟲、河烏、川蜷，牠們需要流動、乾淨的水。`,`A stream holds Taiwan chubs, mayfly nymphs, brown dippers and freshwater snails, which need flowing, clean water.`),
  P(`河口濕地有彈塗魚、招潮蟹、黑面琵鷺，牠們適應有鹹淡水交會的泥灘。`,`An estuary has mudskippers, fiddler crabs and black-faced spoonbills, suited to muddy flats where fresh and salt water meet.`),
  P(`把森林的居民搬到沙漠，這裡沒有牠們需要的環境，森林那邊的位置也變空了。多樣性靠的是不同的環境，不是把生物搬來搬去。示意，不是真實的移入實驗。`,`Move the forest residents to a desert and the conditions they need are missing, while their places in the forest stand empty. Diversity rests on different environments, not on moving organisms around. Schematic, not a real transplant experiment.`)]},
boundary:{tab:P(`邊界畫在哪裡`,`Where to draw the line`),
 short:[P(`只看池塘`,`The pond only`),P(`擴大範圍`,`A wider area`),P(`依問題決定`,`Set by the question`)],
 names:[P(`研究「池塘裡的生物」`,`Studying "life in the pond"`),P(`研究「整個溪流域」`,`Studying "the whole stream basin"`),P(`邊界依研究的問題而定`,`Boundaries depend on the question`)],
 text:[P(`研究池塘裡的生物，框只需要框住水面。（AI 插圖，非實拍。）`,`To study life in the pond the frame only needs to hold the water. (AI illustration, not a photo.)`),
  P(`研究整個溪流域，框要擴大到岸邊和上游。`,`To study the whole basin, widen the frame to the banks and upstream.`),
  P(`同一張圖裡有陸地也有水域，邊界依研究的問題決定。另外，沙漠也有生物，只是不容易一眼看見。`,`One picture holds both land and water; the boundary is set by the question. Deserts also hold life, just not always visible at a glance.`)]},
uses:{tab:P(`生物提供什麼`,`What organisms provide`),
 short:[P(`食物`,`Food`),P(`衣料與材料`,`Fibres and materials`),P(`研究資源`,`Research resources`),P(`遺傳資源`,`Genetic resources`)],
 names:[P(`食物：不同品種的稻米`,`Food: different rice varieties`),P(`衣料與材料`,`Fibres and materials`),P(`研究與藥物資源`,`Research and medicinal resources`),P(`遺傳資源：保留不同品種`,`Genetic resources: keep varieties`)],
 text:[P(`白米、糙米、黑米、紅米，都是稻米的不同品種。（AI 插圖，非實拍。）`,`White, brown, black and red rice are different varieties of rice. (AI illustrations, not photos.)`),
  P(`棉花、蠶繭、木材、橡膠，都來自生物。`,`Cotton, silk cocoons, timber and rubber all come from organisms.`),
  P(`紅豆杉等植物有研究價值，這是研究價值，不是可以自己食用的藥；不採摘、不試吃。`,`Plants such as yew have research value. That is research value, not a medicine to take yourself; do not pick or taste them.`),
  P(`不同品種的稻米性狀不同，例如耐旱、耐病。保留不同品種與野外的近親，育種時才有選擇。這不代表可以無限制採集。`,`Rice varieties differ in traits such as drought or disease tolerance. Keeping varieties and wild relatives gives breeders choices. That does not mean unlimited collection.`)]},
green:{tab:P(`一片綠，看得出什麼`,`What a green view shows`),
 short:[P(`都很綠`,`Both green`),P(`先觀察`,`Observe first`),P(`還不能說`,`Cannot say yet`),P(`該補什麼`,`What to add`)],
 names:[P(`看起來都很綠`,`Both look green`),P(`看得到的：樹冠的差別`,`What we see: crown differences`),P(`不能直接說的`,`What we cannot say yet`),P(`還需要哪些資料`,`What data we still need`)],
 text:[P(`兩片土地都是綠色的。（AI 插圖，非實拍。）`,`Both pieces of land are green. (AI illustrations, not photos.)`),
  P(`先觀察：樹冠的高度、形狀、排列。這些是看到的，不是物種數。`,`Observe first: crown height, shape and layout. These are what we see, not the number of species.`),
  P(`物種有幾種、動物有哪些、土壤如何，從圖上看不出來，都是待查；兩片土地誰的多樣性高，還沒證明。`,`How many species, which animals and what soil cannot be told from the picture. These are all to check, and which has higher diversity is not shown yet.`),
  P(`要比較，需要相同的樣區大小、相同的調查時間與方法，並重複幾次。這兩張是教學示意，不是同一個地點。`,`To compare we need the same plot size, the same time and method, repeated several times. These two pictures are teaching illustrations, not the same place.`)]},
worth:{tab:P(`值得留的理由`,`Reasons to keep`),
 short:[P(`有用`,`Useful`),P(`文化與美感`,`Culture and beauty`),P(`本身的價值`,`Worth in itself`)],
 names:[P(`對人有用`,`Useful to people`),P(`文化與美感`,`Culture and aesthetics`),P(`生命本身的價值`,`The value of life itself`)],
 text:[P(`食物、材料、研究資源，是生物對人有用的地方。`,`Food, materials and research resources are ways organisms are useful to people.`),
  P(`生物也和文化、節慶、景觀、美感有關。`,`Organisms are tied to culture, festivals, landscapes and beauty.`),
  P(`生物本身也有存在的價值。有用途不代表可以無限採集；保育也不只看能不能換成金錢。`,`Organisms also have value in themselves. Usefulness does not mean unlimited collection, and conservation is not only about what can be turned into money.`)]}
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
{id:'genetic-variation',title:P(`同種也不一樣`,`One species, different individuals`),sub:P(`遺傳多樣性`,`Genetic diversity`),
 hook:P(`上一單元問的是：換個環境，誰能住下來？這一課換個問法：住下來的，有幾種？一樣嗎？值得留嗎？先從最小的差異看起：三隻青蛙顏色不同，就一定是三種青蛙嗎？`,`The last unit asked: in a different habitat, who can live there? This lesson asks differently: of those that live there, how many kinds? Are they alike? Are they worth keeping? Start with the smallest difference: if three frogs have different colours, must they be three species?`),
 body:P(`生物多樣性包含遺傳、物種與生態系三個面向。同種個體可以有不同的基因組合，稱為遺傳多樣性。外表不同不一定是不同物種，也不能只看體色就讀出基因。`,`Biodiversity has three aspects: genetic, species and ecosystem diversity. Individuals of one species can carry different genetic combinations: genetic diversity. Different looks need not mean different species, and colour alone cannot reveal genes.`),
 reading:P(`保持遺傳差異，可能保留面對環境變動的不同反應；不是每個性狀在所有環境都有利。體色、背景與光線要分開觀察。動畫用瓢蟲的底色與斑點作例子，基因的圖是示意，沒有測定任何基因。三個面向在本課只做概述，不延伸成高中遺傳計算。`,`Keeping genetic variation may keep different responses to changing conditions; no trait is advantageous in every environment. Separate body colour from lighting and background. The animation uses ladybird colours and spots as an example and the gene pictures are schematic, with no gene measured. The three aspects are only introduced here, not extended into advanced genetic calculations.`),
 closure:P(`同種個體可以不同；觀察外形與確認遺傳差異是兩件事。`,`Individuals of one species can differ; observing appearance and establishing genetic differences are different things.`),
 quiz:[
  MC(P(`三隻青蛙顏色不同，一定是三種青蛙嗎？`,`Three frogs have different colours. Must they be three species?`),P('不一定，同種個體也可以長得不同','Not necessarily; one species can look varied'),P('是，只要顏色不同就一定是不同種','Yes, different colours mean different species'),P('三隻一定全部都是同一個種的青蛙','They must all be one single species of frog'),P('顏色和物種完全無關，不必觀察','Colour has nothing at all to do with species'),0,P(`外表不同不一定是不同種，長得像也不一定是同種。`,`Looking different does not mean different species, and looking alike does not mean the same species.`),P(`看第二步。`,`Look at step two.`)),
  MC(P(`關於「外表」和「基因」，哪一句最合理？`,`Which statement about looks and genes is most reasonable?`),P('外表同時受遺傳與環境影響','Looks depend on genes and environment'),P('外表一樣，基因就一定一樣','Same looks always mean the same genes'),P('外表完全都只由基因來決定','Looks depend only on the genes inside'),P('看體色就能完全讀出基因型','Body colour alone reveals the genotype'),0,P(`外表是遺傳與環境共同的結果，不能只看外表讀基因。`,`Looks come from genes and environment together, so appearance alone cannot reveal genes.`),P(`看第四步。`,`Look at step four.`))]},
{id:'species-diversity',title:P(`多幾隻，還是多幾種？`,`More individuals or more species?`),sub:P(`物種多樣性`,`Species diversity`),
 hook:P(`同一種魚增加一百隻，和多出另一種魚，是同一種改變嗎？`,`Are a hundred more fish of one kind and one additional kind of fish the same change?`),
 body:P(`物種多樣性關心一個地方有哪些物種、組成如何，不只是個體的總數。增加同種的個體不等於增加物種數。比較不同地方之前，要先說清楚地點、面積、時間與方法。`,`Species diversity concerns which species an area has and what the composition is, not just the total number of individuals. More individuals of one species do not add species. Before comparing places, state the place, area, time and method.`),
 reading:P(`比較前要說清楚地點、面積、時間與調查方法。珊瑚礁的照片可以看到不同外形的魚，但未辨認的魚不能每隻算一種；看不到的生物也不表示不存在。動畫裡的圖形與數字是教學示意，沒有計算真實的食物網穩定度，也不是物種數的估計。`,`State place, area, time and survey method before comparing. A reef photo shows fish of different forms, but unidentified fish cannot each count as one species, and unseen organisms may still be present. The shapes and numbers in the animations are teaching illustrations; they do not compute real food-web stability or estimate species numbers.`),
 closure:P(`個體數和物種數要分開；比較多樣性還要看組成與方法。`,`Keep individual counts and species counts apart; comparing diversity also depends on composition and method.`),
 quiz:[
  MC(P(`樣區 A 有 12 隻動物、3 種；樣區 B 有 8 隻、5 種。哪一個的物種多樣性較高？`,`Plot A has 12 animals of 3 kinds; plot B has 8 of 5 kinds. Which has higher species diversity?`),P('A，因為個體比較多','A, because it has more animals'),P('B，因為種類比較多','B, because it has more kinds'),P('兩者的多樣性一樣高','They are exactly the same'),P('無法比較，永遠不比','They can never be compared'),1,P(`物種多樣性看種類與組成，不是只看個體總數。`,`Species diversity looks at kinds and composition, not only the total number of individuals.`),P(`看第二步。`,`Look at step two.`)),
  MC(P(`比較兩個地方的物種多樣性之前，應該先做什麼？`,`What should be done before comparing species diversity of two places?`),P('把看不清的魚都算成一種','Count every unclear fish as a species'),P('直接比兩張照片好不好看','Compare which photo looks better'),P('說清楚地點、時間與方法','State place, area, time and method'),P('只數其中最大的那一種動物','Count only the biggest kind there'),2,P(`方法不同，結果不能直接比。`,`With different methods the results cannot be compared directly.`),P(`看第四步。`,`Look at step four.`))]},
{id:'ecosystem-diversity',title:P(`不同住處，不同條件`,`Different homes, different conditions`),sub:P(`生態系多樣性`,`Ecosystem diversity`),
 hook:P(`把森林的生物都搬到沙漠，就能讓兩地一樣多樣嗎？`,`Would moving all the forest organisms to a desert make the two places equally diverse?`),
 body:P(`森林、沙漠、草原、淡水與海洋的環境與生物群集都不同，是生態系多樣性的例子。水分、光照、溫度與底質等條件影響生物能不能生活。保育不只保留物種名單，也要維護支持生命的環境與相互作用。`,`Forests, deserts, grasslands, fresh waters and oceans have different conditions and communities, which illustrates ecosystem diversity. Water, light, temperature and substrate influence whether organisms can live. Conservation keeps more than a species list; it also maintains the environments and interactions that support life.`),
 reading:P(`同一張圖可能同時含有陸地和水域，生態系的邊界要依研究的目的來界定。一張照片只呈現一個地方的一個時刻，不能代表這類環境的所有情形，也不能把沙漠說成沒有生物。動畫的地景與圖示是示意，不是真實面積、雨量或物種調查。`,`One picture may hold both land and water; ecosystem boundaries depend on the purpose of the study. A photograph shows one place at one moment and cannot stand for every case of that environment, and deserts must not be called lifeless. The landscapes and icons in the animations are schematic, not real areas, rainfall or species surveys.`),
 closure:P(`不同的環境支持不同的生命；保護生物，也要保護棲地。`,`Different environments support different lives; protect organisms together with habitat.`),
 quiz:[
  MC(P(`把森林的生物搬到沙漠，兩地會變得一樣多樣嗎？`,`Would moving forest organisms to a desert make both places equally diverse?`),P('不會，沙漠不一定有牠們要的條件','No, the conditions they need may be missing'),P('會，因為生物到哪裡都能活下來','Yes, organisms can live almost anywhere there'),P('會，因為生物都會自己去適應環境','Yes, because they adapt to it by themselves'),P('森林那一邊完全不會有任何的改變','Nothing at all would change in the forest here'),0,P(`多樣性靠不同的環境，不是把生物搬來搬去。`,`Diversity rests on different environments, not on moving organisms around.`),P(`看「各住處，各有居民」第四步。`,`See "Each home, its residents", step four.`)),
  MC(P(`一個地區有森林、溪流、濕地和海岸，這說明什麼？`,`A region has forest, stream, wetland and coast. What does this show?`),P('這個地區的生態系多樣性高','The place has high ecosystem diversity'),P('這個地區的遺傳多樣性高','The region has high genetic diversity'),P('每一塊的生物種類一定一樣','Every area has exactly the same species'),P('沒有生物住在邊界上','No organism lives on the boundaries'),0,P(`有幾種不同的生態系，就是生態系多樣性。`,`How many different ecosystems there are is the ecosystem diversity.`),P(`看「一個地區的許多住處」第四步。`,`See "One region, many homes", step four.`))]},
{id:'biodiversity-value',title:P(`一片綠，代表什麼？`,`What does a green view tell us?`),sub:P(`生活資源與生物價值`,`Resources and the value of life`),
 hook:P(`看起來都很綠，我們還需要觀察什麼，才能比較兩片土地？`,`If two lands both look green, what else must we observe before comparing them?`),
 body:P(`食物、衣料、木材、橡膠、研究資源與遊憩，都和生物多樣性有關。遺傳資源可以用在作物育種，生物也有文化、美感與本身存在的價值。有用途不代表可以無限制採集，保育也不只看能不能換成金錢。`,`Food, fibres, timber, rubber, research materials and recreation all connect to biodiversity. Genetic resources can serve crop breeding, and organisms also have cultural, aesthetic and intrinsic value. Usefulness does not justify unlimited collection, and conservation is not only about money.`),
 reading:P(`探究：熱帶雨林開發成棕櫚園後，多樣性可能怎麼變？可能造成什麼影響？請用照片提出觀察、推論與待查的資料，先保留問題，不預填解答。動畫的兩片森林是另一組教學示意，不是課本照片的重建，也不能取代現地調查。醫藥研究價值不等於植物可以自己食用。`,`Inquiry: how might biodiversity change when rainforest becomes a palm plantation, and what effects might follow? Use the photos to record observations, inferences and data still needed, leaving the question open. The two forests in the animation are a separate teaching illustration, not a reconstruction of the textbook photos, and cannot replace a field survey. Medical research value does not mean a plant is safe to eat.`),
 closure:P(`綠色覆蓋不是多樣性的測量；用途、文化與生命本身的價值，都值得考慮。`,`Green cover is not a measure of biodiversity; use, culture and the value of life itself all deserve consideration.`),
 quiz:[
  MC(P(`兩片土地看起來都很綠，可以直接說牠們的多樣性一樣高嗎？`,`Two lands both look green. Can we say their diversity is equally high?`),P('不可以，要用相同方法調查','No, both must be surveyed with one method'),P('可以，因為綠色就代表多樣','Yes, a green colour always means very diverse'),P('可以，只要看樹冠高度就好','Yes, you only need to look at crown height'),P('不可以，因為綠色是假的喔','No, because the green colour is just fake'),0,P(`綠色覆蓋不是多樣性的測量。`,`Green cover is not a measure of diversity.`),P(`看「一片綠，看得出什麼」第三步。`,`See "What a green view shows", step three.`)),
  MC(P(`關於生物的價值，哪一句最合理？`,`Which statement about the value of organisms is most reasonable?`),P('有用途，也有文化與美感價值','Organisms have uses and also cultural value'),P('只要有用途就可以無限制採集','If useful, they can be collected without limit'),P('只有能換成錢的東西才有價值','Only what can be turned into money has value'),P('紅豆杉可以自己隨便採來食用','Yew can be picked freely and then eaten raw'),0,P(`用途不是唯一的理由，也不代表可以無限採集。`,`Use is not the only reason, and it does not permit unlimited collection.`),P(`看「值得留的理由」第三步。`,`See "Reasons to keep", step three.`))]}
];
const defs=[
 [['frogs','response'],[frogs[0],frogs[1],frogs[2]]],
 [['count','composition'],[reef,grassland]],
 [['mosaic','residents','boundary'],[forest,desert,grassland,stream,reef]],
 [['uses','green','worth'],[rainforest,plantation,yew]]];
tabs.forEach((t,i)=>Object.assign(t,make(defs[i][0],defs[i][1])));
// the bridge sentence is only needed on the first tab; other tabs keep their old hooks
B.register({id:'environmental_diversity',title:P(`生命的多樣，怎麼看、怎麼比？`,`How do we look at and compare the variety of life?`),subtitle:P(`遺傳、物種與生態系多樣性，與生物的價值`,`Genetic, species and ecosystem diversity, and the value of life`),cover:'assets/covers/biology_environmental_diversity_1024_v1.jpg',
 assetDir:'assets/biology/environment_ai_1024/',family:P(`生命與環境`,`Life and environment`),bookName:P(`人類與環境`,`Humans and the environment`),tabs});
})();
