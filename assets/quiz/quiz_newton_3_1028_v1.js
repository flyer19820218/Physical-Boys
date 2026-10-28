/* Multiple-choice practice for newton_3.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('newton_3',{
 '#panel-tab6':[
  Q(P(`雞蛋猛撞堅硬的石頭，雞蛋碎了、石頭沒事。碰撞瞬間，雞蛋撞石頭的力 F蛋 與石頭撞雞蛋的力 F石 關係為何？`,`An egg hits a rock hard; the egg shatters and the rock is fine. How do the force of the egg on the rock and the force of the rock on the egg compare?`),
   [P(`F石 較大，所以雞蛋才會破掉`,`Rock force is larger, so egg breaks`),P(`兩力大小相等，互為作用與反作用`,`Equal in size, action-reaction pair`),P(`F蛋 較大，因為是雞蛋主動撞上去`,`Egg force is larger, since it moved`),P(`石頭沒動，所以石頭沒有施力`,`Rock stays still, so it exerts none`)],1,
   P(`作用力與反作用力永遠大小相等；雞蛋碎是因為蛋殼比石頭脆弱。`,`An action-reaction pair is always equal; the egg breaks because eggshell is far weaker than rock.`),
   P(`同一對作用力與反作用力，大小有沒有可能不同？`,`Can the two forces of one pair ever differ in size?`)),
  Q(P(`質量 0.2 kg 的蘋果自由落下，受地球引力向下 2.0 N，這個引力的反作用力是什麼？`,`A 0.2 kg apple falls freely, pulled down by Earth with 2.0 N. What is the reaction to that force?`),
   [P(`空氣對蘋果向上的阻力 2.0 N`,`Air resistance on the apple, 2.0 N`),P(`蘋果對地球向上的吸引力 2.0 N`,`Apple pulls Earth upward with 2.0 N`),P(`蘋果還沒落地所以沒有反作用力`,`No reaction until the apple lands`),P(`地面對蘋果向上的支撐力 2.0 N`,`Ground pushes up on the apple, 2.0 N`)],1,
   P(`反作用力的受力者是地球：蘋果也以 2.0 N 向上吸引地球。`,`The reaction acts on Earth: the apple pulls Earth upward with the same 2.0 N.`),
   P(`反作用力的受力者不是蘋果。`,`The reaction does not act on the apple.`)),
  Q(P(`馬拉車的力與車拉馬的力大小相等、方向相反，為什麼馬車還能向前加速？`,`The horse pulls the cart and the cart pulls the horse with equal, opposite forces. Why can the cart still accelerate forward?`),
   [P(`兩力作用在不同物體上，無法抵消`,`They act on different bodies and never cancel`),P(`馬拉車的力其實大於車拉馬的力`,`The horse really pulls harder than the cart`),P(`馬向前蹬地，與反作用力完全無關`,`The horse kicks ground, unrelated to reaction`),P(`車的質量太小，所以反作用力消失`,`The cart is too light, so reaction vanishes`)],0,
   P(`這兩力的受力者一個是車、一個是馬，不能相加為零；看車只看作用在車上的力。`,`One force acts on the cart and the other on the horse, so they cannot sum to zero; for the cart only the forces on it matter.`),
   P(`先問：這兩個力作用在同一個物體上嗎？`,`First ask: do the two forces act on the same object?`)),
  Q(P(`拔河：甲隊 150 kg 穿拖鞋（摩擦係數 0.3），乙隊 100 kg 穿釘鞋（0.9），g＝10。誰贏？繩子對兩隊的拉力呢？`,`Tug-of-war: team A 150 kg in flip-flops (0.3), team B 100 kg in spikes (0.9), g = 10. Who wins, and what about the rope tension on each team?`),
   [P(`甲隊贏，繩子對甲隊拉力較大`,`A wins; larger tension on team A`),P(`乙隊贏，繩子對兩隊拉力一樣大`,`B wins; rope tension equal for both`),P(`乙隊贏，繩子對乙隊拉力較大`,`B wins; larger tension on team B`),P(`甲隊贏，繩子對兩隊拉力一樣大`,`A wins; rope tension equal for both`)],1,
   P(`最大摩擦力：甲 450 N、乙 900 N，甲先抓不住，乙隊贏；同一條繩子對兩隊拉力永遠相等。`,`Maximum friction: A 450 N, B 900 N, so A slips first and B wins; one rope pulls both teams equally.`),
   P(`比較兩隊腳下的最大摩擦力。`,`Compare the maximum friction under each team.`)),
  Q(P(`質量 50 kg 的人站在電梯體重計上，電梯以 2 m/s² 向下加速（g＝10），讀數與人的質量？`,`A 50 kg person stands on a scale in a lift accelerating downward at 2 m/s² (g = 10). What are the reading and the mass?`),
   [P(`讀數 400 N，質量變成 40 kg`,`Reads 400 N; mass becomes 40 kg`),P(`讀數 600 N，質量仍是 50 kg`,`Reads 600 N; mass still 50 kg`),P(`讀數 500 N，質量仍是 50 kg`,`Reads 500 N; mass still 50 kg`),P(`讀數 400 N，質量仍是 50 kg`,`Reads 400 N; mass still 50 kg`)],3,
   P(`W − N ＝ ma，500 − N ＝ 100，N ＝ 400 N；質量不會改變。`,`W − N = ma, so 500 − N = 100 and N = 400 N; the mass never changes.`),
   P(`向下加速代表合力向下，N 小於 W。`,`Accelerating down means net force down, so N is less than W.`))]
});
})();
