(function(root){'use strict';
 const D=root.AnimalDraw,A=root.AnimalData,original=D.absorption;
 const G={outer:476,inner:516,entry:{x:584,y:270},vein:[{x:584,y:241},{x:584,y:550},{x:875,y:550}],vesselRadius:17};
 // One shared route drives both the visible vessel and the moving nutrients.
 const route=[{t:0,x:140,y:270},{t:.4,x:G.outer,y:270},{t:.54,x:G.inner,y:270},{t:.64,...G.entry},{t:.88,x:584,y:550},{t:1,x:875,y:550}];
 const at=(points,t)=>{let i=points.findIndex((p,j)=>j&&t<=p.t);if(i<1)i=points.length-1;const a=points[i-1],b=points[i],q=(t-a.t)/(b.t-a.t);return{x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};};
 D.absorbPosition=function(time,stage,index,blocked){const q=(time*.12+index*.097)%1;
  if(blocked)return{x:155+(q<.5?q*2:2-q*2)*270,y:228+(index%3)*47};
  const t=stage<0?q:stage===0?q*.4:stage===1?.4+q*.24:.64+q*.36;
  return{...at(route,t),stage:t<.4?0:t<.64?1:2};
 };
 D.absorbGlyph=function(c,kind,x,y){c.save();c.translate(x,y);
  if(kind==='water')D.water(c,0,0,6);else if(kind==='amino')D.amino(c,0,0,2,8);else if(kind==='glucose')D.sugar(c,0,0,9);
  else for(let i=0;i<7;i++){const xx=(i-3)*10,yy=Math.sin(i*.8)*5;kind==='starch'?D.sugar(c,xx,yy,6):D.amino(c,xx,yy,i,6);}
  c.restore();
 };
 function stroke(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 function cell(c,x,y,angle){c.save();c.translate(x,y);c.rotate(angle);const paint=c.createLinearGradient(-20,0,20,0);paint.addColorStop(0,'#f2c1a0');paint.addColorStop(.5,'#eaa88b');paint.addColorStop(1,'#c78372');D.round(c,-20,-15,40,30,7,paint,'#f8d9b8');
  c.fillStyle='#b278a4';c.beginPath();c.ellipse(6,0,5,7,0,0,Math.PI*2);c.fill();c.strokeStyle='#f8d9b8';c.lineWidth=2;for(let j=-10;j<=10;j+=5){c.beginPath();c.moveTo(20,j);c.lineTo(27,j);c.stroke();}c.restore();
 }
 function villus(c){const paint=c.createLinearGradient(496,0,816,0);paint.addColorStop(0,'#946960');paint.addColorStop(.35,'#d9a68e');paint.addColorStop(.6,'#e9bea0');paint.addColorStop(1,'#8a605a');
  c.beginPath();c.moveTo(496,554);c.lineTo(496,265);c.ellipse(656,265,160,125,0,Math.PI,Math.PI*2);c.lineTo(816,554);c.closePath();c.fillStyle=paint;c.fill();
  // The central lacteal stays distinct; this model's water-soluble nutrients
  // never follow it. Lipid/lymph explanation and real evidence are preserved.
  stroke(c,[{x:655,y:223},{x:655,y:575},{x:877,y:620}],20,'#55734b');stroke(c,[{x:655,y:223},{x:655,y:575},{x:877,y:620}],13,'#b5d47b');
  const artery=[{x:875,y:586},{x:735,y:586},{x:730,y:244}];stroke(c,artery,26,'#8a3e43');stroke(c,artery,18,'#dd6965');
  for(const y of [241,333,415,490]){const grad=c.createLinearGradient(730,0,584,0);grad.addColorStop(0,'#e97d75');grad.addColorStop(.5,'#c58dba');grad.addColorStop(1,'#62bce4');c.strokeStyle=grad;c.lineWidth=12;c.beginPath();c.moveTo(730,y);c.bezierCurveTo(707,y-45,608,y-45,584,y);c.stroke();}
  stroke(c,G.vein,G.vesselRadius*2,'#306e9f');stroke(c,G.vein,25,'#63b5df');stroke(c,G.vein,5,'rgba(169,224,243,.35)');
  for(let i=0;i<=14;i++){const angle=Math.PI+i*Math.PI/14;cell(c,656+160*Math.cos(angle),265+125*Math.sin(angle),Math.atan2(Math.sin(angle)/125,Math.cos(angle)/160));}
  for(let i=0;i<7;i++){cell(c,496,300+i*36,Math.PI);cell(c,816,300+i*36,0);}
 }
 function leader(c,label,x,y,toX,toY,tr){D.text(c,tr(...label),x,y,24,D.C.teal,'center',260);c.strokeStyle=D.C.teal;c.lineWidth=2;c.beginPath();c.moveTo(x,y+19);c.lineTo(toX,toY);c.stroke();}
 D.absorption=function(c,s,tr,images,time){if(s.villusView!=='model')return original(c,s,tr,images,time);
  D.bg(c);const blocked=!A.passage(s.absorb,false),stage=s.absorbStage===undefined?-1:s.absorbStage;
  D.text(c,tr('養分穿過上皮，進入微血管','Across epithelium, into blood capillaries'),480,42,28,D.C.yellow,'center',920);
  villus(c);D.text(c,tr('腸腔','Intestinal lumen'),235,123,26,D.C.teal,'center',380);
  leader(c,['上皮細胞','Epithelial cells'],476,93,505,178,tr);leader(c,['微血管','Blood capillaries'],767,93,697,210,tr);
  D.text(c,tr('乳糜管','Lacteal'),640,605,20,'#c2dd96','center',140);
  D.text(c,tr('靜脈','Vein'),906,443,24,D.C.teal,'center',100);c.strokeStyle=D.C.teal;c.lineWidth=2;c.beginPath();c.moveTo(906,464);c.lineTo(875,531);c.stroke();
  const phase=(time*.12)%1,active=blocked?0:stage<0?(phase<.4?0:phase<.64?1:2):stage;
  const labels=[tr('1 腸腔內','1 In the lumen'),tr('2 穿過上皮','2 Across epithelium'),tr('3 血管 → 靜脈','3 Capillaries → vein')];
  labels.forEach((label,i)=>{D.round(c,35,388+i*62,368,52,10,i===active?'#315743':D.C.deep,i===active?D.C.yellow:'#638579');D.text(c,label,219,414+i*62,24,i===active?D.C.yellow:D.C.muted,'center',348);});
  for(let i=0;i<(blocked?6:10);i++){const p=D.absorbPosition(time,stage,i,blocked);D.absorbGlyph(c,s.absorb,p.x,p.y);}
  if(blocked){D.text(c,tr('完整大分子不能直接吸收','Whole large molecules: digest first'),235,350,22,D.C.orange,'center',415);}
  D.text(c,tr('分子符號放大 · 非真實比例','Molecular symbols enlarged · not to scale'),480,644,20,D.C.muted,'center',920);
 };
 root.AnimalVillus={geometry:G,route,original};
})(typeof window==='undefined'?globalThis:window);
