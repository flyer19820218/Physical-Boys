/* Teacher-authorized cutaway and molecular paths. V2 apparatus and state machine are inherited unchanged. */
(function(root,factory){const base=typeof module==='object'&&module.exports?require('./photosynthesis_draw_v2.js'):root.PhotosynthesisDraw;const out=factory(base);if(typeof module==='object'&&module.exports)module.exports=out;else root.PhotosynthesisDraw=out;})(typeof window==='object'?window:globalThis,function(base){'use strict';
 const C={white:'#f2ecd9',yellow:'#fde047',green:'#4ade80',blue:'#55e9ff',orange:'#fb923c',pink:'#f472b6',muted:'#b6c9bf'};
 const tr=(l,z,e)=>l==='zh'?z:e,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t,label=base.label;
 function bg(c){c.clearRect(0,0,960,620);const g=c.createRadialGradient(480,290,25,480,290,580);g.addColorStop(0,'#244b3e');g.addColorStop(1,'#0b1a15');c.fillStyle=g;c.fillRect(0,0,960,620);}
 function oval(c,x,y,rx,ry,fill,stroke,w=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
 function line(c,points,color,width=3){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function pill(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function gradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([p,col])=>g.addColorStop(p,col));return g;}
 function asset(c,im,x,y,w,h){if(!im)return false;const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.min(w/iw,h/ih);c.drawImage(im,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s);return true;}
 function atom(c,x,y,r,type){const stops=type==='H'?[[0,'#fffcef'],[.48,'#f2ecd9'],[1,'#bdbea9']]:type==='C'?[[0,'#b0bfb7'],[.38,'#52675f'],[1,'#1e332b']]:[[0,'#ffc9df'],[.45,'#f472b6'],[1,'#b7326f']];const g=c.createRadialGradient(x-r*.32,y-r*.38,r*.08,x,y,r);stops.forEach(([p,col])=>g.addColorStop(p,col));oval(c,x,y,r,r,g,type==='H'?'#f9f3dc':'#edc6d1',.8);oval(c,x-r*.28,y-r*.34,r*.2,r*.14,'rgba(255,255,255,.62)');}
 function ring(c,x,y,n,r){c.beginPath();for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n,px=x+r*Math.cos(a),py=y+r*Math.sin(a);i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=gradient(c,x-r,y-r,x+r,y+r,[[0,'#fff2ad'],[.45,'#fde047'],[1,'#c79627']]);c.fill();c.strokeStyle='#fff2c5';c.lineWidth=2.3;c.stroke();}
 // Ring shapes are recognition symbols, NOT complete stereochemical structures.
 function molecule(c,type,x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.shadowColor='rgba(11,26,21,.7)';c.shadowBlur=3;c.shadowOffsetY=2;
  if(type==='water'){const a=104.5*Math.PI/360,ox=Math.sin(a)*14,oy=-Math.cos(a)*14;atom(c,-ox,oy,6,'H');atom(c,ox,oy,6,'H');atom(c,0,0,11,'O');}
  else if(type==='co2'){atom(c,-22,0,10,'O');atom(c,0,0,13,'C');atom(c,22,0,10,'O');}
  else if(type==='oxygen'){atom(c,-10,0,10,'O');atom(c,10,0,10,'O');}
  else if(type==='glucose')ring(c,0,0,6,16);
  else if(type==='sucrose'){ring(c,-13,0,6,15);ring(c,13,0,5,14);}
  else if(type==='disaccharide'){ring(c,-13,0,6,15);ring(c,13,0,6,15);}
  else if(type==='mineral')oval(c,0,0,4.2,4.2,'#e9edb4','#fffce5',1);
  c.restore();
 }
 function routePoint(points,f){const segments=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=segments.reduce((a,b)=>a+b,0);let distance=clamp(f)*total;for(let i=0;i<segments.length;i++){if(distance<=segments[i]||i===segments.length-1){const t=segments[i]?distance/segments[i]:0;return {x:mix(points[i][0],points[i+1][0],t),y:mix(points[i][1],points[i+1][1],t),angle:Math.atan2(points[i+1][1]-points[i][1],points[i+1][0]-points[i][0])};}distance-=segments[i];}return{x:points[0][0],y:points[0][1],angle:0};}
 function thickArrow(c,points,color,width=12,emphasis=1){c.save();c.globalAlpha=.38*emphasis;line(c,points,color,width);c.globalAlpha=.95*emphasis;const a=points.at(-2),b=points.at(-1),angle=Math.atan2(b[1]-a[1],b[0]-a[0]),length=Math.max(25,width*2.25),half=Math.max(11,width*.95);c.beginPath();c.moveTo(...b);c.lineTo(b[0]-length*Math.cos(angle)+half*Math.sin(angle),b[1]-length*Math.sin(angle)-half*Math.cos(angle));c.lineTo(b[0]-length*Math.cos(angle)-half*Math.sin(angle),b[1]-length*Math.sin(angle)+half*Math.cos(angle));c.closePath();c.fillStyle=color;c.fill();c.restore();}
 function flow(c,points,type,color,time,{enabled=true,count=3,width=12,selected=true,scale=1,minerals=false}={}){thickArrow(c,points,enabled?color:C.muted,width,selected?1:.68);if(!enabled)return;for(let i=0;i<count;i++){const f=(time*.105+i/count)%1,p=routePoint(points,f);c.save();c.globalAlpha=selected?1:.82;molecule(c,type,p.x,p.y,scale,type==='co2'?p.angle:0);c.restore();if(minerals){const m=routePoint(points,(f+.5/count)%1);molecule(c,'mineral',m.x,m.y,1);}}}
 function lightBeam(c,points,time,enabled=true){thickArrow(c,points,enabled?C.yellow:C.muted,13,enabled?.8:.4);if(!enabled)return;c.save();c.globalAlpha=.6+.18*Math.sin(time*2);const start=points[0],end=points.at(-1),a=Math.atan2(end[1]-start[1],end[0]-start[0]);for(const offset of [-10,10]){const ps=[];for(let i=0;i<=36;i++){const f=i/36,wave=Math.sin(f*8*Math.PI-time*2)*3+offset;ps.push([mix(start[0],end[0],f)-Math.sin(a)*wave,mix(start[1],end[1],f)+Math.cos(a)*wave]);}line(c,ps,'#fff0ac',1.8);}c.restore();}
 function legend(c,l){const types=['water','co2','oxygen','glucose','sucrose','mineral'],names=[['水','Water'],['CO₂','CO₂'],['O₂','O₂'],['葡萄糖','Glucose'],['蔗糖','Sucrose'],['礦物質','Minerals']];pill(c,28,518,904,92,14,'rgba(11,26,21,.9)','#4e7261');types.forEach((type,i)=>{const x=104+i*150;molecule(c,type,x,544,1);label(c,tr(l,...names[i]),x,581,C.white,22);});}
 function chloroplast(c,u,l,images={}){bg(c);label(c,tr(l,'葉綠體：把光能轉為有機物中的化學能','Chloroplast: light energy → chemical energy in organic matter'),480,32,C.white,26);asset(c,images.chloroplast,192,157,576,310);const active=u.light&&u.water&&u.co2;
  lightBeam(c,[[480,99],[480,155]],u.t,u.light);label(c,tr(l,'光能 · 葉綠素吸收','Light · absorbed by chlorophyll'),480,76,C.yellow,22);
  flow(c,[[95,245],[228,260]],'co2',C.orange,u.t,{enabled:u.co2,count:1});label(c,'CO₂',112,194,C.orange,30);
  flow(c,[[95,374],[239,360]],'water',C.blue,u.t,{enabled:u.water,count:3});label(c,'H₂O',113,426,C.blue,30);
  flow(c,[[725,260],[858,243]],'glucose',C.yellow,u.t,{enabled:active,count:3});label(c,tr(l,'葡萄糖','Glucose'),829,193,C.yellow,24);
  flow(c,[[742,318],[866,318]],'water',C.blue,u.t,{enabled:active,count:2});label(c,tr(l,'H₂O（產物）','H₂O (product)'),834,287,C.blue,24);
  flow(c,[[725,365],[858,391]],'oxygen',C.pink,u.t,{enabled:active,count:2});label(c,'O₂',828,439,C.pink,30);
  label(c,tr(l,'雙層膜包覆，內部有疊成堆的膜構造','A double envelope encloses stacks of internal membranes'),480,497,C.green,24);legend(c,l);
 }
 function pavement(c){c.save();const g=gradient(c,100,100,850,450,[[0,'#738578'],[.5,'#a6bba0'],[1,'#596e60']]);pill(c,65,107,830,394,36,g,'#cbd8bd');c.clip();
  const outlines=[[[65,174],[152,170],[168,215],[201,220],[228,187],[265,180],[300,231],[354,218],[367,107]],[[65,355],[135,355],[159,307],[206,318],[221,360],[265,371],[288,416],[342,431],[360,501]],[[650,107],[664,170],[708,187],[744,156],[786,165],[793,209],[848,221],[895,213]],[[640,501],[641,442],[688,421],[712,454],[751,449],[770,405],[810,395],[841,350],[895,369]],[[180,107],[179,147],[152,170]],[[65,265],[135,273],[159,307]],[[228,187],[218,126]],[[300,231],[298,317],[288,416]],[[708,187],[699,280],[688,421]],[[793,209],[786,293],[810,395]]];
  for(const p of outlines){line(c,p,'#4f6554',7);line(c,p,'#d4dfbb',2.5);}c.restore();}
 function kidneyPath(c,sign,open,inset=0){const top=165+inset,bottom=441-inset,center=303,inner=3+open*55,outer=119+open*15-inset;const x=480; c.beginPath();c.moveTo(x+sign*(inner+12),top);c.bezierCurveTo(x+sign*(outer+38),top-18,x+sign*(outer+43),bottom+8,x+sign*(inner+12),bottom);c.bezierCurveTo(x+sign*(inner-13+inset),bottom-13,x+sign*(inner+4+inset),center+64,x+sign*(inner+inset),center);c.bezierCurveTo(x+sign*(inner+4+inset),center-64,x+sign*(inner-13+inset),top+13,x+sign*(inner+12),top);c.closePath();}
 function guard(c,u,l){bg(c);pavement(c);const open=u.gate/100;oval(c,480,303,Math.max(1,open*56),134,'#132c24','#314c33',2);
  for(const sign of [-1,1]){kidneyPath(c,sign,open);const g=gradient(c,480+sign*15,190,480+sign*160,430,[[0,'#d3e7a7'],[.36,'#8ebc5c'],[.68,'#457f3e'],[1,'#254f32']]);c.fillStyle=g;c.fill();c.strokeStyle='#d1e3a8';c.lineWidth=5;c.stroke();
   c.save();kidneyPath(c,sign,open);c.clip();const inner=3+open*55,x=480+sign*(inner+40);kidneyPath(c,sign,open,13);c.fillStyle=gradient(c,x-sign*55,200,x+sign*35,370,[[0,'rgba(220,236,161,.8)'],[.5,'rgba(121,167,86,.42)'],[1,'rgba(101,142,74,.22)']]);c.fill();const nx=480+sign*(inner+49);oval(c,nx,355,15,20,gradient(c,nx-16,335,nx+16,376,[[0,'#d0c3e0'],[1,'#715a91']]),'#cfbde0',1.5);oval(c,nx-sign*2,359,6,7,'#634777');
   for(let i=0;i<10;i++){const angle=-1.42+i*.315,py=302+108*Math.sin(angle),px=480+sign*(Math.abs(py-355)<31?inner+15:inner+29+19*Math.cos(angle));c.save();c.translate(px,py);c.rotate(sign*angle*.55);oval(c,0,0,9,5.5,gradient(c,-9,-5,8,5,[[0,'#b3d48b'],[.3,'#558c37'],[1,'#214d25']]),'#9dbe78',1);line(c,[[-5,-1],[5,1]],'#709c4f',1);c.restore();}
   for(let i=0;i<165;i++){const px=x+Math.sin(i*18.77)*69,py=303+Math.cos(i*12.59)*133;oval(c,px,py,.65,.65,i%2?'rgba(236,244,183,.3)':'rgba(44,89,38,.2)');}c.restore();
   const edge=480+sign*(3+open*55);c.beginPath();c.moveTo(edge+sign*12,165);c.bezierCurveTo(edge-sign*13,182,edge+sign*4,238,edge,303);c.bezierCurveTo(edge+sign*4,368,edge-sign*13,428,edge+sign*12,441);c.strokeStyle='#e4edbe';c.lineWidth=7;c.stroke();
  }
  label(c,tr(l,'保衛細胞','Guard cells'),238,547,C.green,26);line(c,[[285,523],[354,422]],C.green,2);label(c,tr(l,'氣孔＝中間的孔隙','Stoma = the central pore'),687,547,C.white,24);line(c,[[681,520],[488,434]],C.white,2);
  label(c,tr(l,'葉綠體','Chloroplasts'),166,278,C.green,22);line(c,[[238,278],[360,269]],C.green,2);
  if(open>.02){flow(c,[[233,70],[420,132],[480,204]],'co2',C.orange,u.t,{count:3});flow(c,[[482,210],[619,132],[763,70]],'oxygen',C.pink,u.t,{count:3});flow(c,[[486,369],[711,405],[824,455]],'water',C.blue,u.t,{count:5});}label(c,tr(l,'CO₂ 進入（照光）','CO₂ in (light)'),213,39,C.orange,22);label(c,tr(l,'O₂ 逸出（照光）','O₂ out (light)'),760,39,C.pink,22);label(c,tr(l,'水蒸氣','Water vapor'),808,490,C.blue,22);
  label(c,tr(l,'原創動態構造模型 · 可切換真實光學照片','Original dynamic structure model · switch to a real optical micrograph'),480,600,C.muted,22);
 }
 function vessel(c,x,y,w,h,phloem=false){const edge=phloem?'#dec791':'#bcceab';pill(c,x-w/2,y,w,h,16,gradient(c,x-w/2,y,x+w/2,y,[[0,'#597659'],[.12,edge],[.25,'rgba(178,205,144,.4)'],[.55,'rgba(31,74,53,.68)'],[.88,edge],[1,'#516e4e']]),edge);const lum=phloem?'rgba(253,224,71,.07)':'rgba(85,233,255,.08)';pill(c,x-w/2+10,y+9,w-20,h-18,9,lum);if(phloem){for(let k=1;k<4;k++){const py=y+k*h/4;line(c,[[x-w/2+10,py],[x+w/2-10,py]],'#d8c79f',5);for(let n=0;n<7;n++)oval(c,x-22+n*7,py,1.9,2.1,'#294b36');}for(let i=0;i<66;i++)oval(c,x+w/2-5, y+12+i*4.2,1.2,1.3,'rgba(231,232,181,.48)');}else{for(let k=0;k<13;k++){const py=y+13+k*23;c.beginPath();c.moveTo(x-w/2+5,py+9);c.bezierCurveTo(x-12,py-1,x+12,py-1,x+w/2-5,py-9);c.strokeStyle='rgba(211,225,180,.6)';c.lineWidth=2.4;c.stroke();}}line(c,[[x-w/2+7,y+22],[x-w/2+7,y+h-22]],'rgba(237,243,195,.44)',2);}
 const transportPaths={water:[[638,452],[638,212]],sugar:[[790,212],[790,452]],co2:[[407,76],[365,113],[332,158]],oxygen:[[346,177],[385,220],[430,244]]};
 function plant(c,u,l,images={}){bg(c);label(c,tr(l,'剖開植物，追蹤內部的物質運輸','Inside a plant: trace transport through its tissues'),480,32,C.white,26);const active=u.light&&u.water&&u.co2;
  asset(c,images.plant,22,66,434,444);
  // Both insets are original teaching drawings. They magnify tissue width, never stretch the AI bitmap.
  pill(c,480,74,451,430,22,'rgba(11,26,21,.63)','#658366');label(c,tr(l,'放大：莖的運輸組織','Enlarged: stem transport tissues'),706,106,C.white,24);
  c.save();c.setLineDash([5,7]);line(c,[[254,281],[480,240]],'#bbceb0',2);line(c,[[252,354],[480,360]],'#bbceb0',2);c.restore();oval(c,252,318,15,44,null,'#b7d5a9',2);
  // A cut tissue surface around two differentiated lumens: spiral-thickened xylem and segmented sieve tubes.
  pill(c,590,194,250,280,22,gradient(c,590,194,840,474,[[0,'rgba(196,218,147,.24)'],[.5,'rgba(156,188,130,.11)'],[1,'rgba(213,210,156,.26)']]),'#9fb985');
  for(let i=0;i<42;i++){const y=204+i*6.3;line(c,[[708,y],[733,y+2]],'rgba(196,218,171,.3)',1);}
  vessel(c,638,192,72,282);vessel(c,790,192,84,282,true);
  label(c,tr(l,'木質部','Xylem'),633,158,C.blue,25);label(c,tr(l,'韌皮部','Phloem'),791,158,C.yellow,25);
  flow(c,transportPaths.water,'water',C.blue,u.t,{enabled:u.water,count:5,width:13,selected:u.route==='water',minerals:true});
  flow(c,transportPaths.sugar,'sucrose',C.yellow,u.t,{enabled:active,count:3,width:13,selected:u.route==='sugar',scale:.88});
  flow(c,transportPaths.co2,'co2',C.orange,u.t,{enabled:u.co2,count:1,width:12,selected:u.route==='co2',scale:.9});
  flow(c,transportPaths.oxygen,'oxygen',C.pink,u.t,{enabled:active,count:2,width:12,selected:u.route==='oxygen'});
  label(c,tr(l,'CO₂ 進葉片','CO₂ into leaf'),143,79,C.orange,22);label(c,tr(l,'O₂ 逸出','O₂ out'),419,274,C.pink,22);
  label(c,tr(l,'往葉片 ↑','To leaves ↑'),555,279,C.blue,22);label(c,tr(l,'往根部 ↓','To roots ↓'),889,365,C.yellow,22);
  label(c,tr(l,'本例：成熟葉製糖 → 根利用或儲藏','This example: mature leaf → root sink'),704,490,C.white,22);
  legend(c,l);
 }
 return {...base,plant,chloroplast,guard,molecule,routePoint,flow,transportPaths};
});
