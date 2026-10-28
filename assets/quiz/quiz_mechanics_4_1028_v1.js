/* Multiple-choice practice for mechanics_4.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('mechanics_4',{
 '#tab-solid':[
  Q(P(`壓力的定義是什麼？`,`What is the definition of pressure?`),
   [P(`物體所受的全部作用力`,`The total force on an object`),P(`物體受力面積的大小`,`The size of the contact area`),P(`每單位面積的垂直力`,`Perpendicular force per area`),P(`垂直作用力乘以面積`,`Perpendicular force times area`)],2,
   P(`壓力 P ＝ 垂直作用力 F ÷ 受力面積 A，描述的是「力量集中的程度」，不是力本身。`,`Pressure P = perpendicular force F ÷ area A; it describes how concentrated a force is, not the force itself.`),
   P(`公式是 P ＝ F ÷ A。`,`The formula is P = F ÷ A.`)),
  Q(P(`用同樣的力壓氣球，為什麼單根圖釘比密集釘板更容易刺破氣球？`,`With the same force, why does a single pin burst a balloon more easily than a bed of pins?`),
   [P(`接觸面積小，壓力小`,`Small area gives less pressure`),P(`接觸面積小，壓力大`,`Small area gives more pressure`),P(`接觸面積大，壓力大`,`Large area gives more pressure`),P(`接觸面積不影響壓力`,`Area does not affect pressure`)],1,
   P(`力相同時，接觸面積越小壓力越大，容易刺穿；面積大則壓力分散。`,`For the same force, a smaller area means a larger pressure that easily pierces; a larger area spreads it out.`),
   P(`力相同，比較面積。`,`Same force; compare the areas.`)),
  Q(P(`重 500 gw 的磚塊，尺寸 10×5×2 cm，用最小面著地，壓力是多少？`,`A 500 gw brick measures 10×5×2 cm. What is the pressure when it stands on its smallest face?`),
   [P(`50 gw/cm²`,`50 gw/cm²`),P(`10 gw/cm²`,`10 gw/cm²`),P(`25 gw/cm²`,`25 gw/cm²`),P(`5 gw/cm²`,`5 gw/cm²`)],0,
   P(`最小面積 ＝ 5 × 2 ＝ 10 cm²，壓力 ＝ 500 ÷ 10 ＝ 50 gw/cm²；10 是誤用 10×5 的面，25 是誤用 10×2 的面。`,`The smallest face is 5 × 2 = 10 cm², so P = 500 ÷ 10 = 50 gw/cm²; 10 comes from the 10×5 face and 25 from the 10×2 face.`),
   P(`最大壓力要找最小的面。`,`Maximum pressure needs the smallest face.`))],
 '#tab-liquid':[
  Q(P(`液體壓力的公式是哪一個？`,`Which is the formula for liquid pressure?`),
   [P(`P ＝ F ÷ A`,`P = F ÷ A`),P(`P ＝ h ÷ D`,`P = h ÷ D`),P(`P ＝ m × g`,`P = m × g`),P(`P ＝ h × D`,`P = h × D`)],3,
   P(`液體壓力 P ＝ 深度 h × 密度 D，h 是從自由液面垂直往下算的深度。`,`Liquid pressure P = depth h × density D, where h is measured vertically down from the free surface.`),
   P(`與深度和液體密度有關。`,`It depends on depth and liquid density.`)),
  Q(P(`同一桶水，哪個洞的水流離開洞口時速度最快？`,`In one bucket of water, which hole sends out water the fastest?`),
   [P(`最淺的洞`,`The highest hole`),P(`最大的洞`,`The widest hole`),P(`最深的洞`,`The lowest hole`),P(`所有洞一樣快`,`All holes the same`)],2,
   P(`洞離自由液面的垂直深度越大，水壓越大，水流離開洞口時的速度越快。`,`The deeper a hole sits below the free surface, the greater the pressure and the faster the water leaves.`),
   P(`比較垂直深度 h。`,`Compare the vertical depth h.`)),
  Q(P(`有洞的容器密閉加蓋後，水會怎樣？`,`A container with a hole is sealed with a lid. What happens to the water?`),
   [P(`先流出少量就停止`,`A little flows then stops`),P(`一直流到全部流完`,`It all flows out steadily`),P(`完全不會有水流出`,`No water flows out at all`),P(`流得比開口時更快`,`It flows faster than open`)],0,
   P(`水流出後上方氣體體積增大、氣壓降低，內外壓力平衡後水就不再流出。`,`As water leaves, the gas above expands and its pressure falls until inside and outside balance and the flow stops.`),
   P(`上方的氣壓會跟著改變。`,`The gas pressure above also changes.`))],
 '#tab-vessel':[
  Q(P(`底部互相連通的容器裝入同一種靜止液體，各容器液面有什麼特點？`,`Containers joined at the bottom hold the same resting liquid. What is true of their surfaces?`),
   [P(`在同一水平高度`,`At exactly one level`),P(`管子越粗液面越高`,`Higher in wide tubes`),P(`管子越細液面越高`,`Higher in thin tubes`),P(`離入口越遠越高`,`Higher far from inlet`)],0,
   P(`連通管中，為了讓底部相通處的壓力平衡，各容器的液面必定維持在同一水平高度，與形狀、粗細無關。`,`In connected vessels, pressure balance at the bottom forces every surface to the same level, regardless of shape or width.`),
   P(`與管子的形狀、粗細無關。`,`It does not depend on shape or width.`)),
  Q(P(`自來水的水塔為什麼要蓋在高處？`,`Why are water towers built high up?`),
   [P(`讓水位比各家水龍頭低`,`Water sits below the taps`),P(`讓水塔看起來比較大`,`To make the tower look big`),P(`讓水溫保持比較高`,`To keep the water warm`),P(`讓水位比各家水龍頭高`,`Water sits above the taps`)],3,
   P(`水塔與各家水管相通，水面會推向同一水平；水塔位置高，水龍頭才有足夠的水壓出水。`,`The tower connects to the household pipes and the water tries to level out, so a high tower gives the taps enough pressure.`),
   P(`要利用連通管的原理。`,`Use the connected-vessel principle.`)),
  Q(P(`熱水瓶側面的水位視窗，用的是什麼原理？`,`What principle does a water-level window on a thermos use?`),
   [P(`帕斯卡原理傳遞壓力`,`Pascal's principle at work`),P(`浮力使水位上升`,`Buoyancy lifts the water`),P(`連通管液面等高`,`Connected tubes level out`),P(`大氣壓把水吸上去`,`Air pressure sucks it up`)],2,
   P(`水位視窗與瓶身底部相通，視窗內的液面與瓶內液面等高，所以能看出水位。`,`The window is joined to the bottle at the bottom, so its liquid level matches the level inside and shows the water height.`),
   P(`底部相通的容器。`,`Containers joined at the bottom.`))],
 '#tab-pascal':[
  Q(P(`帕斯卡原理說的是什麼？`,`What does Pascal's principle state?`),
   [P(`密閉流體的壓力等值傳遞`,`Pressure passes on in full`),P(`密閉流體的壓力逐漸遞減`,`Pressure fades along the fluid`),P(`流體壓力只向下傳遞`,`Pressure goes only downward`),P(`流體壓力與面積無關`,`Pressure ignores all area`)],0,
   P(`對密閉容器內的流體施壓，壓力會大小不變地傳遞到流體的每個角落。`,`Pressure applied to a confined fluid is transmitted undiminished to every part of the fluid.`),
   P(`關鍵字是「密閉」與「不變」。`,`The keywords are "confined" and "undiminished".`)),
  Q(P(`千斤頂小活塞施力 5 kgw，大活塞面積是小活塞的 20 倍，大活塞可以舉起多重？`,`A jack's small piston gets 5 kgw and the large piston has 20 times the area. How much can the large piston lift?`),
   [P(`400 kgw`,`400 kgw`),P(`100 kgw`,`100 kgw`),P(`25 kgw`,`25 kgw`),P(`4 kgw`,`4 kgw`)],1,
   P(`F小／A小 ＝ F大／A大，面積 20 倍，推力也是 20 倍：5 × 20 ＝ 100 kgw。`,`F_small/A_small = F_large/A_large, so with 20 times the area the force is 20 times: 5 × 20 = 100 kgw.`),
   P(`推力與活塞面積成正比。`,`Force is proportional to piston area.`)),
  Q(P(`液壓千斤頂以小力舉起重物，大活塞移動的距離會怎樣？`,`A hydraulic jack lifts a heavy load with a small force. How far does the large piston move?`),
   [P(`比小活塞移動得少`,`Less than the small piston`),P(`比小活塞移動得多`,`More than the small piston`),P(`與小活塞移動一樣多`,`The same as the small piston`),P(`完全不會移動`,`It does not move at all`)],0,
   P(`以小搏大並沒有省功，大活塞推力大但移動距離小，兩邊排開的液體體積相同。`,`The jack does not save work: the large piston pushes harder but moves less, because both sides displace the same volume of liquid.`),
   P(`兩邊移動的液體體積相同。`,`Both sides displace the same volume.`))]
});
})();
