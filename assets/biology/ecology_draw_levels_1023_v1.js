/* Ecology lesson 1 · "levels" canvas (organisation tab, view 0), 2026-10-23.
 * One meadow picture (EC2_meadow_scene.jpg, 1672 × 933, AI illustration) seen through a moving camera; every step
 * zooms OUT from the previous one (camera rect eases in log-scale, 1.4 s) while the old labels fade out and the new
 * ones fade in. Four steps, 8 s each; s.shown = current step.
 *  0 individual: camera close on one sparrow at the puddle, scene dimmed; the large sparrow picture (EC5_sparrow.png)
 *    nods gently inside a breathing yellow circle; "Individual" pill, "Sparrow" pill; minimap at top right with the
 *    yellow viewport box and dashed lines to the circle.
 *  1 population: the camera pulls back to the flock; a small yellow ring on each of the about 8 sparrows, one large
 *    ring round the flock; "Population"; "Same species / Same time / Same place" light up in turn; "About 8 sparrows".
 *    Grasshopper and butterfly appear as greyed chips cut from the same picture (their places marked on the
 *    minimap, grey rings) under a "Different species" tag: not in this population.
 *  2 community: the whole meadow; one coloured population ring per kind (sparrows, grass, grasshopper, butterfly,
 *    spider web, mushrooms) with its name pill; centre "Community" + "A community counts organisms only";
 *    puddle, soil and dead log get grey "✕" tags (not organisms; the log is dead matter, the mushrooms are alive).
 *  3 ecosystem: same view; cyan pills for the nonliving environment (puddle, soil, light = drawn sun, air = drifting
 *    dots); three flowing arrows, each named: sun ("Light") → grass, yellow (energy colour); grass →
 *    grasshopper white food arrow "Eaten", dead log → soil thin white dashed "Decomposes"; centre "Ecosystem" +
 *    "Organisms + nonliving environment + interactions"; legend pill "Nonliving environment" (cyan).
 * All picture points were measured once on the JPG with PIL (image px, constants below).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,ease,rgba,text,measure,splitLines,glow,line,circle,ellipse,dim,drawIn,fitRect,stageClock,fade,pic,src}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=8,CW=960,CH=600,ASP=CW/CH,MOVE=1.4;
const YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,PINK=C.pink,WHITE=C.white,GREY='#9fb3a8',VIOLET='#c4b5fd',SAND=C.sand;
const MEADOW='EC2_meadow_scene.jpg',SPARROW='EC5_sparrow.png';
const [IW,IH]=dim(MEADOW);

// ── measured on EC2_meadow_scene.jpg (image px, PIL grid crops) ─────────────
// the eight sparrows at the puddle: centre x, y and a ring radius that holds the body
const SP=[[225,600,58],[410,560,36],[405,615,48],[482,610,28],[595,612,46],[335,655,52],[415,705,50],[595,672,52]];
const ONE=7;                                   // the sparrow used for the individual (lower right of the flock)
const FLOCK={x:410,y:638,rx:322,ry:136};        // ring round the flock (box 110–710 × 520–755)
const GRASSHOPPER=[1207,140],BUTTERFLY=[1005,222];
const POP={                                     // one population ring per kind, image px
 sparrow:{e:[410,638,322,136,0],col:YELLOW},
 grass:{e:[400,330,240,120,0],col:GREEN},
 grasshopper:{e:[1207,140,50,50,0],col:PINK},
 butterfly:{e:[1005,222,48,48,0],col:VIOLET},
 web:{e:[1428,330,105,105,0],col:WHITE},
 mushroom:{e:[1265,668,265,85,-.36],col:SAND}};
const PUDDLE=[820,600,180,62];                  // puddle 640–1000 × 540–660
const LOG=[[825,700],[1000,640],[1250,598],[1450,556],[1530,515],[1545,600],[1400,700],[1250,800],[1050,862],[870,872],[822,800]];

// ── camera: a viewport rect on the picture (aspect = canvas) ───────────────
const CAM=[{z:4.2,cx:595,cy:668},{z:1.9,cx:470,cy:625},{z:1,cx:826.4,cy:466.5},{z:1,cx:826.4,cy:466.5}];
function rectOf(sw,cx,cy){const sh=sw/ASP;return{sx:Math.max(0,Math.min(IW-sw,cx-sw/2)),sy:Math.max(0,Math.min(IH-sh,cy-sh/2)),sw,sh};}
const camW=k=>IH/CAM[k].z*ASP;
function camAt(a,b,u,t){
  const A=CAM[a],B=CAM[b],w=Math.exp(mix(Math.log(camW(a)),Math.log(camW(b)),u));
  const z=IH/(w/ASP),drift=z>1.05?3:0;           // tiny drift (the whole view at z = 1 stays put)
  return rectOf(w,mix(A.cx,B.cx,u)+drift*Math.sin(t*.31),mix(A.cy,B.cy,u)+drift*Math.cos(t*.27));
}
const mapper=R=>{const s=CW/R.sw;const f=([x,y])=>[(x-R.sx)*s,(y-R.sy)*s];f.s=s;return f;};

// ── small drawing helpers ──────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const tx=p=>D.tr(p);
const X=p=>[p[0]+' ✕',p[1]+' ✕'];
// a name pill measured first (never shrunk below 22 px); al: left / right / center
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.88)'}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function aiNote(c){const p=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),w=measure(c,p,22)+20;
  D.round(c,14,560,w,34,10,'rgba(11,26,21,.78)',null);text(c,p,24,584,22,C.muted);}
function ring(c,m,e,col,t,ph=0,w=3){
  const [x,y]=m([e[0],e[1]]),rx=e[2]*m.s,ry=e[3]*m.s,b=1+.035*Math.sin(t*2.2+ph);
  ellipse(c,x,y,rx*b,ry*b,null,rgba(C.deep,.6),w+3,e[4]);
  ellipse(c,x,y,rx*b,ry*b,null,col,w,e[4]);
}
// a picture region, cut round, greyed (saturation blend works in Safari too)
function chip(c,[ix,iy],ir,x,y,r){
  const im=pic(src(MEADOW));
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  if(im)c.drawImage(im,ix-ir,iy-ir,ir*2,ir*2,x-r,y-r,r*2,r*2);else{c.fillStyle=C.panel;c.fill();}
  c.globalCompositeOperation='saturation';c.fillStyle='#808080';c.fillRect(x-r,y-r,r*2,r*2);
  c.globalCompositeOperation='source-over';c.fillStyle=rgba(C.deep,.38);c.fillRect(x-r,y-r,r*2,r*2);
  c.restore();circle(c,x,y,r,null,GREY,3);
}
// a flowing curved arrow p0 → p2 (control p1): under-stroke, line, head, moving bright dots
function flow(c,p0,p1,p2,col,t,{w=4,dash=null,dots=3,speed=.28}={}){
  const end=K.bez(p0,p1,p2,.93);
  c.save();c.lineCap='round';
  c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...end);c.strokeStyle=rgba(C.deep,.7);c.lineWidth=w+4;c.stroke();
  if(dash)c.setLineDash(dash);c.lineDashOffset=-t*14;
  c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...end);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();
  const a=Math.atan2(p2[1]-end[1],p2[0]-end[0]),hl=16,hw=10;
  c.save();c.beginPath();c.moveTo(...p2);
  c.lineTo(p2[0]-hl*Math.cos(a)+hw*Math.sin(a),p2[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(p2[0]-hl*Math.cos(a)-hw*Math.sin(a),p2[1]-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=col;c.strokeStyle=rgba(C.deep,.7);c.lineWidth=2;c.stroke();c.fill();c.restore();
  for(let i=0;i<dots;i++){const u=mod(t*speed+i/dots)*.9,[x,y]=K.bez(p0,p1,p2,u);glow(c,x,y,11,col,.7);circle(c,x,y,3.4,WHITE,null);}
}

// ── minimap (top right): the whole meadow, a yellow box on the current view ─
function minimap(c,R,t,wid,a,link=null){
  withA(c,a,()=>{
    const h=wid*IH/IW,x=CW-14-wid,y=14;
    D.round(c,x-4,y-4,wid+8,h+8,8,'rgba(11,26,21,.9)',rgba(WHITE,.7));
    drawIn(c,MEADOW,{x,y,w:wid,h});
    const k=wid/IW,bx=x+R.sx*k,by=y+R.sy*k,bw=R.sw*k,bh=R.sh*k,pu=.5+.5*Math.sin(t*3);
    if(bw<wid-6){c.save();c.fillStyle=rgba(C.deep,.45);c.beginPath();c.rect(x,y,wid,h);c.rect(bx+bw,by,-bw,bh);c.fill('evenodd');c.restore();}
    c.save();c.strokeStyle=rgba(C.deep,.8);c.lineWidth=5;c.strokeRect(bx,by,bw,bh);
    c.strokeStyle=YELLOW;c.lineWidth=2.5+1.2*pu;c.strokeRect(bx,by,bw,bh);c.restore();
    if(link)link({x,y,k,bx,by,bw,bh});
  });
}

// ── step 0: one sparrow ────────────────────────────────────────────────────
const HERO={x:430,y:318,w:470};
function layer0(c,m,tau,t,a,out=0){
  withA(c,a,()=>{
    // the hero picture shrinks toward the real sparrow while the camera pulls back
    const [W,H]=dim(SPARROW),hh=HERO.w*H/W,s=SP[ONE],[px,py]=m([s[0],s[1]]),pr=s[2]*m.s;
    const u=smooth(out),cx=mix(HERO.x,px,u),cy=mix(HERO.y,py,u),w=mix(HERO.w,pr*2.2,u),h=w*H/W,R=mix(250,pr,u);
    const br=1+.025*Math.sin(t*2.1);
    glow(c,cx,cy,R*1.25,YELLOW,.12*(1-u));
    circle(c,cx,cy,R*br,rgba('#16332b',.55*(1-u)),null);
    // gentle nod: rotate about the feet
    const nod=.045*Math.sin(t*2.6)*Math.max(0,Math.sin(t*.9)),fx=cx-w*.12,fy=cy+h*.28;
    c.save();c.globalAlpha*=1-u;c.translate(fx,fy);c.rotate(nod);c.translate(-fx,-fy);
    drawIn(c,SPARROW,{x:cx-w/2,y:cy-h/2,w,h});c.restore();
    circle(c,cx,cy,R*br,null,rgba(C.deep,.6),8);circle(c,cx,cy,R*br,null,YELLOW,4.5);
    withA(c,1-u,()=>{
      tag(c,L('individual','個體','Individual'),24,22,{col:YELLOW,active:true,size:34});
      withA(c,fade(tau,1.2,.6),()=>{
        const b=tag(c,L('sparrow','麻雀','Sparrow'),740,300,{col:WHITE});
        const ex=cx+R*br*.94,ey=cy-R*.2;line(c,[[b.x,b.y+b.h/2],[ex,ey]],rgba(C.deep,.6),4.5);line(c,[[b.x,b.y+b.h/2],[ex,ey]],WHITE,2);
        circle(c,ex,ey,4.5,WHITE,C.ink,1.5);});
    });
  });
}

// ── step 1: the flock ──────────────────────────────────────────────────────
const SAME=[['sameSpecies','同種','Same species'],['sameTime','同時','Same time'],['samePlace','同地','Same place']];
const CHIPS=[{p:GRASSHOPPER,ir:46,y:236,lab:()=>L('grasshopper','蚱蜢','Grasshopper')},{p:BUTTERFLY,ir:44,y:388,lab:()=>L('butterfly','蝴蝶','Butterfly')}];
function layer1(c,m,tau,t,a){
  withA(c,a,()=>{
    // a small ring on each sparrow, appearing one after another
    SP.forEach(([x,y,r],i)=>withA(c,fade(tau,.2+i*.12,.4),()=>{const [cx,cy]=m([x,y]),b=1+.06*Math.sin(t*2.6+i);
      circle(c,cx,cy,r*m.s*b,null,rgba(C.deep,.55),5.5);circle(c,cx,cy,r*m.s*b,null,YELLOW,2.6);}));
    withA(c,fade(tau,1.3,.6),()=>{ring(c,m,[FLOCK.x,FLOCK.y,FLOCK.rx,FLOCK.ry,0],YELLOW,t,0,4.5);});
    tag(c,L('population','族群','Population'),24,22,{col:YELLOW,active:true,size:34});
    withA(c,fade(tau,1.6,.5),()=>tag(c,L('sparrowFlock','約 8 隻麻雀','About 8 sparrows'),24,86,{col:YELLOW}));
    // same species / time / place: light up in turn under the flock, then stay
    const ws=SAME.map(([k,zh,en])=>measure(c,L(k,zh,en),22)+28),gap=16,tot=ws.reduce((s,w)=>s+w,0)+gap*2;
    let x=Math.max(24,m([FLOCK.x,0])[0]-tot/2);
    SAME.forEach(([k,zh,en],i)=>{const t0=2.4+i*1.0,on=tau>=t0&&tau<t0+1.0;
      withA(c,fade(tau,t0,.4),()=>{if(on)glow(c,x+ws[i]/2,520,70,YELLOW,.3);tag(c,L(k,zh,en),x,500,{col:YELLOW,active:on});});x+=ws[i]+gap;});
    // other kinds, greyed: not in this population
    withA(c,fade(tau,3.0,.6),()=>{
      const cx=868;tag(c,L('otherSpecies','不同種','Different species'),cx,156,{al:'center',col:GREY});
      CHIPS.forEach((ch,i)=>{const r=42+1.5*Math.sin(t*1.8+i*2);chip(c,ch.p,ch.ir,cx,ch.y,r);
        tag(c,ch.lab(),cx,ch.y+50,{al:'center',col:GREY});});
    });
  });
}

// ── step 2: the community ──────────────────────────────────────────────────
const POPTAG=[ // name pill per population ring: canvas x, y (top), align
 {k:'sparrow',lab:()=>L('sparrow','麻雀','Sparrow'),x:16,y:284,al:'left'},
 {k:'grass',lab:()=>L('grass','草','Grass'),x:292,y:98,al:'left'},
 {k:'grasshopper',lab:()=>L('grasshopper','蚱蜢','Grasshopper'),x:688,y:18,al:'right'},
 {k:'butterfly',lab:()=>L('butterfly','蝴蝶','Butterfly'),x:554,y:122,al:'right'},
 {k:'web',lab:()=>L('web','蜘蛛網','Spider web'),x:867,y:290,al:'center'},
 {k:'mushroom',lab:()=>L('mushroom','蕈類','Mushrooms'),x:944,y:462,al:'right'}];
const NONLIV={puddle:{x:476,y:366},soil:{x:330,y:512},log:{x:572,y:512}};
function logPath(c,m){c.beginPath();LOG.forEach((p,i)=>{const [x,y]=m(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();}
function popRings(c,m,tau,t,dim=1){
  POPTAG.forEach((g,i)=>withA(c,fade(tau,.3+i*.25,.5)*dim,()=>ring(c,m,POP[g.k].e,POP[g.k].col,t,i*1.1,3.4)));
}
function popTags(c,tau,dim=1){
  POPTAG.forEach((g,i)=>withA(c,fade(tau,.3+i*.25,.5)*dim,()=>tag(c,g.lab(),g.x,g.y,{al:g.al,col:POP[g.k].col})));
}
function centre(c,main,sub,tau,t,col){
  const cx=500,y=188;
  withA(c,fade(tau,2.0,.6),()=>{glow(c,cx,y+26,120+8*Math.sin(t*1.6),col,.18);tag(c,main,cx,y,{al:'center',col,active:true,size:34});});
  withA(c,fade(tau,2.6,.6),()=>{
    const maxW=400,rows=splitLines(c,tx(sub),maxW-28,22),w=Math.max(...rows.map(r=>measure(c,r,22)))+28,h=rows.length*30+14;
    D.round(c,cx-w/2,y+62,w,h,14,'rgba(11,26,21,.9)',rgba(col,.8));
    rows.forEach((r,i)=>text(c,r,cx,y+62+30+i*30-3,22,col,'center'));});
}
function layer2(c,m,tau,t,a){
  withA(c,a,()=>{
    // nonliving things: dimmed, grey dashed outline, "✕" tag
    withA(c,fade(tau,3.0,.6),()=>{
      const [px,py]=m([PUDDLE[0],PUDDLE[1]]);
      c.save();c.beginPath();c.ellipse(px,py,PUDDLE[2]*m.s,PUDDLE[3]*m.s,0,0,TAU);c.fillStyle=rgba(C.deep,.4);c.fill();
      c.setLineDash([8,7]);c.strokeStyle=GREY;c.lineWidth=2.5;c.stroke();c.restore();
      c.save();logPath(c,m);c.setLineDash([8,7]);c.strokeStyle=GREY;c.lineWidth=2.5;c.stroke();c.restore();
      tag(c,X(L('puddle','水坑','Puddle')),NONLIV.puddle.x,NONLIV.puddle.y,{al:'center',col:GREY});
      tag(c,X(L('soil','土壤','Soil')),NONLIV.soil.x,NONLIV.soil.y,{al:'center',col:GREY});
      tag(c,X(L('log','枯木','Dead log')),NONLIV.log.x,NONLIV.log.y,{al:'center',col:GREY});
    });
    popRings(c,m,tau,t);popTags(c,tau);
    centre(c,L('community','群集','Community'),L('onlyOrganisms','群集只算生物','A community counts organisms only'),tau,t,YELLOW);
  });
}

// ── step 3: the ecosystem ──────────────────────────────────────────────────
const SUN=[46,48];
function sun(c,t){
  const [x,y]=SUN;glow(c,x,y,64+6*Math.sin(t*1.7),YELLOW,.45);
  c.save();c.translate(x,y);c.rotate(t*.25);c.strokeStyle=YELLOW;c.lineWidth=3;c.lineCap='round';
  for(let i=0;i<10;i++){const a=i*TAU/10,r1=27,r2=36+3*Math.sin(t*2+i);c.beginPath();c.moveTo(r1*Math.cos(a),r1*Math.sin(a));c.lineTo(r2*Math.cos(a),r2*Math.sin(a));c.stroke();}
  c.restore();
  const g=c.createRadialGradient(x-6,y-6,2,x,y,22);g.addColorStop(0,'#fff7c2');g.addColorStop(1,YELLOW);circle(c,x,y,21,g,'#f59e0b',2);
}
function air(c,t){
  for(let i=0;i<14;i++){const u=mod(t*.05+i/14),x=170+u*560,y=30+20*Math.sin(u*TAU*2+i*1.7)+(i%3)*14,a=Math.sin(u*Math.PI);
    circle(c,x,y,3.6,rgba(CYAN,.85*a),rgba(C.deep,.5*a),1.2);}
}
function layer3(c,m,tau,t,a){
  withA(c,a,()=>{
    popRings(c,m,99,t,.6);
    // the log stays (dead matter), named in grey
    withA(c,.9,()=>{c.save();logPath(c,m);c.setLineDash([8,7]);c.strokeStyle=GREY;c.lineWidth=2.2;c.stroke();c.restore();});
    // nonliving environment, cyan
    withA(c,fade(tau,.5,.6),()=>{
      const [px,py]=m([PUDDLE[0],PUDDLE[1]]),b=1+.04*Math.sin(t*2);
      ellipse(c,px,py,PUDDLE[2]*m.s*b,PUDDLE[3]*m.s*b,rgba(CYAN,.1),CYAN,3);
      sun(c,t);air(c,t);
      tag(c,L('light','光','Light'),86,28,{col:CYAN});
      tag(c,L('air','空氣','Air'),214,16,{col:CYAN});
      tag(c,L('puddle','水坑','Puddle'),NONLIV.puddle.x,NONLIV.puddle.y,{al:'center',col:CYAN});
      tag(c,L('soil','土壤','Soil'),NONLIV.soil.x,NONLIV.soil.y,{al:'center',col:CYAN});
    });
    // interactions: three named arrows
    withA(c,fade(tau,1.4,.6),()=>{
      flow(c,[62,80],[88,140],[176,132],YELLOW,t,{w:4});});
    const [gx,gy]=m([1207,140]),gr=50*m.s;
    withA(c,fade(tau,2.0,.6),()=>{
      flow(c,[372,178],[520,30],[gx-gr-6,gy+4],WHITE,t+.7,{w:4});
      tag(c,L('eats','被吃','Eaten'),468,52,{al:'center',col:WHITE});});
    popTags(c,99,.8);
    withA(c,fade(tau,2.6,.6),()=>{
      const lb=tag(c,L('log','枯木','Dead log'),NONLIV.log.x,NONLIV.log.y,{al:'center',col:GREY});
      const sw=measure(c,L('soil','土壤','Soil'),22)+28,sx=NONLIV.soil.x+sw/2+6;
      flow(c,[lb.x-4,lb.y+20],[(lb.x+sx)/2,lb.y+34],[sx,NONLIV.soil.y+22],WHITE,t+.3,{w:2.6,dash:[9,7],dots:2,speed:.22});
      tag(c,L('decomposes','分解','Decomposes'),(lb.x+sx)/2,NONLIV.soil.y-40,{al:'center',col:WHITE});});
    centre(c,L('ecosystem','生態系','Ecosystem'),L('ecoParts','生物＋非生物環境＋互相作用','Organisms + nonliving environment + interactions'),tau+.6,t,CYAN);
    // legend: cyan = nonliving environment
    withA(c,fade(tau,3.4,.6),()=>tag(c,L('nonliving','非生物環境','Nonliving environment'),946,554,{al:'right',col:CYAN}));
  });
}

// ── frame ──────────────────────────────────────────────────────────────────
const LAYERS=[layer0,layer1,layer2,layer3];
const SHADE=[.58,.16,.2,.26],MINI=[220,220,150,150],MINIA=[1,1,1,0];
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.lv||(s.lv={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1,from=moving?st.from:k;
  const R=camAt(from,k,u,t),m=mapper(R);
  drawIn(c,MEADOW,{x:0,y:0,w:CW,h:CH},{crop:[R.sx/IW,R.sy/IH,R.sw/IW,R.sh/IH]});
  c.fillStyle=rgba(C.deep,mix(SHADE[from],SHADE[k],u));c.fillRect(0,0,CW,CH);
  // the minimap stays on through steps 0–2 (dashed link to the hero circle in step 0)
  const mw=mix(MINI[from],MINI[k],u),ma=mix(MINIA[from],MINIA[k],u);
  minimap(c,R,t,mw,ma,(k===0&&!moving)?(g=>withA(c,fade(tau,.8,.6),()=>{
    [[g.bx,g.by+g.bh],[g.bx,g.by]].forEach(([qx,qy])=>{const a=Math.atan2(qy-HERO.y,qx-HERO.x),ex=HERO.x+254*Math.cos(a),ey=HERO.y+254*Math.sin(a);
      K.dashed(c,[[qx,qy],[ex,ey]],rgba(YELLOW,.75),2.2,[7,6],-t*12);});})):null);
  if(moving){
    if(st.from===0&&k===1)layer0(c,m,st.fromTau+(t-st.T),t,1,x);
    else LAYERS[st.from](c,m,st.fromTau+(t-st.T),t,1-smooth(x*2.2));
    const a=smooth((x-.55)/.45);LAYERS[k](c,m,tau-1.0,t,a);
  }else LAYERS[k](c,m,tau-(st.from>=0?1.0:0),t,1);
  // step 1: grey rings on the minimap where the grasshopper and butterfly are
  if(k===1&&!moving)withA(c,fade(tau-1,3.0,.6),()=>{const kx=MINI[1]/IW,mx=CW-14-MINI[1],my=14;
    CHIPS.forEach((ch,i)=>{const qx=mx+ch.p[0]*kx,qy=my+ch.p[1]*kx;circle(c,qx,qy,7+1.5*Math.sin(t*2.4+i),null,rgba(C.deep,.7),4.5);circle(c,qx,qy,7+1.5*Math.sin(t*2.4+i),null,GREY,2.2);});});
  aiNote(c);
}
window.EcologyDraw.levels=draw;
})();
