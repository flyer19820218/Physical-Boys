/* Fossils · environment tab, view 0 "Coral in a cliff" (window.FossilDraw.cliff), 2026-10-21.
 * Keeps observation and inference apart. Colours, fixed for the whole view:
 * observation = cyan, known condition = green, inference = yellow, still to check = orange.
 * Pictures: coral_fossil_cliff.jpg and coral_reef_today.jpg (AI illustrations, not photographs).
 * Coral positions below are fractions of coral_fossil_cliff.jpg, read off the picture.
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,TAU,text,wrap,pill,cpill,arrow,dashed,circle,line,sline,glow,pulse,stageClock,fade,smooth,ease,mix,clamp,mod,drawIn,measure,D,rgba,pt}=K;
const N=4,PER=7;
const CLIFF='coral_fossil_cliff.jpg',REEF='coral_reef_today.jpg';
const OBS=C.cyan,KNOWN=C.green,INFER=C.yellow,CHECK=C.orange,WATER='#5fc8f0';

// coral fossils in the cliff picture: [fx, fy, radius as a fraction of the picture width]
const CORALS=[[.597,.507,.032],[.43,.55,.05],[.497,.47,.04],[.688,.51,.022],[.808,.522,.036],[.678,.658,.03],[.76,.66,.03],[.541,.748,.024]];
const CROP=[.56,.39,.22,.396];          // square close-up around the brain corals
const SEA_LEVEL=.17;                    // the imagined sea surface, fraction of the cliff picture height

// picture rectangles for each step (the pictures slide between them)
const CL=[{x:30,y:84,w:700,h:389},{x:24,y:140,w:300,h:167},{x:24,y:124,w:400,h:222},{x:24,y:96,w:380,h:211}];
const RF=[{x:990,y:84,w:560,h:311,a:0},{x:370,y:84,w:560,h:311,a:1},{x:536,y:124,w:400,h:222,a:1},{x:990,y:124,w:400,h:222,a:0}];
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u),a:mix(a.a==null?1:a.a,b.a==null?1:b.a,u)});
function frame(c,r,color,w=2.5){c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,16);c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}

// ── small icons ────────────────────────────────────────────────────────────
function eyeIcon(c,x,y,s,color){
  c.save();c.strokeStyle=color;c.lineWidth=2.5;c.beginPath();c.moveTo(x-s,y);
  c.quadraticCurveTo(x,y-s*.95,x+s,y);c.quadraticCurveTo(x,y+s*.95,x-s,y);c.closePath();c.stroke();
  circle(c,x,y,s*.36,color,null);c.restore();}
function bookIcon(c,x,y,s,color){
  c.save();c.strokeStyle=color;c.lineWidth=2.5;c.lineJoin='round';c.beginPath();
  c.moveTo(x,y-s*.55);c.quadraticCurveTo(x-s*.5,y-s*.85,x-s,y-s*.6);c.lineTo(x-s,y+s*.7);c.quadraticCurveTo(x-s*.5,y+s*.45,x,y+s*.75);
  c.quadraticCurveTo(x+s*.5,y+s*.45,x+s,y+s*.7);c.lineTo(x+s,y-s*.6);c.quadraticCurveTo(x+s*.5,y-s*.85,x,y-s*.55);c.lineTo(x,y+s*.75);c.stroke();c.restore();}
function bulbIcon(c,x,y,s,color){
  c.save();circle(c,x,y-s*.25,s*.62,null,color,2.5);
  line(c,[[x-s*.32,y+s*.5],[x+s*.32,y+s*.5]],color,2.5);line(c,[[x-s*.22,y+s*.85],[x+s*.22,y+s*.85]],color,2.5);c.restore();}
function qIcon(c,x,y,color){text(c,'?',x,y+8,22,color,'center');}
function icon(c,kind,x,y,s,color){({eye:eyeIcon,book:bookIcon,bulb:bulbIcon})[kind]?({eye:eyeIcon,book:bookIcon,bulb:bulbIcon})[kind](c,x,y,s,color):qIcon(c,x,y,color);}
// thermometer: x centre, y top, h tube height, lvl 0..1
function thermo(c,x,y,h,lvl,color){
  D.round(c,x-6,y,12,h,6,'rgba(11,26,21,.8)',color);
  circle(c,x,y+h+6,10,color,C.ink,2);
  const fh=(h-6)*lvl;c.fillStyle=color;c.fillRect(x-2.5,y+h-fh,5,fh+2);
  for(let i=1;i<4;i++)line(c,[[x+6,y+i*h/4],[x+11,y+i*h/4]],color,2);}
function sunIcon(c,x,y,r,t,color){
  circle(c,x,y,r+16,'rgba(11,26,21,.55)',null);
  circle(c,x,y,r,rgba(color,.35),color,3);
  for(let i=0;i<8;i++){const q=i*TAU/8+t*.25;line(c,[[x+Math.cos(q)*(r+4),y+Math.sin(q)*(r+4)],[x+Math.cos(q)*(r+12),y+Math.sin(q)*(r+12)]],color,3);}}
// a line that stays readable on a bright picture: dark under-stroke, colour on top
function darkLine(c,pts,color,w,dash,off=0){
  c.save();c.setLineDash(dash||[]);c.lineDashOffset=off;line(c,pts,'rgba(11,26,21,.7)',w+3);line(c,pts,color,w);c.restore();}
// rock layers with a tiny shell: sedimentary rock
function layersIcon(c,x,y,color){
  const cols=['#e8d9ae','#9c8f78','#d2bf8f','#7d7464'];
  c.save();c.beginPath();c.roundRect(x-26,y-20,52,40,5);c.clip();
  cols.forEach((f,i)=>{c.fillStyle=f;c.beginPath();c.moveTo(x-26,y-20+i*10+Math.sin(i)*2);
    c.quadraticCurveTo(x,y-24+i*10,x+26,y-20+i*10);c.lineTo(x+26,y+20);c.lineTo(x-26,y+20);c.closePath();c.fill();});
  c.beginPath();c.arc(x+8,y+4,6,Math.PI,0);c.closePath();c.fillStyle=C.white;c.fill();c.strokeStyle=C.deep;c.lineWidth=1.5;c.stroke();
  c.restore();D.round(c,x-26,y-20,52,40,5,null,color);}
// a wavy current carrying a little shell
function currentIcon(c,x,y,t,color){
  const pts=[];for(let i=0;i<=20;i++){const u=i/20;pts.push([x-24+u*42,y+Math.sin(u*TAU*1.2-t*3)*5]);}
  sline(c,pts,color,3);arrow(c,x+14,y,x+26,y,color,3);
  const u=mod(t*.35),sx=x-22+u*40;circle(c,sx,y-12,4.5,C.sand,C.deep,1.5);}
function clockIcon(c,x,y,t,color){
  circle(c,x,y,20,'rgba(11,26,21,.8)',color,3);
  const a=t*.9-Math.PI/2,b=t*.08-Math.PI/2;
  line(c,[[x,y],[x+Math.cos(b)*10,y+Math.sin(b)*10]],color,3);line(c,[[x,y],[x+Math.cos(a)*15,y+Math.sin(a)*15]],color,2);
  circle(c,x,y,2.5,color,null);}

// ── the top flow: observation → known → inference → to check ───────────────
const FLOW=[{name:P('觀察','Observation'),col:OBS,icon:'eye'},{name:P('已知條件','Known'),col:KNOWN,icon:'book'},
  {name:P('推論','Inference'),col:INFER,icon:'bulb'},{name:P('待查證','To check'),col:CHECK,icon:'q'}];
const FX0=26,FW=200,FG=36,FY=14,FH=50;
function flowBar(c,k,t){
  FLOW.forEach((f,i)=>{
    const x=FX0+i*(FW+FG),on=i===k,past=i<k;
    if(on){c.save();c.shadowColor=f.col;c.shadowBlur=12+8*Math.sin(t*2.2);D.round(c,x,FY,FW,FH,FH/2,f.col,C.white);c.restore();}
    else D.round(c,x,FY,FW,FH,FH/2,'rgba(11,26,21,.85)',rgba(f.col,past?.85:.4));
    const ink=on?C.deep:rgba(f.col,past?1:.55),tw=measure(c,f.name,22),gw=24+8+tw,gx=x+(FW-gw)/2;
    icon(c,f.icon,gx+12,FY+FH/2,11,ink);
    text(c,f.name,gx+32,FY+FH/2+8,22,ink);
    if(i<3)arrow(c,x+FW+6,FY+FH/2,x+FW+FG-6,FY+FH/2,rgba(C.white,.6),3);
    D.hit(x,FY,FW,FH,'phase',i);
  });
}

// ── shared overlays ────────────────────────────────────────────────────────
function ringXY(r,cor){return pt(r,cor[0],cor[1]);}
// the imagined ancient sea over the cliff: a pale blue wash below a dashed (inferred) waterline
function sea(c,r,level,t,a){
  if(a<=0||level>=1)return;
  const wy=r.y+level*r.h,wave=x=>wy+Math.sin(x/34+t*1.5)*3;
  c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,16);c.clip();c.globalAlpha*=a;
  const g=c.createLinearGradient(0,wy,0,r.y+r.h);g.addColorStop(0,rgba(WATER,.32));g.addColorStop(1,rgba(C.seaDeep,.6));
  c.beginPath();c.moveTo(r.x,r.y+r.h);for(let x=0;x<=r.w;x+=8)c.lineTo(r.x+x,wave(x));c.lineTo(r.x+r.w,r.y+r.h);c.closePath();c.fillStyle=g;c.fill();
  const pts=[];for(let x=0;x<=r.w;x+=8)pts.push([r.x+x,wave(x)]);
  c.setLineDash([10,7]);c.lineDashOffset=-t*18;sline(c,pts,INFER,3);
  c.restore();}
// a statement box: icon on the left, wrapped text
function statement(c,x,y,w,h,color,kind,p,a=1,size=22){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  D.round(c,x,y,w,h,14,rgba(color,.1),rgba(color,.85));
  icon(c,kind,x+30,y+h/2,12,color);
  const rows=K.splitLines(c,D.tr(p),w-80,size).length,lh=Math.round(size*1.38);
  wrap(c,p,x+58,y+h/2-(rows*lh)/2+size*.95,w-80,size,color,lh);
  c.restore();}

// ── step 1: what we see ────────────────────────────────────────────────────
const INSET={x:748,y:160,w:188,h:188};
function step0(c,r,lt,t){
  const a=fade(lt,.6,.5);if(a<=0)return;
  c.save();c.globalAlpha*=a;
  // the close-up: which part of the cliff it shows
  const cr={x:r.x+CROP[0]*r.w,y:r.y+CROP[1]*r.h,w:CROP[2]*r.w,h:CROP[3]*r.h};
  dashed(c,[[cr.x,cr.y],[cr.x+cr.w,cr.y],[cr.x+cr.w,cr.y+cr.h],[cr.x,cr.y+cr.h],[cr.x,cr.y]],rgba(OBS,.75),2);
  dashed(c,[[cr.x+cr.w,cr.y],[INSET.x,INSET.y]],rgba(OBS,.6),2);
  dashed(c,[[cr.x+cr.w,cr.y+cr.h],[INSET.x,INSET.y+INSET.h]],rgba(OBS,.6),2);
  drawIn(c,CLIFF,INSET,{radius:14,crop:CROP});frame(c,INSET,OBS,3);
  // fossils found one after another, then each keeps pulsing
  CORALS.forEach((cor,i)=>{const u=ease((lt-.9-i*.3)/.5);if(u<=0)return;
    const [x,y]=ringXY(r,cor),rad=cor[2]*r.w*1.1;
    circle(c,x,y,rad*(1.6-.6*u),null,rgba(OBS,.95*u),3);
    if(u>=1)pulse(c,x,y,t+i*.31,OBS,rad);
    const fx=(cor[0]-CROP[0])/CROP[2],fy=(cor[1]-CROP[1])/CROP[3];
    if(fx>.08&&fx<.92&&fy>.08&&fy<.92){const ix=INSET.x+fx*INSET.w,iy=INSET.y+fy*INSET.h,ir=cor[2]/CROP[2]*INSET.w*1.05;
      c.save();c.beginPath();c.roundRect(INSET.x,INSET.y,INSET.w,INSET.h,14);c.clip();
      circle(c,ix,iy,ir,null,rgba(OBS,.95*u),3);if(u>=1)pulse(c,ix,iy,t+i*.31+.4,OBS,ir);c.restore();}});
  // names
  const la=fade(lt,1.4,.5);
  if(la>0){c.save();c.globalAlpha*=la;
    const px=r.x+.5*r.w,py=r.y+.25*r.h;
    [0,1,2].forEach(i=>{const [x,y]=ringXY(r,CORALS[i]),rad=CORALS[i][2]*r.w*1.1,d=Math.hypot(x-px,y-py-40);
      line(c,[[px,py+40],[x-(x-px)/d*rad,y-(y-py-40)/d*rad]],rgba(OBS,.9),2.5);});
    cpill(c,P('珊瑚化石','Coral fossils'),px,py,{color:OBS,active:true});
    const [rx,ry]=pt(r,.17,.62);cpill(c,P('山壁岩層','Cliff rock'),rx,ry-20,{color:OBS});
    cpill(c,P('放大','Close-up'),INSET.x+INSET.w/2,INSET.y+INSET.h+12,{color:OBS,maxX:946});
    c.restore();}
  c.restore();
  statement(c,30,492,906,88,OBS,'eye',P('觀察：山壁的岩層裡有珊瑚化石。這是看得到的事實。','Observation: there are coral fossils in the cliff rock. This is a fact we can see.'),fade(lt,1.8,.6));
}

// ── step 2: what we already know about reef corals ─────────────────────────
function step1(c,cr,r,lt,t){
  // the cliff, now small: what we saw
  const a0=fade(lt,.9,.5);
  if(a0>0){c.save();c.globalAlpha*=a0;
    pill(c,P('觀察：珊瑚化石','Seen: coral fossils'),cr.x,cr.y-50,{color:OBS});
    const [x,y]=ringXY(cr,CORALS[0]);circle(c,x,y,CORALS[0][2]*cr.w*1.2,null,OBS,2.5);pulse(c,x,y,t,OBS,CORALS[0][2]*cr.w*1.2);
    // only reef-building corals
    const nx=CL[1].x,ny=CL[1].y+CL[1].h+26,nw=CL[1].w;
    c.save();c.setLineDash([7,6]);D.round(c,nx,ny,nw,124,14,'rgba(11,26,21,.55)',rgba(KNOWN,.7));c.restore();
    text(c,P('只說造礁珊瑚','Reef-building corals only'),nx+16,ny+36,22,KNOWN);
    wrap(c,P('有些珊瑚住在又深又冷、沒有陽光的海裡。','Some corals live in deep, cold, dark water.'),nx+16,ny+72,nw-32,22,C.muted);
    c.restore();}
  // the reef: conditions, one after another
  const at=(i)=>fade(lt,1.1+i*.55,.5);
  c.save();
  if(at(0)>0){c.save();c.globalAlpha*=at(0);pill(c,P('今天的珊瑚礁','A reef today'),r.x+12,r.y+12,{color:KNOWN,active:true});c.restore();}
  // warm
  const g1=at(1);if(g1>0){c.save();c.globalAlpha*=g1;const [x,y]=pt(r,.05,.22);
    thermo(c,x,y,46,.62+.12*Math.sin(t*1.4),KNOWN);pill(c,P('溫暖','Warm'),x+22,y+6,{color:KNOWN});c.restore();}
  // clear
  const g2=at(2);if(g2>0){c.save();c.globalAlpha*=g2;const [x,y]=pt(r,.36,.33);
    eyeIcon(c,x,y,16,KNOWN);
    pill(c,P('清澈','Clear'),x+24,y-20,{color:KNOWN});c.restore();}
  // sunlit: rays reaching down to the reef
  const g3=at(3);if(g3>0){c.save();c.globalAlpha*=g3;const [x,y]=pt(r,.6,.13);
    [[-.02,.44],[.06,.44],[.14,.44]].forEach(([dx,fy],i)=>{const [ex,ey]=pt(r,.6+dx,fy);
      darkLine(c,[[x+(ex-x)*.3,y+(ey-y)*.3],[ex,ey]],KNOWN,3,[9,8],-t*22-i*5);});
    sunIcon(c,x,y,13,t,KNOWN);pill(c,P('陽光照得到','Sunlit'),x+28,y-20,{color:KNOWN});c.restore();}
  // shallow: a depth bar from the surface down to the sea floor
  const g4=at(4);if(g4>0){c.save();c.globalAlpha*=g4;const bx=r.x+r.w-26,y0=r.y+10,y1=r.y+.62*r.h;
    darkLine(c,[[bx,y0],[bx,y1]],KNOWN,3);darkLine(c,[[bx-10,y1],[bx+10,y1]],KNOWN,3);
    const wv=[];for(let i=0;i<=12;i++)wv.push([bx-14+i*28/12,y0+Math.sin(i*.9-t*3)*3]);sline(c,wv,'rgba(11,26,21,.7)',6);sline(c,wv,KNOWN,3);
    for(let i=1;i<4;i++)darkLine(c,[[bx-7,mix(y0,y1,i/4)],[bx,mix(y0,y1,i/4)]],KNOWN,2.5);
    const w=measure(c,P('淺海','Shallow'),22)+28;pill(c,P('淺海','Shallow'),bx-14-w,r.y+.33*r.h-20,{color:KNOWN});c.restore();}
  c.restore();
  statement(c,RF[1].x,412,RF[1].w,100,KNOWN,'book',P('已知：現在的造礁珊瑚，生活在溫暖、清澈、陽光照得到的淺海。','Known: reef-building corals today live in warm, clear, sunlit shallow seas.'),fade(lt,.5,.6));
}

// ── step 3: the inference ──────────────────────────────────────────────────
function step2(c,cr,r,lt,t){
  const a=fade(lt,.9,.5);
  // the water rises over the cliff: imagined, not photographed
  const lvl=mix(1,SEA_LEVEL,smooth((lt-1.2)/3));
  sea(c,cr,lvl,t,a);
  if(a>0){c.save();c.globalAlpha*=a;
    cpill(c,P('山壁：珊瑚化石','Cliff: coral fossils'),cr.x+cr.w/2,cr.y-46,{color:OBS});
    cpill(c,P('今天的珊瑚礁','A reef today'),r.x+r.w/2,r.y-46,{color:KNOWN});
    const la=fade(lt,3.6,.6);
    if(la>0){c.save();c.globalAlpha*=la;pill(c,P('想像的古海','Imagined ancient sea'),cr.x+12,cr.y+SEA_LEVEL*cr.h+12,{color:INFER});c.restore();}
    // the inference arrow: from today's reef to the cliff
    const y=cr.y+cr.h/2+14,x0=r.x-10,x1=cr.x+cr.w+10;
    arrow(c,x0,y,x1,y,rgba(INFER,.9),4);
    for(let i=0;i<3;i++){const u=mod(t*.5+i/3),x=mix(x0-8,x1+18,u);circle(c,x,y,5,rgba(INFER,Math.sin(u*Math.PI)),null);}
    text(c,P('推論','Infer'),(x0+x1)/2,y-18,22,INFER,'center');
    c.restore();}
  statement(c,24,370,912,70,INFER,'bulb',P('推論：這裡很久以前，可能是一片溫暖的淺海。','Inference: long ago, this place may have been a warm shallow sea.'),fade(lt,1.6,.6),24);
  const b=fade(lt,2.6,.6);
  if(b>0){c.save();c.globalAlpha*=b;
    D.round(c,24,456,912,62,14,rgba(CHECK,.08),rgba(CHECK,.7));
    text(c,'!',54,495,24,CHECK,'center');
    wrap(c,P('假設：古代珊瑚和今天的造礁珊瑚，需要相似的環境。','Assumes: ancient corals needed the same conditions as reef corals today.'),82,495,840,22,CHECK);
    text(c,P('「可能」：推論不是親眼看到的。','"May": an inference is not something seen directly.'),480,560,22,C.muted,'center');
    c.restore();}
}

// ── step 4: what must still be checked ─────────────────────────────────────
const CARDS=[{p:P('是海裡堆積的沉積岩嗎？','Is it sedimentary rock laid down in the sea?'),ic:'layers'},
  {p:P('化石有沒有被水流搬來？','Were the fossils carried in by water?'),ic:'current'},
  {p:P('岩層有多老？','How old is the rock?'),ic:'clock'}];
const CX=428,CW=508,CH=80,CY=[92,182,272];
const BAR={x:60,y:476,w:840,h:24},LEVELS=[.24,.44,.62,.78];
function step3(c,cr,lt,t){
  const a=fade(lt,.6,.5);
  sea(c,cr,SEA_LEVEL,t,a*.7);
  if(a>0){c.save();c.globalAlpha*=a;pill(c,P('想像的古海','Imagined ancient sea'),cr.x+12,cr.y+SEA_LEVEL*cr.h+12,{color:INFER});c.restore();}
  statement(c,cr.x,cr.y+cr.h+16,cr.w,108,INFER,'bulb',P('推論：這裡以前可能是溫暖的淺海。','Inference: this may once have been a warm shallow sea.'),a);
  // the three checks, one after another
  CARDS.forEach((cd,i)=>{const u=ease((lt-1-i*1.3)/.6);if(u<=0)return;
    const x=CX+(1-u)*40,y=CY[i];c.save();c.globalAlpha*=u;
    D.round(c,x,y,CW,CH,14,rgba(CHECK,.1),rgba(CHECK,.85));
    const qx=x+36,qy=y+CH/2;pulse(c,qx,qy,t+i*.4,CHECK,18);circle(c,qx,qy,18,CHECK,null);text(c,'?',qx,qy+8,22,C.deep,'center');
    const rows=K.splitLines(c,D.tr(cd.p),CW-150,22).length;
    wrap(c,cd.p,x+70,qy-rows*15+21,CW-150,22,C.white,30);
    const ix=x+CW-44;
    if(cd.ic==='layers')layersIcon(c,ix,qy,CHECK);else if(cd.ic==='current')currentIcon(c,ix,qy,t,CHECK);else clockIcon(c,ix,qy,t,CHECK);
    c.restore();});
  // more evidence → a more reliable inference (never full)
  const b=fade(lt,.8,.5);if(b<=0)return;
  c.save();c.globalAlpha*=b;
  text(c,P('證據越多 → 推論越可靠','More evidence → a more reliable inference'),BAR.x,BAR.y-14,22,INFER);
  text(c,P('繼續找證據 →','Keep looking →'),BAR.x+BAR.w,BAR.y-14,22,CHECK,'right');
  let lv=LEVELS[0]*smooth((lt-.8)/.8);
  for(let i=0;i<3;i++)lv=Math.max(lv,mix(LEVELS[i],LEVELS[i+1],smooth((lt-1.3-i*1.3)/.8)));
  D.round(c,BAR.x,BAR.y,BAR.w,BAR.h,BAR.h/2,'rgba(11,26,21,.8)',null);
  const fw=BAR.w*lv;
  if(fw>2){c.save();c.beginPath();c.roundRect(BAR.x,BAR.y,fw,BAR.h,BAR.h/2);c.clip();
    const g=c.createLinearGradient(BAR.x,0,BAR.x+BAR.w,0);g.addColorStop(0,rgba(INFER,.55));g.addColorStop(1,INFER);c.fillStyle=g;c.fillRect(BAR.x,BAR.y,fw,BAR.h);
    const sx=BAR.x+mod(t*.35)*(fw+120)-60,sg=c.createLinearGradient(sx-50,0,sx+50,0);
    sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.5)');sg.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=sg;c.fillRect(sx-50,BAR.y,100,BAR.h);c.restore();}
  c.save();c.setLineDash([6,5]);D.round(c,BAR.x,BAR.y,BAR.w,BAR.h,BAR.h/2,null,rgba(CHECK,.8));c.restore();
  // what each piece of the bar stands for
  const segs=[[0,LEVELS[0]],[LEVELS[0],LEVELS[1]],[LEVELS[1],LEVELS[2]],[LEVELS[2],LEVELS[3]]];
  segs.forEach(([s0,s1],i)=>{const mx=BAR.x+BAR.w*(s0+s1)/2,ty=BAR.y+BAR.h+34;
    if(i)line(c,[[BAR.x+BAR.w*s0,BAR.y-4],[BAR.x+BAR.w*s0,BAR.y+BAR.h+4]],rgba(C.deep,.9),2);
    if(i===0){text(c,P('珊瑚化石','Coral fossils'),mx,ty+8,22,OBS,'center');return;}
    const u=fade(lt,1+(i-1)*1.3,.5);if(u<=0)return;c.save();c.globalAlpha*=u;
    if(i===1)layersIcon(c,mx,ty,CHECK);else if(i===2)currentIcon(c,mx,ty,t,CHECK);else clockIcon(c,mx,ty,t,CHECK);c.restore();});
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  if(s._cliffK!==k){s._cliffPrev=s._cliffK==null?k:s._cliffK;s._cliffK=k;s._cliffT=t;}
  const lt=Math.max(0,Math.min(tau,t-s._cliffT)),pk=s._cliffPrev,tu=smooth(lt/1.1);
  const cr=lerpR(CL[pk],CL[k],tu),rr=lerpR(RF[pk],RF[k],tu);
  flowBar(c,k,t);
  // pictures
  drawIn(c,CLIFF,cr,{radius:16});frame(c,cr,rgba(OBS,.8),2.5);
  if(rr.a>.01&&rr.x<960){drawIn(c,REEF,rr,{radius:16,alpha:rr.a});c.save();c.globalAlpha*=rr.a;frame(c,rr,rgba(KNOWN,.85),2.5);c.restore();}
  if(k===0)step0(c,cr,lt,t);
  else if(k===1)step1(c,cr,rr,lt,t);
  else if(k===2)step2(c,cr,rr,lt,t);
  else step3(c,cr,lt,t);
}
window.FossilDraw.cliff=draw;
})();
