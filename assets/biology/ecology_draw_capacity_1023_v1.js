/* Ecology lesson 1 · "capacity" canvas (population-balance tab, view 1), 2026-10-23.
 * Carrying capacity, drawn only as "more / fewer" (no numbers, no fixed limit).
 * Layout shared by the three steps (one scene, only the amounts change, with cross-fades):
 *   left   a meadow panel: sky, ground line GY, soil band. 10 grass clumps (EC3_foxtail 549 × 919 / EC3_miscanthus 774 × 1141,
 *          alternating, bottom of the picture = ground, PIL: opaque to the bottom row) sway; 8 field mice (EC4_vole 634 × 568,
 *          feet at 491/568, faces left, some mirrored) bob on the ground. Tags: "Food (grass)" with a leader to one clump,
 *          "Field mouse" with a leader to one mouse. AI note + "Schematic" in the soil band.
 *   right  two bars: "Food (grass)" (green) → "Carrying capacity" (yellow, dashed top line). No scale, no numbers;
 *          the level words "More" / "Fewer" are written inside the fill (22 px, measured, fits both languages).
 *  0 plenty of food: all 10 clumps, 8 mice; both bars high, "More".
 *  1 little food: 7 clumps shrink and fade (3 left), 5 mice slide out and fade (3 left); a sun with "Dry season";
 *    both bars low, "Fewer".
 *  2 other conditions: 6 clumps, 5 mice; the factors Food (grass), Space (double arrow across the meadow), Predators
 *    (EC6_snake 847 × 559 + its name), Season (sun ↔ rain cloud, "Dry season" / "Wet season") light up in turn, 1.6 s each;
 *    while each is lit the capacity line moves up and down (↕, no direction is claimed). "Not a permanent fixed limit"
 *    under the bars; "What happens when numbers pass it? More data is needed" under the meadow.
 * s.shown = step every frame. Held steps keep moving (sway, bob, dash flow, pulses).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,rgba,text,measure,glow,circle,ellipse,dim,stageClock,fade}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=7,CW=960,MOVE=.9,FSLOT=1.6;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,GREEN=C.green,CYAN=C.cyan,GREY='#9fb3a8',SOIL='#3a2f24';
const VOLE='EC4_vole.png',FOX='EC3_foxtail.png',MIS='EC3_miscanthus.png',SNAKE='EC6_snake.png';
const FEET=491/568;

// ── geometry ───────────────────────────────────────────────────────────────
const MX=16,MY=70,MW=610,MH=440,GY=440;                 // meadow panel, ground line
const FB={x:668,w:90},CB={x:818,w:90},BY0=150,BY1=440;   // food bar, capacity bar
const BH=BY1-BY0;
const GRASS=Array.from({length:10},(_,i)=>{const r=K.rng(40+i),fox=i%2===0;
  return{x:MX+40+i*59+(r()-.5)*10,f:fox?FOX:MIS,h:fox?158+r()*16:184+r()*16,ph:r()*TAU};});
const VOLES=[[86,0,0],[146,1,1],[206,0,0],[268,1,0],[322,0,1],[384,1,0],[442,0,1],[502,1,0]].map(([x,row,flip],i)=>({x,y:GY+(row?22:8),flip:!!flip,ph:i*1.3}));
// which clumps / mice are there in each step
const G_ON=[[0,1,2,3,4,5,6,7,8,9],[1,5,8],[0,2,4,5,7,9]];
const V_ON=[[0,1,2,3,4,5,6,7],[1,4,6],[0,2,4,6,7]];
const GTAG=5,VTAG=6;
const LEVEL=[{food:.86,cap:.8},{food:.3,cap:.32},{food:.6,cap:.56}];

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.9)'}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function ring(c,r,t,col){const u=mod(t*.8);D.round(c,r.x-8*u,r.y-8*u,r.w+16*u,r.h+16*u,r.h/2+8*u,null,rgba(col,.9*(1-u)));}
function dbl(c,x1,y,x2,col,w=3.5){K.arrow(c,(x1+x2)/2,y,x1,y,col,w);K.arrow(c,(x1+x2)/2,y,x2,y,col,w);}
function vArrows(c,x,y,len,col){K.arrow(c,x,y,x,y-len,col,3.5);K.arrow(c,x,y,x,y+len,col,3.5);}

// ── meadow ─────────────────────────────────────────────────────────────────
function meadowBase(c){
  D.round(c,MX,MY,MW,MH,14,C.panel,C.edge);
  c.save();c.beginPath();c.roundRect(MX,MY,MW,MH,14);c.clip();
  c.fillStyle=SOIL;c.fillRect(MX,GY,MW,MY+MH-GY);
  K.line(c,[[MX,GY],[MX+MW,GY]],rgba(GREEN,.35),2);
  c.restore();
}
function grassClump(c,g,a,t){if(a<=0.01)return;
  const [W,H]=dim(g.f),h=g.h*(.45+.55*a),w=h*W/H,sw=Math.sin(t*1.3+g.ph)*.03;
  c.save();c.globalAlpha*=a;c.translate(g.x,GY+4);c.rotate(sw);K.drawIn(c,g.f,{x:-w/2,y:-h,w,h});c.restore();}
function vole(c,v,a,dx,t){if(a<=0.01)return;
  const w=64,h=w*dim(VOLE)[1]/dim(VOLE)[0],x=v.x+dx,bob=Math.abs(Math.sin(t*2.1+v.ph))*2.5,cy=v.y-h*FEET+h/2-bob;
  withA(c,a,()=>{ellipse(c,x+(v.flip?-1:1)*w*.06,v.y+1,w*.36,4,rgba(C.deep,.5),null);K.at(c,VOLE,x,cy,w,{flip:v.flip});});}
function voleTop(v){const w=64,h=w*dim(VOLE)[1]/dim(VOLE)[0];return v.y-h*FEET;}
function sun(c,x,y,t,a){withA(c,a,()=>{glow(c,x,y,46,YELLOW,.35);
  for(let i=0;i<8;i++){const an=i*TAU/8+t*.3;K.sline(c,[[x+Math.cos(an)*26,y+Math.sin(an)*26],[x+Math.cos(an)*36,y+Math.sin(an)*36]],YELLOW,3.5);}
  circle(c,x,y,19,YELLOW,null);});}
function cloud(c,x,y,t,a){withA(c,a,()=>{
  for(let i=0;i<4;i++){const fx=x-18+i*12,fy=y+24+mod(t*40+i*9,26);K.sline(c,[[fx,fy],[fx-3,fy+8]],CYAN,3);}
  [[x-16,y+4,15],[x+2,y-6,19],[x+20,y+4,14]].forEach(([cx,cy,r])=>circle(c,cx,cy,r,'#c9d6cf',null));
  c.fillStyle='#c9d6cf';c.fillRect(x-30,y+4,64,15);});}

// ── bars ───────────────────────────────────────────────────────────────────
function bar(c,b,lv,col,word,t,dashTop){
  D.round(c,b.x,BY0,b.w,BH,12,'#16332b',C.edge);
  const top=BY1-BH*lv,rip=Math.sin(t*2.4+b.x)*2;
  c.save();c.beginPath();c.roundRect(b.x,BY0,b.w,BH,12);c.clip();
  c.fillStyle=rgba(col,.85);c.beginPath();c.moveTo(b.x,BY1);c.lineTo(b.x,top+rip);
  c.quadraticCurveTo(b.x+b.w/2,top-rip,b.x+b.w,top+rip);c.lineTo(b.x+b.w,BY1);c.closePath();c.fill();c.restore();
  if(dashTop){c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*24;K.line(c,[[b.x-14,top],[b.x+b.w+14,top]],YELLOW,3.5);c.restore();}
  if(word&&word.a>0)withA(c,word.a,()=>{let s=22;const cx=b.x+b.w/2;
    while(s>18&&measure(c,word.p,s)>b.w-12)s--;            // fits at 22 px in both languages (checked); floor kept at 22 by design
    text(c,word.p,cx,top+34,s,C.deep,'center');});
  return top;
}

// ── frame ──────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.cp||(s.cp={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const wOf=j=>moving?(j===st.from?1-u:0)+(j===k?u:0):(j===k?1:0);
  const blend=f=>moving?mix(f(st.from),f(k),u):f(k);
  const w0=wOf(0),w1=wOf(1),w2=wOf(2);
  // factor cycle (step 2)
  const fi=Math.floor(Math.max(0,tau)/FSLOT)%4,fu=mod(Math.max(0,tau),FSLOT)/FSLOT,wob=Math.sin(fu*TAU)*.14;
  const lit=j=>w2*(j===fi?1:0);

  // ── meadow
  meadowBase(c);
  // space factor: double arrow across the meadow
  withA(c,w2,()=>{const on=fi===1,col=on?CYAN:rgba(CYAN,.55),y=196;
    c.save();c.setLineDash([8,8]);c.lineDashOffset=-t*20;D.round(c,MX+10,MY+10,MW-20,GY-MY-4,10,null,rgba(CYAN,on?.75:.25));c.restore();
    dbl(c,MX+24+(on?Math.sin(t*3)*4:0),y,MX+MW-24-(on?Math.sin(t*3)*4:0),col,on?4:3);});
  // grass
  c.save();c.beginPath();c.roundRect(MX,MY,MW,MH,14);c.clip();
  GRASS.forEach((g,i)=>{const a=blend(j=>G_ON[j].includes(i)?1:0);
    if(lit(0)>0&&a>.5)glow(c,g.x,GY-g.h*.5,g.h*.55,GREEN,.16*lit(0)*(.6+.4*Math.sin(t*4)));
    grassClump(c,g,a,t);});
  // predator (step 2)
  const sn={x:MX+MW-128,y:GY-62,w:112,h:112*dim(SNAKE)[1]/dim(SNAKE)[0]};
  withA(c,w2,()=>{if(fi===2)glow(c,sn.x+sn.w/2,sn.y+sn.h/2,80,ORANGE,.22+.08*Math.sin(t*4));
    const sx=Math.sin(t*1.2)*4;ellipse(c,sn.x+sn.w/2+sx,GY+12,sn.w*.42,5,rgba(C.deep,.5),null);K.drawIn(c,SNAKE,{x:sn.x+sx,y:sn.y,w:sn.w,h:sn.h});});
  // mice
  VOLES.forEach((v,i)=>{const on=j=>V_ON[j].includes(i)?1:0,a=blend(on);
    const leaving=moving&&on(st.from)&&!on(k),dx=leaving?(v.x<MX+MW/2?-1:1)*40*u:(moving&&!on(st.from)&&on(k)?(v.x<MX+MW/2?-1:1)*40*(1-u):0);
    vole(c,v,a,dx,t);});
  c.restore();
  // season icon: step 1 sun (dry season); step 2 sun ↔ cloud
  const sx=MX+56,sy=MY+52,cyc=mod(t/6.4);
  const wetA=clamp(Math.sin(cyc*TAU-Math.PI/2)*1.6+.5);
  sun(c,sx,sy,t,w1+w2*(1-wetA));cloud(c,sx,sy,t,w2*wetA);
  if(w2>0&&fi===3)withA(c,w2,()=>glow(c,sx,sy,60,CYAN,.2+.08*Math.sin(t*4)));

  // leaders + tags in the meadow
  const g=GRASS[GTAG],gTop=GY-g.h+20,v=VOLES[VTAG],vTop=voleTop(v);
  const ft={x:g.x,y:MY+14};
  K.line(c,[[ft.x,ft.y+40],[g.x,gTop]],rgba(GREEN,.8),2.5);
  K.line(c,[[v.x,vTop-34],[v.x,vTop+8]],rgba(WHITE,.8),2.5);
  const fr=tag(c,L('foodGrass','食物（草）','Food (grass)'),ft.x,ft.y,{al:'center',col:GREEN,active:lit(0)>.5});
  if(lit(0)>.5)ring(c,fr,t,GREEN);
  tag(c,L('vole','田鼷鼠','Field mouse'),v.x,vTop-74,{al:'center',col:WHITE});
  // season tags
  withA(c,w1,()=>tag(c,L('drySeason','乾季','Dry season'),sx+46,sy-20,{col:ORANGE}));
  withA(c,w2,()=>{const pr=tag(c,L('season','季節','Season'),sx+46,sy-44,{col:CYAN,active:fi===3});if(fi===3)ring(c,pr,t,CYAN);
    withA(c,1-wetA,()=>tag(c,L('drySeason','乾季','Dry season'),sx+46,sy+4,{col:ORANGE}));
    withA(c,wetA,()=>tag(c,L('wetSeason','雨季','Wet season'),sx+46,sy+4,{col:CYAN}));});
  // space + predator tags
  withA(c,w2,()=>{const r=tag(c,L('space','空間','Space'),MX+MW/2+150,196-20,{al:'center',col:CYAN,active:fi===1});if(fi===1)ring(c,r,t,CYAN);
    const pr=tag(c,L('predators','天敵','Predators'),MX+MW-12,GY-170,{al:'right',col:ORANGE,active:fi===2});if(fi===2)ring(c,pr,t,ORANGE);
    tag(c,L('snake','黑眉錦蛇','Black-browed ratsnake'),MX+MW-12,GY-124,{al:'right',col:WHITE});});
  // AI note in the soil band
  {const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),w=measure(c,ai,22)+20;
    D.round(c,MX+10,GY+32,w,34,10,'rgba(11,26,21,.8)',null);text(c,ai,MX+20,GY+56,22,C.muted);
    tag(c,L('schematic','示意','Schematic'),MX+10+w+10,GY+29,{col:GREY});}

  // ── bars
  const fLv=blend(j=>LEVEL[j].food)+w2*(fi===0?wob:0),cLv=blend(j=>LEVEL[j].cap)+w2*wob;
  K.wrap(c,L('foodGrass','食物（草）','Food (grass)'),FB.x+FB.w/2,98,150,22,GREEN,30,'center');
  K.wrap(c,L('capacity','環境負荷量','Carrying capacity'),CB.x+CB.w/2,98,150,22,YELLOW,30,'center');
  const wordA=j=>wOf(j);
  bar(c,FB,fLv,GREEN,{p:w1>w0?L('fewer','較少','Fewer'):L('more','較多','More'),a:Math.max(wordA(0),wordA(1))},t,false);
  const top=bar(c,CB,cLv,YELLOW,{p:w1>w0?L('fewer','較少','Fewer'):L('more','較多','More'),a:Math.max(wordA(0),wordA(1))},t,true);
  // food → capacity arrow (dash flowing)
  {const y=(BY0+BY1)/2+40;c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*24;K.line(c,[[FB.x+FB.w+6,y],[CB.x-18,y]],rgba(WHITE,.8),3.5);c.restore();
    K.arrow(c,CB.x-26,y,CB.x-6,y,WHITE,3.5);}
  // step 2: ↕ beside the capacity line
  withA(c,w2,()=>{vArrows(c,CB.x+CB.w+22,top,22+Math.sin(t*3)*3,YELLOW);});
  withA(c,w2,()=>K.wrap(c,L('notFixedCap','不是永遠固定的上限','Not a permanent fixed limit'),FB.x+120,BY1+40,300,22,YELLOW,30,'center'));

  // ── under the meadow
  withA(c,w0+w1,()=>K.wrap(c,L('onlyCompare','只比較較多、較少，不是真實數字','Compares more and fewer only; not real numbers'),MX+4,MY+MH+40,MW,22,C.muted));
  withA(c,w2,()=>{const gy=MY+MH+40;circle(c,MX+18,gy-8,16,null,WHITE,2.5);text(c,'?',MX+18,gy,22,WHITE,'center');
    K.wrap(c,L('exceedNote','數量超過負荷量之後會怎麼變？還需要更多資料','What happens when numbers pass it? More data is needed'),MX+44,gy,MW-40,22,WHITE);});

  // ── top bar
  for(let j=0;j<N;j++){const w=wOf(j);if(w<=0)continue;withA(c,w,()=>{
    const left=[L('grassMore','草多','Plenty of grass'),L('grassLess','草少','Little grass'),L('notOnlyFood','不只看食物','Not only food')][j];
    const lc=[GREEN,ORANGE,CYAN][j],right=[L('more','較多','More'),L('fewer','較少','Fewer'),L('changes','會改變','Changes')][j],rc=[GREEN,ORANGE,YELLOW][j];
    const a=tag(c,left,MX,10,{col:lc,active:true,size:26});glow(c,a.x+a.w/2,a.y+a.h/2,a.w*.6,lc,.1+.05*Math.sin(t*2.2));
    let xx=a.x+a.w+14;const yy=a.y+a.h/2,bob=Math.sin(t*3)*4;K.arrow(c,xx+bob,yy,xx+40+bob,yy,WHITE,4.5);xx+=56;
    const cap=L('capacity','環境負荷量','Carrying capacity');text(c,cap,xx,yy+10,26,YELLOW);xx+=measure(c,cap,26)+14;
    tag(c,right,xx,10,{col:rc,active:true,size:26});});}
}
window.EcologyDraw.capacity=draw;
})();
