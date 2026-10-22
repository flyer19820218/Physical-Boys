/* Microorganisms · "Kelp" canvas (algae tab, view 1), 2026-10-22.
 * kelp.png (the teacher's Gemini AI illustration MB7, 365×1358, upright) stands in a sea-water column on the left,
 * holdfast on a rock, and sways: it is drawn in 2 px canvas rows, each shifted by a wave that grows toward the tip,
 * so the holdfast stays put. The right side changes with the step:
 *  0 a magnified, drawn cross-section of the blade (schematic): many cells, each with a nucleus and golden-brown chloroplasts;
 *  1 the lower part of the same picture enlarged (blade base, stalk, holdfast) with labels; the stalk label is a bracket on
 *    the thin part only. The oval swelling at the top of the stalk is NOT labelled (Gemini drew it; real Saccharina kelp
 *    has no air bladder, see sources.md);
 *  2 the same cross-section with water and nutrients (cyan dots) passing straight into the surface cells, sunlight,
 *    and the same cyan dots converging on the whole body of the kelp on the left;
 *  3 a schematic size bar (each step ×10) from Paramecium (about 0.2 mm) to kelp (up to several metres), clearly marked
 *    "schematic, not to scale"; the pictures are not drawn to one scale, and the conclusion card.
 * Picture coordinates (stalk, holdfast, edges) were measured from the PNG alpha (row extents).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,wrap,splitLines,pill,cpill,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,drawIn,TAU,MONO}=K;
const N=4,PER=7;
const KF='kelp.png',[KW,KH]=SIZE[KF];
const KELP='#b8955a',ROCK='#6f6a5f',WATER='#2a7fa6';
// body edges [image y, left x, right x] (alpha > 128), for the absorption dots
const EDGE=[[60,209,318],[150,112,238],[240,77,190],[330,87,231],[420,135,310],[510,212,350],[600,221,352],[690,164,325],[780,107,286],[870,107,248],[960,144,193],[1080,161,179]];

// ── kelp drawing with a sway ───────────────────────────────────────────────
const sway=(iy,t)=>{const q=(KH-iy)/KH;return 15*q*q*Math.sin(t*1.15-iy/230);};
const kp=(L,ix,iy,t)=>[L.ox+(ix+sway(iy,t))*L.sc,L.oy+iy*L.sc];
function kelp(c,L,t,a,clip=null){
  if(a<=0)return;const im=pic(AI+KF);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,L.ox,L.oy,KW*L.sc,KH*L.sc,10,null,rgba(C.muted,.4));c.restore();return;}
  c.save();c.globalAlpha*=a;
  if(clip){c.beginPath();c.roundRect(...clip,14);c.clip();}
  const y0=Math.max(Math.ceil(L.oy),clip?Math.floor(clip[1]):0),y1=Math.min(Math.floor(L.oy+KH*L.sc),clip?Math.ceil(clip[1]+clip[3]):600);
  for(let y=y0;y<y1;y+=2){
    const iy=(y-L.oy)/L.sc,ih=Math.min(2/L.sc,KH-iy);if(ih<=0)break;
    c.drawImage(im,0,iy,KW,ih,L.ox+sway(iy+ih/2,t)*L.sc,y,KW*L.sc,Math.min(2,ih*L.sc));
  }
  c.restore();
}
// layouts of the whole kelp
const SC0=560/KH,LK=[{ox:140-KW/2*SC0,oy:20,sc:SC0},null,null,{ox:868-KW/2*.226,oy:22,sc:.226}];LK[1]=LK[0];LK[2]=LK[0];
// the enlarged lower part (step 1)
const IN={ox:445-KW/2*.85,oy:20-700*.85,sc:.85},INBOX=[286,12,318,576];

function track(s,k,t){
  if(s.kelK===undefined){s.kelK=k;s.kelFrom=k;s.kelT=t-9;}
  if(s.kelK!==k){s.kelFrom=s.kelK;s.kelK=k;s.kelT=t;}
  if(t<s.kelT)s.kelT=t;
  return{from:s.kelFrom,u:smooth((t-s.kelT)/1.1),ov:smooth((t-s.kelT)/.5)};
}

// ── small helpers ──────────────────────────────────────────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>splitLines(c,sg,w,size));
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function tag(c,p,x,y,tx,ty,col,a,{w=180,lh=29,bold=false}={}){
  if(a<=0)return;const rows=rowsOf(c,p,w);
  c.save();c.globalAlpha*=a;line(c,[[x-8,y-8],[tx,ty]],rgba(col,.9),bold?3:2);circle(c,tx,ty,bold?6:4.5,col,C.ink,1.5);
  rows.forEach((r,i)=>text(c,r,x,y+i*lh,22,col));c.restore();
}
function sun(c,x,y,r,t){
  glow(c,x,y,r*2.6,C.yellow,.35);
  for(let i=0;i<10;i++){const a=i*TAU/10+t*.25,r1=r+5,r2=r+12+3*Math.sin(t*2+i);
    line(c,[[x+r1*Math.cos(a),y+r1*Math.sin(a)],[x+r2*Math.cos(a),y+r2*Math.sin(a)]],C.yellow,3);}
  circle(c,x,y,r,C.yellow,null);
}
function seaPanel(c,a,x,y,w,h){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,rgba(WATER,.30));g.addColorStop(1,rgba('#17506f',.42));
  D.round(c,x,y,w,h,16,g,rgba(C.cyan,.35));c.restore();
}
function rock(c,x,y,rx,ry,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const g=c.createLinearGradient(0,y-ry,0,y+ry);g.addColorStop(0,'#8a8477');g.addColorStop(1,'#4d4a43');
  c.beginPath();c.moveTo(x-rx,y+ry);c.bezierCurveTo(x-rx*.9,y-ry*.6,x-rx*.4,y-ry,x,y-ry*.95);c.bezierCurveTo(x+rx*.5,y-ry*.9,x+rx*.95,y-ry*.4,x+rx,y+ry);c.closePath();
  c.fillStyle=g;c.fill();c.strokeStyle='#a39d8f';c.lineWidth=2;c.stroke();c.restore();
}

// ── magnified cross-section of the blade (schematic, steps 0 and 2) ────────
const M={x:600,y:248,r:160},SRC=[225,430];
const ROWS=[{y:-62,h:26,w:30,outer:true},{y:-36,h:36,w:54},{y:0,h:36,w:54},{y:36,h:26,w:30,outer:true}];
const CELLS=[];
(()=>{const R=K.rng(7);ROWS.forEach((rw,ri)=>{const off=ri%2?rw.w/2:0;for(let x=-M.r-60+off;x<M.r+60;x+=rw.w){
  const ch=[];const n=rw.outer?3:1;for(let j=0;j<n;j++)ch.push([(.18+.64*R())*rw.w,(.25+.5*R())*rw.h,R()*Math.PI]);
  CELLS.push({x,y:rw.y,w:rw.w,h:rw.h,outer:!!rw.outer,nuc:[(.3+.4*R())*rw.w,(.35+.3*R())*rw.h],ch,top:ri===0});}});})();
const wave=(x,t)=>4*Math.sin(t*1.1+x/80);
function findCell(fx,fy,outer){let best=null,bd=1e9;CELLS.forEach(cl=>{if(!!cl.outer!==outer)return;const d=Math.hypot(cl.x+cl.w/2-fx,cl.y+cl.h/2-fy);if(d<bd){bd=d;best=cl;}});return best;}
const C_CELL=findCell(10,18,false),C_NUC=findCell(-80,-18,false),C_CHL=findCell(30,-49,true),C_SURF=findCell(70,-49,true);
const cellXY=(cl,dx,dy,t)=>[M.x+cl.x+dx,M.y+cl.y+dy+wave(cl.x+cl.w/2,t)];
function section(c,t,a,{dots=0,beams=0,hl=0}={}){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  c.beginPath();c.arc(M.x,M.y,M.r,0,TAU);c.save();c.clip();
  const g=c.createLinearGradient(0,M.y-M.r,0,M.y+M.r);g.addColorStop(0,'#1d5a6e');g.addColorStop(1,'#163f52');c.fillStyle=g;c.fillRect(M.x-M.r,M.y-M.r,M.r*2,M.r*2);
  // sunlight beams
  if(beams>0){for(let i=0;i<4;i++){const sh=.5+.5*Math.sin(t*.9+i*1.7),x0=M.x+40+i*46;
    c.beginPath();c.moveTo(x0+90,M.y-M.r);c.lineTo(x0+130,M.y-M.r);c.lineTo(x0-80,M.y+M.r);c.lineTo(x0-120,M.y+M.r);c.closePath();c.fillStyle=rgba(C.yellow,(.05+.06*sh)*beams);c.fill();}}
  // cells
  CELLS.forEach(cl=>{const dy=wave(cl.x+cl.w/2,t),x=M.x+cl.x+1,y=M.y+cl.y+1+dy;
    D.round(c,x,y,cl.w-2,cl.h-2,7,cl.outer?'rgba(188,160,92,.95)':'rgba(214,196,142,.88)',null);
    c.beginPath();c.roundRect(x,y,cl.w-2,cl.h-2,7);c.strokeStyle='#efe3bd';c.lineWidth=2;c.stroke();
    cl.ch.forEach(([cx,cy,r])=>ellipse(c,x+cx,y+cy,cl.outer?5.5:4.5,3.2,r,'#9a6a1c','#5c3d0c',1));
    circle(c,x+cl.nuc[0],y+cl.nuc[1],cl.outer?4.2:5.5,'#7d4f7a','#f2ecd9',1.3);});
  // water and nutrients entering through both surfaces
  if(dots>0){for(let i=0;i<16;i++){const top=i%2===0,x=M.x-M.r+18+((i*47)%(M.r*2-36)),p=mod(t*.32+i*.173,1);
      const ys=top?M.y-M.r:M.y+M.r,ye=(top?M.y-62:M.y+62)+wave(x-M.x,t)+(top?12:-12),y=mix(ys,ye,p);
      const al=dots*(p<.15?p/.15:p>.8?(1-p)/.2:1);glow(c,x,y,10,C.cyan,.5*al);circle(c,x,y,4,rgba(C.cyan,al),null);}}
  c.restore();
  // highlight ring on one cell (step 0)
  if(hl>0){const [x,y]=cellXY(C_CELL,1,1,t);c.save();c.globalAlpha*=hl*(.6+.4*Math.sin(t*3));c.beginPath();c.roundRect(x-2,y-2,C_CELL.w+2,C_CELL.h+2,8);c.strokeStyle=C.yellow;c.lineWidth=3;c.stroke();c.restore();}
  circle(c,M.x,M.y,M.r,null,C.white,3);
  c.restore();
}
function connector(c,L,t,a){
  if(a<=0)return;const [sx,sy]=kp(L,...SRC,t),r=14;
  c.save();c.globalAlpha*=a;circle(c,sx,sy,r,null,C.white,2.5);
  const A=[M.x+M.r*Math.cos(Math.PI*1.22),M.y+M.r*Math.sin(Math.PI*1.22)],B=[M.x+M.r*Math.cos(Math.PI*.78),M.y+M.r*Math.sin(Math.PI*.78)];
  dashed(c,[[sx+r*.5,sy-r*.85],A],rgba(C.white,.7),2);dashed(c,[[sx+r*.5,sy+r*.85],B],rgba(C.white,.7),2);c.restore();
}

// ── step overlays ──────────────────────────────────────────────────────────
function over0(c,a,tau,t,L){
  if(a<=0)return;
  connector(c,L,t,a);section(c,t,a,{hl:fade(tau,1,.5)});
  c.save();c.globalAlpha*=a;
  cpill(c,P(`葉片的切面放大（示意）`,`Blade cross-section, magnified (schematic)`),M.x,28,{color:C.white,minX:300,maxX:944});
  text(c,P(`海水`,`Sea water`),M.x,M.y-110,22,C.cyan,'center');
  const lx=790;
  tag(c,P(`細胞`,`Cell`),lx,170,...cellXY(C_CELL,C_CELL.w-4,C_CELL.h/2,t),C.yellow,fade(tau,1,.5),{w:150});
  tag(c,P(`細胞核`,`Nucleus`),lx,258,...cellXY(C_NUC,C_NUC.nuc[0]+1,C_NUC.nuc[1]+1,t),C.pink,fade(tau,1.5,.5),{w:150});
  tag(c,P(`葉綠體`,`Chloroplast`),lx,346,...cellXY(C_CHL,C_CHL.ch[0][0]+1,C_CHL.ch[0][1]+1,t),GOLDLAB,fade(tau,2,.5),{w:150});
  const B=[[P(`多細胞：由很多細胞組成`,`Multicellular: made of many cells`),C.yellow,true],[P(`可以長到好幾公尺`,`Can grow several metres long`),C.green,false],[P(`長在海裡的岩石上`,`Grows on rocks in the sea`),C.white,false]];
  B.forEach(([p,col,act],i)=>{const ba=fade(tau,2.5+i*.4,.5);if(ba<=0)return;c.save();c.globalAlpha*=ba;cpill(c,p,M.x,436+i*54,{color:col,active:act,minX:300,maxX:944});c.restore();});
  c.restore();
}
const GOLDLAB='#e0b456';
// step 1: labelled enlarged lower part
const PARTS=[
 {p:P(`葉片狀的藻體`,`Leaf-like blade`),col:C.green,ly:96,tgt:[232,790]},
 {p:P(`柄`,`Stalk`),col:C.cyan,ly:366,tgt:[184,1095],bracket:[1006,1184]},
 {p:P(`固著器`,`Holdfast`),col:C.orange,ly:442,tgt:[250,1262],note:P(`像根，但只負責把海帶固定在岩石上，不是維管束植物的根`,`Looks like a root, but it only fastens the kelp to a rock; it is not the root of a vascular plant`)}];
function over1(c,s,a,tau,t,L){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  seaPanel(c,1,...INBOX);
  rock(c,445,606,170,46,1);
  kelp(c,IN,t,1,INBOX);
  c.save();c.setLineDash([6,5]);
  const [fx0,fy0]=kp(L,40,700,t),[fx1,fy1]=kp(L,320,KH,t);
  D.round(c,L.ox+30*L.sc,fy0,290*L.sc,fy1-fy0+2,6,null,rgba(C.yellow,.85));
  line(c,[[L.ox+320*L.sc,fy0],[INBOX[0],INBOX[1]+2]],rgba(C.yellow,.6),2);line(c,[[L.ox+320*L.sc,fy1],[INBOX[0],INBOX[1]+INBOX[3]-2]],rgba(C.yellow,.6),2);
  c.restore();
  pill(c,P(`放大`,`Enlarged`),INBOX[0]+10,INBOX[1]+10,{color:C.yellow});
  pill(c,P(`岩石`,`Rock`),INBOX[0]+INBOX[2]-10-(measure(c,P(`岩石`,`Rock`),22)+28),INBOX[1]+INBOX[3]-50,{color:C.white});
  // which part glows: the clicked one, or each in turn
  const cyc=Math.floor(Math.max(0,tau-2.4)/1.8)%3,sel=s.kelPart!=null?s.kelPart:(tau>2.4?cyc:-1);
  const lx=626;
  PARTS.forEach((pt,i)=>{
    const la=fade(tau,.6+i*.55,.5);if(la<=0)return;
    const [tx,ty]=kp(IN,...pt.tgt,t),on=sel===i;
    c.save();c.globalAlpha*=la;
    if(on)glow(c,tx,ty,46,pt.col,.45+.15*Math.sin(t*4));
    if(pt.bracket){const [bx0,by0]=kp(IN,206,pt.bracket[0],t),[,by1]=kp(IN,206,pt.bracket[1],t),bx=bx0+6;
      line(c,[[bx-8,by0],[bx,by0],[bx,by1],[bx-8,by1]],pt.col,3);
      line(c,[[lx-8,pt.ly-8],[bx,(by0+by1)/2]],rgba(pt.col,.9),on?3:2);circle(c,bx,(by0+by1)/2,on?6:4.5,pt.col,C.ink,1.5);
      text(c,pt.p,lx,pt.ly,22,pt.col);}
    else tag(c,pt.p,lx,pt.ly,tx,ty,pt.col,1,{w:300,bold:on});
    if(pt.note){const na=fade(tau,2,.5);c.save();c.globalAlpha*=na;textBlock(c,pt.note,lx,pt.ly+34,310,C.white,{lh:28});c.restore();}
    c.restore();
    const w=measure(c,pt.p,22)+20;D.hit(lx-10,pt.ly-26,w,36,'kelPart',i);
  });
  c.restore();
}
function absorbDots(c,L,t,a){
  if(a<=0)return;
  EDGE.forEach(([iy,xl,xr],i)=>{[[xl,-1],[xr,1]].forEach(([ix,sd],j)=>{
    const p=mod(t*.45+i*.29+j*.5,1),[ex,ey]=kp(L,ix-sd*4,iy,t),x=mix(ex+sd*36,ex,p),al=a*(p<.15?p/.15:p>.8?(1-p)/.2:1);
    glow(c,x,ey,9,C.cyan,.5*al);circle(c,x,ey,3.6,rgba(C.cyan,al),null);});});
}
function over2(c,a,tau,t,L){
  if(a<=0)return;
  connector(c,L,t,a);section(c,t,a,{dots:fade(tau,.6,.6),beams:fade(tau,1.2,.6)});
  absorbDots(c,L,t,a*fade(tau,.6,.6));
  c.save();c.globalAlpha*=a;
  cpill(c,P(`葉片的切面放大（示意）`,`Blade cross-section, magnified (schematic)`),M.x,28,{color:C.white,minX:300,maxX:944});
  const lx=790;
  c.save();c.globalAlpha*=fade(tau,1.2,.5);sun(c,766,96,15,t);text(c,P(`陽光`,`Sunlight`),800,104,22,C.yellow);c.restore();
  c.save();c.globalAlpha*=fade(tau,.6,.5);glow(c,lx+6,164,12,C.cyan,.6);circle(c,lx+6,164,5,C.cyan,null);
  textBlock(c,P(`水和養分`,`Water and\nnutrients`),lx+22,172,130,C.cyan);c.restore();
  tag(c,P(`直接進入\n表面的細胞`,`Straight into\nsurface cells`),lx,262,...cellXY(C_SURF,C_SURF.w/2,4,t),C.cyan,fade(tau,1,.5),{w:150});
  tag(c,P(`葉綠體：\n行光合作用`,`Chloroplasts:\nphotosynthesis`),lx,352,...cellXY(C_CHL,C_CHL.ch[0][0]+1,C_CHL.ch[0][1]+1,t),GOLDLAB,fade(tau,1.6,.5),{w:150});
  const B=[[P(`沒有維管束`,`No vascular tissue`),C.yellow,true],[P(`整個身體表面直接吸收水和養分`,`The whole surface takes up water and nutrients`),C.cyan,false]];
  B.forEach(([p,col,act],i)=>{const ba=fade(tau,2.2+i*.5,.5);if(ba<=0)return;c.save();c.globalAlpha*=ba;cpill(c,p,M.x,446+i*58,{color:col,active:act,minX:300,maxX:944});c.restore();});
  c.restore();
}
// step 3: schematic size bar, ×10 per step
const AX={x0:100,step:150,y:418},axX=mm=>AX.x0+AX.step*(Math.log10(mm)+1);
const TICKS=['0.1 mm','1 mm','1 cm','10 cm','1 m','10 m'];
function over3(c,a,tau,t){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  // Paramecium picture (not to the same scale as the kelp)
  const pa=fade(tau,.2,.6),bob=3*Math.sin(t*1.1);
  c.save();c.translate(140,150+bob);c.rotate(.05*Math.sin(t*.7));K.at(c,'paramecium_a.png',0,0,200,{alpha:pa});c.restore();
  text(c,P(`草履蟲`,`Paramecium`),140,272,22,C.cyan,'center');
  text(c,P(`海帶`,`Kelp`),868,358,22,C.green,'center');
  // conclusion card
  const ca=fade(tau,2.6,.6);
  if(ca>0){c.save();c.globalAlpha*=ca;D.round(c,282,14,436,290,16,'rgba(11,26,21,.88)',C.yellow);
    text(c,P(`原生生物不是「小」才算`,`A protist does not have to be small`),500,56,26,C.yellow,'center');
    textBlock(c,P(`要看有沒有細胞核，是不是藻類或原生動物等。`,`What counts: a nucleus, and being an alga, a protozoan or the like.`),300,98,400,C.white);
    cpill(c,P(`草履蟲：原生動物，有細胞核`,`Paramecium: a protozoan, has a nucleus`),500,180,{color:C.cyan,minX:290,maxX:710});
    cpill(c,P(`海帶：藻類，有細胞核`,`Kelp: an alga, has a nucleus`),500,236,{color:C.green,minX:290,maxX:710});
    c.restore();}
  // axis
  const ga=fade(tau,.6,.8),xe=mix(AX.x0,AX.x0+AX.step*5,ga);
  line(c,[[AX.x0,AX.y],[xe,AX.y]],C.white,3);
  TICKS.forEach((tk,i)=>{const x=AX.x0+AX.step*i;if(x>xe+1)return;line(c,[[x,AX.y-9],[x,AX.y+9]],C.white,3);text(c,tk,x,AX.y+38,22,C.muted,'center',MONO);});
  // markers
  const ma=fade(tau,1.3,.5);
  if(ma>0){c.save();c.globalAlpha*=ma;
    const px=axX(.2),k0=axX(2000),k1=axX(5000);
    dashed(c,[[140,250+bob],[px,AX.y-14]],rgba(C.cyan,.8),2);
    circle(c,px,AX.y,9,C.cyan,C.ink,2);
    D.round(c,k0,AX.y-9,k1-k0,18,9,C.green,C.ink);
    dashed(c,[[868,368],[(k0+k1)/2,AX.y-14]],rgba(C.green,.8),2);
    text(c,P(`約 0.2 mm`,`about 0.2 mm`),px,520,22,C.cyan,'center');
    text(c,P(`可達數公尺`,`up to several metres`),(k0+k1)/2,520,22,C.green,'center');
    text(c,P(`每往右一格，長度變成 10 倍`,`Each step right: 10 times longer`),470,520,22,C.white,'center');
    c.restore();}
  // arc: tens of thousands of times
  const aa=fade(tau,1.9,.6);
  if(aa>0){const x0=axX(.2),x1=axX(3000),cx=(x0+x1)/2,py=AX.y-58;
    c.save();c.globalAlpha*=aa;c.beginPath();c.moveTo(x0,AX.y-16);c.quadraticCurveTo(cx,py-30,x1,AX.y-16);c.strokeStyle=rgba(C.orange,.9);c.lineWidth=3;c.setLineDash([8,7]);c.lineDashOffset=-t*14;c.stroke();c.setLineDash([]);
    const q=mod(t*.35,1),[dx,dy]=K.bez([x0,AX.y-16],[cx,py-30],[x1,AX.y-16],q);glow(c,dx,dy,14,C.orange,.7);circle(c,dx,dy,5,C.orange,null);
    pill(c,P(`差了上萬倍`,`Tens of thousands of times`),cx-(measure(c,P(`差了上萬倍`,`Tens of thousands of times`),22)+28)/2,py-28-34,{color:C.orange,active:true});
    c.restore();}
  text(c,P(`示意，非同比例：兩張圖的大小不代表真實大小`,`Schematic, not to scale: the two pictures are not drawn at their real sizes`),480,580,22,C.muted,'center');
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;if(k!==1)s.kelPart=null;
  const {from,u,ov}=track(s,k,t);
  const out=held?1:1-fade(tau,PER-.45,.45);
  const oa=j=>(j===k?out*clamp((t-s.kelT-.5)/.6):0)+(j===from&&from!==k?1-ov:0);
  const A=LK[from],B=LK[k],L={ox:mix(A.ox,B.ox,u),oy:mix(A.oy,B.oy,u),sc:mix(A.sc,B.sc,u)};
  const left=mix(from===3?0:1,k===3?0:1,u);
  // left column: sea water, rock, the whole kelp
  seaPanel(c,left,16,8,266,584);
  if(left>0){c.save();c.globalAlpha*=left;pill(c,P(`海水`,`Sea water`),26,18,{color:C.cyan});c.restore();}
  rock(c,140,606,100,40,left);
  if(left>.3){c.save();c.globalAlpha*=clamp((left-.3)/.7);pill(c,P(`岩石`,`Rock`),206,548,{color:C.white});c.restore();}
  kelp(c,L,t,1);
  over0(c,oa(0),k===0?tau:9,t,L);
  over1(c,s,oa(1),k===1?tau:9,t,L);
  over2(c,oa(2),k===2?tau:9,t,L);
  over3(c,oa(3),k===3?tau:9,t);
}
window.MicroDraw.kelp=draw;
})();
