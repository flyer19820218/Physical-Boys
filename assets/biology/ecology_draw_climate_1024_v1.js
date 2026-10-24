/* Ecology lesson 4 · "climate" canvas (land-habitats tab, view 0), 2026-10-24. Rainfall x temperature decide the land habitat.
 * Left about 2/3: a schematic map, temperature left (cold) to right (hot), rainfall bottom (less) to top (more); no number ticks.
 * Four zones are painted as a soft field (each zone is a few blurred centres mixed by distance), so the boundaries blend:
 * forest, grassland, desert (bottom band at every temperature), tundra (cold side). "Schematic: boundaries blend" under the map.
 * Right about 1/3: the landscape of the glowing "This place" dot. The scene weights come from the same field at the dot,
 * so the landscape cross-fades while the dot moves. Pictures (K.SIZE, all 1672x933, cover-cropped into a 308x360 panel,
 * crop width 798 px): HB1_forest (crop x 437), EC2_meadow_scene (x 255: sparrows, puddle, butterfly), HB2_desert (x 200: half the cactus, sky top right, camel left out),
 * HB3_tundra (x 480). HB3 pointer targets measured on the crop with PIL, as fractions of the panel:
 * herbs = flowering herbs (.37,.55), low shrub = dark green bush (.49,.79), lichen = pale coral clump bottom-left (.07,.90);
 * the labels sit in the sky (herbs) and under the panel (lichen, shrub) with hand-drawn pointers, so nothing covers the plants.
 * Four steps, 8 s each; s.shown = step. The dot is eased toward each step's path, so it never jumps.
 *  0 warm and wet: dot top right, forest; top pills "Warmer" + "More rain".
 *  1 only less rain: a blue arrow straight down (temperature unchanged); forest -> grassland -> desert;
 *    "A desert is defined by dryness, not heat"; "Less rain" pill lights on the desert landscape.
 *  2 only colder: dot back up to moderate rain, then a cyan arrow to the left -> tundra; "Cold and a short growing season, yet still life";
 *    pointers name lichen, herbs, low shrubs on the tundra landscape.
 *  3 supplement (the tundra name on the map fades so the cold-desert name has room): two dots, bottom left (cold desert) and bottom right (hot desert); the dry band glows; the landscape panel becomes
 *    two drawn cards (thermometer cold / hot, rain gauge low on both, "Dry"); "A desert means dry, not necessarily hot".
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const SAME_T=P('溫度不變','Temperature unchanged'),SAME_R=P('雨量不變','Rainfall unchanged');
const DESERT_DRY=P('沙漠＝乾，不一定熱','Desert means dry, not necessarily hot');
const N=4,PER=8,CW=960;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand,BLUE='#38bdf8';
const FILL='rgba(11,26,21,.92)',PANEL='#16332b',CARD_BG='#1c3d34';

// ── helpers (same look as the settle / oxygen views) ───────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dashLine(c,a,b,col,t,w=2.5){c.save();c.lineCap='round';c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
// hand-drawn pointer: a slightly bent chalk line ending in a small open circle on the target
function pointer(c,a,b,col,t){const mx=(a[0]+b[0])/2+(b[1]-a[1])*.18,my=(a[1]+b[1])/2-(b[0]-a[0])*.18;
  c.save();c.lineCap='round';c.beginPath();c.moveTo(...a);c.quadraticCurveTo(mx,my,b[0],b[1]);
  c.strokeStyle='rgba(11,26,21,.75)';c.lineWidth=6;c.stroke();c.strokeStyle=col;c.lineWidth=3;c.setLineDash([9,5]);c.lineDashOffset=-t*10;c.stroke();c.restore();
  circle(c,b[0],b[1],7,null,'rgba(11,26,21,.75)',5);circle(c,b[0],b[1],7,null,col,2.5);}

// ── layout ────────────────────────────────────────────────────────────────
const M={x:124,y:56,w:480,h:380};                     // map
const SC={x:636,y:56,w:308,h:360};                    // landscape panel
const mp=(T,R)=>[M.x+T*M.w,M.y+(1-R)*M.h];
// zones: colour + blurred centres (T 0 cold..1 hot, R 0 dry..1 wet)
const ZONES=[
  {key:'forest',zh:'森林',en:'Forest',col:[46,125,79],pic:'HB1_forest.jpg',sx:437,c:[[.78,.86],[.5,.9],[.3,.88]],lab:[.38,.86]},
  {key:'grassland',zh:'草原',en:'Grassland',col:[155,176,74],pic:'EC2_meadow_scene.jpg',sx:255,c:[[.78,.45],[.48,.46]],lab:[.42,.36]},
  {key:'desert',zh:'沙漠',en:'Desert',col:[200,161,96],pic:'HB2_desert.jpg',sx:200,c:[[.85,.06],[.52,.05],[.18,.05]],lab:[.47,.1]},
  {key:'tundra',zh:'凍原',en:'Tundra',col:[143,179,184],pic:'HB3_tundra.jpg',sx:480,c:[[.07,.52],[.08,.72]],lab:[.13,.3]}];
function weights(T,R,sig){const w=ZONES.map(z=>z.c.reduce((m,[a,b])=>Math.max(m,Math.exp(-((T-a)**2+(R-b)**2)/(2*sig*sig))),0));
  const s=w.reduce((a,b)=>a+b,0)||1;return w.map(v=>v/s);}
let FIELD=null;
function field(){if(FIELD)return FIELD;const W=96,H=76,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),im=g.createImageData(W,H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const w=weights((x+.5)/W,1-(y+.5)/H,.15),j=(y*W+x)*4;
    for(let ch=0;ch<3;ch++)im.data[j+ch]=Math.round(ZONES.reduce((a,z,i)=>a+z.col[ch]*w[i],0));im.data[j+3]=255;}
  g.putImageData(im,0,0);FIELD=cv;return cv;}
const CROPW=933*SC.w/SC.h;                            // source pixels across the panel (cover)
const TUNDRA_PTS={herb:[.37,.55],shrub:[.49,.79],lichen:[.07,.90]};
const spt=([fx,fy],t)=>[SC.x+fx*SC.w-pan(t)*SC.w/CROPW,SC.y+fy*SC.h];

// dot path per step: list of [time, T, R]; held at the last point
const PATH=[
  [[0,.8,.82]],
  [[0,.8,.82],[1.2,.8,.82],[2.8,.8,.45],[3.8,.8,.45],[5.4,.8,.1]],
  [[0,.8,.1],[.6,.8,.1],[2.0,.8,.5],[2.6,.8,.5],[4.6,.1,.5]],
  [[0,.1,.5],[.4,.1,.5],[1.6,.15,.1]]];
function pathAt(k,tau){const p=PATH[k];if(tau<=p[0][0])return[p[0][1],p[0][2]];
  for(let i=1;i<p.length;i++)if(tau<p[i][0]){const a=p[i-1],b=p[i],u=smooth((tau-a[0])/(b[0]-a[0]));return[mix(a[1],b[1],u),mix(a[2],b[2],u)];}
  const l=p[p.length-1];return[l[1],l[2]];}
const HOT=[.85,.1];

// ── drawings ──────────────────────────────────────────────────────────────
function dot(c,x,y,t,col=YELLOW){glow(c,x,y,40,col,.45+.12*Math.sin(t*3));const u=mod(t*.8);circle(c,x,y,13+u*18,null,rgba(col,.85*(1-u)),3);
  circle(c,x,y,11,col,WHITE,3);circle(c,x-3,y-3,3.5,'rgba(255,255,255,.85)');}
function thermo(c,x,y,h,level,col){// tube from y-h/2 to y+h/2, bulb at bottom; level 0..1
  const tw=12,top=y-h/2,bot=y+h/2-10;D.round(c,x-tw/2,top,tw,h-6,tw/2,'rgba(242,236,217,.15)',WHITE);
  const fy=mix(bot,top+6,level);D.round(c,x-tw/2+3,fy,tw-6,bot-fy+4,3,col);circle(c,x,y+h/2-4,11,col,WHITE,2.5);}
function gauge(c,x,y,w,h,level,t){// rain gauge: open beaker with a low water level
  c.save();c.beginPath();c.moveTo(x-w/2,y-h/2);c.lineTo(x-w/2+3,y+h/2);c.lineTo(x+w/2-3,y+h/2);c.lineTo(x+w/2,y-h/2);
  c.fillStyle='rgba(242,236,217,.12)';c.fill();c.restore();
  const wy=y+h/2-level*h;c.save();c.beginPath();c.rect(x-w/2+4,wy+1.5*Math.sin(t*2),w-8,y+h/2-wy-2);c.fillStyle=rgba(BLUE,.85);c.fill();c.restore();
  K.sline(c,[[x-w/2,y-h/2],[x-w/2+3,y+h/2],[x+w/2-3,y+h/2],[x+w/2,y-h/2]],WHITE,2.5);
  for(let i=1;i<4;i++)K.line(c,[[x+w/2-10,y-h/2+i*h/4],[x+w/2-3,y-h/2+i*h/4]],rgba(WHITE,.7),2);}
// slow pan of the crop (about ±4 panel px) keeps the held landscape alive; pointer targets follow it
const pan=t=>10*Math.sin(t*.5);
function scene(c,z,a,t){if(a<=.003)return;const fx=(z.sx+pan(t))/1672,fw=CROPW/1672;
  K.drawIn(c,z.pic,{x:SC.x,y:SC.y,w:SC.w,h:SC.h},{alpha:a,radius:14,crop:[fx,0,fw,1]});}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.clSt||(s.clSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,T=tau;
  const OUT=.45,D0=st.from>=0?OUT:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau-D0,s0,d,s1);if(st.from<0||tau>=OUT)return now;return Math.max(now,vis(st.from,9,s0,0,s1)*(1-smooth(tau/OUT)));};

  // ── dot (eased toward the path) ──
  const [tT,tR]=pathAt(k,T);
  const dt=t-(st.lt??t);st.lt=t;
  if(st.pT===undefined||dt<0||dt>.6){st.pT=tT;st.pR=tR;}else{const e=1-Math.exp(-dt*6);st.pT+=(tT-st.pT)*e;st.pR+=(tR-st.pR)*e;}
  const [px,py]=mp(st.pT,st.pR);
  const sw=weights(st.pT,st.pR,.09);
  const a3=A(3,0,3),aScene=1-a3;

  // ── map ──
  D.round(c,M.x-6,M.y-6,M.w+12,M.h+12,18,PANEL,C.edge);
  c.save();c.beginPath();c.roundRect(M.x,M.y,M.w,M.h,14);c.clip();
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.globalAlpha=.78;c.drawImage(field(),M.x,M.y,M.w,M.h);c.globalAlpha=1;
  // faint chalk hatching so it reads as a schematic board drawing
  c.strokeStyle=rgba(WHITE,.05);c.lineWidth=2;for(let x=M.x-M.h;x<M.x+M.w;x+=22){c.beginPath();c.moveTo(x,M.y+M.h);c.lineTo(x+M.h,M.y);c.stroke();}
  // step 3: the dry band glows
  withA(c,a3,()=>{const g=c.createLinearGradient(0,M.y+M.h,0,M.y+M.h*.66);g.addColorStop(0,rgba(YELLOW,.28+.08*Math.sin(t*2.2)));g.addColorStop(1,rgba(YELLOW,0));c.fillStyle=g;c.fillRect(M.x,M.y+M.h*.66,M.w,M.h*.34);});
  c.restore();
  // axes (no number ticks)
  K.arrow(c,M.x-16,M.y+M.h+4,M.x-16,M.y-2,BLUE,4);
  {const y=M.y+M.h+16,g=c.createLinearGradient(M.x,0,M.x+M.w,0);g.addColorStop(0,CYAN);g.addColorStop(1,ORANGE);
    K.sline(c,[[M.x,y],[M.x+M.w-14,y]],g,4);K.arrow(c,M.x+M.w-30,y,M.x+M.w+4,y,ORANGE,4);}
  K.wrap(c,L('manyRain','雨量多','More rain'),12,M.y+20,92,22,BLUE);
  K.wrap(c,L('rainfall','雨量','Rainfall'),12,M.y+M.h/2+8,92,22,WHITE);
  {const p=L('fewRain','雨量少','Less rain'),rows=K.splitLines(c,K.D.tr(p),92,22).length;K.wrap(c,p,12,M.y+M.h-8-(rows-1)*30,92,22,BLUE,30);}
  text(c,L('cold','冷','Cold'),M.x,M.y+M.h+48,22,CYAN,'left');
  text(c,L('temperature','溫度','Temperature'),M.x+M.w/2,M.y+M.h+48,22,WHITE,'center');
  text(c,L('hot','熱','Hot'),M.x+M.w,M.y+M.h+48,22,ORANGE,'right');

  // zone names
  ZONES.forEach(z=>withA(c,z.key==='tundra'?clamp(1-a3*2.5):1,()=>{const [x,y]=mp(...z.lab);tag(c,L(z.key,z.zh,z.en),x,y-20,{al:'center',col:WHITE,minX:M.x+4,maxX:M.x+M.w-4});}));

  // ── step arrows ──
  withA(c,A(1,.9,1),()=>{const [x0,y0]=mp(.8,.8),[,y1]=mp(.8,.12);dashLine(c,[x0+30,y0],[x0+30,y1-8],rgba(BLUE,.95),t,3.5);K.arrow(c,x0+30,y1-24,x0+30,y1+6,BLUE,4);});
  withA(c,A(2,2.4,2),()=>{const [x0,y0]=mp(.78,.5),[x1]=mp(.12,.5);dashLine(c,[x0,y0+30],[x1+8,y0+30],rgba(CYAN,.95),t,3.5);K.arrow(c,x1+24,y0+30,x1-6,y0+30,CYAN,4);});

  // ── dots ──
  const aMain=k===3?1:A(0,0,2);
  if(k===3||aMain>0)dot(c,px,py,t,YELLOW);
  withA(c,A(3,1.6,3),()=>{const [x,y]=mp(...HOT);dot(c,x,y,t+.5,YELLOW);});
  // dot labels
  withA(c,A(0,0,2),()=>{const p=L('thisPlace','這個地方','This place');tag(c,p,px,py-66,{al:'center',col:YELLOW,active:true,minX:M.x+2,maxX:M.x+M.w-2});});
  withA(c,A(3,1.8,3),()=>{const [x0,y0]=mp(.15,.1),[x1,y1]=mp(...HOT);
    tag(c,L('coldDesert','寒冷的沙漠','Cold desert'),x0,y0-66,{al:'center',col:CYAN,active:true,minX:M.x+2,maxX:M.x+M.w/2});
    tag(c,L('hotDesert','熱沙漠','Hot desert'),x1,y1-66,{al:'center',col:ORANGE,active:true,minX:M.x+M.w/2,maxX:M.x+M.w-2});});

  // ── top row pills ──
  withA(c,A(0,.3,0),()=>{const a=tag(c,L('warm','較暖','Warmer'),M.x,10,{col:ORANGE,active:true});tag(c,L('manyRain','雨量多','More rain'),a.x+a.w+14,10,{col:BLUE,active:true});});
  withA(c,A(1,.3,1),()=>{const a=tag(c,SAME_T,M.x,10,{col:ORANGE});const b=tag(c,L('fewRain','雨量少','Less rain'),a.x+a.w+14,10,{col:BLUE,active:true});if(T>1.2)pulseRing(c,b,t,BLUE);});
  withA(c,A(2,.3,2),()=>{const a=tag(c,SAME_R,M.x,10,{col:BLUE});const b=tag(c,L('cool','較冷','Cooler'),a.x+a.w+14,10,{col:CYAN,active:true});if(T>2.6)pulseRing(c,b,t,CYAN);});
  withA(c,A(3,.3,3),()=>{const b=tag(c,L('dry','乾','Dry'),M.x,10,{col:BLUE,active:true});pulseRing(c,b,t,BLUE);
    tag(c,L('supplement','補充','Supplement'),SC.x,10,{col:YELLOW,active:true});});

  // ── landscape panel ──
  withA(c,aScene,()=>{
    D.round(c,SC.x,SC.y,SC.w,SC.h,14,PANEL);
    ZONES.forEach((z,i)=>scene(c,z,sw[i],t));
    D.round(c,SC.x,SC.y,SC.w,SC.h,14,null,C.edge);
    // name of the dominant landscape
    const ord=sw.map((w,i)=>[w,i]).sort((a,b)=>b[0]-a[0]),na=clamp((ord[0][0]-ord[1][0])*2.5)*clamp(1-a3/.05),z=ZONES[ord[0][1]];
    withA(c,na,()=>tag(c,L(z.key,z.zh,z.en),SC.x+10,SC.y+10,{col:WHITE,active:true,minX:SC.x+6,maxX:SC.x+SC.w-6}));
    // desert: "Less rain"
    const ad=clamp((sw[2]-.5)*3)*(k===1?1:k===2?clamp(1-T/0.8):0);
    withA(c,ad,()=>{const p=tag(c,L('fewRain','雨量少','Less rain'),SC.x+SC.w-10,SC.y+10,{al:'right',col:BLUE,active:true,minX:SC.x+6,maxX:SC.x+SC.w-6});pulseRing(c,p,t,BLUE);});
    // tundra: three names with hand-drawn pointers (labels in the sky and under the panel, the plants stay visible)
    const at=clamp((sw[3]-.55)*3)*(k===2?1:0);
    withA(c,at,()=>{
      const ph=tag(c,L('herb','草本','Herbs'),SC.x+SC.w-10,SC.y+10,{al:'right',col:GREEN,minX:SC.x+6,maxX:SC.x+SC.w-6});
      pointer(c,[ph.x+ph.w*.4,ph.y+ph.h+2],spt(TUNDRA_PTS.herb,t),GREEN,t);
      const pl=tag(c,L('lichen','地衣','Lichen'),SC.x,SC.y+SC.h+12,{col:WHITE,minX:SC.x,maxX:SC.x+SC.w});
      pointer(c,[pl.x+pl.w*.3,pl.y-2],spt(TUNDRA_PTS.lichen,t),WHITE,t);
      const ps=tag(c,L('dwarfShrub','矮灌木','Low shrubs'),SC.x+SC.w,SC.y+SC.h+12,{al:'right',col:GREEN,minX:SC.x,maxX:SC.x+SC.w});
      pointer(c,[ps.x+ps.w*.35,ps.y-2],spt(TUNDRA_PTS.shrub,t),GREEN,t);
    });
  });

  // ── step 3: two drawn cards replace the landscape ──
  withA(c,a3,()=>{
    const cards=[{y:SC.y,lab:L('coldDesert','寒冷的沙漠','Cold desert'),col:CYAN,tl:L('cold','冷','Cold'),lvl:.18,d:1.0},
                 {y:SC.y+188,lab:L('hotDesert','熱沙漠','Hot desert'),col:ORANGE,tl:L('hot','熱','Hot'),lvl:.85,d:1.8}];
    cards.forEach((cd,i)=>withA(c,k===3?ease(clamp((T-cd.d)/.6)):1,()=>{
      const x=SC.x,y=cd.y,w=SC.w,h=172;D.round(c,x,y,w,h,14,CARD_BG,rgba(cd.col,.85));
      tag(c,cd.lab,x+12,y+12,{col:cd.col,active:true,minX:x+6,maxX:x+w-6});
      thermo(c,x+34,y+90,52,cd.lvl+.03*Math.sin(t*1.6+i),cd.col);text(c,cd.tl,x+64,y+98,22,cd.col,'left');
      gauge(c,x+34,y+142,30,34,.18,t+i);text(c,L('fewRain','雨量少','Less rain'),x+64,y+150,22,BLUE,'left');
      const p=tag(c,L('dry','乾','Dry'),x+w-14,y+106,{al:'right',col:BLUE,active:true,minX:x+6,maxX:x+w-6});
      if(k!==3||T>cd.d+.6)pulseRing(c,p,t+i*.6,BLUE);}));
  });

  // ── message bar ──
  const MSG_Y=M.y+M.h+62;
  withA(c,A(1,4.6,1),()=>{const p=tag(c,L('desertKey','沙漠的關鍵是乾，不是熱','A desert is defined by dryness, not heat'),12,MSG_Y,{col:YELLOW,active:true,size:24,maxX:M.x+M.w+6});if(T>5.2||k!==1)pulseRing(c,p,t,YELLOW);});
  withA(c,A(2,4.4,2),()=>{const p=tag(c,L('tundraAlive','低溫、生長季短，仍有生命','Cold and a short growing season, yet still life'),12,MSG_Y,{col:GREEN,active:true,size:24,maxX:M.x+M.w+6});if(T>5||k!==2)pulseRing(c,p,t,GREEN);});
  withA(c,A(3,2.6,3),()=>{const p=tag(c,DESERT_DRY,12,MSG_Y,{col:YELLOW,active:true,size:24,maxX:M.x+M.w+6});if(T>3.2||k!==3)pulseRing(c,p,t,YELLOW);});

  // ── notes ──
  K.wrap(c,L('fuzzy','示意，邊界是漸變，不是固定的線','Schematic: boundaries blend, they are not fixed lines'),12,574,600,22,MUTED,28);
  if(aScene>=.5)withA(c,(aScene-.5)*2,()=>text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-14,590,22,MUTED,'right'));
  else withA(c,(a3-.5)*2,()=>text(c,L('schematic','示意','Schematic'),CW-14,590,22,MUTED,'right'));
}
window.EcologyDraw.climate=draw;
})();
