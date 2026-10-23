/* Ecology lesson 2 · "arrow" canvas (food-links tab, view 0), 2026-10-23. Which way does a food-chain arrow point?
 * A clean "basic idea" scene on the plain chalkboard (no paddy backdrop), big picture cards.
 * Pictures (K.SIZE): EC6_eagle 536x874, EC6_snake 847x559, EC3_rice 590x1096, EC4_grasshopper 788x446, EC5_frog 657x581.
 * PIL: all five are cut out (transparent corners) and the subject reaches every edge, so they are fitted by full size.
 * Three steps, 8 s each; s.shown = step. Elements carry the step range they live in, so a step change fades only what changes.
 *  0 chase: eagle card (left) swoops slowly toward the snake card (right) and back; dashed orange arrow eagle->snake,
 *    marching dashes, pill "chase direction". The eagle picture is mirrored so it faces the snake.
 *  1 same scene: the chase arrow fades to a faint ghost (pill kept, faint) for comparison; a solid white arrow grows
 *    snake->eagle with yellow dots flowing along it; "eaten" pill over the snake, "eater" pill over the eagle (pulsing),
 *    "arrow direction" pill over the arrow, "matter and energy pass to the eater" under it.
 *  2 a food chain: rice, grasshopper, frog, snake cards in a row; arrows appear one by one (eaten -> eater), dots flow;
 *    "eaten"/"eater" pills over the two ends of the first arrow; "producer" under the rice; "food chain" bracket below.
 * Every label comes from K.LAB (fallbacks only if a label were missing).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE='#f2ecd9',YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;

// ── layout ────────────────────────────────────────────────────────────────
// steps 0-1: two big cards; the middle column (x 280..660) carries the arrows and their labels.
const EAGLE={x:40,y:140,w:240,h:360,pic:'EC6_eagle.png',id:'eagle'};
const SNAKE={x:660,y:140,w:260,h:360,pic:'EC6_snake.png',id:'snake'};
const SWOOP=70,SWOOP_DY=14,SWOOP_T=4.6;      // eagle card: px toward the snake, px down, seconds per swoop
const Y_CHASE=250,Y_FOOD=362,MID=470;        // arrow heights, middle-column centre
// step 2: four cards in a row
const CH={y:150,w:176,h:280,gap:72,x0:20};
const CHAIN=[{id:'rice',pic:'EC3_rice.png'},{id:'grasshopper',pic:'EC4_grasshopper.png'},{id:'frog',pic:'EC5_frog.png'},{id:'snake',pic:'EC6_snake.png'}];
const NAMES={rice:['水稻','Rice'],grasshopper:['蚱蜢','Grasshopper'],frog:['澤蛙','Paddy field frog'],snake:['黑眉錦蛇','Black-browed ratsnake'],eagle:['大冠鷲','Crested serpent eagle']};
const nameOf=id=>L(id,...NAMES[id]);

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
// centred, wrapped name; returns the number of rows
function nameRows(c,p,w,size){return K.splitLines(c,D.tr(p),w,size);}
// a picture card: rounded panel, picture in the upper part, the name (1-2 rows) at the bottom
function card(c,r,id,pic,{size=24,glowA=0,t=0,nameCol=WHITE,flip=false}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.62,YELLOW,.2+.06*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,16,'rgba(28,61,52,.95)',rgba(WHITE,.42));
  const rows=nameRows(c,nameOf(id),r.w-20,size),lh=Math.round(size*1.25),nameH=rows.length*lh+14;
  const ph=r.h-nameH-18;
  if(id==='rice')[[-.2,.86],[.2,.86],[0,1]].forEach(([dx,s])=>K.place(c,pic,r.x+r.w/2+dx*r.w-r.w*.18,r.y+10+ph*(1-s),r.w*.36,ph*s));
  else K.place(c,pic,r.x+10,r.y+10,r.w-20,ph,{flip});
  rows.forEach((row,i)=>text(c,row,r.x+r.w/2,r.y+r.h-nameH+lh*(i+1)-4,size,nameCol,'center'));
  return r;
}
// straight arrow from p0 to p2 drawn up to fraction g (head at the tip)
function sArrow(c,p0,p2,g,col,w){
  if(g<=0.01)return;
  const tip=[mix(p0[0],p2[0],g),mix(p0[1],p2[1],g)],a=Math.atan2(p2[1]-p0[1],p2[0]-p0[0]),len=Math.hypot(tip[0]-p0[0],tip[1]-p0[1]),hl=Math.max(9,Math.min(20,len*.4)),hw=hl*.62;
  const base=[tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)];
  if(len>hl*.7)K.sline(c,[p0,base],col,w);
  c.save();c.beginPath();c.moveTo(tip[0],tip[1]);c.lineTo(tip[0]-hl*Math.cos(a)+hw*Math.sin(a),tip[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(tip[0]-hl*Math.cos(a)-hw*Math.sin(a),tip[1]-hl*Math.sin(a)+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
// dashed arrow with marching dashes
function dArrow(c,p0,p2,col,w,off){
  const a=Math.atan2(p2[1]-p0[1],p2[0]-p0[0]),hl=20,hw=13,base=[p2[0]-hl*.8*Math.cos(a),p2[1]-hl*.8*Math.sin(a)];
  c.save();c.lineCap='round';c.setLineDash([16,12]);c.lineDashOffset=-off;c.beginPath();c.moveTo(...p0);c.lineTo(...base);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();
  c.save();c.beginPath();c.moveTo(p2[0],p2[1]);c.lineTo(p2[0]-hl*Math.cos(a)+hw*Math.sin(a),p2[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(p2[0]-hl*Math.cos(a)-hw*Math.sin(a),p2[1]-hl*Math.sin(a)+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
// yellow energy dots flowing from p0 (eaten) to p2 (eater)
function flow(c,p0,p2,t,a,px=70,big=false){
  const len=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),n=Math.max(1,Math.round(len/110)),speed=Math.min(.9,px/len),gr=big?15:Math.min(12,4+len/9),r=big?6:len<70?3.5:4.5;
  for(let q=0;q<n;q++){const u=mod(t*speed+q/n),p=[mix(p0[0],p2[0],u*.86),mix(p0[1],p2[1],u*.86)];
    withA(c,a*Math.sin(u*Math.PI),()=>{glow(c,p[0],p[1],gr,YELLOW,.7);circle(c,p[0],p[1],r,'#fff7c2',null);});}
}

// ── frame ─────────────────────────────────────────────────────────────────
// alpha of an element that appears in step s0 (after delay d) and stays up to step s1, seen at step k, tau s into it
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.arrowSt||(s.arrowSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;st.dx=0;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.dx0=st.dx||0;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // element alpha with the new step's timing; anything leaving fades out over MOVE.
  // A scene that is coming back in (steps 0-1 <-> step 2) waits for the old scene to leave first.
  const sceneChange=st.from>=0&&((st.from<2)!==(k<2)),lag=sceneChange?MOVE*.85:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d+lag,s1)*(sceneChange?ease((tau-lag)/.7):1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,u);};

  // ── steps 0-1: eagle and snake ──
  const cardsA=A(0,0,1);
  if(cardsA>0){
    // eagle swoop (step 0); in step 1 it settles back from wherever it was
    let dx=0;
    if(k===0){const w=.5-.5*Math.cos(TAU_*tau/SWOOP_T);dx=w;}else if(k===1)dx=(st.from===0?st.dx0:0)*(1-smooth(tau/.9));
    st.dx=dx;
    const ex=EAGLE.x+SWOOP*dx,ey=EAGLE.y+SWOOP_DY*dx;
    const eR={x:ex,y:ey,w:EAGLE.w,h:EAGLE.h},sR={x:SNAKE.x,y:SNAKE.y,w:SNAKE.w,h:SNAKE.h};
    const chaseFull=A(0,.3,0),chaseGhost=A(1,0,1)*.4,chase=Math.max(chaseFull,chaseGhost);
    const food=A(1,.5,1),fg=k===1?clamp((tau-.5-lag)/1.1):1,grow=moving&&st.from===1?1:ease(fg);
    withA(c,cardsA,()=>{
      // chase arrow (eagle -> snake) and its pill
      withA(c,chase,()=>{
        dArrow(c,[eR.x+eR.w+10,Y_CHASE],[sR.x-12,Y_CHASE],ORANGE,5,t*26);
        tag(c,L('chase','追逐方向','Chase direction'),MID,Y_CHASE-68,{al:'center',col:ORANGE});
      });
      // food arrow (snake -> eagle), solid white, with flowing energy dots
      withA(c,food,()=>{
        const p0=[sR.x-12,Y_FOOD],p2=[EAGLE.x+EAGLE.w+12,Y_FOOD];
        glow(c,MID,Y_FOOD,150,WHITE,.05+.03*Math.sin(t*2));
        sArrow(c,p0,p2,grow,WHITE,7);
        if(grow>.98)flow(c,p0,p2,t,k===1&&!moving?clamp((tau-1.6-lag)/.5):1,95,true);
        const pd=tag(c,L('arrowDir','箭頭方向','Arrow direction'),MID,Y_FOOD-62,{al:'center',col:WHITE,active:true});
        withA(c,.5,()=>pulseRing(c,pd,t+.4,WHITE));
        K.wrap(c,L('matterEnergy','物質與能量傳向取食者','Matter and energy pass to the eater'),MID,Y_FOOD+56,260,22,YELLOW,28,'center');
      });
      card(c,eR,'eagle',EAGLE.pic,{t,glowA:food*.7,flip:true}); // mirrored so it faces the snake
      card(c,sR,'snake',SNAKE.pic,{t,glowA:food*.35});
      // eaten / eater pills over the two cards
      const lab=A(1,1.2,1);
      withA(c,lab,()=>{
        const pe=tag(c,L('eaten','被吃','Eaten'),SNAKE.x+SNAKE.w/2,SNAKE.y-56,{al:'center',col:WHITE,active:true});
        const pr=tag(c,L('eater','吃的','Eater'),EAGLE.x+EAGLE.w/2,EAGLE.y-56,{al:'center',col:YELLOW,active:true});
        pulseRing(c,pe,t,WHITE);pulseRing(c,pr,t+.7,YELLOW);
      });
    });
  }

  // ── step 2: a food chain ──
  const chainA=A(2,0,2);
  if(chainA>0)withA(c,chainA,()=>{
    const R=CHAIN.map((n,i)=>({x:CH.x0+i*(CH.w+CH.gap),y:CH.y,w:CH.w,h:CH.h}));
    // arrows first (under nothing), one after another
    CHAIN.slice(0,3).forEach((n,i)=>{
      const d=1.3+i*1.0,a=A(2,d,2);if(a<=0)return;
      const g=k===2&&!(moving&&st.from===2)?clamp((tau-d-lag)/.6):1,p0=[R[i].x+R[i].w+6,CH.y+CH.h*.45],p2=[R[i+1].x-8,CH.y+CH.h*.45];
      withA(c,a,()=>{sArrow(c,p0,p2,ease(g),WHITE,6);if(g>=1)flow(c,p0,p2,t+i*.6,clamp((tau-d-lag-.6)/.5),45);});
    });
    CHAIN.forEach((n,i)=>{const a=A(2,.15+i*.25,2);const lit=k===2?clamp(1-Math.abs(tau-lag-(1.3+i)-.3)/1.2):0;
      withA(c,a,()=>card(c,R[i],n.id,n.pic,{size:22,t,glowA:lit*.8,nameCol:n.id==='rice'?GREEN:WHITE}));});
    // eaten / eater at the two ends of the first arrow
    withA(c,A(2,2.0,2),()=>{
      const pe=tag(c,L('eaten','被吃','Eaten'),R[0].x+R[0].w/2,CH.y-54,{al:'center',col:WHITE,active:true});
      const pr=tag(c,L('eater','吃的','Eater'),R[1].x+R[1].w/2,CH.y-54,{al:'center',col:YELLOW,active:true});
      pulseRing(c,pe,t,WHITE);pulseRing(c,pr,t+.7,YELLOW);
    });
    // producer under the rice
    withA(c,A(2,.6,2),()=>tag(c,L('producer','生產者','Producer'),R[0].x+R[0].w/2,CH.y+CH.h+14,{al:'center',col:GREEN}));
    // food chain bracket under the whole row
    withA(c,A(2,4.4,2),()=>{
      const y=CH.y+CH.h+82,xa=R[0].x+10,xb=R[3].x+R[3].w-10,pu=.5+.5*Math.sin(t*2.2);
      K.sline(c,[[xa,y-16],[xa,y],[xb,y],[xb,y-16]],rgba(WHITE,.75),3);
      const p=tag(c,L('foodChain','食物鏈','Food chain'),(xa+xb)/2,y-22,{al:'center',col:WHITE,active:true,size:26});
      withA(c,.4+.3*pu,()=>pulseRing(c,p,t,YELLOW));
    });
  });

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
const TAU_=Math.PI*2;
window.EcologyDraw.arrow=draw;
})();
