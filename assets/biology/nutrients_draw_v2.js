/* Original 2.5D apparatus renderer. Model state is separate from paint. */
(function(root){
 'use strict';
 const M=root.NutrientsModel||(typeof require!=='undefined'?require('./nutrients_model_v1.js'):null);
 const W=960,H=620,ink='#f2ecd9',cyan='#b8eef0',dark='#11261f';
 const tr=(l,a,b)=>l==='en'?b:a;
 function path(c,points,close=true){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(close)c.closePath();}
 function rr(c,x,y,w,h,r=12){c.beginPath();c.roundRect(x,y,w,h,r);}
 function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 function label(c,text,x,y,width=200,color=ink){
  let px=26;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${px}px "Noto Sans TC", sans-serif`;
  while(px>22&&c.measureText(text).width>width-20){px--;c.font=`700 ${px}px "Noto Sans TC", sans-serif`;}
  if(c.measureText(text).width>width-16){const words=text.includes(' ')?text.split(' '):Array.from(text);let rows=[''];for(const word of words){const last=rows.length-1;const next=rows[last]?rows[last]+(text.includes(' ')?' ':'')+word:word;if(c.measureText(next).width>width-16&&rows[last])rows.push(word);else rows[last]=next;}if(rows.length>1){rows.forEach((row,i)=>label(c,row,x,y+(i-(rows.length-1)/2)*29,width,color));return;}}
  rr(c,x-width/2,y-20,width,40,9);c.fillStyle='rgba(11,26,21,.86)';c.fill();c.fillStyle=color;c.fillText(text,x,y);
 }
 function table(c){
  const top=c.createLinearGradient(0,350,0,580);top.addColorStop(0,'#bbc7c3');top.addColorStop(.7,'#879792');top.addColorStop(1,'#647a72');
  path(c,[[115,365],[855,365],[960,535],[0,535]]);c.fillStyle=top;c.fill();c.strokeStyle='#d9e3df';c.lineWidth=3;c.stroke();
  path(c,[[0,535],[960,535],[960,556],[0,556]]);c.fillStyle='#657a73';c.fill();
  c.fillStyle='#4e625c';c.fillRect(76,556,32,64);c.fillRect(850,556,32,64);
  c.lineWidth=1;c.strokeStyle='rgba(235,248,241,.16)';for(let k=0;k<6;k++){c.beginPath();c.moveTo(150+k*133,365);c.lineTo(50+k*168,535);c.stroke();}
 }
 function shadow(c,x,y,rx,ry){c.save();c.filter='blur(7px)';ellipse(c,x,y,rx,ry,'rgba(11,26,21,.25)');c.restore();}
 function bottle(c,kind){
  const x=kind==='iodine'?835:95,y=430;shadow(c,x,y+10,62,15);
  const amber=c.createLinearGradient(x-45,0,x+45,0);amber.addColorStop(0,'#5b351c');amber.addColorStop(.2,'#b36e22');amber.addColorStop(.5,'#734118');amber.addColorStop(.8,'#cf9239');amber.addColorStop(1,'#583521');
  rr(c,x-47,y-116,94,117,17);c.fillStyle=amber;c.fill();c.strokeStyle='#dfb06c';c.lineWidth=2;c.stroke();
  c.fillStyle='#9b672c';c.fillRect(x-20,y-140,40,29);ellipse(c,x,y-140,23,7,'#583a25','#d9af70');
  const g=c.createLinearGradient(x-37,0,x+38,0);g.addColorStop(0,'rgba(255,244,184,.36)');g.addColorStop(.35,'rgba(255,244,184,0)');c.fillStyle=g;c.fillRect(x-35,y-104,20,78);
  rr(c,x-39,y-78,78,54,7);c.fillStyle=kind==='iodine'?'#ede1b9':'#bddde6';c.fill();
  c.strokeStyle=kind==='iodine'?'#b58625':'#399eb5';c.lineWidth=5;c.beginPath();c.moveTo(x-22,y-52);c.lineTo(x+22,y-52);c.stroke();
 }
 function pipette(c,x,tipY,kind,fill=true){
  c.save();c.lineCap='round';const length=104;
  const g=c.createLinearGradient(x-8,0,x+8,0);g.addColorStop(0,'rgba(238,255,255,.85)');g.addColorStop(.5,'rgba(131,218,228,.25)');g.addColorStop(1,'rgba(235,255,255,.9)');
  path(c,[[x-8,tipY-length],[x+8,tipY-length],[x+6,tipY-12],[x,tipY],[x-6,tipY-12]]);c.fillStyle=g;c.fill();c.strokeStyle=cyan;c.lineWidth=2;c.stroke();
  if(fill){c.strokeStyle=kind==='iodine'?'#b48632':'#49b9d8';c.lineWidth=5;c.beginPath();c.moveTo(x,tipY-84);c.lineTo(x,tipY-15);c.stroke();}
  if(kind==='benedict'){c.strokeStyle=dark;c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-4,tipY-30-i*12);c.lineTo(x+4,tipY-30-i*12);c.stroke();}}
  rr(c,x-17,tipY-length-39,34,44,12);const rubber=c.createLinearGradient(x-16,0,x+17,0);rubber.addColorStop(0,'#333b38');rubber.addColorStop(.5,'#65766c');rubber.addColorStop(1,'#23332b');c.fillStyle=rubber;c.fill();c.restore();
 }
 function droplet(c,x,y,color,r=6){const g=c.createRadialGradient(x-2,y-3,1,x,y,r);g.addColorStop(0,'#fff4d9');g.addColorStop(.3,color);g.addColorStop(1,color);ellipse(c,x,y,r,r*1.2,g);}
 function sampleDrop(c,x,lab,i){
  const id=i===0?lab.sample:'water',react=lab.reagents[i],pos=i===0&&M.positive(lab);
  const clear=!['starch','rice','banana'].includes(id),rx=54,ry=18,y=425;
  const color=react?(pos?'#292849':'#b99039'):id==='banana'?'#e4d2a3':id==='rice'?'#eee6d1':id==='starch'?'#e7e9df':'rgba(176,203,209,.38)';
  c.save();shadow(c,x,y+12,rx-3,5);
  ellipse(c,x,y+4,rx,ry-2,react?(pos?'#24233b':'#9e762d'):clear?'rgba(114,151,158,.36)':'#c6c4ae');
  const body=c.createRadialGradient(x-18,y-7,2,x,y,61);body.addColorStop(0,react?(pos?'#444067':'#d1ae65'):clear?'rgba(243,254,250,.60)':'#f6f0db');body.addColorStop(.65,color);body.addColorStop(1,react?(pos?'#292849':'#ab7d30'):clear?'rgba(144,178,184,.58)':'#d3ceb6');
  c.lineWidth=2;ellipse(c,x,y,rx,ry,body,react?(pos?'#8d85a4':'#cfb072'):clear?'#7d9b9a':'#b7b69d');
  if(!react&&['rice','banana'].includes(id)){
   c.save();ellipse(c,x,y,rx-2,ry-2);c.clip();for(let j=0;j<16;j++){const a=(j*2.399963),r=Math.sqrt((j+.5)/16);ellipse(c,x+Math.cos(a)*r*43,y+Math.sin(a)*r*12,1.7,1.1,id==='banana'?'rgba(143,122,77,.25)':'rgba(188,175,145,.3)');}c.restore();
  }
  ellipse(c,x-19,y-7,18,3.7,react?'rgba(255,251,222,.3)':'rgba(255,255,249,.85)');
  c.beginPath();c.ellipse(x+4,y+1,rx-5,ry-5,0,.20,1.04);c.strokeStyle=clear&&!react?'rgba(83,124,136,.66)':'rgba(157,147,113,.52)';c.lineWidth=2;c.stroke();c.restore();
 }
 function slide(c,x,lab,i,l){
  shadow(c,x,452,89,14);
  path(c,[[x-88,397],[x+69,397],[x+92,449],[x-66,449]]);c.fillStyle='rgba(221,253,255,.18)';c.fill();c.strokeStyle=cyan;c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(x-65,449);c.lineTo(x-65,456);c.lineTo(x+92,456);c.lineTo(x+92,449);c.strokeStyle='rgba(165,226,230,.65)';c.stroke();
  c.strokeStyle='rgba(255,255,246,.7)';c.lineWidth=2;c.beginPath();c.moveTo(x-80,403);c.lineTo(x+66,403);c.stroke();
  sampleDrop(c,x,lab,i);
  label(c,tr(l,i===0?'甲：待測樣本':'乙：清水',i===0?'A: sample':'B: water'),x,491,192);
 }
 function rack(c){
  shadow(c,360,470,145,20);const wood=c.createLinearGradient(0,385,0,475);wood.addColorStop(0,'#b39469');wood.addColorStop(1,'#6d5a3e');
  rr(c,202,419,318,51,7);c.fillStyle=wood;c.fill();c.strokeStyle='#d7bf92';c.lineWidth=2;c.stroke();
  c.fillStyle='#a68a63';c.fillRect(212,287,16,151);c.fillRect(493,287,16,151);
  path(c,[[202,285],[508,285],[523,304],[213,304]]);c.fillStyle='#b79c72';c.fill();
  ellipse(c,280,298,44,8,'#3c493d');ellipse(c,440,298,44,8,'#3c493d');
 }
 function tubePath(c,x,yTop,yBottom,r=34,angle=0){
  c.save();c.translate(x,yBottom);c.rotate(angle);c.beginPath();c.moveTo(-r,yTop-yBottom);c.lineTo(-r,-r);c.bezierCurveTo(-r,10,r,10,r,-r);c.lineTo(r,yTop-yBottom);c.lineTo(-r,yTop-yBottom);c.closePath();c.restore();
 }
 function tube(c,x,top,bottom,lab,i,angle=0){
  const r=34,adding=lab.motion?.type==='reagent'&&lab.motion.target===i?M.smooth((lab.motion.t-.85)/.85):0,added=lab.reagents[i]||adding>0,height=70+68*(lab.reagents[i]?1:adding);
  if(lab.prepared){
   c.save();tubePath(c,x,top,bottom,r-3,angle);c.clip();
   const level=bottom-height;
   const liquid=c.createLinearGradient(x-r,0,x+r,0);liquid.addColorStop(0,added?'rgba(48,149,192,.68)':'rgba(159,218,227,.35)');liquid.addColorStop(.4,added?'rgba(97,190,211,.7)':'rgba(218,247,244,.4)');liquid.addColorStop(1,added?'rgba(53,134,180,.8)':'rgba(124,194,218,.4)');
   c.fillStyle=liquid;c.fillRect(x-r-15,level,r*2+30,height+12);ellipse(c,x,level,r+8,6,added?'rgba(113,207,224,.82)':'rgba(194,231,232,.65)');
   const reaction=M.reaction(lab,i),sugar=M.sampleOf(lab).sugar;
   if(i===0&&sugar>0&&reaction>0){
    const precipColor=sugar>.7?'#c45826':'#eaa535';
    c.fillStyle=`rgba(214,181,69,${reaction*.18})`;c.fillRect(x-r,level,r*2,height+10);
    const n=Math.floor(58*reaction);for(let j=0;j<n;j++){
     const noise=n=>{const a=Math.sin(n*127.1+23.9)*43758.5453;return a-Math.floor(a);};
     const xx=x-28+noise(j+1)*56,startY=level+8+noise(j+103)*(height-16);
     const fall=M.smooth(lab.settle),y=startY+(bottom-12-(j%4)*3-startY)*fall;
     ellipse(c,xx,y,2.8+(j%3)*.45,2.3,precipColor);
    }
    if(lab.settle>0.2){rr(c,x-r,bottom-10-lab.settle*13,r*2,28,6);c.fillStyle=precipColor;c.globalAlpha=lab.settle*.92;c.fill();c.globalAlpha=1;}
   }
   c.restore();
  }
  c.save();c.translate(x,bottom);c.rotate(angle);
  const glass=c.createLinearGradient(-r,0,r,0);glass.addColorStop(0,'rgba(196,247,251,.23)');glass.addColorStop(.18,'rgba(249,255,249,.12)');glass.addColorStop(.48,'rgba(166,226,230,.03)');glass.addColorStop(.9,'rgba(211,249,255,.19)');
  c.beginPath();c.moveTo(-r,top-bottom);c.lineTo(-r,-r);c.bezierCurveTo(-r,9,r,9,r,-r);c.lineTo(r,top-bottom);c.fillStyle=glass;c.fill();c.strokeStyle=cyan;c.lineWidth=3;c.stroke();
  c.strokeStyle='rgba(245,255,255,.8)';c.lineWidth=4;c.beginPath();c.moveTo(-r+8,top-bottom+18);c.lineTo(-r+8,-42);c.stroke();
  ellipse(c,0,top-bottom,r+2,7,'rgba(196,244,249,.08)',cyan);
  c.strokeStyle='rgba(242,248,238,.5)';c.lineWidth=1.5;for(let q=0;q<4;q++){c.beginPath();c.moveTo(r-17,-68-q*29);c.lineTo(r-6,-68-q*29);c.stroke();}
  c.restore();
 }
 function support(c){
  shadow(c,899,442,38,9);rr(c,867,431,66,12,5);c.fillStyle='#8c9e98';c.fill();
  c.strokeStyle='#bfcbc6';c.lineWidth=7;c.beginPath();c.moveTo(899,435);c.lineTo(899,153);c.lineTo(598,153);c.stroke();
 }
 function holder(c,x,top,moving){
  const y=top+39;c.strokeStyle='#cfddd5';c.lineWidth=4;
  ellipse(c,x,y,39,7,null,'#d3e1d9');
  if(moving){c.beginPath();c.moveTo(x+37,y);c.lineTo(x+95,y-17);c.stroke();rr(c,x+82,y-30,58,15,5);c.fillStyle='#c0a475';c.fill();}
  else {c.beginPath();c.moveTo(x+36,y);c.lineTo(x+49,153);c.stroke();}
 }
 function bath(c,lab,front=false){
  const x=711,lip=212,bottom=401,rx=155;
  if(!front){
   shadow(c,x,487,155,18);
   // Ceramic gauze at y=411. Flame tip >=425, so it cannot pass through it.
   c.lineWidth=10;c.strokeStyle='#b4c1bc';for(const [tx,ex] of [[596,558],[824,864],[738,762]]){c.beginPath();c.moveTo(tx,410);c.lineTo(ex,488);c.stroke();}
   path(c,[[555,399],[862,399],[880,417],[537,417]]);c.fillStyle='#91a5a1';c.fill();c.strokeStyle='#d1ded8';c.lineWidth=2;c.stroke();
   for(let j=0;j<12;j++){c.beginPath();c.moveTo(555+j*25,400);c.lineTo(539+j*28,417);c.stroke();}
   ellipse(c,x,408,69,8,'#e4dfc8','#c2c8af');
   c.fillStyle='rgba(149,206,215,.08)';rr(c,x-rx,lip,rx*2,bottom-lip,18);c.fill();
   const g=c.createLinearGradient(0,230,0,bottom);g.addColorStop(0,'rgba(112,196,218,.15)');g.addColorStop(1,'rgba(58,147,181,.30)');c.fillStyle=g;c.fillRect(x-rx+5,237,rx*2-10,bottom-237);ellipse(c,x,237,rx-5,15,'rgba(123,211,230,.23)','rgba(136,225,239,.4)');
   if(lab.motion?.type==='heat'){
    c.save();c.strokeStyle='rgba(226,247,247,.35)';c.lineWidth=2;for(let k=0;k<9;k++){const yy=390-((lab.elapsed*34+k*29)%147);ellipse(c,574+(k*29%275),yy,2+k%3,3,null,'rgba(207,242,244,.42)');}c.restore();
   }
   // Lamp is below the support; extinguished with cap at completion.
   ellipse(c,x,480,30,8,'#618992','#bce2e4');rr(c,x-29,452,58,28,11);c.fillStyle='rgba(119,195,211,.45)';c.fill();c.strokeStyle='#b9e5e2';c.stroke();
   c.fillStyle='#c2b974';c.fillRect(x-14,444,28,11);c.fillStyle='#f0e9c8';c.fillRect(x-3,440,6,7);
   if(lab.motion?.type==='heat'){const flick=2*Math.sin(lab.elapsed*18);c.beginPath();c.moveTo(x,425+flick);c.bezierCurveTo(x+20,448,x+7,451,x,450);c.bezierCurveTo(x-14,450,x-18,446,x,425+flick);c.fillStyle='#ff824b';c.fill();ellipse(c,x,444,5,6,'#fde047');}
   else if(lab.complete){rr(c,x-20,431,40,22,4);c.fillStyle='#be9f58';c.fill();}
   else {rr(c,779,465,34,18,5);c.fillStyle='#be9f58';c.fill();}
  }else{
   const g=c.createLinearGradient(x-rx,0,x+rx,0);g.addColorStop(0,'rgba(215,248,249,.21)');g.addColorStop(.5,'rgba(164,232,234,.03)');g.addColorStop(1,'rgba(224,255,255,.19)');
   rr(c,x-rx,lip,rx*2,bottom-lip,18);c.fillStyle=g;c.fill();c.strokeStyle=cyan;c.lineWidth=3;c.stroke();ellipse(c,x,lip,rx,14,null,cyan);
   c.beginPath();c.moveTo(x+rx-12,lip);c.lineTo(x+rx+15,lip-10);c.lineTo(x+rx-3,lip+5);c.stroke();
   c.strokeStyle='rgba(249,255,255,.8)';c.lineWidth=5;c.beginPath();c.moveTo(x-rx+13,lip+28);c.lineTo(x-rx+13,bottom-25);c.stroke();
   ellipse(c,x,237,rx-4,15,null,'rgba(156,235,242,.75)');
  }
 }
 function draw(c,lab,l='zh'){
  c.clearRect(0,0,W,H);const bg=c.createRadialGradient(480,180,20,480,240,640);bg.addColorStop(0,'#284d43');bg.addColorStop(1,'#11261f');c.fillStyle=bg;c.fillRect(0,0,W,H);table(c);
  c.lineJoin='round';c.lineCap='round';c.lineWidth=2;
  if(lab.kind==='iodine'){
   label(c,tr(l,'碘液：不用加熱','Iodine: no heating'),385,69,390,'#fde047');
   if(!lab.prepared)label(c,tr(l,'樣本液預覽 · 未加碘液','Sample preview · no iodine'),385,126,470,'#f2ecd9');
   path(c,[[156,376],[605,376],[655,482],[104,482]]);c.fillStyle='#eeeadd';c.fill();c.strokeStyle='#cfd8c9';c.stroke();
   slide(c,285,lab,0,l);slide(c,495,lab,1,l);bottle(c,lab.kind);label(c,tr(l,'碘液','Iodine'),835,475,170,'#fde047');
  }else{
   support(c);bath(c,lab,false);rack(c);
   const pts=M.targets(lab),moving=lab.motion?.type==='bath'?M.smooth(lab.motion.t/2.2):lab.inBath?1:0;
   const lift=lab.motion?.type==='bath'?Math.sin(Math.PI*moving)*85:0;
   for(let i=0;i<2;i++){
    const angle=lab.motion?.type==='mix'?Math.sin(lab.motion.t*7)*.07:0;
    const x=pts[i].x,y=412-34*moving-lift;const top=170-45*moving-lift;
    tube(c,x,top,y,lab,i,angle);
    if(lab.motion?.type==='bath'||lab.inBath)holder(c,x,top,lab.motion?.type==='bath');
    if(lab.motion?.type!=='bath'&&!(lab.motion?.type==='reagent'&&lab.motion.target===i))label(c,tr(l,i===0?'甲：待測組':'乙：清水',i===0?'A: sample':'B: water'),x,top-38,150);
   }
   bath(c,lab,true);
   if(!lab.inBath&&!lab.motion?.type?.includes('bath')){bottle(c,lab.kind);label(c,tr(l,'本氏液','Benedict’s'),95,506,170,'#55e9ff');}
   label(c,tr(l,'隔水加熱','Water bath'),711,38,320,'#fde047');
   label(c,Math.round(lab.temperature)+' °C',711,564,180,'#55e9ff');
   if(lab.prepared){label(c,lab.reagents.every(Boolean)?tr(l,'每管共 6 mL','6 mL per tube'):tr(l,'樣本各 3 mL','3 mL samples'),285,548,275);}
  }
  const m=lab.motion;
  if(m?.type==='reagent'){
   const t=m.t,move=M.smooth(t/.85),from=m.direct?m.from:{x:lab.kind==='iodine'?835:95,y:290},to=m.to;
   let x=from.x+(to.x-from.x)*move,y=from.y+(to.y-from.y)*move-50*Math.sin(Math.PI*move);
   if(t>1.7){const back=M.smooth((t-1.7)/.7);x=to.x+((lab.kind==='iodine'?835:95)-to.x)*back;y=to.y+(290-to.y)*back;}
   pipette(c,x,y,lab.kind);
   if(t>.85&&t<1.7){
    const point=M.targets(lab)[m.target];const end=lab.kind==='iodine'?point.y:412-70-68*M.smooth((t-.85)/.85);
    const fall=(t-.85)/(1.7-.85);const sy=to.y+9;
    if(lab.kind==='iodine')droplet(c,to.x,sy+(end-sy)*Math.min(1,fall*fall*1.5),'#b98a31');
    else {c.strokeStyle='#49b9d8';c.lineWidth=4;c.beginPath();c.moveTo(to.x,sy);c.lineTo(to.x,sy+(end-sy)*Math.min(1,fall*8));c.stroke();}
   }
  }else if(lab.held)pipette(c,lab.tool.x,lab.tool.y,lab.kind);
  else if(lab.kind==='iodine'||!lab.inBath)pipette(c,lab.kind==='iodine'?835:95,290,lab.kind);
  if(lab.complete)label(c,tr(l,'先比較，再下結論','Compare before concluding'),480,601,550,'#4ade80');
 }
 const api={draw,label,tubePath,W,H};root.NutrientsDraw=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
