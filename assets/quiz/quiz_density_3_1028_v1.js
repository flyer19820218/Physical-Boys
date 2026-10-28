/* Multiple-choice practice for density_3.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('density_3',{
 '#tab1':[
  Q(P(`甲物體體積 100 cm³、質量 50 g；乙物體體積 20 cm³、質量 5 g。把兩者都切成 1 cm³ 的小方塊來比，哪一個比較密集？`,`Object A is 100 cm³ and 50 g; object B is 20 cm³ and 5 g. If both are cut into 1 cm³ blocks, which is denser?`),
   [P(`乙物體，每 1 cm³ 質量 0.25 g`,`Object B, 0.25 g in every 1 cm³`),P(`甲物體，每 1 cm³ 質量 0.5 g`,`Object A, 0.5 g in every 1 cm³`),P(`兩者一樣，因為都切成 1 cm³`,`The same, since both are cut to 1 cm³`),P(`甲物體，每 1 cm³ 質量 50 g`,`Object A, 50 g in every 1 cm³`)],1,
   P(`甲：50 ÷ 100 = 0.5 g/cm³；乙：5 ÷ 20 = 0.25 g/cm³。每 1 cm³ 甲比較重，所以甲的密度比較大。`,`A: 50 ÷ 100 = 0.5 g/cm³; B: 5 ÷ 20 = 0.25 g/cm³. A is heavier per 1 cm³, so A has the greater density.`),
   P(`把質量除以體積，算出「每 1 cm³ 有幾公克」，再比大小。`,`Divide mass by volume to get the grams in each 1 cm³, then compare.`)),
  Q(P(`密度的物理意義是什麼？`,`What does density mean physically?`),
   [P(`物體整體的總質量有多大`,`How large the total mass of the object is`),P(`每單位體積內的物質質量`,`The mass of matter in each unit of volume`),P(`物體所占據的空間有多大`,`How much space the object takes up`),P(`物體所受到的重力有多強`,`How strong the gravity on the object is`)],1,
   P(`密度是物質的稠密（集中）程度，也就是單位體積內所含物質的質量。`,`Density is how packed the matter is: the mass of matter in a unit of volume.`),
   P(`想想為什麼要把大家都切成 1 cm³ 再來比。`,`Think about why everything is cut into 1 cm³ blocks before comparing.`)),
  Q(P(`同一種材質的鐵塊，在定溫定壓下，大塊與小塊的密度會怎樣？`,`For iron blocks of the same material at fixed temperature and pressure, how do the densities of a big and a small block compare?`),
   [P(`大塊的密度比較大，因為質量比較重`,`The big block is denser because it has more mass`),P(`小塊的密度比較大，因為體積比較小`,`The small block is denser because its volume is smaller`),P(`一樣大，密度不會因為大小而改變`,`The same; density does not change as size changes`),P(`要看形狀，方塊比球形的密度大`,`Depends on shape; a cube is denser than a ball`)],2,
   P(`同一種材質的密度是固定的特性，不管體積多大、質量多重都一樣；質量和體積會一起變，M ÷ V 不變。`,`Density is a fixed property of a material: whatever the size, mass and volume change together and M ÷ V stays the same.`),
   P(`密度是分辨物質種類的特性，想想它會不會跟著體積改變。`,`Density is a property used to tell materials apart. Would it change with volume?`))],
 '#tab2':[
  Q(P(`某物體的密度是 3 g/cm³，正確的唸法是哪一個？`,`An object has a density of 3 g/cm³. Which is the correct way to read it?`),
   [P(`每 3 cm³ 的質量有 1 g`,`Every 3 cm³ has a mass of 1 g`),P(`每 1 cm³ 的質量有 3 g`,`Every 1 cm³ has a mass of 3 g`),P(`整個物體的質量是 3 g`,`The whole object has a mass of 3 g`),P(`整個物體的體積是 3 cm³`,`The whole object has a volume of 3 cm³`)],1,
   P(`g/cm³ 是 3 g ÷ 1 cm³，斜線唸作「每」：每 1 cm³ 質量有 3 g。`,`g/cm³ means 3 g ÷ 1 cm³; read the slash as "per": every 1 cm³ has a mass of 3 g.`),
   P(`單位 g/cm³ 中間的斜線要唸成「每」。`,`Read the slash in g/cm³ as "per".`)),
  Q(P(`黃金的密度是 19.3 g/cm³。一塊 10 cm³ 的金塊，質量約是多少？`,`Gold has a density of 19.3 g/cm³. About what is the mass of a 10 cm³ gold block?`),
   [P(`10 g`,`10 g`),P(`1.93 g`,`1.93 g`),P(`29.3 g`,`29.3 g`),P(`193 g`,`193 g`)],3,
   P(`M = D × V = 19.3 × 10 = 193 g。1.93 是把 D 除以 V 算出來的，29.3 是把兩數相加。`,`M = D × V = 19.3 × 10 = 193 g. 1.93 comes from dividing D by V, and 29.3 from adding the two numbers.`),
   P(`已知密度和體積，要求質量，用 M = D × V。`,`Given density and volume, find mass with M = D × V.`)),
  Q(P(`冰的密度是 0.92 g/cm³，水是 1.0 g/cm³。冰放進水裡會怎樣？`,`Ice has a density of 0.92 g/cm³ and water 1.0 g/cm³. What happens when ice is put in water?`),
   [P(`沉到水底，因為體積比水大`,`It sinks, because its volume is larger than water`),P(`浮在水面，因為密度比水小`,`It floats, because its density is less than water`),P(`懸在水中，因為密度剛好一樣`,`It hangs in the water, since the densities match`),P(`沉到水底，因為它比水還要冷`,`It sinks, because it is colder than the water`)],1,
   P(`冰的密度 0.92 比水的 1.0 小，所以浮在水面。`,`The density of ice, 0.92, is less than the 1.0 of water, so it floats.`),
   P(`先比較兩個密度的大小，再想誰會浮在上面。`,`Compare the two densities first, then decide which stays on top.`))],
 '#tab3':[
  Q(P(`同材質鐵塊：甲 39.0 g、5.0 cm³；丁 50.0 cm³。丁鐵塊的質量 X 是多少？`,`Same-material iron blocks: A is 39.0 g and 5.0 cm³; D is 50.0 cm³. What is the mass X of block D?`),
   [P(`195 g`,`195 g`),P(`780 g`,`780 g`),P(`50 g`,`50 g`),P(`390 g`,`390 g`)],3,
   P(`D = 39.0 ÷ 5.0 = 7.8 g/cm³；同材質密度相同，X = D × V = 7.8 × 50.0 = 390 g。`,`D = 39.0 ÷ 5.0 = 7.8 g/cm³; the same material has the same density, so X = D × V = 7.8 × 50.0 = 390 g.`),
   P(`同材質密度相同，先用甲鐵塊算出 D = M ÷ V。`,`Same material means the same density, so first find D = M ÷ V from block A.`)),
  Q(P(`把一塊大石頭敲成兩半，質量減半。每一半石頭的密度會怎樣？`,`A big rock is broken in half, so the mass is halved. What happens to the density of each half?`),
   [P(`不變，因為仍是同一種材質`,`It stays the same, as it is the same material`),P(`減半，因為質量只剩一半`,`It halves, because only half the mass is left`),P(`變成兩倍，因為體積變小了`,`It doubles, because the volume got smaller`),P(`要看兩半是不是一樣大`,`It depends on whether the halves are equal`)],0,
   P(`質量減半，體積也跟著減半，M ÷ V 的值不變，所以密度不變。`,`The mass halves and the volume halves too, so the value of M ÷ V is unchanged and so is the density.`),
   P(`質量減半的同時，體積有沒有跟著變？`,`When the mass halves, does the volume change too?`)),
  Q(P(`一塊金屬質量 80.1 g、體積 30 cm³，密度約是多少？最可能是哪種材質？`,`A metal piece has a mass of 80.1 g and a volume of 30 cm³. What is its density, and what is it most likely?`),
   [P(`約 2.67 g/cm³，最可能是鋁`,`About 2.67 g/cm³, likely aluminum`),P(`約 0.37 g/cm³，比水還要輕`,`About 0.37 g/cm³, lighter than water`),P(`約 7.8 g/cm³，最可能是鐵`,`About 7.8 g/cm³, most likely iron`),P(`約 8.9 g/cm³，最可能是銅`,`About 8.9 g/cm³, most likely copper`)],0,
   P(`D = 80.1 ÷ 30 = 2.67 g/cm³，最接近密度表中鋁的 2.7 g/cm³。`,`D = 80.1 ÷ 30 = 2.67 g/cm³, closest to the 2.7 g/cm³ of aluminum in the density table.`),
   P(`用 D = M ÷ V 算出密度，再去對照常見物質的密度表。`,`Work out D = M ÷ V, then check the table of common densities.`))],
 '#tab4':[
  Q(P(`在縱軸為質量 M、橫軸為體積 V 的圖上，一種純物質的圖形會是什麼樣子？`,`On a graph with mass M on the vertical axis and volume V on the horizontal axis, what does a pure substance look like?`),
   [P(`一條與橫軸平行的水平線`,`A horizontal line parallel to the V axis`),P(`一條往下彎曲的曲線`,`A curve that bends downward from the origin`),P(`一條通過原點的斜直線`,`A sloping straight line through the origin`),P(`一條不通過原點的斜直線`,`A sloping straight line that misses the origin`)],2,
   P(`M = D × V，質量和體積成正比，所以是通過原點的斜直線。`,`M = D × V, so mass is proportional to volume: a straight line through the origin.`),
   P(`同一種物質的質量與體積是正比還是反比？`,`For one substance, are mass and volume directly or inversely related?`)),
  Q(P(`M-V 圖上，一條斜線畫得愈陡，代表什麼？`,`On an M-V graph, what does a steeper line mean?`),
   [P(`密度愈小，同體積的質量愈輕`,`Smaller density: less mass for the same volume`),P(`密度愈大，同體積的質量愈重`,`Greater density: more mass for the same volume`),P(`體積愈大，同質量的物質愈輕`,`Greater volume: lighter for the same mass`),P(`質量愈大，物質的密度愈小`,`Greater mass: the substance is less dense`)],1,
   P(`斜率就是密度 D：線愈陡，同一個體積下質量愈大，密度愈大。`,`The slope is the density D: the steeper the line, the more mass at the same volume, and the greater the density.`),
   P(`圖上斜率 = M ÷ V，想想它等於什麼量。`,`The slope is M ÷ V. Which quantity is that?`)),
  Q(P(`100 g 的鋁塊體積約 37 cm³，100 g 的銅塊體積約 11 cm³。哪一個密度比較大？`,`A 100 g aluminum block is about 37 cm³ and a 100 g copper block about 11 cm³. Which is denser?`),
   [P(`鋁，體積愈大密度愈大`,`Aluminum; more volume means greater density`),P(`銅，體積愈小密度愈大`,`Copper; less volume means greater density`),P(`一樣大，因為兩者質量相同`,`The same, since both masses are equal`),P(`無法比較，一定要同體積才行`,`Cannot compare; the volumes must be equal`)],1,
   P(`質量相同時，體積 V 與密度 D 成反比：銅只要 11 cm³，擠得比鋁（37 cm³）更密，所以銅的密度大。`,`At equal mass, volume and density are inversely related: copper packs the same mass into only 11 cm³, versus 37 cm³ for aluminum, so copper is denser.`),
   P(`質量一樣時，誰占的體積比較小，誰就比較擠。`,`At the same mass, the one taking less volume is more tightly packed.`))]
});
})();
