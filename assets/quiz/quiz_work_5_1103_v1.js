(()=>{'use strict';
const LQ=window.LessonQuiz;
if(!LQ||!LQ.addStatic)return;
const {P,Q}=LQ;
LQ.addStatic('work_5',{
'#tab1':[
Q(P('鈾-235 吸收一顆中子後，分裂成鋇-141、氪-92 和幾顆中子？','Uranium-235 absorbs a neutron and splits into barium-141, krypton-92 and how many neutrons?'),
[P('1 顆','1 neutron'),P('3 顆','3 neutrons'),P('0 顆','0 neutrons'),P('6 顆','6 neutrons')],1,
P('3 顆。質量數：235＋1＝141＋92＋3＝236。','3 neutrons. Mass number: 235 + 1 = 141 + 92 + 3 = 236.'),
P('先算左邊的質量數，再讓右邊相等。','Add the mass numbers on the left, then make the right side equal.')),
Q(P('核分裂放出能量，主要是因為什麼？','Where does the energy of fission mainly come from?'),
[P('質量少一點變成能量','Lost mass turns into energy'),P('中子碰撞摩擦而發熱','Friction heats the nucleus'),P('電子從核裡被釋放','Electrons escape the nucleus'),P('鈾與水發生化學反應','Uranium reacts with water')],0,
P('分裂後總質量少了約 0.1%，依 E＝mc² 變成能量。','The total mass drops by about 0.1% and becomes energy by E = mc².'),
P('想想 E＝mc² 裡的 m 指什麼。','Think about what the m in E = mc² refers to.')),
Q(P('核電廠裡，「控制棒」的作用是什麼？','In a nuclear plant, what do the control rods do?'),
[P('讓中子跑得更快','Speed up the neutrons'),P('把熱傳給冷卻水','Pass heat to the water'),P('吸收多餘的中子','Absorb extra neutrons'),P('提供更多鈾燃料','Supply more uranium')],2,
P('控制棒（含硼、鎘等）吸收中子，讓平均每次分裂只引起約 1 次新的分裂。','Control rods (with boron or cadmium) absorb neutrons so each fission causes on average about 1 new fission.'),
P('控制棒和「控制」連在一起。','The name says it: they control the reaction.')),
Q(P('為什麼要用水讓快中子「減速」？','Why use water to slow down the fast neutrons?'),
[P('慢中子較易被鈾吸收','U-235 absorbs slow neutrons best'),P('慢中子的質量較大','Slow neutrons have more mass'),P('慢中子可直接發電','Slow neutrons make power directly'),P('慢中子不會被吸收掉','Slow neutrons are never absorbed')],0,
P('鈾-235 對慢中子的吸收機率高很多，所以反應爐需要減速劑。','U-235 absorbs slow neutrons far more readily, so reactors need a moderator.'),
P('想想為什麼分裂放出的是快中子，卻要先減速。','Fission emits fast neutrons, yet they are slowed first. Why?'))
],
'#tab2':[
Q(P('核電廠裡，能量轉換的順序是哪一個？','Which is the correct energy conversion order in a nuclear plant?'),
[P('核能 → 電能 → 熱能 → 動能','Nuclear → electrical → heat → kinetic'),P('熱能 → 核能 → 動能 → 電能','Heat → nuclear → kinetic → electrical'),P('核能 → 熱能 → 動能 → 電能','Nuclear → heat → kinetic → electrical'),P('動能 → 核能 → 熱能 → 電能','Kinetic → nuclear → heat → electrical')],2,
P('核分裂產生熱，熱產生蒸氣推動渦輪（動能），發電機再把動能變成電能。','Fission makes heat, heat makes steam that spins the turbine (kinetic), and the generator turns that into electricity.'),
P('反應爐只負責「產生熱」。','The reactor only makes heat.')),
Q(P('發電機能發電，是利用什麼原理？','What principle lets a generator produce electricity?'),
[P('靜電感應','Electrostatic induction'),P('電磁感應','Electromagnetic induction'),P('電流的熱效應','The heating effect of current'),P('光電效應','The photoelectric effect')],1,
P('磁鐵在線圈中旋轉，線圈磁通量改變，產生感應電流。','A magnet spins in a coil, the flux through the coil changes, and an induced current flows.'),
P('磁鐵＋線圈＋轉動。','Magnet + coil + rotation.')),
Q(P('一座核電廠的熱功率是 3000 MW，效率約 1/3，大約可以輸出多少電功率？','A nuclear plant has 3000 MW of thermal power and about 1/3 efficiency. About how much electric power can it output?'),
[P('約 3000 MW','About 3000 MW'),P('約 1000 MW','About 1000 MW'),P('約 100 MW','About 100 MW'),P('約 9000 MW','About 9000 MW')],1,
P('3000 × 1/3 ＝ 1000 MW，其餘約 2000 MW 是廢熱。','3000 × 1/3 = 1000 MW; the other 2000 MW is waste heat.'),
P('輸出的電不可能比輸入的熱多。','Electric output cannot exceed the thermal input.'))
],
'#tab3':[
Q(P('太陽發光的能量，主要來自什麼反應？','What reaction mainly powers the Sun\'s light?'),
[P('煤炭燃燒','Coal burning in its core'),P('鈾核分裂','Uranium fission in the core'),P('氫核融合成氦','Hydrogen fusing to helium'),P('氦核衰變成氫','Helium decaying to hydrogen')],2,
P('太陽核心 4 個氫核融合成 1 個氦核，少掉的質量變成能量。','In the core, four hydrogen nuclei fuse into one helium nucleus, and the missing mass becomes energy.'),
P('太陽的主要成分是氫。','The Sun is mostly hydrogen.')),
Q(P('太陽中心的氫核為什麼需要上千萬度的高溫才能融合？','Why do hydrogen nuclei in the Sun need ten million degrees or more to fuse?'),
[P('要克服核間電斥力','To beat the repulsion between nuclei'),P('高溫讓氫變成固體','To turn the hydrogen into a hard solid'),P('高溫使氫質量變大','To make the nuclei become heavier'),P('高溫使核彼此吸引','To make nuclei attract each other')],0,
P('原子核都帶正電，互相排斥；要靠得夠近才會融合，因此需要極高的速度（高溫）。','Nuclei are all positively charged and repel; they must move very fast (high temperature) to get close enough to fuse.'),
P('質子和質子之間有什麼力？','What force acts between two protons?')),
Q(P('太陽能穩定發光、不爆炸也不塌縮，是因為什麼達到平衡？','Why does the Sun shine steadily without exploding or collapsing?'),
[P('重力向內、壓力向外','Gravity inward, pressure outward'),P('磁力向內、光壓向外','Magnetism inward, sunlight outward'),P('地球引力與太陽斥力','Earth\'s pull and the Sun\'s push'),P('氫與氦的重量相同','Hydrogen and helium weigh equal')],0,
P('重力與核融合產生的壓力互相抵消，太陽就能維持穩定大小約 100 億年。','Gravity and fusion pressure cancel, so the Sun keeps a steady size for about 10 billion years.'),
P('兩個方向相反的力。','Two forces in opposite directions.'))
],
'#tab4':[
Q(P('為什麼輕核融合和重核分裂「都」會放出能量？','Why do both fusion of light nuclei and fission of heavy nuclei release energy?'),
[P('兩者都會產生高溫','Both create extremely high heat'),P('兩者都走向穩定核','Both head for more stable nuclei'),P('兩者都需要有中子','Both always need free neutrons'),P('兩者都使原子序變大','Both raise the atomic number a lot')],1,
P('鐵附近每個核子的束縛能最大，輕核與重核都往那裡靠近，多出來的能量釋放出去。','Binding energy per nucleon peaks near iron. Light and heavy nuclei both move toward it, releasing the surplus energy.'),
P('看束縛能曲線的最高點。','Look at the peak of the binding-energy curve.')),
Q(P('同樣 1 公斤燃料，哪個放出的能量比較大？','For the same 1 kg of fuel, which releases more energy?'),
[P('鈾分裂放得較多','Uranium fission releases more'),P('氫變氦放得較多','Hydrogen fusion releases more'),P('兩者放得一樣多','Both release the same amount'),P('煤燃燒放得較多','Burning coal releases more')],1,
P('氫變氦約 6×10¹⁴ J/kg，鈾-235 約 8×10¹³ J/kg。','Hydrogen to helium gives about 6×10¹⁴ J/kg; uranium-235 about 8×10¹³ J/kg.'),
P('比較兩個數量級。','Compare the two orders of magnitude.')),
Q(P('核反應後少了 0.001 kg 的質量，約釋放多少能量？（c＝3×10⁸ m/s）','A nuclear reaction loses 0.001 kg of mass. About how much energy is released? (c = 3×10⁸ m/s)'),
[P('9×10¹³ J','9×10¹³ J'),P('3×10⁵ J','3×10⁵ J'),P('9×10⁵ J','9×10⁵ J'),P('3×10¹¹ J','3×10¹¹ J')],0,
P('E＝mc²＝0.001×(3×10⁸)²＝9×10¹³ J。','E = mc² = 0.001 × (3×10⁸)² = 9×10¹³ J.'),
P('光速要平方。','The speed of light is squared.'))
],
'#tab5':[
Q(P('地球上的人造太陽，主要選用哪一種燃料？','Which fuel do artificial Suns on Earth mainly use?'),
[P('氘和氚','Deuterium and tritium'),P('鈾和鈽','Uranium and plutonium'),P('一般的氧和氮','Oxygen and nitrogen gases'),P('鐵和鎳','Iron and nickel metals')],0,
P('氘＋氚是最容易融合的組合，約一億度就能點燃。','Deuterium + tritium is the easiest pair to fuse, igniting at about a hundred million degrees.'),
P('是氫的兩種較重的同位素。','Two heavier isotopes of hydrogen.')),
Q(P('托卡馬克用什麼把一億度的電漿關住？','What does a tokamak use to hold plasma at a hundred million degrees?'),
[P('厚厚的鉛牆','A very thick lead wall'),P('液態的水槽','A huge tank of water'),P('玻璃真空管','A glass vacuum chamber'),P('強大的磁場','Strong magnetic fields')],3,
P('沒有材料碰得起一億度，所以用強磁場把帶電的電漿懸在半空。','No material can touch a hundred million degrees, so strong magnetic fields suspend the charged plasma in mid-air.'),
P('電漿裡的粒子帶電。','The particles in plasma are charged.'))
]
});
})();
