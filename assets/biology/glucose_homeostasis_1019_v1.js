/* Blood glucose regulation · teacher-requested V5 remake, 2026-10-19.
 * Same five tabs, hooks, closures, readings and controls as glucose_homeostasis_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations: the food (glucose_ai_1019), the liver,
 * pancreas, islet and adrenal glands (endocrine_ai_1018) and the digestive system (temperature_ai_1018).
 * Glucose, hormones, blood flow and the gauge are drawn here; levels are relative, never diagnostic values.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const mixHex=(a,b,u)=>{const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),ch=s=>Math.round(mix(p>>s&255,q>>s&255,clamp(u)));return `rgb(${ch(16)},${ch(8)},${ch(0)})`;};
const src=(file,name,page,figure)=>({file,name,page,figure});

// ── drawing kit ────────────────────────────────────────────────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
function text(c,p,x,y,size=22,color=C.white,align='left'){c.save();c.font=FONT(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function wrap(c,p,x,y,w,size=22,color=C.white){return D.wrap(c,p,x,y,w,{size,color,line:Math.round(size*1.38)});}
function measure(c,p,size){c.save();c.font=FONT(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function pathLength(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function along(pts,u){const L=pathLength(pts);let d=clamp(u)*L;for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d<=s||i===pts.length-1){const f=s?Math.min(1,d/s):0;return[mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)];}d-=s;}return pts[pts.length-1];}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₂]+(?:['’–-][A-Za-z0-9₂]+)*|\s+|[^A-Za-z0-9₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function node(c,p,x,y,w,h,active,color=C.cyan){
  D.round(c,x,y,w,h,12,active?color:C.panel,active?C.white:C.edge);
  const rows=splitLines(c,D.tr(p),w-20,22),lh=26,y0=y+h/2-(rows.length-1)*lh/2+8;
  rows.forEach((r,i)=>text(c,r,x+w/2,y0+i*lh,22,active?C.deep:C.white,'center'));
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
// A label capsule with an optional leader line to the structure it names.
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,anchor=null,maxX=940,minX=24,hit=null}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  if(anchor){const sx=Math.max(x,Math.min(x+w,anchor[0])),sy=Math.max(y,Math.min(y+h,anchor[1]));const col=active?color:rgba(color,.9);line(c,[[sx,sy],anchor],C.ink,5);line(c,[[sx,sy],anchor],col,2.5);circle(c,anchor[0],anchor[1],5,col,C.ink,1.5);}
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  if(hit)D.hit(x,y,w,h,hit[0],hit[1]);
  return{x,y,w,h};
}
function legendRow(c,items,x,y,size=22){for(const [draw,p] of items){draw(x+10,y-7);text(c,p,x+30,y,size,C.white);x+=measure(c,p,size)+62;}}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
function dashedBox(c,r,color=C.yellow,w=3){c.save();c.strokeStyle=color;c.lineWidth=w;c.setLineDash([8,5]);c.strokeRect(...r);c.restore();}
function lerpRect(a,b,u){return a.map((v,i)=>mix(v,b[i],u));}
// Dashed lines join the small source box to its enlargement, so students see where it came from.
function connectors(c,a,b,alpha=.6){c.save();c.setLineDash([7,6]);const col=rgba(C.yellow,alpha);
  if(b[0]>=a[0]+a[2]-1){line(c,[[a[0]+a[2],a[1]],[b[0],b[1]]],col,2);line(c,[[a[0]+a[2],a[1]+a[3]],[b[0],b[1]+b[3]]],col,2);}
  else{line(c,[[a[0],a[1]+a[3]],[b[0],b[1]]],col,2);line(c,[[a[0]+a[2],a[1]+a[3]],[b[0]+b[2],b[1]]],col,2);}
  c.restore();}
function zoomRect(box,area,maxK=3.4){const [bx,by,bw,bh]=box,[X,Y,W,H]=area,k=Math.min(W/bw,H/bh,maxK);return{k,r:[X+(W-bw*k)/2,Y+(H-bh*k)/2,bw*k,bh*k]};}
// Oxygen-poor blood is dark red, oxygen-rich bright red: never blue.
function rbc(c,x,y,r,ox){const body=mixHex('#7a1f2b','#ef3e46',ox),rim=mixHex('#a3404a','#ff8a8f',ox);ellipse(c,x,y,r,r*.62,body,rim,1.6);ellipse(c,x,y,r*.42,r*.24,mixHex('#5e1520','#c42f39',ox));}
function hexagon(c,x,y,r,fill=C.yellow,a=1,rot=0){c.save();c.globalAlpha=a;c.beginPath();for(let i=0;i<6;i++){const q=rot+i*TAU/6+Math.PI/6;i?c.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r):c.moveTo(x+Math.cos(q)*r,y+Math.sin(q)*r);}c.closePath();c.fillStyle=rgba(fill,.3);c.fill();c.strokeStyle=fill;c.lineWidth=3;c.stroke();c.restore();}
function bolt(c,x,y,s,a=1){c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x+s*.15,y-s);c.lineTo(x-s*.45,y+s*.1);c.lineTo(x-s*.02,y+s*.1);c.lineTo(x-s*.18,y+s);c.lineTo(x+s*.5,y-s*.15);c.lineTo(x+s*.05,y-s*.15);c.closePath();c.fillStyle=C.yellow;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();c.restore();}

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
// Fit a picture in a box; returns where it landed, or null while it loads.
function place(c,path,bx,by,bw,bh,{alpha=1,cover=false,radius=14}={}){
  const im=pic(path);if(!im)return null;const f=cover?Math.max:Math.min,k=f(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();if(cover){c.beginPath();c.roundRect(bx,by,bw,bh,radius);c.clip();}c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();
  return{x,y,k,map:(px,py)=>[x+px*k,y+py*k],rect:([px,py,pw,ph])=>[x+px*k,y+py*k,pw*k,ph*k]};
}
function crop(c,path,box,dst){const im=pic(path);if(!im)return;c.drawImage(im,box[0],box[1],box[2],box[3],...dst);}

const E_DIR='assets/biology/endocrine_ai_1018/',T_DIR='assets/biology/temperature_ai_1018/',G_DIR='assets/biology/glucose_ai_1019/';
// Hormone colours follow the endocrine unit: insulin cyan, glucagon orange; adrenaline pink.
const INS=C.cyan,GLU=C.orange,ADR=C.pink;
function hormone(c,x,y,color,a=1){c.save();c.globalAlpha=a;glow(c,x,y,16,color,.35);circle(c,x,y,7,color,C.ink,2);c.restore();}
// Glycogen: many glucose units joined into one branched store.
const GLY=[[0,0],[1,0],[2,0],[3,0],[1.5,-.87],[2.5,-.87],[3.5,-.87],[.5,.87],[1.5,.87],[2.5,.87],[4,0],[4.5,.87],[3,1.73],[2,1.73],[4.5,-.87],[0,1.73]];
function glycogen(c,x,y,n,r=10,a=1){for(let i=0;i<Math.min(n,GLY.length);i++){const [gx,gy]=GLY[i];hexagon(c,x+gx*r*1.75,y+gy*r*1.75,r,C.yellow,a);}}
function gauge(c,x,y,h,level,{label=P('相對血糖','Relative glucose'),note=null}={}){
  const lw=measure(c,label,22);text(c,label,Math.min(x+28,936-lw/2),y-14,22,C.yellow,'center');
  D.round(c,x,y,56,h,18,C.panel,C.edge);
  const lv=clamp(level),col=lv>.58?C.orange:lv<.42?C.cyan:'#d5bb55';
  D.round(c,x+4,y+h*(1-lv),48,h*lv,14,col);
  D.round(c,x-8,y+h*.42,72,h*.16,6,'rgba(74,222,128,.22)',C.green);
  const bw=measure(c,P('適當','normal'),22)+14;D.round(c,x+28-bw/2,y+h*.5-14,bw,30,10,'rgba(11,26,21,.85)',C.green);text(c,P('適當','normal'),x+28,y+h*.5+8,22,C.green,'center');
  text(c,P('高','high'),x+28,y+30,22,C.muted,'center');text(c,P('低','low'),x+28,y+h-14,22,C.muted,'center');
  if(note)wrap(c,note,x-30,y+h+36,120,22,C.white);
}
function vessel(c,X,Y,W,H,level,t,speed=40){
  c.save();c.beginPath();c.roundRect(X,Y,W,H,H/2);c.fillStyle='#5c2029';c.fill();c.clip();
  for(let i=0;i<5;i++){const x=X+mod(t*speed*.8+i*W/5,W+40)-20;rbc(c,x,Y+H*(i%2?.72:.3),15,.8);}
  const n=Math.round(clamp(level)*18);for(let i=0;i<n;i++){const x=X+mod(i*53+t*speed,W+40)-20,y=Y+H/2+Math.sin(i*2.3)*H*.3;hexagon(c,x,y,9);}
  c.restore();D.round(c,X,Y,W,H,H/2,null,'#d98c93');
}
function cellBlob(c,x,y,rx,ry){ellipse(c,x,y,rx,ry,'#1f4a3d','#9fd8b8',4);c.save();c.translate(x+rx*.15,y);c.rotate(-.15);ellipse(c,0,0,rx*.38,ry*.3,'#7c3a1d',C.orange,3);c.beginPath();for(let i=0;i<=30;i++){const xx=-rx*.32+rx*.64*i/30,yy=Math.sin(i/30*Math.PI*7)*ry*.16*Math.sin(i/30*Math.PI);i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle='#fdba74';c.lineWidth=2.5;c.stroke();c.restore();circle(c,x-rx*.55,y+ry*.2,ry*.24,'#4c3d78','#a78bfa',2);}
function muscle(c,X,Y,W,H,t,flex=0){
  c.save();c.beginPath();c.roundRect(X,Y,W,H,16);c.clip();c.fillStyle='#3a1418';c.fillRect(X,Y,W,H);
  const n=5,fh=(H-20)/n;for(let i=0;i<n;i++){const y=Y+10+i*fh,sq=1-flex*.06*Math.sin(t*6);D.round(c,X+10,y+2,(W-20)*sq,fh-4,fh/2,'#b4434f','#e58b94');
    for(let x=X+24;x<X+W-20;x+=14)line(c,[[x*sq+(X+10)*(1-sq),y+6],[x*sq+(X+10)*(1-sq),y+fh-6]],'rgba(255,220,220,.35)',2);}
  c.restore();D.round(c,X,Y,W,H,16,null,C.edge);
}
function heart(c,x,y,s,beat){c.save();c.translate(x,y);c.scale(s*(1+.12*beat),s*(1+.12*beat));c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-26,-8,-14,-30,0,-16);c.bezierCurveTo(14,-30,26,-8,0,8);c.closePath();c.fillStyle='#ef4444';c.fill();c.strokeStyle=C.ink;c.lineWidth=2/s;c.stroke();c.restore();}
function clock(c,x,y,r,t){circle(c,x,y,r,'#16302a',C.white,4);for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[x+Math.cos(a)*r*.82,y+Math.sin(a)*r*.82],[x+Math.cos(a)*r*.94,y+Math.sin(a)*r*.94]],C.muted,2.5);}
  const a1=-Math.PI/2+t*.6,a2=-Math.PI/2+t*.05;line(c,[[x,y],[x+Math.cos(a1)*r*.72,y+Math.sin(a1)*r*.72]],C.white,3.5);line(c,[[x,y],[x+Math.cos(a2)*r*.48,y+Math.sin(a2)*r*.48]],C.yellow,5);circle(c,x,y,5,C.yellow);}
// A round zoom window that shows a crop of a picture; returns the window.
function zoomCircle(c,path,box,x,y,R){c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.fillStyle='#0f241e';c.fill();c.clip();crop(c,path,box,[x-R,y-R,2*R,2*R]);c.restore();circle(c,x,y,R,null,C.yellow,4);return[x-R,y-R,2*R,2*R];}
function boxToCircle(c,b,x,y,R){c.save();c.setLineDash([7,6]);const col=rgba(C.yellow,.55);line(c,[[b[0],b[1]+b[3]],[x-R*.92,y-R*.38]],col,2);line(c,[[b[0]+b[2],b[1]+b[3]],[x+R*.92,y-R*.38]],col,2);c.restore();}

// ── Tab 1: blood delivers glucose; cells use it ────────────────────────────
const BODY_TORSO=[70,250,300,400],GUT_BOX=[150,425,140,130];
function drawFuel(c,s,t){
  panel(c,20,20,300,560);
  text(c,P('吃進含澱粉的食物','Starchy food'),36,50,22,C.muted);
  place(c,G_DIR+'food_board.png',30,58,280,150);
  arrow(c,170,214,170,238,C.yellow,4);
  text(c,P('消化後在小腸吸收','Absorbed in the gut'),170,262,22,C.muted,'center');
  const BD=[40,272,260,296],bk=Math.min(BD[2]/BODY_TORSO[2],BD[3]/BODY_TORSO[3]),bx=BD[0]+(BD[2]-BODY_TORSO[2]*bk)/2;
  crop(c,T_DIR+'body_digestive.png',BODY_TORSO,[bx,BD[1],BODY_TORSO[2]*bk,BODY_TORSO[3]*bk]);
  const gut=[bx+(GUT_BOX[0]-BODY_TORSO[0])*bk,BD[1]+(GUT_BOX[1]-BODY_TORSO[1])*bk,GUT_BOX[2]*bk,GUT_BOX[3]*bk];
  dashedBox(c,gut);connectors(c,gut,[340,20,600,560],.45);
  // the enlarged path: intestine → blood → cell
  panel(c,340,20,600,560);
  const X0=352,X1=928,WALL=150,CAP=[352,236,576,70];
  c.save();c.beginPath();c.roundRect(340,20,600,560,16);c.clip();
  c.fillStyle='#2e2a1a';c.fillRect(X0-12,20,X1-X0+24,WALL-20);
  for(let i=0;i<3;i++){const cx=430+i*170,cy=70+(i%2)*30;for(let k=0;k<5;k++)hexagon(c,cx+k*16,cy+Math.sin(k)*4,8,C.yellow,.55);}
  c.fillStyle='#d98c93';c.fillRect(X0-12,WALL,X1-X0+24,46);
  for(let i=0;i<12;i++){const vx=X0+10+i*49;c.beginPath();c.moveTo(vx,WALL+4);c.quadraticCurveTo(vx+4,WALL-34,vx+20,WALL-34);c.quadraticCurveTo(vx+36,WALL-34,vx+40,WALL+4);c.closePath();c.fillStyle='#e7a9a4';c.fill();c.strokeStyle='#a3404a';c.lineWidth=2;c.stroke();}
  c.fillStyle='#173a30';c.fillRect(X0-12,WALL+46,X1-X0+24,560);
  c.restore();
  vessel(c,...CAP,.5,t,s.delivery?30:40);
  const CELL=[790,452];cellBlob(c,CELL[0],CELL[1],126,82);
  // glucose units travel: out of the starch, through the wall, along the blood, into the cell
  for(let i=0;i<9;i++){const u=mod(t*.09+i/9),x0=420+(i*67)%380;
    const path=s.delivery?[[x0,96],[x0+6,WALL+20],[x0+20,CAP[1]+CAP[3]/2],[760,CAP[1]+CAP[3]/2],[CELL[0]-10,CELL[1]-20]]:[[x0,96],[x0+6,WALL+20],[x0+20,CAP[1]+CAP[3]/2],[X1+40,CAP[1]+CAP[3]/2]];
    const [x,y]=along(path,u),a=s.delivery&&u>.9?(1-u)/.1:1;hexagon(c,x,y,11,C.yellow,a);}
  if(s.delivery){const ph=mod(t*.9);bolt(c,CELL[0]+30,CELL[1]-6,16+6*Math.sin(ph*TAU),.4+.6*Math.abs(Math.sin(ph*Math.PI)));}
  pill(c,P('澱粉被消化成葡萄糖','Starch is digested into glucose'),360,30,{color:C.yellow,maxX:932});
  pill(c,P('葡萄糖進入血液','Glucose enters the blood'),620,CAP[1]-50,{anchor:[740,CAP[1]+6],color:'#ff8a8f',maxX:932});
  if(s.delivery)pill(c,P('細胞利用葡萄糖，釋出能量','Cells use glucose and release energy'),560,540,{anchor:[CELL[0]-40,CELL[1]+70],color:C.green,maxX:932});
  else pill(c,P('血液把葡萄糖帶到全身','Blood carries glucose everywhere'),560,540,{color:C.white,maxX:932});
  // relative glucose: held in the suitable range
  const gx=372,gy=360,gw=220;text(c,P('血中的葡萄糖','Glucose in blood'),gx,gy-14,22,C.yellow);
  D.round(c,gx,gy,gw,30,12,'#0f241e',C.edge);D.round(c,gx+gw*.42,gy-6,gw*.16,42,6,'rgba(74,222,128,.22)',C.green);
  const mk=gx+gw*(.5+.04*Math.sin(t*1.3));line(c,[[mk,gy-10],[mk,gy+40]],C.yellow,5);
  wrap(c,P('維持在適當範圍：不是越高越好。','Kept in a suitable range; higher is not better.'),gx,gy+70,270,22,C.white);
  legendRow(c,[[(x,y)=>hexagon(c,x,y,9),P('六角形＝葡萄糖','Hexagon = glucose')]],gx,gy+168);
}

// ── Tabs 2–3: the islet sends a signal; liver, muscle or cells respond ─────
const LP={file:E_DIR+'liver_pancreas.png',W:991,H:739},PANC_BOX=[520,330,150,120],ISLET_CROP=[250,115,480,480],LIVER_CROP=[150,50,560,400];
function islands(c,t,color,active){
  const m=place(c,LP.file,30,34,300,224);
  if(m){pill(c,P('肝臟','Liver'),40,40,{anchor:m.map(380,180),color:C.white,maxX:320});pill(c,P('胰臟','Pancreas'),190,232,{anchor:m.map(700,400),color:C.white,maxX:320});}
  const IX=175,IY=418,R=104,win=zoomCircle(c,E_DIR+'islet.png',ISLET_CROP,IX,IY,R);
  if(m){const b=m.rect(PANC_BOX);dashedBox(c,b);boxToCircle(c,b,IX,IY,R);}
  text(c,P('胰島（放大示意）','Islet (enlarged)'),IX,IY+R+34,22,C.yellow,'center');
  if(active)for(let i=0;i<8;i++){const u=mod(t*.5+i/8),a=i/8*TAU,r=mix(20,R-10,u);hormone(c,IX+Math.cos(a)*r,IY+Math.sin(a)*r,color,1-u*.6);}
  return[IX,IY,R];
}
function mealLevel(tt){return tt<1.6?.5+.32*ease(tt/1.6):.5+.32*Math.exp(-(tt-1.6)*.45);}
function fastLevel(tt){return tt<2.5?.5-.28*ease(tt/2.5):.5-.28*Math.exp(-(tt-2.5)*.45);}
function target(c,dest,R,t){
  const [x,y,w,h]=R;panel(c,x,y,w,h,'#0f241e');
  if(dest==='liver'){c.save();c.beginPath();c.roundRect(x,y,w,h,16);c.clip();const k=Math.min((w-20)/LIVER_CROP[2],(h-20)/LIVER_CROP[3]);crop(c,LP.file,LIVER_CROP,[x+(w-LIVER_CROP[2]*k)/2,y+(h-LIVER_CROP[3]*k)/2,LIVER_CROP[2]*k,LIVER_CROP[3]*k]);c.restore();}
  else if(dest==='muscle')muscle(c,x+20,y+30,w-40,h-60,t,0);
  else cellBlob(c,x+w/2,y+h/2,w*.36,h*.36);
  D.round(c,x,y,w,h,16,null,C.edge);
}
const TARGET_NAME={liver:P('肝臟','Liver'),muscle:P('肌肉','Muscle'),cell:P('身體細胞','Body cells')};
function drawRegulate(c,s,t,kind){
  const meal=kind==='meal',dest=meal?s.dest:s.inspect,period=14,tt=mod(t-s.start,period),level=meal?mealLevel(tt):fastLevel(tt);
  const active=meal?level>.54:level<.46,color=meal?INS:GLU,muscleOnly=!meal&&dest==='muscle';
  panel(c,20,20,330,560);
  const [IX,IY,R]=islands(c,t,color,active&&!muscleOnly);
  panel(c,370,20,570,560);
  const TR=[386,36,440,236],V=[386,326,440,84];
  target(c,dest,TR,t);
  text(c,TARGET_NAME[dest],TR[0]+16,TR[1]+34,24,C.yellow);
  // glycogen stored or drawn down
  const done=meal?(tt<1.6?0:1-(level-.5)/.32):(tt<2.5?0:1-(.5-level)/.28);
  if(dest!=='cell'){const n=meal?Math.round(3+11*done):Math.round(14-11*done);glycogen(c,TR[0]+TR[2]-170,TR[1]+TR[3]-70,n,11);
    pill(c,P('肝糖（儲存）','Glycogen (store)'),TR[0]+TR[2]-210,TR[1]+TR[3]-46,{color:C.yellow,maxX:TR[0]+TR[2]-6});}
  vessel(c,...V,muscleOnly?.3:level,t);
  text(c,P('血液','Blood'),V[0]+12,V[1]-12,22,'#ff8a8f');
  // the signal travels from the islet through the blood to the target
  if(active&&!muscleOnly){for(let i=0;i<5;i++){const u=mod(t*.35+i/5),p=along([[IX+R,IY],[V[0]+20,V[1]+V[3]/2],[V[0]+V[2]*.5,V[1]+V[3]/2],[V[0]+V[2]*.5,TR[1]+TR[3]-10]],u);hormone(c,p[0],p[1],color);}}
  // glucose moves between blood and target
  const flux=meal?clamp((level-.5)/.32):clamp((.5-level)/.28);
  if(muscleOnly){for(let i=0;i<4;i++){const u=mod(t*.4+i/4);hexagon(c,TR[0]+TR[2]-170+mix(0,-150,u),TR[1]+TR[3]-80-u*60,10,C.yellow,1-u);}bolt(c,TR[0]+120,TR[1]+110,18,.5+.5*Math.abs(Math.sin(t*3)));}
  else if(flux>.04)for(let i=0;i<4;i++){const u=mod(t*.6+i/4),x=V[0]+V[2]*.72+i*14,y=meal?mix(V[1]+10,TR[1]+TR[3]-30,u):mix(TR[1]+TR[3]-30,V[1]+10,u);hexagon(c,x,y,10,C.yellow,flux);}
  if(meal&&tt<1.6){place(c,G_DIR+'food_board.png',V[0]-6,V[1]+V[3]+14,120,70);arrow(c,V[0]+60,V[1]+V[3]+18,V[0]+60,V[1]+V[3]-4,C.yellow,4);}
  // status
  const msg=muscleOnly?P('肌肉的肝糖分解後留給肌肉自己用，不送進血液','Muscle glycogen is used by the muscle itself, not sent into the blood')
    :meal?(tt<1.6?P('剛吃飽：葡萄糖進入血液，血糖升高','After eating: glucose enters blood; level rises'):active?P('胰島素：促進葡萄糖進入細胞並儲存','Insulin: glucose goes into cells and is stored'):P('回到適當範圍，胰島素分泌減少','Back in range; less insulin is released'))
    :(tt<2.5?P('兩餐之間：細胞持續用掉葡萄糖','Between meals: cells keep using glucose'):active?P('升糖素：促進肝糖分解成葡萄糖，送回血液','Glucagon: glycogen breaks down; glucose returns to blood'):P('回到適當範圍，升糖素分泌減少','Back in range; less glucagon is released'));
  D.round(c,386,434,440,96,14,'rgba(11,26,21,.6)',active&&!muscleOnly?color:C.edge);
  wrap(c,msg,402,468,410,22,C.white);
  legendRow(c,[[(x,y)=>hormone(c,x,y,color),meal?P('胰島素','Insulin'):P('升糖素','Glucagon')],[(x,y)=>hexagon(c,x,y,9),P('葡萄糖','Glucose')]],392,566);
  if(muscleOnly){D.round(c,846,70,80,440,16,'rgba(11,26,21,.4)',C.edge);wrap(c,P('血糖由肝臟補充','Blood glucose comes from the liver'),852,250,70,22,C.muted);}
  else gauge(c,858,70,440,level);
}

// ── Tab 4: adrenaline mobilises fuel ───────────────────────────────────────
const KA={file:E_DIR+'kidneys_adrenals.png'},ADR_BOX=[265,90,160,150],ADR_CROP=[240,70,210,210];
function drawStress(c,s,t){
  const fast=s.demand,rate=fast?2.2:1.1;
  panel(c,20,20,330,560);
  const m=place(c,KA.file,30,34,300,224),IX=175,IY=418,R=104;
  zoomCircle(c,KA.file,ADR_CROP,IX,IY,R);
  if(m){const b=m.rect(ADR_BOX);dashedBox(c,b);boxToCircle(c,b,IX,IY,R);pill(c,P('腎臟','Kidney'),200,232,{anchor:m.map(760,420),color:C.white,maxX:320});}
  text(c,P('腎上腺（放大）','Adrenal gland (enlarged)'),IX,IY+R+34,22,C.yellow,'center');
  const nA=fast?10:3;for(let i=0;i<nA;i++){const u=mod(t*.5+i/nA),a=i/nA*TAU,r=mix(20,R-10,u);hormone(c,IX+Math.cos(a)*r,IY+Math.sin(a)*r,ADR,1-u*.6);}
  panel(c,370,20,570,560);
  const TR=[386,36,330,220],V=[386,300,538,80],M=[640,426,284,134];
  target(c,'liver',TR,t);text(c,P('肝臟','Liver'),TR[0]+16,TR[1]+34,24,C.yellow);
  glycogen(c,TR[0]+TR[2]-150,TR[1]+TR[3]-62,fast?8:12,10);
  // heart rate
  const beat=Math.max(0,Math.sin(t*rate*TAU))**6;heart(c,822,118,2.2,beat);
  text(c,P('心跳','Heartbeat'),822,196,22,C.muted,'center');text(c,fast?P('加快','faster'):P('一般','usual'),822,226,24,fast?C.pink:C.white,'center');
  vessel(c,...V,fast?.7:.5,t,fast?90:35);
  for(let i=0;i<5;i++){const u=mod(t*.35+i/5),p=along([[IX+R,IY],[V[0]+20,V[1]+V[3]/2],[V[0]+100,V[1]+V[3]/2],[V[0]+100,TR[1]+TR[3]-10]],u);if(fast||i<2)hormone(c,p[0],p[1],ADR);}
  const nG=fast?6:2;for(let i=0;i<nG;i++){const u=mod(t*(fast?.7:.3)+i/nG),p=along([[TR[0]+220,TR[1]+TR[3]-20],[TR[0]+220,V[1]+V[3]/2],[M[0]+60,V[1]+V[3]/2],[M[0]+90,M[1]+40]],u);hexagon(c,p[0],p[1],10);}
  muscle(c,...M,t,fast?1:0);text(c,P('肌肉利用葡萄糖','Muscles use glucose'),M[0]+M[2]/2,M[1]-10,22,C.green,'center');
  if(fast)bolt(c,M[0]+M[2]-40,M[1]+40,18,.5+.5*Math.abs(Math.sin(t*5)));
  D.round(c,386,400,236,140,14,'rgba(11,26,21,.6)',fast?ADR:C.edge);
  wrap(c,fast?P('緊急或運動時：腎上腺素讓肝臟釋出更多葡萄糖。','Emergency: adrenaline makes the liver release more glucose.'):P('平常：葡萄糖穩定供應，細胞仍在用。','Usually: steady supply; cells still use it.'),402,436,212,22,C.white);
  legendRow(c,[[(x,y)=>hormone(c,x,y,ADR),P('腎上腺素','Adrenaline')],[(x,y)=>hexagon(c,x,y,9),P('葡萄糖','Glucose')]],392,568);
}

// ── Tab 5: one goal, two opposite responses ────────────────────────────────
function drawBalance(c,s,t){
  const high=s.condition==='high',correct=s.answer?(high?s.answer==='store':s.answer==='release'):null,tt=s.answer?Math.max(0,t-s.answerAt):0;
  const start=high?.82:.18,level=s.answer===''?start+.015*Math.sin(t*3):correct?mix(start,.5,ease(tt/2.6)):mix(start,high?.96:.04,ease(tt/2.6));
  panel(c,20,20,920,560);
  // two situations
  for(const [cond,x] of [['high',36],['low',600]]){const on=s.condition===cond;D.round(c,x,36,324,200,16,on?'rgba(253,224,71,.12)':'rgba(11,26,21,.5)',on?C.yellow:C.edge);D.hit(x,36,324,200,'condition',cond);
    if(cond==='high'){place(c,G_DIR+'food_board.png',x+12,48,300,140,{alpha:on?1:.5});text(c,P('剛吃飽：血糖偏高','Just ate: glucose high'),x+162,222,22,on?C.yellow:C.muted,'center');}
    else{clock(c,x+162,118,64,t);text(c,P('兩餐之間：血糖偏低','Between meals: glucose low'),x+162,222,22,on?C.yellow:C.muted,'center');}}
  gauge(c,452,70,430,level);
  // the response
  const IX=150,IY=420,R=82;
  if(!s.answer){D.round(c,40,290,360,250,16,'rgba(11,26,21,.5)',C.edge);text(c,'?',220,400,72,C.yellow,'center');wrap(c,P('先預測：要把血糖降下來，還是補上去？','Predict: lower the glucose, or raise it?'),60,460,320,22,C.white);
    D.round(c,580,290,344,250,16,'rgba(11,26,21,.5)',C.edge);wrap(c,P('在上方選擇你的預測。','Choose your prediction above.'),600,410,300,22,C.muted);return;}
  const hormoneC=s.answer==='store'?INS:GLU;
  zoomCircle(c,E_DIR+'islet.png',ISLET_CROP,IX,IY,R);text(c,P('胰島','Islet'),IX,IY+R+32,22,C.yellow,'center');
  const LR=[600,300,324,230];target(c,'liver',LR,t);text(c,P('肝臟','Liver'),LR[0]+16,LR[1]+32,24,C.yellow);
  glycogen(c,LR[0]+LR[2]-150,LR[1]+LR[3]-60,s.answer==='store'?Math.round(4+9*ease(tt/2.6)):Math.round(13-9*ease(tt/2.6)),10);
  for(let i=0;i<5;i++){const u=mod(t*.4+i/5),p=along([[IX+R,IY],[440,560-40],[540,520],[LR[0]+30,LR[1]+LR[3]-30]],u);hormone(c,p[0],p[1],hormoneC);}
  for(let i=0;i<3;i++){const u=mod(t*.6+i/3),y=s.answer==='store'?mix(260,LR[1]+40,u):mix(LR[1]+40,260,u);hexagon(c,LR[0]+60+i*40,y,10);}
  pill(c,s.answer==='store'?P('胰島素：利用與儲存','Insulin: use and store'):P('升糖素：肝臟釋出葡萄糖','Glucagon: liver releases glucose'),250,300,{active:true,color:hormoneC,maxX:440});
  pill(c,correct?P('方向正確：回到適當範圍','Right direction: back in range'):P('方向相反：離適當範圍更遠','Wrong way: further from the range'),40,250,{active:true,color:correct?C.green:C.orange,maxX:440});
}

const tabs=[
{id:'fuel',title:P('細胞需要燃料','Cells need fuel'),sub:P('葡萄糖與能量','Glucose and energy'),hook:P('早餐吃進去了，為什麼還需要血液把養分送到全身？','Why must blood deliver the nutrients from breakfast?'),body:P('葡萄糖是細胞可利用的養分。左邊從食物到小腸，右邊放大看葡萄糖進入血液、送到細胞，細胞利用養分釋出能量。','Glucose is a nutrient used by cells. The left side goes from food to the small intestine; the enlargement shows glucose entering blood and reaching cells, which release energy from it.'),closure:P('葡萄糖是養分，不是能量本身；能量在細胞利用養分時釋出。','Glucose is a nutrient, not energy itself; cells release energy when they use nutrients.'),sources:[],init:()=>({running:true,delivery:true}),controls:()=>[choice(P('觀察','Observe'),'delivery',[[true,P('送進細胞','Deliver to cells')],[false,P('看血中養分','Inspect blood')]])],explain:s=>({title:P('養分先運到，再由細胞利用','Deliver nutrients, then use them'),text:s.delivery?P('六角形代表放大的葡萄糖辨識符號；它由血液到達細胞。細胞呼吸的完整原料與產物，請和呼吸單元對照。','Hexagons are enlarged glucose symbols, delivered from blood to cells. Compare the respiratory lesson for all reactants and products.'):P('血液中的葡萄糖濃度需要維持適當範圍；不是把所有葡萄糖一次送完，也不是血糖越高越好。','Blood glucose must stay within a suitable range. It is neither emptied in one delivery nor better when always higher.')}),draw:drawFuel},
{id:'meal',title:P('吃完，不會一直升高','After a meal, not endless rise'),sub:P('胰島素與儲存','Insulin and storage'),hook:P('餐後葡萄糖進入血液，身體要怎麼把這一批養分用好、收好？','How does the body use and store glucose after a meal?'),body:P('血糖偏高時，胰島分泌胰島素，促進細胞攝取葡萄糖，也促進肝臟與肌肉把葡萄糖合成肝糖儲存。看右邊的血糖計怎麼回到適當範圍。','When blood glucose is high, the islets release insulin, which promotes glucose uptake and glycogen storage in liver and muscle. Watch the gauge return to the suitable range.'),closure:P('胰島素促進利用與儲存，使偏高的血糖回到適當範圍。','Insulin promotes use and storage, bringing high glucose toward its suitable range.'),reading:P('動畫把回應時間壓縮，只用相對高低，不提供診斷用的血糖數值。肝臟與肌肉都能儲存肝糖，但調節血糖時兩者的任務並不相同。','This time-compressed model uses relative levels, not diagnostic glucose values. Liver and muscle both store glycogen, but their roles in blood-glucose control differ.'),sources:[],init:()=>({running:true,dest:'liver',start:0}),controls:()=>[choice(P('葡萄糖去哪裡','Destination'),'dest',[['liver',P('肝臟儲存','Liver storage')],['muscle',P('肌肉儲存','Muscle storage')],['cell',P('細胞利用','Cell use')]]),{label:P('重播','Replay'),items:[{label:P('再吃一餐','Eat again'),key:'replay',value:true}]}],act(s,k,v){if(k!=='replay')s[k]=v;s.start=s.elapsed;},explain:s=>({title:P('胰島素：促進攝取與儲存','Insulin promotes uptake and storage'),text:s.dest==='cell'?P('許多細胞增加攝取並利用葡萄糖。不是胰島素變成葡萄糖，也不是胰島素自己把能量送到細胞。','Many cells increase glucose uptake and use. Insulin does not become glucose or deliver energy as a substance.'):s.dest==='muscle'?P('肌肉把葡萄糖合成肝糖，供肌肉自己日後利用。肌肉儲存的肝糖不直接當成升糖素釋回血糖的來源。','Muscle stores glycogen for its own later use. Muscle glycogen is not a direct blood-glucose source released by glucagon.'):P('肝臟把葡萄糖合成肝糖儲存，血液中的葡萄糖因此減少。連在一起的六角形表示儲存型態，不畫化學鍵線。','Liver stores glucose as glycogen, reducing glucose in blood. Joined hexagons identify storage without chemical-bond diagrams.')}),draw:(c,s,t)=>drawRegulate(c,s,t,'meal')},
{id:'fasting',title:P('沒吃飯，誰來補？','Who supplies between meals?'),sub:P('升糖素與肝臟','Glucagon and liver'),hook:P('兩餐之間腸道沒有一直送新養分，血糖為什麼不會馬上降到零？','Why does blood glucose not fall to zero between meals?'),body:P('血糖偏低時，胰島分泌升糖素，促進肝臟把儲存的肝糖分解為葡萄糖，釋入血液。','When blood glucose is low, the islets release glucagon, which promotes liver-glycogen breakdown and glucose release into blood.'),closure:P('升糖素調節血糖的主要儲存來源是肝臟；肌肉的肝糖主要留給肌肉自己用。','Liver glycogen supplies blood glucose in this glucagon response; muscle glycogen serves the muscle itself.'),sources:[],init:()=>({running:true,inspect:'liver',start:0}),controls:()=>[choice(P('比較儲存場所','Compare stores'),'inspect',[['liver',P('肝臟補血糖','Liver supplies blood')],['muscle',P('肌肉自己用','Muscle uses its store')]]),{label:P('重播','Replay'),items:[{label:P('重新開始','Start again'),key:'replay',value:true}]}],act(s,k,v){if(k!=='replay')s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.inspect==='liver'?P('肝糖分解，葡萄糖進入血液','Liver glycogen supplies blood glucose'):P('肌肉肝糖不是直接補血糖的來源','Muscle glycogen does not directly supply blood glucose'),text:s.inspect==='liver'?P('看葡萄糖從肝臟到血液，方向和餐後儲存相反；供應增加可讓偏低血糖回到適當範圍。','Glucose moves from liver to blood, opposite the storage direction. This supply brings low glucose toward the suitable range.'):P('比較圖讓葡萄糖留在肌肉內利用，不畫肌肉把肝糖直接送到血液。肝糖是葡萄糖的聚合儲存型態。','In this comparison, glucose remains for muscle use; muscle glycogen is not sent directly into blood. Glycogen is a glucose polymer.')}),draw:(c,s,t)=>drawRegulate(c,s,t,'fast')},
{id:'stress',title:P('緊急時快速動員','Mobilize in an emergency'),sub:P('腎上腺素與能量需求','Adrenaline and demand'),hook:P('突然需要跑起來，身體除了加快心跳，還會怎樣動員燃料？','When you suddenly need to run, how does the body mobilize fuel?'),body:P('腎上腺素可在運動或緊急情境中促進肝糖分解；肝臟釋出的葡萄糖可供組織利用。切換情境比較心跳與葡萄糖的供應。','During exercise or emergencies, adrenaline can promote glycogen breakdown; liver glucose can supply tissues. Switch situations to compare heartbeat and glucose supply.'),closure:P('血糖調節不是只看胰島素；升糖素與腎上腺素等訊息也會依情境參與。','Glucose regulation involves insulin, glucagon and other context-dependent signals such as adrenaline.'),sources:[],init:()=>({running:true,demand:true}),controls:()=>[choice(P('情境','Situation'),'demand',[[false,P('一般情境','Usual conditions')],[true,P('需求增加','Demand increases')]])],explain:s=>({title:s.demand?P('動員燃料，供應組織','Mobilize fuel for tissues'):P('維持適當供應','Maintain suitable supply'),text:s.demand?P('模型加快肝臟到組織的葡萄糖供應，用來比較需求變化；不代表腎上腺素永遠越多越好，也不模擬個人的血糖。','The model increases liver-to-tissue supply to compare demand. It does not imply more adrenaline is always better or predict personal glucose levels.'):P('即使休息，細胞仍需要能量；維持生命活動不是把燃料供應全部關掉。','Cells still require energy at rest; fuel supply does not switch off completely.')}),draw:drawStress},
{id:'balance',title:P('讓偏高、偏低都回來','Bring both extremes back'),sub:P('整合血糖調節','Integrated glucose control'),hook:P('同樣要維持血糖，吃飽和空腹時的回應方向，應該一樣嗎？','Should the response after a meal match the response between meals?'),body:P('選情境，再預測主要調節方向。按答案看血糖計往哪裡走；圖中的適當範圍不是醫療判讀刻度。','Choose a situation and predict the main response. Select an answer and watch the gauge; the range is not a diagnostic scale.'),closure:P('偏高促進利用與儲存；偏低促進肝臟供應葡萄糖。方向相反，目的都是維持恆定。','High glucose promotes use and storage; low glucose promotes liver supply. Opposite responses serve homeostasis.'),sources:[],init:()=>({running:true,condition:'high',answer:'',answerAt:0}),act(s,k,v){s[k]=v;if(k==='condition')s.answer='';if(k==='answer')s.answerAt=s.elapsed;},controls:()=>[choice(P('情境','Situation'),'condition',[['high',P('血糖偏高','High glucose')],['low',P('血糖偏低','Low glucose')]]),choice(P('預測主要回應','Predict'),'answer',[['store',P('促進利用與儲存','Use and store')],['release',P('肝臟釋出葡萄糖','Liver releases glucose')]])],explain:s=>({title:!s.answer?P('先預測，再看解說','Predict before feedback'):(s.condition==='high'?s.answer==='store':s.answer==='release')?P('方向正確','Correct direction'):P('再想想回應的方向','Reconsider the direction'),text:!s.answer?P('選下面的回應：目前需要把血中葡萄糖降低，還是增加供應？','Select a response: should blood glucose be reduced, or should supply increase?'):s.condition==='high'?P('偏高時以胰島素促進細胞攝取和儲存，使血糖下降回適當範圍。','For high glucose, insulin promotes uptake and storage, returning glucose toward the range.'):P('偏低時，升糖素促進肝臟分解肝糖並釋出葡萄糖，增加血液供應。','For low glucose, glucagon promotes liver-glycogen breakdown and glucose release into blood.')}),draw:drawBalance}
];
B.register({id:'glucose_homeostasis',title:P('血糖調節：燃料如何供應？','Blood glucose: how is fuel supplied?'),subtitle:P('葡萄糖從哪裡來、往哪裡去，胰島素、升糖素與腎上腺素怎麼調節','Where glucose comes from and goes, and how insulin, glucagon and adrenaline regulate it'),cover:'assets/covers/biology_glucose_1009_v1.jpg',tabs});
})();
