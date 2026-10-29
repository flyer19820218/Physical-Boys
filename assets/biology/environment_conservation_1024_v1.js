/* Unit 11 lesson 3 · "How do we know conservation works?" V5 remake, 2026-10-25 (plan: assets/biology/environment_plan_1024.md section 4).
 * Five tabs; each has its animation views plus a "Textbook photos" view (the original textbook pictures, kept).
 *   conservation-evidence: turtle (one turtle, several homes), toolbox (four tools together), assess (assessment is not law)
 *   habitat-connections:   fishway (finding, passing, surviving), corridor (overpass and culvert), monitor (one sighting is not enough)
 *   everyday-actions:      track (baseline first, then track; option s.action), tradeoff (which is better depends), citizen (a good record)
 *   traditional-knowledge: season (rules tied to a season), clues (what a photo can say), materials (natural materials have conditions)
 *   synthesis:             casefile (compare, trace, act, verify on one stream)
 * Colours (plan 1.4): protection / connection green, tracking evidence cyan, pressure orange, population bar green, unknown = white dashed frame, always together with the name.
 * Each view is drawn by its own module environment_draw_<name>_1024_v1.js, registered as window.EnvironmentDraw[name] (canvas 960x600).
 * While a module is missing a stub is drawn. Every view has s.phase (-1 play all, >=0 hold) and s.start; the module sets s.shown = step.
 * Pictures: environment_ai_1024/CV* (teacher's Gemini AI illustrations, not photographs; originals 1024 wide) and ecology_ai_1023/ HB4, environment_ai_1024/ BD7, TH1a/TH1b/TH2 reused; textbook originals: environment_originals_1010_v1/.
 * Option for track: s.action 0 = reusable cup, 1 = public bicycle (set by chips drawn inside the animation, or LivingBook.action('action', i)).
 */
