/* Multiple-choice practice for kinematics_4.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.mode-switch button',keys:["ticker","incline","table_deriv"],before:'footer'});
LQ.addStatic('kinematics_4',{
 '#mcq-ticker':[
  Q(P(`紙帶上的點距由舊點到新點越來越大，小車在做什麼運動？`,`On the tape, the dot gaps grow from the old dots to the new ones. What is the cart doing?`),
   [P(`越走越慢的減速`,`Slowing down steadily`),P(`越走越快的加速`,`Speeding up steadily`),P(`速度固定的等速`,`Moving at one speed`),P(`靜止不動的狀態`,`Staying at rest here`)],1,
   P(`相同時間內走的距離越來越大，表示速度越來越快，是加速運動。`,`Equal time intervals cover more and more distance, so the cart is speeding up.`),
   P(`每兩點之間的時間都相同。`,`The time between dots is always equal.`)),
  Q(P(`紙帶上的點距越來越小，代表什麼？`,`The dot gaps get smaller and smaller. What does it mean?`),
   [P(`小車正在加速`,`The cart is speeding`),P(`小車正在減速`,`The cart is slowing`),P(`小車一直等速`,`The cart is steady`),P(`小車突然轉彎`,`The cart is turning`)],1,
   P(`相同時間內位移變小，速度變小，是減速運動。`,`Displacement per equal time shrinks, so the speed is dropping.`),
   P(`間距是每個 Δt 走的距離。`,`Each gap is the distance covered in one Δt.`)),
  Q(P(`由靜止開始的等加速運動，連續相等時間內的位移比是多少？`,`For uniform acceleration from rest, what is the ratio of displacements in successive equal times?`),
   [P(`1 : 2 : 3 : 4 : 5`,`1 : 2 : 3 : 4 : 5`),P(`1 : 4 : 9 : 16 : 25`,`1 : 4 : 9 : 16 : 25`),P(`1 : 1 : 1 : 1 : 1`,`1 : 1 : 1 : 1 : 1`),P(`1 : 3 : 5 : 7 : 9`,`1 : 3 : 5 : 7 : 9`)],3,
   P(`連續相等時間的位移成奇數比 1 : 3 : 5 : 7 : 9。`,`Successive equal-time displacements follow the odd-number ratio 1 : 3 : 5 : 7 : 9.`),
   P(`要看的是每一段的位移，不是累計位移。`,`Look at each segment, not the running total.`))],
 '#mcq-incline':[
  Q(P(`伽利略讓小球沿斜面滾下，等間隔時間內的位移比是多少？`,`Galileo rolls a ball down a slope. What is the ratio of displacements in equal time intervals?`),
   [P(`1 : 2 : 3 : 4 : 5`,`1 : 2 : 3 : 4 : 5`),P(`1 : 4 : 9 : 16 : 25`,`1 : 4 : 9 : 16 : 25`),P(`9 : 7 : 5 : 3 : 1`,`9 : 7 : 5 : 3 : 1`),P(`1 : 3 : 5 : 7 : 9`,`1 : 3 : 5 : 7 : 9`)],3,
   P(`由靜止出發的等加速運動，連續相等時間的位移比是 1 : 3 : 5 : 7 : 9。`,`From rest with constant acceleration, successive equal-time displacements are in the ratio 1 : 3 : 5 : 7 : 9.`),
   P(`奇數等差數列。`,`An odd-number sequence.`)),
  Q(P(`斜面角度 30°、g ＝ 10 m/s² 時，小球下滑的加速度是多少？`,`With a 30° slope and g = 10 m/s², what is the ball's acceleration down the slope?`),
   [P(`8 m/s²`,`8 m/s²`),P(`5 m/s²`,`5 m/s²`),P(`10 m/s²`,`10 m/s²`),P(`2 m/s²`,`2 m/s²`)],1,
   P(`沿斜面的加速度 a ＝ g sinθ ＝ 10 × 0.5 ＝ 5 m/s²。`,`Acceleration along the slope a = g sinθ = 10 × 0.5 = 5 m/s².`),
   P(`sin 30° ＝ 0.5。`,`sin 30° = 0.5.`)),
  Q(P(`斜面角度加大到 90°，小球的運動會變成什麼？`,`If the slope angle is raised to 90°, what does the motion become?`),
   [P(`自由落體`,`Free fall motion`),P(`等速運動`,`Constant velocity`),P(`靜止不動`,`Resting in place`),P(`減速運動`,`Slowing movement`)],0,
   P(`90° 時 a ＝ g sin 90° ＝ g，這就是自由落體。`,`At 90°, a = g sin 90° = g, which is free fall.`),
   P(`角度越大，加速度越接近 g。`,`The steeper the slope, the closer a gets to g.`))],
 '#mcq-table_deriv':[
  Q(P(`等加速運動中，某段時間的平均速度等於哪個時刻的瞬時速度？`,`In uniform acceleration, the average velocity of a time interval equals the instantaneous velocity at which moment?`),
   [P(`該段時間的中間時刻`,`The midpoint of the span`),P(`該段時間的開始時刻`,`The start of the interval`),P(`該段時間的結束時刻`,`The end of the interval`),P(`該段時間的最大值`,`The peak of the interval`)],0,
   P(`在等加速度運動中，平均速度恰等於中間時刻的瞬時速度。`,`In uniform acceleration the average velocity equals the instantaneous velocity at the midpoint in time.`),
   P(`想想直線 v-t 圖的中點。`,`Think of the midpoint of the straight v-t line.`)),
  Q(P(`表中第 0~1 秒位移 0.2 m，平均速度是多少？`,`The table shows 0.2 m of displacement in the 0–1 s interval. What is the average velocity?`),
   [P(`0.4 m/s`,`0.4 m/s`),P(`2.0 m/s`,`2.0 m/s`),P(`0.1 m/s`,`0.1 m/s`),P(`0.2 m/s`,`0.2 m/s`)],3,
   P(`平均速度 ＝ 位移 ÷ 時間 ＝ 0.2 ÷ 1 ＝ 0.2 m/s。`,`Average velocity = displacement ÷ time = 0.2 ÷ 1 = 0.2 m/s.`),
   P(`時間只有 1 秒。`,`The interval lasts only 1 s.`)),
  Q(P(`相鄰中間時刻的速度每秒增加 0.4 m/s，加速度是多少？`,`The velocity at successive midpoints rises by 0.4 m/s each second. What is the acceleration?`),
   [P(`0.4 m/s²`,`0.4 m/s²`),P(`0.2 m/s²`,`0.2 m/s²`),P(`4.0 m/s²`,`4.0 m/s²`),P(`0.8 m/s²`,`0.8 m/s²`)],0,
   P(`a ＝ Δv ÷ Δt ＝ 0.4 ÷ 1 ＝ 0.4 m/s²。`,`a = Δv ÷ Δt = 0.4 ÷ 1 = 0.4 m/s².`),
   P(`Δt ＝ 1 s。`,`Δt = 1 s.`))]
});
})();
