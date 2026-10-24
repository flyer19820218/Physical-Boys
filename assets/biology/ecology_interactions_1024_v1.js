/* Ecology lesson 3 · "Does living together always help both sides?" V5 remake, 2026-10-24.
 * Four tabs, ten views (plan: assets/biology/ecology_l3_plan_1023.md). Everything is told with ONE idea: the + / 0 / - effect on each side.
 * It does NOT repeat lesson 2 (food chains and webs, arrow direction, removing a species, energy transfer, carbon and nitrogen cycles, root nodules).
 *   predation:   0 chase (a mantis and a grasshopper: what each side gains or loses), 1 lag (prey and predator numbers, schematic)
 *   competition: 0 compete (one limited resource: within and between species), 1 resource (s.res 0 scarce / 1 plentiful)
 *   symbiosis:   0 mutual (clownfish and anemone), 1 commens (bird's-nest fern, remora), 2 parasite (dodder, wasp cocoons), 3 relations (five relationships side by side)
 *   biocontrol:  0 biocontrol (pest, enemy, monitoring), 1 risk (nontarget effects, introduced species, assess first)
 * Pictures: ecology_ai_1023/ (teacher's Gemini AI illustrations, not photographs). Signs and curves are drawn by program.
 * Each view is drawn by its own module ecology_draw_<name>_1024_v1.js, registered as window.EcologyDraw[name] (canvas 960x600).
 * Per-view state the drawing modules read: resource s.res (0 scarce, 1 plentiful); every view has s.phase (-1 play all, >=0 hold) and s.start.
 * Shared helpers: ecology_kit_1023_v1.js. Replaces the ecology_interactions entry of ecology_lessons_1010_v1.js (left there, unused).
 */
