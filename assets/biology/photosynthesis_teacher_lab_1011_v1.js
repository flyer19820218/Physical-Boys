/* Teacher-authorized potted-plant opening and ethanol beaker.
 * Existing eight-step model, durations, test logic and non-experiment scenes remain unchanged. */
(function(root,factory){const base=typeof module==='object'&&module.exports?require('./photosynthesis_teacher_draw_1011_v1.js'):root.PhotosynthesisDraw;const out=factory(base);if(typeof module==='object'&&module.exports)module.exports=out;else root.PhotosynthesisDraw=out;})(typeof window==='object'?window:globalThis,function(base){'use strict';
 const C={white:'#f2ecd9',yellow:'#fde047',green:'#4ade80',blue:'#55e9ff',orange:'#fb923c',pink:'#f472b6',muted:'#b6c9bf'};
 const tr=(l,z,e)=>l==='zh'?z:e,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t,label=base.label;
 function bg(c){c.clearRect(0,0,960,620);const g=c.createRadialGradient(480,290,25,480,290,580);g.addColorStop(0,'#244b3e');g.addColorStop(1,'#0b1a15');c.fillStyle=g;c.fillRect(0,0,960,620);}
 function oval(c,x,y,rx,ry,fill,stroke,w=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
 function line(c,points,color,width=3){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function pill(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function gradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([p,col])=>g.addColorStop(p,col));return g;}
 function arrow(c,points,color,time,moving=true,width=5){c.save();line(c,points,color,width);const a=points.at(-2),b=points.at(-1),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);c.fillStyle=color;c.beginPath();c.moveTo(...b);c.lineTo(b[0]-16*Math.cos(angle-.5),b[1]-16*Math.sin(angle-.5));c.lineTo(b[0]-16*Math.cos(angle+.5),b[1]-16*Math.sin(angle+.5));c.closePath();c.fill();const segments=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=segments.reduce((a,b)=>a+b,0);if(moving)for(let k=0;k<5;k++){let distance=((time*.11+k/5)%1)*total;for(let i=0;i<segments.length;i++){if(distance<=segments[i]){const t=distance/segments[i];oval(c,mix(points[i][0],points[i+1][0],t),mix(points[i][1],points[i+1][1],t),4.5,4.5,color);break;}distance-=segments[i];}}c.restore();}
 function bench(c){c.fillStyle=gradient(c,0,440,0,575,[[0,'#b6c3bd'],[1,'#8f9f99']]);c.beginPath();c.moveTo(74,428);c.lineTo(886,428);c.lineTo(953,555);c.lineTo(7,555);c.closePath();c.fill();line(c,[[74,428],[886,428],[953,555],[7,555],[74,428]],'#cfd9d4',2);c.fillStyle='#6d8279';c.fillRect(7,555,946,18);for(const x of [64,866]){c.fillStyle=gradient(c,x,575,x+22,575,[[0,'#738c81'],[1,'#435e50']]);c.fillRect(x,573,22,47);}}
 function dish(c,x,y,rx=102,ry=28){oval(c,x+4,y+13,rx+4,ry,'rgba(23,44,32,.27)');oval(c,x,y+6,rx,ry,'#f0f0df','#b1d0c3',3);oval(c,x,y-1,rx,ry,null,'#eefaf0',3);c.beginPath();c.ellipse(x,y-1,rx-6,ry-4,0,Math.PI,Math.PI*1.8);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=2;c.stroke();}
 function glass(c,x,bottom,w,h,fill,level=.65){const top=bottom-h;const g=gradient(c,x-w/2,top,x+w/2,bottom,[[0,'rgba(203,243,242,.21)'],[.14,'rgba(233,255,245,.07)'],[.7,'rgba(233,255,245,.03)'],[1,'rgba(196,237,233,.3)']]);c.fillStyle=g;c.fillRect(x-w/2,top,w,h);c.fillStyle=fill;c.fillRect(x-w/2+4,bottom-h*level,w-8,h*level-4);oval(c,x,bottom-h*level,w/2-4,7,fill,'rgba(196,237,237,.74)',1.4);c.beginPath();c.moveTo(x-w/2,top);c.lineTo(x-w/2+4,bottom-7);c.quadraticCurveTo(x,bottom+9,x+w/2-4,bottom-7);c.lineTo(x+w/2,top);c.strokeStyle='#c6eee7';c.lineWidth=3;c.stroke();oval(c,x,top,w/2,8,null,'#e2f5ec',3);line(c,[[x-w/2+11,top+17],[x-w/2+15,bottom-19]],'rgba(243,253,244,.65)',4);for(let i=0;i<4;i++)line(c,[[x+12,top+30+i*27],[x+28,top+30+i*27]],'#d6eeea',2);}
 function apparatus(c,u,step,p,m){const x=561,hot=step===3&&!!m;
  // Three-legged support with a wire grid/ceramic center. Flame stops below the grid.
  const metal=gradient(c,470,375,657,530,[[0,'#b6c1be'],[.25,'#485c55'],[.65,'#98aca1'],[1,'#435b4c']]);line(c,[[503,375],[472,532]],metal,7);line(c,[[620,375],[650,532]],metal,7);line(c,[[570,375],[576,524]],'#657d70',6);
  c.fillStyle='#596c60';c.beginPath();c.moveTo(469,361);c.lineTo(654,361);c.lineTo(677,376);c.lineTo(447,376);c.closePath();c.fill();for(let i=0;i<24;i++){const xx=457+i*9;line(c,[[xx,375],[xx+12,362]],'#91a299',.7);}for(let i=0;i<5;i++)line(c,[[454,363+i*2.7],[670,363+i*2.7]],'#9caf9f',.7);oval(c,x,368,69,4,'#c3c4b2');
  oval(c,x,533,43,9,'rgba(29,53,36,.25)');const body=gradient(c,x-32,476,x+33,525,[[0,'#d3ece1'],[.15,'#7ea899'],[.5,'#d7efe5'],[1,'#688d7e']]);oval(c,x,502,34,30,body,'#c1d7c4',2);oval(c,x,509,30,17,'rgba(104,189,202,.36)');pill(c,x-12,457,24,21,5,gradient(c,x-12,457,x+12,457,[[0,'#a67f38'],[.5,'#e5c681'],[1,'#8b682d']]),'#e4d399');line(c,[[x,448],[x,456]],'#e1cda0',5);
  if(hot){const sway=Math.sin(u.t*13)*3;c.beginPath();c.moveTo(x-9,449);c.bezierCurveTo(x-18,425,x+sway,407,x+sway,390);c.bezierCurveTo(x+14,421,x+18,437,x+8,449);c.closePath();c.fillStyle=gradient(c,x,392,x,449,[[0,'#ffed91'],[.5,'#ffbc58'],[1,'#ed7941']]);c.fill();oval(c,x,445,7,12,'#64c7e4');}else{pill(c,x-16,445,32,18,7,gradient(c,x-16,445,x+16,445,[[0,'#9fae9f'],[.5,'#e0e3cb'],[1,'#667b69']]),'#d0d9c2');}
  // Big beaker contains WATER, never ethanol over the flame.
  glass(c,x,360,155,150,'rgba(99,206,220,.28)',.65);
  // The small beaker rests inside the large one; no obsolete test-tube clamp.
  if(step>=4){const beakerX=x+4,top=228,bottom=353,w=96;glass(c,beakerX,bottom,w,bottom-top,step>=5?'rgba(116,148,60,.58)':'rgba(232,222,172,.36)',.62);}
  if(hot)for(let i=0;i<12;i++){const by=348-((u.t*35+i*19)%80);oval(c,512+(i%5)*21,by,2+i%3,2+i%3,'rgba(220,246,238,.59)');}
 }
 function bottle(c){const g=gradient(c,71,421,120,421,[[0,'#80541e'],[.18,'#ba8740'],[.45,'#e0b364'],[.65,'#a1752e'],[1,'#684615']]);pill(c,69,423,58,81,11,g,'#cdb87d');pill(c,82,408,31,22,3,'#9c7834','#d7c789');pill(c,76,449,44,34,4,'#f2e7bf');line(c,[[84,467],[112,467]],'#956e2d',3);}
 function forceps(c,x,y,s,plane=1){const gripX=x+38*s,gripY=y-59*s*plane,top=Math.max(64,gripY-95);line(c,[[gripX+15,top],[gripX-3,gripY]],'#dce8df',4);line(c,[[gripX+26,top],[gripX+3,gripY]],'#a8bdb3',4);}
 // Coordinates refer to the same 1024 × 1536 plant master, not an unrelated detached leaf.
 const sampleLeaf={cx:280,cy:620,bandTop:512,bandHeight:219};
 function samplePath(c,begin=true){if(begin)c.beginPath();c.moveTo(394,437);c.bezierCurveTo(377,407,379,360,347,337);c.bezierCurveTo(292,306,231,316,177,357);c.bezierCurveTo(105,412,71,493,67,579);c.bezierCurveTo(59,672,89,753,146,823);c.bezierCurveTo(161,859,183,891,188,916);c.bezierCurveTo(209,859,284,837,354,801);c.bezierCurveTo(438,755,483,672,493,586);c.bezierCurveTo(502,522,476,476,433,458);c.bezierCurveTo(412,450,402,446,394,437);c.closePath();}
 function foilBand(c,amount=1){c.save();samplePath(c);c.clip();c.beginPath();c.rect(60,512,440*clamp(amount),219);c.clip();pill(c,60,512,440,219,5,gradient(c,60,512,500,731,[[0,'#788682'],[.22,'#e3e9e5'],[.47,'#8d9a95'],[.73,'#edf2ee'],[1,'#a5b4aa']]),'#dbe4de');for(let i=0;i<29;i++)line(c,[[60+i*16,513],[72+i*14,603],[60+i*16,730]],i%2?'rgba(242,247,239,.5)':'rgba(66,89,75,.28)',1.2);c.restore();}
 function plantMaster(c,im,x,y,scale,attached=true,front=0,back=0){if(!im)return;c.save();c.translate(x,y);c.scale(scale,scale);
  if(attached&&back){c.globalAlpha=back;pill(c,55,510,450,223,8,'#718278','#d4ddd6');c.globalAlpha=1;}
  c.save();if(!attached){c.beginPath();c.rect(0,0,1024,1536);c.save();c.translate(sampleLeaf.cx,sampleLeaf.cy);c.scale(1.035,1.035);c.translate(-sampleLeaf.cx,-sampleLeaf.cy);samplePath(c,false);c.restore();c.clip('evenodd');}c.drawImage(im,0,0,1024,1536);c.restore();if(attached&&front)foilBand(c,front);c.restore();
 }
 function experimentLeaf(c,x,y,s=1,color='#4b823b',foil=false,stain=false,variegated=false,images={}){const im=images.pottedPlant;if(!im){base.leaf(c,x,y,s,color,foil,stain,variegated);return;}c.save();c.translate(x,y);c.scale(s/3,s/3);c.translate(-sampleLeaf.cx,-sampleLeaf.cy);samplePath(c);c.clip();c.save();if(color==='#d3c390'||color==='#d4c49b')c.filter='sepia(1) saturate(.48) brightness(1.1)';c.drawImage(im,0,0,1024,1536);c.restore();if(foil)foilBand(c,typeof foil==='number'?foil:1);
  if(stain){c.fillStyle='rgba(17,30,65,.93)';c.fillRect(0,0,1024,sampleLeaf.bandTop);c.fillRect(0,sampleLeaf.bandTop+sampleLeaf.bandHeight,1024,1536);c.fillStyle='rgba(184,139,65,.82)';c.fillRect(0,sampleLeaf.bandTop,1024,sampleLeaf.bandHeight);}c.restore();
 }
 function sun(c,p){const x=110+730*p,y=92+70*Math.sin(Math.PI*p);oval(c,x,y,25,25,C.yellow);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,[[x+34*Math.cos(a),y+34*Math.sin(a)],[x+43*Math.cos(a),y+43*Math.sin(a)]],C.yellow,3);}line(c,[[x,y+47],[480,300]],'rgba(253,224,71,.25)',9);}
 function opening(c,u,l,images){bg(c);const step=u.lab.step,m=u.lab.motion,p=m?clamp(m.t/m.duration):0,im=images.pottedPlant;
  const moved=step===2&&m?clamp(p/.35):0;
  if(moved){c.save();c.globalAlpha=moved;bench(c);dish(c,242,481);c.restore();}
  if(step===1){const day=m?Math.min(7,Math.floor(p*7)):0;sun(c,m?(p*7)%1:.08);label(c,tr(l,'陽光下快轉：5～7 天','Sunlight time-lapse: 5–7 days'),480,32,C.yellow,28);label(c,tr(l,'第 '+day+' 天（時間壓縮）','Day '+day+' (time compressed)'),746,256,C.white,24);label(c,tr(l,'鋁箔仍包住同一片葉的正反面','Foil stays on both sides of the same leaf'),480,595,C.white,24);}
  else label(c,step===0?tr(l,'在盆栽上，貼雙面鋁箔','Attach foil to both sides of an attached leaf'):tr(l,'搬進實驗室 → 取葉、除鋁箔','Bring indoors → remove the leaf and foil'),480,32,C.yellow,26);
  const slideAway=step===2&&m?clamp((p-.65)/.25):0,x=320-235*moved-330*slideAway,y=99,scale=.31,attached=!(step===2&&m&&p>=.55);
  const front=step===0?(m?clamp((p-.35)/.65):0):1,back=step===0?(m?clamp(p/.35):0):1;
  plantMaster(c,im,x,y,scale,attached,front,back);
  if(!im)label(c,tr(l,'盆栽素材載入中…','Loading the potted plant…'),480,300,C.muted,24);
  if(step===0){label(c,tr(l,'葉片留在植株上','Keep the leaf attached'),735,283,C.green,26);line(c,[[646,310],[x+151,y+sampleLeaf.cy*scale]],C.green,2);label(c,tr(l,'先包背面，再貼正面','Back first, then front'),728,383,C.white,24);}
  if(step===2&&m&&p>=.55){const f=clamp((p-.55)/.4),lx=mix(85+sampleLeaf.cx*scale,242,f),ly=mix(y+sampleLeaf.cy*scale,481,f),size=mix(.93,.62,f),plane=mix(1,.32,f);c.save();c.translate(lx,ly);c.scale(1,plane);experimentLeaf(c,0,0,size,'#4b823b',1-clamp((p-.59)/.19),false,false,images);c.restore();forceps(c,lx,ly,size,plane);}
 }
 function lab(c,u,l,images={}){bg(c);const leaf=(c,x,y,s,color,foil=false,stain=false,variegated=false)=>experimentLeaf(c,x,y,s,color,foil,stain,variegated,images);const step=u.lab.step,m=u.lab.motion,p=m?clamp(m.t/m.duration):0;if(step<3){opening(c,u,l,images);return;}label(c,tr(l,'遮光葉片實驗 · 裝置與操作一起看','Partly shaded leaf · apparatus and procedure'),480,30,C.yellow,26);
  if(step===8){c.fillStyle=gradient(c,0,280,0,600,[[0,'#b9c4bc'],[1,'#8e9d94']]);c.beginPath();c.moveTo(90,296);c.lineTo(870,296);c.lineTo(950,571);c.lineTo(10,571);c.closePath();c.fill();dish(c,480,422,268,110);c.save();c.translate(480,420);c.scale(1,.45);leaf(c,0,0,2.3,'#d4c49b',false,true);c.restore();label(c,tr(l,'受光區 → 藍黑色：有澱粉','Exposed → blue-black: starch present'),245,128,C.blue,24);arrow(c,[[295,165],[382,343]],C.blue,0,false,4);label(c,tr(l,'遮光區 → 黃褐色','Shaded → yellow-brown'),741,193,C.orange,24);arrow(c,[[771,228],[591,422]],C.orange,0,false,4);label(c,tr(l,'碘液驗澱粉 · 不是直接檢驗葡萄糖','Iodine tests starch, not glucose'),480,598,C.white,22);return;}
  bench(c);dish(c,242,481);bottle(c);apparatus(c,u,step,p,m);glass(c,806,462,118,124,'rgba(130,208,213,.24)',.65);
  label(c,tr(l,'碘液','Iodine'),98,536,C.yellow,22);label(c,tr(l,'大燒杯：熱水浴','Large beaker: water bath'),557,168,C.blue,22);label(c,tr(l,'熱水沖洗','Warm-water rinse'),806,292,C.blue,22);
  label(c,step>=4?tr(l,'小燒杯裝酒精；隔水褪色，燈已熄','Ethanol in a small beaker; warm-water bath, lamp off'):tr(l,'酒精燈 → 加熱水','Alcohol lamp → heats water'),576,578,C.orange,22);
  let x=242,y=290,s=.9,plane=1,foil=step>=1&&step<3,col=step>=5?'#d3c390':'#4b823b',stain=false;
  const loc={dish:[242,481,.62,.32],water:[540,306,.34,1],ethanol:[565,301,.32,.65],rinse:[806,412,.32,1]};
  if(step>=3){const pt=step===3?loc.dish:step===4?loc.water:step===5?loc.ethanol:step===6?loc.rinse:loc.dish;[x,y,s,plane]=pt;}
  if(m){if(step===0)foil=p;if(step===2){foil=p<.35;x=242;y=mix(290,481,p);s=mix(.9,.62,p);plane=mix(1,.32,p);}if(step>=3&&step<=6){const from=step===3?loc.dish:step===4?loc.water:step===5?loc.ethanol:loc.rinse,to=step===3?loc.water:step===4?loc.ethanol:step===5?loc.rinse:loc.dish;
    // LIFT → move above vessel rims → LOWER. Leaf does not tunnel through glass walls.
    const lift=clamp(p/.2),travel=clamp((p-.2)/.28),lower=clamp((p-.48)/.22),topY=115;
    x=mix(from[0],to[0],travel);y=p<.2?mix(from[1],topY,lift):p<.48?topY:mix(topY,to[1],lower);s=mix(from[2],to[2],travel);plane=mix(from[3],to[3],travel);if(step===4)col=p>.72?'#d3c390':'#4b823b';}
   if(step===7){[x,y,s,plane]=loc.dish;stain=p>.74;}}
  if(step<3){line(c,[[242,428],[242,380]],'#577d49',7);label(c,tr(l,'遮光時，葉片留在植株上','Keep the leaf attached while covered'),235,89,C.white,22);if(step===1&&m)label(c,tr(l,`第 ${Math.min(7,Math.floor(p*7))} 天（時間壓縮）`,`Day ${Math.min(7,Math.floor(p*7))} (time compressed)`),241,143,C.yellow,22);}
  c.save();c.translate(x,y);c.scale(1,plane);leaf(c,0,0,s,col,foil,stain);c.restore();if(m&&step>=2&&step<=6)forceps(c,x,y,s,plane);
  // Front glass drawn over the immersed leaf: depth remains legible without hiding the sample.
  if(y>230&&step>=3&&step<=6){const v=step===4&&(!m||p<.2)?540:step===5&&(!m||p<.2)?565:step===6&&(!m||p<.2)?806:x;if(Math.abs(v-561)<75){line(c,[[488,228],[493,352]],'rgba(232,252,239,.34)',3);} }
  if(m&&step===7){const transit=p<.24?p/.24:p>.8?(1-p)/.2:1,dx=mix(98,242,clamp(transit)),tipY=mix(471,327,clamp(transit));pill(c,dx-10,tipY-76,20,35,9,'#536b5b','#a3b9a7');c.beginPath();c.moveTo(dx-6,tipY-41);c.lineTo(dx+6,tipY-41);c.lineTo(dx,tipY);c.closePath();c.fillStyle='rgba(206,239,230,.34)';c.fill();c.strokeStyle='#cce9df';c.lineWidth=2;c.stroke();line(c,[[dx,tipY-35],[dx,tipY-7]],'#c58d39',3);if(p>.28&&p<.68){const fall=((p-.28)/.12)%1;oval(c,242,tipY+fall*(481-tipY),3.5,6,'#d2a342');}}
 }
 return {...base,lab,sampleLeaf};
});
