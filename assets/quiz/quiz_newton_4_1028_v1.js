/* Multiple-choice practice for newton_4.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('newton_4',{
 '#panel-tab5':[
  Q(P(`金屬球在光滑桌面上被繩子拉著作等速率圓周運動，關於它的物理量，何者正確？`,`A metal ball is pulled by a string around a circle at constant speed on a smooth table. Which statement is correct?`),
   [P(`速度方向不斷改變，合力永遠指向圓心`,`Direction changes; force points inward`),P(`速率維持不變，所以是等速度直線運動`,`Speed is steady, so straight uniform motion`),P(`球受到的合力等於零，才能維持速率`,`Net force is zero to keep a steady speed`),P(`合力沿切線方向，一直推著球向前轉`,`Net force is tangent, pushing it along`)],0,
   P(`速率不變但方向一直改變，速度就一直在變，所以有加速度，合力不為零且指向圓心。`,`Direction keeps changing, so velocity changes and there is acceleration; the net force is not zero and points to the center.`),
   P(`速度要看方向，也要看大小。`,`Velocity includes direction as well as size.`)),
  Q(P(`承上題，繩子在某一瞬間突然斷裂（不計摩擦與空氣阻力），金屬球接著怎麼運動？`,`After the string suddenly snaps (no friction or air resistance), how does the ball move?`),
   [P(`沿著半徑方向直直往圓外飛出`,`Straight outward along the radius direction`),P(`沿斷裂瞬間切線方向等速前進`,`Straight along the tangent at constant speed`),P(`失去拉力後往圓心方向掉進去`,`Falls inward toward the center of the circle`),P(`繼續沿著原來的圓形軌道轉圈`,`Keeps moving along the same circular path`)],1,
   P(`繩斷後合力為零，依牛頓第一定律保持斷裂瞬間的運動，即沿切線方向等速直線前進。`,`With no net force, Newton’s first law keeps the instantaneous motion: straight along the tangent at constant speed.`),
   P(`沒有任何力把球往外推。`,`No force pushes the ball outward.`)),
  Q(P(`高速公路交流道的彎道路面外側較高、內側較低，最主要的原因是什麼？`,`Highway interchange curves are banked, higher on the outside. What is the main reason?`),
   [P(`增加汽車所受到的地球引力大小`,`To increase the Earth’s pull on the whole car`),P(`減少雨天時輪胎排水的空氣阻力`,`To cut the air drag on the tires in the rain`),P(`用支撐力的水平分量提供向心力`,`Sideways support part gives centripetal force`),P(`讓車子的質量在過彎時變得更大`,`To make the car’s mass greater when turning`)],2,
   P(`支撐力垂直路面，斜面使它出現指向圓心的水平分量，成為向心力，過彎更安全。`,`The support force is perpendicular to the road, so on a bank it has a horizontal part toward the center, giving centripetal force.`),
   P(`支撐力垂直於路面，斜面會讓它有水平分量。`,`The support force is perpendicular to the road; a slope gives it a horizontal part.`)),
  Q(P(`水桶在垂直面上快速甩一圈，通過最高點時水沒有掉下來，下列何者正確？`,`A bucket of water is swung fast in a vertical circle and the water stays in at the top. Which statement is correct?`),
   [P(`有離心力把水往外拉，抵消了重力`,`A centrifugal force pulls the water outward`),P(`在最高點水完全不受重力作用`,`At the top the water feels no gravity at all`),P(`水桶的底部把水往上托住不讓它掉`,`The bucket base holds the water up from below`),P(`水仍受重力，重力提供所需向心力`,`Gravity still acts and gives the needed pull`)],3,
   P(`最高點圓心在正下方，重力向下，剛好當作向心力；轉得夠快，水就會沿著圓走。`,`At the top the center is straight below, so gravity serves as the centripetal force; if fast enough the water follows the circle.`),
   P(`最高點的重力方向與圓心方向相同。`,`At the top, gravity points toward the center.`)),
  Q(P(`地表體重 72 kgw 的太空人飛到距地心 3R 的高空，他的質量與體重各為多少？`,`An astronaut weighs 72 kgw on Earth’s surface (distance R from the center). At 3R from the center, what are the mass and the weight?`),
   [P(`質量與體重都變成 24 kgw`,`Mass and weight both become 24 kgw`),P(`質量不變，體重變成 8 kgw`,`Mass unchanged; weight becomes 8 kgw`),P(`質量變 8 kg，體重仍是 72 kgw`,`Mass becomes 8 kg; weight stays 72 kgw`),P(`質量不變，體重變成 24 kgw`,`Mass unchanged; weight becomes 24 kgw`)],1,
   P(`引力與距離平方成反比，距離變 3 倍，引力變 1/9，體重 72 × 1/9 ＝ 8 kgw；質量不變。`,`Gravity falls with distance squared: at 3 times the distance it is 1/9, so 72 × 1/9 = 8 kgw; the mass is unchanged.`),
   P(`距離要從地心量起，且質量不會因地點改變。`,`Measure distance from the center; mass does not change with place.`))]
});
})();
