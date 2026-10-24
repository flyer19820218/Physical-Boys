/* Unit 11 lesson 1 · "uses" canvas (biodiversity-value tab, view 0), 2026-10-24. What organisms provide (plan section 2, uses).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the lit sector breathes outward, the disk rim
 * dashes turn, pictures bob, statement boxes ring).
 * Left 2/3 = stage (x 16..636): a disk of four sectors drawn in code (centre 162,164, r 136), clockwise from top-left: food,
 * fibres and materials, research resources, genetic resources (names = VIEWS.uses.short). The step's sector lights up and pushes out;
 * the other three are darkened but keep their names. Right of the disk (x 322..636, y 16..306) = statements; under it (y 318..)
 * a row of four slots (centres 93.5 / 248.5 / 403.5 / 558.5). Right 1/3 = step card (x 652..944) as in residents / mosaic:
 * header (VIEWS.uses.tab), four step labels, step title (VIEWS.uses.names), legend for the step, "sizes are not real sizes".
 *  0 food: four rice bowls (BD2 white, brown, black, red) fly out of the food sector one by one, each lands with a white name pill;
 *    a bracket over the row and the statement "All different varieties of rice".
 *  1 fibres and materials: cotton, silk cocoons, timber, rubber tapping (BD8) fly out of their sector with white name pills; under each
 *    a cyan chip names the organism it comes from (cotton plant, silkworm, tree, rubber tree); statement "All come from organisms".
 *  2 research: the yew branch (BD8_yew) zooms out of the research sector into a large dashed frame (two dashed callout lines from the
 *    sector); name pill; yellow "Research value"; two orange warning pills (drawn warning triangle): "Not a medicine to take
 *    yourself", "Do not pick or taste".
 *  3 genetic resources: the four bowls return (same slots as step 0); pink trait chips (drawn icon: sun / shield / snowflake / waves)
 *    fly from the genetic sector under the bowls; a pink bracket "For example (schematic)": the chips are examples, not facts about
 *    these varieties. Pink statement "Keep different varieties and wild relatives, so breeding has choices"; orange "That does not
 *    mean unlimited collection".
 * Colours (plan 1.4): genetic diversity pink #f472b6 (genetic sector, trait chips; legend names it), species cyan #55e9ff (the
 * organism a material comes from; legend names it), warning orange #fb923c. No amounts, prices or percentages.
 * Pictures (K.SIZE): environment_ai_1024/BD2_rice_*, BD8_cotton, BD8_silk_cocoons, BD8_timber, BD8_rubber_tapping, BD8_yew
 * (cut-outs; alpha>60 bbox = full picture, measured with PIL, so fit boxes are the picture boxes).
 * New labels (P(), not in K.LAB) are in T, RICE and MATS below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,YELLOW=C.yellow,PINK=K.COL.genetic,CYAN=K.COL.species,ORANGE=K.COL.pressure;
const E=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('生物提供什麼','What organisms provide'),
 short:[P('食物','Food'),P('衣料與材料','Fibres and materials'),P('研究資源','Research resources'),P('遺傳資源','Genetic resources')],
 names:[P('食物：不同品種的稻米','Food: different rice varieties'),P('衣料與材料','Fibres and materials'),P('研究與藥物資源','Research and medicinal resources'),P('遺傳資源：保留不同品種','Genetic resources: keep varieties')],
 riceVar:P('都是稻米的不同品種','All different varieties of rice'),
 fromLife:P('都來自生物','All come from organisms'),
 yew:P('紅豆杉（枝條）','Yew (a branch)'),
 research:P('研究價值','Research value'),
 notMed:P('不是自己可以食用的藥','Not a medicine to take yourself'),
 noPick:P('不採摘、不試吃','Do not pick or taste'),
 keep:P('保留不同品種與野外親緣種，育種才有選擇','Keep different varieties and wild relatives, so breeding has choices'),
 limit:P('不代表可以無限制採集','That does not mean unlimited collection'),
 example:P('例如（示意）','For example (schematic)'),
 legName:P('白框：東西的名字','White: what it is'),
 legSrc:P('青框：來自哪一種生物','Cyan: the organism it comes from'),
 legWarn:P('橘框：注意','Orange: take care'),
 legGen:P('粉紅：遺傳多樣性','Pink: genetic diversity'),
 legRes:P('黃框：研究價值','Yellow: research value')
};
// sector names: the short step labels; zh '衣料與材料' breaks after 與 (zero-width space)
const SNAME=[T.short[0],P('衣料與\u200b材料','Fibres and materials'),T.short[2],T.short[3]];
const RICE=[
 {f:E+'BD2_rice_white.png',name:P('白米','White rice'),trait:{ic:'sun',p:P('耐旱','Drought tolerant')}},
 {f:E+'BD2_rice_brown.png',name:P('糙米','Brown rice'),trait:{ic:'shield',p:P('耐病','Disease tolerant')}},
 {f:E+'BD2_rice_black.png',name:P('黑米','Black rice'),trait:{ic:'snow',p:P('耐寒','Cold tolerant')}},
 {f:E+'BD2_rice_red.png',name:P('紅米','Red rice'),trait:{ic:'waves',p:P('耐淹','Flood tolerant')}}
];
const MATS=[
 {f:E+'BD8_cotton.png',name:P('棉花','Cotton'),src:P('棉','Cotton plant')},
 {f:E+'BD8_silk_cocoons.png',name:P('蠶繭','Silk cocoons'),src:P('蠶','Silkworm')},
 {f:E+'BD8_timber.png',name:P('木材','Timber'),src:P('樹','Trees')},
 {f:E+'BD8_rubber_tapping.png',name:P('橡膠\u200b（採膠）','Rubber (tapping)'),src:P('橡膠樹','Rubber tree')}
];
const YEW=E+'BD8_yew.png';

// ── layout ────────────────────────────────────────────────────────────────
const DISK={x:160,y:160,r:140};
const RA={x:322,y:16,w:314,h:290};                 // statements, right of the disk
const SX=[0,1,2,3].map(i=>16+620*(i+.5)/4),SLOT_W=148,IMG={y:316,w:140,h:112},NAME_Y=434;
const CARD={x:652,y:16,w:292,h:550};
const YEWBOX={x:346,y:18,w:266,h:300};
const SECT=[[Math.PI,1.5*Math.PI],[1.5*Math.PI,2*Math.PI],[0,.5*Math.PI],[.5*Math.PI,Math.PI]];
const SDIR=[[-1,-1],[1,-1],[1,1],[-1,1]];

// ── helpers (as in the residents / mosaic views) ─────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、])|(?<=[:,] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
const LH=26;
// balanced: the narrowest width that keeps the same number of lines (no one-word last line)
function greedyBal(c,str,w){const n=greedy(c,str,w).length;if(n<2)return greedy(c,str,w);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1);}
function greedy(c,str,w){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,22)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
// a pill whose text may wrap (measured first, never below 22 px); icon: leaves 30 px on the left for a drawn icon
function boxGeo(c,p,maxW,icon=false){const pad=28+(icon?30:0),str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad):greedyBal(c,str,maxW-pad);
  const w=Math.max(...rows.map(r=>measure(c,r,22)))+pad,h=40+(rows.length-1)*LH;return{rows,w,h,pad};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill='rgba(11,26,21,.92)',dash=null,icon=null,t=0}={}){
  const g=boxGeo(c,p,maxW,!!icon),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:20,fill,stroke);if(dash)c.restore();
  const tx=bx+(icon?30:0)+(g.w-(icon?30:0))/2;
  g.rows.forEach((r,i)=>text(c,r,tx,y+28+i*LH,22,col,'center'));
  if(icon)drawIcon(c,icon,bx+24,y+g.h/2,stroke,t);
  return{x:bx,y,w:g.w,h:g.h};
}
// small drawn icons (no text): sun = drought, shield = disease, snow = cold, waves = flood, warn = warning triangle
function drawIcon(c,ic,x,y,col,t){c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';
  if(ic==='sun'){const sp=t*.6;circle(c,x,y,5.5,col,null);for(let i=0;i<8;i++){const a=sp+i*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*8.5,y+Math.sin(a)*8.5);c.lineTo(x+Math.cos(a)*12,y+Math.sin(a)*12);c.stroke();}}
  else if(ic==='shield'){c.beginPath();c.moveTo(x,y-12);c.lineTo(x+10,y-8);c.quadraticCurveTo(x+10,y+6,x,y+12);c.quadraticCurveTo(x-10,y+6,x-10,y-8);c.closePath();c.stroke();
    c.beginPath();c.moveTo(x-4,y);c.lineTo(x-1,y+4);c.lineTo(x+5,y-4);c.stroke();}
  else if(ic==='snow'){c.translate(x,y);c.rotate(.15*Math.sin(t*1.2));for(let i=0;i<3;i++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(-12,0);c.lineTo(12,0);c.moveTo(8,0);c.lineTo(11,-3);c.moveTo(8,0);c.lineTo(11,3);c.moveTo(-8,0);c.lineTo(-11,-3);c.moveTo(-8,0);c.lineTo(-11,3);c.stroke();}}
  else if(ic==='waves'){for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=12;i++){const xx=x-12+i*2,yy=y-7+j*7+2*Math.sin(i*.9+t*3);i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}}
  else if(ic==='warn'){c.beginPath();c.moveTo(x,y-12);c.lineTo(x+12,y+10);c.lineTo(x-12,y+10);c.closePath();c.stroke();
    c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y+3);c.stroke();circle(c,x,y+6.5,1.8,col,null);}
  c.restore();}
// picture fitted in a slot box, bottom-aligned on the slot base line
function slotPic(c,f,cx,a,dy=0,sc=1){const [W,H]=K.dim(f),k=Math.min(IMG.w/W,IMG.h/H)*sc,w=W*k,h=H*k;
  c.save();c.shadowColor='rgba(11,26,21,.75)';c.shadowBlur=10;c.shadowOffsetY=2;
  K.drawIn(c,f,{x:cx-w/2,y:IMG.y+IMG.h-h+dy,w,h},{alpha:a});c.restore();return{x:cx-w/2,y:IMG.y+IMG.h-h,w,h};}
// a sector's label point and fly-out origin
const sectPt=(j,f)=>[DISK.x+SDIR[j][0]*DISK.r*f,DISK.y+SDIR[j][1]*DISK.r*f];

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.usesSt||(s.usesSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;

  disk(c,k,st,moving,u,t,rects);
  if(moving)scene(c,st.from,99,t,1-clamp(x*1.6),null);
  scene(c,k,tau,t,1,rects);
  card(c,k,st,moving,x,u,tau,t);

  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  text(c,ai,CW-12,592,22,MUTED,'right');
  rects.push({id:'aiNote',x:CW-12-measure(c,ai,22),y:574,w:measure(c,ai,22),h:24});
}

// ── the disk: four sectors, the step's one lit and pushed out ─────────────
function disk(c,k,st,moving,u,t,rects){
  const {x:cx,y:cy,r}=DISK;
  // rim: slowly turning dashes
  c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*12;c.lineWidth=2;c.strokeStyle=rgba(WHITE,.35);c.beginPath();c.arc(cx,cy,r+8,0,Math.PI*2);c.stroke();c.restore();
  for(let j=0;j<4;j++){
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),gen=j===3;
    const push=on*(5+2.5*Math.sin(t*2.2)),[dx,dy]=[SDIR[j][0]*push*.7071,SDIR[j][1]*push*.7071];
    const [a0,a1]=SECT[j],base=gen?rgba(PINK,.16):'#16332b',lit=gen?rgba(PINK,.34):'rgba(242,236,217,.16)';
    c.save();c.translate(dx,dy);
    c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,a0+.025,a1-.025);c.closePath();
    c.fillStyle=base;c.fill();
    if(on>0){c.save();c.globalAlpha*=on;c.fillStyle=lit;c.fill();c.restore();}
    c.lineWidth=2.5;c.strokeStyle=on>.5?(gen?PINK:WHITE):rgba(gen?PINK:MUTED,.55);c.stroke();
    // name: lines measured first, centred in the sector
    const p=SNAME[j],str=D.tr(p),zh=/[一-鿿]/.test(str),rows=zh?blines(c,p,100):greedy(c,str,104);
    const [lx,ly]=[cx+SDIR[j][0]*58,cy+SDIR[j][1]*(SDIR[j][1]>0?50:56)],h0=(rows.length-1)*LH;
    const col=gen?(on>.5?PINK:rgba(PINK,.75)):(on>.5?WHITE:MUTED);
    rows.forEach((q,i)=>text(c,q,lx,ly-h0/2+8+i*LH,22,col,'center'));
    if(rects){const w=Math.max(...rows.map(q=>measure(c,q,22)));rects.push({id:'sector'+j,x:lx-w/2+dx,y:ly-h0/2-12+dy,w,h:h0+24,disk:true});}
    c.restore();
  }
  circle(c,cx,cy,16,'#11261f',rgba(WHITE,.5),2);
}

// ── one step's stage. a = whole-scene alpha; rects = collect label rects (null: do not) ──
function scene(c,k,tau,t,a,rects){
  if(a<=0.002)return;
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  withA(c,a,()=>{
    if(k===0)food(c,tau,t,rects,at);
    else if(k===1)materials(c,tau,t,rects,at);
    else if(k===2)research(c,tau,t,rects,at);
    else genetic(c,tau,t,rects,at);
  });
}
// an item flying out of sector j to slot i; returns landed alpha (0..1)
function flyItem(c,f,j,i,tau,t,at,d,{dur=.8}={}){
  const f0=at(d,dur);if(f0<=0)return 0;const e=ease(f0);
  const [ox,oy]=sectPt(j,.45),tx=SX[i],ty=IMG.y+IMG.h/2,mx=(ox+tx)/2,my=Math.min(oy,ty)-40;
  const pos=K.bez([ox,oy],[mx,my],[tx,ty],e),bob=f0>=1?2*Math.sin(t*1.6+i*1.3):0;
  c.save();c.translate(pos[0]-tx,pos[1]-ty+bob);
  const sc=.25+.75*e;c.translate(tx,ty);c.scale(sc,sc);c.translate(-tx,-ty);
  slotPic(c,f,tx,clamp(f0*2));c.restore();
  return at(d+dur*.85,.4);
}
function namePill(c,p,i,a,rects,id){let q=null;withA(c,a,()=>{const g=boxGeo(c,p,SLOT_W);q=box(c,p,SX[i],NAME_Y,{maxW:SLOT_W,al:'center'});});
  if(!q){const g=boxGeo(c,p,SLOT_W);q={x:SX[i]-g.w/2,y:NAME_Y,w:g.w,h:g.h};}
  if(rects&&a>=1)rects.push({id,...q});return q;}
// bracket over the row with a stem up to a statement box
function bracket(c,a,y,col,t){withA(c,a,()=>{c.save();c.lineWidth=2.5;c.strokeStyle=rgba(col,.85);c.lineCap='round';
  c.beginPath();c.moveTo(26,y+8);c.lineTo(26,y);c.lineTo(626,y);c.lineTo(626,y+8);c.stroke();c.restore();});}

function food(c,tau,t,rects,at){
  RICE.forEach((r,i)=>{const na=flyItem(c,r.f,0,i,tau,t,at,.5+i*.8);namePill(c,r.name,i,na,rects,'rice'+i);});
  const ba=at(4.2,.5);bracket(c,ba,IMG.y-6,WHITE,t);
  const sa=at(4.4,.6);
  withA(c,sa,()=>{const g=boxGeo(c,T.riceVar,RA.w);const q=box(c,T.riceVar,RA.x+RA.w/2,RA.y+RA.h/2-g.h/2,{maxW:RA.w,al:'center'});
    K.dashed(c,[[q.x+q.w/2,q.y+q.h],[q.x+q.w/2,IMG.y-6]],rgba(WHITE,.7),2.5,[6,6],-t*10);
    if(rects&&sa>=1)rects.push({id:'riceVar',...q});if(tau<99&&tau>4.4)ring(c,q,t,WHITE);});
}
function materials(c,tau,t,rects,at){
  MATS.forEach((m,i)=>{const na=flyItem(c,m.f,1,i,tau,t,at,.5+i*.8);const q=namePill(c,m.name,i,na,rects,'mat'+i);
    const sa=at(4.2+i*.4,.5);
    withA(c,sa,()=>{const r=box(c,m.src,SX[i],q.y+q.h+8,{maxW:SLOT_W,al:'center',stroke:CYAN});if(rects&&sa>=1)rects.push({id:'src'+i,...r});
      if(tau<99&&tau>4.2+i*.4&&tau<8.6)ring(c,r,t+i*.3,CYAN);});});
  const sa=at(6.2,.6);
  withA(c,sa,()=>{const g=boxGeo(c,T.fromLife,RA.w);const q=box(c,T.fromLife,RA.x+RA.w/2,RA.y+RA.h/2-g.h/2,{maxW:RA.w,al:'center'});
    if(rects&&sa>=1)rects.push({id:'fromLife',...q});if(tau<99&&tau>6.2)ring(c,q,t,WHITE);});
}
function research(c,tau,t,rects,at){
  // zoom out of the research sector into the dashed frame
  const z=ease(at(.4,1.2)),[ox,oy]=sectPt(2,.5),B=YEWBOX;
  const [W,H]=K.dim(YEW),kf=Math.min(B.w/W,B.h/H),fw=W*kf,fh=H*kf;
  const sc=mix(.15,1,z),cx=mix(ox,B.x+B.w/2,z),cy=mix(oy,B.y+B.h/2,z),sw=Math.sin(t*1.1)*.012;
  const fa=at(1.2,.5);
  withA(c,fa,()=>{
    const [rx,ry]=sectPt(2,.72);
    K.dashed(c,[[rx,ry],[B.x,B.y]],rgba(WHITE,.55),2,[6,6],-t*10);K.dashed(c,[[rx,ry],[B.x,B.y+B.h]],rgba(WHITE,.55),2,[6,6],-t*10);
    c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;D.round(c,B.x-6,B.y-4,B.w+12,B.h+8,12,'rgba(11,26,21,.35)',rgba(WHITE,.7));c.restore();});
  if(z>0){c.save();c.translate(cx,cy);c.rotate(sw);c.scale(sc,sc);c.shadowColor='rgba(11,26,21,.75)';c.shadowBlur=10;
    K.drawIn(c,YEW,{x:-fw/2,y:-fh/2,w:fw,h:fh},{alpha:clamp(z*3)});c.restore();}
  const na=at(1.8,.5);
  withA(c,na,()=>{const q=box(c,T.yew,B.x+B.w/2,B.y+B.h+12,{maxW:B.w+20,al:'center'});if(rects&&na>=1)rects.push({id:'yew',...q});});
  const ra=at(2.6,.5);
  withA(c,ra,()=>{const q=box(c,T.research,30,350,{stroke:YELLOW,col:YELLOW});if(rects&&ra>=1)rects.push({id:'research',...q});});
  [[T.notMed,4],[T.noPick,5]].forEach(([p,d],i)=>{const wa=at(d,.5);
    withA(c,wa,()=>{const q=box(c,p,30,414+i*60,{maxW:SX[3]+60-30,stroke:ORANGE,col:ORANGE,icon:'warn',t,fill:'rgba(11,26,21,.95)'});
      if(rects&&wa>=1)rects.push({id:'warn'+i,...q});if(tau<99&&tau>d)ring(c,q,t+i*.35,ORANGE);});});
}
function genetic(c,tau,t,rects,at){
  RICE.forEach((r,i)=>{const na=flyItem(c,r.f,0,i,tau,t,at,.3+i*.35,{dur:.6});const q=namePill(c,r.name,i,na,rects,'rice'+i);
    // trait chip flies from the genetic sector
    const d=2.4+i*.5,f0=at(d,.7);if(f0<=0)return;const e=ease(f0);
    const g=boxGeo(c,r.trait.p,SLOT_W,true),ty=q.y+q.h+8,[ox,oy]=sectPt(3,.5);
    const x0=mix(ox,SX[i],e),y0=mix(oy,ty+g.h/2,e)-Math.sin(e*Math.PI)*50;
    withA(c,clamp(f0*2),()=>{c.save();c.translate(x0-SX[i],y0-(ty+g.h/2));
      const b=box(c,r.trait.p,SX[i],ty,{maxW:SLOT_W,al:'center',stroke:PINK,col:PINK,icon:r.trait.ic,t,dash:[7,5]});c.restore();
      if(rects&&f0>=1)rects.push({id:'trait'+i,...b});});
  });
  // "for example" under the chips
  const ea=at(4.6,.5);
  withA(c,ea,()=>{const y=562;c.save();c.lineWidth=2.5;c.strokeStyle=rgba(PINK,.85);c.lineCap='round';c.beginPath();
      c.moveTo(26,y-8);c.lineTo(26,y);c.lineTo(626,y);c.lineTo(626,y-8);c.stroke();c.restore();
    const w=measure(c,T.example,22)+20;D.round(c,326-w/2,y-12,w,24,8,'#11261f',null);
    text(c,T.example,326,y+8,22,PINK,'center');if(rects&&ea>=1)rects.push({id:'example',x:326-w/2+10,y:y-12,w:w-20,h:24});});
  const ka=at(5.2,.6),la=at(6.4,.6);
  let yy=RA.y+24;
  withA(c,ka,()=>{const q=box(c,T.keep,RA.x+RA.w/2,yy,{maxW:RA.w+12,al:'center',stroke:PINK});if(rects&&ka>=1)rects.push({id:'keep',...q});
    if(tau<99&&tau>5.2&&tau<6.4)ring(c,q,t,PINK);});
  yy+=boxGeo(c,T.keep,RA.w+12).h+18;
  withA(c,la,()=>{const q=box(c,T.limit,RA.x+RA.w/2,yy,{maxW:RA.w,al:'center',stroke:ORANGE,col:ORANGE,icon:'warn',t});if(rects&&la>=1)rects.push({id:'limit',...q});
    if(tau<99&&tau>6.4)ring(c,q,t,ORANGE);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){const L0=k<2?[['name',T.legName,WHITE]]:[];
  if(k===1)L0.push(['src',T.legSrc,CYAN]);
  if(k===2)L0.push(['res',T.legRes,YELLOW],['warn',T.legWarn,ORANGE]);
  if(k===3)L0.push(['gen',T.legGen,PINK],['warn',T.legWarn,ORANGE]);
  return L0;}
function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+14,{maxW:iw,stroke:WHITE,col:WHITE});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20,col=j===3?PINK:WHITE;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,40,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,col));
    text(c,p,ix+42,cy+8,22,on>.5?col:MUTED);
    y+=42;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  const sz=L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),szh=blines(c,sz,iw).length*28;
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-szh-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p,col],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    D.round(c,ix,yy+4,40,26,13,'rgba(11,26,21,.92)',rgba(col,.7+.3*pul));
    bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);yy+=lhs[q];}));
  yy=ly+lhs.reduce((a,b)=>a+b,0);
  bwrap(c,sz,ix,yy+30,iw,22,MUTED,28);
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.uses=draw;
window.EnvironmentDraw.uses.dbg=s_dbg;
})();
