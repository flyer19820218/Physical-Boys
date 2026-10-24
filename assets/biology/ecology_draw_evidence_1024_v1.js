/* Ecology lesson 4 · "evidence" canvas (schoolyard tab, view 1), 2026-10-24. Seen / inferred / not seen / repeat / no conclusion yet.
 * Data follow the fairtest view (open 4 / shade 12, 31 / 27 °C, 55 / 80 %; all schematic).
 * Pictures (K.SIZE): EC1_sunny_dry 928x1116, EC1_shady_moist 929x948 (soil blocks), EC4_grasshopper 788x446, EC15_field_snail 655x350.
 * Spots on the pictures (picture pixels, measured on the PNGs): shady top-face ferns (600,180), puddle (330,495), soil front (300,720),
 *   grasshopper hiding spot on the top face (560,380); sunny top face (480,470), cracked surface (720,600), soil front (300,820).
 * Four steps, 8 s each; s.shown = step. The two soil blocks move between step layouts (small headers, one big block, legend, side by side).
 *  0 seen / inferred: six record cards (counts, temperature, humidity at both sites) leave a pile one by one into the "What I saw" column;
 *    the inference card "Shade increases insects" slides into "What I infer" and gets a "Not yet proven" stamp.
 *  1 not seen: the shaded block large; a magnifier sweeps across; a grasshopper under a leaf and a snail in the soil appear only after
 *    the lens has passed; three reason pills (may be hiding, active at other times, hard to identify).
 *  2 repeat: three trials as bar pairs (open 4/7/5, shade 9/6/8, schematic) grow one trial after another; trial 2 is ringed
 *    ("Open had more this time"); "Repeat to tell chance apart". No conclusion, no statistics.
 *  3 not yet "because of shade": both blocks side by side; temperature, humidity and soil differences light up on both; three candidate
 *    factor cards (light, humidity, soil) with question marks, each with a switch, and only one switch moves at a time; "Next: change one
 *    condition at a time".
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const COUNT=P('昆蟲數量','Insect count'),N4=P('4 隻','4 insects'),N12=P('12 隻','12 insects');
const INFER=P('遮蔭讓昆蟲變多','Shade increases insects'),MORE_EV=P('推論需要更多證據','An inference needs more evidence');
const NUMS=P('數字為示意','Numbers are schematic');
const GRASS=P('蚱蜢','Grasshopper'),SNAIL=P('田螺','Field snail'),ACTIVE=P('活動時間不同','Active at other times'),HARDID=P('不好辨認','Hard to identify');
const TRIALS=[P('第 1 次','Trial 1'),P('第 2 次','Trial 2'),P('第 3 次','Trial 3')],OPEN_MORE=P('這次開闊處比較多','Open had more this time');
const REPEAT_LINE=P('重複幾次，才分得出偶然','Repeat to tell chance apart');
const NOT_SHADE=P('還不能說「因為遮蔭」','We cannot yet say "because of shade"'),WETTER=P('較濕','Wetter'),DIFF_SOIL=P('土也不同','Different soil');
const N=4,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,PINK=C.pink,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',CARD_BG='rgba(28,61,52,.95)',PANEL='#16332b';

// ── helpers (same look as the fairtest view) ───────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dashLine(c,a,b,col,t,w=2.5){c.save();c.lineCap='round';c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
function magnifier(c,x,y,r=15,col=WHITE,lens=true){
  c.save();c.lineCap='round';
  c.beginPath();c.moveTo(x+r*.7,y+r*.7);c.lineTo(x+r*1.6,y+r*1.6);c.strokeStyle=C.ink;c.lineWidth=Math.max(9,r*.28);c.stroke();c.strokeStyle=col;c.lineWidth=Math.max(5,r*.17);c.stroke();
  circle(c,x,y,r,lens?rgba(CYAN,.12):null,C.ink,7);circle(c,x,y,r,null,col,Math.max(3.5,r*.07));
  c.restore();
}
function insect(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  c.strokeStyle=C.ink;c.lineWidth=2;for(const d of [-1,1])for(const k of [-4,0,4]){c.beginPath();c.moveTo(k,0);c.lineTo(k+d*2,d*8);c.stroke();}
  K.ellipse(c,0,0,8,5.5,ORANGE,C.ink,2);circle(c,7,0,3.2,C.ink);
  c.restore();
}
function miniThermo(c,x,y){D.round(c,x-5,y-16,10,26,5,PANEL,WHITE);circle(c,x,y+12,7,ORANGE,WHITE,2);D.round(c,x-2,y-8,4,18,2,ORANGE);}
function drop(c,x,y,r=10,col=CYAN){c.save();c.beginPath();c.moveTo(x,y-r*1.4);c.quadraticCurveTo(x+r*1.1,y,x,y+r*.9);c.quadraticCurveTo(x-r*1.1,y,x,y-r*1.4);c.fillStyle=col;c.fill();c.restore();}
// picture rectangle from centre x, bottom y and height
const SZ={sun:[928,1116],shade:[929,948]},FILE={sun:'EC1_sunny_dry.png',shade:'EC1_shady_moist.png'};
const rB=(key,cx,bot,h)=>{const [W,H]=SZ[key],w=h*W/H;return{x:cx-w/2,y:bot-h,w,h};};
const toS=(key,r,px,py)=>[r.x+px*r.w/SZ[key][0],r.y+py*r.h/SZ[key][1]];
const mixR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});

// ── layouts ───────────────────────────────────────────────────────────────
// step 0: two panels
const LP={x:24,y:70,w:560,h:392},RP={x:600,y:70,w:336,h:392};
const SC=[{x:198,w:180},{x:390,w:180}],ROWY=[204,290,376],CH=66;
const INF={x:616,y:150,w:304,h:128};
const PILE={x:390,y:494};
// step 2: chart
const BASE=440,UNIT=26,GX=[160,360,560],OPEN_V=[4,7,5],SHADE_V=[9,6,8];
// step 3: factors
const FC={x:330,w:300,h:72,y:[70,160,250]};
const LAY=[
  {sun:rB('sun',SC[0].x+SC[0].w/2,140,58),shade:rB('shade',SC[1].x+SC[1].w/2,140,58),a:[1,1]},
  {sun:rB('sun',SC[0].x+SC[0].w/2,140,58),shade:rB('shade',480,499,429),a:[0,1]},
  {sun:rB('sun',810,196,100),shade:rB('shade',810,366,100),a:[1,1]},
  {sun:rB('sun',160,370,260),shade:rB('shade',792,370,236),a:[1,1]}];

// step 1 drawing of the hidden animals on the shaded block (rv: 0 hidden .. 1 revealed)
function hidden(c,r,rvG,rvS,t,inLens){
  // snail pulled into the soil: a dark hollow opens on the front face
  const [sx,sy]=toS('shade',r,290,720),cw=r.w*.13,chh=r.w*.06;
  if(rvS>0){withA(c,rvS,()=>{
    K.ellipse(c,sx,sy,cw,chh,'#24170f',rgba(SAND,.7),2.5);
    c.save();c.beginPath();c.ellipse(sx,sy,cw-2,chh-2,0,0,Math.PI*2);c.clip();
    K.at(c,'EC15_field_snail.png',sx+cw*.15,sy+chh*.15,r.w*.19);c.restore();
  });}
  // grasshopper under a fallen leaf on the top face
  const [gx,gy]=toS('shade',r,560,380);
  K.at(c,'EC4_grasshopper.png',gx,gy,r.w*.3);
  const lift=inLens?0:ease(rvG),la=inLens?.35:1;
  c.save();c.globalAlpha*=la;c.translate(gx-r.w*.13*lift,gy-r.w*.09*lift);c.rotate(-.25-.55*lift);
  const rx=r.w*.17,ry=r.w*.08;
  c.beginPath();c.moveTo(-rx,0);c.quadraticCurveTo(0,-ry*1.6,rx,0);c.quadraticCurveTo(0,ry*1.6,-rx,0);c.closePath();
  c.fillStyle='#8a6a38';c.fill();c.strokeStyle='#4f3a1c';c.lineWidth=2.5;c.stroke();
  K.sline(c,[[-rx*.95,0],[rx*.95,0]],'#5e4522',2.5);
  for(const f of [-.5,-.1,.3])for(const d of [-1,1])K.sline(c,[[rx*f,0],[rx*(f+.22),d*ry*.55]],'#5e4522',1.8);
  c.restore();
}
// lens path across the big shaded block (picture pixels; x must increase)
const LENS_PATH=[[-60,600],[290,720],[560,380],[990,300]],LR=64;
function lensAt(r,u){
  const pts=LENS_PATH.map(([x,y])=>toS('shade',r,x,y)),x=mix(pts[0][0],pts[3][0],u);
  let i=0;while(i<2&&x>pts[i+1][0])i++;
  const a=pts[i],b=pts[i+1],v=clamp((x-a[0])/(b[0]-a[0]));return[x,mix(a[1],b[1],(1-Math.cos(v*Math.PI))/2)];
}
function toggle(c,x,y,on,col,act){
  D.round(c,x,y-13,48,26,13,on?rgba(col,.55):'rgba(11,26,21,.9)',act?col:rgba(WHITE,.45));
  circle(c,mix(x+13,x+35,on),y,10,act?WHITE:rgba(WHITE,.6),C.ink,2);
}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.evSt||(s.evSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const T=tau;
  // cross-fade: the old step fades out in the first OUT s, the new step's elements start after it
  const OUT=.45,D0=st.from>=0?OUT:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau-D0,s0,d,s1);if(st.from<0||tau>=OUT)return now;return Math.max(now,vis(st.from,9,s0,0,s1)*(1-smooth(tau/OUT)));};
  const Lk=LAY[k],Lf=moving?LAY[st.from]:Lk;
  const R={sun:mixR(Lf.sun,Lk.sun,u),shade:mixR(Lf.shade,Lk.shade,u)};
  const PA={sun:mix(Lf.a[0],Lk.a[0],u),shade:mix(Lf.a[1],Lk.a[1],u)};

  // ── step 0 panels (under the pictures) ──
  withA(c,A(0,0,0),()=>{
    D.round(c,LP.x,LP.y,LP.w,LP.h,16,PANEL,rgba(CYAN,.45));D.round(c,RP.x,RP.y,RP.w,RP.h,16,PANEL,rgba(PINK,.45));
    tag(c,L('seen','我看到的','What I saw'),LP.x+LP.w/2,16,{al:'center',col:CYAN,active:true,size:24});
    tag(c,L('inferred','我推論的','What I infer'),RP.x+RP.w/2,16,{al:'center',col:PINK,active:true,size:24});
    tag(c,L('openSite','開闊處','Open site'),SC[0].x+SC[0].w/2,146,{al:'center',col:YELLOW,active:true});
    tag(c,L('shadeSite','遮蔭處','Shaded site'),SC[1].x+SC[1].w/2,146,{al:'center',col:GREEN,active:true});
    const RL=[[COUNT,WHITE],[L('temperature','溫度','Temperature'),ORANGE],[L('humidity','濕度','Humidity'),CYAN]];
    RL.forEach(([p,col],i)=>{const rows=K.splitLines(c,D.tr(p),148,22),y0=ROWY[i]+CH/2+8-(rows.length-1)*14;K.wrap(c,p,40,y0,148,22,col,28,'left');});
  });

  // ── pictures ──
  for(const key of ['sun','shade']){const a=PA[key];if(a>0.01)K.drawIn(c,FILE[key],R[key],{alpha:a});}

  // ── step 0: cards ──
  withA(c,A(0,.1,0),()=>{
    const VALS=[[N4,N12],['31 °C','27 °C'],['55 %','80 %']],ICON=[(x,y)=>insect(c,x,y,1.3),(x,y)=>miniThermo(c,x,y),(x,y)=>drop(c,x,y+2,10)];
    const card=(i,cx,cy,w,h,face=true)=>{const row=Math.floor(i/2),j=i%2,col=j?GREEN:YELLOW;
      D.round(c,cx,cy,w,h,12,CARD_BG,rgba(col,.8));if(!face)return;ICON[row](cx+24,cy+h/2);
      const v=VALS[row][j];text(c,typeof v==='string'?P(v,v):v,cx+42+(w-42)/2,cy+h/2+9,24,WHITE,'center');};
    // pile first (cards still waiting), last card at the bottom
    const ready=i=>k!==0||T>=.5+i*.55;let top=0;while(top<6&&ready(top))top++;
    for(let i=5;i>=0;i--){const t0=.5+i*.55,e=k===0?ease(clamp((T-t0)/.6)):1;if(e>=1)continue;
      const row=Math.floor(i/2),j=i%2,tx=SC[j].x,ty=ROWY[row];
      const px=PILE.x+(5-i)*3,py=PILE.y-(5-i)*3;
      card(i,mix(px,tx,e),mix(py,ty,e),SC[j].w,CH,e>0||i===top);}
    for(let i=0;i<6;i++){const t0=.5+i*.55,e=k===0?ease(clamp((T-t0)/.6)):1;if(e<1)continue;
      const row=Math.floor(i/2),j=i%2;card(i,SC[j].x,ROWY[row],SC[j].w,CH);
      if(k===0&&T-t0<1.2){const g=1-clamp((T-t0-.6)/.6);D.round(c,SC[j].x-3,ROWY[row]-3,SC[j].w+6,CH+6,14,null,rgba(WHITE,.8*g));}}
    // the inference card slides in from the right
    const ti=4,e=k===0?ease(clamp((T-ti)/.8)):1,ix=mix(CW+20,INF.x,e);
    if(e>0){
    D.round(c,ix,INF.y,INF.w,INF.h,14,CARD_BG,rgba(PINK,.85));
    const rows=K.splitLines(c,D.tr(INFER),INF.w-34,28),lh=38,y0=INF.y+INF.h/2+10-(rows.length-1)*lh/2;
    K.wrap(c,INFER,ix+INF.w/2,y0,INF.w-34,28,WHITE,lh,'center');}
  });
  // dashed link: the inference is built on the counts
  withA(c,A(0,5,0),()=>{dashLine(c,[SC[1].x+SC[1].w+4,ROWY[0]+CH/2],[INF.x-4,INF.y+INF.h/2],rgba(PINK,.9),t,3);});
  // stamp "not yet proven"
  withA(c,A(0,5.2,0),()=>{
    const e=k===0?ease(clamp((T-5.2)/.4)):1,sc=1+.6*(1-e),p=L('notProven','還沒證明','Not yet proven'),w=measure(c,p,26)+36,h=50;
    c.save();c.translate(INF.x+INF.w/2,318);c.rotate(-.07);c.scale(sc,sc);
    D.round(c,-w/2,-h/2,w,h,10,'rgba(11,26,21,.95)',ORANGE);D.round(c,-w/2+5,-h/2+5,w-10,h-10,7,null,rgba(ORANGE,.7));
    text(c,p,0,10,26,ORANGE,'center');c.restore();
    if(e>=1){const uu=mod(t*.7);c.save();c.translate(INF.x+INF.w/2,318);c.rotate(-.07);D.round(c,-w/2-6*uu,-h/2-6*uu,w+12*uu,h+12*uu,12,null,rgba(ORANGE,.8*(1-uu)));c.restore();}
  });
  withA(c,A(0,5.8,0),()=>{K.wrap(c,MORE_EV,RP.x+RP.w/2,400,RP.w-36,22,MUTED,30,'center');});
  withA(c,A(0,.3,0),()=>{text(c,NUMS,LP.x+4,500,22,MUTED,'left');});

  // ── step 1: not seen is not absent ──
  withA(c,A(1,0,1),()=>{
    const p=tag(c,L('notSeenNotAbsent','沒看到，不等於不存在','Not seeing is not the same as absent'),CW/2,12,{al:'center',col:YELLOW,active:true,size:24});
    if(T>6)pulseRing(c,p,t,YELLOW);
    tag(c,L('shadeSite','遮蔭處','Shaded site'),R.shade.x+R.shade.w+8,456,{col:GREEN,active:true});
  });
  withA(c,A(1,.2,1),()=>{
    const r=R.shade,sw=.6,dur=3.6,uL=clamp((T-sw)/dur),[lx,ly]=lensAt(r,uL);
    const [gx,gy]=toS('shade',r,560,380),[sx,sy]=toS('shade',r,290,720);
    const done=k!==1||T>sw+dur;
    const rv=ax=>done?1:clamp((lx-ax-LR*.4)/50);
    const rvG=rv(gx),rvS=rv(sx);
    hidden(c,r,rvG,rvS,t,false);
    // revealed animals: pulse and name pills
    if(rvG>=1){K.pulse(c,gx,gy,t,GREEN,26);}
    if(rvS>=1){K.pulse(c,sx,sy,t+.4,SAND,22);}
    withA(c,rvG,()=>{const p=tag(c,GRASS,742,150,{col:GREEN});dashLine(c,[p.x,p.y+p.h/2],[gx+r.w*.12,gy-10],rgba(GREEN,.9),t);});
    withA(c,rvS,()=>{const p=tag(c,SNAIL,252,370,{al:'right',col:SAND});dashLine(c,[p.x+p.w,p.y+p.h/2],[sx-r.w*.13,sy],rgba(SAND,.9),t);});
    // magnifier: inside the lens the hidden animals already show
    const la=k===1?clamp(1-(T-sw-dur)/.5)*clamp((T-.1)/.4):0;
    withA(c,la,()=>{
      c.save();c.beginPath();c.arc(lx,ly,LR,0,Math.PI*2);c.clip();c.fillStyle='#11261f';c.fillRect(lx-LR,ly-LR,LR*2,LR*2);
      c.translate(lx,ly);c.scale(1.5,1.5);c.translate(-lx,-ly);
      K.drawIn(c,FILE.shade,r);hidden(c,r,1,1,t,true);c.restore();
      magnifier(c,lx,ly,LR,WHITE,true);
    });
  });
  const RS=[[L('maybeHidden','可能躲起來','May be hiding'),GREEN],[ACTIVE,CYAN],[HARDID,YELLOW]];
  {const ws=RS.map(([p])=>measure(c,p,22)+28),tot=ws.reduce((a,b)=>a+b,0)+16*2;let x0=(CW-tot)/2;
    RS.forEach(([p,col],i)=>{withA(c,A(1,4.4+i*.6,1),()=>{const q=tag(c,p,x0,518,{col});if(k===1&&T>6.6)pulseRing(c,q,t+i*.5,col);});x0+=ws[i]+16;});}

  // ── step 2: repeat the survey ──
  withA(c,A(2,0,2),()=>{
    K.sline(c,[[70,130],[70,BASE],[660,BASE]],rgba(WHITE,.7),3);
    text(c,COUNT,82,124,22,WHITE,'left');
    TRIALS.forEach((p,g)=>text(c,p,GX[g],474,22,WHITE,'center'));
    tag(c,L('openSite','開闊處','Open site'),810,204,{al:'center',col:YELLOW,active:true});
    tag(c,L('shadeSite','遮蔭處','Shaded site'),810,374,{al:'center',col:GREEN,active:true});
  });
  withA(c,A(2,.1,2),()=>{
    for(let g=0;g<3;g++)for(let j=0;j<2;j++){
      const t0=.5+g*1.1+j*.25,e=k===2?ease(clamp((T-t0)/.7)):1;if(e<=0)continue;
      const v=j?SHADE_V[g]:OPEN_V[g],col=j?GREEN:YELLOW,bx=j?GX[g]+4:GX[g]-64,h=v*UNIT*e;
      D.round(c,bx,BASE-h,60,h,6,rgba(col,.85),col);
      if(e>.95)text(c,P(String(v),String(v)),bx+30,BASE-h-10,24,WHITE,'center',K.MONO);
    }
    // a soft sweep over the trials (shows repeating)
    if(T>4){const g=Math.floor(mod(t*.6,3));c.save();c.globalAlpha*=.10+.05*Math.sin(t*3);D.round(c,GX[g]-74,130,148,BASE-126,12,WHITE);c.restore();}
  });
  withA(c,A(2,4.2,2),()=>{
    c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*12;D.round(c,GX[1]-76,200,152,BASE-192,14,null,ORANGE);c.restore();
    tag(c,OPEN_MORE,GX[1],140,{al:'center',col:ORANGE});
  });
  withA(c,A(2,5.2,2),()=>{const p=tag(c,REPEAT_LINE,CW/2,500,{al:'center',col:YELLOW,active:true,size:24});pulseRing(c,p,t,YELLOW);});
  withA(c,A(2,.3,2),()=>{text(c,NUMS,24,572,22,MUTED,'left');});

  // ── step 3: other differences, candidate factors ──
  const F=[['light','光','Light',YELLOW,[480,470],[600,180]],['humidity','濕度','Humidity',CYAN,[720,600],[330,495]],['soil','土壤','Soil',SAND,[300,820],[300,720]]];
  withA(c,A(3,0,3),()=>{
    tag(c,NOT_SHADE,CW/2,12,{al:'center',col:YELLOW,active:true,size:24});
    tag(c,L('openSite','開闊處','Open site'),R.sun.x+R.sun.w/2,62,{al:'center',col:YELLOW,active:true});
    tag(c,L('shadeSite','遮蔭處','Shaded site'),R.shade.x+R.shade.w/2,88,{al:'center',col:GREEN,active:true});
  });
  // difference pills under the blocks
  const pillRow=(items,cx,y)=>{const ws=items.map(([p])=>measure(c,p,22)+28),tot=ws.reduce((a,b)=>a+b,0)+12*(items.length-1);let x0=cx-tot/2;
    items.forEach(([p,col,d])=>{withA(c,A(3,d,3),()=>tag(c,p,x0,y,{col}));x0+=ws.shift()+12;});};
  pillRow([[L('warm','較暖','Warmer'),ORANGE,.4],[L('dry','乾','Dry'),CYAN,2.1]],160,384);
  pillRow([[L('cool','較冷','Cooler'),ORANGE,.4],[WETTER,CYAN,2.1]],792,384);
  pillRow([[DIFF_SOIL,SAND,3.3]],792,430);
  const cyc=Math.floor(mod(t/1.6,3));
  F.forEach(([key,zh,en,col,ps,pd],i)=>{
    const d=.9+i*1.2;
    withA(c,A(3,d,3),()=>{
      const y=FC.y[i],e=k===3?ease(clamp((T-d)/.6)):1,cx=FC.x,cy=y+(1-e)*24,on=k!==3||T>4.6;
      const act=on&&cyc===i;
      // highlights on both blocks and links to the card
      const a=toS('sun',R.sun,...ps),b=toS('shade',R.shade,...pd),uu=mod(t*.8+i*.3);
      for(const [q,rr] of [[a,R.sun.w*.16],[b,R.shade.w*.16]]){
        glow(c,q[0],q[1],rr*1.6,col,act?.4:.22);
        c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;K.ellipse(c,q[0],q[1],rr,rr*.55,null,col,3);c.restore();
        K.ellipse(c,q[0],q[1],rr+uu*14,rr*.55+uu*8,null,rgba(col,.7*(1-uu)),2);}
      dashLine(c,[cx,cy+FC.h/2],[a[0]+R.sun.w*.16,a[1]],rgba(col,.8),t);
      dashLine(c,[cx+FC.w,cy+FC.h/2],[b[0]-R.shade.w*.16,b[1]],rgba(col,.8),t);
      if(act)glow(c,cx+FC.w/2,cy+FC.h/2,170,col,.18);
      D.round(c,cx,cy,FC.w,FC.h,14,CARD_BG,act?col:rgba(col,.7));
      text(c,L(key,zh,en),cx+18,cy+FC.h/2+9,26,col,'left');
      const bob=Math.sin(t*2.2+i)*3,qx=cx+FC.w-104,qy=cy+FC.h/2+bob;
      circle(c,qx,qy,20,'#16332b',col,3);text(c,P('?','?'),qx,qy+9,26,WHITE,'center');
      if(on){const sw=act?.5-.5*Math.cos(mod(t/1.6,1)*Math.PI*2):0;toggle(c,cx+FC.w-64,cy+FC.h/2,sw,col,act);}
    });
  });
  withA(c,A(3,4.6,3),()=>{const p=tag(c,L('changeOne','下一次：一次只改一個條件','Next: change one condition at a time'),CW/2,500,{al:'center',col:YELLOW,active:true,size:24});pulseRing(c,p,t,YELLOW);});

  // AI note (soil blocks, grasshopper and snail are AI pictures in every step)
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.evidence=draw;
})();
