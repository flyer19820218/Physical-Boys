/* Multiple-choice practice for thermo_3.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('thermo_3',{
 '#tab3':[
  Q(P(`200 g 的水從 20°C 加熱到 35°C。水的 S = 1 cal/(g·°C)，水吸收多少熱量？`,`A 200 g sample of water warms from 20°C to 35°C. With S = 1 cal/(g·°C), how much heat does it absorb?`),
   [P(`7000 cal`,`7000 cal`),P(`4000 cal`,`4000 cal`),P(`3000 cal`,`3000 cal`),P(`11000 cal`,`11000 cal`)],2,
   P(`ΔT = 35 − 20 = 15°C，ΔH = M × S × ΔT = 200 × 1 × 15 = 3000 cal。200 代表有 200 個一公克，15 代表每一公克都要連續改變 15°C。7000 是把末溫 35 直接當成 ΔT，4000 是把初溫 20 當成 ΔT。`,`ΔT = 35 − 20 = 15°C, so ΔH = M × S × ΔT = 200 × 1 × 15 = 3000 cal. The 200 means 200 one-gram portions; the 15 means each portion changes through 15°C. 7000 uses the final temperature 35 as ΔT, and 4000 uses the starting temperature 20.`),
   P(`先找 ΔT（末溫 − 初溫），再把 M、S、ΔT 依序放進 ΔH = M × S × ΔT。`,`Find ΔT first (final − initial temperature), then put M, S and ΔT into ΔH = M × S × ΔT.`))]
});
})();
