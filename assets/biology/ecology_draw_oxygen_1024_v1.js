/* Ecology lesson 4 · "oxygen" canvas (fresh-water tab, view 1), 2026-10-24. Where the oxygen in water comes from.
 * One tank seen from the side: air gap, wavy surface, small white bubbles in the water (= dissolved oxygen, schematic only),
 * one crucian carp (EC14b_crucian 1003x587, faces right; mouth measured at picture (999,335) = fraction (.996,.57)).
 * Option s.warm (0 cooler / 1 warmer): read every frame and eased fast (about 0.2 s), so the water tint, bubble count,
 * thermometer, sun and pills change at once; the fish swims up in about a second.
 * Three steps, 9 s each; s.shown = step. The tank, bubbles and fish stay; step elements cross-fade.
 *  0 air to water: dashed arrows carry oxygen from the air into the surface, new bubbles sink from the surface; on the right a short
 *    stretch of rapids churns the surface (foam, swirls) and sends in many more bubbles ("Stirring"); right panel: three things that
 *    affect dissolved oxygen (temperature, flow, biological activity); "Streams are not always higher than ponds".
 *  1 water temperature: surface calm again; thermometer and sun in the right panel, a "Cooler/Warmer" pill and a dissolved-oxygen bar
 *    without numbers ("More/Less"); warmer = fewer bubbles and the fish swims near the surface (gulp rings); "Other conditions the same",
 *    "Change only the water temperature".
 *  2 supplement, day and night (8 s cycle, starting at dawn): water plants at the bottom; by day bubbles rise from the leaves
 *    ("Photosynthesis releases oxygen"), at night bubbles drift into the fish and the plants ("Respiration uses oxygen");
 *    a curve without numbers in the right panel with a moving marker, lowest before dawn.
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const AIR_O2=P('空氣中的氧','Oxygen in the air'),AFFECTS=P('溶氧受這些條件影響','What affects dissolved oxygen'),BIO=P('生物活動','Biological activity');
const ONLY_TEMP=P('一次只改水溫','Change only the water temperature'),NEAR_SURF=P('魚游到水面附近','The fish swims near the surface');
const MORE=P('較多','More'),LESS=P('較少','Less'),LOWEST=P('天亮前最少','Lowest before dawn');
const N=3,PER=9,CW=960,CYC=8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',PANEL='#16332b';

// ── helpers (same look as the fairtest / evidence views) ──────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8,pad=0}={}){
  const w=measure(c,p,size)+28+pad,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+pad+(w-pad)/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dashLine(c,a,b,col,t,w=2.5){c.save();c.lineCap='round';c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
function bubble(c,x,y,r,a){if(a<=0.01)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,rgba(WHITE,.82),rgba(WHITE,.95),1.2);circle(c,x-r*.35,y-r*.35,r*.32,'rgba(255,255,255,.9)');c.restore();}
function sun(c,x,y,r,t,a){withA(c,a,()=>{glow(c,x,y,r*2.4,YELLOW,.35);
  for(let i=0;i<10;i++){const g=i/10*Math.PI*2+t*.4,l=r*(1.35+.12*Math.sin(t*3+i));K.sline(c,[[x+Math.cos(g)*r*1.15,y+Math.sin(g)*r*1.15],[x+Math.cos(g)*l,y+Math.sin(g)*l]],YELLOW,4);}
  circle(c,x,y,r,YELLOW,C.ink,2.5);});}
function moon(c,x,y,r,a){withA(c,a,()=>{glow(c,x,y,r*2,WHITE,.18);c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=WHITE;c.fill();
  c.globalCompositeOperation='destination-out';c.beginPath();c.arc(x+r*.5,y-r*.3,r*.85,0,Math.PI*2);c.fill();c.restore();});}
function thermo(c,x,top,bot,lv,col){
  D.round(c,x-12,top,24,bot-top,12,PANEL,WHITE);circle(c,x,bot+12,18,PANEL,WHITE,3);
  const y=mix(bot-6,top+12,lv);D.round(c,x-5.5,y,11,bot+8-y,5.5,col);circle(c,x,bot+12,12,col);
  for(let i=0;i<6;i++){const yy=mix(bot-10,top+14,i/5);K.sline(c,[[x+15,yy],[x+24,yy]],rgba(WHITE,.7),2);}
}
function miniThermo(c,x,y,col){D.round(c,x-5,y-16,10,26,5,PANEL,WHITE);circle(c,x,y+12,7,col,WHITE,2);D.round(c,x-2,y-8,4,18,2,col);}

// ── layout ────────────────────────────────────────────────────────────────
const TK={x:40,y:118,w:620,h:400},SURF=180,BOT=TK.y+TK.h,SAND_Y=498,RP={x:684,y:118,w:256,h:400};
const RAP=[500,656];                                   // rapids stretch (x range)
const FW=150,FH=FW*587/1003,MOUTH=[.496,.07];           // fish size; mouth offset from centre in fish widths/heights
const rnd=K.rng(1024);
const POP=Array.from({length:84},()=>({x:rnd(),y0:rnd(),v:5+7*rnd(),r:2.2+2.4*rnd(),h:rnd()*.98,ph:rnd()*6.28}));
const EMIT=Array.from({length:18},()=>({x:mix(TK.x+20,RAP[0]-30,rnd()),o:rnd(),r:2+1.8*rnd()}));
const RAPB=Array.from({length:34},()=>({x:mix(RAP[0]+8,RAP[1]-10,rnd()),o:rnd(),dx:(rnd()-.5)*110,d:120+140*rnd(),r:2+2*rnd()}));
const PLANTS=[{x:100,h:120,n:3},{x:180,h:150,n:4},{x:262,h:110,n:3}];
const NIGHT=Array.from({length:22},()=>({a:rnd()*6.28,d:50+70*rnd(),o:rnd(),tgt:rnd()<.55?0:1+Math.floor(rnd()*3),r:2+1.6*rnd()}));
const stirAt=x=>smooth((x-RAP[0]+10)/40)*smooth((RAP[1]-x)/10);
function surfY(x,t,st){return SURF+2.5*Math.sin(x*.04+t*2)+1.5*Math.sin(x*.09-t*1.3)+st*stirAt(x)*(6*Math.sin(x*.13-t*9)+4*Math.sin(x*.07+t*6.5));}
// plant blade points (base at the sand line)
function blade(p,j,t){const n=p.n,off=(j-(n-1)/2)*14,h=p.h*(1-.12*Math.abs(j-(n-1)/2)),sw=Math.sin(t*1.1+p.x*.05+j)*10;
  return{b:[p.x+off*.4,SAND_Y+4],m:[p.x+off+sw*.5,SAND_Y-h*.55],tip:[p.x+off*1.6+sw,SAND_Y-h]};}
function drawPlants(c,t){
  for(const p of PLANTS)for(let j=0;j<p.n;j++){const {b,m,tip}=blade(p,j,t);
    c.save();c.lineCap='round';c.beginPath();c.moveTo(...b);c.quadraticCurveTo(...m,...tip);c.strokeStyle='#1f6b3a';c.lineWidth=9;c.stroke();c.strokeStyle=GREEN;c.lineWidth=5;c.stroke();c.restore();
    for(let q=1;q<=3;q++){const u=q/4,x=mix(mix(b[0],m[0],u),mix(m[0],tip[0],u),u),y=mix(mix(b[1],m[1],u),mix(m[1],tip[1],u),u);
      for(const d of [-1,1])K.ellipse(c,x+d*9,y-4,10,4,rgba(GREEN,.9),'#1f6b3a',1.5,d*-.6);}}
}
function leafTips(t){const out=[];for(const p of PLANTS)for(let j=0;j<p.n;j++)out.push(blade(p,j,t).tip);return out;}
function fishAt(c,x,y,sx,t){
  c.save();c.translate(x,y);c.rotate(Math.sin(t*3.2)*.025);c.scale(sx,1);
  K.drawIn(c,'EC14b_crucian.png',{x:-FW/2,y:-FH/2,w:FW,h:FH});c.restore();
}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.oxSt||(s.oxSt={});
  const W=(s.warm|0)===1?1:0;
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,T=tau;
  const OUT=.45,D0=st.from>=0?OUT:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau-D0,s0,d,s1);if(st.from<0||tau>=OUT)return now;return Math.max(now,vis(st.from,9,s0,0,s1)*(1-smooth(tau/OUT)));};
  // day/night cycle of step 2 (0 = dawn, .5 = dusk)
  const cu=mod(T/CYC),day=k===2?smooth((Math.sin(cu*Math.PI*2)+.25)*3):1,curve=u=>.16+.78*Math.sin(Math.PI*u);
  // eased state: warm, bubble amount, fish depth
  const tw=W,tD=k===0?.72*(1-.45*W):k===1?mix(1,.3,W):curve(cu)*(1-.35*W),tF=k===0?330:k===1?mix(372,SURF+44,W):300;
  const dt=t-(st.lt??t);st.lt=t;
  if(st.w===undefined||dt<0||dt>.6){st.w=tw;st.D=tD;st.fy=tF;}
  else{const e=r=>1-Math.exp(-dt*r);st.w+=(tw-st.w)*e(14);st.D+=(tD-st.D)*e(k===2?3:9);st.fy+=(tF-st.fy)*e(2.6);}
  const w=st.w,DO=st.D;
  const a0=A(0,0,0),a1=A(1,0,1),a2=A(2,0,2);

  // ── tank and water ──
  D.round(c,TK.x,TK.y,TK.w,TK.h,14,'#102a23',null);
  // air gap: night darkens it in step 2
  withA(c,a2*(1-day),()=>D.round(c,TK.x+3,TK.y+3,TK.w-6,SURF-TK.y,12,'rgba(8,14,32,.85)'));
  withA(c,a2*day,()=>D.round(c,TK.x+3,TK.y+3,TK.w-6,SURF-TK.y,12,rgba(YELLOW,.10)));
  c.save();c.beginPath();c.roundRect(TK.x,TK.y,TK.w,TK.h,14);c.clip();
  const water=()=>{c.beginPath();c.moveTo(TK.x,BOT);for(let x=TK.x;x<=TK.x+TK.w;x+=6)c.lineTo(x,surfY(x,t,a0));c.lineTo(TK.x+TK.w,BOT);c.closePath();};
  const g=c.createLinearGradient(0,SURF,0,BOT);g.addColorStop(0,'rgba(85,233,255,.30)');g.addColorStop(1,'rgba(23,80,111,.62)');
  water();c.fillStyle=g;c.fill();
  // warm tint (orange) and night shade
  water();c.fillStyle=rgba(ORANGE,.16*w);c.fill();
  if(a2>0){water();c.fillStyle=`rgba(5,10,24,${.38*a2*(1-day)})`;c.fill();}
  // sand
  D.round(c,TK.x,SAND_Y,TK.w,BOT-SAND_Y+14,0,'#6f6448');
  for(let i=0;i<40;i++){const x=TK.x+8+i*15.3,y=SAND_Y+6+(i*7%11);circle(c,x,y,2.5+(i%3),rgba(SAND,.55));}

  // ── bubbles (dissolved oxygen, schematic) ──
  const top=SURF+12,bot=SAND_Y-6,rng=bot-top;
  for(const b of POP){const vA=clamp((DO-b.h)*9);if(vA<=0)continue;
    const y=top+mod(b.y0*rng+t*b.v,rng),x=TK.x+16+b.x*(TK.w-32)+5*Math.sin(t*.8+b.ph),e=clamp(Math.min(y-top,bot-y)/22);
    bubble(c,x,y,b.r,vA*e);}
  // step 0: new bubbles sink from the surface; many more under the rapids
  withA(c,a0,()=>{
    const f=1-.45*w;
    EMIT.forEach((b,i)=>{if(i/EMIT.length>f+.05)return;const u=mod(t/3.2+b.o),y=surfY(b.x,t,1)+6+u*110;bubble(c,b.x+4*Math.sin(t+i),y,1+b.r*u,Math.sin(Math.PI*u));});
    RAPB.forEach((b,i)=>{if(i/RAPB.length>f+.05)return;const u=mod(t/2.4+b.o),y=surfY(b.x,t,1)+4+u*b.d;bubble(c,b.x+b.dx*u,y,1.2+b.r*Math.sqrt(u),Math.sin(Math.PI*u)**.6);});
  });
  // step 2: plants, leaf bubbles by day, bubbles drawn into the organisms at night
  const fx=300+140*Math.sin(t*.42),cv=Math.cos(t*.42),sx=Math.abs(cv)<.09?.25*Math.sign(cv||1):Math.max(-1,Math.min(1,cv*3)),fy=st.fy+6*Math.sin(t*1.3);
  const mouth=[fx+sx*FW*MOUTH[0],fy+FH*MOUTH[1]];
  withA(c,a2,()=>{
    drawPlants(c,t);
    const tips=leafTips(t);
    withA(c,day,()=>tips.forEach((p,i)=>{for(let j=0;j<3;j++){const u=mod(t/2.4+j/3+i*.17);bubble(c,p[0]+5*Math.sin(t*2+i+j),p[1]-4-u*78,1.6+2*u,Math.sin(Math.PI*u));}}));
    withA(c,1-day,()=>NIGHT.forEach(b=>{const u=mod(t/2.2+b.o),tg=b.tgt?(()=>{const p=PLANTS[b.tgt-1];return[p.x,SAND_Y-p.h*.5];})():mouth;
      const s0=[tg[0]+Math.cos(b.a)*b.d,tg[1]+Math.sin(b.a)*b.d*.7],q=Math.pow(u,1.6);bubble(c,mix(s0[0],tg[0],q),mix(s0[1],tg[1],q),b.r*(1-.6*u),Math.sin(Math.PI*Math.min(1,u*1.2))*.95);}));
  });
  // ── fish ──
  fishAt(c,fx,fy,sx,t);
  // warm: gulping near the surface
  withA(c,a1*w*clamp((SURF+80-fy)/30),()=>{for(let j=0;j<2;j++){const u=mod(t*.9+j*.5),x=mouth[0]+sx*8;K.ellipse(c,x,SURF+2,8+u*30,3+u*7,null,rgba(WHITE,.8*(1-u)),2.5);}});
  // ── surface line, rapids foam ──
  c.save();c.beginPath();for(let x=TK.x;x<=TK.x+TK.w;x+=6){const y=surfY(x,t,a0);x===TK.x?c.moveTo(x,y):c.lineTo(x,y);}
  c.strokeStyle=rgba(WHITE,.85);c.lineWidth=3;c.stroke();c.restore();
  withA(c,a0,()=>{
    for(let x=RAP[0]+6;x<RAP[1]-4;x+=9){const y=surfY(x,t,1),s=stirAt(x);if(s<.2)continue;circle(c,x,y-1,3+2.5*Math.abs(Math.sin(x*.3+t*7)),rgba(WHITE,.85*s));}
    for(let i=0;i<14;i++){const x=RAP[0]+12+mod(i*37+t*60,RAP[1]-RAP[0]-24),u=mod(t*1.6+i*.31),y=surfY(x,t,1)-4-u*22;circle(c,x,y,2.2,rgba(WHITE,.8*(1-u)));}
    // churning swirls under the surface
    for(let i=0;i<2;i++){const cx=RAP[0]+48+i*72,cy=SURF+40,r=20,a=t*3*(i?-1:1);
      c.save();c.lineCap='round';c.beginPath();c.arc(cx,cy,r,a,a+Math.PI*1.3);c.strokeStyle=rgba(WHITE,.75);c.lineWidth=3;c.stroke();
      const e=a+Math.PI*1.3,ex=cx+Math.cos(e)*r,ey=cy+Math.sin(e)*r,tx=-Math.sin(e),ty=Math.cos(e);K.arrow(c,ex-tx*8,ey-ty*8,ex+tx*4,ey+ty*4,rgba(WHITE,.85),3);c.restore();}
  });
  c.restore();
  // glass
  D.round(c,TK.x,TK.y,TK.w,TK.h,14,null,rgba(WHITE,.55));
  K.sline(c,[[TK.x+12,TK.y+14],[TK.x+12,BOT-30]],rgba(WHITE,.18),4);

  // ── right panel ──
  D.round(c,RP.x,RP.y,RP.w,RP.h,16,PANEL,rgba(CYAN,.35));

  // ── legend (all steps): bubble = dissolved oxygen; warm chip ──
  {const p=tag(c,L('dissolvedO2','溶氧','Dissolved oxygen'),RP.x,16,{col:CYAN,pad:22,maxX:CW-8});bubble(c,p.x+22,p.y+p.h/2,6,1);}
  withA(c,Math.max(a0,a2),()=>{const col=w>.5?ORANGE:CYAN,p=tag(c,w>.5?L('warm','較暖','Warmer'):L('cool','較冷','Cooler'),RP.x,64,{col,pad:24});miniThermo(c,p.x+22,p.y+p.h/2-2,col);});
  tag(c,L('schematic','示意','Schematic'),CW-12,526,{al:'right',col:MUTED});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');

  // ── step 0: air to water ──
  withA(c,A(0,0,0),()=>{
    tag(c,AIR_O2,TK.x,16,{col:CYAN,active:true,size:24});
    for(const x of [250,330,410]){dashLine(c,[x,66],[x,SURF-14],rgba(CYAN,.85),t,3);K.arrow(c,x,SURF-24,x,SURF-6,CYAN,3.5);
      const u=mod(t*.5+x*.01);circle(c,x,mix(70,SURF-8,u),4,rgba(WHITE,.9*Math.sin(Math.PI*u)));}
    const p=tag(c,L('surface','水面','Surface'),TK.x+16,128,{col:WHITE});dashLine(c,[p.x+p.w/2,p.y+p.h],[p.x+p.w/2,SURF-4],rgba(WHITE,.8),t);
  });
  withA(c,A(0,.6,0),()=>{const p=tag(c,L('stirring','攪動','Stirring'),(RAP[0]+RAP[1])/2,128,{al:'center',col:YELLOW,active:true,maxX:TK.x+TK.w-6});pulseRing(c,p,t,YELLOW);});
  withA(c,A(0,1.2,0),()=>{
    K.wrap(c,AFFECTS,RP.x+RP.w/2,RP.y+40,RP.w-28,22,WHITE,30,'center');
    const F=[[L('temperature','溫度','Temperature'),ORANGE],[L('flow','水流','Flow'),CYAN],[BIO,GREEN]],cyc=Math.floor(mod(t/1.5,3));
    F.forEach(([p,col],i)=>withA(c,k===0?clamp((T-1.6-i*.5)/.5):1,()=>{const q=tag(c,p,RP.x+RP.w/2,RP.y+120+i*64,{al:'center',col,active:cyc===i,minX:RP.x+4,maxX:CW-4});if(cyc===i)pulseRing(c,q,t,col);}));
  });
  withA(c,A(0,3,0),()=>{const p=tag(c,L('notAlwaysMore','溪流不一定比池塘高','Streams are not always higher than ponds'),TK.x,526,{col:YELLOW,active:true,size:24});pulseRing(c,p,t,YELLOW);});

  // ── fish name (steps 0 and 1) ──
  withA(c,Math.max(a0,a1),()=>{const p=tag(c,L('crucian','鯽魚','Crucian carp'),fx,fy+FH/2+6,{al:'center',col:SAND,minX:TK.x+8,maxX:TK.x+TK.w-8});});

  // ── step 1: water temperature ──
  withA(c,A(1,0,1),()=>{
    tag(c,ONLY_TEMP,TK.x,16,{col:ORANGE,active:true,size:24});
    sun(c,RP.x+64,RP.y+64,22+8*w,t,.25+.75*w);
    thermo(c,RP.x+190,RP.y+22,RP.y+150,mix(.25,.8,w),ORANGE);
    if(Math.abs(w-W)>.02)glow(c,RP.x+190,RP.y+100,70,ORANGE,.35);
    const col=w>.5?ORANGE:CYAN,p=tag(c,w>.5?L('warm','較暖','Warmer'):L('cool','較冷','Cooler'),RP.x+RP.w/2,RP.y+196,{al:'center',col,active:true,size:24});pulseRing(c,p,t,col);
    text(c,L('dissolvedO2','溶氧','Dissolved oxygen'),RP.x+18,RP.y+282,22,CYAN,'left');
    const bx=RP.x+18,by=RP.y+298,bw=RP.w-36;D.round(c,bx,by,bw,24,12,'#0b1a15',rgba(CYAN,.6));
    const fw=Math.max(24,bw*DO);D.round(c,bx,by,fw,24,12,rgba(CYAN,.85));
    for(let i=0;i<Math.floor(fw/18);i++)circle(c,bx+10+i*18,by+12,3.5,rgba(WHITE,.85));
    tag(c,w>.5?LESS:MORE,RP.x+RP.w/2,RP.y+336,{al:'center',col:CYAN});
  });
  withA(c,A(1,.2,1)*w*clamp((300-st.fy)/40),()=>{tag(c,NEAR_SURF,TK.x+TK.w/2,456,{al:'center',col:WHITE});});
  withA(c,A(1,1.6,1),()=>{const p=tag(c,L('sameOtherConditions','其他條件相同','Other conditions the same'),TK.x,526,{col:YELLOW,active:true,size:24});pulseRing(c,p,t,YELLOW);});

  // ── step 2: day and night (supplement) ──
  withA(c,A(2,0,2),()=>{
    tag(c,L('supplement','補充','Supplement'),TK.x,16,{col:GREEN,active:true,size:24});
    sun(c,RP.x+RP.w/2,RP.y+50,22,t,day);moon(c,RP.x+RP.w/2,RP.y+50,22,1-day);
    tag(c,day>.5?L('day','白天','Day'):L('night','夜晚','Night'),RP.x+RP.w/2,RP.y+92,{al:'center',col:day>.5?YELLOW:WHITE,active:true});
    // curve without numbers
    const gx=RP.x+18,gw=RP.w-36,gy0=RP.y+176,gh=110,band=gy0+gh+8;
    text(c,L('dissolvedO2','溶氧','Dissolved oxygen'),gx,RP.y+166,22,CYAN,'left');
    K.sline(c,[[gx,gy0],[gx,gy0+gh],[gx+gw,gy0+gh]],rgba(WHITE,.6),2.5);
    const pt=u=>[gx+u*gw,gy0+gh-curve(u)*(1-.3*w)*gh];
    c.save();c.beginPath();for(let i=0;i<=40;i++){const q=pt(i/40);i?c.lineTo(...q):c.moveTo(...q);}c.strokeStyle=rgba(CYAN,.35);c.lineWidth=3;c.stroke();
    c.beginPath();for(let i=0;i<=40;i++){const u=i/40*cu,q=pt(u);i?c.lineTo(...q):c.moveTo(...q);}c.strokeStyle=CYAN;c.lineWidth=4;c.stroke();c.restore();
    const m=pt(cu);K.pulse(c,m[0],m[1],t,CYAN,7);circle(c,m[0],m[1],7,WHITE,C.ink,2);
    D.round(c,gx,band,gw/2,34,6,rgba(YELLOW,.28));D.round(c,gx+gw/2,band,gw/2,34,6,'rgba(8,14,32,.9)');
    text(c,L('day','白天','Day'),gx+gw/4,band+25,22,YELLOW,'center');text(c,L('night','夜晚','Night'),gx+gw*3/4,band+25,22,WHITE,'center');
    tag(c,LOWEST,RP.x+RP.w-8,band+48,{al:'right',col:CYAN,minX:RP.x+4,maxX:CW-4});
    const end=pt(1);circle(c,end[0],end[1],5,CYAN);K.pulse(c,end[0],end[1],t+.4,CYAN,6);
  });
  withA(c,A(2,.4,2),()=>{tag(c,L('waterPlant','水草','Water plants'),330,456,{col:GREEN});});
  withA(c,A(2,.6,2)*day,()=>{const p=tag(c,L('photosynthesis','光合作用放出氧','Photosynthesis releases oxygen'),TK.x+16,194,{col:YELLOW,active:true,maxX:TK.x+TK.w-8});pulseRing(c,p,t,YELLOW);});
  withA(c,A(2,.6,2)*(1-day),()=>{const p=tag(c,L('respire','呼吸用掉氧','Respiration uses oxygen'),TK.x+TK.w-16,384,{al:'right',col:WHITE,active:true,minX:TK.x+8});pulseRing(c,p,t,WHITE);});
}
window.EcologyDraw.oxygen=draw;
})();