(()=>{'use strict';
const K=window.EnvironmentKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps,ORIG=K.ORIG;

// ── textbook originals (kept as the "Textbook photos" view) ───────────────
  const rights = P(`原圖取自老師提供的《人類與環境》；原圖作者及個別授權未確認，不宣稱開放授權。`, `Original from the teacher-provided Human Beings and the Environment textbook; its individual creator and licence are unconfirmed, and no open licence is claimed.`);
  const pic = (file, name, page, text) => ({ file, name, page, text: P(text[0] + '\n' + rights[0], text[1] + '\n' + rights[1]), sourceInfo: { source: '人類與環境.pdf', file, pdfPage: page - 159, printedPage: page, author: null, licence: null, pageVerification: 'Individually viewed original image and rendered printed page' } });
  const turtle = pic(ORIG+'Im72_1684.png', P(`綠蠵龜原圖`, `Green sea turtle original`), 174, P(`課本用綠蠵龜引出物種與棲地一起保育。照片不是即時追蹤，也沒有提供目前 IUCN 等級；觀察時不觸摸、追逐或餵食。`, `The textbook uses green turtles to introduce conserving species and habitat together. The photo is not live tracking and gives no current IUCN category; do not touch, chase or feed turtles when observing.`));
  const leopardcat = pic(ORIG+'Im33_317.png', P(`石虎原圖`, `Leopard cat original`), 166, P(`課本以石虎討論道路、農地開發與棲地。照片顯示一隻個體，不能提供臺灣總數、活動路徑或目前保育等級。`, `The textbook uses leopard cats to discuss roads, agriculture and habitat. One individual cannot establish Taiwan's population, movement paths or present conservation category.`));
  const fishladder = pic(ORIG+'Im1_16.png', P(`大東勢溪魚梯原圖`, `Dadongshi Stream fishway original`), 160, P(`課本說明以分段落差改善河道連通。照片顯示設施，不提供使用率、通過成功率或所有魚種的適用性；動畫裡的魚梯是示意，不是魚梯工程圖。`, `The source describes smaller height steps to improve river connectivity. The photo shows a structure, not use, passage success or suitability for all fish. The fishway in the animation is a schematic, not an engineering drawing.`));
  const stream = pic(ORIG+'Im18_99.png', P(`淡水溪流原圖`, `Freshwater stream original`), 163, P(`觀察溪水、底質及岸邊植被。單張影像不能量流速、溶氧，也看不到所有水中生物。`, `Observe water, substrate and bank vegetation. One image cannot measure flow or dissolved oxygen, nor show every aquatic organism.`));
  const cups = pic(ORIG+'Im117_1991.png', P(`循環杯歸還原圖`, `Reusable cup return original`), 179, P(`原圖上的中文是原有店家標示，完整保留；僅用作內容圖，不用作無字封面。觀察歸還動作，不把這張照片當成所有商店目前的服務或環境成效。`, `Chinese shop lettering is part of the unchanged original, used within the lesson rather than as a text-free cover. Observe returning a cup; the image does not establish present services at all shops or environmental benefits.`));
  const biking = pic(ORIG+'Im121_2022.png', P(`公共自行車原圖`, `Public bicycle original`), 179, P(`課本生活行動例子，可討論交通替代與可行條件；照片沒有每公里排放或目前租借規則，圖像本身不是減碳計算。`, `A source example of everyday action for discussing travel alternatives and feasibility. The photo supplies neither emissions per kilometre nor current rental rules and does not calculate carbon savings.`));
  const ceremony = pic(ORIG+'Im142_2279.png', P(`達悟族招魚祭原圖`, `Tao fish-calling ceremony original`), 184, P(`這是課本的招魚祭影像，不是漁獲或魚種照片。儀式意義和捕魚規範要由閱讀與族人脈絡理解，不能只從服飾推定整個族群的所有生活方式。`, `This shows the source fish-calling ceremony, not catch or fish species. Interpret ritual and fishing practices through the reading and community context, not clothing or assumptions about all community members.`));
  const vessels = pic(ORIG+'Im145_2298.png', P(`植物素材器皿原圖`, `Plant-material vessels original`), 185, P(`課本列竹子、林投葉、檳榔葉鞘等素材；不是每件器皿都可只憑照片辨出材料。影像沒有分解時間、衛生檢測或採集影響的資料。`, `The textbook lists bamboo, pandan leaves and areca sheaths; not every vessel's material can be identified from a photo. The image has no decomposition time, hygiene test or collection-impact data.`));
  const woven = pic(ORIG+'Im146_2301.png', P(`阿里鳳鳳原圖`, `Alifongfong original`), 185, P(`課本以林投葉編織的阿里鳳鳳介紹阿美族生活器物。照片可見編織結構，製作脈絡與名稱來自閱讀；不憑圖片推定所有族群都用同一種做法。`, `The textbook introduces the pandan-leaf alifongfong as an Amis everyday object. The weaving is visible; its making and name come from reading, and one photo does not imply every people share one practice.`));

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
turtle:{tab:P(`一隻海龜用幾個家`,`How many homes does one turtle use?`),
 short:[P(`產卵的沙灘`,`Nesting beach`),P(`離開沙灘`,`Leaving the beach`),P(`外海成長`,`Growing offshore`),P(`海草床覓食`,`Seagrass feeding`),P(`回來產卵`,`Back to nest`)],
 names:[P(`家一：產卵的沙灘`,`Home 1: the nesting beach`),P(`孵化後離開沙灘`,`After hatching: leaving the beach`),P(`家二：外海成長`,`Home 2: growing offshore`),P(`家三：近岸海草床覓食`,`Home 3: feeding in seagrass beds`),P(`回到海岸產卵，循環才完整`,`Back to the coast to nest: the cycle is complete`)],
 text:[P(`綠蠵龜把卵產在沙灘的沙裡（小圖是沙下卵窩的剖面）。沙灘是牠的第一個家：產卵。（AI 插圖，非實拍。）`,`Green turtles lay eggs in the sand of a beach (the small picture is a cross-section of an egg chamber under the sand). The beach is the first home: nesting. (AI illustration, not a photo.)`),
  P(`小海龜孵出來以後，要離開沙灘，爬向海。這一刻牠要通過的，還是同一片沙灘。`,`After hatching, the young turtle must leave the beach and crawl to the sea. It still has to cross the same beach.`),
  P(`牠進到外海成長。這一段需要的是外海，不是沙灘。藍色漸層只是示意，不代表某個海域。`,`It grows up offshore. This stage needs the open sea, not the beach. The blue gradient is only a schematic and stands for no particular sea.`),
  P(`近岸的海草床，是覓食的地方。（AI 插圖，非實拍。）同一隻海龜，在不同的階段，用不同的家。`,`Seagrass beds near the shore are a feeding place. (AI illustration, not a photo.) One turtle, at different stages, uses different homes.`),
  P(`成熟以後，牠常回到出生地附近的海岸產卵（多數研究如此）。橘色箭頭指向沙灘：沙灘消失，這個循環就缺一塊。只保護動物、不保護牠要用的家，保育沒有完成。這裡不寫海龜目前的保育等級與數量，也不寫需要幾年。`,`When mature, it often returns to nest near where it hatched (most studies say so). The orange arrow points at the beach: if the beach is gone, the cycle is missing a piece. Protecting only the animal and not the homes it uses is not complete conservation. No present conservation category, numbers or years are given here.`)]},
toolbox:{tab:P(`四種工具一起用`,`Four tools used together`),
 short:[P(`研究`,`Research`),P(`保護區`,`Protected area`),P(`社區參與`,`Community`),P(`跨地區合作`,`Cooperation`)],
 names:[P(`工具一：研究`,`Tool 1: research`),P(`工具二：保護區`,`Tool 2: a protected area`),P(`工具三：社區參與`,`Tool 3: community participation`),P(`工具四：跨地區合作`,`Tool 4: cooperation across regions`)],
 text:[P(`第一個工具是研究：給一隻海龜裝上標記，追蹤牠的路徑，才知道牠用了哪些地方。（AI 插圖，非實拍。）`,`The first tool is research: a turtle carries a tag and its path is tracked, so we learn which places it uses. (AI illustration, not a photo.)`),
  P(`第二個工具是保護區：在產卵的沙灘上，畫出一個受管理的範圍。柔邊的圈是示意，不是真實的邊界。`,`The second tool is a protected area: a managed zone is drawn on the nesting beach. The soft-edged circle is a schematic, not a real boundary.`),
  P(`第三個工具是社區參與：住在海邊的人，沿著海岸巡視、記錄。畫面上的人形是簡化的剪影。`,`The third tool is community participation: people who live by the coast walk along it, watching and recording. The figures are simplified silhouettes.`),
  P(`第四個工具是跨地區合作：海龜的路徑跨過兩段不同的海岸，兩端的地方要彼此配合。四個工具一起發亮：單用一個，缺口還在。這是書載案例，不是現行法律清單；不沿用書中的保育等級、保護區總數、會員數與罰則。`,`The fourth tool is cooperation across regions: the turtle's path crosses two different stretches of coast, and the places at both ends must work together. All four tools light up together: using just one leaves a gap. This is a source case, not a current list of laws; the book's categories, site totals, membership numbers and penalties are not used.`)]},
assess:{tab:P(`評估和法律不一樣`,`Assessment is not law`),
 short:[P(`瀕危評估`,`Risk assessment`),P(`法律與管理`,`Law and management`),P(`不能畫等號`,`Not the same`)],
 names:[P(`瀕危評估：判斷滅絕風險`,`Risk assessment: judging extinction risk`),P(`法律與管理：規範能做什麼`,`Law and management: what may be done`),P(`兩者不能畫等號`,`The two cannot be equated`)],
 text:[P(`評估是用資料判斷一個物種的滅絕風險，要看族群的趨勢、分布的範圍、面臨的威脅（三個小圖示）。`,`Assessment uses data to judge a species' risk of extinction, looking at population trend, range and threats (three small icons).`),
  P(`法律與管理是規範：可以做什麼、不可以做什麼，而且有適用的範圍（柔邊的圈）。`,`Law and management set rules: what may and may not be done, within a defined scope (the soft-edged circle).`),
  P(`評估說的是風險，法律說的是規範，中間是「≠」。那國際單位怎麼知道數量？要有資料：樣方、捉放法、重複調查（回想生態那幾課）。國際組織名稱只當例子，這裡不寫任何物種目前的等級。`,`Assessment speaks about risk and law about rules, with "≠" between them. So how can an international body know numbers? It needs data: quadrats, mark-recapture and repeated surveys (recall the ecology lessons). Organisation names are only examples; no species' current category is given here.`)]},
fishway:{tab:P(`魚梯怎麼走`,`Getting through a fishway`),
 short:[P(`河被攔住`,`A blocked river`),P(`魚梯`,`The fishway`),P(`入口在哪`,`Where is the entrance`),P(`能過的落差`,`Which drops`),P(`三種證據`,`Three kinds of evidence`)],
 names:[P(`河被攔住：一道落差`,`A blocked river: one drop`),P(`加了魚梯：一格一格的水池`,`A fishway: pool by pool`),P(`魚要先找到入口`,`Fish must first find the entrance`),P(`每一格的落差，能過的生物不同`,`Each step: different animals manage different drops`),P(`找到入口、通過、繁殖存活，是三件事`,`Finding, passing and surviving to breed are three things`)],
 text:[P(`河上有一道橫向的堰，水往下掉，形成落差。要游向上游的魚（程式畫的剪影），被擋在落差下面。（AI 插圖，非實拍。）`,`A weir across the river makes the water drop, forming a height step. Fish heading upstream (drawn as silhouettes) are held back below it. (AI illustration, not a photo.)`),
  P(`在旁邊加一條魚梯：把一道大落差拆成許多小落差，一格一格的水池，魚可以一格一格往上。`,`A fishway is added beside it: one big drop is split into many small ones, pool by pool, so fish can climb step by step.`),
  P(`但魚要先找到入口。水流從魚梯口出來的地方亮起，魚是被流向吸引過去的；入口的位置和水流，會影響魚找不找得到。`,`But fish must first find the entrance. The area where water flows out of the fishway lights up; the flow draws fish towards it. The entrance position and flow affect whether fish find it.`),
  P(`從剖面看每一格：落差和水流不同，能通過的生物也不同。鰻魚、吻鰕虎、苦花、米蝦，各有一條「能通過的落差」長條，長度只是示意，不代表任何真實數據；這裡也不寫流速、坡度或工程尺寸。`,`In cross-section, each step differs in drop and flow, so what can pass differs too. Eel, goby, chub and shrimp each get a bar for "drops they can pass"; the lengths are only schematic and stand for no real data. No flow speed, slope or engineering size is given.`),
  P(`三格依序點亮：找到入口、順利通過、到上游產卵並存活。後兩格先是虛線，表示待查證。魚梯蓋好，不等於魚真的用了，也不等於族群變好；要看使用、通過、存活與繁殖等不同的證據。`,`Three boxes light up in turn: finding the entrance, passing through, and reaching upstream to breed and survive. The last two are dashed at first, meaning "to check". A built fishway does not mean fish use it, nor that the population improves; use, passage, survival and breeding are different evidence.`)]},
corridor:{tab:P(`陸橋與涵洞`,`Overpasses and culverts`),
 short:[P(`被路切開`,`Cut by a road`),P(`陸橋`,`Overpass`),P(`涵洞`,`Culvert`),P(`連到哪裡`,`Where it leads`)],
 names:[P(`回顧：被路切開的森林`,`Recap: a forest cut by a road`),P(`陸橋：從上方走過`,`Overpass: crossing above`),P(`涵洞：從路下走過`,`Culvert: passing below`),P(`通道要連到合適的棲地`,`A crossing must lead to suitable habitat`)],
 text:[P(`回到上一課的森林：一條路把森林切成兩塊，石虎在路邊。（AI 插圖，非實拍。）`,`Back to the last lesson's forest: a road splits it in two, and a leopard cat stands at the roadside. (AI illustration, not a photo.)`),
  P(`陸橋：在路的上方蓋一座覆蓋植被的橋，讓動物從上方走過去。`,`An overpass is a vegetated bridge over the road, letting animals cross above it.`),
  P(`涵洞：在路的下面做一條通道，小動物從下方走過。不同的動物，需要不同的設計。`,`A culvert is a passage under the road for small animals to pass below. Different animals need different designs.`),
  P(`通道的兩端要連到合適的棲地，入口要有植被。連到哪裡很重要。通道不能彌補全部的棲地損失。設施完成，不等於成功，要用下一個動畫的方法看有沒有動物真的用。這裡不寫施工數字。`,`Both ends must lead to suitable habitat, and entrances need vegetation. Where it leads matters. A crossing cannot make up for all lost habitat. A finished structure is not yet a success; the next animation shows how to check whether animals really use it. No construction numbers are given.`)]},
monitor:{tab:P(`看到一隻，夠了嗎`,`Is one sighting enough?`),
 short:[P(`一筆紀錄`,`One record`),P(`重複記錄`,`Repeated records`),P(`靠近、進入、通過`,`Near, enter, cross`),P(`還要更多證據`,`More evidence`)],
 names:[P(`一張照片：一筆紀錄`,`One photo: one record`),P(`用同樣的方法重複記錄`,`Repeat records with the same method`),P(`靠近、進入、通過，是不同的事`,`Approaching, entering and crossing differ`),P(`想說「族群恢復」，還需要更多證據`,`Saying "the population recovered" needs more evidence`)],
 text:[P(`自動相機拍到一隻石虎（紅外線夜拍風格的 AI 插圖，非實拍）。這張照片只能說：這個地方、這個時間，出現過一隻。這是一筆紀錄。`,`An automatic camera caught one leopard cat (an infrared night-style AI illustration, not a real photo). The photo says only: at this place and time, one was seen. It is one record.`),
  P(`同樣的相機、同樣的位置、同樣的方法，一次又一次記錄，紀錄一格一格累積起來，才能拿來比較（回想生態的重複調查）。`,`The same camera, place and method, again and again: records build up box by box and can then be compared (recall repeated surveys in ecology).`),
  P(`把紀錄分成三種：靠近通道、進入通道、通過通道。三個計數器同時在走，通過的最少。要看有沒有通過，不是只看有沒有靠近。這是示意，不是真實數據。`,`Records split into three kinds: approaching, entering and crossing the passage. Three counters run together and crossing is the lowest. What matters is crossing, not just approaching. This is schematic, not real data.`),
  P(`要說族群恢復，還需要存活、繁殖與族群數量等證據（回想捉放法與樣方）。不能只拍到一隻，就宣稱族群恢復。`,`Claiming recovery needs evidence such as survival, breeding and population size (recall mark-recapture and quadrats). One photographed animal cannot show a population has recovered.`)]},
track:{tab:P(`先記原本，再追蹤`,`Record the baseline, then track`),
 short:[P(`先記原本`,`Baseline`),P(`開始行動`,`Start acting`),P(`同樣的方法`,`Same method`),P(`看變化`,`Look at change`)],
 names:[P(`先記原本的情況`,`First record how things are now`),P(`開始行動：從這一天起`,`Start acting: from this day on`),P(`用同樣的方法繼續記`,`Keep recording the same way`),P(`看變化，也看有沒有持續`,`Look at change, and at whether it lasts`)],
 text:[P(`橫軸是天，縱軸是每天的次數。用選項選一個行動：循環杯或公共自行車。先記一週原本的情況，灰色的點是基線。所有的點都是教學示意，不是真實數據。`,`The horizontal axis is days, the vertical axis the count per day. Use the options to pick an action: reusable cup or public bicycle. First record a week of how things are; the grey dots are the baseline. All dots are teaching illustrations, not real data.`),
  P(`從這一天開始行動，之後的點變成綠色。`,`From this day on, the action starts and later dots turn green.`),
  P(`繼續用同樣的方法記：同一個時間、同一種單位，前後才能比較。`,`Keep recording the same way: same time, same unit, so before and after can be compared.`),
  P(`看變化，也看有沒有持續下去。口號和照片不是成效數據，紀錄才是。這裡不給任何真實的減量數字。`,`Look at the change and whether it continues. Slogans and photos are not effectiveness data; records are. No real reduction figures are given here.`)]},
tradeoff:{tab:P(`哪一個比較好`,`Which is better?`),
 short:[P(`一次性杯`,`Disposable cup`),P(`循環杯`,`Reusable cup`),P(`交通選擇`,`Transport`),P(`整體判斷`,`The whole picture`)],
 names:[P(`一次性杯：用一次就丟`,`Disposable cup: used once, then thrown away`),P(`循環杯：要用很多次才划得來`,`Reusable cup: worth it only after many uses`),P(`交通：距離、路線、安全`,`Transport: distance, route, safety`),P(`看整體，不保證任何單一商品最好`,`Look at the whole; no single product is always best`)],
 text:[P(`一次性杯：用一次就丟。（AI 插圖，非實拍。）`,`A disposable cup is used once and thrown away. (AI illustration, not a photo.)`),
  P(`循環杯：要用很多次、要清洗、要有地方歸還，才有機會划得來。標示：使用次數、清洗、歸還。`,`A reusable cup has a chance of paying off only if it is used many times, washed, and there is somewhere to return it. Labels: number of uses, washing, return.`),
  P(`交通：距離短、路線安全，騎自行車比較可行；距離長或路線不安全，就不一定。標示：距離、路線、安全。`,`Transport: for short distances and safe routes cycling is more feasible; for long distances or unsafe routes it may not be. Labels: distance, route, safety.`),
  P(`判斷要看材料、使用次數、運輸與處理，也就是整體的環境影響；不能保證任何單一商品都最好。這裡不寫排碳公里數。`,`Judge by materials, number of uses, transport and disposal, that is, the overall environmental impact; no single product is guaranteed best. No carbon-per-kilometre figures are given.`)]},
citizen:{tab:P(`一筆好紀錄`,`A good record`),
 short:[P(`五格紀錄`,`Five fields`),P(`先記特徵`,`Features first`),P(`安全第一`,`Safety first`)],
 names:[P(`一筆好紀錄有五格`,`A good record has five fields`),P(`不確定時，先記特徵`,`When unsure, record features first`),P(`安全第一`,`Safety first`)],
 text:[P(`地點、日期、時間、照片、特徵：五個格子逐一填滿。野外觀察常用的工具有筆記本、望遠鏡、相機與放大鏡。（AI 插圖，非實拍。）`,`Place, date, time, photo, features: five fields filled in one by one. Common field tools are a notebook, binoculars, a camera and a hand lens. (AI illustration, not a photo.)`),
  P(`不確定是什麼生物時，先記下看得到的特徵，不急著猜名字（回想生態的辨識方法）。`,`When unsure what an organism is, record the features you can see first and do not rush to guess a name (recall identification in ecology).`),
  P(`安全：不進車道、不搬動動物；路死動物的紀錄，以老師安排的安全資料為主。`,`Safety: never step onto a road and never move an animal; for roadkill records use safe data arranged by the teacher.`)]},
season:{tab:P(`季節裡的規範`,`Rules tied to a season`),
 short:[P(`魚群來的季節`,`Season of the fish`),P(`捕與休息`,`Fishing and rest`),P(`資源補充`,`Replenishment`),P(`特定地方的規範`,`A local rule`)],
 names:[P(`一年中，魚群來的季節`,`The season when the fish come`),P(`有的時間捕，有的時間休息`,`Some times to fish, some to rest`),P(`休息的時間，資源有機會補充`,`During rest, the resource can be replenished`),P(`這是特定族群、特定地方的規範`,`These rules belong to a particular people and place`)],
 text:[P(`圓形的盤子代表一年的季節（不寫月份）。魚群接近的那一段弧線亮起，中央是飛魚。（AI 插圖，非實拍。）`,`The circular dial stands for the seasons of a year (no months are written). The arc when fish approach lights up, with a flying fish at the centre. (AI illustration, not a photo.)`),
  P(`在課本的例子裡，有的時間捕魚，有的時間休息。弧線分成兩段顏色。`,`In the textbook example there are times to fish and times to rest. The arc is split into two colours.`),
  P(`休息的時間，資源有機會補充。右側的族群條回升，這是示意，沒有任何真實數字。`,`During the rest period the resource has a chance to be replenished. The population bar on the right rises; this is schematic, with no real numbers.`),
  P(`這是特定族群、特定地方的規範；不同族群、不同地方有不同的做法。不能當成現在的時間表，也不是捕撈許可。`,`These rules belong to a particular people and place; different peoples and places have different practices. They are not a present-day schedule and not fishing permission.`)]},
clues:{tab:P(`一張照片能說什麼`,`What can a photo tell us?`),
 short:[P(`祭典`,`Ceremony`),P(`器皿`,`Vessels`),P(`編織`,`Weaving`)],
 names:[P(`祭典照片：看得見的、閱讀的、要詢問的`,`Ceremony photo: visible, read, or to be asked`),P(`器皿照片`,`Vessel photo`),P(`編織照片：一張照片只是一個線索`,`Weaving photo: one photo is only a clue`)],
 text:[P(`每張照片旁有三個欄位：照片可見、閱讀提供、需要詢問族人。祭典照片的「可見」只寫看得見的，例如人、服飾、場所；其餘兩欄先是虛線。這裡用的是課本原圖。`,`Beside each photo are three columns: visible in the photo, provided by reading, and to be asked of the community. For the ceremony photo, "visible" holds only what can be seen, such as people, clothing and place; the other two columns are dashed at first. The textbook originals are used here.`),
  P(`器皿：「可見」是形狀與材料的外觀；「閱讀提供」是課本提到的材料；「需要詢問」是製作的脈絡。`,`Vessels: "visible" is the shape and the look of the material; "provided by reading" is the material the textbook names; "to be asked" is the making and its context.`),
  P(`編織：同樣分成三欄。一張照片只是一個線索；我們不替任何族群說他們沒有說過的話。`,`Weaving: the same three columns. One photo is only a clue; we do not speak for any people about what they have not said.`)]},
materials:{tab:P(`天然素材的條件`,`Conditions for natural materials`),
 short:[P(`採集`,`Collecting`),P(`製作與重複使用`,`Making and reuse`),P(`用完以後`,`After use`)],
 names:[P(`天然素材不是沒有成本`,`Natural materials are not cost-free`),P(`製作，以及用幾次`,`Making it, and how many times it is used`),P(`用完以後：要查證，不一概而論`,`After use: check, do not generalise`)],
 text:[P(`竹子、露兜（林投）葉、檳榔葉鞘、香蕉葉，是四種天然素材。採集會不會超過補充，要看量與方法。這裡用通用名稱，不掛特定族群。（AI 插圖，非實拍。）`,`Bamboo, pandan leaves, areca sheath and banana leaf are four natural materials. Whether collecting exceeds replenishment depends on amount and method. Common names are used, not tied to any particular people. (AI illustration, not a photo.)`),
  P(`製作要花時間和力氣；重複使用的次數，影響它值不值得。`,`Making things takes time and effort; the number of reuses affects whether it is worth it.`),
  P(`用完以後，分解要看條件（落葉在落葉層被分解，回想生態）。要查證，不一概而論；不沿用書中商品「28 天」或塑膠年數當通則。`,`After use, decomposition depends on conditions (leaf litter decomposes in the litter layer; recall ecology). Check it; do not generalise. The book's "28 days" for a product or years for plastic are not used as rules.`)]},
casefile:{tab:P(`同一條溪，比、追、做、驗`,`One stream: compare, trace, act, verify`),
 short:[P(`比`,`Compare`),P(`追`,`Trace`),P(`做`,`Act`),P(`驗`,`Verify`)],
 names:[P(`比：這條溪有哪些居民、哪些住處`,`Compare: who lives here and in which habitats`),P(`追：這條溪承受什麼壓力`,`Trace: what pressures does this stream face`),P(`做：兩個措施`,`Act: two measures`),P(`驗：用同樣的方法追蹤`,`Verify: track with the same method`)],
 text:[P(`第一課的工具：比。這條溪有哪些居民（物種多樣性）、哪些住處（生態系多樣性）。（AI 插圖，非實拍。）`,`Lesson 1's tool: compare. Which residents live in this stream (species diversity) and which habitats does it have (ecosystem diversity)? (AI illustration, not a photo.)`),
  P(`第二課的工具：追。三個橘色的壓力逐一亮起：棲地被改變、營養鹽增加、外來種。每一個各連一條線，到「改變了什麼條件」。`,`Lesson 2's tool: trace. Three orange pressures light up one by one: habitat altered, more nutrients, nonnative species. Each connects by a line to "which condition changed".`),
  P(`第三課的工具：做。兩個綠色的措施：魚梯，以及減少排放（簡單圖示）。`,`Lesson 3's tool: act. Two green measures: a fishway, and reducing discharge (simple icons).`),
  P(`驗：追蹤。用同樣的方法、重複記錄（青色，追蹤證據）。措施不等於成效。這是練習用的情境，不給任何真實結果。`,`Verify: track. Use the same method and repeated records (cyan, tracking evidence). A measure is not an effect. This is a practice scenario; no real results are given.`)]}
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
{id:'conservation-evidence',title:P(`保護一隻，還要保護什麼？`,`What else must we protect?`),sub:P(`物種、棲地與合作`,`Species, habitat and cooperation`),
 hook:P(`前一課追到了壓力。這一課問：我們做了措施，怎麼知道真的有用？先從一隻海龜開始：海龜不被捕捉，但產卵的沙灘消失了，保育就完成了嗎？`,`The last lesson traced the pressures. This lesson asks: once we take measures, how do we know they really work? Start with one turtle: if turtles are no longer caught but the nesting beach disappears, is conservation complete?`),
 body:P(`保育是有計畫地管理自然資源，防止破壞與過度利用。物種需要覓食、繁殖與遷移的環境，保育須兼顧棲地、遺傳差異與生物交互作用。課本以綠蠵龜串起研究、保護區、社區參與及跨地區合作；不是把動物隔離保存就完成工作。每個措施都問三件事：它補了哪一塊？有人用嗎？用同樣的方法追蹤了嗎？`,`Conservation is planned management of natural resources to prevent destruction and overuse. Organisms need feeding, breeding and movement habitats, alongside genetic variation and biological interactions. The textbook uses green turtles to connect research, protected areas, communities and cooperation across regions; isolating animals is not a complete solution. For every measure ask three things: which gap does it fill, do organisms use it, and was it tracked with the same method?`),
 reading:P(`補充：用國際合作、貿易管理、瀕危評估與棲地保護說明不同工具。這是書載案例，不是現行法律清單；不沿用書中海龜等級、保護區總數、會員數與罰則當最新資訊。評估是依據資料判斷風險，法律則有其適用範圍；兩者不能直接畫等號。也想一想：國際單位如何知道瀕危生物數？留待學生提出資料需求。`,`The source illustrates cooperation, trade management, threat assessment and habitat protection as different tools. These are source examples, not a current legal list; turtle status, site totals, membership numbers and penalties are not presented as current. Evidence-based risk assessment and laws have distinct roles and scope. Leave the question about establishing threatened-species numbers for students to identify data needs.`),
 closure:P(`保育結合物種、棲地、研究與合作；有措施還要有證據。`,`Conservation combines species, habitat, research and cooperation; measures need evidence.`),
 quiz:[
  MC(P(`綠蠵龜不被捕捉，但牠產卵的沙灘消失了。關於保育，哪一句最合理？`,`Green turtles are no longer caught, but their nesting beach has disappeared. Which statement about conservation is most reasonable?`),P('只要不捕捉，保育就完成了','Once capture stops, conservation is complete'),P('牠用的沙灘與外海也要保護','The beach and open sea need protecting too'),P('保護沙灘就好，外海不用管','Protect the beach only; ignore the sea'),P('把海龜關起來養就算保育','Keeping turtles captive counts as conservation'),1,P(`海龜在不同階段用不同的家；只保護動物、不保護牠要用的家，保育沒有完成。`,`Turtles use different homes at different stages; protecting only the animal and not the homes it uses is not complete conservation.`),P(`看「一隻海龜用幾個家」第五步。`,`See "How many homes does one turtle use?", step five.`)),
  MC(P(`「瀕危評估」和「法律與管理」，哪一句正確？`,`Which statement about "risk assessment" and "law and management" is correct?`),P('評估看滅絕風險，法律管做法','Assessment judges risk; law sets the rules'),P('兩者其實是完全同一件事','They are two names for the same thing'),P('有了法律就代表評估已經完成','Having a law means assessment is already done'),P('評估是用來決定罰多少錢','Assessment decides the size of fines'),0,P(`評估說的是風險，法律說的是規範，範圍與用途不同。`,`Assessment concerns risk and law concerns rules; their scope and purpose differ.`),P(`看「評估和法律不一樣」第三步。`,`See "Assessment is not law", step three.`))]},
{id:'habitat-connections',title:P(`修一條路，誰走得過？`,`Who can use a connection?`),sub:P(`魚梯、廊道與監測`,`Fishways, corridors and monitoring`),
 hook:P(`魚梯看起來像樓梯，魚就一定知道入口、也一定游得上去嗎？`,`If a fishway looks like stairs, must fish find its entrance and swim up?`),
 body:P(`棲地連通讓生物有機會到達不同生活場所。河道障礙與道路切割造成的限制不同，魚梯和陸地廊道須各自符合目標物種的需求。入口、落差、流況或植被等設計與相連棲地品質，會影響實際使用；設施完成不等於所有生物都受益。`,`Connectivity can help organisms reach different living sites. River barriers and roads impose different constraints; fishways and land corridors must fit their target organisms. Entrances, height differences, flows or vegetation, together with connected habitat quality, affect use. Completion does not guarantee benefits for every species.`),
 reading:P(`補充與探究：除了到上游產卵的魚，其他魚也需要魚梯嗎？哪些建設干擾動物移動？保留問題，先提出需要的生活史與移動資料。動畫裡的魚梯與廊道只作「連通」的類比，不表示流速、坡度或工程尺寸。實際成效可討論使用、通過、存活與繁殖等不同證據，不能只拍到一隻就宣稱族群恢復。`,`The source asks whether fish other than upstream spawners need fishways, and which structures interrupt animal movement. Keep these questions open and identify life-history and movement data needed. The fishway and corridor in the animations are only analogies for connectivity, not flow, slope or engineering dimensions. Use, successful passage, survival and breeding provide different evidence; one observed animal does not establish population recovery.`),
 closure:P(`連通要符合物種需求、連到合適棲地，並追蹤實際結果。`,`Connections must suit organisms, reach suitable habitat and be monitored for actual outcomes.`),
 quiz:[
  MC(P(`河上蓋好了魚梯。哪一句最合理？`,`A fishway has been built on a river. Which statement is most reasonable?`),P('入口位置和水流對魚沒有影響','Entrance position and flow do not affect fish'),P('魚一定會找到入口並游上去','Fish will certainly find the entrance and swim up'),P('蓋好魚梯就等於族群恢復','A built fishway means the population has recovered'),P('入口、通過、繁殖要分別驗證','Using it and surviving need separate evidence'),3,P(`入口、落差與水流會影響使用；使用、通過、存活、繁殖是不同的證據。`,`Entrance, drops and flow affect use; use, passage, survival and breeding are different evidence.`),P(`看「魚梯怎麼走」第三到五步。`,`See "Getting through a fishway", steps three to five.`)),
  MC(P(`自動相機拍到一隻石虎走過通道。可以說什麼？`,`An automatic camera photographs one leopard cat passing through a crossing. What can we say?`),P('只是一筆紀錄，需更多證據','Just one record; more evidence needed'),P('這個族群已經完全恢復了','This population has now fully recovered'),P('通道已經證明一定有效','The crossing has certainly been proven'),P('這隻一定是新出生的小石虎','This one must have been newly born'),0,P(`一筆紀錄不能代表族群；還要重複記錄，並看存活、繁殖與數量。`,`One record cannot represent a population; repeat the records and look at survival, breeding and numbers.`),P(`看「看到一隻，夠了嗎」第一與第四步。`,`See "Is one sighting enough?", steps one and four.`))]},
{id:'everyday-actions',title:P(`小選擇，怎麼追蹤？`,`How can we track everyday choices?`),sub:P(`生活行動與公民參與`,`Everyday action and citizen participation`),
 hook:P(`今天少用一個杯子，我們要怎麼知道行動真的持續了？`,`If I avoid one disposable cup today, how can we tell the action truly continues?`),
 body:P(`日常可減少一次用品、在合適條件使用大眾運輸或自行車、不棄養不放生，也可參與有規範的公民觀察。選一項可持續的行動，先記錄原本的情況，再以相同方法追蹤；環保口號或照片不是成效數據。`,`Everyday actions include reducing disposables, suitable public or bicycle transport, responsible pet care and structured citizen observations. Choose a feasible action, record a baseline and follow it with the same method; slogans or images are not effectiveness data.`),
 reading:P(`循環杯需要歸還與清洗，交通選擇也受距離、路線和安全條件限制；整體環境影響要看材料、使用次數、運輸與處理，不能保證任何單一商品都最好。循環杯能否成功及原因、一日垃圾紀錄，留給學生實際觀察。政府、科學家與農民的角色討論也保留不同立場；不預填結論。路死動物記錄以老師安排的安全資料為主，不進車道或搬動屍體。`,`Reusable cups require return and washing; transport depends on distance, routes and safety. Overall impacts depend on materials, reuse, transport and disposal, not a guarantee that one product is always best. Leave the cup-success inquiry and daily-waste record for observations. Retain the government/scientist/farmer discussion without a preset conclusion. Use teacher-arranged safe roadkill records rather than entering traffic or handling carcasses.`),
 closure:P(`挑可持續的行動，用一致紀錄追蹤，再依證據調整。`,`Choose feasible actions, track them consistently and adapt using evidence.`),
 quiz:[
  MC(P(`想知道「少用一次性杯」的行動有沒有持續，應該先做什麼？`,`To find out whether the action of avoiding disposable cups continues, what should be done first?`),P('先記下原本情況再追蹤','Record the starting state, then track it'),P('先貼一張宣傳口號海報','Put up a slogan poster as the first step'),P('直接說每天都省下很多','Simply say that a lot is saved each day'),P('只拍一張漂亮照片就夠','Take one single photo and call it enough'),0,P(`先有基線才能比較；口號和照片不是成效數據。`,`A baseline is needed for comparison; slogans and photos are not effectiveness data.`),P(`看「先記原本，再追蹤」第一與第四步。`,`See "Record the baseline, then track", steps one and four.`)),
  MC(P(`循環杯一定比一次性杯環保嗎？`,`Is a reusable cup always better for the environment than a disposable cup?`),P('要看使用次數、清洗等條件','It depends on uses, washing and return'),P('一定，因為可以重複使用','Always, because it can be used again'),P('一定不會，因為還要清洗','Never, because it needs to be washed'),P('和使用次數與清洗完全無關','It has nothing to do with how often used'),0,P(`要用很多次、要歸還清洗才划得來；不能保證任何單一商品都最好。`,`It pays off only with many uses, return and washing; no single product is guaranteed best.`),P(`看「哪一個比較好」第二與第四步。`,`See "Which is better?", steps two and four.`))]},
{id:'traditional-knowledge',title:P(`生活智慧怎麼讀？`,`How do we read living knowledge?`),sub:P(`文化脈絡與永續思考`,`Cultural context and sustainability`),
 hook:P(`一張祭典或器皿照片，能告訴我們全部傳統規矩嗎？`,`Can one photo of a ceremony or vessel tell us every traditional practice?`),
 body:P(`課本以達悟族飛魚季與阿美族植物器皿，介紹在地知識、季節、資源與生活的關係。傳統知識有特定族群與地方脈絡，不把所有原住民族說成同一種做法。比較時尊重名稱與知識來源，把照片可見、閱讀提供與需要詢問族人的資訊分開。`,`The textbook uses Tao flying-fish traditions and Amis plant vessels to explore links among local knowledge, seasons, resources and life. Practices belong to particular communities and places; Indigenous peoples do not all share one method. Respect names and knowledge sources, distinguishing visible evidence, textual information and questions for community members.`),
 reading:P(`書中季節性捕魚規範可用於討論利用與資源補充，但不當成所有部落目前的時間表，也不作捕撈許可。天然素材不是無條件無害；採集、製作、重複使用與分解條件都要查證，不沿用書中商品「28 天」或塑膠年數作通則。開發環保餐具應考慮哪些面向？保留問題與理由欄，不預填選項答案。「課本照片」檢視只提供原照與出處脈絡。`,`Seasonal fishing practices support discussion of use and replenishment, not present schedules for all villages or fishing permission. Natural materials are not automatically harmless; collection, manufacture, reuse and decomposition conditions need evidence. Product "28 days" and plastic lifetimes from the source are not universal rules. Leave the utensil-design question and reasoning space unanswered. The Textbook photos view gives only the original images and their source context.`),
 closure:P(`尊重不同文化脈絡；永續判斷結合知識、條件與實際證據。`,`Respect distinct cultural contexts; judge sustainability using knowledge, conditions and evidence.`),
 quiz:[
  MC(P(`書中的季節性捕魚規範，可以怎麼理解？`,`How should the textbook's seasonal fishing practice be understood?`),P('是特定族群與地方的做法','A rule of one people in one local place'),P('所有原住民族現在都這樣做','All Indigenous peoples do this today'),P('只要照做，隨時都能捕魚','Following it, anyone may fish any time'),P('和資源補充完全沒有關係','It has nothing to do with replenishment'),0,P(`不同族群、不同地方有不同做法；規範不等於許可。`,`Different peoples and places have different practices; a rule is not a permit.`),P(`看「季節裡的規範」第四步。`,`See "Rules tied to a season", step four.`)),
  MC(P(`一張祭典照片，下面哪一項屬於「照片可見」？`,`For a ceremony photo, which item belongs under "visible in the photo"?`),P('畫面中有人、穿什麼衣服','Who is shown, what they wear, and where'),P('這個祭典代表的所有規矩','All the rules that this ceremony stands for'),P('這個族群所有的捕魚方式','Every fishing method of this people'),P('製作這件器物的完整脈絡','The full context of making the object'),0,P(`「可見」只寫看得見的；意義與規範要靠閱讀或詢問族人。`,`"Visible" holds only what can be seen; meanings and rules come from reading or asking the community.`),P(`看「一張照片能說什麼」第一步。`,`See "What can a photo tell us?", step one.`))]},
{id:'synthesis',title:P(`把三課的工具用在同一條溪`,`Using the three lessons' tools on one stream`),sub:P(`整合：比、追、做、驗`,`Putting it together: compare, trace, act, verify`),
 hook:P(`到這裡你已經有三組工具：比較、追問、驗證。同一條溪，你怎麼用？`,`By now you hold three sets of tools: compare, trace, verify. How would you use them on one stream?`),
 body:P(`第一課教怎麼看、怎麼比：有哪些居民、哪些住處。第二課教怎麼追壓力：它改變了哪個條件、證據在哪。第三課教怎麼驗措施：它補了哪一塊、有人用嗎、用同樣的方法追蹤了嗎。同一條溪可以全部用上。`,`Lesson 1 shows how to look and compare: who lives here and in which habitats. Lesson 2 shows how to trace pressures: which condition changes and where the evidence is. Lesson 3 shows how to verify measures: which gap is filled, whether it is used, and whether it was tracked with the same method. One stream can use all of them.`),
 reading:P(`這一頁是練習用的情境，不給任何真實結果。魚梯與減少排放只是兩個示例措施，不是這條溪的必要條件，也不保證有效；實際判斷需要調查資料。照片是課本的溪流原照，不能代表這條溪的所有居民或水質。`,`This page is a practice scenario with no real results. A fishway and reduced discharge are only two example measures, neither required for this stream nor guaranteed to work; real judgement needs survey data. The photo is the textbook stream original and cannot show every resident or the water quality.`),
 closure:P(`措施不等於成效；同樣的方法、重複記錄，才看得出有沒有用。`,`A measure is not an effect; the same method with repeated records shows whether it works.`),
 quiz:[
  MC(P(`在同一條溪做了魚梯與減少排放之後，下一步最合理的是什麼？`,`After a fishway and reduced discharge on one stream, what is the most reasonable next step?`),P('用同樣方法重複追蹤','Track it again using the same method'),P('馬上宣布已經成功了','Declare success right now, then stop'),P('只拍幾張漂亮的照片','Take a few pretty photos and stop there'),P('換個地方就不用追蹤了','Move elsewhere so no tracking is needed'),0,P(`措施不等於成效，要用同樣的方法重複追蹤。`,`A measure is not an effect; track repeatedly with the same method.`),P(`看「同一條溪」第四步。`,`See "One stream", step four.`)),
  MC(P(`「比、追、做、驗」，哪一組配對正確？`,`Which pairing of "compare, trace, act, verify" is correct?`),P('比：看居民；追：看壓力；驗：看成效','Compare: who lives here; trace: pressure; verify: effect'),P('比：決定罰款；追：蓋魚梯；驗：拍海報','Compare: set fines; trace: build fishway; verify: posters'),P('比：宣布成功；追：換地方；驗：不追蹤','Compare: declare win; trace: move away; verify: skip it'),P('比、追、做、驗其實全是同一件事','All four steps are really just one and the same thing'),0,P(`比看多樣性，追看壓力與條件，驗看措施是否有效。`,`Compare looks at diversity, trace at pressures and conditions, verify at whether a measure works.`),P(`看「同一條溪」第一到四步。`,`See "One stream", steps one to four.`))]}
];
const defs=[
 [['turtle','toolbox','assess'],[turtle,leopardcat]],
 [['fishway','corridor','monitor'],[fishladder,leopardcat]],
 [['track','tradeoff','citizen'],[cups,biking]],
 [['season','clues','materials'],[ceremony,vessels,woven]],
 [['casefile'],[stream,fishladder]]];
tabs.forEach((t,i)=>Object.assign(t,make(defs[i][0],defs[i][1])));
// the bridge sentence is only on the first tab; the other tabs keep their old hooks
B.register({id:'environmental_conservation',title:P(`保育，怎麼知道有沒有效？`,`How do we know conservation works?`),subtitle:P(`物種、棲地與合作，魚梯、廊道與監測，生活行動與公民參與，文化脈絡與永續思考，整合`,`Species, habitat and cooperation, fishways, corridors and monitoring, everyday action and citizen participation, cultural context and sustainability, putting it together`),cover:'assets/covers/biology_environmental_conservation_1024_v1.jpg',
 assetDir:'assets/biology/environment_ai_1024/',family:P(`生命與環境`,`Life and environment`),bookName:P(`人類與環境`,`Humans and the environment`),tabs});
})();
