/* Ecology lesson 4 · "pondstream" canvas (fresh-water tab, view 0), 2026-10-24. Still water and flowing water.
 * Two panels side by side: left the pond (HB5_pond 1672x933), right the stream (HB4_stream 1672x933), each cropped to the panel
 * (pond crop x 320-1346, stream crop x 290-1316, full height; both show trees on the banks at the top and water below).
 * A title pill sits above each panel. Over each scene the program lays a see-through "side cut" of the water: wavy surface line,
 * tinted water, and the bottom (pond: mud, shallow on the left and deeper to the right; stream: shallower, stones and gravel).
 * Residents: EC14a_daphnia (783x974) and EC14b_crucian (1003x587, faces right) in the pond, EC14a_shrimp (1242x584, faces left)
 * behind a drawn stone in the stream. Sizes are not real sizes (said on screen).
 * Four steps, 9 s each; s.shown = step. Each step is drawn at its own time; a 0.45 s cross-fade covers step changes.
 *  0 does the water move: the pond surface barely moves (small ripple rings); white flow streaks run to the right in the stream;
 *    "Still water", "Flowing water".
 *  1 who stays put: in the stream a leaf and small dots (light things, schematic) are carried off to the right; the shrimp holds still
 *    behind a stone ("Sheltering behind a stone"); water fleas and a crucian carp drift and swim in the pond; "Common in ponds / streams"
 *    (never "only lives in").
 *  2 light and depth: in the pond a yellow light band fades with depth (bottom dark), drawn water plants grow only in the shallows;
 *    the shallower stream is lit to the bottom (glints on the stones); "Schematic" lights up. No depth numbers.
 *  3 bottom and banks: mud (pond) and stones and gravel (stream) light up; leaves fall from both banks (pond: float, stream: carried away);
 *    then a four-row comparison (flow, light, bottom, banks) and "Clear-looking water can still be polluted".
 * No measurements anywhere. Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const SWEPT=P('輕的東西被沖走','Light things are swept away');
const DARKER=P('越深越暗','Darker with depth'),TO_BOTTOM=P('照到水底','Lit to the bottom');
const BOTTOM=P('底質','Bottom'),BANKS=P('岸邊','Banks');
const N=4,PER=9,CW=960,OUT=.45;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',PANEL='#16332b',CARD_BG='#1c3d34';

// ── helpers (same look as the oxygen / adapt / mountain views) ─────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7),r=Math.min(p.h/2,20);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,r+6*u,null,rgba(col,.8*(1-u)));}
function pointer(c,a,b,col,t,ring=true){const mx=(a[0]+b[0])/2+(b[1]-a[1])*.18,my=(a[1]+b[1])/2-(b[0]-a[0])*.18;
  c.save();c.lineCap='round';c.beginPath();c.moveTo(...a);c.quadraticCurveTo(mx,my,b[0],b[1]);
  c.strokeStyle='rgba(11,26,21,.75)';c.lineWidth=6;c.stroke();c.strokeStyle=col;c.lineWidth=3;c.setLineDash([9,5]);c.lineDashOffset=-t*10;c.stroke();c.restore();
  circle(c,b[0],b[1],8,null,'rgba(11,26,21,.75)',5);circle(c,b[0],b[1],8,null,col,2.5);
  if(ring){const u=mod(t*.8);circle(c,b[0],b[1],9+u*12,null,rgba(col,.8*(1-u)),2);}}
const fin=(tau,t0,d=.6)=>ease((tau-t0)/d);

// ── layout ────────────────────────────────────────────────────────────────
const LP={x:12,y:58,w:462,h:420},RP={x:486,y:58,w:462,h:420},PB=LP.y+LP.h;   // panels; PB = panel bottom
const PS=200,SS=246;                                                        // pond / stream surface
const CROP={pond:[320/1672,0,1026/1672,1],stream:[290/1672,0,1026/1672,1]};
// pond bottom: shallow on the left bank, deep in the middle and right (deep bottom y 428, mud below)
const pondBot=x=>{const u=(x-LP.x)/LP.w;return mix(PS+44,428,smooth(u/.55))-10*smooth((u-.8)/.2);};
const streamBot=x=>372+4*Math.sin(x*.07)+3*Math.sin(x*.023+1);
const pondSurf=(x,t)=>PS+1.4*Math.sin(x*.05+t*1.5)+.9*Math.sin(x*.11-t*1.1);
const streamSurf=(x,t)=>SS+3*Math.sin(x*.06-t*5)+1.8*Math.sin(x*.14-t*7.5);
const STONE={x:RP.x+222,r:42};                                              // shelter stone (base on the stream bottom)
const SHRIMP={x:RP.x+292,w:124};                                             // shrimp centre x, width (sits just above the bottom)
const rnd=K.rng(1031);
const STREAKS=Array.from({length:16},()=>({y:rnd(),v:120+90*rnd(),l:40+50*rnd(),o:rnd(),ph:rnd()*6.28}));
const RIPPLES=Array.from({length:6},(_,i)=>({x:LP.x+60+rnd()*(LP.w-120),o:i/6+rnd()*.08}));
const STONES=(()=>{const a=[];for(let i=0;i<46;i++){const x=RP.x+4+rnd()*(RP.w-8),y=380+rnd()*92;a.push({x,y,rx:9+rnd()*16,ry:6+rnd()*9,c:['#8c8577','#a39a86','#776f62','#b3a68a','#6c665c'][Math.floor(rnd()*5)],rot:(rnd()-.5)*.6});}
  for(let i=0;i<70;i++)a.push({x:RP.x+4+rnd()*(RP.w-8),y:378+rnd()*96,rx:3+rnd()*4,ry:2.5+rnd()*3,c:['#c9bc9a','#8c8577','#9d9380'][Math.floor(rnd()*3)],rot:0});
  return a.sort((p,q)=>p.y-q.y);})();
const SPECKS=Array.from({length:40},()=>({x:LP.x+rnd()*LP.w,v:rnd(),r:1.5+rnd()*2.5}));
const DOTS=Array.from({length:12},()=>({y:rnd(),o:rnd(),v:.75+.5*rnd(),r:3+2*rnd()}));
const PLANTS=[{x:LP.x+52,h:40,n:3},{x:LP.x+104,h:66,n:4},{x:LP.x+156,h:86,n:3}];
const PRELOAD=['HB5_pond.jpg','HB4_stream.jpg','EC14a_daphnia.png','EC14a_shrimp.png','EC14b_crucian.png'];

// ── drawing pieces ────────────────────────────────────────────────────────
function leaf(c,x,y,r,rot,col){c.save();c.translate(x,y);c.rotate(rot);
  c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(-r*.2,-r*.62,r,0);c.quadraticCurveTo(-r*.2,r*.62,-r,0);c.closePath();
  c.fillStyle=col;c.fill();c.strokeStyle='rgba(11,26,21,.8)';c.lineWidth=2;c.stroke();
  c.beginPath();c.moveTo(-r*1.25,0);c.lineTo(r*.8,0);c.strokeStyle='rgba(11,26,21,.65)';c.lineWidth=1.6;c.stroke();c.restore();}
function scene(c,R,file,crop){
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  c.fillStyle=PANEL;c.fillRect(R.x,R.y,R.w,R.h);
  K.drawIn(c,file,R,{crop});c.restore();}
function waterPath(c,R,surf,bot,t){c.beginPath();c.moveTo(R.x,surf(R.x,t));for(let x=R.x;x<=R.x+R.w;x+=6)c.lineTo(x,surf(x,t));
  for(let x=R.x+R.w;x>=R.x;x-=6)c.lineTo(x,bot(x));c.closePath();}
function pondBody(c,t,dark){
  const R=LP;c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const g=c.createLinearGradient(0,PS,0,430);g.addColorStop(0,'rgba(85,233,255,.30)');g.addColorStop(1,'rgba(23,80,111,.74)');
  waterPath(c,R,pondSurf,pondBot,t);c.fillStyle=g;c.fill();
  if(dark>0){const d=c.createLinearGradient(0,PS+60,0,430);d.addColorStop(0,'rgba(5,10,24,0)');d.addColorStop(1,`rgba(5,10,24,${.62*dark})`);waterPath(c,R,pondSurf,pondBot,t);c.fillStyle=d;c.fill();}
  // mud
  c.beginPath();c.moveTo(R.x,pondBot(R.x));for(let x=R.x;x<=R.x+R.w;x+=6)c.lineTo(x,pondBot(x));c.lineTo(R.x+R.w,PB);c.lineTo(R.x,PB);c.closePath();
  c.fillStyle='rgba(84,62,40,.94)';c.fill();
  for(const s of SPECKS){const y=mix(pondBot(s.x)+6,PB-4,s.v);circle(c,s.x,y,s.r,'rgba(40,28,18,.7)');}
  c.restore();}
function streamBody(c,t){
  const R=RP;c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const g=c.createLinearGradient(0,SS,0,380);g.addColorStop(0,'rgba(85,233,255,.28)');g.addColorStop(1,'rgba(23,80,111,.55)');
  waterPath(c,R,streamSurf,streamBot,t);c.fillStyle=g;c.fill();
  c.beginPath();c.moveTo(R.x,streamBot(R.x));for(let x=R.x;x<=R.x+R.w;x+=6)c.lineTo(x,streamBot(x));c.lineTo(R.x+R.w,PB);c.lineTo(R.x,PB);c.closePath();
  c.fillStyle='rgba(82,76,64,.95)';c.fill();
  for(const s of STONES)K.ellipse(c,s.x,s.y,s.rx,s.ry,s.c,'rgba(11,26,21,.7)',1.6,s.rot);
  c.restore();}
function surfLine(c,R,surf,t){c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();c.beginPath();
  for(let x=R.x;x<=R.x+R.w;x+=6){const y=surf(x,t);x===R.x?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(WHITE,.9);c.lineWidth=3;c.stroke();c.restore();}
function shelterStone(c){const b=streamBot(STONE.x)+8,r=STONE.r;
  c.beginPath();c.moveTo(STONE.x-r*1.25,b);c.bezierCurveTo(STONE.x-r*1.2,b-r*1.3,STONE.x+r*.9,b-r*1.45,STONE.x+r*1.2,b);c.closePath();
  c.fillStyle='#7d7668';c.fill();c.strokeStyle=C.ink;c.lineWidth=2.5;c.stroke();
  c.beginPath();c.moveTo(STONE.x-r*.7,b-r*.75);c.quadraticCurveTo(STONE.x-r*.1,b-r*1.08,STONE.x+r*.45,b-r*.9);c.strokeStyle='rgba(242,236,217,.35)';c.lineWidth=4;c.lineCap='round';c.stroke();}
function streaks(c,t,a){withA(c,a,()=>{c.save();c.beginPath();c.roundRect(RP.x,RP.y,RP.w,RP.h,14);c.clip();c.lineCap='round';
  for(const s of STREAKS){const span=RP.w+s.l+40,x=RP.x-s.l+mod(s.o*span+t*s.v,span),y0=mix(SS+12,368,s.y);
    // streaks low in the water bend up over the shelter stone
    const lift=x0=>{const d=(x0-STONE.x)/(STONE.r*1.6);return y0>330?-Math.max(0,1-d*d)*(y0-300)*.8:0;};
    c.beginPath();for(let i=0;i<=8;i++){const xx=x+s.l*i/8,yy=y0+3*Math.sin(xx*.05+s.ph)+lift(xx);i?c.lineTo(xx,yy):c.moveTo(xx,yy);}
    c.strokeStyle=rgba(WHITE,.85);c.lineWidth=3;c.stroke();
    K.arrow(c,x+s.l-2,y0+3*Math.sin((x+s.l-2)*.05+s.ph)+lift(x+s.l),x+s.l+8,y0+3*Math.sin((x+s.l+8)*.05+s.ph)+lift(x+s.l+8),rgba(WHITE,.85),2.5);}
  c.restore();});}
function ripples(c,t,a){withA(c,a,()=>{for(const r of RIPPLES){const u=mod(t/3.4+r.o);K.ellipse(c,r.x,PS+2,6+u*34,2+u*6,null,rgba(WHITE,.75*(1-u)),2);}});}
function plants(c,t){
  for(const p of PLANTS){const by=pondBot(p.x)+4;for(let j=0;j<p.n;j++){const off=(j-(p.n-1)/2)*11,h=p.h*(1-.12*Math.abs(j-(p.n-1)/2)),sw=Math.sin(t*1.1+p.x*.05+j)*7;
    const b=[p.x+off*.4,by],m=[p.x+off+sw*.5,by-h*.55],tip=[p.x+off*1.5+sw,by-h];
    c.save();c.lineCap='round';c.beginPath();c.moveTo(...b);c.quadraticCurveTo(...m,...tip);c.strokeStyle='#1f6b3a';c.lineWidth=8;c.stroke();c.strokeStyle=GREEN;c.lineWidth=4.5;c.stroke();c.restore();
    for(let q=1;q<=2;q++){const u=q/3,x=mix(mix(b[0],m[0],u),mix(m[0],tip[0],u),u),y=mix(mix(b[1],m[1],u),mix(m[1],tip[1],u),u);
      for(const d of [-1,1])K.ellipse(c,x+d*8,y-3,9,3.5,rgba(GREEN,.9),'#1f6b3a',1.5,d*-.6);}}}}
function fish(c,x,y,sx,t,w=120){const h=w*587/1003;c.save();c.translate(x,y);c.rotate(Math.sin(t*3.2)*.03);c.scale(sx,1);K.drawIn(c,'EC14b_crucian.png',{x:-w/2,y:-h/2,w,h});c.restore();return h;}
function daphnia(c,x,y,rot,w=40){const h=w*974/783;c.save();c.translate(x,y);c.rotate(rot);K.drawIn(c,'EC14a_daphnia.png',{x:-w/2,y:-h/2,w,h});c.restore();}
// animal positions (shared by drawing and labels)
const daphAt=(i,t)=>[LP.x+150+i*42+16*Math.sin(t*.7+i*2.1),262+i*18+10*Math.sin(t*1.3+i)+ (mod(t*1.6+i*.37)<.18?-6:0)];
const fishAt=t=>{const x=LP.x+330+82*Math.sin(t*.38),cv=Math.cos(t*.38);return{x,y:356+7*Math.sin(t*1.1),sx:cv>=0?1:-1};};
const shrimpY=t=>streamBot(SHRIMP.x)-26+1.2*Math.sin(t*2.3);

// ── one step, drawn at its own time tau ────────────────────────────────────
function step(c,k,tau,t){
  // scenes and water bodies
  scene(c,LP,'HB5_pond.jpg',CROP.pond);scene(c,RP,'HB4_stream.jpg',CROP.stream);
  const dark=k===2?fin(tau,.6,1.2):.25;
  pondBody(c,t,dark);streamBody(c,t);
  // step 2: light
  if(k===2){const a=fin(tau,.3,1);
    withA(c,a,()=>{c.save();c.beginPath();c.roundRect(LP.x,LP.y,LP.w,LP.h,14);c.clip();
      waterPath(c,LP,pondSurf,pondBot,t);c.clip();
      const g=c.createLinearGradient(0,PS,0,PS+200);g.addColorStop(0,rgba(YELLOW,.5));g.addColorStop(.55,rgba(YELLOW,.16));g.addColorStop(1,rgba(YELLOW,0));
      c.fillStyle=g;c.fillRect(LP.x,PS-6,LP.w,240);
      for(let i=0;i<5;i++){const x=LP.x+40+i*95+18*Math.sin(t*.5+i);const rg=c.createLinearGradient(0,PS,0,PS+170);rg.addColorStop(0,rgba(YELLOW,.28));rg.addColorStop(1,rgba(YELLOW,0));
        c.beginPath();c.moveTo(x,PS);c.lineTo(x+26,PS);c.lineTo(x+58,PS+170);c.lineTo(x+20,PS+170);c.closePath();c.fillStyle=rg;c.fill();}
      c.restore();
      c.save();c.beginPath();c.roundRect(RP.x,RP.y,RP.w,RP.h,14);c.clip();waterPath(c,RP,streamSurf,streamBot,t);c.clip();
      const h=c.createLinearGradient(0,SS,0,380);h.addColorStop(0,rgba(YELLOW,.46));h.addColorStop(1,rgba(YELLOW,.26));c.fillStyle=h;c.fillRect(RP.x,SS-6,RP.w,140);
      for(let i=0;i<5;i++){const x=RP.x+30+i*95+18*Math.sin(t*.5+i+1);c.beginPath();c.moveTo(x,SS);c.lineTo(x+26,SS);c.lineTo(x+52,380);c.lineTo(x+14,380);c.closePath();c.fillStyle=rgba(YELLOW,.2);c.fill();}
      c.restore();
      // glints on the lit stream bed
      for(let i=0;i<14;i++){const x=RP.x+20+i*31,y=streamBot(x)+2,u=mod(t*.9+i*.23);circle(c,x,y,2+3*Math.sin(Math.PI*u),rgba(YELLOW,.9*Math.sin(Math.PI*u)));}
      plants(c,t);});}
  // step 3: highlight the bottoms
  if(k===3){const a=fin(tau,.4)*(.55+.45*Math.sin(t*3));
    withA(c,a,()=>{c.save();c.beginPath();c.roundRect(LP.x,LP.y,LP.w,LP.h,14);c.clip();c.beginPath();for(let x=LP.x;x<=LP.x+LP.w;x+=6){const y=pondBot(x);x===LP.x?c.moveTo(x,y):c.lineTo(x,y);}
      c.strokeStyle=ORANGE;c.lineWidth=4;c.stroke();c.beginPath();for(let x=RP.x;x<=RP.x+RP.w;x+=6){const y=streamBot(x);x===RP.x?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=SAND;c.stroke();c.restore();});}
  // flow and ripples (strong in step 0)
  streaks(c,t,k===0?fin(tau,.4):.5);
  ripples(c,t,k===0?fin(tau,.4):.45);
  // step 1: residents, swept things
  const aRes=k===1?fin(tau,.3):0;
  const shY=shrimpY(t);
  withA(c,aRes,()=>{
    for(let i=0;i<3;i++){const [x,y]=daphAt(i,t);daphnia(c,x,y,.25*Math.sin(t*1.3+i),i===1?44:36);}
    const fA=fishAt(t);fish(c,fA.x,fA.y,fA.sx,t);
    // shrimp behind the stone (holds still; tiny bob), stone in front of its antennae
    K.at(c,'EC14a_shrimp.png',SHRIMP.x,shY,SHRIMP.w);});
  shelterStone(c);
  withA(c,aRes,()=>{
    // things carried away: a leaf and light dots (schematic)
    c.save();c.beginPath();c.roundRect(RP.x,RP.y,RP.w,RP.h,14);c.clip();
    const u=mod(tau/3.2),lx=RP.x-20+u*(RP.w+40),ly=SS+30+18*Math.sin(u*9)+u*14;leaf(c,lx,ly,15,u*14,ORANGE);
    for(const d of DOTS){const v=mod(tau*d.v/2.6+d.o),x=RP.x-10+v*(RP.w+20),y=mix(SS+20,350,d.y)+6*Math.sin(v*12+d.o*6);circle(c,x,y,d.r,rgba(WHITE,.9),C.ink,1.2);}
    c.restore();});
  // step 3: leaves falling from both banks
  if(k===3){
    for(let i=0;i<4;i++){const u=mod((tau-.3)/4.2+i/4),fall=clamp(u/.42),rest=clamp((u-.42)/.58),sw=Math.sin(u*18+i)*14,a=clamp(tau/.6)*clamp((1-u)/.12);
      const x0=LP.x+70+i*105,y=mix(LP.y+24,PS-2,ease(fall)),x=x0+sw*(1-rest)+rest*24;withA(c,a,()=>leaf(c,x,y+(rest>0?1.4*Math.sin(t*1.5+i):0),13,rest>0?.2*Math.sin(t+i):u*10,[ORANGE,SAND,GREEN,'#d97706'][i]));}
    c.save();c.beginPath();c.roundRect(RP.x,RP.y,RP.w,RP.h,14);c.clip();
    for(let i=0;i<4;i++){const u=mod((tau-.1)/3.6+i/4),fall=clamp(u/.45),go=clamp((u-.45)/.55),a=clamp(tau/.6);
      const x0=RP.x+60+i*100,x=x0+Math.sin(u*18+i)*12*(1-go)+go*go*320,y=go>0?streamSurf(x,t)-2:mix(RP.y+24,SS-2,ease(fall));
      withA(c,a,()=>leaf(c,x,y,13,go>0?go*9:u*10,[SAND,ORANGE,'#d97706',GREEN][i]));}
    c.restore();}
  surfLine(c,LP,pondSurf,t);surfLine(c,RP,streamSurf,t);
  D.round(c,LP.x,LP.y,LP.w,LP.h,14,null,C.edge);D.round(c,RP.x,RP.y,RP.w,RP.h,14,null,C.edge);

  // ── titles (all steps) ──
  tag(c,L('pond','池塘','Pond'),LP.x+LP.w/2,8,{al:'center',col:GREEN,active:true,size:24});
  tag(c,L('stream','溪流','Stream'),RP.x+RP.w/2,8,{al:'center',col:CYAN,active:true,size:24});

  // ── step 0 labels ──
  if(k===0){
    withA(c,fin(tau,1),()=>{const p=tag(c,L('stillWater','靜水','Still water'),LP.x+LP.w/2,PS+70,{al:'center',col:WHITE,active:true,size:24});if(tau>1.6)pulseRing(c,p,t,WHITE);});
    withA(c,fin(tau,1.8),()=>{const p=tag(c,L('flowingWater','流水','Flowing water'),RP.x+RP.w/2,SS+40,{al:'center',col:CYAN,active:true,size:24});if(tau>2.4)pulseRing(c,p,t,CYAN);
      const ax=p.x+p.w+14,ay=p.y+p.h/2,dx=8*mod(t*1.2);if(ax+60<RP.x+RP.w)K.arrow(c,ax+dx,ay,ax+44+dx,ay,CYAN,4);});
    withA(c,fin(tau,2.6),()=>{tag(c,L('flow','水流','Flow'),RP.x+12,SS-50,{col:WHITE,minX:RP.x+6});});
  }
  // ── step 1 labels ──
  if(k===1){
    withA(c,fin(tau,1),()=>{
      const cp=L('commonIn','常見於','Common in'),pn=L('pond','池塘','Pond'),sn=L('stream','溪流','Stream');
      tag(c,P(cp[0]+pn[0],cp[1]+' '+pn[1].toLowerCase()+'s'),LP.x+12,LP.y+12,{col:GREEN,minX:LP.x+6});
      tag(c,P(cp[0]+sn[0],cp[1]+' '+sn[1].toLowerCase()+'s'),RP.x+12,RP.y+12,{col:CYAN,minX:RP.x+6});});
    withA(c,fin(tau,1.4),()=>{
      const d=daphAt(0,t);const pd=tag(c,L('daphnia','水蚤','Water flea'),LP.x+14,PS+14,{col:WHITE,minX:LP.x+6});pointer(c,[pd.x+pd.w*.5,pd.y+pd.h+2],[d[0],d[1]-14],WHITE,t,false);
      const f=fishAt(t);tag(c,L('crucian','鯽魚','Crucian carp'),f.x,f.y+40,{al:'center',col:SAND,minX:LP.x+6,maxX:LP.x+LP.w-6});});
    withA(c,fin(tau,2),()=>{const p=tag(c,SWEPT,RP.x+12,SS-50,{col:ORANGE,minX:RP.x+6,maxX:RP.x+RP.w-6});});
    withA(c,fin(tau,3),()=>{const p=tag(c,L('hideBehind','躲在石頭後','Sheltering behind a stone'),RP.x+RP.w-12,PB-94,{al:'right',col:YELLOW,active:true,minX:RP.x+6});
      if(tau>3.6)pulseRing(c,p,t,YELLOW);pointer(c,[RP.x+RP.w-40,p.y-2],[SHRIMP.x+24,shY+4],YELLOW,t,false);
      tag(c,L('shrimp','米蝦','Freshwater shrimp'),RP.x+RP.w-12,PB-46,{al:'right',col:SAND,minX:RP.x+6,maxX:RP.x+RP.w-6});});
    text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),LP.x,590,22,MUTED,'left');
  }
  // ── step 2 labels ──
  if(k===2){
    withA(c,fin(tau,.8),()=>{tag(c,L('light','光','Light'),LP.x+12,PS-50,{col:YELLOW,active:true,minX:LP.x+6});tag(c,L('light','光','Light'),RP.x+12,SS-50,{col:YELLOW,active:true,minX:RP.x+6});});
    withA(c,fin(tau,1.8),()=>{tag(c,DARKER,LP.x+LP.w-12,PS+14,{al:'right',col:YELLOW,minX:LP.x+6});
      // depth arrow without numbers
      const x=LP.x+LP.w-34,y0=PS+68,y1=pondBot(x)-8;K.arrow(c,x,y0+20,x,y1,WHITE,4);K.arrow(c,x,y1-20,x,y0,WHITE,4);
      tag(c,L('depth','水深','Depth'),x-18,(y0+y1)/2-20,{al:'right',col:WHITE,minX:LP.x+6});});
    withA(c,fin(tau,2.6),()=>{const p=tag(c,TO_BOTTOM,RP.x+RP.w-12,SS+24,{al:'right',col:YELLOW,active:true,minX:RP.x+6});if(tau>3.2)pulseRing(c,p,t,YELLOW);});
    withA(c,fin(tau,3.4),()=>{const p=tag(c,L('waterPlant','水草','Water plants'),LP.x+14,PB-58,{col:GREEN,active:true,minX:LP.x+6});
      pointer(c,[p.x+p.w*.5,p.y-2],[PLANTS[1].x+4,pondBot(PLANTS[1].x)-30],GREEN,t,false);});
  }
  // ── step 3 labels, then the comparison ──
  if(k===3){
    const aT=fin(tau,4.6,.7),aL=1-aT;
    withA(c,fin(tau,.8)*aL,()=>{tag(c,L('bankLeaves','岸邊落葉','Leaves from the bank'),LP.x+12,LP.y+12,{col:ORANGE,minX:LP.x+6});tag(c,L('bankLeaves','岸邊落葉','Leaves from the bank'),RP.x+12,RP.y+12,{col:ORANGE,minX:RP.x+6});});
    withA(c,fin(tau,1.6)*aL,()=>{tag(c,L('mud','泥','Mud'),LP.x+300,PB-44,{al:'center',col:ORANGE,active:true});});
    withA(c,fin(tau,2.4)*aL,()=>{tag(c,L('stones','石頭與礫石','Stones and gravel'),RP.x+RP.w/2,PB-64,{al:'center',col:SAND,active:true});});
    withA(c,aT,()=>{
      const T={x:24,y:220,w:912,rh:58};D.round(c,T.x,T.y,T.w,T.rh*4+16,16,'rgba(22,51,43,.95)',C.edge);
      const rows=[[L('flow','水流','Flow'),L('stillWater','靜水','Still water'),L('flowingWater','流水','Flowing water')],
        [L('light','光','Light'),DARKER,TO_BOTTOM],[BOTTOM,L('mud','泥','Mud'),L('stones','石頭與礫石','Stones and gravel')],
        [BANKS,L('bankLeaves','岸邊落葉','Leaves from the bank'),L('bankLeaves','岸邊落葉','Leaves from the bank')]];
      rows.forEach(([nm,a,b],i)=>withA(c,clamp((tau-4.9-i*.3)/.4),()=>{const y=T.y+8+i*T.rh;
        if(i)K.sline(c,[[T.x+20,y],[T.x+T.w-20,y]],rgba(WHITE,.18),2);
        tag(c,nm,CW/2,y+9,{al:'center',col:YELLOW,active:true});
        text(c,a,LP.x+LP.w/2-30,y+38,22,GREEN,'center');text(c,b,RP.x+RP.w/2+30,y+38,22,CYAN,'center');}));});
    withA(c,fin(tau,6.4),()=>{const p=tag(c,L('clearNotClean','看起來清澈，不等於沒有汙染','Clear-looking water can still be polluted'),CW/2,492,{al:'center',col:YELLOW,active:true,size:24});if(tau>7)pulseRing(c,p,t,YELLOW);});
  }
  // ── notes (all steps) ──
  const sch=tag(c,L('schematic','示意','Schematic'),LP.x,496,{col:k===2?YELLOW:MUTED,active:k===2&&tau>1});
  if(k===2&&tau>1.6)pulseRing(c,sch,t,YELLOW);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));
  const st=s.psSt||(s.psSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.fromTau=t-st.T;st.k=k;st.T=t;}
  if(t<st.T){st.T=t-ck;st.from=-1;}
  const tau=t-st.T;
  step(c,k,tau,t);
  if(st.from>=0&&tau<OUT){
    c.save();c.globalAlpha*=1-smooth(tau/OUT);c.fillStyle='#11261f';c.fillRect(0,0,CW,600);step(c,st.from,st.fromTau,t);c.restore();}
}
window.EcologyDraw.pondstream=draw;
})();
