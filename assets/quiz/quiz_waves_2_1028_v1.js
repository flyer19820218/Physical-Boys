/* Multiple-choice practice for waves_2.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('waves_2',{
 '#quiz-section-tab1':[
  Q(P(`有個波動，頻率是 12 次/秒 (Hz)，波長是 12 cm，請問波速是多少？`,`A wave has a frequency of 12 Hz and a wavelength of 12 cm. What is the wave speed?`),
   [P(`24 cm/s`,`24 cm/s`),P(`288 cm/s`,`288 cm/s`),P(`12 cm/s`,`12 cm/s`),P(`144 cm/s`,`144 cm/s`)],3,
   P(`v = f × λ = 12 × 12 = 144 cm/s。每秒有 12 個波通過，每個波長 12 cm，一秒就走了 144 cm。`,`v = f × λ = 12 × 12 = 144 cm/s. Twelve waves pass each second and each is 12 cm long, so the wave travels 144 cm in one second.`),
   P(`波速 = 頻率 × 波長。每秒有幾個波？每個波有多長？`,`Wave speed = frequency × wavelength. How many waves per second, and how long is each?`)),
  Q(P(`有個彈簧波，波速是 120 cm/s，週期是 1/4 秒，請問該彈簧波的波長是多少？`,`A spring wave has a speed of 120 cm/s and a period of 1/4 s. What is its wavelength?`),
   [P(`30 cm`,`30 cm`),P(`480 cm`,`480 cm`),P(`120 cm`,`120 cm`),P(`4 cm`,`4 cm`)],0,
   P(`頻率 f = 1 ÷ (1/4) = 4 Hz，波長 λ = v ÷ f = 120 ÷ 4 = 30 cm。`,`The frequency is f = 1 ÷ (1/4) = 4 Hz, so the wavelength is λ = v ÷ f = 120 ÷ 4 = 30 cm.`),
   P(`週期是 1/4 秒，頻率是多少？再用 λ = v ÷ f 算波長。`,`The period is 1/4 s, so what is the frequency? Then use λ = v ÷ f.`))],
 '#quiz-section-tab3':[
  Q(P(`空氣中的聲速可用公式 v = 331 + 0.6 × t 計算（t 是氣溫，單位 °C）。氣溫 15°C 時，聲速約是多少？`,`The speed of sound in air is v = 331 + 0.6 × t (t is the temperature in °C). What is the speed of sound at 15°C?`),
   [P(`340 m/s`,`340 m/s`),P(`346 m/s`,`346 m/s`),P(`322 m/s`,`322 m/s`),P(`421 m/s`,`421 m/s`)],0,
   P(`v = 331 + 0.6 × 15 = 331 + 9 = 340 m/s。`,`v = 331 + 0.6 × 15 = 331 + 9 = 340 m/s.`),
   P(`把 t = 15 代進公式：先算 0.6 × 15，再加上 331。`,`Put t = 15 into the formula: work out 0.6 × 15 first, then add 331.`))]
});
})();
