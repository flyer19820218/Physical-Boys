/* Multiple-choice practice for thermo_2.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('thermo_2',{
 '#tab1':[
  Q(P(`兩個溫度不同的物體接觸時，熱量會怎麼傳遞？`,`When two objects at different temperatures touch, which way does heat flow?`),
   [P(`由低溫傳向高溫`,`From cold to hot`),P(`由大物傳向小物`,`From big to small`),P(`由高溫傳向低溫`,`From hot to cold`),P(`由重物傳向輕物`,`From heavy to light`)],2,
   P(`熱量永遠由溫度較高的一方傳向溫度較低的一方，方向看溫度，不看大小或輕重。`,`Heat always flows from the hotter side to the cooler side; the direction depends on temperature, not size or weight.`),
   P(`方向看溫度。`,`Direction depends on temperature.`)),
  Q(P(`在傳熱過程中把兩杯水分開，會發生什麼事？`,`What happens if the two cups of water are separated during heat transfer?`),
   [P(`熱傳遞仍會繼續`,`Heat keeps flowing on`),P(`熱傳遞立刻停止`,`Heat flow stops at once`),P(`溫度繼續趨於相等`,`The water keeps equalizing`),P(`兩杯水互相吸引`,`The cups pull each other`)],1,
   P(`這個模型需要接觸才傳熱，分開後接觸面消失，傳熱立即停止，兩杯水溫度不再改變。`,`This model needs contact to transfer heat; once separated the contact surface is gone, heat flow stops and the temperatures stay put.`),
   P(`按「分開兩杯水」，看橘色光點有沒有繼續。`,`Press "separate" and see whether the orange dots continue.`)),
  Q(P(`「熱平衡」是什麼意思？`,`What does "thermal equilibrium" mean?`),
   [P(`兩者同溫無淨傳熱`,`Equal temperature, no flow`),P(`兩者熱量完全相等`,`Equal amounts of heat stored`),P(`兩者質量變成相等`,`Equal masses in both cups`),P(`兩者體積變成相等`,`Equal volumes in both cups`)],0,
   P(`熱平衡是兩物體達到相同溫度，沒有淨熱量傳遞的狀態。`,`Thermal equilibrium means two objects reach the same temperature with no net heat transfer.`),
   P(`判斷熱平衡看的是溫度。`,`Equilibrium is judged by temperature.`))],
 '#tab2':[
  Q(P(`卡路里（cal）是怎麼定義的？`,`How is the calorie (cal) defined?`),
   [P(`2 g 水升高 1°C 所吸收的熱量`,`Warms 2 g of water by 1°C`),P(`1 g 水升高 2°C 所吸收的熱量`,`Warms 1 g of water by 2°C`),P(`2 g 水升高 2°C 所吸收的熱量`,`Warms 2 g of water by 2°C`),P(`1 g 水升高 1°C 所吸收的熱量`,`Warms 1 g of water by 1°C`)],3,
   P(`使 1 g 水升高 1°C 所吸收的熱量，定為 1 cal。`,`The heat that raises 1 g of water by 1°C is defined as 1 cal.`),
   P(`定義用的是最小的量：1 g 與 1°C。`,`The definition uses the smallest amounts: 1 g and 1°C.`)),
  Q(P(`食品包裝上的 1 大卡（kcal）等於多少 cal？`,`How many cal is 1 kcal on a food label?`),
   [P(`100 cal`,`100 cal`),P(`500 cal`,`500 cal`),P(`1000 cal`,`1000 cal`),P(`1100 cal`,`1100 cal`)],2,
   P(`1 kcal = 1000 cal。`,`1 kcal = 1000 cal.`),
   P(`千就是 1000 倍。`,`Kilo means a thousand times.`)),
  Q(P(`20°C 的 1 g 水吸收 1 cal 後，溫度變成多少？`,`1 g of water at 20°C absorbs 1 cal. What is its new temperature?`),
   [P(`22°C`,`22°C`),P(`20°C`,`20°C`),P(`21°C`,`21°C`),P(`19°C`,`19°C`)],2,
   P(`1 cal 剛好讓 1 g 水升高 1°C，所以變成 21°C。`,`1 cal raises 1 g of water by exactly 1°C, giving 21°C.`),
   P(`這就是 1 cal 的定義。`,`That is the definition of 1 cal.`))],
 '#tab3':[
  Q(P(`200 g 的水升高 10°C，需要吸收多少熱量（Q = m × ΔT）？`,`How much heat must 200 g of water absorb to rise by 10°C (Q = m × ΔT)?`),
   [P(`1000 cal`,`1000 cal`),P(`2000 cal`,`2000 cal`),P(`200 cal`,`200 cal`),P(`210 cal`,`210 cal`)],1,
   P(`Q = 200 × 10 = 2000 cal。`,`Q = 200 × 10 = 2000 cal.`),
   P(`質量乘以溫度變化。`,`Multiply mass by the temperature change.`)),
  Q(P(`溫度變化不變，水的質量變成 5 倍，吸收的熱量 Q 會怎樣？`,`The temperature change stays the same and the water mass becomes 5 times. What happens to Q?`),
   [P(`變成 25 倍`,`25 times as much`),P(`變成 10 倍`,`10 times as much`),P(`仍然不變`,`Stays unchanged`),P(`變成 5 倍`,`5 times as much`)],3,
   P(`Q 與質量成正比，質量變 5 倍，Q 也變 5 倍。`,`Q is proportional to mass, so 5 times the mass gives 5 times Q.`),
   P(`Q = m × ΔT 是乘法關係。`,`Q = m × ΔT is a product.`)),
  Q(P(`簡式 Q = m × ΔT（單位 cal）適用在哪裡？`,`Where can the simple formula Q = m × ΔT (in cal) be used?`),
   [P(`適用所有物質`,`For every material`),P(`只適用於金屬`,`Only for metals`),P(`只能用在水上`,`Only for water`),P(`只適用於氣體`,`Only for gases`)],2,
   P(`這個簡式限定用在水，不能直接套用所有物質。`,`This simple form is limited to water and cannot be applied directly to every substance.`),
   P(`1 cal 是用水來定義的。`,`The cal is defined using water.`))],
 '#tab4':[
  Q(P(`80°C 與 20°C 的水質量相同，混合後的最終溫度是多少？`,`Equal masses of water at 80°C and 20°C are mixed. What is the final temperature?`),
   [P(`60°C`,`60°C`),P(`50°C`,`50°C`),P(`40°C`,`40°C`),P(`70°C`,`70°C`)],1,
   P(`同物質、質量相同，最終溫度在正中間：(80 + 20) ÷ 2 = 50°C。`,`Same material and equal mass settle at the midpoint: (80 + 20) ÷ 2 = 50°C.`),
   P(`質量相同，取平均。`,`Equal masses, so take the average.`)),
  Q(P(`混合兩份水時，質量較大的一方會讓最終溫度怎樣？`,`When two portions of water mix, how does the larger mass affect the final temperature?`),
   [P(`拉向對方初溫`,`Toward the other start`),P(`固定在正中間`,`Fixed at the midpoint`),P(`拉向零度`,`Toward zero degrees`),P(`拉向自己初溫`,`Toward its own start`)],3,
   P(`質量較大的一方會把交點拉向自己的初溫。`,`The larger mass pulls the meeting point toward its own starting temperature.`),
   P(`質量大的一方比較「頑固」。`,`The larger mass is harder to change.`)),
  Q(P(`在隔熱系統中，高溫物體與低溫物體的熱量關係是什麼？`,`In an insulated system, how does the heat given by the hot object relate to the heat taken by the cold one?`),
   [P(`放出的熱大於吸收的`,`Heat lost exceeds heat gained`),P(`放出的熱等於吸收的`,`Heat lost equals heat absorbed`),P(`放出的熱小於吸收的`,`Heat lost is below heat gained`),P(`放出與吸收都為零`,`Heat lost and gained are zero`)],1,
   P(`隔熱系統中，高溫物體放熱 = 低溫物體吸熱，能量守恆。`,`In an insulated system the heat released by the hot object equals the heat absorbed by the cold one: energy is conserved.`),
   P(`能量不會憑空消失。`,`Energy does not vanish.`))]
});
})();
