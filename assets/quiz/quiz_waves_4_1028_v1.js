/* Multiple-choice practice for waves_4.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.tab-btn',keys:["loud","pitch","timbre","cup","resonance"],into:'.wrap'});
LQ.addStatic('waves_4',{
 '#mcq-loud':[
  Q(P(`聲音的「響度」（大小聲）由聲波的哪一個量決定？`,`Which wave quantity decides loudness?`),
   [P(`聲波的頻率`,`Its frequency`),P(`聲波的波形`,`Its waveform`),P(`聲波的振幅`,`Its amplitude`),P(`聲波的波速`,`Its wave speed`)],2,
   P(`響度由振幅決定。敲擊的力量越大，振幅越大，聲音就越大。`,`Loudness depends on amplitude: the harder the strike, the larger the amplitude and the louder the sound.`),
   P(`用力撥弦，弦會振動得更大還是更快？`,`Plucking harder makes the string swing wider or faster?`)),
  Q(P(`響度的測量單位是什麼？`,`What is the unit used to measure loudness?`),
   [P(`公斤 (kg)`,`kg (kilogram)`),P(`赫茲 (Hz)`,`Hz (hertz)`),P(`分貝 (dB)`,`dB (decibel)`),P(`牛頓 (N)`,`Pa (pascal)`)],2,
   P(`響度的單位是分貝 (dB)；0 分貝是人耳能聽見的最小音量。`,`Loudness is measured in decibels (dB); 0 dB is the quietest sound the ear can hear.`),
   P(`赫茲是頻率的單位，不是響度的單位。`,`The hertz is the unit of frequency, not loudness.`)),
  Q(P(`分貝數每增加 10，聲音的能量會怎樣？`,`When the sound level rises by 10 dB, what happens to the sound energy?`),
   [P(`變成 10 倍`,`10 times as much`),P(`變成 2 倍`,`2 times as much`),P(`變成 100 倍`,`100 times as much`),P(`變成 20 倍`,`20 times as much`)],0,
   P(`分貝數每增加 10，聲音能量就變成原來的 10 倍。`,`Every 10 dB increase multiplies the sound energy by 10.`),
   P(`注意是「每增加 10」，能量以倍數成長。`,`It is "every 10 dB", and the energy grows by a multiple.`))],
 '#mcq-pitch':[
  Q(P(`聲音的「音調」（高低）由聲波的哪一個量決定？`,`Which wave quantity decides pitch?`),
   [P(`聲波的振幅`,`Its amplitude`),P(`聲波的波形`,`Its waveform`),P(`聲波的波速`,`Its wave speed`),P(`聲波的頻率`,`Its frequency`)],3,
   P(`音調由頻率決定。物體振動越快，頻率越大，音調越高。`,`Pitch depends on frequency: the faster the vibration, the higher the frequency and the higher the pitch.`),
   P(`頻率的單位是赫茲，代表每秒振動的次數。`,`Frequency is measured in hertz, the vibrations per second.`)),
  Q(P(`下列哪一種吉他弦發出的音調最高？`,`Which guitar string gives the highest pitch?`),
   [P(`又細又緊的弦`,`A thin, tight string`),P(`又粗又鬆的弦`,`A thick, loose string`),P(`又粗又緊的弦`,`A thick, tight string`),P(`又細又鬆的弦`,`A thin, loose string`)],0,
   P(`輕、薄、短、小、細、緊的發音體容易振動，頻率高，音調高；所以又細又緊的弦音調最高。`,`Light, thin, short, small and tight sources vibrate easily with a high frequency, so a thin and tight string gives the highest pitch.`),
   P(`記住口訣：輕薄短小細緊，音調高。`,`Remember the rule: light, thin, short, small, tight means high pitch.`)),
  Q(P(`為什麼嬰兒的哭聲比爸爸的說話聲尖銳？`,`Why is a baby's cry sharper than a father's voice?`),
   [P(`聲帶較大而頻率較高`,`Large vocal cords, high frequency`),P(`聲帶較小而頻率較高`,`Small vocal cords, high frequency`),P(`聲帶較小而振幅較大`,`Small vocal cords, large amplitude`),P(`聲帶較薄而波速較快`,`Thin vocal cords, faster wave speed`)],1,
   P(`嬰兒的聲帶又小又輕，容易振動，頻率高，所以音調高、聲音尖銳。`,`A baby's vocal cords are small and light, vibrate easily and have a high frequency, so the pitch is high.`),
   P(`尖銳代表音調高，音調由哪一個量決定？`,`Sharp means high pitch; which quantity decides pitch?`))],
 '#mcq-timbre':[
  Q(P(`鋼琴與小提琴的響度、音調相同時，我們還能分辨它們，是因為什麼不同？`,`When a piano and a violin have the same loudness and pitch, what lets us still tell them apart?`),
   [P(`響度（振幅）`,`Loudness (amplitude)`),P(`音調（頻率）`,`Pitch (frequency)`),P(`波速（介質）`,`Speed (the medium)`),P(`音色（波形）`,`Timbre (waveform)`)],3,
   P(`音色由聲波的波形決定；不同樂器的波形不同，所以能分辨。`,`Timbre depends on the waveform; different instruments have different waveforms.`),
   P(`響度和音調已經相同了，剩下哪一個要素？`,`Loudness and pitch are equal, so which element remains?`)),
  Q(P(`音叉發出的聲波屬於哪一種？`,`What kind of sound wave does a tuning fork produce?`),
   [P(`複雜的複合波`,`A complex wave`),P(`最單純的純音`,`A very pure tone`),P(`雜亂的噪音波`,`A noisy mixture`),P(`高頻的超聲波`,`An ultrasonic wave`)],1,
   P(`音叉只有單一頻率，波形最單純，稱為純音；大多數樂器發出的是複合波。`,`A tuning fork has a single frequency and the simplest waveform, a pure tone; most instruments give compound waves.`),
   P(`動畫中音叉的波形像什麼形狀？`,`What shape is the tuning fork's waveform in the animation?`)),
  Q(P(`關於聲音三要素，下列哪一個敘述正確？`,`Which statement about the three elements of sound is correct?`),
   [P(`頻率變高時振幅一定變大`,`Higher pitch always means louder sound`),P(`波形不同時頻率一定不同`,`A new waveform always changes pitch`),P(`音調高時聲音一定很小聲`,`A high pitch is always a quiet sound`),P(`頻率改變時振幅不一定變`,`Changing pitch may not change loudness`)],3,
   P(`三要素互不影響：鋼琴可以彈出很小聲的低音，小提琴也可以拉出很大聲的高音。`,`The three elements are independent: a piano can play a quiet low note and a violin a loud high one.`),
   P(`舉出：小聲的低音、大聲的高音是不是都可能發生？`,`Can both a quiet low note and a loud high note happen?`))],
 '#mcq-cup':[
  Q(P(`用筷子敲打裝水的玻璃杯杯身，發音體是誰？`,`When you tap a water-filled glass with a chopstick, what is the sounding body?`),
   [P(`杯內空氣柱`,`Air column in the cup`),P(`杯外的空氣`,`The air outside it`),P(`水與玻璃杯`,`Water and the glass`),P(`敲杯的手指`,`The tapping finger`)],2,
   P(`敲打時發音體是「水 + 杯子」；吹氣時才是杯內的空氣柱。`,`When tapped, the sounding body is water plus the glass; blowing across the rim makes the air column the sounding body.`),
   P(`先分清楚題目是「敲」還是「吹」。`,`First check whether the question says tap or blow.`)),
  Q(P(`敲打玻璃杯時，杯子裡的水越多，音調會怎樣？`,`When tapping a glass, what happens to the pitch as more water is added?`),
   [P(`音調變高`,`Gets higher`),P(`音調變低`,`Drops lower`),P(`音量變大`,`Gets louder`),P(`音量變小`,`Gets softer`)],1,
   P(`水越多，水加杯子的質量越大、越不容易振動，頻率變低，音調變低。`,`More water means more mass that is harder to vibrate, so the frequency and pitch drop.`),
   P(`質量大的發音體，頻率是高還是低？`,`Is the frequency of a heavy source high or low?`)),
  Q(P(`對著杯口吹氣時，杯子裡的水越多，音調會怎樣？`,`When blowing across the rim, what happens to the pitch as more water is added?`),
   [P(`音調越來越低`,`Pitch falls`),P(`音調保持不變`,`Pitch stays`),P(`音量越來越大`,`Volume rises`),P(`音調越來越高`,`Pitch rises`)],3,
   P(`吹氣時發音體是空氣柱；水越多，空氣柱越短、質量越小、越容易振動，音調越高。`,`Blowing makes the air column the sounding body; more water shortens it, so it is lighter, vibrates faster and sounds higher.`),
   P(`水變多，空氣柱是變長還是變短？`,`As water rises, does the air column get longer or shorter?`))],
 '#mcq-resonance':[
  Q(P(`兩個發音體要發生共振，最先決條件是什麼？`,`What is the essential condition for two sounding bodies to resonate?`),
   [P(`聲音大小相同`,`Equal sound amplitude`),P(`形狀大小相同`,`Equal shape and size`),P(`材料質量相同`,`Equal masses of material`),P(`自然頻率相同`,`Same natural frequency`)],3,
   P(`共振的先決條件是自然頻率完全相同，大小聲（振幅）不同沒關係。`,`The prerequisite for resonance is exactly equal natural frequencies; different loudness does not matter.`),
   P(`兩把弦調得一模一樣，調的是什麼？`,`When two strings are tuned the same, what is matched?`)),
  Q(P(`吉他、提琴的木箱（共鳴箱）有什麼作用？`,`What does the wooden body (sound box) of a guitar or violin do?`),
   [P(`升高聲音的音調`,`Raises the sound pitch`),P(`增強聲音的響度`,`Makes the sound louder`),P(`加快聲音的速度`,`Speeds up the sound`),P(`降低聲音的頻率`,`Lowers the frequency`)],1,
   P(`共鳴箱藉由共振加強聲音的響度，讓聲音變大聲。`,`The sound box uses resonance to strengthen the sound and make it louder.`),
   P(`共鳴箱名稱裡的「鳴」，是增加還是減少聲音？`,`Does the sound box add to the sound or reduce it?`)),
  Q(P(`兩個頻率相同的音叉，敲擊的力量不同，還能共振嗎？`,`Two tuning forks have the same frequency but are struck with different force. Can they still resonate?`),
   [P(`不行，必須一樣大聲`,`No, the loudness must match`),P(`不行，力量必須相等`,`No, the force must be equal`),P(`可以，只要頻率相同`,`Yes, when frequencies match`),P(`不行，質量必須相等`,`No, the masses must be equal`)],2,
   P(`共振只要求頻率相同，振幅（大小聲）不同沒有影響。`,`Resonance only requires equal frequency; a different amplitude does not matter.`),
   P(`考試注意：先決條件只有一個。`,`Exam reminder: there is only one prerequisite.`))]
});
})();
