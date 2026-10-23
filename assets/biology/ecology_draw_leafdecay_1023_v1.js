/* Ecology lesson 2 · "leafdecay" canvas (roles tab, view 1), 2026-10-23. One fallen leaf in four stages.
 * Background: the shell's blackboard #11261f. Four steps, 9 s each; s.shown = step. Steps cross-fade (MOVE s); the leaf
 * pictures sit in one fixed box on the left (LEAF), so the cross-fade swaps green -> brown -> skeleton in place.
 *  0 whole leaf: EC7_leaf_green drifts down and sways; yellow sparkles = organic matter made by a producer; a yellow
 *    "carbon-containing food" pill points at it; a pulsing "?" (where does it go?).
 *  1 broken up: EC7_leaf_brown; earthworm card + drawn insect card on the right, orange arrows to the leaf edge;
 *    brown crumbs keep falling from the leaf edges and pile up below; orange brace -> "detritus feeder" + "broken into pieces".
 *  2 decomposed: EC7_leaf_skeleton; shiitake card + drawn bacteria card (schematic), cyan arrows to the leaf; cyan hyphae
 *    grow over the leaf from the edge, drawn bacteria wobble in a ring on the leaf; cyan brace -> "decomposer" + "digested".
 *  3 back to soil: EC7_leaf_soil (humus) sinks into a drawn soil band; yellow-green nutrient dots flow from the humus
 *    through the soil into the roots of a drawn seedling and up its stem; "nutrients return to the soil", "matter does not vanish".
 * A progress rail (four numbered markers) runs along the bottom.
 * EC7_leaf_green / brown / soil carry a light, low-saturation fringe (green: a 1-2 px rim; brown: white rings inside the
 * holes; soil: a white shadow under the clumps). Once loaded, light grey pixels connected to transparency are cleared
 * (flood fill from transparent pixels; checked in PIL on #11261f). The skeleton is white itself, so it is drawn as is;
 * its notch on the right edge reads cleanly on the blackboard.
 * Leaf edge fractions (alpha > 100) were measured with PIL; the three leaf pictures share one outline.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,ORANGE=C.orange,GREEN=C.green,MUTED=C.muted,NUT='#bef264';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const fin=(tau,d,len=.7)=>ease((tau-d)/len);

// labels not (yet) in K.LAB
const T={insect:P('昆蟲','Insect'),noVanish:P('物質沒有消失','Matter does not vanish'),roots:P('植物的根','Plant roots'),seedling:P('小苗','Seedling'),
  rail:[P('完整落葉','Whole leaf'),P('被拆碎','Broken up'),P('被分解','Decomposed'),P('回到土裡','Back to soil')]};

// ── helpers (same look as the roles canvas) ────────────────────────────────
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h,cx:bx+w/2,cy:y+h/2};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function card(c,r,pic,name,{col=WHITE,glowA=0,glowCol=YELLOW,t=0}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.7,glowCol,.2+.06*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const rows=K.splitLines(c,D.tr(name),r.w-14,22),lh=26,nh=rows.length*lh+6;
  if(typeof pic==='function')pic({x:r.x+6,y:r.y+6,w:r.w-12,h:r.h-12-nh});else if(pic)K.place(c,pic,r.x+6,r.y+6,r.w-12,r.h-12-nh);
  rows.forEach((s,i)=>text(c,s,r.x+r.w/2,r.y+r.h-nh+20+i*lh,22,col,'center'));
  return r;
}
function growArrow(c,x1,y1,x2,y2,g,col,w=3.5){if(g<=.02)return;K.arrow(c,x1,y1,mix(x1,x2,g),mix(y1,y2,g),col,w);}
function dots(c,x1,y1,x2,y2,t,col,{n=1,speed=.45,r=4.5,a=1,core='#fff7c2'}={}){
  for(let q=0;q<n;q++){const u=mod(t*speed+q/n),x=mix(x1,x2,u*.86),y=mix(y1,y2,u*.86);
    withA(c,a*Math.sin(u*Math.PI),()=>{glow(c,x,y,12,col,.7);circle(c,x,y,r,core,null);});}
}
// vertical brace on the right of the cards, tick pointing right at the middle
function brace(c,x,y0,y1,col){const m=(y0+y1)/2;K.sline(c,[[x-8,y0],[x,y0+6],[x,m-6],[x+8,m],[x,m+6],[x,y1-6],[x-8,y1]],col,3);}
// role pill + wrapped action text in the pill column
function roleBlock(c,tau,t,role,act,col,d){
  withA(c,fin(tau,d),()=>{brace(c,BR.x,BR.y0,BR.y1,col);
    const p=tag(c,role,BR.x+16,BR.py,{col,active:true,size:24});pulseRing(c,p,t,col);
    withA(c,fin(tau,d+.4),()=>K.wrap(c,act,BR.x+18,BR.py+76,CW-12-(BR.x+18),22,col,28));});
}
// drawn bacteria (rods and cocci) wobbling inside a clipped circle (same as the roles canvas)
const BAC=(()=>{const r=K.rng(23),a=[];for(let i=0;i<34;i++)a.push({x:r()*2-1,y:r()*2-1,rod:i%3!==2,ang:r()*Math.PI,ph:r()*6.28,s:.75+r()*.5});return a.filter(b=>b.x*b.x+b.y*b.y<.78);})();
function bacteria(c,cx,cy,R,t,{ring=CYAN}={}){
  c.save();c.beginPath();c.arc(cx,cy,R,0,K.TAU);c.fillStyle='#0e2a22';c.fill();c.clip();
  const k=R/76;
  BAC.forEach(b=>{const x=cx+b.x*R+4*k*Math.sin(t*1.3+b.ph),y=cy+b.y*R+4*k*Math.cos(t*1.1+b.ph);
    if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.25*Math.sin(t*.8+b.ph));const L2=15*k*b.s,W2=5.5*k;
      c.beginPath();c.roundRect(-L2,-W2,L2*2,W2*2,W2);c.fillStyle='#7fe9d0';c.fill();c.strokeStyle='#d9fff4';c.lineWidth=1.5;c.stroke();c.restore();}
    else{circle(c,x,y,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);circle(c,x+12*k*b.s,y+2*k,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);}
  });
  c.restore();circle(c,cx,cy,R,null,ring,3);
}
// a drawn ground beetle-like insect, legs stepping, jaws working; fits box r
function insect(c,r,t){
  const cx=r.x+r.w/2,cy=r.y+r.h/2+4,s=Math.min(r.w/190,r.h/110),dx=6*s*Math.sin(t*.9);
  c.save();c.translate(cx+dx,cy);c.scale(s,s);c.lineCap='round';
  // legs: three pairs, alternate tripods
  const ph=t*7;[[-22,-1],[0,1],[22,-1]].forEach(([lx,sg],i)=>{[-1,1].forEach(side=>{
    const sw=Math.sin(ph+(i%2?Math.PI:0)+(side<0?Math.PI:0))*6,kx=lx+sw*.5,ky=side*26,fx=lx+sw+(i-1)*14,fy=side*44;
    K.sline(c,[[lx,side*8],[kx,ky],[fx,fy]],'#4a3220',5);K.sline(c,[[lx,side*8],[kx,ky],[fx,fy]],'#8a6440',2);});});
  // antennae
  const aw=Math.sin(t*2.3)*5;[-1,1].forEach(side=>K.sline(c,[[-58,side*5],[-76,side*16+aw*side],[-92,side*26+aw]],'#8a6440',3));
  // abdomen, thorax, head
  K.ellipse(c,24,0,36,23,'#5a3d22','#c08a52',2.5);K.sline(c,[[-8,0],[58,0]],'rgba(20,12,6,.6)',2);
  K.ellipse(c,16,-9,20,6,'rgba(255,230,190,.22)',null,0,-.1);
  K.ellipse(c,-24,0,15,15,'#6b4a2b','#c08a52',2.5);
  K.ellipse(c,-50,0,11,10,'#6b4a2b','#c08a52',2.5);
  const jw=3*Math.sin(t*6);[-1,1].forEach(side=>K.sline(c,[[-58,side*4],[-66,side*(7+jw)],[-64,side*1]],'#e7c08a',2.5));
  circle(c,-53,-5,2.2,'#f2ecd9',null);circle(c,-53,5,2.2,'#f2ecd9',null);
  c.restore();
}

// ── pictures ─────────────────────────────────────────────────────────────────
const LEAF={x:50,y:64,w:300,h:460},LEAFPIC=['EC7_leaf_green.png','EC7_leaf_brown.png','EC7_leaf_skeleton.png'];
const lr=f=>K.fitRect(f,LEAF.x,LEAF.y,LEAF.w,LEAF.h);
const LR=lr('EC7_leaf_brown.png'),lp=(fx,fy)=>[LR.x+fx*LR.w,LR.y+fy*LR.h];
const SOILR=K.fitRect('EC7_leaf_soil.png',40,290,320,200),GROUND=430;
// clear light grey pixels connected to transparency (the cut-out fringe); one pass per picture, cached
const CLEAN={},CLEANOPT={'EC7_leaf_green.png':[170,50],'EC7_leaf_brown.png':[170,60],'EC7_leaf_soil.png':[140,45]};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;const o=CLEANOPT[file];if(!o)return(CLEAN[file]=im);
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,m=new Uint8Array(n),q=new Int32Array(n);let h=0,e=0;
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
      if(a[j+3]<20){m[i]=2;q[e++]=i;}else if((r+gg+b)/3>o[0]&&mx-mn<o[1])m[i]=1;}
    while(h<e){const i=q[h++],x=i%W;const nb=[x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W];
      for(const k of nb)if(k>=0&&k<n&&m[k]===1){m[k]=3;a[k*4+3]=0;q[e++]=k;}}
    g.putImageData(d,0,0);CLEAN[file]=cv;}catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r){const cv=cleaned(file);if(cv)c.drawImage(cv,r.x,r.y,r.w,r.h);else K.drawIn(c,file,r);}
// the leaf at stage i (0..2), optional sway (rotation about the stem end) and drop
function leaf(c,i,{rot=0,dy=0}={}){const f=LEAFPIC[i],r=lr(f),px=r.x+r.w*.5,py=r.y+r.h;
  c.save();c.translate(px,py+dy);c.rotate(rot);c.translate(-px,-py);picIn(c,f,r);c.restore();}
function stageTag(c,k){tag(c,L(['leafWhole','leafHoles','leafVeins','leafSoil'][k],...[['完整落葉','Whole leaf'],['斑點與破洞','Spots and holes'],['只剩葉脈','Only veins left'],['變成腐植質','Becomes humus']][k]),LEAF.x+LEAF.w/2,12,{al:'center',col:WHITE,active:true});}

// right-hand layout shared by steps 1 and 2
const CARD1={x:436,y:70,w:230,h:190},CARD2={x:436,y:290,w:230,h:170},BR={x:684,y0:74,y1:456,py:196};

// ── step 0 · whole leaf ─────────────────────────────────────────────────────
const SPARK=(()=>{const r=K.rng(5),a=[];for(let i=0;i<14;i++)a.push({x:.22+r()*.56,y:.18+r()*.55,ph:r()*6.28});return a;})();
function step0(c,tau,t){
  const fall=ease(tau/1.8),rot=(1-fall)*.25*Math.sin(tau*4)+.03*Math.sin(t*1.2);
  withA(c,fin(tau,0,.5),()=>leaf(c,0,{rot,dy:-(1-fall)*70}));
  withA(c,fin(tau,1.8),()=>SPARK.forEach(s=>{const tw=.5+.5*Math.sin(t*2.2+s.ph),[x,y]=lp(s.x,s.y);glow(c,x,y,10,YELLOW,.6*tw);circle(c,x,y,2.8,'#fff7c2',null);}));
  withA(c,fin(tau,.2),()=>stageTag(c,0));
  // carbon-containing food -> the leaf
  withA(c,fin(tau,2.2),()=>{const p=tag(c,L('organic','含碳的養分','Carbon-containing food'),CARD1.x,170,{col:YELLOW,maxX:CW-12});
    const [ex,ey]=lp(.72,.36);growArrow(c,p.x-8,p.cy,ex,ey,fin(tau,2.4,.6),YELLOW,3.5);pulseRing(c,p,t);});
  // where next?
  withA(c,fin(tau,3),()=>{const x=640,y=370,r=58+4*Math.sin(t*2);glow(c,x,y,r*1.5,WHITE,.14);circle(c,x,y,r,'rgba(11,26,21,.9)',WHITE,3);K.pulse(c,x,y,t,WHITE,r-8);
    c.save();c.font=K.FONT(72);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+4);c.restore();});
}

// ── step 1 · broken up ──────────────────────────────────────────────────────
// crumbs leave the leaf edges, fall and join a pile under the leaf
const CRUMB=(()=>{const r=K.rng(41),a=[];for(let i=0;i<16;i++){const right=i%2===0,fy=.28+r()*.44;
  a.push({right,fy,ph:r(),drift:(right?1:-1)*(8+r()*26),sz:4+r()*5,rot:r()*6,spin:(r()-.5)*6,col:['#8b5a2b','#a0703c','#6f4524'][i%3]});}return a;})();
const PILE=(()=>{const r=K.rng(9),a=[];for(let i=0;i<34;i++){const u=r()*2-1;a.push({x:200+u*120,y:532-(1-Math.abs(u))*10*r(),sz:3+r()*5,rot:r()*6,col:['#8b5a2b','#a0703c','#6f4524'][i%3],d:r()});}return a;})();
function crumb(c,x,y,sz,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.moveTo(-sz,-sz*.6);c.lineTo(sz*.8,-sz*.8);c.lineTo(sz,sz*.5);c.lineTo(-sz*.4,sz*.9);c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='rgba(242,236,217,.35)';c.lineWidth=1;c.stroke();c.restore();}
function step1(c,tau,t){
  withA(c,fin(tau,0,.4),()=>leaf(c,1));
  withA(c,fin(tau,.2),()=>stageTag(c,1));
  // pile under the leaf grows
  const pg=fin(tau,1.2,4);PILE.forEach(p=>{if(p.d<pg)crumb(c,p.x,p.y,p.sz,p.rot,p.col);});
  // falling crumbs (looping)
  if(tau>1)CRUMB.forEach(q=>{const u=mod(t*.38+q.ph);const fx=q.right?(q.fy<.5?.94:.93):(q.fy<.5?.06:.07),[x0,y0]=lp(fx,q.fy),yEnd=528;
    const x=x0+q.drift*ease(u*1.4),y=y0+(yEnd-y0)*u*u;withA(c,Math.min(1,(1-u)*5)*fin(tau,1),()=>crumb(c,x,y,q.sz,q.rot+q.spin*u,q.col));});
  // actors
  const ends=[lp(.95,.36),lp(.96,.6)];
  withA(c,fin(tau,.6),()=>card(c,CARD1,'animals_ai_1023/earthworm.png',L('earthworm','蚯蚓','Earthworm'),{glowA:.5+.3*Math.sin(t*2),glowCol:ORANGE,t}));
  withA(c,fin(tau,1),()=>card(c,CARD2,r=>insect(c,r,t),T.insect,{glowA:.5+.3*Math.sin(t*2+1),glowCol:ORANGE,t}));
  [[CARD1,ends[0],1.3],[CARD2,ends[1],1.6]].forEach(([r,[ex,ey],d],i)=>withA(c,fin(tau,d,.3),()=>{
    growArrow(c,r.x-6,r.y+r.h/2,ex+4,ey,fin(tau,d,.6),ORANGE,4);
    if(tau>d+.6){K.pulse(c,ex,ey,t+i*.6,ORANGE,6);dots(c,r.x-6,r.y+r.h/2,ex+4,ey,t+i*.5,ORANGE,{speed:.6,r:3.5,core:'#ffe1c4'});}}));
  roleBlock(c,tau,t,L('scavenger','腐食動物','Detritus feeder'),L('chewed','被拆碎','Broken into pieces'),ORANGE,2.2);
}

// ── step 2 · decomposed ─────────────────────────────────────────────────────
// hyphae: branching threads in leaf fractions, growing from the right edge (where the mushroom arrow lands)
const HY=(()=>{const r=K.rng(77),out=[];
  function grow(x,y,a,len,depth,start){const pts=[[x,y]];let cx=x,cy=y,ang=a;const n=8;
    for(let i=0;i<n;i++){ang+=(r()-.5)*.6;cx+=Math.cos(ang)*len/n;cy+=Math.sin(ang)*len/n*.55;pts.push([cx,cy]);}
    out.push({pts,start});if(depth>0)for(let b=0;b<2;b++){const i=2+Math.floor(r()*5);grow(pts[i][0],pts[i][1],ang+(b?.9:-.9)+(r()-.5)*.4,len*.62,depth-1,start+(i/n)*.5);}}
  grow(.92,.3,Math.PI+.35,.62,2,0);grow(.95,.52,Math.PI-.05,.66,2,.15);grow(.86,.7,Math.PI-.45,.5,2,.3);
  return out;})();
const BACSPOT=[.32,.6],BACS=(()=>{const r=K.rng(13),a=[];for(let i=0;i<9;i++){const an=r()*6.28,d=Math.sqrt(r())*20;a.push({x:Math.cos(an)*d,y:Math.sin(an)*d,ang:r()*3.14,ph:r()*6.28,rod:i%3!==0});}return a;})();
function step2(c,tau,t){
  withA(c,fin(tau,0,.4),()=>leaf(c,2));
  withA(c,fin(tau,.2),()=>stageTag(c,2));
  // hyphae grow over the leaf (cyan), tips glow
  const g=clamp((tau-1.2)/4.5);
  c.save();c.beginPath();c.ellipse(...lp(.5,.45),LR.w*.47,LR.h*.42,0,0,K.TAU);c.clip();
  HY.forEach(h=>{const u=clamp((g-h.start)/(1-h.start)*1.15);if(u<=0)return;const n=h.pts.length-1,f=u*n,i=Math.floor(f);
    const pts=h.pts.slice(0,i+1).map(p=>lp(...p));if(i<n)pts.push(lp(...K.lerpP(h.pts[i],h.pts[i+1],f-i)));if(pts.length<2)return;
    K.sline(c,pts,'rgba(11,26,21,.45)',3.6);K.sline(c,pts,CYAN,2);const tip=pts[pts.length-1];glow(c,tip[0],tip[1],9,CYAN,.55+.35*Math.sin(t*3+h.start*9));});
  c.restore();
  // bacteria working on the leaf: a ring with tiny wobbling rods
  const [bx,by]=lp(...BACSPOT);
  withA(c,fin(tau,1.6),()=>{circle(c,bx,by,28,'rgba(11,26,21,.55)',CYAN,3);
    BACS.forEach(b=>{const x=bx+b.x+2*Math.sin(t*1.4+b.ph),y=by+b.y+2*Math.cos(t*1.2+b.ph);
      if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.3*Math.sin(t+b.ph));c.beginPath();c.roundRect(-5,-2,10,4,2);c.fillStyle='#7fe9d0';c.fill();c.restore();}else circle(c,x,y,2.6,'#a7f3d0',null);});});
  // actors
  withA(c,fin(tau,.6),()=>card(c,CARD1,'fungi_ai_1022/shiitake.png',L('fungi','蕈類（真菌）','Mushrooms (fungi)'),{glowA:.5+.3*Math.sin(t*2),glowCol:CYAN,t}));
  withA(c,fin(tau,1),()=>{card(c,CARD2,r=>bacteria(c,r.x+r.w/2,r.y+r.h/2,Math.min(r.w,r.h)/2-2,t),L('bacteria','細菌','Bacteria'),{glowA:.5+.3*Math.sin(t*2+1),glowCol:CYAN,t});
    text(c,L('schematic','示意','Schematic'),CARD2.x+CARD2.w/2,CARD2.y+CARD2.h+30,22,MUTED,'center');});
  const ends=[lp(.93,.31),[bx+30,by-6]];
  [[CARD1,ends[0],1.3],[CARD2,ends[1],1.7]].forEach(([r,[ex,ey],d],i)=>withA(c,fin(tau,d,.3),()=>{
    growArrow(c,r.x-6,r.y+r.h/2,ex+4,ey,fin(tau,d,.6),CYAN,4);
    if(tau>d+.6)dots(c,r.x-6,r.y+r.h/2,ex+4,ey,t+i*.5,CYAN,{speed:.6,r:3.5,core:'#d9fbff'});}));
  roleBlock(c,tau,t,L('decomposer','分解者','Decomposer'),L('digested','被分解吸收','Digested and absorbed'),CYAN,2.4);
}

// ── step 3 · back to soil ───────────────────────────────────────────────────
const SOILDOT=(()=>{const r=K.rng(3),a=[];for(let i=0;i<70;i++)a.push({x:24+r()*912,y:GROUND+8+r()*90,r:1.5+r()*3,c:i%3?'#6e4d30':'#86613d'});return a;})();
const SEED={x:730,top:300};
// nutrient route: humus -> soil -> root tip -> stem base -> up the stem
const ROUTE=[[300,470],[460,476],[600,486],[704,500],[722,478],[730,GROUND],[730,SEED.top+20]];
const rlen=(()=>{let s=0;const a=[0];for(let i=1;i<ROUTE.length;i++){s+=Math.hypot(ROUTE[i][0]-ROUTE[i-1][0],ROUTE[i][1]-ROUTE[i-1][1]);a.push(s);}return a;})();
function routeAt(u){const d=u*rlen[rlen.length-1];let i=1;while(i<rlen.length-1&&rlen[i]<d)i++;const f=(d-rlen[i-1])/(rlen[i]-rlen[i-1]);return K.lerpP(ROUTE[i-1],ROUTE[i],clamp(f));}
function soilBand(c){
  c.save();c.beginPath();c.moveTo(20,GROUND);for(let x=20;x<=940;x+=40)c.lineTo(x,GROUND+3*Math.sin(x*.07));c.lineTo(940,530);c.lineTo(20,530);c.closePath();
  const gr=c.createLinearGradient(0,GROUND,0,530);gr.addColorStop(0,'#5b3f27');gr.addColorStop(1,'#3f2b1b');c.fillStyle=gr;c.fill();c.strokeStyle='#8a6440';c.lineWidth=2;c.stroke();c.clip();
  SOILDOT.forEach(p=>circle(c,p.x,p.y,p.r,p.c,null));c.restore();
}
function seedling(c,t,g){
  const {x,top}=SEED,sw=5*Math.sin(t*1.3),h=(GROUND-top)*g,tx=x+sw*g,ty=GROUND-h;
  // roots (below ground)
  const rg=clamp(g*1.4);[[[x,GROUND],[x+2,GROUND+40],[x-4,GROUND+78]],[[x,GROUND+18],[x-22,GROUND+44],[x-38,GROUND+66]],[[x,GROUND+22],[x+24,GROUND+48],[x+34,GROUND+74]],[[x+1,GROUND+46],[x-14,GROUND+62]]].forEach(r=>{
    const pts=r.map(p=>[x+(p[0]-x),GROUND+(p[1]-GROUND)*rg]);K.sline(c,pts,'#e8d6a8',3);});
  if(g<=.02)return;
  c.save();c.lineCap='round';c.beginPath();c.moveTo(x,GROUND);c.quadraticCurveTo(x,GROUND-h*.5,tx,ty);c.strokeStyle=GREEN;c.lineWidth=5;c.stroke();c.restore();
  const lf=(px,py,dir,s)=>{K.ellipse(c,px+dir*22*s,py-6*s,24*s,10*s,'#4ade80','#bbf7d0',1.5,dir*-.45);};
  if(g>.4){const m=K.bez([x,GROUND],[x,GROUND-h*.5],[tx,ty],.55);lf(m[0],m[1],-1,.9);lf(m[0],m[1],1,.75);}
  lf(tx,ty+4,-1,1.1);lf(tx,ty+4,1,1.1);
}
function step3(c,tau,t){
  withA(c,fin(tau,0,.5),()=>soilBand(c));
  // the humus pile sinks a little into the soil
  const sink=8*ease((tau-.4)/2);
  withA(c,fin(tau,0,.5),()=>picIn(c,'EC7_leaf_soil.png',{x:SOILR.x,y:SOILR.y+sink,w:SOILR.w,h:SOILR.h}));
  withA(c,fin(tau,.2),()=>stageTag(c,3));
  withA(c,fin(tau,.8),()=>tag(c,L('humus','腐植質','Humus'),LEAF.x+LEAF.w/2,SOILR.y-30,{al:'center',col:C.sand}));
  withA(c,fin(tau,1),()=>tag(c,L('soil','土壤','Soil'),CW-16,486,{al:'right',col:C.sand}));
  // seedling grows, roots spread
  withA(c,fin(tau,.8),()=>seedling(c,t,ease((tau-.8)/2.2)));
  withA(c,fin(tau,2.2),()=>{tag(c,T.seedling,SEED.x+44,SEED.top-10,{col:GREEN});tag(c,T.roots,SEED.x+44,GROUND+12,{col:'#e8d6a8',maxX:CW-12});});
  // nutrients: arrow through the soil + dots along the route into the roots and up the stem
  withA(c,fin(tau,2.6),()=>{growArrow(c,330,458,650,474,fin(tau,2.6,.8),NUT,4.5);
    if(tau>3.2)for(let q=0;q<6;q++){const u=mod(t*.16+q/6),[x,y]=routeAt(u);withA(c,Math.min(1,Math.sin(u*Math.PI)*2),()=>{glow(c,x,y,16,NUT,.85);circle(c,x,y,5.5,'#f4ffd6',null);});}});
  withA(c,fin(tau,3),()=>{const p=tag(c,L('nutrientsBack','養分回到土裡','Nutrients return to the soil'),490,482,{al:'center',col:NUT,maxX:SEED.x-60});pulseRing(c,p,t,NUT);});
  // the loop closes: the plant's leaves will fall again (dashed, moving), "matter does not vanish" on top
  withA(c,fin(tau,4),()=>{const A=[SEED.x-30,SEED.top-30],Cc=[480,40],B=[300,SOILR.y-4],g=fin(tau,4,1);
    const pts=[];for(let i=0;i<=40*g;i++)pts.push(K.bez(A,Cc,B,i/40));
    if(pts.length>2){c.save();c.setLineDash([10,9]);c.lineDashOffset=-t*26;K.sline(c,pts.slice(0,-1),rgba(NUT,.8),3);c.restore();const q=pts[pts.length-1],r=pts[pts.length-3];K.arrow(c,r[0],r[1],q[0],q[1],rgba(NUT,.9),3);}
    withA(c,fin(tau,4.6),()=>{const m=K.bez(A,Cc,B,.5),p=tag(c,T.noVanish,m[0],m[1]-22,{al:'center',col:WHITE,active:true,size:24});pulseRing(c,p,t,WHITE);});});
}

// ── progress rail ───────────────────────────────────────────────────────────
const RAIL={y:570,xs:[60,290,520,750]};
function rail(c,k,t){
  const {y,xs}=RAIL;
  // connectors run from the end of each label to the next marker
  for(let i=0;i<3;i++){const x0=xs[i]+22+measure(c,T.rail[i],22)+10,x1=xs[i+1]-18;if(x1>x0+4)K.sline(c,[[x0,y],[x1,y]],i<k?rgba(YELLOW,.8):rgba(MUTED,.45),3);}
  xs.forEach((x,i)=>{const on=i===k,done=i<k;
    if(on)K.pulse(c,x,y,t,YELLOW,17);
    circle(c,x,y,15,on?YELLOW:done?rgba(YELLOW,.55):'#16332b',on?C.ink:done?YELLOW:rgba(MUTED,.7),2);
    c.save();c.font=K.MONO(22);c.fillStyle=on||done?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.restore();
    text(c,T.rail[i],x+22,y+8,22,on?YELLOW:MUTED,'left');});
}

// ── frame ──────────────────────────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3];
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.leafdecay||(s.leafdecay={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,u=st.from>=0?smooth(clamp(tau/MOVE)):1;
  if(u<1)withA(c,1-u,()=>STEPS[st.from](c,99,t));
  withA(c,st.from>=0?u:1,()=>STEPS[k](c,st.from>=0?Math.max(0,tau-MOVE*.5):tau,t));
  rail(c,k,t);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,34,22,MUTED,'right');
}
window.EcologyDraw.leafdecay=draw;
})();
