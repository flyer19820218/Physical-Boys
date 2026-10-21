/* Fossils · "How a fossil forms" canvas (evidence tab, view 0), 2026-10-21.
 * One continuous sea-floor cross-section that changes through five steps:
 * sinks -> buried -> turns to rock (minerals; a mould beside it) -> uplift and erosion -> found and dug out.
 * Colours: yellow = what this step is about; sand = mud and sand; cyan = minerals; orange = weight of the
 * layers above; green = uplift of the crust. Pictures: trilobite_walking.png, fossil_trilobite_slab.png
 * (AI illustrations made by the teacher with Gemini, not photographs). Registers window.FossilDraw.formation.
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,TAU,text,pill,cpill,panel,arrow,dashed,circle,ellipse,sline,glow,pulse,marker,stageClock,fade,smooth,ease,mix,clamp,mod,fitRect,drawIn,measure,D,rgba,rng,lerpP,pic,AI}=K;
const N=5,PER=6;
const SHORT=[P(`死亡沉底`,`Sinks`),P(`泥沙掩埋`,`Buried`),P(`變成岩石`,`Turns to rock`),P(`岩層露出`,`Exposed`),P(`被發現`,`Found`)];

// ── layout ─────────────────────────────────────────────────────────────────
const SX=16,SY=108,SW=928,SH=484;            // the scene window
const RX=[110,295,480,665,850],RY=65;        // progress rail
const SEA=150;                               // sea surface (world y)
const LIFT=-45;                              // how far the crust rises (screen px)
// remains on the sea floor (world coordinates): main trilobite, one that becomes a mould, one that is eaten
const M={x:430,y:452,len:150},R={x:770,y:458,len:120},E={x:150,y:458,len:110};
// sediment layers, bottom to top. k: the step in which a layer is laid down; a: start (s); d: duration (s)
const BANDS=[
 {t:540,b:740,k:-1},{t:470,b:540,k:-1},
 {t:405,b:470,k:1,a:.3,d:3.2},
 {t:360,b:405,k:2,a:0,d:.8},{t:315,b:360,k:2,a:.8,d:.8},{t:270,b:315,k:2,a:1.6,d:.8},{t:225,b:270,k:2,a:2.4,d:.8}];
const SOFT=['#bfae80','#cbb98c','#d2c195','#c3b184','#cdbb8e','#bba97c','#c8b688'];
const HARD=['#877e6c','#a0957f','#a89c86','#948a76','#9d927d','#8d8471','#9a8f7a'];
// land surface after erosion (screen coordinates, crust already lifted)
const PROFILE=[[0,236],[170,272],[250,356],[330,392],[355,398],[505,400],[540,404],[560,414],[630,414],[650,400],[780,326],[960,286]];
const PANEL={x:656,y:118,w:276,h:320};

// ── small helpers ──────────────────────────────────────────────────────────
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
const mixHex=(a,b,u)=>{const p=hex(a),q=hex(b);return `rgb(${p.map((v,i)=>Math.round(mix(v,q[i],u))).join(',')})`;};
const wave=(x,j)=>2.5*Math.sin(x*.017+j*1.9);
const interp=(pts,x)=>{for(let i=1;i<pts.length;i++)if(x<=pts[i][0]){const [x0,y0]=pts[i-1],[x1,y1]=pts[i];return mix(y0,y1,(x-x0)/(x1-x0));}return pts[pts.length-1][1];};
function alpha(c,a,fn){if(a<=0.01)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();}
const grains=BANDS.map((_,j)=>{const R0=rng(31+j*7),o=[];for(let i=0;i<70;i++)o.push([SX+R0()*SW,.12+R0()*.76,1.2+R0()*1.6,R0()<.5]);return o;});
const MUD=(()=>{const R0=rng(5),o=[];for(let i=0;i<46;i++)o.push([40+R0()*880,.07+R0()*.06,R0(),2.2+R0()*1.8]);return o;})();
const MIN=(()=>{const R0=rng(11),o=[];for(let i=0;i<26;i++){const a=R0()*TAU;o.push([Math.cos(a)*(120+R0()*60),Math.abs(Math.sin(a))*(55+R0()*40)*(R0()<.75?1:-.5),R0(),(R0()-.5)*60,(R0()-.5)*14]);}return o;})();
const RAIN=(()=>{const R0=rng(17),o=[];for(let i=0;i<60;i++)o.push([SX+R0()*(SW+60)-40,R0(),.75+R0()*.4]);return o;})();

// ── the trilobite picture, tinted and drawn lying flat ─────────────────────
// trilobite_walking.png: body centre (234,250) px; the tail points 48° below the +x axis; shell ≈ 400 × 224 px.
const TRI='trilobite_walking.png',SLAB='fossil_trilobite_slab.png',TINT={};
[TRI,SLAB].forEach(f=>pic(AI+f));   // start loading both pictures before they are first needed
function tinted(kind){
  if(TINT[kind])return TINT[kind];
  const im=pic(AI+TRI);if(!im)return null;
  const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
  const g=cv.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';
  g.fillStyle={dead:'rgba(112,110,100,.58)',stone:'rgba(206,190,158,.62)',hole:'rgba(46,38,28,.78)',rim:'#e6dabd'}[kind];
  g.fillRect(0,0,cv.width,cv.height);
  TINT[kind]=cv;return cv;}
// Draw one trilobite: (x, y) centre, len body length, ang rotation, sq vertical squash (lying flat ≈ .45).
function trilobite(c,kind,x,y,len,{ang=0,sq=.45,a=1,shell=false,shadow=false}={}){
  const im=tinted(kind);if(!im||a<=0.01)return;
  const k=len/400;
  c.save();c.globalAlpha*=a;if(shadow){c.shadowColor='rgba(40,28,14,.85)';c.shadowBlur=8;}c.translate(x,y);c.rotate(ang);c.scale(1,sq);
  if(shell){c.beginPath();c.ellipse(0,0,200*k,108*k,0,0,TAU);c.clip();}
  c.rotate(-48*Math.PI/180);c.scale(k,k);c.drawImage(im,-234,-250);c.restore();}
// A mould: the empty imprint left in the rock, the same outline as the shell.
function mould(c,x,y,len,a){alpha(c,a,()=>{trilobite(c,'rim',x-1.5,y-1.5,len,{shell:true});trilobite(c,'hole',x+1,y+1,len,{shell:true});});}

// ── simple drawings ────────────────────────────────────────────────────────
function fish(c,x,y,dir,t,a=1){
  alpha(c,a,()=>{c.save();c.translate(x,y);c.scale(dir,1);
    const w=Math.sin(t*7)*4;
    c.beginPath();c.moveTo(-20,0);c.lineTo(-36,-10+w);c.lineTo(-36,10+w);c.closePath();c.fillStyle='#7fa596';c.fill();
    ellipse(c,0,0,24,10,'#a7c7b8','#5d8274',2);
    c.beginPath();c.moveTo(-4,-9);c.lineTo(6,-16);c.lineTo(10,-8);c.closePath();c.fillStyle='#7fa596';c.fill();
    circle(c,13,-2,3.2,'#f2ecd9');circle(c,14,-2,1.6,'#0b1a15');
    c.restore();});}
function person(c,x,y,t,a){
  // a crouching person; feet at (x, y); the brush sweeps over the fossil
  alpha(c,a,()=>{
    const sw=Math.sin(t*2.6)*7,skin='#e9c49a',pants='#5f7f9a',shirt='#f2ecd9';
    sline(c,[[x-4,y-20],[x+18,y-24],[x+16,y]],pants,8);
    sline(c,[[x-6,y-20],[x+6,y-14],[x+2,y]],pants,8);
    sline(c,[[x-6,y-22],[x+8,y-52]],shirt,13);
    sline(c,[[x+8,y-48],[x+30,y-32],[x+52+sw,y-16]],skin,6);
    sline(c,[[x+52+sw,y-16],[x+66+sw,y-6]],'#a0703c',4);
    for(let i=-2;i<=2;i++)sline(c,[[x+66+sw,y-6],[x+72+sw+i,y+4]],'#e2c37f',2);
    circle(c,x+12,y-66,11,skin);
    ellipse(c,x+12,y-74,17,5,'#c9a46a');ellipse(c,x+12,y-79,10,7,'#c9a46a');
  });}
function rockPath(c,surf){c.beginPath();c.moveTo(SX,surf(SX));for(let x=SX+8;x<=SX+SW;x+=8)c.lineTo(x,surf(x));c.lineTo(SX+SW,SY+SH+4);c.lineTo(SX,SY+SH+4);c.closePath();}

// ── the scene ──────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);s.shown=k;
  // transition: fade in when the scene jumps (a click, or the loop restarting)
  if(s.fmK===undefined){s.fmK=k;s.fmStart=s.start;s.fmT=-9;}
  if(s.start!==s.fmStart||(k!==s.fmK&&k!==s.fmK+1))s.fmT=t;
  s.fmK=k;s.fmStart=s.start;
  const cover=1-clamp((t-s.fmT)/.7);

  const L=k<3?0:k===3?LIFT*smooth(tau/2.2):LIFT;
  const er=k<3?0:k===3?smooth((tau-2)/3.2):1;                    // erosion progress
  const hard=k<2?0:k===2?smooth((tau-1.2)/3.5):1;                // sediment hardening into rock
  const grow=b=>b.k<0||k>b.k?1:k<b.k?0:smooth((tau-b.a)/b.d);
  const tops=BANDS.map(b=>b.b-(b.b-b.t)*grow(b));
  let topJ=0;BANDS.forEach((b,j)=>{if(grow(b)>0.001)topJ=j;});
  const floor=x=>tops[topJ]+wave(x,topJ)+L;
  const surf=k<3?floor:x=>mix(floor(x),interp(PROFILE,x),er);
  const water=k<3?1:k===3?1-smooth(tau/1.8):0;

  c.save();c.beginPath();c.roundRect(SX,SY,SW,SH,16);c.clip();
  // sky and sea
  const sky=c.createLinearGradient(0,SY,0,SY+SH);sky.addColorStop(0,'#1d4150');sky.addColorStop(1,'#163540');
  c.fillStyle=sky;c.fillRect(SX,SY,SW,SH);
  alpha(c,water,()=>{const g=c.createLinearGradient(0,SEA,0,470);g.addColorStop(0,rgba(C.sea,.75));g.addColorStop(1,rgba(C.seaDeep,.9));
    c.fillStyle=g;c.fillRect(SX,SEA+L,SW,SH);
    const pts=[];for(let x=SX;x<=SX+SW;x+=10)pts.push([x,SEA+L+3*Math.sin(x*.03+t*1.2)]);sline(c,pts,rgba(C.white,.55),2.5);});

  // rock and sediment (drawn from the top layer down, each to the bottom)
  c.save();rockPath(c,surf);c.clip();
  for(let j=BANDS.length-1;j>=0;j--){
    const b=BANDS[j];if(grow(b)<=0.001)continue;
    const y0=tops[j]+L;c.beginPath();c.moveTo(SX,y0+wave(SX,j));
    for(let x=SX+8;x<=SX+SW;x+=8)c.lineTo(x,y0+wave(x,j));
    c.lineTo(SX+SW,SY+SH+4);c.lineTo(SX,SY+SH+4);c.closePath();
    c.fillStyle=mixHex(SOFT[j],HARD[j],hard);c.fill();
    const h=b.b-tops[j];
    grains[j].forEach(([x,f,r,light])=>circle(c,x,y0+f*h,r,light?'rgba(255,248,226,.35)':'rgba(70,55,35,.3)',null));
    const pts=[];for(let x=SX;x<=SX+SW;x+=8)pts.push([x,y0+wave(x,j)]);sline(c,pts,`rgba(60,48,32,${.25+.3*hard})`,2);}
  c.restore();
  // the new land surface edge
  if(k>=3){const pts=[];for(let x=SX;x<=SX+SW;x+=8)pts.push([x,surf(x)]);sline(c,pts,rgba('#e8dcc0',.6*er+.2),2.5);}

  // ── the remains ──
  // the eaten one (step 1 only)
  const eaten=k===0?1-.75*smooth((tau-.6)/4.2):0;
  if(k===0)trilobite(c,'dead',E.x,E.y,E.len*(.75+.25*eaten),{a:eaten,ang:.08});
  // the one that becomes a mould
  const gone=k<2?0:k===2?smooth((tau-3)/2):1;
  const rDim=k>=3?.55:1;
  alpha(c,rDim,()=>{mould(c,R.x,R.y+L,R.len,gone);
    const soft=k<1?1:k===1?1-smooth((tau-3)/2):0;
    trilobite(c,'dead',R.x,R.y+L,R.len,{a:(1-gone)*soft,ang:-.06});
    trilobite(c,'dead',R.x,R.y+L,R.len,{a:(1-gone),ang:-.06,shell:true});});
  // the main trilobite
  let mx=M.x,my=M.y+L,mang=0,msq=.45;
  if(k===0){const u=smooth(tau/3.4);mx=mix(470,M.x,u);my=mix(220,M.y,u);mang=(-.35+.08*Math.sin(tau*2.5))*(1-u);msq=mix(.9,.45,u);}
  const soft=k<1?1:k===1?1-smooth((tau-3)/2):0;                   // legs and antennae rot away
  const stone=k<2?0:k===2?smooth((tau-2)/3):1;                    // minerals turn the shell to stone
  const lifted=k===4?smooth((tau-2.4)/1.8):0;                     // dug out and carried to the close-up
  if(k===4&&lifted>0)mould(c,M.x,M.y+L,M.len,smooth(lifted*3));
  if(lifted<.01){
    trilobite(c,'dead',mx,my,M.len,{ang:mang,sq:msq,a:soft});
    trilobite(c,'dead',mx,my,M.len,{ang:mang,sq:msq,a:1-stone,shell:true});
    trilobite(c,'stone',mx,my,M.len,{ang:mang,sq:msq,a:stone,shell:true,shadow:true});
    if(stone>0)for(let i=0;i<14;i++){const a=i*2.4,r=.25+.65*mod(i*.37);circle(c,mx+Math.cos(a)*r*70,my+Math.sin(a)*r*17,2,rgba(C.cyan,.75*stone*(.6+.4*Math.sin(t*2+i))),null);}
  }

  // ── step-specific motion ──
  // fish (scavengers): steps 1-2
  const fishA=k===0?1:k===1?1:k===2?1-smooth(tau/.8):0;
  if(fishA>0){
    const f1a=[E.x+54+10*Math.sin(t*2.4),440+4*Math.sin(t*1.7)],f1b=[300+150*Math.sin(t*.4+1),250+8*Math.sin(t*.9)];
    const u=k===0?0:smooth(tau/1.5),f1=lerpP(f1a,f1b,u),d1=k===0?-1:mix(-1,Math.max(-1,Math.min(1,Math.cos(t*.4+1)*3)),u);
    fish(c,f1[0],f1[1],d1,t,fishA);
    const d2=Math.max(-1,Math.min(1,Math.cos(t*.35)*3));
    fish(c,700+150*Math.sin(t*.35),320+20*Math.sin(t*.6),d2,t+1,fishA);
    s.fm1=f1;}
  // mud and sand settling (step 2)
  const mudA=k===1?fade(tau,0,.5):k===2?1-fade(tau,0,.6):0;
  if(mudA>0)alpha(c,mudA,()=>MUD.forEach(([x,sp,ph,r])=>{const fy=floor(x),y=SEA+mod(t*sp+ph)*(fy-SEA);circle(c,x+4*Math.sin(t+ph*9),y,r,rgba(C.sand,.9),null);}));
  // weight of the layers above (step 3)
  if(k===2){const a=fade(tau,.8,.8);alpha(c,a,()=>[260,600].forEach(x=>{const y0=floor(x)+14,y1=405;if(y1-y0<30)return;
      dashed(c,[[x,y0],[x,y1]],rgba(C.orange,.55),3,[6,8],-t*20);
      for(let j=0;j<3;j++){const yy=y0+mod(t*.35+j/3)*(y1-y0-16);arrow(c,x,yy,x,yy+20,rgba(C.orange,.95),3.5);}}));}
  // minerals seeping into the shell (step 3)
  if(k===2&&tau>1.4){const a=fade(tau,1.4,.8);alpha(c,a,()=>MIN.forEach(([dx,dy,ph,ex,ey])=>{const p=mod(t*.22+ph),q=smooth(p);
      const x=mix(M.x+dx,M.x+ex,q),y=mix(M.y+dy,M.y+ey,q);if(y<floor(x)+6)return;
      const aa=Math.sin(Math.PI*p);glow(c,x,y,9,C.cyan,.5*aa);circle(c,x,y,2.6,rgba(C.cyan,aa),null);}));}
  // uplift arrows (step 4)
  if(k===3){const a=1-fade(tau,3.2,.8);alpha(c,a,()=>[150,810].forEach(x=>{const o=mod(t*.6)*10;arrow(c,x,SY+SH-6-o,x,SY+SH-58-o,C.green,5);}));}
  // rain, wind and a river (steps 4-5)
  if(k===3){const a=fade(tau,1.6,.8);alpha(c,a,()=>{
    RAIN.forEach(([x0,ph,sp])=>{const p=mod(t*sp+ph),x=x0+p*40,y=SY+p*(surf(x)-SY);if(y>surf(x)-16)return;sline(c,[[x,y],[x+5,y+16]],'rgba(200,236,255,.6)',2);});
    for(let i=0;i<3;i++){const x=SX+mod(t*.12+i/3)*(SW+200)-100,y=172+i*26;sline(c,[[x,y],[x+40,y-4],[x+80,y],[x+120,y-5]],rgba(C.white,.42),2.5);}});}
  const riverA=k<3?0:smooth((er-.8)/.2);
  if(riverA>0)alpha(c,riverA,()=>{c.beginPath();c.moveTo(545,404);for(let x=545;x<=645;x+=5)c.lineTo(x,Math.max(404,surf(x)));c.closePath();
    c.fillStyle=rgba(C.sea,.95);c.fill();
    for(let i=0;i<4;i++){const x=550+mod(t*.25+i/4)*80;sline(c,[[x,407],[x+12,407]],rgba(C.white,.7),2);}});

  // step 5: the person, and the fossil carried to the close-up
  if(k===4){
    person(c,300,interp(PROFILE,300)+1,t,fade(tau,0,.8));
    if(lifted<.01){glow(c,M.x,M.y+L,70,C.yellow,.18+.08*Math.sin(t*2));}
    const pr=fitRect('fossil_trilobite_slab.png',PANEL.x+30,PANEL.y+48,PANEL.w-60,PANEL.h-96);
    const pa=fade(tau,2.2,.6);
    alpha(c,pa,()=>{panel(c,PANEL.x,PANEL.y,PANEL.w,PANEL.h,'#0f221c');
      dashed(c,[[M.x+80,M.y+L-6],[PANEL.x,PANEL.y+PANEL.h-60]],rgba(C.yellow,.7),2.5,[7,6],-t*12);
      D.round(c,PANEL.x,PANEL.y,PANEL.w,PANEL.h,16,null,rgba(C.yellow,.85));
      text(c,P(`三葉蟲化石`,`Trilobite fossil`),PANEL.x+PANEL.w/2,PANEL.y+34,24,C.yellow,'center');
      text(c,P(`放大圖`,`Close-up`),PANEL.x+PANEL.w/2,PANEL.y+PANEL.h-18,22,C.muted,'center');});
    if(lifted>0&&lifted<1){const u=ease(lifted),p=lerpP([M.x,M.y+L],[pr.x+pr.w/2,pr.y+pr.h/2],u);
      trilobite(c,'stone',p[0],p[1],mix(M.len,pr.h*.62,u),{ang:mix(0,-Math.PI/2,u),sq:mix(.45,1,u),shell:true,a:1-smooth((lifted-.7)/.3)});}
    drawIn(c,'fossil_trilobite_slab.png',pr,{alpha:smooth((lifted-.6)/.4)});
    if(lifted>=1)alpha(c,.6,()=>pulse(c,pr.x+pr.w/2,pr.y+pr.h/2,t,C.yellow,pr.w*.45));
  }

  // ── labels ──
  if(k===0){
    pulse(c,mx,my,t,C.yellow,30);
    const lp=cpill(c,P(`三葉蟲遺體`,`Dead trilobites`),mx,my-78,{active:true});
    dashed(c,[[mx,lp.y+lp.h],[mx,my-20]],rgba(C.yellow,.8));
    alpha(c,fade(tau,3.4,.6),()=>dashed(c,[[lp.x+lp.w,lp.y+lp.h/2],[R.x-10,R.y-22]],rgba(C.yellow,.7)));
    const f1=s.fm1||[E.x+54,440];
    const fp=cpill(c,P(`啃食的動物`,`Scavengers`),205,364,{color:C.white});
    dashed(c,[[f1[0],fp.y+fp.h],[f1[0],f1[1]-14]],rgba(C.white,.6));
    alpha(c,fade(tau,1,.6),()=>{const ep=cpill(c,P(`大部分遺體會被吃掉或腐爛`,`Most remains are eaten or rot away`),230,514,{color:C.orange});
      dashed(c,[[E.x,ep.y],[E.x,E.y+16]],rgba(C.orange,.7));});
    pill(c,P(`海底`,`Sea floor`),860,494,{color:C.muted,maxX:936});
  }
  if(k<=2)alpha(c,k<2?1:1-fade(tau,2.6,.6),()=>text(c,P(`海水`,`Seawater`),928,192,22,C.white,'right'));
  if(k===1){
    alpha(c,fade(tau,.4,.6),()=>cpill(c,P(`泥沙`,`Mud and sand`),700,226,{color:C.sand}));
    alpha(c,fade(tau,1.6,.6),()=>{const y=floor(M.x)-8;
      sline(c,[[M.x-110,y+18],[M.x-90,y],[M.x+90,y],[M.x+110,y+18]],C.yellow,3);
      cpill(c,P(`隔絕氧氣和啃食的動物`,`Shuts out oxygen and scavengers`),M.x,y-58,{active:true});});
    alpha(c,fade(tau,3.2,.6),()=>{cpill(c,P(`硬的外殼最容易保存`,`Hard shells last best`),M.x,500,{color:C.white});});
  }
  if(k===2){
    alpha(c,fade(tau,.8,.6),()=>cpill(c,P(`上面越堆越重`,`More weight piles on top`),260,160,{color:C.orange}));
    alpha(c,fade(tau,2.2,.6),()=>cpill(c,P(`泥沙變硬，成為岩層`,`Sediment hardens into rock`),790,286,{color:C.white}));
    alpha(c,fade(tau,1.8,.6),()=>{pulse(c,M.x,M.y,t,C.yellow,40);cpill(c,P(`礦物填進外殼`,`Minerals fill the shell`),210,420,{active:true,color:C.cyan});});
    alpha(c,fade(tau,3.6,.6),()=>{const mp=cpill(c,P(`印模：遺體消失，只留下形狀`,`Mould: the body is gone, its shape stays`),R.x,500,{color:C.pink});
      dashed(c,[[R.x,mp.y],[R.x,R.y+18]],rgba(C.pink,.75));});
  }
  if(k===3){
    alpha(c,fade(tau,.2,.5)*(1-fade(tau,2.4,.4)),()=>cpill(c,P(`海水退去`,`The sea drains away`),790,124,{color:C.white}));
    alpha(c,1-fade(tau,3.2,.8),()=>cpill(c,P(`地殼抬升`,`The crust rises`),480,SY+SH-52,{active:true,color:C.green}));
    alpha(c,fade(tau,2.6,.6),()=>cpill(c,P(`風雨、河流把上面的岩層帶走`,`Wind, rain and rivers wear the top layers away`),480,120,{color:C.white}));
    alpha(c,riverA,()=>cpill(c,P(`河流`,`River`),595,346,{color:C.cyan}));
    alpha(c,fade(tau,4.6,.6),()=>{pulse(c,M.x,M.y+L,t,C.yellow,40);cpill(c,P(`化石露出來了`,`The fossil is exposed`),M.x-40,290,{active:true});});
  }
  if(k===4){
    alpha(c,fade(tau,.6,.6),()=>cpill(c,P(`發現化石，小心挖出來`,`Found and dug out with care`),300,200,{active:true}));
    alpha(c,fade(tau,1.2,.6),()=>pill(c,P(`化石在沉積岩裡`,`Fossils lie in sedimentary rock`),34,486,{color:C.white}));
  }
  if(cover>0){c.fillStyle=rgba('#11261f',cover);c.fillRect(SX,SY,SW,SH);}
  c.restore();
  D.round(c,SX,SY,SW,SH,16,null,C.edge);

  // ── progress rail and the "very long time" bracket ──
  const longOn=k===2||k===3;
  text(c,P(`示意圖，不按比例`,`Not to scale`),944,25,22,C.muted,'right');
  text(c,P(`很久很久`,`A very, very long time`),(RX[2]+RX[3])/2,25,22,longOn?C.yellow:C.muted,'center');
  dashed(c,[[RX[2],46],[RX[2],36],[RX[3],36],[RX[3],46]],longOn?C.yellow:rgba(C.muted,.7),2.5,[7,6],longOn?-t*14:0);
  K.line(c,[[RX[0],RY],[RX[4],RY]],rgba(C.muted,.45),3);
  RX.forEach((x,i)=>{
    if(i===k)marker(c,x,RY,i+1,t,13);
    else{circle(c,x,RY,12,i<k?rgba(C.yellow,.35):'#16332b',rgba(C.muted,.8),2);
      c.save();c.font=K.MONO(20);c.fillStyle=C.white;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,RY+1);c.restore();}
    text(c,SHORT[i],x,100,22,i===k?C.yellow:C.muted,'center');
    D.hit(x-85,RY-24,170,64,'phase',i);});
}
window.FossilDraw.formation=draw;
})();
