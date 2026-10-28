/* Multiple-choice practice for kinematics_5.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.mode-switch button',keys:["area","freefall","special"],before:'footer'});
LQ.addStatic('kinematics_5',{
 '#mcq-area':[
  Q(P(`v-t 圖中，梯形面積可以拆成哪兩個部分？`,`On a v-t graph, a trapezoid area splits into which two parts?`),
   [P(`矩形加三角形`,`Rectangle plus triangle`),P(`兩個矩形相加`,`Two identical rectangles`),P(`兩個三角形相加`,`Two identical triangles`),P(`矩形減三角形`,`Rectangle minus triangle`)],0,
   P(`底部是等速矩形 v₀t，上方是加速三角形 ½at²，合起來就是 Δx ＝ v₀t ＋ ½at²。`,`The bottom is a constant-speed rectangle v₀t and the top is an accelerating triangle ½at²; together they give Δx = v₀t + ½at².`),
   P(`底部是初速造成的，上方是加速造成的。`,`The base comes from initial speed, the top from acceleration.`)),
  Q(P(`v₀ ＝ 6 m/s、a ＝ 4 m/s²、t ＝ 5 s，總位移是多少？`,`With v₀ = 6 m/s, a = 4 m/s² and t = 5 s, what is the total displacement?`),
   [P(`30 m`,`30 m`),P(`50 m`,`50 m`),P(`110 m`,`110 m`),P(`80 m`,`80 m`)],3,
   P(`Δx ＝ 6 × 5 ＋ ½ × 4 × 5² ＝ 30 ＋ 50 ＝ 80 m。`,`Δx = 6 × 5 + ½ × 4 × 5² = 30 + 50 = 80 m.`),
   P(`把矩形和三角形兩塊相加。`,`Add the rectangle and the triangle.`)),
  Q(P(`同一題中，5 秒後的末速度是多少？`,`In the same problem, what is the final speed after 5 s?`),
   [P(`20 m/s`,`20 m/s`),P(`30 m/s`,`30 m/s`),P(`16 m/s`,`16 m/s`),P(`26 m/s`,`26 m/s`)],3,
   P(`v ＝ v₀ ＋ at ＝ 6 ＋ 4 × 5 ＝ 26 m/s。`,`v = v₀ + at = 6 + 4 × 5 = 26 m/s.`),
   P(`用 v ＝ v₀ ＋ at。`,`Use v = v₀ + at.`))],
 '#mcq-freefall':[
  Q(P(`下列哪一項不是自由落體的條件？`,`Which of these is NOT a condition for free fall?`),
   [P(`初速度必須為零`,`Initial speed must be zero`),P(`只受重力作用`,`Only gravity acts on it`),P(`加速度為定值 g`,`Constant acceleration g`),P(`初速度向下用力丟`,`Thrown down hard at start`)],3,
   P(`自由落體必須由靜止放開（v₀ ＝ 0），用力丟下就不是自由落體。`,`Free fall must start from rest (v₀ = 0); throwing it down hard is not free fall.`),
   P(`注意「由靜止放開」這句話。`,`Note the words "released from rest".`)),
  Q(P(`在真空中，鐵球和羽毛同時從同一高度釋放，結果如何？`,`In a vacuum, an iron ball and a feather are released together from the same height. What happens?`),
   [P(`鐵球比較先落`,`The ball lands first`),P(`兩者同時落地`,`They land together`),P(`羽毛比較先落`,`The feather lands first`),P(`兩者都不落下`,`Neither one falls`)],1,
   P(`沒有空氣阻力時，落下加速度都是 g，與質量無關，所以同時落地。`,`Without air resistance both fall with acceleration g regardless of mass, so they land together.`),
   P(`自由落體與質量無關。`,`Free fall does not depend on mass.`)),
  Q(P(`從 H ＝ 80 m 高處自由落下（取 g ＝ 10 m/s²），落地時間是多少？`,`An object falls freely from H = 80 m (take g = 10 m/s²). How long does it take to land?`),
   [P(`8 s`,`8 s`),P(`2 s`,`2 s`),P(`16 s`,`16 s`),P(`4 s`,`4 s`)],3,
   P(`H ＝ ½gt²，80 ＝ 5t²，t² ＝ 16，t ＝ 4 s。`,`H = ½gt², 80 = 5t², t² = 16, t = 4 s.`),
   P(`用 H ＝ ½gt²。`,`Use H = ½gt².`))],
 '#mcq-special':[
  Q(P(`鉛直上拋到達最高點的瞬間，速度和加速度各是多少？`,`At the top of a vertical throw, what are the velocity and acceleration?`),
   [P(`速度為零，加速度為零`,`v = 0, acceleration is 0`),P(`速度為 g，加速度為零`,`v = g, acceleration is 0`),P(`速度為零，加速度為 g`,`v = 0, acceleration is g`),P(`速度不為零，加速度為 g`,`v ≠ 0, acceleration is g`)],2,
   P(`最高點速度為零，但重力仍然作用，加速度仍是 g 向下，不為零。`,`At the top v = 0, but gravity still acts, so the acceleration is still g downward.`),
   P(`速度為零不代表受力為零。`,`Zero velocity does not mean zero force.`)),
  Q(P(`不計空氣阻力，鉛直上拋的上升時間與下降時間關係如何？`,`Ignoring air resistance, how do the rising time and falling time of a vertical throw compare?`),
   [P(`上升時間較長`,`Rising takes longer`),P(`兩者時間相等`,`Both times are equal`),P(`下降時間較長`,`Falling takes longer`),P(`無法比較大小`,`Cannot be compared`)],1,
   P(`上拋運動具有對稱性：上升時間等於下降時間，落回原處的速率等於初速。`,`The motion is symmetric: rise time equals fall time and the return speed equals the launch speed.`),
   P(`整個過程對稱。`,`The whole motion is symmetric.`)),
  Q(P(`以 25 m/s 鉛直上拋（取 g ＝ 10 m/s²），登頂時間是多少？`,`A ball is thrown straight up at 25 m/s (take g = 10 m/s²). How long to reach the top?`),
   [P(`5.0 s`,`5.0 s`),P(`2.5 s`,`2.5 s`),P(`0.4 s`,`0.4 s`),P(`25 s`,`25 s`)],1,
   P(`到最高點時 v ＝ 0，0 ＝ 25 − 10t，t ＝ 2.5 s。`,`At the top v = 0, so 0 = 25 − 10t and t = 2.5 s.`),
   P(`最高點的速度是零。`,`The speed at the top is zero.`))]
});
})();
