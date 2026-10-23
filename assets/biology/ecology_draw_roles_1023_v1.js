/* Ecology lesson 2 · "roles" canvas (roles tab, view 0), 2026-10-23. Producers, consumers, decomposers, and the loop.
 * Background: the shell's blackboard #11261f. Four steps, 9 s each; s.shown = step. Steps cross-fade (MOVE s).
 *  0 producers: sun (drawn) top-left, dashed light rays run over the tops of three cards (rice, miscanthus, foxtail);
 *    green "producer" pill under a bracket + "makes its own food"; below, the chain light energy -> photosynthesis ->
 *    chemical energy in food (yellow); yellow sparkles in the plants = chemical energy stored in food.
 *  1 consumers: rice -> grasshopper -> frog -> snake -> eagle cards in a row, arrows from the eaten to the eater
 *    (yellow dots flow = energy); level pills staggered on two rows so the long English names fit; the sparrow
 *    above rice/grasshopper with arrows from both (they take turns glowing), "omnivore" pill; pink bracket
 *    "consumer" + "eats ready-made food".
 *  2 decomposers: EC18 rotting log (1400x493, cut out) as the scene. Cyan = decomposers: "mushrooms (fungi)" pill with
 *    dashed leaders to three mushroom groups, a zoom circle of drawn bacteria (rods and cocci, "schematic") pulled
 *    from a spot on the log; a brace joins both to the cyan "decomposer" pill + "breaks down remains and waste".
 *    Orange = the earthworm: the worm in EC18 is ringed and zoomed into the earthworm card, orange "detritus
 *    feeder" pill and "not a decomposer".
 *  3 together: producer (top) -> consumer (right) -> [remains and waste] -> decomposer (bottom) -> soil (left) ->
 *    producer, cyan ellipse arcs with cyan dots flowing (matter), yellow arrow "sunlight in" from the drawn sun.
 * Picture points on EC18 were measured on the 1400x493 image (PIL, composited on #11261f) and are mapped with LOG.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,CYAN=C.cyan,ORANGE=C.orange,PINK=C.pink,MUTED=C.muted,SOIL='#c49a6c';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const fin=(tau,d,len=.7)=>ease((tau-d)/len);

// ── helpers ────────────────────────────────────────────────────────────────
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h,cx:bx+w/2,cy:y+h/2};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
// a picture card: picture on top, the (wrapped, centred) name at the bottom
function card(c,r,pic,name,{col=WHITE,glowA=0,glowCol=YELLOW,t=0}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.7,glowCol,.2+.06*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const rows=K.splitLines(c,D.tr(name),r.w-14,22),lh=26,nh=rows.length*lh+6;
  if(typeof pic==='function')pic({x:r.x+6,y:r.y+6,w:r.w-12,h:r.h-12-nh});else if(pic)K.place(c,pic,r.x+6,r.y+6,r.w-12,r.h-12-nh);
  rows.forEach((s,i)=>text(c,s,r.x+r.w/2,r.y+r.h-nh+20+i*lh,22,col,'center'));
  return r;
}
// arrow drawn up to fraction g
function growArrow(c,x1,y1,x2,y2,g,col,w=3.5){if(g<=.02)return;K.arrow(c,x1,y1,mix(x1,x2,g),mix(y1,y2,g),col,w);}
function dots(c,x1,y1,x2,y2,t,col,{n=1,speed=.45,r=4.5,a=1}={}){
  for(let q=0;q<n;q++){const u=mod(t*speed+q/n),x=mix(x1,x2,u*.86),y=mix(y1,y2,u*.86);
    withA(c,a*Math.sin(u*Math.PI),()=>{glow(c,x,y,12,col,.7);circle(c,x,y,r,col===YELLOW?'#fff7c2':'#d9fbff',null);});}
}
function sun(c,x,y,r,t,a=1){
  withA(c,a,()=>{
    glow(c,x,y,r*2.4,YELLOW,.35+.08*Math.sin(t*2));
    c.save();c.translate(x,y);c.rotate(t*.25);c.strokeStyle=YELLOW;c.lineCap='round';c.lineWidth=4;
    for(let i=0;i<12;i++){const a2=i*Math.PI/6,l=r*(1.3+.12*Math.sin(t*3+i));c.beginPath();c.moveTo(Math.cos(a2)*r*1.12,Math.sin(a2)*r*1.12);c.lineTo(Math.cos(a2)*l*1.12,Math.sin(a2)*l*1.12);c.stroke();}
    c.restore();
    circle(c,x,y,r,YELLOW,'#fff3a0',3);
  });
}
// a horizontal bracket under [x0,x1] at y, with a tick down at the middle
function bracket(c,x0,x1,y,col,g=1){const m=(x0+x1)/2;K.sline(c,[[mix(m,x0,g),y],[mix(m,x1,g),y]],col,3);if(g>=1){K.sline(c,[[x0,y-8],[x0,y]],col,3);K.sline(c,[[x1,y-8],[x1,y]],col,3);K.sline(c,[[m,y],[m,y+8]],col,3);}}
// drawn bacteria (rods and cocci) wobbling inside a clipped circle
const BAC=(()=>{const r=K.rng(23),a=[];for(let i=0;i<34;i++)a.push({x:r()*2-1,y:r()*2-1,rod:i%3!==2,ang:r()*Math.PI,ph:r()*6.28,s:.75+r()*.5});return a.filter(b=>b.x*b.x+b.y*b.y<.78);})();
function bacteria(c,cx,cy,R,t,{ring=CYAN}={}){
  c.save();c.beginPath();c.arc(cx,cy,R,0,K.TAU);c.fillStyle='#0e2a22';c.fill();c.clip();
  const k=R/76;
  BAC.forEach(b=>{const x=cx+b.x*R+4*k*Math.sin(t*1.3+b.ph),y=cy+b.y*R+4*k*Math.cos(t*1.1+b.ph);
    if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.25*Math.sin(t*.8+b.ph));const L2=15*k*b.s,W2=5.5*k;
      c.beginPath();c.roundRect(-L2,-W2,L2*2,W2*2,W2);c.fillStyle='#7fe9d0';c.fill();c.strokeStyle='#d9fff4';c.lineWidth=1.5;c.stroke();c.restore();}
    else{circle(c,x,y,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);circle(c,x+12*k*b.s,y+2*k,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);}
  });
  c.restore();circle(c,cx,cy,R,null,ring,3);
}
// soil mound (drawn)
function soilMound(c,r,t){
  const bx=r.x,by=r.y+r.h,w=r.w;
  c.save();c.beginPath();c.moveTo(bx,by);c.bezierCurveTo(bx+w*.15,by-r.h*.9,bx+w*.85,by-r.h*.9,bx+w,by);c.closePath();
  c.fillStyle='#5b3f27';c.fill();c.strokeStyle='#8a6440';c.lineWidth=2;c.stroke();c.clip();
  const g=K.rng(7);for(let i=0;i<26;i++){circle(c,bx+g()*w,by-g()*r.h*.7,2+g()*3,i%4?'#7a5636':'#9b7248',null);}
  // a sprouting seedling, gently swaying
  c.restore();
  const sx=bx+w*.5,sy=by-r.h*.62,sw=4*Math.sin(t*1.4);
  K.sline(c,[[sx,sy],[sx+sw*.4,sy-r.h*.25]],GREEN,3);
  K.ellipse(c,sx+sw*.4-9,sy-r.h*.25,9,4.5,GREEN,null,0,-.5);K.ellipse(c,sx+sw*.4+9,sy-r.h*.25,9,4.5,GREEN,null,0,.5);
}

// ── step 0 · producers ───────────────────────────────────────────────────
const S0={sun:[90,70],cards:[{cx:350,pic:'EC3_rice.png',k:'rice',n:['水稻','Rice']},{cx:570,pic:'EC3_miscanthus.png',k:'miscanthus',n:['芒草','Miscanthus']},{cx:790,pic:'EC3_foxtail.png',k:'foxtail',n:['狗尾草','Foxtail grass']}],
  cw:190,cy:96,ch:248};
const SPARK=(()=>{const r=K.rng(5),a=[];for(let i=0;i<9;i++)a.push({x:.18+r()*.64,y:.1+r()*.6,ph:r()*6.28});return a;})();
function step0(c,tau,t){
  const [sx,sy]=S0.sun;
  sun(c,sx,sy,34,t,fin(tau,0));
  withA(c,fin(tau,.2),()=>tag(c,L('sun','陽光','Sunlight'),sx,136,{al:'center',col:YELLOW}));
  S0.cards.forEach((q,i)=>{
    const a=fin(tau,.3+i*.35),r={x:q.cx-S0.cw/2,y:S0.cy,w:S0.cw,h:S0.ch};
    // light rays: dashed, moving from the sun to the top of each card
    withA(c,fin(tau,.9+i*.2),()=>{const tx=q.cx-20,ty=S0.cy-6;c.save();c.setLineDash([12,9]);c.lineDashOffset=-t*30;
      K.line(c,[[sx+38,sy+4],[tx,ty]],rgba(YELLOW,.85),3);c.restore();glow(c,tx,ty,16,YELLOW,.5+.3*Math.sin(t*3+i));});
    withA(c,a,()=>card(c,r,q.pic,L(q.k,...q.n),{col:GREEN,glowA:fin(tau,2.2)*(.6+.4*Math.sin(t*1.6+i)),glowCol:GREEN,t}));
    // yellow sparkles = chemical energy made in the leaves
    withA(c,a*fin(tau,2.6),()=>SPARK.forEach((s,j)=>{const tw=.5+.5*Math.sin(t*2.2+s.ph+i);const x=r.x+6+s.x*(r.w-12),y=r.y+6+s.y*(r.h-50);
      glow(c,x,y,9,YELLOW,.55*tw);circle(c,x,y,2.6,'#fff7c2',null);}));
  });
  // bracket + producer pill + makes-food
  const x0=S0.cards[0].cx-S0.cw/2,x1=S0.cards[2].cx+S0.cw/2,by=S0.cy+S0.ch+12;
  withA(c,fin(tau,1.6),()=>{bracket(c,x0,x1,by,GREEN,fin(tau,1.6,.6));
    const p1=L('producer','生產者','Producer'),p2=L('makesFood','自己製造養分','Makes its own food'),w1=tagW(c,p1,24),w2=tagW(c,p2),gap=14,X=(x0+x1)/2-(w1+gap+w2)/2;
    const a1=tag(c,p1,X,by+14,{col:GREEN,active:true,size:24});pulseRing(c,a1,t,GREEN);
    withA(c,fin(tau,2.2),()=>tag(c,p2,X+w1+gap,by+16,{col:GREEN}));});
  // chain: light energy -> photosynthesis -> chemical energy in food
  const ry=470,lp=L('light','光能','Light energy'),ph=L('photosynthesis','光合作用','Photosynthesis'),ce=L('chemE','食物中的化學能','Chemical energy in food');
  const wl=tagW(c,lp),al=Math.max(200,measure(c,ph,22)+48),lx=30,ax0=lx+wl+10,ax1=ax0+al,cx0=ax1+10;
  withA(c,fin(tau,2.4),()=>{
    c.save();c.setLineDash([8,8]);c.lineDashOffset=-t*24;K.line(c,[[sx,136+40],[lx+wl/2,ry-4]],rgba(YELLOW,.7),2.5);c.restore();
    tag(c,lp,lx,ry,{col:YELLOW});
    growArrow(c,ax0,ry+20,ax1,ry+20,fin(tau,2.7,.8),YELLOW,4);
    text(c,ph,(ax0+ax1)/2,ry+4,22,GREEN,'center');
    if(tau>3.4)dots(c,ax0,ry+20,ax1,ry+20,t,YELLOW,{n:2,speed:.5});
  });
  withA(c,fin(tau,3.3),()=>{const p=tag(c,ce,cx0,ry,{col:YELLOW,active:true});glow(c,p.cx,p.cy,p.w*.6,YELLOW,.12+.06*Math.sin(t*2.2));pulseRing(c,p,t);});
}

// ── step 1 · consumers ───────────────────────────────────────────────────
const S1={y:206,h:196,w:150,xs:[95,285,475,665,855],
  ids:[['EC3_rice.png','rice','水稻','Rice'],['EC4_grasshopper.png','grasshopper','蚱蜢','Grasshopper'],['EC5_frog.png','frog','澤蛙','Paddy field frog'],['EC6_snake.png','snake','黑眉錦蛇','Black-browed ratsnake'],['EC6_eagle.png','eagle','大冠鷲','Crested serpent eagle']],
  lv:[['producer','生產者','Producer'],['primary','初級消費者','Primary consumer'],['secondary','次級消費者','Secondary consumer'],['tertiary','三級消費者','Tertiary consumer'],['quaternary','四級消費者','Quaternary consumer']],
  sp:{x:115,y:12,w:150,h:140}};
function step1(c,tau,t){
  const {y,h,w,xs}=S1;
  // arrows between cards (under the cards), energy dots
  for(let i=0;i<4;i++){const d=.5+i*.45,x1=xs[i]+w/2+3,x2=xs[i+1]-w/2-3,yy=y+h/2;
    withA(c,fin(tau,d,.3),()=>{growArrow(c,x1,yy,x2,yy,fin(tau,d,.5),WHITE,4);if(tau>d+.6)dots(c,x1,yy,x2,yy,t+i*.4,YELLOW,{speed:.7,r:3.5});});}
  xs.forEach((x,i)=>{const id=S1.ids[i],r={x:x-w/2,y,w,h};withA(c,fin(tau,i*.45),()=>card(c,r,id[0],L(id[1],id[2],id[3]),{col:i===0?GREEN:WHITE,glowA:clamp(1-(tau-i*.45-1.2)/1.2),t}));});
  // level pills, staggered on two rows
  xs.forEach((x,i)=>{const lv=S1.lv[i],row=i%2,py=y+h+12+row*48,col=i===0?GREEN:PINK;
    withA(c,fin(tau,.3+i*.45),()=>{if(row)K.sline(c,[[x,y+h+2],[x,py]],rgba(col,.7),2);tag(c,L(...lv),x,py,{al:'center',col});});});
  // consumer bracket over grasshopper..eagle
  const bx0=xs[1]-w/2,bx1=xs[4]+w/2,by=y+h+12+48+52;
  withA(c,fin(tau,2.6),()=>{bracket(c,bx0,bx1,by,PINK,fin(tau,2.6,.6));
    const p1=L('consumer','消費者','Consumer'),p2=L('eatsFood','吃現成的養分','Eats ready-made food'),w1=tagW(c,p1,24),w2=tagW(c,p2),gap=14,X=(bx0+bx1)/2-(w1+gap+w2)/2;
    const a1=tag(c,p1,X,by+14,{col:PINK,active:true,size:24});pulseRing(c,a1,t,PINK);
    withA(c,fin(tau,3),()=>tag(c,p2,X+w1+gap,by+16,{col:PINK}));});
  // sparrow: arrows from rice (seeds) and grasshopper (insects); they take turns glowing
  const sp=S1.sp,sw=.5+.5*Math.sin(t*Math.PI/2.5),on=[smooth(clamp(sw*2-.5)),smooth(clamp((1-sw)*2-.5))];
  const ends=[[xs[0]+10,y-4,sp.x+40,sp.y+sp.h+6],[xs[1]-20,y-4,sp.x+sp.w-30,sp.y+sp.h+6]];
  ends.forEach((e,i)=>withA(c,fin(tau,3.6+i*.3,.3),()=>{const g=fin(tau,3.6+i*.3,.6);
    if(on[i]>0&&tau>4.4)withA(c,on[i]*.4,()=>K.sline(c,[[e[0],e[1]],[mix(e[0],e[2],.93),mix(e[1],e[3],.93)]],YELLOW,10));
    growArrow(c,e[0],e[1],e[2],e[3],g,WHITE,3.5+1.5*on[i]);if(tau>4.4)dots(c,e[0],e[1],e[2],e[3],t+i,YELLOW,{speed:.6,r:3.5,a:.4+.6*on[i]});}));
  withA(c,fin(tau,3.2),()=>card(c,sp,'EC5_sparrow.png',L('sparrow','麻雀','Sparrow'),{glowA:clamp(1-(tau-4.5)/1.5),t}));
  withA(c,fin(tau,3.8),()=>{const p=tag(c,L('omnivore','雜食','Omnivore'),sp.x+sp.w+14,sp.y+48,{col:YELLOW,active:true});pulseRing(c,p,t);});
}

// EC18 has a light grey fringe (the faded shadow, lum 60-100, low saturation) along its bottom cut-out edge; on the
// blackboard it reads as a grey rim. Once the picture has loaded, darken those pixels: only rows >= 360 (of 493), only
// the 16 px just above a transparent pixel below them, only low-saturation light pixels (soil and leaves are untouched).
let LOGC=null;
function logCanvas(){
  if(LOGC)return LOGC;const im=K.pic(K.src('EC18_log_decay.png'));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,y0=Math.round(H*360/493);
    for(let x=0;x<W;x++){let n=99;for(let y=H-1;y>=y0;y--){const i=(y*W+x)*4;if(a[i+3]<20){n=0;continue;}n++;if(n>16)continue;
      const r=a[i],gg=a[i+1],b=a[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),l=(r+gg+b)/3;
      if(mx-mn<=28&&l>34){const w=1-n/18,k=1-w+w*34/l;a[i]=r*k;a[i+1]=gg*k;a[i+2]=b*k;}}}
    g.putImageData(d,0,0);LOGC=cv;}catch(e){LOGC=im;}
  return LOGC;
}
function drawLog(c,r){const cv=logCanvas();if(cv)c.drawImage(cv,r.x,r.y,r.w,r.h);else K.drawIn(c,'EC18_log_decay.png',r);}
// ── step 2 · decomposers ─────────────────────────────────────────────────
// EC18 placed at LOG; img(x,y) -> canvas
const LOG={x:70,y:58,w:820},LK=LOG.w/1400,LH=493*LK,lp=(ix,iy)=>[LOG.x+ix*LK,LOG.y+iy*LK];
// mushroom groups (below the caps, on the stems) and spots, measured on the 1400x493 picture
const FUNGI=[lp(430,232),lp(215,318),lp(905,222)],BACSPOT=lp(160,215),WORM=lp(965,432);
const S2={fun:{x:196,y:372},bac:{x:196,y:424},zoom:[100,486,76],brace:446,dec:{x:466,y:398},worm:{x:690,y:420,w:254,h:146}};
function step2(c,tau,t){
  withA(c,fin(tau,0),()=>{drawLog(c,{x:LOG.x,y:LOG.y,w:LOG.w,h:LH});tag(c,L('log','腐木','Rotting log'),LOG.x,12,{col:WHITE});});
  // fungi: leaders to three mushroom groups
  const fp=L('fungi','蕈類（真菌）','Mushrooms (fungi)'),fw=tagW(c,fp),fcx=S2.fun.x+fw/2;
  withA(c,fin(tau,.8),()=>{FUNGI.forEach(([x,y],i)=>{c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*14;K.line(c,[[fcx,S2.fun.y],[x,y]],rgba(CYAN,.9),2.5);c.restore();
      K.pulse(c,x,y,t+i*.4,CYAN,8);circle(c,x,y,6,CYAN,C.deep,2);});
    tag(c,fp,S2.fun.x,S2.fun.y,{col:CYAN});});
  // bacteria: small ring on the log, dashed lines to the zoom circle
  const [zx,zy,zr]=S2.zoom,[bx,by]=BACSPOT;
  withA(c,fin(tau,1.4),()=>{c.save();c.setLineDash([6,6]);K.line(c,[[bx-10,by+8],[zx-zr*.7,zy-zr*.7]],rgba(CYAN,.7),2);K.line(c,[[bx+10,by+8],[zx+zr*.7,zy-zr*.7]],rgba(CYAN,.7),2);c.restore();
    circle(c,bx,by,13,null,CYAN,3);bacteria(c,zx,zy,zr,t);
    tag(c,L('bacteria','細菌','Bacteria'),S2.bac.x,S2.bac.y,{col:CYAN});
    text(c,L('schematic','示意','Schematic'),zx,592,22,MUTED,'center');});
  // brace -> decomposer pill + breaks down
  withA(c,fin(tau,2.1),()=>{const x=S2.brace,y0=S2.fun.y+4,y1=S2.bac.y+36,m=(y0+y1)/2;
    K.sline(c,[[x-8,y0],[x,y0+6],[x,m-6],[x+8,m],[x,m+6],[x,y1-6],[x-8,y1]],CYAN,3);
    const p=tag(c,L('decomposer','分解者','Decomposer'),S2.dec.x,S2.dec.y,{col:CYAN,active:true,size:24});pulseRing(c,p,t,CYAN);
    withA(c,fin(tau,2.5),()=>K.wrap(c,L('breaksDown','分解遺體與排遺','Breaks down remains and waste'),S2.dec.x,S2.dec.y+76,210,22,CYAN,28));});
  // earthworm: ring the worm in EC18, zoom into the card, orange pill
  const wr=S2.worm,[wx,wy]=WORM;
  withA(c,fin(tau,3.2),()=>{c.save();c.setLineDash([6,6]);K.line(c,[[wx+34,wy+22],[wr.x+30,wr.y-2]],rgba(ORANGE,.8),2);c.restore();
    K.ellipse(c,wx,wy,56,26,null,ORANGE,3,.32);
    card(c,wr,'animals_ai_1023/earthworm.png',L('earthworm','蚯蚓','Earthworm'),{glowA:.5+.3*Math.sin(t*2),glowCol:ORANGE,t});
    const p=tag(c,L('scavenger','腐食動物','Detritus feeder'),944,372,{al:'right',col:ORANGE,active:true});pulseRing(c,p,t,ORANGE);
    withA(c,fin(tau,3.8),()=>text(c,P('不是分解者','Not a decomposer'),wr.x+wr.w/2,592,22,ORANGE,'center'));});
}

// ── step 3 · together ───────────────────────────────────────────────────
const E={cx:480,cy:312,rx:320,ry:200};
const ep=a=>[E.cx+E.rx*Math.cos(a),E.cy+E.ry*Math.sin(a)];
const S3={prod:{x:405,y:44,w:150,h:136},cons:{x:710,y:244,w:180,h:136},dec:{x:305,y:444,w:350,h:136},soil:{x:80,y:252,w:160,h:120}};
const inR=(p,r,g)=>p[0]>r.x-g&&p[0]<r.x+r.w+g&&p[1]>r.y-g&&p[1]<r.y+r.h+g;
// arc from node A (angle a0) to node B (angle a1), trimmed to leave both cards
function arcPts(a0,a1,rA,rB,g=10){let s=a0,e=a1;const st=(a1-a0)/400;while(inR(ep(s),rA,g)&&Math.abs(s-a0)<Math.abs(a1-a0))s+=st;while(inR(ep(e),rB,g+6)&&Math.abs(e-a1)<Math.abs(a1-a0))e-=st;
  const pts=[];for(let i=0;i<=40;i++)pts.push(ep(mix(s,e,i/40)));return pts;}
function arcDraw(c,pts,g,col,w=4){if(g<=.02)return;const n=Math.max(2,Math.round(40*g)),q=pts.slice(0,n+1),tip=q[q.length-1],pr=q[q.length-3]||q[0];
  K.sline(c,q.slice(0,-1),col,w);K.arrow(c,pr[0],pr[1],tip[0],tip[1],col,w);}
function arcDots(c,pts,t,col){const n=2;for(let k=0;k<n;k++){const u=mod(t*.28+k/n),f=u*(pts.length-1),i=Math.floor(f),p=K.lerpP(pts[i],pts[Math.min(pts.length-1,i+1)],f-i);
  withA(c,Math.sin(u*Math.PI),()=>{glow(c,p[0],p[1],13,CYAN,.75);circle(c,p[0],p[1],4.5,'#d9fbff',null);});}}
function step3(c,tau,t){
  const {prod,cons,dec,soil}=S3,H=Math.PI/2;
  const arcs=[[-H,0,prod,cons,1.0],[0,H,cons,dec,1.6],[H,Math.PI,dec,soil,2.2],[Math.PI,1.5*Math.PI,soil,prod,2.8]].map(([a0,a1,A,B,d])=>({pts:arcPts(a0,a1,A,B),d}));
  arcs.forEach(({pts,d},i)=>withA(c,fin(tau,d,.2),()=>{arcDraw(c,pts,fin(tau,d,.6),CYAN,4);if(tau>3.4)arcDots(c,pts,t+i*.9,CYAN);}));
  // nodes
  withA(c,fin(tau,0),()=>card(c,prod,'EC3_rice.png',L('rice','水稻','Rice'),{col:GREEN,t}));
  withA(c,fin(tau,.4),()=>tag(c,L('producer','生產者','Producer'),prod.x+prod.w/2,prod.y+prod.h+10,{al:'center',col:GREEN,active:true}));
  withA(c,fin(tau,.6),()=>{card(c,cons,'EC4_grasshopper.png',L('grasshopper','蚱蜢','Grasshopper'),{t});tag(c,L('consumer','消費者','Consumer'),cons.x-10,cons.y+48,{al:'right',col:PINK,active:true});});
  withA(c,fin(tau,1.2),()=>{
    const fn=L('fungi','蕈類（真菌）','Mushrooms (fungi)'),bn=L('bacteria','細菌','Bacteria'),w1=measure(c,fn,22)+16,w2=Math.max(measure(c,bn,22)+16,100);
    D.round(c,dec.x,dec.y,dec.w,dec.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
    const x1=dec.x+(dec.w-w1-w2-14)/2,x2=x1+w1+14,ph=dec.h-44;
    K.place(c,'fungi_ai_1022/shiitake.png',x1,dec.y+6,w1,ph);bacteria(c,x2+w2/2,dec.y+6+ph/2,Math.min(ph/2,w2/2)-2,t);
    text(c,fn,x1+w1/2,dec.y+dec.h-14,22,WHITE,'center');text(c,bn,x2+w2/2,dec.y+dec.h-14,22,WHITE,'center');
    tag(c,L('decomposer','分解者','Decomposer'),dec.x+dec.w/2,dec.y-48,{al:'center',col:CYAN,active:true});});
  withA(c,fin(tau,1.8),()=>card(c,soil,r=>soilMound(c,r,t),L('soil','土壤','Soil'),{col:SOIL,t}));
  // remains and waste, on the consumer -> decomposer arc
  withA(c,fin(tau,2.0),()=>tag(c,L('remains','遺體與排遺','Remains and waste'),748,470,{al:'left',col:WHITE}));
  // centre legend: cyan = matter (carbon), cycles
  withA(c,fin(tau,3),()=>{const y=300;circle(c,440-measure(c,L('matter','物質（碳）','Matter (carbon)'),22)/2-16,y-8,6,CYAN,null);
    text(c,L('matter','物質（碳）','Matter (carbon)'),440,y,22,CYAN,'center');text(c,L('cycle','循環','Cycles'),440,y+32,22,CYAN,'center');});
  // sunlight comes in from outside (yellow, one way)
  const S=[80,70];sun(c,S[0],S[1],32,t,fin(tau,2.6));
  withA(c,fin(tau,2.9),()=>{const x1=S[0]+44,y1=S[1]+6,x2=prod.x-8,y2=prod.y+60;growArrow(c,x1,y1,x2,y2,fin(tau,2.9,.6),YELLOW,5);
    if(tau>3.5)dots(c,x1,y1,x2,y2,t,YELLOW,{n:2,speed:.5});
    text(c,L('sunlightIn','陽光進來','Sunlight in'),(x1+x2)/2+10,y1-4,22,YELLOW,'center');});
}

// ── frame ──────────────────────────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3];
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.roles||(s.roles={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,u=st.from>=0?smooth(clamp(tau/MOVE)):1;
  if(u<1)withA(c,1-u,()=>STEPS[st.from](c,99,t));
  withA(c,st.from>=0?u:1,()=>STEPS[k](c,st.from>=0?Math.max(0,tau-MOVE*.5):tau,t));
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,34,22,MUTED,'right');
}
window.EcologyDraw.roles=draw;
})();
