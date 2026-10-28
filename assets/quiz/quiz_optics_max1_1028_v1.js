/* Multiple-choice practice for optics_max1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('optics_max1',{
 '#tab0':[
  Q(P(`兩面平面鏡夾角 60°，物體在正中央時，總共成幾個像（依分析表）？`,`Two plane mirrors meet at 60° and the object is at the center. How many images form (per the table)?`),
   [P(`6 個像`,`6 images`),P(`5 個像`,`5 images`),P(`4 個像`,`4 images`),P(`7 個像`,`7 images`)],1,
   P(`60° 是整除角，正中央成像數為 5 個（含重合像）。`,`60° divides 360° evenly, giving 5 images at the center (including the coinciding one).`),
   P(`看分析表中 60° 那一列。`,`Look at the 60° row of the table.`)),
  Q(P(`夾角 31° 時，物體從正中央偏離到極端位置，像的數目會怎樣？`,`At 31°, as the object moves from the center to the extreme position, what happens to the number of images?`),
   [P(`增加 1 個`,`One image more`),P(`完全不變`,`No change at all`),P(`減少一半`,`Half as many left`),P(`減少 1 個`,`One image fewer`)],3,
   P(`31° 正中央有 12 個像，極端偏離時末像落入盲區，總像數減 1，變成 11 個。`,`At 31° the center gives 12 images; at the extreme the last one enters the blind zone, leaving 11.`),
   P(`看表中 31° 那一列的兩個像數。`,`Compare the two image counts in the 31° row.`)),
  Q(P(`極端偏離時像數少一個，是因為什麼？`,`What causes the image count to drop by one at the extreme position?`),
   [P(`末像被鏡子吸收`,`The mirror absorbs the image`),P(`物體大小發生變化`,`The object changes its size`),P(`末像落入盲區中`,`Last image enters blind zone`),P(`光線被折射走了`,`The light gets refracted away`)],2,
   P(`末像的深度達到 180°，落入無鏡面可反射的盲區，成像因此停止。`,`The last image reaches a depth of 180° and falls into the blind zone where no mirror can reflect, so imaging stops.`),
   P(`表格最右欄寫了原因。`,`The right-hand column states the cause.`))],
 '#tab1':[
  Q(P(`鏡角 40°，物體在離基準 10° 的位置，第一個像的像角是多少（像角 = 2 × 鏡角 − 物角）？`,`The mirror angle is 40° and the object is at 10°. What is the first image angle (image = 2 × mirror − object)?`),
   [P(`30 度`,`30°`),P(`50 度`,`50°`),P(`90 度`,`90°`),P(`70 度`,`70°`)],3,
   P(`像角 = 2 × 40° − 10° = 70°。`,`Image angle = 2 × 40° − 10° = 70°.`),
   P(`把數字代入公式，注意先乘 2 再減。`,`Plug into the formula: double first, then subtract.`)),
  Q(P(`依據鏡像原理，兩組成像序列是以什麼為對稱軸移動？`,`By the mirror principle, about what do the two image sequences move symmetrically?`),
   [P(`物體本身`,`Symmetric about the object`),P(`觀察者的眼睛`,`Symmetric about the eye`),P(`鏡面的法線`,`Symmetric about the normal`),P(`各自的鏡面`,`Symmetric about the mirror`)],3,
   P(`兩組成像序列皆以各自的鏡面為對稱軸，進行嚴格的對稱移動。`,`Both image sequences move strictly symmetrically about their own mirrors.`),
   P(`平面鏡成像的像與物，對稱軸是鏡面本身。`,`For a plane mirror, image and object are symmetric about the mirror itself.`)),
  Q(P(`夾角 31°、物體偏離 +9.5° 時，A 序列 5 個像、B 序列 6 個像，共幾個像？`,`At 31° with the object offset +9.5°, sequence A has 5 images and B has 6. How many in total?`),
   [P(`12 個像`,`12 images`),P(`10 個像`,`10 images`),P(`11 個像`,`11 images`),P(`13 個像`,`13 images`)],2,
   P(`5 + 6 = 11 個像。`,`5 + 6 = 11 images.`),
   P(`兩個序列的像數直接相加。`,`Just add the counts of the two sequences.`))],
 '#tab2':[
  Q(P(`「盲區」指的是什麼區域？`,`What does the "blind zone" refer to?`),
   [P(`光線只能折射的區域`,`Where light only refracts`),P(`鏡子正前方的區域`,`Straight ahead of mirrors`),P(`無法再被反射的區域`,`Where no mirror reflects`),P(`物體正後方的區域`,`Right behind the object`)],2,
   P(`盲區是深度 ≥ 180°、無法再被任一鏡面反射的區域。`,`The blind zone is depth ≥ 180°, where neither mirror can reflect any more.`),
   P(`圖中紅色虛線標出的是 180° 邊界。`,`The red dashed line marks the 180° boundary.`)),
  Q(P(`當某個像的深度達到或超過 180° 時，會發生什麼事？`,`What happens when an image depth reaches or exceeds 180°?`),
   [P(`還會繼續出現新像`,`More images keep forming`),P(`像會變成實像`,`The image becomes real`),P(`不再有新的像形成`,`No further images form`),P(`像會放大兩倍`,`The image doubles in size`)],2,
   P(`深度 ≥ 180° 時進入盲區，反射終止，總像數因此減少。`,`At depth ≥ 180° the image enters the blind zone, reflection ends, and the total count drops.`),
   P(`軌跡明細最後一列寫「進入盲區，停止」。`,`The last line of the trace reads "enter blind zone, stop".`)),
  Q(P(`公式 (x + 0.5) × θ < 180°，θ = 60° 時，最大正整數 x 是多少？`,`With (x + 0.5) × θ < 180° and θ = 60°, what is the largest positive integer x?`),
   [P(`x = 3`,`x = 3`),P(`x = 4`,`x = 4`),P(`x = 2`,`x = 2`),P(`x = 1`,`x = 1`)],2,
   P(`(x + 0.5) × 60 < 180，得 x + 0.5 < 3，所以最大正整數 x = 2。`,`(x + 0.5) × 60 < 180 gives x + 0.5 < 3, so the largest positive integer is x = 2.`),
   P(`先把 180 除以 60，再減 0.5。`,`Divide 180 by 60, then subtract 0.5.`))]
});
})();
