/* Multiple-choice practice for optics_5.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
if(window.McqTabs)McqTabs.mount({buttons:'.mode-switch button',keys:["rainbow","pixel","fitting","escape","advanced"],before:'footer'});
LQ.addStatic('optics_5',{
 '#mcq-rainbow':[
  Q(P(`白光通過三稜鏡後被分成彩色光帶，最根本的原因是什麼？`,`Why does white light split into a band of colors after a prism?`),
   [P(`各色光速率不同`,`Speeds differ among colors`),P(`白光被染上顏色`,`The prism paints the light`),P(`玻璃自己會發光`,`The glass glows by itself`),P(`光被稜鏡吸收變色`,`The prism absorbs the white`)],0,
   P(`各色光在玻璃中的速率不同，進出三稜鏡時偏折程度不同，原本重疊的色光就被分開。`,`Different colors travel at different speeds in glass, so they bend by different amounts and the overlapping colors separate.`),
   P(`想想折射的原因是光速改變。`,`Recall that refraction is caused by a change of speed.`)),
  Q(P(`白光通過三稜鏡時，哪一種色光偏折最多？`,`Which color bends the most when white light passes through a prism?`),
   [P(`紫色光`,`Violet light`),P(`橙色光`,`Orange light`),P(`綠色光`,`Green light`),P(`黃色光`,`Yellow light`)],0,
   P(`紫光在玻璃中速率最慢、偏折最多；紅光偏折最少。`,`Violet travels slowest in glass and bends the most; red bends the least.`),
   P(`色帶最外側的兩端，一端是紅色。`,`Red is at one end of the band; the other end is the answer.`)),
  Q(P(`關於白光被拆成彩色，下列哪一個說法正確？`,`Which statement about white light splitting into colors is correct?`),
   [P(`稜鏡替白光上了色`,`The prism dyes the white light`),P(`重疊的色光被分開`,`Mixed colors are split apart`),P(`稜鏡製造出新色光`,`The prism creates new colors`),P(`白光被稜鏡吸收了`,`The prism soaks up the white`)],1,
   P(`白光不是被染色，而是原本重疊的色光被分開。`,`White light is not dyed; its overlapping colors are simply separated.`),
   P(`白光裡面原本就有各種色光。`,`White light already contains all the colors.`))],
 '#mcq-pixel':[
  Q(P(`手機螢幕的子像素是哪三種顏色的發光點？`,`Which three colored emitters make up a phone screen subpixel set?`),
   [P(`紅、黃、藍`,`Red, yellow, blue`),P(`紅、綠、藍`,`Red, green, blue`),P(`紅、黃、綠`,`Red, yellow, green`),P(`白、紅、藍`,`White, red, blue`)],1,
   P(`螢幕用紅、綠、藍三種光合成各種顏色，稱為加法混色。`,`A screen mixes red, green and blue light to make all colors: additive mixing.`),
   P(`畫面上的 RGB 三個字母代表什麼顏色？`,`What colors do the letters RGB stand for?`)),
  Q(P(`紅光與綠光同時進入眼睛，大腦會感覺到什麼顏色？`,`Red and green light enter the eye together. What color does the brain sense?`),
   [P(`白色光`,`White light`),P(`青色光`,`Cyan light`),P(`紫色光`,`Violet light`),P(`黃色光`,`Yellow light`)],3,
   P(`加法混色：紅 + 綠 = 黃。`,`Additive mixing: red + green = yellow.`),
   P(`試著在調色台把藍光關到 0。`,`Try setting the blue slider to 0 on the mixer.`)),
  Q(P(`螢幕上紅、綠、藍三種光都開到很強時，會看到什麼？`,`What do you see when red, green and blue are all turned up strongly?`),
   [P(`接近黑色`,`Close to black`),P(`接近紅色`,`Close to red`),P(`接近灰色`,`Close to gray`),P(`接近白色`,`Close to white`)],3,
   P(`光源直接發光，三色都強時加在一起接近白色。`,`The sources emit light directly, so with all three strong the mix approaches white.`),
   P(`加法混色是越加越亮還是越暗？`,`Does additive mixing get brighter or darker as you add?`))],
 '#mcq-fitting':[
  Q(P(`不透明物體呈現的顏色，是由什麼決定的？`,`What decides the color an opaque object appears to have?`),
   [P(`吸收進物體的色光`,`Light absorbed by the object`),P(`物體自己發出的光`,`Light the object makes itself`),P(`反射進眼睛的色光`,`Light reflected into the eye`),P(`燈泡本身的顏色`,`The color of the bulb itself`)],2,
   P(`物體不會自己發光，只有真正反射進入眼睛的色光，才成為我們看見的物體顏色。`,`Objects do not emit light; only the colors actually reflected into the eye give the color we see.`),
   P(`被吸收的光，眼睛看得到嗎？`,`Can the eye see light that was absorbed?`)),
  Q(P(`紅色衣服在綠色燈光下，看起來會是什麼顏色？`,`What color does a red shirt look under green light?`),
   [P(`接近黑色`,`Nearly black`),P(`依然鮮紅`,`Still vivid red`),P(`變成綠色`,`Turns green`),P(`變成黃色`,`Turns yellow`)],0,
   P(`紅衣服主要反射紅光，綠光照射時沒有紅光可反射，看起來接近黑色。`,`A red shirt mainly reflects red; green light has no red to reflect, so it looks nearly black.`),
   P(`綠光裡有紅光嗎？`,`Is there any red in green light?`)),
  Q(P(`白色衣服在藍色燈光下，看起來是什麼顏色？`,`What color does a white shirt look under blue light?`),
   [P(`呈現白色`,`Looks white`),P(`呈現黃色`,`Looks yellow`),P(`呈現藍色`,`Appears blue`),P(`呈現黑色`,`Looks black`)],2,
   P(`白衣服會反射所有照到的色光，現在只有藍光，所以反射藍光，看起來是藍色。`,`A white shirt reflects every color that hits it; only blue light arrives, so it looks blue.`),
   P(`眼睛實際收到哪一種光？`,`Which light actually reaches the eye?`))],
 '#mcq-escape':[
  Q(P(`黑底白字的卡片上有一顆紅愛心，哪兩種燈光會讓愛心消失？`,`A red heart sits on a black-and-white card. Which two lights make the heart vanish?`),
   [P(`紅光與綠光`,`Red and green light`),P(`紅光與白光`,`Red and white light`),P(`綠光與藍光`,`Green and blue light`),P(`白光與藍光`,`White and blue light`)],2,
   P(`紅愛心主要反射紅光；只有綠光或藍光照射時，沒有紅光可反射，愛心就融入黑色背景。`,`The heart reflects mostly red; under only green or blue light there is no red to reflect, so it merges into the black.`),
   P(`哪些燈光裡含有紅光？`,`Which lights contain red?`)),
  Q(P(`紅愛心在綠光下「隱形」，真正的原因是什麼？`,`What is the real reason the red heart "disappears" under green light?`),
   [P(`照到的光沒有紅光`,`There is no red light to reflect`),P(`愛心把所有光放大`,`The heart magnifies all the light`),P(`愛心被燈光染成黑`,`The lamp dyes the heart black`),P(`黑色背景變成紅色`,`The black background glows red`)],0,
   P(`愛心沒有可反射的紅光，所以顯暗；愛心並沒有真的變色。`,`There is no red for the heart to reflect, so it looks dark; it has not really changed color.`),
   P(`愛心本身的材質有沒有改變？`,`Did the heart's material change?`)),
  Q(P(`下列哪一種燈光下，還看得見紅愛心？`,`Under which light can the red heart still be seen?`),
   [P(`紅光或白光`,`Red or white light`),P(`綠光或藍光`,`Green or blue light`),P(`綠光或青光`,`Green or cyan light`),P(`藍光或青光`,`Blue or cyan light`)],0,
   P(`紅光和白光（含紅光）照射時，仍有紅光反射進眼睛，所以看得見。`,`Red and white light both contain red, which is reflected into the eye, so the heart stays visible.`),
   P(`要看得見紅愛心，光裡必須有哪一種色光？`,`Which color must the light contain for the heart to be seen?`))],
 '#mcq-advanced':[
  Q(P(`光在雨滴內的反射次數，虹與霓有什麼不同？`,`How do the primary and secondary rainbows differ in reflections inside a raindrop?`),
   [P(`虹兩次、霓一次`,`Primary twice, secondary once`),P(`兩者都只一次`,`Both reflect exactly once`),P(`虹一次、霓兩次`,`Primary once, secondary twice`),P(`兩者都是兩次`,`Both reflect exactly twice`)],2,
   P(`一次反射送出虹光，兩次反射送出霓光。`,`One internal reflection gives the primary bow; two give the secondary bow.`),
   P(`動畫裡先追蹤一次反射，再追蹤兩次反射。`,`The animation traces one reflection, then two.`)),
  Q(P(`虹和霓比較，哪一個比較亮？`,`Comparing the primary and secondary rainbows, which is brighter?`),
   [P(`霓較亮虹較暗`,`Secondary is brighter`),P(`兩者一樣亮`,`Both are equally bright`),P(`虹較亮霓較暗`,`Primary is brighter`),P(`兩者都看不到`,`Neither can be seen`)],2,
   P(`虹約 40°～42° 且較亮；霓約 50°～54° 且較暗。`,`The primary bow is at about 40°–42° and brighter; the secondary at 50°–54° and fainter.`),
   P(`多反射一次，光會變強還是變弱？`,`Does one extra reflection make the light stronger or weaker?`)),
  Q(P(`同一顆水滴為什麼能同時出現在你的霓與別人的虹上？`,`Why can one raindrop be part of your secondary bow and someone else's primary bow?`),
   [P(`水滴會自己變化`,`The drop changes by itself`),P(`觀察者的位置不同`,`Viewers see from other angles`),P(`太陽高度一直在變`,`The Sun height keeps changing`),P(`水滴稍後變成了冰`,`The drop turns into ice later`)],1,
   P(`水滴沒有改變，是觀察位置決定哪一道光進入誰的眼睛。`,`The drop does not change; the observer's position decides which ray reaches whose eye.`),
   P(`切換小晴、小宇兩位觀察者看看。`,`Switch between the two observers and compare.`))]
});
})();
