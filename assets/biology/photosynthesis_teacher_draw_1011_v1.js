/* Teacher-authorized reaction paths and one-vacuole guard-cell comparison.
 * All other scenes and the experiment state machine are inherited unchanged. */
(function(root,factory){
 const base=typeof module==='object'&&module.exports?require('./photosynthesis_draw_v6.js'):root.PhotosynthesisDraw;
 const out=factory(base);
 if(typeof module==='object'&&module.exports)module.exports=out;else root.PhotosynthesisDraw=out;
})(typeof window==='object'?window:globalThis,function(base){'use strict';
 const C={white:'#f2ecd9',yellow:'#fde047',green:'#4ade80',blue:'#55e9ff',orange:'#fb923c',pink:'#f472b6',muted:'#b6c9bf'};
 const tr=(l,z,e)=>l==='zh'?z:e;
 const teacherFlowPaths={
  water:[[326,140],[326,270]],
  co2:[[698,140],[698,270]],
  energy:[[399,330],[610,330]],
  oxygen:[[326,395],[326,505]],
  glucose:[[698,395],[698,408],[611,505]],
  productWater:[[698,395],[698,408],[828,505]]
 };
 function bg(c){c.clearRect(0,0,960,620);const g=c.createRadialGradient(480,300,20,480,300,590);g.addColorStop(0,'#244b3e');g.addColorStop(1,'#0b1a15');c.fillStyle=g;c.fillRect(0,0,960,620);}
 function line(c,p,color,width=3){c.beginPath();p.forEach((a,i)=>i?c.lineTo(...a):c.moveTo(...a));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function box(c,x,y,w,h,color){c.beginPath();c.roundRect(x,y,w,h,14);c.fillStyle='rgba(11,26,21,.9)';c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();}
 function label(c,text,x,y,color,size=26){base.label(c,text,x,y,color,size);}
 function asset(c,im,x,y,w,h){if(!im)return;const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.min(w/iw,h/ih);c.drawImage(im,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s);}
 function arrow(c,p,color,width=10){line(c,p,color,width);const a=p.at(-2),b=p.at(-1),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);c.beginPath();c.moveTo(...b);c.lineTo(b[0]-24*Math.cos(ang)+11*Math.sin(ang),b[1]-24*Math.sin(ang)-11*Math.cos(ang));c.lineTo(b[0]-24*Math.cos(ang)-11*Math.sin(ang),b[1]-24*Math.sin(ang)+11*Math.cos(ang));c.closePath();c.fillStyle=color;c.fill();}
 function light(c,t,on,l){const color=on?C.yellow:C.muted;if(!on)t=0;for(const y of [299,349]){const p=[];for(let i=0;i<=54;i++){const f=i/54;p.push([38+226*f,y+Math.sin(f*8*Math.PI-t*2)*5]);}line(c,p,color,4);arrow(c,[[246,y],[275,y]],color,4);}label(c,tr(l,'光','Light'),99,258,color,30);}
 function carriers(c,u){const enabled=u.light&&u.water;arrow(c,teacherFlowPaths.energy,enabled?C.orange:C.muted,10);if(!enabled)return;for(let i=0;i<2;i++){const p=base.routePoint(teacherFlowPaths.energy,(u.t*.105+i/2)%1);box(c,p.x-18,p.y-18,36,36,C.orange);label(c,'H',p.x,p.y,C.orange,24);}}
 function chloroplast(c,u,l,images={}){
  bg(c);const active=u.light&&u.water&&u.co2;
  label(c,tr(l,'葉綠體','Chloroplast'),510,35,C.green,28);
  asset(c,images.chloroplast,176,179,660,330);
  label(c,tr(l,'水','Water')+' H₂O',326,79,C.blue,28);
  label(c,tr(l,'二氧化碳','Carbon dioxide')+' CO₂',698,79,C.orange,26);
  base.flow(c,teacherFlowPaths.water,'water',C.blue,u.t,{enabled:u.water,count:2});
  base.flow(c,teacherFlowPaths.co2,'co2',C.orange,u.t,{enabled:u.co2,count:1});
  light(c,u.t,u.light,l);
  box(c,260,272,140,95,C.green);label(c,tr(l,'葉綠素','Chlorophyll'),331,306,C.green,l==='zh'?26:22);if(l==='zh')label(c,'吸收光',331,342,C.white,22);else{label(c,'Absorbs',331,333,C.white,22);label(c,'light',331,356,C.white,22);}
  box(c,612,272,172,95,C.yellow);label(c,tr(l,'酵素','Enzymes'),698,306,C.yellow,28);label(c,tr(l,'合成醣類','Build sugars'),698,342,C.white,22);
  carriers(c,u);label(c,tr(l,'能量＋H','Energy + H'),504,274,C.orange,26);label(c,tr(l,'由載體傳遞','Carried between stages'),504,397,C.white,22);
  base.flow(c,teacherFlowPaths.oxygen,'oxygen',C.pink,u.t,{enabled:active,count:2});
  base.flow(c,teacherFlowPaths.glucose,'glucose',C.yellow,u.t,{enabled:active,count:2});
  base.flow(c,teacherFlowPaths.productWater,'water',C.blue,u.t,{enabled:active,count:2});
  label(c,tr(l,'氧氣','Oxygen')+' O₂',326,549,C.pink,28);
  label(c,tr(l,'醣類（葡萄糖）','Sugar (glucose)'),601,549,C.yellow,26);
  label(c,tr(l,'水','Water')+' H₂O',832,549,C.blue,28);
  label(c,tr(l,'水 → 氧氣；CO₂ → 醣類中的碳','Water supplies oxygen; CO₂ supplies the carbon in sugars'),480,600,C.white,24);
 }
 function guardComparison(c,u,l,images={}){
  bg(c);c.save();const p=u.guardOriginalPan||{x:0,y:0};c.translate(480+p.x,310+p.y);c.scale(u.guardOriginalZoom||1,u.guardOriginalZoom||1);c.translate(-480,-310);
  asset(c,images.guardCartoon,20,86,920,430);
  label(c,tr(l,'張開：吸水、膨脹','Open: water uptake'),270,40,C.blue,26);
  label(c,tr(l,'關閉：失水、膨壓下降','Closed: water loss'),711,40,C.orange,26);
  label(c,tr(l,'兩個保衛細胞','Two guard cells'),270,76,C.green,22);
  label(c,tr(l,'兩個保衛細胞','Two guard cells'),711,76,C.green,22);
  box(c,384,93,192,38,C.white);label(c,tr(l,'表皮細胞','Epidermal cells'),480,114,C.white,24);
  line(c,[[384,112],[346,112],[288,144]],C.white,2.5);
  line(c,[[576,112],[625,112],[706,151]],C.white,2.5);
  const legend=[[160,'液胞','Vacuole',C.blue],[372,'細胞核','Nucleus',C.orange],[597,'葉綠體','Chloroplast',C.green],[818,'氣孔＝孔隙','Stoma = pore',C.white]];
  for(const [x,z,e,color] of legend){label(c,tr(l,z,e),x,549,color,24);}
  label(c,tr(l,'每個保衛細胞：一個連續的大液胞','Each guard cell: one continuous large vacuole'),480,598,C.blue,26);c.restore();
 }
 return {...base,chloroplast,guardComparison,teacherFlowPaths};
});
