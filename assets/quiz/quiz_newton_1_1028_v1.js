/* Multiple-choice practice for newton_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('newton_1',{
 '#panel-tab6':[
  Q(P(`雨傘由上往下看是順時針旋轉，傘緣東側的水滴脫離瞬間，會往哪個方向飛出？`,`Viewed from above, an umbrella spins clockwise. Which way does a drop at the east rim fly off?`),
   [P(`正東方（沿半徑向外）`,`Due east, along radius`),P(`正北方（切線反向）`,`Due north, reverse tangent`),P(`正西方（朝向圓心）`,`Due west, toward center`),P(`正南方（切線方向）`,`Due south, tangent line`)],3,
   P(`脫離後不再受向心力，水滴因慣性沿瞬間的切線方向飛出；順時針時東側的切線朝南。`,`Without the centripetal force the drop keeps moving along the tangent; at the east rim of a clockwise spin that is south.`),
   P(`水滴不會沿半徑飛，要看切線。`,`Drops leave along the tangent, not the radius.`)),
  Q(P(`向東行駛的火車上，杯中水面突然向東（前方）溢出，火車發生什麼狀況？`,`On a train heading east, the water in a cup suddenly spills toward the east (front). What happened?`),
   [P(`火車正在突然加速`,`The train is speeding up`),P(`火車正在緊急煞車`,`The train is braking hard`),P(`火車正在等速前進`,`The train keeps constant speed`),P(`火車正在向西倒退`,`The train is rolling backward`)],1,
   P(`杯子隨車減速，水因慣性想維持原速度繼續向前，所以向前溢出，代表火車正在煞車。`,`The cup slows with the train while the water keeps its forward motion by inertia, so the train is braking.`),
   P(`水面傾倒的方向，就是慣性原本想去的方向。`,`The water tips the way inertia wants to go.`)),
  Q(P(`體積相同的實心鐵球與空心塑膠球，關於兩球慣性大小，何者正確？`,`A solid iron ball and a hollow plastic ball have the same volume. Which statement about their inertia is correct?`),
   [P(`鐵球質量大，慣性永遠較大`,`Iron has more mass, so more inertia`),P(`體積相同，所以慣性一樣大`,`Same volume, so same inertia`),P(`塑膠球滾得很快，慣性就較大`,`A fast plastic ball has more inertia`),P(`靜止的球沒有慣性可言`,`A resting ball has no inertia`)],0,
   P(`慣性大小只由質量決定，與體積、速度無關；鐵球質量較大，慣性較大。`,`Inertia depends only on mass, not on volume or speed; the iron ball has more mass and more inertia.`),
   P(`慣性的量度是質量。`,`Mass measures inertia.`))]
});
})();
