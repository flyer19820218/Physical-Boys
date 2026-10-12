/* Two teaching layers; every stop connects organ, fluid, action and product. */
(function(root){'use strict';
 const step=(id,label,scene,seconds,copy,extra={})=>({id,label,scene,seconds,copy,...extra});
 const stops=[
  {id:'mouth',name:['口腔','Mouth'],ph:['近中性','Near neutral'],steps:[
   step('locate',['先看口腔','Find the mouth'],'zoom',3,['牙齒咀嚼、舌頭混合，形成可以吞嚥的食團。','Teeth chew and the tongue mixes food into a bolus.']),
   step('chew',['咬碎食物顆粒','Chew food particles'],'chew',4,['咀嚼只讓食物顆粒變小，裡面的澱粉長鏈仍然相連。','Chewing makes food particles smaller; their starch chains remain connected.']),
   step('supply',['唾液從哪裡來？','Where does saliva come from?'],'glands',3,['唾腺送來唾液：潤濕食物，並提供澱粉酶。食物不進入唾腺。','Salivary glands supply moistening saliva and amylase. Food does not enter the glands.'],{organ:'salivary'}),
   step('amylase',['澱粉酶拆長鏈','Amylase cuts long chains'],'polymer',8,['澱粉是大分子。澱粉酶結合其中的局部，切開連結；多次作用形成較短醣鏈與麥芽糖，不是直接全部變成葡萄糖。','Starch is a large molecule. Amylase binds locally and breaks links. Repeated action forms shorter chains and maltose—not only glucose.']),
   step('swallow',['經咽，進入食道','Through pharynx to esophagus'],'zoom',3,['牙齒做物理消化，澱粉酶做化學消化。吞嚥後，食團經咽進入食道。','Teeth perform mechanical digestion; amylase performs chemical digestion. The swallowed bolus passes through the pharynx.'],{organ:'pharynx'})]},
  {id:'esophagus',name:['食道','Esophagus'],ph:null,steps:[
   step('locate',['食團到了哪裡？','Locate the bolus'],'zoom',3,['食道把咽與胃接起來；它主要負責運輸食團。','The esophagus connects pharynx and stomach and mainly transports the bolus.']),
   step('wave',['肌肉接力推送','Muscles push in sequence'],'wave',8,['食團後方收縮、前方放鬆，收縮波把它推向胃；不是只靠重力往下掉。','Contraction behind and relaxation ahead push the bolus toward the stomach—not just gravity.']),
   step('arrive',['到胃，換誰接手？','Who takes over in the stomach?'],'zoom',3,['蠕動不會把大分子直接拆小。食團抵達胃後，遇到新的消化環境。','Peristalsis does not itself split large molecules. In the stomach, the bolus meets a new environment.'],{organ:'stomach'})]},
  {id:'stomach',name:['胃','Stomach'],ph:['酸性','Acidic'],steps:[
   step('locate',['暫存、攪拌','Store and mix'],'zoom',4,['胃暫存食物並攪拌，使食物與胃液混合。攪拌與分子分解不是同一件事。','The stomach stores and mixes food with gastric juice. Mixing is not molecular breakdown.']),
   step('acid',['胃液與酸性環境','Gastric juice and acidity'],'zoom',4,['胃液含鹽酸和酵素。鹽酸提供酸性環境，幫助蛋白質變性，也有助於殺菌；不是鹽酸取代酵素。','Gastric juice contains acid and enzymes. Acid helps unfold proteins and kill microbes; it does not replace enzymes.']),
   step('protein',['蛋白質初步拆小','Begin protein digestion'],'polymer',8,['胃蛋白酶開始切開蛋白質的連結，形成較短鏈；還要到小腸繼續消化，不能畫成胃裡已全部變成胺基酸。','Pepsin begins breaking proteins into shorter chains. Digestion continues in the small intestine—not all amino acids yet.'],{kind:'protein'}),
   step('protect',['胃壁為何不被消化？','Why is the wall protected?'],'zoom',4,['胃壁的黏液保護上皮。食物混成食糜後，逐步送進小腸。','Mucus protects the stomach lining. The resulting chyme is gradually delivered to the small intestine.'])]},
  {id:'small',name:['小腸','Small intestine'],ph:['偏鹼性','Mildly alkaline'],steps:[
   step('locate',['消化液在這裡會合','Digestive fluids meet here'],'zoom',3,['小腸是主要的消化與吸收場所；食糜在此與消化液混合。','The small intestine is the main site of digestion and absorption; chyme mixes with digestive fluids.']),
   step('supply',['膽汁、胰液、腸液','Bile, pancreatic and intestinal juice'],'glands',5,['肝臟製造膽汁、膽囊儲存；胰臟送來胰液。腸壁的酵素也參與消化，食物不穿過這些消化腺。','The liver makes bile; the gallbladder stores it. The pancreas supplies enzymes, and intestinal-wall enzymes also act. Food does not pass through these glands.'],{organ:'pancreas'}),
   step('carb',['醣類繼續拆成葡萄糖','Finish carbohydrate digestion'],'polymer',8,['胰液中的澱粉酶繼續處理醣鏈；小腸上皮的酵素再分解麥芽糖等，形成可吸收的葡萄糖。這是多種酵素接力。','Pancreatic amylase continues chain digestion; intestinal enzymes split maltose and other fragments into absorbable glucose. Several enzymes work in sequence.'],{complete:true}),
   step('protein',['蛋白質繼續拆成胺基酸','Finish protein digestion'],'polymer',8,['胰液與小腸的蛋白質分解酵素接力，把較短鏈拆成胺基酸。','Pancreatic and intestinal protein-digesting enzymes turn shorter chains into amino acids.'],{kind:'protein',complete:true}),
   step('emulsify',['膽汁先乳化脂質','Bile emulsifies fat first'],'fat',6,['膽汁沒有消化酵素：把大油滴分散成小油滴，增加接觸面積；脂質分子沒有被切開。','Bile has no digestive enzymes. It makes smaller droplets with more exposed surface; fat molecules are not split.'],{fluid:2}),
   step('lipase',['脂肪酶拆三條脂肪酸','Lipase acts on fat'],'fat',8,['脂肪酶的活性區與脂質形狀吻合，催化後釋放分解產物，酵素保留。主體代表甘油、三隻腳代表脂肪酸；依國中模型顯示，實際產物也包括單酸甘油酯。','A matching active site binds fat, catalyzes digestion and releases products; lipase remains. Body = glycerol; legs = fatty acids. This junior-high model is simplified; actual products include monoglycerides.'],{fluid:3}),
   step('structure',['絨毛把表面積放大','Villi increase surface area'],'structure',5,['皺褶、絨毛、微絨毛增加吸收表面積。下方是真實顯微影像；模型與觀察證據分開看。','Folds, villi and microvilli increase surface area. Real micrographs below provide evidence, distinct from the model.']),
   step('absorb',['養分跨過腸壁','Nutrients cross the wall'],'absorb',9,['葡萄糖、胺基酸穿過上皮，進入微血管，再隨血流到靜脈。大分子不能照這條路直接吸收。多數長鏈脂質則先經乳糜管、淋巴。','Glucose and amino acids cross the epithelium into capillaries and then veins. Whole large molecules cannot follow this route. Most long-chain fats first follow lacteals and lymph.']),
   step('use',['養分分流，殘渣往前','Nutrients branch off; residue goes on'],'use',6,['吸收的養分經運輸供細胞利用；留在腸腔的物質繼續往大腸。消化與吸收在小腸內交錯進行。','Absorbed nutrients are transported to cells; material remaining in the lumen continues to the large intestine. Digestion and absorption overlap.'])]},
  {id:'large',name:['大腸','Large intestine'],ph:null,steps:[
   step('locate',['回收剩餘水分','Absorb remaining water'],'zoom',5,['小腸已吸收大部分水分；大腸再吸收剩餘水分，腸道內容物逐漸形成糞便。','Most water absorption has occurred in the small intestine. The large intestine absorbs remaining water as feces form.']),
   step('residue',['糞便不只食物殘渣','Feces are not only food residue'],'zoom',4,['糞便還包含細菌與脫落的細胞等。接著送到直腸暫存，不是把養分全部排掉。','Feces also include bacteria and shed cells. The rectum stores feces; this is not disposal of all nutrients.'],{organ:'rectum'})]},
  {id:'anus',name:['直腸、肛門','Rectum and anus'],ph:null,steps:[
   step('store',['直腸先暫存','Stored in the rectum'],'zoom',4,['糞便在直腸暫存，最後經肛門排出。','Feces are stored in the rectum and finally pass through the anus.'],{organ:'rectum'}),
   step('exit',['排遺，不是排泄','Egestion, not excretion'],'zoom',4,['糞便經肛門離開叫排遺；細胞產生的二氧化碳、含氮廢物離開身體才屬排泄。','Feces leaving the anus is egestion; removing cellular carbon dioxide and nitrogenous wastes is excretion.'])]}
 ];
 const route=[['mouth',['口腔','Mouth']],['pharynx',['咽','Pharynx']],['esophagus',['食道','Esophagus']],['stomach',['胃','Stomach']],['small',['小腸','Small intestine']],['large',['大腸','Large intestine']],['rectum',['直腸','Rectum']],['anus',['肛門','Anus']]];
 const crops={mouth:[250,120,400,320],pharynx:[310,210,330,300],esophagus:[370,265,330,430],stomach:[330,635,430,335],small:[220,905,590,365],large:[180,900,680,485],rectum:[385,1190,290,300],anus:[390,1265,285,270],salivary:[285,110,395,330],pancreas:[315,745,430,285]};
 root.AnimalStoryData={stops,route,crops};
})(typeof window==='undefined'?globalThis:window);
