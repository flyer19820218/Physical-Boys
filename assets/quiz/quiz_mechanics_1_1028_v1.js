/* Multiple-choice practice for mechanics_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('mechanics_1',{
 '#tab-force':[
  Q(P(`力作用在物體上，可以觀察到哪兩種效應？`,`What two effects can be observed when a force acts on an object?`),
   [P(`質量或體積大小`,`Mass or volume size`),P(`顏色或氣味變化`,`Color or smell changes`),P(`運動狀態或形狀`,`Motion state or shape`),P(`溫度或密度高低`,`Temperature or density`)],2,
   P(`力可以改變物體的運動狀態（如踢球），也可以改變物體的形狀（如捏黏土）。`,`A force can change the state of motion (kicking a ball) or the shape (squeezing clay).`),
   P(`踢足球時球會扁掉又飛出去。`,`A kicked ball squashes and then flies off.`)),
  Q(P(`下列哪一個屬於「超距力」（不接觸也有作用）？`,`Which of these is an action-at-a-distance force (works without contact)?`),
   [P(`用腳踢足球`,`A foot kicking a ball`),P(`用手捏黏土`,`A hand squeezing clay`),P(`磁鐵吸鐵釘`,`A magnet pulling a nail`),P(`用手拉彈簧`,`A hand pulling a spring`)],2,
   P(`磁力、地球引力不需接觸就能作用，是超距力；踢球、捏黏土、拉彈簧都要接觸。`,`Magnetism and gravity act without contact; kicking, squeezing and pulling need contact.`),
   P(`哪一個作用不需要碰到物體？`,`Which one acts without touching?`)),
  Q(P(`關於「力」，下列哪一個敘述正確？`,`Which statement about force is correct?`),
   [P(`力有質量但無體積`,`Force has mass but no volume`),P(`力是一種透明物質`,`Force is a clear substance`),P(`力是一種微小粒子`,`Force is a tiny particle`),P(`力沒有質量與體積`,`Force has no mass or volume`)],3,
   P(`力不是物質，沒有質量也沒有體積，是和能量有關的抽象概念。`,`Force is not matter: it has no mass or volume and is an abstract idea related to energy.`),
   P(`你能把力裝進瓶子裡稱重嗎？`,`Could you weigh a force in a bottle?`))],
 '#tab-mass':[
  Q(P(`質量 6 kg 的鐵塊，在月球上（引力是地球的 1/6）重量是多少？`,`A 6 kg iron block is taken to the Moon (gravity 1/6 of Earth). What is its weight there?`),
   [P(`6 kgw`,`6 kgw`),P(`36 kgw`,`36 kgw`),P(`1 kgw`,`1 kgw`),P(`0 kgw`,`0 kgw`)],2,
   P(`地球上重 6 kgw，月球引力只有 1/6，所以重量是 6 × 1/6 = 1 kgw。`,`It weighs 6 kgw on Earth, and with 1/6 gravity the Moon makes it 6 × 1/6 = 1 kgw.`),
   P(`重量跟著引力的強弱改變。`,`Weight follows the strength of gravity.`)),
  Q(P(`下列哪一種工具用來測量物體的質量？`,`Which tool is used to measure the mass of an object?`),
   [P(`彈簧秤`,`Spring scale`),P(`溫度計`,`Thermometer`),P(`量筒`,`Measuring cup`),P(`天平`,`Beam balance`)],3,
   P(`質量用天平測量；彈簧秤測的是重量。`,`Mass is measured with a balance; a spring scale measures weight.`),
   P(`質量不隨地點改變，要用比較兩邊的工具。`,`Mass does not change with place; use a tool that compares two sides.`)),
  Q(P(`同一物體從地球帶到月球，它的質量會怎樣？`,`If an object is taken from Earth to the Moon, what happens to its mass?`),
   [P(`質量變小`,`Mass drops to a sixth`),P(`質量變大`,`Mass grows sixfold`),P(`質量不變`,`Mass stays the same`),P(`質量變成零`,`Mass becomes zero`)],2,
   P(`質量代表物質的含量，不隨地點改變；會改變的是重量。`,`Mass is the amount of matter and does not change with location; weight is what changes.`),
   P(`你在月球上是變輕還是變瘦？`,`On the Moon do you get lighter or thinner?`))],
 '#tab-hooke':[
  Q(P(`虎克定律在彈性限度內說明了什麼？`,`Within the elastic limit, what does Hooke's law say?`),
   [P(`伸長量與外力成反比`,`Stretch falls as force rises`),P(`伸長量與外力無關`,`Stretch ignores the force`),P(`伸長量等於外力大小`,`Stretch equals the force`),P(`伸長量與外力成正比`,`Stretch rises with the force`)],3,
   P(`在彈性限度內，彈簧的伸長量與所施外力成正比（F/X = k）。`,`Within the elastic limit, a spring's extension is proportional to the applied force (F/X = k).`),
   P(`公式 F₁/X₁ = F₂/X₂ = k。`,`The formula is F₁/X₁ = F₂/X₂ = k.`)),
  Q(P(`掛 20 gw 的砝碼彈簧伸長 2 cm，掛 60 gw（未超過彈性限度）會伸長多少？`,`A 20 gw weight stretches a spring 2 cm. How far does 60 gw stretch it (within the elastic limit)?`),
   [P(`4 公分`,`4 cm`),P(`6 公分`,`6 cm`),P(`8 公分`,`8 cm`),P(`3 公分`,`3 cm`)],1,
   P(`外力變 3 倍，伸長量也變 3 倍：2 × 3 = 6 cm。`,`The force triples, so the stretch triples: 2 × 3 = 6 cm.`),
   P(`先算每 gw 伸長多少，或直接用比例。`,`Find the stretch per gw, or use the ratio.`)),
  Q(P(`圖表若以「彈簧總長度」為縱軸，畫出的直線會怎樣？`,`If the graph uses total spring length on the vertical axis, what does the line do?`),
   [P(`不會通過原點`,`Does not hit the origin`),P(`一定通過原點`,`Hits the origin exactly`),P(`一定平行橫軸`,`Runs flat along the axis`),P(`一定垂直橫軸`,`Stands straight upright`)],0,
   P(`總長度的起點是原長，所以直線不通過原點；改用伸長量才會通過原點。`,`Total length starts at the natural length, so the line misses the origin; with extension on the axis it does pass through it.`),
   P(`外力為 0 時，彈簧的長度是多少？`,`What is the spring length when the force is 0?`))],
 '#tab-spring':[
  Q(P(`兩條相同彈簧串聯後受力，每一條受到的力是多少？`,`Two identical springs are connected in series and pulled. How much force does each feel?`),
   [P(`每條受力等於總力`,`Each feels the full force`),P(`每條只受一半的力`,`Each feels half the force`),P(`每條受兩倍的總力`,`Each feels double the force`),P(`每條完全不受力`,`Each feels a tiny force`)],0,
   P(`串聯時整個系統受到相同的張力，每條彈簧都受到和總拉力一樣大的力，總伸長量相加。`,`In series the whole system carries the same tension, so each spring feels the full pull and the extensions add.`),
   P(`張力在一條直線上處處相同。`,`Tension is the same everywhere along a line.`)),
  Q(P(`兩條相同彈簧並聯，總伸長量和單條彈簧比較如何？`,`Two identical springs are connected in parallel. How does the stretch compare with a single spring?`),
   [P(`是單條的兩倍`,`Twice a single spring`),P(`只有單條的一半`,`Half of a lone spring`),P(`與單條完全相同`,`The same as one alone`),P(`是單條的四倍`,`Four times one spring`)],1,
   P(`並聯時拉力被兩條分擔，每條只承受一半，因此伸長量只有單條的一半。`,`In parallel the pull is shared, each takes half, so the stretch is half that of one spring.`),
   P(`並聯是力量分工。`,`Parallel springs share the load.`)),
  Q(P(`兩條各伸長 3 cm 的相同彈簧串聯，總伸長量是多少？`,`Two identical springs that each stretch 3 cm are joined in series. What is the total stretch?`),
   [P(`6 公分`,`6 cm`),P(`3 公分`,`3 cm`),P(`9 公分`,`9 cm`),P(`12 公分`,`12 cm`)],0,
   P(`串聯時各彈簧受力相同，伸長量相加：3 + 3 = 6 cm。`,`In series each spring feels the same force and the extensions add: 3 + 3 = 6 cm.`),
   P(`串聯的總伸長量要相加。`,`Series extensions add up.`))]
});
})();
