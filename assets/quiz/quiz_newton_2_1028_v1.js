/* Multiple-choice practice for newton_2.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('newton_2',{
 '#panel-tab6':[
  Q(P(`紙帶每 5 點取一段（T＝1/12 s），相鄰兩段長 4.0 cm 與 6.5 cm，滑車加速度是多少？`,`On a tape, every 5 dots form a segment (T = 1/12 s). Adjacent segments are 4.0 cm and 6.5 cm long. What is the cart’s acceleration?`),
   [P(`2.5 m/s²`,`2.5 m/s²`),P(`0.36 m/s²`,`0.36 m/s²`),P(`6.5 m/s²`,`6.5 m/s²`),P(`3.6 m/s²`,`3.6 m/s²`)],3,
   P(`Δs ＝ 2.5 cm ＝ 0.025 m，a ＝ Δs ÷ T² ＝ 0.025 × 144 ＝ 3.6 m/s²。`,`Δs = 2.5 cm = 0.025 m, so a = Δs ÷ T² = 0.025 × 144 = 3.6 m/s².`),
   P(`a ＝ Δs ÷ T²，記得先把 cm 換成 m。`,`a = Δs ÷ T²; convert cm to m first.`)),
  Q(P(`實驗時為何要把砝碼從滑車「移到」吊掛盤，而不是另外加新砝碼？`,`Why are masses moved from the cart to the hanger instead of adding new masses?`),
   [P(`要讓拉力的大小一直不變`,`To keep the pulling force fixed`),P(`要讓摩擦力變得完全為零`,`To make friction become zero`),P(`要讓紙帶打出更多的點`,`To get more dots on the tape`),P(`要讓被拉動的總質量不變`,`To keep the total mass fixed`)],3,
   P(`總質量不變，只有拉力 F 改變，才能單獨看出 a ∝ F。`,`With the total mass fixed, only F changes, so a ∝ F can be seen on its own.`),
   P(`控制變因：F 與 m 不能同時改變。`,`Control variables: F and m must not change together.`)),
  Q(P(`由 a–F 圖讀得 F ＝ 2.0 N 時 a ＝ 2.5 m/s²，被拉動的總質量是多少？`,`From an a–F graph, F = 2.0 N gives a = 2.5 m/s². What is the total mass being pulled?`),
   [P(`5.0 kg`,`5.0 kg`),P(`1.25 kg`,`1.25 kg`),P(`0.5 kg`,`0.5 kg`),P(`0.8 kg`,`0.8 kg`)],3,
   P(`m ＝ F ÷ a ＝ 2.0 ÷ 2.5 ＝ 0.8 kg。`,`m = F ÷ a = 2.0 ÷ 2.5 = 0.8 kg.`),
   P(`把 F ＝ ma 移項成 m ＝ F ÷ a。`,`Rearrange F = ma into m = F ÷ a.`)),
  Q(P(`5 顆砝碼全掛時 a ＝ 5.0 m/s²；移 2 顆回滑車、其餘不變，新的 a 是多少？`,`With all 5 masses hung, a = 5.0 m/s². Two are moved back onto the cart. What is the new a?`),
   [P(`3.0 m/s²`,`3.0 m/s²`),P(`2.0 m/s²`,`2.0 m/s²`),P(`2.5 m/s²`,`2.5 m/s²`),P(`4.0 m/s²`,`4.0 m/s²`)],0,
   P(`總質量不變，拉力變成 3/5，所以 a ＝ 5.0 × 3/5 ＝ 3.0 m/s²。`,`Total mass is unchanged and the pull becomes 3/5, so a = 5.0 × 3/5 = 3.0 m/s².`),
   P(`m 不變時 a 與 F 成正比。`,`With m fixed, a is proportional to F.`)),
  Q(P(`總質量 500 g，吊掛盤掛 100 g 砝碼，取 g ＝ 10 m/s²、不計摩擦，加速度是多少？`,`Total mass 500 g, with a 100 g mass on the hanger, g = 10 m/s², no friction. What is the acceleration?`),
   [P(`2.0 m/s²`,`2.0 m/s²`),P(`0.2 m/s²`,`0.2 m/s²`),P(`5.0 m/s²`,`5.0 m/s²`),P(`1.7 m/s²`,`1.7 m/s²`)],0,
   P(`F ＝ 0.1 × 10 ＝ 1.0 N，m ＝ 0.5 kg，a ＝ 1.0 ÷ 0.5 ＝ 2.0 m/s²。`,`F = 0.1 × 10 = 1.0 N, m = 0.5 kg, so a = 1.0 ÷ 0.5 = 2.0 m/s².`),
   P(`質量要先換成 kg。`,`Convert masses to kg first.`))]
});
})();
