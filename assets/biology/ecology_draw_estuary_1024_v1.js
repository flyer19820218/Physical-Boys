/* Ecology lesson 4 · "estuary" canvas (coasts-ocean tab, view 0), 2026-10-24. Where the river meets the sea.
 * Scene: HB6_mangrove (1672x933, low tide: mangroves on the left, sea on the upper right, mudflat and a shallow channel between),
 * cropped to SC (image y 50-865, full width; scale K=936/1672). Points measured with PIL on HB6 (picture pixels):
 *   channel centre line (520,290) (600,295) (700,300) (790,315) (880,340) (980,375) (1080,400) (1200,425) (1320,455) (1450,470)
 *   (1560,480) (1672,490) (the part left of x 790 is the river drawn in, coming from behind the mangroves);
 *   horizon y 180, sea shore about y 255 (x 1100-1672); mangrove prop roots (440,300); mudflat for residents (850,700), (1150,720), (1480,640).
 * Over the scene the program lays see-through water (#38bdf8 family, tinted by salinity: cyan #55e9ff fresh -> deep blue #1d4e89 salty)
 * on the sea and on the channel, plus a salinity bar on the top row ("Fresh" ... "Salty", a white marker = the boundary, joined to the
 * water by a dashed line). Water level L (0 low .. 1 high) widens the channel (mostly toward the lower mudflat) and moves the sea shore;
 * a drawn tide post shows the level going up or down (words only, no numbers). L and the boundary B ease continuously between steps.
 * Four steps; s.shown = step. Play all runs 0,1,2,1,2,3 (high and low tide go back and forth); a held step is drawn on its own.
 *  0 river meets sea: river flow dashes to the right, sea ripples, mixing dots at the boundary; "River", "Sea", "Estuary: where river meets sea".
 *  1 high tide: big arrows push upstream (left), boundary moves left, water rises over the lower mudflat; "High tide", "Water rises",
 *    "Salt water pushes upstream"; "Salinity and water level here keep changing".
 *  2 low tide: arrows back to the right, boundary moves right, water falls, the mudflat is exposed; "Low tide", "Water falls",
 *    "River pushes back to the sea", "Mudflat exposed"; same closing line.
 *  3 who lives here: HB7 mudskipper and HB8 fiddler crab on the mudflat, a black-faced spoonbill (EC16 fly -> stand) lands and feeds,
 *    "Mangroves" points at the trees in HB6; water and boundary keep shifting a little; "Facing changes in salinity and water level".
 * No numbers anywhere (no salinity, level or tolerance values). Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const RISE=P('水位上升','Water rises'),FALL=P('水位下降','Water falls');
const SALT_IN=P('鹹水往上游推','Salt water pushes upstream');
const RIVER_BACK=P('河水推回海邊','River pushes back to the sea');
const MUD_OUT=P('泥灘露出','Mudflat exposed');
const KEEP_CHANGING=P('河口的鹽度和水位一直在變','Salinity and water level here keep changing');
const FACE=P('要面對鹽度和水位的變化','Facing changes in salinity and water level');
const FEEDING=P('在泥灘覓食','Feeding on the mudflat');
const N=4,PER=9,CW=960,OUT=.45;
const SEQ=[[0,9],[1,7],[2,7],[1,7],[2,7],[3,10]],TOTAL=SEQ.reduce((a,q)=>a+q[1],0);
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FRESH='#55e9ff',WATER='#38bdf8',SALTY='#1d4e89';
const FILL='rgba(11,26,21,.92)',PANEL='#16332b';

// ── helpers (same look as the pondstream / oxygen / mountain views) ───────
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
function bigArrow(c,x1,y1,x2,y2,col){K.arrow(c,x1,y1,x2,y2,'rgba(11,26,21,.8)',11);K.arrow(c,x1,y1,x2,y2,col,6);}
const fin=(tau,t0,d=.6)=>ease((tau-t0)/d);
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};

// ── layout ────────────────────────────────────────────────────────────────
const IW=1672,IH=933,SC={x:12,y:60,w:936,h:456},SB=SC.y+SC.h,KS=SC.w/IW,SY0=50;
const CROP=[0,SY0/IH,1,SC.h/KS/IH];
const M=([x,y])=>[SC.x+x*KS,SC.y+(y-SY0)*KS];                               // picture pixels -> canvas
const CH=[[520,290],[600,295],[700,300],[790,315],[880,340],[980,375],[1080,400],[1200,425],[1320,455],[1450,470],[1560,480],[1672,490],[1760,496]].map(M);
const CH_X0=CH[0][0];
const chY=x=>{if(x<=CH[0][0])return CH[0][1];for(let i=1;i<CH.length;i++)if(x<=CH[i][0]){const a=CH[i-1],b=CH[i];return mix(a[1],b[1],(x-a[0])/(b[0]-a[0]));}return CH[CH.length-1][1];};
const HORIZON=M([0,180])[1],SEA_X0=M([1100,0])[0],SHORE=M([0,255])[1];
const BAR={x:140,y:10,w:CW-8-140,h:36};
const POST={x:560,top:158,base:300};
const MANGROVE_PT=M([440,300]);
const SKIP={file:'HB7_mudskipper.png',x:466,y:428,w:168};
const CRAB={file:'HB8_fiddler_crab.png',x:622,y:440,w:100};
const BIRD={x:842,feet:448,w:112};                                           // standing spoonbill, flipped to face left
const SPOT_B={0:600,1:330,2:830};
const PRELOAD=['HB6_mangrove.jpg','HB7_mudskipper.png','HB8_fiddler_crab.png','EC16_spoonbill_stand.png','EC16_spoonbill_fly.png'];
const rnd=K.rng(1061);
const DASH=Array.from({length:22},()=>({o:rnd(),lane:rnd()*1.3-.45,v:.8+.4*rnd(),l:16+14*rnd()}));
const WAVES=Array.from({length:10},()=>({x:rnd(),y:rnd(),o:rnd()}));
const MIXD=Array.from({length:14},()=>({o:rnd(),dy:rnd()*2-1,s:rnd()<.5}));

// ── water state: level L (0 low .. 1 high), boundary B (canvas x) ─────────
function target(k,tau){
  if(k===3){const w=Math.sin(tau*.75);return{L:.2+.1*w,B:690+45*w};}
  return{L:[.42,1,0][k],B:SPOT_B[k]};}
const PRED={0:target(0,0),1:target(0,0),2:target(1,0),3:target(2,0)};
const DUR=[2,3.2,3.2,2];

// channel half widths at x (upper / lower), depending on L
function widths(x,L,t){const base=mix(7,28,smooth((x-330)/600)),g=.55+.45*smooth((x-380)/350),tp=smooth((x-CH_X0+6)/46);
  return[(base+26*L*g)*tp+1.2*Math.sin(x*.05+t*1.3),(base+100*L*g)*tp+2*Math.sin(x*.035-t*1.1)];}
// salinity colour at x (fresh cyan -> #38bdf8 at the boundary -> salty deep blue), see-through
function salCol(x,B){const u=clamp((x-(B-120))/240),[a,b,v]=u<.5?[FRESH,WATER,u*2]:[WATER,SALTY,u*2-1];return[hex(a).map((q,i)=>mix(q,hex(b)[i],v)),u<.5?mix(.42,.48,v):mix(.48,.62,v)];}
// gradient with soft ends: fade in from fx0 over fw pixels
function waterGrad(c,B,fx0,fw){const g=c.createLinearGradient(SC.x,0,SC.x+SC.w,0);
  for(let i=0;i<=40;i++){const x=SC.x+SC.w*i/40,[rgb,a]=salCol(x,B),f=smooth((x-fx0)/fw);g.addColorStop(i/40,`rgba(${rgb.map(Math.round).join(',')},${(a*f).toFixed(3)})`);}
  return g;}
function barGrad(c,B){const g=c.createLinearGradient(SC.x,0,SC.x+SC.w,0),st=x=>clamp((x-SC.x)/SC.w);
  g.addColorStop(0,FRESH);g.addColorStop(st(B-120),FRESH);g.addColorStop(st(B),WATER);g.addColorStop(st(B+120),SALTY);g.addColorStop(1,SALTY);return g;}
function channelPath(c,L,t){c.beginPath();const X1=SC.x+SC.w+4;
  for(let x=CH_X0-6;x<=X1;x+=6){const y=chY(x)-widths(x,L,t)[0];x===CH_X0-6?c.moveTo(x,y):c.lineTo(x,y);}
  for(let x=X1;x>=CH_X0-6;x-=6)c.lineTo(x,chY(x)+widths(x,L,t)[1]);c.closePath();}
const shoreY=(x,L,t)=>SHORE-4+22*L+3*Math.sin(x*.04+t*1.2);
function seaPath(c,L,t){c.beginPath();c.moveTo(SEA_X0,HORIZON);c.lineTo(SC.x+SC.w,HORIZON);
  for(let x=SC.x+SC.w;x>=SEA_X0;x-=6)c.lineTo(x,shoreY(x,L,t)-14*smooth((SEA_X0+40-x)/40));c.closePath();}
function water(c,W,t){
  c.save();c.beginPath();c.rect(SC.x,SC.y,SC.w,SC.h);c.clip();
  seaPath(c,W.L,t);c.fillStyle=waterGrad(c,W.B,SEA_X0+4,44);c.fill();
  channelPath(c,W.L,t);c.fillStyle=waterGrad(c,W.B,CH_X0-8,60);c.fill();
  // bright rim on both channel edges
  for(const side of [0,1]){c.beginPath();for(let x=CH_X0+40;x<=SC.x+SC.w;x+=6){const w=widths(x,W.L,t),y=side?chY(x)+w[1]:chY(x)-w[0];x===CH_X0+40?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=rgba(WHITE,.55);c.lineWidth=2.5;c.stroke();}
  c.beginPath();for(let x=SEA_X0+40;x<=SC.x+SC.w;x+=6){const y=shoreY(x,W.L,t);x===SEA_X0+40?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(WHITE,.5);c.lineWidth=2.5;c.stroke();
  c.restore();}
// flow dashes along the channel: dir +1 to the sea (right), -1 upstream (left)
function dashes(c,W,t,dir,a){withA(c,a,()=>{c.save();c.beginPath();c.rect(SC.x,SC.y,SC.w,SC.h);c.clip();c.lineCap='round';
  const x0=CH_X0+10,x1=SC.x+SC.w+20,span=x1-x0;
  for(const d of DASH){const x=x0+mod(d.o*span+dir*t*46*d.v,span),w=widths(x,W.L,t),y=chY(x)+(d.lane<0?d.lane*w[0]:d.lane*w[1]*.55);
    if(w[0]+w[1]<10)continue;const l=d.l*clamp((w[0]+w[1])/30);
    c.beginPath();c.moveTo(x-l/2,y+(chY(x-l/2)-chY(x)));c.lineTo(x+l/2,y+(chY(x+l/2)-chY(x)));c.strokeStyle=rgba(WHITE,.8);c.lineWidth=2.5;c.stroke();}
  c.restore();});}
function seaRipples(c,W,t){c.save();c.beginPath();seaPath(c,W.L,t);c.clip();
  for(const w of WAVES){const u=mod(t/3+w.o),x=SEA_X0+30+w.x*(SC.x+SC.w-SEA_X0-40),y=HORIZON+8+w.y*(SHORE-HORIZON-6);
    c.beginPath();c.moveTo(x-14-u*10,y);c.quadraticCurveTo(x,y-5,x+14+u*10,y);c.strokeStyle=rgba(WHITE,.75*Math.sin(Math.PI*u));c.lineWidth=2;c.stroke();}
  c.restore();}
// fresh and salty dots meeting near the boundary (schematic)
function mixing(c,W,t,a){withA(c,a,()=>{for(const m of MIXD){const u=mod(t/4+m.o),x=W.B+(m.s?-1:1)*(70-90*u),w=widths(x,W.L,t),y=chY(x)+m.dy*Math.min(w[0],w[1])*.6;
  circle(c,x,y,4.5,m.s?FRESH:'#3b7dd8',rgba(WHITE,.85),1.5);}});}

// ── pieces ────────────────────────────────────────────────────────────────
function salinityBar(c,W,t,k,tau,a){withA(c,a,()=>{
  tag(c,L('salinity','鹽度','Salinity'),8,8,{col:YELLOW,active:true});
  D.round(c,BAR.x,BAR.y,BAR.w,BAR.h,BAR.h/2,barGrad(c,W.B),WHITE);
  text(c,L('fresh','淡','Fresh'),BAR.x+16,BAR.y+BAR.h/2+8,22,C.deep,'left');
  text(c,L('salty','鹹','Salty'),BAR.x+BAR.w-16,BAR.y+BAR.h/2+8,22,WHITE,'right');
  // boundary marker
  const x=clamp((W.B-BAR.x)/BAR.w)*BAR.w+BAR.x;
  c.save();c.beginPath();c.moveTo(x-9,BAR.y-2);c.lineTo(x+9,BAR.y-2);c.lineTo(x,BAR.y+10);c.closePath();c.fillStyle=WHITE;c.fill();c.strokeStyle=C.deep;c.lineWidth=2;c.stroke();c.restore();
  K.line(c,[[x,BAR.y+8],[x,BAR.y+BAR.h]],WHITE,3);
  // moving hint arrow on the bar while the boundary travels
  if(k===1||k===2){const dir=k===1?-1:1,u=mod(t*.9),ax=x+dir*(22+18*u);withA(c,(1-u)*clamp(tau/.4),()=>K.arrow(c,ax-dir*16,BAR.y+BAR.h/2,ax,BAR.y+BAR.h/2,WHITE,4));}
});}
function boundaryLine(c,W,t,a){withA(c,a,()=>{const x=W.B,y1=chY(x)-widths(x,W.L,t)[0]-2;if(x<CH_X0)return;
  c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*12;K.line(c,[[x,BAR.y+BAR.h+2],[x,y1]],rgba(WHITE,.8),2.5);c.restore();});}
function post(c,L,t,a){withA(c,a,()=>{const {x,top,base}=POST,yw=mix(base-16,top+30,L)+1.5*Math.sin(t*2.2);
  D.round(c,x-8,top,16,base-top,5,'#8a6a45',C.ink);
  for(let y=top+18;y<base-6;y+=22)K.line(c,[[x-7,y],[x+7,y]],'rgba(11,26,21,.55)',2);
  // wet part below the water line
  c.save();c.beginPath();c.roundRect(x-8,yw,16,base-yw,4);c.fillStyle='rgba(23,80,111,.55)';c.fill();c.restore();
  K.ellipse(c,x,yw,20,5,null,WHITE,2.5);
  const u=mod(t*.8);K.ellipse(c,x,yw,20+u*14,5+u*3,null,rgba(WHITE,.7*(1-u)),2);
  return yw;});}
function bird(c,tau,t){
  const t0=.5,t1=2.7,u=clamp((tau-t0)/(t1-t0));
  if(tau<t0)return null;
  const p0=[1010,96],p1=[930,240],p2=[BIRD.x+6,BIRD.feet-70],q=K.bez(p0,p1,p2,ease(u));
  const flyA=u<1?1:clamp(1-(tau-t1)/.35),standA=clamp((tau-t1+.1)/.35);
  c.save();c.beginPath();c.rect(SC.x,SC.y,SC.w,SC.h);c.clip();
  if(flyA>0){const flap=Math.sin(tau*9)*.06;c.save();c.translate(q[0],q[1]);c.rotate(flap);K.at(c,'EC16_spoonbill_fly.png',0,0,150,{flip:true,alpha:flyA});c.restore();}
  if(standA>0){const ts=tau-t1,walk=6*Math.sin(ts*.55),dip=-.12*Math.max(0,Math.sin(ts*1.3)),h=BIRD.w*989/999;
    // ripples at the feet (standing in shallow water)
    const rU=mod(ts*.6);K.ellipse(c,BIRD.x+walk,BIRD.feet-2,14+rU*26,4+rU*5,null,rgba(WHITE,.7*(1-rU)*standA),2);
    c.save();c.translate(BIRD.x+walk,BIRD.feet);c.rotate(dip);K.drawIn(c,'EC16_spoonbill_stand.png',{x:-BIRD.w/2,y:-h,w:BIRD.w,h},{flip:true,alpha:standA});c.restore();}
  c.restore();
  return standA;}
function resident(c,R,t,a,bob){withA(c,a,()=>{const [W,H]=K.dim(R.file),h=R.w*H/W;
  K.ellipse(c,R.x,R.y+h/2-6,R.w*.5,9,'rgba(60,52,44,.45)');
  K.at(c,R.file,R.x+bob[0],R.y+bob[1],R.w);});}

// ── one step, drawn at its own time tau ────────────────────────────────────
function step(c,k,tau,t,W){
  // scene and water
  c.save();c.beginPath();c.roundRect(SC.x,SC.y,SC.w,SC.h,14);c.clip();c.fillStyle=PANEL;c.fillRect(SC.x,SC.y,SC.w,SC.h);
  K.drawIn(c,'HB6_mangrove.jpg',SC,{crop:CROP});c.restore();
  water(c,W,t);
  seaRipples(c,W,t);
  dashes(c,W,t,k===1?-1:1,k===1?.9:.75);
  if(k===0)mixing(c,W,t,fin(tau,2));
  boundaryLine(c,W,t,k===0?fin(tau,1.8):k===3?.5:.85);
  D.round(c,SC.x,SC.y,SC.w,SC.h,14,null,C.edge);
  salinityBar(c,W,t,k,tau,k===0?fin(tau,.3):1);

  // river and sea names (steps 0-2)
  if(k<3){
    withA(c,k===0?fin(tau,.9):1,()=>{const p=tag(c,L('river','河','River'),400,118,{al:'center',col:FRESH,active:true,size:24});
      pointer(c,[p.x+p.w/2,p.y+p.h+2],[CH[1][0]+30,chY(CH[1][0]+30)],FRESH,t,false);
      if(k===0){const ax=p.x+p.w+12,ay=p.y+p.h/2,dx=8*mod(t*1.2);K.arrow(c,ax+dx,ay,ax+40+dx,ay,FRESH,4);}});
    withA(c,k===0?fin(tau,1.5):1,()=>{const p=tag(c,L('sea','海','Sea'),880,72,{al:'center',col:'#7fb2f0',active:true,size:24});
      pointer(c,[p.x+p.w/2,p.y+p.h+2],[880,HORIZON+20],'#7fb2f0',t,false);});
  }
  // ── step 0 ──
  if(k===0){
    withA(c,fin(tau,2.6),()=>{const x=W.B,p=tag(c,L('estuary','河口：河海交界','Estuary: where river meets sea'),x,338,{al:'center',col:YELLOW,active:true,size:24,minX:SC.x+6,maxX:SC.x+SC.w-6});
      if(tau>3.2)pulseRing(c,p,t,YELLOW);pointer(c,[x,p.y-2],[x,chY(x)+widths(x,W.L,t)[1]-4],YELLOW,t);});
  }
  // ── steps 1 and 2: tides ──
  if(k===1||k===2){
    const hi=k===1;
    withA(c,fin(tau,.2),()=>tag(c,hi?L('highTide','漲潮','High tide'):L('lowTide','退潮','Low tide'),24,72,{col:hi?'#7fb2f0':FRESH,active:true,size:24}));
    // big arrows along the channel
    withA(c,fin(tau,.6)*Math.max(.45,clamp((5.6-tau)/.8)),()=>{for(let i=0;i<3;i++){const u=mod(t*.35+i/3),x=hi?mix(900,480,u):mix(480,900,u),y=chY(x),d=hi?-1:1;
      withA(c,Math.sin(Math.PI*u),()=>bigArrow(c,x-d*28,y-2+(chY(x-d*28)-y),x+d*28,y-2+(chY(x+d*28)-y),hi?'#3b7dd8':FRESH));}});
    withA(c,fin(tau,.4),()=>{post(c,W.L,t,1);
      const p=tag(c,hi?RISE:FALL,POST.x+20,POST.top-6,{col:WHITE});
      const ax=p.x+p.w+16,u=mod(t*1.1),y0=p.y+p.h/2+(hi?12:-12)-(hi?1:-1)*8*u;K.arrow(c,ax,y0,ax,y0+(hi?-22:22),WHITE,4);});
    withA(c,fin(tau,2),()=>{tag(c,hi?SALT_IN:RIVER_BACK,hi?560:770,hi?392:332,{al:'center',col:hi?'#7fb2f0':FRESH,active:true,minX:SC.x+6,maxX:SC.x+SC.w-6});});
    if(!hi)withA(c,fin(tau,2.8),()=>{const p=tag(c,MUD_OUT,250,420,{al:'center',col:SAND,active:true,size:24});if(tau>3.4)pulseRing(c,p,t,SAND);});
    withA(c,fin(tau,3.8),()=>{const p=tag(c,KEEP_CHANGING,CW/2,526,{al:'center',col:YELLOW,active:true});if(tau>4.4)pulseRing(c,p,t,YELLOW);});
  }
  // ── step 3: who lives here ──
  if(k===3){
    const aR=fin(tau,.3,.8);
    resident(c,SKIP,t,aR,[0,-1.5*Math.max(0,Math.sin(t*1.6))]);
    resident(c,CRAB,t,aR,[2.5*Math.sin(t*.9),0]);
    bird(c,tau,t);
    withA(c,fin(tau,1.2),()=>{const p=tag(c,L('mangrove','紅樹林','Mangroves'),24,72,{col:GREEN,active:true,size:24});
      pointer(c,[p.x+p.w*.6,p.y+p.h+2],MANGROVE_PT,GREEN,t);});
    withA(c,fin(tau,1.8),()=>tag(c,L('mudskipper','彈塗魚','Mudskipper'),SKIP.x,SKIP.y-84,{al:'center',col:SAND}));
    withA(c,fin(tau,2.2),()=>tag(c,L('fiddlerCrab','招潮蟹','Fiddler crab'),CRAB.x+10,CRAB.y-90,{al:'center',col:ORANGE}));
    withA(c,fin(tau,3),()=>tag(c,L('spoonbill','黑面琵鷺','Black-faced spoonbill'),BIRD.x,BIRD.feet-160,{al:'center',col:WHITE,maxX:SC.x+SC.w-6}));
    withA(c,fin(tau,3.4),()=>tag(c,FEEDING,SC.x+SC.w-6,BIRD.feet+6,{al:'right',col:WHITE}));
    withA(c,fin(tau,4.4),()=>{const p=tag(c,FACE,CW/2,526,{al:'center',col:YELLOW,active:true});if(tau>5)pulseRing(c,p,t,YELLOW);});
    text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),SC.x,590,22,MUTED,'left');
  }
  // ── notes (all steps) ──
  tag(c,L('schematic','示意','Schematic'),SC.x,526,{col:MUTED});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}

// ── frame ─────────────────────────────────────────────────────────────────
function clock(s,t){
  if(s.phase>=0){const r=K.stageClock(s,t,N,PER);return{k:r.k,tau:r.tau};}
  const q=mod(t-(s.start||0),TOTAL);let acc=0;
  for(const [k,d] of SEQ){if(q<acc+d)return{k,tau:q-acc};acc+=d;}
  return{k:3,tau:0};}
function draw(c,s,t){
  const {k,tau:ck}=clock(s,t);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));
  const st=s.esSt||(s.esSt={});
  if(st.k===undefined||t<st.T){st.k=k;st.from=-1;st.T=t-ck;const p=PRED[k];st.L0=p.L;st.B0=p.B;}
  if(st.k!==k){st.from=st.k;st.fromTau=t-st.T;st.k=k;st.T=t;st.L0=st.L;st.B0=st.B;}
  const tau=t-st.T,g=target(k,tau),u=smooth((tau-.3)/DUR[k]);
  const W={L:mix(st.L0,g.L,u),B:mix(st.B0,g.B,u)};st.L=W.L;st.B=W.B;
  step(c,k,tau,t,W);
  if(st.from>=0&&tau<OUT){
    c.save();c.globalAlpha*=1-smooth(tau/OUT);c.fillStyle='#11261f';c.fillRect(0,0,CW,600);step(c,st.from,st.fromTau+tau,t,W);c.restore();}
}
window.EcologyDraw.estuary=draw;
})();
