/* Multiple-choice checks for "food's journey" (biology_animal_nutrition.html), 2026-10-26.
 * The page rebuilds one <section id="story-lesson"> for each tab, so the two tabs are told apart by their last child
 * (.an-closure = overview tab, .story-notes = stop-by-stop tab). The stop-by-stop questions cover every stop and quote
 * the stop buttons, which stay on screen whichever stop is selected.
 * Every question: question, hint (shown when wrong), answer (shown when right). */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('animal_nutrition',{
 '#story-lesson:has(> .an-closure)':[
  Q(P(`食物會進入肝臟和胰臟嗎？`,`Does food enter the liver or the pancreas?`),
   [P(`會，食物一路經過肝臟和胰臟`,`Yes, food passes right through the liver and pancreas`),P(`不會，它們只提供消化液`,`No, they only supply digestive fluids`),P(`會，但只有油脂才會進去`,`Yes, but only fats go in`),P(`不會，因為它們沒有任何功能`,`No, because they have no function at all`)],1,
   P(`肝臟、胰臟是消化液的來源，食物真正走的是口腔→咽→食道→胃→小腸→大腸→直腸→肛門這條通道。`,`The liver and pancreas supply digestive fluids; the actual food passage is mouth → pharynx → esophagus → stomach → small intestine → large intestine → rectum → anus.`),
   P(`比較「消化道」和「消化液來源」兩個切換，看哪些器官在食物的通道上。`,`Compare the two views "Digestive tract" and "Fluid sources" and see which organs lie on the food passage.`)),
  Q(P(`食物依序通過消化道的哪些器官？`,`In what order does food pass through the organs of the digestive tract?`),
   [P(`口腔→食道→咽→胃→小腸→大腸→直腸→肛門`,`Mouth → esophagus → pharynx → stomach → small intestine → large intestine → rectum → anus`),P(`口腔→咽→食道→胃→大腸→小腸→直腸→肛門`,`Mouth → pharynx → esophagus → stomach → large intestine → small intestine → rectum → anus`),P(`口腔→咽→食道→胃→小腸→大腸→直腸→肛門`,`Mouth → pharynx → esophagus → stomach → small intestine → large intestine → rectum → anus`),P(`口腔→咽→胃→食道→小腸→大腸→直腸→肛門`,`Mouth → pharynx → stomach → esophagus → small intestine → large intestine → rectum → anus`)],2,
   P(`食物依序走：口腔→咽→食道→胃→小腸→大腸→直腸→肛門。`,`Food passes in sequence: mouth → pharynx → esophagus → stomach → small intestine → large intestine → rectum → anus.`),
   P(`按「看完整路線」，跟著食物把通道走一遍。`,`Press "See the whole route" and follow the food along the passage.`)),
  Q(P(`口腔裡，唾液中的酵素開始分解哪一種養分？`,`In the mouth, which nutrient do the enzymes in saliva begin to break down?`),
   [P(`蛋白質`,`Protein`),P(`脂質`,`Lipids`),P(`澱粉`,`Starch`),P(`維生素`,`Vitamins`)],2,
   P(`口腔中牙齒咬碎食物，唾液中的酵素開始分解澱粉。`,`In the mouth teeth mechanically break food up, and salivary enzymes begin starch digestion.`),
   P(`按「口腔」，讀圖下方的說明。`,`Press "Mouth" and read the note below the diagram.`)),
  Q(P(`哪一個器官位在大腸之後、肛門之前？`,`Which organ lies after the large intestine and before the anus?`),
   [P(`胃`,`Stomach`),P(`食道`,`Esophagus`),P(`咽`,`Pharynx`),P(`直腸`,`Rectum`)],3,
   P(`大腸之後是直腸，糞便先暫存在直腸，最後經肛門排出。`,`After the large intestine comes the rectum, where feces are stored before leaving through the anus.`),
   P(`依序按「大腸」「直腸」「肛門」，看它們的位置。`,`Press "Large intestine", "Rectum" and "Anus" in turn and see their positions.`))],
 '#story-lesson:has(> .story-notes)':[
  Q(P(`把食物咬碎，屬於哪一種消化？`,`Chewing food into pieces is which kind of digestion?`),
   [P(`化學消化，因為分子被拆開`,`Chemical, because molecules are split`),P(`物理消化，只是顆粒變小`,`Mechanical, the particles just get smaller`),P(`兩者都不是，咬碎和消化無關`,`Neither, chewing has nothing to do with digestion`),P(`化學消化，因為會產生新的分子`,`Chemical, because new molecules are made`)],1,
   P(`咬碎是物理消化，分子種類不變；唾液初步分解澱粉才是化學消化。`,`Chewing is mechanical digestion and the molecule type is unchanged; initial starch breakdown by saliva is chemical digestion.`),
   P(`按「先咬，再拆」那一站，再展開「展開本站完整解說」。`,`Select the "Bite, then break down" stop, then open "Expand the complete stop explanation".`)),
  Q(P(`食道主要負責什麼工作？`,`What is the main job of the esophagus?`),
   [P(`運輸食團，靠蠕動推送`,`Transporting the bolus by peristalsis`),P(`把大分子分解成小分子`,`Breaking large molecules into small ones`),P(`吸收大部分的養分與水分`,`Absorbing most nutrients and water`),P(`分泌膽汁和胰液`,`Secreting bile and pancreatic juice`)],0,
   P(`食道主要負責運輸，蠕動推送食團，不是主要的吸收場所，也不把大分子分解。`,`The esophagus mainly transports food by peristalsis; it is not the main absorption site and does not break large molecules down.`),
   P(`按「不是往下掉」那一站，再展開「展開本站完整解說」。`,`Select the "Not just falling" stop, then open "Expand the complete stop explanation".`)),
  Q(P(`在胃裡，哪一項是化學消化？`,`In the stomach, which of these is chemical digestion?`),
   [P(`胃壁肌肉不停攪拌食物`,`The stomach wall muscles constantly mixing the food`),P(`胃把食物暫時儲存起來`,`The stomach holding food in store for a while`),P(`食物和胃液混合在一起`,`Food mixing together with gastric juice`),P(`酵素把蛋白質拆成較短的鏈`,`Enzymes splitting protein into shorter chains`)],3,
   P(`攪拌屬物理作用；蛋白質分子變成較短鏈才是化學消化，而且還沒有完成吸收。`,`Mixing is mechanical; breaking protein into shorter chains is chemical digestion, and absorption has not yet happened.`),
   P(`按「酸中拆蛋白」那一站，再展開「展開本站完整解說」。`,`Select the "Protein meets acid" stop, then open "Expand the complete stop explanation".`)),
  Q(P(`胃液很酸，為什麼胃壁不會被消化？`,`Gastric juice is acidic. Why is the stomach wall not digested?`),
   [P(`因為胃壁會躲開胃液`,`Because the wall moves away from the juice`),P(`因為黏液保護了胃壁`,`Because mucus protects the stomach wall`),P(`因為胃液其實沒有酵素`,`Because gastric juice contains no enzymes`),P(`因為胃液只在晚上才分泌`,`Because gastric juice is only secreted at night`)],1,
   P(`鹽酸提供酸性環境、有助殺菌；酵素初步分解蛋白質，黏液保護胃壁。`,`Hydrochloric acid provides acidity and helps kill microbes; enzymes begin protein digestion and mucus protects the stomach wall.`),
   P(`按「酸中拆蛋白」那一站，再按「胃壁為何不被消化？」。`,`Select the "Protein meets acid" stop, then press "Why is the wall protected?".`)),
  Q(P(`膽汁在小腸裡的作用是什麼？`,`What does bile do in the small intestine?`),
   [P(`把大部分澱粉分解成葡萄糖`,`It breaks most starch into glucose`),P(`把所有蛋白質分解成胺基酸`,`It breaks all protein into amino acids`),P(`乳化脂質，本身沒有酵素`,`It emulsifies fat and has no enzymes`),P(`把食物裡的水分全部吸收掉`,`It absorbs all of the water in the food`)],2,
   P(`膽汁由肝臟製造、膽囊儲存，乳化脂質但沒有消化酵素；脂肪酶才拆脂肪。`,`Bile is made by the liver and stored in the gallbladder; it emulsifies fat without digestive enzymes, and lipase is what splits fat.`),
   P(`按「拆小，才進得去」那一站，再按「膽汁先乳化脂質」。`,`Select the "Break down, then cross" stop, then press "Bile emulsifies fat first".`)),
  Q(P(`小腸內壁的絨毛，主要有什麼作用？`,`What is the main function of the villi lining the small intestine?`),
   [P(`增加表面積，幫助養分吸收`,`Increase surface area to help absorption`),P(`在腸壁裡製造膽汁和胰液`,`Make bile and pancreatic juice in the wall`),P(`把食物在腸裡咬得更碎`,`Chew the food even smaller inside the gut`),P(`阻止所有物質進入血液`,`Block everything from entering the blood`)],0,
   P(`絨毛增加表面積；大部分養分與水分在小腸吸收。`,`Villi increase surface area; most nutrients and water are absorbed in the small intestine.`),
   P(`按「絨毛把表面積放大」，看腸壁的表面有什麼變化。`,`Press "Villi increase surface area" and see what happens to the surface of the wall.`)),
  Q(P(`「消化」和「吸收」有什麼不同？`,`How do "digestion" and "absorption" differ?`),
   [P(`消化是把分子拆小，吸收是讓養分跨過上皮`,`Digestion splits molecules smaller; absorption moves nutrients across the epithelium`),P(`消化是把養分送進血液，吸收是把分子拆小`,`Digestion sends nutrients into blood; absorption splits molecules smaller`),P(`兩者是同一件事，只是名字不同`,`They are the same thing under different names`),P(`消化只發生在口腔，吸收只發生在胃`,`Digestion happens only in the mouth, absorption only in the stomach`)],0,
   P(`消化把分子拆小；吸收讓養分跨過上皮，進血液或淋巴，殘渣留在消化道。`,`Digestion makes absorbable units; absorption crosses the epithelium into blood or lymph, while residue stays in the gut.`),
   P(`按「養分跨過腸壁」，再展開「展開本站完整解說」。`,`Press "Nutrients cross the wall", then open "Expand the complete stop explanation".`)),
  Q(P(`大腸主要做什麼？`,`What does the large intestine mainly do?`),
   [P(`消化蛋白質和脂質`,`Digest proteins and lipids`),P(`吸收剩餘的水分`,`Absorb the remaining water`),P(`分泌酸性的胃液`,`Secrete acidic gastric juice`),P(`製造乳化用的膽汁`,`Make bile for emulsifying`)],1,
   P(`小腸吸收大部分水分，大腸再吸收剩餘水分，腸道內容物逐漸形成糞便。`,`The small intestine absorbs most water; the large intestine absorbs the remaining water as feces form.`),
   P(`按「剩下什麼？」那一站，讀本站的說明。`,`Select the "What remains?" stop and read its note.`)),
  Q(P(`糞便只是沒被吃完的食物殘渣嗎？`,`Are feces only leftover food residue?`),
   [P(`是，裡面只有食物殘渣`,`Yes, only food residue inside`),P(`是，裡面完全沒有細菌`,`Yes, with no bacteria at all`),P(`不是，裡面只有水而已`,`No, they are only water inside`),P(`不是，還有細菌與脫落細胞`,`No, they also contain bacteria and shed cells`)],3,
   P(`糞便包含未被消化吸收的物質、細菌與脫落細胞等，不是只有食物殘渣。`,`Feces include unabsorbed material, bacteria and shed cells, not only food residue.`),
   P(`按「糞便不只食物殘渣」，再展開「展開本站完整解說」。`,`Press "Feces are not only food residue", then open "Expand the complete stop explanation".`)),
  Q(P(`「排遺」和「排泄」有什麼不同？`,`How do "egestion" and "excretion" differ?`),
   [P(`排遺指排出糞便，排泄指排出代謝廢物`,`Egestion removes feces; excretion removes metabolic wastes`),P(`排遺是尿液排出，排泄是糞便排出`,`Egestion is urine leaving, excretion is feces leaving`),P(`兩者完全一樣，只是名字不同`,`They are exactly the same, only the names differ`),P(`排遺是呼出二氧化碳，排泄是排出糞便`,`Egestion is breathing out CO₂, excretion is passing feces`)],0,
   P(`排遺：糞便由肛門排出。排泄：細胞代謝廢物離開身體，例如二氧化碳經肺、含氮廢物經腎臟。`,`Egestion removes feces through the anus; excretion removes metabolic wastes, such as carbon dioxide through lungs and nitrogenous wastes through kidneys.`),
   P(`按「兩條路，不混淆」那一站，再展開「展開本站完整解說」。`,`Select the "Two different exits" stop, then open "Expand the complete stop explanation".`))]
});
})();
