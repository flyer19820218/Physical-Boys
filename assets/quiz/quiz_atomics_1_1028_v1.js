/* Multiple-choice practice for atomics_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('atomics_1',{
 '.wrap > .panel:nth-child(3)':[
  Q(P(`下列哪一項是純物質？`,`Which of the following is a pure substance?`),
   [P(`食鹽水溶液`,`Salt water mix`),P(`氧氣 O₂`,`Oxygen gas (O₂)`),P(`空氣的氣體`,`Air from outside`),P(`醬油調味料`,`Soy sauce blend`)],1,
   P(`純物質只含一種物質，有固定組成；氧氣是純物質，食鹽水、空氣、醬油都是混合物。`,`A pure substance contains one substance with a fixed makeup; oxygen is pure, while salt water, air and soy sauce are mixtures.`),
   P(`純物質的組成固定。`,`A pure substance has a fixed makeup.`)),
  Q(P(`拉瓦節讓水蒸氣通過燒紅的鐵槍管，結果說明什麼？`,`Lavoisier passed steam through a red-hot iron gun barrel. What did the result show?`),
   [P(`水是不可分的元素`,`Water is a basic element`),P(`鐵能夠變成了水`,`Iron can turn into water`),P(`水蒸氣變成了空氣`,`Steam turns into plain air`),P(`水可以再被拆開`,`Water can be broken down`)],3,
   P(`水蒸氣經過鐵槍管後生成氫氣，鐵片變重（生成氧化物），說明水是可以再分解的。`,`The steam produced hydrogen while the iron gained mass as an oxide, showing water can be broken down further.`),
   P(`古希臘人以為水是最基本的元素。`,`The ancient Greeks thought water was a basic element.`)),
  Q(P(`電解水時，正負極收集到的氣體體積比大約是多少？`,`When water is electrolyzed, what is the approximate volume ratio of the gases collected?`),
   [P(`氫氣：氧氣 ＝ 2：1`,`H₂ : O₂ = 2 : 1`),P(`氫氣：氧氣 ＝ 1：2`,`H₂ : O₂ = 1 : 2`),P(`氫氣：氧氣 ＝ 1：1`,`H₂ : O₂ = 1 : 1`),P(`氫氣：氧氣 ＝ 3：1`,`H₂ : O₂ = 3 : 1`)],0,
   P(`水（H₂O）中氫與氧的原子數比是 2：1，所以收集到的氫氣體積約為氧氣的兩倍。`,`Water H₂O has hydrogen and oxygen atoms in the ratio 2 : 1, so the hydrogen volume is about twice the oxygen volume.`),
   P(`看看 H₂O 的化學式。`,`Look at the formula H₂O.`))],
 '.wrap > .panel:nth-child(4)':[
  Q(P(`元素符號的第一個字母要如何書寫？`,`How is the first letter of an element symbol written?`),
   [P(`以小寫字母書寫`,`As a lowercase letter`),P(`大小寫都可以`,`Either case is fine`),P(`以大寫字母書寫`,`As a capital letter`),P(`以數字代替字母`,`A number in its place`)],2,
   P(`元素符號第一個字母大寫，若有第二個字母則小寫，例如 Ca、Cl、Cu。`,`The first letter is capitalized and any second letter is lowercase, e.g. Ca, Cl, Cu.`),
   P(`例：C、O、Ca。`,`Examples: C, O, Ca.`)),
  Q(P(`中文元素名稱帶「氵」部首，通常是什麼狀態？`,`A Chinese element name with the water radical usually describes what state?`),
   [P(`常溫下為固態`,`A solid at room temp`),P(`常溫下為氣態`,`A gas at room temp`),P(`常溫下為液態`,`A liquid at room temp`),P(`常溫下為電漿態`,`A plasma at room temp`)],2,
   P(`「水」部（如溴）表示常溫液態，「气」部是氣態，「金」「石」部是固態。`,`The water radical (e.g. bromine) marks a room-temperature liquid; the gas radical marks gases, and metal or stone radicals mark solids.`),
   P(`想想溴 Br₂。`,`Think of bromine, Br₂.`)),
  Q(P(`下列哪一種金屬在常溫下是液態？`,`Which metal is a liquid at room temperature?`),
   [P(`鈦（Ti）`,`Titanium (Ti)`),P(`汞（Hg）`,`Mercury (Hg)`),P(`銅（Cu）`,`Copper (Cu)`),P(`銀（Ag）`,`Silver (Ag)`)],1,
   P(`汞（水銀）是常溫常壓下唯一的液態金屬。`,`Mercury is the only metal that is liquid at room temperature and pressure.`),
   P(`名字不是「金」部的那一個。`,`The one whose name lacks the metal radical.`))],
 '.wrap > .panel:nth-child(5)':[
  Q(P(`導電性最好的金屬是哪一種？`,`Which metal is the best conductor of electricity?`),
   [P(`銅（Cu）`,`Copper (Cu)`),P(`銀（Ag）`,`Silver (Ag)`),P(`金（Au）`,`Gold (Au)`),P(`鐵（Fe）`,`Iron (Fe)`)],1,
   P(`導電性前三名依序是銀、銅、金；電線用銅是因為價格便宜。`,`The top three conductors are silver, copper, gold; copper is used for wires because it is much cheaper.`),
   P(`第一名比銅還好。`,`Better than copper.`)),
  Q(P(`延展性最佳的金屬是什麼？`,`Which metal is the most ductile and malleable?`),
   [P(`鐵（Fe）`,`Iron (Fe)`),P(`鉛（Pb）`,`Lead (Pb)`),P(`錫（Sn）`,`Tin (Sn)`),P(`金（Au）`,`Gold (Au)`)],3,
   P(`金的延展性最好，一克純金可拉出數公里的細絲或打成極薄的金箔。`,`Gold is the most ductile metal; one gram can be drawn into a wire kilometers long or beaten into very thin foil.`),
   P(`可以打成極薄的金箔。`,`It can be beaten into thin foil.`)),
  Q(P(`熔點最高的金屬是哪一種？`,`Which metal has the highest melting point?`),
   [P(`鎢（W）`,`Tungsten (W)`),P(`鉀（K）`,`Potassium (K)`),P(`鈾（U）`,`Uranium (U)`),P(`鈣（Ca）`,`Calcium (Ca)`)],0,
   P(`鎢的熔點高達 3415 °C，早期被用來做白熾燈泡的燈絲。`,`Tungsten melts at 3415 °C and was long used for incandescent bulb filaments.`),
   P(`適合當燈絲的金屬。`,`A metal suited to bulb filaments.`))],
 '.wrap > .panel:nth-child(6)':[
  Q(P(`下列哪一種非金屬固體可以導電？`,`Which non-metal solid can conduct electricity?`),
   [P(`硫粉（S）`,`Sulfur powder (S)`),P(`磷（P）`,`Phosphorus (P)`),P(`石墨（碳）`,`Graphite (carbon)`),P(`鑽石（碳）`,`Diamond (carbon)`)],2,
   P(`石墨是唯一能導電的非金屬固體，常用作電極與鉛筆芯；鑽石雖然也是碳卻不導電。`,`Graphite is the only non-metal solid that conducts and is used for electrodes and pencil lead; diamond is carbon too but does not conduct.`),
   P(`鉛筆芯的材料。`,`The material of pencil lead.`)),
  Q(P(`常溫下唯一呈液態的非金屬元素是哪一種？`,`Which non-metal element is the only liquid at room temperature?`),
   [P(`氯（Cl₂）`,`Chlorine (Cl₂)`),P(`碘（I₂）`,`Iodine (I₂)`),P(`汞（Hg）`,`Mercury (Hg)`),P(`溴（Br₂）`,`Bromine (Br₂)`)],3,
   P(`溴是常溫常壓下唯一的液態非金屬，呈暗紅色，易揮發。`,`Bromine is the only liquid non-metal at room conditions; it is dark red and evaporates easily.`),
   P(`名字有「水」部。`,`Its name carries the water radical.`)),
  Q(P(`地殼中含量最豐富的元素是哪一種？`,`Which element is the most abundant in the Earth's crust?`),
   [P(`氫（H）`,`Hydrogen (H)`),P(`碳（C）`,`Carbon (C)`),P(`氮（N）`,`Nitrogen (N)`),P(`氧（O）`,`Oxygen (O)`)],3,
   P(`地殼中含量最多的元素是氧，約占總質量的 46%。`,`Oxygen is the most abundant element in the crust, about 46% of its mass.`),
   P(`它也是空氣中第二多的氣體。`,`It is also the second most common gas in air.`))]
});
})();
