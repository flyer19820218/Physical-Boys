/* Ecology lesson 2 · "nitrogen" canvas (carbon-cycle tab, view 2, supplement), 2026-10-23. Where nitrogen goes.
 * Background: the shell's blackboard #11261f plus a faint pink "air" band on top with drifting N2 molecules (two pink atoms,
 * triple bond). Each step draws its own soil (steps 0, 2, 3: ground y 400 like the carbon module; step 1: ground y 150 so the
 * root picture EC10 fits). Four steps, 9 s each; s.shown = step; the whole step scene cross-fades (MOVE s).
 *  0 air: three N2 molecules sink from the air to the rice card, an orange X flashes where they meet the plant and they float
 *    back up ("can't use it directly"); right panel "protein": a drawn bead chain (each bead holds a pink N) + "organisms need
 *    nitrogen to make proteins".
 *  1 nodules: EC10 (legume roots with nodules, AI picture, 0.30 scale) on the left, a drawn shoot above the ground; a dashed
 *    ring on one cut nodule is linked by a dashed line ("root nodule") to a zoom circle on the right: nodule wall + pink-red
 *    inside + drawn rod bacteria ("nodule bacteria", "schematic"). N2 comes down from the air into the zoom, splits into two
 *    pink dots that leave along a pink arrow to the plant ("nitrogen compounds plants can absorb"); yellow-green dots come back
 *    from the plant along a second arrow ("supplies food"); green "mutualism" pill between the two arrows.
 *  2 along the chain: pink dots rise from the soil into rice ("nitrogen compounds plants can absorb"), then follow arcs
 *    rice -> grasshopper -> frog ("feeding"); a small "protein" bead chain on the right.
 *  3 back to the environment: remains route from rice, grasshopper, frog to the decomposer card (shiitake + drawn bacteria),
 *    down into the soil and back along the soil to the rice roots ("nitrogen compounds plants can absorb", "soil"); from a soil
 *    bacteria cluster N2 molecules rise back to the air ("some bacteria turn it back into nitrogen gas").
 * Every step: "supplement" pill top left, then "air" and "nitrogen gas N2"; AI note top right; legend "schematic: (dot)
 * nitrogen (arrow)" bottom left; 4-dot progress track bottom right.
 * EC10 label points measured with PIL on the 1021x1243 PNG: ground (soil patch centre) y 57, stem x 501,
 * cut nodules (pink) centres (272,707) and (372,672), r ~45.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,PINK=C.pink,ORANGE=C.orange,MUTED=C.muted,SOILC='#c49a6c',TEAL='#7fe9d0',FOOD='#bef264';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const fin=(tau,d,len=.7)=>ease((tau-d)/len);
// labels this module adds (not in K.LAB yet): reported to the main conversation
const X={
  cantUse:P('不能直接用',"Can't use it directly"),
  needN:P('生物需要氮來製造蛋白質','Organisms need nitrogen to make proteins'),
  mutualism:P('互利共生','Mutualism'),
  givesFood:P('提供養分','Supplies food'),
  backToAir:P('有些細菌把它變回氮氣','Some bacteria turn it back into nitrogen gas')};
const n2Name=()=>{const p=L('n2','氮氣','Nitrogen gas');return[p[0]+' N₂',p[1]+' N₂'];};

// ── layout ─────────────────────────────────────────────────────────────────
const AIR=132,G=400,SOIL_B=548,PY=146;
const MOLS=[[290,92,.4],[420,74,1.7],[520,110,2.9],[610,80,.9],[700,108,3.6],[850,96,2.2],[930,72,4.4],[40,104,1.1],[360,118,5.1]];

// ── helpers (same look as the carbon module) ───────────────────────────────
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h,cx:bx+w/2,cy:y+h/2,r:bx+w};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
// wrapped text on a dark rounded backdrop; returns the rect
function box(c,p,x,y,w,col){
  const rows=K.splitLines(c,D.tr(p),w-24,22),lh=29,h=rows.length*lh+14,bw=Math.max(...rows.map(r=>measure(c,r,22)))+24;
  D.round(c,x,y,bw,h,12,'rgba(11,26,21,.92)',rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,x+12,y+29+i*lh,22,col,'left'));
  return{x,y,w:bw,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function card(c,r,pic,name,{glowA=0,t=0}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.7,PINK,.22+.08*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const rows=K.splitLines(c,D.tr(name),r.w-14,22),lh=26,nh=rows.length*lh+6;
  K.place(c,pic,r.x+6,r.y+6,r.w-12,r.h-12-nh);
  rows.forEach((s,i)=>text(c,s,r.x+r.w/2,r.y+r.h-nh+20+i*lh,22,WHITE,'center'));
}
function poly(pts){const Ls=[0];for(let i=1;i<pts.length;i++)Ls.push(Ls[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{pts,Ls,len:Ls[Ls.length-1]};}
function ptAt(pl,u){const d=clamp(u)*pl.len;let i=1;while(i<pl.Ls.length-1&&pl.Ls[i]<d)i++;const s=(d-pl.Ls[i-1])/((pl.Ls[i]-pl.Ls[i-1])||1);return K.lerpP(pl.pts[i-1],pl.pts[i],clamp(s));}
function upTo(pl,u){const d=clamp(u)*pl.len,out=[pl.pts[0]];for(let i=1;i<pl.pts.length;i++){if(pl.Ls[i]<d)out.push(pl.pts[i]);else{out.push(ptAt(pl,u));break;}}return out;}
const quad=(p0,p1,p2,n=36)=>Array.from({length:n+1},(_,i)=>K.bez(p0,p1,p2,i/n));
const cat=(...ps)=>poly(ps.flatMap((p,i)=>i?p.slice(1):p));
function pathArrow(c,pl,g,col,{w=4,dash=null,off=0}={}){
  if(g<=.02)return;const tip=ptAt(pl,g),back=ptAt(pl,Math.max(0,g-16/pl.len)),pts=upTo(pl,Math.max(0,g-16/pl.len));
  c.save();if(dash){c.setLineDash(dash);c.lineDashOffset=off;}if(pts.length>1)K.sline(c,pts,col,w);c.restore();
  K.arrow(c,back[0],back[1],tip[0],tip[1],col,w);
}
function loopU(tau,d0,travel,rest){if(tau<d0)return 0;const q=mod(tau-d0,travel+rest);return smooth(Math.min(1,q/travel));}
// N2: two pink atoms with a triple bond
function n2(c,x,y,ang,{a=1,s=1}={}){
  withA(c,a,()=>{const dx=Math.cos(ang)*8*s,dy=Math.sin(ang)*8*s,nx=-dy/8*2.6,ny=dx/8*2.6;
    for(const q of[-1,0,1])K.sline(c,[[x-dx+nx*q,y-dy+ny*q],[x+dx+nx*q,y+dy+ny*q]],rgba(WHITE,.7),1.6*s);
    circle(c,x-dx,y-dy,7*s,PINK,'#fbcfe8',1.5);circle(c,x+dx,y+dy,7*s,PINK,'#fbcfe8',1.5);});
}
// a nitrogen-containing dot (pink glowing)
function ndot(c,x,y,t,{r=7,a=1}={}){withA(c,a,()=>{glow(c,x,y,r*3.2,PINK,.55+.2*Math.sin(t*4));circle(c,x,y,r,'#ffe4f1',PINK,2.5);});}
function fooddot(c,x,y,t,a=1){withA(c,a,()=>{glow(c,x,y,18,FOOD,.5);circle(c,x,y,6,'#f7fee7',FOOD,2.5);});}
function cross(c,x,y,t,a=1){withA(c,a,()=>{const s=15+2*Math.sin(t*5);glow(c,x,y,30,ORANGE,.45);
  K.sline(c,[[x-s,y-s],[x+s,y+s]],C.deep,10);K.sline(c,[[x-s,y+s],[x+s,y-s]],C.deep,10);
  K.sline(c,[[x-s,y-s],[x+s,y+s]],ORANGE,6);K.sline(c,[[x-s,y+s],[x+s,y-s]],ORANGE,6);});}
// protein: a wavy bead chain, each bead with a pink N core
function chain(c,x0,x1,y,t,n=9){
  const pts=[];for(let i=0;i<n;i++){const u=i/(n-1);pts.push([mix(x0,x1,u),y+10*Math.sin(u*7+t*1.2)]);}
  K.sline(c,pts,rgba(WHITE,.6),3);
  pts.forEach(([x,yy],i)=>{circle(c,x,yy,13,'#e8e1cf','#fff8e6',1.5);circle(c,x,yy,5.5,PINK,null);});
}
// drawn bacteria (rods and cocci) inside a clipped circle (same look as the carbon module)
const BAC=(()=>{const r=K.rng(23),a=[];for(let i=0;i<34;i++)a.push({x:r()*2-1,y:r()*2-1,rod:i%3!==2,ang:r()*Math.PI,ph:r()*6.28,s:.75+r()*.5});return a.filter(b=>b.x*b.x+b.y*b.y<.78);})();
function bacteria(c,cx,cy,R,t,ring=TAU_RING){
  c.save();c.beginPath();c.arc(cx,cy,R,0,K.TAU);c.fillStyle='#0e2a22';c.fill();c.clip();
  const k=R/76;
  BAC.forEach(b=>{const x=cx+b.x*R+4*k*Math.sin(t*1.3+b.ph),y=cy+b.y*R+4*k*Math.cos(t*1.1+b.ph);
    if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.25*Math.sin(t*.8+b.ph));const L2=15*k*b.s,W2=5.5*k;
      c.beginPath();c.roundRect(-L2,-W2,L2*2,W2*2,W2);c.fillStyle=TEAL;c.fill();c.strokeStyle='#d9fff4';c.lineWidth=1.5;c.stroke();c.restore();}
    else{circle(c,x,y,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);circle(c,x+12*k*b.s,y+2*k,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);}
  });
  c.restore();circle(c,cx,cy,R,null,ring,3);
}
const TAU_RING='#55e9ff';
const DEC={x:470,y:196,w:220,h:196};
function decCard(c,t){
  const r=DEC;
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const ph=94;K.place(c,'fungi_ai_1022/shiitake.png',r.x+8,r.y+8,104,ph);
  bacteria(c,r.x+r.w-58,r.y+8+ph/2,42,t);
  const fn=L('fungi','蕈類（真菌）','Mushrooms (fungi)'),bn=L('bacteria','細菌','Bacteria'),sn=L('schematic','示意','Schematic');
  let y=r.y+ph+38;
  K.splitLines(c,D.tr(fn),r.w-14,22).forEach(s=>{text(c,s,r.x+r.w/2,y,22,WHITE,'center');y+=27;});
  const wb=measure(c,bn,22),ws=measure(c,sn,22);
  if(wb+ws+12<=r.w-16){const x0=r.x+(r.w-wb-ws-12)/2;text(c,bn,x0,y,22,WHITE,'left');text(c,sn,x0+wb+12,y,22,MUTED,'left');}
  else{text(c,bn,r.x+r.w/2,y,22,WHITE,'center');text(c,sn,r.x+r.w/2,y+27,22,MUTED,'center');}
}

// ── stage ──────────────────────────────────────────────────────────────────
function stage(c,t){
  const g=c.createLinearGradient(0,0,0,AIR+16);g.addColorStop(0,rgba(PINK,.09));g.addColorStop(1,rgba(PINK,0));
  c.fillStyle=g;c.fillRect(0,0,CW,AIR+16);
  K.dashed(c,[[0,AIR],[CW,AIR]],rgba(PINK,.28),2,[4,10]);
  MOLS.forEach(([x,y,ph])=>n2(c,x+8*Math.sin(t*.45+ph),y+5*Math.sin(t*.8+ph),ph+.4*Math.sin(t*.5+ph),{a:.75}));
}
const SPECK=(()=>{const r=K.rng(41),a=[];for(let i=0;i<90;i++)a.push([r()*CW,r(),1.5+r()*2.5,i%4]);return a;})();
function soil(c,g,bot=SOIL_B){
  c.save();c.fillStyle='#3d2a1c';c.fillRect(0,g,CW,bot-g);c.fillStyle='#5b3f27';c.fillRect(0,g,CW,10);c.restore();
  K.sline(c,[[0,g],[CW,g]],'#8a6440',3);
  SPECK.forEach(([x,f,r,q])=>circle(c,x,g+8+f*(bot-g-14),r,q?'#4e3624':'#6b4a2f',null));
}
const soilTag=(c,x,y)=>tag(c,L('soil','土壤','Soil'),x,y,{col:SOILC});

// ── step 0 · nitrogen gas in the air, plants can't use it ─────────────────
const R0=[{k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],x:40,w:200},{k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],x:290,w:200}];
const XP=[[140,166],[390,166]];
const SINK=[[[96,84],[124,166],0],[[240,92],[156,160],0],[[330,80],[372,166],1],[[480,96],[406,160],1]];
function step0(c,tau,t){
  soil(c,G);soilTag(c,16,G+14);
  R0.forEach(o=>card(c,{x:o.x,y:196,w:o.w,h:196},o.pic,L(o.k,...o.n)));
  // molecules sink, hit, bounce back
  const hit=[0,0];
  SINK.forEach(([s,e,j],i)=>{if(tau<.4+i*.45)return;const q=mod(tau-.4-i*.45,3.6)/3.6;let x,y;
    if(q<.5){[x,y]=K.lerpP(s,e,smooth(q/.5));}else if(q<.62){[x,y]=e;}else{const v=smooth((q-.62)/.38);[x,y]=K.lerpP(e,[s[0]+30,s[1]+6],v);}
    if(q>.45&&q<.75)hit[j]=Math.max(hit[j],1-Math.abs(q-.56)/.19);
    n2(c,x,y,.5*Math.sin(t+i),{s:1.15});});
  withA(c,fin(tau,.9),()=>{XP.forEach((p,j)=>cross(c,p[0],p[1],t,.8+.2*clamp(hit[j])));
    const p=tag(c,X.cantUse,XP[1][0]+34,PY-2,{col:ORANGE,active:true});pulseRing(c,p,t,ORANGE);});
  // protein panel
  withA(c,fin(tau,1.6),()=>{const pr={x:600,y:200,w:344,h:192};D.round(c,pr.x,pr.y,pr.w,pr.h,16,'#16332b',C.edge);
    tag(c,L('protein','蛋白質','Protein'),pr.x+16,pr.y+16,{col:PINK,active:true});
    chain(c,pr.x+30,pr.x+pr.w-30,pr.y+96,t,8);
    K.wrap(c,X.needN,pr.x+18,pr.y+146,pr.w-36,22,WHITE,29);});
}

// ── step 1 · root nodules ─────────────────────────────────────────────────
const G2=150,PK=.30,PIC={x:14,y:G2-57*PK,w:1021*PK,h:1243*PK};
const STEM=[PIC.x+501*PK,G2],NB=[PIC.x+372*PK,PIC.y+672*PK];
const Z=[800,340],ZR=108;
const PK1=poly([[699,303],[330,238],[174,176]]),PK1d=cat(PK1.pts,[[174,176],[STEM[0]+2,G2],[STEM[0]+4,96]]);
const FD=poly([[178,232],[330,340],[707,392]]),FDd=cat(FD.pts,[[707,392],[Z[0]-20,Z[1]+10]]);
const NA=poly([[Z[0],94],[Z[0],Z[1]-ZR-3]]);
const CONN=poly([[NB[0]+13,NB[1]+12],[300,452],[700,452],[724,416]]);
const ROD=(()=>{const r=K.rng(7),a=[];while(a.length<17){const x=r()*2-1,y=r()*2-1;if(x*x+y*y<.62)a.push({x,y,ang:r()*Math.PI,ph:r()*6.28,s:.8+r()*.4});}return a;})();
// EC10 has left-over white background between the roots. Once loaded, key out near-white patches whose surrounding ring is dark
// or transparent (gaps between roots); patches ringed by light beige are highlights on nodules and stay. Falls back to the raw picture.
let CLEAN=null;
function cleanEC10(){
  if(CLEAN)return CLEAN.cv;
  const im=K.pic(K.src('EC10_legume_nodules.png'));if(!im)return null;
  try{
    const W=im.naturalWidth,H=im.naturalHeight,n=W*H,cv=document.createElement('canvas');cv.width=W;cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const id=x.getImageData(0,0,W,H),d=id.data;
    const mn=new Uint8Array(n),m=new Uint8Array(n),lab=new Int32Array(n),key=new Uint8Array(n),st=new Int32Array(n);
    for(let i=0;i<n;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2],lo=Math.min(r,g,b),hi=Math.max(r,g,b);mn[i]=lo;if(d[i*4+3]>0&&lo>215&&hi-lo<22)m[i]=1;}
    let Lb=0;
    for(let i=0;i<n;i++){if(!m[i]||lab[i])continue;Lb++;let sp=0,s=0,cnt=0;const comp=[];st[sp++]=i;lab[i]=Lb;
      while(sp){const p=st[--sp];comp.push(p);const px=p%W,py=(p-px)/W;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const qx=px+dx,qy=py+dy;if(qx<0||qy<0||qx>=W||qy>=H)continue;const q=qy*W+qx;if(m[q]&&!lab[q]){lab[q]=Lb;st[sp++]=q;}}}
      for(const p of comp){const px=p%W,py=(p-px)/W;
        for(let k=1;k<=3;k++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const qx=px+dx*k,qy=py+dy*k;if(qx<0||qy<0||qx>=W||qy>=H)continue;const q=qy*W+qx;if(lab[q]===Lb)continue;s+=d[q*4+3]<128?0:mn[q];cnt++;}}
      if(cnt&&s/cnt<200)for(const p of comp)key[p]=1;}
    for(let i=0;i<n;i++){if(!d[i*4+3])continue;let on=key[i];
      if(!on){const px=i%W,py=(i-px)/W;for(let dy=-1;dy<=1&&!on;dy++)for(let dx=-1;dx<=1&&!on;dx++){const qx=px+dx,qy=py+dy;if(qx>=0&&qy>=0&&qx<W&&qy<H&&key[qy*W+qx])on=1;}}
      if(!on)continue;const r=d[i*4],g=d[i*4+1],b=d[i*4+2],sat=Math.max(r,g,b)-mn[i];
      const w=clamp((mn[i]-205)/25)*clamp((26-sat)/10);d[i*4+3]=Math.round(d[i*4+3]*(1-w));}
    x.putImageData(id,0,0);CLEAN={cv};
  }catch(e){CLEAN={cv:null};}
  return CLEAN.cv;
}
function shoot(c,t){
  const [sx,sy]=STEM,sw=2*Math.sin(t*1.1);
  K.sline(c,[[sx,sy+4],[sx+1,sy-34],[sx+3+sw*.5,sy-66],[sx+4+sw,sy-82]],'#3f9a4e',7);
  const leaf=(x,y,ang,l)=>{c.save();c.translate(x,y);c.rotate(ang);c.beginPath();c.ellipse(l*.5,0,l*.5,l*.24,0,0,K.TAU);c.fillStyle='#4ade80';c.fill();c.strokeStyle='#1f6f3a';c.lineWidth=2;c.stroke();
    K.sline(c,[[2,0],[l*.9,0]],'#1f6f3a',1.5);c.restore();};
  const n1=[sx+1,sy-38],n2p=[sx+4+sw,sy-82];
  leaf(...n1,Math.PI+.35+.05*Math.sin(t),34);leaf(...n1,-.35-.05*Math.sin(t),34);leaf(...n1,-Math.PI/2-.2,26);
  leaf(...n2p,Math.PI+.6,28);leaf(...n2p,-.6,28);leaf(...n2p,-Math.PI/2,24);
}
function zoom(c,t){
  const [zx,zy]=Z;
  c.save();c.beginPath();c.arc(zx,zy,ZR,0,K.TAU);
  const g=c.createRadialGradient(zx,zy,10,zx,zy,ZR);g.addColorStop(0,'#7a3550');g.addColorStop(1,'#4e2236');c.fillStyle=g;c.fill();c.clip();
  // plant cell walls (faint)
  for(let i=-3;i<=3;i++){K.sline(c,[[zx+i*34+6*Math.sin(i),zy-ZR],[zx+i*34-6*Math.sin(i),zy+ZR]],'rgba(255,214,226,.18)',2);}
  for(let j=-3;j<=3;j++){K.sline(c,[[zx-ZR,zy+j*34],[zx+ZR,zy+j*34+5*Math.cos(j)]],'rgba(255,214,226,.18)',2);}
  ROD.forEach(b=>{const x=zx+b.x*ZR+4*Math.sin(t*1.2+b.ph),y=zy+b.y*ZR+4*Math.cos(t*1.0+b.ph);
    c.save();c.translate(x,y);c.rotate(b.ang+.3*Math.sin(t*.7+b.ph));const L2=14*b.s,W2=5.5;
    c.beginPath();c.roundRect(-L2,-W2,L2*2,W2*2,W2);c.fillStyle=TEAL;c.fill();c.strokeStyle='#e8fff7';c.lineWidth=1.5;c.stroke();c.restore();});
  c.restore();
  circle(c,zx,zy,ZR-6,null,'#d8c3a2',12);circle(c,zx,zy,ZR,null,WHITE,2.5);
}
function step1(c,tau,t){
  soil(c,G2,556);
  const cl=cleanEC10();if(cl)c.drawImage(cl,PIC.x,PIC.y,PIC.w,PIC.h);else K.drawIn(c,'EC10_legume_nodules.png',PIC);
  shoot(c,t);
  withA(c,fin(tau,.1),()=>tag(c,L('legume','豆科植物','Legume'),PIC.x,512,{col:GREEN,active:true}));
  // the nodule on the picture and the link to the zoom
  withA(c,fin(tau,.3),()=>{c.save();c.setLineDash([6,6]);c.lineDashOffset=-t*10;K.sline(c,upTo(CONN,fin(tau,.3,.8)),rgba(WHITE,.8),2.5);c.restore();
    circle(c,NB[0],NB[1],17+1.5*Math.sin(t*3),null,WHITE,2.5);});
  withA(c,fin(tau,.6),()=>{zoom(c,t);const p=tag(c,L('nodule','根瘤','Root nodule'),480,432,{al:'center',col:WHITE,active:true});});
  withA(c,fin(tau,.9),()=>{tag(c,L('rhizobia','根瘤菌','Nodule bacteria'),Z[0],Z[1]+ZR+10,{al:'center',col:TEAL,active:true});
    text(c,L('schematic','示意','Schematic'),Z[0],Z[1]+ZR+80,22,MUTED,'center');});
  // N2 in
  withA(c,fin(tau,1.2),()=>{pathArrow(c,NA,fin(tau,1.2,.6),PINK,{w:4.5});tag(c,L('n2','氮氣','Nitrogen gas'),Z[0]-12,112,{al:'right',col:PINK});});
  // usable nitrogen out to the plant
  let up;
  withA(c,fin(tau,1.8),()=>{pathArrow(c,PK1,fin(tau,1.8,.8),PINK,{w:4.5});up=box(c,L('usableN','植物能吸收的含氮物質','Nitrogen compounds plants can absorb'),336,156,256,PINK);});
  // food back to the bacteria
  withA(c,fin(tau,2.6),()=>{pathArrow(c,FD,fin(tau,2.6,.8),FOOD,{w:4.5});tag(c,X.givesFood,345,378,{col:FOOD});});
  withA(c,fin(tau,3.4),()=>{const p=tag(c,X.mutualism,470,288,{al:'center',col:GREEN,active:true});pulseRing(c,p,t,GREEN);});
  // moving things
  if(tau>1.6)for(let q=0;q<3;q++){const u=mod((tau-1.6)/4.2+q/3);
    if(u<.35){const v=smooth(u/.35);const [x,y]=v<.75?ptAt(NA,v/.75):K.lerpP(NA.pts[1],[Z[0]-10,Z[1]-6],(v-.75)/.25);n2(c,x,y,.4*Math.sin(t*2+q),{s:1.1});}
    else if(u<.42){const v=(u-.35)/.07;ndot(c,Z[0]-10-12*v,Z[1]-6-8*v,t,{r:5});ndot(c,Z[0]-10+12*v,Z[1]-6+8*v,t,{r:5});}
    else{const v=smooth((u-.42)/.58),[x,y]=ptAt(cat([[Z[0]-22,Z[1]-14],PK1.pts[0]],PK1d.pts),v),a=v>.92?(1-v)/.08:1;ndot(c,x,y,t,{r:6,a});}}
  if(tau>2.8)for(let q=0;q<2;q++){const v=mod((tau-2.8)/3.4+q/2),[x,y]=ptAt(FDd,smooth(v));fooddot(c,x,y,t,v>.9?(1-v)/.1:1);}
}

// ── step 2 · along the food chain ─────────────────────────────────────────
const C2=[{k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],x:30,w:170},{k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],x:290,w:180},
  {k:'frog',pic:'EC5_frog.png',n:['澤蛙','Paddy field frog'],x:560,w:180}];
const CY=206,CH=186,cx2=i=>C2[i].x+C2[i].w/2,cy2=()=>CY+76;
const arc2=(i,j)=>quad([cx2(i)+16,CY-2],[(cx2(i)+cx2(j))/2,CY-36],[cx2(j)-16,CY-2]);
const A01=poly(arc2(0,1)),A12=poly(arc2(1,2));
const UPR=poly([[cx2(0),522],[cx2(0),CY+CH+4]]);
const ROUTE2=cat([[cx2(0),530],[cx2(0),cy2()]],[[cx2(0),cy2()],A01.pts[0]],A01.pts,[A01.pts[A01.pts.length-1],[cx2(1),cy2()]],[[cx2(1),cy2()],A12.pts[0]],A12.pts,[A12.pts[A12.pts.length-1],[cx2(2),cy2()]]);
function step2(c,tau,t){
  soil(c,G);soilTag(c,16,G+100);
  // which card holds the dot
  const T=7,R=1.2,q=tau<.8?-1:mod(tau-.8,T+R),v=q<0?0:smooth(Math.min(1,q/T)),[dx,dy]=ptAt(ROUTE2,v);
  const hold=q<0?-1:(dy>CY+10&&dy<CY+CH?(dx<C2[1].x?0:dx<C2[2].x?1:2):-1);
  C2.forEach((o,i)=>card(c,{x:o.x,y:CY,w:o.w,h:CH},o.pic,L(o.k,...o.n),{glowA:hold===i?.8:0,t}));
  // up from the soil into rice
  withA(c,fin(tau,.1),()=>{pathArrow(c,UPR,fin(tau,.1,.6),PINK,{w:4.5});
    tag(c,L('usableN','植物能吸收的含氮物質','Nitrogen compounds plants can absorb'),cx2(0)+22,430,{col:PINK,active:true});});
  [[A01,0],[A12,1]].forEach(([A,i],n)=>withA(c,fin(tau,.6+n*.5),()=>{pathArrow(c,A,fin(tau,.6+n*.5,.7),PINK,{w:4.5});
    tag(c,L('feeding','攝食','Feeding'),(cx2(i)+cx2(i+1))/2,PY,{al:'center',col:WHITE,active:true});}));
  // protein note
  withA(c,fin(tau,1.6),()=>{const p=tag(c,L('protein','蛋白質','Protein'),762,CY+10,{col:PINK,active:true});chain(c,778,926,CY+100,t,6);});
  // soil specks of nitrogen
  for(let i=0;i<3;i++){const u=mod(t*.3+i/3);ndot(c,cx2(0)+[-30,26,-14][i],mix(536,G+20,u),t,{r:4,a:Math.sin(u*Math.PI)*.8});}
  if(q>=0&&v<1)ndot(c,dx,dy,t);else if(q>=0)ndot(c,cx2(2),cy2(),t,{a:1-clamp((q-T)/R)});
}

// ── step 3 · back to the environment ──────────────────────────────────────
const C3=[{k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],x:20,w:130},{k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],x:160,w:150},
  {k:'frog',pic:'EC5_frog.png',n:['澤蛙','Paddy field frog'],x:320,w:140}];
const cx3=i=>C3[i].x+C3[i].w/2,RY=420,DIN=540,DOUT=650,RET=494,BX=724;
const REM=poly([[cx3(0)+20,RY],[DIN,RY],[DIN,DEC.y+DEC.h+4]]);
const RETP=poly([[DOUT,DEC.y+DEC.h+2],[DOUT,RET],[40,RET],[40,DEC.y+DEC.h+4]]);
const UPN=poly([[BX,466],[BX,AIR-24]]);
const LOOP3=cat([[cx3(2),300],[cx3(2),RY],[DIN,RY],[DIN,320]],[[DIN,320],[DOUT,320],[DOUT,RET],[40,RET],[40,300]]);
function step3(c,tau,t){
  soil(c,G);
  C3.forEach((o,i)=>card(c,{x:o.x,y:196,w:o.w,h:196},o.pic,L(o.k,...o.n),{glowA:0,t}));
  decCard(c,t);
  withA(c,fin(tau,.1),()=>{[0,1,2].forEach(i=>K.arrow(c,cx3(i)+(i?0:20),394,cx3(i)+(i?0:20),RY-3,PINK,4));pathArrow(c,REM,fin(tau,.2,.9),PINK,{w:4.5});
    tag(c,L('remains','遺體與排遺','Remains and waste'),110,RY+12,{col:WHITE,active:true});});
  withA(c,fin(tau,.6),()=>{const p=tag(c,L('decomposer','分解者','Decomposer'),DEC.x+DEC.w/2,PY,{al:'center',col:WHITE,active:true});pulseRing(c,p,t,WHITE);});
  withA(c,fin(tau,1.2),()=>{pathArrow(c,RETP,fin(tau,1.2,1.2),PINK,{w:4.5});
    tag(c,L('usableN','植物能吸收的含氮物質','Nitrogen compounds plants can absorb'),60,RET+10,{col:PINK,active:true});
    soilTag(c,DIN+10,RET+10);});
  // soil bacteria give some back to the air
  withA(c,fin(tau,2.2),()=>{bacteria(c,BX,505,30,t,PINK);
    text(c,L('bacteria','細菌','Bacteria'),BX+40,500,22,WHITE,'left');text(c,L('schematic','示意','Schematic'),BX+40,528,22,MUTED,'left');
    pathArrow(c,UPN,fin(tau,2.2,.8),PINK,{w:4,dash:[9,7],off:-t*14});
    box(c,X.backToAir,BX+14,170,CW-8-BX-14,PINK);
    for(let q=0;q<3;q++){const u=mod(t*.28+q/3),y=mix(462,AIR-20,u);n2(c,BX+10*Math.sin(u*9+q),y,.6*Math.sin(t+q),{a:Math.sin(u*Math.PI),s:1.05});}});
  // the nitrogen dot travels the loop
  const T=7.5,R=1,q=tau<.6?-1:mod(tau-.6,T+R),v=q<0?0:smooth(Math.min(1,q/T));
  if(q>=0){const [x,y]=ptAt(LOOP3,v);ndot(c,x,y,t,{a:q>T?1-(q-T)/R:1});}
}

// ── frame ──────────────────────────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3];
function legend(c){
  const sp=L('schematic','示意','Schematic'),s=[sp[0]+'：',sp[1]+':'],y=586,w=measure(c,s,22);
  text(c,s,16,y,22,MUTED,'left');
  const bx=16+w+20;glow(c,bx,y-8,16,PINK,.5);circle(c,bx,y-8,7,'#ffe4f1',PINK,2.5);
  const cn=L('nitrogen','氮','Nitrogen'),cw=measure(c,cn,22);text(c,cn,bx+16,y,22,PINK,'left');
  K.arrow(c,bx+16+cw+14,y-8,bx+16+cw+60,y-8,PINK,3.5);
}
function progress(c,k,t){
  const n=N,gap=38,r=15,x0=CW-24-(n-1)*gap,y=578;
  K.sline(c,[[x0,y],[x0+(n-1)*gap,y]],rgba(MUTED,.5),3);
  if(k>0)K.sline(c,[[x0,y],[x0+k*gap,y]],PINK,3);
  for(let i=0;i<n;i++){const x=x0+i*gap;
    if(i===k){glow(c,x,y,26,PINK,.35+.15*Math.sin(t*3));circle(c,x,y,r,PINK,WHITE,2);}
    else circle(c,x,y,r,'#16332b',i<k?PINK:rgba(MUTED,.7),2.5);
    c.save();c.font=K.MONO(22);c.fillStyle=i===k?C.deep:(i<k?PINK:MUTED);c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.restore();}
}
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.nitroFx||(s.nitroFx={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,u=st.from>=0?smooth(clamp(tau/MOVE)):1;
  stage(c,t);
  if(u<1)withA(c,1-u,()=>STEPS[st.from](c,99,t));
  withA(c,st.from>=0?u:1,()=>STEPS[k](c,st.from>=0?Math.max(0,tau-MOVE*.5):tau,t));
  // fixed labels
  const sp=tag(c,L('supplement','補充','Supplement'),16,12,{col:YELLOW,active:true});
  const ap=tag(c,L('air','空氣','Air'),sp.r+12,12,{col:PINK});
  tag(c,n2Name(),ap.r+12,12,{col:WHITE});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,40,22,MUTED,'right');
  legend(c);progress(c,k,t);
}
window.EcologyDraw.nitrogen=draw;
})();
