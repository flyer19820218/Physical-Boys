/* Multiple-choice practice for optics_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('optics_1',{
 '#mcq-optics1':[
  Q(P(`原本物高 8 cm，物距 10 cm。請問屏幕放在另一側距離針孔多少 cm 時，像高會變成 24 cm？`,`The object is 8 cm tall and 10 cm from the pinhole. How far from the pinhole, on the other side, should the screen be for the image to be 24 cm tall?`),
   [P(`10 cm`,`10 cm`),P(`30 cm`,`30 cm`),P(`40 cm`,`40 cm`),P(`240 cm`,`240 cm`)],1,
   P(`像高 ÷ 物高 = 像距 ÷ 物距。24 ÷ 8 = 3 倍，所以像距 = 3 × 10 = 30 cm。（40 cm 是物體到屏幕的總距離，不是針孔到屏幕的距離。）`,`Image height ÷ object height = image distance ÷ object distance. 24 ÷ 8 = 3, so the image distance is 3 × 10 = 30 cm. (40 cm is the distance from the object to the screen, not from the pinhole to the screen.)`),
   P(`針孔成像是相似三角形：像高是物高的幾倍，像距就是物距的幾倍。`,`Pinhole imaging uses similar triangles: the image distance is as many times the object distance as the image height is the object height.`)),
  Q(P(`承上題，物體與屏幕的位置都不動，針孔要往哪裡移動，成像大小才會變成物體高的 4 倍？`,`Continuing, with the object and the screen both fixed, which way should the pinhole move so the image is 4 times the object height?`),
   [P(`朝物體移動，物距變小`,`Toward the object; object distance shrinks`),P(`朝屏幕移動，物距變大`,`Toward the screen; object distance grows`),P(`朝上移動，離開中心線`,`Upward, away from the center line of the setup`),P(`不必移動，像高本來就不變`,`No need to move; the image height never changes`)],0,
   P(`放大倍率 = 像距 ÷ 物距。物體與屏幕不動時，針孔越靠近物體，物距越小、像距越大，像就越大；要 4 倍，針孔就要再往物體靠近。`,`Magnification = image distance ÷ object distance. With the object and screen fixed, the closer the pinhole is to the object, the smaller the object distance and the larger the image distance, so the image grows; for 4 times, move the pinhole closer to the object.`),
   P(`倍率 = 像距 ÷ 物距。想讓倍率變大，物距要變大還是變小？`,`Magnification = image distance ÷ object distance. To make it larger, should the object distance get larger or smaller?`))]
});
})();
