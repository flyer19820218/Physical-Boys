/* Six teacher-requested exchange windows + actual textbook lymph figures.
 * Uses the shared LivingBook clock. All molecular paths are explicit; this is
 * a qualitative, enlarged model, NOT a stoichiometric or measured-scale model.
 * Glucose/urea are plasma solutes; red cells stay in the blood lumen.
 */
(function(root){
  'use strict';
  const C=root.HumanTransportCutaways,G=root.HumanTransportCirculation;
  const P=(zh,en)=>[zh,en],INK='#f2ecd9',BG='#11261f',TAU=Math.PI*2;
  const clamp=u=>Math.max(0,Math.min(1,u)),mod=u=>((u%1)+1)%1;
  const SPECIES=Object.freeze({
    oxygen:{name:P('氧氣','Oxygen'),short:'O₂',color:'#f472b6'},
    carbon:{name:P('二氧化碳','Carbon dioxide'),short:'CO₂',color:'#9fc1bc'},
    glucose:{name:P('葡萄糖','Glucose'),short:'Glc',color:'#fde047'},
    ammonia:{name:P('氨','Ammonia'),short:'NH₃',color:'#b79af7'},
    urea:{name:P('尿素','Urea'),short:'Urea',color:'#fb923c'}
  });
  const ZONES=Object.freeze([
    {id:'heart',tile:0,name:P('心肌','Heart muscle'),title:P('心肌也要吃飯：冠狀動脈送來氧與養分','Heart muscle needs its own oxygen and nutrients'),
      text:P('冠狀動脈把血送到心肌微血管，氧氣與葡萄糖經組織液進入心肌細胞。細胞呼吸作用釋出可利用的能量，供心肌收縮；產生的二氧化碳進入血液，再經冠狀靜脈、冠狀竇回右心房，之後送往肺排出。\n\n這裡教的是心肌自己的供血，不是心室內的血直接穿過厚厚心壁。心肌也能使用其他燃料；圖以葡萄糖為例。','Coronary arteries supply myocardial capillaries. Oxygen and glucose cross tissue fluid into heart-muscle cells. Cellular respiration supplies usable energy for contraction. CO₂ enters blood, returns through cardiac veins and the coronary sinus to the right atrium, then travels to the lungs.\n\nThis is the heart muscle\'s own blood supply, not blood passing through the thick chamber wall. Glucose is one example of fuel.')},
    {id:'liver',tile:2,name:P('肝臟','Liver'),title:P('肝臟加工：把氨轉成尿素，再交給血液','The liver converts ammonia to urea for transport'),
      text:P('肝細胞處理胺基酸時會產生氨；血液也可把含氮物質帶到肝臟。肝臟把多數氨轉成毒性較低的尿素，尿素進入血漿，接著經血液送到腎臟排出。\n\n飯後小腸吸收的葡萄糖先經肝門靜脈到肝臟，部分可儲存為肝糖；需要時肝臟又可釋出葡萄糖。肝細胞本身也需氧，並產生二氧化碳。氨→尿素是功能示意，不是單一反應式或一比一分子配對。','Amino-acid processing in liver cells produces ammonia; blood also brings nitrogen-containing substances to the liver. Most ammonia is converted to less-toxic urea. Urea enters plasma and is carried to the kidneys for excretion.\n\nAfter a meal, absorbed glucose reaches the liver through the portal vein; some can be stored as glycogen. The liver can release glucose when needed. Liver cells also consume oxygen and produce CO₂. The NH₃→urea depiction is a functional summary, not a single reaction or a 1:1 molecular equation.')},
    {id:'kidney',tile:3,name:P('腎臟','Kidney'),title:P('腎細胞也要養分：進氧氣、葡萄糖，出二氧化碳','Kidney cells: oxygen and glucose in, CO₂ out'),
      text:P('腎臟由活細胞組成，自己的細胞也需要氧氣與養分。周圍微血管把氧氣、葡萄糖經組織液送進腎細胞，供細胞呼吸作用利用、釋出可利用的能量。\n\n腎細胞產生的二氧化碳再進入血液，由血液送往肺排出。腎細胞也能使用其他燃料，動畫以葡萄糖為例。\n\n主畫面只教細胞與血液的交換；過濾、腎小管與再吸收放在「延伸閱讀／不考」，有興趣再點開。','Kidney cells need oxygen and nutrients. Nearby capillaries supply oxygen and glucose through tissue fluid for cellular respiration and usable energy.\n\nCO₂ from the cells enters blood and is transported to the lungs. Glucose is one fuel example, not the only fuel.\n\nThe main view teaches cell–blood exchange only. Filtration, renal tubules and reabsorption are in optional, non-exam further reading.')},
    {id:'lung',tile:1,name:P('肺','Lungs'),title:P('肺的交換不只兩種氣體：葡萄糖、氨也在動','Lungs trade more than gases: glucose and NH₃ too'),
      text:P('右心室送出的血經肺動脈到肺微血管。吸入的氧氣從肺泡內空氣穿過薄薄的肺泡壁與微血管壁，進入血液，大部分由紅血球攜帶。\n\n同時，二氧化碳由血液進入肺泡，再隨呼氣排出。補氧後的血經肺靜脈回左心房。肺動脈血較少氧、肺靜脈血較多氧；兩者都是紅色血液。血漿裡溶著的物質也在交換：葡萄糖會從微血管經組織液進入肺泡壁細胞，供細胞自己使用，不是紅血球攜帶，也不會被呼出去。氨是含氮廢物，大部分由肝臟轉成尿素、經腎臟排出；只有極少量會穿過肺泡壁，隨呼氣排出。切到「肺細胞也要葡萄糖」，可看血液供應養分給肺組織的另一個窗口。','Blood from the right ventricle reaches lung capillaries through pulmonary arteries. Inhaled oxygen crosses the thin alveolar and capillary walls into blood and is carried mainly by red cells.\n\nAt the same time, CO₂ passes from blood into alveolar air and is exhaled. Oxygenated blood returns through pulmonary veins to the left atrium. Pulmonary arterial blood has less oxygen; pulmonary venous blood has more. Both are red. Substances dissolved in plasma exchange too: glucose passes from the capillary through tissue fluid into alveolar-wall cells for their own use; it is not carried on red cells and is not exhaled. Ammonia is a nitrogen waste: most is converted to urea by the liver and excreted by the kidneys; only a trace crosses the alveolar wall and leaves in the breath. Choose “Lung cells need glucose” for another view of nutrient delivery to lung tissue.')},
    {id:'tissue',tile:5,name:P('組織','Body tissues'),title:P('送到細胞才算完成：養分進去，廢物出來','Delivery to cells: nutrients in, CO₂ out'),
      text:P('小腸吸收的葡萄糖由血液運送；肺補進的氧氣也隨血液到全身微血管。氧氣與葡萄糖經組織液進入細胞，參與細胞呼吸作用，釋出可利用的能量，並產生二氧化碳與水。\n\n二氧化碳再經組織液進入血液，送到肺排出。因此「吸收 → 運送 → 細胞利用 → 廢物帶走」是一整條故事，不是四件互不相干的事。葡萄糖溶在血漿中，不是紅血球的乘客；圖中的分子顏色與尺寸是辨識符號。','Absorbed glucose is transported by blood. Oxygen added in the lungs reaches body capillaries too. Both cross tissue fluid into cells, supporting cellular respiration, usable energy release and production of CO₂ and water.\n\nCO₂ crosses tissue fluid into blood and travels to the lungs. Thus absorption → transport → cellular use → waste removal is one connected story. Glucose is dissolved in plasma, not carried on red cells. Molecular colours and sizes are identification symbols.')},
    {id:'intestine',tile:4,name:P('小腸','Small intestine'),title:P('小腸絨毛：葡萄糖穿過上皮，進入血液','Intestinal villi: glucose crosses epithelium into blood'),
      text:P('澱粉必須先消化成可吸收的小分子。葡萄糖從腸腔穿過絨毛上皮細胞，經組織液進入微血管，再沿肝門靜脈到肝臟，接著才分配到全身。不是完整澱粉直接鑽入血管。\n\n圖左是一根絨毛：外面一圈單層上皮細胞，裡面有微血管和乳糜管（淋巴管的起點）。右邊圓圈是放大的上皮細胞，朝腸腔的一面有微絨毛，讓吸收面積變大。\n\n小腸細胞本身也要氧氣，並將二氧化碳交回血液。這裡專追蹤葡萄糖；脂質吸收後另有重要的淋巴運送路徑，不應把所有養分畫成同一路。','Starch must first be digested into absorbable small molecules. Glucose crosses villus epithelial cells, passes through tissue fluid into capillaries, then reaches the liver through the hepatic portal vein before wider distribution. Intact starch does not enter blood directly.\n\nLeft: one villus—a single layer of epithelial cells around capillaries and a lacteal (the start of a lymph vessel). Right: an enlarged epithelial cell; microvilli face the lumen and enlarge the absorbing surface.\n\nIntestinal cells themselves require oxygen and return CO₂ to blood. This window follows glucose; absorbed lipids have an important lymphatic route and should not all be depicted as following this route.')}
  ]);
  const images=new Map();
  function image(ctx,file,x,y,w,h){let im=images.get(file);if(!im&&typeof Image!=='undefined'){im=new Image();im.src=file;images.set(file,im);}if(im?.complete&&im.naturalWidth){const k=Math.min(w/im.width,h/im.height),ww=im.width*k,hh=im.height*k;ctx.drawImage(im,x+(w-ww)/2,y+(h-hh)/2,ww,hh);}return im;}
  function icon(ctx,tile,x,y,size){const file='assets/biology/human_transport_media_1012_v1/organ_atlas.png';let im=images.get(file);if(!im){image(ctx,file,-2000,-2000,1,1);im=images.get(file);}if(im?.complete&&im.naturalWidth)ctx.drawImage(im,tile%3*512,Math.floor(tile/3)*512,512,512,x,y,size,size);}
  function text(ctx,D,p,x,y,size=22,color=INK,align='left'){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function wrap(ctx,D,p,x,y,width,size=22,color=INK){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;const str=D.tr(p),units=/\s/.test(str)?str.split(/\s+/).map(a=>a+' '):Array.from(str);let row='',n=0;for(const unit of units){if(row&&ctx.measureText(row+unit).width>width){text(ctx,D,[row.trim(),row.trim()],x,y+n++*28,size,color);row=unit;}else row+=unit;}if(row)text(ctx,D,[row.trim(),row.trim()],x,y+n++*28,size,color);ctx.restore();return n;}
  function ellipse(ctx,x,y,rx,ry,fill,stroke,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function gradient(ctx,x,y,r,inner,outer){const g=ctx.createRadialGradient(x-r*.25,y-r*.3,1,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);return g;}
  function line(ctx,pts,color,width=2){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...p));ctx.stroke();ctx.restore();}
  function molecule(ctx,kind,p,size=9){const c=SPECIES[kind].color;ctx.save();ctx.translate(p.x,p.y);if(kind==='glucose'){ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;ctx[i?'lineTo':'moveTo'](Math.cos(a)*size*1.15,Math.sin(a)*size*1.15);}ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.strokeStyle='#fff5cd';ctx.lineWidth=1;ctx.stroke();}else if(kind==='oxygen'){for(const k of [-1,1])ellipse(ctx,k*size*.66,0,size*.68,size*.68,gradient(ctx,k*size*.66,0,size*.68,'#ffe5ec',c));}else if(kind==='carbon'){ellipse(ctx,-size,0,size*.58,size*.58,'#f472b6');ellipse(ctx,size,0,size*.58,size*.58,'#f472b6');ellipse(ctx,0,0,size*.65,size*.65,c);}else if(kind==='ammonia'){for(let i=0;i<3;i++)ellipse(ctx,Math.cos(i*TAU/3)*size*.85,Math.sin(i*TAU/3)*size*.85,size*.35,size*.35,INK);ellipse(ctx,0,0,size*.63,size*.63,c);}else{ctx.beginPath();ctx.roundRect(-size*1.18,-size*.59,size*2.36,size*1.18,size*.55);ctx.fillStyle=c;ctx.fill();ctx.strokeStyle='#ffd5a8';ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
  function arrow(ctx,path,color){line(ctx,path,color+'70',2);const p=G.point(path,.63);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-5);ctx.lineTo(-5,5);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();}
  const flow=(kind,from,to,path,label,at,period=9,offset=0)=>({kind,from,to,path,label,at,period,offset});
  function chain(pieces){const samples=[];let length=0;for(const points of pieces){const r=C.geometry.curve(points);r.samples.forEach((p,i)=>{if(!samples.length||i)samples.push({...p,d:p.d+length});});length+=r.length;}return{samples,length};}
  const VILLUS=chain([[[592,477],[592,401],[592,327],[592,250]],[[592,250],[592,200],[710,200],[710,250]],[[710,250],[710,327],[710,401],[710,477]]]);
  const TUFT=[[[148,216],[265,110],[355,281],[333,246]],[[148,216],[152,340],[322,322],[333,246]],[[148,216],[265,254],[264,171],[333,246]]].map(p=>C.geometry.curve(p));
  const RENAL_RETURN=C.geometry.curve([[333,246],[370,325],[656,310],[894,328]]);
  const nearX=(r,x)=>r.samples.reduce((a,b)=>Math.abs(a.x-x)<Math.abs(b.x-x)?a:b);
  const RENAL_FILTER=C.geometry.at(TUFT[2],TUFT[2].length*.5),RENAL_REABSORB=nearX(RENAL_RETURN,557);
  const KIDNEY_EXTRA={title:P('延伸閱讀／不考：腎臟過濾與再吸收','Extra / non-exam: filtration and reabsorption'),
      text:P('腎動脈送血到腎臟。腎絲球過濾時，水與小分子可進入腎小管；正常血球與多數大蛋白留在血管內。尿素隨形成的尿液排出體外，不是留在腎臟裡。\n\n葡萄糖也能被過濾，但正常情況下會由腎小管再吸收回血液；不能把它演成跟尿素一起全排掉。此外，血液也把葡萄糖與氧氣供給腎細胞，供細胞呼吸作用利用，再帶走二氧化碳。兩條黃色箭頭要分清楚：「再吸收」是收回血液；「給腎細胞」是細胞取用養分。圖以葡萄糖為燃料例子，腎細胞也能使用其他燃料。這是補充的腎元功能示意，不是腎絲球、腎小管及血管的真實大小。','Renal arteries supply the kidneys. Glomerular filtration lets water and small solutes enter renal tubules; normal blood cells and most large proteins stay in blood. Urea is removed in the urine, not stored in the kidney.\n\nGlucose is also filtered, but is normally reabsorbed from the tubule into blood, rather than all being excreted with urea. Separately, blood supplies glucose and oxygen to kidney cells for cellular respiration, and removes CO₂. The two yellow paths differ: reabsorption returns glucose to blood; nutrient delivery supplies cells. Glucose is one fuel example, not the only fuel. This supplementary nephron model is not drawn to anatomical scale.')};
  const LUNG_CELLS={title:P('肺也要養分：葡萄糖給細胞，不是給肺泡空氣','Lung cells need glucose, not alveolar air'),
    text:P('肺由活細胞組成，自己的細胞也要取用葡萄糖與氧氣，進行細胞呼吸作用，再把二氧化碳交回血液。葡萄糖溶在血漿中，經組織液進入細胞，不是由紅血球攜帶。\n\n補充：肺除了肺循環，還有支氣管循環供應氣道與支持組織的氧氣和養分。這裡用肺組織細胞作為例子，不是把所有肺細胞的供血畫成同一路。\n\n請分清楚：肺泡氣體交換幫全身補氧；肺細胞取用養分是肺自己的代謝。葡萄糖不是從空氣吸進來，也不會由呼氣排出。',
      'Lung cells use glucose and oxygen for cellular respiration and return CO₂ to blood. Glucose travels dissolved in plasma and crosses tissue fluid into cells, not on red cells.\n\nExtra: alongside pulmonary circulation, bronchial circulation supplies oxygen and nutrients to airways and supporting tissue. This example does not place every lung cell on the same supply route.\n\nAlveolar gas exchange oxygenates blood for the body; nutrient use is lung tissue\'s own metabolism. Glucose is neither inhaled nor exhaled.')};
  function flows(zone,lungView='gas',kidneyView='cells'){
    if(zone==='lung'&&lungView!=='cells')return[
      flow('oxygen','alveolar air','blood',[LUNG_XY(70,112),LUNG_XY(LCC,112)],P('氧氣進血','O₂ into blood'),[405,486],8),
      flow('carbon','blood','alveolar air',[LUNG_XY(LCC,158),LUNG_XY(70,158)],P('二氧化碳出血','CO₂ into air'),[335,350],8,.5),
      flow('glucose','capillary plasma','alveolar-wall cells',[LUNG_XY(LCC-16,128),LUNG_XY(ALV.r,128)],P('葡萄糖進肺泡壁細胞','Glucose into wall cells'),[335,392],12),
      flow('ammonia','capillary plasma','alveolar air (trace)',[LUNG_XY(LCC-16,80),LUNG_XY(ALV.r*.55,80)],P('氨：極少量隨呼氣排出','NH₃: a trace is exhaled'),[935,250],20)];
    if(zone==='lung')return[
      flow('oxygen','bronchial tissue blood','lung tissue cells',[[231,237],[397,237],[519,243],[586,279]],P('氧氣給肺細胞','O₂ to lung tissue cells'),[267,211],8),
      flow('glucose','bronchial tissue plasma','lung tissue cells',[[230,329],[398,329],[520,329],[588,330]],P('葡萄糖給肺細胞','Glucose to lung tissue cells'),[269,305],10,.35),
      flow('carbon','lung tissue cells','blood',[[610,411],[511,417],[385,421],[230,421]],P('二氧化碳交回血液','CO₂ returned to blood'),[270,458],8,.6)];
    if(zone==='kidney')return[
      flow('oxygen','blood','kidney cells',[[231,237],[397,237],[519,243],[586,279]],P('氧氣給腎細胞','O₂ to kidney cells'),[267,211],8),
      flow('glucose','plasma','kidney cells',[[230,329],[398,329],[520,329],[588,330]],P('葡萄糖給腎細胞','Glucose to kidney cells'),[269,305],10,.35),
      flow('carbon','kidney cells','blood',[[610,411],[511,417],[385,421],[230,421]],P('二氧化碳交回血液','CO₂ returned to blood'),[270,458],8,.6)];
    if(zone==='intestine')return[
      flow('glucose','intestinal lumen','capillary blood',[[805,326],[ZX+ZLANE,326]],P('葡萄糖：腸腔 → 血液','Glucose: gut → blood'),[935,104],12),
      flow('oxygen','capillary blood','epithelial cells',[[ZX+ZLANE,302],[632,302]],P('氧氣進上皮細胞','O₂ into cells'),[935,462],8,.3),
      flow('carbon','epithelial cells','capillary blood',[[632,291],[ZX+ZLANE,291]],P('二氧化碳回血液','CO₂ back to blood'),[935,498],8,.65)];
    return[
      flow('oxygen','blood','cell',[[231,237],[397,237],[519,243],[586,279]],P('氧氣送進細胞','O₂ delivered to cells'),[267,211],8),
      flow('glucose','blood','cell',[[230,329],[398,329],[520,329],[588,330]],P('葡萄糖送進細胞','Glucose delivered to cells'),[269,305],10,.35),
      flow('carbon','cell','blood',[[610,411],[511,417],[385,421],[230,421]],P('二氧化碳帶走','CO₂ carried away'),[270,458],8,.6)];
  }
  function animateFlows(ctx,s,t,D,zone){const list=flows(zone,s.lungView,s.kidneyView);for(const f of list){const active=!s.substance||s.substance==='all'||s.substance===f.kind;ctx.save();ctx.globalAlpha=active?1:.14;arrow(ctx,f.path,SPECIES[f.kind].color);if(active){for(let n=0;n<2;n++){const u=mod(t/f.period+n*.5+f.offset);ctx.globalAlpha=Math.min(1,u*12,(1-u)*12);molecule(ctx,f.kind,G.point(f.path,u),10);}ctx.globalAlpha=1;wrap(ctx,D,f.label,f.at[0],f.at[1],zone==='lung'?206:310,22,SPECIES[f.kind].color);}ctx.restore();}return list;}
  function blood(ctx,points,t,r=23,oxygen=1,muscle=0){const route=C.geometry.curve(points);paintBlood(ctx,[route],t,r,oxygen,muscle);return route;}
  function paintBlood(ctx,routes,t,r,oxygen,muscle=0){C.render.tubes(ctx,routes,routes.map(()=>r),muscle,2);ctx.save();C.render.clipTubes(ctx,routes,routes.map(()=>r));routes.forEach((route,i)=>{const cells=C.geometry.cells(route,t+i*.7,r>18?[-9,9]:[0],34,24,r>18?7.2:6.2);cells.forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,typeof oxygen==='function'?oxygen(p.d/route.length):oxygen,p.angle+p.tilt));});ctx.restore();}
  function mitochondrion(ctx,x,y,w=90,h=52){ctx.save();ctx.translate(x,y);ellipse(ctx,0,0,w/2,h/2,gradient(ctx,0,0,w/2,'#eabc81','#96583d'),'#f4cb9b');ctx.beginPath();ctx.moveTo(-w*.3,-h*.15);for(let i=0;i<6;i++)ctx.bezierCurveTo(-w*.3+i*w*.1,-h*.35,-w*.25+i*w*.1,h*.35,-w*.2+i*w*.1,i%2?h*.12:-h*.12);ctx.strokeStyle='#5e3028';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
  function cell(ctx,zone,t){const x=679,y=331;ellipse(ctx,x,y,210,156,gradient(ctx,x,y,225,'#568776','#21463c'),'#86c4a7',3);ellipse(ctx,802,302,34,41,gradient(ctx,802,302,42,'#d7b6ed','#786098'),'#d4b1e2');mitochondrion(ctx,633,335,105,64);mitochondrion(ctx,737,387,83,46);if(zone==='heart'){ctx.save();ctx.beginPath();ctx.ellipse(x,y,210,156,0,0,TAU);ctx.clip();for(let i=0;i<13;i++)line(ctx,[[492+i*28,191],[492+i*28,485]],'#91c1a622',2);ctx.restore();}if(zone==='liver'){for(let i=0;i<6;i++){const p={x:762+i%3*25,y:424+Math.floor(i/3)*22};molecule(ctx,'glucose',p,8);}line(ctx,[[754,424],[812,447]],'#fde047',2);}else{for(let i=0;i<3;i++){const u=mod(t*.13+i/3);ellipse(ctx,645+u*87,360-u*14,4,4,'#fde047');}}}
  function legend(ctx,s,D,zone){const present=new Set(flows(zone,s.lungView,s.kidneyView).map(f=>f.kind));Object.keys(SPECIES).forEach((k,i)=>{const x=34+i*184;ctx.save();ctx.globalAlpha=present.has(k)?1:.28;molecule(ctx,k,{x:x+10,y:539},8);wrap(ctx,D,SPECIES[k].name,x+32,546,140,20,SPECIES[k].color);ctx.restore();if(present.has(k))D.hit(x,536,180,38,'substance',k);});text(ctx,D,P('淡黃＝血漿；分子符號放大，非比例、非分子反應計量。','Pale yellow = plasma; enlarged symbols, not scale or reaction stoichiometry.'),24,599,18,'#b9cbbd');}
  function convertAmmonia(ctx,s,t){if(s.substance&&s.substance!=='all'&&!['ammonia','urea'].includes(s.substance))return;const route=[[643,239],[676,249],[684,283],[695,302]];arrow(ctx,route,'#fb923c');const u=mod(t/9+.42),p=G.point(route,u);ctx.save();ctx.globalAlpha=Math.min(1,u*10,(1-u)*10);molecule(ctx,u<.5?'ammonia':'urea',p,10);ctx.restore();}
  function basic(ctx,s,t,D,zone){blood(ctx,[[210,168],[199,270],[239,396],[217,498]],t,25,u=>1-.65*u);cell(ctx,zone,t);text(ctx,D,zone==='lung'?P('供肺組織的微血管','Lung-tissue supply capillary'):P('微血管（血漿）','Capillary (plasma)'),40,144,22,'#f1e3ae');text(ctx,D,zone==='heart'?P('心肌細胞','Heart-muscle cell'):zone==='liver'?P('肝細胞','Liver cell'):zone==='lung'?P('肺組織細胞','Lung-tissue cell'):zone==='kidney'?P('腎細胞','Kidney cell'):P('組織細胞','Tissue cell'),642,163,24,'#86c4a7');if(zone==='liver'){text(ctx,D,P('氨 → 尿素','NH₃ → urea'),614,265,23,'#fb923c');text(ctx,D,P('肝糖','Glycogen'),766,474,22,'#fde047');}else{text(ctx,D,P('細胞呼吸作用','Cellular respiration'),565,374,22,'#fde047');text(ctx,D,P('供細胞利用的能量','Usable energy'),618,483,22,'#fde047');}text(ctx,D,P('組織液','Tissue fluid'),287,525,22,'#b9cbbd');}
  /* ---- 肺：圓形肺泡＋繞著肺泡彎過去的微血管（老師 2026-11-23：肺泡要是圓的；紅血球單列、一次一顆通過）----
   * 畫面 960×600。肺泡是正圓（ALV）；微血管中心線與肺泡同圓心（半徑 LCC），從左邊進來、轉彎、繞過肺泡下緣、往右出去。
   * 紅血球沿中心線走：血色依「走過肺泡的程度」由暗紅漸變鮮紅；走到肺泡旁，氧氣由肺泡空氣穿過壁進到這顆細胞、二氧化碳從這顆細胞出到肺泡。 */
  const ALV={x:545,y:312,r:128},LCR=22,LCC=ALV.r+9+LCR;
  const LUNG_XY=(r,deg)=>[ALV.x+r*Math.cos(deg*Math.PI/180),ALV.y+r*Math.sin(deg*Math.PI/180)];
  const lungArc=(a0,a1)=>{const t0=a0*Math.PI/180,t1=a1*Math.PI/180,k=4/3*Math.tan((t1-t0)/4)*LCC,p0=LUNG_XY(LCC,a0),p3=LUNG_XY(LCC,a1);
    return[p0,[p0[0]-k*Math.sin(t0),p0[1]+k*Math.cos(t0)],[p3[0]+k*Math.sin(t1),p3[1]-k*Math.cos(t1)],p3];};
  const LUNG_PIECES=(()=>{const e=LUNG_XY(LCC,55),tx=Math.sin(55*Math.PI/180),ty=-Math.cos(55*Math.PI/180);
    return[[[-20,170],[250,170],[ALV.x-LCC,150],[ALV.x-LCC,ALV.y]],lungArc(180,90),lungArc(90,55),[e,[e[0]+110*tx,e[1]+110*ty],[820,378],[985,378]]];})();
  const LUNG_ROUTE=chain(LUNG_PIECES);
  const LUNG_LEN=LUNG_PIECES.map(q=>C.geometry.curve(q).length),LUNG_D0=LUNG_LEN[0],LUNG_ARC=LUNG_LEN[1]+LUNG_LEN[2];
  const LUNG_CELLS_N=3,LUNG_SPEED=70,LUNG_CELL_R=19;   // 3 顆、間距 > 繞肺泡那一段的長度：同一時間肺泡旁只有一顆
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const mixHex=(a,b,u)=>{const x=hex(a),y=hex(b);return'#'+x.map((v,i)=>Math.round(v+(y[i]-v)*u).toString(16).padStart(2,'0')).join('');};
  const smooth01=u=>{u=clamp(u);return u*u*(3-2*u);};
  /* 紅血球：o＝含氧程度 0（暗紅）～1（鮮紅），顏色連續漸變（同全站血色：不畫藍色） */
  function lungRbc(ctx,x,y,r,o,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    const g=ctx.createRadialGradient(-r*.12,-r*.16,0,0,0,r);
    g.addColorStop(0,mixHex('#c17a78','#f3a794',o));g.addColorStop(.32,mixHex('#a25459','#e38273',o));g.addColorStop(.64,mixHex('#852b39','#dd3f43',o));g.addColorStop(.83,mixHex('#ab5158','#ff7770',o));g.addColorStop(1,'#68232d');
    ellipse(ctx,0,0,r,r*.69,g,mixHex('#b66e6e','#f39180',o),.8);
    ctx.beginPath();ctx.ellipse(-r*.05,-r*.05,r*.40,r*.25,0,.2,2.7);ctx.strokeStyle='#ffd5ba80';ctx.lineWidth=.8;ctx.stroke();ctx.restore();}
  /* 目前在畫面上的每顆紅血球：位置、角度、含氧程度、走過肺泡的程度 f（0＝剛進肺泡旁，1＝繞完） */
  function lungCells(t){const L=LUNG_ROUTE.length,pitch=L/LUNG_CELLS_N,out=[];
    for(let i=0;i<LUNG_CELLS_N;i++){const d=mod((t*LUNG_SPEED+i*pitch)/L)*L,p=C.geometry.at(LUNG_ROUTE,d,0),f=(d-LUNG_D0)/LUNG_ARC;
      out.push({x:p.x,y:p.y,angle:p.angle,d,f,o:.12+.88*smooth01((f-.1)/.8),i});}
    return out;}
  const NK=[[622,248],[867,75]];   // 氣道：肺泡端、外端（lung() 畫氣道、氨的呼氣路線共用）
  /* 肺泡壁是一圈細胞（扁平、紫色細胞核）：沿同一個正圓畫弧，不改肺泡的圓 */
  function wallCells(ctx,R){ctx.save();ctx.lineCap='round';
    for(let i=0;i<12;i++){const a=(i*30+7)*Math.PI/180,x=ALV.x+R*Math.cos(a),y=ALV.y+R*Math.sin(a);
      ctx.beginPath();ctx.arc(ALV.x,ALV.y,R,a-.17,a+.17);ctx.strokeStyle='#7d4f50';ctx.lineWidth=15;ctx.stroke();ctx.strokeStyle='#e0a094';ctx.lineWidth=11;ctx.stroke();
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ellipse(ctx,0,0,8,4.5,'#d7b6ed','#786098',1);ctx.restore();}
    ctx.restore();}
  /* 溶在血漿裡的物質：跟著血漿走（不是紅血球的乘客）。
   * 葡萄糖：走到某處 → 穿過微血管壁進肺泡壁細胞（供細胞自己用，不進空氣、不被呼出）。
   * 氨：多數留在血中（交給肝臟變尿素）；只有極少量穿過肺泡壁，混進肺泡空氣，隨呼氣出去。 */
  /* 教學引擎每按一次只播 10 秒就停（慢速只看到前 5 秒），而且每次都從 0 秒重來 → 事件要排在最前面：te＝開始穿過的時間（秒） */
  const SOL_UP=1.5,A_UP=1.3,A_DR=1.5,A_EX=2.4,SOL_LANE=15.5,SOL_RIDE=f=>(LUNG_D0+LUNG_ARC*f)/LUNG_SPEED;
  const SOLUTES=[
    {k:'glucose',fe:.904,te:.6},{k:'glucose',fe:.664,te:2.2},{k:'glucose',fe:.424,te:3.8},{k:'glucose',fe:.184,te:5.4},   // fe：對準 4 顆肺泡壁細胞的中心（67°、97°、127°、157°）
    {k:'ammonia',fe:.84,te:.4,cross:1},{k:'ammonia',stay:1,ph:4.3},{k:'ammonia',stay:1,ph:10}].map(p=>{
    p.T=p.stay?LUNG_ROUTE.length/LUNG_SPEED+1:p.cross?SOL_RIDE(p.fe)+A_UP+A_DR+A_EX+2:SOL_RIDE(.904)+SOL_UP+1.2;
    if(!p.stay)p.ph=SOL_RIDE(p.fe)-p.te;return p;});
  function solute(p,t){const u=mod((t+p.ph)/p.T)*p.T,L=LUNG_ROUTE.length;
    if(p.stay){const d=u*LUNG_SPEED;if(d>L)return null;const q=C.geometry.at(LUNG_ROUTE,d,SOL_LANE);return{x:q.x,y:q.y,a:Math.min(1,d/50,(L-d)/50)};}
    const ride=SOL_RIDE(p.fe),deg=180-125*p.fe,lane=p.cross?SOL_LANE:-SOL_LANE;   // 氨從外側走、一路穿過血管；葡萄糖走靠肺泡的內側
    if(u<ride){const d=u*LUNG_SPEED,q=C.geometry.at(LUNG_ROUTE,d,lane);return{x:q.x,y:q.y,a:Math.min(1,d/50)};}
    const q0=C.geometry.at(LUNG_ROUTE,ride*LUNG_SPEED,lane),lerp=(a,b,e)=>[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e],P0=[q0.x,q0.y];
    if(!p.cross){const v=(u-ride)/SOL_UP;if(v>1)return null;const e=smooth01(v),pt=lerp(P0,LUNG_XY(ALV.r-2,deg),e);return{x:pt[0],y:pt[1],a:1-smooth01((v-.55)/.45),trail:[P0,pt],glow:[deg,Math.sin(Math.PI*v)]};}
    const v=(u-ride)/A_UP,IN=LUNG_XY(ALV.r*.55,deg);
    if(v<=1){const pt=lerp(P0,IN,smooth01(v));return{x:pt[0],y:pt[1],a:1,trail:[P0,pt]};}
    const w=(u-ride-A_UP)/A_DR;
    if(w<=1){const pt=lerp(IN,NK[0],smooth01(w));return{x:pt[0],y:pt[1],a:1};}
    const z=(u-ride-A_UP-A_DR)/A_EX;if(z>1)return null;
    const ux=NK[1][0]-NK[0][0],uy=NK[1][1]-NK[0][1],ul=Math.hypot(ux,uy);
    return{x:NK[0][0]+ux*z+uy/ul*10,y:NK[0][1]+uy*z-ux/ul*10,a:Math.min(1,(1-z)*8)};}
  function lung(ctx,s,t,D){
    const breath=1+Math.sin(t*.8)*.025,R=ALV.r*breath;
    // 氣道（細支氣管末端）接在肺泡右上方
    line(ctx,[[622,248],[1014,-29]],'#e9aa9f',60);line(ctx,[[622,248],[1014,-29]],'#2b5249',48);
    ellipse(ctx,ALV.x,ALV.y,R,R,gradient(ctx,ALV.x,ALV.y-10,R*1.12,'#4d8b88','#264c46'),'#e9aa9f',7);   // 肺泡：正圓
    ctx.beginPath();ctx.arc(ALV.x,ALV.y,R-12,0,TAU);ctx.strokeStyle='#c7827c';ctx.lineWidth=2;ctx.stroke();
    wallCells(ctx,R);
    // 微血管（血漿淡黃）＋單列紅血球
    C.render.tubes(ctx,[LUNG_ROUTE],[LCR],0,2);
    const cells=lungCells(t);
    ctx.save();C.render.clipTubes(ctx,[LUNG_ROUTE],[LCR]);cells.forEach(c=>lungRbc(ctx,c.x,c.y,LUNG_CELL_R,c.o,c.angle));ctx.restore();
    // 氣道裡的空氣：吸氣（青）進肺泡、呼氣（灰）出去，兩條分開的通道
    const nk=NK,ux=nk[1][0]-nk[0][0],uy=nk[1][1]-nk[0][1],ul=Math.hypot(ux,uy),nx=-uy/ul,ny=ux/ul;
    for(let n=0;n<3;n++){const u=mod(t/3.4+n/3);ctx.save();ctx.globalAlpha=Math.min(1,u*8,(1-u)*8)*.9;
      ellipse(ctx,nk[1][0]-ux*u+nx*10,nk[1][1]-uy*u+ny*10,5,5,'#55e9ff');ctx.globalAlpha=Math.min(1,u*8,(1-u)*8)*.9;
      ellipse(ctx,nk[0][0]+ux*u-nx*10,nk[0][1]+uy*u-ny*10,5,5,'#9fc1bc');ctx.restore();}
    text(ctx,D,P('肺泡內空氣','Alveolar air'),ALV.x,ALV.y-6,24,'#55e9ff','center');
    text(ctx,D,P('肺泡壁細胞','Alveolar-wall cells'),ALV.x+R+18,ALV.y+30,22,'#e9aa9f');
    text(ctx,D,P('肺動脈來：較少氧','From artery: less O₂'),30,232,22,'#df8794');
    text(ctx,D,P('肺微血管','Lung capillary'),30,266,22);
    text(ctx,D,P('回肺靜脈：較多氧','More O₂ → vein'),935,436,22,'#ff9c83','right');
    text(ctx,D,P('紅血球單列，一次一顆','Red cells in single file'),935,478,22,'#f1e3ae','right');
    text(ctx,D,P('吸氣','Inhale'),672,112,22,'#55e9ff');text(ctx,D,P('呼氣','Exhale'),836,162,22,'#9fc1bc');
  }
  /* 氣體交換動畫：每顆紅血球繞過肺泡時，先放出二氧化碳（進肺泡）、再收進氧氣（從肺泡來）。依「追蹤哪種物質」調淡另一種。 */
  function lungFlows(ctx,s,t,D){
    const list=flows('lung',s.lungView,s.kidneyView),on=k=>!s.substance||s.substance==='all'||s.substance===k;
    const cells=lungCells(t),EV=[['carbon',.02,.22],['carbon',.17,.37],['carbon',.32,.52],['oxygen',.12,.32],['oxygen',.27,.47],['oxygen',.42,.62],['oxygen',.57,.77],['oxygen',.72,.92]];
    for(const c of cells){if(c.f<0||c.f>1)continue;
      let ix=ALV.x-c.x,iy=ALV.y-c.y;const il=Math.hypot(ix,iy)||1;ix/=il;iy/=il;
      for(const [kind,a,b] of EV){if(c.f<a||c.f>b)continue;const q=(c.f-a)/(b-a),e=smooth01(q),reach=ALV.r*.62;
        const x0=kind==='oxygen'?c.x+ix*reach:c.x,x1=kind==='oxygen'?c.x:c.x+ix*reach,y0=kind==='oxygen'?c.y+iy*reach:c.y,y1=kind==='oxygen'?c.y:c.y+iy*reach;
        ctx.save();ctx.globalAlpha=(on(kind)?1:.14)*Math.min(1,q*6,(1-q)*6);molecule(ctx,kind,{x:x0+(x1-x0)*e,y:y0+(y1-y0)*e},10);ctx.restore();}}
    for(const p of SOLUTES){const q=solute(p,t);if(!q)continue;const a=on(p.k)?1:.14;
      if(q.glow){ctx.save();ctx.beginPath();ctx.arc(ALV.x,ALV.y,ALV.r,(q.glow[0]-9)*Math.PI/180,(q.glow[0]+9)*Math.PI/180);ctx.lineCap='round';ctx.lineWidth=13;ctx.strokeStyle='#fde047';ctx.globalAlpha=.55*q.glow[1]*a;ctx.stroke();ctx.restore();}
      if(q.trail){ctx.save();ctx.setLineDash([4,5]);ctx.globalAlpha=.7*a;line(ctx,q.trail,SPECIES[p.k].color,2);ctx.restore();}
      ctx.save();ctx.globalAlpha=a*q.a;molecule(ctx,p.k,{x:q.x,y:q.y},p.k==='glucose'?6.5:8);ctx.restore();}
    for(const f of list){ctx.save();ctx.globalAlpha=on(f.kind)?1:.14;text(ctx,D,f.label,f.at[0],f.at[1],22,SPECIES[f.kind].color,'right');ctx.restore();}
    ctx.save();ctx.globalAlpha=on('ammonia')?1:.14;text(ctx,D,P('多數氨留在血中 → 肝臟變尿素','Most NH₃ stays in blood → liver makes urea'),935,520,22,SPECIES.ammonia.color,'right');ctx.restore();
    return list;
  }
  function kidney(ctx,s,t,D){ellipse(ctx,252,247,97,101,'#27453e','#e3c3a4',4);paintBlood(ctx,[...TUFT,RENAL_RETURN],t,10,u=>1-u*.65);const tubule=[[335,289],[393,289],[398,404],[677,404],[788,404],[831,484]];line(ctx,tubule,'#cfb79d',30);line(ctx,tubule,'#eee1b8',22);ellipse(ctx,740,222,110,44,'#37594a','#a2c8aa');text(ctx,D,P('腎絲球','Glomerulus'),145,126,24,'#fde047');text(ctx,D,P('過濾膜','Filter'),331,227,22);text(ctx,D,P('先過濾','Filtered first'),356,466,22,'#ede1ba');text(ctx,D,P('腎小管','Renal tubule'),435,519,22,'#ede1ba');text(ctx,D,P('血球留在血管內','Blood cells stay in blood'),37,366,22,'#f4b3aa');text(ctx,D,P('腎細胞','Kidney cells'),739,238,22,INK,'center');text(ctx,D,P('腎靜脈回流','To renal vein'),768,299,22,'#df8794');}
  /* ---- 小腸：絨毛（老師 2026-11-23：「這根本就不像絨毛」，以課本的絨毛圖為版型重畫；只借構圖，自己畫）----
   * 左：一根手指狀的絨毛——外面一圈單層上皮細胞，裡面是微血管環（左上行、右下行）＋中央的乳糜管（淋巴管的起點，脂質走這）。
   * 右：圓圈放大＝上皮細胞（微絨毛朝向腸腔、細胞核、粒線體）和旁邊的微血管。
   * 動畫：葡萄糖從腸腔穿過微絨毛、細胞、組織液，進微血管，順血流往下（肝門靜脈→肝臟）；氧氣由血液進細胞、二氧化碳回血液。 */
  const TIP={x:215,y:240},V_OUT=100,V_EPI=18,V_CAP=58,V_BASE=485,V_END=522,IV=38;
  const ZC={x:640,y:308,r:190},ZX=555,ZROW=[220,308,396],ZC0=600,ZC1=720,ZMV=22,ZLANE=12;
  const circPiece=(cx,cy,r,a0,a1)=>{const t0=a0*Math.PI/180,t1=a1*Math.PI/180,k=4/3*Math.tan((t1-t0)/4)*r,p0=[cx+r*Math.cos(t0),cy+r*Math.sin(t0)],p3=[cx+r*Math.cos(t1),cy+r*Math.sin(t1)];
    return[p0,[p0[0]-k*Math.sin(t0),p0[1]+k*Math.cos(t0)],[p3[0]+k*Math.sin(t1),p3[1]-k*Math.cos(t1)],p3];};
  const VIL_PIECES=[[[TIP.x-V_CAP,V_END],[TIP.x-V_CAP,435],[TIP.x-V_CAP,335],[TIP.x-V_CAP,TIP.y]],circPiece(TIP.x,TIP.y,V_CAP,180,270),circPiece(TIP.x,TIP.y,V_CAP,270,360),[[TIP.x+V_CAP,TIP.y],[TIP.x+V_CAP,335],[TIP.x+V_CAP,435],[TIP.x+V_CAP,V_END]]];
  const VIL_ROUTE=chain(VIL_PIECES),VIL_L=VIL_ROUTE.length,VIL_D1=C.geometry.curve(VIL_PIECES[0]).length,VIL_ARC=Math.PI*V_CAP;
  const ZCAP=C.geometry.curve([[ZX,60],[ZX,230],[ZX,400],[ZX,560]]);
  const LAC=[[TIP.x,V_END-12],[TIP.x,TIP.y-9]];
  // 上皮細胞排成單層一圈：沿「左側向上 → 頂端半圓 → 右側向下」排，記下每顆的位置與朝外方向
  const VCELLS=(()=>{const rc=V_OUT-V_EPI/2,H=V_BASE-TIP.y,S=2*H+Math.PI*rc,N=Math.round(S/19),list=[];
    for(let n=0;n<N;n++){const q=(n+.5)*S/N;let x,y,phi;
      if(q<H){x=TIP.x-rc;y=V_BASE-q;phi=Math.PI;}
      else if(q<H+Math.PI*rc){const a=Math.PI+(q-H)/rc;x=TIP.x+rc*Math.cos(a);y=TIP.y+rc*Math.sin(a);phi=a;}
      else{x=TIP.x+rc;y=TIP.y+(q-H-Math.PI*rc);phi=0;}
      list.push({x,y,phi});}
    return{list,w:S/N-2};})();
  const villusPath=(ctx,cx,r,y1)=>{ctx.beginPath();ctx.moveTo(cx-r,y1);ctx.lineTo(cx-r,TIP.y);ctx.arc(cx,TIP.y,r,Math.PI,TAU);ctx.lineTo(cx+r,y1);};
  /* 血管：血漿淡黃管＋單列紅血球（流速 IV，與溶在血漿的物質同速） */
  function bloodLoop(ctx,route,radius,t,spacing,rbcR,oxy){
    C.render.tubes(ctx,[route],[radius],0,2);ctx.save();C.render.clipTubes(ctx,[route],[radius]);
    C.geometry.cells(route,t,[0],spacing,IV,rbcR).forEach(q=>C.render.rbc(ctx,q.x,q.y,q.r,oxy(q.d/route.length),q.angle+q.tilt));ctx.restore();}
  function villus(ctx,t,s){
    const fat=s.substance&&s.substance!=='all';
    // 左邊露出一點鄰居絨毛（暗）：絨毛不只一根
    ctx.save();ctx.globalAlpha=.3;villusPath(ctx,-12,V_OUT-4,V_BASE+4);ctx.fillStyle='#22453b';ctx.fill();ctx.strokeStyle='#bce0b655';ctx.lineWidth=12;ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.roundRect(60,V_BASE-4,330,20,8);ctx.fillStyle='#bce0b6';ctx.fill();   // 腸壁（絨毛的底）
    villusPath(ctx,TIP.x,V_OUT-V_EPI,V_BASE);ctx.closePath();ctx.fillStyle='#2c5246';ctx.fill();   // 核心（疏鬆結締組織）
    // 乳糜管：中央、盲端、往下通到淋巴；脂質的小滴走這條，不進微血管
    line(ctx,LAC,'#9fc1bc',24);line(ctx,LAC,'#e7f1e6',17);
    ctx.save();ctx.globalAlpha=fat?.2:1;for(let n=0;n<5;n++){const y=TIP.y+4+mod((t*22+n*60)/300)*300;if(y>V_END-8)continue;ellipse(ctx,TIP.x+(n%2?3:-3),y,3.6,3.6,'#fff1b8','#e0c470',1);}ctx.restore();
    bloodLoop(ctx,VIL_ROUTE,10,t,38,6.4,u=>1-.7*u);   // 微血管環：左側上行（鮮紅）→ 頂端 → 右側下行（較暗）
    // 上皮細胞（單層、柱狀；細胞核紫色；朝腸腔那一面是微絨毛）
    ctx.save();ctx.lineCap='round';
    for(const c of VCELLS.list){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.phi);
      ctx.beginPath();ctx.roundRect(-V_EPI/2,-VCELLS.w/2,V_EPI,VCELLS.w,4);ctx.fillStyle='#d4daa8';ctx.fill();ctx.strokeStyle='#658864';ctx.lineWidth=1.4;ctx.stroke();
      ellipse(ctx,-3,0,5.5,3.6,'#a98bd8');
      ctx.beginPath();for(let k=0;k<4;k++){const y=-VCELLS.w/2+2.5+k*(VCELLS.w-5)/3;ctx.moveTo(V_EPI/2,y);ctx.lineTo(V_EPI/2+6,y);}ctx.strokeStyle='#e8dca0';ctx.lineWidth=1.8;ctx.stroke();
      ctx.restore();}
    ctx.restore();
    // 放大鏡：絨毛右側牆上一個圈，連到右邊的大圓
    const sp={x:TIP.x+V_OUT-V_EPI/2,y:345};
    ctx.save();ctx.setLineDash([6,6]);line(ctx,[[sp.x+14,sp.y-16],[ZC.x-ZC.r*.97,ZC.y-ZC.r*.26]],'#bce0b6aa',2);line(ctx,[[sp.x+14,sp.y+16],[ZC.x-ZC.r*.97,ZC.y+ZC.r*.26]],'#bce0b6aa',2);ctx.restore();
    ctx.beginPath();ctx.arc(sp.x,sp.y,21,0,TAU);ctx.strokeStyle='#eaf4e6';ctx.lineWidth=3;ctx.stroke();
    // 血管末端淡出（避免切口），再放標籤
    const g=ctx.createLinearGradient(0,V_BASE+14,0,V_END+3);g.addColorStop(0,BG+'00');g.addColorStop(1,BG);ctx.fillStyle=g;ctx.fillRect(40,V_BASE+14,360,V_END-V_BASE-8);
  }
  function zoom(ctx,t){
    ctx.save();ctx.beginPath();ctx.arc(ZC.x,ZC.y,ZC.r,0,TAU);ctx.clip();
    ctx.fillStyle='#1d3d34';ctx.fillRect(ZC.x-ZC.r,ZC.y-ZC.r,2*ZC.r,2*ZC.r);
    ctx.fillStyle='#25474d';ctx.fillRect(ZC1+ZMV,ZC.y-ZC.r,ZC.x+ZC.r-ZC1-ZMV,2*ZC.r);   // 腸腔
    bloodLoop(ctx,ZCAP,20,t,34,8.4,()=>.6);
    for(const yc of ZROW){
      ctx.beginPath();ctx.roundRect(ZC0,yc-40,ZC1-ZC0,80,16);ctx.fillStyle='#cdd8a0';ctx.fill();ctx.strokeStyle='#658864';ctx.lineWidth=2.5;ctx.stroke();
      mitochondrion(ctx,632,yc-12,38,22);
      ellipse(ctx,676,yc-10,15,19,gradient(ctx,676,yc-10,22,'#d7b6ed','#786098'),'#d4b1e2',2);
      ctx.save();ctx.lineCap='round';ctx.strokeStyle='#e8dca0';ctx.lineWidth=4.5;ctx.beginPath();for(let k=0;k<9;k++){const y=yc-34+k*8.5;ctx.moveTo(ZC1,y);ctx.lineTo(ZC1+ZMV,y);}ctx.stroke();ctx.restore();}
    ctx.restore();
    ctx.beginPath();ctx.arc(ZC.x,ZC.y,ZC.r,0,TAU);ctx.strokeStyle='#bce0b6';ctx.lineWidth=4;ctx.stroke();
  }
  function intestine(ctx,s,t,D){
    villus(ctx,t,s);zoom(ctx,t);
    text(ctx,D,P('絨毛','Villus'),TIP.x,122,24,'#d4daa8','center');
    text(ctx,D,P('乳糜管','Lacteal'),104,300,22,'#cfe6df','right');text(ctx,D,P('脂質走這','Fat'),104,330,22,'#fff1b8','right');
    line(ctx,[[110,294],[TIP.x-12,294]],'#cfe6df88',1.5);
    ctx.save();ctx.globalAlpha=!s.substance||s.substance==='all'||s.substance==='glucose'?1:.14;text(ctx,D,P('肝門靜脈 → 肝臟','Portal vein → liver'),292,508,22,'#fde047');ctx.restore();
    text(ctx,D,P('微血管','Vessel'),ZC.x-ZC.r+8,ZC.y+8,22,'#f1e3ae');
    text(ctx,D,P('腸腔','Lumen'),ZC1+ZMV+8,ZC.y-18,22,'#55e9ff');
    text(ctx,D,P('微絨毛','Microvilli'),836,ZROW[0]+8,22,'#e8dca0');line(ctx,[[830,ZROW[0]],[ZC1+ZMV+4,ZROW[0]]],'#e8dca088',1.5);
    text(ctx,D,P('上皮細胞','Epithelium'),836,396,22,'#d4daa8');line(ctx,[[830,388],[712,372]],'#d4daa888',1.5);
  }
  /* 分子動畫（葡萄糖／氧氣／二氧化碳）：全部排在最前面幾秒（教學引擎一次只播 10 秒、從 0 秒開始） */
  const halo=(ctx,x,y,r)=>{ctx.save();ctx.fillStyle=BG;ctx.globalAlpha*=.55;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();};
  const cyc=(t,ts,T)=>mod((t-ts)/T)*T;
  const VIL_GLU=[{a:300,ts:.2},{a:345,ts:1.5},{a:0,ts:2.8}].map(g=>{
    g.d=g.a?VIL_D1+(g.a-180)*VIL_ARC/180:VIL_D1+VIL_ARC+100;g.n=g.a?[Math.cos(g.a*Math.PI/180),Math.sin(g.a*Math.PI/180)]:[1,0];
    g.T=1.8+(VIL_L-g.d)/IV+1.6;return g;});
  const ZBOT=ZC.y+ZC.r;
  function intestineFlows(ctx,s,t,D){
    const list=flows('intestine'),on=k=>!s.substance||s.substance==='all'||s.substance===k;
    const mol=(k,x,y,a,size)=>{ctx.save();ctx.globalAlpha=(on(k)?1:.14)*a;halo(ctx,x,y,size*1.7);molecule(ctx,k,{x,y},size);ctx.restore();};
    // 絨毛上的葡萄糖：腸腔 → 上皮細胞 → 微血管（1.8 秒），再順血流往下
    for(const g of VIL_GLU){const u=cyc(t,g.ts,g.T),pc=C.geometry.at(VIL_ROUTE,g.d,0);
      if(u<1.8){const e=smooth01(u/1.8),dist=(V_OUT+52-V_CAP)*(1-e);mol('glucose',pc.x+g.n[0]*dist,pc.y+g.n[1]*dist,Math.min(1,u*5),7);}
      else{const d=g.d+(u-1.8)*IV;if(d>VIL_L)continue;const q=C.geometry.at(VIL_ROUTE,d,4);mol('glucose',q.x,q.y,Math.min(1,(VIL_L-d)/50),6.5);}}
    // 放大圓裡：每列細胞各一顆葡萄糖（穿過微絨毛 → 細胞 → 組織液 → 微血管）、一顆氧氣（血液 → 粒線體）、一顆二氧化碳（粒線體 → 血液）
    ctx.save();ctx.beginPath();ctx.arc(ZC.x,ZC.y,ZC.r-2,0,TAU);ctx.clip();
    ZROW.forEach((yc,i)=>{
      const yg=yc+18,Tg=2.7+(ZBOT-yg)/IV+1.5,ug=cyc(t,[.3,1.9,3.5][i],Tg);
      if(ug<2.7)mol('glucose',805-(805-ZX-ZLANE)*smooth01(ug/2.7),yg,Math.min(1,ug*4),8);
      else{const y=yg+(ug-2.7)*IV;if(y<ZBOT+12)mol('glucose',ZX+ZLANE,y,Math.min(1,(ZBOT+12-y)/40),8);}
      const yo=yc-6,uo=cyc(t,[1.0,2.8,4.6][i]-2.1,5.6);   // 氧氣：先順血流下來 2.1 秒，再進細胞 1.4 秒
      if(uo<2.1)mol('oxygen',ZX+ZLANE,yo-(2.1-uo)*IV,Math.min(1,uo*4),9);
      else if(uo<3.5){const v=(uo-2.1)/1.4;mol('oxygen',ZX+ZLANE+(632-ZX-ZLANE)*smooth01(v),yo,Math.min(1,(1-v)*5),9);}
      const yk=yc-17,uk=cyc(t,[.2,2.0,3.8][i],1.4+(ZBOT-yk)/IV+1.5);   // 二氧化碳：粒線體 → 血液，再順血流離開
      if(uk<1.4)mol('carbon',632-(632-ZX-ZLANE)*smooth01(uk/1.4),yk,Math.min(1,uk*4),8);
      else{const y=yk+(uk-1.4)*IV;if(y<ZBOT+12)mol('carbon',ZX+ZLANE,y,Math.min(1,(ZBOT+12-y)/40),8);}});
    ctx.restore();
    for(const f of list){ctx.save();ctx.globalAlpha=on(f.kind)?1:.14;text(ctx,D,f.label,f.at[0],f.at[1],22,SPECIES[f.kind].color,'right');ctx.restore();}
    return list;
  }
  function draw(ctx,s,t,D){ctx.save();const zone=ZONES.find(z=>z.id===s.exchange)||ZONES[4];ctx.fillStyle=BG;ctx.fillRect(0,0,960,600);icon(ctx,zone.tile,26,30,100);wrap(ctx,D,zone.id==='lung'&&s.lungView==='cells'?LUNG_CELLS.title:zone.id==='kidney'&&s.kidneyView==='extension'?KIDNEY_EXTRA.title:zone.title,143,49,790,27,'#fde047');const time=t*(s.exchangeSpeed||1);if(zone.id==='lung'&&s.lungView!=='cells')lung(ctx,s,time,D);else if(zone.id==='kidney'&&s.kidneyView==='extension')kidney(ctx,s,time,D);else if(zone.id==='intestine')intestine(ctx,s,time,D);else basic(ctx,s,time,D,zone.id);if(zone.id==='liver')convertAmmonia(ctx,s,time);const list=zone.id==='lung'&&s.lungView!=='cells'?lungFlows(ctx,s,time,D):zone.id==='intestine'?intestineFlows(ctx,s,time,D):animateFlows(ctx,s,time,D,zone.id);legend(ctx,s,D,zone.id);s.exchangeTrace={zone:zone.id,kidneyView:zone.id==='kidney'?(s.kidneyView||'cells'):null,lungView:zone.id==='lung'?(s.lungView||'gas'):null,flows:list.map(f=>({kind:f.kind,from:f.from,to:f.to,u:mod(time/f.period+f.offset)}))};D.status(P(`${zone.name[0]}：沿箭頭看物質從哪裡來、到哪裡去。`,`${zone.name[1]}: follow each substance from its source to its destination.`));ctx.restore();return s.exchangeTrace;}
  function explain(s){const z=ZONES.find(z=>z.id===s.exchange)||ZONES[4];return z.id==='lung'&&s.lungView==='cells'?{title:LUNG_CELLS.title,text:LUNG_CELLS.text}:z.id==='kidney'&&s.kidneyView==='extension'?{title:KIDNEY_EXTRA.title,text:KIDNEY_EXTRA.text}:{title:z.title,text:z.text};}
  const LYMPH_MEDIA='assets/biology/human_transport_media_1012_v1/';
  const LYMPH_CAPS=[
    [[180,282],[240,153],[453,154],[570,282]],
    [[180,282],[276,211],[467,347],[570,282]],
    [[180,282],[283,239],[456,220],[570,282]],
    [[180,282],[294,331],[455,352],[570,282]],
    [[180,282],[251,424],[466,410],[570,282]],
    [[180,282],[255,173],[459,408],[570,282]]
  ].map(p=>C.geometry.curve(p,64));
  const LYMPH_COLLECTOR=chain([[[340,318],[352,360],[408,416],[475,430]],[[475,430],[543,450],[648,438],[735,430]],[[735,430],[838,430],[920,378],[920,298]],[[920,298],[920,258],[920,218],[890,178]]]);
  const LYMPH_BRANCH=chain([[[451,206],[472,243],[447,301],[423,375]],[[423,375],[418,402],[450,425],[475,430]]]);
  const LYMPH_OUTFLOWS=[.32,.51,.69].map((u,i)=>{const a=C.geometry.at(LYMPH_CAPS[i],LYMPH_CAPS[i].length*u),b=C.geometry.at(i===1?LYMPH_BRANCH:LYMPH_COLLECTOR,i===1?56:40+i*27);return[[a.x,a.y],[a.x+15,a.y+29],[b.x-23,b.y-12],[b.x,b.y]];});
  function routePoints(route){return route.samples.map(p=>[p.x,p.y]);}
  function lymphTube(ctx,route,r=9){const pts=routePoints(route);line(ctx,pts,'#376c4b',r*2+5);line(ctx,pts,'#8cbb6b',r*2+1);line(ctx,pts,'#e4eab9',r*2-5);}
  function lymphNode(ctx){ellipse(ctx,735,430,53,36,gradient(ctx,735,430,54,'#b9d28a','#537946'),'#b8d58e',3);ellipse(ctx,749,430,23,17,'#dce3b0');for(let i=0;i<5;i++){const a=1.15+i*.74;ellipse(ctx,735+Math.cos(a)*34,430+Math.sin(a)*21,9,8,'#d5ddab');ellipse(ctx,735+Math.cos(a)*34,430+Math.sin(a)*21,5,4,'#8da976');}line(ctx,[[700,430],[715,435],[752,430],[778,430]],'#e4eab9',8);}
  function lymph(ctx,s,t,D){
    ctx.save();
    ctx.fillStyle=BG;ctx.fillRect(0,0,960,600);
    if(s.lymphView==='reference'){
      wrap(ctx,D,P('維基來源圖：NIH／SEER 的組織間淋巴管','Commons source: NIH / SEER lymphatic capillaries'),24,38,910,26,'#fde047');
      image(ctx,LYMPH_MEDIA+(D.tr(P('zh','en'))==='zh'?'lymph_capillaries_seer_zh.png':'lymph_capillaries_seer_en.png'),30,117,900,365);
      wrap(ctx,D,P('來源頁標示 Public domain；原圖保留。藍色靜脈是原圖的示意色，不是藍色血液。','Source marked Public domain; original retained. The blue venule is a diagram colour, not blue blood.'),30,527,900,22);
      D.status(P('可切回原創動畫，追蹤水分子的回收路線。','Switch back to the original animation to follow fluid recovery.'));ctx.restore();return;
    }
    text(ctx,D,P('微血管外的接力：從組織間，回到循環','Outside capillaries: tissue fluid returns to circulation'),24,38,26,'#fde047');
    // Original landscape layout. Small vessels and a fine mesh occupy the
    // tissue field; the neck-vein inset is remote, not the local venule.
    for(let i=0;i<28;i++){const x=207+(i%7)*69+Math.sin(i*5.13)*16,y=162+Math.floor(i/7)*79+Math.cos(i*2.71)*17;if(LYMPH_OUTFLOWS.some(p=>p.some(q=>Math.hypot(q[0]-x,q[1]-y)<29)))continue;ellipse(ctx,x,y,22+i%3*3,19+i%4,gradient(ctx,x,y,30,'#d4dbb6','#65816a'),'#a4b89a',1.5);ellipse(ctx,x+4,y-3,5,6,'#9c846e');}
    for(const route of LYMPH_CAPS){const pts=routePoints(route);line(ctx,pts,'#d59c8c',18);line(ctx,pts,'#f7edc5',13);}
    // Separate true cutaways: thicker muscle around arteriole, thinner around
    // venule. Capillary mesh is single-file and much finer than either trunk.
    blood(ctx,[[74,421],[54,303],[87,258],[180,282]],t,21,1,9);
    blood(ctx,[[570,282],[625,247],[660,298],[671,363]],t,24,.2,3);
    for(const [i,route]of LYMPH_CAPS.entries()){ctx.save();C.render.clipTubes(ctx,[route],[6.5]);C.geometry.cells(route,t+i*.8,[0],37,16,4.6).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,1-.8*p.d/route.length,p.angle+p.tilt));ctx.restore();}
    lymphTube(ctx,LYMPH_BRANCH);lymphTube(ctx,LYMPH_COLLECTOR,10);lymphNode(ctx);
    // Valves belong to collecting vessels, not a big door on a blind tip.
    for(const d of [243,351]){const p=C.geometry.at(LYMPH_COLLECTOR,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);line(ctx,[[-4,-8],[4,-3]],'#638846',2);line(ctx,[[-4,8],[4,3]],'#638846',2);ctx.restore();}
    D.round(ctx,755,106,180,227,14,'#1c3d34','#6b9a85');
    text(ctx,D,P('頸根部回流','Neck return'),769,137,22,'#55e9ff');
    blood(ctx,[[777,178],[817,171],[863,179],[910,178]],t,10,.2);
    // Repaint the inlet through the inset boundary, not just the upper segment:
    // the collection route must remain continuous across the explanatory frame.
    lymphTube(ctx,{samples:LYMPH_COLLECTOR.samples.filter(p=>p.x>825)},10);
    text(ctx,D,P('接回靜脈','Into a vein'),774,228,22);
    text(ctx,D,P('再回心臟 →','To heart →'),774,263,22,'#df8794');
    text(ctx,D,P('遠端回流','Remote return'),767,290,18,'#b9cbbd');
    text(ctx,D,P('不同尺度','Not to scale'),767,315,18,'#b9cbbd');
    const rate=s.movement==='active'?.095:.06;
    for(const path of LYMPH_OUTFLOWS){arrow(ctx,path,'#55e9ff');for(let i=0;i<2;i++){const u=mod(t*rate+i/2),p=G.point(path,u);ctx.save();ctx.globalAlpha=Math.min(1,u*10,(1-u)*10);D.water(ctx,p.x,p.y,5);ctx.restore();}}
    for(const [j,route]of [LYMPH_BRANCH,LYMPH_COLLECTOR].entries()){const pts=routePoints(route);arrow(ctx,pts,'#89d273');for(let i=0;i<(j?6:3);i++){const p=C.geometry.at(route,mod(t*rate+i/(j?6:3))*route.length);D.water(ctx,p.x,p.y,5);}}
    arrow(ctx,routePoints(C.geometry.curve([[74,421],[54,303],[87,258],[180,282]])),INK);
    arrow(ctx,routePoints(C.geometry.curve([[570,282],[625,247],[660,298],[671,363]])),INK);
    text(ctx,D,P('小動脈','Arteriole'),24,473,22,'#ff9c83');
    text(ctx,D,P('微血管網','Capillary mesh'),250,121,24,'#f3c7b7');
    text(ctx,D,P('組織細胞','Tissue cells'),474,122,22,'#bbceb4');
    text(ctx,D,P('小靜脈','Venule'),620,407,22,'#df8794');
    text(ctx,D,P('封閉的盲端','Closed blind ends'),246,486,22,'#a6df80');
    text(ctx,D,P('淋巴結','Lymph node'),728,484,22,'#a6cb80');
    ctx.beginPath();ctx.arc(340,318,15,0,TAU);ctx.strokeStyle='#a6df80';ctx.lineWidth=2;ctx.stroke();
    text(ctx,D,P('血漿 → 組織液 → 淋巴管 → 靜脈','Plasma → tissue fluid → lymphatics → veins'),24,536,26,'#fde047');
    text(ctx,D,P('青箭頭：流出微血管；綠箭頭：進淋巴回收；白箭頭：血流。','Cyan: fluid leaves capillaries. Green: lymph return. White: blood flow.'),24,572,20,'#b9cbbd');
    text(ctx,D,P('紅血球留在血管內；綠色只辨識淋巴管，不是淋巴的真實顏色。','Red cells stay in blood; green identifies lymphatics, not the true colour of lymph.'),24,598,18,'#b9cbbd');
    const hitboxes={plasma:[45,244,145,188],tissue:[224,165,390,215],lymph:[329,365,335,94],node:[682,392,106,86],return:[755,106,180,227]};
    for(const [value,b]of Object.entries(hitboxes))D.hit(...b,'compartment',value);
    const b=hitboxes[s.compartment];if(b){ctx.save();ctx.strokeStyle='#fde047';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.strokeRect(...b);ctx.restore();}
    s.lymphTrace={directCapillaryReturn:false,returnTo:'remote neck veins',redCellsOutsideBlood:0,capillaryLumenRadius:6.5,arterioleLumenRadius:21,venuleLumenRadius:24};
    D.status(P('微血管細、靜脈粗；液體經盲端淋巴管、淋巴結，回到頸根部靜脈。','Fine capillaries, larger venules; fluid returns through lymphatics and nodes to neck veins.'));
    ctx.restore();
  }
  root.HumanTransportExchanges=Object.freeze({draw,explain,lymph,zones:ZONES,species:SPECIES,flows,molecule,geometry:{villus:VILLUS,tuft:TUFT,renalReturn:RENAL_RETURN},convertAmmonia});
})(globalThis);
