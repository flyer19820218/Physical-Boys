/* Ecology lesson 4 · "settle" canvas (schoolyard tab, view 2), 2026-10-24. Closing animation of the unit:
 * a crucian carp "wants to move" and passes three gates: conditions, food, neighbours (one line each, no re-teaching).
 * Pictures (K.SIZE): EC14b_crucian 1003x587 (faces right; mouth measured at picture (999,335) = offset (.496,.07) of the size
 * from the centre), EC14a_daphnia 783x974. The three habitats, signs, marks and cards are drawn by program.
 * A gate track runs along the top in steps 0-2 (current gate lit yellow, passed gates green with a drawn tick).
 * Four steps, 8 s each; s.shown = step. The fish position is eased toward each step's target, so it never jumps.
 *  0 conditions: three habitat cards (still pond, rapid water, dried-up pond); the fish visits each one: calm in the pond (tick),
 *    tossed about in the rapids (question mark), the dried-up pond (cross); it returns to the pond.
 *  1 food: the pond card grows into the whole stage; water fleas drift; the fish eats two of them (schematic);
 *    tick + "Something it can eat"; "Sizes are not real sizes".
 *  2 neighbours: two cards with names and signs only: competitor (crucian − / competitor −), natural enemy (enemy + / crucian −);
 *    legend "+ Gains, − Harmed" with the symbols written out (green #4ade80 gains, orange #fb923c harmed).
 *  3 all three: the gate track moves to the centre and grows; each gate pulses in turn; "Can settle" stamp; the closing sentence.
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const WANTS=P('想搬家','Wants to move'),EAT_OK=P('有牠能吃的','Something it can eat');
const GAIN=P('得益','Gains'),HARM=P('受害','Harmed');
const CLOSING=P('換個環境，誰能住下來？先看這三件事','In a new place, who can settle? First check these three things');
const N=4,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN='#4ade80',ORANGE='#fb923c',CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',CARD_BG='#1c3d34';

// ── helpers (same look as the fairtest / evidence / oxygen views) ──────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dashLine(c,a,b,col,t,w=2.5){c.save();c.lineCap='round';c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
function tick(c,x,y,r,col,w=4){K.sline(c,[[x-r*.45,y+r*.02],[x-r*.12,y+r*.34],[x+r*.5,y-r*.36]],col,w);}
function cross(c,x,y,r,col,w=4){K.sline(c,[[x-r*.38,y-r*.38],[x+r*.38,y+r*.38]],col,w);K.sline(c,[[x+r*.38,y-r*.38],[x-r*.38,y+r*.38]],col,w);}
// verdict mark: 'ok' tick, 'no' cross, 'q' question mark; e = pop-in 0..1
function mark(c,x,y,type,e,t,r=24){if(e<=0)return;const col=type==='ok'?GREEN:type==='no'?ORANGE:YELLOW,s=.4+.6*ease(e)+.25*Math.sin(Math.PI*clamp(e))*(1-clamp(e));
  c.save();c.translate(x,y);c.scale(s,s);
  if(e>=1){const u=mod(t*.7);circle(c,0,0,r+4+u*12,null,rgba(col,.75*(1-u)),3);}
  circle(c,0,0,r,FILL,col,3.5);
  if(type==='ok')tick(c,0,0,r,col,5);else if(type==='no')cross(c,0,0,r,col,5);else text(c,P('?','?'),0,10,28,col,'center');
  c.restore();}
// + / − sign in a coloured disc (the symbol itself is written, colour is only a second cue)
function sign(c,x,y,plus,r=19){const col=plus?GREEN:ORANGE;circle(c,x,y,r,col,WHITE,2.5);
  K.sline(c,[[x-r*.5,y],[x+r*.5,y]],C.deep,5);if(plus)K.sline(c,[[x,y-r*.5],[x,y+r*.5]],C.deep,5);}

// ── layout ────────────────────────────────────────────────────────────────
const CARD=[{x:226,y:130,w:226,h:260},{x:470,y:130,w:226,h:260},{x:714,y:130,w:226,h:260}];
const STAGE={x:20,y:84,w:920,h:436};
const cc=i=>[CARD[i].x+CARD[i].w/2,CARD[i].y+CARD[i].h/2];
const LAYR=[CARD[0],STAGE,STAGE,STAGE];
const FWK=[110,150,140,130];                                 // fish width per step
const START=[110,270];
const mixR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const rnd=K.rng(1025);
const DAPH=[[560,300],[720,400],[800,200],[130,300],[380,180]].map(([x,y],i)=>({x,y,ph:i*1.7}));
const DW=46,DH=DW*974/783;
const daphAt=(d,t)=>[d.x+14*Math.sin(t*.55+d.ph),d.y+10*Math.sin(t*.8+d.ph*1.3)];
const EAT=[2.2,4.0];                                           // step 1: daphnia 0 and 1 are eaten from these times
const STREAK=Array.from({length:22},()=>({x:rnd(),y:.18+.74*rnd(),v:.7+.9*rnd(),l:26+34*rnd(),a:(rnd()-.5)*1.2}));
const CRACK=Array.from({length:9},()=>{const x=rnd(),y=.3+.6*rnd(),pts=[[x,y]];let a=rnd()*6.28;for(let j=0;j<4;j++){a+=(rnd()-.5)*1.4;const p=pts[pts.length-1];pts.push([p[0]+Math.cos(a)*.12,p[1]+Math.sin(a)*.09]);}return pts;});

// ── habitat drawings ──────────────────────────────────────────────────────
function plants(c,r,t,n){
  const base=r.y+r.h*.9;
  for(let i=0;i<n;i++){const fx=n===1?.5:.1+.8*i/(n-1),x=r.x+r.w*fx,h=r.h*(.2+.06*Math.sin(i*2.3));
    for(let j=-1;j<=1;j++){const sw=Math.sin(t*1.1+i+j)*r.w*.012,tip=[x+j*r.w*.02+sw*2,base-h*(1-.15*Math.abs(j))],m=[x+j*r.w*.008+sw,base-h*.5];
      c.save();c.lineCap='round';c.beginPath();c.moveTo(x,base+4);c.quadraticCurveTo(...m,...tip);c.strokeStyle='#1f6b3a';c.lineWidth=Math.max(5,r.w*.012);c.stroke();
      c.strokeStyle=rgba(GREEN,.85);c.lineWidth=Math.max(3,r.w*.006);c.stroke();c.restore();}}
}
function pond(c,r,t){
  c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,14);c.clip();
  c.fillStyle='#173a33';c.fillRect(r.x,r.y,r.w,r.h);
  const sy=r.y+r.h*.12;
  const g=c.createLinearGradient(0,sy,0,r.y+r.h);g.addColorStop(0,'rgba(85,233,255,.30)');g.addColorStop(1,'rgba(23,80,111,.70)');
  c.fillStyle=g;c.fillRect(r.x,sy,r.w,r.h);
  // calm ripples on the surface
  for(let i=0;i<3;i++){const u=mod(t*.25+i/3),x=r.x+r.w*(.2+.3*i);K.ellipse(c,x,sy+2,8+u*r.w*.12,2+u*4,null,rgba(WHITE,.55*(1-u)),2);}
  c.beginPath();for(let x=r.x;x<=r.x+r.w;x+=8){const y=sy+1.5*Math.sin(x*.04+t*1.4);x===r.x?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(WHITE,.7);c.lineWidth=2.5;c.stroke();
  // soft light bands drifting slowly
  for(let i=0;i<4;i++){const x=r.x+mod(i*.27+t*.02,1)*r.w;c.fillStyle=rgba(WHITE,.035);c.beginPath();c.moveTo(x,sy);c.lineTo(x+r.w*.06,sy);c.lineTo(x+r.w*.02,r.y+r.h*.85);c.lineTo(x-r.w*.04,r.y+r.h*.85);c.fill();}
  c.fillStyle='#5b5038';c.fillRect(r.x,r.y+r.h*.9,r.w,r.h*.1);
  plants(c,r,t,r.w>400?7:3);
  c.restore();
}
function rapids(c,r,t){
  c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,14);c.clip();
  const g=c.createLinearGradient(0,r.y,0,r.y+r.h);g.addColorStop(0,'rgba(85,233,255,.42)');g.addColorStop(1,'rgba(23,80,111,.85)');
  c.fillStyle='#173a33';c.fillRect(r.x,r.y,r.w,r.h);c.fillStyle=g;c.fillRect(r.x,r.y,r.w,r.h);
  // rocks
  for(const [fx,fy,rx,ry] of [[.2,.9,.16,.08],[.62,.93,.2,.08],[.92,.88,.12,.07],[.45,.55,.08,.05]])K.ellipse(c,r.x+fx*r.w,r.y+fy*r.h,rx*r.w,ry*r.h,'#6f6a5e','#3e3a33',2);
  // water rushing in many directions
  c.save();c.lineCap='round';
  STREAK.forEach((s,i)=>{const x=r.x-40+mod(s.x*(r.w+80)+t*s.v*240,r.w+80),y=r.y+s.y*r.h+12*Math.sin(t*4+i),a=s.a+.5*Math.sin(t*3+i);
    c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*s.l,y+Math.sin(a)*s.l);c.strokeStyle=rgba(WHITE,.75);c.lineWidth=3;c.stroke();});
  for(let i=0;i<2;i++){const cx=r.x+r.w*(.3+.4*i),cy=r.y+r.h*(.35+.25*i),rr=r.w*.09,a=t*5*(i?-1:1);
    c.beginPath();c.arc(cx,cy,rr,a,a+Math.PI*1.3);c.strokeStyle=rgba(WHITE,.8);c.lineWidth=3;c.stroke();
    const e=a+Math.PI*1.3,ex=cx+Math.cos(e)*rr,ey=cy+Math.sin(e)*rr,tx=-Math.sin(e)*(i?-1:1),ty=Math.cos(e)*(i?-1:1);K.arrow(c,ex-tx*8,ey-ty*8,ex+tx*4,ey+ty*4,rgba(WHITE,.85),3);}
  c.restore();
  for(let x=r.x+6;x<r.x+r.w;x+=11)circle(c,x,r.y+r.h*.06+3*Math.sin(x*.3+t*8),3+2*Math.abs(Math.sin(x*.2+t*6)),rgba(WHITE,.8));
  c.restore();
}
function dry(c,r,t){
  c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,14);c.clip();
  const g=c.createLinearGradient(0,r.y,0,r.y+r.h);g.addColorStop(0,'#5a4e36');g.addColorStop(.25,'#8a7550');g.addColorStop(1,'#6b5a3c');
  c.fillStyle=g;c.fillRect(r.x,r.y,r.w,r.h);
  glow(c,r.x+r.w*.2,r.y+r.h*.12,r.w*.35,YELLOW,.35+.08*Math.sin(t*2));
  // dried-up hollow and cracks
  K.ellipse(c,r.x+r.w*.5,r.y+r.h*.66,r.w*.4,r.h*.18,'rgba(60,48,30,.55)','#4a3c26',2.5);
  c.save();c.lineCap='round';c.lineJoin='round';
  for(const pts of CRACK){c.beginPath();pts.forEach(([fx,fy],i)=>{const x=r.x+fx*r.w,y=r.y+fy*r.h;i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle='#33281a';c.lineWidth=3;c.stroke();}
  c.restore();
  // heat shimmer rising
  for(let i=0;i<3;i++){const u=mod(t*.45+i/3),x=r.x+r.w*(.25+.25*i),y=r.y+r.h*(.8-.5*u);
    c.beginPath();for(let j=0;j<=12;j++){const yy=y-j*4;const xx=x+5*Math.sin(j*.9+t*5);j?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle=rgba(YELLOW,.55*Math.sin(Math.PI*u));c.lineWidth=2.5;c.stroke();}
  c.restore();
}
function fish(c,x,y,w,sx,rot){
  const h=w*587/1003;c.save();c.translate(x,y);c.rotate(rot);c.scale(sx,1);K.drawIn(c,'EC14b_crucian.png',{x:-w/2,y:-h/2,w,h});c.restore();
}

// ── gate track (top in steps 0-2, centre in step 3) ──────────────────────────
const GATES=[['gateCondition','條件','Conditions'],['gateFood','食物','Food'],['gateNeighbour','鄰居','Neighbours']];
function trackRects(c,big){
  if(big)return[180,480,780].map(x=>({x:x-135,y:128,w:270,h:96}));
  const ws=GATES.map(g=>measure(c,L(...g),24)+28+40),gap=44,tot=ws.reduce((a,b)=>a+b,0)+gap*2;let x=CW/2-tot/2;
  return ws.map(w=>{const r={x,y:16,w,h:42};x+=w+gap;return r;});
}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.seSt||(s.seSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,T=tau,mv=clamp(tau/MOVE),moving=st.from>=0&&mv<1,u=moving?smooth(mv):1;
  const OUT=.45,D0=st.from>=0?OUT:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau-D0,s0,d,s1);if(st.from<0||tau>=OUT)return now;return Math.max(now,vis(st.from,9,s0,0,s1)*(1-smooth(tau/OUT)));};

  // ── fish target for this step ──
  const FW=FWK[k];let tx,ty;
  if(k===0){
    if(T<.9)[tx,ty]=START;else if(T<2.4)[tx,ty]=cc(0);else if(T<4.0)[tx,ty]=cc(1);else if(T<5.4)[tx,ty]=cc(2);
    else{[tx,ty]=cc(0);tx+=26*Math.sin(t*.6);}
    ty+=4*Math.sin(t*1.3);
  }else if(k===1){
    const FH=FW*587/1003,eatPos=i=>{const [x,y]=daphAt(DAPH[i],t);return[x-FW*.48,y-FH*.07];};
    if(T<.9)[tx,ty]=[260,300];else if(T<EAT[0]+.4)[tx,ty]=eatPos(0);else if(T<EAT[1]+.4)[tx,ty]=eatPos(1);
    else{tx=400+200*Math.sin((T-EAT[1])*.35+Math.PI);ty=320+26*Math.sin(t*.8);}
  }else if(k===2){tx=480+40*Math.sin(t*.5);ty=372+8*Math.sin(t*1.1);}
  else{tx=480+290*Math.sin(t*.3);ty=482+5*Math.sin(t*1.2);}
  const dt=t-(st.lt??t);st.lt=t;
  if(st.fx===undefined||dt<0||dt>.6){st.fx=tx;st.fy=ty;st.fw=FW;st.face=1;st.sx=1;st.vx=0;}
  else{const e=r=>1-Math.exp(-dt*r),ox=st.fx;st.fx+=(tx-st.fx)*e(k===1?4.5:3.2);st.fy+=(ty-st.fy)*e(3.2);st.fw+=(FW-st.fw)*e(4);
    st.vx=dt>0?(st.fx-ox)/dt:0;if(st.vx>24)st.face=1;else if(st.vx<-24)st.face=-1;st.sx+=(st.face-st.sx)*e(8);}
  // tossed about in the rapids (step 0 only)
  const [r1x,r1y]=cc(1),wob=A(0,0,0)*clamp(1.4-Math.hypot(st.fx-r1x,st.fy-r1y)/60);
  const fx=st.fx+wob*16*Math.sin(t*5.3),fy=st.fy+wob*12*Math.sin(t*6.7),rot=Math.sin(t*3.2)*.025+wob*.4*Math.sin(t*7.1);
  const fw=st.fw,fh=fw*587/1003,sx=Math.abs(st.sx)<.12?.12*Math.sign(st.sx||1):st.sx;
  const mouth=[fx+sx*fw*.496,fy+fh*.07];

  // ── habitats ──
  const PR=mixR(moving?LAYR[st.from]:LAYR[k],LAYR[k],u);
  pond(c,PR,t);
  const a0=A(0,0,0);
  withA(c,a0,()=>{rapids(c,CARD[1],t);dry(c,CARD[2],t);});
  // highlight the card the fish is at (step 0)
  withA(c,a0,()=>CARD.forEach((r,i)=>{const [x,y]=cc(i),near=clamp(1.3-Math.hypot(st.fx-x,st.fy-y)/70);
    D.round(c,r.x,r.y,r.w,r.h,14,null,near>.05?rgba(i===0?GREEN:i===1?YELLOW:ORANGE,.4+.6*near):rgba(WHITE,.35));}));
  D.round(c,PR.x,PR.y,PR.w,PR.h,14,null,rgba(WHITE,.35));
  withA(c,A(3,0,3),()=>D.round(c,STAGE.x,STAGE.y,STAGE.w,STAGE.h,14,'rgba(17,38,31,.62)'));

  // ── water fleas (steps 1-3) ──
  const aD=A(1,.2,3);
  if(aD>0)DAPH.forEach((d,i)=>{let a=aD*(k>=2?.75:1);
    if(i<2){if(k===1)a*=1-clamp((T-EAT[i])/.4);else a=0;}
    if(k===3)a*=i===3||i===2?.8:.5;
    if(a<=.01)return;const [x,y]=daphAt(d,t);
    c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(.15*Math.sin(t*1.5+d.ph));K.drawIn(c,'EC14a_daphnia.png',{x:-DW/2,y:-DH/2,w:DW,h:DH});c.restore();});
  // eating burst
  if(k===1)EAT.forEach(te=>{const q=(T-te)/.7;if(q>0&&q<1)for(let j=0;j<6;j++){const g=j/6*Math.PI*2;circle(c,mouth[0]+Math.cos(g)*(6+22*q),mouth[1]+Math.sin(g)*(6+18*q),3.5*(1-q),rgba(WHITE,.9*(1-q)));}});

  // ── fish ──
  fish(c,fx,fy,fw,sx,rot);

  // ── track ──
  {const big=k===3?1:0,fromBig=moving?(st.from===3?1:0):big,ub=mix(fromBig,big,u);
    const RT=trackRects(c,false),RB=trackRects(c,true),cyc=Math.floor(mod((T-.8)/1.1,3));
    const rs=RT.map((r,i)=>mixR(r,RB[i],ub));
    // connectors
    for(let i=0;i<2;i++){const a=rs[i],b=rs[i+1];dashLine(c,[a.x+a.w+6,a.y+a.h/2],[b.x-6,b.y+b.h/2],rgba(WHITE,.6),t,2.5);}
    const PASS=[6.0,2.8,4.4];
    rs.forEach((r,i)=>{
      const passed=k===3||i<k||(i===k&&T>=PASS[i]),cur=i===k&&k<3,hot=k===3&&T>.8&&cyc===i;
      const pe=k===3?1:i<k?1:i===k?clamp((T-PASS[i])/.4):0;
      const col=passed?GREEN:cur?YELLOW:MUTED,fill=cur&&!passed?YELLOW:hot?rgba(GREEN,.95):CARD_BG;
      if(hot)glow(c,r.x+r.w/2,r.y+r.h/2,r.w*.45,GREEN,.22);
      D.round(c,r.x,r.y,r.w,r.h,Math.min(r.h/2,18+ (r.h/2-18)*(1-ub)),fill,passed||cur?col:rgba(MUTED,.7));
      const cr=mix(13,26,ub),cx=r.x+12+cr,cy=r.y+r.h/2,dark=(cur&&!passed)||hot;
      circle(c,cx,cy,cr,dark?C.deep:'rgba(11,26,21,.9)',dark?WHITE:col,2.5);
      if(pe>0)withA(c,pe,()=>tick(c,cx,cy,cr,GREEN,mix(3.5,6,ub)));
      let size=Math.round(mix(24,32,ub));const avail=r.w-(cx+cr-r.x)-mix(18,34,ub),p=L(...GATES[i]);
      while(size>22&&measure(c,p,size)>avail)size--;
      text(c,p,(cx+cr+r.x+r.w)/2,cy+size*.36,size,dark?C.deep:passed||cur?WHITE:MUTED,'center');
      if(cur&&!passed&&k<3)pulseRing(c,r,t,YELLOW);
    });}

  // ── step 0: conditions ──
  withA(c,A(0,.2,0)*(k===0?1-clamp((T-2)/.5):0),()=>{tag(c,WANTS,START[0],186,{al:'center',col:YELLOW,active:true});});
  withA(c,A(0,0,0),()=>{
    const lab=[L('pond','池塘','Pond'),L('rapids','湍急的水','Rapid water'),L('dryPond','乾涸的池塘','Dried-up pond')],col=[GREEN,YELLOW,ORANGE];
    CARD.forEach((r,i)=>{const p=tag(c,lab[i],r.x+r.w/2,r.y+r.h+12,{al:'center',col:col[i],active:i===0&&(k!==0||T>=6),minX:r.x-8,maxX:Math.min(CW-4,r.x+r.w+8)});
      if(i===0&&(k!==0||T>=6))pulseRing(c,p,t,GREEN);});
    const TM=[2.0,3.6,5.0],TY=['ok','q','no'];
    CARD.forEach((r,i)=>mark(c,r.x+r.w-32,r.y+32,TY[i],k===0?clamp((T-TM[i])/.35):1,t));
  });

  // ── fish name (steps 0-2) ──
  withA(c,A(0,0,2),()=>{tag(c,L('crucian','鯽魚','Crucian carp'),fx,fy+fh/2+6,{al:'center',col:SAND,minX:STAGE.x+8,maxX:STAGE.x+STAGE.w-8});});

  // ── step 1: food ──
  withA(c,A(1,.6,1),()=>{const [x,y]=daphAt(DAPH[2],t),p=tag(c,L('daphnia','水蚤','Water flea'),x,y-DH/2-52,{al:'center',col:CYAN});
    dashLine(c,[p.x+p.w/2,p.y+p.h],[x,y-DH/2-4],rgba(CYAN,.9),t);});
  withA(c,A(1,2.8,1),()=>{mark(c,STAGE.x+46,486,'ok',k===1?clamp((T-2.8)/.35):1,t,22);
    const p=tag(c,EAT_OK,STAGE.x+80,466,{col:GREEN,active:true});});
  withA(c,A(1,.3,1),()=>{text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),CW/2,562,22,MUTED,'center');});

  // ── step 2: neighbours ──
  const NB=[{r:{x:44,y:104,w:300,h:156},title:L('competitor','競爭者','Competitor'),rows:[[L('crucian','鯽魚','Crucian carp'),false],[L('competitor','競爭者','Competitor'),false]],d:.6},
            {r:{x:616,y:104,w:300,h:156},title:L('enemy','天敵','Natural enemy'),rows:[[L('enemy','天敵','Natural enemy'),true],[L('crucian','鯽魚','Crucian carp'),false]],d:1.8}];
  NB.forEach((n,i)=>withA(c,A(2,n.d,2),()=>{
    const e=k===2?ease(clamp((T-n.d)/.6)):1,r={...n.r,y:n.r.y+(1-e)*20};
    dashLine(c,[r.x+r.w/2,r.y+r.h],[fx+(i?1:-1)*fw*.25,fy-fh*.3],rgba(i?ORANGE:YELLOW,.85),t,3);
    D.round(c,r.x,r.y,r.w,r.h,14,CARD_BG,rgba(i?ORANGE:YELLOW,.85));
    tag(c,n.title,r.x+r.w/2,r.y+10,{al:'center',col:i?ORANGE:YELLOW,active:true,minX:r.x+6,maxX:r.x+r.w-6});
    n.rows.forEach(([p,plus],j)=>{const y=r.y+80+j*44;sign(c,r.x+40,y,plus);text(c,p,r.x+72,y+8,22,WHITE,'left');
      if(k===2&&T>n.d+1){const uu=mod(t*.6+j*.5+i*.3);circle(c,r.x+40,y,19+uu*10,null,rgba(plus?GREEN:ORANGE,.7*(1-uu)),2.5);}});
  }));
  withA(c,A(2,3.0,2),()=>{
    const it=[[true,GAIN],[false,HARM]],ws=it.map(([,p])=>measure(c,p,22)+56),tot=ws[0]+ws[1]+28;let x=CW/2-tot/2;
    D.round(c,x-16,530,tot+32,46,23,FILL,rgba(WHITE,.6));
    it.forEach(([plus,p],j)=>{sign(c,x+18,553,plus,16);text(c,p,x+44,561,22,plus?GREEN:ORANGE,'left');x+=ws[j]+28;});
  });

  // ── step 3: all three ──
  withA(c,A(3,2.2,3),()=>{const e=k===3?clamp((T-2.2)/.4):1,p=L('settleHere','住得下來','Can settle'),w=measure(c,p,30)+48,h=52,sc=1+.5*(1-ease(e));
    c.save();c.translate(CW/2,272);c.rotate(-.04);c.scale(sc,sc);
    D.round(c,-w/2,-h/2,w,h,h/2,GREEN,WHITE);text(c,p,0,11,30,C.deep,'center');c.restore();
    if(e>=1){const uu=mod(t*.7);D.round(c,CW/2-w/2-6*uu,272-h/2-6*uu,w+12*uu,h+12*uu,h/2+6*uu,null,rgba(GREEN,.8*(1-uu)));}});
  withA(c,A(3,3.0,3),()=>{const rows=K.splitLines(c,D.tr(CLOSING),700,28),lh=40,ph=rows.length*lh+28,py=322;
    D.round(c,110,py,740,ph,16,CARD_BG,rgba(YELLOW,.8));
    K.wrap(c,CLOSING,CW/2,py+14+lh/2+10,700,28,YELLOW,lh,'center');});

  // ── notes ──
  tag(c,L('schematic','示意','Schematic'),STAGE.x,530,{col:MUTED});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.settle=draw;
})();
