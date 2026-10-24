/* Ecology lesson 4 · "mountain" canvas (land-habitats tab, view 2, supplement), 2026-10-24. Climbing a mountain is a bit like going north.
 * Left: a camera view (560x450) into HB14_mountain (1672x933, the whole mountain: broadleaf foothills, conifers and mist, dark fir, grassy summit).
 * The camera starts on the whole mountain, pushes to the foothills and then climbs; a slow breathing keeps a held view alive.
 * Right: a close-up card (AI picture HB15..HB18, framed, named), a thermometer whose level drops and whose colour runs from warm orange
 * (#fb923c) to cold cyan (#55e9ff) as the camera climbs (words "Warmer" / "Cooler" only, no numbers, no ticks), and the step message.
 * A dashed pointer joins the card to a ring on the band it shows in the panorama. Points measured with PIL on HB14 (picture pixels):
 *   broadleaf canopy (320,700), tall conifer in the mist (740,520), dark fir band (870,350), grassy summit slope (620,220).
 *   HB18: upper juniper (530,380), grass slope (1150,470); the card crop shows both.
 * Mist: soft drifting veils over the view, strongest in the middle of the climb. HB17 is dark: drawn slightly brightened, labels sit on panels.
 * Three steps, 9 s each; s.shown = step. Step 1 starts where step 0 ended (foothills), step 2 where step 1 ended (fir); a 0.45 s cross-fade covers jumps.
 *  0 foothills: whole mountain -> push to the foothills; HB15 card "Broadleaf forest"; "Warmer" lights on the thermometer.
 *  1 going up: climb to the conifers and mist (HB16 card), then higher to the fir (HB17 card); "Higher, colder, and more mist".
 *  2 summit: climb to the summit (HB18 card, names "Juniper", "Dwarf bamboo"); "Colder still, trees stay low".
 * Always on: "Supplement", "Schematic: zones blend, they are not fixed height lines", "AI illustration, not a photo". No heights, no numbers.
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const GOING_UP=P('往上','Going up');
const HIGHER_MIST=P('越高越冷，霧也多了','Higher, colder, and more mist');
const COLDER_LOW=P('更冷，樹長不高','Colder still, trees stay low');
const JUNIPER=P('圓柏','Juniper'),BAMBOO=P('箭竹','Dwarf bamboo');
const N=3,PER=9,CW=960,OUT=.45;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted;
const FILL='rgba(11,26,21,.92)',PANEL='#16332b',CARD_BG='#1c3d34';

// ── helpers (same look as the climate / adapt views) ───────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function rowsOf(c,str,maxW,size){
  const w=r=>measure(c,[r,r],size);if(w(str)<=maxW)return[str];
  const m=str.match(/^(.+?[：，:,])\s*(.+)$/);
  if(m&&w(m[1])<=maxW)return[m[1],...rowsOf(c,m[2],maxW,size)];
  return K.splitLines(c,str,maxW,size);}
function box(c,p,x,y,{al='left',col=WHITE,active=false,size=22,maxW=220,minX=8,maxX=CW-8}={}){
  const rows=rowsOf(c,D.tr(p),maxW-28,size),lh=size+8,w=Math.max(...rows.map(r=>measure(c,[r,r],size)))+28,h=rows.length*lh+14;
  const bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:FILL,active?WHITE:rgba(col,.9));
  rows.forEach((r,i)=>text(c,[r,r],bx+w/2,y+7+i*lh+size*.86,size,active?C.deep:col,'center'));
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
const IW=1672,IH=933,PANO='HB14_mountain.jpg';
const VP={x:16,y:62,w:560,h:450};
const CARD={x:596,y:62,w:244};
const IMG={x:CARD.x+10,y:CARD.y+10,w:CARD.w-20,h:168};
const TH={x:916,top:108,bot:344};                     // thermometer tube
const MSG_Y=440;
// close-up cards: picture, crop centre/width (picture pixels), name, band point on HB14
const CARDS=[
  {file:'HB15_lowland.jpg',c:[836,466,1180],name:L('broadleaf','闊葉林','Broadleaf forest'),pt:[320,700],col:GREEN},
  {file:'HB16_cloudforest.jpg',c:[836,440,1180],name:L('mixed','針闊混合林與霧','Mixed conifer-broadleaf forest and mist'),pt:[740,520],col:GREEN},
  {file:'HB17_fir.jpg',c:[836,420,1180],name:L('fir','冷杉林','Fir forest'),pt:[870,350],col:CYAN,bright:1.3},
  {file:'HB18_alpine.jpg',c:[900,470,1180],name:L('alpine','矮灌叢與草坡','Low shrubs and grass slopes'),pt:[620,220],col:CYAN}];
const HB18_PTS={juniper:[530,380],bamboo:[1150,470]};
const PRELOAD=[PANO,...CARDS.map(q=>q.file)];
// camera keyframes [time, cx, cy, cw, height 0 foothills..1 summit]
const WIDE=[836,466,1180,0],FOOT=[430,640,760,0],MIX=[760,500,760,.45],FIR=[870,360,720,.75],TOP=[700,300,760,1];
const PATH=[
  [[0,...WIDE],[1.4,...WIDE],[3.6,...FOOT]],
  [[0,...FOOT],[.6,...FOOT],[2.6,...MIX],[4.6,...MIX],[6.4,...FIR]],
  [[0,...FIR],[.4,...FIR],[2.6,...TOP]]];
function camAt(k,tau){const p=PATH[k];if(tau<=p[0][0])return p[0].slice(1);
  for(let i=1;i<p.length;i++)if(tau<p[i][0]){const a=p[i-1],b=p[i],u=smooth((tau-a[0])/(b[0]-a[0]));return[1,2,3,4].map(j=>mix(a[j],b[j],u));}
  return p[p.length-1].slice(1);}
// cards per step: [time, index]; a new index cross-fades in over 0.6 s
const CARD_EV=[[[3.4,0]],[[0,0],[2.6,1],[6.2,2]],[[0,2],[2.4,3]]];
function cardAt(k,tau){const ev=CARD_EV[k];let cur=-1,prev=-1,u=1;
  for(const [t0,i] of ev)if(tau>=t0){prev=cur;cur=i;u=t0===0?1:ease((tau-t0)/.6);}
  return{cur,prev,u};}
const STEP_TAG=[L('foothill','山腳','Foothills'),GOING_UP,L('summit','山頂','Summit')];

// camera frame for the view rect
function frame(cam,R){let [cx,cy,cw]=cam,ch=cw*R.h/R.w;if(ch>IH){cw*=IH/ch;ch=IH;}if(cw>IW){ch*=IW/cw;cw=IW;}
  cx=Math.max(cw/2,Math.min(IW-cw/2,cx));cy=Math.max(ch/2,Math.min(IH-ch/2,cy));return{sx:cx-cw/2,sy:cy-ch/2,cw,ch,k:R.w/cw};}
function picIn(c,file,cam,R,{radius=14,bright=1}={}){
  const f=frame(cam,R),im=K.pic(K.src(file));
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,radius);c.clip();
  if(!im){c.fillStyle=PANEL;c.fillRect(R.x,R.y,R.w,R.h);}
  else{c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(bright!==1)c.filter=`brightness(${bright})`;c.drawImage(im,f.sx,f.sy,f.cw,f.ch,R.x,R.y,R.w,R.h);c.filter='none';}
  c.restore();
  return ([x,y])=>[R.x+(x-f.sx)*f.k,R.y+(y-f.sy)*f.k];}
// drifting mist veils inside rect R
function mist(c,R,a,t,seed=0){if(a<=.003)return;c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  for(let i=0;i<6;i++){const sp=10+i*4,x=R.x+mod((i*.37+seed)*R.w+t*sp,R.w+360)-180,y=R.y+R.h*(.2+.12*i)+10*Math.sin(t*.4+i*1.7),rx=150+30*(i%3),ry=26+8*(i%2);
    c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(236,242,240,${.5*a})`);g.addColorStop(1,'rgba(236,242,240,0)');
    c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
  c.restore();}
const mistAmt=h=>.85*clamp(1-Math.abs(h-.52)/.36);
// thermometer: level and colour from height h (0 foothills warm .. 1 summit cold)
function thermo(c,h,t,aWarm,aCool){
  const tw=16,top=TH.top,bot=TH.bot,x=TH.x,col=mixHex(ORANGE,CYAN,h);
  D.round(c,x-tw/2,top,tw,bot-top+8,tw/2,'rgba(242,236,217,.15)',WHITE);
  const lvl=mix(.88,.14,h)+.012*Math.sin(t*1.7),fy=mix(bot,top+8,lvl);
  D.round(c,x-tw/2+4,fy,tw-8,bot-fy+10,4,col);
  glow(c,x,bot+14,34,col,.35+.1*Math.sin(t*2.4));circle(c,x,bot+14,15,col,WHITE,3);
  // words only, no numbers
  const pc=tag(c,L('cool','較冷','Cooler'),CW-8,top-50,{al:'right',col:CYAN,active:aCool>.5,minX:CARD.x+CARD.w+8});
  const pw=tag(c,L('warm','較暖','Warmer'),CW-8,bot+40,{al:'right',col:ORANGE,active:aWarm>.5,minX:CARD.x+CARD.w+8});
  if(aWarm>.5)pulseRing(c,pw,t,ORANGE);if(aCool>.5)pulseRing(c,pc,t,CYAN);}
function mixHex(a,b,u){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ch=s=>Math.round(mix(pa>>s&255,pb>>s&255,clamp(u)));return `rgb(${ch(16)},${ch(8)},${ch(0)})`;}

// ── close-up card ─────────────────────────────────────────────────────────
function cardLayer(c,i,a,t,aName=a){withA(c,a,()=>{const q=CARDS[i],cam=[q.c[0]+24*Math.sin(t*.4+i),q.c[1]+8*Math.sin(t*.5),q.c[2]*(1-.03*(.5+.5*Math.sin(t*.6)))];
  const map=picIn(c,q.file,cam,IMG,{radius:10,bright:q.bright||1});
  if(i===1)mist(c,IMG,.55,t,.3);
  // juniper tag top left over the upper juniper, bamboo tag on the lower right grass; pointers never cross a tag
  if(i===3){const pj=tag(c,JUNIPER,IMG.x+6,IMG.y+8,{col:WHITE,minX:IMG.x+4,maxX:IMG.x+IMG.w-4});
      pointer(c,[pj.x+pj.w*.4,pj.y+pj.h+2],map(HB18_PTS.juniper),WHITE,t,false);
    const pb=tag(c,BAMBOO,IMG.x+IMG.w-6,IMG.y+IMG.h-46,{al:'right',col:YELLOW,minX:IMG.x+4,maxX:IMG.x+IMG.w-4});
      pointer(c,[pb.x+pb.w*.6,pb.y-2],map(HB18_PTS.bamboo),YELLOW,t,false);}
  D.round(c,IMG.x,IMG.y,IMG.w,IMG.h,10,null,rgba(WHITE,.85));});
  // the name swaps without overlapping: the old one is gone before the new one comes in
  withA(c,aName,()=>box(c,CARDS[i].name,CARD.x+CARD.w/2,IMG.y+IMG.h+12,{al:'center',col:CARDS[i].col,active:true,maxW:CARD.w-8,minX:CARD.x+4,maxX:CARD.x+CARD.w-4}));}

// ── one step, drawn at its own time tau ────────────────────────────────────
function step(c,k,tau,t){
  const [cx,cy,cw,h]=camAt(k,tau),cam=[cx+5*Math.sin(t*.45),cy+3*Math.sin(t*.6),cw*(1-.014*(.5+.5*Math.sin(t*.7)))];
  // top row
  const st=tag(c,STEP_TAG[k],VP.x,12,{col:k===0?ORANGE:CYAN,active:true});
  tag(c,L('supplement','補充','Supplement'),st.x+st.w+12,12,{col:YELLOW});
  // camera view
  const map=picIn(c,PANO,cam,VP);
  mist(c,VP,mistAmt(h),t);
  D.round(c,VP.x,VP.y,VP.w,VP.h,14,null,C.edge);
  // climbing arrow while the camera moves up (step 1 and 2)
  if(k>0){const a=clamp(Math.min((tau-.6)/.5,(k===1?6.6:2.8)-tau))*.95;
    withA(c,a,()=>{const x=VP.x+34,y0=VP.y+VP.h-40,y1=VP.y+60;c.save();c.lineCap='round';c.setLineDash([8,7]);c.lineDashOffset=t*16;
      c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1+18);c.strokeStyle='rgba(11,26,21,.7)';c.lineWidth=8;c.stroke();c.strokeStyle=CYAN;c.lineWidth=4;c.stroke();c.restore();
      K.arrow(c,x,y1+30,x,y1,CYAN,4);});}
  // card + ring on the band it shows
  const cs=cardAt(k,tau),aCard=cs.cur<0?0:cs.prev<0?cs.u:1;
  withA(c,aCard,()=>{
    const nameH=i=>i<0?0:rowsOf(c,D.tr(CARDS[i].name),CARD.w-36,22).length*30+14;
    D.round(c,CARD.x,CARD.y,CARD.w,IMG.h+34+Math.max(nameH(cs.cur),nameH(cs.prev)),14,CARD_BG,C.edge);
    if(cs.prev>=0)cardLayer(c,cs.prev,1-cs.u,t,clamp(1-2.5*cs.u));
    if(cs.cur>=0)cardLayer(c,cs.cur,cs.prev>=0?cs.u:1,t,cs.prev>=0?clamp(2.5*cs.u-1.5):1);});
  const ringOf=(i,a)=>withA(c,a,()=>{const p=map(CARDS[i].pt);if(p[0]<VP.x+12||p[0]>VP.x+VP.w-12||p[1]<VP.y+12||p[1]>VP.y+VP.h-12)return;
    pointer(c,[CARD.x-2,IMG.y+IMG.h*.6],p,YELLOW,t);});
  if(cs.cur>=0){if(cs.prev>=0)ringOf(cs.prev,(1-cs.u)*aCard);ringOf(cs.cur,(cs.prev>=0?cs.u:1)*aCard);}
  // thermometer
  thermo(c,h,t,k===0?fin(tau,2.4):0,k===2?fin(tau,2.6):0);
  // message
  if(k===0)withA(c,fin(tau,4.2),()=>{const a=tag(c,L('warm','較暖','Warmer'),CARD.x,MSG_Y,{col:ORANGE,active:true});
    const b=tag(c,L('broadleaf','闊葉林','Broadleaf forest'),a.x+a.w+12,MSG_Y,{col:GREEN,active:true});if(tau>4.8)pulseRing(c,b,t,GREEN);});
  if(k===1)withA(c,fin(tau,3.2),()=>{const b=box(c,HIGHER_MIST,CARD.x,MSG_Y,{col:YELLOW,active:true,maxW:CW-8-CARD.x,minX:CARD.x});if(tau>3.8)pulseRing(c,b,t,YELLOW);});
  if(k===2)withA(c,fin(tau,3.2),()=>{const b=box(c,COLDER_LOW,CARD.x,MSG_Y,{col:CYAN,active:true,maxW:CW-8-CARD.x,minX:CARD.x});if(tau>3.8)pulseRing(c,b,t,CYAN);});
  // notes (always on)
  K.wrap(c,L('bandsBlend','示意：各帶是漸變，不是固定的海拔界線','Schematic: zones blend, they are not fixed height lines'),VP.x,VP.y+VP.h+30,VP.w,22,MUTED,28);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-14,590,22,MUTED,'right');
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));
  const st=s.mtSt||(s.mtSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.fromTau=t-st.T;st.k=k;st.T=t;}
  if(t<st.T){st.T=t-ck;st.from=-1;}
  const tau=t-st.T;
  step(c,k,tau,t);
  if(st.from>=0&&tau<OUT){
    c.save();c.globalAlpha*=1-smooth(tau/OUT);c.fillStyle='#11261f';c.fillRect(0,0,CW,600);step(c,st.from,st.fromTau,t);c.restore();}
}
window.EcologyDraw.mountain=draw;
})();
