/* Microorganisms · "Diatoms" canvas (algae tab, view 0), 2026-10-22.
 * Thirteen diatoms (diatom_01..13.png, the teacher's Gemini AI illustration MB6, cut one by one) move between four layouts:
 *  0 sorted into five shape groups (round radiating / boat / needle / triangle / V); the groups light up in turn
 *    (click a group to hold it), a glassy sheen runs over every shell;
 *  1 one round diatom seen from the top, beside a drawn side view of the two halves fitting like a box (lid and base);
 *  2 the six diatoms that show golden-brown chloroplasts (02 04 05 09 10 11, see sources.md), chloroplasts glowing in turn,
 *    sunlight, and the chain "nucleus → eukaryote → protist";
 *  3 all thirteen drifting in water, beside a schematic food chain (diatom → small animals → fish).
 * Positions ease from one layout to the next; every step keeps a gentle float so the canvas is never still.
 * Chloroplast positions are fractions of each PNG, measured from the golden pixels (connected regions, centre of mass).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,wrap,splitLines,pill,cpill,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,drawIn,TAU}=K;
const N=4,PER=7;
const F=i=>`diatom_${i<10?'0'+i:i}.png`;
const GLASS='#a8e3e8',GOLD='#d9a441',WATER='#2a7fa6';

// ── layouts: id → [centre x, centre y, width, rotation] ─────────────────────
const GROUPS=[
 {name:P(`圓形放射狀`,`Round, radiating`),box:[16,8,326,334],ids:[1,3,6,12,13]},
 {name:P(`舟形`,`Boat-shaped`),box:[356,8,588,334],ids:[2,4,5,7,9]},
 {name:P(`針形`,`Needle-shaped`),box:[16,352,314,170],ids:[8]},
 {name:P(`三角形`,`Triangular`),box:[346,352,274,170],ids:[10]},
 {name:P(`V 形`,`V-shaped`),box:[636,352,308,170],ids:[11]}];
const GROUP_OF={};GROUPS.forEach((g,i)=>g.ids.forEach(id=>GROUP_OF[id]=i));
const L0={1:[90,142,112,0],3:[206,134,96,0],6:[295,138,68,0],12:[110,266,108,0],13:[240,264,116,0],
 7:[440,196,126,0],4:[550,196,74,0],2:[682,130,150,0],5:[682,266,150,0],9:[855,192,118,0],
 8:[182,452,118,.87],10:[522,446,148,0],11:[848,444,146,0]};
const L1={13:[175,300,250,0]};
const L2={5:[135,148,210,0],10:[365,150,212,0],2:[595,148,210,0],4:[135,400,108,0],11:[365,400,232,0],9:[595,400,196,0]};
const L3={1:[90,150,80,0],2:[245,140,100,.2],3:[400,160,66,0],4:[555,150,46,-.2],5:[140,290,100,-.15],6:[300,290,52,0],7:[440,295,74,.3],
 8:[566,318,62,-.25],9:[80,430,66,.2],10:[230,420,92,.15],11:[400,430,104,-.1],12:[560,440,74,0],13:[480,524,70,0]};
const LAY=[L0,L1,L2,L3];
// golden chloroplast regions: [fx, fy, area in picture px]
const CHL={2:[[.351,.49,5416],[.353,.74,3018],[.597,.597,2743],[.643,.247,2513],[.704,.4,2492],[.515,.323,2305]],
 4:[[.32,.489,5599],[.72,.432,2936],[.537,.644,2457]],5:[[.465,.605,7860],[.547,.388,6782]],
 9:[[.34,.525,2230],[.543,.337,1935],[.503,.634,1121],[.637,.528,1073]],
 10:[[.346,.794,4578],[.649,.769,4477],[.695,.665,4464],[.53,.386,4226],[.286,.69,3560],[.427,.417,2807]],
 11:[[.298,.695,4475],[.585,.572,4402],[.623,.665,4342],[.353,.773,4002],[.366,.304,3205],[.318,.375,2921]]};
const ORDER2=[5,10,2,4,11,9];

function poseOf(k,id,t){
  const b=LAY[k][id];if(!b)return null;let [x,y,w,r]=b;
  if(k===3){x+=16*Math.sin(t*.33+id*1.7);y+=11*Math.sin(t*.47+id*2.3);r+=.14*Math.sin(t*.26+id);}
  else{y+=2.6*Math.sin(t*.9+id*1.3);r+=.02*Math.sin(t*.6+id*.7);}
  return{x,y,w,r};
}
// Layout tween: the layout eases from the previous step to this one.
function track(s,k,t){
  if(s.diaK===undefined){s.diaK=k;s.diaFrom=k;s.diaT=t-9;}
  if(s.diaK!==k){s.diaFrom=s.diaK;s.diaK=k;s.diaT=t;}
  if(t<s.diaT)s.diaT=t;
  return{from:s.diaFrom,u:smooth((t-s.diaT)/1.1),ov:smooth((t-s.diaT)/.5)};
}
function pose(id,from,k,u,t){
  const a=poseOf(from,id,t),b=poseOf(k,id,t);
  if(a&&b)return{x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),r:mix(a.r,b.r,u),a:1};
  if(b)return{...b,a:clamp(u*1.4-.4)};if(a)return{...a,a:clamp(1-u*1.8)};return null;
}
const dims=(id,w)=>{const [W,H]=SIZE[F(id)];return[w,w*H/W];};
// picture point (fractions) → canvas point
function onPic(p,id,fx,fy){const [w,h]=dims(id,p.w),dx=(fx-.5)*w,dy=(fy-.5)*h,cs=Math.cos(p.r),sn=Math.sin(p.r);return[p.x+dx*cs-dy*sn,p.y+dx*sn+dy*cs];}

// ── drawing pieces ─────────────────────────────────────────────────────────
let OC=null;
// A moving glassy highlight, masked by the picture's own alpha and added on top.
function sheen(c,id,w,h,u,a){
  const im=pic(AI+F(id));if(!im||a<=0||u<=0||u>=1)return;
  if(!OC)OC=document.createElement('canvas');
  const W=Math.ceil(w)+2,H=Math.ceil(h)+2;if(OC.width<W||OC.height<H){OC.width=Math.max(OC.width,W);OC.height=Math.max(OC.height,H);}
  const o=OC.getContext('2d');o.clearRect(0,0,OC.width,OC.height);o.globalCompositeOperation='source-over';o.drawImage(im,0,0,w,h);
  o.globalCompositeOperation='source-in';const bx=mix(-w*.5,w*1.5,u),g=o.createLinearGradient(bx-w*.22,-h*.1,bx+w*.22,h*.35);
  g.addColorStop(0,'rgba(235,255,255,0)');g.addColorStop(.5,'rgba(235,255,255,.9)');g.addColorStop(1,'rgba(235,255,255,0)');
  o.fillStyle=g;o.fillRect(0,0,w,h);o.globalCompositeOperation='source-over';
  c.save();c.globalAlpha*=a*.42;c.globalCompositeOperation='lighter';c.drawImage(OC,0,0,w,h,-w/2,-h/2,w,h);c.restore();
}
function dia(c,id,p,alpha,sh){
  if(!p||p.a*alpha<=.01)return;const [w,h]=dims(id,p.w);
  c.save();c.translate(p.x,p.y);if(p.r)c.rotate(p.r);
  drawIn(c,F(id),{x:-w/2,y:-h/2,w,h},{alpha:p.a*alpha});
  if(sh!=null)sheen(c,id,w,h,sh,p.a*alpha);
  c.restore();
}
// A label with a leader line from its first row to a target point.
function tag(c,p,x,y,tx,ty,col,a,{align='left',w=200,size=22,lh=29}={}){
  if(a<=0)return;
  const rows=D.tr(p).split('\n').flatMap(sg=>splitLines(c,sg,w,size));
  c.save();c.globalAlpha*=a;
  const sx=align==='left'?x-8:x+8;
  line(c,[[sx,y-size*.36],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));
  c.restore();
}
function sun(c,x,y,r,t){
  glow(c,x,y,r*2.6,C.yellow,.35);
  c.save();for(let i=0;i<10;i++){const a=i*TAU/10+t*.25,r1=r+5,r2=r+13+3*Math.sin(t*2+i);
    line(c,[[x+r1*Math.cos(a),y+r1*Math.sin(a)],[x+r2*Math.cos(a),y+r2*Math.sin(a)]],C.yellow,3);}c.restore();
  circle(c,x,y,r,C.yellow,null);
}
const wrapRows=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>splitLines(c,sg,w,size));
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=wrapRows(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}

// ── step 1: the two halves (drawn side view, schematic) ────────────────────
const BX=585,BR=135,BRY=36,BRB=126;
// front wall of a cylinder between yTop and yBot
function wall(c,cx,yTop,yBot,rx,ry,a){
  c.save();c.globalAlpha*=a;c.beginPath();c.moveTo(cx-rx,yTop);c.lineTo(cx-rx,yBot);c.ellipse(cx,yBot,rx,ry,0,Math.PI,0,true);c.lineTo(cx+rx,yTop);c.ellipse(cx,yTop,rx,ry,0,0,Math.PI,false);c.closePath();
  const g=c.createLinearGradient(cx-rx,0,cx+rx,0);g.addColorStop(0,'rgba(190,238,242,.55)');g.addColorStop(.35,'rgba(150,212,222,.22)');g.addColorStop(.7,'rgba(150,212,222,.2)');g.addColorStop(1,'rgba(190,238,242,.5)');
  c.fillStyle=g;c.fill();c.strokeStyle=GLASS;c.lineWidth=2.5;c.stroke();
  // fine bands on the wall (the glassy girdle texture)
  c.clip();c.strokeStyle='rgba(215,248,250,.28)';c.lineWidth=1.2;
  for(let i=1;i<12;i++){const x=cx-rx+i*rx*2/12;c.beginPath();c.moveTo(x,yTop-ry);c.lineTo(x,yBot+ry);c.stroke();}
  c.restore();
}
// the top face of the lid: glassy disc with radiating rows of pores, like the picture beside it
function lidFace(c,cx,y,rx,ry,a,t){
  c.save();c.globalAlpha*=a;
  const g=c.createRadialGradient(cx-rx*.3,y-ry*.4,4,cx,y,rx);g.addColorStop(0,'rgba(215,248,250,.75)');g.addColorStop(1,'rgba(150,212,222,.45)');
  ellipse(c,cx,y,rx,ry,g,GLASS,2.5);
  c.beginPath();c.ellipse(cx,y,rx-2,ry-1,0,0,TAU);c.clip();
  c.fillStyle='rgba(240,255,255,.75)';
  for(let i=0;i<36;i++){const an=i*TAU/36;for(let j=2;j<9;j++){const rr=j/9*rx*.95;c.beginPath();c.arc(cx+rr*Math.cos(an),y+rr*ry/rx*Math.sin(an),1.5,0,TAU);c.fill();}}
  ellipse(c,cx,y,rx*.12,ry*.12,'rgba(240,255,255,.5)',GLASS,1.5);
  // moving glint
  const gx=cx+Math.sin(t*.8)*rx*.6;const gg=c.createLinearGradient(gx-40,y-ry,gx+40,y+ry);gg.addColorStop(0,'rgba(255,255,255,0)');gg.addColorStop(.5,'rgba(255,255,255,.35)');gg.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=gg;c.fillRect(cx-rx,y-ry,rx*2,ry*2);
  c.restore();
}
function box(c,gap,a,t,bob){
  const lift=96*gap,yB0=300+bob,yB1=382+bob,yL0=250-lift+bob,yL1=322-lift+bob,ryB=BRY*BRB/BR;
  c.save();c.globalAlpha*=a;
  // base: opening, the cell inside, then the front wall
  ellipse(c,BX,yB0,BRB,ryB,'rgba(40,90,95,.55)',null);
  c.save();c.beginPath();c.ellipse(BX,yB0,BRB-3,ryB-2,0,0,TAU);c.clip();
  const cg=c.createRadialGradient(BX-20,yB0+2,4,BX,yB0+8,BRB*.8);cg.addColorStop(0,'rgba(226,206,120,.95)');cg.addColorStop(1,'rgba(176,150,70,.85)');
  ellipse(c,BX,yB0+8,BRB*.78,ryB*.72,cg,'rgba(242,236,217,.8)',2);c.restore();
  // back rim of the opening
  c.save();c.beginPath();c.ellipse(BX,yB0,BRB,ryB,0,Math.PI,TAU);c.strokeStyle=GLASS;c.lineWidth=2.5;c.stroke();c.restore();
  wall(c,BX,yB0,yB1,BRB,ryB,1);
  // lid: front wall, then the top face
  wall(c,BX,yL0,yL1,BR,BRY,1);
  lidFace(c,BX,yL0,BR,BRY,1,t);
  c.restore();
  return{yB0,yB1,yL0,yL1,lift};
}

// ── step overlays ──────────────────────────────────────────────────────────
function over0(c,s,a,tau,t,held){
  if(a<=0)return;
  const cyc=(tau-3.2)/1.5,sel=s.diaG;
  GROUPS.forEach((g,i)=>{
    const [x,y,w,h]=g.box,ga=fade(tau,.25+i*.35,.5);
    let em=sel!=null?(sel===i?1:0):(cyc>0?Math.max(0,Math.sin(Math.PI*clamp(mod(cyc-i,GROUPS.length)))):0);
    if(mod(cyc-i,GROUPS.length)>1&&sel==null)em=0;
    c.save();c.globalAlpha*=a*ga;
    if(em>0){c.save();c.globalAlpha*=em;D.round(c,x,y,w,h,16,rgba(C.yellow,.07),C.yellow);c.restore();}
    c.save();c.setLineDash([7,6]);D.round(c,x,y,w,h,16,null,rgba(C.muted,.45*(1-em)));c.restore();
    pill(c,g.name,x+12,y+10,{active:em>.5,color:C.yellow});
    c.restore();
    D.hit(x,y,w,h,'diaG',i);
  });
  c.save();c.globalAlpha*=a*fade(tau,1.6,.6);
  text(c,P(`玻璃般的外殼（補充：主要成分是二氧化矽）`,`A glassy shell (extra: mainly silicon dioxide)`),480,556,22,GLASS,'center');
  text(c,P(`示意，非同比例｜真實大小約 10～200 µm`,`Schematic, not to scale | real size about 10–200 µm`),480,588,22,C.muted,'center');
  c.restore();
}
function emphasis(s,tau,id){
  if(s.diaG!=null)return GROUP_OF[id]===s.diaG?1:.55;
  const cyc=(tau-3.2)/1.5;if(cyc<=0)return 1;
  const d=mod(cyc-GROUP_OF[id],GROUPS.length),e=d<1?Math.sin(Math.PI*d):0;return .6+.4*e;
}
function over1(c,a,tau,t){
  if(a<=0)return;
  const cyc=mod(tau,7.5);
  const gap=cyc<1.2?1:cyc<2.8?1-smooth((cyc-1.2)/1.6):cyc<5.8?0:smooth((cyc-5.8)/1.7);
  const bob=2.5*Math.sin(t*.9);
  c.save();c.globalAlpha*=a;
  cpill(c,P(`從正上方看`,`Seen from the top`),175,128,{color:C.white});
  cpill(c,P(`從側面看（示意）`,`Seen from the side (schematic)`),BX,40,{color:C.white});
  dashed(c,[[312,300],[408,300]],C.muted,2.5,[7,6],-t*10);arrow(c,400,300,428,300,C.muted,2.5);
  text(c,P(`轉 90°`,`Turn 90°`),370,286,22,C.muted,'center');
  const g=box(c,gap,1,t,bob);
  // labels on the right
  const lx=748;
  tag(c,P(`上殼（像蓋子）`,`Upper half\n(the lid)`),lx,148,BX+BR-4,(g.yL0+g.yL1)/2+6,C.cyan,1,{w:192});
  tag(c,P(`下殼（像盒身）`,`Lower half\n(the box)`),lx,420,BX+BRB-4,(g.yB0+g.yB1)/2+18,C.yellow,1,{w:192});
  tag(c,P(`細胞裝在裡面`,`The cell sits\ninside`),lx,240,BX+50,g.yB0+8,C.green,1,{w:192});
  const ca=clamp(1-gap*2.2);
  if(ca>0){c.save();c.globalAlpha*=ca;
    const x=BX+BR+10;line(c,[[x,g.yB0+bob*0],[x,g.yL1]],C.orange,3);line(c,[[x-6,g.yB0],[x,g.yB0]],C.orange,3);line(c,[[x-6,g.yL1],[x,g.yL1]],C.orange,3);c.restore();}
  tag(c,P(`兩片殼套在一起`,`The halves fit\ntogether`),lx,332,BX+BR+12,(g.yB0+g.yL1)/2,C.orange,ca,{w:192});
  text(c,P(`示意圖：外殼的厚度與比例不是真實比例`,`Schematic: shell thickness and proportions are not real`),480,560,22,C.muted,'center');
  c.restore();
}
function over2pre(c,a,t){
  if(a<=0)return;
  // sunlight falling across the diatoms (behind them)
  c.save();c.globalAlpha*=a;
  for(let i=0;i<4;i++){const sh=.5+.5*Math.sin(t*.7+i*1.4);
    c.beginPath();c.moveTo(770+i*8,70);c.lineTo(10,140+i*120);c.lineTo(10,200+i*120);c.closePath();
    c.fillStyle=rgba(C.yellow,.025+.03*sh);c.fill();}
  c.restore();
}
function over2(c,a,tau,t,poses){
  if(a<=0)return;
  // chloroplasts glow, one diatom after another
  ORDER2.forEach((id,j)=>{const p=poses[id];if(!p||p.a<.05)return;
    const [w]=dims(id,p.w),sc=w/SIZE[F(id)][0],on=fade(tau,.6+j*.25,.5);
    const pul=.5+.5*Math.sin(t*2.4-j*1.05);
    CHL[id].slice(0,4).forEach(([fx,fy,ar])=>{const [x,y]=onPic(p,id,fx,fy),r=Math.sqrt(ar/Math.PI)*sc;
      c.save();c.globalCompositeOperation='lighter';glow(c,x,y,r*1.5+6,GOLD,a*on*p.a*(.18+.32*pul));c.restore();});});
  c.save();c.globalAlpha*=a;
  sun(c,778,62,20,t);text(c,P(`陽光`,`Sunlight`),828,70,22,C.yellow);
  // legend + leaders to two chloroplasts
  const la=fade(tau,1.2,.6);
  if(la>0){c.save();c.globalAlpha*=la;
    circle(c,736,192,9,GOLD,C.white,2);
    textBlock(c,P(`金褐色的葉綠體`,`Golden-brown chloroplasts`),754,200,186,GOLD);
    const p2=poses[2],p9=poses[9];
    [[p2,2,.704,.4],[p9,9,.637,.528]].forEach(([p,id,fx,fy])=>{if(!p)return;const [x,y]=onPic(p,id,fx,fy);
      line(c,[[728,196],[x+8,y]],rgba(GOLD,.95),2);circle(c,x,y,13+2*Math.sin(t*3),null,GOLD,2.5);});
    c.restore();}
  const pa=fade(tau,2,.6);
  if(pa>0){c.save();c.globalAlpha*=pa;textBlock(c,P(`行光合作用，\n自己製造養分`,`Photosynthesis:\nmakes its own food`),748,300,192,C.green);c.restore();}
  // nucleus → eukaryote → protist
  const CH=[P(`有細胞核`,`Has a nucleus`),P(`真核生物`,`A eukaryote`),P(`屬於原生生物`,`A protist`)];
  CH.forEach((p,i)=>{const ca=fade(tau,2.8+i*.45,.5);if(ca<=0)return;c.save();c.globalAlpha*=ca;
    cpill(c,p,833,392+i*68,{color:i===2?C.yellow:C.white,active:i===2,maxX:944,minX:722});
    if(i<2)arrow(c,833,436+i*68,833,458+i*68,C.muted,2.5);c.restore();});
  c.restore();
}
function over3pre(c,a,t){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  // water with a gently moving surface
  const top=64;c.beginPath();c.moveTo(16,top);
  for(let x=16;x<=630;x+=10)c.lineTo(x,top+3*Math.sin(t*1.2+x/45));
  c.lineTo(630,588);c.lineTo(16,588);c.closePath();
  const g=c.createLinearGradient(0,top,0,588);g.addColorStop(0,rgba(WATER,.42));g.addColorStop(1,rgba('#17506f',.3));c.fillStyle=g;c.fill();
  c.beginPath();for(let x=16;x<=630;x+=10){const y=top+3*Math.sin(t*1.2+x/45);x===16?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(C.cyan,.8);c.lineWidth=2.5;c.stroke();
  // light shafts from the surface
  for(let i=0;i<5;i++){const x0=70+i*120+14*Math.sin(t*.5+i),sh=.5+.5*Math.sin(t*.8+i*2);
    c.beginPath();c.moveTo(x0,top+4);c.lineTo(x0+46,top+4);c.lineTo(x0-30,560);c.lineTo(x0-90,560);c.closePath();c.fillStyle=rgba(C.yellow,.03+.03*sh);c.fill();}
  pill(c,P(`水面`,`Water surface`),24,12,{color:C.cyan});
  sun(c,330,30,14,t);pill(c,P(`陽光`,`Sunlight`),362,10,{color:C.yellow});
  c.restore();
}
function over3(c,a,tau,t,poses){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  pill(c,P(`示意，非同比例`,`Schematic, not to scale`),26,540,{color:C.muted});
  const X=797;
  wrap(c,P(`水中食物鏈（示意）`,`Aquatic food chain (schematic)`),X,40,290,24,C.yellow,30,'center');
  const box1=cpill(c,P(`矽藻`,`Diatoms`),X,100,{active:true,color:C.yellow,maxX:944,minX:650});
  const st=pill(c,P(`起點`,`Start`),box1.x+box1.w+8,100,{color:C.orange,size:22,maxX:944});
  textBlock(c,P(`行光合作用，製造養分`,`Photosynthesize and make food`),X,174,290,C.green,{align:'center'});
  // dashed link from the label to one floating diatom
  const p=poses[4];if(p){dashed(c,[[box1.x-6,box1.y+box1.h/2],[p.x+26,p.y]],rgba(C.yellow,.8),2,[6,6],-t*10);circle(c,p.x+26,p.y,4.5,C.yellow,C.ink,1.5);}
  const steps=[[P(`水中的小動物`,`Small water animals`),290],[P(`魚`,`Fish`),420]];
  steps.forEach(([q,y],i)=>{const sa=fade(tau,1+i*.7,.5);if(sa<=0)return;c.save();c.globalAlpha*=sa;
    arrow(c,X,y-(i?84:76),X,y-8,C.white,3.5);cpill(c,q,X,y,{color:C.white,maxX:944,minX:650});c.restore();});
  // a dot travelling down the chain
  const q=mod(t*.4,1),y0=q<.5?214+q*2*64:336+(q-.5)*2*72;
  if(fade(tau,1.7,.5)>0){c.save();c.globalAlpha*=fade(tau,1.7,.5);glow(c,X,y0,14,C.yellow,.6);circle(c,X,y0,5,C.yellow,null);c.restore();}
  c.save();c.globalAlpha*=fade(tau,2.2,.6);
  textBlock(c,P(`箭頭：表示「被吃」`,`Arrow: "is eaten by"`),X,512,290,C.muted,{align:'center'});
  c.restore();
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;if(k!==0)s.diaG=null;
  const {from,u,ov}=track(s,k,t);
  const out=held?1:1-fade(tau,PER-.45,.45);
  const oa=j=>(j===k?out*clamp((t-s.diaT-.5)/.6):0)+(j===from&&from!==k?1-ov:0);
  const poses={};for(let id=1;id<=13;id++)poses[id]=pose(id,from,k,u,t);

  over3pre(c,oa(3),t);
  over2pre(c,oa(2),t);
  // diatoms (step 0: groups emphasised in turn, glassy sheen)
  for(let id=1;id<=13;id++){
    const p=poses[id];if(!p)continue;
    const e0=k===0?mix(1,emphasis(s,tau,id),u):1;
    const sh=k===0||from===0?mod(t*.2+id*.077,1.5):null;
    dia(c,id,p,e0,sh);
  }
  over0(c,s,oa(0),k===0?tau:9,t,held);
  over1(c,oa(1),k===1?tau:2,t);
  over2(c,oa(2),k===2?tau:9,t,poses);
  over3(c,oa(3),k===3?tau:9,t,poses);
}
window.MicroDraw.diatoms=draw;
})();
