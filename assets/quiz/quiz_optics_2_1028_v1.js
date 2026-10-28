/* Multiple-choice practice for optics_2.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.mode-switch button',keys:["game","law","curved","combo"],before:'footer'});
LQ.addStatic('optics_2',{
 '#mcq-game':[
  Q(P(`救護車車頭的「AMBULANCE」為什麼要印成左右相反？`,`Why is "AMBULANCE" printed mirror-reversed on the front of an ambulance?`),
   [P(`讓字看起來比較美觀`,`It looks nicer on the ambulance`),P(`讓行人比較容易看見`,`Pedestrians notice it more easily`),P(`讓前車從後照鏡讀正`,`Drivers ahead read it in mirrors`),P(`避免路燈照到反光`,`It avoids glare from street lights`)],2,
   P(`平面鏡成像左右相反，前方駕駛從照後鏡看到的就是正確的字。`,`A plane mirror reverses left and right, so the driver ahead sees the word correctly in the rear-view mirror.`),
   P(`想想前方駕駛是用什麼看到救護車的。`,`Think about what the driver ahead looks through.`)),
  Q(P(`鏡中看到的時鐘是 4:10，真實時間是幾點？`,`A clock seen in a mirror reads 4:10. What is the real time?`),
   [P(`7 點 50 分`,`7:50`),P(`8 點 10 分`,`8:10`),P(`4 點 50 分`,`4:50`),P(`7 點 10 分`,`7:10`)],0,
   P(`真實時間 + 鏡中時間 = 12:00，所以真實時間是 12:00 − 4:10 = 7:50。`,`Real time + mirror time = 12:00, so the real time is 12:00 − 4:10 = 7:50.`),
   P(`用 12:00 去減鏡中的時間。`,`Subtract the mirror time from 12:00.`)),
  Q(P(`物體距離平面鏡 250 公分，鏡中的虛像距離鏡面多遠？`,`An object is 250 cm from a plane mirror. How far behind the mirror is its image?`),
   [P(`500 公分`,`500 cm`),P(`250 公分`,`250 cm`),P(`125 公分`,`125 cm`),P(`100 公分`,`100 cm`)],1,
   P(`平面鏡成像的像距等於物距，所以像在鏡後 250 公分，且大小相等。`,`For a plane mirror the image distance equals the object distance, so the image is 250 cm behind, and the same size.`),
   P(`畫面上的物距與像距兩個數字互相比較看看。`,`Compare the object distance with the image distance on screen.`))],
 '#mcq-law':[
  Q(P(`反射定律中的「入射角」是指哪兩條線的夾角？`,`In the law of reflection, between which two lines is the angle of incidence?`),
   [P(`入射光與鏡面的夾角`,`Incident ray to the mirror`),P(`入射光與法線的夾角`,`Incident ray to the normal`),P(`反射光與鏡面的夾角`,`Reflected ray to the mirror`),P(`入射光與反射光夾角`,`Incident to reflected ray`)],1,
   P(`入射角是入射光與「法線」的夾角，不是與鏡面的夾角。`,`The angle of incidence is measured from the normal, not from the mirror surface.`),
   P(`考試陷阱：角度一定要找法線。`,`Exam trap: angles are always measured from the normal.`)),
  Q(P(`一束光與鏡面的夾角為 30 度，它的反射角是多少？`,`A ray makes 30° with the mirror surface. What is its angle of reflection?`),
   [P(`60 度`,`60°`),P(`30 度`,`30°`),P(`90 度`,`90°`),P(`45 度`,`45°`)],0,
   P(`入射角 = 90° − 30° = 60°，反射角等於入射角，所以也是 60°。`,`Angle of incidence = 90° − 30° = 60°, and the angle of reflection equals it, so 60°.`),
   P(`先把和鏡面的夾角換成和法線的夾角。`,`First convert the angle with the mirror into the angle with the normal.`)),
  Q(P(`光在平面鏡上反射時，遵守哪一個規律？`,`Which rule does light follow when reflecting from a plane mirror?`),
   [P(`入射角大於反射角`,`Incident angle is larger`),P(`入射角小於反射角`,`Incident angle is smaller`),P(`入射角為反射角一半`,`Incident is half of reflected`),P(`入射角等於反射角`,`The two angles are equal`)],3,
   P(`反射定律：入射角永遠等於反射角。`,`Law of reflection: the angle of incidence always equals the angle of reflection.`),
   P(`畫面上的入射角與反射角數字永遠怎樣？`,`What is always true of the two angle readings on screen?`))],
 '#mcq-curved':[
  Q(P(`路口的凸面鏡能讓人看到較大範圍，原因是什麼？`,`Why does a convex mirror at a junction show a wide area?`),
   [P(`光線發散視野變廣`,`Gives a much wider view`),P(`光線會聚到一個點`,`Focuses light to a point`),P(`可以放大影像更大`,`Magnifies the image more`),P(`成像變成較大實像`,`Forms a larger image`)],0,
   P(`凸面鏡使光線發散，能容納更寬廣的畫面，視野變大，成正立縮小的虛像。`,`A convex mirror spreads light out, fitting a wider scene into the view and giving an upright, smaller, virtual image.`),
   P(`凸面鏡會讓光線會聚還是發散？`,`Does a convex mirror gather or spread light?`)),
  Q(P(`探照燈與太陽能鍋爐使用哪一種鏡面？`,`Which kind of mirror is used in a searchlight or a solar cooker?`),
   [P(`凸面鏡`,`Convex mirror`),P(`平面鏡`,`A plane mirror`),P(`凹透鏡`,`A concave lens`),P(`凹面鏡`,`Concave mirror`)],3,
   P(`凹面鏡能把光線會聚到一點，探照燈可把光打遠，太陽能鍋爐可集中能量。`,`A concave mirror gathers light at a point, so a searchlight can send light far and a solar cooker can concentrate energy.`),
   P(`要「集中能量」的鏡面，必須讓光線會聚。`,`To concentrate energy, the mirror must make light converge.`)),
  Q(P(`凸面鏡所成的像具有什麼特性？`,`What kind of image does a convex mirror form?`),
   [P(`正立縮小的虛像`,`Upright, small, virtual`),P(`倒立縮小的實像`,`Inverted, smaller, real`),P(`正立放大的虛像`,`Upright, larger, virtual`),P(`倒立放大的實像`,`Inverted, larger, real`)],0,
   P(`凸面鏡成正立、縮小的虛像，所以才有廣闊的視野。`,`A convex mirror forms an upright, reduced, virtual image, which gives a wide field of view.`),
   P(`影像縮小，才能裝下更多景物。`,`The image is reduced so more scenery fits.`))],
 '#mcq-combo':[
  Q(P(`要從鏡中看到自己的全身，鏡子最短需要多長？`,`What is the shortest mirror that shows your whole body?`),
   [P(`身高的一半`,`Half of your height`),P(`身高的全部`,`All of your height`),P(`身高的三分之一`,`One third of height`),P(`身高的兩倍`,`Twice your height`)],0,
   P(`所需最短鏡長永遠是身高的 1/2。`,`The shortest mirror needed is always half your height.`),
   P(`拖拉人體前後移動，鏡長數字會怎樣？`,`Drag the person and watch the mirror length.`)),
  Q(P(`站得離全身鏡更遠一些，所需的鏡子長度會怎樣？`,`If you stand farther from a full-length mirror, how does the required mirror length change?`),
   [P(`變短站遠就夠了`,`Shorter once you step back`),P(`變長要用更大鏡`,`Longer once you step back`),P(`不變仍為一半長`,`No change, still a half`),P(`變成之前的兩倍`,`Twice as long as before`)],2,
   P(`不管退後多少，頭頂與腳底的光反射進眼睛的位置固定，所需鏡長永遠是身高一半。`,`However far you step back, the reflection points for the head and feet stay fixed, so the mirror is always half your height.`),
   P(`很多人以為退後鏡子就可以小一點，真的嗎？`,`Many think stepping back allows a smaller mirror. Is that true?`)),
  Q(P(`全身鏡的安裝位置只和什麼有關？`,`What alone decides where the full-length mirror must be placed?`),
   [P(`你的眼睛高度`,`Your eyes' height`),P(`你的腳底高度`,`Your foot height`),P(`你站立的距離`,`Standing distance`),P(`鏡子的寬度大小`,`The mirror width`)],0,
   P(`鏡子位置只跟眼睛高度有關，跟站在哪裡無關。`,`The mirror position depends only on eye height, not on where you stand.`),
   P(`鏡子的上緣、下緣位置是由眼睛位置推出的。`,`The top and bottom edges follow from the eye position.`))]
});
})();
