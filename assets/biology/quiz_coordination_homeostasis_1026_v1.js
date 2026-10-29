/* Multiple-choice checks for the five coordination / homeostasis lessons that used to end a tab with an observation-note box, 2026-10-26.
 * Each bank covers only the tab that carried the old box (endocrine: glucose, glucose_homeostasis: balance, nervous: reaction,
 * respiration: evidence, responses: boxes). Same pattern as the reproduction banks: question, hint (shown when wrong), answer. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ)return;const {P,Q}=LQ;
LQ.add('endocrine',{
 glucose:[
  Q(P(`吃完飯後血糖偏高，身體主要增加哪一種激素？`,`Blood glucose is high after a meal. Which hormone does the body mainly increase?`),
   [P(`升糖素，讓肝臟釋出更多葡萄糖`,`Glucagon, making the liver release more glucose`),P(`兩種激素都完全不會有任何變化`,`Neither hormone changes at all, both stay level`),P(`胰島素，使細胞利用並儲存葡萄糖`,`Insulin, helping cells to use and store glucose`),P(`兩種激素同時大量增加，彼此抵銷`,`Both hormones rise a lot together and cancel out`)],2,
   P(`血糖偏高時，胰島素增加，促進細胞利用或儲存葡萄糖，使血糖下降。`,`When glucose is high, insulin rises and promotes glucose use or storage, so glucose falls.`),
   P(`把「情境」切到「餐後偏高」，看血糖往哪個方向走。`,`Set "Situation" to "High after meal" and watch which way glucose goes.`)),
  Q(P(`長時間沒吃東西、血糖偏低時，升糖素促進什麼？`,`When you have not eaten for a long time and glucose is low, what does glucagon promote?`),
   [P(`血糖無限制地上升，直到超出身體範圍`,`Blood glucose rises without limit until it leaves the range`),P(`肝臟把肝糖分解，釋出葡萄糖到血液`,`The liver breaks down stored glycogen, and releases glucose`),P(`胰島素被升糖素直接消滅，不再作用`,`Insulin is destroyed by glucagon and so stops acting at all`),P(`全身細胞把血液中的葡萄糖儲存起來`,`Cells all over the body store away the glucose in the blood`)],1,
   P(`升糖素促進肝臟分解肝糖並釋出葡萄糖；兩種激素不是互相消滅，而是方向相反地協調。`,`Glucagon promotes liver glycogen breakdown and glucose release; the two hormones do not destroy each other, they act in opposite directions in coordination.`),
   P(`把「情境」切到「空腹偏低」，再按「重播調節」。`,`Set "Situation" to "Low during fasting" and press "Replay regulation".`)),
  Q(P(`血糖回到相對基準時，促使該激素增加的刺激會怎樣？`,`When glucose returns near the reference level, what happens to the stimulus that raised the hormone?`),
   [P(`越來越強，激素也越來越多`,`It gets stronger and the hormone keeps rising`),P(`漸漸減弱，激素也跟著減少`,`It weakens, and the hormone level falls with it`),P(`先完全消失，之後再突然暴增`,`It vanishes completely and then suddenly surges`),P(`和血糖的高低完全沒有關係`,`It has nothing to do with the level of glucose`)],1,
   P(`偏差縮小後，刺激減弱，激素也隨之減少，血糖才會穩定，而不是一直上升或下降。`,`As the imbalance shrinks, the stimulus weakens and the hormone falls, so glucose stabilizes instead of rising or dropping without limit.`),
   P(`先選你的預測，再看說明文字。`,`Pick a prediction first, then read the caption.`))]
});
LQ.add('glucose_homeostasis',{
 balance:[
  Q(P(`血糖偏高時，主要的回應是什麼？`,`When glucose is high, what is the main response?`),
   [P(`肝臟把肝糖分解，釋出更多葡萄糖`,`The liver breaks down glycogen to release more glucose`),P(`促進細胞攝取、利用與儲存葡萄糖`,`Promote glucose uptake, use and storage by the cells`),P(`身體完全不做任何調節，順其自然`,`The body does no regulating at all and lets it be`),P(`讓血糖繼續升高，直到自己慢慢回復`,`Let glucose keep rising until it falls back by itself`)],1,
   P(`偏高時，胰島素促進細胞攝取和儲存，使血糖回到適當範圍。`,`For high glucose, insulin promotes uptake and storage, returning glucose toward the range.`),
   P(`把「情境」切到「血糖偏高」，選「促進利用與儲存」，看血糖計。`,`Set "Situation" to "High glucose", choose "Use and store" and watch the gauge.`)),
  Q(P(`血糖偏低時，主要的回應是什麼？`,`When glucose is low, what is the main response?`),
   [P(`胰島素促進細胞儲存更多的葡萄糖`,`Insulin promotes cells storing even more glucose in them`),P(`升糖素促進肝臟分解肝糖釋出葡萄糖`,`Glucagon promotes glycogen breakdown and glucose release`),P(`所有調節都停止，等待血糖自己上升`,`All regulation stops and the body waits for glucose to rise`),P(`肝糖直接變成胰島素，再送進血液`,`Glycogen turns directly into insulin and enters the blood`)],1,
   P(`偏低時，升糖素讓肝臟把肝糖分解成葡萄糖，增加血液供應。`,`For low glucose, glucagon makes the liver break glycogen down into glucose and raise supply to the blood.`),
   P(`把「情境」切到「血糖偏低」，選「肝臟釋出葡萄糖」。`,`Set "Situation" to "Low glucose" and choose "Liver releases glucose".`)),
  Q(P(`血糖偏高與偏低時的回應方向，和目的有什麼關係？`,`How do the response directions for high and low glucose relate to the goal?`),
   [P(`方向相同，但兩者的目的並不一樣`,`Same direction, but the two goals are quite different`),P(`方向相反，目的都是維持血糖恆定`,`Opposite directions, with one goal: stable glucose`),P(`方向相同，而且兩者的目的也相同`,`Same direction and the same goal for glucose control`),P(`方向相反，而且兩者的目的也完全相反`,`Opposite directions and the goals are opposite too`)],1,
   P(`偏高促進利用與儲存、偏低促進肝臟供應，方向相反，都是為了把血糖拉回適當範圍。`,`High glucose promotes use and storage while low glucose promotes liver supply: opposite directions, both bringing glucose back to range.`),
   P(`比較兩個情境的血糖計走向。`,`Compare how the gauge moves in the two situations.`))]
});
LQ.add('nervous',{
 reaction:[
  Q(P(`畫面還沒變綠，你就按下「反應！」，會怎樣？`,`You press "Respond!" before the panel has turned green. What happens?`),
   [P(`算成功，成績還會是最好的`,`It counts as a success and gives the best score`),P(`畫面會自動跟著就變成綠色`,`The panel turns green by itself in response`),P(`太早按了，這次不計入成績`,`It is too early and the trial is not counted`),P(`成績記為零毫秒，照樣計入`,`The score is logged as 0 ms and still counted`)],2,
   P(`要等到畫面變綠才反應；預猜會被判搶先，不計成績。`,`Respond only after green; guessing is called too early and not counted.`),
   P(`看「等待變綠，不要預猜」那個標題。`,`See the heading "Wait for green; do not guess".`)),
  Q(P(`同一個人連做五次，毫秒數為什麼不會一模一樣？`,`Why are the milliseconds not identical when the same person tries five times?`),
   [P(`一定是測量用的儀器壞掉了才會這樣`,`The measuring device must simply be broken, that is all`),P(`注意力、預猜與裝置延遲會影響結果`,`Attention, guessing and device delay can all affect it`),P(`神經訊息每次都一樣快，不會有差別`,`Nerve signals are always equally fast, so no difference`),P(`只有手臂的長度會影響每一次的結果`,`Only the length of the arm affects every single result`)],1,
   P(`刺激接收、訊息整合與肌肉反應都需要時間，注意力、練習與測量方式都可能影響結果。`,`Detection, integration and muscle response all take time; attention, practice and the measurement method can affect results.`),
   P(`看下方「把概念帶走」。`,`See the "Take the idea with you" box below.`)),
  Q(P(`螢幕上的毫秒數，可以用來排名不同裝置、不同人的能力嗎？`,`Can the on-screen milliseconds be used to rank people or devices?`),
   [P(`可以，毫秒數越小的人就一定越聰明`,`Yes, the smaller the number is, the smarter the person is`),P(`不可以，含裝置延遲，且非診斷工具`,`No, it includes device delay and is not a diagnostic tool`),P(`可以，不同裝置量到的結果完全可比`,`Yes, results from different devices are fully comparable`),P(`可以，還能用它判斷一個人是否健康`,`Yes, and it can even tell if a person is healthy or not`)],1,
   P(`這是螢幕練習，結果包含裝置延遲，不能拿來診斷或排名。`,`This is a screen task; results include device delays and cannot diagnose or rank.`),
   P(`看「延伸閱讀與思考」最後一句。`,`See the last sentence of "Read more and think further".`)),
  Q(P(`做實體接尺時，尺掉下的距離可以直接當成反應時間嗎？`,`In the ruler-drop test, can the falling distance be read directly as reaction time?`),
   [P(`可以，距離的數字大小就是反應時間`,`Yes, the size of the distance figure is directly the reaction time`),P(`不可以，距離不是時間，只能比較快慢`,`No, distance is not time; it only compares who caught it sooner`),P(`可以，因為兩者的單位剛好都是毫秒數`,`Yes, because both of them are conveniently in milliseconds too`),P(`不可以，因為實驗時直尺根本不會掉下`,`No, because the ruler never actually falls during the whole test`)],1,
   P(`距離不是時間；接尺時主試者不預告放手，並重複幾次比較。`,`Distance is not time; the tester releases without warning and the trial is repeated for comparison.`),
   P(`看「延伸閱讀與思考」裡接尺的說明。`,`See the ruler-task notes in "Read more and think further".`))]
});
LQ.add('respiration',{
 evidence:[
  Q(P(`澄清石灰水變混濁，最能支持哪個結論？`,`Clear limewater turning cloudy best supports which conclusion?`),
   [P(`氣體裡面只有二氧化碳而已`,`The gas contains nothing but carbon dioxide`),P(`氣體裡面至少含有二氧化碳`,`The gas contains at least carbon dioxide`),P(`氣體裡面完全沒有氧氣存在`,`The gas contains no oxygen of any kind`),P(`石灰水自己變成了另一種氧氣`,`The limewater itself turned into oxygen`)],1,
   P(`白色沉澱支持「待測氣體含二氧化碳」，不能說只有二氧化碳；呼出的氣體仍含氧。`,`The white precipitate supports CO₂ being present, not being the only gas; exhaled air still contains oxygen.`),
   P(`按「開始教師示範」，看說明最後一句。`,`Press "Start teacher demonstration" and read the last sentence.`)),
  Q(P(`比較萌芽綠豆和乾燥綠豆的石灰水，為什麼一開始要確認相同的起始條件？`,`Why check identical starting conditions before comparing germinated and dry seeds with limewater?`),
   [P(`這只是一個形式，其實可以省略不做`,`It is only a formality, so it can be skipped entirely`),P(`只改變氣體來源，差異才能歸因於它`,`So only the gas source changes; any gap is due to it`),P(`這樣才能確保兩支試管一定都變混濁`,`So that both tubes are sure to turn cloudy in the end`),P(`因為液面的高低本身就會產生二氧化碳`,`Because the liquid level itself makes carbon dioxide`)],1,
   P(`控制樣本量、溫度、石灰水量與觀察時間，一次只改一個條件，結果才能當證據。`,`Controlling sample mass, temperature, limewater amount and time, and changing one thing at a time, makes the result usable as evidence.`),
   P(`按「看初始狀態」，比較兩管的液面、體積和顏色。`,`Press "Initial conditions" and compare the levels, volumes and colours.`)),
  Q(P(`模型畫出的混濁程度，可以當成真實的產氣速率嗎？`,`Can the cloudiness in the model be read as a real rate of gas production?`),
   [P(`不可以，只是定性證據，不是精確速率`,`No, it is qualitative evidence, not an exact rate`),P(`可以，混濁程度就是精確的產氣速率`,`Yes, the cloudiness gives an exact rate of gas production`),P(`可以，畫面上的時間就是真實的實驗倒數`,`Yes, the time on screen is a real experimental countdown`),P(`不可以，因為石灰水根本不會變得混濁`,`No, because limewater never turns cloudy at all`)],0,
   P(`差異是定性證據，示意時間不是真實實驗倒數，也不是學生的實測。`,`The difference is qualitative evidence; model time is not a real countdown or a student measurement.`),
   P(`看「延伸閱讀與思考」中關於產氣速率的句子。`,`See the sentence about production rate in "Read more and think further".`))]
});
LQ.add('responses',{
 boxes:[
  Q(P(`要檢驗「光源方向」會不會影響幼苗生長方向，下列哪些條件應該保持相同？`,`To test whether light direction affects seedling growth, which conditions should stay the same?`),
   [P(`容器、種子數、水量與溫度等條件`,`Containers, seed count, water, temperature and other conditions`),P(`每個盒子的開口朝向都要不一樣`,`The opening direction of every box, which must differ`),P(`每個盒子的光源方向都要各自不同`,`The light direction of every box, set differently for each`),P(`什麼都不用管，反正結果都會一樣`,`Nothing needs controlling, since the result will be the same anyway`)],0,
   P(`只改光源方向，其他條件要相同，差異才能歸因於光。`,`Change only light direction and keep everything else equal so any difference can be credited to light.`),
   P(`把「操縱變因」選成「光源方向」，看說明。`,`Choose "Light direction" under "Manipulated variable" and read the caption.`)),
  Q(P(`把操縱變因改成「水量」或「種子數」，會怎樣？`,`What happens if the manipulated variable is changed to water amount or seed count?`),
   [P(`還是同一個實驗，所有差異都來自光`,`It is still the same experiment and all differences come from light`),P(`變成另一個實驗，差異不全是光造成`,`It becomes a different test and not all differences are from light`),P(`所有的幼苗都會馬上完全停止生長`,`All of the seedlings will stop growing at once for good`),P(`結果會改由電腦直接幫忙計算出來`,`The result is then worked out directly by the computer program`)],1,
   P(`本次問題是光源方向；若改水量或種子數，就混入別的變因。`,`The question is light direction; changing water or seed count would confound the comparison.`),
   P(`依序選「水量」「種子數」，看標題怎麼變。`,`Choose "Water amount" and "Seed count" in turn and see how the heading changes.`)),
  Q(P(`第 1、5、7 天的照片，顯示的生長方向是什麼？`,`What do the day 1, 5 and 7 photos show about growth direction?`),
   [P(`由程式算出來的模擬結果`,`A simulated result computed by a program`),P(`課本記錄的實際觀察結果`,`Actual observations recorded in the book`),P(`我們事先猜想的預測答案`,`The prediction that we guessed in advance`),P(`和光源方向無關的隨機照片`,`Random photos unrelated to light direction`)],1,
   P(`這些是課本的觀察照片，不是程式算出來的結果。`,`These are the textbook's observation photos, not computer-generated results.`),
   P(`切換「原照片日期」，看說明裡「課本的觀察」那句。`,`Switch "Photo day" and read the sentence about the textbook observations.`)),
  Q(P(`沒有尺規的照片，可以量出幼苗的精確長度嗎？`,`Can you work out exact seedling lengths from a photo without a ruler?`),
   [P(`可以，只要用眼睛仔細目測估計，就已經足夠了`,`Yes, a careful estimate by eye is good enough for the purpose`),P(`不可以，不能虛構精確長度，要實測才能確認`,`No, exact lengths cannot be invented; measure them to confirm`),P(`可以，因為同一盒裡所有幼苗的長度都完全一樣`,`Yes, because every seedling in a box is exactly the same length`),P(`可以，因為從幼苗的顏色就能直接換算出長度`,`Yes, the length can be converted from the seedling's colour`)],1,
   P(`沒有尺規的照片不能虛構精確長度；仍需要實作才能確認的部分要老實標示。`,`Photos without a ruler cannot give invented exact lengths; parts that still need a real experiment should be marked honestly.`),
   P(`看「延伸閱讀與思考」最後一句。`,`See the last sentence of "Read more and think further".`))]
});
})();
