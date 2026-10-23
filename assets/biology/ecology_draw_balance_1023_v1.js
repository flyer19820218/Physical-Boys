/* Ecology lesson 1 · "balance" canvas (population-balance tab, view 0), 2026-10-23.
 * The four flows of a population: births +, immigration +, deaths −, emigration −, then the net change.
 * Layout shared by all six steps (one scene, only the moving parts change):
 *   left   a grass panel (#1c3d34 + faint grass strokes) holding the field-mouse population as dots: 1 dot = 1 mouse.
 *          60 jittered slots (10 × 6, fixed seed); 40 start occupied (white chalk dots), the 20 free ones receive
 *          births (the free slots nearest the middle) and immigrants (the free slots furthest left).
 *          Thin strips beside the panel are "Outside": immigrants walk in from the left strip, emigrants leave by the right.
 *          Band under the dots: three real-size mice (EC4_vole.png 634 × 568, AI illustration, faces left) + arrow + one dot
 *          + "1 dot = 1 mouse"; in the deaths step it cross-fades to the predators EC6_snake (847 × 559),
 *          EC6_eagle (536 × 874), EC6_owl (383 × 836), each with its name. PIL: all four PNGs are opaque edge to edge in
 *          alpha (bbox 1..W-1 × 1..H-1), so they are fitted by their full size; vole feet rest at 0.87 H (y 491/568).
 *   right  a ledger: Start 40, + births, + immigration, − deaths, − emigration, = net change, End. Each row has its
 *          colour dot + arrow + name (this is also the colour legend); the current row glows yellow; values fill in
 *          step by step and count up while the dots move.
 * Six steps, 7 s each; s.shown = step.
 *  0 start: 40 white dots breathe; big "Start 40 mice".
 *  1 births: b green dots pop up in the middle (fade-in + small bounce), each with a rising green up-arrow.
 *  2 immigration: i cyan dots walk in from the left strip into free slots; cyan arrow in the strip; "From elsewhere".
 *  3 deaths: d dots turn orange, show a small down-arrow and fade to transparent (no predation shown); the band shows
 *    the three predators under "Predators"; under the panel "Causes of death: predators, disease, old age".
 *  4 emigration: e dots turn pink and walk out through the right strip; "To elsewhere".
 *  5 net change: a card over the panel: births + immigration − deaths − emigration = net (numbers per scenario),
 *    the big net (+2 green / −10 orange / 0 white), "End 42 / 30 / 40 mice", the Increase / Decrease / No change pills
 *    with the matching one lit; under it "Dots show direction, not a rate per second; scenarios are teaching examples".
 * s.sc (0, 1, 2) is read every frame; switching it restarts the clock (main program) and drops any cross-fade, so the
 * screen never mixes two scenarios. Play-all loops: every round starts again from 40 dots.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,glow,circle,ellipse,dim,stageClock,fade}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=6,PER=7,CW=960,MOVE=.8;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,PINK=C.pink,GREEN=C.green,CYAN=C.cyan,GREY='#9fb3a8',MONO=K.MONO;
const VOLE='EC4_vole.png',SNAKE='EC6_snake.png',EAGLE='EC6_eagle.png',OWL='EC6_owl.png';
const FEET=491/568;                      // vole feet line, fraction of the picture height (PIL)
const start0=()=>K.START_N||40;
const SCEN=()=>K.SCEN||[{b:12,i:4,d:8,e:6},{b:6,i:2,d:14,e:4},{b:10,i:5,d:10,e:5}];

// ── new labels (not in LAB yet) ────────────────────────────────────────────
const ONE_DOT=P(`1 點 ＝ 1 隻`,`1 dot = 1 mouse`);
const OUTSIDE=P(`外面`,`Outside`);
const FROM_ELSE=P(`從別處來`,`From elsewhere`);
const TO_ELSE=P(`到別處去`,`To elsewhere`);
const CAUSES=P(`死亡原因：天敵、疾病、衰老`,`Causes of death: predators, disease, old age`);
const NOTE=P(`亮點表示方向，不是每秒速率；情境是教學示意`,`Dots show direction, not a rate per second; scenarios are teaching examples`);
const UNIT=P(`隻`,`mice`);

// ── geometry ───────────────────────────────────────────────────────────────
const PX=106,PY=70,PW=452,PH=430;                     // grass panel
const LS={x:14,w:PX-14},RS={x:PX+PW,w:644-(PX+PW)};   // outside strips
const COLS=10,ROWS=6,SX=152,SDX=40,SY=134,SDY=32,DR=10;
const IN_X=40,OUT_X=622;                             // where immigrants start / emigrants vanish
const LX=664,LW=284,LY=74,LH=54,LG=4;                // ledger
const BAND_Y=306;

// 60 slots, 40 occupied at the start (fixed seeds, the same every time)
const SLOTS=(()=>{const r=K.rng(5023),out=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)
  out.push({x:SX+i*SDX+(r()-.5)*12+(j%2?8:-8)*.5,y:SY+j*SDY+(r()-.5)*8,ph:r()*6.283,fq:.8+r()*.6});return out;})();
const ORIG=(()=>{const r=K.rng(77),idx=[...SLOTS.keys()];for(let j=idx.length-1;j>0;j--){const m=Math.floor(r()*(j+1));[idx[j],idx[m]]=[idx[m],idx[j]];}
  return idx.slice(0,40).sort((a,b)=>a-b);})();
const FREE=[...SLOTS.keys()].filter(j=>!ORIG.includes(j));
const MID=[SX+(COLS-1)*SDX/2,SY+(ROWS-1)*SDY/2];
const DEATH_ORDER=(()=>{const r=K.rng(313),idx=[...ORIG];for(let j=idx.length-1;j>0;j--){const m=Math.floor(r()*(j+1));[idx[j],idx[m]]=[idx[m],idx[j]];}return idx;})();
// roles of every slot for scenario sc: 'orig' | 'birth' | 'imm' | 'dead' | 'emig' (gi = order inside its group)
const ROLES={};
function roles(sc){
  if(ROLES[sc])return ROLES[sc];const o=SCEN()[sc],R=SLOTS.map(()=>null);
  const byMid=[...FREE].sort((a,b)=>Math.hypot(SLOTS[a].x-MID[0],(SLOTS[a].y-MID[1])*1.4)-Math.hypot(SLOTS[b].x-MID[0],(SLOTS[b].y-MID[1])*1.4));
  const births=byMid.slice(0,o.b);
  const imm=FREE.filter(j=>!births.includes(j)).sort((a,b)=>SLOTS[a].x-SLOTS[b].x).slice(0,o.i);
  ORIG.forEach(j=>R[j]={r:'orig',gi:0});
  births.sort((a,b)=>Math.hypot(SLOTS[a].x-MID[0],SLOTS[a].y-MID[1])-Math.hypot(SLOTS[b].x-MID[0],SLOTS[b].y-MID[1])).forEach((j,g)=>R[j]={r:'birth',gi:g});
  imm.sort((a,b)=>SLOTS[a].y-SLOTS[b].y).forEach((j,g)=>R[j]={r:'imm',gi:g});
  const emig=[...ORIG].sort((a,b)=>SLOTS[b].x-SLOTS[a].x).slice(0,o.e);
  emig.sort((a,b)=>SLOTS[a].y-SLOTS[b].y).forEach((j,g)=>R[j]={r:'emig',gi:g});
  DEATH_ORDER.filter(j=>!emig.includes(j)).slice(0,o.d).forEach((j,g)=>R[j]={r:'dead',gi:g});
  return ROLES[sc]=R;
}
// timings inside a step (seconds after the step began)
const TB=g=>.7+g*.22,TI=g=>.7+g*.4,WALK_I=1.6,TD=g=>.7+g*.16,TE=g=>.7+g*.32,WALK_E=1.8;
const GRASS=(()=>{const r=K.rng(912),out=[];for(let i=0;i<170;i++)out.push([r(),r(),.4+r()*.6,(r()-.5)*.6]);return out;})();

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
const mixCol=(a,b,u)=>{const A=hexRGB(a),B=hexRGB(b);return`rgb(${A.map((v,i)=>Math.round(mix(v,B[i],u))).join(',')})`;};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.9)',font=K.FONT}={}){
  const w=measure(c,p,size,font)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center',font);
  return{x:bx,y,w,h};
}
// direction arrow glyph: 'up' | 'down' | 'right', centred at (x, y), length len
function dirArrow(c,dir,x,y,len,col,w=3.5){const h=len/2;
  if(dir==='up')K.arrow(c,x,y+h,x,y-h,col,w);else if(dir==='down')K.arrow(c,x,y-h,x,y+h,col,w);else K.arrow(c,x-h,y,x+h,y,col,w);}
const KIND={birth:{col:GREEN,dir:'up',sign:'+'},imm:{col:CYAN,dir:'right',sign:'+'},dead:{col:ORANGE,dir:'down',sign:'−'},emig:{col:PINK,dir:'right',sign:'−'}};
const fmtNet=n=>n>0?`+${n}`:n<0?`−${-n}`:'0';
const netCol=n=>n>0?GREEN:n<0?ORANGE:WHITE;

// ── one dot's state for (step k, time in step tau) ─────────────────────────
function dotAt(j,role,k,tau,t){
  const S=SLOTS[j],bx=S.x+Math.sin(t*S.fq+S.ph)*1.6,by=S.y+Math.cos(t*S.fq*1.2+S.ph)*1.3;
  const o={x:bx,y:by,a:1,col:WHITE,tint:0,kind:null,pop:1,trail:0};
  if(!role)return null;const {r,gi}=role;
  if(r==='orig')return o;
  if(r==='birth'){o.kind='birth';o.tint=1;
    if(k<1){o.a=0;return o;}if(k>1)return o;
    const f=clamp((tau-TB(gi))/.35);o.a=f;o.pop=f<1?.4+.6*f+.35*Math.sin(f*Math.PI):1;o.trail=f>0?1-clamp((tau-TB(gi)-.35)/1.2):0;return o;}
  if(r==='imm'){o.kind='imm';o.tint=1;
    if(k<2){o.a=0;o.x=IN_X;return o;}if(k>2)return o;
    const f=smooth((tau-TI(gi))/WALK_I);o.x=mix(IN_X,bx,f);o.y=by-Math.abs(Math.sin(f*Math.PI*4))*4*(f<1?1:0);
    o.a=clamp((tau-TI(gi))/.25);o.trail=f>0&&f<1?1:0;return o;}
  if(r==='dead'){
    if(k<3)return o;o.kind='dead';if(k>3){o.a=0;o.tint=1;return o;}
    const t0=TD(gi);o.tint=clamp((tau-t0)/.3);o.a=1-smooth((tau-t0-.45)/1.0);o.y+=8*(1-o.a);o.trail=o.tint*o.a;return o;}
  if(r==='emig'){
    if(k<4)return o;o.kind='emig';if(k>4){o.a=0;o.tint=1;o.x=OUT_X;return o;}
    const t0=TE(gi);o.tint=clamp((tau-t0)/.3);const f=smooth((tau-t0-.3)/WALK_E);o.x=mix(bx,OUT_X,f);
    o.y=by-Math.abs(Math.sin(f*Math.PI*5))*4*(f>0&&f<1?1:0);o.a=1-clamp((o.x-582)/40);o.trail=f>0&&f<1?1:0;return o;}
  return o;
}
// how many members of a flow have finished at (k, tau); null = not reached yet
function counted(kind,step,o,k,tau){const n={birth:o.b,imm:o.i,dead:o.d,emig:o.e}[kind];
  if(k<step)return null;if(k>step)return n;let m=0;
  for(let g=0;g<n;g++){const T=kind==='birth'?TB(g)+.2:kind==='imm'?TI(g)+WALK_I:kind==='dead'?TD(g)+.95:TE(g)+.3+WALK_E*.62;if(tau>=T)m++;}
  return m;}

function drawDot(c,d,t){
  if(!d||d.a<=0.01)return;const kd=d.kind?KIND[d.kind]:null,col=kd?mixCol(WHITE,kd.col,d.tint):WHITE;
  const br=1+.07*Math.sin(t*2.1+d.x*.05+d.y*.03),r=DR*d.pop*br;
  withA(c,d.a,()=>{
    if(kd&&d.trail>0){
      if(d.kind==='birth')withA(c,d.trail,()=>dirArrow(c,'up',d.x,d.y-DR-14-6*(1-d.trail),16,GREEN,3));
      else if(d.kind==='dead')withA(c,d.trail,()=>dirArrow(c,'down',d.x,d.y+DR+14,16,ORANGE,3));
      else withA(c,d.trail*.8,()=>K.sline(c,[[d.x-34,d.y],[d.x-DR-3,d.y]],rgba(kd.col,.6),4));}
    circle(c,d.x,d.y,r+1.5,rgba(C.deep,.8),null);circle(c,d.x,d.y,r,col,null);
    if(kd&&d.tint>.5){c.save();c.globalAlpha*=clamp((d.tint-.5)*2);dirArrow(c,kd.dir,d.x,d.y,11,C.deep,2.2);c.restore();}
  });
}

// ── scene parts ────────────────────────────────────────────────────────────
function panelBase(c,t,k,la=1){
  D.round(c,PX,PY,PW,PH,14,C.panel,C.edge);
  c.save();c.beginPath();c.roundRect(PX,PY,PW,PH,14);c.clip();c.lineCap='round';
  GRASS.forEach(([gx,gy,s,lean])=>{const x=PX+gx*PW,y=PY+gy*PH,h=10*s,sw=Math.sin(t*1.1+gx*9)*1.2;
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+lean*4,y-h*.6,x+lean*8+sw,y-h);c.strokeStyle='rgba(74,222,128,.16)';c.lineWidth=2;c.stroke();});
  c.restore();
  // outside strips
  [LS,RS].forEach(sp=>{c.save();c.setLineDash([6,8]);D.round(c,sp.x+3,PY,sp.w-6,PH,12,'rgba(11,26,21,.35)',rgba(GREY,.35));c.restore();
    withA(c,la,()=>text(c,OUTSIDE,sp.x+sp.w/2,PY+PH-18,22,GREY,'center'));});
}
function header(c){
  const a=tag(c,L('vole','田鼷鼠','Field mouse'),PX+10,PY+8,{col:YELLOW});
  tag(c,L('population','族群','Population'),a.x+a.w+8,PY+8,{col:WHITE});
}
function stripArrow(c,k,w,t){
  if(w<=0)return;
  const y=SY+SDY*2.5,dash=-t*30;
  if(k===2)withA(c,w,()=>{c.save();c.setLineDash([10,8]);c.lineDashOffset=dash;K.line(c,[[LS.x+10,y],[PX+18,y]],rgba(CYAN,.85),4);c.restore();K.arrow(c,PX-6,y,PX+22,y,CYAN,4);});
  if(k===4)withA(c,w,()=>{c.save();c.setLineDash([10,8]);c.lineDashOffset=dash;K.line(c,[[PX+PW-20,y],[RS.x+RS.w-30,y]],rgba(PINK,.85),4);c.restore();K.arrow(c,RS.x+RS.w-40,y,RS.x+RS.w-14,y,PINK,4);});
}
function vole(c,x,y,w,a=1){withA(c,a,()=>{const h=w*dim(VOLE)[1]/dim(VOLE)[0];
  ellipse(c,x+w*.06,y-h/2+h*FEET+2,w*.36,h*.06,rgba(C.deep,.45),null);K.at(c,VOLE,x,y,w);});}
function bandVoles(c,t,a){withA(c,a,()=>{
  const cy=BAND_Y+92,w=58;
  [PX+40,PX+98,PX+156].forEach((x,i)=>vole(c,x,cy-Math.abs(Math.sin(t*2.2+i*1.7))*3,w));
  const ax=PX+188;K.arrow(c,ax,cy,ax+32,cy,WHITE,3.5);
  const dx=ax+48;circle(c,dx,cy,DR+1.5,rgba(C.deep,.8),null);circle(c,dx,cy,DR*(1+.08*Math.sin(t*2.4)),WHITE,null);
  tag(c,ONE_DOT,dx+DR+12,cy-20,{col:WHITE});
  K.text(c,L('vole','田鼷鼠','Field mouse'),PX+98,cy+62,22,GREY,'center');
  tag(c,L('schematic','示意','Schematic'),PX+PW-10,PY+PH-48,{al:'right',col:GREY});
});}
function bandPredators(c,t,a){withA(c,a,()=>{
  tag(c,L('predators','天敵','Predators'),PX+12,BAND_Y+2,{col:ORANGE});
  [[SNAKE,'snake','黑眉錦蛇','Black-browed ratsnake'],[EAGLE,'eagle','大冠鷲','Crested serpent eagle'],[OWL,'owl','領角鴞','Collared scops owl']].forEach(([f,key,zh,en],i)=>{
    const y=BAND_Y+70+i*50+Math.sin(t*1.6+i*2)*1.2;
    K.place(c,f,PX+16,y-22,70,44);
    text(c,L(key,zh,en),PX+100,y+8,22,WHITE);
  });
  tag(c,L('schematic','示意','Schematic'),PX+PW-10,PY+PH-48,{al:'right',col:GREY});
});}

// ── ledger ─────────────────────────────────────────────────────────────────
function ledger(c,k,tau,o,t,wOf){
  const net=o.b+o.i-o.d-o.e,end=start0()+net;
  const rows=[
    {name:L('start','期初','Start'),val:String(start0()),step:0},
    {name:L('births','出生','Births'),kind:'birth',step:1},
    {name:L('immigration','遷入','Immigration'),kind:'imm',step:2},
    {name:L('deaths','死亡','Deaths'),kind:'dead',step:3},
    {name:L('emigration','遷出','Emigration'),kind:'emig',step:4},
    {name:L('net','淨變化','Net change'),sign:'=',step:5,net:true},
    {name:L('end','期末','End'),step:5,end:true}];
  rows.forEach((r,j)=>{
    const y=LY+j*(LH+LG)+(j>=5?14:0),hl=wOf(r.step),pu=.5+.5*Math.sin(t*3);
    D.round(c,LX,y,LW,LH,12,'#16332b',C.edge);
    if(hl>0)withA(c,hl,()=>{D.round(c,LX,y,LW,LH,12,rgba(YELLOW,.12+.08*pu),null);c.save();c.lineWidth=3;c.strokeStyle=YELLOW;c.beginPath();c.roundRect(LX,y,LW,LH,12);c.stroke();c.restore();});
    const by=y+LH/2+8;let nx=LX+14;
    if(r.kind){const kd=KIND[r.kind];text(c,kd.sign,LX+10,by+2,28,kd.col,'left',MONO);
      circle(c,LX+40,y+LH/2,9,kd.col,null);dirArrow(c,kd.dir,LX+58,y+LH/2,18,kd.col,3);nx=LX+72;}
    else if(r.sign){text(c,r.sign,LX+10,by+2,28,YELLOW,'left',MONO);nx=LX+40;}
    text(c,r.name,nx,by,22,r.kind?KIND[r.kind].col:WHITE);
    // value
    let v=null,col=WHITE,a=1;
    if(r.step===0)v=r.val;
    else if(r.kind){const n=counted(r.kind,r.step,o,k,tau);if(n!=null){v=String(n);col=KIND[r.kind].col;}}
    else if(k===5){if(r.net){v=fmtNet(net);col=netCol(net);a=fade(tau,2.0,.4);}else{v=String(end);col=YELLOW;a=fade(tau,2.6,.4);}}
    const vx=LX+LW-14;
    if(v==null||a<1)withA(c,v==null?1:1-a,()=>text(c,'?',vx,by+2,30,GREY,'right',MONO));
    if(v!=null)withA(c,a,()=>text(c,v,vx,by+2,30,col,'right',MONO));
  });
  // separator before the result rows
  const sy=LY+5*(LH+LG)+5;K.line(c,[[LX+10,sy],[LX+LW-10,sy]],rgba(WHITE,.5),2);
}

// ── top bar per step ───────────────────────────────────────────────────────
function topBar(c,j,o,a,t){withA(c,a,()=>{
  const net=o.b+o.i-o.d-o.e,cols=[YELLOW,GREEN,CYAN,ORANGE,PINK,YELLOW];
  const names=[L('start','期初','Start'),L('births','出生','Births'),L('immigration','遷入','Immigration'),L('deaths','死亡','Deaths'),L('emigration','遷出','Emigration'),L('net','淨變化','Net change')];
  const p=tag(c,names[j],14,12,{col:cols[j],active:true,size:30});
  glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.6,cols[j],.12+.06*Math.sin(t*2.2));
  let x=p.x+p.w+16;const by=p.y+p.h/2+15;
  if(j===0){text(c,String(start0()),x,by+2,44,WHITE,'left',MONO);x+=measure(c,String(start0()),44,MONO)+10;text(c,UNIT,x,by,30,WHITE);return;}
  if(j===5)return;
  const kd=KIND[['','birth','imm','dead','emig'][j]],n=[0,o.b,o.i,o.d,o.e][j],bob=Math.sin(t*3)*3;
  dirArrow(c,kd.dir,x+16+(kd.dir==='right'?bob:0),p.y+p.h/2+(kd.dir!=='right'?(kd.dir==='up'?-bob:bob):0),30,kd.col,5);x+=44;
  const s=`${kd.sign}${n}`;text(c,s,x,by+2,44,kd.col,'left',MONO);x+=measure(c,s,44,MONO)+10;text(c,UNIT,x,by,30,kd.col);x+=measure(c,UNIT,30)+18;
  if(j===2)text(c,FROM_ELSE,x,by-2,22,WHITE);
  if(j===4)text(c,TO_ELSE,x,by-2,22,WHITE);
});}

// ── step 5 card ────────────────────────────────────────────────────────────
function netCard(c,o,tau,t,a){withA(c,a,()=>{
  const net=o.b+o.i-o.d-o.e,end=start0()+net,X0=14,X1=644,cx=(X0+X1)/2;
  D.round(c,X0,PY,X1-X0,PH,16,'rgba(11,26,21,.96)',rgba(YELLOW,.6));
  const terms=[[String(o.b),L('births','出生','Births'),GREEN],[String(o.i),L('immigration','遷入','Immigration'),CYAN],
    [String(o.d),L('deaths','死亡','Deaths'),ORANGE],[String(o.e),L('emigration','遷出','Emigration'),PINK],[fmtNet(net),L('net','淨變化','Net change'),netCol(net)]];
  // numbers on one line; names alternate below (births, deaths, net) and above (immigration, emigration),
  // so long English names never collide with their neighbours
  const ops=['+','−','−','='],NS=46,opW=measure(c,'=',NS,MONO)+22;
  const nw=terms.map(([n])=>measure(c,n,NS,MONO)),mw=terms.map(([,nm])=>measure(c,nm,22));
  const cxs=[0];
  for(let i=1;i<5;i++){let d=nw[i-1]/2+opW+nw[i]/2;
    if(i>=2)d=Math.max(d,(mw[i-2]+mw[i])/2+18-(cxs[i-1]-cxs[i-2]));cxs.push(cxs[i-1]+d);}
  const left=Math.min(...cxs.map((v,i)=>v-Math.max(nw[i],mw[i])/2)),right=Math.max(...cxs.map((v,i)=>v+Math.max(nw[i],mw[i])/2)),sh=cx-(left+right)/2;
  const ny=PY+122;
  terms.forEach(([n,nm,col],i)=>{const cxi=cxs[i]+sh,fa=fade(tau,.3+i*.35,.4);
    withA(c,fa,()=>{if(i===4)glow(c,cxi,ny-16,60+5*Math.sin(t*2),col,.18);text(c,n,cxi,ny,NS,col,'center',MONO);
      text(c,nm,cxi,i%2?ny-56:ny+36,22,col,'center');});
    if(i<4)withA(c,fade(tau,.45+i*.35,.4),()=>text(c,ops[i],(cxs[i]+cxs[i+1])/2+sh+(nw[i]-nw[i+1])/4,ny,NS,WHITE,'center',MONO));
  });
  // big net + end
  withA(c,fade(tau,2.0,.5),()=>{const s=fmtNet(net),y=PY+246,sw=measure(c,s,84,MONO),uw=measure(c,UNIT,30),bx=cx-(sw+12+uw)/2;
    glow(c,cx,y-28,120+8*Math.sin(t*1.7),netCol(net),.16);text(c,s,bx,y,84,netCol(net),'left',MONO);text(c,UNIT,bx+sw+12,y,30,netCol(net));});
  withA(c,fade(tau,2.6,.5),()=>{const y=PY+290,lab=L('end','期末','End'),es=String(end);
    const lw=measure(c,lab,22)+28,ew=measure(c,es,40,MONO),uw=measure(c,UNIT,26),tw=lw+14+ew+10+uw,bx=cx-tw/2;
    tag(c,lab,bx,y+2,{col:YELLOW,active:true});text(c,es,bx+lw+14,y+36,40,YELLOW,'left',MONO);text(c,UNIT,bx+lw+14+ew+10,y+34,26,YELLOW);});
  withA(c,fade(tau,3.1,.5),()=>{const ps=[[L('increase','增加','Increase'),GREEN,net>0],[L('decrease','減少','Decrease'),ORANGE,net<0],[L('unchanged','不變','No change'),WHITE,net===0]];
    const ws=ps.map(([p])=>measure(c,p,22)+28),gap=14,tw=ws.reduce((s,v)=>s+v,0)+gap*2;let x=cx-tw/2;const y=PY+362;
    ps.forEach(([p,col,on],i)=>{if(on){const u=mod(t*.8);D.round(c,x-8*u,y-8*u,ws[i]+16*u,40+16*u,20+8*u,null,rgba(col,.9*(1-u)));}tag(c,p,x,y,{col:on?col:GREY,active:on});x+=ws[i]+gap;});});
});}

// ── frame ──────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const sc=[0,1,2].includes(s.sc)?s.sc:0,o=SCEN()[sc],R=roles(sc);
  const st=s.bl||(s.bl={});
  if(st.k===undefined||st.sc!==sc){st.k=k;st.from=-1;st.T=t-9;st.sc=sc;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1,oldTau=moving?st.fromTau+(t-st.T):0;
  const wOf=j=>moving?(j===st.from?1-u:0)+(j===k?u:0):(j===k?1:0);

  const w5=wOf(5);
  panelBase(c,t,k,1-w5);
  stripArrow(c,2,wOf(2),t);stripArrow(c,4,wOf(4),t);
  // dots (blended between the previous and the current step while switching)
  const list=[];
  SLOTS.forEach((S,j)=>{const role=R[j];if(!role)return;
    const b=dotAt(j,role,k,tau,t);
    if(moving){const a=dotAt(j,role,st.from,oldTau,t);
      const m={x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),a:mix(a.a,b.a,u),pop:mix(a.pop,b.pop,u),trail:mix(a.trail,b.trail,u),
        kind:b.kind||a.kind,tint:b.kind?(a.kind===b.kind?mix(a.tint,b.tint,u):b.tint*u):a.tint*(1-u)};
      list.push(m);}else list.push(b);});
  c.save();c.beginPath();c.rect(LS.x,PY,RS.x+RS.w-LS.x,PH);c.clip();list.forEach(d=>drawDot(c,d,t));c.restore();
  // labels under the step-5 card are faded out with it, so nothing is drawn hidden
  withA(c,1-w5,()=>header(c));
  const wp=wOf(3);bandVoles(c,t,(1-wp)*(1-w5));bandPredators(c,t,wp);
  ledger(c,k,tau,o,t,wOf);
  for(let j=0;j<N;j++){const w=wOf(j);if(w>0)topBar(c,j,o,w,t);}
  // under the panel
  withA(c,wOf(3),()=>K.wrap(c,CAUSES,20,534,920,22,ORANGE));
  // step 5 card
  if(w5>0)netCard(c,o,k===5?tau:0,t,w5);
  withA(c,w5,()=>K.wrap(c,NOTE,20,534,920,22,C.muted));
  // AI note
  withA(c,1-w5,()=>{const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),w=measure(c,ai,22)+20;
    D.round(c,14,560,w,34,10,'rgba(11,26,21,.8)',null);text(c,ai,24,584,22,C.muted);});
}
window.EcologyDraw.balance=draw;
})();
