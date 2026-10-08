/* 4-2: original textbook evidence + original explicit transport models. */
(()=>{'use strict';const B=LivingBook;
const choice=(label,key,value)=>({label,key,value}),source=(file,name,page,figure)=>({file,name,page,figure});
const atlas='../ch4_plant_structure_1008_v1/plant_atlas_native2.png';
function panel(c,D,x,y,w,h){D.round(c,x,y,w,h,14,'#f9f7ec','#799486');}
function conduit(c,D,x,y,w,h,color){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#2b5144');g.addColorStop(.18,color);g.addColorStop(.5,'#eef8ec');g.addColorStop(.82,color);g.addColorStop(1,'#2b5144');D.round(c,x,y,w,h,12,g,color);}
function sugarRoute(c,s,t,D){panel(c,D,26,40,535,530);D.focus(c,atlas,[.075,.115,.59,.37],[35,70,515,455]);D.text(c,['課本原圖：葉的維管束','Textbook leaf vascular bundles'],48,550,{color:'#1c3d34',size:24,max:485});const top=s.case==='leaf'?['葉：供應部位','Leaf: sugar source']:['新芽：需求部位','Shoot: sugar sink'],bottom=s.case==='leaf'?['根：需求部位','Root: sugar sink']:['儲藏根：供應部位','Storage root: sugar source'];D.text(c,top,760,75,{align:'center',max:350});D.text(c,bottom,760,540,{align:'center',max:360});conduit(c,D,715,110,90,370,'#fb923c');for(let y=160;y<465;y+=85)D.line(c,[[718,y],[802,y]],'#b98b41',4);const route=s.case==='leaf'?[[760,127],[760,465]]:[[760,465],[760,127]];D.flow(c,route,t,5,(cx,x,y)=>D.sugar(cx,x,y,18));D.text(c,['韌皮部','Phloem'],625,315,{max:140,size:24,color:'#fb923c'});D.hit(715,110,90,370,'case',s.case==='leaf'?'root':'leaf');D.status(s.case==='leaf'?['蔗糖向下：成熟葉 → 根；點管道切換情境。','Downward sucrose: mature leaf → root. Tap tube to switch.']:['蔗糖向上：儲藏根 → 新芽；供需改變，路線也改變。','Upward sucrose: storage root → shoot. Source and sink set direction.']);}
function rootModel(c,s,t,D){
 panel(c,D,20,40,270,520);panel(c,D,310,40,630,520);
 D.text(c,['課本原圖','Textbook photograph'],155,76,{align:'center',color:'#1c3d34',size:22,max:245});
 D.image(c,'root_photo.png',32,95,246,400);
 D.text(c,['發芽種子的根毛','Seedling root hairs'],155,530,{align:'center',color:'#1c3d34',size:22,max:248});
 D.text(c,['表皮細胞伸出細長的根毛','Long hairs extend from epidermal cells'],625,77,{align:'center',color:'#1c3d34',max:585});
 // Each hair and its cell body share ONE closed outline: no wall across the neck.
 function cell(x,y,w,h,tip,bend=0){
  const mid=y+h/2,g=c.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,'#fff5d6');g.addColorStop(1,'#e8cca0');
  c.save();c.beginPath();c.moveTo(x+10,y);c.quadraticCurveTo(x,y,x,y+10);
  c.lineTo(x,y+h-10);c.quadraticCurveTo(x,y+h,x+10,y+h);c.lineTo(x+w-10,y+h);
  c.quadraticCurveTo(x+w,y+h,x+w,y+h-10);
  if(tip){
   c.lineTo(x+w,mid+20);c.quadraticCurveTo(x+w+5,mid+6,x+w+29,mid+12);
   c.bezierCurveTo(x+w+75,mid+26,tip-94,mid+bend-5,tip-18,mid+bend+8);
   c.quadraticCurveTo(tip+6,mid+bend+12,tip+3,mid+bend+2);
   c.quadraticCurveTo(tip-3,mid+bend-10,tip-23,mid+bend-9);
   c.bezierCurveTo(tip-98,mid+bend-22,x+w+90,mid+6,x+w+34,mid-6);
   c.quadraticCurveTo(x+w+5,mid-18,x+w,mid-24);
  }
  c.lineTo(x+w,y+10);c.quadraticCurveTo(x+w,y,x+w-10,y);c.closePath();
  c.fillStyle=g;c.fill();c.lineJoin='round';c.strokeStyle='#947453';c.lineWidth=6;c.stroke();
  c.strokeStyle='#fff5d680';c.lineWidth=2;c.stroke();c.restore();
  D.sphere(c,x+w*.38,mid+9,8,'#ae86c2');
 }
 for(let row=0;row<5;row++)cell(335,116+row*78,46,74);
 for(let row=0;row<4;row++)cell(385,116+row*98,48,94);
 for(let row=0;row<6;row++)cell(437,116+row*65,72,61,({1:824,3:746,5:887})[row],({1:4,3:10,5:4})[row]||0);
 D.text(c,['根的內側','Inside root'],332,106,{color:'#506b57',size:22,max:150});
 D.text(c,['土壤溶液','Soil solution'],875,119,{align:'right',color:'#506b57',size:22,max:235});
 D.text(c,['表皮細胞','Epidermal cell'],555,155,{color:'#1c3d34',size:22,max:230});D.line(c,[[548,161],[505,147]],'#947453',2);
 D.text(c,['根毛：細長突起','Root hair: long outgrowth'],650,290,{color:'#1c3d34',size:22,max:265});D.line(c,[[725,298],[715,338]],'#947453',2);
 D.text(c,['細胞核','Nucleus'],570,432,{color:'#775184',size:22,max:145});D.line(c,[[564,425],[465,416]],'#775184',2);
 const routes=[[[694,184],[694,224],[568,227],[485,224]],[[650,305],[650,355],[568,352],[485,354]]];
 for(const route of routes)D.flow(c,s.soil==='fresh'?route:[...route].reverse(),t,3,(cx,x,y)=>D.water(cx,x,y,11));
 for(const [x,y] of [[827,154],[853,273],[871,367],[738,406],[807,502]])D.sphere(c,x,y,s.soil==='salty'?7:4,'#fb923c');
 D.text(c,['根毛不是另一顆細胞，是表皮細胞的延伸','A root hair is an extension, not a separate cell'],625,548,{align:'center',color:'#1c3d34',size:22,max:595});
 D.status(s.soil==='fresh'?['水由根毛表面跨膜進入；不是從尖端像吸管吸水。','Water crosses the hair surface; the tip is not a drinking straw.']:['外液過濃時，水的淨移動可由根毛向外。','Concentrated surroundings can draw water out through the hair surface.']);
}
function transpire(c,s,t,D){
 const rates={baseline:1,wind:1.6,humid:.5,drought:.2},closed=s.condition==='drought';
 panel(c,D,20,40,270,520);panel(c,D,310,40,630,520);
 D.text(c,['課本氣孔原圖','Textbook stoma'],155,76,{align:'center',color:'#1c3d34',size:22,max:245});
 D.image(c,closed?'stoma_closed.png':'stoma_open.png',33,104,244,350);
 D.text(c,closed?['缺水：氣孔趨向關閉','Water stress: closure']:['張開的氣孔','An open stoma'],155,490,{align:'center',color:'#1c3d34',size:22,max:245});
 D.text(c,['蒸散拉動連續水柱','Transpiration pulls a water column'],625,77,{align:'center',color:'#1c3d34',max:580});
 // Leaf section: a real gap in the epidermis opens into the internal air space.
 D.round(c,341,162,425,20,9,'#a9c984','#718d62');D.round(c,824,162,94,20,9,'#a9c984','#718d62');
 D.round(c,341,295,192,23,9,'#a9c984','#718d62');D.round(c,646,295,272,23,9,'#a9c984','#718d62');
 for(const [x,y,w,h] of [[351,191,69,90],[427,191,62,90],[499,188,71,67],[674,252,76,37],[830,191,70,91]]){
  const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#daedaa');g.addColorStop(1,'#95bf70');
  D.round(c,x,y,w,h,16,g,'#729a58');D.sphere(c,x+w*.3,y+h*.4,6,'#6b9f47');
 }
 const gap=closed?4:24;
 D.round(c,795-gap/2-31,154,31,39,15,'#91bd66','#668d47');D.round(c,795+gap/2,154,31,39,15,'#91bd66','#668d47');
 D.text(c,closed?['關閉','Closed']:['氣孔','Stoma'],919,151,{align:'right',color:'#1c3d34',size:22,max:105});
 D.text(c,['葉內空氣間隙','Leaf air space'],688,348,{color:'#506b57',size:22,max:238});D.line(c,[[715,324],[735,249]],'#718d62',2);
 // Xylem walls end inside the leaf. There is no cap over the water column.
 const g=c.createLinearGradient(541,0,640,0);g.addColorStop(0,'#459cab');g.addColorStop(.5,'#def6ef');g.addColorStop(1,'#459cab');
 c.fillStyle=g;c.fillRect(541,296,99,209);D.line(c,[[541,297],[541,505]],'#53bdd1',3);D.line(c,[[640,297],[640,505]],'#53bdd1',3);
 D.line(c,[[541,297],[570,274],[638,258]],'#53bdd1',3);D.line(c,[[640,297],[661,275],[680,264]],'#53bdd1',3);
 c.save();c.beginPath();c.ellipse(590,505,49,11,0,0,Math.PI);c.strokeStyle='#53bdd1';c.lineWidth=3;c.stroke();c.restore();
 D.text(c,['木質部','Xylem'],667,421,{color:'#287f95',size:24,max:230});
 D.text(c,['根部持續補水','Water supplied from roots'],590,548,{align:'center',color:'#1c3d34',size:22,max:390});
 const liquid=[[590,497],[590,298],[624,270],[680,254]],vapour=[[680,254],[739,232],[793,197],[798,153],[880,101]];
 function along(points,u){const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),sum=lengths.reduce((a,b)=>a+b,0);let d=Math.max(0,Math.min(1,u))*sum,i=0;while(i<lengths.length-1&&d>lengths[i])d-=lengths[i++];const f=d/lengths[i];return[points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];}
 // Matching phase at u=1: the leading molecule evaporates, then releases its neighbour.
 const phase=(t*rates[s.condition]*.32)%1,spacing=1/7,chain=[];
 for(let i=0;i<=7;i++){const u=(i+phase)*spacing;if(u<=1)chain.push({u,p:along(liquid,u)});}
 function hands(a,b,fade=1){c.save();c.globalAlpha=fade;c.strokeStyle='#c78f68';c.lineWidth=5;c.lineCap='round';const mx=(a[0]+b[0])/2+33,my=(a[1]+b[1])/2;
  c.beginPath();c.moveTo(a[0]+12,a[1]+2);c.quadraticCurveTo(mx+5,a[1]+7,mx,my+2);c.stroke();
  c.beginPath();c.moveTo(b[0]+12,b[1]+2);c.quadraticCurveTo(mx+5,b[1]-6,mx,my-2);c.stroke();
  c.beginPath();c.ellipse(mx,my,7,6,-.3,0,Math.PI*2);c.fillStyle='#fff4db';c.fill();c.strokeStyle='#b68b62';c.lineWidth=1;c.stroke();
  c.beginPath();c.moveTo(mx-4,my-1);c.lineTo(mx+3,my-1);c.moveTo(mx-4,my+2);c.lineTo(mx+3,my+2);c.stroke();
  c.beginPath();c.ellipse(mx-6,my-3,3,2,.5,0,Math.PI*2);c.fill();c.stroke();c.restore();}
 for(let i=0;i<chain.length-1;i++)hands(chain[i].p,chain[i+1].p);
 const flying=closed?null:along(vapour,Math.min(1,phase*1.18));
 if(flying&&phase<.25)hands(chain.at(-1).p,flying,1-phase/.25);
 for(const {p} of chain)D.water(c,...p,19);
 if(!closed){D.water(c,...flying,19);for(let i=1;i<3;i++)D.water(c,...along(vapour,Math.min(1,(phase+i)/3)),15);}
 D.text(c,['牽手＝分子間吸引力（不是化學鍵）','Hands = attraction, not chemical bonds'],624,584,{align:'center',size:22,max:630});
 D.status(closed?['氣孔關閉使蒸散減少，水柱上升也減慢。','Closure reduces evaporation and slows the upward column.']:['葉內水分蒸發 → 水蒸氣由氣孔散出 → 牽動水柱向上補位。','Leaf water evaporates, vapour exits through the stoma, and the water column is pulled upward.']);
}
const labText=[
 ['先預測：染液會出現在莖的哪一部分？','Predict where the coloured solution will appear in the stem.'],
 ['準備 5 mL 紅色溶液；切口在水中完成，避免空氣進入導管。','Prepare 5 mL red solution; cut underwater to avoid air entering the vessels.'],
 ['把切好的莖浸入紅色溶液；保持葉片與莖的連接。','Immerse the cut stem in the red solution, leaving stem and leaves connected.'],
 ['實際靜置約 30 分鐘；本頁為時間壓縮示意，不是實測速度。','In the actual experiment, wait about 30 minutes. This is a time-compressed model, not a measured rate.'],
 ['由老師操作刀片，做橫切與縱切；切片放在玻片上觀察。','The teacher makes cross and longitudinal sections with a blade and places them on slides.'],
 ['木質部被染紅：觀察局部紅色區，不是整個莖都變紅。','The xylem is stained red: observe specific coloured regions, not an entirely red stem.']
];
function celery(c,s,t,D){
 if(s.step===5){panel(c,D,20,30,445,530);panel(c,D,495,30,445,530);D.image(c,'stem_cross.png',36,75,413,430);D.image(c,'stem_long.png',510,75,413,430);D.text(c,['金魚草莖橫切','Snapdragon: cross section'],242,540,{align:'center',color:'#1c3d34',max:410});D.text(c,['金魚草莖縱切','Snapdragon: longitudinal section'],718,540,{align:'center',color:'#1c3d34',max:410});return;}
 panel(c,D,20,35,300,530);D.image(c,'celery_whole.png',35,82,270,425);
 D.text(c,['金魚草（雙子葉植物）','Snapdragon (dicot)'],170,65,{color:'#1c3d34',align:'center',size:22,max:280});
 D.text(c,['課本原圖：切莖浸染液','Textbook: cut stem in dye'],170,542,{color:'#1c3d34',align:'center',size:22,max:280});
 panel(c,D,340,35,600,530);
 D.text(c,['立體莖剖面：維管束環狀排列','Stem cutaway: a ring of vascular bundles'],640,73,{align:'center',color:'#1c3d34',max:570});
 const cx=580,top=184,bottom=460,rx=151,ry=58;
 const ellipse=(x,y,a,b,fill,stroke)=>{c.beginPath();c.ellipse(x,y,a,b,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
 ellipse(cx,bottom+17,166,37,'#486f4d25');
 const skin=c.createLinearGradient(cx-rx,0,cx+rx,0);skin.addColorStop(0,'#58864a');skin.addColorStop(.38,'#abd080');skin.addColorStop(1,'#38673f');
 c.fillStyle=skin;c.fillRect(cx-rx,top,rx*2,bottom-top);ellipse(cx,bottom,rx,ry,skin,'#617b47');
 // An opened front face exposes a symmetric pair of bundles; the top shows the full ring.
 const face=c.createLinearGradient(cx-112,0,cx+112,0);face.addColorStop(0,'#d4dea3');face.addColorStop(.5,'#f3eed0');face.addColorStop(1,'#ccd69a');
 c.fillStyle=face;c.fillRect(cx-112,top,224,bottom-top);ellipse(cx,bottom,112,43,face);
 const pith=c.createLinearGradient(cx-42,0,cx+42,0);pith.addColorStop(0,'#e3e5b9');pith.addColorStop(.5,'#fcf4d9');pith.addColorStop(1,'#d7dcae');
 D.round(c,cx-42,top+26,84,bottom-top-26,20,pith,'#c1ca96');
 const elapsed=Math.max(0,t-s.start),rise=s.step>=4?1:Math.min(elapsed/8,1);
 for(const side of [-1,1]){
  const x=cx+side*81,outer=x+side*24;
  conduit(c,D,outer-8,top+26,16,bottom-top-28,'#fb923c');
  conduit(c,D,x-15,top+26,30,bottom-top-28,'#55e9ff');
  for(let y=top+55;y<bottom-5;y+=32)D.line(c,[[x-11,y],[x+11,y-4]],'#348b9b',2);
  if(s.step>=2){c.save();c.beginPath();c.rect(x-10,top+30,20,bottom-top-34);c.clip();c.fillStyle='#cd4e6899';c.fillRect(x-10,bottom-(bottom-top-30)*rise,20,(bottom-top-30)*rise+2);
   if(s.step>=3)D.flow(c,[[x,bottom-13],[x,top+36]],t,5,(ctx,xx,yy)=>D.water(ctx,xx,yy,11));c.restore();}
 }
 ellipse(cx,top,rx,ry,'#e0e5b6','#668b50');ellipse(cx,top,rx-13,ry-6,'#f5edc4','#a8b877');
 for(let i=0;i<10;i++){
  const a=i*Math.PI*2/10,x=cx+Math.cos(a)*111,y=top+Math.sin(a)*40;
  ellipse(x,y,14,9,'#edc187','#a78651');
  ellipse(x-Math.cos(a)*5,y-Math.sin(a)*2,8,6,s.step>=4?'#cd4e68':'#55bdd1','#398d9e');
  ellipse(x+Math.cos(a)*8,y+Math.sin(a)*3,4,3,'#fb923c');
 }
 ellipse(cx,top,55,23,'#f7f0d8','#c6cc9f');
 D.text(c,['髓','Pith'],cx,top+8,{align:'center',color:'#6d754a',size:22,max:100});
 D.text(c,['木質部（內側）','Xylem: inside'],833,316,{align:'center',color:'#287f95',size:22,max:203});D.line(c,[[787,326],[cx+81,354]],'#287f95',2);
 D.text(c,['韌皮部（外側）','Phloem: outside'],833,397,{align:'center',color:'#a66223',size:22,max:203});D.line(c,[[796,405],[cx+105,429]],'#a66223',2);
 D.text(c,['染液走木質部，不是整個莖染紅','Dye follows xylem, not the whole stem'],640,550,{align:'center',color:'#1c3d34',size:22,max:575});
 D.status(labText[s.step]);
}
function whole(c,s,t,D){panel(c,D,18,20,584,558);const im=D.image(c,atlas,30,30,560,540);const map=p=>im?p.map(([x,y])=>[im.x+im.w*x,im.y+im.h*y]):[];const routes={water:map([[.727,.985],[.727,.855],[.727,.353],[.588,.265],[.36,.285],[.212,.308]]),sugarDown:map([[.209,.342],[.38,.307],[.582,.275],[.718,.355],[.718,.855],[.718,.968]]),sugarUp:map([[.718,.968],[.718,.855],[.718,.41],[.738,.008]])};if(s.path==='water')D.flow(c,routes.water,t,8,(cx,x,y)=>D.water(cx,x,y,12));else D.flow(c,routes[s.path],t,6,(cx,x,y)=>D.sugar(cx,x,y,15));const labels=s.path==='water'?[['根毛吸水','Root uptake'],['木質部上升','Xylem transport'],['葉面蒸散','Leaf transpiration']]:s.path==='sugarDown'?[['成熟葉製造養分','Mature leaf makes sugars'],['韌皮部向下輸送','Downward phloem flow'],['根部使用或儲藏','Root use or storage']]:[['根部儲藏養分分解','Stored reserves mobilised'],['韌皮部向上輸送','Upward phloem flow'],['新芽生長','Shoot growth']];labels.forEach((p,i)=>{D.round(c,623,85+i*157,316,110,15,'#1c3d34','#47675d');D.text(c,p,782,150+i*157,{align:'center',max:290});});D.status(['藍色木質部運水；橘色韌皮部運蔗糖。原圖不改形狀。','Blue xylem carries water; orange phloem carries sucrose. The textbook anatomy is unchanged.']);}
const waterDrivers=["蒸散：葉內水分蒸發並由氣孔散出，拉動連續水柱，是主要動力。\n毛細作用：水附著管壁、分子彼此吸引，幫助水在細管內上升；單靠它不足以送到高樹頂端。\n根壓（與滲透作用有關）：根部累積溶質，水跨膜進入，使木質部產生向上的推力；不能單獨解釋高樹運水。\n牽手是分子間吸引力的卡通比喻，不是化學鍵或真正的手。","Transpiration: leaf evaporation and vapour loss pull the continuous water column upward; this is the main driver.\nCapillarity: attraction to tube walls and between water molecules helps water rise in narrow tubes, but cannot by itself supply a tall treetop.\nRoot pressure (linked to osmosis): solute accumulation promotes water entry into roots and creates an upward push in xylem; it cannot alone supply tall trees.\nHands are a cartoon metaphor for attraction, not chemical bonds or real hands."];
const tabs=[
 {id:'sourceSink',title:['養分今天送去哪裡？','Where do sugars go?'],sub:['供應與需求','Sources and sinks'],hook:['成熟葉能送養分到根；春天還沒長好葉子，新芽的養分又是誰送來？','Leaves supply roots. Before new leaves grow in spring, who supplies the shoots?'],body:['光合作用製造的養分可轉成蔗糖，經韌皮部送到需要的部位。成熟葉常是供應部位；根、果實與新芽可能是需求部位。儲藏器官也能轉為供應部位。','Products of photosynthesis can be converted to sucrose and transported in phloem. Mature leaves are often sources; roots, fruits and shoots can be sinks. Storage organs can later become sources.'],closure:['先找「哪裡供應、哪裡需要」，再判斷蔗糖的方向。韌皮部能向上也能向下運輸；不是同一條管永遠雙向對流。','Identify the source and sink before deciding direction. Phloem transport can be upward or downward; a single tube is not always carrying opposing streams.'],sources:[source(atlas,['根、莖、葉剖面','Root, stem and leaf cutaway'],89,'3-1')],init:()=>({running:true,case:'leaf'}),controls:s=>[{label:['切換供需情境','Source–sink scenario'],items:[choice(['成熟葉 → 根','Leaf → root'],'case','leaf'),choice(['儲藏根 → 新芽','Storage root → shoot'],'case','root')]}],explain:s=>({title:s.case==='leaf'?['向下送，不代表只能向下','Downward does not mean downward only']:['供需改變，方向反轉','A change in supply changes the route'],text:s.case==='leaf'?['成熟葉製造養分，蔗糖向下送到根部，供使用或儲藏。點選「儲藏根 → 新芽」，比較另一種情境。','Sucrose from a mature leaf moves downward to roots for use or storage. Select “Storage root → shoot” to compare the opposite case.']:['儲藏養分可分解、轉成可運輸的蔗糖，向上供應新芽。蔗糖用相接六角形與五角形辨識，不畫化學鍵。','Stored reserves can be mobilised and converted to transportable sucrose for growing shoots. Touching hexagon and pentagon symbols identify sucrose; no chemical bonds are drawn.']}),draw:sugarRoute,check:s=>({direction:s.case==='leaf'?'down':'up',conduit:'phloem'})},
 {id:'rootHair',title:['根毛怎麼吸到水？','How do root hairs take up water?'],sub:['表面積與滲透','Surface area and osmosis'],hook:['根不是吸管！根毛這麼細，卻能接觸更多土壤中的水，為什麼？','Roots are not drinking straws. How do tiny hairs increase contact with soil water?'],body:['根毛不是另一顆獨立的細胞，而是根的表皮細胞向外延伸的細長突起，增加吸收的表面積。水跨過細胞膜的淨移動與內外溶液條件有關；根部還能吸收礦物質，但礦物質不是靠滲透作用吸收。','A root hair is a long outgrowth of a root epidermal cell, not a separate cell. It increases absorption area. Net water movement across membranes depends on conditions inside and outside. Mineral uptake is not osmosis.'],closure:['根毛增加接觸面積；水以滲透作用跨膜。不要把「水和礦物質一起上行」誤寫成「兩者都靠滲透進根」。','Root hairs increase contact area; water crosses membranes by osmosis. Water and minerals can travel upward together, but they do not both enter roots by osmosis.'],sources:[source('root_photo.png',['根毛的真實照片','Root-hair photograph'],96,'3-9A')],init:()=>({running:true,soil:'fresh'}),controls:s=>[{label:['外部溶液條件','External solution'],items:[choice(['一般土壤溶液','Ordinary soil solution'],'soil','fresh'),choice(['外液過濃','Very concentrated solution'],'soil','salty')]}],explain:s=>({title:s.soil==='fresh'?['水的淨移動進入根毛','Net water entry']:['外液過濃，吸水不一定成功','Concentrated surroundings can reverse flow'],text:s.soil==='fresh'?['根毛的細長突起與表皮細胞本體相連，細胞核留在本體內。水從根毛表面跨過細胞膜，不是只從尖端吸入。動畫呈現淨方向；實際水分子仍可雙向跨膜。礦物質不以滲透作用吸收。','The long hair is continuous with the epidermal cell; its nucleus stays in the cell body. Water crosses the hair surface, not just the tip. Motion shows net entry; individual water molecules can move both ways. Minerals are not taken up by osmosis.']:['當外部溶液過濃，水可能由細胞向外淨移動。施肥不是越多越好；本圖是定性示意，不代表精確鹽度或吸水速率。','A highly concentrated external solution can draw water out of cells. More fertiliser is not always better. This qualitative diagram does not show a measured salinity or uptake rate.']}),draw:rootModel,check:s=>({netWater:s.soil==='fresh'?'in':'out',mineralOsmosis:false})},
 {id:'transpiration',title:['水怎麼爬上高樹？','How does water rise in a tall tree?'],sub:['蒸散與氣孔','Transpiration and stomata'],hook:['高樹沒有心臟，把水拉到葉片的主要動力，竟和水「離開」葉片有關。','A tall tree has no heart. A major driver of upward water transport is water leaving its leaves.'],body:['根吸收的水沿木質部上升。葉內水分蒸發，再由氣孔散失，產生拉力；水分子彼此吸引，使連續水柱向上補位。蒸散是主要動力，毛細作用與根壓也有幫助，但不能把三者當成同等力量。缺水時，保衛細胞使氣孔趨向關閉，減少散失。','Water rises in xylem. Evaporation inside leaves and vapour loss through stomata create a pull; attraction between water molecules maintains a continuous column. Transpiration is the main driver. Capillarity and root pressure also contribute, but are not equally important. Guard cells can close stomata during water stress.'],closure:['比較風或濕度時只改一個因素；保持其他條件相同。蒸散不是葉片主動把水一顆顆「泵」上來。','Change one factor when comparing wind or humidity and hold others constant. Leaves do not actively pump water molecules upward one by one.'],sources:[source('stoma_open.png',['張開氣孔顯微照片','Open stoma micrograph'],97,'3-11A'),source('stoma_closed.png',['關閉氣孔顯微照片','Closed stoma micrograph'],97,'3-11B')],init:()=>({running:true,condition:'baseline'}),controls:s=>[{label:['和基準比較，每次改一項','Compare one change with the reference'],items:[choice(['基準條件','Reference'],'condition','baseline'),choice(['風較強','Stronger wind'],'condition','wind'),choice(['濕度較高','Higher humidity'],'condition','humid'),choice(['根部缺水','Water stress'],'condition','drought')]}],explain:s=>({title:['水柱上行，水蒸氣散出','Liquid water rises; vapour escapes'],text:({baseline:["水以液態在木質部中移動；在葉內蒸發後，水蒸氣經氣孔散出。\n\n蒸散：葉內水分蒸發並由氣孔散出，拉動連續水柱，是主要動力。\n毛細作用：水附著管壁、分子彼此吸引，幫助水在細管內上升；單靠它不足以送到高樹頂端。\n根壓（與滲透作用有關）：根部累積溶質，水跨膜進入，使木質部產生向上的推力；不能單獨解釋高樹運水。\n牽手是分子間吸引力的卡通比喻，不是化學鍵或真正的手。","Water rises as liquid in xylem, evaporates inside the leaf, and exits as vapour through the stoma.\n\nTranspiration: leaf evaporation and vapour loss pull the continuous water column upward; this is the main driver.\nCapillarity: attraction to tube walls and between water molecules helps water rise in narrow tubes, but cannot by itself supply a tall treetop.\nRoot pressure (linked to osmosis): solute accumulation promotes water entry into roots and creates an upward push in xylem; it cannot alone supply tall trees.\nHands are a cartoon metaphor for attraction, not chemical bonds or real hands."],wind:['其他條件相同且氣孔開放時，風加速移走葉面附近水蒸氣，通常促進蒸散。運動畫面只表示相對趨勢。','With other conditions unchanged and stomata open, wind removes vapour near the leaf and usually increases transpiration. Motion shows a qualitative trend only.'],humid:['空氣較潮濕時，葉片內外的水蒸氣差距較小，蒸散通常減慢。水柱不是被切斷，而是流動趨勢減弱。','Higher humidity reduces the vapour difference between leaf and air, usually slowing transpiration. The water column remains continuous.'],drought:['根部缺水可使氣孔趨向關閉，減少水分散失，也限制氣體交換；不能簡化成「白天一定開、晚上一定關」。','Water stress can promote stomatal closure, reducing water loss and restricting gas exchange. Stomata are not invariably open by day and closed by night.']})[s.condition]}),draw:transpire,check:s=>({qualitative:true,condition:s.condition})},
 {id:'celeryLab',title:['紅色染液走哪條路？','Which route does red dye take?'],sub:['水分運輸實驗','Water-transport experiment'],hook:['染液讓看不見的水路顯形。先預測，再用橫切和縱切找證據。','Dye reveals an invisible water route. Predict first, then compare cross and longitudinal sections.'],body:['課本照片是金魚草：雙子葉植物，莖的維管束環狀排列；不是散生。立體剖面是教學模型，不代表實際維管束的數目。依實驗 3-2：準備紅色溶液、在水中切莖、浸入染液，約 30 分鐘後觀察，再由老師切片。實作也可選課本列出的芹菜等植物。','The textbook plant is snapdragon, a dicot with stem vascular bundles arranged in a ring, not scattered. The cutaway is a teaching model; bundle counts are illustrative. Experiment 3-2 uses red solution and an underwater stem cut, followed by about 30 minutes of observation and teacher-made sections. Celery is another permitted practical specimen.'],closure:['染色證據支持木質部運輸水分。不能只看植物變紅，就宣稱每一種組織都負責運水。','Stained tissue supports the role of xylem in water transport. A coloured plant does not prove that every tissue carries water.'],sources:[source('celery_whole.png',['染液中的金魚草','Snapdragon in dye'],96,'3-8'),source('stem_cross.png',['莖橫切觀察','Stem cross section'],96,'3-8B'),source('stem_long.png',['莖縱切觀察','Stem longitudinal section'],96,'3-8C')],init:()=>({running:true,step:0,start:0,prediction:'none'}),controls:s=>[{label:['先預測染色部位','Predict the stained tissue'],items:[choice(['木質部','Xylem'],'prediction','xylem'),choice(['整個莖','The entire stem'],'prediction','whole'),choice(['韌皮部','Phloem'],'prediction','phloem')]},{label:['依序操作','Follow the sequence'],items:[{...choice(['下一步','Next step'],'action','next'),disabled:s.prediction==='none'||s.step>=5},choice(['重新實驗','Restart'],'action','restart')]}],act(s,k,v){if(k!=='action')s[k]=v;else if(v==='restart')Object.assign(s,{step:0,prediction:'none',start:s.elapsed});else if(s.prediction!=='none'&&s.step<5){s.step++;s.start=s.elapsed;}},explain:s=>({title:s.step===5?['把預測與原圖證據比較','Compare your prediction with the evidence']:['實驗進度 · '+s.step+'/5','Experiment stage · '+s.step+'/5'],text:[labText[s.step][0]+'\n\n'+waterDrivers[0]+'\n\n本實驗用的是切下的莖，沒有根，不能把染液上升歸因於根壓。',labText[s.step][1]+'\n\n'+waterDrivers[1]+'\n\nThis experiment uses a cut stem with no roots; root pressure cannot explain its dye uptake.']}),draw:celery,check:s=>({step:s.step,actualWaitMinutes:30,volumeML:5,teacherBlade:true})},
 {id:'wholePlant',title:['讓整株植物動起來','Bring the whole plant to life'],sub:['吸收、製造與運輸','Uptake, production and transport'],hook:['水和糖不是同一條路。追蹤一種物質，把根、莖、葉的功能接起來。','Water and sugar do not share one transport route. Follow one substance to connect root, stem and leaf functions.'],body:['根吸水，木質部將水與礦物質送向地上部；葉綠體在光照等條件下製造養分。可運輸的蔗糖由韌皮部送到需要的部位，供生長、使用或儲藏。','Roots take up water; xylem carries water and minerals toward the shoots. Chloroplasts produce sugars under suitable conditions. Phloem distributes transportable sucrose for growth, use or storage.'],closure:['根不是從土裡吸收現成糖作主要食物來源；葉是主要光合作用器官，但儲藏器官也會供應新生部位。','Roots do not mainly obtain ready-made sugars as food from soil. Leaves are major photosynthetic organs, and storage organs can supply new growth.'],sources:[source(atlas,['根、莖、葉的維管束相連','Connected root, stem and leaf vascular bundles'],89,'3-1')],init:()=>({running:true,path:'water'}),controls:s=>[{label:['追蹤一條完整路線','Trace one complete route'],items:[choice(['水：根 → 葉','Water: root → leaf'],'path','water'),choice(['蔗糖：葉 → 根','Sucrose: leaf → root'],'path','sugarDown'),choice(['蔗糖：根 → 新芽','Sucrose: root → shoot'],'path','sugarUp')]}],explain:s=>({title:['位置、管道、方向一起看','Connect location, conduit and direction'],text:s.path==='water'?['水分子由根部上行，再進入葉的木質部。藍色表示木質部，不是把水畫成藍色原子；水分子沿用大氧、兩個小氫的辨識符號。','Water rises from roots and enters leaf xylem. Blue identifies xylem, not blue water atoms. Water symbols retain one oxygen and two smaller hydrogen spheres.']:['蔗糖用相接的六角形與五角形辨識。先找供應部位與需求部位，決定向上或向下的路線；橘色管道是韌皮部。','Touching hexagon and pentagon symbols identify sucrose. Locate the source and sink to determine upward or downward flow in orange phloem.']}),draw:whole,check:s=>({path:s.path,sucroseBidirectional:true})}
];
B.register({id:'plant',section:'4-2',title:['植物體內物質的運輸','Transport within plants'],subtitle:['從根毛吸水，到糖的供需路線：把課本裡的運輸看活。','From root-hair uptake to sugar source–sink routes: watch textbook transport come alive.'],cover:'assets/covers/biology_plant_1008_v1.png',tabs});
})();
