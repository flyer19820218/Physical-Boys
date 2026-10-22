/* Plants · "Sort four plants" canvas (groups tab, view 1), 2026-10-22.
 * One plant per step: 0 liverwort (bryophyte), 1 sword fern (fern), 2 pine (gymnosperm), 3 orange (angiosperm).
 * Left: the plant (teacher's Gemini AI illustration, aspect kept, swaying gently about its base), its name,
 *   and a "my guess" card that answers s.guess (-1 none, 0..3 = bryophyte, fern, gymnosperm, angiosperm).
 * Right: a three-gate key drawn here: Gate 1 "vascular tissue?" (no → bryophytes), Gate 2 "seeds?" (no → ferns),
 *   Gate 3 "seeds wrapped in a fruit?" (no → gymnosperms, yes → angiosperms). The four class boxes are always shown.
 *   A ball carrying a thumbnail of the plant leaves the top, slips through each gate it reaches (it passes under the
 *   gate box) and an evidence badge appears under every gate it has passed. Vascular tissue cannot be seen in a
 *   picture, so the Gate 1 badge says it is known from the structure (sections), never "seen in the picture".
 *   The liverwort stops at Gate 1: Gates 2 and 3 dim and a dashed note says "no seeds either: no need to ask".
 * Guess feedback (colours as in the rest of the lesson: judged class = yellow, wrong guess = orange, right = green):
 *   no guess: the judging plays and the ball lands on the answer (yellow), lit path in yellow;
 *   right guess: the same path lights green and the answer box turns green with a tick;
 *   wrong guess: the guessed box flashes orange with a cross; the ball stops above the gate the page hint points to
 *   (GRP_HINT in plants_diversity_1022_v1.js) with a pulsing "?"; the answer is not revealed.
 * Idle: the picture sways, lights run along the lit path, the ball bobs, boxes and gates pulse.
 * Step changes cross-fade (0.8 s): the old plant, badges and ball fade out, then the new ones fade in.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,clamp,mix,mod,ease,smooth,rgba,line,circle,text,measure,glow,dashed,stageClock,fitRect,drawIn,pic,AI,SIZE,TAU}=K;
const LAB=()=>K.LAB||{};
const N=4,PER=11;
const YEL=C.yellow,GRN=C.green,ORG=C.orange;
const isEn=()=>D.tr([0,1])===1;

// ── plants ─────────────────────────────────────────────────────────────────
// crop = square part of the picture used for the thumbnail on the ball (fractions of the picture)
// pivot = where the plant is "attached" (fractions), it sways about this point
const PL=[
 {f:'liverwort.png',name:'liverwort',def:P(`地錢`,`Liverwort`),ans:0,crop:[.2,0,.6,.86],pivot:[.5,.95],amp:.010},
 {f:'sword_fern.png',name:'swordFern',def:P(`腎蕨`,`Sword fern`),ans:1,crop:[.03,0,.94,1],pivot:[.5,.95],amp:.016},
 {f:'pine_branch.png',name:'pine',def:P(`松`,`Pine`),ans:2,crop:[.16,.1,.24,.45],pivot:[0,.45],amp:.012},
 {f:'orange_whole.png',name:'orange',def:P(`橘子`,`Orange`),ans:3,crop:[0,0,1,1],pivot:[.5,.05],amp:.022}];
// evidence badges: ev[i] = badge under gate i, a list of [text, colour] rows
const VAS_NOTE=P(`看不見，要靠切片（由構造得知）`,`Not visible: known from sections`);
const EV=[
 [[[P(`沒有維管束`,`No vascular tissue`),C.white],[VAS_NOTE,C.muted]]],
 [[[P(`有維管束`,`Has vascular tissue`),C.white],[VAS_NOTE,C.muted]],
  [[P(`用孢子繁殖・沒有種子`,`Spores, no seeds`),C.white]]],
 [[[P(`有維管束`,`Has vascular tissue`),C.white],[VAS_NOTE,C.muted]],
  [[P(`有種子`,`Has seeds`),C.white]],
  [[P(`種子露在鱗片上・毬果不是果實`,`Seeds bare on scales; a cone is not a fruit`),C.white]]],
 [[[P(`有維管束`,`Has vascular tissue`),C.white],[VAS_NOTE,C.muted]],
  [[P(`有種子`,`Has seeds`),C.white]],
  [[P(`種子包在果實裡`,`Seeds inside a fruit`),C.white]]]];
const SKIP=P(`沒有種子，也不必再問`,`No seeds either: no need to ask`);
// the gate that the page hint (GRP_HINT) talks about, for a wrong guess
const HINT_GATE=[0,1,2,2];

// ── line breaking (Chinese after 、：，；。・, English at spaces) ──────────────
function wrapRows(c,str,w,size=22){
  c.save();c.font=K.FONT(size);const fits=s=>c.measureText(s).width<=w,rows=[];let row='';
  const zh=/[一-鿿]/.test(str),chunks=zh?(str.match(/[^、：，；。・]+[、：，；。・]?/g)||[str]):str.split(/(?<=\s)/);
  for(const ch of chunks){
    if(row&&!fits(row+ch.trimEnd())){rows.push(row.trimEnd());row='';}
    if(!fits(ch.trimEnd())&&zh){for(const g of Array.from(ch)){if(row&&!fits(row+g)&&!/[、：，；。・）」]/.test(g)){rows.push(row);row='';}row+=g;}}
    else row+=ch;}
  if(row.trim())rows.push(row.trimEnd());c.restore();return rows;
}
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(seg=>wrapRows(c,seg,w,size));
function outline(c,x,y,w,h,r,color,lw=3,dash=null){c.save();if(dash)c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function rpulse(c,x,y,w,h,t,color,r=12){const u=mod(t*.8);outline(c,x-u*9,y-u*9,w+u*18,h+u*18,r+u*5,rgba(color,.9*(1-u)),3);}
function sweep(c,x,y,w,h,t,r=12,a=.18,speed=.45){c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();const sx=x-60+mod(t*speed,1)*(w+120),g=c.createLinearGradient(sx-50,0,sx+50,0);g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,a));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(sx-50,y,100,h);c.restore();}
function tick(c,x,y,r,color){circle(c,x,y,r,color,C.ink,2);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.48,y-r*.36);c.stroke();c.restore();}
function cross(c,x,y,r,color){circle(c,x,y,r,color,C.ink,2);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.beginPath();c.moveTo(x-r*.38,y-r*.38);c.lineTo(x+r*.38,y+r*.38);c.moveTo(x+r*.38,y-r*.38);c.lineTo(x-r*.38,y+r*.38);c.stroke();c.restore();}
function num(c,x,y,n,color){circle(c,x,y,15,color,C.ink,2);c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// a text box of fixed width; rows centred; returns its height for (c, p, w)
const boxH=(c,p,w)=>rowsOf(c,p,w-28).length*29+17;
function textBox(c,p,x,y,w,h,{fill='rgba(11,26,21,.94)',stroke=rgba(C.white,.7),col=C.white,lw=2}={}){
  D.round(c,x,y,w,h,12,fill,null);outline(c,x,y,w,h,12,stroke,lw);
  const rows=rowsOf(c,p,w-28);rows.forEach((r,i)=>text(c,r,x+w/2,y+h/2+8+(i-(rows.length-1)/2)*29,22,col,'center'));
}
// an evidence badge: rows of [text, colour]; returns {w,h,rows}
function badgeRows(c,lines,maxW){const out=[];lines.forEach(([p,col])=>rowsOf(c,p,maxW-28).forEach(r=>out.push([r,col])));
  const w=Math.max(...out.map(([r])=>measure(c,r,22)))+28;return{w,h:out.length*29+11,rows:out};}
function badge(c,lines,x,y,maxW,a,{dash=false,border=rgba(C.white,.75)}={}){
  if(a<=0)return;const b=badgeRows(c,lines,maxW);
  c.save();c.globalAlpha*=a;
  D.round(c,x,y,b.w,b.h,14,'rgba(11,26,21,.94)',null);outline(c,x,y,b.w,b.h,14,border,2,dash?[7,5]:null);
  b.rows.forEach(([r,col],i)=>text(c,r,x+14,y+5+22*.9+i*29,22,col));
  c.restore();
}

// ── layout ─────────────────────────────────────────────────────────────────
const LP={x:20,y:20,w:290,h:560},RP={x:320,y:20,w:620,h:560};
const GX0=372,GW=240,GX=GX0+GW/2,CX0=744,CWD=186,LX=700;   // gate boxes, class boxes, landing spot of the ball
const ROWS=[92,236,380,524];                                  // centre line of each row (gates 1..3, then angiosperms)
const BX=GX+24;                                               // left edge of the evidence badges (right of the yes line)
let LAY=null;
function layout(c){
  const key=isEn()?'en':'zh';if(LAY&&LAY.key===key)return LAY;
  const L=LAB(),G=[L.gate1||P(`有維管束嗎？`,`Vascular tissue?`),L.gate2||P(`有種子嗎？`,`Seeds?`),L.gate3||P(`種子有果實包著嗎？`,`Seeds wrapped in a fruit?`)];
  const CL=[L.bryophyte||P(`蘚苔植物`,`Bryophytes`),L.fern||P(`蕨類`,`Ferns`),L.gymno||P(`裸子植物`,`Gymnosperms`),L.angio||P(`被子植物`,`Angiosperms`)];
  const gates=G.map((p,i)=>{const h=Math.max(46,boxH(c,p,GW));return{p,x:GX0,y:ROWS[i]-h/2,w:GW,h};});
  const cls=CL.map((p,i)=>{const h=Math.max(46,boxH(c,p,CWD));return{p,x:CX0,y:ROWS[i]-h/2,w:CWD,h};});
  // gap under gate i: from its bottom to the top of the next gate (or of the angiosperm box)
  const gaps=gates.map((g,i)=>({y0:g.y+g.h,y1:i<2?gates[i+1].y:cls[3].y}));
  const SY=gates[0].y-24;
  const A=gates.map(g=>[GX,g.y-22]),Cc=ROWS.map(y=>[GX,y]),Nn=ROWS.map(y=>[LX,y]);
  return LAY={key,gates,cls,gaps,S:[GX,SY],A,Cc,Nn};
}

// ── the ball's journey for plant k: segments, gate times, badge times, landing ──
// stopAt = gate index where the ball waits (wrong guess), or -1 for the full judgement
function journey(Ly,k,stopAt){
  const a=PL[k].ans,segs=[],ask=[],badgeT=[],trail=[Ly.S];let T=.7,land=null,wait=null;
  const add=(p0,p1,d)=>{segs.push({p0,p1,t0:T,t1:T+d});T+=d;trail.push(p1);};
  add(Ly.S,Ly.A[0],.7);
  for(let i=0;i<3;i++){
    ask[i]=T;
    if(stopAt===i){wait=T;break;}
    T+=.55;add(Ly.A[i],Ly.Cc[i],.3);badgeT[i]=T;T+=.6;
    if(i<a){if(i<2)add(Ly.Cc[i],Ly.A[i+1],.5);else{add(Ly.Cc[2],Ly.Cc[3],.5);add(Ly.Cc[3],Ly.Nn[3],.5);land=T;break;}}
    else{add(Ly.Cc[i],Ly.Nn[i],.7);land=T;break;}
  }
  return{segs,ask,badgeT,land,wait,trail,end:T};
}
function ballAt(J,lt){
  if(lt<=J.segs[0].t0)return J.segs[0].p0;
  for(const sg of J.segs){if(lt<sg.t1)return lt<sg.t0?sg.p0:K.lerpP(sg.p0,sg.p1,smooth((lt-sg.t0)/(sg.t1-sg.t0)));}
  return J.segs[J.segs.length-1].p1;
}
// distance travelled along the trail polyline at time lt (for the lit path)
function trailLen(J,lt){let d=0;for(const sg of J.segs){const L=Math.hypot(sg.p1[0]-sg.p0[0],sg.p1[1]-sg.p0[1]);if(lt>=sg.t1)d+=L;else if(lt>sg.t0){d+=L*smooth((lt-sg.t0)/(sg.t1-sg.t0));break;}else break;}return d;}
function polyUpTo(pts,d){const out=[pts[0]];let acc=0;for(let i=1;i<pts.length;i++){const L=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc+L<=d){out.push(pts[i]);acc+=L;}else{if(L>0)out.push(K.lerpP(pts[i-1],pts[i],(d-acc)/L));break;}}return out;}
function polyAt(pts,d){let acc=0;for(let i=1;i<pts.length;i++){const L=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc+L>=d)return K.lerpP(pts[i-1],pts[i],L?(d-acc)/L:0);acc+=L;}return pts[pts.length-1];}
const polyLen=pts=>pts.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0);

// ── pictures ───────────────────────────────────────────────────────────────
function plantPic(c,k,t,a){
  const p=PL[k],r=fitRect(p.f,LP.x+14,86,LP.w-28,218),px=r.x+p.pivot[0]*r.w,py=r.y+p.pivot[1]*r.h;
  const ang=p.amp*Math.sin(t*1.1+k)+p.amp*.35*Math.sin(t*2.3+k*2);
  c.save();c.globalAlpha*=a;
  glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.6,C.white,.06+.03*Math.sin(t*1.7));
  c.translate(px,py);c.rotate(ang);c.translate(-px,-py);
  drawIn(c,p.f,r);c.restore();
}
function thumbBall(c,k,x,y,r,a,ring){
  if(a<=0)return;const p=PL[k],im=pic(AI+p.f);
  c.save();c.globalAlpha*=a;
  circle(c,x,y,r+3,C.deep,null);
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.fillStyle='#2a5446';c.fillRect(x-r,y-r,2*r,2*r);
  if(im){const [W,H]=SIZE[p.f],cr=p.crop;c.drawImage(im,cr[0]*W,cr[1]*H,cr[2]*W,cr[3]*H,x-r,y-r,2*r,2*r);}
  c.restore();circle(c,x,y,r,null,ring,3);c.restore();
}

// ── static key (always shown) ──────────────────────────────────────────────
function keyFrame(c,Ly,t){
  const L=LAB(),dim=rgba(C.white,.38);
  // connectors: start → gate 1, yes lines down, no lines across, gate 3 → angiosperms
  line(c,[Ly.S,[GX,Ly.gates[0].y]],dim,3);
  for(let i=0;i<3;i++){const g=Ly.gates[i],cl=Ly.cls[i];
    K.arrow(c,g.x+g.w,ROWS[i],cl.x-4,ROWS[i],dim,3);
    if(i<2)K.arrow(c,GX,g.y+g.h,GX,Ly.gates[i+1].y-2,dim,3);}
  line(c,[[GX,Ly.gates[2].y+Ly.gates[2].h],[GX,ROWS[3]]],dim,3);K.arrow(c,GX,ROWS[3],Ly.cls[3].x-4,ROWS[3],dim,3);
  circle(c,GX,ROWS[3],5,dim,null);
  // branch words: "no" under each across-arrow, "yes" left of each down line
  for(let i=0;i<3;i++){
    text(c,L.no||P(`沒有`,`No`),Ly.gates[i].x+Ly.gates[i].w+10,ROWS[i]+28,22,C.muted);
    const gp=Ly.gaps[i];text(c,L.yes||P(`有`,`Yes`),GX-16,(gp.y0+gp.y1)/2+8,22,C.muted,'right');}
  // header
  text(c,P(`三道關，分四類`,`Three gates, four groups`),RP.x+16,566,24,YEL);
}
function gatesDraw(c,Ly,st,t){
  Ly.gates.forEach((g,i)=>{const s=st[i];
    c.save();c.globalAlpha*=mix(1,.32,s.dim);
    textBox(c,g.p,g.x,g.y,g.w,g.h,{stroke:s.ask>0?YEL:rgba(C.white,.7),col:C.white,lw:s.ask>0?3:2});
    num(c,GX0-22,ROWS[i],i+1,s.ask>.3?YEL:C.white);
    c.restore();
    if(s.ask>0){c.save();c.globalAlpha*=s.ask;sweep(c,g.x,g.y,g.w,g.h,t);rpulse(c,g.x,g.y,g.w,g.h,t,YEL);c.restore();}
  });
}
// class boxes: st[i] = {judge: 0..1 (yellow), right: 0..1 (green), wrong: 0..1 (orange flash), pick: 0..1 (dashed "your guess")}
function classDraw(c,Ly,st,t){
  Ly.cls.forEach((b,i)=>{const s=st[i];
    let fill='rgba(11,26,21,.94)',stroke=rgba(C.white,.75),col=C.white,lw=2;
    const fl=.5+.5*Math.sin(t*6.5);
    if(s.wrong>0){fill=rgba(ORG,(.18+.5*fl)*s.wrong);stroke=ORG;lw=3;}
    if(s.judge>0){fill=rgba(YEL,.12+.88*s.judge);if(s.judge>.5){stroke=C.white;col=C.deep;lw=3;}}
    if(s.right>0){fill=rgba(GRN,.12+.88*s.right);if(s.right>.5){stroke=C.white;col=C.deep;lw=3;}}
    D.round(c,b.x,b.y,b.w,b.h,12,'rgba(11,26,21,.94)',null);
    textBox(c,b.p,b.x,b.y,b.w,b.h,{fill,stroke,col,lw});
    if(s.pick>0&&s.judge<=0&&s.right<=0&&s.wrong<=0){c.save();c.globalAlpha*=s.pick;outline(c,b.x-5,b.y-5,b.w+10,b.h+10,15,rgba(C.white,.8),2,[7,5]);c.restore();}
    if(s.judge>.5){glow(c,b.x+b.w/2,b.y+b.h/2,b.w*.6,YEL,(.14+.08*Math.sin(t*3))*s.judge);rpulse(c,b.x,b.y,b.w,b.h,t,YEL);}
    if(s.right>.5){glow(c,b.x+b.w/2,b.y+b.h/2,b.w*.6,GRN,(.16+.08*Math.sin(t*3))*s.right);rpulse(c,b.x,b.y,b.w,b.h,t,GRN);c.save();c.globalAlpha*=s.right;tick(c,b.x+b.w-2,b.y+2,12,GRN);c.restore();}
    if(s.wrong>0){c.save();c.globalAlpha*=s.wrong;rpulse(c,b.x,b.y,b.w,b.h,t*1.3,ORG);cross(c,b.x+b.w-2,b.y+2,12,ORG);c.restore();}
  });
}

// ── state of one step at local time lt ─────────────────────────────────────
function stepState(c,k,lt,g){
  const Ly=layout(c),ans=PL[k].ans,mode=g<0?'none':g===ans?'right':'wrong';
  const J=journey(Ly,k,mode==='wrong'?HINT_GATE[k]:-1);
  return{k,lt,g,mode,J,Ly};
}
function gateStates(S){
  const {J,k,lt,mode}=S,a=PL[k].ans;
  return [0,1,2].map(i=>{
    let ask=0;if(J.ask[i]!=null){const t0=J.ask[i],t1=J.badgeT[i]!=null?J.badgeT[i]:1e9;ask=clamp((lt-t0)/.3)*(lt<t1?1:clamp(1-(lt-t1)/.4));}
    const dim=a===0&&i>0&&mode!=='wrong'&&J.land!=null?ease((lt-J.land-.2)/.6):0;
    return{ask,dim};});
}
function classStates(S){
  const {J,k,lt,mode,g}=S,a=PL[k].ans,land=J.land!=null?ease((lt-J.land)/.45):0;
  return [0,1,2,3].map(i=>({judge:mode==='none'&&i===a?land:0,right:mode==='right'&&i===a?land:0,
    wrong:mode==='wrong'&&i===g?ease(lt/.4):0,pick:mode==='right'&&i===g?ease(lt/.4):0}));
}

// ── moving layer of one step (picture, trail, badges, ball, guess card) ─────
function stepLayer(c,S,t,a){
  if(a<=0)return;
  const {J,k,lt,mode,Ly}=S,col=mode==='right'?GRN:mode==='wrong'?C.white:YEL;
  c.save();c.globalAlpha*=a;
  // lit trail
  const d=trailLen(J,lt),pts=polyUpTo(J.trail,d);
  if(pts.length>1){K.sline(c,pts,rgba(col,.22),12);K.sline(c,pts,rgba(col,.95),4);}
  // lights running along the finished trail
  const tot=polyLen(J.trail),done=J.land!=null?lt>J.land+.3:(J.wait!=null&&lt>J.wait+.3);
  if(done&&tot>0){for(let q=0;q<3;q++){const u=mod(t*.42+q/3),[x,y]=polyAt(J.trail,u*tot);glow(c,x,y,14,col,.75*Math.sin(Math.PI*u));circle(c,x,y,3.5,rgba(col,.95*Math.sin(Math.PI*u)),null);}}
  c.restore();
}
function badgesLayer(c,S,t,a){
  if(a<=0)return;const {J,k,lt,Ly,mode}=S;
  c.save();c.globalAlpha*=a;
  EV[k].forEach((lines,i)=>{if(J.badgeT[i]==null)return;const v=ease((lt-J.badgeT[i])/.45);if(v<=0)return;
    const gp=Ly.gaps[i],b=badgeRows(c,lines,RP.x+RP.w-12-BX),y=(gp.y0+gp.y1)/2-b.h/2;
    badge(c,lines,BX+(1-v)*12,y,RP.x+RP.w-12-BX,v);});
  // liverwort: gates 2 and 3 are skipped
  if(PL[k].ans===0&&J.land!=null&&mode!=='wrong'){const v=ease((lt-J.land-.5)/.5);if(v>0){
    const gp=Ly.gaps[1],lines=[[SKIP,C.muted]],b=badgeRows(c,lines,RP.x+RP.w-12-BX);
    badge(c,lines,BX,(gp.y0+gp.y1)/2-b.h/2,RP.x+RP.w-12-BX,v,{dash:true,border:rgba(C.muted,.8)});}}
  // wrong guess: a "?" next to the gate the hint points at
  if(mode==='wrong'&&J.wait!=null&&lt>J.wait){const v=ease((lt-J.wait)/.4),g=Ly.gates[HINT_GATE[k]];
    c.save();c.globalAlpha*=v;const pu=.5+.5*Math.sin(t*4);
    circle(c,GX0+24,g.y-22,15,rgba(YEL,.25+.35*pu),YEL,2);
    c.font=K.MONO(22);c.fillStyle=YEL;c.textAlign='center';c.textBaseline='middle';c.fillText('?',GX0+24,g.y-21);c.restore();}
  c.restore();
}
function ballLayer(c,S,t,a){
  if(a<=0)return;const {J,k,lt,mode}=S,[x,y]=ballAt(J,lt),ap=ease((lt-.15)/.4);
  const rest=(J.land!=null&&lt>J.land)||(J.wait!=null&&lt>J.wait),bob=rest?2.5*Math.sin(t*2.4):0;
  const ring=mode==='right'&&J.land!=null&&lt>J.land?GRN:mode==='none'&&J.land!=null&&lt>J.land?YEL:C.white;
  c.save();c.globalAlpha*=a;
  if(rest)glow(c,x,y+bob,30,ring,.35+.15*Math.sin(t*3));
  thumbBall(c,k,x,y+bob,17*mix(.6,1,ap),ap,ring);
  c.restore();
}
function leftLayer(c,S,t,a,dx){
  if(a<=0)return;const {k,lt,mode,g,J}=S,L=LAB(),cx=LP.x+LP.w/2;
  c.save();c.globalAlpha*=a;c.translate(dx,0);
  text(c,L[PL[k].name]||PL[k].def,cx,66,30,YEL,'center');
  plantPic(c,k,t,1);
  // guess card
  const y0=318,x0=LP.x+14,w=LP.w-28,landed=J.land!=null&&lt>J.land;
  const GN=[L.bryophyte,L.fern,L.gymno,L.angio].map((p,i)=>p||[P(`蘚苔植物`,`Bryophytes`),P(`蕨類`,`Ferns`),P(`裸子植物`,`Gymnosperms`),P(`被子植物`,`Angiosperms`)][i]);
  let head,body,col;
  if(mode==='none'){if(landed){head=P(`判定：`,`Sorted into:`);body=GN[PL[k].ans];col=YEL;}else{head=P(`還沒猜`,`No guess yet`);body=P(`先看三道關怎麼判斷`,`Watch the three gates decide`);col=C.muted;}}
  else if(mode==='right'){head=P(`你猜：`,`Your guess:`);body=GN[g];col=GRN;}
  else{head=P(`你猜：`,`Your guess:`);body=GN[g];col=ORG;}
  const hr=rowsOf(c,head,w-28),br=rowsOf(c,body,w-28);
  let foot=null;if(mode==='right')foot=landed?P(`猜對了！`,`Correct!`):P(`看看三道關…`,`Check the gates…`);if(mode==='wrong')foot=P(`再想一想，看說明裡的提示`,`Think again: read the hint in the notes`);
  const fr=foot?rowsOf(c,foot,w-28):[],h=14+(hr.length+br.length+fr.length)*30+10;
  const fl=mode==='wrong'?.5+.5*Math.sin(t*6.5):0;
  D.round(c,x0,y0,w,h,14,mode==='wrong'?rgba(ORG,.08+.14*fl):'rgba(11,26,21,.9)',null);
  outline(c,x0,y0,w,h,14,rgba(col,mode==='none'&&!landed?.6:.95),mode==='none'&&!landed?2:3,mode==='none'&&!landed?[7,5]:null);
  let yy=y0+14+22;
  hr.forEach(r=>{text(c,r,cx,yy,22,C.white,'center');yy+=30;});
  br.forEach(r=>{text(c,r,cx,yy,22,col,'center');yy+=30;});
  fr.forEach(r=>{text(c,r,cx,yy,22,mode==='right'&&landed?GRN:mode==='wrong'?ORG:C.muted,'center');yy+=30;});
  if(mode==='right'&&landed){c.save();c.globalAlpha*=ease((lt-J.land)/.4);tick(c,x0+w-4,y0+4,13,GRN);c.restore();}
  if(mode==='wrong'){cross(c,x0+w-4,y0+4,13,ORG);}
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const g=s.guess==null?-1:s.guess;
  const st=s.grp||(s.grp={});
  // a new guess replays the step from the top (without moving the step clock)
  if(st.g!==g){st.g=g;st.gT=t;}
  const stepStart=t-tau,lt=st.gT>stepStart&&st.gT<=t?t-st.gT:tau;
  // cross-fade on a step change
  const key=k+'|'+(held?s.start:'loop');
  if(st.key!==key){if(st.key!==undefined&&t-st.lastT<.3&&t>=st.lastT){st.from=t;st.fromK=st.k;st.fromLt=st.lt;st.fromG=st.gg;st.fromT=t;}else st.from=-99;st.key=key;}
  const x=clamp((t-st.from)/.8),fromOn=x<1,aOut=1-ease(clamp(x*2)),aIn=fromOn?ease(clamp(x*2-1)):1;
  st.k=k;st.lt=lt;st.gg=g;st.lastT=t;

  K.panel(c,LP.x,LP.y,LP.w,LP.h);K.panel(c,RP.x,RP.y,RP.w,RP.h);
  const Ly=layout(c),S=stepState(c,k,lt,g),F=fromOn?stepState(c,st.fromK,st.fromLt+(t-st.fromT),st.fromG):null;
  // left panel
  if(F)leftLayer(c,F,t,aOut,-40*(1-aOut));
  leftLayer(c,S,t,aIn,40*(1-aIn));
  const note=LAB().aiNote||P(`AI 插圖，非實拍`,`AI illustration, not a photo`);
  rowsOf(c,note,LP.w-28).forEach((r,i,all)=>text(c,r,LP.x+LP.w/2,566-(all.length-1-i)*27,22,C.muted,'center'));
  // right panel: frame, lit trail, ball (under the gates), gates, classes, badges
  keyFrame(c,Ly,t);
  if(F)stepLayer(c,F,t,aOut);
  stepLayer(c,S,t,aIn);
  if(F)ballLayer(c,F,t,aOut);
  ballLayer(c,S,t,aIn);
  const gs=gateStates(S),gf=F?gateStates(F):null;
  gatesDraw(c,Ly,gs.map((q,i)=>F?{ask:q.ask*aIn+gf[i].ask*aOut,dim:mix(gf[i].dim,q.dim,ease(x))}:q),t);
  const cs=classStates(S),cf=F?classStates(F):null;
  classDraw(c,Ly,cs.map((q,i)=>F?{judge:q.judge*aIn+cf[i].judge*aOut,right:q.right*aIn+cf[i].right*aOut,wrong:q.wrong*aIn+cf[i].wrong*aOut,pick:q.pick*aIn+cf[i].pick*aOut}:q),t);
  if(F)badgesLayer(c,F,t,aOut);
  badgesLayer(c,S,t,aIn);
}
window.PlantsDraw.groups=draw;
})();
