/* Ecology lesson 1 · "recapture" canvas (sampling tab, view 1), 2026-10-23.
 * Mark-recapture with field mice. One picture, EC4_vole.png (634 × 568, AI illustration, faces left), reused for every
 * mouse: scaled 60–80 px wide, mirrored by running direction, small fixed-seed (K.rng) size jitter. The study site is a
 * drawn grass panel (#1c3d34 + faint grass strokes). Marks are drawn, not in the picture: a pink dot + short dash on the
 * back, placed from points measured once with PIL on the PNG (back arc: top contour x 380→96, x 420→132, x 460→222).
 * Four steps, 8 s each; s.shown = step.
 *  0 they move: 12 mice run round two lanes of the site (outer clockwise, inner the other way, never overlapping); a
 *    semi-transparent quadrat frame drifts over them and its live count pill ("3 inside") keeps changing.
 *  1 first catch: the site moves left; 20 mice fly into a dashed catch box on the right (4 × 5 grid, all countable),
 *    "M = 20"; a pink mark pops onto each in turn ("Mark"), then they run back into the site and fade in ("Release");
 *    two of the 12 site mice now carry marks. Held, this step replays every 10 s.
 *  2 second catch: "After a while" + moving dots (no days given); 20 mice fly into the box again, exactly s.R of them
 *    marked; a yellow scan runs cell by cell, numbering each marked one; "R = ?" turns into "R = <s.R>"; "C = 20".
 *  3 estimate: left, the marked share R ÷ C ≈ M ÷ N, then N ≈ M × C ÷ R = 20 × 20 ÷ R = N (K.MONO); R = 0 shows the
 *    division struck through + "R = 0: cannot use this formula" + "cannot divide by 0: sample again". Right, the four
 *    assumptions under an "Assumptions" pill, each with a small animated icon. Orange "An estimate, not an exact census".
 * s.R (4, 2, 5, 0) is read every frame: the marked cells of the second catch and every number follow it at once.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,line,circle,ellipse,dim,stageClock,fade}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=8,CW=960,MOVE=1.2,LOOP1=10;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,PINK=C.pink,GREEN=C.green,GREY='#9fb3a8',MONO=K.MONO;
const MM=()=>K.MARK_M||20,MC=()=>K.MARK_C||20;
const VOLE='EC4_vole.png';
const VAR=()=>{const [W,H]=dim(VOLE);return H/W;};
// mark on the back, as fractions of the picture (PIL, image px): dot centre (400,165), dash (420,205)→(440,245)
const MDOT=[400/634,165/568],MDASH=[[420/634,205/568],[440/634,245/568]];

// ── the site: 12 mice on two lanes (normalised to the site rect) ───────────
const LANES=[{cx:.5,cy:.53,rx:.40,ry:.33,n:8,w:-.14,ph:0},{cx:.5,cy:.53,rx:.20,ry:.13,n:4,w:.2,ph:.4}];
const FIELD_V=(()=>{const r=K.rng(4023),out=[];
  LANES.forEach((ln,li)=>{for(let i=0;i<ln.n;i++)out.push({li,th:ln.ph+i*TAU/ln.n,s:.92+r()*.16,ph:r()*TAU});});return out;})();
const FIELD_MARKED=[1,9];
const GRASS=(()=>{const r=K.rng(311),out=[];for(let i=0;i<150;i++)out.push([r(),r(),.4+r()*.6,(r()-.5)*.6]);return out;})();
// grid of the catch box: 5 columns × 4 rows
const BOX={x:490,y:84,w:440,h:420},COLS=5,ROWS=4,CELL=[84,70],GX=BOX.x+(BOX.w-COLS*84)/2,GY=104,GW=64;
const cellXY=j=>[GX+(j%COLS+.5)*CELL[0],GY+(Math.floor(j/COLS)+.5)*CELL[1]];
// where each of the 20 caught mice comes from / goes back to in the site (normalised)
const SPOTS=(()=>{const r=K.rng(808),out=[];for(let j=0;j<20;j++){const a=r()*TAU,q=.35+r()*.6;out.push([.5+Math.cos(a)*.38*q,.53+Math.sin(a)*.3*q]);}return out;})();
const MARKSET={};
function marked2(R){if(MARKSET[R])return MARKSET[R];const r=K.rng(900+R),idx=[...Array(20).keys()];
  for(let j=19;j>0;j--){const m=Math.floor(r()*(j+1));[idx[j],idx[m]]=[idx[m],idx[j]];}
  return MARKSET[R]=new Set(idx.slice(0,R));}

// ── geometry per step ──────────────────────────────────────────────────────
const FIELD=[{x:40,y:84,w:880,h:430},{x:30,y:84,w:440,h:420},{x:30,y:84,w:440,h:420},{x:30,y:84,w:440,h:420}];
const FIELD_A=[1,1,1,0];
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const vw=F=>60+clamp((F.w-440)/440)*15;

// ── drawing helpers ────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.9)',font=K.FONT}={}){
  const w=measure(c,p,size,font)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center',font);
  return{x:bx,y,w,h};
}
function badge(c,x,y,n,a){withA(c,a,()=>{circle(c,x,y,15,YELLOW,C.ink,2);c.save();c.font=MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();});}
// the mark, in picture fractions → canvas; flip mirrors x
function mark(c,x,y,w,flip,a,pop=1){
  if(a<=0)return;const h=w*VAR(),fx=f=>flip?1-f:f,X=f=>x-w/2+fx(f)*w,Y=f=>y-h/2+f*h;
  const r=Math.max(5,w*.08)*pop,lw=Math.max(3.6,w*.058)*pop;
  withA(c,a,()=>{const p0=[X(MDASH[0][0]),Y(MDASH[0][1])],p1=[X(MDASH[1][0]),Y(MDASH[1][1])];
    K.sline(c,[p0,p1],rgba(C.deep,.75),lw+3);K.sline(c,[p0,p1],PINK,lw);
    circle(c,X(MDOT[0]),Y(MDOT[1]),r+1.5,rgba(C.deep,.75),null);circle(c,X(MDOT[0]),Y(MDOT[1]),r,PINK,null);});
}
// one mouse, centre (x, y), width w
function vole(c,x,y,w,{flip=false,a=1,mk=0,pop=1}={}){
  if(a<=0)return;const h=w*VAR();
  withA(c,a,()=>{ellipse(c,x+(flip?-1:1)*w*.08,y+h*.47,w*.38,h*.07,rgba(C.deep,.4),null);
    K.at(c,VOLE,x,y,w,{flip});});
  mark(c,x,y,w,flip,a*mk,pop);
}
// a site mouse at time t: position on its lane and running direction
function fieldPos(v,F,t){
  const ln=LANES[v.li],th=v.th+ln.w*t,wob=1+.03*Math.sin(3*th+v.ph);
  const x=F.x+(ln.cx+ln.rx*wob*Math.cos(th))*F.w,y=F.y+(ln.cy+ln.ry*wob*Math.sin(th))*F.h;
  const dx=-ln.rx*Math.sin(th)*ln.w;return{x,y,flip:dx>0};
}
function fieldBase(c,F,a){withA(c,a,()=>{D.round(c,F.x,F.y,F.w,F.h,14,C.panel,C.edge);
  c.save();c.beginPath();c.roundRect(F.x,F.y,F.w,F.h,14);c.clip();c.lineCap='round';
  GRASS.forEach(([gx,gy,s,lean])=>{const x=F.x+gx*F.w,y=F.y+gy*F.h,h=10*s;
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+lean*4,y-h*.6,x+lean*8,y-h);c.strokeStyle='rgba(74,222,128,.16)';c.lineWidth=2;c.stroke();
    c.beginPath();c.moveTo(x+3,y);c.quadraticCurveTo(x+3-lean*3,y-h*.5,x+3-lean*6,y-h*.8);c.stroke();});
  c.restore();});}

// ── per-step state ─────────────────────────────────────────────────────────
const tau1=(G,tau)=>G.held&&tau>0?mod(tau,LOOP1):tau;
const REL=j=>4.0+j*.03,RELD=1.0;
const fieldMarkA=(k,tau,G)=>k===0?0:k===1?fade(tau1(G,tau),5.0,.4):1;

function scene(c,G,t){
  const {a,b,u,ta,tb}=G,F=lerpR(FIELD[a],FIELD[b],u),fa=mix(FIELD_A[a],FIELD_A[b],u),w=vw(F);
  fieldBase(c,F,fa);
  const mk=mix(fieldMarkA(a,ta,G),fieldMarkA(b,tb,G),u);
  const list=FIELD_V.map((v,i)=>({v,i,...fieldPos(v,F,t)})).sort((p,q)=>p.y-q.y);
  withA(c,fa,()=>{c.save();c.beginPath();c.roundRect(F.x,F.y,F.w,F.h,14);c.clip();
    list.forEach(p=>{const hop=Math.abs(Math.sin(t*7+p.v.ph))*3;
      vole(c,p.x,p.y-hop,w*p.v.s,{flip:p.flip,mk:FIELD_MARKED.includes(p.i)?mk:0});});c.restore();});
  return{F,w,list,fa};
}
function siteTags(c,F,a){withA(c,a,()=>{const p=tag(c,L('site','研究區','Study site'),F.x+10,F.y+10,{col:WHITE});
  tag(c,L('schematic','示意','Schematic'),p.x+p.w+8,F.y+10,{col:GREY});});}
function legend(c,F,a,t){withA(c,a,()=>{const y=F.y+F.h+8;let x=F.x+4;
  vole(c,x+22,y+20,40,{mk:1,pop:1+.08*Math.sin(t*3)});const b=tag(c,L('marked','有記號','Marked'),x+48,y,{col:PINK});
  x=b.x+b.w+16;vole(c,x+22,y+20,40,{});tag(c,L('unmarked','沒有記號','Unmarked'),x+48,y,{col:WHITE});});}
function boxBase(c,a,t,name){withA(c,a,()=>{D.round(c,BOX.x,BOX.y,BOX.w,BOX.h,18,'rgba(22,51,43,.92)',null);
  c.save();c.setLineDash([12,8]);c.lineDashOffset=-t*10;c.beginPath();c.roundRect(BOX.x,BOX.y,BOX.w,BOX.h,18);c.strokeStyle=rgba(WHITE,.8);c.lineWidth=3;c.stroke();c.restore();
  if(name)tag(c,name,BOX.x+BOX.w/2,BOX.y-20,{al:'center',col:WHITE,fill:'#16332b'});});}
function bigEq(c,s,x,y,col,a,size=46){withA(c,a,()=>text(c,s,x,y,size,col,'center',MONO));}

// ── step 0: they run ───────────────────────────────────────────────────────
const RUNS=P(`會跑，一格一格數不準`,`They run: counting by frames fails`);
const insideP=n=>P(`框內 ${n} 隻`,`${n} inside`);
function lab0(c,g,G,tau,t,a){withA(c,a,()=>{
  const p=tag(c,L('vole','田鼷鼠','Field mouse'),24,18,{col:YELLOW,active:true,size:30});
  withA(c,fade(tau,.5,.6),()=>text(c,RUNS,p.x+p.w+16,p.y+p.h/2+8,22,WHITE));
  siteTags(c,g.F,1);
  // a quadrat frame drifting over the site
  withA(c,fade(tau,.8,.6),()=>{const S=190,F=g.F,cx=F.x+F.w*(.5+.27*Math.sin(t*.31)),cy=F.y+F.h*(.5+.17*Math.sin(t*.47+1)),
    x=cx-S/2,y=cy-S/2,pu=.5+.5*Math.sin(t*2.4);
    const n=g.list.filter(q=>q.x>x&&q.x<x+S&&q.y>y&&q.y<y+S).length;
    c.fillStyle=rgba(WHITE,.07+.03*pu);c.fillRect(x,y,S,S);
    c.save();c.strokeStyle=rgba(C.deep,.7);c.lineWidth=7;c.strokeRect(x,y,S,S);c.strokeStyle=WHITE;c.lineWidth=3+pu;c.strokeRect(x,y,S,S);c.restore();
    const q=tag(c,L('quadrat','樣方','Quadrat'),x,y+S+8,{col:WHITE});
    tag(c,insideP(n),q.x+q.w+8,y+S+8,{col:YELLOW,active:true});});
});}

// ── step 1: first catch, mark, release ─────────────────────────────────────
const MARKP=P(`做記號`,`Mark`);
const IN1=j=>.2+j*.02,IND=.9,MK=j=>1.5+j*.11;
function flyIn(j,tt,t0,F){const u=smooth(clamp((tt-t0)/IND));if(u<=0)return;
  const [ex,ey]=cellXY(j),[sx,sy]=[F.x+SPOTS[j][0]*F.w,F.y+SPOTS[j][1]*F.h],x=mix(sx,ex,u),y=mix(sy,ey,u)-Math.sin(u*Math.PI)*30;
  return{x,y,a:clamp(u*2.5),flip:ex>sx};}
function lab1(c,g,G,tau,t,a){withA(c,a,()=>{
  const tt=tau1(G,tau),F=g.F;
  const p=tag(c,L('firstCatch','第一次捉','First catch'),24,18,{col:YELLOW,active:true,size:30});
  const onM=tt>=MK(0)&&tt<MK(19)+.3,onR=tt>=REL(0)&&tt<REL(19)+RELD+.3;
  const m=tag(c,MARKP,p.x+p.w+14,22,{col:PINK,active:onM});
  if(onM)glow(c,m.x+m.w/2,m.y+m.h/2,60,PINK,.25);
  const r=tag(c,L('release','放回','Release'),m.x+m.w+12,22,{col:YELLOW,active:onR});
  if(onR)glow(c,r.x+r.w/2,r.y+r.h/2,60,YELLOW,.25);
  siteTags(c,F,1);legend(c,F,1,t);
  boxBase(c,1,t,L('firstCatch','第一次捉','First catch'));
  for(let j=0;j<20;j++){
    let q;const [cx,cy]=cellXY(j);
    if(tt<IN1(j))continue;
    if(tt<IN1(j)+IND)q=flyIn(j,tt,IN1(j),F);
    else if(tt<REL(j))q={x:cx,y:cy+Math.sin(t*2.2+j)*1.2,a:1,flip:j%2===1};
    else{const u=smooth(clamp((tt-REL(j))/RELD));if(u>=1)continue;
      const [ex,ey]=[F.x+SPOTS[(j*7)%20][0]*F.w,F.y+SPOTS[(j*7)%20][1]*F.h];
      q={x:mix(cx,ex,u),y:mix(cy,ey,u)-Math.sin(u*Math.PI)*24,a:1-smooth(clamp((u-.55)/.45)),flip:false};}
    const mA=fade(tt,MK(j),.18),pop=1+.6*(1-fade(tt,MK(j),.3));
    if(tt>=MK(j)&&tt<MK(j)+.5)glow(c,q.x,q.y,40,PINK,.5*(1-fade(tt,MK(j)+.1,.4)));
    vole(c,q.x,q.y,GW,{flip:q.flip,a:q.a,mk:mA,pop});
  }
  // M = 20
  withA(c,fade(tt,1.2,.5),()=>{const y=468,s=`M = ${MM()}`;glow(c,BOX.x+BOX.w/2,y-16,90+6*Math.sin(t*1.8),PINK,.14);bigEq(c,s,BOX.x+BOX.w/2,y,PINK,1,48);});
});}

// ── step 2: second catch, count the marks ──────────────────────────────────
const LATER=P(`過一陣子`,`After a while`);
const IN2=j=>1.2+j*.03,SC=j=>3.2+j*.12;
function lab2(c,g,G,tau,t,a){withA(c,a,()=>{
  const F=g.F,R=G.R,MS=marked2(R);
  const p=tag(c,L('secondCatch','第二次捉','Second catch'),24,18,{col:YELLOW,active:true,size:30});
  withA(c,fade(tau,.1,.5),()=>{const x=p.x+p.w+18;text(c,LATER,x,p.y+p.h/2+8,24,WHITE);
    const w=measure(c,LATER,24);for(let i=0;i<3;i++){const ph=mod(t*1.4-i*.25);circle(c,x+w+14+i*16,p.y+p.h/2+2,4,rgba(WHITE,.35+.65*(ph<.5?ph*2:2-ph*2)),null);}});
  siteTags(c,F,1);legend(c,F,1,t);
  boxBase(c,fade(tau,.9,.4),t,L('secondCatch','第二次捉','Second catch'));
  const order=[...MS].sort((x,y)=>x-y);
  for(let j=0;j<20;j++){
    if(tau<IN2(j))continue;const [cx,cy]=cellXY(j);
    const q=tau<IN2(j)+IND?flyIn(j,tau,IN2(j),F):{x:cx,y:cy+Math.sin(t*2.2+j)*1.2,a:1,flip:j%2===1};
    const scan=tau>=SC(j)&&tau<SC(j)+.35;if(scan)glow(c,cx,cy,44,YELLOW,.45);
    vole(c,q.x,q.y,GW,{flip:q.flip,a:q.a,mk:MS.has(j)?1:0});
    if(MS.has(j)){const n=order.indexOf(j)+1;badge(c,cx-GW*.42,cy-GW*.3,n,fade(tau,SC(j),.2));}
  }
  // C = 20 and R = ? → R
  const done=SC(19)+.5;
  withA(c,fade(tau,2.4,.5),()=>bigEq(c,`C = ${MC()}`,BOX.x+BOX.w*.27,468,WHITE,1,44));
  withA(c,fade(tau,2.6,.5),()=>{const x=BOX.x+BOX.w*.72,y=468,on=tau>=done;
    if(on)glow(c,x,y-16,80+6*Math.sin(t*1.9),YELLOW,.2*fade(tau,done,.4));
    bigEq(c,`R = ?`,x,y,GREY,1-fade(tau,done,.3),44);bigEq(c,`R = ${R}`,x,y,YELLOW,fade(tau,done,.3),44);});
});}

// ── step 3: the estimate and the assumptions ───────────────────────────────
const SHARE=P(`有記號的比例`,`Marked share`);
const UNIT=P(`隻`,`animals`);
const NODIV=P(`不能除以 0，要重新取樣`,`Cannot divide by 0: sample again`);
const ASSUME=[P(`記號不會掉`,`Marks do not fall off`),P(`記號不影響存活與被捉的機會`,`Marks do not change survival or the chance of capture`),
  P(`放回後充分混合`,`Released animals mix in well`),P(`短時間內沒有出生、死亡、遷移`,`No births, deaths or movement in that short time`)];
const LX=40,AX=520,AW=410;
function icon(c,i,x,y,t){
  if(i===0){vole(c,x,y,58,{mk:1,pop:1+.1*Math.sin(t*3)});}
  else if(i===1){vole(c,x-20,y,44,{mk:1});vole(c,x+22,y,44,{flip:true});text(c,'=',x+1,y+9,26,YELLOW,'center',MONO);}
  else if(i===2){circle(c,x,y,28,'rgba(28,61,52,.9)',rgba(WHITE,.6),2);
    for(let d=0;d<9;d++){const an=d*2.4+t*(.6+.1*(d%3)),rr=8+(d*7)%17;circle(c,x+Math.cos(an)*rr,y+Math.sin(an)*rr,4,d%4===0?PINK:GREY,null);}}
  else{circle(c,x,y,26,'rgba(28,61,52,.9)',WHITE,2.5);const an=t*1.2;line(c,[[x,y],[x+Math.cos(an)*18,y+Math.sin(an)*18]],YELLOW,3);line(c,[[x,y],[x,y-12]],WHITE,3);circle(c,x,y,3,WHITE,null);}
}
function lab3(c,g,G,tau,t,a){withA(c,a,()=>{
  const R=G.R,Nv=R>0?MM()*MC()/R:null;
  tag(c,L('formula','N ≈ M × C ÷ R','N ≈ M × C ÷ R'),24,18,{col:YELLOW,active:true,size:30,font:MONO});
  // marked share
  withA(c,fade(tau,.3,.5),()=>{tag(c,SHARE,LX,92,{col:PINK});
    const s=`R ÷ C ≈ M ÷ N`,sz=40,y=184;text(c,s,LX,y,sz,WHITE,'left',MONO);
    const w1=measure(c,`R ÷ C`,sz,MONO),x2=LX+measure(c,`R ÷ C ≈ `,sz,MONO),w2=measure(c,`M ÷ N`,sz,MONO);
    tag(c,L('secondCatch','第二次捉','Second catch'),LX+w1/2,y+16,{al:'center',col:WHITE});
    tag(c,L('population','族群','Population'),x2+w2/2,y+16,{al:'center',col:WHITE});});
  withA(c,fade(tau,1.2,.5),()=>text(c,`${R} ÷ ${MC()} ≈ ${MM()} ÷ N`,LX,300,40,WHITE,'left',MONO));
  if(R>0){
    withA(c,fade(tau,2.0,.5),()=>text(c,`N ≈ ${MM()} × ${MC()} ÷ ${R}`,LX,368,40,WHITE,'left',MONO));
    withA(c,fade(tau,2.8,.5),()=>{const y=452,s=`= ${Nv}`;glow(c,LX+90,y-22,110+8*Math.sin(t*1.7),YELLOW,.18);
      text(c,s,LX,y,64,YELLOW,'left',MONO);const w=measure(c,s,64,MONO);text(c,UNIT,LX+w+14,y,30,YELLOW);
      const u=measure(c,UNIT,30);tag(c,L('estimate','估計','Estimate'),LX+w+u+28,y-34,{col:YELLOW});});
  }else{
    withA(c,fade(tau,2.0,.5),()=>{const s=`N ≈ ${MM()} × ${MC()} ÷ 0`,y=368;text(c,s,LX,y,40,ORANGE,'left',MONO);
      const w=measure(c,s,40,MONO);K.sline(c,[[LX-4,y-13],[LX+w+4,y-13]],ORANGE,4);});
    withA(c,fade(tau,2.8,.5),()=>{const b=tag(c,L('cannotUse','R ＝ 0：不能用這個式子','R = 0: cannot use this formula'),LX,396,{col:ORANGE,active:true,size:26});
      glow(c,b.x+b.w/2,b.y+b.h/2,b.w*.55,ORANGE,.12+.06*Math.sin(t*2));
      K.wrap(c,NODIV,LX,b.y+b.h+30,440,22,ORANGE);});
  }
  // assumptions
  withA(c,fade(tau,.6,.5),()=>tag(c,L('assumptions','假設','Assumptions'),AX,92,{col:YELLOW,active:true}));
  const lit=Math.floor(mod(t/1.6,4));
  ASSUME.forEach((p,i)=>withA(c,fade(tau,1+i*.5,.5),()=>{const y=148+i*92;
    if(i===lit)D.round(c,AX-6,y-4,AW+10,84,14,rgba(YELLOW,.08),rgba(YELLOW,.5));
    icon(c,i,AX+38,y+38,t);K.wrap(c,p,AX+86,y+32,AW-90,22,WHITE,28);}));
  withA(c,fade(tau,3.6,.5),()=>K.wrap(c,L('notCensus','估計值，不是精確普查','An estimate, not an exact census'),LX,532,880,24,ORANGE));
});}

const LABS=[lab0,lab1,lab2,lab3];
function notes(c,k,a){
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),w=measure(c,ai,22)+20;
  D.round(c,14,560,w,34,10,'rgba(11,26,21,.8)',null);text(c,ai,24,584,22,C.muted);
  withA(c,a,()=>{const cl=L('classroom','課堂用棋子模擬','Simulated with tokens in class'),w2=measure(c,cl,22)+20;
    D.round(c,CW-14-w2,560,w2,34,10,'rgba(11,26,21,.8)',null);text(c,cl,CW-24,584,22,C.muted,'right');});
}

// ── frame ──────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const RS=K.RSET||[4,2,5,0],R=RS.includes(s.R)?s.R:4;
  const st=s.rc||(s.rc={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const off=st.from>=0?MOVE:0,newTau=tau-off,oldTau=moving?st.fromTau+(t-st.T):0;
  const G={a:moving?st.from:k,b:k,u,ta:oldTau,tb:newTau,held,R};
  const g=scene(c,G,t);
  if(moving){LABS[st.from](c,g,G,oldTau,t,1-smooth(x*2.2));LABS[k](c,g,G,newTau,t,smooth((x-.55)/.45));}
  else LABS[k](c,g,G,newTau,t,1);
  const ca=k=>k===1||k===2?1:0;notes(c,k,moving?mix(ca(st.from),ca(k),u):ca(k));
}
window.EcologyDraw.recapture=draw;
})();
