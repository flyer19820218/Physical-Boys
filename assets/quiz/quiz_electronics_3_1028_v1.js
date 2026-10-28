/* Multiple-choice practice for electronics_3.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('electronics_3',{
 '#t1-quiz-container':[
  Q(P(`站在導線旁計時，2 秒內共有 10 庫侖的電量通過截面，電流是多少安培？`,`Timed beside a wire, 10 coulombs pass a cross-section in 2 seconds. What is the current in amperes?`),
   [P(`20 A`,`20 A`),P(`0.2 A`,`0.2 A`),P(`8 A`,`8 A`),P(`5 A`,`5 A`)],3,
   P(`I ＝ Q ÷ t ＝ 10 ÷ 2 ＝ 5 A。`,`I = Q ÷ t = 10 ÷ 2 = 5 A.`),
   P(`套用 I ＝ Q ÷ t，電量除以時間。`,`Use I = Q ÷ t: charge divided by time.`)),
  Q(P(`導線上的電流是 3 A，通電 1 分鐘，總共有多少庫侖的電量流過？`,`A wire carries 3 A for 1 minute. How many coulombs of charge flow through it?`),
   [P(`360 C`,`360 C`),P(`18 C`,`18 C`),P(`63 C`,`63 C`),P(`180 C`,`180 C`)],3,
   P(`1 分鐘 ＝ 60 秒，Q ＝ I × t ＝ 3 × 60 ＝ 180 C。`,`1 minute = 60 s, so Q = I × t = 3 × 60 = 180 C.`),
   P(`先把分鐘換成秒。`,`Convert minutes to seconds first.`)),
  Q(P(`1 個電子的電量約 1.6 × 10⁻¹⁹ C。電流 1 A 時，1 秒內約有多少個電子通過？`,`One electron carries about 1.6 × 10⁻¹⁹ C. At 1 A, roughly how many electrons pass in 1 second?`),
   [P(`約 1.6 × 10⁻¹⁹ 個`,`About 1.6 × 10⁻¹⁹`),P(`約 1.6 × 10¹⁹ 個`,`About 1.6 × 10¹⁹`),P(`約 6.25 × 10¹⁹ 個`,`About 6.25 × 10¹⁹`),P(`約 6.25 × 10¹⁸ 個`,`About 6.25 × 10¹⁸`)],3,
   P(`1 C 除以單一電子電量：1 ÷ (1.6 × 10⁻¹⁹) ≈ 6.25 × 10¹⁸ 個。`,`1 C divided by one electron’s charge: 1 ÷ (1.6 × 10⁻¹⁹) ≈ 6.25 × 10¹⁸.`),
   P(`用 1 庫侖除以單一電子的電量。`,`Divide 1 coulomb by the charge of one electron.`)),
  Q(P(`電流 0.5 A，通電 10 秒，通過導線的電量是多少庫侖？`,`A current of 0.5 A flows for 10 seconds. How much charge passes through the wire?`),
   [P(`20 C`,`20 C`),P(`50 C`,`50 C`),P(`2 C`,`2 C`),P(`5 C`,`5 C`)],3,
   P(`Q ＝ I × t ＝ 0.5 × 10 ＝ 5 C。`,`Q = I × t = 0.5 × 10 = 5 C.`),
   P(`Q ＝ I × t。`,`Q = I × t.`))],
 '#t2-quiz-container':[
  Q(P(`兩個不同的燈泡串聯，通過第一個燈泡的電流是 2 A，通過第二個燈泡的電流是多少？`,`Two different bulbs are in series. The first carries 2 A. What current does the second carry?`),
   [P(`4 A`,`4 A`),P(`1 A`,`1 A`),P(`0 A`,`0 A`),P(`2 A`,`2 A`)],3,
   P(`串聯電路只有一條路徑，電流處處相等，所以還是 2 A。`,`A series circuit has one path, so the current is the same everywhere: 2 A.`),
   P(`串聯沒有分岔。`,`A series circuit has no branches.`)),
  Q(P(`兩個燈泡串聯接在 9 V 電池上，第一個燈泡電壓是 4 V，第二個燈泡的電壓是多少？`,`Two bulbs in series across a 9 V battery. The first has 4 V. What is the voltage across the second?`),
   [P(`5 V`,`5 V`),P(`13 V`,`13 V`),P(`4 V`,`4 V`),P(`9 V`,`9 V`)],0,
   P(`串聯總電壓等於各負載電壓之和，V₂ ＝ 9 − 4 ＝ 5 V。`,`Series voltages add up to the source voltage: V₂ = 9 − 4 = 5 V.`),
   P(`V ＝ V₁ ＋ V₂。`,`V = V₁ + V₂.`)),
  Q(P(`三個相同的燈泡串聯接在 12 V 電池上，總電流 1 A。每個燈泡的電壓與通過電流為何？`,`Three identical bulbs in series across 12 V, total current 1 A. What are each bulb’s voltage and current?`),
   [P(`每個 4 V，電流 1 A`,`Each 4 V, current 1 A`),P(`每個 4 V，電流 3 A`,`Each 4 V, current 3 A`),P(`每個 12 V，電流 1 A`,`Each 12 V, current 1 A`),P(`每個 3 V，電流 4 A`,`Each 3 V, current 4 A`)],0,
   P(`相同燈泡均分總電壓 12 ÷ 3 ＝ 4 V；串聯電流處處相等，仍是 1 A。`,`Identical bulbs share 12 ÷ 3 = 4 V each; the series current is 1 A everywhere.`),
   P(`均分電壓，電流不變。`,`Voltage is shared; the current stays the same.`)),
  Q(P(`兩個電阻串聯，總電壓 12 V、總電流 2 A，總電阻是多少？`,`Two resistors in series: total voltage 12 V, total current 2 A. What is the total resistance?`),
   [P(`6 Ω`,`6 Ω`),P(`24 Ω`,`24 Ω`),P(`10 Ω`,`10 Ω`),P(`4 Ω`,`4 Ω`)],0,
   P(`R ＝ V ÷ I ＝ 12 ÷ 2 ＝ 6 Ω。`,`R = V ÷ I = 12 ÷ 2 = 6 Ω.`),
   P(`用歐姆定律 R ＝ V ÷ I。`,`Use Ohm’s law R = V ÷ I.`))],
 '#t3-quiz-container':[
  Q(P(`兩個不同的燈泡並聯接在 3 V 電池上，兩個燈泡兩端的電壓各是多少？`,`Two different bulbs are in parallel across a 3 V battery. What is the voltage across each?`),
   [P(`兩個都是 6 V`,`Both are 6 V`),P(`各是 1.5 V`,`Each is 1.5 V`),P(`兩個都是 3 V`,`Both are 3 V`),P(`兩個都是 9 V`,`Both are 9 V`)],2,
   P(`並聯各分支都直接跨接在電源兩端，電壓都等於 3 V。`,`Each parallel branch connects straight across the source, so each has 3 V.`),
   P(`並聯各分支都接在電源兩端。`,`Each branch connects across the source.`)),
  Q(P(`兩個燈泡並聯，總電流 5 A，通過第一個燈泡的電流 2 A，第二個燈泡的電流是多少？`,`Two bulbs in parallel draw 5 A in total, 2 A through the first. What is the current in the second?`),
   [P(`7 A`,`7 A`),P(`2 A`,`2 A`),P(`3 A`,`3 A`),P(`10 A`,`10 A`)],2,
   P(`I ＝ I₁ ＋ I₂，所以 I₂ ＝ 5 − 2 ＝ 3 A。`,`I = I₁ + I₂, so I₂ = 5 − 2 = 3 A.`),
   P(`總電流在節點分流。`,`The total current splits at the junction.`)),
  Q(P(`三個相同電阻並聯，每個電阻的電流都是 2 A，電池 6 V。總電流與每個電阻的電壓為何？`,`Three identical resistors in parallel each carry 2 A on a 6 V battery. What are the total current and each resistor’s voltage?`),
   [P(`總電流 2 A，各 6 V`,`Total 2 A, each 6 V`),P(`總電流 6 A，各 2 V`,`Total 6 A, each 2 V`),P(`總電流 6 A，各 6 V`,`Total 6 A, each 6 V`),P(`總電流 3 A，各 2 V`,`Total 3 A, each 2 V`)],2,
   P(`總電流為各支路電流之和 2 × 3 ＝ 6 A；各支路電壓都等於電源電壓 6 V。`,`Total current is the sum of branches, 2 × 3 = 6 A; each branch has the source voltage, 6 V.`),
   P(`電流相加，電壓相同。`,`Currents add; voltages are equal.`)),
  Q(P(`兩個電阻並聯接在 12 V 電池上，兩條支路電流分別是 3 A 與 1 A，總電流是多少？`,`Two resistors in parallel across 12 V carry 3 A and 1 A. What is the total current?`),
   [P(`4 A`,`4 A`),P(`3 A`,`3 A`),P(`2 A`,`2 A`),P(`12 A`,`12 A`)],0,
   P(`總電流為支路電流相加：3 ＋ 1 ＝ 4 A。`,`Total current is the sum of the branches: 3 + 1 = 4 A.`),
   P(`並聯時支路電流相加。`,`Branch currents add in parallel.`))]
});
})();
