/* Teacher-authorized Chinese structural overview. English and all moving models delegate unchanged. */
(function(root){'use strict';
 const D=root.AnimalDraw,original=D.absorption,C=D.C;
 const crops=[{source:[5,565,400,225],x:30,w:295,label:'光學切片：環狀皺褶'},
  {source:[410,565,397,225],x:352,w:293,label:'光學切片：絨毛'},
  {source:[812,565,260,225],x:700,w:220,label:'電顯：微絨毛'}];
 function line(c,points,color=C.teal,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function label(c,t,x,y,points,color=C.teal){if(points)line(c,points,color);D.text(c,t,x,y,22,color,'center',190);}
 function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function arrow(c,x,y){line(c,[[x,y],[x+24,y]],C.yellow,3);line(c,[[x+16,y-7],[x+24,y],[x+16,y+7]],C.yellow,3);}
 function intestine(c){
  // A longitudinal cutaway: a hollow lumen, muscular wall and repeated internal folds.
  const paint=c.createLinearGradient(0,176,0,350);paint.addColorStop(0,'#f1ba9d');paint.addColorStop(.45,'#e29384');paint.addColorStop(1,'#9d525b');
  c.beginPath();c.moveTo(65,179);c.lineTo(236,215);c.bezierCurveTo(278,226,279,316,238,333);c.lineTo(65,309);c.bezierCurveTo(11,295,10,200,65,179);c.closePath();c.fillStyle=paint;c.fill();c.strokeStyle='#f6c7a8';c.lineWidth=3;c.stroke();
  c.save();c.beginPath();c.moveTo(68,195);c.lineTo(236,230);c.bezierCurveTo(261,239,262,303,236,317);c.lineTo(68,291);c.bezierCurveTo(33,282,34,206,68,195);c.closePath();c.clip();
  const lumen=c.createLinearGradient(0,197,0,319);lumen.addColorStop(0,'#73393e');lumen.addColorStop(.5,'#442d31');lumen.addColorStop(1,'#af6971');c.fillStyle=lumen;c.fillRect(25,185,247,150);
  for(let i=0;i<5;i++){const x=82+i*33,cy=248+i*6;c.strokeStyle='#efa88e';c.lineWidth=13;c.beginPath();c.ellipse(x,cy,17,43,0,-Math.PI/2,Math.PI/2);c.stroke();c.strokeStyle='#ffe0b4';c.lineWidth=3;c.stroke();
   for(let j=0;j<11;j++){const a=-Math.PI/2+j*Math.PI/10,xx=x+17*Math.cos(a),yy=cy+43*Math.sin(a);line(c,[[xx,yy],[xx-6*Math.cos(a),yy-6*Math.sin(a)]],'#f9c49e',3);}}
  c.restore();ellipse(c,64,245,35,65,paint,'#f6c7a8');ellipse(c,64,245,24,48,'#683740','#eeb093');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,[[64+24*Math.cos(a),245+48*Math.sin(a)],[64+17*Math.cos(a),245+35*Math.sin(a)]],'#f3c297',3);}
  label(c,'環狀皺褶',126,134,[[126,149],[143,199],[148,231]]);
  label(c,'絨毛',246,170,[[246,185],[235,246]]);
  label(c,'腸腔',223,370,[[223,354],[193,276]]);
  label(c,'肌肉層',74,370,[[74,353],[50,303]]);
 }
 function epithelialCell(c,x,y,a,goblet=false){c.save();c.translate(x,y);c.rotate(a);
  D.round(c,-8,-5,16,10,3,goblet?'#80c8c2':'#f4c39d','#9b635b');ellipse(c,goblet?3:-2,0,goblet?3:2,goblet?3:2,goblet?'#d9f0d8':'#a879a8');
  for(let n=-3;n<=3;n+=3)line(c,[[8,n],[12,n]],'#ffe1b7',1.6);c.restore();
 }
 function villus(c){
  const tissue=c.createLinearGradient(374,0,501,0);tissue.addColorStop(0,'#b57469');tissue.addColorStop(.5,'#efc39e');tissue.addColorStop(1,'#b27167');
  c.beginPath();c.moveTo(373,390);c.lineTo(390,354);c.lineTo(390,189);c.bezierCurveTo(390,116,484,116,484,189);c.lineTo(484,354);c.lineTo(504,390);c.closePath();c.fillStyle=tissue;c.fill();c.strokeStyle='#f4c39d';c.lineWidth=3;c.stroke();
  // Blind-ended lacteal is separate from the continuous red/blue blood-capillary loop.
  line(c,[[437,184],[437,380],[491,389]],'#6d8c50',11);line(c,[[437,184],[437,380],[491,389]],'#c4da91',6);
  line(c,[[403,390],[409,184]],'#61b7e6',7);line(c,[[470,390],[467,184]],'#e87572',7);
  for(const y of [186,244,307]){const grad=c.createLinearGradient(409,y,467,y);grad.addColorStop(0,'#61b7e6');grad.addColorStop(.5,'#bf99c3');grad.addColorStop(1,'#e87572');
   c.beginPath();c.moveTo(409,y);c.bezierCurveTo(411,y-35,464,y-35,467,y);c.strokeStyle=grad;c.lineWidth=4;c.stroke();}
  for(let i=0;i<=12;i++){const a=Math.PI+i*Math.PI/12;epithelialCell(c,437+47*Math.cos(a),189+48*Math.sin(a),Math.atan2(Math.sin(a)/48,Math.cos(a)/47));}
  for(let i=0;i<16;i++){epithelialCell(c,390,201+i*10,Math.PI,i===4);epithelialCell(c,484,201+i*10,0,i===1);}
  // A crypt opens between villi; it is not the lumen of the villus itself.
  c.beginPath();c.moveTo(351,349);c.lineTo(351,380);c.bezierCurveTo(351,411,375,411,375,380);c.lineTo(375,353);c.strokeStyle='#d3a38b';c.lineWidth=10;c.stroke();c.strokeStyle='#80c8c2';c.lineWidth=3;c.stroke();
  line(c,[[343,418],[503,418]],'#ce9aa7',9);
  label(c,'吸收細胞',603,139,[[546,139],[484,167]]);
  label(c,'杯狀細胞',603,192,[[546,192],[484,211]],'#a5e2db');
  label(c,'微血管',603,246,[[557,246],[455,221]]);
  label(c,'乳糜管',603,296,[[557,296],[437,284]],'#c4da91');
  label(c,'動脈',603,345,[[576,345],[470,367]],'#f79a90');
  label(c,'靜脈',603,386,[[576,386],[404,376]],'#85d6fc');
  label(c,'腸腺',351,443,[[351,428],[362,396]]);
  label(c,'黏膜肌層',487,443,[[487,428],[487,418]],'#e6b1c2');
 }
 function enterocyte(c){
  const fill=c.createLinearGradient(730,170,891,365);fill.addColorStop(0,'#f9d9ab');fill.addColorStop(.5,'#eab38e');fill.addColorStop(1,'#bb7e73');
  D.round(c,751,185,133,216,18,fill,'#ffddb4');
  for(let i=0;i<16;i++){const x=755+i*8;D.round(c,x,159,5,39,3,'#f5d1a2','#b48065');}
  ellipse(c,813,328,29,39,'#aa8bb5','#ceadcf');ellipse(c,803,327,10,12,'#7a5b94');
  for(const [x,y,a] of [[777,242,.3],[848,267,-.3],[780,369,.3]]){c.save();c.translate(x,y);c.rotate(a);D.round(c,-7,-15,14,30,7,'#da916e','#ae705b');for(let j=-9;j<11;j+=5)line(c,[[-5,j],[3,j+2],[-3,j+4]],'#f3c494',1.4);c.restore();}
  line(c,[[838,145],[838,121],[760,121]],C.teal);
  D.text(c,'微絨毛（刷狀緣）',821,105,22,C.teal,'center',235);
  label(c,'細胞核',817,437,[[817,421],[817,367]],'#cfb9df');
 }
 function structure(c,images){D.bg(c);D.text(c,'小腸 → 絨毛 → 微絨毛',480,32,30,C.yellow,'center',910);
  D.text(c,'小腸內壁',156,79,26,C.white,'center',280);D.text(c,'一根絨毛',481,79,26,C.white,'center',330);D.text(c,'一個吸收細胞',817,65,26,C.white,'center',265);
  intestine(c);villus(c);enterocyte(c);arrow(c,290,262);arrow(c,702,262);
  line(c,[[22,475],[938,475]],'#638579',1.5);
  const im=images.histology;
  for(const crop of crops){const [sx,sy,sw,sh]=crop.source,h=crop.w*sh/sw;
   D.text(c,crop.label,crop.x+crop.w/2,500,22,C.teal,'center',crop.w+20);
   if(im)c.drawImage(im,sx,sy,sw,sh,crop.x,522,crop.w,h);
  }
 }
 // Diagram + genuine evidence use one fixed 960 x 660 viewport. Drawing crops
 // preserves the source JPEG; neither the photos nor English original are edited.
 crops.forEach(c=>{const width=c.source[2]/c.source[3]*125;c.x+=(c.w-width)/2;c.w=width;});
 D.absorption=function(c,s,tr,images,time){const zh=s.lang?s.lang==='zh':s.langIndex===0;if(s.villusView==='original'&&zh)return structure(c,images);return original(c,s,tr,images,time);};
 root.AnimalStructureZh={draw:structure,crops,original};
})(typeof window==='undefined'?globalThis:window);
