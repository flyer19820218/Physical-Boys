/* Multiple-choice practice for thermo_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.mode-switch button',keys:["feel","column","scale","fahrenheit","absolute"],before:'footer'});
LQ.addStatic('thermo_1',{
 '#mcq-feel':[
  Q(P(`金屬湯匙和木尺在同一間教室放了一整晚，兩者的溫度是什麼關係？`,`A metal spoon and a wooden ruler sit in the same room all night. How do their temperatures compare?`),
   [P(`金屬溫度較低`,`The metal is much colder`),P(`兩者溫度相同`,`The two are equally warm`),P(`木頭溫度較低`,`The wood is much colder`),P(`金屬溫度較高`,`The metal is much warmer`)],1,
   P(`兩物體在同一環境放得夠久，通常會接近相同溫度，所以兩者溫度相同。`,`Objects left long in one environment reach nearly the same temperature, so the two are equal.`),
   P(`教室的溫度只有一個。`,`The room has just one temperature.`)),
  Q(P(`摸起來金屬比木頭冷，最主要的原因是什麼？`,`Why does metal feel colder to the touch than wood?`),
   [P(`金屬溫度比較低`,`Metal has a lower reading`),P(`金屬會吸收冷氣`,`Metal soaks up cold air`),P(`金屬導熱比較快`,`Metal conducts heat well`),P(`金屬自己會發冷`,`Metal makes its own cold`)],2,
   P(`金屬導熱快，會更快帶走手的能量，因此感覺較冷；皮膚感覺的是熱量傳遞的快慢。`,`Metal conducts heat quickly and carries energy away from the hand faster; skin senses the rate of heat transfer.`),
   P(`手感說的是能量被帶走的快慢。`,`Hand feel reports how fast energy leaves.`)),
  Q(P(`使用接觸式溫度計時，應該怎麼做才正確？`,`What is the correct way to use a contact thermometer?`),
   [P(`等讀值穩定再讀`,`Wait for a steady reading`),P(`一接觸就立刻讀`,`Read the instant it touches`),P(`用手握著測溫球`,`Hold the bulb in your hand`),P(`只憑手感來判斷`,`Judge only by hand feel`)],0,
   P(`溫度計要充分接觸並等它與被測物接近熱平衡、讀值穩定後再判斷。`,`The thermometer must touch well and be read only after it nears thermal equilibrium and settles.`),
   P(`太早讀只是在看尚未穩定的過程。`,`Reading too early shows an unfinished process.`))],
 '#mcq-column':[
  Q(P(`溫度計的紅色液柱為什麼會上升？`,`Why does the red liquid column of a thermometer rise?`),
   [P(`液體變得更重了`,`The liquid gets heavier inside`),P(`玻璃管受熱變細`,`The glass tube gets thinner`),P(`液體受熱體積增大`,`The liquid expands as it warms`),P(`熱本身往上跑出去`,`The heat itself rises upward`)],2,
   P(`液體受熱後體積增大，多出的液體只能沿細管上升，所以液柱上升。`,`Heated liquid expands, and the extra volume can only rise up the narrow tube.`),
   P(`液柱上升是因為液體的體積改變。`,`The column rises because the liquid's volume changes.`)),
  Q(P(`同樣的膨脹量，哪一種玻璃管能讓液柱升得更明顯？`,`For the same expansion, which tube makes the liquid column rise more visibly?`),
   [P(`管徑較粗的粗管`,`The wide thick tube`),P(`兩者一樣明顯`,`Both equally clearly`),P(`都完全看不到`,`Neither shows anything`),P(`管徑較細的細管`,`The narrow thin tube`)],3,
   P(`細管截面積小，同樣的體積變化造成的高度變化較大。`,`A thin tube has a small cross-section, so the same volume change gives a larger rise in height.`),
   P(`同樣的水，倒進細杯和粗杯，哪個水位高？`,`Pour the same water into a thin cup and a wide cup; which level is higher?`)),
  Q(P(`溫度計的讀值什麼時候才能代表被測物的溫度？`,`When does the thermometer reading represent the temperature of the object?`),
   [P(`剛接觸的瞬間`,`At the first touch`),P(`達到熱平衡時`,`In thermal balance`),P(`拿在手上就好`,`Once held in the hand`),P(`液體沸騰了才行`,`Only when it boils`)],1,
   P(`只有溫度計與被測物接近熱平衡，液柱讀值才可代表被測物的溫度。`,`Only when the thermometer and object are near thermal equilibrium does the reading represent the object's temperature.`),
   P(`等讀值穩定的意思是什麼？`,`What does waiting for a steady reading mean?`))],
 '#mcq-scale':[
  Q(P(`0 cm 對應 0°C、10 cm 對應 100°C，每 1 cm 代表幾度？`,`0 cm matches 0°C and 10 cm matches 100°C. How many degrees does each 1 cm stand for?`),
   [P(`每公分 1 度`,`1°C per cm`),P(`每公分 10 度`,`10°C per cm`),P(`每公分 100 度`,`100°C per cm`),P(`每公分 5 度`,`5°C per cm`)],1,
   P(`100°C ÷ 10 cm = 10°C，所以每 1 cm 對應 10°C。`,`100°C ÷ 10 cm = 10°C, so each 1 cm stands for 10°C.`),
   P(`總共 100°C 分成 10 等分。`,`The 100°C is split into 10 equal parts.`)),
  Q(P(`液柱長度 3.7 cm 時，神秘飲料的溫度是多少？`,`The liquid column is 3.7 cm long. What is the temperature of the mystery drink?`),
   [P(`3.7 度`,`3.7°C`),P(`370 度`,`370°C`),P(`27 度`,`27°C`),P(`37 度`,`37°C`)],3,
   P(`3.7 cm × 10°C/cm = 37°C。`,`3.7 cm × 10°C/cm = 37°C.`),
   P(`長度乘以每公分對應的度數。`,`Multiply the length by the degrees per cm.`)),
  Q(P(`為什麼要用冰水和沸水當作溫度計的兩個固定點？`,`Why are ice water and boiling water used as the two fixed points?`),
   [P(`兩者價格便宜好買`,`They are the cheapest liquids`),P(`兩者溫度穩定不變`,`Their temperatures are fixed`),P(`兩者顏色容易分辨`,`Their colors are easy to see`),P(`兩者都能很快冷卻`,`They both cool down quickly`)],1,
   P(`在標準大氣壓下，冰水共存與沸水的溫度固定，可以重複建立相同的刻度。`,`At standard pressure ice water and boiling water have fixed temperatures, so the same scale can be rebuilt every time.`),
   P(`好的標準點必須每次做都一樣。`,`A good reference point must come out the same every time.`))],
 '#mcq-fahrenheit':[
  Q(P(`25°C 換算成華氏溫標是多少？`,`What is 25°C on the Fahrenheit scale?`),
   [P(`57 °F`,`57 °F`),P(`77 °F`,`77 °F`),P(`45 °F`,`45 °F`),P(`98 °F`,`98 °F`)],1,
   P(`°F = °C × 9/5 + 32 = 25 × 1.8 + 32 = 77。`,`°F = °C × 9/5 + 32 = 25 × 1.8 + 32 = 77.`),
   P(`先乘 9/5，再加 32。`,`Multiply by 9/5 first, then add 32.`)),
  Q(P(`把 25°C 改成 77°F 來描述，物體實際的溫度有改變嗎？`,`Describing 25°C as 77°F instead: does the object's actual temperature change?`),
   [P(`變得更熱了`,`It becomes hotter`),P(`沒有任何改變`,`Nothing has changed`),P(`變得更冷了`,`It becomes colder`),P(`數值變成兩倍`,`It doubles in value`)],1,
   P(`溫度沒變，只是描述的溫標不同。`,`The temperature is the same; only the scale used to describe it differs.`),
   P(`換的是溫標，不是物體。`,`What changed is the scale, not the object.`)),
  Q(P(`水的冰點與沸點，用華氏溫標表示分別是多少？`,`On the Fahrenheit scale, what are the freezing and boiling points of water?`),
   [P(`0 °F 與 100 °F`,`0°F and 100°F`),P(`32 °F 與 212 °F`,`32°F and 212°F`),P(`0 °F 與 212 °F`,`0°F and 212°F`),P(`32 °F 與 100 °F`,`32°F and 100°F`)],1,
   P(`水的冰點是 32 °F，沸點是 212 °F。`,`Water freezes at 32 °F and boils at 212 °F.`),
   P(`攝氏的 0 與 100 代入換算公式。`,`Put Celsius 0 and 100 into the conversion formula.`))],
 '#mcq-absolute':[
  Q(P(`絕對零度大約是攝氏幾度？`,`Roughly what is absolute zero in degrees Celsius?`),
   [P(`約 −173 度`,`About −173°C`),P(`約 −373 度`,`About −373°C`),P(`約 −73 度`,`About −73°C`),P(`約 −273 度`,`About −273°C`)],3,
   P(`絕對零度約為 −273.15°C，也就是 0 K。`,`Absolute zero is about −273.15°C, which is 0 K.`),
   P(`K 溫標的 0 對應攝氏的多少度？`,`What Celsius value matches 0 on the Kelvin scale?`)),
  Q(P(`物體的溫度可以一直降低，沒有極限嗎？`,`Can an object keep getting colder without any limit?`),
   [P(`能，可以無限降低`,`Yes, it can fall forever`),P(`能，只要冰箱夠大`,`Yes, with a bigger freezer`),P(`不能，因為會結冰`,`No, because it would freeze`),P(`不能，有最低極限`,`No, there is a lowest limit`)],3,
   P(`溫度有最低極限，就是絕對零度，粒子運動降到最低而不可能更冷。`,`Temperature has a lowest limit, absolute zero, where particle motion is at its minimum.`),
   P(`這一課的標題就是「冷，能不能一直冷下去」。`,`The lesson asks whether cold can go on forever.`)),
  Q(P(`0°C 約等於幾 K（凱氏溫標）？`,`About how many kelvin is 0°C?`),
   [P(`約 273 K`,`About 273 K`),P(`約 173 K`,`About 173 K`),P(`約 373 K`,`About 373 K`),P(`約 −273 K`,`About −273 K`)],0,
   P(`K = °C + 273，所以 0°C 約為 273 K。`,`K = °C + 273, so 0°C is about 273 K.`),
   P(`凱氏溫度沒有負值。`,`Kelvin temperatures are never negative.`))]
});
})();
