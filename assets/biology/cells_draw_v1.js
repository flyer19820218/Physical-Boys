/* Original, deterministic teaching diagrams. No changes to existing biology/chemistry models. */
(()=>{
  'use strict';
  const C={bg:'#11261f',deep:'#0b1a15',white:'#f2ecd9',wall:'#f6bf70',membrane:'#55e9ff',nucleus:'#b38ef3',mitochondria:'#fb923c',chloroplast:'#75ce6a',vacuole:'#70bcd3',cytoplasm:'#dfd492'};
  const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=p=>p*p*(3-2*p);
  function ellipse(c,x,y,rx,ry,fill,stroke,width=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function poly(c,pts,fill,stroke,width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function line(c,pts,color,width=3){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function round(c,x,y,w,h,r,fill,stroke,width=2){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function gradient(c,x,y,r,from,to){const g=c.createRadialGradient(x-r*.3,y-r*.3,3,x,y,r);g.addColorStop(0,from);g.addColorStop(1,to);return g;}
  function background(c,w,h){c.clearRect(0,0,w,h);c.fillStyle=gradient(c,w/2,h/2,w*.6,'#244d42',C.deep);c.fillRect(0,0,w,h);}
  function chloroplast(c,x,y,rx=17,ry=10,a=0){c.save();c.translate(x,y);c.rotate(a);ellipse(c,0,0,rx,ry,gradient(c,0,0,rx,'#b3ed80','#2b7543'),'#a1d882',1.5);for(let i=-2;i<=2;i++){line(c,[[i*rx*.25,-ry*.5],[i*rx*.25,ry*.5]],'#40814b',1.3);}c.restore();}
  function mitochondrion(c,x,y,a=0,scale=1){c.save();c.translate(x,y);c.rotate(a);c.scale(scale,scale);ellipse(c,0,0,34,16,gradient(c,0,0,38,'#ffd789','#cb693b'),C.mitochondria,2);line(c,[[-24,0],[-17,-8],[-9,7],[-1,-8],[7,8],[15,-7],[25,0]],'#a34e33',2);c.restore();}
  function nucleus(c,x,y,r=42){ellipse(c,x,y,r,r*.85,gradient(c,x,y,r,'#debdff','#74509c'),C.nucleus,3);ellipse(c,x-r*.15,y+r*.08,r*.23,r*.2,'#664480');for(let i=0;i<9;i++){ellipse(c,x+Math.cos(i*2.4)*r*.55,y+Math.sin(i*2.4)*r*.55,2.5,2,'#dcc4f7');}}
  function drawShapes(c,type,amount=0){
    background(c,900,500);c.save();
    if(type==='neuron'){
      const branches=[[[352,240],[277,180],[220,120]],[[345,259],[248,263],[181,303]],[[374,204],[335,127],[345,71]],[[412,202],[450,136],[512,111]],[[402,300],[427,385],[406,442]]];
      branches.forEach(b=>{line(c,[[383,258],b[1],b[2]],'#9bccf0',8);const end=b.at(-1);line(c,[b[1],[end[0]+25,end[1]-38]],'#9bccf0',4);line(c,[b[1],[end[0]-39,end[1]+20]],'#9bccf0',4);});
      line(c,[[409,266],[494,286],[590,253],[705,283],[772,249]],'#9bccf0',10);
      for(let i=0;i<5;i++){const x=515+i*43,a=x<590?[494,286]:[590,253],b=x<590?[590,253]:[705,283],y=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);c.save();c.translate(x,y);c.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));round(c,-17,-13,34,26,10,'#d6b68d','#f2deae',2);c.restore();}
      line(c,[[756,258],[799,205],[830,187]],'#9bccf0',5);line(c,[[756,258],[808,308],[839,331]],'#9bccf0',5);
      poly(c,[[339,260],[369,218],[399,204],[428,248],[409,292],[379,314],[354,285]],gradient(c,380,258,70,'#cee7f4','#568ca8'),'#a8dbfa',4);nucleus(c,383,258,26);
    }else if(type==='muscle'){
      const p=clamp(amount/100,0,1),len=560-170*p,h=108*560/len,x=450-len/2,y=250-h/2;
      round(c,x,y,len,h,h/2,gradient(c,450,240,340,'#fda09a','#a74554'),'#f0a2a4',4);
      c.save();c.beginPath();c.roundRect(x,y,len,h,h/2);c.clip();
      for(let i=1;i<24;i++){const xx=x+len*i/24;line(c,[[xx,y],[xx,y+h]],i%2?'#cc7376':'#883a4f',5);}c.restore();
      for(let i=0;i<5;i++)ellipse(c,x+len*(i+.5)/5,y+18,9,5,'#663e68','#d5b4dd');
    }else if(type==='redblood'){
      c.save();c.translate(450,255);c.rotate(-.14);const g=c.createRadialGradient(-65,-40,6,0,0,168);g.addColorStop(0,'#df7f72');g.addColorStop(.45,'#a93744');g.addColorStop(.70,'#ed6a60');g.addColorStop(1,'#8a293a');ellipse(c,0,0,180,124,g,'#f79981',4);ellipse(c,0,-4,83,53,gradient(c,0,-4,92,'#8a3341','#c64f51'));c.restore();
    }else if(type==='guard'){
      for(const s of [-1,1]){c.save();c.translate(450,250);c.scale(s,1);c.beginPath();c.moveTo(18,-126);c.bezierCurveTo(174,-170,194,150,18,126);c.bezierCurveTo(109,64,109,-64,18,-126);c.closePath();c.fillStyle=gradient(c,91,0,166,'#d9e798','#729963');c.fill();c.strokeStyle='#ddedae';c.lineWidth=5;c.stroke();c.save();c.clip();for(let i=0;i<8;i++){const y=-90+i*25,x=110*(1-.6*(y/140)**2);chloroplast(c,x,y,8,5,y/130);}nucleus(c,119,10,14);c.restore();c.restore();}
    }else{
      const node=(row,col)=>[155+col*145+(row%2)*20,105+row*98+Math.sin(col*1.2)*8];
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){const pts=[node(row,col),node(row,col+1),node(row+1,col+1),node(row+1,col)];poly(c,pts,'rgba(188,193,227,.16)','#d0cff1',3);nucleus(c,(pts[0][0]+pts[2][0])/2-10,(pts[0][1]+pts[2][1])/2,16);}
    }
    c.restore();
  }
  const parts={
    nucleus:{color:C.nucleus,animal:[370,255],plant:[290,235]},
    membrane:{color:C.membrane,animal:[678,288],plant:[694,330]},
    cytoplasm:{color:C.cytoplasm,animal:[535,215],plant:[290,375]},
    mitochondria:{color:C.mitochondria,animal:[550,330],plant:[615,405]},
    vacuole:{color:C.vacuole,animal:[370,374],plant:[480,270]},
    wall:{color:C.wall,plant:[708,160]},
    chloroplast:{color:C.chloroplast,plant:[632,152]}
  };
  function drawStructure(c,type,selected){
    background(c,900,600);const plant=type==='plant';
    if(plant){
      round(c,192,100,542,422,32,'#9c7744','#cfac79',3);round(c,170,75,540,422,32,gradient(c,440,270,330,'#f0e1b3','#cfae69'),C.wall,5);
      round(c,185,90,510,392,24,gradient(c,420,270,310,'#dce5a8','#8cad7d'),C.membrane,4);
      round(c,355,160,225,255,65,gradient(c,470,270,180,'#d0edf3','#7eafbd'),C.vacuole,3);
      nucleus(c,290,235,47);
      [[273,130,-.3],[459,122,.1],[632,152,.45],[655,254,1.4],[650,360,1.1],[307,445,-.1]].forEach(p=>chloroplast(c,...p.slice(0,2),26,15,p[2]));
      mitochondrion(c,615,405,.35);mitochondrion(c,282,344,-.55,.75);
    }else{
      ellipse(c,451,318,235,173,'#546776','#87a8b6',3);
      c.beginPath();c.moveTo(218,285);c.bezierCurveTo(225,135,369,95,515,138);c.bezierCurveTo(726,172,756,374,580,449);c.bezierCurveTo(427,514,182,425,218,285);c.closePath();c.fillStyle=gradient(c,440,285,310,'#f2e7ba','#b3bd9c');c.fill();c.strokeStyle=C.membrane;c.lineWidth=5;c.stroke();
      nucleus(c,370,255,69);[[550,330,.4],[523,180,-.2],[283,320,1.1],[483,406,.6]].forEach(p=>mitochondrion(c,...p));
      ellipse(c,370,374,23,18,gradient(c,370,374,28,'#ccecf6','#729aa8'),C.vacuole,2);ellipse(c,630,253,16,12,'#96c9dc',C.vacuole,2);
      for(let i=0;i<30;i++)ellipse(c,450+Math.cos(i*2.39)*155,280+Math.sin(i*2.39)*100,2,2,'#bba575');
    }
    const p=parts[selected]?.[type];if(p){ellipse(c,...p,42,42,null,'#fde047',4);ellipse(c,...p,48,48,null,'rgba(253,224,71,.25)',2);}
  }
  const project=(x,y,z=0)=>[140+.92*x+.34*y,270+.65*y-z];
  function coverGeometry(progress=1){const angle=(1-clamp(progress,0,1))*Math.PI*40/180,x=260,y=85,z=14,l=150;return [[x,y,z],[x+l*Math.cos(angle),y,z+l*Math.sin(angle)],[x+l*Math.cos(angle),y+80,z+l*Math.sin(angle)],[x,y+80,z]];}
  function surface(c,pts,fill,stroke,width=2){poly(c,pts.map(p=>project(...p)),fill,stroke,width);}
  const mountInitial=material=>({material,step:0,progress:1,badCover:false,busy:false});
  function mountNext(s){if(s.busy||s.step>=5)return s;if(s.badCover)return {...s,badCover:false,step:3,progress:0,busy:true};return {...s,step:s.step+1,progress:0,busy:true};}
  function drawMount(c,s){
    background(c,900,560);const p=smooth(clamp(s.progress,0,1)),step=s.step,blue=s.material!=='elodea';
    surface(c,[[-110,-85,0],[730,-85,0],[730,300,0],[-110,300,0]],'#899d97','#b8c9c1',3);
    surface(c,[[-110,300,0],[730,300,0],[730,300,-28],[-110,300,-28]],'#687f78','#b8c9c1',2);
    // Slide thickness and upper plane. All items touch this same plane.
    surface(c,[[130,60,2],[570,60,2],[570,190,2],[130,190,2]],'rgba(160,219,218,.25)','#bacdca',3);
    surface(c,[[130,60,8],[570,60,8],[570,190,8],[130,190,8]],'rgba(226,251,250,.35)','#e3faf8',3);
    line(c,[project(147,74,9),project(537,74,9)],'rgba(242,255,252,.65)',3);
    if(step>=1){
      const dropVisible=step!==1||p>.6;const opacity=step===1?clamp((p-.6)/.4,0,1):1;
      if(dropVisible){const [x,y]=project(337,127,14);ellipse(c,x,y,80,30,blue?`rgba(63,146,220,${.42*opacity})`:`rgba(191,233,243,${.55*opacity})`,blue?'#78caff':'#d6fcff',2);}
      if(step===1&&p<.7){const [x,y]=project(337,127,110-96*p/.7);ellipse(c,x,y,6,10,blue?'#58b7ee':'#bcf4ff','#eefcff',1);}
      if(step===1&&p<1){const [x,y]=project(337,127,145);round(c,x-7,y-85,14,80,4,'#c3e2df','#f2ecd9',2);poly(c,[[x-7,y-5],[x+7,y-5],[x,y+14]],'#c3e2df','#f2ecd9',2);round(c,x-17,y-106,34,31,13,'#4d8290','#bed6d7',2);}
    }
    if(step>=2){
      const z=step===2?14+(1-p)*100:14;const cx=337+(step===2?(1-p)*120:0),cy=127;
      if(s.material==='elodea'){surface(c,[[cx-48,cy-25,z],[cx+47,cy-14,z],[cx+35,cy+24,z],[cx-45,cy+22,z]],'#519864','#b5e48d',2);line(c,[project(cx-37,cy,z+1),project(cx+35,cy,z+1)],'#d3edaa',2);}
      else if(s.material==='onion'){surface(c,[[cx-46,cy-22,z],[cx+40,cy-23,z],[cx+43,cy+22,z],[cx-44,cy+25,z]],'rgba(215,235,245,.58)','#cde7ee',1);for(let i=0;i<5;i++)line(c,[project(cx-35+i*15,cy-20,z+.5),project(cx-36+i*15,cy+21,z+.5)],'rgba(90,136,184,.55)',1);}
      else{for(let i=0;i<15;i++){const [x,y]=project(cx+Math.sin(i*2.39)*29,cy+Math.cos(i*2.39)*18,z);ellipse(c,x,y,4,2.5,'#a8b1dc','#829dcb',1);}}
      if(step===2&&p<.85){const tip=project(cx+38,cy-4,z+3);line(c,[[tip[0]+120,tip[1]-95],[tip[0]+15,tip[1]-16],tip],'#dae5df',5);line(c,[[tip[0]+120,tip[1]-95],[tip[0]+25,tip[1]-8],[tip[0]+8,tip[1]+6]],'#a7b5b0',5);}
    }
    if(step>=3||s.badCover){const cp=s.badCover?1:(step===3?p:1);surface(c,coverGeometry(cp),'rgba(213,247,245,.22)','#effffd',2.5);line(c,[project(...coverGeometry(cp)[0]),project(...coverGeometry(cp)[1])],'#f2fff9',3);}
    if(s.badCover){for(let i=0;i<5;i++){const [x,y]=project(292+i*21,115+Math.sin(i)*13,15);ellipse(c,x,y,8+i%2*5,5+i%2*3,'rgba(220,244,242,.25)','#fff8da',2);}}
    if(step>=4){const paperX=step===4?520-p*104:416;surface(c,[[paperX,85,14],[paperX+55,85,14],[paperX+55,164,14],[paperX,164,14]],'#f4edd8','#d4c7a0',1);if(step===4){const [x,y]=project(paperX+8,130,15);ellipse(c,x,y,Math.max(1,p*11),p*10,blue?'rgba(68,135,208,.40)':'rgba(149,193,211,.32)');}}
    if(step===5){const [x,y]=project(337,127,17);ellipse(c,x,y,105,47,null,'#fde047',3);}
  }
  function perimeterPoint(q,w,h){const per=2*(w+h),d=((q%1+1)%1)*per;return d<w?[d,0]:d<w+h?[w,d-w]:d<2*w+h?[2*w+h-d,h]:[0,per-d];}
  function drawObservation(c,s){
    c.clearRect(0,0,640,640);c.fillStyle=C.deep;c.fillRect(0,0,640,640);c.save();c.beginPath();c.arc(320,320,278,0,TAU);c.clip();
    c.fillStyle=gradient(c,320,320,390,'#dce7cc','#8faca1');c.fillRect(0,0,640,640);
    c.translate(320,320);c.scale(s.mag/100,s.mag/100);c.rotate(Math.PI);c.translate(-320,-320);
    c.filter=`blur(${Math.abs(s.focus)*.32}px)`;
    if(s.specimen==='cheek'){
      for(let i=0;i<12;i++){const row=Math.floor(i/4),cx=320+(i%4-1)*145+((row+1)%2)*28,cy=320+(row-1)*163;const pts=Array.from({length:8},(_,j)=>{const a=j*TAU/8,r=52+8*Math.sin(i+j*3.1);return [cx+Math.cos(a)*r,cy+Math.sin(a)*r*.72];});poly(c,pts,s.stain?'rgba(93,143,188,.23)':'rgba(179,198,183,.10)',s.stain?'#687ca7':'#92aaa0',1.4);ellipse(c,cx-9,cy+7,11,9,s.stain?'#536497':'rgba(134,159,153,.2)',s.stain?'#596c9f':null,1);}
    }else{
      const leaf=s.specimen==='elodea',w=leaf?133:172,h=leaf?93:85;
      for(let row=-1;row<9;row++)for(let col=-1;col<6;col++){
        const x=col*w+(row%2)*w/2,y=row*h;
        round(c,x,y,w,h,3,leaf?'rgba(135,168,97,.10)':s.stain?'rgba(129,159,188,.15)':'rgba(217,226,193,.16)',leaf?'#798b4d':s.stain?'#718dad':'#a6b39d',2);
        if(leaf){for(let j=0;j<15;j++){const pt=perimeterPoint(j/15+(s.streaming?s.time*.010:0)+(row+col)*.038,w-27,h-25);chloroplast(c,x+14+pt[0],y+12+pt[1],6.5,4.1,j*.42);}}
        else{ellipse(c,x+w*.2,y+h*.63,8,6.5,s.stain?'#4d6195':'rgba(138,153,155,.20)',s.stain?'#7281a3':null,1);}
      }
    }
    c.filter='none';c.restore();
    // Same illumination, higher power: qualitative brightness trend, never a calibrated measurement.
    const dim=clamp((100-s.lamp)/170+(s.mag===400?.13:0),0,.75);c.save();c.beginPath();c.arc(320,320,278,0,TAU);c.clip();c.fillStyle=`rgba(11,26,21,${dim})`;c.fillRect(0,0,640,640);c.restore();
    ellipse(c,320,320,278,278,null,'#b8c5bd',5);
  }
  const API={C,parts,drawShapes,drawStructure,drawMount,drawObservation,coverGeometry,project,mountInitial,mountNext,perimeterPoint};
  globalThis.CellsDrawV1=API;
  if(typeof module!=='undefined')module.exports=API;
})();