(()=>{'use strict';
const K=window.EcologyKit,B=K.B,P=K.P,C=K.C,choice=K.choice,steps=K.steps;

// ── picture and canvas labels used by the drawing modules (zh, en) ─────────
const LAB={
 aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`),schematic:P(`示意`,`Schematic`),sizeNoReal:P(`大小不代表真實大小`,`Sizes are not real sizes`),
 // effects on each side
 gain:P(`得益`,`Gains`),loss:P(`受害`,`Harmed`),noEffect:P(`看不出明顯影響`,`No evident effect`),plus:P(`＋`,`+`),minus:P(`−`,`−`),zero:P(`0`,`0`),
 signLegend:P(`＋ 得益　− 受害　0 看不出明顯影響`,`+ gains · − harmed · 0 no evident effect`),signNote:P(`正負號描述利害，不是死亡百分比`,`Signs describe effects, not death percentages`),
 // relationships
 predation:P(`掠食`,`Predation`),competition:P(`競爭`,`Competition`),mutualism:P(`互利共生`,`Mutualism`),commensalism:P(`片利共生`,`Commensalism`),parasitism:P(`寄生`,`Parasitism`),symbiosis:P(`共生：長期住在一起`,`Symbiosis: living together over time`),
 predator:P(`掠食者`,`Predator`),prey:P(`獵物`,`Prey`),host:P(`寄主`,`Host`),parasite:P(`寄生者`,`Parasite`),pest:P(`害蟲`,`Pest`),enemy:P(`天敵`,`Natural enemy`),
 // species
 mantis:P(`螳螂`,`Mantis`),grasshopper:P(`蚱蜢`,`Grasshopper`),vole:P(`田鼷鼠`,`Field mouse`),owl:P(`領角鴞`,`Collared scops owl`),rice:P(`水稻`,`Rice`),
 rhinoBeetle:P(`獨角仙`,`Rhinoceros beetle`),stagBeetle:P(`鍬形蟲`,`Stag beetle`),sap:P(`樹液`,`Tree sap`),
 clownfish:P(`小丑魚`,`Clownfish`),anemone:P(`海葵`,`Sea anemone`),nestFern:P(`鳥巢蕨`,`Bird's-nest fern`),tree:P(`樹`,`Tree`),remora:P(`鮣魚`,`Remora`),shark:P(`鯊魚`,`Shark`),
 dodder:P(`菟絲子`,`Dodder`),wasp:P(`寄生蜂`,`Parasitic wasp`),cocoons:P(`蜂繭`,`Wasp cocoons`),caterpillar:P(`毛蟲`,`Caterpillar`),cabbage:P(`菜葉`,`Cabbage leaf`),
 appleSnail:P(`福壽螺`,`Golden apple snail`),fieldSnail:P(`本土田螺`,`Native field snail`),
 // lag, competition, control
 time:P(`時間`,`Time`),number:P(`數量`,`Number`),lag:P(`時間差`,`Time lag`),moreFood:P(`食物變多`,`More food`),lessFood:P(`食物變少`,`Less food`),
 sharedResource:P(`共用的資源`,`Shared resource`),limited:P(`有限`,`Limited`),sameSpecies:P(`同種`,`Same species`),diffSpecies:P(`不同種`,`Different species`),
 light:P(`光`,`Light`),water:P(`水`,`Water`),space:P(`空間`,`Space`),scarce:P(`資源少`,`Scarce`),plentiful:P(`資源多`,`Plentiful`),pressure:P(`競爭壓力`,`Competition pressure`),
 damage:P(`被啃食的痕跡`,`Feeding damage`),monitor:P(`監測`,`Monitoring`),before:P(`措施前`,`Before`),after:P(`措施後`,`After`),sameMethod:P(`用同樣的方法調查`,`Survey the same way`),
 nontarget:P(`非目標生物`,`Nontarget organisms`),introduced:P(`外來種`,`Introduced species`),assess:P(`先評估`,`Assess first`)
};
K.LAB=LAB;window.EcologyLabels=LAB;

// ── predation / chase ──────────────────────────────────────────────────────
const CH_SHORT=[P(`誰是誰`,`Who is who`),P(`各自得失`,`Gains and losses`),P(`符號的意思`,`What signs mean`)];
const CH_NAMES=[P(`螳螂抓蚱蜢：掠食者與獵物`,`A mantis catches a grasshopper: predator and prey`),P(`一個得益，一個受害`,`One side gains, the other is harmed`),P(`＋／−只描述利害`,`+/− only describe effects`)];
const CH_TEXT=[
 P(`螳螂抓住蚱蜢來吃。吃別的動物的是掠食者，被吃的是獵物。這是兩種生物之間最直接的一種關係。（AI 插圖，非實拍。）`,`A mantis grabs a grasshopper to eat it. The animal that eats another animal is the predator and the one eaten is the prey. This is one of the most direct relationships between two kinds of organisms. (AI illustration, not a photo.)`),
 P(`掠食者得到養分，記＋；獵物被吃，受到傷害，記 −。用「雙方各得到什麼、失去什麼」來描述關係，是這一課所有關係共用的想法。`,`The predator gains nutrients, marked +; the prey is eaten and harmed, marked −. Describing a relationship by what each side gains or loses is the idea shared by every relationship in this lesson.`),
 P(`正負號是描述利害，不是死亡百分比。每一次追逐也不一定成功，螳螂也可能撲空。要說掠食對整個族群的影響，還要看牠們的數量變化，下一個觀察就來看這件事。`,`The signs describe effects, not death percentages, and a chase does not always succeed; a mantis can miss. To say what predation does to a whole population we must look at how the numbers change, which is the next view.`)];

// ── predation / lag ────────────────────────────────────────────────────────
const LG_SHORT=[P(`獵物變多`,`Prey rise`),P(`掠食者跟上`,`Predators follow`),P(`獵物下降`,`Prey fall`),P(`掠食者隨後下降`,`Predators fall later`)];
const LG_NAMES=[P(`田鼷鼠變多：食物很夠`,`Field mice increase: plenty of food`),P(`領角鴞增加，但慢一步`,`Owls increase, but a step behind`),P(`被吃得多，田鼷鼠下降`,`More are eaten, so mice fall`),P(`領角鴞的食物少了，隨後下降`,`Owls have less food and fall later`)];
const LG_TEXT=[
 P(`假設一塊田裡，田鼷鼠因為食物充足而變多。曲線是示意，不是量測的資料，只用來看「先後」。（AI 插圖，非實拍。）`,`Suppose field mice increase in a field because food is plentiful. The curves are schematic, not measured data, and are only for seeing "which comes first". (AI illustrations, not photos.)`),
 P(`田鼷鼠多了，領角鴞的食物變多，數量也可能增加，但要等牠們吃得夠、繁殖、長大，所以會慢一步。這個慢一步，叫時間差。`,`With more mice, owls have more food and may increase too, but they need time to eat, breed and grow, so they lag a step behind. This delay is the time lag.`),
 P(`領角鴞變多，吃掉的田鼷鼠也變多，田鼷鼠的數量可能下降。獵物的數量，受掠食者影響。`,`With more owls, more mice are eaten and the mouse numbers may fall. The number of prey is affected by the predators.`),
 P(`田鼷鼠少了，領角鴞的食物不夠，也可能跟著下降。不過現實中還有別的食物、疾病、遷移與環境，不是每一組掠食關係都像圖上這樣規律，也不是固定的週期。`,`With fewer mice, owls have less food and may fall too. In reality other foods, disease, migration and conditions matter, so not every predator–prey pair follows a pattern like this, and there is no fixed cycle.`)];

// ── competition / compete ──────────────────────────────────────────────────
const CP_SHORT=[P(`搶同一個資源`,`One shared resource`),P(`同種競爭`,`Within a species`),P(`不同種競爭`,`Between species`)];
const CP_NAMES=[P(`共用而且不夠分的資源`,`A shared resource that is not enough`),P(`同一種生物之間也會競爭`,`Organisms of one species compete too`),P(`不同種生物也會競爭`,`Different species compete too`)];
const CP_TEXT=[
 P(`樹幹流出的樹液就那麼一點，好幾隻昆蟲都想吃。兩個條件要同時成立才算競爭：大家都需要同一個資源，而這個資源又不夠分。（AI 插圖，非實拍。）`,`Only a little sap flows from the trunk, yet several insects want it. Competition needs both conditions: they all need the same resource, and there is not enough of it. (AI illustration, not a photo.)`),
 P(`兩株水稻種得太近，要搶光、水和土裡的養分，也要搶空間。這是同一種生物之間的競爭，叫種內競爭。動物也一樣，例如爭奪食物或配偶。`,`Two rice plants growing too close fight for light, water, nutrients in the soil and space. This is competition within one species. Animals do the same, for example over food or mates.`),
 P(`獨角仙和鍬形蟲是不同種，卻都想吃同一處的樹液，這是種間競爭。雙方都是 −，意思是和沒有對手比起來，能利用的資源變少，不是一定會死。`,`A rhinoceros beetle and a stag beetle are different species but want the sap at the same spot, which is competition between species. Both sides are −, meaning each can use less than if the other were absent, not that either must die.`)];

// ── competition / resource ─────────────────────────────────────────────────
const RS_SHORT=[P(`資源和對手`,`Resource and rivals`),P(`對手各分到的`,`What each gets`),P(`還要看什麼`,`What else to check`)];
const RS_NAMES=[P(`同一處資源，兩個對手`,`One resource, two rivals`),P(`資源多少，改變競爭壓力`,`Resource amount changes the pressure`),P(`模型不是量測`,`The model is not a measurement`)];
const rsText=s=>{const m=(s.res|0)===1;return[
 m?P(`這一處樹液很多，兩隻昆蟲各自吃都吃不完。他們用的是同一種資源，但現在夠分。`,`This spot has plenty of sap, more than the two insects can eat. They use the same resource, but now there is enough.`)
  :P(`這一處樹液很少，兩隻昆蟲都想要。他們用的是同一種資源，而且不夠分。`,`This spot has little sap and both insects want it. They use the same resource, and there is not enough.`),
 m?P(`資源多的時候，各自分到的比較充足，競爭壓力小，雙方的 − 比較輕，甚至可以說看不出競爭。`,`When resources are plentiful each gets more, the competition pressure is small and the − on each side is lighter, and there may be no evident competition at all.`)
  :P(`資源少的時候，各自分到的比較少，競爭壓力大，雙方都 −。`,`When resources are scarce each gets less, the pressure is high and both sides are −.`),
 P(`這裡只示意「資源少，壓力大；資源多，壓力小」，沒有量競爭有多強。要判斷真實的競爭，還要指出共用的資源是什麼、真的不足，也要在現場觀察。`,`This only shows "scarce means more pressure, plentiful means less"; it does not measure how strong competition is. To judge real competition you must name the shared resource, show it is really short, and observe on site.`)];};
const RSC=choice(P(`資源`,`Resource`),'res',[[0,P(`少`,`Scarce`)],[1,P(`多`,`Plentiful`)]]);

// ── symbiosis / mutual ─────────────────────────────────────────────────────
const MU_SHORT=[P(`住在一起`,`Living together`),P(`各自得到`,`What each gets`),P(`＋／＋`,`+ / +`)];
const MU_NAMES=[P(`小丑魚住進海葵的觸手裡`,`A clownfish lives among anemone tentacles`),P(`雙方都有好處`,`Both sides benefit`),P(`互利共生：＋／＋`,`Mutualism: + / +`)];
const MU_TEXT=[
 P(`小丑魚長時間躲在海葵的觸手之間。這種兩種生物長期住在一起的關係，叫共生。共生有好幾種，要再看各自得失才能分。（AI 插圖，非實拍。）`,`A clownfish spends long periods among an anemone's tentacles. Two kinds of organisms living together over time is called symbiosis. There are several kinds, which we tell apart by what each side gains or loses. (AI illustration, not a photo.)`),
 P(`小丑魚得到保護和住處，敵人不容易靠近；海葵也可能因小丑魚趕走一些吃牠的魚而受益。雙方都得到好處。`,`The clownfish gains protection and a home, since enemies find it hard to approach; the anemone may also benefit because the clownfish drives off some fish that feed on it. Both sides gain.`),
 P(`雙方都得益，叫互利共生，記＋／＋。清潔魚得到食物，大魚身上的寄生蟲和髒物被清掉，也是互利共生。共生不等於互利：片利共生和寄生也是共生，要看雙方各自得失才分得出來。`,`When both sides gain it is mutualism, marked + / +. A cleaner fish gets food while the large fish has parasites and debris removed, which is mutualism too. Symbiosis does not always mean mutual benefit: commensalism and parasitism are symbiosis too, and only what each side gains or loses tells them apart.`)];

// ── symbiosis / commens ────────────────────────────────────────────────────
const CM_SHORT=[P(`長在樹上`,`Growing on a tree`),P(`貼在鯊魚身上`,`On a shark`),P(`0 的意思`,`What 0 means`)];
const CM_NAMES=[P(`鳥巢蕨附生在樹幹上`,`A bird's-nest fern grows on a trunk`),P(`鮣魚吸在鯊魚身側`,`A remora clings to a shark`),P(`片利共生：＋／0`,`Commensalism: + / 0`)];
const CM_TEXT=[
 P(`鳥巢蕨的根抓著樹皮，不在土裡，牠得到一個長在高處、受光的位置。在這個例子裡，看不出樹有明顯的得失。這叫附生，不等於寄生。（AI 插圖，非實拍。）`,`The fern's roots grip the bark, not soil, and it gains a lit spot high up. In this example the tree shows no evident gain or loss. This is growing on a host, not parasitism. (AI illustration, not a photo.)`),
 P(`鮣魚用頭頂的吸盤貼在鯊魚身上，跟著移動，也可能吃到鯊魚剩下的食物。鯊魚在這個情境裡看不出明顯的影響。這是課本常見的例子。（AI 插圖，非實拍。）`,`A remora clings to a shark with the sucker disc on its head, travels with it, and may eat scraps the shark leaves. The shark shows no evident effect in this situation. This is a common textbook example. (AI illustration, not a photo.)`),
 P(`一方得益、另一方看不出明顯影響，叫片利共生，記＋／0。0 只是「這個情境看不出明顯影響」，不是任何時間、任何條件都絕對沒有影響，要靠觀察證據。`,`When one side gains and the other shows no evident effect it is commensalism, marked + / 0. The 0 only means no evident effect in this situation, not no effect ever under any conditions; it needs observational evidence.`)];

// ── symbiosis / parasite ───────────────────────────────────────────────────
const PA_SHORT=[P(`纏住寄主`,`Twined on a host`),P(`蜂繭與毛蟲`,`Cocoons and caterpillar`),P(`寄生與掠食`,`Parasitism and predation`)];
const PA_NAMES=[P(`菟絲子纏在別的植物上`,`Dodder twines around another plant`),P(`寄生蜂：卵、幼蟲到繭`,`Parasitic wasp: eggs, larvae, cocoons`),P(`＋／− 一樣，過程不同`,`Same + / −, different process`)];
const PA_TEXT=[
 P(`菟絲子沒有葉子，細細的莖纏在別的植物上，從那棵植物取得養分。得益的是寄生者菟絲子，受害的是寄主，記＋／−。寄生通常是長時間依賴寄主，不一定立刻殺死牠。（AI 插圖，非實拍。）`,`Dodder has no leaves; its thin stems twine around another plant and take nutrients from it. The parasite, dodder, gains and the host is harmed, marked + / −. Parasites usually depend on a host over time and do not always kill it at once. (AI illustration, not a photo.)`),
 P(`某些寄生蜂把卵產在毛蟲身上或體內，幼蟲取食毛蟲，長大結成小小的繭。這種寄生的幼蟲，最後常會使寄主死亡，所以不能說寄生都不會殺死寄主。（AI 插圖，非實拍。）`,`Some parasitic wasps lay eggs on or in a caterpillar; the larvae feed on it and then spin small cocoons. The larvae of this kind of parasite usually end up killing the host, so we cannot say parasites never kill their hosts. (AI illustration, not a photo.)`),
 P(`寄生和掠食都是一方得益、一方受害，符號都是＋／−。差別在過程：掠食者吃掉獵物，寄生者通常長時間靠在寄主身上取得養分。所以要先看符號，再看生活方式。`,`Parasitism and predation both have one side gaining and one harmed, so both are + / −. They differ in process: a predator eats its prey, while a parasite usually lives on a host and takes nutrients over time. Look at the signs first, then at the way of life.`)];

// ── symbiosis / relations ──────────────────────────────────────────────────
const RL_SHORT=[P(`掠食`,`Predation`),P(`競爭`,`Competition`),P(`互利`,`Mutualism`),P(`片利`,`Commensalism`),P(`寄生`,`Parasitism`)];
const RL_NAMES=[P(`掠食：＋／−`,`Predation: + / −`),P(`競爭：−／−`,`Competition: − / −`),P(`互利共生：＋／＋`,`Mutualism: + / +`),P(`片利共生：＋／0`,`Commensalism: + / 0`),P(`寄生：＋／−`,`Parasitism: + / −`)];
const RL_TEXT=[
 P(`螳螂吃蚱蜢：掠食者得益、獵物受害。吃掉對方，是這一種關係的過程。`,`A mantis eats a grasshopper: the predator gains and the prey is harmed. Eating the other animal is the process of this relationship.`),
 P(`獨角仙與鍬形蟲搶樹液：雙方都因為資源被分走而受影響。競爭不一定是打架，兩棵樹搶光也是競爭。`,`A rhinoceros beetle and a stag beetle compete for sap, and both are affected because the resource is shared out. Competition does not need fighting; two trees competing for light also compete.`),
 P(`小丑魚與海葵：雙方都得益。共生不等於互利，所以互利共生只是共生的一種。`,`A clownfish and an anemone: both gain. Symbiosis is not always mutual, so mutualism is only one kind of symbiosis.`),
 P(`鳥巢蕨與樹、鮣魚與鯊魚：一方得益，另一方在這個情境看不出明顯影響。0 要靠證據，不是看起來親密就算。`,`A bird's-nest fern and a tree, a remora and a shark: one side gains and the other shows no evident effect here. A 0 needs evidence; looking close is not enough.`),
 P(`菟絲子與寄主、寄生蜂與毛蟲：寄生者得益、寄主受害。和掠食的符號相同，差在過程。`,`Dodder and its host, a wasp and a caterpillar: the parasite gains and the host is harmed. The signs match predation; the process differs.`)];

// ── biocontrol / biocontrol ────────────────────────────────────────────────
const BC_SHORT=[P(`有問題嗎`,`Is there a problem`),P(`選天敵`,`Choose an enemy`),P(`作用在目標`,`It acts on the target`),P(`前後都要看`,`Check before and after`)];
const BC_NAMES=[P(`先確認：害蟲真的造成損失`,`First confirm the pest really causes damage`),P(`再選一種天敵`,`Then choose a natural enemy`),P(`天敵要作用在目標害蟲上`,`The enemy must act on the target pest`),P(`措施前後，用同樣方法監測`,`Monitor the same way before and after`)];
const BC_TEXT=[
 P(`菜葉上有毛蟲啃食的痕跡。生物防治不是看到蟲就用，要先確認這種蟲真的造成損失。（AI 插圖，非實拍。）`,`There is feeding damage on a cabbage leaf. Biological control is not for every insect you see; first confirm this one really causes damage. (AI illustration, not a photo.)`),
 P(`生物防治是利用其他生物減少害蟲的影響，運用的就是這一課的關係，例如掠食、寄生。這裡選寄生蜂當天敵。`,`Biological control uses other organisms to reduce a pest's impact, using relationships from this lesson such as predation and parasitism. Here a parasitic wasp is chosen as the natural enemy.`),
 P(`寄生蜂的幼蟲取食毛蟲，毛蟲受害，害蟲的影響可能降低。但它只針對特定的蟲，作用方式要弄清楚，不保證消滅所有害蟲。`,`The wasp larvae feed on the caterpillar, which is harmed, and the pest's impact may drop. But it targets particular insects, the way it acts must be understood, and it does not guarantee that every pest is gone.`),
 P(`有天敵，只是措施存在；有沒有成效，要用證據。措施前、後，用同樣的方法調查害蟲、天敵和作物的損傷，才看得出有沒有改變。動畫不是結果。`,`Having an enemy only shows a measure exists; whether it works needs evidence. Survey pests, enemies and crop damage in the same way before and after the measure to see any change. The animation is not a result.`)];

// ── biocontrol / risk ──────────────────────────────────────────────────────
const RK_SHORT=[P(`旁邊的生物`,`Other organisms`),P(`外來種的例子`,`An introduced species`),P(`先評估再決定`,`Assess, then decide`)];
const RK_NAMES=[P(`非目標生物也可能受影響`,`Nontarget organisms may be affected`),P(`外來種在新地方可能長得太多`,`An introduced species may thrive too much`),P(`不隨意引進、野放`,`Do not introduce or release casually`)];
const RK_TEXT=[
 P(`天敵不一定只吃或只寄生目標害蟲，也可能影響其他生物。所以要先評估：它會影響誰？`,`A natural enemy may not affect only the target pest; it can affect other organisms too. So assess first: whom will it affect?`),
 P(`福壽螺是從南美洲引進的外來種，在稻田成為害物，本土田螺和牠的生活條件不同。這個例子不是生物防治，而是說明：外來生物引進新地方，可能沒有原來的天敵，數量增加太多，影響本地環境。（AI 插圖，非實拍。）`,`The golden apple snail is a species introduced from South America and became a pest in rice paddies, with conditions of life unlike the native field snail. This is not biological control; it shows that an organism brought to a new place may lack its original enemies, increase too much and affect the local environment. (AI illustrations, not photos.)`),
 P(`所以不能隨意引進或野放外來生物。要先評估目標、作用方式、對非目標生物的影響，措施後還要持續監測，必要時調整。生物防治不是萬靈丹，也不是完全沒有風險。`,`So never introduce or release nonnative organisms casually. First assess the target, the way it acts and its effects on nontarget organisms, keep monitoring after the measure and adjust when needed. Biological control is not a cure-all and not free of risk.`)];

// ── fallback drawing while a module is missing ─────────────────────────────
const stub=(name,n,short)=>(c,s,t)=>{const {k}=K.stageClock(s,t,n,6);s.shown=k;
 K.panel(c,40,40,880,520,'#16332b');
 K.text(c,P(`動畫製作中`,`Animation in progress`),480,270,40,C.yellow,'center');
 K.text(c,short[k],480,330,28,C.white,'center');
 K.text(c,P(`（${name}）`,`(${name})`),480,372,22,C.muted,'center');
 K.pulse(c,480,440,t,C.cyan,14);};
const dr=(name,n,short)=>(c,s,t)=>((window.EcologyDraw&&window.EcologyDraw[name])||stub(name,n,short))(c,s,t);

// ── tabs ───────────────────────────────────────────────────────────────────
const RESTART=new Set(['phase','res']);
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}else if(RESTART.has(k))s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const VIEW=(tabsArr)=>choice(P(`觀察`,`View`),'view',tabsArr.map((n,i)=>[i,n]));
const PRED_TABS=[P(`得與失`,`Gains and losses`),P(`數量的時間差`,`Number lag`)];
const COMP_TABS=[P(`共用資源`,`Shared resource`),P(`資源多少`,`Resource amount`)];
const SYM_TABS=[P(`互利`,`Mutualism`),P(`片利`,`Commensalism`),P(`寄生`,`Parasitism`),P(`五種關係`,`Five relationships`)];
const BIO_TABS=[P(`怎麼做`,`How it works`),P(`風險`,`Risks`)];
const INIT=()=>({running:true,view:0,phase:-1,start:0,res:0});

const tabs=[
{id:'predation',title:P(`追逐牽動誰？`,`Who is affected by a chase?`),sub:P(`掠食者與獵物`,`Predators and prey`),
 hook:P(`螳螂撲向蚱蜢，一個吃飽，一個被吃。那獵物變少以後，掠食者會立刻跟著變少嗎？`,`A mantis pounces on a grasshopper: one eats, one is eaten. If prey become fewer, do predators fall at once?`),
 body:P(`兩種生物之間的關係，可以用「雙方各得到什麼、失去什麼」來描述：得益記＋、受害記 −、看不出明顯影響記 0。先看掠食，再看掠食者和獵物的數量怎麼互相影響。`,`A relationship between two kinds of organisms can be described by what each side gains or loses: + for gaining, − for harmed, 0 for no evident effect. Start with predation, then see how predator and prey numbers affect each other.`),
 reading:P(`掠食者取得養分，獵物受害，記＋／−。兩者的數量可能互相影響：獵物多，掠食者的食物就多；掠食者多，獵物被吃得多。變化通常有時間差，還要看其他食物、疾病、遷移和環境，不能把每一組掠食關係都套成固定的週期。\n\n課本的猞猁與野兔曲線，是用來理解可能的先後變化，不是這個模型量出來的資料。要驗證數量變化，需要同一地區、同樣方法、長時間的雙方數量資料，只有一張捕食的照片，是不夠的。`,`Predators gain nutrients and prey are harmed, marked + / −. Their numbers may affect each other: more prey means more food for predators, and more predators mean more prey eaten. Changes usually lag and also depend on other food, disease, migration and conditions, so we cannot force every predator–prey pair into a fixed cycle.\n\nThe textbook lynx and hare curves help us understand a possible order of changes; they are not data measured by this model. To test number changes you need long-term counts of both from the same area using the same method, and a single photo of a catch is not enough.`),
 closure:P(`掠食：掠食者＋、獵物 −；數量會互相影響，但有時間差，也不是固定週期。`,`Predation: predator +, prey −; numbers affect each other with a lag and no fixed cycle.`),
 quiz:[
  {q:P(`螳螂吃蚱蜢，雙方的利害怎麼記？`,`A mantis eats a grasshopper. How are the effects on each side marked?`),options:[P(`螳螂 −，蚱蜢＋`,`Mantis −, grasshopper +`),P(`螳螂＋，蚱蜢 −`,`Mantis +, grasshopper −`),P(`兩邊都＋`,`Both +`),P(`兩邊都 0`,`Both 0`)],answer:1,why:P(`掠食者得到養分，獵物被吃受害。`,`The predator gains nutrients and the prey is eaten and harmed.`),hint:P(`看第二步。`,`Look at step two.`)},
  {q:P(`田鼷鼠變多以後，領角鴞的數量常常怎麼變？`,`After field mice increase, how do owl numbers often change?`),options:[P(`同一瞬間一樣多`,`The same at the same instant`),P(`可能跟著增加，但慢一步，有時間差`,`They may increase too, but a step behind, with a lag`),P(`一定馬上減少`,`They must fall at once`),P(`和田鼷鼠完全無關`,`Unrelated to mice`)],answer:1,why:P(`牠們要吃、繁殖、長大，所以慢一步；實際還要看其他因素。`,`They need to eat, breed and grow, so they lag; real cases also depend on other factors.`),hint:P(`切到「數量的時間差」看第二步。`,`Switch to "Number lag" and look at step two.`)},
  {q:P(`下面哪一句最合理？`,`Which statement is most reasonable?`),options:[P(`每一組掠食關係的數量都有固定的週期`,`Every predator–prey pair has a fixed cycle`),P(`示意曲線可以當真實量測資料`,`The schematic curves can be used as measured data`),P(`要驗證數量變化，需要同地區、同方法、長時間的雙方數量資料`,`Testing number changes needs long-term counts of both from the same area and method`),P(`只要看到一次捕食，就知道整個族群怎麼變`,`One sighting of a catch tells how the whole population changes`)],answer:2,why:P(`示意曲線不是資料，也不是每組都有固定週期。`,`The schematic curves are not data, and not every pair has a fixed cycle.`),hint:P(`看第四步的最後一句。`,`See the last sentence of step four.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(PRED_TABS),steps(s.view===1?LG_SHORT:CH_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:LG_NAMES[k],text:LG_TEXT[k]}:{title:CH_NAMES[k],text:CH_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('lag',4,LG_SHORT)(c,s,t):dr('chase',3,CH_SHORT)(c,s,t)},
{id:'competition',title:P(`資源不夠分`,`When resources are limited`),sub:P(`種內與種間競爭`,`Within- and between-species competition`),
 hook:P(`兩棵樹並排長，沒有打架，卻也可能互相競爭。競爭一定要打架嗎？`,`Two trees grow side by side without fighting, yet they may still compete. Does competition need fighting?`),
 body:P(`兩個以上的生物共同需要同一個資源，而資源不夠分，就是競爭。可以發生在同種之間，也可以發生在不同種之間。按步驟看共用的資源，再用「資源多少」比較壓力的大小。`,`Competition happens when two or more organisms need the same resource and there is not enough. It can be within one species or between species. Use the steps to see the shared resource, then use "Resource amount" to compare the pressure.`),
 reading:P(`植物可以競爭光、水、空間和礦物質，動物可以競爭食物或配偶。競爭記 −／−，是相對於沒有對手時，能利用的資源變少，不表示雙方一定會死。\n\n「住在同一個地方」不夠判定競爭，還要指出共用且不足的資源。兩種動物若吃不同的食物，就要有別的資料才能說牠們競爭。「資源多少」只示意壓力的大小，沒有量競爭強度；同種或不同種，也要另外交代身分。`,`Plants can compete for light, water, space and minerals; animals for food or mates. Competition is marked − / −, meaning each can use less than if there were no rival, not that both must die.\n\nLiving in the same place is not enough to call it competition; you must identify the shared and limited resource. If two animals eat different foods, more information is needed before saying they compete. The "Resource amount" view only suggests pressure and does not measure competition strength; whether it is within or between species must also be stated.`),
 closure:P(`先指出共用而且有限的資源，才判定競爭；競爭是−／−。`,`Identify a shared, limited resource before concluding competition; competition is − / −.`),
 quiz:[
  {q:P(`兩種動物住在同一片草地，就一定在競爭嗎？`,`Do two animals living on the same meadow necessarily compete?`),options:[P(`是，住在一起就是競爭`,`Yes, living together means competing`),P(`不一定，還要看牠們有沒有共用而且不夠的資源`,`Not necessarily; it depends on whether they share a limited resource`),P(`一定不會`,`Never`),P(`只有會打架才算`,`Only if they fight`)],answer:1,why:P(`要指出共用而且有限的資源，才能判定競爭。`,`You must identify a shared and limited resource to conclude competition.`),hint:P(`看第一步。`,`Look at step one.`)},
  {q:P(`兩株水稻種得太近，搶光和水，是哪一種競爭？`,`Two rice plants grown too close compete for light and water. What kind of competition is this?`),options:[P(`種間競爭`,`Between species`),P(`種內競爭`,`Within a species`),P(`寄生`,`Parasitism`),P(`互利共生`,`Mutualism`)],answer:1,why:P(`兩株都是水稻，是同一種生物之間的競爭。`,`Both are rice, so it is competition within one species.`),hint:P(`看第二步。`,`Look at step two.`)},
  {q:P(`競爭記 −／− 是什麼意思？`,`What does the − / − of competition mean?`),options:[P(`雙方一定都會死`,`Both will certainly die`),P(`相對於沒有對手，雙方能利用的資源都變少`,`Compared with no rival, both can use less of the resource`),P(`雙方都得益`,`Both gain`),P(`只有一方受害`,`Only one is harmed`)],answer:1,why:P(`負號是和沒有對手比，資源減少，不是一定死亡。`,`The minus sign compares with having no rival: less resource, not certain death.`),hint:P(`看第三步的最後一句。`,`See the last sentence of step three.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(COMP_TABS),steps(s.view===1?RS_SHORT:CP_SHORT),...(s.view===1?[RSC]:[])],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:RS_NAMES[k],text:rsText(s)[k]}:{title:CP_NAMES[k],text:CP_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('resource',3,RS_SHORT)(c,s,t):dr('compete',3,CP_SHORT)(c,s,t)},
{id:'symbiosis',title:P(`一起生活的代價`,`The effects of close association`),sub:P(`共生與寄生`,`Symbiosis and parasitism`),
 hook:P(`植物長在樹上，就一定是在偷樹的養分嗎？兩種生物住在一起，是誰佔了誰的便宜？`,`Does a plant growing on a tree always steal from it? When two organisms live together, who is taking advantage of whom?`),
 body:P(`長期住在一起，叫共生。共生可以依雙方各自得失分三種：互利共生＋／＋、片利共生＋／0、寄生＋／−。按觀察看每一種，最後把五種關係並排比一比。`,`Living together over time is symbiosis. By what each side gains or loses it comes in three kinds: mutualism + / +, commensalism + / 0 and parasitism + / −. Look at each kind, then compare all five relationships side by side.`),
 reading:P(`先問各自得到什麼、失去什麼，再選關係，不用「看起來很親密」當判準。鳥巢蕨附生在樹上，得到生長的位置，在課本的情境中樹沒有明顯的利害，不等於寄生。寄生通常是長時間依賴寄主取得養分，也不一定馬上使寄主死亡。\n\n0 只是「這個情境看不出明顯影響」，不是任何時間、任何條件都絕對沒有影響。寄生與掠食都可以是＋／−，要再看過程與生活方式。某些寄生蜂的幼蟲最後會使寄主死亡，所以也不能說寄生都不會殺死寄主。根瘤菌與豆科植物也是互利共生的例子，前面看過了。`,`Ask first what each side gains or loses, then choose the relationship, not "they look close". A bird's-nest fern gains a growing position on a tree; in the textbook situation the tree shows no evident gain or loss, which is not parasitism. A parasite usually depends on a host for nutrients over time and does not always kill it at once.\n\nA 0 only means no evident effect in this situation, not no effect ever under any conditions. Parasitism and predation can both be + / −, so look at the process and way of life. The larvae of some parasitic wasps eventually kill the host, so we cannot say parasites never kill. Root-nodule bacteria and legumes are also an example of mutualism, seen earlier.`),
 closure:P(`同住不等於互利，附生不等於寄生；利害要有證據。`,`Living together is not automatically mutual, nor attachment parasitism; effects need evidence.`),
 quiz:[
  {q:P(`小丑魚與海葵，雙方都得到好處，是哪一種關係？`,`A clownfish and an anemone both benefit. Which relationship is this?`),options:[P(`寄生`,`Parasitism`),P(`片利共生`,`Commensalism`),P(`互利共生`,`Mutualism`),P(`競爭`,`Competition`)],answer:2,why:P(`雙方都得益是互利共生，記＋／＋。`,`Both gaining is mutualism, marked + / +.`),hint:P(`看第三步。`,`Look at step three.`)},
  {q:P(`鳥巢蕨長在樹幹上，在課本情境中樹看不出明顯影響。這最合理的是？`,`A bird's-nest fern grows on a trunk and the tree shows no evident effect. What is most reasonable?`),options:[P(`寄生，因為長在樹上`,`Parasitism, because it grows on a tree`),P(`片利共生，記＋／0`,`Commensalism, marked + / 0`),P(`互利共生`,`Mutualism`),P(`競爭`,`Competition`)],answer:1,why:P(`蕨得到位置，樹看不出明顯影響；附生不等於寄生。`,`The fern gains a position and the tree shows no evident effect; growing on is not parasitism.`),hint:P(`切到「片利」看第一步。`,`Switch to "Commensalism" and look at step one.`)},
  {q:P(`寄生和掠食都是＋／−，要怎麼分？`,`Parasitism and predation are both + / −. How do we tell them apart?`),options:[P(`看符號就夠了`,`The signs are enough`),P(`看過程：掠食者吃掉獵物，寄生者通常長時間靠在寄主身上取得養分`,`By process: a predator eats its prey, a parasite usually lives on a host and takes nutrients over time`),P(`看誰比較大`,`By which is bigger`),P(`看誰先出現`,`By which appears first`)],answer:1,why:P(`符號相同，差在過程與生活方式。`,`The signs match; the difference is process and way of life.`),hint:P(`切到「寄生」看第三步。`,`Switch to "Parasitism" and look at step three.`)},
  {q:P(`「0」代表什麼？`,`What does "0" mean?`),options:[P(`任何情況下都絕對沒有影響`,`Absolutely no effect under any conditions`),P(`這個情境看不出明顯影響，仍需證據`,`No evident effect in this situation, still needing evidence`),P(`受害很嚴重`,`Seriously harmed`),P(`得益很多`,`Gains a lot`)],answer:1,why:P(`0 是這個情境看不出明顯影響，不是絕對。`,`0 means no evident effect in this situation, not absolute.`),hint:P(`看「片利」第三步。`,`See "Commensalism" step three.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(SYM_TABS),steps(s.view===3?RL_SHORT:s.view===2?PA_SHORT:s.view===1?CM_SHORT:MU_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===3?{title:RL_NAMES[k],text:RL_TEXT[k]}:s.view===2?{title:PA_NAMES[k],text:PA_TEXT[k]}:s.view===1?{title:CM_NAMES[k],text:CM_TEXT[k]}:{title:MU_NAMES[k],text:MU_TEXT[k]};},
 draw:(c,s,t)=>s.view===3?dr('relations',5,RL_SHORT)(c,s,t):s.view===2?dr('parasite',3,PA_SHORT)(c,s,t):s.view===1?dr('commens',3,CM_SHORT)(c,s,t):dr('mutual',3,MU_SHORT)(c,s,t)},
{id:'biocontrol',title:P(`讓天敵幫忙`,`Let natural enemies help`),sub:P(`生物防治與風險`,`Biological control and its risks`),
 hook:P(`讓寄生蜂對付毛蟲，就能保證菜園沒有害蟲、也沒有其他影響嗎？`,`If a parasitic wasp deals with caterpillars, are we guaranteed a pest-free garden with no other effects?`),
 body:P(`生物防治利用其他生物減少害蟲的影響，運用的是掠食、寄生這些關係。它不保證消滅所有害蟲，也不是完全沒有風險。按觀察看怎麼做，再看要注意什麼風險。`,`Biological control uses other organisms to reduce pest impact, relying on relationships such as predation and parasitism. It does not guarantee that all pests are gone and is not free of risk. See how it works, then what risks to watch for.`),
 reading:P(`做之前要問：害蟲是否真的造成問題？天敵是否作用在目標上？有沒有傷害其他生物？措施後，用相同的調查方式追蹤害蟲、天敵與作物損傷；「有天敵」是措施存在，「有成效」要由證據支持。\n\n課本還有鴨在稻田活動、瓢蟲捕食等例子。外來生物引進新地方，可能沒有原來的天敵，數量增加太多，影響本地環境，所以不能隨意引進或野放。動畫的亮點不計算防治成功率。`,`Before acting, ask: does the pest really cause trouble? Does the enemy act on the target? Does it harm other organisms? After the measure, track pests, enemies and crop damage with the same survey method; "has an enemy" shows a measure exists, while "works" needs evidence.\n\nThe textbook also gives examples such as ducks in rice fields and ladybirds feeding. An organism introduced to a new place may lack its original enemies, increase too much and affect the local environment, so never introduce or release it casually. The glowing marks in the animation do not calculate success.`),
 closure:P(`生物防治要先評估風險、再持續監測；有天敵不等於有成效，外來引進不是萬靈丹。`,`Biological control needs risk assessment then monitoring; having an enemy is not proof of success, and introductions are no cure-all.`),
 quiz:[
  {q:P(`做生物防治之前，最先要確認什麼？`,`What should be confirmed first before biological control?`),options:[P(`先買很多天敵`,`Buy many natural enemies`),P(`這種害蟲是否真的造成損失`,`Whether this pest really causes damage`),P(`天敵好不好看`,`Whether the enemy looks nice`),P(`有沒有別人在做`,`Whether others are doing it`)],answer:1,why:P(`先確認問題存在，再選方法。`,`Confirm the problem exists, then choose a method.`),hint:P(`看第一步。`,`Look at step one.`)},
  {q:P(`田裡放了天敵，要怎麼知道有沒有成效？`,`Natural enemies were released in a field. How do we know whether it works?`),options:[P(`看到天敵就算成功`,`Seeing the enemy means success`),P(`措施前、後用同樣的方法調查害蟲、天敵與作物損傷`,`Survey pests, enemies and crop damage in the same way before and after`),P(`看動畫`,`Watch the animation`),P(`不用調查`,`No survey needed`)],answer:1,why:P(`要用證據，同方法前後比較。`,`Use evidence: the same method before and after.`),hint:P(`看第四步。`,`Look at step four.`)},
  {q:P(`為什麼不能隨意引進或野放外來生物？`,`Why must we not introduce or release nonnative organisms casually?`),options:[P(`它們一定會死`,`They will certainly die`),P(`它們可能沒有天敵而過度增加，影響本地生物`,`They may lack enemies, increase too much and affect local organisms`),P(`沒人想看`,`Nobody wants to see them`),P(`它們不需要吃東西`,`They do not need food`)],answer:1,why:P(`新環境可能缺少原來的天敵，影響本地環境，要先評估。`,`A new place may lack their original enemies and harm the local environment, so assess first.`),hint:P(`切到「風險」看第二步。`,`Switch to "Risks" and look at step two.`)}],
 sources:[],init:INIT,
 controls:s=>[VIEW(BIO_TABS),steps(s.view===1?RK_SHORT:BC_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:RK_NAMES[k],text:RK_TEXT[k]}:{title:BC_NAMES[k],text:BC_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?dr('risk',3,RK_SHORT)(c,s,t):dr('biocontrol',4,BC_SHORT)(c,s,t)}
];
B.register({id:'ecology_interactions',title:P(`一起生活，一定互相幫忙嗎？`,`Does living together always help both sides?`),subtitle:P(`掠食、競爭、共生、寄生與生物防治`,`Predation, competition, symbiosis, parasitism and biological control`),cover:'assets/covers/biology_ecology_interactions_1023_v1.jpg',
 assetDir:'assets/biology/ecology_ai_1023/',family:P(`生命與環境`,`Life and environment`),bookName:P(`生態系`,`Ecosystem`),tabs});
})();
