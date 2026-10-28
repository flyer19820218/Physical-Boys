/* Multiple-choice practice for electromagnetic_induction_4.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('electromagnetic_induction_4',{
 '#history':[
  Q(P(`把磁鐵停在線圈正中央，磁場很強，電流計會持續偏轉嗎？`,`A magnet is held still at the center of a coil, with a strong field. Will the galvanometer stay deflected?`),
   [P(`會，磁場很強就有電`,`Yes, a strong field gives it`),P(`會，磁鐵靠得越近越大`,`Yes, nearer means larger`),P(`不會，磁通量沒有改變`,`No, flux is not changing`),P(`不會，線圈沒有電阻`,`No, a coil has no resistance`)],2,
   P(`感應電流需要的是磁通量「改變」；磁鐵停止後磁通量不再改變，感應電流回到 0。`,`Induction needs a CHANGE in flux; once the magnet stops the flux no longer changes and the induced current returns to zero.`),
   P(`感應電流需要的是磁通量「改變」。`,`Induction requires a change in magnetic flux.`)),
  Q(P(`磁鐵相對線圈移動得越快，感應電流會怎樣？`,`The faster a magnet moves relative to a coil, what happens to the induced current?`),
   [P(`越大，磁通量變化較快`,`Larger, flux changes faster`),P(`越小，磁通量變化較快`,`Smaller, flux changes faster`),P(`不變，只與磁場有關`,`Same, only the field counts`),P(`越大，磁場變得更小`,`Larger, the field gets smaller`)],0,
   P(`相對移動越快，磁場改變越快，感應電壓和感應電流越大。`,`The faster the relative motion, the faster the field changes, and the larger the induced voltage and current.`),
   P(`關鍵是磁場改變的快慢。`,`The key is how fast the field changes.`)),
  Q(P(`冷次定律說明感應電流的磁場有什麼特性？`,`What does Lenz's law say about the field of the induced current?`),
   [P(`加強原本磁通量的變化`,`It boosts the flux change`),P(`反抗原本磁通量的變化`,`It opposes the flux change`),P(`與原本磁場完全無關`,`It is unrelated to the field`),P(`永遠指向線圈的右邊`,`It always points to the right`)],1,
   P(`感應電流產生的磁場，方向總是反抗原本磁通量的改變。`,`The field of the induced current always opposes the change of the original flux.`),
   P(`「反抗」是關鍵字。`,`"Opposes" is the keyword.`))],
 '#generator':[
  Q(P(`直流發電機能輸出方向固定的電流，靠的是哪個零件？`,`Which part lets a DC generator give current of constant direction?`),
   [P(`場磁鐵`,`The field magnet`),P(`軟鐵芯`,`The soft iron core`),P(`分裂環`,`The split ring`),P(`整個線圈`,`The whole coil`)],2,
   P(`分裂環每半圈交換接點，把輸出波形翻轉成同一方向的直流脈衝。`,`The split ring swaps contacts every half turn, flipping the output into pulses of one direction.`),
   P(`每半圈會換向的零件。`,`The part that switches every half turn.`)),
  Q(P(`發電機轉得更快，交流電波形會有哪兩個改變？`,`When a generator rotates faster, which two changes occur in the AC waveform?`),
   [P(`頻率變低、最大值變大`,`Lower frequency, larger peak`),P(`頻率變高、最大值變大`,`Higher frequency, larger peak`),P(`頻率變高、最大值變小`,`Higher frequency, smaller peak`),P(`頻率不變、最大值變大`,`Same frequency, larger peak`)],1,
   P(`轉得越快每秒完成更多圈，頻率提高；磁通量改變得更快，感應電壓的最大值也提高。`,`Faster rotation means more turns per second, so the frequency rises, and the flux changes faster, so the peak voltage rises too.`),
   P(`每秒圈數變多，而且磁通量改變得更快。`,`More turns each second, and faster flux change.`)),
  Q(P(`發電機把哪一種能量轉換成電能？`,`Which kind of energy does a generator convert into electric energy?`),
   [P(`熱能（燒熱線圈）`,`Heat energy from heating`),P(`光能（照射線圈）`,`Light shining on the coil`),P(`動能（外力轉動）`,`Kinetic energy, spinning`),P(`化學能（電池）`,`Chemical energy of a cell`)],2,
   P(`發電機由外力轉動線圈，切割磁力線，把動能轉換成電能。`,`An external force turns the coil through the field, converting kinetic energy into electric energy.`),
   P(`線圈是被外力轉動的。`,`The coil is turned by an outside force.`))],
 '#transformer':[
  Q(P(`變壓器中，一次線圈與二次線圈的電壓關係式是什麼？`,`What is the voltage relation between the primary and secondary coils of a transformer?`),
   [P(`Vs／Vp ＝ Np／Ns`,`Vs/Vp = Np/Ns`),P(`Vs／Vp ＝ Ns／Np`,`Vs/Vp = Ns/Np`),P(`Vs × Vp ＝ Ns × Np`,`Vs×Vp = Ns×Np`),P(`Vs － Vp ＝ Ns － Np`,`Vs−Vp = Ns−Np`)],1,
   P(`同一側線圈圈數越多，感應電壓越大，所以電壓比等於匝數比：Vs／Vp ＝ Ns／Np。`,`More turns on a coil give a larger voltage, so the voltage ratio equals the turns ratio: Vs/Vp = Ns/Np.`),
   P(`電壓與匝數成正比。`,`Voltage is proportional to turns.`)),
  Q(P(`一次線圈 100 匝接 220 V，二次線圈 50 匝，輸出約多少伏特？`,`The primary coil has 100 turns on 220 V and the secondary has 50 turns. What is the approximate output?`),
   [P(`440 V`,`440 V`),P(`220 V`,`220 V`),P(`110 V`,`110 V`),P(`550 V`,`550 V`)],2,
   P(`Vs ＝ 220 × 50 ÷ 100 ＝ 110 V（降壓）；440 V 是把匝數比顛倒了。`,`Vs = 220 × 50 ÷ 100 = 110 V (step-down); 440 V results from inverting the turns ratio.`),
   P(`二次匝數少於一次匝數。`,`The secondary has fewer turns than the primary.`)),
  Q(P(`變壓器為什麼不能用直流電來改變電壓？`,`Why can a transformer not change a DC voltage?`),
   [P(`直流電的電壓特別地低`,`DC voltage is always low`),P(`直流電無法通過導線`,`DC cannot pass in wires`),P(`直流電會融化軟鐵芯`,`DC melts the soft iron core`),P(`直流僅在通斷時變化`,`DC only changes at switch`)],3,
   P(`變壓器靠變化的磁場感應電壓；直流電只在接通、切斷瞬間磁場才改變，無法持續變壓。`,`A transformer relies on a changing field; DC changes the field only at the moment of switching on or off, so it cannot keep transforming voltage.`),
   P(`要有持續改變的磁場。`,`The field has to keep changing.`))],
 '#cooker':[
  Q(P(`電磁爐能加熱金屬鍋，靠的是鍋底產生什麼？`,`An induction cooker heats a metal pot by producing what in the pot base?`),
   [P(`火焰`,`Naked flames`),P(`渦電流`,`Eddy currents`),P(`紅外線`,`Infrared light`),P(`靜電`,`Static charge`)],1,
   P(`爐內線圈通交流電使磁通量改變，金屬鍋底因此產生環狀感應電流（渦電流）。`,`Alternating current in the coil changes the flux, so a ring-shaped induced current (eddy current) appears in the pot base.`),
   P(`鍋底出現了環狀感應電流。`,`A ring-shaped induced current appears in the base.`)),
  Q(P(`渦電流是怎麼讓鍋子發熱的？`,`How do eddy currents make the pot hot?`),
   [P(`金屬電阻使電能變熱`,`Resistance turns it to heat`),P(`電流使金屬變成磁鐵`,`Current makes metal magnetic`),P(`磁場直接把鍋子燒熱`,`The field heats it directly`),P(`鍋底吸收了空氣的熱`,`The base absorbs air heat`)],0,
   P(`能量流程：電能 → 改變的磁場 → 渦電流 → 熱，金屬的電阻讓電能轉換成熱。`,`The energy chain is electric energy → changing field → eddy currents → heat, with the metal's resistance turning electric energy into heat.`),
   P(`電流通過電阻會發熱。`,`Current through resistance gives heat.`)),
  Q(P(`為什麼電磁爐不能加熱陶瓷或玻璃鍋？`,`Why can an induction cooker not heat a ceramic or glass pot?`),
   [P(`不導電，不會生渦電流`,`No conduction, no eddies`),P(`陶瓷太重，爐子推不動`,`Ceramic is too heavy to lift`),P(`玻璃會把磁場完全吸光`,`Glass absorbs all the field`),P(`陶瓷的溫度本來就很低`,`Ceramic is already cold`)],0,
   P(`陶瓷與玻璃是絕緣體，磁通量改變時產生不了感應電流，所以無法發熱。`,`Ceramic and glass are insulators, so a changing flux cannot drive an induced current and no heat is produced.`),
   P(`要有導體才能產生電流。`,`A conductor is needed for current.`))]
});
})();
