/* Ecology lesson 2 · "pyramid" canvas (energy-flow tab, view 1), 2026-10-23.
 * The chain rice -> grasshopper -> frog -> snake as stacked trapezoids (rice at the bottom, always small at the top).
 * Layout (one scene for all three steps):
 *   left  stage panel (x 10..604): the paddy-chain pyramid, four rows bottom-up. Each row: a picture card on the left,
 *         the trapezoid in the middle (centre x 330, widths schematic), the name to the right of the slope.
 *         Cards and names stay put across steps; only the layer contents fade.
 *   right side panel (x 616..950): two mini pyramids side by side, "energy" (yellow) and "numbers" (white dots).
 *         Steps 0-1: this paddy chain (numbers is "?" in step 0). Step 2: the camphor tree with many insects:
 *         numbers inverted, energy upright, "energy never flips".
 * Pictures (K.SIZE): EC3_rice 590x1096, EC4_grasshopper 788x446, EC5_frog 657x581, EC6_snake 847x559,
 *   EC8_camphor_tree 1026x1400. PIL: all transparent backgrounds; the camphor crown is fy 0.05..0.55, fx ~0.1..0.9,
 *   trunk below (fx ~0.5). Insect dots, sparks, arrows: drawn here.
 * Three steps, 7 s each; s.shown = step.
 *  0 energy pyramid: yellow trapezoids grow bottom-up, a light sheen runs over them; "the top level is smallest".
 *  1 numbers (schematic): the layers become dashed outlines filled with repeated small pictures
 *    (25 rice, 8 grasshoppers, 3 frogs, 1 snake), which pop in and bob; no real numbers.
 *  2 why so few: translucent energy layers, a tapering up arrow, yellow dots rising; at each boundary most of them
 *    turn into orange heat sparks and drift out ("heat from respiration"), so only a few reach the top.
 *    The side panel switches to the tree case.
 * Step changes: sequential fade (old out in the first half second, new in the second), this module's own clock.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,glow,circle,stageClock}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=7,CW=960,MOVE=1;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,GREEN=C.green,GREY='#9fb3a8';
const PICS=['EC3_rice.png','EC4_grasshopper.png','EC5_frog.png','EC6_snake.png'],TREE='EC8_camphor_tree.png';
const KEYS=[['rice','水稻','Rice'],['grasshopper','蚱蜢','Grasshopper'],['frog','澤蛙','Paddy field frog'],['snake','黑眉錦蛇','Black-browed ratsnake']];
const nameOf=j=>L(...KEYS[j]);

// ── new labels (not in LAB yet) ────────────────────────────────────────────
const WHY=P(`為什麼這麼少`,`Why so few?`);
const PADDY=P(`稻田這條鏈`,`This paddy chain`);
const LESS=P(`能量一層比一層少`,`Less energy at each level up`);
const NOFLIP=P(`能量不會倒`,`Energy never flips`);
const NUMS=P(`個體數`,`Numbers`);
const INSECTS=P(`昆蟲`,`Insects`);

// ── geometry ───────────────────────────────────────────────────────────────
const SX=10,SY=64,SW=594,SH=526;                        // stage panel
const RX=616,RY=64,RW=334,RH=526;                       // side panel
const CX=330,LH=88,GAP=8,BOT=500,SLANT=14;              // pyramid: centre x, layer height, bottom y, slant per side
const WID=[300,196,116,56];                             // bottom width of each layer (schematic)
const y1Of=j=>BOT-j*(LH+GAP),y0Of=j=>y1Of(j)-LH,midOf=j=>y1Of(j)-LH/2;
const widthAt=(j,y)=>WID[j]-2*SLANT*(y1Of(j)-y)/LH;     // width of layer j at height y
const CARD={x:22,w:112,h:76};
const AX=157;                                           // step 2 up arrow x (between cards and pyramid)
// side panel mini pyramids: column A energy, column B numbers
const COLA=703,COLB=863,MW=[140,92,54,26],MH=40,MG=5,MBOT=315;

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const fade=(tau,t0,d=.6)=>clamp((tau-t0)/d);
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=SX+6,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
// trapezoid with bottom width wb, top width wt, bottom y yb, height h, centred at cx
function trap(c,cx,yb,wb,wt,h){c.beginPath();c.moveTo(cx-wb/2,yb);c.lineTo(cx+wb/2,yb);c.lineTo(cx+wt/2,yb-h);c.lineTo(cx-wt/2,yb-h);c.closePath();}
function spark(c,x,y,a,r=5){withA(c,a,()=>{glow(c,x,y,r*3,ORANGE,.5);circle(c,x,y,r,ORANGE,null);});}
function band(c,x1,y1,x2,y2,w,col){
  const a=Math.atan2(y2-y1,x2-x1),hl=Math.max(12,w*1.1),hw=Math.max(w*.95,8),ex=x2-hl*Math.cos(a),ey=y2-hl*Math.sin(a);
  K.sline(c,[[x1,y1],[ex,ey]],col,w);
  c.save();c.beginPath();c.moveTo(x2,y2);c.lineTo(ex+hw*Math.sin(a),ey-hw*Math.cos(a));c.lineTo(ex-hw*Math.sin(a),ey+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
// a hash in 0..1 for dot n at boundary j
const hash=(n,j)=>{const x=Math.sin(n*127.1+j*311.7)*43758.5453;return x-Math.floor(x);};

// ── persistent: cards and names ────────────────────────────────────────────
function rows(c,k,t){
  for(let j=0;j<4;j++){
    const my=midOf(j),cy=my-CARD.h/2;
    D.round(c,CARD.x,cy,CARD.w,CARD.h,12,'#1c3d34',rgba(WHITE,.35));
    K.place(c,PICS[j],CARD.x+6,cy+6,CARD.w-12,CARD.h-12);
    const nx=CX+(WID[j]-SLANT)/2+16;
    const lines=K.splitLines(c,K.D.tr(nameOf(j)),SX+SW-6-nx,22).length;
    K.wrap(c,nameOf(j),nx,my+8-(lines-1)*14,SX+SW-6-nx,22,WHITE,28);
  }
}

// ── step 0: energy pyramid ─────────────────────────────────────────────────
function stage0(c,tau,t){
  for(let j=0;j<4;j++){
    const a=fade(tau,.15+j*.35,.5),yb=y1Of(j),wb=WID[j],wt=wb-2*SLANT;
    withA(c,a,()=>{
      trap(c,CX,yb,wb,wt,LH);c.fillStyle=YELLOW;c.fill();c.strokeStyle='#fff3a6';c.lineWidth=2;c.stroke();
      // sheen moving upward through the stack so the held step still moves
      c.save();trap(c,CX,yb,wb,wt,LH);c.clip();
      const sy=mix(BOT+40,y0Of(3)-40,mod(t*.18)),sx=CX+Math.sin(t*.9+j)*wb*.25;
      glow(c,sx,sy,90,WHITE,.45);c.restore();
    });
  }
  withA(c,fade(tau,1.6),()=>{const p=tag(c,L('topSmallest','最上層最少','The top level is smallest'),CX,y0Of(3)-52,{al:'center',col:YELLOW,active:true,maxX:SX+SW-6});pulseRing(c,p,t);});
}

// ── step 1: numbers (schematic) with repeated small pictures ───────────────
// per layer: rows of [y offset from layer bottom, count]; icon width
const ICONS=[{w:18,rows:[[66,12],[24,13]],gap:21},{w:36,rows:[[64,4],[24,4]],gap:42},{w:32,rows:[[64,1],[24,2]],gap:40},{w:40,rows:[[36,1]],gap:0}];
function stage1(c,tau,t){
  for(let j=0;j<4;j++){
    const yb=y1Of(j),wb=WID[j],wt=wb-2*SLANT;
    withA(c,fade(tau,.1+j*.2,.5),()=>{
      trap(c,CX,yb,wb,wt,LH);c.fillStyle=rgba(WHITE,.07);c.fill();
      c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;c.strokeStyle=rgba(WHITE,.75);c.lineWidth=2.5;c.stroke();c.restore();
    });
    const ic=ICONS[j];let i=0;
    ic.rows.forEach(([dy,n])=>{
      for(let q=0;q<n;q++,i++){
        const x=CX+(q-(n-1)/2)*ic.gap,y=yb-dy+Math.sin(t*2.2+i*.9+j)*1.6,a=fade(tau,.4+j*.45+i*.035,.3);
        withA(c,a,()=>K.at(c,PICS[j],x,y,ic.w*(.6+.4*smooth(a))));
      }
    });
  }
  withA(c,fade(tau,2.4),()=>tag(c,L('schematic','示意','Schematic'),CX,y0Of(3)-52,{al:'center',col:WHITE}));
}

// ── step 2: why so few ─────────────────────────────────────────────────────
const DT=.11,SPEED=80;
function stage2(c,tau,t){
  for(let j=0;j<4;j++){
    const yb=y1Of(j),wb=WID[j],wt=wb-2*SLANT;
    withA(c,fade(tau,.1+j*.15,.5),()=>{trap(c,CX,yb,wb,wt,LH);c.fillStyle=rgba(YELLOW,.28);c.fill();c.strokeStyle=rgba(YELLOW,.9);c.lineWidth=2.5;c.stroke();});
  }
  // tapering up arrow
  const ga=fade(tau,.3,.8);
  withA(c,ga,()=>{const top=y0Of(3)+4,yh=top+22;
    c.beginPath();c.moveTo(AX-10,BOT-2);c.lineTo(AX+10,BOT-2);c.lineTo(AX+3,yh);c.lineTo(AX+11,yh);c.lineTo(AX,top);c.lineTo(AX-11,yh);c.lineTo(AX-3,yh);c.closePath();c.fillStyle=rgba(YELLOW,.9);c.fill();
    const u=mod(t*.35);glow(c,AX,mix(BOT-6,top+20,u),16,YELLOW,.8*Math.sin(u*Math.PI));});
  // rising dots: most turn into heat at each boundary
  const n1=Math.floor(t/DT),dotA=fade(tau,.8,.6);
  const KEEP=[.34,.3,.4];
  if(dotA>0)withA(c,dotA,()=>{for(let n=n1-70;n<=n1;n++){if(n<0)continue;
    const age=t-n*DT,r0=hash(n,9)-.5,y=BOT-4-age*SPEED;
    let j=0,dead=-1;
    for(;j<3;j++){if(y>y0Of(j))break;if(hash(n,j)>KEEP[j]){dead=j;break;}}
    if(dead<0&&j===3&&y<=y0Of(3)+4)dead=3;
    if(dead<0){
      const w=(j>0&&y>y1Of(j))?WID[j-1]-2*SLANT:widthAt(j,y),x=CX+r0*w*.8;
      glow(c,x,y,13,YELLOW,.6);circle(c,x,y,4.5,'#fff7c2',null);
    }else{
      // heat: from the boundary point, drift out and up, fade over 1.1 s
      const yb=y0Of(dead)+(dead===3?4:0),h=age-(BOT-4-yb)/SPEED;if(h<0||h>1.1)continue;
      const xb=CX+r0*(WID[dead]-2*SLANT)*.8,side=r0<0?-1:1,x=xb+side*h*44+Math.sin(h*9+n)*3,yy=yb-h*40;
      spark(c,x,yy,(1-h/1.1),4.5+2.5*(1-h));}
  }});
  withA(c,fade(tau,1.2),()=>{const p=tag(c,LESS,CX,y0Of(3)-52,{al:'center',col:YELLOW,active:true,maxX:SX+SW-6});pulseRing(c,p,t);});
  withA(c,fade(tau,1.8),()=>tag(c,L('heat','呼吸散熱','Heat from respiration'),SX+SW-8,BOT+14,{al:'right',col:ORANGE,maxX:SX+SW-6}));
}

// ── side panel ─────────────────────────────────────────────────────────────
// mini pyramid: widths bottom-up (wb list), layer height h; fill fn per layer
function mini(c,cx,yb,ws,h,g,draw){ws.forEach((wb,j)=>{const wt=j<ws.length-1?Math.max(8,ws[j+1]+ (wb>ws[j+1]?(wb-ws[j+1])*.4:-(ws[j+1]-wb)*.4)):Math.max(8,wb-16);draw(j,cx,yb-j*(h+g),wb,wt,h);});}
function miniEnergy(c,cx,yb,ws,h,g,tau,t,base=0){
  mini(c,cx,yb,ws,h,g,(j,x,y,wb,wt,hh)=>withA(c,fade(tau,base+j*.3,.4),()=>{
    trap(c,x,y,wb,wt,hh);c.fillStyle=YELLOW;c.fill();
    c.save();trap(c,x,y,wb,wt,hh);c.clip();glow(c,x+Math.sin(t*1.3+j)*wb*.3,y-hh/2,30,WHITE,.4);c.restore();}));
}
function dotsIn(c,x,y,wb,wt,hh,n,t,seed,r=4){
  // evenly spaced in one or two rows, each dot wiggling a little
  const nr=n>6?2:1;let i=0;
  for(let row=0;row<nr;row++){const m=row===0?Math.ceil(n/nr):n-Math.ceil(n/nr),fy=nr===1?.5:(row===0?.3:.7),w=mix(wb,wt,fy)*.78;
    for(let q=0;q<m;q++,i++){const ph=i*1.7+seed,px=x+(m>1?(q/(m-1)-.5)*w:0)+Math.sin(t*1.6+ph)*1.5,py=y-fy*hh+Math.cos(t*1.3+ph)*1.5;circle(c,px,py,r,WHITE,C.deep,1.5);}}
}
function miniNumbers(c,cx,yb,ws,h,g,counts,tau,t,base=0,icon=null){
  mini(c,cx,yb,ws,h,g,(j,x,y,wb,wt,hh)=>withA(c,fade(tau,base+j*.3,.4),()=>{
    trap(c,x,y,wb,wt,hh);c.fillStyle=rgba(WHITE,.08);c.fill();c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;c.strokeStyle=rgba(WHITE,.8);c.lineWidth=2;c.stroke();c.restore();
    if(icon&&icon[j])K.place(c,icon[j],x-14,y-hh+3,28,hh-6);else if(counts[j]===1)circle(c,x+Math.sin(t*1.6)*2,y-hh/2,4,WHITE,C.deep,1.5);else dotsIn(c,x,y,wb,wt,hh,counts[j],t,j*13+7);}));
}
function sidePaddy(c,k,tau,t,keep=false){
  const tk=keep?tau+9:tau;
  text(c,PADDY,RX+16,RY+36,22,WHITE);
  miniEnergy(c,COLA,MBOT,MW,MH,MG,tk,t,.2);
  text(c,L('energy','能量','Energy'),COLA,MBOT+30,22,YELLOW,'center');
  if(k===0){
    // numbers unknown yet: a dashed outline with "?"
    const top=MBOT-4*MH-3*MG;
    c.save();c.setLineDash([6,6]);c.lineDashOffset=-t*8;trap(c,COLB,MBOT,MW[0],14,MBOT-top);c.strokeStyle=rgba(GREY,.7);c.lineWidth=2;c.stroke();c.restore();
    text(c,'?',COLB,MBOT-60+Math.sin(t*2)*3,40,GREY,'center',K.MONO);
    text(c,NUMS,COLB,MBOT+30,22,GREY,'center');
  }else{
    miniNumbers(c,COLB,MBOT,MW,MH,MG,[12,5,2,1],tau,t,.6);
    text(c,NUMS,COLB,MBOT+30,22,WHITE,'center');
  }
  withA(c,fade(tk,1.4),()=>{const p=tag(c,L('topSmallest','最上層最少','The top level is smallest'),RX+RW/2,MBOT+62,{al:'center',col:YELLOW,minX:RX+6,maxX:RX+RW-6});pulseRing(c,p,t);});
}
const TREE_BOX={x:630,y:176,w:150,h:188};
function sideTree(c,tau,t){
  const ht=K.wrap(c,L('oneTreeManyInsects','一棵樹可養很多昆蟲：個體數不一定是金字塔','One tree can feed many insects: numbers need not form a pyramid'),RX+16,RY+36,RW-32,22,WHITE,28);
  const r=K.fitRect(TREE,TREE_BOX.x,TREE_BOX.y,TREE_BOX.w,TREE_BOX.h);
  withA(c,fade(tau,.1),()=>K.drawIn(c,TREE,r));
  // many insects crawling on the crown
  const rr=K.rng(23);
  for(let i=0;i<34;i++){const fy=.08+rr()*.44,fx=.16+rr()*.68,ph=rr()*6.28,a=fade(tau,.5+i*.03,.3);
    const x=r.x+fx*r.w+Math.sin(t*.9+ph)*4,y=r.y+fy*r.h+Math.cos(t*1.1+ph)*3;
    withA(c,a,()=>{circle(c,x,y,3.6,WHITE,C.deep,1.5);});}
  // names with leaders
  const lx=TREE_BOX.x+TREE_BOX.w+16,iy=r.y+r.h*.2,ty=r.y+r.h*.7;
  withA(c,fade(tau,.9),()=>{
    K.line(c,[[r.x+r.w*.84,iy],[lx-6,iy]],rgba(WHITE,.7),2);text(c,INSECTS,lx,iy+8,22,WHITE);
    K.line(c,[[r.x+r.w*.56,ty],[lx-6,ty]],rgba(GREEN,.8),2);K.wrap(c,L('camphor','樟樹','Camphor tree'),lx,ty+8,RX+RW-12-lx,22,GREEN,28);
  });
  // mini pyramids: numbers inverted (1 tree, many insects), energy upright
  const yb=508,h=40,g=5;
  miniEnergy(c,COLA,yb,[140,52],h,g,tau,t,1.3);
  text(c,L('energy','能量','Energy'),COLA,yb+30,22,YELLOW,'center');
  miniNumbers(c,COLB,yb,[44,140],h,g,[1,16],tau,t,1.6,[TREE,null]);
  text(c,NUMS,COLB,yb+30,22,WHITE,'center');
  withA(c,fade(tau,2.4),()=>{const p=tag(c,NOFLIP,COLA,yb-2*h-g-50,{al:'center',col:YELLOW,active:true,minX:RX+6,maxX:RX+RW-6});pulseRing(c,p,t);});
}
function side(c,k,tau,t,keep=false){if(k<2)sidePaddy(c,k,tau,t,keep);else sideTree(c,tau,t);}

// ── header (top band) ──────────────────────────────────────────────────────
function header(c,k,a,t){withA(c,a,()=>{
  const ttl=k===0?L('energyPyramid','能量金字塔','Energy pyramid'):k===1?L('numberPyramid','個體數（示意）','Numbers of individuals (schematic)'):WHY;
  const p=tag(c,ttl,SX,10,{col:YELLOW,active:true,size:26});
  glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.55,YELLOW,.1+.05*Math.sin(t*2.2));
  if(k!==1)tag(c,L('schematic','示意','Schematic'),p.x+p.w+14,13,{col:WHITE});
});}

// ── frame ──────────────────────────────────────────────────────────────────
function stage(c,k,tau,t){if(k===0)stage0(c,tau,t);else if(k===1)stage1(c,tau,t);else stage2(c,tau,t);}
function draw(c,s,t){
  const {k}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.pyr||(s.pyr={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const aOld=moving?clamp(1-u*2):0,aNew=moving?clamp(u*2-1):1,tn=moving?Math.max(0,tau-MOVE/2):tau;
  D.round(c,SX,SY,SW,SH,16,'#16332b',C.edge);
  D.round(c,RX,RY,RW,RH,16,'#16332b',C.edge);
  c.save();c.beginPath();c.roundRect(SX,SY,SW,SH,16);c.clip();
  if(aOld>0)withA(c,aOld,()=>stage(c,st.from,9,t));
  withA(c,aNew,()=>stage(c,k,tn,t));
  rows(c,k,t);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),SX+14,SY+SH-12,22,C.muted);
  c.restore();
  c.save();c.beginPath();c.roundRect(RX,RY,RW,RH,16);c.clip();
  // steps 0 and 1 share the paddy side panel: no fade between them
  const sameSide=moving&&st.from<2&&k<2;
  if(sameSide)side(c,k,tn,t,true);
  else{if(aOld>0)withA(c,aOld,()=>side(c,st.from,9,t));withA(c,aNew,()=>side(c,k,tn,t));}
  c.restore();
  if(aOld>0)header(c,st.from,aOld,t);
  header(c,k,aNew,t);
}
window.EcologyDraw.pyramid=draw;
})();
