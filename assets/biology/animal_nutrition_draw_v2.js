(function(root){'use strict';const A=root.AnimalData,W=960,H=660;
 const C={white:'#f2ecd9',yellow:'#fde047',teal:'#55e9ff',green:'#4ade80',pink:'#f472b6',orange:'#fb923c',deep:'#0b1a15',muted:'#b6c9bf'};
 function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
 function linesFor(c,t,max){const words=String(t).split(/(\s+|(?<=[\u3000-\u9fff]))/u);let line='',lines=[];for(const w of words){if(c.measureText(line+w).width>max&&line){lines.push(line.trim());line=w}else line+=w}if(line)lines.push(line.trim());return lines}
 function text(c,t,x,y,size=24,color=C.white,align='center',max=900){c.font=`700 ${size}px "Noto Sans TC"`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;const lines=linesFor(c,t,max);lines.forEach((l,i)=>c.fillText(l,x,y+i*(size*1.35)));return lines.length}
 function bg(c){c.clearRect(0,0,W,H);let g=c.createRadialGradient(490,250,10,480,330,580);g.addColorStop(0,'#254c40');g.addColorStop(1,C.deep);c.fillStyle=g;c.fillRect(0,0,W,H)}
 function ball(c,x,y,r,col){let g=c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);g.addColorStop(0,'#fff6e1');g.addColorStop(.25,col);g.addColorStop(1,col==C.orange?'#a5572a':col==C.pink?'#7b335b':'#8a771b');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle=C.white;c.lineWidth=1.4;c.stroke()}
 function sugar(c,x,y,r=22,col=C.yellow){let g=c.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,'#fff2ac');g.addColorStop(.5,col);g.addColorStop(1,'#b89026');c.beginPath();for(let i=0;i<6;i++){let a=i*Math.PI/3-Math.PI/6;let xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;i?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#fff0c1';c.lineWidth=2;c.stroke()}
 function amino(c,x,y,i=0,r=20){const cols=[C.pink,'#cfa9ed','#eeab76'];if(i%3===0)ball(c,x,y,r,cols[0]);else{c.save();c.translate(x,y);c.rotate(i%3===1?.2:-.2);round(c,-r,-r,r*2,r*2,i%3===1?5:18,cols[i%3],C.white);c.restore()}}
 function water(c,x,y,r=12){ball(c,x,y,r,C.pink);ball(c,x-r*.78,y-r*.67,r*.52,C.white);ball(c,x+r*.78,y-r*.67,r*.52,C.white)}
 function molecule(c,n,x,y,phase=0,small=false){if(n===0){let count=small?1:14;for(let i=0;i<count;i++){let xx=x+(i-(count-1)/2)*(small?0:22),yy=y+Math.sin(i*.85+phase)*8;sugar(c,xx,yy,small?24:16)}}else if(n===1){let count=small?1:12;for(let i=0;i<count;i++)amino(c,x+(i-(count-1)/2)*23,y+Math.sin(i*.8+phase)*16,i,small?22:16)}else if(small){ball(c,x-35,y,18,C.orange);for(let i=0;i<3;i++)round(c,x+2,y-35+i*25,70,14,7,C.orange,C.white)}else{ball(c,x,y,56,C.orange);for(let i=0;i<10;i++)round(c,x-30+(i%3)*21,y-25+Math.floor(i/3)*16,18,7,3,'#ffd9a8')}}
 function pill(c,t,x,y,w,color=C.teal){c.font='700 24px "Noto Sans TC"';const lines=linesFor(c,t,w-16),h=48+Math.max(0,lines.length-1)*32.4;round(c,x,y,w,h,12,C.deep,color);text(c,t,x+w/2,y+24,24,color,'center',w-16);return{x,y,w,h,lines}}
 function digestion(c,s,tr,time){bg(c);text(c,tr('先分清楚：顆粒變小，還是分子分解？','Smaller food particles—or smaller molecules?'),480,44,28,C.yellow,'center',900);let n=s.nutrient;
  round(c,40,104,880,444,24,'rgba(11,26,21,.40)','#638579');text(c,A.nutrients[n].name.map((v,i)=>i===s.langIndex?v:null).filter(Boolean)[0],480,147,28,A.nutrients[n].color);
  if(s.digestion===0){round(c,325,206,310,235,54,'#6f6049','#c7b28f');for(let j=0;j<3;j++){c.save();c.translate(480,257+j*66);c.scale(.5,.5);molecule(c,n,0,0,j*.4);c.restore()}pill(c,tr('同一顆食物中的養分','Nutrients inside one food particle'),240,480,480,C.orange)}
  else if(s.digestion===1){for(let j=0;j<3;j++){let x=220+j*260;round(c,x-110,246,220,140,30,'#6f6049','#c7b28f');c.save();c.translate(x,315);c.scale(.5,.5);molecule(c,n,0,0,j*.4);c.restore()}pill(c,tr('咀嚼：分子種類沒有變','Chewing: molecules stay the same'),150,480,660,C.teal)}
  else{if(n<2){const count=n===0?42:36,cols=n===0?7:6,step=n===0?106:124;for(let i=0;i<count;i++){let x=480+((i%cols)-(cols-1)/2)*step,y=215+Math.floor(i/cols)*46;if(n===0)sugar(c,x,y,18);else amino(c,x,y,i,18)}}else{for(let i=0;i<6;i++)molecule(c,2,210+(i%3)*270,270+Math.floor(i/3)*120,0,true)}pill(c,tr(...A.nutrients[n].unit),200,480,560,C.green)}
  text(c,tr('形狀／比例為分子教學示意，非實拍。','Molecular shapes and sizes are teaching symbols, not photographs.'),480,602,22,C.muted,'center',870);
 }
 const anatomyPlacement={x:(960-626*351/821)/2,y:32,w:626*351/821,h:626};
 function anatomyLabels(s){const ids=s.anatomyMode==='tract'?['mouth','pharynx','esophagus','stomach','small','large','anus']:['salivary','liver','gall','pancreas'];return ids.map((id,i)=>({id,x:i%2===0?32:655,y:Math.min(600,90+i*72),w:265,h:50,left:i%2===0}))}
 function anatomyTransform(s){return s.zoomOrgan?{x:54,y:92,w:230,h:230*821/351}:anatomyPlacement}
 const organCopy={
  mouth:[['咬碎、混合','Break up and mix'],['牙齒咀嚼，舌頭混合；唾液開始分解澱粉。','Teeth chew, the tongue mixes, and saliva begins starch digestion.']],
  pharynx:[['把食團送入食道','Direct food into the esophagus'],['吞嚥時讓食團由口腔進入食道，不是送進氣管。','Swallowing directs food from the mouth into the esophagus, not the airway.']],
  esophagus:[['以蠕動推送','Push by peristalsis'],['食道主要負責運輸，把食團送到胃。','The esophagus transports the bolus into the stomach.']],
  stomach:[['暫存、攪拌、初步消化','Store, mix, begin digestion'],['胃液呈酸性；其中的酵素初步分解蛋白質。','Acidic gastric juice contains enzymes that begin protein digestion.']],
  small:[['主要的消化、吸收場所','Main site of digestion and absorption'],['多數養分與水分，在小腸穿過上皮被吸收。','Most nutrients and water are absorbed across the small-intestinal epithelium.']],
  large:[['吸收剩餘水分','Absorb remaining water'],['大腸圍在小腸外側，殘渣逐漸形成糞便。','The large intestine frames the small intestine; residual material forms feces.']],
  anus:[['排遺的出口','The exit for egestion'],['糞便由肛門排出；排遺不等於排泄。','Feces leave through the anus. Egestion differs from excretion.']],
  salivary:[['分泌唾液','Secrete saliva'],['唾液潤濕食物，澱粉酶開始分解澱粉。','Saliva moistens food; amylase begins starch digestion.']],
  liver:[['製造膽汁','Make bile'],['膽汁幫助乳化脂質；食物不通過肝臟。','Bile emulsifies fat. Food does not pass through the liver.']],
  gall:[['儲存膽汁','Store bile'],['膽汁是肝臟製造的，膽囊儲存後送往小腸。','The liver makes bile; the gallbladder stores it for release into the small intestine.']],
  pancreas:[['分泌胰液','Secrete pancreatic juice'],['胰液送入小腸，幫助分解三大類養分。','Pancreatic juice enters the small intestine and acts on the three major nutrient groups.']]
 };
 function organLayout(s){const m=root.AnimalOrgans[s.organ],p=anatomyTransform(s),b=m.box,from={x:p.x+b[0]*p.w,y:p.y+b[1]*p.h,w:b[2]*p.w,h:b[3]*p.h},h=Math.min(270,430/m.aspect),w=h*m.aspect,q=A.clamp(s.organProgress===undefined?1:s.organProgress,0,1),e=1-Math.pow(1-q,3),to=s.organ==='pharynx'?{x:488+(b[0]*702-130)*1.08,y:159+(b[1]*1642-210)*1.08,w:b[2]*702*1.08,h:b[3]*1642*1.08}:{x:650-w/2,y:294-h/2,w,h};return Object.fromEntries(['x','y','w','h'].map(k=>[k,from[k]+(to[k]-from[k])*e]))}
 function anatomy(c,s,tr,images){bg(c);const im=images.anatomy,p=anatomyTransform(s),o=A.organs.find(o=>o.id===s.organ),organ=images['organ_'+s.organ],col=o.type==='tract'?C.teal:C.orange;
  if(!s.zoomOrgan){if(im)c.drawImage(im,p.x,p.y,p.w,p.h);anatomyLabels(s).forEach(({id,x:lx,y:ly,left})=>{let org=A.organs.find(o=>o.id===id),x=p.x+org.x*p.w,y=p.y+org.y*p.h,color=org.type==='tract'?C.teal:C.orange;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(left?lx+265:lx,ly+25);c.lineTo(x,y);c.stroke();round(c,lx,ly,265,50,12,id===s.organ?color:C.deep,color);text(c,tr(...org.name),lx+132,ly+25,24,id===s.organ?C.deep:color,'center',245);c.beginPath();c.arc(x,y,id===s.organ?13:7,0,Math.PI*2);c.fillStyle=color;c.fill()});return}
  text(c,tr('在身體中的位置','Location in the body'),176,40,24,C.teal,'center',310);
  if(im){c.save();c.globalAlpha=.32;c.drawImage(im,p.x,p.y,p.w,p.h);c.restore()}
  const dot={x:p.x+o.x*p.w,y:p.y+o.y*p.h};c.beginPath();c.arc(dot.x,dot.y,14,0,7);c.strokeStyle=col;c.lineWidth=4;c.stroke();c.beginPath();c.arc(dot.x,dot.y,6,0,7);c.fillStyle=col;c.fill();
  text(c,tr(...o.name),650,45,34,col,'center',560);round(c,366,98,567,355,18,'#f6f3ea',null);
  if(o.id==='pharynx'&&im){c.save();c.globalAlpha=.25*(s.organProgress===undefined?1:s.organProgress);c.drawImage(im,195,315,450,375,488,159,324,270);c.restore()}
  if(organ){const l=organLayout(s);c.drawImage(organ,l.x,l.y,l.w,l.h)}
  const copy=organCopy[o.id];text(c,tr(...copy[0]),650,492,26,col,'center',550);text(c,tr(...copy[1]),650,558,22,C.white,'center',540);
  if(o.id==='stomach')text(c,tr('原圖保留胃旁相連的小腸起始部','Original includes the connected start of the small intestine'),650,635,18,C.muted,'center',570);
  else text(c,tr('原圖器官分離顯示 · 放大圖不同比例','Isolated original vectors · enlargements are not to a shared scale'),480,635,18,C.muted,'center',900);
 }
 function secretions(c,s,tr,time){bg(c);let n=s.nutrient,f=s.fluid,e=A.fluidEffect(n,f),q=s.fluidProgress/100;const fluid=A.fluids[f];text(c,tr(...fluid.name)+' · '+tr(...fluid.site),480,45,28,C.yellow,'center',910);
  round(c,50,105,860,455,26,'rgba(11,26,21,.45)','#638579');text(c,tr(...A.nutrients[n].name),480,147,28,A.nutrients[n].color);
  if(e===0||q<.05)molecule(c,n,480,322,time*.15);
  else if(e===2){let r=56/Math.cbrt(9),spread=q*155;for(let i=0;i<9;i++){let a=i*Math.PI*2/9;ball(c,480+Math.cos(a)*spread,325+Math.sin(a)*spread,r,C.orange)}text(c,tr('油滴變小；脂質分子不變','Smaller droplets; unchanged fat molecules'),480,513,24,C.orange,'center',800)}
  else if(n<2){const units=A.digestUnits(n,f,s.fluidProgress),fragmented=n===0&&(f===0||f===3)||n===1&&f===1;for(const u of units){if(n===0)sugar(c,u.x,u.y,18);else amino(c,u.x,u.y,u.index,16)}text(c,q<.9?tr('分子逐步分解，單元數量不憑空增加','Molecules break down; their units are conserved'):fragmented?tr('片段仍需進一步消化','Fragments still need further digestion'):tr(...A.nutrients[n].unit),480,513,24,C.green,'center',800)}
  else if(q<.55){for(let j=0;j<3;j++){c.save();c.translate(230+j*250,325);c.scale(.55,.55);molecule(c,n,0,0);c.restore()}text(c,tr('初步分解成較小片段','Initial breakdown into smaller fragments'),480,513,24,C.teal,'center',800)}
  else{const final=(n===0&&(f===0||f===3))||(n===1&&f===1);for(let j=0;j<6;j++){let x=210+(j%3)*270,y=270+Math.floor(j/3)*120;if(final){if(n===0){sugar(c,x-17,y,20);sugar(c,x+17,y,20)}else{for(let i=0;i<4;i++)amino(c,x+(i-1.5)*23,y,i,15)}}else molecule(c,n,x,y,0,true)}text(c,final?tr('片段仍需進一步消化','Fragments still need further digestion'):tr(...A.nutrients[n].unit),480,513,24,C.green,'center',800)}
  if(e===0)text(c,tr('本課模型：此消化液不作用於這種養分','Course model: this fluid does not act on this nutrient'),480,513,24,C.orange,'center',800);
  if(n===2&&e===1&&q>=.55)text(c,tr('球：甘油；條形：脂肪酸（形狀示意）','Ball: glycerol; bars: fatty acids (shape symbols)'),480,565,22,C.teal,'center',870);
  text(c,tr('教學分段，非實測時間或分子比例。','Teaching stages—not measured time or molecular scale.'),480,607,22,C.muted,'center',870);
 }
 function peristalsis(c,s,tr){bg(c);const p=A.peristalsis(s.peristalsis/100),cy=325;const half=x=>85-57*Math.exp(-Math.pow(x-p.wave,2)/1800);
  let muscle=c.createLinearGradient(0,cy-118,0,cy+118);muscle.addColorStop(0,'#a64d4a');muscle.addColorStop(.18,'#e69991');muscle.addColorStop(.5,'#f7cbb5');muscle.addColorStop(.8,'#d27772');muscle.addColorStop(1,'#79393b');
  c.beginPath();for(let x=90;x<=860;x+=4){let y=cy-half(x)-30;x===90?c.moveTo(x,y):c.lineTo(x,y)}for(let x=860;x>=90;x-=4)c.lineTo(x,cy+half(x)+30);c.closePath();c.fillStyle=muscle;c.fill();
  for(let x=100;x<=850;x+=16){c.strokeStyle='rgba(100,38,42,.25)';c.lineWidth=2;c.beginPath();c.moveTo(x,cy-half(x)-29);c.lineTo(x+3,cy-half(x)-3);c.moveTo(x,cy+half(x)+3);c.lineTo(x+3,cy+half(x)+29);c.stroke()}
  let lumen=c.createLinearGradient(0,cy-70,0,cy+70);lumen.addColorStop(0,'#8c4049');lumen.addColorStop(.5,'#efbaad');lumen.addColorStop(1,'#903d49');c.beginPath();for(let x=90;x<=860;x+=4){let y=cy-half(x);x===90?c.moveTo(x,y):c.lineTo(x,y)}for(let x=860;x>=90;x-=4)c.lineTo(x,cy+half(x));c.closePath();c.fillStyle=lumen;c.fill();c.strokeStyle='#ffded0';c.lineWidth=4;c.stroke();
  c.save();c.translate(p.bolus,cy);let food=c.createRadialGradient(-15,-18,3,0,0,49);food.addColorStop(0,'#edd7aa');food.addColorStop(.6,'#b69360');food.addColorStop(1,'#786340');c.fillStyle=food;c.beginPath();c.ellipse(0,0,48,38,0,0,Math.PI*2);c.fill();for(let i=0;i<20;i++){c.fillStyle=i%2?'#d9b687':'#947347';c.beginPath();c.ellipse(Math.cos(i*2.4)*30,Math.sin(i*2.4)*24,4,3,i,0,7);c.fill()}c.restore();
  text(c,tr('食道縱向剖面','Esophagus: longitudinal section'),480,52,28,C.yellow,'center',900);text(c,tr('口腔端','From mouth'),126,158,24,C.teal);text(c,tr('通向胃','Toward stomach'),790,158,24,C.teal);
  pill(c,tr('食團後方：收縮','Behind bolus: contraction'),A.clamp(p.wave-170,50,420),480,350,C.orange);pill(c,tr('前方：放鬆','Ahead: relaxation'),500,555,360,C.teal);
  text(c,tr('肌肉波形與速度為教學示意，非真人量測。','Muscle shape and speed are illustrative, not human measurements.'),480,625,22,C.muted,'center',890);
 }
 function absorption(c,s,tr,images,time){bg(c);const im=images.histology;
  if(s.villusView==='photo'){if(im){c.drawImage(im,5,565,400,225,40,165,420,420*225/400);c.drawImage(im,410,565,397,225,500,165,420,420*225/397)}text(c,tr('皺褶上的絨毛','Villi on intestinal folds'),250,475,26,C.yellow);text(c,tr('絨毛：指狀突起','Villi: finger-like projections'),710,475,26,C.yellow);text(c,tr('真實光學切片 · 染色呈粉紅，非組織原色','Real stained light micrographs · pink is a stain, not natural color'),480,78,24,C.teal,'center',900);text(c,tr('同一來源圖的兩個視野；不直接用畫面比較尺寸。','Two source-image fields; screen size is not a size comparison.'),480,602,22,C.muted,'center',900);return}
  if(s.villusView==='original'){if(im){const h=550,w=h*im.width/im.height;c.drawImage(im,(960-w)/2,85,w,h)}text(c,tr('OpenStax 原圖：構造、光學切片與電顯補充','OpenStax original: structure, histology and EM supplement'),480,40,24,C.yellow,'center',900);return}
  if(im){round(c,487,99,365,512,14,'#f6f3ea',null);c.drawImage(im,584,2,130,400,520,115,156,480)}
  const blocked=s.absorb==='starch'||s.absorb==='protein',stage=s.absorbStage===undefined?-1:s.absorbStage;
  text(c,tr('養分必須穿過上皮','Nutrients must cross the epithelium'),480,44,28,C.yellow,'center',900);
  text(c,tr('腸腔','Lumen'),220,124,26,C.teal,'center',390);text(c,tr('上皮細胞','Epithelial cells'),755,148,24,C.deep,'center',190);text(c,tr('微血管','Capillaries'),756,230,24,C.deep,'center',190);
  // A rasterized small-molecule glyph is 8 px across: below the 12–16 px cells.
  // Intact chains are compact glyphs under 12 px, never food-sized blobs.
  for(let i=0;i<(blocked?6:10);i++){const p=absorbPosition(time,stage,i,blocked);absorbGlyph(c,s.absorb,p.x,p.y)}
  const q=time*.12%1,levels=[tr('1 腸腔內','1 In the lumen'),tr('2 穿過上皮','2 Across epithelium'),tr('3 進入血管','3 Into blood')],at=blocked?0:stage<0?(q<.5?0:q<.68?1:2):stage;
  levels.forEach((t,i)=>{round(c,38,320+i*68,365,56,10,i===at?'#315743':C.deep,i===at?C.yellow:'#638579');text(c,t,220,348+i*68,24,i===at?C.yellow:C.muted,'center',345)});
  text(c,blocked?tr('完整大分子留在腸腔，須先消化','Whole large molecules stay in the lumen: digest first'):tr('看小符號進入血管，再被運走','Watch the small symbols enter blood and move away'),220,560,22,blocked?C.orange:C.green,'center',380);
  text(c,tr('符號小於上皮細胞；為可見性放大，仍非真實尺度','Symbols are smaller than cells but enlarged for visibility—not true molecular scale'),480,636,20,C.muted,'center',910);
 }
 function absorbPosition(time,stage,index,blocked){const q=(time*.12+index*.097)%1;if(blocked)return{x:180+q*285,y:216+Math.sin(index*2.1+time)*42};
  const t=stage<0?q:stage===0?q*.50:stage===1?.50+q*.18:.68+q*.32;
  const points=[{t:0,x:142,y:282},{t:.5,x:527,y:282},{t:.60,x:546,y:282},{t:.68,x:570,y:282},{t:.88,x:556,y:475},{t:1,x:526,y:544}];
  let j=points.findIndex((p,i)=>i&&t<=p.t);if(j<1)j=1;const a=points[j-1],b=points[j],f=(t-a.t)/(b.t-a.t);return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};
 }
 function absorbGlyph(c,kind,x,y){c.save();c.translate(x,y);const scale=kind==='starch'||kind==='protein'?.11:.14;c.scale(scale,scale);if(kind==='water')water(c,0,0,17);else if(kind==='amino')amino(c,0,0,2,21);else if(kind==='glucose')sugar(c,0,0,22);else for(let i=0;i<7;i++){const xx=(i-3)*11,yy=Math.sin(i*.8)*8;kind==='starch'?sugar(c,xx,yy,7):amino(c,xx,yy,i,7)}c.restore()}
 function use(c,s,tr,time){bg(c);let r=A.routes[s.route],p=s.useProgress/100;
  const centers=[175,480,790];r.stages.forEach((a,i)=>{round(c,centers[i]-135,122,270,412,24,i===Math.round(p*2)?'#315743':'#16342b',i===Math.round(p*2)?C.yellow:'#638579');text(c,tr(...a),centers[i],170,24,i===Math.round(p*2)?C.yellow:C.white,'center',250)});
  // A cutaway villus, blood vessel and destination—not three text-only cards.
  let g=c.createLinearGradient(130,220,220,445);g.addColorStop(0,'#fbc3b8');g.addColorStop(1,'#b35d64');c.fillStyle=g;c.beginPath();c.moveTo(125,470);c.lineTo(125,300);c.bezierCurveTo(125,222,225,222,225,300);c.lineTo(225,470);c.closePath();c.fill();for(let i=0;i<12;i++){c.strokeStyle='#fff0de';c.lineWidth=2;c.beginPath();c.moveTo(126,306+i*13);c.lineTo(142,306+i*13);c.moveTo(208,306+i*13);c.lineTo(224,306+i*13);c.stroke()}
  round(c,358,303,244,82,38,'#b55a64','#ffd4c8');for(let i=0;i<5;i++){c.fillStyle='#94323c';c.beginPath();c.ellipse(390+i*45,343,18,11,.15,0,7);c.fill();c.strokeStyle='#e79591';c.lineWidth=3;c.stroke()}
  if(s.route===0){let cell=c.createRadialGradient(760,300,3,790,338,100);cell.addColorStop(0,'#93c4a2');cell.addColorStop(1,'#327462');c.fillStyle=cell;c.beginPath();c.ellipse(790,340,100,125,0,0,7);c.fill();ball(c,756,335,30,'#cfa9ed');round(c,806,292,49,85,24,'#eaad7f','#fce1b2');for(let i=0;i<5;i++){c.beginPath();c.moveTo(815,302+i*13);c.bezierCurveTo(844,302+i*13,810,315+i*13,840,316+i*13);c.strokeStyle='#9d6948';c.lineWidth=3;c.stroke()}}
  else if(s.route===1){for(let i=0;i<11;i++)amino(c,700+i*18,330+Math.sin(i*.8)*17,i,18)}else{for(let row=0;row<3;row++)for(let i=0;i<6;i++)sugar(c,720+i*28,300+row*38+Math.sin(i)*12,17)}
  let x=175+p*615,y=240+Math.sin(p*Math.PI)*20;if(s.route===1)amino(c,x,y,1,22);else sugar(c,x,y,23);
  text(c,tr('由小腸到細胞 · 位置、形狀與速率均為示意','From intestine to cells · positions, shapes and speeds are illustrative'),480,607,22,C.muted,'center',890);
 }
 root.AnimalDraw={W,H,C,text,bg,round,pill,sugar,amino,water,molecule,digestion,anatomy,secretions,peristalsis,absorption,use,anatomyTransform,anatomyLabels,organLayout,organCopy,absorbPosition,absorbGlyph};
})(typeof window==='undefined'?globalThis:window);
