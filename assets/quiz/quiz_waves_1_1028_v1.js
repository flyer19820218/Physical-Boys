/* Multiple-choice practice for waves_1.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.tab-btn',keys:["intro","transverse","longitudinal","propagation","example"],into:'.wrap'});
LQ.addStatic('waves_1',{
 '#mcq-intro':[
  Q(P(`下列哪一種波不需要介質就能傳播？`,`Which of these waves can travel without a medium?`),
   [P(`水波與地震波`,`Water waves and seismic waves`),P(`聲波與彈簧波`,`Sound waves and spring waves`),P(`海浪與繩子波`,`Ocean waves and rope waves`),P(`光波與無線電`,`Light waves and radio waves`)],3,
   P(`光波、無線電波、X 射線是電磁波，真空中也能傳播；水波、聲波、彈簧波、地震波屬於力學波，必須靠介質。`,`Light, radio waves and X-rays are electromagnetic waves and travel through a vacuum; water, sound, spring and seismic waves are mechanical waves and need a medium.`),
   P(`想想太陽的光怎麼穿過幾乎沒有物質的太空到達地球。`,`Think how sunlight crosses nearly empty space to reach Earth.`)),
  Q(P(`上下甩動繩子形成的繩波，介質（繩子）的振動方向與波前進方向的關係是什麼？`,`For a rope wave made by flicking a rope up and down, how does the rope's motion relate to the wave's direction?`),
   [P(`互相垂直，屬於橫波`,`Perpendicular; a transverse wave`),P(`互相平行，屬於縱波`,`Parallel; it is a longitudinal wave`),P(`方向相反，屬於縱波`,`Opposite; it is a longitudinal wave`),P(`毫無關係，視速度而定`,`Unrelated; it depends on speed`)],0,
   P(`橫波的介質振動方向與波前進方向垂直，例如上下甩動的繩波、水波。`,`In a transverse wave the medium moves perpendicular to the wave direction, as in a rope wave or a water wave.`),
   P(`繩子上下動，波卻是沿著繩子往前跑。`,`The rope moves up and down, yet the wave runs along the rope.`)),
  Q(P(`海面上漂著一個保麗龍，海浪經過時，它會怎樣？`,`A piece of foam floats on the sea. What does it do as a wave passes?`),
   [P(`在原地上下浮動不被帶走`,`Bobs up and down in one place`),P(`會跟著海浪一起漂到岸邊`,`Drifts to the shore with waves`),P(`先向前移動再被推回原處`,`Moves forward and back again`),P(`隨著波速愈來愈快地前進`,`Speeds up as the wave speeds`)],0,
   P(`波傳遞的是能量與波形，介質只在原地振動，所以保麗龍只會上下浮動。`,`A wave carries energy and shape forward while the medium only vibrates in place, so the foam just bobs up and down.`),
   P(`觀察動畫中那顆亮紅色的介質點：波往前走，它走了嗎？`,`Watch the bright red medium point in the animation: the wave moves on, but does it?`))],
 '#mcq-transverse':[
  Q(P(`橫波中，「振幅」是指什麼？`,`In a transverse wave, what is the amplitude?`),
   [P(`相鄰兩波峰之間的水平距離`,`Horizontal distance between two crests`),P(`波峰到波谷之間的全部高度`,`Full height from a crest to a trough`),P(`波峰到平衡位置的垂直距離`,`Crest-to-equilibrium vertical distance`),P(`波在一秒內前進的距離`,`Distance the wave travels in one second`)],2,
   P(`振幅是波峰（或波谷）到平衡位置的垂直距離；振幅越大，波攜帶的能量越強。波峰到波谷的高度是振幅的兩倍。`,`Amplitude is the vertical distance from a crest or trough to the equilibrium position; a larger amplitude means more energy. Crest to trough is twice the amplitude.`),
   P(`按「標示 振幅 (A)」，看箭頭是從哪裡畫到哪裡。`,`Press "Show Amplitude (A)" and see where the arrow starts and ends.`)),
  Q(P(`一個完整波的長度（波長 λ）可以怎麼量？`,`How can the length of one complete wave (wavelength λ) be measured?`),
   [P(`只能從波峰量到相鄰波谷`,`Only from a crest to a trough`),P(`兩個相鄰波峰之間的距離`,`Between two neighboring crests`),P(`只能從平衡位置量到波峰`,`Only from equilibrium to a crest`),P(`波峰到波谷之間垂直高度`,`Height between crest and trough`)],1,
   P(`波長是「一個完整波」的長度，不只波峰到波峰，對應相位的平衡點之間也是一個波長。`,`The wavelength is the length of one complete wave: crest to crest, or between equilibrium points of the same phase.`),
   P(`按「標示 多種波長 (λ)」，看有幾種量法。`,`Press "Show Multiple Wavelengths (λ)" and count the ways to measure it.`)),
  Q(P(`振幅變大時，橫波的哪一個量會跟著變大？`,`When the amplitude of a transverse wave gets larger, what also gets larger?`),
   [P(`波本身的波長`,`Wavelength of the wave`),P(`波前進的方向`,`Direction the wave travels`),P(`波攜帶的能量`,`Energy carried by the wave`),P(`介質本身的種類`,`Type of medium it travels in`)],2,
   P(`振幅越大，波攜帶的能量越強；波長由波速和頻率決定，與振幅無關。`,`A larger amplitude means a more energetic wave; the wavelength is set by speed and frequency, not amplitude.`),
   P(`看「振幅 (A)」那一行的最後一句話。`,`Read the last sentence of the "Amplitude (A)" line.`))],
 '#mcq-longitudinal':[
  Q(P(`縱波中，「密部」是指介質分布的哪一個區域？`,`In a longitudinal wave, what is a compression?`),
   [P(`介質最稀疏壓力最小處`,`Most spread out, lowest pressure`),P(`介質完全靜止不動處`,`Completely still, no vibration`),P(`介質振動最慢的地方`,`Vibrating slowest, lowest speed`),P(`介質最密集壓力最大處`,`Most crowded, highest pressure`)],3,
   P(`密部是介質分布最密集、壓力最大的區域；疏部則是最稀疏、壓力最小的區域。`,`A compression is where the medium is most crowded and pressure is highest; a rarefaction is the sparsest, lowest-pressure region.`),
   P(`按「標示 密部」，看亮起來的是擠在一起還是分開的地方。`,`Press "Show Compressions" and see whether the lit area is crowded together or spread apart.`)),
  Q(P(`縱波的波長要怎麼量？`,`How is the wavelength of a longitudinal wave measured?`),
   [P(`相鄰兩密部中心的距離`,`Between adjacent compression centers`),P(`密部中心到疏部中心距離`,`Compression center to rarefaction center`),P(`只量單一個密部的寬度`,`Width of one single compression`),P(`整條彈簧自然的全長度`,`Total length of the whole spring`)],0,
   P(`縱波的波長是相鄰兩個密部中心，或相鄰兩個疏部中心之間的水平距離。`,`The wavelength of a longitudinal wave is the horizontal distance between adjacent compression centers or adjacent rarefaction centers.`),
   P(`按「標示 波長 (λ)」，看標示線連到哪兩個地方。`,`Press "Show Wavelength (λ)" and see which two places the marker joins.`)),
  Q(P(`說話時我們沒有吐出狂風，遠處的人為什麼聽得到？`,`We do not blow out a gale when we speak, so why can a distant person hear us?`),
   [P(`空氣整團直接衝到對方那裡`,`The air itself rushes to the listener`),P(`聲音是上下振動的橫波傳遞`,`It is a transverse up-down wave`),P(`空氣被擠壓形成疏密波傳出`,`Air is squeezed into a pressure wave`),P(`聲音完全不需要任何介質`,`It needs no medium to travel at all`)],2,
   P(`聲波是縱波：空氣分子前後振動，形成疏部與密部，波形往前傳，分子本身只在原地來回。`,`Sound is a longitudinal wave: air molecules vibrate back and forth making compressions and rarefactions that move on, while the molecules stay in place.`),
   P(`聲音是疏密波，介質前後推拉。`,`Sound is a compression wave: the medium is pushed and pulled back and forth.`))],
 '#mcq-propagation':[
  Q(P(`週期 T 是指什麼？`,`What is the period T?`),
   [P(`波源每秒振動的總次數`,`Vibrations made per second`),P(`一個完整波的長度大小`,`Length of one complete wave`),P(`波源振動一整次的時間`,`Time for one full vibration`),P(`波源振動的最大高度值`,`Greatest height of the motion`)],2,
   P(`週期是波源完成一次完整振動所需的時間；每秒振動的次數是頻率。`,`The period is the time for one complete vibration; vibrations per second is the frequency.`),
   P(`注意波源橘點上下一個來回要花多少時間。`,`Watch how long the orange source point takes to go up and back down once.`)),
  Q(P(`經過一個週期（t = 1 T）後，波形剛好向前傳遞了多遠？`,`After one period (t = 1 T), how far has the wave pattern moved forward?`),
   [P(`前進一個振幅`,`One amplitude`),P(`前進兩個波長`,`Two wavelengths`),P(`前進一個波長`,`One wavelength`),P(`前進半個波長`,`Half wavelength`)],2,
   P(`t = 1 T 時，波源回到原點，波形剛好向前傳遞 1 個波長。`,`At t = 1 T the source is back at the start and the wave pattern has moved forward exactly one wavelength.`),
   P(`拖曳滑桿到 t = 1 T，看波形比 t = 0 時前進了多少。`,`Drag the slider to t = 1 T and see how far the pattern has advanced from t = 0.`)),
  Q(P(`每移動一格（0.25 T），波源剛好移動多少？`,`For each step of 0.25 T, how far has the source moved?`),
   [P(`一個波長`,`One wavelength (λ)`),P(`半個振幅`,`Half an amplitude`),P(`兩個振幅`,`Two amplitudes (2A)`),P(`一個振幅`,`One amplitude (A)`)],3,
   P(`每經過 1/4 週期，波源由平衡位置到波峰（或波峰到平衡位置），剛好移動一個振幅。`,`Each quarter period the source moves from equilibrium to a crest (or back), exactly one amplitude.`),
   P(`看波源橘點每按一格移到哪個位置。`,`Watch where the orange source point sits after each step.`))],
 '#mcq-example':[
  Q(P(`橫波向右前進，判斷介質下一瞬間的動作，第一步要做什麼？`,`A transverse wave travels right. To find how the medium moves next, what is the first step?`),
   [P(`先確認波的前進方向`,`Confirm which way the wave travels`),P(`先量出整個波的波長`,`Measure the length of one whole wave`),P(`先算出波的週期大小`,`Calculate the period of one wave`),P(`先找出最大的振幅值`,`Find the largest wave amplitude`)],0,
   P(`第一步先確認波的前進方向；再畫出下一瞬間的虛線波形，最後從介質點畫垂直箭頭到虛線波。`,`First confirm the direction of travel; then draw the wave a moment later as a dashed line, and finally draw a vertical arrow from the medium point to it.`),
   P(`看「解題必殺技」的第一步。`,`Look at step one of "Problem-solving trick".`)),
  Q(P(`波向右前進時，下一瞬間的虛線波形應該畫在原波形的哪一邊？`,`The wave moves right. On which side of the original wave should the next-moment dashed wave be drawn?`),
   [P(`右邊一點點`,`A little to the right`),P(`左邊一點點`,`A little to the left`),P(`正上方一點點`,`Directly above the wave`),P(`與原波形重疊`,`Right on top of it`)],0,
   P(`波往右走，下一瞬間的波形就是整個圖形往右移一點點，所以虛線畫在原波形右邊。`,`The wave goes right, so a moment later the whole pattern has shifted slightly right: draw the dashed wave on the right.`),
   P(`波往哪走，圖形就往哪移。`,`The pattern shifts the way the wave travels.`)),
  Q(P(`橫波的介質點，箭頭應該怎麼畫才對？`,`For a transverse wave, how should the medium point's arrow be drawn?`),
   [P(`水平沿著波前進方向畫`,`Horizontal, along the wave path`),P(`斜向朝波峰的方向畫出`,`Slanted, pointing at the crests`),P(`畫成一個封閉的圓圈形`,`Drawn as one closed circle shape`),P(`垂直畫向虛線波上的點`,`Vertical, toward the dashed wave`)],3,
   P(`橫波的介質只能上下振動，所以箭頭是垂直的，朝虛線波的方向，箭頭朝哪介質就往哪動。`,`The medium of a transverse wave only moves up and down, so the arrow is vertical and points toward the dashed wave: the medium moves the way it points.`),
   P(`橫波的介質能不能沿著波的方向前後跑？`,`Can the medium of a transverse wave move back and forth along the wave direction?`))]
});
})();
