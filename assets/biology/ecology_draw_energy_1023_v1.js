/* Ecology lesson 2 · "energy" canvas (energy-flow tab, view 0), 2026-10-23.
 * Energy passed up the chain rice -> grasshopper -> frog -> snake, starting from 8000 schematic units (K.enVals(s.eff)).
 * Layout (one scene for all five steps):
 *   left  stage panel (x 10..604): the part of the chain this step is about, drawn large.
 *   right ladder panel (x 616..950): the four levels bottom-up (rice at the bottom), each a small picture + name,
 *         a yellow energy bar and the real number. Bar length = square root of the value (1 and 8000 differ too much),
 *         marked "schematic scale" under the bars. Rows fill in as the steps go; the current row glows.
 * Pictures (K.SIZE): EC3_rice 590x1096, EC4_grasshopper 788x446, EC5_frog 657x581, EC6_snake 847x559; PIL: all four are
 * opaque to their edges in alpha, so they are fitted by their full size. Sun, light, heat sparkles, arrows: drawn here.
 * Five steps, 7 s each; s.shown = step.
 *  0 sunlight in: sun bottom-left, wavy light rays with photons to the rice; "light energy", "photosynthesis",
 *    "chemical energy in food"; yellow sparkles inside the rice; ladder row "rice 8000" grows.
 *  1-3 one transfer each (rice->grasshopper, grasshopper->frog, frog->snake): eaten card left, eater card right,
 *    a Sankey-like arrow: thick yellow in, at the branch point it splits into up (orange, "heat from respiration",
 *    heat sparkles float up), down (brown trunk with "uneaten parts" and "waste", into "goes to detritus, for decomposers")
 *    and right (thin yellow, "passed on about N %"). Yellow dots stream in; eff/5 of every 20 go on, the rest turn
 *    orange or brown. Arrow widths and the number of dots that go on follow s.eff.
 *  4 compare all: the four cards as a staircase with yellow arrows thinning upwards, heat sparkles rising from every
 *    level to "heat lost", a big "one way" arrow, and "about N %: a common estimate, not a fixed value".
 * s.eff (5, 10, 20) is read every frame: numbers, bar lengths, arrow widths and dot ratios change at once. The step
 * fades and the bar growth use this module's own step clock, so changing s.eff never replays them.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle,stageClock}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=7,CW=960,MOVE=1;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,GREEN=C.green,GREY='#9fb3a8',BROWN='#c28b5b',BROWN_D='#7a5235',MONO=K.MONO;
const PICS=['EC3_rice.png','EC4_grasshopper.png','EC5_frog.png','EC6_snake.png'];
const KEYS=[['rice','水稻','Rice'],['grasshopper','蚱蜢','Grasshopper'],['frog','澤蛙','Paddy field frog'],['snake','黑眉錦蛇','Black-browed ratsnake']];
const nameOf=j=>L(...KEYS[j]);
const vals=e=>(K.enVals?K.enVals(e):[8000,8000*e/100,8000*(e/100)**2,8000*(e/100)**3]);
const START=()=>K.EN_START||8000;

// ── new labels (not in LAB yet) ────────────────────────────────────────────
const SCALE=P(`刻度示意：條長用平方根`,`Schematic scale: bar length is a square root`);

// composed from LAB pieces
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1),low=s=>s.charAt(0).toLowerCase()+s.slice(1);
const ab=()=>L('about','約','about');
const aboutP=e=>P(`${ab()[0]} ${e}%`,`${cap(ab()[1])} ${e}%`);
const effP=e=>{const f=L('eff','傳遞比例','Transfer fraction');return P(`${f[0]} ${ab()[0]} ${e}%`,`${f[1]}: ${ab()[1]} ${e}%`);};
const passP=e=>{const f=L('transfer','傳到下一層','Passed on');return P(`${f[0]} ${ab()[0]} ${e}%`,`${f[1]}: ${ab()[1]} ${e}%`);};
const noteP=e=>{const f=L('notFixed','常用的估計，不是固定值','A common estimate, not a fixed value');return P(`${ab()[0]} ${e}%：${f[0]}`,`${cap(ab()[1])} ${e}%: ${low(f[1])}`);};
const pairP=(a,b)=>P(`${a[0]} → ${b[0]}`,`${a[1]} → ${b[1]}`);
const numP=v=>{const u=L('unit','單位','units');return P(`${v} ${u[0]}`,`${v} ${u[1]}`);};

// ── geometry ───────────────────────────────────────────────────────────────
const SX=10,SY=64,SW=594,SH=526;                       // stage panel
const RX=616,RY=64,RW=334,RH=526;                      // ladder panel
const ROW0=RY+50,RSTEP=92,BX=RX+12,BMAX=226,BH=26;     // ladder rows (rice is the bottom row)
const rowY=j=>ROW0+(3-j)*RSTEP;
// steps 1-3
const CA={x:24,y:228,w:190,h:150},CB={x:396,y:228,w:190,h:150};
const AY=303,BPX=305,IN_X=CA.x+CA.w+8,OUT_X=CB.x-8;     // transfer arrow y, branch point x
const HEAT_TOP=118,TRUNK_BOT=528;
// step 4 staircase
const C4=[0,1,2,3].map(j=>({x:20+j*148,y:272})),W4=108,H4=90;

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=SX+6,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function card(c,j,x,y,w,h,{glowA=0,t=0,pad=8}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,x+w/2,y+h/2,Math.max(w,h)*.75,YELLOW,.16+.05*Math.sin(t*2.4)));
  D.round(c,x,y,w,h,14,'#1c3d34',rgba(WHITE,.35));
  K.place(c,PICS[j],x+pad,y+pad,w-pad*2,h-pad*2);
}
function nameUnder(c,j,cx,y,maxW,col=WHITE){K.wrap(c,nameOf(j),cx,y,maxW,22,col,28,'center');}
// a filled band arrow (Sankey style) along a polyline-free straight segment
function band(c,x1,y1,x2,y2,w,col,head=true){
  const a=Math.atan2(y2-y1,x2-x1),hl=head?Math.max(12,w*1.1):0,hw=Math.max(w*.95,8);
  const ex=x2-hl*Math.cos(a),ey=y2-hl*Math.sin(a);
  K.sline(c,[[x1,y1],[ex,ey]],col,w);
  if(head){c.save();c.beginPath();c.moveTo(x2,y2);c.lineTo(ex+hw*Math.sin(a),ey-hw*Math.cos(a));c.lineTo(ex-hw*Math.sin(a),ey+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();}
}
function sun(c,x,y,r,t){
  glow(c,x,y,r*2.4,YELLOW,.35+.08*Math.sin(t*1.8));
  c.save();c.translate(x,y);c.rotate(t*.25);c.lineCap='round';
  for(let i=0;i<12;i++){const a=i*Math.PI/6,l=r*(1.28+.12*Math.sin(t*3+i));c.beginPath();c.moveTo(Math.cos(a)*r*1.08,Math.sin(a)*r*1.08);c.lineTo(Math.cos(a)*l,Math.sin(a)*l);c.strokeStyle=YELLOW;c.lineWidth=4;c.stroke();}
  c.restore();circle(c,x,y,r,YELLOW,'#fff3a6',3);
}
// a rising heat spark: small orange flame-like dot that wiggles and fades
function spark(c,x,y,a,r=5){withA(c,a,()=>{glow(c,x,y,r*3,ORANGE,.5);circle(c,x,y,r,ORANGE,null);});}
function wavy(c,x1,y1,x2,y2,col,w,t,amp=6,ph=0){
  const n=24,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,pts=[];
  for(let i=0;i<=n;i++){const u=i/n,s=Math.sin(u*len/18-t*6+ph)*amp*Math.sin(u*Math.PI);pts.push([x1+dx*u+nx*s,y1+dy*u+ny*s]);}
  K.sline(c,pts,col,w);
}

// ── ladder (right) ─────────────────────────────────────────────────────────
function ladder(c,k,e,t,grow){
  D.round(c,RX,RY,RW,RH,16,'#16332b',C.edge);
  text(c,L('energyUnits','能量（示意單位）','Energy (schematic units)'),RX+14,RY+34,22,YELLOW);
  const v=vals(e),top=START();
  for(let j=3;j>=0;j--){
    const ry=rowY(j),shown=j<=Math.min(k,3),active=k===4||j===k,g=j===Math.min(k,3)&&k<4?grow:1;
    if(active)withA(c,1,()=>{const pu=.5+.5*Math.sin(t*2.6);D.round(c,RX+5,ry-6,RW-10,RSTEP-8,12,rgba(YELLOW,.06+.05*pu),rgba(YELLOW,.55+.3*pu));});
    K.place(c,PICS[j],RX+10,ry+2,56,38);
    text(c,nameOf(j),RX+74,ry+30,22,shown?WHITE:GREY);
    D.round(c,BX,ry+44,BMAX,BH,8,'rgba(11,26,21,.7)',rgba(GREY,.45));
    if(shown){
      const len=Math.max(4,BMAX*Math.sqrt(v[j]/top))*g;
      if(len>0.5){D.round(c,BX,ry+44,len,BH,Math.min(8,len/2),YELLOW,null);
        // a light sheen running along the bar so the held step still moves
        const sx=BX+mod(t*.35+j*.27)*Math.max(len,8);withA(c,.55,()=>{c.save();c.beginPath();c.roundRect(BX,ry+44,len,BH,Math.min(8,len/2));c.clip();glow(c,sx,ry+44+BH/2,22,WHITE,.6);c.restore();});}
      withA(c,clamp(g*1.5),()=>text(c,String(v[j]),RX+RW-12,ry+68,26,YELLOW,'right',MONO));
    }else text(c,'?',RX+RW-12,ry+68,26,GREY,'right',MONO);
  }
  K.wrap(c,SCALE,RX+14,RY+RH-78,RW-28,22,C.muted,28);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),RX+14,RY+RH-14,22,C.muted);
}

// ── header pills (top band) ────────────────────────────────────────────────
function header(c,k,e,a,t){withA(c,a,()=>{
  let p;
  if(k===0)p=tag(c,L('sunlightIn','陽光進來','Sunlight in'),SX,10,{col:YELLOW,active:true,size:26});
  else if(k<4)p=tag(c,pairP(nameOf(k-1),nameOf(k)),SX,10,{col:YELLOW,active:true,size:26});
  else p=tag(c,pairP(L('sunlightIn','陽光進來','Sunlight in'),L('heatOut','熱散失','Heat lost')),SX,10,{col:YELLOW,active:true,size:26});
  glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.55,YELLOW,.1+.05*Math.sin(t*2.2));
  if(k>0)tag(c,effP(e),p.x+p.w+14,13,{col:YELLOW});
});}

// ── step 0: sunlight into rice ─────────────────────────────────────────────
const SUN0=[120,432],RICE0={x:340,y:124,w:210,h:330},RAYS=[[400,220],[418,300],[428,380]];
function stage0(c,tau,t,e){
  sun(c,SUN0[0],SUN0[1],40+2*Math.sin(t*2),t);
  tag(c,L('sun','陽光','Sunlight'),SUN0[0],500,{al:'center',col:YELLOW});
  // rays + photons
  RAYS.forEach(([x,y],i)=>{const a=Math.atan2(y-SUN0[1],x-SUN0[0]),x0=SUN0[0]+Math.cos(a)*62,y0=SUN0[1]+Math.sin(a)*62;
    withA(c,.85,()=>wavy(c,x0,y0,x,y,rgba(YELLOW,.75),3,t,5,i*2));
    for(let q=0;q<3;q++){const u=mod(t*.45+q/3+i*.13);const px=mix(x0,x,u),py=mix(y0,y,u);withA(c,Math.sin(u*Math.PI),()=>{glow(c,px,py,14,YELLOW,.7);circle(c,px,py,4.5,YELLOW,null);});}});
  tag(c,L('light','光能','Light energy'),225,250,{al:'center',col:YELLOW});
  // rice with chemical energy sparkles
  const r=K.fitRect(PICS[0],RICE0.x,RICE0.y,RICE0.w,RICE0.h);
  glow(c,r.x+r.w/2,r.y+r.h*.45,r.h*.55,GREEN,.12+.04*Math.sin(t*1.6));
  K.drawIn(c,PICS[0],r);
  const rr=K.rng(41);for(let q=0;q<14;q++){const fx=.25+rr()*.5,fy=.1+rr()*.6,ph=rr()*6.28,a=clamp(fade(tau,1.2+q*.08))*(.4+.6*Math.abs(Math.sin(t*1.7+ph)));
    withA(c,a,()=>{const x=r.x+fx*r.w,y=r.y+fy*r.h;glow(c,x,y,10,YELLOW,.8);circle(c,x,y,3,YELLOW,null);});}
  text(c,nameOf(0),RICE0.x+RICE0.w/2,486,22,WHITE,'center');
  tag(c,L('photosynthesis','光合作用','Photosynthesis'),RICE0.x+RICE0.w/2,74,{al:'center',col:GREEN});
  withA(c,fade(tau,1.0),()=>{const p=tag(c,L('chemE','食物中的化學能','Chemical energy in food'),RICE0.x+RICE0.w/2,516,{al:'center',col:YELLOW,active:true,maxX:SX+SW-6});
    pulseRing(c,p,t);});
}
const fade=(tau,t0,d=.6)=>clamp((tau-t0)/d);
function pulseRing(c,p,t){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(YELLOW,.8*(1-u)));}

// ── steps 1-3: one transfer ────────────────────────────────────────────────
function stageT(c,k,tau,t,e){
  const v=vals(e),from=k-1,to=k,f=e/100;
  const wIn=18,wOn=Math.max(3,wIn*Math.sqrt(f)),rest=wIn-wOn,wHeat=Math.max(4,rest*.5),wDet=Math.max(4,rest*.5);
  // cards
  card(c,from,CA.x,CA.y,CA.w,CA.h,{glowA:0,t});
  const bIn=fade(tau,1.4,.7);
  withA(c,.35+.65*bIn,()=>card(c,to,CB.x,CB.y,CB.w,CB.h,{glowA:bIn,t}));
  nameUnder(c,from,CA.x+CA.w/2,CA.y+CA.h+24,CA.w);
  nameUnder(c,to,CB.x+CB.w/2,CB.y+CB.h+24,CB.w);
  // numbers above cards
  numAbove(c,v[from],CA.x+CA.w/2,216,1,YELLOW);
  withA(c,bIn,()=>numAbove(c,v[to],CB.x+CB.w/2,216,1,YELLOW));
  withA(c,1-bIn,()=>text(c,'?',CB.x+CB.w/2,216,30,GREY,'center',MONO));
  // Sankey arrow: in, heat up, detritus down, on to the eater
  band(c,IN_X,AY,BPX+wIn*.2,AY,wIn,rgba(YELLOW,.8),false);
  c.save();c.lineCap='round';
  band(c,BPX,AY-wIn*.3,BPX,HEAT_TOP,wHeat,rgba(ORANGE,.75));
  band(c,BPX,AY+wIn*.3,BPX,TRUNK_BOT,wDet,rgba(BROWN,.7));
  band(c,BPX,AY,OUT_X,AY,wOn,rgba(YELLOW,.95));
  c.restore();
  // moving dots
  dots(c,t,e);
  // heat sparks above
  for(let q=0;q<9;q++){const u=mod(t*.35+q/9),x=BPX+Math.sin(t*2.2+q*1.9)*(18+u*26),y=HEAT_TOP-6-u*40;spark(c,x,y,(1-u)*.9,4+2*(1-u));}
  tag(c,L('heat','呼吸散熱','Heat from respiration'),BPX-18,128,{al:'right',col:ORANGE});
  // detritus labels
  const yl=452;
  tag(c,L('uneaten','沒被吃到的部分','Uneaten parts'),BPX-14,yl,{al:'right',col:BROWN});
  tag(c,L('feces','排遺','Waste'),BPX+14,yl,{col:BROWN});
  const pile=tag(c,L('detritus','進入碎屑，給分解者','Goes to detritus, for decomposers'),BPX,TRUNK_BOT+2,{al:'center',col:BROWN,fill:'rgba(70,45,28,.95)',maxX:SX+SW-6});
  // a little detritus heap glimmer inside the pile pill border
  withA(c,.5+.3*Math.sin(t*2),()=>{c.save();c.lineWidth=2;c.strokeStyle=BROWN;c.beginPath();c.roundRect(pile.x-3,pile.y-3,pile.w+6,pile.h+6,(pile.h+6)/2);c.stroke();c.restore();});
  // passed on
  withA(c,.4+.6*bIn,()=>tag(c,passP(e),CB.x+CB.w/2,150,{al:'center',col:YELLOW,maxX:SX+SW-6}));
}
function numAbove(c,val,cx,y,a,col){
  const s=String(val),u=L('unit','單位','units'),sw=measure(c,s,30,MONO),uw=measure(c,u,22),x=cx-(sw+8+uw)/2;
  text(c,s,x,y,30,col,'left',MONO);text(c,u,x+sw+8,y,22,col);
}
// yellow dots stream in; eff/5 of every 20 go on (yellow), the others turn orange (up) or brown (down)
const DT=.13;
function dots(c,t,e){
  const nOn=Math.round(e/5),n1=Math.floor(t/DT);
  for(let n=n1-24;n<=n1;n++){
    if(n<0)continue;const age=t-n*DT,m=mod(n,20);
    const route=m<nOn?'on':(m%2?'heat':'det');
    let x,y,col=YELLOW,a=1,r=5;
    const T1=.55;
    if(age<T1){const u=age/T1;x=mix(IN_X,BPX,u);y=AY+Math.sin(n*1.7)*4;}
    else{const u=(age-T1)/1.6;if(u>1)continue;
      if(route==='on'){x=mix(BPX,OUT_X-6,u);y=AY;r=6;a=1;}
      else if(route==='heat'){x=BPX+Math.sin(age*9+n)*6;y=mix(AY,HEAT_TOP+4,u);col=ORANGE;a=1-u*.3;}
      else{x=BPX+Math.sin(age*5+n)*3;y=mix(AY,TRUNK_BOT-4,u);col=BROWN;a=1-u*.3;}}
    withA(c,a,()=>{if(col===YELLOW){glow(c,x,y,r*2.6,YELLOW,.55);circle(c,x,y,r,'#fff7c2',null);}else circle(c,x,y,r,col,C.deep,1.5);});
  }
}

// ── step 4: compare all ────────────────────────────────────────────────────
function stage4(c,tau,t,e){
  const v=vals(e),top=START();
  // big one-way arrow under the row
  const OY=478;
  band(c,34,OY,590,OY,22,rgba(YELLOW,.28));
  for(let q=0;q<5;q++){const u=mod(t*.2+q/5),x=mix(44,566,u);withA(c,Math.sin(u*Math.PI),()=>glow(c,x,OY,16,YELLOW,.75));}
  tag(c,L('oneWay','單向','One way'),SX+SW/2,OY-20,{al:'center',col:YELLOW,active:true});
  // arrows between levels, thinner each step up
  for(let j=0;j<3;j++){const a=C4[j],b=C4[j+1],w=Math.min(14,Math.max(3,14*Math.sqrt(v[j+1]/v[0])*2.2));
    const x1=a.x+W4+3,x2=b.x-3,y=a.y+H4/2;
    band(c,x1,y,x2,y,w,rgba(YELLOW,.95));}
  // cards, names, numbers, heat rising from every level
  C4.forEach((p,j)=>{
    for(let q=0;q<4;q++){const u=mod(t*.4+q/4+j*.21),x=p.x+W4/2+(q-1.5)*20+Math.sin(t*2+q*2+j)*(6+u*10),y=p.y-40-u*100;spark(c,x,y,(1-u)*.85,3.5+1.5*(1-u));}
    card(c,j,p.x,p.y,W4,H4,{glowA:.6,t,pad:6});
    nameUnder(c,j,p.x+W4/2,p.y+H4+26,150);
    text(c,String(v[j]),p.x+W4/2,p.y-10,26,YELLOW,'center',MONO);
  });
  tag(c,L('heatOut','熱散失','Heat lost'),SX+SW/2,74,{al:'center',col:ORANGE});
  C4.forEach(p=>{const x=p.x+W4/2+46,b=Math.sin(t*2.4+p.x)*3;K.arrow(c,x,p.y-8+b,x,p.y-50+b,rgba(ORANGE,.9),3);});
  text(c,noteP(e),SX+14,SY+SH-10,22,WHITE);
}

// ── frame ──────────────────────────────────────────────────────────────────
function stage(c,k,tau,t,e){if(k===0)stage0(c,tau,t,e);else if(k<4)stageT(c,k,tau,t,e);else stage4(c,tau,t,e);}
function draw(c,s,t){
  const {k}=stageClock(s,t,N,PER);
  s.shown=k;
  const e=[5,10,20].includes(s.eff)?s.eff:10;
  const st=s.enr||(s.enr={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  D.round(c,SX,SY,SW,SH,16,'#16332b',C.edge);
  c.save();c.beginPath();c.roundRect(SX,SY,SW,SH,16);c.clip();
  // sequential fade (old out in the first half, new in the second) so two steps' labels never sit on top of each other
  const aOld=moving?clamp(1-u*2):0,aNew=moving?clamp(u*2-1):1;
  if(aOld>0)withA(c,aOld,()=>stage(c,st.from,9,t,e));
  withA(c,aNew,()=>stage(c,k,tau,t,e));
  c.restore();
  if(aOld>0)header(c,st.from,e,aOld,t);
  header(c,k,e,aNew,t);
  ladder(c,k,e,t,ease((tau-.4)/1.1));
}
window.EcologyDraw.energy=draw;
})();
