/* Naming and classification (Life on Earth) · teacher-requested V5 rebuild, 2026-10-21.
 * Five tabs: binomial names (two martens; the Taiwan serow and a longhorn beetle that share an epithet), the seven
 * ranks (a rank ladder for two animals and a left-to-right classification tree of seven), the five kingdoms (a
 * decision flow for five specimens and a trait table), a dichotomous key (two keys, four insects, answered by the
 * student or watched) and species versus breeds (dogs, cats, horse × donkey).
 * Pictures: naming_ai_1021/ (AI illustrations made by the teacher, not photographs; drawn sizes are not real sizes
 * except in the dog real-size step). Nostoc, the fern and the sea star are chalk drawings in code.
 * Colours: genus yellow, specific epithet cyan; shared / matching green with a tick; differing / split orange.
 * Wording: TXT is the single source of truth, copied verbatim from the content file; canvas-only labels are P(zh,en).
 * Multiple-choice checks: genetics_quiz_1020_v1.js.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const TXT={
// ───────────────────────── Tab 1: names ─────────────────────────
names:{
 title:P(`同一個字，不一定同種`,`One shared word is not one species`),
 sub:P(`二名法`,`Binomial names`),
 hook:P(`「貂」到底是哪一種貂？黃喉貂和美洲貂長得有點像，都叫貂，科學家怎麼確定大家講的是同一種動物？`,`Which "marten" do you mean? The yellow-throated marten and the American marten look alike and share a common name, so how do scientists make sure everyone means the same animal?`),
 body:P(`先選一組動物，再一步一步看：完整的學名是什麼、怎麼拆開、哪一部分相同、能不能因此說牠們是近親。`,`Pick a pair, then step through: what the full name is, how it splits, which part is shared and whether that makes them close relatives.`),
 reading:P(`學名由兩個部分組成，叫二名法，是瑞典的林奈（Linnaeus）整理推廣的：第一個字是屬名，第二個字是種小名。屬名的第一個字母大寫，種小名全部小寫；印刷時用斜體，手寫時在名字下畫線。全世界用同一套學名，才不會因為各地俗名不同而搞混。\n\n補充：swinhoei 是「郇和的」的意思，紀念十九世紀在臺灣調查生物的英國人郇和（Robert Swinhoe）。以他命名的生物很多，不同屬的生物也可以紀念同一個人，所以種小名相同，不代表有親戚關係。`,`A scientific name has two parts (binomial nomenclature), organised and popularised by Carl Linnaeus of Sweden: the first word is the genus and the second is the specific epithet. The genus starts with a capital letter and the epithet is all lower case; names are printed in italics, or underlined when handwritten. One name used worldwide avoids the confusion of local common names.\n\nExtra: swinhoei means "of Swinhoe" and honours Robert Swinhoe, a British naturalist who surveyed Taiwan's wildlife in the 19th century. Many organisms are named after him, and unrelated genera can honour the same person, so sharing an epithet does not mean being relatives.`),
 closure:P(`學名用屬名加種小名兩個字，全世界通用。屬名相同，表示同一屬、親緣較近；種小名相同卻屬名不同，是不同屬的兩種生物，不是近親。看學名一定要看完整的兩個字。`,`A scientific name is a genus plus a specific epithet, used worldwide. A shared genus means the same genus and closer kinship; a shared epithet under different genera belongs to two organisms in different genera and is not a sign of kinship. Always read both words of the name.`),
 // controls
 pairs:[
  {label:P(`貂`,`Martens`),a:{pic:'marten_yellow_throated.png',common:P(`黃喉貂`,`Yellow-throated marten`),genus:`Martes`,epithet:`flavigula`,place:P(`臺灣、亞洲`,`Taiwan, Asia`)},b:{pic:'marten_american.png',common:P(`美洲貂`,`American marten`),genus:`Martes`,epithet:`americana`,place:P(`北美洲`,`North America`)},shared:'genus'},
  {label:P(`野山羊與天牛`,`Serow and beetle`),a:{pic:'serow.png',common:P(`臺灣長鬃山羊`,`Taiwan serow`),genus:`Capricornis`,epithet:`swinhoei`,place:P(`哺乳動物`,`A mammal`)},b:{pic:'longhorn_beetle.png',common:P(`天牛`,`Longhorn beetle`),genus:`Paraglenea`,epithet:`swinhoei`,place:P(`昆蟲`,`An insect`)},shared:'epithet'}
 ],
 stepShort:[P(`認識`,`Meet`),P(`學名`,`Name`),P(`拆開`,`Split`),P(`比一比`,`Compare`),P(`寫法`,`Writing`)],
 stepTitle:[P(`兩種動物`,`Two animals`),P(`每種生物一個學名`,`One scientific name each`),P(`拆成兩部分`,`Split into two parts`),P(`哪裡一樣？`,`What is shared?`),P(`學名怎麼寫`,`How to write a name`)],
 stepText:[
  [ // pair 0: martens
   P(`黃喉貂（臺灣有）和美洲貂（北美洲有）：長得像，俗名都有「貂」。只看俗名，分不清是同一種還是兩種。`,`The yellow-throated marten (found in Taiwan) and the American marten (found in North America) look alike and both have "marten" in their names. The common names alone do not tell us whether they are one species or two.`),
   P(`黃喉貂的學名是 Martes flavigula，美洲貂是 Martes americana。學名由兩個字組成，全世界都這樣寫。`,`The yellow-throated marten is Martes flavigula and the American marten is Martes americana. A scientific name has two words, written the same way worldwide.`),
   P(`第一個字是屬名（黃色），第二個字是種小名（青色）。把兩種動物的名字上下對齊，看哪一部分一樣。`,`The first word is the genus (yellow) and the second is the specific epithet (cyan). Line the two names up and see which part is the same.`),
   P(`屬名都是 Martes：同一屬，親緣較近。種小名不同（flavigula 和 americana），所以是不同種。`,`Both genera are Martes: same genus, closer kinship. The epithets differ (flavigula and americana), so they are different species.`),
   P(`屬名第一個字母大寫，種小名全部小寫；印刷用斜體，手寫在名字下面畫線。引用學名一定要寫完整的兩個字。`,`Capitalise the first letter of the genus and write the epithet in lower case; italic in print, underlined by hand. Always quote both words.`)
  ],
  [ // pair 1: serow / beetle
   P(`臺灣長鬃山羊是哺乳動物，天牛是昆蟲，差很多。可是牠們的學名裡，有一個一模一樣的字。`,`The Taiwan serow is a mammal and the longhorn beetle is an insect; they are very different. Yet one word in their scientific names is exactly the same.`),
   P(`臺灣長鬃山羊是 Capricornis swinhoei，天牛是 Paraglenea swinhoei。第二個字一樣，是巧合嗎？`,`The Taiwan serow is Capricornis swinhoei and the longhorn beetle is Paraglenea swinhoei. Is the identical second word a coincidence?`),
   P(`第一個字是屬名（黃色），第二個字是種小名（青色）。把兩種動物的名字上下對齊，看哪一部分一樣。`,`The first word is the genus (yellow) and the second is the specific epithet (cyan). Line the two names up and see which part is the same.`),
   P(`種小名都是 swinhoei，但屬名不同（Capricornis 和 Paraglenea）：是不同屬、不同種，也不是近親。種小名只有放在同一屬裡才有意義。`,`The epithets are both swinhoei, but the genera differ (Capricornis and Paraglenea): different genera and different species, not relatives. An epithet only means something inside its own genus.`),
   P(`屬名第一個字母大寫，種小名全部小寫；印刷用斜體，手寫在名字下面畫線。引用學名一定要寫完整的兩個字。`,`Capitalise the first letter of the genus and write the epithet in lower case; italic in print, underlined by hand. Always quote both words.`)
  ]
 ],
 quiz:[
  {q:P(`Martes flavigula 和 Martes americana，哪一句話正確？`,`Martes flavigula and Martes americana: which statement is correct?`),options:[P('同一屬、不同種','Same genus, different species'),P('同一屬、同一種','Same genus and the same species'),P('不同屬、不同種','Different genera and species'),P('不同屬、同一種','Different genera, same species')],answer:0,why:P(`屬名都是 Martes，所以同一屬；種小名不同，所以是兩種不同的動物。`,`Both genera are Martes, so they share a genus; the epithets differ, so they are two different species.`),hint:P(`先看第一個字，再看第二個字。`,`Compare the first word, then the second.`)},
  {q:P(`Capricornis swinhoei 和 Paraglenea swinhoei 的第二個字相同，下列何者正確？`,`Capricornis swinhoei and Paraglenea swinhoei share the second word. Which statement is correct?`),options:[P('第二個字相同，所以親緣最近','The second word is the same, so they are close relatives'),P('第二個字相同，所以是同一種','The second word is the same, so they are one species'),P('屬名不同，是不同屬的生物','The genera differ, so they are not close relatives'),P('其中有一個學名一定寫錯了','One of the two names was simply written wrongly')],answer:2,why:P(`種小名要和屬名一起看。屬名不同，就是不同屬、不同種；swinhoei 只是紀念同一個人。`,`An epithet must be read with its genus. Different genera mean different species; swinhoei simply honours the same person.`),hint:P(`切到「比一比」，看哪一部分相同。`,`Switch to "Compare" and see which part is shared.`)},
  {q:P(`下列哪一個學名寫法正確？`,`Which way of writing a scientific name is correct?`),options:[P('martes Flavigula','martes Flavigula'),P('Martes flavigula','Martes flavigula'),P('MARTES FLAVIGULA','MARTES FLAVIGULA'),P('Martes Flavigula','Martes Flavigula')],answer:1,why:P(`屬名第一個字母大寫，種小名全部小寫，印刷用斜體。`,`The genus starts with a capital and the epithet is all lower case, in italics when printed.`),hint:P(`切到「寫法」，看大寫和小寫。`,`Switch to "Writing" and look at the capital and lower-case letters.`)}
 ]
},

// ───────────────────────── Tab 2: ranks ─────────────────────────
ranks:{
 title:P(`一層一層縮小範圍`,`Narrowing the scope`),
 sub:P(`界門綱目科屬種`,`Kingdom to species`),
 hook:P(`收信的地址從縣市、區、路寫到門牌，一層比一層小。每一種生物也有自己的「地址」，從界一路寫到種。猜猜看，狼的地址跟郊狼比較像，還是跟馬比較像？`,`A postal address goes from city to district to street to house number, each level narrower. Every organism has an "address" too, from kingdom down to species. Is the wolf's address more like the coyote's or the horse's?`),
 body:P(`選一組動物，看牠們的「地址」從哪一層開始不一樣；再切到「全部放一起」，看這些動物在分類樹上怎麼分開。`,`Pick a pair and see at which level their "addresses" start to differ; then switch to "All together" to see how the animals branch on the classification tree.`),
 reading:P(`分類的七個基本階層，由大到小是界、門、綱、目、科、屬、種。階層越小，包含的生物越少，彼此的共同特徵越多，通常親緣也越近。分類是人根據構造、發育與 DNA 等證據訂出來的；有了新證據，分類有時會修改。\n\n補充：英文是 kingdom、phylum、class、order、family、genus、species。圖中沒有畫出的階層用「…」表示。`,`The seven main ranks, from largest to smallest, are kingdom, phylum, class, order, family, genus and species. The smaller the rank, the fewer organisms it holds and the more traits they share, which usually means closer kinship. People set up the classification from structure, development and DNA evidence; new evidence sometimes changes it.\n\nExtra: ranks not shown in the picture are marked "…".`),
 closure:P(`分類階層像一層層縮小的範圍：界最大，種最小。兩種生物一路相同到愈小的階層，共同特徵愈多、親緣愈近。狼和郊狼同屬，狼和貓同目，狼和馬同綱，狼和蜘蛛只有同界。`,`The ranks are nested groups that narrow down: kingdom is the largest and species the smallest. The further down the ranks two organisms stay together, the more traits they share and the closer their kinship. Wolf and coyote share a genus, wolf and cat share an order, wolf and horse share a class, and wolf and spider share only a kingdom.`),
 // ranks, large to small
 rankNames:[P(`界`,`Kingdom`),P(`門`,`Phylum`),P(`綱`,`Class`),P(`目`,`Order`),P(`科`,`Family`),P(`屬`,`Genus`),P(`種`,`Species`)],
 // the seven animals; `chain` = taxon at each rank (null = not shown, drawn as "…"); pic = file in naming_ai_1021/
 animals:{
  wolf:{pic:'wolf.png',name:P(`狼`,`Wolf`),chain:[P(`動物界`,`Animalia`),P(`脊索動物門`,`Chordata`),P(`哺乳綱`,`Mammalia`),P(`食肉目`,`Carnivora`),P(`犬科`,`Canidae`),P(`犬屬`,`Canis`),P(`狼`,`Canis lupus`)]},
  coyote:{pic:'coyote.png',name:P(`郊狼`,`Coyote`),chain:[P(`動物界`,`Animalia`),P(`脊索動物門`,`Chordata`),P(`哺乳綱`,`Mammalia`),P(`食肉目`,`Carnivora`),P(`犬科`,`Canidae`),P(`犬屬`,`Canis`),P(`郊狼`,`Canis latrans`)]},
  cat:{pic:'cat_tabby.png',name:P(`家貓`,`Domestic cat`),chain:[P(`動物界`,`Animalia`),P(`脊索動物門`,`Chordata`),P(`哺乳綱`,`Mammalia`),P(`食肉目`,`Carnivora`),P(`貓科`,`Felidae`),P(`貓屬`,`Felis`),P(`家貓`,`Felis catus`)]},
  horse:{pic:'horse_bay.png',name:P(`馬`,`Horse`),chain:[P(`動物界`,`Animalia`),P(`脊索動物門`,`Chordata`),P(`哺乳綱`,`Mammalia`),P(`奇蹄目`,`Perissodactyla`),P(`馬科`,`Equidae`),P(`馬屬`,`Equus`),P(`馬`,`Equus caballus`)]},
  spider:{pic:'spider.png',name:P(`蜘蛛`,`Spider`),chain:[P(`動物界`,`Animalia`),P(`節肢動物門`,`Arthropoda`),P(`蛛形綱`,`Arachnida`),P(`蜘蛛目`,`Araneae`),null,null,null]},
  crab:{pic:'crab.png',name:P(`螃蟹`,`Crab`),chain:[P(`動物界`,`Animalia`),P(`節肢動物門`,`Arthropoda`),P(`軟甲綱`,`Malacostraca`),P(`十足目`,`Decapoda`),null,null,null]},
  snail:{pic:'snail.png',name:P(`蝸牛`,`Snail`),chain:[P(`動物界`,`Animalia`),P(`軟體動物門`,`Mollusca`),P(`腹足綱`,`Gastropoda`),null,null,null,null]}
 },
 // comparison presets: [animal A, animal B, rank index where they first differ]
 pairs:[
  {a:'wolf',b:'coyote',split:6},{a:'wolf',b:'cat',split:4},{a:'wolf',b:'horse',split:3},{a:'wolf',b:'spider',split:1},{a:'spider',b:'crab',split:2},{a:'crab',b:'snail',split:1}
 ],
 pairLabel:[P(`狼和郊狼`,`Wolf and coyote`),P(`狼和家貓`,`Wolf and cat`),P(`狼和馬`,`Wolf and horse`),P(`狼和蜘蛛`,`Wolf and spider`),P(`蜘蛛和螃蟹`,`Spider and crab`),P(`螃蟹和蝸牛`,`Crab and snail`)],
 viewLabel:[P(`比兩種`,`Compare two`),P(`全部放一起`,`All together`)],
 cmpStepShort:[P(`看動物`,`Animals`),P(`比地址`,`Addresses`),P(`哪裡分開`,`Split`)],
 cmpStepTitle:[P(`兩種動物`,`Two animals`),P(`比地址`,`Compare addresses`),P(`在哪一層分開？`,`Where do they split?`)],
 // step 0 text is built from the animal names: P(`${A}和${B}：先看牠們的樣子，猜猜看，牠們的分類「地址」會從哪一層開始不一樣？`, `${A} and ${B}: look at them first. At which rank will their classification "addresses" start to differ?`)
 cmpText0:(A,B)=>P(`${A[0]}和${B[0]}：先看牠們的樣子，猜猜看，牠們的分類「地址」會從哪一層開始不一樣？`,`${A[1]} and ${B[1]}: look at them first. At which rank will their classification "addresses" start to differ?`),
 cmpText1:P(`從界往下，一層一層比。相同的階層打勾，第一個不一樣的階層標成橘色。`,`Compare from kingdom downwards. Matching ranks get a tick; the first rank that differs turns orange.`),
 cmpText2:[
  P(`一路相同到屬（都是犬屬 Canis），到了種才不一樣：狼 Canis lupus、郊狼 Canis latrans。這是這幾種動物裡關係最近的一組。`,`They match all the way down to the genus (both Canis) and differ only at species: wolf Canis lupus, coyote Canis latrans. This is the closest pair here.`),
  P(`界、門、綱、目都相同（都是哺乳綱食肉目），到了科才不一樣：狼是犬科，家貓是貓科。`,`Kingdom, phylum, class and order all match (both are mammals in the order Carnivora); they differ at family: the wolf is a canid and the domestic cat a felid.`),
  P(`界、門、綱相同（都是哺乳綱），到了目就不一樣：狼是食肉目，馬是奇蹄目。`,`Kingdom, phylum and class match (both are mammals), but they differ at order: the wolf is in Carnivora and the horse in Perissodactyla.`),
  P(`只有界相同（都是動物界），到了門就不一樣：狼是脊索動物門，蜘蛛是節肢動物門。`,`Only the kingdom matches (both are animals); they differ at phylum: the wolf is a chordate and the spider an arthropod.`),
  P(`界、門相同（都是節肢動物門），到了綱才不一樣：蜘蛛是蛛形綱，螃蟹是軟甲綱。`,`Kingdom and phylum match (both are arthropods); they differ at class: the spider is an arachnid and the crab a malacostracan.`),
  P(`只有界相同，到了門就不一樣：螃蟹是節肢動物門，蝸牛是軟體動物門。`,`Only the kingdom matches; they differ at phylum: the crab is an arthropod and the snail a mollusc.`)
 ],
 treeStepShort:[P(`動物界`,`Kingdom`),P(`分成門`,`Phyla`),P(`分成綱`,`Classes`),P(`再分下去`,`Further`)],
 treeStepTitle:[P(`都是動物界`,`All in the animal kingdom`),P(`分成三個門`,`Three phyla`),P(`再分成綱`,`Classes`),P(`哺乳綱再分下去`,`Splitting the mammals further`)],
 treeStepText:[
  P(`這七種動物都在動物界。從這裡開始，一層一層分開。`,`All seven animals are in the animal kingdom. From here they split level by level.`),
  P(`狼、郊狼、家貓和馬有脊椎，是脊索動物門；蜘蛛和螃蟹有外骨骼和分節的腳，是節肢動物門；蝸牛身體柔軟，是軟體動物門。`,`The wolf, coyote, cat and horse have backbones: phylum Chordata. The spider and crab have an exoskeleton and jointed legs: phylum Arthropoda. The snail has a soft body: phylum Mollusca.`),
  P(`四種哺乳動物都在哺乳綱；蜘蛛是蛛形綱，螃蟹是軟甲綱，蝸牛是腹足綱。`,`The four mammals are all in class Mammalia; the spider is an arachnid, the crab a malacostracan and the snail a gastropod.`),
  P(`哺乳綱裡，狼、郊狼和家貓是食肉目，馬是奇蹄目；食肉目再分成犬科和貓科；狼和郊狼同屬犬屬，到了種才分開。蜘蛛是蜘蛛目，螃蟹是十足目。`,`Among the mammals, the wolf, coyote and cat are in the order Carnivora and the horse is in Perissodactyla; Carnivora splits into canids and felids; the wolf and coyote share the genus Canis and split only at species. The spider is in Araneae and the crab in Decapoda.`)
 ],
 quiz:[
  {q:P(`狼和家貓，從哪一個階層開始不一樣？`,`At which rank do the wolf and the domestic cat first differ?`),options:[P('科這一個階層','At the family rank'),P('目這一個階層','At the order rank'),P('屬這一個階層','At the genus rank'),P('界這一個階層','At the kingdom rank')],answer:0,why:P(`兩者同為哺乳綱食肉目，到了科才分開：狼是犬科，家貓是貓科。`,`Both are mammals in Carnivora and split at family: the wolf is a canid and the cat a felid.`),hint:P(`切到「比兩種」，選「狼和家貓」，看橘色出現在哪一層。`,`Switch to "Compare two", choose wolf and cat, and see where orange appears.`)},
  {q:P(`下列哪一組生物的分類關係最近？`,`Which pair is the most closely related?`),options:[P('狼和郊狼','Wolf and coyote'),P('狼和家貓','Wolf and the cat'),P('狼和馬','Wolf and horse'),P('狼和蜘蛛','Wolf and spider')],answer:0,why:P(`狼和郊狼同屬（犬屬），共同的階層最多；其他組更早就分開了。`,`Wolf and coyote share a genus, the most ranks in common; the other pairs split earlier.`),hint:P(`數一數每一組一路相同到第幾層。`,`Count how many ranks each pair shares.`)},
  {q:P(`七個基本階層，由大到小的順序是？`,`What is the order of the seven main ranks, largest to smallest?`),options:[P(`界、門、綱、目、科、屬、種`,`Kingdom, phylum, class, order, family, genus, species`),P(`種、屬、科、目、綱、門、界`,`Species, genus, family, order, class, phylum, kingdom`),P(`界、綱、門、目、科、屬、種`,`Kingdom, class, phylum, order, family, genus, species`),P(`界、門、綱、科、目、屬、種`,`Kingdom, phylum, class, family, order, genus, species`)],answer:0,why:P(`口訣「界門綱目科屬種」。越往後範圍越小，共同特徵越多。`,`The mnemonic is "kingdom, phylum, class, order, family, genus, species". Further down, the group is smaller and shares more traits.`),hint:P(`切到「全部放一起」，從左看到右。`,`Switch to "All together" and read from left to right.`)}
 ]
},

// ───────────────────────── Tab 3: kingdoms ─────────────────────────
kingdoms:{
 title:P(`綠色，不保證是植物`,`Green does not guarantee a plant`),
 sub:P(`五界的判準`,`Criteria of the five kingdoms`),
 hook:P(`石蓴綠綠的，像一片菜葉；竹蓀長在地上，看起來也像植物。顏色綠或長在地上，就一定是植物嗎？`,`Sea lettuce is green like a leaf, and a stinkhorn grows from the ground like a plant. Does being green or growing on land make something a plant?`),
 body:P(`選一種生物，跟著問題一步一步走，看牠落在哪一界；也可以切到「五界一覽」，比較每一界的特徵。`,`Pick an organism and follow the questions to see which kingdom it falls in; or switch to "Five kingdoms" to compare the traits of each kingdom.`),
 reading:P(`本單元用五界的分法：原核生物界、原生生物界、真菌界、植物界、動物界。判斷時看細胞有沒有細胞核、細胞壁、葉綠體，以及身體的構造和取得養分的方式，不能只看顏色、大小或名字。\n\n補充：這個流程是為了這一課的例子整理出來的，不是所有生物的標準流程。現代科學家還會比較 DNA，有人把生物分成三域，五界不是唯一的分法。\n\n補充：病毒外面是蛋白質外殼，裡面有 DNA 或 RNA；沒有完整的細胞，必須利用別的生物的細胞才能增殖，所以不放在五界裡。病毒不是細菌，也不是縮小的細胞。`,`This unit uses the five-kingdom scheme: prokaryotes, protists, fungi, plants and animals. To decide, look at whether the cells have a nucleus, a cell wall and chloroplasts, and at body structure and how the organism gets nutrients, not just colour, size or name.\n\nExtra: this flow chart was built for the examples in this lesson and is not a standard procedure for all organisms. Scientists also compare DNA, and some divide life into three domains; five kingdoms is not the only scheme.\n\nExtra: a virus is a protein coat around DNA or RNA. It has no complete cell and needs another organism's cells to reproduce, so it is not placed in the five kingdoms. A virus is not a bacterium or a tiny cell.`),
 closure:P(`五界用細胞核、細胞壁、葉綠體和身體構造來分：沒有細胞核是原核生物；有細胞核、有細胞壁、沒有葉綠體是真菌；有葉綠體、有根莖葉是植物；沒有細胞壁、多細胞是動物；其餘簡單的是原生生物。綠色或長在地上，都不是判斷的依據。`,`The five kingdoms are sorted by nucleus, cell wall, chloroplasts and body structure: no nucleus means prokaryote; a nucleus and wall without chloroplasts means fungus; chloroplasts with roots, stems and leaves means plant; no wall and a many-celled body means animal; the remaining simple organisms are protists. Being green or living on land is not a criterion.`),
 kingdomNames:[P(`原核生物界`,`Prokaryotes`),P(`原生生物界`,`Protists`),P(`真菌界`,`Fungi`),P(`植物界`,`Plants`),P(`動物界`,`Animals`)],
 // specimens. pic = file in naming_ai_1021/ (chalk icons only remain as an unused fallback). flags: nucleus, wall, chloroplast, organized (roots/stems/leaves for plants; tissues & organs for animals)
 specimens:[
  {id:'nostoc',name:P(`念珠藻`,`Nostoc`),pic:'nostoc.png',icon:'beads',kingdom:0,flags:{nucleus:false,wall:true,chloroplast:false,organized:false}},
  {id:'sealettuce',name:P(`石蓴`,`Sea lettuce`),pic:'sea_lettuce.png',kingdom:1,flags:{nucleus:true,wall:true,chloroplast:true,organized:false}},
  {id:'stinkhorn',name:P(`竹蓀`,`Stinkhorn`),pic:'stinkhorn.png',kingdom:2,flags:{nucleus:true,wall:true,chloroplast:false,organized:false}},
  {id:'fern',name:P(`蕨`,`Fern`),pic:'fern.png',icon:'fern',kingdom:3,flags:{nucleus:true,wall:true,chloroplast:true,organized:true}},
  {id:'seastar',name:P(`海星`,`Sea star`),pic:'seastar.png',icon:'seastar',kingdom:4,flags:{nucleus:true,wall:false,chloroplast:false,organized:true}}
 ],
 // decision flow (drawn as a tree). Each node: question text and where yes / no lead (node index or kingdom as {k:n}).
 flow:[
  {q:P(`有細胞核嗎？`,`Does it have a nucleus?`),yes:1,no:{k:0}},
  {q:P(`有細胞壁嗎？`,`Does it have a cell wall?`),yes:3,no:2},
  {q:P(`身體有組織和器官嗎？`,`Does it have tissues and organs?`),yes:{k:4},no:{k:1}},
  {q:P(`有葉綠體嗎？`,`Does it have chloroplasts?`),yes:4,no:{k:2}},
  {q:P(`有根、莖、葉嗎？`,`Does it have roots, stems and leaves?`),yes:{k:3},no:{k:1}}
 ],
 // path of nodes each specimen walks, with the answer given at each node
 paths:{nostoc:[[0,false]],sealettuce:[[0,true],[1,true],[3,true],[4,false]],stinkhorn:[[0,true],[1,true],[3,false]],fern:[[0,true],[1,true],[3,true],[4,true]],seastar:[[0,true],[1,false],[2,true]]},
 viewLabel:[P(`判斷流程`,`Flow chart`),P(`五界一覽`,`Five kingdoms`)],
 flowStepShort:[P(`特徵`,`Traits`),P(`問問題`,`Questions`),P(`結果`,`Result`)],
 flowStepTitle:[P(`收集特徵`,`Collect the traits`),P(`一題一題問`,`One question at a time`),null], // [2] = per-specimen (see result)
 flowStepText:[
  P(`先收集牠的特徵：有沒有細胞核、細胞壁、葉綠體，身體有沒有根莖葉或組織器官。`,`First collect its traits: nucleus, cell wall, chloroplasts, and whether the body has roots, stems and leaves or tissues and organs.`),
  P(`跟著小圓點走：每一題的答案決定往左或往右，直到走到某一界。`,`Follow the dot: each answer sends it left or right until it reaches a kingdom.`),
  null
 ],
 result:{
  nostoc:{title:P(`念珠藻：原核生物界`,`Nostoc: prokaryotes`),text:P(`細胞沒有細胞核，所以是原核生物。念珠藻是藍綠菌，能行光合作用，但沒有葉綠體。`,`Its cells have no nucleus, so it is a prokaryote. Nostoc is a cyanobacterium: it photosynthesises, but has no chloroplasts.`)},
  sealettuce:{title:P(`石蓴：原生生物界`,`Sea lettuce: protists`),text:P(`有細胞核、細胞壁和葉綠體，能行光合作用；可是沒有根、莖、葉的分化，是藻類，歸在原生生物界。綠色不等於植物。`,`It has a nucleus, a cell wall and chloroplasts and photosynthesises, but it has no separate roots, stems or leaves. It is an alga, placed with the protists. Green does not mean plant.`)},
  stinkhorn:{title:P(`竹蓀：真菌界`,`Stinkhorn: fungi`),text:P(`有細胞核和細胞壁，沒有葉綠體，不能自己製造養分；靠菌絲分解並吸收外界的養分，是真菌。長在地上也不是植物。`,`It has a nucleus and a cell wall but no chloroplasts and cannot make its own food; its hyphae digest and absorb nutrients from outside. It is a fungus. Growing from the ground does not make it a plant.`)},
  fern:{title:P(`蕨：植物界`,`Fern: plants`),text:P(`有細胞核、細胞壁和葉綠體，有根、莖、葉，能行光合作用。蕨不開花也是植物。`,`It has a nucleus, a cell wall and chloroplasts, with roots, stems and leaves, and photosynthesises. A fern is a plant even though it does not flower.`)},
  seastar:{title:P(`海星：動物界`,`Sea star: animals`),text:P(`有細胞核，沒有細胞壁，身體由許多細胞組成，有組織和器官，吃其他生物。海星是動物，不是植物。`,`It has a nucleus but no cell wall, a many-celled body with tissues and organs, and it eats other organisms. A sea star is an animal, not a plant.`)}
 },
 // five-kingdom comparison table (view 1). rows = traits; cells in kingdom order. Keep cell text short.
 traitStepShort:[P(`細胞核`,`Nucleus`),P(`細胞壁`,`Wall`),P(`葉綠體`,`Chloroplast`),P(`細胞數`,`Cells`),P(`養分`,`Food`)],
 traitRows:[
  {label:P(`細胞核`,`Nucleus`),cells:[P(`沒有`,`No`),P(`有`,`Yes`),P(`有`,`Yes`),P(`有`,`Yes`),P(`有`,`Yes`)],mark:[0,1,1,1,1]},
  {label:P(`細胞壁`,`Cell wall`),cells:[P(`有`,`Yes`),P(`有些有`,`Some`),P(`有`,`Yes`),P(`有`,`Yes`),P(`沒有`,`No`)],mark:[1,2,1,1,0]},
  {label:P(`葉綠體`,`Chloroplast`),cells:[P(`沒有`,`No`),P(`藻類有`,`Algae`),P(`沒有`,`No`),P(`有`,`Yes`),P(`沒有`,`No`)],mark:[0,2,0,1,0]},
  {label:P(`細胞數`,`Cells`),cells:[P(`單細胞`,`One`),P(`多為單細胞`,`Mostly one`),P(`多為多細胞`,`Mostly many`),P(`多細胞`,`Many`),P(`多細胞`,`Many`)],mark:[2,2,2,2,2]},
  {label:P(`養分`,`Food`),cells:[P(`自營、異營都有`,`Both kinds`),P(`自營、異營都有`,`Both kinds`),P(`異營：分解吸收`,`Absorb`),P(`自營：光合作用`,`Photosynthesis`),P(`異營：攝食`,`Eat`)],mark:[2,2,2,2,2]}
 ],
 traitStepTitle:[P(`有沒有細胞核？`,`Is there a nucleus?`),P(`有沒有細胞壁？`,`Is there a cell wall?`),P(`有沒有葉綠體？`,`Are there chloroplasts?`),P(`幾個細胞？`,`How many cells?`),P(`怎麼得到養分？`,`How do they get nutrients?`)],
 traitStepText:[
  P(`只有原核生物沒有細胞核，其他四界都有。`,`Only prokaryotes lack a nucleus; the other four kingdoms have one.`),
  P(`動物細胞沒有細胞壁；植物、真菌和細菌有細胞壁（組成不同）；原生生物有些有、有些沒有。`,`Animal cells have no cell wall; plants, fungi and bacteria do (made of different materials); some protists have one and some do not.`),
  P(`植物和藻類有葉綠體，能行光合作用。真菌和動物沒有。藍綠菌能光合作用，但沒有葉綠體。`,`Plants and algae have chloroplasts and photosynthesise; fungi and animals do not. Cyanobacteria photosynthesise but have no chloroplasts.`),
  P(`原核生物是單細胞；原生生物大多是單細胞，藻類有些是多細胞；植物和動物是多細胞；真菌多數是多細胞，酵母菌是單細胞。`,`Prokaryotes are single cells; most protists are single-celled, though some algae are many-celled; plants and animals are many-celled; most fungi are many-celled, but yeast is a single cell.`),
  P(`植物自己行光合作用（自營）；動物吃其他生物；真菌分解並吸收外界的養分；原核和原生生物有的自營、有的異營。`,`Plants make their own food by photosynthesis; animals eat other organisms; fungi digest and absorb nutrients from outside; prokaryotes and protists include both self-feeding and other-feeding types.`)
 ],
 quiz:[
  {q:P(`石蓴是綠色的，能行光合作用，為什麼不歸在植物界？`,`Sea lettuce is green and photosynthesises. Why is it not placed in the plant kingdom?`),options:[P('因為它長在水裡，植物不能在水裡','Because it lives in the water and plants cannot'),P('沒有根莖葉分化，是藻類而非植物','It has no true roots or leaves, being an alga'),P('因為它的細胞內完全沒有細胞核','Because its cells have no nucleus at all'),P('因為它自己完全不能進行光合作用','Because it cannot photosynthesise at all')],answer:1,why:P(`有葉綠體、能光合作用還不夠；植物還要有根、莖、葉的分化。石蓴有細胞核，所以也不是原核生物。`,`Chloroplasts and photosynthesis are not enough; plants also have roots, stems and leaves. Sea lettuce has a nucleus, so it is not a prokaryote either.`),hint:P(`選「石蓴」，看問題走到最後一題時答案是什麼。`,`Choose sea lettuce and read the answer to the last question.`)},
  {q:P(`竹蓀有細胞核、有細胞壁、沒有葉綠體，屬於哪一界？`,`A stinkhorn has a nucleus and a cell wall but no chloroplasts. Which kingdom is it in?`),options:[P('真菌界','Fungi kingdom'),P('植物界','Plant kingdom'),P('原生生物界','Protist kingdom'),P('動物界','Animal kingdom')],answer:0,why:P(`有細胞壁但沒有葉綠體，不能自己製造養分，靠菌絲分解並吸收養分，是真菌。`,`It has a cell wall but no chloroplasts and cannot make its own food; its hyphae absorb nutrients, so it is a fungus.`),hint:P(`選「竹蓀」，看流程在哪一題轉向。`,`Choose stinkhorn and see where the flow turns.`)},
  {q:P(`念珠藻能行光合作用，卻是原核生物，是因為？`,`Nostoc photosynthesises but is a prokaryote. Why?`),options:[P('它的細胞沒有細胞核','Its cells lack a nucleus'),P('它的顏色是藍綠色的','Its colour is blue-green'),P('它是單細胞的生物體','It is a single cell only'),P('它有一層堅硬細胞壁','It has a thick cell wall')],answer:0,why:P(`原核生物的第一個判準是沒有細胞核。念珠藻是藍綠菌，能光合作用，但沒有葉綠體。`,`The first test for prokaryotes is having no nucleus. Nostoc is a cyanobacterium: it photosynthesises but has no chloroplasts.`),hint:P(`選「念珠藻」，看第一個問題的答案。`,`Choose Nostoc and read the answer to the first question.`)}
 ]
},

// ───────────────────────── Tab 4: key ─────────────────────────
key:{
 title:P(`先分兩路，再繼續`,`Branch in two, then go on`),
 sub:P(`分類檢索`,`An identification key`),
 hook:P(`野外遇到一隻不認識的小蟲，怎麼找出牠的名字？生物學家有個好用的辦法：每一步只問一個「是」或「不是」的問題，一路問下去，就會走到答案。`,`You meet an unknown insect in the field. How do you find its name? Biologists ask one yes-or-no question at a time, and the answers lead to the name.`),
 body:P(`先選一張檢索表，再選一隻標本；看圖回答每一個問題，走到名字為止。換一張檢索表，也能走到一樣的答案。`,`Pick a key and a specimen; answer each question by looking at the picture until you reach a name. A different key can lead to the same answers.`),
 reading:P(`這種一次分成兩路的檢索表叫二分檢索表。好的問題要看得到、不用猜，而且每次只有兩個答案。檢索表只能用來分它涵蓋的那幾種標本；遇到沒有收進去的生物，會走到錯的答案或走不下去。\n\n補充：這四隻都是昆蟲，身體分成頭、胸、腹三部分，有六隻腳。牠們在分類上同屬昆蟲綱，所以要用翅膀、觸角這些細節才分得開。`,`This kind of key, which splits in two at every step, is a dichotomous key. A good question can be answered by looking, needs no guessing and has only two answers. A key only works for the specimens it covers; an organism that is not included leads to a wrong answer or a dead end.\n\nExtra: all four are insects, with a body in three parts (head, thorax, abdomen) and six legs. They belong to the same class, Insecta, so details such as wings and antennae are needed to tell them apart.`),
 closure:P(`檢索表用可以看見的特徵，一次分成兩路，一路問到名字。同一批標本可以用不同的特徵分，只要問題清楚，答案會一樣。可是檢索表只適用它收進去的標本。`,`A key uses visible traits and splits in two at every step until it reaches a name. The same specimens can be sorted by different traits, and clear questions lead to the same answers. But a key only applies to the specimens it includes.`),
 specimens:[
  {id:'dragonfly',pic:'dragonfly.png',name:P(`蜻蜓`,`Dragonfly`),result:P(`四片又薄又透明的翅膀、短短的觸角，是蜻蜓。`,`Four thin clear wings and short antennae: a dragonfly.`)},
  {id:'fly',pic:'fly.png',name:P(`蒼蠅`,`Fly`),result:P(`兩片透明的翅膀、短短的觸角，是蒼蠅。`,`Two clear wings and short antennae: a fly.`)},
  {id:'beetle',pic:'longhorn_beetle.png',name:P(`天牛`,`Longhorn beetle`),result:P(`前翅硬得像殼，觸角很長，是天牛。`,`Hard wing-cases and very long antennae: a longhorn beetle.`)},
  {id:'silverfish',pic:'silverfish.png',name:P(`衣魚`,`Silverfish`),result:P(`沒有翅膀，觸角和尾絲都很長，是衣魚。`,`No wings, with long antennae and long tail threads: a silverfish.`)}
 ],
 keyLabel:[P(`先看翅膀`,`Wings first`),P(`先看觸角`,`Antennae first`)],
 modeLabel:[P(`我來回答`,`I answer`),P(`看示範`,`Watch`)],
 // question bank. hint is shown in the caption while the question is open
 questions:{
  wings:{q:P(`背上有翅膀或硬殼嗎？`,`Does it have wings or a hard wing-case on its back?`),hint:P(`看背部：翅膀是透明的薄片；有些昆蟲的前翅變成硬殼，像盔甲。`,`Look at the back: wings are thin and clear, but in some insects the front pair has become a hard case like armour.`)},
  two:{q:P(`看得到兩片透明的翅膀嗎？`,`Can you see exactly two clear wings?`),hint:P(`數數看到幾片透明的翅膀：蒼蠅兩片，蜻蜓四片。`,`Count the clear wings you can see: a fly has two, a dragonfly four.`)},
  shell:{q:P(`最外面的一對翅膀硬得像殼嗎？`,`Is the outer pair of wings hard like a shell?`),hint:P(`硬硬的殼蓋在背上的，是天牛的特徵；蜻蜓的四片翅膀都又薄又透明。`,`A hard case over the back belongs to the beetle; all four of the dragonfly's wings are thin and clear.`)},
  long:{q:P(`觸角（頭上的細絲）很長，和身體差不多長嗎？`,`Are the antennae (the threads on the head) long, nearly as long as the body?`),hint:P(`比一比頭上細絲和身體的長度。`,`Compare the length of the threads on the head with the body.`)}
 },
 // two keys. Each node: question id, yes / no -> node index or specimen id string.
 keys:[
  [{q:'wings',yes:1,no:'silverfish'},{q:'two',yes:'fly',no:2},{q:'shell',yes:'beetle',no:'dragonfly'}],
  [{q:'long',yes:1,no:2},{q:'wings',yes:'beetle',no:'silverfish'},{q:'two',yes:'fly',no:'dragonfly'}]
 ],
 wrong:P(`再看一次圖，換另一個答案試試。`,`Look at the picture again and try the other answer.`),
 yesNo:[P(`是`,`Yes`),P(`否`,`No`)],
 quiz:[
  {q:P(`檢索表的每一個問題，應該符合哪一個條件？`,`What should every question in a key satisfy?`),options:[P('看得到、不用猜，只有兩個答案','It can be answered by looking and has two answers'),P('要有很多個答案，才有得選擇喔','It should have many possible answers to choose from'),P('要用顯微鏡才能看到的細小特徵','It should rely on traits seen with a microscope'),P('由老師來決定，完全不用看標本','It is decided by the teacher, not by looking')],answer:0,why:P(`二分檢索表每次只分兩路，問題要能直接看出來，才不會走錯。`,`A dichotomous key splits in two each time, and the questions must be answerable by looking so that you do not take a wrong turn.`),hint:P(`想想你剛才回答問題時，什麼最好用。`,`Think about what made the questions easy to answer.`)},
  {q:P(`用「先看翅膀」的檢索表，一隻沒有翅膀也沒有硬殼的昆蟲會走到哪裡？`,`Using the "wings first" key, where does an insect with no wings and no wing-case end up?`),options:[P('衣魚','The silverfish'),P('蜻蜓','The dragonfly'),P('蒼蠅','The common fly'),P('天牛','The longhorn')],answer:0,why:P(`第一題的答案是「否」，就直接走到衣魚；其他三隻都有翅膀或硬殼。`,`The answer to the first question is "no", which leads straight to the silverfish; the other three have wings or a wing-case.`),hint:P(`選「衣魚」，看第一題。`,`Choose silverfish and read the first question.`)},
  {q:P(`換成「先看觸角」的檢索表，標本的名字會變嗎？`,`With the "antennae first" key, does the specimen's name change?`),options:[P('不會，不同檢索表可得同名字','No; different keys reach the same name'),P('會，名字是由檢索表來決定的','Yes; the key itself decides the name'),P('會，觸角長短會改變牠的種類','Yes; antenna length changes the species'),P('不一定，要看當天的運氣好壞','It all depends on how lucky you are')],answer:0,why:P(`名字來自生物本身，檢索表只是找名字的工具；只要問題清楚，不同的分法會走到同一個答案。`,`The name belongs to the organism; the key is only a tool for finding it. With clear questions, different routes reach the same answer.`),hint:P(`把同一隻標本用兩張檢索表各走一次。`,`Walk the same specimen through both keys.`)}
 ]
},

// ───────────────────────── Tab 5: species ─────────────────────────
species:{
 title:P(`不同品種，未必不同種`,`Different breeds are not necessarily different species`),
 sub:P(`同種與品種`,`Species and breeds`),
 hook:P(`吉娃娃只有一個小水壺那麼高，大丹狗站起來比人還高。牠們差這麼多，算同一種嗎？科學家怎麼決定哪些生物算「同一種」？`,`A Chihuahua is hardly taller than a water bottle, while a Great Dane standing up can be taller than a person. Are they really the same species? How do scientists decide what counts as one species?`),
 body:P(`先看狗和貓的不同品種，再比較「同種」和「不同種」的差別：能不能生出自己也能生小孩的後代。`,`First look at breeds of dogs and cats, then compare "same species" with "different species": whether they can have offspring that can reproduce themselves.`),
 reading:P(`生物學上常用的「種」：在自然情況下能互相交配，並且生出有生殖能力後代的一群生物。品種是人類挑選出不同性狀（毛長、體型、花色）而留下的類型，品種不同仍可以是同一種。\n\n補充：這個定義有限制：細菌等只靠無性生殖的生物，沒辦法用交配來判斷；化石也沒辦法試。有些親緣很近的種（例如狼、郊狼和狗），人為或特殊情況下也能生出有生殖能力的雜交後代，所以種的界線不是絕對的。`,`A commonly used biological definition of a "species" is a group of organisms that can mate with one another in nature and produce offspring that can themselves reproduce. A breed is a type that people have selected for certain traits (coat length, size, colour); different breeds can still be one species.\n\nExtra: this definition has limits: organisms that reproduce only asexually, such as bacteria, cannot be judged by mating, and fossils cannot be tested. Some closely related species (for example wolves, coyotes and dogs) can, under human or unusual circumstances, produce fertile hybrids, so species boundaries are not absolute.`),
 closure:P(`同一種生物，不同品種可以長得很不一樣。判斷是不是同一種，要看能不能自然交配、生出有生殖能力的後代，不能只看外形。馬和驢可以生下騾，但騾幾乎都沒有生殖能力，所以馬和驢是不同種。`,`Members of one species can look very different as breeds. To judge whether organisms are one species, ask whether they can mate naturally and produce offspring that can reproduce, not just how they look. A horse and a donkey can have a mule, but mules almost never reproduce, so horses and donkeys are different species.`),
 viewLabel:[P(`狗的品種`,`Dog breeds`),P(`貓的品種`,`Cat breeds`),P(`什麼叫同種？`,`What is one species?`)],
 stepShort:[
  [P(`兩種狗`,`Two dogs`),P(`真實大小`,`Real size`),P(`能生小狗嗎`,`Puppies?`)],
  [P(`三隻貓`,`Three cats`),P(`差在哪`,`Differences`),P(`同一種`,`One species`)],
  [P(`同種`,`Same`),P(`不同種`,`Different`),P(`標準`,`The test`)]
 ],
 stepTitle:[
  [P(`吉娃娃和大丹狗`,`Chihuahua and Great Dane`),P(`真實的體型`,`Real sizes`),P(`還是同一種`,`Still one species`)],
  [P(`三隻家貓`,`Three domestic cats`),P(`差在哪裡？`,`What differs?`),P(`都是家貓`,`All domestic cats`)],
  [P(`同種`,`Same species`),P(`不同種`,`Different species`),P(`判斷的標準`,`The test`)]
 ],
 stepText:[
  [P(`兩隻都是狗。畫面把牠們畫成差不多大，方便比較樣子；真實的大小在下一步。`,`Both are dogs. The picture draws them about the same size so you can compare their shapes; the real sizes come next.`),
   P(`照真實大小的比例，大丹狗的肩高約 80 公分，吉娃娃約 20 公分，差了大約 4 倍。體型、毛色、耳朵都差很多，這些是品種的差異。`,`At real proportions a Great Dane stands about 80 cm at the shoulder and a Chihuahua about 20 cm, a quarter of that. Size, coat and ears differ greatly: these are breed differences.`),
   P(`不同品種的狗可以交配，生出有生殖能力的混種狗，所以都是同一種。品種是人類挑選性狀留下的類型。`,`Dogs of different breeds can mate and produce fertile mixed-breed puppies, so they are one species. Breeds are types that people selected for certain traits.`)],
  [P(`長毛的、短毛銀虎斑的、橘色虎斑的貓：毛長、毛色花紋都不同。`,`A long-haired cat, a short-haired silver tabby and an orange tabby: coat length, colour and pattern all differ.`),
   P(`毛的長短、顏色和花紋，是性狀的不同。這些性狀由基因決定，人類挑選有特定性狀的貓繁殖，就留下不同的品種。`,`Coat length, colour and pattern are differences in traits, controlled by genes. People breed cats with chosen traits, which makes different breeds.`),
   P(`三隻貓能互相交配，生出有生殖能力的小貓，都是同一種：家貓（Felis catus）。外形不同不等於不同種。`,`The three cats can mate and have fertile kittens; all are one species, the domestic cat (Felis catus). Looking different does not mean being a different species.`)],
  [P(`吉娃娃和大丹狗交配，生出的混種狗長大後也能生小狗：有生殖能力，所以是同一種。`,`A Chihuahua and a Great Dane can have a mixed-breed puppy that can later have puppies of its own: the offspring are fertile, so they are one species.`),
   P(`馬和驢可以交配，生下騾。但騾幾乎都沒有生殖能力，不能再生小騾，所以馬和驢是不同種。`,`A horse and a donkey can mate and have a mule, but mules almost never have fertile offspring, so horses and donkeys are different species.`),
   P(`能自然交配，而且生出有生殖能力的後代，才算同一種。只能生下沒有生殖能力的後代，就是不同種。`,`Organisms are one species if they can mate naturally and produce offspring that can reproduce. If the offspring cannot reproduce, they are different species.`)]
 ],
 // pictures used by this tab (file, display facing flag: the file's subject faces 'r' or 'l')
 pics:{dog_chihuahua:{file:'dog_chihuahua.png',faces:'r',name:P(`吉娃娃`,`Chihuahua`)},dog_great_dane:{file:'dog_great_dane.png',faces:'l',name:P(`大丹狗`,`Great Dane`)},cat_longhair:{file:'cat_longhair.png',faces:'r',name:P(`長毛貓`,`Long-haired cat`)},cat_shorthair:{file:'cat_shorthair.png',faces:'l',name:P(`短毛銀虎斑貓`,`Short-haired silver tabby`)},cat_tabby:{file:'cat_tabby.png',faces:'r',name:P(`橘色虎斑貓`,`Orange tabby`)},horse_bay:{file:'horse_bay.png',faces:'r',name:P(`馬`,`Horse`)}},
 realSize:{dane:P(`肩高約 80 公分`,`About 80 cm at the shoulder`),chihuahua:P(`肩高約 20 公分`,`About 20 cm at the shoulder`)},
 cards:{donkey:P(`驢`,`Donkey`),mule:P(`騾`,`Mule`),puppy:P(`混種狗`,`Mixed-breed dog`),fertile:P(`有生殖能力`,`Fertile`),sterile:P(`幾乎沒有生殖能力`,`Almost never fertile`)},
 quiz:[
  {q:P(`長毛貓和短毛貓外形不同，為什麼是同一種？`,`A long-haired and a short-haired cat look different. Why are they one species?`),options:[P('因為牠們身上的毛長度都一樣長','Because their fur is exactly the same length'),P('因為牠們全部都屬於同一個貓科','Because both of them are in the cat family'),P('牠們能交配並生出能生育的小貓','They can mate and have kittens that breed'),P('因為牠們全都住在同一個地方','Because they both live in the same place')],answer:2,why:P(`同種的標準是能自然交配、生出有生殖能力的後代；毛長短只是品種的性狀。`,`The test for one species is natural mating with fertile offspring; coat length is just a breed trait.`),hint:P(`切到「貓的品種」，看最後一步。`,`Switch to "Cat breeds" and read the last step.`)},
  {q:P(`馬和驢生下騾，騾幾乎不能生育。這說明馬和驢是什麼關係？`,`A horse and a donkey have a mule, which can almost never reproduce. What does this show about horses and donkeys?`),options:[P('不同種，但親緣還很近','Different species, same genus'),P('同一種，只是品種不同','The same species, with two breeds'),P('屬於同一個品種的動物','The same breed of the animal'),P('一定沒有任何親緣關係','They are not related at all')],answer:0,why:P(`同一種的後代要有生殖能力。騾沒有，所以馬和驢是不同種（但同屬，親緣很近）。`,`Offspring of one species must be fertile. Mules are not, so horses and donkeys are different species (but they share a genus and are closely related).`),hint:P(`切到「什麼叫同種？」，比較兩組。`,`Switch to "What is one species?" and compare the two pairs.`)},
  {q:P(`下列哪一種生物，最不適合用「能不能交配」判斷是不是同一種？`,`For which organisms is "can they mate?" least useful for deciding species?`),options:[P('只靠無性生殖的細菌','Bacteria reproducing only asexually'),P('會交配的各種狗品種','Dogs that can mate with one another'),P('能交配的馬與馬之間','Horses that can mate with one another'),P('能交配的貓與貓之間','Cats that can mate with one another')],answer:0,why:P(`無性生殖的生物不需要交配，這個定義用不上；化石也沒辦法測試。`,`Asexual organisms do not mate, so the definition does not work; fossils cannot be tested either.`),hint:P(`想想看，哪一種生物根本不會「交配」。`,`Which organism never "mates" at all?`)}
 ]
}
};
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',board:'#1c3d34',panel:'#16332b',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const GEN=C.yellow,EPI=C.cyan,SAME=C.green,DIFF=C.orange;
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const isEn=()=>D.tr(P('zh','en'))==='en';

// ── drawing kit (same helpers as the other biology units) ──────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
const MONO=size=>`700 ${size}px "JetBrains Mono", "Noto Sans TC", monospace`;
const ITAL=size=>`italic 700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
// Measurements are cached (cleared when the web fonts finish loading) so the per-frame work stays small.
const MW=new Map(),SL=new Map(),LAY={};
function clearCaches(){MW.clear();SL.clear();for(const k in LAY)delete LAY[k];}
if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{clearCaches();B.draw();});
function measure(c,p,size=22,font=FONT){const s=D.tr(p),f=font(size),key=f+'|'+s;let w=MW.get(key);if(w===undefined){c.save();c.font=f;w=c.measureText(s).width;c.restore();MW.set(key,w);}return w;}
function text(c,p,x,y,size=22,color=C.white,align='left',font=FONT){c.save();c.font=font(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function splitLines(c,str,maxW,size=22,font=FONT){
  const key=font(size)+'|'+maxW+'|'+str;let rows=SL.get(key);if(rows)return rows;
  c.save();c.font=font(size);
  const isE=/[A-Za-z]/.test(str)&&!/[一-鿿]/.test(str),tokens=str.match(/[A-Za-z0-9]+(?:['’–-][A-Za-z0-9]+)*|\s+|[^A-Za-z0-9\s]/g)||[];
  rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());c.restore();
  const PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){if(isE){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  rows=rows.filter(r=>r);SL.set(key,rows);return rows;
}
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38),align='left',font=FONT){const rows=splitLines(c,D.tr(p),w,size,font);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,color,align,font));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha*=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function panel(c,x,y,w,h,fill=C.panel){D.round(c,x,y,w,h,16,fill,C.edge);}
function outline(c,x,y,w,h,r,color,lw=3,dash=null){c.save();if(dash)c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=24}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  return{x,y,w,h};
}
function smallPill(c,p,cx,cy,{fill='rgba(11,26,21,.92)',stroke=rgba(C.muted,.6),color=C.muted}={}){const w=measure(c,p,22)+20,h=30;D.round(c,cx-w/2,cy-h/2,w,h,h/2,fill,stroke);text(c,p,cx,cy+8,22,color,'center');return w;}
function rpulse(c,x,y,w,h,t,color=C.yellow,r=12){const u=mod(t*.8);outline(c,x-u*12,y-u*12,w+u*24,h+u*24,r+u*8,rgba(color,.9*(1-u)),3);}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
function tick(c,x,y,r=15,color=SAME){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.48,y-r*.36);c.stroke();c.restore();}
function cross(c,x,y,r=15,color=DIFF){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.beginPath();c.moveTo(x-r*.38,y-r*.38);c.lineTo(x+r*.38,y+r*.38);c.moveTo(x+r*.38,y-r*.38);c.lineTo(x-r*.38,y+r*.38);c.stroke();c.restore();}
function dashLine(c,pts,color,w,t,speed=30,dash=[8,8]){c.save();c.setLineDash(dash);c.lineDashOffset=-t*speed;sline(c,pts,color,w);c.restore();}
function quadPts(a,m,b,n=18){const o=[];for(let i=0;i<=n;i++){const v=i/n,w=1-v;o.push([w*w*a[0]+2*w*v*m[0]+v*v*b[0],w*w*a[1]+2*w*v*m[1]+v*v*b[1]]);}return o;}
// The first fraction f of a polyline (for growing branches and travelling dots).
function polyPart(pts,f){if(f>=1)return pts;const ds=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);ds.push(d);tot+=d;}
  let left=clamp(f)*tot;const out=[pts[0]];for(let i=1;i<pts.length;i++){const d=ds[i-1];if(left>=d){out.push(pts[i]);left-=d;}else{const v=d?left/d:0;out.push([mix(pts[i-1][0],pts[i][0],v),mix(pts[i-1][1],pts[i][1],v)]);break;}}return out;}
// A soft light band that keeps sliding across a card (idle motion that never stalls).
function sweep(c,x,y,w,h,t,r=14,a=.22,speed=.45){c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();const sx=x-60+mod(t*speed,1)*(w+120),g=c.createLinearGradient(sx-50,0,sx+50,0);g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,a));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(sx-50,y,100,h);c.restore();}
function board(c){c.fillStyle=C.board;c.fillRect(0,0,960,600);}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const steps=(short)=>choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...short.map((n,i)=>[i,n])]);
// A stage clock: loops through n stages, or eases into a held stage.
function stageClock(s,t,n,per=5){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true,tau:t-(s.start||0)};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false,tau:(q%1)*per};
}
// The same with stages of different lengths.
function clockD(s,t,durs){const st=s.start||0;if(s.phase>=0)return{k:s.phase,u:ease((t-st)/1.6),held:true,tau:t-st};
  const tot=durs.reduce((a,b)=>a+b,0);let q=mod(t-st,tot),k=0;while(k<durs.length-1&&q>=durs[k]){q-=durs[k];k++;}return{k,u:clamp(q/durs[k]),held:false,tau:q};}

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/naming_ai_1021/',PICS={};
const SIZE={'nostoc.png':[590,345],'fern.png':[582,546],'seastar.png':[575,546],'cat_tabby.png':[397,530],'horse_bay.png':[624,552],'wolf.png':[660,512],'coyote.png':[552,465],'marten_yellow_throated.png':[668,499],'marten_american.png':[656,352],
 'serow.png':[587,584],'longhorn_beetle.png':[518,534],'sea_lettuce.png':[512,597],'stinkhorn.png':[374,607],'dragonfly.png':[476,340],'fly.png':[296,282],'silverfish.png':[458,393],
 'dog_chihuahua.png':[432,463],'dog_great_dane.png':[581,537],'spider.png':[318,396],'crab.png':[448,329],'snail.png':[363,196],'cat_longhair.png':[494,603],'cat_shorthair.png':[421,567]};
// Soft radial glow behind each picture (never a hard-edged light box); stronger for subjects that read weakly on the board.
const HALO={'serow.png':.3,'dog_great_dane.png':.28,'fly.png':.34,'silverfish.png':.3,'horse_bay.png':.2,'marten_yellow_throated.png':.16,'longhorn_beetle.png':.2,'spider.png':.16,'dragonfly.png':.18,'wolf.png':.12,'cat_shorthair.png':.16};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
// The box an image fills; known before the image loads, so layouts never jump.
function fitRect(file,bx,by,bw,bh){const [W,H]=SIZE[file],k=Math.min(bw/W,bh/H),w=W*k,h=H*k;return{x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};}
function haloRect(c,r,a){if(a<=0)return;c.save();c.translate(r.x+r.w/2,r.y+r.h/2);c.scale(r.w*.62,r.h*.62);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,rgba(C.white,a));g.addColorStop(.55,rgba(C.white,a*.42));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();c.restore();}
function drawIn(c,file,r,{alpha=1,flip=false,halo=1}={}){
  if(halo)haloRect(c,r,(HALO[file]||.1)*halo*alpha);
  const im=pic(AI+file);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();return r;}
  c.save();c.globalAlpha*=alpha;if(flip){c.translate(r.x*2+r.w,0);c.scale(-1,1);}
  c.drawImage(im,r.x,r.y,r.w,r.h);c.restore();return r;}
const place=(c,file,bx,by,bw,bh,o={})=>drawIn(c,file,fitRect(file,bx,by,bw,bh),o);
const at=(r,fx,fy)=>[r.x+fx*r.w,r.y+fy*r.h];
function marker(c,x,y,n,t,r=13,color=C.yellow){if(t!=null)pulse(c,x,y,t,color,r+2);circle(c,x,y,r,color,C.ink,2);c.save();c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}

// ── chalk drawings: Nostoc, fern, sea star (local size about ±90) ──────────
function iconNostoc(c,cx,cy,s=1,t=0){c.save();c.translate(cx,cy);c.scale(s,s);
  const N=11,pts=[];for(let i=0;i<N;i++){const v=i/(N-1);pts.push([-86+v*172,Math.sin(v*TAU*1.05+t*.9)*26+Math.cos(v*7.3)*5]);}
  sline(c,pts,'rgba(126,214,190,.14)',38);
  c.save();c.setLineDash([3,7]);sline(c,pts.map(([x,y])=>[x,y-19]),'rgba(159,240,212,.4)',1.6);sline(c,pts.map(([x,y])=>[x,y+19]),'rgba(159,240,212,.4)',1.6);c.restore();
  pts.forEach(([x,y],i)=>{const het=i===3||i===8,r=het?11.5:10;circle(c,x,y,r,het?'rgba(230,240,200,.2)':'rgba(64,170,150,.6)',het?'#eef6cf':'#8ff0d4',het?3:2.2);
    if(het){circle(c,x,y,4,null,'rgba(238,246,207,.7)',1.5);}else circle(c,x-r*.32,y-r*.32,r*.26,'rgba(242,236,217,.55)',null);});
  c.restore();}
function iconFern(c,cx,cy,s=1,t=0){c.save();c.translate(cx,cy);c.scale(s,s);
  const sw=Math.sin(t*1.1)*.07,R=v=>[Math.sin(v*1.5)*14+sw*v*v*110,84-v*172];
  [[-34,104],[-10,114],[16,110],[38,98],[-22,96]].forEach(([x,y],i)=>sline(c,[[0,86],[x*.45,(86+y)/2+(i%2?5:-3)],[x,y]],'rgba(214,190,140,.95)',2.2));
  ellipse(c,0,86,16,6,'rgba(160,120,80,.55)','#d6be8c',1.8);
  // a young curled frond (fiddlehead)
  const fh=[];for(let i=0;i<=26;i++){const v=i/26;fh.push([-30-Math.sin(v*1.2)*4,84-v*58]);}const sx=fh[fh.length-1];
  sline(c,fh,'#b7e8a8',2.6);c.beginPath();for(let i=0;i<=40;i++){const a=Math.PI*.5+i/40*TAU*1.25,rr=12*(1-i/48);const x=sx[0]+8+Math.cos(a+Math.PI/2)*rr-8,y=sx[1]-rr*.0+Math.sin(a+Math.PI/2)*rr-12;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#b7e8a8';c.lineWidth=2.6;c.lineCap='round';c.stroke();
  for(let i=0;i<11;i++){const v=.1+i*.077,[x,y]=R(v),len=(1-v)*64+9,wd=len*.2;
    for(const side of [-1,1]){const ang=.4+v*.25,tx=x+side*len*Math.cos(ang),ty=y-len*Math.sin(ang),mx=(x+tx)/2,my=(y+ty)/2,nx=-(ty-y)/len*wd,ny=(tx-x)/len*wd;
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(mx+nx,my+ny,tx,ty);c.quadraticCurveTo(mx-nx,my-ny,x,y);c.fillStyle='rgba(74,222,128,.3)';c.fill();c.strokeStyle='#a7f0b5';c.lineWidth=1.8;c.stroke();
      line(c,[[x,y],[mix(x,tx,.85),mix(y,ty,.85)]],'rgba(167,240,181,.55)',1.2);}}
  const rp=[];for(let i=0;i<=20;i++)rp.push(R(i/20));sline(c,rp,'#c8f2c0',3.2);
  c.restore();}
function iconSeastar(c,cx,cy,s=1,t=0){c.save();c.translate(cx,cy);c.scale(s,s);c.rotate(t*.12);
  const pt=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r];
  c.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5,v1=pt(30,a-TAU/10),c1=pt(80,a-.2),tip=pt(86,a),c2=pt(80,a+.2),v2=pt(30,a+TAU/10);
    if(i===0)c.moveTo(...v1);else c.lineTo(...v1);c.quadraticCurveTo(c1[0],c1[1],tip[0],tip[1]);c.quadraticCurveTo(c2[0],c2[1],v2[0],v2[1]);}
  c.closePath();c.fillStyle='rgba(244,114,182,.26)';c.fill();c.strokeStyle=C.pink;c.lineWidth=3;c.lineJoin='round';c.stroke();
  for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5,px=-Math.sin(a),py=Math.cos(a);for(let d=34;d<=72;d+=7.5){const [x,y]=pt(d,a),off=5.5*(1-d/110);circle(c,x+px*off,y+py*off,2.5,'#fbcfe8',null);circle(c,x-px*off,y-py*off,2.5,'#fbcfe8',null);}}
  circle(c,0,0,15,'rgba(251,207,232,.12)','rgba(251,207,232,.85)',2);circle(c,7,-5,3.2,'#fde68a',null);
  c.restore();}
const ICON={beads:iconNostoc,fern:iconFern,seastar:iconSeastar};

// ── Tab 1: names ───────────────────────────────────────────────────────────
const NM=TXT.names,N_FLIP=[[false,true],[false,false]],NS=30;
const N_BIG=[{x:46,y:12,w:388,h:250},{x:526,y:12,w:388,h:250}],N_SMALL=[{x:40,y:10,w:300,h:156},{x:620,y:10,w:300,h:156}],N_CX=[240,720];
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
function nameTile(c,str,x,y,w,h,fill){D.round(c,x,y,w,h,12,fill,C.ink);text(c,str,x+w/2,y+h/2+NS*.36,NS,C.deep,'center',ITAL);}
function namesMeet(c,an,t){
  const q=P('同一種？還是兩種？','One species, or two?'),w=measure(c,q,30),y=446;
  glow(c,480,y-10,w*.75,C.yellow,.12+.06*Math.sin(t*3));
  [quadPts([N_CX[0],360],[N_CX[0]+10,y-10],[480-w/2-16,y-10]),quadPts([N_CX[1],360],[N_CX[1]-10,y-10],[480+w/2+16,y-10])].forEach(q=>{dashLine(c,q,rgba(C.yellow,.7),2.5,t);
    D.flow(c,q,t*1.1,2,(cc,x,yy)=>{glow(cc,x,yy,16,C.yellow,.75);circle(cc,x,yy,4.5,C.yellow,null);});});
  text(c,q,480,y,30,C.yellow,'center');
  text(c,P('只看俗名，分得出來嗎？','Can the common names tell us?'),480,520,22,C.muted,'center');
}
function namesCards(c,an,t,tau){
  const v=ease(tau/.8);
  an.forEach((a,j)=>{const cx=N_CX[j],str=a.genus+' '+a.epithet,w=measure(c,str,NS,ITAL)+48,h=60,x=cx-w/2,y=372+(1-v)*20;
    c.save();c.globalAlpha=v;D.round(c,x,y,w,h,14,'rgba(11,26,21,.88)',null);outline(c,x,y,w,h,14,C.white,2.5);
    text(c,str,cx,y+h/2+NS*.36,NS,C.white,'center',ITAL);
    c.save();c.beginPath();c.roundRect(x,y,w,h,14);c.clip();const sx=x-60+mod(t*.42+j*.5,1.5)/1.5*(w+120),g=c.createLinearGradient(sx-46,0,sx+46,0);
    g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.24));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(sx-46,y,92,h);c.restore();
    text(c,P('學名','Scientific name'),cx,y+h+32,22,C.muted,'center');c.restore();});
  text(c,P('學名有兩個字，全世界通用','Two words, used worldwide'),480,548,24,C.yellow,'center');
}
function namesSplit(c,an,t,tau){
  const g=ease(tau/1),breathe=4*Math.sin(t*2.4)*clamp(tau-1);
  an.forEach((a,j)=>{const cx=N_CX[j],gw=measure(c,a.genus,NS,ITAL)+32,ew=measure(c,a.epithet,NS,ITAL)+32,gap=mix(0,30,g)+breathe,x0=cx-(gw+gap+ew)/2,y=372,h=56;
    nameTile(c,a.genus,x0,y,gw,h,GEN);nameTile(c,a.epithet,x0+gw+gap,y,ew,h,EPI);
    c.save();c.globalAlpha=g;text(c,P('屬名','Genus'),x0+gw/2,y+h+34,22,GEN,'center');text(c,P('種小名','Epithet'),x0+gw+gap+ew/2,y+h+34,22,EPI,'center');c.restore();});
  const items=[[GEN,P('第一個字：屬名','1st word: genus')],[EPI,P('第二個字：種小名','2nd word: specific epithet')]],ws=items.map(([,p])=>measure(c,p,22)+40),tot=ws[0]+ws[1]+48;
  let x=480-tot/2;items.forEach(([col,p],i)=>{D.round(c,x,524,28,28,7,col,C.ink);text(c,p,x+40,546,22,col);x+=ws[i]+48;});
}
function namesCompare(c,pr,an,t,tau){
  const gw=Math.max(...an.map(a=>measure(c,a.genus,NS,ITAL)))+32,ew=Math.max(...an.map(a=>measure(c,a.epithet,NS,ITAL)))+32,gap=64,W=gw+gap+ew;
  const nameW=Math.max(...an.map(a=>measure(c,a.common,22))),x0=Math.max(480-W/2,40+nameW+28),xg=x0,xe=x0+gw+gap;
  const v=ease(tau/.8),m=ease((tau-1)/.6),YA=212,YB=330,H=56,MY=(YA+H+YB)/2,shG=pr.shared==='genus';
  const cols=[[xg+gw/2,gw,shG],[xe+ew/2,ew,!shG]];
  if(m>0)cols.forEach(([cx,,same])=>{if(same)glow(c,cx,MY,84,SAME,(.2+.08*Math.sin(t*3))*m);});
  c.save();c.globalAlpha=v;text(c,P('屬名','Genus'),xg+gw/2,196,22,GEN,'center');text(c,P('種小名','Epithet'),xe+ew/2,196,22,EPI,'center');c.restore();
  [[an[0],YA-(1-v)*18],[an[1],YB+(1-v)*18]].forEach(([a,y])=>{c.save();c.globalAlpha=v;text(c,a.common,40,y+H/2+8,22,C.white);nameTile(c,a.genus,xg,y,gw,H,GEN);nameTile(c,a.epithet,xe,y,ew,H,EPI);c.restore();});
  if(m<=0)return;
  c.save();c.globalAlpha=m;
  cols.forEach(([cx,w,same])=>{const col=same?SAME:DIFF;
    [YA,YB].forEach((y,q)=>{outline(c,cx-w/2-6,y-6,w+12,H+12,15,col,4,same?null:[9,7]);if(same)sweep(c,cx-w/2,y,w,H,t+q*.3,12,.4);});
    if(same){line(c,[[cx,YA+H+8],[cx,YB-8]],SAME,4);D.flow(c,[[cx,YA+H+8],[cx,YB-8]],t*3,3,(cc,x,y)=>{glow(cc,x,y,14,C.white,.6);circle(cc,x,y,4,C.white,null);});pulse(c,cx,MY,t,SAME,18);tick(c,cx,MY,18);}
    else{pulse(c,cx,MY,t+.4,DIFF,18);cross(c,cx,MY,18);}});
  const V=shG?[[true,P('屬名相同：同一屬，親緣較近','Same genus: closer relatives')],[false,P('種小名不同：是兩種動物','Different epithets: two species')]]
            :[[false,P('屬名不同：不同屬，不是近親','Different genera: not relatives')],[true,P('種小名相同，不代表是親戚','A shared epithet does not mean kin')]];
  const vw=Math.max(...V.map(([,p])=>measure(c,p,24)))+40,vx=480-vw/2;
  V.forEach(([same,p],i)=>{const y=446+i*44;(same?tick:cross)(c,vx+14,y-8,14);text(c,p,vx+40,y,24,same?SAME:DIFF);});
  text(c,P('看學名，要看完整的兩個字','Always read both words of the name'),480,560,24,C.yellow,'center');
  c.restore();
}
function namesWriting(c,a,t,tau){
  const S=46,gs=a.genus,es=a.epithet,sp=measure(c,' ',S,ITAL),wg=measure(c,gs,S,ITAL),we=measure(c,es,S,ITAL),gx=560-(wg+sp+we)/2,ex=gx+wg+sp,Y=300,v=ease(tau/.8);
  c.save();c.globalAlpha=v;
  pill(c,P('印刷：斜體','In print: italic'),40,Y-31,{color:C.white});
  text(c,gs,gx,Y,S,GEN,'left',ITAL);text(c,es,ex,Y,S,EPI,'left',ITAL);
  const lw=measure(c,gs[0],S,ITAL),lx=gx+lw/2+1;
  ellipse(c,lx,Y-16,lw/2+10,29,null,C.yellow,2.5);pulse(c,lx,Y-16,t,C.yellow,22);
  text(c,P('第一個字母大寫','Capital first letter'),gx-8,226,22,C.yellow);arrow(c,lx,234,lx+1,252,C.yellow,3);
  line(c,[[ex,Y+10],[ex,Y+18],[ex+we,Y+18],[ex+we,Y+10]],EPI,2.5);
  text(c,P('全部小寫','All lower case'),ex+we/2,Y+48,22,EPI,'center');
  const HY=452;pill(c,P('手寫：畫底線','By hand: underline'),40,HY-31,{color:C.white});
  const hg=measure(c,gs,S),he=measure(c,es,S),hs=measure(c,' ',S),hx=560-(hg+hs+he)/2,hx2=hx+hg+hs;
  text(c,gs,hx,HY,S,C.white);text(c,es,hx2,HY,S,C.white);
  const p=clamp(mod(t,3.4)/2.4),pg=clamp(p*2),pe=clamp(p*2-1),uy=HY+14;
  if(pg>0)line(c,[[hx,uy],[hx+hg*pg,uy]],C.white,3.5);if(pe>0)line(c,[[hx2,uy],[hx2+he*pe,uy]],C.white,3.5);
  if(p<1)glow(c,pe>0?hx2+he*pe:hx+hg*pg,uy,16,C.yellow,.85);
  text(c,P('引用學名，一定要寫完整的兩個字','Always write both words'),480,560,24,C.yellow,'center');
  c.restore();
}
function drawNames(c,s,t){
  board(c);
  const pr=NM.pairs[s.pair],an=[pr.a,pr.b],{k,tau}=stageClock(s,t,5,6.5);s.shown=k;
  const mv=k===3?ease(tau/.9):1;
  an.forEach((a,j)=>{const box=k<=2?N_BIG[j]:k===3?lerpR(N_BIG[j],N_SMALL[j],mv):N_SMALL[j];drawIn(c,a.pic,fitRect(a.pic,box.x,box.y,box.w,box.h),{flip:N_FLIP[s.pair][j],alpha:k===4&&j===1?.4:1});});
  if(k<=2)an.forEach((a,j)=>{const cx=N_CX[j];text(c,a.common,cx,294,26,C.white,'center');const w=measure(c,a.place,22)+28;pill(c,a.place,cx-w/2,308,{color:C.muted});});
  if(k===0)namesMeet(c,an,t);else if(k===1)namesCards(c,an,t,tau);else if(k===2)namesSplit(c,an,t,tau);else if(k===3)namesCompare(c,pr,an,t,tau);else namesWriting(c,pr.a,t,tau);
}

// ── Tab 2: ranks ───────────────────────────────────────────────────────────
const RK=TXT.ranks,AN=RK.animals,R_Y0=182,R_H=52,R_L=400,R_R=560;
const taxFont=r=>isEn()&&r>=5?ITAL:FONT;
function rankName(c,i,x,y,color=C.white){if(isEn()){text(c,RK.rankNames[i][1],x,y,22,color,'center');return;}
  const zh=RK.rankNames[i][0],en=RK.rankNames[i][1],w1=measure(c,zh,26),w2=measure(c,en,22),x0=x-(w1+8+w2)/2;text(c,zh,x0,y,26,color);text(c,en,x0+w1+8,y,22,rgba(C.muted,.95));}
function drawLadder(c,s,t){
  const pr=RK.pairs[s.pair],A=AN[pr.a],Bn=AN[pr.b],sp=pr.split,{k,tau}=stageClock(s,t,3,7.5);s.shown=k;
  drawIn(c,A.pic,fitRect(A.pic,20,8,270,160));drawIn(c,Bn.pic,fitRect(Bn.pic,670,8,270,160),{flip:true});
  text(c,A.name,304,98,26,C.white);text(c,Bn.name,656,98,26,C.white,'right');
  text(c,P('分類的「地址」','The classification "address"'),480,164,22,C.muted,'center');
  const T0=.5,DT=.6,done=T0+(sp+1)*DT+.3,rev=i=>k===2?1:k===0?0:clamp((tau-T0-Math.min(i,sp+1)*DT)/.35),fin=k===2||(k===1&&tau>done);
  const bottom=R_Y0+7*R_H;
  if(k===0){const sy=R_Y0+mod(t*.32,1)*7*R_H;c.save();c.beginPath();c.rect(130,R_Y0,700,7*R_H);c.clip();D.round(c,130,sy-R_H/2,700,R_H,10,rgba(C.yellow,.12),null);c.restore();}
  for(let i=0;i<7;i++){const y=R_Y0+i*R_H,cy=y+R_H/2,r=rev(i),st=i<sp?'same':i===sp?'split':'below';
    if(r>0&&st==='same'){c.save();c.globalAlpha=r;D.round(c,134,y+4,692,R_H-8,10,rgba(SAME,.13),null);c.restore();}
    if(r>0&&st==='split'){c.save();c.globalAlpha=r;D.round(c,134,y+4,692,R_H-8,10,rgba(DIFF,.16+(fin?.08*Math.sin(t*3):0)),null);outline(c,134,y+4,692,R_H-8,10,rgba(DIFF,.8),2.5);c.restore();}
  }
  line(c,[[R_L,R_Y0-6],[R_L,bottom+6]],rgba(C.white,.6),4);line(c,[[R_R,R_Y0-6],[R_R,bottom+6]],rgba(C.white,.6),4);
  for(let i=1;i<7;i++)line(c,[[R_L,R_Y0+i*R_H],[R_R,R_Y0+i*R_H]],rgba(C.white,.3),2);
  if(fin&&sp>0){const pts=[[R_L,R_Y0],[R_L,R_Y0+sp*R_H]],pts2=[[R_R,R_Y0],[R_R,R_Y0+sp*R_H]];line(c,pts,SAME,4);line(c,pts2,SAME,4);
    D.flow(c,pts,t*1.6,3,(cc,x,y)=>circle(cc,x,y,5,C.white,null));D.flow(c,pts2,t*1.6,3,(cc,x,y)=>circle(cc,x,y,5,C.white,null));}
  if(k===1&&!fin){const yy=R_Y0+clamp((tau-T0)/(DT*(sp+1)))*(sp+1)*R_H;glow(c,R_L,yy,22,C.yellow,.9);glow(c,R_R,yy,22,C.yellow,.9);circle(c,R_L,yy,6,C.yellow,null);circle(c,R_R,yy,6,C.yellow,null);}
  for(let i=0;i<7;i++){const y=R_Y0+i*R_H,cy=y+R_H/2,r=rev(i),st=i<sp?'same':i===sp?'split':'below',dim=st==='below'&&(k>0)?.38:1;
    c.save();c.globalAlpha=dim;rankName(c,i,480,cy+8,st==='split'&&r>0?DIFF:C.white);c.restore();
    if(r<=0){text(c,'?',380,cy+8,24,rgba(C.muted,.7),'right');text(c,'?',580,cy+8,24,rgba(C.muted,.7),'left');continue;}
    c.save();c.globalAlpha=r*dim;
    [[A,380,'right'],[Bn,580,'left']].forEach(([an,x,al])=>{const p=an.chain[i];if(p)text(c,p,x,cy+8,22,st==='split'?DIFF:C.white,al,taxFont(i));else text(c,'…',x,cy+8,22,C.muted,al);});
    if(st==='same'){tick(c,160,cy,15);tick(c,800,cy,15);}
    if(st==='split'){if(fin){pulse(c,160,cy,t,DIFF,15);pulse(c,800,cy,t,DIFF,15);}cross(c,160,cy,15);cross(c,800,cy,15);}
    c.restore();}
  if(fin){const a=RK.rankNames[sp-1],b=RK.rankNames[sp];text(c,P(`相同到「${a[0]}」，在「${b[0]}」分開`,`Shared down to ${a[1].toLowerCase()}; split at ${b[1].toLowerCase()}`),480,580,24,C.yellow,'center');}
  else if(k===0)text(c,P('猜一猜：牠們從哪一層開始不一樣？','Guess: at which rank do they start to differ?'),480,580,22,C.muted,'center');
}
// Classification tree (left to right). Leaves are the seven animals; each column is one rank.
const T_LEAVES=['wolf','coyote','cat','horse','spider','crab','snail'],T_Y=i=>98+i*74,T_PICX=858,T_PICW=94;
const T_LAST=T_LEAVES.map(id=>{const ch=AN[id].chain;let r=6;while(r>0&&!ch[r])r--;return r;});
const T_COLS=(()=>{const cols=[];for(let r=0;r<7;r++){const col=[];let cur=null;
    T_LEAVES.forEach((id,i)=>{const p=AN[id].chain[r],key=p?p[0]:null;if(cur&&key&&cur.key===key)cur.i1=i;else{cur={r,key,label:p,i0:i,i1:i};col.push(cur);}});
    col.forEach(n=>{n.y=(T_Y(n.i0)+T_Y(n.i1))/2;});cols.push(col);}
  cols.forEach((col,r)=>{if(r)col.forEach(n=>{n.parent=cols[r-1].find(p=>p.i0<=n.i0&&p.i1>=n.i0);});});return cols;})();
const HYPH={Perissodactyla:['Perisso-','dactyla'],Malacostraca:['Malaco-','straca'],Arthropoda:['Arthro-','poda'],Gastropoda:['Gastro-','poda']};
function nodeLines(n){if(!n.label)return['…'];const str=D.tr(n.label);if(!isEn())return[str];if(n.r===6)return str.split(' ');return HYPH[str]||[str];}
const nodeFont=n=>n.label?taxFont(n.r):FONT;
function nodeW(c,n){return Math.max(...nodeLines(n).map(l=>measure(c,l,22,nodeFont(n))));}
function headSize(){return isEn()?22:26;}
function treeLayout(c){const L='tree'+(isEn()?'en':'zh');if(LAY[L])return LAY[L];
  const colW=T_COLS.map((col,r)=>Math.max(measure(c,D.tr(RK.rankNames[r]),headSize())-14,...col.map(n=>nodeW(c,n))));
  const sum=colW.reduce((a,b)=>a+b,0),G=Math.max(20,(T_PICX-22-16-sum)/7),xL=[];let x=24;colW.forEach(w=>{xL.push(x);x+=w+G;});
  return LAY[L]={colW,G,xL};}
function treeEdge(c,Lo,p,n){const x0=Lo.xL[p.r]+nodeW(c,p)+7,x1=Lo.xL[n.r]-5,sx=Lo.xL[n.r]-Lo.G/2-3;return[[x0,p.y],[sx,p.y],[sx,n.y],[x1,n.y]];}
function drawTree(c,s,t){
  const {k,tau}=stageClock(s,t,4,7);s.shown=k;const Lo=treeLayout(c),{xL,colW}=Lo;
  let Dp,g;if(k<3){Dp=k;g=clamp(tau/1);}else{const q=Math.min(3,Math.floor(tau/1.1));Dp=3+q;g=clamp((tau-q*1.1)/1);}
  for(let r=0;r<7;r++){const col=r<=Dp?(r===Dp?C.yellow:C.white):rgba(C.muted,.4);text(c,RK.rankNames[r],xL[r]+colW[r]/2,44,headSize(),col,'center');}
  line(c,[[16,60],[944,60]],rgba(C.white,.18),2);
  T_LEAVES.forEach((id,i)=>place(c,AN[id].pic,T_PICX,T_Y(i)-35,T_PICW,70));
  // links from the deepest revealed rank to each animal; ranks not shown are "…"
  T_LEAVES.forEach((id,i)=>{const rr=Math.min(Dp,T_LAST[i]),n=T_COLS[rr].find(m=>m.i0<=i&&m.i1>=i),x0=xL[rr]+nodeW(c,n)+8,y=T_Y(i),end=[T_PICX-6,y];
    if(Dp===6||Dp>T_LAST[i]){line(c,[[x0,n.y],end],rgba(C.white,Dp===6?.55:.35),2.5);
      for(let r=T_LAST[i]+1;r<=Dp;r++){const w=measure(c,'…',22);D.round(c,xL[r]-5,y-11,w+10,22,6,C.board,null);text(c,'…',xL[r],y+7,22,C.muted);}}
    else dashLine(c,[[x0,n.y],end],rgba(C.muted,.35),2,t,20,[5,7]);});
  for(let r=1;r<=Dp;r++)T_COLS[r].forEach(n=>{if(!n.label)return;const pts=treeEdge(c,Lo,n.parent,n),f=r===Dp?g:1;sline(c,polyPart(pts,f),r===Dp?C.yellow:rgba(C.white,.75),3);
    if(f>=1&&n.parent.y!==n.y)D.flow(c,pts,t*.9+n.i0*.13,2,(cc,x,y)=>circle(cc,x,y,3.6,r===Dp?C.white:C.yellow,null));});
  for(let r=0;r<=Dp;r++)T_COLS[r].forEach(n=>{if(!n.label)return;const a=r===Dp&&Dp>0?clamp(g*1.4-.3):1;if(a<=0)return;c.save();c.globalAlpha=a;
    const ls=nodeLines(n),col=r===Dp?C.yellow:C.white;
    ls.forEach((l,j)=>text(c,l,xL[r],ls.length>1?n.y-5+j*25:n.y+8,22,col,'left',nodeFont(n)));c.restore();});
  if(Dp===0)glow(c,xL[0]+nodeW(c,T_COLS[0][0])/2,T_COLS[0][0].y,70,C.yellow,.12+.06*Math.sin(t*3));
}
function drawRanks(c,s,t){board(c);if(s.view===1)drawTree(c,s,t);else drawLadder(c,s,t);}

// ── Tab 3: kingdoms ────────────────────────────────────────────────────────
const KG=TXT.kingdoms;
const FQ=[P('有細胞核嗎？','Nucleus?'),P('有細胞壁嗎？','Cell wall?'),P('有組織和器官嗎？','Tissues and organs?'),P('有葉綠體嗎？','Chloroplasts?'),P('有根、莖、葉嗎？','Roots, stems, leaves?')];
const FPOS={q0:[720,62],q1:[580,166],e0:[860,166],q3:[470,270],q2:[720,270],q4:[418,374],e2:[578,374],e4:[700,374],e1a:[845,374],e3:[362,478],e1b:[497,478]};
const fTarget=(i,ans)=>{const r=ans?KG.flow[i].yes:KG.flow[i].no;return typeof r==='number'?'q'+r:r.k===1?(i===2?'e1a':'e1b'):'e'+r.k;};
const F_EDGES=(()=>{const o=[];KG.flow.forEach((n,i)=>[true,false].forEach(ans=>o.push({i,ans,from:'q'+i,to:fTarget(i,ans)})));return o;})();
const NODE_TRAIT=[0,1,3,2,3];
const TRAITS=[['nucleus',P('細胞核','Nucleus')],['wall',P('細胞壁','Cell wall')],['chloroplast',P('葉綠體','Chloroplasts')],['organized',P('組織器官或根莖葉','Organised body')]];
const YES=P('是','Yes'),NO=P('否','No');
function fBox(c,id){const [x,y]=FPOS[id];
  if(id[0]==='q'){const i=+id.slice(1),rows=splitLines(c,D.tr(FQ[i]),180,22),w=Math.max(...rows.map(r=>measure(c,r,22)))+24,h=rows.length*28+16;return{x,y,w,h,rows,q:true};}
  const kk=id==='e1a'||id==='e1b'?1:+id[1],p=KG.kingdomNames[kk],w=measure(c,p,22)+28;return{x,y,w,h:44,rows:[D.tr(p)],q:false};}
function fEdge(c,a,b){const A=fBox(c,a),Bx=fBox(c,b),y0=A.y+A.h/2,y1=Bx.y-Bx.h/2,my=(y0+y1)/2;return{pts:[[A.x,y0],[A.x,my],[Bx.x,my],[Bx.x,y1]],px:Bx.x,py:my};}
function drawSpecimen(c,sp,cx,cy,s,t){if(sp.pic)place(c,sp.pic,cx-120,cy-116,240,232);else ICON[sp.icon](c,cx,cy,s,t);}
function drawFlow(c,s,t){
  const sp=KG.specimens[s.spec],path=KG.paths[sp.id],walk=path.length*1.3,{k,tau,held}=clockD(s,t,[3.6,walk+1.6,5.5]);s.shown=k;
  panel(c,20,20,280,560);panel(c,310,20,630,560);
  drawSpecimen(c,sp,160,152,1.15,t);text(c,sp.name,160,300,26,C.yellow,'center');
  let j=-1,f=0,landed=false;
  if(k===1){const q=held?mod(tau,walk+1.6):tau;if(q<walk){j=Math.floor(q/1.3);f=q-j*1.3;}else landed=true;}
  if(k===2)landed=true;
  const doneN=landed?path.length:Math.max(0,j),lit=new Set(),walked=new Set(),visited=new Set();
  for(let n=0;n<path.length;n++){const [node,ans]=path[n];if(n<doneN)walked.add(node+':'+ans);if(n<doneN||(n===j&&f>=.35))lit.add(node+':'+ans);if(n<doneN||n===j)visited.add('q'+node);}
  const last=path[path.length-1],landId=fTarget(last[0],last[1]),cur=j>=0&&!landed?'q'+path[j][0]:null,trait=cur?NODE_TRAIT[path[j][0]]:-1;
  TRAITS.forEach(([key,lab],i)=>{const y=330+i*62,a=k===0?clamp((tau-.3-i*.5)/.4):1,on=i===trait;
    D.round(c,32,y,256,52,10,on?rgba(C.yellow,.14):'rgba(11,26,21,.5)',on?C.yellow:C.edge);
    text(c,lab,46,y+34,22,on?C.yellow:C.white);if(a<=0){text(c,'?',262,y+34,22,C.muted,'center');return;}
    c.save();c.globalAlpha=a;(sp.flags[key]?tick:cross)(c,262,y+26,15);c.restore();if(on)pulse(c,262,y+26,t,C.yellow,15);});
  // tree
  c.save();c.globalAlpha=k===0?.55:1;
  F_EDGES.forEach(e=>{const {pts}=fEdge(c,e.from,e.to),on=walked.has(e.i+':'+e.ans);sline(c,pts,on?SAME:rgba(C.white,.45),on?4:2.5);
    if(on)D.flow(c,pts,t*1.2,2,(cc,x,y)=>circle(cc,x,y,3.5,C.white,null));
    if(!on&&j>=0&&!landed&&f>=.6&&e.i===path[j][0]&&e.ans===path[j][1])sline(c,polyPart(pts,(f-.6)/.7),SAME,4);});
  F_EDGES.forEach(e=>{const {px,py}=fEdge(c,e.from,e.to),on=lit.has(e.i+':'+e.ans);smallPill(c,e.ans?YES:NO,px,py,on?{fill:SAME,stroke:C.white,color:C.deep}:{});});
  Object.keys(FPOS).forEach(id=>{const b=fBox(c,id),x=b.x-b.w/2,y=b.y-b.h/2,isCur=id===cur,isLand=landed&&id===landId;
    if(b.q){D.round(c,x,y,b.w,b.h,12,'rgba(11,26,21,.92)',null);outline(c,x,y,b.w,b.h,12,isCur?C.yellow:visited.has(id)?SAME:rgba(C.white,.7),isCur||visited.has(id)?3:2);
      if(isCur)glow(c,b.x,b.y,b.w*.6,C.yellow,.1+.06*Math.sin(t*5));
      b.rows.forEach((r,i)=>text(c,r,b.x,y+30+i*28,22,isCur?C.yellow:C.white,'center'));}
    else{if(isLand){glow(c,b.x,b.y,70,C.yellow,.3+.12*Math.sin(t*3));rpulse(c,x,y,b.w,b.h,t);}
      D.round(c,x,y,b.w,b.h,10,isLand?C.yellow:'rgba(242,236,217,.08)',null);outline(c,x,y,b.w,b.h,10,isLand?C.white:rgba(C.white,.6),2);
      text(c,b.rows[0],b.x,b.y+8,22,isLand?C.deep:C.white,'center');}});
  c.restore();
  if(k===0){const sy=330+mod(t*.45,1)*248;c.save();c.beginPath();c.rect(32,330,256,248);c.clip();D.round(c,32,sy-26,256,52,10,rgba(C.yellow,.14),null);c.restore();
    const b=fBox(c,'q0');pulse(c,b.x-b.w/2-16,b.y,t,C.yellow,9);circle(c,b.x-b.w/2-16,b.y,7,C.yellow,null);
    text(c,P('先看左邊的特徵，再從最上面開始問','Read the traits, then start at the top'),625,552,22,C.muted,'center');}
  if(j>=0&&!landed&&f>=.6){const e=fEdge(c,'q'+path[j][0],fTarget(path[j][0],path[j][1])),pp=polyPart(e.pts,(f-.6)/.7),[x,y]=pp[pp.length-1];glow(c,x,y,22,C.yellow,.9);circle(c,x,y,7,C.yellow,null);}
  if(j>=0&&!landed)wrap(c,KG.flow[path[j][0]].q,625,552,580,22,C.white,28,'center');
  if(landed)text(c,KG.result[sp.id].title,625,554,26,C.yellow,'center');
}
// Five-kingdom table
const CELL_HYPH={Photosynthesis:['Photo-','synthesis']};
function cellLines(c,str,maxW){if(measure(c,str,22)<=maxW)return[str];if(CELL_HYPH[str])return CELL_HYPH[str];const m=str.match(/^(.+?[：、])(.+)$/);if(m)return[m[1],m[2]];return splitLines(c,str,maxW,22);}
function drawTable(c,s,t){
  const {k,tau}=stageClock(s,t,5,4.6);s.shown=k;
  const X0=158,CW=156,Y0=150,RH=86;
  KG.kingdomNames.forEach((nm,j)=>{const cx=X0+j*CW+CW/2;
    place(c,['nostoc.png','sea_lettuce.png','stinkhorn.png','fern.png','seastar.png'][j],cx-50,24,100,78);
    text(c,nm,cx,134,22,C.white,'center');});
  line(c,[[16,Y0],[944,Y0]],rgba(C.white,.5),2);
  for(let j=0;j<5;j++)line(c,[[X0+j*CW,Y0+8],[X0+j*CW,Y0+5*RH-8]],rgba(C.white,.14),2);
  KG.traitRows.forEach((row,i)=>{const y=Y0+i*RH,act=i===k,show=i<=k;
    if(i)line(c,[[16,y],[944,y]],rgba(C.white,.14),2);
    if(act){D.round(c,16,y+5,928,RH-10,12,rgba(C.yellow,.1+.05*Math.sin(t*3)),null);outline(c,16,y+5,928,RH-10,12,rgba(C.yellow,.75),2.5);
      c.save();c.beginPath();c.roundRect(16,y+5,928,RH-10,12);c.clip();const sx=mod(t*.35,1)*1100-70,g=c.createLinearGradient(sx-60,0,sx+60,0);g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.12));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(sx-60,y,120,RH);c.restore();}
    text(c,row.label,28,y+RH/2+8,22,act?C.yellow:show?C.white:rgba(C.muted,.5));
    if(!show){for(let j=0;j<5;j++)text(c,'…',X0+j*CW+CW/2,y+RH/2+8,22,rgba(C.muted,.35),'center');return;}
    row.cells.forEach((p,j)=>{const cx=X0+j*CW+CW/2,cy=y+RH/2,a=act?clamp((tau-.2-j*.25)/.3):1;if(a<=0)return;c.save();c.globalAlpha=a;
      const mk=row.mark[j],str=D.tr(p);
      if(mk<2){const tw=measure(c,str,22),x0=cx-(28+8+tw)/2;(mk?tick:cross)(c,x0+14,cy,14);text(c,str,x0+36,cy+8,22,mk?SAME:DIFF);}
      else{const ls=cellLines(c,str,140);ls.forEach((l,q)=>text(c,l,cx,cy+8+(q-(ls.length-1)/2)*27,22,C.white,'center'));}
      c.restore();});});
}
function drawKingdoms(c,s,t){board(c);if(s.view===1)drawTable(c,s,t);else drawFlow(c,s,t);}

// ── Tab 4: identification key ──────────────────────────────────────────────
const KY=TXT.key;
const KQS={wings:P('有翅膀或硬殼？','Wings or wing-case?'),two:P('兩片透明翅膀？','Two clear wings?'),shell:P('外層翅膀像硬殼？','Hard outer wings?'),long:P('觸角很長？','Long antennae?')};
const KPOS=[{n0:[625,62],n1:[500,150],silverfish:[790,150],fly:[400,238],n2:[620,238],beetle:[535,326],dragonfly:[735,326]},
            {n0:[625,74],n1:[470,182],n2:[790,182],beetle:[395,292],silverfish:[545,292],fly:[715,292],dragonfly:[865,292]}];
const kRef=r=>typeof r==='number'?'n'+r:r;
function kLeads(key,r,target){return typeof r==='string'?r===target:kLeads(key,key[r].yes,target)||kLeads(key,key[r].no,target);}
function kRoute(key,target){const out=[];let r=0;while(typeof r==='number'){const yes=kLeads(key,key[r].yes,target);out.push({n:r,ans:yes});r=yes?key[r].yes:key[r].no;}return out;}
function kBox(c,ki,id){const [x,y]=KPOS[ki][id];
  if(/^n\d$/.test(id)){const p=KQS[KY.keys[ki][+id[1]].q],w=measure(c,p,22)+28;return{x,y,w,h:44,rows:[D.tr(p)],q:true};}
  const spc=KY.specimens.find(z=>z.id===id),rows=splitLines(c,D.tr(spc.name),130,22),w=Math.max(...rows.map(r=>measure(c,r,22)))+26,h=rows.length*26+18;return{x,y,w,h,rows,q:false};}
function kEdge(c,ki,a,b){const A=kBox(c,ki,a),Bx=kBox(c,ki,b),y0=A.y+A.h/2,y1=Bx.y-Bx.h/2,my=(y0+y1)/2;return{pts:[[A.x,y0],[A.x,my],[Bx.x,my],[Bx.x,y1]],px:Bx.x,py:my};}
const K_BTN=[{ans:true,x:470,y:478,w:150,h:56},{ans:false,x:660,y:478,w:150,h:56}];
function keyReset(s){s.node=0;s.path=[];s.moveFrom=null;s.moveTo=null;s.moveT=-9;s.wrongT=-9;s.wrongAns=null;s.solved=false;s.solvedT=0;s.start=s.elapsed||0;}
function keyAnswer(s,v){if(s.mode!==0||s.solved)return;const key=KY.keys[s.key],spc=KY.specimens[s.spec],nd=key[s.node],right=kLeads(key,nd.yes,spc.id);
  if(v===right){s.path.push({n:s.node,ans:v});s.moveFrom='n'+s.node;const nx=v?nd.yes:nd.no;s.moveTo=kRef(nx);s.moveT=s.elapsed;s.wrongT=-9;
    if(typeof nx==='string'){s.solved=true;s.solvedT=s.elapsed+.6;}else s.node=nx;}
  else{s.wrongT=s.elapsed;s.wrongAns=v;}}
function keyStatus(s,t){
  const key=KY.keys[s.key],spc=KY.specimens[s.spec];
  if(s.mode===1){const route=kRoute(key,spc.id),per=2.2,tot=route.length*per+3.6,q=mod(t-(s.start||0),tot);
    if(q<route.length*per){const j=Math.floor(q/per),f=q-j*per,r=route[j],nx=r.ans?key[r.n].yes:key[r.n].no;
      return{done:route.slice(0,j+(f>=1.6?1:0)),cur:r.n,lit:f>=1?r.ans:null,move:f>=1.6?{from:'n'+r.n,to:kRef(nx),f:(f-1.6)/.6}:null,solved:false};}
    return{done:route,cur:null,lit:null,move:null,solved:true,age:q-route.length*per};}
  const mv=s.moveFrom&&t-s.moveT<.6?{from:s.moveFrom,to:s.moveTo,f:(t-s.moveT)/.6}:null;
  return{done:s.path,cur:s.solved?null:s.node,lit:null,move:mv,solved:s.solved&&t>=s.solvedT,pending:s.solved&&t<s.solvedT,age:t-s.solvedT};
}
function drawKey(c,s,t){
  board(c);
  const ki=s.key,key=KY.keys[ki],spc=KY.specimens[s.spec],st=keyStatus(s,t),pos=KPOS[ki];
  s.cur={q:st.cur==null?null:key[st.cur].q,solved:st.solved||!!st.pending};
  // specimen
  panel(c,20,20,280,560);
  place(c,spc.pic,34,34,252,252);
  if(st.solved){const a=clamp(st.age/.5);glow(c,160,330,110,C.yellow,.18+.08*Math.sin(t*3));D.round(c,36,298,248,64,14,rgba(C.yellow,.16),null);outline(c,36,298,248,64,14,C.yellow,3);
    c.save();c.globalAlpha=a;text(c,spc.name,160,339,26,C.yellow,'center');c.restore();rpulse(c,36,298,248,64,t,C.yellow,14);}
  else{outline(c,36,298,248,64,14,rgba(C.muted,.7),2.5,[8,7]);text(c,'?',160,344,38,rgba(C.muted,.7+.3*Math.sin(t*3)),'center');}
  circle(c,52,410,12,null,C.yellow,3);text(c,P('現在的問題','Current question'),76,418,22,C.white);
  line(c,[[38,456],[66,456]],SAME,4);text(c,P('走過的路','Path taken'),76,464,22,C.white);
  (s.mode===1?[P('看示範：','Watch:'),P('檢索表自己走一遍','the key walks itself')]:[P('看圖回答：','Look at the picture,'),P('按「是」或「否」','then tap Yes or No')]).forEach((p,i)=>text(c,p,38,516+i*30,22,C.muted));
  // key tree
  panel(c,310,20,630,350);
  const doneSet=new Set(st.done.map(d=>d.n+':'+d.ans)),visited=new Set(st.done.map(d=>'n'+d.n));
  const edges=[];key.forEach((nd,i)=>[true,false].forEach(ans=>edges.push({i,ans,from:'n'+i,to:kRef(ans?nd.yes:nd.no)})));
  edges.forEach(e=>{const {pts}=kEdge(c,ki,e.from,e.to),on=doneSet.has(e.i+':'+e.ans);sline(c,pts,on?SAME:rgba(C.white,.42),on?4:2.5);});
  edges.forEach(e=>{const {px,py}=kEdge(c,ki,e.from,e.to),on=doneSet.has(e.i+':'+e.ans);smallPill(c,e.ans?YES:NO,px,py,on?{fill:SAME,stroke:C.white,color:C.deep}:{});});
  Object.keys(pos).forEach(id=>{const b=kBox(c,ki,id),x=b.x-b.w/2,y=b.y-b.h/2,isCur=b.q&&st.cur!=null&&id==='n'+st.cur&&!st.move,isLeaf=!b.q,win=isLeaf&&st.solved&&id===spc.id;
    if(win){glow(c,b.x,b.y,72,C.yellow,.3+.12*Math.sin(t*3));rpulse(c,x,y,b.w,b.h,t);}
    D.round(c,x,y,b.w,b.h,b.q?12:10,win?C.yellow:b.q?'rgba(11,26,21,.92)':'rgba(242,236,217,.08)',null);
    outline(c,x,y,b.w,b.h,b.q?12:10,isCur?C.yellow:win?C.white:visited.has(id)?SAME:rgba(C.white,b.q?.7:.55),isCur||visited.has(id)?3:2);
    if(isCur){glow(c,b.x,b.y,b.w*.55,C.yellow,.1+.07*Math.sin(t*5));rpulse(c,x,y,b.w,b.h,t);}
    b.rows.forEach((r,i)=>text(c,r,b.x,b.q?b.y+8:y+31+i*26,22,win?C.deep:isCur?C.yellow:C.white,'center'));});
  // the dot: floats at the current question, or travels along the chosen branch
  if(st.move){const e=kEdge(c,ki,st.move.from,st.move.to),pp=polyPart(e.pts,ease(st.move.f)),[x,y]=pp[pp.length-1];glow(c,x,y,24,C.yellow,.9);circle(c,x,y,7,C.yellow,null);}
  else if(st.cur!=null){const b=kBox(c,ki,'n'+st.cur),x=b.x-b.w/2-18,y=b.y+6*Math.sin(t*3);glow(c,x,y,24,C.yellow,.85);circle(c,x,y,7,C.yellow,null);}
  // question panel
  const wa=s.mode===0?t-s.wrongT:99,dx=wa<.5?9*Math.sin(wa*48)*(1-wa/.5):0;
  c.save();c.translate(dx,0);panel(c,310,384,630,196,wa<.5?'#2a2a22':C.panel);
  if(st.solved||st.pending){if(st.solved){tick(c,346,428,16);wrap(c,spc.result,374,436,540,24,C.white,32);}
    if(s.mode===0){const lab=P('再走一次','Walk again'),w=Math.max(170,measure(c,lab,24)+48);D.round(c,330,504,w,54,14,'rgba(11,26,21,.92)',null);outline(c,330,504,w,54,14,C.yellow,3);text(c,lab,330+w/2,539,24,C.yellow,'center');
      if(st.solved)D.hit(330,504,w,54,'again',1);text(c,P('也可以換一張檢索表','Try the other key too'),330+w+24,539,22,C.muted);}
    else text(c,P('也可以換一張檢索表','Try the other key too'),625,548,22,C.muted,'center');}
  else{const q=KY.questions[key[st.cur].q];wrap(c,q.q,625,424,590,24,C.white,32,'center');
    K_BTN.forEach(b=>{const lit=st.lit===b.ans,bad=s.mode===0&&wa<2.6&&s.wrongAns===b.ans;
      D.round(c,b.x,b.y,b.w,b.h,14,lit?SAME:bad?rgba(DIFF,.2):'rgba(11,26,21,.92)',null);outline(c,b.x,b.y,b.w,b.h,14,lit?C.white:bad?DIFF:C.yellow,3);
      text(c,b.ans?YES:NO,b.x+b.w/2,b.y+37,26,lit?C.deep:bad?DIFF:C.white,'center');
      if(s.mode===0)D.hit(b.x,b.y,b.w,b.h,'ans',b.ans);});
    if(s.mode===1)pill(c,P('示範','Demo'),832,486,{color:C.cyan});
    if(wa<2.6)text(c,KY.wrong,625,566,22,DIFF,'center');}
  c.restore();
}

// ── Tab 5: species and breeds ──────────────────────────────────────────────
const SP=TXT.species,SPP=SP.pics;
const CHI_SH=.53,DANE_SH=.72; // shoulder height as a fraction of each picture's height (read off the pictures)
function card(c,p,cx,y,w,h,color,{dash=null,size=26,alpha=1}={}){c.save();c.globalAlpha*=alpha;D.round(c,cx-w/2,y,w,h,14,'rgba(11,26,21,.9)',null);outline(c,cx-w/2,y,w,h,14,color,3,dash);text(c,p,cx,y+h/2+size*.36,size,C.white,'center');c.restore();}
function badge(c,p,cx,y,color,good){const w=measure(c,p,22)+64,h=40,x=cx-w/2;D.round(c,x,y,w,h,h/2,rgba(color,.16),null);outline(c,x,y,w,h,h/2,color,2.5);(good?tick:cross)(c,x+22,y+h/2,13,color);text(c,p,x+42,y+28,22,color);return w;}
function flowArrow(c,pts,color,t,on=true){sline(c,pts,rgba(color,.8),3.5);const n=pts.length,[x1,y1]=pts[n-2],[x2,y2]=pts[n-1];arrow(c,mix(x1,x2,.7),mix(y1,y2,.7),x2,y2,color,3.5);if(on)D.flow(c,pts,t*1.4,3,(cc,x,y)=>circle(cc,x,y,4.5,C.white,null));}
function drawDogs(c,s,t,k,tau){
  const GROUND=512,CH=SIZE['dog_chihuahua.png'],GD=SIZE['dog_great_dane.png'],nm=[SPP.dog_chihuahua.name,SPP.dog_great_dane.name];
  if(k<=1){
    const g=k===1?ease(tau/1.6):0,dH=mix(300,330,g),dW=dH*GD[0]/GD[1],cH=mix(300,dH*DANE_SH*.25/CHI_SH,g),cW=cH*CH[0]/CH[1];
    const dX=mix(690,700,g)-dW/2,cX=mix(255,380,g)-cW/2,rc={x:cX,y:GROUND-cH,w:cW,h:cH},rd={x:dX,y:GROUND-dH,w:dW,h:dH};
    line(c,[[60,GROUND+2],[920,GROUND+2]],rgba(C.muted,.55),3);
    drawIn(c,'dog_chihuahua.png',rc);drawIn(c,'dog_great_dane.png',rd);
    text(c,nm[0],rc.x+rc.w/2,552,26,C.white,'center');text(c,nm[1],rd.x+rd.w/2,552,26,C.white,'center');
    if(k===0){const q=P('都是狗，是同一種嗎？','Both are dogs. One species?');dashLine(c,[[90,GROUND-300],[880,GROUND-300]],rgba(C.white,.4),2.5,t,30,[10,10]);glow(c,480,128,150,C.yellow,.1+.05*Math.sin(t*3));text(c,q,480,138,28,C.yellow,'center');
      text(c,P('畫成差不多大，方便比較樣子','Drawn about the same size to compare shapes'),480,590,22,C.muted,'center');return;}
    const a=clamp((tau-1.4)/.6);if(a<=0)return;c.save();c.globalAlpha=a;
    const BX=110,sh=dH*DANE_SH,yC=GROUND-cH*CHI_SH,yD=GROUND-sh;
    line(c,[[BX,GROUND],[BX,yD-14]],C.white,3);
    for(let n=0;n<=4;n++){const y=GROUND-n*sh/4;line(c,[[BX-8,y],[BX+8,y]],C.white,3);text(c,String(n*20),BX-14,y+8,22,C.white,'right');}
    text(c,P('公分','cm'),BX,yD-24,22,C.muted,'center');
    const my=yD+mod(t*.4,1)*(GROUND-yD);glow(c,BX,GROUND-(my-yD),16,C.yellow,.85);
    dashLine(c,[[BX+10,yC],[rc.x+rc.w*.62,yC]],rgba(C.yellow,.85),2.5,t,24);dashLine(c,[[BX+10,yD],[rd.x+rd.w*.33,yD]],rgba(C.yellow,.85),2.5,t,24);
    circle(c,rc.x+rc.w*.62,yC,5,C.yellow,null);circle(c,rd.x+rd.w*.33,yD,5,C.yellow,null);
    text(c,SP.realSize.chihuahua,rc.x+rc.w/2,rc.y-18,22,C.yellow,'center');text(c,SP.realSize.dane,rd.x+rd.w/2,rd.y-18,22,C.yellow,'center');
    text(c,'×4',BX+30,(yC+yD)/2+10,26,C.yellow);
    c.restore();return;}
  // k === 2: two breeds → a mixed-breed dog that is fertile → one species
  const rc=place(c,'dog_chihuahua.png',70,40,280,220),rd=place(c,'dog_great_dane.png',610,40,280,220);
  text(c,nm[0],rc.x+rc.w/2,292,24,C.white,'center');text(c,nm[1],rd.x+rd.w/2,292,24,C.white,'center');
  text(c,'×',480,170,48,C.white,'center');
  const v=ease(tau/1);c.save();c.globalAlpha=v;
  flowArrow(c,quadPts([210,306],[230,370],[352,382]),SAME,t);flowArrow(c,quadPts([750,306],[730,370],[608,382]),SAME,t);
  card(c,SP.cards.puppy,480,350,250,64,SAME);sweep(c,355,350,250,64,t);
  const bw=measure(c,SP.cards.fertile,22)+64;pulse(c,480-bw/2+22,448,t,SAME,14);badge(c,SP.cards.fertile,480,428,SAME,true);
  pill(c,P('同一種','Same species'),480-(measure(c,P('同一種','Same species'),26)+28)/2,500,{active:true,color:SAME,size:26});
  c.restore();
}
const CAT_NOTES={cat_longhair:[P('長毛','Long coat'),P('橘白色','Orange and cream'),P('沒有明顯條紋','No clear stripes')],
  cat_shorthair:[P('短毛','Short coat'),P('銀灰色','Silver grey'),P('黑色條紋','Black stripes')],
  cat_tabby:[P('短毛','Short coat'),P('橘色','Orange'),P('深橘色條紋','Darker stripes')]};
// where each numbered call-out points on the picture (fractions of the picture box), and where its marker sits
const CAT_PTS={cat_longhair:[[.72,.36],[.42,.6],[.2,.86]],cat_shorthair:[[.6,.42],[.28,.5],[.78,.93]],cat_tabby:[[.4,.5],[.55,.7],[.3,.9]]};
const CAT_MK={cat_longhair:[[.98,.22],[.02,.5],[-.04,.74]],cat_shorthair:[[.96,.3],[-.06,.36],[1.04,.78]],cat_tabby:[[.96,.36],[1.02,.62],[-.06,.8]]};
function drawCats(c,s,t,k,tau){
  const cats=['cat_longhair','cat_shorthair','cat_tabby'],CX=[170,480,790];
  if(k===0)glow(c,mix(-40,1000,mod(t*.2,1)),200,170,C.yellow,.18);
  const rs=cats.map((id,i)=>{const cx=CX[i];return place(c,SPP[id].file,cx-130,52,260,286);});
  cats.forEach((id,i)=>text(c,SPP[id].name,CX[i],38,24,C.white,'center'));
  if(k===0){text(c,P('都是家貓嗎？','Are they all domestic cats?'),480,400,28,C.yellow,'center');text(c,P('先比一比：毛、顏色、花紋','Compare their coats, colours and patterns'),480,446,22,C.muted,'center');return;}
  if(k===1){
    text(c,P('差在哪？① 毛的長短　② 毛色　③ 花紋','What differs? ① coat length  ② colour  ③ pattern'),480,384,22,DIFF,'center');
    cats.forEach((id,i)=>{const r=rs[i];CAT_NOTES[id].forEach((p,n)=>{const a=clamp((tau-.3-n*.6-i*.2)/.4);if(a<=0)return;c.save();c.globalAlpha=a;
      const [px,py]=at(r,...CAT_PTS[id][n]),[mx,my]=at(r,...CAT_MK[id][n]);
      dashLine(c,[[mx,my],[mix(mx,px,.82),mix(my,py,.82)]],rgba(DIFF,.9),3,t,18,[7,6]);arrow(c,mix(mx,px,.7),mix(my,py,.7),px,py,DIFF,3);
      marker(c,mx,my,n+1,t+n*.3+i*.2,13,DIFF);
      const ly=428+n*40;marker(c,CX[i]-108,ly-7,n+1,null,13,DIFF);text(c,p,CX[i]-86,ly,22,C.white);c.restore();});});
    return;}
  const v=ease(tau/1);c.save();c.globalAlpha=v;
  const by=366;sline(c,[[50,by-14],[50,by],[910,by],[910,by-14]],SAME,4);line(c,[[480,by],[480,by+16]],SAME,4);
  const gx=mix(50,910,mod(t*.3,1));glow(c,gx,by,18,C.white,.8);
  const lab=P('同一種：家貓','One species: domestic cat'),w=measure(c,lab,28);tick(c,480-w/2-26,416,16);pulse(c,480-w/2-26,416,t,SAME,16);
  text(c,lab,480+14,426,28,SAME,'center');text(c,'Felis catus',480,474,32,C.white,'center',ITAL);
  text(c,P('外形不同，不等於不同種','Looking different ≠ a different species'),480,540,24,C.yellow,'center');
  c.restore();
}
function drawSame(c,s,t,k,tau){
  const aL=k===1?.4:1,aR=k===0?.3:1,onL=k!==1,onR=k!==0;
  dashLine(c,[[480,30],[480,500]],rgba(C.white,.25),2,0);
  text(c,SP.stepTitle[2][0],245,46,28,SAME,'center');text(c,SP.stepTitle[2][1],715,46,28,DIFF,'center');
  c.save();c.globalAlpha=aL;
  place(c,'dog_chihuahua.png',36,62,170,136);place(c,'dog_great_dane.png',284,62,170,136);text(c,'×',245,146,40,C.white,'center');
  flowArrow(c,[[245,206],[245,250]],SAME,t,onL);card(c,SP.cards.puppy,245,252,250,56,SAME);if(onL)sweep(c,120,252,250,56,t);
  badge(c,SP.cards.fertile,245,318,SAME,true);if(onL)pulse(c,245-(measure(c,SP.cards.fertile,22)+64)/2+22,338,t,SAME,13);
  flowArrow(c,[[245,362],[245,396]],SAME,t,onL);card(c,P('下一代的小狗','Its own puppies'),245,398,250,52,SAME,{size:24});
  tick(c,245+125-4,398,14);
  c.restore();
  c.save();c.globalAlpha=aR;
  place(c,'horse_bay.png',500,62,190,136);text(c,'×',715,146,40,C.white,'center');
  card(c,SP.cards.donkey,835,96,150,78,C.white,{dash:[8,6],size:30});
  flowArrow(c,[[715,206],[715,250]],DIFF,t,onR);card(c,SP.cards.mule,715,252,250,56,DIFF);if(onR)sweep(c,590,252,250,56,t+.5);
  badge(c,SP.cards.sterile,715,318,DIFF,false);
  dashLine(c,[[715,362],[715,394]],rgba(DIFF,.7),3,onR?t:0);card(c,P('下一代','Next generation'),715,398,250,52,rgba(C.muted,.6),{dash:[7,6],size:24,alpha:.55});
  if(onR)pulse(c,715+125-4,398,t,DIFF,14);cross(c,715+125-4,398,14);
  c.restore();
  if(k===2){const v=ease(tau/1);c.save();c.globalAlpha=v;D.round(c,80,474,800,70,16,rgba(C.yellow,.12),null);outline(c,80,474,800,70,16,C.yellow,3);
    glow(c,mix(100,860,mod(t*.25,1)),509,40,C.yellow,.25);
    text(c,P('自然交配 ＋ 有生殖能力的後代 ＝ 同一種','Natural mating + fertile offspring = one species'),480,518,26,C.yellow,'center');c.restore();}
  else{const cx=k===0?245:715,col=k===0?SAME:DIFF;glow(c,cx,494,150,col,.12+.08*Math.sin(t*3));text(c,k===0?P('後代能再生小孩','The offspring can breed'):P('後代幾乎不能生育','The offspring almost never breed'),cx,500,22,col,'center');}
}
function drawSpecies(c,s,t){board(c);const {k,tau}=stageClock(s,t,3,7);s.shown=k;if(s.view===0)drawDogs(c,s,t,k,tau);else if(s.view===1)drawCats(c,s,t,k,tau);else drawSame(c,s,t,k,tau);}

// ── tabs ───────────────────────────────────────────────────────────────────
const stepOf=s=>s.phase<0?(s.shown||0):s.phase;
const T=TXT;
const tabs=[
{id:'names',title:T.names.title,sub:T.names.sub,hook:T.names.hook,body:T.names.body,reading:T.names.reading,closure:T.names.closure,quiz:T.names.quiz,
 sources:[],init:()=>({running:true,pair:0,phase:-1,start:0}),
 controls:s=>[choice(P('選一組','Pick a pair'),'pair',NM.pairs.map((p,i)=>[i,p.label])),steps(NM.stepShort)],
 act(s,k,v){s[k]=v;s.start=s.elapsed;},
 explain:s=>{const k=stepOf(s);return{title:NM.stepTitle[k],text:NM.stepText[s.pair][k]};},
 draw:drawNames},
{id:'ranks',title:T.ranks.title,sub:T.ranks.sub,hook:T.ranks.hook,body:T.ranks.body,reading:T.ranks.reading,closure:T.ranks.closure,quiz:T.ranks.quiz,
 sources:[],init:()=>({running:true,view:0,pair:0,phase:-1,start:0}),
 controls:s=>{const out=[choice(P('觀察','View'),'view',RK.viewLabel.map((l,i)=>[i,l]))];
   if(s.view===0)out.push(choice(P('選一組','Pick a pair'),'pair',RK.pairLabel.map((l,i)=>[i,l])),steps(RK.cmpStepShort));else out.push(steps(RK.treeStepShort));return out;},
 act(s,k,v){s[k]=v;if(k==='view')s.phase=-1;s.start=s.elapsed;},
 explain:s=>{const k=stepOf(s);if(s.view===1)return{title:RK.treeStepTitle[k],text:RK.treeStepText[k]};
   const pr=RK.pairs[s.pair];return{title:RK.cmpStepTitle[k],text:k===0?RK.cmpText0(AN[pr.a].name,AN[pr.b].name):k===1?RK.cmpText1:RK.cmpText2[s.pair]};},
 draw:drawRanks},
{id:'kingdoms',title:T.kingdoms.title,sub:T.kingdoms.sub,hook:T.kingdoms.hook,body:T.kingdoms.body,reading:T.kingdoms.reading,closure:T.kingdoms.closure,quiz:T.kingdoms.quiz,
 sources:[],init:()=>({running:true,view:0,spec:1,phase:-1,start:0}),
 controls:s=>{const out=[choice(P('觀察','View'),'view',KG.viewLabel.map((l,i)=>[i,l]))];
   if(s.view===0)out.push(choice(P('選一種生物','Pick an organism'),'spec',KG.specimens.map((x,i)=>[i,x.name])),steps(KG.flowStepShort));else out.push(steps(KG.traitStepShort));return out;},
 act(s,k,v){s[k]=v;if(k==='view')s.phase=-1;s.start=s.elapsed;},
 explain:s=>{const k=stepOf(s);if(s.view===1)return{title:KG.traitStepTitle[k],text:KG.traitStepText[k]};
   if(k===2)return KG.result[KG.specimens[s.spec].id];return{title:KG.flowStepTitle[k],text:KG.flowStepText[k]};},
 draw:drawKingdoms},
{id:'key',title:T.key.title,sub:T.key.sub,hook:T.key.hook,body:T.key.body,reading:T.key.reading,closure:T.key.closure,quiz:T.key.quiz,
 sources:[],init:()=>({running:true,key:0,spec:0,mode:0,node:0,path:[],moveFrom:null,moveTo:null,moveT:-9,wrongT:-9,wrongAns:null,solved:false,solvedT:0,start:0}),
 controls:()=>[choice(P('檢索表','Key'),'key',KY.keyLabel.map((l,i)=>[i,l])),choice(P('標本','Specimen'),'spec',KY.specimens.map((x,i)=>[i,P(`標本 ${'ABCD'[i]}`,`Specimen ${'ABCD'[i]}`)])),choice(P('方式','Mode'),'mode',KY.modeLabel.map((l,i)=>[i,l]))],
 act(s,k,v){if(k==='ans')return keyAnswer(s,v);if(k==='again')return keyReset(s);s[k]=v;keyReset(s);},
 explain:s=>{const spc=KY.specimens[s.spec],key=KY.keys[s.key],cur=s.mode===0?{q:s.solved?null:key[s.node].q,solved:s.solved}:(s.cur||{q:key[0].q,solved:false});
   if(cur.solved||cur.q==null)return{title:spc.name,text:spc.result};
   const Q=KY.questions[cur.q],wrongNow=s.mode===0&&(s.elapsed||0)-s.wrongT<2.6;
   return{title:Q.q,text:wrongNow?P(KY.wrong[0]+Q.hint[0],KY.wrong[1]+' '+Q.hint[1]):Q.hint};},
 draw:drawKey},
{id:'species',title:T.species.title,sub:T.species.sub,hook:T.species.hook,body:T.species.body,reading:T.species.reading,closure:T.species.closure,quiz:T.species.quiz,
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',SP.viewLabel.map((l,i)=>[i,l])),steps(SP.stepShort[s.view])],
 act(s,k,v){s[k]=v;if(k==='view')s.phase=-1;s.start=s.elapsed;},
 explain:s=>{const k=stepOf(s);return{title:SP.stepTitle[s.view][k],text:SP.stepText[s.view][k]};},
 draw:drawSpecies}
];
B.register({id:'naming_classification',title:P('命名與分類：替生命找座標','Naming and classification: locating living things'),subtitle:P('學名、分類層級、五界與檢索','Scientific names, ranks, five kingdoms and keys'),cover:'assets/covers/biology_naming_classification_1021_v1.jpg',assetDir:'assets/biology/biodiversity_originals_1010_v1/',family:P('地球上的生物','Life on Earth'),bookName:P('五界生物','Five-kingdom biology'),tabs});
})();
