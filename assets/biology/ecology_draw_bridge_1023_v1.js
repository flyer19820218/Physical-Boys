/* Ecology lesson 1 · "bridge" canvas (living-layer tab, view 0), 2026-10-23.
 * Three steps (7 s each; s.shown = current step):
 *  0 life lives in a thin layer: the lesson cover (cover.jpg, dawn stream with a kingfisher, AI illustration) fills the
 *    canvas with a slow Ken Burns push; a cyan "Biosphere" pill above, a yellow "A thin layer" pill below. No Earth,
 *    no thickness, no numbers (those were taught in an earlier lesson).
 *  1 who lives with whom: the cover pushes in hard and fades into the meadow (EC2_meadow_scene.jpg); white leader lines
 *    and name pills point at the sparrows, grass, grasshopper, butterfly, spider web, mushrooms, puddle and dead log;
 *    three slowly pulsing cyan dashed links join sparrows–puddle, grass–grasshopper, dead log–mushrooms ("they are
 *    related"; no food arrows, no direction).
 *  2 the four questions: the meadow dims behind four cards (2 × 2) titled LAB.q1–q4, each with a small icon drawn in
 *    code (sparrow picture / quadrat with grass / up and down arrows / green sprout) and a numbered circle; the cards
 *    light up in turn (1.2 s each, looping).
 * Step changes: 0 → 1 zooms into the cover while the meadow fades in (1.3 s); other changes cross-fade (0.9 s).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,ease,rgba,text,measure,wrap,glow,line,sline,circle,ellipse,arrow,dim,drawIn,fitRect,stageClock,fade}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=3,PER=7,CW=960,CH=600,ASP=CW/CH;
const CYAN=C.cyan,YELLOW=C.yellow,GREEN=C.green,PINK=C.pink;
const COVER='cover.jpg',MEADOW='EC2_meadow_scene.jpg',SPARROW='EC5_sparrow.png';

// ── points measured once on EC2_meadow_scene.jpg (1672 × 933, image px; PIL) ──
const MP={sparrows:[420,615],grass:[440,250],grasshopper:[1200,150],butterfly:[1000,222],web:[1426,320],
  mushroom:[1320,675],puddle:[820,600],log:[1000,760]};
// name pill for each: anchor x, y (top), align
const TAGS=[
 {k:'sparrows',lab:()=>L('sparrow','麻雀','Sparrow'),x:40,y:500,al:'left',t0:1.0},
 {k:'grass',lab:()=>L('grass','草','Grass'),x:60,y:70,al:'left',t0:1.4},
 {k:'grasshopper',lab:()=>L('grasshopper','蚱蜢','Grasshopper'),x:520,y:28,al:'left',t0:1.8},
 {k:'butterfly',lab:()=>L('butterfly','蝴蝶','Butterfly'),x:540,y:168,al:'right',t0:2.2},
 {k:'web',lab:()=>L('web','蜘蛛網','Spider web'),x:944,y:262,al:'right',t0:2.6},
 {k:'mushroom',lab:()=>L('mushroom','蕈類','Mushrooms'),x:944,y:476,al:'right',t0:3.0},
 {k:'puddle',lab:()=>L('puddle','水坑','Puddle'),x:330,y:520,al:'left',t0:3.4},
 {k:'log',lab:()=>L('log','枯木','Dead log'),x:530,y:528,al:'left',t0:3.8}];
const LINKS=[['sparrows','puddle',40],['grass','grasshopper',-34],['log','mushroom',30]];

// ── camera on a 1672 × 933 picture: zoom z ≥ 1 about (cx, cy); returns image → canvas mapping ──
function cam(c,file,z,cx,cy,alpha=1){
  const [W,H]=dim(file);let sh=H/z,sw=sh*ASP;if(sw>W){sw=W/z;sh=sw/ASP;}
  const sx=Math.max(0,Math.min(W-sw,cx-sw/2)),sy=Math.max(0,Math.min(H-sh,cy-sh/2));
  drawIn(c,file,{x:0,y:0,w:CW,h:CH},{alpha,crop:[sx/W,sy/H,sw/W,sh/H]});
  return([x,y])=>[(x-sx)/sw*CW,(y-sy)/sh*CH];
}
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();};
const shade=(c,a)=>{c.fillStyle=rgba(C.deep,a);c.fillRect(0,0,CW,CH);};
function vgrad(c,y0,y1,a0,a1){const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,rgba(C.deep,a0));g.addColorStop(1,rgba(C.deep,a1));c.fillStyle=g;c.fillRect(0,Math.min(y0,y1),CW,Math.abs(y1-y0));}

// a name pill measured first (never shrunk); align left / right / center; returns its box
function tag(c,p,x,y,{al='left',col=C.white,active=false,size=22}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,active?col:'rgba(11,26,21,.88)',active?C.white:rgba(col,.85));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function aiNote(c){const p=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),w=measure(c,p,22)+20;
  D.round(c,14,560,w,34,10,'rgba(11,26,21,.72)',null);text(c,p,24,584,22,C.muted);}
// white leader from a box edge to a point, with a small dot and a soft ring at the point
function lead(c,b,[px,py],t){
  const x=Math.max(b.x+14,Math.min(b.x+b.w-14,px)),y=Math.max(b.y,Math.min(b.y+b.h,py));
  const ex=px<b.x?b.x:px>b.x+b.w?b.x+b.w:x,ey=py<b.y?b.y:py>b.y+b.h?b.y+b.h:y;
  line(c,[[ex,ey],[px,py]],rgba(C.deep,.65),4.5);line(c,[[ex,ey],[px,py]],rgba(C.white,.95),2);
  const u=mod(t*.5);circle(c,px,py,6+u*10,null,rgba(C.white,.7*(1-u)),2);circle(c,px,py,4.5,C.white,C.ink,1.5);
}

// ── step 0: the biosphere, a thin layer (cover, slow push) ─────────────────
function cover(c,tau,t,boost=0){
  const z=(1.02+.07*ease(Math.min(tau,14)/14)+.006*Math.sin(t*.5))*(1+1.6*boost*boost);
  const [W,H]=dim(COVER);cam(c,COVER,z,mix(W*.53,W*.48,boost)+18*Math.sin(t*.13),mix(H*.52,H*.62,boost));
}
function step0(c,tau,t,o){
  cover(c,tau,t,o.boost||0);
  vgrad(c,0,150,.62,0);vgrad(c,CH,CH-170,.62,0);
  withA(c,fade(tau,.5,.7),()=>{const p=L('biosphere','生物圈','Biosphere'),y=42;
    glow(c,CW/2,y+24,120+10*Math.sin(t*1.4),CYAN,.22);tag(c,p,CW/2,y,{al:'center',col:CYAN,active:true,size:30});});
  withA(c,fade(tau,1.6,.7),()=>{const p=L('thinLayer','薄薄的一層','A thin layer'),y=486;
    glow(c,CW/2,y+22,130+10*Math.sin(t*1.4+1.6),YELLOW,.2);tag(c,p,CW/2,y,{al:'center',col:YELLOW,active:true,size:28});});
  aiNote(c);
}

// ── step 1: one meadow, who lives with whom ────────────────────────────────
function meadow(c,t,alpha=1){const [W,H]=dim(MEADOW);return cam(c,MEADOW,1.012+.01*Math.sin(t*.3),W*.5+14*Math.sin(t*.17),H*.5,alpha);}
function step1(c,tau,t){
  const m=meadow(c,t);shade(c,.14);
  const boxes={},pts={};
  // pills first measured, then drawn last (on top of leaders and links)
  TAGS.forEach(g=>{const p=g.lab(),w=measure(c,p,22)+28;boxes[g.k]={x:g.al==='right'?g.x-w:g.x,y:g.y,w,h:40};pts[g.k]=m(MP[g.k]);});
  // links: slow cyan pulse, no direction
  withA(c,fade(tau,4.4,.8),()=>LINKS.forEach(([a,b,bow],i)=>{
    const A=boxes[a],B=boxes[b],p0=[A.x+A.w/2,A.y+A.h/2],p2=[B.x+B.w/2,B.y+B.h/2];
    const nx=-(p2[1]-p0[1]),ny=p2[0]-p0[0],nl=Math.hypot(nx,ny)||1,p1=[(p0[0]+p2[0])/2+nx/nl*bow,(p0[1]+p2[1])/2+ny/nl*bow];
    const pu=.5+.5*Math.sin(t*1.6-i*1.1);
    c.save();c.lineCap='round';c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...p2);
    c.strokeStyle=rgba(C.deep,.55);c.lineWidth=6;c.stroke();
    c.setLineDash([10,8]);c.strokeStyle=rgba(CYAN,.45+.5*pu);c.lineWidth=2.5+1.5*pu;c.stroke();c.restore();}));
  TAGS.forEach(g=>withA(c,fade(tau,g.t0,.5),()=>lead(c,boxes[g.k],pts[g.k],t)));
  TAGS.forEach(g=>withA(c,fade(tau,g.t0,.5),()=>tag(c,g.lab(),g.x,g.y,{al:g.al,col:C.white})));
  aiNote(c);
}

// ── step 2: the four questions ─────────────────────────────────────────────
const CARD={x0:96,y0:76,w:374,h:196,gx:20,gy:20};
const cardRect=i=>({x:CARD.x0+(i%2)*(CARD.w+CARD.gx),y:CARD.y0+Math.floor(i/2)*(CARD.h+CARD.gy),w:CARD.w,h:CARD.h});
function iconSparrow(c,R,t,on){const r=fitRect(SPARROW,R.x+6,R.y+10,R.w-12,R.h-20),dy=on?-3*Math.abs(Math.sin(t*3)):1.5*Math.sin(t*1.2);
  ellipse(c,r.x+r.w*.5,r.y+r.h-2,r.w*.34,5,'rgba(11,26,21,.45)',null);drawIn(c,SPARROW,{...r,y:r.y+dy});}
function tuft(c,x,y,s,t,ph){const sw=2*Math.sin(t*1.5+ph);
  [[-.5,.7],[0,1],[.5,.75]].forEach(([dx,h])=>sline(c,[[x+dx*s*.4,y],[x+dx*s+sw*h,y-s*h*1.5]],GREEN,2.4));}
function iconQuadrat(c,R,t,on){const s=R.w*.62,x=R.x+(R.w-s)/2,y=R.y+(R.h-s)/2;
  // a few tufts outside (dim) and inside the frame
  [[R.x+6,R.y+R.h-8],[R.x+R.w-8,R.y+16]].forEach(([px,py],i)=>withA(c,.45,()=>tuft(c,px,py,12,t,i*2)));
  [[.3,.42],[.7,.36],[.45,.82],[.78,.8]].forEach(([u,v],i)=>tuft(c,x+u*s,y+v*s,13,t,i));
  c.save();c.strokeStyle=on?YELLOW:C.white;c.lineWidth=3;c.strokeRect(x,y,s,s);c.restore();
  if(on)glow(c,x+s/2,y+s/2,s*.75,YELLOW,.14);}
function iconUpDown(c,R,t,on){const cx=R.x+R.w/2,cy=R.y+R.h/2,a=on?1:.85,u=on?6*Math.sin(t*3):2*Math.sin(t*1.2);
  withA(c,a,()=>{arrow(c,cx-22,cy+38+u,cx-22,cy-42+u,GREEN,6);arrow(c,cx+22,cy-38-u,cx+22,cy+42-u,PINK,6);});}
function iconSprout(c,R,t,on){const gx=R.x+R.w/2,gy=R.y+R.h-22,g=on?.75+.25*(.5+.5*Math.sin(t*2.4)):.8,sw=3*Math.sin(t*1.3);
  ellipse(c,gx,gy+4,R.w*.4,10,'#6b5a3a',null);line(c,[[R.x+10,gy],[R.x+R.w-10,gy]],'#8c7650',3);
  const top=[gx+sw,gy-70*g];sline(c,[[gx,gy],[gx+sw*.4,gy-35*g],top],GREEN,4);
  const leaf=(dir)=>{c.save();c.translate(gx+sw*.6,gy-48*g);c.rotate(dir*(.6+.08*Math.sin(t*1.6)));c.beginPath();c.ellipse(dir*16*g,0,18*g,8*g,0,0,TAU);
    c.fillStyle=GREEN;c.fill();c.strokeStyle=rgba(C.deep,.6);c.lineWidth=1.5;c.stroke();c.restore();};
  leaf(-1);leaf(1);if(on)glow(c,top[0],top[1],30,GREEN,.3);}
const ICONS=[iconSparrow,iconQuadrat,iconUpDown,iconSprout];
const QK=[['q1','怎麼分層次？','How do we sort levels?'],['q2','數不完怎麼估？','How do we estimate?'],['q3','數量為什麼增減？','Why do numbers change?'],['q4','裸地怎麼變綠？','How does bare ground turn green?']];
function step2(c,tau,t){
  meadow(c,t);shade(c,mix(.14,.66,smooth(tau/1.2)));
  const act=tau<2.2?-1:Math.floor(mod((tau-2.2)/1.2,4));
  for(let i=0;i<4;i++)withA(c,fade(tau,.4+i*.35,.5),()=>{const R=cardRect(i),on=i===act;
    if(on)glow(c,R.x+R.w/2,R.y+R.h/2,R.w*.62,YELLOW,.16);
    c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,16);c.fillStyle=rgba('#16332b',.94);c.fill();
    c.strokeStyle=on?YELLOW:rgba(C.white,.55);c.lineWidth=on?3.5:2;c.stroke();
    const IB={x:R.x+18,y:R.y+38,w:120,h:120};
    c.beginPath();c.roundRect(IB.x,IB.y,IB.w,IB.h,12);c.fillStyle=rgba('#1c3d34',1);c.fill();
    ICONS[i](c,IB,t,on);
    const [k,zh,en]=QK[i];wrap(c,L(k,zh,en),R.x+156,R.y+76,R.w-176,26,on?YELLOW:C.white,34);
    K.marker(c,R.x+R.w-26,R.y+26,i+1,on?t:null,15,on?YELLOW:CYAN);});
  aiNote(c);
}

// ── one step's whole picture; transitions ──────────────────────────────────
const STEPS=[step0,step1,step2];
function scene(c,k,tau,t,a,o={}){withA(c,a,()=>STEPS[k](c,tau,t,o));}

function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.br||(s.br={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const zoom=st.from===0&&k===1,dur=zoom?1.3:.9,x=clamp((t-st.T)/dur),cross=st.from>=0&&x<1;
  if(cross&&zoom){
    // push into the cover; the meadow fades in over it
    scene(c,0,st.fromTau+(t-st.T),t,1,{boost:ease(x)});
    scene(c,1,tau,t,smooth(clamp((x-.15)/.85)));
  }else if(cross){
    scene(c,st.from,st.fromTau+(t-st.T),t,1);
    scene(c,k,tau,t,smooth(x));
  }else scene(c,k,tau,t,1);
}
window.EcologyDraw.bridge=draw;
})();
