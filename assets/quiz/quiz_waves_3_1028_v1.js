/* Multiple-choice practice for waves_3.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.tab-btn',keys:["echo","mountains","ultra","avoid"],into:'.wrap'});
LQ.addStatic('waves_3',{
 '#mcq-echo':[
  Q(P(`人耳要聽見回聲，距離障礙物至少要多遠（聲速 340 m/s）？`,`How far from an obstacle must you be to hear an echo (speed of sound 340 m/s)?`),
   [P(`至少 34 公尺`,`At least 34 m`),P(`至少 340 公尺`,`At least 340 m`),P(`至少 1.7 公尺`,`At least 1.7 m`),P(`至少 17 公尺`,`At least 17 m`)],3,
   P(`人耳需要 0.1 秒分辨聲音，聲音來回共走 340 × 0.1 = 34 公尺，單程 17 公尺，所以至少要 17 公尺。`,`The ear needs 0.1 s to tell sounds apart. The sound travels 340 × 0.1 = 34 m there and back, so one way is 17 m.`),
   P(`聲音是「來回」跑，距離要再除以 2。`,`The sound goes there and back, so divide the distance by 2.`)),
  Q(P(`聲波反射成為回聲後，和原聲相比，哪一個量會改變？`,`After a sound reflects into an echo, which quantity differs from the original?`),
   [P(`頻率變得較低`,`The frequency gets much lower`),P(`只有振幅變小`,`Only the amplitude gets smaller`),P(`波長變得較長`,`The wavelength gets much longer`),P(`波速變得較慢`,`The wave speed gets much slower`)],1,
   P(`反射時能量會散失，所以只有振幅（大小聲）改變；頻率、週期、波長、波速都和原聲相同。`,`Energy is lost on reflection, so only the amplitude (loudness) changes; frequency, period, wavelength and speed stay the same.`),
   P(`回聲聽起來變小聲，小聲對應哪一個量？`,`An echo sounds quieter. Which quantity matches loudness?`)),
  Q(P(`塞滿人的教室裡聽不到回音，最主要的原因是什麼？`,`Why can you barely hear an echo in a classroom packed with people?`),
   [P(`聲音變成光能被消耗掉`,`Sound turns into light and fades`),P(`人群讓聲速變得更慢了`,`The crowd slows the sound down`),P(`回聲全都傳到室外去了`,`All of the echo goes outdoors`),P(`人與衣物吸收聲波能量`,`People and clothes absorb sound`)],3,
   P(`人體與衣物是柔軟材質，會吸收聲波能量，反射回來的聲音太小，所以聽不到回聲。`,`People and clothes are soft and absorb sound energy, so the reflected sound is too weak to hear.`),
   P(`想想柔軟的布料、地毯對聲音有什麼影響。`,`Think what soft cloth and carpets do to sound.`))],
 '#mcq-mountains':[
  Q(P(`某人在兩山之間大喊，1 秒後聽到第一次回聲，再過 1 秒聽到第二次回聲（聲速 340 m/s），兩山相距多少？`,`Someone shouts between two mountains, hears the first echo after 1 s and the second 1 s later (340 m/s). How far apart are the mountains?`),
   [P(`340 公尺`,`340 m`),P(`510 公尺`,`510 m`),P(`680 公尺`,`680 m`),P(`170 公尺`,`170 m`)],1,
   P(`第一次回聲 1 秒：近山 340 × 1 ÷ 2 = 170 m；第二次回聲共 2 秒：遠山 340 × 2 ÷ 2 = 340 m；兩山相距 170 + 340 = 510 m。`,`First echo at 1 s: near mountain 340 × 1 ÷ 2 = 170 m. Second echo at 2 s: far mountain 340 × 2 ÷ 2 = 340 m. Distance apart: 170 + 340 = 510 m.`),
   P(`先分別算人到兩座山的距離，再相加。`,`Find the distance to each mountain first, then add them.`)),
  Q(P(`「再經過 1 秒聽到第二次回聲」，第二次回聲的總時間是多少？`,`"One more second later the second echo is heard." What is the total time of the second echo?`),
   [P(`總共 2 秒`,`2 s in total`),P(`總共 1 秒`,`1 s in total`),P(`總共 3 秒`,`3 s in total`),P(`總共 4 秒`,`4 s in total`)],0,
   P(`「再經過」是從第一次回聲之後算起，所以總時間是 1 + 1 = 2 秒。`,`"Another second" counts from the first echo, so the total is 1 + 1 = 2 s.`),
   P(`時間是從喊出聲音那一刻開始算的。`,`Time is counted from the moment of the shout.`)),
  Q(P(`用回聲計算距離時，為什麼時間要除以 2？`,`Why must the time be divided by 2 when finding a distance from an echo?`),
   [P(`聲音傳播速度會減半`,`The speed of sound drops by half`),P(`回聲的頻率只剩一半`,`The echo frequency drops by half`),P(`聲音來回跑了兩趟路`,`The sound travels there and back`),P(`人耳只聽得到一半聲音`,`Ears only hear half of the sound`)],2,
   P(`聲音從人到山、再從山回到人，走了兩倍的距離，所以單程時間是總時間的一半。`,`The sound goes from you to the mountain and back, doubling the path, so one-way time is half the total.`),
   P(`回聲聽到時，聲音已經跑完了整個來回。`,`When you hear the echo the sound has finished the whole round trip.`))],
 '#mcq-ultra':[
  Q(P(`超聲波是指頻率在什麼範圍的聲音？`,`What frequency range defines ultrasound?`),
   [P(`頻率超過 20000 Hz`,`Frequency above 20000 Hz`),P(`頻率低於 20000 Hz`,`Frequency below 20000 Hz`),P(`頻率超過 2000 Hz`,`Frequency above 2000 Hz`),P(`頻率低於 2000 Hz`,`Frequency below 2000 Hz`)],0,
   P(`頻率超過 20000 Hz（人耳聽覺上限）的聲波稱為超聲波。`,`Sound with a frequency above 20000 Hz, the upper limit of human hearing, is ultrasound.`),
   P(`超聲波的「超」代表超過人耳聽得見的上限。`,`"Ultra" means beyond the upper limit of human hearing.`)),
  Q(P(`人耳能聽見的頻率範圍大約是多少？`,`Roughly what frequency range can the human ear hear?`),
   [P(`2 ~ 2000 Hz`,`2 ~ 2000 Hz`),P(`200 ~ 20000 Hz`,`200 ~ 20000 Hz`),P(`20 ~ 2000 Hz`,`20 ~ 2000 Hz`),P(`20 ~ 20000 Hz`,`20 ~ 20000 Hz`)],3,
   P(`人耳僅能聽見 20 ~ 20000 Hz 的聲音。`,`The human ear can only hear 20 to 20000 Hz.`),
   P(`超聲波的定義就是以人耳上限為界。`,`Ultrasound is defined by the ear's upper limit.`)),
  Q(P(`蝙蝠在黑暗中飛行不會撞牆，是因為牠怎麼做？`,`How does a bat avoid walls when flying in the dark?`),
   [P(`夜視眼睛能看見牆壁`,`Sees the wall with night vision`),P(`發出超聲波再聽回聲`,`Sends ultrasound, hears the echo`),P(`發出次聲波再聽回聲`,`Sends low sound, hears the echo`),P(`感應牆壁散發的熱量`,`Feels the heat given off by walls`)],1,
   P(`蝙蝠發出超聲波，聽反射回來的回聲來判斷與障礙物的距離。`,`A bat sends out ultrasound and listens to the echo to judge its distance from obstacles.`),
   P(`漁船聲納和蝙蝠用的是同一種原理。`,`A fishing-boat sonar uses the same principle as a bat.`))],
 '#mcq-avoid':[
  Q(P(`牆壁加裝吸音板和布幔，主要是用來做什麼？`,`What is the main job of sound-absorbing boards and curtains on a wall?`),
   [P(`吸收聲波的能量`,`Absorbs sound energy`),P(`讓聲波跑得更快`,`Speeds up the sound`),P(`增加聲波的能量`,`Adds more sound energy`),P(`把聲波變成光波`,`Turns sound into light`)],0,
   P(`吸音板與布幔是柔軟材質，能吸收聲波能量，減少反射回來的回聲。`,`Soft boards and curtains absorb sound energy, so less echo is reflected back.`),
   P(`地毯和布面椅套也有同樣的功能。`,`Carpets and cloth chair covers do the same job.`)),
  Q(P(`聲音遇到不平整的表面發生漫射，這算不算遵守反射定律？`,`When sound scatters off a rough surface, does it still obey the law of reflection?`),
   [P(`不遵守所以聲音亂跑`,`Breaks it, so sound runs wild`),P(`遵守但各處方向不同`,`Obeys it, but the paths differ`),P(`不遵守因為變成折射`,`Breaks it, as sound refracts`),P(`只有光遵守聲音不用`,`Only light must follow the law`)],1,
   P(`漫射仍然遵守反射定律，只是表面凹凸不平，各處的反射方向不同，所以聲音向四面八方散開。`,`Scattering still obeys the law of reflection; the bumpy surface just makes each part reflect in a different direction.`),
   P(`聲音並沒有亂跑，是表面造成的。`,`The sound does not run wild; the surface is the cause.`)),
  Q(P(`音樂廳採用傾斜的天花板，目的是什麼？`,`Why does a concert hall use a slanted ceiling?`),
   [P(`讓聲音直接穿出屋頂`,`Let sound escape through the roof`),P(`讓回聲變得更清楚`,`Make the echoes much clearer`),P(`節省空調的電費`,`Cut the cost of air conditioning`),P(`改變聲音反射方向`,`Change the reflection direction`)],3,
   P(`傾斜的天花板能破壞原本平整的反射方向，避免形成清晰的回聲干擾演出。`,`A slanted ceiling breaks up the flat reflection and avoids a clear echo disturbing the performance.`),
   P(`主要手法是破壞反射方向，以及吸收聲波能量。`,`The main tricks are breaking the reflection direction and absorbing sound energy.`))]
});
})();
